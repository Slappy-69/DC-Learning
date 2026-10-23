// One-option inspector for the Dispatch tab: phasing timeline (BRIEF §12.6) and hourly dispatch (§20 stage 4,
// "dispatch visualisations"). Port of the other line's inspect.js (commits f236acc, e1161ce), adapted to this
// line's full pipeline: the option is re-run through evaluateOption (option.js), i.e. sizing, blocks, layout,
// "fill residual" solar from the layout, site fit, dispatch with hourly recording, time-to-power and the
// economics, so every figure is the engine's own figure for that option (test 12a checks it equals the run).
// The run keeps no hourly arrays or monthly series (they are dropped before the worker transfer), which is
// why this recomputes. Pure: no UI, no browser APIs.

import { buildContext } from './context.js';
import { normalizeInputs } from './defaults.js';
import { siteKey } from './site.js';
import { bridgeActive, bridgeMWAt } from './sizing.js';
import { SOURCE_OF_TECH } from './blocks.js';
import { evaluateOption } from './option.js';
import { H } from './profiles.js';

export const HOURS_PER_WEEK = 168;
export const WEEKS_PER_YEAR = Math.floor(H / HOURS_PER_WEEK); // 52; week 52 runs to the end of the year (192 h)

const sum = (a, from = 0, to = a.length) => {
  let s = 0;
  for (let i = from; i < to; i++) s += a[i];
  return s;
};

// Annual energy balance from the recorded hourly arrays, in the engine's own form:
//   in  = renewables + PPA + battery discharge + firm + grid to load + grid to battery + unmet
//   out = net facility demand + battery charging (incl. from the grid) + curtailment + export
// rec.grid is grid import serving load; rec.gridCharge is grid import charging the battery; rec.ch is all battery
// charging (from surplus and from the grid). The engine's annual gridMWh is grid to load + grid to battery.
export function balanceFromHourly(rec) {
  const r = {
    re: sum(rec.re), solar: sum(rec.solar), wind: sum(rec.wind), ppa: sum(rec.ppa), ppaContract: sum(rec.ppaContract), dis: sum(rec.dis),
    firm: sum(rec.firm), gridLoad: sum(rec.grid), gridCharge: sum(rec.gridCharge), unmet: sum(rec.unmet), net: sum(rec.net), gross: sum(rec.demand),
    ch: sum(rec.ch), curt: sum(rec.curt), exp: sum(rec.exp), chpCredit: sum(rec.chpCredit), flex: sum(rec.flex),
    plants: rec.plant.map((a) => sum(a)),
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

// Hours of week w (1-based) within a model year. Week 52 also takes the last 24 hours (8,737–8,760), so every
// hour of the year is in exactly one week.
export function weekRange(w) {
  const wk = Math.min(WEEKS_PER_YEAR, Math.max(1, Math.round(w)));
  return { week: wk, from: (wk - 1) * HOURS_PER_WEEK, to: wk === WEEKS_PER_YEAR ? H : wk * HOURS_PER_WEEK };
}

// Weeks worth looking at in one model year: peak net demand, most unmet load, most curtailment, least on-site
// renewables (only those that apply). Ties go to the earliest week.
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

// Firm plant shown per energy source (the §16 colour system shared with the site plan: blocks.js
// SOURCE_OF_TECH, tokens --src-*). Plants of the same source (e.g. gas CHP prime and gas recip bridging) share
// one band; the readout and the tables split them.
export function plantSource(tech) {
  return SOURCE_OF_TECH[tech] || 'gas';
}

// Re-run one option (choice vector v) under the run's inputs. `site`: the run's site model, if the caller has
// it (building one rasterises the site); it is used only when its key matches the inputs.
export function inspectOption(rawInputs, v, { site = null } = {}) {
  const inputs = normalizeInputs(rawInputs);
  const useSite = site && site.key === siteKey(inputs) ? site : null;
  const ctx = buildContext(inputs, { site: useSite });
  const allYears = Array.from({ length: Math.max(1, inputs.settings.maxDispatchYears || 8) }, (_, i) => i);
  const e = evaluateOption(ctx, v, { recordYears: allYears });
  const { sz, ttp, disp, cfg } = e;

  // Monthly phasing timeline: the supply time-to-power counts, split by source (§12.6).
  const n = ctx.nMonthsTimeline;
  const islanded = v.C1 === 'islanded';
  const plantsTl = [sz.prime, sz.bridge].filter(Boolean).map((p) => ({
    role: p.role, tech: p.tech, source: plantSource(p.tech), mw: p.mw, availMonth: p.availMonth, fuelMonth: p.fuelMonth, plant: p, values: new Float64Array(n),
  }));
  const tl = { months: n, design: new Float64Array(n), grid: new Float64Array(n), firm: new Float64Array(n), bess: new Float64Array(n), supply: new Float64Array(n), gap: new Float64Array(n), plants: plantsTl };
  for (let m = 0; m < n; m++) {
    const grid = islanded ? 0 : ctx.gridCap[m];
    for (const p of plantsTl) {
      const on = m >= p.availMonth && m >= p.fuelMonth;
      p.values[m] = !on ? 0 : p.role === 'prime' ? p.mw : bridgeMWAt(v, m, sz.T, p.plant);
    }
    const firm = sz.firmByMonth[m];
    const bess = v.C2 === 'bessSolar' && bridgeActive(v, m, sz.T) && m >= sz.bridgeBess.availMonth ? sz.bridgeBess.mw : 0;
    tl.grid[m] = grid;
    tl.firm[m] = firm;
    tl.bess[m] = bess;
    tl.supply[m] = ttp.supplyByMonth[m];
    tl.design[m] = sz.designByMonth[m];
    const g = tl.design[m] - tl.supply[m];
    tl.gap[m] = g > 1e-9 ? g : 0;
  }
  for (const p of plantsTl) delete p.plant;

  const years = disp.years.map((yr, y) => ({
    index: y,
    fromMonth: y * 12,
    balance: balanceFromHourly(yr.hourly),
    engine: Object.fromEntries(Object.entries(yr).filter(([k]) => k !== 'hourly')),
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
    bess: { mw: cfg.bessMW, mwh: cfg.bessMWh, availMonth: Number.isFinite(cfg.bessAvailM) ? cfg.bessAvailM : null, bridgeMW: sz.bridgeBess.mw, bridgeAvailMonth: sz.bridgeBess.availMonth },
    plants: cfg.plants.map((p) => ({ role: p.role, tech: p.tech, source: plantSource(p.tech), mw: p.mw })),
    solarMWp: sz.solarMWp, solarGroundMWp: sz.solarGroundMWp, windMW: sz.windMW,
    ppa: sz.ppa ? { ...sz.ppa } : null,
    ttp: { firstPowerM: ttp.firstPowerM, fullLoadM: ttp.fullLoadM, reachedFull: ttp.reachedFull, gapMWm: ttp.gapMWm, gapMonths: ttp.gapMonths, metric: ttp.metric },
    eco: { lcoe: e.eco.lcoe, npvCost: e.eco.npvCost, capex: e.eco.capex, ppaHedge: e.eco.ppaHedge || null },
    delivScore: e.deliv.score,
    siteFitStatus: e.siteFit.status,
    flagIds: e.flags.map((f) => f.id),
    adequacy: e.adequacy,
    timeline: tl,
    years,
    nExplicit: disp.nExplicit,
    evaluationYears: inputs.economics.periodYears,
  };
}

// Compare an inspection with the figures the ranking run kept for the same option (o: a run option, full or
// transferable). Returns the largest absolute difference over the annual energy figures, time-to-power and the
// economics, and the fields that differ (empty when it matches exactly).
const YEAR_KEYS = ['grossDemandMWh', 'netDemandMWh', 'servedMWh', 'unmetMWh', 'unmetHours', 'unmetPeakMW', 'exceedMWh', 'gridMWh', 'gridChargeMWh', 'gridCost',
  'reGenMWh', 'solarMWh', 'windMWh', 'reUsedMWh', 'curtailMWh', 'exportMWh', 'ppaContractMWh', 'ppaDeliveredMWh', 'ppaLimitedMWh', 'ppaUndeliveredMWh',
  'bessChargeMWh', 'bessDischargeMWh', 'bessLossMWh', 'firmMWh', 'chpCreditMWh', 'flexMWh', 'cfeMWh'];
export function compareWithRun(I, o) {
  const diffs = [];
  let worst = 0;
  const cmp = (label, a, b) => {
    if (a === b || (a == null && b == null) || (Number.isNaN(a) && Number.isNaN(b))) return;
    const d = Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) : Infinity;
    worst = Math.max(worst, d);
    diffs.push({ label, inspector: a, run: b });
  };
  const runYears = (o.dispatch && o.dispatch.years) || [];
  if (runYears.length !== I.years.length) diffs.push({ label: 'dispatched years', inspector: I.years.length, run: runYears.length });
  I.years.forEach((y, i) => {
    const r = runYears[i];
    if (!r) return;
    for (const k of YEAR_KEYS) if (k in r || k in y.engine) cmp(`year ${i + 1} ${k}`, y.engine[k], r[k]);
  });
  cmp('time-to-power metric', I.ttp.metric, o.ttp.metric);
  cmp('first power month', I.ttp.firstPowerM, o.ttp.firstPowerM);
  cmp('full load month', I.ttp.fullLoadM, o.ttp.fullLoadM);
  cmp('LCOE', I.eco.lcoe, o.eco.lcoe);
  cmp('NPV of net cost', I.eco.npvCost, o.eco.npvCost);
  cmp('solar MWp', I.solarMWp, o.sizing.solarMWp);
  cmp('deliverability', I.delivScore, o.deliv.score);
  if (I.siteFitStatus !== (o.siteFit ? o.siteFit.status : null)) diffs.push({ label: 'site-fit status', inspector: I.siteFitStatus, run: o.siteFit ? o.siteFit.status : null });
  return { worst, diffs, matches: diffs.length === 0 };
}
