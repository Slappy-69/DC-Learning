// 55. Work package 23, second part (owner 2026-11-06: "Keep detail for the top 2,000"; OPEN-QUESTIONS 154): with every
// combination screened, only the best options keep their full detail; the rest are light records that rank exactly
// like the full ones and are rebuilt, figure for figure, when opened, compared or put in the PDF.

import assert from 'node:assert/strict';
import { lightenRun, lightOption, rebuildOption, ensureDetail, detailIds, withDetail, listedOptions, DETAIL_KEEP } from '../src/engine/detail.js';
import { slimOption } from '../src/engine/run.js';
import { scoreOptions } from '../src/engine/scoring.js';
import { normalizeInputs } from '../src/engine/defaults.js';
import { buildReport } from '../src/report/report.js';

const slimRun = (run) => ({ ...run, ctx: undefined, options: run.options.map(slimOption) });

export async function detailTests(test, ctxRuns) {
  await test('55. Work package 23: light records below the best options (memory), exact re-ranking on light records, rebuilt options equal the run\'s, and the same PDF from a lightened run', () => {
    const out = [];
    assert.equal(DETAIL_KEEP, 2000);
    const base = slimRun(ctxRuns.runT1);
    const keep = 100;
    const lr = lightenRun({ ...base, options: base.options.slice() }, keep);
    const nLight = lr.options.filter((o) => o.light).length;
    assert.equal(nLight, base.options.filter((o) => o.rank > keep).length);
    const size = (os) => os.reduce((a, o) => a + JSON.stringify(o).length, 0);
    const lightOnes = lr.options.filter((o) => o.light), fullOnes = base.options.filter((o) => o.rank > keep);
    const ratio = size(lightOnes) / size(fullOnes);
    assert.ok(ratio < 0.5, `light records are ${(ratio * 100).toFixed(0)} % of the full ones`);
    out.push(`${nLight} of ${base.options.length} options light at keep ${keep}: ${(ratio * 100).toFixed(0)} % of the full size`);

    // Light flags keep what the filters, counts and default notes read; the wording comes back on a rebuild.
    const f0 = base.options.find((o) => o.id === lightOnes[0].id);
    assert.deepEqual(lightOnes[0].flags.map((f) => [f.id, f.severity, f.category, f.assumed, f.path]), f0.flags.map((f) => [f.id, f.severity, f.category, f.assumed, f.path]));
    assert.ok(lightOnes[0].flags.every((f) => f.message === ''));

    // The same ranking from light records, for other weights too.
    const I = normalizeInputs(base.inputs);
    for (const w of [I.weights, { cost: 0.1, carbon: 0.6, ttp: 0.2, deliverability: 0.1 }]) {
      const a = base.options.map((o) => ({ ...o })), b = lr.options.map((o) => ({ ...o }));
      scoreOptions(a, { ...I, weights: w }); scoreOptions(b, { ...I, weights: w });
      const ra = new Map(a.map((o) => [o.id, o.rank])), rb = new Map(b.map((o) => [o.id, o.rank]));
      assert.ok([...ra].every(([id, r]) => rb.get(id) === r), 'a different order from the light records');
      assert.ok(a.every((o, k) => Math.abs(o.score - b[k].score) < 1e-12 && o.dominatedBy === b[k].dominatedBy));
    }

    // Rebuilt options equal the run's, figure for figure.
    const byId = new Map(base.options.map((o) => [o.id, o]));
    const sample = lightOnes.filter((_, k) => k % 120 === 0).slice(0, 16);
    for (const o of sample) {
      const r = rebuildOption(lr, o), f = byId.get(o.id);
      assert.ok(!r.light && r.rank === o.rank && r.score === o.score);
      for (const k of ['name', 'eco', 'dispatch', 'flags', 'ttp', 'carbon', 'resilience', 'deliv', 'unmet', 'adequacy']) assert.deepEqual(r[k], f[k], `#${o.rank} ${k}`);
      const { sentences: s1, ...z1 } = r.sizing, { sentences: s2, ...z2 } = f.sizing;
      assert.deepEqual(z1, z2, `#${o.rank} sizing`); assert.deepEqual(s1, s2);
    }
    out.push(`${sample.length} light options rebuilt equal to the run's (ledger, dispatch years, flags, sizing)`);
    // A rebuilt option is kept: the second rebuild reuses it; the light record is not changed.
    const r1 = rebuildOption(lr, sample[0]), r2 = rebuildOption(lr, sample[0]);
    assert.ok(r1.eco === r2.eco && sample[0].light && sample[0].eco.ledger.length === 0);

    // The screens' run: the same run when nothing it reads is light; otherwise a copy with those rebuilt.
    assert.equal(withDetail(base, [lightOnes[9].id]), base);
    const wd = withDetail(lr, [lightOnes[9].id]);
    assert.ok(wd !== lr && lr.options.find((o) => o.id === lightOnes[9].id).light, 'the run itself changed');
    const shown = detailIds(wd, { topN: 50, extra: [lightOnes[9].id] });
    assert.ok(shown.every((id) => !wd.options.find((o) => o.id === id).light), 'an option the screens read is still light');
    assert.deepEqual(wd.options.find((o) => o.id === lightOnes[9].id).eco, byId.get(lightOnes[9].id).eco);
    assert.equal(withDetail(wd, [lightOnes[9].id]), wd, 'nothing left to rebuild');
    // The option lists: every option up to DETAIL_KEEP; above it the best DETAIL_KEEP and the one shown.
    const many = Array.from({ length: DETAIL_KEEP + 500 }, (_, k) => ({ id: k, rank: k + 1 }));
    assert.equal(listedOptions(many.slice(0, 10)).length, 10);
    assert.equal(listedOptions(many).length, DETAIL_KEEP);
    const l2 = listedOptions(many, many[DETAIL_KEEP + 7]);
    assert.ok(l2.length === DETAIL_KEEP + 1 && l2[DETAIL_KEEP] === many[DETAIL_KEEP + 7]);
    assert.equal(listedOptions(many, many[3]).length, DETAIL_KEEP);

    // ensureDetail and detailIds; the PDF from a lightened run equals the PDF from the full one.
    const created = new Date('2026-11-06T12:00:00Z');
    const want = detailIds(lr, { topN: 20, extra: [lightOnes[5].id] });
    assert.ok(want.includes(lightOnes[5].id) && want.length >= 20);
    const lr2 = lightenRun({ ...base, options: base.options.slice() }, 3);
    const p1 = buildReport({ ...base, options: base.options.slice() }, { created, compareIds: [lightOnes[7].id] });
    const p2 = buildReport(lr2, { created, compareIds: [lightOnes[7].id] });
    assert.deepEqual(p2.bytes, p1.bytes, 'the PDF from a lightened run differs');
    assert.equal(lr2.options.filter((o) => o.light).length, base.options.length - 3, 'the report changed the run it was given');
    out.push(`the PDF from a run with ${lr2.options.filter((o) => o.light).length} light options is byte for byte the same (${p1.pages} pages)`);
    assert.equal(lightOption(lightOnes[0]), lightOnes[0]);
    return out.join('; ') + '.';
  });
}
