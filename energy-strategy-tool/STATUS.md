# Status: concept-design energy strategy tool

Checkpoint updated after every completed step, so any session can resume from here.
Last updated: 2026-10-26 (**Haiku check H6 of packages 17 and 18 done: its fixes and the owner's three answers, with the 2026-10-25 handoff update, merged into `main` on 2026-10-26 with the owner's yes ("Merge", in writing)**; new-chat handoff prepared 2026-10-25; **the stacked feature branches, up to and including `feature/engine-fixes`, were merged into `main` on 2026-10-24 with the owner's yes**; the branch rows below say "Not merged" because they were written before the merge: read them as "now in `main`"; every build-plan package, 0 to 15 and 3b, is built; package 0 batches 1 and 2 applied; three Haiku checks of the walkthrough build done and fixed on `feature/verification-fixes`, Opus review waived by the owner; Pego case study revision 3 done; package 11, the engine fixes from the Haiku checks and the Pego study, built on `feature/engine-fixes`; **packages 16 (the plain-English summary), 17 (the breakeven table) and 18 (Monte Carlo), built on `feature/plain-summary`, merged into `main` on 2026-10-25 with the owner's yes ("Yes merge", in writing)**). Development was paused by the owner on 2026-10-21 and **restarted on 2026-10-22**: everything built so far is merged to `main`, passed its verification (table below) and works; defects found since are listed in `docs/KNOWN-ISSUES.md` (all 21 resolved by 2026-10-24; 21 found and fixed on `feature/plain-summary`), and the packaging Opus review did not finish. The owner's walkthrough of 2026-10-21 is folded into the brief (revision 5) and broken into work packages in `docs/BUILD-PLAN.md`. **The owner confirmed the build order on 2026-10-22 (as recorded, packages 0 to 10) and asked to start package 0.** New sessions: read `../CLAUDE.md` first.

The walkthrough's decision log is `docs/walkthrough-decisions-2026-10-21.md` (a copy of the owner's project document). Where this file or the brief disagrees with it, the log is newer. The built program was checked against the guide and the code on `main` (commit 441635e) on 2026-10-21 while writing the user guide; the defects found are in `docs/KNOWN-ISSUES.md`.

## Where to look

- **Brief (authoritative):** `brief-v2/BRIEF.md` (revision 5, walkthrough folded in), with `CHANGELOG.md`, `ASSUMPTIONS.md`, `OPEN-QUESTIONS.md` (questions 19–35 are the points the walkthrough left open; they have no default).
- **Build plan:** `docs/BUILD-PLAN.md`: the walkthrough changes as work packages 0–10, with the questions to ask first and the acceptance tests.
- **Decision log:** `docs/walkthrough-decisions-2026-10-21.md`. **Known issues:** `docs/KNOWN-ISSUES.md` (21 items, all resolved by 2026-10-24).
- **User guide:** `docs/user-guide/`: the guide's text, figures, mock-ups of the agreed screens and the tools that build the EPUB and the PDF (`docs/user-guide/README.md`).
- **App source and build notes:** `app/`. `app/BUILD-NOTES.md` is the reference for defaults, gaps, decisions and test output.
- **Windows program:** GitHub → Actions → Desktop builds → latest green run → Artifacts → `desktop-win32-x64`. Unsigned: Windows shows "Windows protected your PC" the first time (More info → Run anyway). See `packaging/README.md`.
- **Phone:** dropped on 2026-10-21 (walkthrough). The private Claude artifact "Concept Energy Optioneering" (https://claude.ai/artifact/KZ5isQcoksrwHY1AqTHU55) still exists but is no longer maintained or part of the plan.
- **Any browser, offline:** `energy-tool-single-file.html`. Open it directly in a browser; no setup.
- **Verification record:** `verification/HISTORY.md`, plus one folder of reports per slice.

## Scope change (2026-10-21 walkthrough)

- **Audience:** data centre consultancies in general, not RED specifically. Repo stays public.
- **Platforms:** Windows program only. Phone dropped.
- **Location:** a map pin sets location and country. Planned: an offline map bundled with the Windows program (PMTiles-style, all of Europe, roads detail). Licence and file size not yet checked.
- **Site tab:** kept as **Beta**. Hidden by default, turned on in the app's general settings, labelled Beta, and kept out of the ranking and the PDF export. Site area is otherwise a single number; layout and planning constraints are out of the main flow.
- **Results and export:** top 5 cards, cost-against-carbon trade-off (either axis switchable), compare up to 3, tornado defaulting to LCOE, one PDF export (inputs first). No Excel.
- Full list of defaults, flags and research items: `docs/walkthrough-decisions-2026-10-21.md` and brief revision 5.

## Branches

| Branch | State |
|---|---|
| `main` | **Everything below, verified** (except the packaging Opus review, which did not finish; known issues in `docs/KNOWN-ISSUES.md`). Brief v2, core, run log, single-file build, Pareto, Site, the port (Dispatch, Sensitivity, PPA rule), packaging (Windows program, PWA, workflows). Merged 2026-10-21 with the owner's approval of 2026-10-18; later packages merged on 2026-10-24, 2026-10-25 and 2026-10-26 (check H6) with the owner's yes |
| `feature/pareto-verification`, `feature/site-layout`, `feature/port-concept-line`, `feature/packaging` | Fully contained in `main`; kept for reference |
| `concept-sensitivity-tab`, `concept-site-layout` | Parallel work by another session; their useful parts were ported. Left untouched (deleting them is the owner's call) |
| `docs/status-walkthrough-2026-10-21` | The status update of 2026-10-21, merged into `main` (commit 441635e). Can be deleted (the owner's call) |
| `feature/build-handoff-2026-10-21` | The handoff for the build (2026-10-22): brief revision 5, build plan, known issues, decision log, user guide, `CLAUDE.md`. Merged into `main` on 2026-10-22 with the owner's approval; kept for reference |
| `feature/defaults-research` | Work package 0, research the defaults (started 2026-10-22). Batch 1 applied and tested (EU and UK ETS, hydrogen, exchange rates; label "sourced — not independently checked"); checks pass on GitHub. Not merged |
| `feature/site-tab-beta` | From `feature/defaults-research`. Work package 2, part: the Site tab's Beta switch and AC 27 (2026-10-22), built while the owner was away. Not merged |
| `feature/solar-areas` | From `feature/site-tab-beta`. Work package 2, part: solar from roof and ground areas for PV, carport solar and "belly tanks only" removed (OPEN-QUESTIONS 52–54), built 2026-10-22 when the owner asked to continue. Not merged |
| `feature/adequacy-first` | From `feature/solar-areas`. Work package 3b, part 1: power adequacy first (OPEN-QUESTIONS 37–41), built 2026-10-23 when the owner asked to go back to the app. Adequacy status, adequacy-first ranking, flag, grid shortfall analysis and the screens. T1 leader changes to the best adequate option (OPIAR4Q, 89.8). Part 2 (2026-10-23): plant ordered from day one, six-month permitting allowance only under the IED or Seveso (OPEN-QUESTIONS 44, 45, 56). Part 3: firm generation sized two ways, baseload and top-up (OPEN-QUESTIONS 58). Parts 4–7 (built while the owner asked for work to continue without their input): split bridging plant (59), permitting outlook (46), IT the grid supports by period and grid-matched phasing reference (38), backup per building or pooled (47, 48). Part 8: shortfall battery counted as firm supply (60). Not merged |
| `feature/flex-batteries` | From `feature/adequacy-first`. Work package 4 (2026-10-23): load shapes, flexibility with triggers and against shortfalls, battery response, trigger-hours battery, resilience reserve battery, genset test running 6 h at 75 % and primary-power hours (AC 19, AC 20; OPEN-QUESTIONS 33, 34, 61). Not merged |
| `feature/ppa-rules` | From `feature/flex-batteries`. Work package 5 (2026-10-23): O1 (PPA not generated where it can never be delivered), O2 (hourly CFE against grid energy used), O3 (two PPA flags), PPA off unless ticked (OPEN-QUESTIONS 22, 49, 62); known issue 13 fixed. Not merged |
| `feature/results-cards` | From `feature/ppa-rules`. Work packages 6, 7, 9 and 10 (2026-10-23, after the owner's standing instruction to follow Claude's recommendations): top-five cards with pros and cons, "same results as" marks, trade-off defaults (carbon across, cost up, resilience size and colour), live weight-change description, Compare tab (up to three); tornado with 16 drivers (seven ticked by default) measured in LCOE by default; PDF report ("Save PDF report", nine sections, no Site tab). OPEN-QUESTIONS 24, 29, 30, 32, 35 answered. Not merged |
| `feature/grid-contract` | From `feature/results-cards`. Work package 3 (2026-10-23): contracted grid capacity as a rule per grid strategy (blank = the full offer), one lump-sum grid connection charge (default 0, flagged "assumed", expected figure shown with a copy button), not paid by islanded options (OPEN-QUESTIONS 19, 20, 50; KNOWN-ISSUES 7 resolved). Not merged |
| `feature/input-model` | From `feature/grid-contract`. Work packages 2 and 8 (2026-10-23). Package 8: optional screening tier (representative days, best 10 verified with the full year; off by default, OPEN-QUESTIONS 23) and dispatch for any period. Package 2: only location and site area required; IT load estimated from the area with the massing rule; grid values can be "Not known"; "assumed default" flags on every option that uses a key input not entered (AC 16); economics section; several evaluation periods shown, the scoring period ranks (OPEN-QUESTIONS 21, 25, 26, 28; KNOWN-ISSUES 6 resolved). Not merged |
| (same branch) `feature/input-model` | Also work package 1 (2026-10-23): offline map pin (Natural Earth outlines, bundled), country from the pin's outline, display currency at release rates; ASHRAE not bundled (flagged); NOAA/EPW weather moved to package 0 (OPEN-QUESTIONS 63–65). Not merged |
| `feature/defaults-batch2` | From `feature/input-model`. Work package 0, batch 2 (2026-10-23): grid carbon for 31 countries (Ember 2025), wholesale prices, PV and wind O&M, battery, gas turbine, gas engines, SMR, genset lead time, PPA prices (OPEN-QUESTIONS 66, 67); 24 records now "sourced — not independently checked". Also `CLAUDE.md` (build before test) and the three Haiku reports. Not merged |
| `feature/verification-fixes` | From `feature/defaults-batch2`. Fixes for Haiku checks H1–H3 (2026-10-23): default bridging set with turbines and HVO-diesel prime, CFE in exceedance mode, clustered screening days and repeated verification, connection charge, PDF counts and periods, map unwrap across 180°, coastal and near-border pins, turbine €1,450/kW, notes. 65/65 Node tests. Not merged |
| `feature/engine-fixes` | From `feature/verification-fixes`. Work package 11 (2026-10-24, after the owner asked to continue the app development): known issues 1–3, 8–11 and 14–18 fixed (time-to-power in months late against the phasing plan, first power from phase 1, rented plant hired a month before it is needed, plant kept as the backup bought building by building, dispatch to the first steady year with a 15-year limit and a run flag, minimum stable load backs off the grid, gas flag only when needed, Seveso counts the running fuel store, grid adder field, opex in the first year with load; OPEN-QUESTIONS 68–76). T1 leader O7PMBVU (93.89, LCOE €153.5/MWh). Also known issue 19 (plant at its minimum stable load displaces PPA energy, OPEN-QUESTIONS 77) **work package 12, existing plant near the site, leased** (known issue 12, OPEN-QUESTIONS 78–82) and **work package 13, a large campus laid out on demand** (known issue 20, OPEN-QUESTIONS 83: Pego now runs in 16 s on the product, with the existing-plant input, instead of over an hour) and **work package 14, archetypes and identical options** (known issues 4 and 5, OPEN-QUESTIONS 84, 85; T1 leader OP13Y1Y, 94.15, €151.9/MWh) and **work package 15, study files** (save and reopen, OPEN-QUESTIONS 27) 73/73 Node tests. Merged into `main` on 2026-10-24 with the owner's yes |
| `feature/plain-summary` | From `main` after that merge (commit 05aa425). **Work package 16, the plain-English summary** (2026-10-24, after the owner asked to continue the development; BRIEF §14, OPEN-QUESTIONS 12 and 86–92): seven parts at the top of the Options tab and on a page after the PDF cover, at most 250 words, the exact weight change that alters the leader, the tornado's ranges and inputs when run on the leader, the edit kept as a note marked "edited" (study file and PDF). Known issue 21 (assumed-default flags missing in the app's pool workers) found and fixed. Also **work package 17, the breakeven table** (BRIEF §13.3, OPEN-QUESTIONS 93–97): "Run breakevens" on the Sensitivity tab, the leader against #2 and the best of each other strategy on the eight drivers that move its score most; in the PDF and the summary. Haiku check H5 of the summary: 1 high, 4 medium, 13 low, all fixed (`verification/plain-summary/H5-summary.md`). Also **work package 18, uncertainty by Monte Carlo** (BRIEF §13.1–13.2, OPEN-QUESTIONS 98–104, 2026-10-25): "Run uncertainty" on the Sensitivity tab, 300 Latin hypercube samples of thirteen inputs over the top 20 options; P10/P50/P90, how often each leads and the robust pick; in the header, the summary and the PDF. 77/77 Node tests, 40/40 browser checks; GitHub checks passed (commit c3def0a). **Merged into `main` on 2026-10-25 with the owner's yes** (fast-forward) |
| `feature/verification-h6` | From `main` (commit 33f9c1a), 2026-10-26. **Haiku check H6** of packages 17 (breakeven table) and 18 (Monte Carlo): 0 high, 6 medium, 11 low (`verification/breakeven-montecarlo/H6-report.md`). Fixed after the lead confirmed each finding against the code: the breakeven base is re-run over the full year when the run used the screening tier (MED-4); the robust pick is shown with its counts (MED-3); the representative-day caveat is in the panel, the summary detail and the PDF (MED-2); a value outside a record's range widens the range and says so (LOW-2); Appendix A lists all 573 records, the generator had left out 14 (MED-6); wording and test gaps (LOW-1, 4, 5, 6, 9, 10, 11). Not fixed: steps over 50 ms (MED-5, recorded; a worker would fix it, not scheduled). **Breakeven competitors (MED-1): the owner chose to keep the code, six cards (2026-10-26). Battery and grid connection capex correlation (LOW-3): the owner chose to keep about 0.64 (2026-10-26). Grid connection capex driver (LOW-8): the owner chose to keep the substation out (2026-10-26); the scope is now stated beside the tornado, in the registry note and in the guide, and test 31 pins it.** Nothing from H6 is still with the owner. **Merged into `main` on 2026-10-26 with the owner's written yes ("Merge"), together with `feature/handoff-2026-10-25`** |
| `codex/energy-tool-experiment` | The owner's own branch (2026-10-19); not part of this line. Left untouched |

GitHub runs the checks on every push to `main` or a `feature/` branch and on pull requests (`.github/workflows/ci.yml`: Node tests, build, PWA tests, browser tests) and builds the Windows program when the packaging changes (`desktop.yml`). Last result on `main` (commit 441635e): passed (2026-10-21).

## Built and verified

| Slice | Verification | Tests |
|---|---|---|
| Core: inputs, 8760-hour dispatch, option generator, scoring, ranked list | Haiku ×3 + Opus | Included below |
| Trackable run log (12 stages, JSON/CSV export, progress panel) | Haiku ×3 + Opus | Included below |
| Single-file build with inline worker and fallback/watchdog | Haiku ×3 + Opus | Included below |
| Pareto trade-off view | Haiku ×3 + Opus, 2026-10-16 | `npm test` 22/22; `npm run test:browser` 13/13; axe 0 serious/critical (light and dark) |
| Site (stage 2): geometry kernel, site model with T2/T4, blocks, auto-layout, site-fit outputs, Site tab with plan, boundary drawing, GeoJSON/KML import, small multiples. Now a Beta feature (walkthrough, 2026-10-21) | Haiku ×3 + Opus, 2026-10-17 (0 invariant violations in 8,000 independently checked layouts) | `npm test` 32/32; `npm run test:browser` 21/21; axe 0 serious/critical |
| Port from the other line: Dispatch tab, tornado (Sensitivity tab), bridging-battery timing fix, hosted-page build, the owner's PPA rule (settlement only on delivered energy) | Haiku H1–H3 + Opus, 2026-10-18 (`verification/port/`) | `npm test` 44/44; `npm run test:browser` 29/29 |
| Packages 17 and 18: breakeven table and Monte Carlo (2026-10-26, check H6, `verification/breakeven-montecarlo/`) | Haiku H6 (Opus review due after H4–H6; not run: ask the owner) | Before the fixes: `npm test` 77/77; `npm run test:browser` 40/40 (commit 33f9c1a). After the fixes (commit a4f531c, 2026-10-26): `npm test` 77/77 and `npm run test:browser` 40/40, run one after the other on the rebuilt app. After the owner's three answers (commit 856dba7, 2026-10-26): `npm test` 77/77 and `npm run test:browser` 40/40 again (about 22 minutes together) |

## Launchable app (owner request 2026-10-18; narrowed 2026-10-21 to **Windows only**)

- **Windows program (Electron 44.9.0):** built on GitHub for download. Sandboxed window, no Node.js in the page, CSP, Electron fuses, and no network at all (checked by tracing every process, D12). Launch-tested on a Linux build of the same app (12 checks); the Windows build itself is not launch-tested automatically. Not code-signed.
- **Phone:** dropped on 2026-10-21 (see "Scope change"). The installable web app (PWA) is built and tested in CI but not hosted.
- **Not built any more:** macOS and Linux downloads (the script can still make them).
- **Verification:** Haiku check done and answered (`verification/packaging/H1-packaging.md`). The Opus review of the packaging stopped at the weekly usage limit and did not report; not resumed because development is paused.

## Next

Follow `docs/BUILD-PLAN.md` in order. Order confirmed by the owner on 2026-10-22: as recorded, 0 then 1 to 10 (the owner chose this over moving the research last or splitting it, knowing packages 1, 2 and 4 add defaults that will need a second research pass). **In progress: package 0** (branch `feature/defaults-research`): batch 1 done; further research batches wait for the owner (each source needs the owner's approval to open while working, and each default change needs the owner's approval). **Started out of order:** from package 2, the Site tab's Beta switch (branch `feature/site-tab-beta`, on the owner's instruction of 2026-10-22 to progress independently on sections their notes do not touch) and the solar areas (branch `feature/solar-areas`, OPEN-QUESTIONS 52–54, built 2026-10-22 when the owner asked to continue). From package 3b, part 1, power adequacy first (branch `feature/adequacy-first`, built 2026-10-23); parts 2 (ordering from day one with the permitting allowance) and 3 (firm generation sized two ways) built the same day; parts 4 to 7 (split bridging plant, permitting outlook, grid periods and grid-matched phasing, backup per building or pooled) built the same day while the owner was away. Part 8, the battery sized to the permanent shortfall and counted as firm supply (OPEN-QUESTIONS 60), the same day: **package 3b is built** (country differences in the permitting outlook are a research item for package 0). Not yet verified independently (Haiku checks and an Opus review, expensive: ask the owner when to run them). **Package 4** built the same day on `feature/flex-batteries`, and **package 5** on `feature/ppa-rules`; neither verified independently. **Waiting for the owner:** the rest of the notes on the guide (`docs/owner-notes-on-user-guide-2026-10-22.md`); the bridging-plant note is settled (OPEN-QUESTIONS 42–48); next is "I want full run every time" (page 35).

0. Research the defaults before the first release.
1. Map pin and country setup.
2. Input model with flagged defaults (and the Site tab's Beta switch).
3. Contracted grid capacity and the fixed grid connection charge.
4. Flexibility and battery logic.
5. The O1–O3 PPA and carbon rules.
6. Results cards and the trade-off chart.
7. Compare.
8. Dispatch views (and the representative-day screening tier).
9. Tornado.
10. PDF export.

Built and merged 2026-10-25 (packages 16 to 18): the plain-English summary, the breakeven table and the Monte Carlo uncertainty; checked by Haiku (H6) and fixed, merged 2026-10-26. Not scheduled (ask the owner first): scenarios (BRIEF §13.3), per-input Monte Carlo ranges, an automatic Monte Carlo, the other trade-off views, code signing, the unfinished packaging Opus review, the NVDA walk-through. The stages of the brief before revision 5 are kept in brief §20 for reference.

## Decisions

Decided by the owner (code changes not yet made unless stated):

1. **No PPA income without physical delivery** (2026-10-18; built and verified, test 11a). PPA settlement counts only on delivered energy; settlement on undelivered volume is a separate hedge line outside the cost ledger and the score. This settled Brief issue 21 (the cost axis on a no-grid site).
2. **O1** (2026-10-21): a PPA that cannot be delivered (no grid, islanded) is flagged and the equivalent no-PPA option is preferred. How it works in the ranking: `OPEN-QUESTIONS.md` 22. Background: `verification/port/OPUS-review.md` section 7.1.
3. **O2** (2026-10-21): the carbon-free energy score uses hourly matching (PPA energy counted only against grid energy used in that hour). Section 7.2.
4. **O3** (2026-10-21): two separate `grid-ppa` flags, one for PPA volume limited by the grid import capacity and one for other undelivered PPA volume, each showing its share. Section 7.3.
5. **No-backup option** whose on-site plant meets every requirement item: stays "Does not meet" (2026-10-21).
6. **Contracted grid capacity** (brief question 18, 2026-10-21): each option has its own contracted grid capacity, set by the engineer; the grid connection charge is one fixed amount, the same for every option. Details: `OPEN-QUESTIONS.md` 19 and 20.
7. **Label for researched defaults** (2026-10-22, OPEN-QUESTIONS 36): once a default has its source and the owner's approval, it shows "sourced — not independently checked", not "verified"; it stays `verified: false` until a person responsible for the data checks it.
8. **Main question of the tool** (2026-10-22, OPEN-QUESTIONS 37): the best power strategy to maximise IT load with up to five nines of availability.
9. **Power adequacy first** (2026-10-22, OPEN-QUESTIONS 38): unmet load at any time puts an option at the bottom of the ranking; new build-plan package 3b. Tested against peak site demand, zero unmet hours, no availability measure (OPEN-QUESTIONS 39–41).
10. **Bridging, lead times and backup** (2026-10-22, OPEN-QUESTIONS 42–48, package 3b): both bridging alternatives (rent and own only the gap, or buy and retire into backup); every technology for bridging; long-lead plant ordered from day one, with six months for significant environmental permits; permitting outlook; one backup technology per building; a site-wide backup option with an adjustable client-risk item.
11. **PPA, grid capex, ramp, solar areas, removed choices** (2026-10-22, OPEN-QUESTIONS 49–54): PPA off unless ticked, coverage set by the engineer; grid connection capex default 0 with the expected country figure shown and a copy button; ramp at energisation 25 % (built); carport solar and "belly tanks only" removed, roof and ground areas for PV as inputs (ground default 0), C10 None / Roof / Roof + ground (built 2026-10-22, `feature/solar-areas`). The note "I want full run every time" (page 35) is left open.
12. Everything else decided in the walkthrough: `docs/walkthrough-decisions-2026-10-21.md`, folded into brief revision 5.

Waiting for the owner: `OPEN-QUESTIONS.md` 19–35 (no defaults; ask one at a time when the work package that needs the answer starts) and the known issues in `docs/KNOWN-ISSUES.md` (question 31).

Answered by the owner, from check H6 (2026-10-26): the breakeven competitor pool keeps the strategies of **six** cards so that five competitors are reached (T1: #2 #5 #7 #11 #16); OPEN-QUESTIONS 93, the brief, the guide and test 45 now say so (option A; the alternative was five cards and then the next-ranked options, T1: #2 #3 #5 #7 #11). Also answered: battery capex and grid connection capex keep their correlation of about 0.64 through the all-lines factor (option A; the alternative was 0.8 for every pair); and the substation line stays out of the "grid connection capex" driver, with no separate substation input (option A; OPEN-QUESTIONS 105). All three questions from check H6 are answered. One Opus review is due, since H4, H5 and H6 are three Haiku checks after the owner's waiver of 2026-10-23; **the owner deferred it on 2026-10-26 ("Later")**, so it stays due and is not run until the owner asks (expensive). The merge of `feature/verification-h6` and `feature/handoff-2026-10-25` into `main` was given in writing ("Merge") on 2026-10-26. Waiting for the owner: the Windows build, which the owner triggers (it does not yet include packages 16 to 18 or the H6 fixes).

Interpretations taken without asking (reversible, recorded in `app/BUILD-NOTES.md`):
- The highlighted Pareto pick follows rank 1, the same option as the header leader, so acceptance criterion 5 holds with "Rank requirement-compliant options first" on or off.
- A block over the height limit makes an option "Fits with flags", not "Does not fit": constraints are flagged, not enforced (principle 5), and acceptance criterion 7 depends on it (Brief issue 18).

## Known open items

- **Hourly weather research** (package 0, owner's request 2026-10-30, branch `feature/weather-research`): `docs/research/hourly-weather-2026-10-30.md`. Recommends an EPW upload in every case and a bundled typical year built from ERA5 (CC-BY 4.0) by ISO 15927-4; NOAA station cleaning not recommended for bundling (WMO Resolution 40: no commercial redistribution of non-US data); PVGIS licence to confirm. **Owner chose NOAA (2026-10-30, OPEN-QUESTIONS 106)**, non-commercial use stated; plus the EPW upload; every usable station bundled (OPEN-QUESTIONS 107). Nothing built yet.

- Packaging Opus review not done (usage limit). Resume it, or run a fresh one, before further packaging work.
- Screen-reader walk-through with NVDA not done yet (VoiceOver no longer applies with the Windows-only scope).
- A run takes **15–20 s for 2,000 options** on the owner's machine (owner's figure, 2026-10-21; the engine alone took 13.6–15.9 s in the sandbox), because every option runs the full 8760-hour model. The representative-day tier (package 8) is built but off by default, because adequacy needs every hour: on T1 it takes about 16 s against 25 s for the full run in the sandbox (one thread, after batch 2 and the Haiku fixes). The owner has said speed is not a priority for now.
- Weight-change repaint measured 96–166 ms in the sandbox; the walkthrough relaxed the ≤ 100 ms target and the new value is `OPEN-QUESTIONS.md` 35. The browser check fails above 300 ms to catch regressions.
- Stage 2 gaps deferred: roads allowance driven by access points, image underlay, footprint override, heat-reuse blocks. The gas-pipe rate (€0.8 m/km) is a judgement value.
- Some core run constants have no §18 default record yet.
- No default has a verified source. 24 records carry a source and the label "sourced — not independently checked" (package 0, batches 1 and 2); the rest are "indicative — unverified".
- Pego case study, revision 3 (2026-10-24), run with a study build of the current app (`studies/pego-rev3/`): it found five new defects, KNOWN-ISSUES 14–18 (time-to-power rewards full capacity long before it is needed; rented plant paid from availability; retained bridging plant bought all at once; the eight-year dispatch cap; an entered grid adder ignored, which made the study's market cases wrong). All five are fixed in package 11 (`feature/engine-fixes`); the corrected revision 3.1 of the study was delivered the same day.
- Known issues: all 20 resolved on `feature/engine-fixes` (4 and 5 in work package 14). For the owner: skipping the site layout in every run while the Site tab is off would halve T1's run time (17 s to about 8 s); not decided (OPEN-QUESTIONS 83). Existing plant under lease (12) is built as work package 12, and known issue 19 (PPA energy not turned down when firm plant runs at its minimum), found in Pego revision 3.1, is fixed, both on `feature/engine-fixes`.
- Pego case study, revision 3.1 (2026-10-24): every case re-run on `feature/engine-fixes`. The recommendation stands (study #1 €141.3/MWh, was €143.2); the market cases corrected (forwards €123.8, gas crisis €182.7/MWh for the plan with the PPA); renting now beats the 2028 CCGT start even with the grid two years late. Scripts in `studies/pego-rev3/`.
- Check H6 (2026-10-26): the breakeven table and the Monte Carlo run on the main thread in steps, and some steps last up to 180 ms (breakevens) and 100 ms (Monte Carlo) against the brief's 50 ms; a worker would fix it (not scheduled). Both are above their speed targets (breakevens 4–5 s in Node and 7 s in a browser against 3 s; Monte Carlo 300 × 20 about 12 s in Node and 30 s in a browser against 8 s).
- Left from the Haiku checks: no Grid + export contract input; two tornado observations (`app/BUILD-NOTES.md`, "Verification fixes"). The Seveso store and the flexibility recovery period were settled in package 11 (OPEN-QUESTIONS 73, 74).

## How to run

```
cd app
npm ci
npm test               # Node test suite
npm run build          # writes dist/, including energy-tool-single-file.html
npm run test:browser   # needs Playwright and Chromium; skips with a message if absent
```

## Working rules

The full list is in `../CLAUDE.md`. In short:

- Builder and reviewer: Claude Opus 5.5. Verifier: Claude Haiku 5.5. After every three Haiku checks, one Opus review.
- Work goes to feature branches. Nothing is merged to `main` without the owner.
- One question per message; never assume an answer to an open question; explain GitHub and software terms in plain words.
- This file is updated after every completed step.
