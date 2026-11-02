// i2: cost of carrying 2 × 8,760 weather values in the inputs. Measures normalizeInputs, hashInputs, the App's
// computeKey (JSON.stringify of the inputs), a T1 run, the tornado (16 drivers), the breakeven table and a 100-sample
// Monte Carlo, with and without a weather year, plus study-file size.
// Usage (from app/): node ../verification/weather/scripts/integration/i2-performance.mjs [--skip-heavy]
import { referenceT1, normalizeInputs, hashInputs, runModel, tornado, getProfiles, resolveCountry, exceeded, studyFile } from '../../../../app/src/engine/index.js';
import { breakevens } from '../../../../app/src/engine/breakeven.js';
import { monteCarlo } from '../../../../app/src/engine/montecarlo.js';
const heavy = !process.argv.includes('--skip-heavy');
const base = referenceT1({ analysisStart: '2027-01' });
const prof = getProfiles(resolveCountry(base), base.project.seed, base.project.lat);
const db = Array.from(prof.temp, (x) => Math.round((x + 1.3) * 10) / 10), wb = Array.from(prof.wetbulb, (x) => Math.round((x + 0.7) * 10) / 10);
const w = { source: 'station', id: '03772099999', name: 'LONDON HEATHROW (EGLL)', country: 'GB', file: null, lat: 51.48, lon: -0.45, elevationM: 25, years: 'typical year from 2010–2024', dataSource: 'NOAA NCEI GHCNh', dryBulb: db, wetBulb: wb, designDB: Math.round(exceeded(db) * 10) / 10, designWB: Math.round(exceeded(wb) * 10) / 10, designBasis: "the station's own readings, 2010–2024 (0.4 % dry bulb and 0.4 % wet bulb of every usable year)", notes: [] };
const t = (fn, n = 1) => { const t0 = performance.now(); let r; for (let i = 0; i < n; i++) r = fn(); return [(performance.now() - t0) / n, r]; };
const out = {};
const cases = [['synthetic', base], ['weather', { ...base, weather: w }]];
if (process.argv.includes('--reverse')) cases.reverse();
for (const [tag, inp] of cases) {
  const o = (out[tag] = {});
  o.normalizeMs = t(() => normalizeInputs(inp), 50)[0];
  const n = normalizeInputs(inp);
  o.hashMs = t(() => hashInputs(n), 50)[0];
  o.computeKeyMs = t(() => JSON.stringify(inp), 50)[0];
  o.inputsBytes = JSON.stringify(inp).length;
  const [runMs, run] = t(() => runModel(inp));
  o.runS = runMs / 1000;
  o.leader = run.options.find((x) => x.rank === 1).id;
  const sf = JSON.stringify(studyFile(inp, run), null, 1);
  o.studyBytes = sf.length;
  o.runInputsBytes = JSON.stringify(run.inputs).length;
  if (heavy) {
    o.tornadoS = t(() => tornado(run, o.leader))[0] / 1000;
    o.breakevenS = t(() => breakevens(run))[0] / 1000;
    o.mc100S = t(() => monteCarlo(run, { samples: 100 }))[0] / 1000;
  }
  console.log(tag, JSON.stringify(o, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)));
}
