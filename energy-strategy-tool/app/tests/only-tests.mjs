// Development aid: runs only the layout-scope (40), Monte Carlo (46) and review-fix (47) groups on a fresh T1 run.
// The full suite (run-tests.mjs) remains the check of record.
import { referenceT1 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { layoutScopeTests } from './layout-scope-tests.mjs';
import { monteCarloTests } from './montecarlo-tests.mjs';
import { reviewFixTests } from './review-fixes-tests.mjs';
const START = '2027-01';
let failures = 0;
async function test(name, fn) {
  const t0 = performance.now();
  try { const info = await fn(); console.log(`PASS  ${name}  (${(performance.now() - t0).toFixed(0)} ms)${info ? `\n      ${info}` : ''}`); }
  catch (e) { failures++; console.log(`FAIL  ${name}\n      ${e.stack}`); }
}
const runT1 = runModel(referenceT1({ analysisStart: START }));
const ctx = { runT1, START };
const want = process.argv.slice(2);
if (!want.length || want.includes('40')) await layoutScopeTests(test, ctx);
if (!want.length || want.includes('46')) await monteCarloTests(test, ctx);
if (!want.length || want.includes('47')) await reviewFixTests(test, ctx);
process.exit(failures ? 1 : 0);
