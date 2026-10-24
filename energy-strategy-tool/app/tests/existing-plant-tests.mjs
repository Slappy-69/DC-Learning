// 39. Work package 12: existing plant near the site, leased (known issue 12; OPEN-QUESTIONS 78–82, answered 2026-10-24
// with Claude's recommendations, accepted in advance by the owner).

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs, TECH } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { buildContext } from '../src/engine/context.js';
import { evaluateOption } from '../src/engine/option.js';
import { combustionPlant } from '../src/engine/permitting.js';
import { NA } from '../src/engine/generator.js';

const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

export async function existingPlantTests(test, ctxRuns) {
  await test('39. Existing plant near the site (work package 12, known issue 12): off by default and explained; when entered it is generated as bridging plant (handed back or kept) and as firm plant (one sizing), never both; exactly the units offered (no N+1); the lease is paid by the month from a month before the plant is first needed; the connection to the campus is one capex line; it is outside the campus IED aggregation, the gas pipe rule and the site plan; ticked but incomplete raises a run flag', () => {
    const out = [];
    // Off by default.
    const t1 = ctxRuns.runT1;
    assert.ok(!t1.options.some((o) => o.v.C2 === 'existing' || o.v.C4 === 'existing'));
    const vng = t1.generation.valuesNotGenerated.filter((x) => x.id === 'C2' || x.id === 'C4');
    assert.ok(vng.every((x) => x.omitted.some((o) => o.value === 'existing' && o.reason === 'no existing plant entered') && /existing plant near the site is entered/.test(x.note)));
    // Entered: two 40 MW CCGT units from January 2028, lease €6/kW a month, €8 m connection.
    const inp = referenceT1({ analysisStart: ctxRuns.START });
    inp.existing = { ...inp.existing, include: true, name: 'Nearby CCGT', type: 'ccgt', units: 2, unitMW: 40, availableDate: '2028-01', leasePerKWMonth: 6, linkCapex: 8e6 };
    const run = runModel(inp);
    const ex = run.options.filter((o) => o.v.C2 === 'existing' || o.v.C4 === 'existing');
    const asBridge = ex.filter((o) => o.v.C2 === 'existing'), asFirm = ex.filter((o) => o.v.C4 === 'existing');
    assert.ok(asBridge.length > 10 && asFirm.length > 10, `${asBridge.length} bridging, ${asFirm.length} firm`);
    assert.ok(!ex.some((o) => o.v.C2 === 'existing' && o.v.C4 === 'existing'), 'the plant in two roles');
    assert.ok(asBridge.every((o) => (o.v.C3 === 'remove' || o.v.C3 === 'prime' || o.v.C3 === NA) && o.v.C5 !== 'retained'), 'bridging role outside rule (m)');
    const ctx = run.ctx;
    const perm = new Set(['air', 'evap', 'dlc', 'immersion'].filter((c) => asFirm.some((o) => o.v.C8 === c && o.v.C4s === 'shortfall' && o.v.C1 !== 'islanded')));
    assert.ok(asFirm.every((o) => o.v.C4s === 'shortfall' || o.v.C1 !== 'islanded'), 'islanded firm plant sized twice');
    assert.ok(asFirm.every((o) => !(o.v.C4s === 'average' && perm.has(o.v.C8) && o.v.C1 !== 'islanded')), 'rule (n): two sizings for one cooling type');
    const rate = 6 * 1000;
    let checked = 0;
    for (const o of ex) {
      const p = o.v.C2 === 'existing' ? o.sizing.bridge : o.sizing.prime;
      assert.equal(p.units, 2); assert.ok(near(p.mw, 80));
      assert.ok(o.sizing.sentences.some((s) => /exactly the 2 units offered, no N\+1 added/.test(s)));
      // Available from January 2028 (month 12) at the earliest; the lease starts a month before first need.
      assert.ok(p.availMonth >= 12);
      if (p.earliestMonth != null) assert.ok(p.earliestMonth === 12 && o.sizing.sentences.some((s) => s.includes(`the lease starts in month ${p.availMonth}, 1 month before it is first needed (month ${p.availMonth + 1})`)));
      // Lease by the month (prime: from the start; bridging: while on site), and no capex for the plant itself.
      const T = ctx.fullGridM;
      o.eco.ledger.forEach((r, y) => {
        if (y >= o.eco.ledger.length - 1) return;
        let mwM = 0;
        for (let m = 12 * y; m < 12 * y + 12; m++) {
          if (m < p.availMonth) continue;
          if (o.v.C2 === 'existing' && !(o.v.C1 === 'islanded' || m < T || o.v.C3 !== 'remove')) continue;
          mwM += p.mw;
        }
        const other = o.v.C2 === 'rented' ? null : 0;
        if (other === 0) assert.ok(near(r.rental, mwM * rate, 1e-9), `${o.id} year ${y}: lease ${r.rental} ≠ ${mwM * rate}`);
      });
      const link = o.eco.capexLines.filter((l) => /Nearby CCGT \(lease\)/.test(l.item));
      assert.equal(link.length, 1); assert.ok(near(link[0].amount, 8e6) && /connection to the campus/.test(link[0].item));
      assert.equal(link[0].year, Math.floor(p.availMonth / 12));
      // Outside the campus IED aggregation and the gas pipe rule.
      assert.ok(!combustionPlant(o.sizing, o.v).some((c) => /Nearby CCGT/.test(c.name)));
      checked++;
    }
    out.push(`${asBridge.length} options with it as bridging plant and ${asFirm.length} as firm plant of ${run.options.length}; all ${checked} sized at exactly 2 × 40 MW, leased by the month from a month before first need, €8 m connection line, outside the IED aggregation`);
    // Not drawn on the campus.
    const e = evaluateOption(buildContext(normalizeInputs(inp), { site: ctx.site }), asFirm[0].v);
    assert.ok(!e.bs.ground.some((b) => /Nearby CCGT/.test(b.name || '')), 'existing plant drawn on the campus');
    const best = [...ex].sort((a, b) => a.rank - b.rank)[0];
    out.push(`best with it: #${best.rank} ${best.name} (€${best.eco.lcoe.toFixed(1)}/MWh; run leader €${run.options.find((o) => o.rank === 1).eco.lcoe.toFixed(1)})`);
    // Ticked but incomplete: not generated, run flag.
    const inp2 = referenceT1({ analysisStart: ctxRuns.START });
    inp2.existing = { ...inp2.existing, include: true, units: 2, unitMW: null };
    inp2.settings.generationCap = 40;
    const r2 = runModel(inp2);
    assert.ok(!r2.options.some((o) => o.v.C2 === 'existing' || o.v.C4 === 'existing'));
    const f = r2.runFlags.find((x) => x.id === 'existing-incomplete');
    assert.ok(f && /unit size/.test(f.message));
    out.push(`ticked without a unit size: not generated, flag "${f.message}"`);
    assert.equal(TECH.existing.offsite, true);
    return out.join('; ') + '.';
  });
}
