// Geometry kernel for the site model and the auto-layout (BRIEF §4 "Geometry", §10).
// Pure functions, no dependencies, no browser APIs.
//
// Coordinates
//  - Storage and import/export: WGS84 latitude/longitude in degrees. The app stores [lat, lon] pairs;
//    GeoJSON and KML use [lon, lat] (converted at the parser boundary).
//  - Local planar metres: x east, y north, about an origin (the site centroid). Local equirectangular
//    projection on the WGS84 ellipsoid: x = N(φ0)·cos φ0·Δλ, y = M(φ0)·Δφ (M, N: meridional and
//    prime-vertical radii of curvature at the origin latitude). Over a campus (a few km) the scale error
//    against a transverse Mercator is below 0.01 %; the area of a 1 km lat/long rectangle is within
//    0.01 % of the ellipsoidal value (test 9a).
//  - Rings: arrays of [x, y] without a repeated closing point. Outer rings are counter-clockwise
//    (positive signed area) after orientRing(); holes are kept counter-clockwise too and subtracted.
//  - Region: array of { outer: ring, holes: [ring, …] } (polygons with holes): the buildable envelope.
//
// Polygon operations (BRIEF §4 names Turf.js or Clipper as examples): implemented here instead of
// adding a library, so the single-file build stays offline and small. Offsets use mitre joins at convex
// vertices and arcs at reflex vertices (exact erosion for equal setbacks on both edges); boolean
// operations use the Greiner–Hormann algorithm with deterministic perturbation for degenerate cases.

const D2R = Math.PI / 180;
const WGS84_A = 6378137;
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = WGS84_F * (2 - WGS84_F);

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------
export function localRadii(latDeg) {
  const s = Math.sin(latDeg * D2R);
  const w = 1 - WGS84_E2 * s * s;
  return { M: (WGS84_A * (1 - WGS84_E2)) / Math.pow(w, 1.5), N: WGS84_A / Math.sqrt(w) };
}

// Local equirectangular projection about (lat0, lon0). toXY([lat, lon]) -> [x, y] metres; toLatLon inverse.
export function makeProjection(lat0, lon0) {
  const { M, N } = localRadii(lat0);
  const kx = N * Math.cos(lat0 * D2R) * D2R; // metres per degree of longitude
  const ky = M * D2R; // metres per degree of latitude
  return {
    lat0, lon0, kx, ky,
    toXY: (ll) => [(ll[1] - lon0) * kx, (ll[0] - lat0) * ky],
    toLatLon: (xy) => [lat0 + xy[1] / ky, lon0 + xy[0] / kx],
  };
}

// Exact area (m²) of a latitude/longitude quadrangle on the WGS84 ellipsoid (authalic formula). Used by
// the tests as an independent reference for the projection.
export function ellipsoidQuadArea(lat1, lat2, lon1, lon2) {
  const e = Math.sqrt(WGS84_E2);
  const q = (phi) => {
    const s = Math.sin(phi * D2R);
    return s / (1 - WGS84_E2 * s * s) + (1 / (2 * e)) * Math.log((1 + e * s) / (1 - e * s));
  };
  const b2 = WGS84_A * WGS84_A * (1 - WGS84_E2);
  return Math.abs((b2 / 2) * (lon2 - lon1) * D2R * (q(lat2) - q(lat1)));
}

// Centroid of [lat, lon] points (simple mean, for choosing a projection origin).
export function meanLatLon(points) {
  let la = 0, lo = 0;
  for (const p of points) { la += p[0]; lo += p[1]; }
  return [la / points.length, lo / points.length];
}

// ---------------------------------------------------------------------------
// Rings: area, perimeter, orientation, centroid, cleaning, validity
// ---------------------------------------------------------------------------
export function signedArea(ring) {
  let s = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
export function ringArea(ring) { return Math.abs(signedArea(ring)); }

export function perimeter(ring) {
  let s = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return s;
}

export function ringCentroid(ring) {
  const A = signedArea(ring);
  if (Math.abs(A) < 1e-12) {
    let x = 0, y = 0;
    for (const p of ring) { x += p[0]; y += p[1]; }
    return [x / ring.length, y / ring.length];
  }
  let cx = 0, cy = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    const f = a[0] * b[1] - b[0] * a[1];
    cx += (a[0] + b[0]) * f;
    cy += (a[1] + b[1]) * f;
  }
  return [cx / (6 * A), cy / (6 * A)];
}

export function isCounterClockwise(ring) { return signedArea(ring) > 0; }

// Counter-clockwise copy. `reversed` tells callers to remap per-edge attributes (see edgeIndexAfterOrient).
export function orientRing(ring) {
  if (signedArea(ring) >= 0) return { ring: ring.slice(), reversed: false };
  return { ring: ring.slice().reverse(), reversed: true };
}
// Edge k of the original ring (vertex k -> k+1) is edge n-2-k (mod n) of the reversed ring.
export function edgeIndexAfterOrient(k, n, reversed) {
  return reversed ? (((n - 2 - k) % n) + n) % n : k;
}

// Drop non-finite points, a repeated closing point and consecutive duplicates (within eps metres).
export function cleanRing(ring, eps = 1e-6) {
  const out = [];
  for (const p of ring) {
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const q = out[out.length - 1];
    if (q && Math.abs(q[0] - p[0]) <= eps && Math.abs(q[1] - p[1]) <= eps) continue;
    out.push([p[0], p[1]]);
  }
  while (out.length > 1) {
    const a = out[0], b = out[out.length - 1];
    if (Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps) out.pop(); else break;
  }
  return out;
}

function orient2d(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function onSegment(a, b, p, eps) {
  return Math.min(a[0], b[0]) - eps <= p[0] && p[0] <= Math.max(a[0], b[0]) + eps
    && Math.min(a[1], b[1]) - eps <= p[1] && p[1] <= Math.max(a[1], b[1]) + eps;
}

// Do segments ab and cd intersect (including touching and collinear overlap)?
export function segmentsIntersect(a, b, c, d, eps = 1e-9) {
  const scale = Math.max(1, Math.abs(a[0]), Math.abs(a[1]), Math.abs(b[0]), Math.abs(b[1]), Math.abs(c[0]), Math.abs(c[1]), Math.abs(d[0]), Math.abs(d[1]));
  const e = eps * scale * scale;
  const d1 = orient2d(c, d, a), d2 = orient2d(c, d, b), d3 = orient2d(a, b, c), d4 = orient2d(a, b, d);
  if (((d1 > e && d2 < -e) || (d1 < -e && d2 > e)) && ((d3 > e && d4 < -e) || (d3 < -e && d4 > e))) return true;
  const es = eps * scale;
  if (Math.abs(d1) <= e && onSegment(c, d, a, es)) return true;
  if (Math.abs(d2) <= e && onSegment(c, d, b, es)) return true;
  if (Math.abs(d3) <= e && onSegment(a, b, c, es)) return true;
  if (Math.abs(d4) <= e && onSegment(a, b, d, es)) return true;
  return false;
}

// Validity of a ring: at least 3 distinct points, finite, non-zero area, no self-intersection.
// Returns { ok, errors, ring (cleaned, counter-clockwise), reversed, area }.
export function validateRing(raw, { minArea = 0.01 } = {}) {
  const errors = [];
  if (!Array.isArray(raw)) return { ok: false, errors: ['not a list of points'], ring: null, reversed: false, area: 0 };
  const ring = cleanRing(raw);
  if (ring.length < 3) return { ok: false, errors: [`needs at least 3 distinct points (has ${ring.length})`], ring: null, reversed: false, area: 0 };
  const n = ring.length;
  for (let i = 0; i < n && errors.length < 5; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      if (j === i || (j + 1) % n === i || j === (i + 1) % n) continue; // adjacent edges share a vertex
      const c = ring[j], d = ring[(j + 1) % n];
      if (segmentsIntersect(a, b, c, d)) { errors.push(`edges ${i + 1} and ${j + 1} cross or touch (self-intersection)`); break; }
    }
  }
  // Adjacent edges folding back on themselves (a zero-width spike) are a self-overlap too.
  for (let i = 0; i < n && errors.length < 5; i++) {
    const a = ring[(i - 1 + n) % n], b = ring[i], c = ring[(i + 1) % n];
    const cr = orient2d(a, b, c);
    const dot = (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
    if (Math.abs(cr) <= 1e-12 * Math.max(1, Math.abs(dot)) && dot < 0) errors.push(`vertex ${i + 1} folds back on its edge (zero-width spike)`);
  }
  const area = ringArea(ring);
  if (!(area > minArea)) errors.push(`area ${area.toExponential(2)} m² is too small`);
  const o = orientRing(ring);
  return { ok: errors.length === 0, errors, ring: o.ring, reversed: o.reversed, area };
}

// ---------------------------------------------------------------------------
// Point tests and distances
// ---------------------------------------------------------------------------
export function distPointSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  let t = L2 > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
export function distPointRing(p, ring) {
  let d = Infinity;
  const n = ring.length;
  for (let i = 0; i < n; i++) d = Math.min(d, distPointSegment(p, ring[i], ring[(i + 1) % n]));
  return d;
}
export function nearestPointOnRing(p, ring) {
  let best = null, bd = Infinity, edge = -1;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L2 = dx * dx + dy * dy;
    let t = L2 > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const q = [a[0] + t * dx, a[1] + t * dy];
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < bd) { bd = d; best = q; edge = i; }
  }
  return { point: best, dist: bd, edge };
}

// Even-odd point in ring. Points exactly on the boundary may go either way; use pointOnRing first
// where the boundary matters.
export function pointInRing(p, ring) {
  let inside = false;
  const n = ring.length;
  const x = p[0], y = p[1];
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function pointOnRing(p, ring, eps = 1e-7) { return distPointRing(p, ring) <= eps; }
// 1 inside, 0 on the boundary (within eps), -1 outside.
export function classifyPoint(p, ring, eps = 1e-7) {
  if (pointOnRing(p, ring, eps)) return 0;
  return pointInRing(p, ring) ? 1 : -1;
}
export function pointInRegion(p, region) {
  for (const piece of region) {
    if (!pointInRing(p, piece.outer)) continue;
    if (piece.holes.some((h) => pointInRing(p, h))) continue;
    return true;
  }
  return false;
}

// Distance from point p to an axis-aligned box {x0, y0, x1, y1} (0 inside).
export function distPointBox(p, b) {
  const dx = Math.max(b.x0 - p[0], 0, p[0] - b.x1);
  const dy = Math.max(b.y0 - p[1], 0, p[1] - b.y1);
  return Math.hypot(dx, dy);
}
// Does segment ab cross or touch box b (Liang–Barsky)?
export function segmentHitsBox(a, c, b) {
  let t0 = 0, t1 = 1;
  const dx = c[0] - a[0], dy = c[1] - a[1];
  const test = (p, q) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  return test(-dx, a[0] - b.x0) && test(dx, b.x1 - a[0]) && test(-dy, a[1] - b.y0) && test(dy, b.y1 - a[1]) && t0 <= t1;
}
// Minimum distance between segment ab and box b (0 if they touch).
export function distSegmentBox(a, c, b) {
  if (segmentHitsBox(a, c, b)) return 0;
  return Math.min(
    distPointBox(a, b), distPointBox(c, b),
    distPointSegment([b.x0, b.y0], a, c), distPointSegment([b.x1, b.y0], a, c),
    distPointSegment([b.x1, b.y1], a, c), distPointSegment([b.x0, b.y1], a, c),
  );
}
export function distBoxRing(b, ring) {
  let d = Infinity;
  const n = ring.length;
  for (let i = 0; i < n; i++) { d = Math.min(d, distSegmentBox(ring[i], ring[(i + 1) % n], b)); if (d === 0) return 0; }
  return d;
}

// Axis-aligned rectangles {x0, y0, x1, y1}: gap (0 when touching or overlapping) and overlap area.
export function rectGap(a, b) {
  const dx = Math.max(0, b.x0 - a.x1, a.x0 - b.x1);
  const dy = Math.max(0, b.y0 - a.y1, a.y0 - b.y1);
  return Math.hypot(dx, dy);
}
export function rectOverlapArea(a, b) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}
export function rectRing(r) { return [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]]; }

// ---------------------------------------------------------------------------
// Rotation, convex hull, minimum-area bounding rectangle
// ---------------------------------------------------------------------------
export function rotatePoint(p, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}
export function rotateRing(ring, angle) { return ring.map((p) => rotatePoint(p, angle)); }
export function bbox(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  return { x0, y0, x1, y1 };
}
export function convexHull(points) {
  const pts = points.map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const lower = [];
  for (const p of pts) { while (lower.length >= 2 && orient2d(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && orient2d(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}
// Minimum-area bounding rectangle (rotating calipers over hull edges). Returns the angle (radians) of
// its longer side from the x axis, normalised to (-π/2, π/2], and its width (long side) and height.
export function minAreaRect(points) {
  const hull = convexHull(points);
  let best = null;
  const n = hull.length;
  for (let i = 0; i < n; i++) {
    const a = hull[i], b = hull[(i + 1) % n];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const rot = hull.map((p) => rotatePoint(p, -ang));
    const bb = bbox(rot);
    const w = bb.x1 - bb.x0, h = bb.y1 - bb.y0;
    const area = w * h;
    if (!best || area < best.area - 1e-9 * Math.max(1, area)) best = { area, ang, w, h };
  }
  if (!best) return { angle: 0, width: 0, height: 0 };
  let angle = best.ang, width = best.w, height = best.h;
  if (height > width + 1e-9) { angle += Math.PI / 2; [width, height] = [height, width]; }
  while (angle <= -Math.PI / 2 + 1e-12) angle += Math.PI;
  while (angle > Math.PI / 2 + 1e-12) angle -= Math.PI;
  return { angle, width, height };
}

// ---------------------------------------------------------------------------
// Inward offset (setbacks) with a distance per edge
// ---------------------------------------------------------------------------
function offsetLineIntersect(e1, e2) {
  const cr = e1.ux * e2.uy - e1.uy * e2.ux;
  if (Math.abs(cr) < 1e-12) return null;
  const t = ((e2.px - e1.px) * e2.uy - (e2.py - e1.py) * e2.ux) / cr;
  return [e1.px + t * e1.ux, e1.py + t * e1.uy];
}

// Inward offset of a counter-clockwise ring by dists[i] on edge i (vertex i -> i+1), dists >= 0.
// Mitre joins at convex vertices (exact erosion); a circular arc at reflex vertices when both edges have
// the same setback (exact erosion), a mitre otherwise (slightly conservative). Edges whose offset
// segment collapses are removed and the neighbours re-intersected. Returns { ring, ok, collapsed, reason }.
// The raster in site.js does not depend on this polygon (it applies the per-edge distances exactly per
// cell); this polygon is drawn on the plan and gives the reported envelope area.
export function offsetRingInward(ring, dists, { arcSegments = 6 } = {}) {
  const n = ring.length;
  const E = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L;
    const nx = -uy, ny = ux; // left normal = inward for a counter-clockwise ring
    const d = Math.max(0, Number(dists[i]) || 0);
    E.push({ i, a, b, ux, uy, nx, ny, d, px: a[0] + nx * d, py: a[1] + ny * d });
  }
  let act = E.slice();
  for (let iter = 0; iter <= n; iter++) {
    const m = act.length;
    if (m < 3) return { ring: null, ok: false, collapsed: true, reason: 'setbacks remove the whole site' };
    const V = new Array(m);
    for (let k = 0; k < m; k++) {
      const p = act[(k - 1 + m) % m], c = act[k];
      V[k] = offsetLineIntersect(p, c) || [c.px, c.py];
    }
    let worst = -1, worstT = 0;
    for (let k = 0; k < m; k++) {
      const p = V[k], q = V[(k + 1) % m];
      const t = (q[0] - p[0]) * act[k].ux + (q[1] - p[1]) * act[k].uy;
      if (t < worstT - 1e-9) { worstT = t; worst = k; }
    }
    if (worst < 0) break;
    act.splice(worst, 1);
  }
  const m = act.length;
  if (m < 3) return { ring: null, ok: false, collapsed: true, reason: 'setbacks remove the whole site' };
  const out = [];
  for (let k = 0; k < m; k++) {
    const p = act[(k - 1 + m) % m], c = act[k];
    const adjacent = p.i === (c.i - 1 + n) % n;
    const cr = p.ux * c.uy - p.uy * c.ux;
    const dot = p.ux * c.ux + p.uy * c.uy;
    const v = c.a; // shared original vertex when adjacent
    if (Math.abs(cr) < 1e-12 && dot > 0) {
      // Collinear consecutive edges: a step if the setbacks differ.
      out.push([v[0] + p.nx * p.d, v[1] + p.ny * p.d]);
      if (Math.abs(p.d - c.d) > 1e-9) out.push([v[0] + c.nx * c.d, v[1] + c.ny * c.d]);
    } else if (adjacent && cr < 0 && Math.abs(p.d - c.d) < 1e-9 && c.d > 0) {
      // Reflex vertex, equal setbacks: arc of radius d around the vertex (points within d of the vertex excluded).
      const a0 = Math.atan2(p.ny, p.nx);
      let a1 = Math.atan2(c.ny, c.nx);
      while (a1 > a0) a1 -= 2 * Math.PI; // clockwise sweep
      while (a1 < a0 - 2 * Math.PI) a1 += 2 * Math.PI;
      for (let s = 0; s <= arcSegments; s++) {
        const a = a0 + ((a1 - a0) * s) / arcSegments;
        out.push([v[0] + c.d * Math.cos(a), v[1] + c.d * Math.sin(a)]);
      }
    } else {
      out.push(offsetLineIntersect(p, c) || [c.px, c.py]);
    }
  }
  const cleaned = cleanRing(out, 1e-9);
  if (cleaned.length < 3 || ringArea(cleaned) < 1e-6) return { ring: null, ok: false, collapsed: true, reason: 'setbacks remove the whole site' };
  const val = validateRing(cleaned, { minArea: 1e-6 });
  if (!val.ok || val.reversed) return { ring: null, ok: false, collapsed: false, reason: `offset polygon is not simple (${val.errors.join('; ') || 'orientation flipped'})` };
  return { ring: val.ring, ok: true, collapsed: false, reason: null };
}

// ---------------------------------------------------------------------------
// Sutherland–Hodgman: subject ring ∩ convex clip ring (both counter-clockwise). For concave subjects the
// result can contain zero-width bridges; its area is exact.
// ---------------------------------------------------------------------------
export function clipRingConvex(subject, clip) {
  let out = subject.slice();
  const m = clip.length;
  for (let i = 0; i < m && out.length; i++) {
    const a = clip[i], b = clip[(i + 1) % m];
    const inside = (p) => orient2d(a, b, p) >= -1e-12;
    const input = out;
    out = [];
    for (let k = 0; k < input.length; k++) {
      const P = input[k], Q = input[(k + 1) % input.length];
      const pin = inside(P), qin = inside(Q);
      if (pin) out.push(P);
      if (pin !== qin) {
        const d1 = orient2d(a, b, P), d2 = orient2d(a, b, Q);
        const t = d1 / (d1 - d2);
        out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
      }
    }
  }
  return out;
}
export function regionClipConvexArea(region, clip) {
  let a = 0;
  for (const piece of region) {
    a += ringArea(clipRingConvex(piece.outer, clip));
    for (const h of piece.holes) a -= ringArea(clipRingConvex(orientRing(h).ring, clip));
  }
  return a;
}

// ---------------------------------------------------------------------------
// Greiner–Hormann boolean operations on simple rings
// ---------------------------------------------------------------------------
class GHV {
  constructor(x, y) { this.x = x; this.y = y; this.next = null; this.prev = null; this.corr = null; this.alpha = 0; this.ix = false; this.entry = true; this.visited = false; }
}
function ghList(ring) {
  const verts = ring.map(([x, y]) => new GHV(x, y));
  const n = verts.length;
  for (let i = 0; i < n; i++) { verts[i].next = verts[(i + 1) % n]; verts[i].prev = verts[(i - 1 + n) % n]; }
  return verts;
}
function ghInsert(v, start, end) {
  let cur = start.next;
  while (cur !== end && cur.alpha < v.alpha) cur = cur.next;
  v.next = cur; v.prev = cur.prev; cur.prev.next = v; cur.prev = v;
}
function ghVisit(v) { v.visited = true; if (v.corr && !v.corr.visited) ghVisit(v.corr); }
function segIx(a, b, c, d) {
  const r0 = b.x - a.x, r1 = b.y - a.y, s0 = d.x - c.x, s1 = d.y - c.y;
  const den = r0 * s1 - r1 * s0;
  const scale = Math.max(Math.abs(r0), Math.abs(r1), Math.abs(s0), Math.abs(s1), 1e-12);
  if (Math.abs(den) <= 1e-14 * scale * scale) {
    // Parallel: degenerate if collinear and overlapping.
    const cr = (c.x - a.x) * r1 - (c.y - a.y) * r0;
    if (Math.abs(cr) <= 1e-12 * scale * scale) {
      const L2 = r0 * r0 + r1 * r1;
      const t0 = ((c.x - a.x) * r0 + (c.y - a.y) * r1) / L2, t1 = ((d.x - a.x) * r0 + (d.y - a.y) * r1) / L2;
      if (Math.max(t0, t1) >= -1e-9 && Math.min(t0, t1) <= 1 + 1e-9) return { degenerate: true };
    }
    return null;
  }
  const ta = ((c.x - a.x) * s1 - (c.y - a.y) * s0) / den;
  const tc = ((c.x - a.x) * r1 - (c.y - a.y) * r0) / den;
  const e = 1e-9;
  if (ta < -e || ta > 1 + e || tc < -e || tc > 1 + e) return null;
  if (ta < e || ta > 1 - e || tc < e || tc > 1 - e) return { degenerate: true };
  return { ta, tc, x: a.x + ta * r0, y: a.y + ta * r1 };
}
const GH_OPS = { intersection: [true, true], union: [false, false], difference: [false, true] };

function ghOnce(subject, clip, op) {
  const S = ghList(subject), C = ghList(clip);
  let count = 0;
  for (let i = 0; i < S.length; i++) {
    const s = S[i], s2 = S[(i + 1) % S.length];
    for (let j = 0; j < C.length; j++) {
      const c = C[j], c2 = C[(j + 1) % C.length];
      const r = segIx(s, s2, c, c2);
      if (!r) continue;
      if (r.degenerate) return { degenerate: true };
      const sv = new GHV(r.x, r.y), cv = new GHV(r.x, r.y);
      sv.alpha = r.ta; cv.alpha = r.tc; sv.ix = cv.ix = true; sv.corr = cv; cv.corr = sv;
      ghInsert(sv, s, s2); ghInsert(cv, c, c2);
      count++;
    }
  }
  const s0 = [S[0].x, S[0].y], c0 = [C[0].x, C[0].y];
  if (pointOnRing(s0, clip, 1e-9) || pointOnRing(c0, subject, 1e-9)) return { degenerate: true };
  const sInC = pointInRing(s0, clip);
  const cInS = pointInRing(c0, subject);
  if (count === 0) {
    let containment;
    if (sInC) containment = 'subjectInClip';
    else if (cInS) containment = 'clipInSubject';
    else containment = 'disjoint';
    return { rings: null, containment };
  }
  let [sF, cF] = GH_OPS[op];
  sF = sF !== sInC; cF = cF !== cInS;
  let v = S[0];
  do { if (v.ix) { v.entry = sF; sF = !sF; } v = v.next; } while (v !== S[0]);
  v = C[0];
  do { if (v.ix) { v.entry = cF; cF = !cF; } v = v.next; } while (v !== C[0]);
  const rings = [];
  const unprocessed = () => { let u = S[0]; do { if (u.ix && !u.visited) return u; u = u.next; } while (u !== S[0]); return null; };
  let guard = 0;
  for (let start = unprocessed(); start; start = unprocessed()) {
    let cur = start;
    const pts = [[cur.x, cur.y]];
    do {
      ghVisit(cur);
      if (cur.entry) { do { cur = cur.next; pts.push([cur.x, cur.y]); } while (!cur.ix); }
      else { do { cur = cur.prev; pts.push([cur.x, cur.y]); } while (!cur.ix); }
      cur = cur.corr;
      if (++guard > 1e6) return { degenerate: true };
    } while (!cur.visited);
    const cl = cleanRing(pts, 1e-9);
    if (cl.length >= 3 && ringArea(cl) > 1e-9) rings.push(orientRing(cl).ring);
  }
  return { rings, containment: 'crossing' };
}

// Greiner–Hormann with deterministic perturbation of the clip ring for degenerate cases (a vertex on an
// edge, collinear overlapping edges). The perturbation is below 1e-6 of the ring size per try.
export function ghClip(subject, clip, op) {
  const s = orientRing(cleanRing(subject)).ring;
  let c = orientRing(cleanRing(clip)).ring;
  const bb = bbox(s.concat(c));
  const size = Math.max(1, bb.x1 - bb.x0, bb.y1 - bb.y0);
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = ghOnce(s, c, op);
    if (!r.degenerate) return { ...r, perturbed: attempt };
    const k = size * 1e-9 * Math.pow(4, attempt);
    c = c.map((p, i) => [p[0] + k * (0.7071 + 0.13 * ((i * 7) % 5)), p[1] + k * (0.6123 + 0.11 * ((i * 3) % 7))]);
  }
  throw new Error('polygon clipping failed: degenerate input could not be resolved');
}

// Union of two rings: returns a list of outer rings (a union that encloses a hole keeps only the outer).
function unionRings(a, b) {
  const r = ghClip(a, b, 'union');
  if (r.rings) {
    // The largest ring is the outer boundary; smaller rings from a union are enclosed holes (dropped).
    const sorted = r.rings.slice().sort((x, y) => ringArea(y) - ringArea(x));
    return [sorted[0]];
  }
  if (r.containment === 'subjectInClip') return [orientRing(b).ring];
  if (r.containment === 'clipInSubject') return [orientRing(a).ring];
  return [orientRing(a).ring, orientRing(b).ring];
}
function ringsCross(a, b) {
  const r = ghClip(a, b, 'intersection');
  return r.containment === 'crossing' ? 'crossing' : r.containment;
}
// Add hole h to a list of holes, merging holes that overlap it.
function mergeHole(holes, h) {
  let cur = orientRing(h).ring;
  let rest = holes.slice();
  for (let changed = true; changed;) {
    changed = false;
    for (let i = 0; i < rest.length; i++) {
      const rel = ringsCross(rest[i], cur);
      if (rel === 'disjoint') continue;
      if (rel === 'clipInSubject') return holes; // the new hole lies inside an existing hole
      if (rel === 'subjectInClip') { rest.splice(i, 1); changed = true; break; }
      cur = unionRings(rest[i], cur)[0];
      rest.splice(i, 1);
      changed = true;
      break;
    }
  }
  return [...rest, cur];
}

// Region (polygons with holes) minus a simple ring. Returns a new region.
export function regionDifference(region, clip) {
  const C = orientRing(cleanRing(clip)).ring;
  const out = [];
  for (const piece of region) {
    const r = ghClip(piece.outer, C, 'difference');
    if (r.containment === 'subjectInClip') continue;
    if (r.containment === 'disjoint') { out.push(piece); continue; }
    if (r.containment === 'clipInSubject') {
      // The clip may still cut existing holes; holes are merged with it.
      out.push({ outer: piece.outer, holes: mergeHole(piece.holes, C) });
      continue;
    }
    for (const ring of r.rings) {
      let sub = [{ outer: ring, holes: [] }];
      for (const h of piece.holes) sub = regionDifference(sub, h);
      out.push(...sub);
    }
  }
  return out;
}
export function regionArea(region) {
  let a = 0;
  for (const p of region) { a += ringArea(p.outer); for (const h of p.holes) a -= ringArea(h); }
  return a;
}
export function ringIntersectionArea(a, b) {
  const r = ghClip(a, b, 'intersection');
  if (r.rings) return r.rings.reduce((s, x) => s + ringArea(x), 0);
  if (r.containment === 'subjectInClip') return ringArea(a);
  if (r.containment === 'clipInSubject') return ringArea(b);
  return 0;
}

// ---------------------------------------------------------------------------
// Rasters: integral image and rectangle sums (occupancy grids for the auto-layout)
// ---------------------------------------------------------------------------
// mask: Uint8Array of nx*ny (index i + j*nx), 1 = blocked. Returns Int32Array (nx+1)*(ny+1).
export function integralImage(mask, nx, ny, out = null) {
  const W = nx + 1;
  const S = out && out.length === W * (ny + 1) ? out : new Int32Array(W * (ny + 1));
  for (let i = 0; i < W; i++) S[i] = 0;
  for (let j = 0; j < ny; j++) {
    let rowSum = 0;
    const base = (j + 1) * W, prev = j * W, mrow = j * nx;
    S[base] = 0;
    for (let i = 0; i < nx; i++) {
      rowSum += mask[mrow + i];
      S[base + i + 1] = S[prev + i + 1] + rowSum;
    }
  }
  return S;
}
// Sum of mask over cells i in [i0, i1), j in [j0, j1).
export function rectSum(S, nx, i0, j0, i1, j1) {
  const W = nx + 1;
  return S[j1 * W + i1] - S[j0 * W + i1] - S[j1 * W + i0] + S[j0 * W + i0];
}

// ---------------------------------------------------------------------------
// Import and export: GeoJSON and KML (parse only; no network)
// ---------------------------------------------------------------------------
// Result: { polygons: [{ rings: [[[lat, lon], …], …], name, props }], points: [{ point: [lat, lon], name, props }], warnings }
// The first ring of a polygon is its outer boundary, the rest are holes. Closing duplicates are dropped.
function llFromLonLat(c, warnings, where) {
  const lon = Number(c[0]), lat = Number(c[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    warnings.push(`${where}: coordinate ${JSON.stringify(c)} is not WGS84 longitude/latitude (EPSG:4326)`);
    return null;
  }
  return [lat, lon];
}
function ringFromLonLat(coords, warnings, where) {
  const pts = [];
  for (const c of coords || []) { const p = llFromLonLat(c, warnings, where); if (p) pts.push(p); }
  if (pts.length > 1) {
    const a = pts[0], b = pts[pts.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) pts.pop();
  }
  return pts;
}

export function parseGeoJSON(input) {
  const warnings = [];
  let obj;
  try { obj = typeof input === 'string' ? JSON.parse(input) : input; } catch (e) { return { polygons: [], points: [], warnings: [`not valid JSON: ${e.message}`] }; }
  const polygons = [], points = [];
  const nameOf = (props) => (props && (props.name ?? props.Name ?? props.NAME ?? props.title)) ?? null;
  const visit = (g, props, where) => {
    if (!g || typeof g !== 'object') return;
    switch (g.type) {
      case 'Polygon': polygons.push({ rings: (g.coordinates || []).map((r) => ringFromLonLat(r, warnings, where)), name: nameOf(props), props: props || {} }); break;
      case 'MultiPolygon': (g.coordinates || []).forEach((p, k) => polygons.push({ rings: p.map((r) => ringFromLonLat(r, warnings, `${where} part ${k + 1}`)), name: nameOf(props), props: props || {} })); break;
      case 'Point': { const p = llFromLonLat(g.coordinates || [], warnings, where); if (p) points.push({ point: p, name: nameOf(props), props: props || {} }); break; }
      case 'MultiPoint': (g.coordinates || []).forEach((c) => { const p = llFromLonLat(c, warnings, where); if (p) points.push({ point: p, name: nameOf(props), props: props || {} }); }); break;
      case 'GeometryCollection': (g.geometries || []).forEach((x, k) => visit(x, props, `${where} geometry ${k + 1}`)); break;
      case 'LineString': case 'MultiLineString': warnings.push(`${where}: ${g.type} ignored (only polygons and points are used)`); break;
      default: warnings.push(`${where}: unsupported type ${g.type}`);
    }
  };
  if (obj && obj.type === 'FeatureCollection') (obj.features || []).forEach((f, k) => visit(f && f.geometry, f && f.properties, `feature ${k + 1}`));
  else if (obj && obj.type === 'Feature') visit(obj.geometry, obj.properties, 'feature');
  else visit(obj, {}, 'geometry');
  if (obj && obj.crs && obj.crs.properties && obj.crs.properties.name && !/4326|CRS84/i.test(obj.crs.properties.name)) {
    warnings.push(`crs "${obj.crs.properties.name}" declared; coordinates are read as WGS84 longitude/latitude`);
  }
  return { polygons, points, warnings };
}

function xmlText(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').trim();
}
function kmlCoords(s, warnings, where) {
  const pts = [];
  for (const tok of xmlText(s).split(/\s+/)) {
    if (!tok) continue;
    const c = tok.split(',');
    const p = llFromLonLat(c, warnings, where);
    if (p) pts.push(p);
  }
  if (pts.length > 1) { const a = pts[0], b = pts[pts.length - 1]; if (a[0] === b[0] && a[1] === b[1]) pts.pop(); }
  return pts;
}
export function parseKML(text) {
  const warnings = [];
  const polygons = [], points = [];
  if (typeof text !== 'string' || !/<kml\b|<Placemark\b|<Polygon\b|<Point\b/i.test(text)) return { polygons, points, warnings: ['not a KML document'] };
  const blocks = [];
  const pmRe = /<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let m;
  while ((m = pmRe.exec(text))) blocks.push(m[1]);
  if (!blocks.length) blocks.push(text);
  blocks.forEach((b, k) => {
    const nm = b.match(/<name\b[^>]*>([\s\S]*?)<\/name>/i);
    const name = nm ? xmlText(nm[1]) : null;
    const polyRe = /<Polygon\b[^>]*>([\s\S]*?)<\/Polygon>/gi;
    let p;
    while ((p = polyRe.exec(b))) {
      const outer = p[1].match(/<outerBoundaryIs\b[^>]*>[\s\S]*?<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/i);
      if (!outer) { warnings.push(`placemark ${k + 1}: polygon without an outer boundary`); continue; }
      const rings = [kmlCoords(outer[1], warnings, `placemark ${k + 1}`)];
      const innerRe = /<innerBoundaryIs\b[^>]*>[\s\S]*?<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/gi;
      let q;
      while ((q = innerRe.exec(p[1]))) rings.push(kmlCoords(q[1], warnings, `placemark ${k + 1} hole`));
      polygons.push({ rings, name, props: {} });
    }
    const ptRe = /<Point\b[^>]*>[\s\S]*?<coordinates\b[^>]*>([\s\S]*?)<\/coordinates>/gi;
    while ((p = ptRe.exec(b))) {
      const c = kmlCoords(p[1], warnings, `placemark ${k + 1}`);
      if (c.length) points.push({ point: c[0], name, props: {} });
    }
    if (/<LineString\b/i.test(b)) warnings.push(`placemark ${k + 1}: LineString ignored (only polygons and points are used)`);
  });
  return { polygons, points, warnings };
}
// Parse by content: GeoJSON if it parses as JSON, otherwise KML.
export function parseGeoFile(text, fileName = '') {
  const t = String(text || '').trim();
  if (/\.kml$/i.test(fileName) || t.startsWith('<')) return { format: 'KML', ...parseKML(t) };
  return { format: 'GeoJSON', ...parseGeoJSON(t) };
}

function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
const closeLonLat = (ring) => (ring.length ? [...ring, ring[0]] : ring).map(([lat, lon]) => [lon, lat]);
// Export polygons ([lat, lon] rings) and points to GeoJSON (WGS84, RFC 7946 [lon, lat]).
export function toGeoJSON({ polygons = [], points = [] }) {
  const features = [];
  for (const p of polygons) features.push({ type: 'Feature', properties: { ...(p.props || {}), ...(p.name != null ? { name: p.name } : {}) }, geometry: { type: 'Polygon', coordinates: p.rings.map(closeLonLat) } });
  for (const p of points) features.push({ type: 'Feature', properties: { ...(p.props || {}), ...(p.name != null ? { name: p.name } : {}) }, geometry: { type: 'Point', coordinates: [p.point[1], p.point[0]] } });
  return JSON.stringify({ type: 'FeatureCollection', features });
}
export function toKML({ polygons = [], points = [], name = 'Site' }) {
  const coords = (ring) => closeLonLat(ring).map(([lon, lat]) => `${lon},${lat}`).join(' ');
  const pm = [];
  for (const p of polygons) {
    const [outer, ...holes] = p.rings;
    pm.push(`<Placemark>${p.name != null ? `<name>${xmlEsc(p.name)}</name>` : ''}<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords(outer)}</coordinates></LinearRing></outerBoundaryIs>${holes.map((h) => `<innerBoundaryIs><LinearRing><coordinates>${coords(h)}</coordinates></LinearRing></innerBoundaryIs>`).join('')}</Polygon></Placemark>`);
  }
  for (const p of points) pm.push(`<Placemark>${p.name != null ? `<name>${xmlEsc(p.name)}</name>` : ''}<Point><coordinates>${p.point[1]},${p.point[0]}</coordinates></Point></Placemark>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xmlEsc(name)}</name>${pm.join('')}</Document></kml>\n`;
}
