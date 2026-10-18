const E = await import('/tmp/claude-0/-home-claude/3ded6fb1-dffa-5614-ab8f-4144dc966e9a/scratchpad/dc-learning/energy-strategy-tool/app/src/engine/index.js');
const base = E.referenceT1();
base.choices.C1 = { state: 'open', values: ['wait', 'bridge', 'islanded', 'export'] };
base.choices.C2 = { state: 'open', values: ['gasRecip', 'fuelCell', 'rented', 'bessSolar', 'dieselPrime'] };
base.choices.C12 = { state: 'open', values: ['none', '2h25'] };
const inputs = E.normalizeInputs(base);
const gen = E.generateOptions(inputs).options;
const ctx = E.buildContext(inputs);
for (const c1 of ['islanded', 'bridge']) {
  const o = gen.find((x) => x.v.C2 === 'bessSolar' && x.v.C1 === c1 && x.v.C12 === '2h25' && x.v.C4 === 'none' && x.v.C13 === 'none' && x.v.C16 === 'off');
  if (!o) { console.log(c1, 'none'); continue; }
  const sz = E.sizeOption(ctx, o.v); const cfg = E.dispatchConfig(ctx, o.v, sz);
  const I = E.inspectOption(inputs, o.v);
  const tl = I.timeline;
  const unmetByMonth = []; const y = I.years[1].hourly;
  for (let m = 12; m < 24; m++) { let s = 0; for (let h = (m - 12) * 730; h < (m - 12 + 1) * 730 && h < 8760; h++) s += y.unmet[h]; unmetByMonth.push(`${m}:${s.toFixed(0)}`); }
  let disBefore = 0; for (let h = 0; h < 8760; h++) if (Math.floor(h / 730) + 12 < cfg.bessAvailM) disBefore += y.dis[h];
  console.log(`${c1}/bessSolar/C12=2h25: bridge MW ${sz.bridgeBess.mw.toFixed(1)}, total storage MW ${sz.storage.mw.toFixed(1)}; dispatch bessAvailM ${cfg.bessAvailM} (month index); timeline bess[m=0..2] ${Array.from(tl.bess.slice(0, 3)).map((x) => x.toFixed(1)).join(',')}; ttp first power ${I.ttp.firstPowerM}, full ${I.ttp.fullLoadM}, gap ${I.ttp.gapMWm.toFixed(1)}; first phase month ${ctx.firstPhaseM}`);
  console.log('   year 2 unmet MWh by model month 12..23:', unmetByMonth.join(' '), '| year 2 battery discharge before month', cfg.bessAvailM, ':', disBefore.toFixed(1), 'MWh; year 2 unmet total', I.years[1].balance.unmet.toFixed(0));
}
