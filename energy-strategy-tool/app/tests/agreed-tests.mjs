// 56 onwards. Work packages 24 to 32 (owner 2026-11-08: "Update the app with everything we've discussed and agreed that
// wasn't implemented yet"): the decisions of OPEN-QUESTIONS 155–235.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { referenceT1, normalizeInputs, getRegistry } from '../src/engine/defaults.js';
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
}
