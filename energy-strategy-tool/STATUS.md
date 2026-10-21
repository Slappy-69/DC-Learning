# Status: concept-design energy strategy tool

Checkpoint updated after every completed step, so any session can resume from here.
Last updated: 2026-10-21 (after the user-workflow walkthrough). **Development paused by the owner (2026-10-21)**: everything built so far is verified, merged to `main` and working; nothing new is in progress.

**Scope has changed since the close-out state below.** The walkthrough decisions are in `claude/walkthrough-decisions-2026-10-21.md` in the owner's Claude project (the full log, with research items). Where this file disagrees with that log, the log is newer. This file has not been re-verified against the code since the change.

## Where to look

- **Brief (authoritative):** `brief-v2/BRIEF.md`, with `CHANGELOG.md`, `ASSUMPTIONS.md`, `OPEN-QUESTIONS.md`.
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
- Full list of defaults, flags and research items: the project log named above.

## Branches

| Branch | State |
|---|---|
| `main` | **Everything below, verified.** Brief v2, core, run log, single-file build, Pareto, Site, the port (Dispatch, Sensitivity, PPA rule), packaging (Windows program, PWA, workflows). Merged 2026-10-21 with the owner's approval of 2026-10-18 |
| `feature/pareto-verification`, `feature/site-layout`, `feature/port-concept-line`, `feature/packaging` | Fully contained in `main`; kept for reference |
| `concept-sensitivity-tab`, `concept-site-layout` | Parallel work by another session; their useful parts were ported. Left untouched (deleting them is the owner's call) |

GitHub runs the checks on every push to `main` (`.github/workflows/ci.yml`: Node tests, build, PWA tests, browser tests) and builds the Windows program when the packaging changes (`desktop.yml`).

## Built and verified

| Slice | Verification | Tests |
|---|---|---|
| Core: inputs, 8760-hour dispatch, option generator, scoring, ranked list | Haiku ×3 + Opus | Included below |
| Trackable run log (12 stages, JSON/CSV export, progress panel) | Haiku ×3 + Opus | Included below |
| Single-file build with inline worker and fallback/watchdog | Haiku ×3 + Opus | Included below |
| Pareto trade-off view | Haiku ×3 + Opus, 2026-10-16 | `npm test` 22/22; `npm run test:browser` 13/13; axe 0 serious/critical (light and dark) |
| Site (stage 2): geometry kernel, site model with T2/T4, blocks, auto-layout, site-fit outputs, Site tab with plan, boundary drawing, GeoJSON/KML import, small multiples | Haiku ×3 + Opus, 2026-10-17 (0 invariant violations in 8,000 independently checked layouts) | `npm test` 32/32; `npm run test:browser` 21/21; axe 0 serious/critical; phone shows results first |

## Launchable app (owner request 2026-10-18; narrowed 2026-10-21 to **Windows only**)

- **Windows program (Electron 44.9.0):** built on GitHub for download. Sandboxed window, no Node.js in the page, CSP, Electron fuses, and no network at all (checked by tracing every process, D12). Launch-tested on a Linux build of the same app (12 checks); the Windows build itself is not launch-tested automatically. Not code-signed.
- **Phone:** dropped on 2026-10-21 (see "Scope change"). The installable web app (PWA) is built and tested in CI but not hosted.
- **Not built any more:** macOS and Linux downloads (the script can still make them).
- **Verification:** Haiku check done and answered (`verification/packaging/H1-packaging.md`). The Opus review of the packaging stopped at the weekly usage limit and did not report; not resumed because development is paused.

## Next

0. **Walkthrough implementation (not started):** follow `claude/walkthrough-decisions-2026-10-21.md`. Resume only when the owner asks.
1. **Port from the other line: verified** (Haiku H1–H3 and Opus review, 2026-10-18; `verification/port/`). Dispatch tab, tornado Sensitivity tab, bridging-battery timing fix, hosted-page build, and the owner's PPA rule (settlement only on delivered energy). The Opus review found the engine correct and fixed three text and robustness items (hedge present-value sign, ASCII-only hosted page, a record note); GitHub CI found, and this branch fixes, a sideways scroll on the Site tab at 375 px with the Linux default font. `npm test` 44/44, `npm run test:browser` 29/29. Owner decisions raised by the review are listed below (5–7).
   - **Packaging:** done for Windows and phone (see "Launchable app"). Merged to `main`.
2. **Rest of the trade-off views (stage 3):** parallel coordinates with brushing, choice-impact chart, option card, compare view, phasing timeline, schematic, key quantities.
3. **Verification tier (stage 4):** representative-day screening, background 8760-hour verification of the top 10, dispatch visualisations.
4. **Uncertainty and sensitivity (stage 5):** ranges, Monte Carlo, rank stability, robust pick, tornado, breakevens, scenarios.
5. **Plain-English summary, flags register, exports (stage 6).**
6. **Polish (stage 7):** manual layout editing, 2.5D massing, online map tiles, custom profiles, screen-reader audit, performance tuning.

## Decisions for the owner (defaults in use until decided)

1. **No-backup option whose on-site plant meets every requirement item:** "Does not meet" (default) or "Meets with flags".
2. **Contracted grid capacity below the offer (open question 18):** default is the full offer for every option, at the same connection cost.
3. **Brief open questions 1–17:** proposed defaults are in use (`brief-v2/OPEN-QUESTIONS.md`).
4. **Cost axis when an option delivers almost nothing (Brief issue 21, found on T3):** grid-dependent options on a no-grid site deliver almost no energy, and a financially settled PPA gives them net revenue, so their LCOE is negative or infinite and the cost axis stops separating the other 1,844 options. **Decided by the owner on 2026-10-18: no PPA income without physical delivery.** PPA settlement counts only on delivered energy; settlement on undelivered volume is reported as a separate hedge line outside the cost ledger and the score. Implemented and verified in the port slice (test 11a).

5. **PPA options that can never deliver (Opus review O1).** Recorded as decided on 2026-10-21 (owner's debate): flag the PPA that cannot be delivered (no grid) and prefer the no-PPA option. Options were: keep (A); treat as not applicable (B); flag and break ties toward no-PPA (C). Chosen: flag and prefer no-PPA (the owner's O1 rule). The code change is not yet made. `verification/port/OPUS-review.md` section 7.1.
6. **Carbon metrics and undelivered PPA volume (O2).** Recorded as decided on 2026-10-21: the carbon-free score uses hourly matching (PPA counted only against grid energy used in that hour), which is option (B). The code change is not yet made. Section 7.2.
7. **`grid-ppa` flag headline (O3).** "PPA limited by import capacity" shows on 753 T1 options where only 0.002–0.5 % of the undelivered volume is import-limited. Options: keep (A); headline follows the larger part with a threshold (B); two separate flags (C). Section 7.3.

Interpretations taken without asking (reversible, recorded in `app/BUILD-NOTES.md`):
- The highlighted Pareto pick follows rank 1, the same option as the header leader, so acceptance criterion 5 holds with "Rank requirement-compliant options first" on or off.
- A block over the height limit makes an option "Fits with flags", not "Does not fit": constraints are flagged, not enforced (principle 5), and acceptance criterion 7 depends on it (Brief issue 18).

## Known open items

- Packaging Opus review not done (usage limit). Resume it, or run a fresh one, before further packaging work.
- Screen-reader walk-through (NVDA, VoiceOver) not done yet.
- A run takes about 9–10 s for 2,000 options, because every option runs the full 8760-hour model. The brief's speed targets need the representative-day tier (stage 4). The owner has said speed is not a priority for now.
- Weight-change repaint measured 96–166 ms in the sandbox (brief target ≤ 100 ms on the reference machine); the browser check fails above 300 ms to catch regressions.
- Stage 2 gaps deferred: carport PV block, roads allowance driven by access points, image underlay, footprint override, heat-reuse blocks. The gas-pipe rate (€0.8 m/km) is a judgement value.
- Some core run constants have no §18 default record yet.
- No default has a verified source: every one is labelled "indicative — unverified".

## How to run

```
cd app
npm install
npm test               # Node test suite
npm run build          # writes dist/, including energy-tool-single-file.html
npm run test:browser   # needs Playwright and Chromium; skips with a message if absent
```

## Working rules

- Builder and reviewer: Claude Opus 5.5. Verifier: Claude Haiku 5.5. After every three Haiku checks, one Opus review.
- Work goes to feature branches. Nothing is merged to `main` without the owner.
- This file is updated after every completed step.
