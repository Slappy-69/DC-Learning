// Dump the defaults registry, the country data and the exchange rates from the engine into data/ (registry.json,
// countries.json, fx.json), for Appendix A and B (make_appendices.py). Usage, from this folder: node dump-registry.mjs [output folder]
import { fileURLToPath } from 'node:url';
const E = new URL('../../../app/src/engine/', import.meta.url).href;
const { buildDefaultInputs, getRegistry, COUNTRIES, FX } = await import(E + 'defaults.js');
const OUT = process.argv[2] || fileURLToPath(new URL('../data', import.meta.url));
import fs from 'node:fs';
buildDefaultInputs({ analysisStart: '2027-01' });
// importing sensitivity registers its records
await import(E + 'sensitivity.js');
const reg = getRegistry();
const out = Object.values(reg).map(r => ({ path: r.path, value: r.value, unit: r.unit, low: r.low, high: r.high, basis: r.basis, sourceToVerify: r.sourceToVerify, note: r.note, briefRef: r.briefRef, label: r.label, source: r.label && /^sourced/.test(r.label) ? r.source : undefined, year: r.year, url: r.url, accessed: r.accessed }));
fs.writeFileSync(OUT + '/registry.json', JSON.stringify(out, null, 1));
fs.writeFileSync(OUT + '/countries.json', JSON.stringify(COUNTRIES, null, 1));
fs.writeFileSync(OUT + '/fx.json', JSON.stringify(FX, null, 1));
const counts = {};
for (const r of out) { const g = r.path.split('.')[0]; counts[g] = (counts[g]||0)+1; }
console.log('records', out.length, JSON.stringify(counts));
const basis = {}; for (const r of out) basis[r.basis]=(basis[r.basis]||0)+1; console.log(JSON.stringify(basis));
