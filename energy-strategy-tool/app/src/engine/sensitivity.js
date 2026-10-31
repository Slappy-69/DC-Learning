// Deterministic tornado sensitivity for one option (BRIEF §13.3). Port of the other line's sensitivity.js (commit
// f1fd5c5), adapted to this line:
//  - the option is re-run through this line's full per-option chain (option.js evaluateOption: sizing, blocks,
//    layout, "fill residual" solar from the layout, site fit, dispatch, time-to-power, economics, carbon,
//    resilience, flags incl. the site-fit flags, deliverability incl. the optional site-fit penalty);
//  - the weighted score is recomputed with this line's scoring (scoring.js axisScore and SCORE_KEYS, the run's
//    effective weights and the run's axis ranges), so the base re-run reproduces the run's score exactly and other
//    options and ranks are unchanged; a value outside the base range scores at the edge (clipped to 0–100);
//  - every driver range is a §18 record with the "indicative — unverified" label: the input's own low/high where it
//    has one (grid.priceMultiplier, grid.carbonMultiplier, economics.wacc), the input value for the grid-date range
//    (grid.dateUncertainty) and new sensitivity.* records otherwise; the number of drivers shown is the run setting
//    sensitivity.topDrivers (§13.3 "top 12 drivers").
//  - gas and carbon price are driven through their inputs (utilities.gasPrice, economics.carbonPrice), which the
//    engine now reads (context.js); the other line scaled them on the built context because the engine did not.
// Pure: no UI, no browser APIs. Only the chosen option is re-evaluated; the run is never changed.

import { buildContext } from './context.js';
import { normalizeInputs, getRegistry, registryValue, COUNTRIES, LABEL } from './defaults.js';
import { buildSiteModel, siteKey } from './site.js';
import { resolveCountry } from './context.js';
import { evaluateOption } from './option.js';
import { axisMetrics, axisScore, SCORE_KEYS } from './scoring.js';
import { addMonths } from './dates.js';

const rec = (path) => getRegistry()[path] || (registryValue(path), getRegistry()[path]);
const pctText = (x) => `${(x * 100).toFixed(x * 100 % 1 ? 1 : 0)} %`;
const factorText = (x) => `× ${Number(x.toPrecision(3))}`;

// Drivers. `range(inputs)` gives [low, high] from the driver's §18 record (and, for the grid date, the input value
// whose default that record is); `apply(inputs, x, ctx0)` sets the driver on a copy of the normalised inputs
// (ctx0: the base context, for values derived from the country profile); `text(x)` describes the value.
export const TORNADO_DRIVERS = [
  {
    id: 'grid-date', label: 'Grid full-connection date', record: 'grid.dateUncertainty', unit: 'months',
    range: (inp) => { const r = Array.isArray(inp.grid.dateUncertainty) ? inp.grid.dateUncertainty : rec('grid.dateUncertainty').value; return [Number(r[0]), Number(r[1])]; },
    apply: (inp, x) => {
      // The grid programme slips as a whole: the full-connection date and any intermediate steps move together.
      inp.grid.fullDate = addMonths(inp.grid.fullDate, x);
      inp.grid.steps = (inp.grid.steps || []).map((s) => ({ ...s, date: addMonths(s.date, x) }));
    },
    text: (x) => `${x > 0 ? '+' : ''}${x} months`,
  },
  {
    id: 'grid-price', label: 'Grid import price', record: 'grid.priceMultiplier', unit: '× current',
    range: () => { const r = rec('grid.priceMultiplier'); return [r.low / r.value, r.high / r.value]; },
    apply: (inp, x) => { inp.grid.priceMultiplier *= x; },
    text: factorText,
  },
  {
    id: 'grid-carbon', label: 'Grid carbon intensity', record: 'grid.carbonMultiplier', unit: '× current',
    range: () => { const r = rec('grid.carbonMultiplier'); return [r.low / r.value, r.high / r.value]; },
    apply: (inp, x) => { inp.grid.carbonMultiplier *= x; },
    text: factorText,
  },
  {
    id: 'gas-price', label: 'Gas commodity price', record: 'sensitivity.gasPriceFactor', unit: '× current',
    range: () => { const r = rec('sensitivity.gasPriceFactor'); return [r.low, r.high]; },
    apply: (inp, x, ctx0) => { inp.utilities.gasPrice = ctx0.gasCommodity * x; },
    text: factorText,
  },
  {
    id: 'carbon-price', label: 'Carbon price (Scope 1)', record: 'sensitivity.carbonPriceFactor', unit: '× current',
    range: () => { const r = rec('sensitivity.carbonPriceFactor'); return [r.low, r.high]; },
    apply: (inp, x, ctx0) => { inp.economics.carbonPrice = ctx0.carbonPrice * x; },
    text: factorText,
  },
  {
    id: 'wacc', label: 'WACC (real)', record: 'economics.wacc', unit: 'rate',
    range: () => { const r = rec('economics.wacc'); return [r.low, r.high]; },
    apply: (inp, x) => { inp.economics.wacc = x; },
    text: pctText,
  },
  {
    id: 'it-load', label: 'IT load (all phases)', record: 'sensitivity.itLoadFactor', unit: '× current',
    range: () => { const r = rec('sensitivity.itLoadFactor'); return [r.low, r.high]; },
    apply: (inp, x) => { inp.load.itMW *= x; inp.load.phases = inp.load.phases.map((p) => ({ ...p, itMW: Number(p.itMW) * x })); },
    text: factorText,
  },
  // Work package 9 (walkthrough 2026-10-21): the decision log's capex and capacity factors, and further drivers.
  ...[
    ['capex', 'Capex (every line)', 'economics.capexFactor', (inp, x) => { inp.economics.capexFactor = (inp.economics.capexFactor ?? 1) * x; }],
    ['capacity-factors', 'Capacity factors (on-site solar and wind)', 'utilities.reYieldFactor', (inp, x) => { inp.utilities.reYieldFactor = (inp.utilities.reYieldFactor ?? 1) * x; }],
    ['pue', 'PUE (cooling energy)', 'load.coolingFactor', (inp, x) => { inp.load.coolingFactor = (inp.load.coolingFactor ?? 1) * x; }],
    ['bess-capex', 'Battery capex', 'economics.bessCapexFactor', (inp, x) => { inp.economics.bessCapexFactor = (inp.economics.bessCapexFactor ?? 1) * x; }],
    ['grid-capex', 'Grid connection capex', 'economics.gridCapexFactor', (inp, x) => { inp.economics.gridCapexFactor = (inp.economics.gridCapexFactor ?? 1) * x; }],
  ].map(([id, label, record, apply]) => ({ id, label, record, unit: '× current', range: () => { const r = rec(record); return [r.low, r.high]; }, apply, text: factorText })),
  {
    id: 'period', label: 'Evaluation period', record: 'economics.periodYears', unit: 'years',
    range: () => { const r = rec('economics.periodYears'); return [r.low, r.high]; },
    apply: (inp, x) => { inp.economics.periodYears = x; },
    text: (x) => `${x} years`,
  },
  {
    id: 'escalation', label: 'Electricity price escalation', record: 'economics.elecEscalation', unit: 'real per year',
    range: () => { const r = rec('economics.elecEscalation'); return [r.low, r.high]; },
    apply: (inp, x) => { inp.economics.elecEscalation = x; },
    text: (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)} %/yr`,
  },
  {
    id: 'flex-trigger', label: 'Flexibility trigger level', record: 'sensitivity.flexTriggerFactor', unit: '× current',
    range: () => { const r = rec('sensitivity.flexTriggerFactor'); return [r.low, r.high]; },
    apply: (inp, x) => { inp.load.flexTriggerPrice *= x; inp.load.flexTriggerCarbon *= x; inp.load.flexTriggerTemp *= x; },
    text: factorText,
  },
  {
    id: 'test-hours', label: 'Generator test hours', record: 'requirements.testRunHours', unit: 'h/yr per unit',
    range: () => { const r = rec('requirements.testRunHours'); return [r.low, r.high]; },
    apply: (inp, x) => { inp.requirements.testRunHours = x; },
    text: (x) => `${x} h/yr`,
  },
];

// Drivers ticked by default (walkthrough 2026-10-21): the seven the decision log names.
export const DEFAULT_DRIVER_IDS = ['gas-price', 'grid-price', 'wacc', 'carbon-price', 'capex', 'capacity-factors', 'grid-date'];
// The result measured (walkthrough 2026-10-21): LCOE by default; NPV, carbon or the weighted score.
export const TORNADO_MEASURES = [
  { id: 'lcoe', label: 'LCOE', unit: '€/MWh', get: (s) => s.lcoe },
  { id: 'npv', label: 'NPV of net cost', unit: '€', get: (s) => s.npvCost },
  { id: 'carbon', label: 'Carbon, location-based', unit: 'g/kWh', get: (s) => s.carbonG },
  { id: 'score', label: 'Weighted score', unit: 'points', get: (s) => s.score },
];
export const measureById = (id) => TORNADO_MEASURES.find((m) => m.id === id) || TORNADO_MEASURES[0];
// Rows sorted by the swing in a measure (largest first); non-finite swings last.
export function sortRows(rows, measureId) {
  const m = measureById(measureId);
  const sw = (r) => { const a = m.get(r.low), b = m.get(r.high); return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(b - a) : -1; };
  return rows.slice().sort((a, c) => sw(c) - sw(a) || (a.id < c.id ? -1 : 1)).map((r) => ({ ...r, measureSwing: sw(r) }));
}

// Number of drivers shown (§13.3 "top 12 drivers", run setting, editable 1–30).
export function tornadoTopN() {
  const n = Math.floor(Number(registryValue('sensitivity.topDrivers')));
  return Math.min(30, Math.max(1, Number.isFinite(n) ? n : 12));
}

// Weighted score of one option's metrics against the base run's axis ranges and effective weights (the arithmetic of
// scoreOptions, axis by axis in SCORE_KEYS order), with each axis score clipped to 0–100.
export function scoreAgainstRun(metrics, ranges, weights) {
  let ws = 0;
  const axes = {};
  for (const k of SCORE_KEYS) {
    const r = ranges[k];
    let s = r ? axisScore(k, metrics[k], r.lo, r.hi) : 0;
    if (s > 100) s = 100; else if (s < 0) s = 0;
    axes[k] = s;
    ws += weights[k] * s;
  }
  return { score: ws, axes };
}

function summary(e, metrics, scored) {
  return {
    score: scored.score, axes: scored.axes, metrics,
    lcoe: e.eco.lcoe, npvCost: e.eco.npvCost, carbonG: e.carb.locationG, ttpMetric: e.ttp.metric, fullLoadM: e.ttp.fullLoadM,
    delivScore: e.deliv.score, siteFit: e.siteFit.status,
  };
}

// The tornado as a generator: it yields { done, total, label } after each re-run, so the UI can run it in time slices;
// tornado() drains it. opts.site: the run's site model (reused while its key matches; the drivers do not change the
// site). Returns rows sorted by score swing (largest first), the first sensitivity.topDrivers of them, and the base
// re-run (the caller checks it equals the run's score).
export function* tornadoSteps(run, optionId, { site = null, drivers = TORNADO_DRIVERS, measure = null } = {}) {
  const opt = run.options.find((o) => o.id === optionId);
  if (!opt) throw new Error(`Option ${optionId} is not in this run`);
  const inputs = normalizeInputs(run.inputs);
  const weights = run.scoring.weights;
  const ranges = run.scoring.ranges;
  const settings = inputs.settings;
  const baseSite = site && site.key === siteKey(inputs) ? site : buildSiteModel(inputs);
  const total = 1 + 2 * drivers.length;
  let done = 0;
  // Lay out only when site fit can change the score (Opus review N-8).
  const skipLayout = !inputs.deliverability.siteFitPenalty || !!(run.layoutSummary && run.layoutSummary.onDemand);
  const evalWith = (inp) => {
    const ctx = buildContext(inp, { site: siteKey(inp) === baseSite.key ? baseSite : null });
    const e = evaluateOption(ctx, opt.v, { skipLayout });
    const metrics = axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, settings);
    return { ctx, s: summary(e, metrics, scoreAgainstRun(metrics, ranges, weights)) };
  };
  const b = evalWith(inputs);
  const ctx0 = b.ctx;
  done++;
  yield { done, total, label: 'base case' };
  const rows = [];
  for (const d of drivers) {
    const [xLo, xHi] = d.range(inputs);
    const out = {};
    for (const [side, x] of [['low', xLo], ['high', xHi]]) {
      const inp = normalizeInputs(inputs);
      d.apply(inp, x, ctx0);
      out[side] = { x, text: d.text(x), ...evalWith(inp).s };
      done++;
      yield { done, total, label: `${d.label}, ${side} (${d.text(x)})` };
    }
    const r = rec(d.record);
    rows.push({
      id: d.id, label: d.label, record: d.record, unit: d.unit, basis: r ? r.basis : '', recordLabel: r ? r.label : LABEL,
      low: out.low, high: out.high,
      swing: Math.abs(out.high.score - out.low.score),
      lcoeSwing: Number.isFinite(out.high.lcoe) && Number.isFinite(out.low.lcoe) ? Math.abs(out.high.lcoe - out.low.lcoe) : Infinity,
    });
  }
  // Sorted by the swing in the chosen measure (work package 9; LCOE by default, sensitivity.defaultMeasure).
  const m = measureById(measure || (rec('sensitivity.defaultMeasure') || {}).value);
  const sorted = sortRows(rows, m.id);
  const topN = tornadoTopN();
  const country = resolveCountry(inputs);
  return {
    optionId, optionName: opt.name, optionRank: opt.rank, base: b.s, baseRunScore: opt.score,
    measure: m.id, rows: sorted.slice(0, topN), allRows: sorted, totalDrivers: drivers.length, shown: Math.min(topN, rows.length), topN,
    context: { country: COUNTRIES[country] ? COUNTRIES[country].name : country, gasCommodity: ctx0.gasCommodity, carbonPrice: ctx0.carbonPrice, gasFromInput: Number.isFinite(inputs.utilities.gasPrice), carbonFromInput: Number.isFinite(inputs.economics.carbonPrice) },
  };
}

export function tornado(run, optionId, opts = {}) {
  const it = tornadoSteps(run, optionId, opts);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}
