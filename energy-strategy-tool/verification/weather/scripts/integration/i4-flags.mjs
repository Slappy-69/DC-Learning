// i4: the flags and the PDF row an option carries with a NOAA station year chosen automatically, including a station
// 180 km from the pin.
import { referenceT1, getProfiles, resolveCountry, runModel } from '../../../../app/src/engine/index.js';
import { setStations, nearestStations, stationWeather } from '../../../../app/src/engine/stations.js';
import { inputRows } from '../../../../app/src/report/report.js';
const base = referenceT1({ analysisStart: '2027-01' });
base.settings.generationCap = 40;
const prof = getProfiles(resolveCountry(base), base.project.seed, base.project.lat);
const pack = (arr) => Buffer.from(Int16Array.from(arr, (x) => Math.round(x * 10)).buffer).toString('base64');
const far = { id: 'FAR', name: 'FAR AWAY', icao: '', cc: 'GB', lat: base.project.lat + 1.6, lon: base.project.lon, elev: 300, years: '2010–2024', designDB: 27.0, designWB: 19.0, db: pack(prof.temp), wb: pack(prof.wetbulb) };
setStations({ stations: [far] });
const n = nearestStations(base.project.lat, base.project.lon, 1)[0];
const w = stationWeather(n.s);
const run = runModel({ ...base, weather: w });
const o = run.options[0];
const show = o.flags.filter((f) => /weather|climate/i.test(f.id + (f.path || '')));
console.log(`station ${n.km.toFixed(0)} km from the pin`);
for (const f of show) console.log(`flag id=${f.id} severity=${f.severity} assumed=${!!f.assumed} :: ${f.message}`);
console.log('PDF row:', JSON.stringify(inputRows({ ...base, weather: w }).find((r) => r.section === 'Weather')));
console.log('run flags:', run.runFlags.map((f) => f.id).join(', '));
setStations([]);
