// 20. Splitting bridging plant when the grid arrives (owner's decision of 2026-10-23, OPEN-QUESTIONS 59; the owner's
// alternative (b) of OPEN-QUESTIONS 42). C3 = "Keep shortfall share as prime, rest as backup": from the full grid date
// the units that cover the permanent shortfall (N+1 per block) keep running as prime; the rest are retired into backup.

import assert from 'node:assert/strict';
import { CHOICE_BY_ID, defaultChoiceState, TECH } from '../src/engine/defaults.js';
import { permanentShortfallCoolings } from '../src/engine/adequacy.js';
import { bridgeMWAt } from '../src/engine/sizing.js';

export async function splitTests(test, ctxRuns) {
  await test('20. Split bridging plant (OPEN-QUESTIONS 59): kept share = permanent shortfall with N+1 per block, running as prime from the full grid date; the rest retired into backup; rule (h); two plant records in dispatch; bought, not removed', async () => {
    const out = [];
    assert.ok(CHOICE_BY_ID.C3.values.some((x) => x[0] === 'split'));
    assert.ok(defaultChoiceState('C3', null).values.includes('split'));
    for (const [label, run] of [['T1', ctxRuns.runT1], ['T3', ctxRuns.runT3]]) {
      const ctx = run.ctx, req = run.inputs.requirements, T = ctx.fullGridM;
      const perm = permanentShortfallCoolings(run.inputs);
      const sp = run.options.filter((o) => o.v.C3 === 'split');
      assert.ok(run.rules.find((r) => r.id === 'h'), 'rule (h) listed');
      for (const o of sp) {
        assert.ok(o.v.C1 === 'bridge' && o.v.C2 !== 'bessSolar' && perm.has(o.v.C8), `${label} ${o.id}: rule (h)`);
        const b = o.sizing.bridge;
        const t = TECH[b.tech];
        let SP = 0;
        for (let m = Math.max(0, T); m < ctx.nMonthsTimeline; m++) SP = Math.max(SP, o.sizing.designByMonth[m] - ctx.gridCap[m]);
        const nP = Math.ceil(SP / t.p.unitMW - 1e-9);
        assert.equal(b.primeUnits, nP + Math.ceil(nP / req.blockSize), `${label} ${o.id}: kept units`);
        assert.ok(b.units >= b.primeUnits && Math.abs(b.primeMW - b.primeUnits * t.p.unitMW) < 1e-9);
        // Running MW: the whole plant before the grid date, the kept share after.
        assert.equal(bridgeMWAt(o.v, T - 1, T, b), b.mw); assert.equal(bridgeMWAt(o.v, T, T, b), b.primeMW);
        // Two plant records in dispatch; the kept share runs only from the grid date.
        const roles = o.dispatch.years[0].plants.map((p) => p.role);
        assert.ok(roles.includes('bridge') && roles.includes('bridgeKept'), `${label} ${o.id}: plant records`);
        // The plant stays on site after the grid date: a retained-plant entry in the resilience check.
        assert.ok(o.resilience.items[0].text.includes('retained bridging'), `${label} ${o.id}: retained bridging in resilience`);
        // Once available, the kept share closes the permanent shortfall (with any firm prime plant).
        const from = Math.max(T, b.availMonth, b.fuelMonth);
        for (let m = from; m < ctx.nMonthsTimeline; m++) assert.ok(o.sizing.designByMonth[m] - ctx.gridCap[m] - o.sizing.firmByMonth[m] <= 1e-6, `${label} ${o.id}: shortfall left in month ${m}`);
        assert.ok(/keep shortfall share as prime, rest as backup/.test(o.name));
      }
      const best = sp.length ? sp.reduce((a, b) => (a.rank < b.rank ? a : b)) : null;
      out.push(`${label}: ${sp.length} split options (${sp.filter((o) => o.adequacy.adequate).length} adequate${best ? `, best rank ${best.rank}` : ''}); rule (h) removed ${run.rules.find((r) => r.id === 'h').removed.toLocaleString('en-GB')}`);
    }
    return out.join('; ');
  });
}
