// Hourly dispatch engine (BRIEF §9.4). Full chronological 8760-hour years with carried BESS SOC.
//
// Merit order (same six steps as the delivered v1 tool):
//   1. On-site renewables (solar, wind) serve load first.
//   2. PPA energy, delivered over the grid connection (uses import capacity). Contracted volume that is not
//      delivered (above the residual load in the hour, or above the import capacity) is recorded with its
//      wholesale value; under the owner decision of 2026-10-18 its settlement is the "PPA hedge (not counted)"
//      in evaluate.js, outside the cost ledger.
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
import { demandYear, contractLimit } from './context.js';
import { TECH, FUEL, PPA } from './defaults.js';
import { techAvailMonth } from './sizing.js';
import { triggerMask } from './triggers.js';
export { triggerAnalysis } from './triggers.js';

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
// The n most expensive hours of the year in the grid price profile (backup gensets as primary power), as a 0/1 mask.
const TOP_CACHE = new WeakMap();
export function topPriceHours(ctx, n) {
  let byN = TOP_CACHE.get(ctx.prof);
  if (!byN) { byN = new Map(); TOP_CACHE.set(ctx.prof, byN); }
  if (byN.has(n)) return byN.get(n);
  const price = ctx.prof.price;
  const idx = Array.from({ length: H }, (_, h) => h).sort((a, b) => price[b] - price[a] || a - b);
  const mask = new Uint8Array(H);
  const k = Math.min(H, Math.max(0, Math.round(n)));
  for (let i = 0; i < k; i++) mask[idx[i]] = 1;
  mask.count = k;
  byN.set(n, mask);
  return mask;
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
  // Supply available month of each renewable source (sizing.js techAvailMonth: ordered from day one; wind and ground
  // solar keep their own consent months, OPEN-QUESTIONS 44, 56).
  const avail = (id) => techAvailMonth(ctx, TECH[id]);
  const primeH = inputs.requirements.gensetPrimaryHours || 0;
  const plants = sz.plants.map((pl) => ({ ...pl, mc: plantMarginalCost(ctx, pl), units: Math.max(1, Math.round(pl.mw / pl.unitMW)),
    hourMask: pl.role === 'backupPrime' ? topPriceHours(ctx, primeH) : null,
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
    // All battery capacity (main C12 battery and bridging battery) supplies from the BESS supply-available month
    // (BRIEF §9.8: project start + planning + procurement + construction), the month time-to-power and the
    // bridging battery's sizing use (sizing.js techAvailMonth). Before the port a bridging battery without a main
    // battery dispatched from month 0 and one with a main battery from the programme month.
    bessMW: sz.storage.mw, bessMWh: sz.storage.mwh, bessAvailM: sz.storage.mw > 0 ? techAvailMonth(ctx, TECH.bess) : Infinity,
    bessRole: sz.storage.role, bessDurN: durationH >= 8 ? 12 : durationH >= 3 ? 4 : durationH >= 1.5 ? 2 : 1,
    rte: TECH.bess.p.rte,
    ppaType: sz.ppa ? sz.ppa.type : null, ppaCoverage: sz.ppa ? sz.ppa.coverage : 0,
    flex: v.C16 === 'on',
    reYield: inputs.utilities.reYieldFactor ?? 1, // tornado driver "capacity factors" (work package 9)
    gridLimit: v.C1 === 'islanded' ? Infinity : contractLimit(inputs, v.C1), // contracted capacity (work package 3)
    plants,
  };
  return cfg;
}

export function dispatchKey(cfg) {
  return JSON.stringify([cfg.coolingId, cfg.islanded, cfg.exportMW, cfg.exceedance, cfg.respectRunHours, cfg.maxRunHours,
    +cfg.solarMWp.toFixed(6), cfg.solarAvailM, +cfg.windMW.toFixed(6), cfg.windAvailM, +cfg.bessMW.toFixed(6), +cfg.bessMWh.toFixed(6), cfg.bessAvailM, cfg.bessRole,
    cfg.ppaType, cfg.ppaCoverage, cfg.flex, cfg.reYield, cfg.gridLimit < Infinity ? cfg.gridLimit : null,
    cfg.plants.map((p) => [p.role, p.tech, +p.mw.toFixed(6), Array.from(p.mode).join(''), p.hourMask ? p.hourMask.count : 0])]);
}

// Which model years must be dispatched explicitly? Years after the last change repeat (steady state).
export function dispatchYears(ctx, cfg) {
  let lastChangeM = Math.max(ctx.lastPhaseM + ctx.inputs.load.rampMonths, ctx.fullGridM);
  for (let m = 1; m < ctx.gridCap.length; m++) if (ctx.gridCap[m] !== ctx.gridCap[m - 1]) lastChangeM = Math.max(lastChangeM, m);
  for (const m of [cfg.solarAvailM, cfg.windAvailM, cfg.bessAvailM]) if (Number.isFinite(m)) lastChangeM = Math.max(lastChangeM, m);
  for (const p of cfg.plants) {
    for (let m = 1; m < p.mode.length; m++) if (p.mode[m] !== p.mode[m - 1]) lastChangeM = Math.max(lastChangeM, m);
  }
  // The first model year that starts after the last change is the steady one that repeats (known issue 1, work package 11):
  // a change mid-year leaves that year still ramping.
  const lastYear = Math.ceil(Math.max(0, lastChangeM) / 12);
  return Math.min(lastYear + 1, ctx.inputs.settings.maxDispatchYears, Math.floor(ctx.nMonths / 12));
}
// Model years an option needs dispatched before nothing changes (full load, grid steps, plant changes), whatever the
// cap: compared with dispatchYears for the "dispatch stops early" flag (known issue 17).
export function dispatchYearsNeeded(ctx, cfg) {
  const settings = { ...ctx.inputs.settings, maxDispatchYears: Infinity };
  return dispatchYears({ ...ctx, inputs: { ...ctx.inputs, settings } }, cfg);
}

function emptyYear() {
  return {
    demandMWh: 0, grossDemandMWh: 0, netDemandMWh: 0, servedMWh: 0, unmetMWh: 0, unmetHours: 0, unmetPeakMW: 0,
    exceedMWh: 0, exceedHours: 0, exceedPeakMW: 0,
    gridMWh: 0, gridChargeMWh: 0, gridCost: 0, gridCarbonT: 0, ppaCarbonT: 0, gridCarbonWeighted: 0,
    reGenMWh: 0, solarMWh: 0, windMWh: 0, reUsedMWh: 0, curtailMWh: 0, exportMWh: 0, exportRevenue: 0,
    ppaContractMWh: 0, ppaDeliveredMWh: 0, ppaUndeliveredMWh: 0, ppaUndeliveredSpotValue: 0, ppaLimitedMWh: 0, ppaLimitedHours: 0, ppaMslBackMWh: 0,
    bessChargeMWh: 0, bessDischargeMWh: 0, bessLossMWh: 0, socStart: 0, socEnd: 0,
    firmMWh: 0, chpCreditMWh: 0, flexMWh: 0, cfeMWh: 0, itMWh: 0,
    plants: [], designDayShortfall: false, maxBalanceError: 0,
  };
}

// Dispatch one model year. Returns aggregates and (optionally) hourly arrays.
export function dispatchYear(ctx, cfg, y, socIn, record = false, rep = null) {
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
  const exH = new Float64Array(nP); // this hour's output above demand at minimum stable load, by plant (known issue 19)
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
  // Flexibility with triggers (OPEN-QUESTIONS 34, 2026-10-23: both trigger hours and shortfalls, within the same
  // limits). Events: consecutive trigger hours, at most flexEventH long, then flexRecoveryH hours before the next.
  const LF = ctx.inputs.load;
  const trig = cfg.flex ? triggerMask(ctx, LF) : null;
  const evMax = Math.max(1, Math.round(LF.flexEventH || 1)), recH = Math.max(0, Math.round(LF.flexRecoveryH || 0));
  const battResp = cfg.flex && LF.flexBatteryResponse !== false;
  let inEvent = false, evLen = 0, recoverLeft = 0;
  let flexEvents = 0, flexTrigHours = 0, flexTrigMWh = 0, flexShortMWh = 0, flexShortHours = 0, battRespMWh = 0;
  const gridCap = ctx.gridCap;
  const gridLimit = cfg.gridLimit ?? Infinity;
  // Hoisted locals for the hot loop
  const islanded = cfg.islanded;
  const exceedance = cfg.exceedance;
  const respectRH = cfg.respectRunHours;
  const maxRH = cfg.maxRunHours;
  const solarMWp = cfg.solarMWp, solarAvailM = cfg.solarAvailM, windMW = cfg.windMW, windAvailM = cfg.windAvailM;
  const reYield = cfg.reYield ?? 1;
  const bessAvailM = cfg.bessAvailM, exportMW = cfg.exportMW, exportFactor = ctx.inputs.grid.exportFactor;
  const pSolar = p.solar, pWind = p.wind, pPrice = p.price, pCarbon = p.carbon;
  const plants = cfg.plants;
  const pMode = plants.map((pl) => pl.mode), pMW = plants.map((pl) => pl.mw), pMC = plants.map((pl) => pl.mc);
  const pChpK = plants.map((pl) => pl.chpK), pMsl = plants.map((pl) => pl.msl * pl.unitMW), pEff = plants.map((pl) => pl.eff);
  const pIsSmr = plants.map((pl) => pl.tech === 'smr');
  const pHourMask = plants.map((pl) => pl.hourMask || null);
  const copArr = ctx.cooling[cfg.coolingId].cop;
  const cleanRatio = cleanFirm(cfg, 1);
  // 'shortfall' (C12 = Sized to the permanent shortfall, OPEN-QUESTIONS 60): a security battery that covers only the
  // grid shortfall, takes no arbitrage and recharges from grid headroom in any hour.
  const roleShort = role === 'peakShave' || role === 'bridgingSupport' || role === 'shortfall';
  const roleArb = role === 'peakShave' || role === 'shifting' || role === 'gridServices';
  const reserveE = role === 'peakShave' ? 0.5 * E : 0;
  const y12 = y * 12;
  let ppaMslBackMWh = 0;
  let ppaNetworkCost = 0, ppaLimitedMWh = 0, ppaLimitedHours = 0, ppaDeliveredMWh = 0, ppaUndeliveredMWh = 0, ppaUndeliveredSpotValue = 0, exportRevenue = 0;
  let exceedMWh = 0, exceedHours = 0, exceedPeakMW = 0, grossDemandMWh = 0, netDemandMWh = 0, servedMWh = 0;
  let unmetMWh = 0, unmetHours = 0, unmetPeakMW = 0, designDayShortfall = false, gridMWh = 0, gridChargeMWh = 0;
  let unmetRunH = 0, unmetLongestH = 0; // longest run of consecutive unmet hours in the year (power adequacy, OPEN-QUESTIONS 38)
  let gridCost = 0, gridCarbonT = 0, ppaCarbonT = 0, reGenMWh = 0, solarMWh = 0, windMWh = 0, reUsedMWh = 0;
  let curtailMWh = 0, exportMWh = 0, bessChargeMWh = 0, bessDischargeMWh = 0, firmMWh = 0, chpCreditMWh = 0;
  let flexMWh = 0, itMWh = 0, cfeMWh = 0, maxBalanceError = 0;

  let rec = null;
  if (record) {
    rec = {};
    for (const k of ['demand', 'net', 're', 'solar', 'wind', 'ppa', 'ppaContract', 'dis', 'ch', 'firm', 'grid', 'gridCharge', 'unmet', 'curt', 'exp', 'soc', 'cap', 'chpCredit', 'flex', 'flexTrig', 'resp', 'trig']) rec[k] = new Float64Array(H);
    rec.plant = cfg.plants.map(() => new Float64Array(H)); // firm output per plant (prime, bridging), sums to rec.firm
  }

  // Screening model (work package 8): representative days only, each hour weighted by the days it stands for. In
  // the full-year model rep is null, every weight is 1 and the arithmetic is unchanged.
  const repH = rep ? rep.hours : null, repW = rep ? rep.weights : null;
  const NH = repH ? repH.length : H;
  for (let k = 0; k < NH; k++) {
    const h = repH ? repH[k] : k;
    const w = repW ? repW[k] : 1;
    const hm = h < 8030 ? (h / 730) | 0 : 11;
    const m = y12 + hm;
    const D0 = D[h];
    const offered = Math.min(gridCap[m], gridLimit); // the option's contracted capacity (work package 3)
    const capPhys = islanded ? 0 : offered; // physical connection: exceedance accounting and grid charging
    const capLoad = islanded ? 0 : (exceedance ? Infinity : offered);
    const gp = pPrice[h] * priceMult + adder;
    const ci = pCarbon[h] * cMult; // gCO2e/kWh; × MWh / 1000 = tCO2e

    // 1. On-site renewables serve load first
    const sol = m >= solarAvailM ? solarMWp * pSolar[h] * reYield : 0;
    const win = m >= windAvailM ? windMW * pWind[h] * reYield : 0;
    const re = sol + win;
    const reUse = re < D0 ? re : D0;
    let R = D0 - reUse;
    let sur = re - reUse;

    // 1b. Trigger hours (flexibility on): the economic battery serves the flexible share first, then IT is curtailed
    // within the limits (share of IT, hours a year).
    let disResp = 0, curtTrig = 0;
    if (trig) {
      let on = false;
      if (inEvent) {
        if (trig[h] && evLen < evMax) { evLen++; on = true; } else { inEvent = false; recoverLeft = recH; }
      }
      if (!on && !inEvent) {
        if (recoverLeft > 0) recoverLeft--;
        else if (trig[h]) { inEvent = true; evLen = 1; on = true; flexEvents += w; }
      }
      if (on) {
        flexTrigHours += w;
        let A = flexMax * IT[h];
        if (A > R) A = R;
        if (battResp && Pb > 0 && m >= bessAvailM) {
          const can = Pb < soc * eta ? Pb : soc * eta;
          disResp = A < can ? A : can;
          soc -= disResp / eta;
          battRespMWh += disResp * w;
        }
        const rest = A - disResp;
        if (rest > 1e-12 && flexHoursLeft > 0) { curtTrig = rest; flexHoursLeft -= w; }
        R -= disResp + curtTrig;
        flexTrigMWh += curtTrig * w;
      }
    }

    // 2. PPA over the grid connection (uses import capacity; never above the physical connection)
    let ppaUse = 0;
    let capRem = capLoad;
    let ppaV = 0;
    if (ppaShp) {
      ppaV = ppaShp[h] * ppaVol;
      const want = ppaV < R ? ppaV : R;
      ppaUse = want < capPhys ? want : capPhys;
      if (want - ppaUse > 1e-9) { ppaLimitedMWh += (want - ppaUse) * w; ppaLimitedHours += w; }
      R -= ppaUse;
      if (capRem !== Infinity) capRem -= ppaUse;
      ppaDeliveredMWh += ppaUse * w;
      ppaNetworkCost += ppaUse * adder * w;
      // Contracted volume not delivered physically, at the wholesale price (no non-commodity adder: a financial
      // settlement is not energy taken from the grid). Not in the cost ledger: "PPA hedge (not counted)".
      ppaUndeliveredMWh += (ppaV - ppaUse) * w;
      ppaUndeliveredSpotValue += (ppaV - ppaUse) * pPrice[h] * priceMult * w;
    }

    // Firm capacity available this hour (for the BESS shortfall rule)
    let firmAvail = 0;
    for (let i = 0; i < nP; i++) if (pMode[i][m] > 0 && !(respectRH && plantHours[i] >= maxRH)) firmAvail += pMW[i];

    // 3. BESS discharge per role
    let dis = disResp;
    const bessOn = Pb > 0 && m >= bessAvailM;
    if (bessOn && R > 0) {
      const maxDis = (Pb - disResp) < soc * eta ? (Pb - disResp) : soc * eta;
      let d2 = 0;
      if (roleShort && capRem !== Infinity) {
        const short = R - capRem - firmAvail;
        if (short > 0) d2 = short < maxDis ? short : maxDis;
      }
      if (roleArb && dear[h]) {
        let av = (soc - d2 / eta - reserveE) * eta;
        if (Pb - disResp - d2 < av) av = Pb - disResp - d2;
        if (av > 0) d2 += (R - d2) < av ? (R - d2) : av;
      }
      if (d2 < 0) d2 = 0;
      soc -= d2 / eta;
      R -= d2;
      dis += d2;
    }

    // 4. Firm on-site generation: economic against grid marginal cost, or covering the grid shortfall; must-run when islanded
    let firm = 0;
    let chpCredit = 0;
    let mslEx = 0;
    for (let i = 0; i < nP; i++) {
      exH[i] = 0;
      const md = pMode[i][m];
      if (md === 0 || R <= 1e-12) continue;
      if (pHourMask[i] && !pHourMask[i][h]) continue;
      if (respectRH && plantHours[i] >= maxRH) continue;
      let P;
      let needed;
      if (md === 2) { P = R; needed = true; }
      // Economic: serves all the remaining demand. It is also needed when the grid cannot take what is left (known issue
      // 13, fixed 2026-10-23 with the owner's approval): then it runs at least at its minimum stable load.
      else if (pMC[i] < gp) { P = R; needed = capRem !== Infinity && R > capRem + 1e-12; }
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
      let served = P;
      let excess = 0;
      if (P < pMsl[i]) {
        if (!needed) continue;
        // Below its minimum stable load but needed: the plant runs at its minimum and the grid import that follows in the
        // merit order backs off, so the plant serves up to the whole remaining demand; only output above that demand is
        // surplus (curtailed or charging the battery). Known issue 11, work package 11 (2026-10-24); before, the output
        // above the part the grid could not take was curtailed and the grid still imported its full capacity.
        P = pMsl[i];
        served = Math.min(P, Math.max(0, R - credit));
        excess = P - served;
      }
      firm += P;
      chpCredit += credit;
      R -= served + credit;
      if (R < 0) R = 0;
      sur += excess; // output above need at min stable load is curtailed (or charges the BESS)
      plantMslCurtail[i] += excess * w;
      exH[i] = excess; mslEx += excess;
      plantMWh[i] += P * w;
      if (rec) rec.plant[i][h] = P;
      plantHours[i] += w;
      if (!pIsSmr[i]) plantFuel[i] += (P / pEff[i]) * w;
    }

    // 4b. Firm plant held at its minimum stable load displaces PPA energy before any of its output is wasted (known issue
    // 19, OPEN-QUESTIONS 77, 2026-10-24): the PPA delivery backs off by up to the surplus, and that volume is settled as
    // undelivered (the hedge line, outside the ledger), as for any PPA energy the site does not take.
    if (mslEx > 1e-12 && ppaUse > 1e-12) {
      const back = mslEx < ppaUse ? mslEx : ppaUse;
      ppaUse -= back;
      if (capRem !== Infinity) capRem += back;
      sur -= back;
      ppaDeliveredMWh -= back * w;
      ppaNetworkCost -= back * adder * w;
      ppaUndeliveredMWh += back * w;
      ppaUndeliveredSpotValue += back * pPrice[h] * priceMult * w;
      ppaMslBackMWh += back * w;
      let left = back;
      for (let i = 0; i < nP && left > 1e-12; i++) {
        if (exH[i] <= 0) continue;
        const d = exH[i] < left ? exH[i] : left;
        plantMslCurtail[i] -= d * w; left -= d;
      }
    }

    // 5. Grid import up to the offered capacity ("Show unmet load") or uncapped ("Show exceedance")
    let g = 0;
    if (!islanded) {
      g = R < capRem ? R : capRem;
      R -= g;
    }

    // 6. Demand flexibility (if on), then unmet load
    // Against a shortfall: what the trigger step has not already curtailed this hour. Shed load here counts as
    // unmet for power adequacy (OPEN-QUESTIONS 61).
    let flexed = curtTrig;
    if (R > 1e-12 && cfg.flex) {
      const room = flexMax * IT[h] - curtTrig;
      let fs = R < room ? R : room;
      if (fs > 1e-12 && (curtTrig > 0 || flexHoursLeft > 0)) {
        if (curtTrig === 0) flexHoursLeft -= w;
        R -= fs; flexed += fs; flexShortMWh += fs * w; flexShortHours += w;
      }
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
      if (!islanded && (cheap[h] || role === 'shortfall')) {
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
      exportRevenue += exp * pPrice[h] * priceMult * exportFactor * w; // the price multiplier applies to export too (known issue 3, work package 11)
    }
    const curt = sur - exp;

    const gridTotal = g + gridCh;
    const physImport = ppaUse + gridTotal;
    const isDesignDay = ((h / 24) | 0) === designDay;
    if (physImport > capPhys + 1e-9) {
      const ex = physImport - capPhys;
      exceedMWh += ex * w; exceedHours += w; if (ex > exceedPeakMW) exceedPeakMW = ex;
      if (isDesignDay) designDayShortfall = true;
    }
    const netDemand = D0 - chpCredit - flexed;

    grossDemandMWh += D0 * w;
    netDemandMWh += netDemand * w;
    servedMWh += (netDemand - unmet) * w;
    if (unmet > 0) { unmetMWh += unmet * w; unmetHours += w; if (unmet > unmetPeakMW) unmetPeakMW = unmet; if (isDesignDay) designDayShortfall = true; unmetRunH++; if (unmetRunH > unmetLongestH) unmetLongestH = unmetRunH; } else unmetRunH = 0;
    gridMWh += gridTotal * w;
    gridChargeMWh += gridCh * w;
    gridCost += gridTotal * gp * w;
    gridCarbonT += ((gridTotal * ci) / 1000) * w;
    ppaCarbonT += ((ppaUse * ci) / 1000) * w;
    reGenMWh += re * w; solarMWh += sol * w; windMWh += win * w;
    reUsedMWh += reUse * w;
    curtailMWh += curt * w;
    exportMWh += exp * w;
    bessChargeMWh += (ch + gridCh) * w;
    bessDischargeMWh += dis * w;
    firmMWh += firm * w;
    chpCreditMWh += chpCredit * w;
    flexMWh += flexed * w;
    itMWh += IT[h] * w;
    // Hourly CFE (24/7 matching): on-site renewables used + PPA volume counted only against grid energy actually used
    // for load in that hour (O2, walkthrough 2026-10-21) + carbon-free firm output.
    // In "Show exceedance" mode g can exceed the connection; only import within the connection can carry PPA energy
    // (Haiku check H1, M1). In the default mode this is ppaUse + g, unchanged.
    const gridUsed = ppaUse + (g < capPhys - ppaUse ? g : (capPhys - ppaUse > 0 ? capPhys - ppaUse : 0));
    const clean = reUse + (ppaV < gridUsed ? ppaV : gridUsed) + firm * cleanRatio;
    cfeMWh += (clean < netDemand ? clean : netDemand) * w;

    if (rec) {
      rec.demand[h] = D0; rec.net[h] = netDemand; rec.re[h] = re; rec.solar[h] = sol; rec.wind[h] = win; rec.ppa[h] = ppaUse; rec.ppaContract[h] = ppaV; rec.dis[h] = dis; rec.ch[h] = ch + gridCh;
      rec.firm[h] = firm; rec.grid[h] = g; rec.gridCharge[h] = gridCh; rec.unmet[h] = unmet; rec.curt[h] = curt; rec.exp[h] = exp; rec.soc[h] = soc;
      rec.cap[h] = capPhys; rec.chpCredit[h] = chpCredit; rec.flex[h] = flexed;
      rec.flexTrig[h] = curtTrig; rec.resp[h] = disResp; rec.trig[h] = trig && (curtTrig > 0 || disResp > 0 || inEvent) ? 1 : 0;
    }
    // Per-hour energy balance: sources + unmet − (net demand + charge + curtailment + export)
    const err = re + ppaUse + dis + firm + gridTotal + unmet - (netDemand + ch + gridCh + curt + exp);
    const ae = err < 0 ? -err : err;
    if (ae > maxBalanceError) maxBalanceError = ae;
  }

  Object.assign(out, {
    ppaNetworkCost, ppaMslBackMWh, ppaLimitedMWh, ppaLimitedHours, ppaDeliveredMWh, ppaUndeliveredMWh, ppaUndeliveredSpotValue, exportRevenue, exceedMWh, exceedHours, exceedPeakMW,
    grossDemandMWh, netDemandMWh, servedMWh, unmetMWh, unmetHours, unmetPeakMW, unmetLongestH, designDayShortfall, gridMWh, gridChargeMWh,
    gridCost, gridCarbonT, ppaCarbonT, reGenMWh, solarMWh, windMWh, reUsedMWh, curtailMWh, exportMWh, bessChargeMWh,
    bessDischargeMWh, firmMWh, chpCreditMWh, flexMWh, itMWh, cfeMWh, maxBalanceError,
    flexEvents, flexTrigHours, flexTrigMWh, flexShortMWh, flexShortHours, battRespMWh,
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

// Representative days for the screening model (work package 8, OPEN-QUESTIONS 23 answered 2026-10-23 with Claude's
// recommendation, accepted in advance by the owner): in each month the design day (if it falls in that month), the
// day with the highest mean grid price and the most typical day (closest to the month's mean price, solar and wind),
// each hour weighted so the month's days add up. Chosen from the country profiles, so every option uses the same days.
export function representativeHours(ctx) {
  if (ctx.repHours) return ctx.repHours;
  const p = ctx.prof;
  const K = Math.max(1, Math.min(6, Math.round(ctx.inputs.settings.repDaysPerMonth ?? 3)));
  const days = Math.floor(H / 24);
  const designDay = Math.floor(indexOfMax(p.temp) / 24);
  const mean = (a, d) => { let s = 0; for (let h = d * 24; h < d * 24 + 24; h++) s += a[h]; return s / 24; };
  // Daily features: mean price, solar, wind, grid carbon and temperature, standardised over the year. Carbon was added
  // after Haiku check H2 (screening carbon up to 12 % off with price, solar and wind only).
  const feats = [p.price, p.solar, p.wind, p.carbon, p.temp].map((a) => { const v = []; for (let d = 0; d < days; d++) v.push(mean(a, d)); return v; });
  const z = feats.map((v) => { const m = v.reduce((x, y) => x + y, 0) / v.length; const sd = Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length) || 1; return v.map((x) => (x - m) / sd); });
  const dist = (a, b) => z.reduce((t, f) => t + (f[a] - f[b]) ** 2, 0);
  const picked = []; // { day, weight }
  for (let mo = 0; mo < 12; mo++) {
    // Months as the dispatch loop counts them: 730 h each, the last to the end of the year.
    const d0 = Math.floor((mo * 730) / 24), d1 = mo === 11 ? days : Math.floor(((mo + 1) * 730) / 24);
    const ds = [];
    for (let d = d0; d < d1; d++) ds.push(d);
    // Extremes kept as themselves, weight 1: the dearest day and, in its month, the design day.
    let dear = ds[0];
    for (const d of ds) if (feats[0][d] > feats[0][dear]) dear = d;
    const extra = [...new Set([dear, ...(designDay >= d0 && designDay < d1 ? [designDay] : [])])];
    const rest = ds.filter((d) => !extra.includes(d));
    for (const d of extra) picked.push({ day: d, weight: 1 });
    // The other days: K clusters (k-medoids, deterministic start spread by price), each represented by its medoid and
    // weighted by its number of days.
    const k = Math.min(K, rest.length);
    const byPrice = rest.slice().sort((a, b) => feats[0][a] - feats[0][b]);
    let med = Array.from({ length: k }, (_, i) => byPrice[Math.floor(((i + 0.5) * byPrice.length) / k)]);
    let groups = [];
    for (let it = 0; it < 20; it++) {
      groups = med.map(() => []);
      for (const d of rest) { let bi = 0, bd = Infinity; med.forEach((m, i) => { const x = dist(d, m); if (x < bd) { bd = x; bi = i; } }); groups[bi].push(d); }
      const next = groups.map((g, i) => (g.length ? g.reduce((bm, c) => { const sc = g.reduce((t, x) => t + dist(c, x), 0); return sc < bm.s ? { d: c, s: sc } : bm; }, { d: g[0], s: Infinity }).d : med[i]));
      if (next.every((m, i) => m === med[i])) break;
      med = next;
    }
    groups.forEach((g, i) => { if (g.length) picked.push({ day: med[i], weight: g.length }); });
  }
  picked.sort((a, b) => a.day - b.day);
  const hours = new Int32Array(picked.length * 24), weights = new Float64Array(picked.length * 24);
  picked.forEach((x, i) => { for (let k2 = 0; k2 < 24; k2++) { hours[i * 24 + k2] = x.day * 24 + k2; weights[i * 24 + k2] = x.weight; } });
  // The 8,760-hour year has 365 days; a remainder of hours after the last full day is folded into the last weight.
  const covered = weights.reduce((a, x) => a + x, 0);
  if (covered < H) for (let k2 = weights.length - 24; k2 < weights.length; k2++) weights[k2] += (H - covered) / 24;
  ctx.repHours = { hours, weights, days: picked, label: `Representative days (${picked.length} days a year)` };
  return ctx.repHours;
}

// Dispatch all explicit years (chronological SOC); steady-state year repeats afterwards. rep: representative hours
// (screening model) or null for the full year.
export function dispatchAll(ctx, cfg, recordYears = null, rep = null) {
  const nY = dispatchYears(ctx, cfg);
  const years = [];
  let soc = null;
  for (let y = 0; y < nY; y++) {
    const rec = recordYears ? recordYears.includes(y) : false;
    const r = dispatchYear(ctx, cfg, y, soc, rec, rep);
    soc = r.socEnd;
    years.push(r);
  }
  return { years, nExplicit: nY };
}
