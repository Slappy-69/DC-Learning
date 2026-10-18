# Status: concept-design energy strategy tool

Checkpoint updated after every completed step, so any session can resume from here.
Last updated: 2026-10-17.

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
| `feature/site-layout` | Site slice (brief stage 2), stacked on the branch above | Verified (Haiku ×3 + Opus), 2026-10-17 |
| `feature/port-concept-line` | Dispatch tab, tornado sensitivity, bridging-battery timing fix and hosted-page build, ported from the other line onto this one | Next |
| `concept-sensitivity-tab`, `concept-site-layout` | Parallel work by another session, built on the unverified `main` | Left untouched at the owner's choice (2026-10-17); their useful parts are being ported. Delete when the port is merged |

Branches are stacked: merging the newest one into `main` brings in everything below it.

## Built and verified

| Slice | Verification | Tests |
|---|---|---|
| Core: inputs, 8760-hour dispatch, option generator, scoring, ranked list | Haiku ×3 + Opus | Included below |
| Trackable run log (12 stages, JSON/CSV export, progress panel) | Haiku ×3 + Opus | Included below |
| Single-file build with inline worker and fallback/watchdog | Haiku ×3 + Opus | Included below |
| Pareto trade-off view | Haiku ×3 + Opus, 2026-10-16 | `npm test` 22/22; `npm run test:browser` 13/13; axe 0 serious/critical (light and dark) |
| Site (stage 2): geometry kernel, site model with T2/T4, blocks, auto-layout, site-fit outputs, Site tab with plan, boundary drawing, GeoJSON/KML import, small multiples | Haiku ×3 + Opus, 2026-10-17 (0 invariant violations in 8,000 independently checked layouts) | `npm test` 32/32; `npm run test:browser` 21/21; axe 0 serious/critical; phone shows results first |

## Next

1. **Port from the other line:** Dispatch tab (phasing timeline, hourly dispatch, annual balance), tornado sensitivity tab, bridging-battery timing fix, hosted-page build and loading message. Then update the published artifact "Concept Energy Optioneering" in place so it opens on a phone.
2. **Rest of the trade-off views (stage 3):** parallel coordinates with brushing, choice-impact chart, option card, compare view, phasing timeline, schematic, key quantities.
3. **Verification tier (stage 4):** representative-day screening, background 8760-hour verification of the top 10, dispatch visualisations.
4. **Uncertainty and sensitivity (stage 5):** ranges, Monte Carlo, rank stability, robust pick, tornado, breakevens, scenarios.
5. **Plain-English summary, flags register, exports (stage 6).**
6. **Polish (stage 7):** manual layout editing, 2.5D massing, online map tiles, custom profiles, screen-reader audit, performance tuning.

## Decisions for the owner (defaults in use until decided)

1. **No-backup option whose on-site plant meets every requirement item:** "Does not meet" (default) or "Meets with flags".
2. **Contracted grid capacity below the offer (open question 18):** default is the full offer for every option, at the same connection cost.
3. **Brief open questions 1–17:** proposed defaults are in use (`brief-v2/OPEN-QUESTIONS.md`).
4. **Cost axis when an option delivers almost nothing (Brief issue 21, found on T3):** grid-dependent options on a no-grid site deliver almost no energy, and a financially settled PPA gives them net revenue, so their LCOE is negative or infinite and the cost axis stops separating the other 1,844 options. **Decided by the owner on 2026-10-18: no PPA income without physical delivery.** PPA settlement counts only on delivered energy; settlement on undelivered volume is reported as a separate hedge line outside the cost ledger and the score. Being implemented in the port slice.

Interpretations taken without asking (reversible, recorded in `app/BUILD-NOTES.md`):
- The highlighted Pareto pick follows rank 1, the same option as the header leader, so acceptance criterion 5 holds with "Rank requirement-compliant options first" on or off.
- A block over the height limit makes an option "Fits with flags", not "Does not fit": constraints are flagged, not enforced (principle 5), and acceptance criterion 7 depends on it (Brief issue 18).

## Known open items

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
