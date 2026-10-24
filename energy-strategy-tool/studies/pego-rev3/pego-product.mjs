// Pego on the product (no study build), with the existing-plant input of work package 12 (2026-10-24).
// Usage: node pego-product.mjs [save]   — prints the leader and the named strategies; "save" writes pego-product.study.json
// (a study file, work package 15), which the app's "Open study…" also reads. Run from this folder of the repository.
import fs from 'node:fs';
const E = new URL('../../app/src/engine/', import.meta.url).href;
const { buildDefaultInputs, runModel, studyFile, readStudyFile } = await import(E + 'index.js');
const { addMonths } = await import(E + 'dates.js');
const FILE = new URL('./pego-product.study.json', import.meta.url);

function pegoInputs() {
  const inputs = buildDefaultInputs({ analysisStart: '2027-01' });
  const s = inputs.project.analysisStart;
  inputs.project.name = 'Pego data centre campus (product, existing-plant input)';
  inputs.project.lat = 39.468; inputs.project.lon = -8.109;
  inputs.site.areaHa = 150;
  inputs.load.itMW = 900;
  inputs.load.phases = Array.from({ length: 9 }, (_, i) => ({ itMW: 100, date: addMonths(s, 24 + 9 * i) }));
  inputs.load.coolingApproach = 'dlc';
  inputs.grid.nowMW = 0; inputs.grid.fullMW = 400; inputs.grid.fullDate = addMonths(s, 36);
  inputs.grid.connectionCharge = 400 * 120000;
  inputs.utilities.gasAvailable = 'Yes'; inputs.utilities.gasDateMonths = 0;
  inputs.utilities.ppaInclude = true; inputs.utilities.ppaType = 'hybrid'; inputs.utilities.ppaCoverage = 50;
  inputs.existing = { ...inputs.existing, include: true, name: 'Elecgás CCGT', type: 'ccgt', units: 2, unitMW: 427.5, availableDate: '2028-07', leasePerKWMonth: 6, linkCapex: 62e6 };
  // As in the study: every bridging technology and the existing plant; firm plant: none, the existing plant, gas engines,
  // CHP, fuel cells; HVO standby required; roof solar only; no wind.
  inputs.choices.C2 = { state: 'open', values: ['existing', 'rented', 'gasRecip', 'gasTurbine', 'fuelCell', 'dieselPrime'] };
  inputs.choices.C4 = { state: 'open', values: ['none', 'existing', 'gasRecip', 'chp', 'fuelCell'] };
  inputs.choices.C5 = { state: 'locked', values: ['hvo'] };
  inputs.choices.C10 = { state: 'locked', values: ['roof'] };
  inputs.choices.C11 = { state: 'locked', values: ['none'] };
  return inputs;
}

const inputs = fs.existsSync(FILE) && process.argv[2] !== 'save' ? readStudyFile(fs.readFileSync(FILE, 'utf8')).inputs : pegoInputs();
const t0 = Date.now();
const run = runModel(inputs);
const s = (Date.now() - t0) / 1000;
const by = [...run.options].sort((a, b) => a.rank - b.rank);
console.log(`run ${s.toFixed(1)} s; ${run.options.filter((o) => o.adequacy.adequate).length} of ${run.options.length} adequate; run flags ${run.runFlags.map((f) => f.id).join(', ')}`);
for (const o of by.slice(0, 5)) console.log(`#${o.rank} ${o.score.toFixed(2)} €${o.eco.lcoe.toFixed(1)}/MWh ${Math.round(o.eco.capex / 1e6)} m ${Math.round(o.carbon.locationG)} g | ${o.name}`);
if (process.argv[2] === 'save') { fs.writeFileSync(FILE, JSON.stringify(studyFile(inputs, run, { savedAt: new Date() }), null, 1)); console.log('saved', FILE.pathname); }
