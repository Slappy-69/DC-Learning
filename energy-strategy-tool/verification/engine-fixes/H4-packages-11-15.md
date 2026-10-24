# H4 engine verification: work packages 11 to 15 (dispatch, existing plant, layout, archetypes, study files)

Verifier: Claude Haiku 5.5 (independent verifier, H4). Date: 2026-10-24.
Scope: `app/BUILD-NOTES.md`, sections "Work package 11", "Known issue 19" and "Work package 12–15"; `brief-v2/OPEN-QUESTIONS.md` rows 27 and 68–85; `docs/KNOWN-ISSUES.md` items 1–20; `docs/BUILD-PLAN.md` packages 11–15 (through the code and tests they name, not item by item); the user guide chapters dated 24 October 2026 (`docs/user-guide/src/*.md`); the code those name; tests 35–42.
Repository: no file changed except this report. No git command, no push, no network. The line for `verification/HISTORY.md` is left for the lead, because the brief limits changes to this report.

## What I checked and how

- Read the code: `dispatch.js` (firm-plant loop, step 4b PPA displacement, dispatch years), `evaluate.js` (time-to-power, bridge steps, rental, ledger and `addCapex`, flags, resilience), `sizing.js` (hire rule, retained phasing, fixed existing units), `generator.js` (rules a to o, archetypes), `run.js` (layout decision, slices, truncation), `scoring.js` (score, view filters, sorters), `study.js`, `defaults.js` (existing plant, settings, normalisation), `permitting.js`, `cards.js`.
- Scripts in `/tmp/claude-0/-home-claude/95f78427-fc73-53b2-b6d4-6b1291b2d70a/scratchpad/h4/` (listed at the end, with their logs). The status words in the script logs are the scripts' own expectations. The statuses in this table are my judgement.
- Full runs made by my scripts: four (T1 reference; the T1 run with the existing plant, made twice; the Pego case once). The repository test modules 35 to 42 ran through a harness, and they make their own runs. About 40 small runs were made with choices locked to a few options each. Every run includes the 11 archetypes, which are generated whatever the choices.
- `npm test`, `npm run build` and `npm run test:browser` were not run.

## Results

Status counts: 33 VERIFIED, 15 FAILED, 7 NOT VERIFIED (55 rows)

| ID | Check | Status | Evidence (numbers; file:line) |
|---|---|---|---|
| OQ68 | Time-to-power = delay of first power + delay of full load + half the gap ÷ design MW; first power = later of supply and phase 1 | VERIFIED | T1, 2,000 options recomputed: max difference 0, 0 mismatches. First power before building 1 or before supply: 0. On time with no gap (metric 0): 1,604 of 2,000; 90th percentile 6.3 months; max 69.65 months. `evaluate.js:23–70` (metric at `:67`) |
| OQ69 | Rented bridging hire month = max(earliest arrival, first need − rentalLeadMonths) | VERIFIED | 368 rented options (81 islanded), all hired later than they could arrive; 0 hire months differ from the rule (lead 1 month). `sizing.js:404–419` |
| OQ70 | Retained bridging plant bought in steps with the buildings | VERIFIED | 246 options with phased retained plant; owned units short of need at a building date: 0; steps off building dates: 0; fleet below the last phase's need: 0. `sizing.js` ~190–210 |
| OQ71 | Explicit dispatch years = first year starting after the last change, within the cap; truncation flag | VERIFIED | Explicit years equal the years needed on every option. Max years needed 11; one option needs more than 8 (it was cut under the old cap of 8). Truncation flags at the default: 0. `dispatch.js:138–156`; `run.js` ~215 |
| OQ72 | Minimum stable load: no hour imports from the grid while output is curtailed | VERIFIED | T1: 382 options with firm plant, 23,424,240 hours; 0 violations. `dispatch.js` firm loop ~345–397 |
| ENERGY-BAL (T1) | Hourly balance: re + PPA + discharge + firm + grid + grid charge + unmet = net + charge + curtailment + export | VERIFIED | Max |error| 5.7e-14 MWh over 23,424,240 hours. Hourly sums equal the year totals (0 mismatches). PPA delivered + undelivered = contract (0 mismatches) |
| ENERGY-BAL (existing plant) | The same balance on the run with the existing plant | VERIFIED | 446 options with the existing plant, 27,348,720 hours; max |error| 2.8e-14 MWh; 0 back-off violations; 0 PPA-curtailment violations; 0 sum or ID mismatches (`t5.log`) |
| OQ77 (KNOWN-ISSUES 19) | PPA displaced by plant at its minimum: no hour takes PPA energy while output is curtailed | VERIFIED | T1: 0 such hours; 156 options displace 51,898 MWh. Test 38: 60 options, 3,679,200 hours, 0 violations, 17,874 MWh displaced. Existing-plant run: 178 options with displaced volume, 0 violations. `dispatch.js:399–418` |
| LEDGER | LCOE, NPV and capex from one ledger | VERIFIED | T1, 2,000 options: LCOE and NPV rebuilt from the ledger rows, 0 mismatches; capex lines equal ledger capex (0 mismatches); inspector re-run for 22 options, 0 differ. Existing-plant run, 446 options: 0 mismatches. `evaluate.js:105–117` (`addCapex`) |
| OQ75 | Entered network adder used, and escalated like grid energy | VERIFIED | Test 35: adder 55 → 80 €/MWh raises LCOE 165.8 → 190.8 (25 €/MWh on all grid energy). Test 36: PPA adder escalated (×1.267 in year 8 at 3 % a year) |
| OQ76 (KNOWN-ISSUES 1, 2, 3, 8, 9) | The five small fixes | VERIFIED | Item 1: OQ71 row. Item 2: test 36. Item 3: test 36 (export 1,080 MWh with the multiplier at 1.5 applied). Item 8: test 37 (opex shown for the first year with load). Item 9: OQ68 row (no first power before month 18 on T1) |
| OQ73 | Gas-dependency flag only when plant that does not burn gas cannot cover the critical load | VERIFIED | Test 36: 405 options flagged; 1,361 with gas plant not flagged because non-gas plant covers the critical load. `evaluate.js` resilience (~493). The HVO tonnage on the Seveso count was not recomputed (see the not-verified list) |
| OQ74 | Recovery period after every event, kept as built | NOT VERIFIED | Decision recorded; not checked in code or runs |
| OQ78 | Existing plant off unless ticked; never generated when not entered | VERIFIED | Test 39: plant ticked without a unit size gives no options and the flag "ticked but not generated". Rule (l) fails when nothing is entered (EDGE-L) |
| OQ79, rules (l) and (m) | Rules as worded | VERIFIED | EDGE-L: 4 vectors agree (not entered; entered; both roles; firm only). EDGE-M: 7 vectors agree (remove and prime pass; backup, split, grid services and retained fail; other plant passes). `generator.js` rules l and m |
| OQ80 | Exactly the units offered, with no N+1 added | VERIFIED | EDGE-E1: 1 unit entered gives 1 bridging unit, 40 MW. EDGE-E3b: 2 units entered give 2 firm units, 80 MW. `sizing.js:120, 131, 162` (fixed units); `sizing.js:47` (fixed-units note) |
| OQ81 | Lease paid by the month, from a month before need | VERIFIED | Code: `sizing.js:404–419` (bridging) and the firm rule after it (~423). EDGE-E1: availability month 12, lease from month 23, one month before month 24 (the need, inferred from the same rule). I did not check the sentence text |
| OQ82 | Plant outside the campus: own consent, own gas, outside the campus IED aggregation, not drawn on the campus | VERIFIED | Test 39 assertions (outside the IED aggregation; no ground block named after the plant). `defaults.js:343–346` (ownConsent, offsite and lease true); `blocks.js` returns early for offsite plant |
| Rules (g) and (n) | Exactly one C4 sizing for existing plant | VERIFIED | EDGE-NG: 12 cooling and grid-strategy combinations, one sizing each |
| Existing-plant T1 run | 141 as bridging, 305 as firm, of 2,000; cheapest #493 at €139.2/MWh, 300.8 g/kWh | VERIFIED | `t1.log` (current figures; see the notes rows below) |
| OQ83 | Layout on demand above the work limit, with the run flag | VERIFIED | T1 work 0.95 million block² (laid out in full). Pego work 135.4 million (on demand; flag text present). `run.js:146–155`. Test 40: limit forced down, scores, ranks and flags unchanged |
| OQ83 | Worker slices take the same layout decision | FAILED | EDGE-SL: 12 options in 2 slices; work estimates 2,700 and 2,970 against 2,835 for the full run. With the limit at 2,835, slice 0 lays out and slice 1 does not. `run.js:146–150` |
| OQ84 | Archetypes take the open cooling type with the lowest design load | VERIFIED | All 11 archetypes immersion (111.0 MW; air 136.7 MW). Two adequate: A5 at rank 217, A8 at rank 1217. `generator.js` (`archetypeVector`, ~275); `t1.log` |
| OQ85 | Identical options marked; rule (o) collapses C9 with no rooftop solar | VERIFIED | 4 identical marks (870 = 869, 1101 = 1100, 1134 = 1133, 1161 = 1160). Rule (o) removed 24,168 combinations on T1. `generator.js:116` |
| Rule (o) claim: heat rejection location "changes no result outside the Site tab" (`04-part4a.md:230`; KNOWN-ISSUES 5) | FAILED | EDGE-O: for options without rooftop solar, LCOE, capex, carbon, time-to-power, deliverability and flags do not change between roof and ground. The score changes by up to 0.065 points (fuel cells 50.448 against 50.383), because the carbon axis range is set by an islanded option with rooftop PV, whose PV size depends on C9. Land take differs (roof 9.16 ha, ground 10.06 ha), as the Site tab should show. `scoring.js:35–48` |
| Land-take ceiling on a run that was not laid out | FAILED | EDGE-LT: with a 100 ha ceiling, 1 of 3 options stays (one was not laid out, one had no site fit). PEGO-LT: 0 of 2,000 options visible under a 1,000 ha ceiling; the only sign is a chip. `scoring.js:159` |
| OQ27 | Save and reopen a study; round trip | VERIFIED | EDGE-SF2: reopened inputs hash to the saved value (656156fb89527ced). PEGO-SF: 10,035 bytes; re-read file compares as the same. `study.js:20–50, 84–96` |
| OQ27 | Wrong files refused with a reason | VERIFIED | EDGE-SF1: 6 wrong files (invalid JSON, no schema, other schema, newer schema, no inputs, empty inputs) refused with the stated reason. `study.js:64–72` |
| OQ27 | Unknown key inside inputs | FAILED | EDGE-SF3: the key changes the hash, so reopening reports "the tool's defaults or engine have changed" although no default changed. `study.js:30, 88–94` |
| OQ27 | A whole section set to null | FAILED | EDGE-SF4: a file with `grid` set to null is accepted; `normalizeInputs` then fails with "Cannot read properties of null (reading 'fullDate')". `study.js:64–81` |
| `study.js:4`: "null = at default" | FAILED | EDGE-SF5: true for `grid.nowMW` (null → 0, which is the global default) and for the gas price (the same run result). False for `site.areaHa` (null stays null; default 15). The area was not run |
| Guide, front page and `01-part1.md:130`, `04-part4b.md:395`: "out of 57,028 possible combinations" | FAILED | T1 run: 48,340 combinations (`t1.log`; BUILD-NOTES 1874 says 48,340). 57,028 is the count before work package 14 |
| Guide `04-part4a.md:660`: "1,537 of T1's 2,000 options power every building on time with no gap" | FAILED | 1,604 options with metric 0 in the current run (`t1.log`) |
| Guide `04-part4a.md:394`: "350 rented options are hired later than they could arrive" | FAILED | 368 (OQ69 row) |
| Guide `04-part4a.md:507`: T1 work "about 1 million" | VERIFIED | T1: 0.95 million (test 40). The Pego figure is in the next row |
| Guide `04-part4a.md:507`: Pego "about 105 million" | FAILED | Product run with product-equivalent Pego inputs: 135.4 million (`t3.log`) |
| BUILD-NOTES 1864: "Pego on the product with the existing-plant input: 16 s, leader … €141.1/MWh" | FAILED | Product run with inputs rebuilt from `patch.py`: 12.2 s; leader €144.19/MWh; carbon 236.4 g/kWh; capex €995 m. The difference is not explained by the repository (finding M-4) |
| BUILD-NOTES 1859–1860 (WP13 table): T1 1,650 layouts; "Pego (product inputs)" 1,433 sets | FAILED | T1: 1,626 distinct layouts (`t1.log`). Pego: 1,311 sets (`t3.log`) |
| BUILD-NOTES 1851 (WP12): 112 as bridging, 311 as firm; cheapest €142.7/MWh; rank 25 on carbon, 188 g/kWh | FAILED | The same inputs now give 141 and 305; cheapest €139.2 (#493), 300.8 g/kWh, carbon rank 251 among existing (`t1.log`). Stale, and not marked as superseded |
| BUILD-NOTES 118: "57,024 valid combinations (57,028 …)" | FAILED | Stale (before work package 14). Current: 48,340 |
| BUILD-NOTES 1874 (T1 after work package 14): 48,340; 1,604 adequate; leader OP13Y1Y | VERIFIED | `t1.log` |
| Guide `04-part4a.md:657`: metric example, "0.5 × 24.9 ÷ 113.07 = 0.11 months late" | VERIFIED | Arithmetic gives 0.110. The inputs are not tied to a run |
| Guide `04-part4b.md:47`: rented plant €12/kW/month | VERIFIED | `defaults.js` rentalPerKWMonth 12 (`t1.log`, RATES) |
| Guide `04-part4b.md:21`: connection "25 (none if handed back)" | VERIFIED | Life: `evaluate.js:186` passes 0 when handed back, so the asset is not tracked (`evaluate.js:110–111`). The capex is charged in year 1 both when handed back and when kept (8,000,000 in both; `t4-link.mjs`). Wording only (finding L-6) |
| Guide `04-part4a.md:253`: archetype cooling | VERIFIED | Immersion (OQ84 row) |
| Guide `04-part4b.md:434`: "about 66 months late plus the gap term" (options without firm plant) | NOT VERIFIED | The level fits: T1 options without firm plant show 69.65 months (`t1.log`). The split between delay and gap was not recomputed |
| KNOWN-ISSUES header "All 20 items are resolved"; rows 4 to 7 | VERIFIED | Row 4 and 5 fixed in work package 14; rows 6 and 7 resolved on 2026-10-23 (OQ 26 and OQ 20). The grep of the other "Fixed" rows agrees |
| KNOWN-ISSUES row 20: "Pego runs in 16 s" | NOT VERIFIED | Product run on this machine: 12.2 s. Time depends on the machine |
| KNOWN-ISSUES row 5: "T1: 4 identical marks" | VERIFIED | 4 marks now (OQ85 row). The "instead of 37" was not re-run |
| `studies/pego-rev3/README.md:14`: "The app has no 'existing plant' type (KNOWN-ISSUES 12)" | FAILED | Out of date since work package 12: the product has the existing plant (`defaults.js:343`; test 39) |
| WP11 claims "1,176 hours" and "6,352 hours" on the old code | NOT VERIFIED | Old code not run. Test 38 prints 6,352 as the pre-fix count |
| Tests 35 to 42 (eight modules, through the harness) | VERIFIED | 0 failed. `npm test` not run. Weaknesses are in finding L-10 |
| `permitting.js:36–40` (`runM3`) against the belly-tank allowance at `sizing.js:217, 305` | NOT VERIFIED | Code reading only; not run (finding L-11) |
| `cards.js`: `asGoodShare` ≤ `PRO_SHARE` (0.1) | NOT VERIFIED | Not checked |
| Site tab kept as Beta: hidden by default, labelled, outside the ranking and the PDF (CLAUDE.md rule) | NOT VERIFIED | Not checked |

## Findings

### High

None. The dispatch, the energy balance, the back-off and PPA rules, the ledger, the flag-only rule and the study round trip all hold on the runs made. The findings below concern claims, reproducibility and two behaviours.

### Medium

**M-1. A land-take ceiling hides every option on a large campus, with no explanation.**
- What: when a run is not laid out, `siteFit` is skipped, and `applyView` keeps only options with a site fit. On the Pego run a 1,000 ha ceiling leaves 0 of 2,000 options, and the only sign is the chip "Land take ≤ 1000 ha".
- Where: `app/src/engine/scoring.js:159`; the sorter at `scoring.js:192` puts skipped options last with Infinity.
- Fix: when a ceiling is set and options are not laid out, either lay out the options that pass the other filters on demand (the Site tab already does this for the options it shows), or keep them visible with the note "N options not laid out, so the ceiling cannot be applied". Sort skipped options as a group with a note.

**M-2. The rule (o) claim is not exact.**
- What: rule (o) and its text say the heat rejection location "changes no result outside the Site tab" when there is no rooftop solar. Cost, carbon, time-to-power, deliverability and flags do not change. The score does, by up to 0.065 points (fuel cells 50.448 against 50.383). The carbon axis range (`scoring.js:39–48`) takes its maximum from an islanded option with rooftop PV, and that option's PV size depends on C9 (roof area). Rank did not change in this 12-option run, but it could where two scores are within about 0.07 points.
- Where: `generator.js:116`; `docs/user-guide/src/04-part4a.md:230`; KNOWN-ISSUES row 5.
- Fix: either reword the claim ("changes no cost, carbon, time or flag; the score moves by under 0.1 point through the run's ranges"), or take the axis ranges from options that do not depend on C9. Rooftop options that do change with C9 are correct: their PV size depends on the roof area.

**M-3. Figures in the user guide are out of date.**
- What: the front page and two other places say 57,028 combinations (now 48,340); chapter 4 says 1,537 options are on time (now 1,604), 350 rented options are hired late (now 368), and the Pego layout work is about 105 million (now 135.4 million on the product, with the layout not run and its "9 minutes" not measured).
- Where: `docs/user-guide/src/00-front.md:93`; `01-part1.md:130`; `04-part4a.md:394, 507, 660`; `04-part4b.md:395`.
- Fix: update each figure from the run, with its date, following `docs/user-guide/README.md`.

**M-4. The Pego figures in the study and the notes cannot be reproduced from the product, and the repository has no product input for them.**
- What: BUILD-NOTES 1864 says the product gives 16 s and €141.1/MWh for Pego. The product run I made, with inputs rebuilt from `studies/pego-rev3/patch.py`, gives 12.2 s, €144.19/MWh, 1,311 layout sets and 135.4 million layout work. The study build adds CCGT records to C2 and C4, puts the firm top-up from 2031 (the product has one availability date for both roles), and offers gas recips in C4 (the product default does not). `referencePego` exists only in the study patch, so nobody can rerun the product figure from the repository. My rebuilt inputs may still differ from the author's, which I cannot check.
- Where: BUILD-NOTES 1851–1864; `studies/pego-rev3/patch.py` lines 44–76; `app/src/engine/defaults.js:207` (C4 default).
- Fix: store the Pego case as a study file (WP15 format) in `studies/pego-rev3`, rerun it on the product, and state in the report which figures come from the study build. The owner decides which Pego figure goes into the report.

### Low

**L-1. Worker slices can take different layout decisions near the limit.**
- What: each slice estimates the work from its own options, scaled to the whole list. On a 12-option run the estimates were 2,700 and 2,970 against 2,835 for the full run. With the limit at 2,835, one slice lays out and the other does not. The Pego run is far from the limit (135 million against 20 million), so the practical risk is small.
- Where: `run.js:146–150`; BUILD-NOTES 1862 says every worker decides alike.
- Fix: compute the work once for the whole option list, and pass the decision to each worker.

**L-2. Unknown keys in a study file change the input hash.**
- What: `normalizeInputs` keeps keys it does not know, and the hash includes them. A reopened study then reports that the defaults or engine have changed.
- Where: `study.js:30, 88–94`.
- Fix: hash only the registry paths, and warn about unknown keys.

**L-3. A study file with a section set to null is accepted, then fails with an unclear message.**
- What: `readStudyFile` checks only the top level. `normalizeInputs` then throws "Cannot read properties of null (reading 'fullDate')".
- Where: `study.js:64–81`.
- Fix: check that each section is an object, and that the key types are right, before accepting the file. Name the section in the message.

**L-4. `study.js:4` says null means "at default", which is true for some fields and not others.**
- What: `grid.nowMW` defaults to null (not known) and normalises to 0, which matches. The gas price normalises to null but the run gives the same result as the default. `site.areaHa` stays null, with a default of 15 (not run).
- Where: `study.js:4`; `defaults.js` (`resolveUnknowns`, ~972).
- Fix: resolve null per field in `normalizeInputs`, or correct the comment.

**L-5. Options not laid out sort last with Infinity when sorted by land take.**
- What: sorting by land take on a large run gives no land-take order.
- Where: `scoring.js:192`.
- Fix: show such options as a group labelled "not laid out".

**L-6. Connection capex wording.**
- What: the guide's "25 (none if handed back)" describes the asset life. The capex is charged in year 1 both when handed back and when kept (8,000,000 in both). Whether the link has any value after handback is a question for the owner.
- Where: `docs/user-guide/src/04-part4b.md:21`; `evaluate.js:186, 110–111`.
- Fix: reword the cell to "life: none when handed back (capex still charged)". Ask the owner about the link's value after handback.

**L-7. Stale figures in the notes.**
- What: BUILD-NOTES 118 (57,024), 1851 (WP12: 112/311, €142.7, rank 25, 188 g/kWh), 1859–1860 (1,650 layouts; 1,433 Pego sets; "about 9 minutes") and the 1,537 figures at 1803 and 1831 are not marked as superseded. KNOWN-ISSUES row 20 says "Pego runs in 16 s"; the run here took 12.2 s.
- Fix: mark each as superseded, or update it.

**L-8. The study README is out of date.**
- What: `studies/pego-rev3/README.md:14` says the app has no existing-plant type. That has been true only until work package 12.
- Fix: update the README, and say which study figures need the study build.

**L-9. The existing plant has one availability date for both roles.**
- What: bridging and firm use the same date. The study used 2028 for bridging and 2031 for the top-up. The lease rule (month of need, less one) gives the same cost pattern here, but the product cannot state two dates.
- Fix: note it as a limit for reproducing the study, or add a separate date for firm top-up if the owner wants one.

**L-10. Test weaknesses.**
- What: test 42's "changed default" case changes the saved hash only, not a default. Its older-file assertion message is inverted ("filled defaults change the result" asserts equality). Test 39 checks rule (n) for one cooling variant only. Test 36's gas-flag assertion repeats the formula, so it cannot fail.
- Fix: change a real default through a patched module, fix the message, cover every cooling type with shortfall and average sizing, and test the gas flag with a constructed option.

**L-11. `runM3` may leave out the belly-tank allowance (code reading only).**
- What: `permitting.js:36–40` counts the fuel of bridging and prime plant, but not the belly-tank allowance that the standby store uses (`sizing.js:217, 305`). The Seveso fuel tonnage for those plants may be understated. Not run.
- Fix: include the same allowance, or document why it is excluded.

**L-12. Two comments do not match the code.**
- What: `layout.js` says fill solar is sized from the layout; it feeds site fit only (`sitefit.js:296`). `run.js:126` repeats the error. No effect on results.
- Fix: reword the two comments.

## Summary

- Status counts: 33 VERIFIED, 15 FAILED, 7 NOT VERIFIED (55 rows)
- High findings: 0. Medium findings: 4 (M-1 to M-4). Low findings: 12 (L-1 to L-12).
- The engine's dispatch, energy balance, back-off, PPA displacement, ledger and flag-only rules hold on every run made. The existing-plant and archetype rules hold as worded, with the exception of rule (o)'s score effect.
- The main risks are in claims and reproducibility: the guide's figures, the rule (o) wording, the Pego figures from the study build, and the land-take filter on a large campus.

## Not checked

- `npm test`, `npm run build`, `npm run test:browser`, the packaging checks, and BUILD-PLAN acceptance tests item by item.
- OQ74 (recovery period), the Seveso tonnage for HVO, the belly-tank allowance (code reading only), `cards.js` pro rules, and the Site tab's Beta rules (hidden by default, labelled, outside the PDF).
- The 9-minute layout time in the guide, the "16 s" in KNOWN-ISSUES row 20, and the WP11 hour counts on the old code.

## Scripts

All in `/tmp/claude-0/-home-claude/95f78427-fc73-53b2-b6d4-6b1291b2d70a/scratchpad/h4/`:

- `t1-checks.mjs` (log `t1.log`, JSON `t1-checks.json`): T1 reference run, OQ68–72, 77, 84, 85, energy balance (T1), ledger, flags, the existing-plant T1 run, and the harness for tests 35–42 (`t1.log`: 8 tests, 0 failed).
- `t2-edges.mjs` (log `t2.log`): first edge-case set. Some results there were wrong: the archetypes were taken as the generated options, and the study null check used the T1 example values. `t2b-fix.mjs` (log `t2b.log`) corrects them and supersedes those rows.
- `t2c-defaults.mjs`: null handling against the global defaults, and the null gas-price run.
- `t3-pego.mjs` (log `t3.log`, JSON `t3-results.json`): the islanded firm-plant sizing key and the Pego product run.
- `t4-link.mjs`: connection capex for a plant handed back and one kept.
- `t5-balance.mjs` (log `t5.log`, JSON `t5-results.json`): hourly balance, back-off and PPA displacement on the existing-plant run.
