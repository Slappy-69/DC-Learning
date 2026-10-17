# H1 claims verification: site slice (BUILD-NOTES section 10, commit 4f386b7)

Date: 2026-10-17. Mechanical checks only. No app source, test or document file was changed. `npm run build` and `npm run test:browser` were not run. `dist/` was only read (test 7), and its hashes were the same before and after the test run. The repository has no uncommitted changes after these checks.

- App: /home/claude/build/app. Its src/ and tests/ are identical to commit 4f386b7 (`diff -rq` empty). BUILD-NOTES.md is identical too.
- Baseline: /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/baseline60fe41a/energy-strategy-tool/app. Identical to `git archive 60fe41a` (`diff -rq` empty). It has no node_modules, and the engine imports no packages, so none was needed.
- Node v22.22.0, 2 CPU cores.
- Scripts and outputs: /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/s1/ (section 8).

## Summary

| ID | Check | Status | Evidence |
|---|---|---|---|
| 1 | `node tests/run-tests.mjs` | VERIFIED | Exit 0. "31/31 tests passed". 31 PASS, 0 FAIL. T1 run 10.88 s, T3 13.03 s. No timing threshold failed, so no second run was needed. Section 1. |
| 2a | Engine diff stat; dispatch.js and generator.js unchanged | VERIFIED | `git diff --stat 60fe41a 4f386b7 -- energy-strategy-tool/app/src/engine/`: 16 files, 2596 insertions, 36 deletions. dispatch.js and generator.js: 0 diff lines between the two commits, and unchanged in the working tree. Section 2. |
| 2b | scoring.js, sizing.js, evaluate.js: each change and its BUILD-NOTES reason | VERIFIED | 8 changes. Each has a stated reason (BUILD-NOTES lines 727 to 729, 732 to 734, 737 and 738), and each reason matches the diff. Section 2. |
| 3 | Baseline comparison, T1 and T3, matched by option id | VERIFIED | 2000 of 2000 ids matched in both engines. Every T1 and T3 figure in BUILD-NOTES lines 753 to 766 reproduces. One definition needs stating ("17 above 1 %", section 3). T1: score changed 2000 (max 0.0740), rank 804 (max 7), LCOE 685 (fill-residual options only), leader 85.964 to 85.963. T3: rank 719 (max 19), leader 70.891 to 70.892. Section 3. |
| 4 | Independent layout invariants, T1, T2, T4 | VERIFIED | 0 violations. Requested sample: 40 options per fixture (top 20 plus 20 seeded others). Extra: all 2000 options of each run, and a fourth fixture with a hard easement, a soft flood zone and a hard structure that makes a hole (8000 layouts in the all-option passes). Negative controls raised 440 and 36 violations. Section 4. |
| 5 | AC7 on T2 | VERIFIED | 11 of 11 archetype options are "Does not fit", each with a named shortfall (A1: 54,999 m2). C17/C18 notes are in `generation.valuesNotGenerated` and rendered at RunSummary.jsx:51 to 56. With C17 GIS and C18 double-deck included (196,996 combinations, 2000 screened, sampled): 1998 "Does not fit", 2 "Fits with flags", 0 "Fits". One wording error in BUILD-NOTES line 822 (section 5). Section 5. |
| 6a | Site-fit status change alone (penalty off) changes no score or rank | VERIFIED | Noise threshold 45 to 60 dB(A), with a receptor present: 685 statuses change (Fits with flags to Fits). 0 scores, 0 ranks, 0 raw axis metrics and 0 layout changes. Section 6. |
| 6b | Literal check: halve the site area only. Statuses change, but no score or rank should | FAILED | Area 15 to 7.5 ha: 986 statuses change (all 2000 options end "Does not fit"), 2000 scores change (max 0.181), 1237 ranks change (max 17). Cause: site area sizes the fill-residual ground PV (sizing.js:372 `applySolarFill`, called at run.js:148). Only the 685 fill-residual options change raw metrics (0 others), but the normalised scores of all options move. Section 6. |
| 6c | Positive control: with the penalty on, the same status change moves scores | VERIFIED | 1998 scores and 1943 ranks change, so check 6a would detect a score change. Section 6. |

Summary line: 9 rows. VERIFIED 8, NOT VERIFIED 0, FAILED 1 (6b). Test suite 31/31, exit 0.

## 1. Test suite (check 1)

Command: `cd /home/claude/build/app && node tests/run-tests.mjs`. Started 07:54:07, finished 07:56:52, exit code 0. Output: s1/test-run-1.txt.

All PASS lines (the millisecond figure is the test's own):

PASS 1 (5257 ms), 2 (1517), 3 (8), 4 (105), 5a (11743), 5b (0), 5c (1452), 5d (0), 6a (38), 6b (11), 6c (42186), 6d (12047), 6e (41), 7 (2400), 8a (82), 8b (141), 8c (29), 8d (980), 8e (14), 8f (450), 8g (306), 8h (38), 9a (9), 9b (272), 9c (106), 9d (23247), 9h (3993), 9e (2026), 9f (10028), 9g (3271), 9i (693).

FAIL lines: none. Final line: "31/31 tests passed."

- Timing: "T1 run: 2000 options screened ... in 10.88 s", "T3 run: 2000 options in 13.03 s". BUILD-NOTES lines 834 and 837 quote 10.68 s and 11.08 s. No threshold failed.
- Test 7 reads dist/energy-tool-single-file.html and dist/worker.js (run-tests.mjs:597 to 600). Their hashes were the same before and after the run. The files are dated 07:50:15, and I did not produce them. Test 7 does not check that dist/ matches the current source.

## 2. Engine changes (checks 2a and 2b)

2a. `git diff --stat 60fe41a 4f386b7 -- energy-strategy-tool/app/src/engine/` lists 16 files: blocks.js, context.js, defaults.js, evaluate.js, geometry.js, index.js, layout.js, pareto.js, run.js, runlog.js, scoring.js, site.js, siteapi.js, sitefit.js, sizing.js, view.js. dispatch.js and generator.js are not in the list. `git diff 60fe41a 4f386b7 -- .../dispatch.js .../generator.js` gives 0 lines, and `git diff --quiet 4f386b7` for both gives no change in the working tree.

2b. Changes to the three named files. Every change is in the diff (`git diff -U2`), and I found no other hunks.

| File (line in 4f386b7) | Change | BUILD-NOTES reason (quoted) | What the run shows |
|---|---|---|---|
| scoring.js:65, 73 to 85 | S1. New `siteRank()`. `markDominance()` lets option j dominate option i only if j's site-fit rank is at least as good. | Line 727: "Reason: §7.2 step 6, 'Pareto-dominated … AND no better resilience or site-fit status'; the core slice compared resilience only because site fit did not exist." | Dominated: T1 1950 to 1947, T3 1910 to 1895, as line 727 says. A mark only; no score or rank changes. |
| scoring.js:117, 121, 135, 139 | S2. `DEFAULT_VIEW.siteFit` and `landTakeCeilingHa`, with `applyView()` filters and chips. | Line 728: "Reason: §11 'the user can filter the view by site-fit status … or land-take ceiling'. View only: filters never change a score or rank (tests 4, 8h, 9g)." | View only. |
| scoring.js:172 to 173 | S3. `SORTERS.landTake` and `SORTERS.siteFit`. | Line 729: "View only." | View only. |
| sizing.js:222 to 231 | Z1. Area budget reads the site model's gross, envelope and net areas when `ctx.site` is set. | Line 732: "Reason: §5.2 derived areas. For the T1/T3 area rectangle with a uniform setback the two give the same numbers, so the pre-layout estimate did not change." | Verified. Net developable area is identical to the old rectangle formula for all 2000 options in T1 and T3 (largest difference 0 m2, compare-baseline-result.json, `netM2`). |
| sizing.js:285 | Z2. "fill residual" sentence reworded. | Line 733: "Reason: it is replaced by step 3." | Text only. |
| sizing.js:372 to 383 | Z3. New `applySolarFill()`, called from run.js:148 after the layout. | Line 734: "Reason: §10.4 'fill residual' solar sizing is computed after the other blocks are placed. No other sizing depends on layout." | The only sizing that depends on layout. It is the source of every raw-metric change in section 3 and of the 6b result. |
| evaluate.js (line 487 in 60fe41a) | E1. `site-area-budget` info flag removed. | Line 737: "Reason: replaced by the layout-based site-fit flags (§15). It was info severity, so it never entered deliverability." | No reference left in src/ (grep). The old flag had no `permitting`, and deliverability counts only permitting flags (evaluate.js:516 to 517). |
| evaluate.js:492, 527 to 533 | E2. `deliverability(…, siteFit)` with an optional penalty, off by default. | Line 738: "Reason: §9.9 optional site-fit penalty, §11 label. With the penalty off the formula is the baseline's, item for item (test 9g checks all 2,000 T1 options with site fit real, removed and scrambled)." | Penalty off: deliverability changes only for the 353 fill-residual options in T1 and in T3, and for no other option (section 3). |

Other changed engine files, for completeness: defaults.js changed only the `viewRec` signature (new `briefRef` argument) and the notes of `site.roadsFraction` (value still 0.15) and `deliverability.siteFitPenalty` (value still false). No value changed, as BUILD-NOTES line 605 says. run.js: `ENGINE_VERSION` '0.1.0-core' to '0.2.0-site' (line 25), the layout stage (lines 110 to 161), site-fit flags (line 238) and deliverability with the site-fit result (line 248). pareto.js, runlog.js, view.js, index.js and context.js changed as BUILD-NOTES line 567 describes.

## 3. Baseline comparison (check 3)

Method: `run-fixture.mjs` runs `runModel` from each engine's `src/engine/index.js` on `referenceT1({analysisStart:'2027-01'})` and `referenceT3(...)` with the default seed. Baseline and current run in separate processes. `compare-baseline.mjs` matches options by id. Per-option data: base-T1.json, cur-T1.json, base-T3.json and cur-T3.json.

| Quantity | BUILD-NOTES, T1 | Observed, T1 | BUILD-NOTES, T3 | Observed, T3 |
|---|---|---|---|---|
| Options matched by id | 2000 | 2000 (0 missing either way) | 2000 | 2000 (0 missing either way) |
| Fill-residual options (C10 = roofResidual) | 685 | 685 | 685 | 685 |
| Ground PV MWp changed | 685; −1.50 to +1.24; mean −0.06 | 685; −1.50 to +1.24; mean −0.058 | 685; −1.61 to +1.70; mean −0.07 | 685; −1.61 to +1.70; mean −0.073 |
| LCOE changed | 685, all fill-residual; largest 0.12 % (line 757) | 685, all fill-residual; largest 0.118 % (OZ5IAWA, 0.1803 EUR/MWh) | 685, all fill-residual; 73 above 0.1 %, 17 above 1 %; largest 0.61 to 0.86 EUR/MWh | 685, all fill-residual; 73 above 0.1 %; 17 above 1 % if the change is divided by the larger of the two values (21 if divided by the baseline value); largest 0.6099 to 0.8608 EUR/MWh (OXIAFLB, ground PV 0.569 to 1.152 MWp) |
| Capex changed | 685; largest 1.2 % | 685; largest 1.214 % | 685; largest 2.3 % | 685; largest 2.254 % |
| Carbon metric changed | 685 | 685 | 685 | 685 |
| Deliverability changed | 353 | 353, all fill-residual | 353 | 353, all fill-residual |
| Time-to-power changed | 0 | 0 | 0 | 0 |
| Other 1,315 options identical on LCOE, capex, carbon, deliverability, time-to-power | yes | yes (0 changes) | yes | yes (0 changes) |
| Weighted score changed | 2000; largest 0.074 | 2000; largest 0.0740 (ODEYGI1) | 1999; largest 0.015 | 1999; largest 0.0146 (OH6YUJM) |
| Rank changed | 804; largest 7; top 20 unchanged (line 764) | 804; largest 7 (OV4Y3AG); top 20 same set and same order | 719; largest 19 | 719; largest 19 (O1XSH9N1); top 20 same set, order changed (section 7) |
| Leader | O1YAUJ8J 85.964 to 85.963 (line 765) | O1YAUJ8J 85.964 to 85.963 | O1Q4ILX5 70.891 to 70.892 | O1Q4ILX5 70.891 to 70.892 |
| Distinct dispatch runs | 1732 to 1769 (line 766) | 1732 to 1769 | 1721 to 1748 | 1721 to 1748 |
| Dominated options | 1950 to 1947 (line 727) | 1950 to 1947 | 1910 to 1895 | 1910 to 1895 |
| Net developable area (sizing.js Z1) | identical (line 732) | 0 changes, largest difference 0 m2 | identical | 0 changes, largest difference 0 m2 |

Result: every T1 and T3 figure in BUILD-NOTES reproduces. The only point that needs a definition is "17 above 1 %" (section 7, item 4).

## 4. Layout invariants (check 4)

Checker: s1/layout-check.mjs. It imports only the engine: `runModel` (src/engine/index.js) and `layoutForOption` (src/engine/siteapi.js). It imports nothing from the app's tests/ folder. Its geometry is written in the script: point in ring, ring distance with a closed-set tolerance of 1e-6 m, Sutherland-Hodgman clipping of each footprint against the envelope and against each hard exclusion (areas), and axis-aligned overlap tests. Polygons come from the engine's site model: `site.envelope.regionUV` (outer ring minus holes) and `site.exclusions` with `hard` true. The 20 "other" options are drawn with mulberry32(20261017) from ranks 21 to 2000.

Checks: (a) no two placed footprints overlap; (b) every placed block's four corners lie inside the envelope and outside every hard exclusion, and the area of each footprint outside the envelope or inside a hard exclusion is about zero; (c) an unplaced block means status "Does not fit", a shortfall above 0, and a flag that names the blocks; (d) "Fits with flags" names at least one relaxed rule or flag. Extra: each footprint equals its block's width and height (either way round); each block is placed or unplaced exactly once; solar-fill cells do not overlap blocks, lie in the envelope and are outside hard exclusions; the run's site-fit result and `layoutForOption` agree.

| Fixture | Sample (40 options, requested) | All options of the run (extra pass) | Violations (sample / all) |
|---|---|---|---|
| T1, 2000 options | 28 Fits, 12 Does not fit. 640 blocks, 5,267 pairs, 2,560 corners. 12 options with unplaced blocks (84 blocks), smallest shortfall 2,400 m2. No "Fits with flags" option in the sample. | 963 Fits, 23 Fits with flags, 1,014 Does not fit. 38,525 blocks, 372,935 pairs, 154,100 corners. All 1,014 "Does not fit" options have unplaced blocks (6,378 blocks), smallest shortfall 1,440 m2. 23 of 23 "Fits with flags" options name a rule or flag. Largest area outside the envelope 4.8e-12 m2. | 0 / 0 |
| T2, 2000 options | 40 Does not fit. 372 blocks, 1,605 pairs, 1,488 corners. 40 with unplaced blocks (307 blocks), smallest shortfall 12,000 m2. | 2000 Does not fit. 17,517 blocks, 71,586 pairs, 70,068 corners. 2000 with unplaced blocks (27,386 blocks), smallest shortfall 12,000 m2. | 0 / 0 |
| T4, 2000 options | 17 Fits, 23 Does not fit. 174 blocks, 301 pairs, 696 corners. 23 with unplaced blocks (36 blocks), smallest shortfall 300 m2. | 272 Fits, 6 Fits with flags, 1,722 Does not fit. 8,895 blocks, 16,331 pairs, 35,580 corners. 1,722 with unplaced blocks (3,134 blocks), smallest shortfall 200 m2. 6 of 6 "Fits with flags" options name a rule or flag. | 0 / 0 |
| Extra: T1 with a hard easement (25 m strip), a soft flood zone (40 m strip) and a hard structure (30 m square, which makes a hole) | 17 Fits, 6 Fits with flags, 17 Does not fit. 592 blocks, 4,358 pairs, 2,368 corners. 48 blocks in the soft zone, each with a named soft rule. | 224 Fits, 495 Fits with flags, 1,281 Does not fit. 34,960 blocks, 308,448 pairs, 139,840 corners. Smallest gap from a block to a hard exclusion 0.89 m (no overlap). 495 of 495 "Fits with flags" options name a rule or flag. | 0 / 0 |

The default T1, T2 and T4 have one envelope polygon, no holes and no exclusions. So the exclusion and hole parts of (b) are exercised only by the extra fixture. Their results (0 m2 inside a hard exclusion) are not a test of the default fixtures.

Negative controls (same script, injected faults; s1/layout-check-mutant.mjs):
- MUTANT=1: the first block moved 5 km east, and the second block placed on top of the first. T1 sample: 440 violations, including "(a) overlap … 6,875.000 m2" and "(b) corner … outside the envelope".
- MUTANT=2: every "Does not fit" option reported as "Fits". T1 sample: 36 violations, including "(c) … unplaced block(s) but status Fits", "(d) status Fits but a relaxed rule … is present" and "run vs layoutForOption differ".

So the zero counts are not vacuous for (a), (b), (c) or (d). Limit: the envelope and the exclusion polygons are the engine's own. I checked blocks against them, not the setback offset or the exclusion geometry.

## 5. AC7 on T2 (check 5)

Script: s1/ac7-t2.mjs (output s1/ac7-t2-output.txt). T2 = `referenceT2` (T1 on 6 ha with a 15 m height limit), with defaults (C17 AIS and C18 single-deck only).

Archetype options (one per archetype, 11 in total):

| Archetype | Option name | Status | Shortfall (m2) | Blocks not placed |
|---|---|---|---|---|
| A1 | Grid · Diesel N+1 · Air | Does not fit | 54,999 | 3 (Data hall 2, 3 and 4 of 4) |
| A2 | Grid · HVO N+1 · Air · PPA hybrid 100 % | Does not fit | 54,999 | 3 |
| A3 | Grid · HVO N+1 · Air · PV 4.1 MWp · BESS 4 h | Does not fit | 66,999 | 8 |
| A4 | Grid · Gas CHP-trigen · HVO N+1 · Air · BESS 2 h | Does not fit | 92,279 | 11 |
| A5 | Grid + gas recips bridge, retained-plant backup, Air | Does not fit | 76,599 | 9 |
| A6 | Islanded gas recips, retained-plant backup, Air, PV 4.3 MWp, BESS 4 h | Does not fit | 94,599 | 16 |
| A7 | Grid · HVO N+1 · Air · PV 4.1 MWp · BESS 4 h · PPA hybrid 100 % | Does not fit | 66,999 | 8 |
| A8 | Grid · Fuel cells · HVO N+1 · Air | Does not fit | 65,079 | 10 |
| A9 | Grid · BESS-augmented UPS + reduced N+1 · Air · PPA hybrid 100 % | Does not fit | 54,999 | 3 |
| A10a | Grid · SMR · HVO N+1 · Air | Does not fit | 54,999 | 3 |
| A10b | Grid · Hydrogen · HVO N+1 · Air | Does not fit | 83,799 | 11 |

Named shortfall, A1 (flag text): "Does not fit: Data hall 2 of 4 (phase 2) (18,333 m²); Data hall 3 of 4 (phase 3) (18,333 m²); Data hall 4 of 4 (phase 4) (18,333 m²); area shortfall 54,999 m² (land take 9.10 ha vs 4.28 ha net developable)". All 2000 T2 options are "Does not fit".

C17 and C18 notes in the run data (`generation.valuesNotGenerated`):
- C17: doesNotFit 2000, note "2,000 options do not fit; GIS reduces substation footprint."
- C18: doesNotFit 2000, note "2,000 options do not fit; double-deck and in-building arrangements reduce genset footprint."
- Rendered by RunSummary.jsx:51 to 56 (`c.doesNotFit ? 'sub site-note'`).

Including C17 and C18 (set as test 9f does: C17 open with [AIS, GIS], C18 open with [single, double]): 196,996 combinations, 2000 screened (sampled). Status: 1998 Does not fit, 2 Fits with flags, 0 Fits. All 2000 options are listed with ranks 1 to 2000, and none is hidden by the default view.
- Rank 5, O1QXJXIC, "Grid · HVO N+1 · DLC · PPA hybrid 100 %": C17 GIS, C18 single, C13 hybrid. Four relaxed rules: data halls 1 to 4 of 4, each 16 m against the 15 m limit.
- Rank 109, O156F15W, "Grid · HVO N+1 · DLC": C17 GIS, C18 double, C13 none. The same four relaxed rules.

Wording error: BUILD-NOTES line 822 says both fitting options are "DLC with a PPA hybrid". O156F15W has no PPA (C13 = none). The rest of line 822 is correct: 2 of 2000 sampled, DLC, halls above 15 m. Not checked: the same line's remark that locking cooling to DLC gives more fitting options.

## 6. Site-fit independence (check 6)

Script: s1/site-indep.mjs (output s1/site-indep-output.txt and s1/site-indep-result.json). T1 with the penalty off (its default). Options matched by id.

Changes made, in memory only (no file changed):
- V1: `site.areaHa` 15 to 7.5, nothing else.
- Receptor: one receptor, "Dwelling (test)", at lat 52.29, lon -1.5251, 100 m east of the boundary. It is needed because T1 has no receptor by default, so the noise flag cannot fire.
- A to B: `requirements.noiseNightDbA` 45 to 60 only.
- Aon and Bon: as A and B, with `deliverability.siteFitPenalty` true.

| Comparison | Status changes | Scores changed (max) | Ranks changed (max shift) | Raw metrics changed (of which non-fill) | Solar MWp changed | Layout or land take changed |
|---|---|---|---|---|---|---|
| V0 to V1: area 15 to 7.5 ha, penalty off (literal check) | 986 (963 Fits to Does not fit; 23 Fits with flags to Does not fit); all 2000 end Does not fit | 2000 (0.181) | 1237 (17) | 685 (0) | 685 | 2000 |
| A to B: noise 45 to 60 dB(A), penalty off (status-only change) | 685 (Fits with flags to Fits) | 0 | 0 (0) | 0 (0) | 0 | 0 |
| Aon to Bon: noise 45 to 60 dB(A), penalty on (positive control) | 685 | 1998 (2.194) | 1943 (178) | 685 (452) | 0 | 0 |
| V0 to A: add the receptor only, penalty off | 1020 | 2000 (0.056) | 427 (7) | 547 (0) | 547 | 1043 |
| A to Aon: penalty off to on, same site with receptor | 0 | 1998 (4.813) | 1972 (331) | 2000 (1315) | 0 | 0 |

Verdicts:
- 6a, VERIFIED. A site-fit status change alone, with the penalty off, changes no score, no rank, no raw metric and no layout.
- 6b, FAILED as worded. Halving the site area changes statuses (as expected) and also changes scores and ranks. The path is the sizing path, not the site-fit status. Area sets the fill-residual ground PV (applySolarFill). That changes capex, LCOE, carbon and deliverability for the 685 fill-residual options only (non-fill raw metrics unchanged), and the min-max normalisation then moves every option's normalised score. BUILD-NOTES lines 769 to 770 name these two causes. Line 771 states the narrower claim, "Site-fit status itself changes no score or rank (penalty off)", and 6a confirms it.
- 6c, VERIFIED as a control. With the penalty on, the same status change moves 1998 scores and 1943 ranks, so the 6a comparison can detect a score change.

## 7. Other findings (not claim rows)

1. BUILD-NOTES line 822 wording: O156F15W has no PPA (section 5).
2. T3 top 10: ranks 4 and 5 swap (O1EQ82QV and OMDIQOD), and rank 10 changes (OQKRTJ7 to OAS6AIL). The top 20 set is unchanged. BUILD-NOTES states "top 20 unchanged" only for T1 (line 764), so this is not a contradiction, but the T3 order change is not reported.
3. Pre-existing, and the same in both engines: the T3 baseline has 80 options with negative LCOE and 26 with non-finite LCOE. The lowest is O1JH89J6 at −13,767,284 EUR/MWh in both engines. This is not introduced by the slice. I did not analyse its effect on the cost axis.
4. BUILD-NOTES line 757, "17 above 1 %": reproduced when the change is divided by the larger of the two values, or by the current value. Divided by the baseline value, the count is 21. The definition is not stated in BUILD-NOTES.
5. Timing: T1 10.88 s and T3 13.03 s in this run, against 10.68 s and 11.08 s in BUILD-NOTES (lines 834 and 837). No test failed on time.

## 8. Scripts and outputs

Directory: /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/s1/

- test-run-1.txt: check 1 output.
- head-60fe41a/ and head-4f386b7/: `git archive` copies (read only), used for the diffs.
- run-fixture.mjs, base-T1.json, cur-T1.json, base-T3.json, cur-T3.json: check 3 runs.
- compare-baseline.mjs, compare-baseline-result.json: check 3 comparison. investigate-t3.mjs and lcoe-thresholds.mjs: the T3 top-10 and LCOE-threshold checks in section 3 and section 7.
- layout-check.mjs, layout-check-run2.txt, layout-check-result.json: check 4 (final run). layout-check-mutant.mjs: the negative-control copy of the checker (the MUTANT=2 control, as the file now stands). mutant-result.json: MUTANT=1 output, from a run made before its injection was switched off in the file. mutant2-result.json: MUTANT=2 output.
- ac7-t2.mjs, ac7-t2-output.txt, ac7-fitting-v.mjs: check 5 (ac7-fitting-v.mjs prints the choices of the two fitting options).
- site-indep.mjs, site-indep-output.txt, site-indep-result.json: check 6.

Summary: 9 rows. VERIFIED 8 (1, 2a, 2b, 3, 4, 5, 6a, 6c). NOT VERIFIED 0. FAILED 1 (6b, the literal halved-area claim). Test suite 31/31, exit 0.
