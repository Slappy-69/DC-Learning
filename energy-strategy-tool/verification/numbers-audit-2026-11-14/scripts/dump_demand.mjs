import { E, runT1, t1 } from './lib.mjs';
import fs from 'node:fs';
const { run } = runT1();
const ids = { leader: 'O1WG4BI8', island: 'O16HAJCQ', smr: 'O1J82PZ7' };
const out = {};
for (const [nm, id] of Object.entries(ids)) {
  const o = run.options.find((x) => x.id === id);
  const octx = E.ctxFor(run.ctx, o.v, o.sizing);
  out[nm] = { itInst: Array.from(octx.itInst), years: {} };
  for (let y = 0; y < o.dispatch.years.length; y++) out[nm].years[y] = Array.from(E.demandYear(octx, 'pue', y).D).map((x) => +x.toFixed(4));
  out[nm].engineYears = o.dispatch.years.map((d) => ({ demand: d.demandMWh, grid: d.gridMWh, ppa: d.ppaDeliveredMWh, firm: d.firmMWh, re: d.reUsedMWh, gridCost: d.gridCost, ppaNet: d.ppaNetworkCost, gridC: d.gridCarbonT, ppaC: d.ppaCarbonT, fuel: d.plants.reduce((a, p) => a + p.fuelMWhTh, 0), peak: d.gridPeakMW, unmet: d.unmetMWh, hours: d.plants.map((p) => p.hours) }));
}
out.shape = Array.from(run.ctx.shape).map((x) => +x.toFixed(5));
fs.writeFileSync('out/t1_demand3.json', JSON.stringify(out));
const i2 = t1(); i2.settings.timelineMonths = 132;
const smr = run.options.find((o) => o.id === ids.smr);
const r2 = E.evaluateOption(E.buildContext(E.normalizeInputs(i2)), smr.v);
console.log(Object.keys(r2)); const s2 = r2.sz || r2.sizing; console.log(JSON.stringify(s2.energise), 'lcoe', r2.eco.lcoe, 'capex', r2.eco.capex, 'carbon', r2.carb.locationG);
// shape statistics: mean, max
const sh = run.ctx.shape; let s = 0, mx = 0; for (const x of sh) { s += x; if (x > mx) mx = x; } console.log('IT shape mean', s / sh.length, 'max', mx);
const cp = run.ctx.cooling.pue; let pm = 0, pmax = 0; for (let h = 0; h < 8760; h++) { const p = 1 + cp.coolFrac[h] + cp.lossFrac; pm += p * sh[h]; if (p > pmax) pmax = p; } console.log('energy-weighted PUE', pm / s, 'max hourly PUE', pmax, 'lossFrac', cp.lossFrac, 'coolPeak', cp.coolPeak);
// peak hourly demand at full build in the leader's steady year
const d = out.leader.years[6]; console.log('leader steady-year peak demand MW', Math.max(...d), 'mean', d.reduce((a, b) => a + b, 0) / 8760);
