import { E, runT1, short } from './lib.mjs';
import fs from 'node:fs';
import { TECH, FUEL, PPA } from '../app/src/engine/defaults.js';
const { run, inputs } = runT1();
const ctx = run.ctx;
const ids = { leader: 'O1WG4BI8', island: 'O16HAJCQ', smr: 'O1J82PZ7' };
const out = {};
for (const [nm, id] of Object.entries(ids)) {
  const o = run.options.find((x) => x.id === id);
  out[nm] = JSON.parse(JSON.stringify(o, (k, v) => (v && v.BYTES_PER_ELEMENT ? Array.from(v) : v)));
}
const tech = {};
for (const k of ['substation', 'solarRoof', 'solarGround', 'bess', 'upsReserve', 'gasRecip', 'backupHvo', 'backupDiesel', 'fuelStorage', 'smr', 'gasTurbine']) if (TECH[k]) tech[k] = { name: TECH[k].name, fuel: TECH[k].fuel, p: TECH[k].p, lead: TECH[k].lead, programme: TECH[k].programme };
const c = {
  country: ctx.country, baseYear: ctx.baseYear, nMonths: ctx.nMonths, gasPrice: ctx.gasPrice, carbonPrice: ctx.carbonPrice, priceAdder: ctx.priceAdder, priceMult: ctx.priceMult, carbonMult: ctx.carbonMult,
  gridFixed: ctx.gridFixed, phases: ctx.phases, fullGridM: ctx.fullGridM, gridCap: Array.from(ctx.gridCap), itInst: Array.from(ctx.itInst), stats: ctx.prof.stats,
  economics: inputs.economics, requirements: inputs.requirements, weights: inputs.weights, grid: inputs.grid, load: inputs.load, utilities: inputs.utilities, settings: inputs.settings, project: inputs.project, FUEL, PPA, tech,
  scoring: run.scoring,
};
fs.writeFileSync('out/t1_three_options.json', JSON.stringify({ ctx: c, options: out }));
const p = ctx.prof;
fs.writeFileSync('out/t1_profiles.json', JSON.stringify({ solar: Array.from(p.solar), wind: Array.from(p.wind), price: Array.from(p.price), carbon: Array.from(p.carbon), temp: Array.from(p.temp) }));
// hourly demand of the leader's own context, by model year
const o = run.options.find((x) => x.id === ids.leader);
const octx = E.ctxFor(ctx, o.v, o.sizing);
const dem = {}; for (let y = 0; y < 8; y++) { const d = E.demandYear(octx, 'pue', y); dem[y] = { sum: d.sum, D: Array.from(d.D).map((x) => +x.toFixed(4)) }; }
fs.writeFileSync('out/t1_leader_demand.json', JSON.stringify(dem));
console.log(JSON.stringify(c, short, 1).slice(0, 14000));
