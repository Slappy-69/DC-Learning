// Pego study, revision 3: tornado for the study's #1, the app's own PDF report of the study run, hourly series for the
// charts, monthly supply against design load, and the site layouts (plans and massing renders).
import fs from 'node:fs';
const E = new URL('./app/src/engine/', import.meta.url).href;
const D = await import(E + 'defaults.js');
const { runModel, ENGINE_VERSION } = await import(E + 'run.js');
const { tornado, TORNADO_DRIVERS } = await import(E + 'sensitivity.js');
const { buildContext } = await import(E + 'context.js');
const { evaluateOption } = await import(E + 'option.js');
const { layoutForOption } = await import(E + 'siteapi.js');
const { buildReport } = await import(new URL('./app/src/report/report.js', import.meta.url).href);
const { setDisplayCurrency } = await import(new URL('./app/src/format.js', import.meta.url).href);
const { scenarioInputs } = await import('./runs.mjs');
const { optionV, STRATS } = await import('./strategies.mjs');
const { isoSVG } = await import('./iso.mjs');
const OUT = new URL('./out/', import.meta.url);
const log = (...a) => fs.writeSync(1, a.join(' ') + '\n');

const inp = scenarioInputs('base');
const run = runModel(inp);
const byRank = [...run.options].sort((a, b) => a.rank - b.rank);
const lead = byRank[0];
log('lead', lead.id, lead.name, lead.eco.lcoe.toFixed(1));

// 1. Tornado, all 16 drivers, LCOE
const t0 = Date.now();
const tor = tornado(run, lead.id, { drivers: TORNADO_DRIVERS, measure: 'lcoe' });
log('tornado', ((Date.now() - t0) / 1000).toFixed(1), 's; base', tor.base.lcoe.toFixed(2), 'score', tor.base.score.toFixed(3), 'run', lead.score.toFixed(3));
fs.writeFileSync(new URL('tornado.json', OUT), JSON.stringify({ optionId: lead.id, name: lead.name, base: tor.base, rows: tor.allRows.map((r) => ({ id: r.id, label: r.label, unit: r.unit, basis: r.basis, low: { x: r.low.x, text: r.low.text, lcoe: r.low.lcoe, npv: r.low.npvCost, carbon: r.low.carbonG, score: r.low.score }, high: { x: r.high.x, text: r.high.text, lcoe: r.high.lcoe, npv: r.high.npvCost, carbon: r.high.carbonG, score: r.high.score }, lcoeSwing: r.lcoeSwing })) }, null, 1));

// 2. The app's own PDF report of this run (the same code as "Save PDF report")
setDisplayCurrency('EUR');
const compareIds = byRank.slice(0, 3).map((o) => o.id);
const rep = buildReport(run, { compareIds, sensitivity: tor, sensitivityMeasure: 'lcoe', created: new Date('2026-10-24T12:00:00Z'), appVersion: `${ENGINE_VERSION} (Pego study build)` });
const bytes = rep.bytes ? rep.bytes : rep;
fs.writeFileSync(new URL('app-report.pdf', OUT), Buffer.from(bytes instanceof Uint8Array ? bytes : rep.pdf || bytes));
log('report', rep.pages || '', 'pages');

// 3. Hourly series: CCGT from 2028 (v1) in 2029; the recommended plan in the steady-state year
const ctx = buildContext(D.normalizeInputs(inp));
const daily = (arr) => { const out = []; for (let d = 0; d < 365; d++) { let s = 0, mn = Infinity, mx = -Infinity; for (let h = 0; h < 24; h++) { const x = arr[d * 24 + h]; s += x; mn = Math.min(mn, x); mx = Math.max(mx, x); } out.push([s / 24, mn, mx]); } return out; };
const ev1 = evaluateOption(ctx, optionV('v1'), { recordYears: [2] });
const y29 = ev1.disp.years[2].hourly;
const evL = evaluateOption(ctx, lead.v, { recordYears: [2, 9] });
const yss = evL.disp.years[9].hourly;
// peak-demand week of the steady-state year
let hMax = 0; for (let h = 0; h < yss.demand.length; h++) if (yss.demand[h] > yss.demand[hMax]) hMax = h;
const w0 = Math.max(0, Math.min(8760 - 168, Math.floor(hMax / 24) * 24 - 72));
const pick = (a) => Array.from(a.slice(w0, w0 + 168));
const series = {
  v1_2029: { demand: daily(y29.demand), firm: daily(y29.firm), curt: daily(y29.curt) },
  lead_week: { start: w0, demand: pick(yss.demand), grid: pick(yss.grid), ppa: pick(yss.ppa), firm: pick(yss.firm), dis: pick(yss.dis), solar: pick(yss.solar), curt: pick(yss.curt), unmet: pick(yss.unmet) },
  lead_months: { design: Array.from(evL.sz.designByMonth || []), firm: Array.from(evL.sz.firmByMonth || []), grid: Array.from(ctx.gridCap.slice(0, ctx.nMonthsTimeline)) },
};
fs.writeFileSync(new URL('series.json', OUT), JSON.stringify(series));
log('series ok; design months', series.lead_months.design.length, 'firm', series.lead_months.firm.length);

// 4. Site layouts: the study's #1 and three alternatives on the 150 ha rectangle
const plans = {};
for (const [k, o] of [['lead', lead], ['enginesAll', { v: optionV('enginesAll') }], ['v1', { v: optionV('v1') }], ['eight', null]]) {
  let L, site, nm;
  if (k === 'eight') {
    const i8 = D.normalizeInputs(scenarioInputs('eight'));
    const c8 = buildContext(i8);
    const s8 = D.normalizeInputs(i8);
    const sz = evaluateOption(c8, lead.v).sz;
    L = layoutForOption(c8.site, s8, { v: lead.v, sizing: sz }); nm = 'Eight buildings, study #1 strategy';
  } else {
    const sz = o.sizing || evaluateOption(ctx, o.v).sz;
    L = layoutForOption(ctx.site, ctx.inputs, { v: o.v, sizing: sz }); nm = k === 'lead' ? lead.name : STRATS[k].label;
  }
  plans[k] = { name: nm, status: L.siteFit.status, landTakeHa: L.siteFit.landTakeHa, netHa: L.siteFit.netM2 / 1e4, unplaced: L.siteFit.unplaced.length, reasons: L.siteFit.reasons, roof: L.siteFit.roof, placed: L.layout.placed.length, blocks: L.bs.ground.length,
    blockList: L.layout.placed.map((p) => { const b = L.bs.ground[p.index]; return { name: b.name, type: b.type, w: +(p.x1 - p.x0).toFixed(1), h: +(p.y1 - p.y0).toFixed(1), heightM: b.heightM }; }) };
  fs.writeFileSync(new URL(`iso-${k}.svg`, OUT), isoSVG(L.site, L.bs, L.layout, { width: 1800 }));
  log('plan', k, L.siteFit.status, 'land', L.siteFit.landTakeHa.toFixed(1), 'ha of net', (L.siteFit.netM2 / 1e4).toFixed(1), 'placed', L.layout.placed.length, '/', L.bs.ground.length);
}
fs.writeFileSync(new URL('plans.json', OUT), JSON.stringify(plans, null, 1));
fs.writeFileSync(new URL('lead.json', OUT), JSON.stringify({ id: lead.id, rank: lead.rank, name: lead.name, v: lead.v, sentences: lead.sizing.sentences, flags: lead.flags.map((f) => ({ id: f.id, severity: f.severity, category: f.category, text: f.text, assumed: !!f.assumed, path: f.path })), eco: { lcoe: lead.eco.lcoe, npv: lead.eco.npvCost, capex: lead.eco.capex, byPeriod: lead.eco.byPeriod, capexLines: lead.eco.capexLines, contingency: lead.eco.contingency, ledger: lead.eco.ledger }, carbon: lead.carbon, ttp: (({ supplyByMonth, ...t }) => t)(lead.ttp), adequacy: lead.adequacy, res: lead.resilience }, null, 1));
log('done');
