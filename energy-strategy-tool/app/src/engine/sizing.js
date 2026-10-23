// Sizing rules (BRIEF §9.2): choice vector -> installed capacities, plant list for dispatch,
// and plain sizing sentences. Every option is sized by the same rules before any check.
// The grid connection is the offered capacity per period and is never resized.

import { TECH, COOLING, SPATIAL, choiceLabel } from './defaults.js';
import { designDemandByMonth, demandYear } from './context.js';
import { NA } from './generator.js';
import { permittingTriggers, permitRegimes, permitOutlookItem } from './permitting.js';

const r1 = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));

// Programme months from the analysis start (day one of the project). Plant is ordered from day one, in parallel
// with construction of the first phase (owner, 2026-10-22, OPEN-QUESTIONS 44): procurement + construction, after a
// permitting allowance only for plant that needs significant environmental permitting (IED, Seveso; OPEN-QUESTIONS
// 45; `permitM`, see permitting.js). Technologies with a consent of their own (wind, ground solar, SMR) keep their
// planning months (OPEN-QUESTIONS 56, 2026-10-23).
export function programmeMonths(t, permitM = 0) {
  const before = t.ownConsent ? (t.p.planM || 0) : permitM;
  return before + (t.p.procM || 0) + (t.p.buildM || 0);
}

// Month a technology can first supply (BRIEF §9.8 "supply available date per source"): its programme months, or
// its earliest-availability date if later. One rule for every source, batteries included: the bridging battery's
// availMonth below, time-to-power (evaluate.js), dispatch (dispatch.js) and the capex years (evaluate.js) all read
// this month (port of e1161ce).
export function techAvailMonth(ctx, t, permitM = 0) {
  let m = programmeMonths(t, permitM);
  if (t.p.earliestYear) {
    const em = (t.p.earliestYear - ctx.baseYear) * 12 - (ctx.startMonth - 1);
    m = Math.max(m, em);
  }
  return m;
}

// Month from which the fuel is available (Infinity = not available at current inputs).
export function fuelAvailMonth(ctx, fuel) {
  const u = ctx.inputs.utilities;
  if (fuel === 'gas') return u.gasAvailable === 'No' ? Infinity : ctx.gasM;
  if (fuel === 'hydrogen') return u.hydrogenAvailable === 'Yes' ? 0 : Infinity;
  return 0;
}

const BRIDGE_TECH = { gasRecip: 'gasRecip', gasTurbine: 'gasTurbine', fuelCell: 'fuelCell', dieselPrime: 'dieselPrime', rented: 'rented' };
const PRIME_TECH = { chp: 'chp', gasRecip: 'gasRecip', fuelCell: 'fuelCell', smr: 'smr', hydrogen: 'hydrogen' };
const BACKUP_TECH = { diesel: 'backupDiesel', hvo: 'backupHvo', gas: 'backupGas', bessUps: 'backupHvo' };

export function voltageBand(ctx, mw) {
  const s = TECH.substation.p;
  if (mw < s.bandMvMaxMW) return 'mv';
  if (mw <= s.bandHvMaxMW) return 'hv';
  return 'ehv';
}

function unitsWithRedundancy(n, topology, blockSize, catcherN) {
  const B = Math.ceil(n / blockSize);
  switch (topology) {
    case 'N': return { total: n, blocks: B, extra: 0 };
    case 'N+1': return { total: n + B, blocks: B, extra: B };
    case '2N': return { total: 2 * n, blocks: B, extra: n };
    case 'catcher': return { total: n + Math.ceil(B / catcherN), blocks: B, extra: Math.ceil(B / catcherN) };
    default: return { total: n + B, blocks: B, extra: B };
  }
}

export function sizeOption(ctx, v) {
  const inputs = ctx.inputs;
  const L = inputs.load;
  const req = inputs.requirements;
  const sentences = [];
  const coolingId = v.C8;
  const cp = ctx.cooling[coolingId];
  const cool = COOLING[coolingId];
  const { arr: designByMonth, peakPUE } = designDemandByMonth(ctx, coolingId);
  const itMW = L.itMW;
  const designMW = itMW * (peakPUE + L.ancillaryFrac);
  sentences.push(`Design facility load: ${r1(itMW)} MW IT × peak PUE ${peakPUE.toFixed(3)} (${cool.name}, design-day ${cool.p.tempBasis === 'wetbulb' ? 'wet-bulb' : 'dry-bulb'} ${(cool.p.tempBasis === 'wetbulb' ? ctx.prof.designWetbulb : ctx.prof.designTemp).toFixed(1)} °C) + ancillary ${(L.ancillaryFrac * 100).toFixed(0)} % = ${r1(designMW)} MW.`);

  // Steady-state year average facility load (for firm prime and PPA sentences).
  const lastChangeM = Math.max(ctx.lastPhaseM + L.rampMonths, 0);
  const ssYear = Math.min(Math.ceil((lastChangeM + 1) / 12), Math.floor(ctx.nMonths / 12) - 1);
  const ssDem = demandYear(ctx, coolingId, ssYear);
  const avgMW = ssDem.sum / 8760;

  // --- Building massing (for roof PV and the area budget) ---
  const whitespace = (itMW * 1000) / cool.p.densityKWm2;
  const gfa = whitespace * L.grossUp;
  const footprint = gfa / L.storeys;
  const heightM = L.storeys * L.storeyHeightM + L.roofZoneM;

  // --- Critical load and backup (§9.2) ---
  const criticalMW = req.backedPct * itMW * (1 + cp.coolPeak);
  sentences.push(`Critical load for backup: ${(req.backedPct * 100).toFixed(0)} % × (${r1(itMW)} MW IT + ${r1(itMW * cp.coolPeak)} MW mechanical at design) = ${r1(criticalMW)} MW.`);
  const backup = { tech: null, units: 0, unitMW: 0, mw: 0, nUnits: 0, fuelM3: 0, autonomyH: 0, bessMW: 0, bessMWh: 0, topology: v.C6 };
  if (v.C5 === 'none') sentences.push('Backup: none (flagged).');

  // --- Grid connection: offered capacity per period, never resized (§9.2) ---
  const gridByMonth = ctx.gridCap; // shared array: identical for every option
  const fullMW = inputs.grid.fullMW;
  const band = voltageBand(ctx, fullMW);

  // --- Firm prime (C4) ---
  let prime = null;
  if (v.C4 !== 'none') {
    const t = TECH[PRIME_TECH[v.C4]];
    const avail = techAvailMonth(ctx, t);
    const fuelM = fuelAvailMonth(ctx, t.fuel);
    if (v.C4s === 'shortfall') {
      // Top-up plant (OPEN-QUESTIONS 58, 2026-10-23): the permanent shortfall, design load less the full grid capacity
      // from the full grid date on (islanded: the whole design load), plus N+1 per block, as bridging plant.
      const T0 = ctx.fullGridM;
      let S = 0, sM = -1;
      for (let m = v.C1 === 'islanded' ? 0 : Math.max(0, T0); m < ctx.nMonthsTimeline; m++) {
        const s = designByMonth[m] - (v.C1 === 'islanded' ? 0 : ctx.gridCap[m]);
        if (s > S) { S = s; sM = m; }
      }
      const n = Math.max(1, Math.ceil(S / t.p.unitMW - 1e-9));
      const extra = Math.ceil(n / req.blockSize);
      const units = n + extra;
      prime = { role: 'prime', tech: t.id, mw: units * t.p.unitMW, units, nUnits: n, unitMW: t.p.unitMW, availMonth: avail, fuelMonth: fuelM, sizing: 'shortfall', shortfallMW: S, shortfallMonth: sM };
      sentences.push(`${t.name} (firm top-up): ${v.C1 === 'islanded' ? `design load ${r1(S)} MW (islanded)` : `permanent shortfall (design load − full grid capacity, from month ${T0}) ${r1(S)} MW${sM >= 0 ? ` in month ${sM}` : ''}`} ÷ ${t.p.unitMW} MW = ${n} units + N+1 per block of ${req.blockSize} (+${extra}) = ${units} units (${r1(prime.mw)} MW).`);
    } else {
      const frac = v.C4 === 'chp' ? t.p.sizeFraction : 1.0;
      const target = frac * avgMW;
      const units = Math.max(1, Math.round(target / t.p.unitMW));
      const mw = units * t.p.unitMW;
      prime = { role: 'prime', tech: t.id, mw, units, unitMW: t.p.unitMW, availMonth: avail, fuelMonth: fuelM, sizing: 'average' };
      sentences.push(`${t.name} (firm prime): ${(frac * 100).toFixed(0)} % of steady-state average facility load ${r1(avgMW)} MW = ${r1(target)} MW → ${units} × ${t.p.unitMW} MW = ${r1(mw)} MW.`);
    }
  }

  // --- Bridging (C1/C2) ---
  let bridge = null;
  // Bridging battery (C2 = BESS + solar): supplies from the BESS programme month, like every other source (§9.8).
  const bessAvailMonth = techAvailMonth(ctx, TECH.bess);
  let bridgeBess = { mw: 0, mwh: 0, availMonth: bessAvailMonth };
  const T = ctx.fullGridM; // grid full-connection month
  if (v.C1 === 'bridge' || v.C1 === 'islanded') {
    let S = 0;
    let sMonth = -1;
    const horizon = v.C1 === 'islanded' ? ctx.nMonthsTimeline : Math.min(T, ctx.nMonthsTimeline);
    for (let m = 0; m < Math.max(horizon, 1); m++) {
      const cap = v.C1 === 'islanded' ? 0 : gridByMonth[m];
      const s = Math.max(0, designByMonth[m] - cap);
      if (s > S) { S = s; sMonth = m; }
    }
    if (v.C1 === 'islanded') S = Math.max(S, designMW);
    if (v.C2 === 'bessSolar') {
      bridgeBess = { mw: S, mwh: S * inputs.settings.bridgeBessHours, availMonth: bessAvailMonth };
      sentences.push(`Bridging BESS + solar: largest shortfall ${r1(S)} MW → BESS ${r1(S)} MW / ${r1(bridgeBess.mwh)} MWh (${inputs.settings.bridgeBessHours} h), PV per C10; supplies from month ${bessAvailMonth} (BESS planning, procurement and construction, §9.8), the month time-to-power and dispatch use.`);
    } else if (S > 0) {
      const t = TECH[BRIDGE_TECH[v.C2]];
      const n = Math.ceil(S / t.p.unitMW - 1e-9);
      const extra = Math.ceil(n / req.blockSize);
      const total = n + extra;
      const avail = techAvailMonth(ctx, t);
      const fuelM = fuelAvailMonth(ctx, t.fuel);
      bridge = { role: 'bridge', tech: t.id, mw: total * t.p.unitMW, units: total, nUnits: n, unitMW: t.p.unitMW, availMonth: avail, fuelMonth: fuelM, shortfallMW: S, shortfallMonth: sMonth };
      sentences.push(`Bridging ${t.name}: ${v.C1 === 'islanded' ? 'on-site supply of design load' : `largest shortfall (design demand − offered grid) ${r1(S)} MW in month ${sMonth}`} ÷ ${t.p.unitMW} MW = ${n} units + N+1 per block of ${req.blockSize} (+${extra}) = ${total} units (${r1(bridge.mw)} MW).`);
      if (v.C1 === 'bridge') sentences.push(`After the grid full-connection date (month ${T}) the bridging plant is: ${choiceLabel('C3', v.C3).toLowerCase()}.`);
    } else {
      sentences.push('Bridging: no shortfall between design demand and offered grid capacity before the full-connection date; no bridging plant sized.');
    }
    // C5 = Retained bridging plant: the retained plant is the backup, so it is sized by the same
    // backup rule from the stated resilience requirement (critical load, required topology), taking
    // the larger of the bridging and backup sizes. Same rule for every such option, applied before any check.
    if (v.C5 === 'retained') {
      const topo = req.topology;
      if (v.C2 === 'bessSolar') {
        const needMW = Math.max(bridgeBess.mw, criticalMW);
        const needMWh = Math.max(bridgeBess.mwh, criticalMW * req.autonomyH);
        if (needMW > bridgeBess.mw + 1e-9 || needMWh > bridgeBess.mwh + 1e-9) {
          sentences.push(`Retained BESS as backup: sized to the resilience requirement, ${r1(needMW)} MW (critical load) / ${r1(needMWh)} MWh (${req.autonomyH} h autonomy).`);
        }
        bridgeBess = { mw: needMW, mwh: needMWh, availMonth: bessAvailMonth };
      } else {
        const t = TECH[BRIDGE_TECH[v.C2]];
        const nCrit = Math.ceil(criticalMW / t.p.unitMW - 1e-9);
        const red = unitsWithRedundancy(nCrit, topo, req.blockSize, req.catcherN);
        if (!bridge) {
          bridge = { role: 'bridge', tech: t.id, mw: 0, units: 0, nUnits: 0, unitMW: t.p.unitMW, availMonth: techAvailMonth(ctx, t), fuelMonth: fuelAvailMonth(ctx, t.fuel), shortfallMW: 0, shortfallMonth: -1 };
        }
        if (red.total > bridge.units || nCrit > bridge.nUnits) {
          sentences.push(`Retained ${t.name} as backup: ${r1(criticalMW)} MW critical load ÷ ${t.p.unitMW} MW = ${nCrit} units; ${topo} on blocks of ${req.blockSize} adds ${red.extra}; total ${red.total} units (${r1(red.total * t.p.unitMW)} MW), larger than the bridging size, so the retained plant is sized to it.`);
          bridge.units = Math.max(bridge.units, red.total);
          bridge.nUnits = Math.max(bridge.nUnits, nCrit);
          bridge.mw = bridge.units * t.p.unitMW;
        }
        if (t.fuel === 'diesel') {
          const fs = TECH.fuelStorage.p;
          backup.fuelM3 = Math.max(0, criticalMW * req.autonomyH * fs.dieselLPerKWh - fs.bellyTankM3);
          backup.autonomyH = req.autonomyH;
          sentences.push(`Fuel storage for retained HVO-diesel plant: ${r1(criticalMW)} MW × ${req.autonomyH} h × ${fs.dieselLPerKWh} L/kWh = ${Math.round(backup.fuelM3).toLocaleString('en-GB')} m³.`);
        }
      }
    }
    // C3 = Keep shortfall share as prime, rest as backup (OPEN-QUESTIONS 59, 2026-10-23): from the full grid date the
    // units that cover the permanent shortfall (N+1 per block) keep running as prime; the rest are retired into
    // backup. The plant is bought large enough for both its bridging and its kept share.
    if (v.C1 === 'bridge' && v.C3 === 'split' && v.C2 !== 'bessSolar') {
      const t = TECH[BRIDGE_TECH[v.C2]];
      let SP = 0, spM = -1;
      for (let m = Math.max(0, T); m < ctx.nMonthsTimeline; m++) { const s = designByMonth[m] - gridByMonth[m]; if (s > SP) { SP = s; spM = m; } }
      const nP = Math.ceil(SP / t.p.unitMW - 1e-9);
      const keep = nP + Math.ceil(nP / req.blockSize);
      if (!bridge) bridge = { role: 'bridge', tech: t.id, mw: 0, units: 0, nUnits: 0, unitMW: t.p.unitMW, availMonth: techAvailMonth(ctx, t), fuelMonth: fuelAvailMonth(ctx, t.fuel), shortfallMW: 0, shortfallMonth: -1 };
      if (keep > bridge.units) {
        sentences.push(`Bridging ${t.name} enlarged to its kept share: ${keep} units (${r1(keep * t.p.unitMW)} MW) cover the permanent shortfall, more than the ${bridge.units} units sized for bridging.`);
        bridge.units = keep; bridge.nUnits = Math.max(bridge.nUnits, nP); bridge.mw = keep * t.p.unitMW;
      }
      bridge.primeUnits = keep;
      bridge.primeMW = keep * t.p.unitMW;
      bridge.permanentShortfallMW = SP;
      sentences.push(`From the full grid date (month ${T}): permanent shortfall ${r1(SP)} MW${spM >= 0 ? ` (month ${spM})` : ''} ÷ ${t.p.unitMW} MW = ${nP} units + N+1 per block of ${req.blockSize} = ${keep} units (${r1(bridge.primeMW)} MW) keep running as prime; ${bridge.units - keep > 0 ? `the other ${bridge.units - keep} unit${bridge.units - keep === 1 ? '' : 's'} (${r1(bridge.mw - bridge.primeMW)} MW) ${bridge.units - keep === 1 ? 'is' : 'are'} retired into backup` : 'no units are left to retire into backup'}.`);
    }
  }

  // --- Backup gensets (C5): per building or pooled across the campus (OPEN-QUESTIONS 47, 48, 2026-10-22) ---
  // Per building: one backup technology per building (phase), never mixed within a building. Bridging plant retired
  // into backup after the grid arrives (C3 = Retain as backup / for grid services / the share not kept as prime)
  // backs up whole buildings, in phase order, at the required topology; gensets back up the rest, each building with
  // its own redundancy. Pooled: the retired plant (redundant units removed) and the gensets together make up the
  // campus critical load; the gensets are sized to what is left, with campus-wide redundancy.
  if (v.C5 !== 'none' && v.C5 !== 'retained') {
    const t = TECH[BACKUP_TECH[v.C5]];
    backup.tech = t.id;
    backup.unitMW = t.p.unitMW;
    backup.arrangement = v.C5a;
    const critOf = (it) => req.backedPct * it * (1 + cp.coolPeak);
    const buildings = ctx.phases.length ? ctx.phases.map((ph, k) => ({ k, it: ph.it, crit: critOf(ph.it) })) : [{ k: 0, it: itMW, crit: criticalMW }];
    const retired = v.C1 === 'bridge' && bridge && bridge.units > 0 && ['backup', 'gridServices', 'split'].includes(v.C3) && bridge.fuelMonth !== Infinity
      ? { units: bridge.units - (bridge.primeUnits || 0), unitMW: bridge.unitMW, name: TECH[bridge.tech].name } : null;
    let critGen = 0, genN = 0, genUnits = 0, bessExtra = 0;
    const unitsByPhase = [];
    const coveredByRetired = [];
    if (v.C5a === 'pooled') {
      const retiredFirm = retired ? Math.max(0, retired.units - Math.ceil(retired.units / req.blockSize)) * retired.unitMW : 0;
      critGen = Math.max(0, criticalMW - retiredFirm);
      const n = Math.ceil(critGen / t.p.unitMW - 1e-9);
      const red = unitsWithRedundancy(n, v.C6, req.blockSize, req.catcherN);
      genN = n;
      if (v.C5 === 'bessUps') { genUnits = n; bessExtra = red.extra; } else genUnits = red.total;
      sentences.push(`${t.name}, pooled across the campus: ${r1(criticalMW)} MW critical load${retiredFirm > 0 ? ` less ${r1(retiredFirm)} MW of retired ${retired.name} (redundant units removed) = ${r1(critGen)} MW` : ''} ÷ ${t.p.unitMW} MW = ${n} units; ${v.C5 === 'bessUps' ? `the ${v.C6} redundancy (${red.extra} units) is provided by BESS` : `${v.C6} adds ${red.extra}; total ${red.total} units (${r1(red.total * t.p.unitMW)} MW)`}.`);
    } else {
      let retLeft = retired ? retired.units : 0;
      const parts = [];
      for (const b of buildings) {
        if (retired) {
          const nb = Math.ceil(b.crit / retired.unitMW - 1e-9);
          const rb = unitsWithRedundancy(nb, req.topology, req.blockSize, req.catcherN).total;
          if (rb <= retLeft) { retLeft -= rb; coveredByRetired.push(b.k + 1); unitsByPhase.push(0); continue; }
        }
        const n = Math.ceil(b.crit / t.p.unitMW - 1e-9);
        const red = unitsWithRedundancy(n, v.C6, req.blockSize, req.catcherN);
        critGen += b.crit;
        genN += n;
        if (v.C5 === 'bessUps') { genUnits += n; bessExtra += red.extra; unitsByPhase.push(n); } else { genUnits += red.total; unitsByPhase.push(red.total); }
        parts.push(`building ${b.k + 1}: ${r1(b.crit)} MW → ${n} + ${red.extra}`);
      }
      sentences.push(`${t.name}, per building (one backup technology per building)${coveredByRetired.length ? `; building${coveredByRetired.length === 1 ? '' : 's'} ${coveredByRetired.join(', ')} backed up by retired ${retired.name}` : ''}: ${parts.length ? `${parts.join('; ')} (${v.C6}${v.C5 === 'bessUps' ? ', redundancy by BESS' : ''}) = ${genUnits} units (${r1(genUnits * t.p.unitMW)} MW)` : 'no gensets needed'}.`);
    }
    backup.nUnits = genN;
    backup.units = genUnits;
    backup.mw = genUnits * t.p.unitMW;
    backup.unitsByPhase = v.C5a === 'pooled' ? null : unitsByPhase;
    backup.coveredByRetired = coveredByRetired;
    backup.genCriticalMW = critGen;
    if (v.C5 === 'bessUps') {
      backup.bessMW = bessExtra * t.p.unitMW;
      backup.bessMWh = backup.bessMW * TECH.bessUps.p.durationH;
      sentences.push(`BESS-augmented UPS: ${r1(backup.bessMW)} MW / ${r1(backup.bessMWh)} MWh BESS in place of the ${bessExtra} redundant units.`);
    }
    // Fuel storage (§9.2): liquid fuel only, for the critical load the gensets back up. Gas gensets rely on the network.
    if (t.fuel === 'diesel' || t.fuel === 'hvo') {
      const fs = TECH.fuelStorage.p;
      // Autonomy in hours only: "belly tanks only" was removed as a choice (OPEN-QUESTIONS 52, 2026-10-22).
      const hours = Number(v.C7);
      backup.autonomyH = hours;
      const m3 = Math.max(0, (critGen * 1000 * hours * fs.dieselLPerKWh) / 1000 - fs.bellyTankM3);
      backup.fuelM3 = m3;
      sentences.push(`Fuel storage: ${r1(critGen)} MW × ${hours} h × ${fs.dieselLPerKWh} L/kWh = ${Math.round(m3).toLocaleString('en-GB')} m³ (${Math.round(m3 * fs.densityTPerM3).toLocaleString('en-GB')} t).`);
    } else {
      backup.autonomyH = Infinity;
      sentences.push('Fuel storage: none; gas gensets depend on the gas network during a grid outage.');
    }
  }

  // --- BESS (C12) ---
  let bess = { mw: 0, mwh: 0, role: v.C12r === NA ? null : v.C12r };
  if (v.C12 !== 'none') {
    const h = Number(v.C12[0]);
    const pct = Number(v.C12.slice(2)) / 100;
    bess.mw = pct * designMW;
    bess.mwh = bess.mw * h;
    sentences.push(`BESS: ${(pct * 100).toFixed(0)} % of design facility load ${r1(designMW)} MW = ${r1(bess.mw)} MW × ${h} h = ${r1(bess.mwh)} MWh; role ${choiceLabel('C12r', v.C12r).toLowerCase()}; size kept as given.`);
  }
  const storage = { mw: bess.mw + bridgeBess.mw, mwh: bess.mwh + bridgeBess.mwh, role: bess.role || (bridgeBess.mw > 0 ? 'bridgingSupport' : null) };

  // --- Programme: ordered from day one; permitting allowance only under the IED or Seveso (OPEN-QUESTIONS 44, 45, 56) ---
  const permits = permittingTriggers({ prime, bridge, backup }, v, req);
  for (const p of [prime, bridge]) {
    if (!p) continue;
    const t = TECH[p.tech];
    p.permitRegimes = permitRegimes(p, permits);
    p.permitM = p.permitRegimes.length ? req.permitAllowanceM : 0;
    p.availMonth = techAvailMonth(ctx, t, p.permitM);
    const steps = t.ownConsent
      ? `${t.p.planM} planning and consent + ${t.p.procM} procurement + ${t.p.buildM} construction`
      : `${p.permitM ? `${p.permitM} permitting allowance (${p.permitRegimes.join(', ')}) + ` : 'ordered from day one: '}${t.p.procM} procurement + ${t.p.buildM} construction`;
    const early = t.p.earliestYear && p.availMonth > programmeMonths(t, p.permitM) ? `, not before ${t.p.earliestYear}` : '';
    sentences.push(`${t.name} (${p.role === 'prime' ? (p.sizing === 'shortfall' ? 'firm top-up' : 'firm prime') : 'bridging'}) available from month ${p.availMonth}: ${steps} months${early}${p.fuelMonth === Infinity ? '; fuel not available at current inputs, so it does not run' : p.fuelMonth > p.availMonth ? ` (fuel from month ${p.fuelMonth})` : ''}.`);
  }

  // --- Permitting outlook (OPEN-QUESTIONS 46): held plant, its outlook, and its float against the month it is first
  // needed: bridging plant at the first month of shortfall (islanded: of load); a baseload prime at the first month of
  // load; a top-up plant, and the kept share of split bridging plant, at the first month of permanent shortfall. ---
  const firstWhere = (from, f) => { for (let m = Math.max(0, from); m < ctx.nMonthsTimeline; m++) if (f(m)) return m; return null; };
  const loadM = firstWhere(0, (m) => designByMonth[m] > 1e-6);
  const shortM = (from) => firstWhere(from, (m) => designByMonth[m] - (v.C1 === 'islanded' ? 0 : gridByMonth[m]) > 1e-6);
  const permitOutlook = [];
  if (prime) {
    const it = permitOutlookItem(prime, ctx.country, prime.sizing === 'shortfall' && v.C1 !== 'islanded' ? shortM(T) : loadM);
    if (it) permitOutlook.push(it);
  }
  if (bridge) {
    const it = permitOutlookItem(bridge, ctx.country, v.C1 === 'islanded' ? loadM : (bridge.shortfallMW > 0 ? shortM(0) : shortM(T)));
    if (it) permitOutlook.push(it);
  }
  // Standby gensets: held by the same test; needed when the first load is energised. Their month is reported here
  // only (the engine gives backup no availability month elsewhere).
  if (backup.tech) {
    const bt = TECH[backup.tech];
    const bp = { role: 'backup', tech: bt.id };
    bp.permitRegimes = permitRegimes(bp, permits);
    bp.availMonth = techAvailMonth(ctx, bt, bp.permitRegimes.length ? req.permitAllowanceM : 0);
    const it = permitOutlookItem(bp, ctx.country, loadM);
    if (it) permitOutlook.push(it);
  }

  // --- Area budget (site areas, land take). Ground solar is sized from the ground area for PV the engineer
  // enters (OPEN-QUESTIONS 53–54, 2026-10-22), never from the layout ---
  const site = inputs.site;
  let grossM2, innerM2, netM2;
  if (ctx.site) {
    // Site model (§10.1): boundary polygon or area rectangle, per-edge setbacks and hard exclusions.
    grossM2 = ctx.site.areas.grossM2; innerM2 = ctx.site.areas.envelopeM2; netM2 = ctx.site.areas.netM2;
  } else {
    grossM2 = site.areaHa * 10000;
    const a = Math.sqrt(grossM2 * site.aspect);
    const b = grossM2 / a;
    innerM2 = Math.max(0, a - 2 * site.setbackM) * Math.max(0, b - 2 * site.setbackM);
    netM2 = innerM2 * (1 - site.roadsFraction);
  }
  const sp = TECH.substation.p;
  let subM2;
  if (fullMW <= 0) subM2 = 0;
  else if (band === 'mv') subM2 = sp.m2Per20MVA_mv * (fullMW / SPATIAL.substation.p.mvPowerFactor / 20);
  else if (band === 'hv') subM2 = (v.C17 === 'GIS' ? sp.haGIS_hv : sp.haAIS_hv) * 10000;
  else subM2 = (v.C17 === 'GIS' ? sp.haGIS_ehv : sp.haAIS_ehv) * 10000;
  const gensetFactor = v.C18 === 'double' ? SPATIAL.genset.p.doubleDeckFootprintFactor : v.C18 === 'inBuilding' ? 0 : 1;
  const backupM2 = backup.tech ? backup.units * TECH[backup.tech].p.m2PerUnit * gensetFactor : 0;
  const fuelM2 = backup.fuelM3 * TECH.fuelStorage.p.m2PerM3;
  const bessM2 = (storage.mwh + backup.bessMWh) * TECH.bess.p.m2PerMWh;
  const primeM2 = prime && TECH[prime.tech].p.m2PerMW ? prime.mw * TECH[prime.tech].p.m2PerMW : 0;
  const bridgeM2 = bridge ? bridge.mw * TECH[bridge.tech].p.m2PerMW : 0;
  const rejectedMW = itMW * (1 + cp.coolPeak + cp.lossFrac);
  const hrGroundShare = v.C9 === 'ground' ? 1 : v.C9 === 'split' ? 0.5 : 0;
  const hrM2 = rejectedMW * TECH.heatRejection.p.m2PerMW * hrGroundShare;
  const hydrogenM2 = 0; // included in m2PerMW for hydrogen

  // Wind (C11)
  let windMW = 0;
  let windTurbines = 0;
  const wt = TECH.wind.p;
  if (v.C11 === 'fit') {
    windTurbines = Math.floor(netM2 / 10000 / wt.haPerTurbine);
    windMW = windTurbines * wt.turbineMW;
    sentences.push(`Wind (on site): ${(netM2 / 10000).toFixed(1)} ha net ÷ ${wt.haPerTurbine} ha per turbine (spacing; topple and noise buffers not checked without a layout) = ${windTurbines} turbine${windTurbines === 1 ? '' : 's'} × ${wt.turbineMW} MW = ${r1(windMW)} MW.`);
  } else if (v.C11 === 'offsite') {
    windTurbines = Math.floor((site.offsiteLandHa || 0) / wt.haPerTurbine);
    windMW = windTurbines * wt.turbineMW;
    sentences.push(`Wind (off-site land ${site.offsiteLandHa || 0} ha): ${windTurbines} turbine${windTurbines === 1 ? '' : 's'} × ${wt.turbineMW} MW = ${r1(windMW)} MW.`);
  }
  const windM2 = v.C11 === 'fit' ? windTurbines * 1000 : 0; // 0.1 ha pad each

  const othersM2 = footprint + subM2 + backupM2 + fuelM2 + bessM2 + primeM2 + bridgeM2 + hrM2 + windM2 + hydrogenM2;

  // Solar (C10). Roof plant (§5.3): the roof-plant fraction of the roof, or the heat-rejection footprint on the
  // roof (§6.3, 60 m² per MW rejected) where that is larger; the roof share is 1 (C9 roof) or 0.5 (split). The
  // same rule sizes the roof-plant block (blocks.js), so the sizing and the plan agree.
  const roofShare = v.C9 === 'roof' ? 1 : v.C9 === 'split' ? 0.5 : 0;
  const roofPlantByFraction = TECH.heatRejection.p.roofPlantFraction * roofShare * footprint;
  const roofPlantByFootprint = rejectedMW * roofShare * TECH.heatRejection.p.m2PerMW;
  const roofPlantM2 = roofShare > 0 ? Math.max(roofPlantByFraction, roofPlantByFootprint) : 0;
  const roofFree = roofPlantByFootprint > roofPlantByFraction ? Math.max(0, footprint - roofPlantByFootprint) : footprint * (1 - TECH.heatRejection.p.roofPlantFraction * roofShare);
  const sr = TECH.solarRoof.p;
  const roofRuleM2 = roofFree * sr.usableFraction;
  // Solar (C10, OPEN-QUESTIONS 52–54, 2026-10-22): None / Roof / Roof + ground. Roof PV is sized from the roof
  // area for PV (blank = the rule: usable fraction of the free roof after roof plant); ground PV from the ground
  // area for PV (default 0, so "Roof + ground" is generated only when an area is entered).
  const pvRoofM2 = site.pvRoofM2 == null ? null : Math.max(0, site.pvRoofM2);
  const roofPvM2 = pvRoofM2 == null ? roofRuleM2 : pvRoofM2;
  const pvGroundHa = Math.max(0, site.pvGroundHa || 0);
  let solarRoofMWp = 0;
  let solarGroundMWp = 0;
  let roofPvOverFreeM2 = 0;
  if (v.C10 === 'roof' || v.C10 === 'roofGround') {
    solarRoofMWp = roofPvM2 / sr.m2PerKWp / 1000;
    if (pvRoofM2 == null) {
      const plantText = roofShare > 0 ? ` less roof plant (${v.C9}: ${roofPlantByFootprint > roofPlantByFraction ? `heat-rejection footprint ${Math.round(roofPlantByFootprint).toLocaleString('en-GB')} m², larger than ${(TECH.heatRejection.p.roofPlantFraction * roofShare * 100).toFixed(0)} % of the roof` : `${(TECH.heatRejection.p.roofPlantFraction * roofShare * 100).toFixed(0)} % of the roof, ${Math.round(roofPlantM2).toLocaleString('en-GB')} m²`})` : '';
      sentences.push(`Rooftop PV: roof ${Math.round(footprint).toLocaleString('en-GB')} m²${plantText} = ${Math.round(roofFree).toLocaleString('en-GB')} m² free × ${sr.usableFraction * 100} % usable ÷ ${sr.m2PerKWp} m²/kWp = ${solarRoofMWp.toFixed(2)} MWp (roof area for PV not entered: default rule).`);
    } else {
      roofPvOverFreeM2 = Math.max(0, pvRoofM2 - roofFree);
      sentences.push(`Rooftop PV: roof area for PV ${Math.round(pvRoofM2).toLocaleString('en-GB')} m² (entered) ÷ ${sr.m2PerKWp} m²/kWp = ${solarRoofMWp.toFixed(2)} MWp${roofPvOverFreeM2 > 0 ? `; the entered area is ${Math.round(roofPvOverFreeM2).toLocaleString('en-GB')} m² more than the free roof of ${Math.round(roofFree).toLocaleString('en-GB')} m² after roof plant (flagged, not reduced)` : ''}.`);
    }
  }
  if (v.C10 === 'roofGround') {
    solarGroundMWp = pvGroundHa / TECH.solarGround.p.haPerMWp;
    sentences.push(`Ground PV: ground area for PV ${pvGroundHa} ha (entered) ÷ ${TECH.solarGround.p.haPerMWp} ha/MWp = ${solarGroundMWp.toFixed(2)} MWp.`);
  }
  const solarMWp = solarRoofMWp + solarGroundMWp;
  const groundSolarM2 = solarGroundMWp * TECH.solarGround.p.haPerMWp * 10000;
  const landTakeM2 = othersM2 + groundSolarM2;

  // PPA (C13/C14)
  const ppa = v.C13 === 'none' ? null : { type: v.C13, coverage: Number(v.C14) / 100 };
  if (ppa) sentences.push(`Offsite PPA (${choiceLabel('C13', v.C13).toLowerCase()}): ${v.C14} % of each year's facility consumption (steady state ≈ ${Math.round(ppa.coverage * ssDem.sum).toLocaleString('en-GB')} MWh/yr), delivered over the grid connection and capped by import capacity.`);

  // Grid sentence: offered capacity, shortfall at design load per period (§9.2).
  const firmByMonth = new Float64Array(ctx.nMonths);
  for (let m = 0; m < ctx.nMonths; m++) {
    let f = 0;
    if (prime && m >= prime.availMonth && m >= prime.fuelMonth) f += prime.mw;
    if (bridge && m >= bridge.availMonth && m >= bridge.fuelMonth) f += bridgeMWAt(v, m, T, bridge);
    firmByMonth[m] = f;
  }
  const periods = [];
  let curP = null;
  for (let m = 0; m < ctx.nMonthsTimeline; m++) {
    const g = v.C1 === 'islanded' ? 0 : gridByMonth[m];
    const sf = Math.max(0, designByMonth[m] - firmByMonth[m] - g);
    const k = `${g}|${sf > 1e-6 ? 1 : 0}`;
    if (!curP || curP.k !== k) {
      curP = { k, from: m, to: m, gridMW: gridByMonth[m], maxShort: sf, maxDemand: designByMonth[m], firm: firmByMonth[m] };
      periods.push(curP);
    } else {
      curP.to = m;
      if (sf > curP.maxShort) { curP.maxShort = sf; curP.maxDemand = designByMonth[m]; curP.firm = firmByMonth[m]; }
    }
  }
  const shortfalls = periods.filter((p) => p.maxShort > 1e-6);
  sentences.push(`Grid connection: offered import capacity per period (${[...new Set(periods.map((p) => p.gridMW))].map((x) => `${r1(x)} MW`).join(' → ')}), the same for every option and never resized${v.C1 === 'islanded' ? '; used as backup only and not dispatched in normal hours' : ''}. Connection capex on ${r1(fullMW)} MW at full connection (${band.toUpperCase()} band, ${v.C17}).`);
  for (const p of shortfalls) {
    sentences.push(`Grid shortfall at design load, months ${p.from}–${p.to}: design load ${r1(p.maxDemand)} MW less ${r1(p.firm)} MW firm on site less ${r1(v.C1 === 'islanded' ? 0 : p.gridMW)} MW grid leaves up to ${r1(p.maxShort)} MW; dispatched as unmet load under "${inputs.settings.gridHandling === 'unmet' ? 'Show unmet load' : 'Show exceedance'}".`);
  }
  // Grid cable route (§5.2 the POC "drives … cable-route length for cost"; §5.4 "plus cable route cost per km from
  // the POC"): straight line from the POC to the buildable envelope (site model), the same for every option.
  const routes = ctx.site && ctx.site.routes ? ctx.site.routes : null;
  const poc = ctx.site ? ctx.site.points.poc : null;
  const cableKm = fullMW > 0 && routes && routes.pocM != null ? routes.pocM / 1000 : 0;
  if (fullMW > 0) {
    sentences.push(routes && routes.pocM != null
      ? `Grid cable route: ${Math.round(routes.pocM).toLocaleString('en-GB')} m from the POC${poc && poc.isDefault ? ' (default: the access point, standing in for the road side; replace with the real POC)' : ''} to the buildable envelope, straight line, × €${(TECH.substation.p.cablePerKm / 1e6).toFixed(2)} m/km = €${Math.round(cableKm * TECH.substation.p.cablePerKm).toLocaleString('en-GB')} (in the grid connection capex).`
      : 'Grid cable route: no buildable area to reach, so no cable route is costed.');
  }
  // Gas connection (§5.2 the gas main "drives … connection cost"): options that burn gas on site pay a connection
  // pipe from the gas main to the buildable envelope (straight line). With no gas main location (the default:
  // "gas off-site, location unknown") no pipe is costed, and the sentence says so.
  const burnsGas = [prime, bridge].some((p) => p && TECH[p.tech].fuel === 'gas') || !!(backup.tech && TECH[backup.tech].fuel === 'gas');
  let gasConnection = null;
  if (burnsGas) {
    const gm = routes ? routes.gasMainM : null;
    if (gm == null) sentences.push('Gas connection: no gas main location given (default: gas off-site, location unknown), so no connection pipe is costed.');
    else {
      gasConnection = { km: gm / 1000, perKm: TECH.gasConnection.p.pipePerKm };
      sentences.push(`Gas connection: ${Math.round(gm).toLocaleString('en-GB')} m from the gas main to the buildable envelope, straight line, × €${(gasConnection.perKm / 1e6).toFixed(2)} m/km = €${Math.round(gasConnection.km * gasConnection.perKm).toLocaleString('en-GB')}.`);
    }
  }

  // Plants for dispatch
  const plants = [];
  if (prime) plants.push(makePlant(ctx, prime, v, 'prime', T));
  if (bridge) plants.push(makePlant(ctx, bridge, v, 'bridge', T));
  // Split bridging plant: its kept share runs as a second plant record from the full grid date (the whole plant runs
  // before it), so dispatch, run hours and the per-plant figures show the two periods separately.
  if (bridge && bridge.primeMW > 0) plants.push(makePlant(ctx, { ...bridge, mw: bridge.primeMW }, v, 'bridgeKept', T));

  return {
    coolingId, peakPUE, designMW, avgMW, criticalMW, itMW,
    building: { whitespaceM2: whitespace, gfaM2: gfa, footprintM2: footprint, heightM },
    backup, prime, bridge, bridgeBess, bess, storage, permitOutlook,
    solarMWp, solarRoofMWp, solarGroundMWp, roofPvOverFreeM2, windMW, windTurbines, ppa,
    grid: { band, fullMW, byMonth: gridByMonth, shortfalls: shortfalls.map((p) => ({ from: p.from, to: p.to, mw: p.maxShort })), cableKm },
    gasConnection,
    area: { grossM2, netM2, landTakeM2, residualM2: netM2 - landTakeM2, parts: { building: footprint, substation: subM2, backup: backupM2, fuel: fuelM2, bess: bessM2, prime: primeM2, bridge: bridgeM2, heatRejection: hrM2, wind: windM2, groundSolar: groundSolarM2 } },
    firmByMonth, designByMonth,
    plants,
    sentences,
    T,
    rejectedMW,
  };
}

// Bridging plant MW running in month m (before availability and fuel checks): the whole plant while bridgeActive; the
// kept share after the full grid date for C3 = Keep shortfall share as prime (OPEN-QUESTIONS 59).
export function bridgeMWAt(v, m, T, bridge) {
  if (bridgeActive(v, m, T)) return bridge.mw;
  if (v.C1 === 'bridge' && v.C3 === 'split' && m >= T) return bridge.primeMW || 0;
  return 0;
}

export function bridgeActive(v, m, T) {
  if (v.C1 === 'islanded') return true;
  if (v.C1 !== 'bridge') return false;
  if (m < T) return true;
  return v.C3 === 'prime';
}

// Dispatch mode per month: 0 = off/unavailable, 1 = economic + cover grid shortfall, 2 = must-run serving all residual load.
function makePlant(ctx, s, v, role, T) {
  const t = TECH[s.tech];
  const mode = new Int8Array(ctx.nMonths);
  for (let m = 0; m < ctx.nMonths; m++) {
    if (m < s.availMonth || m < s.fuelMonth) continue;
    if (role === 'prime') mode[m] = v.C1 === 'islanded' ? 2 : 1;
    else if (v.C1 === 'islanded') mode[m] = 2;
    else if (role === 'bridgeKept') { if (m >= T) mode[m] = 1; }
    else if (bridgeActive(v, m, T)) mode[m] = 1;
  }
  return {
    role, tech: s.tech, mw: s.mw, unitMW: s.unitMW, msl: t.p.msl || 0, eff: t.p.eff || 1, fuel: t.fuel || null,
    mode,
  };
}

