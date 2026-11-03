// 51. Work package 20 (owner 2026-11-02, OPEN-QUESTIONS 131-140): the PUE is entered directly, annual and maximum, in
// place of the four cooling types. The hourly PUE follows the weather between them.

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs, COOLING_ID, CHOICE_BY_ID, getRegistry } from '../src/engine/defaults.js';
import { buildContext, designDayPUE, demandYear, designDemandByMonth } from '../src/engine/context.js';
import { sizeOption } from '../src/engine/sizing.js';
import { evaluateOption } from '../src/engine/option.js';
import { runModel } from '../src/engine/run.js';
import { readEpw } from '../src/engine/weather.js';
import { studyFile, readStudyFile } from '../src/engine/study.js';
import { fakeEpw } from './weather-tests.mjs';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} against ${b}`);

// The facility ÷ IT energy of a year with all IT installed and a flat load: the annual PUE when nothing is held at 0.
function yearPUE(ctx) {
  const y = Math.floor(ctx.nMonths / 12) - 2;
  const d = demandYear(ctx, COOLING_ID, y);
  let it = 0; for (let h = 0; h < d.IT.length; h++) it += d.IT[h];
  return d.sum / it;
}

export async function pueTests(test, ctxRuns) {
  await test('51. Work package 20: entered annual and maximum PUE hold on synthetic and measured weather; design load, backup and heat at the maximum; overhead driver; flags for a clamped or inverted PUE; optional water; no CHP absorption credit; no cooling choice', () => {
    const out = [];
    assert.ok(!CHOICE_BY_ID.C8, 'the cooling choice is gone');
    for (const k of ['load.pueAnnual', 'load.pueMax', 'load.densityKWm2', 'load.wue']) assert.ok(getRegistry()[k], `record ${k}`);
    assert.ok(!getRegistry()['load.coolingApproach'] && !getRegistry()['cooling.evap.copRef'], 'the cooling types are gone from the registry');
    const T1 = () => { const i = referenceT1({ analysisStart: ctxRuns.START }); i.load.shape = 'flat'; return i; };

    // (a) Synthetic weather and a measured (EPW) year: the two figures hold exactly.
    const r = readEpw(fakeEpw(), 'test.epw');
    assert.ok(r.ok);
    for (const [label, inp] of [['synthetic', T1()], ['EPW', { ...T1(), weather: r.weather }]]) {
      const ctx = buildContext(normalizeInputs(inp), { site: { noSiteModel: true } });
      const cp = ctx.cooling[COOLING_ID], L = ctx.inputs.load;
      assert.equal(cp.clampedHours, 0, `${label}: no hour held at 0`);
      near(1 + cp.coolAvg, L.pueAnnual, 1e-9, `${label}: mean hourly PUE`);
      near(1 + cp.coolPeak, L.pueMax, 1e-12, `${label}: maximum`);
      near(yearPUE(ctx), L.pueAnnual, 1e-9, `${label}: facility ÷ IT energy, flat load`);
      near(Math.max(...designDayPUE(ctx, COOLING_ID)), L.pueMax, 1e-9, `${label}: design-day peak`);
      near(designDemandByMonth(ctx, COOLING_ID).peakPUE, L.pueMax, 1e-12, `${label}: design PUE`);
      out.push(`${label}: annual ${(1 + cp.coolAvg).toFixed(3)}, maximum ${(1 + cp.coolPeak).toFixed(3)} at ${cp.designT.toFixed(1)} °C, lowest hour ${(1 + Math.min(...cp.coolFrac)).toFixed(3)}`);
    }

    // (b) Design load, critical load for backup and heat rejected at the maximum PUE (OPEN-QUESTIONS 133).
    const run = ctxRuns.runT1;
    const o = run.options.find((x) => x.v.C5 === 'diesel');
    const L = run.ctx.inputs.load, req = run.ctx.inputs.requirements;
    near(o.sizing.designMW, L.itMW * (L.pueMax + L.ancillaryFrac), 1e-9, 'design load');
    near(o.sizing.criticalMW, req.backedPct * L.itMW * L.pueMax, 1e-9, 'critical load');
    assert.ok(o.sizing.sentences.some((s) => s.startsWith('Critical load for backup:') && s.includes('maximum PUE')));
    assert.equal(L.ancillaryFrac, 0, 'no ancillary load on top of the PUE by default (OPEN-QUESTIONS 140)');
    assert.ok(!o.eco.capexLines.some((c) => /Cooling capex delta/.test(c.item)), 'no cooling capex line (OPEN-QUESTIONS 134)');

    // (c) The "PUE" driver scales the overhead of both figures (OPEN-QUESTIONS 139).
    const i3 = T1(); i3.load.coolingFactor = 1.2;
    const c3 = buildContext(normalizeInputs(i3), { site: { noSiteModel: true } }).cooling[COOLING_ID];
    near(c3.coolAvg, 1.2 * (i3.load.pueAnnual - 1), 1e-9, 'scaled annual overhead');
    near(c3.coolPeak, 1.2 * (i3.load.pueMax - 1), 1e-12, 'scaled maximum overhead');

    // (d) A maximum far above the annual: cold hours held at PUE 1.0, flagged; a maximum below the annual: flat, flagged.
    const i4 = T1(); i4.load.pueAnnual = 1.05; i4.load.pueMax = 1.9; i4.settings.generationCap = 30;
    const r4 = runModel(i4);
    const c4 = r4.ctx.cooling[COOLING_ID];
    assert.ok(c4.clampedHours > 0 && Math.min(...c4.coolFrac) === 0 && c4.coolAvg > 0.05, 'clamped hours');
    assert.ok(r4.runFlags.some((f) => f.id === 'pue-clamped'), 'clamp flag');
    const i5 = T1(); i5.load.pueAnnual = 1.4; i5.load.pueMax = 1.3; i5.settings.generationCap = 30;
    const r5 = runModel(i5);
    const c5 = r5.ctx.cooling[COOLING_ID];
    assert.ok(c5.maxBelowAnnual && Math.max(...c5.coolFrac) - Math.min(...c5.coolFrac) < 1e-12 && Math.abs(c5.coolPeak - 0.4) < 1e-12, 'flat at the annual value');
    assert.ok(r5.runFlags.some((f) => f.id === 'pue-max-below'), 'inverted flag');
    assert.ok(r4.runFlags.some((f) => f.id === 'pue-entered') && r5.runFlags.some((f) => f.id === 'pue-entered'), 'PUE run line');
    out.push(`annual 1.05 / maximum 1.9: ${c4.clampedHours} hours held at 1.0, mean ${(1 + c4.coolAvg).toFixed(3)}; 1.4 / 1.3: flat 1.4`);

    // (e) Water only when a WUE is entered (OPEN-QUESTIONS 134).
    assert.ok(o.carbon.wue === null && o.carbon.waterM3 === null, 'water not reported by default');
    const i6 = normalizeInputs(run.inputs); i6.load.wue = 0.4;
    const e6 = evaluateOption(buildContext(i6, { site: run.ctx.site }), o.v, { skipLayout: true });
    const ss = e6.disp.years[e6.disp.years.length - 1];
    near(e6.carb.waterM3, 0.4 * ss.itMWh, 1e-6, 'water from the WUE');

    // (f) CHP: no absorption-chiller credit, and a flag says so (OPEN-QUESTIONS 136).
    const chp = run.options.find((x) => x.v.C4 === 'chp');
    if (chp) {
      assert.ok(chp.flags.some((f) => f.id === 'tech-chp-no-credit'), 'CHP flag');
      assert.ok(chp.dispatch.years.every((y) => (y.chpCreditMWh || 0) === 0), 'no credit');
    }

    // (g) No option carries a cooling choice, and the names carry no cooling word.
    assert.ok(run.options.every((x) => !('C8' in x.v) && !/· (Air|Evaporative|DLC|Immersion)\b/.test(x.name)), 'cooling in an option');

    // (h) A study saved with a cooling type opens on today's PUE defaults, with the left-out inputs named.
    const f = studyFile(referenceT1({ analysisStart: ctxRuns.START }));
    f.inputs.load.coolingApproach = 'evap'; f.inputs.choices.C8 = { state: 'locked', values: ['evap'] };
    delete f.inputs.load.pueAnnual; delete f.inputs.load.pueMax;
    const back = readStudyFile(JSON.stringify(f));
    assert.ok(back.ok && back.dropped.includes('load.coolingApproach') && back.dropped.includes('choices.C8'), `dropped: ${back.dropped.join(', ')}`);
    assert.ok(back.added.includes('load.pueAnnual') && back.inputs.load.pueMax === 1.5, 'PUE defaults taken');
    out.push(`old study: ${back.warnings.length} warnings`);
    return out.join('; ');
  });
}
