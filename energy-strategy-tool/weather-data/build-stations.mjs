// Builds typical weather years for NOAA GHCNh stations in the tool's countries (owner 2026-10-30, OPEN-QUESTIONS
// 106–107). Release-time only: needs internet, runs on GitHub (.github/workflows/weather-data.yml), never in the app.
//
//   node build-stations.mjs --countries FR,DE --years 2010-2024 --min-years 10 --concurrency 16 [--limit 20]
//
// Writes out/stations-<countries>.json (one record per usable station) and out/report-<countries>.json (what was read,
// skipped and why, quality codes seen). The method is in app/src/engine/weathertmy.js (tested in the app's test 49).
//
// Data: NOAA NCEI Global Historical Climatology Network hourly (GHCNh), by-year Parquet files. Non-US data carry the
// WMO Resolution 40 condition (no redistribution for commercial purposes); the owner states the tool's use is
// non-commercial (OPEN-QUESTIONS 106).

import fs from 'node:fs';
import path from 'node:path';
import { asyncBufferFromUrl, cachedAsyncBuffer, parquetMetadataAsync, parquetSchema, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import { hourlyFromObs, prepareYear, typicalYear, offsetFor, FIPS_TO_ISO } from '../app/src/engine/weathertmy.js';

export const BASE = 'https://www.ncei.noaa.gov/oa/global-historical-climatology-network/hourly';
const VARS = { temp: 'temperature', dew: 'dew_point_temperature', rh: 'relative_humidity', p: 'station_level_pressure', wind: 'wind_speed' };
// Quality codes that keep a value. The first trial run (2026-10-31) showed GHCNh carrying the ISD quality codes for
// European stations ("1" on almost every value, a few "4"). ISD's codes: 0 passed gross limits, 1 passed all checks,
// 2 suspect, 3 erroneous, 4 and 5 as 0 and 1 from an NCEI source, 6 and 7 as 2 and 3 from an NCEI source, 9 passed gross
// limits. Kept: empty, 0, 1, 4, 5, 9; dropped: 2, 3, 6, 7 and any other code (the report lists every code seen, with
// counts). Override with --accept-codes A,B (added to the kept set).
let ACCEPT = new Set(['', '0', '1', '4', '5', '9']);

function args() {
  const a = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')]; }));
  const [y0, y1] = (a.years || '2010-2024').split('-').map(Number);
  if (a['accept-codes'] !== undefined) for (const c of a['accept-codes'].split(',')) ACCEPT.add(c.trim());
  return {
    countries: (a.countries || 'all').toUpperCase(), y0, y1, minYears: Number(a['min-years'] || 10), concurrency: Number(a.concurrency || 16),
    limit: a.limit ? Number(a.limit) : Infinity, out: a.out || 'out', stationList: a['station-list'] || null,
  };
}

function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length >= head.length).map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i]])));
}

export function europeanStations(csvText, countries) {
  const want = countries === 'ALL' ? null : new Set(countries.split(','));
  return parseCsv(csvText).map((r) => ({
    id: r.GHCN_ID, name: (r.NAME || '').trim(), lat: Number(r.LATITUDE), lon: Number(r.LONGITUDE), elev: Number(r.ELEVATION),
    wmo: (r.WMO_ID || '').trim(), icao: (r.ICAO || '').trim(), cc: FIPS_TO_ISO[(r.GHCN_ID || '').slice(0, 2)],
  })).filter((s) => s.cc && (!want || want.has(s.cc)) && Number.isFinite(s.lat) && s.lat > 25 && s.lat < 72 && s.lon > -32 && s.lon < 45);
}

async function fetchText(url, tries = 4) {
  for (let k = 1; ; k++) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.text(); }
    catch (e) { if (k >= tries) throw e; await new Promise((res) => setTimeout(res, 2000 * k)); }
  }
}

// One station-year from its Parquet file: observations, or null when the file does not exist.
async function readYear(id, year, stats) {
  const url = `${BASE}/access/by-year/${year}/parquet/GHCNh_${id}_${year}.parquet`;
  let file;
  for (let k = 1; ; k++) {
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (head.status === 404) return null;
      if (!head.ok) throw new Error(`HTTP ${head.status}`);
      file = cachedAsyncBuffer(await asyncBufferFromUrl({ url, byteLength: Number(head.headers.get('content-length')) || undefined }));
      break;
    } catch (e) { if (k >= 4) { stats.errors.push(`${id} ${year}: ${e.message}`); throw new Error(`${id} ${year}: ${e.message}`); } await new Promise((r) => setTimeout(r, 2000 * k)); }
    // A failure other than "no such file" is thrown, so the whole-station retry and the error count see it (R2 M5).
  }
  const meta = await parquetMetadataAsync(file);
  const names = new Set(parquetSchema(meta).children.map((c) => c.element.name));
  if (!stats.schemaSeen) stats.schemaSeen = [...names];
  const cols = ['DATE', ...Object.values(VARS).filter((v) => names.has(v))];
  const qcols = Object.values(VARS).flatMap((v) => [`${v}_Quality_Code`, `${v}_Source_Code`]).filter((c) => names.has(c));
  const pos = ['LATITUDE', 'LONGITUDE'].filter((c) => names.has(c));
  if (!names.has('DATE') || !names.has('temperature')) { stats.errors.push(`${id} ${year}: no DATE or temperature column`); return null; }
  const rows = await parquetReadObjects({ file, metadata: meta, columns: [...cols, ...qcols, ...pos], compressors });
  stats.bytes += file.byteLength || (meta && meta.metadata_length) || 0;
  const obs = [];
  // The station's position in its own data file (R2 M6: some list entries have lost a minus sign).
  if (rows.length && pos.length === 2) obs.pos = { lat: Number(rows[0].LATITUDE), lon: Number(rows[0].LONGITUDE) };
  for (const r of rows) {
    const t = Date.parse(String(r.DATE).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(r.DATE)) ? '' : 'Z'));
    if (!Number.isFinite(t)) continue;
    const o = { t };
    for (const [k, v] of Object.entries(VARS)) {
      let x = r[v] == null || r[v] === '' ? NaN : Number(r[v]);
      const q = r[`${v}_Quality_Code`];
      // "Null" is GHCNh's "no code" (R2 M1): the same as empty. Source 345 uses 1 for "issue" and 3 for "error"
      // (GHCNh table 3), so those are dropped for that source.
      let code = q == null ? '' : String(q).trim();
      if (/^null$/i.test(code)) code = '';
      const srcCode = String(r[`${v}_Source_Code`] ?? '').trim();
      if (Number.isFinite(x)) { const key = `${v}:${code || '(none)'}${srcCode === '345' ? '@345' : ''}`; stats.codes[key] = (stats.codes[key] || 0) + 1; }
      if (!ACCEPT.has(code) || (srcCode === '345' && (code === '1' || code === '3'))) { if (Number.isFinite(x)) stats.dropped = (stats.dropped || 0) + 1; x = NaN; }
      o[k] = x;
    }
    obs.push(o);
  }
  return obs;
}

const pack = (arr) => Buffer.from(Int16Array.from(arr, (x) => Math.round(x * 10)).buffer).toString('base64');

async function station(s, a, stats) {
  const off = offsetFor(s.cc, s.lon);
  // Recent years first: a station is dropped early when none of the last three years has a file with at least 6
  // usable months (judgement; R2 M3: one poor latest year no longer drops it). Reasons for months left out are counted.
  const years = [];
  let recentOk = false, perDay = [];
  for (let y = a.y1; y >= a.y0; y--) {
    const obs = await readYear(s.id, y, stats);
    if (obs && obs.pos && Number.isFinite(obs.pos.lat) && Number.isFinite(obs.pos.lon) && !s.posChecked) {
      s.posChecked = true;
      const dKm = Math.hypot((obs.pos.lat - s.lat) * 111, (obs.pos.lon - s.lon) * 111 * Math.cos((s.lat * Math.PI) / 180));
      if (dKm > 5) { s.posNote = `station list position ${s.lat}, ${s.lon} differs from its data file (${obs.pos.lat}, ${obs.pos.lon}) by ${Math.round(dKm)} km; the data file's position is used`; s.lat = obs.pos.lat; s.lon = obs.pos.lon; stats.posFixed = (stats.posFixed || 0) + 1; }
    }
    if (obs) {
      const months = prepareYear(hourlyFromObs(obs, y, off), s.elev);
      for (const r of months.reasons) if (r) stats.monthReasons[r] = (stats.monthReasons[r] || 0) + 1;
      if (months.readingsPerDay) perDay.push(months.readingsPerDay);
      if (months.filter(Boolean).length >= 6 && y > a.y1 - 3) recentOk = true;
      years.push({ year: y, months });
    }
    if (y === a.y1 - 2 && !recentOk) return { skip: years.length ? 'no recent year with 6 usable months' : 'no file in the last three years' };
    // Stop early when a month can no longer reach the minimum.
    const left = y - a.y0;
    for (let m = 0; m < 12; m++) if (years.filter((v) => v.months[m]).length + left < a.minYears) return { skip: `month ${m + 1} cannot reach ${a.minYears} usable years` };
  }
  const r = typicalYear(years, { minYears: a.minYears });
  if (!r.ok) return { skip: r.reason };
  return {
    rec: {
      id: s.id, name: s.name, cc: s.cc, lat: s.lat, lon: s.lon, elev: s.elev, wmo: s.wmo || null, icao: s.icao || null,
      years: r.usedYears, picks: r.picks.map((p) => p.year),
      // Design (OPEN-QUESTIONS 115): n = 20 and n = 50-year maxima; 0.4 % values for information. intervalH: the median
      // hours between readings (1 = hourly), so the app can warn about 3-hourly stations.
      design: r.design, intervalH: (() => { perDay.sort((x, y) => x - y); const d = perDay[Math.floor(perDay.length / 2)] || 24; return Math.max(1, Math.round(24 / d)); })(),
      posNote: s.posNote || null,
      db: pack(r.tmy.dryBulb), wb: pack(r.tmy.wetBulb),
    },
  };
}

async function main() {
  const a = args();
  fs.mkdirSync(a.out, { recursive: true });
  const t0 = Date.now();
  const csv = a.stationList ? fs.readFileSync(a.stationList, 'utf8') : await fetchText(`${BASE}/doc/ghcnh-station-list.csv`);
  // Airports (ICAO) and WMO stations first: most are long-running and still reporting, so a limited trial finds them.
  const rankOf = (s) => (s.icao ? 0 : s.wmo ? 1 : 2);
  const list = europeanStations(csv, a.countries).sort((x, y) => rankOf(x) - rankOf(y) || (x.id < y.id ? -1 : 1)).slice(0, a.limit);
  console.log(`${list.length} stations in ${a.countries}; years ${a.y0}–${a.y1}; at least ${a.minYears} usable years per month`);
  const stats = { bytes: 0, codes: {}, errors: [], skipped: {}, schemaSeen: null, monthReasons: {} };
  const out = [];
  let next = 0, done = 0;
  const worker = async () => {
    while (next < list.length) {
      const s = list[next++];
      try {
        // A failed download is retried once with the whole station, so repeated builds give the same set (the first
        // two full builds differed by 16 stations through network errors, 2026-10-31).
        let r;
        try { r = await station(s, a, stats); } catch (e1) { await new Promise((res) => setTimeout(res, 3000)); r = await station(s, a, stats); }
        if (r.rec) out.push(r.rec); else stats.skipped[r.skip.replace(/\d+/g, 'n')] = (stats.skipped[r.skip.replace(/\d+/g, 'n')] || 0) + 1;
      } catch (e) { stats.errors.push(`${s.id}: ${e.message}`); }
      if (++done % 50 === 0) console.log(`${done}/${list.length} stations, ${out.length} usable, ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    }
  };
  await Promise.all(Array.from({ length: a.concurrency }, worker));
  out.sort((x, y) => (x.id < y.id ? -1 : 1));
  const tag = a.countries === 'ALL' ? 'all' : a.countries.replace(/,/g, '-');
  fs.writeFileSync(path.join(a.out, `stations-${tag}.json`), JSON.stringify(out));
  const report = {
    trial: Number.isFinite(a.limit), runInputs: { years: `${a.y0}-${a.y1}`, minYears: a.minYears, limit: Number.isFinite(a.limit) ? a.limit : null },
    monthReasons: stats.monthReasons, valuesDropped: stats.dropped || 0, positionsCorrected: stats.posFixed || 0,
    countries: a.countries, years: `${a.y0}–${a.y1}`, minYears: a.minYears, stations: list.length, usable: out.length,
    skipped: stats.skipped, errors: stats.errors.slice(0, 200), errorCount: stats.errors.length, qualityCodesSeen: stats.codes,
    acceptedCodes: [...ACCEPT], schemaSeen: stats.schemaSeen, megabytesRead: Math.round(stats.bytes / 1e6), minutes: Math.round((Date.now() - t0) / 6000) / 10,
    builtAt: new Date().toISOString(), source: `${BASE} (by-year Parquet)`,
  };
  fs.writeFileSync(path.join(a.out, `report-${tag}.json`), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ ...report, schemaSeen: undefined, errors: undefined }, null, 1));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
