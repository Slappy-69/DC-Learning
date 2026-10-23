// 29. Work package 6: top-five cards, identical-result marks, trade-off defaults and the weight-change description
// (AC 24 cards and trade-off parts; OPEN-QUESTIONS 24, 29, 30, 35; KNOWN-ISSUES item 5).

import assert from 'node:assert/strict';
import { topCards, identicalResults, sameFigures, strategyKey, prosCons, describeWeightChange, CARD_METRICS, PRO_SHARE, CON_SHARE } from '../src/engine/cards.js';
import { defaultParetoAxes } from '../src/engine/pareto.js';
import { scoreOptions } from '../src/engine/scoring.js';
import { getRegistry } from '../src/engine/defaults.js';

export async function cardsTests(test, ctxRuns) {
  await test('29. Top five cards (OPEN-QUESTIONS 24): five distinct strategies in rank order, none identical to a better one; pros (best 10 %) and cons (worse half) against the whole run; identical results marked (KNOWN-ISSUES 5); trade-off defaults cost vertical, carbon horizontal, resilience encoding; weight change described', async () => {
    const out = [];
    const run = ctxRuns.runT1;
    const { cards, comparison, identical } = topCards(run.options);
    assert.equal(cards.length, 5);
    assert.ok(/against the 2,000 options in this run/.test(comparison));
    const keys = cards.map((c) => c.strategy);
    assert.equal(new Set(keys).size, 5, 'strategies repeat');
    // Each card is the best-ranked option of its strategy (excluding identical results), in rank order.
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (i) assert.ok(c.o.rank > cards[i - 1].o.rank);
      const better = run.options.filter((o) => strategyKey(o) === c.strategy && o.rank < c.o.rank && !identical.has(o.id));
      assert.equal(better.length, 0, `card ${i + 1} is not the best of its strategy`);
      assert.ok(!identical.has(c.o.id));
      // Any skipped higher-ranked option is either a repeated strategy or identical to a better one.
      for (const o of run.options.filter((x) => x.rank < c.o.rank)) assert.ok(keys.slice(0, i).includes(strategyKey(o)) || identical.has(o.id) || keys.includes(strategyKey(o)), `rank ${o.rank} skipped for no reason`);
      // Pros and cons by hand.
      for (const p of c.pros) { const m = CARD_METRICS.find((x) => x.id === p.id); const better = run.options.filter((o) => Number.isFinite(m.get(o)) && (m.higher ? m.get(o) > m.get(c.o) : m.get(o) < m.get(c.o))).length; assert.ok(better / run.options.filter((o) => Number.isFinite(m.get(o))).length <= PRO_SHARE + 1e-12); }
      for (const p of c.cons) assert.ok(p.share >= CON_SHARE);
      assert.ok(c.pros.length <= 3 && c.cons.length <= 3);
    }
    out.push(`cards: ${cards.map((c) => `#${c.o.rank}`).join(', ')}; ${identical.size} options marked "same results as"`);
    // Identical results: every marked option equals its better-ranked twin in every figure.
    for (const [id, twin] of identical) { const o = run.options.find((x) => x.id === id); assert.ok(sameFigures(o, twin) && twin.rank < o.rank); }
    // Trade-off defaults.
    const ax = defaultParetoAxes(run.inputs.settings);
    assert.deepEqual(ax, { x: 'location', y: 'lcoe' });
    assert.equal(getRegistry()['view.pareto.encoding'].value, 'resilience');
    out.push('trade-off default: carbon (location) across, LCOE up, resilience size and colour');
    // Weight change: carbon 25 → 45 %, the others scaled.
    const opts = run.options.map((o) => ({ ...o }));
    const w0 = { cost: 0.35, carbon: 0.25, ttp: 0.25, deliverability: 0.15 };
    const lead0 = [...opts].sort((a, b) => a.rank - b.rank)[0];
    const inp = { ...run.inputs, weights: { cost: 25.7, carbon: 45, ttp: 18.3, deliverability: 11 } };
    scoreOptions(opts, inp);
    const lead1 = [...opts].sort((a, b) => a.rank - b.rank)[0];
    const w1 = { cost: 0.257, carbon: 0.45, ttp: 0.183, deliverability: 0.11 };
    const msg = describeWeightChange(w0, w1, lead0, lead1, opts);
    assert.ok(/Carbon 25 → 45 %/.test(msg) && (lead0.id === lead1.id ? /unchanged/.test(msg) : /New leader/.test(msg)), msg);
    assert.equal(describeWeightChange(w0, w0, lead0, lead0, opts), null);
    out.push(msg);
    return out.join('; ');
  });
}
