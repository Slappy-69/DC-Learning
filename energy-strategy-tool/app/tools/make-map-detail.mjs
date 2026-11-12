// Prepares the detail layers of the offline map (owner, 2026-11-12: "improve the visual look of the map tool. I want
// to be able to see way more detail"). Run at each release, with the downloads in one folder:
//   node tools/make-map-detail.mjs <folder>
// The folder holds (names as published):
//   Natural Earth 1:10m vector data, public domain (naturalearthdata.com), from github.com/nvkelso/natural-earth-vector,
//   folder geojson/: ne_10m_admin_0_boundary_lines_land, ne_10m_admin_0_label_points, ne_10m_admin_1_states_provinces_lines,
//   ne_10m_lakes, ne_10m_lakes_europe, ne_10m_rivers_lake_centerlines, ne_10m_rivers_europe, ne_10m_urban_areas,
//   ne_10m_roads, ne_10m_railroads, ne_10m_populated_places_simple (each .geojson).
//   Towns: cities500.json from github.com/lmfmaier/cities-json (GeoNames, CC BY 4.0).
//   The grid: PyPSA-Eur's unofficial extract of the ENTSO-E grid map processed by GridKit (map extract of March 2022;
//   data files CC BY 4.0, github.com/PyPSA/pypsa-eur, folder data/entsoegridkit/): buses.csv, lines.csv, links.csv,
//   saved as gk-buses.csv, gk-lines.csv, gk-links.csv. Positions follow the ENTSO-E map, which favours a clear drawing
//   over exact positions: the map says so.
//   Country fills: Natural Earth 1:10m admin-0 countries as packaged by world-atlas 2.0.2 (ISC), from node_modules.
// Writes src/data/europe-detail.js. Lines and rings are simplified (Douglas-Peucker, about 100 to 300 m), clipped to the
// map window and stored as polyline strings (deltas of 0.001°, about 100 m). The program bundles the file and never
// fetches map data.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const topo = require('topojson-client');

const DIR = process.argv[2];
if (!DIR) { console.error('usage: node tools/make-map-detail.mjs <folder with the downloads>'); process.exit(1); }
const BOX = { w: -32, e: 46, s: 33, n: 72 };
const Q = 1000; // 0.001°
const gj = (name) => JSON.parse(readFileSync(path.join(DIR, `${name}.geojson`), 'utf8')).features;

// --- geometry helpers ---
const inBox = ([x, y], m = 0) => x >= BOX.w - m && x <= BOX.e + m && y >= BOX.s - m && y <= BOX.n + m;
function lines(geom) {
  if (!geom) return [];
  if (geom.type === 'LineString') return [geom.coordinates];
  if (geom.type === 'MultiLineString') return geom.coordinates;
  return [];
}
function polys(geom) {
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}
// A line cut into the runs that lie in the window (with one point either side, so lines run to the edge).
function clipLine(pts) {
  const out = []; let run = [];
  for (let i = 0; i < pts.length; i++) {
    const inside = inBox(pts[i], 0.5) || (i > 0 && inBox(pts[i - 1], 0.5)) || (i < pts.length - 1 && inBox(pts[i + 1], 0.5));
    if (inside) run.push(pts[i]);
    else if (run.length) { if (run.length > 1) out.push(run); run = []; }
  }
  if (run.length > 1) out.push(run);
  return out;
}
// Sutherland-Hodgman against the window (with a margin): a ring that crosses the edge is cut along it.
function clipRing(ring) {
  const M = 1;
  const edges = [
    (p) => p[0] >= BOX.w - M, (p) => p[0] <= BOX.e + M, (p) => p[1] >= BOX.s - M, (p) => p[1] <= BOX.n + M,
  ];
  const cut = [
    (a, b) => { const x = BOX.w - M; const t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const x = BOX.e + M; const t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const y = BOX.s - M; const t = (y - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y]; },
    (a, b) => { const y = BOX.n + M; const t = (y - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y]; },
  ];
  let out = ring;
  for (let k = 0; k < 4; k++) {
    const inp = out; out = [];
    if (!inp.length) break;
    for (let i = 0; i < inp.length; i++) {
      const a = inp[(i + inp.length - 1) % inp.length], b = inp[i];
      const ia = edges[k](a), ib = edges[k](b);
      if (ib) { if (!ia) out.push(cut[k](a, b)); out.push(b); } else if (ia) out.push(cut[k](a, b));
    }
  }
  return out;
}
// Douglas-Peucker (degrees, with longitude scaled by cos 50° so the tolerance is about even on the ground).
const KX = Math.cos((50 * Math.PI) / 180);
function simplify(pts, tol) {
  if (pts.length <= 2) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = 1; keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]]; const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = pts[a][0] * KX, ay = pts[a][1], bx = pts[b][0] * KX, by = pts[b][1];
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    let worst = -1, wi = -1;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i][0] * KX, py = pts[i][1];
      let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px, ey = ay + t * dy - py, d = ex * ex + ey * ey;
      if (d > worst) { worst = d; wi = i; }
    }
    if (worst > t2) { keep[wi] = 1; stack.push([a, wi], [wi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// Polyline encoding (the zigzag, 5-bit scheme of Google's encoded polylines) of [lon, lat] at 0.001°.
function encNum(v, out) {
  let s = v < 0 ? ~(v << 1) : v << 1;
  while (s >= 0x20) { out.push(String.fromCharCode((0x20 | (s & 0x1f)) + 63)); s >>= 5; }
  out.push(String.fromCharCode(s + 63));
}
function encode(pts) {
  const out = []; let px = 0, py = 0, n = 0;
  for (const [x, y] of pts) {
    const qx = Math.round(x * Q), qy = Math.round(y * Q);
    if (n && qx === px && qy === py) continue;
    encNum(qx - px, out); encNum(qy - py, out); px = qx; py = qy; n++;
  }
  return n >= 2 ? out.join('') : null;
}
const encLine = (pts, tol) => { const s = simplify(pts, tol); return s.length >= 2 ? encode(s) : null; };
const encRing = (pts, tol) => { const c = clipRing(pts); if (c.length < 4) return null; const s = simplify(c, tol); return s.length >= 4 ? encode(s) : null; };
const r1 = (x) => Math.round(x * 10) / 10;
const stats = {};
const count = (name, layer) => { stats[name] = { features: layer.length, kB: Math.round(JSON.stringify(layer).length / 1024) }; return layer; };

// --- 1. Country fills (world-atlas 10m) ---
const NUM = { '040': 'AT', '056': 'BE', '100': 'BG', '191': 'HR', '196': 'CY', '203': 'CZ', '208': 'DK', '233': 'EE', '246': 'FI', '250': 'FR', '276': 'DE', '300': 'GR', '348': 'HU', '372': 'IE', '380': 'IT', '428': 'LV', '440': 'LT', '442': 'LU', '470': 'MT', '528': 'NL', '578': 'NO', '616': 'PL', '620': 'PT', '642': 'RO', '703': 'SK', '705': 'SI', '724': 'ES', '752': 'SE', '756': 'CH', '826': 'GB', '191x': 'HR' };
const BYNAME = { Norway: 'NO', France: 'FR', 'United Kingdom': 'GB', Cyprus: 'CY', Czechia: 'CZ', 'Czech Rep.': 'CZ' };
const world = JSON.parse(readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'));
const land = [];
for (const f of topo.feature(world, world.objects.countries).features) {
  const rings = [];
  for (const poly of polys(f.geometry)) {
    for (const ring0 of poly) {
      const lons = ring0.map((q) => q[0]);
      if (Math.max(...lons) - Math.min(...lons) > 180) continue; // Chukotka, outside the map
      if (!ring0.some((p) => inBox(p, 1))) continue;
      const e = encRing(ring0, 0.0012);
      if (e) rings.push(e);
    }
  }
  if (!rings.length) continue;
  const name = (f.properties && f.properties.name) || String(f.id);
  land.push([NUM[String(f.id).padStart(3, '0')] || BYNAME[name] || '', name, ...rings]);
}
count('land', land);

// --- 2. Land borders, regions ---
const borders = [];
for (const f of gj('ne_10m_admin_0_boundary_lines_land')) for (const l of lines(f.geometry)) for (const run of clipLine(l)) { const e = encLine(run, 0.002); if (e) borders.push([e]); }
count('borders', borders);
const regions = [];
for (const f of gj('ne_10m_admin_1_states_provinces_lines')) {
  const z = Number(f.properties.MIN_ZOOM) || 0;
  for (const l of lines(f.geometry)) for (const run of clipLine(l)) { const e = encLine(run, 0.003); if (e) regions.push([r1(z), e]); }
}
count('regions', regions);

// --- 3. Water ---
const rivers = [];
for (const name of ['ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe']) {
  for (const f of gj(name)) {
    const p = f.properties; const z = Number(p.min_zoom) || 0;
    for (const l of lines(f.geometry)) for (const run of clipLine(l)) { const e = encLine(run, 0.002); if (e) rivers.push([r1(z), Number(p.scalerank) || 0, p.name_en || p.name || '', e]); }
  }
}
count('rivers', rivers);
const lakes = [];
for (const name of ['ne_10m_lakes', 'ne_10m_lakes_europe']) {
  for (const f of gj(name)) {
    const p = f.properties; const z = Number(p.min_zoom) || 0;
    for (const poly of polys(f.geometry)) {
      if (!poly[0].some((q) => inBox(q, 0.5))) continue;
      const rings = poly.map((r) => encRing(r, 0.002)).filter(Boolean);
      if (rings.length) lakes.push([r1(z), p.name_en || p.name || '', ...rings]);
    }
  }
}
count('lakes', lakes);

// --- 4. Built-up areas ---
const urban = [];
for (const f of gj('ne_10m_urban_areas')) {
  const z = Number(f.properties.min_zoom) || 0;
  for (const poly of polys(f.geometry)) {
    if (!poly[0].some((q) => inBox(q, 0.2))) continue;
    const e = encRing(poly[0], 0.002);
    if (e) urban.push([r1(z), e]);
  }
}
count('urban', urban);

// --- 5. Roads, railways ---
const roads = [];
for (const f of gj('ne_10m_roads')) {
  const p = f.properties;
  if (/ferry/i.test(p.type || '')) continue;
  const cls = p.expressway === 1 ? 0 : p.type === 'Major Highway' ? 1 : p.type === 'Secondary Highway' ? 2 : 3;
  const z = Number(p.min_zoom) || 0;
  const label = [p.label, p.name].filter((x) => x && String(x).trim()).map(String)[0] || '';
  for (const l of lines(f.geometry)) for (const run of clipLine(l)) { const e = encLine(run, 0.002); if (e) roads.push([cls, r1(z), label.slice(0, 12), e]); }
}
count('roads', roads);
const rail = [];
for (const f of gj('ne_10m_railroads')) {
  const z = Number(f.properties.scalerank) || 0;
  for (const l of lines(f.geometry)) for (const run of clipLine(l)) { const e = encLine(run, 0.002); if (e) rail.push([z, e]); }
}
count('rail', rail);

// --- 6. Towns and country names ---
// Towns: GeoNames (CC BY 4.0), places of 3,000 people or more, from cities500.json of github.com/lmfmaier/cities-json
// (dump of November 2025). Capitals from Natural Earth's populated places. Stored as columns: names joined by "|",
// populations in base 36, positions as one polyline string, capital flags as digits (2 national, 1 regional).
const ne = gj('ne_10m_populated_places_simple').map((f) => ({ p: f.properties, x: f.geometry.coordinates[0], y: f.geometry.coordinates[1] }));
const caps = ne.filter((c) => c.p.adm0cap || /admin-1 capital/i.test(c.p.featurecla || '')).map((c) => ({ name: String(c.p.name), nascii: String(c.p.nameascii || c.p.name), x: c.x, y: c.y, cap: c.p.adm0cap ? 2 : 1 }));
const near = (a, b) => Math.hypot((a.x - b.x) * Math.cos((a.y * Math.PI) / 180), a.y - b.y) * 111;
const towns = JSON.parse(readFileSync(path.join(DIR, 'cities500.json'), 'utf8'))
  .map((c) => ({ name: String(c.name).replace(/\|/g, '/'), pop: Math.round(Number(c.pop) || 0), x: Number(c.lon), y: Number(c.lat) }))
  .filter((c) => c.pop >= 3000 && inBox([c.x, c.y]))
  .sort((a, b) => b.pop - a.pop);
for (const t of towns) {
  const c = caps.find((k) => (k.name === t.name || k.nascii === t.name) && near(k, t) < 30);
  t.cap = c ? c.cap : 0;
}
const placesCols = { names: towns.map((t) => t.name).join('|'), pop: towns.map((t) => t.pop.toString(36)).join(','), cap: towns.map((t) => t.cap).join(''), pts: encode(towns.map((t) => [t.x, t.y])) };
const places = placesCols;
stats.places = { features: towns.length, kB: Math.round(JSON.stringify(placesCols).length / 1024) };
// Country names: the main label point of each country (scalerank 0); small states and the parts of the United Kingdom
// only from closer in.
const SMALL = new Set(['Vatican', 'San Marino', 'Monaco', 'Gibraltar', 'Liechtenstein', 'Andorra', 'Malta', 'Ceuta', 'Melilla', 'Golan Heights', 'Åland', 'Aland', 'Jersey', 'Guernsey', 'Isle of Man', 'Faroe Is.', 'Akrotiri', 'Dhekelia', 'N. Cyprus', 'Cyprus U.N. Buffer Zone', 'Baikonur', 'Abkhazia', 'South Ossetia', 'Kaliningrad', 'Luxembourg', 'Gaza', 'West Bank', 'Brussels', 'Flemish', 'Walloon', 'Vojvodina', 'Kosovo']);
const RENAME = { England: 'United Kingdom', 'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Czech Rep.': 'Czechia', 'Macedonia': 'North Macedonia', 'Rep. Srpska': 'Bosnia and Herzegovina' };
const UKPARTS = new Set(['Scotland', 'Wales', 'N. Ireland']);
const seen = new Set(); const countries = [];
for (const f of gj('ne_10m_admin_0_label_points')) {
  const p = f.properties; const [x, y] = f.geometry.coordinates;
  if (!inBox([x, y]) || Number(p.scalerank) !== 0) continue;
  const raw = p.sr_subunit || p.sr_br_name; if (!raw) continue;
  const name = RENAME[raw] || raw;
  if (seen.has(name)) continue; seen.add(name);
  const minz = UKPARTS.has(raw) ? 5 : SMALL.has(raw) ? 5.5 : 0;
  countries.push([name, minz, Math.round(x * Q), Math.round(y * Q)]);
}
count('countries', countries);

// --- 7. The grid (GridKit extract of the ENTSO-E map) ---
function csv(name) {
  const text = readFileSync(path.join(DIR, name), 'utf8');
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === "'") q = false; else cell += c; continue; }
    if (c === "'") q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const wkt = (s) => { const m = /LINESTRING\((.*)\)/.exec(s || ''); return m ? m[1].split(',').map((p) => p.trim().split(/\s+/).map(Number)) : []; };
const yes = (v) => v === 't' || v === 'True' || v === 'true';
const grid = [];
for (const r of csv('gk-lines.csv')) {
  const kv = Number(r.voltage) || 0;
  for (const run of clipLine(wkt(r.geometry))) { const e = encLine(run, 0.001); if (e) grid.push([kv, yes(r.under_construction) ? 1 : 0, 0, e]); }
}
for (const r of csv('gk-links.csv')) {
  for (const run of clipLine(wkt(r.geometry))) { const e = encLine(run, 0.001); if (e) grid.push([0, yes(r.under_construction) ? 1 : 0, 1, e]); }
}
count('grid', grid);
const st = new Map();
for (const b of csv('gk-buses.csv')) {
  if (!/substation|converter/i.test(b.symbol || '')) continue;
  const x = Number(b.x), y = Number(b.y);
  if (!inBox([x, y])) continue;
  const s = st.get(b.station_id) || { x: 0, y: 0, n: 0, kv: 0, uc: true, dc: false };
  s.x += x; s.y += y; s.n++; s.kv = Math.max(s.kv, Number(b.voltage) || 0); s.uc = s.uc && yes(b.under_construction); s.dc = s.dc || yes(b.dc) || /converter/i.test(b.symbol);
  st.set(b.station_id, s);
}
const subs = [...st.values()].map((s) => [s.kv, s.uc ? 1 : 0, s.dc ? 1 : 0, Math.round((s.x / s.n) * Q), Math.round((s.y / s.n) * Q)]);
count('subs', subs);

const SOURCES = [
  { layers: 'land, borders, regions, rivers, lakes, built-up areas, roads, railways, country names, capitals', name: 'Natural Earth 1:10m vector data, version 5.2', licence: 'public domain', url: 'https://www.naturalearthdata.com/', via: 'github.com/nvkelso/natural-earth-vector; country fills from world-atlas 2.0.2 (ISC)' },
  { layers: 'towns and cities (3,000 people or more)', name: 'GeoNames gazetteer, dump of November 2025, as published by cities-json', licence: 'CC BY 4.0', url: 'https://www.geonames.org/', via: 'github.com/lmfmaier/cities-json (cities500.json)' },
  { layers: 'power grid (lines of 132 kV and above, HVDC links, substations)', name: 'Unofficial extract of the ENTSO-E grid map (March 2022), processed by GridKit, as published by PyPSA-Eur', licence: 'CC BY 4.0 (PyPSA-Eur data files); not approved or endorsed by ENTSO-E', url: 'https://github.com/PyPSA/pypsa-eur/tree/master/data/entsoegridkit', via: 'positions follow the ENTSO-E map, which favours a clear drawing over exact positions; lines built since 2022 are missing' },
];
const DETAIL = { box: BOX, q: Q, land, borders, regions, rivers, lakes, urban, roads, rail, places, countries, grid, subs };
const body = `// Generated by tools/make-map-detail.mjs. Do not edit by hand. Lines and rings are polyline strings of [lon, lat]
// deltas at 0.001°; points are integers of 0.001°. Sources and licences in DETAIL_SOURCES.
export const DETAIL_SOURCES = ${JSON.stringify(SOURCES)};
export const DETAIL_ACCESSED = '2026-11-12';
export const DETAIL = ${JSON.stringify(DETAIL)};
`;
writeFileSync(new URL('../src/data/europe-detail.js', import.meta.url), body);
console.log(JSON.stringify(stats));
console.log(`europe-detail.js: ${(body.length / 1024 / 1024).toFixed(2)} MB`);
