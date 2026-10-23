// Results cards (BRIEF §12, work package 6; OPEN-QUESTIONS 24, 2026-10-23) and identical-result marks
// (KNOWN-ISSUES item 5). Pure: no UI.
//
// Top five: five distinct strategies, the best-ranked option of each (a strategy = grid strategy C1, bridging plant
// C2, firm generation C4 and backup C5), in rank order, so the cards follow the ranking (adequate options first).
// Pros and cons are judged against every option in the run, and the card says so. An option whose figures are the
// same as a better-ranked option's is marked "same results as #k" and never takes a card.

export const STRATEGY_KEYS = ['C1', 'C2', 'C4', 'C5'];
export const strategyKey = (o) => STRATEGY_KEYS.map((k) => o.v[k]).join('|');

const near = (a, b) => (a === b) || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)));
const FIGS = [(o) => o.eco.lcoe, (o) => o.eco.npvCost, (o) => o.eco.capex, (o) => o.carbon.locationG, (o) => o.carbon.marketG, (o) => o.carbon.cfePct, (o) => o.ttp.metric, (o) => o.deliv.score, (o) => o.unmet.mwh];
export function sameFigures(a, b) {
  return FIGS.every((f) => near(f(a), f(b))) && a.resilience.status === b.resilience.status && !!(a.adequacy && a.adequacy.adequate) === !!(b.adequacy && b.adequacy.adequate);
}

// Map id → the better-ranked option with the same figures (KNOWN-ISSUES item 5). O(n log n) on a rounded key.
export function identicalResults(options) {
  const byRank = [...options].sort((a, b) => a.rank - b.rank);
  const key = (o) => FIGS.map((f) => { const x = f(o); return Number.isFinite(x) ? x.toPrecision(10) : String(x); }).join('|') + `|${o.resilience.status}|${o.adequacy ? o.adequacy.adequate : ''}`;
  const first = new Map();
  const out = new Map();
  for (const o of byRank) {
    const k = key(o);
    const f = first.get(k);
    if (f && sameFigures(f, o)) out.set(o.id, f);
    else if (!f) first.set(k, o);
  }
  return out;
}

// Metrics judged for pros and cons (lower is better unless stated).
export const CARD_METRICS = [
  { id: 'lcoe', label: 'LCOE', get: (o) => o.eco.lcoe, fmt: (x) => `€${Math.round(x).toLocaleString('en-GB')}/MWh` },
  { id: 'capex', label: 'capex', get: (o) => o.eco.capex, fmt: (x) => `€${Number((x / 1e6).toPrecision(3)).toLocaleString('en-GB')} m` },
  { id: 'carbon', label: 'carbon (location-based)', get: (o) => o.carbon.locationG, fmt: (x) => `${Math.round(x).toLocaleString('en-GB')} g/kWh` },
  { id: 'cfe', label: 'hourly carbon-free energy', higher: true, get: (o) => o.carbon.cfePct, fmt: (x) => `${(x * 100).toFixed(0)} %` },
  { id: 'ttp', label: 'time-to-power', get: (o) => o.ttp.metric, fmt: (x) => `${Number(x.toPrecision(3))} months` },
  { id: 'deliverability', label: 'deliverability', higher: true, get: (o) => o.deliv.score, fmt: (x) => `${Math.round(x)} points` },
];

// Share of the run that is strictly better than x on a metric (0 = best in the run).
function betterShare(sorted, x, higher) {
  // sorted ascending; count strictly better values
  let lo = 0, hi = sorted.length;
  if (!higher) { while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < x) lo = mid + 1; else hi = mid; } return lo / sorted.length; }
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] <= x) lo = mid + 1; else hi = mid; }
  return (sorted.length - lo) / sorted.length;
}

// Pros: metrics where the option is in the best 10 % of the run; cons: in the worst half. Up to three each, the
// strongest first. Comparison set: every option in the run.
export const PRO_SHARE = 0.10, CON_SHARE = 0.50;
export function prosCons(o, options, sortedCache = new Map()) {
  const pros = [], cons = [];
  for (const m of CARD_METRICS) {
    let s = sortedCache.get(m.id);
    if (!s) { s = options.map(m.get).filter(Number.isFinite).sort((a, b) => a - b); sortedCache.set(m.id, s); }
    const x = m.get(o);
    if (!Number.isFinite(x) || !s.length) continue;
    const share = betterShare(s, x, m.higher);
    const pct = Math.round(share * 100);
    if (share <= PRO_SHARE) pros.push({ id: m.id, share, text: share === 0 ? `Best ${m.label} in the run (${m.fmt(x)})` : `${m.label[0].toUpperCase() + m.label.slice(1)} in the best ${Math.max(1, pct)} % (${m.fmt(x)})` });
    else if (share >= CON_SHARE) cons.push({ id: m.id, share, text: `${m.label[0].toUpperCase() + m.label.slice(1)} worse than ${pct} % of the run (${m.fmt(x)})` });
  }
  pros.sort((a, b) => a.share - b.share);
  cons.sort((a, b) => b.share - a.share);
  return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
}

// The top-five cards: five distinct strategies in rank order, skipping identical results.
export function topCards(options, n = 5) {
  const same = identicalResults(options);
  const byRank = [...options].sort((a, b) => a.rank - b.rank);
  const seen = new Set();
  const cache = new Map();
  const out = [];
  for (const o of byRank) {
    if (same.has(o.id)) continue;
    const k = strategyKey(o);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ o, strategy: k, ...prosCons(o, options, cache), majorFlags: o.flags.filter((f) => f.severity === 'major') });
    if (out.length >= n) break;
  }
  return { cards: out, comparison: `against the ${options.length.toLocaleString('en-GB')} options in this run`, identical: same };
}

// Live description of a weight change (BRIEF §11; walkthrough 2026-10-21).
const AX = [['cost', 'Cost'], ['carbon', 'Carbon'], ['ttp', 'Time-to-power'], ['deliverability', 'Deliverability']];
export function describeWeightChange(prevW, newW, prevLeader, newLeader, options) {
  const pct = (w, k) => Math.round(w[k] * 100);
  const changed = AX.filter(([k]) => pct(prevW, k) !== pct(newW, k)).map(([k, l]) => `${l} ${pct(prevW, k)} → ${pct(newW, k)} %`);
  if (!changed.length) return null;
  let effect;
  if (!prevLeader || !newLeader) effect = '';
  else if (prevLeader.id === newLeader.id) effect = ` The leader is unchanged: #1 ${newLeader.name} (score ${newLeader.score.toFixed(1)}).`;
  else {
    const prevNow = options.find((o) => o.id === prevLeader.id);
    effect = ` New leader: ${newLeader.name} (score ${newLeader.score.toFixed(1)}); the previous leader, ${prevLeader.name}, is now #${prevNow ? prevNow.rank : '?'}.`;
  }
  return `Weights changed: ${changed.join(', ')}.${effect}`;
}
