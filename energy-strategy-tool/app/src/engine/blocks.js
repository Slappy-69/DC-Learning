// Blocks (BRIEF §10.3): each technology instance in an option becomes one or more rectangular blocks
// with a footprint, height, clearance ring and type (§6.3 spatial defaults, all indicative — unverified).
//  - Building massing from the §5.3 density rules (sizing.js): one block per phase, split into equal halls
//    above a maximum hall footprint.
//  - Unit-based technologies (gensets, BESS containers, engines, fuel cells, heat-rejection modules) are
//    grouped into arrays with a row/column arrangement.
//  - Rooftop blocks (PV, roof plant) sit on the building and count toward its height (they are listed with
//    the building, not placed on the ground).
//  - Off-site blocks (SMR by default, off-site wind) go to the off-site tray with land take and
//    private-wire distance and do not consume site area.
//  - Ground solar is a fill (C10 "Roof + fill residual ground": the residual area after every other block;
//    C10 "Fixed MWp": a target area), placed last (§10.4 step 2.8).
// Pure: (ctx or { inputs, phases }, choice vector, sizing) -> block set. No positions here (layout.js).

import { TECH, SPATIAL, choiceLabel } from './defaults.js';

// Energy-source colour keys (§16 signature colour system; tokens --src-* in styles.css).
export const SOURCE_KEYS = ['building', 'grid', 'diesel', 'gas', 'fuel', 'bess', 'fuelCell', 'hydrogen', 'cooling', 'solar', 'wind', 'nuclear'];
export const SOURCE_LABEL = {
  building: 'Data hall building', grid: 'Grid / substation', diesel: 'Diesel / HVO gensets', gas: 'Gas plant and gas gensets', fuel: 'Fuel storage',
  bess: 'Battery storage (BESS)', fuelCell: 'Fuel cells', hydrogen: 'Hydrogen', cooling: 'Heat rejection', solar: 'Solar PV', wind: 'Wind', nuclear: 'Nuclear (SMR)',
};
// §10.4 step 2 priority order.
export const PRIORITY = { building: 1, substation: 2, genset: 3, fuel: 3, firm: 4, bess: 5, heatRejection: 6, wind: 7, solar: 8 };
export const PRIORITY_LABEL = {
  1: 'Building', 2: 'Substation (nearest to the POC)', 3: 'Backup gensets and fuel storage (adjacent to the building)',
  4: 'Firm generation (near the gas main, away from receptors)', 5: 'BESS (near the substation)', 6: 'Heat rejection (ground)', 7: 'Wind turbines', 8: 'Ground solar (fills the remaining area)',
};

const S = (id) => SPATIAL[id].p;
const lw = (area, ratio) => { const L = Math.sqrt(area * ratio); return [L, area / L]; };
const db = (lw0, n) => lw0 + 10 * Math.log10(Math.max(1, n));

// Split `count` units into arrays of at most `max` units and at most sp.maxArrayM2 (at least one unit per
// array), as even as possible, each `rows` deep.
function arrays(count, max, rows, unitArea = 0, maxArea = Infinity) {
  if (!(count > 0)) return [];
  if (unitArea > 0 && Number.isFinite(maxArea)) max = Math.max(1, Math.min(max, Math.floor(maxArea / unitArea + 1e-9)));
  const k = Math.ceil(count / max);
  const out = [];
  let left = count;
  for (let i = 0; i < k; i++) {
    const units = Math.ceil(left / (k - i));
    left -= units;
    const r = Math.min(rows, units);
    out.push({ units, rows: r, cols: Math.ceil(units / r) });
  }
  return out;
}

// One array block from a unit cell (area m², L:W) and an arrangement.
function arrayBlock(base, unitArea, unitLw, arr) {
  const [uL, uW] = lw(unitArea, unitLw);
  const w = arr.cols * uL, h = arr.rows * uW;
  return { ...base, w, h, areaM2: w * h, units: arr.units, rows: arr.rows, cols: arr.cols, unitL: uL, unitW: uW, unitAreaM2: unitArea, isArray: true };
}

const BRIDGE_TYPE = { gasRecip: 'gasEngine', chp: 'gasEngine', rented: 'gasEngine', dieselPrime: 'gasEngine', gasTurbine: 'turbine', fuelCell: 'fuelCell', hydrogen: 'hydrogen' };
const SOURCE_OF_TECH = { gasRecip: 'gas', chp: 'gas', rented: 'gas', gasTurbine: 'gas', dieselPrime: 'diesel', fuelCell: 'fuelCell', hydrogen: 'hydrogen', smr: 'nuclear', backupDiesel: 'diesel', backupHvo: 'diesel', backupGas: 'gas' };

// Firm plant (prime or bridging) as unit arrays.
function plantBlocks(plant, roleLabel, sp, push) {
  const t = TECH[plant.tech];
  const type = BRIDGE_TYPE[plant.tech];
  const P = S(type);
  const unitArea = plant.unitMW * t.p.m2PerMW;
  const containerised = plant.tech === 'rented' || plant.tech === 'dieselPrime';
  const height = type === 'gasEngine' ? (containerised ? P.containerHeightM : P.heightM) : P.heightM;
  const noisePerUnit = type === 'fuelCell' || type === 'hydrogen' ? db(P.noiseLwA, plant.unitMW) : P.noiseLwA;
  const arrs = arrays(plant.units, sp.maxUnits, sp.rows, unitArea, sp.maxArrayM2);
  arrs.forEach((arr, k) => {
    push(arrayBlock({
      group: 'firm', type, source: SOURCE_OF_TECH[plant.tech] || 'gas', priority: PRIORITY.firm,
      name: `${t.name} (${roleLabel})${arrs.length > 1 ? `, array ${k + 1} of ${arrs.length}` : ''} · ${arr.units} × ${plant.unitMW} MW`,
      heightM: height, stackM: t.p.stackM || null,
      clearanceM: P.clearanceM, clearanceMinM: P.clearanceMinM ?? P.clearanceM, relaxable: type !== 'hydrogen',
      boundaryM: P.sepBoundaryM || 0, boundaryMinM: P.sepBoundaryMinM ?? P.sepBoundaryM ?? 0,
      anchor: 'firm', usesGas: t.fuel === 'gas',
      noise: { lwA: db(noisePerUnit, arr.units), kind: 'continuous', note: roleLabel === 'bridging' ? 'counted as running (bridging period)' : 'running' },
      techId: plant.tech, role: roleLabel,
    }, unitArea, P.unitLw, arr));
  });
}

// Block set for one option. `ctx` needs inputs and phases (the run context or a light stand-in).
export function buildBlocks(ctx, v, sz) {
  const inputs = ctx.inputs;
  const L = inputs.load;
  const sp = S('unitArrays');
  const ground = [];
  const roof = [];
  const offsite = [];
  const notes = [];
  const push = (b) => { ground.push({ index: ground.length, ...b }); };

  // ---- 1. Building (§5.3 massing): one block per phase, halls above the maximum hall footprint ----
  const B = S('building');
  const totalFoot = sz.building.footprintM2;
  const heightM = sz.building.heightM;
  // C18 = in-building plant room: the gensets' footprint is added to the ground floor of the halls.
  let plantRoomM2 = 0;
  if (sz.backup.tech && v.C18 === 'inBuilding') {
    const units = v.C5 === 'bessUps' ? sz.backup.nUnits : sz.backup.units;
    plantRoomM2 = units * TECH[sz.backup.tech].p.m2PerUnit;
    notes.push(`In-building genset plant room: ${Math.round(plantRoomM2).toLocaleString('en-GB')} m² added to the ground floor of the data halls.`);
  }
  const phases = (ctx.phases && ctx.phases.length ? ctx.phases : [{ it: sz.itMW, m: 0 }]).filter((p) => p.it > 0);
  const itSum = phases.reduce((a, p) => a + p.it, 0) || 1;
  const parts = B.splitByPhase ? phases.map((p, i) => ({ share: p.it / itSum, label: `phase ${i + 1}` })) : [{ share: 1, label: 'all phases' }];
  let hallNo = 0;
  const hallsTotal = parts.reduce((a, p) => a + Math.max(1, Math.ceil((p.share * (totalFoot + plantRoomM2)) / B.maxHallM2 - 1e-9)), 0);
  for (const p of parts) {
    const foot = p.share * (totalFoot + plantRoomM2);
    const halls = Math.max(1, Math.ceil(foot / B.maxHallM2 - 1e-9));
    for (let k = 0; k < halls; k++) {
      hallNo++;
      const area = foot / halls;
      const [w, h] = lw(area, B.lw);
      push({
        group: 'building', type: 'building', source: 'building', priority: PRIORITY.building,
        name: `Data hall ${hallNo}${hallsTotal > 1 ? ` of ${hallsTotal}` : ''} (${p.label}${halls > 1 ? `, hall ${k + 1} of ${halls}` : ''})${plantRoomM2 > 0 ? ' incl. genset plant room' : ''}`,
        w, h, areaM2: area, heightM, stackM: null,
        clearanceM: B.clearanceM, clearanceMinM: B.clearanceMinM, relaxable: true, boundaryM: 0, boundaryMinM: 0,
        anchor: 'farFromPoc', noise: null,
      });
    }
  }

  // ---- 2. Substation (grid connection at the offered capacity, §9.2) ----
  const fullMW = inputs.grid.fullMW;
  if (fullMW > 0) {
    const sub = TECH.substation.p, P = S('substation');
    const band = sz.grid.band;
    const gis = v.C17 === 'GIS';
    let area, height, clr, clrMin, label;
    if (band === 'mv') { area = sub.m2Per20MVA_mv * (fullMW / 0.9 / 20); height = P.mvHeightM; clr = P.mvClearanceM; clrMin = P.mvClearanceMinM; label = '11–33 kV'; }
    else if (band === 'hv') { area = (gis ? sub.haGIS_hv : sub.haAIS_hv) * 10000; height = gis ? P.hvGisHeightM : P.hvAisHeightM; clr = P.hvClearanceM; clrMin = P.hvClearanceMinM; label = `110–150 kV ${v.C17}`; }
    else { area = (gis ? sub.haGIS_ehv : sub.haAIS_ehv) * 10000; height = gis ? P.ehvGisHeightM : P.ehvAisHeightM; clr = P.hvClearanceM; clrMin = P.hvClearanceMinM; label = `220–400 kV ${v.C17}`; }
    const [w, h] = lw(area, P.lw);
    push({
      group: 'substation', type: 'substation', source: 'grid', priority: PRIORITY.substation,
      name: `Substation ${label} (${Math.round(fullMW)} MW offered)`, w, h, areaM2: area, heightM: height, stackM: null,
      clearanceM: clr, clearanceMinM: clrMin, relaxable: true, boundaryM: 0, boundaryMinM: 0, anchor: 'poc',
      pocPreferredM: band === 'mv' ? null : P.pocPreferredM, band,
      noise: { lwA: band === 'mv' ? P.noiseLwAmv : P.noiseLwA, kind: 'continuous', note: 'transformers' },
    });
  }

  // ---- 3. Backup gensets (arrays, adjacent to the building) and bulk fuel storage ----
  if (sz.backup.tech && v.C18 !== 'inBuilding') {
    const t = TECH[sz.backup.tech], P = S('genset');
    const units = v.C5 === 'bessUps' ? sz.backup.nUnits : sz.backup.units;
    const dbl = v.C18 === 'double';
    const positions = dbl ? Math.ceil(units / 2) : units; // double-deck: two units stacked per position
    const unitArea = t.p.m2PerUnit;
    const arrs = arrays(positions, sp.maxUnits, sp.rows, unitArea, sp.maxArrayM2);
    let left = units;
    arrs.forEach((arr, k) => {
      const nUnits = dbl ? Math.min(left, arr.units * 2) : arr.units;
      left -= nUnits;
      push(arrayBlock({
        group: 'genset', type: 'genset', source: SOURCE_OF_TECH[t.id] || 'diesel', priority: PRIORITY.genset,
        name: `${choiceLabel('C5', v.C5)}${dbl ? ', double-deck' : ''}${arrs.length > 1 ? `, array ${k + 1} of ${arrs.length}` : ''} · ${nUnits} × ${t.p.unitMW} MW`,
        heightM: dbl ? P.doubleDeckHeightM : P.heightM, stackM: t.p.stackM || null,
        clearanceM: P.clearanceM, clearanceMinM: P.clearanceMinM, relaxable: true, boundaryM: 0, boundaryMinM: 0,
        anchor: 'building', maxDistBuildingM: P.maxDistBuildingM,
        noise: { lwA: db(P.noiseLwA, nUnits), kind: 'standby', note: 'standby: runs in outages and daytime tests' },
        doubleDeck: dbl, unitsTotal: nUnits,
      }, unitArea, P.unitLw, arr));
      ground[ground.length - 1].units = nUnits;
    });
  }
  if (sz.backup.fuelM3 > 0) {
    const P = S('fuel');
    const area = sz.backup.fuelM3 * TECH.fuelStorage.p.m2PerM3;
    const [w, h] = lw(area, P.lw);
    push({
      group: 'fuel', type: 'fuel', source: 'fuel', priority: PRIORITY.fuel,
      name: `Bulk fuel storage · ${Math.round(sz.backup.fuelM3).toLocaleString('en-GB')} m³`, w, h, areaM2: area, heightM: P.heightM, stackM: null,
      clearanceM: P.clearanceM, clearanceMinM: P.clearanceMinM, relaxable: true,
      pair: { building: { m: P.sepBuildingM, min: P.sepBuildingMinM } },
      boundaryM: P.sepBoundaryM, boundaryMinM: P.sepBoundaryMinM, anchor: 'fuel', noise: null,
    });
  }

  // ---- 4. Firm generation: prime (C4) and bridging (C1/C2) plant ----
  if (sz.prime) {
    if (sz.prime.tech === 'smr' && S('smr').placement !== 'onsite') {
      offsite.push({ type: 'smr', source: 'nuclear', name: `${TECH.smr.name} · ${Math.round(sz.prime.mw)} MW`, landHa: (sz.prime.mw / 100) * S('smr').haPer100MW, distanceKm: ctx.site ? ctx.site.offsite.distanceKm : inputs.site.offsiteDistanceKm, heightM: S('smr').heightM, note: 'Off-site or adjacent site (§6.2); emergency planning zone not modelled.' });
    } else if (sz.prime.tech === 'smr') {
      const area = (sz.prime.mw / 100) * S('smr').haPer100MW * 10000;
      const [w, h] = lw(area, 1.5);
      push({ group: 'firm', type: 'smr', source: 'nuclear', priority: PRIORITY.firm, name: `${TECH.smr.name} · ${Math.round(sz.prime.mw)} MW`, w, h, areaM2: area, heightM: S('smr').heightM, stackM: null, clearanceM: 10, clearanceMinM: 10, relaxable: false, boundaryM: 0, boundaryMinM: 0, anchor: 'firm', noise: null });
    } else plantBlocks(sz.prime, 'prime', sp, push);
  }
  if (sz.bridge && sz.bridge.units > 0) plantBlocks(sz.bridge, 'bridging', sp, push);

  // ---- 5. BESS (C12, bridging BESS, BESS-augmented UPS) near the substation ----
  const bessMWh = sz.storage.mwh + (sz.backup.bessMWh || 0);
  if (bessMWh > 1e-9) {
    const P = S('bess');
    const units = Math.ceil(bessMWh / P.unitMWh - 1e-9);
    const unitArea = P.unitMWh * TECH.bess.p.m2PerMWh;
    const arrs = arrays(units, sp.maxUnits, sp.rows, unitArea, sp.maxArrayM2);
    arrs.forEach((arr, k) => push(arrayBlock({
      group: 'bess', type: 'bess', source: 'bess', priority: PRIORITY.bess,
      name: `BESS${arrs.length > 1 ? `, array ${k + 1} of ${arrs.length}` : ''} · ${arr.units} × ${P.unitMWh} MWh containers`,
      heightM: P.heightM, stackM: null, clearanceM: P.clearanceM, clearanceMinM: P.clearanceMinM, relaxable: true,
      pair: { building: { m: P.sepBuildingM, min: P.sepBuildingMinM } }, boundaryM: 0, boundaryMinM: 0, anchor: 'substation',
      noise: { lwA: db(P.noiseLwA, arr.units), kind: 'continuous', note: 'PCS and HVAC' },
    }, unitArea, P.unitLw, arr)));
  }

  // ---- 6. Heat rejection: ground share as module arrays; roof share as roof plant ----
  const hrShareGround = v.C9 === 'ground' ? 1 : v.C9 === 'split' ? 0.5 : 0;
  const rejected = sz.rejectedMW || 0;
  const HR = S('heatRejection');
  if (rejected > 0 && hrShareGround > 0) {
    const mw = rejected * hrShareGround;
    const modules = Math.ceil(mw / HR.moduleMW - 1e-9);
    const unitArea = HR.moduleMW * TECH.heatRejection.p.m2PerMW;
    const arrs = arrays(modules, sp.maxUnits, sp.rows, unitArea, sp.maxArrayM2);
    arrs.forEach((arr, k) => push(arrayBlock({
      group: 'heatRejection', type: 'heatRejection', source: 'cooling', priority: PRIORITY.heatRejection,
      name: `Heat rejection (ground)${arrs.length > 1 ? `, array ${k + 1} of ${arrs.length}` : ''} · ${arr.units} × ${HR.moduleMW} MW modules`,
      heightM: HR.heightM, stackM: null, clearanceM: HR.clearanceM, clearanceMinM: HR.clearanceMinM, relaxable: true, boundaryM: 0, boundaryMinM: 0,
      anchor: 'building', noise: { lwA: db(HR.noiseLwAperMW, arr.units * HR.moduleMW), kind: 'continuous', note: 'dry coolers, day and night' },
    }, unitArea, HR.unitLw, arr)));
  }
  const roofM2 = sz.building.footprintM2;
  const roofShare = v.C9 === 'roof' ? 1 : v.C9 === 'split' ? 0.5 : 0;
  if (roofShare > 0) {
    const byFraction = TECH.heatRejection.p.roofPlantFraction * roofShare * roofM2;
    const byFootprint = rejected * roofShare * TECH.heatRejection.p.m2PerMW;
    roof.push({ type: 'roofPlant', source: 'cooling', name: `Roof plant: heat rejection (${v.C9})`, areaM2: Math.max(byFraction, byFootprint), byFraction, byFootprint, mw: rejected * roofShare, noise: { lwAperMW: HR.noiseLwAperMW } });
  }
  if (sz.solarRoofMWp > 0) {
    roof.push({ type: 'solarRoof', source: 'solar', name: `Rooftop PV · ${sz.solarRoofMWp.toFixed(2)} MWp`, areaM2: sz.solarRoofMWp * 1000 * TECH.solarRoof.p.m2PerKWp, mwp: sz.solarRoofMWp, heightAboveRoofM: S('solarRoof').heightAboveRoofM });
  }

  // ---- 7. Wind turbines (C11): on site as pads with buffers (flag only); off-site land to the tray ----
  if (sz.windTurbines > 0 && v.C11 === 'fit') {
    const W = S('wind'), t = TECH.wind.p;
    const side = Math.sqrt(W.padM2);
    for (let k = 0; k < sz.windTurbines; k++) push({
      group: 'wind', type: 'wind', source: 'wind', priority: PRIORITY.wind,
      name: `Wind turbine ${k + 1} · ${t.turbineMW} MW, tip ${t.tipHeightM} m`, w: side, h: side, areaM2: W.padM2, heightM: t.tipHeightM, stackM: null,
      clearanceM: 0, clearanceMinM: 0, relaxable: true, boundaryM: 0, boundaryMinM: 0, anchor: 'farFromBoundary',
      toppleM: t.toppleFactor * t.tipHeightM, noiseBufferM: W.noiseBufferM,
      noise: { lwA: W.noiseLwA, kind: 'continuous', note: 'turbine' },
    });
  } else if (sz.windTurbines > 0 && v.C11 === 'offsite') {
    offsite.push({ type: 'wind', source: 'wind', name: `Wind (off-site) · ${sz.windTurbines} × ${TECH.wind.p.turbineMW} MW`, landHa: sz.windTurbines * TECH.wind.p.haPerTurbine, distanceKm: ctx.site ? ctx.site.offsite.distanceKm : inputs.site.offsiteDistanceKm, note: 'Spacing area per turbine; pads take 0.1 ha each.' });
  }

  // ---- 8. Ground solar fill ----
  let fill = null;
  if (v.C10 === 'roofResidual') fill = { mode: 'residual', targetM2: null, haPerMWp: TECH.solarGround.p.haPerMWp };
  else if (v.C10 === 'fixed' && sz.solarGroundMWp > 0) fill = { mode: 'fixed', targetM2: sz.solarGroundMWp * TECH.solarGround.p.haPerMWp * 10000, haPerMWp: TECH.solarGround.p.haPerMWp };
  if (fill) {
    const P = S('solarGround');
    Object.assign(fill, { type: 'solarGround', source: 'solar', priority: PRIORITY.solar, clearanceM: P.clearanceM, heightM: P.heightM, minArrayM: P.minArrayM, softAllowed: inputs.site.softUsableBySolar !== false });
  }

  return { ground, roof, offsite, fill, notes, roofM2, buildingHeightM: heightM };
}

// Layout key: everything placement depends on (geometry, rules, anchors, noise levels), nothing else
// (names, technology labels), so options with the same blocks share one layout (§17 timing).
export function blockSetKey(bs) {
  const r = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
  const g = bs.ground.map((b) => [b.type, b.group, r(b.w), r(b.h), r(b.heightM), r(b.stackM), r(b.clearanceM), r(b.clearanceMinM), b.relaxable ? 1 : 0,
    r(b.boundaryM), r(b.boundaryMinM), b.anchor, r(b.maxDistBuildingM), b.pair ? JSON.stringify(b.pair) : null, b.usesGas ? 1 : 0,
    b.noise ? [r(b.noise.lwA), b.noise.kind] : null, r(b.toppleM), r(b.noiseBufferM), r(b.pocPreferredM)]);
  const f = bs.fill ? [bs.fill.mode, r(bs.fill.targetM2), r(bs.fill.clearanceM), r(bs.fill.minArrayM), bs.fill.softAllowed ? 1 : 0] : null;
  return JSON.stringify([g, f]);
}
