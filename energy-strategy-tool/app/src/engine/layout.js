// Auto-layout heuristic (BRIEF §10.4). Fast, deterministic, good enough for concept stage; not an optimiser.
//
//  1. The buildable envelope is rasterised (site.js; 2 m cells, 5 m above 50 ha; run settings).
//  2. Blocks are placed in the brief's priority order (blocks.js PRIORITY): building, substation (nearest
//     feasible position to the POC), backup gensets and fuel storage (adjacent to the building, within the
//     maximum distance, away from receptors where possible), firm generation (near the gas main if present,
//     away from receptors), BESS (near the substation), heat rejection (ground), wind turbines, then ground
//     solar fills the remaining area (and soft exclusions where allowed).
//  3. Each placement tests clearances, separation rules to placed blocks and to the boundary, hard
//     exclusions and height zones on an occupancy grid. The position is the feasible one with the lowest
//     anchor cost; ties go to the lower row, then column, then the unrotated orientation (deterministic).
//  4. A block that cannot be placed goes to the unplaced tray with its area (m²): the option "Does not fit".
//     The roads/parking/landscaping allowance is held back as a land budget: a block that would take the
//     placed land take above the net developable area is not placed either (§5.5: at the default land-take
//     ceiling, land take above the net developable area coincides with "Does not fit").
//  5. A block placed only by relaxing a soft rule goes in at the first level that works (LEVELS below) and
//     every rule it breaks at its position is named; the option "Fits with flags".
//  Iteration with sizing (§10.4): "fill residual" solar is sized from the area it fills after the other
//  blocks are placed. No other sizing depends on the layout.
//
// Occupancy grid: for each block and relaxation level a forbidden mask is painted (envelope, soft
// exclusions, boundary separation, height zones, and every placed block dilated by the required
// separation). Its vertical free-run array (vdown) makes a row scan find every free position of a
// rectangle in one pass, the equivalent of an integral-image test. Masks are reused for consecutive blocks
// with the same rules (later placements checked explicitly).
// Separations: a block's cells must avoid the cells within the separation of each placed block's true
// rectangle, so every achieved gap is at least the rule (diagonal gaps are tested as axis-aligned, which is
// conservative at corners).
//
// Batches share work: layoutMany() sorts the block sets so that sets with the same leading blocks are
// adjacent and keeps a stack of placement states, so a shared prefix is placed once. The placement of a
// block depends only on the blocks before it, so each result equals the single-set run (runLayout uses the
// same code path; test 9d checks it on a sample).

import { integralImage, rectSum, pointInRing, distPointRing } from './geometry.js';

export const LAYOUT_LEVELS = [
  { id: 0, sep: 'default', height: 'strict', soft: false, label: 'default rules' },
  { id: 1, sep: 'min', height: 'strict', soft: false, label: 'separations at minimum' },
  { id: 2, sep: 'default', height: 'relaxed', soft: false, label: 'height limit exceeded' },
  { id: 3, sep: 'min', height: 'relaxed', soft: false, label: 'separations at minimum, height limit exceeded' },
  { id: 4, sep: 'min', height: 'relaxed', soft: true, label: 'separations at minimum, height limit exceeded, soft exclusion used' },
];

export const tallestOf = (b) => Math.max(b.heightM || 0, b.stackM || 0);
function pairSep(a, b, min) {
  let s = 0;
  const pa = a.pair && a.pair[b.type], pb = b.pair && b.pair[a.type];
  if (pa) s = Math.max(s, min ? pa.min : pa.m);
  if (pb) s = Math.max(s, min ? pb.min : pb.m);
  return s;
}
// Required separation between blocks a and b (metres), default or minimum values.
export function separation(a, b, min = false) {
  const ca = min && a.relaxable !== false ? a.clearanceMinM : a.clearanceM;
  const cb = min && b.relaxable !== false ? b.clearanceMinM : b.clearanceM;
  const minPair = min && a.relaxable !== false && b.relaxable !== false;
  return Math.max(ca || 0, cb || 0, pairSep(a, b, minPair));
}
export function rectGapM(a, b) {
  const dx = Math.max(0, b.x0 - a.x1, a.x0 - b.x1);
  const dy = Math.max(0, b.y0 - a.y1, a.y0 - b.y1);
  return Math.sqrt(dx * dx + dy * dy);
}
export function distRectPoint(r, p) {
  const dx = Math.max(r.x0 - p[0], 0, p[0] - r.x1);
  const dy = Math.max(r.y0 - p[1], 0, p[1] - r.y1);
  return Math.sqrt(dx * dx + dy * dy);
}
// Everything the placement of a block depends on (no names): used for prefix sharing and the layout key.
export function blockSig(b) {
  const r = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
  return JSON.stringify([b.type, b.group, r(b.w), r(b.h), r(b.heightM), r(b.stackM), r(b.clearanceM), r(b.clearanceMinM), b.relaxable === false ? 0 : 1,
    r(b.boundaryM), r(b.boundaryMinM), b.anchor, r(b.maxDistBuildingM), b.pair ? b.pair : null, b.usesGas ? 1 : 0, r(b.areaM2)]);
}
function fillSig(f) {
  const r = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
  return f ? JSON.stringify([f.mode, r(f.targetM2), r(f.clearanceM), r(f.minArrayM), r(f.heightM), f.softAllowed ? 1 : 0, r(f.haPerMWp)]) : '';
}

// Layout of one block set (blocks.js). Same code path as the batch.
export function runLayout(site, bs) {
  return layoutMany(site, [bs])[0];
}
export function layoutMany(site, sets, opts = {}) {
  const it = layoutManySteps(site, sets, opts);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

// Generator: yields every `yieldEvery` block sets (time slicing) and reports progress through onProgress.
export function* layoutManySteps(site, sets, { yieldEvery = 10, onProgress = null } = {}) {
  const g = site.grid;
  const { nx, ny, cell: c, u0, v0 } = g;
  const N = nx * ny;
  const netM2 = site.areas.netM2;
  let maxH = -Infinity, minH = Infinity, anySoft = false;
  for (let k = 0; k < N; k++) if (g.env[k]) { if (g.hlim[k] > maxH) maxH = g.hlim[k]; if (g.hlim[k] < minH) minH = g.hlim[k]; if (g.soft[k]) anySoft = true; }
  const P = site.points;
  const poc = P.poc.uv;
  const gas = P.gasMain ? P.gasMain.uv : null;
  const access = P.access[0].uv;
  const receptors = P.receptors.map((x) => (x.kind === 'point' ? { pt: x.uv } : { ring: x.uv }));
  const recDist = (x, y) => {
    let d = Infinity;
    for (const r of receptors) d = Math.min(d, r.pt ? Math.hypot(x - r.pt[0], y - r.pt[1]) : (pointInRing([x, y], r.ring) ? 0 : distPointRing([x, y], r.ring)));
    return d;
  };
  // Upper bound of any distance from the POC to a point of the grid (for cost lower bounds).
  const farBound = Math.hypot(Math.max(Math.abs(u0 - poc[0]), Math.abs(u0 + nx * c - poc[0])), Math.max(Math.abs(v0 - poc[1]), Math.abs(v0 + ny * c - poc[1])));
  const F = new Uint8Array(N);
  const stats = { sets: sets.length, placements: 0, searches: 0, maskBuilds: 0, columnSteps: 0, fills: 0, failMemoHits: 0 };

  // ---- Mutable placement state (restored from snapshots between sets) ----
  let blocks = null; // block list of the set being placed (placed records refer to it by index)
  const placed = [];
  const unplaced = [];
  let placedM2 = 0;
  let cache = new Map(); // `${sig}|${level}` -> mask state
  let failed = new Set(); // failure memo for the current placement state (see placeBlock)

  const cellsOf = (b, rot) => {
    const w = rot ? b.h : b.w, h = rot ? b.w : b.h;
    return [Math.max(1, Math.ceil(w / c - 1e-9)), Math.max(1, Math.ceil(h / c - 1e-9)), w, h];
  };
  // Cells within the separation s of a placed block's true rectangle (open L∞ zone): a block whose cells avoid
  // them is at least s from it. Tighter than dilating the block's cell rectangle by ceil(s / c) cells.
  const zoneOf = (r, s) => [
    Math.max(0, Math.floor((r.x0 - s - u0) / c + 1e-9)), Math.max(0, Math.floor((r.y0 - s - v0) / c + 1e-9)),
    Math.min(nx, Math.ceil((r.x1 + s - u0) / c - 1e-9)), Math.min(ny, Math.ceil((r.y1 + s - v0) / c - 1e-9)),
  ];
  const ruleSig = (b) => JSON.stringify([b.type, b.clearanceM, b.clearanceMinM, b.pair || null, b.boundaryM, b.boundaryMinM, tallestOf(b), b.relaxable !== false]);
  function paintZone(mask, r, s) {
    const [i0, j0, i1, j1] = zoneOf(r, s);
    for (let j = j0; j < j1; j++) mask.fill(1, i0 + j * nx, i1 + j * nx);
  }

  // Forbidden mask for block b at a level, with the blocks placed so far, as a vertical free-run array.
  function buildState(b, lev) {
    const min = lev.sep === 'min';
    const softBlocked = !lev.soft;
    for (let k = 0; k < N; k++) F[k] = g.env[k] && !(softBlocked && g.soft[k]) ? 0 : 1;
    const bnd = min ? b.boundaryMinM : b.boundaryM;
    const tb = tallestOf(b);
    if (bnd > 0 || lev.height === 'strict') {
      for (let k = 0; k < N; k++) {
        if (F[k]) continue;
        if (bnd > 0 && g.dBound[k] < bnd - 1e-9) F[k] = 1;
        else if (lev.height === 'strict' && g.hlim[k] < tb - 1e-9) F[k] = 1;
      }
    }
    for (const r of placed) paintZone(F, r, separation(blocks[r.index], b, min));
    stats.maskBuilds++;
    const vd = new Uint16Array(N);
    const top = (ny - 1) * nx;
    for (let i = 0; i < nx; i++) vd[top + i] = F[top + i] ? 0 : 1;
    for (let j = ny - 2; j >= 0; j--) {
      const row = j * nx, up = row + nx;
      for (let i = 0; i < nx; i++) vd[row + i] = F[row + i] ? 0 : vd[up + i] + 1;
    }
    return { vdown: vd, S: integralImage(F, nx, ny), builtAt: placed.length, min };
  }
  function clearOfLater(st, b, i0, j0, i1, j1) {
    for (let p = st.builtAt; p < placed.length; p++) {
      const z = zoneOf(placed[p], separation(blocks[placed[p].index], b, st.min));
      if (i0 < z[2] && i1 > z[0] && j0 < z[3] && j1 > z[1]) return false;
    }
    return true;
  }

  // Anchor cost model for block b: cost(rect) and two bounds that prune the search:
  //   rowLB(vA, vB, wT)          lower bound of the cost of any rect spanning rows vA..vB
  //   xRanges(vA, vB, wT, best)  ranges of rect x0 (u, metres) that can beat `best`, or null for the whole row
  function costModel(b) {
    const of = (t) => placed.filter((r) => blocks[r.index].type === t);
    const halls = of('building'), subs = of('substation'), gensets = of('genset');
    const vgap = (r, vA, vB) => Math.max(0, r.y0 - vB, vA - r.y1);
    const rectsLB = (rs) => (vA, vB) => { let lb = Infinity; for (const r of rs) lb = Math.min(lb, vgap(r, vA, vB)); return lb; };
    // Anchors here are placed (occupied) blocks: when the row band overlaps one vertically, a rect between
    // its sides would overlap it, so only the two side strips can be feasible.
    const rectsX = (rs, slack = 0) => (vA, vB, wT, best) => {
      const lim = best + slack;
      const out = [];
      for (const r of rs) {
        const dv = vgap(r, vA, vB);
        if (dv > lim) continue;
        const dx = Math.sqrt(Math.max(0, lim * lim - dv * dv));
        if (dv === 0) { out.push([r.x0 - wT - dx, r.x0 - wT]); out.push([r.x1, r.x1 + dx]); }
        else out.push([r.x0 - wT - dx, r.x1 + dx]);
      }
      return out;
    };
    const pointLB = (p) => (vA, vB) => Math.max(0, p[1] - vB, vA - p[1]);
    const pointX = (p) => (vA, vB, wT, best) => {
      const dv = Math.max(0, p[1] - vB, vA - p[1]);
      if (dv > best) return [];
      const dx = Math.sqrt(Math.max(0, best * best - dv * dv));
      return [[p[0] - wT - dx, p[0] + dx]];
    };
    const minGap = (rs, r) => { let d = Infinity; for (const q of rs) d = Math.min(d, rectGapM(q, r)); return d; };
    const none = () => -Infinity;
    const full = () => null;
    const cx = (r) => (r.x0 + r.x1) / 2, cy = (r) => (r.y0 + r.y1) / 2;
    switch (b.anchor) {
      case 'farFromPoc':
        // Further halls: next to the halls already placed (a compact campus), then away from the POC.
        if (halls.length) return { cost: (r) => minGap(halls, r) - 1e-3 * Math.hypot(cx(r) - poc[0], cy(r) - poc[1]), rowLB: (vA, vB) => rectsLB(halls)(vA, vB) - 1e-3 * farBound, xRanges: rectsX(halls, 1e-3 * farBound) };
        return {
          cost: (r) => -Math.hypot(cx(r) - poc[0], cy(r) - poc[1]),
          rowLB: (vA, vB, wT) => {
            const du = Math.max(Math.abs(u0 + wT / 2 - poc[0]), Math.abs(u0 + nx * c - wT / 2 - poc[0]));
            return -Math.hypot(du, (vA + vB) / 2 - poc[1]);
          },
          xRanges: (vA, vB, wT, best) => {
            const D = -best, dv = (vA + vB) / 2 - poc[1];
            const q = D * D - dv * dv;
            if (q <= 0) return null;
            const s0 = Math.sqrt(q);
            return [[-Infinity, poc[0] - s0 - wT / 2], [poc[0] + s0 - wT / 2, Infinity]];
          },
        };
      case 'poc': return { cost: (r) => distRectPoint(r, poc), rowLB: pointLB(poc), xRanges: pointX(poc) };
      case 'building': {
        if (!halls.length) return { cost: () => 0, rowLB: () => 0, xRanges: full };
        const maxD = b.maxDistBuildingM || Infinity;
        if (receptors.length) {
          return { cost: (r) => { const gp = minGap(halls, r); return (gp <= maxD + 1e-9 ? 0 : 1e6 + gp) - Math.min(recDist(cx(r), cy(r)), 1e5) * 1e-3 + gp * 1e-6; }, rowLB: none, xRanges: full };
        }
        return { cost: (r) => { const gp = minGap(halls, r); return gp <= maxD + 1e-9 ? gp : 1e6 + gp; }, rowLB: rectsLB(halls), xRanges: (vA, vB, wT, best) => (best >= 1e6 ? null : rectsX(halls)(vA, vB, wT, best)) };
      }
      case 'fuel': {
        const ref = gensets.length ? gensets : halls;
        if (!ref.length) return { cost: (r) => distRectPoint(r, access), rowLB: pointLB(access), xRanges: pointX(access) };
        return { cost: (r) => minGap(ref, r) + 0.5 * distRectPoint(r, access), rowLB: rectsLB(ref), xRanges: rectsX(ref) };
      }
      case 'firm': {
        if (gas && b.usesGas) {
          if (receptors.length) return { cost: (r) => distRectPoint(r, gas) - 1e-3 * Math.min(recDist(cx(r), cy(r)), 1e5), rowLB: none, xRanges: full };
          return { cost: (r) => distRectPoint(r, gas), rowLB: pointLB(gas), xRanges: pointX(gas) };
        }
        if (receptors.length) return { cost: (r) => -recDist(cx(r), cy(r)), rowLB: none, xRanges: full };
        if (subs.length) return { cost: (r) => minGap(subs, r), rowLB: rectsLB(subs), xRanges: rectsX(subs) };
        return { cost: (r) => distRectPoint(r, poc), rowLB: pointLB(poc), xRanges: pointX(poc) };
      }
      case 'substation':
        if (subs.length) return { cost: (r) => minGap(subs, r), rowLB: rectsLB(subs), xRanges: rectsX(subs) };
        return { cost: (r) => distRectPoint(r, poc), rowLB: pointLB(poc), xRanges: pointX(poc) };
      case 'farFromBoundary':
        return { cost: (r) => -Math.min(distPointRing([cx(r), cy(r)], site.boundary.uv), halls.length ? minGap(halls, r) : Infinity), rowLB: none, xRanges: full };
      default: return { cost: () => 0, rowLB: () => 0, xRanges: full };
    }
  }

  // Best feasible position for b under mask state st: { i0, j0, i1, j1, rot, cost, rect } or null. Rows are
  // visited in order of their cost lower bound, the scan stops once no row can beat the best, and within a
  // row only the columns that can beat the best are scanned.
  function search(b, st, cm) {
    stats.searches++;
    let best = null;
    const vd = st.vdown;
    const orients = Math.abs(b.w - b.h) < 1e-9 ? [0] : [0, 1];
    for (const rot of orients) {
      const [wC, hC, wT, hT] = cellsOf(b, rot);
      if (wC > nx || hC > ny) continue;
      const rows = [];
      for (let j0 = 0; j0 + hC <= ny; j0++) {
        const vA = v0 + j0 * c;
        rows.push([cm.rowLB(vA, vA + hT, wT), j0]);
      }
      rows.sort((a, q) => a[0] - q[0] || a[1] - q[1]);
      for (const [lb, j0] of rows) {
        if (best && lb > best.cost + 1e-9) break;
        const y0 = v0 + j0 * c;
        let ranges = null;
        if (best) {
          const xr = cm.xRanges(y0, y0 + hT, wT, best.cost + 1e-9);
          if (xr) {
            ranges = [];
            for (const [xa, xb] of xr) {
              const ia = Math.max(0, Math.floor((xa - u0) / c - 1e-9)), ib = Math.min(nx - wC, Math.ceil((xb - u0) / c + 1e-9));
              if (ib >= ia) ranges.push([ia, ib]);
            }
            if (!ranges.length) continue;
            ranges.sort((p, q) => p[0] - q[0]);
          }
        }
        const scan = ranges || [[0, nx - wC]];
        const base = j0 * nx;
        let lastI = -1;
        const consider = (i0) => {
          if (st.builtAt < placed.length && !clearOfLater(st, b, i0, j0, i0 + wC, j0 + hC)) return;
          const x0 = u0 + i0 * c;
          const r = { x0, y0, x1: x0 + wT, y1: y0 + hT };
          const cost = cm.cost(r);
          if (!best || cost < best.cost - 1e-9 || (Math.abs(cost - best.cost) <= 1e-9 && (j0 < best.j0 || (j0 === best.j0 && (i0 < best.i0 || (i0 === best.i0 && rot < best.rot)))))) {
            best = { i0, j0, i1: i0 + wC, j1: j0 + hC, rot, cost, rect: r };
          }
        };
        for (const [ia0, ib] of scan) {
          const ia = Math.max(ia0, lastI + 1);
          if (ib < ia) continue;
          lastI = ib;
          if ((ib - ia + 1) * 4 < wC) {
            // Narrow range: one O(1) rectangle sum per position.
            stats.columnSteps += ib - ia + 1;
            for (let i0 = ia; i0 <= ib; i0++) if (rectSum(st.S, nx, i0, j0, i0 + wC, j0 + hC) === 0) consider(i0);
            continue;
          }
          // Wide range: one pass with a run counter over the vertical free runs.
          let run = 0;
          const iEnd = ib + wC - 1;
          stats.columnSteps += iEnd - ia + 1;
          for (let i = ia; i <= iEnd; i++) {
            run = vd[base + i] >= hC ? run + 1 : 0;
            if (run < wC) continue;
            const i0 = i - wC + 1;
            if (i0 < ia) continue;
            consider(i0);
          }
        }
      }
    }
    return best;
  }
  // Rules broken at a position relative to the default rules (named on the option, §10.4 step 5).
  function brokenRules(b, pos) {
    const out = [];
    const r = pos.rect;
    for (const q of placed) {
      const a = blocks[q.index];
      const need = separation(a, b, false);
      const gap = rectGapM(q, r);
      if (gap < need - 1e-6) out.push({ rule: 'separation', with: q.index, defaultM: need, minM: separation(a, b, true), actualM: gap });
    }
    let minB = Infinity, minHc = Infinity, soft = 0;
    for (let j = pos.j0; j < pos.j1; j++) for (let i = pos.i0; i < pos.i1; i++) {
      const k = i + j * nx;
      if (g.dBound[k] < minB) minB = g.dBound[k];
      if (g.hlim[k] < minHc) minHc = g.hlim[k];
      if (g.soft[k]) soft++;
    }
    if (b.boundaryM > 0 && minB < b.boundaryM - 1e-6) out.push({ rule: 'boundary', defaultM: b.boundaryM, minM: b.boundaryMinM, actualM: minB });
    if (tallestOf(b) > minHc + 1e-9) out.push({ rule: 'height', heightM: tallestOf(b), limitM: minHc, element: b.stackM && b.stackM > (b.heightM || 0) ? 'stack' : 'block' });
    if (soft) out.push({ rule: 'soft', cells: soft, areaM2: soft * c * c });
    return out;
  }

  function placeBlock(b) {
    stats.placements++;
    if (placedM2 + b.areaM2 > netM2 + 1e-6) {
      unplaced.push({ index: b.index, areaM2: b.areaM2, reason: 'budget', remainingM2: Math.max(0, netM2 - placedM2) });
      return;
    }
    const tb = tallestOf(b);
    const rs = ruleSig(b);
    // A block with the same rules and size as one that just failed, with nothing placed since, fails too.
    const failKey = `${rs}|${Math.round(b.w * 1000)}|${Math.round(b.h * 1000)}|${b.anchor}|${placed.length}`;
    if (failed.has(failKey)) { unplaced.push({ index: b.index, areaM2: b.areaM2, reason: 'space' }); stats.failMemoHits++; return; }
    const cm = costModel(b);
    for (const lev of LAYOUT_LEVELS) {
      if (lev.height === 'strict' && tb > maxH + 1e-9) continue; // cannot respect the height limit anywhere
      if (lev.height === 'relaxed' && !lev.soft && tb <= minH + 1e-9) continue; // identical to the strict level
      if (lev.sep === 'min' && b.relaxable === false) continue;
      if (lev.soft && !anySoft) continue;
      const key = `${rs}|${lev.id}`;
      let st = cache.get(key);
      if (!st) { st = buildState(b, lev); cache.set(key, st); }
      const pos = search(b, st, cm);
      if (!pos) continue;
      const rec = { index: b.index, i0: pos.i0, j0: pos.j0, i1: pos.i1, j1: pos.j1, rot: pos.rot, ...pos.rect, level: lev.id, broken: lev.id === 0 ? [] : brokenRules(b, pos) };
      if (b.maxDistBuildingM) {
        const halls = placed.filter((q) => blocks[q.index].type === 'building');
        if (halls.length) {
          const gp = Math.min(...halls.map((q) => rectGapM(q, rec)));
          if (gp > b.maxDistBuildingM + 1e-6) rec.broken.push({ rule: 'maxDistance', defaultM: b.maxDistBuildingM, actualM: gp });
        }
      }
      placed.push(rec);
      placedM2 += b.areaM2;
      return;
    }
    unplaced.push({ index: b.index, areaM2: b.areaM2, reason: 'space' });
    failed.add(failKey);
  }

  // Ground solar fill (§10.4 step 2.8): the free envelope (and soft exclusions where allowed) after the
  // solar clearance to every placed block, without strips narrower than the minimum array width, taken
  // farthest from the data halls first up to the land budget (residual) or the fixed target.
  function computeFill(f) {
    stats.fills++;
    const budget = Math.max(0, netM2 - placedM2);
    const target = f.mode === 'residual' ? budget : Math.min(f.targetM2, budget);
    const free = new Uint8Array(N);
    const softOK = f.softAllowed && site.softUsableBySolar;
    for (let k = 0; k < N; k++) free[k] = g.env[k] && (softOK || !g.soft[k]) && g.hlim[k] >= f.heightM - 1e-9 ? 1 : 0;
    const blockedF = new Uint8Array(N);
    for (const r of placed) {
      const a = blocks[r.index];
      const [i0, j0, i1, j1] = zoneOf(r, Math.max(f.clearanceM, a.clearanceM || 0));
      for (let j = j0; j < j1; j++) free.fill(0, i0 + j * nx, i1 + j * nx);
    }
    // Opening with an m × m square: keep a free cell only if a free m × m square covers it. O(cells).
    const m = Math.max(1, Math.ceil(f.minArrayM / c - 1e-9));
    for (let k = 0; k < N; k++) blockedF[k] = free[k] ? 0 : 1;
    const SF = integralImage(blockedF, nx, ny);
    const start = new Uint8Array(N);
    for (let j = 0; j + m <= ny; j++) for (let i = 0; i + m <= nx; i++) if (rectSum(SF, nx, i, j, i + m, j + m) === 0) start[i + j * nx] = 1;
    const hor = new Uint8Array(N);
    for (let j = 0; j < ny; j++) {
      let run = 0;
      for (let i = 0; i < nx; i++) { run += start[i + j * nx]; if (i >= m) run -= start[i - m + j * nx]; hor[i + j * nx] = run > 0 ? 1 : 0; }
    }
    const usable = new Uint8Array(N);
    let usableCount = 0;
    const colRun = new Int32Array(nx);
    for (let j = 0; j < ny; j++) {
      const row = j * nx, old = (j - m) * nx;
      for (let i = 0; i < nx; i++) {
        colRun[i] += hor[row + i];
        if (j >= m) colRun[i] -= hor[old + i];
        if (colRun[i] > 0) { usable[row + i] = 1; usableCount++; }
      }
    }
    const halls = placed.filter((r) => blocks[r.index].type === 'building');
    const maxCells = Math.floor(target / (c * c) + 1e-9);
    const sel = new Uint8Array(N);
    let taken = 0;
    if (usableCount <= maxCells) {
      for (let k = 0; k < N; k++) if (usable[k]) { sel[k] = 1; taken++; }
    } else if (maxCells > 0) {
      // Counting sort on half-cell distance buckets (farthest first, row-major within a bucket).
      const bucketOf = new Int32Array(N).fill(-1);
      let maxB = 0;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = i + j * nx;
        if (!usable[k]) continue;
        const px = u0 + (i + 0.5) * c, py = v0 + (j + 0.5) * c;
        let d2 = halls.length ? Infinity : 0;
        for (const q of halls) {
          const dx = Math.max(q.x0 - px, 0, px - q.x1), dy = Math.max(q.y0 - py, 0, py - q.y1);
          const e = dx * dx + dy * dy;
          if (e < d2) d2 = e;
        }
        const bk = Math.floor(Math.sqrt(d2) / (c / 2));
        bucketOf[k] = bk;
        if (bk > maxB) maxB = bk;
      }
      const count = new Int32Array(maxB + 2);
      for (let k = 0; k < N; k++) if (bucketOf[k] >= 0) count[bucketOf[k]]++;
      let acc = 0, cut = maxB;
      for (; cut >= 0; cut--) { if (acc + count[cut] >= maxCells) break; acc += count[cut]; }
      let need = maxCells - acc;
      for (let k = 0; k < N; k++) {
        const bk = bucketOf[k];
        if (bk > cut) { sel[k] = 1; taken++; } else if (bk === cut && need > 0) { sel[k] = 1; taken++; need--; }
      }
    }
    // Selected cells as rectangles: row runs, extended upwards while the run is identical.
    const rects = [];
    const used = new Uint8Array(N);
    for (let j = 0; j < ny; j++) {
      let i = 0;
      while (i < nx) {
        const k = i + j * nx;
        if (!sel[k] || used[k]) { i++; continue; }
        let i1 = i;
        while (i1 < nx && sel[i1 + j * nx] && !used[i1 + j * nx]) i1++;
        const same = (jj) => {
          for (let ii = i; ii < i1; ii++) if (!sel[ii + jj * nx] || used[ii + jj * nx]) return false;
          return (i === 0 || !sel[i - 1 + jj * nx] || used[i - 1 + jj * nx]) && (i1 === nx || !sel[i1 + jj * nx] || used[i1 + jj * nx]);
        };
        let j1 = j + 1;
        while (j1 < ny && same(j1)) j1++;
        for (let jj = j; jj < j1; jj++) used.fill(1, i + jj * nx, i1 + jj * nx);
        rects.push([i, j, i1, j1]);
        i = i1;
      }
    }
    let softCells = 0;
    for (let k = 0; k < N; k++) if (sel[k] && g.soft[k]) softCells++;
    const areaM2 = taken * c * c;
    const shortfallM2 = f.mode === 'fixed' ? Math.max(0, f.targetM2 - areaM2) : 0;
    return {
      mode: f.mode, targetM2: f.mode === 'fixed' ? f.targetM2 : target, budgetM2: budget, areaM2, cells: taken, rects, clearanceM: f.clearanceM, minArrayM: f.minArrayM,
      shortfallM2: shortfallM2 > c * c ? shortfallM2 : 0, mwp: areaM2 / (f.haPerMWp * 10000), haPerMWp: f.haPerMWp,
      softM2: softCells * c * c, usableM2: usableCount * c * c,
    };
  }

  // ---- Batch with prefix sharing ----
  const items = sets.map((bs, i) => ({ i, bs, sigs: bs.ground.map(blockSig), fsig: fillSig(bs.fill) }));
  const cmpSigs = (a, b) => {
    const n = Math.min(a.sigs.length, b.sigs.length);
    for (let k = 0; k < n; k++) if (a.sigs[k] !== b.sigs[k]) return a.sigs[k] < b.sigs[k] ? -1 : 1;
    return a.sigs.length - b.sigs.length || (a.fsig < b.fsig ? -1 : a.fsig > b.fsig ? 1 : 0) || a.i - b.i;
  };
  const order = items.slice().sort(cmpSigs);
  const results = new Array(sets.length);
  const snaps = [{ placedLen: 0, unplacedLen: 0, placedM2: 0, cache: new Map(), failed: new Set() }];
  const path = [];
  let done = 0;
  for (const it of order) {
    let k = 0;
    while (k < path.length && k < it.sigs.length && path[k] === it.sigs[k]) k++;
    const s = snaps[k];
    placed.length = s.placedLen; unplaced.length = s.unplacedLen; placedM2 = s.placedM2; cache = new Map(s.cache); failed = new Set(s.failed);
    snaps.length = k + 1; path.length = k;
    blocks = it.bs.ground;
    for (let d = k; d < it.sigs.length; d++) {
      placeBlock(blocks[d]);
      path.push(it.sigs[d]);
      snaps.push({ placedLen: placed.length, unplacedLen: unplaced.length, placedM2, cache: new Map(cache), failed: new Set(failed) });
    }
    const fill = it.bs.fill ? computeFill(it.bs.fill) : null;
    results[it.i] = { cell: c, placed: placed.slice(), unplaced: unplaced.slice(), fill, placedM2, requiredM2: blocks.reduce((a, b) => a + b.areaM2, 0), netM2 };
    done++;
    if (done % yieldEvery === 0) { if (onProgress) onProgress(done, sets.length, stats); yield; }
  }
  if (onProgress) onProgress(done, sets.length, stats);
  results.stats = stats;
  return results;
}
