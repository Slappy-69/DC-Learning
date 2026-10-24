# H2 verification: grid contract, knowledge levels, screening tier and batch 2 defaults

Date: 2026-10-23. Verifier: Claude Haiku 5.5 (independent check; nothing in the repository was changed).
Scope: `app/BUILD-NOTES.md` lines 1684–1773 (work packages 3, 2 and 8, and package 0 batch 2). Acceptance tests AC 4, AC 14, AC 16 and AC 18 (`brief-v2/BRIEF.md` lines 933, 943, 948, 950). Decisions OPEN-QUESTIONS 19, 20, 21, 23, 25, 26, 28, 50, 66 and 67.

## What I checked and how

- Ran the engine in plain Node 22 scripts that import `app/src/engine/index.js` (and `dispatch.js`, `assumed.js` and `report.js` directly where the index does not export what I needed). No `npm test`, `npm run build` or `npm run test:browser` was run. No network was used.
- Full-year T1 runs (`referenceT1()`, default settings) for the default case, the bridge contract of 80 MW, the charge entered at 18 m and the representative-day screening run. Each full run took 16–32 s on a loaded machine.
- Quick runs (`generationCap = 150`) for the AC 16 variants, AC 14 on T1 and T3, and the band check.
- Read the three test files that cover these packages (`tests/grid-contract-tests.mjs`, `tests/input-model-tests.mjs`, `tests/screening-tests.mjs`) to see what they assert. Did not run them.
- Compared the registry (`getRegistry()`), the `COUNTRIES` table, and the user guide Appendix B2 and B3 targets (`docs/user-guide/src/08-appx-countries.md`) with the batch 2 notes.
- Engine sources were last changed at 23:01:35 (`defaults.js`), before my first run at about 23:15. `BUILD-NOTES.md` was last changed at 23:03:04; its line numbers still match what I quote.

## Results

| ID | Check | Status | Evidence (numbers; file:line) |
|---|---|---|---|
| 1.1 | AC 18: every bridge option's hourly grid + gridCharge ≤ 80 MW (T1, `contractBridgeMW` = 80) | VERIFIED | 1,168 distinct bridge dispatch configurations (of 1,388 bridge options; equal keys give equal hours). Largest hourly grid + gridCharge 80.000000 MW (OV5IDR0). 0 configurations above 80 MW. Recorded connection cap ≤ 80 MW. PPA + grid ≤ 80 MW. Explicit model years 0–5 checked. `dispatch.js:125, 248–250, 410`; `s2_out.txt` |
| 1.2 | AC 18: wait options keep the full offer | VERIFIED | Largest 120.000000 MW; 188 of 206 wait configurations above 80 MW. Wait `cfg.gridLimit` = Infinity; bridge = 80. `dispatch.js:125`; `context.js:63–73` |
| 1.3 | Control: same bridge options with the contract blank | VERIFIED | 163 of the first 200 bridge configurations above 80 MW (largest 120 MW), so the limit is what binds in 1.1 |
| 1.4 | AC 18 parenthetical: exceedance mode flags imports above the contract | VERIFIED | Leader with `gridHandling = "exceedance"`: largest import 85.93 MW; exceedance 116 MWh over 128 hours across the dispatched years. `dispatch.js:428–430`; `s2_out.txt` |
| 2.1 | Charge at 0: no "Grid connection charge" line; `grid-charge-assumed` on grid options only | VERIFIED | Default T1 full run: charge line on 0 options. Flag on 1,683 of 1,683 grid options and 0 of 317 islanded. Cable-route line on 1,683 grid options, 0 islanded. `evaluate.js:126–129, 539–541`; `s1_out.txt` |
| 2.2 | Charge 18 m entered: one lump sum on every grid option, none on islanded; flag removed | VERIFIED | 1,683 of 1,683 grid options book 18,000,000 € in year 0. 0 of 317 islanded options book it. Flag on 0 options. `s2_out.txt` |
| 2.3 | Charge goes through the ledger correctly | VERIFIED | Sample option: NPV change 17,241,652 € from the run; analytic 18 m × 1.10 (contingency 0.10) × (1 − 0.5 × 1.07^−20) = 17,241,652 €. LCOE change +2.65 to +2.93 €/MWh over the first 400 grid options (supports WP3 "about €3/MWh") |
| 2.4 | `expectedConnectionCharge` = MW × band rate | VERIFIED | T1 wait: 120 MW × €150,000 = €18.0 m (HV). Bridge at 80 MW: 80 × €150,000 = €12.0 m (HV). `evaluate.js:473–479`; `s9_expected.mjs` |
| 2.5 | One expected figure per contract (Inputs panel and the flag agree) | FAILED | Wait contract 15 MW on the 120 MW offer: panel €1.5 m (MV band, €100,000/MW) against flag €2.3 m (HV band, €150,000/MW). `InputsPanel.jsx:161` passes no band; `evaluate.js:540` passes `sz.grid.band` from the full offer. `s7_band.mjs`. (Finding M2) |
| 3.1 | AC 16: a run from `buildDefaultInputs()` (location and area only) completes | VERIFIED | 2,000 options in 16.8 s. `s4_out.txt` |
| 3.2 | AC 16: IT estimate = area × coverage × storeys ÷ gross-up × air density ÷ 1000 | VERIFIED | 15 ha × 10,000 × 0.35 × 2 ÷ 2.2 × 1.5 ÷ 1000 = 71.5909 MW → 71.6 MW (engine 71.6). `defaults.js:903–906`. The code also has a 1 MW floor that the notes do not mention (L8) |
| 3.3 | AC 16: IT load and phasing flags on every option | VERIFIED | `assumed:load.itMW` and `assumed:load.phases` on 2,000 of 2,000 options. `assumed.js:21–47, 100–103` |
| 3.4 | AC 16: grid flags only on non-islanded options | VERIFIED | `grid.nowMW`, `grid.fullMW`, `grid.fullDate` on 1,260 of 1,260 grid options and 0 of 740 islanded options |
| 3.5 | AC 16: entering the IT load removes its flag from every option | VERIFIED | Quick runs. IT 100 MW entered: `assumed:load.itMW` on 0 of 150 options; phasing flag still on 150 (phases not entered). IT and phases entered: both flags on 0 |
| 3.6 | AC 16 / check 7: PDF inputs list marks the estimated IT load as a default | VERIFIED | `report.js:36` (`inputRows`): `load.itMW` status "Default: estimated from the site area: 15 ha × 35 % … = 71.6 MW", `isDefault` true. T1 row shows "Entered". `grid.fullMW` shows "Default: …". `s4_out.txt` |
| 4.1 | Evaluation periods: `byPeriod` has 10, 15 and 20 years; the 20-year entry equals `eco.lcoe` and `eco.npvCost` | VERIFIED | 2,000 of 2,000 options; 0 failures. Scoring flag only on the 20-year entry. Leader: 10 y LCOE 157.4601, 15 y 154.4491, 20 y 153.0531 €/MWh. `evaluate.js:75–80`; `s1_out.txt` |
| 4.2 | 10-year LCOE recomputed in a fresh context with `periodYears` = 10 | VERIFIED | Fresh `buildContext` (same site model) and `evaluateOption`. O1W8C9Z9: 157.460139 (run: 157.460139, difference 0). OUXHLJO 195.589432; OV5IDR0 184.988980; all equal. 15-year values also equal. `s1_out.txt` |
| 4.3 | Further periods shown in the PDF (OPEN-QUESTIONS 21 answer) | FAILED | `report.js` has no reference to `byPeriod` or `displayPeriods`. Shown only in `OptionDetail.jsx:144–148`. (Finding M3) |
| 5.1 | AC 4: screening LCOE within ±5 % of the full year, every option, T1 | VERIFIED | Largest difference 3.79 % (OXR1WBW). 0 of 2,000 options beyond ±5 %. Non-verified options max 3.79 %; verified options (stored screening figures) max 2.02 %. `s3_out.txt` |
| 5.2 | AC 4: screening location carbon within ±5 % of the full year, every option, T1 | FAILED | Largest difference 11.60 % (OUZHI74). 420 of 2,000 options beyond ±5 %. `BRIEF.md:933` requires carbon as well as LCOE. (Finding H1) |
| 5.3 | The 10 verified options equal the full run exactly | VERIFIED | 10 of 10 equal in LCOE, NPV, location carbon and adequacy (exact equality). Scores differ, as expected, because they are normalised over the mixed set (M1). `s3_out.txt` |
| 5.4 | Representative days: weights add to 8,760 h; design day included | VERIFIED | 25 days, 600 hours. Weights sum to 8,760.000000. Design day (0-based index 187; hottest hour 4,503 at 26.36 °C) included with weight 1. Weight counts {1: 13 days, 28: 1, 29: 6, 30: 5} sum to 365 days. `dispatch.js:508–546`; `s3_out.txt` |
| 5.5 | Adequacy count and agreement with the full run | VERIFIED | 1,566 of 2,000 options adequate in both runs. 0 disagreements among non-verified options. Matches BUILD-NOTES line 1732 |
| 5.6 | "9 of the top 10 the same" (BUILD-NOTES line 1732) | FAILED | Final screening top 10 has 8 of the full run's top 10 IDs. The verified set is exactly the full top 10 (10 of 10), but after re-scoring ONXOWB0 (rank 6) and O1NCMJNF (rank 8) enter with screening figures, and O27IQVX (full rank 9 → 11) and O1S8QZZX (10 → 12) drop out. `verify.js:22, 37`; `s10_rank_shift.mjs`. (Finding M1) |
| 5.7 | Screening "about 9 s against 15 s" (BUILD-NOTES line 1732) | NOT VERIFIED | Measured 22.7 s (screening) and 31.7 s (full) on a machine loaded by another process. Ratio 0.72 against the claimed 0.60. Timing not reliable here |
| 5.8 | AC 4 on T2–T5 | NOT VERIFIED | Only T1 was run (the task's scope) |
| 6.1 | Batch 2: the 13 changed registry values equal the table | VERIFIED | Roof PV O&M 21.5; ground PV O&M 13.3; wind O&M 50; battery 125 €/kWh and 135 €/kW; gas turbine 1,100; gas engine unit 10 MW; gas engine capex 900; SMR 8,000; standby diesel and HVO procurement 15 months; PPA solar 57, wind 86. `check6_out.txt` |
| 6.2 | Each batch 2 record: label "sourced — not independently checked"; source, year, url, accessed and approved filled | VERIFIED | 23 records carry the label (batch 1 plus batch 2), and all five fields are set on each. `defaults.js:559–582` |
| 6.3 | Country table = batch 2 values, and = the user guide's B2 and B3 targets | VERIFIED | FR 62 / 41, FI 41 / 57, NO 44 / 28, PT 66 / 128, AT 100, CZ 95, SI 105, GB 217 g/kWh. All 31 B2 price targets and all 31 B3 carbon targets equal `COUNTRIES`. `check_b2_b3_out.txt` |
| 6.4 | Prices match the source records they cite | FAILED | Slovenia: table 105, cited record 106.0 €/MWh (Electricity Maps 2025); BUILD-NOTES line 1760 says "checked, unchanged". Czechia: table 95, record 95.5 (would round to 96). (Finding L2) |
| 6.5 | USD conversions at 1.1181 $/€ | VERIFIED | $177 → €158.30; $1,606 → €1,436.37; $836 → €747.70; $8,936 → €7,992.13; $800 → €715.50; $1,200 → €1,073.25; $95.86 → €85.73. All match the notes. Battery 4-hour case (125 + 135 ÷ 4) gives €158.75, not €158 (L3) |
| 6.6 | "Sourced" label used only for sourced values; judgements labelled as judgements | FAILED | Gas turbine €1,100/kW lies between EIA's €748 and €1,436 (midpoint €1,092); `defaults.js:572` says "Between …". Battery split is "a judgement" (`defaults.js:569`). Both carry "sourced". CLAUDE.md, Defaults rule. (Finding M4) |
| 6.7 | Exchange rate 1.1181 $/€ and its date | NOT VERIFIED | No network. The date (12 Oct 2026) differs from the 22 Oct used for `project.fx` and the UK ETS record; USD is not in `FX` (`defaults.js:132`). (Finding L4) |
| 6.8 | External figures (Ember, Electricity Maps, BNEF, EIA, Fraunhofer ISE, LevelTen, Wärtsilä, Global Power Supply, Datacentres.com) | NOT VERIFIED | No network; internal arithmetic and consistency checked only |
| 7 | PDF inputs list marks the estimated IT load as a default | VERIFIED | See 3.6 |
| 8.1 | Batch 2 "T1 after batch 2": leader O1W8C9Z9, score 92.69, LCOE €153.1/MWh, 1,566 adequate | VERIFIED | Score 92.690; LCOE 153.053; adequate 1,566. BUILD-NOTES line 1773 |
| 8.2 | Batch 2: location carbon 113 → 123 g/kWh with the UK grid at 217 (was 200) | VERIFIED | Now 123.031. Leader is 99.3 % scope 2 (scope 1 11,602 t; scope 2 1,567,823 t; delivered 12.84 TWh). Scaling scope 2 back to 200 gives 113.46 g/kWh, matching 113. `s8_carbon_b2.mjs` |
| 8.3 | WP3: the €18 m line leaves every option, LCOEs fall by about €3/MWh; leader LCOE €153.05/MWh | VERIFIED | Leader LCOE 153.053. Putting the 18 m back raises LCOE by 2.65–2.93 €/MWh (2.71 on the sample). BUILD-NOTES line 1695 |
| 8.4 | WP3: leader score 92.70 | VERIFIED as written before batch 2 | Score now 92.690 (92.69 after batch 2, line 1773). Superseded, not contradicted (L9) |
| 8.5 | WP2: T1's 15 ha → 71.6 MW | VERIFIED | 71.6 (see 3.2). BUILD-NOTES line 1707 |
| 8.6 | WP2: "24 key inputs", each with a rule | FAILED | `assumed.js:21–47` has 25 entries. BUILD-NOTES line 1710 says 24. (L1) |
| 8.7 | Tests cited exist (31, 32, 33, 13d, B33, B35, B36) | VERIFIED | Names found in `tests/grid-contract-tests.mjs`, `input-model-tests.mjs`, `screening-tests.mjs`, `port-tests.mjs:493`, `browser-tests.mjs:570, 590, 614`. Existence only; not run (L1 on test strength) |
| 8.8 | WP8: location carbon "within about 12.5 %" (OPEN-QUESTIONS 23: "about 13 %") | FAILED | Current worst case 11.60 %. The figure pre-dates batch 2 (L9) |
| 8.9 | WP8 interpretation: "carbon is not part of the ±5 % check" (line 1734) | FAILED | Contradicts `BRIEF.md:933` (AC 4 says LCOE and carbon). (Finding H1) |
| 8.10 | WP8: LCOE within 3.8 %; leader unchanged; adequacy 1,566 | VERIFIED | 3.79 %; leader O1W8C9Z9 in both runs; 1,566. The screening leader's score is 92.23 against 92.69 in the full run (M1) |
| 9 | AC 14 (T1): connection equals contracted capacity in each period (20 MW, then 120 MW); shortfall stated at design load | VERIFIED | 60 grid options: `byMonth` = 20 MW for months 0–29 and 120 MW from month 30. Dispatched connection matches in years 0–3. Sample shortfall "months 24–29: design load 32.0 MW less 20.0 MW grid leaves up to 12.0 MW". `sizing.js:99, 552`; `s5_out.txt` |
| 10 | AC 14 (T3): unmet load shown with "grid-binding"; exceedance mode removes unmet load and raises "grid-exceed" | VERIFIED (with interpretation) | Quick run: 70 of 120 grid-using options have unmet load and the binding flag. The other 50 are bridge options whose on-site fuel cells, CHP or rented plant cover the load (0 MWh unmet), so they have no binding flag. Exceedance mode: 0 options with unmet load, 120 with "grid-exceed". `s5_out.txt`; `s6_t3_nobind.mjs` |

Totals: 47 checks. VERIFIED 34, FAILED 9, NOT VERIFIED 4.

## Findings

### High

**H1. AC 4 is not met on carbon, and the build treats carbon as outside the check.**
- Where: `brief-v2/BRIEF.md:933` (AC 4: "within ±5 % on LCOE and carbon"); `app/tests/screening-tests.mjs:52–57` (carbon computed, not asserted; message at line 57 says "not part of AC 4"); `app/BUILD-NOTES.md:1734` ("carbon is not part of the ±5 % check"); `brief-v2/OPEN-QUESTIONS.md:40` (answer says screening "meets the ±5 % target on cost" and does not waive carbon).
- What: on T1 the location carbon of screening figures differs from the full year by up to 11.60 % (OUZHI74). 420 of 2,000 options are beyond ±5 %.
- Why it matters: AC 4 is a definition-of-done item. The notes present it as met (line 1732) and the decision does not waive carbon in writing. Screening is off by default, so the risk falls on users who turn it on and on any claim that AC 4 is met. The owner needs to waive carbon in writing or the screening needs to change.

### Medium

**M1. After verification, the screening ranking mixes screening and full-year figures.**
- Where: `app/src/engine/verify.js:22` (the top 10 by screening rank are verified) and `:37` (every option is re-scored with mixed figures); `app/src/engine/run.js:271–277`.
- What: the verified 10 equal the full run's top 10 exactly. The final top 10 includes two unverified options, ONXOWB0 (rank 6; screening LCOE 151.68 against 154.65 full, −1.9 %) and O1NCMJNF (rank 8; 155.26 against 158.03, −1.8 %). Two verified options fall out (O27IQVX 9 → 11; O1S8QZZX 10 → 12). Scores of verified options drop by about 0.44 points (leader 92.690 → 92.233), because the axis ranges are taken over the mixed set.
- Why it matters: the notes say the best 10 are verified, but the list a user reads has two unverified options in its top eight. The leader is unaffected. The owner needs to decide: re-verify until the top 10 is stable, rank verified options first, or state the effect in the run summary.

**M2. Two different expected connection charges for the same contract.**
- Where: `app/src/components/InputsPanel.jsx:161` calls `expectedConnectionCharge(norm, 'wait')` with no band, so the band follows the contracted MW (`evaluate.js:473–479`). The flag (`evaluate.js:540`) passes `sz.grid.band`, which follows the full offer (`sizing.js` `voltageBand` on `fullMW`).
- What: for a 15 MW wait contract on the 120 MW offer, the panel shows €1.5 m (MV, €100,000/MW) and the flag shows €2.3 m (HV, €150,000/MW). The ledger's substation is HV.
- Why it matters: OPEN-QUESTIONS 50 asks for one expected figure. The flag's band matches the substation, so the panel is probably the figure that is wrong. One basis should be chosen and used in both places.

**M3. The PDF does not show the further evaluation periods.**
- Where: `brief-v2/OPEN-QUESTIONS.md:38` (answer for 21: 10 and 15-year LCOE and NPV "in each option's detail and the PDF"); `app/src/report/report.js` (no reference to `byPeriod` or `displayPeriods`); `app/src/components/OptionDetail.jsx:144–148` (shown here only); `app/BUILD-NOTES.md:1712` (says "shown in the option detail") and `:1717` (the "Not built" list does not include the PDF).
- Why it matters: an accepted decision is missing from the PDF and the gap is not recorded.

**M4. Judgement values are labelled "sourced — not independently checked".**
- Where: `app/src/engine/defaults.js:564` and `:572` (gas turbine €1,100/kW, note "Between the EIA aeroderivative and large simple-cycle figures"); `defaults.js:569` (battery €125/kWh + €135/kW, note "the split is a judgement"). The EIA figures are €748 and €1,436 per kW (midpoint €1,092).
- Why it matters: a reader takes "sourced" to mean the figure is in the source. For these two it is a judgement. CLAUDE.md (Defaults) requires the label "judgement" with a reason for judgements. The two records should be relabelled.

### Low

**L1. The key-input count and the test on it.** `assumed.js:21–47` has 25 key inputs; BUILD-NOTES line 1710 says 24. `tests/input-model-tests.mjs:63` only asserts at least 20. Its 10-year check (line 62) asserts only that the 10-year LCOE differs from the 20-year one. The 10-year figure is confirmed here by a fresh run (4.2), not by the test.

**L2. Slovenia and Czechia prices.** `defaults.js:115`: Slovenia table 105 against the cited record 106.0 (SRC.priceEM). BUILD-NOTES line 1760 says "AT, CZ, SI checked, unchanged", which is not accurate for SI. Czechia table 95 against 95.5 (rounds to 96). Immaterial to T1.

**L3. Battery 4-hour equivalent.** €125/kWh + €135/kW ÷ 4 h = €158.75/kWh (rounds to €159). Notes say €158 (`defaults.js:569`; BUILD-NOTES line 1763). Immaterial.

**L4. USD rate date.** BUILD-NOTES line 1771 and the batch 2 source notes cite the ECB reference of 12 Oct 2026. The UK ETS record and `project.fx` use 22 Oct 2026 (`defaults.js` SRC.ukEts and SRC.fx). USD is not in `FX` (`defaults.js:132`). The rate cannot be checked offline. One reference date should be used and the places where USD is applied should be stated.

**L5. User guide Appendix B2 is out of step with batch 2.** `docs/user-guide/src/08-appx-countries.md:86–110` compares AT, CZ, SI and FI with 2024 ACER figures and says "update". Batch 2 uses 2025 Electricity Maps values for AT, CZ and SI and says they are checked. B2's own rule says the 2025 source is used where found. The guide needs a refresh.

**L6. No input for the Grid + export contract.** `InputsPanel.jsx:151–158` shows a note only. The OPEN-QUESTIONS 19 answer applies the rule to Grid + export. The engine does read `grid.contractExportMW` (`context.js:63–73`), but no test covers it, and the default C1 open choice excludes export (`defaults.js:197`). BUILD-NOTES line 1697 discloses the gap.

**L7. A 0 MW contract still pays the connection charge.** `evaluate.js:126–129` books the charge and cable route for any non-islanded option, whatever its contract. The `grid-charge-assumed` flag (`evaluate.js:539–541`) fires too. The decisions do not say what a 0 MW grid strategy is. Code reading only; not run.

**L8. Undocumented 1 MW floor in the IT estimate.** `defaults.js:904` uses `Math.max(1, …)`. Sites below about 0.21 ha get 1 MW. The floor is not in BUILD-NOTES lines 1706–1708 or in the flag text. Not reached by the reference projects.

**L9. Stale figures in the notes.** BUILD-NOTES line 1732 (carbon "about 12.5 %", "9 of the top 10", "about 9 s against 15 s") and OPEN-QUESTIONS line 40 ("about 13 %") were written before batch 2. Current T1 gives 11.60 %, 8 of 10, and 22.7 s against 31.7 s on a loaded machine. Line 1695's "score 92.70" is superseded by 92.69 after batch 2 (line 1773). The notes should be refreshed.

**L10. PV and wind capex records labelled sourced without a batch entry.** `defaults.js:560–561` (roof 900, ground 700, wind 1,350 €/kW) were labelled "sourced" in batch 2. The batch table (BUILD-NOTES lines 1757–1769) does not list them. The values sit at the bottom of the Fraunhofer ranges (roof €900–1,600, ground €700–900, wind €1,300–1,900). They are consistent with the source, but the change is not recorded.

## Not run or not verified

- AC 4 on T2–T5 (only T1 was run).
- The test suite was not run. The three test files were read; they assert what the notes say, except the carbon limit (H1) and the 10-year check (L1).
- No network. External source figures and the exchange rate were not checked against their publishers.
- Timings are not reliable: another process was loading the two cores (5.7).
- All runs used the default analysis start (today + 3 months, 2027-01), not the fixed start in the test file.
- The AC 18 hourly check covers the six explicit model years. Later years repeat the last year's steady state.
- The `verification/HISTORY.md` line was not added because my instructions allow writing only this report.
- The repository has uncommitted changes (`defaults.js`, `BUILD-NOTES.md`, `CLAUDE.md`) and another report, `verification/walkthrough-build/H3-results.md`, appeared during this check. Neither affected the engine runs (see the timing note above).

## Scripts and outputs

Folder: `/tmp/claude-0/-home-claude/95f78427-fc73-53b2-b6d4-6b1291b2d70a/scratchpad/h2/`

- `common.mjs`: shared helpers.
- `s1_t1_default.mjs` (output `s1_out.txt`, `t1_default.json`, `t1_periods.json`): default T1; checks 2.1, 4.1, 4.2.
- `s2_t1_contract_charge.mjs` (output `s2_out.txt`): contract 80 MW and charge 18 m; checks 1.1–1.4, 2.2, 2.3.
- `s3_t1_screen.mjs` (output `s3_out.txt`, `t1_screen_diffs.json`): screening run; checks 5.1–5.5.
- `s4_defaults_ac16.mjs` (output `s4_out.txt`, `s4_default_flags.json`): AC 16 and PDF inputs list; checks 3.1–3.6.
- `s5_ac14.mjs` (output `s5_out.txt`): AC 14 on T1 and T3.
- `s6_t3_nobind.mjs`: which T3 options lack the binding flag.
- `s7_band.mjs`: panel against flag band (2.5).
- `s8_carbon_b2.mjs`: batch 2 carbon back-calculation (8.2).
- `s9_expected.mjs`: expected figures for 80 MW and 0 MW (2.4).
- `s10_rank_shift.mjs`: ranks after verification (5.6, M1).
- `check6_batch2.mjs` (output `check6_out.txt`): registry, labels, source fields, USD arithmetic (6.1–6.7).
- `check_b2_b3.mjs` (output `check_b2_b3_out.txt`): user guide B2 and B3 against `COUNTRIES` (6.3).
- `t1_contract80.json`, `t1_charge18.json`: option-level results for the two variant runs.
