// 30. Work package 10: the PDF report (AC 26; BRIEF §12.10; OPEN-QUESTIONS 32). One PDF, inputs first and results
// after; no Site tab content; made offline (no dependency, no network); a valid PDF that a reader can open.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildReport, inputRows, reportFileName, valueText, SITE_BETA_KEYS } from '../src/report/report.js';
import { PdfDoc, pdfPageTexts, toWinAnsi, textWidth, wrap } from '../src/report/pdf.js';
import { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } from '../src/engine/sensitivity.js';
import { topCards } from '../src/engine/cards.js';
import { getRegistry, LABEL } from '../src/engine/defaults.js';

const latin1 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return s; };

// Structural check of the PDF: header, every object's offset in the xref table, trailer, startxref and EOF.
export function checkPdfStructure(bytes) {
  const s = latin1(bytes);
  assert.ok(s.startsWith('%PDF-1.4\n'), 'PDF header');
  assert.ok(/%%EOF\n$/.test(s), 'EOF marker');
  const sx = Number(s.match(/startxref\n(\d+)\n%%EOF\n$/)[1]);
  assert.equal(s.slice(sx, sx + 4), 'xref', 'startxref does not point at the xref table');
  const m = s.slice(sx).match(/^xref\n0 (\d+)\n/);
  const n = Number(m[1]);
  const entries = s.slice(sx + m[0].length).split('\n').slice(1, n);
  entries.forEach((e, i) => {
    const off = Number(e.slice(0, 10));
    assert.equal(s.slice(off, off + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`, `xref entry ${i + 1} points at ${off}`);
  });
  // Each stream's /Length is its byte length.
  const re = /<< \/Length (\d+) >>\nstream\n/g;
  let k;
  while ((k = re.exec(s))) {
    const start = k.index + k[0].length;
    assert.equal(s.slice(start + Number(k[1]), start + Number(k[1]) + 10), '\nendstream', 'stream length');
  }
  return n - 1;
}

export async function reportTests(test, ctxRuns) {
  await test('30. PDF report (work package 10, AC 26; OPEN-QUESTIONS 32): one valid PDF, inputs first and results after (cover, inputs, assumptions, results, trade-offs, compare, dispatch, sensitivity, flags, method); every input listed as entered or default; the top five, the compared options and the tornado included; nothing from the Site tab; no network or dependency', async () => {
    const out = [];
    const run = ctxRuns.runT1;
    // Writer basics.
    assert.equal(toWinAnsi('€ – ≥ CO₂ × °'), '\x80 \x96 >= CO2 \xd7 \xb0');
    assert.equal(textWidth('Hello', 10), (722 + 556 + 222 + 222 + 556) / 100);
    for (const l of wrap('word '.repeat(60), 200, 10)) assert.ok(textWidth(l, 10) <= 200 + 1e-9);
    assert.equal(valueText(20261015), '20261015');
    // Report.
    const lead = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
    const sens = tornado(run, lead.id, { site: run.ctx.site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
    const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
    const cmp = [ranked[0].id, ranked[3].id];
    const created = new Date('2026-10-23T12:00:00Z');
    const t0 = Date.now();
    const r = buildReport(run, { compareIds: cmp, sensitivity: sens, created, appVersion: 'test' });
    const ms = Date.now() - t0;
    const nObj = checkPdfStructure(r.bytes);
    assert.deepEqual(r.sections, ['Summary', '1. Inputs', '2. Assumptions', '3. Results', '4. Trade-offs', '5. Compare', '6. Dispatch: energy balance', '7. Sensitivity', '8. Flags', '9. Method']);
    const pages = pdfPageTexts(r.bytes);
    assert.equal(pages.length, r.pages);
    const all = pages.join('\n');
    // Inputs first, results after: the page of each section heading increases.
    const pageOf = (t) => pages.findIndex((p) => p.split('\n').includes(t));
    const order = r.sections.map(pageOf);
    for (let i = 0; i < order.length; i++) assert.ok(order[i] >= 1 && (i === 0 || order[i] >= order[i - 1]), `section ${r.sections[i]} out of order (${order.join(',')})`);
    assert.ok(pages[0].includes('Energy strategy report') && pages[0].includes(toWinAnsi(run.inputs.project.name)), 'cover');
    assert.ok(all.includes('Concept-stage screening only'), 'guardrail');
    for (let i = 0; i < pages.length; i++) assert.ok(pages[i].includes(`Page ${i + 1} of ${pages.length}`), `page number on page ${i + 1}`);
    // Every input (outside the Site tab's geometry) is listed with entered or default.
    const rows = inputRows(run.inputs);
    assert.ok(rows.length > 120, `${rows.length} input rows`);
    for (const k of SITE_BETA_KEYS) assert.ok(!rows.some((x) => x.path === k), `${k} listed`);
    for (const x of rows) assert.ok(/^(Entered|Entered \(required\)|Default: .+)$/.test(x.status));
    assert.ok(rows.find((x) => x.path === 'site.areaHa').status === 'Entered (required)');
    assert.ok(rows.find((x) => x.path === 'economics.wacc').status.startsWith(`Default: ${LABEL}`));
    for (const p of ['load.itMW', 'grid.fullMW', 'economics.wacc', 'settings.generationCap']) assert.ok(all.includes(p), `${p} not in the PDF`);
    // Results: the top five, the compared options, the tornado drivers.
    const { cards } = topCards(run.options);
    for (const c of cards) assert.ok(all.includes(`#${c.o.rank} `), `card #${c.o.rank} missing`);
    assert.ok(all.includes('Choices on which they differ'));
    const flat = all.replace(/\n/g, ' ');
    for (const row of sens.allRows) assert.ok(flat.includes(toWinAnsi(row.label)), `driver ${row.label} missing`);
    // Nothing from the Site tab (Beta).
    const siteMsgs = cards.flatMap((c) => c.o.flags.filter((f) => f.siteFit).map((f) => f.message));
    for (const m of siteMsgs) assert.ok(!all.includes(toWinAnsi(m)), `site-fit flag in the PDF: ${m.slice(0, 60)}`);
    assert.ok(!pages.some((p) => p.split('\n').includes('Site fit')), 'a "Site fit" flag row in the PDF');
    // Without a comparison or a tornado the sections say so.
    const r2 = buildReport(run, { created });
    const all2 = pdfPageTexts(r2.bytes).join('\n');
    assert.ok(all2.includes('No options were chosen for comparison') && all2.includes('was not run for this report'));
    // Same inputs, same date → identical bytes.
    assert.deepEqual(buildReport(run, { created }).bytes, r2.bytes);
    assert.match(reportFileName(run, created), /^energy-strategy-report-T1-reference-example-2026-10-23\.pdf$/);
    // Offline: the report code imports nothing outside the app (no npm dependency, no fetch).
    for (const f of ['../src/report/pdf.js', '../src/report/report.js']) {
      const src = readFileSync(new URL(f, import.meta.url), 'utf8');
      assert.ok(!/\bfetch\(|XMLHttpRequest|https?:\/\//.test(src), `${f} reaches the network`);
      for (const m of src.matchAll(/from '([^']+)'/g)) assert.ok(m[1].startsWith('.'), `${f} imports ${m[1]}`);
    }
    out.push(`${r.pages} pages, ${(r.bytes.length / 1024).toFixed(0)} kB, ${nObj} objects, ${ms} ms; sections in order on pages ${order.map((x) => x + 1).join(', ')}; ${rows.length} inputs (${rows.filter((x) => x.isDefault).length} defaults); ${cards.length} cards, 2 compared, ${sens.allRows.length} tornado drivers; deterministic bytes; no Site tab content`);
    // A PdfDoc table repeats its header on a new page.
    const d = new PdfDoc({ title: 't' });
    d.table([{ label: 'H1' }, { label: 'H2' }], Array.from({ length: 120 }, (_, i) => [`r${i}`, 'x']));
    const tp = pdfPageTexts(d.bytes());
    assert.ok(tp.length >= 2 && tp.every((p) => p.includes('H1')), 'table header not repeated');
    return out.join('; ') + '.';
  });
}
