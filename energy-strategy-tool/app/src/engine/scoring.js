// Scoring and ranking (BRIEF §5.7, §11) and dominance marking (§7.2 step 6).
//
// Scoring scope: every screened option (dominated, flagged, custom, pinned). View filters,
// "Hide dominated options" and brushing are applied AFTER scoring in applyView() and never
// change any score or rank.

export function effectiveWeights(raw) {
  const keys = ['cost', 'carbon', 'ttp', 'deliverability'];
  const sum = keys.reduce((s, k) => s + Math.max(0, Number(raw[k]) || 0), 0);
  const equal = sum <= 0;
  const w = {};
  for (const k of keys) w[k] = equal ? 0.25 : Math.max(0, Number(raw[k]) || 0) / sum;
  return { w, equal };
}

// Axis metrics, lower is better except deliverability (higher is better).
export function axisMetrics(o, settings) {
  const cost = settings.costMetric === 'npv' ? o.eco.npvCost : o.eco.lcoe;
  const carbon = settings.carbonMetric === 'market' ? o.carbon.marketG : settings.carbonMetric === 'cfe' ? 1 - o.carbon.cfePct : o.carbon.locationG;
  return { cost, carbon, ttp: o.ttp.metric, deliverability: o.deliv.score };
}

const LOWER_BETTER = { cost: true, carbon: true, ttp: true, deliverability: false };
export const SCORE_KEYS = Object.keys(LOWER_BETTER); // axis order of the weighted sum

// Axis score 0–100 of one metric against an axis range (best = 100, worst = 0, linear; §11). Non-finite metric → 0;
// a range of zero width → 100. Used by scoreOptions and by the tornado (sensitivity.js), which scores one re-run
// option against the base run's ranges with the same arithmetic.
export function axisScore(key, x, lo, hi) {
  if (!Number.isFinite(x)) return 0;
  if (hi - lo < 1e-12) return 100;
  return LOWER_BETTER[key] ? (100 * (hi - x)) / (hi - lo) : (100 * (x - lo)) / (hi - lo);
}

export function scoreOptions(options, inputs) {
  const { w, equal } = effectiveWeights(inputs.weights);
  const keys = SCORE_KEYS;
  for (const o of options) o.metrics = axisMetrics(o, inputs.settings);
  const range = {};
  for (const k of keys) {
    let lo = Infinity, hi = -Infinity;
    for (const o of options) {
      const x = o.metrics[k];
      if (!Number.isFinite(x)) continue;
      if (x < lo) lo = x;
      if (x > hi) hi = x;
    }
    range[k] = { lo, hi };
  }
  for (const o of options) {
    o.axisScores = {};
    let ws = 0;
    for (const k of keys) {
      const { lo, hi } = range[k];
      const s = axisScore(k, o.metrics[k], lo, hi);
      o.axisScores[k] = s;
      ws += w[k] * s;
    }
    o.score = ws;
  }
  markDominance(options);
  rankOptions(options, inputs.settings.rankCompliantFirst);
  return { weights: w, equalWeightsUsed: equal, ranges: range, scope: options.length };
}

function statusRank(o) {
  const r = o.resilience.status === 'Meets' ? 2 : o.resilience.status === 'Meets with flags' ? 1 : 0;
  return r;
}
// Site-fit status rank (§7.2 step 6). Options without a site-fit result (synthetic test options) rank equal.
function siteRank(o) {
  if (!o.siteFit) return 1;
  return o.siteFit.status === 'Fits' ? 2 : o.siteFit.status === 'Fits with flags' ? 1 : 0;
}

// Pareto-dominated on (cost, carbon, ttp, deliverability) AND no better resilience or site-fit status
// (§7.2 step 6): j dominates i only if j's resilience and site-fit statuses are both at least as good.
// Dominance is a mark, not a score: it never changes a score or rank.
export function markDominance(options) {
  const n = options.length;
  const m = options.map((o) => [o.metrics.cost, o.metrics.carbon, o.metrics.ttp, -o.metrics.deliverability]);
  const sr = options.map(statusRank), fr = options.map(siteRank);
  const eps = 1e-9;
  for (let i = 0; i < n; i++) {
    options[i].dominatedBy = null;
    const a = m[i];
    const si = sr[i], fi = fr[i];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = m[j];
      if (sr[j] < si || fr[j] < fi) continue;
      let allLE = true, anyLT = false;
      for (let k = 0; k < 4; k++) {
        // Tolerance on a finite scale: with an infinite metric (LCOE with no delivered energy) the
        // old form gave Infinity − Infinity = NaN, so a finite (better) value never counted as better.
        const tol = eps * Math.max(1, Number.isFinite(a[k]) ? Math.abs(a[k]) : 0);
        if (b[k] > a[k] + tol) { allLE = false; break; }
        if (b[k] < a[k] - tol) anyLT = true;
      }
      if (allLE && anyLT) { options[i].dominatedBy = options[j].id; break; }
    }
  }
}

// "Rank requirement-compliant options first" (§11, off by default): resilience and site fit are the two
// requirement checks (§5.7), so an option is compliant unless its resilience status is "Does not meet" or its
// site-fit status is "Does not fit" (the two statuses §11 names). Options without a site-fit result
// (synthetic test options) count as compliant on site fit. Scores never change; only the order does.
export function isRequirementCompliant(o) {
  return !(o.resilience && o.resilience.status === 'Does not meet') && !(o.siteFit && o.siteFit.status === 'Does not fit');
}

export function rankOptions(options, compliantFirst) {
  const sorted = options.slice().sort((a, b) => {
    if (compliantFirst) {
      const ca = isRequirementCompliant(a) ? 0 : 1;
      const cb = isRequirementCompliant(b) ? 0 : 1;
      if (ca !== cb) return ca - cb;
    }
    return b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  sorted.forEach((o, i) => { o.rank = i + 1; });
}

// ---------------------------------------------------------------------------
// View layer (§11 user view filters, §7.2 step 6 "Hide dominated options").
// Pure: returns the visible list; never mutates score or rank.
// ---------------------------------------------------------------------------
export const DEFAULT_VIEW = Object.freeze({
  resilience: [], // statuses to show; empty = all
  siteFit: [], // site-fit statuses to show; empty = all (§11)
  flagIds: [], // show only options carrying any of these flag ids; empty = all
  hideFlagIds: [], // hide options carrying any of these
  capexCeiling: null,
  landTakeCeilingHa: null, // show only options with on-site land take at or below this (ha); null = no filter (§11)
  dominated: 'all', // 'all' | 'only' | 'non'
  hideDominated: false,
  archetypesOnly: false,
  search: '',
  sortKey: 'rank',
  sortDir: 1,
});

export function applyView(options, view) {
  const v = { ...DEFAULT_VIEW, ...view };
  const chips = [];
  let list = options;
  if (v.resilience.length) { list = list.filter((o) => v.resilience.includes(o.resilience.status)); chips.push(`Resilience: ${v.resilience.join(', ')}`); }
  if (v.siteFit.length) { list = list.filter((o) => o.siteFit && v.siteFit.includes(o.siteFit.status)); chips.push(`Site fit: ${v.siteFit.join(', ')}`); }
  if (v.flagIds.length) { list = list.filter((o) => o.flags.some((f) => v.flagIds.includes(f.id))); chips.push(`Has flag: ${v.flagIds.join(', ')}`); }
  if (v.hideFlagIds.length) { list = list.filter((o) => !o.flags.some((f) => v.hideFlagIds.includes(f.id))); chips.push(`Without flag: ${v.hideFlagIds.join(', ')}`); }
  if (v.capexCeiling != null) { list = list.filter((o) => o.eco.capex <= v.capexCeiling); chips.push(`Capex ≤ ${v.capexCeiling}`); }
  if (v.landTakeCeilingHa != null) { list = list.filter((o) => o.siteFit && o.siteFit.landTakeHa <= v.landTakeCeilingHa + 1e-9); chips.push(`Land take ≤ ${v.landTakeCeilingHa} ha`); }
  if (v.dominated === 'only') { list = list.filter((o) => o.dominatedBy); chips.push('Dominated only'); }
  if (v.dominated === 'non') { list = list.filter((o) => !o.dominatedBy); chips.push('Non-dominated only'); }
  if (v.archetypesOnly) { list = list.filter((o) => o.archetype); chips.push('Archetypes only'); }
  if (v.search) { const s = v.search.toLowerCase(); list = list.filter((o) => o.name.toLowerCase().includes(s)); chips.push(`Name contains "${v.search}"`); }
  let hiddenDominated = 0;
  if (v.hideDominated) {
    const before = list.length;
    list = list.filter((o) => !o.dominatedBy || o.custom || o.pinned);
    hiddenDominated = before - list.length;
  }
  const key = v.sortKey;
  const get = SORTERS[key] || SORTERS.rank;
  list = list.slice().sort((a, b) => {
    const x = get(a), y = get(b);
    if (x < y) return -1 * v.sortDir;
    if (x > y) return 1 * v.sortDir;
    return a.rank - b.rank;
  });
  return { list, chips, hiddenDominated };
}

const SORTERS = {
  rank: (o) => o.rank,
  score: (o) => -o.score,
  lcoe: (o) => o.eco.lcoe,
  capex: (o) => o.eco.capex,
  npv: (o) => o.eco.npvCost,
  carbon: (o) => o.metrics.carbon,
  cfe: (o) => -o.carbon.cfePct,
  ttp: (o) => o.ttp.metric,
  deliverability: (o) => -o.deliv.score,
  unmet: (o) => o.unmet.mwh,
  landTake: (o) => (o.siteFit ? o.siteFit.landTakeM2 : Infinity),
  siteFit: (o) => (o.siteFit ? ['Fits', 'Fits with flags', 'Does not fit'].indexOf(o.siteFit.status) : 3),
  flags: (o) => o.flags.length,
  name: (o) => o.name,
};
