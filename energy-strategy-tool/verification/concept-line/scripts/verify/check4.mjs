// Rare option kinds (flex, CHP, export, bessSolar bridging, exceedance) through inspectOption.
const APP = '/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/engine/index.js';
const E = await import(APP);
const base = E.referenceT1();
base.choices.C1 = { state: 'open', values: ['wait', 'bridge', 'islanded', 'export'] };
base.choices.C2 = { state: 'open', values: ['gasRecip', 'fuelCell', 'rented', 'bessSolar', 'dieselPrime'] };
base.choices.C16 = { state: 'open', values: ['off', 'on'] };
base.grid.exportMW = 20;
const inputs = E.normalizeInputs(base);
const t0 = Date.now();
const gen = E.generateOptions(inputs);
console.log('generated', gen.options.length, 'options in', Date.now() - t0, 'ms');
const pick = (pred) => gen.options.find((o) => pred(o.v));
const picks = {
  flex: pick((v) => v.C16 === 'on' && v.C1 === 'wait' && v.C4 === 'none' && v.C13 !== 'none'),
  chp: pick((v) => v.C4 === 'chp' && v.C16 === 'off' && v.C1 === 'wait'),
  export: pick((v) => v.C1 === 'export' && v.C4 === 'none'),
  bessSolar: pick((v) => v.C2 === 'bessSolar' && v.C1 === 'bridge'),
  bessSolarIslanded: pick((v) => v.C2 === 'bessSolar' && v.C1 === 'islanded'),
};
const sum = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
for (const [name, opt] of Object.entries(picks)) { const v = opt ? opt.v : null;
  if (!v) { console.log(name, ": none generated"); continue; }
  const t1 = Date.now();
  let I;
  try { I = E.inspectOption(inputs, v); } catch (e) { console.log(name, 'EXCEPTION', e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
  let nan = 0, neg = 0, mxRes = 0, splitErr = 0;
  const negKeys = new Set();
  for (const Y of I.years) {
    for (const k of ['re', 'ppa', 'dis', 'ch', 'firm', 'grid', 'gridCharge', 'unmet', 'curt', 'exp', 'cap', 'chpCredit', 'flex']) {
      for (let h = 0; h < 8760; h++) { const x = Y.hourly[k][h]; if (!Number.isFinite(x)) nan++; if (x < -1e-9) { neg++; negKeys.add(k); } }
    }
    for (let h = 0; h < 8760; h++) if (!Number.isFinite(Y.hourly.net[h])) nan++;
    mxRes = Math.max(mxRes, Y.balance.maxHourlyResidual);
  }
  const tl = I.timeline;
  for (let m = 0; m < tl.months; m++) splitErr = Math.max(splitErr, Math.abs(tl.grid[m] + tl.firm[m] + tl.bess[m] - tl.supply[m]));
  const B = I.years.map((Y) => Y.balance);
  const sums = (k) => B.map((b) => b[k].toFixed(0)).join(',');
  console.log(`\n${name}: ${v.C1}/${v.C2}/C4=${v.C4}/C13=${v.C13}/C16=${v.C16}  inspect ${Date.now() - t1} ms, years ${I.years.length}, nonfinite ${nan}, negatives ${neg} ${[...negKeys].join(',')}, max hourly residual ${mxRes.toExponential(1)}, timeline split err ${splitErr.toExponential(1)}`);
  console.log('  flex MWh by year', sums('flex'), '| chpCredit MWh', sums('chpCredit'), '| export MWh', sums('exp'), '| curt MWh', sums('curt'), '| bess-discharge MWh', sums('dis'), '| unmet MWh', sums('unmet'));
  console.log('  timeline bess (bridging) max MW', Math.max(...tl.bess).toFixed(2), '| months with bridging battery', tl.bess.filter((x) => x > 1e-9).length, '| firm max', Math.max(...tl.firm).toFixed(1), '| ttp first/full/gap', I.ttp.firstPowerM, I.ttp.fullLoadM, I.ttp.gapMWm.toFixed(2));
  // flex cap and export cap checks
  if (name === 'flex') {
    const fm = inputs.load.flexMaxPct; const fh = inputs.load.flexHours;
    let over = 0, cnt = 0;
    for (const Y of I.years) for (let h = 0; h < 8760; h++) { if (Y.hourly.flex[h] > 1e-9) cnt++; if (Y.hourly.flex[h] > fm * Y.hourly.demand[h] + 1e-9) over++; }
    console.log(`  flex hours used (all years) ${cnt}, flex above flexMaxPct*IT-proxy ${over} (flexMaxPct ${fm}, flexHours ${fh})`);
    const yr0 = I.years[0].hourly; let maxF = 0; for (let h = 0; h < 8760; h++) maxF = Math.max(maxF, yr0.flex[h]);
    console.log(`  year1 max flex MW ${maxF.toFixed(2)}, net+flex+chp == gross check max err ${Math.max(...I.years.map((Y) => { let e = 0; for (let h = 0; h < 8760; h++) e = Math.max(e, Math.abs(Y.hourly.demand[h] - Y.hourly.chpCredit[h] - Y.hourly.flex[h] - Y.hourly.net[h])); return e; })).toExponential(1)}`);
  }
  if (name === 'export') {
    let over = 0; for (const Y of I.years) for (let h = 0; h < 8760; h++) if (Y.hourly.exp[h] > inputs.grid.exportMW + 1e-9) over++;
    console.log(`  export hours above exportMW (${inputs.grid.exportMW}) ${over}`);
  }
  if (name.startsWith('bessSolar')) {
    console.log('  bridge battery sized MW', I.bess.mw.toFixed(2), 'MWh', I.bess.mwh.toFixed(1), '; timeline bess months with value', tl.bess.filter((x) => x > 1e-9).length, 'of', tl.months);
  }
}
// Exceedance handling on the T1 leader
const ex = E.normalizeInputs({ ...E.referenceT1(), settings: { ...E.referenceT1().settings, gridHandling: 'exceedance' } });
const exGen = E.generateOptions(ex).options;
const exV = exGen.find((o) => o.v.C1 === 'wait' && o.v.C13 === 'hybrid' && o.v.C4 === 'none');
const IX = E.inspectOption(ex, exV.v);
const offered = IX.years.map((Y) => Y.balance.gridLoad + Y.balance.gridCharge + Y.balance.ppa);
console.log('\nexceedance: option', exV.v.C13, 'unmet MWh by year', IX.years.map((Y) => Y.balance.unmet.toFixed(1)).join(','), '| physical import MWh by year', offered.map((x) => x.toFixed(0)).join(','), '| exceedance flag', IX.exceedance);
