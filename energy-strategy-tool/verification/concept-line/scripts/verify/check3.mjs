// Check 3: edge-case audit of inspectOption on T1 and T3 options.
const APP = '/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/engine/index.js';
const E = await import(APP);
const sum = (a, f = 0, t = a.length) => { let s = 0; for (let i = f; i < t; i++) s += a[i]; return s; };
const runT1 = E.runModel(E.referenceT1());
const runT3 = E.runModel(E.referenceT3());
const best = (run, pred) => run.options.filter(pred).sort((a, b) => a.rank - b.rank)[0];
console.log('counts: T1 islanded', runT1.options.filter((o) => o.v.C1 === 'islanded').length, '| T3 islanded', runT3.options.filter((o) => o.v.C1 === 'islanded').length,
  '| T1 battery', runT1.options.filter((o) => o.sizing.storage.mwh > 0).length, '| T3 battery', runT3.options.filter((o) => o.sizing.storage.mwh > 0).length,
  '| T1 no PPA', runT1.options.filter((o) => o.v.C13 === 'none').length, '| T3 no PPA', runT3.options.filter((o) => o.v.C13 === 'none').length);

const cases = [
  ['(a) T3 islanded', runT3, best(runT3, (o) => o.v.C1 === 'islanded')],
  ['(a) T1 islanded', runT1, best(runT1, (o) => o.v.C1 === 'islanded')],
  ['(b) T1 battery', runT1, best(runT1, (o) => o.sizing.storage.mwh > 0)],
  ['(b) T3 battery', runT3, best(runT3, (o) => o.sizing.storage.mwh > 0)],
  ['(c) T1 no PPA', runT1, best(runT1, (o) => o.v.C13 === 'none')],
  ['(c) T3 no PPA', runT3, best(runT3, (o) => o.v.C13 === 'none')],
  ['(d) T1 leader', runT1, runT1.options.reduce((a, b) => (b.rank < a.rank ? b : a))],
];

function scanBad(obj, path, out) {
  if (obj == null) return;
  if (typeof obj === 'number') { if (!Number.isFinite(obj)) out.push(path); return; }
  if (ArrayBuffer.isView(obj)) { for (let i = 0; i < obj.length; i++) if (!Number.isFinite(obj[i])) { out.push(`${path}[${i}]`); break; } return; }
  if (Array.isArray(obj)) { obj.forEach((x, i) => scanBad(x, `${path}[${i}]`, out)); return; }
  if (typeof obj === 'object') for (const k of Object.keys(obj)) scanBad(obj[k], `${path}.${k}`, out);
}

for (const [label, run, opt] of cases) {
  if (!opt) { console.log(`\n${label}: no such option in this run`); continue; }
  const head = `${label}: #${opt.rank} ${opt.id} C1=${opt.v.C1} C2=${opt.v.C2} C13=${opt.v.C13} C16=${opt.v.C16} storage=${opt.sizing.storage.mw.toFixed(1)}MW/${opt.sizing.storage.mwh.toFixed(1)}MWh`;
  console.log('\n' + head);
  let I;
  const t0 = Date.now();
  try { I = E.inspectOption(run.inputs, opt.v); } catch (e) { console.log('  EXCEPTION:', e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e); continue; }
  console.log('  inspect ms', Date.now() - t0, '| years', I.years.length, '| ttp first', I.ttp.firstPowerM, 'full', I.ttp.fullLoadM, 'gap', I.ttp.gapMWm.toFixed(2));
  const nanPaths = []; scanBad(I, 'I', nanPaths);
  console.log('  non-finite values:', nanPaths.length ? nanPaths.slice(0, 5).join(', ') : 'none');
  // timeline
  const tl = I.timeline; const negs = [];
  for (const k of ['design', 'grid', 'firm', 'bess', 'supply', 'gap']) for (let m = 0; m < tl.months; m++) if (tl[k][m] < -1e-9) { negs.push(`${k}[${m}]=${tl[k][m]}`); break; }
  let maxSplit = 0; let maxGapErr = 0;
  for (let m = 0; m < tl.months; m++) {
    maxSplit = Math.max(maxSplit, Math.abs(tl.grid[m] + tl.firm[m] + tl.bess[m] - tl.supply[m]));
    maxGapErr = Math.max(maxGapErr, Math.abs(tl.gap[m] - Math.max(0, tl.design[m] - tl.supply[m])));
  }
  console.log('  timeline negatives:', negs.length ? negs.join('; ') : 'none', '| max |grid+firm+bess-supply|', maxSplit.toExponential(2), '| max gap error', maxGapErr.toExponential(2));
  console.log('  timeline grid MW first/last month', tl.grid[0].toFixed(1), tl.grid[tl.months - 1].toFixed(1), '| bess (bridge) max', Math.max(...tl.bess).toFixed(2), '| firm max', Math.max(...tl.firm).toFixed(2), '| design max', Math.max(...tl.design).toFixed(2));
  // per-year audits
  const RECK = ['re', 'ppa', 'dis', 'ch', 'firm', 'grid', 'gridCharge', 'unmet', 'curt', 'exp', 'cap', 'chpCredit', 'flex', 'demand'];
  const pairs = [['re', 'reGenMWh'], ['ppa', 'ppaDeliveredMWh'], ['dis', 'bessDischargeMWh'], ['ch', 'bessChargeMWh'], ['firm', 'firmMWh'], ['unmet', 'unmetMWh'], ['curt', 'curtailMWh'], ['exp', 'exportMWh'], ['net', 'netDemandMWh'], ['gross', 'grossDemandMWh'], ['chpCredit', 'chpCreditMWh'], ['flex', 'flexMWh']];
  for (let y = 0; y < I.years.length; y++) {
    const Y = I.years[y]; const B = Y.balance; const Ev = Y.engine; const hr = Y.hourly;
    const issues = [];
    for (const k of RECK) { let mn = Infinity; for (let h = 0; h < hr[k].length; h++) if (hr[k][h] < mn) mn = hr[k][h]; if (mn < -1e-9) issues.push(`${k} min ${mn.toExponential(2)}`); }
    let mnSoc = Infinity, mxSoc = -Infinity; for (let h = 0; h < hr.soc.length; h++) { if (hr.soc[h] < mnSoc) mnSoc = hr.soc[h]; if (hr.soc[h] > mxSoc) mxSoc = hr.soc[h]; }
    if (mnSoc < -1e-9 || mxSoc > I.bess.mwh + 1e-6) issues.push(`soc range [${mnSoc.toFixed(3)}, ${mxSoc.toFixed(3)}] vs ${I.bess.mwh.toFixed(3)} MWh`);
    const pairDiffs = pairs.map(([bk, ek]) => { const a = bk === 'net' ? B.net : bk === 'gross' ? B.gross : B[bk]; return Math.abs(a - Ev[ek]); });
    const maxPair = Math.max(...pairDiffs);
    const gridDiff = Math.abs(B.gridLoad + B.gridCharge - Ev.gridMWh);
    const cmp = run.options.find((o) => o.id === opt.id).dispatch.years[y];
    const runDiff = Math.max(Math.abs(Ev.gridMWh - cmp.gridMWh), Math.abs(Ev.firmMWh - cmp.firmMWh), Math.abs(Ev.unmetMWh - cmp.unmetMWh), Math.abs(Ev.reGenMWh - cmp.reGenMWh), Math.abs(Ev.bessDischargeMWh - cmp.bessDischargeMWh));
    const wk = E.weekPresets(hr);
    const wkOk = wk.every((p) => Number.isInteger(p.week) && p.week >= 1 && p.week <= 52);
    console.log(`  year ${y + 1}: net ${B.net.toFixed(0)} MWh, unmet ${B.unmet.toFixed(2)} MWh (${B.unmetHours} h), residual ${B.residual.toExponential(1)}, max hourly ${B.maxHourlyResidual.toExponential(1)}, balance vs engine max diff ${maxPair.toExponential(1)}, grid diff ${gridDiff.toExponential(1)}, run diff ${runDiff.toExponential(1)}, presets ${wk.map((p) => p.id + ':' + p.week).join(',')} ${wkOk ? '' : 'BAD WEEK'} ${issues.length ? 'ISSUES: ' + issues.join('; ') : ''}`);
  }
  // Zero-load detection for year 1 when the first phase arrives late
  const zeroLoadYears = I.years.filter((Y) => Math.abs(Y.balance.net) < 1e-9).map((Y) => Y.index + 1);
  if (zeroLoadYears.length) {
    const Y0 = I.years[0];
    console.log('  zero-load years (1-based):', zeroLoadYears.join(','), '| year 1 balance: in', Y0.balance.in.toFixed(3), 'out', Y0.balance.out.toFixed(3), 'ch', Y0.balance.ch.toFixed(3), 'gridCharge', Y0.balance.gridCharge.toFixed(3), 'ppa', Y0.balance.ppa.toFixed(3), 'curt', Y0.balance.curt.toFixed(3), 'exp', Y0.balance.exp.toFixed(3));
    const rec0 = Y0.hourly; console.log('  year 1 presets', JSON.stringify(E.weekPresets(rec0)));
  }
  if (label.startsWith('(a)')) console.log('  islanded: grid MWh (all years)', I.years.map((Y) => Y.balance.gridLoad.toFixed(1)).join(','), '| PPA MWh', I.years.map((Y) => Y.balance.ppa.toFixed(1)).join(','), '| unmet MWh', I.years.map((Y) => Y.balance.unmet.toFixed(0)).join(','), '| timeline grid max', Math.max(...tl.grid).toFixed(2));
}
