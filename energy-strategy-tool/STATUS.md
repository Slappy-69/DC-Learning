# Status: concept-design energy strategy tool

Checkpoint updated after every completed step, so any session can resume from here.
Last updated: 2026-10-16.

## Where to look

- **Brief (authoritative):** `brief-v2/BRIEF.md`, with `CHANGELOG.md`, `ASSUMPTIONS.md`, `OPEN-QUESTIONS.md`.
- **App source and build notes:** `app/`. `app/BUILD-NOTES.md` is the reference for defaults, gaps, decisions and test output.
- **Phone / offline build:** `energy-tool-single-file.html`. Open it directly in a browser; no setup.
- **Verification record:** `verification/HISTORY.md`, plus one folder of reports per slice.

## Branches

| Branch | Contains | State |
|---|---|---|
| `main` | Brief v2, core, run log, single-file build, Pareto view (484a042) | Pareto unverified on main |
| `feature/pareto-verification` | Pareto view verified and fixed, verification reports, this file | Not merged; the owner merges |
| `feature/site-layout` | Site slice (brief stage 2), stacked on the branch above | In progress: work-in-progress checkpoints, unverified |

Branches are stacked: merging the newest one into `main` brings in everything below it.

## Built and verified

| Slice | Verification | Tests |
|---|---|---|
| Core: inputs, 8760-hour dispatch, option generator, scoring, ranked list | Haiku ×3 + Opus | Included below |
| Trackable run log (12 stages, JSON/CSV export, progress panel) | Haiku ×3 + Opus | Included below |
| Single-file build with inline worker and fallback/watchdog | Haiku ×3 + Opus | Included below |
| Pareto trade-off view | Haiku ×3 + Opus, 2026-10-16 | `npm test` 22/22; `npm run test:browser` 13/13; axe 0 serious/critical (light and dark) |

## Next, in the brief's build order (§20)

1. **Site (stage 2):** boundary draw/import, setbacks, exclusions, height limit, building massing, plant blocks and auto-layout, site-fit status, area budget, 2D plan, small multiples. In progress. Checkpoint 2026-10-16 evening: S1 geometry, S2 site model with T2/T4 fixtures, S3 blocks and S4 auto-layout done (`npm test` 27/27); S5 site-fit integration partly done; S6 views (2D plan, site input UI, small multiples) not started. Builder's own progress notes: `app/SITE-PROGRESS.md`. Stopped twice by the plan's usage limit and resumed.
2. **Rest of the trade-off views (stage 3):** parallel coordinates with brushing, choice-impact chart, option card, compare view, phasing timeline, schematic, key quantities.
3. **Verification tier (stage 4):** representative-day screening, background 8760-hour verification of the top 10, dispatch visualisations.
4. **Uncertainty and sensitivity (stage 5):** ranges, Monte Carlo, rank stability, robust pick, tornado, breakevens, scenarios.
5. **Plain-English summary, flags register, exports (stage 6).**
6. **Polish (stage 7):** manual layout editing, 2.5D massing, online map tiles, custom profiles, screen-reader audit, performance tuning.

## Decisions for the owner (defaults in use until decided)

1. **No-backup option whose on-site plant meets every requirement item:** "Does not meet" (default) or "Meets with flags".
2. **Contracted grid capacity below the offer (open question 18):** default is the full offer for every option, at the same connection cost.
3. **Brief open questions 1–17:** proposed defaults are in use (`brief-v2/OPEN-QUESTIONS.md`).

Interpretation taken without asking (reversible): the highlighted Pareto pick follows rank 1, the same option as the header leader, so acceptance criterion 5 holds with "Rank requirement-compliant options first" on or off. Recorded in `app/BUILD-NOTES.md`.

## Known open items

- Screen-reader walk-through (NVDA, VoiceOver) not done yet.
- A run takes about 9–10 s for 2,000 options, because every option runs the full 8760-hour model. The brief's speed targets need the representative-day tier (stage 4). The owner has said speed is not a priority for now.
- Weight-change repaint measured 96–130 ms in the sandbox (brief target ≤ 100 ms on the reference machine).
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
