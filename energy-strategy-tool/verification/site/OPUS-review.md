# Opus review: site slice (H1 claims, H2 brief, H3 browser, orchestrator O1–O5)

Date: 2026-10-17. Reviewer: Opus. Scope: the three Haiku reports in this folder (`H1-claims.md`, `H2-brief.md`, `H3-browser.md`, all read in full), the H3 screenshots, and the orchestrator findings O1–O5, judged against `/home/claude/build/brief-v2/BRIEF.md` (read only) and the code in `/home/claude/build/app`.

- Every changed file was copied first to `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/site-review-backup/original/` (whole `src/`, `tests/`, `BUILD-NOTES.md`, `SITE-PROGRESS.md`, `build.mjs`, `package.json`, `index.html`).
- No git command was run. Dispatch (`dispatch.js`) and the generator logic are unchanged (one generator note text changed, D25).
- Comparison runs: `scratchpad/review/snap.mjs` and `cmp.mjs`, snapshots in `scratchpad/review/snaps/` (`orig-*` = engine before the review, `g1-*` after group 1, `g2-*` after group 2).
- Progress log for a resumed run: `/home/claude/build/app/REVIEW-PROGRESS.md`.

## 1. Result in brief

- **75 findings judged: 40 accepted, 12 rejected, 23 deferred** (H1 8, H2 requirement rows that are not IMPLEMENTED 28, H2 deviations 28, H3 6, O1–O5 5). Six more problems were found during the review (section 3).
- Main changes: the phone layout puts results first (O1); the site-fit wording and test 9g now say exactly what the status does and does not change (O2); the Site tab no longer scrolls sideways at 1400 or 1000 px (O3); a "Skip to site plan" link (O4); B9 asserts a bound (O5); the POC sets the grid cable route and the gas main a gas pipe cost (I07b, I08b); "Rank requirement-compliant options first" covers "Does not fit" (D9); four literals became §18 records or a record is now read (D4, D5, D6), and rooftop PV sizing uses the roof-plant rule of the block (D8).
- Economics: T1 leader unchanged (O1YAUJ8J, 85.9634 → 85.9642), top 20 unchanged in set and order, 141 ranks move by at most 2. T3 unchanged in every number (no grid, no gas main). Section 5.
- Tests: `npm test` 32/32 (31 before; new 9j), `npm run test:browser` 21/21 (18 before; new B19–B21). Section 6.

## 2. Decisions

Decision words: **accepted** (the finding holds and was acted on, or it is a correct verification that needs nothing), **rejected** (the finding does not hold as stated; no change, or a smaller one), **deferred** (it holds, but it is not done now; recorded in BUILD-NOTES with the reason).

### 2.1 H1 (claims)

| ID | Finding | Decision | Reasoning | What changed |
|---|---|---|---|---|
| H1-V | Rows 1, 2a, 2b, 3, 4, 5, 6a, 6c VERIFIED (31/31 tests; 8,000 layouts, 0 violations; baseline reproduces) | accepted | Correct checks; nothing to fix. | — |
| H1-6b | Halving the site area changes 2,000 scores and 1,237 ranks (FAILED as worded) | rejected | By the brief: §10.4 sizes "fill residual" solar after the other blocks are placed, so area moves 685 options' costs and carbon, and §11's relative scale moves every score. The defect is the wording "no effect on any score or rank". | Fixed under O2 (wording, test 9g). |
| H1-822 | BUILD-NOTES says both fitting AC7 options have a PPA; O156F15W has none | accepted | Checked: O156F15W is "Grid · HVO N+1 · DLC", C13 none, double-deck. | Open point 3 corrected (both options named). |
| H1-T3 | T3 top-20 order change not reported | accepted | Reproduced (ranks 4/5 swap, rank 10 changes). | Comparison table states it. |
| H1-LCOE | T3: 80 negative and 26 non-finite LCOEs (pre-existing) | deferred | Valid and worse than noted: the T3 cost axis puts 1,844 options within 0.004 points, so cost does not separate them. Cause: near-zero delivered energy plus a net revenue from financially settled PPA (−€947 m on OAG1IBQ). Core economics and a brief-level choice (§9.5, §11), outside this slice. | Open point 10, Brief issue 21, with the options for the owner. |
| H1-17% | "17 above 1 %" undefined | accepted | Reproduced: change ÷ larger value gives 17, ÷ baseline 21. | Definition added to the comparison table. |
| H1-time | T1 10.88 s / T3 13.03 s vs 10.68 / 11.08 s in the notes | accepted | Load-dependent; no threshold. | Recorded in the review test run. |
| H1-dist | Test 7 does not check that `dist/` matches the source | accepted | True. A hard check on file times would fail on fresh checkouts, so it is reported, not asserted. | Test 7 prints whether the build is newer than the newest source file. |

### 2.2 H2 requirement rows that are not IMPLEMENTED

| ID | Row | H2 | Decision | Reasoning | What changed |
|---|---|---|---|---|---|
| R01 | §10.1 boundary polygon(s) | PARTIAL | deferred | Multi-parcel needs a multi-region envelope and layout; recorded (judgement 19). | Listed as a stage 2 gap. |
| R06 | §10.1 gas main: connection cost | PARTIAL | accepted | See I08b. | Gas pipe cost. |
| R13 | §10.2 underlay | DEFERRED | deferred | Stage 2 content, not built. | Re-filed under stage 2 gaps. |
| R14 | §10.2 online tiles | DEFERRED | deferred | Stage 7. | — |
| R15 | §10.3 every technology as blocks | PARTIAL | deferred | Carport (K01) and heat reuse (R22b) blocks missing; see those rows. | — |
| R16 | §10.3 configurable row/column arrangement | PARTIAL | deferred | Changeable in the registry only; no library value is editable in the UI yet (§6 "editable per project"; D28, open point 7). | Listed under "no stage in §20". |
| R22b | §10.4 heat reuse plant block | DEFERRED | deferred | Heat reuse is not sized or costed (C15 locked None), so there is nothing to place. | Re-filed under stage 2 gaps. |
| R24 | §10.4 step 2.8 solar in soft exclusions | PARTIAL | rejected | See D2. | — |
| R29–R31 | §10.5 manual editing (drag, keyboard, saved layouts) | DEFERRED | deferred | Stage 7. | — |
| R41 | §10.7 2.5D massing | DEFERRED | deferred | Stage 7 (optional). | — |
| R42 | §10.7 pinned small multiples | PARTIAL | deferred | Pinning does not exist yet. | Stage 2 gap. |
| I01 | §5.2 boundary "none", R | PARTIAL | rejected | See D20. | — |
| I04 | §5.2 soft exclusions for solar only | PARTIAL | rejected | See D2. | — |
| I07b | §5.2 POC drives cable-route length for cost | MISSING | accepted | Well defined by §5.2 and §5.4 ("cable route cost per km from the POC"). Route = straight line from the POC to the nearest buildable point, where the layout anchors the substation; site-only, so the same for every option and unaffected by an unplaced block. | `site.routes.pocM`, `sz.grid.cableKm`, capex, sentence; fixed `tech.substation.cableKm` (1.0 km) removed; test 9j. |
| I08b | §5.2 gas main drives connection cost | MISSING | accepted | Small: the same route rule × a new labelled rate, only for options that burn gas on site, nothing when no gas main is given (the default). | `tech.gasConnection.pipePerKm` (€0.8 m/km, indicative — unverified), "Gas connection pipe" capex line, sentence; test 9j; Brief issue 20. |
| I09b | §5.2 access point drives the roads allowance | MISSING | deferred | No rule: §5.2 defines the allowance as 15 % of net area. (Fuel-delivery placement toward the access point, which the orchestrator also named, is built: H2 I09a.) | Stage 2 gap; Brief issue 19. |
| I11 | §5.2 allowance base | PARTIAL | rejected | See D14. | — |
| S02 | §5.3 roof plant from the heat-rejection footprint where larger | PARTIAL | accepted | See D8. | Fixed. |
| S03 | §5.3 building footprint override | DEFERRED | deferred | Stage 2 content, not built. | Re-filed under stage 2 gaps. |
| U02 | §11 compliant-first covers site fit | PARTIAL | accepted | See D9. | Fixed. |
| F01 | §15 flag fields | PARTIAL | deferred | See D24. | — |
| F04 | §15 Permitting: stack above height limit | PARTIAL | rejected | Verifier error: `permit-stack` (evaluate.js, category Permitting, `permitting: true`) exists since the core slice and counts in deliverability; the site-fit height check adds stacks per zone. | Open point 5 corrected (it repeated the same mistake). |
| F06 | §15 wind not generated on ≤ 20 ha (info) | PARTIAL | rejected | A run-level fact (no option has wind), shown as the run flag `tech-wind-default` and on the C11 row; a copy on 2,000 options adds nothing. | — |
| T02 | §17 site edit → layouts ≤ 1.0 s | PARTIAL | deferred | Not met (recorded); §20 stage 7 performance tuning. | Listed under stage 7. |
| T03 | §17/AC11 screen-reader walk-through | MISSING | deferred | Belongs to the stage 7 accessibility audit (orchestrator). | Listed under stage 7. |
| K01 | §6.2 carport PV block | MISSING | deferred | The parking allowance is a budget, not a located area (judgement 5), so a carport has no position; C10 "Roof + carport" is not generated by default. Making the allowance a located area would change every layout. | Stage 2 gap; the plan table now says carport PV is not drawn and why; block notes (also the in-building plant room note, which was never shown) appear under the table. |

### 2.3 H2 deviations

| ID | H2 verdict | Decision | Reasoning | What changed |
|---|---|---|---|---|
| D1 | AMBIGUOUS (height soft) | accepted (behaviour kept) | No clear brief text requires a hard test; a hard test makes AC7 impossible on T2 and contradicts §15's "height limit exceeded" flag and principle 5. | Brief issue 18 records the reasoning; judgement 11 points to it. |
| D2 | CONFLICTS (L4 lets any block use soft cells) | rejected | §15's "block in soft exclusion" flag only exists if a non-solar block can be placed in one, and §10.4 step 5 makes that a named relaxation ("Fits with flags"). H2's "fixed solar included" is wrong: fixed MWp ground PV is a fill and follows `site.softUsableBySolar`. | Record note corrected (it claimed "off = hard" for every block); the soft-solar info text says other blocks use soft cells only as a flagged relaxation. |
| D3 | CONFLICTS (BESS minima without test data) | accepted (difference recorded) | §10.4 step 5 relaxes separations to a minimum; the app has no test-data input, so the condition is stated where the relaxation shows. | Flag, reasons and plan table: "a BESS separation below the §6.3 default needs UL 9540A test data or a fire-rated barrier"; deviations table. |
| D4 | CONFLICTS (0.9 power factor literal) | accepted | §18. | `spatial.substation.mvPowerFactor` read by sizing and blocks; 9c changes it. |
| D5 | CONFLICTS (double-deck record unread) | accepted | §18; wired rather than removed, because sizing needed a record anyway. | Sizing and blocks read `spatial.genset.doubleDeckFootprintFactor` (positions = ceil(units × factor)); identical results at 0.5; 9c changes it. |
| D6 | CONFLICTS (SMR 10 m, L:W 1.5 literals) | accepted | §18. | `spatial.smr.clearanceM`, `spatial.smr.lw`; 9c. |
| D7 | CONFLICTS (no carport block) | deferred | See K01. | — |
| D8 | CONFLICTS (roof plant: sizing 40 %, blocks max) | accepted | §5.3 says derive from the footprint where larger. | Sizing uses the same max as the block; bit-identical results on T1–T4 (40 % governs); 9c exercises the footprint case. |
| D9 | CONFLICTS (compliant-first ignores site fit) | accepted | §11 names "Does not meet" or "Does not fit" next to the toggle; §5.7 calls both requirement checks. Toggle is off by default, so no default output changes. | `isRequirementCompliant()`; pick line names the failing check; RunSummary, Pareto note, toggle hint and record note say so; 8g has a site-fit case and its real-data assertion was widened (it asserted resilience as the only reason). |
| D10 | CONFLICTS (default POC without road data) | accepted (recorded) | Unavoidable offline; judgement 6. | — |
| D11 | CONFLICTS | accepted | See I07b. | — |
| D12 | CONFLICTS | accepted | See I08b. | — |
| D13 | CONFLICTS | deferred | See I09b. | — |
| D14 | AMBIGUOUS (allowance base) | rejected | The brief's definition is circular; judgement 5 stands. | — |
| D15 | CONFORMS | accepted (observation recorded) | Placed blocks only, as §9.2 says. | Deviations table. |
| D16–D19 | CONFLICTS (deferrals filed under stage 7) | accepted | Correct: underlay, heat reuse blocks and the building override are stage 2; exports stage 6. | Deferred list re-filed by §20 stage. |
| D20 | CONFLICTS (starts with a 15 ha example) | rejected | Every required input is pre-filled with the T1 example and marked "required · example value" (core decision); the boundary default stays `null`. | — |
| D21 | AMBIGUOUS (wind count from spacing) | rejected | Consistent with principle 5 (buffers flagged, not used to resize); recorded (core line 120, judgement 12). | — |
| D22 | CONFORMS | accepted | — | — |
| D23 | CONFLICTS (stack category) | rejected | Verifier error, see F04. | Open point 5 corrected. |
| D24 | CONFLICTS (flag fields) | deferred | True of every flag in the app; values are in the messages; the flags register and its input links are §20 stage 6. | Stage 6 in the deferred list. |
| D25 | CONFORMS (stale generator note) | accepted | Text only, no logic. | Note text fixed. |
| D26 | CONFORMS | accepted | — | — |
| D27 | AMBIGUOUS (one boundary) | deferred | See R01. | — |
| D28 | AMBIGUOUS (spatial values in the UI) | deferred | Open point 7 (library page). | — |

### 2.4 H3 (browser)

| ID | Finding | Decision | Reasoning | What changed |
|---|---|---|---|---|
| H3-V | Suite 18/18, own checks pass, axe 0 violations | accepted | Correct. | — |
| F1 | Desktop Site tab 1514/1400 px (option selector) | accepted | Reproduced; also at 1000 px (1114/1000), which H3 did not check. | See O3. |
| F2 | B9 never asserts its target | accepted | See O5. | — |
| F3 | Two "leader" notions disagree | accepted in part | The cause is misdiagnosed: both are rank 1 and the same option id; its name changed because its fill-residual PV was re-sized (7.7 → 2.7 MWp). "Leader unchanged" was true but unhelpful. | The live message now reads "Leader unchanged (same choices, re-sized): <name>". |
| F4 | Drawn boundary 3.96 ha, not 4.00 | accepted (no change) | Pixel snapping; within "about 4 ha". | — |
| F5 | Every option "Does not fit" on 4 ha | accepted (no change) | Correct behaviour. | — |

### 2.5 Orchestrator findings

| ID | Finding | Decision | What changed |
|---|---|---|---|
| O1 | Phone: results start about 5,400–6,000 px down | accepted | Below 768 px, once a run has finished, the run progress panel, its event log, the run summary and the run flags fold into one closed "Run details" disclosure under the one-line status (its summary: "13/13 stages, 7 warnings · 2,000 of 57,028 screened"); while a run is in progress the progress panel is shown unfolded. Desktop and tablet unchanged. New check B19: tab bar ends at 813 px, the active tab's content starts at 832 px (bound 1,000 px), one tap opens the progress panel, the panel is unfolded during a run and folds after it, axe 0 serious/critical with the disclosure closed and open. The §12 rule "expanded automatically whenever any entry is new" also opens "Run details". The run disclosures got a visible ▸/▾ marker. |
| O2 | "A status, not a weight: no effect on any score or rank" is misleading | accepted | Header: "Status only: it changes no score or rank. Site inputs still size fill-residual solar and set the POC and gas-main route costs." Run summary (`siteFitEffect`): states the penalty and compliant-first cases. Test 9g now checks (b2) a real status-only change through the whole pipeline (T4, receptor, night threshold 45 → 60 dB(A): 243 statuses change, 0 scores, ranks, raw metrics, sizes or layouts) and (b3) halving the T1 area: every sizing value other than fill-residual ground PV identical on all 2,000 options, raw metrics change only where ground PV changed (685, all fill-residual), scores and ranks move through the relative scale. |
| O3 | Desktop overflow from the 2,000-option selector | accepted | The label takes the free width and the select shrinks inside it (`min-width: 0`, ellipsis); every option stays listed; the full name is in the title and the open list. Widths now 1400/1400, 1000/1000, 375/375 (B20). |
| O4 | 36 Tab presses to the plan after "Skip to results" (218 without) | accepted | Third skip link "Skip to site plan": selects the Site tab and focuses the plan. Plan in 3 Tab + Enter (B21). Tab only from the top is now 214 presses to the chart (one more skip link). |
| O5 | B9 cannot fail | accepted | B9 times three preset changes and asserts the median ≤ 300 ms (regression bound for this shared 2-core sandbox), and reports it against the §17 target of 100 ms on the 4-core reference machine. Final run: 97, 70 and 70 ms, median 70 ms (under 100 ms here in this run; H3 measured 166 ms while another verifier loaded the CPU). Whether the 100 ms target holds on the reference machine is not shown: open point 11. |

## 3. Found during the review (not in the reports)

1. **Test fixture error.** `constrainedT1` (tests/site-tests.mjs) used `b = 150000 / (2a)`, the full north–south side, as the half side: its "soft flood zone" lay wholly south of the site and its gas main 158 m north of it, so the constrained runs never exercised a soft exclusion. Fixed (`b = 150000 / (4a)`); 9d now names 1,296 relaxed rules on the constrained runs (399 before), and all its invariants still hold.
2. **Tablet overflow.** The Site tab also overflowed at 1000 px (1114/1000), part of O3.
3. **Open point 5 was wrong about stacks** (see F04).
4. **Block notes never shown.** `buildBlocks` notes (the in-building genset plant room) were not displayed anywhere; they now appear under the plan table, with the new carport note.
5. **`site.softUsableBySolar` record note** said "Off: soft exclusions are treated like hard ones for placement", which the L4 relaxation contradicts; corrected (D2).
6. **T3 cost axis is flat** (from H1's LCOE finding; section 2.1, H1-LCOE).

## 4. Verifier errors

- **H2 D2/R24/I04:** "fixed solar included" is wrong: fixed-MWp ground PV is placed as a fill (`computeFill`, mode `fixed`), which uses soft cells when the toggle is on. The L4 behaviour is the brief's §15/§10.4-step-5 reading, not a conflict.
- **H2 F04/D23:** missed the core's `permit-stack` Permitting flag (evaluate.js), which counts in deliverability.
- **H2 F06:** counts the C11 wind note as missing at option level; it is a run-level fact shown as a run flag and on the C11 row.
- **H3 F3:** attributes the message to "two leader notions"; both are rank 1 and the same option id (the name changed with its re-sized PV).
- **H3 F1:** checked 1400 px only; 1000 px overflowed too.
- **Orchestrator note on I09b:** "fuel-delivery placement" is already built (H2 I09a, layout.js fuel anchor toward the access point); only the roads-allowance part is missing.
- H1: no material error found. Its 6b "FAILED" is correct as a literal check; the expectation in the claim was wrong, not the code.

## 5. Economics changes: before and after

Group 1 (records, roof-plant rule, compliant-first, texts) changed no number: T1, T2, T3 and T4 are bit-identical in every LCOE, capex, carbon, time-to-power, deliverability, score and rank (only flag and sizing-sentence texts changed). Group 2 (route costs) moved these numbers (snapshots `g1-*` → `g2-*`, same options matched by id, default seed):

| Fixture | Leader before → after | Top 20 | Rank changes | Capex | LCOE |
|---|---|---|---|---|---|
| T1 | O1YAUJ8J 85.9634 → O1YAUJ8J 85.9642 | same set, same order | 141 (largest 2 places) | −€1,633,500 on every option (cable 1.0 km fixed → 10 m from the default POC, ×1.1 contingency) | −0.08 % to −0.25 % |
| T3 | O1Q4ILX5 70.8916 → 70.8916 | unchanged | 0 | unchanged (no grid connection, no gas main) | unchanged |
| T2 | O1YAUJ8J 85.8203 → 85.8212 | same set, same order | 142 (largest 2) | −€1,633,500 every option | −0.08 % to −0.25 % |
| T4 | O1VA67D3 97.9554 → 97.9552 | set changed | 617 (largest 11) | −€1,633,500 every option (grid line €2.30 m → €0.815 m) | −0.5 % to −3.8 % |

Variants (original engine → after the review): T1 with a gas main 400 m east of the boundary: gas-burning options pay €328,000 (410 m × €0.8 m/km), 178 ranks move (largest 3), leader unchanged. T1 with the POC 1.2 km south: cable 1.21 km instead of the fixed 1.0 km, 31 ranks move, leader unchanged. Halving the T1 area changes raw metrics only on the 685 fill-residual options before and after the review (the route stays 10 m because the default POC sits on the boundary).

Reading: the fixed 1.0 km cable at €1.5 m/km was an assumption that the brief's model (POC at the boundary, off-site works in the per-MW connection charge) does not make; on the small T4 site it was most of the grid line, which is why T4 moves most. With the default POC being a stand-in, the owner should enter the real POC.

## 6. Final test output

Run order 2026-10-17, Node v22.22.0, in `/home/claude/build/app`: `npm run build` (exit 0), then `npm test` (exit 0), then `npm run test:browser` (exit 0). Raw outputs: `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/review/final-build.txt`, `final-test.txt`, `final-browser.txt`.

Build:

```
dist/app.js: 506.8 KB
dist/worker.js: 187.6 KB
dist/app.css: 30.9 KB
dist/index.html: 0.5 KB
dist/energy-tool-single-file.html: 726.3 KB (worker inlined, 187.6 KB)
```

`npm test`: **32/32 passed** (every test and its detail line):

```
T1 run: 2000 options screened of 57028 combinations in 11.28 s (single thread, 1769 distinct dispatch runs, 10616 8760-h years)
T3 run: 2000 options in 11.96 s
PASS  1. Per-hour energy balance (supply = demand + losses + curtailment + unmet), T1 and T3, full 8760-h years  (2439 ms)
      120 options, 6,342,240 hours checked; max |error| 2.84e-14 MWh (max relative 5.01e-16); SOC recursion max error 0.00e+0 MWh; BESS losses 269855 MWh and unmet 31972299 MWh across the sample. In-engine per-hour check over all 4000 screened options: max 2.84e-14 MWh.
PASS  2. Grid connection equals the offered capacity on every option, never resized; import never exceeds it in "Show unmet load"  (1199 ms)
      2000 options: grid connection = offered profile (20 MW to month 29, 120 MW from month 30) in every month; one connection capex value across all options; 2,698,080 hours checked, max import − offered = 3.55e-15 MW; 1039 options with unmet load, all flagged "Grid capacity binding" (major).
Test-3 resilience-fail sample: 36 options (sampling off).
PASS  3. No option is hidden by default  (15 ms)
      Resilience Meets/Meets with flags/Does not meet in the default view: T1 185/1815/0, T3 185/1815/0, T1 + C5 None 7/22/7; 7 "Does not meet" options shown and ranked (best rank 5 of 36), incl. 1 grid-only C5 = None at 0 MW backed failing "Backed load"; failing items on the 7 C5 = None options: Backed load + Autonomy + Backup technology | Backup technology. T1: 2000/2000 shown by default (1947 dominated, all shown and ranked); T3: 2000/2000 shown; 415 T3 grid-dependent options listed with unmet load + "Grid capacity binding" + time-to-power flags; archetypes present: A1, A2, A3, A4, A5, A6, A7, A8, A9, A10a, A10b.
PASS  4. Score and rank do not change when a view filter changes  (91 ms)
      10 view configurations (visible counts 53, 185, 0, 961, 1900, 31, 53, 11, 1113, 11 of 2000); 2000 scores and ranks identical before and after each.
PASS  5a. Determinism: same inputs + seed give identical outputs  (10886 ms)
      2000 options identical on two runs; a different seed gives a different Latin hypercube sample.
PASS  5b. Weight change re-ranks without re-dispatch; effective weights sum to 1  (0 ms)
      Balanced effective weights 35/25/25/15 %; all-zero → 25 % each with notice.
PASS  5c. "Show exceedance" removes unmet load on T3 and raises "Import exceeds grid capacity"  (1430 ms)
      21 grid-dependent T3 options: unmet 0 MWh, all flagged "Import exceeds grid capacity" (major).
PASS  5d. Every default record carries the "indicative — unverified" label and a basis  (0 ms)
      492 default records; all "indicative — unverified", confidence C, verified false; basis: source 307, judgement 174, run setting 11.
PASS  6a. Event log completeness: every stage has a start and an end, sequence numbers contiguous, stage order as specified (T1, T3 and the test-3 sample)  (17 ms)
      T1: 2097 events, seq 0–2096 contiguous, 13/13 stages start→end in order; dispatch 2000 progress events (1769 miss / 231 hit), resilience {"Meets":185,"Meets with flags":1815,"Does not meet":0}, 7 warnings (profiles-synthetic, defaults-unverified, cap-sampling, site-does-not-fit, site-fits-with-flags, unmet-load, full-load-not-reached).
      T3: 2099 events, seq 0–2098 contiguous, 13/13 stages start→end in order; dispatch 2000 progress events (1748 miss / 252 hit), resilience {"Meets":185,"Meets with flags":1815,"Does not meet":0}, 9 warnings (profiles-synthetic, defaults-unverified, cap-sampling, site-does-not-fit, site-fits-with-flags, unmet-load, full-load-not-reached, lcoe-non-finite, metric-non-finite).
      T1 + C5 None: 79 events, seq 0–78 contiguous, 13/13 stages start→end in order; dispatch 36 progress events (18 miss / 18 hit), resilience {"Meets":7,"Meets with flags":22,"Does not meet":7}, 7 warnings (profiles-synthetic, defaults-unverified, site-does-not-fit, site-fits-with-flags, unmet-load, full-load-not-reached, requirement-not-met).
PASS  6b. Log content (timestamps excluded) is identical across two runs with the same inputs  (9 ms)
      2097 events identical on two T1 runs excluding t_ms (2097 of 2097 timestamps differ); input hash b97d1a669bc0a245 is independent of key order and changes when an input changes.
PASS  6c. Worker pool: each worker returns its own events; merged log complete, ordered and deterministic; results equal the single-thread run  (24124 ms)
      3 workers (real src/worker.js in worker_threads): merged 2179 events, seq contiguous, sources main, worker 0, worker 1, worker 2; per worker 667 options 646 miss/21 hit; 667 options 639 miss/28 hit; 666 options 643 miss/23 hit; 1769 distinct configurations, 159 simulated in more than one worker; streamed events = returned events; second pool run identical excluding timestamps; 2000 scores and ranks equal the single-thread run.
PASS  6d. Main-thread fallback: time-sliced runModelSteps gives the same log content and results, and the progress tracker reaches 100 % on every stage  (10677 ms)
      283 time slices of ≤ 30 ms of work each (plus one item overrun); current stage observed in 7 of 13 stages between slices; log content identical to the synchronous run; tracker: 13/13 stages 100 %, dispatch cache 1769 miss / 231 hit, last 200 events kept.
PASS  6e. Log export: JSON round-trips, CSV has one row per event, file names carry the input hash and a timestamp  (31 ms)
      JSON 1336 KB, 2097 events round-trip; CSV 1278 KB, 2097 rows + header; e.g. run-log_b97d1a669bc0a245_20261015-130509Z.json.
PASS  7. Single-file build: worker inlined as a Blob-URL source string, no relative "worker.js" or other file reference, inlined source parses and runs  (1689 ms)
      single file 726.3 KB, 1 inline script, 0 "worker.js" mentions, 0 <script src>, 0 <link href>, 0 relative src/href; inlined worker source 192,076 chars, identical to dist/worker.js, parses; run in a worker_thread on slice 1/50 of T1: 40 options, 81 log events; build newer than the newest source file (2026-10-17T14:15:29.392Z vs 2026-10-17T14:15:13.353Z).
PASS  8a. Pareto set (non-dominated on the two plotted axes) is correct on a hand-checked example  (47 ms)
      hand example frontier A, B, E, D (C, F, G dominated; H not plottable); 200 random sets (4334 points, with ties) match brute force; engine set frontier o1, o2, o4 with o3, o5 marked dominated; T1 LCOE vs location carbon: 11 of 2000 on the frontier, equal to brute force; T1 time-to-power vs deliverability (higher is better): 1 on the frontier, equal to brute force.
PASS  8b. Weighted pick is the highest weighted score and moves with the weights, with no dispatch re-run  (80 ms)
      5 weight presets, 4 distinct picks: Balanced → O1YAUJ8J (86.0); Lowest cost → OZ57BJM (88.6); Lowest carbon → O1YAUJ8J (92.0); Speed to market → OLN9RSS (90.8); Lowest risk → OCRJR70 (85.4). Pick = hand-computed argmax = rank 1 every time; dispatch/economics objects identical by reference; dispatch counter 1769 before and after; 16 ms per preset for re-score + view (T1 full run 11.3 s).
PASS  8c. Dominance marking does not remove any option from the Pareto view, the list or the ranking  (23 ms)
      T1: 2000/2000 in the view (1947 dominated, best dominated rank 2); hide on → 53 shown + 1947 hidden, scores, ranks, pick and frontier unchanged; T3: 2000/2000 in the view (1895 dominated, best dominated rank 2); hide on → 105 shown + 1895 hidden, scores, ranks, pick and frontier unchanged; T1 + C5 None: 36/36 in the view (11 dominated, best dominated rank 15); hide on → 25 shown + 11 hidden, scores, ranks, pick and frontier unchanged.
PASS  8d. Every point in the Pareto chart has a matching row in the table alternative (rendered)  (777 ms)
      T1 default: 2000 points / 2000 rows, 0 missing; T1 NPV vs market, hide dominated: 53 points / 53 rows, 0 missing; T3 1−CFE, phone width: 1974 points / 2000 rows, 0 missing; T1 + C5 None: 36 points / 36 rows, 0 missing; T1 time-to-power vs deliverability: 2000 points / 2000 rows, 0 missing.
PASS  8e. Dominance is marked when the dominated option has an infinite cost (LCOE with no delivered energy)  (4 ms)
      6 hand-checked cases as expected (infinite cost dominated by an equal-elsewhere finite cost, both orders; infinite ties and infinite dominators not marked); view: hollow, not plotted, hidden by "Hide dominated options"; T3: 26 options with infinite LCOE, 0 of them beaten exactly by a finite-cost option (each marked dominated), 3 dominated in total.
PASS  8f. Every registered view setting and run setting is the value the code uses  (294 ms)
      18 settings.* records = input defaults; hideDominated: record → defaultView() → paretoView default; ttpClasses 5 (T1 uses 4 after merging tied edges; 2 → ≤ 2); canvasAbove 500: T1 2000 points on Canvas; threshold 2000 → SVG, 1999 → Canvas; display "chart" (record "table" → table first); pageSize 50 rows (record 7 → 7 rows); axes follow-scoring (record "ttp" → x = time-to-power); site smallMultiples 6 (top options in rank order; record 3 → 3, 0 → none).
PASS  8g. AC5: the highlighted pick is the weighted leader (rank 1, the header leader) with "Rank requirement-compliant options first" on or off  (189 ms)
      synthetic: toggle off → pick = rank 1 = top scorer, no second mark; toggle on → pick = rank 1 (Meets), top scorer (Does not meet, rank 3) marked separately with the reason in the pick line; site fit: toggle on → a "Does not fit" top scorer that meets resilience ranks after the fitting options (rank 3), scores unchanged, reason names the site-fit status; real samples: 20 sample × preset × toggle combinations, pick = rank 1 in all, 7 with a separate highest-score mark (T1 + C5 None (test 3), Balanced: top scorer rank 15 (Meets with flags, Does not fit); T1 + C5 None (test 3), Lowest carbon: top scorer rank 15 (Meets with flags, Does not fit); T1 + C5 None (test 3), Speed to market: top scorer rank 15 (Meets with flags, Does not fit); T1 + C5 None (test 3), Lowest risk: top scorer rank 15 (Meets with flags, Does not fit); C5 None, 13 options, Balanced: top scorer rank 7 (Meets with flags, Does not fit); C5 None, 13 options, Speed to market: top scorer rank 7 (Meets with flags, Does not fit); C5 None, 13 options, Lowest risk: top scorer rank 7 (Does not meet, Fits); toggle on in each); App.jsx leader = weightedPick(); undrawn pick explained (hide-dominated tie, filters, not plottable).
PASS  8h. Every active view filter is a removable chip, and the header filter count matches applyView()  (43 ms)
      13 view states (incl. site fit and land-take ceiling), 28 chips each removed alone (only that filter goes); filter count = applyView chips in every state; removing every chip restores all 2000 options; Trade-offs renders one remove button per chip (site-fit and land-take chips included).
PASS  9a. Geometry kernel: projection, areas, validity, point-in-polygon, offsets, differences, raster, import round-trips (hand-checked values)  (10 ms)
      0.01°×0.01° at 52.3° N: 759167.0 m² (ellipsoid 759167.0, 1.3e-7 %; sphere hand check 756199, 0.39 %); offsets 50,400 / 38,400 / L 22,421.46 (arc) and 22,400 (mitre) m²; 30×20 with 10 m collapses; 12 difference cases exact (holes merged, splits, shared edges perturbed); GeoJSON and KML round trips identical; CDATA/altitude KML parsed; projected coordinates rejected with a warning.
PASS  9b. Site model: area + aspect rectangle, polygon boundary, per-edge setbacks, exclusions, height zones, points, raster, fixtures and records  (186 ms)
      T1: gross 150,000, envelope 134588.6 (raster 134384), net 114400.3 m², 238×159 cells of 2 m; polygon site: 14.000 ha from the boundary, easement splits the envelope in 2 (−5600.0 m²), flood zone soft (10404 m² soft cells), 7630 cells under the 12 m zone; 120 site/spatial/layout records, all "indicative — unverified" (judgement 79, source 38, run setting 3).
PASS  9c. Blocks (§10.3): building massing from the §5.3 density rules, unit arrays, substation, fuel, rooftop blocks, off-site tray  (69 ms)
      A1 (air): 4 halls × 18,333 m² at 16 m, AIS substation 12,000 m², 5 genset arrays (52 units), fuel 239 m², roof plant 29,333 m²; double-deck 3 arrays at 12 m; in-building adds 5200 m² to the halls; GIS 4,000 m²; A3 BESS 6 arrays (69 containers); A10a SMR off-site 0.80 ha; records drive the values: MV power factor (T4 substation 222.2 m²; 0.8 → 250 m²), double-deck factor (0.75 → ceil(0.75 × units) positions, area budget × 0.75), on-site SMR clearance and L:W, roof plant = max(fraction, heat-rejection footprint) in sizing and blocks alike.
PASS  9d. Layout invariants on T1, T2, T4 and T1 with constraints: no overlaps, inside the envelope and outside hard exclusions, separations met or named, unplaced → "Does not fit" with a shortfall, deterministic  (20330 ms)
      T1: 1324 distinct layouts (2000 options), 25,717 placed blocks checked, 1759 relaxed rules named, 4582 unplaced blocks, batch 2937 ms; 48 options recomputed alone through HOOKS.layout match the run; T2: 1324 distinct layouts (2000 options), 11,230 placed blocks checked, 5394 relaxed rules named, 19069 unplaced blocks, batch 816 ms; 48 options recomputed alone through HOOKS.layout match the run; T4: 895 distinct layouts (2000 options), 3,797 placed blocks checked, 199 relaxed rules named, 1588 unplaced blocks, batch 103 ms; 48 options recomputed alone through HOOKS.layout match the run; T1 + constraints: 364 distinct layouts (400 options), 6,630 placed blocks checked, 1296 relaxed rules named, 1623 unplaced blocks, batch 2342 ms; 48 options recomputed alone through HOOKS.layout match the run; T1 + constraints: two batches identical; 31 single-set layouts equal the batch; two full runs give identical site fit and solar fill.
PASS  9h. Run log: the "layout" stage has start, progress and end with counts and cache hits/misses; sequence numbers contiguous; content deterministic  (2841 ms)
      T1: 11 layout events (7 progress), 1324 distinct layouts / 676 cache hits, 2956 placements, statuses {"Fits":963,"Fits with flags":23,"Does not fit":1014}, warnings site-does-not-fit, site-fits-with-flags; T2: 10 layout events (7 progress), 1324 distinct layouts / 676 cache hits, 2956 placements, statuses {"Fits":0,"Fits with flags":0,"Does not fit":2000}, warnings site-does-not-fit; T4: 9 layout events (5 progress), 895 distinct layouts / 1105 cache hits, 680 placements, statuses {"Fits":272,"Fits with flags":6,"Does not fit":1722}, warnings site-does-not-fit, site-fits-with-flags; T4 log identical on two runs (timestamps excluded).
PASS  9e. Site-fit outputs (§10.6): area budget, land take, residual, height per zone, separation checklist, noise proxy (hand-checked), roof use, expansion headroom, land-take ceiling flag  (1790 ms)
      noise hand check: 2 × 100 dB(A) at 100 m → 52.0 each, 55.0 together; standby 105 dB(A) at 200 m → 51.0 (separate); flag at 45 dB(A) threshold (category Permitting, not counted as permitting), none at 56 dB(A); land-take ceiling 0.01 ha → flag (status unchanged), 1 ha → none; 144 options on T1, T1 + constraints, T2 and T4: budget parts = land take, shortfall beyond 100 %, residual, off-site land, height rows, 1118 separation rows (no minimum broken; relaxed rows ⇔ named relaxed rules), roof split, expansion 0 when not fitting.
PASS  9f. AC7 on T2: an archetype shows "Does not fit" with a named shortfall; C17/C18 stay at defaults with "N options do not fit" notes; including C17 GIS and C18 double-deck yields options that fit or fit with flags; no option hidden  (9658 ms)
      T2: 2000 of 2000 options do not fit; 11 archetypes do, e.g. A1 "Does not fit: 3 blocks not placed, 54,999 m² short" (Data hall 2 of 4 (phase 2), Data hall 3 of 4 (phase 3), Data hall 4 of 4 (phase 4)); C17/C18 at defaults; run summary notes: "2,000 options do not fit; GIS reduces substation footprint." / "2,000 options do not fit; double-deck and in-building arrangements reduce genset footprint."; with C17 GIS + C18 double-deck included (196,996 combinations, 2000 screened, sampled): 0 fit, 2 fit with flags (e.g. "Grid · HVO N+1 · DLC · PPA hybrid 100 %": 4 rules relaxed: Data hall 1 of 4 (phase 1): height 16 m above the 15 m height limit; Data…), 1998 do not fit; every option listed in both runs (hide dominated off, ranks 1…N).
PASS  9g. Site-fit status alone never changes a score or rank while the site-fit penalty is off; site inputs act on scores only through fill-residual PV sizing (T1 at half the area); with the penalty on, deliverability drops by 10/25 points and the axis reads "Deliverability (incl. site fit)"  (17667 ms)
      T1: deliverability of all 2000 options identical with site fit real, removed or scrambled and with the site-fit flags removed; scores and ranks identical with site fit removed, scrambled or all "Does not fit" (dominance may differ: it includes site fit, §7.2 step 6); status-only change on T4 (receptor; noise threshold 45 → 60 dB(A)): 243 statuses change, 0 scores, 0 ranks, 0 raw metrics, sizes or layouts; T1 at half the area (7.5 ha): 986 statuses change; 685 fill-residual options change ground PV and 685 options change raw metrics (all of them fill-residual); every other sizing value identical on all 2000 options; 2000 scores and 1260 ranks move through the relative scale (§11); T4 with the penalty on: 1728 of 2000 options lose 10/25 deliverability points, 1977 ranks change, LCOE/capex/time-to-power and statuses unchanged; detail reads "Deliverability (incl. site fit)" (off: "Deliverability").
PASS  9i. Site tab (server render): plan with layers, scale bar and north arrow, one drawn block per placed block, site-fit panel, unplaced tray, plan as a table with every block, small multiples, editor  (515 ms)
      T2: leader Does not fit, 9 blocks drawn = placed, 14 table rows (placed 9, unplaced 3, fill 1, roof 1, off-site 0); T1 + constraints: leader Fits with flags, 13 blocks drawn = placed, 14 table rows (placed 13, unplaced 0, fill 0, roof 1, off-site 0); T4: leader Fits, 4 blocks drawn = placed, 7 table rows (placed 4, unplaced 0, fill 1, roof 2, off-site 0).
PASS  9j. Route lengths for cost (§5.2, §5.4): the POC sets the grid cable route and the gas main the connection pipe of gas-burning options; layout-independent, the same for every option  (182 ms)
      site model: default POC 10 m (the setback), POC 1,200 m out → 1210.0 m, gas main inside → 0 m, none → not costed; T1: grid connection €18,015,000 on all 2000 options (cable €15,000 for 10 m), no gas pipe (no gas main), gas-burning options say so; T1 + constraints: 367 of 400 options burn gas and pay €8,000 (10 m × €0.80 m/km), the others nothing.

32/32 tests passed.
Timing (single thread, Node v22.22.0): T1 full run 11.28 s for 2000 options; T3 11.96 s.
```

`npm run test:browser`: **21/21 passed**:

```
Browser tests on file:///home/claude/build/app/dist/energy-tool-single-file.html
Chromium 141.0.7390.37, Playwright 1.56.0, axe-core 4.10.2
PASS  B1. Tab order from the top of the page (no skip link): stops before the results and the chart, none hidden  (14.7 s)
      loaded and ran in 12.7 s; Tab only: 185 presses to the first stop in the results, 208 to the results tab list (ArrowRight selects Trade-offs, ARIA tabs pattern), 214 to the chart; 179 stops in the inputs panel, 3 skip links; every stop visible.
PASS  B2. Skip links: "Skip to results" and "Skip to trade-offs chart" are the first two Tab stops and reach their targets  (0.4 s)
      chart reached with 2 Tab presses + Enter (focus on svg#tradeoffs-chart, :focus-visible, Trade-offs selected); live region: "Grid · Diesel N+1 · DLC · PV 7.7 MWp · PPA hybrid 100 %. Rank 1, score 86.0. LCOE 133 €/MW…"; results reached with 1 Tab press + Enter (#results, tabindex −1).
PASS  B3. Keyboard on the chart: arrows move along the axes, Home/End, P returns to the pick, Enter opens its detail, Escape clears  (3.0 s)
      pick → 8 × ArrowRight, 8 new options, x non-decreasing (133 → 134 → 134 → 134 → 134 → 134 → 134 → 134 → 134) → 8 × ArrowLeft back to the pick; 8 × ArrowUp, y non-decreasing (113 → 113); Home → leftmost (on the frontier; ArrowLeft stays); End → rightmost (ArrowRight stays); P → pick; Enter opened "#1 · Grid · Diesel N+1 · DLC · PV 7.7 MWp · PPA hybrid 100 %…" and a second Enter kept it open; Escape cleared the ring.
PASS  B4. Canvas path (more than the registered threshold): points drawn on Canvas, no SVG markers, pixels at the pick, pointer hit-test opens the nearest option  (0.4 s)
      2000 plotted points > threshold 500: Canvas 942×460, 48,516 painted pixels, 0 SVG markers; pixel at the pick rgb(255, 255, 255); pointer at the pick: hover and click both chose "#1 · Grid · Diesel N+1 · DLC · PV 7.7 MWp · P…" (0.00 px from the pointer; overlapping markers).
PASS  B5. SVG path (at or below the threshold): with "Hide dominated options" on, markers are SVG paths, one per plotted point, no Canvas  (0.8 s)
      53 points → 53 SVG markers, no Canvas; counter chip "1,947 dominated options hidden show"; "show" restored the Canvas view.
PASS  B6. Table paging: every option reachable, page size as registered, rank order, the pick on page 1  (3.6 s)
      2000 rows, 50 per page, 40 pages; Next through every page collected 2000 distinct options in rank order 1…2000 (last page 50 rows); Next disabled at the end; Previous goes back; pick badge on row 1.
PASS  B7. axe (WCAG 2.0/2.1/2.2 A and AA rules), light theme: Trade-offs table, Trade-offs chart and Options tab have no serious or critical violation  (10.8 s)
      Trade-offs, table: 32 rules passed, violations {}, needs review color-contrast ×749
      Trade-offs, chart: 33 rules passed, violations {}, needs review color-contrast ×767
      Options: 34 rules passed, violations {}, needs review color-contrast ×823
      Options (light): 748 "needs review" text nodes checked from computed styles, lowest 4.86:1 (.rp-ev-progress.rp-ev:nth-child(1) > .rp-t, rgb(98, 103, 111), 12px), 0 below the minimum; 75 icon-only glyphs (decorative, beside text)
PASS  B8. Removable filter chips: each filter shows a chip with its own remove button; removing it by keyboard keeps focus in the chip row  (1.2 s)
      chips "Resilience: Meets", "Capex ≤ €150 m"; header counted 2 filters and the shown count; Enter on "Remove filter" removed only that chip and focus stayed on the next chip's remove button; last chip removed → no chip row, count 0.
PASS  B9. A weight preset moves the pick without a re-run; repaint asserted ≤ 300 ms (median of 3, regression bound on this sandbox) and reported against the §17 target of 100 ms on the reference machine  (0.6 s)
      pick "#1 Grid · Diesel N+1 · DLC · PV 7.7 MWp …" → "#1 Islanded gas recips · retained-plant …"; click to repaint of the pick line 97, 70, 70 ms, median 70 ms ≤ 300 ms (asserted); §17 target ≤ 100 ms on the 4-core reference machine: also met on this sandbox; no re-run; header leader = pick before (yes) and after (yes).
PASS  B10. No console errors or page errors on the main page  (0.0 s)
      0 errors (load and run 12.7 s, status "Options updated. Leader unchanged. Last run 12 s on 1 worker").
PASS  B11. axe, dark theme (prefers-color-scheme: dark): Trade-offs chart, table and Options tab have no serious or critical violation  (23.4 s)
      Trade-offs, chart (dark): 33 rules passed, violations {}, needs review color-contrast ×767
      Trade-offs, table (dark): 32 rules passed, violations {}, needs review color-contrast ×750
      Options (dark): 34 rules passed, violations {}, needs review color-contrast ×823
      Options (dark): 748 "needs review" text nodes checked from computed styles, lowest 5:1 (.rp-ev-start.rp-ev:nth-child(189) > .rp-src, rgb(154, 152, 144), 12px), 0 below the minimum; 75 icon-only glyphs (decorative, beside text)
PASS  B12. Tablet width (1000 px): the closed inputs panel takes no Tab stop; opened, its controls are reachable  (14.0 s)
      closed: 0 of 40 Tab stops in the panel, all visible; opened: panel controls reached by Tab.
PASS  B13. Phone width (375 px): Trade-offs chart and table cause no horizontal page scroll  (12.8 s)
      chart 375/375 px, table 375/375 px (scrollWidth/clientWidth); the wide table scrolls inside its own region.
PASS  B14. Phone width (375 px, touch): the Site tab causes no horizontal page scroll with every section open; a boundary drawn by tapping re-screens the options  (26.2 s)
      scrollWidth/clientWidth 375/375 px with every section open, plan 325 px wide; 4 taps + Finish → drawn 4-edge boundary of 9.18 ha, options re-screened (run summary: "drawn polygon (4 edges)"); drawing 375/375 px, after 375/375 px.
PASS  B15. Keyboard on the Site tab: Tab reaches the plan; arrow keys focus blocks with dimensions, tooltip, live text and the matching table row; the table alternative is reachable; a boundary can be drawn with the keyboard alone  (25.0 s)
      11 Tab presses from the Site tab to the plan (select → input → input → input → input → input → input → input → input → input → svg), focus visible; ArrowRight → "Data hall 1 of 4 (phase 1)" with dimensions 101.6 m × 67.7 m, tooltip and table row match; End → "Heat rejection (ground), array 2 of 2 · 11 × 5 MW modules"; Home back; Escape clears; Tab → "The plan as a table" link → Enter → Tab → table region (14 rows); keyboard drawing: Enter, 12 × Shift+→, Enter, 12 × Shift+↑, Enter, F → 3-edge boundary of 0.72 ha (120 × 120 m triangle), options re-screened.
PASS  B16. GeoJSON import on the Site tab: each feature gets a "use as" choice (guessed from its name), and applying sets the boundary, a soft flood exclusion, the POC and a receptor, then re-screens the options  (29.7 s)
      uses guessed boundary, excl:flood, poc, receptor; "Applied 4 of 4 features from site-import-5342.geojson."; re-screened: Boundary: imported polygon (4 edges); gross 19.13 ha, buildable envelope 17.42 ha, net developable 14.80 ha af…; receptor row "Dwelling45.7 dB(A)57.5 dB(A)✗ above (flagged)".
PASS  B17. axe, light theme: Site tab (plan, layers, legend, editor with every section open, site-fit panel incl. unplaced tray, small multiples, table) and drawing mode have no serious or critical violation  (31.8 s)
      Site tab, leader (light): 35 rules passed, violations {}, needs review color-contrast ×782
      Site tab, an option that does not fit (light): 35 rules passed, violations {}, needs review color-contrast ×791
      Site tab, drawing (light): 35 rules passed, violations {}, needs review color-contrast ×792
      Site tab (light): 774 "needs review" text nodes checked from computed styles, lowest 4.86:1 (.rp-ev-progress.rp-ev:nth-child(1) > .rp-t, rgb(98, 103, 111), 12px), 0 below the minimum; 8 icon-only glyphs (decorative, beside text)
PASS  B18. axe, dark theme: the same Site tab states have no serious or critical violation  (31.5 s)
      Site tab, leader (dark): 35 rules passed, violations {}, needs review color-contrast ×782
      Site tab, an option that does not fit (dark): 35 rules passed, violations {}, needs review color-contrast ×791
      Site tab, drawing (dark): 35 rules passed, violations {}, needs review color-contrast ×792
      Site tab (dark): 774 "needs review" text nodes checked from computed styles, lowest 5:1 (.rp-ev-start.rp-ev:nth-child(189) > .rp-src, rgb(154, 152, 144), 12px), 0 below the minimum; 8 icon-only glyphs (decorative, beside text)
PASS  B19. Phone width (375 px, touch): after the run, the tab bar and the start of the active tab are within the first 1,000 px; the run progress, event log and run summary sit in a closed "Run details" disclosure under a one-line status; during a run the progress panel is shown, not folded  (25.5 s)
      header strip 143–631 px, status line 50 px ("Options updated. Leader unchanged. Last run 12 s on 1 worker…"), "Run details" (closed) at 681 px: "Run details 13/13 stages, 7 warnings · 2,000 of 57,028 screened"; tab bar 775–813 px, first content of the active tab (button "Meets") at 832 px (was about 5,400 px); one tap opens the progress panel (13/13 stages done); during a new run the panel is shown outside "Run details" (892 px), and folds again when it finishes (tab bar at 813 px)
      Phone, "Run details" closed: 32 rules passed, violations {}, needs review color-contrast ×75
      Phone, "Run details" open: 34 rules passed, violations {}, needs review color-contrast ×838.
PASS  B20. Site tab at 1400, 1000 and 375 px: no horizontal page scroll with the option selector listing every screened option; the closed selector shows its full name as the title  (14.7 s)
      scrollWidth/clientWidth 1400 px: 1400/1400, selector 604–1309 px; 1000 px: 1000/1000, selector 204–909 px; 375 px: 375/375, selector 92–350 px; 2000 options listed (= screened), longest label 184 characters; the title holds the full selected name.
PASS  B21. "Skip to site plan" is the third Tab stop: Enter selects the Site tab and focuses the plan  (13.1 s)
      Tab stops 1–3: "Skip to results", "Skip to trade-offs chart", "Skip to site plan"; Enter → Site tab selected, focus on the plan (:focus-visible); ArrowRight → "Data hall 1 of 4 (phase 1)". Plan: 3 Tab + Enter (before: 36 Tab presses after "Skip to results", 218 with Tab only).

21/21 browser checks passed.
Keyboard: chart in 2 Tab + Enter via the skip link (results: 1 Tab + Enter; site plan: 3 Tab + Enter); Tab only from the top: 214 presses (179 in the inputs panel).
Weight-change repaint: median 70 ms (asserted ≤ 300 ms here; §17 target ≤ 100 ms on the 4-core reference machine).
Phone (375 px): tab bar ends at 813 px; active tab content starts at 832 px (bound 1,000 px).
```

Tests changed in the review, and why:
- **8g** (run-tests.mjs): a synthetic site-fit case added; the real-data assertion "a top scorer below rank 1 must be 'Does not meet'" widened to "not requirement-compliant", because D9 makes "Does not fit" a second reason (the old assertion would fail by design).
- **9c**: four "the record drives the value" checks (MV power factor, double-deck factor, on-site SMR records, roof plant rule).
- **9g**: renamed and extended with (b2) the real status-only change on T4 and (b3) the T1 half-area check (O2). Its existing checks are unchanged.
- **9j** (new): route lengths for cost.
- **constrainedT1** fixture: half side corrected (section 3, item 1); used by 9d, 9e, 9i, 9j.
- **7**: reports whether the build is newer than the newest source file (not asserted).
- **B9**: three samples, median asserted ≤ 300 ms; reported against 100 ms (O5).
- **B19, B20, B21** (new): phone layout with axe, Site width at three widths, skip link to the plan.
- No other existing test changed. B1, B2, B14 and B15 still pass unchanged with the third skip link and the folded phone panels (B14 reads the run summary text inside the closed disclosure; it stays in the DOM).

## 7. Status

Complete. Build, `npm test` (32/32) and `npm run test:browser` (21/21) pass; axe reports 0 serious and 0 critical violations in every audited state (Trade-offs, Options, Site tab leader / non-fitting option / drawing mode, light and dark, and the phone layout with "Run details" closed and open). BUILD-NOTES has a "Review: Site slice" section pointing here; `SITE-PROGRESS.md` and `REVIEW-PROGRESS.md` are marked complete.

Still open (owner decisions or later stages; all recorded in BUILD-NOTES):
1. T3 cost axis is flat because of negative and non-finite LCOEs (financially settled PPA on near-zero delivered energy): open point 10, Brief issue 21.
2. §17 timings on the reference machine: weight repaint (open point 11), screening and site-edit re-screening (open point 4).
3. Screen-reader walk-through (NVDA + Firefox, VoiceOver + Safari) and the stage 7 accessibility audit.
4. Stage 2 gaps: underlay, building footprint override, heat reuse blocks, carport block, access-driven roads allowance, multi-parcel boundaries, pinned small multiples.
5. The new gas pipe rate (€0.8 m/km) and the straight-line route rule are judgements; the default POC is a stand-in for the road-side point.
6. Brief clarifications proposed: height test as a preference with a flag (Brief issue 18), access points and the roads allowance (19), gas connection in the §9.5 capex scope (20).
