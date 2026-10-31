// Builds the bundled list of European gas plants (work package 19, owner 2026-10-31, OPEN-QUESTIONS 116–123).
// Release-time only: needs internet; the app never downloads anything (the Windows program stays offline).
//
//   node build-plants.mjs [--ref <commit or tag>] [--csv <local powerplants.csv>]
//
// Source: powerplantmatching (PyPSA), powerplants.csv, data licence CC BY 4.0 (code MIT). It merges GEM, ENTSO-E,
// OPSD, JRC, MaStR, WRI, OSM and other open lists into one record per plant. Kept: natural gas, 50 MW or more, in the
// tool's countries, with a position (OPEN-QUESTIONS 117). Written to ../app/src/data/gas-plants.js, which the app
// bundles in every version (OPEN-QUESTIONS 123). Each record keeps the values as the list gives them; the engine
// decides what to trust (engine/plants.js), and every value is shown with this source.

import fs from 'node:fs';
import crypto from 'node:crypto';

const REPO = 'https://github.com/PyPSA/powerplantmatching';
// Pinned so a release can be rebuilt exactly: v0.9.1, the commit that updated powerplants.csv on 2026-10-07.
const DEFAULT_REF = '2889ad9d1754a7ee4368b9282d7af835bf572ca2';
const MIN_MW = 50;
// powerplantmatching country names → the tool's ISO codes (defaults.js COUNTRIES).
const ISO = {
  Austria: 'AT', Belgium: 'BE', Bulgaria: 'BG', Croatia: 'HR', Cyprus: 'CY', Czechia: 'CZ', 'Czech Republic': 'CZ', Denmark: 'DK', Estonia: 'EE',
  Finland: 'FI', France: 'FR', Germany: 'DE', Greece: 'GR', Hungary: 'HU', Ireland: 'IE', Italy: 'IT', Latvia: 'LV', Lithuania: 'LT', Luxembourg: 'LU',
  Malta: 'MT', Netherlands: 'NL', Poland: 'PL', Portugal: 'PT', Romania: 'RO', Slovakia: 'SK', Slovenia: 'SI', Spain: 'ES', Sweden: 'SE',
  'United Kingdom': 'GB', Norway: 'NO', Switzerland: 'CH', Iceland: 'IS',
};
// powerplantmatching technology → the tool's existing-plant types (defaults.js EXISTING_TYPES).
const TYPE = { CCGT: 'ccgt', OCGT: 'ocgt', 'Combustion Engine': 'engines', 'Steam Turbine': 'steam' };

export function parseCsv(text) {
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

const num = (x) => (x === '' || x == null || !Number.isFinite(Number(x)) ? null : Number(x));
// The source lists a record came from ("{'GEM': {...}, 'ENTSOE': {...}}"), names only.
const sourcesOf = (pid) => [...String(pid || '').matchAll(/'([A-Z_]+)'\s*:/g)].map((m) => m[1]);

export function gasPlants(rows) {
  const out = [];
  for (const r of rows) {
    if (r.Fueltype !== 'Natural Gas') continue;
    const mw = num(r.Capacity), lat = num(r.lat), lon = num(r.lon), cc = ISO[r.Country];
    if (!(mw >= MIN_MW) || lat == null || lon == null || !cc) continue;
    out.push({
      id: `ppm${r.id}`, name: (r.Name || '').trim() || 'Unnamed plant', cc, tech: r.Technology || '', type: TYPE[r.Technology] || 'ccgt', set: r.Set || '',
      mw: Math.round(mw * 10) / 10, eff: num(r.Efficiency), dateIn: num(r.DateIn), dateRetrofit: num(r.DateRetrofit), dateOut: num(r.DateOut),
      lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5, eic: (String(r.EIC || '').match(/[0-9A-Z-]{16}/g) || []).slice(0, 3), sources: sourcesOf(r.projectID),
    });
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : 1));
}

async function main() {
  const a = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => { const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(' ')]; }));
  const ref = a.ref || DEFAULT_REF;
  const url = `https://raw.githubusercontent.com/PyPSA/powerplantmatching/${ref}/powerplants.csv`;
  let text;
  if (a.csv) text = fs.readFileSync(a.csv, 'utf8');
  else { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`); text = await r.text(); }
  const sha256 = crypto.createHash('sha256').update(text).digest('hex');
  const plants = gasPlants(parseCsv(text));
  const doc = {
    source: 'powerplantmatching (PyPSA), powerplants.csv', licence: 'CC BY 4.0', credit: 'Power plant data: powerplantmatching, PyPSA (CC BY 4.0)',
    url: `${REPO}/blob/${ref}/powerplants.csv`, ref, sha256, builtAt: new Date().toISOString().slice(0, 10),
    filter: `natural gas, ${MIN_MW} MW or more, in the tool's countries`, count: plants.length,
    // Compact rows; engine/plants.js names the columns.
    columns: ['id', 'name', 'cc', 'tech', 'type', 'set', 'mw', 'eff', 'dateIn', 'dateRetrofit', 'dateOut', 'lat', 'lon', 'eic', 'sources'],
    rows: plants.map((p) => [p.id, p.name, p.cc, p.tech, p.type, p.set, p.mw, p.eff == null ? null : Math.round(p.eff * 1000) / 1000, p.dateIn, p.dateRetrofit, p.dateOut, p.lat, p.lon, p.eic, p.sources]),
  };
  const dest = new URL('../app/src/data/gas-plants.js', import.meta.url);
  fs.writeFileSync(dest, `// Generated by energy-strategy-tool/plant-data/build-plants.mjs from ${doc.source} (${doc.licence}), ${doc.url}.\n// Do not edit by hand: rebuild at release (plant-data/README.md).\nexport const GAS_PLANTS = ${JSON.stringify(doc)};\n`);
  console.log(`${plants.length} gas plants of ${MIN_MW} MW or more → ${dest.pathname} (${fs.statSync(dest).size} bytes); source ${ref}, sha256 ${sha256.slice(0, 12)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
