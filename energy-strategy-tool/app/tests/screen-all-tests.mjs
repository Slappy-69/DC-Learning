// 54. Work package 23 (owner 2026-11-02, OPEN-QUESTIONS 153: "Screen all below a limit"): a run screens every valid
// combination when there are no more than settings.screenAllBelow (default 20,000), and samples up to the cap above it.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { referenceT3, normalizeInputs, getRegistry, CHOICES } from '../src/engine/defaults.js';
import { generateOptions } from '../src/engine/generator.js';
import { runModel } from '../src/engine/run.js';

export async function screenAllTests(test, ctxRuns) {
  await test('54. Work package 23: every combination screened up to the limit (T3: 9,424 of 9,424), sampled above it or at 0; the full run\'s leader is at least as good as the sampled one; default 20,000 outside the test suite', () => {
    const out = [];
    // The record, and its default without the test suite's switch.
    assert.ok(getRegistry()['settings.screenAllBelow'], 'record');
    const url = new URL('../src/engine/defaults.js', import.meta.url).href;
    const env = { ...process.env }; delete env.ESTOOL_SCREEN_ALL_BELOW;
    const dflt = execFileSync(process.execPath, ['--input-type=module', '-e', `import { buildDefaultInputs } from '${url}'; console.log(buildDefaultInputs().settings.screenAllBelow);`], { env }).toString().trim();
    assert.equal(dflt, '20000', 'default outside the suite');

    // Generation: below the limit every combination; above it, or at 0, the sample.
    const T3 = () => referenceT3({ analysisStart: ctxRuns.START });
    const at = (n) => { const i = T3(); i.settings.screenAllBelow = n; return generateOptions(normalizeInputs(i)).summary; };
    const all = at(20000), above = at(5000), off = at(0);
    assert.ok(all.screenAll && !all.sampled && all.screened === all.totalCombinations, JSON.stringify(all));
    assert.ok(!above.screenAll && above.sampled && above.screened === above.cap, 'above the limit');
    assert.ok(!off.screenAll && off.sampled && off.screened === off.cap, 'limit 0');
    out.push(`T3: ${all.screened.toLocaleString('en-GB')} of ${all.totalCombinations.toLocaleString('en-GB')} screened at 20,000; ${above.screened.toLocaleString('en-GB')} sampled at 5,000 and at 0`);

    // The full run: its leader ranks first among every combination, so it is at least as good as the sampled leader.
    const i = T3(); i.settings.screenAllBelow = 20000;
    const t0 = Date.now();
    const full = runModel(i);
    const ms = Date.now() - t0;
    assert.equal(full.options.length, all.totalCombinations);
    const key = (v) => CHOICES.map((c) => v[c.id]).join('|');
    const byKey = new Map(full.options.map((o) => [key(o.v), o]));
    const sLead = ctxRuns.runT3.options.find((o) => o.rank === 1), fLead = full.options.find((o) => o.rank === 1);
    const sInFull = byKey.get(key(sLead.v));
    assert.ok(sInFull && sInFull.rank >= 1 && fLead.score >= sInFull.score - 1e-9 * Math.abs(fLead.score), 'sampled leader beats the full one');
    out.push(`full T3 run in ${(ms / 1000).toFixed(1)} s; the sampled leader ranks #${sInFull.rank} of all, ${(fLead.score - sInFull.score).toFixed(4)} points behind`);
    return out.join('; ') + '.';
  });
}
