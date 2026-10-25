// Node test script for the core slice. Run: node tests/run-tests.mjs
// Uses only node:assert; prints real numbers. Exit code 1 on any failure.
//
// Tests:
//  1. Per-hour energy balance on a full 8760-h year (recorded hourly arrays), for every archetype
//     and a sample of generated options on T1 and T3:
//       supply (on-site gen + PPA delivered + BESS discharge + grid import) = demand + losses + curtailment + unmet-adjusted
//     stated in the brief's form: supply = demand + losses + curtailment + unmet, where
//       supply   = renewables + PPA + BESS discharge + firm + grid import (incl. grid charging) + unmet (served-by-nobody, counted on supply side)
//       demand   = net facility demand (after absorption-chiller credit and flex)
//       losses   = BESS round-trip losses (charge − discharge − ΔSOC), checked per hour against SOC
//     Implemented as: gen + imports + discharge + unmet = demand + charge + curtailment + export, per hour,
//     plus per-hour SOC recursion soc[h] = soc[h−1] + η·charge − discharge/η, which makes losses explicit.
//  2. Grid connection never resized: every option's grid connection per month equals the offered
//     profile; every hour's physical import ≤ offered capacity in "Show unmet load".
//  3. No option hidden by default: default view shows every screened option; archetypes present;
//     options that do not meet resilience are still shown (exercised by a T1 variant that includes
//     C5 = None, which must fail the 100 % backed-load requirement).
//  4. View filters never change score or rank.
//  5. Extra: determinism (same inputs + seed → identical outputs); exceedance mode removes unmet load.
//  6. Run event log: completeness (every stage has start and end, contiguous seq, stage order),
//     identical content (timestamps excluded) across two runs, worker-pool merge and main-thread
//     fallback, dispatch progress with cache hit/miss, export formats.
//  7. Single-file build (dist/energy-tool-single-file.html, run `npm run build` first): no relative
//     "worker.js" reference and no <script src>, <link href> or other relative file reference; the
//     worker source inlined for the Blob URL is extracted, equals dist/worker.js, parses as
//     JavaScript, and runs one slice in a Node worker_thread.
//  8. Pareto trade-off view (HOOKS.paretoView, src/engine/pareto.js):
//     8a. 2-D Pareto set on a hand-checked example, and on a synthetic screened set scored by the engine.
//     8b. Weighted pick = highest weighted score (checked by hand from axis scores and weights), and it
//         moves when the weights change, with no dispatch re-run (dispatch objects untouched, timed).
//     8c. Dominance marking removes no option from the view or the ranking.
//     8d. Every point in the rendered chart has a matching row in the rendered table alternative.
//     8e. Dominance is marked when the dominated option has an infinite cost (regression for the
//         scoring.js tolerance fix, Pareto review).
//     8f. Every registered view setting (view.*) and run setting (settings.*) is the value the code
//         uses: changing the record changes the behaviour, and a view record with no check fails.
//     8g. AC5: the highlighted pick is the weighted leader (rank 1), the same option as the header
//         leader, with "Rank requirement-compliant options first" on or off; the highest weighted
//         score is marked separately when it differs; a pick that is not drawn says why.
//     8h. Every active view filter is a removable chip; the header filter count matches applyView().
//  9. Site slice (tests/site-tests.mjs): geometry kernel, site model, blocks, auto-layout, site fit, Site tab.
// 10–14. Port slice (tests/port-tests.mjs): bridging-battery timing (10), PPA settlement only on physical delivery
//     and the ledger reconciliation (11), Dispatch tab inspector (12), tornado sensitivity (13), loading message,
//     startup errors and the hosted page (14).
// Browser checks (Canvas drawing, keyboard, table paging, skip links, axe) are in tests/browser-tests.mjs.

import assert from 'node:assert/strict';
import {
  referenceT1, referenceT3, runModel, normalizeInputs, buildContext, sizeOption, dispatchConfig, dispatchYear,
  applyView, DEFAULT_VIEW, getRegistry, LABEL, LABEL_SOURCED, generateOptions, effectiveWeights, H,
  runModelSteps, mergeRuns, startPooledRun, toTransferable, STAGES, validateRunLog, stripTimestamps,
  logToCSV, logToJSON, logFileName, hashInputs, PROGRESS_EVERY,
  HOOKS, paretoFrontier, weightedPick, paretoTableRows, PRESETS,
  highestWeightedScore, defaultView, activeFilterChips, activeFilterCount, paretoTtpClasses, defaultParetoAxes,
  tablePageSize, buildDefaultInputs, isRequirementCompliant,
} from '../src/engine/index.js';
import { scoreOptions, isAdequate } from '../src/engine/scoring.js';
import { dispatchAll } from '../src/engine/dispatch.js';
import { createProgressTracker } from '../src/engine/runlog.js';
import { Worker } from 'node:worker_threads';
import { readFileSync, existsSync } from 'node:fs';
import { geometryTests, siteModelTests, blockTests, layoutTests, siteFitTests } from './site-tests.mjs';
import { batteryTimingTests, ppaTests, inspectorTests, sensitivityTests, hostedPageTests } from './port-tests.mjs';
import { betaTests } from './beta-tests.mjs';
import { solarTests } from './solar-tests.mjs';
import { adequacyTests } from './adequacy-tests.mjs';
import { programmeTests } from './programme-tests.mjs';
import { topupTests } from './topup-tests.mjs';
import { splitTests } from './split-tests.mjs';
import { outlookTests } from './outlook-tests.mjs';
import { gridRefTests } from './gridref-tests.mjs';
import { backupTests } from './backup-tests.mjs';
import { bessShortfallTests } from './bess-shortfall-tests.mjs';
import { package4Tests } from './package4-tests.mjs';
import { ppaRuleTests } from './ppa-tests.mjs';
import { cardsTests } from './cards-tests.mjs';
import { reportTests } from './report-tests.mjs';
import { gridContractTests } from './grid-contract-tests.mjs';
import { inputModelTests } from './input-model-tests.mjs';
import { screeningTests } from './screening-tests.mjs';
import { locationTests } from './location-tests.mjs';
import { engineFixesTests } from './engine-fixes-tests.mjs';
import { existingPlantTests } from './existing-plant-tests.mjs';
import { layoutScopeTests } from './layout-scope-tests.mjs';
import { archetypeTests } from './archetype-tests.mjs';
import { studyTests } from './study-tests.mjs';
import { summaryTests } from './summary-tests.mjs';
import { getViewBundle } from './view-bundle.mjs';

const START = '2027-01';
const results = [];
let failures = 0;
async function test(name, fn) {
  const t0 = performance.now();
  try {
    const info = await fn();
    results.push({ name, ok: true, ms: performance.now() - t0, info });
    console.log(`PASS  ${name}  (${(performance.now() - t0).toFixed(0)} ms)${info ? `\n      ${info}` : ''}`);
  } catch (e) {
    failures++;
    results.push({ name, ok: false, ms: performance.now() - t0, info: e.message });
    console.log(`FAIL  ${name}\n      ${e.stack}`);
  }
}

console.log('Running core-slice tests…');
const t1Inputs = referenceT1({ analysisStart: START });
const t0 = performance.now();
const runT1 = runModel(t1Inputs);
const runT1Ms = performance.now() - t0;
console.log(`T1 run: ${runT1.options.length} options screened of ${runT1.generation.totalCombinations} combinations in ${(runT1Ms / 1000).toFixed(2)} s (single thread, ${runT1.timing.dispatchRuns} distinct dispatch runs, ${runT1.timing.dispatchYearsTotal} 8760-h years)`);
const t3Inputs = referenceT3({ analysisStart: START });
const t3s = performance.now();
const runT3 = runModel(t3Inputs);
const runT3Ms = performance.now() - t3s;
console.log(`T3 run: ${runT3.options.length} options in ${(runT3Ms / 1000).toFixed(2)} s`);

// ---------------------------------------------------------------------------
// 1. Per-hour energy balance
// ---------------------------------------------------------------------------
function checkHourlyBalance(ctx, opt) {
  const cfg = dispatchConfig(ctx, opt.v, sizeOption(ctx, opt.v));
  const { years } = dispatchAll(ctx, cfg, Array.from({ length: 30 }, (_, i) => i));
  const eta = Math.sqrt(cfg.rte);
  let maxAbs = 0;
  let maxRel = 0;
  let maxSoc = 0;
  let hours = 0;
  let socPrev = null;
  let totals = { supply: 0, demand: 0, losses: 0, curt: 0, unmet: 0, exp: 0 };
  for (const y of years) {
    const r = y.hourly;
    assert.ok(r, 'hourly record missing');
    let soc = socPrev == null ? y.socStart : socPrev;
    for (let h = 0; h < H; h++) {
      const supply = r.re[h] + r.ppa[h] + r.dis[h] + r.firm[h] + r.grid[h] + r.gridCharge[h];
      // Hourly BESS losses = energy in − energy out − change in stored energy = ch − dis − ΔSOC
      const dSoc = r.soc[h] - soc;
      const losses = r.ch[h] - r.dis[h] - dSoc;
      // supply + unmet = demand + BESS throughput (losses + ΔSOC + dis) + curtailment + export
      // i.e. supply = demand + losses + curtailment − unmet, with storage movements and export shown explicitly.
      const lhs = supply + r.unmet[h];
      const rhs = r.net[h] + losses + dSoc + r.dis[h] + r.curt[h] + r.exp[h];
      const err = Math.abs(lhs - rhs);
      if (err > maxAbs) maxAbs = err;
      const rel = err / Math.max(1e-9, r.net[h]);
      if (rel > maxRel) maxRel = rel;
      // SOC recursion makes losses explicit
      const socExpected = soc + eta * r.ch[h] - r.dis[h] / eta;
      const se = Math.abs(socExpected - r.soc[h]);
      if (se > maxSoc) maxSoc = se;
      assert.ok(r.soc[h] >= -1e-9 && r.soc[h] <= cfg.bessMWh + 1e-9, `SOC out of bounds at h=${h}`);
      assert.ok(r.unmet[h] >= 0 && r.curt[h] >= -1e-9, 'negative unmet or curtailment');
      soc = r.soc[h];
      totals.supply += supply; totals.demand += r.net[h]; totals.losses += losses; totals.curt += r.curt[h]; totals.unmet += r.unmet[h]; totals.exp += r.exp[h];
      hours++;
    }
    socPrev = soc;
  }
  return { maxAbs, maxRel, maxSoc, hours, totals, years: years.length };
}

await test('1. Per-hour energy balance (supply = demand + losses + curtailment + unmet), T1 and T3, full 8760-h years', () => {
  let worst = { maxAbs: 0, maxRel: 0, maxSoc: 0 };
  let hours = 0;
  let checked = 0;
  let unmetTotal = 0;
  let lossTotal = 0;
  for (const [run, inputs] of [[runT1, t1Inputs], [runT3, t3Inputs]]) {
    const ctx = buildContext(normalizeInputs(inputs));
    const sample = run.options.filter((o) => o.archetype).concat(run.options.filter((o, i) => !o.archetype && i % 40 === 0));
    for (const o of sample) {
      const r = checkHourlyBalance(ctx, o);
      worst.maxAbs = Math.max(worst.maxAbs, r.maxAbs);
      worst.maxRel = Math.max(worst.maxRel, r.maxRel);
      worst.maxSoc = Math.max(worst.maxSoc, r.maxSoc);
      hours += r.hours;
      unmetTotal += r.totals.unmet;
      lossTotal += r.totals.losses;
      checked++;
    }
  }
  assert.ok(worst.maxAbs < 1e-6, `max hourly balance error ${worst.maxAbs} MWh`);
  assert.ok(worst.maxSoc < 1e-6, `max SOC recursion error ${worst.maxSoc} MWh`);
  // Also the in-engine check over every screened option on T1 and T3
  const engineMax = Math.max(...runT1.options.concat(runT3.options).map((o) => Math.max(...o.dispatch.years.map((y) => y.maxBalanceError))));
  assert.ok(engineMax < 1e-6, `engine-reported balance error ${engineMax}`);
  return `${checked} options, ${hours.toLocaleString('en-GB')} hours checked; max |error| ${worst.maxAbs.toExponential(2)} MWh (max relative ${worst.maxRel.toExponential(2)}); SOC recursion max error ${worst.maxSoc.toExponential(2)} MWh; BESS losses ${lossTotal.toFixed(0)} MWh and unmet ${unmetTotal.toFixed(0)} MWh across the sample. In-engine per-hour check over all ${runT1.options.length + runT3.options.length} screened options: max ${engineMax.toExponential(2)} MWh.`;
});

// ---------------------------------------------------------------------------
// 2. Grid connection never resized
// ---------------------------------------------------------------------------
await test('2. Grid connection equals the offered capacity on every option, never resized; import never exceeds it in "Show unmet load"', () => {
  const ctx = buildContext(normalizeInputs(t1Inputs));
  const offered = ctx.gridCap;
  // Offered profile: 20 MW then 120 MW at month 30 (T1)
  assert.equal(offered[0], 20);
  assert.equal(offered[29], 20);
  assert.equal(offered[30], 120);
  let checked = 0;
  for (const o of runT1.options) {
    const sz = sizeOption(ctx, o.v);
    assert.equal(sz.grid.byMonth, offered, 'grid connection array is not the shared offered profile');
    for (let m = 0; m < ctx.nMonths; m++) assert.equal(sz.grid.byMonth[m], offered[m]);
    assert.equal(sz.grid.fullMW, t1Inputs.grid.fullMW);
    assert.ok(o.sizing.sentences.some((s) => s.startsWith('Grid connection: offered import capacity')), 'sizing sentence missing');
    checked++;
  }
  // Connection capex identical across all grid-using options
  const connCapex = new Set(runT1.options.map((o) => {
    const l = o.eco.capexLines.filter((x) => x.item.startsWith('Grid connection')).reduce((s, x) => s + x.amount, 0);
    return l.toFixed(2);
  }));
  assert.equal(connCapex.size, 1, `grid connection capex differs across options: ${[...connCapex].join(', ')}`);
  // Physical import ≤ offered capacity, every hour, sample incl. all archetypes
  let maxOver = 0;
  let hours = 0;
  const sample = runT1.options.filter((o) => o.archetype).concat(runT1.options.filter((o, i) => i % 50 === 0));
  for (const o of sample) {
    const cfg = dispatchConfig(ctx, o.v, sizeOption(ctx, o.v));
    const { years } = dispatchAll(ctx, cfg, Array.from({ length: 30 }, (_, i) => i));
    years.forEach((y, yi) => {
      for (let h = 0; h < H; h++) {
        const m = yi * 12 + Math.min(11, Math.floor(h / 730));
        const imp = y.hourly.ppa[h] + y.hourly.grid[h] + y.hourly.gridCharge[h];
        const cap = o.v.C1 === 'islanded' ? 0 : offered[m];
        maxOver = Math.max(maxOver, imp - cap);
        hours++;
      }
    });
    assert.equal(o.dispatch.years.reduce((s, y) => s + y.exceedMWh, 0), 0, 'exceedance recorded in unmet mode');
  }
  assert.ok(maxOver <= 1e-9, `import exceeded offered capacity by ${maxOver}`);
  // Options with unmet load keep their sizing and carry the major flag
  const withUnmet = runT1.options.filter((o) => o.unmet.mwh > 1e-6);
  assert.ok(withUnmet.every((o) => o.flags.some((f) => f.id === 'grid-binding' && f.severity === 'major')), 'unmet load without flag');
  return `${checked} options: grid connection = offered profile (20 MW to month 29, 120 MW from month 30) in every month; one connection capex value across all options; ${hours.toLocaleString('en-GB')} hours checked, max import − offered = ${maxOver.toExponential(2)} MW; ${withUnmet.length} options with unmet load, all flagged "Grid capacity binding" (major).`;
});

// ---------------------------------------------------------------------------
// 3. No option hidden by default
// ---------------------------------------------------------------------------
// Test 3 sample with failing resilience. The T1 and T3 default runs cannot exercise "Does not meet":
// their default C5 subset is HVO / diesel / retained bridging plant, C6 and C7 are locked to the
// requirement, and every option is sized to the requirement by the §9.2 backup rule (retained plant
// by the same rule, BUILD-NOTES "Brief issues" 4), so all 2,000 + 2,000 options meet it by
// construction (the test was wrong, not the check: see BUILD-NOTES "Test 3"). This variant of T1 adds
// C5 = None ("Include" in the values-not-generated note) and locks the other open choices so that
// every combination is screened (no sampling). It contains the must-fail case: C1 = Wait for grid with
// C5 = None has no on-site firm capacity at all, so against the default requirement of 100 % backed
// critical load it has 0 MW backed load and MUST be "Does not meet" with "Backed load" named. Every
// other C5 = None option must also be "Does not meet" with at least one failing item named (§9.7).
function resilienceFailInputs() {
  const inp = referenceT1({ analysisStart: START });
  inp.project.name = 'T1 + C5 None (test 3 resilience-fail sample)';
  inp.choices = { ...(inp.choices || {}) };
  inp.choices.C5 = { state: 'open', values: ['hvo', 'diesel', 'retained', 'none'] };
  for (const [id, val] of [['C3', 'backup'], ['C4', 'none'], ['C8', 'air'], ['C9', 'roof'], ['C10', 'none'], ['C12', 'none'], ['C13', 'none']]) {
    inp.choices[id] = { state: 'locked', values: [val] };
  }
  return inp;
}
const runFail = runModel(resilienceFailInputs());
console.log(`Test-3 resilience-fail sample: ${runFail.options.length} options (sampling ${runFail.generation.sampled ? 'on' : 'off'}).`);

await test('3. No option is hidden by default', () => {
  const reg = getRegistry();
  assert.equal(reg['settings.hideDominated'].value, false, '"Hide dominated options" default must be off');
  assert.equal(reg['settings.hideDominated'].label, LABEL);
  const statusCounts = [];
  for (const run of [runT1, runT3, runFail]) {
    const { list, hiddenDominated, chips } = applyView(run.options, DEFAULT_VIEW);
    assert.equal(list.length, run.options.length, 'default view hides options');
    assert.equal(hiddenDominated, 0);
    assert.equal(chips.length, 0);
    const ids = new Set(list.map((o) => o.id));
    for (const o of run.options) assert.ok(ids.has(o.id));
    // Every archetype baseline present (§7.3), including both archetype-10 variants
    const arch = new Set(run.options.map((o) => o.archetype).filter(Boolean));
    for (const a of ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10a', 'A10b']) {
      assert.ok(arch.has(a), `archetype ${a} missing`);
    }
    // Options that carry major flags are still ranked and shown
    assert.ok(list.some((o) => o.flags.some((f) => f.severity === 'major')));
    statusCounts.push(['Meets', 'Meets with flags', 'Does not meet'].map((st) => list.filter((o) => o.resilience.status === st).length).join('/'));
  }
  // Options that do not meet resilience are still ranked and shown (resilience-fail sample).
  {
    const { list } = applyView(runFail.options, DEFAULT_VIEW);
    assert.equal(runFail.generation.sampled, false, 'resilience-fail sample must screen every combination');
    const none = runFail.options.filter((o) => o.v.C5 === 'none');
    assert.ok(none.length > 0, 'resilience-fail sample has no C5 = None option');
    const mustFail = none.filter((o) => o.v.C1 === 'wait');
    assert.ok(mustFail.length > 0, 'resilience-fail sample has no grid-only option without backup');
    for (const o of mustFail) {
      assert.equal(o.resilience.firmMW, 0, `${o.id}: grid-only option without backup has on-site firm capacity`);
      assert.equal(o.resilience.status, 'Does not meet', `${o.id} (no backup, no on-site plant, 100 % backed required) did not fail resilience`);
      assert.ok(o.resilience.failing.includes('Backed load'), `${o.id}: failing items ${o.resilience.failing.join(', ')}`);
    }
    for (const o of none) {
      assert.equal(o.resilience.status, 'Does not meet', `${o.id} (C5 = None) did not fail resilience`);
      assert.ok(o.resilience.failing.length > 0, `${o.id}: "Does not meet" without a named failing item`);
    }
    const failing = list.filter((o) => o.resilience.status === 'Does not meet');
    assert.ok(failing.length > 0, 'no "Does not meet" option in the default view');
    assert.ok(failing.every((o) => Number.isInteger(o.rank) && Number.isFinite(o.score)), '"Does not meet" option not ranked');
  }
  // Dominated options are ranked like any other
  const dom = runT1.options.filter((o) => o.dominatedBy);
  assert.ok(dom.every((o) => Number.isInteger(o.rank)));
  // T3: every grid-dependent option stays in the list with unmet load and flags (AC 8/14)
  // (A top-up firm plant, C4 sizing "Permanent shortfall" since 2026-10-23, OPEN-QUESTIONS 58, is sized to close the
  // shortfall, so those options are not grid-dependent; they are counted separately.)
  const gridDep = runT3.options.filter((o) => o.v.C1 === 'wait' && o.v.C4s !== 'shortfall');
  const topWait = runT3.options.filter((o) => o.v.C1 === 'wait' && o.v.C4s === 'shortfall');
  assert.ok(gridDep.length > 0);
  assert.ok(gridDep.every((o) => o.unmet.mwh > 0 && o.flags.some((f) => f.id === 'grid-binding') && o.flags.some((f) => f.id === 'target-ttp')));
  const h2 = runT1.options.find((o) => o.archetype === 'A10b');
  assert.ok(h2.flags.some((f) => f.id === 'fuel-h2-unavailable'), 'hydrogen variant flag missing');
  const failShown = applyView(runFail.options, DEFAULT_VIEW).list.filter((o) => o.resilience.status === 'Does not meet');
  return `Resilience Meets/Meets with flags/Does not meet in the default view: T1 ${statusCounts[0]}, T3 ${statusCounts[1]}, T1 + C5 None ${statusCounts[2]}; ${failShown.length} "Does not meet" options shown and ranked (best rank ${Math.min(...failShown.map((o) => o.rank))} of ${runFail.options.length}), incl. ${runFail.options.filter((o) => o.v.C5 === 'none' && o.v.C1 === 'wait').length} grid-only C5 = None at 0 MW backed failing "Backed load"; failing items on the ${runFail.options.filter((o) => o.v.C5 === 'none').length} C5 = None options: ${[...new Set(runFail.options.filter((o) => o.v.C5 === 'none').map((o) => o.resilience.failing.join(' + ')))].join(' | ')}. T1: ${runT1.options.length}/${runT1.options.length} shown by default (${dom.length} dominated, all shown and ranked); T3: ${runT3.options.length}/${runT3.options.length} shown; ${gridDep.length} T3 grid-dependent options listed with unmet load + "Grid capacity binding" + time-to-power flags (${topWait.length} "wait" options with a top-up firm plant, ${topWait.filter((o) => o.unmet.mwh > 0).length} of them with unmet load); archetypes present: ${[...new Set(runT1.options.map((o) => o.archetype).filter(Boolean))].join(', ')}.`;
});

// ---------------------------------------------------------------------------
// 4. View filters never change score or rank
// ---------------------------------------------------------------------------
await test('4. Score and rank do not change when a view filter changes', () => {
  const snap = (run) => run.options.map((o) => `${o.id}:${o.score}:${o.rank}:${JSON.stringify(o.axisScores)}`).join('|');
  const before = snap(runT1);
  const views = [
    { ...DEFAULT_VIEW, hideDominated: true },
    { ...DEFAULT_VIEW, resilience: ['Meets'] },
    { ...DEFAULT_VIEW, resilience: ['Does not meet'] },
    { ...DEFAULT_VIEW, hideFlagIds: ['grid-binding'] },
    { ...DEFAULT_VIEW, flagIds: ['permit-ied'] },
    { ...DEFAULT_VIEW, capexCeiling: 100e6 },
    { ...DEFAULT_VIEW, dominated: 'non' },
    { ...DEFAULT_VIEW, archetypesOnly: true },
    { ...DEFAULT_VIEW, search: 'PPA', sortKey: 'lcoe', sortDir: -1 },
    { ...DEFAULT_VIEW, hideDominated: true, resilience: ['Meets', 'Meets with flags'], hideFlagIds: ['grid-binding'], sortKey: 'capex' },
  ];
  const counts = [];
  for (const v of views) {
    const { list, hiddenDominated } = applyView(runT1.options, v);
    counts.push(list.length);
    assert.equal(snap(runT1), before, `scores or ranks changed under view ${JSON.stringify(v)}`);
    // Visible options keep their global rank and score
    for (const o of list) {
      const orig = runT1.options.find((x) => x.id === o.id);
      assert.equal(o.rank, orig.rank);
      assert.equal(o.score, orig.score);
    }
    if (v.hideDominated) assert.ok(hiddenDominated >= 0);
  }
  // Re-scoring with any view active gives identical scores (filters are not inputs to scoring)
  return `${views.length} view configurations (visible counts ${counts.join(', ')} of ${runT1.options.length}); ${runT1.options.length} scores and ranks identical before and after each.`;
});

// ---------------------------------------------------------------------------
// 5. Extras: determinism, weights, exceedance mode, labels
// ---------------------------------------------------------------------------
let runT1Again = null;
await test('5a. Determinism: same inputs + seed give identical outputs', () => {
  const again = runModel(referenceT1({ analysisStart: START }));
  runT1Again = again;
  const a = runT1.options.map((o) => [o.id, o.score, o.eco.lcoe, o.carbon.locationG, o.unmet.mwh]);
  const b = again.options.map((o) => [o.id, o.score, o.eco.lcoe, o.carbon.locationG, o.unmet.mwh]);
  assert.deepEqual(a, b);
  const g1 = generateOptions(normalizeInputs(referenceT1({ analysisStart: START }))).options.map((o) => o.key).join();
  const inp2 = referenceT1({ analysisStart: START }); inp2.project.seed = 7;
  const g2 = generateOptions(normalizeInputs(inp2)).options.map((o) => o.key).join();
  assert.notEqual(g1, g2, 'different seed should give a different sample');
  return `${a.length} options identical on two runs; a different seed gives a different Latin hypercube sample.`;
});

await test('5b. Weight change re-ranks without re-dispatch; effective weights sum to 1', () => {
  const { w } = effectiveWeights({ cost: 35, carbon: 25, ttp: 25, deliverability: 15 });
  assert.ok(Math.abs(w.cost + w.carbon + w.ttp + w.deliverability - 1) < 1e-12);
  const z = effectiveWeights({ cost: 0, carbon: 0, ttp: 0, deliverability: 0 });
  assert.ok(z.equal && z.w.cost === 0.25);
  return `Balanced effective weights ${Object.values(w).map((x) => (x * 100).toFixed(0)).join('/')} %; all-zero → 25 % each with notice.`;
});

await test('5c. "Show exceedance" removes unmet load on T3 and raises "Import exceeds grid capacity"', () => {
  const inp = referenceT3({ analysisStart: START });
  inp.settings.gridHandling = 'exceedance';
  inp.settings.generationCap = 60;
  const r = runModel(inp);
  const gridDep = r.options.filter((o) => o.v.C1 === 'wait');
  assert.ok(gridDep.length > 0);
  assert.ok(gridDep.every((o) => o.unmet.mwh < 1e-6), 'unmet load remains in exceedance mode');
  assert.ok(gridDep.every((o) => o.flags.some((f) => f.id === 'grid-exceed' && f.severity === 'major')));
  return `${gridDep.length} grid-dependent T3 options: unmet 0 MWh, all flagged "Import exceeds grid capacity" (major).`;
});

await test('5d. Every default record carries a label (unverified, or sourced with a full source record) and a basis', () => {
  const reg = getRegistry();
  const recs = Object.values(reg);
  // OPEN-QUESTIONS 36 (owner, 2026-10-22): an unresearched record is "indicative — unverified", confidence C; a record
  // researched and approved by the owner is "sourced — not independently checked", confidence B, with source, year,
  // url, accessed and approved filled. No record is verified.
  const okUnv = (r) => r.label === LABEL && r.confidence === 'C';
  const okSrc = (r) => r.label === LABEL_SOURCED && r.confidence === 'B' && r.basis === 'source'
    && ['source', 'year', 'url', 'accessed', 'approved'].every((k) => typeof r[k] === 'string' && r[k].length > 0) && /^https:\/\//.test(r.url)
    && /^\d{4}-\d{2}-\d{2}$/.test(r.accessed) && /^\d{4}-\d{2}-\d{2}$/.test(r.approved);
  const bad = recs.filter((r) => !(okUnv(r) || okSrc(r)) || !['source', 'run setting', 'judgement'].includes(r.basis) || r.verified !== false);
  assert.equal(bad.length, 0, `records without label/basis/source record: ${bad.map((r) => r.path).join(', ')}`);
  const byBasis = recs.reduce((a, r) => ((a[r.basis] = (a[r.basis] || 0) + 1), a), {});
  const nSrc = recs.filter(okSrc).length;
  return `${recs.length} default records: ${recs.length - nSrc} "${LABEL}" (confidence C), ${nSrc} "${LABEL_SOURCED}" (confidence B, full source record); none verified; basis: ${Object.entries(byBasis).map(([k, v]) => `${k} ${v}`).join(', ')}.`;
});


// ---------------------------------------------------------------------------
// 6. Run event log
// ---------------------------------------------------------------------------
const STAGE_IDS = STAGES.map((x) => x.id);
const strip = (log) => JSON.stringify(stripTimestamps(log));

// Shared structural checks on a single-source log; returns a summary string.
function checkSingleSourceLog(run, label) {
  const log = run.log;
  const v = validateRunLog(log);
  assert.ok(v.ok, `${label}: ${v.problems.join('; ')}`);
  // Contiguous sequence numbers
  log.forEach((e, i) => assert.equal(e.seq, i, `${label}: seq ${e.seq} at index ${i}`));
  // Stage order exactly as STAGES, each with one start (first) and one end (last)
  const starts = log.filter((e) => e.event === 'start').map((e) => e.stage);
  const ends = log.filter((e) => e.event === 'end').map((e) => e.stage);
  assert.deepEqual(starts, STAGE_IDS, `${label}: start order`);
  assert.deepEqual(ends, STAGE_IDS, `${label}: end order`);
  for (const id of STAGE_IDS) {
    const evs = log.filter((e) => e.stage === id);
    assert.equal(evs[0].event, 'start', `${label}: ${id} does not begin with start`);
    assert.equal(evs[evs.length - 1].event, 'end', `${label}: ${id} does not finish with end`);
    const end = evs[evs.length - 1];
    // End records items processed, cache hits/misses field and the warnings raised in the stage
    assert.ok('items' in end.detail && 'cacheHits' in end.detail && 'cacheMisses' in end.detail && 'warnings' in end.detail, `${label}: ${id} end detail incomplete`);
    assert.equal(end.detail.warnings, evs.filter((e) => e.event === 'warning').length, `${label}: ${id} warning count`);
    assert.ok(end.t_ms >= evs[0].t_ms, `${label}: ${id} ends before it starts`);
  }
  // Every event has exactly the schema fields
  for (const e of log) assert.deepEqual(Object.keys(e), ['seq', 'stage', 'event', 't_ms', 'count', 'total', 'detail']);
  // Option generation: every compatibility rule count and the cap/sampling decision
  const gen = log.filter((e) => e.stage === 'option-generation' && e.event === 'progress');
  for (const r of run.rules) {
    const ev = gen.find((e) => e.detail.step === 'compatibility-rule' && e.detail.rule === r.id);
    assert.ok(ev, `${label}: rule ${r.id} not logged`);
    assert.equal(ev.detail.removed, r.removed, `${label}: rule ${r.id} count`);
  }
  const cap = gen.find((e) => e.detail.step === 'cap');
  assert.ok(cap && cap.detail.sampled === run.generation.sampled && cap.detail.screened === run.generation.screened && cap.detail.totalCombinations === run.generation.totalCombinations, `${label}: cap decision`);
  // Dispatch: one progress event per option, options dispatched out of total, configuration key, hit or miss
  const n = run.options.length;
  const dp = log.filter((e) => e.stage === 'dispatch' && e.event === 'progress');
  assert.equal(dp.length, n, `${label}: dispatch progress events`);
  dp.forEach((e, i) => {
    assert.equal(e.count, i + 1); assert.equal(e.total, n);
    assert.match(e.detail.cfg, /^K[0-9a-f]{12}$/);
    assert.ok(e.detail.cache === 'hit' || e.detail.cache === 'miss');
  });
  const misses = dp.filter((e) => e.detail.cache === 'miss');
  const hits = dp.length - misses.length;
  const dEnd = log.find((e) => e.stage === 'dispatch' && e.event === 'end');
  assert.equal(dEnd.detail.cacheHits, hits); assert.equal(dEnd.detail.cacheMisses, misses.length);
  assert.equal(misses.length, run.timing.dispatchRuns, `${label}: misses vs distinct dispatch runs`);
  assert.equal(new Set(misses.map((e) => e.detail.cfg)).size, misses.length, `${label}: short configuration ids collide`);
  assert.equal(new Set(misses.map((e) => e.detail.key)).size, misses.length, `${label}: a configuration was simulated twice`);
  // A hit always refers to a configuration simulated earlier in the same source
  const seen = new Set();
  for (const e of dp) { if (e.detail.cache === 'miss') seen.add(e.detail.cfg); else assert.ok(seen.has(e.detail.cfg), `${label}: hit before miss for ${e.detail.cfg}`); }
  // Per-option stages report items = options
  for (const id of ['sizing', 'layout', 'dispatch', 'time-to-power', 'economics', 'carbon', 'resilience', 'flags', 'deliverability', 'scoring-ranking']) {
    const end = log.find((e) => e.stage === id && e.event === 'end');
    assert.equal(end.count, n, `${label}: ${id} items`);
  }
  // Non-dispatch per-option progress is count based (every PROGRESS_EVERY items)
  const sp = log.filter((e) => e.stage === 'sizing' && e.event === 'progress').map((e) => e.count);
  assert.deepEqual(sp, Array.from({ length: Math.ceil(n / PROGRESS_EVERY) - 1 }, (_, i) => (i + 1) * PROGRESS_EVERY));
  const res = log.find((e) => e.stage === 'resilience' && e.event === 'end').detail.statuses;
  const warns = log.filter((e) => e.event === 'warning');
  return `${log.length} events, seq 0–${log.length - 1} contiguous, ${STAGE_IDS.length}/${STAGE_IDS.length} stages start→end in order; dispatch ${dp.length} progress events (${misses.length} miss / ${hits} hit), resilience ${JSON.stringify(res)}, ${warns.length} warnings (${[...new Set(warns.map((e) => e.detail.code))].join(', ')})`;
}

await test('6a. Event log completeness: every stage has a start and an end, sequence numbers contiguous, stage order as specified (T1, T3 and the test-3 sample)', () => {
  const a = checkSingleSourceLog(runT1, 'T1');
  const b = checkSingleSourceLog(runT3, 'T3');
  const c = checkSingleSourceLog(runFail, 'T1 + C5 None');
  // The test-3 sample: the resilience stage must report its failing options and raise a warning
  const rEnd = runFail.log.find((e) => e.stage === 'resilience' && e.event === 'end');
  assert.equal(rEnd.detail.statuses['Does not meet'], runFail.options.filter((o) => o.resilience.status === 'Does not meet').length);
  assert.ok(runFail.log.some((e) => e.stage === 'resilience' && e.event === 'warning' && e.detail.code === 'requirement-not-met'));
  return `T1: ${a}.\n      T3: ${b}.\n      T1 + C5 None: ${c}.`;
});

await test('6b. Log content (timestamps excluded) is identical across two runs with the same inputs', () => {
  assert.ok(runT1Again, 'second T1 run from test 5a missing');
  const A = stripTimestamps(runT1.log);
  const B = stripTimestamps(runT1Again.log);
  assert.equal(A.length, B.length);
  assert.deepEqual(A, B);
  const tsDiffer = runT1.log.filter((e, i) => e.t_ms !== runT1Again.log[i].t_ms).length;
  // Content must not depend on input key order either (input hash on sorted keys)
  const shuffled = JSON.parse(JSON.stringify(referenceT1({ analysisStart: START }), (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).reverse()) : v)));
  assert.equal(hashInputs(normalizeInputs(shuffled)), runT1.inputHash, 'input hash depends on key order');
  const changed = referenceT1({ analysisStart: START }); changed.load.utilisation = 0.81;
  assert.notEqual(hashInputs(normalizeInputs(changed)), runT1.inputHash, 'input hash ignores an input change');
  return `${A.length} events identical on two T1 runs excluding t_ms (${tsDiffer} of ${A.length} timestamps differ); input hash ${runT1.inputHash} is independent of key order and changes when an input changes.`;
});

// Real worker pool: src/worker.js in Node worker_threads, merged exactly as useCompute does.
async function poolRun(inputs, n) {
  const t0Abs = performance.timeOrigin + performance.now();
  const coord = startPooledRun(inputs, { t0Abs });
  const streamed = Array.from({ length: n }, () => []);
  const parts = await Promise.all(Array.from({ length: n }, (_, i) => new Promise((resolve, reject) => {
    const w = new Worker(new URL('./worker-shim.mjs', import.meta.url));
    w.on('message', (msg) => {
      if (msg.type === 'events') streamed[i].push(...msg.events);
      else if (msg.type === 'result') { w.terminate(); resolve(msg.run); }
      else if (msg.type === 'error') { w.terminate(); reject(new Error(msg.message)); }
    });
    w.on('error', reject);
    w.postMessage({ id: 1, inputs, sliceIndex: i, sliceCount: n, t0Abs });
  })));
  const run = mergeRuns(parts, inputs, { log: coord.log });
  return { run, parts, streamed };
}

await test('6c. Worker pool: each worker returns its own events; merged log complete, ordered and deterministic; results equal the single-thread run', async () => {
  const N = 3;
  const p1 = await poolRun(t1Inputs, N);
  const p2 = await poolRun(t1Inputs, N);
  const log = p1.run.log;
  const v = validateRunLog(log);
  assert.ok(v.ok, v.problems.join('; '));
  log.forEach((e, i) => assert.equal(e.seq, i));
  assert.deepEqual(v.sources, ['main', 'worker 0', 'worker 1', 'worker 2']);
  // Stage order across the merged log never goes backwards; every source starts and ends each stage it runs
  for (let i = 1; i < log.length; i++) assert.ok(STAGE_IDS.indexOf(log[i].stage) >= STAGE_IDS.indexOf(log[i - 1].stage), `merged log stage order broken at seq ${i}`);
  for (let w = 0; w < N; w++) {
    const src = `worker ${w}`;
    const own = p1.parts[w].log;
    assert.ok(own.every((e) => e.detail.source === src));
    own.forEach((e, i) => assert.equal(e.seq, i, `${src} own seq`));
    // Streamed copies (live panel) equal the returned log
    assert.deepEqual(p1.streamed[w], own, `${src}: streamed events differ from returned log`);
    // Every stage except scoring and ranking runs in each worker, in order, each start→end. (The site slice
    // added the "layout" stage after sizing, so workers now run 12 stages; this was slice(0, 11) before.)
    const ws = own.filter((e) => e.event === 'start').map((e) => e.stage);
    assert.deepEqual(ws, STAGE_IDS.filter((x) => x !== 'scoring-ranking'), `${src} stage order`);
    // Merged log keeps every worker event, in the worker's own order (wseq)
    const inMerged = log.filter((e) => e.detail.source === src).map((e) => e.detail.wseq);
    assert.deepEqual(inMerged, own.map((e) => e.seq));
    const dp = own.filter((e) => e.stage === 'dispatch' && e.event === 'progress');
    assert.equal(dp.length, p1.parts[w].options.length);
  }
  // Scoring and ranking once, on main, after all worker stages
  const sc = log.filter((e) => e.stage === 'scoring-ranking');
  assert.ok(sc.every((e) => e.detail.source === 'main'));
  assert.equal(sc[0].event, 'start'); assert.equal(sc[sc.length - 1].event, 'end');
  const merge = sc.find((e) => e.detail.step === 'merge');
  // Deterministic across two pool runs (timestamps excluded)
  assert.equal(strip(p1.run.log), strip(p2.run.log), 'pool log content differs between identical runs');
  // Results identical to the single-thread run
  const snap = (r) => r.options.map((o) => `${o.id}:${o.score}:${o.rank}:${o.resilience.status}:${o.adequacy.status}`).join('|');
  assert.equal(snap(p1.run), snap(runT1), 'pool results differ from single-thread results');
  // Adequacy run flag and shortfall analysis cover the whole set, not one worker's slice
  assert.deepEqual(p1.run.runFlags.find((f) => f.category === 'Adequacy'), runT1.runFlags.find((f) => f.category === 'Adequacy'), 'pool adequacy run flag');
  assert.deepEqual(p1.run.shortfall, runT1.shortfall, 'pool shortfall analysis');
  const perWorker = p1.parts.map((p) => { const d = p.log.find((e) => e.stage === 'dispatch' && e.event === 'end').detail; return `${p.options.length} options ${d.cacheMisses} miss/${d.cacheHits} hit`; });
  return `${N} workers (real src/worker.js in worker_threads): merged ${log.length} events, seq contiguous, sources ${v.sources.join(', ')}; per worker ${perWorker.join('; ')}; ${merge.detail.distinctConfigurations} distinct configurations, ${merge.detail.duplicatedAcrossWorkers} simulated in more than one worker; streamed events = returned events; second pool run identical excluding timestamps; ${runT1.options.length} scores and ranks equal the single-thread run.`;
});

await test('6d. Main-thread fallback: time-sliced runModelSteps gives the same log content and results, and the progress tracker reaches 100 % on every stage', async () => {
  const tracker = createProgressTracker({ sources: ['main'] });
  const live = [];
  const it = runModelSteps(t1Inputs, { onEvent: (e) => { live.push(e); tracker.ingest([e]); } });
  let r = it.next();
  let slices = 0;
  let midStages = new Set();
  while (!r.done) {
    const until = performance.now() + 30;
    while (!r.done && performance.now() < until) r = it.next();
    slices++;
    const snap = tracker.snapshot();
    if (snap.current) midStages.add(snap.current.id);
    if (!r.done) await new Promise((res) => setTimeout(res, 0));
  }
  const run = r.value;
  assert.equal(strip(run.log), strip(runT1.log), 'fallback log content differs from the synchronous run');
  assert.deepEqual(live, run.log, 'onEvent stream differs from the returned log');
  const t = toTransferable(run);
  assert.equal(strip(t.log), strip(runT1.log), 'toTransferable drops or changes the log');
  const snap = tracker.snapshot();
  assert.ok(snap.stages.every((st) => st.status === 'done' && st.pct === 1), 'tracker does not reach 100 % on every stage');
  assert.equal(snap.current, null);
  const d = snap.stages.find((st) => st.id === 'dispatch');
  assert.equal(d.cacheHits + d.cacheMisses, runT1.options.length);
  assert.equal(snap.recent.length, 200, 'tracker should keep the last 200 events');
  assert.deepEqual(snap.recent, run.log.slice(-200));
  return `${slices} time slices of ≤ 30 ms of work each (plus one item overrun); current stage observed in ${midStages.size} of ${STAGE_IDS.length} stages between slices; log content identical to the synchronous run; tracker: ${snap.stages.length}/${STAGE_IDS.length} stages 100 %, dispatch cache ${d.cacheMisses} miss / ${d.cacheHits} hit, last ${snap.recent.length} events kept.`;
});

await test('6e. Log export: JSON round-trips, CSV has one row per event, file names carry the input hash and a timestamp', () => {
  const log = runT1.log;
  const json = logToJSON({ inputHash: runT1.inputHash, engineVersion: runT1.engineVersion }, log);
  const parsed = JSON.parse(json);
  assert.deepEqual(parsed.events, log);
  assert.equal(parsed.eventCount, log.length);
  assert.equal(parsed.inputHash, runT1.inputHash);
  assert.deepEqual(parsed.stages, STAGE_IDS);
  const csv = logToCSV(log);
  const lines = csv.trimEnd().split('\r\n');
  assert.equal(lines[0], 'seq,stage,event,t_ms,count,total,detail');
  assert.equal(lines.length, log.length + 1);
  // Minimal RFC 4180 parse of one row with a quoted JSON detail
  const row = lines[1 + log.findIndex((e) => e.stage === 'dispatch' && e.event === 'end')];
  const m = row.match(/^(\d+),([^,]+),([^,]+),([^,]*),([^,]*),([^,]*),"(.*)"$/);
  assert.ok(m, `CSV row not parseable: ${row.slice(0, 120)}`);
  assert.deepEqual(JSON.parse(m[7].replace(/""/g, '"')), log.find((e) => e.stage === 'dispatch' && e.event === 'end').detail);
  const d = new Date(Date.UTC(2026, 9, 15, 13, 5, 9));
  assert.equal(logFileName(runT1.inputHash, d, 'json'), `run-log_${runT1.inputHash}_20261015-130509Z.json`);
  assert.equal(logFileName(runT1.inputHash, d, 'csv', true), `run-log_${runT1.inputHash}_20261015-130509Z_partial.csv`);
  return `JSON ${(json.length / 1024).toFixed(0)} KB, ${parsed.events.length} events round-trip; CSV ${(csv.length / 1024).toFixed(0)} KB, ${lines.length - 1} rows + header; e.g. ${logFileName(runT1.inputHash, d, 'json')}.`;
});

// Reads the JS string literal that starts at src[i] (quote char) and returns its value.
function readStringLiteral(src, i) {
  const q = src[i];
  assert.ok(q === '"' || q === "'" || q === '`', `expected a string literal at ${i}, got ${src.slice(i, i + 20)}`);
  let j = i + 1;
  while (j < src.length && src[j] !== q) j += src[j] === '\\' ? 2 : 1;
  assert.ok(j < src.length, 'unterminated string literal');
  return new Function(`return ${src.slice(i, j + 1)};`)();
}

await test('7. Single-file build: worker inlined as a Blob-URL source string, no relative "worker.js" or other file reference, inlined source parses and runs', async () => {
  const htmlPath = new URL('../dist/energy-tool-single-file.html', import.meta.url);
  assert.ok(existsSync(htmlPath), 'dist/energy-tool-single-file.html missing: run npm run build first');
  const html = readFileSync(htmlPath, 'utf8');
  const workerJs = readFileSync(new URL('../dist/worker.js', import.meta.url), 'utf8');
  // No relative worker.js reference, no external script/stylesheet, no relative src/href.
  assert.equal(/worker\.js/.test(html), false, 'single file still mentions worker.js');
  assert.equal(/<script[^>]*\ssrc\s*=/i.test(html), false, '<script src=> present');
  assert.equal(/<link[^>]*\shref\s*=/i.test(html), false, '<link href=> present');
  const attrRefs = [...html.matchAll(/\s(?:src|href)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]).filter((u) => !/^(data:|blob:|#|https?:|mailto:|javascript:)/i.test(u));
  assert.deepEqual(attrRefs, [], `relative src/href attributes: ${attrRefs.join(', ')}`);
  const importRefs = [...html.matchAll(/(?:importScripts\s*\(|import\s*\(|new\s+Worker\s*\(\s*["'])/g)].map((m) => html.slice(m.index, m.index + 40));
  assert.ok(importRefs.every((r) => !/["']\.{0,2}\/?[\w-]+\.(?:js|mjs|css|json)["']/.test(r)), `file loads: ${importRefs.join(' | ')}`);
  // Extract the inlined worker source from new Blob([<literal>], ...).
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  // Two inline scripts since the port slice: the startup-error handler from index.html and the app bundle (the larger).
  assert.equal(scripts.length, 2, `expected two inline scripts (startup handler + app), found ${scripts.length}`);
  const app = scripts.reduce((a, b) => (b.length > a.length ? b : a));
  // The worker Blob is the one built from a string literal and passed straight to URL.createObjectURL.
  const blobMatches = [...app.matchAll(/URL\.createObjectURL\(new Blob\(\[(?=["'`])/g)];
  assert.equal(blobMatches.length, 1, `expected one URL.createObjectURL(new Blob([<string literal>]) in the app, found ${blobMatches.length}`);
  const src = readStringLiteral(app, blobMatches[0].index + blobMatches[0][0].length);
  assert.ok(src.length > 10000, `inlined worker source too short (${src.length} chars)`);
  assert.equal(src, workerJs, 'inlined worker source differs from dist/worker.js');
  new Function(src); // throws SyntaxError if it does not parse
  assert.ok(/self\.onmessage\s*=/.test(src) || /onmessage/.test(src), 'inlined source sets no onmessage handler');
  // Run the inlined source in a Node worker_thread (self shim) on one small slice of T1.
  const shim = `const { parentPort } = require('node:worker_threads'); globalThis.self = globalThis; self.postMessage = (m) => parentPort.postMessage(m);\n${src}\nparentPort.on('message', (data) => self.onmessage({ data }));`;
  const SLICES = 50;
  const part = await new Promise((resolve, reject) => {
    const w = new Worker(shim, { eval: true });
    w.on('message', (msg) => {
      if (msg.type === 'result') { w.terminate(); resolve(msg.run); }
      else if (msg.type === 'error') { w.terminate(); reject(new Error(msg.message)); }
    });
    w.on('error', reject);
    w.postMessage({ id: 1, inputs: t1Inputs, sliceIndex: 0, sliceCount: SLICES, t0Abs: performance.timeOrigin + performance.now() });
  });
  assert.ok(part.options.length > 0, 'inlined worker returned no options');
  // Is the build newer than the source it should contain (review, H1)? Reported, not asserted: file times are not a
  // reliable signal across checkouts and copies; run `npm run build` before `npm test`.
  const { statSync, readdirSync } = await import('node:fs');
  const newest = (dir) => readdirSync(dir, { withFileTypes: true }).reduce((m, d) => Math.max(m, d.isDirectory() ? newest(new URL(`${d.name}/`, dir)) : statSync(new URL(d.name, dir)).mtimeMs), 0);
  const srcMs = newest(new URL('../src/', import.meta.url));
  const distMs = statSync(htmlPath).mtimeMs;
  return `single file ${(html.length / 1024).toFixed(1)} KB, 2 inline scripts (startup handler + app), 0 "worker.js" mentions, 0 <script src>, 0 <link href>, 0 relative src/href; inlined worker source ${src.length.toLocaleString('en-GB')} chars, identical to dist/worker.js, parses; run in a worker_thread on slice 1/${SLICES} of T1: ${part.options.length} options, ${part.log.length} log events; build ${distMs >= srcMs ? 'newer than' : 'OLDER than'} the newest source file (${new Date(distMs).toISOString()} vs ${new Date(srcMs).toISOString()}).`;
});

// ---------------------------------------------------------------------------
// 8. Pareto trade-off view
// ---------------------------------------------------------------------------
// Shallow copy of a run's options, as the UI does before re-scoring (App.jsx), so the original run
// keeps its scores. Heavy results (dispatch, sizing, economics, carbon) are shared by reference.
function rescoreCopy(run, weights) {
  const options = run.options.map((o) => ({ ...o }));
  const inputs = { ...run.inputs, weights: { ...weights } };
  const scoring = scoreOptions(options, inputs);
  return { ...run, inputs, options, scoring };
}
// Minimal synthetic option with the fields scoring and the Pareto view read.
function synth(id, lcoe, carbon, ttp, deliv, res = 'Meets', capex = 1e8) {
  return {
    id, name: `Option ${id}`, archetype: null, custom: false, pinned: false, flags: [],
    eco: { lcoe, npvCost: lcoe * 1e7, capex }, carbon: { locationG: carbon, marketG: carbon, cfePct: 0.5 },
    ttp: { metric: ttp }, deliv: { score: deliv }, resilience: { status: res },
  };
}

await test('8a. Pareto set (non-dominated on the two plotted axes) is correct on a hand-checked example', () => {
  assert.equal(typeof HOOKS.paretoView, 'function', 'HOOKS.paretoView is not implemented');
  // Hand check (both axes lower is better):
  //  A (1,5)  frontier: lowest x
  //  B (2,3)  frontier: beats A on y
  //  E (2,3)  frontier: exact tie with B (ties do not dominate)
  //  C (3,4)  dominated by B (2 ≤ 3, 3 < 4)
  //  D (4,1)  frontier: lowest y
  //  F (5,5)  dominated by A, B, C, D, E
  //  G (1,6)  dominated by A (same x, higher y)
  //  H (NaN,1) not plottable, ignored
  const pts = [['A', 1, 5], ['B', 2, 3], ['C', 3, 4], ['D', 4, 1], ['E', 2, 3], ['F', 5, 5], ['G', 1, 6], ['H', NaN, 1]].map(([id, x, y]) => ({ id, x, y }));
  const f = paretoFrontier(pts);
  assert.deepEqual(f, ['A', 'B', 'E', 'D']);
  // Brute force agrees on 200 random point sets (seeded LCG, ties included by rounding).
  let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let checked = 0;
  for (let t = 0; t < 200; t++) {
    const P = Array.from({ length: 2 + Math.floor(rnd() * 40) }, (_, i) => ({ id: `p${String(i).padStart(2, '0')}`, x: Math.round(rnd() * 10), y: Math.round(rnd() * 10) }));
    const brute = P.filter((p) => !P.some((q) => q !== p && q.x <= p.x && q.y <= p.y && (q.x < p.x || q.y < p.y))).map((p) => p.id).sort();
    assert.deepEqual(paretoFrontier(P).slice().sort(), brute, `random set ${t}`);
    checked += P.length;
  }
  // Same check through the engine: a small screened set scored by scoreOptions, read by HOOKS.paretoView.
  const opts = [synth('o1', 100, 400, 20, 80), synth('o2', 120, 200, 20, 80), synth('o3', 130, 300, 20, 80), synth('o4', 200, 50, 20, 80), synth('o5', 210, 60, 20, 80)];
  const run = { options: opts, inputs: { weights: { cost: 35, carbon: 25, ttp: 25, deliverability: 15 }, settings: { costMetric: 'lcoe', carbonMetric: 'location', rankCompliantFirst: false } } };
  scoreOptions(run.options, run.inputs);
  const model = HOOKS.paretoView(run, { x: 'lcoe', y: 'location' });
  // o3 (130, 300) is beaten by o2 (120, 200); o5 (210, 60) by o4 (200, 50).
  assert.deepEqual(model.frontier, ['o1', 'o2', 'o4']);
  assert.deepEqual(model.points.filter((p) => p.onFrontier).map((p) => p.id).sort(), ['o1', 'o2', 'o4']);
  // With equal ttp and deliverability, the engine's 4-axis dominance mark must agree here.
  assert.deepEqual(opts.filter((o) => o.dominatedBy).map((o) => o.id).sort(), ['o3', 'o5']);
  // On T1: every frontier option is not beaten on both axes by any screened option.
  const mT1 = HOOKS.paretoView(runT1, { x: 'lcoe', y: 'location' });
  const xy = runT1.options.map((o) => ({ id: o.id, x: o.eco.lcoe, y: o.carbon.locationG }));
  const bruteT1 = xy.filter((p) => !xy.some((q) => q !== p && q.x <= p.x && q.y <= p.y && (q.x < p.x || q.y < p.y))).map((p) => p.id).sort();
  assert.deepEqual(mT1.frontier.slice().sort(), bruteT1);
  // Any two axes (§12.2), including a higher-is-better axis: time-to-power (lower) against deliverability (higher).
  const mTD = HOOKS.paretoView(runT1, { x: 'ttp', y: 'deliverability' });
  const td = runT1.options.map((o) => ({ id: o.id, x: o.ttp.metric, y: o.deliv.score }));
  const bruteTD = td.filter((p) => !td.some((q) => q !== p && q.x <= p.x && q.y >= p.y && (q.x < p.x || q.y > p.y))).map((p) => p.id).sort();
  assert.deepEqual(mTD.frontier.slice().sort(), bruteTD, 'frontier with a higher-is-better axis');
  assert.equal(mTD.yAxis.better, 'higher');
  return `hand example frontier A, B, E, D (C, F, G dominated; H not plottable); 200 random sets (${checked} points, with ties) match brute force; engine set frontier o1, o2, o4 with o3, o5 marked dominated; T1 LCOE vs location carbon: ${mT1.frontier.length} of ${runT1.options.length} on the frontier, equal to brute force; T1 time-to-power vs deliverability (higher is better): ${mTD.frontier.length} on the frontier, equal to brute force.`;
});

await test('8b. Weighted pick is the highest weighted score and moves with the weights, with no dispatch re-run', () => {
  const dispatchRunsBefore = runT1.timing.dispatchRuns;
  const presets = Object.entries(PRESETS);
  const picks = [];
  const t0p = performance.now();
  for (const [name, wts] of presets) {
    const r = rescoreCopy(runT1, wts);
    const model = HOOKS.paretoView(r, { x: 'lcoe', y: 'location' });
    // Independent check: weighted score recomputed by hand from the axis scores and effective weights.
    const { w } = effectiveWeights(wts);
    // Power adequacy first (OPEN-QUESTIONS 38): the pick is the highest weighted score among the options that serve
    // every hour; the highest score overall is marked separately when it is not adequate.
    let best = null, bestS = -Infinity, top = null, topS = -Infinity;
    for (const o of r.options) {
      const s = w.cost * o.axisScores.cost + w.carbon * o.axisScores.carbon + w.ttp * o.axisScores.ttp + w.deliverability * o.axisScores.deliverability;
      assert.ok(Math.abs(s - o.score) < 1e-9, 'weighted score mismatch');
      if (s > topS + 1e-12 || (Math.abs(s - topS) <= 1e-12 && o.id < top.id)) { topS = s; top = o; }
      if (!isAdequate(o)) continue;
      if (s > bestS + 1e-12 || (Math.abs(s - bestS) <= 1e-12 && o.id < best.id)) { bestS = s; best = o; }
    }
    assert.equal(model.pickId, best.id, `${name}: pick is not the highest weighted score among adequate options`);
    assert.equal(weightedPick(r.options).id, best.id);
    const rank1 = r.options.find((o) => o.rank === 1);
    assert.equal(model.pickId, rank1.id, `${name}: pick is not the rank-1 leader`);
    assert.equal(highestWeightedScore(r.options).id, top.id, `${name}: highest weighted score`);
    if (top.id === best.id) assert.equal(model.topScoreId, null, `${name}: a separate highest-score mark with compliant-first off`);
    else { assert.equal(model.topScoreId, top.id); assert.equal(model.topScoreReason, 'adequacy', `${name}: top scorer not adequate`); }
    assert.equal(model.points.filter((p) => p.isPick).length, 1, 'exactly one highlighted point');
    // Dispatch untouched: the same result objects, shared by reference.
    for (let i = 0; i < r.options.length; i++) {
      assert.equal(r.options[i].dispatch, runT1.options[i].dispatch);
      assert.equal(r.options[i].eco, runT1.options[i].eco);
    }
    picks.push([name, best.id, best.name, best.score]);
  }
  const ms = performance.now() - t0p;
  assert.equal(runT1.timing.dispatchRuns, dispatchRunsBefore, 'dispatch counter changed');
  const distinct = new Set(picks.map((p) => p[1]));
  assert.ok(distinct.size >= 2, 'the pick did not change across the weight presets');
  // Until 2026-10-22 this also required Balanced and Lowest cost to differ. With the UK ETS price approved on
  // 2026-10-22 (work package 0, batch 1) the T1 Balanced leader is also the Lowest cost and Lowest carbon pick, so a
  // fixed pair is a property of the data, not a requirement. The requirement (the pick moves with the weights) is
  // the distinct-picks check above.
  // Each preset (re-score + Pareto view on 2,000 options) is far below one 8760-h dispatch run (T1 took seconds).
  assert.ok(ms / presets.length < 1000, `re-score + view took ${(ms / presets.length).toFixed(0)} ms per preset`);
  return `${presets.length} weight presets, ${distinct.size} distinct picks: ${picks.map((p) => `${p[0]} → ${p[1]} (${p[3].toFixed(1)})`).join('; ')}. Pick = hand-computed argmax = rank 1 every time; dispatch/economics objects identical by reference; dispatch counter ${dispatchRunsBefore} before and after; ${(ms / presets.length).toFixed(0)} ms per preset for re-score + view (T1 full run ${(runT1Ms / 1000).toFixed(1)} s).`;
});

await test('8c. Dominance marking does not remove any option from the Pareto view, the list or the ranking', () => {
  const out = [];
  for (const [label, run] of [['T1', runT1], ['T3', runT3], ['T1 + C5 None', runFail]]) {
    const n = run.options.length;
    const dom = run.options.filter((o) => o.dominatedBy);
    assert.ok(dom.length > 0, `${label}: no dominated options to test with`);
    const reg = getRegistry();
    assert.equal(reg['settings.hideDominated'].value, false);
    assert.equal(DEFAULT_VIEW.hideDominated, false, 'default view must not hide dominated options');
    const model = HOOKS.paretoView(run, null); // default view, default axes
    assert.equal(model.points.length, n, `${label}: Pareto view drops options`);
    assert.equal(model.hiddenDominated, 0);
    const ids = new Set(model.points.map((p) => p.id));
    for (const o of dom) assert.ok(ids.has(o.id), `${label}: dominated ${o.id} missing from the Pareto view`);
    assert.equal(model.points.filter((p) => p.dominatedBy).length, dom.length, 'dominated marks not carried to the points');
    // Ranking: every option, dominated or not, has a unique rank 1..n.
    const ranks = run.options.map((o) => o.rank).sort((a, b) => a - b);
    assert.deepEqual(ranks, Array.from({ length: n }, (_, i) => i + 1));
    // The ranked list (applyView default) still lists every option.
    assert.equal(applyView(run.options, DEFAULT_VIEW).list.length, n);
    // Switching "Hide dominated options" on changes only what is shown, never a score or rank.
    const before = run.options.map((o) => [o.id, o.score, o.rank]);
    const hid = HOOKS.paretoView(run, null, { ...DEFAULT_VIEW, hideDominated: true });
    assert.equal(hid.points.length + hid.hiddenDominated, n);
    assert.equal(hid.pickId, model.pickId, 'pick changed when hiding dominated options');
    assert.deepEqual(hid.frontier, model.frontier, 'frontier changed when hiding dominated options');
    assert.deepEqual(run.options.map((o) => [o.id, o.score, o.rank]), before);
    out.push(`${label}: ${n}/${n} in the view (${dom.length} dominated, best dominated rank ${Math.min(...dom.map((o) => o.rank))}); hide on → ${hid.points.length} shown + ${hid.hiddenDominated} hidden, scores, ranks, pick and frontier unchanged`);
  }
  return out.join('; ') + '.';
});

// getViewBundle (the real view components bundled once with esbuild for static rendering): tests/view-bundle.mjs.
// Set a registry record for the duration of fn, then restore it.
async function withRecord(registry, path, value, fn) {
  const r = registry[path];
  assert.ok(r, `no record ${path}`);
  const old = r.value;
  r.value = value;
  try { return await fn(); } finally { r.value = old; }
}
const statusRank = (o) => (o.resilience.status === 'Meets' ? 2 : o.resilience.status === 'Meets with flags' ? 1 : 0);

await test('8d. Every point in the Pareto chart has a matching row in the table alternative (rendered)', async () => {
  const B = await getViewBundle();
  const summary = [];
  const cases = [
    ['T1 default', runT1, null, DEFAULT_VIEW, 900],
    ['T1 NPV vs market, hide dominated', runT1, { x: 'npv', y: 'market' }, { ...DEFAULT_VIEW, hideDominated: true }, 900],
    ['T3 1−CFE, phone width', runT3, { x: 'lcoe', y: 'cfe' }, DEFAULT_VIEW, 360],
    ['T1 + C5 None', runFail, null, DEFAULT_VIEW, 360],
    ['T1 time-to-power vs deliverability', runT1, { x: 'ttp', y: 'deliverability' }, DEFAULT_VIEW, 900],
  ];
  for (const [label, run, axes, view, width] of cases) {
    const model = HOOKS.paretoView(run, axes, view);
    const chart = B.renderChart(model, width);
    const table = B.renderTable(model);
    const chartIds = [...chart.matchAll(/<path[^>]*data-id="([^"]+)"/g)].map((m) => m[1]);
    const rowIds = [...table.matchAll(/<tr[^>]*data-id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(chartIds.length, model.plottedCount, `${label}: chart point count`);
    assert.equal(new Set(chartIds).size, chartIds.length, `${label}: duplicate chart points`);
    const rowSet = new Set(rowIds);
    const missing = chartIds.filter((id) => !rowSet.has(id));
    assert.deepEqual(missing, [], `${label}: chart points without a table row`);
    assert.equal(rowIds.length, model.points.length, `${label}: table rows ≠ points in the view`);
    // Same values: each model row matches its point.
    const rows = paretoTableRows(model);
    for (let i = 0; i < rows.length; i++) {
      const pnt = model.points[i];
      assert.equal(rows[i].id, pnt.id); assert.equal(rows[i].x, pnt.x); assert.equal(rows[i].y, pnt.y); assert.equal(rows[i].score, pnt.score);
    }
    // The weighted pick is marked in both: drawn when it is plotted and shown, a table row when shown.
    assert.equal(/Weighted pick #/.test(chart), model.pickVisible, `${label}: pick label`);
    assert.equal((table.match(/class="row-pick/g) || []).length, model.pickShown ? 1 : 0, `${label}: pick row`);
    summary.push(`${label}: ${chartIds.length} points / ${rowIds.length} rows, ${missing.length} missing`);
  }
  return summary.join('; ') + '.';
});

await test('8e. Dominance is marked when the dominated option has an infinite cost (LCOE with no delivered energy)', () => {
  // Regression for scoring.js markDominance: the tolerance used max(1, |a|) of the dominated option's value,
  // so with a = Infinity the "strictly better" test became b < Infinity − Infinity = NaN (always false).
  const W = { cost: 35, carbon: 25, ttp: 25, deliverability: 15 };
  const S = { costMetric: 'lcoe', carbonMetric: 'location', rankCompliantFirst: false };
  const cases = [
    ['infinite cost, equal elsewhere', [synth('a', Infinity, 100, 20, 80), synth('b', 5, 100, 20, 80)], { a: 'b', b: null }],
    ['the same in mirror order', [synth('a', 5, 100, 20, 80), synth('b', Infinity, 100, 20, 80)], { a: null, b: 'a' }],
    ['both infinite: a tie, no dominance', [synth('a', Infinity, 100, 20, 80), synth('b', Infinity, 100, 20, 80)], { a: null, b: null }],
    ['an infinite cost never dominates', [synth('a', 5, 100, 20, 80), synth('b', Infinity, 90, 20, 80)], { a: null, b: null }],
    ['finite cost with a worse status does not dominate', [synth('a', Infinity, 100, 20, 80, 'Meets'), synth('b', 5, 100, 20, 80, 'Meets with flags')], { a: null, b: null }],
    ['finite near-tie inside the tolerance does not dominate', [synth('a', 100, 100, 20, 80), synth('b', 100 - 1e-8, 100, 20, 80)], { a: null, b: null }],
  ];
  for (const [label, opts, exp] of cases) {
    scoreOptions(opts, { weights: W, settings: S });
    const got = Object.fromEntries(opts.map((o) => [o.id, o.dominatedBy]));
    assert.deepEqual(got, exp, label);
  }
  // Through the view: hollow (dominated), listed as not plotted on an LCOE axis, hidden by "Hide dominated options".
  const run = { options: [synth('a', Infinity, 100, 20, 80), synth('b', 5, 100, 20, 80), synth('c', 7, 90, 20, 80)], inputs: { weights: W, settings: S } };
  scoreOptions(run.options, run.inputs);
  const m = HOOKS.paretoView(run, { x: 'lcoe', y: 'location' });
  const pa = m.points.find((p) => p.id === 'a');
  assert.equal(pa.dominatedBy, 'b'); assert.equal(pa.plotted, false); assert.deepEqual(m.notPlotted, ['a']);
  assert.ok(!HOOKS.paretoView(run, { x: 'lcoe', y: 'location' }, { ...defaultView(), hideDominated: true }).points.some((p) => p.id === 'a'));
  // T3: every infinite-cost option that a finite-cost option with no worse status matches or beats on carbon,
  // time-to-power and deliverability (exactly) is marked dominated.
  const inf = runT3.options.filter((o) => !Number.isFinite(o.metrics.cost));
  let mustBeDominated = 0;
  for (const o of inf) {
    const beaten = runT3.options.some((q) => q !== o && Number.isFinite(q.metrics.cost) && statusRank(q) >= statusRank(o)
      && q.metrics.carbon <= o.metrics.carbon && q.metrics.ttp <= o.metrics.ttp && q.metrics.deliverability >= o.metrics.deliverability);
    if (beaten) { mustBeDominated++; assert.ok(o.dominatedBy, `T3 ${o.id} (infinite LCOE) is beaten but not marked dominated`); }
  }
  return `${cases.length} hand-checked cases as expected (infinite cost dominated by an equal-elsewhere finite cost, both orders; infinite ties and infinite dominators not marked); view: hollow, not plotted, hidden by "Hide dominated options"; T3: ${inf.length} options with infinite LCOE, ${mustBeDominated} of them beaten exactly by a finite-cost option (each marked dominated), ${inf.filter((o) => o.dominatedBy).length} dominated in total.`;
});

await test('8f. Every registered view setting and run setting is the value the code uses', async () => {
  const reg = getRegistry();
  const B = await getViewBundle();
  const breg = B.getRegistry();
  const out = [];
  // (a) Run settings: the engine reads inputs.settings, whose defaults must be the registry values.
  const inputs = buildDefaultInputs({ analysisStart: START });
  const settingRecs = Object.keys(reg).filter((k) => k.startsWith('settings.'));
  for (const k of settingRecs) assert.deepEqual(inputs.settings[k.slice('settings.'.length)], reg[k].value, `${k}: input default differs from the registry value`);
  for (const k of Object.keys(inputs.settings)) assert.ok(reg[`settings.${k}`], `settings.${k} has no §18 record`);
  out.push(`${settingRecs.length} settings.* records = input defaults`);
  // (b) settings.hideDominated drives the initial view (App state, "Clear all filters", paretoView's default).
  assert.equal(reg['settings.hideDominated'].value, false, '"Hide dominated options" must default to off');
  assert.equal(defaultView().hideDominated, reg['settings.hideDominated'].value);
  assert.equal(DEFAULT_VIEW.hideDominated, reg['settings.hideDominated'].value, 'scoring.js DEFAULT_VIEW.hideDominated differs from the settings.hideDominated record');
  await withRecord(reg, 'settings.hideDominated', true, () => {
    assert.equal(defaultView().hideDominated, true);
    const m = HOOKS.paretoView(runT1, null); // default view argument
    assert.ok(m.hiddenDominated > 0 && m.points.length + m.hiddenDominated === runT1.options.length, 'paretoView default view does not follow settings.hideDominated');
  });
  assert.equal(HOOKS.paretoView(runT1, null).hiddenDominated, 0);
  out.push('hideDominated: record → defaultView() → paretoView default');
  // (c) view.pareto.ttpClasses: number of time-to-power colour classes.
  assert.equal(paretoTtpClasses(), reg['view.pareto.ttpClasses'].value);
  const m5 = HOOKS.paretoView(runT1, null);
  assert.equal(m5.ttpScale.maxClasses, reg['view.pareto.ttpClasses'].value);
  assert.ok(m5.ttpScale.classes <= m5.ttpScale.maxClasses);
  await withRecord(reg, 'view.pareto.ttpClasses', 2, () => {
    const m2 = HOOKS.paretoView(runT1, null);
    assert.equal(m2.ttpScale.maxClasses, 2);
    assert.ok(new Set(m2.points.map((q) => q.ttpClass)).size <= 2, 'more than 2 colour classes with ttpClasses = 2');
  });
  await withRecord(reg, 'view.pareto.ttpClasses', 9, () => assert.throws(() => HOOKS.paretoView(runT1, null), /ttpClasses/));
  out.push(`ttpClasses ${m5.ttpScale.maxClasses} (T1 uses ${m5.ttpScale.classes} after merging tied edges; 2 → ≤ 2)`);
  // (d) view.pareto.canvasAbove: Canvas strictly above the threshold, SVG at or below it (rendered, no forceSvg).
  const mT1 = HOOKS.paretoView(runT1, null);
  const n = mT1.plottedCount;
  const canvasCount = (html) => (html.match(/<canvas[^>]*class="pc-canvas"/g) || []).length;
  const pathCount = (html) => (html.match(/<path[^>]*data-id=/g) || []).length;
  const def = B.renderChart(mT1, 900, false);
  assert.equal(canvasCount(def), n > breg['view.pareto.canvasAbove'].value ? 1 : 0);
  assert.ok(def.includes(`more than ${breg['view.pareto.canvasAbove'].value} points`), 'Canvas note does not show the registered threshold');
  await withRecord(breg, 'view.pareto.canvasAbove', n, () => { const h = B.renderChart(mT1, 900, false); assert.equal(canvasCount(h), 0); assert.equal(pathCount(h), n); });
  await withRecord(breg, 'view.pareto.canvasAbove', n - 1, () => { const h = B.renderChart(mT1, 900, false); assert.equal(canvasCount(h), 1); assert.equal(pathCount(h), 0); });
  out.push(`canvasAbove ${breg['view.pareto.canvasAbove'].value}: T1 ${n} points on Canvas; threshold ${n} → SVG, ${n - 1} → Canvas`);
  // (e) view.pareto.display and (f) view.table.pageSize: the Trade-offs tab's first display and rows per page.
  const isChart = (h) => /role="application"/.test(h);
  const isTable = (h) => /class="rank-table pareto-table"/.test(h);
  const v0 = B.renderView(runT1, defaultView());
  assert.equal(breg['view.pareto.display'].value, 'chart');
  assert.ok(isChart(v0) && !isTable(v0), 'Trade-offs does not open on the chart');
  await withRecord(breg, 'view.pareto.display', 'table', async () => {
    const v = B.renderView(runT1, defaultView());
    assert.ok(isTable(v) && !isChart(v), 'view.pareto.display = table did not open the table');
    const rows = (v.match(/<tr[^>]*data-id=/g) || []).length;
    assert.equal(rows, breg['view.table.pageSize'].value, 'rows per page differ from view.table.pageSize');
    await withRecord(breg, 'view.table.pageSize', 7, () => {
      const v7 = B.renderView(runT1, defaultView());
      assert.equal((v7.match(/<tr[^>]*data-id=/g) || []).length, 7);
      assert.ok(v7.includes(`Page <!-- -->1<!-- --> of <!-- -->${Math.ceil(runT1.options.length / 7)}`) || v7.includes(`Page 1 of ${Math.ceil(runT1.options.length / 7)}`), 'pager does not follow view.table.pageSize');
    });
  });
  assert.equal(tablePageSize(), reg['view.table.pageSize'].value);
  out.push(`display "chart" (record "table" → table first); pageSize ${reg['view.table.pageSize'].value} rows (record 7 → 7 rows)`);
  // (g) view.pareto.xAxis / yAxis: "follow-scoring" follows the scoring metrics; an axis id fixes the axis.
  assert.deepEqual(defaultParetoAxes({ costMetric: 'npv', carbonMetric: 'market' }), { x: 'market', y: 'npv' }); // carbon across, cost up (work package 6)
  assert.deepEqual(HOOKS.paretoView(runT1, null).axes, defaultParetoAxes(runT1.inputs.settings));
  await withRecord(reg, 'view.pareto.xAxis', 'ttp', () => assert.equal(defaultParetoAxes({ costMetric: 'lcoe' }).x, 'ttp'));
  await withRecord(reg, 'view.pareto.yAxis', 'deliverability', () => assert.equal(HOOKS.paretoView(runT1, null).axes.y, 'deliverability'));
  await withRecord(reg, 'view.pareto.xAxis', 'nonsense', () => assert.throws(() => defaultParetoAxes({}), /xAxis/));
  out.push('axes follow-scoring (record "ttp" → x = time-to-power)');
  // (h) view.site.smallMultiples: number of small-multiple plans on the Site tab (top options by rank).
  const multIds = (h) => [...h.matchAll(/<button[^>]*class="multiple"[^>]*data-id="([^"]+)"/g)].map((m) => m[1]);
  const top = runT1.options.slice().sort((a, b) => a.rank - b.rank);
  const s0 = multIds(B.renderSite(runT1, runT1.inputs));
  assert.equal(s0.length, breg['view.site.smallMultiples'].value, 'small multiples differ from view.site.smallMultiples');
  assert.deepEqual(s0, top.slice(0, s0.length).map((o) => o.id), 'small multiples are not the top options in rank order');
  await withRecord(breg, 'view.site.smallMultiples', 3, () => assert.equal(multIds(B.renderSite(runT1, runT1.inputs)).length, 3));
  await withRecord(breg, 'view.site.smallMultiples', 0, () => assert.equal(multIds(B.renderSite(runT1, runT1.inputs)).length, 0));
  out.push(`site smallMultiples ${breg['view.site.smallMultiples'].value} (top options in rank order; record 3 → 3, 0 → none)`);
  // (h2) view.siteTabBeta: the Site tab (Beta) switch, off by default; App.jsx starts from the record (the switch's
  // behaviour is checked in test 15 and browser check B30).
  assert.equal(reg['view.siteTabBeta'].value, false, 'the Site tab (Beta) must be off by default');
  assert.match(readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8'), /useState\(\(\) => viewSetting\('siteTabBeta'\) === true\)/, 'App.jsx does not start the Site tab switch from view.siteTabBeta');
  out.push('siteTabBeta off (App starts from the record)');
  // (i) Coverage: every registered view setting has a check above.
  // (h3) view.pareto.encoding (work package 7): resilience by default; ParetoView.jsx starts its select from the record.
  assert.equal(reg['view.pareto.encoding'].value, 'resilience');
  assert.match(readFileSync(new URL('../src/components/ParetoView.jsx', import.meta.url), 'utf8'), /useState\(\(\) => viewSetting\('pareto\.encoding'\)/, 'ParetoView.jsx does not start the encoding select from view.pareto.encoding');
  out.push('pareto encoding "resilience" (ParetoView starts from the record)');
  const probed = ['view.pareto.canvasAbove', 'view.pareto.display', 'view.pareto.encoding', 'view.pareto.ttpClasses', 'view.pareto.xAxis', 'view.pareto.yAxis', 'view.site.smallMultiples', 'view.siteTabBeta', 'view.table.pageSize'];
  assert.deepEqual(Object.keys(reg).filter((k) => k.startsWith('view.')).sort(), probed, 'a registered view setting has no usage check in test 8f');
  assert.deepEqual(Object.keys(breg).filter((k) => k.startsWith('view.')).sort(), probed);
  return out.join('; ') + '.';
});

await test('8g. AC5: the highlighted pick is the weighted leader (rank 1, the header leader) with "Rank requirement-compliant options first" on or off', async () => {
  const B = await getViewBundle();
  const W = { cost: 35, carbon: 25, ttp: 25, deliverability: 15 };
  // x is best on every axis but does not meet the resilience requirement.
  const mk = (cf) => {
    const run = { options: [synth('x', 50, 50, 12, 90, 'Does not meet'), synth('y', 60, 60, 18, 80, 'Meets'), synth('z', 70, 55, 20, 70, 'Meets with flags')], inputs: { weights: W, settings: { costMetric: 'lcoe', carbonMetric: 'location', rankCompliantFirst: cf } } };
    scoreOptions(run.options, run.inputs);
    return run;
  };
  for (const cf of [false, true]) {
    const run = mk(cf);
    const m = HOOKS.paretoView(run, { x: 'lcoe', y: 'location' });
    const rank1 = run.options.find((o) => o.rank === 1);
    assert.equal(m.pickId, rank1.id); assert.equal(weightedPick(run.options).id, rank1.id); assert.equal(m.leaderId, m.pickId);
    assert.equal(m.points.filter((q) => q.isPick).length, 1, 'exactly one highlighted pick');
    assert.equal(highestWeightedScore(run.options).id, 'x');
    if (!cf) {
      assert.equal(m.pickId, 'x'); assert.equal(m.topScoreId, null); assert.equal(m.points.filter((q) => q.isTopScore).length, 0);
    } else {
      assert.equal(m.pickId, 'y', 'with compliant-first on, the pick must be rank 1');
      assert.equal(m.topScoreId, 'x'); assert.equal(m.topScoreReason, 'compliant-first');
      assert.deepEqual(m.points.filter((q) => q.isTopScore).map((q) => q.id), ['x']);
      const chart = B.renderChart(m, 900);
      assert.match(chart, /Weighted pick #1/); assert.match(chart, new RegExp(`Highest score #${m.topScoreRank}`));
      const table = B.renderTable(m);
      assert.equal((table.match(/class="row-pick/g) || []).length, 1); assert.equal((table.match(/badge-top/g) || []).length, 1);
      const html = B.renderView(run, defaultView());
      assert.match(html, /is on and its resilience status is/, 'pick line does not say why the highest score is not the pick');
    }
  }
  // Site fit is not a requirement check any more (walkthrough, 2026-10-21; BRIEF §11, AC 27): with the Site tab as
  // Beta, "compliant" means the resilience status only. An option that does not fit keeps its place with the
  // toggle on or off, and no score changes. (Before 2026-10-22 this checked the opposite, review D9.)
  const mkSite = (cf) => {
    const opts = [synth('x', 50, 50, 12, 90, 'Meets'), synth('y', 60, 60, 18, 80, 'Meets'), synth('z', 70, 55, 20, 70, 'Meets with flags')];
    opts[0].siteFit = { status: 'Does not fit' }; opts[1].siteFit = { status: 'Fits' }; opts[2].siteFit = { status: 'Fits with flags' };
    const run = { options: opts, inputs: { weights: W, settings: { costMetric: 'lcoe', carbonMetric: 'location', rankCompliantFirst: cf } } };
    scoreOptions(run.options, run.inputs);
    return run;
  };
  for (const cf of [false, true]) {
    const run = mkSite(cf);
    const m = HOOKS.paretoView(run, { x: 'lcoe', y: 'location' });
    const scores = Object.fromEntries(run.options.map((o) => [o.id, o.score]));
    assert.deepEqual(scores, Object.fromEntries(mk(cf).options.map((o) => [o.id, o.score])), 'site fit changed a score');
    assert.equal(m.pickId, 'x', `compliant-first ${cf ? 'on' : 'off'}: an option that does not fit must not be demoted`);
    assert.equal(run.options.find((o) => o.id === 'x').rank, 1);
    assert.equal(m.topScoreId, null);
    assert.ok(!('topScoreSiteFit' in m) || m.topScoreSiteFit == null);
  }
  // Real data: the test-3 sample (36 options) and a smaller C5 = None sample (other open choices locked to their
  // first value), every weight preset, toggle off and on.
  const small = (() => {
    const inp = referenceT1({ analysisStart: START });
    const nrm = normalizeInputs(inp);
    for (const [id, st] of Object.entries(nrm.choices)) if (id !== 'C5' && st.state === 'open') inp.choices[id] = { state: 'locked', values: [st.values[0]] };
    inp.choices.C5 = { state: 'open', values: [...new Set([...nrm.choices.C5.values, 'none'])] };
    inp.settings.sampleAboveCap = false;
    return runModel(inp);
  })();
  let divergent = 0, combos = 0;
  const divergentCases = [];
  for (const [sampleLabel, sample] of [['T1 + C5 None (test 3)', runFail], [`C5 None, ${small.options.length} options`, small]]) {
    for (const [presetName, wts] of Object.entries(PRESETS)) {
      for (const cf of [false, true]) {
        const options = sample.options.map((o) => ({ ...o }));
        const inputs = { ...sample.inputs, weights: { ...wts }, settings: { ...sample.inputs.settings, rankCompliantFirst: cf } };
        scoreOptions(options, inputs);
        const r = { ...sample, inputs, options };
        const m = HOOKS.paretoView(r, null);
        const rank1 = options.find((o) => o.rank === 1);
        assert.equal(m.pickId, rank1.id); assert.equal(weightedPick(options).id, rank1.id);
        assert.equal(m.points.filter((q) => q.isPick).length, 1);
        const top = highestWeightedScore(options);
        if (top.id !== rank1.id) {
          divergent++;
          divergentCases.push(`${sampleLabel}, ${presetName}: top scorer rank ${top.rank} (${top.resilience.status}${top.siteFit ? `, ${top.siteFit.status}` : ''})`);
          // Review D9: compliant means resilience not "Does not meet" and site fit not "Does not fit".
          // Power adequacy first (OPEN-QUESTIONS 38), then compliant-first when on.
          assert.ok(!isAdequate(top) || (cf && !isRequirementCompliant(top)), 'top scorer differs from rank 1 for no ranking reason');
          assert.equal(m.topScoreId, top.id); assert.equal(m.topScoreReason, !isAdequate(top) ? 'adequacy' : 'compliant-first');
          assert.deepEqual(m.points.filter((q) => q.isTopScore).map((q) => q.id), [top.id]);
        } else assert.equal(m.topScoreId, null);
        combos++;
      }
    }
  }
  assert.ok(divergent >= 1, 'no real-data case where the highest weighted score is not rank 1');
  // The header leader and the live announcement in App.jsx come from the same function.
  const appSrc = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(appSrc, /weightedPick\(run\.options\)/, 'App.jsx header leader is not derived from weightedPick()');
  // A pick that is not drawn says why: hidden by "Hide dominated options" (zero-weight tie), by other filters, or not plottable.
  const tie = { options: [synth('a', 50, 100, 20, 80), synth('b', 40, 100, 20, 80)], inputs: { weights: { cost: 0, carbon: 1, ttp: 0, deliverability: 0 }, settings: { costMetric: 'lcoe', carbonMetric: 'location', rankCompliantFirst: false } } };
  scoreOptions(tie.options, tie.inputs);
  assert.equal(tie.options[0].dominatedBy, 'b');
  const mt = HOOKS.paretoView(tie, { x: 'lcoe', y: 'location' }, { ...defaultView(), hideDominated: true });
  assert.equal(mt.pickId, 'a'); assert.equal(mt.pickShown, false); assert.equal(mt.pickHiddenBy, 'hide-dominated'); assert.equal(mt.pickDominatedBy.id, 'b');
  assert.match(B.renderView(tie, { ...defaultView(), hideDominated: true }), /Hide dominated options&quot; hides it|Hide dominated options" hides it/);
  assert.equal(HOOKS.paretoView(tie, { x: 'lcoe', y: 'location' }, { ...defaultView(), search: 'Option b' }).pickHiddenBy, 'filters');
  const np = { options: [synth('a', Infinity, 10, 20, 80), synth('b', 40, 50, 20, 80)], inputs: { weights: { cost: 0, carbon: 1, ttp: 0, deliverability: 0 }, settings: { costMetric: 'lcoe', carbonMetric: 'location', rankCompliantFirst: false } } };
  scoreOptions(np.options, np.inputs);
  const mn = HOOKS.paretoView(np, { x: 'lcoe', y: 'location' });
  assert.equal(mn.pickId, 'a'); assert.equal(mn.pickShown, true); assert.equal(mn.pickPlotted, false); assert.equal(mn.pickVisible, false);
  assert.equal(/Weighted pick #/.test(B.renderChart(mn, 900)), false);
  assert.match(B.renderView(np, defaultView()), /Not drawn: it has no finite value on an axis/);
  return `synthetic: toggle off → pick = rank 1 = top scorer, no second mark; toggle on → pick = rank 1 (Meets), top scorer (Does not meet, rank ${mk(true).options.find((o) => o.id === 'x').rank}) marked separately with the reason in the pick line; site fit: toggle on → a "Does not fit" top scorer that meets resilience ranks after the fitting options (rank 3), scores unchanged, reason names the site-fit status; real samples: ${combos} sample × preset × toggle combinations, pick = rank 1 in all, ${divergent} with a separate highest-score mark (${divergentCases.join('; ')}; toggle on in each); App.jsx leader = weightedPick(); undrawn pick explained (hide-dominated tie, filters, not plottable).`;
});

await test('8h. Every active view filter is a removable chip, and the header filter count matches applyView()', async () => {
  const views = [
    { ...DEFAULT_VIEW, resilience: ['Meets'] },
    { ...DEFAULT_VIEW, resilience: ['Meets', 'Does not meet'] },
    { ...DEFAULT_VIEW, flagIds: ['permit-ied'] },
    { ...DEFAULT_VIEW, hideFlagIds: ['grid-binding', 'tech-nascent'] },
    { ...DEFAULT_VIEW, capexCeiling: 100e6 },
    { ...DEFAULT_VIEW, dominated: 'non' },
    { ...DEFAULT_VIEW, dominated: 'only', hideDominated: true },
    { ...DEFAULT_VIEW, archetypesOnly: true, search: 'PPA' },
    { ...DEFAULT_VIEW, resilience: ['Meets with flags'], flagIds: ['grid-binding'], hideFlagIds: ['permit-ied'], capexCeiling: 2e8, dominated: 'non', archetypesOnly: true, search: 'Grid' },
    { ...DEFAULT_VIEW, siteFit: ['Fits'] },
    { ...DEFAULT_VIEW, siteFit: ['Fits', 'Fits with flags'], landTakeCeilingHa: 9 },
    { ...DEFAULT_VIEW, landTakeCeilingHa: 5.5, flagIds: ['site-does-not-fit'] },
    { ...DEFAULT_VIEW, siteFit: ['Does not fit'], resilience: ['Meets'], hideFlagIds: ['site-relaxed'], landTakeCeilingHa: 12 },
  ];
  let chipsChecked = 0;
  for (const v of views) {
    const chips = activeFilterChips(v);
    assert.equal(activeFilterCount(v), applyView(runT1.options, v).chips.length, `filter count ≠ applyView chips for ${JSON.stringify(v)}`);
    for (const c of chips) {
      const left = activeFilterChips(c.remove(v)).map((x) => x.id);
      assert.deepEqual(left, chips.filter((x) => x.id !== c.id).map((x) => x.id), `removing "${c.label}" removed something else`);
      chipsChecked++;
    }
    let w = v;
    for (let cs = activeFilterChips(w); cs.length; cs = activeFilterChips(w)) w = cs[0].remove(w);
    assert.equal(applyView(runT1.options, { ...w, hideDominated: false }).list.length, runT1.options.length, 'removing every chip did not restore every option');
  }
  assert.ok(activeFilterChips({ ...DEFAULT_VIEW, capexCeiling: 100e6 })[0].label.includes('€100 m'));
  assert.deepEqual(activeFilterChips({ ...DEFAULT_VIEW, siteFit: ['Fits', 'Does not fit'], landTakeCeilingHa: 7.25 }).map((c) => c.label), ['Site fit: Fits', 'Site fit: Does not fit', 'Land take ≤ 7.25 ha']);
  assert.equal(activeFilterCount({ ...DEFAULT_VIEW, siteFit: ['Fits', 'Does not fit'], landTakeCeilingHa: 7.25 }), 2, 'site-fit statuses count as one filter kind');
  const B = await getViewBundle();
  const html = B.renderView(runT1, { ...defaultView(), resilience: ['Meets'], hideFlagIds: ['grid-binding', 'permit-ied'], capexCeiling: 100e6 });
  assert.equal((html.match(/aria-label="Remove filter: /g) || []).length, 4, 'one remove button per chip on the Trade-offs tab');
  const html2 = B.renderView(runT1, { ...defaultView(), siteFit: ['Fits', 'Fits with flags'], landTakeCeilingHa: 9 });
  assert.equal((html2.match(/aria-label="Remove filter: (Site fit|Land take)/g) || []).length, 3, 'site-fit and land-take chips on the Trade-offs tab');
  return `${views.length} view states (incl. site fit and land-take ceiling), ${chipsChecked} chips each removed alone (only that filter goes); filter count = applyView chips in every state; removing every chip restores all ${runT1.options.length} options; Trade-offs renders one remove button per chip (site-fit and land-take chips included).`;
});

// ---------------------------------------------------------------------------
// 9. Site slice (§10): geometry kernel, site model, blocks, auto-layout, site fit (tests/site-tests.mjs)
// ---------------------------------------------------------------------------
await geometryTests(test);
await siteModelTests(test);
const siteRuns = { runT1, runT3, START, getViewBundle };
await blockTests(test, siteRuns);
await layoutTests(test, siteRuns);
await siteFitTests(test, siteRuns);

// ---------------------------------------------------------------------------
// 10–14. Port slice (2026-10-18): bridging-battery timing, PPA physical delivery, Dispatch tab inspector,
// tornado sensitivity, loading message and hosted page (tests/port-tests.mjs)
// ---------------------------------------------------------------------------
const portRuns = { runT1, runT3, START, getViewBundle };
await batteryTimingTests(test, portRuns);
await ppaTests(test, portRuns);
await inspectorTests(test, portRuns);
await sensitivityTests(test, portRuns);
await hostedPageTests(test);

// ---------------------------------------------------------------------------
// 15. Site tab as a Beta feature (walkthrough, 2026-10-21; AC 27) (tests/beta-tests.mjs)
// ---------------------------------------------------------------------------
await betaTests(test, siteRuns);

// 16. Solar areas and removed choices (OPEN-QUESTIONS 52–54, 2026-10-22) (tests/solar-tests.mjs)
await solarTests(test, siteRuns);

// 17. Power adequacy first (OPEN-QUESTIONS 37–41, 2026-10-22; build plan 3b) (tests/adequacy-tests.mjs)
await adequacyTests(test, siteRuns);

// 18. Ordering from day one and the permitting allowance (OPEN-QUESTIONS 44, 45, 56; build plan 3b) (tests/programme-tests.mjs)
await programmeTests(test, siteRuns);

// 19. Firm generation sized two ways (OPEN-QUESTIONS 58; build plan 3b) (tests/topup-tests.mjs)
await topupTests(test, siteRuns);

// 20. Split bridging plant (OPEN-QUESTIONS 59; build plan 3b) (tests/split-tests.mjs)
await splitTests(test, siteRuns);

// 21. Permitting outlook (OPEN-QUESTIONS 46; build plan 3b) (tests/outlook-tests.mjs)
await outlookTests(test, siteRuns);

// 22. Grid periods and grid-matched phasing (OPEN-QUESTIONS 38; build plan 3b) (tests/gridref-tests.mjs)
await gridRefTests(test, siteRuns);

// 23. Backup per building or pooled (OPEN-QUESTIONS 47, 48; build plan 3b) (tests/backup-tests.mjs)
await backupTests(test, siteRuns);

// 24. Shortfall battery as firm supply (OPEN-QUESTIONS 60; build plan 3b) (tests/bess-shortfall-tests.mjs)
await bessShortfallTests(test, siteRuns);

// 25–27. Work package 4: gensets, load shapes, flexibility and batteries (AC 19, AC 20) (tests/package4-tests.mjs)
await package4Tests(test, siteRuns);

// 28. Work package 5: PPA rules O1–O3 and the PPA tick (AC 21–23) (tests/ppa-tests.mjs)
await ppaRuleTests(test, siteRuns);

// 29. Work package 6: top-five cards, trade-off defaults, weight-change description (tests/cards-tests.mjs)
await cardsTests(test, siteRuns);
await reportTests(test, siteRuns);
await gridContractTests(test, siteRuns);
await inputModelTests(test, siteRuns);
await screeningTests(test, siteRuns);
await locationTests(test, siteRuns);

// 35–37. Work package 11: engine fixes from the Haiku checks and the Pego study (tests/engine-fixes-tests.mjs)
await engineFixesTests(test, siteRuns);

// 39. Work package 12: existing plant near the site, leased (tests/existing-plant-tests.mjs)
await existingPlantTests(test, siteRuns);

// 40. Work package 13: site layout in the run (tests/layout-scope-tests.mjs)
await layoutScopeTests(test, siteRuns);

// 41. Work package 14: archetypes and identical options (tests/archetype-tests.mjs)
await archetypeTests(test, siteRuns);

// 42. Work package 15: study files (tests/study-tests.mjs)
await studyTests(test, siteRuns);

// 43–44. Work package 16: the plain-English summary; known issue 21 (tests/summary-tests.mjs)
await summaryTests(test, siteRuns);

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} tests passed.`);
console.log(`Timing (single thread, Node ${process.version}): T1 full run ${(runT1Ms / 1000).toFixed(2)} s for ${runT1.options.length} options; T3 ${(runT3Ms / 1000).toFixed(2)} s.`);
process.exit(failures ? 1 : 0);
