// i1b: why an option turns "not adequate (gap)" when only the design temperature is lowered (A: hottest hour, B: 0.4 %).
// Usage (from app/): node ../verification/weather/scripts/integration/i1b-gap-detail.mjs [optionId]
import { referenceT1, buildContext, getProfiles, resolveCountry, exceeded, runModel, normalizeInputs } from '../../../../app/src/engine/index.js';
import { evaluateOption } from '../../../../app/src/engine/option.js';
const id = process.argv[2] || 'ON8DVFB';
const base = referenceT1({ analysisStart: '2027-01' });
const prof = getProfiles(resolveCountry(base), base.project.seed, base.project.lat);
const db = Array.from(prof.temp, (x) => Math.round(x * 10) / 10), wb = Array.from(prof.wetbulb, (x) => Math.round(x * 10) / 10);
const mk = (d1, d2) => ({ source: 'station', id: 'T', name: 'T', lat: base.project.lat, lon: base.project.lon, years: 'x', dryBulb: db, wetBulb: wb, designDB: d1, designWB: d2, designBasis: 'x', notes: [] });
const W = { A: mk(Math.max(...db), Math.max(...wb)), B: mk(Math.round(exceeded(db) * 10) / 10, Math.round(exceeded(wb) * 10) / 10) };
const runA = runModel({ ...base, weather: W.A });
const opt = runA.options.find((o) => o.id === id);
for (const k of ['A', 'B']) {
  const inp = normalizeInputs({ ...base, weather: W[k] });
  const ctx = buildContext(inp);
  const e = evaluateOption(ctx, opt.v);
  const s = e.sz;
  console.log(`${k}: design ${s.designMW.toFixed(2)} MW peakPUE ${s.peakPUE.toFixed(4)}; adequacy ${e.adequacy ? e.adequacy.reasons : '?'}; gap ${e.ttp.gapMWm.toFixed(3)} MW-months over ${e.ttp.gapMonths} months`);
  console.log('   ' + (s.sentences || []).filter((x) => /top-up|shortfall|Design facility|battery|BESS/i.test(x)).join('\n   '));
  const m = []; for (let i = 0; i < e.ttp.supplyByMonth.length; i++) { const g = s.designByMonth[i] - e.ttp.supplyByMonth[i]; if (g > 1e-9) m.push(`${i}:${g.toFixed(2)}`); }
  console.log('   gap months', m.slice(0, 12).join(' '));
}
