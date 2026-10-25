// 43. Work package 16: the plain-English summary (BRIEF §14, AC 12; OPEN-QUESTIONS 12, answered 2026-10-24 with
// Claude's recommendation, accepted in advance by the owner: templates, deterministic, offline, editable as a note).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runModel } from '../src/engine/run.js';
import { normalizeInputs, referenceT1 } from '../src/engine/defaults.js';
import { scoreOptions } from '../src/engine/scoring.js';
import { plainSummary, weightChanges, wordCount, shortFlag, summaryKey, SUMMARY_WORD_LIMIT, DIRECTIVE_WORDS, SUMMARY_TITLE } from '../src/engine/summary.js';
import { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } from '../src/engine/sensitivity.js';
import { studyFile, readStudyFile } from '../src/engine/study.js';
import { buildReport } from '../src/report/report.js';
import { pdfPageTexts, toWinAnsi } from '../src/report/pdf.js';
import { GUARDRAIL, perMWh, money, sig } from '../src/format.js';

const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
// A copy of a run re-scored with other weights or scoring settings (what the app does on a weight change).
function rescored(run, { weights, settings } = {}) {
  const inputs = normalizeInputs(run.inputs);
  if (weights) inputs.weights = { ...weights };
  Object.assign(inputs.settings, settings || {});
  const r = { ...run, options: run.options.map((o) => ({ ...o })), inputs };
  r.scoring = scoreOptions(r.options, inputs);
  return r;
}
const leaderOf = (run) => run.options.find((o) => o.rank === 1);

export async function summaryTests(test, ctxRuns) {
  await test('43. Plain-English summary (work package 16, BRIEF §14, AC 12): seven parts in order, at most 250 words with the guardrail sentence last, no advice wording, "Summary" and never "Recommendation"; the figures it states are the run\'s; the weight change it names is exact; the tornado on the leader gives the ranges and the inputs with most influence; site fit only with the Site tab on; deterministic; the edit is kept as a note in the study file and the PDF', () => {
    const out = [];
    const run = ctxRuns.runT1;
    const L = leaderOf(run);
    const s = plainSummary(run);
    assert.equal(s.title, SUMMARY_TITLE);
    assert.equal(SUMMARY_TITLE, 'Summary');
    assert.deepEqual(s.parts.map((p) => p.id), ['leader', 'why', 'gives-up', 'confidence', 'change', 'flags', 'inputs']);
    assert.deepEqual(s.parts.map((p) => p.heading), ['Leading option', 'Why it leads', 'What it gives up', 'Confidence', 'What would change the answer', 'Open flags on the leader', 'Inputs with most influence']);
    assert.ok(s.words <= SUMMARY_WORD_LIMIT && SUMMARY_WORD_LIMIT === 250, `${s.words} words`);
    assert.equal(s.words, s.parts.reduce((a, p) => a + wordCount(p.text), 0) + wordCount(GUARDRAIL));
    assert.ok(s.text.endsWith(GUARDRAIL), 'the guardrail sentence is not last');
    assert.equal(DIRECTIVE_WORDS.exec(s.text), null, `directive wording: ${DIRECTIVE_WORDS.exec(s.text)}`);
    assert.ok(!/recommend/i.test(s.text) && /the option that leads under the current weights/i.test(s.text));
    assert.equal(JSON.stringify(plainSummary(run)), JSON.stringify(s), 'not deterministic');
    // Part 1: the leader and its figures, as the run has them.
    const p1 = s.parts[0].text;
    assert.ok(p1.includes(`#1, ${L.name}`) && p1.includes(`score of ${L.score.toFixed(1)}`));
    assert.ok(p1.includes('Monte Carlo ranges are not built yet') || s.details.leader.includes('These are single values: Monte Carlo ranges are not built yet.'));
    assert.ok(p1.includes(`LCOE ${perMWh(L.eco.lcoe)}`) && p1.includes(`capex ${money(L.eco.capex)}`) && p1.includes(`carbon ${sig(L.carbon.locationG)} g/kWh`), p1);
    // Part 2: the gap to #2 and the weighted axis differences are the run's numbers, and they add up to the gap.
    const R = run.options.find((o) => o.rank === 2);
    const w = run.scoring.weights;
    const contrib = Object.fromEntries(Object.keys(w).map((k) => [k, w[k] * (L.axisScores[k] - R.axisScores[k])]));
    assert.ok(near(Object.values(contrib).reduce((a, b) => a + b, 0), L.score - R.score, 1e-9), 'axis differences do not add up to the gap');
    assert.ok(s.parts[1].text.includes(`${(L.score - R.score).toFixed(2)} points ahead of #2`), s.parts[1].text);
    const top = Object.entries(contrib).sort((a, b) => b[1] - a[1])[0];
    assert.ok(s.parts[1].text.includes(`${top[1].toFixed(2)} points from`), 'largest axis difference not stated');
    // Every part above 0.005 points is named, with its sign, so the named parts add up to the gap (H5, M4).
    const named = Object.values(contrib).filter((c) => Math.abs(c) > 0.005);
    assert.ok(Math.abs(named.reduce((a, b) => a + b, 0) - (L.score - R.score)) <= 0.005 * 4, 'named parts do not add up to the gap');
    for (const c of named) assert.ok(s.parts[1].text.includes(`${Math.abs(c).toFixed(2)} points ${c > 0 ? 'from' : 'on'}`), `part ${c} not named`);
    // Part 4: the key inputs left at their defaults are the leader's assumed-default flags.
    const nAssumed = L.flags.filter((f) => f.assumed && f.path).length;
    assert.ok(s.parts[3].text.includes(`${nAssumed} key input`));
    // Part 5: every weight change listed is exact: at the weight named the new leader leads; one per cent short of it the
    // leader is unchanged (re-scored with the run's own scoring, ranges and adequacy grouping).
    const wc = weightChanges(run);
    assert.ok(wc.length >= 2, `${wc.length} weight changes`);
    for (const x of wc) {
      const at = (pctK) => {
        const t = x.dir === 'up' ? (pctK / 100 - w[x.axis]) / (1 - w[x.axis]) : 1 - pctK / 100 / w[x.axis];
        const nw = Object.fromEntries(Object.keys(w).map((k) => [k, 100 * (x.dir === 'up' ? (1 - t) * w[k] + (k === x.axis ? t : 0) : (k === x.axis ? (1 - t) * w[k] : w[k] * (1 + (t * w[x.axis]) / (1 - w[x.axis]))))]));
        return leaderOf(rescored(run, { weights: nw }));
      };
      assert.equal(at(x.toPct).id, x.newLeader.id, `${x.axis} ${x.dir} to ${x.toPct} %: leader ${at(x.toPct).id}, summary says ${x.newLeader.id}`);
      const before = x.dir === 'up' ? x.toPct - 1 : x.toPct + 1;
      if (Math.abs(before - w[x.axis] * 100) > 1e-9 && (x.dir === 'up' ? before > w[x.axis] * 100 : before < w[x.axis] * 100)) assert.equal(at(before).id, L.id, `${x.axis} at ${before} %: the leader already changed`);
    }
    assert.ok(s.parts[4].text.startsWith(`#${wc[0].newLeader.rank} would lead if the ${wc[0].axis === 'ttp' ? 'time-to-power' : wc[0].axis} weight ${wc[0].dir === 'up' ? 'rose' : 'fell'} from ${wc[0].fromPct} % to ${wc[0].toPct} %`), s.parts[4].text);
    out.push(`T1: ${s.words} words, leader #1 ${L.id} ${(L.score - R.score).toFixed(2)} points ahead of #2; ${wc.length} weight changes checked by re-scoring (nearest: ${wc[0].axis} ${wc[0].fromPct} → ${wc[0].toPct} %, then #${wc[0].newLeader.rank} leads)`);
    // Part 6: the leader's major permitting flag, and no site-fit flag while the Site tab is off.
    const ied = L.flags.find((f) => f.id === 'permit-ied');
    assert.ok(ied && s.parts[5].text.includes(shortFlag(ied.message)) && /a major flag/.test(s.parts[5].text));
    const withSite = { ...run, options: run.options.map((o) => (o === L ? { ...o, flags: [...o.flags, { id: 'site-test', severity: 'major', category: 'Site fit', message: 'Test site-fit flag on the leader.', siteFit: true }] } : o)) };
    assert.ok(!plainSummary(withSite).text.includes('Test site-fit flag'), 'site fit with the Site tab off');
    assert.ok(plainSummary(withSite, { siteBeta: true }).text.includes('test site-fit flag'), 'site fit missing with the Site tab on');
    // Part 7 and the ranges: from a tornado on the leader only.
    assert.ok(/tornado has not been run on #1/.test(s.parts[6].text));
    const tor = tornado(run, L.id, { site: run.ctx.site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
    const st = plainSummary(run, { sensitivity: tor });
    assert.ok(st.usedTornado && st.words <= SUMMARY_WORD_LIMIT, `${st.words} words with the tornado`);
    const lc = [tor.base.lcoe, ...tor.allRows.flatMap((r) => [r.low.lcoe, r.high.lcoe])];
    const [lo, hi] = [Math.min(...lc), Math.max(...lc)].map((x) => String(Math.round(x)));
    assert.ok(st.parts[0].text.includes(`its LCOE is €${lo} to €${hi}/MWh`), st.parts[0].text);
    const bySwing = tor.allRows.slice().sort((a, b) => Math.abs(b.high.lcoe - b.low.lcoe) - Math.abs(a.high.lcoe - a.low.lcoe));
    const first = bySwing[0].label.replace(/\s*\([^)]*\)$/, '').toLowerCase();
    assert.ok(st.parts[6].text.includes(`${first} (confidence C) moves LCOE by up to`), st.parts[6].text);
    const three = bySwing.slice(0, 3).map((r) => r.label.replace(/\s*\([^)]*\)$/, '').toLowerCase());
    assert.ok(three.every((x) => st.parts[6].text.toLowerCase().includes(x)), `three inputs: ${st.parts[6].text}`);
    const other = run.options.find((o) => o.rank === 3);
    const tor3 = { ...tor, optionId: other.id };
    assert.ok(/last tornado was run on #3, not on #1/.test(plainSummary(run, { sensitivity: tor3 }).parts[6].text));
    out.push(`with the tornado on #1: ${st.words} words, LCOE €${lo}–${hi}/MWh, most influence: ${three.join(', ')}`);
    // The word limit: optional sentences move to the detail, required ones stay.
    const tight = plainSummary(run, { sensitivity: tor, wordLimit: 150 });
    assert.ok(tight.moved.length > 0 && tight.moved.every((t) => Object.values(tight.details).some((d) => d.includes(t))));
    assert.ok(tight.parts.every((p) => p.text.length > 0) && tight.text.endsWith(GUARDRAIL));
    // Edge cases: #2 with the same figures; no adequate option; one option; the leader alone in its group.
    const twin = { ...L, id: `${L.id}-twin`, rank: 2, v: { ...L.v } };
    const runTwin = { ...run, options: [L, twin, ...run.options.filter((o) => o !== L).map((o) => ({ ...o, rank: o.rank + 1 }))] };
    const sTwin = plainSummary(runTwin);
    assert.ok(/#2 has the same figures, so their order is by option code only/.test(sTwin.parts[1].text) && sTwin.comparedWith === R.id);
    const none = { ...run, options: run.options.map((o) => ({ ...o, adequacy: { ...(o.adequacy || {}), adequate: false } })) };
    assert.ok(/No option serves the load in every hour/.test(plainSummary(none).parts[0].text));
    assert.ok(/It is the only option in the run/.test(plainSummary({ ...run, options: [L] }).parts[1].text));
    const alone = { ...run, options: run.options.map((o) => (o === L ? o : { ...o, adequacy: { ...(o.adequacy || {}), adequate: false } })) };
    const sAlone = plainSummary(alone);
    assert.ok(/^It is the only one of the adequate options, so nothing in its group does better; options that rank below it because they do not serve the load in every hour do better on deliverability \(#\d+/.test(sAlone.parts[2].text), sAlone.parts[2].text);
    // No key input left at its default (H5, L4).
    const plain = { ...run, options: run.options.map((o) => (o === L ? { ...o, flags: o.flags.filter((f) => !(f.assumed && f.path)) } : o)) };
    assert.ok(plainSummary(plain).parts[3].text.includes('No key input it uses is left at its default'));
    // Many major flags on the leader: the text still keeps to the limit (H5, M1), and the flags are in the detail.
    const longMsg = (i) => `Test major flag number ${i} with a long explanation that runs on, naming plant, thresholds, separations and other conditions in many words. Second sentence.`;
    const many = { ...run, options: run.options.map((o) => (o === L ? { ...o, flags: [...o.flags, ...['Permitting', 'Permitting', 'Fuel and utilities', 'Fuel and utilities', 'Grid', 'Technology', 'Adequacy'].map((c, i) => ({ id: `test-${i}`, severity: 'major', category: c, message: longMsg(i) }))] } : o)) };
    for (const opts of [{}, { sensitivity: tor }]) {
      const sm = plainSummary(many, opts);
      assert.ok(sm.words <= SUMMARY_WORD_LIMIT && !sm.overLimit, `${sm.words} words with seven more major flags`);
      assert.ok(sm.details.flags.some((t) => t.includes('Test major flag number 6')) && sm.parts.every((p) => p.text.length > 0));
    }
    assert.ok(/rank lower because they do not serve the load in every hour/.test(sAlone.parts[1].text) && /only one of the adequate options/.test(sAlone.parts[4].text), sAlone.parts[4].text);
    // Other settings: NPV cost, market carbon and compliant-first, and all weights at 0, re-scored as the app does.
    for (const variant of [{ settings: { costMetric: 'npv', carbonMetric: 'market', rankCompliantFirst: true } }, { weights: { cost: 0, carbon: 0, ttp: 0, deliverability: 0 } }, { weights: { cost: 100, carbon: 0, ttp: 0, deliverability: 0 } }, { weights: { cost: 20, carbon: 60, ttp: 10, deliverability: 10 }, settings: { carbonMetric: 'cfe' } }]) {
      const rv = rescored(run, variant);
      const sv = plainSummary(rv);
      assert.ok(sv.words <= SUMMARY_WORD_LIMIT && DIRECTIVE_WORDS.exec(sv.text) === null && sv.text.endsWith(GUARDRAIL), JSON.stringify(variant));
      // The figure is named as the run measures it (H5, M3, L1), and one option is not named twice in part 5 (L5).
      if (variant.settings && variant.settings.carbonMetric === 'cfe') assert.ok(!/On carbon it has [\d.]+ %/.test(sv.text) && !/carbon \([^)]*%/.test(sv.parts[1].text), sv.parts[2].text);
      if (variant.settings && variant.settings.carbonMetric === 'market') assert.ok(/market-based [\d.,]+ g\/kWh\)/.test(sv.parts[0].text), sv.parts[0].text);
      const ranks = [...sv.parts[4].text.matchAll(/#(\d+) would lead/g)].map((m) => m[1]);
      assert.equal(new Set(ranks).size, ranks.length, `the same option named twice: ${sv.parts[4].text}`);
      for (const x of weightChanges(rv).slice(0, 3)) assert.notEqual(x.newLeader.id, leaderOf(rv).id);
    }
    const sT3 = plainSummary(ctxRuns.runT3);
    assert.ok(sT3.words <= SUMMARY_WORD_LIMIT && DIRECTIVE_WORDS.exec(sT3.text) === null);
    out.push(`T3: ${sT3.words} words; NPV/market/compliant-first, equal and lowest-carbon weightings within the limit`);
    // The templates themselves carry no advice wording (the source is scanned, not only one run's text).
    const src = readFileSync(new URL('../src/engine/summary.js', import.meta.url), 'utf8');
    // Template literals are cut at each backtick and each "${", so code inside a placeholder is not read as wording.
    const code = src.split('\n').filter((l) => !/^\s*\/\//.test(l) && !/DIRECTIVE_WORDS =/.test(l)).join('\n');
    const pieces = [...code.matchAll(/'([^'\n]*)'/g)].map((m) => m[1]).concat(code.split('`').filter((_, i) => i % 2 === 1).map((t) => t.split('${')[0]));
    for (const t of pieces) assert.equal(DIRECTIVE_WORDS.exec(t), null, `template "${t.slice(0, 60)}" has advice wording`);
    assert.ok(!/\bfetch\(|XMLHttpRequest|https?:\/\//.test(src), 'the summary reaches the network');
    // The edit: kept in the study file and read back; a damaged note is dropped with a warning; printed in the PDF.
    // The key of the summary the PDF prints (with the tornado on the leader, the Site tab off).
    const note = { text: 'Our reading: the leader and #2 are close.\nThe grid date matters most.', key: summaryKey(run, { usedTornado: true }), leaderId: L.id, leaderName: L.name, editedAt: '2026-10-24T12:00:00Z', siteBeta: false };
    const inputs = referenceT1({ analysisStart: ctxRuns.START });
    const f = studyFile(inputs, run, { note });
    const back = readStudyFile(JSON.stringify(f));
    assert.ok(back.ok && back.notes.summary && back.notes.summary.text === note.text && back.notes.summary.key === note.key);
    const bad = JSON.parse(JSON.stringify(f)); bad.notes.summary = { text: 42 };
    const rb = readStudyFile(JSON.stringify(bad));
    assert.ok(rb.ok && !rb.notes.summary && rb.warnings.some((x) => /summary note in the file is damaged/.test(x)));
    assert.ok(readStudyFile(JSON.stringify({ ...f, notes: undefined })).ok, 'a study without notes (saved before work package 16) opens');
    for (const notes of ['a string', { summary: null }]) assert.ok(readStudyFile(JSON.stringify({ ...f, notes })).warnings.some((x) => /damaged/.test(x)), `no warning for notes ${JSON.stringify(notes)}`);
    assert.equal(readStudyFile(JSON.stringify(studyFile(inputs, run, { note: { ...note, siteBeta: true } }))).notes.summary.siteBeta, true);
    const created = new Date('2026-10-24T12:00:00Z');
    const rep = buildReport(run, { created, summaryNote: note, sensitivity: tor });
    const pages = pdfPageTexts(rep.bytes);
    assert.equal(rep.sections[0], 'Summary');
    const sp = pages.findIndex((p) => p.split('\n').includes('Summary'));
    assert.ok(sp === 1, `Summary on page ${sp + 1}`);
    const flat = pages.join(' ').replace(/\s+/g, ' ');
    assert.ok(flat.includes(toWinAnsi('Summary as edited by the engineer (edited)')) && flat.includes('Our reading: the leader and #2 are close.'));
    assert.ok(flat.includes(toWinAnsi(st.parts[3].text.split('. ')[0])), 'summary text not in the PDF');
    assert.ok(!flat.includes('Written for an earlier result'), 'a note for this result flagged as earlier');
    const stale = buildReport(run, { created, summaryNote: { ...note, key: 'older' } });
    assert.ok(pdfPageTexts(stale.bytes).join(' ').replace(/\s+/g, ' ').includes('Written for an earlier result'));
    // A note written with the Site tab (Beta) on is left out of the PDF (H5, H1), and the note key follows the Site tab.
    const siteNote = { ...note, text: 'Site fit: does not fit the site, 3 blocks outside the boundary.', siteBeta: true };
    const pdfSite = pdfPageTexts(buildReport(run, { created, summaryNote: siteNote, sensitivity: tor }).bytes).join(' ').replace(/\s+/g, ' ');
    assert.ok(!pdfSite.includes('does not fit the site') && pdfSite.includes('written with the Site tab (Beta) on, so it is left out of this report'));
    assert.notEqual(summaryKey(run, { siteBeta: true }), summaryKey(run));
    assert.notEqual(summaryKey(run, { usedBreakevens: true }), summaryKey(run));
    out.push(`edit kept in the study file and printed in the PDF (summary on page ${sp + 1}, "edited"; a note for an earlier result says so)`);
    return out.join('; ') + '.';
  });

  await test('44. Known issue 21: the "assumed default" flags are the same when the engine runs in a fresh process (as a pool worker does, without building the defaults first) as in this process: every registry-backed key input is flagged and every registry record is counted', () => {
    const inp = referenceT1({ analysisStart: ctxRuns.START });
    inp.settings.generationCap = 30;
    const here = leaderOf(runModel(inp));
    const want = { assumed: here.flags.filter((f) => f.assumed && f.path).map((f) => f.path), rec: here.flags.find((f) => f.id === 'assumed-records').message };
    const engine = fileURLToPath(new URL('../src/engine/run.js', import.meta.url));
    const code = `const { runModel } = await import(${JSON.stringify(`file://${engine}`)}); const r = runModel(JSON.parse(process.env.INPUTS_JSON)); const L = r.options.find((o) => o.rank === 1); console.log(JSON.stringify({ assumed: L.flags.filter((f) => f.assumed && f.path).map((f) => f.path), rec: L.flags.find((f) => f.id === 'assumed-records').message }));`;
    const got = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env: { ...process.env, INPUTS_JSON: JSON.stringify(inp) }, encoding: 'utf8', timeout: 120000 }).trim().split('\n').pop());
    assert.deepEqual(got.assumed, want.assumed);
    assert.equal(got.rec, want.rec);
    assert.ok(want.assumed.includes('economics.wacc') && want.assumed.length >= 10, `${want.assumed.length} assumed key inputs`);
    return `fresh process: ${got.assumed.length} assumed key inputs on the leader (as here, WACC among them); "${got.rec.slice(0, 80)}…"`;
  });
}
