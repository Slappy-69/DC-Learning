// Pego study, revision 3: named strategies on equal terms (same secondary choices), every scenario, full-year model.
// Usage: node strategies.mjs [scenario ...]   -> out/strategies.json (merged)
import fs from 'node:fs';
const E = new URL('./app/src/engine/', import.meta.url).href;
const D = await import(E + 'defaults.js');
const { buildContext } = await import(E + 'context.js');
const { evaluateOption } = await import(E + 'option.js');
const { coolingProfile } = await import(E + 'profiles.js');
const G = await import(E + 'generator.js');
const { scenarioInputs, summary } = await import('./runs.mjs');

const BASE = { C5a: 'perBuilding', C6: 'N+1', C7: '48', C8: 'dlc', C9: 'roof', C10: 'roof', C11: 'none', C12: 'none', C12r: 'peakShave', C13: 'hybrid', C14: '50', C15: 'none', C16: 'off', C17: 'AIS', C18: 'single', C19: 'perPhase', C20: 'none', C4s: 'shortfall' };
export const STRATS = {
  gridOnly: { label: 'Grid only', short: 'Grid only', v: { C1: 'wait', C4: 'none', C5: 'hvo' } },
  v1: { label: 'CCGT from mid-2028, then grid; CCGT kept (rev 1)', short: 'CCGT from 2028', v: { C1: 'bridge', C2: 'ccgt', C3: 'prime', C4: 'none', C5: 'hvo' } },
  rented: { label: 'Rented gas gensets 2029, grid 2030, CCGT from 2031 (rev 2)', short: 'Rent, then CCGT 2031', v: { C1: 'bridge', C2: 'rented', C3: 'remove', C4: 'ccgt', C5: 'hvo' } },
  hvoKeep: { label: 'HVO gensets bought for 2029, kept as the standby fleet; grid 2030; CCGT from 2031', short: 'Buy HVO gensets, keep as standby; CCGT 2031', v: { C1: 'bridge', C2: 'dieselPrime', C3: 'backup', C4: 'ccgt', C5: 'retained' } },
  enginesSell: { label: 'Gas engines bought for 2029, sold when the grid comes; CCGT from 2031', short: 'Buy gas engines, sell on; CCGT 2031', v: { C1: 'bridge', C2: 'gasRecip', C3: 'remove', C4: 'ccgt', C5: 'hvo' } },
  enginesTop: { label: 'Rented gas gensets 2029, then new gas engines for everything above the grid; HVO standby', short: 'New gas engines top-up', v: { C1: 'bridge', C2: 'rented', C3: 'remove', C4: 'gasRecip', C5: 'hvo' } },
  enginesAll: { label: 'New gas engines as prime and as backup (the tool\'s #1)', short: 'Gas engines, prime and backup', v: { C1: 'bridge', C2: 'gasRecip', C3: 'prime', C4: 'none', C5: 'retained' } },
  turbines: { label: 'New gas turbines, the share above the grid kept running; HVO standby', short: 'New gas turbines', v: { C1: 'bridge', C2: 'gasTurbine', C3: 'split', C4: 'none', C5: 'hvo' } },
  fuelCells: { label: 'Rented gas gensets 2029, then fuel cells for everything above the grid; HVO standby', short: 'Fuel cells top-up', v: { C1: 'bridge', C2: 'rented', C3: 'remove', C4: 'fuelCell', C5: 'hvo' } },
  chp: { label: 'Rented bridge, then gas CHP trigeneration, HVO standby', short: 'CHP trigeneration', v: { C1: 'bridge', C2: 'rented', C3: 'remove', C4: 'chp', C4s: 'shortfall', C5: 'hvo' } },
};
export function optionV(k) { return G.canonical({ ...BASE, ...STRATS[k].v }); }

export function contextFor(name, { designTemp = null, ccgtDerate = 0, msl0 = false } = {}) {
  const inputs = D.normalizeInputs(scenarioInputs(name));
  const ctx = buildContext(inputs);
  if (designTemp != null) {
    ctx.prof = { ...ctx.prof, designTemp };
    for (const id of Object.keys(ctx.cooling)) ctx.cooling[id] = { ...ctx.cooling[id], coolPeak: coolingProfile(D.COOLING[id], ctx.prof).coolPeak };
    ctx.designDayCache = new Map();
  }
  const r1 = setDerate(ccgtDerate);
  const saved = ['ccgt', 'ccgtTop'].map((id) => D.TECH[id].p.msl);
  if (msl0) for (const id of ['ccgt', 'ccgtTop']) D.TECH[id].p.msl = 0;
  return { inputs, ctx, restore: () => { r1(); ['ccgt', 'ccgtTop'].forEach((id, i) => { D.TECH[id].p.msl = saved[i]; }); } };
}
// Hot-day CCGT output: both CCGT records' unit rating reduced (restored by the returned function).
function setDerate(f) {
  const saved = ['ccgt', 'ccgtTop'].map((id) => [id, D.TECH[id].p.unitMW.value ?? D.TECH[id].p.unitMW]);
  if (f) for (const id of ['ccgt', 'ccgtTop']) { const p = D.TECH[id].p; if (typeof p.unitMW === 'object') p.unitMW = { ...p.unitMW, value: 427.5 * (1 - f) }; else p.unitMW = 427.5 * (1 - f); }
  return () => { for (const [id, v] of saved) { const p = D.TECH[id].p; if (typeof p.unitMW === 'object') p.unitMW = { ...p.unitMW, value: v }; else p.unitMW = v; } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const which = process.argv.slice(2);
  const scen = which.length ? which : ['base', 'market', 'crisis', 'gridLate', 'grid600'];
  const outF = new URL('./out/strategies.json', import.meta.url);
  const all = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF)) : {};
  for (const s of scen) {
    const [name, variant] = s.split(':');
    const opts = variant === 'hot45' ? { designTemp: 45, ccgtDerate: 0.13 } : variant === 'hot45nd' ? { designTemp: 45 } : variant === 'msl0' ? { msl0: true } : {};
    const { ctx, restore } = contextFor(name, opts);
    all[s] = {};
    for (const k of Object.keys(STRATS)) {
      const v = optionV(k);
      const t0 = Date.now();
      const e = evaluateOption(ctx, v);
      const o = { id: k, rank: 0, name: STRATS[k].label, v, score: 0, model: 'Full-year hourly (8760 h)', eco: e.eco, carbon: e.carb, ttp: e.ttp, adequacy: e.adequacy, unmet: e.unmet, resilience: e.res, deliv: e.deliv, sizing: e.sz, dispatch: e.disp, flags: e.flags };
      const sm = summary(o);
      sm.siteFit = e.siteFit && { status: e.siteFit.status, landTakeHa: e.siteFit.landTakeHa, netHa: e.siteFit.netM2 / 1e4, unplaced: e.siteFit.unplaced.length };
      all[s][k] = sm;
      process.stdout.write(`${s.padEnd(14)} ${k.padEnd(13)} ${sm.adequate ? 'A' : '-'} LCOE ${sm.lcoe.toFixed(1)} capex ${Math.round(sm.capex / 1e6)} m loc ${Math.round(sm.loc)} g unmet ${Math.round(sm.unmet.mwh)} MWh design ${Math.round(sm.design)} (${Date.now() - t0} ms)\n`);
    }
    restore();
  }
  fs.writeFileSync(outF, JSON.stringify(all, null, 1));
}
