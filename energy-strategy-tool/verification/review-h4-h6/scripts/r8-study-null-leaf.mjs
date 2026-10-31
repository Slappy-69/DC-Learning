// Opus review H4-H6, script r8: a study file whose WACC is null (a damaged or hand-edited file; the app's number field
// never commits null for it). readStudyFile accepts it; what does the run then do?
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1 } = await import(`${APP}defaults.js`);
const { runModel } = await import(`${APP}run.js`);
const { studyFile, readStudyFile } = await import(`${APP}study.js`);
const inp = referenceT1();
const f = JSON.parse(JSON.stringify(studyFile(inp, null)));
f.inputs.economics.wacc = null;
const r = readStudyFile(JSON.stringify(f));
console.log(`readStudyFile: ok ${r.ok}; warnings ${JSON.stringify(r.warnings)}`);
const base = runModel(inp), run = runModel(r.inputs);
const lb = base.options.find((o) => o.rank === 1), lr = run.options.find((o) => o.rank === 1);
console.log(`T1: leader ${lb.id} LCOE ${lb.eco.lcoe.toFixed(1)} NPV ${(lb.eco.npvCost / 1e6).toFixed(0)} m; with WACC null: leader ${lr.id} LCOE ${lr.eco.lcoe.toFixed(1)} NPV ${(lr.eco.npvCost / 1e6).toFixed(0)} m; run.inputs.economics.wacc = ${JSON.stringify(run.inputs.economics.wacc)}`);
console.log(`run flags mentioning WACC: ${run.runFlags.filter((x) => /wacc|discount/i.test(x.message)).length}; leader flags mentioning WACC: ${lr.flags.filter((x) => /WACC/.test(x.message)).map((x) => x.message.slice(0, 120)).join(' | ') || 'none'}`);
