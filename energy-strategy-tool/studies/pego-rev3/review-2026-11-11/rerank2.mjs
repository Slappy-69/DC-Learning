import fs from 'node:fs';
const ROOT = '/home/claude/dc-learning/energy-strategy-tool/';
const { readStudyFile, runModel } = await import(ROOT + 'app/src/engine/index.js');
const inputs = readStudyFile(fs.readFileSync(ROOT + 'studies/pego-rev3/pego-product.study.json', 'utf8')).inputs;
const run = runModel(inputs);
const out = run.options.map((o) => ({
  id: o.id, name: o.name, rank: o.rank, score: o.score, adequate: o.adequacy.adequate, res: o.resilience.status,
  lcoe: o.eco.lcoe, capex: o.eco.capex, carbon: o.carbon.locationG, ttp: o.ttp.metric, deliv: o.deliv.score,
  delivItems: o.deliv.items.map((i) => [i.item, i.points]), axis: o.axisScores, choices: o.v,
  bridge: o.sizing.bridge ? { tech: o.sizing.bridge.tech, mw: o.sizing.bridge.mw } : null,
  prime: o.sizing.prime ? { tech: o.sizing.prime.tech, mw: o.sizing.prime.mw } : null,
  unlikely: (o.sizing.permitOutlook || []).filter((x) => x.outlook === 'unlikely').map((x) => x.name),
  dominatedBy: !!o.dominatedBy,
}));
fs.writeFileSync(process.env.OUT, JSON.stringify({ n: out.length, options: out }));
console.log('options', out.length, 'adequate', out.filter((o) => o.adequate).length);
