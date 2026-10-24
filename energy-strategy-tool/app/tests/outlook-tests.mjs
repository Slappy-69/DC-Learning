// 21. Permitting outlook (owner's decision of 2026-10-22, OPEN-QUESTIONS 46): for each plant held by the IED or
// Seveso, a three-level outlook (likely, uncertain, unlikely) with its reason, by technology (country overrides when
// researched), labelled judgement, with the month it is ready against the month it is first needed. Reported in one
// flag; it changes no score.

import assert from 'node:assert/strict';
import { getRegistry, PERMIT_OUTLOOK, PERMIT_OUTLOOKS, TECH } from '../src/engine/defaults.js';
import { techAvailMonth } from '../src/engine/sizing.js';

export async function outlookTests(test, ctxRuns) {
  await test('21. Permitting outlook (OPEN-QUESTIONS 46): every held plant (prime, bridging, standby gensets) has an outlook, reason, ready and needed month; one flag, minor when unlikely or late; no score effect; records labelled judgement', async () => {
    const out = [];
    const reg = getRegistry();
    for (const [id, x] of Object.entries(PERMIT_OUTLOOK)) {
      const r = reg[`permitting.outlook.${id}`];
      assert.ok(r && r.basis === 'judgement' && r.label && r.note, `${id}: record`);
      assert.ok(PERMIT_OUTLOOKS.includes(x.outlook));
    }
    for (const [label, run] of [['T1', ctxRuns.runT1], ['T3', ctxRuns.runT3]]) {
      const ctx = run.ctx;
      let late = 0, items = 0;
      for (const o of run.options) {
        const held = [o.sizing.prime, o.sizing.bridge].filter((p) => p && p.permitRegimes && p.permitRegimes.length);
        const list = o.sizing.permitOutlook;
        for (const p of held) assert.ok(list.some((x) => x.role === p.role && x.tech === p.tech && x.readyMonth === (p.earliestMonth ?? p.availMonth)), `${label} ${o.id}: ${p.role} outlook missing`);
        for (const x of list) {
          items++;
          assert.ok(PERMIT_OUTLOOKS.includes(x.outlook) && x.reason && x.regimes.length);
          const base = PERMIT_OUTLOOK[x.tech] || (TECH[x.tech].role === 'backup' ? PERMIT_OUTLOOK.backup : null);
          assert.equal(x.outlook, base.outlook, `${label} ${o.id}: outlook by technology`);
          if (x.role === 'backup') assert.equal(x.readyMonth, techAvailMonth(ctx, TECH[x.tech], run.inputs.requirements.permitAllowanceM));
          if (x.neededMonth != null) assert.equal(x.floatMonths, x.neededMonth - x.readyMonth);
          if (x.floatMonths != null && x.floatMonths < 0) late++;
        }
        const f = o.flags.find((g) => g.id === 'permit-outlook');
        assert.equal(!!f, list.length > 0, `${label} ${o.id}: outlook flag`);
        if (f) {
          const worry = list.some((x) => x.outlook === 'unlikely' || (x.floatMonths != null && x.floatMonths < 0));
          assert.equal(f.severity, worry ? 'minor' : 'info');
          assert.ok(!f.permitting, 'the outlook flag must not count in deliverability');
        }
      }
      out.push(`${label}: ${items} outlook items, ${late} not ready when first needed`);
    }
    return out.join('; ');
  });
}
