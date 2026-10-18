# Site slice review progress (Opus review of H1, H2, H3 + orchestrator O1–O5)

Read this first if resumed. Task: judge every finding in /home/claude/build/verification/site/{H1-claims,H2-brief,H3-browser}.md and O1–O5, fix what is valid, record every judgement call. Final report: /home/claude/build/verification/site/OPUS-review.md.
Backups of every changed file (original before first edit): /tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/site-review-backup/original/
Rules: spec BRIEF.md is read-only; no git; do not change dispatch.js or generator logic; keep existing tests passing (say why if one changes); build + npm test must pass at the end of each group.

## Status: complete (2026-10-17)

Final runs: `npm run build` exit 0; `npm test` 32/32; `npm run test:browser` 21/21 (outputs in scratchpad/review/final-*.txt and in OPUS-review.md section 6). Decisions: 75 findings, 40 accepted, 12 rejected, 23 deferred.

| Group | State | Files touched | Tests after |
|---|---|---|---|
| 0 Read reports, brief, notes | done | — | — |
| 1 Records/literals + compliant-first | done | engine/defaults.js (3 records: spatial.substation.mvPowerFactor, spatial.smr.lw, spatial.smr.clearanceM; notes of doubleDeckFootprintFactor and site.softUsableBySolar), engine/sizing.js (power factor, double-deck factor, roof plant = max(fraction, footprint)), engine/blocks.js (same three + SMR records), engine/sitefit.js (BESS relaxed text, soft-solar text), engine/generator.js (C17/C18 note text), engine/scoring.js (isRequirementCompliant: compliant-first includes "Does not fit"), engine/pareto.js (topScoreSiteFit/topScoreFailing), components/ParetoView.jsx, components/RunSummary.jsx (siteFitEffect), App.jsx (header site-fit wording), components/site/BlocksTable.jsx (BESS text); tests/run-tests.mjs (8g), tests/site-tests.mjs (9c) | build OK; npm test 31/31; T1/T2/T3/T4 bit-identical numbers (only flag and sentence texts changed) |
| 2 Economics (I07b, I08b) + deferrals | done | engine/site.js (routes: POC and gas main to the buildable envelope, rounded 0.1 m; siteSummary routes), engine/defaults.js (removed tech.substation.cableKm; new tech.gasConnection.pipePerKm €0.8 m/km), engine/sizing.js (sz.grid.cableKm, sz.gasConnection, sentences), engine/evaluate.js (cable from route; "Gas connection pipe" capex line), engine/run.js (toTransferable keeps cableKm), engine/blocks.js (carport note), components/site/BlocksTable.jsx (route row, block notes), components/RunSummary.jsx (route line, wording), App.jsx (header wording); tests/site-tests.mjs (9g extended, new 9j, constrainedT1 fixture fix) | build OK; npm test 32/32. T1 leader unchanged 85.9634 → 85.9642, top 20 same order, 141 rank changes (max 2); T3 no numeric change; T2 142 (max 2); T4 617 (max 11), leader unchanged |
| 3 UI (O1, O3, O4, O5, F3) + browser checks | done | App.jsx (useMediaQuery, "Run details" fold on phones, skip to site plan, leader re-sized message, header wording), components/SiteView.jsx (focusPlan, select class/title), components/InputsPanel.jsx (compliant-first hint), styles.css (selector width, run-details, disclosure markers), engine/defaults.js (two record notes); tests/browser-tests.mjs (B9 bound; new B19, B20, B21), tests/run-tests.mjs (test 7 reports build vs source time) | build OK; npm test 32/32; browser 21/21 |
| 4 Docs | done | BUILD-NOTES.md (site slice text, records, deviations table, deferred by stage, open points 3/5/10–12, Brief issues 18–21, "Review: Site slice" + test run), verification/site/OPUS-review.md, SITE-PROGRESS.md, this file | — |

Snapshots: scratchpad/review/snaps (orig-*.json = original engine; g1-* after group 1; g2-* after group 2). Scripts: scratchpad/review/snap.mjs, cmp.mjs, probe-phone.mjs, shots.mjs.

## Next step
None. Open items for the owner are listed in OPUS-review.md section 7 and BUILD-NOTES "Review: Site slice" (T3 cost axis, §17 timings on the reference machine, screen-reader walk-through, stage 2 gaps, route-cost judgement values).
