// Lead's own confirmation of H6 finding MED-5 (long steps) and LOW-2 (current value outside the record range).
import { loadavg } from 'node:os';
const APP = new URL('../../../app/src/engine/', import.meta.url).href.replace(/\/$/, '');
const { referenceT1, normalizeInputs } = await import(`${APP}/defaults.js`);
const { runModel } = await import(`${APP}/run.js`);
const { breakevenSteps } = await import(`${APP}/breakeven.js`);
const { monteCarloSteps } = await import(`${APP}/montecarlo.js`);
const { TORNADO_DRIVERS } = await import(`${APP}/sensitivity.js`);

const run = runModel(referenceT1());
const inputs = normalizeInputs(run.inputs);
console.log('driver ranges for T1 (low, high):');
for (const d of TORNADO_DRIVERS.filter((x) => ['wacc', 'period', 'escalation', 'test-hours'].includes(x.id))) console.log(' ', d.id, JSON.stringify(d.range(inputs)));

function steps(label, gen) {
  const times = []; let last = performance.now(); let r = gen.next();
  while (!r.done) { const now = performance.now(); times.push(now - last); last = performance.now(); r = gen.next(); }
  times.push(performance.now() - last);
  const over = times.filter((x) => x > 50);
  console.log(`${label}: ${times.length} steps, total ${(times.reduce((a, b) => a + b, 0) / 1000).toFixed(1)} s, over 50 ms: ${over.length}, longest ${Math.max(...times).toFixed(0)} ms, load ${loadavg()[0].toFixed(2)}`);
}
steps('breakevens', breakevenSteps(run, { site: run.ctx && run.ctx.site }));
steps('monte carlo 100 x 20', monteCarloSteps(run, { site: run.ctx && run.ctx.site, samples: 100 }));
