// 32. Work package 2: knowledge levels and the "assumed default" flags (AC 16; BRIEF §2 principle 10, §5, §15),
// several evaluation periods (OPEN-QUESTIONS 21), the IT estimate from area (OPEN-QUESTIONS 26).

import assert from 'node:assert/strict';
import { buildDefaultInputs, normalizeInputs, COOLING, getRegistry, LABEL } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { inputRows } from '../src/report/report.js';
import { KEY_INPUTS } from '../src/engine/assumed.js';

const small = (inp) => { inp.settings.generationCap = 150; return inp; };
const assumedPaths = (o) => o.flags.filter((f) => f.assumed && f.path).map((f) => f.path);

export async function inputModelTests(test, ctxRuns) {
  await test('32. Knowledge levels (work package 2, AC 16): with only the location and the site area entered a run completes; the IT load is estimated from the area with the massing rule (OPEN-QUESTIONS 26) and the grid values are "not known" defaults; every option lists each key default it uses with its source; entering a value removes its flag from every option; several evaluation periods are shown and only the scoring period ranks (OPEN-QUESTIONS 21)', async () => {
    const out = [];
    const START = ctxRuns.START;
    // Only location and site area: the defaults carry no IT load and no grid values.
    const raw = small(buildDefaultInputs({ analysisStart: START }));
    assert.equal(raw.load.itMW, null);
    assert.equal(raw.grid.nowMW, null); assert.equal(raw.grid.fullMW, null); assert.equal(raw.grid.fullDate, null);
    const n = normalizeInputs(raw);
    const dens = COOLING.air.p.densityKWm2;
    const est = Math.round(Math.max(1, (raw.site.areaHa * 10000 * raw.load.estimateCoverage * raw.load.storeys / raw.load.grossUp) * dens / 1000) * 10) / 10;
    assert.equal(n.load.itMW, est, 'IT estimate from area');
    assert.equal(n.grid.nowMW, raw.grid.unknownNowMW);
    assert.equal(n.grid.fullMW, Math.round(est * raw.grid.unknownFullPerITMW * 10) / 10);
    assert.ok(/^\d{4}-\d{2}$/.test(n.grid.fullDate));
    assert.deepEqual(Object.keys(n.assumedInputs).sort(), ['grid.fullDate', 'grid.fullMW', 'grid.nowMW', 'load.itMW', 'load.phases']);
    assert.deepEqual(normalizeInputs(n).assumedInputs, n.assumedInputs, 'a second normalisation loses the record');
    for (const k of ['load.itMW', 'grid.nowMW', 'grid.fullMW', 'grid.fullDate', 'load.estimateCoverage', 'grid.unknownFullPerITMW', 'grid.unknownFullMonths', 'economics.displayPeriods']) assert.ok(getRegistry()[k] && getRegistry()[k].label === LABEL, `${k} not a labelled record`);
    const run0 = runModel(raw);
    assert.ok(run0.options.length > 50, 'run did not complete');
    for (const o of run0.options) {
      const p = assumedPaths(o);
      for (const k of ['load.itMW', 'load.phases', 'project.analysisStart', 'economics.wacc', 'economics.periodYears']) assert.ok(p.includes(k), `${o.id} lacks the assumed flag for ${k}`);
      for (const k of ['grid.nowMW', 'grid.fullMW', 'grid.fullDate']) assert.equal(p.includes(k), o.v.C1 !== 'islanded', `${o.id} (${o.v.C1}): grid flag ${k}`);
      assert.ok(o.flags.some((f) => f.id === 'assumed-records'));
      for (const f of o.flags.filter((x) => x.assumed && x.path)) assert.ok(/indicative — unverified|sourced/.test(f.message), `no source on ${f.message}`);
    }
    out.push(`defaults only: IT ${est} MW estimated, grid ${n.grid.nowMW} → ${n.grid.fullMW} MW at ${n.grid.fullDate}; ${run0.options.length} options, each with ${Math.min(...run0.options.map((o) => assumedPaths(o).length))}–${Math.max(...run0.options.map((o) => assumedPaths(o).length))} assumed key defaults`);
    // Entering a value removes its flag from every option.
    const ent = small(buildDefaultInputs({ analysisStart: START }));
    ent.load.itMW = 60; ent.economics.wacc = 0.08; ent.grid.fullMW = 90;
    const run1 = runModel(ent);
    for (const o of run1.options) {
      const p = assumedPaths(o);
      for (const k of ['load.itMW', 'economics.wacc', 'grid.fullMW']) assert.ok(!p.includes(k), `${o.id} still flags ${k} after it was entered`);
      assert.ok(p.includes('economics.periodYears'));
    }
    assert.equal(normalizeInputs(ent).load.itMW, 60);
    out.push('entering the IT load, WACC and full grid capacity removes those flags from every option');
    // Report: the estimate is listed as a default with its sentence.
    const row = inputRows(raw).find((r) => r.path === 'load.itMW');
    assert.ok(/^Default: estimated from the site area/.test(row.status), row.status);
    // Periods: 10, 15 and the scoring 20; the scoring one equals the option's LCOE and NPV.
    for (const o of run0.options.slice(0, 50)) {
      assert.deepEqual(o.eco.byPeriod.map((p) => p.years), [10, 15, 20]);
      const sc = o.eco.byPeriod.find((p) => p.scoring);
      assert.equal(sc.lcoe, o.eco.lcoe); assert.equal(sc.npvCost, o.eco.npvCost);
    }
    const o0 = run0.options[0];
    assert.ok(o0.eco.byPeriod[0].lcoe !== o0.eco.lcoe, 'a 10-year LCOE equal to the 20-year one');
    assert.ok(KEY_INPUTS.length >= 20);
    out.push(`periods: ${o0.eco.byPeriod.map((p) => `${p.years} yr €${p.lcoe.toFixed(1)}/MWh`).join(', ')} (scoring 20 yr)`);
    return out.join('; ') + '.';
  });
}
