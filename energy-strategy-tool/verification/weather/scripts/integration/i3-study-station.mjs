// i3: study round trip with a NOAA station year, as App.jsx does it: save, read, hash at open, then the nearest-station
// effect (App.jsx 131-139) compares w.id with the nearest station's id.
import { referenceT1, normalizeInputs, hashInputs, studyFile, readStudyFile, getProfiles, resolveCountry } from '../../../../app/src/engine/index.js';
import { setStations, nearestStations, stationWeather } from '../../../../app/src/engine/stations.js';
const base = referenceT1({ analysisStart: '2027-01' });
const prof = getProfiles(resolveCountry(base), base.project.seed, base.project.lat);
const pack = (arr) => Buffer.from(Int16Array.from(arr, (x) => Math.round(x * 10)).buffer).toString('base64');
const rec = { id: '03772099999', name: 'LONDON HEATHROW', icao: 'EGLL', cc: 'GB', lat: 51.478, lon: -0.461, elev: 25, years: '2010–2024', designDB: 28.9, designWB: 19.8, db: pack(prof.temp), wb: pack(prof.wetbulb) };
setStations({ stations: [rec] });
const sw = stationWeather(nearestStations(base.project.lat, base.project.lon, 1)[0].s);
const inp = { ...base, weather: sw };
const savedHash = hashInputs(normalizeInputs(inp));
const f = studyFile(inp, null);
const r = readStudyFile(JSON.stringify(f));
console.log('read ok', r.ok, '| warnings:', r.warnings);
console.log('weather.id after reading:', r.inputs.weather.id, '| source:', r.inputs.weather.source);
const openHash = hashInputs(normalizeInputs(r.inputs));
console.log('hash saved', savedHash, 'hash at open', openHash, 'equal', savedHash === openHash);
// App effect: replaces the weather when w.id !== nearest id.
const n = nearestStations(r.inputs.project.lat, r.inputs.project.lon, 1)[0];
const replaced = r.inputs.weather.source !== 'epw' && r.inputs.weather.id !== n.s.id;
console.log('nearest-station effect replaces the weather after opening:', replaced);
const after = replaced ? { ...r.inputs, weather: stationWeather(n.s) } : r.inputs;
const runHash = hashInputs(normalizeInputs(after));
console.log('hash of the inputs actually run', runHash, '| equals openedStudy.hash (comparison fires):', runHash === openHash, '| equals saved hash:', runHash === savedHash);
// Old study without weather opened in the Windows program
const old = JSON.parse(JSON.stringify(f)); delete old.inputs.weather; delete old.inputsAsRun.weather;
const r2 = readStudyFile(JSON.stringify(old));
console.log('old study warnings:', r2.warnings, '| weather source after read:', r2.inputs.weather.source);
console.log('study bytes with station:', JSON.stringify(f, null, 1).length, 'without weather:', JSON.stringify(old, null, 1).length);
setStations([]);
