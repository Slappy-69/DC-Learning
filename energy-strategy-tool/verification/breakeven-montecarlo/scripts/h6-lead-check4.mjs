// Lead's own timing for the notes: Monte Carlo 100 samples x 20 options, representative days against the full year (T1, Node).
import { loadavg } from 'node:os';
const APP = new URL('../../../app/src/engine/', import.meta.url).href.replace(/\/$/, '');
const { referenceT1 } = await import(`${APP}/defaults.js`);
const { runModel } = await import(`${APP}/run.js`);
const { monteCarlo } = await import(`${APP}/montecarlo.js`);
const run = runModel(referenceT1());
for (const screening of [true, false, true]) {
  const t = performance.now();
  const mc = monteCarlo(run, { site: run.ctx.site, samples: 100, nOptions: 20, screening });
  const s = (performance.now() - t) / 1000;
  console.log(`screening ${screening}: ${s.toFixed(2)} s for ${mc.rows.length * 100} re-runs = ${(s / (mc.rows.length * 100) * 1000).toFixed(2)} ms each (load ${loadavg()[0].toFixed(2)}); #1 leads ${(mc.rows.find((r) => r.id === mc.leaderId).pRank1 * 100).toFixed(0)} %`);
}
