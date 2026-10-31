// Opus review H4-H6, script r10: on the Pego product study (a campus the run does not lay out), how long one breakeven
// step takes. breakeven.js re-runs options with evaluateOption(ctx, v) and no skipLayout, so each re-run lays the option out.
import fs from 'node:fs';
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { runModel } = await import(`${APP}run.js`);
const { readStudyFile } = await import(`${APP}study.js`);
const { breakevenSteps } = await import(`${APP}breakeven.js`);
const { buildContext } = await import(`${APP}context.js`);
const { normalizeInputs } = await import(`${APP}defaults.js`);
const { evaluateOption } = await import(`${APP}option.js`);
const r = readStudyFile(fs.readFileSync(new URL('../../../studies/pego-rev3/pego-product.study.json', import.meta.url), 'utf8'));
const run = runModel(r.inputs);
const L = run.options.find((o) => o.rank === 1);
const ctx = buildContext(normalizeInputs(run.inputs), { site: run.ctx.site });
let t = performance.now(); evaluateOption(ctx, L.v, { skipLayout: true }); const a = performance.now() - t;
t = performance.now(); const e = evaluateOption(ctx, L.v); const b = performance.now() - t;
console.log(`Pego leader re-run: ${a.toFixed(0)} ms without the layout, ${b.toFixed(0)} ms with it (site fit ${e.siteFit.status}; run's site fit ${L.siteFit.status})`);
const it = breakevenSteps(run, { site: run.ctx.site });
const times = [];
let x = it.next(); let total = null;
for (let i = 0; i < 12 && !x.done; i++) { t = performance.now(); x = it.next(); times.push(performance.now() - t); total = x.value && x.value.total; }
console.log(`first 12 breakeven steps: ${times.map((v) => v.toFixed(0)).join(', ')} ms; planned steps about ${total}; estimate for all: ${((times.reduce((p, q) => p + q, 0) / times.length) * total / 1000 / 60).toFixed(1)} minutes`);
