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

export function scoreOptions(options, inputs) {
  const { w, equal } = effectiveWeights(inputs.weights);
  const keys = Object.keys(LOWER_BETTER);
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
      const x = o.metrics[k];
      let s;
      if (!Number.isFinite(x)) s = 0;
      else if (hi - lo < 1e-12) s = 100;
      else s = LOWER_BETTER[k] ? (100 * (hi - x)) / (hi - lo) : (100 * (x - lo)) / (hi - lo);
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

// Pareto-dominated on (cost, carbon, ttp, deliverability) AND no better resilience (or site-fit) status.
// Site fit is not assessed in this slice, so only resilience status is compared.
export function markDominance(options) {
  const n = options.length;
  const m = options.map((o) => [o.metrics.cost, o.metrics.carbon, o.metrics.ttp, -o.metrics.deliverability]);
  const eps = 1e-9;
  for (let i = 0; i < n; i++) {
    options[i].dominatedBy = null;
    const a = m[i];
    const si = statusRank(options[i]);
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = m[j];
      if (statusRank(options[j]) < si) continue;
      let allLE = true, anyLT = false;
      for (let k = 0; k < 4; k++) {
        if (b[k] > a[k] + eps * Math.max(1, Math.abs(a[k]))) { allLE = false; break; }
        if (b[k] < a[k] - eps * Math.max(1, Math.abs(a[k]))) anyLT = true;
      }
      if (allLE && anyLT) { options[i].dominatedBy = options[j].id; break; }
    }
  }
}

export function rankOptions(options, compliantFirst) {
  const sorted = options.slice().sort((a, b) => {
    if (compliantFirst) {
      const ca = a.resilience.status === 'Does not meet' ? 1 : 0;
      const cb = b.resilience.status === 'Does not meet' ? 1 : 0;
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
  flagIds: [], // show only options carrying any of these flag ids; empty = all
  hideFlagIds: [], // hide options carrying any of these
  capexCeiling: null,
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
  if (v.flagIds.length) { list = list.filter((o) => o.flags.some((f) => v.flagIds.includes(f.id))); chips.push(`Has flag: ${v.flagIds.join(', ')}`); }
  if (v.hideFlagIds.length) { list = list.filter((o) => !o.flags.some((f) => v.hideFlagIds.includes(f.id))); chips.push(`Without flag: ${v.hideFlagIds.join(', ')}`); }
  if (v.capexCeiling != null) { list = list.filter((o) => o.eco.capex <= v.capexCeiling); chips.push(`Capex ≤ ${v.capexCeiling}`); }
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
  flags: (o) => o.flags.length,
  name: (o) => o.name,
};
