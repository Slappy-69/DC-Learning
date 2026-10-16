// Hourly dispatch engine (BRIEF §9.4). Full chronological 8760-hour years with carried BESS SOC.
//
// Merit order (same six steps as the delivered v1 tool):
//   1. On-site renewables (solar, wind) serve load first.
//   2. PPA energy, delivered over the grid connection (uses import capacity).
//   3. BESS discharges per role (shortfall cover and/or expensive hours); charges from
//      surplus on-site generation or cheap grid within the import cap.
//   4. Firm on-site generation against the hourly marginal cost of grid import, respecting
//      min stable load per unit. Must-run in islanded operation. Run-hour limits per setting.
//   5. Grid import up to the offered capacity for that period ("Show unmet load"), or
//      uncapped with the excess recorded ("Show exceedance").
//   6. Demand flexibility (if on). Any remaining demand is recorded as unmet load.
//
// Hourly energy balance (MWh in a 1 h step, so MW = MWh):
//   renewables + PPA delivered + BESS discharge + firm + grid import + unmet
//     = net demand + BESS charge + curtailment + export
// where net demand = facility demand − absorption-chiller credit − flexed demand.
// BESS losses = charge − discharge − ΔSOC (stored-energy accounting).
// So: supply (generation + imports + discharge) = demand + charge + curtailment + export − unmet.

import { H } from './profiles.js';
import { demandYear } from './context.js';
import { TECH, FUEL, PPA } from './defaults.js';
import { techAvailMonth } from './sizing.js';

export const MERIT_ORDER = [
  'On-site renewables (solar, wind)',
  'PPA over the grid connection (uses import capacity)',
  'BESS discharge (per role)',
  'Firm on-site generation (economic vs grid marginal cost; must-run when islanded)',
  'Grid import (up to the offered capacity in "Show unmet load")',
  'Demand flexibility (if on), then unmet load (recorded and flagged)',
];

function fuelPrice(ctx, fuel) {
  if (fuel === 'gas') return ctx.gasPrice;
  if (fuel === 'diesel') return FUEL.dieselPrice;
  if (fuel === 'hvo') return FUEL.hvoPrice;
  if (fuel === 'hydrogen') return FUEL.hydrogenPrice;
  return 0;
}
export function fuelEF(fuel) {
  if (fuel === 'gas') return FUEL.efGas;
  if (fuel === 'diesel') return FUEL.efDiesel;
  if (fuel === 'hvo') return FUEL.efHvo;
  return 0;
}
export function plantMarginalCost(ctx, pl) {
  const t = TECH[pl.tech];
  if (pl.tech === 'smr') return t.p.fuelPerMWhE + t.p.vomPerMWh;
  return fuelPrice(ctx, pl.fuel) / pl.eff + (t.p.vomPerMWh || 0) + (ctx.carbonPrice * fuelEF(pl.fuel)) / pl.eff;
}
export { fuelPrice };

// Normalised hourly PPA shape (sums to 1 over the year). Demand-shaped for 24/7.
function ppaShape(ctx, type, Dyear) {
  const p = ctx.prof;
  const s = new Float64Array(H);
  let sum = 0;
  for (let h = 0; h < H; h++) {
    let x;
    if (type === 'solar') x = p.solar[h];
    else if (type === 'wind') x = p.wind[h];
    else if (type === 'hybrid') x = 0.5 * p.solar[h] / ctx.prof.stats.solarYield * H + 0.5 * p.wind[h] / ctx.prof.stats.windCF;
    else if (type === 'baseload') x = 1;
    else x = Dyear[h];
    s[h] = x;
    sum += x;
  }
  if (sum > 0) for (let h = 0; h < H; h++) s[h] /= sum;
  return s;
}

// Build the dispatch configuration from sizing: everything the hourly loop needs.
export function dispatchConfig(ctx, v, sz) {
  const inputs = ctx.inputs;
  const avail = (id) => (TECH[id].p.planM || 0) + (TECH[id].p.procM || 0) + (TECH[id].p.buildM || 0);
  const plants = sz.plants.map((pl) => ({ ...pl, mc: plantMarginalCost(ctx, pl), units: Math.max(1, Math.round(pl.mw / pl.unitMW)),
    chpK: pl.tech === 'chp' ? TECH.chp.p.heatToPower * TECH.chp.p.absorptionCOP : 0 }));
  const durationH = sz.storage.mw > 0 ? sz.storage.mwh / sz.storage.mw : 0;
  const cfg = {
    coolingId: sz.coolingId,
    islanded: v.C1 === 'islanded',
    exportMW: v.C1 === 'export' ? inputs.grid.exportMW : 0,
    exceedance: inputs.settings.gridHandling === 'exceedance',
    respectRunHours: inputs.settings.runHourHandling === 'respect' && inputs.requirements.maxRunHours != null,
    maxRunHours: inputs.requirements.maxRunHours,
    solarMWp: sz.solarMWp, solarAvailM: Math.min(sz.solarGroundMWp > 0 ? avail('solarGround') : Infinity, sz.solarRoofMWp > 0 ? avail('solarRoof') : Infinity),
    windMW: sz.windMW, windAvailM: sz.windMW > 0 ? avail('wind') : Infinity,
    bessMW: sz.storage.mw, bessMWh: sz.storage.mwh, bessAvailM: sz.storage.mw > 0 ? techAvailMonth(ctx, TECH.bess) : Infinity,
    bessRole: sz.storage.role, bessDurN: durationH >= 8 ? 12 : durationH >= 3 ? 4 : durationH >= 1.5 ? 2 : 1,
    rte: TECH.bess.p.rte,
    ppaType: sz.ppa ? sz.ppa.type : null, ppaCoverage: sz.ppa ? sz.ppa.coverage : 0,
    flex: v.C16 === 'on',
    plants,
  };
  // All battery capacity (main and bridging) supplies from the BESS supply-available month (BRIEF §9.8:
  // project start + planning + procurement + construction), the same month time-to-power uses.
  return cfg;
}

export function dispatchKey(cfg) {
  return JSON.stringify([cfg.coolingId, cfg.islanded, cfg.exportMW, cfg.exceedance, cfg.respectRunHours, cfg.maxRunHours,
    +cfg.solarMWp.toFixed(6), cfg.solarAvailM, +cfg.windMW.toFixed(6), cfg.windAvailM, +cfg.bessMW.toFixed(6), +cfg.bessMWh.toFixed(6), cfg.bessAvailM, cfg.bessRole,
    cfg.ppaType, cfg.ppaCoverage, cfg.flex,
    cfg.plants.map((p) => [p.role, p.tech, +p.mw.toFixed(6), Array.from(p.mode).join('')])]);
}

// Which model years must be dispatched explicitly? Years after the last change repeat (steady state).
export function dispatchYears(ctx, cfg) {
  let lastChangeM = Math.max(ctx.lastPhaseM + ctx.inputs.load.rampMonths, ctx.fullGridM);
  for (let m = 1; m < ctx.gridCap.length; m++) if (ctx.gridCap[m] !== ctx.gridCap[m - 1]) lastChangeM = Math.max(lastChangeM, m);
  for (const m of [cfg.solarAvailM, cfg.windAvailM, cfg.bessAvailM]) if (Number.isFinite(m)) lastChangeM = Math.max(lastChangeM, m);
  for (const p of cfg.plants) {
    for (let m = 1; m < p.mode.length; m++) if (p.mode[m] !== p.mode[m - 1]) lastChangeM = Math.max(lastChangeM, m);
  }
  const lastYear = Math.floor(Math.max(0, lastChangeM) / 12);
  return Math.min(lastYear + 1, ctx.inputs.settings.maxDispatchYears, Math.floor(ctx.nMonths / 12));
}

function emptyYear() {
  return {
    demandMWh: 0, grossDemandMWh: 0, netDemandMWh: 0, servedMWh: 0, unmetMWh: 0, unmetHours: 0, unmetPeakMW: 0,
    exceedMWh: 0, exceedHours: 0, exceedPeakMW: 0,
    gridMWh: 0, gridChargeMWh: 0, gridCost: 0, gridCarbonT: 0, ppaCarbonT: 0, gridCarbonWeighted: 0,
    reGenMWh: 0, solarMWh: 0, windMWh: 0, reUsedMWh: 0, curtailMWh: 0, exportMWh: 0, exportRevenue: 0,
    ppaContractMWh: 0, ppaDeliveredMWh: 0, ppaResaleValue: 0, ppaLimitedMWh: 0, ppaLimitedHours: 0,
    bessChargeMWh: 0, bessDischargeMWh: 0, bessLossMWh: 0, socStart: 0, socEnd: 0,
    firmMWh: 0, chpCreditMWh: 0, flexMWh: 0, cfeMWh: 0, itMWh: 0,
    plants: [], designDayShortfall: false, maxBalanceError: 0,
  };
}

// Dispatch one model year. Returns aggregates and (optionally) hourly arrays.
export function dispatchYear(ctx, cfg, y, socIn, record = false) {
  const dem = demandYear(ctx, cfg.coolingId, y);
  const { D, M, IT } = dem;
  const p = ctx.prof;
  const priceMult = ctx.priceMult;
  const adder = ctx.priceAdder;
  const cMult = ctx.carbonMult;
  const out = emptyYear();
  const nP = cfg.plants.length;
  const plantMWh = new Float64Array(nP);
  const plantHours = new Float64Array(nP);
  const plantFuel = new Float64Array(nP);
  const plantMslCurtail = new Float64Array(nP);
  const eta = Math.sqrt(cfg.rte);
  const E = cfg.bessMWh;
  const Pb = cfg.bessMW;
  let soc = socIn == null ? E * TECH.bess.p.socInit : Math.min(socIn, E);
  out.socStart = soc;
  const role = cfg.bessRole;
  const cheap = p.cheap[cfg.bessDurN];
  const dear = p.dear[cfg.bessDurN];
  const ppaShp = cfg.ppaType ? ppaShape(ctx, cfg.ppaType, D) : null;
  const ppaVol = cfg.ppaType ? cfg.ppaCoverage * dem.sum : 0;
  out.ppaContractMWh = ppaVol;
  const designDay = Math.floor(indexOfMax(p.temp) / 24);
  const flexMax = ctx.inputs.load.flexMaxPct;
  let flexHoursLeft = cfg.flex ? ctx.inputs.load.flexHours : 0;
  const gridCap = ctx.gridCap;
  // Hoisted locals for the hot loop
  const islanded = cfg.islanded;
  const exceedance = cfg.exceedance;
  const respectRH = cfg.respectRunHours;
  const maxRH = cfg.maxRunHours;
  const solarMWp = cfg.solarMWp, solarAvailM = cfg.solarAvailM, windMW = cfg.windMW, windAvailM = cfg.windAvailM;
  const bessAvailM = cfg.bessAvailM, exportMW = cfg.exportMW, exportFactor = ctx.inputs.grid.exportFactor;
  const pSolar = p.solar, pWind = p.wind, pPrice = p.price, pCarbon = p.carbon;
  const plants = cfg.plants;
  const pMode = plants.map((pl) => pl.mode), pMW = plants.map((pl) => pl.mw), pMC = plants.map((pl) => pl.mc);
  const pChpK = plants.map((pl) => pl.chpK), pMsl = plants.map((pl) => pl.msl * pl.unitMW), pEff = plants.map((pl) => pl.eff);
  const pIsSmr = plants.map((pl) => pl.tech === 'smr');
  const copArr = ctx.cooling[cfg.coolingId].cop;
  const cleanRatio = cleanFirm(cfg, 1);
  const roleShort = role === 'peakShave' || role === 'bridgingSupport';
  const roleArb = role === 'peakShave' || role === 'shifting' || role === 'gridServices';
  const reserveE = role === 'peakShave' ? 0.5 * E : 0;
  const y12 = y * 12;
  let ppaNetworkCost = 0, ppaLimitedMWh = 0, ppaLimitedHours = 0, ppaDeliveredMWh = 0, ppaResaleValue = 0, exportRevenue = 0;
  let exceedMWh = 0, exceedHours = 0, exceedPeakMW = 0, grossDemandMWh = 0, netDemandMWh = 0, servedMWh = 0;
  let unmetMWh = 0, unmetHours = 0, unmetPeakMW = 0, designDayShortfall = false, gridMWh = 0, gridChargeMWh = 0;
  let gridCost = 0, gridCarbonT = 0, ppaCarbonT = 0, reGenMWh = 0, solarMWh = 0, windMWh = 0, reUsedMWh = 0;
  let curtailMWh = 0, exportMWh = 0, bessChargeMWh = 0, bessDischargeMWh = 0, firmMWh = 0, chpCreditMWh = 0;
  let flexMWh = 0, itMWh = 0, cfeMWh = 0, maxBalanceError = 0;

  let rec = null;
  if (record) {
    rec = {};
    for (const k of ['demand', 'net', 're', 'ppa', 'dis', 'ch', 'firm', 'grid', 'gridCharge', 'unmet', 'curt', 'exp', 'soc', 'cap', 'chpCredit', 'flex']) rec[k] = new Float64Array(H);
  }

  for (let h = 0; h < H; h++) {
    const hm = h < 8030 ? (h / 730) | 0 : 11;
    const m = y12 + hm;
    const D0 = D[h];
    const offered = gridCap[m];
    const capPhys = islanded ? 0 : offered; // physical connection: exceedance accounting and grid charging
    const capLoad = islanded ? 0 : (exceedance ? Infinity : offered);
    const gp = pPrice[h] * priceMult + adder;
    const ci = pCarbon[h] * cMult; // gCO2e/kWh; × MWh / 1000 = tCO2e

    // 1. On-site renewables serve load first
    const sol = m >= solarAvailM ? solarMWp * pSolar[h] : 0;
    const win = m >= windAvailM ? windMW * pWind[h] : 0;
    const re = sol + win;
    const reUse = re < D0 ? re : D0;
    let R = D0 - reUse;
    let sur = re - reUse;

    // 2. PPA over the grid connection (uses import capacity; never above the physical connection)
    let ppaUse = 0;
    let capRem = capLoad;
    let ppaV = 0;
    if (ppaShp) {
      ppaV = ppaShp[h] * ppaVol;
      const want = ppaV < R ? ppaV : R;
      ppaUse = want < capPhys ? want : capPhys;
      if (want - ppaUse > 1e-9) { ppaLimitedMWh += want - ppaUse; ppaLimitedHours++; }
      R -= ppaUse;
      if (capRem !== Infinity) capRem -= ppaUse;
      ppaDeliveredMWh += ppaUse;
      ppaNetworkCost += ppaUse * adder;
      ppaResaleValue += (ppaV - ppaUse) * gp; // unconsumed contract volume settled at spot (financial only)
    }

    // Firm capacity available this hour (for the BESS shortfall rule)
    let firmAvail = 0;
    for (let i = 0; i < nP; i++) if (pMode[i][m] > 0 && !(respectRH && plantHours[i] >= maxRH)) firmAvail += pMW[i];

    // 3. BESS discharge per role
    let dis = 0;
    const bessOn = Pb > 0 && m >= bessAvailM;
    if (bessOn && R > 0) {
      const maxDis = Pb < soc * eta ? Pb : soc * eta;
      if (roleShort && capRem !== Infinity) {
        const short = R - capRem - firmAvail;
        if (short > 0) dis = short < maxDis ? short : maxDis;
      }
      if (roleArb && dear[h]) {
        let av = (soc - dis / eta - reserveE) * eta;
        if (Pb - dis < av) av = Pb - dis;
        if (av > 0) dis += (R - dis) < av ? (R - dis) : av;
      }
      if (dis < 0) dis = 0;
      soc -= dis / eta;
      R -= dis;
    }

    // 4. Firm on-site generation: economic against grid marginal cost, or covering the grid shortfall; must-run when islanded
    let firm = 0;
    let chpCredit = 0;
    for (let i = 0; i < nP; i++) {
      const md = pMode[i][m];
      if (md === 0 || R <= 1e-12) continue;
      if (respectRH && plantHours[i] >= maxRH) continue;
      let P;
      let needed;
      if (md === 2) { P = R; needed = true; }
      else if (pMC[i] < gp) { P = R; needed = false; }
      else { P = capRem === Infinity ? 0 : R - capRem; needed = true; }
      if (P <= 1e-12) continue;
      let credit = 0;
      const cap = pMW[i];
      if (pChpK[i] > 0) {
        // Trigeneration: recovered heat drives absorption chillers that displace mechanical chiller power.
        // credit = P × (heat/power × COP_abs) / COP_mech, limited to the mechanical cooling load this hour.
        const kk = pChpK[i] / copArr[h];
        let P1 = P / (1 + kk);
        if (P1 * kk > M[h]) P1 = P - M[h];
        P = P1 > cap ? cap : P1;
        credit = P * kk < M[h] ? P * kk : M[h];
      } else if (P > cap) P = cap;
      const served = P;
      let excess = 0;
      if (P < pMsl[i]) {
        if (needed) { excess = pMsl[i] - P; P = pMsl[i]; }
        else continue;
      }
      firm += P;
      chpCredit += credit;
      R -= served + credit;
      if (R < 0) R = 0;
      sur += excess; // output above need at min stable load is curtailed (or charges the BESS)
      plantMslCurtail[i] += excess;
      plantMWh[i] += P;
      plantHours[i] += 1;
      if (!pIsSmr[i]) plantFuel[i] += P / pEff[i];
    }

    // 5. Grid import up to the offered capacity ("Show unmet load") or uncapped ("Show exceedance")
    let g = 0;
    if (!islanded) {
      g = R < capRem ? R : capRem;
      R -= g;
    }

    // 6. Demand flexibility (if on), then unmet load
    let flexed = 0;
    if (R > 1e-12 && flexHoursLeft > 0) {
      flexed = R < flexMax * IT[h] ? R : flexMax * IT[h];
      if (flexed > 0) { flexHoursLeft--; R -= flexed; }
    }
    const unmet = R > 1e-12 ? R : 0;

    // BESS charging (only in hours with no discharge): surplus on-site first, then cheap grid within the import cap
    let ch = 0;
    let gridCh = 0;
    if (bessOn && dis === 0) {
      const room = (E - soc) / eta;
      ch = sur < Pb ? sur : Pb;
      if (ch > room) ch = room;
      sur -= ch;
      if (!islanded && cheap[h]) {
        let head = capPhys - ppaUse - g;
        if (head > Pb - ch) head = Pb - ch;
        if (head > room - ch) head = room - ch;
        gridCh = head > 0 ? head : 0;
      }
      soc += (ch + gridCh) * eta;
    }
    // Export (Grid + export only) or curtail the remaining surplus
    let exp = 0;
    if (sur > 0 && exportMW > 0) {
      exp = sur < exportMW ? sur : exportMW;
      exportRevenue += exp * pPrice[h] * exportFactor;
    }
    const curt = sur - exp;

    const gridTotal = g + gridCh;
    const physImport = ppaUse + gridTotal;
    const isDesignDay = ((h / 24) | 0) === designDay;
    if (physImport > capPhys + 1e-9) {
      const ex = physImport - capPhys;
      exceedMWh += ex; exceedHours++; if (ex > exceedPeakMW) exceedPeakMW = ex;
      if (isDesignDay) designDayShortfall = true;
    }
    const netDemand = D0 - chpCredit - flexed;

    grossDemandMWh += D0;
    netDemandMWh += netDemand;
    servedMWh += netDemand - unmet;
    if (unmet > 0) { unmetMWh += unmet; unmetHours++; if (unmet > unmetPeakMW) unmetPeakMW = unmet; if (isDesignDay) designDayShortfall = true; }
    gridMWh += gridTotal;
    gridChargeMWh += gridCh;
    gridCost += gridTotal * gp;
    gridCarbonT += (gridTotal * ci) / 1000;
    ppaCarbonT += (ppaUse * ci) / 1000;
    reGenMWh += re; solarMWh += sol; windMWh += win;
    reUsedMWh += reUse;
    curtailMWh += curt;
    exportMWh += exp;
    bessChargeMWh += ch + gridCh;
    bessDischargeMWh += dis;
    firmMWh += firm;
    chpCreditMWh += chpCredit;
    flexMWh += flexed;
    itMWh += IT[h];
    // Hourly CFE (24/7 matching): on-site renewables used + hourly PPA volume up to residual load + carbon-free firm output.
    const resid = D0 - reUse;
    const clean = reUse + (ppaV < resid ? ppaV : resid) + firm * cleanRatio;
    cfeMWh += clean < netDemand ? clean : netDemand;

    if (rec) {
      rec.demand[h] = D0; rec.net[h] = netDemand; rec.re[h] = re; rec.ppa[h] = ppaUse; rec.dis[h] = dis; rec.ch[h] = ch + gridCh;
      rec.firm[h] = firm; rec.grid[h] = g; rec.gridCharge[h] = gridCh; rec.unmet[h] = unmet; rec.curt[h] = curt; rec.exp[h] = exp; rec.soc[h] = soc;
      rec.cap[h] = capPhys; rec.chpCredit[h] = chpCredit; rec.flex[h] = flexed;
    }
    // Per-hour energy balance: sources + unmet − (net demand + charge + curtailment + export)
    const err = re + ppaUse + dis + firm + gridTotal + unmet - (netDemand + ch + gridCh + curt + exp);
    const ae = err < 0 ? -err : err;
    if (ae > maxBalanceError) maxBalanceError = ae;
  }

  Object.assign(out, {
    ppaNetworkCost, ppaLimitedMWh, ppaLimitedHours, ppaDeliveredMWh, ppaResaleValue, exportRevenue, exceedMWh, exceedHours, exceedPeakMW,
    grossDemandMWh, netDemandMWh, servedMWh, unmetMWh, unmetHours, unmetPeakMW, designDayShortfall, gridMWh, gridChargeMWh,
    gridCost, gridCarbonT, ppaCarbonT, reGenMWh, solarMWh, windMWh, reUsedMWh, curtailMWh, exportMWh, bessChargeMWh,
    bessDischargeMWh, firmMWh, chpCreditMWh, flexMWh, itMWh, cfeMWh, maxBalanceError,
  });
  out.demandMWh = out.netDemandMWh;
  out.socEnd = soc;
  out.bessLossMWh = out.bessChargeMWh - out.bessDischargeMWh - (out.socEnd - out.socStart);
  out.plants = cfg.plants.map((pl, i) => ({
    role: pl.role, tech: pl.tech, mwh: plantMWh[i], hours: plantHours[i], fuelMWhTh: plantFuel[i], mslCurtailMWh: plantMslCurtail[i],
    runHoursAboveLimit: ctx.inputs.requirements.maxRunHours != null && plantHours[i] > ctx.inputs.requirements.maxRunHours,
  }));
  if (rec) out.hourly = rec;
  return out;
}

function cleanFirm(cfg, firm) {
  // SMR output counts as carbon-free for CFE; hydrogen counts as carbon-free (Scope 1 basis).
  let cleanMW = 0;
  let total = 0;
  for (const p of cfg.plants) { total += p.mw; if (p.tech === 'smr' || p.tech === 'hydrogen') cleanMW += p.mw; }
  return total > 0 ? firm * (cleanMW / total) : 0;
}

function indexOfMax(a) {
  let bi = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[bi]) bi = i;
  return bi;
}

// Dispatch all explicit years (chronological SOC); steady-state year repeats afterwards.
export function dispatchAll(ctx, cfg, recordYears = null) {
  const nY = dispatchYears(ctx, cfg);
  const years = [];
  let soc = null;
  for (let y = 0; y < nY; y++) {
    const rec = recordYears ? recordYears.includes(y) : false;
    const r = dispatchYear(ctx, cfg, y, soc, rec);
    soc = r.socEnd;
    years.push(r);
  }
  return { years, nExplicit: nY };
}
