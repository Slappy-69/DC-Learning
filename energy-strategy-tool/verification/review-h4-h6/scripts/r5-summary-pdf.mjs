// Opus review H4-H6, script r5: the plain-English summary and the PDF with the tornado, the breakevens and the Monte
// Carlo all run on the T1 leader, as the app gives them; then the Site-tab note path on T2 (a tight site).
const APP = new URL('../../../app/src/', import.meta.url).href;
const { referenceT1, referenceT2 } = await import(`${APP}engine/defaults.js`);
const { runModel } = await import(`${APP}engine/run.js`);
const { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } = await import(`${APP}engine/sensitivity.js`);
const { breakevens } = await import(`${APP}engine/breakeven.js`);
const { monteCarlo } = await import(`${APP}engine/montecarlo.js`);
const { plainSummary, summaryKey, wordCount } = await import(`${APP}engine/summary.js`);
const { buildReport } = await import(`${APP}report/report.js`);
const { pdfPageTexts } = await import(`${APP}report/pdf.js`);
const run = runModel(referenceT1());
const site = run.ctx.site;
const L = run.options.find((o) => o.rank === 1);
const tor = tornado(run, L.id, { site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
const be = breakevens(run, { site });
const mc = monteCarlo(run, { site, samples: 300 });
const s = plainSummary(run, { sensitivity: tor, breakevens: be, monteCarlo: mc });
console.log(`T1 summary with tornado, breakevens and Monte Carlo: ${s.words} words (limit ${s.wordLimit}), overLimit ${s.overLimit}, moved ${s.moved.length}`);
console.log(s.text);
console.log('--- detail, confidence:');
for (const t of s.details.confidence) console.log(`  - ${t}`);
const created = new Date('2026-10-30T12:00:00Z');
const pdf = pdfPageTexts(buildReport(run, { created, sensitivity: tor, breakevens: be, monteCarlo: mc }).bytes).join(' ').replace(/\s+/g, ' ');
const i = pdf.indexOf('Latin hypercube samples');
console.log('--- PDF, Monte Carlo paragraph:');
console.log(pdf.slice(Math.max(0, i - 10), i + 900));
// Site tab note path (H5, H1): a note first saved with the Site tab on, then re-saved with it off (the panel's "Edit note"
// starts from the note's own text and stamps the current Site tab state).
const run2 = runModel(referenceT2());
const L2 = run2.options.find((o) => o.rank === 1);
const siteFlags = L2.flags.filter((f) => f.siteFit || f.category === 'Site fit');
const sOn = plainSummary(run2, { siteBeta: true });
const sOff = plainSummary(run2, { siteBeta: false });
console.log(`\nT2 leader ${L2.id}: ${siteFlags.length} site-fit flags; summary with the Site tab on mentions site fit: ${/Site fit/.test(sOn.text)}; off: ${/Site fit/.test(sOff.text)}`);
const note1 = { text: sOn.text, key: summaryKey(run2, { siteBeta: true }), leaderId: L2.id, leaderName: L2.name, editedAt: '2026-10-30', siteBeta: true };
const note2 = { ...note1, text: `${note1.text} (checked)`, key: summaryKey(run2, { siteBeta: false }), siteBeta: false }; // re-saved after the Site tab was turned off
for (const [tag, note] of [['note saved with the Site tab on', note1], ['same text re-saved with the Site tab off', note2]]) {
  const t = pdfPageTexts(buildReport(run2, { created, summaryNote: note }).bytes).join(' ').replace(/\s+/g, ' ');
  console.log(`PDF, ${tag}: note printed ${t.includes('(checked)') || t.includes('Summary as edited by the engineer')}; site-fit wording in the PDF ${/Site fit:/.test(t)}`);
}
