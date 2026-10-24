// 40. Work package 13: site layout in the run (OPEN-QUESTIONS 83, answered 2026-10-24 with Claude's recommendation,
// accepted in advance by the owner). A large campus is not laid out option by option unless site fit can change the
// ranking; the Site tab (Beta) lays out the options it shows.

import assert from 'node:assert/strict';
import { referenceT1 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { inspectOption, compareWithRun } from '../src/engine/inspect.js';
import { layoutForOption } from '../src/engine/siteapi.js';
import { normalizeInputs } from '../src/engine/defaults.js';

export async function layoutScopeTests(test, ctxRuns) {
  await test('40. Site layout in the run (work package 13): T1 is laid out in full (layout work below the limit); above the limit every option is "Not laid out" with a run flag, and scores, ranks and every main-flow figure are unchanged; with the site-fit penalty, compliant-first ranking or "every option" the run lays out every option; the Site tab and the inspector lay out on demand', () => {
    const out = [];
    const full = ctxRuns.runT1;
    assert.ok(!full.layoutSummary.onDemand && !full.runFlags.some((f) => f.id === 'site-layout-on-demand'));
    assert.ok(full.options.every((o) => o.siteFit.status !== 'Not laid out'));
    // Above the limit.
    const inp = referenceT1({ analysisStart: ctxRuns.START });
    inp.settings.siteLayoutWorkLimit = 1000;
    const t0 = Date.now();
    const run = runModel(inp);
    const ms = Date.now() - t0;
    assert.ok(run.layoutSummary.onDemand && run.layoutSummary.work > 1000);
    const f = run.runFlags.find((x) => x.id === 'site-layout-on-demand');
    assert.ok(f && f.severity === 'info' && /Site tab lays out each option it shows/.test(f.message));
    assert.ok(run.options.every((o) => o.siteFit.status === 'Not laid out' && o.siteFit.skipped));
    const byId = new Map(full.options.map((o) => [o.id, o]));
    for (const o of run.options) {
      const x = byId.get(o.id);
      assert.equal(o.rank, x.rank); assert.equal(o.score, x.score);
      assert.equal(o.eco.lcoe, x.eco.lcoe); assert.equal(o.deliv.score, x.deliv.score);
      assert.equal(o.adequacy.adequate, x.adequacy.adequate);
      assert.deepEqual(o.flags.filter((g) => !/^site-/.test(g.id)).map((g) => g.id), x.flags.filter((g) => !/^site-/.test(g.id)).map((g) => g.id));
    }
    out.push(`T1 layout work ${(run.layoutSummary.work / 1e6).toFixed(2)} million block² (limit 20 million: laid out in full); with the limit at 1,000 every option is "Not laid out", the run takes ${(ms / 1000).toFixed(1)} s and all ${run.options.length} ranks, scores, LCOEs, deliverability, adequacy and main-flow flags equal the full run`);
    // On demand: the Site tab's layout and the inspector.
    const lead = run.options.find((o) => o.rank === 1);
    const L = layoutForOption(run.ctx.site, normalizeInputs(run.inputs), lead);
    assert.equal(L.siteFit.status, byId.get(lead.id).siteFit.status);
    const I = inspectOption(run.inputs, lead.v, { site: run.ctx.site });
    assert.ok(!compareWithRun(I, lead).diffs.some((d) => d.label === 'site-fit status'));
    out.push(`the leader laid out on demand: "${L.siteFit.status}", as in the full run; the inspector matches`);
    // Site fit that can change the ranking: every option is laid out.
    for (const [label, set] of [['site-fit penalty', (i) => { i.deliverability.siteFitPenalty = true; }], ['compliant-first ranking', (i) => { i.settings.rankCompliantFirst = true; }], ['"every option"', (i) => { i.settings.siteLayoutScope = 'all'; }]]) {
      const i2 = referenceT1({ analysisStart: ctxRuns.START });
      i2.settings.siteLayoutWorkLimit = 1000; i2.settings.generationCap = 40;
      set(i2);
      const r2 = runModel(i2);
      assert.ok(!r2.layoutSummary.onDemand && r2.options.every((o) => o.siteFit.status !== 'Not laid out'), `${label}: not laid out`);
    }
    out.push('with the site-fit penalty, compliant-first ranking or "every option", every option is laid out');
    return out.join('; ') + '.';
  });
}
