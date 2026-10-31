// Opus review H4-H6, script r4: how much the representative-day tier moves the Monte Carlo headline figures on T1.
// (a) base values, no driver moved: the leader and #7 on representative days against the run's full-year figures;
// (b) 100 samples, representative days against the full year: the leader's LCOE P10/P50/P90, its share of leading,
//     the robust pick.
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1, normalizeInputs } = await import(`${APP}defaults.js`);
const { runModel } = await import(`${APP}run.js`);
const { buildContext } = await import(`${APP}context.js`);
const { evaluateOption } = await import(`${APP}option.js`);
const { representativeHours } = await import(`${APP}dispatch.js`);
const { monteCarlo } = await import(`${APP}montecarlo.js`);
const run = runModel(referenceT1());
const site = run.ctx.site;
const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
const ctx = buildContext(normalizeInputs(run.inputs), { site });
const rep = representativeHours(ctx);
console.log(`(a) ${rep.label}`);
for (const o of byRank.slice(0, 20)) {
  const e = evaluateOption(ctx, o.v, { rep, skipLayout: true });
  console.log(`  #${o.rank} ${o.id}: LCOE full ${o.eco.lcoe.toFixed(2)} rep ${e.eco.lcoe.toFixed(2)} (${(100 * (e.eco.lcoe / o.eco.lcoe - 1)).toFixed(2)} %); carbon full ${o.carbon.locationG.toFixed(1)} rep ${e.carb.locationG.toFixed(1)}; adequate full ${o.adequacy.adequate} rep ${e.adequacy.adequate}`);
}
for (const screening of [true, false]) {
  const t = Date.now();
  const mc = monteCarlo(run, { site, samples: 100, screening });
  const lr = mc.rows.find((r) => r.id === mc.leaderId), rb = mc.rows.find((r) => r.id === mc.robustPickId);
  console.log(`(b) ${screening ? 'representative days' : 'full year'} (${((Date.now() - t) / 1000).toFixed(1)} s): leader LCOE P10 ${lr.lcoe.p10.toFixed(1)} P50 ${lr.lcoe.p50.toFixed(1)} P90 ${lr.lcoe.p90.toFixed(1)}; leads ${(lr.pRank1 * 100).toFixed(0)} %, top3 ${(lr.pTop3 * 100).toFixed(0)} %; robust #${rb.rank} (${rb.nRobust}/${mc.samples}, #1 ${lr.nRobust}); adequate in ${(lr.pAdequate * 100).toFixed(0)} %`);
}
