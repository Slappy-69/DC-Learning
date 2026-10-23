// 24. A battery sized to the permanent shortfall counts as firm supply (owner's decision of 2026-10-23, OPEN-QUESTIONS
// 60; build plan work package 3b). C12 = "Sized to the permanent shortfall": MW = the largest hourly shortfall on the
// design day from the full grid date; usable energy = the largest daily shortfall; it counts as firm supply against
// the design load only if the same day's grid headroom (at up to its MW) × round-trip efficiency recharges it.

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs, TECH, CHOICE_BY_ID } from '../src/engine/defaults.js';
import { buildContext, designDayPUE } from '../src/engine/context.js';
import { sizeOption } from '../src/engine/sizing.js';
import { timeToPower } from '../src/engine/evaluate.js';

export async function bessShortfallTests(test, ctxRuns) {
  await test('24. Shortfall battery (OPEN-QUESTIONS 60): design-day sizing; recharge check; counts as firm supply only when it recharges; rule (i); security role (no arbitrage)', async () => {
    const out = [];
    assert.ok(CHOICE_BY_ID.C12.values.some((x) => x[0] === 'shortfall'));
    const run = ctxRuns.runT1;
    const ctx = run.ctx;
    // (a) Design-day PUE peaks at the peak PUE (design load).
    for (const c of Object.keys(ctx.cooling)) {
      const pue = designDayPUE(ctx, c);
      const peak = 1 + ctx.cooling[c].coolPeak + ctx.cooling[c].lossFrac;
      assert.ok(Math.abs(Math.max(...pue) - peak) < 1e-9 && Math.min(...pue) <= peak, `${c}: design-day PUE`);
    }
    // (b) T1 options: sizing by hand, rule (i), firm supply only when recharged.
    const rte = TECH.bess.p.rte;
    const sb = run.options.filter((o) => o.v.C12 === 'shortfall');
    for (const o of sb) {
      assert.ok(o.v.C1 !== 'islanded' && o.v.C12r === 'peakShave', `${o.id}: rule (i)`);
      const pue = designDayPUE(ctx, o.v.C8);
      let MW = 0, E = 0;
      for (let m = Math.max(0, ctx.fullGridM); m < ctx.nMonthsTimeline; m++) {
        let e = 0;
        for (let k = 0; k < 24; k++) { const s = ctx.itInst[m] * (pue[k] + run.inputs.load.ancillaryFrac) - ctx.gridCap[m]; MW = Math.max(MW, s); if (s > 0) e += s; }
        E = Math.max(E, e);
      }
      const b = o.sizing.shortfallBess;
      assert.ok(Math.abs(b.mw - MW) < 1e-9 && Math.abs(b.mwh - E / Math.sqrt(rte)) < 1e-9, `${o.id}: battery size`);
      assert.equal(o.sizing.storage.role, 'shortfall');
      assert.equal(o.flags.some((f) => f.id === 'bess-recharge'), !b.rechargeOK);
      assert.ok(/BESS for the shortfall/.test(o.name));
    }
    out.push(`T1: ${sb.length} shortfall-battery options, ${sb.filter((o) => o.sizing.shortfallBess.rechargeOK).length} recharge on the design day (the T1 permanent shortfall lasts most of the design day)`);
    // (c) A grid short only at the peak hours: T1 with a 125 MW full grid and evaporative cooling (design load 129 MW;
    // the design-day PUE falls from 1.27 at the peak to 1.12 at night).
    const inp = referenceT1({ analysisStart: run.inputs.project.analysisStart });
    inp.grid.fullMW = 125;
    const c2 = buildContext(normalizeInputs(inp));
    const base = { ...run.options.find((o) => o.v.C1 === 'wait').v, C4: 'none', C4s: 'n/a', C8: 'evap', C12: 'shortfall', C12r: 'peakShave' };
    const s = sizeOption(c2, base);
    assert.ok(s.shortfallBess.rechargeOK && s.shortfallBess.mw > 0, 'battery should recharge when the grid is short only at the peak');
    const ttp = timeToPower(c2, base, s);
    const sNo = sizeOption(c2, { ...base, C12: 'none', C12r: 'n/a' });
    const ttpNo = timeToPower(c2, { ...base, C12: 'none', C12r: 'n/a' }, sNo);
    assert.ok(ttp.gapMWm < ttpNo.gapMWm, 'the battery does not reduce the power gap');
    const from = Math.max(c2.fullGridM, s.shortfallBess.availMonth);
    for (let m = from; m < c2.nMonthsTimeline; m++) assert.ok(ttp.supplyByMonth[m] + 1e-6 >= s.designByMonth[m], `month ${m}: battery does not close the design-load gap`);
    out.push(`125 MW grid, evaporative cooling: ${s.shortfallBess.mw.toFixed(1)} MW / ${s.shortfallBess.mwh.toFixed(1)} MWh battery recharges and closes the permanent gap (power gap ${ttpNo.gapMWm.toFixed(0)} → ${ttp.gapMWm.toFixed(0)} MW-months)`);
    return out.join('; ');
  });
}
