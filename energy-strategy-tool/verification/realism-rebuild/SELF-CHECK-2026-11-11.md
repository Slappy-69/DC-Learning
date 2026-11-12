# Realism rebuild: checks run by the builder (2026-11-11)

Branch `feature/realism-rebuild`. Builder: Claude (this session's model, Claude Fable 5.2).

**No Haiku check and no Opus review were run.** The working rule (Haiku verifier, Opus review after three checks) needs helper sessions. The session's rules allow those only when the owner asks, and the owner's instruction for this work did not ask. This file records what was checked instead, so a later round can start from it.

## What was run

| Check | Result |
|---|---|
| Node suite, one run (`node tests/run-tests.mjs`) | 121 of 121. Tests 1 to 66 (108 checks) run with the rebuild off: the engine as merged on 2026-11-11. Tests 67 to 79 turn it on |
| Test 77 | With the rebuild off, a run has the same option keys, LCOE, scores and ranks as a run that never knew the setting |
| Test 78 | Outside the suite the rebuild is on: every T1 option balances hour by hour (largest error below 1e-6), none has a power gap, each has a tier and building dates |
| Test 79 without the fix for known issue 40 | Fails (the takeover option loses its takeover context), so the test guards the fix |
| Browser checks, in four parts (Chromium 153, Playwright 1.63, axe-core 4.10.2) | 44 of 44. B44 is new: header, plan check, cards, detail, axe in light and dark |
| Study runs with the rebuild on | Pego 261, 500 and 900 MW IT; Eemshaven 750 MW. Figures in `docs/REALISM-REBUILD-2026-11-11.md` |

## Faults found by these checks and fixed

1. Known issue 40: takeover options dispatched on another option's grid (found on the Eemshaven run: 859 options "not adequate"; 40 after the fix, each an islanded campus on a plant that closes).
2. Building dates chased the hire date of leased plant by one month (240 to 336 Pego options "not adequate"): hired plant now counts from its earliest month.
3. A building "fitted" at the end of the timeline because its ramp ran past it: the full load is checked at the last month.
4. Bridging units bought with nothing to bridge; top-up units bought with no shortfall; names that listed plant that was not there.
5. The environmental assessment listed twice on one option; 1,485 fuel-cell modules counted as "engines".
6. The delay axis on a relative scale made three months on one building worth about €28/MWh: fixed scales.
7. Standby wait taken from gensets that were not bought.
8. Browser: the "Late" badge below the contrast minimum in the dark theme; eight summary parts (BRIEF §14 says seven); the phone header past 1,000 px.

9. (2026-11-12, before the merge) GitHub's runner failed B19: its font (DejaVu Sans) is wider, and the phone header pushed the first content to 1,012 px. Fixed; the browser groups were re-run here with DejaVu Sans swapped in, 44 of 44.
10. (2026-11-12) B38 took up to 364 ms against its 300 ms bound here: two number helpers built a new formatter on every call. Fixed: 140 to 146 ms.

## What a Haiku or Opus round should look at first

- The arithmetic of one option by hand: building dates, stepped capex, delay metric, buildability points (T1, rebuild on).
- The records against the code: OPEN-QUESTIONS 247 to 255, `app/BUILD-NOTES.md`, the new defaults and their sources (each link opened).
- The country rules (`app/src/engine/dcrules.js`) against `docs/research/data-centre-rules-2026-11.md` and the sources.
- The judgement thresholds (25 km, 5 km, 25 % land, 60 units, 24 and 60 months, 50 MW of gas, 6 and 30 points).
- Whether any option changes when the rebuild is off (test 77 covers 120 T1 options only).
