# H2 verification: port slice (2026-10-18)

Verifier H2. Mechanical checks only: file reads, grep and diffs. `npm run build` was not run, no test was re-run, and no file other than this report was changed.

**Inputs.** Brief (read-only): /home/claude/build/brief-v2/BRIEF.md, cited as "l.N". This line: /home/claude/build/app (/home/claude/build/app/BUILD-NOTES.md slice at lines 1085–1222, test run at 1224–1313; /home/claude/build/app/PORT-PROGRESS.md). Source line (read-only): /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app (its BUILD-NOTES 421–472). Before-state: /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/port/baseline/app.

**Tests.** Not re-run by this verifier. Results cited from this line's BUILD-NOTES: npm test 44/44 (line 1277), browser 29/29 (line 1312).

## Summary

| Check | Result |
|---|---|
| Requirements (44 rows, section 2) | 22 IMPLEMENTED, 13 PARTIAL, 6 DEFERRED (recorded), 3 MISSING |
| Source fidelity (45 rows, section 3) | 20 PORTED, 22 CHANGED (15 recorded, 2 partly recorded, 5 not recorded), 3 NOT PORTED (2 recorded, 1 not) |
| Owner decision (section 1) | Matches the decision wording |
| Colour tokens (section 4) | Site plan and dispatch chart use the same `--src-*` token for every shared source; only the hatch differs (solar, battery, grid) |
| §23 new default records (section 5) | 4 added; each has a basis and the label; none missing |

MISSING, none recorded in BUILD-NOTES: §12.6 bridging-period shading (R14); §12.6 grid-date uncertainty band (R15); §17 initial load and bundle size (R35).

## 1. Owner decision check (2026-10-18)

Decision wording, as given in the verification task: "PPA settlement counts only on delivered energy; settlement on undelivered volume is reported as a separate hedge line outside the cost ledger and the score."

| Element | Code (absolute path:line) | Result |
|---|---|---|
| Ledger PPA line counts delivered energy only | `/home/claude/build/app/src/engine/evaluate.js:249` `L.ppa += d.ppaDeliveredMWh * ppaPrice;` with `:211` `const ppaPrice = sz.ppa ? PPA.strike[sz.ppa.type] + PPA.shapingAdder : 0;` | Matches. Before (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/port/baseline/app/src/engine/evaluate.js:235`): `L.ppa += d.ppaContractMWh * ppaPrice - d.ppaResaleValue * elecEsc;` |
| Grid adder applies to delivered PPA only | `/home/claude/build/app/src/engine/dispatch.js:230` `ppaNetworkCost += ppaUse * adder;`; `/home/claude/build/app/src/engine/evaluate.js:247` `L.grid += d.gridCost * elecEsc + d.ppaNetworkCost;` | Matches |
| Undelivered volume recorded, not booked in the ledger | `/home/claude/build/app/src/engine/dispatch.js:233` `ppaUndeliveredMWh += ppaV - ppaUse;`; `:234` `ppaUndeliveredSpotValue += (ppaV - ppaUse) * pPrice[h] * priceMult;`; `/home/claude/build/app/src/engine/evaluate.js:250` `const hv = d.ppaUndeliveredSpotValue * elecEsc - d.ppaUndeliveredMWh * ppaPrice;` | Matches. Before: `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/port/baseline/app/src/engine/dispatch.js:224` `ppaResaleValue += (ppaV - ppaUse) * gp;`, netted as income in the ledger |
| Separate hedge line | `/home/claude/build/app/src/engine/evaluate.js:218` `const hedge = sz.ppa ? { byYear: [], ... } : null;`; `:251–257` accumulate by year, total, present value and volumes; `:303` `ppaHedge: hedge, // outside the ledger (see above); null without a PPA`; `/home/claude/build/app/src/components/OptionDetail.jsx:43` `<th scope="row">PPA hedge (not counted)</th>` | Matches |
| Outside the cost ledger | `/home/claude/build/app/src/engine/evaluate.js:277` `L.opex = L.fom + L.vom + L.fuel + L.grid + L.ppa + L.carbon + L.rental + L.testRun - L.revenue;` has no hedge term; no ledger row carries the hedge | Matches |
| Outside LCOE and NPV | `/home/claude/build/app/src/engine/evaluate.js:288` `pvCost = pvCapex + pvOpex;`; `:289` `const lcoe = pvEnergy > 0 ? pvCost / pvEnergy : Infinity;`; `:296` `npvCost: pvCost,` | Matches; both derive from the ledger only |
| Outside the score | `/home/claude/build/app/src/engine/scoring.js:18` `const cost = settings.costMetric === 'npv' ? o.eco.npvCost : o.eco.lcoe;`; carbon, time-to-power and deliverability do not read the hedge; deliverability counts permitting flags only (`/home/claude/build/app/src/engine/evaluate.js:580–581`) | Matches |
| Flag text | `/home/claude/build/app/src/engine/evaluate.js:464–466` (quoted below) | Matches. Minor when import-limited (`:459`, `:464`), info otherwise |
| Option detail | `/home/claude/build/app/src/components/OptionDetail.jsx:89` (row), `:92` (note: "...the PPA hedge is reported outside the ledger, LCOE, NPV and score.") | Matches |

Flag message, `/home/claude/build/app/src/engine/evaluate.js:465` (parts elided): "...is not delivered physically (...). Its settlement, a net income or cost of €X m (present value €Y m), is reported as "PPA hedge (not counted)": it is not in the cost ledger, LCOE, NPV or score, because PPA settlement counts only on energy delivered over the grid connection."

**Verdict: matches the decision.** The ledger counts delivered energy; the settlement on undelivered volume is a separate hedge line outside the ledger and the score. Two notes, neither a deviation:
1. The flag and the option-detail note also name LCOE and NPV. The decision wording does not, but both are derived from the ledger, so the exclusion follows from it.
2. Carbon accounting still counts contracted volume (market-based Scope 2 at `/home/claude/build/app/src/engine/evaluate.js:268`; hourly CFE). This is outside a settlement decision as worded and is open point 4 (BUILD-NOTES 1218).

Evidence: tests 11a and 11b (BUILD-NOTES 1138 and 1120; final run lines 1265–1266). Not re-run here.

## 2. Requirements (brief)

Status: IMPLEMENTED (with file:line), PARTIAL, DEFERRED (with BUILD-NOTES line), MISSING. Paths are absolute under /home/claude/build/app/src unless shown.

| # | Brief | Requirement | Status | Evidence | Note |
|---|---|---|---|---|---|
| R01 | §9.2 (l.419, 425) | Bridging battery sized, with a sentence showing the numbers and the supply month | IMPLEMENTED | `/home/claude/build/app/src/engine/sizing.js:146–164` (sentence `:164`) | Wording differs from the source (source /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sizing.js:161) |
| R02 | §9.4 (l.443) | PPA energy delivered over the grid connection, capped by import capacity | IMPLEMENTED | `/home/claude/build/app/src/engine/dispatch.js:218–234` (cap `:225`) | Undelivered volume now recorded separately (`:233–234`) |
| R03 | §9.5 (l.462) | One cash-flow ledger is the source of truth for LCOE, NPV and the capex/opex split | IMPLEMENTED | `/home/claude/build/app/src/engine/evaluate.js:277, 288–301` | Hedge is outside the ledger by the owner decision (`:218`, `:303`); tests 11a and 11b |
| R04 | §9.5 (l.466) | PPA cost = strike × volume + shaping adder | IMPLEMENTED | `/home/claude/build/app/src/engine/evaluate.js:211, 249` | Volume is delivered volume, per the decision |
| R05 | §9.5 (l.468) | LCOE per delivered MWh, NPV, capex/opex split, annual opex | IMPLEMENTED | `/home/claude/build/app/src/engine/evaluate.js:284–301` | Reconciled by test 11b |
| R06 | §9.8 (l.496) | Supply-available date per source: planning, procurement, construction, or earliest availability | IMPLEMENTED | `/home/claude/build/app/src/engine/sizing.js:15–26`; `/home/claude/build/app/src/engine/evaluate.js:26–28`; `/home/claude/build/app/src/engine/dispatch.js:90` | One month for time-to-power, dispatch, sizing and BESS capex |
| R07 | §9.8 (l.499) | Power gap in MW-months | IMPLEMENTED | `/home/claude/build/app/src/components/DispatchView.jsx:238`; `/home/claude/build/app/src/engine/evaluate.js:54` (gapMWm) | — |
| R08 | §9.8 (l.501) | Outputs: first power, full load, months of delay against the target, power gap, phasing chart | PARTIAL | `/home/claude/build/app/src/components/DispatchView.jsx:236–240` (first power, full load, power gap, bridging month); delay computed at `/home/claude/build/app/src/engine/evaluate.js:51–52`, shown only in the flag when missed (`:518–519`) | No delay value on the Dispatch tab or option detail; not noted in BUILD-NOTES |
| R09 | §9.8 (l.501) | Ranges from grid-date and lead-time uncertainty | DEFERRED | BUILD-NOTES 190 (ranges, Monte Carlo); 1221 (lead times) | — |
| R10 | §11 (l.580) | Cost axis is NPV or LCOE, user-selectable (default LCOE) | IMPLEMENTED | `/home/claude/build/app/src/engine/scoring.js:17–20` | — |
| R11 | §11 (l.582) | Linear 0–100 normalisation across the scoring set | IMPLEMENTED | `/home/claude/build/app/src/engine/scoring.js:29–33` | T3 cost axis compressed (BUILD-NOTES 1136; open point 2 at 1216) |
| R12 | §12.3 (l.610) | Option card, Energy tab: dispatch stacks, battery SoC, curtailment, unmet load | PARTIAL | `/home/claude/build/app/src/components/DispatchView.jsx:310–354` (hourly stacks, SoC) | Option card DEFERRED (BUILD-NOTES 196); representative-day tier DEFERRED (194); 8760 heat map not built |
| R13 | §12.6 (l.622) | Phasing timeline: demand line against supply stacked by source; power gaps in the flag colour | IMPLEMENTED | `/home/claude/build/app/src/components/DispatchView.jsx:161–182, 234–259`; `/home/claude/build/app/src/components/StackChart.jsx:8–9, :11` | Monthly stacked chart rather than a Gantt layout; see R14–R16 |
| R14 | §12.6 (l.622) | Bridging periods shaded | MISSING | No shading in `/home/claude/build/app/src/components/DispatchView.jsx` or `/home/claude/build/app/src/components/StackChart.jsx` | Not recorded in BUILD-NOTES |
| R15 | §12.6 (l.622) | Grid-date uncertainty as a band | MISSING | No band code | Not recorded (grid-date ranges deferred with Monte Carlo, BUILD-NOTES 190) |
| R16 | §12.6 (l.622) | Side-by-side phasing for pinned options | DEFERRED | — | BUILD-NOTES 195 (pinning) |
| R17 | §12.10 (l.642) | PNG or SVG of any chart | DEFERRED | — | BUILD-NOTES 193 |
| R18 | §13.3 (l.666) | Tornado per option: weighted-score swing for each driver, low to high | IMPLEMENTED | `/home/claude/build/app/src/engine/sensitivity.js:114–161`; `/home/claude/build/app/src/components/SensitivityView.jsx:35–113, 125–140` | One option at a time (the one selected) |
| R19 | §13.3 (l.666) | LCOE swing for each driver | PARTIAL | `/home/claude/build/app/src/engine/sensitivity.js:150` computes `lcoeSwing`; `/home/claude/build/app/src/components/SensitivityView.jsx:133–134` show LCOE at low and high only | LCOE swing not shown; not recorded |
| R20 | §13.3 (l.666) | Top 12 drivers, run setting, editable 1–30 | PARTIAL | `/home/claude/build/app/src/engine/defaults.js:528` (value 12); `/home/claude/build/app/src/engine/sensitivity.js:82–85` (clamp 1–30); `/home/claude/build/app/src/components/SensitivityView.jsx:142` (value shown) | No UI control; the record note says "editable 1–30" (`/home/claude/build/app/src/engine/defaults.js:528`); not recorded |
| R21 | §13.3 (l.666) | Default drivers: grid date, grid price, gas, carbon, WACC, IT load, PUE, capex by technology, solar yield, PPA price, BESS cost, lead times | PARTIAL | `/home/claude/build/app/src/engine/sensitivity.js:32–79` (seven drivers: the six listed plus grid carbon) | PUE, capex, solar yield, PPA price, BESS cost and lead times not built: BUILD-NOTES 1221 and 190; disclosed in the app at `/home/claude/build/app/src/components/SensitivityView.jsx:145` |
| R22 | §13.3 (l.667) | Breakeven table, default 5 competitors × 8 drivers | DEFERRED | — | BUILD-NOTES 190 |
| R23 | §13.3 (l.668) | Scenarios: high, central and low; user-defined scenario | DEFERRED | — | BUILD-NOTES 191 |
| R24 | §13.4 (l.675) | Rounding: 2 significant figures in summary views, 3 in detail views | PARTIAL | `/home/claude/build/app/src/components/SensitivityView.jsx:120, 133–134` (scores at 4 s.f.), `:32` (readout); 3 s.f. at `:30, :82, :135` | Detail table shows 4 s.f.; not recorded |
| R25 | §13.4 (l.672) | Ranges as lighter bands on the same axis as the central value | IMPLEMENTED | `/home/claude/build/app/src/components/SensitivityView.jsx:88–100`; `/home/claude/build/app/src/styles.css:557–559, 573–574` | Two neutral lightness steps for low and high |
| R26 | §15 (l.703) | Flag: PPA limited by import capacity | IMPLEMENTED | `/home/claude/build/app/src/engine/evaluate.js:457–467` | Minor if import-limited, info otherwise (BUILD-NOTES 1118) |
| R27 | §15 (l.707) | Flag: time-to-power target missed by N months | IMPLEMENTED | `/home/claude/build/app/src/engine/evaluate.js:518–519` | — |
| R28 | §16 (l.722) | One source colour system across dispatch stacks, site blocks, schematics and charts, with pattern or shape redundancy | PARTIAL | Tokens shared (section 4); hatch only on firm plant and wind in the chart (`/home/claude/build/app/src/components/DispatchView.jsx:204, :206`); schematics DEFERRED (BUILD-NOTES 196) | Judgement 9 (BUILD-NOTES 1203) and open point 5 (1219) |
| R29 | §16 (l.723) | Status colours separate from source colours, paired with icon and text | IMPLEMENTED | `/home/claude/build/app/src/components/DispatchView.jsx:176, :184` ("! Power gap"); `/home/claude/build/app/src/components/StackChart.jsx:11`; `/home/claude/build/app/src/styles.css:540` | — |
| R30 | §16 (l.721) | Phone (360–767 px): read mode; charts with table alternatives | PARTIAL | Checked at 375 px (BUILD-NOTES 1182–1185; B22, B23) | Battery charge chart has no table (R33) |
| R31 | §16 (l.719) | Tabs: Options, Trade-offs, Site, Compare, Uncertainty, Report | PARTIAL | `/home/claude/build/app/src/App.jsx:152` (Options, Trade-offs, Site, Dispatch, Sensitivity) | Sensitivity holds only the tornado; Compare DEFERRED (BUILD-NOTES 189); Report DEFERRED (193) |
| R32 | §17 (l.748) | No main-thread task above 50 ms during compute | PARTIAL | BUILD-NOTES 1220 (open point 6): tornado slice up to 179 ms; Dispatch re-run a few hundred ms | Target not met; recorded |
| R33 | §17 (l.754) | WCAG 2.2 AA: keyboard, focus, contrast; data-table alternative for every chart | PARTIAL | Keyboard and axe checks pass (BUILD-NOTES 1184–1185, 1312); `/home/claude/build/app/src/components/DispatchView.jsx:338–354` has no table; the week table (`:357–371`) has no state of charge | Battery chart table missing; not recorded |
| R34 | §17 (l.754) | Screen-reader walk-through (NVDA with Firefox; VoiceOver with Safari) | DEFERRED | — | BUILD-NOTES 1222 (open point 8) |
| R35 | §17 (l.749) | Initial load to interactive ≤ 3 s; JS bundle ≤ 1.5 MB gzipped | MISSING | No timing or gzip size in the slice; single file 791.0 KB uncompressed (BUILD-NOTES 1226) | Not measured and not recorded |
| R36 | BRIEF l.95 | Static site; must run offline once loaded | IMPLEMENTED | Test 14 (BUILD-NOTES 1176, 1275); B28: all requests file:, blob: or data: (1318) | — |
| R37 | §21 AC2 (l.829) | Energy conserved every hour; unmet load flagged | IMPLEMENTED | Tests 1 and 12b (BUILD-NOTES 1232, 1268) | — |
| R38 | §21 AC3 (l.830) | LCOE, NPV and capex/opex reconcile to one ledger (difference < 0.1 %) | IMPLEMENTED | Test 11b (BUILD-NOTES 1120, 1266) | Largest relative difference 6.4e-16 |
| R39 | §21 AC9 (l.836) | Every default shows its source or the label; a test enumerates them | IMPLEMENTED | `/home/claude/build/app/src/engine/defaults.js:525–528`; LABEL at `:13`, applied in `rec()` at `:36`; test 5d counts 496 (BUILD-NOTES 1191, 1239) | — |
| R40 | §21 AC11 (l.838) | Zero serious axe issues; manual keyboard and screen-reader walk-through | PARTIAL | Axe and keyboard checks pass (BUILD-NOTES 1184–1185) | Screen-reader walk-through DEFERRED (1222) |
| R41 | §21 AC15 (l.842) | Every run, view or ranking setting has a §18 record with basis and label | PARTIAL | topDrivers record (`/home/claude/build/app/src/engine/defaults.js:528`) | View selections have no record: option selectors open on the leader (`/home/claude/build/app/src/App.jsx:64–65`), default year and week (`/home/claude/build/app/src/components/DispatchView.jsx:114–116`); not recorded |
| R42 | §23 (l.873) | Label rule for every default | IMPLEMENTED | Section 5 | Four new records labelled; none missing |
| R43 | §23 (l.874) | Constraints flagged, never enforced | IMPLEMENTED | `/home/claude/build/app/src/engine/evaluate.js:457–467` (flag only); `/home/claude/build/app/src/engine/evaluate.js:580–581` | — |
| R44 | §23 (l.875) | Assumptions visible and editable | IMPLEMENTED | `/home/claude/build/app/src/components/InputsPanel.jsx:91–92, :162–163`; `/home/claude/build/app/src/components/SensitivityView.jsx:132` (range per driver) | — |

Count: IMPLEMENTED 22 (R01–R07, R10, R11, R13, R18, R25–R27, R29, R36–R39, R42–R44); PARTIAL 13 (R08, R12, R19–R21, R24, R28, R30–R33, R40, R41); DEFERRED 6 (R09, R16, R17, R22, R23, R34); MISSING 3 (R14, R15, R35).

## 3. Source fidelity

Source root (read-only): /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app. Status: PORTED = same behaviour here; CHANGED = different, with the difference stated; NOT PORTED = absent. "Recorded" means this line's BUILD-NOTES names the change or gap (line given).

### 3a. Tornado tab (source BUILD-NOTES 421–427)

| # | Source behaviour (source file:line) | This line (absolute file:line) | Status | BUILD-NOTES |
|---|---|---|---|---|
| T-1 | Re-run one option at low and high of seven drivers: grid date −6/+24 months, grid price ×0.7/×1.5, grid carbon ×0.8/×1.2, gas ×0.7/×1.3, EU ETS ×0.5/×1.5, WACC 4/12 %, IT load ×0.8/×1.2 (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sensitivity.js:24–36`) | `/home/claude/build/app/src/engine/sensitivity.js:32–79`: the same seven drivers and the same ranges | PORTED | — |
| T-2 | Ranges hard-coded in the engine (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sensitivity.js:24–36`) | Ranges from §18 records: `/home/claude/build/app/src/engine/defaults.js:525–528` (new), `:592–594`, `:628` (existing) | CHANGED: ranges are records | 1160; judgement 12 (1206). Recorded |
| T-3 | Gas factor applied to the built context's gas price, commodity plus transport adder (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sensitivity.js:44`; `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/context.js:98` `cdata.gas + FUEL.gasTransportAdder`) | `/home/claude/build/app/src/engine/sensitivity.js:58` scales the commodity only; the adder is added afterwards (`/home/claude/build/app/src/engine/context.js:105`). The low price is therefore higher, and the high price lower, by 0.3 × adder | CHANGED | NOT RECORDED as a scaling difference (1162 covers the adder for entered values only) |
| T-4 | Carbon driver "EU ETS carbon price" ×0.5/×1.5, scaled on the built context (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sensitivity.js:33, :45`) | `/home/claude/build/app/src/engine/sensitivity.js:62–64` "Carbon price (Scope 1)", through the input `economics.carbonPrice` (`/home/claude/build/app/src/engine/context.js:109`) | CHANGED: method and label | Method recorded (1162); label not recorded (minor) |
| T-5 | Grid-date driver moves the full-connection date only (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sensitivity.js:26`) | `/home/claude/build/app/src/engine/sensitivity.js:38–39` also move the intermediate grid steps | CHANGED | 1206 (judgement 12); 1160. Recorded |
| T-6 | Score recomputed against the base run's axis ranges and clipped to 0–100 (source BUILD-NOTES 423) | `/home/claude/build/app/src/engine/sensitivity.js:89–100`, using `/home/claude/build/app/src/engine/scoring.js` `axisScore` and `SCORE_KEYS` | PORTED | 1158 |
| T-7 | Top-N = 12 as a function argument; no UI control (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sensitivity.js:79`) | `/home/claude/build/app/src/engine/sensitivity.js:82–85` (record `sensitivity.topDrivers`, clamp 1–30); no UI control, value shown at `/home/claude/build/app/src/components/SensitivityView.jsx:142` | PORTED (no control, as in the source) | 1160 (record). The editable gap is not recorded (R20) |
| T-8 | One synchronous compute, deferred with `setTimeout` (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/SensitivityView.jsx:28`) | `/home/claude/build/app/src/components/SensitivityView.jsx:178–197`: one re-run per tick, progress line; `/home/claude/build/app/src/engine/sensitivity.js:114` generator; cache per run, option and weighting | CHANGED | 1158, 1164, 1205. Recorded |
| T-9 | Option selector limited to the top 50 ranked options (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/SensitivityView.jsx:9`, `slice(0, 50)`) | `/home/claude/build/app/src/components/SensitivityView.jsx:155`: every option, leader by default | CHANGED | 1164 states the new behaviour, not the change from top 50. NOT RECORDED as a change |
| T-10 | Table with an in-cell swing bar for each driver (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/SensitivityView.jsx:88`) | `/home/claude/build/app/src/components/SensitivityView.jsx:125–140`: no bar cell; the tornado chart replaces it | NOT PORTED | NOT RECORDED |
| T-11 | Not in the source slice: capex by technology, PUE, solar yield, BESS cost, lead times, breakevens, Monte Carlo, scenarios (source BUILD-NOTES 427) | Not built | NOT PORTED (also absent in source) | 1221 (drivers); 190–191 (breakevens, Monte Carlo, scenarios). In-app note `/home/claude/build/app/src/components/SensitivityView.jsx:145`. Recorded |

### 3b. Loading message, startup errors, hosted page (source BUILD-NOTES 439–446)

| # | Source behaviour (source file:line) | This line (absolute file:line) | Status | BUILD-NOTES |
|---|---|---|---|---|
| L-1 | Loading message inside `#root` until the app mounts; says to open the file in a browser if scripts never run (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/index.html:14`) | `/home/claude/build/app/index.html:14` | PORTED (wording of the browser list reordered: L-3) | 1172 |
| L-2 | "The first results take about 10 seconds" (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/index.html:14`) | `/home/claude/build/app/index.html:14`: "about 10 to 20 seconds" | CHANGED | 1175. Recorded |
| L-3 | `<noscript>` text and browser list order (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/index.html:17`) | `/home/claude/build/app/index.html:17` | CHANGED (wording only) | NOT RECORDED (immaterial) |
| L-4 | Inline startup-error handler: shows the error on the page while the app has not started or after it stopped; quiet once running (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/index.html:18–39`) | `/home/claude/build/app/index.html:18–39`: same logic; only the comments at `:20–21` changed | PORTED | 1172 |
| L-5 | Hosted page keeps only `<title>`, `<style>` and body (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/build.mjs:39–51`) | `/home/claude/build/app/build.mjs:45–53` | PORTED | 1173 |
| L-6 | Not in the source: build-time check that no document tags remain | `/home/claude/build/app/build.mjs:52` | CHANGED (added) | 1173. Recorded |
| L-7 | Not in the source: `__HOSTED__` define, false in normal and single-file builds, true in the hosted page | `/home/claude/build/app/build.mjs:37–41` | CHANGED (added) | 1173. Recorded |
| L-8 | Run log copied to the clipboard in the hosted page, with a select-the-text fallback (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/RunProgress.jsx:81–94`) | `/home/claude/build/app/src/components/RunProgress.jsx:82–94, 135, 141–147` | PORTED | 1174 |
| L-9 | Download code dropped at build time (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/RunProgress.jsx:18`) | `/home/claude/build/app/src/components/RunProgress.jsx:19` | PORTED | 1174 |
| L-10 | `const HOSTED = typeof __HOSTED__ !== 'undefined' && __HOSTED__;` (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/RunProgress.jsx:13`) | `__HOSTED__` read at each use with no `typeof` guard (`/home/claude/build/app/src/components/RunProgress.jsx:19, :82, :135, :137, :141`) | CHANGED | Write-at-use recorded (1174); the guard removal is not. A bundle without the define would throw a ReferenceError (none in the shipped builds) |
| L-11 | Ground-PV fill in the layout (source BUILD-NOTES 444) | Not ported | NOT PORTED | 1085 ("their /home/claude/build/app/src/engine/site.js / PV-fill parts skipped"). Recorded |

### 3c. Bridging-battery timing fix (source BUILD-NOTES 459–464)

| # | Source behaviour (source file:line) | This line (absolute file:line) | Status | BUILD-NOTES |
|---|---|---|---|---|
| B-1 | Time-to-power, dispatch and sizing read one supply month for the bridging battery (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/evaluate.js:27`; `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/dispatch.js:90`; `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/sizing.js:146–161`) | `/home/claude/build/app/src/engine/evaluate.js:26–28`; `/home/claude/build/app/src/engine/dispatch.js:90–98`; `/home/claude/build/app/src/engine/sizing.js:146–164` | PORTED (the sizing sentence is reworded) | 1093. Recorded |
| B-2 | Bridging battery capex and fixed O&M booked in year 0 (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/evaluate.js:109`, `:176`: `v.C2 === 'bessSolar' ? 0 : avail('bess')`) | `/home/claude/build/app/src/engine/evaluate.js:108–115` and `:189`: availability year for every option | CHANGED | 1095; judgement 1 (1195). Recorded |
| B-3 | Test 13 (source) | Test 10 (`/home/claude/build/app/tests/port-tests.mjs`) | PORTED | 1110 |
| B-4 | Inspector derives the bridging battery as `max(0, supply − grid − firm)` (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/inspect.js:117`) | `/home/claude/build/app/src/engine/inspect.js:131` reads the bridging battery from sizing (`sz.bridgeBess`) | CHANGED | NOT RECORDED as a change (1142 names the series, not the derivation) |

### 3d. Dispatch tab (source BUILD-NOTES 448–472)

| # | Source behaviour (source file:line) | This line (absolute file:line) | Status | BUILD-NOTES |
|---|---|---|---|---|
| D-1 | Inspector re-runs one option with hourly records; returns phasing series, year balances and week helpers (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/engine/inspect.js`) | `/home/claude/build/app/src/engine/inspect.js:61–98, 109–172`, via `/home/claude/build/app/src/engine/option.js:18–35` (the run's own per-option chain, including layout and site fit) | CHANGED (full chain) | 1142. Recorded |
| D-2 | Re-run "about 0.1 s on desktop" each time the tab opens (source BUILD-NOTES 450) | `/home/claude/build/app/src/components/DispatchView.jsx:67–74` (cache per run and option); 0.5–0.7 s in headless Chromium | CHANGED | 1144. Recorded |
| D-3 | Monthly phasing: grid offered, firm plant per source, battery bridging, supply, design load, gap (source BUILD-NOTES 453) | `/home/claude/build/app/src/components/DispatchView.jsx:161–182, 234–259` | PORTED | 1142, 1144 |
| D-4 | Stacked step chart: merit order upwards, non-serving energy downwards; demand line; status strip; labelled markers (`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/StackChart.jsx`; source BUILD-NOTES 452) | `/home/claude/build/app/src/components/StackChart.jsx:8–9, :53`; `/home/claude/build/app/src/components/DispatchView.jsx:166` (markers), `:176` (strip) | PORTED | — |
| D-5 | Crosshair readout on hover or arrow keys; live region (source `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/StackChart.jsx:158–162, :230`) | `/home/claude/build/app/src/components/StackChart.jsx:179–183, :267` (same keys: arrows, Home, End, Escape) | PORTED | — |
| D-6 | Chart role "group" (source `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/StackChart.jsx:188`) | `/home/claude/build/app/src/components/StackChart.jsx:215–216`: role "application" | CHANGED | 1204. Recorded |
| D-7 | Four source tokens (renewables, battery, firm, grid); unmet load and power gap in a critical-red strip (source BUILD-NOTES 454) | Plan's `--src-*` tokens (`/home/claude/build/app/src/components/DispatchView.jsx:15–16, :52–65`; `/home/claude/build/app/src/styles.css:365–381`); strip in `--bad` (`/home/claude/build/app/src/components/StackChart.jsx:11`; `/home/claude/build/app/src/styles.css:540`) | CHANGED | 1146; 1151–1153. Recorded |
| D-8 | Firm plant and renewables distinguished by colour alone (source BUILD-NOTES 454) | Firm plant and wind also hatched (`/home/claude/build/app/src/components/DispatchView.jsx:204, :206`) | CHANGED | 1203 (judgement 9). Recorded |
| D-9 | PPA inside the grid band; readout, week table and balance split PPA from spot grid (source BUILD-NOTES 454) | `/home/claude/build/app/src/components/DispatchView.jsx:172, :336, :357–371, :385` | PORTED | 1146 |
| D-10 | Annual balance in the engine's form; largest hourly error shown (source BUILD-NOTES 451, 456) | `/home/claude/build/app/src/components/DispatchView.jsx:377–399`; the PPA row now shows contracted and not-delivered volume (owner decision) | PORTED | 1146; decision 1112–1120 |
| D-11 | Week controls and presets (peak demand, most unmet, most curtailment, least renewables); week box keeps typed text; week 52 covers the last 24 h (source `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/DispatchView.jsx:222–234`; BUILD-NOTES 466, 469) | `/home/claude/build/app/src/components/DispatchView.jsx:296–303`; `/home/claude/build/app/src/engine/inspect.js:66–98`; week 52 is 8 days | PORTED | 1142 |
| D-12 | Default year (most unmet) and default week (most unmet week) (source `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/DispatchView.jsx:17–25, :46–53`) | `/home/claude/build/app/src/components/DispatchView.jsx:114–116` | PORTED | — |
| D-13 | Timeline table column "Battery bridging MW"; caption giving the stacking order (source BUILD-NOTES 467–468; `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/DispatchView.jsx:264`) | `/home/claude/build/app/src/components/DispatchView.jsx:265`; help text `:336` | PORTED | — |
| D-14 | Option selector limited to the top 50 (source `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/DispatchView.jsx:29`) | `/home/claude/build/app/src/components/DispatchView.jsx:68`: every option | CHANGED | 1201 (judgement 7). Recorded |
| D-15 | Switching tabs resets the option, year and week (source BUILD-NOTES 470) | `/home/claude/build/app/src/App.jsx:64`: option kept across tabs; year and week reset on remount (`/home/claude/build/app/src/components/DispatchView.jsx:114–116`) | CHANGED | 1201. Recorded |
| D-16 | Tab bar scrolls sideways on narrow screens (source BUILD-NOTES 455) | `/home/claude/build/app/src/App.jsx:236–246` (adds Home and End); `/home/claude/build/app/src/styles.css` (inset baseline, focus ring) | CHANGED | 1180. Recorded |
| D-17 | Battery charge-level chart (source `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/DispatchView.jsx`) | `/home/claude/build/app/src/components/DispatchView.jsx:338–354`; no data table | PORTED | Gap R33 |
| D-18 | Open point: time-to-power counts battery MW without energy (source BUILD-NOTES 471) | Not changed (`/home/claude/build/app/src/engine/evaluate.js:26–28`) | PORTED (carried) | 1215 (open point 1) |
| D-19 | Unmet-load strip label with a warning-symbol prefix (source `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/src/components/DispatchView.jsx:131`) | `/home/claude/build/app/src/components/DispatchView.jsx:393`: "! Unmet load" | CHANGED (symbol) | NOT RECORDED (immaterial) |

Count (45 rows): PORTED 20 (T-1, T-6, T-7; L-1, L-4, L-5, L-8, L-9; B-1, B-3; D-3, D-4, D-5, D-9, D-10, D-11, D-12, D-13, D-17, D-18). CHANGED 22: recorded 15 (T-2, T-5, T-8; L-2, L-6, L-7; B-2; D-1, D-2, D-6, D-7, D-8, D-14, D-15, D-16); partly recorded 2 (T-4, L-10); not recorded 5 (T-3, T-9, L-3, B-4, D-19). NOT PORTED 3: recorded 2 (T-11, L-11); not recorded 1 (T-10).

Unrecorded changes, for the owner: T-3 (gas driver scales commodity only), T-9 (tornado option list no longer top 50; only the new state is recorded), T-10 (in-cell swing bars dropped), B-4 (inspector bridging battery read from sizing rather than derived), and two immaterial wording or symbol changes (L-3, D-19). Partly recorded: T-4 (carbon driver renamed "Carbon price (Scope 1)"; the method is recorded) and L-10 (the `typeof` guard was removed; the write-at-use change is recorded).

## 4. Colour system (site plan and dispatch chart)

Token definitions: `/home/claude/build/app/src/styles.css:365–381` (light `:root`, dark under `prefers-color-scheme` with the `:not([data-theme="light"])` guard, and dark under `data-theme="dark"`); curtailment neutral at `/home/claude/build/app/src/styles.css:495–497`. Plan: `/home/claude/build/app/src/components/site/SitePlan.jsx`. Chart: `/home/claude/build/app/src/components/DispatchView.jsx` and `/home/claude/build/app/src/components/StackChart.jsx`.

| Source (key) | Site plan: fill and hatch | Dispatch chart: fill and hatch | Same token? |
|---|---|---|---|
| Solar PV (`solar`) | Fill `var(--src-solar)`: `/home/claude/build/app/src/components/site/SitePlan.jsx:254` (PV), `:264` (blocks from `/home/claude/build/app/src/engine/blocks.js:243, :270`); hatch `v` (`/home/claude/build/app/src/components/site/SitePlan.jsx:12–14`), applied at `:265` | Fill C.solar = `var(--src-solar)` (`/home/claude/build/app/src/components/DispatchView.jsx:16`, `:203`); no hatch | Yes (fill). Hatch differs |
| Wind (`wind`) | Fill `var(--src-wind)` (`/home/claude/build/app/src/engine/blocks.js:254, :261` → `/home/claude/build/app/src/components/site/SitePlan.jsx:264`); hatch `rings` | C.wind = `var(--src-wind)` (`/home/claude/build/app/src/components/DispatchView.jsx:16`, `:204`); hatch `wind` → `rings` (`/home/claude/build/app/src/components/StackChart.jsx:74, :200`) | Yes; hatch same |
| Battery (`bess`) | Fill `var(--src-bess)` (`/home/claude/build/app/src/engine/blocks.js:211` → `/home/claude/build/app/src/components/site/SitePlan.jsx:264`); hatch `grid` | C.bess = `var(--src-bess)` (`/home/claude/build/app/src/components/DispatchView.jsx:16`, `:174`, `:205`); no hatch | Yes (fill). Hatch differs |
| Grid import and export (`grid`) | Fill `var(--src-grid)` (`/home/claude/build/app/src/engine/blocks.js:142` → `/home/claude/build/app/src/components/site/SitePlan.jsx:264`; legend `:41`); hatch `h` | C.grid = `var(--src-grid)` (`/home/claude/build/app/src/components/DispatchView.jsx:16`, `:172`, `:211`, `:326`); no hatch | Yes (fill). Hatch differs |
| Gas plant (`gas`) | Fill `var(--src-gas)` (`/home/claude/build/app/src/engine/blocks.js:60` via SOURCE_OF_TECH: gasRecip, chp, rented, gasTurbine, backupGas; `/home/claude/build/app/src/engine/blocks.js:74`); hatch `d135` | Firm band `var(--src-gas)` (`/home/claude/build/app/src/components/DispatchView.jsx:52–65`); hatch `gas` → `d135` (`/home/claude/build/app/src/components/StackChart.jsx:74, :200`) | Yes; hatch same |
| HVO-diesel plant (`diesel`) | Fill `var(--src-diesel)` (`/home/claude/build/app/src/engine/blocks.js:60`: dieselPrime, backupDiesel, backupHvo; genset `:166`); hatch `d45` | Firm band (`/home/claude/build/app/src/components/DispatchView.jsx:52–65`); hatch `d45` | Yes; hatch same |
| Fuel cells (`fuelCell`) | Fill `var(--src-fuelCell)` (`/home/claude/build/app/src/engine/blocks.js:60`); hatch `hdash` | Firm band; hatch `hdash` | Yes; hatch same |
| Hydrogen (`hydrogen`) | Fill `var(--src-hydrogen)` (`/home/claude/build/app/src/engine/blocks.js:60`); hatch `bigdots` | Firm band; hatch `bigdots` | Yes; hatch same |
| Nuclear SMR (`nuclear`) | Fill `var(--src-nuclear)` (`/home/claude/build/app/src/engine/blocks.js:193, :198`); hatch `xd` | Firm band; hatch `xd` | Yes; hatch same |
| Curtailment (neutral, not an energy source) | None | `var(--src-curtail)` (`/home/claude/build/app/src/components/DispatchView.jsx:16`, `:210`, `:224`, `:325`) | n/a |
| Cooling, fuel storage, building | `var(--src-cooling)` (`/home/claude/build/app/src/engine/blocks.js:229, :240`), `var(--src-fuel)` (`/home/claude/build/app/src/engine/blocks.js:182`), `var(--src-building)` (`/home/claude/build/app/src/engine/blocks.js:121`) | Not in the dispatch chart | n/a |

Result: the site plan and the dispatch chart use the same `--src-*` token for every shared source. The dispatch chart hatches firm plant and wind, as the plan does; solar, battery and grid stay plain in the chart (judgement 9, BUILD-NOTES 1203). The PPA energy in the chart uses the grid token (no token of its own).

## 5. §23 label count (this slice)

The label is set for every record in `rec()` (`/home/claude/build/app/src/engine/defaults.js:36`, value `LABEL` at `:13` = "indicative — unverified"). Count of `rec('…'` calls in `/home/claude/build/app/src/engine/defaults.js`: 125 before the slice, 129 now, so 4 new records.

| Record (`/home/claude/build/app/src/engine/defaults.js`) | Value | Low / high | Basis | Label | Shown in UI | New? |
|---|---|---|---|---|---|---|
| `sensitivity.gasPriceFactor` (`:525`) | 1 (×) | 0.7 / 1.3 | judgement | yes | `/home/claude/build/app/src/components/SensitivityView.jsx:132` (per row) | new |
| `sensitivity.carbonPriceFactor` (`:526`) | 1 (×) | 0.5 / 1.5 | judgement | yes | `/home/claude/build/app/src/components/SensitivityView.jsx:132` | new |
| `sensitivity.itLoadFactor` (`:527`) | 1 (×) | 0.8 / 1.2 | judgement | yes | `/home/claude/build/app/src/components/SensitivityView.jsx:132` | new |
| `sensitivity.topDrivers` (`:528`) | 12 | none (editable 1–30 in code only) | run setting | yes | `/home/claude/build/app/src/components/SensitivityView.jsx:142` | new |

Existing records the tornado and the inputs now use (not new): `grid.priceMultiplier` (`:592`, 1, 0.7/1.5, judgement); `grid.carbonMultiplier` (`:593`, 1, 0.8/1.2, judgement); `grid.dateUncertainty` (`:594`, [−6, 24], judgement); `economics.wacc` (`:628`, 0.07, 0.04/0.12, judgement); `utilities.gasPrice` (`:599`, "by country", basis source, derived, verify note); `economics.carbonPrice` (`:632`, "by country", basis source, derived, verify note). The gas and carbon price inputs are the same records: `/home/claude/build/app/src/components/InputsPanel.jsx:91–92` and `:162–163`; "by country" is at default only while no number is entered (`/home/claude/build/app/src/engine/defaults.js:794–795`).

Result: 4 new records, each with a basis and the label; none missing. Test 5d counts 496 records (from 492; BUILD-NOTES 1191).

Other values introduced by the slice, checked and not counted as §18 records:
- Tornado clamp 1–30 and fallback 12 (`/home/claude/build/app/src/engine/sensitivity.js:82–85`): a bound from the brief, and a fallback equal to the record.
- 15 re-runs (1 + 2 × 7): computed, not a default.
- Option selectors open on the leader (`/home/claude/build/app/src/App.jsx:64–65`, null = leader; `/home/claude/build/app/src/components/SensitivityView.jsx:155`): view state, no record, no label.
- Dispatch default year and week (`/home/claude/build/app/src/components/DispatchView.jsx:114–116`): view state, no record, no label.
- Loading text "10 to 20 seconds" (`/home/claude/build/app/index.html:14`): copy based on one headless run (BUILD-NOTES 1175), not a record.

For the owner: §23 and AC15 cover "view or ranking setting" defaults. The leader selection and default year and week have no record. Whether they count is the owner's call.

## 6. Other findings (not in the tables above)

1. The gas driver (T-3) moves the gas swing by 0.6 × transport adder relative to the source. Not recorded.
2. Tornado scores are shown at 4 significant figures (R24). Not recorded.
3. The `sensitivity.topDrivers` note says "editable 1–30" (`/home/claude/build/app/src/engine/defaults.js:528`), but there is no control (R20). Not recorded.
4. The `typeof` guard was removed from `/home/claude/build/app/src/components/RunProgress.jsx` (L-10). This is safe in the shipped builds, because `/home/claude/build/app/build.mjs` defines `__HOSTED__` in every bundle. The test bundle `/home/claude/build/app/tests/view-bundle.mjs:55` does not include `/home/claude/build/app/src/components/RunProgress.jsx`.
5. T3 tornado: every swing is 0.00 points (BUILD-NOTES 1166), because the cost axis is compressed by near-zero-delivery options (open point 2, line 1216). Recorded.
6. Time-to-power counts battery MW without energy (open point 1, line 1215). Recorded.

## 7. Limits

- No build and no test run. Test totals are cited from BUILD-NOTES (lines 1277 and 1312).
- Mechanical checks only: reads, grep and diffs. No visual, screen-reader or live-browser check.
- The loading page, the hosted-page build and the RunProgress component were compared with the source by diff. Browser checks B28 and B29 are cited, not re-run.
