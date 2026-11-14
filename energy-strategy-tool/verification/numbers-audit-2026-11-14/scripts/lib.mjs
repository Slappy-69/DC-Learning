import * as E from '../app/src/engine/index.js';
export { E };
export function t1() { return E.referenceT1({ today: new Date('2026-11-13T12:00:00Z') }); }
let cached = null;
export function runT1() { if (!cached) { const inputs = t1(); cached = { inputs, run: E.runModel(inputs) }; } return cached; }
export const short = (k, v) => (Array.isArray(v) && v.length > 40 ? `[array ${v.length}]` : (v && v.BYTES_PER_ELEMENT ? `[typed ${v.length}]` : v));
