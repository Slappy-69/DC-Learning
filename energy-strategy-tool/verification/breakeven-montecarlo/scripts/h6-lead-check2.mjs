// Lead's own confirmation of H6 finding MED-4: breakeven base (the run's figures) against a full-year re-run of the same
// option at the same inputs, when the run used the representative-day screening tier.
const APP = new URL('../../../app/src/engine/', import.meta.url).href.replace(/\/$/, '');
const { referenceT1, normalizeInputs } = await import(`${APP}/defaults.js`);
const { runModel } = await import(`${APP}/run.js`);
const { buildContext } = await import(`${APP}/context.js`);
const { evaluateOption } = await import(`${APP}/option.js`);
const { breakevenCompetitors } = await import(`${APP}/breakeven.js`);
const { axisMetrics, axisScore, SCORE_KEYS } = await import(`${APP}/scoring.js`);

for (const model of ['full', 'repDays']) {
  const raw = referenceT1();
  raw.settings = { ...(raw.settings || {}), screeningModel: model };
  let t = Date.now();
  const run = runModel(raw);
  console.log(`\n== screeningModel ${model}: run ${((Date.now() - t) / 1000).toFixed(1)} s`);
  const inputs = normalizeInputs(run.inputs);
  const ctx = buildContext(normalizeInputs(inputs), { site: run.ctx && run.ctx.site });
  const w = run.scoring.weights, ranges = run.scoring.ranges;
  const line = (m) => SCORE_KEYS.reduce((a, k) => a + w[k] * (ranges[k] ? axisScore(k, m[k], ranges[k].lo, ranges[k].hi) : 0), 0);
  const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
  const L = byRank[0];
  for (const o of [L, ...breakevenCompetitors(run)]) {
    const e = evaluateOption(ctx, o.v);
    const m = axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, inputs.settings);
    console.log(`  #${String(o.rank).padEnd(3)} run line ${line(o.metrics).toFixed(4)}  full-year re-run ${line(m).toFixed(4)}  diff ${(line(m) - line(o.metrics)).toFixed(4)}  LCOE ${o.eco.lcoe.toFixed(2)} -> ${e.eco.lcoe.toFixed(2)}  verified=${o.verified ?? o.fullYear ?? '?'}`);
  }
}
