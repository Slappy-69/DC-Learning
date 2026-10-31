// Opus review H4-H6, script r9:
// (a) the stored Pego product study file (H4 M-4 fix): reopen, re-run, compare with the saved record, and run the
//     breakevens' first steps and a short Monte Carlo on it (a campus not laid out in the run);
// (b) summary edge cases on T1 copies: one adequate option (H5 M2), hourly CFE carbon (H5 M3, M4).
import fs from 'node:fs';
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1, normalizeInputs } = await import(`${APP}defaults.js`);
const { runModel } = await import(`${APP}run.js`);
const { readStudyFile, compareWithSaved } = await import(`${APP}study.js`);
const { plainSummary } = await import(`${APP}summary.js`);
const { scoreOptions } = await import(`${APP}scoring.js`);
const { monteCarlo } = await import(`${APP}montecarlo.js`);
const FILE = new URL('../../../studies/pego-rev3/pego-product.study.json', import.meta.url);
const r = readStudyFile(fs.readFileSync(FILE, 'utf8'));
let t = Date.now();
const pego = runModel(r.inputs);
const c = compareWithSaved(r.file, pego);
const PL = pego.options.find((o) => o.rank === 1);
console.log(`(a) Pego study: warnings ${JSON.stringify(r.warnings)}; run ${((Date.now() - t) / 1000).toFixed(1)} s; layout on demand ${!!(pego.layoutSummary && pego.layoutSummary.onDemand)}; leader EUR ${PL.eco.lcoe.toFixed(1)}/MWh; same as saved ${c.same}; ${c.message.slice(0, 140)}`);
t = Date.now();
const mcP = monteCarlo(pego, { site: pego.ctx.site, samples: 20 });
const lr = mcP.rows.find((x) => x.id === mcP.leaderId);
console.log(`(a) Pego Monte Carlo 20 samples x ${mcP.rows.length}: ${((Date.now() - t) / 1000).toFixed(1)} s; skipLayout ${mcP.skipLayout}; leader leads ${(lr.pRank1 * 100).toFixed(0)} %`);
// (b) summary cases
const run = runModel(referenceT1());
const copy = (mut) => { const inputs = normalizeInputs(run.inputs); mut && mut.inputs && mut.inputs(inputs); const rr = { ...run, inputs, options: run.options.map((o) => ({ ...o, adequacy: { ...o.adequacy } })) }; mut && mut.opts && mut.opts(rr); rr.scoring = scoreOptions(rr.options, inputs); return rr; };
const one = copy({ opts: (rr) => { const L = rr.options.find((o) => o.rank === 1); for (const o of rr.options) if (o !== L) o.adequacy.adequate = false; } });
const s1 = plainSummary(one);
console.log(`(b) one adequate option, part 3: "${s1.parts.find((p) => p.id === 'gives-up').text}"`);
const cfe = copy({ inputs: (i) => { i.settings.carbonMetric = 'cfe'; } });
const s2 = plainSummary(cfe);
const L2 = cfe.options.find((o) => o.rank === 1), R2 = cfe.options.find((o) => o.rank === 2);
console.log(`(b) CFE: gap ${(L2.score - R2.score).toFixed(4)}; part 2: "${s2.parts.find((p) => p.id === 'why').text}"`);
console.log(`(b) CFE: part 3: "${s2.parts.find((p) => p.id === 'gives-up').text}"`);
const w = cfe.scoring.weights;
const parts = Object.keys(w).map((k) => w[k] * (L2.axisScores[k] - R2.axisScores[k]));
console.log(`(b) CFE: axis parts ${parts.map((x) => x.toFixed(4)).join(', ')}; sum ${parts.reduce((a, b) => a + b, 0).toFixed(4)}`);
