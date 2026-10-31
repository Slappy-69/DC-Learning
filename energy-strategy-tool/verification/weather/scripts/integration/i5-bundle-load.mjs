// i5: start-up cost of the station bundle as App.jsx loads it (gzip → DecompressionStream → Response.json → setStations),
// with a made-up bundle of N stations of the real record shape (2 × 8,760 int16 values, base64). Node 22 has the same
// web streams; Chromium's numbers will differ, the order of magnitude will not.
// Usage: node --expose-gc i5-bundle-load.mjs [N=1950]
import { gzipSync } from 'node:zlib';
import { setStations, nearestStations, stationWeather } from '../../../../app/src/engine/stations.js';
const N = Number(process.argv[2] || 1950);
const rnd = () => Buffer.from(Int16Array.from({ length: 8760 }, () => Math.round(Math.random() * 300)).buffer).toString('base64');
const stations = Array.from({ length: N }, (_, i) => ({ id: `S${i}`, name: `STATION ${i}`, icao: '', cc: 'FR', lat: 36 + Math.random() * 34, lon: -10 + Math.random() * 40, elev: 100, years: '2010–2024', designDB: 30, designWB: 21, db: rnd(), wb: rnd() }));
const text = JSON.stringify({ source: 'test', stations });
const gz = gzipSync(text);
console.log(`bundle ${N} stations: ${(text.length / 1e6).toFixed(1)} MB JSON, ${(gz.length / 1e6).toFixed(1)} MB gzip (random data compresses worse than real)`);
global.gc && global.gc();
const h0 = process.memoryUsage();
const t0 = performance.now();
const s = new Response(gz).body.pipeThrough(new DecompressionStream('gzip'));
const b = await new Response(s).json();
const t1 = performance.now();
const n = setStations(b);
const t2 = performance.now();
const h1 = process.memoryUsage();
const t3 = performance.now();
for (let k = 0; k < 100; k++) nearestStations(40 + k * 0.1, 2, 1);
const t4 = performance.now();
const w = stationWeather(nearestStations(48.8, 2.3, 1)[0].s);
const t5 = performance.now();
console.log(`decompress + parse ${(t1 - t0).toFixed(0)} ms; setStations ${(t2 - t1).toFixed(0)} ms (${n} kept); heap +${((h1.heapUsed - h0.heapUsed) / 1e6).toFixed(0)} MB, rss +${((h1.rss - h0.rss) / 1e6).toFixed(0)} MB; nearest station ${((t4 - t3) / 100).toFixed(2)} ms per pin move; decode one station ${(t5 - t4).toFixed(1)} ms`);
