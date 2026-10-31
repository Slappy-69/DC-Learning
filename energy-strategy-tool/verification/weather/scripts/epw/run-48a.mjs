// Runs only the builder's test 48a (EPW reader). From energy-strategy-tool/app: node ../verification/weather/scripts/epw/run-48a.mjs
import { weatherTests } from '../../../../app/tests/weather-tests.mjs';
let done = false;
await weatherTests(async (name, fn) => { if (done) return; done = true; try { console.log('PASS', name.slice(0, 40), '—', await fn()); } catch (e) { console.log('FAIL', name.slice(0, 40), e.message); } }, {});
