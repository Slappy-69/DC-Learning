// Opus review H4-H6, script r1: Monte Carlo scope and stability on T1.
// (a) default MC (300 samples, top 20): leader's share of leading, robust pick with counts;
// (b) the same samples over the top 60: does the leader's share fall when more options can lead?
// (c) robust pick and leader share across five seeds (sampling noise).
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1 } = await import(`${APP}defaults.js`);
const { runModel } = await import(`${APP}run.js`);
const { monteCarlo } = await import(`${APP}montecarlo.js`);
const t0 = Date.now();
const run = runModel(referenceT1());
const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
const L = byRank[0];
console.log(`T1 run ${((Date.now() - t0) / 1000).toFixed(1)} s, ${run.options.length} options, leader ${L.id} score ${L.score.toFixed(4)}`);
const site = run.ctx && run.ctx.site;
const show = (tag, mc) => {
  const lr = mc.rows.find((r) => r.id === L.id), rb = mc.rows.find((r) => r.id === mc.robustPickId);
  const leadOthers = mc.rows.filter((r) => r.pRank1 > 0 && r.id !== L.id).map((r) => `#${r.rank}:${(r.pRank1 * 100).toFixed(1)}%`).join(' ');
  console.log(`${tag}: rows ${mc.rows.length}; #1 leads ${(lr.pRank1 * 100).toFixed(1)} % top3 ${(lr.pTop3 * 100).toFixed(1)} %; robust pick #${rb.rank} (${rb.nRobust}/${mc.samples}) vs #1 ${lr.nRobust}; others leading: ${leadOthers}`);
  return lr;
};
let t = Date.now();
const mc20 = monteCarlo(run, { site, samples: 300 });
console.log(`  (${((Date.now() - t) / 1000).toFixed(1)} s)`);
const l20 = show('A top-20, seed default', mc20);
t = Date.now();
const mc60 = monteCarlo(run, { site, samples: 300, nOptions: 60 });
console.log(`  (${((Date.now() - t) / 1000).toFixed(1)} s)`);
const l60 = show('B top-60, seed default', mc60);
const outside = mc60.rows.filter((r) => r.rank > 20 && r.pRank1 > 0);
console.log(`B: options ranked below 20 that lead in some sample: ${outside.length ? outside.map((r) => `#${r.rank} ${r.id} ${(r.pRank1 * 100).toFixed(1)} %`).join('; ') : 'none'}`);
const outsideTop3 = mc60.rows.filter((r) => r.rank > 20 && r.pTop3 > 0);
console.log(`B: options ranked below 20 in some sample's top three: ${outsideTop3.length}; largest share ${outsideTop3.length ? Math.max(...outsideTop3.map((r) => r.pTop3 * 100)).toFixed(1) : 0} %`);
console.log(`Leader share of leading: top-20 ${(l20.pRank1 * 100).toFixed(1)} % against top-60 ${(l60.pRank1 * 100).toFixed(1)} %; top three ${(l20.pTop3 * 100).toFixed(1)} % against ${(l60.pTop3 * 100).toFixed(1)} %`);
for (const seed of [1, 2, 3, 4, 5]) {
  t = Date.now();
  const mc = monteCarlo(run, { site, samples: 300, seed });
  show(`C seed ${seed} (${((Date.now() - t) / 1000).toFixed(1)} s)`, mc);
}
