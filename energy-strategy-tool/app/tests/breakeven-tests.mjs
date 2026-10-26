// 45. Work package 17: the breakeven table (BRIEF §13.3; OPEN-QUESTIONS 93–97, answered 2026-10-24 with Claude's
// recommendations, accepted in advance by the owner).

import assert from 'node:assert/strict';
import { normalizeInputs, referenceT1 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
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
    // Check H6 (2026-10-26). (1) MED-4: with the default full-year run the base points are the run's own figures; with the
    // representative-day screening tier they are re-run over the full year, as every other point is.
    assert.equal(be.baseModel, 'run');
    assert.ok([L, ...comps].every((o) => Math.abs(be.baseLines[o.id] - line(o.metrics)) < 1e-9), 'base points differ from the run');
    const inpS = referenceT1({ analysisStart: ctxRuns.START });
    inpS.settings.screeningModel = 'repDays';
    const scr = runModel(inpS);
    const beS = breakevens(scr, { site: scr.ctx.site });
    assert.equal(beS.baseModel, 'full-year re-run');
    const inputsS = normalizeInputs(scr.inputs);
    const ctxS = buildContext(normalizeInputs(inputsS), { site: scr.ctx.site });
    const lineS = (m) => SCORE_KEYS.reduce((a, k) => a + scr.scoring.weights[k] * axisScore(k, m[k], scr.scoring.ranges[k].lo, scr.scoring.ranges[k].hi), 0);
    let stale = 0;
    for (const id of [beS.leaderId, ...beS.competitors.map((c) => c.id)]) {
      const o = scr.options.find((x) => x.id === id);
      const e = evaluateOption(ctxS, o.v);
      const full = lineS(axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, inputsS.settings));
      assert.ok(Math.abs(beS.baseLines[id] - full) < 1e-9, `#${o.rank}: base ${beS.baseLines[id]} against a full-year re-run ${full}`);
      stale = Math.max(stale, Math.abs(lineS(o.metrics) - full));
    }
    assert.ok(stale > 0.01, 'every option of the screening run was verified: the test would not show the difference');
    out.push(`screening run: base points re-run over the full year (the run's own figures for unverified options were up to ${stale.toFixed(3)} points off)`);
    // (2) LOW-2: a value entered outside the record's range widens the range used; the "higher" side then holds only higher values.
    const runW = { ...run, inputs: { ...run.inputs, economics: { ...run.inputs.economics, wacc: 0.13 } } };
    const beW = breakevens(runW, { site: run.ctx.site });
    const rowW = beW.rows.find((r) => r.id === 'wacc');
    assert.ok(rowW, 'WACC is not among the drivers');
    assert.ok(rowW.widened && Math.abs(rowW.high - 0.13) < 1e-12 && rowW.base === rowW.high && rowW.low < rowW.base, JSON.stringify([rowW.low, rowW.base, rowW.high]));
    assert.ok(rowW.cells.every((c) => c.flips.up === null), 'a flip above a value that is already at the top of the range used');
    assert.ok(be.rows.every((r) => !r.widened), 'a row widened in T1');
    const flatW = (r) => pdfPageTexts(r.bytes).join(' ').replace(/\s+/g, ' ');
    assert.ok(flatW(buildReport(runW, { created: new Date('2026-10-26T12:00:00Z'), breakevens: beW })).includes('widened to include the value entered'));
    out.push('a WACC of 13 % (record range 4–12 %) widens the range to 4–13 %, says so in the table and the PDF, and tests nothing above it');
    // (3) LOW-1 and LOW-9: no competitor to test against is said so; the summary's detail says the search is on a grid.
    const smNone = plainSummary(run, { breakevens: { ...be, competitors: [], rows: [] } });
    assert.ok(/no other option with different figures was available/.test(smNone.parts.find((p) => p.id === 'change').text), smNone.parts.find((p) => p.id === 'change').text);
    assert.ok(!/none of the 0/.test(smNone.text));
    assert.ok(plainSummary(run, { breakevens: be }).details.change.some((t) => /reverses again between two checked points/.test(t)), 'search caveat missing from the detail');
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
