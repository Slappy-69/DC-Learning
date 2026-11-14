// Monte Carlo of the T1 run (100 samples, top 20) and the PDF with it, in pounds, as the app makes it.
import { E, runT1 } from './lib.mjs';
import fs from 'node:fs';
import { setDisplayCurrency } from '../app/src/format.js';
import { monteCarlo } from '../app/src/engine/montecarlo.js';
import { buildReport } from '../app/src/report/report.js';
const { run, inputs } = runT1();
const code = E.displayCurrencyCode(inputs); setDisplayCurrency(code, E.FX[code]);
const t = Date.now();
const mc = monteCarlo(run, { site: run.ctx.site, samples: 100, nOptions: 20 });
console.log('mc ms', Date.now() - t, 'samples', mc.samples, 'complete', mc.complete);
const L = mc.rows[0]; console.log('leader row', JSON.stringify({ id: L.id, pRank1: L.pRank1, lcoe: L.lcoe, npv: L.npv, capex: L.capex, carbon: L.carbon }));
fs.writeFileSync('out/montecarlo100.json', JSON.stringify({ rows: mc.rows.map((r) => ({ id: r.id, rank: r.rank, pRank1: r.pRank1, lcoe: r.lcoe, npv: r.npv, capex: r.capex, carbon: r.carbon, scoreBand: r.scoreBand })), drivers: mc.drivers, robust: mc.robust }, null, 1));
const rep = buildReport(run, { created: new Date('2026-11-14T10:00:00Z'), monteCarlo: mc });
fs.writeFileSync('out/report_mc.pdf', Buffer.from(rep.bytes));
console.log('pdf pages', rep.pages);
