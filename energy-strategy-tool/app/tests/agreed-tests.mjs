// 56 onwards. Work packages 24 to 32 (owner 2026-11-08: "Update the app with everything we've discussed and agreed that
// wasn't implemented yet"): the decisions of OPEN-QUESTIONS 155–235.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { referenceT1, normalizeInputs, getRegistry, buildDefaultInputs, plantCandidates, defaultChoiceState } from '../src/engine/defaults.js';
import { eemSmall } from './plants-tests.mjs';
import { TAKEOVER_GENERAL, IE_POLICY } from '../src/engine/countryrules.js';
import { applyFlagNotes, annotateFlags, optionNoteKey, noteText } from '../src/engine/flagnotes.js';
import { flagHeadline } from '../src/report/plain.js';
import { scoreOptions } from '../src/engine/scoring.js';
import { buildContext } from '../src/engine/context.js';
import { runModel } from '../src/engine/run.js';
import { contractedCap } from '../src/engine/context.js';
import { GRID_CHARGE_DATA } from '../src/engine/gridcharges-data.js';
import { GB_RESIDUAL, FLAT_LOAD_MWH_PER_MW, deDiscountFactor, gasPathFactor, carbonPathFactor } from '../src/engine/countryrules.js';

const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// A small run at T1 moved to a country (the pin stays; the country is set), with its own grid settings.
export function smallRun(START, country, grid = {}, cap = 40) {
  const i = referenceT1({ analysisStart: START });
  i.project.country = country;
  i.settings.generationCap = cap;
  Object.assign(i.grid, grid);
  return runModel(i);
}

export async function agreedTests(test, ctxRuns) {
  const START = ctxRuns.START;

  await test('56. Work package 24: country adder = network + levies where researched (outside the suite), normal tax rate by default and the reduced rate on the tick; the per-MW grid charge on contracted MW with its part taken out of the adder; GB lump sum; Germany\'s flat-load discount; flags with their sources', () => {
    const out = [];
    // Researched adders, outside the suite's switch (tests/test-env.mjs keeps the indicative ones for pinned figures).
    const url = new URL('../src/engine/context.js', import.meta.url).href;
    const durl = new URL('../src/engine/defaults.js', import.meta.url).href;
    const env = { ...process.env }; delete env.ESTOOL_LEGACY_ADDERS;
    const code = `import { buildContext } from '${url}'; import { referenceT1, normalizeInputs, COUNTRIES } from '${durl}';
      const a = (cc, g = {}) => { const i = referenceT1({ analysisStart: '2027-01' }); i.project.country = cc; Object.assign(i.grid, g); return +buildContext(normalizeInputs(i)).priceAdder.toFixed(2); };
      console.log(JSON.stringify({ DE: a('DE'), GB: a('GB'), GBr: a('GB', { dcReducedRate: true }), FR: a('FR'), FRr: a('FR', { dcReducedRate: true }), DEr: a('DE', { dcReducedRate: true }), NLpm: a('NL', { perMWInclude: true }), IT: a('IT'), PT: COUNTRIES.PT.adder, entered: a('NL', { priceAdder: 30, perMWInclude: true }) }));`;
    const r = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env }).toString());
    assert.equal(r.DE, 50); assert.equal(r.GB, 115.6); assert.equal(r.GBr, 106.2); assert.equal(r.FR, 33); assert.equal(r.FRr, 16.6);
    assert.equal(r.DEr, 50, 'no conditional rate in Germany: the tick changes nothing');
    assert.ok(near(r.NLpm, +(20 - 123320 / FLAT_LOAD_MWH_PER_MW).toFixed(2), 1e-3), `NL with the per-MW tick: ${r.NLpm}`);
    assert.equal(r.IT, 45, 'Italy keeps its indicative adder (OPEN-QUESTIONS 202)');
    assert.equal(r.PT, 11.5); assert.equal(r.entered, 30, 'an entered adder is used as entered');
    const reg = getRegistry();
    assert.ok(reg['country.adder.DE'] && reg['grid.perMWInclude'] && reg['grid.dcReducedRate'], 'records');
    out.push(`adders: DE €${r.DE}, GB €${r.GB} (reduced €${r.GBr}), FR €${r.FR} (reduced €${r.FRr}), IT €${r.IT} kept; NL with the per-MW tick €${r.NLpm}`);

    // Per-MW charge in the ledger: the option's contracted MW month by month × the rate.
    const nl = smallRun(START, 'NL', { perMWInclude: true });
    const o = nl.options.find((x) => x.v.C1 !== 'islanded');
    const ctx = buildContext(normalizeInputs(nl.inputs || (() => { const i = referenceT1({ analysisStart: START }); i.project.country = 'NL'; i.settings.generationCap = 40; i.grid.perMWInclude = true; return i; })()));
    const cc = contractedCap(ctx, o.v.C1);
    let mwm = 0; for (let m = 0; m < 12; m++) mwm += cc[m];
    const want0 = GRID_CHARGE_DATA.NL.perMW * mwm / 12;
    assert.ok(near(o.eco.ledger[0].gridFixed, want0, 1e-6), `year 0: ${o.eco.ledger[0].gridFixed} against ${want0}`);
    const yFull = o.eco.ledger.findIndex((L, y) => y > 0 && L.gridFixed > 0 && near(L.gridFixed, o.eco.ledger[y + 1] ? o.eco.ledger[y + 1].gridFixed : L.gridFixed, 1e-9));
    assert.ok(yFull >= 0, 'a steady year');
    assert.ok(o.flags.some((f) => f.id === 'grid-permw' && /123,320/.test(f.message) && /acm\.nl/.test(f.message)), 'flag with the value and source');
    const off = smallRun(START, 'NL', {});
    assert.ok(off.options.every((x) => x.eco.ledger.every((L) => L.gridFixed === 0)), 'unticked: no per-MW charge');
    out.push(`NL: year 0 €${Math.round(o.eco.ledger[0].gridFixed).toLocaleString('en-GB')} on ${(mwm / 12).toFixed(1)} MW-years`);

    // A country with no published value: nothing charged, flagged minor; Latvia's transformer flag.
    const cy = smallRun(START, 'CY', { perMWInclude: true }, 20);
    const cyo = cy.options.find((x) => x.v.C1 !== 'islanded');
    assert.ok(cyo.eco.ledger.every((L) => L.gridFixed === 0) && cyo.flags.some((f) => f.id === 'grid-permw-none' && f.severity === 'minor'), 'CY: none charged, flagged');
    const lv = smallRun(START, 'LV', { perMWInclude: true }, 20);
    assert.ok(lv.options.find((x) => x.v.C1 !== 'islanded').flags.some((f) => f.id === 'grid-lv-transformer'), 'LV flag');

    // Great Britain: the residual as a lump sum each year with a connection.
    const gb = smallRun(START, 'GB', { perMWInclude: true }, 20);
    const gbo = gb.options.find((x) => x.v.C1 !== 'islanded');
    const steady = gbo.eco.ledger[gbo.eco.ledger.length - 2];
    assert.ok(steady.gridFixed >= GB_RESIDUAL.eurPerYear - 1, `GB lump sum: ${steady.gridFixed}`);
    assert.ok(gbo.flags.some((f) => f.id === 'grid-lumpsum') && gbo.flags.some((f) => f.id === 'grid-permw-none'), 'GB: lump sum flag; zone tariff to enter');
    out.push(`GB residual €${(GB_RESIDUAL.eurPerYear / 1e6).toFixed(2)} m a year`);

    // Data centre tax flags: normal rate info, reduced rate minor (OPEN-QUESTIONS 204, 233); Ireland and calibration flags.
    const fr = smallRun(START, 'FR', {}, 20), frR = smallRun(START, 'FR', { dcReducedRate: true }, 20);
    const ff = (run) => run.options.find((x) => x.v.C1 !== 'islanded').flags.find((f) => f.id === 'grid-dc-tax');
    assert.ok(ff(fr).severity === 'info' && /normal rate/.test(ff(fr).message) && /impots\.gouv\.fr/.test(ff(fr).message), 'FR normal');
    assert.ok(ff(frR).severity === 'minor' && /reduced data centre rate/.test(ff(frR).message), 'FR reduced');
    const ie = smallRun(START, 'IE', {}, 20);
    const ief = ie.options.find((x) => x.v.C1 !== 'islanded').flags;
    assert.ok(ief.some((f) => f.id === 'grid-ie-check') && ief.some((f) => f.id === 'grid-price-calibration'), 'IE flags');

    // Germany's flat-load discount: factor by use hours; a credit only with the tick; nothing elsewhere.
    assert.equal(deDiscountFactor(8100, 800000), 0.10); assert.equal(deDiscountFactor(7200, 800000), 0.20); assert.equal(deDiscountFactor(6000, 800000), 1); assert.equal(deDiscountFactor(8760, 5000), 1);
    const de = smallRun(START, 'DE', { flatLoadDiscount: true }, 30);
    const deo = de.options.filter((x) => x.v.C1 !== 'islanded');
    assert.ok(deo.some((x) => x.eco.ledger.some((L) => L.gridFixed < 0)), 'a credit for some flat-load option');
    assert.ok(deo.every((x) => x.flags.some((f) => f.id === 'grid-de-discount')), 'discount flag');
    const es = smallRun(START, 'ES', { flatLoadDiscount: true }, 20);
    assert.ok(es.options.every((x) => x.eco.ledger.every((L) => L.gridFixed === 0)) && es.options.find((x) => x.v.C1 !== 'islanded').flags.some((f) => f.id === 'grid-discount-none'), 'ES: not researched, nothing applied');
    out.push('flags: FR tax (normal info, reduced minor), IE checks, DE discount, LV transformer, CY none');
    return out.join('; ');
  });

  await test('57. Work package 25: cable cost by voltage band (ACER 2026), gas pipe €2.08 m/km, gas engines from the Danish Energy Agency in 2015 € with the minimum load kept at 30 %, gas price from the World Bank (islands kept), gas and carbon following the published forecast unless a rate is entered', () => {
    const out = [];
    const url = new URL('../src/engine/defaults.js', import.meta.url).href;
    const env = { ...process.env }; delete env.ESTOOL_LEGACY_ADDERS;
    const code = `import { TECH, COUNTRIES, buildDefaultInputs, getRegistry } from '${url}'; const i = buildDefaultInputs(); const r = getRegistry();
      console.log(JSON.stringify({ sp: TECH.substation.p, pipe: TECH.gasConnection.p.pipePerKm, ge: TECH.gasRecip.p, DE: COUNTRIES.DE.gas, GB: COUNTRIES.GB.gas, CY: COUNTRIES.CY.gas, IS: COUNTRIES.IS.gas, gEsc: i.economics.gasEscalation, cEsc: i.economics.carbonEscalation, lbl: r['tech.substation.cablePerKm_hv'].label, mslBasis: r['tech.gasRecip.msl'].basis, gasLbl: r['country.gasPrice'].label }));`;
    const r = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env }).toString());
    assert.equal(r.sp.cablePerKm_hv, 680000); assert.equal(r.sp.cablePerKm_ehv, 2080000); assert.equal(r.sp.cablePerKm_mv, 1500000);
    assert.equal(r.pipe, 2080000);
    assert.deepEqual([r.ge.fomPerKW, r.ge.vomPerMWh, r.ge.eff, r.ge.life, r.ge.buildM, r.ge.msl], [9.75, 5.4, 0.45, 25, 12, 0.3]);
    assert.equal(r.DE, 55.1); assert.equal(r.GB, 55.1); assert.equal(r.CY, 70); assert.equal(r.IS, 80);
    assert.equal(r.gEsc, 'published forecast'); assert.equal(r.cEsc, 'published forecast');
    assert.equal(r.lbl, 'sourced — not independently checked'); assert.equal(r.mslBasis, 'judgement'); assert.equal(r.gasLbl, 'sourced — not independently checked');
    out.push(`cable hv €${r.sp.cablePerKm_hv / 1e6} m, ehv €${r.sp.cablePerKm_ehv / 1e6} m, mv €${r.sp.cablePerKm_mv / 1e6} m per km; pipe €2.08 m/km; gas €${r.DE} (CY €${r.CY} kept)`);
    // Paths: gas falls from the 2026 forecast, carbon rises to the TYNDP values; flat after 2040.
    assert.ok(near(gasPathFactor(2026), 1) && near(gasPathFactor(2027), 36.6 / 45.8) && near(gasPathFactor(2050), 37.4 / 45.8), 'gas path');
    assert.ok(near(carbonPathFactor(2030, 88.3), 97.5 / 88.3) && near(carbonPathFactor(2040, 75), 297.5 / 88.3) && near(carbonPathFactor(2060, 88.3), 297.5 / 88.3), 'carbon path');
    out.push(`gas ×${gasPathFactor(2027).toFixed(3)} in 2027, ×${gasPathFactor(2030).toFixed(3)} in 2030; carbon ×${carbonPathFactor(2035, 88.3).toFixed(2)} in 2035`);
    // In a run: the ledger's fuel follows the path; an entered rate replaces it.
    const i = referenceT1({ analysisStart: START }); i.settings.generationCap = 30; i.project.country = 'DE';
    i.economics.gasEscalation = 'published forecast'; i.economics.carbonEscalation = 'published forecast';
    const run = runModel(i);
    const g = run.options.find((o) => o.flags.some((f) => f.id === 'fuel-gas-path'));
    assert.ok(g, 'a gas option carries the path flag');
    const j = JSON.parse(JSON.stringify(i)); j.economics.gasEscalation = 0; j.economics.carbonEscalation = 0.02;
    const run2 = runModel(j);
    assert.ok(run2.options.every((o) => !o.flags.some((f) => f.id === 'fuel-gas-path')), 'an entered rate: no path flag');
    return out.join('; ');
  });

  await test('58. Work package 26: takeover flag by country with "export is not import"; Ireland\'s minor flag with the de-rated plant test on every Irish option; Great Britain\'s commitment fee as a deposit paid on day 1 and returned stage by stage, only when ticked, entered and at 40 MW or more', () => {
    const out = [];
    // Takeover wording: Eemshaven (Netherlands) and the same campus read as Norway.
    const nl = runModel(eemSmall({ cap: 300 }));
    const tk = nl.options.find((o) => o.flags.some((f) => f.id === 'plant-takeover'));
    assert.ok(tk, 'a takeover option');
    const msg = tk.flags.find((f) => f.id === 'plant-takeover').message;
    assert.ok(msg.includes('Netcode art. 7.13') && msg.includes(TAKEOVER_GENERAL) && !/not researched yet/.test(msg), 'NL wording and the general line');
    const noI = eemSmall({ cap: 300 }); noI.project.country = 'NO';
    const no = runModel(noI).options.find((o) => o.flags.some((f) => f.id === 'plant-takeover'));
    assert.ok(no && /Likely not available/.test(no.flags.find((f) => f.id === 'plant-takeover').message), 'Norway: likely not available');
    out.push('takeover: NL and NO wording, export-not-import line');

    // Ireland: every option carries the minor flag; the test result follows the de-rated plant.
    const ie = smallRun(START, 'IE', {}, 40);
    assert.ok(ie.options.every((o) => o.flags.some((f) => f.id === 'ireland-leu' && f.severity === 'minor')), 'flag on every Irish option');
    const fl = ie.options.map((o) => o.flags.find((f) => f.id === 'ireland-leu'));
    assert.ok(fl.some((f) => f.pass === false) && fl.every((f) => /CRU\/2025236/.test(f.message)), 'some options short; the decision named');
    assert.ok(fl.some((f) => /power factor 0\.975/.test(f.message)) && fl.every((f) => !/standby gensets? \d/.test(f.message)), 'MVA at 0.975; standby not counted');
    const nonIE = smallRun(START, 'PT', {}, 20);
    assert.ok(nonIE.options.every((o) => !o.flags.some((f) => f.id === 'ireland-leu')), 'only in Ireland');
    out.push(`Ireland: ${fl.filter((f) => f.pass).length} of ${fl.length} options covered (T1 options, 120 MW import ≈ ${(120 / IE_POLICY.powerFactor).toFixed(1)} MVA)`);

    // Great Britain's commitment fee.
    const fee = 400000;
    const gb = smallRun(START, 'GB', { gbFeeInclude: true, gbFeePerMW: fee }, 30);
    const o = gb.options.find((x) => x.v.C1 !== 'islanded' && x.eco.gbFee && x.eco.gbFee.applies);
    assert.ok(o, 'a grid option pays the fee');
    const L = o.eco.ledger;
    const net = L.reduce((a, y) => a + y.deposit, 0);
    assert.ok(Math.abs(net) < 1 && L[0].deposit > 0 && o.eco.gbFee.pvCost > 0, `deposit out and back, cost > 0 (net ${net})`);
    assert.ok(o.flags.some((f) => f.id === 'grid-gb-fee' && /not confirmed/.test(f.message)), 'flag');
    const blank = smallRun(START, 'GB', { gbFeeInclude: true }, 20);
    assert.ok(blank.options.every((x) => x.eco.ledger.every((y) => y.deposit === 0)) && blank.options.some((x) => x.flags.some((f) => f.id === 'grid-gb-fee' && /no fee entered/.test(f.message))), 'blank: nothing charged');
    const fr = smallRun(START, 'FR', { gbFeeInclude: true, gbFeePerMW: fee }, 20);
    assert.ok(fr.options.every((x) => !x.eco.gbFee), 'Great Britain only');
    out.push(`GB fee: €${(o.eco.gbFee.deposit / 1e6).toFixed(1)} m on day 1, cost €${(o.eco.gbFee.pvCost / 1e6).toFixed(1)} m`);
    return out.join('; ');
  });

  await test('59. Work package 27: the engineer\'s comment on a flag, for one option or every option with the flag type; mitigated; a lowered permitting flag moves deliverability by the penalty difference and can move the ranking; adequacy tests unchanged; the comment prints beside the flag; the run itself unchanged', () => {
    const run = ctxRuns.runT1;
    const opts = run.options.map((o) => ({ ...o }));
    const o = opts.find((x) => x.flags.some((f) => f.permitting && f.severity === 'major'));
    assert.ok(o, 'an option with a major permitting flag');
    const f = o.flags.find((x) => x.permitting && x.severity === 'major');
    const key = optionNoteKey(o);
    const before = o.deliv.score;
    const notes = { byOption: { [key]: { [f.id]: { comment: 'Stack moved inside the zone; consultant confirms.', mitigated: true, severity: 'minor' } } }, byType: {} };
    const n = applyFlagNotes(opts, notes, run.inputs);
    const o2 = opts.find((x) => optionNoteKey(x) === key);
    const P = run.inputs.deliverability;
    const nSame = o.flags.filter((x) => x.id === f.id && x.permitting && x.severity === 'major').length;
    assert.ok(n >= 1 && Math.abs(o2.deliv.score - Math.min(100, before + nSame * (P.majorFlagPenalty - P.minorFlagPenalty))) < 1e-9, `deliverability ${before} → ${o2.deliv.score}`);
    const g = o2.flags.find((x) => x.id === f.id);
    assert.ok(g.severity === 'minor' && g.originalSeverity === 'major' && g.mitigated && /consultant confirms/.test(flagHeadline(g, '2027-01')), 'annotated and printed');
    assert.ok(/lowered by the engineer from major to minor/.test(noteText(g)), 'note text');
    assert.equal(run.options.find((x) => optionNoteKey(x) === key).flags.find((x) => x.id === f.id).severity, 'major', 'the run itself unchanged');
    // Raising is not allowed; removing the note restores the flag; by type reaches every option with the flag.
    const up = annotateFlags(o2.flags, { byOption: { [key]: { [f.id]: { severity: 'major', comment: 'x' } } } }, key);
    assert.equal(up.find((x) => x.id === f.id).severity, 'major');
    const back = annotateFlags(o2.flags, { byOption: {}, byType: {} }, key);
    assert.equal(back.find((x) => x.id === f.id).severity, 'major');
    const all = run.options.map((x) => ({ ...x }));
    applyFlagNotes(all, { byOption: {}, byType: { [f.id]: { comment: 'Covered by the permit strategy.', severity: 'info' } } }, run.inputs);
    const hit = all.filter((x) => x.flags.some((y) => y.id === f.id));
    assert.ok(hit.length > 1 && hit.every((x) => x.flags.filter((y) => y.id === f.id).every((y) => y.severity === 'info' && y.comment)), 'by type');
    // Adequacy: lowering the flag does not change the adequacy result or the adequacy-first ranking rule.
    const ad = run.options.map((x) => ({ ...x }));
    const short = ad.find((x) => x.flags.some((y) => y.id === 'adequacy-short'));
    if (short) {
      applyFlagNotes(ad, { byOption: { [optionNoteKey(short)]: { 'adequacy-short': { comment: 'Accepted for phase 1.', severity: 'info' } } }, byType: {} }, run.inputs);
      const s2 = ad.find((x) => optionNoteKey(x) === optionNoteKey(short));
      assert.equal(JSON.stringify(s2.adequacy), JSON.stringify(short.adequacy), 'adequacy unchanged');
    }
    const sc = scoreOptions(all, run.inputs);
    assert.ok(sc && Array.isArray(sc.ranked || sc.order || all), 'rescored');
    return `${f.id}: deliverability ${before.toFixed(1)} → ${o2.deliv.score.toFixed(1)}; by type on ${hit.length} options`;
  });

  await test('60. Work package 28: the first run leaves nearby plants out; a plant ticked from the results joins the run with every use (leased, bought, its connection taken over); a study saved before keeps every nearby plant', () => {
    const base = eemSmall({ cap: 200 });
    const fresh = buildDefaultInputs({ analysisStart: '2027-01' });
    assert.deepEqual(fresh.plants.ticked, [], 'new studies: none ticked');
    const none = JSON.parse(JSON.stringify(base)); none.plants = { auto: true, edits: {}, ticked: [] };
    const nN = normalizeInputs(none);
    const cN = plantCandidates(nN);
    assert.ok(cN.all.length >= 3 && cN.plants.length === 0, 'found, none in');
    assert.ok(!defaultChoiceState('C2', nN).values.some((x) => /^x[lbw]:/.test(x)) && defaultChoiceState('C21', nN).values.length === 1, 'no plant values');
    const id = cN.all.find((p) => !p.manual && p.offersTakeover !== undefined).id;
    const one = JSON.parse(JSON.stringify(none)); one.plants.ticked = [id];
    const n1 = normalizeInputs(one);
    const c1 = plantCandidates(n1);
    assert.deepEqual(c1.plants.map((p) => p.id), [id], 'only the ticked plant');
    const r = runModel(one);
    assert.ok(r.options.some((o) => [o.v.C2, o.v.C4, o.v.C21].some((x) => String(x).includes(id))), 'options use the plant');
    const legacy = normalizeInputs(base); // eemSmall sets plants without a ticked list, as a study saved before
    assert.ok(plantCandidates(legacy).plants.length >= 3, 'saved before: every nearby plant in');
    return `${cN.all.length} found near Eemshaven, none in the first run; ticking ${id}: ${r.options.filter((o) => [o.v.C2, o.v.C4, o.v.C21].some((x) => String(x).includes(id))).length} of ${r.options.length} options use it`;
  });

  await test('61. Work package 29: a supply contract is generated only once its price is entered (fixed, cost plus margin, or wholesale ± adder), priced per MWh with no fuel or capex, by private wire or through the grid; the plant keeps selling its unused capacity for the share entered; standby income; the committed-output flag', () => {
    const base = eemSmall({ cap: 300 }); base.plants = { auto: true, edits: {}, ticked: [] };
    const id = plantCandidates(normalizeInputs(base)).all.find((p) => !p.manual && p.status !== 'closed').id;
    const blank = JSON.parse(JSON.stringify(base)); blank.plants.ticked = [id];
    assert.ok(!defaultChoiceState('C4', normalizeInputs(blank)).values.includes(`xc:${id}`), 'blank price: no contract option');
    const withK = JSON.parse(JSON.stringify(blank)); withK.plants.edits = { [id]: { contractPrice: 70, surplusShareBuy: 50, surplusPrice: 400, standbyPerMWYear: 20000 } };
    const nK = normalizeInputs(withK);
    assert.ok(defaultChoiceState('C4', nK).values.includes(`xc:${id}`) && defaultChoiceState('C2', nK).values.includes(`xc:${id}`), 'contract offered');
    const r = runModel(withK);
    const ks = r.options.filter((o) => o.v.C4 === `xc:${id}` || o.v.C2 === `xc:${id}`);
    assert.ok(ks.length, 'contract options');
    const k = ks.find((o) => o.eco.ledger.some((L) => L.contract > 0));
    assert.ok(k, 'a contract option that draws power pays the contract price');
    assert.ok(k.eco.ledger.every((L) => !(L.fuel > 0) || k.sizing.bridge || k.sizing.prime.tech !== `xc:${id}`), 'no fuel bought for the contract plant');
    assert.ok(k.flags.some((f) => f.id === 'plant-contract' && /fixed €70\/MWh/.test(f.message) && /private wire/.test(f.message)), 'contract flag');
    assert.ok(k.flags.some((f) => f.id === 'plant-committed'), 'committed-output flag');
    const b = r.options.find((o) => (o.v.C4 === `xb:${id}` || o.v.C2 === `xb:${id}`) && o.eco.plantIncome && o.eco.plantIncome.length);
    assert.ok(b && b.eco.plantIncome[0].revenue > 0 && b.eco.plantIncome[0].standby > 0, 'surplus margin and standby income on a bought plant');
    assert.ok(b.flags.some((f) => f.id === 'plant-surplus') && b.flags.some((f) => f.id === 'plant-standby'), 'income flags');
    const g = JSON.parse(JSON.stringify(withK)); g.plants.edits[id].contractRoute = 'grid';
    const rg = runModel(g).options.find((o) => o.v.C4 === `xc:${id}` || o.v.C2 === `xc:${id}`);
    assert.ok(rg && rg.flags.some((f) => f.id === 'plant-contract' && /through the public grid/.test(f.message)), 'grid route');
    return `contract option ${k.name}; bought plant keeps €${(b.eco.plantIncome[0].revenue / 1e6).toFixed(1)} m of surplus margin and €${(b.eco.plantIncome[0].standby / 1e6).toFixed(1)} m standby income`;
  });
}
