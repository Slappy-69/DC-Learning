# H2 verification: Pareto trade-off view (BRIEF §12.2)

**Scope.** The Pareto view against BRIEF §12.2, plus the §11 and §12 items the view must meet. Also §2 principle 5, §7.2 step 6, §4, §16, §17, and AC 5, 7 and 11 where they bear on the view.

**Sources.**
- Spec: `/home/claude/build/brief-v2/BRIEF.md`. "L" below means a line in this file.
- Build notes: `/home/claude/build/app/BUILD-NOTES.md`, section "Slice: Pareto trade-off view (§12.2)" at lines 349–417. Deferrals are at lines 160–168. "BN" below means this file.
- Code: `src/engine/pareto.js`, `src/components/ParetoChart.jsx`, `ParetoTable.jsx`, `ParetoView.jsx`, `src/App.jsx`. Also read for dependencies: `src/engine/scoring.js`, `evaluate.js`, `defaults.js`; `src/components/RankedList.jsx`, `InputsPanel.jsx`, `OptionDetail.jsx`; `tests/run-tests.mjs` (test 8d).

**Method.** Reading and grep. Inline node checks on stdin, with no files written: dominance, AC5 pick versus rank 1, and frontier versus brute force. No build was run and `npm test` was not run. Test results quoted from BN were not re-run.

**Status key.** IMPLEMENTED: met as written. PARTIAL: part missing or differs. DEFERRED: BN names it as a later slice (line given). MISSING: not implemented and not recorded as deferred.

---

## 1. Requirements

| ID | Requirement (brief line) | Status | Evidence |
|---|---|---|---|
| R01 | §12.2 L603: "Pareto scatter: any two axes" | PARTIAL | Only cost against carbon can be plotted. X is LCOE or NPV (pareto.js:17–21). Y is location, market or 1 minus CFE (pareto.js:22–26; ParetoView.jsx:35–46). Time-to-power and deliverability, the other two §11 axis metrics, cannot be plotted. See D1. |
| R02 | §12.2 L603: "(default cost vs carbon)" | IMPLEMENTED | `defaultParetoAxes` takes the cost and carbon metric from the scoring settings, giving LCOE and location by default (pareto.js:30–35; defaults.js:474–475). Carbon options match §9.6 (L481). |
| R03 | §12.2 L603: "colour = time-to-power" | IMPLEMENTED | Fill is the TTP class colour (ParetoChart.jsx:118–121). Five quantile classes over the scoring set, with tied edges merged (pareto.js:81–102, 135). Ramp tokens at styles.css:268–272. Legend at ParetoView.jsx:84–93. Scheme recorded at BN L373. |
| R04 | §12.2 L603: "marker shape = site-fit status" | PARTIAL | Shape encodes resilience status (ParetoChart.jsx:18–19, 119; legend ParetoView.jsx:97–100). Site fit is not assessed (BN L165). The substitution is recorded at BN L358 and L395, and in the UI at ParetoView.jsx:116. See D2. |
| R05 | §12.2 L603: "size = capex" | IMPLEMENTED | Radius from capex across the scoring set, 3 to 9 px (2.5 to 7 px on phones) (ParetoChart.jsx:110–116; pareto.js:119–120). Area is affine in capex, not proportional as BN L358 says. See D3. |
| R06 | §12.2 L603: "P10–P90 error crosses on hover or for pinned options". Also §2 p4 L55 (ranges, not points). | DEFERRED | No error bars. Every point is P50 (ParetoChart.jsx, whole file). BN L396 (needs the Monte Carlo slice), L163 (P10–P90 ranges), L168 (pinning not built). |
| R07 | §12.2 L603: "The Pareto frontier is drawn" | IMPLEMENTED | `paretoFrontier` (pareto.js:41–63) runs over the whole scoring set (pareto.js:114). Drawn as a dashed step line (ParetoChart.jsx:197–203, 245; styles.css:294). Inline check: 2,000 random sets of 1–30 points on an 8×8 grid, so ties occur, all match brute force (0 mismatches). Scope recorded at BN L356. |
| R08 | §12.2 L603: "the weighted pick is highlighted" | IMPLEMENTED | Pick is the highest weighted score, ties to the lowest id (pareto.js:68–75, 116, 142). Orange ring and "Weighted pick #n" label (ParetoChart.jsx:247–254; styles.css:295–297). Table row and badge (ParetoTable.jsx:38, 44). Pick line (ParetoView.jsx:59–65). Caveat: no ring when the pick is filtered out or non-plotted (ParetoChart.jsx:124, 195). See D4. |
| R09 | §12.2 L604: "Parallel coordinates: all axes plus key metrics" | DEFERRED | No component. BN L162 ("Parallel coordinates … not in this slice"). |
| R10 | §12.2 L604: "Brushing on any axis filters the option set across all views". Also §2 p5 L61. | DEFERRED | No brushing in ParetoChart.jsx or in `applyView` (scoring.js:118–145). BN L397 and L162. |
| R11 | §12.2 L605: "Choice impact chart" | DEFERRED | No component. BN L162. |
| R12 | §12.2 L606: "Radar / profile of up to 4 pinned options" | DEFERRED | No component, and pinning is not built. BN L162 (radar) and L168 (pinning). |
| R13 | §11 L581: scoring set is every screened option; view filters never change score or rank | IMPLEMENTED | Frontier, pick and axis domains use the full set (pareto.js:114–116, 147–151). Filters are applied afterwards, for display only (pareto.js:123–145). Note at ParetoView.jsx:72. Tests 4 and 8c are reported at BN L286–287 and L411–412 (not re-run). |
| R14 | §11 L582: "show the absolute metric next to each score"; "show a note that scores are relative to the set" | PARTIAL | Cost and carbon values sit beside the score in the table (ParetoTable.jsx:46–48). The relative-to-set note appears on the Options tab only (RankedList.jsx:81). The Trade-offs tab has none (ParetoView.jsx:67–73). See D13. |
| R15 | §11 L584: "Ranking: by weighted score"; "Does not meet" options not demoted automatically; compliant-first off by default | IMPLEMENTED | Order is score, then id (scoring.js:89–99, 96). Demotion happens only when the toggle is on (scoring.js:91–95). Pareto points are not demoted (ParetoChart.jsx:118–123). Toggle at InputsPanel.jsx:126. |
| R16 | §11 L585: user view filters by site-fit status, resilience status, any flag, capex or land-take ceiling, dominated status, and brushing | PARTIAL | `applyView` implements resilience, show-with-flag, hide-with-flag, capex ceiling, dominated only/non, archetypes and search (scoring.js:118–129). The UI sets resilience, hide-with-flag, archetypes, search and the hide-dominated checkbox (RankedList.jsx:52–71). Site fit is deferred (BN L165) and brushing is deferred (BN L397). See D12. |
| R17 | §11 L585: "capex or land-take ceiling" (land-take part) | MISSING | No land-take ceiling in `applyView` or in the UI (scoring.js:118–145; RankedList.jsx:50–73). Not deferred in BN: L126 lists only implemented filters, and L160–168 do not mention it. The capex ceiling exists in the engine only; see R16. |
| R18 | §11 L585 and §2 p5 L61: active filters are "removable chips", counted in the header, listed in exports | PARTIAL | Chips appear above the results (ParetoView.jsx:74–79; RankedList.jsx:74–80) and are counted in the header (App.jsx:94, 124). They are plain spans and cannot be removed (ParetoView.jsx:76; RankedList.jsx:76). Removal is only by "Clear all filters" on the Options tab (RankedList.jsx:78), or "show" for hidden dominated options. Exports deferred (BN L166). See D11. |
| R19 | §11 L586 (a) absolute scaling and (c) auto-update uncertainty | DEFERRED | Absolute scaling is held but not applied, and has no UI control (defaults.js:476, "Hook only in this slice"; BN L168). Uncertainty belongs to §13 (BN L163). The header display "when not at its default" (L586) is not implemented (App.jsx:123–127), but no control can change the setting. |
| R20 | §11 L586 (b): "Rank requirement-compliant options first", off by default, shown in header and exports | IMPLEMENTED | Setting at defaults.js:477. Toggle at InputsPanel.jsx:126. Effect at scoring.js:89–99. Header at App.jsx:126. Exports deferred (BN L166). |
| R21 | §11 L587: "Changing weights re-ranks live (no recompute of dispatch). The Pareto pick … update to match." | IMPLEMENTED | A weight change re-scores shallow copies of the latest run (App.jsx:54–60). Weights are excluded from the compute key (App.jsx:30–35), so the pipeline does not re-run. ParetoView recomputes its model (ParetoView.jsx:21). Test 8b reported at BN L409–410. |
| R22 | §11 L587: "… and summary update to match" | DEFERRED | Plain-English summary not built (BN L166; §14 at L679). |
| R23 | §12 L593: run summary "sits directly above the options list and in every export" | IMPLEMENTED | Rendered above the tab bar, so it also sits above Trade-offs (App.jsx:148, 152). Auto-expands on new entries (App.jsx:72–77). Exports deferred (BN L166). |
| R24 | §12 L595: header shows option count "(shown / total screened / total combinations, plus how many are dominated)" | PARTIAL | Header shows total screened, combinations and dominated (App.jsx:120). No "shown" figure: the variable `shown` is the total (App.jsx:96). The Trade-offs note does show "X of Y shown" (ParetoView.jsx:68). See D9. |
| R25 | §12 L595: header shows active view filters and the state of "Hide dominated options" and "Sample above cap" | IMPLEMENTED | Filter count at App.jsx:94. Hide dominated and sample-above-cap state at App.jsx:124. The count covers the controls the UI exposes (see R16). |
| R26 | §12 L595: "leader name, leader's weighted score" | IMPLEMENTED | App.jsx:62, 120–121. The leader is rank 1; see section 3. |
| R27 | §12 L595: "leader's weighted score with its rank probability" | DEFERRED | App.jsx:121: "Rank probability not available in this slice (no Monte Carlo)". BN L163. |
| R28 | §12 L595: "model badge (screening / verified)" | DEFERRED | App.jsx:122 shows "Full-year hourly (8760 h)". Screening tier and verification badge not built (BN L167). |
| R29 | §12 L595: "number of unverified defaults affecting the leader" | PARTIAL | Header shows the total default-record count (App.jsx:88–91, 129), not the subset that drives the leader. BN L129 calls it "the unverified-defaults count". See D10. |
| R30 | §12 L642 and §12.10 L638: PNG/SVG of any chart; trade-off charts in the PDF report | DEFERRED | No export control on the Trade-offs tab (ParetoView.jsx). BN L166 (exports not in slice; hook `HOOKS.export`). |
| R31 | §17 L754: "every chart and plan has a data-table alternative" | IMPLEMENTED | Chart/Table toggle (ParetoView.jsx:52–55, 118–129). The table holds every point in the view, including "not plotted" rows (pareto.js:177–193; ParetoTable.jsx:7–8). 50 rows per page with a pager (ParetoView.jsx:12, 124–126). |
| R32 | §4 L99: "Parallel coordinates and Pareto plots with more than 500 points use Canvas, with an accessible table alternative" | IMPLEMENTED | Canvas when points exceed 500 (ParetoChart.jsx:17, 105, 213). **Not tested:** test 8d forces SVG in all four cases, including T1 with 2,000 points (tests/run-tests.mjs:772). No test refers to the Canvas path. See section 5. |
| R33 | §4 L99: "a library that renders SVG or Canvas accessibly (Recharts or visx acceptable)" | PARTIAL | No chart library. The charts are hand-written SVG and Canvas (ParetoChart.jsx:1–5). Decision recorded at BN L377–384. See D14. |
| R34 | §16 L719: "switchable tabs: Options, Trade-offs" | IMPLEMENTED | Tab list with ARIA roles and arrow-key switching (App.jsx:152–160). |
| R35 | §16 L719: "Right: option card drawer", at 1280 px and wider | PARTIAL | A point click opens OptionDetail below the chart (ParetoView.jsx:131–135). There is no right-hand drawer (App.jsx:114–166). BN L361 records "below the chart" as placement only. See D15. |
| R36 | §16 L721: phone width, "charts with table alternatives" | IMPLEMENTED | Phone layout below 520 px (ParetoChart.jsx:87–89; styles.css:318–320). Headless check at 375 px reported at BN L363 (not re-run). |
| R37 | §16 L725: live region announces "Options updated. Leader unchanged." or "New leader: …" | IMPLEMENTED | Announcement names the rank-1 leader only (App.jsx:62–69). The pick line is aria-live polite (ParetoView.jsx:59). Naming issue under compliant-first; see D16. |
| R38 | §2 p5 L62: "Hide dominated options" off by default; counter; one-click show | IMPLEMENTED | `DEFAULT_VIEW` has hideDominated false (scoring.js:111). Setting at defaults.js:478. Checkbox at ParetoView.jsx:49. Counter and show link at ParetoView.jsx:74–77. |
| R39 | §2 p5 L63: view filters, brushing and "Hide dominated options" never change score or rank | IMPLEMENTED | `applyView` writes no score or rank (scoring.js:118–145). Frontier and pick use the unfiltered set (pareto.js:114–116). Tests 4 and 8c reported (BN L286–287, L411–412). |
| R40 | §2 p5 L56–61: nothing excluded by default; every reduction in the list | PARTIAL | Default table and view hold every screened option (section 4). The chart omits options with a non-finite axis value (ParetoChart.jsx:104). The principle's list (L57–61) does not include this. See D5. |
| R41 | §7.2 step 6 L323: four-axis dominance with no better resilience or site-fit status; "Dominated by [option name]" badge; custom and pinned never hidden | PARTIAL | Four-axis test with resilience status (scoring.js:67–87). Site fit deferred (BN L124, L165). Custom and pinned exemption at scoring.js:133. Badge shows "#rank", not the name (pareto.js:189; ParetoChart.jsx:205, 264); see D7. Non-finite cost miss at scoring.js:81–82; see D17. |
| R42 | AC5 L832: "the highlighted Pareto pick and the plain-English summary always match the weighted leader" | PARTIAL | Live update implemented (R21). The match is AMBIGUOUS under the brief; see section 3. The summary half is DEFERRED (BN L166). |
| R43 | AC7 L834: "No option is hidden without the user filtering"; with defaults, every screened option appears in the ranking table | PARTIAL | Default view holds every option (R38; section 4). The chart omits non-finite-axis options (ParetoChart.jsx:104; ParetoView.jsx:71), recorded at BN L362. AC7 names the ranking table, which this slice did not check. See D5. |
| R44 | AC11 L838: WCAG 2.2 AA; axe with zero serious issues; manual keyboard and screen-reader walk-through of steps 1–7 | PARTIAL | Keyboard model: one tab stop, arrow keys, P, Enter, Escape (ParetoChart.jsx:14–15, 167–191, 214–221). Focus ring at styles.css:286–287. Checked in headless Chromium only. Axe, NVDA with Firefox and VoiceOver with Safari are not done (BN L399; §17 L754). |
| R45 | §17 L741: a weight or scenario change updates ranking, Pareto pick and plain-English summary within ≤ 100 ms | PARTIAL | Pick re-score plus view: 27 ms per preset in Node on T1 (BN L359, L410). No browser timing of the chart re-render. Summary deferred (BN L166). |

---

## 2. Deviations

Each row is something the code does differently from the brief. "Recorded" means BN states the deviation.

| ID | Code does (brief line) | BN record | Note |
|---|---|---|---|
| D1 | Axes limited to cost (LCOE or NPV) against carbon (location, market, 1 minus CFE). Time-to-power and deliverability cannot be plotted (L603, "any two axes"). | **Not recorded.** BN L357 says "The user can pick any pair in the Trade-offs tab", which the code does not support. | Misstatement in the notes. |
| D2 | Marker shape encodes resilience status, not site fit (L603). | Recorded: BN L358, L395; ParetoView.jsx:116. | None. |
| D3 | Size is affine in capex with a 3–9 px radius range (ParetoChart.jsx:110–116). L603 says only "size = capex". | Described wrongly at BN L358 as "area proportional to capex". | Minor. |
| D4 | Pick ring and label are not drawn when the pick is filtered out or non-plotted (ParetoChart.jsx:124, 195). A filtered pick gets a text notice (ParetoView.jsx:63). A non-plotted pick gets no notice, because `pickVisible` counts non-plotted points (pareto.js:164). **Edge case:** `effectiveWeights` allows zero (scoring.js:7–14). With weight 0 on cost and 1 on carbon, option a (LCOE 50) and option b (LCOE 40) tie on score. The pick is a, and b dominates a on cost. "Hide dominated options" then hides the pick (inline check). | **Not recorded.** | L603 "highlighted"; L832 "always match". |
| D5 | The chart draws only options with finite x and y (ParetoChart.jsx:104). Infinite LCOE (zero delivered energy, evaluate.js:258) is not drawn. The table lists those options as "not plotted", and a note gives the count (ParetoView.jsx:71). | Recorded: BN L362. | Not on the §2 p5 list (L57–61). Needs an owner decision on whether it counts as a listed reduction. |
| D6 | The frontier is computed over the full scoring set and drawn through points hidden by filters (pareto.js:114; ParetoChart.jsx:245). | Recorded: BN L356. | None. |
| D7 | Dominated label reads "Dominated by #rank" (pareto.js:189; ParetoChart.jsx:205, 264). L323 asks for "Dominated by [option name]". The name is available (pareto.js:139, `dominatedByName`), but no view uses it. | **Not recorded.** | Minor. |
| D8 | Chart note says "dominated on all four axes" (ParetoView.jsx:69). The rule also requires no better resilience status (L323; scoring.js:67–87). | UI text not recorded. BN L356 states the rule correctly. | Minor wording. |
| D9 | Header option count has no "shown" figure (App.jsx:120). L595 requires "shown / total screened / total combinations". | **Not recorded.** BN L129 lists "screened, combinations, dominated". | |
| D10 | Header "unverified defaults" is the total registry count (App.jsx:88–91, 129). L595 asks for the count "affecting the leader". | **Not recorded.** BN L129 calls it "the unverified-defaults count". | |
| D11 | Filter chips are static spans, not removable (ParetoView.jsx:76; RankedList.jsx:76). L61 and L585 require "a removable chip". | **Not recorded.** | |
| D12 | The UI has no control for capex ceiling, show-with-flag, or dominated only/non. There is no land-take ceiling anywhere (scoring.js:122–127 against RankedList.jsx:52–71). L585 lists all of them. | **Not recorded.** BN L126 lists only the implemented filters. | Land-take part is MISSING (R17). |
| D13 | The "scores are relative to the scoring set" note appears only on the Options tab (RankedList.jsx:81). The Trade-offs tab shows scores with no such note (ParetoView.jsx:67–73). L582 requires the note. | **Not recorded.** | |
| D14 | Hand-written SVG and Canvas, no chart library (ParetoChart.jsx:1–5). L99 says "a library … Recharts or visx acceptable". | Recorded: BN L377–384, with reasons. | None. |
| D15 | Option detail opens below the chart (ParetoView.jsx:131–135). L719 places the option card in a right-hand drawer at 1280 px and wider. | Placement recorded at BN L361 ("below the chart"). Not recorded as a departure from §16. | Partly recorded. |
| D16 | With compliant-first on, the pick is the highest weighted score, but the header "Leader" and the live "New leader" announcement name rank 1 (App.jsx:62, 64–69; pareto.js:117). Both appear on the same screen. | Partly recorded: BN L400 covers the pick and the pick line, not the header or the live region. | See section 3. |
| D17 | Dominance comparison at scoring.js:81–82 adds and subtracts eps times max(1, abs(a)) to the dominated option's value. For an option with infinite cost (evaluate.js:258), the strict-improvement test becomes Infinity minus Infinity, which is NaN. A cheaper option is then never counted as strictly better on cost. Inline check: a (cost ∞) and b (cost 5), equal elsewhere: a→null, expected a→b. The reverse case (∞ as the dominator) behaves correctly. | **Not recorded.** BN L124 describes the rule without this case. | Logic error in scoring.js, which BN L351 says this slice did not change. It affects hollow markers and "Hide dominated". Needs exact ties on the other three axes to trigger, so it is low-likelihood. |

---

## 3. AC5 analysis

**Brief text.** AC5 (L832): "Weight changes re-rank live; the highlighted Pareto pick and the plain-English summary always match the weighted leader."

**What the brief defines.**
- "weighted leader" appears only in AC5. The brief does not define it.
- "rank 1" does not appear.
- "leader" appears at L595 (header: "leader name, leader's weighted score"), at L661 (§13.2: "Shown alongside the P50 leader") and at L725.
- Ranking is "by weighted score" (L584).
- L586(b) turns on "Rank requirement-compliant options first", which changes the ranking order.
- No definition settles whether the compliant-first toggle changes which option is "the weighted leader".

**What the code does.**
- Pick: highest weighted score, ties to the lowest id (pareto.js:68–75, 116).
- Leader: rank 1. This feeds the header, the live announcement, and `leaderId` (App.jsx:62, 64–69; pareto.js:117).
- Rank with the toggle off: score, then id (scoring.js:96). This is the same ordering as the pick, so they agree.
- Rank with the toggle on: options not "Does not meet" come first, then score (scoring.js:91–95).
- The pick line discloses the difference: "Ranked below rank 1 because … is on" (ParetoView.jsx:62).

**Inline checks** (stdin, no files written):
- Toggle off, options x (score 90) and y (80), both Meets: rank 1 = x, pick = x.
- Toggle off, tie at 70 between a and b: rank 1 = a, pick = a.
- Toggle on, x (90, Does not meet) and y (80, Meets): rank 1 = y, pick = x.

**Observed behaviour.** With the toggle off, the pick equals rank 1 in every case. With the toggle on, the pick differs from rank 1 when the top scorer is "Does not meet" on resilience. The highlighted pick and the header "Leader" then name different options on the same screen.

**Reading A.** "Weighted leader" means the highest weighted score, whatever the ranking toggle. The code **conforms** on this reading. Support: AC5 says "weighted", and §11 L584 ranks by weighted score.

**Reading B.** "Weighted leader" means rank 1, the option the header calls "leader" (L595). The code **conflicts** on this reading whenever the toggle is on and the top scorer is "Does not meet". Support: the header uses "leader" for the top-ranked option, and §13.2 (L661) uses "P50 leader" for the top-ranked option.

**Verdict: AMBIGUOUS.** The brief does not define "weighted leader", so the behaviour cannot be classed as conforming or conflicting without choosing a reading. This report does not choose one.

**Related points.**
- BN L400 justifies the pick with "§11 wording, 'Pareto pick … match[es] the weighted leader'". That wording is in AC5 (L832), not §11. §11 L587 says only "The Pareto pick and summary update to match", and does not name a target. The citation is inexact.
- The highlight is absent when the pick is filtered out (D4). AC5's "always" does not address that case.
- The summary half of AC5 is not built (R42).

---

## 4. Principle 5 check: does the Pareto view hide or exclude any option by default?

**Verdict.** No option is hidden or excluded from the Pareto table or the view model by default. One exception: the chart does not draw options with a non-finite axis value. That exception is disclosed, but it is not on the principle's list.

**Evidence.**
1. The default view state is `DEFAULT_VIEW` (scoring.js:105–116): no resilience, flag, capex, dominance, archetype or search filter, and hideDominated false. App initialises the view from it (App.jsx:39). The Trade-offs tab shares that state (App.jsx:160; ParetoView.jsx:14).
2. With the default state, `applyView` keeps every option (scoring.js:118–145).
3. `paretoView` builds one point per option in that list (pareto.js:123–145). `paretoTableRows` gives one row per point (pareto.js:177–193). The table pages 50 at a time (ParetoView.jsx:12, 124–126).
4. The frontier and the pick come from the unfiltered set (pareto.js:114–116).
5. Test 8c reports, as recorded (BN L411–412, not re-run): T1 2,000 of 2,000 in the view, T3 2,000 of 2,000, and the resilience-fail sample 36 of 36.
6. **Exception:** ParetoChart.jsx:104 draws only plotted points. Options with infinite LCOE appear in the table only, and the note at ParetoView.jsx:71 gives the count. BN L362 records this and cites T3 no-grid options. BN does not state how many there are.
7. §2 p5 L57 says "Everything that can reduce what is generated, screened or shown is listed below". The chart omission is not in that list (D5).

---

## 5. Verification gaps and out-of-scope items

**Gaps in the evidence.**
1. **Canvas path has no test.** Test 8d sets `forceSvg: true` in every case, including T1 with 2,000 points (tests/run-tests.mjs:772; cases at 780–785). The app draws T1 on Canvas (ParetoChart.jsx:105). So the check "every plotted point has a matching row" (BN L391) does not cover the production render. No test refers to canvas.
2. Test results (BN L402–417) were quoted, not re-run. No build was run and `npm test` was not run.
3. Accessibility has not been audited (R44).

**Noticed, outside the Pareto scope.**
- §12.3 option card is not built. OptionDetail.jsx has no tab roles and no "Schematic", "Programme" or "Assumptions" text. The Pareto point click opens it (ParetoView.jsx:131–135). BN lists nothing about §12.3 under "What is not in this slice" (L160–168).
- The dominance miss at D17 is in scoring.js, which BN L351 says this slice did not change.

---

## 6. Summary

Counts by status (45 requirements): **IMPLEMENTED 19, PARTIAL 15, DEFERRED 10, MISSING 1.**

- MISSING: R17, land-take ceiling view filter (not deferred in BN).
- Unrecorded deviations: D1, D4, D7, D8, D9, D10, D11, D12, D13, D17. Partly recorded: D3, D15, D16.
- AC5 verdict: AMBIGUOUS. Conforms if "weighted leader" means highest weighted score. Conflicts with rank 1 when compliant-first is on. Summary half deferred.
