// Results cards (BRIEF §12, work package 6; OPEN-QUESTIONS 24, 2026-10-23) and identical-result marks
// (KNOWN-ISSUES item 5). Pure: no UI.
//
// Top five: five distinct strategies, the best-ranked option of each (a strategy = grid strategy C1, bridging plant
// C2, firm generation C4 and backup C5), in rank order, so the cards follow the ranking (adequate options first).
// Pros and cons are judged against every option in the run, and the card says so. An option whose figures are the
// same as a better-ranked option's is marked "same results as #k" and never takes a card.
import { perMWh, money } from '../format.js';

export const STRATEGY_KEYS = ['C1', 'C2', 'C4', 'C5'];
// Realism rebuild (2026-11-11, OPEN-QUESTIONS 251): a strategy is the campus's permanent supply: islanded or on the grid,
// the firm plant and how it is sized, the bridging plant that keeps running after the grid arrives, and a grid
// connection taken over. How the first buildings are bridged, the standby fuel, solar, batteries and PPAs are variants
// of one strategy: the card shows the best-ranked one. Before, the key held the bridging plant, so five cards could
// show one permanent supply five times.
export function supplyKey(o) {
  const v = o.v;
  const kept = v.C1 === 'islanded' ? v.C2 : v.C1 === 'bridge' && (v.C3 === 'prime' || v.C3 === 'split') ? v.C2 : '-';
  // A nearby plant is one strategy whether it is leased, bought or contracted: the plant, not the deal.
  const plantId = (x) => { const m = /^x[lbw]:(.+)$/.exec(String(x)); return m ? `plant:${m[1]}` : x === 'existing' ? 'plant:manual' : x; };
  return [v.C1 === 'islanded' ? 'islanded' : 'grid', plantId(v.C4), v.C4 === 'none' ? '-' : v.C4s, plantId(kept), v.C21 && v.C21 !== 'n/a' ? v.C21 : '-'].join('|');
}
export const strategyKey = (o) => (o.deliv && o.deliv.buildability ? supplyKey(o) : STRATEGY_KEYS.map((k) => o.v[k]).join('|'));

const near = (a, b) => (a === b) || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)));
const FIGS = [(o) => o.eco.lcoe, (o) => o.eco.npvCost, (o) => o.eco.capex, (o) => o.carbon.locationG, (o) => o.carbon.marketG, (o) => o.carbon.cfePct, (o) => o.ttp.metric, (o) => o.deliv.score, (o) => o.unmet.mwh];
export function sameFigures(a, b) {
  return FIGS.every((f) => near(f(a), f(b))) && a.resilience.status === b.resilience.status && !!(a.adequacy && a.adequacy.adequate) === !!(b.adequacy && b.adequacy.adequate);
}

// Map id → the better-ranked option with the same figures (KNOWN-ISSUES item 5). O(n log n) on a rounded key.
// The key is kept per option result (its eco object, shared by the copies the app makes on each re-score), so a weight
// change does not rebuild 17,344 keys when every combination is screened (work package 23).
const KEY_CACHE = new WeakMap();
const figKey = (o) => FIGS.map((f) => { const x = f(o); return Number.isFinite(x) ? x.toPrecision(10) : String(x); }).join('|') + `|${o.resilience.status}|${o.adequacy ? o.adequacy.adequate : ''}`;
// The result is kept per options array: the Options tab, the cards and the screens' run share one array after a
// re-score (work package 23), so the 17,344 options are ordered once, not three times.
// The ranks are checked, so an array re-scored in place is ordered again.
const SAME_CACHE = new WeakMap();
const rankPrint = (options) => { let h = options.length; for (const o of options) h = (Math.imul(h, 31) + o.rank) | 0; return h; };
// The options in rank order, kept per array in the same way (read-only: callers copy before changing it).
const ORDER_CACHE = new WeakMap();
export function byRank(options) {
  const print = rankPrint(options);
  const hit = ORDER_CACHE.get(options);
  if (hit && hit.print === print) return hit.list;
  const list = [...options].sort((a, b) => a.rank - b.rank);
  ORDER_CACHE.set(options, { print, list });
  return list;
}
export function identicalResults(options) {
  const print = rankPrint(options);
  const hit = SAME_CACHE.get(options);
  if (hit && hit.print === print) return hit.out;
  const out = identicalResultsOf(options);
  SAME_CACHE.set(options, { print, out });
  return out;
}
function identicalResultsOf(options) {
  const ranked = byRank(options);
  const key = (o) => {
    if (!o.eco || typeof o.eco !== 'object') return figKey(o);
    let k = KEY_CACHE.get(o.eco);
    if (k === undefined) { k = figKey(o); KEY_CACHE.set(o.eco, k); }
    return k;
  };
  const first = new Map();
  const out = new Map();
  for (const o of ranked) {
    const k = key(o);
    const f = first.get(k);
    if (f && sameFigures(f, o)) out.set(o.id, f);
    else if (!f) first.set(k, o);
  }
  return out;
}

// Metrics judged for pros and cons (lower is better unless stated).
export const CARD_METRICS = [
  { id: 'lcoe', label: 'LCOE', get: (o) => o.eco.lcoe, fmt: (x) => perMWh(x, 3) },
  { id: 'capex', label: 'capex', get: (o) => o.eco.capex, fmt: (x) => money(x, 3) },
  { id: 'carbon', label: 'carbon (location-based)', get: (o) => o.carbon.locationG, fmt: (x) => `${Math.round(x).toLocaleString('en-GB')} g/kWh` },
  { id: 'cfe', label: 'hourly carbon-free energy', higher: true, get: (o) => o.carbon.cfePct, fmt: (x) => `${(x * 100).toFixed(0)} %` },
  { id: 'ttp', label: 'time-to-power', get: (o) => o.ttp.metric, fmt: (x) => `${Number(x.toPrecision(3))} months late` },
  { id: 'deliverability', label: 'deliverability', higher: true, get: (o) => o.deliv.score, fmt: (x) => `${Math.round(x)} points` },
];

// Share of the run that is as good as x or better (ties included).
function asGoodShare(sorted, x, higher) {
  let lo = 0, hi = sorted.length;
  if (!higher) { while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] <= x + 1e-12) lo = mid + 1; else hi = mid; } return lo / sorted.length; }
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < x - 1e-12) lo = mid + 1; else hi = mid; }
  return (sorted.length - lo) / sorted.length;
}

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
    // A pro must set the option apart: the share as good or better (ties included) is within the best 10 %. Without
    // this, a value most options share (for example no delay at all) was a pro for every one of them.
    if (share <= PRO_SHARE && asGoodShare(s, x, m.higher) <= PRO_SHARE) pros.push({ id: m.id, share, text: share === 0 ? `Best ${m.label} in the run (${m.fmt(x)})` : `${m.label[0].toUpperCase() + m.label.slice(1)} in the best ${Math.max(1, pct)} % (${m.fmt(x)})` });
    // Rounded down and capped at 99 %, so the worst option never reads "worse than 100 %" (Haiku check H3, L1).
    else if (share >= CON_SHARE) cons.push({ id: m.id, share, text: `${m.label[0].toUpperCase() + m.label.slice(1)} worse than ${Math.min(99, Math.floor(share * 100))} % of the run (${m.fmt(x)})` });
  }
  pros.sort((a, b) => a.share - b.share);
  cons.sort((a, b) => b.share - a.share);
  return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
}

// The options the top-five cards show: five (n) distinct strategies in rank order, skipping identical results.
export function cardOptions(options, n = 5) {
  const same = identicalResults(options);
  const seen = new Set();
  const out = [];
  // Realism rebuild (OPEN-QUESTIONS 251): the cards as a ladder. Options that power more IT rank first, so five cards
  // of the leading strategies could hide a sound strategy that powers one building fewer. The first cards are the
  // leading strategies; the last cards (up to two) are the best-ranked option of each lower level of IT, so the price
  // of the last buildings can be read off the cards.
  const ranked = byRank(options);
  const itOf = (o) => (o.sizing && o.sizing.energise ? Math.round(o.sizing.energise.poweredIT * 100) / 100 : null);
  if (ranked.length && ranked[0].deliv && ranked[0].deliv.buildability && itOf(ranked[0]) != null) {
    const topIT = itOf(ranked[0]);
    const steps = [];
    const seenIT = new Set([topIT]);
    for (const o of ranked) {
      const it = itOf(o);
      if (it == null || it >= topIT || it <= 0 || seenIT.has(it) || same.has(o.id)) continue;
      // Only a step a developer could build: adequate, tier A or B, resilience met.
      if (!(o.rankKeys && o.rankKeys.adequate && o.rankKeys.likely && o.rankKeys.resilient)) continue;
      seenIT.add(it); steps.push(o);
    }
    // A step down is worth a card only when it is cheaper than every step above it (less IT at a higher cost is
    // no one's choice).
    steps.sort((a, b) => itOf(b) - itOf(a));
    let floor = ranked[0].metrics ? ranked[0].metrics.cost : Infinity;
    for (let i = 0; i < steps.length;) { const c = steps[i].metrics ? steps[i].metrics.cost : Infinity; if (c < floor) { floor = c; i++; } else steps.splice(i, 1); }
    const nSteps = Math.min(2, steps.length);
    for (const o of ranked) {
      if (out.length >= n - nSteps) break;
      if (same.has(o.id) || itOf(o) !== topIT) continue;
      const k = strategyKey(o);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ o, strategy: k });
    }
    for (const o of steps.slice(0, n - out.length)) out.push({ o, strategy: strategyKey(o), step: true, stepIT: itOf(o), topIT });
    // Fewer leading strategies than cards: further options in rank order fill the rest.
    if (out.length < n) for (const o of ranked) {
      if (out.length >= n) break;
      if (same.has(o.id) || out.some((x) => x.o === o)) continue;
      const k = `${strategyKey(o)}|${itOf(o)}`;
      if (seen.has(k) || seen.has(strategyKey(o))) continue;
      seen.add(k);
      out.push({ o, strategy: strategyKey(o) });
    }
    return out;
  }
  for (const o of byRank(options)) {
    if (same.has(o.id)) continue;
    const k = strategyKey(o);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ o, strategy: k });
    if (out.length >= n) break;
  }
  return out;
}

// The top-five cards. `sortedCache`: the run's figures sorted for the pros and cons; they do not change with the weights, so the app keeps
// one per run (work package 23: six sorts of 17,344 figures on every weight change otherwise).
export function topCards(options, n = 5, sortedCache = new Map()) {
  const out = cardOptions(options, n).map(({ o, strategy, step = false, stepIT = null, topIT = null }) => ({ o, strategy, step, stepIT, topIT, ...prosCons(o, options, sortedCache), majorFlags: o.flags.filter((f) => f.severity === 'major') }));
  return { cards: out, comparison: `against the ${options.length.toLocaleString('en-GB')} options in this run`, identical: identicalResults(options) };
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
