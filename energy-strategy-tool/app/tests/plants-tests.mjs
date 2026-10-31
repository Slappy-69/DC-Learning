// 50. Work package 19: existing gas plants near the site from the bundled list (owner 2026-10-31, OPEN-QUESTIONS 116–123).

import assert from 'node:assert/strict';
import { buildDefaultInputs, normalizeInputs, plantCandidates, PLANT_DEFAULTS, TECH, CHOICES, defaultChoiceState } from '../src/engine/defaults.js';
import { PLANT_SOURCE, plantList, nearbyPlants, mergeDuplicates, parsePlantValue, isPlantPower, isTakeover } from '../src/engine/plants.js';
import { enumerate, generateOptions, countCombinations, canonical, isNA, RULES, choiceKey, NA, CHOICE_IDS } from '../src/engine/generator.js';
import { runModel } from '../src/engine/run.js';
import { buildContext, ctxFor } from '../src/engine/context.js';
import { evaluateOption } from '../src/engine/option.js';
import { permittingTriggers } from '../src/engine/permitting.js';
import { buildReport } from '../src/report/report.js';
import { addMonths, monthsBetween } from '../src/engine/dates.js';
import { studyFile, readStudyFile } from '../src/engine/study.js';

const EEM = { lat: 53.425, lon: 6.875 };
// A small campus at Eemshaven, so a full run stays quick: 100 MW IT in two phases, no grid before 2033.
export function eemSmall({ cap = 400, auto = true, edits = {} } = {}) {
  const inp = buildDefaultInputs({ analysisStart: '2027-01' });
  Object.assign(inp.project, { lat: EEM.lat, lon: EEM.lon, country: 'NL' });
  inp.site.areaHa = 20; inp.load.itMW = 100; inp.load.coolingApproach = 'evap';
  inp.load.phases = [{ itMW: 50, date: '2029-01' }, { itMW: 50, date: '2030-01' }];
  Object.assign(inp.grid, { nowMW: 0, fullMW: 130, fullDate: '2033-01' });
  inp.utilities.gasAvailable = 'Yes'; inp.utilities.gasDateMonths = 0;
  inp.settings.generationCap = cap;
  inp.plants = { auto, edits };
  return inp;
}

export async function plantTests(test) {
  await test('50a. Plant list (OPEN-QUESTIONS 116–117): the bundled powerplantmatching list, credited; gas plants of 50 MW or more within 10 km of the pin; entries close together, of one type and similar size merged, and kept apart on request', () => {
    const L = plantList();
    assert.equal(L.length, PLANT_SOURCE.count);
    assert.ok(L.length > 500, `${L.length} plants`);
    assert.match(PLANT_SOURCE.credit, /powerplantmatching.*CC BY 4\.0/);
    assert.ok(L.every((p) => p.mw >= 50 && Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.cc), 'a record outside the filter');
    const near = nearbyPlants(EEM.lat, EEM.lon, { radiusKm: 10, minMW: 50 });
    assert.deepEqual(near.map((p) => p.name).sort(), ['Eem', 'Eem', 'Eemshaven', 'Magnum Centrale']);
    assert.ok(near.every((p, i) => p.km <= 10 && (i === 0 || near[i - 1].km <= p.km)), 'not within 10 km, nearest first');
    assert.equal(nearbyPlants(52.29, -1.53).length, 0, 'the T1 reference pin has no plant within 10 km');
    // Merge rule on made-up entries: A and B (0.5 km apart, CCGT, 400 and 380 MW) merge; C (CCGT, 200 MW) and D (OCGT) do not.
    const mk = (id, mw, dLat, type = 'ccgt', sources = ['GEM']) => ({ id, name: id, mw, lat: 50 + dLat, lon: 5, type, sources, km: 1 + dLat });
    const m = mergeDuplicates([mk('A', 400, 0), mk('B', 380, 0.0045, 'ccgt', ['GEM', 'ENTSOE']), mk('C', 200, 0.002), mk('D', 400, 0.001, 'ocgt')]);
    assert.equal(m.length, 3);
    const ab = m.find((p) => p.id === 'B');
    assert.ok(ab && ab.mergedFrom.length === 1 && ab.mergedFrom[0].id === 'A', 'the entry from more source lists stands for the group');
    assert.equal(mergeDuplicates([mk('A', 400, 0), mk('B', 380, 0.0045)], { split: new Set(['A']) }).length, 2, 'split keeps them apart');
    return `${L.length} plants (${PLANT_SOURCE.credit}, ${PLANT_SOURCE.ref.slice(0, 7)}); Eemshaven: ${near.map((p) => `${p.name} ${Math.round(p.mw)} MW at ${p.km.toFixed(2)} km`).join(', ')}; merge rule checked on four made-up entries.`;
  });

  await test('50b. Candidates (OPEN-QUESTIONS 119–121): closure from the list, else 40 years after the first year; a closed plant offers its connection only; its connection from 12 months after it stops; list efficiency used only when plausible; corrections and leaving a plant out', () => {
    const I = normalizeInputs(eemSmall());
    const c = plantCandidates(I).plants;
    const by = Object.fromEntries(c.map((p) => [`${p.name}|${Math.round(p.mw)}`, p]));
    const eem = by['Eem|3210'], mag = by['Magnum Centrale|1311'], old = by['Eemshaven|1410'];
    assert.ok(eem && mag && old, Object.keys(by).join(', '));
    assert.equal(eem.closeYear, 2030); assert.equal(eem.basis.closeYear, 'list'); assert.equal(eem.status, 'closure dated');
    assert.equal(mag.closeYear, 2013 + PLANT_DEFAULTS.lifeYears); assert.equal(mag.basis.closeYear, 'default');
    assert.equal(old.status, 'closed'); assert.ok(!old.offersPower && old.offersTakeover, 'a closed plant offers its connection only');
    assert.equal(eem.takeoverM, monthsBetween('2027-01', '2030-01') + 12);
    assert.equal(old.takeoverM, 12, 'closed before the start: from 12 months after the start');
    assert.ok(!mag.offersTakeover, 'Magnum closes after the 20-year period');
    assert.equal(mag.eff, 0.58); assert.equal(mag.basis.eff, 'list');
    assert.equal(eem.basis.eff, 'type', `the list's ${0.32} is not plausible for a CCGT`);
    assert.equal(eem.units, Math.round(3210 / PLANT_DEFAULTS.unitMW.ccgt));
    const dC2 = defaultChoiceState('C2', I).values, dC4 = defaultChoiceState('C4', I).values, dC21 = defaultChoiceState('C21', I).values;
    for (const p of c.filter((x) => x.offersPower)) for (const v of [p.values.lease, p.values.buy]) assert.ok(dC2.includes(v) && dC4.includes(v), v);
    assert.deepEqual(dC21.filter((v) => v !== 'none').sort(), c.filter((x) => x.offersTakeover).map((x) => x.values.takeover).sort());
    // Corrections: a closure year entered; a plant left out; the list switched off.
    const I2 = normalizeInputs(eemSmall({ edits: { [mag.id]: { closeYear: 2035, unitMW: 300, units: 4 }, [old.id]: { include: false } } }));
    const c2 = plantCandidates(I2);
    const mag2 = c2.plants.find((p) => p.id === mag.id);
    assert.equal(mag2.closeYear, 2035); assert.equal(mag2.basis.closeYear, 'entered'); assert.ok(mag2.offersTakeover);
    assert.equal(mag2.unitMW, 300); assert.equal(mag2.units, 4);
    assert.ok(!c2.plants.some((p) => p.id === old.id) && c2.all.some((p) => p.id === old.id && !p.include), 'left out, still listed');
    assert.equal(plantCandidates(normalizeInputs(eemSmall({ auto: false }))).plants.length, 0);
    return `${c.length} plants: ${c.map((p) => `${p.name} ${Math.round(p.mw)} MW, ${p.status}, closes ${p.closeYear} (${p.basis.closeYear}), ${[p.offersPower ? 'power' : null, p.offersTakeover ? `connection from month ${p.takeoverM}` : null].filter(Boolean).join(' + ')}`).join('; ')}.`;
  });

  await test('50c. Generation (OPEN-QUESTIONS 118–119): the plant combinations reached from their base rows are exactly the valid product of every value (checked by brute force on a small space); option keys without a takeover unchanged; every plant gets its own share of the sample', () => {
    // Small space: most choices locked, so the full product can be enumerated by brute force.
    const inp = eemSmall();
    const lock = { C5: ['hvo', 'retained'], C5a: ['perBuilding'], C9: ['roof'], C10: ['none'], C11: ['none'], C12: ['none', 'shortfall'], C13: ['none'], C3: ['remove', 'backup', 'prime'] };
    for (const [id, vals] of Object.entries(lock)) inp.choices[id] = { state: 'open', values: vals };
    inp.choices.C2 = null; inp.choices.C4 = null; inp.choices.C21 = null;
    const I = normalizeInputs(inp);
    const en = enumerate(I);
    const fast = new Set([...en.valid.map(choiceKey), ...Array.from({ length: en.plant.count }, (_, j) => choiceKey(en.plant.get(j)))]);
    assert.equal(fast.size, en.valid.length + en.plant.count, 'a combination reached twice');
    // Brute force over the whole product (plant values included).
    const doms = CHOICE_IDS.map((id) => { const st = I.choices[id]; return st.state === 'locked' ? st.values.slice(0, 1) : st.values.slice(); });
    const brute = new Set();
    const cur = {};
    const rec = (i) => {
      if (i === CHOICE_IDS.length) { const v = canonical(cur); if (!RULES.some((r) => r.fails(v, I))) brute.add(choiceKey(v)); return; }
      const id = CHOICE_IDS[i];
      if (isNA(id, cur)) { cur[id] = NA; rec(i + 1); return; }
      for (const x of doms[i]) { cur[id] = x; rec(i + 1); }
    };
    rec(0);
    assert.equal(fast.size, brute.size, `${fast.size} reached, ${brute.size} by brute force`);
    for (const k of brute) assert.ok(fast.has(k), `missed ${k}`);
    const cc = countCombinations(I);
    assert.equal(cc.valid, brute.size);
    assert.equal(cc.plant, en.plant.count);
    // Keys without a takeover carry no C21, so studies without plants keep their option ids.
    assert.ok(en.valid.every((v) => !/C21=/.test(choiceKey(v))));
    // Full default space, sampled: each plant's share is equal (±1), and the plant options pass every rule.
    const I3 = normalizeInputs(eemSmall({ cap: 600 }));
    const g = generateOptions(I3);
    const share = g.summary.plantSampling;
    const drawn = Object.values(share).map((x) => x.drawn);
    assert.ok(Math.max(...drawn) - Math.min(...drawn) <= 1, JSON.stringify(share));
    const quota = Math.floor((600 - g.summary.archetypes) * PLANT_DEFAULTS.sampleShare);
    assert.ok(drawn.reduce((a, b) => a + b, 0) <= quota && drawn.reduce((a, b) => a + b, 0) >= quota - Object.keys(share).length - g.summary.archetypes, `${drawn} against ${quota}`);
    assert.equal(g.options.length, 600);
    assert.ok(g.options.every((o) => !RULES.some((r) => r.fails(o.v, I3))), 'an option breaks a rule');
    assert.equal(new Set(g.options.map((o) => o.key)).size, g.options.length);
    return `small space: ${en.valid.length} base + ${en.plant.count} plant combinations = brute force ${brute.size}; default space ${g.summary.totalCombinations.toLocaleString('en-GB')} combinations (${g.summary.plantCombinations.toLocaleString('en-GB')} with a plant), sample shares ${JSON.stringify(drawn)}.`;
  });

  await test('50d. Evaluation (OPEN-QUESTIONS 119–122): a bought plant (purchase and refurbishment for the units used, its own O&M, used until it stops, no replacement), a leased plant (lease until its closure), a taken-over grid connection (grid offered from 12 months after the plant stops, capped at the campus need; bridging hands over then; a capex line; a major flag); outside the campus combustion total; flags with the sources', () => {
    const I = normalizeInputs(eemSmall());
    const ctx = buildContext(I);
    const c = plantCandidates(I).plants;
    const eem = c.find((p) => Math.round(p.mw) === 3210), old = c.find((p) => p.status === 'closed' && Math.round(p.mw) === 1410);
    const base = { C1: 'bridge', C3: 'remove', C4: 'none', C4s: NA, C5: 'hvo', C5a: 'perBuilding', C6: 'N+1', C7: '48', C8: 'evap', C9: 'roof', C10: 'none', C11: 'none', C12: 'none', C12r: NA, C13: 'none', C14: NA, C15: 'none', C16: 'off', C17: 'AIS', C18: 'single', C19: 'perPhase', C20: 'none', C21: 'none' };
    const out = [];
    // Bought as bridging, kept as prime.
    const vb = canonical({ ...base, C2: eem.values.buy, C3: 'prime' });
    const ob = evaluateOption(ctx, vb, { skipLayout: true });
    const t = TECH[eem.values.buy];
    const units = ob.sz.bridge.units;
    assert.ok(units >= 1 && units < eem.units, `${units} of ${eem.units} units: only the units needed`);
    const line = ob.eco.capexLines.find((l) => l.item === `${t.name} (bridging)`);
    assert.ok(line && Math.abs(line.amount - units * eem.unitMW * 1000 * (eem.buyPerKW + eem.refurbPerKW)) < 1, 'purchase + refurbishment');
    assert.equal(ob.sz.bridge.endMonth, eem.closeM + PLANT_DEFAULTS.buyExtraYears * 12);
    // No replacement: its life runs to the month it stops, which is also its removal year in the ledger.
    assert.ok(t.p.life * 12 >= ob.sz.bridge.endMonth - ob.sz.bridge.availMonth, 'a bought plant is not replaced');
    const vg = evaluateOption(ctx, canonical({ ...vb, C2: 'gasRecip' }), { skipLayout: true });
    assert.ok(ob.eco.ledger.reduce((a, L) => a + L.replacement, 0) <= vg.eco.ledger.reduce((a, L) => a + L.replacement, 0) + 1, 'more replacement than with new recips');
    assert.ok(ob.flags.some((f) => f.id === 'plant-values') && ob.flags.some((f) => f.id === 'plant-ownership'), 'flags');
    assert.ok(ob.flags.some((f) => f.id === 'plant-closes'), 'closes within the period');
    assert.ok(!permittingTriggers(ob.sz, vb, I.requirements).combustion.some((x) => x.name === t.name), 'not in the campus combustion total');
    out.push(`bought ${units} × ${Math.round(eem.unitMW)} MW, €${(line.amount / 1e6).toFixed(0)} m, stops month ${ob.sz.bridge.endMonth}`);
    // Leased: the lease stops at the closure (no rental after 2030).
    const vl = canonical({ ...base, C2: eem.values.lease, C3: 'prime' });
    const ol = evaluateOption(ctx, vl, { skipLayout: true });
    assert.equal(ol.sz.bridge.endMonth, eem.closeM);
    const yClose = Math.floor(eem.closeM / 12);
    assert.ok(ol.eco.ledger.slice(yClose).every((L) => L.rental === 0) && ol.eco.ledger.slice(0, yClose).some((L) => L.rental > 0), 'lease months');
    out.push(`leased until month ${eem.closeM}`);
    // Takeover of the closed plant's connection, with new gas recips bridging.
    const vt = canonical({ ...base, C2: 'gasRecip', C21: old.values.takeover });
    const ct = ctxFor(ctx, vt);
    assert.ok(ct !== ctx && ct.takeover.month === 12);
    assert.ok(ct.takeover.mw <= old.takeoverMW && ct.takeover.mw > 0);
    assert.ok(ct.gridCap.every((x, m) => Math.abs(x - (ctx.gridCap[m] + (m >= 12 ? ct.takeover.mw : 0))) < 1e-9), 'grid offered');
    assert.ok(ct.fullGridM < ctx.fullGridM, `bridging hands over earlier: month ${ct.fullGridM} against ${ctx.fullGridM}`);
    const ot = evaluateOption(ctx, vt, { skipLayout: true });
    const tl = ot.eco.capexLines.find((l) => /^Grid connection charge \(taken over from/.test(l.item));
    assert.ok(tl && Math.abs(tl.amount - ct.takeover.mw * old.takeoverCostPerMW) < 1, 'takeover capex line');
    const fl = ot.flags.find((f) => f.id === 'plant-takeover');
    assert.ok(fl && fl.severity === 'major' && /not a confirmed right/.test(fl.message));
    assert.ok(ot.sz.grid.byMonth.every((x, m) => Math.abs(x - ct.gridCap[m]) < 1e-9 || x <= ct.gridCap[m]), 'sizing reads the option grid');
    assert.ok(!ot.sz.bridge || ot.sz.bridge.shortfallMonth < ct.fullGridM, 'bridging sized only up to the takeover');
    // The same option without the takeover: the run context is untouched.
    const o0 = evaluateOption(ctx, canonical({ ...vt, C21: 'none' }), { skipLayout: true });
    assert.ok(!o0.flags.some((f) => f.id === 'plant-takeover') && o0.eco.capex > 0);
    out.push(`takeover ${Math.round(ct.takeover.mw)} MW from month 12 (bridging to month ${ct.fullGridM} instead of ${ctx.fullGridM}), €${(tl.amount / 1e6).toFixed(1)} m`);
    // Power and connection from the same leased plant: it runs on until its connection is ready.
    const vs = canonical({ ...base, C2: eem.values.lease, C3: 'remove', C21: eem.values.takeover });
    const os = evaluateOption(ctx, vs, { skipLayout: true });
    assert.equal(os.sz.bridge.endMonth, eem.closeM + PLANT_DEFAULTS.takeoverLagMonths);
    assert.ok(os.flags.some((f) => f.id === 'plant-closes' && /keeps it running until then/.test(f.message)));
    out.push(`same plant: runs to month ${os.sz.bridge.endMonth}`);
    return out.join('; ') + '.';
  });

  await test('50e. Whole run and the PDF: plant options ranked with the new-build strategies; the run flag lists the plants and the sample shares; the PDF lists the plants with their sources and the credit; study without plants unchanged', () => {
    const run = runModel(eemSmall({ cap: 300 }));
    const withPlant = run.options.filter((o) => [o.v.C2, o.v.C4, o.v.C21].some((x) => parsePlantValue(x)));
    assert.ok(withPlant.length > 50 && withPlant.length < run.options.length, `${withPlant.length} of ${run.options.length}`);
    const rf = run.runFlags.find((f) => f.id === 'plants-found');
    assert.ok(rf && /Magnum Centrale/.test(rf.message) && /combinations screened/.test(rf.message));
    const rep = buildReport(run, {});
    const txt = Buffer.from(rep.bytes).toString('latin1');
    assert.ok(/Existing gas plants found near the site/.test(txt) && /powerplantmatching/.test(txt), 'PDF section');
    const off = runModel(eemSmall({ cap: 300, auto: false }));
    assert.ok(!off.options.some((o) => [o.v.C2, o.v.C4, o.v.C21].some((x) => parsePlantValue(x))));
    // Study file round trip keeps the corrections (keyed by list entry).
    const ed = eemSmall({ cap: 300, edits: { ppm4359: { closeYear: 2036, include: false } } });
    const back = readStudyFile(JSON.stringify(studyFile(ed, null)));
    assert.ok(back.ok, back.error);
    assert.deepEqual(back.inputs.plants.edits, { ppm4359: { closeYear: 2036, include: false } });
    const best = [...run.options].sort((a, b) => a.rank - b.rank)[0];
    return `${run.options.length} options, ${withPlant.length} with a plant; leader: ${best.name} (LCOE ${best.eco.lcoe.toFixed(1)}); PDF ${rep.pages} pages.`;
  });
}
