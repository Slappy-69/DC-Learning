// 45. Work package 17: the breakeven table (BRIEF §13.3; OPEN-QUESTIONS 93–97, answered 2026-10-24 with Claude's
// recommendations, accepted in advance by the owner).

import assert from 'node:assert/strict';
import { normalizeInputs } from '../src/engine/defaults.js';
import { buildContext } from '../src/engine/context.js';
import { evaluateOption } from '../src/engine/option.js';
import { axisMetrics, axisScore, SCORE_KEYS } from '../src/engine/scoring.js';
import { tornado, TORNADO_DRIVERS } from '../src/engine/sensitivity.js';
import { breakevens, breakevenCompetitors, nearestFlips, driverBase } from '../src/engine/breakeven.js';
import { sameFigures, topCards } from '../src/engine/cards.js';
import { buildReport } from '../src/report/report.js';
import { pdfPageTexts, toWinAnsi } from '../src/report/pdf.js';
import { plainSummary, SUMMARY_WORD_LIMIT, DIRECTIVE_WORDS } from '../src/engine/summary.js';
import { GUARDRAIL } from '../src/format.js';

export async function breakevenTests(test, ctxRuns) {
  await test('45. Breakeven table (work package 17, BRIEF §13.3): the leader against #2 and the best option of each other strategy, on the eight drivers that move its score most; every flip is checked by re-running both options on each side of it, every "no flip" at the ends of the range; deterministic; the run is not changed; in the PDF', () => {
    const out = [];
    const run = ctxRuns.runT1;
    const before = run.options.map((o) => `${o.id}:${o.rank}:${o.score}`).join('|');
    const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
    const L = byRank[0];
    // Competitors: #2 (it differs from #1 in T1), then the best of each other strategy, in rank order.
    const comps = breakevenCompetitors(run);
    assert.equal(comps.length, 5);
    assert.equal(comps[0].rank, 2);
    assert.ok(comps.every((o) => o !== L && !sameFigures(L, o)));
    const cardIds = topCards(run.options, 6).cards.map((c) => c.o.id);
    assert.ok(comps.slice(1).every((o) => cardIds.includes(o.id) || o.rank <= 6), 'a competitor that is neither #2 nor a top-five strategy');
    assert.deepEqual(comps.map((o) => o.rank), comps.map((o) => o.rank).slice().sort((a, b) => a - b));
    const t0 = Date.now();
    const be = breakevens(run, { site: run.ctx.site });
    const ms = Date.now() - t0;
    assert.deepEqual(be.competitors.map((c) => c.id), comps.map((o) => o.id));
    // Drivers: the eight with the largest weighted-score swing in the leader's tornado over all sixteen drivers.
    const tor = tornado(run, L.id, { site: run.ctx.site, drivers: TORNADO_DRIVERS });
    const top8 = tor.allRows.slice().sort((a, b) => b.swing - a.swing || (a.id < b.id ? -1 : 1)).slice(0, 8).map((r) => r.id);
    assert.deepEqual(be.rows.map((r) => r.id), top8);
    // Re-run both options at a driver value and compare them as the ranking does (adequacy, then the unclipped score).
    const inputs = normalizeInputs(run.inputs);
    const ctx0 = buildContext(normalizeInputs(inputs), { site: run.ctx.site });
    const w = run.scoring.weights, R = run.scoring.ranges;
    const line = (m) => SCORE_KEYS.reduce((a, k) => a + w[k] * axisScore(k, m[k], R[k].lo, R[k].hi), 0);
    const leaderAhead = (d, x, C) => {
      const inp = normalizeInputs(inputs);
      d.apply(inp, x, ctx0);
      const ctx = buildContext(inp, { site: run.ctx.site });
      const s = [L, C].map((o) => { const e = evaluateOption(ctx, o.v); return { a: e.adequacy.adequate ? 1 : 0, s: line(axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, inputs.settings)) }; });
      return s[0].a !== s[1].a ? s[0].a > s[1].a : s[0].s > s[1].s || (s[0].s === s[1].s && L.id < C.id);
    };
    let flips = 0, noFlips = 0;
    for (const r of be.rows) {
      const d = TORNADO_DRIVERS.find((x) => x.id === r.id);
      assert.equal(r.base, driverBase(d, inputs));
      const width = Math.abs(r.high - r.low);
      r.cells.forEach((cell, i) => {
        const C = comps[i];
        for (const side of ['down', 'up']) {
          const f = cell.flips[side];
          const end = side === 'down' ? r.low : r.high;
          if (f) {
            flips++;
            assert.ok(r.whole ? Math.abs(f.to - f.from) <= 1 : Math.abs(f.to - f.from) <= be.tolerance * width + 1e-9, `${r.id} vs #${C.rank}: bracket too wide`);
            assert.ok(leaderAhead(d, f.from, C), `${r.id} vs #${C.rank} ${side}: the leader is not ahead at ${f.from}`);
            assert.ok(!leaderAhead(d, f.to, C), `${r.id} vs #${C.rank} ${side}: #${C.rank} is not ahead at ${f.to}`);
            assert.ok((f.to - r.base) * (side === 'up' ? 1 : -1) > 0, 'flip on the wrong side');
          } else {
            noFlips++;
            if (end !== r.base) assert.ok(leaderAhead(d, end, C), `${r.id} vs #${C.rank}: "no flip" but #${C.rank} is ahead at ${end}`);
          }
        }
      });
    }
    out.push(`T1: ${be.competitors.map((c) => `#${c.rank}`).join(', ')} × ${be.rows.length} drivers (${be.rows.map((r) => r.id).join(', ')}), ${be.evaluations} re-runs in ${(ms / 1000).toFixed(1)} s; ${flips} flips each confirmed on both sides, ${noFlips} "no flip" confirmed at the range end`);
    const nf = nearestFlips(be, 2);
    if (nf.length) out.push(`nearest: ${nf.map((f) => f.text).join('; ')}`);
    assert.ok(nf.every((f) => /would lead/.test(f.text)));
    // The summary's part 5 names the two nearest flips once the table is run on the leader (OPEN-QUESTIONS 97), within the
    // word limit also with the tornado on the leader; without the table it says they have not been run.
    const torD = tornado(run, L.id, { site: run.ctx.site, drivers: TORNADO_DRIVERS.filter((d) => ['gas-price', 'grid-price', 'wacc', 'carbon-price', 'capex', 'capacity-factors', 'grid-date'].includes(d.id)) });
    for (const sens of [null, torD]) {
      const sm = plainSummary(run, { breakevens: be, sensitivity: sens });
      const p5 = sm.parts.find((p) => p.id === 'change').text;
      assert.ok(sm.usedBreakevens && sm.words <= SUMMARY_WORD_LIMIT && sm.text.endsWith(GUARDRAIL) && DIRECTIVE_WORDS.exec(sm.text) === null, `${sm.words} words`);
      if (nf.length) assert.ok(p5.includes(`Breakevens: ${nf.map((f) => f.text).join('; ')}.`), p5);
      assert.ok(!sm.notRun.includes('the breakevens'));
    }
    const sNo = plainSummary(run);
    assert.ok(sNo.notRun.includes('the breakevens') && !sNo.usedBreakevens);
    const other = { ...be, leaderId: 'not-the-leader' };
    assert.ok(!plainSummary(run, { breakevens: other }).usedBreakevens, 'breakevens of another leader used');
    out.push(`summary part 5: "${plainSummary(run, { breakevens: be }).parts.find((p) => p.id === 'change').text.slice(0, 160)}…"`);
    // Deterministic, and the run is unchanged.
    assert.equal(JSON.stringify(breakevens(run, { site: run.ctx.site })), JSON.stringify(be));
    assert.equal(run.options.map((o) => `${o.id}:${o.rank}:${o.score}`).join('|'), before, 'the run changed');
    // In the PDF's sensitivity section, and said to be missing when not run.
    const created = new Date('2026-10-24T12:00:00Z');
    const flat = (r) => pdfPageTexts(r.bytes).join(' ').replace(/\s+/g, ' ');
    const withBe = flat(buildReport(run, { created, breakevens: be }));
    assert.ok(withBe.includes('Breakevens') && be.competitors.every((c) => withBe.includes(`#${c.rank}`)));
    if (nf.length) assert.ok(withBe.includes(toWinAnsi(nf[0].text)), 'nearest flip not in the PDF');
    assert.ok(flat(buildReport(run, { created })).includes('The breakeven table was not run for this report'));
    out.push('in the PDF with the nearest flips; deterministic; the run unchanged');
    return out.join('; ') + '.';
  });
}
