# Dispatch slice: independent Haiku check and disposition

- **Slice checked:** commit f236acc on `concept-site-layout` (Dispatch tab, `src/engine/inspect.js`, `src/components/StackChart.jsx`, `src/components/DispatchView.jsx`).
- **Verifier:** Claude Haiku 5.5, run as a separate agent that had not seen the build. It was told not to modify the repository. Its scripts are in `scripts/verify/`.
- **Date:** 2026-10-16.
- **Review of the findings:** Claude Opus 5.5 (the builder). One Haiku check followed by one Opus review, not the full three-check cycle.

## Report (verbatim)

**Verification of f236acc (Dispatch tab)**

**1. npm test:** PASS. 22/22, exit 0. Test 12 covers inspect.js. No tracked file changed; the run rebuilt untracked `app/dist/`.

**2. Numeric check:** PASS. Leader O1YAUJ8J. Year index 2 rebuilt from engine arrays: in = out = 243,350.53 MWh, residual 0, unmet 647.61, PPA 149,952.40, gridLoad 85,329.47, gridCharge 0. All equal inspectOption (diff 0). Year 3 is the only year with unmet load, so it is the argmax and the UI default. The unmet preset is week 24 (hours 3864–4031, 127.27 MWh), matching a brute-force scan of 52 windows from hour 0.

**3. Edge cases:** PASS. Islanded (T3 #1), battery (T1 #8, 28.3 MW / 56.5 MWh), no PPA (T1 #110), zero-load year 1, plus flex, CHP, export, bessSolar and exceedance: no exception, NaN or negative; grid+firm+bess = supply every month; balances match engine counters within 4e-10 MWh; hourly residual ≤ 2.8e-14 MWh.

**4. Review findings**

1. **MEDIUM.** Phasing and dispatch disagree on bridging-battery availability. `evaluate.js:24-27` counts the bridging BESS from month 0. `dispatch.js:89,97` gate it to `avail('bess')` = 21 months when C12 ≠ none. Islanded bessSolar with a 2h25 battery shows "First power month 0 · Full load month 0 · Power gap none", yet dispatch has no battery discharge before month 21 and 8,252 MWh unmet in month 18, the first load month. Pre-existing (f236acc does not touch these files). Which side is intended is unconfirmed; the comment at `dispatch.js:96` matches the phasing view.
2. **LOW.** `inspect.js:65` maps hours 8736–8759 to week 52, whose window ends at 8735 (`inspect.js:57-59`). Latent: 0 of 24,004 year records in the full T1 and T3 runs. The unmet and curtailment presets also skip those hours (`inspect.js:69-82`).
3. **LOW.** `DispatchView.jsx:255` says "in merit order from the bottom", but PPA sits in the top band with grid (`:61`, `:240`).
4. **LOW.** The "Battery MW" column (`DispatchView.jsx:193,196`) holds bridging battery only (`inspect.js:116`). The main BESS is absent and unlabelled.
5. **LOW.** `App.jsx:163` unmounts the tab, so option, year and week reset on every switch.
6. **LOW.** Clearing the week box sets week 1 at once (`DispatchView.jsx:222`).

**No defect found:** StackChart paths for the three bands and the line match hand-derived geometry (`StackChart.jsx:51-61`). Hover and key indices stay in range. Tooltips clear on week change. Hook order is valid. Units are correct. Every CSS class and token used exists. In jsdom with React 18.3.1, the real components rendered about a dozen option and year states and about 40 interactions with no NaN or undefined text. No browser was available, so layout and paint are unchecked.

## Disposition (Opus review, fixed in e1161ce)

| # | Severity | Verdict | Action |
|---|---|---|---|
| 1 | Medium | Confirmed, and wider than reported. Dispatch was inconsistent with itself: the bridging battery was available from month 0 without a main battery and from month 21 with one. BRIEF §9.8 sets each source's supply-available date from its planning, procurement and construction. | One rule, `techAvailMonth` for the BESS technology, now drives sizing (`bridgeBess.availMonth`), time-to-power and dispatch. Test 13 added. Effect is in `README.md` § Battery timing fix. |
| 2 | Low | Confirmed | Week 52 now runs to the end of the year (192 h). Test 12d checks that the weeks cover all 8,760 hours. |
| 3 | Low | Confirmed | Caption now gives the stacking order and says PPA sits in the grid band. |
| 4 | Low | Confirmed: the column is bridging battery only, by design (time-to-power counts only the bridging battery) | Column renamed "Battery bridging MW", matching the chart legend. |
| 5 | Low | Confirmed | Not changed. Inactive tabs unmount; recorded in `app/BUILD-NOTES.md`. |
| 6 | Low | Confirmed | Week box keeps the typed text and applies only a valid week. Browser-checked: clearing leaves the box empty, typing 24 and 52 applies them, and week 52 shows days 358 to 365. |

The layout and paint that the verifier could not check were covered by the builder's headless-Chromium runs (`scripts/browsercheck/check-dispatch.cjs`): desktop light and phone dark, no console errors, 0 px horizontal scroll at 390 px, keyboard and pointer readouts working.
