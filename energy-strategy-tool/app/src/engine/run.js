// Run pipeline: inputs -> context -> generate -> size -> dispatch (8760 h, cached by dispatch
// configuration) -> evaluate -> score -> rank. Pure; no UI and no browser APIs.
//
// Hooks for later slices (not implemented here): runParetoView, runSensitivity, runScenario,
// runLayout, runExport. They receive the RunResult returned by runModel().

import { buildContext } from './context.js';
import { normalizeInputs } from './defaults.js';
import { generateOptions, optionName, RULES, RULE_D } from './generator.js';
import { sizeOption } from './sizing.js';
import { dispatchConfig, dispatchKey, dispatchAll, MERIT_ORDER } from './dispatch.js';
import { timeToPower, economics, carbon, resilience, optionFlags, deliverability, flag } from './evaluate.js';
import { scoreOptions } from './scoring.js';
import { hashString } from './prng.js';
import { PROFILE_LABEL } from './profiles.js';
import { getRegistry } from './defaults.js';
import { createRunLog, STAGE, hashInputs, shortHash, mergeLogs } from './runlog.js';

export const ENGINE_VERSION = '0.1.0-core';

// Items between "progress" events for the per-option stages other than dispatch (dispatch reports
// every option). Count-based, so the log content does not depend on machine speed.
export const PROGRESS_EVERY = 250;
const YIELD_EVERY = 25;

// The pipeline as a generator: it yields between work items so a caller can run it in time slices
// (main-thread fallback with a live progress panel). runModel() drains it synchronously.
// Stages run as passes over the option list in the order of STAGES (runlog.js), so the event log
// has one start and one end per stage per source.
export function* runModelSteps(rawInputs, opts = {}) {
  const log = opts.log || createRunLog({ source: opts.source || 'main', t0Abs: opts.t0Abs ?? null, onEvent: opts.onEvent || null });
  const t0 = nowMs();

  // ---- 1. Input normalisation ----
  log.start(STAGE.input, 1);
  const inputs = normalizeInputs(rawInputs);
  const inputHash = hashInputs(inputs);
  const rawChoices = (rawInputs && rawInputs.choices) || {};
  const choicesAtDefault = Object.keys(inputs.choices).filter((id) => !rawChoices[id]).length;
  const rawPhases = rawInputs && rawInputs.load && rawInputs.load.phases;
  if (!Array.isArray(rawPhases) || rawPhases.length === 0) log.warning(STAGE.input, 'phases-derived', `No phasing table: one phase of ${inputs.load.itMW} MW IT at the grid full-connection date ${inputs.grid.fullDate} is assumed`);
  const required = { 'project.lat': inputs.project.lat, 'project.lon': inputs.project.lon, 'site.areaHa': inputs.site.areaHa, 'load.itMW': inputs.load.itMW, 'grid.nowMW': inputs.grid.nowMW, 'grid.fullMW': inputs.grid.fullMW, 'grid.fullDate': inputs.grid.fullDate };
  const missing = Object.entries(required).filter(([, x]) => x === null || x === undefined || x === '' || (typeof x === 'number' && !Number.isFinite(x))).map(([k]) => k);
  if (missing.length) log.warning(STAGE.input, 'required-missing', `Required inputs missing: ${missing.join(', ')}`, { fields: missing });
  log.end(STAGE.input, 1, 1, { inputHash, engineVersion: ENGINE_VERSION, seed: inputs.project.seed, choices: Object.keys(inputs.choices).length, choicesAtDefault });
  yield;

  // ---- 2. Context build ----
  log.start(STAGE.context, 1);
  const ctx = buildContext(inputs);
  log.warning(STAGE.context, 'profiles-synthetic', `${PROFILE_LABEL} (country ${ctx.country})`);
  log.warning(STAGE.context, 'defaults-unverified', `All ${Object.keys(getRegistry()).length} default records are indicative — unverified`);
  log.end(STAGE.context, 1, 1, {
    country: ctx.country, months: ctx.nMonths, timelineMonths: ctx.nMonthsTimeline, coolingProfiles: Object.keys(ctx.cooling).length,
    phases: ctx.phases.length, firstPhaseMonth: ctx.firstPhaseM, lastPhaseMonth: ctx.lastPhaseM, fullGridMonth: ctx.fullGridM,
  });
  yield;

  // ---- 3. Option generation ----
  log.start(STAGE.generation, null, { cap: inputs.settings.generationCap, sampleAboveCap: inputs.settings.sampleAboveCap });
  const gen = generateOptions(inputs);
  const s = gen.summary;
  log.progress(STAGE.generation, s.validCombinations, s.rawTotal, { step: 'enumerate', rawTotal: s.rawTotal, collapsedTotal: s.collapsedTotal, validCombinations: s.validCombinations });
  for (const r of [...RULES, RULE_D]) log.progress(STAGE.generation, s.removedByRule[r.id], s.rawTotal, { step: 'compatibility-rule', rule: r.id, name: r.name, removed: s.removedByRule[r.id] });
  log.progress(STAGE.generation, s.archetypes, s.archetypes, { step: 'archetypes', archetypes: s.archetypes, outsideOpenChoices: s.archetypesOutsideSpace });
  const capDecision = s.sampled ? 'sampled (seeded Latin hypercube, archetypes kept)' : s.totalCombinations > s.cap ? 'cap exceeded, sampling off: all screened' : 'below cap: all screened';
  log.progress(STAGE.generation, s.screened, s.totalCombinations, { step: 'cap', cap: s.cap, sampling: s.sampling, sampled: s.sampled, decision: capDecision, screened: s.screened, totalCombinations: s.totalCombinations, lhsRepaired: s.lhsRepaired });
  if (s.truncated) log.warning(STAGE.generation, 'enumeration-truncated', 'Enumeration stopped at the leaf limit; counts are incomplete');
  if (s.sampled) log.warning(STAGE.generation, 'cap-sampling', `Sampling above cap: ${s.screened} of ${s.totalCombinations} combinations screened`, { screened: s.screened, totalCombinations: s.totalCombinations });
  // Optional slicing for a worker pool: each worker evaluates every k-th option of the same
  // deterministic generated list; scoring then runs once over the merged set (scoring scope = all).
  const sliceCount = opts.sliceCount || 1;
  const sliceIndex = opts.sliceIndex || 0;
  const todo = sliceCount > 1 ? gen.options.filter((_, i) => i % sliceCount === sliceIndex) : gen.options;
  if (sliceCount > 1) log.progress(STAGE.generation, todo.length, gen.options.length, { step: 'slice', sliceIndex, sliceCount });
  log.end(STAGE.generation, gen.options.length, s.totalCombinations, { screened: s.screened, totalCombinations: s.totalCombinations, sampled: s.sampled, slice: sliceCount > 1 ? `${sliceIndex + 1}/${sliceCount}` : null, optionsThisSource: todo.length });
  yield;

  const n = todo.length;
  const recs = todo.map((g) => ({ g, id: `O${(hashString(g.key) >>> 0).toString(36).toUpperCase()}` }));
  // Per-option stage pass with progress every PROGRESS_EVERY items and a yield every YIELD_EVERY.
  function* pass(stage, fn, endDetail) {
    log.start(stage, n);
    for (let i = 0; i < n; i++) {
      fn(recs[i], i);
      if ((i + 1) % PROGRESS_EVERY === 0 && i + 1 < n) log.progress(stage, i + 1, n);
      if ((i + 1) % YIELD_EVERY === 0) yield;
    }
    const extra = endDetail ? endDetail() : {};
    log.end(stage, n, n, extra);
    yield;
  }
  const demandStats = () => ({ ...ctx.demandStats });

  // ---- 4. Per-option sizing ----
  let d0 = demandStats();
  yield* pass(STAGE.sizing, (r) => { r.sz = sizeOption(ctx, r.g.v); }, () => {
    const d1 = demandStats();
    return { cacheHits: d1.hits - d0.hits, cacheMisses: d1.misses - d0.misses, cache: 'hourly demand by cooling approach and model year' };
  });

  // ---- 5. Dispatch (8760 h), cached by configuration key ----
  const dispCache = new Map(); // key -> { disp, first: option id that was simulated, short }
  let hits = 0;
  let misses = 0;
  let yearsSimulated = 0;
  const unmetCfgs = new Set();
  const exceedCfgs = new Set();
  d0 = demandStats();
  log.start(STAGE.dispatch, n, { cache: 'dispatch configuration key' });
  for (let i = 0; i < n; i++) {
    const r = recs[i];
    const cfg = dispatchConfig(ctx, r.g.v, r.sz);
    const key = dispatchKey(cfg);
    let c = dispCache.get(key);
    if (!c) {
      const disp = dispatchAll(ctx, cfg, opts.recordYears || null);
      c = { disp, first: r.id, short: shortHash(key) };
      dispCache.set(key, c);
      misses++;
      yearsSimulated += disp.years.length;
      log.progress(STAGE.dispatch, i + 1, n, { option: r.id, cfg: c.short, cache: 'miss', years: disp.years.length, explicitYears: disp.nExplicit, key });
      const maxErr = disp.years.reduce((m, y) => Math.max(m, y.maxBalanceError), 0);
      if (maxErr > 1e-6) log.warning(STAGE.dispatch, 'balance-error', `Hourly energy balance error ${maxErr.toExponential(2)} MWh in configuration ${c.short}`, { cfg: c.short });
      if (disp.years.some((y) => y.unmetMWh > 1e-6)) unmetCfgs.add(key);
      if (disp.years.some((y) => y.exceedMWh > 1e-6)) exceedCfgs.add(key);
    } else {
      hits++;
      log.progress(STAGE.dispatch, i + 1, n, { option: r.id, cfg: c.short, cache: 'hit', firstSimulatedFor: c.first });
    }
    r.cfgKey = key;
    r.disp = c.disp;
    yield;
  }
  if (unmetCfgs.size) log.warning(STAGE.dispatch, 'unmet-load', `${unmetCfgs.size} of ${dispCache.size} configurations leave unmet load (flagged "Grid capacity binding" on the options; sizing kept)`, { configurations: unmetCfgs.size });
  if (exceedCfgs.size) log.warning(STAGE.dispatch, 'grid-exceedance', `${exceedCfgs.size} of ${dispCache.size} configurations import above the offered grid capacity ("Show exceedance" mode)`, { configurations: exceedCfgs.size });
  {
    const d1 = demandStats();
    log.end(STAGE.dispatch, n, n, { cacheHits: hits, cacheMisses: misses, distinctConfigurations: dispCache.size, yearsSimulated, demandCacheHits: d1.hits - d0.hits, demandCacheMisses: d1.misses - d0.misses });
  }
  yield;

  // ---- 6. Time-to-power ----
  let notFull = 0;
  yield* pass(STAGE.ttp, (r) => { r.ttp = timeToPower(ctx, r.g.v, r.sz); if (!r.ttp.reachedFull) notFull++; }, () => {
    if (notFull) log.warning(STAGE.ttp, 'full-load-not-reached', `${notFull} of ${n} options do not reach full load within the ${ctx.nMonthsTimeline}-month timeline`, { options: notFull });
    return { notReachingFullLoad: notFull };
  });

  // ---- 7. Economics ----
  let nonFinite = 0;
  yield* pass(STAGE.economics, (r) => { r.eco = economics(ctx, r.g.v, r.sz, r.disp, r.ttp); if (!Number.isFinite(r.eco.lcoe)) nonFinite++; }, () => {
    if (nonFinite) log.warning(STAGE.economics, 'lcoe-non-finite', `${nonFinite} options have no delivered energy, so LCOE is not finite`, { options: nonFinite });
    return { ledgers: n };
  });

  // ---- 8. Carbon and water ----
  yield* pass(STAGE.carbon, (r) => { r.carb = carbon(ctx, r.sz, r.eco, r.disp); });

  // ---- 9. Resilience ----
  const statuses = { Meets: 0, 'Meets with flags': 0, 'Does not meet': 0 };
  yield* pass(STAGE.resilience, (r) => { r.res = resilience(ctx, r.g.v, r.sz); statuses[r.res.status]++; }, () => {
    if (statuses['Does not meet']) log.warning(STAGE.resilience, 'requirement-not-met', `${statuses['Does not meet']} of ${n} options do not meet the resilience requirement (flagged; still ranked and shown)`, { options: statuses['Does not meet'] });
    return { statuses: { ...statuses } };
  });

  // ---- 10. Flags ----
  let withMajor = 0;
  yield* pass(STAGE.flags, (r) => {
    r.flags = optionFlags(ctx, r.g.v, r.sz, r.disp, r.ttp, r.eco, r.carb, r.res);
    // Data flag on every option (all defaults are C-tagged in this slice)
    r.flags.push(flag('data-unverified', 'info', 'Data', 'Result depends on C-tagged (indicative — unverified) parameters and synthetic profiles'));
    if (r.flags.some((f) => f.severity === 'major')) withMajor++;
  }, () => ({ optionsWithMajorFlags: withMajor }));

  // ---- 11. Deliverability ----
  const options = [];
  yield* pass(STAGE.deliverability, (r) => {
    const { g, sz, disp, ttp, eco, carb, res, flags } = r;
    const deliv = deliverability(ctx, g.v, sz, disp, flags);
    const unmet = {
      mwh: disp.years.reduce((a, y) => a + y.unmetMWh, 0),
      hours: disp.years.reduce((a, y) => a + y.unmetHours, 0),
      peakMW: disp.years.reduce((a, y) => Math.max(a, y.unmetPeakMW), 0),
      byYear: disp.years.map((y) => y.unmetMWh),
    };
    options.push({
      id: r.id, key: g.key, v: g.v, archetype: g.archetype, archetypeName: g.archetypeName, custom: false, pinned: false,
      name: optionName(g.v, sz), sizing: sz, dispatchKey: r.cfgKey, dispatch: disp, ttp, eco, carbon: carb, resilience: res, flags, deliv, unmet,
      model: 'Full-year hourly (8760 h)',
    });
  });
  const t3 = nowMs();

  // ---- 12. Scoring and ranking (whole screened set; in the worker pool this runs in mergeRuns) ----
  const scoring = opts.skipScore ? null : scoreAndLog(log, options, inputs, null);
  const t4 = nowMs();

  const runFlags = [];
  const removedImpossible = s.removedByRule.a + s.removedByRule.b + s.removedByRule.c + s.removedByRule.e;
  runFlags.push(flag('gen-rules', 'info', 'Generation', `Compatibility rules: ${removedImpossible.toLocaleString('en-GB')} impossible combinations not generated; ${s.removedByRule.d.toLocaleString('en-GB')} collapsed as n/a`));
  if (s.valuesNotGenerated.length) runFlags.push(flag('gen-values', 'info', 'Generation', `Values not generated by default or excluded: ${s.valuesNotGenerated.length} choices`));
  if (s.sampled) runFlags.push(flag('gen-sampling', 'info', 'Generation', `Sampling above cap active: ${s.screened.toLocaleString('en-GB')} of ${s.totalCombinations.toLocaleString('en-GB')} combinations screened`));
  const windNote = s.valuesNotGenerated.find((x) => x.id === 'C11' && x.note);
  if (windNote) runFlags.push(flag('tech-wind-default', 'info', 'Technology', windNote.note));
  if (inputs.load.workload === 'ai-training') runFlags.push(flag('load-ai', 'info', 'Load', 'AI training transient load not modelled'));
  runFlags.push(flag('load-util', 'info', 'Load', `IT utilisation assumption ${(inputs.load.utilisation * 100).toFixed(0)} % of installed IT (energy); sizing uses 100 %`));

  return {
    engineVersion: ENGINE_VERSION,
    inputs,
    inputHash,
    orderKeys: gen.options.map((g) => g.key),
    ctx,
    options,
    generation: s,
    rules: [...RULES.map((r) => ({ id: r.id, name: r.name, detail: r.detail, removed: s.removedByRule[r.id] })), { ...RULE_D, removed: s.removedByRule.d }],
    scoring,
    runFlags,
    meritOrder: MERIT_ORDER,
    dispatchHandling: { grid: inputs.settings.gridHandling, runHours: inputs.settings.runHourHandling },
    profileLabel: PROFILE_LABEL,
    country: ctx.country,
    profileStats: ctx.prof.stats,
    log: log.events,
    dispatchKeys: [...dispCache.keys()],
    timing: { totalMs: t4 - t0, evaluateMs: t3 - t0, scoreMs: t4 - t3, dispatchRuns: misses, dispatchCacheHits: hits, dispatchYearsTotal: yearsSimulated },
  };
}

// Synchronous run (tests, worker): drains the generator.
export function runModel(rawInputs, opts = {}) {
  const it = runModelSteps(rawInputs, opts);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

// Scoring and ranking stage with its log events. `merge` (pool only) is recorded as a progress step.
function scoreAndLog(log, options, inputs, merge) {
  log.start(STAGE.scoring, options.length);
  if (merge) log.progress(STAGE.scoring, options.length, options.length, { step: 'merge', ...merge });
  const scoring = scoreOptions(options, inputs);
  if (scoring.equalWeightsUsed) log.warning(STAGE.scoring, 'equal-weights', 'All weights are 0: equal weights (25 % each) used');
  const nonFinite = options.filter((o) => Object.values(o.metrics).some((x) => !Number.isFinite(x))).length;
  if (nonFinite) log.warning(STAGE.scoring, 'metric-non-finite', `${nonFinite} options have a non-finite axis metric (scored 0 on that axis)`, { options: nonFinite });
  const leader = options.length ? options.reduce((a, b) => (a.rank < b.rank ? a : b)) : null;
  log.end(STAGE.scoring, options.length, options.length, {
    leader: leader ? leader.id : null, leaderScore: leader ? Number(leader.score.toFixed(3)) : null,
    dominated: options.filter((o) => o.dominatedBy).length, equalWeightsUsed: scoring.equalWeightsUsed,
    rankCompliantFirst: !!inputs.settings.rankCompliantFirst, weights: Object.fromEntries(Object.entries(scoring.weights).map(([k, x]) => [k, Number(x.toFixed(6))])),
  });
  return scoring;
}

// Main-thread part of a pooled run: the input-normalisation stage (also gives the input hash used in
// log file names). Workers then repeat stages 1–11 on their slices; mergeRuns adds stage 12.
export function startPooledRun(rawInputs, { t0Abs, onEvent } = {}) {
  const log = createRunLog({ source: 'main', t0Abs, onEvent });
  log.start(STAGE.input, 1, { role: 'pool coordinator' });
  const inputs = normalizeInputs(rawInputs);
  const inputHash = hashInputs(inputs);
  log.end(STAGE.input, 1, 1, { inputHash, engineVersion: ENGINE_VERSION });
  return { log, inputs, inputHash };
}

// Merge slices from a worker pool into one run and score across the full set. Each part carries its
// own event log (part.log); the merged log is ordered by stage, then source (main, worker 0, 1, …),
// then each source's own sequence number, and renumbered 0..N-1.
export function mergeRuns(parts, inputs, opts = {}) {
  const log = opts.log || createRunLog({ source: 'main', t0Abs: opts.t0Abs ?? null, onEvent: opts.onEvent || null });
  const base = parts[0];
  const options = parts.flatMap((p) => p.options);
  const order = new Map(base.orderKeys.map((k, i) => [k, i]));
  options.sort((a, b) => order.get(a.key) - order.get(b.key));
  const merged = { ...base, options };
  const distinct = new Set(parts.flatMap((p) => p.dispatchKeys || [])).size;
  const dispatchRuns = parts.reduce((a, p) => a + p.timing.dispatchRuns, 0);
  merged.timing = { ...base.timing, evaluateMs: Math.max(...parts.map((p) => p.timing.evaluateMs)), dispatchRuns, distinctConfigurations: distinct, workers: parts.length };
  merged.scoring = scoreAndLog(log, options, normalizeInputs(inputs), { workers: parts.length, options: options.length, distinctConfigurations: distinct, duplicatedAcrossWorkers: dispatchRuns - distinct });
  merged.log = mergeLogs([log.events, ...parts.map((p) => p.log || [])]);
  merged.dispatchKeys = undefined;
  return merged;
}

// Re-score only (weights or scoring settings changed): no dispatch (§4 incremental recompute).
export function rescore(run, inputs) {
  run.scoring = scoreOptions(run.options, normalizeInputs(inputs));
  return run;
}

function nowMs() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

// ---- Hooks for later slices (intentionally not implemented in the core slice) ----
export const HOOKS = Object.freeze({
  paretoView: null, // (run, axes) => frontier
  sensitivity: null, // (inputs, run, drivers) => tornado/breakevens
  scenario: null, // (inputs, scenario) => inputs'
  layout: null, // (ctx, option) => blocks + site-fit status
  export: null, // (run, format) => file
  monteCarlo: null, // (inputs, run, n) => P10/P50/P90
  screeningModel: null, // representative-day tier (§9.1); this slice runs 8760 for all options
});

// Slim, structured-clone-friendly copy of a run for the UI thread (drops the context and
// per-month arrays; keeps everything the ranked list, scoring and option detail need).
export function toTransferable(run) {
  const options = run.options.map((o) => {
    const { firmByMonth, designByMonth, plants, grid, ...sz } = o.sizing;
    const { supplyByMonth, ...ttp } = o.ttp;
    return {
      ...o,
      sizing: { ...sz, grid: { band: grid.band, fullMW: grid.fullMW, shortfalls: grid.shortfalls } },
      ttp,
      dispatch: { nExplicit: o.dispatch.nExplicit, years: o.dispatch.years.map(({ hourly, ...y }) => y) },
      eco: { ...o.eco, ledger: o.eco.ledger },
    };
  });
  const { ctx, dispatchKeys, ...rest } = run;
  return {
    dispatchKeys,
    ...rest,
    options,
    meta: {
      analysisStart: ctx.inputs.project.analysisStart,
      firstPhaseM: ctx.firstPhaseM,
      lastPhaseM: ctx.lastPhaseM,
      fullGridM: ctx.fullGridM,
      gridCap: Array.from(ctx.gridCap.slice(0, ctx.nMonthsTimeline)),
      country: ctx.country,
      currency: ctx.cdata.currency,
      timelineMonths: ctx.nMonthsTimeline,
    },
  };
}
