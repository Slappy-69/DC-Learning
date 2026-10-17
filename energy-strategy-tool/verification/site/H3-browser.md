# H3 browser verification: energy-tool-single-file.html

Date: 2026-10-17. Target: `/home/claude/build/app/dist/energy-tool-single-file.html`, opened as a file:// URL. `npm run build` was not run, and no source, test or document file was changed.

Environment: Chromium 141.0.7390.37, Playwright 1.56.0, axe-core 4.10.2 (the scratch copy and the app's pinned devDependency are the same version), Node 22.22.0. Phone emulation is 375 x 812 with isMobile and hasTouch on, the same as the suite's phone context. Desktop is 1400 x 900, mouse only. The app suite ran first and alone, then my script ran. Another verifier was running Node tests on the same CPU, so timings are indicative only.

Scratch folder: `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/s3/` (verify-site.mjs, overflow-probe.mjs, results.json, verify-site.log, browser-suite.txt, flood-test.geojson).

## Result

- App browser suite: **18 of 18 PASS**, exit 0, no SKIP. No check failed, so no re-run was needed. B9 passes but does not assert its timing target (F2).
- Own checks: everything ran to completion. Phone light and dark pass the overflow check. Desktop light and dark **FAIL** the overflow check (F1). Block counts match. Drawing, import, keyboard and focus pass. Axe finds zero violations in all four states.
- Console errors and page errors: none, in my runs or the suite.
- No item is NOT CHECKED.

## Checks

| ID | Check | Viewport / theme | Status | Evidence |
|---|---|---|---|---|
| B1 | Tab order from top, no skip link: stops before results and chart, none hidden | 1400 / light | PASS | 184 presses to results, 207 to tab list, 213 to chart; 179 stops in inputs panel; all visible |
| B2 | Skip links are first two Tab stops and reach their targets | 1400 / light | PASS | Chart: 2 Tab + Enter; results: 1 Tab + Enter |
| B3 | Keyboard on the chart (arrows, Home/End, P, Enter, Escape) | 1400 / light | PASS | All keys behave as specified |
| B4 | Canvas path above threshold: pixels, no SVG markers, pointer hit-test | 1400 / light | PASS | 2000 points, Canvas 942 x 460, 0 SVG markers |
| B5 | SVG path at or below threshold | 1400 / light | PASS | 53 SVG markers, no Canvas |
| B6 | Table paging: every option reachable, rank order | 1400 / light | PASS | 2000 rows, 50 per page, 40 pages, ranks 1 to 2000 |
| B7 | axe, light, Trade-offs table, chart, Options: no serious or critical | 1400 / light | PASS | 0 violations; color-contrast needs review |
| B8 | Removable filter chips; focus stays in chip row | 1400 / light | PASS | Remove by keyboard keeps focus on next chip |
| B9 | Weight preset moves pick without a re-run (target 100 ms) | 1400 / light | PASS (caveat) | Pick changed in 166 ms. The check asserts only the change, leader match and no re-run; the 100 ms target is not asserted (F2) |
| B10 | No console or page errors on main page | 1400 / light | PASS | 0 errors |
| B11 | axe, dark, Trade-offs and Options: no serious or critical | 1400 / dark | PASS | 0 violations |
| B12 | Tablet 1000 px: closed inputs panel takes no Tab stop | 1000 / light | PASS | 0 of 40 Tab stops in panel when closed |
| B13 | Phone: Trade-offs chart and table, no horizontal scroll | 375 / light | PASS | 375 / 375 chart and table |
| B14 | Phone Site tab, all sections open, no horizontal scroll; tap-drawn boundary re-screens | 375 touch / light | PASS | 375 / 375; 4 taps + Finish gave a 4-edge boundary of 9.25 ha; options re-screened |
| B15 | Keyboard on Site tab: plan reached, arrows show dimensions, table alternative, keyboard drawing | 1400 / light | PASS | 11 Tab presses from Site tab to plan; ArrowRight focuses "Data hall 1 of 4 (phase 1)"; keyboard triangle 0.72 ha |
| B16 | GeoJSON import: "use as" guessed per feature; applying sets boundary, exclusion, POC, receptor | 1400 / light | PASS | 4 of 4 applied; run re-screened (gross 19.13 ha) |
| B17 | axe, light, Site tab states (leader, non-fit option, drawing mode): no serious or critical | 1400 / light | PASS | 0 violations in each state; color-contrast needs review (782, 795, 796 nodes) |
| B18 | axe, dark, same Site tab states: no serious or critical | 1400 / dark | PASS | 0 violations in each state; color-contrast needs review (782, 795, 796 nodes) |
| 2a | Load and run completes; console and page errors | 375 touch / light | PASS | Run done in 12 s ("Last run 12 s on 1 worker"); 0 console, 0 page errors |
| 2a | Same | 1400 / light | PASS | 11.8 s; 0 console, 0 page errors |
| 2a | Same | 375 touch / dark | PASS | 11.9 s; 0 console, 0 page errors |
| 2a | Same | 1400 / dark | PASS | 12.6 s; 0 console, 0 page errors |
| 2b | Site tab found by accessible name, selected, screenshot taken | all four | PASS | aria-selected true in all four; screenshots in section 5 |
| 2c | scrollWidth vs clientWidth, default sections (PASS if not wider) | 375 touch / light | PASS | 375 / 375 |
| 2c | Same | 375 touch / dark | PASS | 375 / 375 |
| 2c | Same | 1400 / light | **FAIL** | 1514 / 1400, 114 px wider (F1) |
| 2c | Same | 1400 / dark | **FAIL** | 1514 / 1400, 114 px wider (F1) |
| 2c | All sections open | 375 touch, light and dark | PASS | 375 / 375 both |
| 2c | All sections open | 1400, light and dark | **FAIL** | 1514 / 1400 both (F1) |
| 2d | Blocks drawn in plan vs rows in blocks table | all four | PASS (match) | Plan: 12 blocks. Table: 14 rows = 12 placed blocks + 1 Ground PV row + 1 roof row; 0 not placed, 0 off-site. Identical in all four |
| 2d | Small-multiple plans shown, and how many | all four | 6 shown | Six thumbnails at one scale, each with blocks 12, 12, 10, 11, 10, 12 (ranks 1 to 6) |
| 2e | Site-fit status and area budget, selected option | all four | recorded | "Site fit: ✓ Fits" for #1 Grid · Diesel N+1 · DLC · PV 7.7 MWp · PPA hybrid 100 %. "Area budget: 11.44 ha of 11.44 ha net developable (100 %)". On site 11.44 ha; off site none; shortfall 0 m²; residual net 4 m² (ground PV holds 62,900 m²); expansion headroom 159.2 MW IT (estimate) |
| 3a | Draw a ~4 ha boundary by four mouse clicks on the plan, Finish; run re-computes; site area changes | 1400 / light | PASS | Corners are 200 m apart (from the scale bar). Banner "4 so far". Finish: "Drawn polygon: 4 edges, 3.96 ha". Site area 15.00 to 3.96 ha; run summary "Boundary: drawn polygon (4 edges)". Placed blocks 12 to 7; net developable 11.44 to 2.72 ha; site fit across 2000 options 963 / 23 / 1014 to 0 / 0 / 2000 (F3, F4) |
| 3b | Import a small GeoJSON polygon through the file input; accepted | 1400 / light | PASS | flood-test.geojson: 1 feature "Flood zone (test)", 0.16 ha, offered as "Exclusion: Flood zone (soft by default)". Apply: "Applied 1 of 1 features from flood-test.geojson." Run re-computed: "Exclusions 1 (0 hard)"; placed 7 to 6 |
| 4a | Keyboard route A: Tab only from top, no skip link, to Site tab and plan | 1400 / light | PASS | 207 Tab presses to the Options tab (2 are skip links, so 205 otherwise); 179 in the inputs panel; 0 invisible stops. ArrowRight x2 gives the Site tab, focus visible. 11 Tab presses from Site tab to plan (select, 9 layer boxes, plan). Total to plan: 218 Tab presses (207 + 11) |
| 4b | Keyboard route B: "Skip to results" first | 1400 / light | PASS | 1 Tab + Enter lands on #results; 24 Tab presses to Options tab; ArrowRight x2; 11 Tab presses to plan. Total 36 Tab presses |
| 4c | Focusing a block shows its dimensions | 1400 / light | PASS | ArrowRight on plan focuses "Data hall 1 of 4 (phase 1)". Dimension labels "101.6 m" and "67.7 m" visible (opacity 1). Tooltip shows 101.6 x 67.7 m, 6,875 m². Live text matches; matching table row highlighted |
| 4d | Focus is visible (Site tab and plan) | 1400 / light | PASS | :focus-visible matches on tab and plan; computed outline solid 3 px rgb(180, 86, 10) |
| 5a | axe, Site tab, light, tags wcag2a, wcag2aa, wcag21aa, wcag22aa | 1400 / light | PASS | 0 violations in default and all-open states; 35 rules passed (section 4) |
| 5b | axe, Site tab, dark, same tags | 1400 / dark | PASS | 0 violations in default and all-open states; 35 rules passed (section 4) |

## Findings

**F1. FAIL: desktop Site tab scrolls sideways (light and dark).** At 1400 px the document is 1514 px wide, so the page scrolls horizontally by 114 px. This holds in the default and all-sections-open states, and the Options tab is 1400 / 1400. The cause, measured in `overflow-probe.mjs`, is the "Option shown" select in `.site-head`. It lists all 2000 options, and the longest label is 184 characters, so the select is 1085 px wide inside a 942 px header. The label (a block element) runs from x=429 to x=1514. The rule `.site-head select { max-width: 100% }` does not stop this, because the label is sized by its content. Phones pass only because of the rule at `styles.css` lines 455 to 460 (`@media (max-width: 767px)`, `.site-head select { width: 100% }`). The suite does not catch this: B14 checks phone width only. Suggested direction, not applied: bound the select or label width at desktop widths, or truncate the option text.

**F2. B9 does not enforce its timing target.** The check is titled "§17 target ≤ 100 ms", but its code (`tests/browser-tests.mjs`, B9) asserts only that the pick changes, that the header leader matches it, and that no re-run starts. The 100 ms figure is printed, not asserted. This run measured 166 ms, and the check still passed. It did not fail, so I did not re-run it. It was one sample on a shared CPU, so the 100 ms target is not shown to be met or missed. Suggested direction, not applied: assert `ms <= 100`, or drop the target from the title.

**F3. Observation: two "leader" notions disagree in the status text.** After the 4 ha boundary, the status line said "Options updated. Leader unchanged." At the same time the Site tab's #1 option changed from "PV 7.7 MWp · Fits" to "PV 2.7 MWp · Does not fit". This is consistent with the code as written: `App.jsx:71` compares the weighted pick, while the Site tab's default option is the lowest `rank` (`SiteView`). It is not a failure, but a reader may take the two as the same option.

**F4. Observation: the drawn boundary is 3.96 ha, not 4.00 ha.** Plan clicks snap to screen pixels (about 1 m per pixel at this scale), so the four corners are about 199 m apart. That meets "about 4 ha".

**F5. Observation: all options become "Does not fit" on the 4 ha site.** Net developable area is 2.72 ha against 5.45 ha needed (200 %), so no option fits. The status is working as specified; recorded for completeness.

## Axe (desktop, Site tab, axe-core 4.10.2; tags wcag2a, wcag2aa, wcag21aa, wcag22aa)

| State | Violations by impact | Passes | Needs review (not violations) |
|---|---|---|---|
| Light, default sections | none (0 rules, 0 nodes) | 35 | color-contrast, 782 nodes |
| Light, all sections open | none (0 rules, 0 nodes) | 35 | color-contrast, 782 nodes |
| Dark, default sections | none (0 rules, 0 nodes) | 35 | color-contrast, 782 nodes |
| Dark, all sections open | none (0 rules, 0 nodes) | 35 | color-contrast, 782 nodes |

**Serious or critical violations: none in any state**, so there is no id, help or target list to report. color-contrast is "needs review" because axe cannot compute it on these nodes. The suite's B17 and B18 checked computed styles directly: 774 text nodes, lowest 4.86:1 in light and 5:1 in dark, none below the minimum.

## Screenshots

All in `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/s3/`:

- `site-phone.png`: phone 375, light, Site tab, default sections (required)
- `site-desktop.png`: desktop 1400, light, Site tab, default sections (required). The full-page capture is 1514 px wide because of F1.
- `site-phone-dark.png` and `site-desktop-dark.png`: dark counterparts
- `site-phone-allopen.png`, `site-desktop-allopen.png`, `site-phone-dark-allopen.png`, `site-desktop-dark-allopen.png`: all sections open
- `site-desktop-drawn.png`: after the 4 ha drawn boundary
- `site-desktop-drawn-imported.png`: after the GeoJSON import
- `keyboard-focus-plan.png`: plan with the first block focused by keyboard

## Limits

- Nothing could not be run. All four combinations, drawing, import, both keyboard routes and four axe states ran to completion.
- Drawing and import used mouse clicks and a file input. Touch drawing is covered by suite B14.
- The focus ring's contrast was not measured. I checked only that the 3 px outline is present and visible.
- Load and run times (11.8 to 12.6 s) were measured on a shared CPU.
