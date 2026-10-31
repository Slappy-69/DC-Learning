// Merges out/stations-*.json into out/weather-stations.json (one list) and out/weather-summary.json (counts, sizes,
// reports). Release-time only. The app's use of the bundle is not built yet (see README).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const dir = process.argv[2] || 'out';
const files = fs.readdirSync(dir).filter((f) => /^stations-.*\.json$/.test(f));
const all = files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
all.sort((a, b) => (a.id < b.id ? -1 : 1));
const ids = new Set(); const stations = all.filter((s) => (ids.has(s.id) ? false : ids.add(s.id)));
const text = JSON.stringify({ source: 'NOAA NCEI GHCNh (by-year Parquet); typical years by ISO 15927-4 (app/src/engine/weathertmy.js)', builtAt: new Date().toISOString(), stations });
fs.writeFileSync(path.join(dir, 'weather-stations.json'), text);
const gz = zlib.gzipSync(text, { level: 9 });
fs.writeFileSync(path.join(dir, 'weather-stations.json.gz'), gz);
const reports = fs.readdirSync(dir).filter((f) => /^report-.*\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const byCountry = {}; for (const s of stations) byCountry[s.cc] = (byCountry[s.cc] || 0) + 1;
const summary = { stations: stations.length, byCountry, megabytes: +(text.length / 1e6).toFixed(1), megabytesGzip: +(gz.length / 1e6).toFixed(1), reports };
fs.writeFileSync(path.join(dir, 'weather-summary.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, reports: reports.map((r) => ({ countries: r.countries, stations: r.stations, usable: r.usable, errors: r.errorCount, minutes: r.minutes, codes: r.qualityCodesSeen })) }, null, 1));
