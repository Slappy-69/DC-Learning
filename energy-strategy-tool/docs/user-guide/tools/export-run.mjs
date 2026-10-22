// Export the T1 example run from the engine into data/ (t1-top20, t1-all, t1-archetypes, t1-scoring,
// t1-leader-ledger, t1-pue, t1-leader-hours). Usage, from this folder: node export-run.mjs [output folder]
// The files in data/ are the run of 2026-10-21 (commit 441635e); compare a new export with them to see what changed.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const E = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1 } = await import(E + 'defaults.js');
const { runModel } = await import(E + 'run.js');
const { buildContext } = await import(E + 'context.js');
const { evaluateOption } = await import(E + 'option.js');
const { normalizeInputs, COOLING } = await import(E + 'defaults.js');
const OUT = process.argv[2] || fileURLToPath(new URL('../data', import.meta.url));
const t0 = Date.now();
const inputs = referenceT1({ analysisStart: '2027-01' });
const run = runModel(inputs);
console.log('run', (Date.now() - t0) / 1000, 's', run.options.length, 'options');
const opts = run.options.slice().sort((a, b) => a.rank - b.rank);
const lite = (o) => ({ id: o.id, rank: o.rank, name: o.name, archetype: o.archetype, score: o.score, axisScores: o.axisScores, metrics: o.metrics,
  lcoe: o.eco.lcoe, npv: o.eco.npvCost, capex: o.eco.capex, capexLow: o.eco.capexLow, capexHigh: o.eco.capexHigh, capexShare: o.eco.capexShare,
  locationG: o.carbon.locationG, marketG: o.carbon.marketG, cfePct: o.carbon.cfePct, ttp: { metric: o.ttp.metric, firstPowerM: o.ttp.firstPowerM, fullLoadM: o.ttp.fullLoadM, gapMWm: o.ttp.gapMWm },
  deliv: o.deliv.score, delivItems: o.deliv.items, resilience: o.resilience.status, resItems: o.resilience.items, siteFit: o.siteFit ? o.siteFit.status : null,
  flags: o.flags.map((f) => ({ id: f.id, severity: f.severity, category: f.category, message: f.message })), unmet: o.unmet, dominatedBy: o.dominatedBy,
  sentences: o.sizing.sentences, v: o.v, ppaHedge: o.eco.ppaHedge ? { total: o.eco.ppaHedge.total, pv: o.eco.ppaHedge.pv, undeliveredMWh: o.eco.ppaHedge.undeliveredMWh } : null });
fs.writeFileSync(OUT + '/t1-top20.json', JSON.stringify(opts.slice(0, 20).map(lite), null, 1));
fs.writeFileSync(OUT + '/t1-all.json', JSON.stringify(opts.map((o) => ({ id: o.id, rank: o.rank, name: o.name, archetype: o.archetype, score: o.score, lcoe: o.eco.lcoe, npv: o.eco.npvCost, capex: o.eco.capex, loc: o.carbon.locationG, mkt: o.carbon.marketG, cfe: o.carbon.cfePct, ttp: o.ttp.metric, deliv: o.deliv.score, res: o.resilience.status, fit: o.siteFit ? o.siteFit.status : null, dom: !!o.dominatedBy }))));
// archetypes
fs.writeFileSync(OUT + '/t1-archetypes.json', JSON.stringify(opts.filter((o) => o.archetype).map(lite), null, 1));
// scoring meta
fs.writeFileSync(OUT + '/t1-scoring.json', JSON.stringify({ weights: run.scoring.weights, ranges: run.scoring.ranges, generation: run.generation, rules: run.rules, runFlags: run.runFlags, profileStats: run.profileStats, country: run.country, timing: run.timing }, null, 1));
// leader ledger and detail
const L = opts[0];
fs.writeFileSync(OUT + '/t1-leader-ledger.json', JSON.stringify({ ledger: L.eco.ledger, capexLines: L.eco.capexLines, npv: L.eco.npvCost, pvCapex: L.eco.pvCapex, pvOpex: L.eco.pvOpex, lcoe: L.eco.lcoe, reconciliation: L.eco.reconciliation, capex: L.eco.capex, contingency: L.eco.contingency }, null, 1));
// cooling / PUE per approach for the context
const ctx = run.ctx;
const pue = {};
for (const id of Object.keys(ctx.cooling)) { const c = ctx.cooling[id]; pue[id] = { coolAvg: c.coolAvg, coolPeak: c.coolPeak, lossFrac: c.lossFrac, annualPUE: 1 + c.coolAvg + c.lossFrac, peakPUE: 1 + c.coolPeak + c.lossFrac, adiabaticHours: c.adiabaticHours, params: COOLING[id].p }; }
fs.writeFileSync(OUT + '/t1-pue.json', JSON.stringify({ country: ctx.country, designTemp: ctx.prof.designTemp, designWetbulb: ctx.prof.designWetbulb, stats: ctx.prof.stats, pue, gasPrice: ctx.gasPrice, gasCommodity: ctx.gasCommodity, carbonPrice: ctx.carbonPrice, priceAdder: ctx.priceAdder }, null, 1));
// leader re-evaluated with hourly records for year index 2 (month 24-35)
const e = evaluateOption(ctx, L.v, { recordYears: [2, 5] });
const y = e.disp.years[2];
const hrs = y.hourly;
// pick a winter evening hour with unmet load, and a sunny summer hour
let hUnmet = -1; for (let h = 0; h < 8760; h++) if (hrs.unmet[h] > 0.5) { hUnmet = h; break; }
let hSun = -1, best = -1; for (let h = 4000; h < 5000; h++) if (hrs.solar[h] > best) { best = hrs.solar[h]; hSun = h; }
const pick = (h) => Object.fromEntries(Object.entries(hrs).filter(([k, a]) => a && a.length === 8760).map(([k, a]) => [k, a[h]]));
const p = ctx.prof;
const ex = (h) => ({ hourOfYear: h, price: p.price[h], gridPrice: p.price[h] * ctx.priceMult + ctx.priceAdder, carbon: p.carbon[h], temp: p.temp[h], solarPerMWp: p.solar[h], rec: pick(h) });
fs.writeFileSync(OUT + '/t1-leader-hours.json', JSON.stringify({ year: 2, hUnmet: ex(hUnmet), hSun: ex(hSun), yearTotals: Object.fromEntries(Object.entries(y).filter(([k, v]) => typeof v === 'number')), plants: y.plants, nExplicit: e.disp.nExplicit }, null, 1));
console.log('leader', L.id, L.name, L.score.toFixed(3));
