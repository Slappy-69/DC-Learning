# Opus review: Pareto trade-off view (verification batch H1, H2, H3)

Reviewer: Opus, 2026-10-16. Scope: the three Haiku reports in this folder (`H1-claims.md`, `H2-brief.md`, `H3-browser.md`), judged against the code in `/home/claude/build/app`, the brief (`/home/claude/build/brief-v2/BRIEF.md`, not edited) and fresh builds and test runs. I checked each finding against the files or a reproduction, not against the verifier's summary. Every file I changed was backed up first to `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/pareto-review-backup/`, with a SHA-256 manifest. The repo copy (`/home/claude/dc-learning`, branch `feature/pareto-verification`) was not changed and nothing was committed.

## Summary

- **Decisions: 92 accepted, 0 rejected, 6 deferred** (98 findings: H1 17, H2 67, H3 14). "Accepted" means the finding is right. Where it pointed to a defect or an unrecorded deviation, the table says what changed. Most H2 rows marked IMPLEMENTED or DEFERRED needed no change. The 6 deferred findings are site-fit shape (R04), the land-take filter (R17), the leader-specific defaults count (R29, D10) and the option-card drawer (R35, D15).
- **Defects confirmed and fixed:**
  - Light-theme text contrast (H3).
  - Keyboard reach to the results and the chart (H3).
  - Registry view settings that no code read (H1).
  - The pick could differ from the header leader (H2 AC5, D16).
  - The infinite-cost dominance miss in `scoring.js` (H2 D17). T1 and T3 outputs are identical before and after the fix.
  - Nine smaller deviations: D1, D4, D7, D8, D9, D11, the D12 controls, D13, and H1 N4.
- **Reviewer findings not raised by the verifiers (11, all fixed):**
  - Hollow markers below 3:1.
  - Form-control borders at 1.47:1 (WCAG 1.4.11).
  - `.tag-basis` at 4.49:1.
  - The closed off-canvas inputs panel took focus below 1280 px.
  - A click could open a different option from the one the tooltip named. The new Canvas browser test found this.
  - Legend class labels collided ("30 to < 30").
  - The phone y-axis title overflowed after the direction text was added.
  - Role-less `aria-label` spans in the ranked table.
  - The table page size had no §18 record.
  - The header filter count covered only 4 filter kinds.
  - Placeholder colour was not set.
- **Tests:** `npm test` 22/22 (18 existing, all still passing and unchanged except 8a, 8b and 8d, which were extended; 4 new). `npm run test:browser` 13/13. Four mutants, each reintroducing one old behaviour, each fail exactly the new test that guards it (table below).

## Decisions on every finding

Key:
- **Accepted:** the finding is right. If it pointed to a defect or an unrecorded deviation, the "Change" column says what was done.
- **Rejected:** the finding is wrong.
- **Deferred:** the finding is right, but the fix belongs to a later slice. It is recorded in BUILD-NOTES.

File references are to `/home/claude/build/app`.

### H1 (claims check)

| ID | Finding | Decision | Reasoning | Change |
|---|---|---|---|---|
| H1-1 | `npm test` 18/18 | Accepted | Baseline re-run before any change: 18/18, exit 0. | None; the suite is now 22/22. |
| H1-2a | scoring, dispatch, generator, sizing, evaluate unchanged 62fff78→484a042 | Accepted | `git diff --quiet` on the repo copy: all five unchanged. | None (the review later changed one expression in `scoring.js`, finding 5). |
| H1-2b | run.js, index.js, defaults.js changes as listed | Accepted | `git diff --stat` matches: defaults +15, index +1, pareto +193, run 3/2. | None. |
| H1-3 | Build copy = repo copy | Accepted | The pre-review backup of `src` and `tests` is identical to the repo copy (`diff -rq`, no output). | None. |
| H1-4a | Frontier over all screened options | Accepted | `paretoView` builds the frontier from `run.options`; filters only set `visible`. | Still true; the frontier now also takes each axis's better direction. |
| H1-4b | Pick = highest score; can differ from rank 1 with compliant-first on | Accepted | Correct description of the old code. | Pick is now rank 1 (finding 4, H2 AC5). |
| H1-4c | No option removed from list or ranking | Accepted | Re-verified by tests 3, 4 and 8c (still pass). | None. |
| H1-5 | Hide dominated off; DEFAULT_VIEW in effect; record unread | Accepted | Correct. | The initial view now comes from `defaultView()`, which reads `settings.hideDominated`; 8f checks the record, `defaultView()` and `DEFAULT_VIEW` agree. |
| H1-6 | Canvas threshold hard-coded; Canvas branch untested | Accepted | Correct. | Threshold read from `view.pareto.canvasAbove`. Canvas path tested in the browser (B4: pixels, hit-test) and by SSR mutation in 8f. |
| H1-7 | Keyboard handlers present; untested | Accepted | Correct. | Browser B2 and B3: skip link, 8-step arrows with ordering, Home/End clamps, P, Enter, Escape. |
| H1-8 | Table lists every option; paging untested | Accepted | Correct. | Browser B6 pages through all 40 pages: 2,000 distinct rows in rank order. |
| H1-9 | No storage APIs or `Math.random` | Accepted | Re-checked after the review's changes: no match in `src/`. | None. |
| H1-N1 | Registry view records and `settings.hideDominated` read by no code | Accepted | Correct: CANVAS_ABOVE, TTP_CLASSES, the default axes and `'chart'` were hard-coded copies. | All are read from the registry at the point of use (`registryValue`, `src/engine/view.js`). Axis records now hold machine values ("follow-scoring"). New test 8f. |
| H1-N2 | Canvas, keyboard and paging untested | Accepted | Correct. | `tests/browser-tests.mjs` and `npm run test:browser`. |
| H1-N3 | Threshold counts plotted points | Accepted | Consistent with the code and the notes. | BUILD-NOTES now says "plotted points". |
| H1-N4 | Enter on an open point closes it (toggle) | Accepted | Contradicted BUILD-NOTES ("opens") and the chart's aria-label. | Chart Enter and click always open; the × button closes. Table row buttons keep toggling (`aria-expanded`). B3 checks a second Enter keeps the detail open. |
| H1-N5 | `dist/` built after the last edits | Accepted | Correct at the time. | `dist/` rebuilt; test 7 reads the new build. |

### H2 (brief check): requirements R01–R45

| ID | Finding | Decision | Reasoning | Change |
|---|---|---|---|---|
| R01 | "Any two axes": only cost × carbon | Accepted | §12.2 says any two axes; BUILD-NOTES claimed "any pair". In scope and small. | Seven axes on X and Y: LCOE, NPV, carbon ×3, time-to-power, deliverability (higher is better). Direction-aware frontier; selecting the other axis swaps. Brute force checked in 8a; rendered in 8d. |
| R02 | Default cost vs carbon | Accepted | Correct. | Default now from `view.pareto.xAxis` / `yAxis` ("follow-scoring"). |
| R03 | Colour = time-to-power | Accepted | Correct. | Legend edges get extra precision where they would collide (reviewer finding: "30 to < 30"). |
| R04 | Shape = resilience, not site fit | Deferred | Site fit needs the layout slice; recorded in BUILD-NOTES and on screen. | None. |
| R05 | Size = capex (affine, not proportional) | Accepted | Correct; the notes were wrong. | BUILD-NOTES and the code comment now say area grows linearly from a minimum mark. |
| R06 | No P10–P90 crosses | Accepted | Correctly reported as deferred (Monte Carlo slice). | None. |
| R07 | Frontier drawn; matches brute force | Accepted | Correct. | Frontier now honours higher-is-better axes; 8a brute force on time-to-power × deliverability. |
| R08 | Pick highlighted; no ring when filtered or not plotted | Accepted | Correct (see D4). | The pick line gives the reason: "Hide dominated options" (naming the dominating option), other filters, or no finite axis value. |
| R09–R12 | Parallel coordinates, brushing, choice impact, radar | Accepted | Correctly reported as deferred and recorded. | None. |
| R13 | Scoring set and filters | Accepted | Tests 4 and 8c pass. | None. |
| R14 | No "relative to the set" note on Trade-offs | Accepted | §11 requires it next to scores. | Note added to the Trade-offs summary line. |
| R15 | Ranking by score, no automatic demotion | Accepted | Correct. | None. |
| R16 | View filters partly exposed | Accepted | Capex ceiling, has-flag and dominated status existed in `applyView` with no control. | Controls added to the shared filter bar ("Show only options with flag", capex ceiling in € m, dominance select). Site fit and brushing stay deferred. |
| R17 | Land-take ceiling filter missing and not recorded | Deferred | Correct find. Land take comes from the site model (§10), the next slice. | Recorded: Brief issue 13 and "What is not in this slice". |
| R18 | Chips not removable | Accepted | §2 p5 and §11 require removable chips. (The verifier's "removal only by Clear all filters" was not accurate; see verifier errors.) | `FilterChips`: one remove button per chip, focus moves to the next chip, on both tabs; header count from the same helper. 8h and B8. |
| R19 | Absolute scaling, auto-update uncertainty | Accepted | Correctly deferred; no control can change them yet. | None. |
| R20 | Compliant-first toggle | Accepted | Correct. | None. |
| R21 | Weights re-rank live; pick follows | Accepted | Correct. | Browser B9: pick and header leader move together with no re-run; 96–130 ms click to repaint on this 2-core sandbox (informational). |
| R22 | Summary update deferred | Accepted | Correctly deferred. | BUILD-NOTES: the summary must use `weightedPick()`. |
| R23 | Run summary above the list | Accepted | Correct. | None. |
| R24 | Header lacks "shown" | Accepted | §12 requires shown / screened / combinations. | Header: "261 shown / 2,000 screened / 57,028 combinations · 1,950 dominated" (with a filter on). |
| R25 | Header shows filters, hide and sample state | Accepted | Correct; the count covered only the 4 exposed filter kinds. | The count now uses `activeFilterCount()`, equal to `applyView`'s chips (8h). |
| R26 | Leader name and score | Accepted | Correct. | Leader now from `weightedPick()`, the same function as the pick. |
| R27, R28 | Rank probability, model badge | Accepted | Correctly deferred. | None. |
| R29 | Defaults count not leader-specific | Deferred | Needs a per-option record map (same as §13/§14 need). | Header sub-line says so; Brief issue 16. |
| R30 | No chart export | Accepted | Correctly deferred (exports slice). | None. |
| R31 | Table alternative | Accepted | Correct. | Paging verified in the browser (B6). |
| R32 | Canvas above 500 untested | Accepted | Correct. | B4 (Canvas pixels, hit-test), B5 (SVG at or below the threshold), 8f (threshold mutation). |
| R33 | No chart library | Accepted | Recorded with reasons (§4 Canvas need, keyboard model, SSR test). | None. |
| R34 | Tabs | Accepted | Correct; ARIA tab pattern kept (roving tabindex, arrows). | The chart skip link selects Trade-offs through the same tab state. |
| R35 | No right-hand drawer | Deferred | The §12.3 option card and §16 drawer are the option-card work (§20 stage 3). | Recorded in "What is not in this slice". |
| R36 | Phone layout | Accepted | Re-checked at 375 px (B13). | Reviewer fix: the rotated y title drops the direction when it would not fit; the direction is always in the help text. |
| R37 | Live region names rank 1 | Accepted | Correct; mismatch with the pick (D16). | Same function now, so they cannot differ. |
| R38 | Hide dominated off, counter, show | Accepted | Correct. | Driven by the registry record. |
| R39 | Filters never change score or rank | Accepted | Correct. | None. |
| R40 | Non-finite points not drawn | Accepted | Not a §2 p5 reduction: nothing leaves any list, and it is not a constraint breach. | Decision recorded as Brief issue 14; no code change. |
| R41 | Badge "#rank" not name; infinite-cost miss | Accepted | Both correct (D7, D17). | Fixed (see D7, D17). |
| R42 | AC5 ambiguous | Accepted | Resolved by the owner's reading: the pick follows rank 1. | See AC5 below. |
| R43 | AC7 | Accepted | The ranking table lists every option by default (tests 3, 8c); the chart omission is Brief issue 14. | None. |
| R44 | No axe; no screen-reader walk-through | Accepted | Correct. | axe now run in light and dark on 3 views: 0 serious or critical. SR walk-through still open (needs NVDA or VoiceOver). |
| R45 | ≤ 100 ms not measured in a browser | Accepted | Correct. | Measured in B9 (96–130 ms on the sandbox, not the reference machine); not asserted. |

### H2: deviations D1–D17 and other sections

| ID | Finding | Decision | Reasoning | Change |
|---|---|---|---|---|
| D1 | Axes limited to cost × carbon | Accepted | As R01. | Fixed (R01). |
| D2 | Shape = resilience | Accepted | Recorded deviation; the fix waits for site fit (R04). | None. |
| D3 | Size affine, notes say proportional | Accepted | As R05. | Wording fixed. |
| D4 | Pick not drawn when filtered or not plotted; zero-weight tie hides the pick | Accepted | Reproduced: weights 0/1/0/0, a ties b, b dominates a, "Hide dominated" hides the pick. | `pickHiddenBy` and `pickPlotted` in the model; the pick line explains each case. 8g covers the tie, filter and not-plotted cases. |
| D5 | Non-finite points omitted from the chart | Accepted | As R40. | Brief issue 14. |
| D6 | Frontier drawn through hidden points | Accepted | Recorded and deliberate (§11 scoring scope). | None. |
| D7 | "Dominated by #rank" instead of the name | Accepted | §7.2 step 6 asks for the name. | "Dominated by #k name" in the trade-off table, tooltip, live region and ranked-table badge (one line, truncated, full in the title). Also in the option detail (Brief issue 17). |
| D8 | Note omits the status clause | Accepted | Rule includes "no better resilience status". | Note reworded; table header "Dominance (4 axes and status)". |
| D9 | Header lacks "shown" | Accepted | As R24. | Fixed. |
| D10 | Defaults count not leader-specific | Deferred | As R29. | Brief issue 16. |
| D11 | Chips not removable | Accepted | As R18. | Fixed. |
| D12 | No UI for capex, has-flag, dominated; no land take | Accepted | Controls small and engine-ready; land take needs the site slice. | Controls added; land take deferred (R17). |
| D13 | No relative-to-set note on Trade-offs | Accepted | As R14. | Fixed. |
| D14 | Hand-written chart | Accepted | Recorded with reasons. | None. |
| D15 | Detail below the chart, not a drawer | Deferred | As R35. | Recorded. |
| D16 | Header and live region name rank 1, pick names the top scorer | Accepted | Correct. | One function for all (AC5). |
| D17 | Infinite-cost dominance miss in `scoring.js:81` | Accepted | **Confirmed** with a minimal reproduction: a = (∞, 100, 20, 80) and b = (5, 100, 20, 80) gave a → null, expected b. Cause: `Infinity − eps·Infinity = NaN`. | Tolerance uses a finite scale. Regression test 8e. T1 and T3 identical before and after: every score, rank, `dominatedBy`, axis score and metric on all 4,000 options; 1,950 and 1,910 dominated; leaders unchanged. T3 has 26 infinite-LCOE options; none is beaten exactly on the other three axes, which is why T3 did not change. |
| S3 | AC5 verdict "ambiguous" | Accepted | Correct analysis; the owner chose a reading. | Pick = rank 1; header, live region and (future) summary use `weightedPick()`. The highest weighted score is marked separately with a dashed ring, a badge and the reason. Brief issue 12; test 8g (synthetic and real: 13-option C5 None sample, "Lowest risk", top scorer "Does not meet" at rank 13). |
| S3-note | BUILD-NOTES cited "§11 wording" for AC5 | Accepted | The wording is AC5's. | Corrected in Brief issue 12. |
| S4 | Principle 5: nothing hidden by default except non-finite chart points | Accepted | Correct. | Brief issue 14. |
| S5-gaps | Canvas untested; results quoted not re-run; no audit | Accepted | Correct. | Browser tests added; all suites re-run; axe run. |
| S5-card | §12.3 option card not built and not listed | Accepted | Correct. | Listed in "What is not in this slice" (§12.3–§12.6). |

### H3 (browser check)

| ID | Finding | Decision | Reasoning | Change |
|---|---|---|---|---|
| H3-1 | Load and run; no errors (phone, desktop) | Accepted | Re-run: 0 console or page errors (B10, B13). | None. |
| H3-2 | Trade-offs tab opens | Accepted | Correct. | None. |
| H3-3 | No horizontal overflow | Accepted | Re-run at 375 px: 375/375 (B13). | None. |
| H3-4 | Chart renders; pick line | Accepted | Correct. | Pick line now also states the rank-1 rule. |
| H3-5 | Table rows | Accepted | Correct. | B6 checks every page. |
| H3-6a | Chart not reached in 80 Tab presses (261) | Accepted | A real usability problem, though the existing "Skip to results" link already met WCAG 2.4.1. | "Skip to trade-offs chart" link (switches the tab, shows the chart, focuses it). Tags no longer tab stops. Off-canvas panel hidden from focus. Now: chart **2 Tab + Enter**, results **1 Tab + Enter**, Tab only **208** (was 261), inputs panel 174 stops (was 228). |
| H3-6b | Chart keys work | Accepted | Correct. | B3 automates it. |
| H3-7a, H3-7b | axe `color-contrast` serious, 27 nodes (#6b7079 on #efede7, 4.25:1) | Accepted | Confirmed by token analysis. `--ink-3` failed on surface-2 (4.25), info-bg (4.20), warn-bg (4.39) and bad-bg (4.07). | `--ink-3` light `#62676f` (lowest 4.65:1). axe: **0 serious, 0 critical** in light and dark on Trade-offs chart, Trade-offs table and Options. |
| H3-O1 | 54+ "unverified" tag spans focusable, aria-label without role | Accepted | Empty stops; `aria-prohibited-attr` needs-review item. | Tags are not focusable. The basis is the control's `aria-describedby` (hidden text) or visually hidden text. The item is gone from axe. |
| H3-O2 | Skip link works (30 presses from main) | Accepted | Correct. | Second skip link added. |
| H3-O3 | Canvas has no DOM nodes; SR uses live region and table | Accepted | By design. | None. |
| H3-O4 | Wide table scrolls inside its region on phones | Accepted | Data tables that need two-dimensional layout are exempt from WCAG 1.4.10 reflow. | None. |
| H3-O5 | 767 colour-contrast "needs review" nodes | Accepted | They are run-log rows clipped by the log's scroll box, so axe cannot see the background. | B7 and B11 check each node from computed styles: lowest 4.86:1 light, 5.00:1 dark, 0 below the minimum. |

### Reviewer findings (not raised by the verifiers)

| # | Finding | Change |
|---|---|---|
| R-1 | Hollow (dominated) markers drawn at 0.75 opacity: ramp step 1 at 2.51:1 light, 2.73:1 dark, below the 3:1 graphics target that BUILD-NOTES claimed. | Full-opacity strokes (SVG and Canvas). |
| R-2 | Form-control borders `--line` at 1.47:1 against same-colour panels (WCAG 1.4.11). | New `--control-border` (light `#888681`, dark `#73767a`, ≥ 3.1:1). |
| R-3 | `.tag-basis` at opacity 0.8: 4.49:1. | Opacity removed. |
| R-4 | Below 1280 px the closed off-canvas inputs panel stayed in the tab order (focus on invisible controls). | `visibility: hidden` while closed (with the slide transition). B12: 0 of 40 stops in the closed panel; reachable when open. |
| R-5 | Click and tooltip disagree where markers overlap. Pointer moves carry fractional coordinates and clicks whole pixels, so a click at the pick opened #968. Found by B4. | Click opens the hovered option; touch falls back to the click position. |
| R-6 | Legend class labels collide at 2 s.f. ("30 to < 30"). | Precision increases until edges are distinct ("30 to < 30.1"). |
| R-7 | Phone y-axis title overflowed after adding the direction text (introduced in this review). | Title shortened when it does not fit; direction always in the help text. |
| R-8 | `aria-label` on role-less `axis-bars` spans (50 nodes, Options tab, needs review). | `role="img"`. |
| R-9 | Table page size (a display count) had no §18 record. | `view.table.pageSize` (50), read by both tables, labelled in the pager. |
| R-10 | Header filter count missed has-flag, capex and dominated filters. | Shared `activeFilterCount()`. |
| R-11 | Placeholder colour left to the browser. | `::placeholder` uses `--ink-3`. |

### Mutation check of the new tests

Each mutant is a copy of the app with one old behaviour put back. The full suite was run on each copy.

| Mutant | Old behaviour reintroduced | Result |
|---|---|---|
| A | Canvas threshold hard-coded (`const canvasAbove = 500`) | 21/22: only **8f** fails |
| B | Pick = highest weighted score instead of rank 1 | 21/22: only **8g** fails |
| C | Old dominance tolerance in `scoring.js` | 21/22: only **8e** fails ("infinite cost, equal elsewhere") |
| D | `defaultView()` with `hideDominated: false` hard-coded | 21/22: only **8f** fails |

## Verifier errors

The three reports were accurate on every material point. I re-derived the H2 status counts (19 / 15 / 10 / 1 = 45) and the H3 contrast ratio (4.25:1), and checked H1's git claims, and found no error in them. Two minor errors:

1. **H2 R18:** "Removal is only by 'Clear all filters' on the Options tab, or 'show' for hidden dominated options." Not accurate. Each filter could also be undone at its own control:
   - pressing the active resilience chip again;
   - choosing the same flag again in the hide-flag select (it toggles);
   - pressing "Archetypes only" again;
   - clearing the search box.

   The finding itself stands: the chips were plain text and could not be removed.
2. **H2 R36:** cites `styles.css:318–320` for the "phone layout below 520 px". The 520 px switch is in `ParetoChart.jsx` (`phone = width < 520`). `styles.css` 317–321 is the ≤ 767 px block. This is a citation slip; the requirement verdict is right.

Not an error, but worth noting: H3-6a's 80-press threshold is the verifier's own criterion. WCAG 2.4.1 was already met by the existing "Skip to results" link (30 presses from there to the chart). I accepted the finding because reaching the chart quickly was the owner's goal.

## Final test output

Commands run in `/home/claude/build/app`, in this order, after the last source change: `npm run build`, `npm test`, `npm run test:browser`. Node v22.22.0, 2-core sandbox, Chromium 141 headless through Playwright 1.56.0, axe-core 4.10.2. Output as printed:

**`npm run build`**

```

> dc-energy-optioneering-core@0.1.0 build
> node build.mjs


  dist/app.js  342.0kb

⚡ Done in 127ms

  dist/worker.js  111.3kb

⚡ Done in 39ms

  dist/app.css  21.1kb

⚡ Done in 7ms
dist/app.js: 342.0 KB
dist/worker.js: 111.3 KB
dist/app.css: 21.1 KB
dist/index.html: 0.5 KB
dist/energy-tool-single-file.html: 475.3 KB (worker inlined, 111.3 KB)
build exit 0
```

**`npm test`**

```

> dc-energy-optioneering-core@0.1.0 test
> node tests/run-tests.mjs

Running core-slice tests…
T1 run: 2000 options screened of 57028 combinations in 10.77 s (single thread, 1732 distinct dispatch runs, 10394 8760-h years)
T3 run: 2000 options in 10.59 s
PASS  1. Per-hour energy balance (supply = demand + losses + curtailment + unmet), T1 and T3, full 8760-h years  (3516 ms)
      120 options, 6,342,240 hours checked; max |error| 2.84e-14 MWh (max relative 5.01e-16); SOC recursion max error 0.00e+0 MWh; BESS losses 269855 MWh and unmet 31972299 MWh across the sample. In-engine per-hour check over all 4000 screened options: max 2.84e-14 MWh.
PASS  2. Grid connection equals the offered capacity on every option, never resized; import never exceeds it in "Show unmet load"  (1014 ms)
      2000 options: grid connection = offered profile (20 MW to month 29, 120 MW from month 30) in every month; one connection capex value across all options; 2,698,080 hours checked, max import − offered = 3.55e-15 MW; 1039 options with unmet load, all flagged "Grid capacity binding" (major).
Test-3 resilience-fail sample: 36 options (sampling off).
PASS  3. No option is hidden by default  (9 ms)
      Resilience Meets/Meets with flags/Does not meet in the default view: T1 185/1815/0, T3 185/1815/0, T1 + C5 None 7/22/7; 7 "Does not meet" options shown and ranked (best rank 5 of 36), incl. 1 grid-only C5 = None at 0 MW backed failing "Backed load"; failing items on the 7 C5 = None options: Backed load + Autonomy + Backup technology | Backup technology. T1: 2000/2000 shown by default (1950 dominated, all shown and ranked); T3: 2000/2000 shown; 415 T3 grid-dependent options listed with unmet load + "Grid capacity binding" + time-to-power flags; archetypes present: A1, A2, A3, A4, A5, A6, A7, A8, A9, A10a, A10b.
PASS  4. Score and rank do not change when a view filter changes  (128 ms)
      10 view configurations (visible counts 50, 185, 0, 961, 1900, 29, 50, 11, 1113, 11 of 2000); 2000 scores and ranks identical before and after each.
PASS  5a. Determinism: same inputs + seed give identical outputs  (8943 ms)
      2000 options identical on two runs; a different seed gives a different Latin hypercube sample.
PASS  5b. Weight change re-ranks without re-dispatch; effective weights sum to 1  (0 ms)
      Balanced effective weights 35/25/25/15 %; all-zero → 25 % each with notice.
PASS  5c. "Show exceedance" removes unmet load on T3 and raises "Import exceeds grid capacity"  (1245 ms)
      21 grid-dependent T3 options: unmet 0 MWh, all flagged "Import exceeds grid capacity" (major).
PASS  5d. Every default record carries the "indicative — unverified" label and a basis  (0 ms)
      377 default records; all "indicative — unverified", confidence C, verified false; basis: source 269, judgement 101, run setting 7.
PASS  6a. Event log completeness: every stage has a start and an end, sequence numbers contiguous, stage order as specified (T1, T3 and the test-3 sample)  (20 ms)
      T1: 2086 events, seq 0–2085 contiguous, 12/12 stages start→end in order; dispatch 2000 progress events (1732 miss / 268 hit), resilience {"Meets":185,"Meets with flags":1815,"Does not meet":0}, 5 warnings (profiles-synthetic, defaults-unverified, cap-sampling, unmet-load, full-load-not-reached).
      T3: 2088 events, seq 0–2087 contiguous, 12/12 stages start→end in order; dispatch 2000 progress events (1721 miss / 279 hit), resilience {"Meets":185,"Meets with flags":1815,"Does not meet":0}, 7 warnings (profiles-synthetic, defaults-unverified, cap-sampling, unmet-load, full-load-not-reached, lcoe-non-finite, metric-non-finite).
      T1 + C5 None: 73 events, seq 0–72 contiguous, 12/12 stages start→end in order; dispatch 36 progress events (18 miss / 18 hit), resilience {"Meets":7,"Meets with flags":22,"Does not meet":7}, 5 warnings (profiles-synthetic, defaults-unverified, unmet-load, full-load-not-reached, requirement-not-met).
PASS  6b. Log content (timestamps excluded) is identical across two runs with the same inputs  (9 ms)
      2086 events identical on two T1 runs excluding t_ms (2086 of 2086 timestamps differ); input hash 0c072fa78e6f1a70 is independent of key order and changes when an input changes.
PASS  6c. Worker pool: each worker returns its own events; merged log complete, ordered and deterministic; results equal the single-thread run  (17316 ms)
      3 workers (real src/worker.js in worker_threads): merged 2155 events, seq contiguous, sources main, worker 0, worker 1, worker 2; per worker 667 options 642 miss/25 hit; 667 options 636 miss/31 hit; 666 options 639 miss/27 hit; 1732 distinct configurations, 185 simulated in more than one worker; streamed events = returned events; second pool run identical excluding timestamps; 2000 scores and ranks equal the single-thread run.
PASS  6d. Main-thread fallback: time-sliced runModelSteps gives the same log content and results, and the progress tracker reaches 100 % on every stage  (11303 ms)
      302 time slices of ≤ 30 ms of work each (plus one item overrun); current stage observed in 5 of 12 stages between slices; log content identical to the synchronous run; tracker: 12/12 stages 100 %, dispatch cache 1732 miss / 268 hit, last 200 events kept.
PASS  6e. Log export: JSON round-trips, CSV has one row per event, file names carry the input hash and a timestamp  (44 ms)
      JSON 1314 KB, 2086 events round-trip; CSV 1256 KB, 2086 rows + header; e.g. run-log_0c072fa78e6f1a70_20261015-130509Z.json.
PASS  7. Single-file build: worker inlined as a Blob-URL source string, no relative "worker.js" or other file reference, inlined source parses and runs  (1468 ms)
      single file 475.3 KB, 1 inline script, 0 "worker.js" mentions, 0 <script src>, 0 <link href>, 0 relative src/href; inlined worker source 114,017 chars, identical to dist/worker.js, parses; run in a worker_thread on slice 1/50 of T1: 40 options, 76 log events.
PASS  8a. Pareto set (non-dominated on the two plotted axes) is correct on a hand-checked example  (61 ms)
      hand example frontier A, B, E, D (C, F, G dominated; H not plottable); 200 random sets (4334 points, with ties) match brute force; engine set frontier o1, o2, o4 with o3, o5 marked dominated; T1 LCOE vs location carbon: 11 of 2000 on the frontier, equal to brute force; T1 time-to-power vs deliverability (higher is better): 1 on the frontier, equal to brute force.
PASS  8b. Weighted pick is the highest weighted score and moves with the weights, with no dispatch re-run  (146 ms)
      5 weight presets, 4 distinct picks: Balanced → O1YAUJ8J (86.0); Lowest cost → OZ57BJM (88.6); Lowest carbon → O1YAUJ8J (92.0); Speed to market → OLN9RSS (90.8); Lowest risk → OCRJR70 (85.4). Pick = hand-computed argmax = rank 1 every time; dispatch/economics objects identical by reference; dispatch counter 1732 before and after; 29 ms per preset for re-score + view (T1 full run 10.8 s).
PASS  8c. Dominance marking does not remove any option from the Pareto view, the list or the ranking  (20 ms)
      T1: 2000/2000 in the view (1950 dominated, best dominated rank 2); hide on → 50 shown + 1950 hidden, scores, ranks, pick and frontier unchanged; T3: 2000/2000 in the view (1910 dominated, best dominated rank 2); hide on → 90 shown + 1910 hidden, scores, ranks, pick and frontier unchanged; T1 + C5 None: 36/36 in the view (13 dominated, best dominated rank 14); hide on → 23 shown + 13 hidden, scores, ranks, pick and frontier unchanged.
PASS  8d. Every point in the Pareto chart has a matching row in the table alternative (rendered)  (1510 ms)
      T1 default: 2000 points / 2000 rows, 0 missing; T1 NPV vs market, hide dominated: 50 points / 50 rows, 0 missing; T3 1−CFE, phone width: 1974 points / 2000 rows, 0 missing; T1 + C5 None: 36 points / 36 rows, 0 missing; T1 time-to-power vs deliverability: 2000 points / 2000 rows, 0 missing.
PASS  8e. Dominance is marked when the dominated option has an infinite cost (LCOE with no delivered energy)  (4 ms)
      6 hand-checked cases as expected (infinite cost dominated by an equal-elsewhere finite cost, both orders; infinite ties and infinite dominators not marked); view: hollow, not plotted, hidden by "Hide dominated options"; T3: 26 options with infinite LCOE, 0 of them beaten exactly by a finite-cost option (each marked dominated), 3 dominated in total.
PASS  8f. Every registered view setting and run setting is the value the code uses  (148 ms)
      15 settings.* records = input defaults; hideDominated: record → defaultView() → paretoView default; ttpClasses 5 (T1 uses 4 after merging tied edges; 2 → ≤ 2); canvasAbove 500: T1 2000 points on Canvas; threshold 2000 → SVG, 1999 → Canvas; display "chart" (record "table" → table first); pageSize 50 rows (record 7 → 7 rows); axes follow-scoring (record "ttp" → x = time-to-power).
PASS  8g. AC5: the highlighted pick is the weighted leader (rank 1, the header leader) with "Rank requirement-compliant options first" on or off  (70 ms)
      synthetic: toggle off → pick = rank 1 = top scorer, no second mark; toggle on → pick = rank 1 (Meets), top scorer (Does not meet, rank 3) marked separately with the reason in the pick line; real samples: 20 sample × preset × toggle combinations, pick = rank 1 in all, 1 with a separate highest-score mark (C5 None, 13 options, Lowest risk: top scorer rank 13 (Does not meet); toggle on in each); App.jsx leader = weightedPick(); undrawn pick explained (hide-dominated tie, filters, not plottable).
PASS  8h. Every active view filter is a removable chip, and the header filter count matches applyView()  (23 ms)
      9 view states, 18 chips each removed alone (only that filter goes); filter count = applyView chips in every state; removing every chip restores all 2000 options; Trade-offs renders one remove button per chip.

22/22 tests passed.
Timing (single thread, Node v22.22.0): T1 full run 10.77 s for 2000 options; T3 10.59 s.
npm test exit 0
```

**`npm run test:browser`**

```

> dc-energy-optioneering-core@0.1.0 test:browser
> node tests/browser-tests.mjs

Browser tests on file:///home/claude/build/app/dist/energy-tool-single-file.html
Chromium 141.0.7390.37, Playwright 1.56.0, axe-core 4.10.2
PASS  B1. Tab order from the top of the page (no skip link): stops before the results and the chart, none hidden  (15.2 s)
      loaded and ran in 12.3 s; Tab only: 179 presses to the first stop in the results, 202 to the results tab list (ArrowRight selects Trade-offs, ARIA tabs pattern), 208 to the chart; 174 stops in the inputs panel, 2 skip links; every stop visible.
PASS  B2. Skip links: "Skip to results" and "Skip to trade-offs chart" are the first two Tab stops and reach their targets  (0.5 s)
      chart reached with 2 Tab presses + Enter (focus on svg#tradeoffs-chart, :focus-visible, Trade-offs selected); live region: "Grid · Diesel N+1 · DLC · PV 7.8 MWp · PPA hybrid 100 %. Rank 1, score 86.0. LCOE 134 €/MW…"; results reached with 1 Tab press + Enter (#results, tabindex −1).
PASS  B3. Keyboard on the chart: arrows move along the axes, Home/End, P returns to the pick, Enter opens its detail, Escape clears  (3.1 s)
      pick → 8 × ArrowRight, 8 new options, x non-decreasing (134 → 134 → 134 → 134 → 134 → 134 → 134 → 134 → 134) → 8 × ArrowLeft back to the pick; 8 × ArrowUp, y non-decreasing (113 → 113); Home → leftmost (on the frontier; ArrowLeft stays); End → rightmost (ArrowRight stays); P → pick; Enter opened "#1 · Grid · Diesel N+1 · DLC · PV 7.8 MWp · PPA hybrid 100 %…" and a second Enter kept it open; Escape cleared the ring.
PASS  B4. Canvas path (more than the registered threshold): points drawn on Canvas, no SVG markers, pixels at the pick, pointer hit-test opens the nearest option  (0.4 s)
      2000 plotted points > threshold 500: Canvas 942×460, 53,594 painted pixels, 0 SVG markers; pixel at the pick rgb(179, 164, 195); pointer at the pick: hover and click both chose "#1 · Grid · Diesel N+1 · DLC · PV 7.8 MWp · P…" (0.00 px from the pointer; overlapping markers).
PASS  B5. SVG path (at or below the threshold): with "Hide dominated options" on, markers are SVG paths, one per plotted point, no Canvas  (0.7 s)
      50 points → 50 SVG markers, no Canvas; counter chip "1,950 dominated options hidden show"; "show" restored the Canvas view.
PASS  B6. Table paging: every option reachable, page size as registered, rank order, the pick on page 1  (3.7 s)
      2000 rows, 50 per page, 40 pages; Next through every page collected 2000 distinct options in rank order 1…2000 (last page 50 rows); Next disabled at the end; Previous goes back; pick badge on row 1.
PASS  B7. axe (WCAG 2.0/2.1/2.2 A and AA rules), light theme: Trade-offs table, Trade-offs chart and Options tab have no serious or critical violation  (13.3 s)
      Trade-offs, table: 32 rules passed, violations {}, needs review color-contrast ×749
      Trade-offs, chart: 33 rules passed, violations {}, needs review color-contrast ×767
      Options: 34 rules passed, violations {}, needs review color-contrast ×773
      Options (light): 748 "needs review" text nodes checked from computed styles, lowest 4.86:1 (.rp-ev-progress.rp-ev:nth-child(1) > .rp-t, rgb(98, 103, 111), 12px), 0 below the minimum; 25 icon-only glyphs (decorative, beside text)
PASS  B8. Removable filter chips: each filter shows a chip with its own remove button; removing it by keyboard keeps focus in the chip row  (1.3 s)
      chips "Resilience: Meets", "Capex ≤ €150 m"; header counted 2 filters and the shown count; Enter on "Remove filter" removed only that chip and focus stayed on the next chip's remove button; last chip removed → no chip row, count 0.
PASS  B9. A weight preset moves the pick without a re-run (§17 target ≤ 100 ms, measured in the browser)  (0.4 s)
      pick "#1 Grid · Diesel N+1 · DLC · PV 7.8 MWp …" → "#1 Islanded gas recips · retained-plant …" in 104 ms (click to repaint of the pick line; no re-run); header leader = pick before (yes) and after (yes).
PASS  B10. No console errors or page errors on the main page  (0.0 s)
      0 errors (load and run 12.1 s, status "Options updated. Leader unchanged. Last run 12 s on 1 worker").
PASS  B11. axe, dark theme (prefers-color-scheme: dark): Trade-offs chart, table and Options tab have no serious or critical violation  (24.4 s)
      Trade-offs, chart (dark): 33 rules passed, violations {}, needs review color-contrast ×767
      Trade-offs, table (dark): 32 rules passed, violations {}, needs review color-contrast ×750
      Options (dark): 34 rules passed, violations {}, needs review color-contrast ×773
      Options (dark): 748 "needs review" text nodes checked from computed styles, lowest 5:1 (.rp-ev-start.rp-ev:nth-child(189) > .rp-src, rgb(154, 152, 144), 12px), 0 below the minimum; 25 icon-only glyphs (decorative, beside text)
PASS  B12. Tablet width (1000 px): the closed inputs panel takes no Tab stop; opened, its controls are reachable  (13.0 s)
      closed: 0 of 40 Tab stops in the panel, all visible; opened: panel controls reached by Tab.
PASS  B13. Phone width (375 px): Trade-offs chart and table cause no horizontal page scroll  (11.9 s)
      chart 375/375 px, table 375/375 px (scrollWidth/clientWidth); the wide table scrolls inside its own region.

13/13 browser checks passed.
Keyboard: chart in 2 Tab + Enter via the skip link (results: 1 Tab + Enter); Tab only from the top: 208 presses (174 in the inputs panel).
npm run test:browser exit 0
```


## Status

**Ready to show the owner.** The two failing H3 checks now pass: axe reports 0 serious and 0 critical violations in light and dark, and the chart is 2 Tab presses + Enter from the top. Every H1 and H2 finding is either fixed or recorded with a reason. `npm test` is 22/22 and `npm run test:browser` 13/13.

Files changed (originals in `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/pareto-review-backup/`):
- **Engine:** `src/engine/pareto.js`, `src/engine/defaults.js` (view records, `registryValue`), `src/engine/index.js`, `src/engine/scoring.js` (one tolerance expression), new `src/engine/view.js`.
- **UI:** `src/App.jsx`, `src/components/ParetoView.jsx`, `ParetoChart.jsx`, `ParetoTable.jsx`, `RankedList.jsx`, `Field.jsx`, `InputsPanel.jsx`, `OptionDetail.jsx`, new `FilterChips.jsx`, `src/styles.css`.
- **Tests:** `tests/run-tests.mjs`, new `tests/browser-tests.mjs`.
- **Project:** `package.json` (`test:browser`, devDependency `axe-core` 4.10.2), `package-lock.json`, `BUILD-NOTES.md`, rebuilt `dist/`.
- **Not changed:** dispatch, sizing, generator, evaluation code, and `brief-v2/`.

Still open:
- **Screen-reader walk-through** (NVDA + Firefox, VoiceOver + Safari), as §17 and AC11 require. It cannot be done in this sandbox.
- **§17 timing:** a weight preset repaints the pick in about 96–130 ms in headless Chromium on this 2-core sandbox. The target is ≤ 100 ms on the 4-core reference machine. Measured, not asserted.
- **Deferred to later slices** (recorded in BUILD-NOTES):
  - site-fit marker shape and the land-take ceiling filter (site slice);
  - the leader-specific unverified-defaults count (uncertainty slice);
  - the §12.3 option card and right-hand drawer (option-card work).
- **Outside this slice:** core run constants without a §18 record (last 200 log events, progress every 250 items, 30 s worker watchdog, 200-event / 120 ms stream batches). Also the pre-existing esbuild 0.23.1 dev-server advisory; the build does not use the dev server.
- **Tab-only navigation** from the top still passes 174 stops in the inputs panel (mostly the Choices chips). Arrow-key toolbars for the chip groups would cut about 70 stops without hiding anything. This was not done, because it changes how the inputs panel works and the skip links already bypass the panel.
- **Repo copy:** `/home/claude/dc-learning` is not updated and nothing was committed.
