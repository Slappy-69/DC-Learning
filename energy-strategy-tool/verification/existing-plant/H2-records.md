# H2: records against code, work package 19 (existing gas plants)

Verifier: Claude Haiku, independent check. Worktree `/home/claude/eplant`, branch `feature/existing-plant`, commit `105abbb`. No source, test or record file was edited.

## Counts

105 statements checked against the code: **86 VERIFIED, 7 FAILED, 12 NOT VERIFIABLE**.

FAILED: A22 (gzip size), A23 (OPEN-QUESTIONS 123 size and plant count), A31 (judgement labels), C5 (rule (l) and entered plants), C9 (rule (p) boundary), C12 (base-row wording), D18 (list plants have no availability date).

Also flagged, not in the records: seven behaviours for the owner, listed below.

Tests run: `node tests/only-tests.mjs 50` in `energy-strategy-tool/app`: 5 of 5 pass (50a to 50e, about 13 s). Not run: the browser test B43 (needs Chromium). Full Node suite not run.

Record counts (CLAUDE.md, "574 of 598"): run with the command given. Result 598 records, 574 with `confidence` C and not verified. Breakdown: 574 carry the label "indicative — unverified" (269 source-based, 283 judgement, 22 run settings); 24 carry "sourced — not independently checked". CLAUDE.md is correct.

## What the code does, in short

- `engine/defaults.js`: `PLANT_DEFAULTS` (line 401), `candidateFrom`, `plantCandidates` (line 473), `applyPlants` (line 513); `EXISTING_TYPES` and `EFF_RANGE` (lines 343 to 358).
- `engine/plants.js`: list, distance (`nearbyPlants`), merge (`mergeDuplicates`), value names (`xl:`, `xb:`, `tk:`).
- `engine/context.js` `ctxFor` (line 234): the takeover of a grid connection.
- `engine/sizing.js`: `plantUnits` (line 52), `plantEndMonth` (line 58).
- `engine/evaluate.js`: capex lines (line 149), ledger (lines 169 and 236 to 252), flags (lines 664 to 690).
- `engine/generator.js`: rules (l) to (p) (lines 118 to 135), `splitDomains` base rows (line 224), sampling (line 402).
- `engine/run.js`: flag `plants-found` (line 326). `report/report.js`: PDF section 1 (line 177). `components/PlantsField.jsx` and `InputsPanel.jsx`.
- `plant-data/build-plants.mjs` and `app/src/data/gas-plants.js`: 608 rows, commit 2889ad9, 79,319 bytes.

## Results by record

Status words: VERIFIED, FAILED, NOT VERIFIABLE. Evidence is given for each FAILED item.

### A. Defaults and data (BUILD-NOTES, BRIEF, OPEN-QUESTIONS, user guide, plant-data README)

| # | Record | Statement | Status | Evidence |
|---|---|---|---|---|
| A1 | BUILD-NOTES, BRIEF | Radius 10 km (`plants.radiusKm`) | VERIFIED | `defaults.js` line 402 = 10 |
| A2 | BUILD-NOTES, BRIEF | Smallest plant 50 MW (`plants.minMW`) | VERIFIED | line 403 = 50 |
| A3 | BUILD-NOTES | Merge within 1 km (`plants.mergeKm`) | VERIFIED | line 404 = 1 |
| A4 | BUILD-NOTES, guide ch.17 | Merge: same type, within 25 % in size (smaller at least 75 % of the larger) | VERIFIED | line 405 = 0.25; `mergeDuplicates` skips a pair when `min < 0.75 × max` |
| A5 | BUILD-NOTES, guide ch.17 | Closure 40 years after first year when the list has none (`plants.lifeYears`) | VERIFIED | line 406 = 40; `candidateFrom` uses `firstYear + lifeYears` |
| A6 | BUILD-NOTES | Refurbishment adds 10 years (`plants.buyExtraYears`) | VERIFIED | line 407 = 10; `endB = closeM + buyExtraYears × 12` |
| A7 | BUILD-NOTES, guide ch.17 | Lease €6/kW/month | VERIFIED | line 408 = 6 |
| A8 | BUILD-NOTES, guide ch.17 | Purchase €150/kW | VERIFIED | line 409 = 150 |
| A9 | BUILD-NOTES, guide ch.17 | Refurbishment €100/kW | VERIFIED | line 410 = 100 |
| A10 | BUILD-NOTES, guide ch.17 | Fixed O&M €25/kW/yr when bought | VERIFIED | line 411 = 25 |
| A11 | BUILD-NOTES, BRIEF, guide ch.17 | Takeover from 12 months after closure (`plants.takeoverLagMonths`) | VERIFIED | line 412 = 12; test 50b checks it |
| A12 | BUILD-NOTES, BRIEF, guide ch.17 | Takeover cost a quarter of the EHV rate, about €30k/MW against €120k/MW | VERIFIED | line 413 = 0.25; `connCapexPerMW_ehv` = 120,000 (line 562); 0.25 × 120,000 = 30,000 |
| A13 | BUILD-NOTES | Sample share 0.5 (`plants.sampleShare`) | VERIFIED | line 414 = 0.5 |
| A14 | BUILD-NOTES | Typical unit sizes 400 / 100 / 300 / 10 MW (CCGT, OCGT, steam, engines) | VERIFIED | lines 416 to 419 |
| A15 | BUILD-NOTES, guide ch.17 | Steam type default efficiency 38 % | VERIFIED | `EXISTING_TYPES.steam.eff` = 0.38 (line 352) |
| A16 | BUILD-NOTES, guide ch.17 | CCGT efficiency from the list only between 45 and 63 % | VERIFIED | `EFF_RANGE.ccgt` = [0.45, 0.63] (line 358) |
| A17 | guide ch.17 | Gas plants often run 25 to 40 years | VERIFIED | Text only. The code's judgement range for `lifeYears` is 25 to 45 (line 406), so the high end differs by 5 years; not a contradiction |
| A18 | BUILD-NOTES, README, guide ch.17 | 608 plants of 50 MW or more in the tool's countries | VERIFIED | `GAS_PLANTS.rows.length` = 608 and `count` = 608; countries: 27 codes |
| A19 | BUILD-NOTES, README | Commit 2889ad9 | VERIFIED | Header of `gas-plants.js`, `ref`, the URL and the script's `DEFAULT_REF` all give 2889ad9 |
| A20 | BUILD-NOTES, README | sha256 of the source file recorded | VERIFIED | Field `sha256` present; the script writes it. Not re-hashed against the source (no source file in repo) |
| A21 | README | Data file about 79 KB | VERIFIED | 79,319 bytes |
| A22 | BUILD-NOTES, WP19 | "about 15 KB gzipped" | FAILED | `gzip -c` of the file gives 23,057 bytes (about 23 KB). Record says about 15 KB |
| A23 | OPEN-QUESTIONS 123 | "about 48 KB (15 KB compressed) for the 626 gas plants of 50 MW or more" | FAILED | File is 79 KB, 23 KB compressed, and holds 608 plants. 626 is the source count before the country and position filter (research note) |
| A24 | research note | 626 gas plants of 50 MW or more; 302,301 records; 14,567 gas records; 13,950 German; 254.5 GW; 40 MB | NOT VERIFIABLE | Source CSV is not in the repo and was not downloaded |
| A25 | research note | 70 of the 626 have a closure year (`DateOut`) | VERIFIED | The bundled 608 hold 70 with `dateOut`. The 626 figure itself not verified (see A24) |
| A26 | research note, README | Didcot closed 2024, Hemweg closed 2019; Gersteinwerk first year 1917 (site's year) | VERIFIED | Bundled rows: Didcot `dateOut` 2024; Hemweg `dateOut` 2019; Gersteinwerk `dateIn` 1917 |
| A27 | research note | Eemshaven table: Eem 3,210 MW CCGT 1995 to 2030; Magnum 1,311 MW 2013; Delesto 523 MW 1987; Eemshaven 1,410 MW 1976; Eem 131 MW steam 1987 | VERIFIED | All five rows match the bundled list (Delesto about 13 km away, outside 10 km, which the research note allows for) |
| A28 | OPEN-QUESTIONS 123, BUILD-NOTES | Shipped in all three versions (Windows, single file, phone page) | NOT VERIFIABLE | The single-file HTML holds the list (two matches). Windows and phone builds were not built here. The app bundles the list through `plants.js`, so the same code runs in all three |
| A29 | README, BUILD-NOTES | No network at run time for the list | VERIFIED | The list is bundled. `fetch` in the app is only `weather-stations.json.gz` (App.jsx line 126). Only `build-plants.mjs` fetches |
| A30 | README | Release v0.9.1, dated 2026-10-07 | NOT VERIFIABLE | Outside the repo |
| A31 | OPEN-QUESTIONS 120, 121 | "All three 'judgement'" / "Both 'judgement', labelled" | FAILED | The basis is `judgement` for all WP19 defaults, but the registry label shown is "indicative — unverified" (for example `plants.radiusKm`, `plants.leasePerKWMonth`, `plants.takeoverCostFrac`, `plants.sampleShare`, `existing.types.steam.eff`). CLAUDE.md says a judgement record carries the label "judgement" with a reason. The labels and the records disagree |
| A32 | CLAUDE.md, record counts | "574 of 598" | VERIFIED | See Counts |

### B. Candidates, merging and corrections (BRIEF row, OPEN-QUESTIONS 116 to 119, guide ch.17)

| # | Record | Statement | Status | Evidence |
|---|---|---|---|---|
| B1 | BRIEF, OQ 117, ch.17 | Every gas plant of 50 MW or more within 10 km enters (on by default) | VERIFIED | `plants.auto` default true (line 1119); `nearbyPlants` with the two limits |
| B2 | OQ 118 | Duplicates merged, the engineer can split them | VERIFIED | `mergeDuplicates`, `edits[id].split`; PlantsField "Keep the merged entries apart" |
| B3 | ch.17, BRIEF | Each value editable; leave a plant out (`include: false`) | VERIFIED | PlantsField `edit()`; `candidateFrom` `include` |
| B4 | ch.17 | Each value shows where it came from (list, default, by type, entered) | VERIFIED | `basis` on every candidate; `BASIS` map in PlantsField and the flags |
| B5 | ch.17 | Table columns: distance, output, units, first year, closure, status | VERIFIED | PlantsField table headers |
| B6 | ch.17 | Closure: the list's year, else 40 years after first year; before analysis start counts as closed | VERIFIED | `candidateFrom` `closeYear`, `status`; test 50b |
| B7 | OQ 119 | Running or closure-announced plant offers all; closed plant offers its connection only | VERIFIED | `offersPower = include && status !== 'closed'`; test 50b |
| B8 | BUILD-NOTES | Eemshaven 1,410 MW entry closed by default in 2016, connection from 2028 | VERIFIED | Test 50b output: "closes 2016 (default), connection from month 12" with analysis start 2027-01 |
| B9 | ch.17 | Eemshaven: Eemscentrale 3,210 MW (2030), Magnum 1,311 MW (2013), 1,410 MW (1976), 131 MW steam | VERIFIED | Four entries within 10 km (test 50a) match these values |
| B10 | ch.17 | The 1,410 MW entry "may be an older listing of Eemscentrale (not checked)" | NOT VERIFIABLE | Judgement about external data; the record itself says not checked |
| B11 | BUILD-NOTES | Efficiency: list value used only inside a plausible range by type; else type value | VERIFIED | `candidateFrom` `effList`; test 50b asserts it |

### C. Choices and generation rules (guide ch.20, ch.34, BRIEF row C21, OPEN-QUESTIONS 119, 122)

| # | Record | Statement | Status | Evidence |
|---|---|---|---|---|
| C1 | guide ch.20 C2, C4; BUILD-NOTES | C2 and C4 gain `xl:` (lease) and `xb:` (buy) per plant offering power | VERIFIED | `applyPlants` and `plantPowerValues` |
| C2 | guide ch.20 C21; BRIEF C21 | C21 is "None" plus each nearby plant's connection that comes free within the study | VERIFIED | `plantTakeoverValues`, `offersTakeover` (test 50d) |
| C3 | BUILD-NOTES | C21 is n/a when islanded | VERIFIED | `isNA` case `C21` returns `v.C1 === 'islanded'` |
| C4 | BUILD-NOTES | Manual plant keeps `existing` for the lease; gains `xb:manual` and `tk:manual` with a closure year | VERIFIED | `candidateFrom` `values` for `manual`; `plantValue` |
| C5 | guide ch.34 rule (l) | "C2 or C4 = an existing plant is generated only for a plant that offers power (entered, or from the bundled list and not closed)" | FAILED | An entered plant with a closure year before the analysis start is not offered power. Checked: closure 2030 gives power and values `existing`, `xb:manual`; closure 2026 gives no power values (`offersPower` false, status "closed"), only the takeover. The rule text reads as if an entered plant is always offered |
| C6 | guide ch.34 rule (l) | One role per option, never bridging and firm plant from the same plant | VERIFIED | Rule (l) `fails`: same plant id on C2 and C4 |
| C7 | guide ch.34 rule (m) | Leased plant as bridging: "Remove" or "Retain as prime" only; never "Retained bridging plant" for C5; bought plant may be backup | VERIFIED | Rule (m) `fails`; C3 values `remove`, `prime` |
| C8 | guide ch.34 rule (n) | Firm existing plant: one C4 sizing, permanent shortfall where there is one, otherwise average | VERIFIED | Rule (n) `fails`; the generator's shortfall-to-average step (generator.js line 62) |
| C9 | guide ch.34 rule (p), guide ch.20 | "A plant's grid connection (C21) is generated only for a plant within reach whose closure falls within the study period, or that has closed" | FAILED | Code offers the takeover only when closure + 12 months is before the end of the period (`takeoverM < periodM`, defaults.js line 485 area). A plant closing in the last 12 months of the period is not offered. Test 50d shows Magnum (closes 2053, period ends 2047) excluded, which fits both readings. Minor boundary |
| C10 | BUILD-NOTES, guide ch.34 | "Choice key leaves C21 out while it is None; the seeded sample skips C21 while it has one value" | VERIFIED | `choiceKey` (generator line 183); `lhsSample` (line 393) |
| C11 | BUILD-NOTES | Base rows: plant values replaced by the first non-battery C2 value, C4 None, C21 None | VERIFIED | `splitDomains`: `rep2 = c2.find(x => x !== 'bessSolar')`; C4 and C21 `none` |
| C12 | guide ch.34 "Options with an existing plant" | Plant values replaced by "the first C2 value" | FAILED | Minor: the code skips "BESS + solar only" (`bessSolar`) when choosing the representative, so it is the first C2 value other than that one. BUILD-NOTES says "non-battery", which is nearer |
| C13 | guide ch.34, BUILD-NOTES | Test 50c: 1,140 = 1,140 on a small space | VERIFIED | Test 50c output: "128 base + 1012 plant combinations = brute force 1140" |
| C14 | guide ch.34 | Half of a sampled run kept for plant options, split equally between plants | VERIFIED | `share = floor(room × plants.sampleShare)`, split by `ids.forEach`; test 50c shares [73, 73, 74, 74] |
| C15 | BUILD-NOTES | Run flag "plants found" gives each plant's count | VERIFIED | run.js line 326; test 50e checks "combinations screened" |
| C16 | BUILD-NOTES | `plant.get(j)` and `plant.byPlant` store plant combinations compactly | VERIFIED | generator lines 323 to 349 |
| C17 | guide ch.34 | Eemshaven: about 500,000 combinations against about 52,000 without plants | NOT VERIFIABLE | Full run not done (the count run did not return within the session). The saved results in `studies/eemshaven/out` predate package 19 (52,023 combinations, no plant options) |
| C18 | BUILD-NOTES | Eemshaven 750 MW: 2,000 of 499,935 options, 994 with a plant, about 249 per plant | NOT VERIFIABLE | As C17 |
| C19 | BUILD-NOTES | Eemshaven leader "Grid + Eem (bought) bridge → retain as prime … Eemshaven's grid connection taken over", LCOE €139.6 against €158.9 without plants | NOT VERIFIABLE | Not re-run. The saved results (pre-package 19) show a leader LCOE of about €159 without plants, which fits the €158.9 baseline only |
| C20 | BUILD-NOTES | Canonical about 3 times faster | NOT VERIFIABLE | No benchmark run |

### D. Values, takeover, evaluation and ledger (BRIEF, OPEN-QUESTIONS 120 to 122, guide ch.35, ch.39)

| # | Record | Statement | Status | Evidence |
|---|---|---|---|---|
| D1 | BRIEF, OQ 120, guide ch.17 | Takeover size: full output, capped at the campus's need | VERIFIED | `ctxFor`: `mw = min(takeoverMW, need)`, `need` = peak design demand |
| D2 | OQ 120 | Takeover date 12 months after the plant stops | VERIFIED | `ctxFor` `month = max(0, closeM) + takeoverLagMonths`; test 50d (month 12) |
| D3 | OQ 120, BRIEF | Takeover cost: MW taken over × cost per MW; capex line "Grid connection charge (taken over from …)" | VERIFIED | evaluate.js line 149; test 50d checks the line |
| D4 | OQ 120 | Takeover flagged major as an assumed right | VERIFIED | evaluate.js line 687 (`major`, "not a confirmed right"); test 50d |
| D5 | BUILD-NOTES | Grid capex tornado driver moves the takeover line | VERIFIED | evaluate.js line 111 regex `^Grid (connection charge|cable route)` matches the line |
| D6 | BUILD-NOTES | Bridging hands over at the takeover month when the offered grid reaches full | VERIFIED | `ctxFor` `fullGridM`: first month from the takeover where the offered grid reaches full (or design load if less); only moves earlier; test 50d |
| D7 | BUILD-NOTES, OQ 121 | Bought plant: purchase plus refurbishment on units used; used until closure + 10 years; no replacement | VERIFIED | Test 50d (capex line amount, endMonth, no replacement) |
| D8 | guide ch.39 | Bought plant "no replacement, no value left" | VERIFIED | `removeYear` and `remainingFrac` make residual about 0. The code comment says "no value left", the salvage formula is applied and is about zero |
| D9 | BUILD-NOTES | Ledger stops an asset's replacements at the evaluation end | VERIFIED | evaluate.js line 240: `endYear = min(removeYear, N)` |
| D10 | OQ 121, guide ch.17 | Leased plant pays the lease until its closure | VERIFIED | Test 50d "lease months" |
| D11 | guide ch.35 | Same plant bought/leased and taken over: runs until connection is ready; flagged for a lease | VERIFIED | `plantEndMonth` (sizing line 60); evaluate.js line 680 flag; test 50d |
| D12 | OQ 122 | Bought plant is not in the campus combustion total; keeps own permit; common-ownership flag | VERIFIED | Test 50d (`permittingTriggers`); evaluate.js line 682 (`plant-ownership`) |
| D13 | OQ 122 | Bought plant may be the campus backup (C5) | VERIFIED | sizing.js lines 201 to 264 (retained branch for existing plant); rule (m) excludes only leased plant |
| D14 | OQ 122 | Its carbon is counted | VERIFIED | Scope 1 in evaluate.js line 326: fuel × emission factor for each plant in the dispatch |
| D15 | OQ 122 | Not drawn on the plan | VERIFIED | No `existingPlant` reference in `layout.js`, `blocks.js` or `sitefit.js` |
| D16 | OQ 122 | Gas-dependency flag applies | VERIFIED | evaluate.js `gasDependent` set for gas-fuelled bridge, prime or firm plant |
| D17 | guide ch.35, BUILD-NOTES | Sizing: units the need takes, up to the plant's own, no N+1 | VERIFIED | `plantUnits` (sizing line 52): `min(fixedUnits, need)` when `capUnits`; test 50d (1 of 13 units) |
| D18 | guide ch.35 | "It is available from the month entered, with no permitting allowance" | FAILED | Applies to the package 12 plant. A plant from the bundled list has no entered month: `availM` is 0, so it is available from the analysis start (defaults.js, `candidateFrom`: `availM: opts.availM || 0`). Not stated in the records |
| D19 | ch.17 flags, BUILD-NOTES | "plant-values" flag lists values and sources | VERIFIED | evaluate.js line 672 |
| D20 | BUILD-NOTES | Flag `plant-closes` when the plant stops within the period | VERIFIED | evaluate.js line 679; test 50d |
| D21 | BUILD-NOTES | Lease-only "plant-closes" text "keeps it running until then" | VERIFIED | Test 50d regex |
| D22 | guide ch.35 | Bought units priced at the units used | VERIFIED | Test 50d (amount = units × unitMW × (buy + refurb)) |

### E. Screens, PDF, study files, credit (BUILD-NOTES, guide ch.17, BUILD-PLAN)

| # | Record | Statement | Status | Evidence |
|---|---|---|---|---|
| E1 | BUILD-NOTES, guide ch.17 | Credit on screen in the toggle hint | VERIFIED | PlantsField `hint` includes `PLANT_SOURCE.credit`; B43 regex (not run) |
| E2 | BUILD-NOTES | Credit "on screen (section 4)" | NOT VERIFIABLE | Section numbering on screen not traced; B43 names "section 4" but was not run |
| E3 | BUILD-NOTES | Credit in the PDF (section 1) | VERIFIED | report.js line 168 ("1. Inputs") includes the plants heading and the credit (line 185) |
| E4 | BUILD-NOTES | Credit in the flags | VERIFIED | run.js line 327 and evaluate.js line 672 include `PLANT_SOURCE.credit` |
| E5 | guide ch.17 | "Open Correct … to change any value, untick to leave out, keep merged entries apart" | VERIFIED | PlantsField `<details>` "Correct …", include checkbox, split toggle |
| E6 | BUILD-NOTES | Study file keeps corrections keyed by list entry | VERIFIED | `studyFile` and `readStudyFile` round trip; test 50e |
| E7 | BUILD-NOTES | Without plants, options, ids and ranking unchanged; checked on T1 | VERIFIED in part | T1 (current code, no plants within 10 km of the T1 pin) gives 2,000 options and leader OP13Y1Y, as recorded. The comparison with `feature/weather-fixes` (the tornado and the ranking) was not re-run |
| E8 | BUILD-NOTES | T1 tornado identical to `feature/weather-fixes` | NOT VERIFIABLE | Not re-run |
| E9 | BUILD-NOTES | "Seen while testing": leader O1EC0IF9; earlier date gives a smaller bridging plant | NOT VERIFIABLE | Describes an earlier code state and a sample not kept |
| E10 | InputsPanel hint (not in the records) | Closure year: "the plant stops then (bought: 10 years later) and its connection is offered 12 months after it stops" | VERIFIED | InputsPanel line 222 matches the code (see C5 for the gap) |

### F. Plan, status and test records (BUILD-PLAN, STATUS, guide ch.56, 06-part6)

| # | Record | Statement | Status | Evidence |
|---|---|---|---|---|
| F1 | BUILD-PLAN package 19 | OPEN-QUESTIONS 116 to 123 all answered 2026-10-31 | VERIFIED | Rows 116 to 123 in OPEN-QUESTIONS.md are answered with that date |
| F2 | BUILD-PLAN package 19 | Acceptance: Node test 50 (50a to 50e) in `app/tests/plants-tests.mjs` | VERIFIED | The file has 50a to 50e; all pass (see Tests) |
| F3 | BUILD-PLAN package 19 | User guide chapters 17, 34, 35, 39 and 56 | VERIFIED | Chapters exist (`03-part3a.md` ch.17, `04-part4a.md` ch.34 and 35, `04-part4b.md` ch.39, `06-part6.md` ch.56) |
| F4 | STATUS line 80 | Chapters 17, 20, 34, 35, 39, 56 | VERIFIED | As F3, plus ch.20 |
| F5 | STATUS line 80 | Branch from `feature/weather-fixes`, not merged | VERIFIED | `feature/weather-fixes` is an ancestor; `git branch --merged main` does not list `feature/existing-plant` |
| F6 | STATUS line 80 | Verification not yet run | NOT VERIFIABLE | Process statement; this report is that check |
| F7 | guide 06-part6 status row | "Work package 19 … Built (31 Oct 2026) … 17, 20, 34, 35, 39" | VERIFIED | Row present in `06-part6.md` line 160 |
| F8 | guide 04-part4b | Two new ledger rows: bought plant; grid connection taken over | VERIFIED | Rows at lines 22 and 23 match D7, D3, D9 and D8 |
| F9 | guide 03-part3a | Chapter 17 section headers and defaults (lines 151 to 167) | VERIFIED | Covered by A1 to A16, B1 to B11 |
| F10 | guide 03-part3a | Toggle "on" by default and the 608-plant statement | VERIFIED | `plants.auto` default true; A18 |

## Behaviour the records do not mention (for the owner)

1. **A manual plant with a closure year before the analysis start loses its power options.** Only its takeover remains (C5). The record says an entered plant is offered. Check the closure year before entering it.
2. **A list plant is available from the analysis start.** There is no availability date for list plants, so a list plant can serve as bridging from month 0 (D18). The records describe an availability date only for the package 12 plant.
3. **Any correction, include or split change resets C2, C4 and C21 to their defaults.** `PlantsField.jsx` `resetChoices()` runs on every edit, and the toggles in `InputsPanel.jsx` reset C2 and C4. A chosen plant option is lost without a message.
4. **The takeover boundary (C9).** A plant closing in the last 12 months of the study is not offered its connection; rule (p) says "closure within the period".
5. **The WP19 defaults are labelled "indicative — unverified", not "judgement"** (A31). The basis is judgement, which is what CLAUDE.md asks for, but the label shown in the registry is different.
6. **The Eemshaven plant figures are not reproduced** (C17 to C19). The saved Eemshaven results predate package 19.
7. **Test 50e checks "study without plants unchanged" only by absence of plant options**; the unchanged ranking rests on the T1 check (E7).

## Items needing the owner's decision

- Items 1 and 3 change what the engineer sees. Decide whether an entered plant closed before the start should be offered its power, and whether corrections should keep the chosen C2, C4 and C21.
- Item 2 changes the first-day availability of every list plant. Decide whether list plants need an availability date (default: analysis start).
- Item 5 (label): decide whether WP19 judgement defaults should carry the label "judgement" with a reason.

## Records that need correcting (no edits made here)

- `brief-v2/OPEN-QUESTIONS.md` row 123: size and count (A23).
- `app/BUILD-NOTES.md` WP19: "about 15 KB gzipped" (A22).
- `docs/user-guide/src/04-part4a.md` rule (l) text (C5), rule (p) text (C9), and "first C2 value" (C12); `03-part3a.md` and `04-part4a.md` availability for list plants (D18).
- `app/src/engine/generator.js` line 134 detail text for rule (p) (C9).
