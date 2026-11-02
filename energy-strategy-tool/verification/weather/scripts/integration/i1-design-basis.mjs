// R3 integration check i1: does a measured year whose design temperature is the 0.4 % value (below the year's hottest
// hour) leave hours where the hourly facility load is above the design load the plant and grid checks are sized to?
// Controlled comparison: the same hourly temperatures (the synthetic profile, so nothing else moves) entered as a
// "station" weather year twice: (A) design = the year's hottest hour (what the synthetic profile does), (B) design =
// the 0.4 % value (what an EPW without design conditions, or a typical year against multi-year design values, gives).
// Run from energy-strategy-tool/app:  node ../verification/weather/scripts/integration/i1-design-basis.mjs
import { referenceT1, buildContext, getProfiles, resolveCountry, runModel, exceeded, H } from '../../../../app/src/engine/index.js';
import { COOLING } from '../../../../app/src/engine/defaults.js';

const START = '2027-01';
const base = referenceT1({ analysisStart: START });
const country = resolveCountry(base);
const prof = getProfiles(country, base.project.seed, base.project.lat);
const db = Array.from(prof.temp, (x) => Math.round(x * 10) / 10);
const wb = Array.from(prof.wetbulb, (x) => Math.round(x * 10) / 10);
const mk = (dDB, dWB, basis) => ({ source: 'station', id: 'TEST', name: 'TEST', lat: base.project.lat, lon: base.project.lon, years: 'typical year from 2010–2024', dataSource: 'test', dryBulb: db, wetBulb: wb, designDB: dDB, designWB: dWB, designBasis: basis, notes: [] });
const A = mk(Math.max(...db), Math.max(...wb), 'hottest hour');
const B = mk(Math.round(exceeded(db) * 10) / 10, Math.round(exceeded(wb) * 10) / 10, 'the station\'s own readings (0.4 %)');
console.log(`Country ${country}; dry bulb max ${A.designDB} °C, 0.4 % ${B.designDB} °C; wet bulb max ${A.designWB} °C, 0.4 % ${B.designWB} °C`);

for (const [tag, w] of [['A max', A], ['B 0.4%', B]]) {
  const inp = { ...base, weather: w };
  const ctx = buildContext(inp, { site: { noSiteModel: true } });
  for (const id of Object.keys(COOLING)) {
    const c = ctx.cooling[id];
    const peak = 1 + c.coolPeak + c.lossFrac;
    let maxH = 0, above = 0;
    for (let h = 0; h < H; h++) { const p = 1 + c.coolFrac[h] + c.lossFrac; if (p > maxH) maxH = p; if (p > peak + 1e-9) above++; }
    console.log(`${tag}  ${id.padEnd(10)} design PUE ${peak.toFixed(3)}  hourly max PUE ${maxH.toFixed(3)}  hours above design ${above}`);
  }
}

const cap = Number(process.env.CAP || 0);
for (const [tag, w] of [['A max', A], ['B 0.4%', B]]) {
  const inp = JSON.parse(JSON.stringify({ ...base, weather: w }));
  if (cap) inp.settings.generationCap = cap;
  const t0 = performance.now();
  const run = runModel(inp);
  const ms = performance.now() - t0;
  const na = run.options.filter((o) => o.adequacy && !o.adequacy.adequate);
  const reasons = {};
  for (const o of na) for (const r of o.adequacy.reasons) reasons[r] = (reasons[r] || 0) + 1;
  const L = run.options.find((o) => o.rank === 1);
  console.log(`${tag}: ${run.options.length} options in ${(ms / 1000).toFixed(1)} s; not adequate ${na.length} ${JSON.stringify(reasons)}; leader ${L.id} ${L.name} score ${L.score.toFixed(2)} LCOE ${L.eco.lcoe.toFixed(1)}`);
  globalThis[`run_${tag[0]}`] = run;
}
// Options adequate with A but not with B (only the design basis differs).
const a = new Map(globalThis.run_A.options.map((o) => [o.id, o]));
const flipped = globalThis.run_B.options.filter((o) => !o.adequacy.adequate && a.get(o.id) && a.get(o.id).adequacy.adequate);
console.log(`Adequate with design = hottest hour, NOT adequate with design = 0.4 %: ${flipped.length}`);
for (const o of flipped.slice(0, 8)) console.log(`  ${o.id} ${o.name}: ${o.adequacy.reasons.join(',')} unmet ${o.adequacy.unmetMWh.toFixed(1)} MWh / ${o.adequacy.unmetHours} h, exceed ${o.adequacy.exceedHours} h; rank A ${a.get(o.id).rank} -> B ${o.rank}`);
