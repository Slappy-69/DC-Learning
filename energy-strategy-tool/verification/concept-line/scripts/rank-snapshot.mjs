// Snapshot rankings and time-to-power of bridging-battery options, for before/after comparison.
import { writeFileSync } from 'node:fs';
import { referenceT1, referenceT3, runModel } from './dc-learning/energy-strategy-tool/app/src/engine/index.js';
const out = {};
const withBessBridge = (mk) => () => { const i = mk(); i.choices = i.choices || {}; i.choices.C2 = { state: 'open', values: ['gasRecip', 'fuelCell', 'rented', 'bessSolar'] }; return i; };
for (const [name, mk] of [['T1', referenceT1], ['T3', referenceT3], ['T1+bessSolar', withBessBridge(referenceT1)]]) {
  const run = runModel(mk(), { source: 'snap' });
  const byRank = [...run.options].sort((a, b) => a.rank - b.rank);
  out[name] = {
    top10: byRank.slice(0, 10).map((o) => ({ id: o.id, name: o.name, score: +o.score.toFixed(3) })),
    bessSolar: run.options.filter((o) => o.v.C2 === 'bessSolar').map((o) => ({ id: o.id, rank: o.rank, ttp: +o.ttp.metric.toFixed(3), first: o.ttp.firstPowerM, full: o.ttp.fullLoadM, gap: +o.ttp.gapMWm.toFixed(2), unmet: Math.round(o.unmet.mwh), C12: o.v.C12 })),
    n: run.options.length,
  };
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
for (const k of Object.keys(out)) console.log(k, 'options', out[k].n, 'bessSolar options', out[k].bessSolar.length, 'leader', out[k].top10[0].name, out[k].top10[0].score);
