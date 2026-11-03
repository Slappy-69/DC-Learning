// Trial (owner's item 10, 2026-11-02): does sampling 2,000 options miss better ones, and would a local search find them?
// Ground truth: every valid combination of T1 run without sampling. Not product code.
import { writeFileSync } from 'node:fs';
import { referenceT1, referenceT3 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { CHOICES } from '../src/engine/defaults.js';
const which = process.argv[2] || 'T1';
const mk = which === 'T3' ? referenceT3 : referenceT1;
const base = mk({ analysisStart: '2027-01' });
const t0 = Date.now();
const sampled = runModel(base);
const tS = Date.now() - t0;
const fullIn = mk({ analysisStart: '2027-01' }); fullIn.settings.generationCap = 1e6;
const t1 = Date.now();
const full = runModel(fullIn);
const tF = Date.now() - t1;
const ids = CHOICES.map((c) => c.id);
const key = (v) => ids.map((k) => v[k]).join('|');
const byKey = new Map(full.options.map((o) => [key(o.v), o]));
const rankF = (o) => byKey.get(key(o.v));
const sLead = sampled.options.find((o) => o.rank === 1), fLead = full.options.find((o) => o.rank === 1);
const sInF = rankF(sLead);
const fLeadSampled = sampled.options.some((o) => key(o.v) === key(fLead.v));
// Neighbours: options of the full set that differ in one choice.
const groups = new Map();
for (const o of full.options) for (const c of ids) { const k = c + '#' + ids.map((x) => (x === c ? '*' : o.v[x])).join('|'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); }
const neighbours = (o) => { const out = new Set(); for (const c of ids) { const k = c + '#' + ids.map((x) => (x === c ? '*' : o.v[x])).join('|'); for (const n of groups.get(k) || []) if (n !== o) out.add(n); } return [...out]; };
// Greedy local search from the sampled top N, scored on the full run's ranking (rank 1 = best).
const N = 10;
const starts = sampled.options.slice().sort((a, b) => a.rank - b.rank).slice(0, N).map(rankF).filter(Boolean);
const seen = new Set(); let evals = 0;
let best = starts.reduce((a, b) => (a.rank < b.rank ? a : b));
for (const s0 of starts) {
  let cur = s0;
  for (;;) {
    const ns = neighbours(cur).filter((n) => !seen.has(n.id));
    ns.forEach((n) => seen.add(n.id)); evals += ns.length;
    const nb = ns.reduce((a, b) => (!a || b.rank < a.rank ? b : a), null);
    if (nb && nb.rank < cur.rank) cur = nb; else break;
  }
  if (cur.rank < best.rank) best = cur;
}
const res = { which, combos: full.options.length, sampledN: sampled.options.length, tSampledS: tS / 1000, tFullS: tF / 1000,
  sampledLeaderRankInFull: sInF ? sInF.rank : null, fullLeaderInSample: fLeadSampled,
  scoreGap: sInF ? fLead.score - sInF.score : null, fullLeader: fLead.name, sampledLeader: sLead.name,
  localSearch: { starts: N, evaluations: evals, bestRankFound: best.rank } };
console.log(JSON.stringify(res, null, 1));
writeFileSync(`./${which}.json`, JSON.stringify(res, null, 1));
