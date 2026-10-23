// 19. Firm generation sized two ways (owner's decision of 2026-10-23, OPEN-QUESTIONS 58; build plan work package 3b,
// part 3). Each C4 technology is generated sized to the steady-state average facility load (baseload, as before) and
// to the permanent shortfall (top-up: design load less the full grid capacity from the full grid date, plus N+1 per
// block). The top-up sizing is generated only where there is a permanent shortfall (rule g), or when islanded.

import assert from 'node:assert/strict';
import { CHOICE_BY_ID, defaultChoiceState, TECH } from '../src/engine/defaults.js';
import { isNA, NA, ARCHETYPES } from '../src/engine/generator.js';
import { permanentShortfallCoolings } from '../src/engine/adequacy.js';

const PRIME = { chp: 'chp', gasRecip: 'gasRecip', fuelCell: 'fuelCell', smr: 'smr', hydrogen: 'hydrogen' };

export async function topupTests(test, ctxRuns) {
  await test('19. Firm generation sizing (OPEN-QUESTIONS 58): C4 sized to the average load (baseload) and to the permanent shortfall (top-up, N+1 per block); top-up only where there is a permanent shortfall (rule g) or islanded; a top-up plant closes the permanent shortfall', async () => {
    const out = [];
    // (a) The choice.
    assert.deepEqual(CHOICE_BY_ID.C4s.values.map((x) => x[0]), ['average', 'shortfall']);
    assert.deepEqual(defaultChoiceState('C4s', null), { state: 'open', values: ['average', 'shortfall'] });
    assert.equal(isNA('C4s', { C4: 'none' }), true); assert.equal(isNA('C4s', { C4: 'chp' }), false);
    for (const [label, run] of [['T1', ctxRuns.runT1], ['T3', ctxRuns.runT3]]) {
      const ctx = run.ctx, req = run.inputs.requirements;
      const perm = permanentShortfallCoolings(run.inputs);
      // (b) Rule (g), and the same cooling set as the run's shortfall analysis.
      for (const c of run.shortfall.byCooling) assert.equal(perm.has(c.cooling), c.permanent.months > 0, `${label} ${c.cooling}: permanent shortfall set`);
      const ruleG = run.rules.find((r) => r.id === 'g');
      assert.ok(ruleG, 'rule (g) listed');
      let nTop = 0, nAvg = 0, nIsl = 0;
      for (const o of run.options) {
        if (o.v.C4 === 'none') { assert.equal(o.v.C4s, NA); continue; }
        const t = TECH[PRIME[o.v.C4]];
        const p = o.sizing.prime;
        if (o.v.C4s === 'shortfall') {
          nTop++;
          assert.ok(o.v.C1 === 'islanded' || perm.has(o.v.C8), `${label} ${o.id}: top-up without a permanent shortfall`);
          if (o.v.C1 === 'islanded') nIsl++;
          // (c) Sizing by hand.
          let S = 0;
          const D = o.sizing.designByMonth;
          for (let m = o.v.C1 === 'islanded' ? 0 : Math.max(0, ctx.fullGridM); m < ctx.nMonthsTimeline; m++) S = Math.max(S, D[m] - (o.v.C1 === 'islanded' ? 0 : ctx.gridCap[m]));
          const n = Math.max(1, Math.ceil(S / t.p.unitMW - 1e-9));
          assert.equal(p.units, n + Math.ceil(n / req.blockSize), `${label} ${o.id}: top-up units`);
          assert.ok(Math.abs(p.mw - p.units * t.p.unitMW) < 1e-9 && p.sizing === 'shortfall');
          assert.ok(/ top-up/.test(o.name), `${label} ${o.id}: name`);
          // (d) Once available (and fuelled), the top-up plant closes the permanent shortfall in every month.
          if (o.v.C1 !== 'islanded') {
            const from = Math.max(ctx.fullGridM, p.availMonth, p.fuelMonth);
            for (let m = from; m < ctx.nMonthsTimeline; m++) assert.ok(D[m] - ctx.gridCap[m] - o.sizing.firmByMonth[m] <= 1e-6, `${label} ${o.id}: permanent shortfall left in month ${m}`);
          }
        } else {
          nAvg++;
          const frac = o.v.C4 === 'chp' ? t.p.sizeFraction : 1;
          assert.equal(p.units, Math.max(1, Math.round((frac * o.sizing.avgMW) / t.p.unitMW)), `${label} ${o.id}: baseload units unchanged`);
          assert.ok(!/ top-up/.test(o.name));
        }
      }
      // (e) Archetypes keep the baseload sizing.
      for (const a of ARCHETYPES.filter((x) => x.v.C4 && x.v.C4 !== 'none')) {
        const o = run.options.find((x) => x.archetype === a.id);
        if (o) assert.equal(o.v.C4s, 'average', `${label} ${a.id}: archetype sizing`);
      }
      out.push(`${label}: permanent shortfall for ${[...perm].sort().join(', ') || 'none'}; rule (g) removed ${ruleG.removed.toLocaleString('en-GB')}; ${nTop} top-up (${nIsl} islanded) and ${nAvg} baseload options`);
    }
    return out.join('; ');
  });
}
