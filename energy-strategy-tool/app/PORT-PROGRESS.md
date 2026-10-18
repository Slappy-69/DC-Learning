# Port slice progress (port from the concept line + owner decision on PPA, 2026-10-18)

Read this first if resumed. Task: port the other line's tornado, loading message / startup errors / hosted page,
Dispatch tab and bridging-battery timing fix onto this verified line, and implement the owner decision of 2026-10-18
(no PPA income without physical delivery). Spec: `/home/claude/build/brief-v2/BRIEF.md` (read-only). No git commands.
Source (read-only): `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/other-line/energy-strategy-tool/app/`
and `git -C /home/claude/dc-learning show <hash>` (f1fd5c5, e9ed8f6 + c3f81f5, f236acc, e1161ce).

Baseline (this line before the port, 32/32 Node, 21/21 browser): copied to
`/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/port/baseline/app/` (no node_modules; the engine
imports nothing outside src/engine). Snapshot and compare scripts: `scratchpad/port/snap.mjs`, `scratchpad/port/cmp.mjs`;
baseline snapshots in `scratchpad/port/snaps/base-*.json` (T1, T3, and both with C2 BESS + solar included).

## Status: complete (2026-10-18)

Final run: `npm run build` exit 0 (single file 791.0 KB, hosted page 790.9 KB); `npm test` 44/44 (32 existing + 12 new:
10, 11a, 11b, 12a–12e, 13a–13c, 14); `npm run test:browser` 29/29 (B1–B21 unchanged + B22–B29). Write-up: BUILD-NOTES.md,
"Slice: Port from the concept line (2026-10-18)", with the test run, judgement calls and open points.

| Item | State | Files | Tests after |
|---|---|---|---|
| 0 Read brief, both lines, baseline copy and snapshots | done | — | baseline 32/32 |
| 1 Bridging-battery timing (e1161ce) | done | engine/sizing.js (techAvailMonth exported, bridgeBess.availMonth + sentence), engine/dispatch.js (bessAvailM = techAvailMonth for all battery capacity; bessSolar override removed), engine/evaluate.js (time-to-power counts the bridging battery from availMonth; BESS capex and FOM year = BESS availability year for every option, bridging battery included — judgement call), engine/index.js (exports); tests/port-tests.mjs (new, test 10), tests/run-tests.mjs (calls it) | build OK; npm test 33/33 |
| 2 PPA physical delivery (owner decision) | done | engine/dispatch.js (ppaUndeliveredMWh, ppaUndeliveredSpotValue at the wholesale price replace ppaResaleValue; hourly solar, wind, ppaContract and per-plant records), engine/evaluate.js (ledger PPA line = delivered × (strike + shaping); eco.ppaHedge outside the ledger with byYear/total/pv; grid-ppa flag explains the hedge, minor if import-limited else info; reconciliation.pvEnergy), components/OptionDetail.jsx (PpaHedgeRow + note); tests/port-tests.mjs (11a, 11b) | build OK; npm test 35/35 |
| 3 Dispatch tab (f236acc + e1161ce) | done | engine/option.js (new, evaluateOption), engine/inspect.js (new), engine/evaluate.js (allOptionFlags, unmetSummary shared with run.js), engine/run.js (uses them), engine/context.js (buildContext(inputs, { site })), engine/index.js, engine/blocks.js (SOURCE_OF_TECH exported); components/StackChart.jsx (new), components/DispatchView.jsx (new), site/SitePlan.jsx (Pattern exported), SiteView.jsx (siteFor exported), OptionDetail/RankedList/ParetoView ("Show this option's phasing and hourly dispatch"), App.jsx (Dispatch tab, dispatchOptionId), styles.css (sc-*, dv-*, --src-curtail); tests/view-bundle.mjs (getViewBundle moved out of run-tests.mjs, + renderDispatch), tests/port-tests.mjs (12a–12e) | build OK; npm test 40/40 |
| 4 Tornado tab (f1fd5c5) | done | engine/sensitivity.js (new), components/SensitivityView.jsx (new), engine/scoring.js (axisScore, SCORE_KEYS), engine/context.js (reads utilities.gasPrice and economics.carbonPrice; ctx.gasCommodity), engine/defaults.js (sensitivity.* records; isAtDefault for "by country"), Field.jsx (placeholder; records filled on first use), InputsPanel.jsx (gas and carbon price fields), App.jsx (Sensitivity tab, sensOptionId), styles.css (tor-*, sens); tests/port-tests.mjs (13a–13c), tests/view-bundle.mjs (renderSensitivity) | build OK; npm test 43/43 |
| 5 Loading message, startup errors, hosted page (e9ed8f6 + c3f81f5) | done | index.html (loading message in #root, noscript, startup handler), build.mjs (__HOSTED__, dist/energy-tool-hosted.html), components/RunProgress.jsx (copy + select fallback; download dropped at build time), styles.css (boot, rp-copy*); tests/run-tests.mjs (test 7: two inline scripts), tests/port-tests.mjs (14), tests/browser-tests.mjs (B28, B29) | build OK; npm test 44/44; browser B28, B29 pass |
| 6 Tab bar (5 tabs) | done | App.jsx (Home/End, selected tab scrolled into view in the list), styles.css (.tabs scrolls sideways, inset baseline, inset focus ring); tests/browser-tests.mjs (B24, B25) | browser B24, B25 pass |
| Browser checks for items 3 and 4 | done | tests/browser-tests.mjs (B22 Dispatch at 375 px, B23 Sensitivity at 375 px, B26/B27 axe light/dark on both tabs) | browser B22, B23, B26, B27 pass |
| Finish (build, tests, browser, BUILD-NOTES, this file) | done | BUILD-NOTES.md (slice section + in-place updates), this file | build exit 0; npm test 44/44; npm run test:browser 29/29 |

## Item results kept for BUILD-NOTES

Item 1 (snapshots scratchpad/port/snaps, compare with cmp.mjs): default T1 and T3 bit-identical (no BESS + solar options by default).
T1 + C2 BESS + solar: 413 bridging-battery options (278 with a main battery, 135 without); BESS month 21; leader OOB3CL1 unchanged
99.7048 → 98.9963, top 10 same order; 270 options get a later full load (max 21 months), 168 a later first power; 1,745 ranks move
(max 1,262: O10WQVLG, no main battery, was full load month 0); capex-timing part alone: LCOE of all 413 changes (max −12.8 %, islanded
battery-only options), leader LCOE 445.1 → 416.4 €/MWh, leader score identical either way. T3 + BESS + solar: leader O114KGKR unchanged
73.7173 → 73.1602, top 10 same set (ranks 5/6 swap), 413 options later time-to-power, 1,827 ranks move (max 673).
Engine copies for the breakdown: scratchpad/port/item1-full/engine, scratchpad/port/item1-nocapex/engine.

Item 2 (snapshots i2-*): T1 leader O1YAUJ8J unchanged 85.9642 → 92.7124 (scores rescale: cost axis min 93.6 → 151.8 €/MWh); LCOE
133.50 → 153.77 €/MWh, PPA ledger €311.9 m → €574.2 m (most of the difference is the non-commodity adder the old rule credited on
4.48 TWh never delivered; hedge +€16.2 m, PV €7.8 m); top 10 different set (out: O1VA67D3, OV4UD3O, ORCKDL0, O1QWIDO; in: O6FDBB2,
O1OSKM4K, OUTRYDE, O12DDOCS); 1,990 ranks move (max 865); LCOE of all 1,113 PPA options changes (max +42 %); flag membership unchanged
(all 1,113 PPA options already had grid-ppa, all minor). T3: leader O1Q4ILX5 → O826DRQ (both "Islanded rented … CHP-trigen", PPA hybrid
100 % with BESS 2 h → PPA hybrid 50 % without BESS; top 10 tied at 97.114); LCOE negative 80 → 0, non-finite 26 → 26; cost axis
−1.38e7..4.61e6 → 157.3..4.61e6 €/MWh; options with LCOE 0–1,000: 1,844 within 0.004 pts → 1,866 within 0.013 pts (99.987–100.000):
still squashed, now by near-zero-delivery options at the top (O13FMGZ0 26 MWh delivered, 4.6e6 €/MWh). T1+BESS+solar and T3+BESS+solar
in snaps/i2-*-bess.json (T3+bess: negative 77 → 0).

Item 3 palette (scratchpad/port/palette.mjs, palette.txt): as the plan's source colours co-occur in the dispatch charts on T1/T3,
light mode passes the hard gates for every set except [hydrogen, grid] (2 options; blue–violet), with CVD in the 6–8 warn band for
red–aqua (6.9) and red–green (7.2); dark mode fails the normal-vision floor for fuel cells vs battery (ΔE 11.9), gas vs solar (13.0)
and hydrogen vs grid (9.8). Decision: firm plant bands (and wind) carry their plan hatch; the plain colours solar, battery and grid
pass all pairs in both themes (light CVD 9.1 / normal 22.9, contrast relief for yellow 2.17 and aqua 2.82; dark CVD 8.4 / normal
19.8); 1.5 px surface gaps, merit-order position, legend, readout and tables carry identity too. Curtailment neutral first #898781
(ΔE 14.5 light / 12.6 dark from the battery colour it touches), re-stepped to #6f6d68 light / #b9b7b0 dark (≥ 15 from battery, grid
and solar in both themes; 5.17:1 / 8.05:1 on the surface). Unmet/power-gap strip in --bad (8.15:1 / 8.03:1), never beside a band.

Item 4: T1 leader tornado: IT load 21.65 pts, grid date 8.33, grid price 5.53 …; T3 leader: every swing 0.00 pts (the squashed T3 cost
axis hides LCOE moves: e.g. gas price moves LCOE 166–222 €/MWh). Browser: 15 re-runs in 0.7–1.1 s, one long task (179 ms) on the phone run.

## Next step
None: the slice is complete. Open points for the owner are listed in BUILD-NOTES.md, "Slice: Port from the concept line
(2026-10-18)", "Open points" (T3 cost axis still compressed after the PPA decision; time-to-power counts battery MW without regard
to MWh; three dark-mode source-colour pairs below ΔE 15; on-demand re-runs on the main thread; tornado drivers beyond seven).
