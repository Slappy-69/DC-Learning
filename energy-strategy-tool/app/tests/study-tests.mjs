// 42. Work package 15: study files (OPEN-QUESTIONS 27, answered 2026-10-24 with Claude's recommendation, accepted in
// advance by the owner; BRIEF §4).

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs } from '../src/engine/defaults.js';
import { studyFile, studyFileName, readStudyFile, compareWithSaved, STUDY_SCHEMA } from '../src/engine/study.js';
import { hashInputs } from '../src/engine/runlog.js';
import { runModel } from '../src/engine/run.js';

export async function studyTests(test, ctxRuns) {
  await test('42. Study files (work package 15): a saved study reopens to the same inputs and the same result, says so, and records the leader; a study saved by an older version takes today\'s defaults for what it lacks and says which; files that are not studies, or from a newer version, are refused with a reason', () => {
    const out = [];
    const run = ctxRuns.runT1;
    const inputs = referenceT1({ analysisStart: ctxRuns.START });
    const f = studyFile(inputs, run, { savedAt: new Date('2026-10-24T12:00:00Z') });
    assert.equal(f.schema, STUDY_SCHEMA);
    assert.equal(f.inputHash, run.inputHash, 'the saved hash is the run\'s');
    assert.equal(f.result.leader.id, run.options.find((o) => o.rank === 1).id);
    const text = JSON.stringify(f, null, 1);
    const r = readStudyFile(text);
    assert.ok(r.ok && r.added.length === 0 && r.warnings.length === 0, JSON.stringify(r.warnings));
    assert.deepEqual(r.inputs, JSON.parse(JSON.stringify(inputs)));
    assert.equal(hashInputs(normalizeInputs(r.inputs)), run.inputHash);
    // Re-running the reopened study gives the saved result (the run is deterministic).
    const c = compareWithSaved(r.file, run);
    assert.ok(c.same && /matches the saved study/.test(c.message));
    assert.equal(studyFileName({ project: { name: 'Pego data centre campus (Abrantes)' } }, new Date('2026-10-24T00:00:00Z')), 'Pego-data-centre-campus-Abrantes-study-2026-10-24.json');
    out.push(`T1 saved and reopened: the same inputs and hash, "${c.message.slice(0, 60)}…"; ${Math.round(text.length / 1024)} kB`);
    // A study from an older version: no existing plant, no new settings.
    const old = JSON.parse(text);
    delete old.inputs.existing; delete old.inputs.settings.siteLayoutScope; delete old.inputs.settings.rentalLeadMonths; delete old.inputs.choices.C20;
    const r2 = readStudyFile(JSON.stringify(old));
    assert.ok(r2.ok);
    for (const p of ['existing', 'settings.siteLayoutScope', 'settings.rentalLeadMonths']) assert.ok(r2.added.includes(p), `${p} not filled`);
    assert.equal(r2.inputs.existing.include, false); assert.ok('C20' in r2.inputs.choices);
    assert.ok(/earlier version/.test(r2.warnings[0]));
    assert.equal(hashInputs(normalizeInputs(r2.inputs)), run.inputHash, 'filled defaults change the result');
    out.push(`an older study: ${r2.added.length} inputs filled from today's defaults, the same result`);
    // A changed default: the hash differs and the comparison says so.
    const changed = JSON.parse(text);
    changed.result.inputHash = 'feedfacefeedface';
    const c2 = compareWithSaved(changed, run);
    assert.ok(!c2.same && /defaults or engine have changed/.test(c2.message));
    // Refused files.
    for (const [t, re] of [['not json', /not valid JSON/], [JSON.stringify({ a: 1 }), /no "schema"/], [JSON.stringify({ schema: 'other/1', inputs: {} }), /not a study file of this tool/],
      [JSON.stringify({ schema: 'dc-energy-study/2', inputs: { project: {} } }), /newer version/], [JSON.stringify({ schema: 'dc-energy-study/1' }), /no inputs/]]) {
      const x = readStudyFile(t);
      assert.ok(!x.ok && re.test(x.error), `${t.slice(0, 30)}: ${x.error}`);
    }
    // Inputs only (no run): no result to compare.
    const f3 = studyFile(inputs);
    assert.equal(f3.result, null); assert.equal(compareWithSaved(f3, run), null);
    out.push('a changed default is reported; five kinds of wrong file refused with a reason; a study saved before any run has inputs only');
    return out.join('; ') + '.';
  });
}
