// Per-option evaluation: time-to-power (§9.8), economics ledger (§9.5), carbon and water (§9.6),
// resilience check (§9.7), flags (§15) and deliverability (§9.9).

import { TECH, FUEL, PPA, COOLING, COUNTRIES, choiceLabel } from './defaults.js';
import { decarbFactor } from './context.js';
import { fuelPrice, fuelEF } from './dispatch.js';
import { bridgeActive, programmeMonths, techAvailMonth } from './sizing.js';
import { NA } from './generator.js';
import { adequacyOf, adequacyText } from './adequacy.js';

const PERMIT_NOTE = 'Screening flag, not a permitting determination.';
const PROXY_NOTE = 'EU threshold used as a proxy; national equivalent not checked by this tool.';

export function flag(id, severity, category, message, extra = {}) {
  return { id, severity, category, message, ...extra };
}

// ---------------------------------------------------------------------------
// Time-to-power (§9.8)
// ---------------------------------------------------------------------------
export function timeToPower(ctx, v, sz) {
  const n = ctx.nMonthsTimeline;
  const supply = new Float64Array(n);
  for (let m = 0; m < n; m++) {
    let s = v.C1 === 'islanded' ? 0 : ctx.gridCap[m];
    s += sz.firmByMonth[m];
    // Bridging battery counts from its supply-available month (BRIEF §9.8), like every other source; the same
    // month sizing records (sz.bridgeBess.availMonth) and dispatch uses (port of e1161ce).
    if (v.C2 === 'bessSolar' && bridgeActive(v, m, sz.T) && m >= sz.bridgeBess.availMonth) s += sz.bridgeBess.mw;
    supply[m] = s;
  }
  const ph1 = ctx.phases[0];
  const cp = ctx.cooling[sz.coolingId];
  const ph1Initial = ph1 ? ph1.it * ctx.inputs.load.rampStart * sz.peakPUE + ctx.inputs.load.ancillaryFrac * ph1.it * ctx.inputs.load.rampStart : 0;
  let firstPowerM = null;
  let fullLoadM = null;
  for (let m = 0; m < n; m++) {
    if (firstPowerM === null && supply[m] >= ph1Initial - 1e-9 && supply[m] > 0) firstPowerM = m;
    if (fullLoadM === null && supply[m] >= sz.designMW - 1e-9) fullLoadM = m;
  }
  let gapMWm = 0;
  let gapMonths = 0;
  for (let m = 0; m < n; m++) {
    const g = sz.designByMonth[m] - supply[m];
    if (g > 1e-9) { gapMWm += g; gapMonths++; }
  }
  const reachedFull = fullLoadM !== null;
  const monthsToFull = reachedFull ? fullLoadM : n;
  const metric = monthsToFull + (0.5 * gapMWm) / Math.max(1e-9, sz.designMW);
  const firstTarget = ctx.firstPhaseM;
  const fullTarget = ctx.lastPhaseM;
  const delayFirst = firstPowerM === null ? n - firstTarget : Math.max(0, firstPowerM - firstTarget);
  const delayFull = Math.max(0, monthsToFull - fullTarget);
  void cp;
  return { firstPowerM, fullLoadM, reachedFull, monthsToFull, gapMWm, gapMonths, metric, delayFirst, delayFull, supplyByMonth: supply };
}

// ---------------------------------------------------------------------------
// Economics ledger (§9.5) — single source of truth for LCOE, NPV, capex/opex split.
// Real terms, price base year = analysis start year. Capex at start of year y, opex at end.
// ---------------------------------------------------------------------------
function yearOfMonth(m) { return Math.max(0, Math.floor(m / 12)); }

export function economics(ctx, v, sz, disp, ttp) {
  const inputs = ctx.inputs;
  const E = inputs.economics;
  const N = E.periodYears;
  const r = E.wacc;
  const cont = E.contingency;
  const capexLines = []; // { item, year, amount }
  const ledger = [];
  for (let y = 0; y <= N; y++) ledger.push({ year: y, capex: 0, contingency: 0, replacement: 0, residual: 0, fom: 0, vom: 0, fuel: 0, grid: 0, ppa: 0, carbon: 0, rental: 0, testRun: 0, revenue: 0, deliveredMWh: 0, scope1T: 0, scope2LocT: 0, scope2MktT: 0, cfeMWh: 0, netDemandMWh: 0, unmetMWh: 0 });

  const assets = []; // for replacement and residual value
  const addCapex = (item, year, amount, life, opts = {}) => {
    if (!(amount > 0) || year > N - 1) return;
    capexLines.push({ item, year, amount });
    ledger[year].capex += amount;
    ledger[year].contingency += amount * cont;
    if (life) assets.push({ item, year, amount, life, removeYear: opts.removeYear ?? null, replaceFraction: opts.replaceFraction ?? 1 });
  };

  // Phase shares for per-phase plant (C19 = per phase)
  const phaseShares = ctx.phases.map((p) => ({ year: yearOfMonth(p.m), share: p.it / Math.max(1e-9, sz.itMW) }));
  const perPhase = v.C19 !== 'phase1';
  const bookPhased = (item, total, life) => {
    if (perPhase) for (const ps of phaseShares) addCapex(item, ps.year, total * ps.share, life);
    else addCapex(item, phaseShares.length ? phaseShares[0].year : 0, total, life);
  };

  // Grid connection and substation (offered capacity at full connection; same for every option)
  const sp = TECH.substation.p;
  const band = sz.grid.band;
  const fullMW = inputs.grid.fullMW;
  let firstGridM = 0;
  while (firstGridM < ctx.gridCap.length && ctx.gridCap[firstGridM] <= 0) firstGridM++;
  const gridYear = fullMW > 0 ? yearOfMonth(Math.min(firstGridM, ctx.fullGridM)) : 0;
  if (fullMW > 0) {
    // Cable route from the POC (§5.4): route length from the site model (sizing.js, sz.grid.cableKm).
    addCapex('Grid connection and reinforcement', gridYear, fullMW * sp[`connCapexPerMW_${band}`] + sp.cablePerKm * (sz.grid.cableKm || 0), 40);
    addCapex(`Substation (${band.toUpperCase()}, ${v.C17})`, gridYear, fullMW * sp[`subCapexPerMW_${band}`] * (v.C17 === 'GIS' ? sp.gisMultiplier : 1), 40);
  }
  // Renewables
  const avail = (id) => yearOfMonth(programmeMonths(TECH[id]));
  addCapex('Solar PV rooftop', avail('solarRoof'), sz.solarRoofMWp * 1000 * TECH.solarRoof.p.capexPerKW, TECH.solarRoof.p.life);
  addCapex('Solar PV ground-mount', avail('solarGround'), sz.solarGroundMWp * 1000 * TECH.solarGround.p.capexPerKW, TECH.solarGround.p.life);
  addCapex('Wind onshore', avail('wind'), sz.windMW * 1000 * TECH.wind.p.capexPerKW, TECH.wind.p.life);
  // BESS (C12 + bridging BESS): booked in the year the battery can first supply, the month time-to-power and
  // dispatch use (sizing.js techAvailMonth, §9.8), as every other plant is booked at its availability. Before the
  // port a bridging battery was booked in year 0 because it was counted from month 0. (The BESS-augmented UPS
  // battery is backup plant, booked per phase below.)
  const bp = TECH.bess.p;
  const bessCapex = (mw, mwh) => mwh * 1000 * bp.capexPerKWh + mw * 1000 * bp.capexPerKW;
  const bessYear = yearOfMonth(techAvailMonth(ctx, TECH.bess));
  addCapex('BESS', bessYear, bessCapex(sz.storage.mw, sz.storage.mwh), bp.life);
  // Firm prime
  if (sz.prime) {
    const t = TECH[sz.prime.tech];
    addCapex(`${t.name} (prime)`, yearOfMonth(sz.prime.availMonth), sz.prime.mw * 1000 * t.p.capexPerKW, t.p.life);
    if (t.p.stackLife) assets.push({ item: `${t.name} stack replacement`, year: yearOfMonth(sz.prime.availMonth), amount: sz.prime.mw * 1000 * t.p.capexPerKW * t.p.stackFraction, life: t.p.stackLife, stackOnly: true });
  }
  // Bridging plant
  const T = sz.T;
  const bridgeRemoveYear = v.C1 === 'bridge' && v.C3 === 'remove' ? yearOfMonth(T) : null;
  if (sz.bridge && sz.bridge.tech !== 'rented') {
    const t = TECH[sz.bridge.tech];
    addCapex(`${t.name} (bridging)`, yearOfMonth(sz.bridge.availMonth), sz.bridge.mw * 1000 * t.p.capexPerKW, t.p.life, { removeYear: bridgeRemoveYear });
    if (t.p.stackLife && bridgeRemoveYear === null) assets.push({ item: `${t.name} stack replacement`, year: yearOfMonth(sz.bridge.availMonth), amount: sz.bridge.mw * 1000 * t.p.capexPerKW * t.p.stackFraction, life: t.p.stackLife, stackOnly: true });
  }
  // Gas connection pipe from the gas main (§5.2), for options that burn gas on site and only when a gas main
  // location is given (sizing.js): booked when the first gas plant is available (gas gensets only: phase 1).
  if (sz.gasConnection && sz.gasConnection.km > 0) {
    const gasMonths = [sz.prime, sz.bridge].filter((p) => p && TECH[p.tech].fuel === 'gas').map((p) => p.availMonth);
    const gasYear = gasMonths.length ? yearOfMonth(Math.min(...gasMonths)) : (phaseShares.length ? phaseShares[0].year : 0);
    addCapex('Gas connection pipe', gasYear, sz.gasConnection.km * sz.gasConnection.perKm, 40);
  }
  // Backup gensets, BESS-augmented UPS BESS, fuel storage (per phase)
  if (sz.backup.tech) {
    const t = TECH[sz.backup.tech];
    bookPhased(`${choiceLabel('C5', v.C5)} (${v.C6})`, sz.backup.mw * 1000 * t.p.capexPerKW, t.p.life);
    if (sz.backup.bessMW > 0) bookPhased('BESS for UPS augmentation', bessCapex(sz.backup.bessMW, sz.backup.bessMWh), bp.life);
  }
  if (sz.backup.fuelM3 > 0) bookPhased('Bulk fuel storage', sz.backup.fuelM3 * TECH.fuelStorage.p.capexPerM3, 30);
  // Cooling capex delta vs air baseline (may be negative: booked as a negative line)
  const coolDelta = sz.itMW * 1000 * COOLING[sz.coolingId].p.capexDeltaPerKW;
  if (coolDelta !== 0) {
    for (const ps of (perPhase ? phaseShares : [{ year: phaseShares[0] ? phaseShares[0].year : 0, share: 1 }])) {
      if (ps.year > N - 1) continue;
      const amt = coolDelta * ps.share;
      capexLines.push({ item: 'Cooling capex delta vs air', year: ps.year, amount: amt });
      ledger[ps.year].capex += amt;
      ledger[ps.year].contingency += amt * cont;
    }
  }
  // Heat reuse not costed in this slice (C15 locked None by default)

  // Replacements and residual value
  for (const a of assets) {
    const endYear = a.removeYear !== null && a.removeYear !== undefined ? a.removeYear : N;
    let last = a.year;
    if (!a.stackOnly) {
      for (let y = a.year + a.life; y < endYear; y += a.life) {
        ledger[y].replacement += a.amount * (1 + cont);
        last = y;
      }
    } else {
      for (let y = a.year + a.life; y < endYear; y += a.life) ledger[y].replacement += a.amount;
      continue;
    }
    const remainingFrac = Math.max(0, 1 - (endYear - last) / a.life);
    if (a.removeYear !== null && a.removeYear !== undefined && a.removeYear <= N) {
      ledger[a.removeYear].residual -= a.amount * (1 + cont) * remainingFrac * E.salvageFraction;
    } else {
      ledger[N].residual -= a.amount * (1 + cont) * remainingFrac;
    }
  }

  // Fixed O&M
  const itShareYear = (y) => {
    const mid = y * 12 + 6;
    return Math.min(1, (ctx.itInst[Math.min(mid, ctx.itInst.length - 1)] || 0) / Math.max(1e-9, sz.itMW));
  };
  for (let y = 0; y < N; y++) {
    const L = ledger[y];
    if (y >= avail('solarRoof')) L.fom += sz.solarRoofMWp * 1000 * TECH.solarRoof.p.fomPerKW;
    if (y >= avail('solarGround')) L.fom += sz.solarGroundMWp * 1000 * TECH.solarGround.p.fomPerKW;
    if (y >= avail('wind')) L.fom += sz.windMW * 1000 * TECH.wind.p.fomPerKW;
    if (y >= bessYear) L.fom += bessCapex(sz.storage.mw, sz.storage.mwh) * bp.fomPct;
    if (sz.prime && y >= yearOfMonth(sz.prime.availMonth)) L.fom += sz.prime.mw * 1000 * TECH[sz.prime.tech].p.fomPerKW;
    if (sz.bridge && sz.bridge.tech !== 'rented' && y >= yearOfMonth(sz.bridge.availMonth) && (bridgeRemoveYear === null || y < bridgeRemoveYear)) L.fom += sz.bridge.mw * 1000 * TECH[sz.bridge.tech].p.fomPerKW;
    if (sz.backup.tech) {
      L.fom += itShareYear(y) * sz.backup.mw * 1000 * TECH[sz.backup.tech].p.fomPerKW;
      if (sz.backup.bessMW > 0) L.fom += itShareYear(y) * bessCapex(sz.backup.bessMW, sz.backup.bessMWh) * bp.fomPct;
    }
    // Rented bridging: rental for each month it is on site (from availability while active or retained)
    if (sz.bridge && sz.bridge.tech === 'rented') {
      let months = 0;
      for (let m = y * 12; m < y * 12 + 12; m++) {
        if (m < sz.bridge.availMonth) continue;
        const onSite = v.C1 === 'islanded' || m < T || v.C3 !== 'remove';
        if (onSite) months++;
      }
      L.rental += months * sz.bridge.mw * 1000 * TECH.rented.p.rentalPerKWMonth;
    }
  }

  // Energy, fuel, carbon by year (explicit dispatch years, then the last year repeats)
  const nExp = disp.years.length;
  const country = ctx.country;
  const ppaPrice = sz.ppa ? PPA.strike[sz.ppa.type] + PPA.shapingAdder : 0;
  // PPA settlement (owner decision 2026-10-18: no PPA income without physical delivery). The ledger books the PPA
  // price (strike + shaping) only on PPA energy physically delivered over the grid connection to the load. The
  // settlement on contracted volume that is not delivered (its wholesale value less the PPA price, + = net income)
  // is the "PPA hedge (not counted)": reported here, never added to the ledger, so it is outside LCOE, NPV, the
  // capex/opex split and the score. Before the decision the ledger booked the PPA price on the whole contract and
  // netted the undelivered volume at the hourly grid price (incl. the non-commodity adder) as income.
  const hedge = sz.ppa ? { byYear: [], total: 0, pv: 0, contractMWh: 0, deliveredMWh: 0, undeliveredMWh: 0, limitedMWh: 0, price: ppaPrice } : null;
  const testRun = sz.backup.tech ? (() => {
    const t = TECH[sz.backup.tech];
    const units = v.C5 === 'bessUps' ? sz.backup.nUnits : sz.backup.units;
    const mwhE = units * t.p.unitMW * inputs.requirements.testRunHours * inputs.requirements.testRunLoad;
    return { mwhE, fuelMWhTh: mwhE / t.p.eff, fuel: t.fuel };
  })() : null;
  for (let y = 0; y < N; y++) {
    const d = disp.years[Math.min(y, nExp - 1)];
    const L = ledger[y];
    const calYear = ctx.baseYear + y;
    const df = decarbFactor(country, calYear, ctx.baseYear);
    const elecEsc = Math.pow(1 + E.elecEscalation, y);
    const gasEsc = Math.pow(1 + E.gasEscalation, y);
    const cEsc = Math.pow(1 + E.carbonEscalation, y);
    const cPrice = ctx.carbonPrice * cEsc;
    let scope1 = 0;
    for (const pr of d.plants) {
      const t = TECH[pr.tech];
      L.vom += pr.mwh * (t.p.vomPerMWh || 0);
      if (pr.tech === 'smr') L.fuel += pr.mwh * t.p.fuelPerMWhE;
      else L.fuel += pr.fuelMWhTh * fuelPrice(ctx, t.fuel) * (t.fuel === 'gas' ? gasEsc : 1);
      scope1 += pr.fuelMWhTh * fuelEF(t.fuel);
    }
    if (testRun && itShareYear(y) > 0) {
      const sh = itShareYear(y);
      L.testRun += sh * testRun.fuelMWhTh * fuelPrice(ctx, testRun.fuel);
      scope1 += sh * testRun.fuelMWhTh * fuelEF(testRun.fuel);
    }
    L.grid += d.gridCost * elecEsc + d.ppaNetworkCost; // network/non-commodity adder also applies to PPA energy over the grid
    if (sz.ppa) {
      L.ppa += d.ppaDeliveredMWh * ppaPrice;
      const hv = d.ppaUndeliveredSpotValue * elecEsc - d.ppaUndeliveredMWh * ppaPrice;
      hedge.byYear.push(hv);
      hedge.total += hv;
      hedge.pv += hv * Math.pow(1 + r, -(y + 1)); // discounted as opex (end of year)
      hedge.contractMWh += d.ppaContractMWh;
      hedge.deliveredMWh += d.ppaDeliveredMWh;
      hedge.undeliveredMWh += d.ppaUndeliveredMWh;
      hedge.limitedMWh += d.ppaLimitedMWh;
    }
    L.carbon += scope1 * cPrice;
    L.revenue += d.exportRevenue * elecEsc;
    L.deliveredMWh += d.grossDemandMWh - d.unmetMWh;
    L.netDemandMWh += d.netDemandMWh;
    L.unmetMWh += d.unmetMWh;
    L.scope1T += scope1;
    const s2loc = (d.gridCarbonT + d.ppaCarbonT) * df;
    L.scope2LocT += s2loc;
    const imported = d.gridMWh + d.ppaDeliveredMWh;
    L.scope2MktT += imported > 0 ? s2loc * Math.max(0, 1 - d.ppaContractMWh / imported) : 0;
    L.cfeMWh += d.cfeMWh;
  }

  // Totals and discounting
  let pvCost = 0, pvEnergy = 0, pvCapex = 0, pvOpex = 0, capexTotal = 0, contTotal = 0;
  for (let y = 0; y <= N; y++) {
    const L = ledger[y];
    L.capexTotal = L.capex + L.contingency + L.replacement + L.residual;
    L.opex = L.fom + L.vom + L.fuel + L.grid + L.ppa + L.carbon + L.rental + L.testRun - L.revenue;
    const dfC = Math.pow(1 + r, -y);
    const dfO = Math.pow(1 + r, -(y + 1));
    L.pvCapex = L.capexTotal * dfC;
    L.pvOpex = L.opex * dfO;
    pvCapex += L.pvCapex;
    pvOpex += L.pvOpex;
    pvEnergy += L.deliveredMWh * dfO;
    capexTotal += L.capex;
    contTotal += L.contingency;
  }
  pvCost = pvCapex + pvOpex;
  const lcoe = pvEnergy > 0 ? pvCost / pvEnergy : Infinity;
  const ssY = Math.min(N - 1, nExp - 1);
  const year1 = ledger[0];
  const ss = ledger[Math.max(0, ssY)];
  const capexInitial = capexTotal + contTotal;
  return {
    ledger, capexLines,
    npvCost: pvCost, pvCapex, pvOpex, lcoe,
    capex: capexInitial, capexExContingency: capexTotal, contingency: contTotal,
    capexLow: capexInitial * (1 + E.capexLow), capexHigh: capexInitial * (1 + E.capexHigh),
    capexPerMWIT: capexInitial / Math.max(1e-9, sz.itMW),
    opexYear1: year1.opex, opexSteady: ss.opex,
    capexShare: pvCost !== 0 ? pvCapex / pvCost : 0,
    reconciliation: { lcoeTimesEnergy: lcoe * pvEnergy, npv: pvCost, pvEnergy },
    ppaHedge: hedge, // outside the ledger (see above); null without a PPA
  };
}

// ---------------------------------------------------------------------------
// Carbon and water (§9.6)
// ---------------------------------------------------------------------------
export function carbon(ctx, sz, eco, disp) {
  const L = eco.ledger;
  let s1 = 0, s2l = 0, s2m = 0, del = 0, cfe = 0, net = 0;
  for (let y = 0; y < ctx.inputs.economics.periodYears; y++) {
    s1 += L[y].scope1T; s2l += L[y].scope2LocT; s2m += L[y].scope2MktT; del += L[y].deliveredMWh; cfe += L[y].cfeMWh; net += L[y].netDemandMWh;
  }
  const loc = del > 0 ? ((s1 + s2l) / del) * 1000 : 0; // t/MWh -> g/kWh
  const mkt = del > 0 ? ((s1 + s2m) / del) * 1000 : 0;
  const cfePct = net > 0 ? cfe / net : 0;
  // Water (WUE) on steady-state year IT energy
  const cool = COOLING[sz.coolingId].p;
  const cp = ctx.cooling[sz.coolingId];
  const ssd = disp.years[disp.years.length - 1];
  const adFrac = cp.adiabaticHours / 8760;
  const wue = cool.wueBase + (cool.wueEvap ? cool.wueEvap * adFrac : 0);
  const waterM3 = (wue * ssd.itMWh * 1000) / 1000;
  return {
    locationG: loc, marketG: mkt, cfePct, scope1T: s1, scope2LocT: s2l, scope2MktT: s2m,
    scope1Annual: s1 / ctx.inputs.economics.periodYears, scope2LocAnnual: s2l / ctx.inputs.economics.periodYears,
    trajectory: L.slice(0, ctx.inputs.economics.periodYears).map((x) => x.scope1T + x.scope2LocT),
    wue, waterM3,
  };
}

// ---------------------------------------------------------------------------
// Resilience check (§9.7): requirement, not score.
// ---------------------------------------------------------------------------
const TOPO_RANK = { N: 0, 'N+1': 1, catcher: 1, '2N': 2 };
export function resilience(ctx, v, sz) {
  const req = ctx.inputs.requirements;
  const items = [];
  const flags = [];
  const crit = sz.criticalMW;
  let firmMW = 0;
  const parts = [];
  let gasDependent = false;
  const bs = ctx.inputs.requirements.blockSize;
  // Backup gensets at topology after removing redundant units
  if (sz.backup.tech) {
    const t = TECH[sz.backup.tech];
    const nCap = sz.backup.nUnits * t.p.unitMW;
    firmMW += nCap;
    parts.push(`${sz.backup.nUnits} × ${t.p.unitMW} MW ${choiceLabel('C5', v.C5)} = ${nCap.toFixed(1)} MW (redundant units removed)`);
    if (t.fuel === 'gas') gasDependent = true;
  }
  // Retained bridging plant (on site after grid arrives)
  const bridgeRetained = sz.bridge && (v.C1 === 'islanded' || (v.C1 === 'bridge' && v.C3 !== 'remove'));
  if (bridgeRetained && sz.bridge.fuelMonth !== Infinity) {
    const cap = sz.bridge.nUnits * sz.bridge.unitMW;
    firmMW += cap;
    parts.push(`retained bridging ${TECH[sz.bridge.tech].name} ${cap.toFixed(1)} MW (redundant units removed)`);
    if (TECH[sz.bridge.tech].fuel === 'gas') gasDependent = true;
  }
  // Firm prime
  if (sz.prime && sz.prime.fuelMonth !== Infinity) {
    const n = TOPO_RANK[req.topology] >= 1 ? Math.max(0, sz.prime.units - Math.ceil(sz.prime.units / bs)) : sz.prime.units;
    const cap = n * sz.prime.unitMW;
    firmMW += cap;
    parts.push(`firm prime ${TECH[sz.prime.tech].name} ${cap.toFixed(1)} MW (redundant units removed)`);
    if (TECH[sz.prime.tech].fuel === 'gas') gasDependent = true;
  }
  // BESS energy for its duration (counted only against ride-through, see autonomy)
  const bessMW = sz.storage.mw + sz.backup.bessMW;
  if (bessMW > 0) {
    parts.push(`BESS ${bessMW.toFixed(1)} MW for ${(((sz.storage.mwh + sz.backup.bessMWh) / bessMW) || 0).toFixed(1)} h`);
    firmMW += bessMW;
  }

  const backedOK = firmMW + 1e-9 >= crit;
  items.push({ item: 'Backed load', ok: backedOK, text: `${parts.join(' + ') || 'no on-site firm capacity'} → ${firmMW.toFixed(1)} MW firm vs ${crit.toFixed(1)} MW critical load` });
  if (!backedOK) flags.push(flag('res-backed', 'major', 'Resilience', `Requirement not met: backed load ${firmMW.toFixed(1)} MW < ${crit.toFixed(1)} MW critical load`));

  // Topology
  let topoOK = true;
  if (v.C5 !== 'none' && v.C5 !== 'retained' && v.C6 !== NA) {
    topoOK = TOPO_RANK[v.C6] >= TOPO_RANK[req.topology];
    items.push({ item: 'Topology', ok: topoOK, text: `${v.C6} vs ${req.topology} required` });
    if (!topoOK) flags.push(flag('res-topology', 'major', 'Resilience', `Requirement not met: backup topology ${v.C6} < ${req.topology} required`));
  } else if (v.C5 === 'retained') {
    items.push({ item: 'Topology', ok: true, text: 'Retained bridging plant sized N+1 per block of ' + bs });
  }

  // Autonomy
  // Autonomy: fuel-based firm capacity (excluding BESS) that alone covers the critical load sets autonomy;
  // otherwise stored BESS energy at critical load.
  const fuelFirm = firmMW - bessMW;
  let autonomyH;
  if (fuelFirm + 1e-9 >= crit && sz.backup.tech && TECH[sz.backup.tech].fuel !== 'gas') autonomyH = sz.backup.autonomyH;
  else if (fuelFirm + 1e-9 >= crit && v.C5 === 'retained' && bridgeRetained && TECH[sz.bridge.tech].fuel === 'diesel') autonomyH = sz.backup.autonomyH;
  else if (fuelFirm + 1e-9 >= crit && gasDependent) autonomyH = Infinity;
  else autonomyH = bessMW > 0 && crit > 0 ? (sz.storage.mwh + sz.backup.bessMWh) / crit : 0;
  const autOK = autonomyH + 1e-9 >= req.autonomyH;
  items.push({ item: 'Autonomy', ok: autOK, text: autonomyH === Infinity ? `gas network (unlimited if the network stays available) vs ${req.autonomyH} h required` : `${autonomyH.toFixed(0)} h vs ${req.autonomyH} h required` });
  if (!autOK) flags.push(flag('res-autonomy', 'major', 'Resilience', `Requirement not met: autonomy ${autonomyH.toFixed(0)} h < ${req.autonomyH} h required`));

  // Islanding
  if (req.islanding === 'Yes') {
    let onsite = 0;
    if (sz.prime && sz.prime.fuelMonth !== Infinity) onsite += sz.prime.mw;
    if (bridgeRetained && sz.bridge.fuelMonth !== Infinity) onsite += sz.bridge.mw;
    const ok = onsite >= crit;
    items.push({ item: 'Islanding', ok, text: `on-site firm supply ${onsite.toFixed(1)} MW vs ${crit.toFixed(1)} MW critical load` });
    if (!ok) flags.push(flag('res-island', 'major', 'Resilience', 'Requirement not met: islanding'));
  }

  if (gasDependent) flags.push(flag('res-gas', 'minor', 'Resilience', 'Backup depends on gas network availability during a grid outage'));
  if (v.C5 === 'bessUps') flags.push(flag('res-bessups', 'minor', 'Resilience', 'BESS-augmented UPS is an emerging approach; redundancy covered by BESS for its duration only'));
  if (v.C5 === 'none') flags.push(flag('res-none', 'major', 'Resilience', 'No backup power technology selected'));
  if (v.C5 === 'dieselPrime') void 0;
  // C5 = None always fails (unchanged behaviour), and the failing item is now named (§9.7). Before
  // this fix, an islanded option with C5 = None whose retained plant covered the critical load was
  // "Does not meet" with no failing item. See BUILD-NOTES "Resilience check fix".
  if (v.C5 === 'none') items.push({ item: 'Backup technology', ok: false, text: 'none selected (C5 = None); on-site plant counted above is not a designated backup' });

  const fail = items.some((i) => !i.ok);
  const status = fail ? 'Does not meet' : (gasDependent || v.C5 === 'bessUps') ? 'Meets with flags' : 'Meets';
  const failing = items.filter((i) => !i.ok).map((i) => i.item);
  return { status, items, flags, firmMW, autonomyH, failing };
}

// ---------------------------------------------------------------------------
// Flags (§15) and deliverability (§9.9)
// ---------------------------------------------------------------------------
export function optionFlags(ctx, v, sz, disp, ttp, eco, carb, res) {
  const inputs = ctx.inputs;
  const req = inputs.requirements;
  const flags = [...res.flags];
  const eu = COUNTRIES[ctx.country].eu;
  const permitSuffix = eu ? ` ${PERMIT_NOTE}` : ` ${PROXY_NOTE} ${PERMIT_NOTE}`;
  const N = disp.years.length;
  // Roof area for PV larger than the free roof (OPEN-QUESTIONS 53): flagged, never reduced (principle 5).
  if (sz.roofPvOverFreeM2 > 0) flags.push(flag('solar-roof-area', 'minor', 'Technology', `Roof area for PV (${Math.round(inputs.site.pvRoofM2).toLocaleString('en-GB')} m²) is ${Math.round(sz.roofPvOverFreeM2).toLocaleString('en-GB')} m² more than the free roof after roof plant; rooftop PV is sized on the entered area`, { value: sz.roofPvOverFreeM2 }));

  // Power adequacy first (OPEN-QUESTIONS 38–40): one flag that says why an option is not adequate. It ranks the
  // option below every adequate one (scoring.js); the grid flags below give the detail.
  const adq = adequacyOf(disp, ttp, unmetSummary(disp));
  if (!adq.adequate) flags.push(flag('adequacy-short', 'major', 'Adequacy', adequacyText(adq), { value: adq.unmetMWh }));

  // Grid
  const unmetMWh = disp.years.reduce((s, y) => s + y.unmetMWh, 0);
  const unmetH = disp.years.reduce((s, y) => s + y.unmetHours, 0);
  const unmetPeak = disp.years.reduce((s, y) => Math.max(s, y.unmetPeakMW), 0);
  if (inputs.settings.gridHandling === 'unmet' && unmetMWh > 1e-6) {
    flags.push(flag('grid-binding', 'major', 'Grid', `Grid capacity binding: ${unmetH.toLocaleString('en-GB')} h, ${Math.round(unmetMWh).toLocaleString('en-GB')} MWh unmet (peak ${unmetPeak.toFixed(1)} MW) over the ${N} dispatched years`, { value: unmetMWh }));
  }
  const exMWh = disp.years.reduce((s, y) => s + y.exceedMWh, 0);
  if (exMWh > 1e-6) {
    const exH = disp.years.reduce((s, y) => s + y.exceedHours, 0);
    const exPk = disp.years.reduce((s, y) => Math.max(s, y.exceedPeakMW), 0);
    flags.push(flag('grid-exceed', 'major', 'Grid', `Import exceeds grid capacity: peak ${exPk.toFixed(1)} MW, ${exH.toLocaleString('en-GB')} h, ${Math.round(exMWh).toLocaleString('en-GB')} MWh`, { value: exMWh }));
  }
  // PPA volume not delivered physically (owner decision 2026-10-18): the flag explains the "PPA hedge (not counted)".
  // Minor when part of it is limited by import capacity (§15 "PPA limited by import capacity"), info when it is only
  // contracted volume above the residual load in the hour.
  const hd = eco.ppaHedge;
  if (hd && hd.undeliveredMWh > 1e-6) {
    const lim = hd.limitedMWh;
    const above = Math.max(0, hd.undeliveredMWh - lim);
    const mwh = (x) => `${Math.round(x).toLocaleString('en-GB')} MWh`;
    const eur = (x) => `€${Number((Math.abs(x) / 1e6).toPrecision(3)).toLocaleString('en-GB')} m`;
    const parts = [lim > 1e-6 ? `${mwh(lim)} limited by import capacity` : null, above > 1e-6 ? `${mwh(above)} above the load in the hour` : null].filter(Boolean).join(', ');
    // The total and its present value can have opposite signs (early income, later small costs): the present value
    // then names its own sign (Opus review 2026-10-18; it was printed as an absolute value after the total's word).
    const word = (x) => (x >= 0 ? 'income' : 'cost');
    const pvText = word(hd.pv) === word(hd.total) ? `present value ${eur(hd.pv)}` : `present value a net ${word(hd.pv)} of ${eur(hd.pv)}`;
    flags.push(flag('grid-ppa', lim > 1e-6 ? 'minor' : 'info', 'Grid',
      `${lim > 1e-6 ? 'PPA limited by import capacity' : 'PPA volume not delivered'}: ${mwh(hd.undeliveredMWh)} of contracted PPA volume over the ${inputs.economics.periodYears}-year evaluation period is not delivered physically (${parts}). Its settlement, a net ${word(hd.total)} of ${eur(hd.total)} (${pvText}), is reported as "PPA hedge (not counted)": it is not in the cost ledger, LCOE, NPV or score, because PPA settlement counts only on energy delivered over the grid connection.`,
      { value: hd.undeliveredMWh, hedge: hd.total }));
  }
  if (sz.storage.role === 'peakShave' && sz.storage.mw > 0 && disp.years.some((y) => y.designDayShortfall)) {
    flags.push(flag('grid-bess-peakshave', 'minor', 'Grid', 'BESS peak-shave cannot hold import within grid capacity on the design day'));
  }
  for (const s of sz.grid.shortfalls) flags.push(flag('grid-shortfall', 'info', 'Grid', `Grid shortfall at design load: up to ${s.mw.toFixed(1)} MW in months ${s.from}–${s.to}`));
  if (v.C1 === 'export' && inputs.grid.exportMW > 0) {
    const exp = disp.years.reduce((s, y) => s + y.curtailMWh, 0);
    if (exp > 1e-6) flags.push(flag('grid-export', 'info', 'Grid', 'Surplus above export capacity is curtailed'));
  }

  // Permitting
  const combustion = [];
  if (sz.prime && TECH[sz.prime.tech].combustion) combustion.push({ name: TECH[sz.prime.tech].name, mw: sz.prime.mw, unitMW: sz.prime.unitMW, eff: TECH[sz.prime.tech].p.eff });
  if (sz.bridge && TECH[sz.bridge.tech].combustion) combustion.push({ name: TECH[sz.bridge.tech].name, mw: sz.bridge.mw, unitMW: sz.bridge.unitMW, eff: TECH[sz.bridge.tech].p.eff });
  if (sz.backup.tech) {
    const t = TECH[sz.backup.tech];
    combustion.push({ name: t.name, mw: (v.C5 === 'bessUps' ? sz.backup.nUnits : sz.backup.units) * t.p.unitMW, unitMW: t.p.unitMW, eff: t.p.eff });
  }
  const thermal = combustion.reduce((s, c) => s + c.mw / c.eff, 0);
  if (thermal >= req.iedMWth) flags.push(flag('permit-ied', 'major', 'Permitting', `Aggregated combustion thermal input ${Math.round(thermal)} MWth ≥ ${req.iedMWth} MWth (IED threshold).${permitSuffix}`, { permitting: true, value: thermal, threshold: req.iedMWth }));
  const mcp = combustion.filter((c) => c.unitMW / c.eff >= req.mcpMinMWth && c.unitMW / c.eff < req.mcpMaxMWth);
  if (mcp.length) flags.push(flag('permit-mcp', 'minor', 'Permitting', `Individual combustion units of ${mcp.map((c) => `${(c.unitMW / c.eff).toFixed(1)} MWth (${c.name})`).join(', ')} are within ${req.mcpMinMWth}–${req.mcpMaxMWth} MWth (medium combustion plant rules).${permitSuffix}`, { permitting: true }));
  const fuelT = sz.backup.fuelM3 * TECH.fuelStorage.p.densityTPerM3;
  if (fuelT >= req.sevesoFuelT) flags.push(flag('permit-seveso-fuel', 'major', 'Permitting', `Hazardous substance storage above threshold: ${Math.round(fuelT).toLocaleString('en-GB')} t diesel/HVO ≥ ${req.sevesoFuelT.toLocaleString('en-GB')} t.${permitSuffix}`, { permitting: true }));
  if (sz.prime && sz.prime.tech === 'hydrogen') {
    const h2t = (sz.prime.mw / TECH.hydrogen.p.eff) * TECH.hydrogen.p.storageHours / 33.3;
    flags.push(flag('permit-h2', h2t >= req.sevesoH2t ? 'major' : 'minor', 'Permitting', `Hydrogen storage ${h2t.toFixed(0)} t on site${h2t >= req.sevesoH2t ? ` ≥ ${req.sevesoH2t} t (hazardous substance storage above threshold)` : ''}; large separation distances, hazardous-substance flag always raised.${permitSuffix}`, { permitting: true }));
  }
  if (sz.windMW > 0 && v.C11 === 'fit') flags.push(flag('permit-wind', 'major', 'Permitting', `Wind turbines on site (${sz.windTurbines} × tip height ${TECH.wind.p.tipHeightM} m): planning and aviation.${permitSuffix}`, { permitting: true }));
  const stacks = [];
  if (sz.prime && TECH[sz.prime.tech].p.stackM) stacks.push(TECH[sz.prime.tech].p.stackM);
  if (sz.bridge && TECH[sz.bridge.tech].p.stackM && (v.C1 === 'islanded' || v.C3 !== 'remove')) stacks.push(TECH[sz.bridge.tech].p.stackM);
  if (sz.backup.tech) stacks.push(TECH[sz.backup.tech].p.stackM);
  const maxStack = stacks.length ? Math.max(...stacks) : 0;
  if (maxStack > inputs.site.heightLimitM) flags.push(flag('permit-stack', 'minor', 'Permitting', `Stack height ${maxStack} m above the ${inputs.site.heightLimitM} m height limit.${permitSuffix}`, { permitting: true }));
  const runOver = disp.years.some((y) => y.plants.some((p) => p.runHoursAboveLimit));
  if (runOver) flags.push(flag('permit-runhours', 'minor', 'Permitting', `Run-hours above limit (${req.maxRunHours} h/yr).${permitSuffix}`, { permitting: true }));

  // Fuel and utilities
  const usesGas = [sz.prime, sz.bridge].some((p) => p && TECH[p.tech].fuel === 'gas') || (sz.backup.tech && TECH[sz.backup.tech].fuel === 'gas');
  if (usesGas && inputs.utilities.gasAvailable === 'Unknown') flags.push(flag('fuel-gas-unknown', 'minor', 'Fuel and utilities', 'Gas connection unconfirmed (gas availability "Unknown")'));
  if (usesGas && inputs.utilities.gasAvailable !== 'No') flags.push(flag('fuel-gas-assumed', 'info', 'Fuel and utilities', 'Gas capacity and date assumed, not confirmed'));
  if (usesGas && inputs.utilities.gasAvailable === 'No') flags.push(flag('fuel-gas-none', 'major', 'Fuel and utilities', 'Gas-using plant with gas availability "No": the plant does not run'));
  const usesH2 = sz.prime && sz.prime.tech === 'hydrogen';
  if (usesH2 && inputs.utilities.hydrogenAvailable !== 'Yes') flags.push(flag('fuel-h2-unavailable', 'major', 'Fuel and utilities', 'Hydrogen supply unavailable at current inputs'));
  if (usesH2 && inputs.utilities.hydrogenAvailable === 'Yes') flags.push(flag('fuel-h2-assumed', 'minor', 'Fuel and utilities', 'Hydrogen supply assumed (date and price unconfirmed)'));
  if (typeof inputs.utilities.waterAvailable === 'number' && carb.waterM3 / 365 > inputs.utilities.waterAvailable) flags.push(flag('fuel-water', 'minor', 'Fuel and utilities', `Water use ${Math.round(carb.waterM3 / 365)} m³/day above availability`));
  if (v.C2 === 'dieselPrime') flags.push(flag('fuel-diesel-prime', 'minor', 'Fuel and utilities', 'HVO-diesel prime bridging (flagged in §8 C2)'));

  // Targets and ceilings
  if (req.carbonTarget != null && carb.locationG > req.carbonTarget) flags.push(flag('target-carbon', 'minor', 'Targets and ceilings', `Carbon target not met: ${carb.locationG.toFixed(0)} > ${req.carbonTarget} gCO₂e/kWh`));
  const delay = Math.max(ttp.delayFirst, ttp.delayFull);
  if (delay > 0) flags.push(flag('target-ttp', 'minor', 'Targets and ceilings', `Time-to-power target missed by ${delay} months${ttp.reachedFull ? '' : ` (full load not reached within ${ctx.nMonthsTimeline} months)`}`));
  if (req.capexCeiling != null) {
    if (eco.capex > req.capexCeiling) flags.push(flag('target-capex', 'minor', 'Targets and ceilings', 'Capex P50 above ceiling'));
    else if (eco.capexHigh > req.capexCeiling) flags.push(flag('target-capex-p90', 'info', 'Targets and ceilings', 'Only capex high (P90 proxy) above ceiling'));
  }

  // Technology
  const techs = [sz.prime, sz.bridge].filter(Boolean).map((p) => TECH[p.tech]);
  if (techs.some((t) => t.maturity === 'Nascent')) flags.push(flag('tech-nascent', 'info', 'Technology', `Nascent technology in the option (${techs.filter((t) => t.maturity === 'Nascent').map((t) => t.name).join(', ')})`));
  if (sz.prime && sz.prime.availMonth > ctx.lastPhaseM) flags.push(flag('tech-late', 'minor', 'Technology', `${TECH[sz.prime.tech].name}: earliest availability (month ${sz.prime.availMonth}) after the full-load target date (month ${ctx.lastPhaseM})`));

  // Site fit flags come from the layout (sitefit.js) and are added in the flags stage of the run.
  return flags;
}

// Every flag of an option as the run assembles it (run.js flags stage): the §15 flags above, the site-fit flags
// (sitefit.js; none carries permitting: true, so they never enter deliverability) and the data flag on every option
// (all defaults are C-tagged). Shared by the run and by evaluateOption (option.js), so both give the same list.
export function allOptionFlags(ctx, v, sz, disp, ttp, eco, carb, res, siteFit) {
  const flags = optionFlags(ctx, v, sz, disp, ttp, eco, carb, res);
  if (siteFit) flags.push(...siteFit.flags);
  flags.push(flag('data-unverified', 'info', 'Data', 'Result depends on C-tagged (indicative — unverified) parameters and synthetic profiles'));
  return flags;
}

// Unmet load over the dispatched years (option summary and ranking-table column), shared by the run and option.js.
export function unmetSummary(disp) {
  return {
    mwh: disp.years.reduce((a, y) => a + y.unmetMWh, 0),
    hours: disp.years.reduce((a, y) => a + y.unmetHours, 0),
    peakMW: disp.years.reduce((a, y) => Math.max(a, y.unmetPeakMW), 0),
    longestH: disp.years.reduce((a, y) => Math.max(a, y.unmetLongestH || 0), 0),
    byYear: disp.years.map((y) => y.unmetMWh),
  };
}

const MATURITY = (id) => (TECH[id] ? TECH[id].maturity : 'Commercial');

export function deliverability(ctx, v, sz, disp, flags, siteFit = null) {
  const P = ctx.inputs.deliverability;
  // Capacity shares
  const cap = [];
  if (sz.solarMWp > 0) cap.push(['solarGround', sz.solarMWp]);
  if (sz.windMW > 0) cap.push(['wind', sz.windMW]);
  if (sz.storage.mw > 0) cap.push(['bess', sz.storage.mw]);
  if (sz.prime) cap.push([sz.prime.tech, sz.prime.mw]);
  if (sz.bridge) cap.push([sz.bridge.tech, sz.bridge.mw]);
  if (sz.backup.tech) cap.push([v.C5 === 'bessUps' ? 'bessUps' : sz.backup.tech, sz.backup.mw + sz.backup.bessMW]);
  if (ctx.inputs.grid.fullMW > 0) cap.push(['substation', ctx.inputs.grid.fullMW]);
  const capTot = cap.reduce((s, c) => s + c[1], 0) || 1;
  const capShare = (mat) => cap.filter((c) => MATURITY(c[0]) === mat).reduce((s, c) => s + c[1], 0) / capTot;
  // Energy shares (steady-state year)
  const ss = disp.years[disp.years.length - 1];
  const en = [['substation', ss.gridMWh + ss.ppaDeliveredMWh], ['solarGround', ss.reUsedMWh]];
  for (const p of ss.plants) en.push([p.tech, p.mwh]);
  const enTot = en.reduce((s, e) => s + e[1], 0) || 1;
  const enShare = (mat) => en.filter((e) => MATURITY(e[0]) === mat).reduce((s, e) => s + e[1], 0) / enTot;
  const emerging = (capShare('Emerging') + enShare('Emerging')) / 2;
  const nascent = (capShare('Nascent') + enShare('Nascent')) / 2;
  const items = [];
  items.push({ item: 'Emerging technology share', value: emerging, points: -P.emergingPenalty * emerging });
  items.push({ item: 'Nascent technology share', value: nascent, points: -P.nascentPenalty * nascent });
  const majors = flags.filter((f) => f.permitting && f.severity === 'major').length;
  const minors = flags.filter((f) => f.permitting && f.severity === 'minor').length;
  items.push({ item: `Permitting flags: ${majors} major, ${minors} minor`, value: majors + minors, points: -P.majorFlagPenalty * majors - P.minorFlagPenalty * minors });
  const usesGas = [sz.prime, sz.bridge].some((p) => p && TECH[p.tech].fuel === 'gas') || (sz.backup.tech && TECH[sz.backup.tech].fuel === 'gas');
  if (usesGas && ctx.inputs.utilities.gasAvailable === 'Unknown') items.push({ item: 'Gas used with availability "Unknown"', value: 1, points: -P.gasUnknownPenalty });
  if (sz.prime && sz.prime.tech === 'hydrogen') items.push({ item: 'Hydrogen fuel dependency', value: 1, points: -P.hydrogenPenalty });
  const techIds = new Set(cap.map((c) => c[0]).filter((id) => TECH[id] && TECH[id].p.procM !== undefined));
  const longLead = [...techIds].filter((id) => TECH[id].p.procM > P.leadTimeThresholdM);
  if (longLead.length) items.push({ item: `Procurement lead time > ${P.leadTimeThresholdM} months: ${longLead.map((id) => TECH[id].name).join(', ')}`, value: longLead.length, points: -P.leadTimePenalty * longLead.length });
  // Optional site-fit penalty (§9.9), off by default: only then does site fit enter the score, and the axis is
  // labelled "Deliverability (incl. site fit)". Site-fit flags never count as permitting flags above.
  const penaltyOn = !!P.siteFitPenalty;
  if (penaltyOn && siteFit && siteFit.status !== 'Fits') {
    const pts = siteFit.status === 'Does not fit' ? P.siteFitNoFitPenalty : P.siteFitFlagsPenalty;
    items.push({ item: `Site fit: ${siteFit.status} (optional site-fit penalty on)`, value: 1, points: -pts });
  }
  const score = Math.max(0, Math.min(100, 100 + items.reduce((s, i) => s + i.points, 0)));
  return { score, items, emergingShare: emerging, nascentShare: nascent, includesSiteFit: penaltyOn };
}
