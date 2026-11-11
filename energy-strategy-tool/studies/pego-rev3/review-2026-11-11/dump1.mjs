import fs from 'node:fs';
const ROOT = '/home/claude/dc-learning/energy-strategy-tool/';
const { readStudyFile, runModel } = await import(ROOT + 'app/src/engine/index.js');
const inputs = readStudyFile(fs.readFileSync(ROOT + 'studies/pego-rev3/pego-product.study.json', 'utf8')).inputs;
const run = runModel(inputs);
const want = JSON.parse(fs.readFileSync(process.env.SCR + '/pego-options.json', 'utf8')).options;
const KEYS = ['C1','C2','C3','C4','C4s','C5','C6','C7'];
const new_ = [...want].sort((a,b)=>(!a.adequate)-(!b.adequate)||(b.res==='Does not meet')-(a.res==='Does not meet')||b.score-a.score||(a.id<b.id?-1:1));
const target = new_[0];
const o = run.options.find((x) => x.id === target.id);
const pick = (x) => JSON.parse(JSON.stringify(x, (k, v) => (k === 'ledger' || k === 'dispatch' || k === 'layout' || k === 'blocks' ? undefined : v)));
fs.writeFileSync(process.env.SCR + '/opt1.json', JSON.stringify({
  name: o.name, score: o.score, rank: o.rank, axis: o.axisScores, metrics: o.metrics,
  choices: o.v, sizing: o.sizing, adequacy: o.adequacy, resilience: o.resilience,
  ttp: o.ttp, deliv: o.deliv, eco: { ...o.eco, ledger: undefined, capexLines: o.eco.capexLines },
  carbon: o.carbon, unmet: o.unmet, flags: o.flags.map((f) => ({ id: f.id, severity: f.severity, message: f.message })),
  dominatedBy: o.dominatedBy, siteFit: o.siteFit ? o.siteFit.status : null,
}, null, 1));
console.log('ok', o.name);
