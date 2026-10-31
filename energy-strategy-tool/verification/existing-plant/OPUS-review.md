# Work package 19 (existing gas plants near the site): Opus review

Reviewer: Claude Opus, 2026-10-31. Branch `feature/existing-plant` (worktree `/home/claude/eplant`), compared with `feature/weather-fixes`. No source, test or record was changed. The scripts used are in the session scratchpad (`rev/brute.mjs`, `brute2.mjs`, `share.mjs`, `insp.mjs`, `res.mjs`, `trunc2.mjs`, `perf.mjs`, `perf3.mjs`, `three.mjs`, `dense.mjs`).

Tests run: `node tests/only-tests.mjs 39 50`: 39, 50a–50e all pass.

**Counts: 3 high, 9 medium, 10 low (22 findings).** And a section on the builder's own choices (which ones to put to the owner).

---

## High

### 1. (High) A plant that stops after the last dispatched year keeps running in the ledger

- **Evidence.** `dispatch.js:141-155` (`dispatchYears`): the years an option needs (they now include the plant's end month, through the plant mode change) are capped at `settings.maxDispatchYears` (15). The years after that repeat the last year dispatched, when the plant still ran. The ledger's fixed O&M and lease read `endMonth` (`evaluate.js` around 270-290), but fuel, carbon, served energy and unmet energy come from the repeated dispatch year.
- **Reproduced.** Eemshaven test campus, Magnum Centrale with closure 2036 entered, islanded on the bought plant (`xb:ppm4359`). The plant stops in month 228 (year 19). Dispatch: 15 years explicit, 20 needed. Year 19 in the ledger: fuel €130.7 m, scope 1 600 kt, **unmet 0 MWh**, fixed O&M down to €1.1 m. The campus has no supply from year 19, but the results show it fully served and still burning gas.
- **Failure.** Wrong cost, carbon and adequacy for any option whose plant stops after year 15. This is common: a 1990s plant bought now runs to about 2040–2045 (closure + 10 years). For an islanded or plant-led option the loss of supply is hidden. The only sign is the generic run flag "dispatch-truncated".
- **Fix.** Always dispatch the year after each plant's end month (a second steady year), whatever the cap. Or at least: when a plant's end month falls after the last explicit year, use a steady year without the plant for the years after it ends, and add an option flag.

### 2. A bought plant kept as the campus backup passes the resilience check with one unit, and after it stops

- **Evidence.** `sizing.js:220-229` (the new existing-plant backup branch) caps the units at the plant's own and says "a shortfall against the requirement is left for the resilience check to flag". But `evaluate.js:484`, for C5 = Retained, always records the Topology item as passed ("Retained bridging plant sized N+1 per block"), and `resilience` never reads `endMonth`.
- **Reproduced.** Magnum Centrale entered as 1 unit, bought, bridge → backup, C5 = Retained: 1 unit, nUnits 1, critical load 120.5 MW. Resilience: "Meets with flags" (Backed load, Topology and Autonomy all pass). The plant stops in month 228 of a 240-month period. The only flag is "plant-closes" (minor), which says "after that the option relies on its other supply", but there is none. No replacement backup is costed.
- **Failure.** Single-unit backup (N, not N+1) and years with no backup at all, both shown as meeting the requirement. And the cost of a backup for those years is missing. With the default unit sizes (CCGT 400 MW, steam 300 MW), every list plant under about 600 MW is one unit (for example all four Dublin data-centre plants, and Echelon at 204 MW), so this case is common.
- **Fix.** In `resilience`, for an existing plant as backup or retained plant, compare its units with the units the topology needs, and raise `res-topology` (major) when it falls short. When `endMonth` falls inside the evaluation period, raise a major resilience flag ("no backup from …") and fix the "plant-closes" wording. Whether to cost a replacement backup from the end month is a question for the owner.

### 3. The leaf-limit guard no longer protects memory or time, and the projected count is slow on the main thread

- **Evidence.** `generator.js` `visitBase`/`expandPlants`/`enumerate`: `maxLeaves` (3,000,000) counts only base leaves. Every plant combination is checked and stored (`pRow`, `pVec` of 4 strings, `byPlant` index arrays) with no limit. `countCombinations` uses `maxLeaves = Infinity` and runs on the UI thread in `InputsPanel.jsx:381` and `:388` on every input change. Each worker of the pool repeats the whole enumeration (`run.js:80-92`).
- **Measured (Node 22, this machine).** Densest cluster in the list: Dublin (53.33 N, 6.38 W): 7 plants, 6 offer power.
  - Default choices: count 1.7 s (0.17 s with plants off), enumerate 1.6 s, generation 2.6 s, rss about 210 MB.
  - Duisburg (51.41 N, 6.75 E): 1.1 s. Maasvlakte (51.95 N, 4.05 E): 0.6 s.
  - With C3, C5, C10–C13 fully opened, Dublin: without plants the enumeration stops safely at the leaf limit (526,176 valid, rss 227 MB). With plants, `countCombinations` takes **127 s** (31.1 million plant combinations), and `enumerate` **ran out of memory at 4 GB**.
- **Failure.** On the phone page (one thread, a small memory limit) the Inputs and Choices panels freeze for seconds on each change at a dense site. Opening the choices wide crashes the tab or a Windows worker. Each worker holds its own copy, so the Windows pool multiplies the memory.
- **Fix.**
  - Count plant leaves in `maxLeaves` and stop (with the truncation warning) like the base.
  - Store plant combinations as typed arrays of value indices, or don't store them at all: draw each plant's share by choosing at random among (base row, plant variant) pairs and rejecting those that fail a rule.
  - Run the projected count in a worker, or debounce it and give it a time limit.

---

## Medium

### 4. (Medium) An engineer's lock on C21, or exclusion of "None", is ignored

- **Evidence.** `generator.js:274`: `c21s = ['none', ...P.C21]` is hard-coded. Unlike C2 and C4 (lines 278-279), the C21 placeholder is never skipped.
- **Reproduced** (brute force against the full product, `brute.mjs`):
  - C21 open without "None": 1,062 generated, against 888 valid (174 extra).
  - C21 locked to one takeover: 558 against 384.
  - The extra options carry C21 = None, for example `C4=xl:ppm757` with no takeover.
- **Failure.** Options outside the engineer's choice space are generated, ranked and counted.
- **Fix.** Build `c21s` from the C21 domain (`sd.all`), and add `if (!pt && sd.placeholder.C21 && C21 === sd.placeholder.C21) continue;`. Add these two cases to test 50c.

### 5. A representative row that fails a rule hides every plant combination it stands for

- **Evidence.** `generator.js:242-243`: the representatives are a real value (`rep2`, the first non-battery C2 value, or `bessSolar`; `rep4`, None or the first C4 value). Only base rows that pass every rule are expanded (`visitBase`), so a rule that fails on the representative value but not on the plant drops every plant combination of that row.
- **Reproduced:**
  - C4 without "None" ({CHP, fuel cell, plants}) and gas available = No. Rule (a) fails every CHP row, and **580 of 772** valid plant combinations are missed.
  - C2 = {BESS + solar, plants} with a permanent shortfall. Rule (h) fails BESS + solar with "split", and **112 of 780** are missed (for example a bought plant bridge → split).
  - The count shows the same wrong totals.
- **Failure.** Valid options silently not generated: an exclusion of options the rules don't make.
- **Fix.** Always use a neutral placeholder token for the C2 and C4 representatives. It must not be a domain value, must not be named in any rule (`'__plant__'`), and must be treated as a placeholder row. Add the two cases to test 50c.

### 6. The sample comes out smaller than the cap when the base space is small

- **Evidence.** `generator.js:450-466`: the plant share is `floor(room × 0.5)`, and the rest is asked of the Latin hypercube over the base space. Nothing gives the room the base space cannot fill back to the plants.
- **Reproduced.** Small locked space, cap 600: 1,149 combinations, 1,012 of them with a plant; only **431** options screened.
- **Fix.** After drawing the base sample, give the unused room to the plant pool (then the other way round).

### 7. A takeover moves the campus's own new grid capex earlier

- **Evidence.** `evaluate.js:133-134`: `firstGridM` is read from `ctx.gridCap`, which after `ctxFor` includes the taken-over connection. So the "Grid connection charge", the cable route and the substation for the new connection are booked in the takeover year.
- **Reproduced.** Eemshaven test, Eemshaven takeover: substation €10.4 m booked in year 1, against year 6 without the takeover.
- **Failure.** Earlier spend, higher NPV cost, and so worse LCOE for takeover options. This is a ledger timing error.
- **Fix.** Compute `firstGridM` and `gridYear` from `ctx.baseCtx || ctx` (the run's grid).

### 8. The Dispatch tab shows the run's grid, not the option's

- **Evidence.** `inspect.js:112-156`: `buildContext`, then `contractedCap(ctx, v.C1)` and `fullGridM: ctx.fullGridM`, with no `ctxFor`.
- **Reproduced.** Eemshaven takeover option: from month 12 the Dispatch tab shows grid 0 MW while supply is 129.5 MW. The "Full grid connection" marker is at month 72, while the option hands over at month 12.
- **Failure.** The timeline does not add up (supply with no source), and the hand-over shown is wrong.
- **Fix.** `const octx = ctxFor(ctx, v)` in `inspectOption`, used for the grid row and `fullGridM`. Show the takeover as its own band or label. Also `run.js:513-514` (`meta.gridCap`) is the run's grid: fine for the run summary, but no per-option chart should read it.

### 9. Options with three plants, against decision 118

- **Evidence.** OPEN-QUESTIONS 118: "options use one plant or two together". No rule limits it: C2 = plant A, C4 = plant B and C21 = plant C is generated.
- **Reproduced.** Eemshaven default space: 35,472 plant combinations, of which 17,976 use one plant, 15,384 two, and **2,112 three**.
- **Fix.** A rule (q) "at most two plants in one option", or ask the owner whether a takeover counts as a "use".

### 10. Values the owner said are editable per plant are not

- **Evidence.**
  - `defaults.js:450` and `context.js` `ctxFor`: the takeover date lag is `PLANT_DEFAULTS.takeoverLagMonths` for every plant. 120 says size, date and cost are "editable per plant".
  - `applyPlants`: the refurbishment's extra years is `PLANT_DEFAULTS.buyExtraYears` for every plant. 121 says "editable per plant".
  - The manual plant (`defaults.js:485-491`) passes only units, size, efficiency, minimum stable load, VOM, link, closure and lease. `PlantsField.jsx` leaves the manual plant out. So its purchase price, refurbishment, O&M when bought, takeover MW and takeover cost cannot be changed anywhere, yet "bought" and takeover options are generated with them.
- **Fix.** Add `takeoverLagMonths` and `buyExtraYears` to `edits` and `candidateFrom` (and read them in `ctxFor` and `applyPlants`). Add the bought and takeover fields to the manual plant's form.

### 11. A firm plant's connection to the campus is bought again, or credited, after the plant stops

- **Evidence.** `evaluate.js:173`: the prime link is booked with `t.p.life` and no `removeYear`. For a bought plant, `life` is the plant's remaining life (`lifeB`), so the link is "replaced" in about the year the plant stops, and residual value is counted. The bridging link (`:199`) handles this; the prime link does not. A leased plant's link (life 25) is also replaced in display periods over 25 years, after the lease has ended.
- **Fix.** Pass `{ removeYear: primeEnd }`, as for the plant itself.

### 12. Other data centres' own gas plants are offered to lease, buy and take over

- **Evidence.** Dublin cluster from the bundled list:
  - Echelon Dub 204 MW (no first year, so "runs for the whole study")
  - Grange Castle Echelon
  - Microsoft Dublin Data Center (167 MW, "steam")
  - Profile Park
  - Winthrop Dublin

  These are campus-embedded generators, not plants that sell or close. The list has a `set` column (PP / CHP / Store), but no filter or flag uses it.
- **Failure.** Unrealistic options rank beside real ones, and many of these plants are new (2024–2026), so they get 40-year lives.
- **Fix.** Raise a question for the owner: leave such entries out by name or `set`, or keep them with a flag ("probably a private campus plant").

---

## Low

### 13. The manual plant of package 12 now takes half the sample alone, and is offered bought

- **Evidence.**
  - `generator.js` `splitDomains`: `existing` is a plant value, so for a study with only the manual plant, C2/C4 leave the base space. The manual plant gets the whole 50 % plant share, and the Latin hypercube strata change. Test 39 still passes (129 bridging + 320 firm of 2,000), but results of package 12 studies (the Pego study) will move.
  - Offering "bought" fits decision 119 ("power leased or bought" for a plant). But the toggle label ("Existing plant near the site (lease)", `InputsPanel.jsx`) and the report section title (`report.js` SECTIONS) still say "lease", and see finding 10 for its uneditable purchase values.
- **Fix.** Rename to "Existing plant near the site (not in the list)". Tell the owner that the Pego results change.

### 14. Old study files gain plants when reopened

- **Evidence.** `defaults.js normalizeInputs`: `plants = { auto: true, … }`. A study saved before this package, at a site with plants, gives different options and ranking. Only the run flag says why.
- **Fix.** Note it in the study-load notice ("plants added: n").

### 15. Takeover and contracted capacity

- **Evidence.**
  - `contractedCap` (`context.js:84-90`) and the dispatch `gridLimit` clip the grid, including the taken-over MW, at the engineer's contracted MW for C1.
  - The takeover is purely added to the new full connection: the option pays for both, with no saving on the new connection.
- **Fix.** Ask the owner whether the takeover is a second contract (not clipped) and whether it can replace part of the new connection.

### 16. The efficiency ranges are a default with no record

- **Evidence.** `defaults.js` `EFF_RANGE` decides whether the list's efficiency is used, but it has no §18 record or label.
- **Fix.** Add records (judgement).

### 17. Choice states reset, or not, without notice

- **Evidence.**
  - `PlantsField.jsx resetChoices`: any correction to any plant resets C2, C4 and C21 to their defaults, so the engineer's own locks are lost silently.
  - Moving the pin does not refresh a customised C2 or C4, so the new site's plants are missing from them (only their takeovers appear).
- **Fix.** Add the new plant values to custom states, or remove the stale ones, rather than resetting. Or say so on screen.

### 18. A shortfall top-up can be generated when the takeover removes the shortfall

- **Evidence.** Rules (g) and (n) read the run's permanent shortfall (`permSet`), while sizing reads the option's grid. With a takeover, the top-up is sized to 0 and given 1 unit minimum (`plantUnits`, `Math.max(1, …)`), a near-duplicate of C4 = None.
- **Fix.** Accept it and note it, or let sizing return no prime and add an info flag.

### 19. `ctxFor` rebuilds the plant signature on every call

- **Evidence.** `context.js ctxFor` calls `plantOf` → `plantCandidates`, which runs a `JSON.stringify` of the inputs' plant settings before the cache lookup. That happens for every stage of every takeover option.
- **Fix.** Check `ctx.takeoverCache` first, keyed by value, own mode and C8.

### 20. Determinism across worker slices: fine, but repeated

Each worker runs `generateOptions` on the same inputs and keeps every k-th option (`run.js:89-92`). Generation is deterministic:
- the plant ids are sorted;
- the seeded streams are separate (`'plants'` and `'lhs'`);
- `Map` order follows the enumeration;
- two generations gave identical lists (`share.mjs`).

The only cost is repeated time and memory (see finding 3).

### 21. Takeover options lead on an unconfirmed right; deliverability ignores it

- **Evidence.** The "plant-takeover" flag is major but carries no `permitting: true`, so the deliverability score does not move. At Eemshaven the leader is a takeover of a plant the 40-year default marks as closed in 2016 (BUILD-NOTES).
- **Fix.** This is consistent with "flag, never enforce". Ask the owner whether an assumed right should cost deliverability points (a score, not a filter).

### 22. A leased plant kept as prime counts as backup in the resilience check

- **Evidence.** `evaluate.js` `bridgeRetained`. This is older than this package (package 12), and rule (m) says a leased plant is not the campus standby.
- **Fix.** Exclude leased plant from the backed load. This is a separate defect for `KNOWN-ISSUES.md`.

---

## Checks that passed

- **One base row per plant combination.** Each combination maps to exactly one base row (C2 → representative, C4 → representative, C4s → n/a when the representative is None, C21 → None). No duplicates in any case tried. Brute force equals the fast path for:
  - the default space;
  - C2 locked to plants only;
  - C4 without None (gas available);
  - C4 plants only;
  - C4s locked;
  - islanded only;
  - all of the above with a permanent shortfall.

  The failures are only those in findings 4 and 5.
- **Choice key.** `canonical` gives the same result as before. `choiceKey` leaves C21 out when it is None or n/a.
- **Sampling stream.** The Latin hypercube skips C21 while it has one value, so a study without plants keeps its option ids and its sample (test 50e).
- **`ctxFor` readers.** Sizing, dispatch (`cfg.gridCap` in the key, and `dispatchYears`), time-to-power, economics, resilience and flags all derive the option context. Monte Carlo, the tornado and break-even rebuild the context from changed inputs (`buildContext`), so no stale takeover cache crosses runs. The run-level shortfall analysis and `meta.gridCap` are the run's by design. Findings 7 and 8 are the two readers left on the run's grid.
- **Ledger.**
  - A bought plant is booked once, for the units used (purchase plus refurbishment), with no replacement or residual (`removeYear`).
  - The lease and fixed O&M stop at `endMonth`.
  - The takeover line carries contingency and the capex factor, and its label matches the grid-capex tornado pattern.
  - Replacements stop at the evaluation period.
- **Permitting.** A bought plant stays out of the campus IED and medium-combustion total (`offsite`, `ownConsent`), with the ownership flag (122).
- **Labels.** Every `plants.*` value is a §18 record with basis "judgement" and a reason. The research note and flags present the list as "to check with the owner", and nothing as verified. The exception is finding 16.
- **Flag, never enforce.** No option is hidden or resized because of a flag. The filters (10 km, 50 MW, closed status) are owner decisions 117 and 119.

---

## The builder's choices not asked (BUILD-NOTES list)

- **A list plant gives only the units the need takes, and the purchase price applies to those units.** Reasonable for lease. For a purchase, a seller will rarely sell part of a plant: whole-plant purchase (with resale or export of the rest) is a different, larger cost. **Ask the owner.**
- **A plant whose closure (often only the 40-year default) falls before the analysis start is "closed": connection only, no power.** It decides which plants can be leased, and it rests on a default. A 1985 CCGT still running is offered no power, and a 1976 entry "closed" in 2016 still offers its connection in 2028 (the Eemshaven leader). **Ask the owner.** Consider "closed" only from a listed or entered date, and treat a default closure in the past as "running, closure unknown" with a flag.
- **Bridging hands over at the takeover month once the grid offered reaches the full grid (or the design load).** Consistent with 120 and coherent in the code. Acceptable; note it in the user guide.
- **Half of the sample for plant options.** Reasonable as a labelled judgement, but see findings 6 and 13 (under-filled sample; the manual plant alone gets half). **Confirm with the owner**, and give the unused room back.
- **Not listed but chosen in the code** (worth one line each to the owner):
  - Plant unit sizes by type, which make most plants a single unit (finding 2).
  - The takeover is added on top of the new connection (finding 15).
  - A leased plant taken over by the same option "runs on until the connection is ready" (12 months beyond its listed closure; flagged).
  - Up to three plants per option (finding 9).
