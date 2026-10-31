// Opus review H4-H6, script r2: what the breakeven table and the Monte Carlo claim, against a full re-run of the model.
// (a) For each breakeven flip on T1: a full runModel with the driver at the two ends of the flip's bracket. Does the
//     competitor really overtake the leader, and does it then lead the run ("#k would lead")?
// (b) For the first three Monte Carlo samples: a full runModel with all thirteen sampled values applied. Does the
//     sample's first option (top 20, base run's axis ranges, representative days) lead the full run?
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1, normalizeInputs } = await import(`${APP}defaults.js`);
const { runModel } = await import(`${APP}run.js`);
const { buildContext } = await import(`${APP}context.js`);
const { breakevens, nearestFlips } = await import(`${APP}breakeven.js`);
const { monteCarlo } = await import(`${APP}montecarlo.js`);
const { TORNADO_DRIVERS } = await import(`${APP}sensitivity.js`);
const base = referenceT1();
let t = Date.now();
const run = runModel(base);
const site = run.ctx && run.ctx.site;
const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
const L = byRank[0];
console.log(`T1 ${((Date.now() - t) / 1000).toFixed(1)} s; leader ${L.id} ${L.score.toFixed(4)}`);
// Check that a run of the normalised inputs equals the run of the raw inputs (so (a) and (b) compare like with like).
const runN = runModel(normalizeInputs(base));
const LN = runN.options.reduce((a, b) => (a.rank < b.rank ? a : b));
console.log(`normalised-input run: leader ${LN.id} ${LN.score.toFixed(4)} (same: ${LN.id === L.id && Math.abs(LN.score - L.score) < 1e-9})`);
const ctx0 = buildContext(normalizeInputs(base), { site });
t = Date.now();
const be = breakevens(run, { site });
console.log(`breakevens ${((Date.now() - t) / 1000).toFixed(1)} s; competitors ${be.competitors.map((c) => `#${c.rank} ${c.id}`).join(', ')}`);
const flips = nearestFlips(be, Infinity);
console.log(`${flips.length} flips`);
const rankIn = (r, id) => { const o = r.options.find((x) => x.id === id); return o ? o.rank : 'absent'; };
for (const f of flips) {
  const d = TORNADO_DRIVERS.find((x) => x.id === f.row.id);
  console.log(`\nFLIP ${f.text}  [bracket ${f.flip.from} .. ${f.flip.to}]`);
  for (const x of [f.flip.from, f.flip.to]) {
    const inp = normalizeInputs(base);
    d.apply(inp, x, ctx0);
    t = Date.now();
    const r = runModel(inp);
    const lead = r.options.reduce((a, b) => (a.rank < b.rank ? a : b));
    console.log(`  full re-run at ${d.text(x)} (${((Date.now() - t) / 1000).toFixed(1)} s): leader ${lead.id} (${lead.id === L.id ? 'the T1 leader' : lead.id === f.comp.id ? `the competitor #${f.comp.rank}` : `another option, T1 #${rankIn(run, lead.id)}`}); T1 leader now #${rankIn(r, L.id)}, competitor #${f.comp.rank} now #${rankIn(r, f.comp.id)}`);
  }
}
// (b) Monte Carlo samples against full re-runs.
t = Date.now();
const mc = monteCarlo(run, { site, samples: 300 });
console.log(`\nMC 300 x ${mc.rows.length} ${((Date.now() - t) / 1000).toFixed(1)} s`);
for (let i = 0; i < mc.firstSamples.length; i++) {
  const s = mc.firstSamples[i];
  const inp = normalizeInputs(base);
  for (const d of TORNADO_DRIVERS) if (d.id in s.values) d.apply(inp, s.values[d.id], ctx0);
  t = Date.now();
  const r = runModel(inp);
  const lead = r.options.reduce((a, b) => (a.rank < b.rank ? a : b));
  const mcFirst = s.order[0];
  console.log(`sample ${i + 1}: values ${Object.entries(s.values).map(([k, v]) => `${k}=${Number(v.toPrecision(3))}`).join(' ')}`);
  console.log(`  MC first ${mcFirst} (T1 #${rankIn(run, mcFirst)}); full re-run (${((Date.now() - t) / 1000).toFixed(1)} s) leader ${lead.id} (T1 #${rankIn(run, lead.id)}); MC first is #${rankIn(r, mcFirst)} in the full re-run; T1 leader #${rankIn(r, L.id)}`);
}
