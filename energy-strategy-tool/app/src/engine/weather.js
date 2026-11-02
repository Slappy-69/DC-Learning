// Hourly weather from measured data (owner 2026-10-30, OPEN-QUESTIONS 106–107; research
// docs/research/hourly-weather-2026-10-30.md): an EPW file uploaded by the engineer, or (later) the nearest bundled NOAA
// station year. Replaces the synthetic dry-bulb and wet-bulb temperatures and the design temperatures; the synthetic
// solar, wind, price and carbon profiles are unchanged.
//
// Psychrometrics: ASHRAE Handbook — Fundamentals (2017, SI), chapter 1: saturation pressure by Hyland and Wexler
// (eqs 5 and 6), humidity ratio (eq 20 with 0.621945), wet bulb from the humidity ratio (eqs 33 and 35, solved by
// bisection). Standard equations, not defaults.

export const HOURS = 8760;

// Saturation vapour pressure, Pa, over ice below 0 °C and over liquid water from 0 °C (ASHRAE eqs 5–6).
export function satPressure(tC) {
  const T = tC + 273.15;
  if (tC < 0) {
    return Math.exp(-5.6745359e3 / T + 6.3925247 - 9.677843e-3 * T + 6.2215701e-7 * T * T + 2.0747825e-9 * T ** 3 - 9.484024e-13 * T ** 4 + 4.1635019 * Math.log(T));
  }
  return Math.exp(-5.8002206e3 / T + 1.3914993 - 4.8640239e-2 * T + 4.1764768e-5 * T * T - 1.4452093e-8 * T ** 3 + 6.5459673 * Math.log(T));
}

// Standard atmospheric pressure at an elevation, Pa (ASHRAE eq 3).
export const pressureAtElevation = (z) => 101325 * Math.pow(1 - 2.25577e-5 * (z || 0), 5.2559);

const ratio = (pw, p) => (0.621945 * pw) / Math.max(1, p - pw);

// Humidity ratio, kg/kg, from dry bulb (°C), dew point (°C, or null) or relative humidity (%), and pressure (Pa).
export function humidityRatio(t, dp, rh, p) {
  if (dp != null && Number.isFinite(dp)) return ratio(satPressure(Math.min(dp, t)), p);
  return ratio((Math.max(0, Math.min(100, rh)) / 100) * satPressure(t), p);
}

// Wet-bulb temperature (thermodynamic), °C, from dry bulb, humidity ratio and pressure (ASHRAE eqs 33 and 35).
export function wetBulb(t, W, p) {
  const wFor = (twb) => {
    const ws = ratio(satPressure(twb), p);
    return twb >= 0
      ? ((2501 - 2.326 * twb) * ws - 1.006 * (t - twb)) / (2501 + 1.86 * t - 4.186 * twb)
      : ((2830 - 0.24 * twb) * ws - 1.006 * (t - twb)) / (2830 + 1.86 * t - 2.1 * twb);
  };
  let lo = t - 60, hi = t;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (wFor(mid) > W) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const r1 = (x) => Math.round(x * 10) / 10;

// The value exceeded in a share of the hours (0.004 = 0.4 %, the ASHRAE cooling design level).
export function exceeded(arr, share = 0.004) {
  const s = Array.from(arr).filter(Number.isFinite).sort((a, b) => b - a);
  if (!s.length) return null;
  return s[Math.max(0, Math.ceil(s.length * share) - 1)];
}

// Fills gaps of up to maxGap hours by straight lines; returns the number of hours still missing.
function fillGaps(a, maxGap) {
  let missing = 0;
  for (let h = 0; h < a.length; h++) {
    if (Number.isFinite(a[h])) continue;
    let e = h; while (e < a.length && !Number.isFinite(a[e])) e++;
    const len = e - h;
    if (len <= maxGap && h > 0 && e < a.length) { for (let k = h; k < e; k++) a[k] = a[h - 1] + ((a[e] - a[h - 1]) * (k - h + 1)) / (len + 1); }
    else if (len <= maxGap && (h === 0) !== (e === a.length)) { const v = h === 0 ? a[e] : a[h - 1]; for (let k = h; k < e; k++) a[k] = v; } // a short gap at the start or end of the year (R1 F4)
    else missing += len;
    h = e - 1;
  }
  return missing;
}

function num(x, missing) {
  const v = Number(x);
  return x === undefined || x === '' || !Number.isFinite(v) || v >= missing ? NaN : v;
}

// Reads an EPW file's text. Returns { ok, weather, warnings } or { ok: false, error }.
// weather: { source: 'epw', name, country, lat, lon, elevationM, years, dryBulb[8760], wetBulb[8760], designDB, designWB,
//            designBasis, hoursFilled }.
export function readEpw(text, fileName = 'weather.epw') {
  let src = String(text || '');
  if (src.charCodeAt(0) === 0xfeff) src = src.slice(1); // a byte-order mark
  const lines = src.split(/\r\n|\r|\n/); // also old Mac files with CR only (R1 F10)
  const loc = (lines[0] || '').split(',');
  if (!/^LOCATION$/i.test((loc[0] || '').trim())) return { ok: false, error: `${fileName} is not an EPW weather file (its first line does not start with LOCATION).` };
  const lat = Number(loc[6]), lon = Number(loc[7]), elev = Number(loc[9]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return { ok: false, error: `${fileName}: the LOCATION line has no valid latitude and longitude.` };
  const db = new Array(HOURS).fill(NaN), dp = new Array(HOURS).fill(NaN), rh = new Array(HOURS).fill(NaN), pr = new Array(HOURS).fill(NaN);
  const years = new Set();
  let rows = 0, skippedLeap = 0, badDates = 0, repeats = 0;
  const seen = new Uint8Array(HOURS);
  const first = lines.findIndex((l, i) => i >= 8 && /^\s*\d{4},\s*\d{1,2},\s*\d{1,2},\s*\d{1,2},/.test(l));
  if (first < 0) return { ok: false, error: `${fileName}: no hourly data rows were found.` };
  for (let i = first; i < lines.length; i++) {
    const f = lines[i].split(',');
    if (f.length < 10) continue;
    const y = Number(f[0]), m = Number(f[1]), d = Number(f[2]), hr = Number(f[3]);
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && hr >= 1 && hr <= 24)) continue;
    if (m === 2 && d === 29) { skippedLeap++; continue; }
    if (d > MONTH_DAYS[m - 1]) { badDates++; continue; } // a day that does not exist (31 April): left out, counted
    const idx = (DAYS_BEFORE[m - 1] + d - 1) * 24 + (hr - 1);
    if (seen[idx]) { repeats++; continue; } // a second row for the same hour (a multi-year or sub-hourly file): the first is kept
    seen[idx] = 1;
    if (idx < 0 || idx >= HOURS) continue;
    rows++;
    if (Number.isFinite(y)) years.add(y);
    db[idx] = num(f[6], 99.9); dp[idx] = num(f[7], 99.9); rh[idx] = num(f[8], 999); pr[idx] = num(f[9], 999999);
  }
  if (rows < HOURS * 0.95) return { ok: false, error: `${fileName}: ${rows} hourly rows read, fewer than a year (8,760).` };
  const warnings = [];
  const gapsDB = fillGaps(db, 6);
  if (gapsDB > 0) return { ok: false, error: `${fileName}: ${gapsDB} hours of dry-bulb temperature are missing in gaps longer than 6 hours.` };
  const pStd = pressureAtElevation(Number.isFinite(elev) ? elev : 0);
  fillGaps(dp, 6); fillGaps(rh, 6); fillGaps(pr, 24);
  const dryBulb = new Array(HOURS), wet = new Array(HOURS);
  let noHumidity = 0;
  for (let h = 0; h < HOURS; h++) {
    const p = Number.isFinite(pr[h]) && pr[h] > 50000 ? pr[h] : pStd;
    const t = db[h];
    let W;
    if (Number.isFinite(dp[h])) W = humidityRatio(t, dp[h], null, p);
    else if (Number.isFinite(rh[h])) W = humidityRatio(t, null, rh[h], p);
    else { noHumidity++; W = humidityRatio(t, null, 50, p); }
    dryBulb[h] = r1(t);
    wet[h] = r1(wetBulb(t, W, p));
  }
  if (noHumidity) warnings.push(`${noHumidity} hours had no dew point or humidity; 50 % relative humidity was assumed for them.`);
  if (skippedLeap) warnings.push('29 February was left out (the model uses a 365-day year).');
  if (repeats) warnings.push(`${repeats} rows repeated an hour already read (a file with more than one year, or sub-hourly rows); the first row for each hour was used.`);
  if (badDates) warnings.push(`${badDates} rows had a date that does not exist and were left out.`);
  // Design temperatures (owner 2026-10-31, OPEN-QUESTIONS 115): the n-year return-period extremes. Sizing uses N = 20;
  // each option also shows its design load at N = 50 as a check. From the file's ASHRAE "Extremes" block when present:
  // n = 20 and n = 50 maximum dry bulb, and the extreme maximum wet bulb (ASHRAE gives no return period for wet bulb, so
  // it is used for both). Without the block: the hottest hour and the highest wet bulb of the file, which a typical year
  // understates (flagged). The file's 0.4 % cooling values are kept for information.
  let design = null, design04 = null;
  const dc = lines.find((l) => /^DESIGN CONDITIONS/i.test(l));
  const tok = dc ? dc.split(',').map((x) => x.trim()) : [];
  const dcSource = tok[2] || 'ASHRAE';
  const kc = tok.findIndex((x) => /^Cooling$/i.test(x));
  if (kc > 0) {
    const a = Number(tok[kc + 3]), b = Number(tok[kc + 9]);
    if (Number.isFinite(a) && Number.isFinite(b) && a > -20 && a < 60 && b > -20 && b < 45 && b <= a) design04 = { db: a, wb: b };
  }
  const ke = tok.findIndex((x) => /^Extremes$/i.test(x));
  if (ke > 0) {
    const wbx = Number(tok[ke + 4]), db20 = Number(tok[ke + 14]), db50 = Number(tok[ke + 16]);
    if ([wbx, db20, db50].every(Number.isFinite) && db20 > -20 && db20 < 65 && db50 >= db20 && wbx > -20 && wbx < 45 && wbx <= db20) {
      design = { db20, wb20: wbx, db50, wb50: wbx, kind: 'extreme', basis: `the file's ASHRAE extremes (${dcSource}): n = 20 and n = 50-year maximum dry bulb, and the extreme maximum wet bulb (no return period given for wet bulb)` };
    }
  }
  if (!design) {
    const dbMax = Math.max(...dryBulb), wbMax = Math.max(...wet);
    design = { db20: dbMax, wb20: wbMax, db50: dbMax, wb50: wbMax, kind: 'hottest-hour', basis: 'the hottest hour and highest wet bulb of the file (it has no ASHRAE extremes); one year, often a typical year, understates n-year extremes' };
  }
  const yr = [...years].sort();
  const name = [loc[1], loc[2]].map((x) => (x || '').trim()).filter((x) => x && x !== '-').join(', ') || fileName;
  return {
    ok: true, warnings,
    weather: {
      source: 'epw', id: null, auto: false, readingIntervalH: null, name, country: (loc[3] || '').trim(), file: fileName, lat, lon, elevationM: Number.isFinite(elev) ? elev : null,
      years: yr.length ? (yr.length === 1 ? String(yr[0]) : `${yr[0]}–${yr[yr.length - 1]} (${yr.length > 2 ? 'months from several years' : 'two years'})`) : '',
      dataSource: (loc[4] || '').trim(), dryBulb, wetBulb: wet,
      designDB: r1(design.db20), designWB: r1(design.wb20), designDB50: r1(design.db50), designWB50: r1(design.wb50), designKind: design.kind,
      designBasis: design.basis, design04DB: design04 ? design04.db : null, design04WB: design04 ? design04.wb : null, humidityAssumedHours: noHumidity, notes: warnings,
    },
  };
}

// Great-circle distance, km.
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0088, rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// True when the inputs carry a usable measured weather year.
export function hasWeather(inputs) {
  const w = inputs && inputs.weather;
  return !!(w && w.source && w.source !== 'none' && Array.isArray(w.dryBulb) && w.dryBulb.length === HOURS && Array.isArray(w.wetBulb) && w.wetBulb.length === HOURS);
}

// The profiles with the measured weather in place of the synthetic temperatures.
export function applyWeather(prof, inputs) {
  if (!hasWeather(inputs)) return prof;
  const w = inputs.weather;
  const temp = Float64Array.from(w.dryBulb), wetbulb = Float64Array.from(w.wetBulb);
  let s = 0, tMax = -Infinity, twMax = -Infinity;
  for (let h = 0; h < HOURS; h++) { s += temp[h]; if (temp[h] > tMax) tMax = temp[h]; if (wetbulb[h] > twMax) twMax = wetbulb[h]; }
  return {
    ...prof, temp, wetbulb,
    designTemp: Number.isFinite(w.designDB) ? w.designDB : tMax,
    designWetbulb: Number.isFinite(w.designWB) ? w.designWB : twMax,
    // The N = 50 check (OPEN-QUESTIONS 115): shown on each option, not used for sizing.
    designTemp50: Number.isFinite(w.designDB50) ? w.designDB50 : null,
    designWetbulb50: Number.isFinite(w.designWB50) ? w.designWB50 : null,
    stats: { ...prof.stats, tMean: s / HOURS, tMax, twMax },
    weather: weatherSummary(inputs),
  };
}

// One line describing the weather in use (flags, run summary, PDF), and how serious its flag is: a warning (minor)
// when the station is more than 50 km from the pin, when the design comes from one year's hottest hour, or when
// humidity was assumed for some hours; otherwise information (R1 F2, R3 M3).
export const FAR_KM = 50;
export function weatherSummary(inputs) {
  if (!hasWeather(inputs)) return null;
  const w = inputs.weather, p = inputs.project;
  const km = Number.isFinite(w.lat) && Number.isFinite(p.lat) ? distanceKm(p.lat, p.lon, w.lat, w.lon) : null;
  const what = w.source === 'epw' ? `uploaded EPW file "${w.file || w.name}"` : `NOAA station ${w.name}${w.auto ? ', the nearest to the pin, chosen by the program' : ''}`;
  const kmTxt = km != null ? `${km < 10 ? km.toFixed(1) : Math.round(km)} km from the pin` : null;
  const warnings = [];
  if (km != null && km > FAR_KM) warnings.push(`more than ${FAR_KM} km from the pin: check that its climate is representative`);
  if (w.designKind === 'hottest-hour') warnings.push('design from one year\'s hottest hour, which understates n-year extremes');
  if (w.humidityAssumedHours > 0) warnings.push(`humidity assumed (50 %) for ${w.humidityAssumedHours} hours`);
  if (w.readingIntervalH >= 3) warnings.push(`the station reports every ${w.readingIntervalH} hours, so peaks between readings are missed`);
  const n50 = Number.isFinite(w.designDB50) && w.designKind !== 'hottest-hour' ? `; check at n = 50: ${w.designDB50} °C and ${w.designWB50} °C` : '';
  return {
    km, level: warnings.length ? 'minor' : 'info', warnings,
    text: `${what} (${[w.source === 'epw' ? w.name : null, w.years].filter(Boolean).join(', ')})${kmTxt ? `, ${kmTxt}` : ''}; sized to n = 20: ${w.designDB} °C dry bulb and ${w.designWB} °C wet bulb${n50}, from ${w.designBasis}${warnings.length ? `. Warning: ${warnings.join('; ')}` : ''}`,
  };
}
