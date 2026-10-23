// Significant environmental permitting (owner's decisions of 2026-10-22 and 2026-10-23, OPEN-QUESTIONS 44, 45, 56).
//
// Long-lead plant is ordered from day one of the project (the analysis start), in parallel with construction of the
// first phase. Only plant that needs significant environmental permitting waits for a permitting allowance
// (requirements.permitAllowanceM, 6 months) before it is ordered: in the EU, the Industrial Emissions Directive
// (aggregated combustion thermal input at or above requirements.iedMWth) and Seveso (diesel/HVO or hydrogen
// stored at or above the lower-tier thresholds). Technologies with a consent of their own (onshore wind, ground-mount
// solar, small modular reactors: `ownConsent` in the technology library) keep their own planning months.
//
// One rule for the sizing (availability months) and the permitting flags (evaluate.js). Pure: no UI, no browser APIs.

import { TECH } from './defaults.js';

// Combustion plant of an option, as the IED aggregation counts it: prime, bridging and backup units.
export function combustionPlant(sz, v) {
  const out = [];
  if (sz.prime && TECH[sz.prime.tech].combustion) out.push({ role: 'prime', name: TECH[sz.prime.tech].name, mw: sz.prime.mw, unitMW: sz.prime.unitMW, eff: TECH[sz.prime.tech].p.eff });
  if (sz.bridge && TECH[sz.bridge.tech].combustion) out.push({ role: 'bridge', name: TECH[sz.bridge.tech].name, mw: sz.bridge.mw, unitMW: sz.bridge.unitMW, eff: TECH[sz.bridge.tech].p.eff });
  if (sz.backup && sz.backup.tech) {
    const t = TECH[sz.backup.tech];
    out.push({ role: 'backup', name: t.name, mw: (v.C5 === 'bessUps' ? sz.backup.nUnits : sz.backup.units) * t.p.unitMW, unitMW: t.p.unitMW, eff: t.p.eff });
  }
  return out;
}

// Hydrogen stored on site (t) for a hydrogen prime plant: full output for the stored hours, 33.3 kWh/kg (LHV).
export const hydrogenStoredT = (prime) => (prime && prime.tech === 'hydrogen' ? (prime.mw / TECH.hydrogen.p.eff) * TECH.hydrogen.p.storageHours / 33.3 : 0);

// Which significant-permitting regimes an option triggers, from its sized plant.
export function permittingTriggers(sz, v, req) {
  const combustion = combustionPlant(sz, v);
  const thermal = combustion.reduce((s, c) => s + c.mw / c.eff, 0);
  const fuelT = (sz.backup ? sz.backup.fuelM3 : 0) * TECH.fuelStorage.p.densityTPerM3;
  const h2t = hydrogenStoredT(sz.prime);
  return {
    combustion, thermal, fuelT, h2t,
    ied: thermal >= req.iedMWth,
    sevesoFuel: fuelT >= req.sevesoFuelT,
    sevesoH2: h2t >= req.sevesoH2t,
  };
}

// The regimes that hold up one plant (prime or bridge): IED for any combustion plant when the site is above the
// threshold; Seveso for liquid-fuel plant when the fuel store is above it, and for hydrogen plant when the hydrogen
// store is. Empty = ordered from day one.
export function permitRegimes(plant, trig) {
  if (!plant) return [];
  const t = TECH[plant.tech];
  if (t.ownConsent) return [];
  const r = [];
  if (trig.ied && t.combustion) r.push('IED');
  if ((trig.sevesoFuel && (t.fuel === 'diesel' || t.fuel === 'hvo')) || (trig.sevesoH2 && t.fuel === 'hydrogen')) r.push('Seveso');
  return r;
}
