// Pareto trade-off view model (BRIEF §12.2, §11, §7.2 step 6). Implements HOOKS.paretoView.
//
// Pure and UI-free. It reads scores, ranks and dominance marks that scoring.js has already
// written and never changes any of them: no scoring, ranking or dispatch happens here. A weight
// change therefore needs only scoreOptions() (re-score, no dispatch) followed by paretoView().
//
// Two different "Pareto" notions appear and are kept apart:
//  - Dominance mark (engine, §7.2 step 6): `o.dominatedBy`, on all four axes (cost, carbon,
//    time-to-power, deliverability) plus status. Set by scoring.js; shown here as a hollow marker.
//  - 2-D frontier (this view, §12.2): options not dominated on the two plotted axes (both lower
//    is better). Drawn as a step line. It is computed over the whole scoring set (every screened
//    option), so view filters never move it, in line with the §11 scoring scope.

import { applyView, DEFAULT_VIEW } from './scoring.js';

// Axis choices: cost metrics on x, carbon metrics on y (§9.5, §9.6, §11). Lower is better on all.
export const PARETO_AXES = Object.freeze({
  x: {
    lcoe: { id: 'lcoe', label: 'LCOE', unit: '€/MWh', get: (o) => o.eco.lcoe },
    npv: { id: 'npv', label: 'NPV of net cost', unit: '€', get: (o) => o.eco.npvCost },
  },
  y: {
    location: { id: 'location', label: 'Carbon, location-based', unit: 'gCO₂e/kWh', get: (o) => o.carbon.locationG },
    market: { id: 'market', label: 'Carbon, market-based', unit: 'gCO₂e/kWh', get: (o) => o.carbon.marketG },
    cfe: { id: 'cfe', label: 'Carbon, 1 − hourly CFE', unit: '%', get: (o) => 1 - o.carbon.cfePct },
  },
});

// Default axes follow the scoring settings (§12.2 default: cost vs carbon).
export function defaultParetoAxes(settings = {}) {
  return {
    x: PARETO_AXES.x[settings.costMetric] ? settings.costMetric : 'lcoe',
    y: PARETO_AXES.y[settings.carbonMetric] ? settings.carbonMetric : 'location',
  };
}

// 2-D Pareto set, both axes minimised. Input [{id, x, y}]; non-finite points are ignored.
// A point is dominated if another point is <= on both axes and < on at least one. Exact ties
// do not dominate each other, so duplicates are all on the frontier.
// Returns the non-dominated ids, sorted by x then y then id. O(n log n).
export function paretoFrontier(points) {
  const pts = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  pts.sort((a, b) => a.x - b.x || a.y - b.y || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const out = [];
  let bestY = Infinity; // lowest y among points with strictly smaller x
  let i = 0;
  while (i < pts.length) {
    // Group of equal x
    let j = i;
    while (j < pts.length && pts[j].x === pts[i].x) j++;
    const groupMinY = pts[i].y; // sorted by y within the group
    for (let k = i; k < j; k++) {
      const p = pts[k];
      // Dominated by an earlier x with y <= p.y, or by a same-x point with smaller y.
      if (bestY <= p.y) continue;
      if (p.y > groupMinY) continue;
      out.push(p.id);
    }
    if (groupMinY < bestY) bestY = groupMinY;
    i = j;
  }
  return out;
}

// Weighted pick: the option with the highest weighted score (§11), ties broken by id, which is
// the same order rankOptions() uses. Equals rank 1 unless "Rank requirement-compliant options
// first" is on.
export function weightedPick(options) {
  let best = null;
  for (const o of options) {
    if (!Number.isFinite(o.score)) continue;
    if (!best || o.score > best.score || (o.score === best.score && o.id < best.id)) best = o;
  }
  return best;
}

// Time-to-power colour classes (§12.2 colour = time-to-power): up to 5 quantile classes over the
// scoring set, so the classes do not move when a view filter changes. Time-to-power is often
// clustered (many options reach full load on the grid date), so tied quantile edges are merged and
// fewer classes are used; each class then maps to a spread of the 5-step ramp (rampIndex).
export const TTP_CLASSES = 5;
function quantileBreaks(values, k) {
  const s = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return { min: null, max: null, breaks: [] };
  const br = [];
  for (let i = 1; i < k; i++) {
    const v = s[Math.min(s.length - 1, Math.floor((i * s.length) / k))];
    if (v > s[0] && (!br.length || v > br[br.length - 1])) br.push(v);
  }
  return { min: s[0], max: s[s.length - 1], breaks: br };
}
function classOf(x, breaks) {
  if (!Number.isFinite(x)) return null;
  let c = 0;
  while (c < breaks.length && x >= breaks[c]) c++;
  return c;
}
// Ramp step (0..TTP_CLASSES-1) for class c of n classes, spread end to end.
export function rampIndex(c, n) {
  if (c == null) return null;
  return n <= 1 ? Math.floor((TTP_CLASSES - 1) / 2) : Math.round((c * (TTP_CLASSES - 1)) / (n - 1));
}

// HOOKS.paretoView(run, axes, view) => model.
// `view` is the user's view state (filters and "Hide dominated options"); default DEFAULT_VIEW
// (hide dominated: off). Filters only decide which points are shown.
export function paretoView(run, axes, view = DEFAULT_VIEW) {
  const opts = run.options;
  const ax = { ...defaultParetoAxes(run.inputs && run.inputs.settings), ...(axes || {}) };
  const X = PARETO_AXES.x[ax.x];
  const Y = PARETO_AXES.y[ax.y];
  if (!X || !Y) throw new Error(`Unknown Pareto axes ${ax.x} / ${ax.y}`);

  const frontier = paretoFrontier(opts.map((o) => ({ id: o.id, x: X.get(o), y: Y.get(o) })));
  const onFrontier = new Set(frontier);
  const pick = weightedPick(opts);
  const leader = opts.length ? opts.reduce((a, b) => (a.rank < b.rank ? a : b)) : null;
  const ttpQ = quantileBreaks(opts.map((o) => o.ttp.metric), TTP_CLASSES);
  let cmin = Infinity, cmax = -Infinity;
  for (const o of opts) { const c = o.eco.capex; if (Number.isFinite(c)) { if (c < cmin) cmin = c; if (c > cmax) cmax = c; } }
  const byId = new Map(opts.map((o) => [o.id, o]));

  const { list, chips, hiddenDominated } = applyView(opts, { ...view, sortKey: 'rank', sortDir: 1 });
  const points = list.map((o) => {
    const x = X.get(o), y = Y.get(o);
    const dom = o.dominatedBy ? byId.get(o.dominatedBy) : null;
    return {
      id: o.id,
      name: o.name,
      rank: o.rank,
      score: o.score,
      x, y,
      plotted: Number.isFinite(x) && Number.isFinite(y),
      ttp: o.ttp.metric,
      ttpClass: rampIndex(classOf(o.ttp.metric, ttpQ.breaks), ttpQ.breaks.length + 1),
      capex: o.eco.capex,
      resilience: o.resilience.status,
      dominatedBy: o.dominatedBy || null,
      dominatedByName: dom ? dom.name : null,
      dominatedByRank: dom ? dom.rank : null,
      onFrontier: onFrontier.has(o.id),
      isPick: !!pick && pick.id === o.id,
      archetype: o.archetype || null,
    };
  });
  const plotted = points.filter((p) => p.plotted);
  const ext = (k) => {
    let lo = Infinity, hi = -Infinity;
    for (const o of opts) { const v = (k === 'x' ? X : Y).get(o); if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }
    return Number.isFinite(lo) ? [lo, hi] : [0, 1];
  };
  return {
    axes: { x: X.id, y: Y.id },
    xAxis: { id: X.id, label: X.label, unit: X.unit, domain: ext('x') },
    yAxis: { id: Y.id, label: Y.label, unit: Y.unit, domain: ext('y') },
    points, // visible options, in rank order; plotted === false when x or y is not finite
    plottedCount: plotted.length,
    notPlotted: points.filter((p) => !p.plotted).map((p) => p.id),
    frontier, // ids on the 2-D frontier over the whole scoring set, sorted by x
    frontierXY: frontier.map((id) => { const o = byId.get(id); return { id, x: X.get(o), y: Y.get(o), visible: list.includes(o) }; }),
    pickId: pick ? pick.id : null,
    pickName: pick ? pick.name : null,
    pickScore: pick ? pick.score : null,
    pickVisible: !!pick && points.some((p) => p.id === pick.id),
    leaderId: leader ? leader.id : null,
    scoringSetSize: opts.length,
    dominatedCount: opts.filter((o) => o.dominatedBy).length,
    hiddenDominated,
    chips,
    ttpScale: { classes: ttpQ.breaks.length + 1, min: ttpQ.min, max: ttpQ.max, breaks: ttpQ.breaks, rampSteps: Array.from({ length: ttpQ.breaks.length + 1 }, (_, c) => rampIndex(c, ttpQ.breaks.length + 1)) },
    capexRange: Number.isFinite(cmin) ? [cmin, cmax] : [0, 1],
  };
}

// Table alternative (§17 accessibility: every chart has a data-table alternative). One row per
// point in the view, same order, same values.
export function paretoTableRows(model) {
  return model.points.map((p) => ({
    id: p.id,
    rank: p.rank,
    name: p.name,
    score: p.score,
    x: p.x,
    y: p.y,
    plotted: p.plotted,
    ttp: p.ttp,
    capex: p.capex,
    resilience: p.resilience,
    dominated: p.dominatedBy ? `Dominated by #${p.dominatedByRank}` : 'Not dominated',
    frontier: p.onFrontier,
    pick: p.isPick,
  }));
}
