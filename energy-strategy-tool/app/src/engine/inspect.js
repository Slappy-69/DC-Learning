// One-option inspector: phasing timeline (BRIEF §12.6) and dispatch visualisation (§20 stage 4).
//
// Re-runs a single option through the same chain the run uses (size → dispatch with hourly
// recording → time-to-power), so every figure shown is the engine's own figure for that option.
// The run itself keeps no hourly arrays or monthly series (they are dropped before the worker
// transfer), which is why this recomputes. Pure: no UI, no browser APIs.

import { buildContext } from './context.js';
import { normalizeInputs } from './defaults.js';
import { sizeOption } from './sizing.js';
import { dispatchConfig, dispatchAll } from './dispatch.js';
import { timeToPower } from './evaluate.js';
import { H } from './profiles.js';

export const HOURS_PER_WEEK = 168;
export const WEEKS_PER_YEAR = Math.floor(H / HOURS_PER_WEEK); // 52; the last 24 h of the year are in the annual totals only

const sum = (a, from = 0, to = a.length) => {
  let s = 0;
  for (let i = from; i < to; i++) s += a[i];
  return s;
};

// Annual energy balance from the recorded hourly arrays, in the engine's own form:
//   in  = renewables + PPA + battery discharge + firm + grid to load + grid to battery + unmet
//   out = net facility demand + battery charging (incl. from grid) + curtailment + export
// rec.grid is grid import serving load; rec.gridCharge is grid import charging the battery;
// rec.ch is all battery charging (from surplus and from the grid).
export function balanceFromHourly(rec) {
  const r = {
    re: sum(rec.re), ppa: sum(rec.ppa), dis: sum(rec.dis), firm: sum(rec.firm), gridLoad: sum(rec.grid),
    gridCharge: sum(rec.gridCharge), unmet: sum(rec.unmet), net: sum(rec.net), gross: sum(rec.demand),
    ch: sum(rec.ch), curt: sum(rec.curt), exp: sum(rec.exp), chpCredit: sum(rec.chpCredit), flex: sum(rec.flex),
  };
  r.gridTotal = r.gridLoad + r.gridCharge + r.ppa; // physical import over the connection
  r.in = r.re + r.ppa + r.dis + r.firm + r.gridLoad + r.gridCharge + r.unmet;
  r.out = r.net + r.ch + r.curt + r.exp;
  r.residual = r.in - r.out;
  let maxHourly = 0;
  let unmetHours = 0;
  let peakNet = 0;
  for (let h = 0; h < rec.net.length; h++) {
    const e = rec.re[h] + rec.ppa[h] + rec.dis[h] + rec.firm[h] + rec.grid[h] + rec.gridCharge[h] + rec.unmet[h]
      - (rec.net[h] + rec.ch[h] + rec.curt[h] + rec.exp[h]);
    const ae = e < 0 ? -e : e;
    if (ae > maxHourly) maxHourly = ae;
    if (rec.unmet[h] > 1e-6) unmetHours++;
    if (rec.net[h] > peakNet) peakNet = rec.net[h];
  }
  r.maxHourlyResidual = maxHourly;
  r.unmetHours = unmetHours;
  r.peakNetMW = peakNet;
  return r;
}

// Hours of week w (1-based) within a model year.
export function weekRange(w) {
  const wk = Math.min(WEEKS_PER_YEAR, Math.max(1, Math.round(w)));
  return { week: wk, from: (wk - 1) * HOURS_PER_WEEK, to: wk * HOURS_PER_WEEK };
}

// Weeks worth looking at in one model year: peak net demand, most unmet load, most curtailment,
// least on-site renewables (only those that apply). Ties go to the earliest week.
export function weekPresets(rec) {
  const wk = (h) => Math.min(WEEKS_PER_YEAR, Math.floor(h / HOURS_PER_WEEK) + 1);
  let peakH = 0;
  for (let h = 1; h < rec.net.length; h++) if (rec.net[h] > rec.net[peakH]) peakH = h;
  const out = [{ id: 'peak', label: 'Peak demand week', week: wk(peakH) }];
  const byWeek = (arr) => {
    let best = 1, bestV = -Infinity, total = 0;
    for (let w = 1; w <= WEEKS_PER_YEAR; w++) {
      const { from, to } = weekRange(w);
      const v = sum(arr, from, to);
      total += v;
      if (v > bestV + 1e-9) { bestV = v; best = w; }
    }
    return { best, bestV, total };
  };
  const un = byWeek(rec.unmet);
  if (un.total > 1e-6) out.push({ id: 'unmet', label: 'Most unmet load', week: un.best });
  const cu = byWeek(rec.curt);
  if (cu.total > 1e-6) out.push({ id: 'curt', label: 'Most curtailment', week: cu.best });
  const reTotal = sum(rec.re);
  if (reTotal > 1e-6) {
    let low = 1, lowV = Infinity;
    for (let w = 1; w <= WEEKS_PER_YEAR; w++) {
      const { from, to } = weekRange(w);
      const v = sum(rec.re, from, to);
      if (v < lowV - 1e-9) { lowV = v; low = w; }
    }
    out.push({ id: 'lowre', label: 'Least on-site renewables', week: low });
  }
  return out;
}

// Re-run one option (choice vector v) under the run's inputs.
export function inspectOption(rawInputs, v) {
  const inputs = normalizeInputs(rawInputs);
  const ctx = buildContext(inputs);
  const sz = sizeOption(ctx, v);
  const cfg = dispatchConfig(ctx, v, sz);
  const allYears = Array.from({ length: Math.max(1, inputs.settings.maxDispatchYears || 8) }, (_, i) => i);
  const disp = dispatchAll(ctx, cfg, allYears);
  const ttp = timeToPower(ctx, v, sz);

  // Monthly phasing timeline: the supply that time-to-power counts, split by source.
  const n = ctx.nMonthsTimeline;
  const islanded = v.C1 === 'islanded';
  const tl = { months: n, design: new Float64Array(n), grid: new Float64Array(n), firm: new Float64Array(n), bess: new Float64Array(n), supply: new Float64Array(n), gap: new Float64Array(n) };
  for (let m = 0; m < n; m++) {
    const grid = islanded ? 0 : ctx.gridCap[m];
    const firm = sz.firmByMonth[m];
    const supply = ttp.supplyByMonth[m];
    tl.grid[m] = grid;
    tl.firm[m] = firm;
    tl.bess[m] = Math.max(0, supply - grid - firm);
    tl.supply[m] = supply;
    tl.design[m] = sz.designByMonth[m];
    const g = tl.design[m] - supply;
    tl.gap[m] = g > 1e-9 ? g : 0;
  }

  const years = disp.years.map((yr, y) => ({
    index: y,
    fromMonth: y * 12,
    balance: balanceFromHourly(yr.hourly),
    engine: {
      maxBalanceError: yr.maxBalanceError, unmetMWh: yr.unmetMWh, unmetHours: yr.unmetHours, unmetPeakMW: yr.unmetPeakMW,
      gridMWh: yr.gridMWh, gridChargeMWh: yr.gridChargeMWh, firmMWh: yr.firmMWh, reGenMWh: yr.reGenMWh, solarMWh: yr.solarMWh,
      windMWh: yr.windMWh, ppaDeliveredMWh: yr.ppaDeliveredMWh, bessDischargeMWh: yr.bessDischargeMWh, bessChargeMWh: yr.bessChargeMWh,
      bessLossMWh: yr.bessLossMWh, curtailMWh: yr.curtailMWh, exportMWh: yr.exportMWh, netDemandMWh: yr.netDemandMWh,
      grossDemandMWh: yr.grossDemandMWh, chpCreditMWh: yr.chpCreditMWh, flexMWh: yr.flexMWh, exceedMWh: yr.exceedMWh,
      plants: yr.plants,
    },
    hourly: yr.hourly,
  }));

  return {
    analysisStart: inputs.project.analysisStart,
    country: ctx.country,
    islanded,
    exceedance: !!cfg.exceedance,
    fullGridM: ctx.fullGridM,
    firstPhaseM: ctx.firstPhaseM,
    lastPhaseM: ctx.lastPhaseM,
    designMW: sz.designMW,
    bess: { mw: cfg.bessMW, mwh: cfg.bessMWh },
    ttp: { firstPowerM: ttp.firstPowerM, fullLoadM: ttp.fullLoadM, reachedFull: ttp.reachedFull, gapMWm: ttp.gapMWm, gapMonths: ttp.gapMonths, metric: ttp.metric },
    timeline: tl,
    years,
    nExplicit: disp.nExplicit,
    evaluationYears: inputs.economics.periodYears,
  };
}
