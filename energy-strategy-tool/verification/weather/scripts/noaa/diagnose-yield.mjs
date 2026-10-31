// R2 NOAA method review (2026-10-31): why do so many French and Spanish stations fail "latest year has n usable months"?
// Diagnostic only. Needs internet (NOAA), so run it on your own computer or a GitHub runner, not in a Claude session.
// It is NOT part of the weather-data workflow and changes nothing.
//
//   cd energy-strategy-tool/weather-data && npm ci
//   node ../verification/weather/scripts/noaa/diagnose-yield.mjs --country FR --sample 40 --year 2024 > fr-2024.txt
//   node ../verification/weather/scripts/noaa/diagnose-yield.mjs --ids FRM00007149,SPE00120089 --year 2024
//
// For each station it reads one year (by-year Parquet, the same columns as build-stations.mjs) and prints:
//  - the station ID's third character (network letter) and whether it has a WMO or ICAO code;
//  - rows in the file; temperature values present; how many the quality-code rule drops, by code ('' counted too);
//  - readings by minute past the hour (UTC), and how many distinct local hours of the day are ever reported
//    (6-hourly or daytime-only stations show up here);
//  - dew point and relative humidity present (any code), and Report_Type and Source_Code counts;
//  - per month, the first rule in prepareYear that rejects it: T<80% (temperature after ≤ 6 h fills),
//    T-samehour (an hour of day never reported in the month), HUM<80%, HUM-missing, or OK.
// At the end: a tally of network letters × outcome, and of month rejection reasons.
import { asyncBufferFromUrl, cachedAsyncBuffer, parquetMetadataAsync, parquetSchema, parquetReadObjects } from '../../../../weather-data/node_modules/hyparquet/src/node.js';
import { compressors } from '../../../../weather-data/node_modules/hyparquet-compressors/src/index.js';
import { hourlyFromObs, prepareYear, offsetFor, fillRange, fillSameHour, MONTH_HOURS } from '../../../../app/src/engine/weathertmy.js';
import { europeanStations, BASE } from '../../../../weather-data/build-stations.mjs';

const A = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')]; }));
const YEAR = Number(A.year || 2024), SAMPLE = Number(A.sample || 30);
const ACCEPT = new Set(['', '0', '1', '4', '5', '9']);
const VARS = { temp: 'temperature', dew: 'dew_point_temperature', rh: 'relative_humidity', p: 'station_level_pressure', wind: 'wind_speed' };
const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

async function read(id) {
  const url = `${BASE}/access/by-year/${YEAR}/parquet/GHCNh_${id}_${YEAR}.parquet`;
  const head = await fetch(url, { method: 'HEAD' });
  if (head.status === 404) return null;
  const file = cachedAsyncBuffer(await asyncBufferFromUrl({ url, byteLength: Number(head.headers.get('content-length')) || undefined }));
  const meta = await parquetMetadataAsync(file);
  const names = new Set(parquetSchema(meta).children.map((c) => c.element.name));
  const want = ['DATE', ...Object.values(VARS), ...Object.values(VARS).map((v) => `${v}_Quality_Code`), 'temperature_Report_Type', 'temperature_Source_Code'].filter((c) => names.has(c));
  return parquetReadObjects({ file, metadata: meta, columns: want, compressors });
}

function monthReasons(hourly, elev) {
  const months = prepareYear(hourly, elev);
  return months.map((mo, m) => {
    if (mo) return 'OK';
    const a = DAYS_BEFORE[m] * 24, b = a + MONTH_HOURS[m];
    const t = hourly.temp.slice(a, b);
    if (fillRange(t, 0, t.length, 6) > t.length * 0.2) return 'T<80%';
    if (fillSameHour(t) > 0) return 'T-samehour';
    const dew = hourly.dew.slice(a, b), rh = hourly.rh.slice(a, b);
    const dm = fillRange(dew, 0, dew.length, 6), rm = fillRange(rh, 0, rh.length, 6);
    if (Math.min(dm, rm) > t.length * 0.2) return 'HUM<80%';
    return 'HUM-missing';
  });
}

async function main() {
  let list;
  const csv = await (await fetch(`${BASE}/doc/ghcnh-station-list.csv`)).text();
  const all = europeanStations(csv, 'ALL');
  if (A.ids) { const ids = new Set(A.ids.split(',')); list = all.filter((s) => ids.has(s.id)); }
  else {
    const c = all.filter((s) => s.cc === (A.country || 'FR').toUpperCase());
    // A spread sample: every k-th station of the list sorted by ID (so every network letter appears).
    const k = Math.max(1, Math.floor(c.length / SAMPLE));
    list = c.sort((x, y) => (x.id < y.id ? -1 : 1)).filter((s, i) => i % k === 0).slice(0, SAMPLE);
    const net = {}; for (const s of c) net[s.id[2]] = (net[s.id[2]] || 0) + 1;
    console.log(`${c.length} stations in ${A.country || 'FR'}; network letters (ID character 3):`, net);
  }
  const tally = {}, reasons = {};
  for (const s of list) {
    let rows;
    try { rows = await read(s.id); } catch (e) { console.log(`${s.id} error ${e.message}`); continue; }
    const tag = `${s.id[2]}${s.icao ? '+ICAO' : ''}${s.wmo ? '+WMO' : ''}`;
    if (!rows) { console.log(`${s.id} ${tag} ${s.name}: no ${YEAR} file`); tally[`${tag} nofile`] = (tally[`${tag} nofile`] || 0) + 1; continue; }
    const off = offsetFor(s.cc);
    const codes = {}, minutes = {}, rtype = {}, src = {};
    let tPresent = 0, dewPresent = 0, rhPresent = 0;
    const localHours = new Set();
    const obs = [];
    for (const r of rows) {
      const t = Date.parse(String(r.DATE).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(r.DATE)) ? '' : 'Z'));
      if (!Number.isFinite(t)) continue;
      const o = { t };
      for (const [k, v] of Object.entries(VARS)) {
        let x = r[v] == null || r[v] === '' ? NaN : Number(r[v]);
        const code = r[`${v}_Quality_Code`] == null ? '' : String(r[`${v}_Quality_Code`]).trim();
        if (k === 'temp' && Number.isFinite(x)) { tPresent++; codes[code] = (codes[code] || 0) + 1; const d = new Date(t); minutes[d.getUTCMinutes()] = (minutes[d.getUTCMinutes()] || 0) + 1; localHours.add((d.getUTCHours() + off + 24) % 24); rtype[r.temperature_Report_Type] = (rtype[r.temperature_Report_Type] || 0) + 1; src[r.temperature_Source_Code] = (src[r.temperature_Source_Code] || 0) + 1; }
        if (k === 'dew' && Number.isFinite(x)) dewPresent++;
        if (k === 'rh' && Number.isFinite(x)) rhPresent++;
        if (!ACCEPT.has(code)) x = NaN;
        o[k] = x;
      }
      obs.push(o);
    }
    const mr = monthReasons(hourlyFromObs(obs, YEAR, off), s.elev);
    const ok = mr.filter((x) => x === 'OK').length;
    for (const x of mr) reasons[x] = (reasons[x] || 0) + 1;
    const outcome = ok >= 6 ? 'passes-latest' : 'fails-latest';
    tally[`${tag} ${outcome}`] = (tally[`${tag} ${outcome}`] || 0) + 1;
    const topMin = Object.entries(minutes).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m, n]) => `:${String(m).padStart(2, '0')}×${n}`).join(' ');
    console.log(`${s.id} ${tag} ${s.name}: rows ${rows.length}, T ${tPresent} (codes ${JSON.stringify(codes)}), dew ${dewPresent}, RH ${rhPresent}, minutes ${topMin}, local hours reported ${localHours.size}/24, report types ${JSON.stringify(rtype)}, sources ${JSON.stringify(src)}\n    months: ${mr.join(' ')} → ${ok} usable`);
  }
  console.log('\nOutcome by network letter:', tally);
  console.log('Month rejections:', reasons);
}
main().catch((e) => { console.error(e); process.exit(1); });
