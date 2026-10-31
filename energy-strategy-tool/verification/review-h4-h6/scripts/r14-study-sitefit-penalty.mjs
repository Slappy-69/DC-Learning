// Opus review H4-H6, script r14: a study saved with the Site tab (Beta) on and its site-fit penalty ticked, then opened
// in a session where the Site tab is off (the default). openStudy (App.jsx) sets the inputs from the file and does not
// clear the penalty (only switching the Site tab off does, App.jsx:116). Does the penalty then change the ranking, and
// does the PDF say so?
const APP = new URL('../../../app/src/', import.meta.url).href;
const { referenceT1 } = await import(`${APP}engine/defaults.js`);
const { runModel } = await import(`${APP}engine/run.js`);
const { studyFile, readStudyFile } = await import(`${APP}engine/study.js`);
const { buildReport } = await import(`${APP}report/report.js`);
const { pdfPageTexts } = await import(`${APP}report/pdf.js`);
const off = referenceT1();
const on = referenceT1(); on.deliverability.siteFitPenalty = true;
const r = readStudyFile(JSON.stringify(studyFile(on, null)));
console.log(`reopened study: siteFitPenalty = ${r.inputs.deliverability.siteFitPenalty}`);
const a = runModel(off), b = runModel(r.inputs);
const top = (run) => run.options.slice().sort((x, y) => x.rank - y.rank).slice(0, 5).map((o) => `${o.id}(${o.siteFit.status})`).join(' ');
console.log(`T1 penalty off: top five ${top(a)}`);
console.log(`T1 penalty on (reopened study): top five ${top(b)}`);
const ids = (run) => run.options.slice().sort((x, y) => x.rank - y.rank).map((o) => o.id);
const ia = ids(a), ib = ids(b);
let moved = 0; const posA = new Map(ia.map((id, i) => [id, i])); for (let i = 0; i < 20; i++) if (posA.get(ib[i]) !== i) moved++;
console.log(`top-20 positions that differ: ${moved}; leader changes: ${ia[0] !== ib[0]}`);
const pdf = pdfPageTexts(buildReport(b, { created: new Date('2026-10-30T12:00:00Z') }).bytes).join(' ').replace(/\s+/g, ' ');
console.log(`PDF of the reopened run mentions the site-fit penalty: ${/site[- ]fit penalty/i.test(pdf)}; says the Site tab is not part of the report: ${/Site tab \(Beta\) is not part of this report/.test(pdf)}`);
