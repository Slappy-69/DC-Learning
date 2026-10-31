// Merges out/stations-*.json into out/weather-stations.json (one list) and out/weather-summary.json (counts, sizes,
// reports). Release-time only. The Windows program carries the bundle (OPEN-QUESTIONS 114; Desktop builds fetch it).
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
// trial: any group limited (a 3-station trial); runInputs: the years and minimum years used (R2 M5, R3 M4).
const summary = { trial: reports.some((r) => r.trial !== false), runInputs: reports.length ? reports[0].runInputs : null, groups: reports.length, stations: stations.length, byCountry, megabytes: +(text.length / 1e6).toFixed(1), megabytesGzip: +(gz.length / 1e6).toFixed(1), reports };
fs.writeFileSync(path.join(dir, 'weather-summary.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, reports: reports.map((r) => ({ countries: r.countries, stations: r.stations, usable: r.usable, errors: r.errorCount, minutes: r.minutes, codes: r.qualityCodesSeen })) }, null, 1));
