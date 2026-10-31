// Opus review H4-H6, script r15: the PDF's summary page (page 2) for T1 with the tornado, the breakevens and the Monte
// Carlo run on the leader: what it says about the leader's flags and the breakevens.
const APP = new URL('../../../app/src/', import.meta.url).href;
const { referenceT1 } = await import(`${APP}engine/defaults.js`);
const { runModel } = await import(`${APP}engine/run.js`);
const { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } = await import(`${APP}engine/sensitivity.js`);
const { breakevens } = await import(`${APP}engine/breakeven.js`);
const { monteCarlo } = await import(`${APP}engine/montecarlo.js`);
const { buildReport } = await import(`${APP}report/report.js`);
const { pdfPageTexts } = await import(`${APP}report/pdf.js`);
const run = runModel(referenceT1());
const site = run.ctx.site;
const L = run.options.find((o) => o.rank === 1);
const tor = tornado(run, L.id, { site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
const be = breakevens(run, { site });
const mc = monteCarlo(run, { site, samples: 300 });
const pages = pdfPageTexts(buildReport(run, { created: new Date('2026-10-30T12:00:00Z'), sensitivity: tor, breakevens: be, monteCarlo: mc }).bytes).map((p) => p.replace(/\s+/g, ' '));
const k = pages.findIndex((p) => /Open flags on the leader/.test(p));
const pg = pages[k];
const i = pg.indexOf('Open flags on the leader');
console.log(`summary page ${k + 1}: "${pg.slice(i, i + 140)}"`);
console.log(`summary page mentions IED: ${/IED threshold/.test(pg)}; "Breakevens:" sentence in the summary text: ${/Breakevens: #/.test(pg.slice(0, pg.indexOf('Summary detail')))}; in the summary detail: ${/would lead if capex/.test(pg)}`);
const j = pg.indexOf('Summary detail');
console.log(`summary detail starts: "${pg.slice(j, j + 200)}"`);
