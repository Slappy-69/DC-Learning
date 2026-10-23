// 23. Backup per building or pooled across the campus (owner's decisions of 2026-10-22, OPEN-QUESTIONS 47 and 48;
// build plan work package 3b). Per building: one backup technology per building (phase); bridging plant retired into
// backup backs up whole buildings, in phase order, at the required topology; gensets back up the rest, each building
// with its own redundancy. Pooled: the retired plant (redundant units removed) and the gensets together make up the
// campus critical load; a client-perceived risk item lowers deliverability (minor by default, can be raised to major).

import assert from 'node:assert/strict';
import { CHOICE_BY_ID, TECH, referenceT1, normalizeInputs, getRegistry } from '../src/engine/defaults.js';
import { isNA } from '../src/engine/generator.js';
import { buildContext } from '../src/engine/context.js';
import { sizeOption } from '../src/engine/sizing.js';
import { deliverability } from '../src/engine/evaluate.js';

const BACKUP = { diesel: 'backupDiesel', hvo: 'backupHvo', gas: 'backupGas', bessUps: 'backupHvo' };
const red = (n, topo, B, C) => {
  const b = Math.ceil(n / B);
  return topo === 'N' ? { total: n, extra: 0 } : topo === '2N' ? { total: 2 * n, extra: n } : topo === 'catcher' ? { total: n + Math.ceil(b / C), extra: Math.ceil(b / C) } : { total: n + b, extra: b };
};

export async function backupTests(test, ctxRuns) {
  await test('23. Backup per building or pooled (OPEN-QUESTIONS 47, 48): per-building redundancy; retired bridging plant backs up whole buildings; pooled counts the retired plant against the campus load; pooled carries a client-perceived risk item (minor by default, major on request)', async () => {
    const out = [];
    assert.deepEqual(CHOICE_BY_ID.C5a.values.map((x) => x[0]), ['perBuilding', 'pooled']);
    assert.ok(isNA('C5a', { C5: 'none' }) && isNA('C5a', { C5: 'retained' }) && !isNA('C5a', { C5: 'diesel' }));
    assert.equal(getRegistry()['deliverability.pooledBackupRisk'].value, 'minor');
    const run = ctxRuns.runT1;
    const ctx = run.ctx, req = run.inputs.requirements;
    let nPer = 0, nPool = 0;
    for (const o of run.options) {
      if (o.v.C5 === 'none' || o.v.C5 === 'retained') continue;
      const t = TECH[BACKUP[o.v.C5]];
      const cp = ctx.cooling[o.v.C8];
      const critOf = (it) => req.backedPct * it * (1 + cp.coolPeak);
      const b = o.sizing.backup;
      if (o.v.C5a === 'perBuilding') {
        nPer++;
        let units = 0;
        ctx.phases.forEach((ph, k) => {
          if (b.coveredByRetired.includes(k + 1)) { assert.equal(b.unitsByPhase[k], 0); return; }
          const n = Math.ceil(critOf(ph.it) / t.p.unitMW - 1e-9);
          const r = red(n, o.v.C6, req.blockSize, req.catcherN);
          const u = o.v.C5 === 'bessUps' ? n : r.total;
          assert.equal(b.unitsByPhase[k], u, `${o.id}: building ${k + 1} units`);
          units += u;
        });
        assert.equal(b.units, units, `${o.id}: per-building total`);
        assert.ok(!o.deliv.items.some((i) => /pooled/.test(i.item)));
      } else {
        nPool++;
        const br = o.sizing.bridge;
        const retired = o.v.C1 === 'bridge' && br && br.units > 0 && ['backup', 'gridServices', 'split'].includes(o.v.C3) && br.fuelMonth !== Infinity ? br.units - (br.primeUnits || 0) : 0;
        const retiredFirm = retired ? Math.max(0, retired - Math.ceil(retired / req.blockSize)) * br.unitMW : 0;
        const crit = Math.max(0, o.sizing.criticalMW - retiredFirm);
        const n = Math.ceil(crit / t.p.unitMW - 1e-9);
        assert.equal(b.nUnits, n, `${o.id}: pooled units before redundancy`);
        assert.equal(b.units, o.v.C5 === 'bessUps' ? n : red(n, o.v.C6, req.blockSize, req.catcherN).total, `${o.id}: pooled total`);
        const it = o.deliv.items.find((i) => /pooled/.test(i.item));
        assert.ok(it && it.points === -run.inputs.deliverability.minorFlagPenalty, `${o.id}: client-perceived risk item`);
      }
      assert.ok(Math.abs(b.fuelM3 - (t.fuel === 'gas' ? 0 : Math.max(0, b.genCriticalMW * Number(o.v.C7) * TECH.fuelStorage.p.dieselLPerKWh - TECH.fuelStorage.p.bellyTankM3))) < 1e-6, `${o.id}: fuel for the gensets' share`);
    }
    out.push(`T1: ${nPer} per-building and ${nPool} pooled options checked by hand`);

    // Retired bridging plant backs up whole buildings: T1 with no grid before the full connection, gas engines
    // bridging the first building and retained as backup.
    const inp = referenceT1({ analysisStart: run.inputs.project.analysisStart });
    inp.grid.nowMW = 0;
    const c2 = buildContext(normalizeInputs(inp));
    const base = run.options.find((o) => o.v.C1 === 'bridge') || run.options[0];
    const v = { ...base.v, C1: 'bridge', C2: 'gasRecip', C3: 'backup', C4: 'none', C4s: 'n/a', C5: 'diesel', C5a: 'perBuilding', C6: 'N+1', C7: '48', C8: 'air' };
    const s = sizeOption(c2, v);
    assert.ok(s.backup.coveredByRetired.length >= 1, 'no building backed up by the retired plant');
    const sPool = sizeOption(c2, { ...v, C5a: 'pooled' });
    const sNone = sizeOption(c2, { ...v, C3: 'remove' });
    assert.ok(s.backup.units < sNone.backup.units && sPool.backup.units < sizeOption(c2, { ...v, C3: 'remove', C5a: 'pooled' }).backup.units, 'retired plant does not reduce the gensets');
    out.push(`no early grid: ${s.bridge.units} gas engines retired; per building they back up building${s.backup.coveredByRetired.length === 1 ? '' : 's'} ${s.backup.coveredByRetired.join(', ')} and gensets fall from ${sNone.backup.units} to ${s.backup.units}; pooled ${sPool.backup.units}`);

    // Raising the client-perceived risk to major.
    const pooled = run.options.find((o) => o.v.C5a === 'pooled');
    const inMaj = { ...run.inputs, deliverability: { ...run.inputs.deliverability, pooledBackupRisk: 'major' } };
    const d = deliverability({ ...ctx, inputs: inMaj }, pooled.v, pooled.sizing, pooled.dispatch, pooled.flags, pooled.siteFit);
    assert.equal(d.items.find((i) => /pooled/.test(i.item)).points, -run.inputs.deliverability.majorFlagPenalty);
    out.push('pooled risk item −minor by default, −major when raised');
    return out.join('; ');
  });
}
