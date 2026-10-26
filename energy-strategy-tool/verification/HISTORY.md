# Verification history

Rule set by the owner on 2026-10-15: after every three Haiku checks, one Opus review.
Builder and reviewer: Claude Opus 5.5. Verifier: Claude Haiku 5.5.
Detailed reports from 2026-10-16 onwards are in the per-slice folders next to this file.

## Brief v2 (2026-10-15)

| Step | Model | Result |
|---|---|---|
| Draft | Opus | BRIEF.md, CHANGELOG.md, ASSUMPTIONS.md, OPEN-QUESTIONS.md for a concept-stage optioneering tool |
| Haiku check 1 | Haiku | FAIL: 39 findings (1 high, 20 medium, 18 low). High: the dominance filter hid options automatically, against the brief's own "nothing hidden" principle |
| Revision 2 | Opus | All 39 addressed; nothing hidden or excluded automatically; "recommendation" renamed "plain-English summary" |
| Haiku check 2 | Haiku | FAIL: 22 findings (1 high, 9 medium, 12 low). High: grid import capped by default, read as enforcing a constraint |
| Revision 3 | Opus | All 22 addressed; default grid mode renamed "Show unmet load"; run summary panel added |
| Haiku check 3 | Haiku | FAIL: 17 findings (0 high, 8 medium, 9 low) |
| Opus review (Revision 4) | Opus | 16 accepted, 1 rejected (F-08, years left to the builder by design). Found 8 problems all three checks missed (R4-1 to R4-8), fixed. Brief judged ready for a builder. Open question 18 raised |

## Core slice (2026-10-15, commit b5e4a98)

| Step | Model | Result |
|---|---|---|
| Build | Opus | Inputs, 8760-hour dispatch, option generator, scoring, ranked list. 7/8 tests; test 3 failing |

## Trackable run log and fixes (2026-10-15, commits 38cf521 and 62fff78)

| Step | Model | Result |
|---|---|---|
| Build | Opus | 12-stage run log with JSON/CSV export and progress panel. Test 3 root cause: its sample contained no option that fails resilience. Separate defect fixed: C5 = None named no failing item. 13/13 |
| Haiku check A | Haiku | 13/13; 8 of 8 claims verified; 2 caveats (root-cause wording in BUILD-NOTES; generator.js comment on the sampling cap) |
| Haiku check B | Haiku | FAIL: the single-file build still loaded worker.js at runtime, so it could stall on a phone |
| Fix | Opus | Worker inlined as a Blob URL; asynchronous worker failures fall back to the main thread; both caveats fixed. 14/14 |
| Haiku check C | Haiku | 14/14; inlined worker byte-identical to dist/worker.js; BUILD-NOTES test block verified |
| Opus review | Opus | 11 calls accepted, 0 rejected. Added a watchdog for silent or unstartable workers. Corrected the combination count (57,024 valid + 4 archetypes = 57,028). Recorded two decisions for the owner. 14/14 |

## Pareto trade-off view (2026-10-15, commit 484a042)

| Step | Model | Result |
|---|---|---|
| Build | Opus | Trade-offs tab: frontier, weighted pick, dominance marking, table alternative, keyboard access. 18/18 |
| Haiku check 1 (claims, non-regression) | Haiku | 18/18 tests; 12 of 12 claims verified; engine files unchanged by the slice. Noted: registry view settings not read by the code (hard-coded) |
| Haiku check 2 (brief §12.2) | Haiku | 45 requirements: 19 implemented, 15 partial, 10 deferred, 1 missing (land-take filter); 10 unrecorded deviations incl. a possible infinite-cost dominance bug; AC5 ambiguous |
| Haiku check 3 (browser, accessibility) | Haiku | FAIL: axe colour-contrast (27 nodes, run-progress log); chart reached only after 261 Tab presses (30 after the skip link). No console errors; no horizontal scroll at 375 px |
| Opus review (2026-10-16) | Opus | 98 findings: 92 accepted, 0 rejected, 6 deferred (need site, uncertainty or option-card slices). Contrast tokens fixed; skip link to chart (2 Tab + Enter); settings read from the registry; AC5 pick = rank 1; infinite-cost dominance bug confirmed and fixed (T1/T3 outputs unchanged); browser test suite added. npm test 22/22, npm run test:browser 13/13, axe 0 serious/critical in light and dark. Re-run independently by the orchestrator before commit: same results. Interrupted once by the plan's usage limit and resumed |

## Site slice (2026-10-16/17, branch feature/site-layout)

| Step | Model | Result |
|---|---|---|
| Build | Opus | Six stages (geometry, site model with T2/T4, blocks, auto-layout, site-fit outputs, Site tab with plan, drawing, import, small multiples). Stopped twice by the plan's usage limit and resumed. `npm test` 31/31, `npm run test:browser` 18/18. Checkpoints 87291e3 and 4f386b7 |
| Haiku check 1 (claims, regression, independent invariants) | Haiku | 31/31; 8 of 9 checks verified. Independent checker: 0 invariant violations across 8,000 layouts; baseline comparison reproduces BUILD-NOTES (leaders unchanged; 804 T1 and 719 T3 rank changes). "Failed" check 6b was a verifier-design error: site area legitimately changes residual-PV sizing (§10.4); status alone changes nothing. Found a wrong PPA statement in BUILD-NOTES |
| Haiku check 2 (brief §10) | Haiku | 91 requirements: 63 implemented, 15 partial, 8 deferred, 5 missing (gas connection cost, POC cable length, access-driven roads allowance, carport PV, screen-reader walk-through). 28 deviations, 13 unrecorded. Height rule ambiguous |
| Haiku check 3 (browser, phone, accessibility) | Haiku | Browser suite 18/18; axe 0 violations light and dark; drawing and GeoJSON import work; no console errors. FAIL: desktop horizontal overflow from the "Option shown" select; plan 36 Tab presses after the skip link; B9 never asserts its target (166 ms measured) |
| Orchestrator review of screenshots | Opus | On a phone, results and the plan start ~6,000 px down below the progress panel, log and run summary; header wording on site fit misleading |
| Opus review (2026-10-17) | Opus | 75 findings judged: 40 accepted, 12 rejected, 23 deferred (by build stage). Phone: results first, run details folded (tab bar ends at 813 px); site-fit wording corrected (status has no effect; site inputs act through residual-PV sizing; test 9g); Site tab overflow fixed at 1400 and 1000 px; "Skip to site plan" (3 Tab + Enter); B9 now asserts ≤ 300 ms; POC sets grid cable length and the gas main sets a gas pipe cost; compliant-first covers "Does not fit"; literals moved to §18 records; constrained test fixture corrected. Height rule kept soft (Brief issue 18). T1: leader unchanged (85.9634 → 85.9642), top 20 unchanged, 141 ranks move ≤ 2, capex −€1.63 m on every option; T3 unchanged. `npm test` 32/32, `npm run test:browser` 21/21, axe 0 serious/critical. The safety classifier timed out during this review, so the orchestrator audited it: brief and repository untouched, no new dependencies or network calls, generator.js change limited to stale note text; tests re-run independently with the same results. Open for the owner: T3 cost axis (Brief issue 21) |

## Port from the concept line (2026-10-18, branch feature/port-concept-line)

| Step | Model | Result |
|---|---|---|
| Build | Opus | Dispatch tab (phasing timeline, hourly dispatch, annual balance), tornado Sensitivity tab, bridging-battery timing fix, hosted-page build, loading message; owner decision 2026-10-18 applied (PPA settlement only on delivered energy; undelivered settlement reported as a hedge outside the ledger and score). `npm test` 44/44, browser 29/29 |
| Haiku check H1 (claims) | Haiku | 44/44; 13 claims verified, 2 not verified (2c denominator wording; S2 item-1 scores), 1 failed as a literal check (5c: battery first discharges in month 27, time-to-power counts it from 21). Observations O1–O5 on PPA options that cannot deliver, CFE and market-based carbon, flag wording |
| Haiku check H2 (brief, source fidelity) | Haiku | 44 requirements: 22 implemented, 13 partial, 6 deferred, 3 missing (§12.6 bridging shading and grid-date band; §17 load and bundle size). 7 unrecorded changes |
| Haiku check H3 (browser, hosted page, phone) | Haiku | PASS: 29/29; no overflow at 375 or 1400 px; axe 0 serious/critical; hosted page has no outside requests |
| Fixes after the H checks | Opus | 2c both denominators stated; the 7 changes recorded; §17 measured (JS 184 KB gzipped; inputs operable at 0.3 s, results after the first run at about 16 s); axe needs-review rule identified (`color-contrast`, every node checked); committed single file refreshed (it was still the site-slice build) |
| GitHub CI (first run, Ubuntu runner) | — | FAIL: B14 and B20, Site tab at 375 px scrolled sideways (388 px) with DejaVu Sans, the runner's default font. Fixed: site-fit table cells wrap (`overflow-wrap: anywhere`); checked with three wide fonts |
| Opus review (2026-10-18) | Opus | 57 findings judged: 31 accepted, 3 rejected (5c not a defect, confirmed from the dispatch data; H2 R30/R33 verifier errors), 23 deferred (later stages or owner decisions). 13 found in the review. Fixed: PPA hedge present value printed with the wrong sign on 23 T1 options; hosted page now pure ASCII; a record note. Record corrections (§12.6 deferral reason, B-4 evidence). S2 now verified (98.9963, 73.1602). No number, rank or flag changed on T1, T3 or T1 + BESS + solar. Owner decisions framed: O1 PPA options that can never deliver, O2 CFE and market-based carbon count undelivered volume, O3 flag headline. `npm test` 44/44, browser 29/29. Report: `port/OPUS-review.md` |


## Packaging: Windows program, phone, PWA, GitHub workflows (2026-10-18 to 2026-10-21, branch feature/packaging)

| Step | Model | Result |
|---|---|---|
| Build | Opus | PWA (12 checks), Electron desktop shell (sandbox, CSP, fuses), build script for Windows, macOS and Linux, desktop test (Linux under a virtual display), GitHub workflows (`ci.yml`, `desktop.yml`), READMEs. Fixed on the way: a crash of the Electron download through a proxy (retry in a child process); `rcodesign verify` rejecting every ad hoc macOS signature (own page-hash checker) |
| GitHub CI (first runs) | — | Desktop test failed on the runner (Chromium sandbox blocked by Ubuntu 24.04's user-namespace setting; fixed in the workflow, sandbox kept on). Browser suite found the Site tab scrolling sideways at 375 px with DejaVu Sans (fixed in the app) |
| Haiku check H1-packaging | Haiku | 7 checks: P9 (axe) had silently never run; the desktop program reached the network at start-up (Electron spell-check dictionary download); D6 could not see it; `data:` downloads not bound to the app; checker crashed on malformed input; workflow upload and README details. All fixed or recorded (`packaging/PACKAGING-PROGRESS.md`); new D12 traces every process (negative control: the pre-fix build fails it) |
| Opus review | Opus | Started 2026-10-19; stopped at the weekly usage limit without a report. **Not done** |
| Close-out (owner, 2026-10-21) | Opus | Windows and phone only: Windows program for download, Linux build kept only for the launch test, macOS and Linux downloads dropped; phone = private Claude artifact (updated). D12 false alarm on GitHub (Chromium's send-nothing IPv6 route probe) fixed. Merged to `main` |

## Brief revision 5 and the build handoff (2026-10-21 to 2026-10-22)

| Step | Model | Result |
|---|---|---|
| Revision 5 and handoff documents | Opus | The owner's walkthrough of 2026-10-21 folded into the brief; `docs/BUILD-PLAN.md`, `docs/KNOWN-ISSUES.md`, the decision log, the user guide and `CLAUDE.md` added; `STATUS.md` brought up to date. The guide's tools rebuilt the EPUB (EPUBCheck: no messages) and the PDF (171 pages), and every generator reproduced its stored files |
| Haiku check 1 | Haiku | 12 findings (2 high, 8 medium, 2 low). High: the O1 interim rule was weaker than the decision and the demotion option clashed with principle 5; the tornado's built drivers were listed wrongly. All 12 confirmed against the code and fixed (`brief-v2/CHANGELOG.md`, "Verifier findings (Haiku check, 2026-10-22)") |

## Walkthrough build: work packages 0–10 (2026-10-23)

Reports in `verification/walkthrough-build/`. The owner asked for Haiku checks only, to save usage ("You can run haiku model checks, to save credits"), and waived the Opus review that would follow three Haiku checks ("Don't bother with opus review", 2026-10-23).

| Step | Model | Result |
|---|---|---|
| H1, engine (packages 3b, 4, 5) | Haiku | 1 high, 1 medium, 5 low. High: decision 43 (every technology for bridging) not met by the default C2 set. Medium: CFE in exceedance mode. Fixed on `feature/verification-fixes`; L1 (Seveso store) and L2 (recovery after a natural end) left for the owner |
| H2, inputs, grid, screening, defaults (packages 0, 2, 3, 8) | Haiku | 1 high, 4 medium, 10 low. High: screening carbon outside ±5 % (AC 4). All fixed except L6 (no Grid + export contract input, disclosed) |
| H3, results, PDF, map, currency (packages 1, 6, 7, 9, 10) | Haiku | 2 high, 4 medium, 6 low. High: Russia's outline across 180°; coastal pins. All fixed except L5 (tornado observations, for the owner) |
| Opus review | — | Waived by the owner for this round |

## Engine fixes and new packages: work packages 11–15 (2026-10-24, branch feature/engine-fixes)

| Check | Model | Result |
|---|---|---|
| H4, packages 11–15 (engine fixes, PPA displacement, existing plant, layout scope, archetypes, study files) | Haiku | 0 high, 4 medium, 12 low (33 verified, 15 failed, 7 not verified). Medium: a land-take ceiling hid not-laid-out options; rule (o) wording; stale figures in the guide; Pego product figures not reproducible from the repository. All fixed (`app/BUILD-NOTES.md`, "Fixes after Haiku check H4") |
| Opus review | — | Waived by the owner ("Don't bother with opus review", 2026-10-23) |

## feature/plain-summary (work packages 16 and 17, 2026-10-24)

| Check | Model | Result |
|---|---|---|
| H5, package 16 (plain-English summary) and known issue 21 | Haiku | 1 high, 4 medium, 13 low (50 verified, 20 failed, 4 not verified). High: an edited note written with the Site tab on reached the PDF. Medium: the 250-word limit not enforced with many major flags; "gives up nothing" with one adequate option; hourly CFE called "carbon"; "why it leads" left out the parts favouring #2. All fixed the same day except L13 (the B38 message is the failure message, correct as written); report `plain-summary/H5-summary.md`, fixes in `app/BUILD-NOTES.md` ("Fixes after Haiku check H5") |

## Breakeven table and Monte Carlo: work packages 17 and 18 (2026-10-26, branch feature/verification-h6)

| Check | Model | Result |
|---|---|---|
| H6, packages 17 (breakeven table) and 18 (Monte Carlo) at commit 33f9c1a | Haiku | 0 high, 6 medium, 11 low (43 verified, 20 failed, 5 not verified). Medium: the competitor pool takes six cards (owner, 2026-10-26: keep six; the record was amended); the representative-day caveat too narrow; the robust pick shown on a one-sample margin as "100 %" for both; the breakeven base from the run while the re-runs use the full year; steps over 50 ms; Appendix A without the 7 Monte Carlo records (14 records missing). Fixed after the lead confirmed each against the code, except the 50 ms steps (recorded) and two points still with the owner (`app/BUILD-NOTES.md`, "Fixes after Haiku check H6"). Report: `verification/breakeven-montecarlo/H6-report.md`; the lead's scripts in `scripts/` |
| Opus review | — | **Due** under the rule "one Opus review after every three Haiku checks" (H4, H5 and H6 since the owner's waiver of 2026-10-23, which was given for the walkthrough-build round). Expensive: ask the owner before running it |
