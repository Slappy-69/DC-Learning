# Research run of November 2026: progress

Branch: `feature/research-2026-11`, created from `feature/takeover-decisions` on 2026-11-07. Prompt: the project note `claude/research-run-prompt-2026-11-07.md` (OPEN-QUESTIONS 155–200). Research and proposals only: nothing in `app/`, the defaults register or `main` is changed.

A new chat that picks this up: read this file, then carry on from the first part that is not "done", in the order C, D, B, A, E, G, F.

## Parts

| Part | Subject | Output | State | Dates |
|---|---|---|---|---|
| C | Great Britain's Data Centre Commitment Fee (OQ 199) | `gb-commitment-fee-2026-11.md` | Done | 2026-11-07 |
| D | Ireland's large energy user policy (OQ 198) | `ireland-large-energy-users-2026-11.md` | Done | 2026-11-07 |
| B | Closing plant's grid connection, more countries (OQ 155) | `plant-connection-takeover-part2-2026-11.md` | Done | 2026-11-07 |
| A | Yearly grid charge per MW, 31 countries (OQ 160–165) | `grid-capacity-charges-2026-11.md` and `.csv` | Done (5 random entries checked) | 2026-11-07 |
| E | Renewable plant data sources (OQ 194–197) | `renewable-plant-sources-2026-11.md` | Done | 2026-11-07 |
| G | Open map data for main utilities (OQ 200) | `utility-maps-2026-11.md` | Done | 2026-11-07 |
| F | Defaults research, batch 3 (work package 0) | `defaults-batch-3-proposals-2026-11.md` and `.csv` | Done for this run (stopped after 26 proposals; next records listed in the file) | 2026-11-07 |

## Part A: countries

Order: PT, ES, NL, GB, IE, DE, FR, then AT BE BG HR CY CZ DK EE FI GR HU IS IT LV LT LU MT NO PL RO SK SI SE CH.

| Country | State |
|---|---|
| PT | Done 2026-11-07 |
| ES | Done 2026-11-07 |
| NL | Done 2026-11-07 |
| GB | Done 2026-11-07 |
| IE | Done 2026-11-07 (2025/26 rate; 2026/27 table not found) |
| DE | Done 2026-11-07 |
| FR | Done 2026-11-07 (August 2025 grid; the 1 August 2026 grid not read) |
| AT | Done 2026-11-07 |
| BE | Done 2026-11-07 |
| BG | Done 2026-11-07 (no capacity charge) |
| HR | Done 2026-11-07 (2025 items; 2026 not read) |
| CY | Done 2026-11-07 (no published value found) |
| CZ | Done 2026-11-07 (2025 prices; 2026 not read) |
| DK | Done 2026-11-07 |
| EE | Done 2026-11-07 (package II terms to check) |
| FI | Done 2026-11-07 (no capacity charge) |
| GR | Done 2026-11-07 (secondary sources) |
| HU | Done 2026-11-07 |
| IS | Done 2026-11-07 (2022 tariff; later not read) |
| IT | Done 2026-11-07 |
| LV | Done 2026-11-07 |
| LT | Done 2026-11-07 (no 2026 value found) |
| LU | Done 2026-11-07 |
| MT | Done 2026-11-07 (no published value found) |
| NO | Done 2026-11-07 |
| PL | Done 2026-11-07 (structure only; rate table not readable) |
| RO | Done 2026-11-07 (no capacity charge) |
| SK | Done 2026-11-07 |
| SI | Done 2026-11-07 (group naming to check) |
| SE | Done 2026-11-07 (no readable value) |
| CH | Done 2026-11-07 |

All 31 countries done. Values not found or not readable, to try again later: CY, LT, MT, PL (rate table), SE (price list); 2026 values not read for CZ, HR, IE (2026/27), FR (Aug 2026 grid); IS out of date (2022).

Notes gathered before Part A started (use them, then check):

- FI: Fingrid 2026 (Appendix 2, 1 Jan 2026): consumption fee €10.47/MWh winter weekday 07–21, €2.97/MWh other times; intake fee €1.07/MWh; no capacity fee for consumption (only plants €189.5/MW/month and storage €94.75/MW/month). 2027 prices published as attachments on Fingrid's fee page.
- IE: MIC bond = network capacity charge × 18 months × MIC (EirGrid, connection charges and security); the capacity charge rate itself still to find (TUoS statement).

## Part H: levies and taxes per MWh (owner's choice, 7 November 2026, after the run)

Output: `levies-and-taxes-2026-11.md` and `.csv`. Order: DE, NL, GB, FR, ES, PT, IE, IT, then the others alphabetically. Eurostat's component data could not be reached (shell refused; the DBnomics mirror shows only 2022 for band IG).

| Country | State |
|---|---|
| DE | Done 2026-11-07 |
| NL | Done 2026-11-07 |
| GB | Done 2026-11-07 (levies mostly from a secondary guide) |
| FR | Done 2026-11-07 (secondary sources) |
| ES | Done 2026-11-07 (tax only; small supplier items not researched) |
| PT | Done 2026-11-07 |
| IE | Done 2026-11-07 (capacity and imperfections charges not researched) |
| FI | Done 2026-11-07 |
| SE | Done 2026-11-07 |
| NO | Done 2026-11-07 (data centre rate unclear) |
| DK | Done 2026-11-07 |
| CH | Done 2026-11-07 |
| AT | Done 2026-11-07 (renewables contribution % not read) |
| BE | Done 2026-11-07 (2025 surcharges; federal excise not read) |
| PL | Done 2026-11-07 (excise not read) |
| CZ | Done 2026-11-07 (POZE state-paid 2026–27; OTE fee not read) |
| IT | Partly done 2026-11-07 (rate tables not readable) |

Part H stopped after 14 countries (DE, NL, GB, FR, ES, PT, IE, IT partly, FI, SE, NO, DK, CH, AT) to save the owner's usage; the other 17 are listed at the end of `levies-and-taxes-2026-11.md`.

## Assumptions taken

(Where the prompt did not settle something, the more cautious reading was taken and recorded here.)

- C: no Ofgem decision found up to 2026-11-07; the fee is treated as proposed. Its Chapter 7 (consequences of missed milestones) could not be read in full; consequences taken from the press release and the draft code text.
- C: a phased campus holds the whole fee until the grid energises (no stage-by-stage release found).
- D: standby gensets that never trade do not count towards Ireland's de-rated test (the policy asks for market plant without run-hour limits).
- D: the 8-hour storage de-rating column of the 2030/31 T-4 pack read the same as 2029/30; marked for checking against the PDF.

## Questions for the owner

(Anything the owner must decide, gathered as the run goes.)

- C1. GB fee default: blank (engineer enters) or the published midpoint £475,000/MW as a labelled example?
- C2. Cost of the money tied up: cash at the discount rate (Ofgem's worst case), or a letter-of-credit fee rate entered by the engineer?
- C3. Offer acceptance date: a new input, or a default number of years before the grid date?
- D1. Ireland flag severity: major or minor?
- D2. Do standby gensets count towards Ireland's de-rated test (cautious reading: no)?
- D3. MVA against MW for Ireland's test: equal (EirGrid's example) or the option's power factor?
- D4. Bundle the latest T-4 de-rating table (2030/31, August 2026) and update it at each release?
- B1. Norway's takeover flag: "likely unavailable" (reserved capacity cannot change purpose) rather than "not confirmed"?
- B2. Should the general takeover flag say, for every country, that a plant's export connection is not an import connection?
- A1. Countries that charge on measured peak (DE today, PT peak hours, NL monthly maximum, GB Triads): charge the per-MW line on the option's contracted grid MW anyway (as decided in OQ 162), or on its peak import?
- A2. Discounts for large flat loads (DE bandload, ES/PT electro-intensive): leave out, offer as a tick, or apply by default?
- A3. GB's residual is fixed per site, not per MW: enter it as a yearly lump sum, or divide by the contracted MW?
- A4. Where the network bill has both a contracted line and a peak line (NL, BE, PT), should the tick carry only the contracted line (the rest stays in the per-MWh adder), or both?
- A5. Latvia charges on transformer capacity, usually above the contracted MW: accept the understatement, or add a transformer factor?
- E1. Renewable plant source: powerplantmatching (recommended), OpenStreetMap, or both?
- E2. Group German wind turbines into farms at build time (a judgement distance), or show them turbine by turbine?
- E3. powerplantmatching's licence mix (about 2 % of renewable rows draw on OpenStreetMap): accept its CC BY 4.0 statement, or ask a licensing adviser?
- G1. Which utilities first (proposed: electricity 220 kV+, gas, water, heat, telecoms)?
- G2. Each utility as a default distance that drives a cost (electricity, gas) or only as a flag (water, telecoms, heat)?
- G3. ODbL data (OpenStreetMap, PyPSA-Eur network) bundled as separate files in the public repository and the Windows program: acceptable?
- G4. Build a release script for OpenStreetMap extracts (needs a machine that can reach Geofabrik)?
- F1. Approve ACER 2026 as the source for cable route costs, split by voltage band?
- F2. Keep the network adders unchanged until levies are researched (proposed), or lower them now?
- F3. Gas connection pipe: keep 0.8 M EUR/km as judgement with the ACER flag, or move to the ACER median 2.08 M EUR/km?

- H1. Set the adder to network + levies and taxes for DE, NL, PT, FI, SE, DK, CH, IE now, or after the rest are researched?
- H2. Show data centre tax rules (FR reduced rate, FI change on 1 Jul 2026, GB CCA discount, NO unclear) as flags on the options?
- H3. GB: use levies from a secondary guide (about £78/MWh), or wait until each is read from its issuing body?

## Where the next run starts

Part F, the list "Not reached in this batch" in `defaults-batch-3-proposals-2026-11.md`, starting with levies and taxes per MWh by country. Part A gaps to retry: CY, LT, MT, PL (section C table), SE (2026 price list), and the 2026 values for CZ, HR, IE (2026/27) and FR (August 2026 grid).

## Sites not reachable

(Sites that could not be reached, with the source used instead.)

- The session's shell cannot reach most websites (for example www.ofgem.gov.uk: refused by the session's network allowlist). Pages were read with the web-reading tool instead; no workaround was tried.
- Utility Week (article on government support for the GB fee): refused by the site.
- sinnfein.ie (refused) and stackpath.ie (does not allow automated reading): same content found elsewhere.
- B: lovdata.no (refused), anwalt.de (refused), gridreadiness.com (does not allow automated reading).
- A: several regulators' pages refused or did not extract tables (ft.dk, vert.lt, cru.ie publications, EirGrid statement of charges, CRE and PSE tariff tables, Ofgem from the shell). Sources used instead are named in each country section.
- E: overpass-api.de, taginfo.openstreetmap.org, download.geofabrik.de and openinframap.org refused from the shell; OpenInfraMap's statistics pages were read with the web reader. openstreetmap.org/copyright needed a permission that was not granted; the OSM Foundation FAQ was used.
