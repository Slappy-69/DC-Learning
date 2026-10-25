# Build plan: the walkthrough changes

The owner's walkthrough of 2026-10-21 agreed a set of changes to the tool. This plan breaks them into work packages in the order recorded in the project's handoff note at the end of the walkthrough (`claude/handoff-concept-tool.md` in the owner's Claude project); **The owner confirmed this order on 2026-10-22** (as recorded, 0 to 10) and asked to start package 0. Take the packages in order unless the owner says otherwise.

The specification is `../brief-v2/BRIEF.md` (revision 5). Each package below lists the brief sections, the open questions to ask the owner first, the acceptance tests (brief §21) and the user-guide chapters and mock-ups that show the agreed design. The working rules are in `../../CLAUDE.md`.

## For every package

1. **Read** the brief sections listed, the open questions listed (`../brief-v2/OPEN-QUESTIONS.md`), `KNOWN-ISSUES.md`, and the user-guide chapters listed (`user-guide/src/`). Open the mock-ups listed in a browser (`user-guide/mock/*.html`); they are drawings of the agreed screens, and their layout and wording are illustrative.
2. **Ask the owner** the listed open questions, **one question per message**, in plain words, with the options and what each would mean. Do not assume an answer. Record each answer, with its date, in `OPEN-QUESTIONS.md` and the brief.
3. **Branch** from `main`: `feature/<short-name>`. Push it as work progresses. GitHub runs the checks on every push to a `feature/` branch.
4. **Build and test.** `npm test` and `npm run test:browser` in `app/` must pass. Add tests for each acceptance test listed. Compare T1 results with the "before" export in `user-guide/data/` (a full T1 run of 2026-10-21) and explain every difference.
5. **Verify** (the owner's rule): builder and reviewer Claude Opus, verifier Claude Haiku; after every three Haiku checks, one Opus review. Reports go in `../verification/<package>/` and a line in `../verification/HISTORY.md`.
6. **Record**: update `../STATUS.md` after every completed step, `../app/BUILD-NOTES.md` for defaults, decisions and test runs, and the user guide (move the feature from "Agreed" to "Built", replace its mock-up with a screenshot of the program, update the status table in chapter 56). Rebuild the EPUB and PDF only when the owner asks (`user-guide/README.md`).
7. **Ask before merging** into `main`. Explain what changed in plain words.

## Work packages

### 0. Research the defaults before the first release

- **Goal:** every value labelled judgement or indicative gets a source, year, link and access date, or stays labelled "judgement" with a reason.
- **Scope:** the research list in the decision log (`walkthrough-decisions-2026-10-21.md`, "Open research before first release"); the defaults that chapter 50 of the user guide marks "update suggested" (UK carbon price, hydrogen price, exchange rates, wholesale prices for seven countries, grid carbon for 19 countries, roof PV O&M, battery and gas-turbine capex, wind PPA, genset unit size and lead time, SMR) and the basis for grid carbon; the new country tables (grid availability, connection time, connection capex); the data sources in brief §18.
- **Start from:** user guide chapter 50 (important defaults compared with published values on 2026-10-21, with sources), Appendix B (country data against Ember 2025, wholesale prices and ECB rates), chapter 52 (data sources and APIs), chapter 53 (licences), chapter 59 (references).
- **Ask the owner:** propose each change of a default with its source; the owner approves before the default changes. OPEN-QUESTIONS 26 (density rule) is part of this research.
- **Acceptance:** AC 9 and AC 15 still pass; every changed default has a filled §18 record; Appendix A of the guide is regenerated from the registry (`user-guide/tools/make_appendices.py`).

### 1. Map pin and country setup

- **Brief:** §4, §5.1, §10.2, §18. **Acceptance:** AC 17.
- **Decisions:** location by a pin on a map bundled with the program (OpenStreetMap data in Protomaps PMTiles format, all of Europe, roads level); country from the pin, shown and editable; currency per site from a fixed list; nearest ASHRAE design station named with its distance and flagged; hourly weather from NOAA station records cleaned into a usable year by the app (method to research), or an uploaded EPW file.
- **Ask the owner:** the map licence, attribution and file size found in research (the size adds to the 370 MB program); the ASHRAE licence result; whether weather processing (NOAA cleaning) belongs here or in package 0.
- **Watch:** the Windows program must still make no network connection (packaging check D12 traces every process); the map must load from the program's own files.
- **Mock-up:** `m01-location`. **Guide:** chapters 2, 14, 52, 53.
- **Progress:** built 2026-10-23 on `feature/input-model` (with packages 2 and 8), not merged: OPEN-QUESTIONS 63–65 answered with Claude's recommendations (Natural Earth outlines bundled, ASHRAE not bundled and flagged, weather processing moved to package 0); AC 17 tested. Not built: roads on the map, editable exchange rates, NOAA/EPW weather.

### 2. Input model with flagged defaults (and the Beta switch)

- **Brief:** §2 principles 3 and 10, §3, §5 (all sections), §12.12, §15 "Assumed defaults". **Acceptance:** AC 16, AC 27.
- **Decisions:** only the location and site area are required; the IT load can be estimated from area; the grid values can be "Not known" (country defaults); every value not entered raises an "assumed default" flag on each option that uses it, with its source; an economics section (evaluation periods, WACC with its plain explanation, latest carbon and gas prices with dates, escalation forecasts, revenue options off, currency); the cooling type chosen by the engineer with a typical PUE and maximum demand offered; site area as one number, and the Site tab as Beta (general settings page with the switch, off by default; Beta label; kept out of the ranking and the PDF).
- **Ask the owner:** OPEN-QUESTIONS 21 (which evaluation period scores), 25 (land budget for ground solar and wind with the Site tab hidden), 26 (density rule), 28 (cooling before a choice; comparing types).
- **Started out of order (2026-10-22), on branch `feature/site-tab-beta` while the owner was away ("progress independently on sections without comments"):** the Site tab's Beta switch and AC 27 only. Built: the general-settings switch, the Beta label, site fit out of the ranking, "compliant first" and dominance, and out of the main views when off. Not started: everything else in this package, which waits for its open questions.
- **Code before 2026-10-22:** "Rank requirement-compliant options first" also counted "Does not fit" (`app/src/engine/scoring.js`, `isRequirementCompliant`), and the site layout runs in every run and sets the land for ground solar. With the Site tab as Beta, site fit must not count in the ranking (AC 27); how ground solar gets its land without the layout is OPEN-QUESTIONS 25.
- **Mock-ups:** `m02-knowledge-levels`, `m05-economics`, `m10-settings`. **Guide:** chapters 14–19, 28, 30, 32, 42.
- **Progress:** built 2026-10-23 on `feature/input-model` (from `feature/grid-contract`), not merged: OPEN-QUESTIONS 21, 25, 26, 28 answered with Claude's recommendations (accepted in advance by the owner); AC 16 tested; KNOWN-ISSUES item 6 resolved. Not built: country values for "Not known" grid inputs and dated prices (package 0), currency (package 1), typical PUE beside the cooling input.

### 3. Contracted grid capacity and the fixed grid connection charge

- **Brief:** §5.4, §9.2, §9.4, §9.5. **Acceptance:** AC 14, AC 18.
- **Decisions:** each option has its own contracted grid capacity, set by the engineer (its import limit); one fixed grid connection charge, the same for every option; grid connection capex and reinforcement default 0 with the country value shown for reference, flagged as assumed. Brief revision 5 reads the charge and the capex as one; whether they are is part of OPEN-QUESTIONS 20.
- **Ask the owner:** OPEN-QUESTIONS 19 (how the capacity is set for generated options), 20 (how the charge is entered; islanded options at 0 MW).
- **Code today:** grid connection in `app/src/engine/sizing.js`; the import limit in `dispatch.js` (shared offered profile); the connection capex in `evaluate.js` line 99 (`KNOWN-ISSUES.md` item 7).
- **Guide:** chapters 9, 17, 19, 35, 37, 39.
- **Progress:** built 2026-10-23 on `feature/grid-contract` (from `feature/results-cards`), not merged: OPEN-QUESTIONS 19 and 20 answered with Claude's recommendations (accepted in advance by the owner), 50 built; KNOWN-ISSUES item 7 resolved. AC 14 and AC 18 tested. Not built: editing one option's contracted capacity after the run.

### 3b. Power adequacy (added by the owner, 2026-10-22)

- **Decision:** OPEN-QUESTIONS 37 (the tool's main question: maximise IT load with up to five nines of availability) and 38 (power adequacy first).
- **Scope:** adequacy status per option and an adequacy-first ranking (an owner-made exception to principle 5; options are never hidden); a shortfall analysis stage before generation (temporary and permanent shortfall: when, peak MW, MWh, hours, longest event); options sized to close the shortfall (bridging to the peak temporary shortfall; shortfall-sized batteries with a recharge check; shortfall-sized on-site generation); the IT load the contracted grid supports in each period and a "grid-matched phasing" reference option; unmet load shown as MWh, hours, peak MW and longest event, before and after full connection.
- **Answered (2026-10-22, OPEN-QUESTIONS 39–41):** adequacy is tested against peak site demand (full contracted IT at design-day PUE); zero unmet hours, no tolerance; no availability measure (the owner uses a RAMS model). Still open for this package: the owner's points on option 1 of the example (bridging plant left idle after the grid arrives: rent for the bridge or retire plant into backup; dual-fuel engines; gas turbines), listed in the example file.
- **Also decided for this package (2026-10-22, OPEN-QUESTIONS 42–48):** both bridging alternatives (rent the bridge and own only the permanent gap; or buy and retire the surplus into backup, dual-fuel on HVO where needed), split by what the option owns after the grid; every technology considered for bridging, including gas turbines; long-lead plant ordered from day one, after a six-month allowance only for plant needing significant environmental permitting (IED, Seveso); a permitting outlook (likely, uncertain, unlikely) for those items; one backup technology per building, mixed across the campus allowed; a site-wide pooled backup option ranked with a "client-perceived risk" deliverability item (minor by default, raisable to major).
- **Background:** worked example `docs/examples/example-5x100MW-2026-10-22.md`.
- **Progress (2026-10-23, branch `feature/adequacy-first`, not merged):** part 1, adequacy status, adequacy-first ranking and dominance, the `adequacy-short` flag, the longest unmet event, the grid shortfall analysis and the screens; part 2, ordering from day one with the six-month permitting allowance (OPEN-QUESTIONS 44, 45, 56, 57); part 3, firm generation sized two ways, baseload and top-up (58); part 4, bridging plant split into a kept share and backup (59), which with rented bridging plus a top-up covers both alternatives of 42; part 5, the permitting outlook (46); part 6, the IT the grid supports by period and the grid-matched phasing reference (38, step 3); part 7, backup per building or pooled (47, 48). Part 8: a battery sized to the permanent shortfall on the design day, with a recharge check, counted as firm supply (60). **Package 3b is built.** Left: country differences in the permitting outlook (research, package 0); independent verification of the branch.

### 4. Flexibility and battery logic

- **Brief:** §5.3 (load shape, demand flexibility, battery response), §5.5 (resilience reserve, backup gensets), §8 C12 and C16, §9.2, §9.4, §9.7. **Acceptance:** AC 19, AC 20.
- **Decisions:** load shapes (flat, daily fluctuation, AI training, AI inference) with editable defaults and the sub-hour caveat; flexibility off by default with the full parameter set and a historical analysis of trigger hours; battery response sized by default to cover the trigger hours, with the engineer choosing which of battery size, trigger threshold or hours covered is held fixed; batteries split into a resilience reserve (5 minutes of UPS, always kept) and an economic battery; battery capex in the ledger; gensets tested 6 h a year at a separate 75 % test load; optional primary-power hours, dispatched and costed.
- **Ask the owner:** OPEN-QUESTIONS 33 (C12 and the economic battery), 34 (flexibility in the merit order); the AI load-shape defaults found in research.
- **Mock-ups:** `m03-load-flexibility`, `m04-batteries-backup`. **Guide:** chapters 5, 7, 16, 18, 35, 37.
- **Progress:** built 2026-10-23 on `feature/flex-batteries` (from `feature/adequacy-first`), not merged: AC 19 and AC 20; OPEN-QUESTIONS 33, 34, 61 answered. Not built: autonomy from fuel, batteries or a combination (§5.5). The trigger defaults need real price data (package 1).

### 5. The O1–O3 PPA and carbon rules

- **Brief:** §8 C13, §9.6, §11, §15. **Acceptance:** AC 21, AC 22, AC 23.
- **Decisions:** O1, a PPA that cannot be delivered (no grid, islanded) is flagged and the equivalent no-PPA option is preferred; O2, hourly CFE counts PPA energy only against grid energy used in that hour; O3, two `grid-ppa` flags (import-limited, and other undelivered volume above the load), each with its share of the undelivered volume.
- **Ask the owner:** OPEN-QUESTIONS 22 (how O1 works in the ranking).
- **Code today:** the `grid-ppa` flag in `evaluate.js` `optionFlags()`; CFE in `dispatch.js` (`cfeMWh`) and `evaluate.js` `carbon()`; ranking in `scoring.js`. Background: `../verification/port/OPUS-review.md` section 7.
- **Progress:** built 2026-10-23 on `feature/ppa-rules` (from `feature/flex-batteries`), not merged: O1 as rule (k) (OPEN-QUESTIONS 22), O2, O3, and the PPA tick (49, 62); known issue 13 fixed with the owner's approval.
- **Guide:** chapters 12, 40, 42, 44.

### 6. Results cards and the trade-off chart

- **Brief:** §11 (weight-change description), §12, §12.2, §12.11, §16. **Acceptance:** AC 24 (cards and trade-off parts).
- **Decisions:** the results open on the top five cards (scores, LCOE, carbon intensity, resilience, capex, main flags, assumed defaults with sources, up to three pros and three cons, with the comparison set stated); the trade-off chart defaults to cost (vertical) against carbon (horizontal) with resilience as bubble size and colour, either axis switchable; the effect of each weight change described live.
- **Ask the owner:** OPEN-QUESTIONS 24 (which five; comparison set), 29 (screen structure), 30 (run progress), 35 (repaint target); `KNOWN-ISSUES.md` item 5 (identical options).
- **Mock-ups:** `m06-top5`, `m11-tradeoff`. **Guide:** chapters 13, 22, 24, 45.
- **Progress:** built 2026-10-23 on `feature/results-cards` (from `feature/ppa-rules`), not merged: OPEN-QUESTIONS 24, 29, 30, 35 answered with Claude's recommendations (accepted in advance by the owner); KNOWN-ISSUES item 5 handled by "same results as" marks. Not built: the assumed-defaults list on each card (package 2).

### 7. Compare

- **Brief:** §12.7. **Acceptance:** AC 24 (compare part).
- **Decisions:** up to three options side by side, chosen from the cards or the trade-off chart, with a deep-dive card each; headline figures and the choices on which they differ.
- **Mock-up:** `m07-compare`. **Guide:** chapter 25.
- **Progress:** built 2026-10-23 on `feature/results-cards`, not merged: Compare tab, up to three options from the cards, the options table or the trade-off chart.

### 8. Dispatch views (and the screening tier)

- **Brief:** §9.1, §12.13, §17. **Acceptance:** AC 25, and AC 4 (screening against verification within ±5 %).
- **Decisions:** representative-day screening for every option, full 8,760-hour verification for the top options; dispatch views of any period of the year, for verified options only; every figure says which model produced it.
- **Ask the owner:** OPEN-QUESTIONS 23 (representative-day method; number verified).
- **Watch:** this is the largest engine change. The owner's run time today is 15–20 s for 2,000 options; the brief's targets need the screening tier. The Dispatch and Sensitivity tabs re-run an option and check it reproduces the ranking's figures; keep that check.
- **Guide:** chapters 10, 26, 37.
- **Progress:** built 2026-10-23 on `feature/input-model` (with package 2), not merged: OPEN-QUESTIONS 23 answered with Claude's recommendation (optional, off by default; three day types per month; 10 verified); AC 4 (LCOE within ±5 % on T1) and AC 25 tested.

### 9. Tornado

- **Brief:** §13.3. **Acceptance:** AC 24 (tornado part).
- **Decisions:** a tick-box list of drivers: the seven the decision log names (gas price, grid price, WACC, carbon price, capex, capacity factors, grid connection date) plus additions such as IT load, PUE, battery capex, grid connection capex, evaluation period, escalation, flexibility trigger and generator test hours; the result measured defaults to LCOE, with NPV, carbon and weighted score selectable.
- **Built today:** seven fixed drivers: grid connection date, grid price, grid carbon, gas price, carbon price, WACC and IT load. Capex, capacity factors and the other additions are new.
- **Code today:** `app/src/engine/sensitivity.js`; `KNOWN-ISSUES.md` item 3 affects the grid-price bar.
- **Mock-up:** `m08-tornado`. **Guide:** chapters 27, 46.
- **Progress:** built 2026-10-23 on `feature/results-cards`, not merged: 16 drivers, seven ticked by default, LCOE / NPV / carbon / score. Not built: PPA price, per-technology capex, lead times.

### 10. PDF export

- **Brief:** §12.10. **Acceptance:** AC 26.
- **Decisions:** one PDF, inputs first, results after, saved through a file dialog; no Excel; the Site tab (Beta) is not included.
- **Ask the owner:** OPEN-QUESTIONS 32 (sections and order).
- **Watch:** the program must stay offline; the run log already uses a save dialog (see `../packaging/README.md`).
- **Mock-up:** `m09-pdf`. **Guide:** chapter 29.
- **Progress:** built 2026-10-23 on `feature/results-cards`, not merged: OPEN-QUESTIONS 32 answered with Claude's recommendation; nine sections; written by the app (no library, no network); Windows save dialog with a PDF filter. Not built: the executive summary (§14).

### 11. Engine fixes from the Haiku checks and the Pego study (added 2026-10-24)

- **Why:** the Pego study (revision 3) and Haiku check H1 found defects that bent results: time-to-power rewarding early plant, rented plant paid early, retained plant bought at once, dispatch stopping before full load, plant at minimum load wasting fuel, a gas-dependency flag raised wrongly, running HVO stores missed by the Seveso test, and an ignored grid price adder. The small fixes 1, 2, 3, 8 and 9 were added.
- **Decisions:** OPEN-QUESTIONS 68–76, Claude's recommendations accepted in advance by the owner (2026-10-24).
- **Acceptance tests:** Node tests 35–38 (38: known issue 19, PPA energy displaced by plant at its minimum stable load, OPEN-QUESTIONS 77) (`app/tests/engine-fixes-tests.mjs`); on the old code the minimum-load check finds 1,176 hours importing while curtailing in 24 sampled T1 options, on the new code none.
- **User guide:** chapters 9, 17, 19, 22, 23, 33, 35, 37, 38, 39, 41, 54 and 56.
- **Progress:** built 2026-10-24 on `feature/engine-fixes` (from `feature/verification-fixes`), not merged.

### 12. Existing plant near the site, leased (added 2026-10-24)

- **Why:** known issue 12. The Pego study needed a study build of the tool for the Elecgás CCGT next to the site; the library had no existing plant and sized bridging plant N+1, so two offered units became three.
- **Decisions:** OPEN-QUESTIONS 78–82, Claude's recommendations accepted in advance by the owner (2026-10-24).
- **What:** an input group in section 4; C2 and C4 value "Existing plant (lease)"; rules (l)–(n); exactly the units offered; the lease by the month from a month before first need; a connection-to-the-campus capex line; outside the campus (own consent, own gas supply, not in the IED aggregation, not on the plan); a run flag when ticked but incomplete; the PDF lists the inputs.
- **Acceptance tests:** Node test 39 (`app/tests/existing-plant-tests.mjs`).
- **User guide:** chapters 17, 34, 35, 39 and 56.
- **Progress:** built 2026-10-24 on `feature/engine-fixes`, not merged.

### 13. Site layout in the run (added 2026-10-24)

- **Why:** known issue 20, found when Pego was run on the product with the existing-plant input: the site-layout stage took minutes to hours on a large campus although site fit (Beta) does not change the ranking.
- **Decision:** OPEN-QUESTIONS 83, Claude's recommendation accepted in advance by the owner (2026-10-24).
- **What:** `settings.siteLayoutScope` (auto / all) and `settings.siteLayoutWorkLimit` (20 million block²); above the limit, with the site-fit penalty and compliant-first ranking off, options are "Not laid out" and the Site tab lays out what it shows; an info run flag; the screens show "Not laid out" without figures; the inspector does not compare site fit for such options.
- **Acceptance tests:** Node test 40 (`app/tests/layout-scope-tests.mjs`).
- **User guide:** chapters 19, 28 and 36.
- **Progress:** built 2026-10-24 on `feature/engine-fixes`, not merged.

### 14. Archetypes and identical options (added 2026-10-24)

- **Why:** known issues 4 and 5: archetypes took air cooling when cooling was open, and 37 T1 options repeated another option's results.
- **Decisions:** OPEN-QUESTIONS 84 and 85, Claude's recommendations accepted in advance by the owner (2026-10-24).
- **What:** archetypes take the engineer's cooling, or the open type with the lowest design load; rule (o), heat rejection location only with rooftop solar; "Retain for grid services" out of the default C3 set while its revenue is not modelled.
- **Acceptance tests:** Node test 41 (`app/tests/archetype-tests.mjs`); test 9c sizes its air-cooled reference explicitly.
- **User guide:** chapters 22, 34 and 47.
- **Progress:** built 2026-10-24 on `feature/engine-fixes`, not merged.

### 15. Study files: save and reopen (added 2026-10-24)

- **Why:** OPEN-QUESTIONS 27: without it an engineer cannot return to a study.
- **Decision:** OPEN-QUESTIONS 27, Claude's recommendation accepted in advance by the owner (2026-10-24).
- **What:** `src/engine/study.js` (`studyFile`, `readStudyFile`, `compareWithSaved`, schema `dc-energy-study/1`); "Save study" and "Open study…" in the header; a status line under the header.
- **Acceptance tests:** Node test 42 (`app/tests/study-tests.mjs`); browser check B37.
- **User guide:** chapters 4, 29 and 56.
- **Progress:** built 2026-10-24 on `feature/engine-fixes`, not merged.

### 16. Plain-English summary (added 2026-10-24)

- **Why:** BRIEF §14 and AC 12: a short text that says what the run shows, for the engineer and for the PDF reader.
- **Decision:** OPEN-QUESTIONS 12 and 86–92, Claude's recommendations accepted in advance by the owner (2026-10-24).
- **What:** `src/engine/summary.js` (`plainSummary`, `weightChanges`, `summaryKey`); `src/components/SummaryPanel.jsx` at the top of the Options tab; a Summary page after the PDF cover; the edited note in the study file (`notes.summary`).
- **Acceptance tests:** Node test 43 (`app/tests/summary-tests.mjs`); browser check B38; test 30 now expects the Summary section first. Test 44: known issue 21, found while building it (assumed-default flags missing in pool workers), fixed.
- **User guide:** chapters 22, 29, 44, 54 and 56.
- **Progress:** built 2026-10-24 on `feature/plain-summary` (from `main` after packages 0–15 were merged), not merged.

## Not scheduled

Ask the owner before starting any of these:

- Known issues: none open (all 20 resolved by 2026-10-24).
- Ranges, Monte Carlo, robust pick, breakevens and scenarios (§13).
- Parallel coordinates, the choice-impact chart, the schematic, key quantities, presentation mode, snapshots, undo and redo (§12, §16).
- Code signing for the Windows program (`../packaging/README.md`).
- The packaging Opus review that did not complete, and the NVDA screen-reader walk-through.
