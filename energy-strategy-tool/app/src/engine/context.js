// Run context: everything shared by all options in one run (BRIEF §4 incremental recompute:
// these arrays depend only on inputs, not on the option's choices).

import { LEGACY_ADDERS } from './defaults.js';
import { CONDITIONAL_RATE, researchedAdder, gridChargeData, GB_RESIDUAL, FLAT_LOAD_MWH_PER_MW, DE_DISCOUNT } from './countryrules.js';
import { applyWeather } from './weather.js';
import { COUNTRIES, COOLING_ID, PUE_SHAPE, TECH, FUEL, FX, applyExistingPlant, applyPlants, plantOf, PLANT_DEFAULTS } from './defaults.js';
import { parsePlantValue, isTakeover } from './plants.js';
import { getProfiles, pueProfile, nearestCountry, H } from './profiles.js';
import { monthsBetween, yearOf, parseYM } from './dates.js';
import { mulberry32, subSeed } from './prng.js';
import { buildSiteModel } from './site.js';
import { countryAtPoint, nearestOutline } from './geocountry.js';

export function resolveCountry(inputs) {
  const c = inputs.project.country;
  if (c && COUNTRIES[c]) return c;
  return countryFromPin(inputs.project.lat, inputs.project.lon);
}

// Country from the pin (work package 1, AC 17): the built-in country whose outline contains the pin; otherwise
// (sea, or a country without a profile) the nearest country reference point, flagged on every option (assumed.js).
export function countryFromPin(lat, lon) {
  return pinCountryInfo(lat, lon).code;
}
// Display currency code for the inputs: the entered code, or the country's currency for 'by country'; euro when no
// release rate exists for it.
export function displayCurrencyCode(inputs) {
  const c = inputs.project.currency;
  const code = !c || c === 'by country' ? COUNTRIES[resolveCountry(inputs)].currency : c;
  return FX[code] ? code : 'EUR';
}
// How the pin's country was found: inside a built-in outline; else (a coastal pin left in the sea by the simplified
// outline) the nearest built-in outline within 25 km; else the nearest reference point (flagged).
// A pin within BORDER_KM of another country's outline is flagged: the 1:50m outlines are simplified to about 1–2 km.
export const BORDER_KM = 3;
export function pinCountryInfo(lat, lon) {
  const hit = countryAtPoint(lat, lon);
  let out;
  if (hit && hit.iso2 && COUNTRIES[hit.iso2]) out = { inside: true, mapName: hit.name, code: hit.iso2, via: 'outline' };
  else {
    // Sea (a coastal pin outside the simplified coast): nearest built-in outline within 25 km. Inside a country without
    // a profile: a built-in outline within the border tolerance (a border town such as Narva).
    const near = nearestOutline(lat, lon, hit ? BORDER_KM : 25);
    if (near && COUNTRIES[near.iso2]) out = { inside: true, mapName: near.name, code: near.iso2, via: hit ? 'border' : 'coast', km: near.km };
    else out = { inside: false, mapName: hit ? hit.name : null, code: nearestCountry(lat, lon), via: 'reference point' };
  }
  const other = nearestOutline(lat, lon, BORDER_KM, false, out.code);
  if (other && other.name !== out.mapName) out.nearBorder = { name: other.name, iso2: other.iso2, km: other.km };
  return out;
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

// Contracted grid capacity of a grid strategy (work package 3, OPEN-QUESTIONS 19): the lower of the offer in each
// month and the engineer's contracted MW for that C1 value (blank = the full offer). Islanded options keep the offer
// here: they use the connection only as backup (C1), and every islanded rule tests C1 directly. Cached on the context.
export const CONTRACT_KEY = { wait: 'contractWaitMW', bridge: 'contractBridgeMW', export: 'contractExportMW' };
export function contractLimit(inputs, C1) {
  const k = CONTRACT_KEY[C1];
  const x = k ? inputs.grid[k] : null;
  return x == null || x === '' || !Number.isFinite(Number(x)) ? Infinity : Math.max(0, Number(x));
}
export function contractedCap(ctx, C1) {
  if (ctx.contractApplied) return ctx.gridCap; // already contracted (a takeover in place of part of the new connection)
  const lim = contractLimit(ctx.inputs, C1);
  if (!(lim < Infinity)) return ctx.gridCap;
  if (!ctx.contractCache) ctx.contractCache = new Map();
  let a = ctx.contractCache.get(lim);
  if (!a) { a = ctx.gridCap.map((x) => Math.min(x, lim)); ctx.contractCache.set(lim, a); }
  return a;
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
// Hourly IT utilisation (fraction of installed IT), by load shape (§5.3; work package 4, walkthrough 2026-10-21):
// flat (the average utilisation every hour); daily fluctuation (as built: a daily sine around the average, swing by
// workload unless entered, small seeded noise); AI training (high, near-flat with a checkpoint dip every few hours);
// AI inference (a daily cycle peaking in the afternoon, a night trough and lower weekends). Each shape is scaled to
// its average (the average utilisation input, or the AI profile's own) and capped at 100 %.
export function itShape(inputs, seed) {
  const L = inputs.load;
  const shape = L.shape || 'daily';
  const rnd = mulberry32(subSeed(seed, 'itshape'));
  const a = new Float64Array(H);
  let u = L.utilisation;
  if (shape === 'flat') {
    a.fill(1);
  } else if (shape === 'aiTraining') {
    u = L.aiTrainUtil;
    const every = Math.max(1, Math.round(L.aiTrainDipEveryH)), dur = Math.max(1, Math.round(L.aiTrainDipH));
    // The dip is at its stated level; the other hours are set so that the average is u (the scaling below then
    // changes nothing unless the 100 % cap binds).
    const f = Math.min(dur, every) / every;
    const d = Math.max(0, Math.min(1, L.aiTrainDip));
    const hi = f < 1 ? Math.min(1, (u - f * d) / (1 - f)) : d;
    for (let h = 0; h < H; h++) a[h] = (h % every) < dur ? d : hi;
  } else if (shape === 'aiInference') {
    u = L.aiInfUtil;
    const tr = Math.max(0, Math.min(1, L.aiInfTrough));
    for (let h = 0; h < H; h++) {
      const hr = h % 24, day = Math.floor(h / 24) % 7;
      const daily = tr + (1 - tr) * (0.5 + 0.5 * Math.cos((2 * Math.PI * (hr - L.aiInfPeakHour)) / 24));
      a[h] = daily * (day >= 5 ? L.aiInfWeekend : 1);
    }
  } else {
    const amp = L.dailySwing != null ? L.dailySwing : L.workload === 'ai-training' ? 0.01 : L.workload === 'enterprise' ? 0.08 : 0.04;
    for (let h = 0; h < H; h++) {
      const hr = h % 24;
      a[h] = 1 + amp * Math.sin((2 * Math.PI * (hr - 9)) / 24) + 0.01 * (rnd() - 0.5);
    }
  }
  let sum = 0;
  for (let h = 0; h < H; h++) sum += a[h];
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
  // Measured weather, when entered, replaces the synthetic temperatures and design temperatures (engine/weather.js).
  const prof = applyWeather(getProfiles(country, seed, inputs.project.lat), inputs);
  // Timeline: the run setting (120 months), extended so it always covers full load (the last phase plus its ramp) and the
  // full grid date with a year to spare (known issue 17, work package 11, 2026-10-24).
  const phaseMs = (inputs.load.phases || []).map((p) => monthOf(inputs, p.date)).filter(Number.isFinite);
  const gridFullM0 = inputs.grid.fullDate ? monthOf(inputs, inputs.grid.fullDate) : 0;
  const needM = Math.max(phaseMs.length ? Math.max(...phaseMs) + (inputs.load.rampMonths || 0) : 0, Number.isFinite(gridFullM0) ? gridFullM0 : 0) + 12;
  const nMonthsTimeline = Math.max(inputs.settings.timelineMonths, Math.ceil(needM / 12) * 12);
  // Existing plant near the site (work package 12): its technology record follows this run's inputs.
  const existing = applyExistingPlant(inputs, (d) => monthOf(inputs, d));
  // Existing gas plants from the bundled list (work package 19): their technology records follow this run's inputs.
  const plants = applyPlants(inputs);
  const dp = Array.isArray(inputs.economics.displayPeriods) ? inputs.economics.displayPeriods.map(Number).filter((n) => Number.isInteger(n) && n <= 60) : [];
  const maxYears = Math.max(inputs.economics.periodYears, ...dp, Math.ceil(nMonthsTimeline / 12));
  const nMonths = Math.max(nMonthsTimeline, maxYears * 12) + 12;
  const gridCap = gridCapByMonth(inputs, nMonths);
  const itInst = itInstalledByMonth(inputs, nMonths);
  const shape = itShape(inputs, seed);
  const baseYear = yearOf(inputs.project.analysisStart);
  const startMonth = parseYM(inputs.project.analysisStart).m;

  // Hourly PUE from the entered annual and maximum PUE (work package 20, owner 2026-11-02): one profile, in place of one
  // per cooling type. Kept under the key COOLING_ID so the rest of the engine reads it as before.
  const cooling = { [COOLING_ID]: pueProfile(PUE_SHAPE, prof, Number(inputs.load.pueAnnual), Number(inputs.load.pueMax)) };
  // PUE overhead multiplier (tornado and Monte Carlo driver "PUE", work packages 9 and 20): scales the overhead above 1.
  const cf = inputs.load.coolingFactor ?? 1;
  if (cf !== 1) for (const id of Object.keys(cooling)) {
    const c = cooling[id];
    cooling[id] = { ...c, coolFrac: c.coolFrac.map((x) => x * cf), mechFrac: c.mechFrac.map((x) => x * cf), coolAvg: c.coolAvg * cf, coolPeak: c.coolPeak * cf, coolPeak50: c.coolPeak50 == null ? null : c.coolPeak50 * cf };
  }

  // Gas commodity price and carbon price (§5.4, §5.6): a number entered for utilities.gasPrice or economics.carbonPrice
  // replaces the country default (the records' value is "by country"); the gas transport adder applies either way.
  // Before the port slice the engine read only the country values (the inputs were ignored).
  const gasCommodity = Number.isFinite(inputs.utilities.gasPrice) ? inputs.utilities.gasPrice : cdata.gas;
  const gasPrice = gasCommodity + FUEL.gasTransportAdder;
  const priceMult = inputs.grid.priceMultiplier;
  // Grid non-commodity adder (network charges and levies, €/MWh): a number entered for grid.priceAdder replaces the
  // country default (the record's value is "by country"). Before work package 11 the entered value was ignored (found in
  // the Pego study, revision 3, 2026-10-24).
  // Work package 24 (OPEN-QUESTIONS 203, 233): the country default holds every grid charge at the normal tax rate; the
  // reduced data centre rate (France, Great Britain) applies only when the engineer ticks it; with the per-MW tick the
  // per-MW part comes out of the country default at the flat load it was worked out for. An entered adder is used as
  // entered (Claude's reading, logged as OPEN-QUESTIONS 236: the engineer's figure is not changed by the tool).
  const adderEntered = Number.isFinite(inputs.grid.priceAdder);
  const reducedOn = !!inputs.grid.dcReducedRate && !!CONDITIONAL_RATE[country];
  let priceAdder = adderEntered ? inputs.grid.priceAdder : ((LEGACY_ADDERS ? null : researchedAdder(country, reducedOn)) ?? cdata.adder);
  const gridFixed = gridFixedSetup(inputs, country, adderEntered);
  if (gridFixed.on && !adderEntered) priceAdder = Math.max(0, priceAdder - gridFixed.adderRemoved);
  const carbonMult = inputs.grid.carbonMultiplier;
  const carbonPrice = Number.isFinite(inputs.economics.carbonPrice) ? inputs.economics.carbonPrice : cdata.carbonPrice;

  // Phase months
  const phases = inputs.load.phases.map((p) => ({ m: monthOf(inputs, p.date), it: Number(p.itMW) })).sort((a, b) => a.m - b.m);
  const firstPhaseM = phases.length ? phases[0].m : 0;
  const lastPhaseM = phases.length ? phases[phases.length - 1].m : 0;
  const fullGridM = monthOf(inputs, inputs.grid.fullDate);
  const gasM = inputs.utilities.gasDateMonths;

  const ctx = {
    inputs, country, cdata, prof, seed, nMonths, nMonthsTimeline, existing, plants, gridCap, itInst, shape, baseYear, startMonth,
    cooling, gasCommodity, gasPrice, priceMult, priceAdder, adderEntered, gridFixed, carbonMult, carbonPrice, phases, firstPhaseM, lastPhaseM, fullGridM, gasM,
    demandCache: new Map(),
    demandStats: { hits: 0, misses: 0 }, // run-log counters for the hourly demand cache
    site: opts.site || buildSiteModel(inputs), // site model and buildable-envelope raster (§10.1), shared by every option
  };
  return ctx;
}

// The context of one option (work package 19, OPEN-QUESTIONS 120): with C21 = a nearby plant's grid connection, the
// grid offered to the campus gains that connection from the month the campus can use it, up to the campus's design
// load; the grid "full-connection month" (when bridging plant hands over) becomes the first month the grid offered is
// at least the full grid capacity entered (or the design load, if less), if that is earlier. Everything else is shared with the run's context (the
// demand cache included). Without a takeover it is the run's context itself.
export function ctxFor(ctx, v, sz = null) {
  // Realism rebuild (OPEN-QUESTIONS 248): with the option's sizing, the context also carries the option's own building
  // dates (energise.js), when they differ from the plan.
  const c = takeoverCtx(ctx, v);
  return sz && sz.energise && sz.energise.shifted && !c.energise ? energisedCtx(c, sz.energise) : c;
}

// Installed IT per month from phases given as months (the ramp rule of itInstalledByMonth).
export function itInstFromPhases(phases, load, nMonths) {
  const arr = new Float64Array(nMonths);
  const { rampStart, rampMonths } = load;
  for (let m = 0; m < nMonths; m++) {
    let it = 0;
    for (const p of phases) {
      if (m < p.m) continue;
      it += p.it * (rampMonths > 0 ? Math.min(1, rampStart + (1 - rampStart) * ((m - p.m) / rampMonths)) : 1);
    }
    arr[m] = it;
  }
  return arr;
}

// The context of an option whose buildings start on its own dates (energise.js): the phases it powers, on the months
// they start; the installed IT and the hourly demand follow. Everything else is shared with the context it comes
// from. Cached per schedule, so options with the same building dates share one hourly demand.
const ENERGISE_KEEP = 48; // schedules whose hourly demand is kept (each holds about 3 MB a dispatched year)
export function energisedCtx(ctx, en) {
  if (!en || !en.shifted || ctx.energise) return ctx;
  if (!ctx.energiseCache) ctx.energiseCache = new Map();
  let d = ctx.energiseCache.get(en.key);
  if (d) return d;
  const phases = [];
  let lost = 0;
  ctx.phases.forEach((p, k) => { if (en.starts[k] != null) phases.push({ m: en.starts[k], it: p.it, plannedM: p.m, k }); else lost += p.it; });
  d = {
    ...ctx, phases, itInst: itInstFromPhases(phases, ctx.inputs.load, ctx.nMonths),
    firstPhaseM: phases.length ? phases[0].m : 0, lastPhaseM: phases.length ? phases[phases.length - 1].m : 0,
    itPowered: lost > 0 ? Math.max(0, Number(ctx.inputs.load.itMW) - lost) : undefined,
    demandCache: new Map(), energise: en, plannedCtx: ctx, energiseCache: null,
  };
  ctx.energiseCache.set(en.key, d);
  if (ctx.energiseCache.size > ENERGISE_KEEP) {
    // Drop the hourly demand of the oldest schedule (it is rebuilt if an option asks for it again).
    const oldest = ctx.energiseCache.keys().next().value;
    ctx.energiseCache.get(oldest).demandCache.clear();
    const keep = ctx.energiseCache.get(oldest);
    ctx.energiseCache.delete(oldest); ctx.energiseCache.set(oldest, keep);
  }
  return d;
}

function takeoverCtx(ctx, v) {
  if (!v || !isTakeover(v.C21) || ctx.takeover) return ctx;
  // Cached first (Opus review finding 19): the key holds everything the derived context depends on in this run.
  const own0 = [v.C2, v.C4].map(parsePlantValue).find((p) => p && p.id === parsePlantValue(v.C21).id && p.mode !== 'takeover');
  const key = `${v.C21}|${own0 ? own0.mode : '-'}|${v.C1}`;
  if (!ctx.takeoverCache) ctx.takeoverCache = new Map();
  const hit = ctx.takeoverCache.get(key);
  if (hit) return hit;
  const plant = plantOf(ctx.inputs, v.C21);
  if (!plant) return ctx;
  // The same plant's power, used in this option: it runs until its connection is ready (lease: the listed closure,
  // bought: the refurbished life), then the campus takes the connection over.
  const own = [v.C2, v.C4].map(parsePlantValue).find((p) => p && p.id === plant.id && p.mode !== 'takeover');
  const closeM = own && (own.mode === 'buy' || own.mode === 'buyWhole') && plant.closeM !== Infinity ? plant.closeM + plant.buyExtraYears * 12 : plant.closeM;
  // A plant whose default closure has passed (OPEN-QUESTIONS 125): its connection from the transfer months after the start.
  const month = plant.defaultPassed ? plant.takeoverM : Math.max(0, closeM) + plant.takeoverLagMonths;
  const { arr } = designDemandByMonth(ctx, COOLING_ID);
  let need = 0;
  for (let m = 0; m < arr.length; m++) if (arr[m] > need) need = arr[m];
  const mw = Math.max(0, Math.min(plant.takeoverMW, need));
  // In place of part of the new connection (tk:, OPEN-QUESTIONS 126): from the takeover month the new connection is
  // reduced by the MW taken over, and the contracted capacity caps the new connection only (so the option's grid is
  // already contracted here). As well as the new one (ta:): added on top, and the contract caps the total, as before.
  const add = !!parsePlantValue(v.C21).add;
  const fullMW0 = Number(ctx.inputs.grid.fullMW) || 0;
  const newMW = add ? fullMW0 : Math.max(0, fullMW0 - mw);
  const lim = add ? Infinity : contractLimit(ctx.inputs, v.C1);
  const gridCap = Float64Array.from(ctx.gridCap, (x, m) => (m >= month ? (add ? x + mw : Math.min(x, newMW, lim) + mw) : (add ? x : Math.min(x, lim))));
  // Bridging hands over once the grid offered carries what the full grid would: the full grid capacity entered, or the
  // campus design load if that is less.
  const full = Math.min(Number(ctx.inputs.grid.fullMW) || 0, need);
  let fullGridM = ctx.fullGridM;
  for (let m = month; m < gridCap.length && m < fullGridM; m++) if (gridCap[m] + 1e-9 >= full) { fullGridM = m; break; }
  const takeover = { value: v.C21, plant, month, mw, needMW: need, offeredMW: plant.takeoverMW, costPerMW: plant.takeoverCostPerMW, cost: mw * plant.takeoverCostPerMW, ownPower: own ? own.mode : null, closeM, add, newMW };
  const d = { ...ctx, gridCap, fullGridM, contractCache: new Map(), takeover, baseCtx: ctx, contractApplied: !add };
  ctx.takeoverCache.set(key, d);
  return d;
}

// Hourly facility demand for model year y (8760 h), from the hourly PUE (coolingId is COOLING_ID since work package 20).
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

// Design facility load per month (maximum PUE, 100 % IT installed).
// Design-day PUE hour by hour (OPEN-QUESTIONS 60, 2026-10-23; work package 20): the year's hottest day, shifted so that
// its hottest hour is at the design temperature; PUE from the same shape as the hourly PUE, so the hottest hour is the
// entered maximum PUE and the peak hour equals the design load. Used to size and check a battery against the design day.
export function designDayPUE(ctx, coolingId) {
  if (!ctx.designDayCache) ctx.designDayCache = new Map();
  if (ctx.designDayCache.has(coolingId)) return ctx.designDayCache.get(coolingId);
  const p = PUE_SHAPE.p;
  const cp = ctx.cooling[coolingId];
  const prof = ctx.prof;
  const t = p.tempBasis === 'wetbulb' ? prof.wetbulb : prof.temp;
  const designT = p.tempBasis === 'wetbulb' ? prof.designWetbulb : prof.designTemp;
  let hMax = 0;
  for (let h = 1; h < t.length; h++) if (t[h] > t[hMax]) hMax = h;
  const d0 = Math.min(Math.floor(hMax / 24) * 24, t.length - 24);
  let dayMax = -Infinity;
  for (let k = 0; k < 24; k++) dayMax = Math.max(dayMax, t[d0 + k]);
  const out = new Float64Array(24);
  for (let k = 0; k < 24; k++) {
    const T = t[d0 + k] + (designT - dayMax);
    const c = Math.max(1.5, p.copRef - p.copSlope * (T - p.tRef));
    const part = T <= p.fcThreshold ? 0 : T >= p.fcThreshold + p.band ? 1 : (T - p.fcThreshold) / p.band;
    const o = cp.shapeB > 0 ? Math.max(0, cp.shapeA + cp.shapeB * (p.fanFrac + part / c)) : cp.coolPeak / (ctx.inputs.load.coolingFactor ?? 1);
    out[k] = 1 + o * (ctx.inputs.load.coolingFactor ?? 1) + cp.lossFrac;
  }
  ctx.designDayCache.set(coolingId, out);
  return out;
}

export function designDemandByMonth(ctx, coolingId) {
  const cp = ctx.cooling[coolingId];
  const peakPUE = 1 + cp.coolPeak + cp.lossFrac;
  const anc = ctx.inputs.load.ancillaryFrac;
  const arr = new Float64Array(ctx.nMonths);
  for (let m = 0; m < ctx.nMonths; m++) arr[m] = ctx.itInst[m] * (peakPUE + anc);
  return { arr, peakPUE };
}

export { TECH };

// The yearly grid charges per MW and per site (work package 24, OPEN-QUESTIONS 160–165, 203, 216, 217). Off unless the
// engineer ticks grid.perMWInclude. perMW: € per MW of contracted capacity a year (entered, or the country's researched
// value; null = none found, nothing charged, flagged); lumpSum: € a year per site (Great Britain's residual);
// adderRemoved: €/MWh taken out of the country adder (the per-MW part at the flat load, and Great Britain's whole
// TNUoS part, which holds the residual).
export function gridFixedSetup(inputs, country, adderEntered) {
  const g = inputs.grid || {};
  const d = gridChargeData(country);
  const num = (x) => x !== null && x !== undefined && x !== '' && Number.isFinite(Number(x));
  const perMWEntered = num(g.perMWCharge);
  const perMW = perMWEntered ? Number(g.perMWCharge) : d && Number.isFinite(d.perMW) ? d.perMW : null;
  const isGB = country === 'GB';
  const lumpEntered = num(g.lumpSumPerYear);
  const lumpSum = lumpEntered ? Number(g.lumpSumPerYear) : isGB ? GB_RESIDUAL.eurPerYear : 0;
  const countryPerMW = d && Number.isFinite(d.perMW) ? d.perMW : 0;
  // What the country default holds for these charges (at the flat load): GB its TNUoS part (£10.8/MWh), else the
  // researched per-MW charge spread over the flat load's MWh.
  const adderRemoved = isGB ? GB_RESIDUAL.networkPartGbpPerMWh / 0.8377 : countryPerMW / FLAT_LOAD_MWH_PER_MW;
  return {
    on: !!g.perMWInclude, perMW, perMWEntered, perMWBasis: perMWEntered ? 'entered' : perMW == null ? 'none' : 'country',
    lumpSum, lumpEntered, adderRemoved: adderEntered ? 0 : adderRemoved, data: d,
    discount: !!g.flatLoadDiscount && country === 'DE', discountData: DE_DISCOUNT,
  };
}
