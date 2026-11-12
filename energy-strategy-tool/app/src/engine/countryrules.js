// Country rules from the research run of November 2026 (work packages 24 and 26, owner 2026-11-08: "Update the app with
// everything we've discussed and agreed"). Pure data and small helpers; no UI.
//
// Grid charges (OPEN-QUESTIONS 160–165, 201–205, 216–218, 233):
// - The per-MWh adder holds every grid charge (network + levies and taxes), worked out for a flat load (100 MW
//   contracted, 745 GWh a year). Where both parts are published and clear the country default is that sum, labelled
//   "sourced — not independently checked"; elsewhere today's indicative value stays (OPEN-QUESTIONS 202).
// - When the engineer ticks the per-MW grid charge (unticked by default, OPEN-QUESTIONS 160), the per-MW part is taken
//   out of the adder (at the flat load) and charged on the option's own contracted grid MW each month (OPEN-QUESTIONS
//   162, 203). A country with no usable published value charges nothing and is flagged "no published value found"
//   until the engineer enters a figure (OPEN-QUESTIONS 165).
// - Great Britain's residual transmission charge is a yearly lump sum per site (OPEN-QUESTIONS 217).
// - Germany's discount for large flat loads is a tick, off by default (OPEN-QUESTIONS 216).
// - Data centre tax rules are flags naming the local website (OPEN-QUESTIONS 204); where the rate depends on conditions
//   (France, Great Britain) the normal rate is used until the engineer ticks that the conditions are met (233).

import { GRID_CHARGE_DATA } from './gridcharges-data.js';

export const FLAT_LOAD_MWH_PER_MW = 7450; // 745 GWh a year ÷ 100 MW: the flat load the adders were worked out for
export const GB_GBP_PER_EUR = 0.8377; // ECB reference rate of 22 Oct 2026 (project.fx)

export const RESEARCH_NOTE = 'docs/research/levies-and-taxes-2026-11.md and grid-capacity-charges-2026-11.md (accessed 2026-11-07)';

export function gridChargeData(cc) {
  return GRID_CHARGE_DATA[cc] || null;
}

// The researched country adder (€/MWh), or null where today's indicative value stays.
export function researchedAdder(cc, reduced = false) {
  const d = GRID_CHARGE_DATA[cc];
  if (!d || !Number.isFinite(d.adder)) return null;
  return reduced && Number.isFinite(d.adderReduced) ? d.adderReduced : d.adder;
}

// Countries whose rate depends on conditions the engineer must meet (OPEN-QUESTIONS 233).
export const CONDITIONAL_RATE = { FR: 'the reduced data centre excise rate', GB: 'the Climate Change Agreement discount' };

// Great Britain: TNUoS transmission demand residual, band T-Demand4 (transmission connected), 2026/27:
// £20,829.236682 per site per day (NESO). A yearly lump sum, the same for every option that uses the grid.
export const GB_RESIDUAL = {
  gbpPerDay: 20829.236682,
  gbpPerYear: 20829.236682 * 365,
  eurPerYear: Math.round((20829.236682 * 365) / GB_GBP_PER_EUR),
  source: 'NESO, TNUoS tariffs 2026/27, transmission demand residual band T-Demand4 (£20,829.24 per site per day; £9.7 m a year forecast for 2027/28)',
  url: 'https://www.neso.energy/document/376336/download',
  published: '2026-01',
  accessed: '2026-11-07',
  networkPartGbpPerMWh: 10.8, // TNUoS at the flat load, inside the GB adder
};

// Germany: individual network charge for large flat loads, StromNEV § 19(2) sentence 2 (OPEN-QUESTIONS 216): at least
// 7,000 / 7,500 / 8,000 use hours and more than 10 GWh a year → no less than 20 / 15 / 10 % of the published charge,
// with the regulator's approval. Applied to Germany's network part only (€14.0/MWh at the flat load: €6.9 energy +
// €7.1 power), never to levies and taxes.
export const DE_DISCOUNT = {
  steps: [[8000, 0.10], [7500, 0.15], [7000, 0.20]],
  minGWh: 10,
  networkEnergyPerMWh: 6.9,
  networkPerMWhFlat: 14.0,
  source: 'StromNEV § 19(2) sentence 2 (individual network charge); docs/research/grid-capacity-charges-2026-11.md, Germany',
  url: 'https://www.gesetze-im-internet.de/stromnev/__19.html',
};
export function deDiscountFactor(useHours, gridMWh) {
  if (!(gridMWh > DE_DISCOUNT.minGWh * 1000)) return 1;
  for (const [h, f] of DE_DISCOUNT.steps) if (useHours >= h) return f;
  return 1;
}

// Data centre tax rules (OPEN-QUESTIONS 204, 233): flag text by country, naming the local website.
export const DC_TAX = {
  FR: {
    normal: 'Electricity excise: normal rate €26.35/MWh used (OPEN-QUESTIONS 233: the normal rate until the engineer ticks that the conditions are met). Data storage centres can pay a reduced rate (€10/MWh above the first 1 GWh a year) if they meet six conditions and give the supplier an attestation.',
    reduced: 'Electricity excise: reduced data centre rate €10/MWh used, because the engineer ticked that the conditions are met. It needs six conditions and an attestation to the supplier (form 2040-TIC-ATT-E-SD, code E16); the saving is not certain until the supplier applies it.',
    site: 'impots.gouv.fr (form 2040-TIC-ATT-E-SD) and BOFiP BOI-RES-EAT-000191; the €10 rate and the six conditions from an energy broker (Opéra Énergie)',
  },
  FI: {
    normal: 'Electricity tax: class I (€23.25/MWh) used. Data centres paid class II (€1.35/MWh) until 30 June 2026.',
    site: 'vero.fi, "Sähkövero", updated 23 April 2026',
  },
  SE: {
    normal: 'Energy tax: general rate SEK 360/MWh used. Data centres lost the reduced rate on 1 July 2023.',
    site: 'Skatteverket (skatteverket.se), news of 16 December 2022 and "Skatt på el"',
  },
  NO: {
    normal: 'Electricity tax: standard rate 7.13 øre/kWh used. A reduced rate for data centres above 0.5 MW existed and has ended; the end date was not found.',
    site: 'Skatteetaten statement (2018) and Stortinget proposal of 3 February 2026',
  },
  GB: {
    normal: 'Climate Change Levy: full rate £8.01/MWh used (OPEN-QUESTIONS 233: the normal rate until the engineer ticks that the conditions are met). Holders of a Climate Change Agreement get 92 % off; data centres have a sector agreement for 2026–2030.',
    reduced: 'Climate Change Levy: 92 % discount used (about £0.64/MWh), because the engineer ticked that the campus will hold a Climate Change Agreement through the data centre sector agreement.',
    site: 'GOV.UK, "Climate Change Levy rates" (read 7 November 2026); the sector agreement from techUK (16 October 2025)',
  },
};

// Published price paths (owner 2026-11-07, OPEN-QUESTIONS 232; work package 25). Gas: World Bank Commodity Markets
// Outlook (April 2026) for 2026 and 2027, then the TYNDP 2026 scenarios methodology (June 2026, Table 6, 2024 money);
// straight lines between the years given, flat after 2040. The factor is the forecast in a year over the forecast in the
// year of the gas price's own date (2026: the July 2026 price), so an entered price keeps its level and follows the
// forecast's shape. Carbon: from today's price (October 2026) in a straight line to the TYNDP values.
export const GAS_PATH = [[2026, 45.8], [2027, 36.6], [2030, 33.1], [2035, 35.3], [2040, 37.4]];
export const GAS_PATH_ANCHOR = 2026;
export const CARBON_PATH = [[2030, 97.5], [2035, 197.5], [2040, 297.5]];
export const CARBON_ANCHOR = 2026;
function interp(path, year) {
  if (year <= path[0][0]) return path[0][1];
  for (let i = 1; i < path.length; i++) {
    const [y1, v1] = path[i], [y0, v0] = path[i - 1];
    if (year <= y1) return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
  }
  return path[path.length - 1][1];
}
export function gasPathFactor(year) {
  return interp(GAS_PATH, year) / interp(GAS_PATH, GAS_PATH_ANCHOR);
}
export function carbonPathFactor(year, todayPrice) {
  const p0 = Number(todayPrice) > 0 ? Number(todayPrice) : 88.3;
  // The EU path relative to the EU ETS price of the release (€88.3/t); the same ratios for any other price (UK ETS, an
  // entered price).
  const path = [[CARBON_ANCHOR, 88.3], ...CARBON_PATH];
  void p0;
  return interp(path, year) / 88.3;
}

// Taking over a closing plant's grid connection, by country (owner 2026-11-07, OPEN-QUESTIONS 155, 214, 215; research
// `docs/research/plant-connection-takeover-2026-11.md` and `-part2-2026-11.md`). Wording only: no number and no
// ranking changes. The general line goes on every takeover flag (215).
export const TAKEOVER_GENERAL = "A plant's grid connection is an export (feed-in) right and a data centre needs an import (offtake) right, so a connection does not simply transfer (OPEN-QUESTIONS 215).";
export const TAKEOVER_RULE = {
  ES: 'Looks unavailable: the capacity freed by a closing plant is tendered for new renewables and storage (Spain).',
  PT: 'Looks unavailable: the capacity freed by a closing plant is tendered for new renewables and storage (Portugal).',
  GB: 'Looks unavailable: under the new connection rules a data centre needs its own demand connection (Great Britain).',
  IE: 'Looks unavailable: under the new rules a data centre needs its own demand connection (Ireland).',
  NO: 'Likely not available: reserved capacity cannot change purpose under the queue practice (industry guide to NEM § 3-4, Fornybar Norge, June 2025); a data centre needs its own maturity-assessed request (OPEN-QUESTIONS 214).',
  NL: "Not confirmed: an assumed right. A plant's feed-in capacity is not offtake capacity; in congested areas unused capacity returns to the queue (Netcode art. 7.13), and TenneT may keep a data centre waiting until capacity exists (court ruling of 29 April 2026).",
  FR: 'Not confirmed: an assumed right. No rule found; unused connection power is cut back each year to 125 % of past demand. Fast-track capacity for large consumers is allocated by the State on chosen 400 kV sites.',
  IT: "Not confirmed: an assumed right. No rule found; Italy's last coal plants are being kept as a reserve.",
  BE: "Not confirmed: an assumed right. No rule found; new 'use it or lose it' rules return unused capacity to the queue.",
  DK: "Not confirmed: an assumed right. Large consumers are queued by maturity since 1 February 2026; no rule passes a plant's connection to a new user.",
  FI: 'Not confirmed: an assumed right. No rule found; priority rules for scarce capacity are being prepared.',
  SE: 'Not confirmed: an assumed right. No rule found; Svenska kraftnät allocates on complete applications and is reviewing large connections.',
  IS: 'Not confirmed: an assumed right.',
  DE: 'Not confirmed: an assumed right. No rule found; transmission connections are allocated by a maturity procedure from 2026, and a closing plant may be held in the grid reserve.',
};
export const takeoverRule = (cc) => TAKEOVER_RULE[cc] || 'Not confirmed: an assumed right. Not researched for this country.';
// Realism rebuild (2026-11-11, OPEN-QUESTIONS 250): how the buildability tests read the table above. Where the
// research found the route closed ("looks unavailable", "likely not available") an option that takes a plant's
// connection over is unlikely to be built as it stands; elsewhere the import right is a condition to confirm with the
// grid operator. The engineer can tick a plant as confirmed (plants.importConfirmed).
export const TAKEOVER_UNLIKELY = new Set(['ES', 'PT', 'GB', 'IE', 'NO']);
export const takeoverOutlook = (cc) => (TAKEOVER_UNLIKELY.has(cc) ? 'unlikely' : 'condition');

// Ireland's large energy user policy (owner 2026-11-07, OPEN-QUESTIONS 198, 210–213): a minor flag on every Irish run.
// De-rating factors from the latest T-4 capacity auction information pack (SEMO, IAIP3031T-4 v1.0, 2030/31, 4 August
// 2026), bundled and refreshed at each release; the engineer can override any factor (inputs.ireland.derating).
export const IE_POLICY = {
  text: 'Ireland: data centres of 10 MVA or more must bring new dispatchable plant or storage, on site or on the same local network, whose capacity after the capacity market\'s de-rating is at least the maximum import capacity; demand cannot step up beyond the de-rated plant actually built; at least 80 % of yearly demand must come from new Irish renewables within six years of energisation. Source: CRU decision CRU/2025236 (12 December 2025) and EirGrid\'s process paper V3 (20 May 2026), cru.ie and eirgrid.ie. The decision is under judicial review (leave granted 28 April 2026).',
  powerFactor: 0.975, // owner's judgement (OPEN-QUESTIONS 212)
  thresholdMVA: 10,
  table: {
    source: 'SEMO, Capacity Market T-4 auction information pack 2030/31 (IAIP3031T-4 v1.0, 4 August 2026), Tables 1, 3, 5 and 6',
    date: '2026-08-04',
    gasBySize: [[10, 0.868], [20, 0.857], [30, 0.848], [50, 0.833], [100, 0.819], [200, 0.797], [400, 0.733]],
    storageByHours: [[1, 0.043], [2, 0.077], [4, 0.143], [8, 0.534]],
    wind: 0.059, solar: 0.041,
    note: 'Gas turbine factors by unit size are used for every dispatchable thermal unit (engines, CHP, fuel cells): judgement. The 8-hour storage factor reads the same as the 2029/30 pack: to check against the PDF.',
  },
};
export function ieGasFactor(unitMW, over) {
  if (over && Number.isFinite(over.gas)) return over.gas;
  for (const [mw, f] of IE_POLICY.table.gasBySize) if (unitMW <= mw) return f;
  return IE_POLICY.table.gasBySize[IE_POLICY.table.gasBySize.length - 1][1];
}
export function ieStorageFactor(hours, over) {
  if (over && Number.isFinite(over.storage)) return over.storage;
  const t = IE_POLICY.table.storageByHours;
  let f = 0;
  for (const [h, x] of t) if (hours >= h - 1e-9) f = x;
  return f;
}

// Great Britain's proposed Data Centre Commitment Fee (owner 2026-11-07, OPEN-QUESTIONS 199, 206–209): an optional tick;
// the fee field starts blank with Ofgem's range beside it; a cash deposit paid on day 1 of the analysis, no bank fee,
// its only cost the money tied up at the discount rate; returned stage by stage as the grid capacity it was paid for
// becomes available. Applies in Great Britain to connections of 40 MW or more (Claude's reading, OPEN-QUESTIONS 238).
export const GB_FEE = {
  rangeGBP: [237500, 712500],
  thresholdMW: 40,
  source: 'Ofgem, consultation on a Data Centre Commitment Fee (29 July 2026): £237,500 to £712,500 per MW for connections of 40 MW or more; proposed, not decided (no decision found up to 7 November 2026)',
};
