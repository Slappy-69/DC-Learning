// Input model and defaults registry (BRIEF §5, §6, §8, §18, §23).
//
// Every default (numeric input, threshold, weight, penalty, run setting, view/ranking
// setting, input-state default and choice default state) is stored as a §18 record.
// A record that has not been researched has confidence "C", verified false and label
// "indicative — unverified" (§23 label rule); where the brief names a source to verify against,
// it is kept in `sourceToVerify`. A record researched and approved by the owner (work package 0,
// owner decision 2026-10-22, OPEN-QUESTIONS 36) has `source`, `year`, `url` and `accessed` filled,
// confidence "B", verified false and label "sourced — not independently checked". No record is
// verified until a person responsible for the data has checked it.

import { defaultAnalysisStart, addMonths } from './dates.js';
import { makeProjection, meanLatLon, validateRing } from './geometry.js';

export const LABEL = 'indicative — unverified';
export const LABEL_SOURCED = 'sourced — not independently checked';

// Source records approved by the owner (work package 0). Each: source (publication and the figure used),
// year (date of the value), url, accessed (date the link was opened), approved (owner approval date).
const SRC = {
  euEts: { source: 'ICE EUA December 2026 futures close, reported by GMK Center, "European carbon prices rose to €88/t in October" (15 Oct 2026)', year: '2026-10-12', url: 'https://gmk.center/en/news/european-carbon-prices-rose-to-e88-t-in-october/', accessed: '2026-10-22', approved: '2026-10-22' },
  ukEts: { source: 'ICE UKA December 2026 futures, £62.90/t on 7 Oct 2026, reported by ClearBlue Markets (9 Oct 2026); converted at the ECB reference rate of 22 Oct 2026 (0.83770 £/€) = €75.09/t', year: '2026-10-07', url: 'https://www.clearbluemarkets.com/knowledge-base/ukas-rally-4-on-reports-of-a-uk-eu-ets-linkage-deal', accessed: '2026-10-22', approved: '2026-10-22' },
  hydrogen: { source: 'EEX HYDRIX renewable hydrogen index, 2025 average €8.20/kg; range €7–10/kg from ACER European hydrogen markets 2025, reported by pv magazine (3 Dec 2025); 33.3 kWh/kg (LHV)', year: '2025', url: 'https://www.pv-magazine.com/2025/12/03/price-gap-between-conventional-renewable-hydrogen-widens-in-europe/', accessed: '2026-10-22', approved: '2026-10-22' },
  fx: { source: 'European Central Bank euro foreign exchange reference rates', year: '2026-10-22', url: 'https://www.ecb.europa.eu/stats/shared/pdf/eurofxref.pdf', accessed: '2026-10-22', approved: '2026-10-22' },
};

// Fill a record's source fields and give it the "sourced" label.
function applySource(r, src) {
  if (!src) return r;
  Object.assign(r, { source: src.source, year: src.year, url: src.url, accessed: src.accessed, approved: src.approved, confidence: 'B', verified: false, label: LABEL_SOURCED });
  return r;
}

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
  applySource(REGISTRY[path], opts.src);
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
// Carbon prices (§5.6): latest market price with its date (walkthrough, 2026-10-21). One record per
// scheme; the country table takes its value from these. Switzerland keeps an unresearched value.
const EU_ETS = rec('country.carbonPrice.euEts', 88.3, '€/tCO2e', { dist: 'fixed', ref: '§5.6', src: SRC.euEts,
  note: 'EU ETS price for EU-27, Norway and Iceland. Escalates at the carbon escalation rate.' });
const UK_ETS = rec('country.carbonPrice.ukEts', 75, '€/tCO2e', { dist: 'fixed', ref: '§5.6', src: SRC.ukEts,
  note: 'UK ETS price for the United Kingdom, rounded from €75.09. Escalates at the carbon escalation rate.' });
const C = (name, currency, lat, lon, tMean, tAmp, solarYield, windCF, price, adder, carbon, gas, carbonPrice, eu, decarb2050) =>
  ({ name, currency, lat, lon, tMean, tAmp, solarYield, windCF, price, adder, carbon, gas, carbonPrice, eu, decarb2050 });

export const COUNTRIES = {
  AT: C('Austria', 'EUR', 47.6, 14.1, 8.5, 10.0, 1100, 0.24, 100, 45, 110, 42, EU_ETS, true, 0.15),
  BE: C('Belgium', 'EUR', 50.6, 4.6, 10.5, 7.5, 950, 0.28, 90, 50, 140, 40, EU_ETS, true, 0.15),
  BG: C('Bulgaria', 'EUR', 42.7, 25.5, 11.5, 11.0, 1350, 0.22, 95, 35, 400, 42, EU_ETS, true, 0.25),
  HR: C('Croatia', 'EUR', 45.1, 15.2, 12.0, 10.0, 1250, 0.25, 100, 40, 200, 42, EU_ETS, true, 0.2),
  CY: C('Cyprus', 'EUR', 35.1, 33.4, 19.5, 8.5, 1650, 0.22, 140, 40, 600, 70, EU_ETS, true, 0.3),
  CZ: C('Czechia', 'EUR', 49.8, 15.5, 8.5, 9.5, 1000, 0.24, 95, 45, 430, 42, EU_ETS, true, 0.25),
  DK: C('Denmark', 'DKK', 56.0, 10.0, 8.5, 7.5, 950, 0.34, 80, 40, 130, 40, EU_ETS, true, 0.1),
  EE: C('Estonia', 'EUR', 58.6, 25.0, 6.0, 10.5, 900, 0.30, 90, 35, 500, 42, EU_ETS, true, 0.2),
  FI: C('Finland', 'EUR', 61.9, 25.7, 4.0, 11.0, 850, 0.30, 55, 30, 80, 45, EU_ETS, true, 0.1),
  FR: C('France', 'EUR', 46.6, 2.2, 12.0, 8.0, 1200, 0.26, 85, 40, 55, 40, EU_ETS, true, 0.5),
  DE: C('Germany', 'EUR', 51.2, 10.4, 9.5, 8.5, 1000, 0.27, 95, 55, 380, 40, EU_ETS, true, 0.15),
  GR: C('Greece', 'EUR', 39.1, 21.8, 16.5, 9.5, 1550, 0.27, 105, 40, 330, 42, EU_ETS, true, 0.2),
  HU: C('Hungary', 'EUR', 47.2, 19.5, 11.0, 11.0, 1250, 0.22, 105, 40, 200, 42, EU_ETS, true, 0.2),
  IE: C('Ireland', 'EUR', 53.4, -8.2, 10.0, 5.0, 900, 0.35, 110, 50, 280, 42, EU_ETS, true, 0.15),
  IT: C('Italy', 'EUR', 42.8, 12.6, 14.5, 9.5, 1400, 0.22, 120, 45, 280, 45, EU_ETS, true, 0.2),
  LV: C('Latvia', 'EUR', 56.9, 24.6, 6.5, 10.5, 900, 0.28, 90, 35, 120, 42, EU_ETS, true, 0.15),
  LT: C('Lithuania', 'EUR', 55.2, 23.9, 7.0, 10.5, 950, 0.28, 90, 35, 180, 42, EU_ETS, true, 0.15),
  LU: C('Luxembourg', 'EUR', 49.8, 6.1, 9.5, 8.0, 980, 0.25, 95, 45, 120, 42, EU_ETS, true, 0.15),
  MT: C('Malta', 'EUR', 35.9, 14.4, 19.0, 7.5, 1650, 0.25, 130, 40, 380, 60, EU_ETS, true, 0.3),
  NL: C('Netherlands', 'EUR', 52.1, 5.3, 10.5, 7.0, 950, 0.32, 90, 45, 300, 40, EU_ETS, true, 0.15),
  PL: C('Poland', 'EUR', 51.9, 19.1, 8.5, 10.0, 1000, 0.27, 110, 40, 660, 42, EU_ETS, true, 0.3),
  PT: C('Portugal', 'EUR', 39.4, -8.2, 16.0, 6.5, 1550, 0.27, 75, 40, 140, 42, EU_ETS, true, 0.1),
  RO: C('Romania', 'EUR', 45.9, 24.9, 10.5, 11.5, 1300, 0.24, 100, 35, 260, 42, EU_ETS, true, 0.2),
  SK: C('Slovakia', 'EUR', 48.7, 19.7, 9.5, 10.5, 1150, 0.22, 100, 40, 120, 42, EU_ETS, true, 0.2),
  SI: C('Slovenia', 'EUR', 46.1, 14.9, 10.5, 10.0, 1200, 0.22, 105, 40, 230, 42, EU_ETS, true, 0.2),
  ES: C('Spain', 'EUR', 40.4, -3.7, 15.0, 9.0, 1650, 0.26, 70, 40, 150, 40, EU_ETS, true, 0.1),
  SE: C('Sweden', 'SEK', 60.1, 18.6, 6.5, 10.0, 900, 0.31, 45, 30, 25, 45, EU_ETS, true, 0.5),
  GB: C('United Kingdom', 'GBP', 52.4, -1.5, 10.0, 6.5, 950, 0.34, 95, 55, 200, 40, UK_ETS, false, 0.1),
  NO: C('Norway', 'NOK', 60.5, 8.5, 5.5, 9.0, 850, 0.32, 50, 25, 25, 45, EU_ETS, false, 0.5),
  CH: C('Switzerland', 'CHF', 46.8, 8.2, 9.0, 9.0, 1150, 0.20, 95, 50, 40, 45, 85, false, 0.5),
  IS: C('Iceland', 'ISK', 64.9, -19.0, 4.5, 6.0, 700, 0.38, 40, 25, 15, 80, EU_ETS, false, 0.8),
};
REGISTRY['profiles.countries'] = {
  path: 'profiles.countries', value: 'built-in synthetic country set (31)', unit: '', low: null, high: null,
  distribution: 'fixed', basis: 'source', source: '', year: '', url: '', accessed: '', confidence: 'C', verified: false,
  sourceToVerify: 'PVGIS (EU JRC), Renewables.ninja / ERA5, ENTSO-E Transparency Platform, Ember, TTF/NBP, EU ETS / UK ETS',
  note: 'Synthetic calibration targets for seeded synthetic hourly profiles. Not measured data. Replace with verified profiles.',
  briefRef: '§5.1, §18', label: LABEL, derived: false,
};

// Exchange rates to EUR (display only). Indicative; ECB reference rates to verify.
export const FX = { EUR: 1, GBP: 0.83770, NOK: 10.4880, SEK: 11.1120, DKK: 7.4747, CHF: 0.9211, ISK: 136.20 };
REGISTRY['project.fx'] = {
  path: 'project.fx', value: FX, unit: 'per EUR', low: null, high: null, distribution: 'fixed', basis: 'source',
  source: '', year: '', url: '', accessed: '', confidence: 'C', verified: false, sourceToVerify: 'ECB reference rates',
  note: 'Fixed rates; display conversion only. Engine works in EUR.', briefRef: '§5.1', label: LABEL, derived: false,
};
applySource(REGISTRY['project.fx'], SRC.fx);

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
    ['remove', 'Remove'], ['backup', 'Retain as backup'], ['prime', 'Retain as prime'], ['gridServices', 'Retain for grid services'],
    // OPEN-QUESTIONS 59 (2026-10-23): the owner's alternative (b) of OPEN-QUESTIONS 42.
    ['split', 'Keep shortfall share as prime, rest as backup']] },
  { id: 'C4', name: 'Primary firm on-site generation', values: [
    ['none', 'None'], ['chp', 'Gas CHP-trigen'], ['gasRecip', 'Gas recips'], ['fuelCell', 'Fuel cells'], ['smr', 'SMR'], ['hydrogen', 'Hydrogen']] },
  // OPEN-QUESTIONS 58 (2026-10-23): each C4 technology sized two ways, so the ranking compares a baseload plant with
  // a top-up plant that closes the permanent shortfall.
  { id: 'C4s', name: 'Firm generation sizing', values: [['average', 'Average load (baseload)'], ['shortfall', 'Permanent shortfall (top-up)']] },
  { id: 'C5', name: 'Backup power technology', values: [
    ['diesel', 'Diesel gensets'], ['hvo', 'HVO gensets'], ['gas', 'Gas gensets'], ['bessUps', 'BESS-augmented UPS + reduced gensets'],
    ['retained', 'Retained bridging plant'], ['none', 'None']] },
  // OPEN-QUESTIONS 47 and 48 (2026-10-22): one backup technology per building, or backup pooled across the campus.
  { id: 'C5a', name: 'Backup arrangement', values: [['perBuilding', 'Per building'], ['pooled', 'Pooled across the campus']] },
  { id: 'C6', name: 'Backup topology', values: [['N', 'N'], ['N+1', 'N+1'], ['2N', '2N'], ['catcher', 'Distributed-redundant (catcher)']] },
  { id: 'C7', name: 'Autonomy / fuel storage', values: [['12', '12 h'], ['24', '24 h'], ['48', '48 h'], ['72', '72 h']] },
  { id: 'C8', name: 'Cooling approach', values: [['air', 'Air (CHW + free cooling)'], ['evap', 'Evaporative-adiabatic'], ['dlc', 'DLC + dry coolers'], ['immersion', 'Immersion']] },
  { id: 'C9', name: 'Heat rejection location', values: [['roof', 'Roof'], ['ground', 'Ground'], ['split', 'Split']] },
  { id: 'C10', name: 'On-site solar', values: [
    ['none', 'None'], ['roof', 'Roof only'], ['roofGround', 'Roof + ground']] },
  { id: 'C11', name: 'On-site wind', values: [['none', 'None'], ['fit', 'Fit as many as separations allow'], ['offsite', 'Off-site land']] },
  { id: 'C12', name: 'BESS size', values: [
    ['none', 'None'], ['1h25', '1 h at 25 %'], ['1h50', '1 h at 50 %'], ['2h25', '2 h at 25 %'], ['2h50', '2 h at 50 %'], ['4h25', '4 h at 25 %'], ['4h50', '4 h at 50 %'],
    // OPEN-QUESTIONS 60 (2026-10-23): a battery sized to the permanent shortfall on the design day counts as firm supply.
    ['shortfall', 'Sized to the permanent shortfall'],
    // OPEN-QUESTIONS 33 (2026-10-23): generated when flexibility is on (C16).
    ['trigger', 'Sized to the trigger hours']] },
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
    case 'C3': return { state: 'open', values: ['remove', 'backup', 'prime', 'gridServices', 'split'] };
    case 'C4': return { state: 'open', values: ['none', 'chp', 'fuelCell'] };
    case 'C5': return { state: 'open', values: ['hvo', 'diesel', 'retained'] };
    case 'C5a': return { state: 'open', values: ['perBuilding', 'pooled'] };
    case 'C6': return { state: 'locked', values: [inputs ? inputs.requirements.topology : 'N+1'] };
    case 'C7': return { state: 'locked', values: [inputs ? String(inputs.requirements.autonomyH) : '48'] };
    case 'C8': {
      const ca = inputs ? inputs.load.coolingApproach : 'open';
      return ca === 'open' ? { state: 'open', values: ['air', 'evap', 'dlc', 'immersion'] } : { state: 'locked', values: [ca] };
    }
    case 'C9': return { state: 'open', values: ['roof', 'ground', 'split'] };
    case 'C10': {
      // OPEN-QUESTIONS 54 (2026-10-22): "Roof + ground" only when the engineer has entered a ground area for PV.
      const ground = inputs ? inputs.site.pvGroundHa > 0 : false;
      return ground ? { state: 'open', values: ['none', 'roof', 'roofGround'] } : { state: 'open', values: ['none', 'roof'], groundDefault: true };
    }
    case 'C11': {
      const small = inputs ? inputs.site.areaHa <= inputs.settings.windSiteThresholdHa && !(inputs.site.offsiteLandHa > 0) : true;
      return small ? { state: 'open', values: ['none'], windDefault: true } : { state: 'open', values: ['none', 'fit', 'offsite'] };
    }
    case 'C12': return { state: 'open', values: ['none', '2h25', '4h50', 'shortfall', 'trigger'] };
    case 'C4s': return { state: 'open', values: ['average', 'shortfall'] };
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
    basis: 'judgement', ref: '§8', derived: ['C6', 'C7', 'C8', 'C10', 'C11', 'C15'].includes(c.id),
    note: c.id === 'C11' ? 'Default "None" when site area ≤ 20 ha and no off-site land; otherwise open.' :
      c.id === 'C10' ? 'Default None and Roof only; Roof + ground is added when the ground area for PV (site.pvGroundHa) is above 0 (OPEN-QUESTIONS 54, 2026-10-22).' :
      c.id === 'C12r' ? 'Default role "peak-shave against grid cap" (§8 C12).' :
      c.id === 'C5a' ? 'Both arrangements generated (OPEN-QUESTIONS 47, 48, 2026-10-22): per building is the rule; pooled is studied alongside and carries a client-perceived risk item in deliverability.' :
      c.id === 'C4s' ? 'Both sizings generated (OPEN-QUESTIONS 58, 2026-10-23); "Permanent shortfall" only for cooling types with a permanent shortfall (rule g).' : '',
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
tech('solarGround', { name: 'Solar PV ground-mount', role: 'intermittent', maturity: 'Commercial', ownConsent: true }, {
  capexPerKW: [700, '€/kWp', 600, 800], fomPerKW: [12, '€/kWp/yr', 9, 15], life: [30, 'yr', 25, 35],
  haPerMWp: [1.2, 'ha/MWp', 0.8, 1.8], planM: [9, 'months', 6, 18], procM: [6, 'months', 3, 9], buildM: [6, 'months', 4, 9] });
tech('solarRoof', { name: 'Solar PV rooftop', role: 'intermittent', maturity: 'Commercial' }, {
  capexPerKW: [900, '€/kWp', 750, 1100], fomPerKW: [14, '€/kWp/yr', 10, 18], life: [25, 'yr', 20, 30],
  m2PerKWp: [5.5, 'm²/kWp', 4.5, 7.0], usableFraction: [0.5, 'fraction of free roof', 0.4, 0.6],
  procM: [6, 'months', 3, 9], buildM: [4, 'months', 3, 6] });
tech('wind', { name: 'Wind onshore', role: 'intermittent', maturity: 'Commercial', ownConsent: true }, {
  capexPerKW: [1350, '€/kW', 1200, 1500], fomPerKW: [35, '€/kW/yr', 25, 45], life: [25, 'yr', 20, 30],
  turbineMW: [5, 'MW', 3, 6], tipHeightM: [180, 'm', 150, 220], toppleFactor: [1.5, '× tip height', 1.1, 2.0],
  haPerTurbine: [33.75, 'ha per turbine (5 × 3 rotor diameters)', 20, 50],
  planM: [24, 'months', 12, 48], procM: [18, 'months', 12, 24], buildM: [12, 'months', 9, 18] });
tech('bess', { name: 'BESS (Li-ion, containerised)', role: 'storage', maturity: 'Commercial' }, {
  capexPerKWh: [250, '€/kWh', 200, 350], capexPerKW: [150, '€/kW', 100, 200], fomPct: [0.015, 'fraction of capex/yr', 0.01, 0.025],
  rte: [0.88, 'round-trip efficiency', 0.85, 0.92], life: [15, 'yr', 12, 20], m2PerMWh: [50, 'm²/MWh', 30, 90],
  socInit: [0.5, 'fraction', 0.5, 0.5], procM: [9, 'months', 6, 15], buildM: [6, 'months', 3, 9] });
tech('gasRecip', { name: 'Gas reciprocating engines', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Danish Energy Agency Technology Catalogue; vendor data' }, {
  capexPerKW: [900, '€/kW', 800, 1000], fomPerKW: [15, '€/kW/yr', 10, 20], vomPerMWh: [8, '€/MWh', 5, 12], eff: [0.44, 'electrical efficiency (LHV)', 0.40, 0.48],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [4.5, 'MW', 2, 10], life: [20, 'yr', 15, 25], m2PerMW: [200, 'm²/MWe', 120, 300],
  stackM: [25, 'm', 20, 30], procM: [9, 'months', 6, 15], buildM: [6, 'months', 4, 9] });
tech('gasTurbine', { name: 'Gas turbines (OCGT / aeroderivative)', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Danish Energy Agency Technology Catalogue; vendor data' }, {
  capexPerKW: [750, '€/kW', 600, 900], fomPerKW: [12, '€/kW/yr', 8, 16], vomPerMWh: [6, '€/MWh', 4, 9], eff: [0.38, 'electrical efficiency (LHV)', 0.33, 0.42],
  msl: [0.4, 'min stable load fraction', 0.3, 0.5], unitMW: [30, 'MW', 10, 50], life: [25, 'yr', 20, 30], m2PerMW: [120, 'm²/MWe', 80, 200],
  stackM: [30, 'm', 25, 40], procM: [12, 'months', 9, 24], buildM: [6, 'months', 4, 9] });
tech('chp', { name: 'Gas CHP / trigeneration', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Vendor data; Danish Energy Agency Technology Catalogue' }, {
  capexPerKW: [1300, '€/kW', 1100, 1600], fomPerKW: [20, '€/kW/yr', 15, 28], vomPerMWh: [10, '€/MWh', 7, 14], eff: [0.42, 'electrical efficiency (LHV)', 0.38, 0.46],
  heatToPower: [1.0, 'MWth recoverable per MWe', 0.8, 1.2], absorptionCOP: [0.7, 'COP', 0.6, 0.8], msl: [0.4, 'min stable load fraction', 0.3, 0.5],
  unitMW: [4.5, 'MW', 2, 10], life: [20, 'yr', 15, 25], m2PerMW: [280, 'm²/MWe (recip + 40 %)', 170, 420], stackM: [25, 'm', 20, 30],
  sizeFraction: [1.0, 'fraction of average facility load', 0.5, 1.0],
  procM: [12, 'months', 9, 18], buildM: [9, 'months', 6, 12] });
tech('fuelCell', { name: 'Fuel cells (SOFC)', role: 'firm', maturity: 'Emerging', fuel: 'gas', combustion: false, verify: 'Vendor data' }, {
  capexPerKW: [2800, '€/kW', 2200, 3500], fomPerKW: [40, '€/kW/yr', 30, 60], vomPerMWh: [5, '€/MWh', 3, 8], eff: [0.55, 'electrical efficiency (LHV)', 0.5, 0.6],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [1, 'MW', 0.3, 2], life: [20, 'yr', 15, 25], stackLife: [7, 'yr', 5, 10], stackFraction: [0.25, 'fraction of capex', 0.2, 0.35],
  m2PerMW: [120, 'm²/MW', 60, 200], procM: [6, 'months', 4, 12], buildM: [3, 'months', 2, 6] });
tech('dieselPrime', { name: 'HVO-diesel prime gensets', role: 'firm', maturity: 'Commercial', fuel: 'diesel', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [450, '€/kW', 350, 550], fomPerKW: [10, '€/kW/yr', 6, 14], vomPerMWh: [12, '€/MWh', 8, 16], eff: [0.40, 'electrical efficiency', 0.36, 0.43],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [2.75, 'MW', 2.5, 3.0], life: [15, 'yr', 10, 20], m2PerMW: [40, 'm²/MW', 28, 56],
  stackM: [10, 'm', 8, 12], procM: [9, 'months', 6, 15], buildM: [3, 'months', 2, 6] });
tech('rented', { name: 'Rented temporary generation (gas)', role: 'firm', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Rental vendor indications' }, {
  rentalPerKWMonth: [12, '€/kW/month', 8, 18], vomPerMWh: [10, '€/MWh', 6, 14], eff: [0.38, 'electrical efficiency', 0.34, 0.42],
  msl: [0.3, 'min stable load fraction', 0.2, 0.4], unitMW: [2, 'MW', 1, 3], m2PerMW: [150, 'm²/MW', 100, 250], stackM: [10, 'm', 8, 12],
  procM: [2, 'months', 1, 4], buildM: [2, 'months', 1, 3] });
tech('smr', { name: 'Small modular reactor', role: 'firm', maturity: 'Nascent', fuel: 'nuclear', combustion: false, ownConsent: true, verify: 'Vendor and regulator publications' }, {
  capexPerKW: [7000, '€/kW', 5000, 12000], fomPerKW: [120, '€/kW/yr', 80, 160], vomPerMWh: [3, '€/MWh', 2, 5], fuelPerMWhE: [9, '€/MWh_e', 6, 12],
  msl: [0.5, 'min stable load fraction', 0.4, 0.7], unitMW: [80, 'MW', 50, 300], life: [60, 'yr', 40, 80], earliestYear: [2035, 'year', 2032, 2040],
  planM: [36, 'months', 24, 60], procM: [36, 'months', 24, 48], buildM: [48, 'months', 36, 72] });
tech('hydrogen', { name: 'Hydrogen gensets / fuel cells', role: 'firm', maturity: 'Nascent', fuel: 'hydrogen', combustion: true, verify: 'National hazardous-substance regulation; specialist input; vendor data' }, {
  capexPerKW: [2500, '€/kW', 1800, 3500], fomPerKW: [40, '€/kW/yr', 30, 60], vomPerMWh: [5, '€/MWh', 3, 8], eff: [0.5, 'electrical efficiency (LHV)', 0.4, 0.55],
  msl: [0.2, 'min stable load fraction', 0.1, 0.3], unitMW: [1, 'MW', 0.5, 2], life: [15, 'yr', 10, 20], m2PerMW: [300, 'm²/MW + storage', 200, 450],
  storageHours: [24, 'h of full output stored on site', 12, 48],
  procM: [18, 'months', 12, 30], buildM: [9, 'months', 6, 12] });
tech('backupDiesel', { name: 'Diesel standby gensets', role: 'backup', maturity: 'Commercial', fuel: 'diesel', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [450, '€/kW', 350, 550], fomPerKW: [8, '€/kW/yr', 5, 12], unitMW: [2.75, 'MW', 2.5, 3.0], eff: [0.38, 'electrical efficiency', 0.35, 0.42],
  life: [25, 'yr', 20, 30], m2PerUnit: [100, 'm² per unit incl. access', 70, 140], stackM: [10, 'm', 8, 12],
  procM: [12, 'months', 9, 18], buildM: [6, 'months', 3, 9] });
tech('backupHvo', { name: 'HVO standby gensets', role: 'backup', maturity: 'Commercial', fuel: 'hvo', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [460, '€/kW', 360, 560], fomPerKW: [8, '€/kW/yr', 5, 12], unitMW: [2.75, 'MW', 2.5, 3.0], eff: [0.38, 'electrical efficiency', 0.35, 0.42],
  life: [25, 'yr', 20, 30], m2PerUnit: [100, 'm² per unit incl. access', 70, 140], stackM: [10, 'm', 8, 12],
  procM: [12, 'months', 9, 18], buildM: [6, 'months', 3, 9] });
tech('backupGas', { name: 'Gas standby gensets', role: 'backup', maturity: 'Commercial', fuel: 'gas', combustion: true, verify: 'Manufacturer datasheets' }, {
  capexPerKW: [550, '€/kW', 450, 700], fomPerKW: [9, '€/kW/yr', 6, 13], unitMW: [2.0, 'MW', 1.5, 2.5], eff: [0.40, 'electrical efficiency', 0.36, 0.43],
  life: [25, 'yr', 20, 30], m2PerUnit: [110, 'm² per unit incl. access', 80, 150], stackM: [10, 'm', 8, 12],
  procM: [12, 'months', 9, 18], buildM: [6, 'months', 3, 9] });
// Resilience reserve battery (UPS ride-through, walkthrough 2026-10-21): the battery energy only; the UPS electronics are
// part of the electrical fit-out, outside the capex scope.
tech('upsReserve', { name: 'Resilience reserve battery (UPS)', role: 'backup', maturity: 'Commercial', verify: 'UPS battery cabinet vendor pricing' }, {
  capexPerKWh: [500, '€/kWh', 350, 800], fomPct: [0.01, 'fraction of capex/yr', 0.005, 0.02], life: [10, 'yr', 8, 15] });
tech('bessUps', { name: 'BESS-augmented UPS', role: 'backup', maturity: 'Emerging' }, {
  durationH: [2, 'h at redundancy capacity', 1, 4] });
tech('fuelStorage', { name: 'Bulk fuel storage (bunded)', role: 'backup support', maturity: 'Commercial', verify: 'Fuel storage regulations by country; fire engineer' }, {
  capexPerM3: [1200, '€/m³', 800, 1800], m2PerM3: [0.15, 'm² per m³', 0.10, 0.25], dieselLPerKWh: [0.26, 'L/kWh at full load', 0.24, 0.28],
  bellyTankM3: [0, 'm³ belly-tank volume credited', 0, 0],
  densityTPerM3: [0.84, 't/m³', 0.78, 0.86] });
tech('substation', { name: 'Grid connection and on-site substation', role: 'grid', maturity: 'Commercial', verify: 'TSO/DSO design standards and connection charging statements' }, {
  connCapexPerMW_mv: [100000, '€/MW offered (11–33 kV)', 60000, 160000], connCapexPerMW_hv: [150000, '€/MW offered (110–150 kV)', 90000, 250000],
  connCapexPerMW_ehv: [120000, '€/MW offered (220–400 kV)', 70000, 200000],
  subCapexPerMW_mv: [60000, '€/MW (11–33 kV)', 40000, 90000], subCapexPerMW_hv: [80000, '€/MW (110–150 kV)', 50000, 120000],
  subCapexPerMW_ehv: [70000, '€/MW (220–400 kV)', 45000, 110000], gisMultiplier: [1.4, '× AIS cost', 1.2, 1.7],
  cablePerKm: [1.5e6, '€/km of cable route from the POC (route length from the site model, §5.2)', 0.8e6, 3e6],
  m2Per20MVA_mv: [500, 'm² per 20 MVA', 300, 800], haAIS_hv: [1.2, 'ha', 0.8, 2.0], haGIS_hv: [0.4, 'ha', 0.25, 0.6], haAIS_ehv: [4.0, 'ha', 2.5, 6.0], haGIS_ehv: [1.2, 'ha', 0.8, 2.0],
  bandMvMaxMW: [20, 'MW (MV/HV band edge)', 20, 20], bandHvMaxMW: [150, 'MW (HV/EHV band edge)', 150, 150] });
// Gas connection (§5.2: the gas main location "drives gas-plant placement and connection cost"). Applied only to
// options that burn gas on site, and only when a gas main location is given; the route length comes from the
// site model (straight line from the gas main to the buildable envelope).
tech('gasConnection', { name: 'Gas connection pipe', role: 'utility', maturity: 'Commercial', verify: 'Gas network connection charging statements; pipeline cost benchmarks' }, {
  pipePerKm: [800000, '€/km of connection pipe from the gas main', 400000, 2000000] });
tech('heatRejection', { name: 'Heat rejection (dry / adiabatic coolers, chillers)', role: 'cooling plant', maturity: 'Commercial', verify: 'Vendor data' }, {
  m2PerMW: [60, 'm² per MW rejected', 40, 100], roofPlantFraction: [0.4, 'fraction of roof if heat rejection on roof', 0.3, 0.6] });

// ---------------------------------------------------------------------------
// Spatial library (BRIEF §6.1 "Spatial", §6.3 indicative spatial defaults, §10.3). All indicative —
// unverified. Footprint bases already in TECH (m²/MW, m²/unit, m²/MWh, ha/MWp, substation areas) are
// not repeated here. Values the brief gives carry basis "source" with the §6.3 source to verify against;
// values the brief does not give (L:W ratios, unit cell sizes, minimum values for relaxation, sound power
// levels, the building clearance) are builder judgements and say so.
// ---------------------------------------------------------------------------
// Permitting outlook (owner, 2026-10-22, OPEN-QUESTIONS 46): for plant held by significant environmental permitting
// (IED, Seveso), a three-level outlook with its reason, to advise the client whether the plant can be consented in
// time. Judgement by technology, indicative — unverified; the same in every country until country differences are
// researched (PERMIT_OUTLOOK_COUNTRY, empty: a research item for work package 0).
export const PERMIT_OUTLOOKS = ['likely', 'uncertain', 'unlikely'];
export const PERMIT_OUTLOOK = {};
for (const [id, value, reason] of [
  ['gasRecip', 'uncertain', 'Gas engines running in normal operation need an IED permit with NOx limits and an air-quality assessment; consentable on many sites but site-specific'],
  ['gasTurbine', 'uncertain', 'Gas turbines running in normal operation need an IED permit with NOx limits and an air-quality assessment; consentable on many sites but site-specific'],
  ['chp', 'uncertain', 'Gas CHP needs an IED permit with NOx limits and an air-quality assessment; the use of the heat helps the case'],
  ['rented', 'uncertain', 'Temporary gas generation running for months counts towards the installation and its permit; regulators increasingly scrutinise long-running temporary plant'],
  ['dieselPrime', 'unlikely', 'Diesel or HVO engines running as prime power in normal operation are unlikely to be consented under air-quality rules in most of Europe'],
  ['hydrogen', 'uncertain', 'Hydrogen storage above the Seveso threshold adds a major-accident regime and separation distances; few precedents at data centres'],
  ['backup', 'likely', 'Standby gensets tested a few hours a year are routinely permitted at data centres, although they bring the site under the IED'],
]) {
  PERMIT_OUTLOOK[id] = { outlook: rec(`permitting.outlook.${id}`, value, 'likely / uncertain / unlikely', { basis: 'judgement', ref: '§9.8', note: reason }), reason };
}
export const PERMIT_OUTLOOK_COUNTRY = {};

export const SPATIAL = {};
function spatial(id, base, params) {
  SPATIAL[id] = { id, ...base, p: {} };
  for (const [k, v] of Object.entries(params)) {
    const [value, unit, low, high, basis = 'source', note = ''] = v;
    SPATIAL[id].p[k] = rec(`spatial.${id}.${k}`, value, unit, {
      low, high, basis, ref: '§6.3', note,
      verify: basis === 'source' ? (base.verify || '') : '',
      dist: typeof value === 'number' ? 'triangular' : 'fixed',
    });
  }
}
spatial('building', { name: 'Data hall building', verify: 'Project benchmarks; industry density benchmarks' }, {
  lw: [1.5, 'length : width', 1, 3, 'judgement', 'Plan proportion of each data hall block. No source.'],
  clearanceM: [6, 'm to other blocks', 4, 10, 'judgement', 'Fire-tender access route around the building. Not in §6.3; replace with the fire strategy.'],
  clearanceMinM: [4, 'm (minimum when relaxed)', 3, 6, 'judgement', 'Minimum access width used only when the default cannot be met (option then "Fits with flags").'],
  maxHallM2: [25000, 'm² footprint per data hall block', 10000, 40000, 'judgement', 'A phase whose footprint exceeds this is split into equal halls.'],
  splitByPhase: [true, 'toggle', null, null, 'judgement', 'One building block per phase (each phase\'s share of the footprint).'],
});
spatial('substation', { name: 'Substation', verify: 'Utility / DNO standards, TSO/DSO design standards, vendor data' }, {
  lw: [1.5, 'length : width', 1, 3, 'judgement', 'Plan proportion. No source.'],
  mvPowerFactor: [0.9, 'power factor (MVA = MW ÷ power factor), 11–33 kV footprint', 0.85, 0.95, 'judgement', '§6.3 gives the 11–33 kV footprint per 20 MVA; the offered MW is converted to MVA at this power factor. No source.'],
  mvHeightM: [6, 'm (11–33 kV)', 5, 8],
  mvClearanceM: [5, 'm to other blocks (11–33 kV)', 3, 8],
  mvClearanceMinM: [3, 'm (minimum when relaxed)', 2, 5, 'judgement'],
  hvAisHeightM: [12, 'm (110–150 kV AIS)', 10, 15],
  hvGisHeightM: [15, 'm (110–150 kV GIS building)', 12, 18],
  ehvAisHeightM: [15, 'm (220–400 kV AIS)', 12, 20],
  ehvGisHeightM: [18, 'm (220–400 kV GIS building)', 15, 22],
  hvClearanceM: [10, 'm to other blocks (110–400 kV)', 8, 15],
  hvClearanceMinM: [5, 'm (minimum when relaxed)', 3, 8, 'judgement'],
  pocPreferredM: [50, 'm preferred maximum distance to the POC (110–150 kV)', 30, 100],
  noiseLwA: [95, 'dB(A) sound power, 110–400 kV substation (transformers)', 85, 105, 'judgement', 'Screening value; verify with transformer data.'],
  noiseLwAmv: [85, 'dB(A) sound power, 11–33 kV substation', 75, 95, 'judgement'],
});
spatial('genset', { name: 'Standby gensets (containerised)', verify: 'Manufacturer datasheets' }, {
  unitLw: [2.5, 'length : width of one unit cell', 2, 3.5, 'judgement', 'Unit cell = m² per unit (incl. maintenance access) at this proportion.'],
  heightM: [7, 'm incl. flue stub', 6, 8],
  doubleDeckHeightM: [12, 'm (double-deck)', 10, 14, 'source', 'Source to verify against: manufacturer / project precedent.'],
  doubleDeckFootprintFactor: [0.5, '× footprint per unit (double-deck)', 0.5, 0.6, 'source', '"Halves footprint per unit" (§6.3). Read by sizing (area budget) and by the blocks: ceil(units × factor) stacked positions of one unit footprint each (0.5 = two units per position).'],
  clearanceM: [3, 'm between units / arrays', 2, 5],
  clearanceMinM: [1.5, 'm (minimum when relaxed)', 1, 3, 'judgement'],
  maxDistBuildingM: [30, 'm maximum distance to the building', 15, 50, 'source', '"Adjacent to building (≤ 30 m)" (§6.3).'],
  noiseLwA: [101, 'dB(A) sound power per unit (acoustic container)', 95, 110, 'judgement', 'Screening value; verify with the manufacturer datasheet.'],
});
spatial('fuel', { name: 'Bulk fuel storage (bunded)', verify: 'Fuel storage regulations by country; fire engineer' }, {
  lw: [2, 'length : width', 1, 4, 'judgement'],
  heightM: [7, 'm', 5, 9],
  clearanceM: [3, 'm to other blocks', 2, 5, 'judgement'],
  clearanceMinM: [1.5, 'm (minimum when relaxed)', 1, 3, 'judgement'],
  sepBuildingM: [6, 'm to the data hall building', 4, 10],
  sepBuildingMinM: [3, 'm (minimum when relaxed)', 2, 6, 'judgement', 'For example with a fire wall; fire engineer to confirm.'],
  sepBoundaryM: [10, 'm to the site boundary', 6, 15],
  sepBoundaryMinM: [6, 'm (minimum when relaxed)', 3, 10, 'judgement'],
});
spatial('bess', { name: 'BESS (Li-ion, containerised incl. PCS/MV)', verify: 'NFPA 855 (current edition), FM Global DS 5-33, vendor UL 9540A data' }, {
  unitMWh: [4, 'MWh per container (array unit)', 2, 6, 'judgement', 'Array unit for the row/column arrangement; the footprint basis is m²/MWh (TECH).'],
  unitLw: [2, 'length : width of one unit cell', 1.5, 3, 'judgement'],
  heightM: [3.5, 'm', 3, 4],
  clearanceM: [3, 'm between units / arrays', 1, 5],
  clearanceMinM: [1.5, 'm (minimum when relaxed)', 1, 3, 'judgement', 'Less than 3 m only where UL 9540A test data supports it.'],
  sepBuildingM: [10, 'm to occupied buildings (data hall)', 5, 15],
  sepBuildingMinM: [3, 'm (minimum when relaxed)', 1.5, 5, 'judgement', 'Reduced separation needs test data or a fire-rated barrier.'],
  noiseLwA: [85, 'dB(A) sound power per container (PCS and HVAC)', 75, 95, 'judgement'],
});
spatial('gasEngine', { name: 'Gas engine plant (recips, CHP, rented, HVO-diesel prime)', verify: 'Danish Energy Agency Technology Catalogue; vendor data' }, {
  unitLw: [1.5, 'length : width of one unit cell', 1, 3, 'judgement'],
  heightM: [12, 'm engine hall (recips, CHP)', 9, 15],
  containerHeightM: [7, 'm (containerised rented / HVO-diesel units)', 5, 9, 'judgement'],
  clearanceM: [5, 'm to other blocks', 3, 8, 'judgement'],
  clearanceMinM: [3, 'm (minimum when relaxed)', 2, 5, 'judgement'],
  sepBoundaryM: [15, 'm to the site boundary', 10, 25],
  sepBoundaryMinM: [10, 'm (minimum when relaxed)', 5, 15, 'judgement'],
  noiseLwA: [105, 'dB(A) sound power per engine unit (attenuated hall or container)', 95, 112, 'judgement'],
});
spatial('turbine', { name: 'Gas turbine plant', verify: 'Danish Energy Agency Technology Catalogue; vendor data' }, {
  unitLw: [2, 'length : width of one unit cell', 1.5, 3, 'judgement'],
  heightM: [15, 'm', 12, 20],
  clearanceM: [5, 'm to other blocks', 3, 8, 'judgement'],
  clearanceMinM: [3, 'm (minimum when relaxed)', 2, 5, 'judgement'],
  sepBoundaryM: [15, 'm to the site boundary', 10, 25],
  sepBoundaryMinM: [10, 'm (minimum when relaxed)', 5, 15, 'judgement'],
  noiseLwA: [108, 'dB(A) sound power per turbine (enclosed)', 100, 115, 'judgement'],
});
spatial('fuelCell', { name: 'SOFC fuel cells', verify: 'Vendor data' }, {
  unitLw: [2, 'length : width of one unit cell', 1.5, 3, 'judgement'],
  heightM: [4, 'm', 3, 5],
  clearanceM: [5, 'm to other blocks', 3, 8],
  clearanceMinM: [3, 'm (minimum when relaxed)', 2, 5, 'judgement'],
  noiseLwA: [75, 'dB(A) sound power per MW', 65, 85, 'judgement'],
});
spatial('hydrogen', { name: 'Hydrogen storage and gensets', verify: 'National hazardous-substance regulation; specialist input' }, {
  unitLw: [2, 'length : width of one unit cell', 1.5, 3, 'judgement'],
  heightM: [6, 'm', 4, 8],
  clearanceM: [25, 'm hazardous-area separation (indicative)', 15, 50, 'source', 'Not relaxed by the layout; flagged always.'],
  noiseLwA: [95, 'dB(A) sound power per MW', 85, 105, 'judgement'],
});
spatial('heatRejection', { name: 'Heat rejection (dry / adiabatic coolers, chillers)', verify: 'Vendor data' }, {
  moduleMW: [5, 'MW rejected per array unit', 1, 10, 'judgement', 'Array unit for the row/column arrangement; footprint basis m²/MW rejected (TECH).'],
  unitLw: [2, 'length : width of one unit cell', 1.5, 3, 'judgement'],
  heightM: [4, 'm', 3, 6],
  clearanceM: [3, 'm (airflow clearance)', 2, 6],
  clearanceMinM: [1.5, 'm (minimum when relaxed)', 1, 3, 'judgement'],
  noiseLwAperMW: [88, 'dB(A) sound power per MW rejected', 80, 95, 'judgement', 'Ground or roof heat rejection runs day and night.'],
});
spatial('solarGround', { name: 'Solar PV ground-mount', verify: 'NREL land-use study (Ong et al., 2013) plus recent European project data' }, {
  heightM: [3, 'm', 2, 4],
  clearanceM: [5, 'm to other blocks', 3, 8],
  minArrayM: [10, 'm minimum width of a fill area', 6, 20, 'judgement', 'Residual strips narrower than this are not filled.'],
});
spatial('solarRoof', { name: 'Solar PV rooftop', verify: 'Vendor data, fire-access guidance' }, {
  heightAboveRoofM: [1, 'm above the roof', 0.5, 1.5],
  edgeSetbackM: [1.5, 'm roof-edge setback', 1, 3],
});
spatial('wind', { name: 'Wind onshore', verify: 'National planning guidance' }, {
  padM2: [1000, 'm² pad per turbine (0.1 ha)', 600, 2000],
  noiseBufferM: [500, 'm to noise-sensitive receptors', 300, 800],
  noiseLwA: [105, 'dB(A) sound power per turbine', 100, 110, 'judgement'],
});
spatial('smr', { name: 'Small modular reactor', verify: 'Vendor and regulator publications' }, {
  haPer100MW: [1, 'ha per 100 MWe (3 ha per ~300 MWe unit)', 0.7, 2],
  heightM: [40, 'm', 30, 60],
  lw: [1.5, 'length : width (on-site SMR block)', 1, 3, 'judgement', 'Plan proportion of an on-site SMR block. No source.'],
  clearanceM: [10, 'm to other blocks (on-site SMR, never relaxed)', 5, 50, 'judgement', '§6.3 gives no SMR clearance ("emergency planning zone not modelled; flag always"). Used only when spatial.smr.placement is "onsite"; not relaxed by the layout.'],
  placement: ['offsite', '"offsite" | "onsite"', null, null, 'judgement', 'Not placed within a typical campus boundary by default (§6.2).'],
});
spatial('unitArrays', { name: 'Unit-based arrays (gensets, BESS, engines, heat rejection)', verify: '' }, {
  maxUnits: [12, 'units per array block', 4, 24, 'judgement', 'Units are grouped into arrays of at most this many.'],
  maxArrayM2: [4000, 'm² maximum array block', 1500, 10000, 'judgement', 'Large units (engines, turbines) are grouped into fewer units per array so that no array block exceeds this area (at least one unit per array).'],
  rows: [2, 'rows per array', 1, 4, 'judgement', 'Row/column arrangement of the units in an array (§10.3).'],
});
spatial('noise', { name: 'Noise proxy (screening, not an acoustic assessment)', verify: 'ISO 9613-2 (geometric divergence term only)' }, {
  hemisphericalDb: [8, 'dB: Lp = Lw − 20·log10(r) − 8 (hemispherical spreading)', 8, 11, 'source', 'Geometric spreading only; no barrier, ground or air absorption.'],
});

// Exclusion zone types (§5.2): each has a hard/soft default; soft exclusions can be used by ground solar
// only (site.softUsableBySolar). Judgement defaults: only flood zones are soft.
export const EXCLUSION_TYPES = {};
for (const [id, label, hard, note] of [
  ['easement', 'Easement / wayleave', true, 'Overhead lines and buried services; no plant over a wayleave without consent.'],
  ['flood', 'Flood zone', false, 'Soft: raised ground solar can often use flood zones; critical plant cannot.'],
  ['ecology', 'Ecology', true, ''],
  ['tree', 'Tree protection', true, 'Root protection areas.'],
  ['structure', 'Existing structure', true, ''],
  ['other', 'Other', true, ''],
]) {
  EXCLUSION_TYPES[id] = { id, label, hard: rec(`site.exclusionType.${id}.hard`, hard, 'hard (true) / soft (false)', { basis: 'judgement', ref: '§5.2', note }) };
}

// Fuels and carbon factors
export const FUEL = {
  gasTransportAdder: rec('fuel.gasTransportAdder', 4, '€/MWh_th', { low: 2, high: 8, verify: 'National gas transport tariffs', ref: '§5.4' }),
  dieselPrice: rec('fuel.dieselPrice', 110, '€/MWh_th', { low: 85, high: 140, verify: 'National fuel price statistics', ref: '§6' }),
  hvoPrice: rec('fuel.hvoPrice', 170, '€/MWh_th', { low: 130, high: 220, verify: 'Fuel supplier indications', ref: '§6' }),
  hydrogenPrice: rec('fuel.hydrogenPrice', 246, '€/MWh_th', { low: 210, high: 300, verify: 'Hydrogen supply price indications', ref: '§5.4', src: SRC.hydrogen, note: 'Renewable hydrogen delivered price; €8.20/kg ÷ 33.3 kWh/kg. Range €7–10/kg.' }),
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
function viewRec(path, value, unit, basis, note, briefRef = '§12.2') {
  REGISTRY[path] = {
    path, value, unit, low: null, high: null, distribution: 'fixed', basis,
    source: '', year: '', url: '', accessed: '', confidence: 'C', verified: false, sourceToVerify: '', note,
    briefRef, label: LABEL, derived: false,
  };
}
viewRec('view.pareto.xAxis', 'follow-scoring', '"follow-scoring" | "lcoe" | "npv" | "location" | "market" | "cfe" | "ttp" | "deliverability"', 'judgement', 'Default x axis of the Pareto scatter. "follow-scoring" = the Cost axis metric (settings.costMetric, default LCOE); §12.2 default: cost vs carbon.');
viewRec('view.pareto.yAxis', 'follow-scoring', '"follow-scoring" | "lcoe" | "npv" | "location" | "market" | "cfe" | "ttp" | "deliverability"', 'judgement', 'Default y axis of the Pareto scatter. "follow-scoring" = the Carbon axis metric (settings.carbonMetric, default location-based).');
viewRec('view.pareto.ttpClasses', 5, 'quantile classes', 'run setting', 'Number of colour classes for time-to-power, quantiles over the scoring set.');
viewRec('view.pareto.canvasAbove', 500, 'points', 'run setting', 'Points are drawn on Canvas above this count (§4), SVG at or below it.');
viewRec('view.pareto.display', 'chart', '"chart" | "table"', 'judgement', 'Chart shown first; the table alternative is one click away and holds the same rows.');
viewRec('view.site.smallMultiples', 6, 'plans', 'run setting', 'Number of top-ranked options drawn as small-multiple plans on the Site tab, all at the same scale (§10.7 "thumbnails of pinned or top options"; pinning is not in this slice). 0 hides them.', '§10.7');
viewRec('view.table.pageSize', 50, 'rows per page', 'run setting', 'Rows per page in the ranked table and the trade-off table; every page is reachable with the pager.');

// Tornado sensitivity (§13.3, port slice): driver ranges that have no input record of their own (the gas and carbon
// prices are "by country" and the IT load is a required input), and the number of drivers shown. The other drivers
// read their input's record (grid.dateUncertainty, grid.priceMultiplier, grid.carbonMultiplier, economics.wacc).
rec('sensitivity.gasPriceFactor', 1, '× current gas commodity price (country default or entered value)', { low: 0.7, high: 1.3, basis: 'judgement', ref: '§13.3', note: 'Tornado driver range: low and high gas commodity price as factors on the current value. No source.' });
rec('sensitivity.carbonPriceFactor', 1, '× current carbon price (country default or entered value)', { low: 0.5, high: 1.5, basis: 'judgement', ref: '§13.3', note: 'Tornado driver range: low and high EU/UK ETS carbon price as factors on the current value. No source.' });
rec('sensitivity.itLoadFactor', 1, '× IT load of every phase', { low: 0.8, high: 1.2, basis: 'judgement', ref: '§13.3', note: 'Tornado driver range: low and high IT load as factors on the entered phases. No source.' });
rec('sensitivity.topDrivers', 12, 'drivers shown', { basis: 'run setting', ref: '§13.3', dist: 'fixed', note: 'Largest-swing drivers shown in the tornado (§13.3: top 12 drivers, editable 1–30). This slice has 7 drivers and no control for this setting yet; the code clamps it to 1–30.' });

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
      boundary: rec('site.boundary', null, '{ points: [[lat, lon], …], source } or null', { basis: 'judgement', ref: '§5.2', note: 'null = rectangle from the site area and aspect ratio, long side east–west, centred on the project location. A drawn, typed or imported polygon replaces it and sets the site area.' }),
      setbackM: rec('site.setbackM', 10, 'm', { low: 5, high: 20, basis: 'judgement', note: 'No source; replace with local planning requirement.', ref: '§5.2' }),
      setbackByEdge: rec('site.setbackByEdge', null, 'm per boundary edge (null entries = uniform setback)', { basis: 'judgement', ref: '§5.2', note: 'Per-edge override of the uniform boundary setback; null = uniform on every edge.' }),
      heightLimitM: rec('site.heightLimitM', 25, 'm', { low: 15, high: 40, basis: 'judgement', ref: '§5.2' }),
      heightZones: rec('site.heightZones', [], 'list of { name, limitM, points }', { basis: 'judgement', ref: '§5.2', note: 'Per-zone override of the height limit; none by default.' }),
      exclusions: rec('site.exclusions', [], 'list of { name, type, hard, points }', { basis: 'judgement', ref: '§5.2', note: 'None by default.' }),
      softUsableBySolar: rec('site.softUsableBySolar', true, 'toggle', { basis: 'judgement', ref: '§5.2', note: 'Soft exclusions can be used by ground solar (configurable). Off: ground solar does not use them either. Other blocks never use a soft exclusion by default; only at the last relaxation level (L4), flagged "Block in soft exclusion" and "Fits with flags" (§10.4 step 5, §15).' }),
      poc: rec('site.poc', null, '[lat, lon] or null', { basis: 'judgement', ref: '§5.2', note: 'The brief default is the boundary point nearest the map\'s nearest road. This offline tool has no road data, so the default POC is the default access point (mid-point of the longest edge), standing in for the road side. Replace with the real POC.' }),
      gasMain: rec('site.gasMain', null, '[lat, lon] or null', { basis: 'judgement', ref: '§5.2', note: 'None: gas off-site, location unknown.' }),
      access: rec('site.access', null, 'list of [lat, lon] or null', { basis: 'judgement', ref: '§5.2', note: 'null = one access point at the mid-point of the longest edge.' }),
      receptors: rec('site.receptors', [], 'list of { name, point } or { name, points }', { basis: 'judgement', ref: '§5.2', note: 'None by default; used for distance-based noise flags only.' }),
      roadsFraction: rec('site.roadsFraction', 0.15, 'fraction of net developable area', { low: 0.1, high: 0.25, basis: 'judgement', ref: '§5.2', note: 'Applied to the buildable envelope area: allowance = fraction × envelope, net developable = envelope − allowance (the brief\'s definition is circular). Held back as a land budget, not a located area.' }),
      pvRoofM2: rec('site.pvRoofM2', null, 'm² of roof available for PV, or null', { low: null, high: null, basis: 'judgement', ref: '§5.2, §8 C10', note: "OPEN-QUESTIONS 53 (2026-10-22): blank = today's rule, 50 % of the free roof after roof plant is usable (solarRoof.usableFraction). An entered area replaces the rule; car-park canopies can be included here or in the ground area." }),
      pvGroundHa: rec('site.pvGroundHa', 0, 'ha of ground available for PV', { low: 0, high: null, basis: 'judgement', ref: '§5.2, §8 C10', note: 'OPEN-QUESTIONS 53 (2026-10-22): 0 = no ground solar. An entered area makes C10 "Roof + ground" available and sizes ground PV at solarGround.haPerMWp; with the Site tab (Beta) on it is placed as one block of that area.' }),
      offsiteLandHa: rec('site.offsiteLandHa', 0, 'ha', { basis: 'judgement', ref: '§5.2' }),
      offsiteDistanceKm: rec('site.offsiteDistanceKm', 2, 'km private-wire distance', { low: 0.5, high: 10, basis: 'judgement', ref: '§5.2', note: 'Used only when off-site land or off-site plant exists; replace with the real route length.' }),
      groundConditions: rec('site.groundConditions', 'assumed suitable', 'free text', { basis: 'judgement', ref: '§5.2', note: 'Note only; no geotechnical modelling (flat site, §10.1).' }),
    },
    load: {
      itMW: REQUIRED_EXAMPLE['load.itMW'],
      phases: null, // set below
      rampStart: rec('load.rampStart', 0.25, 'fraction of phase IT at energisation', { low: 0.1, high: 0.5, basis: 'judgement', ref: '§5.3', note: "The owner's judgement (2026-10-22, OPEN-QUESTIONS 51; was 50 %). No source; replace with the client's fit-out programme." }),
      rampMonths: rec('load.rampMonths', 12, 'months', { low: 6, high: 24, basis: 'judgement', ref: '§5.3' }),
      utilisation: rec('load.utilisation', 0.8, 'fraction of installed IT', { low: 0.6, high: 0.95, basis: 'judgement', ref: '§5.3' }),
      workload: rec('load.workload', 'cloud', '', { basis: 'judgement', note: 'Mixed cloud', ref: '§5.3' }),
      // Load shape (walkthrough 2026-10-21; work package 4): flat, daily fluctuation, AI training or AI inference. The AI
      // defaults are the mock-up's illustrative values, to research. The hourly model cannot show sub-hour swings.
      shape: rec('load.shape', 'daily', 'flat / daily / aiTraining / aiInference', { basis: 'judgement', ref: '§5.3', note: 'Daily fluctuation is the shape built before work package 4.' }),
      dailySwing: rec('load.dailySwing', null, 'fraction of average, ±', { low: 0, high: 0.3, basis: 'judgement', ref: '§5.3', note: 'Blank = by workload, as built: ±1 % AI training, ±8 % enterprise, ±4 % otherwise.' }),
      aiTrainUtil: rec('load.aiTrainUtil', 0.9, 'average fraction of installed IT', { low: 0.7, high: 0.98, basis: 'judgement', ref: '§5.3', note: 'Mock-up value (walkthrough 2026-10-21); to research.' }),
      aiTrainDip: rec('load.aiTrainDip', 0.55, 'fraction of installed IT during a checkpoint dip', { low: 0.2, high: 0.9, basis: 'judgement', ref: '§5.3', note: 'Mock-up value; to research.' }),
      aiTrainDipEveryH: rec('load.aiTrainDipEveryH', 6, 'h between checkpoint dips', { low: 1, high: 48, basis: 'judgement', ref: '§5.3', note: 'Mock-up value; to research.' }),
      aiTrainDipH: rec('load.aiTrainDipH', 1, 'h per dip', { low: 1, high: 6, basis: 'judgement', ref: '§5.3', note: 'Mock-up value; to research. The hourly model cannot show dips shorter than an hour.' }),
      aiInfUtil: rec('load.aiInfUtil', 0.7, 'average fraction of installed IT', { low: 0.4, high: 0.95, basis: 'judgement', ref: '§5.3', note: 'No source; to research.' }),
      aiInfTrough: rec('load.aiInfTrough', 0.6, 'night trough as a fraction of the daily peak', { low: 0.2, high: 1, basis: 'judgement', ref: '§5.3', note: 'No source; to research.' }),
      aiInfPeakHour: rec('load.aiInfPeakHour', 15, 'hour of the daily peak (local)', { low: 0, high: 23, basis: 'judgement', ref: '§5.3', note: 'No source; to research.' }),
      aiInfWeekend: rec('load.aiInfWeekend', 0.9, 'weekend level as a fraction of weekdays', { low: 0.5, high: 1.1, basis: 'judgement', ref: '§5.3', note: 'No source; to research.' }),
      coolingApproach: rec('load.coolingApproach', 'open', '', { basis: 'judgement', note: 'Open choice (C8)', ref: '§5.3' }),
      grossUp: rec('load.grossUp', 2.2, 'GFA / whitespace', { low: 1.8, high: 2.6, basis: 'judgement', ref: '§5.3' }),
      storeys: rec('load.storeys', 2, 'storeys', { low: 1, high: 6, basis: 'judgement', ref: '§5.3' }),
      storeyHeightM: rec('load.storeyHeightM', 6.0, 'm', { low: 5, high: 7, basis: 'judgement', ref: '§5.3' }),
      roofZoneM: rec('load.roofZoneM', 4.0, 'm', { low: 3, high: 6, basis: 'judgement', ref: '§5.3' }),
      ancillaryFrac: rec('load.ancillaryFrac', 0.02, 'fraction of installed IT', { low: 0.01, high: 0.04, basis: 'judgement', ref: '§5.3' }),
      flexMaxPct: rec('load.flexMaxPct', 0.1, 'fraction of IT curtailable', { low: 0, high: 0.3, basis: 'judgement', ref: '§5.3' }),
      flexHours: rec('load.flexHours', 100, 'h/yr', { low: 0, high: 500, basis: 'judgement', ref: '§5.3' }),
      // Flexibility with triggers (walkthrough 2026-10-21; OPEN-QUESTIONS 34, 61): mock-up values, judgement, to research.
      flexTrigger: rec('load.flexTrigger', 'price', 'price / carbon / stress', { basis: 'judgement', ref: '§5.3', note: 'Weather and grid stress is modelled as the ambient temperature at or above the trigger level (source to research).' }),
      flexTriggerPrice: rec('load.flexTriggerPrice', 250, '€/MWh grid price (wholesale × multiplier + adder)', { low: 100, high: 1000, basis: 'judgement', ref: '§5.3', note: 'Mock-up value; to research against ENTSO-E price history.' }),
      flexTriggerCarbon: rec('load.flexTriggerCarbon', 400, 'gCO₂e/kWh grid carbon intensity', { low: 100, high: 800, basis: 'judgement', ref: '§5.3', note: 'No source; to research.' }),
      flexTriggerTemp: rec('load.flexTriggerTemp', 28, '°C ambient dry-bulb (weather and grid stress)', { low: 20, high: 40, basis: 'judgement', ref: '§5.3', note: 'No source; to research.' }),
      flexEventH: rec('load.flexEventH', 4, 'h per event (maximum)', { low: 1, high: 12, basis: 'judgement', ref: '§5.3', note: 'Mock-up value.' }),
      flexNoticeH: rec('load.flexNoticeH', 1, 'h notice', { low: 0, high: 24, basis: 'judgement', ref: '§5.3', note: 'Mock-up value. Recorded, not modelled: the hourly model knows prices and carbon in advance (day-ahead), so notice does not change the hours.' }),
      flexRecoveryH: rec('load.flexRecoveryH', 12, 'h between events', { low: 0, high: 48, basis: 'judgement', ref: '§5.3', note: 'Mock-up value.' }),
      flexCostPerMWh: rec('load.flexCostPerMWh', 500, '€/MWh of IT load curtailed', { low: 0, high: 5000, basis: 'judgement', ref: '§5.3', note: 'Mock-up value: the cost of curtailing customer IT; to research.' }),
      flexBatteryFixed: rec('load.flexBatteryFixed', 'threshold', 'threshold / hours / size', { basis: 'judgement', ref: '§5.3', note: 'Walkthrough 2026-10-21: the engineer chooses which is held fixed. Threshold (default): the battery is sized to cover the trigger hours at the trigger level. Hours: the trigger level is set so the events reach the target hours, and the battery covers them. Size: the battery size is entered and the hours it covers are reported.' }),
      flexBatteryHours: rec('load.flexBatteryHours', 100, 'h/yr of trigger events covered (when hours are held fixed)', { low: 0, high: 2000, basis: 'judgement', ref: '§5.3' }),
      flexBatteryMW: rec('load.flexBatteryMW', null, 'MW (when the battery size is held fixed)', { low: 0, basis: 'judgement', ref: '§5.3', note: 'Blank = the trigger-hours size.' }),
      flexBatteryMWh: rec('load.flexBatteryMWh', null, 'MWh (when the battery size is held fixed)', { low: 0, basis: 'judgement', ref: '§5.3', note: 'Blank = the trigger-hours size.' }),
      flexBatteryResponse: rec('load.flexBatteryResponse', true, 'toggle', { basis: 'judgement', ref: '§5.3', note: 'Walkthrough 2026-10-21: the economic battery runs the site in trigger hours before any curtailment.' }),
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
      upsMin: rec('requirements.upsMin', 5, 'min at full IT', { low: 5, high: 60, basis: 'judgement', ref: '§5.5', note: 'The resilience reserve battery (walkthrough 2026-10-21): always kept, never used for economic duties; longer autonomy can be chosen site-wide.' }),
      blockSize: rec('requirements.blockSize', 10, 'units per block', { low: 4, high: 20, basis: 'judgement', ref: '§9.2' }),
      catcherN: rec('requirements.catcherN', 4, 'blocks per catcher unit', { low: 2, high: 6, basis: 'judgement', ref: '§9.2' }),
      carbonTarget: rec('requirements.carbonTarget', null, 'gCO2e/kWh (annual average cap)', { basis: 'judgement', ref: '§5.5', note: 'None' }),
      capexCeiling: rec('requirements.capexCeiling', null, '€', { basis: 'judgement', ref: '§5.5', note: 'None' }),
      maxRunHours: rec('requirements.maxRunHours', null, 'h/yr', { basis: 'judgement', ref: '§5.5', note: 'None' }),
      iedMWth: rec('requirements.iedMWth', 50, 'MWth aggregated', { basis: 'source', verify: 'Directive 2010/75/EU (IED), consolidated text; check 2024 revision', ref: '§5.5' }),
      mcpMinMWth: rec('requirements.mcpMinMWth', 1, 'MWth per unit', { basis: 'source', verify: 'Directive (EU) 2015/2193 (MCPD)', ref: '§5.5' }),
      mcpMaxMWth: rec('requirements.mcpMaxMWth', 50, 'MWth per unit', { basis: 'source', verify: 'Directive (EU) 2015/2193 (MCPD)', ref: '§5.5' }),
      sevesoH2t: rec('requirements.sevesoH2t', 5, 't hydrogen stored', { basis: 'source', verify: 'Directive 2012/18/EU (Seveso III) Annex I lower tier', ref: '§5.5' }),
      permitAllowanceM: rec('requirements.permitAllowanceM', 6, 'months before ordering plant that needs significant environmental permitting (IED, Seveso)', { low: 0, high: 18, basis: 'judgement', ref: '§9.8', note: "Owner's decision 2026-10-22 (OPEN-QUESTIONS 44, 45): plant is ordered from day one; only plant under the IED or Seveso waits this allowance. Wind, ground solar and SMRs keep their own planning months (OPEN-QUESTIONS 56)." }),
      sevesoFuelT: rec('requirements.sevesoFuelT', 2500, 't diesel/HVO stored', { basis: 'source', verify: 'Directive 2012/18/EU (Seveso III) Annex I lower tier', ref: '§5.5' }),
      testRunHours: rec('requirements.testRunHours', 6, 'h/yr per unit', { low: 3, high: 24, basis: 'judgement', ref: '§5.5, §9.4', verify: 'NFPA 110 (monthly exercise runs)', note: 'Walkthrough 2026-10-21: 6 h a year per generator (replaces 12 h), about monthly 30-minute exercise runs.' }),
      gensetPrimaryHours: rec('requirements.gensetPrimaryHours', 0, 'h/yr', { low: 0, high: 500, basis: 'judgement', ref: '§5.5, §9.4', note: 'Walkthrough 2026-10-21: backup gensets can run as primary power for a set number of hours a year, dispatched and costed. Default 0: they never run in normal dispatch. Hours chosen: the most expensive grid-price hours of each year.' }),
      testRunLoad: rec('requirements.testRunLoad', 0.75, 'fraction of rating', { low: 0.5, high: 1, basis: 'judgement', ref: '§5.5, §9.4', note: 'Walkthrough 2026-10-21: test load 75 %, a separate editable input.' }),
      bessUpsGensetFraction: rec('requirements.bessUpsGensetFraction', 1.0, 'genset capacity as fraction of critical load at topology N', { basis: 'judgement', ref: '§8 C5', note: 'BESS-augmented UPS replaces redundant genset units with BESS for its duration.' }),
      landTakeCeilingHa: rec('requirements.landTakeCeilingHa', null, 'ha on-site land take (null = net developable area)', { basis: 'judgement', derived: true, ref: '§5.5', note: 'Flag only. At the default it coincides with the "Does not fit" status; a lower value raises the minor flag "land take above ceiling" without changing the site-fit status.' }),
      noiseNightDbA: rec('requirements.noiseNightDbA', 45, 'dB(A) at receptors, night', { low: 35, high: 55, basis: 'judgement', ref: '§10.6', note: 'No source; replace with the local planning or environmental noise criterion. Screening proxy, not an acoustic assessment.' }),
    },
    economics: {
      periodYears: rec('economics.periodYears', 20, 'yr', { low: 15, high: 25, basis: 'judgement', ref: '§5.6' }),
      wacc: rec('economics.wacc', 0.07, 'real', { low: 0.04, high: 0.12, basis: 'judgement', ref: '§5.6' }),
      contingency: rec('economics.contingency', 0.10, 'fraction of capex', { low: 0.05, high: 0.2, basis: 'judgement', ref: '§5.6' }),
      capexLow: rec('economics.capexLow', -0.30, 'fraction (AACE Class 5)', { basis: 'source', verify: 'AACE International RP 18R-97 (confirm revision and year)', ref: '§5.6' }),
      capexHigh: rec('economics.capexHigh', 0.50, 'fraction (AACE Class 5)', { basis: 'source', verify: 'AACE International RP 18R-97 (confirm revision and year)', ref: '§5.6' }),
      carbonPrice: rec('economics.carbonPrice', 'by country', '€/tCO2e', { basis: 'source', derived: true, verify: 'EU ETS / UK ETS exchange data, official projections', ref: '§5.6', note: 'The country default comes from the scheme records country.carbonPrice.euEts and country.carbonPrice.ukEts (sourced); Switzerland is unresearched.' }),
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
      pooledBackupRisk: rec('deliverability.pooledBackupRisk', 'minor', 'minor / major', { basis: 'judgement', ref: '§9.9', note: "Client-perceived risk of backup pooled across the campus (OPEN-QUESTIONS 48, 2026-10-22): by default the same penalty as a minor permitting flag; the engineer can raise it to major for a project." }),
      siteFitPenalty: rec('deliverability.siteFitPenalty', false, 'toggle', { basis: 'judgement', ref: '§9.9', note: 'Off by default: the site-fit status has no effect on the deliverability or weighted score. On: the axis is labelled "Deliverability (incl. site fit)".' }),
      siteFitFlagsPenalty: rec('deliverability.siteFitFlagsPenalty', 10, 'points for "Fits with flags"', { basis: 'judgement', ref: '§9.9', note: 'Applies only when the site-fit penalty is on.' }),
      siteFitNoFitPenalty: rec('deliverability.siteFitNoFitPenalty', 25, 'points for "Does not fit"', { basis: 'judgement', ref: '§9.9', note: 'Applies only when the site-fit penalty is on.' }),
    },
    settings: {
      generationCap: rec('settings.generationCap', 2000, 'options', { basis: 'run setting', ref: '§7.2' }),
      sampleAboveCap: rec('settings.sampleAboveCap', true, 'toggle', { basis: 'judgement', ref: '§7.2' }),
      gridHandling: rec('settings.gridHandling', 'unmet', '"unmet" | "exceedance"', { basis: 'judgement', ref: '§9.4', note: 'Show unmet load' }),
      runHourHandling: rec('settings.runHourHandling', 'flag', '"flag" | "respect"', { basis: 'judgement', ref: '§9.4', note: 'Flag only' }),
      costMetric: rec('settings.costMetric', 'lcoe', '"lcoe" | "npv"', { basis: 'judgement', ref: '§11' }),
      carbonMetric: rec('settings.carbonMetric', 'location', '"location" | "market" | "cfe"', { basis: 'judgement', ref: '§9.6' }),
      absoluteScaling: rec('settings.absoluteScaling', false, 'toggle', { basis: 'judgement', ref: '§11', note: 'Hook only in this slice.' }),
      rankCompliantFirst: rec('settings.rankCompliantFirst', false, 'toggle', { basis: 'judgement', ref: '§11', note: 'On: options whose resilience status is "Does not meet" rank after the others; scores do not change. Site fit does not count while the Site tab is Beta (AC 27, 2026-10-22).' }),
      hideDominated: rec('settings.hideDominated', false, 'toggle', { basis: 'judgement', ref: '§7.2 step 6' }),
      windSiteThresholdHa: rec('settings.windSiteThresholdHa', 20, 'ha', { basis: 'judgement', ref: '§8 C11' }),
      bridgeBessHours: rec('settings.bridgeBessHours', 24, 'h', { basis: 'judgement', ref: '§9.2' }),
      timelineMonths: rec('settings.timelineMonths', 120, 'months', { basis: 'run setting', ref: '§9.8', note: 'Time-to-power horizon.' }),
      maxDispatchYears: rec('settings.maxDispatchYears', 8, 'years', { basis: 'run setting', ref: '§9.1', note: 'Distinct 8760-h dispatch years before steady state is assumed.' }),
      autonomyBasis: rec('settings.autonomyBasis', 'critical load', '', { basis: 'judgement', ref: '§9.2' }),
      layoutCellM: rec('settings.layoutCellM', 2, 'm raster cell', { basis: 'run setting', ref: '§10.4', note: 'Auto-layout raster cell size; chosen for the §17 layout timing, not from a source.' }),
      layoutCellLargeM: rec('settings.layoutCellLargeM', 5, 'm raster cell (large sites)', { basis: 'run setting', ref: '§10.4' }),
      layoutLargeSiteHa: rec('settings.layoutLargeSiteHa', 50, 'ha gross site area above which the large cell is used', { basis: 'run setting', ref: '§10.4' }),
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
  // Site area: a valid boundary polygon sets it (§5.2 "R (one of)"); otherwise the entered area is used
  // with the aspect ratio. areaFromBoundary records which one applies (the C11 wind default and the
  // sizing area budget read site.areaHa).
  out.site.areaFromBoundary = false;
  const b = boundaryAreaHa(out.site.boundary);
  if (b != null) { out.site.areaHa = b; out.site.areaFromBoundary = true; }
  out.requirements.landTakeCeilingHa = out.requirements.landTakeCeilingHa ?? null;
  out.choices = out.choices || {};
  for (const c of CHOICES) {
    if (!out.choices[c.id]) out.choices[c.id] = defaultChoiceState(c.id, out);
  }
  return out;
}

// Area (ha) of a site boundary given as { points: [[lat, lon], …] }, or null if it is missing or invalid.
export function boundaryAreaHa(boundary) {
  if (!boundary || !Array.isArray(boundary.points) || boundary.points.length < 3) return null;
  const pts = boundary.points.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 3) return null;
  const [la, lo] = meanLatLon(pts);
  const P = makeProjection(la, lo);
  const v = validateRing(pts.map(P.toXY));
  return v.ok ? v.area / 10000 : null;
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

// T2 tight site (§21): as T1 on 6 ha with a 15 m height limit.
export function referenceT2(opts = {}) {
  const inputs = referenceT1(opts);
  inputs.project.name = 'T2 tight site (example)';
  inputs.site.areaHa = 6;
  inputs.site.heightLimitM = 15;
  return inputs;
}

// T4 small edge (§21): 5 MW IT, 1 ha urban site, grid available now. The brief gives no grid capacity or
// phase date: 8 MW now and at full connection (above the ~7 MW design facility load) and one 5 MW phase
// at month 12 are builder choices (BUILD-NOTES "Slice: Site").
export function referenceT4(opts = {}) {
  const inputs = buildDefaultInputs(opts);
  const s = inputs.project.analysisStart;
  inputs.project.name = 'T4 small edge (example)';
  inputs.site.areaHa = 1;
  inputs.load.itMW = 5;
  inputs.grid.nowMW = 8;
  inputs.grid.fullMW = 8;
  inputs.grid.fullDate = s;
  inputs.load.phases = [{ itMW: 5, date: addMonths(s, 12) }];
  return inputs;
}

// Is this record researched and approved (label "sourced — not independently checked")?
export function isSourced(r) { return !!r && r.label === LABEL_SOURCED; }

// Site tab (Beta) switch in the general settings (walkthrough, 2026-10-21; BRIEF §2 principle 3, §10, §12.12):
// off by default. A view setting: it changes what is shown, never a score, a rank or a run.
rec('view.siteTabBeta', false, 'toggle', { basis: 'judgement', dist: 'fixed', ref: '§12.12',
  note: 'Site tab (Beta): site layout, boundary drawing, GeoJSON/KML import and site fit. Hidden by default; when on it is labelled Beta and never affects the ranking or the PDF.' });

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
  // "by country" defaults: at default while no value is entered (a number entered replaces it, e.g. utilities.gasPrice).
  if (r.derived && typeof r.value === 'string' && r.value.startsWith('by ')) return cur == null || cur === r.value;
  return JSON.stringify(cur) === JSON.stringify(r.value);
}
