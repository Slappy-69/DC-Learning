# H6 verification: breakeven table (work package 17) and Monte Carlo (work package 18)

Verifier: Claude Haiku 5.5 (independent verifier, check H6). Date: 2026-10-26.
Commit checked: 33f9c1a, through a `git archive` export at `/tmp/claude-0/-home-claude/382c92e7-9c54-5cd5-9bef-5b275a3e75d1/scratchpad/h6/head/` (the export's `energy-strategy-tool/` folder). The working tree was not used for code.
Scope: BRIEF §13.1–13.3, §14 and §17 with their "As built" notes; OPEN-QUESTIONS 93–104; `app/BUILD-NOTES.md` (work packages 17 and 18); `docs/BUILD-PLAN.md` (packages 17 and 18); the code named in BRIEF-H6.md; tests 45 and 46 (read, not run); user guide chapters 13, 22, 27, 29, 44, 46, 54 and 56, and appendix A.
Rules followed: no change to the repository except this report; no git command that changes state; no push; no network; no browser test (the lead ran them); scripts and logs in `/tmp/claude-0/-home-claude/382c92e7-9c54-5cd5-9bef-5b275a3e75d1/scratchpad/h6/work/`; one Node process at a time; timings were run after every correctness run, with the processor count and load average stated; no browser test process was running during the timings (checked with `ps`).

## What I checked and how

- Read the brief, the open questions, the build notes, the build plan, the code, the tests and the guide sections listed in BRIEF-H6.md.
- Built the T1 reference run in Node (`referenceT1`, `runModel`) and re-derived the figures with my own code: my own weighted score and order (`own.mjs`), my own tornado and driver application (`own.mjs`, `own-mc.mjs`), my own Latin hypercube, triangular values and normal copula (`own-mc.mjs`, `t2-sampler.mjs`), and direct re-evaluation with `evaluateOption` and `buildContext`. The engine's physics was used throughout; the engine's ordering, scoring, drivers and sampler were not trusted.
- Breakeven table: competitors (`t1-be.mjs`), drivers (`t1-be.log`, `t1-be-own-tornado.json`), every flip and every "no flip" cell with a 24-point scan (`t1-be-flips.log`), a 60-point scan of six continuous drivers (`t1-fine.log`), the compliant-first setting (`t1-cf.log`), a variant with failing options (`t1-failcf-cf1.log`, `t1-failcf-cf0.log`), the WACC and period cases outside the record range (`t1-wacc.log`, `t1-period.log`), the competitor #3 check (`t1-comp3.log`), the representative-day setting (`t1-repdays.log`), and the summary and PDF text (`t1-report.log`, `t1-pdf-text.txt`).
- Monte Carlo: an exact re-count of the engine's own 100-sample hypercube with my own ordering and robust counts, with and without the layout (`t1-mc-compare.log`, `mc-engineU-N100-s1-f0.log`, `mc-engineU-N100-s1-f1.log`); an independent 300-sample run with my own sampler (`mc-ownU-N300.log`); a full-year run (`mc-engineU-N100-s0-f0.log`); the 5 % band (`mc-band5.log`); the 1,000-sample run (`t1-edge-base-n1000.log`); sampler properties (`t2-sampler.log`); the driver ranges (`t0-ranges.log`); representative-day screening against the full year (`t1-screen.log`, `t1-base-order.log`); robust pick at 100 and 300 samples (`t1-robust.log`).
- Edge cases on copies of the T1 run, labelled as synthetic where so: one option, fewer than 20 adequate options, a pinned option (`t1-edge-one.log`, `t1-edge-few.log`, `t1-edge-pin.log`). Run unchanged by the breakevens and the Monte Carlo (`t1-unchanged.log`).
- Documents: each figure in guide chapters 22, 27, 29, 46 and 54 and in the two build-note sections, against the run. Appendix A checked with `t0-appx2.log`.
- Speed and responsiveness, last: `timing.log` (final run, one job at a time, load average 1.15–1.42 on 2 cores); `timing-slices.log` and `timing-slices2.log` (step durations). Earlier console runs at 15:34 and 15:37 are quoted where they add evidence; their output was not saved to a file.

Runs: all runs were sequential. The longest single run took about 100 seconds (`t1-fine.mjs`); no run needed a line in a report log beforehand, and I did not write one. The first batch of correctness runs happened before any timing.

## Results

Status key: VERIFIED = the run or code agrees with the claim. FAILED = the run or code contradicts the claim, or the behaviour is wrong or misleading. NOT VERIFIED = not checked, with the reason. "(reading)" means checked by reading the code only.

| ID | Check | Status | Evidence (numbers; file:line; log) |
|---|---|---|---|
| B1 | Competitors: #2, then the best of each other strategy from the top-five cards, filled from next-ranked options (OQ 93) | FAILED (MED-1) | Engine list #2, #5, #7, #11, #16; top-five cards #1, #2, #5, #7, #11 (`t1-be.log`). Code takes six cards: `breakevens.js:52`. Option #3 has no flip against #1 on the eight drivers (`t1-comp3.log`). |
| B2 | #2 is the next option with different figures | VERIFIED | `breakeven.js:50`; #2 is O67PEWY (`t1-be.log`). |
| B3 | Fill from next-ranked options when there are fewer strategies | VERIFIED (reading) | `breakeven.js:57–60`. Not exercised: T1 has enough strategies. |
| B4 | Drivers: the eight largest weighted-score swings of the leader over sixteen (OQ 94) | VERIFIED | My own tornado (`t1-be.log`; `t1-be-own-tornado.json`): same eight drivers, same order, swings equal to within 1e-6. |
| B5 | Each reported flip: order changes between the bracket ends, not before (OQ 95) | VERIFIED | `t1-be-flips.log`: 2 flips (grid date against #7, 13 to 14 months; capex against #2, 1.4063 to 1.4219, reported ×1.41). 0 wrong. |
| B6 | Each "no flip" cell: order at the range end, and no change on a finer scan | VERIFIED | `t1-be-flips.log`: 78 cells. `t1-fine.log`: 59 more cells on six continuous drivers at 60 points a side; 0 disagreements. |
| B7 | Tolerance: 2 % of the range; 1 for whole-number drivers | VERIFIED | `t1-be-flips.log`: grid-date bracket 1 month; capex bracket 0.0156 (limit 0.016). |
| B8 | Order with "rank requirement-compliant first" on (OQ 96) | VERIFIED | `t1-cf.log` (T1: 2 flips, 0 wrong); `t1-failcf-cf1.log` and `t1-failcf-cf0.log` (variant with C5 = none: 0 flips; the compliant-first-off run has non-compliant competitors). No flip depends on compliance, so the rule is checked by the ordering agreement and by reading. |
| B9 | Order when the leader is not adequate | NOT VERIFIED | No real run puts a non-adequate option first. A synthetic change would be inconsistent, because re-runs re-evaluate adequacy. |
| B10 | Blind spot disclosed (OQ 95); no missed swap in T1 | VERIFIED | Disclosed in `BreakevenPanel.jsx:111`, the PDF and guide chapter 27. No missed reversal in T1 (`t1-fine.log`, `t1-be-flips.log`). |
| B11 | Nearest-flip sentences in summary part 5 and in the PDF match the table | VERIFIED | `t1-report.log`: summary and PDF give "#7 would lead if the grid full-connection date slipped by 14 months or more; #2 would lead if capex rose to × 1.41", as the table has them. |
| B12 | Distance measure: share of the driver's range from today's value | VERIFIED | `breakeven.js:211`, checked by hand: 14 ÷ 30 = 46.7 %; 0.414 ÷ 0.8 = 51.8 % (`t1-report.log`). |
| B13 | Current value not at the middle of the range | VERIFIED | Grid date (range −6 to 24, base 0) and factor drivers (base 1); distance uses absolute offsets (`t0-ranges.log`). |
| B14 | Current value outside the record range | FAILED (LOW-2) | WACC 13 % against 4–12 %: row "low 0.04, base 0.13, high 0.12" (`t1-wacc.log`). Period 30 against 15–25: row "low 15, base 30, high 25" (`t1-period.log`). No wrong flip appeared; the scans agree. |
| B15 | Stale breakevens for a different run (panel, header, summary, PDF) | VERIFIED (reading) | Key by `inputHash`, weights, cost and carbon metric, compliant-first (`BreakevenPanel.jsx:15`; `run.js:329`); `latestBreakevens` checks the key (`BreakevenPanel.jsx:17–20`); summary checks `leaderId` (`summary.js:314`); PDF (`App.jsx:174`). Browser not run. |
| B16 | Base points agree with the full-year re-runs when Dispatch model = representative days | FAILED (MED-4) | `t1-repdays.log`: verified top 10 agree exactly; #11 and #16 differ by 0.039 points (93.574 against 93.613; 93.412 against 93.452). Flips unchanged. |
| B17 | One-option run: no throw; summary wording | FAILED (LOW-1) | No throw. Summary part 5: "none of the 0 competitors overtakes it" (`t1-edge-one.log`; `summary.js:318`). |
| B18 | Breakeven speed in Node (224 re-runs) | VERIFIED | `timing.log`: 5.41, 4.02, 4.15 s (median 4.15 s). The §17 target of 3 s is not met, as the as-built note says. |
| M1 | Thirteen drivers, as OQ 98 | VERIFIED | `montecarlo.js:25`; excludes IT load, period and flexibility trigger. |
| M2 | Triangular values, mode at the current value, at each end | VERIFIED | `montecarlo.js:61–66, 117`; triangular mean check `t2-sampler.log` (2.33333 for 1, 2, 4). |
| M3 | Current value outside the record range | FAILED (LOW-2) | `montecarlo.js:117` widens the range to include the current value. WACC 13 %: sampled P90 0.1253, above the record high 0.12 (`t1-wacc.log`). Not in guide chapter 46. |
| M4 | Rounding of grid date and test hours | VERIFIED | `montecarlo.js:118`. |
| M5 | Each driver reaches every option in the same way (e.g. PUE) | VERIFIED (reading) | Cooling multiplier applied to every cooling profile (`context.js:188–191`). Capex lines (`evaluate.js:104–107`). Capacity factors (`dispatch.js:124, 265–266`). Grid-connection scope: LOW-8. |
| M6 | Latin hypercube: one sample per stratum for uncorrelated drivers; seed fixed | VERIFIED | `t2-sampler.log`: 300 distinct strata for each uncorrelated driver; seed 20261025 (`montecarlo.js:99`). |
| M7 | Copula keeps triangular marginals; rank correlations near 0.6 and 0.8 | VERIFIED | `montecarlo.js:77–80`. `t2-sampler.log`: Spearman 0.65 (grid–gas), 0.80 (capex–battery), 0.80 (capex–grid); KS D ≤ 0.041 on all sampled drivers (critical value about 0.10). |
| M8 | Battery and grid connection capex correlated at 0.8 (OQ 99; guide chapter 46) | FAILED (LOW-3) | `t2-sampler.log`: correlation 0.63 (battery–grid), as the star structure gives 0.8 × 0.8 = 0.64. |
| M9 | An independent Latin hypercube gives the same picture | VERIFIED | `mc-ownU-N300.log`: leader 81.3 %, top three 98 %, #7 17 %, LCOE P10–P90 144.5–172.7; engine 83 %, 98 %, 16 %, 145–173 (`t1-robust.log`). |
| M10 | Counts, order and percentiles: engine equals a re-count of the same samples | VERIFIED | `t1-mc-compare.log`: difference 0.00e+0 in probabilities and LCOE percentiles. Layout off (`mc-engineU-N100-s1-f0.log`) and on (`mc-engineU-N100-s1-f1.log`) give identical tables. |
| M11 | Probabilities add to 1 (leading) and 3 (top three) | VERIFIED | `t1-mc-compare.log`: sums 1.000000 and 2.999999999999999. |
| M12 | Ties: in the sample order and in the robust pick | VERIFIED | `montecarlo.js:139, 162` (ties by option code; robust ties by lead frequency, then rank). At 100 samples #1 and #7 are both 100 % robust; #1 is picked by tie-break (`t1-robust.log`). |
| M13 | Percentiles: linear interpolation, as documented | VERIFIED | `montecarlo.js:84–89`; guide chapter 46 step 5; recount matches (`t1-mc-compare.log`). |
| M14 | Representative-day tier: top-20 order and leader unchanged against the full year | FAILED (MED-2) | Base: 4 of 20 positions differ (`t1-base-order.log`). 21 cases (base and 20 samples): leader differs in 1; top three differs in 2; full top-20 order differs in 13 (`t1-screen.log`). Full-year Monte Carlo: #1 leads in 83 % against 82 % (`mc-engineU-N100-s0-f0.log`; `mc-engineU-N100-s1-f0.log`). |
| M15 | Approximation disclosed in the panel, the summary and the PDF | FAILED (MED-2) | Panel says only "adequacy is approximate" (`UncertaintyPanel.jsx:131`). PDF says "representative-day dispatch" (`report.js:337`). Summary says nothing (`summary.js:289–290`). |
| M16 | Robust band 1 % (OQ 102); the 5 % claim | VERIFIED | `montecarlo.js:36`. `mc-band5.log`: at 5 % each top-20 option is within the band in at least 93 % of samples (lowest #8). At 1 %, shares run from 18 % to 100 % (`mc-engineU-N100-s1-f0.log`). |
| M17 | Robust pick stable and worded as the numbers show | FAILED (MED-3) | 300 samples: #7 100.00 %, #1 99.67 % (`t1-robust.log`). 100 and 1,000 samples: #1 (`t1-robust.log`; `t1-edge-base-n1000.log`). Panel shows "100 %" for both (`UncertaintyPanel.jsx:21, 99`). |
| M18 | Partial results every ten samples | VERIFIED | `montecarlo.js:147`; `UncertaintyPanel.jsx:47–59`. |
| M19 | Page stays responsive: no compute step over 50 ms | FAILED (MED-5) | Node, final run (`timing-slices2.log`): breakevens 13 of 216 steps over 50 ms, longest 170 ms; Monte Carlo 0 of 2,009, longest 39 ms (`timing-slices.log`: 39.5 ms). Earlier console runs: breakevens up to 285 ms; Monte Carlo up to 88 ms. Browser not run. |
| M20 | Header strip, summary parts 1 and 4, and PDF section 7 use the 300-sample results | VERIFIED | `t1-report.log`: "In 300 Monte Carlo samples its LCOE is €145 to €173/MWh (P10 to P90; P50 €159/MWh)"; "leads in 83 %", "top three 98 %". PDF section 7 (`t1-pdf-text.txt`). Header formula `App.jsx:307`. |
| M21 | Results shown only for the run and weights on screen | VERIFIED (reading) | `UncertaintyPanel.jsx:14, 17`; `summary.js:169`; `report.js:331`. |
| M22 | Edge: fewer than 20 adequate options | NOT VERIFIED | Synthetic flags only (`t1-edge-few.log`: no throw). The Monte Carlo recomputes adequacy in each sample, so the flags had no effect. Real inadequate samples occur (#8 adequate in 93 % of samples; `mc-engineU-N100-s1-f0.log`). |
| M23 | Edge: one option | VERIFIED | `t1-edge-one.log`: one row, leading probability 1.000000, no throw. (Breakeven wording: B17.) |
| M24 | Edge: pinned options (engine path) | VERIFIED | `t1-edge-pin.log`: pinned #41 gives 21 rows. No interface control sets `pinned` (LOW-7). |
| M25 | Samples 100, 300 and 1,000 | VERIFIED | 100: `t1-mc-compare.log`. 300: `timing.log`. 1,000: `t1-edge-base-n1000.log` (leads 82 %, top three 98 %, LCOE P10–P90 145.6–172.4; no throw). |
| M26 | A cancelled run leaves no stale result | NOT VERIFIED | Reading only: the timer is cleared on a key change and on unmount (`UncertaintyPanel.jsx:31–34`; `BreakevenPanel.jsx:31–37`). Not run in a browser. |
| M27 | Division by zero or NaN | VERIFIED | No throw in any run; the zero-sample guard is at `UncertaintyPanel.jsx:75`; `montecarlo.js:85–89` returns NaN only with no finite values. Not reached. |
| M28 | The run is not changed by the breakevens or the Monte Carlo | VERIFIED | `t1-unchanged.log`: identical snapshot of id, rank, score, LCOE, carbon, deliverability, adequacy, flags, weights and ranges after the breakevens, after the Monte Carlo and after both. |
| M29 | Monte Carlo speed in Node | VERIFIED (figures) | `timing.log`: 100 samples 3.89–5.17 s (median 4.10 s); 300 samples 11.12–11.69 s (median 11.44 s). The §17 target of 8 s is not met, as the as-built note says. |
| S1 | Full-year against representative days, per re-run | FAILED (LOW-6) | `timing.log`: full year 11.01 s for 100 samples against 4.10 s representative days (ratio 2.7); first console run 9.59 s against 4.33 s (2.2). Full year is 5.5 ms a re-run (no layout), not the 12 ms in the notes. |
| S2 | Browser timings (B39, B40; 115 ms longest wait) | NOT VERIFIED | Browser tests not run (brief rule). |
| D1 | Guide chapter 27: competitors "the strategies of the top-five cards"; T1 list | FAILED (MED-1) | `03-part3b.md:253` gives the rule; `03-part3b.md:260` lists #16. |
| D2 | Guide chapter 27: T1 breakeven figures (224 re-runs, drivers in order, two flips) | VERIFIED | `03-part3b.md:260`; `t1-be.log`; `t1-be-flips.log`; `timing.log`. |
| D3 | Guide chapter 27: representative days "adequacy is then approximate"; "about three times faster"; "about 30 s in a browser" | FAILED (MED-2, LOW-6) | `03-part3b.md:269`. Browser figure: NOT VERIFIED. |
| D4 | Guide chapter 27: T1 Monte Carlo example (82 %, 98 %, 17 %, €145–171) and "the robust pick is the leader itself" | FAILED (MED-3) | Figures verified at 100 samples (`t1-mc-compare.log`; `mc-engineU-N100-s1-f0.log`). The robust sentence (`03-part3b.md:276`) holds at 100 samples only by tie-break. |
| D5 | Guide chapter 22: summary text and part 5 example | VERIFIED | `03-part3b.md:35` and `t1-report.log` agree. |
| D6 | Guide chapter 29: PDF section 7 shows the breakevens and Monte Carlo only when run for the run | VERIFIED | `03-part3b.md:347`; `report.js:317, 331`. |
| D7 | Guide chapter 46: breakeven method (steps 1–4; nearest-flip definition) | VERIFIED | `breakeven.js:77–169, 202–215`. |
| D8 | Guide chapter 46: Monte Carlo method | FAILED (LOW-2, LOW-3, LOW-5) | Step 2 silent on values outside the range (`04-part4b.md`, Values). Step 1 "the capex factors, ρ 0.8". Step 3 "without a layout", which is not true with compliant-first on (`montecarlo.js:102`). Steps 4–5, robust band and tie-break: verified. |
| D9 | Guide chapter 54: limitations | FAILED (MED-2) | `06-part6.md:42` "adequacy is approximate" only. "About 30 s in a browser": NOT VERIFIED. `06-part6.md:43` "about 5 s or more": VERIFIED (4.0–5.4 s, Node). |
| D10 | Guide chapter 56: status rows for WP17 and WP18 | VERIFIED | `06-part6.md:155–159`. |
| D11 | Guide chapter 13: sensitivity paragraph | VERIFIED | `02-part2.md:596`. |
| D12 | Appendix A: breakeven records (WP17) and their clamps | VERIFIED | `07-appx-registry.md:827–829`; `breakeven.js:27–28` (1–10 and 1–16). |
| D13 | Appendix A: Monte Carlo records (WP18) and the record count | FAILED (MED-6) | 0 of 7 `uncertainty.*` listed; 3 of 3 breakeven listed; count line says 573 (`07-appx-registry.md:3`; `t0-appx2.log`). |
| D14 | Build notes WP17 figures | VERIFIED | 224 re-runs; 4.0–5.4 s; two flips; competitors and drivers as the code gives (`t1-be.log`, `timing.log`). |
| D15 | Build notes WP18 figures | FAILED (LOW-6) | 100 samples 4.8 s (measured 3.9–5.2 s) and 300 samples about 12 s (measured 11.1–11.7 s) verified. "About 12 ms with the full year" not reproduced (5.5 ms, no layout). |
| D16 | Brief §17 as-built notes ("not met") | VERIFIED | Measured times agree with "not met" for the breakeven (≤3 s) and the Monte Carlo (≤8 s). |
| T1 | Test 45: covers what the record says | FAILED (LOW-10) | `breakeven-tests.mjs:29` asserts the six-card pool. No compliant-first run, no non-adequate leader, no current value outside the range, no one-option case. |
| T2 | Test 46: covers what the record says | FAILED (LOW-10) | One correlated pair checked (grid–gas) and capex–battery; no battery–grid pair; stratification checked for uncorrelated drivers only; no outside-range case; no robust tie; no check of approximation wording. |
| T3 | Test suite run | NOT VERIFIED | Tests 45 and 46 need the `run-tests.mjs` harness; judged by reading only. |

Counts: VERIFIED 43; FAILED 20; NOT VERIFIED 5; 68 checks in all.

## Findings

### High

None.

### Medium

**MED-1. Competitor pool uses six strategy cards, not the top five.**
- What: OQ 93 names "the strategies of the top-five cards" and fills from the next-ranked options. The code takes the first six cards. In T1 this puts #16 in the table in place of #3.
- Where: `app/src/engine/breakeven.js:52` (`topCards(run.options, n + 1)`); test 45, `app/tests/breakeven-tests.mjs:29`; guide `03-part3b.md:253` and `:260`.
- Evidence: top-five cards #1, #2, #5, #7, #11; table #2, #5, #7, #11, #16 (`t1-be.log`). Option #3 has no flip against #1 on the eight drivers (`t1-comp3.log`).
- Why Medium: the record and the code disagree on which options are tested, and a missed swap is possible in another run. T1 results do not change.
- How it shows: the table and the PDF list #16 and omit #3, with no note.
- Fix: take the strategy pool from `topCards(run.options, n)` and fill from the next-ranked options with different figures; change test 45; or amend OQ 93 if six was meant, and say so in the guide.

**MED-2. The representative-day tier can change the order and the leader, and the warning says only "adequacy".**
- What: the Monte Carlo ranks each sample on representative days. The order of the top 20, and sometimes the leader, differs from the full year. Panel, summary and PDF say only that adequacy is approximate (PDF says only "representative-day dispatch").
- Where: `app/src/components/UncertaintyPanel.jsx:131`; `app/src/report/report.js:337`; `app/src/engine/summary.js:289–290` (no caveat); guide `03-part3b.md:269` and `06-part6.md:42`.
- Evidence: base, 4 of 20 positions differ (`t1-base-order.log`). Base plus 20 samples: leader differs in 1 (sample 20: ONXOWB0 against OP13Y1Y), top three differs in 2, full top-20 order differs in 13 (`t1-screen.log`). Full-year Monte Carlo, 100 samples: #1 leads in 83 %, against 82 % on representative days (`mc-engineU-N100-s0-f0.log`; `mc-engineU-N100-s1-f0.log`).
- Why Medium: the disclosed caveat is narrower than the effect. In T1 the headline moves by one point, so no figure is wrong here.
- How it shows: a user reads "approximate adequacy" and takes the order as exact.
- Fix: say the order and the leader can differ from the full year, and how often for this run; or run the top 20 on the full year by default; or check the leader's sample on the full year.

**MED-3. The robust pick is reported on a one-sample margin, and the panel shows the same figure for both options.**
- What: at 300 samples #7 is "the robust pick, not the leader". #7 is within the band in 300 of 300 samples; #1 in 299. The panel rounds to whole per cent, so both read "100 %". The summary says "is #7, not the leader". The guide calls the non-leader pick "the safer bet". At 100 and 1,000 samples the pick is #1, by tie-break.
- Where: `UncertaintyPanel.jsx:21` (`pc` rounds to whole per cent) and `:99`; `summary.js:289`; `report.js:337`; guide `03-part3b.md:271` and `:276`.
- Evidence: `t1-robust.log`; `t1-edge-base-n1000.log`; own sampler `mc-ownU-N300.log` (both 100 %, #1 by tie-break).
- Why Medium: the number is right, but the statement rests on one sample and reads as a finding.
- How it shows: a user is told to consider #7 as the safer bet on a difference of one sample.
- Fix: show one decimal place; say "tied within sampling error" when the gap is smaller than that error; drop "safer bet" from the guide unless the gap is clear.

**MED-4. The breakeven base and its re-runs can use different models when the Dispatch model is representative days.**
- What: with "Dispatch model" set to representative days, options beyond the verified top ten keep representative-day figures in the run. The breakeven table takes its base from the run but re-runs on the full year.
- Where: `app/src/engine/run.js:207` (representative days when `screeningModel` is `'repDays'`); `verify.js:19`; `defaults.js:921–923` (`screeningModel`; `verifyTop` = 10); `app/src/components/InputsPanel.jsx:304` (the control); `breakeven.js:85–102` (base from `baseScore`; re-runs through `evaluateOption` without `rep`).
- Evidence: `t1-repdays.log`: verified top ten agree exactly. #11 and #16 differ by 0.039 points (93.574 against 93.613; 93.412 against 93.452) and by 0.09 €/MWh of LCOE. Flips unchanged (2).
- Why Medium: a realistic route. A competitor within about 0.04 points of the leader could show a false flip next to today's value. Not seen in T1.
- How it shows: a false flip, or a false "no flip", with no warning.
- Fix: score the base points with the same model as the re-runs, or re-run every competitor at the base; otherwise say the base uses the run's model.

**MED-5. Compute steps exceed 50 ms; the 25 ms slicing does not bound them.**
- What: the breakeven table runs one re-run per timer tick, and a tick can include building a context for a new driver value (about 150–290 ms in Node). The Monte Carlo builds the context for each sample inside one step (up to about 90 ms in Node). The brief (§17) requires no compute task over 50 ms; the notes say the page stays responsive.
- Where: `breakeven.js:85–92, 113–141`; `BreakevenPanel.jsx:44–58`; `montecarlo.js:111–126`; `UncertaintyPanel.jsx:47` (the 25 ms check runs only between steps).
- Evidence (Node, 2 cores, nothing else running): `timing-slices2.log` (final): breakevens 13 of 216 steps over 50 ms, longest 170 ms; Monte Carlo 0 of 2,009, longest 39 ms (`timing-slices.log`). Earlier console runs: breakevens 9 of 216 steps, longest 179 ms; in another run 285 ms; Monte Carlo longest 52 ms and 88 ms.
- Why Medium: a missed performance rule with a realistic route (any run of the breakeven table). The browser figure in the notes (115 ms, B40) was not re-run.
- How it shows: the page stops for a fifth of a second or more during the run.
- Fix: yield inside the context build, or split the set-up of each driver value and each sample into their own steps; then correct the notes.

**MED-6. Appendix A lacks the seven Monte Carlo records and still says 573 records.**
- What: the appendix claims every default in the registry; the seven `uncertainty.*` records are missing.
- Where: `docs/user-guide/src/07-appx-registry.md:3` (573 records); Sensitivity section, lines 819–829 (breakeven records only). Build plan package 18 names appendix A; build notes WP17 say appendix A was regenerated at 566 records; not regenerated after WP18.
- Evidence: `t0-appx2.log`: 0 of 7 `uncertainty.*` listed; 3 of 3 breakeven listed; registry 573.
- Why Medium: a wrong figure in a document and a records rule not followed.
- Fix: regenerate appendix A from the registry and check the count.

### Low

**LOW-1. One-option run: "none of the 0 competitors overtakes it".** Where: `summary.js:318`. Evidence: `t1-edge-one.log`. Fix: when there are no competitors, say that no other option was available to test.

**LOW-2. The breakeven search and the Monte Carlo assume the current value is inside the record range.** Outside it, the "Higher" side covers values below today's value, because the walk goes the other way. The Monte Carlo widens its range to include today's value without saying so. Where: `breakeven.js:126, 149–150`; `montecarlo.js:117`; guide chapter 46 (Monte Carlo step 2 says "from its low value to its high value"). Evidence: `t1-period.log` (row low 15, base 30, high 25); `t1-wacc.log` (row low 0.04, base 0.13, high 0.12; sampled P90 0.1253 against record high 0.12). No wrong flip appeared; a flip in that region would read "rose to" for a lower value. Fix: label the sides by value, not by direction; flag an input outside its range; state the widening in the guide.

**LOW-3. Battery and grid connection capex correlate at about 0.64, not 0.8.** Where: `montecarlo.js:28–31, 77–80` (both tied to the all-lines factor at 0.8, so the pair is 0.8 × 0.8); `UncertaintyPanel.jsx:130` (shows only the battery pair); guide chapter 46 step 1; OQ 99. Evidence: `t2-sampler.log` (normal-score correlation 0.634). Fix: state the implied 0.64, or use a 3 × 3 correlation matrix.

**LOW-4. After the copula, correlated drivers do not occupy one stratum per sample.** Evidence: `t2-sampler.log`: 189 (gas price), 195 (battery capex) and 182 (grid capex) distinct strata of 300; uncorrelated drivers 300. Marginals stay uniform (KS D 0.030, 0.028, 0.039; critical about 0.10). Where: `montecarlo.js:70–82`; guide chapter 46 step 1; test 46 checks uncorrelated drivers only. Fix: say "one stratum before the copula"; add a marginal test for correlated drivers.

**LOW-5. Two stale statements.** `montecarlo.js:11` says the robust pick uses 5 %; the code and the record use 1 % (`montecarlo.js:36`; `defaults.js:702`). Guide chapter 46 step 3 says the re-runs are "without a layout"; `montecarlo.js:102` uses the layout when compliant-first is on. Fix: correct both.

**LOW-6. Speed claims do not match the measurements.** Guide chapter 27 (`03-part3b.md:269`) and OQ 100 say representative days are "about three times" faster. Measured: 2.7 times in the final run (`timing.log`: 11.01 s against 4.10 s) and 2.2 times in the first console run (9.59 s against 4.33 s). The build notes say "2.4 ms a re-run with representative days; about 12 ms with the full year". Measured: 2.05 ms (representative days) and 5.5 ms (full year, no layout). The 12 ms may include the layout; not measured here. Fix: state the measured ratio and whether the layout is included.

**LOW-7. Pinned options cannot be set from the interface.** The engine includes pinned options in the Monte Carlo (`montecarlo.js:97`). Nothing in `app/src` sets `pinned` to true (`run.js:286` sets it to false). Brief §13.2 and the notes say "and pinned ones" without saying so. Evidence: `t1-edge-pin.log` (synthetic pin; 21 rows; no throw). Fix: say so in the notes, or add the control.

**LOW-8. "Grid connection capex" covers the connection charge and the cable route only.** `evaluate.js:104–107` applies the factor to lines beginning "Grid connection charge" or "Grid cable route"; the substation line (`evaluate.js:140`) is not scaled by it. The registry label is "Grid connection capex" (`defaults.js:874`). Fix: the owner to decide whether the substation belongs in the driver (a judgement); then say which lines are scaled.

**LOW-9. Summary part 5 omits the caveat that a swap between checked points can be missed.** The panel (`BreakevenPanel.jsx:111`) and the PDF say it; the summary (`summary.js:314–322`) does not. Fix: add one clause.

**LOW-10. Tests 45 and 46 leave gaps; test 45 asserts the six-card pool.** Test 45 (`breakeven-tests.mjs:29`) has no compliant-first run, no non-adequate leader, no current value outside the range and no one-option case. Test 46 checks one correlated pair (grid–gas) and capex–battery, not battery–grid; stratification only for uncorrelated drivers; no outside-range case; no robust tie; no check of approximation wording. Fix: add those cases; change test 45 to the agreed pool.

**LOW-11. Panel wording.** `UncertaintyPanel.jsx:92` says "about 10–40 s on this device" for up to 1,000 samples. In Node, 300 samples took 11.1–11.7 s (`timing.log`), so 1,000 take about 40 s there, and longer in a browser (not measured). `BreakevenPanel.jsx:74–75` and the PDF's breakeven heading fix "five competitors" and "eight drivers", though both are run settings (`defaults.js:708–709`). Fix: compute the figures from the settings and the sample count.

## Could not check

- Browser behaviour: rendered text, the 25 ms slices as seen by the user, the 115 ms and 30 s browser figures, the cancel path in a browser, the header rendering. Browser tests were not run (brief rule).
- Tests 45 and 46 as run: not run (they need the `run-tests.mjs` harness). Judged by reading.
- A real run with a non-adequate leader, and a breakeven flip under compliant-first. Neither occurs in T1 or in variant F.
- Full-year Monte Carlo timing with the layout on.
- The PDF's rendered glyphs: the extracted text shows "145 to 173/MWh" without the euro sign, as H5 found; I did not check the rendered page.
- Stale results in the interface: checked by reading the keys and the wiring only.

## Line for verification/HISTORY.md

H6 | 2026-10-26 | Breakeven table and Monte Carlo (WP17, WP18) at 33f9c1a: 0 High, 6 Medium, 11 Low; 43 verified, 20 failed, 5 not verified. Report: `verification/breakeven-montecarlo/H6-report.md`.
