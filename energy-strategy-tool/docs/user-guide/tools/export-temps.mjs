// Export the T1 temperature histograms and one day of prices and solar into data/t1-temps.json (for diagram d04).
// Usage, from this folder: node export-temps.mjs [output file]
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const E = new URL('../../../app/src/engine/', import.meta.url).href;
const { getProfiles } = await import(E + 'profiles.js');
const p = getProfiles('GB', 20261015, 52.29);
const hist = (arr, lo, hi) => { const n = hi - lo; const h = new Array(n).fill(0); for (const t of arr) { const k = Math.floor(t) - lo; if (k >= 0 && k < n) h[k]++; } return h; };
const out = { dry: hist(p.temp, -15, 40), wet: hist(p.wetbulb, -15, 30), dryLo: -15, wetLo: -15, designTemp: p.designTemp, designWetbulb: p.designWetbulb,
  minT: Math.min(...p.temp), minW: Math.min(...p.wetbulb), mean: p.stats.tMean,
  priceDay: Array.from(p.price.slice(2904, 2928)), solarDay: Array.from(p.solar.slice(2904, 2928)) };
fs.writeFileSync(process.argv[2] || fileURLToPath(new URL('../data/t1-temps.json', import.meta.url)), JSON.stringify(out));
console.log(out.minT.toFixed(1), out.minW.toFixed(1), out.designTemp.toFixed(2), out.designWetbulb.toFixed(2), out.dry.reduce((a,b)=>a+b,0), out.wet.reduce((a,b)=>a+b,0));
