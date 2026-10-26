// Lead's own confirmation of H6 findings MED-1 and MED-3 (T1, working tree = commit 33f9c1a).
const APP = new URL('../../../app/src/engine/', import.meta.url).href.replace(/\/$/, '');
const { referenceT1 } = await import(`${APP}/defaults.js`);
const { runModel } = await import(`${APP}/run.js`);
const { breakevenCompetitors } = await import(`${APP}/breakeven.js`);
const { topCards, sameFigures } = await import(`${APP}/cards.js`);
const { monteCarlo } = await import(`${APP}/montecarlo.js`);

let t = Date.now();
const run = runModel(referenceT1());
console.log(`T1 run ${((Date.now() - t) / 1000).toFixed(1)} s; ${run.options.length} options`);
const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
const L = byRank[0];

// MED-1: the pool with 5 cards (the record) and with 6 (the code).
const five = topCards(run.options, 5).cards.map((c) => `#${c.o.rank}`);
const six = topCards(run.options, 6).cards.map((c) => `#${c.o.rank}`);
console.log('top-five cards:', five.join(' '), '| six cards:', six.join(' '));
console.log('code competitors (n+1 = 6 cards):', breakevenCompetitors(run).map((o) => `#${o.rank}`).join(' '));
// What the record (five cards, then next-ranked options) would give:
const out = [];
const second = byRank.find((o) => o !== L && !sameFigures(L, o)); if (second) out.push(second);
for (const c of topCards(run.options, 5).cards) { if (out.length >= 5) break; if (c.o !== L && !out.includes(c.o)) out.push(c.o); }
for (const o of byRank) { if (out.length >= 5) break; if (o !== L && !out.includes(o) && !sameFigures(L, o)) out.push(o); }
console.log('record competitors (5 cards, then next-ranked):', out.sort((a, b) => a.rank - b.rank).map((o) => `#${o.rank}`).join(' '));
console.log('strategy of #3 shares a card with:', (() => { const s = (o) => [o.v.C1, o.v.C2, o.v.C4, o.v.C5].join('|'); const o3 = byRank[2]; return byRank.slice(0, 2).map((o) => `#${o.rank}:${s(o) === s(o3)}`).join(' ') + ` (#3 strategy ${s(o3)})`; })());

// MED-3: robust counts at 300 samples.
t = Date.now();
const mc = monteCarlo(run, { site: run.ctx && run.ctx.site, samples: 300 });
console.log(`MC 300 x ${mc.rows.length}: ${((Date.now() - t) / 1000).toFixed(1)} s; band ${mc.band}; robust pick #${mc.rows.find((r) => r.id === mc.robustPickId).rank}`);
for (const r of mc.rows.slice().sort((a, b) => b.pRobust - a.pRobust || a.rank - b.rank).slice(0, 4)) {
  console.log(`  #${r.rank}: within band ${Math.round(r.pRobust * 300)}/300 (${(r.pRobust * 100).toFixed(2)} %), leads ${(r.pRank1 * 100).toFixed(1)} %, top3 ${(r.pTop3 * 100).toFixed(1)} %`);
}
