// The detail layers of the offline map (owner, 2026-11-12: "improve the visual look of the map tool. I want to be able
// to see way more detail"). The data is bundled (src/data/europe-detail.js, made by tools/make-map-detail.mjs); this
// file decodes it once, then builds the SVG path strings for the area around the view, thinned to the screen's
// resolution. No network.
import { DETAIL } from '../data/europe-detail.js';

const Q = DETAIL.q;
const KX = Math.cos((50 * Math.PI) / 180);

// Polyline string → [lon, lat, lon, lat, …].
export function decodeLine(s) {
  const out = new Float32Array(s.length * 2); let n = 0;
  let i = 0, x = 0, y = 0;
  while (i < s.length) {
    let b, shift = 0, r = 0;
    do { b = s.charCodeAt(i++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    x += r & 1 ? ~(r >> 1) : r >> 1;
    shift = 0; r = 0;
    do { b = s.charCodeAt(i++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    y += r & 1 ? ~(r >> 1) : r >> 1;
    out[n++] = x / Q; out[n++] = y / Q;
  }
  return out.slice(0, n);
}

// Where each layer keeps its attributes and its geometry in the bundled rows.
const SPEC = {
  land: { from: 2, poly: true, attrs: (f) => ({ iso: f[0], name: f[1] }) },
  borders: { from: 0 },
  regions: { from: 1, attrs: (f) => ({ z: f[0] }) },
  rivers: { from: 3, attrs: (f) => ({ z: f[0], rank: f[1] }) },
  lakes: { from: 2, poly: true, attrs: (f) => ({ z: f[0] }) },
  urban: { from: 1, poly: true, attrs: (f) => ({ z: f[0] }) },
  roads: { from: 3, attrs: (f) => ({ cls: f[0], z: f[1] }) },
  rail: { from: 1, attrs: (f) => ({ z: f[0] }) },
  grid: { from: 3, attrs: (f) => ({ kv: f[0], uc: f[1], dc: f[2] }) },
};
const PREPARED = {};
export function layer(name) {
  if (PREPARED[name]) return PREPARED[name];
  const sp = SPEC[name];
  PREPARED[name] = DETAIL[name].map((row) => {
    const parts = row.slice(sp.from).map(decodeLine);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of parts) for (let i = 0; i < p.length; i += 2) { const x = p[i], y = p[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { ...(sp.attrs ? sp.attrs(row) : {}), parts, bbox: [x0, y0, x1, y1] };
  });
  return PREPARED[name];
}

// Towns (GeoNames, 3,000 people or more, largest first): { name, pop, cap, lon, lat }, decoded once.
let TOWNS = null;
export function places() {
  if (TOWNS) return TOWNS;
  const c = DETAIL.places; const names = c.names.split('|'), pops = c.pop.split(','), pts = decodeLine(c.pts);
  TOWNS = names.map((name, i) => ({ name, pop: parseInt(pops[i], 36), cap: Number(c.cap[i]) || 0, lon: pts[2 * i], lat: pts[2 * i + 1] }));
  return TOWNS;
}
// Country names [name, from zoom, lon, lat] and substations [kV, under construction, HVDC, lon, lat] (0.001°).
export const countryLabels = () => DETAIL.countries;
export const substations = () => DETAIL.subs;
export const pointLL = (row, i) => [row[i] / Q, row[i + 1] / Q];

const r3 = (v) => Math.round(v * 1000) / 1000;
// SVG path data for one feature's parts, in degrees (x = lon, y = −lat), dropping points closer than tol to the last
// one kept (tol in degrees of latitude; longitude scaled by cos 50°).
function pathOf(f, tol, close) {
  const t2 = tol * tol; let s = '';
  for (const p of f.parts) {
    const n = p.length / 2; if (n < 2) continue;
    let lx = p[0], ly = p[1], kept = 1;
    let d = `M${r3(lx)},${r3(-ly)}`;
    for (let i = 1; i < n; i++) {
      const x = p[2 * i], y = p[2 * i + 1];
      const dx = (x - lx) * KX, dy = y - ly;
      if (i < n - 1 && dx * dx + dy * dy < t2) continue;
      d += `L${r3(x)},${r3(-y)}`; lx = x; ly = y; kept++;
    }
    if (close && kept < 3) continue;
    s += close ? `${d}Z` : d;
  }
  return s;
}
const meets = (b, a) => !(b[2] < a[0] || b[0] > a[2] || b[3] < a[1] || b[1] > a[3]);

// Path strings of a layer, grouped by key(f), for the features that pass keep(f) and reach the area [w, s, e, n].
export function paths(name, area, tol, keep = () => true, key = () => '') {
  const sp = SPEC[name]; const out = new Map();
  for (const f of layer(name)) {
    if (!keep(f) || !meets(f.bbox, area)) continue;
    const d = pathOf(f, tol, !!sp.poly);
    if (!d) continue;
    const k = key(f);
    out.set(k, (out.get(k) || '') + d);
  }
  return out;
}
// One path per feature (country fills).
export function eachPath(name, area, tol, keep = () => true) {
  const sp = SPEC[name]; const out = [];
  for (const f of layer(name)) {
    if (!keep(f) || !meets(f.bbox, area)) continue;
    const d = pathOf(f, tol, !!sp.poly);
    if (d) out.push({ f, d });
  }
  return out;
}

// Great-circle distance in km.
export function km(lat1, lon1, lat2, lon2) {
  const R = 6371.0088, r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
// The nearest substation (any voltage, and 220 kV or more) and the nearest town to a point.
export function nearest(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  let sub = null, sub220 = null, town = null;
  for (const s of DETAIL.subs) {
    const [x, y] = pointLL(s, 3); const d = km(lat, lon, y, x);
    if (!sub || d < sub.km) sub = { kv: s[0], uc: s[1], dc: s[2], km: d, lat: y, lon: x };
    if (s[0] >= 220 && (!sub220 || d < sub220.km)) sub220 = { kv: s[0], uc: s[1], dc: s[2], km: d, lat: y, lon: x };
  }
  for (const p of places()) {
    const d = km(lat, lon, p.lat, p.lon);
    if (!town || d < town.km) town = { name: p.name, pop: p.pop, km: d };
  }
  return { sub, sub220, town };
}
// Voltage class of a grid line or substation, for its colour.
export const kvClass = (kv, dc) => (dc ? 'dc' : kv >= 380 ? 'v380' : kv >= 220 ? 'v220' : 'v132');
