# H2 brief check: Site slice (brief §10 and related)

Checked 2026-10-17 by the H2 verifier against /home/claude/build/brief-v2/BRIEF.md. Read-only: this report is the only file written. npm run build was not run, and the test suites were not re-run, so test results below are the ones BUILD-NOTES records (test output at lines 830–918).

## Summary

- Requirements table: 91 rows (plus cross-reference row I02). IMPLEMENTED 63, PARTIAL 15, DEFERRED 8, MISSING 5.
- Deviations: 28. CONFORMS 4, CONFLICTS 19, AMBIGUOUS 5. BUILD-NOTES records 12 in full, 3 in part, and 13 not at all.
- Height rule (D1): AMBIGUOUS. Recorded as judgement 11. The brief supports both readings (section 3.1).
- Compliant-first ranking (D9): CONFLICTS with §11. The toggle demotes only resilience "Does not meet", not site-fit "Does not fit". Not recorded (section 3.1).
- Label rule: 489 registry records, none failing; 112 new site records, all labelled (section 5).
- Scope: most §20 stage 2 items are present. Missing: underlay, heat reuse blocks, building footprint override, carport block. No stage 7 feature (manual layout editing, 2.5D massing, online tiles) is built. Several deferrals are filed under the wrong stage (section 6).

## Method and key

- Brief sections read: §2 principle 5; §5.2, §5.3, §5.5, §5.7; §6.2–6.3; §7.2; §8 C10, C11, C17, C18; §9.2; §9.9; §10; §11; §12.1–12.2; §15; §17; §18; §20; §21 AC7, AC11, AC13; §23.
- Build notes: /home/claude/build/app/BUILD-NOTES.md, "Slice: Site (§10)" (lines 553–920), with core lines 119–120 and the record table (607–720). SITE-PROGRESS.md read.
- Code references are file:line. engine/ files are under /home/claude/build/app/src/engine/ (layout.js, site.js, blocks.js, sizing.js, sitefit.js, run.js, defaults.js, scoring.js, evaluate.js, generator.js, pareto.js, geometry.js). components/ files are under /home/claude/build/app/src/components/ (App.jsx, InputsPanel.jsx, RunSummary.jsx, RankedList.jsx, ParetoChart.jsx, SiteView.jsx, Field.jsx, site/SitePlan.jsx, site/SiteFitPanel.jsx, site/SiteEditor.jsx). Every cited line was read or searched in this pass.
- Not traced: the Include-wind regeneration path, the rendering of the site panels, and the §17 timings (taken from BUILD-NOTES).

Status key. IMPLEMENTED: the code does what the row says. PARTIAL: part is built, or built differently. DEFERRED: not built, and BUILD-NOTES records it (line given). MISSING: not built; the note says whether it is recorded.

Verdicts for deviations. CONFORMS: matches the brief. CONFLICTS: departs from a clear brief statement. AMBIGUOUS: the brief allows two readings, or contradicts itself.

## 1. Requirements table

IDs: R = §10 and related §6.2 and §10.3–10.4 rows; I = §5.2 inputs; S and L = §5.3 and §5.5; W, U, C, V, F = §5.7/§9.9, §11, §8, §12 and §15; A07, A13, P05 = acceptance criteria and principle 5; T = §17; K = carport.

### 1.1 §10.1 Site model

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| R01 | §10.1 Boundary polygon(s), drawn, typed or imported | PARTIAL | site.js (boundary from a drawn, typed or imported polygon; BUILD-NOTES 561); components/site/SiteEditor.jsx:166 | One boundary only; a second is ignored with a note. See D27. |
| R02 | §10.1 Setbacks, uniform and per edge | IMPLEMENTED | site.js (per-edge offsets; BUILD-NOTES 561); InputsPanel.jsx:40 (uniform default) | Default 10 m. |
| R03 | §10.1 Hard and soft exclusions | IMPLEMENTED | defaults.js:431–438 (six types, hard or soft); components/site/SiteEditor.jsx:60–68 (use choices) | Soft-cell use by non-solar blocks: D2. |
| R04 | §10.1 Height-limit zones overriding the site limit | IMPLEMENTED | site.js:251 (heightZones, heightLimitM); sitefit.js:98–113 (check per zone) | Height is soft in placement: D1. |
| R05 | §10.1 Grid POC | IMPLEMENTED | site.js:141–145 (default is the access point); layout.js:101 (anchor) | Default differs from §5.2: D10. |
| R06 | §10.1 Gas main | PARTIAL | site.js:146, 252; layout.js:102 (firm plant anchor) | Placement built; connection cost not built: I08b. |
| R07 | §10.1 Access points | IMPLEMENTED | site.js:141–145 (default: mid-point of longest edge); layout.js:103 (fuel anchor) | Does not drive the roads allowance: I09b. |
| R08 | §10.1 Noise receptors | IMPLEMENTED | BUILD-NOTES 561 (points or areas); layout.js:104 (anchors away from receptors); sitefit.js:115–160 (noise) | — |
| R09 | §10.1 Optional off-site land | IMPLEMENTED | InputsPanel.jsx:48–49 (area and distance); blocks.js:189 (off-site entries with landHa and distanceKm) | — |
| R10 | §10.1 Net developable area and buildable envelope | IMPLEMENTED | site.js:176–180 (raster); site.js:239–241 (allowance and net) | Allowance base: D14 (recorded). |
| R11 | §10.1 Flat ground assumed | IMPLEMENTED | No terrain input among the site records (defaults.js:533–550) | — |

### 1.2 §10.2 Basemap

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| R12 | §10.2 Plain plan with scale bar and north arrow | IMPLEMENTED | components/site/SitePlan.jsx:7 and 185 (scale bar, north arrow); components/SiteView.jsx:220 (plain plan, no tiles) | — |
| R13 | §10.2 User underlay if provided (also §5.2) | DEFERRED | BUILD-NOTES 813; components/App.jsx:195 ("Not built yet ... map tiles and underlays") | Filed under "stage 7", but §20 stage 2 "2D plan" covers it: D17. |
| R14 | §10.2 Online tiles with attribution; plan works without them | DEFERRED | BUILD-NOTES 813; App.jsx:195 | §20 stage 7 item. |

### 1.3 §10.3 Blocks

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| R15 | §10.3 Each technology instance becomes blocks (footprint, height, clearance, type) | PARTIAL | blocks.js:96–263 (building, substation, gensets, fuel, firm, BESS, heat rejection, wind, solar fill) | Carport missing: K01. Heat reuse not built: R22b. |
| R16 | §10.3 Unit arrays with a configurable row and column arrangement | PARTIAL | blocks.js:46, 54–55, 70 (arrays use sp.rows); defaults.js:419–423 (rows 2, range 1–4) | Changeable only in the registry; no UI control (BUILD-NOTES 826). |
| R17 | §10.3 Rooftop blocks sit on the building and count toward height | IMPLEMENTED | blocks.js:233–235 (roof plant), 238 (rooftop PV, +1 m); sitefit.js:98–113 (height check uses building with roof zone) | — |
| R18 | §10.3 Off-site tray: land take in ha and private-wire distance; no site area used | IMPLEMENTED | blocks.js:189 (off-site entries with landHa, distanceKm); BUILD-NOTES 562, 596 | — |

### 1.4 §10.4 Auto-layout

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| R19 | §10.4 step 1: raster, 2 m cells, 5 m above 50 ha | IMPLEMENTED | site.js:176–179 (large-site switch and cell size); BUILD-NOTES 613–615 (run settings, labelled) | — |
| R20 | §10.4 step 2: priority order | IMPLEMENTED | blocks.js:24 (PRIORITY: building 1, substation 2, genset and fuel 3, firm 4, BESS 5, heat rejection 6, wind 7, solar 8) | Heat reuse is not in the list: R22b. |
| R21 | §10.4 step 2: anchors (substation near POC; gensets within 30 m of the building and away from receptors; firm plant near the gas main; BESS near substation) | IMPLEMENTED | layout.js:101–104 (POC, gas, access, receptors); defaults.js:337 (maxDistBuildingM 30); BUILD-NOTES 584 | — |
| R22a | §10.4 step 2.6: ground heat rejection | IMPLEMENTED | blocks.js:214–239 (heat rejection modules and roof plant) | — |
| R22b | §10.4 step 2.6: heat reuse plant | DEFERRED | BUILD-NOTES 815; no heat reuse block or record in the source | The §6.3 default (30 m² per MWth) has no record: D16. |
| R23 | §10.4 step 2.7: wind pads with topple and noise buffers | IMPLEMENTED | blocks.js:241–254 (pads and buffers); BUILD-NOTES 586 (buffers flag-only) | Count from spacing: D21. |
| R24 | §10.4 step 2.8: ground solar fills the remaining area, and soft exclusions if allowed | PARTIAL | layout.js:390–396 (computeFill; soft cells only if softAllowed and softUsableBySolar, line 395); blocks.js:262–263 (fill record) | Soft-cell rule in placement: D2. |
| R25 | §10.4 step 3: placement tests clearances, separations, boundary, hard exclusions and height zones; least cost to anchor | IMPLEMENTED | layout.js:140–157 (buildState), 327–347 (brokenRules), 349–385 (placeBlock with level loop) | Height is tested only at L0 and L1: D1. |
| R26 | §10.4 step 4: unplaced block goes to the tray with its m² shortfall; option "Does not fit" | IMPLEMENTED | sitefit.js:194–206 (unplaced tray and shortfall); sitefit.js:263–268 (status) | — |
| R27 | §10.4 step 5: block placed by relaxing a soft rule gives "Fits with flags", rule named | IMPLEMENTED | layout.js:37–43 (LAYOUT_LEVELS); sitefit.js:208–232 (relaxed rules named) | Minimum values are judgement (judgement 12). |
| R28 | §10.4 "iteration with sizing": fill residual after the other blocks; no other sizing depends on layout | IMPLEMENTED | sizing.js:218–219, 283–286 (estimate before layout); sizing.js:372–383 (applySolarFill); run.js:148 (call) | Conforms: D15. |

### 1.5 §10.5 Manual editing

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| R29 | §10.5 Drag, rotate (90°) and rearrange blocks on a pinned option; live rule checks | DEFERRED | BUILD-NOTES 811 | §20 stage 7. |
| R30 | §10.5 Keyboard editing: Tab cycles blocks, arrows move one cell (Shift 5), R rotates, Delete sends to tray | DEFERRED | BUILD-NOTES 811 | Keyboard focus moves between blocks for reading only (BUILD-NOTES 573). |
| R31 | §10.5 Manual layout saved; later input changes keep manual positions and show a notice | DEFERRED | BUILD-NOTES 811 | — |

### 1.6 §10.6 Site-fit outputs

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| R32 | §10.6 Status: Fits / Fits with flags / Does not fit | IMPLEMENTED | sitefit.js:263–268 (status); components/RankedList.jsx:34 (SiteFitBadge) | — |
| R33 | §10.6 Area budget bar by block type against net area; shortfall beyond 100 % | IMPLEMENTED | sitefit.js:162–172 (budget by type, placed and unplaced); components/site/SiteFitPanel.jsx:59 | Bar drawing not inspected. |
| R34 | §10.6 Land take on site and off site; residual area | IMPLEMENTED | sitefit.js:162–172 (land take); sitefit.js:275–281 (residual) | — |
| R35 | §10.6 Height check: tallest element (building with roof zone, stacks, wind tip) per zone | IMPLEMENTED | sitefit.js:98–113 (per zone, element named); BUILD-NOTES 597 | — |
| R36 | §10.6 Separation checklist: each rule pass, relaxed or fail | IMPLEMENTED | sitefit.js:90–96 (statuses); components/site/SiteFitPanel.jsx:107 | — |
| R37 | §10.6 Noise proxy: distance to receptor and boundary; level from sound power and spreading only; flag above threshold (45 dB(A) at night); label | IMPLEMENTED | sitefit.js:15 (label), 21 (formula), 115–160 (proxy); defaults.js:424–426 (spreading record); InputsPanel.jsx:45 (threshold) | Spreading constant: D22 (conforms). |
| R38 | §10.6 Roof use: roof split between plant, PV and free | IMPLEMENTED | sitefit.js (roof block; BUILD-NOTES 600); sitefit.js:257 (over-allocation flag); components/site/SiteFitPanel.jsx:147 | Sizing uses a fixed 40 % plant share: D8. |
| R39 | §10.6 Expansion headroom (estimate) | IMPLEMENTED | sitefit.js:275–281 | An estimate: residual net area divided by land take per MW of IT-scaling blocks. |

### 1.7 §10.7 Site views

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| R40 | §10.7 2D plan: boundary, setbacks, exclusions, blocks in energy-source colours, clearance rings, flags, dimensions on hover | IMPLEMENTED | components/site/SitePlan.jsx:7 (layers), 185; components/SiteView.jsx:49, 139 (layer toggles); BUILD-NOTES 572–573 (dimensions on hover and focus) | Palette and hatching: BUILD-NOTES 775–781. |
| R41 | §10.7 2.5D massing (optional) | DEFERRED | BUILD-NOTES 812; App.jsx:195 | §20 stage 7. |
| R42 | §10.7 Small multiples of pinned or top options, at one scale | PARTIAL | components/SiteView.jsx:42–43 (count from view.site.smallMultiples; top N); BUILD-NOTES 575 | Pinned options absent: BUILD-NOTES 816. |

### 1.8 §5.2 site inputs

Underlay is row R13 and is counted once there.

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| I01 | §5.2 Site boundary: R (one of: draw, import, or area and aspect) | PARTIAL | components/site/SiteEditor.jsx:160–172 (import); InputsPanel.jsx:30–36 (area and aspect); site.js (drawn polygon) | Start state is a 15 ha rectangle (defaults.js:518), not "none": D20. |
| I02 | §5.2 Underlay | see R13 | — | Counted at R13. |
| I03 | §5.2 Boundary setback 10 m, per-edge override | IMPLEMENTED | InputsPanel.jsx:40; defaults.js:537 | — |
| I04 | §5.2 Exclusion zones: six types, hard or soft; soft usable by solar only (configurable) | PARTIAL | defaults.js:431–438 (types; flood soft); site.js:126 (softUsableBySolar); layout.js:142–143 (at L4 every block may use soft cells) | D2. |
| I05 | §5.2 Height limit 25 m, per-zone override | IMPLEMENTED | InputsPanel.jsx:41; defaults.js:539; SiteEditor (zone limits; BUILD-NOTES 574) | Soft in placement: D1. |
| I06 | §5.2 Ground conditions (free text) | IMPLEMENTED | InputsPanel.jsx:52; defaults.js:550 | — |
| I07a | §5.2 POC drives substation placement | IMPLEMENTED | layout.js:101 (POC anchor); BUILD-NOTES 584 | Default is the access point: D10. |
| I07b | §5.2 POC drives cable-route length for cost | MISSING | evaluate.js:96 (cost uses sp.cableKm, a fixed 1.0 km record, defaults.js:283) | Not recorded: D11. |
| I08a | §5.2 Gas main drives gas-plant placement | IMPLEMENTED | layout.js:102 (firm plant anchor); BUILD-NOTES 584 | — |
| I08b | §5.2 Gas main drives connection cost | MISSING | evaluate.js:96–108 (grid connection only); site.gasMain is read only in site.js and layout.js | Not recorded: D12. |
| I09a | §5.2 Access point (one, mid-point of longest edge) drives fuel-delivery placement | IMPLEMENTED | site.js:141–145 (default); layout.js:103 (fuel anchor); BUILD-NOTES 584 | — |
| I09b | §5.2 Access point drives the roads allowance | MISSING | site.js:239–241 (allowance = roadsFraction × envelope; no access term) | Not recorded: D13. |
| I10 | §5.2 Noise receptors (points or polygons); distance-based flags | IMPLEMENTED | BUILD-NOTES 561 (points or areas); sitefit.js:115–160 | — |
| I11 | §5.2 Roads, parking and landscaping allowance, 15 % of net developable area | PARTIAL | InputsPanel.jsx:44 (input); site.js:239–241 (fraction of envelope) | Base differs: D14 (recorded). |
| I12 | §5.2 Off-site land as polygon or area in ha, with distance in km | IMPLEMENTED | InputsPanel.jsx:48–49; BUILD-NOTES 628 | — |
| I13 | §5.2 Derived: gross area, net developable area, buildable envelope, roof area | IMPLEMENTED | sizing.js:221–224 (areas from the site model); sitefit.js (roof area); BUILD-NOTES 561 | — |

### 1.9 §5.3 and §5.5 site rows

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| S01 | §5.3 Roof plant zone height 4.0 m counts toward the height check | IMPLEMENTED | BUILD-NOTES 597 (building plus roof zone) | Height source not traced to a record. |
| S02 | §5.3 Roof plant fraction 40 % (A); derive from heat-rejection footprint where larger | PARTIAL | sizing.js:268 (fixed fraction, TECH heatRejection.roofPlantFraction, defaults.js:287); blocks.js:233–235 (maximum of fraction and footprint) | Sizing and layout disagree when the footprint is larger: D8. |
| S03 | §5.3 Building footprint override (user draws the building) | DEFERRED | BUILD-NOTES 814 | Stage 2 content filed under stage 7: D19. |
| S04 | §5.3 Storeys (2) and storey height (6 m) set footprint and height | IMPLEMENTED | sizing.js:74–77 (footprint and height); BUILD-NOTES 795 | — |
| L01 | §5.5 Land-take ceiling (A): default net developable area; minor flag when exceeded | IMPLEMENTED | BUILD-NOTES 611 (record); sitefit.js:261 (target-landtake); scoring.js:139 (view filter) | — |

### 1.10 §5.7, §9.9 and §11 site rows

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| W01 | §5.7 Site fit not weighted; no effect on the score unless the penalty is on | IMPLEMENTED | scoring.js:23–58 (four weighted axes only); defaults.js:638 (penalty off); BUILD-NOTES 738 (test 9g) | — |
| W02 | §9.9 Site-fit penalty: −10 for Fits with flags, −25 for Does not fit; off by default; labelled | IMPLEMENTED | defaults.js:638–640; evaluate.js:528–529 (gate and points); BUILD-NOTES 722 (label) | — |
| U01 | §11 Site-fit and resilience badges in the ranking | IMPLEMENTED | components/RankedList.jsx:34 (SiteFitBadge), 198 (use) | — |
| U02 | §11 "Rank requirement-compliant options first" covers site fit | PARTIAL | scoring.js:99–107 (demotes resilience "Does not meet" only); pareto.js:163, 239; InputsPanel.jsx:141 (toggle) | Conflicts with §11: D9. |
| U03 | §7.2 step 6 (cited in §11): dominance uses site-fit status | IMPLEMENTED | scoring.js:65–97 (siteRank, markDominance); BUILD-NOTES 726 | Dominance is a mark only. |
| U04 | §11 View filters by site-fit status and land-take ceiling, as chips | IMPLEMENTED | scoring.js:115–121 (DEFAULT_VIEW), 134–139 (applyView) | — |
| U05 | §11 Filters and site fit do not change scores or ranks (defaults) | IMPLEMENTED | scoring.js:3–5 (scope note), 65–107; BUILD-NOTES 738 (test 9g) | Test result as recorded. |

### 1.11 §8 choices

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| C01 | §8 C10 on-site solar: none, roof, roof + carport, roof + fill residual, fixed | IMPLEMENTED | defaults.js:123 | Carport has no block: K01. |
| C02 | §8 C11 wind: default None when site ≤ 20 ha and no off-site land; info note; "Include wind" | IMPLEMENTED | defaults.js:162–163 (rule); defaults.js:652 (threshold record); InputsPanel.jsx:147 (threshold input), 263 (info on the C11 row); components/RunSummary.jsx:55 (Include wind) | Count by spacing: D21. |
| C03 | §8 C17 AIS default; GIS not generated; never opens automatically; "N options do not fit" note with Include | IMPLEMENTED | defaults.js:133 (values); run.js:366–376 (note with count); RunSummary.jsx:55 (Include) | — |
| C04 | §8 C18 single-deck default; double-deck and in-building not generated; same note | IMPLEMENTED | defaults.js:134 (values); run.js:366–376 | Double-deck factor is a literal: D5. |

### 1.12 §12 and §15 rows

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| V01 | §12.1 Ranking table: site-fit badge and land-take column | IMPLEMENTED | components/RankedList.jsx:34, 198; land-take column (landTake used in three places in RankedList.jsx) | — |
| V02 | §12.2 Pareto marker shape = site-fit status | IMPLEMENTED | components/ParetoChart.jsx:22 (circle, triangle, square), 124 (shape per point) | Legend: BUILD-NOTES 569. |
| F01 | §15 Each flag carries id, severity, category, message, triggering value, threshold and link to the input | PARTIAL | sitefit.js:191 (helper: id, severity, category, message, siteFit) | Value and threshold appear only in the message text; no input-link field: D24. |
| F02 | §15 Site-fit flags: does not fit, separation relaxed, height exceeded, block in soft exclusion, roof over-allocated | IMPLEMENTED | sitefit.js:205 (site-does-not-fit), 222 (site-relaxed), 224 and 230 (site-height), 226 (site-soft), 257 (site-roof) | — |
| F03 | §15 Permitting: noise proxy above threshold, with the screening note | IMPLEMENTED | sitefit.js:246 (site-noise; "Screening flag, not a permitting determination"); BUILD-NOTES 799, 824 (permitting false) | Category Permitting. |
| F04 | §15 Permitting: stack above height limit | PARTIAL | sitefit.js:224, 230 (stack counted inside site-height, category Site fit) | Category differs from §15: D23 (recorded). |
| F05 | §15 Targets: land take above ceiling (minor) | IMPLEMENTED | sitefit.js:261 (target-landtake) | — |
| F06 | §15 Technology: wind not generated by default on a site ≤ 20 ha (info, §8 C11) | PARTIAL | components/InputsPanel.jsx:263; engine/generator.js:108 (run and choice notes) | No option-level flag. The flags register is stage 6 (§20 item 6). |
| F07 | §15 Generation: values not generated (info, run summary) | IMPLEMENTED | run.js:366–376; components/RunSummary.jsx:55 | — |

### 1.13 Acceptance criteria and principle 5

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| A07 | AC7 on T2: a "Does not fit" archetype with a named shortfall; C17 and C18 notes at defaults; GIS with double-deck gives options that fit or fit with flags; no option hidden by default | IMPLEMENTED | test 9f (BUILD-NOTES 874–875); scoring.js:123 (hideDominated false) | Margin is thin: 2 options fit with flags (BUILD-NOTES 822). Test not re-run. |
| A13 | AC13 site parts: C11 info flag on the C11 row and in the run summary; Include wind; C17 and C18 notes | IMPLEMENTED | components/InputsPanel.jsx:263; components/RunSummary.jsx:55; run.js:366–376 | The Include-wind regeneration path was not traced. |
| P05 | §2 principle 5, site parts: site status flags and never removes, hides or demotes an option | IMPLEMENTED | scoring.js:65–107 (dominance mark; no site term in the order except the optional rule); sitefit.js:263–268 (status only) | Observations: D1, D9, D15. |

### 1.14 §17 site rows

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| T01 | §17 Auto-layout ≤ 20 ms per option on a 15 ha site | IMPLEMENTED | BUILD-NOTES 591 (2.6 ms per distinct layout) | Build measurement; not re-measured. |
| T02 | §17 Site edit to all layouts and statuses ≤ 1.0 s (600 options) | PARTIAL | BUILD-NOTES 823 (not met; a site edit re-screens every option) | Recorded as not met. Full T1 run 9.4–11.8 s against the 3.0 s screening target (BUILD-NOTES 823). |
| T03 | §17 and §21 AC11: screen-reader walk-through (NVDA with Firefox, VoiceOver with Safari) | MISSING | BUILD-NOTES 827 (not done; axe, keyboard and live-region checks only) | Recorded as open point 8. |
| T04 | §17 Every plan and chart has a data-table alternative | IMPLEMENTED | components/SiteView.jsx:220 ("The plan as a table"); BUILD-NOTES 575 | — |

### 1.15 Carport

| ID | Brief row | Status | Evidence | Note |
|---|---|---|---|---|
| K01 | §6.2 Carport PV over the parking allowance, as a block (§10.3) | MISSING | sizing.js:278–281 (carport MWp from the allowance); no carport in blocks.js; no placement, clearance or height check | Not recorded in the site notes (core line 119 says only "area budget"): D7. |

## 2. Spatial defaults (§6.3) against the library

Each §6.3 default checked against the registry values in defaults.js (spatial library at lines 296–426, technology table at 205–290) and the record table (BUILD-NOTES 607–720). Result words: matches, differs, not built, not in registry, literal (a value set in code with no record).

| ID | Block | §6.3 default | Library value (file:line) | Result |
|---|---|---|---|---|
| B01 | Data hall | GFA ÷ storeys; storeys × 6 m plus roof zone; boundary setback | 2 storeys, 6 m (BUILD-NOTES 795); 6 m clearance to other blocks (defaults.js:310, judgement) | matches; the 6 m clearance is judgement, not §6.3 |
| B02 | Substation 11–33 kV | 500 m² per 20 MVA (300–800); 6 m; 5 m | defaults.js:284 (500; 300–800), 317 (6 m), 318 (5 m) | matches; the 0.9 power factor is a literal (D4) |
| B03 | Substation 110–150 kV | AIS 1.2 ha (0.8–2.0), GIS 0.4 ha (0.25–0.6); 12 m and 15 m; 10 m; POC within 50 m | defaults.js:284 (1.2; 0.4), 320–321 (12 m; 15 m), 324 (10 m), 326 (50 m) | matches |
| B04 | Substation 220–400 kV | AIS 4.0 ha, GIS 1.2 ha; 15 m and 18 m; 10 m | defaults.js:284 (4.0; 1.2), 322–323 (15 m; 18 m), 324 (10 m) | matches |
| B05 | Diesel/HVO genset unit | 100 m² per unit (70–140); 7 m; stack 10 m; 3 m between units; within 30 m of building | defaults.js:262, 266 (100 m²; stack 10 m), 332 (7 m), 335 (3 m), 337 (30 m) | matches |
| B06 | Double-deck gensets | halves footprint per unit; 12 m | blocks.js:154 (positions halved); sizing.js:238 (0.5 literal); defaults.js:333 (12 m); defaults.js:334 (0.5 record, read nowhere) | differs: record not wired (D5) |
| B07 | Bulk fuel storage | 0.15 m² per m³ (0.10–0.25); 7 m; 6 m to building; 10 m to boundary | defaults.js:275 (0.15; 0.10–0.25), 342 (7 m), 345 (6 m), 347 (10 m) | matches |
| B08 | Diesel use for autonomy sizing | 0.26 L/kWh (0.24–0.28) | defaults.js:275 | matches (core sizing) |
| B09 | BESS, containerised | 50 m² per MWh (30–90); 3.5 m; 10 m to occupied buildings; 3 m between units unless test data supports less | defaults.js:223 (50), 353 (3.5 m), 356 (10 m), 354 (3 m); 355 and 357 (relaxed minima 1.5 m and 3 m) | differs: relaxed minima (D3) |
| B10 | Gas reciprocating engine plant | 200 m² per MWe (120–300); 12 m hall; stack 25 m; 15 m to boundary | defaults.js:227 (200; 120–300), 362 (12 m), 366 (15 m); stack 25 m is on the CHP entry (defaults.js:236) | matches |
| B11 | Gas turbine plant | 120 m² per MWe (80–200); 15 m; stack 30 m; 15 m to boundary | defaults.js:231 (120; 80–200), 372 (15 m), 375 (15 m); stack height not read | matches; stack 30 m not confirmed |
| B12 | CHP addition | +40 % on engine footprint; 12 m | defaults.js:236 (280 m² per MWe = recip plus 40 %); 362 (12 m) | matches |
| B13 | SOFC fuel cells | 120 m² per MW (60–200); 4 m; 5 m | defaults.js:242 (120; 60–200), 381 (4 m), 382 (5 m) | matches |
| B14 | Hydrogen storage and gensets | 300 m² per MW plus storage; 25 m separation; 6 m; flag always | defaults.js:257 (300), 386–389 (25 m, never relaxed; 6 m); sitefit.js:237 (flag) | matches |
| B15 | Ground-mount solar PV | 1.2 ha per MWp (0.8–1.8); 3 m; 5 m | defaults.js:207 (1.2; 0.8–1.8), 401 (3 m), 402 (5 m) | matches |
| B16 | Rooftop solar PV | 5.5 m² per kWp (4.5–7.0); 50 % usable; +1 m; 1.5 m edge setback | defaults.js:210 (5.5; 50 %), 406 (+1 m), 407 (1.5 m) | matches |
| B17 | Wind onshore | 0.1 ha pad; tip 180 m; topple 1.5 × tip; noise buffer 500 m | defaults.js:410 (1000 m²), 218 (tip 180 m; topple 1.5), 411 (500 m) | matches; buffers flag-only (BUILD-NOTES 586) |
| B18 | Heat rejection, ground | 60 m² per MW rejected (40–100); 4 m; 3 m | defaults.js:287 (60; 40–100), 395 (4 m), 396 (3 m) | matches |
| B19 | Heat reuse plant | 30 m² per MWth (20–50); 6 m | none | not in registry; not built (BUILD-NOTES 815): D16 |
| B20 | Small modular reactor | 3 ha per ~300 MWe (1 ha per 100 MWe); 40 m; emergency zone flagged | defaults.js:415 (1 ha per 100 MWe), 416 (40 m); sitefit.js:240 (site-smr flag) | matches; 10 m clearance is a literal (blocks.js:193): D6 |

## 3. Deviations and verdicts

In BUILD-NOTES: Yes (recorded in full), Partly (recorded in part), No (not recorded). Numbers in that column are lines of /home/claude/build/app/BUILD-NOTES.md; file:line references in the other columns are code.

| ID | Where (code) | Brief | Verdict | In BUILD-NOTES | Effect |
|---|---|---|---|---|---|
| D1 | layout.js:37–43, 146–150; sitefit.js:224, 230 | §10.4 steps 3–4 (placement tests height zones; an unplaceable block gives "Does not fit"); §2 principle 5; §15 "height limit exceeded"; AC7 | AMBIGUOUS | Yes (judgement 11; lines 595, 795) | Height is tested only at L0 and L1. Over-height blocks are placed and flagged, so a height failure alone never gives "Does not fit". AC7 needs this: a 16 m hall cannot meet T2's 15 m limit, so a hard test leaves no option "fit with flags". |
| D2 | layout.js:142–143, 395; site.js:126; sitefit.js:226, 232 | §5.2 soft exclusions usable by solar only (configurable); §10.4 step 2.8; §15 "block in soft exclusion" | CONFLICTS | Partly (lines 585–586: "L4 also soft exclusions"; the solar exception in step 4 is not built for fixed solar) | At L4 every block may use soft cells. Below L4 no block may, fixed solar included. Only the fill path follows softUsableBySolar. sitefit.js:232 says "allowed for solar only", which L4 contradicts. |
| D3 | defaults.js:354–357 | §6.3 BESS: 3 m between units "unless test data supports less"; 10 m to occupied buildings | CONFLICTS | No. Lines 634 and 638 call the minima judgement; the §6.3 test-data condition is not mentioned | Relaxed placement reaches 1.5 m between units and 3 m to occupied buildings with no test data. The record notes (defaults.js:355, 357) say that needs test data or a fire-rated barrier. |
| D4 | sizing.js:235; blocks.js:136 | §6.3 "500 m² per 20 MVA"; §18 and §23: every default has a record and a label | CONFLICTS | No | The 0.9 power factor is a literal (fullMW / 0.9 / 20). No record and no label. |
| D5 | sizing.js:238; blocks.js:154; defaults.js:334 | §6.3 double-deck halves the footprint per unit; §18: the record drives the value | CONFLICTS | No (line 669 lists the record as if it drives the footprint) | Sizing uses a literal 0.5; layout halves unit positions. The record (defaults.js:334) is read nowhere, so editing it changes nothing. |
| D6 | blocks.js:193 | §6.3 gives no SMR clearance; §18 requires records | CONFLICTS | No | SMR clearance 10 m (minimum 10 m, not relaxable) and length:width 1.5 are literals. |
| D7 | sizing.js:278–281; no carport in blocks.js | §10.3 each technology instance becomes blocks; §6.2 carport over the parking allowance | CONFLICTS | No (core line 119 covers the area budget only) | Carport PV is in the area budget (sizing.js:291) but not on the plan. No placement, clearance or height check (K01). |
| D8 | sizing.js:268; blocks.js:233–235 | §5.3 roof plant fraction: derive from the heat-rejection footprint where larger | CONFLICTS | No | Sizing takes 40 % of the roof; layout takes the larger of 40 % and the footprint. They disagree when the footprint exceeds 40 % of the roof. Not tested here. |
| D9 | scoring.js:99–107; pareto.js:163, 239; InputsPanel.jsx:141 | §11: "Does not meet" or "Does not fit" are not demoted automatically; toggle "Rank requirement-compliant options first"; §5.7 calls site fit a requirement check | CONFLICTS | No (test 8g, line 860, names the toggle only) | The toggle demotes resilience "Does not meet" only. See section 3.1. |
| D10 | site.js:141–145; site.poc record (BUILD-NOTES line 629) | §5.2 default: nearest boundary point to the map's nearest road | CONFLICTS (unavoidable offline) | Yes (judgement 6; line 790) | Stand-in: the access point. No road data offline, so the brief's default cannot be computed here. |
| D11 | evaluate.js:96; defaults.js:283 | §5.2 POC drives cable-route length for cost | CONFLICTS | No | Cable length is the fixed 1.0 km record (cableKm). It is not derived from the POC. |
| D12 | evaluate.js:96–108 | §5.2 gas main drives connection cost | CONFLICTS (missing) | No | No gas connection capex line. |
| D13 | site.js:239–241 | §5.2 access point drives the roads allowance | CONFLICTS | No | The allowance is a fixed fraction of the envelope. |
| D14 | site.js:239–241; defaults.js:547 | §5.2 15 % of net developable area; net is defined after the allowance (circular) | AMBIGUOUS | Yes (judgement 5; lines 603–604, 789) | The code takes 15 % of the envelope. 15 % of the net would be 13.0 % of the envelope. Held as a budget, not a located area, which matches "reserved and not available for plant". |
| D15 | sizing.js:218–219, 283–286, 372–383; run.js:148; layout.js:392–396 | §9.2 fill residual = residual net area after all other blocks are placed ("iterated with layout"); §10.4: computed after placement; no other sizing depends on layout | CONFORMS | Yes (lines 589, 734, 768–769) | Single pass, as §10.4 describes. Observation for the owner: the budget counts placed blocks only (layout.js:392), so an option with an unplaced block gets fill on cells that block could have used. §9.2's "placed" supports this, but §2 principle 5 bars resizing an option after a breach. Not recorded. |
| D16 | blocks.js:24; no heat reuse block or record | §10.4 step 2.6; §6.3 default; §20 stage 2 "blocks and auto-layout" | CONFLICTS (build order) | Yes (line 815, filed under "stage 7") | Stage 2 content deferred. Recorded, but filed under the wrong stage. |
| D17 | not built (App.jsx:195) | §5.2 and §10.2 underlay; §20 stage 2 "2D plan" | CONFLICTS (build order) | Yes (line 813, under "stage 7") | Filed under the wrong stage. |
| D18 | not built | §20 stage 6 exports (PDF, Excel, JSON, GeoJSON) and §12.10 site export | CONFLICTS (build order) | Yes (line 816, under "stage 7") | Filed under the wrong stage. |
| D19 | not built | §5.3 building footprint override; §20 stage 2 "building massing" | CONFLICTS (build order) | Yes (line 814, under "stage 7") | Filed under the wrong stage. |
| D20 | defaults.js:518 (areaHa 15 in the example set); defaults.js:536 (boundary null) | §5.2 default "none"; status R (one of) | CONFLICTS (minor) | No | The app starts with a 15 ha example rectangle, so R is never unmet at start. |
| D21 | sizing.js:254; blocks.js:241–254 | §8 C11 "Fit as many as separations allow" | AMBIGUOUS | Partly (core line 120, "Wind count comes from spacing"; judgement 12 for the buffers) | The count is floor(net ha ÷ ha per turbine), set before layout. Topple and noise buffers are checked after placement and only flagged. Consistent with §2 principle 5. Not consistent with C11 if "separations" includes the buffers. |
| D22 | sitefit.js:21; defaults.js:424–426 | §10.6 "sound power and geometric spreading only" | CONFORMS | Yes (judgement 13; lines 599, 685) | The −8 dB is the hemispherical term for a ground-level source. No absorption or barrier term. Label present (sitefit.js:15). |
| D23 | sitefit.js:224, 230 | §15 stack above height limit, under Permitting | CONFLICTS (category) | Yes (open point 5, line 824) | The category differs. Recorded. |
| D24 | sitefit.js:191 | §15 flag fields: triggering value, threshold, link to input | CONFLICTS | No | Fields missing; values appear only in the message text. |
| D25 | generator.js:109–110 | none (source hygiene) | CONFORMS (output) | No | The C17 and C18 generator notes say site fit is not assessed. run.js:268 and 353 overwrite them (withSiteFitNotes, run.js:366–376) when scoring runs, so the UI shows the right text. The stale text should be removed. |
| D26 | defaults.js (clearanceMinM and other minima) | §10.4 step 5: relaxation to a "minimum" value (no values given) | CONFORMS | Yes (judgement 12; line 796) | The structure matches step 5. The values are judgement and labelled as such. |
| D27 | components/site/SiteEditor.jsx:166 | §10.1 boundary polygon(s) | AMBIGUOUS | Partly (judgement 19: first polygon is the boundary) | A second boundary is ignored with a note. Multi-parcel sites are not supported. |
| D28 | spatial library (no UI page) | §23 and AC15: the label shown in the UI for every default | AMBIGUOUS | Yes (open point 7, line 826; Site tab note, line 722) | Spatial values have no UI. The Site tab note covers them as a group. |

Summary of the table: CONFORMS 4 (D15, D22, D25, D26); CONFLICTS 19; AMBIGUOUS 5 (D1, D14, D21, D27, D28). Recorded in full 12 (D1, D10, D14, D15, D16, D17, D18, D19, D22, D23, D26, D28); in part 3 (D2, D21, D27); not recorded 13 (D3, D4, D5, D6, D7, D8, D9, D11, D12, D13, D20, D24, D25).

### 3.1 The two verdicts that matter most

**Height rule (D1): AMBIGUOUS, recorded as judgement 11.**
- For soft height: §15 lists "height limit exceeded" as a site-fit flag, which needs over-height placement to occur. §2 principle 5 treats height as a flagged constraint, not an enforced one. AC7 needs options that "fit or fit with flags" on T2, whose defaults give 16 m halls against a 15 m limit (BUILD-NOTES 795). Under a hard test, no hall could be placed and no option would fit.
- For hard height: §10.4 step 3 says placement tests height zones, and step 4 says a block that cannot be placed makes the option "Does not fit".
- The code takes the soft reading and records it. The brief should say which reading is meant. The code's behaviour is consistent with AC7 and §15; the risk is only that §10.4 step 3 reads as a hard test.

**Compliant-first ranking (D9): CONFLICTS with §11. Not recorded.**
- §11 says options with "Does not meet" or "Does not fit" are not demoted automatically, and that the user can turn on "Rank requirement-compliant options first". §5.7 calls site fit a requirement check. §2 principle 5 names this toggle as the only setting that changes rank order without changing scores.
- scoring.js:99–107 demotes only resilience "Does not meet" when the toggle is on. pareto.js:163 and 239 use the same rule.
- The toggle is off by default (defaults.js:650), so no default output changes. The omission still departs from §11's wording.

## 4. Decisions needed from the owner

1. D1, height: state in §10.4 step 3 that height is soft, or make an unplaceable over-height block "Does not fit". The code and AC7 support soft.
2. D9, compliant-first: include site fit in the toggle (scoring.js:99–107), or narrow §11 to resilience only.
3. D2, soft cells: restrict placement to solar (layout.js:142–143), or amend §5.2 and the L4 rule.
4. D3, BESS minima: remove the 1.5 m and 3 m minima, or allow them only with test data, as the record notes already say.
5. D4, D5, D6, D8, literals: move the 0.9 power factor, the 0.5 double-deck factor, the 10 m SMR clearance and the 40 % roof share into registry records, and read them.
6. D7, D11, D12, D13, missing features: carport block; cable length from the POC; gas connection cost; access-driven roads allowance. Or record them as deferred in BUILD-NOTES.
7. D21, wind count: define "separations" for C11, and say whether buffers reduce the count or only flag.
8. D15, fill budget: decide whether an unplaced block should reserve its area before fill is sized.

## 5. Label-rule counts

- Registry (§18): 489 records in total. The mechanical check run earlier in this verification found none failing the label, basis or confidence rules (label "indicative — unverified"; basis set; confidence C and verified false where no source was checked). That check was not re-run in this pass.
- Site group: 118 site, spatial and layout records. 112 are new (BUILD-NOTES 605: basis judgement 70, source 38, run setting 4; all labelled "indicative — unverified", confidence C, verified false). The other 6 are pre-existing records.
- Test 9b counts 117, because it excludes view.site.smallMultiples (BUILD-NOTES 720), which is one of the 112.
- The 112-row table (BUILD-NOTES 607–720) matches the registry, per the same mechanical check.
- Shown in the UI: the tag appears on site inputs at their defaults (components/Field.jsx:16 defines it; lines 42 and 115 show it at defaults), and the Site tab note says every spatial default is indicative (BUILD-NOTES 722). Spatial values have no UI of their own (D28).
- AC9 and AC15 tests were not re-run.

## 6. Scope check (§20)

- Stage 2 present: boundary drawing and import; exclusions; setbacks; height; building massing (data halls, no 2.5D); blocks and auto-layout; site-fit status and area budget; 2D plan; small multiples (top N only).
- Stage 2 gaps: underlay (R13), heat reuse blocks (R22b), building footprint override (S03), carport block (K01), pinned small multiples (R42).
- Stage 7 features built: none of manual layout editing, 2.5D massing or online tiles (BUILD-NOTES 811–813; App.jsx:195).
- Early stage 7 work: Site-tab keyboard, phone and axe checks (tests B14–B18, BUILD-NOTES 747), and performance work (batch layout, prefix sharing, caches) built to meet the §17 layout target. The performance work is within §17.
- Stage 7 items not done: the NVDA and VoiceOver walk-through (T03; BUILD-NOTES 827) and the site-edit timing target (T02).
- Misfiled deferrals: BUILD-NOTES 809 heads its list "stage 7", but underlay, heat reuse blocks and the building override belong to stage 2 (D16, D17, D19), and exports belong to stage 6 (D18). Pinned small multiples and undo or redo for site edits (§16) have no stage in §20.
- Built beyond the brief: typed "lat, lon" coordinates, keyboard crosshair drawing, and the import "use as" mapping (judgement 19; BUILD-NOTES 574). §5.2 lists draw, import and area only. The additions are harmless and recorded.
- Outside the site slice: §11 absolute scaling is a hook only (defaults.js:649, "Hook only in this slice"; App.jsx:14). That is a core-slice MISSING. It was not checked further.
- R, D and A: the brief's legend (line 7) defines them as input classes. §5.2 does not require them on screen, and none are shown. No row raised.
- Changes to core files (BUILD-NOTES 724–738): scoring.js (siteRank and markDominance, lines 65–97), evaluate.js (penalty gate, lines 528–529) and sizing.js (applySolarFill, lines 372–374) were checked against the notes; they match.

## 7. Not checked

- npm run build: excluded by instruction.
- npm test (31 tests) and npm run test:browser (18 tests): not re-run. Results cited are the ones BUILD-NOTES and SITE-PROGRESS record.
- Not traced: the Include-wind regeneration path; how the area bar, separation list and noise panel render (only the code that feeds them was read); the §17 timings (taken from BUILD-NOTES 591 and 823).
- Sibling reports in the same folder (H1-claims.md, H3-browser.md) were not read, so this report is independent of them.
- Label counts (section 5) come from the mechanical check run earlier in this verification, not from this pass.
