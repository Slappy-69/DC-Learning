// Country from the map pin (work package 1; BRIEF §5.1): the built-in country whose Natural Earth outline contains
// the point (even-odd rule over its rings). Outside every built-in country: null, and the caller falls back to the
// nearest country reference point with a flag. Pure; the outlines are bundled (src/data/europe-map.js).
import { MAP_COUNTRIES } from '../data/europe-map.js';

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Bounding boxes, computed once.
let BOXES = null;
function boxes() {
  if (BOXES) return BOXES;
  BOXES = MAP_COUNTRIES.map((c) => {
    let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
    for (const r of c.rings) for (const [x, y] of r) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
    return { w, e, s, n };
  });
  return BOXES;
}

// { iso2, name } of the country containing the point (built-in or not), or null at sea / outside the map.
export function countryAtPoint(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const B = boxes();
  for (let k = 0; k < MAP_COUNTRIES.length; k++) {
    const b = B[k];
    if (lon < b.w || lon > b.e || lat < b.s || lat > b.n) continue;
    let inside = false;
    for (const r of MAP_COUNTRIES[k].rings) if (inRing(lon, lat, r)) inside = !inside;
    if (inside) return { iso2: MAP_COUNTRIES[k].iso2, name: MAP_COUNTRIES[k].name };
  }
  return null;
}

// Nearest built-in country outline to a point that no outline contains (a coastal pin that the simplified 1:50m
// outline leaves in the sea, Haiku check H3, finding H2): the closest ring edge, in km on a local flat projection,
// within maxKm. Returns { iso2, name, km } or null.
export function nearestOutline(lat, lon, maxKm = 25, builtInOnly = true, exclude = null) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180), ky = 110.57;
  const dDeg = maxKm / Math.min(kx, ky);
  const B = boxes();
  let best = null;
  for (let k = 0; k < MAP_COUNTRIES.length; k++) {
    const c = MAP_COUNTRIES[k];
    if (builtInOnly && !c.iso2) continue;
    if (exclude && (c.iso2 === exclude || c.name === exclude)) continue;
    const b = B[k];
    if (lon < b.w - dDeg || lon > b.e + dDeg || lat < b.s - dDeg || lat > b.n + dDeg) continue;
    for (const r of c.rings) {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const ax = (r[j][0] - lon) * kx, ay = (r[j][1] - lat) * ky, bx = (r[i][0] - lon) * kx, by = (r[i][1] - lat) * ky;
        const dx = bx - ax, dy = by - ay;
        const L = dx * dx + dy * dy;
        const t = L > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L)) : 0;
        const px = ax + t * dx, py = ay + t * dy;
        const d = Math.sqrt(px * px + py * py);
        if (d <= maxKm && (!best || d < best.km)) best = { iso2: c.iso2, name: c.name, km: d };
      }
    }
  }
  return best;
}
