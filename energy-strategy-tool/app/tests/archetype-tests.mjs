// 41. Work package 14: archetypes and identical options (known issues 4 and 5; OPEN-QUESTIONS 84, 85, answered 2026-10-24
// with Claude's recommendations, accepted in advance by the owner).

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs, buildContext } from '../src/engine/index.js';
import { runModel } from '../src/engine/run.js';
import { identicalResults } from '../src/engine/cards.js';
import { shortfallAnalysis } from '../src/engine/adequacy.js';
import { COOLING_ID } from '../src/engine/defaults.js';
import { NA } from '../src/engine/generator.js';

export async function archetypeTests(test, ctxRuns) {
  await test('41. Archetypes and identical options (work package 14, known issues 4 and 5): the archetypes carry no cooling choice and size on the maximum PUE entered (work package 20); heat rejection location is generated once without rooftop solar (rule o); "Retain for grid services" is out of the default set (revenue off) and can be ticked; identical results fall from 37 to a handful', () => {
    const out = [];
    const run = ctxRuns.runT1;
    const inputs = normalizeInputs(run.inputs);
    // Work package 20: no cooling choice; the archetypes run on the entered PUE, whose design-day value is the maximum.
    const by = shortfallAnalysis(buildContext(inputs, { site: { noSiteModel: true } }), [COOLING_ID]).byCooling;
    const arch = run.options.filter((o) => o.archetype);
    assert.ok(arch.length >= 10 && arch.every((o) => !('C8' in o.v)), 'archetypes carry no cooling choice');
    assert.ok(Math.abs(by[0].peakPUE - inputs.load.pueMax) < 1e-12, `design-day PUE ${by[0].peakPUE} against the maximum entered ${inputs.load.pueMax}`);
    out.push(`T1: ${arch.length} archetypes, no cooling choice; design-day PUE ${by[0].peakPUE.toFixed(3)} = the maximum entered (design load ${by[0].designMW.toFixed(1)} MW); ${arch.filter((o) => o.adequacy.adequate).length} adequate`);
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
    // Work package 20: without the cooling choice the 2,000-option cap holds more C3 variants (retain as prime, split,
    // backup) that give the same results; 14 of 2,000 on T1 (was at most 10 with four cooling types).
    assert.ok(same.size <= 15, `${same.size} identical results`);
    out.push(`rule (o) removed ${run.rules.find((r) => r.id === 'o').removed.toLocaleString('en-GB')} combinations; grid services out of the default set with a note, generated when ticked; ${same.size} options with the same results as a better-ranked one (37 before)`);
    return out.join('; ') + '.';
  });
}
