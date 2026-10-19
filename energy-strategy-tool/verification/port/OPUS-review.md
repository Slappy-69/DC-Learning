# Opus review: port slice (H1 claims, H2 brief, H3 browser)

Date: 2026-10-18. Reviewer: Opus (independent; the builder's reasoning was read only where it is in the repository). Scope: the port slice, `git diff d3ba899 644c77b`, judged against `brief-v2/BRIEF.md` (+ `OPEN-QUESTIONS.md`, `ASSUMPTIONS.md`), the owner decision of 2026-10-18, `app/BUILD-NOTES.md` ("Slice: Port from the concept line" to the end), `app/PORT-PROGRESS.md`, and the three Haiku reports in this folder (`H1-claims.md`, `H2-brief.md`, `H3-browser.md`, all read in full).

- Working copy: `/home/claude/review-port` (detached worktree at 644c77b). No git command that changes refs was run. The engine of 644c77b was extracted with `git show` to `/home/claude/review-port-scratch/orig-engine/` for the before/after comparison.
- Every number below comes from my own scripts in `/home/claude/review-port-scratch/` (`c1-5c.mjs` claim 5c; `c2-ppa.mjs` O1–O3; `c3-edges.mjs` edge cases; `c4-hedge-sign.mjs` hedge sign and CFE variants; `c5-s2.mjs` H1 S2; `c6-o3-market.mjs` O3 shares and the market-based variant; `c7-cmp.mjs` before/after). The scratch paths the Haiku reports cite are gone; nothing here relies on them.
- File:line references are to commit 644c77b unless marked otherwise (this review moved `evaluate.js` lines after 462 down by 4).
- Fixtures: T1, T3 and "T1 + BESS + solar" (C2 values gasRecip, fuelCell, rented, bessSolar) as in the tests, analysis start 2027-01, project seed 20261015.

## 1. Result in brief

- **The engine changes are correct.** One month (`techAvailMonth(ctx, TECH.bess)`, 21 on T1) drives the bridging battery in sizing (`sizing.js:149–150`), time-to-power (`evaluate.js:28`), dispatch (`dispatch.js:97`, `:243`), the BESS capex and fixed O&M year (`evaluate.js:114–115`, `:189`) and the inspector (`inspect.js:131`). The PPA rule matches the owner decision: the ledger books delivered MWh × (strike + shaping) only (`evaluate.js:249`); the settlement on undelivered volume is `eco.ppaHedge`, in no ledger row and so outside LCOE, NPV, the capex/opex split and the score. The inspector and the tornado reproduce the run exactly. 11 distinct edge options in 12 cases (T3 leader, an infinite-LCOE option, PPA with zero delivery, no battery, battery-only bridges with C3 remove/backup/prime/gridServices, islanded battery bridge, retained battery) re-run, render every model year and run the tornado with 0 NaN, 0 "undefined" and 0 "Infinity" in the engine output or the rendered HTML.
- **H1 claim 5c is not a defect** (confirmed with the dispatch data, section 2.1). Open point 10 can close: §9.8 measures supply by its availability date.
- **Fixed (3 small changes, text and robustness only; no number changes):** (1) the PPA hedge's present value was printed as an absolute value after the total's "income"/"cost" word, so 23 T1 options (28 on T1 + BESS + solar) showed the wrong sign for it, in the `grid-ppa` flag and the option detail; (2) the hosted page carried one non-ASCII character (the loading message's "…"), its only dependency on the host's charset; (3) the `sensitivity.topDrivers` record note said "editable 1–30" although there is no control.
- **Owner decisions, framed and deferred (section 7):** O1 (PPA options that can never deliver: all 1,113 on T3 and 360 islanded ones on T1), O2 (CFE counts undelivered PPA volume: up to 24.8 score points on T3 under the CFE carbon metric; market-based Scope 2 uses the whole contract), O3 (the `grid-ppa` headline says "limited by import capacity" on 753 T1 options whose import-limited share is 0.002–0.501 %). None of them contradicts the decision as worded; none changes the default score.
- **Record corrections:** the stated reason for deferring the §12.6 bridging shading and grid-date band was wrong (neither needs a later stage); the evidence cited for change B-4 did not cover it. Both corrected in BUILD-NOTES. H2 R30/R33 are verifier errors: the battery charge chart has its table column.
- **Findings judged: 57** (H1 21, H2 requirement rows 22, H2 source-fidelity changes 8, H2 sections 1/4/5 3, H3 3): **31 accepted, 3 rejected, 23 deferred.** 13 more points found in the review (section 3).
- **Tests:** `npm test` 44/44 before and after; `npm run test:browser` 29/29 after (section 6). Before/after on T1, T3 and T1 + BESS + solar: 0 options with any numeric, rank, flag-id or severity difference.

## 2. Decisions

Decision words as in the site review: **accepted** (holds, acted on or correct as is), **rejected** (does not hold as stated), **deferred** (holds, not done now; recorded with the reason).

### 2.1 H1 (claims)

| ID | Finding | Decision | Reasoning (my evidence) | What changed |
|---|---|---|---|---|
| 1 | 44/44, slow machine | accepted | Reproduced: 44/44 before (T1 18.35 s, T3 16.01 s) and after. Timing only. | — |
| 2a | T1 before/after | accepted | Leader O1YAUJ8J 92.7124, LCOE 153.77; matches. | — |
| 2b | T3 before/after | accepted | Leader O826DRQ 97.1139; 0 negative, 26 non-finite LCOE; 1,866 options in 0.013 points. Reproduced. | — |
| 2c | +42.3 % uses (new − old) / new | accepted | The builder now states both denominators (BUILD-NOTES item 2 table). | — (done before this review) |
| 2d | Non-PPA options unchanged | accepted | Not re-run against the baseline copy (gone); consistent with the diff: for options without a PPA the changed code paths (`evaluate.js:249–257`, the `grid-ppa` flag) do nothing, and item 1 changes nothing on default T1/T3 (no bridging battery). | — |
| 3 | AC3 reconciliation | accepted | Test 11b: 6.38e-16 on 4,000 options. The 2.3e-5 on O1T5YT00 is a relative figure on a capex that nets to ≈ 0 (6e-8 €). | — |
| 4a | Ledger PPA = delivered × price | accepted | Code `evaluate.js:249`; test 11a every option, every year. | — |
| 4b | Hedge outside ledger, LCOE, NPV, score | accepted | Scoring reads `eco.lcoe`/`eco.npvCost` only (`scoring.js:18`); no ledger row has the hedge. | — |
| 4c | Worked example | accepted | My run: leader hedge total €16,175,470, PV €7,845,695, contract 13.046 TWh, delivered 8.570 TWh. | — |
| 5a | One month in sizing, time-to-power, dispatch | accepted | Plus capex year, fixed O&M year and inspector (section 1). | — |
| 5b | 413 bridging-battery options | accepted | Test 10 output: 413 (278 / 135), month 21, capex year 1. | — |
| 5c | O1I6WHKZ first discharge month 27 vs time-to-power month 21 (FAILED literal) | **rejected (not a defect)** | `c1-5c.mjs`: the battery charges from month 21 (2,214 + 474 MWh, full at 5,043 MWh by month 22). Months 21–26: peak hourly net demand 14.75–19.66 MW under the 20 MW import cap, largest hourly shortfall 0, unmet load 0, so the "bridging support" rule (`dispatch.js:246–248`) has nothing to cover. First shortfall month 27 (0.41 MW) → first discharge (29 MWh); months 27–29 discharge 29/303/929 MWh, unmet 0. Time-to-power is a capacity test at design load (peak PUE): design load passes the 20 MW grid from month 23 (gap without the battery 0.02–7.09 MW in months 23–29), and the battery's 105 MW closes it. Both follow their definitions (§9.8 supply-available date; §9.4 hourly dispatch). Counting from first discharge would make time-to-power depend on the hourly weather and punish an option for not needing its battery. | Open point 10 annotated: confirmed; can close. |
| 5d | C3 = remove: time-to-power drops the battery at full grid, dispatch and ledger keep it | deferred | Pre-existing (open point 1). See also section 3, item 8. | — |
| 6 | Inspector = run, 10 options | accepted | Also mine: 11 distinct edge options (`c3-edges.mjs`), `compareWithRun` matches in all. | — |
| S1 | T3 + BESS: 77 → 0 negative | accepted | — | — |
| S2 | Item-1-only scores not verified | accepted (now verified) | `c5-s2.mjs` rebuilds the old PPA line from this run's dispatch and re-scores: T1 + BESS + solar leader OOB3CL1 **98.9963** (LCOE 416.4 €/MWh), T3 + BESS + solar O114KGKR **73.1602** with 77 negative LCOEs. The notes' item-1 figures are right. | — |
| O1 | T3: no PPA option delivers; leader carries a hedge | deferred (owner) | Holds and extends to T1 (360 islanded PPA options, 0 MWh delivered). Consistent with the decision as worded. Options in section 7.1. | — |
| O2 | Market-based and CFE count undelivered volume | deferred (owner) | Holds; CFE is the material one (section 7.2). | — |
| O3 | Headline "limited by import capacity" when most is above load | deferred (owner) | Holds on 753 T1 options (section 7.3). Severity does not reach the score (deliverability counts permitting flags only, `evaluate.js:580–581`). | — |
| O4 | "(or battery)" wording | accepted (no change) | The engine never routes PPA energy into a battery (`dispatch.js` charging uses on-site surplus and grid headroom only), so both wordings give identical numbers. The owner wording to quote is the one given above. | — |
| O5 | T3 cost axis still compressed | deferred | Open point 2 (Brief issue 21); unchanged. | — |

### 2.2 H2 requirement rows that are not IMPLEMENTED

| Row | Brief | H2 | Decision | Reasoning |
|---|---|---|---|---|
| R08 | §9.8 delay against target | PARTIAL | deferred | Delay is computed (`evaluate.js:51–52`) and shown in the "target missed" flag. A delay figure on the tab belongs to the §12.3 option card (stage 3). Not a merge blocker. |
| R09 | §9.8 ranges | DEFERRED | deferred | Stage 5. |
| R12 | §12.3 Energy tab | PARTIAL | deferred | Option card stage 3; representative days stage 4. |
| R14 | §12.6 bridging shading | MISSING | deferred | Not a merge blocker: the phasing timeline is a stage 3 item. The recorded reason was wrong; corrected (section 3, item 4). |
| R15 | §12.6 grid-date band | MISSING | deferred | As R14. The range already exists as the input `grid.dateUncertainty`. |
| R16 | §12.6 pinned side by side | DEFERRED | deferred | Pinning not built. |
| R17 | §12.10 PNG/SVG | DEFERRED | deferred | Stage 6. |
| R19 | §13.3 LCOE swing | PARTIAL | deferred | The table shows LCOE at low and high; `lcoeSwing` is computed (`sensitivity.js:150`). A column is a small stage 5 item (open point 9). |
| R20 | §13.3 top 12, editable 1–30 | PARTIAL | accepted in part | The record note claimed "editable 1–30"; corrected to say there is no control yet and the code clamps to 1–30 (`defaults.js:528`). The control stays deferred (open point 9). |
| R21 | §13.3 default drivers | PARTIAL | deferred | 7 of 12; disclosed in the tab (`SensitivityView.jsx:145`). Stage 5. |
| R22 | §13.3 breakevens | DEFERRED | deferred | Stage 5. |
| R23 | §13.3 scenarios | DEFERRED | deferred | Stage 5. |
| R24 | §13.4 rounding | PARTIAL | deferred | Scores at 4 s.f. in the tornado table and readout. At 3 s.f. the T1 low/high scores (92.7 ± a few tenths) would often print the same; the swing carries the difference at 3 s.f. Owner to accept as a deviation or polish in stage 7 (open point 9). |
| R28 | §16 colour system | PARTIAL | deferred | Palette limits recorded (open point 5); schematics stage 3. |
| R30 | §16 phone, charts with tables | PARTIAL | **rejected** | Verifier error: the battery charge chart's values are the "Charge level MWh" column of the week table (`DispatchView.jsx:360`, `:365`, shown whenever there is a battery). B22 checks 375 px. |
| R31 | §16 tab names | PARTIAL | deferred | "Dispatch" and "Sensitivity" stand in for parts of §16's Compare/Uncertainty/Report; those come with stages 3, 5, 6. |
| R32 | §17 long tasks | PARTIAL | deferred | Open point 6 (worker for the re-runs). |
| R33 | §17 table for every chart | PARTIAL | **rejected** | Same verifier error as R30. Keyboard, focus, contrast checks pass (B22–B27). |
| R34 | §17 screen-reader walk-through | DEFERRED | deferred | Stage 7. |
| R35 | §17 load and bundle | MISSING | accepted | Measured after H2 (BUILD-NOTES "Fixes after the H checks"). Re-measured here: `dist/app.js` 184,020 bytes gzip -9 at 644c77b, 184,098 after this review (budget 1.5 MB: met). Results-to-interactive (≈ 16 s) is not met; recorded, remedy is stage 4. |
| R40 | AC11 | PARTIAL | deferred | Screen reader, stage 7. |
| R41 | AC15 view selections | PARTIAL | deferred (owner) | Whether "opens on the leader" and "opens on the most-unmet year/week" are §18 view settings is the owner's call (open point 9). |

### 2.3 H2 source fidelity: changes not recorded or partly recorded at H2 time

The builder recorded all eight after H2 (BUILD-NOTES "Verification findings on the port"). Item 4 of the task (each change justified, record accurate) is answered here.

| Row | Change | Decision | Justified? | Record accurate? |
|---|---|---|---|---|
| T-3 | Gas driver scales the commodity only | accepted | Yes: the driver and its record name the commodity; the transport adder is a network charge (`sensitivity.js:58` sets `utilities.gasPrice = gasCommodity × x`; `context.js:105` adds the adder). | Yes: low 0.3 × adder higher, high 0.3 × adder lower than the other line (0.7(c + a) vs 0.7c + a). |
| T-9 | Tornado lists every option | accepted | Yes: same as the Dispatch and Site selectors (B20 already proves 2,000 entries do not overflow). | Yes. |
| T-10 | In-cell bars dropped | accepted | Yes: the tornado chart is the graphic; the table is its accessible alternative with every value. | Yes. |
| B-4 | Inspector reads the bridging battery from sizing | accepted | Yes: cannot drift from time-to-power. | **No, corrected:** it cited H1 check 6, whose 10 default-T1 options have no bridging battery. The evidence is tests 12c and 12d on T1 + BESS + solar. |
| T-4 | "Carbon price (Scope 1)" | accepted | Yes: the price applies to Scope 1 in the ledger (`evaluate.js:259`) and to plant marginal cost (`dispatch.js:54`), never to Scope 2. | Yes. |
| L-3 | `<noscript>` wording | accepted | Immaterial. | Yes. |
| D-19 | "! Unmet load" | accepted | Text glyph with the label; status colour paired with text (§16). | Yes. |
| L-10 | `typeof __HOSTED__` guard removed | accepted | Safe for the shipped builds: `build.mjs` puts `__HOSTED__` in `common.define`, used by every bundle. Latent test-only risk noted in section 3, item 11. | Yes ("the test bundle does not include RunProgress.jsx" checked: `tests/view-bundle.mjs` imports Pareto, Site, RunSummary, OptionDetail, BlocksTable, DispatchView, SensitivityView only). |

### 2.4 H2 sections 1, 4 and 5

| Section | Finding | Decision | Reasoning |
|---|---|---|---|
| 1 | Owner decision matches | accepted | Re-checked in code and with the hedge recomputation (2.1, 4a/4b). The carbon notes are O2. |
| 4 | Plan and chart share `--src-*` tokens | accepted | Checked in `DispatchView.jsx:15–16`, `:52–65`. |
| 5 | 4 new records, labelled | accepted | Test 5d: 496 records. |

### 2.5 H3 (browser)

| ID | Finding | Decision | Reasoning | What changed |
|---|---|---|---|---|
| H3-V | 29/29, own checks, axe 0 violations | accepted | Reproduced after this review's changes (section 6). | — |
| H3-NR | Needs-review ids not recorded | accepted | The builder identified them afterwards: only `color-contrast`, checked from computed styles in B26/B27 (0 below the minimum). Re-run here. | — |
| H3-B | Build not run by H3 | accepted | I rebuilt from source; the committed single file at 644c77b was byte-identical to a fresh build (`cmp`). Refreshed again after this review's changes. | `energy-tool-single-file.html` |

## 3. Found during the review

1. **Hedge present value printed with the wrong sign (defect, fixed).** The flag (`evaluate.js:465`) and the option detail (`OptionDetail.jsx:46`) printed `|pv|` after the total's word. Hedge totals and present values can differ in sign (early income, small later costs): 23 of 1,113 T1 PPA options, 28 on T1 + BESS + solar, 0 on T3. Example O12A2ZQY: "a net cost of €0.171 m (present value €0.001 m)", while the PV is a net income of €1.49 k; now "(present value a net income of €0.001 m)" in the flag and "net cost €171 k (present value net income €1.49 k)" in the option detail. The Dispatch tab note shows the total only and was correct. Test 11a now asserts the total's word for every hedge flag and the PV's own word where the signs differ, and renders the option detail of one such option.
2. **Hosted page charset dependency (fixed).** The hosted page has no `<meta charset>` by design; its only non-ASCII character was "…" in the loading message (`index.html:13`). Now `&hellip;`. Test 14 asserts both the single file and the hosted page are ASCII only (esbuild already escapes the bundles).
3. **H2 R30/R33 are verifier errors** (2.2).
4. **§12.6 deferral reason was wrong (record corrected).** BUILD-NOTES said the band waits for stage 5 and the shading for "the representative-period layout of stage 3". The grid-date range is an input record already used by the tornado; the bridging months follow from `bridgeActive` and the plant availability months, which the inspector already computes. The timeline itself is a stage 3 item (BUILD-NOTES line 196). Deferral is still acceptable for a merge to `main`: the gaps are visible and nothing presents them as built.
5. **B-4 evidence (record corrected)** (2.3).
6. **5c, the mechanism:** time-to-power tests capacity against design load at peak PUE; dispatch serves hourly demand with hourly PUE. The battery is needed for the first from month 23 and for the second from month 27. No inconsistency.
7. **O1 is not T3-only.** On T1, all 360 islanded PPA options (C1 = islanded, the connection is backup only, `dispatch.js:205` `capPhys = 0`) deliver 0 MWh of PPA energy. Their headline is accurate (66–93 % of the undelivered volume is import-limited).
8. **Pre-existing, outside the port: C3 on a battery-only bridge.** "Retain for grid services" does not change the battery's dispatch role (`sizing.js:222`: the storage role stays "bridgingSupport"; O8T0KIR discharges 0 MWh in model years 4–6, months 36 on; full grid is month 30). "Retain as prime" keeps counting the 105 MW battery as time-to-power supply in every later month (O1C8NG21). With "Remove", the battery stays in dispatch and the ledger (open point 1). Recorded for the builder; not changed.
9. **Pre-existing: the non-commodity adder on delivered PPA energy is not escalated** (`evaluate.js:247`, `+ d.ppaNetworkCost` outside `elecEsc`), while the same adder on grid energy is. No effect at the default `economics.elecEscalation` = 0. Recorded.
10. **T3 tornado: all seven swings are 0.000 points** while LCOE moves (gas price 166–222 €/MWh on the leader; `c3-edges.mjs`), and on an infinite-LCOE option every `lcoeSwing` is Infinity (shown as "not finite"). Correct arithmetic on a compressed axis (open point 2), but the tab does not say why the swings are zero. Deferred with open point 2.
11. **Latent test risk:** `tests/view-bundle.mjs` does not define `__HOSTED__`; a future test that renders `RunProgress` through it would throw. No current test does. Not changed.
12. **T3 Dispatch tab** says "Full grid connection month 60" for grid options although 0 MW is offered at that date. It repeats the input (full date entered, 0 MW). Minor; not changed.
13. **Accessibility:** no regression found. The tab list scrolls inside itself with an inset focus ring; every chart is a focusable application with an on-screen readout and a polite live region; the charge-level chart's values are in the week table. axe: 0 serious/critical in both themes (section 6).

## 4. Verifier errors

- **H2 R30/R33:** "the week table has no state of charge". It has: `DispatchView.jsx:360` (header "Charge level MWh") and `:365`, whenever the option has a battery.
- **H2 R35 "not recorded":** true at H2 time; measured by the builder afterwards.
- **H1:** no material error. Its 5c "FAILED" is a correct literal check of an expectation that was not the brief's definition.
- **H3:** no error; it left the needs-review ids open, which the builder then closed.

## 5. Numbers before and after this review

`c7-cmp.mjs`, engine of 644c77b vs the working copy, same inputs and seed:

| Fixture | Options | Any numeric, rank, flag-id or severity difference | `grid-ppa` text changed | Leader |
|---|---|---|---|---|
| T1 | 2,000 | 0 | 23 (PV sign) | O1YAUJ8J 92.7124 → 92.7124 |
| T3 | 2,000 | 0 | 0 | O826DRQ 97.1139 → 97.1139 |
| T1 + BESS + solar | 2,000 | 0 | 28 | OOB3CL1 98.9977 → 98.9977 |

Bundle: `dist/app.js` gzip -9 184,020 → 184,098 bytes. Single file 791.0 → 791.3 KB (809,951 → 810,339 bytes). Re-run on the final code (after the record-note change): same result.

## 6. Tests

Run order in `/home/claude/review-port/energy-strategy-tool/app`, Node v22.22.0, 2-core sandbox shared with an Electron build (timings noisy): before any change `npm test`; after the changes `npm run build`, `npm test`, `npm run test:browser`. Raw output: `/home/claude/review-port-scratch/test-before.txt`, `test-after.txt`, `final-build.txt`, `final-test.txt`, `final-browser.txt`.

Build (final): exit 0. `dist/app.js` 561.1 KB (574,577 bytes; 184,098 gzip -9), `dist/worker.js` 190.3 KB, `dist/energy-tool-single-file.html` 791.3 KB, `dist/energy-tool-hosted.html` 791.3 KB; both HTML outputs ASCII only. The committed `energy-tool-single-file.html` was replaced with this build (byte-identical, `cmp`).

`npm test`, before any change: **44/44** (exit 0; T1 18.35 s, T3 16.01 s). After the hedge-sign and charset fixes: 44/44 (T1 12.85 s, T3 19.66 s). Final, after the record-note change: **44/44** (exit 0):

```
T1 run: 2000 options screened of 57028 combinations in 12.95 s (single thread, 1769 distinct dispatch runs, 10616 8760-h years)
T3 run: 2000 options in 12.54 s
PASS 1 (3921 ms) · 2 (1962) · 3 (12) · 4 (122) · 5a (13364) · 5b (0) · 5c (1764) · 5d (0) · 6a (20) · 6b (9) · 6c (48987) · 6d (14094) · 6e (55) · 7 (3148)
PASS 8a (71 ms) · 8b (164) · 8c (43) · 8d (1583) · 8e (14) · 8f (533) · 8g (382) · 8h (79)
PASS 9a (16 ms) · 9b (346) · 9c (116) · 9d (31478) · 9h (3642) · 9e (2572) · 9f (18029) · 9g (26950) · 9i (961) · 9j (340)
PASS 10 (54 ms) · 11a (155) · 11b (51) · 12a (5334) · 12b (702) · 12c (3) · 12d (59) · 12e (321) · 13a (2210) · 13b (344) · 13c (4) · 14 (49)
44/44 tests passed.
```

Detail lines of the changed tests (final run):
- 11a: "T1: 1113 options with a PPA, 1113 with undelivered volume (hedge income 877, cost 236; 23 with a present value of the other sign, named in the flag; flag grid-ppa minor 1113, info 0) … T3: … (hedge income 1113, cost 0; 0 with a present value of the other sign …) … option detail of O12A2ZQY: "PPA hedge (not counted)net cost €171 k (present value net income €1.49 k) on 0.515 TWh not delivered of 6.52 TWh contracted" (header and cell text joined by the tag strip)."
- 14: "single file 791.3 KB and hosted page 791.3 KB: 2 inline scripts each, worker inlined and equal to dist/worker.js, no <script src>, <link href> or other reference, ASCII only; …"

`npm run test:browser` (final, on `dist/energy-tool-single-file.html`; Chromium 141.0.7390.37, Playwright 1.56.0, axe-core 4.10.2; `TMPDIR=/home/claude/review-port-scratch/tmp`): **29/29** (exit 0):

```
PASS B1 (33.0 s) · B2 (0.5) · B3 (3.2) · B4 (0.5) · B5 (0.8) · B6 (3.9) · B7 (15.5) · B8 (1.4) · B9 (0.8) · B10 (0.0)
PASS B11 (45.1 s) · B12 (29.8) · B13 (37.1) · B14 (46.6) · B15 (73.9) · B16 (91.7) · B17 (57.2) · B18 (54.5) · B19 (49.6) · B20 (31.2)
PASS B21 (29.0 s) · B22 (2.2) · B23 (2.7) · B24 (4.1) · B25 (27.4) · B26 (81.6) · B27 (77.9) · B28 (40.2) · B29 (41.3)
29/29 browser checks passed.
Keyboard: chart in 2 Tab + Enter via the skip link (results: 1 Tab + Enter; site plan: 3 Tab + Enter); Tab only from the top: 215 presses (180 in the inputs panel).
Weight-change repaint: median 97 ms (asserted ≤ 300 ms here; §17 target ≤ 100 ms on the 4-core reference machine).
Phone (375 px): tab bar ends at 812 px; active tab content starts at 831 px (bound 1,000 px).
```

axe on every audited state, light and dark: 0 violations (Dispatch 32 rules passed on the leader and on an option with firm plant and a battery; Sensitivity 32). "Needs review" is `color-contrast` only: Dispatch 2,773 / 3,025 nodes, Sensitivity 773, checked from computed styles, lowest 4.86:1 light and 5:1 dark, 0 below the minimum. B28: the hosted page ran in a host-like document, "Copy run log", JSON copied to the clipboard, no download. B29: loading message with scripts off (the `&hellip;` renders as "…"), startup error shown with role=alert. Run times are slower than the builder's (shared machine); no threshold failed.

Tests changed in this review, and why:
- **11a** (`tests/port-tests.mjs`): asserts the `grid-ppa` flag names the hedge total's sign, and the present value's own sign where it differs (23 T1 options); renders the option detail of one such option (O12A2ZQY) and checks its hedge row. The callback became async for the render.
- **14**: asserts the single file and the hosted page are ASCII only.
- No other test changed.

## 7. Owner decisions (not decided here)

### 7.1 O1: PPA options that can never deliver

Facts: on T3 (0 MW grid) 1,113 of 2,000 screened options carry a PPA and 0 deliver; on T1 the 360 islanded PPA options deliver 0. Their default score equals their no-PPA twin's: all 108 twin pairs in the T3 sample tie exactly (the id tie-break, `scoring.js:120`, puts the PPA variant first in 55 of 108), and so do all 41 islanded twin pairs in the T1 sample (the 67 grid-connected T1 pairs differ). The T3 top 10 holds 4 PPA options (ranks 1, 2, 7, 10, hedge PV €42.2–84.4 m); the leader O826DRQ "… PPA hybrid 50 %" shows a hedge income of €90.3 m (PV €42.2 m) that is outside the score. This is consistent with the decision as worded and with the brief (§6.2: the PPA "flows over the grid connection"; §9.2 "capped by import capacity").

| Option | What it does | Trade-offs |
|---|---|---|
| A. Keep (current) | PPA variants generated; settlement shown as the hedge; flag explains it | No change. The leader's name can list a PPA that does nothing; on T3 56 % of the 2,000 sampled slots go to PPA variants that cannot differ from a no-PPA option in the default score; CFE scoring rewards them (7.2). |
| B. Treat C13/C14 as n/a where no PPA energy can ever be delivered (C1 = islanded, or 0 MW offered in every month) | §7.2 step 2(d) collapse to "n/a", listed in the run summary | Fewer, distinct options; no undeliverable PPA in a leader's name. Changes the T3 and T1 option sets and sampling. Needs the owner to rule that a never-deliverable PPA is "irrelevant" rather than "constrained" (§2 principle 5 keeps constrained combinations). The hedge would no longer be reported for them. |
| C. Keep generating; add a distinct flag ("PPA cannot be delivered: the option imports nothing in normal operation") and break exact score ties in favour of the option without the PPA | Visible, no option removed | Keeps principle 5 literal. Needs a tie-break rule the brief does not define (§11 ranks by weighted score only). |

### 7.2 O2: carbon metrics count undelivered PPA volume

- **CFE** (§9.6 "24/7 matching of on-site renewables + PPA against hourly load"; `dispatch.js:372` counts `min(contracted, residual load)` every hour). T3 PPA options: CFE P10/P50/P90 46.5/61.4/66.8 % with 0 MWh delivered and 0 MWh imported, against 0/0.45/0.88 % without a PPA. Under the CFE carbon metric all 108 T3 PPA options outscore their twins, by up to 24.81 points, and the T3 leader becomes O1Q4ILX5 (0 MWh delivered). Recomputed from the hourly records over the dispatched years (unweighted, so not the run's 20-year figure): T3 leader 46.9 % with the current rule (run figure 47.9 %), 1.0 % if the PPA term is capped at the site's grid consumption in the hour or at delivered PPA; T1 leader 65.8 % under all three (run figure 66.7 %).
- **Market-based** (§9.6 "PPA certificates applied annually"; `evaluate.js:268` uses the whole contract against imports). No effect on T3 (no imports, market = location). T1 top 10: 0.1–23.6 g/kWh now; 38.1–45.1 g/kWh with certificates limited to delivered volume; location 113–114 g/kWh. Neither is the default metric.

| Option | Trade-offs |
|---|---|
| A. Keep the brief literal (current) | No change. Under the CFE metric, contracted volume that cannot reach the site enters the score, which sits uneasily with "no PPA income without physical delivery" (the decision covers settlement, not carbon). |
| B. CFE: cap the PPA term at the site's grid consumption in the hour (grid to load + PPA delivered); market-based unchanged | Follows hourly-matching practice (clean supply counts against load drawn from that grid in that hour) and still credits a virtual PPA on a grid-connected site. T3 PPA options fall to their no-PPA CFE; T1 leaders barely move. Changes CFE for options with on-site firm plant or islanding. |
| C. Count only delivered PPA volume in both CFE and market-based | Mirrors the settlement decision exactly. Stricter than GHG Protocol market-based practice for virtual PPAs; T1 market figures rise by 21–38 g/kWh on the top 10. |

### 7.3 O3: `grid-ppa` headline and severity

Facts: severity is minor whenever any MWh is import-limited (`evaluate.js:464`). T1: the 753 grid-connected PPA options have 0.002–0.501 % (median 0.032 %) of their undelivered volume import-limited, the rest above the load in the hour, yet all read "PPA limited by import capacity" (minor). The 360 islanded T1 options and all T3 options are 66–93 % import-limited. The message body gives both parts correctly. Severity does not reach the score.

| Option | Trade-offs |
|---|---|
| A. Keep | No change; the headline overstates the import limit for 753 T1 options. |
| B. Headline follows the larger part; minor only above a share threshold (e.g. 1 % of the contract, a new §18 record) | Text and severity only; minor flag counts fall on T1. Needs a threshold value. |
| C. Two flags: §15 "PPA limited by import capacity" (minor, with its own MWh value and threshold, as §15 asks of every flag) and an info flag "PPA volume above the load (settled as hedge)" | Clearest; matches the §15 flag fields. More flags per option; flag counts change. |

### 7.4 Still open from the builder's list

Open point 2 (T3 cost axis compressed by near-zero-delivery options) remains the main limitation on T3: the cost axis separates nothing there, so the T3 ranking and the T3 tornado come from carbon, time-to-power and deliverability alone. It predates this slice and is the owner's (Brief issue 21). Open point 10 can close (2.1, 5c).

## 8. Verdict

Merge-ready after the listed fixes (applied in this working copy). The engine, the PPA rule and the two new tabs are correct and reproduce the run; the fixes are text and robustness only and change no number; the remaining items are owner decisions or later-stage work that is visible and recorded.
