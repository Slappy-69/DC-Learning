// Check 2: independent recomputation of the T1 leader's year 2 balance and unmet/week logic.
const APP = '/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/engine/index.js';
const E = await import(APP);
const sum = (a, f = 0, t = a.length) => { let s = 0; for (let i = f; i < t; i++) s += a[i]; return s; };

const t0 = Date.now();
const run = E.runModel(E.referenceT1());
console.log('runModel ms', Date.now() - t0, 'options', run.options.length);
const leader = run.options.reduce((a, b) => (b.rank < a.rank ? b : a));
console.log('leader', leader.id, '|', leader.name, '| rank', leader.rank, '| C1', leader.v.C1, 'C13', leader.v.C13, 'C16', leader.v.C16, '| storage MWh', leader.sizing.storage.mwh.toFixed(1), 'MW', leader.sizing.storage.mw.toFixed(1));

// Independent rebuild (no inspect.js)
const inputs = E.normalizeInputs(run.inputs);
const ctx = E.buildContext(inputs);
const sz = E.sizeOption(ctx, leader.v);
const cfg = E.dispatchConfig(ctx, leader.v, sz);
const nAll = Math.max(1, inputs.settings.maxDispatchYears || 8);
const disp = E.dispatchAll(ctx, cfg, Array.from({ length: nAll }, (_, i) => i));
console.log('explicit years', disp.nExplicit, 'run.nExplicit', leader.dispatch.nExplicit);

const Y = 2;
const rec = disp.years[Y].hourly;
const ind = {
  re: sum(rec.re), ppa: sum(rec.ppa), dis: sum(rec.dis), firm: sum(rec.firm), gridLoad: sum(rec.grid), gridCharge: sum(rec.gridCharge),
  unmet: sum(rec.unmet), net: sum(rec.net), ch: sum(rec.ch), curt: sum(rec.curt), exp: sum(rec.exp),
};
ind.in = ind.re + ind.ppa + ind.dis + ind.firm + ind.gridLoad + ind.gridCharge + ind.unmet;
ind.out = ind.net + ind.ch + ind.curt + ind.exp;
ind.residual = ind.in - ind.out;

const t1 = Date.now();
const I = E.inspectOption(run.inputs, leader.v);
console.log('inspectOption ms', Date.now() - t1);
const b = I.years[Y].balance;
const rows = ['in', 'out', 'residual', 'unmet', 'ppa', 'gridLoad', 'gridCharge', 're', 'dis', 'firm', 'net', 'ch', 'curt', 'exp'];
let maxDiff = 0;
for (const k of rows) {
  const d = Math.abs((b[k] ?? NaN) - ind[k]);
  maxDiff = Math.max(maxDiff, d);
  console.log(k.padEnd(11), 'indep', ind[k].toFixed(6).padStart(16), ' inspect', (b[k] ?? NaN).toFixed(6).padStart(16), ' diff', d.toExponential(2));
}
console.log('max |diff| over compared fields', maxDiff.toExponential(2));
// Engine annual figures for year 2 vs the arrays
console.log('engine unmetMWh', disp.years[Y].unmetMWh.toFixed(6), 'vs array', ind.unmet.toFixed(6), '| engine gridMWh', disp.years[Y].gridMWh.toFixed(3), 'vs grid+gridCharge', (ind.gridLoad + ind.gridCharge).toFixed(3));

// Which year has the most unmet energy (from the independent arrays)?
const unmetByYear = disp.years.map((yy) => sum(yy.hourly.unmet));
console.log('unmet MWh by year', unmetByYear.map((x) => x.toFixed(1)).join(' | '), '-> argmax index', unmetByYear.indexOf(Math.max(...unmetByYear)));
console.log('in-view defaultYear (UI rule, most unmet > 1e-6, first wins):', (() => { let best = -1, bu = 1e-6; unmetByYear.forEach((u, i) => { if (u > bu) { bu = u; best = i; } }); return best; })());

// Week check on year 2, brute force over 52 weeks of 168 h starting at hour 0
const weekUnmet = Array.from({ length: 52 }, (_, w) => sum(rec.unmet, w * 168, (w + 1) * 168));
let bw = 0; for (let w = 1; w < 52; w++) if (weekUnmet[w] > weekUnmet[bw] + 1e-9) bw = w;
const presets = E.weekPresets(rec);
const up = presets.find((p) => p.id === 'unmet');
console.log('weekPresets:', JSON.stringify(presets));
console.log('brute-force most-unmet week (1-based):', bw + 1, 'with', weekUnmet[bw].toFixed(3), 'MWh; preset says', up ? up.week : 'none');
if (up) console.log('preset week window', JSON.stringify(E.weekRange(up.week)), 'unmet in window', sum(rec.unmet, E.weekRange(up.week).from, E.weekRange(up.week).to).toFixed(3));
console.log('unmet in last 24 h (hours 8736-8759, not in any week view):', sum(rec.unmet, 8736, 8760).toFixed(3), 'MWh; unmet in weeks 1-52:', sum(rec.unmet, 0, 8736).toFixed(3));
// Peak preset check
let ph = 0; for (let h = 1; h < 8760; h++) if (rec.net[h] > rec.net[ph]) ph = h;
const pk = presets.find((p) => p.id === 'peak');
const pr = E.weekRange(pk.week);
console.log('peak net hour', ph, '(day', Math.floor(ph / 24) + 1, ') peak preset week', pk.week, 'window', pr.from, '-', pr.to - 1, 'contains peak:', ph >= pr.from && ph < pr.to);
console.log('year-2 zero-unmet check; net positive hours', rec.net.filter((x) => x > 0).length);
