# H3 verification: work packages 6, 7, 9, 10 and 1

Date: 2026-10-23. Verifier: Claude Haiku 5.5 (independent check, no fixes made).
Scope: BUILD-NOTES "Work packages 6 and 7" (line 1633), "Work package 9" (1648), "Work package 10" (1669), "Work package 1" (1738); OPEN-QUESTIONS 24, 29, 30, 32, 35, 63, 64, 65; BRIEF section 21, acceptance tests 17, 24 and 26.

## What I checked and how

- One T1 run (`referenceT1()`, 29 to 34 s), converted with `toTransferable` as the app does (`useCompute.js` line 107). Every T1 check uses that run.
- Cards, identical results, pros and cons: recomputed each one in an independent script from the 2,000 options.
- Weight change text: called with fixed weights, and again after a real re-score (`rescore`, as `App.jsx` line 116 does).
- Tornado: default seven, all sixteen drivers, sort orders, base re-run against the run's score.
- PDF: built with two compared options and the default-seven tornado; checked with qpdf, pdftotext, a per-page footer count, and byte hashes for determinism. Also built a T2 PDF (Site tab on) and a GBP PDF.
- Country from the pin: about 80 points (border cities, Nordic, coastal, sea, non-built-in countries), against the bundled outlines and the fallback. Ground truth for the towns is my own knowledge (no network), and coordinates are approximate town centres.
- Display currency: values, unit text and reset, run without the engine.
- Not run, as instructed: `npm test`, `npm run build`, `npm run test:browser`. No network. No repository file changed except this report.

Scripts and outputs: `/tmp/claude-0/-home-claude/95f78427-fc73-53b2-b6d4-6b1291b2d70a/scratchpad/h3/`. Main scripts: `t1-main.mjs` (log `t1-main.log`, checks `t1-checks.json`), `t1-c.mjs` (log `t1-c.log`), `t1-b.mjs` (currency part; its rescore part failed on a script bug and was re-run in `t1-c.mjs`), `pins.mjs`, `pins2.mjs`, `serbia.mjs`, `names.mjs`, `russia.mjs`, `coast.mjs`, `axes.mjs`, `closure.mjs`, `flagtext.mjs`, `dtflag.mjs`, `explore.mjs`. PDFs: `t1-report.pdf` (plus `t1-report-nodate.pdf`, `t1-report-otherdate.pdf`, `t1-report-gbp.pdf`), `t2-report.pdf`; text `t1-report.txt`, `t2-report.txt`, `t1-gbp.txt`.

## Results

| ID | Check | Status | Evidence |
|---|---|---|---|
| C1.1 | `topCards` gives five distinct strategies (C1, C2, C4, C5 key) | VERIFIED | Cards #1, #2, #3, #5, #6; five distinct keys. `cards.js` 74-89; `t1-main.log` |
| C1.2 | Each card is the best-ranked non-identical option of its strategy | VERIFIED | An independent walk gives the same five ids. #4 is skipped because its key (bridge / gasRecip / none / diesel) equals #2's. `cards.js` 80-87 |
| C1.3 | Pros and cons by hand for cards #1 and #3, against all 2,000 options | VERIFIED | #1 pros: LCOE 18 of 2,000 better (0.9 %), deliverability 70 (3.5 %), capex 75 (3.8 %); no cons. #3 pros: deliverability 3.5 %, LCOE 4.6 %, carbon 8.6 %; no cons. Library matched in both. `cards.js` 56-71 |
| C1.4 | Cons (worse half) on weak options | VERIFIED | Worst LCOE (#1566): cons LCOE, capex, deliverability (worse than 99 % or more). Mid rank (#1000): carbon 75 %, capex 65 %, LCOE 59 %. Slowest (#1828): time-to-power 98 %, carbon-free hours 71 %. Library matched the hand result in all three. No T1 card has a con. |
| C1.5 | Each card states its comparison set | VERIFIED | "against the 2,000 options in this run". `cards.js` 88; PDF section 3 |
| C1.6 | Cons wording "worse than N % of the run" | VERIFIED | The worst-LCOE option is better than 1,999 of 2,000 others and reads "worse than 100 %". Wording only (L1). `cards.js` 66 |
| C2.1 | `identicalResults` marks 64 options; no missed duplicates | VERIFIED | 64 marks; an independent key gives the same 64; 0 mismatches; 0 missed. `cards.js` 20-32 |
| C2.2 | Three marked pairs equal in nine figures, resilience and adequacy to 10 s.f. | VERIFIED | #148 equals #147; #153 equals #152; #176 equals #175. All nine figures, status and adequacy agree (LCOE 161.907325976 in #147 and #148). |
| C2.3 | Each mark points to a better-ranked option | VERIFIED | All 64 |
| C3.1 | `describeWeightChange`: weights changed, leader unchanged | VERIFIED | "Weights changed: Cost 35 → 45 %, Time-to-power 25 → 20 %, Deliverability 15 → 10 %. The leader is unchanged: #1 … (score 92.7)." `cards.js` 93-105 |
| C3.2 | `describeWeightChange`: leader moved, after a real re-score | VERIFIED | Carbon-heavy weights: "New leader: … (score 95.5); the previous leader … is now #11." Re-scored with `scoreOptions` (`App.jsx` 116) |
| C3.3 | No change gives null; no previous leader gives no leader sentence | VERIFIED | Returns null; returns the weight sentence only |
| C3.4 | Rounding of shares | VERIFIED | Thirds give 33 → 30 %, 17 → 20 %. `cards.js` 94 |
| C4.1 | Sixteen tornado drivers, unique ids | VERIFIED | 16 unique. `sensitivity.js` 32-111 |
| C4.2 | Default seven equal the decision log's list | VERIFIED | gas-price, grid-price, wacc, carbon-price, capex, capacity-factors, grid-date. Decision log line 65 names the same seven. `sensitivity.js` 114 |
| C4.3 | Default-seven rows sorted by LCOE swing | VERIFIED | Swings (€/MWh): 30.61, 9.96, 8.47, 6.59, 0.17, 0.12, 0. `sensitivity.js` 124-128, 203-204 |
| C4.4 | `sortRows` by score sorts by score swing | VERIFIED | Order by score swing; first is grid-date (9.19 points) |
| C4.5 | Capex low and high are 0.7 and 1.5; LCOE moves the right way | VERIFIED | Low ×0.7: LCOE 149.88; base 153.05; high ×1.5: LCOE 158.35. `defaults.js` 801 |
| C4.6 | Base re-run equals the run's score | VERIFIED | Score 92.6897590612815 in both; difference 0. LCOE difference 0. `sensitivity.js` 179-208 |
| C4.7 | Each new driver moves the result it acts on | VERIFIED | Fourteen of sixteen move LCOE or the score on the leader. Capacity factors and flexibility trigger do not (no on-site PV or wind built; flexibility off, C16 = off). Grid connection capex moves LCOE by only 0.003 €/MWh (connection charge zero by default). See L5. |
| C4.8 | Driver ranges equal their registry records | VERIFIED | Capex 0.7–1.5 (`defaults.js` 801); battery capex 0.7–1.3 (802); grid capex 0.5–2 (803); capacity factors 0.85–1.15 (762); cooling 0.8–1.2 (713); period 15–25 years (793); escalation ±0.02 (804); test hours 3–24 (785); flexibility trigger 0.8–1.2 (637) |
| C4.9 | New multipliers equal 1 in the T1 run | VERIFIED | capexFactor, reYieldFactor, coolingFactor, bessCapexFactor, gridCapexFactor all 1 |
| C4.10 | Default tornado measure is LCOE | VERIFIED | `measure` = lcoe. `defaults.js` 638 |
| C5.1 | PDF structure is valid | VERIFIED | qpdf --check: no syntax or stream errors |
| C5.2 | Nine sections in order, inputs first | VERIFIED | Line numbers in `t1-report.txt`: 1 Inputs 30; 2 Assumptions 469; 3 Results 881; 4 Trade-offs 1030; 5 Compare 1066; 6 Dispatch 1119; 7 Sensitivity 1192; 8 Flags 1235; 9 Method 1642. `report.js` 126-300 |
| C5.3 | "Page n of N" on every page | VERIFIED | 20 of 20 pages. `pdf.js` 209-215 |
| C5.4 | Top five appear | VERIFIED | Cards #1, #2, #3, #5, #6 in sections 3, 6 and 8 |
| C5.5 | No site-fit flag message | VERIFIED | T2 (Site tab on): 12 site-fit messages on its top five; none found in the PDF. T1's top five carry no site-fit flags, so that run is a weak test. `report.js` 275-282 |
| C5.6 | No Site tab content (AC 26) | FAILED | Site-tab penalty inputs and Site-tab notes appear in sections 1 and 2 (`t1-report.txt` 356–362, 492–508, 744–747, 817–848; also in T2). The cover says the Site tab is not part of the report (line 24). M2 |
| C5.7 | Deterministic for a fixed date | VERIFIED | Same SHA-256 for two builds; a different date changes the bytes; no CreationDate when no date is given |
| C5.8 | Assumptions sentence on label counts | FAILED | Says "545 are 'indicative — unverified'". Registry: 522 carry that label and 23 carry "sourced — not independently checked". `report.js` 142-144; `t1-report.txt` 470–471. M1 |
| C5.9 | Cover states the currency and rate | VERIFIED | EUR: "Euro". GBP: "GBP, converted from euro at 0.8377 per euro (fixed ECB reference rate of the release)". `report.js` 109 |
| C5.10 | Bookmarks for sections; fonts not embedded | VERIFIED | 9 bookmarks; only Helvetica and Helvetica-Bold; no font files embedded. `pdf.js` 221-232 |
| C5.11 | Table headers repeat on a new page | VERIFIED | Compare table header repeats at the top of page 13 |
| C5.12 | No network; report uses app modules only | VERIFIED | Import closure of 27 files; no external imports; no fetch, XMLHttpRequest or WebSocket; "import (" hits are text inside strings only |
| C5.13 | Size "about 600 kB" (BUILD-NOTES line 1674) | FAILED | 681,831 bytes for the T1 report (20 pages, two compared options, tornado). L3 |
| C5.14 | Layout: trade-off chart, cover box, phone width | NOT VERIFIED | No rasteriser or browser run |
| C6.1 | Border pins: twelve cities correct | VERIFIED | Strasbourg FR; Basel CH; Geneva CH; Aachen DE; Tornio FI; Derry GB; Newry GB; Konstanz DE; Kreuzlingen CH; Maastricht NL; Frankfurt (Oder) DE; Luxembourg LU |
| C6.2 | Border pins: Gorizia (IT) and Menton (FR) | FAILED | Gorizia gives SI; the nearest Slovene outline edge is 1.3 km away. Menton gives IT; the Italian edge is 0.4 km away. M4 |
| C6.3 | Narva (EE) and Haparanda (SE) | FAILED | Narva gives EE, but only by luck: the outline puts it inside Russia (H1). Haparanda gives FI (H1). |
| C6.4 | Spanish coast and Gibraltar: La Línea, Cádiz, Gibraltar | FAILED | La Línea gives PT, although it is 0.07 km from the Spanish outline. Cádiz gives PT. Gibraltar gives PT (UK territory, not in the map; ambiguous). H2 |
| C6.5 | Northern Norway and Sweden: Kiruna, Luleå, Bodø, Narvik, Tromsø, Kirkenes, Vardø | FAILED | All seven give FI. The Russia outline causes this (H1). Narvik and Tromsø are in C6.7. |
| C6.6 | Belgrade (Serbia, no built-in profile) | VERIFIED | HU, with a flag naming Serbia. This is the designed behaviour. |
| C6.7 | Coastal and city set (32 points) | FAILED | 28 correct. Wrong: Cádiz (PT), Narvik (FI), Tromsø (FI), Constanța (BG). H1, H2 |
| C6.8 | Sea pins take the flagged "assumed" country | VERIFIED | Flag present (`assumed.js` 85-88). Country from the nearest reference point: mid-Atlantic PT, North Sea DK, Channel GB, Baltic SE. L6 |
| C6.9 | Flag text names the right place | FAILED | Kiruna: "the pin is in Russia, which has no built-in profile". La Línea: "the pin is at sea or outside the map". Both wrong. H1, H2 |
| C6.10 | Map data: 0.01° grid; 67 outlines; 31 with built-in codes | VERIFIED | All coordinates on the 0.01° grid; 67 outlines; 31 carry built-in codes. The extent claim is C8.3. |
| C6.11 | Design-temperature "assumed" flag on the run | VERIFIED | Flag text: "from the synthetic United Kingdom profile … not from a design station". `assumed.js` 91-92 |
| C7.1 | Display currency: money and perMWh are values × rate | VERIFIED | GBP at 0.8377: money(1e6) = £838 k; money(2e9) = £1.68 bn; perMWh(100) = £83.8/MWh. `format.js` 27-40 |
| C7.2 | `curUnit('€/MWh')` gives '£/MWh' | VERIFIED | `format.js` 25 |
| C7.3 | Reset to EUR | VERIFIED | €1 m; €100/MWh; unit €/MWh; rate 1 |
| C7.4 | Display currency left out of the compute key | VERIFIED | `App.jsx` 41-50 deletes `project.currency` |
| C8.1 | BUILD-NOTES WP6: T1 cards #1, #2, #3, #4, #6 | FAILED | The cards are #1, #2, #3, #5, #6. M3 |
| C8.2 | BUILD-NOTES WP6: 64 options "same results as" | VERIFIED | 64 |
| C8.3 | BUILD-NOTES WP1: outlines reach 32°W–46°E, 33°N–72°N | FAILED | Outlines span 180°W to 179.87°E and 18.99°N to 83.6°N; 36 of 67 carry no country code. L2 |
| C8.4 | BUILD-NOTES WP1: T1 stays United Kingdom | VERIFIED | Resolves to GB. `context.js` 11-16 |
| C8.5 | BUILD-NOTES WP1: release rate from ECB, 2026-10-22 | VERIFIED | Registry record: source ECB, year 2026-10-22, sourced label |
| C8.6 | BUILD-NOTES WP10: site geometry, site-fit flags and plan left out | VERIFIED | Geometry keys excluded (`report.js` 20); no site-fit flags (C5.5). The Beta penalty rows remain (C5.6). |
| C8.7 | BUILD-NOTES WP7: a fourth option replaces the oldest | VERIFIED | `App.jsx` 75 keeps the last three |
| C8.8 | BUILD-NOTES WP6/7: default axes carbon across, cost up | VERIFIED | `defaultParetoAxes` gives x = location, y = lcoe; encoding default resilience (`defaults.js` 622-624) |
| C8.9 | BUILD-NOTES WP9: seven ticked by default | VERIFIED | The seven ids in `DEFAULT_DRIVER_IDS` |
| C8.10 | BUILD-NOTES WP9: "Default seven" and "Tick all" controls | NOT VERIFIED | Code present (`SensitivityView.jsx` 263-264); browser not run |
| C8.11 | BUILD-NOTES WP6: top five first, Compare tick box, "Same results as" badges | NOT VERIFIED | Code present (`TopFive.jsx`, `RankedList.jsx` 98, `OptionDetail.jsx`); browser not run |
| C8.12 | BUILD-NOTES WP1: 31 built-in countries shaded | NOT VERIFIED | `MapPicker.jsx` not run |
| AC17 | Acceptance test 17: map and country | FAILED | The pin sets the country (C7 and C6.1 pass), but several pins give the wrong country (H1, H2, M4). The nearest ASHRAE station is not named; OPEN-QUESTIONS 64 answered "no", so that part is superseded. |
| AC24 | Acceptance test 24: results | VERIFIED | Five cards with comparison set (C1.1, C1.5); default axes (C8.8); resilience encoding; compare up to three (C8.7); tornado LCOE default and tick-box drivers (C4.2, C4.10). Browser checks not run. |
| AC26 | Acceptance test 26: PDF | FAILED | Inputs first, nine sections, page footers, currency, determinism and offline imports verified. Site-tab content present (C5.6). Save through a file dialog is code only (`packaging/desktop/app/lib/guards.js` 140-147), not run. |

## Findings

### High

- **H1. The Russia outline makes northern Norway, Sweden and Finland resolve to Finland, and the flag then says "in Russia".** The Russia outline is one ring (ring 0, 4,893 points) with longitudes from −180 to 179.87, so it crosses the 180° meridian. The planar even-odd test in `geocountry.js` 6–13 does not handle that. Points that are not in Russia fall inside it: Kiruna, Luleå, Bodø, Narvik, Haparanda (and Narva). Points outside every outline (Tromsø, Kirkenes, Vardø) go to the nearest reference point, which is Finland. Result: all seven Norwegian and Swedish test points give FI. The flag text (`assumed.js` 88) reads "the pin is in Russia, which has no built-in profile". AC 17 needs the pin to set the right country, and the country sets prices, carbon and climate defaults for every option. Files: `app/src/data/europe-map.js` (Russia entry), `app/src/engine/geocountry.js` 6–39, `app/src/engine/context.js` 19–23, `app/src/engine/assumed.js` 85–88.
- **H2. Pins that miss their own outline take the nearest reference point, which can name a non-neighbour.** `countryFromPin` falls back to `nearestCountry` (`profiles.js` 18–30), which measures distance to one reference point per country. La Línea is 0.07 km from the Spanish outline, yet the pin gives PT: Portugal's reference point is about 410 km away and Spain's about 490 km. Cádiz gives PT, and Constanța gives BG (Romania). Gibraltar gives PT. The flag for land points says "at sea or outside the map". Coastal sites are common for data centres, so this matters. The owner should decide the fallback (for example, the nearest outline edge, and a flag that says "on land outside the outlines").

### Medium

- **M1. The PDF misstates the label counts (C5.8).** Section 2 says 545 records are "indicative — unverified". The registry holds 522 with that label and 23 labelled "sourced — not independently checked". The app header counts 522 (`App.jsx` 182–184). The PDF counts `!r.verified` (`report.js` 143). Files: `app/src/report/report.js` 142–144; `t1-report.txt` 470–471.
- **M2. The PDF carries Site-tab (Beta) content (C5.6).** Inputs `deliverability.siteFitPenalty`, `siteFitFlagsPenalty` and `siteFitNoFitPenalty` appear as defaults. Notes on `site.pvGroundHa`, `site.softUsableBySolar` and `requirements.landTakeCeilingHa` mention the Site tab and site-fit statuses. `report.js` 20 excludes only the geometry keys. AC 26 says no Site tab content, and the cover says the Site tab is not part of the report. The owner should decide whether these rows stay.
- **M3. BUILD-NOTES gives the wrong T1 card list (C8.1).** Line 1646 says cards #1, #2, #3, #4, #6 (#5 repeats a strategy). The run gives #1, #2, #3, #5, #6, and #4 repeats #2's strategy. The code is right; the note is wrong or out of date.
- **M4. Border cases fall on the neighbour's side.** Gorizia (IT) gives SI; the Slovene outline edge is 1.3 km from the point. Menton (FR) gives IT; the Italian edge is 0.4 km away. The cause is 0.01° rounding (about 0.8 km east–west and 1.1 km north–south) plus 1:50m generalisation. A site within about 1 km of a border can take the neighbour's profile, and the flag gives no warning. The country is editable (AC 17). The town coordinates used are approximate.

### Low

- **L1.** Cons wording: "worse than 100 %" for an option better than 1,999 of 2,000 others (`cards.js` 66).
- **L2.** BUILD-NOTES line 1743 says the outlines reach 32°W–46°E, 33°N–72°N. The data spans 180°W to 179.87°E and 18.99°N to 83.6°N. 36 of 67 outlines have no country code (Russia, Serbia, Ukraine, Turkey, Greenland, Morocco and others).
- **L3.** The T1 PDF is 681,831 bytes, against "about 600 kB" (line 1674).
- **L4.** Stale registry note: `defaults.js` 639 says "This slice has 7 drivers and no control for this setting yet". There are 16 drivers.
- **L5.** Tornado points for the owner. (a) PUE: LCOE moves against cost. LCOE is cost over gross facility demand (`evaluate.js` 299, 327), so cutting cooling lowers the denominator too. At factor 0.8, LCOE is 153.17 and NPV is 906.6 m; at 1.2, LCOE is 152.94 and NPV is 919.8 m. (b) Grid connection capex barely moves LCOE on T1 (0.003 €/MWh), because the connection charge defaults to zero (WP3) and only the cable route scales. (c) Capacity factors and flexibility trigger do nothing for this leader. All three are explained by the design, but the Sensitivity view should say so.
- **L6.** Sea pins get the nearest reference point, not the nearest coast (mid-Atlantic gives PT). They are flagged "assumed", so this is by design, but the flag wording is misleading.

Outside scope, noted only: on T2 with the Site tab on, all 2,000 options show "Does not fit". AC 7 was not checked here.

## Limits

- Browser behaviour, the trade-off chart, the cover layout and the file-dialog save were not run.
- The town coordinates and their border positions are from my own knowledge, with no network to confirm them.
- The T1 leader is the only test case for the tornado. Some drivers show little or no effect on it by design.
