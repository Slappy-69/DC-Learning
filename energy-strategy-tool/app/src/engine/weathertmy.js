// NOAA station records → a typical weather year, at release time (owner 2026-10-30, OPEN-QUESTIONS 106–107; research
// docs/research/hourly-weather-2026-10-30.md). Used by energy-strategy-tool/weather-data/ (the release script); the app
// only reads its output. Pure functions, so they are tested in the Node suite (test 49) without network access.
//
// Steps:
//  1. Observations (UTC) → one value per local-standard-time hour: the observation nearest the top of the hour, within
//     30 minutes. The value at hh:00 goes to the hour ending hh:00, as in EPW files (engine/weather.js).
//  2. Gaps of up to 6 hours filled by straight lines; a calendar month of one year is usable only if nothing is missing
//     after that (judgement, as for EPW files).
//  3. Typical year by ISO 15927-4: per calendar month, the Finkelstein–Schafer statistic of daily mean dry bulb and
//     daily mean humidity (station records carry no solar radiation, so it is left out: a departure from the standard,
//     recorded); ranks summed; of the three best years, the one whose mean wind speed is closest to the long-term mean
//     (the best rank when there is no wind); 8 hours either side of each month join interpolated.
//  4. Design conditions from all usable hours of all years (0.4 % dry bulb and 0.4 % wet bulb), not from the typical year.
//  5. A station is usable when every calendar month has at least minYears usable years (default 10, judgement).

import { HOURS, humidityRatio, wetBulb, pressureAtElevation, exceeded } from './weather.js';

const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTH_HOURS = MONTH_DAYS.map((d) => d * 24);
const r1 = (x) => Math.round(x * 10) / 10;

// Local standard time offset (hours from UTC) of the tool's 31 countries; no daylight saving, as in EPW files.
export const STANDARD_OFFSET = {
  GB: 0, IE: 0, PT: 0, IS: 0,
  FI: 2, EE: 2, LV: 2, LT: 2, RO: 2, BG: 2, GR: 2, CY: 2,
};
export const offsetFor = (cc) => STANDARD_OFFSET[cc] ?? 1;

// FIPS 10-4 country codes in GHCNh station IDs → the tool's ISO codes.
export const FIPS_TO_ISO = {
  AU: 'AT', BE: 'BE', BU: 'BG', HR: 'HR', CY: 'CY', EZ: 'CZ', DA: 'DK', EN: 'EE', FI: 'FI', FR: 'FR', GM: 'DE', GR: 'GR', HU: 'HU', EI: 'IE',
  IT: 'IT', LG: 'LV', LH: 'LT', LU: 'LU', MT: 'MT', NL: 'NL', PL: 'PL', PO: 'PT', RO: 'RO', LO: 'SK', SI: 'SI', SP: 'ES', SW: 'SE', UK: 'GB',
  NO: 'NO', SZ: 'CH', IC: 'IS',
};

// Observations of one year → hourly arrays (8,760, NaN where missing; 29 February dropped).
// obs: [{ t: Date or ms (UTC), temp, dew, rh, p (hPa), wind }]. Returns { temp, dew, rh, p, wind } Float64Arrays.
export function hourlyFromObs(obs, year, offsetH) {
  const out = { temp: nanArr(), dew: nanArr(), rh: nanArr(), p: nanArr(), wind: nanArr() };
  const best = new Float64Array(HOURS).fill(Infinity);
  const start = Date.UTC(year, 0, 1) - offsetH * 3600e3; // local 00:00 on 1 January
  for (const o of obs) {
    const ms = typeof o.t === 'number' ? o.t : +o.t;
    const local = new Date(ms + offsetH * 3600e3);
    if (local.getUTCFullYear() !== year) continue;
    const m = local.getUTCMonth(), d = local.getUTCDate();
    if (m === 1 && d === 29) continue;
    // Nearest top of the hour; that instant ends hour index (dayOfYear*24 + hour - 1).
    const top = Math.round((ms - start) / 3600e3);
    const dist = Math.abs(ms - (start + top * 3600e3)) / 60e3;
    if (dist > 30) continue;
    const topLocal = new Date(start + top * 3600e3 + offsetH * 3600e3);
    if (topLocal.getUTCMonth() === 1 && topLocal.getUTCDate() === 29) continue;
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    let doy = Math.floor((Date.UTC(topLocal.getUTCFullYear(), topLocal.getUTCMonth(), topLocal.getUTCDate()) - Date.UTC(year, 0, 1)) / 864e5);
    if (isLeap && topLocal.getUTCMonth() > 1) doy -= 1;
    let idx = doy * 24 + topLocal.getUTCHours() - 1; // 01:00 ends hour 0; 00:00 ends the previous day's last hour
    if (topLocal.getUTCFullYear() !== year) idx = topLocal.getUTCFullYear() > year ? HOURS - 1 : -1;
    if (idx < 0 || idx >= HOURS) continue;
    if (!Number.isFinite(o.temp)) continue;
    if (dist >= best[idx]) continue;
    best[idx] = dist;
    out.temp[idx] = o.temp; out.dew[idx] = num(o.dew); out.rh[idx] = num(o.rh); out.p[idx] = num(o.p); out.wind[idx] = num(o.wind);
  }
  return out;
}

const nanArr = () => new Float64Array(HOURS).fill(NaN);
const num = (x) => (Number.isFinite(x) ? x : NaN);

// Fills gaps of up to maxGap hours inside [a, b) by straight lines. Returns hours still missing.
export function fillRange(arr, a, b, maxGap = 6) {
  let missing = 0;
  for (let h = a; h < b; h++) {
    if (Number.isFinite(arr[h])) continue;
    let e = h; while (e < b && !Number.isFinite(arr[e])) e++;
    const len = e - h;
    if (len <= maxGap && h > a && e < b) { for (let k = h; k < e; k++) arr[k] = arr[h - 1] + ((arr[e] - arr[h - 1]) * (k - h + 1)) / (len + 1); }
    else missing += len;
    h = e - 1;
  }
  return missing;
}

// One station-year → per month: usable?, and the hourly dry bulb, humidity ratio, wet bulb, wind.
export function prepareYear(hourly, elevationM, maxGap = 6) {
  const pStd = pressureAtElevation(elevationM || 0);
  const months = [];
  for (let m = 0; m < 12; m++) {
    const a = DAYS_BEFORE[m] * 24, b = a + MONTH_HOURS[m];
    const t = hourly.temp.slice(a, b);
    const missingT = fillRange(t, 0, t.length, maxGap);
    if (missingT > 0) { months.push(null); continue; }
    const dew = hourly.dew.slice(a, b), rh = hourly.rh.slice(a, b), p = hourly.p.slice(a, b), wind = hourly.wind.slice(a, b);
    fillRange(dew, 0, dew.length, maxGap); fillRange(rh, 0, rh.length, maxGap); fillRange(p, 0, p.length, 24); fillRange(wind, 0, wind.length, maxGap);
    const W = new Float64Array(t.length), wb = new Float64Array(t.length);
    let noHum = 0;
    for (let i = 0; i < t.length; i++) {
      const pp = Number.isFinite(p[i]) && p[i] > 500 ? p[i] * 100 : pStd;
      let w;
      if (Number.isFinite(dew[i])) w = humidityRatio(t[i], dew[i], null, pp);
      else if (Number.isFinite(rh[i])) w = humidityRatio(t[i], null, rh[i], pp);
      else { noHum++; w = NaN; }
      W[i] = w;
      wb[i] = Number.isFinite(w) ? wetBulb(t[i], w, pp) : NaN;
    }
    // Humidity must be as complete as temperature for the month to be used (wet bulb drives evaporative cooling).
    if (noHum > 0) { months.push(null); continue; }
    months.push({ t, W, wb, wind });
  }
  return months;
}

const dailyMeans = (arr) => { const out = []; for (let d = 0; d < arr.length / 24; d++) { let s = 0; for (let k = 0; k < 24; k++) s += arr[d * 24 + k]; out.push(s / 24); } return out; };
const mean = (a) => { let s = 0, n = 0; for (const x of a) if (Number.isFinite(x)) { s += x; n++; } return n ? s / n : NaN; };

// Finkelstein–Schafer statistic: mean absolute difference between the year's and the long-term cumulative
// distributions, at the year's daily values (ISO 15927-4, clause 6.1).
export function fsStatistic(yearDaily, allDailySorted) {
  const ys = yearDaily.slice().sort((a, b) => a - b);
  const n = ys.length, N = allDailySorted.length;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = ys[i];
    let lo = 0, hi = N; while (lo < hi) { const mid = (lo + hi) >> 1; if (allDailySorted[mid] <= x) lo = mid + 1; else hi = mid; }
    s += Math.abs((i + 1) / n - lo / N);
  }
  return s / n;
}

// years: [{ year, months: prepareYear(...) }]. Returns { ok, reason, picks[12], tmy: { dryBulb, wetBulb }, design, usedYears }.
export function typicalYear(years, { minYears = 10 } = {}) {
  const picks = [];
  for (let m = 0; m < 12; m++) {
    const cand = years.filter((y) => y.months[m]).map((y) => ({ year: y.year, mo: y.months[m] }));
    if (cand.length < minYears) return { ok: false, reason: `month ${m + 1}: ${cand.length} usable years, fewer than ${minYears}` };
    const dT = cand.map((c) => dailyMeans(c.mo.t)), dW = cand.map((c) => dailyMeans(c.mo.W));
    const allT = dT.flat().sort((a, b) => a - b), allW = dW.flat().sort((a, b) => a - b);
    const fsT = dT.map((d) => fsStatistic(d, allT)), fsW = dW.map((d) => fsStatistic(d, allW));
    const rank = (arr) => { const idx = arr.map((v, i) => i).sort((a, b) => arr[a] - arr[b] || cand[a].year - cand[b].year); const r = new Array(arr.length); idx.forEach((i, k) => { r[i] = k + 1; }); return r; };
    const rT = rank(fsT), rW = rank(fsW);
    const order = cand.map((c, i) => i).sort((a, b) => (rT[a] + rW[a]) - (rT[b] + rW[b]) || cand[a].year - cand[b].year);
    const top3 = order.slice(0, 3);
    const windMeans = cand.map((c) => mean(c.mo.wind));
    const ltWind = mean(windMeans);
    let pick = top3[0];
    if (Number.isFinite(ltWind) && top3.every((i) => Number.isFinite(windMeans[i]))) {
      pick = top3.slice().sort((a, b) => Math.abs(windMeans[a] - ltWind) - Math.abs(windMeans[b] - ltWind) || order.indexOf(a) - order.indexOf(b))[0];
    }
    picks.push({ month: m + 1, year: cand[pick].year, candidates: cand.length, mo: cand[pick].mo });
  }
  const db = new Float64Array(HOURS), W = new Float64Array(HOURS), wbArr = new Float64Array(HOURS);
  picks.forEach((p, m) => { const a = DAYS_BEFORE[m] * 24; db.set(p.mo.t, a); W.set(p.mo.W, a); wbArr.set(p.mo.wb, a); });
  // Smooth each join: the 8 hours either side interpolated between the hours just outside (ISO 15927-4, 6.2).
  for (let m = 1; m < 12; m++) {
    const j = DAYS_BEFORE[m] * 24;
    for (const arr of [db, wbArr]) {
      const a = arr[j - 9], b = arr[j + 8];
      for (let k = -8; k < 8; k++) arr[j + k] = a + ((b - a) * (k + 9)) / 17;
    }
  }
  for (let h = 0; h < HOURS; h++) if (wbArr[h] > db[h]) wbArr[h] = db[h];
  // Design: 0.4 % of all usable hours of all years.
  const allDB = [], allWB = [];
  for (const y of years) for (const mo of y.months) if (mo) { for (const x of mo.t) allDB.push(x); for (const x of mo.wb) allWB.push(x); }
  const yrs = years.map((y) => y.year).sort();
  return {
    ok: true, picks: picks.map(({ month, year, candidates }) => ({ month, year, candidates })),
    tmy: { dryBulb: Array.from(db, r1), wetBulb: Array.from(wbArr, r1) },
    design: { db: r1(exceeded(allDB)), wb: r1(exceeded(allWB)), hours: allDB.length },
    usedYears: `${yrs[0]}–${yrs[yrs.length - 1]}`,
  };
}
