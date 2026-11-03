// 53. Work package 22 (owner 2026-11-02, the report review: "Study-style front figures", "Plain-language flags",
// "Shorter appendices", more figures and recommendations; OPEN-QUESTIONS 147–152): front figures, flag headlines,
// plain input names, the cost build-up, energy mix and carbon by year, the programme timeline and the new
// recommendations (consents, fuel store, gas supply, backup, budgets).

import assert from 'node:assert/strict';
import { buildReport, costBuildUp, carbonByYear, REPORT_SECTIONS } from '../src/report/report.js';
import { flagHeadline, inputName, inputApplies, INPUT_NAMES } from '../src/report/plain.js';
import { pdfPageTexts, toWinAnsi } from '../src/report/pdf.js';
import { recommendations, gasNeed, hirePerYear } from '../src/engine/recommend.js';
import { normalizeInputs, referenceT1 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { inputRows } from '../src/report/report.js';

export async function reportReviewTests(test, ctxRuns) {
  await test('53. Work package 22: report review: study-style front figures; one plain line per flag (no screening caveats) with the full wording kept in Appendix F; plain input names and only the inputs that apply; the cost build-up adds up to the LCOE; carbon by year from the ledger; seven figures; recommendations on consents, the fuel store, the gas supply and the backup, with budgets', () => {
    const out = [];
    const run = ctxRuns.runT1, I = normalizeInputs(run.inputs), start = I.project.analysisStart;
    const ranked = run.options.slice().sort((a, b) => a.rank - b.rank), L = ranked[0];

    // (a) Flag headlines: every non-site flag of the top 50 options gets one short line without the caveats.
    let n = 0;
    for (const o of ranked.slice(0, 50)) for (const f of o.flags.filter((x) => !x.siteFit && !x.assumed)) {
      const h = flagHeadline(f, start);
      assert.ok(h && h.length <= 200 && !/EU threshold used as a proxy|Screening flag|month \d+/.test(h), `${f.id}: ${h}`);
      n++;
    }
    const ied = L.flags.find((f) => f.id === 'permit-ied');
    if (ied) assert.match(flagHeadline(ied, start), /^Needs an environmental permit under IED: [\d,.]+ MWth/);
    out.push(`${n} flags on the top 50 each in one plain line`);

    // (b) Plain names and inputs that apply.
    const rows = inputRows(run.inputs);
    const ap = rows.filter((r) => r.path === 'weather' || inputApplies(r.path, I));
    assert.ok(ap.length < rows.length && !ap.some((r) => /^load\.aiTrain|^load\.aiInf|^settings\.siteLayoutWorkLimit$/.test(r.path)), 'inputs that do not apply are listed');
    const unnamed = ap.filter((r) => !INPUT_NAMES[r.path]).map((r) => r.path);
    assert.ok(unnamed.length <= 3, `inputs without a plain name: ${unnamed.join(', ')}`);
    assert.equal(inputName('load.pueMax'), 'Maximum PUE (design day)');

    // (c) The cost build-up adds up to each option's LCOE (the same ledger), and carbon by year matches it.
    for (const o of ranked.slice(0, 20)) {
      const b = costBuildUp(o);
      assert.ok(Math.abs(b.total - o.eco.lcoe) <= 1e-9 * o.eco.lcoe, `#${o.rank}: ${b.total} against ${o.eco.lcoe}`);
      const c = carbonByYear(o), y = o.eco.ledger.find((x) => x.deliveredMWh > 0);
      assert.ok(Math.abs(c[0].g - ((y.scope1T + y.scope2LocT) * 1000) / y.deliveredMWh) < 1e-9);
    }
    const bl = costBuildUp(L).parts;
    out.push(`LCOE build-up adds up on the top 20 (leader: capex ${bl.capex.toFixed(1)}, grid ${bl.grid.toFixed(1)}, PPA ${bl.ppa.toFixed(1)}, fuel ${bl.fuel.toFixed(1)} €/MWh)`);

    // (d) Recommendations: consents from the permit outlook, gas from the plant that burns it, backup, budgets.
    const rec = recommendations(run), ids = rec.items.map((x) => x.id);
    const po = (L.sizing.permitOutlook || []).filter((p) => p.regimes && p.regimes.length);
    assert.equal(ids.includes('permits'), po.length > 0);
    assert.equal(ids.includes('gas'), gasNeed(L).length > 0);
    assert.equal(ids.includes('backup'), !!(L.sizing.backup && L.sizing.backup.mw > 0));
    assert.equal(ids.includes('fuel'), L.flags.some((f) => f.id === 'permit-seveso-fuel'));
    if (ids.includes('bridge') && L.sizing.bridge.tech === 'rented') assert.ok(rec.items.find((x) => x.id === 'bridge').text.includes('a year of hire') && hirePerYear(L) > 0);
    // An option that stores fuel above the threshold, put first, gets the fuel item with the hours that stay below it.
    const i2 = referenceT1({ analysisStart: ctxRuns.START }); i2.requirements.autonomyH = 72; i2.settings.generationCap = 60;
    const r2 = runModel(i2);
    const X = r2.options.find((o) => o.flags.some((f) => f.id === 'permit-seveso-fuel'));
    assert.ok(X, 'no option stores fuel above the threshold at 72 h');
    const L2 = r2.options.find((o) => o.rank === 1);
    const r2x = { ...r2, options: r2.options.map((o) => (o === X ? { ...o, rank: 1 } : o === L2 ? { ...o, rank: X.rank } : o)) };
    const it2 = recommendations(r2x).items.find((x) => x.id === 'fuel');
    assert.ok(it2 && /^\*\*Decide the standby fuel hours early\.\*\* 72 h of fuel is about [\d,.]+ t, above the [\d,.]+ t lower-tier .* (\d+) h \(about [\d,.]+ t\) stays below it\./.test(it2.text), it2 && it2.text);
    out.push(`recommendations: ${ids.join(', ')}; an option with 72 h of fuel gets "${it2.text.replace(/\*\*/g, '').slice(0, 120)}…"`);

    // (e) The PDF: nine sections, seven figures, plain flag lines in section 6, shorter appendices.
    const r = buildReport(run, { created: new Date('2026-11-02T12:00:00Z') });
    const pages = pdfPageTexts(r.bytes), all = pages.join(' ').replace(/\s+/g, ' ');
    assert.deepEqual(r.sections, REPORT_SECTIONS);
    for (let k = 1; k <= 6; k++) assert.ok(all.includes(`Figure ${k}.`), `Figure ${k}`);
    if (ied) assert.ok(all.includes(toWinAnsi(flagHeadline(ied, start))) && all.includes(toWinAnsi(ied.message.split('. ')[0])), 'headline in section 6 and full wording in Appendix F');
    assert.ok(!all.includes('load.aiInfPeakHour') && all.includes('Annual PUE'), 'appendix A input names');
    assert.ok(r.pages <= 30, `${r.pages} pages`);
    out.push(`${r.pages} pages without the tests run (was 32)`);
    return out.join('; ') + '.';
  });
}
