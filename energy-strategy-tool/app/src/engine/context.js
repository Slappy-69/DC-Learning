// Run context: everything shared by all options in one run (BRIEF §4 incremental recompute:
// these arrays depend only on inputs, not on the option's choices).

import { COUNTRIES, COOLING, TECH, FUEL } from './defaults.js';
import { getProfiles, coolingProfile, nearestCountry, H } from './profiles.js';
import { monthsBetween, yearOf, parseYM } from './dates.js';
import { mulberry32, subSeed } from './prng.js';
import { buildSiteModel } from './site.js';

export function resolveCountry(inputs) {
  const c = inputs.project.country;
  if (c && COUNTRIES[c]) return c;
  return nearestCountry(inputs.project.lat, inputs.project.lon);
}

export function monthOf(inputs, ym) {
  return monthsBetween(inputs.project.analysisStart, ym);
}

// Grid offered import capacity per month (stepped profile, §5.4). Never resized.
export function gridCapByMonth(inputs, nMonths) {
  const g = inputs.grid;
  const arr = new Float64Array(nMonths);
  const fullM = monthOf(inputs, g.fullDate);
  const steps = (g.steps || []).map((s) => ({ m: monthOf(inputs, s.date), mw: Number(s.mw) })).sort((a, b) => a.m - b.m);
  for (let m = 0; m < nMonths; m++) {
    let cap;
    if (steps.length) {
      cap = g.nowMW;
      for (const s of steps) if (m >= s.m) cap = s.mw;
      if (m >= fullM) cap = g.fullMW;
    } else {
      cap = m >= fullM ? g.fullMW : g.nowMW;
    }
    arr[m] = Math.max(0, cap);
  }
  return arr;
}

// Installed IT per month from the phasing table and the ramp rule (§5.3).
export function itInstalledByMonth(inputs, nMonths) {
  const arr = new Float64Array(nMonths);
  const { rampStart, rampMonths } = inputs.load;
  const phases = inputs.load.phases.map((p) => ({ m: monthOf(inputs, p.date), it: Number(p.itMW) }));
  for (let m = 0; m < nMonths; m++) {
    let it = 0;
    for (const p of phases) {
      if (m < p.m) continue;
      const f = rampMonths > 0 ? Math.min(1, rampStart + (1 - rampStart) * ((m - p.m) / rampMonths)) : 1;
      it += p.it * f;
    }
    arr[m] = it;
  }
  return arr;
}

// Grid decarbonisation multiplier for a calendar year (linear to the 2050 value).
export function decarbFactor(country, calYear, baseYear) {
  const c = COUNTRIES[country];
  if (calYear <= baseYear) return 1;
  if (calYear >= 2050) return c.decarb2050;
  return 1 + (c.decarb2050 - 1) * ((calYear - baseYear) / (2050 - baseYear));
}

// Hourly IT utilisation shape, mean = utilisation (seeded, synthetic).
function itShape(inputs, seed) {
  const u = inputs.load.utilisation;
  const rnd = mulberry32(subSeed(seed, 'itshape'));
  const a = new Float64Array(H);
  const amp = inputs.load.workload === 'ai-training' ? 0.01 : inputs.load.workload === 'enterprise' ? 0.08 : 0.04;
  let sum = 0;
  for (let h = 0; h < H; h++) {
    const hr = h % 24;
    a[h] = 1 + amp * Math.sin((2 * Math.PI * (hr - 9)) / 24) + 0.01 * (rnd() - 0.5);
    sum += a[h];
  }
  const k = (u * H) / sum;
  for (let h = 0; h < H; h++) a[h] = Math.min(1, a[h] * k);
  return a;
}

// opts.site: a site model already built for these inputs (the Dispatch and Sensitivity tabs pass the run's, so one
// option can be re-run without rasterising the site again); the caller checks its key (site.js siteKey).
export function buildContext(inputs, opts = {}) {
  const country = resolveCountry(inputs);
  const cdata = COUNTRIES[country];
  const seed = inputs.project.seed;
  const prof = getProfiles(country, seed, inputs.project.lat);
  const nMonthsTimeline = inputs.settings.timelineMonths;
  const maxYears = Math.max(inputs.economics.periodYears, Math.ceil(nMonthsTimeline / 12));
  const nMonths = Math.max(nMonthsTimeline, maxYears * 12) + 12;
  const gridCap = gridCapByMonth(inputs, nMonths);
  const itInst = itInstalledByMonth(inputs, nMonths);
  const shape = itShape(inputs, seed);
  const baseYear = yearOf(inputs.project.analysisStart);
  const startMonth = parseYM(inputs.project.analysisStart).m;

  const cooling = {};
  for (const id of Object.keys(COOLING)) cooling[id] = coolingProfile(COOLING[id], prof);

  // Gas commodity price and carbon price (§5.4, §5.6): a number entered for utilities.gasPrice or economics.carbonPrice
  // replaces the country default (the records' value is "by country"); the gas transport adder applies either way.
  // Before the port slice the engine read only the country values (the inputs were ignored).
  const gasCommodity = Number.isFinite(inputs.utilities.gasPrice) ? inputs.utilities.gasPrice : cdata.gas;
  const gasPrice = gasCommodity + FUEL.gasTransportAdder;
  const priceMult = inputs.grid.priceMultiplier;
  const priceAdder = cdata.adder;
  const carbonMult = inputs.grid.carbonMultiplier;
  const carbonPrice = Number.isFinite(inputs.economics.carbonPrice) ? inputs.economics.carbonPrice : cdata.carbonPrice;

  // Phase months
  const phases = inputs.load.phases.map((p) => ({ m: monthOf(inputs, p.date), it: Number(p.itMW) })).sort((a, b) => a.m - b.m);
  const firstPhaseM = phases.length ? phases[0].m : 0;
  const lastPhaseM = phases.length ? phases[phases.length - 1].m : 0;
  const fullGridM = monthOf(inputs, inputs.grid.fullDate);
  const gasM = inputs.utilities.gasDateMonths;

  const ctx = {
    inputs, country, cdata, prof, seed, nMonths, nMonthsTimeline, gridCap, itInst, shape, baseYear, startMonth,
    cooling, gasCommodity, gasPrice, priceMult, priceAdder, carbonMult, carbonPrice, phases, firstPhaseM, lastPhaseM, fullGridM, gasM,
    demandCache: new Map(),
    demandStats: { hits: 0, misses: 0 }, // run-log counters for the hourly demand cache
    site: opts.site || buildSiteModel(inputs), // site model and buildable-envelope raster (§10.1), shared by every option
  };
  return ctx;
}

// Hourly facility demand for model year y (8760 h), for one cooling approach.
// Returns { D, M, IT } where D = facility MW, M = mechanical cooling MW (for the CHP absorption credit), IT = IT MW.
export function demandYear(ctx, coolingId, y) {
  const key = `${coolingId}|${y}`;
  const hit = ctx.demandCache.get(key);
  if (hit) { if (ctx.demandStats) ctx.demandStats.hits++; return hit; }
  if (ctx.demandStats) ctx.demandStats.misses++;
  const cp = ctx.cooling[coolingId];
  const anc = ctx.inputs.load.ancillaryFrac;
  const D = new Float64Array(H);
  const M = new Float64Array(H);
  const IT = new Float64Array(H);
  const { shape, itInst } = ctx;
  let sum = 0;
  for (let h = 0; h < H; h++) {
    const m = y * 12 + Math.min(11, Math.floor(h / 730));
    const inst = itInst[m];
    const it = inst * shape[h];
    IT[h] = it;
    M[h] = it * cp.mechFrac[h];
    D[h] = it * (1 + cp.coolFrac[h] + cp.lossFrac) + anc * inst;
    sum += D[h];
  }
  const out = { D, M, IT, sum };
  ctx.demandCache.set(key, out);
  return out;
}

// Design facility load per month (peak PUE, 100 % IT installed) for a cooling approach.
export function designDemandByMonth(ctx, coolingId) {
  const cp = ctx.cooling[coolingId];
  const peakPUE = 1 + cp.coolPeak + cp.lossFrac;
  const anc = ctx.inputs.load.ancillaryFrac;
  const arr = new Float64Array(ctx.nMonths);
  for (let m = 0; m < ctx.nMonths; m++) arr[m] = ctx.itInst[m] * (peakPUE + anc);
  return { arr, peakPUE };
}

export { TECH };
