// 52. Work package 21 (owner 2026-11-02: "I want the app reports to look more like your reports … Everything really";
// OPEN-QUESTIONS 141–146): the PDF in the layout of Claude's study report: the answer first with four headline
// figures, numbered sections with charts, recommendations written by fixed rules, the inputs and tables in appendices;
// report details (question, prepared for and by) kept with the study.

import assert from 'node:assert/strict';
import { buildReport, gapSeries, REPORT_SECTIONS, monthName } from '../src/report/report.js';
import { PdfDoc, wrapRich, textWidth, pdfPageTexts, toWinAnsi, FONTS } from '../src/report/pdf.js';
import { recommendations, gapFacts, runnerUp, CLOSE_POINTS, CLOSE_LCOE } from '../src/engine/recommend.js';
import { referenceT1, normalizeInputs } from '../src/engine/defaults.js';
import { studyFile, readStudyFile } from '../src/engine/study.js';
import { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } from '../src/engine/sensitivity.js';
import { breakevens, nearestFlips } from '../src/engine/breakeven.js';
import { monteCarlo } from '../src/engine/montecarlo.js';
import { readEpw } from '../src/engine/weather.js';
import { fakeEpw } from './weather-tests.mjs';
import { perMWh, money, sig } from '../src/format.js';

const latin1 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return s; };
const flatOf = (pages) => pages.join(' ').replace(/\s+/g, ' ');

export async function reportDesignTests(test, ctxRuns) {
  await test('52. Work package 21: the report in the study layout: answer-first front page with four headline figures and "What decides it"; sections 1–8 each on a new page with figures 1–3; recommendations by fixed rules (leader, close runner-up, bridge, grid margin, major flags, defaults, tipping point, robust pick, weather, tests not run); appendices; report details kept with the study; rich text in Times; deterministic', () => {
    const out = [];
    const run = ctxRuns.runT1;
    const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
    const L = ranked[0];
    const created = new Date('2026-11-02T12:00:00Z');

    // (a) The writer: Times fonts declared, "**bold**" runs wrapped within the width, a rich line read back whole.
    const lines = wrapRich('**The answer.** The leading option is **#1 a very long option name** at **€158/MWh**, then more words to wrap. '.repeat(3), 300, 10);
    assert.ok(lines.length > 2 && lines.every((l) => l.reduce((a, s) => a + textWidth(s.enc, 10, s.f), 0) <= 300 + 1e-6), 'a rich line wider than the width');
    assert.ok(lines[0][0].f === 'F4' && lines[0][0].enc.startsWith('The answer.') && lines[0][1].f === 'F3', 'bold run');
    const d = new PdfDoc({ title: 't' });
    d.prose('**Bold lead.** Then plain text, **bold again**.'); d.tiles([{ big: '€158/MWh', caption: 'LCOE' }, { big: '0 months', caption: 'late' }]); d.list(['**One.** first', 'second'], { numbered: true });
    const db = d.bytes(), dt = pdfPageTexts(db)[0];
    assert.ok(dt.includes('Bold lead. Then plain text, bold again.') && dt.includes('\x80158/MWh') && dt.includes('1.') && dt.includes('One. first'), dt);
    for (const name of Object.values(FONTS)) assert.ok(latin1(db).includes(`/BaseFont /${name} `), `${name} not declared`);
    assert.equal(toWinAnsi('a → b'), 'a \x9b b');
    out.push(`writer: ${Object.keys(FONTS).length} standard fonts (Helvetica, Times), bold runs, tiles, numbered lists`);

    // (b) The gap series behind figure 1 matches the shortfall analysis.
    const gs = gapSeries(run), g = gapFacts(run);
    const ctx = run.ctx;
    for (let m = 0; m < ctx.nMonthsTimeline; m += 7) assert.ok(Math.abs(gs.design[m] - ctx.itInst[m] * gs.perMWIT) < 1e-9 && Math.abs(gs.grid[m] - ctx.gridCap[m]) < 1e-9, `month ${m}`);
    let gapMonths = 0;
    for (let m = 0; m < Math.min(g.fullGridMonth, ctx.nMonthsTimeline); m++) if (gs.design[m] - gs.grid[m] > 1e-6) gapMonths++;
    assert.equal(gapMonths, g.temporary.months, 'gap months');
    assert.ok(gs.m0 <= ctx.firstPhaseM && gs.m1 >= ctx.lastPhaseM, 'figure 1 window');

    // (c) The report with every test run and report details.
    const sens = tornado(run, L.id, { site: run.ctx.site, drivers: TORNADO_DRIVERS.filter((x) => DEFAULT_DRIVER_IDS.includes(x.id)) });
    const be = breakevens(run, { site: run.ctx.site });
    const mc = monteCarlo(run, { site: run.ctx.site, samples: 20, nOptions: 5 });
    const details = { question: 'Which options keep the programme through the grid delay?', preparedFor: 'Example client', preparedBy: 'Energy team' };
    const r = buildReport(run, { created, sensitivity: sens, breakevens: be, monteCarlo: mc, details, appVersion: 'test' });
    const pages = pdfPageTexts(r.bytes), all = flatOf(pages);
    assert.deepEqual(r.sections, REPORT_SECTIONS);
    const p0 = pages[0];
    for (const t of ['ENERGY STRATEGY SCREENING STUDY', toWinAnsi(details.question), 'Prepared for: Example client', 'Prepared by: Energy team', 'What decides it']) assert.ok(p0.includes(t), `front page lacks "${t}"`);
    assert.ok(flatOf([p0]).includes(toWinAnsi(`The leading option is #1 ${L.name}`)), 'the answer names the leader');
    // Work package 22: the front figures follow the study report (gap, bridging plant, against waiting, months late).
    const tiles = [g.temporary.months > 0 ? `${sig(g.temporary.peakMW, 3)} MW` : null, L.sizing.bridge && L.sizing.bridge.mw > 0 ? `${sig(L.sizing.bridge.mw, 3)} MW` : null, `${Math.round(L.ttp.delayFull || 0)} month${Math.round(L.ttp.delayFull || 0) === 1 ? '' : 's'}`].filter(Boolean);
    for (const t of tiles) assert.ok(p0.split('\n').includes(toWinAnsi(t)), `tile ${t} missing`);
    assert.ok(flatOf([p0]).includes(toWinAnsi(perMWh(L.eco.lcoe, 3))), 'the LCOE is not in the answer');
    const pageOf = (t) => pages.findIndex((p) => p.split('\n').includes(toWinAnsi(t)));
    const at = REPORT_SECTIONS.map(pageOf);
    assert.ok(at.every((x, i) => x >= 1 && (i === 0 || x >= at[i - 1])), `sections out of order: ${at.join(',')}`);
    for (let i = 0; i < 8; i++) assert.ok(at[i + 1] > at[i], `section ${i + 2} does not start a new page`);
    for (let n = 1; n <= 7; n++) assert.ok(all.includes(`Figure ${n}.`), `Figure ${n} missing`);
    assert.ok(all.includes("The leader's capex") && all.includes('Cost of each strategy over each evaluation period'));
    assert.ok(pages[at[7]].includes('1.') && all.includes(toWinAnsi('Written by fixed rules from this run')), 'recommendations');
    // Deterministic.
    assert.deepEqual(buildReport(run, { created, sensitivity: sens, breakevens: be, monteCarlo: mc, details, appVersion: 'test' }).bytes, r.bytes);
    out.push(`${r.pages} pages; front page, sections 1–9 on pages ${at.slice(0, 9).map((x) => x + 1).join(', ')}, appendices from page ${at[9] + 1}`);

    // (d) Without details: the default subtitle, no "Prepared for".
    const r0 = buildReport(run, { created });
    const q0 = pdfPageTexts(r0.bytes)[0];
    assert.ok(q0.includes(`Which energy strategy suits the ${normalizeInputs(run.inputs).load.itMW} MW campus`) && !q0.includes('Prepared for'), 'default subtitle');

    // (e) Recommendations by rule.
    const rec0 = recommendations(run), rec = recommendations(run, { sensitivity: sens, breakevens: be, monteCarlo: mc });
    const ids = (x) => x.items.map((i) => i.id);
    assert.deepEqual(recommendations(run), rec0, 'not deterministic');
    assert.equal(rec0.items[0].id, 'lead');
    assert.ok(rec0.items[0].text.startsWith(`**Take #1 forward: ${L.name}.**`));
    const R = runnerUp(ranked);
    const close = R && (L.score - R.score <= CLOSE_POINTS || Math.abs(R.eco.lcoe - L.eco.lcoe) / L.eco.lcoe <= CLOSE_LCOE);
    assert.equal(ids(rec0).includes('runner-up'), !!close, 'runner-up rule');
    assert.equal(ids(rec0).includes('bridge'), !!(L.sizing.bridge && L.sizing.bridge.mw > 0 && g.temporary.months > 0), 'bridge rule');
    assert.equal(ids(rec0).includes('grid-margin'), g.permanent.months > 0 || g.designMW / g.fullGridMW >= 0.95, 'grid-margin rule');
    assert.equal(ids(rec0).includes('flags'), L.flags.some((f) => f.severity === 'major' && !f.assumed && !f.siteFit), 'flags rule');
    assert.ok(ids(rec0).includes('defaults') && ids(rec0).includes('weather') && ids(rec0).includes('tests'));
    assert.ok(!ids(rec).includes('tests'), 'tests not run said after all three ran');
    assert.equal(ids(rec).includes('tipping'), nearestFlips(be, 2).length > 0);
    const lr = mc.rows.find((x) => x.id === mc.leaderId);
    assert.equal(ids(rec).includes('robust'), mc.robustPickId !== lr.id);
    // The defaults item lists the key inputs with the largest tornado swing first.
    const dRec = rec.items.find((x) => x.id === 'defaults').text;
    const top = sens.allRows.filter((x) => L.flags.some((f) => f.path === x.record && f.id.startsWith('assumed:'))).sort((a, b) => b.swing - a.swing)[0];
    if (top) assert.ok(dRec.indexOf(L.flags.find((f) => f.path === top.record).message.replace(/^Assumed /, '').split(':')[0].replace(/^[A-Z][a-z]/, (x) => x.toLowerCase())) > 0, dRec);
    // Measured weather: no weather item.
    const ew = readEpw(fakeEpw(), 'site.epw');
    const runE = { ...run, inputs: { ...run.inputs, weather: ew.weather } };
    assert.ok(!ids(recommendations(runE)).includes('weather'), 'weather item with an EPW file');
    // No adequate option: the first item says so and nothing is taken forward.
    const runX = { ...run, options: run.options.map((o) => (o.id === L.id ? { ...o, adequacy: { ...o.adequacy, adequate: false, status: 'Not adequate' }, unmet: { ...o.unmet, mwh: 1234 } } : o)) };
    assert.ok(recommendations(runX).items[0].text.startsWith('**Change the programme, the grid offer or the plant allowed: no option meets the power need in every hour.**'));
    out.push(`recommendations: ${ids(rec0).join(', ')} without the tests; ${ids(rec).join(', ')} with them`);

    // (f) Report details kept with the study; a damaged entry warns and is left out.
    const f = studyFile(run.inputs, run, { report: { ...details, extra: 'x', preparedBy: '  ' } });
    assert.deepEqual(f.notes.report, { question: details.question, preparedFor: details.preparedFor });
    const back = readStudyFile(JSON.stringify(f));
    assert.ok(back.ok && back.notes.report.question === details.question && !back.warnings.some((w) => /report details/.test(w)), back.warnings.join(' '));
    const bad = readStudyFile(JSON.stringify({ ...f, notes: { report: 'text' } }));
    assert.ok(bad.ok && !bad.notes.report && bad.warnings.some((w) => /report details in the file are damaged/.test(w)));
    assert.deepEqual(studyFile(run.inputs, null).notes, {}, 'notes without details or a summary edit');
    out.push(`details kept with the study; month names like "${monthName('2031-07')}"`);
    return out.join('; ') + '.';
  });
}
