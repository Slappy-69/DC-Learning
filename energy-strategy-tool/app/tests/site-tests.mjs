// Site slice tests (BRIEF §10), called from tests/run-tests.mjs with its `test` helper and shared runs.
// Geometry values are hand-checked: each expected number is derived in the comment next to it.
import assert from 'node:assert/strict';
import * as G from '../src/engine/geometry.js';
import { buildSiteModel } from '../src/engine/site.js';
import { normalizeInputs, referenceT1, referenceT2, referenceT4, getRegistry, LABEL, boundaryAreaHa } from '../src/engine/defaults.js';

const sq = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`);

// Local offsets in metres -> [lat, lon] about a point (for building test polygons).
export function llAt(lat0, lon0) {
  const P = G.makeProjection(lat0, lon0);
  return (x, y) => P.toLatLon([x, y]);
}

export async function geometryTests(test) {
  await test('9a. Geometry kernel: projection, areas, validity, point-in-polygon, offsets, differences, raster, import round-trips (hand-checked values)', () => {
    const out = [];
    // (1) Projection. 0.01° × 0.01° rectangle at 52.29–52.30° N, 1.54–1.53° W.
    // Hand check on a sphere (R = 6,371,008.8 m): A ≈ R²·Δλ·(sin φ2 − sin φ1)
    //   = 6371008.8² × 1.74533e-4 × (0.791281 − 0.791175) ≈ 7.56e5 m²; the ellipsoid is ~0.4 % larger here.
    const lat1 = 52.29, lat2 = 52.30, lon1 = -1.54, lon2 = -1.53;
    const P = G.makeProjection((lat1 + lat2) / 2, (lon1 + lon2) / 2);
    const ring = [[lat1, lon1], [lat1, lon2], [lat2, lon2], [lat2, lon1]].map(P.toXY);
    const a = G.ringArea(ring);
    const R = 6371008.8, D = Math.PI / 180;
    const sphere = R * R * (lon2 - lon1) * D * (Math.sin(lat2 * D) - Math.sin(lat1 * D));
    const ellipsoid = G.ellipsoidQuadArea(lat1, lat2, lon1, lon2);
    assert.ok(Math.abs(a - sphere) / sphere < 0.005, `projected area ${a} vs spherical hand check ${sphere}`);
    assert.ok(Math.abs(a - ellipsoid) / ellipsoid < 1e-4, `projected area ${a} vs ellipsoidal ${ellipsoid}`);
    const back = P.toLatLon(P.toXY([52.2951, -1.5333]));
    near(back[0], 52.2951, 1e-12, 'lat round trip'); near(back[1], -1.5333, 1e-12, 'lon round trip');
    out.push(`0.01°×0.01° at 52.3° N: ${a.toFixed(1)} m² (ellipsoid ${ellipsoid.toFixed(1)}, ${(((a - ellipsoid) / ellipsoid) * 100).toExponential(1)} %; sphere hand check ${sphere.toFixed(0)}, ${(((a - sphere) / sphere) * 100).toFixed(2)} %)`);

    // (2) Shoelace and perimeter: 300 × 200 = 60,000 m², perimeter 1,000 m; clockwise gives −60,000.
    const r = sq(0, 0, 300, 200);
    assert.equal(G.signedArea(r), 60000); assert.equal(G.perimeter(r), 1000);
    assert.equal(G.signedArea(r.slice().reverse()), -60000);
    assert.equal(G.orientRing(r.slice().reverse()).reversed, true);
    // Edge k of a reversed ring maps to n-2-k: for 4 edges, 0→2, 1→1, 2→0, 3→3.
    assert.deepEqual([0, 1, 2, 3].map((k) => G.edgeIndexAfterOrient(k, 4, true)), [2, 1, 0, 3]);

    // (3) Validity: a bow-tie self-intersects; two points are too few; a spike folds back; an L is valid.
    const L = [[0, 0], [200, 0], [200, 100], [100, 100], [100, 200], [0, 200]]; // area 200² − 100² = 30,000
    assert.ok(!G.validateRing([[0, 0], [10, 10], [10, 0], [0, 10]]).ok, 'bow-tie accepted');
    assert.ok(!G.validateRing([[0, 0], [10, 0]]).ok, 'two points accepted');
    assert.ok(!G.validateRing([[0, 0], [20, 0], [10, 0], [10, 10]]).ok, 'spike accepted');
    const vL = G.validateRing(L);
    assert.ok(vL.ok); assert.equal(vL.area, 30000);

    // (4) Point in polygon: (50, 50) inside the L; (150, 150) is in the notch (outside); (100, 150) is on an edge.
    assert.equal(G.pointInRing([50, 50], L), true);
    assert.equal(G.pointInRing([150, 150], L), false);
    assert.equal(G.classifyPoint([100, 150], L), 0);
    const holed = [{ outer: sq(0, 0, 100, 100), holes: [sq(40, 40, 60, 60)] }];
    assert.equal(G.pointInRegion([50, 50], holed), false); assert.equal(G.pointInRegion([20, 20], holed), true);

    // (5) Inward offsets. Rectangle 300 × 200, 10 m everywhere: 280 × 180 = 50,400 m².
    let o = G.offsetRingInward(r, [10, 10, 10, 10]);
    assert.ok(o.ok); near(G.ringArea(o.ring), 50400, 1e-6, 'uniform offset');
    // Per edge (S 10, E 20, N 30, W 40): x 40…280, y 10…170 → 240 × 160 = 38,400 m².
    o = G.offsetRingInward(r, [10, 20, 30, 40]);
    near(G.ringArea(o.ring), 38400, 1e-6, 'per-edge offset');
    assert.deepEqual(G.bbox(o.ring), { x0: 40, y0: 10, x1: 280, y1: 170 });
    // L-shape, 10 m: the two arms give 180×80 + 80×180 − 80×80 = 22,400 m²; at the reflex corner the exact
    // erosion adds the part of the 10 × 10 square outside the quarter disc: 100 − 25π = 21.46 m² → 22,421.46.
    o = G.offsetRingInward(L, Array(6).fill(10), { arcSegments: 64 });
    near(G.ringArea(o.ring), 22400 + 100 - 25 * Math.PI, 0.01, 'L-shape offset with reflex arc');
    // Mitre (unequal setbacks at the reflex corner, 10 and 10.000001 m) is conservative: about 22,400 m².
    const om = G.offsetRingInward(L, [10, 10, 10, 10.000001, 10, 10]);
    near(G.ringArea(om.ring), 22400, 0.01, 'L-shape mitre offset');
    // A 30 × 20 rectangle with 10 m setbacks has nothing left.
    o = G.offsetRingInward(sq(0, 0, 30, 20), [10, 10, 10, 10]);
    assert.equal(o.ok, false); assert.equal(o.collapsed, true);
    out.push('offsets 50,400 / 38,400 / L 22,421.46 (arc) and 22,400 (mitre) m²; 30×20 with 10 m collapses');

    // (6) Region difference (Greiner–Hormann). Square 100 × 100 = 10,000 m².
    const A = [{ outer: sq(0, 0, 100, 100), holes: [] }];
    const diff = (clips) => clips.reduce((reg, c) => G.regionDifference(reg, c), A);
    const cases = [
      ['inner 20×20 → hole', [sq(40, 40, 60, 60)], 9600, 1, 1],
      ['edge overlap 20×20 half outside', [sq(80, 40, 120, 60)], 9600, 1, 0],
      ['strip splits the square', [sq(40, -10, 60, 110)], 8000, 2, 0],
      ['corner overlap 10×10', [sq(90, 90, 110, 110)], 9900, 1, 0],
      ['disjoint', [sq(200, 200, 210, 210)], 10000, 1, 0],
      ['covering', [sq(-10, -10, 110, 110)], 0, 0, 0],
      // Overlapping inner holes 30×30 each, overlap 10×10: 10,000 − 900 − 900 + 100 = 8,300, one merged hole.
      ['two overlapping holes', [sq(20, 20, 50, 50), sq(40, 40, 70, 70)], 8300, 1, 1],
      // Hole 20×20 then a strip 10 wide through it: strip ∩ square 1,000, of which 200 already removed → 8,800.
      ['hole then a strip through it', [sq(40, 40, 60, 60), sq(45, -10, 55, 110)], 8800, 2, 0],
      // L-shaped hole: 60×20 + 20×40 = 2,000 → 8,000.
      ['L-shaped hole', [[[20, 20], [80, 20], [80, 40], [40, 40], [40, 80], [20, 80]]], 8000, 1, 1],
    ];
    for (const [label, clips, area, pieces, holes] of cases) {
      const res = diff(clips);
      near(G.regionArea(res), area, 1e-4, label);
      assert.equal(res.length, pieces, `${label}: pieces`);
      assert.equal(res.reduce((s, p) => s + p.holes.length, 0), holes, `${label}: holes`);
    }
    // Shared edge (degenerate): perturbed, area exact to 1e-4 m².
    near(G.regionArea(diff([sq(100, 0, 150, 100)])), 10000, 1e-4, 'shared edge');
    near(G.regionArea(diff([sq(0, 40, 20, 60)])), 9600, 1e-4, 'notch along an edge');
    // Concave subject: U (10,000 − 40×70 = 7,200) minus a bar y 50…60 → 7,200 − (100×10 − 40×10) = 6,600, 3 pieces.
    const U = [[0, 0], [100, 0], [100, 100], [70, 100], [70, 30], [30, 30], [30, 100], [0, 100]];
    const uRes = G.regionDifference([{ outer: U, holes: [] }], sq(-10, 50, 110, 60));
    near(G.regionArea(uRes), 6600, 1e-4, 'U minus bar'); assert.equal(uRes.length, 3);
    // Sutherland–Hodgman: U ∩ square 20…80 = 60×60 − 40×50 = 1,600.
    near(G.ringArea(G.clipRingConvex(U, sq(20, 20, 80, 80))), 1600, 1e-9, 'convex clip');
    out.push(`${cases.length + 3} difference cases exact (holes merged, splits, shared edges perturbed)`);

    // (7) Minimum-area rectangle of a rotated 300 × 200 rectangle: angle 0.5 rad, sides 300 and 200.
    const mr = G.minAreaRect(G.rotateRing(r, 0.5));
    near(mr.angle, 0.5, 1e-9, 'min-area rect angle'); near(mr.width, 300, 1e-6, 'width'); near(mr.height, 200, 1e-6, 'height');

    // (8) Integral image: 400 random rectangles on a seeded random mask match brute-force sums.
    let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const nx = 37, ny = 23, mask = new Uint8Array(nx * ny);
    for (let i = 0; i < mask.length; i++) mask[i] = rnd() < 0.3 ? 1 : 0;
    const S = G.integralImage(mask, nx, ny);
    for (let t = 0; t < 400; t++) {
      const i0 = Math.floor(rnd() * nx), i1 = i0 + 1 + Math.floor(rnd() * (nx - i0)), j0 = Math.floor(rnd() * ny), j1 = j0 + 1 + Math.floor(rnd() * (ny - j0));
      let brute = 0; for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) brute += mask[i + j * nx];
      assert.equal(G.rectSum(S, nx, i0, j0, i1, j1), brute);
    }

    // (9) Import round trips. GeoJSON: polygon with a hole and a point; KML the same; Google-Earth style KML
    // with CDATA names and altitudes; non-WGS84 coordinates warn.
    const fc = {
      polygons: [{ rings: [[[52.1, -1.2], [52.1, -1.19], [52.11, -1.19], [52.11, -1.2]], [[52.104, -1.196], [52.106, -1.196], [52.106, -1.194]]], name: 'Site' }],
      points: [{ point: [52.105, -1.195], name: 'POC' }],
    };
    const gj = G.parseGeoJSON(G.toGeoJSON(fc));
    assert.deepEqual(gj.polygons.map((p) => ({ rings: p.rings, name: p.name })), fc.polygons);
    assert.deepEqual(gj.points.map((p) => ({ point: p.point, name: p.name })), fc.points);
    const km = G.parseKML(G.toKML(fc));
    assert.deepEqual(km.polygons.map((p) => ({ rings: p.rings, name: p.name })), fc.polygons);
    assert.deepEqual(km.points.map((p) => ({ point: p.point, name: p.name })), fc.points);
    const ge = G.parseKML(`<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name><![CDATA[Plot A & B]]></name><Polygon><outerBoundaryIs><LinearRing><coordinates>
      -1.54,52.29,0 -1.53,52.29,0 -1.53,52.30,0 -1.54,52.30,0 -1.54,52.29,0
      </coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`);
    assert.equal(ge.polygons.length, 1); assert.equal(ge.polygons[0].name, 'Plot A & B'); assert.equal(ge.polygons[0].rings[0].length, 4);
    assert.deepEqual(ge.polygons[0].rings[0][1], [52.29, -1.53]);
    const bad = G.parseGeoJSON({ type: 'Point', coordinates: [530000, 180000] });
    assert.equal(bad.points.length, 0); assert.ok(bad.warnings.some((w) => /not WGS84/.test(w)));
    const multi = G.parseGeoFile(JSON.stringify({ type: 'Feature', properties: { name: 'M' }, geometry: { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]], [[[2, 2], [3, 2], [3, 3], [2, 2]]]] } }), 'x.geojson');
    assert.equal(multi.format, 'GeoJSON'); assert.equal(multi.polygons.length, 2);
    out.push('GeoJSON and KML round trips identical; CDATA/altitude KML parsed; projected coordinates rejected with a warning');
    return out.join('; ') + '.';
  });
}

export async function siteModelTests(test) {
  await test('9b. Site model: area + aspect rectangle, polygon boundary, per-edge setbacks, exclusions, height zones, points, raster, fixtures and records', () => {
    const out = [];
    const reg = getRegistry();
    // (1) T1 default rectangle: 15 ha at 1.5:1 → a = √(150,000 × 1.5) = 474.34 m, b = 316.23 m;
    // envelope (a − 20)(b − 20) = 454.34 × 296.23 = 134,588.6 m²; net = 0.85 × envelope = 114,400.3 m².
    const t1 = normalizeInputs(referenceT1({ analysisStart: '2027-01' }));
    const m1 = buildSiteModel(t1);
    const a = Math.sqrt(150000 * 1.5), b = 150000 / a;
    near(m1.areas.grossM2, 150000, 1e-6, 'T1 gross');
    near(m1.areas.envelopeM2, (a - 20) * (b - 20), 1e-6, 'T1 envelope');
    near(m1.areas.netM2, 0.85 * (a - 20) * (b - 20), 1e-6, 'T1 net');
    assert.equal(m1.grid.cell, reg['settings.layoutCellM'].value);
    // Conservative raster: every envelope cell square lies inside the offset polygon; the raster area is at
    // most the polygon area and loses at most one cell width along the perimeter.
    const g = m1.grid;
    let bad = 0;
    for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) {
      if (!g.env[i + j * g.nx]) continue;
      for (const c of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const p = [g.u0 + (i + c[0]) * g.cell, g.v0 + (j + c[1]) * g.cell];
        if (!G.pointInRing(p, m1.envelope.regionUV[0].outer) && G.distPointRing(p, m1.envelope.regionUV[0].outer) > 1e-6) bad++;
      }
    }
    assert.equal(bad, 0, `${bad} envelope cell corners outside the envelope polygon`);
    assert.ok(m1.areas.rasterEnvelopeM2 <= m1.areas.envelopeM2 + 1e-6);
    assert.ok(m1.areas.rasterEnvelopeM2 >= m1.areas.envelopeM2 - G.perimeter(m1.envelope.region[0].outer) * g.cell);
    out.push(`T1: gross 150,000, envelope ${m1.areas.envelopeM2.toFixed(1)} (raster ${m1.areas.rasterEnvelopeM2}), net ${m1.areas.netM2.toFixed(1)} m², ${g.nx}×${g.ny} cells of ${g.cell} m`);
    // Default access and POC: mid-point of the longest edge (the south edge, y = −b/2).
    near(m1.points.access[0].xy[1], -b / 2, 1e-6, 'default access on the south edge'); near(m1.points.access[0].xy[0], 0, 1e-6, 'access mid-point');
    assert.deepEqual(m1.points.poc.xy, m1.points.access[0].xy); assert.equal(m1.points.poc.isDefault, true);

    // (2) Per-edge override: south edge 30 m instead of 10 → envelope (a − 20)(b − 40).
    const t1b = normalizeInputs({ ...t1, site: { ...t1.site, setbackByEdge: [30, null, null, null] } });
    near(buildSiteModel(t1b).areas.envelopeM2, (a - 20) * (b - 40), 1e-6, 'per-edge setback');

    // (3) T2: 6 ha → 300 × 200 m; envelope 280 × 180 = 50,400 m²; cells align with the 2 m grid, so the raster equals it.
    const m2 = buildSiteModel(normalizeInputs(referenceT2({ analysisStart: '2027-01' })));
    near(m2.areas.envelopeM2, 50400, 1e-6, 'T2 envelope'); assert.equal(m2.areas.rasterEnvelopeM2, 50400);
    near(m2.areas.netM2, 42840, 1e-6, 'T2 net'); assert.equal(m2.heightLimitM, 15);

    // (4) Large site (60 ha > 50 ha) uses the 5 m cell.
    const big = normalizeInputs({ ...t1, site: { ...t1.site, areaHa: 60 } });
    assert.equal(buildSiteModel(big).grid.cell, reg['settings.layoutCellLargeM'].value);

    // (5) Polygon boundary (typed, metres about the project location) with a hard easement strip, a soft flood
    // zone and a 12 m height zone. Pentagon: 500 × 300 rectangle with its NE corner cut from (250, 50) to
    // (50, 150): 150,000 − ½ × 200 × 100 = 140,000 m².
    const at = llAt(t1.project.lat, t1.project.lon);
    const poly = { ...t1, site: { ...t1.site,
      boundary: { points: [at(-250, -150), at(250, -150), at(250, 50), at(50, 150), at(-250, 150)], source: 'typed' },
      exclusions: [{ type: 'easement', points: [at(-100, -200), at(-80, -200), at(-80, 200), at(-100, 200)] }, { type: 'flood', points: [at(100, -100), at(200, -100), at(200, 0), at(100, 0)] }],
      heightZones: [{ limitM: 12, points: [at(-250, 0), at(0, 0), at(0, 150), at(-250, 150)] }] } };
    const np = normalizeInputs(poly);
    assert.equal(np.site.areaFromBoundary, true);
    near(np.site.areaHa, 14, 0.002, 'polygon area sets site.areaHa (projection about the polygon centroid)');
    near(boundaryAreaHa(poly.site.boundary), np.site.areaHa, 1e-12, 'boundaryAreaHa');
    const mp = buildSiteModel(np);
    assert.equal(mp.boundary.source, 'typed'); assert.equal(mp.edges.length, 5);
    // The easement strip (20 m wide) crosses the whole envelope: the envelope splits into 2 pieces.
    assert.equal(mp.envelope.region.length, 2);
    // Envelope area = offset pentagon − strip ∩ offset pentagon (20 m × the pentagon's inner height at x = −100…−80, 280 m).
    near(mp.areas.offsetM2 - mp.areas.envelopeM2, 20 * 280, 0.5, 'hard exclusion area removed');
    assert.equal(mp.exclusions.find((e) => e.type === 'flood').hard, false, 'flood zone default should be soft');
    // Soft cells: the 100 × 100 zone plus the cells that touch its edges (conservative), at most (100 + 2 cells)².
    assert.ok(mp.areas.softM2 >= 100 * 100 && mp.areas.softM2 <= (100 + 2 * mp.grid.cell) ** 2, `soft area ${mp.areas.softM2}`);
    let low = 0; for (let c = 0; c < mp.grid.env.length; c++) if (mp.grid.env[c] && mp.grid.hlim[c] === 12) low++;
    assert.ok(low > 0, 'no cell under the 12 m height zone');
    out.push(`polygon site: ${np.site.areaHa.toFixed(3)} ha from the boundary, easement splits the envelope in 2 (−${(mp.areas.offsetM2 - mp.areas.envelopeM2).toFixed(1)} m²), flood zone soft (${mp.areas.softM2} m² soft cells), ${low} cells under the 12 m zone`);
    // An invalid boundary (bow-tie) falls back to the area + aspect rectangle with a warning.
    const bow = buildSiteModel(normalizeInputs({ ...t1, site: { ...t1.site, boundary: { points: [at(0, 0), at(100, 100), at(100, 0), at(0, 100)] } } }));
    assert.equal(bow.boundary.source, 'area'); assert.ok(bow.warnings.some((w) => w.code === 'boundary-invalid'));

    // (6) Fixtures (§21): T2 = T1 on 6 ha with a 15 m height limit; T4 = 5 MW IT, 1 ha, grid available now.
    const T2 = referenceT2({ analysisStart: '2027-01' }), T4 = referenceT4({ analysisStart: '2027-01' });
    assert.equal(T2.site.areaHa, 6); assert.equal(T2.site.heightLimitM, 15); assert.equal(T2.load.itMW, 100);
    assert.equal(T4.site.areaHa, 1); assert.equal(T4.load.itMW, 5); assert.equal(T4.grid.nowMW, T4.grid.fullMW); assert.equal(T4.grid.fullDate, T4.project.analysisStart);

    // (7) Every new site, spatial and layout default has a §18 record with the label and a basis.
    const recs = Object.values(reg).filter((x) => /^(site\.|spatial\.|settings\.layout|requirements\.(noise|landTake)|deliverability\.siteFit)/.test(x.path));
    assert.ok(recs.length >= 80, `only ${recs.length} site records`);
    assert.ok(recs.every((x) => x.label === LABEL && ['source', 'judgement', 'run setting'].includes(x.basis) && x.verified === false && x.confidence === 'C'));
    const byBasis = recs.reduce((acc, x) => ((acc[x.basis] = (acc[x.basis] || 0) + 1), acc), {});
    out.push(`${recs.length} site/spatial/layout records, all "${LABEL}" (${Object.entries(byBasis).map(([k, v]) => `${k} ${v}`).join(', ')})`);
    return out.join('; ') + '.';
  });
}

// ---------------------------------------------------------------------------
// S3 blocks and S4 layout
// ---------------------------------------------------------------------------
import { runModel, buildBlocks, blockSetKey, runLayout, layoutMany, separation, lightContext, layoutForOption, layoutFacts, siteFitOf, HOOKS, validateRunLog, STAGES, stripTimestamps } from '../src/engine/index.js';
import { TECH, SPATIAL } from '../src/engine/defaults.js';

// Every distinct layout of a run, recomputed from the options' sizing with the run's own inputs (the same
// path the UI uses), as one batch.
export function layoutsOfRun(run) {
  const site = buildSiteModel(run.inputs);
  const ctx = lightContext(run.inputs, site);
  const byKey = new Map();
  for (const o of run.options) {
    if (byKey.has(o.layoutKey)) { byKey.get(o.layoutKey).options.push(o); continue; }
    const bs = buildBlocks(ctx, o.v, o.sizing);
    byKey.set(o.layoutKey, { key: o.layoutKey, bs, options: [o] });
  }
  const entries = [...byKey.values()];
  const t0 = performance.now();
  const layouts = layoutMany(site, entries.map((e) => e.bs));
  const ms = performance.now() - t0;
  entries.forEach((e, i) => { e.layout = layouts[i]; });
  return { site, ctx, entries, ms, stats: layouts.stats };
}

// Exact geometric checks of one layout against the site model (the definitions, not the raster).
export function checkLayout(site, bs, L, label) {
  const blocks = bs.ground;
  const bnd = site.boundary.uv;
  const n = bnd.length;
  const hard = site.exclusions.filter((e) => e.hard).map((e) => e.uv);
  const soft = site.exclusions.filter((e) => !e.hard).map((e) => e.uv);
  const problems = [];
  const insideEnvelope = (r, what) => {
    const corners = [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]];
    if (!corners.every((p) => G.pointInRing(p, bnd))) problems.push(`${what}: corner outside the boundary`);
    for (let k = 0; k < n; k++) {
      const d = G.distSegmentBox(bnd[k], bnd[(k + 1) % n], r);
      if (d < site.setbacks[k] - 1e-6) problems.push(`${what}: ${d.toFixed(3)} m from boundary edge ${k} (setback ${site.setbacks[k]} m)`);
    }
    for (const h of hard) if (G.ringArea(G.clipRingConvex(G.orientRing(h).ring, G.rectRing(r))) > 1e-6) problems.push(`${what}: overlaps a hard exclusion`);
  };
  const rects = L.placed.map((p) => ({ ...p, b: blocks[p.index] }));
  for (const p of rects) insideEnvelope(p, p.b.name);
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const A = rects[i], B = rects[j];
    if (G.rectOverlapArea(A, B) > 1e-9) problems.push(`${A.b.name} overlaps ${B.b.name}`);
    const need = separation(A.b, B.b, false);
    const gap = G.rectGap(A, B);
    if (gap < need - 1e-6) {
      // Allowed only when the later block names the relaxation and the gap is at least the minimum.
      const later = A.index > B.index ? A : B, other = later === A ? B : A;
      const named = later.broken.find((x) => x.rule === 'separation' && x.with === other.index);
      const min = separation(A.b, B.b, true);
      if (!named) problems.push(`${A.b.name} – ${B.b.name}: gap ${gap.toFixed(2)} m < ${need} m and not reported as relaxed`);
      else if (gap < min - 1e-6) problems.push(`${A.b.name} – ${B.b.name}: gap ${gap.toFixed(2)} m below the minimum ${min} m`);
    }
  }
  // Boundary separations and height limits: met or named.
  const g = site.grid;
  for (const p of rects) {
    let minB = Infinity, minH = Infinity;
    for (let j = p.j0; j < p.j1; j++) for (let i = p.i0; i < p.i1; i++) { const k = i + j * g.nx; minB = Math.min(minB, g.dBound[k]); minH = Math.min(minH, g.hlim[k]); }
    if (p.b.boundaryM > 0 && minB < p.b.boundaryM - 1e-6 && !p.broken.some((x) => x.rule === 'boundary')) problems.push(`${p.b.name}: ${minB.toFixed(2)} m to the boundary < ${p.b.boundaryM} m, not reported`);
    const t = Math.max(p.b.heightM || 0, p.b.stackM || 0);
    if (t > minH + 1e-9 && !p.broken.some((x) => x.rule === 'height')) problems.push(`${p.b.name}: ${t} m above the ${minH} m limit, not reported`);
    // Hydrogen separation is never relaxed.
    if (p.b.type === 'hydrogen') for (const q of rects) if (q !== p && G.rectGap(p, q) < SPATIAL.hydrogen.p.clearanceM - 1e-6) problems.push(`hydrogen separation relaxed to ${G.rectGap(p, q).toFixed(2)} m`);
  }
  // Ground solar fill: inside the envelope, clear of every placed block by the solar clearance, soft
  // exclusions only where allowed.
  if (L.fill) {
    const c = L.cell;
    for (const [i0, j0, i1, j1] of L.fill.rects) {
      const r = { x0: g.u0 + i0 * c, y0: g.v0 + j0 * c, x1: g.u0 + i1 * c, y1: g.v0 + j1 * c };
      insideEnvelope(r, 'ground PV fill');
      for (const p of rects) if (G.rectGap(r, p) < Math.max(L.fill.clearanceM, p.b.clearanceM || 0) - 1e-6) problems.push(`ground PV fill within ${G.rectGap(r, p).toFixed(2)} m of ${p.b.name}`);
      if (!(bs.fill.softAllowed && site.softUsableBySolar)) for (const s of soft) if (G.ringArea(G.clipRingConvex(G.orientRing(s).ring, G.rectRing(r))) > 1e-6) problems.push('ground PV in a soft exclusion although not allowed');
    }
    const fillArea = L.fill.rects.reduce((a, [i0, j0, i1, j1]) => a + (i1 - i0) * (j1 - j0) * c * c, 0);
    if (Math.abs(fillArea - L.fill.areaM2) > 1e-6) problems.push(`fill rects ${fillArea} m² ≠ fill area ${L.fill.areaM2} m²`);
    if (L.placedM2 + L.fill.areaM2 > site.areas.netM2 + c * c) problems.push('fill takes the land take above the net developable area');
  }
  // Every block is placed or in the unplaced tray, once.
  const seen = new Set([...L.placed.map((p) => p.index), ...L.unplaced.map((u) => u.index)]);
  if (seen.size !== blocks.length || L.placed.length + L.unplaced.length !== blocks.length) problems.push(`blocks accounted ${seen.size}/${blocks.length}`);
  if (problems.length) throw new Error(`${label}: ${problems.slice(0, 6).join(' | ')}${problems.length > 6 ? ` (+${problems.length - 6} more)` : ''}`);
  return rects.length;
}

export async function blockTests(test, { runT1 }) {
  await test('9c. Blocks (§10.3): building massing from the §5.3 density rules, unit arrays, substation, fuel, rooftop blocks, off-site tray', () => {
    const out = [];
    const inputs = runT1.inputs;
    const site = buildSiteModel(inputs);
    const ctx = lightContext(inputs, site);
    const A1 = runT1.options.find((o) => o.archetype === 'A1'); // air cooling, diesel gensets, roof heat rejection
    const bs = buildBlocks(ctx, A1.v, A1.sizing);
    // Air: whitespace 100,000 kW ÷ 1.5 kW/m² = 66,667 m²; GFA × 2.2 = 146,667 m²; ÷ 2 storeys = 73,333 m²;
    // 4 phases of 25 MW → 4 halls of 18,333 m², 1.5 : 1 → 165.8 × 110.6 m; height 2 × 6 + 4 = 16 m.
    const halls = bs.ground.filter((b) => b.type === 'building');
    assert.equal(A1.v.C8, 'air');
    assert.equal(halls.length, 4);
    near(halls.reduce((a, b) => a + b.areaM2, 0), (100000 / 1.5) * 2.2 / 2, 1e-6, 'total hall footprint');
    for (const h of halls) { near(h.areaM2, 73333.333 / 4, 0.01, 'hall area'); near(h.w / h.h, 1.5, 1e-9, 'hall L:W'); assert.equal(h.heightM, 16); assert.equal(h.clearanceM, SPATIAL.building.p.clearanceM); }
    // Substation 110–150 kV AIS for 120 MW: 1.2 ha.
    const sub = bs.ground.find((b) => b.type === 'substation');
    near(sub.areaM2, 12000, 1e-6, 'substation AIS 1.2 ha'); assert.equal(sub.heightM, 12); assert.equal(sub.clearanceM, 10);
    // Gensets: every unit in an array of ≤ 12 in 2 rows; array area = cols × rows × 100 m².
    const gs = bs.ground.filter((b) => b.type === 'genset');
    assert.equal(gs.reduce((a, b) => a + b.units, 0), A1.sizing.backup.units);
    for (const a of gs) { assert.ok(a.units <= 12 && a.rows <= 2); near(a.areaM2, a.rows * a.cols * TECH.backupDiesel.p.m2PerUnit, 1e-6, 'genset array area'); assert.equal(a.stackM, TECH.backupDiesel.p.stackM); }
    // Fuel: m³ × 0.15 m²/m³.
    const fuel = bs.ground.find((b) => b.type === 'fuel');
    near(fuel.areaM2, A1.sizing.backup.fuelM3 * 0.15, 1e-6, 'fuel area');
    // Roof heat rejection (C9 roof) is a rooftop block, not a ground block: max(40 % of the roof, 60 m²/MW × MW rejected).
    const rp = bs.roof.find((x) => x.type === 'roofPlant');
    assert.equal(A1.v.C9, 'roof'); assert.ok(rp && !bs.ground.some((b) => b.type === 'heatRejection'));
    near(rp.areaM2, Math.max(0.4 * A1.sizing.building.footprintM2, A1.sizing.rejectedMW * 60), 1e-6, 'roof plant area');
    out.push(`A1 (air): 4 halls × ${Math.round(halls[0].areaM2).toLocaleString('en-GB')} m² at 16 m, AIS substation 12,000 m², ${gs.length} genset arrays (${A1.sizing.backup.units} units), fuel ${Math.round(fuel.areaM2)} m², roof plant ${Math.round(rp.areaM2).toLocaleString('en-GB')} m²`);
    // Double-deck halves the footprint per unit (two units per position) at 12 m; in-building adds the plant room to the halls.
    const dbl = buildBlocks(ctx, { ...A1.v, C18: 'double' }, A1.sizing);
    const dgs = dbl.ground.filter((b) => b.type === 'genset');
    assert.equal(dgs.reduce((a, b) => a + b.units, 0), A1.sizing.backup.units); assert.ok(dgs.every((b) => b.heightM === 12));
    // ceil(units ÷ 2) stacked positions in arrays of 2 rows: at most one empty slot per array.
    const pos = Math.ceil(A1.sizing.backup.units / 2), slots = dgs.reduce((a, b) => a + b.rows * b.cols, 0);
    assert.ok(slots >= pos && slots <= pos + dgs.length, `double-deck slots ${slots} for ${pos} positions`);
    const inb = buildBlocks(ctx, { ...A1.v, C18: 'inBuilding' }, A1.sizing);
    assert.equal(inb.ground.filter((b) => b.type === 'genset').length, 0);
    near(inb.ground.filter((b) => b.type === 'building').reduce((a, b) => a + b.areaM2, 0), 73333.333 + A1.sizing.backup.units * 100, 0.01, 'in-building plant room added to the halls');
    // GIS: 0.4 ha at 15 m.
    const gis = buildBlocks(ctx, { ...A1.v, C17: 'GIS' }, A1.sizing).ground.find((b) => b.type === 'substation');
    near(gis.areaM2, 4000, 1e-6, 'GIS 0.4 ha'); assert.equal(gis.heightM, 15);
    // BESS (A3, 4 h at 50 %): containers = ceil(MWh ÷ 4); arrays ≤ 12.
    const A3 = runT1.options.find((o) => o.archetype === 'A3');
    const b3 = buildBlocks(ctx, A3.v, A3.sizing);
    const bess = b3.ground.filter((b) => b.type === 'bess');
    assert.equal(bess.reduce((a, b) => a + b.units, 0), Math.ceil(A3.sizing.storage.mwh / 4 - 1e-9));
    assert.equal(b3.fill.mode, 'residual'); // C10 roof + fill residual ground
    assert.ok(b3.roof.some((x) => x.type === 'solarRoof'));
    // SMR (A10a) goes to the off-site tray: 1 ha per 100 MWe, no ground block.
    const A10a = runT1.options.find((o) => o.archetype === 'A10a');
    const b10 = buildBlocks(ctx, A10a.v, A10a.sizing);
    assert.ok(!b10.ground.some((b) => b.type === 'smr'));
    const smr = b10.offsite.find((x) => x.type === 'smr');
    near(smr.landHa, A10a.sizing.prime.mw / 100, 1e-9, 'SMR off-site land'); assert.equal(smr.distanceKm, inputs.site.offsiteDistanceKm);
    // T4 (8 MW, 11–33 kV): 500 m² per 20 MVA → 500 × 8 / 0.9 / 20 = 222.2 m².
    out.push(`double-deck ${dgs.length} arrays at 12 m; in-building adds ${A1.sizing.backup.units * 100} m² to the halls; GIS 4,000 m²; A3 BESS ${bess.length} arrays (${Math.ceil(A3.sizing.storage.mwh / 4)} containers); A10a SMR off-site ${smr.landHa.toFixed(2)} ha`);
    // Every block has a footprint, height, clearance ring and type (§10.3); the priority order is non-decreasing.
    for (const o of runT1.options.slice(0, 200)) {
      const s = buildBlocks(ctx, o.v, o.sizing);
      for (const b of s.ground) assert.ok(b.w > 0 && b.h > 0 && b.areaM2 > 0 && b.heightM > 0 && b.clearanceM >= 0 && b.type && b.source && b.priority >= 1, `${b.name} incomplete`);
      for (let i = 1; i < s.ground.length; i++) assert.ok(s.ground[i].priority >= s.ground[i - 1].priority, 'blocks not in priority order');
    }
    return out.join('; ') + '.';
  });
}

// T1 with site constraints, so that exclusions, a height zone, a receptor and a gas main are exercised:
// a hard easement strip across the site, a soft flood zone, a 12 m height zone, a receptor 60 m east of the
// boundary and a gas main on the north edge.
export function constrainedT1(start) {
  const inp = referenceT1({ analysisStart: start });
  const at = llAt(inp.project.lat, inp.project.lon);
  const a = Math.sqrt(150000 * 1.5) / 2, b = 150000 / (2 * a);
  inp.project.name = 'T1 + site constraints (test)';
  inp.site.exclusions = [
    { type: 'easement', points: [at(-60, -b - 20), at(-45, -b - 20), at(-45, b + 20), at(-60, b + 20)] },
    { type: 'flood', points: [at(a - 120, -b + 15), at(a - 15, -b + 15), at(a - 15, -b + 90), at(a - 120, -b + 90)] },
  ];
  inp.site.heightZones = [{ name: 'Aviation zone', limitM: 12, points: [at(-a - 10, 0), at(-100, 0), at(-100, b + 10), at(-a - 10, b + 10)] }];
  inp.site.receptors = [{ name: 'Dwelling east', point: at(a + 60, 0) }];
  inp.site.gasMain = at(0, b);
  inp.settings.generationCap = 400;
  return inp;
}

export async function layoutTests(test, ctxRuns) {
  const { runT1, START } = ctxRuns;
  const runT2 = ctxRuns.runT2 || (ctxRuns.runT2 = runModel(referenceT2({ analysisStart: START })));
  const runT4 = ctxRuns.runT4 || (ctxRuns.runT4 = runModel(referenceT4({ analysisStart: START })));
  const runTC = ctxRuns.runTC || (ctxRuns.runTC = runModel(constrainedT1(START)));
  await test('9d. Layout invariants on T1, T2, T4 and T1 with constraints: no overlaps, inside the envelope and outside hard exclusions, separations met or named, unplaced → "Does not fit" with a shortfall, deterministic', () => {
    const out = [];
    for (const [label, run] of [['T1', runT1], ['T2', runT2], ['T4', runT4], ['T1 + constraints', runTC]]) {
      const L = layoutsOfRun(run);
      let placed = 0, relaxedPairs = 0, unplaced = 0;
      const step = Math.max(1, Math.floor(L.entries.length / 40));
      let recomputed = 0;
      for (const [ei, e] of L.entries.entries()) {
        placed += checkLayout(L.site, e.bs, e.layout, `${label} ${e.options[0].id}`);
        relaxedPairs += e.layout.placed.reduce((a, p) => a + p.broken.length, 0);
        unplaced += e.layout.unplaced.length;
        // Status and shortfall follow the tray, for every option sharing the layout; the run's site fit
        // equals the recomputed one (the UI path, HOOKS.layout).
        for (const o of e.options) {
          const sf = o.siteFit;
          if (e.layout.unplaced.length || (e.layout.fill && e.layout.fill.shortfallM2 > 0)) {
            assert.equal(sf.status, 'Does not fit', `${label} ${o.id}: unplaced blocks but status ${sf.status}`);
            assert.ok(sf.unplacedM2 > 0, `${label} ${o.id}: no shortfall in m²`);
            const fl = o.flags.find((x) => x.id === 'site-does-not-fit');
            assert.ok(fl && /m²/.test(fl.message) && sf.unplaced.every((u) => fl.message.includes(u.name)), `${label} ${o.id}: "Does not fit" flag does not name the blocks and the shortfall`);
          } else assert.notEqual(sf.status, 'Does not fit', `${label} ${o.id}: "Does not fit" without an unplaced block`);
          if (e.layout.placed.some((p) => p.broken.length) && sf.status === 'Fits') throw new Error(`${label} ${o.id}: relaxed rules but "Fits"`);
        }
        // The UI path (HOOKS.layout, one option alone) gives the run's site fit: every archetype and a sample.
        if (ei % step === 0 || e.options.some((o) => o.archetype)) {
          const o = e.options.find((x) => x.archetype) || e.options[0];
          const re = HOOKS.layout(L.site, run.inputs, o);
          assert.equal(re.siteFit.status, o.siteFit.status, `${label}: recomputed status differs`);
          assert.equal(re.siteFit.landTakeM2, o.siteFit.landTakeM2, `${label}: recomputed land take differs`);
          assert.deepEqual(re.siteFit.unplaced.map((u) => u.name), o.siteFit.unplaced.map((u) => u.name));
          recomputed++;
        }
      }
      out.push(`${label}: ${L.entries.length} distinct layouts (${run.options.length} options), ${placed.toLocaleString('en-GB')} placed blocks checked, ${relaxedPairs} relaxed rules named, ${unplaced} unplaced blocks, batch ${L.ms.toFixed(0)} ms; ${recomputed} options recomputed alone through HOOKS.layout match the run`);
    }
    // Determinism and batch = single runs: the same inputs give the same layout, in a batch or alone.
    const L1 = layoutsOfRun(runTC), L2 = layoutsOfRun(runTC);
    assert.equal(JSON.stringify(L1.entries.map((e) => e.layout)), JSON.stringify(L2.entries.map((e) => e.layout)), 'two batches differ');
    let compared = 0;
    for (let i = 0; i < L1.entries.length; i += Math.max(1, Math.floor(L1.entries.length / 30))) {
      assert.equal(JSON.stringify(runLayout(L1.site, L1.entries[i].bs)), JSON.stringify(L1.entries[i].layout), 'single run differs from the batch');
      compared++;
    }
    const a = runModel(constrainedT1(START));
    assert.deepEqual(a.options.map((o) => [o.id, o.siteFit.status, o.siteFit.landTakeM2, o.sizing.solarGroundMWp]), runTC.options.map((o) => [o.id, o.siteFit.status, o.siteFit.landTakeM2, o.sizing.solarGroundMWp]), 'two runs give different site fit');
    out.push(`T1 + constraints: two batches identical; ${compared} single-set layouts equal the batch; two full runs give identical site fit and solar fill`);
    // The constrained variant really exercises the constraints.
    const tcSite = buildSiteModel(runTC.inputs);
    assert.ok(tcSite.exclusions.some((e) => e.hard) && tcSite.exclusions.some((e) => !e.hard) && tcSite.heightZones.length && tcSite.points.receptors.length && tcSite.points.gasMain);
    return out.join('; ') + '.';
  });

  await test('9h. Run log: the "layout" stage has start, progress and end with counts and cache hits/misses; sequence numbers contiguous; content deterministic', () => {
    const out = [];
    for (const [label, run] of [['T1', runT1], ['T2', runT2], ['T4', runT4]]) {
      const v = validateRunLog(run.log);
      assert.ok(v.ok, `${label}: ${v.problems.join('; ')}`);
      assert.equal(v.stagesComplete, STAGES.length);
      run.log.forEach((e, i) => assert.equal(e.seq, i));
      const ev = run.log.filter((e) => e.stage === 'layout');
      assert.equal(ev[0].event, 'start'); assert.equal(ev[ev.length - 1].event, 'end');
      const end = ev[ev.length - 1];
      const n = run.options.length;
      assert.equal(end.count, n);
      assert.equal(end.detail.cacheHits + end.detail.cacheMisses, n, 'hits + misses ≠ options');
      assert.equal(end.detail.distinctLayouts, new Set(run.options.map((o) => o.layoutKey)).size, 'distinct layouts ≠ distinct keys');
      assert.equal(end.detail.cacheMisses, end.detail.distinctLayouts);
      const st = end.detail.statuses;
      for (const s of ['Fits', 'Fits with flags', 'Does not fit']) assert.equal(st[s], run.options.filter((o) => o.siteFit.status === s).length, `${label}: ${s} count`);
      const steps = ev.filter((e) => e.event === 'progress').map((e) => e.detail.step);
      assert.ok(steps.includes('blocks') && steps.includes('site-fit'), `${label}: progress steps ${steps.join(', ')}`);
      // The layout stage sits between sizing and dispatch.
      const order = STAGES.map((x) => x.id);
      assert.equal(order.indexOf('layout'), order.indexOf('sizing') + 1); assert.equal(order.indexOf('dispatch'), order.indexOf('layout') + 1);
      const warn = ev.filter((e) => e.event === 'warning').map((e) => e.detail.code);
      out.push(`${label}: ${ev.length} layout events (${steps.length} progress), ${end.detail.cacheMisses} distinct layouts / ${end.detail.cacheHits} cache hits, ${end.detail.placements} placements, statuses ${JSON.stringify(st)}${warn.length ? `, warnings ${warn.join(', ')}` : ''}`);
    }
    const again = runModel(referenceT4({ analysisStart: START }));
    assert.deepEqual(stripTimestamps(again.log), stripTimestamps(runT4.log), 'T4 log differs between two runs');
    out.push('T4 log identical on two runs (timestamps excluded)');
    return out.join('; ') + '.';
  });
}

// ---------------------------------------------------------------------------------------------------------
// 9e–9g, 9i: site-fit outputs (§10.6), AC7 on T2, site fit never changes a score or rank with the penalty
// off, and the Site tab's rendered structure.
// ---------------------------------------------------------------------------------------------------------
import { deliverability } from '../src/engine/evaluate.js';
import { scoreOptions, applyView, DEFAULT_VIEW } from '../src/engine/scoring.js';
import { defaultView } from '../src/engine/view.js';
import { defaultChoiceState } from '../src/engine/defaults.js';

const lpRef = (lw, r) => lw - 20 * Math.log10(Math.max(1, r)) - 8;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

// A one-off layout result for layoutFacts/siteFitOf: boxes (uv) for the given blocks, nothing unplaced.
function fakeLayout(site, boxes) {
  const c = site.grid.cell;
  const placed = boxes.map((b, index) => ({ index, x0: b[0], y0: b[1], x1: b[2], y1: b[3], i0: 0, j0: 0, i1: 1, j1: 1, rot: 0, level: 0, broken: [] }));
  const area = boxes.reduce((a, b) => a + (b[2] - b[0]) * (b[3] - b[1]), 0);
  return { cell: c, placed, unplaced: [], fill: null, placedM2: area, requiredM2: area, netM2: site.areas.netM2 };
}

function pickOptions(run) {
  const out = new Map();
  const add = (o) => { if (o) out.set(o.id, o); };
  add(run.options.reduce((a, b) => (a.rank < b.rank ? a : b)));
  for (const o of run.options) if (o.archetype) add(o);
  for (const s of ['Fits', 'Fits with flags', 'Does not fit']) add(run.options.find((o) => o.siteFit.status === s));
  for (let i = 0; i < run.options.length; i += Math.max(1, Math.floor(run.options.length / 25))) add(run.options[i]);
  return [...out.values()];
}

export async function siteFitTests(test, ctxRuns) {
  const { runT1, START, getViewBundle } = ctxRuns;
  const runT2 = ctxRuns.runT2 || (ctxRuns.runT2 = runModel(referenceT2({ analysisStart: START })));
  const runT4 = ctxRuns.runT4 || (ctxRuns.runT4 = runModel(referenceT4({ analysisStart: START })));
  const runTC = ctxRuns.runTC || (ctxRuns.runTC = runModel(constrainedT1(START)));

  await test('9e. Site-fit outputs (§10.6): area budget, land take, residual, height per zone, separation checklist, noise proxy (hand-checked), roof use, expansion headroom, land-take ceiling flag', () => {
    const out = [];
    // (a) Noise proxy, hand-checked: Lp = Lw − 20·log10(r) − 8. Two continuous 100 dB(A) sources 100 m from a
    // receptor: 100 − 40 − 8 = 52.0 dB(A) each, together 52 + 10·log10(2) = 55.0 dB(A). A standby 105 dB(A)
    // genset array 200 m away: 105 − 46.02 − 8 = 50.98 → 51.0 dB(A), reported separately.
    const inp = normalizeInputs(referenceT1({ analysisStart: START }));
    const at = llAt(inp.project.lat, inp.project.lon);
    const a = Math.sqrt(150000 * 1.5) / 2;
    inp.site.receptors = [{ name: 'Test receptor', point: at(a + 60, 0) }];
    const site = buildSiteModel(inp);
    const rc = site.points.receptors[0].uv;
    const box = (c) => [c[0] - 5, c[1] - 5, c[0] + 5, c[1] + 5];
    const centres = [[rc[0] - 100, rc[1]], [rc[0] - 80, rc[1] + 60], [rc[0] - 200, rc[1]]];
    const mk = (i, lwA, kind) => ({ type: 'genset', source: 'diesel', name: `Source ${i + 1}`, w: 10, h: 10, areaM2: 100, heightM: 3, clearanceM: 0, boundaryM: 0, noise: { lwA, kind } });
    const bs = { ground: [mk(0, 100, 'continuous'), mk(1, 100, 'continuous'), mk(2, 105, 'standby')], roof: [], offsite: [], fill: null };
    const L = fakeLayout(site, centres.map(box));
    const fx = layoutFacts(site, bs, L);
    assert.equal(fx.noise.label, 'screening proxy, not an acoustic assessment');
    assert.deepEqual(fx.noise.sources.map((s) => s.receptorM), [100, 100, 200]);
    assert.deepEqual(fx.noise.sources.map((s) => s.atReceptorDbA), [52, 52, 51]);
    assert.deepEqual(fx.noise.receptorLevels, [{ name: 'Test receptor', normalDbA: 55, standbyDbA: 51 }]);
    const ctx = lightContext(inp, site);
    const sf45 = siteFitOf(ctx, site, bs, L, fx, {}, { itMW: 100 });
    const nf = sf45.flags.find((f) => f.id === 'site-noise');
    assert.ok(nf && nf.category === 'Permitting' && nf.permitting === false && nf.siteDerived === true && /55 dB\(A\)/.test(nf.message) && nf.message.includes('screening proxy, not an acoustic assessment'), 'noise flag above 45 dB(A)');
    assert.equal(sf45.status, 'Fits with flags');
    const sf56 = siteFitOf({ ...ctx, inputs: { ...inp, requirements: { ...inp.requirements, noiseNightDbA: 56 } } }, site, bs, L, fx, {}, { itMW: 100 });
    assert.ok(!sf56.flags.some((f) => f.id === 'site-noise'));
    assert.equal(sf56.status, 'Fits');
    out.push('noise hand check: 2 × 100 dB(A) at 100 m → 52.0 each, 55.0 together; standby 105 dB(A) at 200 m → 51.0 (separate); flag at 45 dB(A) threshold (category Permitting, not counted as permitting), none at 56 dB(A)');
    // (b) Land-take ceiling flag (§5.5 ceiling, flag only).
    const ceil = (ha) => siteFitOf({ ...ctx, inputs: { ...inp, requirements: { ...inp.requirements, landTakeCeilingHa: ha, noiseNightDbA: 56 } } }, site, bs, L, fx, {}, { itMW: 100 });
    assert.ok(ceil(0.01).flags.some((f) => f.id === 'target-landtake' && f.category === 'Targets and ceilings'));
    assert.ok(!ceil(1).flags.some((f) => f.id === 'target-landtake'));
    assert.equal(ceil(0.01).status, 'Fits', 'the land-take ceiling is a flag, not a site-fit status');
    out.push('land-take ceiling 0.01 ha → flag (status unchanged), 1 ha → none');

    // (c) Consistency of every §10.6 output on real runs (recomputed through HOOKS.layout).
    let checked = 0, rows = 0;
    for (const [label, run] of [['T1', runT1], ['T1 + constraints', runTC], ['T2', runT2], ['T4', runT4]]) {
      const st = buildSiteModel(run.inputs);
      for (const o of pickOptions(run)) {
        const re = HOOKS.layout(st, run.inputs, o);
        const sf = re.siteFit, f2 = re.facts;
        const sumP = f2.parts.reduce((s, p) => s + p.placedM2, 0), sumU = f2.parts.reduce((s, p) => s + p.unplacedM2, 0);
        near(sumP + sumU, sf.landTakeM2, f2.parts.length + 1, `${label} ${o.id}: area budget total vs land take`);
        near(sumU, sf.unplacedM2, f2.parts.length + 1, `${label} ${o.id}: not-placed parts vs shortfall`);
        near(sf.budgetShortfallM2, Math.max(0, sf.landTakeM2 - sf.netM2), 2, `${label} ${o.id}: shortfall beyond 100 %`);
        near(sf.residualM2, Math.max(0, sf.netM2 - sf.placedM2 - sf.fillM2), 2, `${label} ${o.id}: residual area`);
        near(sf.offsiteHa, re.bs.offsite.reduce((s, x) => s + x.landHa, 0), 1e-9, `${label} ${o.id}: off-site land`);
        assert.equal(sf.status, o.siteFit.status);
        // Height per zone: the site row always exists; exceeded iff the tallest element is above the limit.
        assert.equal(f2.heights[0].id, 'site');
        for (const h of f2.heights) if (h.tallestM != null) assert.equal(h.status, h.tallestM > h.limitM + 1e-9 ? 'exceeded' : 'pass');
        if (f2.heights.some((h) => h.status === 'exceeded')) assert.notEqual(sf.status, 'Fits', `${label} ${o.id}: height exceeded but "Fits"`);
        // Separation checklist: statuses follow the numbers (rounded to 0.1 m); a minimum is never broken.
        for (const x of f2.separations) {
          rows++;
          if (x.kind === 'separation' || x.kind === 'boundary') {
            if (x.status === 'pass') assert.ok(x.actualM >= x.requiredM - 0.06, `${label}: ${x.label} pass at ${x.actualM} < ${x.requiredM}`);
            else if (x.status === 'relaxed') assert.ok(x.actualM < x.requiredM + 0.06 && x.actualM >= x.minM - 0.06, `${label}: ${x.label} relaxed at ${x.actualM}`);
            else assert.fail(`${label} ${o.id}: separation minimum broken: ${x.label} ${x.actualM} m (minimum ${x.minM} m)`);
          }
        }
        const relaxedRows = f2.separations.filter((x) => (x.kind === 'separation' || x.kind === 'boundary') && x.status === 'relaxed');
        const relaxedNamed = sf.relaxed.filter((x) => x.rule === 'separation' || x.rule === 'boundary');
        assert.equal(relaxedRows.length > 0, relaxedNamed.length > 0, `${label} ${o.id}: checklist relaxed rows (${relaxedRows.length}) vs named relaxed rules (${relaxedNamed.length})`);
        if (relaxedNamed.length) assert.ok(sf.flags.some((x) => x.id === 'site-relaxed') && sf.status !== 'Fits');
        // Roof use and expansion headroom.
        near(sf.roof.freeM2, sf.roof.roofM2 - sf.roof.plantM2 - sf.roof.pvM2 - sf.roof.edgeM2, 3, `${label} ${o.id}: roof split`);
        assert.equal(sf.roof.overAllocated, sf.roof.freeM2 < -1);
        if (sf.status === 'Does not fit') assert.equal(sf.expansionMW, 0); else assert.ok(sf.expansionMW >= 0);
        checked++;
      }
    }
    // Constraints show up: the 12 m aviation zone row and a receptor level on the constrained T1 leader.
    const tcSite = buildSiteModel(runTC.inputs);
    const tcLead = runTC.options.reduce((x, y) => (x.rank < y.rank ? x : y));
    const tl = HOOKS.layout(tcSite, runTC.inputs, tcLead);
    assert.ok(tl.facts.heights.some((h) => h.name === 'Aviation zone' && h.limitM === 12));
    assert.equal(tl.facts.noise.receptorLevels.length, 1);
    for (const s of tl.facts.noise.sources) if (s.receptorM != null) near(s.atReceptorDbA, lpRef(s.lwA, s.receptorM), 0.15, 'receptor level from the formula');
    out.push(`${checked} options on T1, T1 + constraints, T2 and T4: budget parts = land take, shortfall beyond 100 %, residual, off-site land, height rows, ${rows} separation rows (no minimum broken; relaxed rows ⇔ named relaxed rules), roof split, expansion 0 when not fitting`);
    return out.join('; ') + '.';
  });

  await test('9f. AC7 on T2: an archetype shows "Does not fit" with a named shortfall; C17/C18 stay at defaults with "N options do not fit" notes; including C17 GIS and C18 double-deck yields options that fit or fit with flags; no option hidden', async () => {
    const out = [];
    const n = runT2.options.length;
    const noFit = runT2.options.filter((o) => o.siteFit.status === 'Does not fit');
    const arch = runT2.options.filter((o) => o.archetype && o.siteFit.status === 'Does not fit');
    assert.ok(arch.length >= 1, 'no archetype shows "Does not fit" on T2');
    for (const o of arch) {
      const fl = o.flags.find((f) => f.id === 'site-does-not-fit');
      assert.ok(fl && fl.severity === 'major' && /area shortfall [\d,]+ m²/.test(fl.message), `${o.archetype}: no named shortfall`);
      assert.ok(o.siteFit.unplaced.length && o.siteFit.unplaced.every((u) => fl.message.includes(u.name)), `${o.archetype}: unplaced blocks not named`);
    }
    const a0 = arch[0];
    out.push(`T2: ${noFit.length} of ${n} options do not fit; ${arch.length} archetypes do, e.g. ${a0.archetype} "${a0.siteFit.reasons[0]}" (${a0.siteFit.unplaced.map((u) => u.name).join(', ')})`);
    // C17 and C18 at their defaults: only AIS and single-deck generated; the notes give the count.
    assert.deepEqual(runT2.inputs.choices.C17, defaultChoiceState('C17', runT2.inputs));
    assert.deepEqual(runT2.inputs.choices.C18, defaultChoiceState('C18', runT2.inputs));
    assert.ok(runT2.options.every((o) => ['AIS', 'n/a'].includes(o.v.C17) && ['single', 'n/a'].includes(o.v.C18)), 'C17/C18 values beyond the defaults were generated');
    const vng = runT2.generation.valuesNotGenerated;
    for (const id of ['C17', 'C18']) {
      const e = vng.find((x) => x.id === id);
      assert.ok(e && e.doesNotFit === noFit.length && e.note.startsWith(`${noFit.length.toLocaleString('en-GB')} options do not fit`), `${id} note: ${e && e.note}`);
    }
    const B = await getViewBundle();
    const html = B.renderSummary(runT2);
    const notes = [...html.matchAll(/class="sub site-note">([^<]*)</g)].map((m) => m[1]);
    assert.equal(notes.length, 2, 'run summary does not show the C17 and C18 notes');
    assert.ok(notes.every((t) => t.startsWith(`${noFit.length.toLocaleString('en-GB')} options do not fit`)));
    out.push(`C17/C18 at defaults; run summary notes: "${notes[0]}" / "${notes[1]}"`);
    // No option hidden: with default settings "Hide dominated options" is off and every option is listed.
    assert.equal(defaultView().hideDominated, false);
    assert.equal(applyView(runT2.options, defaultView()).list.length, n, 'default view hides options');
    assert.deepEqual(runT2.options.map((o) => o.rank).sort((x, y) => x - y), Array.from({ length: n }, (_, i) => i + 1), 'ranks are not 1…N');
    // Including C17 GIS and C18 double-deck (the run summary's Include, AC7 wording).
    const inc = referenceT2({ analysisStart: START });
    inc.choices = { ...normalizeInputs(inc).choices, C17: { state: 'open', values: ['AIS', 'GIS'] }, C18: { state: 'open', values: ['single', 'double'] } };
    const runInc = runModel(inc);
    const fit = runInc.options.filter((o) => o.siteFit.status !== 'Does not fit');
    assert.ok(fit.length >= 1, 'including GIS and double-deck gives no option that fits or fits with flags');
    assert.ok(fit.every((o) => o.v.C17 === 'GIS'), 'a fitting option without GIS');
    assert.equal(applyView(runInc.options, defaultView()).list.length, runInc.options.length);
    const byStatus = { Fits: 0, 'Fits with flags': 0, 'Does not fit': 0 };
    for (const o of runInc.options) byStatus[o.siteFit.status]++;
    out.push(`with C17 GIS + C18 double-deck included (${runInc.generation.totalCombinations.toLocaleString('en-GB')} combinations, ${runInc.options.length} screened${runInc.generation.sampled ? ', sampled' : ''}): ${byStatus.Fits} fit, ${byStatus['Fits with flags']} fit with flags (e.g. "${fit[0].name}": ${fit[0].siteFit.reasons[0].slice(0, 90)}…), ${byStatus['Does not fit']} do not fit; every option listed in both runs (hide dominated off, ranks 1…N)`);
    return out.join('; ') + '.';
  });

  await test('9g. Site fit never changes a score or rank while the site-fit penalty is off; with the penalty on, deliverability drops by 10/25 points and the axis reads "Deliverability (incl. site fit)"', async () => {
    const out = [];
    const ctx = runT1.ctx;
    assert.equal(!!ctx.inputs.deliverability.siteFitPenalty, false, 'the site-fit penalty must default to off');
    // (a) Deliverability with the penalty off ignores site fit and the site-fit flags.
    let same = 0;
    for (const o of runT1.options) {
      const d0 = deliverability(ctx, o.v, o.sizing, o.dispatch, o.flags, o.siteFit);
      const noSite = o.flags.filter((f) => !f.siteFit && f.id !== 'target-landtake');
      for (const [flags, sf] of [[o.flags, null], [noSite, null], [o.flags, { status: 'Does not fit' }], [noSite, { status: 'Fits' }]]) {
        const d = deliverability(ctx, o.v, o.sizing, o.dispatch, flags, sf);
        assert.equal(d.score, d0.score, `${o.id}: deliverability depends on site fit with the penalty off`);
      }
      assert.equal(d0.score, o.deliv.score);
      assert.equal(o.deliv.includesSiteFit, false);
      same++;
    }
    out.push(`T1: deliverability of all ${same} options identical with site fit real, removed or scrambled and with the site-fit flags removed`);
    // (b) Scores and ranks with site fit scrambled or removed are identical (re-scored set).
    const base = new Map(runT1.options.map((o) => [o.id, [o.score, o.rank]]));
    const statuses = ['Fits', 'Fits with flags', 'Does not fit'];
    for (const mode of ['removed', 'scrambled', 'all-no-fit']) {
      const opts = runT1.options.map((o, i) => ({ ...o, siteFit: mode === 'removed' ? null : { ...o.siteFit, status: mode === 'all-no-fit' ? 'Does not fit' : statuses[(i * 7) % 3] } }));
      scoreOptions(opts, runT1.inputs);
      for (const o of opts) assert.deepEqual([o.score, o.rank], base.get(o.id), `${mode}: score or rank of ${o.id} changed`);
    }
    out.push('scores and ranks identical with site fit removed, scrambled or all "Does not fit" (dominance may differ: it includes site fit, §7.2 step 6)');
    // (c) View filters by site fit and land take never change a score or rank.
    const v = applyView(runT1.options, { ...DEFAULT_VIEW, siteFit: ['Fits'], landTakeCeilingHa: 8 });
    assert.ok(v.list.length < runT1.options.length && v.list.every((o) => o.siteFit.status === 'Fits' && o.siteFit.landTakeHa <= 8));
    assert.ok(runT1.options.every((o) => o.score === base.get(o.id)[0] && o.rank === base.get(o.id)[1]));
    // (d) Penalty on (T4): only deliverability changes, by the registered points, and the label says so.
    const inpP = referenceT4({ analysisStart: START });
    inpP.deliverability.siteFitPenalty = true;
    const runP = runModel(inpP);
    const offById = new Map(runT4.options.map((o) => [o.id, o]));
    const P = runP.inputs.deliverability;
    let dropped = 0, rankChanged = 0;
    for (const o of runP.options) {
      const q = offById.get(o.id);
      assert.ok(q, `${o.id} missing without the penalty`);
      assert.equal(o.siteFit.status, q.siteFit.status, 'site fit depends on the penalty');
      assert.equal(o.eco.lcoe, q.eco.lcoe); assert.equal(o.eco.capex, q.eco.capex); assert.equal(o.metrics.ttp, q.metrics.ttp); assert.equal(o.metrics.carbon, q.metrics.carbon);
      const pts = o.siteFit.status === 'Does not fit' ? P.siteFitNoFitPenalty : o.siteFit.status === 'Fits with flags' ? P.siteFitFlagsPenalty : 0;
      near(o.deliv.score, Math.max(0, q.deliv.score - pts), 1e-9, `${o.id}: penalty ${pts}`);
      assert.equal(o.deliv.includesSiteFit, true);
      if (pts) dropped++;
      if (o.rank !== q.rank) rankChanged++;
    }
    assert.ok(dropped > 0 && rankChanged > 0);
    const B = await getViewBundle();
    const det = B.renderOptionDetail(runP.options[0]);
    assert.ok(det.includes('Deliverability (incl. site fit)'), 'option detail does not label the axis "Deliverability (incl. site fit)"');
    assert.ok(!B.renderOptionDetail(runT4.options[0]).includes('incl. site fit'));
    out.push(`T4 with the penalty on: ${dropped} of ${runP.options.length} options lose ${P.siteFitFlagsPenalty}/${P.siteFitNoFitPenalty} deliverability points, ${rankChanged} ranks change, LCOE/capex/time-to-power and statuses unchanged; detail reads "Deliverability (incl. site fit)" (off: "Deliverability")`);
    return out.join('; ') + '.';
  });

  await test('9i. Site tab (server render): plan with layers, scale bar and north arrow, one drawn block per placed block, site-fit panel, unplaced tray, plan as a table with every block, small multiples, editor', async () => {
    const B = await getViewBundle();
    const out = [];
    for (const [label, run] of [['T2', runT2], ['T1 + constraints', runTC], ['T4', runT4]]) {
      const lead = run.options.reduce((x, y) => (x.rank < y.rank ? x : y));
      const html = B.renderSite(run, run.inputs);
      const st = buildSiteModel(run.inputs);
      const re = HOOKS.layout(st, run.inputs, lead);
      const svgTag = (html.match(/<svg[^>]*id="site-plan"[^>]*>/) || [''])[0];
      assert.ok(/role="application"/.test(svgTag) && /tabindex="0"/.test(svgTag) && /aria-describedby="site-plan-desc"/.test(svgTag), `${label}: plan svg is not a focusable application with a description`);
      assert.ok(svgTag.includes(`aria-label="Site plan of #1 `), `${label}: plan label does not name the option`);
      const i0 = html.indexOf('id="site-plan"');
      const mainSvg = html.slice(i0, html.indexOf('</svg>', i0));
      const drawn = (mainSvg.match(/<g data-block="/g) || []).length;
      assert.equal(drawn, re.layout.placed.length, `${label}: drawn blocks ≠ placed blocks`);
      for (const k of ['sp-scale', 'sp-north', 'sp-boundary', 'sp-setback']) assert.ok(html.includes(`class="${k}`), `${label}: ${k} missing`);
      assert.equal((html.match(/<fieldset class="sp-layers">[\s\S]*?<\/fieldset>/)[0].match(/type="checkbox"/g) || []).length, 9, `${label}: layer toggles`);
      for (const t of ['Area budget', 'Height check', 'Separation checklist', 'screening proxy, not an acoustic assessment', 'Roof use', 'Expansion headroom', 'Residual net area']) assert.ok(html.includes(t), `${label}: "${t}" missing in the site-fit panel`);
      if (re.siteFit.unplaced.length) {
        assert.ok(html.includes('Unplaced tray'), `${label}: no unplaced tray`);
        for (const u of re.siteFit.unplaced) assert.ok(html.includes(esc(u.name)), `${label}: unplaced ${u.name} not listed`);
      }
      const table = html.match(/<table class="mini blocks-table"[\s\S]*?<\/table>/)[0];
      const trs = (table.match(/<tr/g) || []).length - 1; // minus the header row
      assert.equal(trs, B.blockRows(st, re).length, `${label}: table rows ≠ blocks`);
      assert.equal(trs, re.layout.placed.length + re.layout.unplaced.length + (re.layout.fill ? 1 : 0) + re.bs.roof.length + re.bs.offsite.length);
      assert.ok(/class="blocks-table-wrap" role="region"[^>]*tabindex="0"/.test(html), `${label}: the table's scroll region is not focusable`);
      for (const t of ['Draw boundary on the plan', 'accept=".geojson,.json,.kml', 'Boundary corners, one', 'Setbacks', 'Exclusions and height zones', 'Grid POC, gas main, access and receptors']) assert.ok(html.includes(t), `${label}: editor "${t}" missing`);
      assert.equal((html.match(/class="multiple"/g) || []).length, Math.min(6, run.options.length));
      out.push(`${label}: leader ${re.siteFit.status}, ${drawn} blocks drawn = placed, ${trs} table rows (placed ${re.layout.placed.length}, unplaced ${re.layout.unplaced.length}, fill ${re.layout.fill ? 1 : 0}, roof ${re.bs.roof.length}, off-site ${re.bs.offsite.length})`);
    }
    return out.join('; ') + '.';
  });
}
