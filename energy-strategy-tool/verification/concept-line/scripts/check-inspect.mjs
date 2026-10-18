import { referenceT1, referenceT3, runModel, inspectOption, weekPresets } from './dc-learning/energy-strategy-tool/app/src/engine/index.js';
for (const [name, mk] of [['T1', referenceT1], ['T3', referenceT3]]) {
  const run = runModel(mk(), { source: 'x' });
  const o = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
  const t0 = Date.now();
  const I = inspectOption(run.inputs, o.v);
  const ms = Date.now() - t0;
  let maxRel = 0;
  I.years.forEach((y, i) => {
    const r = o.dispatch.years[i];
    for (const k of ['gridMWh', 'firmMWh', 'unmetMWh', 'reGenMWh', 'bessDischargeMWh', 'curtailMWh']) {
      const d = Math.abs(y.engine[k] - r[k]) / Math.max(1, Math.abs(r[k]));
      if (d > maxRel) maxRel = d;
    }
  });
  const b = I.years.map((y) => y.balance);
  const cross = I.years.map((y) => {
    const B = y.balance, E = y.engine;
    return Math.max(Math.abs(B.re - E.reGenMWh), Math.abs(B.ppa - E.ppaDeliveredMWh), Math.abs(B.dis - E.bessDischargeMWh), Math.abs(B.firm - E.firmMWh),
      Math.abs(B.gridLoad + B.gridCharge - E.gridMWh), Math.abs(B.gridCharge - E.gridChargeMWh), Math.abs(B.unmet - E.unmetMWh), Math.abs(B.net - E.netDemandMWh),
      Math.abs(B.ch - E.bessChargeMWh), Math.abs(B.curt - E.curtailMWh), Math.abs(B.exp - E.exportMWh));
  });
  console.log(`${name} ${o.name}\n  inspect ${ms} ms; years ${I.years.length} (explicit ${I.nExplicit}); vs run: max rel diff ${maxRel.toExponential(1)}; hourly-sum vs engine annual: max abs ${Math.max(...cross).toExponential(1)} MWh`);
  console.log(`  annual residual (MWh): ${b.map((x) => x.residual.toExponential(1)).join(', ')}; max hourly residual ${Math.max(...b.map((x) => x.maxHourlyResidual)).toExponential(1)}`);
  console.log(`  ttp: run metric ${o.ttp.metric.toFixed(4)} vs inspect ${I.ttp.metric.toFixed(4)}; gap sum ${I.timeline.gap.reduce((a, c) => a + c, 0).toFixed(3)} vs ttp.gapMWm ${I.ttp.gapMWm.toFixed(3)}; firstPower ${I.ttp.firstPowerM}, fullLoad ${I.ttp.fullLoadM}, fullGridM ${I.fullGridM}`);
  console.log(`  year 1 presets: ${JSON.stringify(weekPresets(I.years[0].hourly))}; unmet MWh by year: ${I.years.map((y) => Math.round(y.balance.unmet)).join(', ')}`);
}
