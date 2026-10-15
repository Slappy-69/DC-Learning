// Hourly profiles (8760 h) per country. SYNTHETIC, seeded and deterministic.
//
// These are not measured data. Each profile is generated from a seeded PRNG and
// scaled to the indicative annual targets in COUNTRIES (defaults.js), which are
// themselves indicative — unverified. Label used in the UI:
//   "Synthetic profile (seeded), calibrated to indicative annual targets — not measured data"
// BRIEF §18 allows synthetic profiles where licensed data cannot be shipped; here no
// dataset has been checked yet, so every profile is synthetic.

import { mulberry32, subSeed, gaussian } from './prng.js';
import { COUNTRIES } from './defaults.js';

export const H = 8760;
export const PROFILE_LABEL = 'Synthetic profile (seeded), calibrated to indicative annual targets — not measured data';

const cache = new Map();

export function nearestCountry(lat, lon) {
  let best = 'GB';
  let bestD = Infinity;
  for (const [code, c] of Object.entries(COUNTRIES)) {
    const dLat = lat - c.lat;
    const dLon = (lon - c.lon) * Math.cos((lat * Math.PI) / 180);
    const d = dLat * dLat + dLon * dLon;
    if (d < bestD) {
      bestD = d;
      best = code;
    }
  }
  return best;
}

function mean(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s / a.length;
}

export function getProfiles(countryCode, seed, latOverride) {
  const key = `${countryCode}|${seed}|${latOverride ?? ''}`;
  if (cache.has(key)) return cache.get(key);
  const c = COUNTRIES[countryCode];
  if (!c) throw new Error(`Unknown country ${countryCode}`);
  const lat = latOverride ?? c.lat;
  const rnd = mulberry32(subSeed(seed, `profiles:${countryCode}`));

  const temp = new Float64Array(H);
  const wetbulb = new Float64Array(H);
  const solar = new Float64Array(H); // MW per MWp
  const wind = new Float64Array(H); // capacity factor 0..1
  const price = new Float64Array(H); // €/MWh wholesale
  const carbon = new Float64Array(H); // gCO2e/kWh

  // Daily weather states (AR(1) on days), interpolated to hours.
  const days = 365;
  const synoptic = new Float64Array(days);
  const cloud = new Float64Array(days);
  const dep = new Float64Array(days);
  let s = 0;
  let cl = 0;
  let dp = 0;
  for (let d = 0; d < days; d++) {
    s = 0.8 * s + 0.6 * gaussian(rnd);
    cl = 0.6 * cl + 0.8 * gaussian(rnd);
    dp = 0.7 * dp + 0.71 * gaussian(rnd);
    synoptic[d] = s * 2.6;
    cloud[d] = cl;
    dep[d] = dp;
  }

  // Wind speed AR(1) hourly.
  const zWind = new Float64Array(H);
  let z = 0;
  for (let h = 0; h < H; h++) {
    z = 0.985 * z + Math.sqrt(1 - 0.985 * 0.985) * gaussian(rnd);
    zWind[h] = z;
  }

  const decl = (d) => 23.44 * Math.sin((2 * Math.PI * (284 + d + 1)) / 365);
  const latR = (lat * Math.PI) / 180;

  for (let h = 0; h < H; h++) {
    const d = Math.floor(h / 24);
    const hr = h % 24;
    const season = -Math.cos((2 * Math.PI * (d - 15)) / 365); // -1 mid-Jan, +1 mid-Jul
    const diurnalAmp = 3.5 + 2 * (season + 1) / 2;
    temp[h] = c.tMean + c.tAmp * season + diurnalAmp * Math.cos((2 * Math.PI * (hr - 15)) / 24) + synoptic[d];
    const depression = Math.max(0.5, (1.5 + 0.22 * Math.max(0, temp[h])) * (1 + 0.25 * dep[d]) * (0.75 + 0.25 * Math.cos((2 * Math.PI * (hr - 15)) / 24)));
    wetbulb[h] = temp[h] - depression;

    // Solar geometry (solar time = clock hour, centred at 12:30).
    const dec = (decl(d) * Math.PI) / 180;
    const ha = ((hr + 0.5 - 12) * 15 * Math.PI) / 180;
    const sinEl = Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(ha);
    const clearSky = sinEl > 0 ? Math.pow(sinEl, 1.15) : 0;
    const cloudiness = 1 / (1 + Math.exp(-(cloud[d] * 1.4 + 0.4 - 0.5 * season))); // 0 clear .. 1 overcast, cloudier in winter
    solar[h] = clearSky * (1 - 0.75 * cloudiness);

    const vMean = 7.2 + 1.3 * -season; // windier in winter
    wind[h] = vMean * Math.exp(0.38 * zWind[h]);
  }

  // Calibrate solar to annual yield (kWh/kWp = MWh/MWp).
  let sSum = 0;
  for (let h = 0; h < H; h++) sSum += solar[h];
  const sScale = c.solarYield / sSum;
  for (let h = 0; h < H; h++) solar[h] = Math.min(1, solar[h] * sScale);

  // Wind: power curve on scaled speed, bisection on speed scale to hit mean CF.
  const curve = (v) => (v < 3 ? 0 : v >= 12.5 ? (v > 25 ? 0 : 1) : Math.pow((v - 3) / 9.5, 2.2));
  const speeds = wind.slice();
  let lo = 0.2;
  let hi = 3;
  for (let it = 0; it < 40; it++) {
    const mid = (lo + hi) / 2;
    let acc = 0;
    for (let h = 0; h < H; h++) acc += curve(speeds[h] * mid);
    if (acc / H < c.windCF) lo = mid;
    else hi = mid;
  }
  const wScale = (lo + hi) / 2;
  for (let h = 0; h < H; h++) wind[h] = curve(speeds[h] * wScale);

  // Price and carbon: anticorrelated with wind and solar, seasonal and diurnal shape.
  const wMean = mean(wind);
  const sMean = mean(solar);
  for (let h = 0; h < H; h++) {
    const d = Math.floor(h / 24);
    const hr = h % 24;
    const season = -Math.cos((2 * Math.PI * (d - 15)) / 365);
    const peaks = 0.12 * Math.exp(-Math.pow((hr - 8) / 2, 2)) + 0.2 * Math.exp(-Math.pow((hr - 19) / 2.2, 2)) - 0.12 * Math.exp(-Math.pow((hr - 3.5) / 2.5, 2));
    price[h] = c.price * (1 + peaks - 0.12 * season - 0.9 * (wind[h] - wMean) - 0.5 * (solar[h] - sMean)) + 6 * gaussian(rnd);
    carbon[h] = c.carbon * (1 - 0.08 * season - 0.9 * (wind[h] - wMean) - 0.45 * (solar[h] - sMean) + 0.06 * gaussian(rnd));
  }
  const pShift = c.price - mean(price);
  for (let h = 0; h < H; h++) price[h] = Math.max(-30, price[h] + pShift);
  const pShift2 = c.price - mean(price);
  for (let h = 0; h < H; h++) price[h] += pShift2;
  for (let h = 0; h < H; h++) carbon[h] = Math.max(0.1 * c.carbon, carbon[h]);
  const cScale = c.carbon / mean(carbon);
  for (let h = 0; h < H; h++) carbon[h] *= cScale;

  // Daily price rank flags used by BESS dispatch (cheapest / dearest n hours of each day).
  const cheap = { 1: new Uint8Array(H), 2: new Uint8Array(H), 4: new Uint8Array(H), 12: new Uint8Array(H) };
  const dear = { 1: new Uint8Array(H), 2: new Uint8Array(H), 4: new Uint8Array(H), 12: new Uint8Array(H) };
  for (let d = 0; d < days; d++) {
    const idx = [];
    for (let k = 0; k < 24; k++) idx.push(d * 24 + k);
    idx.sort((a, b) => price[a] - price[b] || a - b);
    for (const n of [1, 2, 4, 12]) {
      for (let k = 0; k < n; k++) cheap[n][idx[k]] = 1;
      for (let k = 0; k < n; k++) dear[n][idx[23 - k]] = 1;
    }
  }

  let tMax = -Infinity;
  let twMax = -Infinity;
  for (let h = 0; h < H; h++) {
    if (temp[h] > tMax) tMax = temp[h];
    if (wetbulb[h] > twMax) twMax = wetbulb[h];
  }

  const out = {
    country: countryCode, lat, temp, wetbulb, solar, wind, price, carbon, cheap, dear,
    designTemp: tMax, designWetbulb: twMax,
    stats: {
      tMean: mean(temp), tMax, twMax, solarYield: mean(solar) * H, windCF: mean(wind), priceMean: mean(price), carbonMean: mean(carbon),
    },
    label: PROFILE_LABEL,
  };
  cache.set(key, out);
  return out;
}

// Hourly cooling and PUE model (BRIEF §9.3). Returns per-hour fractions per MW of IT load.
//   coolFrac[h]  = cooling electrical power / IT power (fans + mechanical)
//   mechFrac[h]  = mechanical (compressor) part only, used for the trigeneration credit
//   cop[h]       = mechanical COP in that hour
export function coolingProfile(cool, prof) {
  const p = cool.p;
  const t = p.tempBasis === 'wetbulb' ? prof.wetbulb : prof.temp;
  const coolFrac = new Float64Array(H);
  const mechFrac = new Float64Array(H);
  const cop = new Float64Array(H);
  let sum = 0;
  let wueAdiabaticHours = 0;
  const f = (T) => {
    const c = Math.max(1.5, p.copRef - p.copSlope * (T - p.tRef));
    let part;
    if (T <= p.fcThreshold) part = 0;
    else if (T >= p.fcThreshold + p.band) part = 1;
    else part = (T - p.fcThreshold) / p.band;
    return { c, part };
  };
  for (let h = 0; h < H; h++) {
    const { c, part } = f(t[h]);
    cop[h] = c;
    mechFrac[h] = part / c;
    coolFrac[h] = p.fanFrac + mechFrac[h];
    sum += coolFrac[h];
    if (part > 0) wueAdiabaticHours++;
  }
  const designT = p.tempBasis === 'wetbulb' ? prof.designWetbulb : prof.designTemp;
  const d = f(designT);
  const coolPeak = p.fanFrac + d.part / d.c;
  return {
    coolFrac, mechFrac, cop,
    coolAvg: sum / H,
    coolPeak,
    lossFrac: p.lossFrac,
    adiabaticHours: wueAdiabaticHours,
  };
}
