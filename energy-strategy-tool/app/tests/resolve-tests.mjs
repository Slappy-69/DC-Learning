// Work package 35: the condition resolver (owner's decisions of 2026-11-12). A ticked tier B condition re-runs the
// option; only conditions with a tick already in the inputs can be resolved (engine/resolve.js).

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { resolutionFor } from '../src/engine/resolve.js';

export async function resolveTests(test) {
  await test('80. Condition resolver: each resolvable condition maps to its existing input, the rest map to nothing', () => {
    const inputs = { plants: { agreed: { a: true }, importConfirmed: {} }, utilities: { gasAvailable: 'Unknown' } };
    const agreed = resolutionFor({ id: 'third-party', plant: 'b' }, inputs);
    assert.equal(agreed.path, 'plants.agreed');
    assert.deepEqual(agreed.value, { a: true, b: true }, 'keeps the other plants already ticked');
    const imp = resolutionFor({ id: 'takeover-import', plant: 'c' }, inputs);
    assert.equal(imp.path, 'plants.importConfirmed');
    assert.deepEqual(imp.value, { c: true });
    const gas = resolutionFor({ id: 'gas-supply' }, inputs);
    assert.deepEqual([gas.path, gas.value], ['utilities.gasAvailable', 'Yes']);
    assert.equal(resolutionFor({ id: 'gas-supply' }, { utilities: { gasAvailable: 'Yes' } }), null, 'only when availability is Unknown');
    for (const id of ['unit-count', 'outage', 'land', 'rental-long', 'eia', 'dco', 'de-enefg']) {
      assert.equal(resolutionFor({ id }, inputs), null, `${id} needs a design change, not a tick`);
    }
    return 'third-party, takeover-import and gas-supply resolve to their inputs; seven design conditions do not';
  });

  await test('81. Condition resolver: ticking an owner as agreed re-runs the options and removes that condition', () => {
    // A leased plant entered by hand (the key is "manual"), as in the realism tests (test 73 and its neighbours).
    const i = referenceT1({ analysisStart: '2027-01' }); i.settings.generationCap = 400; i.settings.realism = true;
    Object.assign(i.existing, { include: true, name: 'Nearby CCGT', type: 'ccgt', units: 2, unitMW: 40, availableDate: '2027-06', leasePerKWMonth: 6, linkCapex: 8e6 });
    const count = (r) => r.options.reduce((a, o) => a + o.deliv.conditions.filter((c) => c.id === 'third-party').length, 0);
    const before = runModel(normalizeInputs(i));
    const n0 = count(before);
    assert.ok(n0 > 0, 'the set-up has owner conditions to resolve');
    // The resolver ticks the owner as agreed: plants.agreed[plant] = true.
    const r = resolutionFor(before.options.flatMap((o) => o.deliv.conditions).find((c) => c.id === 'third-party'), i);
    assert.equal(r.path, 'plants.agreed');
    i.plants = { ...(i.plants || {}), agreed: r.value };
    const n1 = count(runModel(normalizeInputs(i)));
    assert.ok(n1 < n0, `the re-run has fewer owner conditions: ${n1} after, ${n0} before`);
    return `owner conditions: ${n0} before, ${n1} after one tick (re-run)`;
  });
}
