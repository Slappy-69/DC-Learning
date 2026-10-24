# H1 engine verification: power adequacy, flexibility and PPA rules

Verifier: Claude Haiku 5.5 (independent verifier, H1). Date: 2026-10-23.
Scope: `app/BUILD-NOTES.md` lines 1449–1631 (work package 3b parts 1–8, work package 4 and work package 5); `brief-v2/OPEN-QUESTIONS.md` 22, 33, 34, 37–49, 55–62; `brief-v2/BRIEF.md` section 21, acceptance criteria 19–23; `docs/KNOWN-ISSUES.md` item 13.
Repository: no file changed. Engine code read only. `npm test`, `npm run build` and `npm run test:browser` not run. No network.

## What I checked and how

- Read the code: `adequacy.js`, `scoring.js`, `sizing.js` (programme months, top-up, bridging, shortfall battery, firm schedule), `permitting.js`, `evaluate.js` (time-to-power, test run, PPA flags), `dispatch.js` (hourly loop), `triggers.js`, `generator.js` (rules, default subsets), `defaults.js` (TECH records, choice defaults).
- Ran seven scripts in `/tmp/claude-0/-home-claude/95f78427-fc73-53b2-b6d4-6b1291b2d70a/scratchpad/h1/` (list at the end). They rebuilt numbers from each option's sizing, hourly dispatch and TECH records, and compared them with the engine.
- Full runs: T1 reference (all 2,000 options recomputed), T1 with the flexibility trigger at 190 EUR/MWh, T1 in exceedance mode, T1 with a patched copy of the engine (pre-fix rule, copy only), and T3.
- Hourly checks on one PPA option (year 2), the 125 MW battery case, and the trigger battery.
- Line references like "a-t1-checks.txt line 8" point to the script output in the folder above.

## Results

Status counts: 24 VERIFIED, 6 FAILED, 2 NOT VERIFIED (32 rows).

| ID | Check | Status | Evidence (numbers; file:line) |
|---|---|---|---|
| 1a | Power adequacy: each option recomputed from its dispatch years, time-to-power and sizing | VERIFIED | 2,000 options: 1,566 adequate, 434 not. 0 flag mismatches with `adequacy.adequate`. Largest differences: supply 0 MW, gap 0 MW-months, unmet 0 MWh (a-t1-checks.txt line 2). The firm-supply schedule is the engine's own (see Notes). `adequacy.js:22–36` |
| 1b | Five adequate and five not-adequate options by hand (ranks 1, 100, 500, 1000, 1566 adequate; 1567, 1700, 1850, 1950, 2000 not) | VERIFIED | Adequate: unmet 0, import above connection 0, shed 0, gap 0 MW-months. Minimum supply margin after the full grid: 6.9, 2.0, 29.0, 107.8, 165.3 MW (a-t1-checks.txt line 8). Not adequate: rank 1567 has 972.4 MWh unmet over 1,026 h (longest 730 h) and a 15.4 MW-month gap over 4 months from month 26; rank 1700 has no unmet and a 10.5 MW-month gap over 3 months from month 24; rank 1850 has 15,681.9 MWh unmet over 2,169 h; rank 1950 has no unmet and a 957.4 MW-month gap over 61 months; rank 2000 has 3,431.2 MWh unmet over 1,412 h and a 997.6 MW-month gap. All match the engine. |
| 1c | Ranking: every adequate option above every not-adequate one; score order inside each group | VERIFIED | Last adequate rank 1,566; first not adequate 1,567. Ranks unique, 1–2,000. 0 score-order violations in 1,998 adjacent pairs within a group (a-t1-checks.txt line 5). `scoring.js:72, 117–129` |
| 1d | No option hidden by default | VERIFIED | `applyView` with the default view shows 2,000 of 2,000; dominance hides 0 (a-t1-checks.txt line 6). `hideDominated` default is false (`scoring.js:143`; `defaults.js:841`). `applyView` at `scoring.js:150–165` |
| 1e | First steady-state year after the explicit dispatch years (link to KNOWN-ISSUES 1) | VERIFIED | T1 dispatches years 0–5 explicitly (last change in month 66). The first steady-state year (index 6), dispatched for all 1,566 adequate options (1,308 distinct configurations): 0 would not be adequate (a-t1-checks.txt lines 9–10). `dispatch.js:138–164, 546–558` |
| 1f | Dominance marks (part 1 claim) | VERIFIED | 1,939 options marked. Brute-force check over all pairs: 0 mismatches. No dominator has less adequacy or less resilience than the option it dominates (g-run.log line 1). `scoring.js:80–104` |
| 2 | Plant availability month from TECH records (plan, procurement, build, allowance); IED and Seveso tests | VERIFIED | 3,118 prime and bridge plant records across all options: availability month and regimes match (0 mismatches). IED flag matches on all 2,000 options (a-t1-checks.txt line 11). Constructed cases sized by the engine (a-t1-checks.txt line 13): gas recips prime 21 (6 + 9 + 6); CHP prime 27 (6 + 12 + 9); fuel cells 9; SMR 120 (36 + 36 + 48); hydrogen prime 33 (6 + 18 + 9, IED and Seveso); gas turbine bridge 24 (6 + 12 + 6, IED); gas recips bridge 21; HVO-diesel bridge with no backup 12 (9 + 3, not held); rented bridge 10 (6 + 2 + 2, IED). `sizing.js:18–28, 353–357`; `permitting.js:30–60` |
| 3 | Top-up firm plant units (C4s = shortfall) | VERIFIED | Rank 135 (evaporative, fuel cells): shortfall 9.011 MW in month 66, n = 10, units 11, equal to the engine. Rank 235 (air, CHP): shortfall 16.675 MW, n = 4, units 5, equal to the engine. Design load by month matches (largest difference 0) (a-t1-checks.txt lines 15–17). Top-up options (non-islanded): evaporative 227, air 203; none for DLC or immersion (c-run.log line 4). `sizing.js:109–122`; `generator.js:247` |
| 4a | Shortfall battery sizing and recharge check, T1 | VERIFIED | 298 options: MW, usable and stored energy, and recharge flag recomputed: 0 mismatches. 0 of 298 recharge, so none counts as firm supply (298 `bess-recharge` flags) (a-t1-checks.txt lines 18–20). `sizing.js:292–320`; `evaluate.js:35` |
| 4b | 125 MW grid, evaporative cooling (test 24 setting) | VERIFIED | Battery 4.01 MW / 21.92 MWh, recharges. Power gap falls from 249.8 to 31.2 MW-months. 306 discharge hours, none while the grid still had headroom (b-run.log line 12). Unmet load in year 2 by month (f-run.log lines 2–13): 37.1 MWh in month 28 and 1,125.2 MWh in month 29; none from month 30, when the full grid applies. The year-2 total is 1,162.3 MWh (e-run.log line 1). |
| 5a | Trigger hours and events, recomputed from the written rule | VERIFIED | At 190 EUR/MWh: 343 trigger hours, 135 events, 248 event hours. Independent recount and engine agree (b-run.log line 2). `triggers.js:19–36` |
| 5b | Hours a year, share of IT, event length and recovery in dispatch | VERIFIED | Curtailment only in event hours (0 hours outside). Longest event 4 h; shortest gap between events 12 h. Flexed energy never above 10 % of IT (b-run.log lines 4–5). Curtailment in 100 hours a year in years 1–5 (limit 100); 0 years over (b-run.log line 7). Year 5: 752.2 MWh curtailed, below the cap of 1,000 MWh (10 % × 100 MW × 100 h). `dispatch.js:262–288, 391–399` |
| 5c | Economic battery serves trigger hours before any curtailment | VERIFIED | 8 of 8 battery-curtailing hours had the battery at its limit (power or stored energy) (b-run.log line 5). `dispatch.js:278–283` |
| 5d | Trigger battery figures in the notes (about 1,900 MWh served, about 20 MWh curtailed, about 750 MWh without the battery) | VERIFIED | 10 MW / 42.64 MWh. Year 5: 1,923.1 MWh served by the battery; 21.5 MWh curtailed with it, against 752.2 MWh without it (c-run.log line 5). Six-year totals: 5,100.7 MWh served and 26.9 MWh curtailed with the battery; 1,881.1 MWh curtailed without it (b-run.log lines 5, 10). These match the notes' figures for year 5. |
| 5e | IT shed against a shortfall makes an option not adequate (OPEN-QUESTIONS 61) | VERIFIED | Option with flexibility and no firm plant: 2.31 MWh shed over six years. Not adequate, with reasons unmet, gap and shed (b-run.log lines 6, 11). `adequacy.js:22–36`; `dispatch.js:391–399` |
| 6a | Genset test run: 6 h a year at 75 % load, fuel and cost | VERIFIED | 400 options: ledger test-run cost equals the hand calculation (0 mismatches). Rank 1828: 56 units × 2.75 MW × 6 h × 0.75 = 693 MWh(e); fuel 1,823.7 MWh(th) at 110 EUR/MWh; full-IT year 200,605 EUR; year 1 (IT share 6.25 %) 12,538 EUR, as booked (a-t1-checks.txt lines 21–22). `evaluate.js:255–260, 279–283` |
| 6b | Test load changes only test energy, fuel, cost and Scope 1 carbon (AC 19) | VERIFIED | Same option at 50 % test load: sizing, dispatch and time-to-power unchanged. Ledger lines that move: testRun, carbon, scope1T, opex, pvOpex. Test-run cost 12,538 → 8,359 EUR in year 1. LCOE changes by −0.10 EUR/MWh (a-t1-checks.txt line 23). |
| 6c | Gensets never run in normal dispatch with 0 primary-power hours (AC 19) | VERIFIED | 0 options carry a backupPrime plant in dispatch (a-t1-checks.txt line 24). |
| 7a | O1: no PPA where it can never be delivered (rule k) | VERIFIED | T1: 0 islanded options with a PPA (a-t1-checks.txt line 25). T3 (no grid at any time): 0 options with a PPA; rule k removed 41,880 combinations (b-run.log lines 14–15). `generator.js:30–32, 245` |
| 7b | O2: hourly CFE counts PPA only against grid energy used in the hour (default mode) | VERIFIED | Leader PPA option, year 2: hand CFE 138,806.8 MWh = engine; PPA limited 646.01 MWh = engine; undelivered 77,733.84 MWh = engine (a-t1-checks.txt lines 27–28). The pre-O2 comparison figure is 139,452.8 MWh; the 646.01 MWh gap equals the limited energy. Default-mode check on a PPA option with the same main choices (rank 1580, not an exact twin): credit above delivered 0.00 MWh (d-run.log line 3). Day 78 hand table: CFE 406.67 of 406.67 MWh (a-t1-checks.txt line 30). `dispatch.js:456–458` |
| 7c | O2 in exceedance mode: CFE and undelivered PPA volume agree | FAILED | Exceedance mode, top-ranked PPA option (rank 250), year 2: 646.01 MWh credited to CFE above the PPA energy delivered, in 613 hours (d-run.log line 1). The same run reports the same 646.01 MWh as undelivered (`ppa-import-limited`, d-run.log line 4). Import above the connection occurs in 1,026 hours (972.4 MWh); whether the 613 hours overlap them was not counted. See M-1. `dispatch.js:456–457` |
| 7d | O3: the two PPA flags' shares add to 100 % | VERIFIED | 818 options with a PPA: largest deviation 1.4e-14 points (b-run.log line 26). Leader, whole ledger period: `ppa-import-limited` 646.01 MWh (0.01507 %); `ppa-above-load` 4,287,221.26 MWh (99.98493 %) of undelivered 4,287,867.27 MWh (a-t1-checks.txt line 31). The year-2 hour-by-hour split agrees with the engine (646.01 + 77,087.84 = 77,733.84 MWh; a-t1-checks.txt lines 27–28). The whole-ledger totals were not rebuilt hour by hour. The old `grid-ppa` flag is absent (b-run.log line 26). `evaluate.js:516, 524` |
| 8 | Known issue 13 fix: economic plant below minimum stable load when the grid is full | VERIFIED | Case: leader (rank 1, a PPA option), year 2 (c-run.log lines 6–8). Pre-fix rule: 10.99 MWh unmet in 26 h (peak 0.56 MW, longest 4 h). Fixed rule: 0 unmet. The rented plant (minimum 0.6 MW) runs at 0.6 MW in those hours, with 0.01–0.36 MW curtailed. Full runs (c-run.log lines 2, 10–11, 14): pre-fix 930 adequate, 0 of 818 PPA options adequate, best PPA option ranked 931, and the pre-fix leader has no PPA (matches the notes); fixed 1,566 adequate, 636 of 818 PPA options. `dispatch.js:348` |
| 9a | Figures in BUILD-NOTES work packages 4 and 5 | VERIFIED | 1,566 adequate; 930 adequate without PPA; 636 with; 818 PPA options (a-t1-checks.txt line 4); 55,060 combinations; rule k 5,400 (T1, c-run.log line 3) and 41,880 (T3, b-run.log line 15); leader score 92.69 and CFE 66.60 % (a-t1-checks.txt line 31); O3 shares 0.015 % and 99.985 %; trigger 343 / 135 / 248 and price peak 214.8 EUR/MWh (b-run.log line 2); month list in part 2 (TECH-record months, check 2). |
| 9b | Figures in BUILD-NOTES 3b parts 1–8 that describe the T1 sample | FAILED | Stale and not marked as superseded: line 1467 (953 adequate); line 1496 (leader OPIAR4Q, 953 adequate); line 1513 (528 top-ups, 929 adequate, rule g removes 10,080); line 1533 (rule g removes 12,672, 931 adequate); line 1578 (940 adequate); line 1595 (rule i removes 15,984). Current run: 1,566 adequate; 430 top-ups (227 evaporative, 203 air); rule g removes 18,240; rule i removes 7,992 (c-run.log lines 3–4). See L-5. |
| 9c | BRIEF AC 21: undeliverable PPA options carry an O1 flag | FAILED | No flag of that kind exists. Such options are not generated (rule k), as OPEN-QUESTIONS 22 decided. The AC text is out of date. See L-4. |
| 9d | KNOWN-ISSUES item 13 figures | FAILED | "0.2 MW went unmet in about 15 hours (7–8 MWh)" does not hold together: 0.2 MW for 15 h is about 3 MWh. Measured: the smallest pre-fix case with under 50 MWh unmet is 2.19 MWh in 15 h (peak 0.30 MW) (c-run.log line 12). See L-3. |
| 9e | OPEN-QUESTIONS 43: every on-site technology, including gas turbines, is considered for bridging | FAILED | The default C2 list has gas recips, fuel cells and rented only. Gas turbines and HVO-diesel prime appear in 0 of 2,000 options (a-t1-checks.txt line 12). See H-1. |
| 9f | Seveso test for liquid fuel (HVO and diesel) stores | FAILED | The test reads the backup genset store only (`permitting.js:33`). Bridging and prime HVO-diesel plant have no store in the sizing, so their fuel is not counted. The constructed HVO-diesel bridge (C5 none) is 41.3 MWth with 0 t of store and is not held (a-t1-checks.txt line 13). See L-1. |
| 9g | Flexibility recovery applied after an event (notes: 12 h recovery) | VERIFIED | Built as a 12 h recovery after each event (`dispatch.js:267–272`). Whether it follows a natural end is an open reading. See L-2. |
| 10 | AC 20: with flexibility off, results match the engine before work package 4 | NOT VERIFIED | Not checked in this run. |
| 11 | AC 20: battery capex for both allocations is in the ledger | NOT VERIFIED | Not checked numerically. |

## Findings

### High

**H-1. Decision 43 is not in the default bridging list.**
- What: gas turbines (`gasTurbine`) and HVO-diesel prime (`dieselPrime`) are outside the default bridging choice (C2). Neither appears in any of the 2,000 T1 options (C2 counts: gas recips 542, rented 575, fuel cells 588, not applicable 295) (a-t1-checks.txt line 12).
- Where: `app/src/engine/defaults.js:198` (default C2 = gasRecip, fuelCell, rented); `generator.js:147` labels the rest "default subset".
- Decision: OPEN-QUESTIONS row 43 (answered 2026-10-22): every technology that can generate on site, "whatever C2's list or default subset says today, including gas turbines". That covers HVO-diesel prime too.
- Why it matters: a gas-turbine or HVO bridge can never be ranked in the default run. The notes do not say it was built. The gas-turbine timing (24 months) was checked only on a constructed option (a-t1-checks.txt line 13). Owner decision needed: add both to the default C2 list, or record that the default stays.

### Medium

**M-1. In exceedance mode, CFE counts PPA energy that the same run reports as undelivered.**
- What: when grid import may exceed the connection, the energy above the connection counts as "grid energy used", so PPA energy that could not pass the connection is credited to clean CFE. The PPA flag and ledger treat the same energy as undelivered.
- Where: `dispatch.js:456–457` (`gridUsed = ppaUse + g`, where `g` includes import above the connection); `evaluate.js:516–535` (flags).
- Evidence: top-ranked PPA option in exceedance mode (rank 250), year 2: 646.01 MWh credited above delivered energy in 613 hours, 0.46 % of its year-2 CFE of 139,452.8 MWh (d-run.log line 1). The same 646.01 MWh is reported as undelivered (d-run.log line 4). In default mode the same check gives 0.00 MWh, for an option with the same main choices (rank 1580, not an exact twin) (d-run.log line 3).
- Why it matters: in exceedance mode, CFE and the PPA settlement disagree about the same energy. The literal wording of O2 allows this. The owner should decide whether import above the connection counts as grid energy for PPA matching.

### Low

**L-1. The Seveso liquid-fuel test reads the backup store only.**
- Where: `permitting.js:33` (`fuelT` uses `sz.backup.fuelM3` only). `sizing.js:192` and `sizing.js:281` are the only places that set `fuelM3`.
- Evidence: constructed HVO-diesel bridge with no backup: 41.3 MWth, store 0 t, not held, ready month 12 (a-t1-checks.txt line 13). In T1, one option is held by Seveso (a hydrogen plant) and none by fuel (g-run.log line 1: `seveboReg` 1, `seveso` 0).
- Why it matters: a bridging or prime HVO-diesel plant under the 50 MWth IED threshold is never held by Seveso. No effect in T1 today. It matters once H-1 is fixed.

**L-2. The recovery period also follows events that end naturally.**
- Where: `dispatch.js:267–272` (after any event, recovery counts down whether or not the trigger has ended); `triggers.js:19–36`.
- Evidence: at 190 EUR/MWh, 130 of 135 events end before the 4-hour limit. 95 of 343 trigger hours fall inside a 12-hour recovery window (e-run.log line 4).
- Why it matters: this removes 28 % of trigger hours. The brief (§5.3) says only "recovery period". The 100 hours a year limit binds anyway, so T1 curtailment changes little. Owner to confirm the rule.

**L-3. Known issue 13 quotes figures that do not agree.**
- Where: `docs/KNOWN-ISSUES.md`, item 13 row (line 21).
- Evidence: "0.2 MW ... about 15 hours (7–8 MWh)" gives about 3 MWh, not 7–8. Measured: the smallest pre-fix case with under 50 MWh unmet is 2.19 MWh in 15 h (rank 1103, peak 0.30 MW); the smallest pre-fix unmet of any option is 0.13 MWh; the leader's year 2 is 10.99 MWh in 26 h (peak 0.56 MW) (c-run.log lines 6, 12–13).
- Why it matters: the item is the record of a fixed defect. Its numbers should match the measured case.

**L-4. BRIEF acceptance criterion 21 asks for an O1 flag that does not exist.**
- Where: `brief-v2/BRIEF.md:953`.
- Evidence: no flag of that kind is in the code. Rule k stops such options being generated, as OPEN-QUESTIONS 22 decided. The criterion is out of date.

**L-5. Per-slice T1 figures in BUILD-NOTES are not marked as superseded.**
- Where: `app/BUILD-NOTES.md` lines 1467, 1496, 1513, 1533, 1578, 1595.
- Evidence: the current run gives 1,566 adequate, 430 top-ups (227 evaporative, 203 air), rule g 18,240 and rule i 7,992 removals (c-run.log lines 3–4; a-t1-checks.txt line 4). Only the work package 5 figures match.
- Why it matters: a reader comparing the notes with the app will find they disagree. A "superseded by part N" note, or one current table, would fix this.

## Notes that are not findings

- KNOWN-ISSUES item 1 (the ramp year is repeated) does not change adequacy in T1 (0 of 1,566 adequate options fail the steady-state year). The energy effect in item 1 is not covered by this check.
- The O3 shares are a residual (`evaluate.js:516`), so they add to 100 % by construction. The sum check (7d) confirms the arithmetic. The hour-by-hour check (7b) covers year 2 only.
- The power-gap recomputation used the engine's own firm-supply schedule (`sizing.js:478–483`). I read that code and the constructed cases agree with it, but it was not rebuilt separately. Check 1a therefore confirms the rest of the adequacy logic, not the firm-supply schedule itself.
- The recharge test for the shortfall battery is a same-day energy balance (`sizing.js:309–313`). It does not check the order of charge and discharge within the day. No T1 or 125 MW case showed a problem. The 125 MW case's unmet load falls in months 28–29, before the full grid applies (f-run.log).
- Test-run cost is pro-rated by installed IT at mid-year (`evaluate.js:215–219`). This is a judgement and was not checked against a source.
- T3 (no grid) has 1,035 adequate options (b-run.log line 14). Not checked further.

## Scripts and outputs

Folder: `/tmp/claude-0/-home-claude/95f78427-fc73-53b2-b6d4-6b1291b2d70a/scratchpad/h1/`

- `a-t1-checks.mjs` → `a-t1-checks.txt`, `a-run.log`: T1 reference over all 2,000 options. Checks 1a–1e, 2, 3, 4a, 6a–6c, 7a, 7b, 7d (leader ledger), 9a figures.
- `b-flex-checks.mjs` → `b-flex-checks.txt`, `b-run.log`: trigger at 190 (checks 5a–5e), 125 MW battery figures (4b), T3 (7a), O3 sum (7d).
- `c-ki13.mjs` → `c-ki13.txt`, `c-run.log`: check 8 and the KI13 figures (9d, L-3); top-up by cooling (check 3); trigger battery per year (5d); generation counts (9a, 9b). Uses `patched/src/` (a copy of `app/src`, with `dispatch.js:348` set to the pre-fix rule). The repository is not changed.
- `d-o2-exceedance.mjs` → `d-o2-exceedance.txt`, `d-run.log`: check 7c (exceedance mode) and the default-mode comparison (7b, M-1).
- `e-battery-recovery.mjs` → `e-battery-recovery.txt`, `e-run.log`: 125 MW unmet by year (4b); recovery count after natural ends (L-2).
- `f-battery-months.mjs` → `f-run.log`: year-2 unmet by month for the 125 MW case (4b).
- `g-dominance.mjs` → `g-run.log`: brute-force dominance (1f) and Seveso counts (L-1).

## Not verified

- AC 20 (flexibility off gives unchanged results) and AC 20 (battery capex in the ledger).
- The `npm test` suite (not run, as instructed). The test files were not read.
