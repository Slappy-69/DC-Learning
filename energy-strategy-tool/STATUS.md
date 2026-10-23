# Status: concept-design energy strategy tool

Checkpoint updated after every completed step, so any session can resume from here.
Last updated: 2026-10-22 (package 0 batch 1 done; Site tab Beta switch built on `feature/site-tab-beta`; solar areas built on `feature/solar-areas`). Development was paused by the owner on 2026-10-21 and **restarted on 2026-10-22**: everything built so far is merged to `main`, passed its verification (table below) and works; defects found since are listed in `docs/KNOWN-ISSUES.md` (none fixed), and the packaging Opus review did not finish. The owner's walkthrough of 2026-10-21 is folded into the brief (revision 5) and broken into work packages in `docs/BUILD-PLAN.md`. **The owner confirmed the build order on 2026-10-22 (as recorded, packages 0 to 10) and asked to start package 0.** New sessions: read `../CLAUDE.md` first.

The walkthrough's decision log is `docs/walkthrough-decisions-2026-10-21.md` (a copy of the owner's project document). Where this file or the brief disagrees with it, the log is newer. The built program was checked against the guide and the code on `main` (commit 441635e) on 2026-10-21 while writing the user guide; the defects found are in `docs/KNOWN-ISSUES.md`.

## Where to look

- **Brief (authoritative):** `brief-v2/BRIEF.md` (revision 5, walkthrough folded in), with `CHANGELOG.md`, `ASSUMPTIONS.md`, `OPEN-QUESTIONS.md` (questions 19–35 are the points the walkthrough left open; they have no default).
- **Build plan:** `docs/BUILD-PLAN.md`: the walkthrough changes as work packages 0–10, with the questions to ask first and the acceptance tests.
- **Decision log:** `docs/walkthrough-decisions-2026-10-21.md`. **Known issues:** `docs/KNOWN-ISSUES.md` (nine defects in the built engine, none fixed).
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
| `main` | **Everything below, verified** (except the packaging Opus review, which did not finish; known issues in `docs/KNOWN-ISSUES.md`). Brief v2, core, run log, single-file build, Pareto, Site, the port (Dispatch, Sensitivity, PPA rule), packaging (Windows program, PWA, workflows). Merged 2026-10-21 with the owner's approval of 2026-10-18 |
| `feature/pareto-verification`, `feature/site-layout`, `feature/port-concept-line`, `feature/packaging` | Fully contained in `main`; kept for reference |
| `concept-sensitivity-tab`, `concept-site-layout` | Parallel work by another session; their useful parts were ported. Left untouched (deleting them is the owner's call) |
| `docs/status-walkthrough-2026-10-21` | The status update of 2026-10-21, merged into `main` (commit 441635e). Can be deleted (the owner's call) |
| `feature/build-handoff-2026-10-21` | The handoff for the build (2026-10-22): brief revision 5, build plan, known issues, decision log, user guide, `CLAUDE.md`. Merged into `main` on 2026-10-22 with the owner's approval; kept for reference |
| `feature/defaults-research` | Work package 0, research the defaults (started 2026-10-22). Batch 1 applied and tested (EU and UK ETS, hydrogen, exchange rates; label "sourced — not independently checked"); checks pass on GitHub. Not merged |
| `feature/site-tab-beta` | From `feature/defaults-research`. Work package 2, part: the Site tab's Beta switch and AC 27 (2026-10-22), built while the owner was away. Not merged |
| `feature/solar-areas` | From `feature/site-tab-beta`. Work package 2, part: solar from roof and ground areas for PV, carport solar and "belly tanks only" removed (OPEN-QUESTIONS 52–54), built 2026-10-22 when the owner asked to continue. Not merged |
| `feature/adequacy-first` | From `feature/solar-areas`. Work package 3b, part 1: power adequacy first (OPEN-QUESTIONS 37–41), built 2026-10-23 when the owner asked to go back to the app. Adequacy status, adequacy-first ranking, flag, grid shortfall analysis and the screens. T1 leader changes to the best adequate option (OPIAR4Q, 89.8). Part 2 (2026-10-23): plant ordered from day one, six-month permitting allowance only under the IED or Seveso (OPEN-QUESTIONS 44, 45, 56). Part 3: firm generation sized two ways, baseload and top-up (OPEN-QUESTIONS 58). Parts 4–7 (built while the owner asked for work to continue without their input): split bridging plant (59), permitting outlook (46), IT the grid supports by period and grid-matched phasing reference (38), backup per building or pooled (47, 48). Not merged |
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

## Launchable app (owner request 2026-10-18; narrowed 2026-10-21 to **Windows only**)

- **Windows program (Electron 44.9.0):** built on GitHub for download. Sandboxed window, no Node.js in the page, CSP, Electron fuses, and no network at all (checked by tracing every process, D12). Launch-tested on a Linux build of the same app (12 checks); the Windows build itself is not launch-tested automatically. Not code-signed.
- **Phone:** dropped on 2026-10-21 (see "Scope change"). The installable web app (PWA) is built and tested in CI but not hosted.
- **Not built any more:** macOS and Linux downloads (the script can still make them).
- **Verification:** Haiku check done and answered (`verification/packaging/H1-packaging.md`). The Opus review of the packaging stopped at the weekly usage limit and did not report; not resumed because development is paused.

## Next

Follow `docs/BUILD-PLAN.md` in order. Order confirmed by the owner on 2026-10-22: as recorded, 0 then 1 to 10 (the owner chose this over moving the research last or splitting it, knowing packages 1, 2 and 4 add defaults that will need a second research pass). **In progress: package 0** (branch `feature/defaults-research`): batch 1 done; further research batches wait for the owner (each source needs the owner's approval to open while working, and each default change needs the owner's approval). **Started out of order:** from package 2, the Site tab's Beta switch (branch `feature/site-tab-beta`, on the owner's instruction of 2026-10-22 to progress independently on sections their notes do not touch) and the solar areas (branch `feature/solar-areas`, OPEN-QUESTIONS 52–54, built 2026-10-22 when the owner asked to continue). From package 3b, part 1, power adequacy first (branch `feature/adequacy-first`, built 2026-10-23); parts 2 (ordering from day one with the permitting allowance) and 3 (firm generation sized two ways) built the same day; parts 4 to 7 (split bridging plant, permitting outlook, grid periods and grid-matched phasing, backup per building or pooled) built the same day while the owner was away. Left in 3b: batteries sized to the shortfall, which waits for the owner's decision on whether a battery counts as firm supply against the design load. Not yet verified independently (Haiku checks and an Opus review, expensive: ask the owner when to run them). **Waiting for the owner:** the rest of the notes on the guide (`docs/owner-notes-on-user-guide-2026-10-22.md`); the bridging-plant note is settled (OPEN-QUESTIONS 42–48); next is "I want full run every time" (page 35).

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

Not scheduled (ask the owner first): the small fixes in `docs/KNOWN-ISSUES.md`, saving and reopening a study, the plain-English summary, the uncertainty features (ranges, Monte Carlo, breakevens, scenarios), the other trade-off views, code signing, the unfinished packaging Opus review, the NVDA walk-through. The stages of the brief before revision 5 are kept in brief §20 for reference.

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

Interpretations taken without asking (reversible, recorded in `app/BUILD-NOTES.md`):
- The highlighted Pareto pick follows rank 1, the same option as the header leader, so acceptance criterion 5 holds with "Rank requirement-compliant options first" on or off.
- A block over the height limit makes an option "Fits with flags", not "Does not fit": constraints are flagged, not enforced (principle 5), and acceptance criterion 7 depends on it (Brief issue 18).

## Known open items

- Packaging Opus review not done (usage limit). Resume it, or run a fresh one, before further packaging work.
- Screen-reader walk-through with NVDA not done yet (VoiceOver no longer applies with the Windows-only scope).
- A run takes **15–20 s for 2,000 options** on the owner's machine (owner's figure, 2026-10-21; the engine alone took 13.6–15.9 s in the sandbox), because every option runs the full 8760-hour model. The brief's speed targets need the representative-day tier (build plan package 8). The owner has said speed is not a priority for now.
- Weight-change repaint measured 96–166 ms in the sandbox; the walkthrough relaxed the ≤ 100 ms target and the new value is `OPEN-QUESTIONS.md` 35. The browser check fails above 300 ms to catch regressions.
- Stage 2 gaps deferred: roads allowance driven by access points, image underlay, footprint override, heat-reuse blocks. The gas-pipe rate (€0.8 m/km) is a judgement value.
- Some core run constants have no §18 default record yet.
- No default has a verified source: every one is labelled "indicative — unverified".

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
