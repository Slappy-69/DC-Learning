# Site slice progress (brief §20 stage 2)

Read this first if the build is resumed. Spec: `/home/claude/build/brief-v2/BRIEF.md` (§2, §5.2, §5.3, §6.3, §8 C11/C17/C18, §10, §11, §12.2, §15, §16, §17, §21 T1–T5, AC7, AC13, §23).

## Status

- Baseline before this slice (2026-10-16): `npm test` 22/22 (T1 run 10.03 s single thread, suite 65 s), `npm run test:browser` 13/13.
- **S1 and S2 done** (build OK, `npm test` 24/24: the 22 existing + 9a geometry + 9b site model).
- **Next: S3 blocks (`src/engine/blocks.js`): building massing per phase/hall, unit arrays, rooftop blocks, off-site tray.**

## Stages

| Stage | State | Files |
|---|---|---|
| S1 Geometry kernel | done | `src/engine/geometry.js` (new), `tests/site-tests.mjs` (new, test 9a) |
| S2 Site model + T2/T4 fixtures | done | `src/engine/site.js` (new), `src/engine/defaults.js` (site inputs, spatial library `SPATIAL`, `EXCLUSION_TYPES`, layout run settings, noise threshold, land-take ceiling, site-fit penalty values, `boundaryAreaHa`, `referenceT2`, `referenceT4`, `normalizeInputs` derives site.areaHa from a valid boundary), `tests/site-tests.mjs` (test 9b), `tests/run-tests.mjs` (imports and runs 9a, 9b) |
| S3 Blocks | not started | |
| S4 Auto-layout + run-log stage | not started | |
| S5 Site-fit outputs + integration | not started | |
| S6 Views + browser tests | not started | |
| Finish (BUILD-NOTES, final runs) | not started | |

## Decisions so far (to go into BUILD-NOTES "Slice: Site")

1. Own geometry kernel instead of Turf/Clipper (offline single file, size); Greiner–Hormann with deterministic perturbation for degenerate cases.
2. Local equirectangular projection on WGS84 radii (M, N at the origin latitude); about the boundary centroid, or the project location for the area rectangle.
3. Offsets: mitre at convex vertices; arc at reflex vertices with equal setbacks (exact erosion); mitre at reflex vertices with unequal setbacks (conservative). The raster applies exact per-edge distances per cell and does not depend on the polygon.
4. Raster is conservative: a cell is buildable only if the whole square is inside the envelope and touches no hard exclusion.
5. Roads/parking/landscaping allowance = fraction × envelope; net developable = envelope − allowance (brief wording circular; same as the core slice).
6. Default POC = default access point (no road data offline); default access = mid-point of the longest edge.
7. Exclusion type defaults: only flood zones soft.
8. T4 fixture: grid 8 MW now and at full connection (date = start), one 5 MW phase at month 12 (the brief gives neither).
9. New defaults (all §18 records, "indicative — unverified"): 116 site/spatial/layout records (judgement 75, source 38, run setting 3).
