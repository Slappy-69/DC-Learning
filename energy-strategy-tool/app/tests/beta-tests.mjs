// 15. Site tab as a Beta feature (walkthrough, 2026-10-21; BRIEF §2 principle 3, §10, §11, §12.12, AC 27).
// The Site tab is hidden by default and turned on in the general settings. Site fit must never enter the ranking,
// the scores or "Rank requirement-compliant options first", so every main-flow result is the same whether the
// tab is on or off; with it off, no site-fit status, flag or note appears in the main views.

import assert from 'node:assert/strict';
import { runModel } from '../src/engine/run.js';
import { referenceT2, normalizeInputs, getRegistry } from '../src/engine/defaults.js';
import { scoreOptions, isRequirementCompliant } from '../src/engine/scoring.js';
import { visibleFlags, isSiteFlag, flagFilters, withoutSiteFilters, defaultView } from '../src/engine/view.js';

// Re-score a copy of a run's options with or without their site-fit results.
function rescored(run, { stripSite, compliantFirst }) {
  const opts = run.options.map((o) => ({ ...o, siteFit: stripSite ? null : o.siteFit }));
  const inputs = normalizeInputs({ ...run.inputs, settings: { ...run.inputs.settings, rankCompliantFirst: compliantFirst } });
  scoreOptions(opts, inputs);
  return new Map(opts.map((o) => [o.id, { score: o.score, rank: o.rank, dominatedBy: o.dominatedBy }]));
}

export async function betaTests(test, ctxRuns) {
  await test('15. AC 27: the Site tab is a Beta feature: off by default; site fit never changes a score, a rank, "compliant first" or a dominance mark; with the tab off no site-fit status, flag or note is shown', async () => {
    const out = [];
    const reg = getRegistry();
    assert.equal(reg['view.siteTabBeta'].value, false, 'the Site tab must be off by default');
    out.push('switch off by default');

    // T2 (tight site) has options that do not fit (AC 7).
    const runT2 = ctxRuns.runT2 || (ctxRuns.runT2 = runModel(referenceT2({ analysisStart: ctxRuns.START })));
    const noFit = runT2.options.filter((o) => o.siteFit && o.siteFit.status === 'Does not fit');
    assert.ok(noFit.length > 0, 'T2 has no option that does not fit');
    const noFitMeets = noFit.filter((o) => o.resilience.status !== 'Does not meet');
    assert.ok(noFitMeets.length > 0);
    assert.ok(noFitMeets.every(isRequirementCompliant), 'an option that does not fit but meets resilience is not compliant');

    // Scores, ranks and dominance marks with and without site-fit results, "compliant first" off and on.
    for (const cf of [false, true]) {
      const a = rescored(runT2, { stripSite: false, compliantFirst: cf });
      const b = rescored(runT2, { stripSite: true, compliantFirst: cf });
      for (const [id, x] of a) {
        const y = b.get(id);
        assert.equal(x.score, y.score, `score of ${id} depends on site fit`);
        assert.equal(x.rank, y.rank, `rank of ${id} depends on site fit (compliant first ${cf ? 'on' : 'off'})`);
        assert.equal(x.dominatedBy, y.dominatedBy, `dominance of ${id} depends on site fit`);
      }
    }
    out.push(`T2: ${noFit.length} options do not fit; scores, ranks (compliant first off and on) and dominance marks identical with site fit removed`);

    // Site-fit flags are hidden from the main views when the tab is off, and never counted as permitting flags.
    const withSiteFlags = runT2.options.filter((o) => o.flags.some(isSiteFlag));
    assert.ok(withSiteFlags.length > 0);
    for (const o of withSiteFlags) {
      assert.ok(visibleFlags(o, false).every((f) => !isSiteFlag(f)));
      assert.equal(visibleFlags(o, true).length, o.flags.length);
      assert.ok(o.flags.filter(isSiteFlag).every((f) => !f.permitting), 'a site-fit flag counts as a permitting flag');
    }
    assert.ok(flagFilters(false).every(([id]) => !id.startsWith('site-') && id !== 'target-landtake'));
    const cleared = withoutSiteFilters({ ...defaultView(), siteFit: ['Does not fit'], landTakeCeilingHa: 3, flagIds: ['site-height', 'permit-ied'], hideFlagIds: ['site-noise'], sortKey: 'siteFit' });
    assert.deepEqual([cleared.siteFit, cleared.landTakeCeilingHa, cleared.flagIds, cleared.hideFlagIds, cleared.sortKey], [[], null, ['permit-ied'], [], 'rank']);
    out.push(`${withSiteFlags.length} options carry site-fit flags: hidden with the tab off, none counted as permitting; turning the tab off clears site-fit view filters`);

    // Rendered views: no site-fit content with the tab off; present with it on.
    const B = await ctxRuns.getViewBundle();
    const leader = runT2.options.find((o) => o.rank === 1);
    const o = noFit[0];
    const SITE = /Site fit|Does not fit|Fits with flags|site-note|options do not fit/;
    const offViews = { summary: B.renderSummary(runT2, false), trade: B.renderView(runT2, defaultView(), false), detail: B.renderOptionDetail(o, false) };
    const leftovers = Object.entries(offViews).filter(([, h]) => SITE.test(h.replace(/Site fit is a Beta feature[^<]*/g, '')));
    assert.deepEqual(leftovers.map(([k]) => k), [], 'site-fit content shown with the Site tab off');
    assert.match(offViews.summary, /Site fit is a Beta feature/);
    assert.match(B.renderSummary(runT2, true), /Site fit \(Beta\)/);
    assert.match(B.renderOptionDetail(o, true), /Site fit/);
    assert.match(B.renderView(runT2, defaultView(), true), /Shape: site fit \(Beta\)/);
    out.push(`views with the tab off show no site-fit status, flag or note (run summary, trade-offs, option detail of ${o.id}); with it on they do; leader ${leader.id} either way`);
    return out.join('; ') + '.';
  });
}
