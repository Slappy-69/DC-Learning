// 17. Power adequacy first (owner's decisions of 2026-10-22, OPEN-QUESTIONS 37–41; build plan work package 3b, slice 1).
// An option is adequate only with no unmet load, no import above the grid capacity and no power gap against the
// design load (full contracted IT at design-day PUE plus ancillary) in any month; no tolerance. Adequate options rank
// above every option that is not; scores do not change; nothing is hidden. The run also reports the grid shortfall
// against the design load per cooling type (temporary before the full grid date, permanent from it on).

import assert from 'node:assert/strict';
import { scoreOptions, applyView, isAdequate } from '../src/engine/scoring.js';
import { defaultView } from '../src/engine/view.js';
import { designDemandByMonth } from '../src/engine/context.js';
import { inspectOption } from '../src/engine/inspect.js';
import { adequacyText } from '../src/engine/adequacy.js';

const EPS = 1e-6;

export async function adequacyTests(test, ctxRuns) {
  await test('17. Power adequacy first (OPEN-QUESTIONS 37–41): adequate = no unmet load, no import above grid capacity, no power gap against the design load; adequate options rank first, scores unchanged, none hidden; dominance needs equal or better adequacy; flag, run flag, longest event and the grid shortfall analysis', async () => {
    const out = [];
    for (const [label, run] of [['T1', ctxRuns.runT1], ['T3', ctxRuns.runT3]]) {
      const opts = run.options;
      // (a) Definition, and the flag on every option that is not adequate.
      for (const o of opts) {
        const a = o.adequacy;
        const exceed = o.dispatch.years.reduce((s, y) => s + (y.exceedMWh || 0), 0);
        const want = o.unmet.mwh <= EPS && exceed <= EPS && o.ttp.gapMWm <= EPS;
        assert.equal(a.adequate, want, `${label} ${o.id}: adequacy definition`);
        assert.equal(a.status, want ? 'Adequate' : 'Not adequate');
        assert.equal(o.flags.some((f) => f.id === 'adequacy-short' && f.severity === 'major'), !want, `${label} ${o.id}: adequacy flag`);
        assert.ok(a.longestH <= a.unmetHours && (a.unmetHours === 0 || a.longestH >= 1), `${label} ${o.id}: longest event`);
        if (!want) assert.match(adequacyText(a), /^Not adequate: /);
      }
      const nA = opts.filter(isAdequate).length;
      // (b) Ranking: every adequate option above every option that is not; score order within each group.
      const byRank = [...opts].sort((x, y) => x.rank - y.rank);
      const firstShort = byRank.findIndex((o) => !isAdequate(o));
      if (firstShort >= 0) assert.ok(byRank.slice(firstShort).every((o) => !isAdequate(o)), `${label}: an adequate option ranks below one that is not`);
      if (!run.inputs.settings.rankCompliantFirst) {
        for (let i = 1; i < byRank.length; i++) if (isAdequate(byRank[i]) === isAdequate(byRank[i - 1])) assert.ok(byRank[i].score <= byRank[i - 1].score + 1e-12, `${label}: score order within a group at rank ${i + 1}`);
      }
      // (c) Scores do not depend on adequacy: rescoring without it gives the same scores.
      const bare = opts.map((o) => { const { adequacy, rank, dominatedBy, ...rest } = o; return { ...rest }; });
      scoreOptions(bare, run.inputs);
      bare.forEach((b, i) => assert.ok(Math.abs(b.score - opts[i].score) < 1e-9, `${label} ${opts[i].id}: score changed by adequacy`));
      // (d) Dominance never by an option with worse adequacy.
      const byId = new Map(opts.map((o) => [o.id, o]));
      for (const o of opts) if (o.dominatedBy) assert.ok(isAdequate(byId.get(o.dominatedBy)) || !isAdequate(o), `${label} ${o.id}: dominated by a less adequate option`);
      // (e) Nothing hidden by default.
      assert.equal(applyView(opts, defaultView()).list.length, opts.length, `${label}: options hidden by default`);
      // (f) Run flag.
      const rf = run.runFlags.find((f) => f.category === 'Adequacy');
      assert.ok(rf && rf.id === (nA ? 'adequacy-count' : 'adequacy-none'), `${label}: adequacy run flag`);
      if (nA) assert.ok(rf.message.startsWith(`${nA.toLocaleString('en-GB')} of ${opts.length.toLocaleString('en-GB')} options`));
      // (g) Shortfall analysis, recomputed by hand from the design load and the grid capacity.
      const ctx = run.ctx;
      const coolings = [...new Set(opts.map((o) => o.v.C8))].sort();
      assert.deepEqual(run.shortfall.byCooling.map((c) => c.cooling), coolings, `${label}: shortfall cooling types`);
      const T = Math.min(ctx.fullGridM, ctx.nMonthsTimeline);
      for (const c of run.shortfall.byCooling) {
        const { arr, peakPUE } = designDemandByMonth(ctx, c.cooling);
        const per = peakPUE + run.inputs.load.ancillaryFrac;
        assert.ok(Math.abs(c.designMW - run.inputs.load.itMW * per) < 1e-9);
        let tPk = 0, pPk = 0, tN = 0, pN = 0;
        for (let m = 0; m < ctx.nMonthsTimeline; m++) {
          const s = Math.max(0, arr[m] - ctx.gridCap[m]);
          if (s <= EPS) continue;
          if (m < T) { tN++; tPk = Math.max(tPk, s); } else { pN++; pPk = Math.max(pPk, s); }
        }
        assert.ok(Math.abs(c.temporary.peakMW - tPk) < 1e-9 && c.temporary.months === tN, `${label} ${c.cooling}: temporary shortfall`);
        assert.ok(Math.abs(c.permanent.peakMW - pPk) < 1e-9 && c.permanent.months === pN, `${label} ${c.cooling}: permanent shortfall`);
        assert.ok(Math.abs(c.itSupportedMW * per - c.fullGridMW) < 1e-9, `${label} ${c.cooling}: IT supported`);
      }
      const sfTxt = run.shortfall.byCooling.map((c) => `${c.cooling} temp ${c.temporary.peakMW.toFixed(1)} MW/${c.temporary.months} mo, perm ${c.permanent.peakMW.toFixed(1)} MW, IT on full grid ${c.itSupportedMW.toFixed(1)} MW`).join('; ');
      out.push(`${label}: ${nA} of ${opts.length} adequate${firstShort >= 0 ? `, first not adequate at rank ${firstShort + 1}` : ''}; ${sfTxt}`);
    }
    // (h) Longest unmet event equals the longest run of hours with unmet load in the hourly records.
    const run = ctxRuns.runT1;
    const short = run.options.filter((o) => o.adequacy.unmetHours > 0).sort((a, b) => b.adequacy.unmetHours - a.adequacy.unmetHours)[0];
    if (short) {
      const I = inspectOption(run.inputs, short.v, { site: run.ctx.site });
      let longest = 0;
      for (const y of I.years) { let r = 0; for (let h = 0; h < y.hourly.unmet.length; h++) { if (y.hourly.unmet[h] > 0) { r++; if (r > longest) longest = r; } else r = 0; } }
      assert.equal(short.adequacy.longestH, longest, 'longest event against hourly records');
      assert.deepEqual(I.adequacy, short.adequacy, 'inspector adequacy');
      out.push(`longest event ${longest} h on ${short.id} matches the hourly records`);
    }
    return out.join('; ');
  });
}
