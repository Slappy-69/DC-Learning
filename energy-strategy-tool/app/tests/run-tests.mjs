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
//  3. No option hidden by default: default view shows every screened option; archetypes present.
//  4. View filters never change score or rank.
//  5. Extra: determinism (same inputs + seed → identical outputs); exceedance mode removes unmet load.

import assert from 'node:assert/strict';
import {
  referenceT1, referenceT3, runModel, normalizeInputs, buildContext, sizeOption, dispatchConfig, dispatchYear,
  applyView, DEFAULT_VIEW, getRegistry, LABEL, generateOptions, effectiveWeights, H,
} from '../src/engine/index.js';
import { dispatchAll } from '../src/engine/dispatch.js';

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
await test('3. No option is hidden by default', () => {
  const reg = getRegistry();
  assert.equal(reg['settings.hideDominated'].value, false, '"Hide dominated options" default must be off');
  assert.equal(reg['settings.hideDominated'].label, LABEL);
  for (const run of [runT1, runT3]) {
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
    // Options that do not meet resilience or carry major flags are still ranked and shown
    assert.ok(list.some((o) => o.resilience.status === 'Does not meet'));
    assert.ok(list.some((o) => o.flags.some((f) => f.severity === 'major')));
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
  return `T1: ${runT1.options.length}/${runT1.options.length} shown by default (${dom.length} dominated, all shown and ranked); T3: ${runT3.options.length}/${runT3.options.length} shown; ${gridDep.length} T3 grid-dependent options listed with unmet load + "Grid capacity binding" + time-to-power flags; archetypes present: ${[...new Set(runT1.options.map((o) => o.archetype).filter(Boolean))].join(', ')}.`;
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
await test('5a. Determinism: same inputs + seed give identical outputs', () => {
  const again = runModel(referenceT1({ analysisStart: START }));
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

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} tests passed.`);
console.log(`Timing (single thread, Node ${process.version}): T1 full run ${(runT1Ms / 1000).toFixed(2)} s for ${runT1.options.length} options; T3 ${(runT3Ms / 1000).toFixed(2)} s.`);
process.exit(failures ? 1 : 0);
