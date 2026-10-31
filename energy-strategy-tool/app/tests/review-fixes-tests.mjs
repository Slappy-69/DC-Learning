// 47. Fixes from the Opus review of H4–H6 (2026-10-30; owner's decisions OPEN-QUESTIONS 108–113, KNOWN-ISSUES 22–27).

import assert from 'node:assert/strict';
import { normalizeInputs, referenceT1 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { buildContext } from '../src/engine/context.js';
import { evaluateOption } from '../src/engine/option.js';
import { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } from '../src/engine/sensitivity.js';
import { breakevens } from '../src/engine/breakeven.js';
import { monteCarlo } from '../src/engine/montecarlo.js';
import { plainSummary, SUMMARY_WORD_LIMIT } from '../src/engine/summary.js';
import { studyFile, readStudyFile } from '../src/engine/study.js';

export async function reviewFixTests(test, ctxRuns) {
  await test('47a. Known issue 22: "Capex (every line)" multiplies every capex line, the cooling delta and fuel-cell stack replacements included, by exactly its factor, for every cooling type', () => {
    const run = ctxRuns.runT1;
    const by = run.options.slice().sort((a, b) => a.rank - b.rank);
    const picks = ['evap', 'dlc', 'immersion', 'air'].map((c) => by.find((o) => o.v.C8 === c)).filter(Boolean);
    const fc = by.find((o) => o.v.C2 === 'fuelCell' || o.v.C4 === 'fuelCell');
    if (fc) picks.push(fc);
    assert.ok(picks.length >= 4, `cooling types found: ${picks.length}`);
    const ctxAt = (k) => { const i = normalizeInputs(run.inputs); i.economics.capexFactor = k; return buildContext(i, { site: run.ctx.site }); };
    const c1 = ctxAt(1);
    const out = [];
    for (const k of [1.5, 0.7]) {
      const ck = ctxAt(k);
      for (const o of picks) {
        const a = evaluateOption(c1, o.v, { skipLayout: true }).eco, b = evaluateOption(ck, o.v, { skipLayout: true }).eco;
        const r = b.capexExContingency / a.capexExContingency;
        assert.ok(Math.abs(r - k) < 1e-9, `#${o.rank} (${o.v.C8}) capex × ${k}: ratio ${r}`);
        const rep = (e) => e.ledger.reduce((s, y) => s + y.replacement, 0);
        if (rep(a) > 0) assert.ok(Math.abs(rep(b) / rep(a) - k) < 1e-9, `#${o.rank} replacements × ${k}: ratio ${rep(b) / rep(a)}`);
        if (k === 1.5) out.push(`#${o.rank} ${o.v.C8}${o === fc ? ' (fuel cell)' : ''}`);
      }
    }
    return `capex and replacements × 1.5 and × 0.7 exactly: ${out.join(', ')}`;
  });

  await test('47b. Known issues 23 and 24: with the tornado, breakevens and Monte Carlo all run on T1, the summary keeps the leader\'s major flag (or the flag count) and the nearest breakevens, within 250 words; the robust pick is the leader, level with any option within sampling noise', () => {
    const run = ctxRuns.runT1;
    const site = run.ctx.site;
    const L = run.options.find((o) => o.rank === 1);
    const majors = L.flags.filter((f) => f.severity === 'major' && !f.assumed);
    const tor = tornado(run, L.id, { site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
    const be = breakevens(run, { site });
    const mc = monteCarlo(run, { site, samples: 300 });
    const s = plainSummary(run, { sensitivity: tor, breakevens: be, monteCarlo: mc });
    const flags = s.parts.find((p) => p.id === 'flags').text, change = s.parts.find((p) => p.id === 'change').text;
    if (majors.length) assert.ok(/IED|aggregat|major flag/i.test(flags), `flags part: ${flags}`);
    assert.ok(/^Breakevens|\. Breakevens/.test(change), `part 5: ${change}`);
    assert.ok(s.words <= SUMMARY_WORD_LIMIT, `${s.words} words`);
    assert.ok(!s.overLimit);
    // No capex flip on T1 once the cooling line is scaled (known issue 22).
    assert.ok(!/capex rose/i.test(change), `part 5: ${change}`);
    assert.equal(mc.robustPickId, L.id, 'robust pick');
    const lr = mc.rows.find((r) => r.id === L.id);
    assert.ok(/Monte Carlo samples \(top \d+ options\)/.test(s.text), 'top-N wording');
    return `${s.words} words; flags: "${flags.slice(0, 120)}…"; leader leads in ${(lr.pRank1 * 100).toFixed(1)} % of ${mc.samples}; robust pick #1${mc.robustLevelWithId ? ' (level with another option)' : ''}`;
  });

  await test('47c. Known issue 25: an existing plant left at its default lease rate and performance is flagged on every option that uses it', () => {
    const inp = referenceT1();
    inp.existing = { ...inp.existing, include: true, name: 'Nearby CCGT', type: 'ccgt', units: 2, unitMW: 40, availableDate: '2028-01', linkCapex: 8e6 };
    const run = runModel(inp);
    const ex = run.options.filter((o) => o.v.C2 === 'existing' || o.v.C4 === 'existing');
    assert.ok(ex.length > 0);
    const has = (o, p) => o.flags.some((f) => f.assumed && f.path === p);
    for (const o of ex) {
      for (const p of ['existing.leasePerKWMonth', 'existing.eff', 'existing.msl', 'existing.vomPerMWh', 'settings.rentalLeadMonths']) assert.ok(has(o, p), `${o.id} lacks ${p}`);
      assert.ok(!has(o, 'existing.linkCapex'), `${o.id}: the connection was entered (€8 m) yet flagged`);
    }
    const other = run.options.find((o) => o.v.C2 !== 'existing' && o.v.C4 !== 'existing' && o.v.C2 !== 'rented');
    assert.ok(other && !has(other, 'existing.leasePerKWMonth'), 'an option without the plant is not flagged');
    return `${ex.length} options with the plant, each flagged for the lease rate, efficiency, minimum stable load, variable O&M and lease lead`;
  });

  await test('47d. Known issue 27: delivered energy (the LCOE denominator) leaves out IT load shed by flexibility; an empty number in a study file takes today\'s default with a warning (N-10)', () => {
    // The T1 leader with flexibility on and a price trigger the synthetic prices reach (BUILD-NOTES: €190/MWh).
    const run = ctxRuns.runT1;
    const L = run.options.find((x) => x.rank === 1);
    assert.notEqual(L.v.C4, 'chp');
    const i = normalizeInputs(run.inputs); i.load.flexTriggerPrice = 190;
    const ctx = buildContext(i, { site: run.ctx.site });
    const e = evaluateOption(ctx, { ...L.v, C16: 'on' }, { skipLayout: true }).eco;
    const del = e.ledger.reduce((s, y) => s + y.deliveredMWh, 0), net = e.ledger.reduce((s, y) => s + y.netDemandMWh, 0), un = e.ledger.reduce((s, y) => s + y.unmetMWh, 0);
    const off = evaluateOption(ctx, { ...L.v, C16: 'off' }, { skipLayout: true }).eco;
    const delOff = off.ledger.reduce((s, y) => s + y.deliveredMWh, 0);
    assert.ok(Math.abs(del - (net - un)) <= 1e-6 * Math.max(1, net), `delivered ${del} against net demand less unmet ${net - un}`);
    assert.ok(del < delOff, `flexibility on should deliver less energy: ${del} against ${delOff}`);
    const msg = `T1 leader with flexibility: delivered ${Math.round(del).toLocaleString('en-GB')} MWh = net demand less unmet (${Math.round(delOff - del).toLocaleString('en-GB')} MWh shed over the period)`;
    const f = studyFile(referenceT1(), null, {});
    f.inputs.economics.wacc = null;
    const r = readStudyFile(JSON.stringify(f));
    assert.ok(r.ok);
    assert.equal(typeof r.inputs.economics.wacc, 'number');
    assert.ok(r.warnings.some((w) => /economics\.wacc/.test(w)), r.warnings.join(' | '));
    return `${msg}; null WACC in a study → ${r.inputs.economics.wacc}, warned`;
  });
}
