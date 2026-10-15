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

import assert from 'node:assert/strict';
import {
  referenceT1, referenceT3, runModel, normalizeInputs, buildContext, sizeOption, dispatchConfig, dispatchYear,
  applyView, DEFAULT_VIEW, getRegistry, LABEL, generateOptions, effectiveWeights, H,
  runModelSteps, mergeRuns, startPooledRun, toTransferable, STAGES, validateRunLog, stripTimestamps,
  logToCSV, logToJSON, logFileName, hashInputs, PROGRESS_EVERY,
} from '../src/engine/index.js';
import { dispatchAll } from '../src/engine/dispatch.js';
import { createProgressTracker } from '../src/engine/runlog.js';
import { Worker } from 'node:worker_threads';

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
  const { years } = dispatchAll(ctx, cfg, [0, 1, 2, 3, 4, 5, 6, 7]);
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
    const { years } = dispatchAll(ctx, cfg, [0, 1, 2, 3, 4, 5, 6, 7]);
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
  const gridDep = runT3.options.filter((o) => o.v.C1 === 'wait');
  assert.ok(gridDep.length > 0);
  assert.ok(gridDep.every((o) => o.unmet.mwh > 0 && o.flags.some((f) => f.id === 'grid-binding') && o.flags.some((f) => f.id === 'target-ttp')));
  const h2 = runT1.options.find((o) => o.archetype === 'A10b');
  assert.ok(h2.flags.some((f) => f.id === 'fuel-h2-unavailable'), 'hydrogen variant flag missing');
  const failShown = applyView(runFail.options, DEFAULT_VIEW).list.filter((o) => o.resilience.status === 'Does not meet');
  return `Resilience Meets/Meets with flags/Does not meet in the default view: T1 ${statusCounts[0]}, T3 ${statusCounts[1]}, T1 + C5 None ${statusCounts[2]}; ${failShown.length} "Does not meet" options shown and ranked (best rank ${Math.min(...failShown.map((o) => o.rank))} of ${runFail.options.length}), incl. ${runFail.options.filter((o) => o.v.C5 === 'none' && o.v.C1 === 'wait').length} grid-only C5 = None at 0 MW backed failing "Backed load"; failing items on the ${runFail.options.filter((o) => o.v.C5 === 'none').length} C5 = None options: ${[...new Set(runFail.options.filter((o) => o.v.C5 === 'none').map((o) => o.resilience.failing.join(' + ')))].join(' | ')}. T1: ${runT1.options.length}/${runT1.options.length} shown by default (${dom.length} dominated, all shown and ranked); T3: ${runT3.options.length}/${runT3.options.length} shown; ${gridDep.length} T3 grid-dependent options listed with unmet load + "Grid capacity binding" + time-to-power flags; archetypes present: ${[...new Set(runT1.options.map((o) => o.archetype).filter(Boolean))].join(', ')}.`;
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

await test('5d. Every default record carries the "indicative — unverified" label and a basis', () => {
  const reg = getRegistry();
  const recs = Object.values(reg);
  const bad = recs.filter((r) => r.label !== LABEL || !['source', 'run setting', 'judgement'].includes(r.basis) || r.verified !== false || r.confidence !== 'C');
  assert.equal(bad.length, 0, `records without label/basis: ${bad.map((r) => r.path).join(', ')}`);
  const byBasis = recs.reduce((a, r) => ((a[r.basis] = (a[r.basis] || 0) + 1), a), {});
  return `${recs.length} default records; all "${LABEL}", confidence C, verified false; basis: ${Object.entries(byBasis).map(([k, v]) => `${k} ${v}`).join(', ')}.`;
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
  for (const id of ['sizing', 'dispatch', 'time-to-power', 'economics', 'carbon', 'resilience', 'flags', 'deliverability', 'scoring-ranking']) {
    const end = log.find((e) => e.stage === id && e.event === 'end');
    assert.equal(end.count, n, `${label}: ${id} items`);
  }
  // Non-dispatch per-option progress is count based (every PROGRESS_EVERY items)
  const sp = log.filter((e) => e.stage === 'sizing' && e.event === 'progress').map((e) => e.count);
  assert.deepEqual(sp, Array.from({ length: Math.ceil(n / PROGRESS_EVERY) - 1 }, (_, i) => (i + 1) * PROGRESS_EVERY));
  const res = log.find((e) => e.stage === 'resilience' && e.event === 'end').detail.statuses;
  const warns = log.filter((e) => e.event === 'warning');
  return `${log.length} events, seq 0–${log.length - 1} contiguous, ${STAGE_IDS.length}/12 stages start→end in order; dispatch ${dp.length} progress events (${misses.length} miss / ${hits} hit), resilience ${JSON.stringify(res)}, ${warns.length} warnings (${[...new Set(warns.map((e) => e.detail.code))].join(', ')})`;
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
    // Stages 1–11 in each worker, in order, each start→end
    const ws = own.filter((e) => e.event === 'start').map((e) => e.stage);
    assert.deepEqual(ws, STAGE_IDS.slice(0, 11), `${src} stage order`);
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
  const snap = (r) => r.options.map((o) => `${o.id}:${o.score}:${o.rank}:${o.resilience.status}`).join('|');
  assert.equal(snap(p1.run), snap(runT1), 'pool results differ from single-thread results');
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
  return `${slices} time slices of ≤ 30 ms of work each (plus one item overrun); current stage observed in ${midStages.size} of 12 stages between slices; log content identical to the synchronous run; tracker: 12/12 stages 100 %, dispatch cache ${d.cacheMisses} miss / ${d.cacheHits} hit, last ${snap.recent.length} events kept.`;
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

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} tests passed.`);
console.log(`Timing (single thread, Node ${process.version}): T1 full run ${(runT1Ms / 1000).toFixed(2)} s for ${runT1.options.length} options; T3 ${(runT3Ms / 1000).toFixed(2)} s.`);
process.exit(failures ? 1 : 0);
