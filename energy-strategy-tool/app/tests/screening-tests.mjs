// 33. Work package 8: the screening tier (AC 4; BRIEF §9.1, §12.13; OPEN-QUESTIONS 23 answered 2026-10-23 with
// Claude's recommendation, accepted in advance by the owner): optional and off by default; representative days for
// every option, then the best options verified with the full year and every option re-scored.

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { buildContext } from '../src/engine/context.js';
import { representativeHours } from '../src/engine/dispatch.js';
import { H } from '../src/engine/profiles.js';

export async function screeningTests(test, ctxRuns) {
  await test('33. Screening tier (work package 8, AC 4): off by default (every option full-year); on, every option is dispatched over representative days (design day, dearest day and a typical day per month, weights adding to 8,760 h), the best 10 are verified with the full year and give exactly the full run\'s figures, LCOE from screening is within ±5 % of the full year for every option, and every option says which model produced it', () => {
    const out = [];
    const full = ctxRuns.runT1;
    assert.equal(normalizeInputs(full.inputs).settings.screeningModel, 'full');
    assert.ok(full.options.every((o) => o.model === 'Full-year hourly (8760 h)') && !full.verification);
    // Representative hours.
    const ctx = buildContext(normalizeInputs(full.inputs), { site: full.ctx.site });
    const rep = representativeHours(ctx);
    assert.equal(rep.weights.reduce((a, x) => a + x, 0), H);
    const designDay = Math.floor(ctx.prof.temp.indexOf(Math.max(...ctx.prof.temp)) / 24);
    assert.ok(rep.days.some((d) => d.day === designDay), 'design day not represented');
    assert.ok(rep.days.length >= 24 && rep.days.length <= 36);
    out.push(`${rep.days.length} representative days (${rep.hours.length} h) weighted to ${H} h, design day ${designDay + 1} included`);
    // Screening run.
    const inp = referenceT1({ analysisStart: ctxRuns.START });
    inp.settings.screeningModel = 'repDays';
    const t0 = Date.now();
    const scr = runModel(inp);
    const ms = Date.now() - t0;
    assert.equal(scr.verification.verified, 10);
    const ver = scr.options.filter((o) => o.verified);
    assert.equal(ver.length, 10);
    assert.ok(scr.options.filter((o) => !o.verified).every((o) => /^Representative days/.test(o.model)));
    assert.ok(scr.runFlags.some((f) => f.id === 'screening-model'));
    const fById = new Map(full.options.map((o) => [o.id, o]));
    for (const o of ver) {
      const f = fById.get(o.id);
      assert.equal(o.eco.lcoe, f.eco.lcoe, `${o.id}: verified LCOE differs from the full run`);
      assert.equal(o.carbon.locationG, f.carbon.locationG);
      assert.equal(o.unmet.mwh, f.unmet.mwh);
      assert.ok(/verified/.test(o.model));
    }
    // AC 4: screening LCOE against the full year, every option.
    let maxD = 0, maxC = 0;
    for (const o of scr.options) {
      const f = fById.get(o.id);
      const s = o.verified ? o.screening.lcoe : o.eco.lcoe;
      if (!Number.isFinite(s) || !Number.isFinite(f.eco.lcoe)) continue;
      maxD = Math.max(maxD, Math.abs(s / f.eco.lcoe - 1));
      const sc = o.verified ? o.screening.carbonG : o.carbon.locationG;
      if (f.carbon.locationG > 0) maxC = Math.max(maxC, Math.abs(sc / f.carbon.locationG - 1));
    }
    assert.ok(maxD <= 0.05, `screening LCOE differs from the full year by up to ${(maxD * 100).toFixed(2)} %`);
    const lf = full.options.reduce((a, b) => (a.rank < b.rank ? a : b)), ls = scr.options.reduce((a, b) => (a.rank < b.rank ? a : b));
    out.push(`screening run ${(ms / 1000).toFixed(1)} s; 10 verified equal to the full run; LCOE within ${(maxD * 100).toFixed(2)} % for all ${scr.options.length} options (location carbon within ${(maxC * 100).toFixed(1)} %, not part of AC 4); leader ${ls.id === lf.id ? 'unchanged' : `${ls.id} (full: ${lf.id})`}`);
    return out.join('; ') + '.';
  });
}
