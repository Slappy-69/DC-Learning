// Site model (BRIEF §5.2, §10.1): boundary, setbacks (uniform with per-edge override), typed hard and
// soft exclusions, height limit with zones, POC, gas main, access points, noise receptors, roads/parking/
// landscaping allowance and off-site land. Derived: gross area, buildable envelope (polygon and raster),
// net developable area. Pure; built once per run (context) and once per site on the UI thread.
//
// Frames
//  - xy: local metres, x east, y north, about the origin (boundary centroid, or the project location for
//    the area + aspect rectangle). North-up; the plan draws in this frame.
//  - uv: the layout frame, xy rotated by −frameAngle so the site's minimum-area bounding rectangle is axis
//    aligned (long side along u). Blocks are axis-aligned rectangles in uv (§10.3 "rectangular blocks").
//
// Raster (§10.4 step 1): cells of `cell` metres in uv. A cell is in the buildable envelope only if the
// whole cell square is inside the boundary, at least the edge's setback from every boundary edge (exact
// per-edge erosion), and does not touch a hard exclusion. So every block placed on envelope cells lies
// inside the envelope with no tolerance. Soft exclusions, height limits and the distance to the boundary
// are kept per cell for the placement rules.

import {
  makeProjection, meanLatLon, validateRing, orientRing, edgeIndexAfterOrient, ringArea, rotateRing, rotatePoint,
  bbox, minAreaRect, offsetRingInward, regionDifference, regionArea, pointInRing, distPointSegment, distSegmentBox,
  distBoxRing, nearestPointOnRing,
} from './geometry.js';
import { EXCLUSION_TYPES } from './defaults.js';

const toNum = (x, d) => (Number.isFinite(Number(x)) && x !== null && x !== '' ? Number(x) : d);
const NEAR_M = 40; // exact box distance to the boundary is computed within this band (all boundary rules are below it)

export function siteKey(inputs) {
  const s = inputs.site, st = inputs.settings;
  return JSON.stringify([
    inputs.project.lat, inputs.project.lon, s.areaHa, s.aspect, s.boundary, s.setbackM, s.setbackByEdge, s.heightLimitM, s.heightZones,
    s.exclusions, s.softUsableBySolar, s.poc, s.gasMain, s.access, s.receptors, s.roadsFraction, s.offsiteLandHa, s.offsiteDistanceKm,
    st.layoutCellM, st.layoutCellLargeM, st.layoutLargeSiteHa,
  ]);
}

function bearingDeg(a, b) {
  const d = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
  return (d + 360) % 360;
}
function compass(deg) {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

export function buildSiteModel(inputs) {
  const s = inputs.site;
  const warnings = [];
  const warn = (code, message, extra = {}) => warnings.push({ code, message, ...extra });
  const lat = toNum(inputs.project.lat, 0), lon = toNum(inputs.project.lon, 0);

  // ---- 1. Boundary ----
  let origin = [lat, lon];
  let P = makeProjection(lat, lon);
  let ringUser = null; // xy in the user's vertex order
  let source = 'area';
  let errors = [];
  const pts = s.boundary && Array.isArray(s.boundary.points) ? s.boundary.points.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) : [];
  if (pts.length >= 3) {
    const o = meanLatLon(pts);
    const P2 = makeProjection(o[0], o[1]);
    const val = validateRing(pts.map(P2.toXY));
    if (val.ok) {
      origin = o; P = P2; ringUser = pts.map(P2.toXY); source = s.boundary.source || 'drawn';
      const far = Math.hypot(...P2.toXY([lat, lon]));
      if (far > 5000) warn('boundary-far', `The site boundary centroid is ${(far / 1000).toFixed(1)} km from the project location`);
    } else {
      errors = val.errors;
      warn('boundary-invalid', `Site boundary not used (${val.errors.join('; ')}); the area + aspect rectangle is used instead`);
    }
  } else if (s.boundary) {
    warn('boundary-invalid', 'Site boundary has fewer than 3 valid points; the area + aspect rectangle is used instead');
  }
  if (!ringUser) {
    const A = Math.max(1, toNum(s.areaHa, 1) * 10000);
    const asp = Math.max(1, toNum(s.aspect, 1.5));
    const a = Math.sqrt(A * asp), b = A / a;
    ringUser = [[-a / 2, -b / 2], [a / 2, -b / 2], [a / 2, b / 2], [-a / 2, b / 2]]; // SW, SE, NE, NW: edges S, E, N, W
  }
  const oriented = orientRing(ringUser);
  const ring = oriented.ring; // counter-clockwise xy
  const n = ring.length;
  const ll = ring.map((p) => P.toLatLon(p));
  const llUser = ringUser.map((p) => P.toLatLon(p));

  // ---- 2. Edges and setbacks (per-edge override in the user's edge order) ----
  const uniform = Math.max(0, toNum(s.setbackM, 10));
  const byEdge = Array.isArray(s.setbackByEdge) ? s.setbackByEdge : null;
  if (byEdge && byEdge.length !== n) warn('setback-edges-mismatch', `Per-edge setbacks list ${byEdge.length} edges; the boundary has ${n}. Missing edges use the uniform ${uniform} m`);
  const edges = [];
  const setbacks = new Array(n).fill(uniform); // indexed by counter-clockwise edge
  for (let k = 0; k < n; k++) {
    const a = ringUser[k], b = ringUser[(k + 1) % n];
    const ov = byEdge && byEdge[k] != null && Number.isFinite(Number(byEdge[k])) ? Math.max(0, Number(byEdge[k])) : null;
    const sb = ov ?? uniform;
    const ccw = edgeIndexAfterOrient(k, n, oriented.reversed);
    setbacks[ccw] = sb;
    const brg = bearingDeg(a, b);
    // Outward-facing side of the edge (for labels): the outward normal of a counter-clockwise ring is the right normal.
    const sideDeg = oriented.reversed ? (brg + 270) % 360 : (brg + 90) % 360;
    edges.push({ index: k, ccwIndex: ccw, from: a, to: b, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], length: Math.hypot(b[0] - a[0], b[1] - a[1]), bearingDeg: brg, side: compass(sideDeg), setbackM: sb, overridden: ov != null });
  }

  // ---- 3. Layout frame ----
  const mar = minAreaRect(ring);
  const frameAngle = Math.abs(mar.angle) < 1e-9 ? 0 : mar.angle;
  const toUV = (p) => rotatePoint(p, -frameAngle);
  const toXYfromUV = (p) => rotatePoint(p, frameAngle);
  const ringUV = rotateRing(ring, -frameAngle);

  // ---- 4. Exclusions and height zones ----
  const polyFromLL = (list, what, i) => {
    const q = Array.isArray(list) ? list.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) : [];
    const v = validateRing(q.map(P.toXY));
    const label = { exclusion: 'Exclusion', zone: 'Height zone', receptor: 'Receptor area' }[what] || what;
    if (!v.ok) { warn(`${what}-invalid`, `${label} ${i + 1} not used: ${v.errors.join('; ')}`, { index: i }); return null; }
    return { ll: q, xy: v.ring, uv: rotateRing(v.ring, -frameAngle), areaM2: v.area };
  };
  const exclusions = [];
  (Array.isArray(s.exclusions) ? s.exclusions : []).forEach((e, i) => {
    const g = polyFromLL(e && e.points, 'exclusion', i);
    if (!g) return;
    const type = EXCLUSION_TYPES[e.type] ? e.type : 'other';
    const hard = typeof e.hard === 'boolean' ? e.hard : EXCLUSION_TYPES[type].hard;
    exclusions.push({ id: e.id || `X${i + 1}`, name: e.name || `${EXCLUSION_TYPES[type].label} ${i + 1}`, type, typeLabel: EXCLUSION_TYPES[type].label, hard, hardDefault: typeof e.hard !== 'boolean', ...g });
  });
  const softUsable = s.softUsableBySolar !== false;
  const heightLimitM = toNum(s.heightLimitM, 25);
  const heightZones = [];
  (Array.isArray(s.heightZones) ? s.heightZones : []).forEach((z, i) => {
    const g = polyFromLL(z && z.points, 'zone', i);
    if (!g) return;
    heightZones.push({ id: z.id || `Z${i + 1}`, name: z.name || `Height zone ${i + 1}`, limitM: toNum(z.limitM, heightLimitM), ...g });
  });

  // ---- 5. Points ----
  const longest = edges.reduce((best, e) => (!best || e.length > best.length + 1e-9 ? e : best), null);
  const mkPoint = (llp, isDefault, name) => {
    const xy = P.toXY(llp);
    return { ll: llp, xy, uv: toUV(xy), isDefault, name };
  };
  const defaultAccessXY = longest.mid;
  const access = Array.isArray(s.access) && s.access.length
    ? s.access.filter((p) => Array.isArray(p) && Number.isFinite(p[0])).map((p, i) => mkPoint(p, false, `Access ${i + 1}`))
    : [mkPoint(P.toLatLon(defaultAccessXY), true, 'Access (default: mid-point of the longest edge)')];
  const poc = Array.isArray(s.poc) && Number.isFinite(s.poc[0]) ? mkPoint(s.poc, false, 'Grid POC') : mkPoint(access[0].ll, true, 'Grid POC (default: the access point)');
  const gasMain = Array.isArray(s.gasMain) && Number.isFinite(s.gasMain[0]) ? mkPoint(s.gasMain, false, 'Gas main') : null;
  const receptors = [];
  (Array.isArray(s.receptors) ? s.receptors : []).forEach((r, i) => {
    if (r && Array.isArray(r.point) && Number.isFinite(r.point[0])) receptors.push({ id: r.id || `R${i + 1}`, kind: 'point', ...mkPoint(r.point, false, r.name || `Receptor ${i + 1}`) });
    else if (r && Array.isArray(r.points)) {
      const g = polyFromLL(r.points, 'receptor', i);
      if (g) receptors.push({ id: r.id || `R${i + 1}`, kind: 'polygon', name: r.name || `Receptor ${i + 1}`, ...g });
    }
  });

  // ---- 6. Envelope polygon (drawn on the plan; reported area) ----
  const grossM2 = ringArea(ring);
  let envelope = null;
  let offsetM2 = null;
  const off = offsetRingInward(ring, setbacks);
  if (off.ok) {
    offsetM2 = ringArea(off.ring);
    let region = [{ outer: off.ring, holes: [] }];
    try {
      for (const e of exclusions) if (e.hard) region = regionDifference(region, e.xy);
      envelope = { ok: true, region, regionUV: region.map((p) => ({ outer: rotateRing(p.outer, -frameAngle), holes: p.holes.map((h) => rotateRing(h, -frameAngle)) })) };
    } catch (err) {
      warn('envelope-polygon-fallback', `Envelope polygon could not be cut by the exclusions (${err.message}); the raster envelope is used for areas`);
    }
  } else if (off.collapsed) {
    warn('envelope-empty', `The setbacks remove the whole site (${off.reason})`);
  } else {
    warn('envelope-polygon-fallback', `Envelope polygon not available (${off.reason}); the raster envelope is used for areas`);
  }

  // ---- 7. Raster in the layout frame ----
  const st = inputs.settings;
  const large = grossM2 > toNum(st.layoutLargeSiteHa, 50) * 10000;
  const cell = toNum(large ? st.layoutCellLargeM : st.layoutCellM, large ? 5 : 2);
  const bb = bbox(ringUV);
  const u0 = bb.x0, v0 = bb.y0;
  const nx = Math.max(1, Math.ceil((bb.x1 - bb.x0) / cell - 1e-9));
  const ny = Math.max(1, Math.ceil((bb.y1 - bb.y0) / cell - 1e-9));
  const N = nx * ny;
  const env = new Uint8Array(N);
  const soft = new Uint8Array(N);
  const hlim = new Float32Array(N).fill(heightLimitM);
  const dBound = new Float32Array(N); // distance from the cell square to the boundary (exact within NEAR_M)
  const half = cell / 2, halfDiag = cell * Math.SQRT1_2;
  const E = ringUV.map((a, k) => ({ a, b: ringUV[(k + 1) % n], sb: setbacks[k] }));
  const exUV = exclusions.map((e) => ({ hard: e.hard, ring: e.uv, bb: bbox(e.uv) }));
  const zUV = heightZones.map((z) => ({ limit: z.limitM, ring: z.uv, bb: bbox(z.uv) }));
  const touches = (box, poly) => box.x1 >= poly.bb.x0 && box.x0 <= poly.bb.x1 && box.y1 >= poly.bb.y0 && box.y0 <= poly.bb.y1
    && (pointInRing([(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2], poly.ring) || distBoxRing(box, poly.ring) === 0);
  let envCells = 0, softCells = 0;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const c = i + j * nx;
      const box = { x0: u0 + i * cell, y0: v0 + j * cell, x1: u0 + (i + 1) * cell, y1: v0 + (j + 1) * cell };
      const ctr = [box.x0 + half, box.y0 + half];
      if (!pointInRing(ctr, ringUV)) continue;
      let ok = true;
      let dmin = Infinity;
      for (const e of E) {
        const dc = distPointSegment(ctr, e.a, e.b);
        let d;
        if (dc - halfDiag >= Math.max(e.sb, NEAR_M)) d = dc - halfDiag; // lower bound, far from any threshold
        else d = distSegmentBox(e.a, e.b, box);
        if (d < e.sb - 1e-9) ok = false;
        if (d < dmin) dmin = d;
      }
      dBound[c] = dmin;
      if (!ok || dmin <= 0) continue; // the whole square must be inside (touching the boundary is outside)
      let blocked = false, isSoft = false;
      for (const x of exUV) {
        if (!touches(box, x)) continue;
        if (x.hard) { blocked = true; break; }
        isSoft = true;
      }
      if (blocked) continue;
      env[c] = 1;
      envCells++;
      if (isSoft) { soft[c] = 1; softCells++; }
      // Height limit: zones override the site limit (higher or lower). A cell takes the lowest limit of the
      // zones it touches, and the site limit too unless it lies wholly inside a zone (conservative at edges).
      if (zUV.length) {
        let lim = Infinity, wholly = false;
        for (const z of zUV) {
          if (!touches(box, z)) continue;
          if (z.limit < lim) lim = z.limit;
          if (!wholly && distBoxRing(box, z.ring) > 0) wholly = true; // centre inside and no edge in the cell
        }
        hlim[c] = Math.min(lim, wholly ? Infinity : heightLimitM);
      }
    }
  }
  const rasterEnvelopeM2 = envCells * cell * cell;
  const envelopeM2 = envelope ? regionArea(envelope.region) : rasterEnvelopeM2;
  const roadsFraction = Math.max(0, Math.min(0.95, toNum(s.roadsFraction, 0.15)));
  const allowanceM2 = roadsFraction * envelopeM2;
  const netM2 = envelopeM2 - allowanceM2;
  if (envCells === 0) warn('envelope-empty', 'No buildable cell: the setbacks and hard exclusions leave no buildable area');

  return {
    key: siteKey(inputs),
    origin, projection: { lat0: P.lat0, lon0: P.lon0, kx: P.kx, ky: P.ky },
    frameAngle,
    boundary: { source, fromArea: source === 'area', ll, llUser, xy: ring, xyUser: ringUser, uv: ringUV, reversed: oriented.reversed, errors },
    edges, setbacks, uniformSetbackM: uniform,
    envelope,
    exclusions, heightZones, heightLimitM, softUsableBySolar: softUsable,
    points: { poc, gasMain, access, receptors },
    areas: {
      grossM2, offsetM2, setbackM2: offsetM2 != null ? grossM2 - offsetM2 : null,
      hardExclusionM2: offsetM2 != null && envelope ? offsetM2 - envelopeM2 : null,
      envelopeM2, rasterEnvelopeM2, softM2: softCells * cell * cell, allowanceM2, netM2, roadsFraction,
    },
    grid: { cell, nx, ny, u0, v0, env, soft, hlim, dBound, envCells, large },
    offsite: { landHa: Math.max(0, toNum(s.offsiteLandHa, 0)), distanceKm: Math.max(0, toNum(s.offsiteDistanceKm, 2)) },
    warnings,
    toUV, toXYfromUV,
    toLatLon: (xy) => P.toLatLon(xy), toXY: (llp) => P.toXY(llp),
  };
}

// Plain summary (no typed arrays or functions) for logs and the transferable run.
export function siteSummary(m) {
  return {
    source: m.boundary.source, edges: m.edges.length, frameAngleDeg: Number(((m.frameAngle * 180) / Math.PI).toFixed(3)),
    grossM2: round1(m.areas.grossM2), envelopeM2: round1(m.areas.envelopeM2), rasterEnvelopeM2: round1(m.areas.rasterEnvelopeM2),
    allowanceM2: round1(m.areas.allowanceM2), netM2: round1(m.areas.netM2),
    exclusions: m.exclusions.length, hardExclusions: m.exclusions.filter((e) => e.hard).length, heightZones: m.heightZones.length,
    receptors: m.points.receptors.length, cellM: m.grid.cell, nx: m.grid.nx, ny: m.grid.ny, envCells: m.grid.envCells,
    warnings: m.warnings.map((w) => w.code),
  };
}
const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

// Nearest point of the boundary to a point (xy), with the edge index (counter-clockwise ring).
export function nearestBoundaryPoint(m, xy) { return nearestPointOnRing(xy, m.boundary.xy); }
