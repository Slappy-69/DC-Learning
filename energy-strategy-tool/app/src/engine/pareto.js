// Pareto trade-off view model (BRIEF §12.2, §11, §7.2 step 6). Implements HOOKS.paretoView.
//
// Pure and UI-free. It reads scores, ranks and dominance marks that scoring.js has already
// written and never changes any of them: no scoring, ranking or dispatch happens here. A weight
// change therefore needs only scoreOptions() (re-score, no dispatch) followed by paretoView().
//
// Two different "Pareto" notions appear and are kept apart:
//  - Dominance mark (engine, §7.2 step 6): `o.dominatedBy`, on all four axes (cost, carbon,
//    time-to-power, deliverability) with no better resilience or site-fit status. Set by scoring.js;
//    shown here as a hollow marker.
//  - 2-D frontier (this view, §12.2): options not dominated on the two plotted axes, each in its
//    own "better" direction. Drawn as a step line. It is computed over the whole scoring set
//    (every screened option), so view filters never move it, in line with the §11 scoring scope.
//
// View settings (default axes, time-to-power classes, Canvas threshold, first display) are read
// from the §18 registry at the point of use (view.js / registryValue), never from a local copy.

import { applyView, isRequirementCompliant } from './scoring.js';
import { defaultView, viewSetting } from './view.js';

// Axis metrics (§11: cost, carbon, time-to-power, deliverability; §9.5, §9.6 metric variants).
// §12.2 "any two axes": x and y can each be any of these.
const AXIS_LIST = [
  { id: 'lcoe', group: 'cost', label: 'LCOE', unit: '€/MWh', better: 'lower', get: (o) => o.eco.lcoe },
  { id: 'npv', group: 'cost', label: 'NPV of net cost', unit: '€', better: 'lower', get: (o) => o.eco.npvCost },
  { id: 'location', group: 'carbon', label: 'Carbon, location-based', unit: 'gCO₂e/kWh', better: 'lower', get: (o) => o.carbon.locationG },
  { id: 'market', group: 'carbon', label: 'Carbon, market-based', unit: 'gCO₂e/kWh', better: 'lower', get: (o) => o.carbon.marketG },
  { id: 'cfe', group: 'carbon', label: 'Carbon, 1 − hourly CFE', unit: '%', better: 'lower', get: (o) => 1 - o.carbon.cfePct },
  { id: 'ttp', group: 'time-to-power', label: 'Time-to-power', unit: 'months', better: 'lower', get: (o) => o.ttp.metric },
  { id: 'deliverability', group: 'deliverability', label: 'Deliverability', unit: 'points', better: 'higher', get: (o) => o.deliv.score },
];
const BY_ID = Object.freeze(Object.fromEntries(AXIS_LIST.map((a) => [a.id, Object.freeze(a)])));
export const PARETO_AXIS_LIST = Object.freeze(AXIS_LIST.map((a) => BY_ID[a.id]));
// Kept as {x, y} maps for callers; both hold every axis.
export const PARETO_AXES = Object.freeze({ x: BY_ID, y: BY_ID });
export const PARETO_AXIS_GROUPS = Object.freeze([['cost', 'Cost'], ['carbon', 'Carbon'], ['time-to-power', 'Time-to-power'], ['deliverability', 'Deliverability']]);

// Default axes (§12.2 default: cost vs carbon), from view.pareto.xAxis / yAxis. "follow-scoring"
// means the scoring Cost / Carbon axis metric; any axis id fixes the default to that axis.
export function defaultParetoAxes(settings = {}) {
  const resolve = (key, follow, fallback) => {
    const v = viewSetting(key);
    if (v === 'follow-scoring') return BY_ID[follow] ? follow : fallback;
    if (BY_ID[v]) return v;
    throw new Error(`view.${key} = ${JSON.stringify(v)} is not "follow-scoring" or an axis id`);
  };
  return { x: resolve('pareto.xAxis', settings.costMetric, 'lcoe'), y: resolve('pareto.yAxis', settings.carbonMetric, 'location') };
}

// Canvas above this many plotted points (§4), from view.pareto.canvasAbove.
export function paretoCanvasAbove() {
  const n = Number(viewSetting('pareto.canvasAbove'));
  if (!(n >= 0)) throw new Error('view.pareto.canvasAbove must be a number ≥ 0');
  return n;
}
// First display of the Trade-offs tab ("chart" or "table"), from view.pareto.display.
export function paretoDefaultDisplay() {
  const d = viewSetting('pareto.display');
  if (d !== 'chart' && d !== 'table') throw new Error('view.pareto.display must be "chart" or "table"');
  return d;
}

// 2-D Pareto set, both axes minimised. Input [{id, x, y}]; non-finite points are ignored.
// A point is dominated if another point is <= on both axes and < on at least one. Exact ties
// do not dominate each other, so duplicates are all on the frontier.
// Returns the non-dominated ids, sorted by x then y then id. O(n log n).
// (Higher-is-better axes are negated by the caller, so this always minimises.)
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

// Weighted pick = the weighted leader = rank 1 (§11 ranking, AC5 "the highlighted Pareto pick … always
// match[es] the weighted leader"). The header "Leader", the live "New leader" announcement and the
// plain-English summary (when built) use this same function, so they always name the same option.
// With "Rank requirement-compliant options first" off (default), rank 1 is the highest weighted score,
// ties to the lower id. With it on, rank 1 is the best-scoring requirement-compliant option: resilience not
// "Does not meet" (scoring.js isRequirementCompliant; site fit no longer counts, walkthrough 2026-10-21).
export function weightedPick(options) {
  let best = null;
  for (const o of options) if (Number.isFinite(o.rank) && (!best || o.rank < best.rank)) best = o;
  return best;
}

// Highest weighted score, ties broken by id (the order rankOptions() uses within a group). Differs
// from weightedPick() only when "Rank requirement-compliant options first" is on and the top scorer is not
// requirement-compliant (resilience "Does not meet"); the view then marks it
// separately and says why.
export function highestWeightedScore(options) {
  let best = null;
  for (const o of options) {
    if (!Number.isFinite(o.score)) continue;
    if (!best || o.score > best.score || (o.score === best.score && o.id < best.id)) best = o;
  }
  return best;
}

// Time-to-power colour classes (§12.2 colour = time-to-power): up to view.pareto.ttpClasses quantile
// classes over the scoring set, so the classes do not move when a view filter changes. Time-to-power is
// often clustered (many options reach full load on the grid date), so tied quantile edges are merged and
// fewer classes are used; each class then maps to a spread of the ramp (rampIndex).
export const TTP_RAMP_STEPS = 5; // colour tokens --ttp-1 … --ttp-5 in styles.css
export function paretoTtpClasses() {
  const k = Math.floor(Number(viewSetting('pareto.ttpClasses')));
  if (!(k >= 1 && k <= TTP_RAMP_STEPS)) throw new Error(`view.pareto.ttpClasses must be 1–${TTP_RAMP_STEPS} (the colour ramp has ${TTP_RAMP_STEPS} steps)`);
  return k;
}
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
// Ramp step (0..TTP_RAMP_STEPS-1) for class c of n classes, spread end to end.
export function rampIndex(c, n) {
  if (c == null) return null;
  return n <= 1 ? Math.floor((TTP_RAMP_STEPS - 1) / 2) : Math.round((c * (TTP_RAMP_STEPS - 1)) / (n - 1));
}

// HOOKS.paretoView(run, axes, view) => model.
// `view` is the user's view state (filters and "Hide dominated options"); default defaultView()
// (no filter, hide dominated at its registered default: off). Filters only decide which points are shown.
export function paretoView(run, axes, view = defaultView()) {
  const opts = run.options;
  const ax = { ...defaultParetoAxes(run.inputs && run.inputs.settings), ...(axes || {}) };
  const X = BY_ID[ax.x];
  const Y = BY_ID[ax.y];
  if (!X || !Y) throw new Error(`Unknown Pareto axes ${ax.x} / ${ax.y}`);
  const sgnX = X.better === 'higher' ? -1 : 1, sgnY = Y.better === 'higher' ? -1 : 1;

  const frontier = paretoFrontier(opts.map((o) => ({ id: o.id, x: sgnX * X.get(o), y: sgnY * Y.get(o) })));
  const onFrontier = new Set(frontier);
  const pick = weightedPick(opts);
  const top = highestWeightedScore(opts);
  const topDiffers = !!(pick && top && top.id !== pick.id);
  const compliantFirst = !!(run.inputs && run.inputs.settings && run.inputs.settings.rankCompliantFirst);
  const ttpQ = quantileBreaks(opts.map((o) => o.ttp.metric), paretoTtpClasses());
  let cmin = Infinity, cmax = -Infinity;
  for (const o of opts) { const c = o.eco.capex; if (Number.isFinite(c)) { if (c < cmin) cmin = c; if (c > cmax) cmax = c; } }
  const byId = new Map(opts.map((o) => [o.id, o]));

  const { list, chips, hiddenDominated } = applyView(opts, { ...view, sortKey: 'rank', sortDir: 1 });
  const shownIds = new Set(list.map((o) => o.id));
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
      // §12.2 marker shape = site-fit status (moved from resilience when the site slice added site fit).
      siteFit: o.siteFit ? o.siteFit.status : null,
      landTakeHa: o.siteFit ? o.siteFit.landTakeHa : null,
      dominatedBy: o.dominatedBy || null,
      dominatedByName: dom ? dom.name : null,
      dominatedByRank: dom ? dom.rank : null,
      onFrontier: onFrontier.has(o.id),
      isPick: !!pick && pick.id === o.id,
      isTopScore: topDiffers && top.id === o.id,
      archetype: o.archetype || null,
    };
  });
  const plotted = points.filter((p) => p.plotted);
  const ext = (A) => {
    let lo = Infinity, hi = -Infinity;
    for (const o of opts) { const v = A.get(o); if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }
    return Number.isFinite(lo) ? [lo, hi] : [0, 1];
  };
  const finiteXY = (o) => Number.isFinite(X.get(o)) && Number.isFinite(Y.get(o));
  // Why the pick is not on the chart, when it is not: hidden by "Hide dominated options", hidden by
  // other view filters, or not plottable (no finite value on an axis). Never silent (§2 principle 5).
  const pickShown = !!pick && shownIds.has(pick.id);
  let pickHiddenBy = null;
  if (pick && !pickShown) {
    const withoutHide = applyView(opts, { ...view, hideDominated: false, sortKey: 'rank', sortDir: 1 }).list;
    pickHiddenBy = view.hideDominated && pick.dominatedBy && withoutHide.some((o) => o.id === pick.id) ? 'hide-dominated' : 'filters';
  }
  const pickDom = pick && pick.dominatedBy ? byId.get(pick.dominatedBy) : null;
  return {
    axes: { x: X.id, y: Y.id },
    xAxis: { id: X.id, label: X.label, unit: X.unit, better: X.better, group: X.group, domain: ext(X) },
    yAxis: { id: Y.id, label: Y.label, unit: Y.unit, better: Y.better, group: Y.group, domain: ext(Y) },
    points, // visible options, in rank order; plotted === false when x or y is not finite
    plottedCount: plotted.length,
    notPlotted: points.filter((p) => !p.plotted).map((p) => p.id),
    frontier, // ids on the 2-D frontier over the whole scoring set, sorted along the frontier
    frontierXY: frontier.map((id) => { const o = byId.get(id); return { id, x: X.get(o), y: Y.get(o), visible: shownIds.has(id) }; }),
    // Weighted pick = rank 1 = the header leader (AC5).
    pickId: pick ? pick.id : null,
    pickName: pick ? pick.name : null,
    pickScore: pick ? pick.score : null,
    pickRank: pick ? pick.rank : null,
    pickShown, // in the current view (table row present)
    pickPlotted: !!pick && finiteXY(pick),
    pickVisible: pickShown && !!pick && finiteXY(pick), // drawn on the chart
    pickHiddenBy, // null | 'hide-dominated' | 'filters'
    pickDominatedBy: pickDom ? { id: pickDom.id, name: pickDom.name, rank: pickDom.rank } : null,
    leaderId: pick ? pick.id : null, // same option as the pick by construction
    // Highest weighted score, only when it is not the pick (compliant-first on).
    topScoreId: topDiffers ? top.id : null,
    topScoreName: topDiffers ? top.name : null,
    topScore: topDiffers ? top.score : null,
    topScoreRank: topDiffers ? top.rank : null,
    topScoreStatus: topDiffers ? top.resilience.status : null,
    topScoreSiteFit: topDiffers && top.siteFit ? top.siteFit.status : null,
    topScoreReason: topDiffers ? (compliantFirst && !isRequirementCompliant(top) ? 'compliant-first' : 'ranking') : null,
    // The requirement checks it fails, in words (for the pick line), when the reason is compliant-first.
    topScoreFailing: topDiffers ? [
      ...(top.resilience && top.resilience.status === 'Does not meet' ? ['its resilience status is "Does not meet"'] : []),
    ] : null,
    topScoreVisible: topDiffers && shownIds.has(top.id) && finiteXY(top),
    scoringSetSize: opts.length,
    dominatedCount: opts.filter((o) => o.dominatedBy).length,
    hiddenDominated,
    chips,
    ttpScale: { classes: ttpQ.breaks.length + 1, maxClasses: paretoTtpClasses(), min: ttpQ.min, max: ttpQ.max, breaks: ttpQ.breaks, rampSteps: Array.from({ length: ttpQ.breaks.length + 1 }, (_, c) => rampIndex(c, ttpQ.breaks.length + 1)) },
    capexRange: Number.isFinite(cmin) ? [cmin, cmax] : [0, 1],
  };
}

// "Dominated by [option name]" (§7.2 step 6), with the rank first for orientation.
export function dominatedLabel(p) {
  return p.dominatedBy ? `Dominated by #${p.dominatedByRank} ${p.dominatedByName}` : 'Not dominated';
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
    siteFit: p.siteFit,
    landTakeHa: p.landTakeHa,
    dominated: dominatedLabel(p),
    frontier: p.onFrontier,
    pick: p.isPick,
    topScore: p.isTopScore,
  }));
}
