// 83 onwards. Work package 41: correctness fixes from the numbers audit and the realism review of 2026-11-14
// (verification/numbers-audit-2026-11-14/AUDIT.md, "Tests that would have caught the A and B findings";
// verification/realism-review-2026-11-14/REALISM.md, root causes 6 and 7). Known issues 45 to 48, 51, 54 to 59, 73
// and 76. Known issues 49, 50, 52 and 53 wait for OPEN-QUESTIONS 285 to 288 and are not tested here.
// The suite pins the engine before the realism rebuild (tests/test-env.mjs), so the runs here switch it on.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { referenceT1, normalizeInputs, plantCandidates, plantTwin } from '../src/engine/defaults.js';
import { buildContext } from '../src/engine/context.js';
import { runModel } from '../src/engine/run.js';
import { generateOptions, enumerate } from '../src/engine/generator.js';
import { parsePlantValue, isPlantPower } from '../src/engine/plants.js';
import { evaluateOption } from '../src/engine/option.js';
import { plainSummary } from '../src/engine/summary.js';
import { carbonPathFactor } from '../src/engine/countryrules.js';
import { visibleFlags, isSiteFlag } from '../src/engine/view.js';
import { topCards } from '../src/engine/cards.js';
import { buildReport, againstNoBridge, rankingRuleText } from '../src/report/report.js';
import { pdfPageTexts, toWinAnsi } from '../src/report/pdf.js';
import { setDisplayCurrency, inDisplayCurrency, perMWh, sig } from '../src/format.js';
import { FX } from '../src/engine/index.js';
import { getViewBundle } from './view-bundle.mjs';
import { eemSmall } from './plants-tests.mjs';

const GBP = FX.GBP;
const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
// Every euro amount in a text shown in pounds sits in brackets after its pound figure.
const bareEuro = (t) => String(t).replace(/\(€[^)]*\)/g, '').match(/€\d[\d,.]*/g) || [];

function t1(START, cap = 400) {
  const i = referenceT1({ analysisStart: START });
  i.settings.realism = true;
  i.settings.generationCap = cap;
  for (const k of ['C3', 'C4', 'C5']) delete i.choices[k];
  return i;
}

export async function correctnessTests(test, ctxRuns) {
  const START = ctxRuns.START;
  let run = null;
  const getRun = () => (run || (run = runModel(t1(START))));

  await test('83. Work package 41, display currency (known issues 45, 46, 47; audit A4, B3, B4): shown in pounds, the options table\'s LCOE, the tornado\'s axis and the capex filter are in pounds, and every euro amount in a flag or run note has its pound figure first', async () => {
    const r = getRun();
    const V = await getViewBundle();
    const L = r.options.find((o) => o.rank === 1);
    const out = [];
    try {
      V.setDisplayCurrency('GBP', GBP);
      // A4: the table's LCOE cell is the pound figure of perMWh (the leader: about 176, not 210).
      const html = V.renderRankedList(r);
      const want = sig(L.eco.lcoe * GBP);
      assert.ok(html.includes(`>${want}</td>`), `table LCOE cell ${want} for the leader`);
      assert.ok(!html.includes(`>${sig(L.eco.lcoe)}</td>`) || sig(L.eco.lcoe) === want, 'the euro figure still shown');
      assert.match(html, /LCOE £\/MWh/);
      assert.match(html, /Capex at most \(£ m\)/, 'capex filter label in pounds');
      out.push(`leader LCOE in the table ${want} (euro ${sig(L.eco.lcoe)})`);
      // The tornado's axis: a base of €210/MWh is drawn about £176.
      const fake = { optionRank: 1, optionName: 'x', base: { lcoe: 210, npvCost: 400e6, score: 50 }, rows: [{ id: 'a', label: 'Driver', low: { lcoe: 200, npvCost: 380e6, text: 'low' }, high: { lcoe: 220, npvCost: 420e6, text: 'high' }, measureSwing: 20 }] };
      const ticks = (h) => [...h.matchAll(/class="tor-tick"[^>]*>([\d,.]+)</g)].map((m) => Number(m[1].replace(/,/g, '')));
      const tl = ticks(V.renderTornado(fake, 'lcoe'));
      assert.ok(tl.length && tl.every((t) => t > 160 && t < 190), `LCOE ticks in pounds: ${tl.join(', ')}`);
      const tn = ticks(V.renderTornado(fake, 'npv'));
      assert.ok(tn.length && tn.every((t) => t > 300 && t < 370), `NPV ticks in pounds (m): ${tn.join(', ')}`);
      out.push(`tornado ticks ${tl[0]}–${tl[tl.length - 1]} £/MWh around a €210 base`);
      // B4: the chip names the ceiling in pounds; the filter stores euro (the engine's currency).
      const chips = V.activeFilterChips({ ...{ resilience: [], siteFit: [], flagIds: [], hideFlagIds: [], dominated: 'all', archetypesOnly: false, landTakeCeilingHa: null }, capexCeiling: 128e6 / GBP });
      assert.ok(chips.some((c) => c.label === 'Capex ≤ £128 m'), chips.map((c) => c.label).join(' | '));
      assert.match(src('components/RankedList.jsx'), /const eur = \(x \* 1e6\) \/ rate;/);
      // B3: flags of the top 20 and the run notes, as the screens show them.
      let n = 0;
      for (const o of r.options.filter((x) => x.rank <= 20)) for (const f of o.flags) {
        const t = V.inDisplayCurrency(f.message);
        assert.deepEqual(bareEuro(t), [], `${f.id}: ${t}`);
        if (/€\d/.test(f.message)) n++;
      }
      for (const f of r.runFlags) assert.deepEqual(bareEuro(V.inDisplayCurrency(f.message)), [], f.message);
      out.push(`${n} flag texts with euro amounts on the top 20 each show pounds first`);
    } finally { V.setDisplayCurrency('EUR'); }
    assert.equal(inDisplayCurrency('€14.8 m'), '€14.8 m', 'in euro the text is unchanged');
    setDisplayCurrency('GBP', GBP);
    try {
      assert.equal(inDisplayCurrency('Capex €14.8 m; rate €26.35/MWh; fee €1,200 per MW; 8.77 €/kVA/yr; €0 charge'), `Capex £${sig(14.8 * GBP)} m (€14.8 m); rate £${sig(26.35 * GBP)}/MWh (€26.35/MWh); fee £${Math.round(1200 * GBP).toLocaleString('en-GB')} (€1,200) per MW; 8.77 €/kVA/yr; £0 charge`);
      // The PDF in pounds: the flag appendix and the main flags.
      const rep = buildReport(r, { created: new Date('2026-11-22T12:00:00Z') });
      const all = pdfPageTexts(rep.bytes).join(' ').replace(/\s+/g, ' ');
      const fApp = all.slice(all.indexOf('Every flag on the leader'));
      assert.deepEqual(bareEuro(fApp.slice(0, fApp.indexOf('Appendix G') > 0 ? fApp.indexOf('Appendix G') : undefined)).filter((x) => x !== '€0'), [], 'euro in the PDF flag appendix');
      out.push(`PDF flag appendix in pounds (${rep.pages} pages)`);
    } finally { setDisplayCurrency('EUR'); }
    return out.join('; ') + '.';
  });

  await test('84. Work package 41, flag counts (known issues 48, 54; audit B1, B2): with the Site tab off, Compare, the cards and the PDF comparison count the same flags as the options table; with it on, the Site flags come back', async () => {
    const r = getRun();
    const V = await getViewBundle();
    const top = r.options.filter((o) => o.rank <= 3);
    const withSite = top.filter((o) => o.flags.some(isSiteFlag));
    const cnt = (o, sb) => { const fl = visibleFlags(o, sb).filter((f) => !f.assumed); return ['major', 'minor', 'info'].map((s) => fl.filter((f) => f.severity === s).length).join(' · '); };
    const cmpOff = V.renderCompare(r, top.map((o) => o.id), false), cmpOn = V.renderCompare(r, top.map((o) => o.id), true);
    for (const o of top) {
      assert.ok(cmpOff.includes(`>${cnt(o, false)}<`), `Compare, Site off: #${o.rank} ${cnt(o, false)}`);
      assert.ok(cmpOn.includes(`>${cnt(o, true)}<`), `Compare, Site on: #${o.rank} ${cnt(o, true)}`);
    }
    const cardsOff = V.renderTopFive(r, false), cardsOn = V.renderTopFive(r, true);
    const siteHead = (o) => o.flags.filter((f) => isSiteFlag(f) && f.severity === 'major').map((f) => f.message.split(':')[0].split('.')[0]);
    const heads = [...new Set(topCards(r.options, 5).cards.flatMap((c) => siteHead(c.o)))];
    for (const h of heads) { assert.ok(!cardsOff.includes(`Main flags: ${h}`) && !cardsOff.includes(` · ${h}`), `card shows "${h}" with the Site tab off`); }
    if (heads.length) assert.ok(heads.some((h) => cardsOn.includes(h)), 'the Site flag comes back with the tab on');
    const rep = buildReport(r, { created: new Date('2026-11-22T12:00:00Z'), compareIds: top.map((o) => o.id) });
    const all = pdfPageTexts(rep.bytes).join(' ').replace(/\s+/g, ' ');
    const L = r.options.find((o) => o.rank === 1);
    const apD = all.slice(all.indexOf('Appendix D'));
    for (const o of top) assert.ok(apD.includes(toWinAnsi(cnt(o, false))), `PDF comparison counts ${cnt(o, false)} for #${o.rank}`);
    return `${top.length} options compared, ${withSite.length} with Site flags; leader ${cnt(L, false)} with the Site tab off and ${cnt(L, true)} with it on; card Site headlines left out: ${heads.join(', ') || 'none on this run'}.`;
  });

  await test('85. Work package 41, PDF and summary wording (known issues 51, 55, 56, 57, 58, 59; audit A3, B5 to B9): the reference is "no bridging plant" and the comparison is on building dates; each Appendix E row names its own year; the summary names the rank group; the ranking rule and score note follow the brief; the carbon help text uses the country\'s own path', async () => {
    const r = getRun();
    const L = r.options.find((o) => o.rank === 1);
    const ranked = r.options.slice().sort((a, b) => a.rank - b.rank);
    const W = ranked.find((o) => o.v.C1 === 'wait');
    const out = [];
    const rep = buildReport(r, { created: new Date('2026-11-22T12:00:00Z') });
    const all = pdfPageTexts(rep.bytes).join(' ').replace(/\s+/g, ' ');
    // A3 (known issue 51).
    assert.ok(!/Against waiting for the grid/.test(all), 'old reference name in the PDF');
    if (W && W !== L) {
      const c = againstNoBridge(L, W);
      assert.ok(c.dated, 'realism options carry building dates');
      assert.ok(all.includes(toWinAnsi(`the best option with no bridging plant (#${W.rank}`)), 'the reference named');
      assert.ok(!/reaches full load \d+ months? earlier/.test(all), '"reaches full load … earlier" in the PDF');
      if (c.same) assert.ok(all.includes('starts every building in the same month') && all.includes('Both start every building in the same month'), 'same dates said');
      assert.ok(Math.abs(c.dCap + c.dRun - c.d) <= 1e-6 * Math.max(1, Math.abs(c.d)), 'capex and running cost add up to the difference');
      out.push(`against #${W.rank}: ${c.same ? 'same building dates' : `${c.avgEarlier.toFixed(1)} months earlier on average`}, ${(c.d / 1e6).toFixed(1)} €m (capex ${(c.dCap / 1e6).toFixed(1)}, running ${(c.dRun / 1e6).toFixed(1)})`);
    }
    // B5 (known issue 55): each row its own year when the options were dispatched over different numbers of years.
    const eA = all.slice(all.indexOf('Last modelled year, steady state'), all.indexOf('First year with load'));
    const years = [...eA.matchAll(/model year (\d+), from/g)].map((m) => Number(m[1]));
    const cards = topCards(r.options, 5).cards;
    const nY = new Set(cards.map((c) => (c.o.dispatch && c.o.dispatch.years ? c.o.dispatch.years.length : 0)));
    if (nY.size > 1) assert.ok(years.length >= cards.length, `each row names its year: ${years.join(', ')}`);
    else assert.equal(years.length, 1, 'one year in the heading');
    out.push(`Appendix E: ${nY.size > 1 ? `${years.length} rows with their own year` : 'one year for all rows'}`);
    // B6 (known issue 56).
    const sm = plainSummary(r);
    const text = [sm.text, ...sm.parts.flatMap((p) => (p.more || []))].join(' ');
    assert.ok(!/best of the adequate options|other adequate options? scores? within/.test(text), 'the summary says "adequate options" for the rank group');
    assert.match(text, /rank group/);
    assert.ok(sm.details == null || !/best of the adequate options/.test(JSON.stringify(sm.details)));
    out.push('summary names the rank group');
    // B7 and B8 (known issues 57, 58).
    assert.ok(all.includes(toWinAnsi(rankingRuleText(r).slice(0, 60))) && !all.includes('the one exception agreed by the owner'), 'ranking rule in the PDF');
    assert.ok(/R1 to R4/.test(rankingRuleText(r)));
    assert.ok(all.includes('so the shown score can rise a little down the list'), 'score note in the method');
    assert.match(src('components/RankedList.jsx'), /a shown score can rise a little down the list/);
    const off = { ...r, scoring: { ...r.scoring, realism: false } };
    assert.match(rankingRuleText(off), /the one exception agreed by the owner/, 'before the rebuild the old rule stands');
    // B9 (known issue 59): UK at €75/t → €82.8, €167.7–167.8 and €252.7 in 2030, 2035 and 2040.
    const uk = [2030, 2035, 2040].map((y) => Math.round(75 * carbonPathFactor(y) * 10) / 10);
    assert.ok(Math.abs(uk[0] - 82.8) < 0.11 && Math.abs(uk[1] - 167.7) < 0.11 && Math.abs(uk[2] - 252.7) < 0.11, uk.join(', '));
    const ip = src('components/InputsPanel.jsx');
    assert.ok(!ip.includes('hint="Empty = the published forecast (OPEN-QUESTIONS 232): from today\'s price to the TYNDP 2026 values'), 'the fixed EU help text');
    assert.match(ip, /function carbonPathHint\(p0, country\)/);
    out.push(`UK carbon help: €${uk.join(', €')}/t`);
    return out.join('; ') + '.';
  });

  await test('86. Work package 41, one plant used once (known issue 73; realism review, root cause 6): with the realism rebuild on, no option uses a plant entered by hand and its twin in the bundled list as bridge and firm plant; rule R4 counts them; with the rebuild off they are still generated', () => {
    const eem = (realism, mod = null) => { const x = eemSmall({ cap: 300 }); x.settings.realism = realism; x.grid.fullMW = 60; if (mod) mod(x); return normalizeInputs(x); };
    const mag = plantCandidates(eem(true)).plants.find((c) => c.id === 'ppm4359');
    assert.ok(mag, 'Magnum Centrale in the list');
    const hand = (x) => { x.project.lat = mag.lat; x.project.lon = mag.lon; x.existing = { ...x.existing, include: true, name: 'Magnum by hand', type: 'ccgt', units: 3, unitMW: 430, availableDate: '2027-06', leasePerKWMonth: 6, linkCapex: 8e6 }; };
    const iOn = eem(true, hand), iOff = eem(false, hand);
    const tw = plantTwin(iOn);
    assert.ok(tw && tw.list.id === 'ppm4359' && tw.manual.id === 'manual', 'the twin is found');
    const twins = (v) => isPlantPower(v.C2) && isPlantPower(v.C4) && new Set([parsePlantValue(v.C2).id, parsePlantValue(v.C4).id]).size === 2 && [parsePlantValue(v.C2).id, parsePlantValue(v.C4).id].every((id) => id === tw.manual.id || id === tw.list.id);
    const every = (i) => { const e = enumerate(i); const vs = [...e.valid]; for (let j = 0; j < e.plant.count; j++) vs.push(e.plant.get(j)); return { e, vs }; };
    const on = every(iOn), off = every(iOff);
    const nOn = on.vs.filter(twins).length, nOff = off.vs.filter(twins).length;
    assert.equal(nOn, 0, `${nOn} options use the plant twice with the rebuild on`);
    assert.ok(on.e.removedByRule.R4 > 0, 'rule R4 counted');
    assert.equal(off.e.removedByRule.R4 || 0, 0, 'R4 does nothing with the rebuild off');
    assert.ok(nOff > 0, 'with the rebuild off (rule R4 off) the pair is still generated');
    // The run's options (sampled) hold none.
    const gOn = generateOptions({ ...iOn, settings: { ...iOn.settings, screenAllBelow: 1e7, sampleAboveCap: false, generationCap: 1e7 } });
    assert.equal(gOn.options.filter((o) => twins(o.v)).length, 0);
    return `twin found (Magnum Centrale by hand and ppm4359); ${on.e.removedByRule.R4.toLocaleString('en-GB')} combinations removed by R4 with the rebuild on; ${nOff.toLocaleString('en-GB')} twin pairs generated with it off; ${gOn.options.length.toLocaleString('en-GB')} options generated, none with the pair.`;
  });

  await test('87. Work package 41, temporary land (known issue 76; realism review, root cause 7): the share of a bridge that leaves when the grid arrives is not counted against the permanent site, the kept share is; a bridge kept whole stays on the site; when the two together exceed the net site while the bridge stands, an information flag says so and no land condition comes from it', () => {
    // Eemshaven, small: a split bridge keeps part of its units and releases the rest (on both test sites a bridge that
    // is removed whole is late and dropped, KI 50, so the split carries the test; C3 = Remove takes the same path).
    const mk = (mod = null) => { const x = eemSmall({ cap: 300, auto: false }); x.settings.realism = true; x.grid.fullMW = 60; if (mod) mod(x); return normalizeInputs(x); };
    const i = mk();
    const ctx = buildContext(i);
    const gen = generateOptions({ ...i, settings: { ...i.settings, screenAllBelow: 1e7, sampleAboveCap: false, generationCap: 1e7 } });
    const evalFirst = (f, ok, c = ctx) => { for (const g of gen.options.filter((x) => f(x.v)).slice(0, 60)) { const e = evaluateOption(c, g.v, { skipLayout: true }); if (ok(e)) return e; } assert.fail('an option of the kind the test needs'); };
    const sp = evalFirst((x) => x.C1 === 'bridge' && x.C2 === 'gasRecip' && x.C3 === 'split', (e) => e.sz.bridge && e.sz.bridge.mw > (e.sz.bridge.primeMW || 0) + 1e-9);
    const ar = sp.sz.area, b = sp.sz.bridge;
    const per = ar.temporaryM2 / (b.mw - b.primeMW);
    assert.ok(Math.abs(ar.parts.bridge - b.primeMW * per) < 1e-6 * ar.parts.bridge, 'kept share on the permanent site');
    assert.ok(ar.temporaryM2 > 0, 'the released share counted on its own');
    // A site small enough that the permanent plant fits but not with the bridge while it stands.
    const shrink = (ar.landTakeM2 + ar.temporaryM2 / 2) / ar.netM2;
    const i2 = mk((x) => { x.site.areaHa = i.site.areaHa * shrink; });
    const o2 = evaluateOption(buildContext(i2), sp.v, { skipLayout: true });
    const a2 = o2.sz.area;
    assert.ok(a2.landTakeM2 <= a2.netM2 && a2.landTakeM2 + a2.temporaryM2 > a2.netM2, `case: ${a2.landTakeM2} + ${a2.temporaryM2} against ${a2.netM2}`);
    assert.ok(o2.flags.some((f) => f.id === 'land-temporary' && f.severity === 'info'), 'temporary-land flag');
    assert.ok(!(o2.deliv.conditions || []).some((c) => c.id === 'land') && !(o2.deliv.unlikely || []).some((c) => c.id === 'land'), 'no land condition from the temporary share');
    // A bridge kept whole (T1, gas engines kept as backup) stays on the site.
    const iT = normalizeInputs(t1(START, 300)), cT = buildContext(iT);
    const gT = generateOptions({ ...iT, settings: { ...iT.settings, screenAllBelow: 1e7, sampleAboveCap: false, generationCap: 1e7 } });
    const kg = gT.options.find((x) => x.v.C1 === 'bridge' && x.v.C2 === 'gasRecip' && x.v.C3 === 'backup');
    const kept = evaluateOption(cT, kg.v, { skipLayout: true });
    assert.ok(kept.sz.area.parts.bridge > 0 && kept.sz.area.temporaryM2 === 0, 'a bridge kept as backup stays on the site');
    return `split bridge ${sig(b.mw, 3)} MW, ${sig(b.primeMW, 3)} kept: ${(ar.parts.bridge / 1e4).toFixed(2)} ha permanent, ${(ar.temporaryM2 / 1e4).toFixed(2)} ha temporary; on a ${(a2.netM2 / 1e4).toFixed(2)} ha net site the permanent ${(a2.landTakeM2 / 1e4).toFixed(2)} ha fits and the temporary share is an information flag; T1 bridge kept as backup: ${(kept.sz.area.parts.bridge / 1e4).toFixed(2)} ha permanent.`;
  });
}
