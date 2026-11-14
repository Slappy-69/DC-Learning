# Audit of the numbers: T1 run, `main` at 3d34390

Independent audit, 14 November 2026. It finishes the review a previous reviewer started. I checked that reviewer's scripts and outputs and reused them. Nothing in the repository was changed.

## Verdict

**Can the numbers be trusted for client work today? The core arithmetic can. The story the tool tells around those numbers cannot yet be trusted, and some screens show the wrong currency.** I rebuilt sizing, capex, the hour-by-hour energy balance, the yearly ledger, LCOE, NPV, carbon and the score for three options from the inputs alone. 81 of 82 figures agree with the engine to within 1 %, and the one exception has a clear cause. The PDF the app saves matches the engine, in pounds, to the rounding. The trouble is in the words and dates built on those figures, and in how the engine is set up:

- The PDF's first page says the leader "reaches full load in May 2030, on the programme" and "bridges" the grid gap with gas engines. Neither is true. The last building is handed over in August 2031. Building 1 is 9 months late. The engines arrive 10 months after the gap has closed.
- The options table and the tornado axis show euro under "£".
- The gas engines are dispatched at 2026 gas and carbon prices, but billed at each year's own price. This overstates the leader's carbon by about 7 %.
- The "Step down" SMR card is cheapest only because 83 % of the reactor's cost is credited back at year 20.

**Caveats for use today:**

1. Quote LCOE, NPV, capex and carbon from the cards, the option detail, Compare or the PDF. Do not quote them from the options table or the tornado axis.
2. Rewrite the PDF's front-page sentences on full load, the programme and bridging by hand.
3. Treat carbon and run hours of gas-plant options as upper estimates.
4. Do not present the SMR step-down card.

**Findings by severity:** 6 A, 9 B, 9 C, 5 D.

## How the audit was done

- **Engine run.** The T1 example was run in Node exactly as the page runs it: realism rebuild on, all 6,170 combinations screened. Script: `scripts/lib.mjs`, about 25 s.
- **Hand calculation.** `scripts/handcalc.py` re-does the three options from the inputs, the default records and the hourly profiles. It does not call the engine. It covers sizing, capex by item, the hourly balance, the ledger, LCOE, NPV, carbon and the score. The demand profile is the one piece taken from the engine, and it is checked against 100 MW × 0.8 × 8,760 h × PUE 1.3: they agree within 0.07 %. I re-ran the script and got the same output as the previous reviewer. Output: `out/handcalc.txt`.
- **Further checks.** `scripts/audit2.mjs`, `scripts/audit3.mjs`, `scripts/ranking.mjs` and `scripts/mc.mjs` cover option #9, the 75 MW options, the SMR on a longer timeline, flag counts on each screen, the cards, the tornado, the breakevens, a 100-sample Monte Carlo, and the PDF built as the app builds it. Outputs are in `out/`.
- **Browser pass.** `scripts/browser.py` made one run of the built page (56 s). It saved the text of the cards, the options table, the leader's detail, the SMR, Compare, Trade-offs, Dispatch, the tornado (with its axis labels) and the breakevens, plus the PDF the app saves (`out/browser/`). That PDF is identical to the one built in Node apart from the compared options.
- **Two gaps.** The search box did not find the islanded option #3346 in the browser, so that option was checked in the engine and in the PDF's comparison table, not on the screens. The Monte Carlo was run in Node (100 samples), not in the browser.

**Pego double count (the coordinator's question).** T1 has no existing plant: `existing.include` is false, and no option uses an existing or listed plant. So the Pego fault, where the Elecgás plant is bought twice, cannot show in T1. A scan of all 6,170 options found no purchase line booked twice. The leader does carry two records for its gas engines ("bridge" 40 MW, never run, and "bridge kept" 40 MW). The engines are still costed once: €36.0 m capex, one fixed O&M charge, one 89 MW(th) gas supply and one IED total of 552 MWth. This matches the hand calculation to 0.00 %. Only the Dispatch legend lists both records (finding D4).

## The three options checked

| | Leader #1 | Islanded #3346 | Step-down SMR #3708 |
|---|---|---|---|
| Name | Grid + gas recips bridge → keep shortfall share as prime · HVO N+1 · PV 6.7 MWp · PPA hybrid 100 % | Islanded gas recips · retained-plant backup · PV 6.7 MWp | Grid · SMR · HVO N+1 |
| Design load, units | 150 MW; 64 × 2.75 MW HVO; 4 × 10 MW engines | 150 MW; 17 × 10 MW engines | 112.5 MW; 48 × 2.75 MW HVO; 1 × 80 MW SMR |
| Capex (with 10 % contingency) | €152.9 m = £128 m ✓ | €190.0 m = £159 m ✓ | €786.7 m = £659 m ✓ |
| LCOE | €209.54 = £175.5 ✓ (hand: 209.53) | €223.93 = £187.6 ✓ | €181.61 = £152.1 ✓ |
| NPV of cost (20 years, 7 % real) | €1,440.7 m = £1.21 bn ✓ | €1,237.3 m = £1.04 bn ✓ | €976.8 m = £818 m ✓ |
| Carbon, location-based / market-based | 177.7 / 84.6 g/kWh ✓ | 445.7 / 445.7 ✓ | 68.7 / 68.7 ✓ |
| Buildings start (month) | 27, 30, 42, 54 (building 1 is 9 months late) ✓ | 63 × 4 (late 45, 33, 21, 9) ✓ | 27, 30, 42; building 4 never built |
| Score | 94.36 ✓ | 36.49 ✓ | 76.06 ✓ |

The ✓ marks mean the hand calculation agrees within 1 %, and the screens and PDF agree in pounds at 0.8377. The one difference above 1 % is the leader's engine hours in the steady year: 5,008 by hand against 4,934 in the engine (+1.5 %, 74 hours). The cause is the hand calculation's simpler minimum-load rule. The engine skips a plant that is only economic and would run below its minimum load (`app/src/engine/dispatch.js:428-437`). Energy, gas and cost agree within 0.13 %. This is not a defect.

The ranking was re-done independently (`scripts/ranking.mjs`). The order is the five groups first (adequate, likely to be built, resilient, IT powered, every building within 24 months late), then the weighted score. The top 20 come out in the same order, the scores match exactly, and nothing is hidden. "Flag, never enforce" holds apart from the exceptions the brief now lists (§2 principle 5, the realism rebuild paragraph): the four extra rank groups, buildings not built, and three generation rules. The PDF still states the old rule (finding B7).

---

## Findings

### A: a wrong number or statement a client would see

**A1. "Full load" is not full load, and "on the programme" ignores a late building 1.**
- **Checked:** the leader's dates on every screen and in the PDF.
- **Expected:** the last building is handed over in Aug 2031 (month 54) and reaches full IT load after its 12-month ramp. Building 1 starts 9 months late, so the leader is not "on the programme".
- **The tool:** page 1 of the PDF says "reaches full load in May 2030, on the programme". The tile says "0 months late at full load … (full load May 2030, last handover Aug 2031)", which puts full load before the last handover. The same "Full load 2030-05" appears in the options table, the detail, Compare, Dispatch ("Full load month 39") and the Monte Carlo table. The SMR shows "full load Aug 2029", yet its building 4 is never built.
- **Cause:** `fullLoadM` is the first month the supply could carry the design load (`app/src/engine/evaluate.js:54`), not the month the campus reaches it. "On the programme" tests only the last building (`app/src/report/report.js:260`, `lead.ttp.delayFull`).
- **Fix:** rename it "supply ready for the full design load", or report the month the last building reaches full load. Base "on the programme" on the latest building (`maxLate`).
- **Known issue:** none (related to 9 and 14).

**A2. The leader's "bridge" bridges nothing. Its name and the PDF say it does.**
- **Checked:** the leader's sizing, its dates and the PDF wording.
- **Expected:** on the planned dates the gap is Jan to Jul 2029 (months 23 to 29). The engines are ready in month 39. On the leader's own dates there is no gap at all. The tool's own sizing note says "no bridging plant sized", and its permitting flag says "ready month 39, needed month 54, 15 months' float".
- **The tool:** the name says "bridge → keep shortfall share as prime, rest as backup", although no "rest" exists (0 bridging units). Page 1 says "which the leader bridges with 40 MW of gas reciprocating engines". The tile says "gas reciprocating engines bridging the gap (4 × 10 MW), then kept for the shortfall". In fact the leader has the same plant, capex and building dates as #9 ("Grid · Gas recips top-up"). The engines are only bought in year 3 instead of year 4. The tool itself renames the same situation correctly for #33 to #88: "Grid (gas recips bridge too late: ready after the grid)".
- **Cause:** the rule that drops a late bridge skips a bridge that has no bridging duty but is enlarged to its kept share: `bridge.shortfallMW` = 0 and units = 4 (`app/src/engine/sizing.js:111` and `:132`). The report claims bridging whenever `bridge.mw` > 0 (`app/src/report/report.js:262`, and the tile near `:855`).
- **Fix:** treat a bridge with no bridging duty as dropped, and name the option a top-up bought early. Claim bridging in the report only when the plant is ready before the gap ends.
- **Known issue:** none.

**A3. "Against waiting for the grid (#9) … reaches full load 15 months earlier."**
- **Checked:** #1 against #9, year by year.
- **Expected:** #1 and #9 start all four buildings in the same months (27, 30, 42, 54) and have the same capex (€152.9 m). #9 waits for the grid no longer than #1 does. The "15 months" is only the gap between the two engine purchase dates (month 39 against 54). The £8.01 m saving in present value comes from running the engines as cheap generation in 2030 and 2031: 3,795 h and 4,748 h, against 0 h and 2,665 h for #9. The cost difference by year is +€29.1 m in year 3 and −€45.3 m in year 4.
- **The tool:** page 1 and the tile of the PDF, the figure caption that says "keeping the programme supplies more energy", and section 3.
- **Cause:** `app/src/report/report.js:226` takes the first C1 = "wait" option as the reference, and `:265`, `:382` and `:855` compare `fullLoadM`.
- **Fix:** compare building dates (`avgLate` or `maxLate`) rather than `fullLoadM`. Call the reference "no bridging plant", and say where the saving comes from.
- **Known issue:** none.

**A4. The options table's LCOE column and the tornado axis show euro under a "£" label.**
- **Checked:** the live page, with the display currency in pounds.
- **Expected:** the leader is £176/MWh, and the tornado runs from £169 to £183.
- **The tool:** the table shows 210 under "LCOE £/MWh". The tornado axis reads 200 to 220 under "LCOE (£/MWh)" while its own table and base say £176. The PDF tornado is correct (£167.9 to £183.9).
- **Cause:** `app/src/components/RankedList.jsx:244` (`sig(o.eco.lcoe)` is not converted) and `app/src/components/SensitivityView.jsx:62-79` and `:103` (tick values not converted). Confirmed on the live page: `out/browser/02_table_header_rows.txt` and `out/browser/tornado.png`.
- **Fix:** multiply by the display rate, as `perMWh()` does.
- **Known issue:** 45 (confirmed).

**A5. Gas plant is dispatched at 2026 prices but billed at each year's own price.**
- **Checked:** the leader's running cost in the dispatch against the ledger.
- **Expected:** one price set for both. The dispatch uses 170.4 €/MWh for all 20 years: €59.1 gas ÷ 0.45 + €5.4 O&M + €75/t × 0.202 ÷ 0.45. The ledger bills 145 €/MWh in 2027, 164 in 2033 and 226 from 2040, against an average grid price of €210.6. From 2040 the engines cost more than the grid, yet they run 4,934 h a year.
- **What a consistent dispatch gives:** dispatching each year at its own price (the "WHAT IF" lines in `out/handcalc.txt`) gives LCOE −0.14 %, location-based carbon 164.5 g/kWh instead of 177.6 (−7.4 %), and 2,836 engine hours in 2040 instead of 5,008. All of the top 20 have gas plant. The permit condition text ("up to 4,934 h a year") reads from these hours too.
- **Cause:** `app/src/engine/dispatch.js:90` (`plantMarginalCost` uses `ctx.gasPrice` and `ctx.carbonPrice` with no path factor), used at `:121` and `:412`. The ledger applies the path at `app/src/engine/evaluate.js:351-353`, `:367` and `:390`.
- **Fix:** dispatch each ledger year with that year's gas and carbon factors. The steady year currently repeats for 13 years, so this needs more than one dispatched year, or a re-dispatch at the later prices.
- **Known issue:** none (new).

**A6. The "Step down" SMR card (#3708, "Best LCOE in the run, £152/MWh", "A · no conditions") rests on accounting effects and a timeline cut-off.**
- **Checked:** the SMR option's ledger, dates and buildability tier.
- **What I found:**
  - **(a) Residual credit.** The €704 m reactor is bought in 2037, and €587 m of it (83 %, life 60 years) is credited back at year 20. Without that credit its LCOE is 209.8 €/MWh (£175.8), above the leader's 209.5 (£175.5). The card would then not appear at all: a step-down card is shown only when it is cheaper than the leader (`app/src/engine/cards.js:169-170`).
  - **(b) Capex timing.** The capex is booked in the year the reactor is ready, not over its 48-month build. Spreading it over the build adds €67 m of present value: +12.5 €/MWh, giving 223.6 €/MWh (£187) (finding C7).
  - **(c) Timeline cut-off.** It powers 3 of 4 buildings only because the SMR is ready in month 120 and the timeline ends at month 119. With a 144-month timeline, building 4 starts in month 120 and the option powers 100 MW. The grid alone carries the three buildings (112.5 MW against 120 MW), so the SMR adds no IT.
  - **(d) No consent conditions.** It gets tier A because SMRs skip the consent tests (`app/src/engine/programme.js:26` and `:37`, `ownConsent`). Yet 100 MW of gas engines in England get a development consent order condition (card #338). An 80 MW reactor in England would need a development consent order, a nuclear site licence and an environmental impact assessment.
  - **(e) No outages.** Its load factor is 95.5 %, with no refuelling or forced outage.
  - The best 75 MW option without an SMR (#3709, grid alone) costs 212.7 €/MWh. That is above the leader, so there would be no step-down card.
- **Fix:**
  - Show a step-down only on like-for-like terms (LCOE with and without the residual credit).
  - Do not count plant that powers no extra building as a reason to step down.
  - Add consent and licensing conditions for SMRs.
  - Spread the capex of long builds.
- **Known issue:** none.

### B: screens or the PDF disagree

**B1. Compare and the PDF comparison table count a Site (Beta) flag.**
- **The tool:** the leader shows 2 · 5 · 10 there, but 1 · 5 · 10 in the table and the detail. The islanded option shows 3 · 4 · 6 against 2 · 4 · 6, and the SMR 1 · 6 · 8 against 1 · 5 · 7. The extra major flag is `site-does-not-fit` (siteFit = true). The PDF should keep the Site tab out.
- **Cause:** `app/src/components/CompareView.jsx:26`; `app/src/report/report.js:105` and `:615`.
- **Fix:** count `visibleFlags(o, false)`.
- **Known issue:** 48 (the probable cause given there is now confirmed).

**B2. The top-five cards list "Does not fit", a Site (Beta) flag, as a main flag with the Site tab off.**
- **The tool:** all four leading cards show "Main flags: Aggregated combustion thermal input … · Does not fit". The PDF's cards leave it out (`app/src/report/report.js:594`), so screen and PDF differ.
- **Cause:** `app/src/engine/cards.js:220` (`majorFlags` taken from `o.flags`) and `app/src/components/TopFive.jsx:61`.
- **Fix:** the same filter as the table.
- **Known issue:** none (new).

**B3. Euro amounts in flag texts beside pound figures.**
- **The tool:** the leader's detail shows "PPA hedge (not counted): net income £12.4 m (present value £5.91 m)". Two of its own flags state the same sum as "€14.8 m (present value €7.06 m)". The PDF's flag appendix and the gas-price flags are in euro too.
- **Cause:** `app/src/engine/evaluate.js:767-774` (`eur()`), `:832` and `:920`.
- **Known issue:** 47 (confirmed).

**B4. The capex filter works in euro beside figures in pounds.**
- **The tool:** typing the table's "£128 m" filters at €128 m (£107 m) and hides the leader, which is €152.9 m.
- **Cause:** `app/src/components/RankedList.jsx:46-60`, `app/src/engine/view.js:64-65`, `app/src/engine/scoring.js:239`.
- **Known issue:** 46.

**B5. PDF Appendix E shows the SMR's 2037 energy under the header "Last modelled year, steady state (model year 7, from 2033-02)".**
- **The tool:** the SMR is dispatched over 11 years, so its row (684 GWh demand, 669 GWh SMR output) belongs to model year 11, from 2037-02.
- **Cause:** `app/src/report/report.js:634` takes the header from the first row.
- **Fix:** give each row its own year.

**B6. "The best of the adequate options, #298, has 168 g/kWh" and "14 other adequate options score within 1 point".**
- **The tool:** the group meant is the leading rank group (3,205 options), not the 6,170 adequate ones. The SMR (#3708) is adequate at 68.7 g/kWh. The wording appears in the PDF summary and on the Options tab.
- **Cause:** `app/src/engine/summary.js:84` (the group) against `:175-176` (its name).
- **Fix:** name the group ("options that power all 4 buildings within the allowance…").

**B7. The PDF says "Flags never hide, demote or resize an option (the one exception agreed by the owner: power-adequate options rank first)".**
- **The tool:** since the rebuild there are four more rank groups, and 613 options are sized for less than 100 MW. The brief lists these as exceptions; the PDF does not.
- **Cause:** `app/src/report/report.js:437` and `:641`.

**B8. Inside a group the order and the shown score disagree in 400 places.**
- **The tool:** for example #3708 shows 76.1 and sits above #3709 at 78.0; #3258 shows 45.8 above #3259 at 48.7.
- **Cause:** the order uses the unclamped score; the screens show the score clamped to 0–100 (`app/src/engine/scoring.js:79-85` and `:139`). This is deliberate but nowhere explained on screen.
- **Fix:** add a note, or show the score the order uses.

**B9. The carbon-price help text disagrees with the calculation for the UK.**
- **The tool:** the help text says the price goes "to the TYNDP 2026 values (€97.5/t in 2030, €197.5 in 2035, €297.5 in 2040)". For the UK the engine scales €75/t by the EU ratios: €82.8, €167.7 and €252.7.
- **Cause:** `app/src/engine/countryrules.js:115-121` against the inputs panel text.

### C: plausibility concerns an experienced MEP engineer would raise

- **C1. Islanded resilience.** The islanded option is "Meets with flags" with 0 MW of backup that does not burn gas. Its prime and backup are the same 17 × 10 MW engines (N+1 per block of 10) on one gas supply, and the dispatch has no outages. Many engineers would say a gas-only islanded campus does not meet the resilience requirement. Cause: the `resilience()` gas-dependency rule gives a minor flag only (`app/src/engine/evaluate.js:587` onwards).
- **C2. Standby lead time.** Every option with standby gensets starts building 1 nine months late, because gensets are never ordered before their permit (6 + 15 + 6 months). In practice developers order long-lead plant at risk. Known issue 42.
- **C3. Gas price.** The default is €55.1/MWh(th) (World Bank, July 2026), falling to €44 in 2027 and €40 in 2030. The tool's own flag quotes TTF in November 2026 at €85.6. The tornado's high case (× 1.3 = €71.6) does not reach today's market. The leader's swing over that range is about £9/MWh.
- **C4. Grid-side capex looks low.** The substation is €80k/MW (€9.6 m for 120 MW). The cable route defaults to 10 m (€7k). The connection charge defaults to €0, while the tool's own estimate is €18 m. All are flagged as assumed. The ranking moves little, but absolute capex (£128 m) is understated.
- **C5. The grid adder.** The grid non-commodity adder of €115.6/MWh is 55 % of the average grid price (€210.6). It is the biggest single input, and it is "sourced — not independently checked".
- **C6. Residual value.** Plant still in service at year 20 is credited 100 % of its straight-line book value, with no setting to change it (`app/src/engine/evaluate.js:286`). The PDF input table shows only "Residual value at the end: 0.5 of remaining book value when removed" (`app/src/engine/defaults.js:1308`, `app/src/report/plain.js:99`). For long-life plant the credit decides the result (see A6).
- **C7. Capex timing.** Capex is booked in the year the plant is ready, not over its build (`app/src/engine/evaluate.js:205` and `:237`). This understates the present value of long builds: SMR 48 months, gas turbines 40.
- **C8. PPA volume.** The PPA is contracted at 100 % of consumption, although 18.6 % of consumption comes from the campus's own gas engines. 5.03 of the 15 TWh contracted is not delivered, and is settled outside the ledger (owner decision of 2026-10-18; £12.4 m net income not counted). The zero market-based Scope 2 depends on that contract.
- **C9. Equipment costs.** HVO gensets at €460/kW and gas engines at €900/kW are at the low end of the market. Abatement for engines running 4,934 h a year is not costed (the tool says so). Work package 36 plans new figures.

### D: cosmetic

- **D1. Rounding.** The table rounds to 2 significant figures (capex £130 m against £128 m on the card; carbon 180 g against 178) beside 3 elsewhere. This is by design (brief §13.4), but it confuses side by side.
- **D2. "Steady state" opex.** The detail's "Opex … steady state £143 m" is model year 7 (2033). Opex keeps rising to £152 m from 2040 (`app/src/engine/evaluate.js:535-539`).
- **D3. Gas transport charge.** The €4/MWh(th) gas transport adder is scaled by the commodity forecast (`app/src/engine/evaluate.js:367` with `app/src/engine/dispatch.js:41`).
- **D4. Engine records.** The leader carries two records for one set of engines ("bridging", 0 h, and "bridging share kept as prime"), and the Dispatch legend lists both. Costs are counted once.
- **D5. Tornado score column.** It shows 94.72 for every favourable side: the cost axis is held at 100 once LCOE beats the best in the run.

## Tests that would have caught the A and B findings

1. **A1:** for every phased run, the "full load" month on any screen is not earlier than the last building's start, and "on the programme" appears only when `maxLate` = 0.
2. **A2:** an option whose bridging plant is ready after the grid date has no "bridge" in its name, and the PDF claims bridging only when the plant is ready before the gap ends.
3. **A3:** when the leader and the "waiting" reference share every building date, the PDF does not say "reaches full load … earlier".
4. **A4:** with GBP display, every LCOE cell in the table and every tornado tick lies within ±1 % of `perMWh()` of the same value; the T1 leader shows 176, not 210.
5. **A5:** the dispatch's marginal cost for gas plant in year *y* equals the ledger's billed fuel, O&M and carbon cost per MWh in year *y*.
6. **A6:** a step-down card's LCOE advantage survives with no residual credit, and an option whose plant powers no additional building is not offered as a step-down. An SMR in England carries a development consent order condition.
7. **B1, B2:** the flag counts in Compare, the cards and the PDF comparison table equal the table's counts with the Site tab off.
8. **B3:** with GBP display, no "€" appears in any flag text shown beside results.
9. **B4:** typing the table's displayed capex into the filter keeps that option.
10. **B5:** each row of PDF Appendix E names its own model year.
11. **B6:** the summary's group name matches the group it reads.
12. **B7:** the PDF method text matches the brief's list of exceptions when realism is on.
13. **B8:** inside a group, the displayed score never rises down the list, or a note says why.
14. **B9:** the carbon-price help text gives the prices the engine uses for the country.

## Appendix: hand calculations and how to re-run them

Run from this folder (Node 22, Python 3). The scripts were written in a session folder with a copy of `app/` beside them; adjust the paths at the top of `scripts/lib.mjs`, `audit2.mjs`, `handcalc.py` and `browser.py` before re-running. Only `out/handcalc.txt` and `out/ranking.txt` are kept here:

- `node scripts/dump3.mjs` and `node scripts/dump_demand.mjs`: export the inputs, the default records, the hourly profiles and the hourly demand of the three options to `out/` (about 25 s each).
- `python3 scripts/handcalc.py`: the independent hand calculation; 82 figures side by side → `out/handcalc.txt`.
- `node scripts/ranking.mjs`: independent re-ranking of all 6,170 options → `out/ranking.txt`.
- `node scripts/audit2.mjs`: #9, the 75 MW options, the SMR on a 144-month timeline, flag counts by screen, cards, tornado, breakevens, and the PDF in pounds → `out/audit2.txt`, `out/report_audit.pdf`.
- `node scripts/audit3.mjs`: order around #9 to #40, opex by year, the SMR's dispatched years, the technology defaults → `out/audit3.txt`.
- `node scripts/mc.mjs`: 100-sample Monte Carlo and the PDF with it → `out/mc.txt`, `out/report_mc.pdf`. It runs in 6 s; the PDF's Monte Carlo table is in pounds and correct.
- `python3 -I scripts/browser.py`: one pass of the built page → `out/browser/` (screen text, `tornado.png`, `options.png`, `report_app.pdf`).

**Key hand figures for the leader** (euro unless stated):

- **Design load:** 100 MW × PUE 1.5 = 150 MW.
- **Standby gensets:** per building, 37.5 ÷ 2.75 = 14 units, plus 2 for N+1 per block of 10. That gives 64 units, 176 MW in all.
- **Fuel store:** 150 MW × 48 h × 0.26 L/kWh = 1,872 m³.
- **UPS reserve:** 100 MW × 5 min = 8.33 MWh.
- **Gas engines:** (150 − 120) ÷ 10 = 3 units, plus 1 for N+1 = 4 units. Ready in month 6 + 21 + 12 = 39.
- **Capex lines:** substation 9.6; gensets 4 × 20.24; fuel 4 × 0.562; UPS 4 × 1.042; PV 6.0; engines 36.0; cable 0.007. Total with 10 % contingency: 152.88 (engine 152.878).
- **Present values:** capex 118.64, opex 1,321.98, NPV 1,440.62 (engine 1,440.67). Capex is discounted from the start of its year; opex and energy from the end of theirs.
- **LCOE:** 209.53 against 209.54, or £175.52 against £175.53 at 0.8377.
- **Score:** 0.35 × 99.0 + 0.25 × 95.5 + 0.25 × 90.6 + 0.15 × 88 = 94.37 (engine 94.36). The time-to-power axis is (24 − 2.25) ÷ 24 = 90.6.
- **Steady year:** demand 911,705 MWh (check: 100 MW × 0.8 × 8,760 h × 1.3 = 911,040).

**SMR option**, from `out/t1_three_options.json` at 7 %:

- The residual at year 20 is −€613.1 m, worth −€158.4 m in present value.
- LCOE without any residual credit: 211.1. Without the SMR's credit alone: 209.8. The leader is 209.5.
- SMR capex spread over years 6 to 9 instead of booked in year 10: +€67.2 m present value, +12.5 €/MWh.
- Both changes together: 223.6 €/MWh (£187).
