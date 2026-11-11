import fs from 'node:fs';
const ROOT = '/home/claude/dc-learning/energy-strategy-tool/';
const { readStudyFile, runModel } = await import(ROOT + 'app/src/engine/index.js');
const inputs = readStudyFile(fs.readFileSync(ROOT + 'studies/pego-rev3/pego-product.study.json', 'utf8')).inputs;
const run = runModel(inputs);
const want = JSON.parse(fs.readFileSync(process.env.SCR + '/pego-options.json', 'utf8')).options;
const target = [...want].sort((a,b)=>(!a.adequate)-(!b.adequate)||(b.res==='Does not meet')-(a.res==='Does not meet')||b.score-a.score||(a.id<b.id?-1:1))[0];
const o = run.options.find((x) => x.id === target.id);
const yrs = o.dispatch.years;
const rows = yrs.map((y, i) => {
  const p = y.plants.filter((q) => q.tech === 'dieselPrime');
  const mwh = p.reduce((a, q) => a + q.mwh, 0);
  const hours = p.reduce((a, q) => a + (q.hours || 0), 0);
  return { year: i, dieselMWh: Math.round(mwh), dieselShare: +(mwh / (y.demandMWh || 1)).toFixed(3), dieselHours: Math.round(hours), gridMWh: Math.round(y.gridMWh || 0), demandMWh: Math.round(y.demandMWh || 0) };
});
console.log(JSON.stringify(rows.slice(0, 20)));
console.log('plant fields', Object.keys(yrs[yrs.length-1].plants[0] || {}).join(','));
