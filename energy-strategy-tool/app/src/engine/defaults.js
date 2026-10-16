// Input model and defaults registry (BRIEF §5, §6, §8, §18, §23).
//
// Every default (numeric input, threshold, weight, penalty, run setting, view/ranking
// setting, input-state default and choice default state) is stored as a §18 record.
// No default has a verified source in this slice, so every record has
// confidence "C", verified false and label "indicative — unverified" (§23 label rule).
// Where the brief names a source to verify against, it is kept in `sourceToVerify`;
// `source`, `year` and `url` stay empty until a person verifies the value.

import { defaultAnalysisStart, addMonths } from './dates.js';

export const LABEL = 'indicative — unverified';

const REGISTRY = {};

function rec(path, value, unit, opts = {}) {
  const numeric = typeof value === 'number';
  REGISTRY[path] = {
    path,
    value,
    unit: unit || '',
    low: opts.low ?? (numeric ? null : null),
    high: opts.high ?? null,
    distribution: opts.dist ?? (numeric ? 'triangular' : 'fixed'),
    basis: opts.basis ?? 'source',
    source: '',
    year: '',
    url: '',
    accessed: '',
    confidence: 'C',
    verified: false,
    sourceToVerify: opts.verify ?? '',
    note: opts.note ?? '',
    briefRef: opts.ref ?? '',
    label: LABEL,
    derived: opts.derived ?? false,
  };
  return value;
}

// ---------------------------------------------------------------------------
// Country profiles (BRIEF §5.1, §18). SYNTHETIC calibration targets, not data.
// Each row drives the seeded synthetic hourly profiles in profiles.js.
// Columns: name, currency, lat, lon, tMean (°C), tAmp (°C seasonal half-range),
// solarYield (kWh/kWp/yr), windCF, price (wholesale €/MWh), adder (non-commodity €/MWh),
// carbon (gCO2e/kWh), gas (€/MWh_th commodity), carbonPrice (€/t), eu (EU member),
// decarb2050 (grid carbon multiplier reached in 2050).
// ---------------------------------------------------------------------------
const C = (name, currency, lat, lon, tMean, tAmp, solarYield, windCF, price, adder, carbon, gas, carbonPrice, eu, decarb2050) =>
  ({ name, currency, lat, lon, tMean, tAmp, solarYield, windCF, price, adder, carbon, gas, carbonPrice, eu, decarb2050 });

export const COUNTRIES = {
  AT: C('Austria', 'EUR', 47.6, 14.1, 8.5, 10.0, 1100, 0.24, 100, 45, 110, 42, 85, true, 0.15),
  BE: C('Belgium', 'EUR', 50.6, 4.6, 10.5, 7.5, 950, 0.28, 90, 50, 140, 40, 85, true, 0.15),
  BG: C('Bulgaria', 'EUR', 42.7, 25.5, 11.5, 11.0, 1350, 0.22, 95, 35, 400, 42, 85, true, 0.25),
  HR: C('Croatia', 'EUR', 45.1, 15.2, 12.0, 10.0, 1250, 0.25, 100, 40, 200, 42, 85, true, 0.2),
  CY: C('Cyprus', 'EUR', 35.1, 33.4, 19.5, 8.5, 1650, 0.22, 140, 40, 600, 70, 85, true, 0.3),
  CZ: C('Czechia', 'EUR', 49.8, 15.5, 8.5, 9.5, 1000, 0.24, 95, 45, 430, 42, 85, true, 0.25),
  DK: C('Denmark', 'DKK', 56.0, 10.0, 8.5, 7.5, 950, 0.34, 80, 40, 130, 40, 85, true, 0.1),
  EE: C('Estonia', 'EUR', 58.6, 25.0, 6.0, 10.5, 900, 0.30, 90, 35, 500, 42, 85, true, 0.2),
  FI: C('Finland', 'EUR', 61.9, 25.7, 4.0, 11.0, 850, 0.30, 55, 30, 80, 45, 85, true, 0.1),
  FR: C('France', 'EUR', 46.6, 2.2, 12.0, 8.0, 1200, 0.26, 85, 40, 55, 40, 85, true, 0.5),
  DE: C('Germany', 'EUR', 51.2, 10.4, 9.5, 8.5, 1000, 0.27, 95, 55, 380, 40, 85, true, 0.15),
  GR: C('Greece', 'EUR', 39.1, 21.8, 16.5, 9.5, 1550, 0.27, 105, 40, 330, 42, 85, true, 0.2),
  HU: C('Hungary', 'EUR', 47.2, 19.5, 11.0, 11.0, 1250, 0.22, 105, 40, 200, 42, 85, true, 0.2),
  IE: C('Ireland', 'EUR', 53.4, -8.2, 10.0, 5.0, 900, 0.35, 110, 50, 280, 42, 85, true, 0.15),
  IT: C('Italy', 'EUR', 42.8, 12.6, 14.5, 9.5, 1400, 0.22, 120, 45, 280, 45, 85, true, 0.2),
  LV: C('Latvia', 'EUR', 56.9, 24.6, 6.5, 10.5, 900, 0.28, 90, 35, 120, 42, 85, true, 0.15),
  LT: C('Lithuania', 'EUR', 55.2, 23.9, 7.0, 10.5, 950, 0.28, 90, 35, 180, 42, 85, true, 0.15),
  LU: C('Luxembourg', 'EUR', 49.8, 6.1, 9.5, 8.0, 980, 0.25, 95, 45, 120, 42, 85, true, 0.15),
  MT: C('Malta', 'EUR', 35.9, 14.4, 19.0, 7.5, 1650, 0.25, 130, 40, 380, 60, 85, true, 0.3),
  NL: C('Netherlands', 'EUR', 52.1, 5.3, 10.5, 7.0, 950, 0.32, 90, 45, 300, 40, 85, true, 0.15),
  PL: C('Poland', 'EUR', 51.9, 19.1, 8.5, 10.0, 1000, 0.27, 110, 40, 660, 42, 85, true, 0.3),
  PT: C('Portugal', 'EUR', 39.4, -8.2, 16.0, 6.5, 1550, 0.27, 75, 40, 140, 42, 85, true, 0.1),
  RO: C('Romania', 'EUR', 45.9, 24.9, 10.5, 11.5, 1300, 0.24, 100, 35, 260, 42, 85, true, 0.2),
  SK: C('Slovakia', 'EUR', 48.7, 19.7, 9.5, 10.5, 1150, 0.22, 100, 40, 120, 42, 85, true, 0.2),
  SI: C('Slovenia', 'EUR', 46.1, 14.9, 10.5, 10.0, 1200, 0.22, 105, 40, 230, 42, 85, true, 0.2),
  ES: C('Spain', 'EUR', 40.4, -3.7, 15.0, 9.0, 1650, 0.26, 70, 40, 150, 40, 85, true, 0.1),
  SE: C('Sweden', 'SEK', 60.1, 18.6, 6.5, 10.0, 900, 0.31, 45, 30, 25, 45, 85, true, 0.5),
  GB: C('United Kingdom', 'GBP', 52.4, -1.5, 10.0, 6.5, 950, 0.34, 95, 55, 200, 40, 50, false, 0.1),
  NO: C('Norway', 'NOK', 60.5, 8.5, 5.5, 9.0, 850, 0.32, 50, 25, 25, 45, 85, false, 0.5),
  CH: C('Switzerland', 'CHF', 46.8, 8.2, 9.0, 9.0, 1150, 0.20, 95, 50, 40, 45, 85, false, 0.5),
  IS: C('Iceland', 'ISK', 64.9, -19.0, 4.5, 6.0, 700, 0.38, 40, 25, 15, 80, 85, false, 0.8),
};
REGISTRY['profiles.countries'] = {
  path: 'profiles.countries', value: 'built-in synthetic country set (31)', unit: '', low: null, high: null,
  distribution: 'fixed', basis: 'source', source: '', year: '', url: '', accessed: '', confidence: 'C', verified: false,
  sourceToVerify: 'PVGIS (EU JRC), Renewables.ninja / ERA5, ENTSO-E Transparency Platform, Ember, TTF/NBP, EU ETS / UK ETS',
  note: 'Synthetic calibration targets for seeded synthetic hourly profiles. Not measured data. Replace with verified profiles.',
  briefRef: '§5.1, §18', label: LABEL, derived: false,
};

// Exchange rates to EUR (display only). Indicative; ECB reference rates to verify.
export const FX = { EUR: 1, GBP: 0.85, NOK: 11.5, SEK: 11.3, DKK: 7.46, CHF: 0.95, ISK: 150 };
REGISTRY['project.fx'] = {
  path: 'project.fx', value: FX, unit: 'per EUR', low: null, high: null, distribution: 'fixed', basis: 'source',
  source: '', year: '', url: '', accessed: '', confidence: 'C', verified: false, sourceToVerify: 'ECB reference rates',
  note: 'Fixed rates; display conversion only. Engine works in EUR.', briefRef: '§5.1', label: LABEL, derived: false,
};

// ---------------------------------------------------------------------------
// Choice definitions (BRIEF §8). Only choices that change the energy strategy.
// ---------------------------------------------------------------------------
export const CHOICES = [
  { id: 'C1', name: 'Grid strategy', values: [
    ['wait', 'Wait for grid'], ['bridge', 'Bridge until grid'], ['islanded', 'Islanded'], ['export', 'Grid + export']] },
  { id: 'C2', name: 'Bridging supply', values: [
    ['gasRecip', 'Gas recips'], ['gasTurbine', 'Gas turbines'], ['fuelCell', 'Fuel cells'], ['dieselPrime', 'HVO-diesel prime'],
    ['bessSolar', 'BESS + solar only'], ['rented', 'Rented temporary generation']] },
  { id: 'C3', name: 'Bridging plant after grid arrives', values: [
    ['remove', 'Remove'], ['backup', 'Retain as backup'], ['prime', 'Retain as prime'], ['gridServices', 'Retain for grid services']] },
  { id: 'C4', name: 'Primary firm on-site generation', values: [
    ['none', 'None'], ['chp', 'Gas CHP-trigen'], ['gasRecip', 'Gas recips'], ['fuelCell', 'Fuel cells'], ['smr', 'SMR'], ['hydrogen', 'Hydrogen']] },
  { id: 'C5', name: 'Backup power technology', values: [
    ['diesel', 'Diesel gensets'], ['hvo', 'HVO gensets'], ['gas', 'Gas gensets'], ['bessUps', 'BESS-augmented UPS + reduced gensets'],
    ['retained', 'Retained bridging plant'], ['none', 'None']] },
  { id: 'C6', name: 'Backup topology', values: [['N', 'N'], ['N+1', 'N+1'], ['2N', '2N'], ['catcher', 'Distributed-redundant (catcher)']] },
  { id: 'C7', name: 'Autonomy / fuel storage', values: [['12', '12 h'], ['24', '24 h'], ['48', '48 h'], ['72', '72 h'], ['belly', 'Belly tanks only']] },
  { id: 'C8', name: 'Cooling approach', values: [['air', 'Air (CHW + free cooling)'], ['evap', 'Evaporative-adiabatic'], ['dlc', 'DLC + dry coolers'], ['immersion', 'Immersion']] },
  { id: 'C9', name: 'Heat rejection location', values: [['roof', 'Roof'], ['ground', 'Ground'], ['split', 'Split']] },
  { id: 'C10', name: 'On-site solar', values: [
    ['none', 'None'], ['roof', 'Roof only'], ['roofCarport', 'Roof + carport'], ['roofResidual', 'Roof + fill residual ground'], ['fixed', 'Fixed MWp']] },
  { id: 'C11', name: 'On-site wind', values: [['none', 'None'], ['fit', 'Fit as many as separations allow'], ['offsite', 'Off-site land']] },
  { id: 'C12', name: 'BESS size', values: [
    ['none', 'None'], ['1h25', '1 h at 25 %'], ['1h50', '1 h at 50 %'], ['2h25', '2 h at 25 %'], ['2h50', '2 h at 50 %'], ['4h25', '4 h at 25 %'], ['4h50', '4 h at 50 %']] },
  { id: 'C12r', name: 'BESS role', values: [['peakShave', 'Peak-shave against grid cap'], ['shifting', 'Shifting'], ['bridgingSupport', 'Bridging support'], ['gridServices', 'Grid services']] },
  { id: 'C13', name: 'Offsite PPA', values: [
    ['none', 'None'], ['solar', 'Annual-matched solar'], ['wind', 'Annual-matched wind'], ['hybrid', 'Hybrid'], ['baseload', 'Baseload-shaped'], ['cfe247', '24/7-matched']] },
  { id: 'C14', name: 'PPA coverage', values: [['50', '50 %'], ['80', '80 %'], ['100', '100 %']] },
  { id: 'C15', name: 'Heat reuse', values: [['none', 'None'], ['offtake', 'Heat offtake (direct)'], ['heatPump', 'Heat pump boost']] },
  { id: 'C16', name: 'Demand flexibility', values: [['off', 'Off'], ['on', 'On']] },
  { id: 'C17', name: 'Substation type', values: [['AIS', 'AIS'], ['GIS', 'GIS']] },
  { id: 'C18', name: 'Genset arrangement', values: [['single', 'Single-deck'], ['double', 'Double-deck'], ['inBuilding', 'In-building plant room']] },
  { id: 'C19', name: 'Phasing of energy plant', values: [['phase1', 'Build all at phase 1'], ['perPhase', 'Build per phase']] },
  { id: 'C20', name: 'Fuel decarbonisation pathway', values: [['none', 'None'], ['biomethane', 'Gas to biomethane in year X'], ['hvo', 'Diesel to HVO in year X']] },
];
export const CHOICE_BY_ID = Object.fromEntries(CHOICES.map((c) => [c.id, c]));
export function choiceLabel(id, value) {
  const c = CHOICE_BY_ID[id];
  const v = c && c.values.find((x) => x[0] === value);
  return v ? v[1] : value;
}

// Choice default states (§8 table). Some depend on other inputs (C6, C7, C8, C11, C15).
export function defaultChoiceState(id, inputs) {
  switch (id) {
    case 'C1': return { state: 'open', values: ['wait', 'bridge', 'islanded'] };
    case 'C2': return { state: 'open', values: ['gasRecip', 'fuelCell', 'rented'] };
    case 'C3': return { state: 'open', values: ['remove', 'backup', 'prime', 'gridServices'] };
    case 'C4': return { state: 'open', values: ['none', 'chp', 'fuelCell'] };
    case 'C5': return { state: 'open', values: ['hvo', 'diesel', 'retained'] };
    case 'C6': return { state: 'locked', values: [inputs ? inputs.requirements.topology : 'N+1'] };
    case 'C7': return { state: 'locked', values: [inputs ? String(inputs.requirements.autonomyH) : '48'] };
    case 'C8': {
      const ca = inputs ? inputs.load.coolingApproach : 'open';
      return ca === 'open' ? { state: 'open', values: ['air', 'evap', 'dlc', 'immersion'] } : { state: 'locked', values: [ca] };
    }
    case 'C9': return { state: 'open', values: ['roof', 'ground', 'split'] };
    case 'C10': return { state: 'open', values: ['none', 'roof', 'roofResidual'] };
    case 'C11': {
      const small = inputs ? inputs.site.areaHa <= inputs.settings.windSiteThresholdHa && !(inputs.site.offsiteLandHa > 0) : true;
      return small ? { state: 'open', values: ['none'], windDefault: true } : { state: 'open', values: ['none', 'fit', 'offsite'] };
    }
    case 'C12': return { state: 'open', values: ['none', '2h25', '4h50'] };
    case 'C12r': return { state: 'locked', values: ['peakShave'] };
    case 'C13': return { state: 'open', values: ['none', 'hybrid'] };
    case 'C14': return { state: 'open', values: ['50', '80', '100'] };
    case 'C15': return inputs && inputs.utilities.districtHeating === 'Yes'
      ? { state: 'open', values: ['none', 'offtake', 'heatPump'] } : { state: 'locked', values: ['none'] };
    case 'C16': return { state: 'locked', values: ['off'] };
    case 'C17': return { state: 'open', values: ['AIS'] };
    case 'C18': return { state: 'open', values: ['single'] };
    case 'C19': return { state: 'locked', values: ['perPhase'] };
    case 'C20': return { state: 'locked', values: ['none'] };
    default: return { state: 'locked', values: [CHOICE_BY_ID[id].values[0][0]] };
  }
}
for (const c of CHOICES) {
  const d = defaultChoiceState(c.id, null);
  rec(`choices.${c.id}`, d, 'choice state', {
    basis: 'judgement', ref: '§8', derived: ['C6', 'C7', 'C8', 'C11', 'C15'].includes(c.id),
    note: c.id === 'C11' ? 'Default "None" when site area ≤ 20 ha and no off-site land; otherwise open.' :
      c.id === 'C12r' ? 'Default role "peak-shave against grid cap" (§8 C12).' : '',
  });
}

// ---------------------------------------------------------------------------
// Technology library (BRIEF §6). Cost/performance/programme. All indicative —
// unverified (v1 indicative ranges carried at confidence C, §18).
// ---------------------------------------------------------------------------
const TECH_SOURCE = 'IRENA Renewable Power Generation Costs, NREL ATB, Danish Energy Agency Technology Catalogues, Lazard LCOE+, vendor indications';
export const TECH = {};
function tech(id, base, params) {
  TECH[id] = { id, ...base, p: {} };
  for (const [k, v] of Object.entries(params)) {
    const [value, unit, low, high] = v;
    TECH[id].p[k] = rec(`tech.${id}.${k}`, value, unit, {
      low, high, verify: base.verify || TECH_SOURCE, ref: '§6',
      dist: typeof value === 'number' ? 'triangular' : 'fixed',
    });
  }
}
// role, maturity, fuel, placement
tech('solarGround', { name: 'Solar PV ground-mount', role: 'intermittent', maturity: 'Commercial' }, {
  capexPerKW: [700, '€/kWp', 600, 800], fomPerKW: [12, '€/kWp/yr', 9, 15], life: [30, 'yr', 25, 35],
  haPerMWp: [1.2, 'ha/MWp', 0.8, 1.8], planM: [9, 'months', 6, 18], procM: [6, 'months', 3, 9], buildM: [6, 'months', 4, 9] });
tech('solarRoof', { name: 'Solar PV rooftop', role: 'intermittent', maturity: 'Commercial' }, {
  capexPerKW: [900, '€/kWp', 750, 1100], fomPerKW: [14, '€/kWp/yr', 10, 18], life: [25, 'yr', 20, 30],
  m2PerKWp: [5.5, 'm²/kWp', 4.5, 7.0], usableFraction: [0.5, 'fraction of free roof', 0.4, 0.6],
  planM: [3, 'months', 2, 6], procM: [6, 'months', 3, 9], buildM: [4, 'months', 3, 6] });
tech('solarCarport', { name: 'Solar PV carport', role: 'intermittent', maturity: 'Commercial' }, {
  capexPerKW: [1300, '€/kWp', 1100, 1600], fomPerKW: [15, '€/kWp/yr', 10, 20], life: [25, 'yr', 20, 30],
  m2PerKWp: [8, 'm²/kWp', 6, 10], parkingFraction: [0.3, 'fraction of roads/parking allowance', 0.2, 0.5],
  planM: [6, 'months', 3, 9], procM: [6, 'months', 3, 9], buildM: [6, 'months', 4, 9] });
tech('wind', { name: 'Wind onshore', role: 'intermittent', maturity: 'Commercial' }, {
  capexPerKW: [1350, '€/kW', 1200, 1500], fomPerKW: [35, '€/kW/yr', 25, 45], life: [25, 'yr', 20, 30],
  turbineMW: [5, 'MW', 3, 6], tipHeightM: [180, 'm', 150, 220], toppleFactor: [1.5, '× tip height', 1.1, 2.0],
  haPerTurbine: [33.75, 'ha per turbine (5 × 3 rotor diameters)', 20, 50],
  planM: [24, 'months', 12, 48], procM: [18, 'months', 12, 24], buildM: [12, 'months', 9, 18] });
tech('bess', { name: 'BESS (Li-ion, containerised)', role: 'storage', maturity: 'Commercial' }, {
  capexPerKWh: [250, '€/kWh', 200, 350], capexPerKW: [150, '€/kW', 100, 200], fomPct: [0.015, 'fraction of capex/yr', 0.01, 0.025],
  rte: [0.88, 'round-trip efficiency', 0.85, 0.92], life: [15, 'yr', 12, 20], m2PerMWh: [50, 'm²/MWh', 30, 90],
  socInit: [0.5, 'fraction', 0.5, 0.5], planM: [6, 'months', 3, 12], procM: [9, 'months', 6, 15], buildM: [6, 'months', 3, 9] });
tech('gasRecip', { name: 'Gas reciprocating engines', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Danish Energy Agency Technology Catalogue; vendor data' }, {
  capexPerKW: [900, '€/kW', 800, 1000], fomPerKW: [15, '€/kW/yr', 10, 20], vomPerMWh: [8, '€/MWh', 5, 12], eff: [0.44, 'electrical efficiency (LHV)', 0.40, 0.48],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [4.5, 'MW', 2, 10], life: [20, 'yr', 15, 25], m2PerMW: [200, 'm²/MWe', 120, 300],
  stackM: [25, 'm', 20, 30], planM: [9, 'months', 6, 18], procM: [9, 'months', 6, 15], buildM: [6, 'months', 4, 9] });
tech('gasTurbine', { name: 'Gas turbines (OCGT / aeroderivative)', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Danish Energy Agency Technology Catalogue; vendor data' }, {
  capexPerKW: [750, '€/kW', 600, 900], fomPerKW: [12, '€/kW/yr', 8, 16], vomPerMWh: [6, '€/MWh', 4, 9], eff: [0.38, 'electrical efficiency (LHV)', 0.33, 0.42],
  msl: [0.4, 'min stable load fraction', 0.3, 0.5], unitMW: [30, 'MW', 10, 50], life: [25, 'yr', 20, 30], m2PerMW: [120, 'm²/MWe', 80, 200],
  stackM: [30, 'm', 25, 40], planM: [9, 'months', 6, 18], procM: [12, 'months', 9, 24], buildM: [6, 'months', 4, 9] });
tech('chp', { name: 'Gas CHP / trigeneration', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Vendor data; Danish Energy Agency Technology Catalogue' }, {
  capexPerKW: [1300, '€/kW', 1100, 1600], fomPerKW: [20, '€/kW/yr', 15, 28], vomPerMWh: [10, '€/MWh', 7, 14], eff: [0.42, 'electrical efficiency (LHV)', 0.38, 0.46],
  heatToPower: [1.0, 'MWth recoverable per MWe', 0.8, 1.2], absorptionCOP: [0.7, 'COP', 0.6, 0.8], msl: [0.4, 'min stable load fraction', 0.3, 0.5],
  unitMW: [4.5, 'MW', 2, 10], life: [20, 'yr', 15, 25], m2PerMW: [280, 'm²/MWe (recip + 40 %)', 170, 420], stackM: [25, 'm', 20, 30],
  sizeFraction: [1.0, 'fraction of average facility load', 0.5, 1.0],
  planM: [12, 'months', 9, 24], procM: [12, 'months', 9, 18], buildM: [9, 'months', 6, 12] });
tech('fuelCell', { name: 'Fuel cells (SOFC)', role: 'firm', maturity: 'Emerging', fuel: 'gas', combustion: false, verify: 'Vendor data' }, {
  capexPerKW: [2800, '€/kW', 2200, 3500], fomPerKW: [40, '€/kW/yr', 30, 60], vomPerMWh: [5, '€/MWh', 3, 8], eff: [0.55, 'electrical efficiency (LHV)', 0.5, 0.6],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [1, 'MW', 0.3, 2], life: [20, 'yr', 15, 25], stackLife: [7, 'yr', 5, 10], stackFraction: [0.25, 'fraction of capex', 0.2, 0.35],
  m2PerMW: [120, 'm²/MW', 60, 200], planM: [6, 'months', 3, 12], procM: [6, 'months', 4, 12], buildM: [3, 'months', 2, 6] });
tech('dieselPrime', { name: 'HVO-diesel prime gensets', role: 'firm', maturity: 'Commercial', fuel: 'diesel', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [450, '€/kW', 350, 550], fomPerKW: [10, '€/kW/yr', 6, 14], vomPerMWh: [12, '€/MWh', 8, 16], eff: [0.40, 'electrical efficiency', 0.36, 0.43],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [2.75, 'MW', 2.5, 3.0], life: [15, 'yr', 10, 20], m2PerMW: [40, 'm²/MW', 28, 56],
  stackM: [10, 'm', 8, 12], planM: [6, 'months', 3, 9], procM: [9, 'months', 6, 15], buildM: [3, 'months', 2, 6] });
tech('rented', { name: 'Rented temporary generation (gas)', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Rental vendor indications' }, {
  rentalPerKWMonth: [12, '€/kW/month', 8, 18], vomPerMWh: [10, '€/MWh', 6, 14], eff: [0.38, 'electrical efficiency', 0.34, 0.42],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [2, 'MW', 1, 3], m2PerMW: [150, 'm²/MW', 100, 250], stackM: [10, 'm', 8, 12],
  planM: [2, 'months', 1, 6], procM: [2, 'months', 1, 4], buildM: [2, 'months', 1, 3] });
tech('smr', { name: 'Small modular reactor', role: 'firm', maturity: 'Nascent', fuel: 'nuclear', combustion: false, verify: 'Vendor and regulator publications' }, {
  capexPerKW: [7000, '€/kW', 5000, 12000], fomPerKW: [120, '€/kW/yr', 80, 160], vomPerMWh: [3, '€/MWh', 2, 5], fuelPerMWhE: [9, '€/MWh_e', 6, 12],
  msl: [0.5, 'min stable load fraction', 0.4, 0.7], unitMW: [80, 'MW', 50, 300], life: [60, 'yr', 40, 80], earliestYear: [2035, 'year', 2032, 2040],
  planM: [36, 'months', 24, 60], procM: [36, 'months', 24, 48], buildM: [48, 'months', 36, 72] });
tech('hydrogen', { name: 'Hydrogen gensets / fuel cells', role: 'firm', maturity: 'Nascent', fuel: 'hydrogen', combustion: true, verify: 'National hazardous-substance regulation; specialist input; vendor data' }, {
  capexPerKW: [2500, '€/kW', 1800, 3500], fomPerKW: [40, '€/kW/yr', 30, 60], vomPerMWh: [5, '€/MWh', 3, 8], eff: [0.5, 'electrical efficiency (LHV)', 0.4, 0.55],
  msl: [0.2, 'min stable load fraction', 0.1, 0.3], unitMW: [1, 'MW', 0.5, 2], life: [15, 'yr', 10, 20], m2PerMW: [300, 'm²/MW + storage', 200, 450],
  storageHours: [24, 'h of full output stored on site', 12, 48],
  planM: [18, 'months', 12, 24], procM: [18, 'months', 12, 30], buildM: [9, 'months', 6, 12] });
tech('backupDiesel', { name: 'Diesel standby gensets', role: 'backup', maturity: 'Commercial', fuel: 'diesel', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [450, '€/kW', 350, 550], fomPerKW: [8, '€/kW/yr', 5, 12], unitMW: [2.75, 'MW', 2.5, 3.0], eff: [0.38, 'electrical efficiency', 0.35, 0.42],
  life: [25, 'yr', 20, 30], m2PerUnit: [100, 'm² per unit incl. access', 70, 140], stackM: [10, 'm', 8, 12],
  planM: [6, 'months', 3, 9], procM: [12, 'months', 9, 18], buildM: [6, 'months', 3, 9] });
tech('backupHvo', { name: 'HVO standby gensets', role: 'backup', maturity: 'Commercial', fuel: 'hvo', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [460, '€/kW', 360, 560], fomPerKW: [8, '€/kW/yr', 5, 12], unitMW: [2.75, 'MW', 2.5, 3.0], eff: [0.38, 'electrical efficiency', 0.35, 0.42],
  life: [25, 'yr', 20, 30], m2PerUnit: [100, 'm² per unit incl. access', 70, 140], stackM: [10, 'm', 8, 12],
  planM: [6, 'months', 3, 9], procM: [12, 'months', 9, 18], buildM: [6, 'months', 3, 9] });
tech('backupGas', { name: 'Gas standby gensets', role: 'backup', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [550, '€/kW', 450, 700], fomPerKW: [9, '€/kW/yr', 6, 13], unitMW: [2.0, 'MW', 1.5, 2.5], eff: [0.40, 'electrical efficiency', 0.36, 0.43],
  life: [25, 'yr', 20, 30], m2PerUnit: [110, 'm² per unit incl. access', 80, 150], stackM: [10, 'm', 8, 12],
  planM: [6, 'months', 3, 9], procM: [12, 'months', 9, 18], buildM: [6, 'months', 3, 9] });
tech('bessUps', { name: 'BESS-augmented UPS', role: 'backup', maturity: 'Emerging' }, {
  durationH: [2, 'h at redundancy capacity', 1, 4] });
tech('fuelStorage', { name: 'Bulk fuel storage (bunded)', role: 'backup support', maturity: 'Commercial', verify: 'Fuel storage regulations by country; fire engineer' }, {
  capexPerM3: [1200, '€/m³', 800, 1800], m2PerM3: [0.15, 'm² per m³', 0.10, 0.25], dieselLPerKWh: [0.26, 'L/kWh at full load', 0.24, 0.28],
  bellyTankM3: [0, 'm³ belly-tank volume credited', 0, 0], bellyHours: [8, 'h at full load (belly tanks only)', 4, 12],
  densityTPerM3: [0.84, 't/m³', 0.78, 0.86] });
tech('substation', { name: 'Grid connection and on-site substation', role: 'grid', maturity: 'Commercial', verify: 'TSO/DSO design standards and connection charging statements' }, {
  connCapexPerMW_mv: [100000, '€/MW offered (11–33 kV)', 60000, 160000], connCapexPerMW_hv: [150000, '€/MW offered (110–150 kV)', 90000, 250000],
  connCapexPerMW_ehv: [120000, '€/MW offered (220–400 kV)', 70000, 200000],
  subCapexPerMW_mv: [60000, '€/MW (11–33 kV)', 40000, 90000], subCapexPerMW_hv: [80000, '€/MW (110–150 kV)', 50000, 120000],
  subCapexPerMW_ehv: [70000, '€/MW (220–400 kV)', 45000, 110000], gisMultiplier: [1.4, '× AIS cost', 1.2, 1.7],
  cablePerKm: [1.5e6, '€/km', 0.8e6, 3e6], cableKm: [1.0, 'km POC to site', 0.2, 5],
  m2Per20MVA_mv: [500, 'm² per 20 MVA', 300, 800], haAIS_hv: [1.2, 'ha', 0.8, 2.0], haGIS_hv: [0.4, 'ha', 0.25, 0.6], haAIS_ehv: [4.0, 'ha', 2.5, 6.0], haGIS_ehv: [1.2, 'ha', 0.8, 2.0],
  bandMvMaxMW: [20, 'MW (MV/HV band edge)', 20, 20], bandHvMaxMW: [150, 'MW (HV/EHV band edge)', 150, 150] });
tech('heatRejection', { name: 'Heat rejection (dry / adiabatic coolers, chillers)', role: 'cooling plant', maturity: 'Commercial', verify: 'Vendor data' }, {
  m2PerMW: [60, 'm² per MW rejected', 40, 100], roofPlantFraction: [0.4, 'fraction of roof if heat rejection on roof', 0.3, 0.6] });

// Fuels and carbon factors
export const FUEL = {
  gasTransportAdder: rec('fuel.gasTransportAdder', 4, '€/MWh_th', { low: 2, high: 8, verify: 'National gas transport tariffs', ref: '§5.4' }),
  dieselPrice: rec('fuel.dieselPrice', 110, '€/MWh_th', { low: 85, high: 140, verify: 'National fuel price statistics', ref: '§6' }),
  hvoPrice: rec('fuel.hvoPrice', 170, '€/MWh_th', { low: 130, high: 220, verify: 'Fuel supplier indications', ref: '§6' }),
  hydrogenPrice: rec('fuel.hydrogenPrice', 150, '€/MWh_th', { low: 90, high: 250, verify: 'Hydrogen supply price indications', ref: '§5.4' }),
  efGas: rec('fuel.efGas', 0.202, 'tCO2e/MWh_th', { low: 0.2, high: 0.205, verify: 'National GHG inventory emission factors', ref: '§9.6' }),
  efDiesel: rec('fuel.efDiesel', 0.267, 'tCO2e/MWh_th', { low: 0.264, high: 0.27, verify: 'National GHG inventory emission factors', ref: '§9.6' }),
  efHvo: rec('fuel.efHvo', 0.03, 'tCO2e/MWh_th', { low: 0.0, high: 0.06, verify: 'HVO supplier sustainability data', ref: '§9.6', note: 'Fossil-equivalent proxy; biogenic CO₂ not counted. Indicative.' }),
  efHydrogen: rec('fuel.efHydrogen', 0, 'tCO2e/MWh_th', { low: 0, high: 0, ref: '§9.6', note: 'Scope 1 only; upstream production emissions not counted.' }),
};

export const COOLING = {};
function cooling(id, name, params) {
  COOLING[id] = { id, name, p: {} };
  for (const [k, v] of Object.entries(params)) {
    const [value, unit, low, high] = v;
    COOLING[id].p[k] = rec(`cooling.${id}.${k}`, value, unit, { low, high, verify: 'ASHRAE TC 9.9 thermal guidelines; vendor data; published design studies', ref: '§9.3', dist: typeof value === 'number' ? 'triangular' : 'fixed' });
  }
}
// basis: which temperature drives free cooling; fcThreshold: full free cooling below this; band: partial band width
cooling('air', 'Air (CHW + free cooling)', { tempBasis: ['drybulb', ''], fcThreshold: [10, '°C', 8, 14], band: [10, 'K', 6, 12], copRef: [5.0, 'COP at tRef', 4, 6], tRef: [25, '°C', 25, 25], copSlope: [0.12, 'COP per K', 0.08, 0.16], fanFrac: [0.07, 'MW per MW IT', 0.05, 0.09], lossFrac: [0.07, 'MW per MW IT', 0.05, 0.09], densityKWm2: [1.5, 'kW IT/m² whitespace', 1.2, 2.0], wueBase: [0.05, 'L/kWh IT', 0, 0.2], capexDeltaPerKW: [0, '€/kW IT vs air', 0, 0] });
cooling('evap', 'Evaporative-adiabatic', { tempBasis: ['wetbulb', ''], fcThreshold: [14, '°C wet-bulb', 12, 17], band: [6, 'K', 4, 8], copRef: [6.5, 'COP at tRef', 5, 8], tRef: [20, '°C wet-bulb', 20, 20], copSlope: [0.15, 'COP per K', 0.1, 0.2], fanFrac: [0.05, 'MW per MW IT', 0.04, 0.07], lossFrac: [0.07, 'MW per MW IT', 0.05, 0.09], densityKWm2: [1.8, 'kW IT/m² whitespace', 1.4, 2.2], wueBase: [0.3, 'L/kWh IT', 0.1, 0.5], wueEvap: [1.8, 'L/kWh IT in adiabatic hours', 1.2, 2.5], capexDeltaPerKW: [-40, '€/kW IT vs air', -80, 0] });
cooling('dlc', 'DLC + dry coolers', { tempBasis: ['drybulb', ''], fcThreshold: [26, '°C', 22, 30], band: [10, 'K', 6, 12], copRef: [5.5, 'COP at tRef', 4.5, 6.5], tRef: [35, '°C', 35, 35], copSlope: [0.1, 'COP per K', 0.06, 0.14], fanFrac: [0.045, 'MW per MW IT', 0.03, 0.06], lossFrac: [0.06, 'MW per MW IT', 0.05, 0.08], densityKWm2: [4.0, 'kW IT/m² whitespace', 3.0, 6.0], wueBase: [0.02, 'L/kWh IT', 0, 0.1], capexDeltaPerKW: [150, '€/kW IT vs air', 80, 250] });
cooling('immersion', 'Immersion', { tempBasis: ['drybulb', ''], fcThreshold: [30, '°C', 26, 34], band: [10, 'K', 6, 12], copRef: [5.5, 'COP at tRef', 4.5, 6.5], tRef: [38, '°C', 38, 38], copSlope: [0.1, 'COP per K', 0.06, 0.14], fanFrac: [0.03, 'MW per MW IT', 0.02, 0.05], lossFrac: [0.06, 'MW per MW IT', 0.05, 0.08], densityKWm2: [3.0, 'kW IT/m² whitespace', 2.0, 4.5], wueBase: [0.02, 'L/kWh IT', 0, 0.1], capexDeltaPerKW: [250, '€/kW IT vs air', 150, 400] });

export const PPA = {
  strike: {
    solar: rec('ppa.strike.solar', 55, '€/MWh', { low: 45, high: 70, verify: 'PPA market indices (e.g. LevelTen, Pexapark)', ref: '§9.5' }),
    wind: rec('ppa.strike.wind', 65, '€/MWh', { low: 55, high: 80, verify: 'PPA market indices', ref: '§9.5' }),
    hybrid: rec('ppa.strike.hybrid', 62, '€/MWh', { low: 50, high: 75, verify: 'PPA market indices', ref: '§9.5' }),
    baseload: rec('ppa.strike.baseload', 80, '€/MWh', { low: 65, high: 95, verify: 'PPA market indices', ref: '§9.5' }),
    cfe247: rec('ppa.strike.cfe247', 95, '€/MWh', { low: 80, high: 120, verify: 'PPA market indices', ref: '§9.5' }),
  },
  shapingAdder: rec('ppa.shapingAdder', 5, '€/MWh', { low: 2, high: 10, verify: 'PPA market indices', ref: '§9.5' }),
};

// ---------------------------------------------------------------------------
// Inputs (BRIEF §5). R = required (example values only), D = default, A = derived.
// ---------------------------------------------------------------------------
export const PRESETS = {
  Balanced: { cost: 35, carbon: 25, ttp: 25, deliverability: 15 },
  'Lowest cost': { cost: 70, carbon: 10, ttp: 10, deliverability: 10 },
  'Lowest carbon': { cost: 20, carbon: 60, ttp: 10, deliverability: 10 },
  'Speed to market': { cost: 20, carbon: 10, ttp: 60, deliverability: 10 },
  'Lowest risk': { cost: 25, carbon: 15, ttp: 20, deliverability: 40 },
};
REGISTRY['weights.presets'] = {
  path: 'weights.presets', value: PRESETS, unit: 'raw 0–100', low: null, high: null, distribution: 'fixed', basis: 'judgement',
  source: '', year: '', url: '', accessed: '', confidence: 'C', verified: false, sourceToVerify: '', note: 'First-cut judgement, no source.',
  briefRef: '§5.7', label: LABEL, derived: false,
};

// Pareto trade-off view settings (§12.2) and table display settings. View settings only: they never
// change any score or rank, and are not part of the inputs (so they never trigger a re-run). Labelled
// under the §23 rule. The code reads each value from here at the point of use (registryValue, and
// engine/view-defaults.js), so the record and the behaviour cannot drift apart; test 8f checks it.
function viewRec(path, value, unit, basis, note) {
  REGISTRY[path] = {
    path, value, unit, low: null, high: null, distribution: 'fixed', basis,
    source: '', year: '', url: '', accessed: '', confidence: 'C', verified: false, sourceToVerify: '', note,
    briefRef: '§12.2', label: LABEL, derived: false,
  };
}
viewRec('view.pareto.xAxis', 'follow-scoring', '"follow-scoring" | "lcoe" | "npv" | "location" | "market" | "cfe" | "ttp" | "deliverability"', 'judgement', 'Default x axis of the Pareto scatter. "follow-scoring" = the Cost axis metric (settings.costMetric, default LCOE); §12.2 default: cost vs carbon.');
viewRec('view.pareto.yAxis', 'follow-scoring', '"follow-scoring" | "lcoe" | "npv" | "location" | "market" | "cfe" | "ttp" | "deliverability"', 'judgement', 'Default y axis of the Pareto scatter. "follow-scoring" = the Carbon axis metric (settings.carbonMetric, default location-based).');
viewRec('view.pareto.ttpClasses', 5, 'quantile classes', 'run setting', 'Number of colour classes for time-to-power, quantiles over the scoring set.');
viewRec('view.pareto.canvasAbove', 500, 'points', 'run setting', 'Points are drawn on Canvas above this count (§4), SVG at or below it.');
viewRec('view.pareto.display', 'chart', '"chart" | "table"', 'judgement', 'Chart shown first; the table alternative is one click away and holds the same rows.');
viewRec('view.table.pageSize', 50, 'rows per page', 'run setting', 'Rows per page in the ranked table and the trade-off table; every page is reachable with the pager.');

// Required inputs: no default in the brief. The app pre-fills the T1 reference example
// so it can run on load; these are marked "example value — replace" in the UI, not defaults.
export const REQUIRED_EXAMPLE = {
  'project.lat': 52.29, 'project.lon': -1.53,
  'site.areaHa': 15, 'load.itMW': 100, 'grid.nowMW': 20, 'grid.fullMW': 120, 'grid.fullMonthsFromStart': 30,
};

export function buildDefaultInputs(opts = {}) {
  const start = opts.analysisStart || defaultAnalysisStart(opts.today);
  const inputs = {
    project: {
      name: rec('project.name', 'Untitled project', '', { basis: 'judgement', ref: '§5.1' }),
      lat: REQUIRED_EXAMPLE['project.lat'],
      lon: REQUIRED_EXAMPLE['project.lon'],
      country: rec('project.country', null, '', { basis: 'judgement', derived: true, note: 'null = derived from location (nearest built-in country centroid); overridable.', ref: '§5.1' }),
      currency: rec('project.currency', 'by country', '', { basis: 'judgement', derived: true, ref: '§5.1' }),
      analysisStart: rec('project.analysisStart', start, 'YYYY-MM', { basis: 'judgement', note: 'Today + 3 months. No source; replace with the client programme start.', ref: '§5.1' }),
      seed: rec('project.seed', 20261015, 'integer', { basis: 'run setting', ref: '§4' }),
    },
    site: {
      areaHa: REQUIRED_EXAMPLE['site.areaHa'],
      aspect: rec('site.aspect', 1.5, 'ratio', { low: 1, high: 3, basis: 'judgement', note: 'No source.', ref: '§5.2' }),
      setbackM: rec('site.setbackM', 10, 'm', { low: 5, high: 20, basis: 'judgement', note: 'No source; replace with local planning requirement.', ref: '§5.2' }),
      heightLimitM: rec('site.heightLimitM', 25, 'm', { low: 15, high: 40, basis: 'judgement', ref: '§5.2' }),
      roadsFraction: rec('site.roadsFraction', 0.15, 'fraction of net developable area', { low: 0.1, high: 0.25, basis: 'judgement', ref: '§5.2' }),
      offsiteLandHa: rec('site.offsiteLandHa', 0, 'ha', { basis: 'judgement', ref: '§5.2' }),
    },
    load: {
      itMW: REQUIRED_EXAMPLE['load.itMW'],
      phases: null, // set below
      rampStart: rec('load.rampStart', 0.5, 'fraction of phase IT at energisation', { low: 0.3, high: 0.8, basis: 'judgement', ref: '§5.3' }),
      rampMonths: rec('load.rampMonths', 12, 'months', { low: 6, high: 24, basis: 'judgement', ref: '§5.3' }),
      utilisation: rec('load.utilisation', 0.8, 'fraction of installed IT', { low: 0.6, high: 0.95, basis: 'judgement', ref: '§5.3' }),
      workload: rec('load.workload', 'cloud', '', { basis: 'judgement', note: 'Mixed cloud', ref: '§5.3' }),
      coolingApproach: rec('load.coolingApproach', 'open', '', { basis: 'judgement', note: 'Open choice (C8)', ref: '§5.3' }),
      grossUp: rec('load.grossUp', 2.2, 'GFA / whitespace', { low: 1.8, high: 2.6, basis: 'judgement', ref: '§5.3' }),
      storeys: rec('load.storeys', 2, 'storeys', { low: 1, high: 6, basis: 'judgement', ref: '§5.3' }),
      storeyHeightM: rec('load.storeyHeightM', 6.0, 'm', { low: 5, high: 7, basis: 'judgement', ref: '§5.3' }),
      roofZoneM: rec('load.roofZoneM', 4.0, 'm', { low: 3, high: 6, basis: 'judgement', ref: '§5.3' }),
      ancillaryFrac: rec('load.ancillaryFrac', 0.02, 'fraction of installed IT', { low: 0.01, high: 0.04, basis: 'judgement', ref: '§5.3' }),
      flexMaxPct: rec('load.flexMaxPct', 0.1, 'fraction of IT curtailable', { low: 0, high: 0.3, basis: 'judgement', ref: '§5.3' }),
      flexHours: rec('load.flexHours', 100, 'h/yr', { low: 0, high: 500, basis: 'judgement', ref: '§5.3' }),
    },
    grid: {
      nowMW: REQUIRED_EXAMPLE['grid.nowMW'],
      fullMW: REQUIRED_EXAMPLE['grid.fullMW'],
      fullDate: addMonths(start, REQUIRED_EXAMPLE['grid.fullMonthsFromStart']),
      steps: rec('grid.steps', [], 'list of {date, MW}', { basis: 'judgement', ref: '§5.4' }),
      exportMW: rec('grid.exportMW', 0, 'MW', { basis: 'judgement', ref: '§5.4' }),
      exportFactor: rec('grid.exportFactor', 0.9, '× hourly price', { low: 0.7, high: 1, basis: 'judgement', ref: '§5.4' }),
      priceAdder: rec('grid.priceAdder', 'by country', '€/MWh', { basis: 'source', derived: true, verify: 'National regulators (network charges, levies)', ref: '§5.4' }),
      priceMultiplier: rec('grid.priceMultiplier', 1, '× country profile', { low: 0.7, high: 1.5, basis: 'judgement', ref: '§5.4' }),
      carbonMultiplier: rec('grid.carbonMultiplier', 1, '× country profile', { low: 0.8, high: 1.2, basis: 'judgement', ref: '§5.4' }),
      dateUncertainty: rec('grid.dateUncertainty', [-6, 24], 'months', { basis: 'judgement', note: 'Feeds Monte Carlo (not in this slice).', ref: '§5.4' }),
    },
    utilities: {
      gasAvailable: rec('utilities.gasAvailable', 'Unknown', '', { basis: 'judgement', ref: '§5.4' }),
      gasDateMonths: rec('utilities.gasDateMonths', 18, 'months from project start', { low: 12, high: 36, basis: 'judgement', ref: '§5.4', note: 'Gas capacity unlimited from this date.' }),
      gasPrice: rec('utilities.gasPrice', 'by country', '€/MWh_th', { basis: 'source', derived: true, verify: 'TTF/NBP forward curves; national tariffs', ref: '§5.4' }),
      hydrogenAvailable: rec('utilities.hydrogenAvailable', 'No', '', { basis: 'judgement', ref: '§5.4' }),
      waterAvailable: rec('utilities.waterAvailable', 'Unknown', 'm³/day', { basis: 'judgement', ref: '§5.4' }),
      districtHeating: rec('utilities.districtHeating', 'No', '', { basis: 'judgement', ref: '§5.4' }),
    },
    requirements: {
      backedPct: rec('requirements.backedPct', 1.0, 'fraction of IT + essential mechanical', { low: 0.5, high: 1, basis: 'judgement', ref: '§5.5' }),
      topology: rec('requirements.topology', 'N+1', '', { basis: 'judgement', ref: '§5.5' }),
      autonomyH: rec('requirements.autonomyH', 48, 'h', { low: 12, high: 72, basis: 'judgement', ref: '§5.5' }),
      islanding: rec('requirements.islanding', 'No', '', { basis: 'judgement', ref: '§5.5', note: 'Default not stated in brief; "No" chosen (judgement).' }),
      upsMin: rec('requirements.upsMin', 5, 'min at full IT', { low: 5, high: 15, basis: 'judgement', ref: '§5.5' }),
      blockSize: rec('requirements.blockSize', 10, 'units per block', { low: 4, high: 20, basis: 'judgement', ref: '§9.2' }),
      catcherN: rec('requirements.catcherN', 4, 'blocks per catcher unit', { low: 2, high: 6, basis: 'judgement', ref: '§9.2' }),
      carbonTarget: rec('requirements.carbonTarget', null, 'gCO2e/kWh (annual average cap)', { basis: 'judgement', ref: '§5.5', note: 'None' }),
      capexCeiling: rec('requirements.capexCeiling', null, '€', { basis: 'judgement', ref: '§5.5', note: 'None' }),
      maxRunHours: rec('requirements.maxRunHours', null, 'h/yr', { basis: 'judgement', ref: '§5.5', note: 'None' }),
      iedMWth: rec('requirements.iedMWth', 50, 'MWth aggregated', { basis: 'source', verify: 'Directive 2010/75/EU (IED), consolidated text; check 2024 revision', ref: '§5.5' }),
      mcpMinMWth: rec('requirements.mcpMinMWth', 1, 'MWth per unit', { basis: 'source', verify: 'Directive (EU) 2015/2193 (MCPD)', ref: '§5.5' }),
      mcpMaxMWth: rec('requirements.mcpMaxMWth', 50, 'MWth per unit', { basis: 'source', verify: 'Directive (EU) 2015/2193 (MCPD)', ref: '§5.5' }),
      sevesoH2t: rec('requirements.sevesoH2t', 5, 't hydrogen stored', { basis: 'source', verify: 'Directive 2012/18/EU (Seveso III) Annex I lower tier', ref: '§5.5' }),
      sevesoFuelT: rec('requirements.sevesoFuelT', 2500, 't diesel/HVO stored', { basis: 'source', verify: 'Directive 2012/18/EU (Seveso III) Annex I lower tier', ref: '§5.5' }),
      testRunHours: rec('requirements.testRunHours', 12, 'h/yr per unit', { low: 6, high: 24, basis: 'judgement', ref: '§9.4' }),
      testRunLoad: rec('requirements.testRunLoad', 0.75, 'fraction of rating', { low: 0.5, high: 1, basis: 'judgement', ref: '§9.4' }),
      bessUpsGensetFraction: rec('requirements.bessUpsGensetFraction', 1.0, 'genset capacity as fraction of critical load at topology N', { basis: 'judgement', ref: '§8 C5', note: 'BESS-augmented UPS replaces redundant genset units with BESS for its duration.' }),
    },
    economics: {
      periodYears: rec('economics.periodYears', 20, 'yr', { low: 15, high: 25, basis: 'judgement', ref: '§5.6' }),
      wacc: rec('economics.wacc', 0.07, 'real', { low: 0.04, high: 0.12, basis: 'judgement', ref: '§5.6' }),
      contingency: rec('economics.contingency', 0.10, 'fraction of capex', { low: 0.05, high: 0.2, basis: 'judgement', ref: '§5.6' }),
      capexLow: rec('economics.capexLow', -0.30, 'fraction (AACE Class 5)', { basis: 'source', verify: 'AACE International RP 18R-97 (confirm revision and year)', ref: '§5.6' }),
      capexHigh: rec('economics.capexHigh', 0.50, 'fraction (AACE Class 5)', { basis: 'source', verify: 'AACE International RP 18R-97 (confirm revision and year)', ref: '§5.6' }),
      carbonPrice: rec('economics.carbonPrice', 'by country', '€/tCO2e', { basis: 'source', derived: true, verify: 'EU ETS / UK ETS exchange data, official projections', ref: '§5.6' }),
      carbonEscalation: rec('economics.carbonEscalation', 0.02, 'real per yr', { low: 0, high: 0.05, basis: 'source', verify: 'EU ETS / UK ETS forward curves', ref: '§5.6' }),
      elecEscalation: rec('economics.elecEscalation', 0, 'real per yr', { low: -0.02, high: 0.02, basis: 'source', verify: 'ENTSO-E / forward curves', ref: '§5.6' }),
      gasEscalation: rec('economics.gasEscalation', 0, 'real per yr', { low: -0.02, high: 0.02, basis: 'source', verify: 'TTF/NBP forward curves', ref: '§5.6' }),
      salvageFraction: rec('economics.salvageFraction', 0.5, 'of remaining book value when removed', { low: 0.2, high: 0.7, basis: 'judgement', ref: '§9.5' }),
      revenueExport: rec('economics.revenueExport', false, 'toggle', { basis: 'judgement', ref: '§5.6' }),
    },
    weights: {
      cost: rec('weights.cost', 35, 'raw 0–100', { basis: 'judgement', ref: '§5.7' }),
      carbon: rec('weights.carbon', 25, 'raw 0–100', { basis: 'judgement', ref: '§5.7' }),
      ttp: rec('weights.ttp', 25, 'raw 0–100', { basis: 'judgement', ref: '§5.7' }),
      deliverability: rec('weights.deliverability', 15, 'raw 0–100', { basis: 'judgement', ref: '§5.7' }),
    },
    deliverability: {
      emergingPenalty: rec('deliverability.emergingPenalty', 15, 'points per 100 % share', { basis: 'judgement', ref: '§9.9' }),
      nascentPenalty: rec('deliverability.nascentPenalty', 40, 'points per 100 % share', { basis: 'judgement', ref: '§9.9' }),
      majorFlagPenalty: rec('deliverability.majorFlagPenalty', 8, 'points per major permitting flag', { basis: 'judgement', ref: '§9.9' }),
      minorFlagPenalty: rec('deliverability.minorFlagPenalty', 3, 'points per minor permitting flag', { basis: 'judgement', ref: '§9.9' }),
      gasUnknownPenalty: rec('deliverability.gasUnknownPenalty', 10, 'points', { basis: 'judgement', ref: '§9.9' }),
      hydrogenPenalty: rec('deliverability.hydrogenPenalty', 10, 'points', { basis: 'judgement', ref: '§9.9' }),
      leadTimePenalty: rec('deliverability.leadTimePenalty', 5, 'points per technology', { basis: 'judgement', ref: '§9.9' }),
      leadTimeThresholdM: rec('deliverability.leadTimeThresholdM', 24, 'months procurement', { basis: 'judgement', ref: '§9.9' }),
      siteFitPenalty: rec('deliverability.siteFitPenalty', false, 'toggle', { basis: 'judgement', ref: '§9.9', note: 'Off by default. Site fit is not assessed in this slice (no layout).' }),
    },
    settings: {
      generationCap: rec('settings.generationCap', 2000, 'options', { basis: 'run setting', ref: '§7.2' }),
      sampleAboveCap: rec('settings.sampleAboveCap', true, 'toggle', { basis: 'judgement', ref: '§7.2' }),
      gridHandling: rec('settings.gridHandling', 'unmet', '"unmet" | "exceedance"', { basis: 'judgement', ref: '§9.4', note: 'Show unmet load' }),
      runHourHandling: rec('settings.runHourHandling', 'flag', '"flag" | "respect"', { basis: 'judgement', ref: '§9.4', note: 'Flag only' }),
      costMetric: rec('settings.costMetric', 'lcoe', '"lcoe" | "npv"', { basis: 'judgement', ref: '§11' }),
      carbonMetric: rec('settings.carbonMetric', 'location', '"location" | "market" | "cfe"', { basis: 'judgement', ref: '§9.6' }),
      absoluteScaling: rec('settings.absoluteScaling', false, 'toggle', { basis: 'judgement', ref: '§11', note: 'Hook only in this slice.' }),
      rankCompliantFirst: rec('settings.rankCompliantFirst', false, 'toggle', { basis: 'judgement', ref: '§11' }),
      hideDominated: rec('settings.hideDominated', false, 'toggle', { basis: 'judgement', ref: '§7.2 step 6' }),
      windSiteThresholdHa: rec('settings.windSiteThresholdHa', 20, 'ha', { basis: 'judgement', ref: '§8 C11' }),
      fixedSolarMWp: rec('settings.fixedSolarMWp', 5, 'MWp', { basis: 'judgement', ref: '§8 C10', note: 'User value for "Fixed MWp".' }),
      bridgeBessHours: rec('settings.bridgeBessHours', 24, 'h', { basis: 'judgement', ref: '§9.2' }),
      timelineMonths: rec('settings.timelineMonths', 120, 'months', { basis: 'run setting', ref: '§9.8', note: 'Time-to-power horizon.' }),
      maxDispatchYears: rec('settings.maxDispatchYears', 8, 'years', { basis: 'run setting', ref: '§9.1', note: 'Distinct 8760-h dispatch years before steady state is assumed.' }),
      autonomyBasis: rec('settings.autonomyBasis', 'critical load', '', { basis: 'judgement', ref: '§9.2' }),
    },
  };
  // Phasing default: 1 phase, 100 % at grid full-connection date (§5.3). null = follow the rule.
  inputs.load.phases = rec('load.phases', null, 'list of {itMW, date}', { basis: 'judgement', derived: true, ref: '§5.3', note: 'null = 1 phase, 100 % of IT at the grid full-connection date' });
  // Choice states: null = default state (§8 table), which may follow other inputs (C6, C7, C8, C11, C15).
  inputs.choices = {};
  for (const c of CHOICES) inputs.choices[c.id] = null;
  return inputs;
}

// Resolve derived defaults (phases, choice default states) into a fully specified copy.
// The engine always runs on normalised inputs; the UI keeps null for "at default".
export function normalizeInputs(inputs) {
  const out = JSON.parse(JSON.stringify(inputs));
  if (!Array.isArray(out.load.phases) || out.load.phases.length === 0) {
    out.load.phases = [{ itMW: out.load.itMW, date: out.grid.fullDate }];
  }
  out.choices = out.choices || {};
  for (const c of CHOICES) {
    if (!out.choices[c.id]) out.choices[c.id] = defaultChoiceState(c.id, out);
  }
  return out;
}

// T1 reference project (§21): 100 MW IT, 4 × 25 MW phases, 15 ha, grid 20 MW now, 120 MW in 30 months.
// Phase dates are not given by the brief; months 18/30/42/54 from start are used (recorded in BUILD-NOTES).
export function referenceT1(opts = {}) {
  const inputs = buildDefaultInputs(opts);
  const s = inputs.project.analysisStart;
  inputs.project.name = 'T1 reference (example)';
  inputs.utilities.gasAvailable = 'Yes';
  inputs.load.phases = [18, 30, 42, 54].map((m) => ({ itMW: 25, date: addMonths(s, m) }));
  return inputs;
}

export function referenceT3(opts = {}) {
  const inputs = referenceT1(opts);
  inputs.project.name = 'T3 no grid (example)';
  inputs.grid.nowMW = 0;
  inputs.grid.fullMW = 0;
  inputs.grid.fullDate = addMonths(inputs.project.analysisStart, 60);
  return inputs;
}

export function getRegistry() {
  return REGISTRY;
}

// Value of a §18 record. Input and run-setting records (settings.*, weights.*, …) are created by
// buildDefaultInputs(), so the registry is filled on first use if a record is not there yet.
// Throws for an unknown path, so a typo cannot silently fall back to a hard-coded value.
export function registryValue(path) {
  if (!(path in REGISTRY)) buildDefaultInputs();
  const r = REGISTRY[path];
  if (!r) throw new Error(`No §18 default record for "${path}"`);
  return r.value;
}

// Read a value by dotted path from an inputs object.
export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// Is the value at `path` still the registry default (so the label must show)?
export function isAtDefault(inputs, path) {
  const r = REGISTRY[path];
  if (!r) return false;
  const cur = getPath(inputs, path);
  if (path.startsWith('choices.')) {
    if (cur == null) return true;
    const d = defaultChoiceState(path.slice(8), inputs);
    return JSON.stringify({ state: cur.state, values: cur.values }) === JSON.stringify({ state: d.state, values: d.values });
  }
  if (cur == null && r.derived) return true;
  if (r.derived && typeof r.value === 'string' && r.value.startsWith('by ')) return true;
  return JSON.stringify(cur) === JSON.stringify(r.value);
}
