// Per-option evaluation: time-to-power (§9.8), economics ledger (§9.5), carbon and water (§9.6),
// resilience check (§9.7), flags (§15) and deliverability (§9.9).

import { TECH, FUEL, PPA, COUNTRIES, choiceLabel, GAS_PRICE_WB } from './defaults.js';
import { decarbFactor, contractedCap, contractLimit, ctxFor } from './context.js';
import { assumedFlags } from './assumed.js';
import { fuelPrice, fuelEF, contractPrice, avgWholesale, plantMarginalCost } from './dispatch.js';
import { bridgeActive, techAvailMonth } from './sizing.js';
import { permittingTriggers } from './permitting.js';
import { NA } from './generator.js';
import { adequacyOf, adequacyText } from './adequacy.js';
import { addMonths } from './dates.js';
import { PLANT_SOURCE } from './plants.js';
import { utilitiesText } from './utilities.js';
import { DC_TAX, CONDITIONAL_RATE, DE_DISCOUNT, deDiscountFactor, GB_RESIDUAL, gasPathFactor, carbonPathFactor, takeoverRule, TAKEOVER_GENERAL, IE_POLICY, ieGasFactor, ieStorageFactor, GB_FEE } from './countryrules.js';
import { plantCandidates, PLANT_DEFAULTS } from './defaults.js';

const PERMIT_NOTE = 'Screening flag, not a permitting determination.';
const PROXY_NOTE = 'EU threshold used as a proxy; national equivalent not checked by this tool.';

export function flag(id, severity, category, message, extra = {}) {
  return { id, severity, category, message, ...extra };
}

// ---------------------------------------------------------------------------
// Time-to-power (§9.8)
// ---------------------------------------------------------------------------
export function timeToPower(ctx, v, sz) {
  ctx = ctxFor(ctx, v); // work package 19: a taken-over grid connection
  const n = ctx.nMonthsTimeline;
  const supply = new Float64Array(n);
  const cc = contractedCap(ctx, v.C1);
  for (let m = 0; m < n; m++) {
    let s = v.C1 === 'islanded' ? 0 : cc[m];
    s += sz.firmByMonth[m];
    // Bridging battery counts from its supply-available month (BRIEF §9.8), like every other source; the same
    // month sizing records (sz.bridgeBess.availMonth) and dispatch uses (port of e1161ce).
    if (v.C2 === 'bessSolar' && bridgeActive(v, m, sz.T) && m >= sz.bridgeBess.availMonth) s += sz.bridgeBess.mw;
    // A battery sized to the permanent shortfall counts as firm supply from the full grid date, once available, when
    // it can recharge on the design day (OPEN-QUESTIONS 60).
    if (sz.shortfallBess && sz.shortfallBess.rechargeOK && m >= sz.T && m >= sz.shortfallBess.availMonth) s += sz.shortfallBess.mw;
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
  const firstTarget = ctx.firstPhaseM;
  const fullTarget = ctx.lastPhaseM;
  const delayFirst = firstPowerM === null ? n - firstTarget : Math.max(0, firstPowerM - firstTarget);
  // First power is when phase 1 is energised: the later of its planned date and the month the supply could carry it
  // (known issue 9, work package 11, 2026-10-24); supplyReadyM keeps the month the supply was ready.
  const supplyReadyM = firstPowerM;
  if (firstPowerM !== null) firstPowerM = Math.max(firstPowerM, firstTarget);
  const delayFull = Math.max(0, monthsToFull - fullTarget);
  // Axis metric (§11): months late against the phasing plan, first power and full load, plus half the power gap in
  // months of design load (OPEN-QUESTIONS 68, work package 11, 2026-10-24; known issue 14). Supply that is ready before a
  // building needs it earns nothing: before, the metric counted the months until the supply could carry the whole
  // campus, so plant bought years early ranked better on a phased campus.
  const metric = delayFirst + delayFull + (0.5 * gapMWm) / Math.max(1e-9, sz.designMW);
  void cp;
  return { firstPowerM, supplyReadyM, fullLoadM, reachedFull, monthsToFull, gapMWm, gapMonths, metric, delayFirst, delayFull, supplyByMonth: supply };
}

// ---------------------------------------------------------------------------
// Economics ledger (§9.5) — single source of truth for LCOE, NPV, capex/opex split.
// Real terms, price base year = analysis start year. Capex at start of year y, opex at end.
// ---------------------------------------------------------------------------
function yearOfMonth(m) { return Math.max(0, Math.floor(m / 12)); }

export function economics(ctx, v, sz, disp, ttp) {
  ctx = ctxFor(ctx, v); // work package 19: a taken-over grid connection
  const eco = economicsFor(ctx, v, sz, disp, ttp);
  // Further evaluation periods shown beside the scoring period (work package 2, OPEN-QUESTIONS 21): the same ledger
  // rule over each period; the scoring period alone sets the cost axis.
  const E = ctx.inputs.economics;
  const extra = (Array.isArray(E.displayPeriods) ? E.displayPeriods : []).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 60 && n !== E.periodYears);
  eco.byPeriod = [...new Set([...extra, E.periodYears])].sort((a, b) => a - b).map((n) => {
    if (n === E.periodYears) return { years: n, lcoe: eco.lcoe, npvCost: eco.npvCost, scoring: true };
    const e = economicsFor({ ...ctx, inputs: { ...ctx.inputs, economics: { ...E, periodYears: n } } }, v, sz, disp, ttp);
    return { years: n, lcoe: e.lcoe, npvCost: e.npvCost, scoring: false };
  });
  return eco;
}

function economicsFor(ctx, v, sz, disp, ttp) {
  const inputs = ctx.inputs;
  const E = inputs.economics;
  const N = E.periodYears;
  const r = E.wacc;
  const cont = E.contingency;
  const capexLines = []; // { item, year, amount }
  const ledger = [];
  for (let y = 0; y <= N; y++) ledger.push({ year: y, capex: 0, contingency: 0, replacement: 0, residual: 0, fom: 0, vom: 0, fuel: 0, grid: 0, gridFixed: 0, deposit: 0, contract: 0, ppa: 0, carbon: 0, rental: 0, testRun: 0, flex: 0, revenue: 0, deliveredMWh: 0, scope1T: 0, scope2LocT: 0, scope2MktT: 0, cfeMWh: 0, netDemandMWh: 0, unmetMWh: 0 });

  const assets = []; // for replacement and residual value
  // Sensitivity multipliers (work package 9; 1 = as entered).
  const capF = inputs.economics.capexFactor ?? 1, bessF = inputs.economics.bessCapexFactor ?? 1, gridF = inputs.economics.gridCapexFactor ?? 1;
  const addCapex = (item, year, amount, life, opts = {}) => {
    amount *= capF * (/^BESS|battery/i.test(item) ? bessF : 1) * (/^Grid (connection charge|cable route)/.test(item) ? gridF : 1);
    if (!(amount > 0) || year > N - 1) return;
    capexLines.push({ item, year, amount });
    ledger[year].capex += amount;
    ledger[year].contingency += amount * cont;
    if (life) assets.push({ item, year, amount, life, removeYear: opts.removeYear ?? null, replaceFraction: opts.replaceFraction ?? 1 });
  };

  // Phase shares for per-phase plant (C19 = per phase)
  const phaseShares = ctx.phases.map((p) => ({ year: yearOfMonth(p.m), share: p.it / Math.max(1e-9, sz.itMW) }));
  const perPhase = v.C19 !== 'phase1';
  const bookPhased = (item, total, life, shares = null) => {
    // shares: per-phase fractions of `total` (backup gensets per building, OPEN-QUESTIONS 47); otherwise IT shares.
    if (perPhase) phaseShares.forEach((ps, i) => addCapex(item, ps.year, total * (shares ? shares[i] : ps.share), life));
    else addCapex(item, phaseShares.length ? phaseShares[0].year : 0, total, life);
  };

  // Grid connection and substation (offered capacity at full connection; same for every option)
  const sp = TECH.substation.p;
  const band = sz.grid.band;
  // A takeover in place of part of the new connection (OPEN-QUESTIONS 126) reduces the new connection: its substation
  // by the MW taken over, and its charge and cable route pro rata (none at all when nothing new is left).
  const fullMW0 = inputs.grid.fullMW;
  const fullMW = ctx.takeover && !ctx.takeover.add ? ctx.takeover.newMW : fullMW0;
  const newShare = fullMW0 > 0 ? fullMW / fullMW0 : 1;
  // The campus's own new connection is booked by the run's grid, not the option's (a taken-over connection, work
  // package 19, does not move it: Opus review finding 7).
  const g0 = ctx.baseCtx || ctx;
  let firstGridM = 0;
  while (firstGridM < g0.gridCap.length && g0.gridCap[firstGridM] <= 0) firstGridM++;
  const gridYear = fullMW > 0 ? yearOfMonth(Math.min(firstGridM, g0.fullGridM)) : 0;
  if (fullMW > 0) {
    // Work package 3 (OPEN-QUESTIONS 20, 2026-10-23): the grid connection charge is one lump sum entered by the
    // engineer (default 0), the same for every grid-connected option; islanded options contract 0 MW and pay neither
    // it nor the cable route. Before: every option paid the offered MW × the standard rate per MW (KNOWN-ISSUES 7).
    // A strategy contracted at 0 MW has no connection to pay for (Haiku check H2, L7).
    if (v.C1 !== 'islanded' && contractLimit(inputs, v.C1) > 0) {
      addCapex('Grid connection charge', gridYear, (Number(inputs.grid.connectionCharge) || 0) * newShare, 40);
      // Cable route from the POC (§5.4): route length from the site model (sizing.js, sz.grid.cableKm).
      addCapex('Grid cable route (POC to site)', gridYear, (sp[`cablePerKm_${band}`] ?? sp.cablePerKm) * (sz.grid.cableKm || 0) * (newShare > 0 ? 1 : 0), 40);
    }
    addCapex(`Substation (${band.toUpperCase()}, ${v.C17})`, gridYear, fullMW * sp[`subCapexPerMW_${band}`] * (v.C17 === 'GIS' ? sp.gisMultiplier : 1), 40);
  }
  // A nearby plant's grid connection taken over (work package 19, OPEN-QUESTIONS 120): the transfer and works, in the year
  // the campus can use it.
  if (ctx.takeover && ctx.takeover.mw > 0) addCapex(`Grid connection charge (taken over from ${ctx.takeover.plant.name})`, yearOfMonth(ctx.takeover.month), ctx.takeover.cost, 40);
  // Renewables
  const avail = (id) => yearOfMonth(techAvailMonth(ctx, TECH[id]));
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
  // Resilience reserve battery (UPS ride-through, §5.5): battery energy only, per building, replaced at its life.
  const ur = TECH.upsReserve.p;
  if (sz.reserve && sz.reserve.mwh > 0) bookPhased('Resilience reserve battery (UPS)', sz.reserve.mwh * 1000 * ur.capexPerKWh, ur.life);
  // Firm prime
  if (sz.prime) {
    const t = TECH[sz.prime.tech];
    // A bought existing plant (work package 19) is used until it stops (endMonth): no replacement, no value left.
    const primeEnd = t.existingPlant && sz.prime.endMonth < Infinity ? yearOfMonth(sz.prime.endMonth) : null;
    addCapex(`${t.name} (prime)`, yearOfMonth(sz.prime.availMonth), sz.prime.mw * 1000 * t.p.capexPerKW, t.p.life, { removeYear: primeEnd });
    // Existing plant (work package 12): the one-off connection to the campus, when the lease starts.
    if (t.p.linkCapex) addCapex(`${t.name}: connection to the campus`, yearOfMonth(sz.prime.availMonth), t.p.linkCapex, t.p.life, { removeYear: primeEnd }); // ends with the plant (finding 11)
    if (t.p.stackLife) assets.push({ item: `${t.name} stack replacement`, year: yearOfMonth(sz.prime.availMonth), amount: sz.prime.mw * 1000 * t.p.capexPerKW * t.p.stackFraction * capF, life: t.p.stackLife, stackOnly: true });
  }
  // Bridging plant
  const T = sz.T;
  const bridgeEndY = sz.bridge && TECH[sz.bridge.tech].existingPlant && sz.bridge.endMonth < Infinity ? yearOfMonth(sz.bridge.endMonth) : null;
  const bridgeRemoveYear0 = v.C1 === 'bridge' && v.C3 === 'remove' ? yearOfMonth(T) : null;
  // An existing plant stops at its end month if that comes first (work package 19).
  const bridgeRemoveYear = bridgeEndY !== null && (bridgeRemoveYear0 === null || bridgeEndY < bridgeRemoveYear0) ? bridgeEndY : bridgeRemoveYear0;
  // Retained bridging plant bought (or, when rented, hired) in step with the buildings (known issue 16): the bridging
  // units at the bridging date, then the units each later building's critical load needs at that building's date.
  const rp = sz.bridge && sz.bridge.retainedPhasing;
  const bridgeSteps = []; // { month, units, label }
  if (sz.bridge) {
    const mA = sz.bridge.availMonth;
    if (rp) {
      if (rp.bridgingUnits > 0) bridgeSteps.push({ month: mA, units: rp.bridgingUnits, label: 'bridging' });
      let owned = rp.bridgingUnits;
      rp.cumUnitsByPhase.forEach((cu, k) => { const add = Math.max(0, cu - owned); if (add > 0) { bridgeSteps.push({ month: Math.max(mA, rp.phaseMonths[k]), units: add, label: 'retained as backup' }); owned += add; } });
      if (owned < sz.bridge.units) bridgeSteps.push({ month: mA, units: sz.bridge.units - owned, label: 'retained as backup' });
    } else bridgeSteps.push({ month: mA, units: sz.bridge.units, label: 'bridging' });
  }
  const bridgeBuys = bridgeSteps.map((b) => ({ ...b, year: yearOfMonth(b.month) }));
  const bridgeOwnedMW = (y) => bridgeBuys.reduce((a, b) => a + (b.year <= y ? b.units : 0), 0) * (sz.bridge ? sz.bridge.unitMW : 0);
  const bridgeMWAtMonth = (m) => bridgeSteps.reduce((a, b) => a + (b.month <= m ? b.units : 0), 0) * (sz.bridge ? sz.bridge.unitMW : 0);
  // Existing plant as bridging plant (work package 12): its connection to the campus, no resale value if the lease ends.
  if (sz.bridge && TECH[sz.bridge.tech].p.linkCapex) addCapex(`${TECH[sz.bridge.tech].name}: connection to the campus`, yearOfMonth(sz.bridge.availMonth), TECH[sz.bridge.tech].p.linkCapex, bridgeRemoveYear === null ? TECH[sz.bridge.tech].p.life : 0);
  if (sz.bridge && !TECH[sz.bridge.tech].lease) {
    const t = TECH[sz.bridge.tech];
    if (rp) bridgeBuys.forEach((b) => addCapex(`${t.name} (${b.label})`, b.year, b.units * sz.bridge.unitMW * 1000 * t.p.capexPerKW, t.p.life, { removeYear: bridgeRemoveYear }));
    else addCapex(`${t.name} (bridging)`, yearOfMonth(sz.bridge.availMonth), sz.bridge.mw * 1000 * t.p.capexPerKW, t.p.life, { removeYear: bridgeRemoveYear });
    if (t.p.stackLife && bridgeRemoveYear === null) assets.push({ item: `${t.name} stack replacement`, year: yearOfMonth(sz.bridge.availMonth), amount: sz.bridge.mw * 1000 * t.p.capexPerKW * t.p.stackFraction * capF, life: t.p.stackLife, stackOnly: true });
  }
  // Gas connection pipe from the gas main (§5.2), for options that burn gas on site and only when a gas main
  // location is given (sizing.js): booked when the first gas plant is available (gas gensets only: phase 1).
  if (sz.gasConnection && sz.gasConnection.km > 0) {
    const gasMonths = [sz.prime, sz.bridge].filter((p) => p && TECH[p.tech].fuel === 'gas' && !TECH[p.tech].offsite).map((p) => p.availMonth);
    const gasYear = gasMonths.length ? yearOfMonth(Math.min(...gasMonths)) : (phaseShares.length ? phaseShares[0].year : 0);
    addCapex('Gas connection pipe', gasYear, sz.gasConnection.km * sz.gasConnection.perKm, 40);
  }
  // Backup gensets, BESS-augmented UPS BESS, fuel storage (per phase)
  if (sz.backup.tech) {
    const t = TECH[sz.backup.tech];
    const ub = sz.backup.unitsByPhase;
    const ubTot = ub ? ub.reduce((a, b) => a + b, 0) : 0;
    const unitShares = ub && ubTot > 0 && ub.length === phaseShares.length ? ub.map((u) => u / ubTot) : null;
    bookPhased(`${choiceLabel('C5', v.C5)} (${v.C6}${v.C5a === 'pooled' ? ', pooled' : ''})`, sz.backup.mw * 1000 * t.p.capexPerKW, t.p.life, unitShares);
    if (sz.backup.bessMW > 0) bookPhased('BESS for UPS augmentation', bessCapex(sz.backup.bessMW, sz.backup.bessMWh), bp.life);
  }
  if (sz.backup.fuelM3 > 0) bookPhased('Bulk fuel storage', sz.backup.fuelM3 * TECH.fuelStorage.p.capexPerM3, 30);
  // Replacement backup after a bought existing plant stops (OPEN-QUESTIONS 129).
  const rb = sz.replacementBackup;
  if (rb) {
    const t = TECH[rb.tech];
    addCapex(`${t.name} (replacing ${TECH[sz.bridge.tech].name} as backup)`, yearOfMonth(rb.fromMonth), rb.mw * 1000 * t.p.capexPerKW, t.p.life);
    if (rb.fuelM3 > 0) addCapex('Bulk fuel storage (replacement backup)', yearOfMonth(rb.fromMonth), rb.fuelM3 * TECH.fuelStorage.p.capexPerM3, 30);
  }
  // Cooling capex delta between cooling types: dropped in work package 20 (OPEN-QUESTIONS 134): the cooling plant is the
  // same in every option, so it does not change the comparison.
  // Heat reuse not costed in this slice (C15 locked None by default)

  // Replacements and residual value
  for (const a of assets) {
    // An existing plant can stop after the evaluation period (work package 19): the period ends first.
    const endYear = a.removeYear !== null && a.removeYear !== undefined ? Math.min(a.removeYear, N) : N;
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
    if (sz.reserve && sz.reserve.mwh > 0) L.fom += itShareYear(y) * sz.reserve.mwh * 1000 * ur.capexPerKWh * ur.fomPct;
    if (sz.prime && y >= yearOfMonth(sz.prime.availMonth) && y * 12 < (sz.prime.endMonth ?? Infinity)) L.fom += sz.prime.mw * 1000 * TECH[sz.prime.tech].p.fomPerKW;
    if (sz.replacementBackup && y >= yearOfMonth(sz.replacementBackup.fromMonth)) L.fom += sz.replacementBackup.mw * 1000 * TECH[sz.replacementBackup.tech].p.fomPerKW;
    if (sz.bridge && !TECH[sz.bridge.tech].lease && y >= yearOfMonth(sz.bridge.availMonth) && (bridgeRemoveYear === null || y < bridgeRemoveYear)) L.fom += bridgeOwnedMW(y) * 1000 * TECH[sz.bridge.tech].p.fomPerKW;
    if (sz.backup.tech) {
      L.fom += itShareYear(y) * sz.backup.mw * 1000 * TECH[sz.backup.tech].p.fomPerKW;
      if (sz.backup.bessMW > 0) L.fom += itShareYear(y) * bessCapex(sz.backup.bessMW, sz.backup.bessMWh) * bp.fomPct;
    }
    // Rented or leased bridging plant: paid for each month it is on site (from its hire month while active or retained)
    if (sz.bridge && TECH[sz.bridge.tech].lease) {
      let rentedMWMonths = 0;
      for (let m = y * 12; m < y * 12 + 12; m++) {
        if (m < sz.bridge.availMonth || m >= (sz.bridge.endMonth ?? Infinity)) continue; // a leased existing plant ends at its closure (work package 19)
        const onSite = v.C1 === 'islanded' || m < T || v.C3 !== 'remove';
        if (onSite) rentedMWMonths += rp ? bridgeMWAtMonth(m) : sz.bridge.mw; // hired in step with the buildings when retained (known issue 16)
      }
      L.rental += rentedMWMonths * 1000 * TECH[sz.bridge.tech].p.rentalPerKWMonth;
    }
    // Leased existing plant as firm plant (work package 12): the lease for each month from its start.
    if (sz.prime && TECH[sz.prime.tech].lease) {
      let months = 0;
      for (let m = y * 12; m < y * 12 + 12; m++) if (m >= sz.prime.availMonth && m < (sz.prime.endMonth ?? Infinity)) months++;
      L.rental += months * sz.prime.mw * 1000 * TECH[sz.prime.tech].p.rentalPerKWMonth;
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
  const hedge = sz.ppa ? { byYear: [], total: 0, pv: 0, contractMWh: 0, deliveredMWh: 0, undeliveredMWh: 0, limitedMWh: 0, mslBackMWh: 0, price: ppaPrice } : null;
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
    // Work package 25 (OPEN-QUESTIONS 232): a number is a constant real rate; otherwise the published forecast path.
    const gasEsc = Number.isFinite(E.gasEscalation) ? Math.pow(1 + E.gasEscalation, y) : gasPathFactor(calYear);
    const cEsc = Number.isFinite(E.carbonEscalation) ? Math.pow(1 + E.carbonEscalation, y) : carbonPathFactor(calYear, ctx.carbonPrice);
    const cPrice = ctx.carbonPrice * cEsc;
    let scope1 = 0;
    for (const pr of d.plants) {
      const t = TECH[pr.tech];
      // A supply contract (work package 29): the contract price on the energy taken; its emissions are the plant's,
      // counted with the grid's (scope 2), and its carbon cost is in the price.
      if (t && t.contract) {
        L.contract += pr.mwh * contractPrice(ctx, t) * (t.p.contractMethod === 'market' ? elecEsc : t.p.contractMethod === 'costPlus' ? gasEsc : 1);
        const tco2 = pr.fuelMWhTh * fuelEF(t.fuel);
        L.scope2LocT += tco2; L.scope2MktT += tco2;
        continue;
      }
      L.vom += pr.mwh * (t.p.vomPerMWh || 0);
      if (pr.tech === 'smr') L.fuel += pr.mwh * t.p.fuelPerMWhE;
      else L.fuel += pr.fuelMWhTh * fuelPrice(ctx, t.fuel) * (t.fuel === 'gas' ? gasEsc : 1);
      scope1 += pr.fuelMWhTh * fuelEF(t.fuel);
    }
    // Cost of curtailing customer IT (demand flexibility, §5.3), on all curtailed energy.
    L.flex += (d.flexMWh || 0) * (inputs.load.flexCostPerMWh || 0);
    if (testRun && itShareYear(y) > 0) {
      const sh = itShareYear(y);
      L.testRun += sh * testRun.fuelMWhTh * fuelPrice(ctx, testRun.fuel);
      scope1 += sh * testRun.fuelMWhTh * fuelEF(testRun.fuel);
    }
    L.grid += (d.gridCost + d.ppaNetworkCost) * elecEsc; // network/non-commodity adder also applies to PPA energy over the grid, escalated the same way (known issue 2, work package 11)
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
      hedge.mslBackMWh += d.ppaMslBackMWh || 0;
    }
    L.carbon += scope1 * cPrice;
    L.revenue += d.exportRevenue * elecEsc;
    // Delivered energy: demand less unmet load and less IT load shed by flexibility (owner 2026-10-30, OPEN-QUESTIONS 113):
    // shed load is not supplied, as it is not for adequacy (OPEN-QUESTIONS 61).
    L.deliveredMWh += d.grossDemandMWh - d.unmetMWh - (d.flexMWh || 0);
    L.netDemandMWh += d.netDemandMWh;
    L.unmetMWh += d.unmetMWh;
    L.scope1T += scope1;
    const s2loc = (d.gridCarbonT + d.ppaCarbonT) * df;
    L.scope2LocT += s2loc;
    const imported = d.gridMWh + d.ppaDeliveredMWh;
    L.scope2MktT += imported > 0 ? s2loc * Math.max(0, 1 - d.ppaContractMWh / imported) : 0;
    L.cfeMWh += d.cfeMWh;
  }

  // Yearly grid charges per MW and per site, and Germany's flat-load discount (work package 24, OPEN-QUESTIONS 160–165,
  // 203, 216, 217): charged on the option's own contracted grid MW, month by month, while it has a connection;
  // escalated like the grid price. The discount is a credit on Germany's network part only.
  const gf = ctx.gridFixed || (ctx.baseCtx && ctx.baseCtx.gridFixed);
  if (gf && (gf.on || gf.discount) && v.C1 !== 'islanded' && contractLimit(inputs, v.C1) > 0) {
    const ccap = contractedCap(ctx, v.C1);
    for (let y = 0; y < N; y++) {
      let mwMonths = 0, connMonths = 0;
      for (let m = y * 12; m < y * 12 + 12 && m < ccap.length; m++) if (ccap[m] > 0) { mwMonths += ccap[m]; connMonths++; }
      let amt = 0;
      const perMWYear = gf.on ? (gf.perMW || 0) * mwMonths / 12 : 0;
      if (gf.on) amt += perMWYear + (gf.lumpSum || 0) * connMonths / 12;
      if (gf.discount && !ctx.adderEntered) {
        const d = disp.years[Math.min(y, nExp - 1)];
        const f = deDiscountFactor(d.gridPeakMW > 0 ? d.gridMWh / d.gridPeakMW : 0, d.gridMWh);
        if (f < 1) amt -= (1 - f) * (gf.on ? d.gridMWh * DE_DISCOUNT.networkEnergyPerMWh + perMWYear : d.gridMWh * DE_DISCOUNT.networkPerMWhFlat);
      }
      ledger[y].gridFixed += amt * Math.pow(1 + E.elecEscalation, y);
    }
  }

  // Uses C and D of a nearby plant (work package 29, OPEN-QUESTIONS 177–178, 180, 188–191): the plant keeps selling the
  // capacity the campus holds and does not use, at one flat price (the year's average grid wholesale price unless
  // entered, no export factor), whenever that price beats its running cost; the campus keeps the share the engineer set
  // for the use (blank = 0 %). Standby income: €/MW a year on the MW the campus holds (the €/MWh when called is not
  // modelled: the hours the plant is called are not known; OPEN-QUESTIONS 239).
  const plantIncome = [];
  for (const role of [sz.prime, sz.bridge]) {
    if (!role || !role.tech) continue;
    const t = TECH[role.tech];
    if (!t || !t.existingPlant || t.plantKey === 'manual') continue;
    const cand = plantCandidates(inputs).all.find((c) => c.id === t.plantKey);
    if (!cand || !cand.uses) continue;
    const mode = t.contract ? 'contract' : t.bought ? 'buy' : 'lease';
    const share = Math.max(0, Math.min(100, cand.uses.surplus.share[mode] || 0)) / 100;
    const sb = cand.uses.standby.perMWYear || 0;
    if (!(share > 0) && !(sb > 0)) continue;
    const capMW = Math.min(role.mw, cand.uses.surplus.exportMW != null ? cand.uses.surplus.exportMW : role.mw);
    const cost = t.contract ? contractPrice(ctx, t) : plantMarginalCost(ctx, { tech: role.tech, fuel: t.fuel, eff: t.p.eff });
    const info = { name: t.name, mode, share, capMW, cost, standbyPerMWYear: sb, surplusMWh: 0, revenue: 0, standby: 0 };
    for (let y = 0; y < N; y++) {
      let mo = 0;
      for (let m = y * 12; m < y * 12 + 12; m++) if (m >= role.availMonth && m < (role.endMonth ?? t.p.endM ?? Infinity)) mo++;
      if (!mo) continue;
      const d = disp.years[Math.min(y, nExp - 1)];
      const used = d.plants.filter((x) => x.tech === role.tech).reduce((a, x) => a + x.mwh, 0);
      const elecEsc = Math.pow(1 + E.elecEscalation, y);
      const price = (cand.uses.surplus.price != null ? cand.uses.surplus.price : avgWholesale(ctx)) * elecEsc;
      const surplus = Math.max(0, capMW * 8760 * (mo / 12) - used);
      const margin = price > cost ? (price - cost) * surplus * share : 0;
      const stand = sb * role.mw * (mo / 12);
      ledger[y].revenue += margin + stand;
      info.surplusMWh += price > cost ? surplus : 0; info.revenue += margin; info.standby += stand;
    }
    plantIncome.push(info);
  }

  // Great Britain's proposed Data Centre Commitment Fee (OPEN-QUESTIONS 199, 206–209): a deposit paid on day 1 and
  // returned as the contracted grid capacity it was paid for becomes available; booked in its own ledger column, at the
  // start of each year like capex, so its only cost is the money tied up.
  let gbFee = null;
  if (ctx.country === 'GB' && inputs.grid.gbFeeInclude) {
    const perMW = Number(inputs.grid.gbFeePerMW);
    const ccap = v.C1 === 'islanded' ? [0] : contractedCap(ctx, v.C1);
    let mw = 0; for (const x of ccap) if (x > mw) mw = x;
    if (!(perMW > 0)) gbFee = { applies: false, reason: `Data Centre Commitment Fee ticked but no fee entered: nothing is charged (the field starts blank; Ofgem proposed £${GB_FEE.rangeGBP[0].toLocaleString('en-GB')} to £${GB_FEE.rangeGBP[1].toLocaleString('en-GB')} per MW, OPEN-QUESTIONS 206)` };
    else if (mw < GB_FEE.thresholdMW) gbFee = { applies: false, reason: `Data Centre Commitment Fee ticked: not charged, because this option contracts ${Math.round(mw)} MW, below Ofgem's proposed threshold of ${GB_FEE.thresholdMW} MW (OPEN-QUESTIONS 238)` };
    else {
      const deposit = perMW * mw;
      ledger[0].deposit += deposit;
      let prev = 0;
      for (let m = 0; m < ccap.length; m++) {
        const step = Math.max(0, Math.min(ccap[m], mw) - prev);
        if (step > 1e-9) { const y = Math.min(N, yearOfMonth(m)); ledger[y].deposit -= perMW * step; prev += step; }
      }
      let pv = 0; for (let y = 0; y <= N; y++) pv += ledger[y].deposit * Math.pow(1 + r, -y);
      gbFee = { applies: true, perMW, mw, deposit, pvCost: pv };
    }
  }

  // Totals and discounting
  let pvCost = 0, pvEnergy = 0, pvCapex = 0, pvOpex = 0, capexTotal = 0, contTotal = 0;
  for (let y = 0; y <= N; y++) {
    const L = ledger[y];
    L.capexTotal = L.capex + L.contingency + L.replacement + L.residual + L.deposit;
    L.opex = L.fom + L.vom + L.fuel + L.grid + L.gridFixed + L.contract + L.ppa + L.carbon + L.rental + L.testRun + L.flex - L.revenue;
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
  // "Opex, first year with load" (known issue 8, work package 11): the first ledger year with facility energy.
  const y1 = Math.max(0, ledger.findIndex((r) => r.netDemandMWh > 0));
  const year1 = ledger[y1];
  const ss = ledger[Math.max(0, ssY)];
  const capexInitial = capexTotal + contTotal;
  return {
    ledger, capexLines,
    npvCost: pvCost, pvCapex, pvOpex, lcoe,
    capex: capexInitial, capexExContingency: capexTotal, contingency: contTotal,
    capexLow: capexInitial * (1 + E.capexLow), capexHigh: capexInitial * (1 + E.capexHigh),
    capexPerMWIT: capexInitial / Math.max(1e-9, sz.itMW),
    opexYear1: year1.opex, opexYear1Index: y1, opexSteady: ss.opex,
    capexShare: pvCost !== 0 ? pvCapex / pvCost : 0,
    reconciliation: { lcoeTimesEnergy: lcoe * pvEnergy, npv: pvCost, pvEnergy },
    ppaHedge: hedge, // outside the ledger (see above); null without a PPA
    plantIncome, // work package 29: uses C and D of a nearby plant
    gbFee, // work package 26: Great Britain's commitment fee (null when not ticked or outside Great Britain)
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
  // Water on steady-state year IT energy (work package 20, OPEN-QUESTIONS 134): from the entered WUE (litres per kWh of
  // IT); left blank, water is not reported (null).
  const ssd = disp.years[disp.years.length - 1];
  const wueIn = ctx.inputs.load.wue;
  const wue = wueIn == null || wueIn === '' || !Number.isFinite(Number(wueIn)) ? null : Number(wueIn);
  const waterM3 = wue == null ? null : (wue * ssd.itMWh * 1000) / 1000;
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
  ctx = ctxFor(ctx, v); // work package 19: a taken-over grid connection
  const req = ctx.inputs.requirements;
  const items = [];
  const flags = [];
  const crit = sz.criticalMW;
  let firmMW = 0;
  const parts = [];
  let gasDependent = false;
  let nonGasFirm = 0; // firm capacity that does not burn gas (known issue 10)
  const bs = ctx.inputs.requirements.blockSize;
  // Backup gensets at topology after removing redundant units
  if (sz.backup.tech) {
    const t = TECH[sz.backup.tech];
    const nCap = sz.backup.nUnits * t.p.unitMW;
    firmMW += nCap;
    parts.push(`${sz.backup.nUnits} × ${t.p.unitMW} MW ${choiceLabel('C5', v.C5)} = ${nCap.toFixed(1)} MW (redundant units removed)`);
    if (t.fuel === 'gas') gasDependent = true; else nonGasFirm += nCap;
  }
  // Retained bridging plant (on site after grid arrives)
  // A leased existing plant is never the campus's standby (rule (m), OPEN-QUESTIONS 79): kept as prime it does not count
  // as backed load (known issue 33, Opus review of package 19, finding 22).
  const bridgeRetained = sz.bridge && (v.C1 === 'islanded' || (v.C1 === 'bridge' && v.C3 !== 'remove')) && !(TECH[sz.bridge.tech].existingPlant && TECH[sz.bridge.tech].lease);
  if (bridgeRetained && sz.bridge.fuelMonth !== Infinity) {
    const cap = sz.bridge.nUnits * sz.bridge.unitMW;
    firmMW += cap;
    parts.push(`retained bridging ${TECH[sz.bridge.tech].name} ${cap.toFixed(1)} MW (redundant units removed)`);
    if (TECH[sz.bridge.tech].fuel === 'gas') gasDependent = true; else nonGasFirm += cap;
  }
  // Firm prime
  if (sz.prime && sz.prime.fuelMonth !== Infinity) {
    const n = TOPO_RANK[req.topology] >= 1 ? Math.max(0, sz.prime.units - Math.ceil(sz.prime.units / bs)) : sz.prime.units;
    const cap = n * sz.prime.unitMW;
    firmMW += cap;
    parts.push(`firm prime ${TECH[sz.prime.tech].name} ${cap.toFixed(1)} MW (redundant units removed)`);
    if (TECH[sz.prime.tech].fuel === 'gas') gasDependent = true; else nonGasFirm += cap;
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
  } else if (v.C5 === 'retained' && sz.bridge && TECH[sz.bridge.tech].existingPlant) {
    // A bought existing plant kept as the backup (work package 19, OPEN-QUESTIONS 122) has only the plant's units: its
    // units against those the required topology needs (Opus review of package 19, finding 2).
    const nCrit = Math.ceil(crit / sz.bridge.unitMW - 1e-9);
    const B = Math.ceil(nCrit / bs);
    const need = req.topology === 'N' ? nCrit : req.topology === '2N' ? 2 * nCrit : req.topology === 'catcher' ? nCrit + Math.ceil(B / (req.catcherN || 1)) : nCrit + B;
    topoOK = sz.bridge.units >= need;
    items.push({ item: 'Topology', ok: topoOK, text: `retained ${TECH[sz.bridge.tech].name}: ${sz.bridge.units} unit${sz.bridge.units === 1 ? '' : 's'} vs ${need} for ${req.topology}` });
    if (!topoOK) flags.push(flag('res-topology', 'major', 'Resilience', `Requirement not met: the retained existing plant has ${sz.bridge.units} unit${sz.bridge.units === 1 ? '' : 's'} of ${Math.round(sz.bridge.unitMW)} MW; ${req.topology} needs ${need}`));
  } else if (v.C5 === 'retained') {
    items.push({ item: 'Topology', ok: true, text: 'Retained bridging plant sized N+1 per block of ' + bs });
  }
  // An existing plant counted here stops within the evaluation period: from then on it backs up nothing
  // (work package 19, Opus review finding 2).
  {
    const period = ctx.inputs.economics.periodYears * 12;
    const ending = [bridgeRetained ? sz.bridge : null, sz.prime].filter((p) => p && TECH[p.tech].existingPlant && p.endMonth < period);
    for (const p of ending) {
      // Only when the rest of the backed load falls short without it.
      const part = p === sz.prime ? (TOPO_RANK[req.topology] >= 1 ? Math.max(0, p.units - Math.ceil(p.units / bs)) : p.units) * p.unitMW : p.nUnits * p.unitMW;
      if (firmMW - part + 1e-9 >= crit) continue;
      if (p === sz.bridge && sz.replacementBackup) {
        const rb = sz.replacementBackup;
        items.push({ item: 'Backup after the plant stops', ok: rb.nUnits * rb.unitMW + 1e-9 >= crit, text: `${rb.units} × ${rb.unitMW} MW ${TECH[rb.tech].name} from month ${rb.fromMonth} (OPEN-QUESTIONS 129)` });
        continue;
      }
      items.push({ item: 'Backup after the plant stops', ok: false, text: `${TECH[p.tech].name} stops in month ${p.endMonth}` });
      flags.push(flag('res-plant-ends', 'major', 'Resilience', `Requirement not met from month ${p.endMonth} (${addMonths(ctx.inputs.project.analysisStart, p.endMonth)}): ${TECH[p.tech].name}, counted in the backed load, stops then, and no other plant takes its place (none is costed)`));
    }
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

  // Raised only when the critical load cannot be met without gas-fired plant (known issue 10, work package 11,
  // 2026-10-24); before, any gas plant counted in the backed load raised it, even when liquid-fuel gensets alone covered it.
  const gasFlag = gasDependent && nonGasFirm + 1e-9 < crit;
  if (gasFlag) flags.push(flag('res-gas', 'minor', 'Resilience', `Backup depends on gas network availability during a grid outage: plant that does not burn gas covers ${nonGasFirm.toFixed(1)} of ${crit.toFixed(1)} MW critical load`));
  if (v.C5 === 'bessUps') flags.push(flag('res-bessups', 'minor', 'Resilience', 'BESS-augmented UPS is an emerging approach; redundancy covered by BESS for its duration only'));
  if (v.C5 === 'none') flags.push(flag('res-none', 'major', 'Resilience', 'No backup power technology selected'));
  if (v.C5 === 'dieselPrime') void 0;
  // C5 = None always fails (unchanged behaviour), and the failing item is now named (§9.7). Before
  // this fix, an islanded option with C5 = None whose retained plant covered the critical load was
  // "Does not meet" with no failing item. See BUILD-NOTES "Resilience check fix".
  if (v.C5 === 'none') items.push({ item: 'Backup technology', ok: false, text: 'none selected (C5 = None); on-site plant counted above is not a designated backup' });

  const fail = items.some((i) => !i.ok);
  const status = fail ? 'Does not meet' : (gasFlag || v.C5 === 'bessUps') ? 'Meets with flags' : 'Meets';
  const failing = items.filter((i) => !i.ok).map((i) => i.item);
  return { status, items, flags, firmMW, nonGasFirmMW: nonGasFirm, gasDependent, autonomyH, failing };
}

// ---------------------------------------------------------------------------
// Flags (§15) and deliverability (§9.9)
// ---------------------------------------------------------------------------
// Expected grid connection charge (OPEN-QUESTIONS 50): the standard rate per MW for the voltage band × the contracted
// capacity at full connection. Shown next to the input for reference; never used unless the engineer enters it.
export function expectedConnectionCharge(inputs, C1 = 'wait', band = null) {
  const g = inputs.grid;
  const mw = Math.min(Number(g.fullMW) || 0, contractLimit(inputs, C1));
  const sp = TECH.substation.p;
  const b = band || (mw < sp.bandMvMaxMW ? 'mv' : mw <= sp.bandHvMaxMW ? 'hv' : 'ehv');
  const rate = sp[`connCapexPerMW_${b}`];
  return { mw, band: b, rate, amount: mw * rate };
}

export function optionFlags(ctx, v, sz, disp, ttp, eco, carb, res) {
  ctx = ctxFor(ctx, v); // work package 19: a taken-over grid connection
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
    // The total and its present value can have opposite signs (early income, later small costs): the present value
    // then names its own sign (Opus review 2026-10-18; it was printed as an absolute value after the total's word).
    const word = (x) => (x >= 0 ? 'income' : 'cost');
    const pvText = word(hd.pv) === word(hd.total) ? `present value ${eur(hd.pv)}` : `present value a net ${word(hd.pv)} of ${eur(hd.pv)}`;
    // O3 (walkthrough 2026-10-21): two flags, each with its share of the undelivered volume (the shares add to 100 %).
    const share = (x) => (hd.undeliveredMWh > 0 ? (x / hd.undeliveredMWh) * 100 : 0);
    const pctTxt = (x) => `${share(x) < 0.01 && x > 0 ? share(x).toFixed(3) : share(x) < 1 ? share(x).toFixed(2) : share(x).toFixed(1)} %`;
    const hedgeTxt = `Its settlement, a net ${word(hd.total)} of ${eur(hd.total)} (${pvText}), is reported as "PPA hedge (not counted)": it is not in the cost ledger, LCOE, NPV or score, because PPA settlement counts only on energy delivered over the grid connection.`;
    if (lim > 1e-6) flags.push(flag('ppa-import-limited', 'minor', 'Grid',
      `PPA limited by import capacity: ${mwh(lim)} (${pctTxt(lim)} of the ${mwh(hd.undeliveredMWh)} undelivered) of contracted PPA volume over the ${inputs.economics.periodYears}-year evaluation period could not be delivered because the grid connection was full. ${hedgeTxt}`,
      { value: lim, share: share(lim), hedge: hd.total }));
    if (above > 1e-6) flags.push(flag('ppa-above-load', 'info', 'Grid',
      `PPA volume above the load: ${mwh(above)} (${pctTxt(above)} of the ${mwh(hd.undeliveredMWh)} undelivered) of contracted PPA volume over the ${inputs.economics.periodYears}-year evaluation period exceeded the load still to serve in its hour${hd.mslBackMWh > 1e-6 ? ` (${mwh(hd.mslBackMWh)} of it because firm plant needed at its minimum stable load served that load instead)` : ''}. ${hedgeTxt}`,
      { value: above, share: share(above), hedge: hd.total }));
  }
  if (sz.shortfallBess && !sz.shortfallBess.rechargeOK) flags.push(flag('bess-recharge', 'minor', 'Grid', `Battery for the shortfall cannot recharge from the grid headroom on the design day from month ${sz.shortfallBess.failMonth}: it does not count as firm supply against the design load`));
  if (sz.storage.role === 'peakShave' && sz.storage.mw > 0 && disp.years.some((y) => y.designDayShortfall)) {
    flags.push(flag('grid-bess-peakshave', 'minor', 'Grid', 'BESS peak-shave cannot hold import within grid capacity on the design day'));
  }
  // Grid connection charge left at its default 0 (work package 3, AC 18): flagged "assumed" on every grid-connected option.
  if (v.C1 !== 'islanded' && inputs.grid.fullMW > 0 && contractLimit(inputs, v.C1) > 0 && !(Number(inputs.grid.connectionCharge) > 0)) {
    const ex = expectedConnectionCharge(inputs, v.C1);
    flags.push(flag('grid-charge-assumed', 'info', 'Grid', `Grid connection charge assumed €0 (the default, indicative — unverified); at the standard rate of €${Math.round(ex.rate / 1000)}k per MW (${ex.band.toUpperCase()}) the ${Math.round(ex.mw)} MW contracted would cost about €${(ex.amount / 1e6).toFixed(1)} m`, { value: ex.amount }));
  }
  if (v.C1 !== 'islanded') flags.push(...gridChargeFlags(ctx, v, eco));
  for (const s of sz.grid.shortfalls) flags.push(flag('grid-shortfall', 'info', 'Grid', `Grid shortfall at design load: up to ${s.mw.toFixed(1)} MW in months ${s.from}–${s.to}`));
  if (v.C1 === 'export' && inputs.grid.exportMW > 0) {
    const exp = disp.years.reduce((s, y) => s + y.curtailMWh, 0);
    if (exp > 1e-6) flags.push(flag('grid-export', 'info', 'Grid', 'Surplus above export capacity is curtailed'));
  }

  // Permitting
  // The same triggers set the permitting allowance in the programme (permitting.js, OPEN-QUESTIONS 45).
  const { combustion, thermal, fuelT, h2t } = permittingTriggers(sz, v, req);
  if (thermal >= req.iedMWth) flags.push(flag('permit-ied', 'major', 'Permitting', `Aggregated combustion thermal input ${Math.round(thermal)} MWth ≥ ${req.iedMWth} MWth (IED threshold).${permitSuffix}`, { permitting: true, value: thermal, threshold: req.iedMWth }));
  const mcp = combustion.filter((c) => c.unitMW / c.eff >= req.mcpMinMWth && c.unitMW / c.eff < req.mcpMaxMWth);
  if (mcp.length) flags.push(flag('permit-mcp', 'minor', 'Permitting', `Individual combustion units of ${mcp.map((c) => `${(c.unitMW / c.eff).toFixed(1)} MWth (${c.name})`).join(', ')} are within ${req.mcpMinMWth}–${req.mcpMaxMWth} MWth (medium combustion plant rules).${permitSuffix}`, { permitting: true }));
  if (fuelT >= req.sevesoFuelT) flags.push(flag('permit-seveso-fuel', 'major', 'Permitting', `Hazardous substance storage above threshold: ${Math.round(fuelT).toLocaleString('en-GB')} t diesel/HVO ≥ ${req.sevesoFuelT.toLocaleString('en-GB')} t.${permitSuffix}`, { permitting: true }));
  if (sz.prime && sz.prime.tech === 'hydrogen') {
    flags.push(flag('permit-h2', h2t >= req.sevesoH2t ? 'major' : 'minor', 'Permitting', `Hydrogen storage ${h2t.toFixed(0)} t on site${h2t >= req.sevesoH2t ? ` ≥ ${req.sevesoH2t} t (hazardous substance storage above threshold)` : ''}; large separation distances, hazardous-substance flag always raised.${permitSuffix}`, { permitting: true }));
  }
  // Permitting outlook (OPEN-QUESTIONS 46): one flag listing every held item, its outlook and its float. Minor when an
  // item is "unlikely" or not ready when first needed; info otherwise. Not a permitting flag for deliverability (it
  // restates the IED/Seveso flags above with timing), so it changes no score.
  if (sz.permitOutlook && sz.permitOutlook.length) {
    const worry = sz.permitOutlook.some((x) => x.outlook === 'unlikely' || (x.floatMonths != null && x.floatMonths < 0));
    const txt = sz.permitOutlook.map((x) => `${x.name} (${x.role === 'bridge' ? 'bridging' : x.role}; ${x.regimes.join(', ')}): ${x.outlook}; ready month ${x.readyMonth}${x.neededMonth == null ? '' : `, needed month ${x.neededMonth}, ${x.floatMonths >= 0 ? `${x.floatMonths} months' float` : `${-x.floatMonths} months late`}`}`).join('; ');
    flags.push(flag('permit-outlook', worry ? 'minor' : 'info', 'Permitting', `Permitting outlook: ${txt}.${permitSuffix}`, { items: sz.permitOutlook.length }));
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
  const usesGas = [sz.prime, sz.bridge].some((p) => p && TECH[p.tech].fuel === 'gas' && !TECH[p.tech].offsite) || (sz.backup.tech && TECH[sz.backup.tech].fuel === 'gas');
  // Work package 25 (OPEN-QUESTIONS 229, 232): the gas price's date and the published forecast it follows.
  if (usesGas && !Number.isFinite(inputs.economics.gasEscalation)) flags.push(flag('fuel-gas-path', 'info', 'Fuel and utilities', `Gas price follows the published forecast (World Bank outlook April 2026, then TYNDP 2026): from €${ctx.gasCommodity.toFixed(1)}/MWh_th it falls to about €${(ctx.gasCommodity * gasPathFactor(ctx.baseYear)).toFixed(0)} in ${ctx.baseYear} and €${(ctx.gasCommodity * gasPathFactor(2030)).toFixed(0)} in 2030, far below the TTF price of November 2026 (€85.6/MWh), so gas gets cheaper over time in this model (OPEN-QUESTIONS 232)`));
  if (usesGas && !Number.isFinite(inputs.utilities.gasPrice) && typeof GAS_PRICE_WB === 'object' && ctx.gasCommodity === GAS_PRICE_WB.value) flags.push(flag('fuel-gas-month', 'info', 'Fuel and utilities', `Gas commodity price €${GAS_PRICE_WB.value}/MWh_th: the World Bank "Natural gas, Europe" price for July 2026, the latest month read (later months exist and were not read); 2025 average €${GAS_PRICE_WB.avg2025} for comparison. Enter a current quote to replace it (OPEN-QUESTIONS 229)`));
  if (usesGas && inputs.utilities.gasAvailable === 'Unknown') flags.push(flag('fuel-gas-unknown', 'minor', 'Fuel and utilities', 'Gas connection unconfirmed (gas availability "Unknown")'));
  if (usesGas && inputs.utilities.gasAvailable !== 'No') flags.push(flag('fuel-gas-assumed', 'info', 'Fuel and utilities', 'Gas capacity and date assumed, not confirmed'));
  if (usesGas && inputs.utilities.gasAvailable === 'No') flags.push(flag('fuel-gas-none', 'major', 'Fuel and utilities', 'Gas-using plant with gas availability "No": the plant does not run'));
  const usesH2 = sz.prime && sz.prime.tech === 'hydrogen';
  if (usesH2 && inputs.utilities.hydrogenAvailable !== 'Yes') flags.push(flag('fuel-h2-unavailable', 'major', 'Fuel and utilities', 'Hydrogen supply unavailable at current inputs'));
  if (usesH2 && inputs.utilities.hydrogenAvailable === 'Yes') flags.push(flag('fuel-h2-assumed', 'minor', 'Fuel and utilities', 'Hydrogen supply assumed (date and price unconfirmed)'));
  if (typeof inputs.utilities.waterAvailable === 'number' && carb.waterM3 != null && carb.waterM3 / 365 > inputs.utilities.waterAvailable) flags.push(flag('fuel-water', 'minor', 'Fuel and utilities', `Water use ${Math.round(carb.waterM3 / 365)} m³/day above availability`));
  if (v.C2 === 'dieselPrime') flags.push(flag('fuel-diesel-prime', 'minor', 'Fuel and utilities', 'HVO-diesel prime bridging (flagged in §8 C2)'));
  // Work package 20 (OPEN-QUESTIONS 136): with the PUE entered directly, the split between cooling and other loads is not
  // known, so the CHP's recovered heat is not credited against mechanical cooling.
  if (sz.prime && sz.prime.tech === 'chp') flags.push(flag('tech-chp-no-credit', 'info', 'Technology', 'Absorption-chiller credit not modelled: the PUE is entered directly, so the CHP\'s recovered heat is not credited against the cooling load'));

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

  // Existing gas plant near the site (work package 19, OPEN-QUESTIONS 116–122): where its values came from, when it
  // stops, the takeover of its grid connection (an assumption until the country rules are researched), and common
  // ownership when bought. Flags only: nothing is hidden, demoted or resized (principle 5).
  const ym = (m) => addMonths(inputs.project.analysisStart, m);
  const eurM = (x) => `€${(x / 1e6).toFixed(x >= 1e8 ? 0 : 1)} m`;
  const cands = plantCandidates(inputs).all;
  const BASIS = { list: 'the bundled list', default: 'default', type: 'by type', entered: 'entered', none: 'not known' };
  for (const p of [sz.prime, sz.bridge]) {
    if (!p) continue;
    const t = TECH[p.tech];
    if (!t || !t.existingPlant) continue;
    const c = cands.find((x) => x.id === t.plantKey);
    if (c && !c.manual) {
      const b = c.basis;
      flags.push(flag('plant-values', 'info', 'Existing plant', `${c.name} (${c.km.toFixed(1)} km): values from ${PLANT_SOURCE.credit} and defaults, to check with the plant's owner: ${Math.round(c.mw)} MW (${BASIS[b.mw]}) in ${c.units} units of ${Math.round(c.unitMW)} MW (${BASIS[b.units]}), first year ${c.firstYear ?? 'not known'} (${BASIS[b.firstYear]}), closure ${c.closeYear ?? 'not known'} (${b.closeYear === 'default' ? `default: ${PLANT_DEFAULTS.lifeYears} years after the first year${c.defaultPassed ? ', already passed, so treated as running with its closure unknown' : ''}` : BASIS[b.closeYear]}), efficiency ${Math.round(c.eff * 100)} % (${BASIS[b.eff]}); ${t.lease ? `lease €${c.leasePerKWMonth}/kW a month` : `bought${t.wholePlant ? ' whole' : c.manual ? '' : ' in part (assumes the owner sells only the units used)'} at €${c.buyPerKW}/kW plus €${c.refurbPerKW}/kW refurbishment, fixed O&M €${c.fomPerKW}/kW a year`}, connection to the campus ${eurM(c.linkCapex)} (${b.linkCapex === 'default' ? 'default: straight line × the cable rate' : BASIS[b.linkCapex]}).`, { plant: c.id }));
    }
    if (p.endMonth < inputs.economics.periodYears * 12) {
      const own = ctx.takeover && ctx.takeover.plant.id === t.plantKey;
      flags.push(flag('plant-closes', 'minor', 'Existing plant', `${t.name} stops in month ${p.endMonth} (${ym(p.endMonth)})${own ? `, when the campus takes over its grid connection${t.lease ? '; assumed the owner keeps it running until then' : ''}` : ''}${p.endMonth <= p.availMonth ? ': it never supplies the campus' : '; from then on it supplies nothing, and nothing new is sized to replace it (see the adequacy and resilience flags)'}.`, { plant: t.plantKey, value: p.endMonth }));
    }
    if (t.bought) flags.push(flag('plant-ownership', 'minor', 'Existing plant', `${t.name}: bought, it keeps its own permit and is not added to the campus's combustion total; one owner of neighbouring sites may be treated as one installation (a point for the permitting adviser). Screening flag, not a permitting determination.`, { plant: t.plantKey }));
  }
  // Work package 29 (OPEN-QUESTIONS 167, 169, 177–191): a plant's output may be committed elsewhere; the supply contract
  // and the plant's other income, with their bases.
  for (const role of [sz.prime, sz.bridge]) {
    const t = role && TECH[role.tech];
    if (!t || !t.existingPlant) continue;
    flags.push(flag('plant-committed', 'minor', 'Existing plant', `${t.name}: its output may already be committed to another buyer (for example a long-term contract with the plant's other owner); confirm with the owner before relying on it (OPEN-QUESTIONS 169)`, { plant: t.plantKey }));
    if (t.contract) {
      const how = t.p.contractMethod === 'costPlus' ? `the plant's fuel, carbon and running cost plus a margin of €${t.p.contractMargin}/MWh` : t.p.contractMethod === 'market' ? `the grid's average wholesale price (one flat figure a year, not hourly: OPEN-QUESTIONS 239) ${t.p.contractAdder >= 0 ? 'plus' : 'less'} €${Math.abs(t.p.contractAdder)}/MWh` : `a fixed €${t.p.contractPrice}/MWh`;
      flags.push(flag('plant-contract', 'info', 'Existing plant', `${t.name}: priced at ${how}, about €${contractPrice(ctx, t).toFixed(1)}/MWh in the first year; ${t.p.contractRoute === 'grid' ? `delivered through the public grid, so the grid's per-MWh adder (€${ctx.priceAdder.toFixed(1)}) is added; the contract's MW are not checked against the contracted grid capacity (OPEN-QUESTIONS 239), and the rule of 2026-10-18 applies (no benefit without physical delivery)` : 'delivered by private wire, outside the grid connection, so no grid charges apply; the wire is costed as the connection to the campus'} (OPEN-QUESTIONS 166–168)`, { plant: t.plantKey }));
    }
  }
  for (const pi of (eco && eco.plantIncome) || []) {
    if (pi.share > 0) flags.push(flag('plant-surplus', 'info', 'Existing plant', `${pi.name}: the plant keeps selling the ${Math.round(pi.capMW)} MW the campus holds and does not use, at one flat price a year (no export factor), when it beats its running cost (€${pi.cost.toFixed(1)}/MWh); the campus keeps ${Math.round(pi.share * 100)} % (entered): €${(pi.revenue / 1e6).toFixed(1)} m over the evaluation period (OPEN-QUESTIONS 177–190)`));
    if (pi.standbyPerMWYear > 0) flags.push(flag('plant-standby', 'info', 'Existing plant', `${pi.name}: standby and flexibility income €${Math.round(pi.standbyPerMWYear).toLocaleString('en-GB')} per MW a year (entered): €${(pi.standby / 1e6).toFixed(1)} m over the evaluation period. Income per MWh when called is not modelled, since the hours called are not known (OPEN-QUESTIONS 191, 239)`));
  }
  if (ctx.takeover) {
    const k = ctx.takeover;
    flags.push(flag('plant-takeover-mode', 'info', 'Existing plant', k.add
      ? `The taken-over connection comes as well as the campus's new ${Math.round(inputs.grid.fullMW)} MW connection, which is paid for in full (OPEN-QUESTIONS 126)`
      : `The taken-over connection replaces ${Math.round(Math.min(k.mw, inputs.grid.fullMW))} MW of the campus's new connection from month ${k.month}: the new connection is ${Math.round(k.newMW)} MW, with its substation, charge and cable route reduced to match; the contracted capacity caps the new connection only (OPEN-QUESTIONS 126)`, { plant: k.plant.id }));
    flags.push(flag('plant-takeover', 'major', 'Existing plant', `${k.plant.defaultPassed ? `${k.plant.name} has no closure date and its ${PLANT_DEFAULTS.lifeYears}-year default has passed: the date its connection comes free is a guess (OPEN-QUESTIONS 125). ` : ''}Grid connection taken over from ${k.plant.name}: ${Math.round(k.mw)} MW${k.mw + 1e-6 < k.offeredMW ? ` (of its ${Math.round(k.offeredMW)} MW, capped at the campus's design load)` : ''} from month ${k.month} (${ym(k.month)}), ${eurM(k.cost)} at €${Math.round(k.costPerMW / 1000)}k/MW. ${takeoverRule(ctx.country)} ${TAKEOVER_GENERAL} Size, date (${k.plant.takeoverLagMonths} months after the plant stops) and cost are judgement defaults (OPEN-QUESTIONS 120).`, { plant: k.plant.id, value: k.mw }));
  }

  // Utilities near the site (work package 32, OPEN-QUESTIONS 222–225, 234–235): warnings only, in the agreed order.
  flags.push(flag('utilities-near', 'info', 'Site and utilities', `Utilities near the site (warnings only; no mapped distance changes a cost; check each with the local operators): ${utilitiesText(Number(ctx.inputs.project.lat), Number(ctx.inputs.project.lon))}`));
  // Ireland's large energy user policy (OPEN-QUESTIONS 198, 210–213): a minor flag on every Irish option, with the
  // de-rated plant test. Never hides, demotes or resizes an option.
  if (ctx.country === 'IE') flags.push(irelandFlag(ctx, v, sz));
  // Great Britain's proposed commitment fee (OPEN-QUESTIONS 199, 206–209).
  const fee = eco && eco.gbFee;
  if (fee) flags.push(flag('grid-gb-fee', 'minor', 'Grid', fee.applies
    ? `Data Centre Commitment Fee: €${Math.round(fee.perMW).toLocaleString('en-GB')} per MW × ${Math.round(fee.mw)} MW = €${(fee.deposit / 1e6).toFixed(1)} m paid on day 1, returned stage by stage as the grid capacity comes (cost: the money tied up, €${(fee.pvCost / 1e6).toFixed(1)} m at the discount rate). ${GB_FEE.source}. Ofgem's text returns the deposit at energisation in one sum; stage-by-stage return is not confirmed (OPEN-QUESTIONS 208)`
    : fee.reason, { value: fee.pvCost || 0 }));
  // Site fit flags come from the layout (sitefit.js) and are added in the flags stage of the run.
  return flags;
}

// The de-rated plant test of Ireland's policy (OPEN-QUESTIONS 198, 210–213). Import: the option's largest contracted
// grid MW over the study, in MVA at power factor 0.975 (212). Counted: plant the option runs as market plant (prime and
// retained bridging plant), its economic battery and its on-site solar and wind; standby gensets do not count (211).
function irelandFlag(ctx, v, sz) {
  const over = (ctx.inputs.ireland && ctx.inputs.ireland.derating) || {};
  const cc = v.C1 === 'islanded' ? [0] : contractedCap(ctx, v.C1);
  let impMW = 0; for (const x of cc) if (x > impMW) impMW = x;
  const imp = impMW / IE_POLICY.powerFactor;
  const parts = [];
  let derated = 0;
  const thermal = (p, label) => {
    if (!p || !(p.mw > 0)) return;
    const t = TECH[p.tech];
    if (!t || t.role === 'backup') return;
    const unit = p.unitMW || (t.p && t.p.unitMW) || p.mw;
    const f = ieGasFactor(unit, over);
    derated += p.mw * f; parts.push(`${label} ${Math.round(p.mw)} MW × ${f}`);
  };
  thermal(sz.prime, 'firm plant');
  if (sz.bridge && ['prime', 'split', 'gridServices'].includes(v.C3)) thermal(sz.bridge, 'retained bridging plant');
  if (sz.storage && sz.storage.mw > 0) { const h = sz.storage.mwh / sz.storage.mw; const f = ieStorageFactor(h, over); derated += sz.storage.mw * f; parts.push(`battery ${Math.round(sz.storage.mw)} MW (${h.toFixed(0)} h) × ${f}`); }
  const pv = (sz.solarRoofMWp || 0) + (sz.solarGroundMWp || 0);
  const fs = Number.isFinite(over.solar) ? over.solar : IE_POLICY.table.solar, fw = Number.isFinite(over.wind) ? over.wind : IE_POLICY.table.wind;
  if (pv > 0) { derated += pv * fs; parts.push(`solar ${pv.toFixed(1)} MWp × ${fs}`); }
  if (sz.windMW > 0) { derated += sz.windMW * fw; parts.push(`wind ${Math.round(sz.windMW)} MW × ${fw}`); }
  const applies = imp >= IE_POLICY.thresholdMVA;
  const ok = !applies || derated >= imp - 1e-6;
  const test = !applies ? `This option imports ${imp.toFixed(1)} MVA, below the 10 MVA threshold.`
    : `This option: import ${Math.round(impMW)} MW = ${imp.toFixed(1)} MVA at power factor ${IE_POLICY.powerFactor} (judgement, OPEN-QUESTIONS 212); de-rated plant ${derated.toFixed(1)} MW${parts.length ? ` (${parts.join('; ')})` : ' (none)'}: ${ok ? 'covers the import' : `short by ${(imp - derated).toFixed(1)} MW`}. Standby gensets do not count (OPEN-QUESTIONS 211). Factors: ${IE_POLICY.table.source}${Object.keys(over).length ? ', with the engineer\'s overrides' : ''}; ${IE_POLICY.table.note} Checked at full build, not year by year.`;
  return flag('ireland-leu', 'minor', 'Grid', `${IE_POLICY.text} ${test}`, { value: ok ? 0 : imp - derated, pass: ok });
}

// Every flag of an option as the run assembles it (run.js flags stage): the §15 flags above, the site-fit flags
// (sitefit.js; none carries permitting: true, so they never enter deliverability) and the data flag on every option
// (all defaults are C-tagged). Shared by the run and by evaluateOption (option.js), so both give the same list.
export function allOptionFlags(ctx, v, sz, disp, ttp, eco, carb, res, siteFit) {
  ctx = ctxFor(ctx, v); // work package 19: a taken-over grid connection
  const flags = optionFlags(ctx, v, sz, disp, ttp, eco, carb, res);
  if (siteFit) flags.push(...siteFit.flags);
  flags.push(flag('data-unverified', 'info', 'Data', 'Result depends on C-tagged (indicative — unverified) parameters and synthetic profiles'));
  // Assumed defaults (work package 2, AC 16): one info flag per key input not entered that the option uses.
  flags.push(...assumedFlags(ctx, v, sz, flag));
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
  const usesGas = [sz.prime, sz.bridge].some((p) => p && TECH[p.tech].fuel === 'gas' && !TECH[p.tech].offsite) || (sz.backup.tech && TECH[sz.backup.tech].fuel === 'gas');
  if (usesGas && ctx.inputs.utilities.gasAvailable === 'Unknown') items.push({ item: 'Gas used with availability "Unknown"', value: 1, points: -P.gasUnknownPenalty });
  if (sz.prime && sz.prime.tech === 'hydrogen') items.push({ item: 'Hydrogen fuel dependency', value: 1, points: -P.hydrogenPenalty });
  const techIds = new Set(cap.map((c) => c[0]).filter((id) => TECH[id] && TECH[id].p.procM !== undefined));
  const longLead = [...techIds].filter((id) => TECH[id].p.procM > P.leadTimeThresholdM);
  if (longLead.length) items.push({ item: `Procurement lead time > ${P.leadTimeThresholdM} months: ${longLead.map((id) => TECH[id].name).join(', ')}`, value: longLead.length, points: -P.leadTimePenalty * longLead.length });
  // Optional site-fit penalty (§9.9), off by default: only then does site fit enter the score, and the axis is
  // labelled "Deliverability (incl. site fit)". Site-fit flags never count as permitting flags above.
  // Backup pooled across the campus (OPEN-QUESTIONS 48): a client-perceived risk item, by default the penalty of a
  // minor permitting flag; the engineer can raise it to major (deliverability.pooledBackupRisk).
  if (v.C5a === 'pooled') {
    const major = P.pooledBackupRisk === 'major';
    items.push({ item: `Client-perceived risk: backup pooled across the campus (${major ? 'major' : 'minor'})`, value: 1, points: -(major ? P.majorFlagPenalty : P.minorFlagPenalty) });
  }
  const penaltyOn = !!P.siteFitPenalty;
  if (penaltyOn && siteFit && siteFit.status !== 'Fits') {
    const pts = siteFit.status === 'Does not fit' ? P.siteFitNoFitPenalty : P.siteFitFlagsPenalty;
    items.push({ item: `Site fit: ${siteFit.status} (optional site-fit penalty on)`, value: 1, points: -pts });
  }
  const score = Math.max(0, Math.min(100, 100 + items.reduce((s, i) => s + i.points, 0)));
  return { score, items, emergingShare: emerging, nascentShare: nascent, includesSiteFit: penaltyOn };
}

// Grid charge and tax flags (work package 24, OPEN-QUESTIONS 160–165, 202–205, 216–218, 233). Info unless a figure is
// missing or a saving depends on conditions. None of them is a permitting flag, so none moves the score.
function gridChargeFlags(ctx, v, eco) {
  const out = [];
  const cc = ctx.country;
  const gf = ctx.gridFixed || (ctx.baseCtx && ctx.baseCtx.gridFixed);
  const inputs = ctx.inputs;
  const eur = (x) => `€${x >= 1e6 ? `${(x / 1e6).toFixed(1)} m` : Math.round(x).toLocaleString('en-GB')}`;
  const fixedTotal = eco && eco.ledger ? eco.ledger.reduce((a, r) => a + (r.gridFixed || 0), 0) : 0;
  if (gf && gf.on) {
    if (gf.perMWBasis === 'none') out.push(flag('grid-permw-none', 'minor', 'Grid', `Grid charge per MW: no published value found for ${cc}${gf.data ? ` (${gf.data.perMWHow})` : ''}. Nothing is charged per MW until a figure is entered in section 4 (OPEN-QUESTIONS 165)`));
    else out.push(flag('grid-permw', 'info', 'Grid', `Grid charge per MW: ${eur(gf.perMW)} per MW of contracted capacity a year (${gf.perMWBasis === 'entered' ? 'entered' : `${gf.data.perMWHow}; ${gf.data.perMWSource}, ${gf.data.perMWUrl}, accessed ${gf.data.accessed}, sourced — not independently checked`}), charged on this option's contracted grid MW${gf.adderRemoved > 0 ? `; €${gf.adderRemoved.toFixed(1)}/MWh taken out of the per-MWh adder so it is not counted twice` : ''}. Over the evaluation period: ${eur(fixedTotal)}`));
    if (gf.lumpSum > 0) out.push(flag('grid-lumpsum', 'info', 'Grid', `Grid charge per site: ${eur(gf.lumpSum)} a year (${gf.lumpEntered ? 'entered' : `${GB_RESIDUAL.source}, ${GB_RESIDUAL.url}`}), the same for every option that uses the grid (OPEN-QUESTIONS 217)`));
    if (ctx.adderEntered) out.push(flag('grid-permw-adder-entered', 'info', 'Grid', 'Grid charge per MW with an entered per-MWh adder: the entered adder is used as entered; check that it leaves out the per-MW charges, or they are counted twice (OPEN-QUESTIONS 236)'));
    if (cc === 'LV') out.push(flag('grid-lv-transformer', 'minor', 'Grid', 'Latvia charges its capacity fee on transformer capacity, usually larger than the contracted MW; the tool charges the contracted MW, so the charge is understated (for example 150 MVA of transformers against 100 MW contracted: about €1.01 m against €0.68 m a year at 330 kV) (OPEN-QUESTIONS 218)'));
  }
  if (inputs.grid.flatLoadDiscount) {
    if (gf && gf.discount && !ctx.adderEntered) out.push(flag('grid-de-discount', 'minor', 'Grid', `Discount for a large flat load ticked (Germany, ${DE_DISCOUNT.source}): the network part falls to 20 / 15 / 10 % at 7,000 / 7,500 / 8,000 use hours a year, from this option's own grid use. Needs the regulator's approval; uncertain for a new campus (OPEN-QUESTIONS 216)`));
    else if (gf && gf.discount) out.push(flag('grid-de-discount', 'info', 'Grid', 'Discount for a large flat load ticked, but the per-MWh adder is entered: the tool cannot tell its network part, so no discount is applied'));
    else out.push(flag('grid-discount-none', 'info', 'Grid', `Discount for a large flat load ticked: no rule researched for ${cc} yet (only Germany; the others are on the further research list), so nothing is applied`));
  }
  const tax = DC_TAX[cc];
  if (tax && !ctx.adderEntered) {
    const reduced = !!inputs.grid.dcReducedRate && !!CONDITIONAL_RATE[cc];
    out.push(flag('grid-dc-tax', reduced ? 'minor' : 'info', 'Grid', `${reduced && tax.reduced ? tax.reduced : tax.normal} Local website: ${tax.site} (OPEN-QUESTIONS 204)`));
  }
  if (cc === 'IE' && !ctx.adderEntered) out.push(flag('grid-ie-check', 'info', 'Grid', "Ireland's adder counts EirGrid's system services charge (about €27/MWh, network part) and SEMO's imperfections charge (€18.81/MWh, market charges) as two separate bills; the two documents have not been read side by side. Network charges are the 2025/26 rates (EirGrid, approved by CRU; the 2026/27 rates were not read)"));
  if ((cc === 'GB' || cc === 'IE') && v.C1 !== 'islanded') out.push(flag('grid-price-calibration', 'info', 'Grid', `The hourly wholesale price for ${cc} is a synthetic profile calibrated to an indicative yearly average (${cc === 'GB' ? '€95' : '€110'}/MWh, indicative — unverified); its calibration to published wholesale prices is not confirmed`));
  return out;
}
