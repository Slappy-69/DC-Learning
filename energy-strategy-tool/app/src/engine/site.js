// Site geometry and auto-layout (BRIEF §5.2, §10.1–§10.4, §6.3). Pure: no UI, no dispatch.
//
// This is the first part of the site stage. Included: a rectangular site from area and aspect,
// setbacks, a roads and parking strip, blocks taken from the sized option (sz.area.parts), a
// deterministic greedy auto-layout on a cell grid, the area budget and a height check.
// Not included yet: drawn boundaries, exclusion zones, manual editing, soft-rule relaxation
// ("Fits with flags"), noise proxy, expansion headroom, 2.5D.
//
// Clearance, height and footprint values are the §6.3 indicative defaults (all unverified).

// Block rules. `clr` is the clearance to other blocks (the larger of the two blocks' values is
// used for a pair); `bnd` is the clearance to the envelope edge; `ratio` is length:width;
// `h` is the height in metres (null = taken from the sized building).
export const BLOCK_RULES = {
  building:      { label: 'Data hall', h: null, clr: 6, bnd: 5, ratio: 'site', priority: 1, color: '#64748b' },
  substation:    { label: 'Substation', h: 6, clr: 5, bnd: 5, ratio: 1.5, priority: 2, color: '#7c3aed' },
  backup:        { label: 'Backup gensets', h: 7, clr: 3, bnd: 5, ratio: 3, priority: 3, color: '#b45309' },
  fuel:          { label: 'Bulk fuel storage', h: 7, clr: 6, bnd: 10, ratio: 2, priority: 3, color: '#78350f' },
  prime:         { label: 'Firm generation (prime)', h: 12, clr: 15, bnd: 15, ratio: 2, priority: 4, color: '#dc2626' },
  bridge:        { label: 'Firm generation (bridging)', h: 12, clr: 15, bnd: 15, ratio: 2, priority: 4, color: '#f97316' },
  bess:          { label: 'BESS', h: 3.5, clr: 10, bnd: 5, ratio: 2, priority: 5, color: '#0d9488' },
  heatRejection: { label: 'Heat rejection (ground)', h: 4, clr: 3, bnd: 5, ratio: 2, priority: 6, color: '#0284c7' },
  wind:          { label: 'Wind pads (topple and noise buffers not checked)', h: 0, clr: 5, bnd: 5, ratio: 1, priority: 7, color: '#65a30d' },
  groundSolar:   { label: 'Ground PV (fill)', h: 3, clr: 5, bnd: 5, ratio: 3, priority: 8, color: '#ca8a04' },
};

// Site geometry, same construction as sizing.js §5.2 so the envelope area equals sz.area.netM2.
export function siteGeometry(inputs) {
  const s = inputs.site;
  const gross = s.areaHa * 10000;
  const a = Math.sqrt(gross * s.aspect);
  const b = gross / a;
  const innerW = Math.max(0, a - 2 * s.setbackM);
  const innerH = Math.max(0, b - 2 * s.setbackM);
  const envH = innerH * (1 - s.roadsFraction);
  return { gross, a, b, setbackM: s.setbackM, innerW, innerH, roadsH: innerH - envH, envW: innerW, envH, netM2: innerW * envH, heightLimitM: s.heightLimitM, aspect: s.aspect };
}

// Blocks for one sized option, in priority order, with nominal areas (m²). Ground PV is split into
// arrays of at most PV_ARRAY_M2 so the residual can fill gaps, as real arrays do.
export const PV_ARRAY_M2 = 5000;
export function blockList(sz, g) {
  const parts = sz.area.parts;
  const out = [];
  for (const [key, rule] of Object.entries(BLOCK_RULES)) {
    const areaM2 = Math.max(0, Number(parts[key]) || 0);
    if (areaM2 <= 0) continue;
    const h = rule.h === null ? sz.building.heightM : rule.h;
    const ratio = rule.ratio === 'site' ? g.aspect : rule.ratio;
    const base = { key, label: rule.label, color: rule.color, h, clr: rule.clr, bnd: rule.bnd, ratio, priority: rule.priority };
    if (key === 'groundSolar') {
      let left = areaM2; let i = 1;
      while (left > 1e-6) {
        const piece = Math.min(PV_ARRAY_M2, left);
        out.push({ ...base, label: `${rule.label} ${i}`, areaM2: piece, id: `groundSolar-${i}` });
        left -= piece; i++;
      }
    } else {
      out.push({ ...base, areaM2, id: key });
    }
  }
  return out;
}

// Dimensions in metres for a nominal area and length:width ratio, both orientations.
function orientations(areaM2, ratio) {
  const w = Math.sqrt(areaM2 * ratio);
  const h = areaM2 / w;
  return ratio === 1 ? [[w, h]] : [[w, h], [h, w]];
}

function anchorFor(key, placed, g) {
  const centre = { x: g.envW / 2, y: g.envH / 2 };
  const find = (k) => placed.find((p) => p.key === k);
  if (key === 'substation') return { x: g.envW / 2, y: g.envH }; // point of connection: bottom edge centre (indicative)
  if (key === 'backup' || key === 'fuel' || key === 'prime' || key === 'bridge' || key === 'heatRejection') {
    const bld = find('building');
    return bld ? { x: bld.x + bld.w / 2, y: bld.y + bld.h / 2 } : centre;
  }
  if (key === 'bess') {
    const sub = find('substation');
    return sub ? { x: sub.x + sub.w / 2, y: sub.y + sub.h / 2 } : centre;
  }
  return centre;
}

// Greedy auto-layout (BRIEF §10.4): blocks in priority order, each at the feasible cell nearest its
// anchor. Feasible = inside the envelope with the boundary clearance, and separated from every placed
// block by the larger of the two clearances. Deterministic (scan order breaks ties).
export function layoutSite(inputs, sz, { cellM } = {}) {
  const g = siteGeometry(inputs);
  const c = cellM || (g.gross / 1e4 > 50 ? 5 : 2);
  const W = Math.floor(g.envW / c);
  const H = Math.floor(g.envH / c);
  const blocks = blockList(sz, g);
  const placed = []; // cell-space records
  const unplaced = [];

  for (const b of blocks) {
    const anchor = anchorFor(b.key, placed, g);
    const bc = Math.ceil(b.bnd / c);
    let best = null;
    for (const [wm, hm] of orientations(b.areaM2, b.ratio)) {
      const wc = Math.max(1, Math.ceil(wm / c));
      const hc = Math.max(1, Math.ceil(hm / c));
      for (let y = bc; y + hc + bc <= H; y++) {
        for (let x = bc; x + wc + bc <= W; x++) {
          let ok = true;
          for (const p of placed) {
            const gap = Math.ceil(Math.max(b.clr, p.clr) / c);
            const apart = x + wc + gap <= p.x || p.x + p.wc + gap <= x || y + hc + gap <= p.y || p.y + p.hc + gap <= y;
            if (!apart) { ok = false; break; }
          }
          if (!ok) continue;
          const cx = (x + wc / 2) * c;
          const cy = (y + hc / 2) * c;
          const cost = (cx - anchor.x) ** 2 + (cy - anchor.y) ** 2;
          if (!best || cost < best.cost) best = { x, y, wc, hc, cost };
        }
      }
    }
    if (best) {
      placed.push({ ...b, x: best.x, y: best.y, wc: best.wc, hc: best.hc });
    } else {
      unplaced.push({ key: b.key, id: b.id, label: b.label, areaM2: b.areaM2 });
    }
  }

  const blocksM = placed.map((p) => ({
    id: p.id, key: p.key, label: p.label, color: p.color, h: p.h, areaM2: p.areaM2,
    x: p.x * c, y: p.y * c, w: p.wc * c, d: p.hc * c,
  }));

  const landTakeM2 = blocks.reduce((s, b) => s + b.areaM2, 0);
  const tallest = blocksM.reduce((m, b) => Math.max(m, b.h), 0);
  const heightOk = tallest <= g.heightLimitM;
  const budgetFits = g.netM2 >= landTakeM2 - 1e-6;
  const pvUnplaced = unplaced.some((u) => u.key === 'groundSolar');
  const notes = [
    pvUnplaced
      ? 'Ground PV is sized to fill the net developable area after the other blocks, with no allowance for separations. Separations take up part of that area, so some PV cannot be placed. This is a sizing rule question (BRIEF §10.6, "fill residual"); sizing is unchanged in this slice.'
      : null,
    budgetFits && unplaced.length
      ? 'The area budget fits (land take is within net developable area), but the blocks cannot all be placed with their separations. The greedy layout is not an optimiser, so a different arrangement may fit; the gap is the separation loss.'
      : null,
    'Wind topple and noise buffers are not checked (no layout buffer model yet).',
    'Separations are the larger of the two blocks\' clearances; no soft rules are relaxed, so "Fits with flags" is not produced yet.',
    `Grid cell ${c} m; blocks are placed to the cell, so footprints can be up to one cell larger than their nominal area.`,
  ].filter(Boolean);
  if (!heightOk) notes.push(`Tallest block ${tallest} m is above the ${g.heightLimitM} m height limit.`);
  const status = unplaced.length === 0 && heightOk ? 'Fits' : 'Does not fit';
  const unplacedArea = unplaced.reduce((s, u) => s + u.areaM2, 0);

  return {
    cellM: c,
    geometry: g,
    envelope: { x: 0, y: 0, w: g.envW, h: g.envH },
    roads: { x: 0, y: g.envH, w: g.envW, h: g.roadsH, areaM2: g.innerW * g.roadsH },
    blocks: blocksM,
    unplaced,
    unplacedAreaM2: unplacedArea,
    budget: { netM2: g.netM2, landTakeM2, residualM2: g.netM2 - landTakeM2, parts: sz.area.parts },
    height: { tallestM: tallest, limitM: g.heightLimitM, ok: heightOk },
    status,
    notes,
  };
}
