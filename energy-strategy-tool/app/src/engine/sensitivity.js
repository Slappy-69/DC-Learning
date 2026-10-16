// Deterministic tornado sensitivity for one option (BRIEF §13.3).
//
// For each driver the option is re-run at its low and high values, holding everything else
// fixed. The option's weighted score is recomputed against the axis ranges of the base run,
// so the normalisation is held at base-run scale and a value outside the base range scores
// beyond 0–100 (clipped to 0–100 here, so the score stays on the same scale as the ranking).
// Only the chosen option is re-evaluated; the other options and their ranks are not changed.
//
// Pure: no UI, no browser APIs. Uses the same per-option chain as runModelSteps (size →
// dispatch → time-to-power → economics → carbon → resilience → flags → deliverability).

import { buildContext } from './context.js';
import { normalizeInputs } from './defaults.js';
import { sizeOption } from './sizing.js';
import { dispatchConfig, dispatchAll } from './dispatch.js';
import { timeToPower, economics, carbon, resilience, optionFlags, deliverability } from './evaluate.js';
import { effectiveWeights, axisMetrics, axisScore } from './scoring.js';
import { addMonths } from './dates.js';

// Drivers. `kind` is 'mult' (value is a multiplier on the base value) or 'abs' (value replaces it).
// `ctx` drivers scale a field on the built context after buildContext (for values that are
// derived from the country profile and have no numeric input yet); `input` drivers change the
// normalised inputs before the context is built.
export const TORNADO_DRIVERS = [
  { id: 'grid-date', label: 'Grid full-connection date', unit: 'months', kind: 'shift', low: -6, high: 24, basis: 'judgement (BRIEF §13.1, OPEN-QUESTIONS 15); indicative — unverified',
    apply: (inp, x) => { inp.grid.fullDate = addMonths(inp.grid.fullDate, x); return {}; }, show: (x) => `${x > 0 ? '+' : ''}${x} months` },
  { id: 'grid-price', label: 'Grid import price', unit: '× base', kind: 'mult', low: 0.7, high: 1.5, basis: 'judgement; registry range; indicative — unverified',
    apply: (inp, x) => { inp.grid.priceMultiplier *= x; return {}; }, show: (x) => `× ${x}` },
  { id: 'grid-carbon', label: 'Grid carbon intensity', unit: '× base', kind: 'mult', low: 0.8, high: 1.2, basis: 'judgement; indicative — unverified',
    apply: (inp, x) => { inp.grid.carbonMultiplier *= x; return {}; }, show: (x) => `× ${x}` },
  { id: 'gas-price', label: 'Gas price (commodity)', unit: '× base', kind: 'mult', low: 0.7, high: 1.3, basis: 'judgement; indicative — unverified (no numeric gas input yet, scaled on the built context)',
    apply: () => ({}), show: (x) => `× ${x}` },
  { id: 'ets', label: 'EU ETS carbon price', unit: '× base', kind: 'mult', low: 0.5, high: 1.5, basis: 'judgement; indicative — unverified (scaled on the built context)',
    apply: () => ({}), show: (x) => `× ${x}` },
  { id: 'wacc', label: 'WACC (real)', unit: 'fraction', kind: 'abs', low: 0.04, high: 0.12, basis: 'judgement; registry range; indicative — unverified',
    apply: (inp, x) => { inp.economics.wacc = x; return {}; }, show: (x) => `${(x * 100).toFixed(1)} %` },
  { id: 'it-load', label: 'IT load', unit: '× base', kind: 'mult', low: 0.8, high: 1.2, basis: 'judgement; indicative — unverified',
    apply: (inp, x) => { inp.load.itMW *= x; for (const p of inp.load.phases) p.itMW *= x; return {}; }, show: (x) => `× ${x}` },
];

// Gas and ETS prices come from the country profile on the built context (no numeric input yet),
// so they are scaled on the context after buildContext.
function patchContext(ctx, x, driver) {
  if (driver.id === 'gas-price') ctx.gasPrice *= x;
  if (driver.id === 'ets') ctx.carbonPrice *= x;
  return ctx;
}

// Evaluate one option vector under the given (normalised) inputs and the base run's axis ranges.
export function evaluateVector(inputs, v, weights, ranges, settings, driver = null, x = null) {
  const inp = normalizeInputs(inputs);
  if (driver) driver.apply(inp, x);
  const ctx = buildContext(inp);
  if (driver) patchContext(ctx, x, driver);
  const sz = sizeOption(ctx, v);
  const cfg = dispatchConfig(ctx, v, sz);
  const disp = dispatchAll(ctx, cfg, null);
  const ttp = timeToPower(ctx, v, sz);
  const eco = economics(ctx, v, sz, disp, ttp);
  const carb = carbon(ctx, sz, eco, disp);
  const res = resilience(ctx, v, sz);
  const flags = optionFlags(ctx, v, sz, disp, ttp, eco, carb, res);
  const deliv = deliverability(ctx, v, sz, disp, flags);
  const metrics = axisMetrics({ eco, carbon: carb, ttp, deliv }, settings);
  let score = 0;
  const axes = {};
  for (const k of ['cost', 'carbon', 'ttp', 'deliverability']) {
    const r = ranges[k];
    const s = Number.isFinite(metrics[k]) && r ? Math.min(100, Math.max(0, axisScore(k, metrics[k], r.lo, r.hi))) : 0;
    axes[k] = s;
    score += weights[k] * s;
  }
  return { score, axes, metrics, lcoe: eco.lcoe, npvCost: eco.npvCost, carbonG: carb.locationG, ttpMetric: ttp.metric, reachedFull: ttp.reachedFull };
}

// Tornado for one option of a run (uses run.inputs, run.scoring.ranges and the run's weights).
// Returns rows sorted by swing (largest first), and the base score recomputed through the same
// chain so the caller can confirm the recomputation matches the run.
export function tornado(run, optionId, { drivers = TORNADO_DRIVERS, topN = 12 } = {}) {
  const opt = run.options.find((o) => o.id === optionId);
  if (!opt) throw new Error(`Option ${optionId} is not in this run`);
  const inputs = run.inputs;
  const { w } = effectiveWeights(inputs.weights);
  const ranges = run.scoring.ranges;
  const settings = inputs.settings;
  const base = evaluateVector(inputs, opt.v, w, ranges, settings);
  const rows = drivers.map((d) => {
    const lo = evaluateVector(inputs, opt.v, w, ranges, settings, d, d.low);
    const hi = evaluateVector(inputs, opt.v, w, ranges, settings, d, d.high);
    return {
      id: d.id, label: d.label, basis: d.basis, unit: d.unit,
      low: { x: d.low, text: d.show(d.low), ...pick(lo) }, high: { x: d.high, text: d.show(d.high), ...pick(hi) },
      swing: Math.abs(hi.score - lo.score),
      lcoeSwing: Math.abs((hi.lcoe ?? NaN) - (lo.lcoe ?? NaN)),
    };
  });
  rows.sort((a, b) => b.swing - a.swing);
  return { optionId, optionName: opt.name, base: pick(base), baseRunScore: opt.score, rows: rows.slice(0, topN), totalDrivers: drivers.length, shown: Math.min(topN, drivers.length) };
}

function pick(e) {
  return { score: e.score, lcoe: e.lcoe, carbonG: e.carbonG, ttpMetric: e.ttpMetric, axes: e.axes };
}
