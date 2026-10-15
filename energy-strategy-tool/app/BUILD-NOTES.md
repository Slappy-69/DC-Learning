# Build notes: core slice

Concept-stage data centre energy optioneering tool, core slice, built against `brief-v2/BRIEF.md` (authoritative), `ASSUMPTIONS.md`, `OPEN-QUESTIONS.md` and `CHANGELOG.md`. Built 2026-10-15.

## How to run

```
cd /home/claude/build/app
npm install          # react 18.3.1, react-dom 18.3.1, esbuild 0.23.1 (all local to this folder)
npm test             # node tests/run-tests.mjs
npm run build        # node build.mjs -> dist/
```

Open `dist/index.html` through any static server (for example `npx serve dist`). The compute pool uses Web Workers loaded from `worker.js`. If the browser blocks workers (some browsers on `file://`), the app falls back to the main thread and says so in the status line.

`dist/energy-tool-single-file.html` is the same app with `app.css` and `app.js` inlined, built by `npm run build`. The worker is not inlined, so the single file normally runs the main-thread fallback. That fallback runs in 30 ms time slices, so the page and the progress panel stay live. Checked from `file://` in headless Chromium 2026-10-15: the run completes, all 12 stages show, and the JSON log downloads.

## Architecture

```
src/
  engine/            pure functions, no UI, no browser APIs
    prng.js          seeded mulberry32, FNV hash, shuffle
    dates.js         month arithmetic (YYYY-MM), model clock
    defaults.js      input model, §18 records for every default, technology library,
                     country table, choice definitions and default states, T1/T3 examples
    profiles.js      seeded synthetic 8760-h profiles per country; hourly cooling/PUE model
    context.js       per-run shared arrays: offered grid profile by month, IT installed by month,
                     hourly facility demand per cooling approach and model year (cached)
    generator.js     choice enumeration, n/a collapse, compatibility rules with counts,
                     archetypes, cap with seeded Latin hypercube sampling, "values not generated"
    sizing.js        §9.2 sizing rules and sizing sentences
    dispatch.js      §9.4 hourly merit-order dispatch, 8760 h per model year, chronological SOC
    evaluate.js      time-to-power, cash-flow ledger, carbon/water, resilience, flags, deliverability
    scoring.js       effective weights, 0–100 normalisation, weighted score, dominance, rank,
                     view layer (applyView) that never touches score or rank
    run.js           pipeline as stage passes (runModelSteps generator; runModel drains it), dispatch
                     cache, worker slicing/merge, re-score, hooks for later slices
    runlog.js        run event log: stage list, logger, merge, validation, JSON/CSV export,
                     input hash, live progress tracker
  worker.js          Web Worker entry: evaluates one slice of the generated list, returns its event log
  useCompute.js      worker pool (hardwareConcurrency − 1, 1–8), cancellation, time-sliced main-thread
                     fallback, live event collection for the progress panel
  App.jsx            header strip, live region, run summary, ranked list, footer guardrail
  components/        Field (inputs + "indicative — unverified" tag), InputsPanel (steps 1–6 +
                     Choices panel with projected count), RunProgress (live stages, last 200 events,
                     log download), RunSummary, RankedList, OptionDetail
  styles.css         tokens, dark mode, visible focus, reduced motion, phone/tablet/desktop layouts
tests/run-tests.mjs  Node test script (node:assert only)
tests/worker-shim.mjs runs src/worker.js in a Node worker_thread (test 6c)
build.mjs            esbuild: dist/app.js, dist/worker.js, dist/app.css, dist/index.html, and
                     dist/energy-tool-single-file.html (CSS and JS inlined)
```

Data flow: inputs (UI keeps `null` for "at default" on derived defaults) → `normalizeInputs` → `buildContext` → `generateOptions` → per option `sizeOption` → `dispatchConfig` → `dispatchAll` (cached by configuration key, so options that differ only in non-dispatch choices share one dispatch) → `timeToPower`, `economics`, `carbon`, `resilience`, `optionFlags`, `deliverability` → `scoreOptions` over the whole screened set → `applyView` for display only.

Incremental recompute: a change to weights, cost/carbon axis metric or "rank compliant first" re-scores the existing run on the main thread with no dispatch. Any other input change re-runs the pipeline in the worker pool; in-flight workers are terminated first.

## What is implemented

**Input model.** All §5 inputs needed by the engine, with the brief's defaults. Required inputs (location, site area, IT MW, grid now, grid at full connection, full-connection date) have no default; the app pre-fills the T1 reference example so it runs on load and marks those fields "required · example value". The Inputs panel covers steps 1 to 6 plus run and dispatch settings, with the label rule applied (see below).

**Hourly profiles (synthetic).** For each of the 31 built-in countries, `profiles.js` generates seeded, deterministic 8760-h arrays: dry-bulb and wet-bulb temperature, solar yield per MWp, wind capacity factor, wholesale price and grid carbon intensity. They are scaled exactly to the indicative annual targets in `COUNTRIES`, which are themselves indicative and unverified. **These are synthetic profiles, not measured data.** The UI says "Synthetic profile (seeded), calibrated to indicative annual targets — not measured data". No dataset licence has been checked yet. Price and carbon are anti-correlated with wind and solar and follow seasonal and diurnal shapes.

**Dispatch (real, 8760 h).** `dispatch.js` runs the six-step merit order from §9.4 hour by hour over full 8760-hour model years, carrying BESS state of charge from year to year:
1. On-site solar and wind serve load first.
2. PPA energy is shaped hourly (solar, wind, hybrid, baseload or demand-shaped 24/7), delivered over the grid connection, and uses import capacity. PPA volume that cannot be delivered is settled at spot and flagged.
3. BESS discharge depends on its role. Peak-shave covers the shortfall above grid plus firm capacity, then expensive hours with a 50 % reserve. Shifting and grid services discharge in the n dearest hours of each day. Bridging support covers shortfalls only. BESS charges from on-site surplus first, then from the grid in the n cheapest hours of each day, within the import cap.
4. Firm plant runs when its marginal cost (fuel ÷ efficiency + VOM + carbon) is below the hourly grid price, or to cover the gap above grid capacity. Min stable load is respected per unit, and output forced above need by min stable load is curtailed. Plant is must-run when islanded. The trigeneration absorption-chiller credit is limited to the mechanical cooling load in that hour. Run-hour handling follows the setting ("Flag only" or "Respect limit").
5. Grid import is capped at the offered capacity for that month ("Show unmet load"), or uncapped with the excess recorded and flagged ("Show exceedance").
6. Demand flexibility runs if C16 is on. Anything still unserved is recorded as unmet load.

Each hour is checked for balance inside the engine (`maxBalanceError`). Model years are dispatched explicitly up to the last change in demand, grid or plant availability (capped at 8 years, a run setting). The last year then repeats as steady state over the evaluation period.

**Option generator.** This is the Cartesian product of open choices (locked choices give one value). Irrelevant choices collapse to "n/a" (rule d). Compatibility rules (a), (b), (c) and one builder rule (e) remove impossible combinations, and each is counted. All 11 archetype baselines (A1 to A9, A10a SMR, A10b hydrogen) are always generated, and so are archetype vectors that sit outside the open choices. When the count exceeds the cap (2,000) and "Sample above cap" is on, every archetype is kept, then seeded Latin hypercube sampling runs over the choice dimensions. Draws that land on an invalid or duplicate combination are repaired from the remaining valid set, and the number repaired is reported. Switching sampling off screens every combination. The "values not generated" note lists every omitted value with its reason ("default subset", "locked", "wind default", "excluded by user") and an Include control. The C11 wind info flag shows on the C11 row and in the run summary.

With brief defaults on T1, the open choices give 57,027 valid combinations, so sampling is active on a default run. See "Brief issues" (1).

**Sizing.** §9.2 rules with sentences:
- Design load is built from the peak design-day PUE.
- Critical load drives backup unit counts, using the block rule for N, N+1, 2N and catcher.
- Fuel storage is sized from autonomy.
- Bridging is sized to the largest shortfall, using N+1 per block.
- Firm prime is sized to the steady-state average.
- BESS is sized as a percentage of design load, kept as given.
- Roof, carport and residual-ground PV use an area budget.
- Wind count comes from spacing.
- The PPA volume is reported.
- The grid connection is the offered capacity per period, the same shared array for every option, never resized. The grid shortfall at design load is stated per period.

**Economics.** One real-terms cash-flow ledger per option, the source for LCOE, NPV of net cost, capex and opex.
- Capex is timed by phase (C19), with contingency, replacements, and residual value at the end of the period or salvage on removal. The cooling capex delta is relative to the air baseline.
- Opex covers fixed O&M, VOM, fuel, grid energy plus the non-commodity adder (also charged on PPA energy carried over the grid), PPA strike plus shaping, Scope 1 carbon cost, genset test runs, rental for rented bridging plant, and export revenue.
- Capex scope excludes the data hall shell and IT fit-out, stated in the UI.

**Carbon and water.** Location-based and market-based annual average gCO₂e/kWh with the decarbonisation trajectory, hourly CFE %, the Scope 1/2 split, a trajectory per year, and WUE.

**Resilience check.** Backed load (backup at topology after removing redundant units, plus retained bridging, firm prime and BESS), topology against the requirement, autonomy, islanding if required, and gas dependency. Status is Meets, Meets with flags or Does not meet, with the failing item named.

**Time-to-power.** For each month, supply = offered grid + firm plant available (programme and fuel dates) + bridging BESS. The tool reports first power, full load, power gap in MW-months, and the axis metric (months to full load + 0.5 × power gap ÷ design MW). The phase targets drive the "target missed" flag.

**Flags.** §15 categories: grid, resilience, permitting (IED, MCP, Seveso fuel and hydrogen, wind, stack height, run-hours; non-EU proxy note; "Screening flag, not a permitting determination"), fuel and utilities, targets and ceilings, technology, generation, data, load, and an area-budget info flag. Flags never remove, hide, demote or resize an option.

**Deliverability.** §9.9 formula: Emerging and Nascent shares (mean of capacity and energy shares), permitting major and minor counts, gas "Unknown", hydrogen, and procurement lead time over 24 months. Floored at 0. The site-fit penalty is off and has no effect because site fit is not assessed.

**Scoring.**
- Effective weights are raw ÷ Σ raw, with equal weights and a notice when all are 0.
- Each axis is normalised 0–100 across all screened options (best = 100).
- The weighted score is Σ wᵢ·scoreᵢ.
- Dominance is marked on (cost, carbon, TTP, deliverability) with no better resilience status.
- Ranking is by score. "Rank requirement-compliant options first" is off by default.
- View filters (resilience status, hide-with-flag, archetypes only, search, hide dominated, sort) are applied after scoring by a pure function and never change any score or rank.

**UI.**
- The header strip shows option counts (screened, combinations, dominated), leader and score, model badge, sampling and hide-dominated state, filter count, exceedance-mode warning, effective weights, and the unverified-defaults count.
- A polite live region announces "Options updated. Leader unchanged" or "New leader: …".
- The run summary sits above the list and expands automatically when an entry changes.
- The ranked table is sortable, paged at 50 rows, with axis mini-bars, badges and flag counts. An option detail row shows scores, economics, energy, time-to-power, resilience, deliverability, sizing sentences, flags and the choice vector.
- The layout is responsive: a sliding inputs panel below 1280 px and single-column fields below 768 px.
- All controls are native and keyboard-operable, with a visible focus ring, a skip link, `prefers-reduced-motion` support and dark mode.
- No browser storage APIs are used.

## Defaults used and their labels

Every default is held as a §18 record in `defaults.js` (`getRegistry()`): `{ value, unit, low, high, distribution, basis, source:'', year:'', url:'', confidence:'C', verified:false, sourceToVerify, note, label:'indicative — unverified' }`. No default has been verified, so **every one shows "indicative — unverified"** in the UI while it is at its default, with the basis (source, run setting or judgement) and the source to verify against shown on hover or focus. Test 5d enumerates every record and checks the label, basis, confidence C and verified false.

| Group | Defaults (all indicative — unverified) | Basis |
|---|---|---|
| Project | name "Untitled project"; analysis start today + 3 months; seed 20261015; country from location | judgement / run setting |
| Site | aspect 1.5; setback 10 m; height limit 25 m; roads/parking 15 %; off-site land 0 | judgement |
| Load | 1 phase at grid full-connection date; ramp 50 % → 100 % over 12 months; utilisation 80 %; workload Mixed cloud; cooling open; gross-up 2.2; 2 storeys × 6 m + 4 m roof zone; ancillary 2 %; flex 10 % / 100 h (C16 locked Off) | judgement |
| Cooling (§9.3) | per approach: free-cooling threshold, band, COP curve, fan and loss fractions, density (air 1.5, evap 1.8, DLC 4.0, immersion 3.0 kW/m²), WUE, capex delta | source (ASHRAE TC 9.9, vendor data to verify) |
| Grid | steps none; export 0; price and carbon multipliers 1; country price adder; date uncertainty −6/+24 months (not used in this slice) | judgement / source |
| Utilities | gas Unknown, available from start + 18 months, unlimited; hydrogen No; water Unknown; district heating No | judgement |
| Requirements | 100 % backed; N+1; 48 h; islanding No; UPS 5 min; block size 10; catcher n = 4; carbon target, capex ceiling, run-hour limit none; IED 50 MWth; MCP 1–50 MWth; Seveso H₂ 5 t, diesel/HVO 2,500 t; test runs 12 h/yr at 75 % | judgement / source (directives to verify) |
| Economics | 20 years; WACC 7 %; contingency 10 %; AACE Class 5 −30/+50 %; carbon escalation 2 %/yr real; electricity and gas escalation 0; salvage 50 % | judgement / source |
| Weights | 35 / 25 / 25 / 15; presets as §5.7 | judgement |
| Deliverability | −15 Emerging, −40 Nascent, −8 major, −3 minor, −10 gas Unknown, −10 hydrogen, −5 per lead time > 24 months; site-fit penalty off | judgement |
| Run/view settings | cap 2,000; sample above cap On; grid handling "Show unmet load"; run-hours "Flag only"; cost LCOE; carbon location-based; absolute scaling off; compliant-first off; hide dominated off; wind threshold 20 ha; fixed PV 5 MWp; bridging BESS 24 h; timeline 120 months; max explicit dispatch years 8 | run setting / judgement |
| Choices | every §8 default state (C1 to C20 and the C12 role), including C6/C7 locked to the requirement, C8 open/locked by cooling input, C11 wind default, C15 by district heating | judgement |
| Technology library | capex, O&M, efficiency, min stable load, unit size, life, footprint, programme durations for 18 technologies; fuel prices and emission factors; PPA strikes | source (IRENA, NREL ATB, DEA, Lazard, vendor; to verify) |
| Country table | 31 synthetic calibration rows (temperature, solar yield, wind CF, price, adder, carbon, gas, carbon price, decarbonisation to 2050); FX rates | source (PVGIS, ERA5, ENTSO-E, Ember, TTF/NBP, ETS, ECB; to verify) |

Builder-chosen values not given by the brief, all recorded as judgement or run settings with the label: islanding default "No"; belly-tank autonomy 8 h; BESS initial SOC 50 %; peak-shave 50 % arbitrage reserve; CHP heat-to-power 1.0 and absorption COP 0.7; carport 30 % of the parking allowance; wind 33.75 ha per turbine for spacing; HVO emission factor proxy 0.03 t/MWh_th; salvage 50 %; T1 phase dates at months 18, 30, 42 and 54 (the brief gives 4 × 25 MW but no dates).

## What is not in this slice

- **Pareto view, parallel coordinates, choice-impact chart, compare view, radar** (§12.2, §12.7). Hook: `HOOKS.paretoView`. Dominance is already marked.
- **Sensitivity, tornado, breakevens, Monte Carlo, rank stability, robust pick, P10–P90 ranges** (§13). Hooks: `HOOKS.sensitivity` and `HOOKS.monteCarlo`. Every default record already carries low and high values and a distribution. Capex shows only the AACE band.
- **Scenarios** (§13.3). Hook: `HOOKS.scenario`. The escalation inputs exist.
- **Site layout, plan, massing, site-fit status, unplaced tray, noise proxy, height check per block** (§10). Hook: `HOOKS.layout`. Only an area budget is computed (residual ground PV, plus an info flag when land take exceeds net area). C17/C18 notes state that fit counts are unavailable.
- **Exports** (PDF, Excel, JSON, GeoJSON, PNG, presentation mode), project save/load, undo/redo, snapshots, decision log, plain-English summary (§12.10, §14, §16, §19). Hook: `HOOKS.export`.
- **Representative-day screening tier and the 8760 verification badge/deviation flag** (§9.1). This slice runs the full 8760-h model for every screened option instead. Every result is therefore labelled "Full-year hourly (8760 h)". Hook: `HOOKS.screeningModel`.
- Heat reuse costing and revenue (C15), BESS grid-services revenue, the Scope 2 shadow carbon price, embodied carbon, numeric sweeps, custom option builder and pinning, absolute scaling (setting held, not applied), and per-edge setbacks and exclusion zones.

## Test results

See the bottom of this file ("Test run") for the real numbers from `node tests/run-tests.mjs`.

## Brief issues

1. **Default option count conflicts with §7.2 and §17.** The brief says default open choices give "about 200–600 options" and the cap "is only reached when the user opens extra choices". The §8 default states alone multiply far beyond that. C1 bridge × C2 (3) × C3 (4), C4 (3), C5 (3), C8 (4), C9 (3), C10 (3), C12 (3), C13/C14 (1 + 3) give 57,024 valid combinations on T1 even after n/a collapse. **Choice made:** follow the §8 default states literally and let the visible "Sample above cap" setting (default On) screen 2,000 with every archetype kept. The run summary and header strip state the real counts. The brief should either shrink the default open sets (for example lock C3, C9 and C14 by default) or revise the 200–600 figure and the §17 targets.
2. **§17 timing targets assume the representative-day tier.** This slice runs the full 8760-h dispatch for every option, as the task requires. On this sandbox, T1 (2,000 options, 1,700+ distinct dispatch configurations, about 10,000 dispatched 8760-h years) takes several seconds on one thread. In the browser it is divided across the worker pool. The ≤ 500 ms / 1.0 s targets are not met in this slice. They depend on the representative-day screening tier (§9.1), which is not built yet.
3. **C5 "Retained bridging plant" without retained plant.** The brief lists no compatibility rule for C5 = retained when C1 = wait (no bridging plant exists) or C1 = bridge with C3 = remove. Such a combination cannot be described: the backup technology is plant that does not exist. **Choice made:** added rule (e) "Retained-bridging backup requires retained bridging plant", shown by name with its count (5,184 on T1). Possible but weak combinations stay generated and flagged.
4. **Retained bridging as backup: sizing basis.** §9.2 sizes bridging to the grid shortfall, which can be far below the critical load (6.6 MW against 103 MW on T1). That makes every "retained as backup" option fail resilience by construction. **Choice made:** when C5 = retained, the retained plant is sized by the same backup rule (critical load, required topology, autonomy for liquid fuel), taking the larger of the two sizes. This is a sizing rule applied to every such option before any check (§2 principle 5), not a resize after a breach.
5. **Islanded grid as backup in the resilience check.** C1 = Islanded keeps the offered grid connection "as backup". The §9.7 resilience check counts only on-site firm capacity during a grid outage. **Choice made:** the islanded grid connection is not counted toward backed load.
6. **"BESS role" is not a separate choice in §8.** C12 combines size and role. The default role is fixed as "peak-shave against grid cap". **Choice made:** modelled as a separate choice row C12r (locked to peak-shave by default), so rule (c) "BESS as bridging requires a non-zero BESS size" has something to act on.
7. **C12 alternatives.** The brief gives durations 1/2/4 h at 25 %/50 % but only three defaults. **Choice made:** six size alternatives plus None; the defaults are None, 2 h at 25 % and 4 h at 50 %.
8. **Phase dates for T1** are not given (§21). **Choice made:** months 18, 30, 42 and 54 from the analysis start.
9. **Time-to-power metric when full load is never reached.** The brief's formula needs "months to full load". **Choice made:** use the timeline horizon (120 months, a run setting) when full load is not reached in it, plus the power-gap term.
10. **"Supply ≥ demand at the required resilience" for first power** (§9.8) is not defined further. **Choice made:** first and full power test the energy supply only (grid + firm + bridging BESS). Resilience is reported separately by the resilience check.
11. **Deliverability maturity share**: "energy-weighted and capacity-weighted" with one penalty. **Choice made:** the mean of the capacity share and the steady-state energy share.

## Run event log (trackability)

Added 2026-10-15. Every run, in the worker pool or on the main thread, emits an ordered event log. The engine is in `src/engine/runlog.js` and `src/engine/run.js`, the UI in `src/components/RunProgress.jsx`.

### Event schema

Each event is a plain object, and the field order is fixed:

```
{ seq, stage, event, t_ms, count, total, detail }
```

| Field | Meaning |
|---|---|
| `seq` | Contiguous integer from 0 within a log. In a merged pool log it is renumbered 0..N−1, and the source's own number is kept as `detail.wseq`. |
| `stage` | One of the 12 stage ids below, in pipeline order. |
| `event` | `start`, `progress`, `end` or `warning`. |
| `t_ms` | Milliseconds since the run started, at 1 µs resolution. Workers use the same origin: the main thread passes its absolute start time (`performance.timeOrigin + performance.now()`). **This is the only field that differs between two runs with the same inputs.** |
| `count` | Items processed so far. `start` gives 0, `end` gives the items processed in the stage, `warning` gives null. |
| `total` | Items expected in this stage for this source, or null when not known in advance (option generation start). |
| `detail` | Plain object. It always has `source` (`main` or `worker k`). On `end` it always has `items`, `cacheHits`, `cacheMisses` (null when the stage has no cache) and `warnings` (the number of warning events the source raised in that stage). It never holds timings or anything else machine-dependent. |

Log content is deterministic. Progress for per-option stages is emitted every `PROGRESS_EVERY` = 250 items, counted, not timed. Dispatch reports every option. The input hash is computed on the normalised inputs with sorted keys, so it does not depend on key order. Test 6b checks that two T1 runs give identical logs once `t_ms` is removed.

### What each stage reports

Stages run as passes over the option list, in this order. Each source has exactly one `start` and one `end` per stage it runs. Per-option results are unchanged: T1 and T3 outputs for all 2 × 2,000 options (ids, scores, ranks, LCOE, NPV, capex, carbon, unmet, time-to-power, deliverability, resilience status, flag ids, dominance, dispatch keys) were compared before and after the restructure, and they are byte-identical.

| # | Stage id | `progress` events | `warning` codes | `end` detail (besides items, cache, warnings) |
|---|---|---|---|---|
| 1 | `input-normalisation` | none | `phases-derived` (no phasing table), `required-missing` | `inputHash`, `engineVersion`, `seed`, `choices`, `choicesAtDefault` |
| 2 | `context-build` | none | `profiles-synthetic`, `defaults-unverified` (both on every run, because both are true of every run in this slice) | `country`, `months`, `timelineMonths`, `coolingProfiles`, `phases`, `firstPhaseMonth`, `lastPhaseMonth`, `fullGridMonth` |
| 3 | `option-generation` | `step: enumerate` (raw product, after n/a collapse, valid); `step: compatibility-rule` once per rule a, b, c, e, d with `removed`; `step: archetypes`; `step: cap` with `cap`, `sampling`, `sampled`, `decision` (below cap / sampled / cap exceeded with sampling off), `screened`, `totalCombinations`, `lhsRepaired`; in a worker, `step: slice` | `cap-sampling`, `enumeration-truncated` | `screened`, `totalCombinations`, `sampled`, `slice`, `optionsThisSource` |
| 4 | `sizing` | every 250 options | none | cache = hourly demand cache (cooling approach × model year) |
| 5 | `dispatch` | **one per option**: `count` = options dispatched so far out of `total`, `option` id, `cfg` (short id of the dispatch configuration key, `K` + 12 hex), `cache` `hit` or `miss`; a miss also gives `years`, `explicitYears` and the full `key`; a hit gives `firstSimulatedFor` (the option that was simulated) | `unmet-load` (configurations with unmet load), `grid-exceedance`, `balance-error` (> 1e-6 MWh) | `cacheHits`, `cacheMisses` (dispatch cache), `distinctConfigurations`, `yearsSimulated`, `demandCacheHits`, `demandCacheMisses` |
| 6 | `time-to-power` | every 250 | `full-load-not-reached` | `notReachingFullLoad` |
| 7 | `economics` | every 250 | `lcoe-non-finite` | `ledgers` |
| 8 | `carbon` | every 250 | none | none |
| 9 | `resilience` | every 250 | `requirement-not-met` (count of "Does not meet"; the options are still ranked and shown) | `statuses` (Meets / Meets with flags / Does not meet counts) |
| 10 | `flags` | every 250 | none | `optionsWithMajorFlags` |
| 11 | `deliverability` | every 250 | none | none |
| 12 | `scoring-ranking` | in the pool, `step: merge` with `workers`, `options`, `distinctConfigurations`, `duplicatedAcrossWorkers` | `equal-weights`, `metric-non-finite` | `leader`, `leaderScore`, `dominated`, `equalWeightsUsed`, `rankCompliantFirst`, `weights` |

Warnings record run-level conditions. Per-option conditions stay as flags on the options, and the log counts them; it does not list each one.

### Worker pool and fallback

- **Pool.** The main thread runs stage 1 as a coordinator (source `main`), which gives the input hash. Each worker runs stages 1 to 11 on its slice with its own logger (source `worker k`, own `seq` from 0) and returns the log with its result. For the live panel it also streams copies of its events in batches (every 200 events or 120 ms); test 6c checks the streamed copies equal the returned log. `mergeRuns` runs stage 12 on main and merges with `mergeLogs`: order by stage, then source (main, worker 0, worker 1, …), then the source's own `seq`, renumbered 0..N−1. Within a source the order is that source's sequence order. The merged log never goes backwards in stage order.
- **Main-thread fallback.** `runModelSteps` is a generator that yields between work items. The fallback drains it in 30 ms slices with `setTimeout(0)` between them, so the progress panel updates during the run. The log content is identical to the synchronous run (test 6d).
- **Cancelled or failed runs.** Events received so far are kept per source. "Download run log" then exports a partial log, merged the same way, with `_partial` in the file name and `status: partial` in the JSON header.

Worker slices are taken by index (every k-th option). Options that share a dispatch configuration can land in different workers, and each worker's cache is local. On T1 with 3 workers, 185 of 1,732 configurations are simulated in more than one worker. The merge step reports this (`duplicatedAcrossWorkers`). Results are unaffected; it only costs time. Slicing by configuration key would remove it, but it is not done here.

### UI

- **Run progress panel** (above the run summary, open by default): headline (current stage and percent, event count, warnings), one row per stage with percent complete, a bar, cache hit/miss and warning count, and a scrolling log of the last 200 events. The log follows the newest event until the user scrolls up; a "Follow latest events" control resumes following. On a phone (below 768 px) stages are one column, and each log line wraps under its timestamp, source and stage. There is no horizontal scroll at 390 px (checked headless).
- **Percent per stage** is the mean over the sources expected to run it: workers for stages 1 to 11, main for stage 12. In the pool, stage 1 also runs on main, and the panel shows the workers' share.
- **Accessibility.** One polite, atomic live region announces the current stage only, when it changes, for example "Run in progress: Dispatch (8760 h), stage 5 of 12.", then "Run complete. All stages finished." The event log is `role="log"` with `aria-live="off"`, so individual events are not announced. The status line spinner text is `aria-hidden` while running, so the stage is not announced twice.
- **Download run log**: JSON and CSV buttons. File names are `run-log_<inputHash>_<YYYYMMDD-HHMMSSZ>.json|csv`, plus `_partial` for an unfinished run. The JSON has a header (`schema: dc-energy-run-log/1`, input hash, engine version, mode, run start and export time, validation result, stage list, field list, event count) and then one event per line. The CSV has one row per event, columns in schema order, with `detail` as a quoted JSON string.

Size: a T1 log is 2,086 events (single thread) or 2,089 to 2,155 (pool, depending on worker count), about 1.3 MB as JSON. The UI holds the full log only in the finished run object; the panel keeps 200 events.

## Test 3: root cause and change

**Symptom.** Test 3 ("No option is hidden by default") asserted at least one option with resilience status "Does not meet" on T1 and on T3, and none existed.

**Finding: the test sample was wrong.** T1 and T3 at brief defaults give 185 Meets, 1,815 Meets with flags and 0 Does not meet on each. This follows from the brief, not from a broken check:
- The default C5 subset is HVO, diesel and retained bridging plant (§8); gas, BESS-UPS and None are not generated by default.
- C6 and C7 are locked to the requirement (§8).
- Every option is sized to the requirement by the §9.2 backup rule (§2 principle 9). Retained plant is sized by the same rule (Brief issue 4).

So every option meets the requirement by construction. When the check was probed directly on T1, it failed every case that must fail: C5 = None (backed load and autonomy), topology N under N+1, autonomy 12 h and belly tanks under 48 h, islanding required on grid-only, and retained gas plant with gas = No.

**Change to the test.** The assertion is unchanged and still required. It now runs on a sample that exercises failing resilience: T1 with C5 = None included and the other open choices locked, so all 36 combinations are screened without sampling. The sample contains the must-fail case: grid-only with no backup on a required 100 % backed load, which has 0 MW backed load. The test asserts that case is "Does not meet" with "Backed load" named, that every C5 = None option is "Does not meet" with a named failing item, and that the failing options appear in the default view and are ranked. The T1 and T3 checks (every option shown, no chips, archetypes present, dominated options ranked, T3 grid-dependent options flagged) are unchanged. The hidden-by-default behaviour (`applyView`, `DEFAULT_VIEW`, `hideDominated` off) is untouched.

## Resilience check fix

Writing the test 3 sample exposed one defect in the check (`src/engine/evaluate.js`, `resilience`):
- **Defect.** C5 = None forced "Does not meet" through `fail = … || v.C5 === 'none'`, with no item recorded. An islanded C5 = None option whose retained bridging plant covers the critical load passed every named item, so it showed "Does not meet" with an empty failing list. Three of the 36 test-3 options did this (islanded gas recip, fuel cell and rented plant, 137 to 140 MW against 127.7 MW critical). §9.7 requires the failing item to be named.
- **Fix.** C5 = None now adds a named failing item, "Backup technology: none selected (C5 = None); on-site plant counted above is not a designated backup". Status is derived from the items only. The pass/fail outcome is unchanged (C5 = None still always fails, as before). Only the missing name is fixed.
- **Effect.** No change on T1 or T3, which have no C5 = None options; the outputs are byte-identical before and after. In the test-3 sample, the three islanded options now name "Backup technology", and the grid-only and bridge options name "Backed load", "Autonomy" and "Backup technology".
- **Open point (not changed).** Whether C5 = None with on-site plant that meets every item should be "Meets with flags" rather than "Does not meet" is a brief question. §8 says "None (flagged)" and §9.7 counts retained and prime plant as backed load. The previous rule is kept.

## Test run

`npm test` (`node tests/run-tests.mjs`), 2026-10-15, Node v22.22.0, 2-core sandbox, exit code 0, wall time 1 min 05 s. Output as printed:

```
Running core-slice tests…
T1 run: 2000 options screened of 57028 combinations in 8.83 s (single thread, 1732 distinct dispatch runs, 10394 8760-h years)
T3 run: 2000 options in 10.07 s
PASS  1. Per-hour energy balance (supply = demand + losses + curtailment + unmet), T1 and T3, full 8760-h years  (2724 ms)
      120 options, 6,342,240 hours checked; max |error| 2.84e-14 MWh (max relative 5.01e-16); SOC recursion max error 0.00e+0 MWh; BESS losses 269855 MWh and unmet 31972299 MWh across the sample. In-engine per-hour check over all 4000 screened options: max 2.84e-14 MWh.
PASS  2. Grid connection equals the offered capacity on every option, never resized; import never exceeds it in "Show unmet load"  (1184 ms)
      2000 options: grid connection = offered profile (20 MW to month 29, 120 MW from month 30) in every month; one connection capex value across all options; 2,698,080 hours checked, max import − offered = 3.55e-15 MW; 1039 options with unmet load, all flagged "Grid capacity binding" (major).
Test-3 resilience-fail sample: 36 options (sampling off).
PASS  3. No option is hidden by default  (11 ms)
      Resilience Meets/Meets with flags/Does not meet in the default view: T1 185/1815/0, T3 185/1815/0, T1 + C5 None 7/22/7; 7 "Does not meet" options shown and ranked (best rank 5 of 36), incl. 1 grid-only C5 = None at 0 MW backed failing "Backed load"; failing items on the 7 C5 = None options: Backed load + Autonomy + Backup technology | Backup technology. T1: 2000/2000 shown by default (1950 dominated, all shown and ranked); T3: 2000/2000 shown; 415 T3 grid-dependent options listed with unmet load + "Grid capacity binding" + time-to-power flags; archetypes present: A1, A2, A3, A4, A5, A6, A7, A8, A9, A10a, A10b.
PASS  4. Score and rank do not change when a view filter changes  (131 ms)
      10 view configurations (visible counts 50, 185, 0, 961, 1900, 29, 50, 11, 1113, 11 of 2000); 2000 scores and ranks identical before and after each.
PASS  5a. Determinism: same inputs + seed give identical outputs  (9843 ms)
      2000 options identical on two runs; a different seed gives a different Latin hypercube sample.
PASS  5b. Weight change re-ranks without re-dispatch; effective weights sum to 1  (0 ms)
      Balanced effective weights 35/25/25/15 %; all-zero → 25 % each with notice.
PASS  5c. "Show exceedance" removes unmet load on T3 and raises "Import exceeds grid capacity"  (1081 ms)
      21 grid-dependent T3 options: unmet 0 MWh, all flagged "Import exceeds grid capacity" (major).
PASS  5d. Every default record carries the "indicative — unverified" label and a basis  (0 ms)
      371 default records; all "indicative — unverified", confidence C, verified false; basis: source 269, judgement 98, run setting 4.
PASS  6a. Event log completeness: every stage has a start and an end, sequence numbers contiguous, stage order as specified (T1, T3 and the test-3 sample)  (22 ms)
      T1: 2086 events, seq 0–2085 contiguous, 12/12 stages start→end in order; dispatch 2000 progress events (1732 miss / 268 hit), resilience {"Meets":185,"Meets with flags":1815,"Does not meet":0}, 5 warnings (profiles-synthetic, defaults-unverified, cap-sampling, unmet-load, full-load-not-reached).
      T3: 2088 events, seq 0–2087 contiguous, 12/12 stages start→end in order; dispatch 2000 progress events (1721 miss / 279 hit), resilience {"Meets":185,"Meets with flags":1815,"Does not meet":0}, 7 warnings (profiles-synthetic, defaults-unverified, cap-sampling, unmet-load, full-load-not-reached, lcoe-non-finite, metric-non-finite).
      T1 + C5 None: 73 events, seq 0–72 contiguous, 12/12 stages start→end in order; dispatch 36 progress events (18 miss / 18 hit), resilience {"Meets":7,"Meets with flags":22,"Does not meet":7}, 5 warnings (profiles-synthetic, defaults-unverified, unmet-load, full-load-not-reached, requirement-not-met).
PASS  6b. Log content (timestamps excluded) is identical across two runs with the same inputs  (10 ms)
      2086 events identical on two T1 runs excluding t_ms (2086 of 2086 timestamps differ); input hash 0c072fa78e6f1a70 is independent of key order and changes when an input changes.
PASS  6c. Worker pool: each worker returns its own events; merged log complete, ordered and deterministic; results equal the single-thread run  (18919 ms)
      3 workers (
```

Before this change the same script gave 7/8, with test 3 failing at `assert.ok(list.some((o) => o.resilience.status === 'Does not meet'))`. See "Test 3: root cause and change".

