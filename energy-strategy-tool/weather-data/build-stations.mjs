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
// Quality codes that keep a value. GHCNh leaves the code empty for a value that passed its checks (to confirm on the
// first real run: the report lists every code seen, with counts). Override with --accept-codes A,B.
let ACCEPT = new Set(['']);

function args() {
  const a = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')]; }));
  const [y0, y1] = (a.years || '2010-2024').split('-').map(Number);
  if (a['accept-codes'] !== undefined) ACCEPT = new Set(['', ...a['accept-codes'].split(',').map((x) => x.trim())]);
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
    } catch (e) { if (k >= 4) { stats.errors.push(`${id} ${year}: ${e.message}`); return null; } await new Promise((r) => setTimeout(r, 2000 * k)); }
  }
  const meta = await parquetMetadataAsync(file);
  const names = new Set(parquetSchema(meta).children.map((c) => c.element.name));
  if (!stats.schemaSeen) stats.schemaSeen = [...names];
  const cols = ['DATE', ...Object.values(VARS).filter((v) => names.has(v))];
  const qcols = Object.values(VARS).map((v) => `${v}_Quality_Code`).filter((c) => names.has(c));
  if (!names.has('DATE') || !names.has('temperature')) { stats.errors.push(`${id} ${year}: no DATE or temperature column`); return null; }
  const rows = await parquetReadObjects({ file, metadata: meta, columns: [...cols, ...qcols], compressors });
  stats.bytes += file.byteLength || 0;
  const obs = [];
  for (const r of rows) {
    const t = Date.parse(String(r.DATE).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(r.DATE)) ? '' : 'Z'));
    if (!Number.isFinite(t)) continue;
    const o = { t };
    for (const [k, v] of Object.entries(VARS)) {
      let x = r[v] == null || r[v] === '' ? NaN : Number(r[v]);
      const q = r[`${v}_Quality_Code`];
      const code = q == null ? '' : String(q).trim();
      if (Number.isFinite(x) && code) { stats.codes[`${v}:${code}`] = (stats.codes[`${v}:${code}`] || 0) + 1; }
      if (!ACCEPT.has(code)) x = NaN;
      o[k] = x;
    }
    obs.push(o);
  }
  return obs;
}

const pack = (arr) => Buffer.from(Int16Array.from(arr, (x) => Math.round(x * 10)).buffer).toString('base64');

async function station(s, a, stats) {
  const off = offsetFor(s.cc);
  // Probe the latest year first: a station with no usable recent months is dropped after one file.
  const years = [];
  for (let y = a.y1; y >= a.y0; y--) {
    const obs = await readYear(s.id, y, stats);
    if (!obs) { if (y === a.y1) return { skip: 'no file for the latest year' }; continue; }
    const months = prepareYear(hourlyFromObs(obs, y, off), s.elev);
    const usable = months.filter(Boolean).length;
    if (y === a.y1 && usable < 6) return { skip: `latest year has ${usable} usable months` };
    years.push({ year: y, months });
    // Stop early when a month can no longer reach the minimum.
    const left = y - a.y0;
    for (let m = 0; m < 12; m++) if (years.filter((v) => v.months[m]).length + left < a.minYears) return { skip: `month ${m + 1} cannot reach ${a.minYears} usable years` };
  }
  const r = typicalYear(years, { minYears: a.minYears });
  if (!r.ok) return { skip: r.reason };
  return {
    rec: {
      id: s.id, name: s.name, cc: s.cc, lat: s.lat, lon: s.lon, elev: s.elev, wmo: s.wmo || null, icao: s.icao || null,
      years: r.usedYears, picks: r.picks.map((p) => p.year), designDB: r.design.db, designWB: r.design.wb, designHours: r.design.hours,
      db: pack(r.tmy.dryBulb), wb: pack(r.tmy.wetBulb),
    },
  };
}

async function main() {
  const a = args();
  fs.mkdirSync(a.out, { recursive: true });
  const t0 = Date.now();
  const csv = a.stationList ? fs.readFileSync(a.stationList, 'utf8') : await fetchText(`${BASE}/doc/ghcnh-station-list.csv`);
  const list = europeanStations(csv, a.countries).slice(0, a.limit);
  console.log(`${list.length} stations in ${a.countries}; years ${a.y0}–${a.y1}; at least ${a.minYears} usable years per month`);
  const stats = { bytes: 0, codes: {}, errors: [], skipped: {}, schemaSeen: null };
  const out = [];
  let next = 0, done = 0;
  const worker = async () => {
    while (next < list.length) {
      const s = list[next++];
      try {
        const r = await station(s, a, stats);
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
    countries: a.countries, years: `${a.y0}–${a.y1}`, minYears: a.minYears, stations: list.length, usable: out.length,
    skipped: stats.skipped, errors: stats.errors.slice(0, 200), errorCount: stats.errors.length, qualityCodesSeen: stats.codes,
    acceptedCodes: [...ACCEPT], schemaSeen: stats.schemaSeen, megabytesRead: Math.round(stats.bytes / 1e6), minutes: Math.round((Date.now() - t0) / 6000) / 10,
    builtAt: new Date().toISOString(), source: `${BASE} (by-year Parquet)`,
  };
  fs.writeFileSync(path.join(a.out, `report-${tag}.json`), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ ...report, schemaSeen: undefined, errors: undefined }, null, 1));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
