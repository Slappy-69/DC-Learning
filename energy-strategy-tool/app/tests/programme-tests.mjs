// 18. Ordering from day one and the permitting allowance (owner's decisions of 2026-10-22 and 2026-10-23,
// OPEN-QUESTIONS 44, 45 and 56; build plan work package 3b, part 2). Plant is ordered from the analysis start, in
// parallel with construction of the first phase: procurement + construction, after a 6-month allowance only for
// plant under the IED (aggregated combustion input ≥ 50 MWth) or Seveso (fuel or hydrogen store above the lower
// tier). Wind, ground solar and SMRs keep their own planning and consent months.

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs, getRegistry, TECH } from '../src/engine/defaults.js';
import { buildContext } from '../src/engine/context.js';
import { sizeOption, programmeMonths, techAvailMonth } from '../src/engine/sizing.js';
import { permittingTriggers, permitRegimes } from '../src/engine/permitting.js';

export async function programmeTests(test, ctxRuns) {
  await test('18. Ordering from day one (OPEN-QUESTIONS 44, 45, 56): procurement + construction from the analysis start; a 6-month permitting allowance only for plant under the IED or Seveso; wind, ground solar and SMRs keep their consent months; one rule for sizing, dispatch, capex and the permitting flags', async () => {
    const out = [];
    const reg = getRegistry();
    // (a) Records: the allowance is registered; planning months remain only for the technologies with their own consent.
    assert.equal(reg['requirements.permitAllowanceM'].value, 6);
    for (const [id, t] of Object.entries(TECH)) {
      if (!t.p || t.p.procM == null) continue;
      assert.equal(reg[`tech.${id}.planM`] != null, !!t.ownConsent, `${id}: planning months record`);
      const want = (t.ownConsent ? t.p.planM : 0) + t.p.procM + t.p.buildM;
      assert.equal(programmeMonths(t), want, `${id}: programme months`);
      if (!t.ownConsent) assert.equal(programmeMonths(t, 6), want + 6, `${id}: with the allowance`);
    }
    assert.deepEqual(Object.keys(TECH).filter((k) => TECH[k].ownConsent).sort(), ['smr', 'solarGround', 'wind']);
    assert.equal(programmeMonths(TECH.gasTurbine, 6), 24, "the owner's gas turbine example: 6 + 12 + 6 = 24 months");
    assert.equal(programmeMonths(TECH.wind), 54, 'wind keeps 24 + 18 + 12');
    out.push(`records: permitAllowanceM 6; planM kept only for wind, ground solar and SMR; gas turbine with the allowance 24 months; wind 54`);

    // (b) T1 and T3: every prime and bridging plant's month follows the rule, and its regimes follow the triggers
    // the permitting flags use.
    for (const [label, run] of [['T1', ctxRuns.runT1], ['T3', ctxRuns.runT3]]) {
      const ctx = run.ctx;
      const req = run.inputs.requirements;
      const seen = {};
      for (const o of run.options) {
        const trig = permittingTriggers(o.sizing, o.v, req);
        assert.equal(o.flags.some((f) => f.id === 'permit-ied'), trig.ied, `${label} ${o.id}: IED flag and trigger`);
        assert.equal(o.flags.some((f) => f.id === 'permit-seveso-fuel'), trig.sevesoFuel, `${label} ${o.id}: Seveso flag and trigger`);
        for (const p of [o.sizing.prime, o.sizing.bridge]) {
          if (!p) continue;
          const t = TECH[p.tech];
          const regimes = permitRegimes(p, trig);
          assert.deepEqual(p.permitRegimes, regimes, `${label} ${o.id} ${p.role}: regimes`);
          if (t.combustion && trig.ied && !t.ownConsent) assert.ok(regimes.includes('IED'));
          if (!t.combustion && !(trig.sevesoH2 && t.fuel === 'hydrogen')) assert.ok(!regimes.includes('IED'), `${label} ${o.id}: non-combustion plant held for the IED`);
          assert.equal(p.permitM, regimes.length ? req.permitAllowanceM : 0);
          assert.equal(p.availMonth, techAvailMonth(ctx, t, p.permitM), `${label} ${o.id} ${p.role}: month`);
          assert.ok(o.sizing.sentences.some((s) => s.startsWith(`${t.name} (${p.role === 'prime' ? 'firm prime' : 'bridging'}) available from month ${p.availMonth}:`)), `${label} ${o.id}: programme sentence`);
          const k = `${p.tech} ${regimes.join('+') || 'day one'} → month ${p.availMonth}`; seen[k] = (seen[k] || 0) + 1;
        }
      }
      out.push(`${label}: ${Object.entries(seen).map(([k, n]) => `${k} (${n})`).join('; ')}`);
    }

    // (c) The allowance moves only the held plant, by exactly its length; fuel cells (not combustion) are never held.
    const run = ctxRuns.runT1;
    const held = run.options.find((o) => o.sizing.bridge && o.sizing.bridge.permitM > 0);
    const fc = run.options.find((o) => o.sizing.bridge && o.sizing.bridge.tech === 'fuelCell');
    assert.ok(held && fc, 'T1 has a held bridge and a fuel-cell bridge');
    const in0 = referenceT1({ analysisStart: run.inputs.project.analysisStart });
    in0.requirements = { ...(in0.requirements || {}), permitAllowanceM: 0 };
    const ctx0 = buildContext(normalizeInputs(in0));
    const s0 = sizeOption(ctx0, held.v);
    assert.equal(s0.bridge.availMonth, held.sizing.bridge.availMonth - 6, 'allowance 0 brings the held plant 6 months forward');
    const sFc = sizeOption(ctx0, fc.v);
    assert.equal(sFc.bridge.availMonth, fc.sizing.bridge.availMonth, 'fuel cells do not move with the allowance');
    assert.equal(fc.sizing.bridge.permitM, 0);
    // Wind and ground solar in dispatch keep their consent months.
    out.push(`allowance 0: ${TECH[held.sizing.bridge.tech].name} ${held.sizing.bridge.availMonth} → ${s0.bridge.availMonth}; fuel cells stay at ${fc.sizing.bridge.availMonth}`);
    return out.join('; ');
  });
}
