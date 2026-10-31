// Development aid: runs only the layout-scope (40), Monte Carlo (46), review-fix (47), weather (48), existing-plant (39)
// and plant-list (50) groups on a fresh T1 run.
// The full suite (run-tests.mjs) remains the check of record.
import { referenceT1 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { layoutScopeTests } from './layout-scope-tests.mjs';
import { monteCarloTests } from './montecarlo-tests.mjs';
import { reviewFixTests } from './review-fixes-tests.mjs';
import { weatherTests, stationTests } from './weather-tests.mjs';
import { plantTests } from './plants-tests.mjs';
import { existingPlantTests } from './existing-plant-tests.mjs';
const START = '2027-01';
let failures = 0;
async function test(name, fn) {
  const t0 = performance.now();
  try { const info = await fn(); console.log(`PASS  ${name}  (${(performance.now() - t0).toFixed(0)} ms)${info ? `\n      ${info}` : ''}`); }
  catch (e) { failures++; console.log(`FAIL  ${name}\n      ${e.stack}`); }
}
const want0 = process.argv.slice(2);
const runT1 = want0.length && want0.every((x) => x === '50') ? null : runModel(referenceT1({ analysisStart: START }));
const ctx = { runT1, START };
const want = process.argv.slice(2);
if (!want.length || want.includes('40')) await layoutScopeTests(test, ctx);
if (!want.length || want.includes('46')) await monteCarloTests(test, ctx);
if (!want.length || want.includes('47')) await reviewFixTests(test, ctx);
if (!want.length || want.includes('48')) { await weatherTests(test, ctx); await stationTests(test); }
if (!want.length || want.includes('39')) await existingPlantTests(test, ctx);
if (!want.length || want.includes('50')) await plantTests(test);
process.exit(failures ? 1 : 0);
