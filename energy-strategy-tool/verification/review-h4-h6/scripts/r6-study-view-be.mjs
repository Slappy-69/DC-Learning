// Opus review H4-H6, script r6: study files (work package 15 and the H4 fixes), view filters (H4 M-1), the registry
// counts, the breakeven base with the screening tier (H6 MED-4) and a value outside a record's range (H6 LOW-2).
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const D = await import(`${APP}defaults.js`);
const { referenceT1, normalizeInputs, getRegistry, LABEL } = D;
const { runModel } = await import(`${APP}run.js`);
const { studyFile, readStudyFile, compareWithSaved } = await import(`${APP}study.js`);
const { applyView } = await import(`${APP}scoring.js`);
const { breakevens } = await import(`${APP}breakeven.js`);
const { monteCarlo } = await import(`${APP}montecarlo.js`);
const { buildContext } = await import(`${APP}context.js`);
const { evaluateOption } = await import(`${APP}option.js`);
const { axisMetrics, axisScore, SCORE_KEYS } = await import(`${APP}scoring.js`);
const { hashInputs } = await import(`${APP}runlog.js`);
// (a) study round trip: T1 with an existing plant, a WACC of 7 % and a note.
const inp = referenceT1();
inp.economics.wacc = 0.07;
inp.existing = { ...inp.existing, include: true, name: 'Nearby CCGT', type: 'ccgt', units: 2, unitMW: 40, availableDate: '2028-01', linkCapex: 8e6 };
const run = runModel(inp);
const note = { text: 'My note.', key: 'k', leaderId: 'x', leaderName: 'y', editedAt: '2026-10-30', siteBeta: false };
const f = studyFile(inp, run, { savedAt: new Date('2026-10-30T12:00:00Z'), note });
const text = JSON.stringify(f);
const back = readStudyFile(text);
const run2 = runModel(back.inputs);
const cmp = compareWithSaved(back.file, run2);
console.log(`(a) round trip: ok ${back.ok}; warnings ${JSON.stringify(back.warnings)}; note kept ${back.notes.summary && back.notes.summary.text === 'My note.'}; same ${cmp.same} (${cmp.message.slice(0, 90)})`);
// (b) unknown key: left out with a warning, hash unchanged
const g = JSON.parse(text); g.inputs.economics.futureThing = 3; g.inputs.choices.C99 = { state: 'open' };
const b2 = readStudyFile(JSON.stringify(g));
console.log(`(b) unknown keys: dropped ${JSON.stringify(b2.dropped)}; hash same as saved ${hashInputs(normalizeInputs(b2.inputs)) === f.inputHash}`);
// (c) a section set to null, a list, a string
for (const bad of [null, [], 'x']) { const h = JSON.parse(text); h.inputs.grid = bad; const r = readStudyFile(JSON.stringify(h)); console.log(`(c) grid = ${JSON.stringify(bad)}: ok ${r.ok}; ${r.error}`); }
// (d) a file from before work packages 11-12: no existing plant, no rentalLeadMonths, no maxDispatchYears
const o = JSON.parse(text); delete o.inputs.existing; delete o.inputs.settings.rentalLeadMonths; delete o.inputs.settings.maxDispatchYears;
const b4 = readStudyFile(JSON.stringify(o));
console.log(`(d) older file: ok ${b4.ok}; added ${JSON.stringify(b4.added)}; settings filled: rentalLeadMonths ${b4.inputs.settings.rentalLeadMonths}, maxDispatchYears ${b4.inputs.settings.maxDispatchYears}`);
// (e) a leaf set to null: what the run then uses
for (const [path, set] of [['site.areaHa', (x) => { x.site.areaHa = null; }], ['economics.wacc', (x) => { x.economics.wacc = null; }], ['existing.leasePerKWMonth', (x) => { x.existing.leasePerKWMonth = null; }]]) {
  const h = JSON.parse(text); set(h.inputs);
  const r = readStudyFile(JSON.stringify(h));
  const n = normalizeInputs(r.inputs);
  const get = (obj, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);
  console.log(`(e) ${path} = null in the file: accepted ${r.ok}; after normalizeInputs ${JSON.stringify(get(n, path))}; registry default ${JSON.stringify(getRegistry()[path] ? getRegistry()[path].value : 'no record')}`);
}
// (f) registry counts after a run
const reg = Object.values(getRegistry());
const byLabel = {}; for (const r of reg) byLabel[r.label] = (byLabel[r.label] || 0) + 1;
const byConf = {}; for (const r of reg) byConf[r.confidence] = (byConf[r.confidence] || 0) + 1;
console.log(`(f) registry ${reg.length} records; by label ${JSON.stringify(byLabel)}; by confidence ${JSON.stringify(byConf)}; verified true: ${reg.filter((r) => r.verified === true).length}`);
const runlogCount = reg.filter((r) => r.verified !== true && r.confidence === 'C').length;
console.log(`(f) run log line counts ${runlogCount} as indicative and ${reg.length - runlogCount} as sourced; label count of indicative ${reg.filter((r) => r.label === LABEL).length}`);
// (g) view filters on records not laid out (H4 M-1)
const fake = [{ id: 'A', rank: 1, siteFit: { skipped: true, status: 'Not laid out' }, flags: [], eco: { capex: 1 }, resilience: { status: 'Meets' }, name: 'a' },
  { id: 'B', rank: 2, siteFit: { skipped: false, status: 'Fits', landTakeHa: 5, landTakeM2: 5e4 }, flags: [], eco: { capex: 1 }, resilience: { status: 'Meets' }, name: 'b' },
  { id: 'C', rank: 3, siteFit: { skipped: false, status: 'Does not fit', landTakeHa: 50, landTakeM2: 5e5 }, flags: [], eco: { capex: 1 }, resilience: { status: 'Meets' }, name: 'c' }];
const v1 = applyView(fake, { landTakeCeilingHa: 10 });
const v2 = applyView(fake, { siteFit: ['Fits'] });
console.log(`(g) land-take ceiling 10 ha: kept ${v1.list.map((x) => x.id).join(',')}; chip "${v1.chips.join('; ')}"; site-fit filter Fits: kept ${v2.list.map((x) => x.id).join(',')}`);
// (h) breakevens on a screening run (H6 MED-4)
const inpS = referenceT1(); inpS.settings.screeningModel = 'repDays';
const runS = runModel(inpS);
const beS = breakevens(runS, { site: runS.ctx.site });
const ctxF = buildContext(normalizeInputs(runS.inputs), { site: runS.ctx.site });
const w = runS.scoring.weights, rg = runS.scoring.ranges, st = normalizeInputs(runS.inputs).settings;
let maxDiff = 0, maxStale = 0;
for (const [id, line] of Object.entries(beS.baseLines)) {
  const o = runS.options.find((x) => x.id === id);
  const e = evaluateOption(ctxF, o.v);
  const m = axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, st);
  const ls = SCORE_KEYS.reduce((a, k) => a + w[k] * axisScore(k, m[k], rg[k].lo, rg[k].hi), 0);
  maxDiff = Math.max(maxDiff, Math.abs(ls - line));
  maxStale = Math.max(maxStale, Math.abs(o.score - line));
}
console.log(`(h) screening run: baseModel "${beS.baseModel}"; base points against an independent full-year re-run: max difference ${maxDiff.toExponential(2)}; against the run's own (screening) scores: max ${maxStale.toFixed(4)} points`);
// (i) WACC 13 % (outside the record's 4-12 %)
const inpW = referenceT1(); inpW.economics.wacc = 0.13;
const runW = runModel(inpW);
const beW = breakevens(runW, { site: runW.ctx.site });
const rowW = beW.rows.find((r) => r.id === 'wacc');
const mcW = monteCarlo(runW, { site: runW.ctx.site, samples: 100 });
const dW = mcW.drivers.find((d) => d.id === 'wacc');
console.log(`(i) WACC 13 %: breakeven row ${rowW ? `low ${rowW.low} base ${rowW.base} high ${rowW.high} widened ${rowW.widened}` : 'not among the eight drivers'}; Monte Carlo WACC P10 ${dW.values.p10.toFixed(4)} P90 ${dW.values.p90.toFixed(4)} widened ${dW.widened}`);
