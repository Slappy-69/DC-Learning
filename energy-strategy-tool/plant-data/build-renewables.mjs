// Builds ../app/src/data/renewable-plants.js: wind, solar and hydro plants from powerplantmatching (PyPSA), the same
// pinned list as the gas plants (work package 30; owner 2026-11-07, OPEN-QUESTIONS 194–196, 219–221).
//
// - Source: powerplants.csv at the pinned commit (CC BY 4.0; credit shown on screen, in the PDF and in the flags).
// - German wind turbines (the list carries them one by one from MaStR) are grouped into farms: turbines within 2 km of
//   another turbine of the same farm are one farm (single-link), at the capacity-weighted centre (OPEN-QUESTIONS 220;
//   the 2 km is a judgement).
// - Kept: plants (or farms) of 5 MW or more in the tool's countries, with a position. The engineer sets the size and the
//   distance in the tool (196); 5 MW keeps the bundled file small (Claude's reading, OPEN-QUESTIONS 240).
// - Only plants in operation at the build date are kept (DateOut empty or later, DateIn not after the build year).
//
// Usage (Node 22, internet to GitHub, no packages):
//   node build-renewables.mjs                 # the pinned version
//   node build-renewables.mjs --csv <file>    # a local copy of powerplants.csv

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const REF = '2889ad9d1754a7ee4368b9282d7af835bf572ca2';
const CSV_URL = `https://raw.githubusercontent.com/PyPSA/powerplantmatching/${REF}/powerplants.csv`;
const OUT = new URL('../app/src/data/renewable-plants.js', import.meta.url);
const MIN_MW = 5;
const FARM_KM = 2;
const BUILD_YEAR = 2026;
const CC = { Austria: 'AT', Belgium: 'BE', Bulgaria: 'BG', Croatia: 'HR', Cyprus: 'CY', Czechia: 'CZ', 'Czech Republic': 'CZ', Denmark: 'DK', Estonia: 'EE', Finland: 'FI', France: 'FR', Germany: 'DE', Greece: 'GR', Hungary: 'HU', Ireland: 'IE', Italy: 'IT', Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU', Malta: 'MT', Netherlands: 'NL', Poland: 'PL', Portugal: 'PT', Romania: 'RO', Slovakia: 'SK', Slovenia: 'SI', Spain: 'ES', Sweden: 'SE', 'United Kingdom': 'GB', Norway: 'NO', Switzerland: 'CH', Iceland: 'IS' };
const TYPE = (f, t) => (f === 'Wind' ? (t === 'Offshore' ? 'windOff' : 'wind') : f === 'Solar' ? 'solar' : f === 'Hydro' ? (t === 'Pumped Storage' ? null : t === 'Reservoir' ? 'hydroRes' : 'hydroRor') : null);

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
    if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const km = (a, b) => {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

async function main() {
  const i = process.argv.indexOf('--csv');
  const text = i > 0 ? readFileSync(process.argv[i + 1], 'utf8') : await (await fetch(CSV_URL)).text();
  const sha256 = createHash('sha256').update(text).digest('hex');
  const [head, ...data] = parseCsv(text);
  const col = Object.fromEntries(head.map((h, j) => [h, j]));
  const plants = [];
  const deWind = [];
  for (const r of data) {
    const cc = CC[r[col.Country]]; const ty = TYPE(r[col.Fueltype], r[col.Technology]);
    if (!cc || !ty) continue;
    const lat = Number(r[col.lat]), lon = Number(r[col.lon]), mw = Number(r[col.Capacity]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !(mw > 0)) continue;
    const dateIn = r[col.DateIn] ? Math.round(Number(r[col.DateIn])) : null, dateOut = r[col.DateOut] ? Math.round(Number(r[col.DateOut])) : null;
    if ((dateIn && dateIn > BUILD_YEAR) || (dateOut && dateOut <= BUILD_YEAR)) continue;
    const p = { id: `ppm${r[col.id]}`, name: String(r[col.Name] || '').slice(0, 48), cc, ty, mw, lat, lon, dateIn };
    if (cc === 'DE' && ty === 'wind') deWind.push(p); else plants.push(p);
  }
  // Group German turbines into farms (single-link within FARM_KM), using a grid of cells of FARM_KM.
  const cell = (p) => `${Math.floor(p.lat / 0.018)}:${Math.floor(p.lon / 0.03)}`; // about 2 km cells
  const byCell = new Map();
  deWind.forEach((p, k) => { const c = cell(p); if (!byCell.has(c)) byCell.set(c, []); byCell.get(c).push(k); });
  const farm = new Int32Array(deWind.length).fill(-1);
  let nf = 0;
  for (let s = 0; s < deWind.length; s++) {
    if (farm[s] >= 0) continue;
    farm[s] = nf; const stack = [s];
    while (stack.length) {
      const k = stack.pop(); const p = deWind[k];
      const [a, b] = cell(p).split(':').map(Number);
      for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) for (const j of byCell.get(`${a + da}:${b + db}`) || []) {
        if (farm[j] < 0 && km(p, deWind[j]) <= FARM_KM) { farm[j] = nf; stack.push(j); }
      }
    }
    nf++;
  }
  const farms = Array.from({ length: nf }, () => ({ mw: 0, lat: 0, lon: 0, n: 0, dateIn: null, ids: [] }));
  deWind.forEach((p, k) => { const f = farms[farm[k]]; f.mw += p.mw; f.lat += p.lat * p.mw; f.lon += p.lon * p.mw; f.n++; f.dateIn = f.dateIn == null || (p.dateIn && p.dateIn < f.dateIn) ? p.dateIn : f.dateIn; if (f.ids.length < 1) f.ids.push(p.id); });
  for (const f of farms) plants.push({ id: `${f.ids[0]}f`, name: `Wind farm (${f.n} turbine${f.n === 1 ? '' : 's'}, grouped)`, cc: 'DE', ty: 'wind', mw: f.mw, lat: f.lat / f.mw, lon: f.lon / f.mw, dateIn: f.dateIn, turbines: f.n });
  const kept = plants.filter((p) => p.mw >= MIN_MW).sort((a, b) => a.cc.localeCompare(b.cc) || b.mw - a.mw);
  const rows = kept.map((p) => [p.id, p.name, p.cc, p.ty, Math.round(p.mw * 10) / 10, Math.round(p.lat * 1e4) / 1e4, Math.round(p.lon * 1e4) / 1e4, p.dateIn ?? null, p.turbines ?? null]);
  const meta = { source: 'powerplantmatching (PyPSA), powerplants.csv', licence: 'CC BY 4.0', credit: 'Power plant data: powerplantmatching, PyPSA (CC BY 4.0)', url: `https://github.com/PyPSA/powerplantmatching/blob/${REF}/powerplants.csv`, ref: REF, sha256, builtAt: new Date().toISOString().slice(0, 10), filter: `wind, solar and hydro (not pumped storage), ${MIN_MW} MW or more, in operation in ${BUILD_YEAR}, in the tool's countries; German wind turbines grouped into farms within ${FARM_KM} km`, minMW: MIN_MW, farmKm: FARM_KM, count: rows.length, germanTurbines: deWind.length, germanFarms: nf, columns: ['id', 'name', 'cc', 'type', 'mw', 'lat', 'lon', 'dateIn', 'turbines'], rows };
  writeFileSync(OUT, `// Generated by energy-strategy-tool/plant-data/build-renewables.mjs from ${meta.source} (${meta.licence}), ${meta.url}.\n// Do not edit by hand: rebuild at release (plant-data/README.md).\nexport const RENEWABLE_PLANTS = ${JSON.stringify(meta)};\n`);
  console.log(`${rows.length} renewable plants (${deWind.length} German turbines in ${nf} farms); ${(JSON.stringify(meta).length / 1024).toFixed(0)} KB`);
}
main();
