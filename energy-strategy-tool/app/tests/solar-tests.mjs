// 16. Solar areas and removed choices (OPEN-QUESTIONS 52–54, 2026-10-22; BRIEF §5.2, §8 C7 and C10).
// Carport solar and "belly tanks only" are gone; C10 is None / Roof / Roof + ground. Roof PV is sized from the roof
// area for PV (blank = the rule: usable fraction of the free roof after roof plant); ground PV from the ground area
// for PV (default 0, so "Roof + ground" is generated only when an area is entered). Ground PV never depends on the
// layout or on the Site tab (Beta): the layout only places it, and a shortfall is flagged, not resized.

import assert from 'node:assert/strict';
import { runModel } from '../src/engine/run.js';
import { referenceT1, normalizeInputs, getRegistry, CHOICE_BY_ID, TECH } from '../src/engine/defaults.js';
import { buildContext } from '../src/engine/context.js';
import { sizeOption } from '../src/engine/sizing.js';
import { buildBlocks } from '../src/engine/blocks.js';
import { RULES, ARCHETYPES, generateOptions, valuesNotGenerated } from '../src/engine/generator.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

export async function solarTests(test, ctxRuns) {
  await test('16. Solar areas (OPEN-QUESTIONS 52–54): carport solar and "belly tanks only" removed; C10 None / Roof / Roof + ground; roof PV from the roof area for PV (blank = rule), ground PV from the ground area for PV (default 0); never resized by the layout; an over-large roof area is flagged, not reduced', async () => {
    const out = [];
    const { runT1, START } = ctxRuns;
    // (a) Removed values and records.
    assert.deepEqual(CHOICE_BY_ID.C10.values.map((x) => x[0]), ['none', 'roof', 'roofGround']);
    assert.ok(!CHOICE_BY_ID.C7.values.some((x) => x[0] === 'belly'), 'C7 still offers belly tanks');
    assert.equal(TECH.solarCarport, undefined, 'the carport technology record is still there');
    const reg = getRegistry();
    assert.ok(!reg['settings.fixedSolarMWp'] && !Object.keys(reg).some((k) => k.startsWith('tech.solarCarport') || k.endsWith('bellyHours')), 'a removed record is still in the registry');
    assert.equal(reg['site.pvRoofM2'].value, null); assert.equal(reg['site.pvGroundHa'].value, 0);
    assert.ok(reg['site.pvGroundHa'].label && reg['site.pvRoofM2'].label, 'the new records carry a label');
    out.push('C10 = None / Roof / Roof + ground; C7 without belly tanks; carport, fixed-MWp and belly-hours records gone; site.pvRoofM2 (null) and site.pvGroundHa (0) registered');

    // (b) Ground area 0 (T1 default): "Roof + ground" is not generated, the run summary says why, archetypes take Roof.
    assert.ok(RULES.some((r) => r.id === 'f'), 'rule (f) missing');
    assert.equal(runT1.options.filter((o) => o.v.C10 === 'roofGround').length, 0, 'Roof + ground generated with no ground area');
    assert.ok(runT1.options.every((o) => o.sizing.solarGroundMWp === 0));
    const vng = valuesNotGenerated(runT1.inputs).find((x) => x.id === 'C10');
    assert.ok(vng && vng.omitted.some((o) => o.value === 'roofGround' && o.reason === 'ground area for PV is 0') && /Enter a ground area for PV/.test(vng.note), 'no "values not generated" note for Roof + ground');
    for (const id of ['A3', 'A6', 'A7']) assert.equal(runT1.options.find((o) => o.archetype === id).v.C10, 'roof', `${id} with no ground area`);
    // Roof rule unchanged when the roof area is blank.
    const roofOpt = runT1.options.find((o) => o.v.C10 === 'roof');
    const s0 = roofOpt.sizing;
    assert.ok(s0.solarRoofMWp > 0 && s0.sentences.some((x) => /roof area for PV not entered: default rule/.test(x)));
    out.push(`T1 (no ground area): 0 Roof + ground options, run-summary note, A3/A6/A7 on Roof only; roof rule ${s0.solarRoofMWp.toFixed(2)} MWp on ${roofOpt.id}`);

    // (c) Ground area 3 ha: "Roof + ground" generated and sized 3 ÷ 1.2 = 2.5 MWp; block of the entered area.
    const inG = referenceT1({ analysisStart: START });
    inG.site.pvGroundHa = 3;
    const nG = normalizeInputs(inG);
    const gen = generateOptions(nG);
    assert.ok(gen.options.some((g) => g.v.C10 === 'roofGround'), 'Roof + ground not generated with a ground area');
    for (const id of ['A3', 'A6', 'A7']) assert.equal(gen.options.find((g) => g.archetype === id).v.C10, 'roofGround', `${id} with a ground area`);
    const ctxG = buildContext(nG);
    const vG = { ...roofOpt.v, C10: 'roofGround' };
    const sG = sizeOption(ctxG, vG);
    near(sG.solarGroundMWp, 3 / TECH.solarGround.p.haPerMWp, 1e-9, 'ground PV from the ground area');
    near(sG.area.parts.groundSolar, 30000, 1e-6, 'ground PV land take');
    near(sG.solarRoofMWp, s0.solarRoofMWp, 1e-9, 'roof PV unchanged by the ground area');
    const bG = buildBlocks(ctxG, vG, sG);
    assert.equal(bG.fill.mode, 'fixed'); near(bG.fill.targetM2, 30000, 1e-6, 'ground PV block = the entered area');
    // Not resized by the layout or the Site tab: a site too small for the area keeps the size (shortfall flagged).
    const inS = referenceT1({ analysisStart: START });
    inS.site.pvGroundHa = 40; inS.site.areaHa = 15; inS.settings.generationCap = 60;
    inS.choices = { ...(inS.choices || {}), C10: { state: 'locked', values: ['roofGround'] } };
    const runS = runModel(inS);
    const o40 = runS.options.find((o) => o.v.C10 === 'roofGround');
    near(o40.sizing.solarGroundMWp, 40 / TECH.solarGround.p.haPerMWp, 1e-9, 'ground PV resized by the layout');
    assert.equal(o40.siteFit.status, 'Does not fit', 'a ground PV shortfall should not fit');
    assert.ok(o40.siteFit.reasons.some((r) => /not placed/.test(r)) || o40.flags.some((f) => /ground PV \(ground area for PV\)/.test(f.message)), 'the ground PV shortfall is not named');
    out.push(`3 ha: Roof + ground generated, A3/A6/A7 take it, ${sG.solarGroundMWp.toFixed(2)} MWp, block 30,000 m²; 40 ha on 15 ha: ${o40.sizing.solarGroundMWp.toFixed(2)} MWp kept, ${o40.siteFit.status}`);

    // (d) Roof area entered: replaces the rule; above the free roof it is flagged, not reduced.
    const inR = referenceT1({ analysisStart: START });
    inR.site.pvRoofM2 = 10000;
    const ctxR = buildContext(normalizeInputs(inR));
    const sR = sizeOption(ctxR, roofOpt.v);
    near(sR.solarRoofMWp, 10000 / TECH.solarRoof.p.m2PerKWp / 1000, 1e-9, 'roof PV from the entered roof area');
    assert.equal(sR.roofPvOverFreeM2, 0);
    const inBig = referenceT1({ analysisStart: START });
    inBig.site.pvRoofM2 = 1e6; inBig.settings.generationCap = 40;
    inBig.choices = { ...(inBig.choices || {}), C10: { state: 'locked', values: ['roof'] } };
    const runBig = runModel(inBig);
    const ob = runBig.options.find((o) => o.v.C10 === 'roof');
    near(ob.sizing.solarRoofMWp, 1e6 / TECH.solarRoof.p.m2PerKWp / 1000, 1e-9, 'an over-large roof area was reduced');
    assert.ok(ob.sizing.roofPvOverFreeM2 > 0 && ob.flags.some((f) => f.id === 'solar-roof-area' && f.severity === 'minor'), 'no flag for a roof area above the free roof');
    out.push(`roof area 10,000 m² → ${sR.solarRoofMWp.toFixed(2)} MWp; 1,000,000 m² → ${ob.sizing.solarRoofMWp.toFixed(1)} MWp kept with a minor "solar-roof-area" flag`);
    return out.join('; ');
  });
}
