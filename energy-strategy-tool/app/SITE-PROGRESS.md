# Site slice progress (brief §20 stage 2): complete

Read this first if the build is resumed. Spec: `/home/claude/build/brief-v2/BRIEF.md` (§2, §5.2, §5.3, §6.3, §8 C11/C17/C18, §10, §11, §12.2, §15, §16, §17, §21 T1–T5, AC7, AC13, §23).
Rule: update this file at the end of every stage (the build has been stopped by the usage limit twice).

## Status: complete (2026-10-16)

- Baseline before this slice: `npm test` 22/22, `npm run test:browser` 13/13 (commit 60fe41a in /home/claude/dc-learning, energy-strategy-tool/app; read-only copy via `git archive` in the scratchpad `baseline60fe41a/`, nothing in the repository changed). Orchestrator checkpoint 87291e3 on feature/site-layout.
- **S1–S6 and Finish done.** `npm run build` exit 0; `npm test` **31/31** (T1 10.68 s, T3 11.08 s single thread); `npm run test:browser` **18/18** (B14–B18 new: phone tap drawing, keyboard plan/table/drawing, GeoJSON import, axe light and dark on the Site tab).
- T1 run time: 9.4–11.8 s with layout (layout stage 3.5 s), about 5.9 s without the layout stage; baseline engine 6.1–8.1 s on the same machine.
- AC7 on T2: all 11 archetypes "Does not fit" with named shortfalls; C17/C18 at defaults with "2,000 options do not fit" notes; including GIS + double-deck gives 2 options that fit with flags.
- BUILD-NOTES.md "Slice: Site (§10)" written: what was built, algorithm, all 112 new records, changes to scoring.js/sizing.js/evaluate.js with reasons, test changes, T1/T3 comparison with 60fe41a, palette validation, judgement calls, deferred items, open points, test output.

## Stages

| Stage | State | Files |
|---|---|---|
| S1 Geometry kernel | done | `src/engine/geometry.js` (new); `tests/site-tests.mjs` (new, 9a) |
| S2 Site model + T2/T4 fixtures | done | `src/engine/site.js` (new); `src/engine/defaults.js` (site inputs, `SPATIAL` library, `EXCLUSION_TYPES`, layout run settings, noise threshold, land-take ceiling, site-fit penalty values, `boundaryAreaHa`, `referenceT2`, `referenceT4`; `normalizeInputs` derives site.areaHa from a valid boundary); `src/engine/context.js` (ctx.site); 9b |
| S3 Blocks | done | `src/engine/blocks.js` (new: halls per phase, unit arrays with max units and max array area, substation, fuel, firm plant, BESS, heat rejection ground/roof, wind, off-site tray, solar fill; `blockSetKey`); 9c |
| S4 Auto-layout + run-log stage | done | `src/engine/layout.js` (new: priority order, occupancy masks with vertical free runs + integral image, relaxation levels L0–L4, land budget, solar fill, prefix-sharing batch `layoutManySteps`, failure memo); `src/engine/runlog.js` (stage `layout` after sizing, describeEvent); `src/engine/run.js` (layout stage, site warnings in the context stage, fill-residual solar before dispatch, site-fit flags, C17/C18 notes `withSiteFitNotes`, HOOKS.layout, ENGINE_VERSION 0.2.0-site); `src/engine/sizing.js` (site-model areas, `applySolarFill`); `src/engine/siteapi.js` (new, `layoutForOption`); `src/engine/index.js` (exports); `tests/run-tests.mjs` (6c stage list, texts, layout in per-option stages; runs 9a–9h); 9d, 9h |
| S5 Site-fit outputs + integration | done | Done: `src/engine/sitefit.js` (new: status, unplaced tray, relaxed rules, area budget parts, land take on/off site, residual, height per zone, separation checklist, noise proxy, roof use, expansion headroom, §15 flags, land-take ceiling flag); `src/engine/evaluate.js` (old area-budget flag removed; optional site-fit penalty in deliverability with `includesSiteFit`); `src/engine/scoring.js` (dominance includes site-fit status; view filters `siteFit`, `landTakeCeilingHa`; sorters landTake, siteFit); `src/engine/view.js` (chips for the two filters; site flags in FLAG_FILTERS); `src/engine/pareto.js` (points carry siteFit, landTakeHa); `ParetoChart.jsx` (shape = site fit), `ParetoView.jsx` (legend, notes), `ParetoTable.jsx` (site-fit column); `RankedList.jsx` (site-fit and land-take filters and columns, `SiteFitBadge`, `onShowSite`); `OptionDetail.jsx` (site-fit summary, deliverability label); `App.jsx` (Site tab, header site-fit counts, onShowSite, deliverability label with the penalty); `InputsPanel.jsx` (site settings, penalty toggle, land-take ceiling, noise threshold, raster settings); `RunSummary.jsx` (site layout section, C17/C18 notes); tests 9e (site-fit outputs, noise hand check), 9f (AC7 on T2), 9g (scores/ranks independent of site fit with the penalty off; penalty on), 8h (site-fit and land-take chips) |
| S6 Views + browser tests | done | `src/components/SiteView.jsx`, `src/components/site/{SitePlan,SiteFitPanel,SiteEditor,BlocksTable}.jsx` (new); `src/styles.css` (source colour tokens --src-*, plan and Site tab styles); `src/engine/defaults.js` (`view.site.smallMultiples`, viewRec briefRef); tests 8f (small multiples record), 9i (Site tab server render); `tests/browser-tests.mjs` B14–B17 (+ `BROWSER_ONLY` filter, `hasTouch` option) |
| Finish | done | palette validation, baseline comparison, BUILD-NOTES "Slice: Site (§10)", final runs |

## Decisions (all in BUILD-NOTES "Slice: Site (§10)", judgement calls)

1. Own geometry kernel instead of Turf/Clipper (offline single file, size); Greiner–Hormann with deterministic perturbation for degenerate cases.
2. Local equirectangular projection on WGS84 radii (M, N at the origin latitude); about the boundary centroid, or the project location for the area rectangle.
3. Offsets: mitre at convex vertices; arc at reflex vertices with equal setbacks (exact erosion); mitre at reflex vertices with unequal setbacks (conservative). The raster applies exact per-edge distances per cell.
4. Raster is conservative: a cell is buildable only if the whole square is inside the envelope and touches no hard exclusion. Height zones override the site limit up or down; a cell takes the lowest limit it touches (and the site limit unless wholly inside a zone).
5. Roads/parking/landscaping allowance = fraction × envelope; net developable = envelope − allowance; enforced as a land budget in placement (not a located area).
6. Default POC = default access point (no road data offline); default access = mid-point of the longest edge.
7. Exclusion type defaults: only flood zones soft.
8. T4 fixture: grid 8 MW now and at full connection (date = start), one 5 MW phase at month 12.
9. Building: one block per phase, halls above 25,000 m²; building clearance 6 m (fire access, judgement); anchor: first hall farthest from the POC, further halls next to placed halls.
10. Unit arrays: ≤ 12 units, 2 rows, ≤ 4,000 m² per array (engines/turbines get fewer units per array); double-deck = two units per position; in-building gensets add their area to the halls.
11. Height limit is soft in placement (prefer compliant cells; else place and flag): an over-height block makes "Fits with flags", never "Does not fit".
12. Relaxation levels L0–L4 with minimum values per rule (judgement); hydrogen 25 m never relaxed; wind topple/noise buffers flag-only.
13. Noise proxy: Lp = Lw − 20 log10 r − 8 (hemispherical, geometric spreading only); normal operation vs standby gensets reported separately; flag only at receptors; the noise flag is category Permitting (§15) but not counted in deliverability (site-derived; §5.7/§11 keep site fit out of the score by default).
14. SMR off site by default (1 ha per 100 MWe); off-site land shortfall and SMR are flagged ("Fits with flags").
15. Dominance includes site-fit status (§7.2 step 6).
16. Site-fit summary is compact in the run; the plan and §10.6 detail are recomputed on demand through HOOKS.layout (same code path; 9d checks equality).
17. Performance: batch layout with prefix sharing (1,324 distinct T1 layouts contain 26,929 placements but 3,149 distinct prefixes), failure memo, cost-bounded row/column search.
18. Site tab: the plan always shows the current site inputs; blocks only when the run matches them (site key), otherwise a notice. Layouts for the plan and thumbnails are recomputed on demand (cached by run and option); thumbnails are laid out one per tick after mount.
19. Typed coordinates: "lat, lon" per line with a decimal point; GeoJSON/KML import with a "use as" choice per feature (guessed from its name; first polygon = boundary); boundary holes become hard exclusions (type Other); an off-site polygon sets only the off-site area (not drawn).
20. A new boundary resets per-edge setbacks (edge count and order change).
21. Heat rejection draws in a neutral (infrastructure, not an energy source): removes the grid–heat-rejection blue/violet collapse that 1,340 of 2,000 T1 plans would show; hydrogen takes violet.
22. The Boundary section of the editor opens once (when the site is still the area rectangle) and is not collapsed by applying a boundary.
