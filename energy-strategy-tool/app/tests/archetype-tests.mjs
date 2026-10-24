// 41. Work package 14: archetypes and identical options (known issues 4 and 5; OPEN-QUESTIONS 84, 85, answered 2026-10-24
// with Claude's recommendations, accepted in advance by the owner).

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs, buildContext } from '../src/engine/index.js';
import { runModel } from '../src/engine/run.js';
import { identicalResults } from '../src/engine/cards.js';
import { shortfallAnalysis } from '../src/engine/adequacy.js';
import { COOLING } from '../src/engine/defaults.js';
import { NA } from '../src/engine/generator.js';

export async function archetypeTests(test, ctxRuns) {
  await test('41. Archetypes and identical options (work package 14, known issues 4 and 5): with cooling left open the archetypes take the open type with the lowest design load; with cooling set they take it; heat rejection location is generated once without rooftop solar (rule o); "Retain for grid services" is out of the default set (revenue off) and can be ticked; identical results fall from 37 to a handful', () => {
    const out = [];
    const run = ctxRuns.runT1;
    const inputs = normalizeInputs(run.inputs);
    const by = shortfallAnalysis(buildContext(inputs, { site: { noSiteModel: true } }), Object.keys(COOLING)).byCooling;
    const open = inputs.choices.C8.values;
    const lowest = by.filter((c) => open.includes(c.cooling)).sort((a, b) => a.designMW - b.designMW)[0].cooling;
    const arch = run.options.filter((o) => o.archetype);
    assert.ok(arch.length >= 10 && arch.every((o) => o.v.C8 === lowest), `archetypes ${[...new Set(arch.map((o) => o.v.C8))]} (lowest ${lowest})`);
    out.push(`T1 (cooling open): all ${arch.length} archetypes ${lowest} (lowest design load ${by.find((c) => c.cooling === lowest).designMW.toFixed(1)} MW; air ${by.find((c) => c.cooling === 'air').designMW.toFixed(1)} MW); ${arch.filter((o) => o.adequacy.adequate).length} adequate`);
    // Cooling set by the engineer: archetypes use it.
    const i2 = referenceT1({ analysisStart: ctxRuns.START });
    i2.load.coolingApproach = 'evap'; i2.settings.generationCap = 40;
    const r2 = runModel(i2);
    assert.ok(r2.options.filter((o) => o.archetype).every((o) => o.v.C8 === 'evap'));
    // Rule (o): no option without rooftop solar repeats another heat rejection location.
    const firstC9 = inputs.choices.C9.values[0];
    assert.ok(run.options.every((o) => o.v.C10 !== 'none' || o.v.C9 === firstC9 || o.v.C9 === NA));
    assert.ok(run.rules.some((r) => r.id === 'o' && r.removed > 0));
    // Grid services out of the default set, explained, and still available.
    assert.ok(!inputs.choices.C3.values.includes('gridServices') && !run.options.some((o) => o.v.C3 === 'gridServices'));
    const n3 = run.generation.valuesNotGenerated.find((x) => x.id === 'C3');
    assert.ok(n3 && /repeats Retain as backup/.test(n3.note));
    const i3 = referenceT1({ analysisStart: ctxRuns.START });
    i3.choices.C3 = { state: 'open', values: ['remove', 'backup', 'gridServices'] }; i3.settings.generationCap = 60;
    assert.ok(runModel(i3).options.some((o) => o.v.C3 === 'gridServices'));
    const same = identicalResults(run.options);
    assert.ok(same.size <= 10, `${same.size} identical results`);
    out.push(`cooling set to evaporative: archetypes evaporative; rule (o) removed ${run.rules.find((r) => r.id === 'o').removed.toLocaleString('en-GB')} combinations; grid services out of the default set with a note, generated when ticked; ${same.size} options with the same results as a better-ranked one (37 before)`);
    return out.join('; ') + '.';
  });
}
