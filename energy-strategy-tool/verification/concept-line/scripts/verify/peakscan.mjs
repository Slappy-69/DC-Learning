// Scan real options: does any explicit year's peak-net hour fall in hours 8736-8759 (not in any week window)?
const APP = '/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/engine/index.js';
const E = await import(APP);
const out = [];
const t0 = Date.now();
for (const [name, ref] of [['T1', E.referenceT1()], ['T3', E.referenceT3()]]) {
  const run = E.runModel(ref);
  let n = 0, hits = 0, yearsChecked = 0, worst = null, lastDayPeaks = 0;
  for (const o of run.options) {
    const I = E.inspectOption(run.inputs, o.v);
    n++;
    I.years.forEach((Y) => {
      yearsChecked++;
      const net = Y.hourly.net; let ph = 0;
      for (let h = 1; h < net.length; h++) if (net[h] > net[ph]) ph = h;
      if (ph >= 8736) { hits++; if (!worst) worst = { id: o.id, rank: o.rank, year: Y.index + 1, hour: ph }; }
      const pk = E.weekPresets(Y.hourly).find((p) => p.id === 'peak');
      const r = E.weekRange(pk.week);
      if (!(ph >= r.from && ph < r.to)) lastDayPeaks++;
    });
  }
  out.push(`${name}: options ${n}, explicit years ${yearsChecked}, peak hour in hours 8736-8759: ${hits}; peak preset window does not contain the peak hour: ${lastDayPeaks}; first hit ${JSON.stringify(worst)}; elapsed ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  console.log(out[out.length - 1]);
}
