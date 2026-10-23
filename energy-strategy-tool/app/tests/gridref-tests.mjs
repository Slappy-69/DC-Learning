// 22. IT the grid supports by grid period, and the grid-matched phasing reference (OPEN-QUESTIONS 38, step 3;
// build plan work package 3b). Shown in the run summary; the reference is not an option and is not ranked.

import assert from 'node:assert/strict';

export async function gridRefTests(test, ctxRuns) {
  await test('22. Grid periods and grid-matched phasing (OPEN-QUESTIONS 38 step 3): IT supported in each grid period = grid MW ÷ (design-day PUE + ancillary); each phase energised no earlier than planned and only when the grid alone carries the cumulative IT at design load', async () => {
    const out = [];
    for (const [label, run] of [['T1', ctxRuns.runT1], ['T3', ctxRuns.runT3]]) {
      const ctx = run.ctx;
      const anc = run.inputs.load.ancillaryFrac;
      for (const c of run.shortfall.byCooling) {
        const per = c.peakPUE + anc;
        // Periods cover the timeline without gaps, each at one grid capacity.
        assert.equal(c.periods[0].fromMonth, 0);
        assert.equal(c.periods[c.periods.length - 1].toMonth, ctx.nMonthsTimeline - 1);
        for (let i = 0; i < c.periods.length; i++) {
          const p = c.periods[i];
          if (i) assert.equal(p.fromMonth, c.periods[i - 1].toMonth + 1);
          for (let m = p.fromMonth; m <= p.toMonth; m++) assert.ok(Math.abs(ctx.gridCap[m] - p.gridMW) < 1e-6, `${label} ${c.cooling}: grid in month ${m}`);
          assert.ok(Math.abs(p.itSupportedMW * per - p.gridMW) < 1e-9);
        }
        // Grid-matched phasing by hand.
        let cum = 0;
        ctx.phases.forEach((ph, k) => {
          cum += ph.it;
          const need = cum * per;
          let mm = null;
          for (let m = Math.max(0, ph.m); m < ctx.nMonthsTimeline; m++) if (ctx.gridCap[m] + 1e-6 >= need) { mm = m; break; }
          const g = c.gridMatched[k];
          assert.equal(g.gridMonth, mm, `${label} ${c.cooling} phase ${k + 1}: grid-matched month`);
          assert.equal(g.delayMonths, mm == null ? null : mm - ph.m);
          if (mm != null) assert.ok(g.gridMonth >= g.plannedMonth);
        });
      }
      const c0 = run.shortfall.byCooling.map((c) => `${c.cooling} ${c.gridMatched.map((g) => (g.gridMonth == null ? 'never' : `+${g.delayMonths}`)).join('/')}`).join('; ');
      out.push(`${label}: ${run.shortfall.byCooling[0].periods.length} grid periods; phase delays ${c0}`);
    }
    return out.join('; ');
  });
}
