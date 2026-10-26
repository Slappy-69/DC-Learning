// Runs only tests 45 and 46 (the full suite takes about eight minutes).
const T = new URL('../../../app', import.meta.url).href;
const { referenceT1 } = await import(`${T}/src/engine/defaults.js`);
const { runModel } = await import(`${T}/src/engine/run.js`);
const { breakevenTests } = await import(`${T}/tests/breakeven-tests.mjs`);
const { monteCarloTests } = await import(`${T}/tests/montecarlo-tests.mjs`);
const START = '2027-01';
let t = performance.now();
const runT1 = runModel(referenceT1({ analysisStart: START }));
console.log(`T1 run ${((performance.now() - t) / 1000).toFixed(1)} s`);
async function test(name, fn) {
  const t0 = performance.now();
  try { const info = await fn(); console.log(`PASS ${name.slice(0, 70)} (${((performance.now() - t0) / 1000).toFixed(1)} s)\n     ${info}`); }
  catch (e) { console.log(`FAIL ${name.slice(0, 70)}\n${e.stack}`); process.exitCode = 1; }
}
const ctxRuns = { runT1, START };
await breakevenTests(test, ctxRuns);
await monteCarloTests(test, ctxRuns);
