// i1c: grid full capacity set just above the design load of the measured year (0.4 % design). Hours hotter than the design
// temperature then need more than the design load. Does the tool call grid-only options not adequate although its own
// shortfall analysis says the grid covers the design load?
import { referenceT1, getProfiles, resolveCountry, exceeded, runModel, buildContext, normalizeInputs } from '../../../../app/src/engine/index.js';
const base = referenceT1({ analysisStart: '2027-01' });
const prof = getProfiles(resolveCountry(base), base.project.seed, base.project.lat);
const db = Array.from(prof.temp, (x) => Math.round(x * 10) / 10), wb = Array.from(prof.wetbulb, (x) => Math.round(x * 10) / 10);
const w = { source: 'station', id: 'T', name: 'T', lat: base.project.lat, lon: base.project.lon, years: 'x', dryBulb: db, wetBulb: wb, designDB: Math.round(exceeded(db) * 10) / 10, designWB: Math.round(exceeded(wb) * 10) / 10, designBasis: 'the station\'s own readings', notes: [] };
const inp = { ...base, weather: w, load: { ...base.load, coolingApproach: 'air' } };
inp.choices = { ...inp.choices };
const ctx = buildContext(normalizeInputs(inp), { site: { noSiteModel: true } });
const c = ctx.cooling.air; const design = 100 * (1 + c.coolPeak + c.lossFrac + inp.load.ancillaryFrac);
inp.grid = { ...inp.grid, fullMW: Math.ceil(design * 10) / 10 + 0.1, nowMW: Math.ceil(design * 10) / 10 + 0.1 };
if (process.env.SYN) inp.weather = { source: "none" };
console.log(`air design load ${design.toFixed(2)} MW; grid full set to ${inp.grid.fullMW} MW`);
const run = runModel(inp);
const sa = run.shortfall || run.adequacyAnalysis || null;
const gridOnly = run.options.filter((o) => o.v.C4 === 'none');
const na = gridOnly.filter((o) => !o.adequacy.adequate);
const why = {}; for (const o of na) for (const r of o.adequacy.reasons) why[r] = (why[r] || 0) + 1;
console.log(`options ${run.options.length}; without firm plant (C4 none) ${gridOnly.length}; of those not adequate ${na.length} ${JSON.stringify(why)}`);
const ex = na.filter((o) => o.adequacy.reasons.includes('unmet') || o.adequacy.reasons.includes('exceed')).slice(0, 4);
for (const o of ex) console.log(`  ${o.id} ${o.name}: unmet ${o.adequacy.unmetMWh.toFixed(1)} MWh over ${o.adequacy.unmetHours} h, peak ${o.adequacy.unmetPeakMW.toFixed(2)} MW; exceed ${o.adequacy.exceedHours} h`);
const keys = Object.keys(run).filter((k) => /short|adequ/i.test(k)); console.log('run keys', keys);
if (run.shortfall) for (const b of run.shortfall.byCooling) console.log(`  shortfall analysis ${b.cooling}: permanent months ${b.permanent.months}, peak ${b.permanent.peakMW.toFixed(2)} MW`);
