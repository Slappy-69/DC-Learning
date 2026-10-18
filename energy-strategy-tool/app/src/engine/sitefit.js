// Site-fit outputs per option (BRIEF §10.6): status, area budget, land take on and off site, residual area,
// height check per zone, separation checklist, noise proxy, roof use and expansion headroom; plus the §15
// "Site fit" flags. Pure. Site fit is a status, never a weight: nothing here is read by scoring unless the
// optional site-fit penalty (§9.9, off by default) is switched on, and no option is hidden for not fitting.
//
// layoutFacts() holds the parts that depend only on the layout (shared by every option with the same block
// set); siteFitOf() adds the option's own parts (roof use, names, flags) and returns a compact summary.

import { separation, rectGapM, distRectPoint, tallestOf } from './layout.js';
import { SPATIAL, LABEL } from './defaults.js';
import { SOURCE_LABEL } from './blocks.js';
import { pointInRing, distPointRing, distBoxRing, nearestPointOnRing } from './geometry.js';

export const SITE_FIT_STATUSES = ['Fits', 'Fits with flags', 'Does not fit'];
export const NOISE_LABEL = 'screening proxy, not an acoustic assessment';
const TYPE_LABEL = {
  building: 'Data hall', substation: 'Substation', genset: 'Gensets', fuel: 'Fuel storage', bess: 'BESS', gasEngine: 'Engine plant', turbine: 'Gas turbines',
  fuelCell: 'Fuel cells', hydrogen: 'Hydrogen plant', heatRejection: 'Heat rejection', wind: 'Wind turbine', smr: 'SMR', solarGround: 'Ground solar',
};
const r1 = (x) => Math.round(x * 10) / 10;
const lp = (lw, r) => lw - 20 * Math.log10(Math.max(1, r)) - SPATIAL.noise.p.hemisphericalDb;
const dbSum = (levels) => (levels.length ? 10 * Math.log10(levels.reduce((a, l) => a + Math.pow(10, l / 10), 0)) : -Infinity);

// Parts that depend only on the layout and the blocks' rules.
export function layoutFacts(site, bs, L) {
  const blocks = bs.ground;
  const g = site.grid;
  const placed = L.placed;
  const rect = (p) => ({ x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 });
  const cellsOf = (p) => { const ks = []; for (let j = p.j0; j < p.j1; j++) for (let i = p.i0; i < p.i1; i++) ks.push(i + j * g.nx); return ks; };

  // ---- Separation checklist: each rule with the closest pair, pass / relaxed / fail ----
  const rules = new Map();
  const addRule = (key, label, requiredM, minM, actualM, kind, extra = {}) => {
    const cur = rules.get(key);
    if (!cur || actualM < cur.actualM) rules.set(key, { key, label, requiredM, minM, actualM, kind, ...extra });
  };
  for (let a = 0; a < placed.length; a++) {
    for (let b = a + 1; b < placed.length; b++) {
      const A = blocks[placed[a].index], B = blocks[placed[b].index];
      const req = separation(A, B, false);
      if (!(req > 0)) continue;
      const min = separation(A, B, true);
      const gap = rectGapM(placed[a], placed[b]);
      const pa = A.pair && A.pair[B.type], pb = B.pair && B.pair[A.type];
      let key, label;
      if ((pa && pa.m >= req - 1e-9) || (pb && pb.m >= req - 1e-9)) {
        const [X, Y] = pa && pa.m >= req - 1e-9 ? [A, B] : [B, A];
        key = `pair:${X.type}:${Y.type}`; label = `${TYPE_LABEL[X.type]} to ${TYPE_LABEL[Y.type].toLowerCase()}`;
      } else {
        const X = (A.clearanceM || 0) >= (B.clearanceM || 0) ? A : B;
        key = `clr:${X.type}`; label = `${TYPE_LABEL[X.type]} clearance to other blocks`;
      }
      addRule(key, label, req, min, gap, 'separation');
    }
  }
  for (const p of placed) {
    const B = blocks[p.index];
    if (B.boundaryM > 0) {
      let minB = Infinity;
      for (const k of cellsOf(p)) if (g.dBound[k] < minB) minB = g.dBound[k];
      addRule(`bnd:${B.type}`, `${TYPE_LABEL[B.type]} to the site boundary`, B.boundaryM, B.boundaryMinM, minB, 'boundary');
    }
  }
  const halls = placed.filter((p) => blocks[p.index].type === 'building');
  for (const p of placed) {
    const B = blocks[p.index];
    if (B.maxDistBuildingM && halls.length) {
      const gp = Math.min(...halls.map((h) => rectGapM(h, p)));
      const cur = rules.get('max:genset');
      if (!cur || gp > cur.actualM) rules.set('max:genset', { key: 'max:genset', label: `${TYPE_LABEL[B.type]} within ${B.maxDistBuildingM} m of the building`, requiredM: B.maxDistBuildingM, minM: null, actualM: gp, kind: 'maxDistance' });
    }
    if (B.pocPreferredM) {
      const d = distRectPoint(p, site.points.poc.uv);
      rules.set('poc', { key: 'poc', label: `Substation within ${B.pocPreferredM} m of the POC (preference)`, requiredM: B.pocPreferredM, minM: null, actualM: d, kind: 'preference' });
    }
    if (B.type === 'wind') {
      const c = [(p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2];
      const dB = Math.min(distPointRing(c, site.boundary.uv), halls.length ? Math.min(...halls.map((h) => distRectPoint(h, c))) : Infinity);
      const cur = rules.get('topple');
      if (!cur || dB < cur.actualM) rules.set('topple', { key: 'topple', label: `Wind topple buffer (${r1(B.toppleM)} m) to the boundary and buildings`, requiredM: B.toppleM, minM: null, actualM: dB, kind: 'flagOnly' });
      const rec = site.points.receptors;
      if (rec.length) {
        const dR = Math.min(...rec.map((x) => (x.kind === 'point' ? Math.hypot(c[0] - x.uv[0], c[1] - x.uv[1]) : (pointInRing(c, x.uv) ? 0 : distPointRing(c, x.uv)))));
        const cur2 = rules.get('windNoise');
        if (!cur2 || dR < cur2.actualM) rules.set('windNoise', { key: 'windNoise', label: `Wind noise buffer (${B.noiseBufferM} m) to receptors`, requiredM: B.noiseBufferM, minM: null, actualM: dR, kind: 'flagOnly' });
      }
    }
  }
  const separations = [...rules.values()].map((x) => {
    let status;
    if (x.kind === 'maxDistance' || x.kind === 'preference') status = x.actualM <= x.requiredM + 1e-6 ? 'pass' : (x.kind === 'preference' ? 'not met (preference)' : 'relaxed');
    else if (x.kind === 'flagOnly') status = x.actualM >= x.requiredM - 1e-6 ? 'pass' : 'fail';
    else status = x.actualM >= x.requiredM - 1e-6 ? 'pass' : (x.minM != null && x.actualM >= x.minM - 1e-6 ? 'relaxed' : 'fail');
    return { ...x, requiredM: r1(x.requiredM), minM: x.minM == null ? null : r1(x.minM), actualM: r1(x.actualM), status };
  }).sort((a, b) => (a.status === b.status ? a.label.localeCompare(b.label) : ['fail', 'relaxed', 'not met (preference)', 'pass'].indexOf(a.status) - ['fail', 'relaxed', 'not met (preference)', 'pass'].indexOf(b.status)));

  // ---- Height check per zone: tallest element in each zone against its limit ----
  const zones = [{ id: 'site', name: 'Site height limit', limitM: site.heightLimitM, ring: null }, ...site.heightZones.map((z) => ({ id: z.id, name: z.name, limitM: z.limitM, ring: z.uv }))];
  const zoneRows = zones.map((z) => ({ id: z.id, name: z.name, limitM: z.limitM, tallestM: null, element: null, status: 'no element' }));
  for (const p of placed) {
    const B = blocks[p.index];
    const t = tallestOf(B);
    const elem = B.type === 'wind' ? 'wind tip' : B.stackM && B.stackM > (B.heightM || 0) ? 'stack' : B.type === 'building' ? 'building + roof zone' : 'block';
    const box = rect(p);
    // Checked against every zone the block touches, and against the site limit unless it lies wholly inside a zone.
    const touching = zones.slice(1).filter((z) => pointInRing([(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2], z.ring) || distBoxRing(box, z.ring) === 0);
    const wholly = touching.some((z) => [[box.x0, box.y0], [box.x1, box.y0], [box.x1, box.y1], [box.x0, box.y1]].every((q) => pointInRing(q, z.ring)) && distBoxRing(box, z.ring) > 0);
    const targets = touching.map((z) => zoneRows.find((r) => r.id === z.id));
    if (!wholly) targets.push(zoneRows[0]);
    for (const row of targets) if (row && (row.tallestM == null || t > row.tallestM)) { row.tallestM = t; row.element = `${TYPE_LABEL[B.type]} (${elem})`; row.blockIndex = p.index; }
  }
  for (const row of zoneRows) if (row.tallestM != null) row.status = row.tallestM > row.limitM + 1e-9 ? 'exceeded' : 'pass';

  // ---- Noise proxy: geometric spreading only, from each noisy block to the nearest receptor and boundary ----
  const sources = [];
  for (const p of placed) {
    const B = blocks[p.index];
    if (!B.noise) continue;
    sources.push({ index: p.index, name: null, type: B.type, lwA: B.noise.lwA, kind: B.noise.kind, note: B.noise.note, at: [(p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2] });
  }
  const roofPlant = bs.roof.find((x) => x.type === 'roofPlant');
  if (roofPlant && halls.length && roofPlant.mw > 0) {
    const tot = halls.reduce((a, h) => a + (h.x1 - h.x0) * (h.y1 - h.y0), 0);
    for (const h of halls) {
      const share = ((h.x1 - h.x0) * (h.y1 - h.y0)) / tot;
      sources.push({ index: h.index, name: null, type: 'roofPlant', lwA: roofPlant.noise.lwAperMW + 10 * Math.log10(Math.max(1e-9, roofPlant.mw * share)), kind: 'continuous', note: 'roof heat rejection, day and night', at: [(h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2] });
    }
  }
  const recs = site.points.receptors;
  const recDistTo = (pt, x) => (x.kind === 'point' ? Math.hypot(pt[0] - x.uv[0], pt[1] - x.uv[1]) : (pointInRing(pt, x.uv) ? 0 : distPointRing(pt, x.uv)));
  for (const s of sources) {
    const nb = nearestPointOnRing(s.at, site.boundary.uv);
    s.boundaryM = r1(nb.dist);
    s.atBoundaryDbA = r1(lp(s.lwA, nb.dist));
    if (recs.length) {
      let best = null;
      for (const x of recs) { const d = recDistTo(s.at, x); if (!best || d < best.d) best = { d, name: x.name }; }
      s.receptorM = r1(best.d); s.receptor = best.name; s.atReceptorDbA = r1(lp(s.lwA, best.d));
    }
    s.lwA = r1(s.lwA);
  }
  const receptorLevels = recs.map((x) => {
    const cont = sources.filter((s) => s.kind === 'continuous').map((s) => lp(s.lwA, recDistTo(s.at, x)));
    const stby = sources.filter((s) => s.kind === 'standby').map((s) => lp(s.lwA, recDistTo(s.at, x)));
    return { name: x.name, normalDbA: cont.length ? r1(dbSum(cont)) : null, standbyDbA: stby.length ? r1(dbSum(stby)) : null };
  });
  // Highest normal-operation level on the boundary, sampled at the vertices, edge mid-points and the boundary
  // points nearest each source (information only; the flag is at receptors, §10.6).
  const samples = [];
  const ring = site.boundary.uv;
  for (let k = 0; k < ring.length; k++) { const a = ring[k], b = ring[(k + 1) % ring.length]; samples.push(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
  for (const s of sources) samples.push(nearestPointOnRing(s.at, ring).point);
  let boundaryMax = null;
  for (const pt of samples) {
    const cont = sources.filter((s) => s.kind === 'continuous').map((s) => lp(s.lwA, Math.hypot(pt[0] - s.at[0], pt[1] - s.at[1])));
    if (!cont.length) continue;
    const v = dbSum(cont);
    if (boundaryMax == null || v > boundaryMax) boundaryMax = v;
  }

  // ---- Area budget: land take by type (placed and not placed) against the net developable area ----
  const byType = new Map();
  const add = (key, label, placedM2, unplacedM2) => {
    const cur = byType.get(key) || { key, label, placedM2: 0, unplacedM2: 0 };
    cur.placedM2 += placedM2; cur.unplacedM2 += unplacedM2;
    byType.set(key, cur);
  };
  for (const p of placed) { const B = blocks[p.index]; add(B.source, SOURCE_LABEL[B.source], B.areaM2, 0); }
  for (const u of L.unplaced) { const B = blocks[u.index]; add(B.source, SOURCE_LABEL[B.source], 0, B.areaM2); }
  if (L.fill) add('solar', SOURCE_LABEL.solar, L.fill.areaM2, L.fill.shortfallM2 || 0);
  const parts = [...byType.values()].map((x) => ({ ...x, placedM2: Math.round(x.placedM2), unplacedM2: Math.round(x.unplacedM2) }));

  return {
    separations,
    heights: zoneRows,
    noise: { sources, receptorLevels, boundaryMaxDbA: boundaryMax == null ? null : r1(boundaryMax), label: NOISE_LABEL },
    parts,
    placedCount: placed.length,
  };
}

// Compact site-fit summary for one option (what the ranked list, the Pareto view, the flags and the run
// summary need). Names come from this option's own blocks (options sharing a layout can differ in names).
export function siteFitOf(ctx, site, bs, L, facts, v, sz) {
  const inputs = ctx.inputs;
  const blocks = bs.ground;
  const reasons = [];
  const flags = [];
  const nameOf = (i) => blocks[i].name;
  const f = (id, severity, message, extra = {}) => flags.push({ id, severity, category: 'Site fit', message, siteFit: true, ...extra });

  // Unplaced tray
  const unplaced = L.unplaced.map((u) => ({ index: u.index, name: nameOf(u.index), type: blocks[u.index].type, areaM2: Math.round(u.areaM2), reason: u.reason === 'budget' ? `net developable area used (${Math.round(u.remainingM2 ?? 0).toLocaleString('en-GB')} m² left)` : 'no position in the buildable envelope with the required clearances' }));
  const fillShort = L.fill && L.fill.shortfallM2 > 0 ? Math.round(L.fill.shortfallM2) : 0;
  const unplacedM2 = unplaced.reduce((a, u) => a + u.areaM2, 0) + fillShort;
  const fillM2 = L.fill ? L.fill.areaM2 : 0;
  const landTakeM2 = L.requiredM2 + fillM2 + fillShort;
  const netM2 = site.areas.netM2;
  const budgetShortfallM2 = Math.max(0, landTakeM2 - netM2);
  if (unplaced.length || fillShort) {
    const list = unplaced.map((u) => `${u.name} (${u.areaM2.toLocaleString('en-GB')} m²)`);
    if (fillShort) list.push(`ground PV (fixed MWp): ${fillShort.toLocaleString('en-GB')} m² of ${Math.round(L.fill.targetM2).toLocaleString('en-GB')} m² not placed`);
    reasons.push(`Does not fit: ${unplaced.length + (fillShort ? 1 : 0)} block${unplaced.length + (fillShort ? 1 : 0) === 1 ? '' : 's'} not placed, ${unplacedM2.toLocaleString('en-GB')} m² short`);
    f('site-does-not-fit', 'major', `Does not fit: ${list.join('; ')}; area shortfall ${unplacedM2.toLocaleString('en-GB')} m²${budgetShortfallM2 > 0 ? ` (land take ${(landTakeM2 / 10000).toFixed(2)} ha vs ${(netM2 / 10000).toFixed(2)} ha net developable)` : ''}`, { value: unplacedM2 });
  }

  // Relaxed rules, height, soft exclusion, genset distance (named)
  const relaxed = [];
  let heightExceeded = false;
  for (const p of L.placed) {
    for (const br of p.broken) {
      const B = blocks[p.index];
      // §6.3 BESS: "10 m to occupied buildings, 3 m between units unless test data supports less". The layout may
      // go down to the recorded minimum only as a named relaxation; the text states the condition.
      if (br.rule === 'separation') relaxed.push({ rule: 'separation', text: `${B.name} to ${nameOf(br.with)}: separation ${r1(br.defaultM)} m reduced to ${r1(br.actualM)} m (minimum ${r1(br.minM)} m)${B.type === 'bess' || (blocks[br.with] && blocks[br.with].type === 'bess') ? '; a BESS separation below the §6.3 default needs UL 9540A test data or a fire-rated barrier' : ''}` });
      else if (br.rule === 'boundary') relaxed.push({ rule: 'boundary', text: `${B.name} to the boundary: ${r1(br.defaultM)} m reduced to ${r1(br.actualM)} m (minimum ${r1(br.minM)} m)` });
      else if (br.rule === 'height') { heightExceeded = true; relaxed.push({ rule: 'height', text: `${B.name}: ${br.element === 'stack' ? 'stack' : 'height'} ${r1(br.heightM)} m above the ${r1(br.limitM)} m height limit` }); }
      else if (br.rule === 'soft') relaxed.push({ rule: 'soft', text: `${B.name} placed in a soft exclusion (${Math.round(br.areaM2).toLocaleString('en-GB')} m²)` });
      else if (br.rule === 'maxDistance') relaxed.push({ rule: 'maxDistance', text: `${B.name}: ${r1(br.actualM)} m from the building (rule ≤ ${r1(br.defaultM)} m)` });
    }
  }
  const sepRelaxed = relaxed.filter((x) => x.rule === 'separation' || x.rule === 'boundary');
  if (sepRelaxed.length) f('site-relaxed', 'minor', `Separation relaxed: ${sepRelaxed.map((x) => x.text).join('; ')}`);
  const hRel = relaxed.filter((x) => x.rule === 'height');
  if (hRel.length) f('site-height', 'minor', `Height limit exceeded: ${hRel.map((x) => x.text).join('; ')}`);
  const sRel = relaxed.filter((x) => x.rule === 'soft');
  if (sRel.length) f('site-soft', 'minor', `Block in soft exclusion: ${sRel.map((x) => x.text).join('; ')}`);
  const mRel = relaxed.filter((x) => x.rule === 'maxDistance');
  if (mRel.length) f('site-genset-distance', 'minor', `Genset adjacency relaxed: ${mRel.map((x) => x.text).join('; ')}`);
  // Height check rows that exceed (tallest element per zone), which also covers stacks and wind tips.
  for (const row of facts.heights) if (row.status === 'exceeded' && !hRel.length) { heightExceeded = true; f('site-height', 'minor', `Height limit exceeded: ${row.element} ${r1(row.tallestM)} m > ${row.limitM} m (${row.name})`); break; }
  // Ground solar in soft exclusions is allowed (configurable) and reported as information.
  if (L.fill && L.fill.softM2 > 0) f('site-soft-solar', 'info', `Ground PV uses ${Math.round(L.fill.softM2).toLocaleString('en-GB')} m² of soft exclusion (allowed for ground solar; other blocks only as a flagged relaxation)`);

  // Wind buffers (flag only), hydrogen and SMR (always flagged), off-site land
  const windFail = facts.separations.filter((x) => (x.key === 'topple' || x.key === 'windNoise') && x.status === 'fail');
  if (windFail.length) f('site-wind-buffer', 'minor', `Wind buffers not met: ${windFail.map((x) => `${x.label}: ${x.actualM} m achieved`).join('; ')}`);
  if (blocks.some((b) => b.type === 'hydrogen')) f('site-hydrogen', 'minor', `Hydrogen plant: hazardous-area separation ${SPATIAL.hydrogen.p.clearanceM} m applied (indicative — unverified); specialist input needed`);
  const off = bs.offsite;
  const offHa = off.reduce((a, x) => a + x.landHa, 0);
  if (off.some((x) => x.type === 'smr')) f('site-smr', 'info', 'SMR placed off site or on an adjacent site; emergency planning zone not modelled');
  if (offHa > site.offsite.landHa + 1e-9) f('site-offsite-land', 'minor', `Off-site land needed ${offHa.toFixed(2)} ha; ${site.offsite.landHa.toFixed(2)} ha entered as available`);

  // Noise proxy at receptors against the night threshold (normal operation; gensets reported separately).
  const thr = inputs.requirements.noiseNightDbA;
  const loud = facts.noise.receptorLevels.filter((x) => x.normalDbA != null && x.normalDbA > thr);
  if (loud.length) f('site-noise', 'minor', `Noise proxy above ${thr} dB(A) night at ${loud.map((x) => `${x.name} (${x.normalDbA} dB(A))`).join(', ')} (${NOISE_LABEL}). Screening flag, not a permitting determination.`, { category: 'Permitting', permitting: false, siteDerived: true });

  // Roof use (this option's rooftop PV and roof plant)
  const hallsPlaced = L.placed.filter((p) => blocks[p.index].type === 'building');
  const roofM2 = blocks.filter((b) => b.type === 'building').reduce((a, b) => a + b.areaM2, 0);
  const edge = SPATIAL.solarRoof.p.edgeSetbackM;
  const edgeM2 = blocks.filter((b) => b.type === 'building').reduce((a, b) => a + Math.max(0, b.w * b.h - Math.max(0, b.w - 2 * edge) * Math.max(0, b.h - 2 * edge)), 0);
  const plantM2 = bs.roof.filter((x) => x.type === 'roofPlant').reduce((a, x) => a + x.areaM2, 0);
  const pvM2 = bs.roof.filter((x) => x.type === 'solarRoof').reduce((a, x) => a + x.areaM2, 0);
  const freeM2 = roofM2 - plantM2 - pvM2 - edgeM2;
  const roof = { roofM2: Math.round(roofM2), plantM2: Math.round(plantM2), pvM2: Math.round(pvM2), edgeM2: Math.round(edgeM2), freeM2: Math.round(freeM2), overAllocated: freeM2 < -1 };
  if (roof.overAllocated) f('site-roof', 'minor', `Roof over-allocated: plant ${roof.plantM2.toLocaleString('en-GB')} + PV ${roof.pvM2.toLocaleString('en-GB')} + edge setback ${roof.edgeM2.toLocaleString('en-GB')} m² > roof ${roof.roofM2.toLocaleString('en-GB')} m²`);

  // Land-take ceiling (§5.5): flag only; a user value below the net developable area raises a minor flag.
  const ceilingHa = inputs.requirements.landTakeCeilingHa;
  if (ceilingHa != null && landTakeM2 > ceilingHa * 10000 + 1e-6) flags.push({ id: 'target-landtake', severity: 'minor', category: 'Targets and ceilings', message: `Land take above ceiling: ${(landTakeM2 / 10000).toFixed(2)} ha on site > ${ceilingHa} ha`, value: landTakeM2 / 10000, threshold: ceilingHa });

  // Status
  let status;
  const flagged = relaxed.length || heightExceeded || roof.overAllocated || windFail.length || flags.some((x) => ['site-hydrogen', 'site-smr', 'site-offsite-land', 'site-noise'].includes(x.id));
  if (unplaced.length || fillShort) status = 'Does not fit';
  else if (flagged) status = 'Fits with flags';
  else status = 'Fits';
  if (status === 'Fits with flags') {
    if (relaxed.length) reasons.push(`${relaxed.length} rule${relaxed.length === 1 ? '' : 's'} relaxed: ${relaxed.slice(0, 3).map((x) => x.text).join('; ')}${relaxed.length > 3 ? '; …' : ''}`);
    for (const x of flags) if (x.severity !== 'info' && !['site-relaxed', 'site-height', 'site-soft', 'site-genset-distance'].includes(x.id)) reasons.push(x.message.split('. Screening')[0]);
    for (const x of flags) if (x.severity === 'info' && ['site-smr'].includes(x.id)) reasons.push(x.message);
  }

  // Expansion headroom (estimate): more IT MW at the same land take per MW for the IT-scaling blocks
  // (everything except the substation, which follows the grid offer), in the residual net area.
  const subM2 = blocks.filter((b) => b.type === 'substation').reduce((a, b) => a + b.areaM2, 0);
  const perMW = sz.itMW > 0 ? (L.requiredM2 - subM2) / sz.itMW : Infinity;
  const residualM2 = Math.max(0, netM2 - L.placedM2 - fillM2);
  const headroomM2 = Math.max(0, netM2 - L.requiredM2);
  const expansionMW = status === 'Does not fit' || !(perMW > 0) ? 0 : Math.floor((headroomM2 / perMW) * 10) / 10;

  return {
    status,
    reasons,
    flags,
    unplaced,
    unplacedM2,
    relaxed,
    landTakeM2: Math.round(landTakeM2),
    landTakeHa: landTakeM2 / 10000,
    placedM2: Math.round(L.placedM2),
    fillM2: Math.round(fillM2),
    fillMWp: L.fill ? L.fill.mwp : 0,
    netM2: Math.round(netM2),
    budgetShortfallM2: Math.round(budgetShortfallM2),
    residualM2: Math.round(residualM2),
    offsite: off.map((x) => ({ name: x.name, type: x.type, landHa: x.landHa, distanceKm: x.distanceKm, note: x.note })),
    offsiteHa: offHa,
    roof,
    expansionMW,
    heightsExceeded: facts.heights.filter((x) => x.status === 'exceeded').length,
    blocks: blocks.length,
    placedBlocks: L.placed.length,
    label: LABEL,
  };
}

// Plain text for a status badge (status colours are always paired with an icon and text, §16).
export function siteFitIcon(status) { return status === 'Fits' ? '✓' : status === 'Fits with flags' ? '!' : '✗'; }
