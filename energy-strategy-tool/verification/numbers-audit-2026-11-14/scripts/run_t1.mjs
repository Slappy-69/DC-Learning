// Runs the T1 example exactly as the page does (realism on, every combination screened, researched adders).
import * as E from '../app/src/engine/index.js';
import fs from 'node:fs';
const inputs = E.referenceT1({ today: new Date('2026-11-13T12:00:00Z') });
const t0 = Date.now();
const run = E.runModel(inputs);
console.log('ms', Date.now() - t0, 'options', run.options.length, 'keys', Object.keys(run));
console.log('start', inputs.project.analysisStart);
const sorted = [...run.options].sort((a, b) => a.rank - b.rank);
const o = sorted[0];
console.log(Object.keys(o));
console.log(JSON.stringify(o, (k, v) => (Array.isArray(v) && v.length > 60 ? `[array ${v.length}]` : (v && v.BYTES_PER_ELEMENT ? `[typed ${v.length}]` : v)), 1).slice(0, 30000));
globalThis.__run = run;
