// Pego study, revision 3: scenario runs with the study build of the current app.
// Usage: node runs.mjs <scenario> [model]   (model: full | repDays; default repDays with the best 20 verified)
import fs from 'node:fs';
const E = new URL('./app/src/engine/', import.meta.url).href;
const D = await import(E + 'defaults.js');
const { runModel } = await import(E + 'run.js');
const { topCards, prosCons } = await import(E + 'cards.js');
const { addMonths } = await import(E + 'dates.js');
const M = JSON.parse(fs.readFileSync(new URL('./market.json', import.meta.url)));

// Portuguese forward prices, 2029-2036 (OMIP base load, settled 21 Oct 2026): mean of the eight calendar years.
const fwd = ['2029', '2030', '2031', '2032', '2033', '2034', '2035', '2036'].map((y) => M.omipPtBase.cal[y]);
const FWD_MEAN = fwd.reduce((a, b) => a + b, 0) / fwd.length;
const PT_WHOLESALE = 66; // the tool's Portugal default (Electricity Maps 2025)
const SCEN = {
  base: { label: 'Tool defaults (Portugal)', f: () => {} },
  market: { label: 'Portuguese forward prices', f: (i) => { i.grid.priceMultiplier = FWD_MEAN / PT_WHOLESALE; i.grid.priceAdder = 15; i.utilities.gasPrice = 35; } },
  crisis: { label: 'Gas crisis persists', f: (i) => { i.grid.priceMultiplier = M.omipPtBase.cal['2027'] / PT_WHOLESALE; i.grid.priceAdder = 15; i.utilities.gasPrice = M.pvbGas.spot; } },
  gridLate: { label: 'Grid two years late (2032)', f: (i) => { i.grid.fullDate = addMonths(i.project.analysisStart, 60); } },
  grid600: { label: 'Grid 600 MW', f: (i) => { i.grid.fullMW = 600; i.grid.connectionCharge = 600 * 120000; } },
  six: { label: 'Six buildings', pego: { buildings: 6 }, f: () => {} },
  eight: { label: 'Eight buildings', pego: { buildings: 8 }, f: () => {} },
  gridOnly3: { label: 'Three buildings from 2030', pego: { buildings: 3, firstMonth: 36 }, f: () => {} },
};
export function scenarioInputs(name) {
  const s = SCEN[name];
  const inp = D.referencePego({ ...(s.pego ? { pego: s.pego } : {}), study: process.env.STUDY !== '0' });
  s.f(inp);
  return inp;
}
const r1 = (x) => Math.round(x * 10) / 10;
export function summary(o) {
  const sz = o.sizing || {};
  const last = o.dispatch && o.dispatch.years ? o.dispatch.years[o.dispatch.years.length - 1] : null;
  const lines = {};
  for (const l of o.eco.capexLines || []) lines[l.item] = (lines[l.item] || 0) + l.amount;
  return {
    id: o.id, rank: o.rank, name: o.name, v: o.v, score: o.score, model: o.model, verified: !!o.verified,
    adequate: !!(o.adequacy && o.adequacy.adequate), adequacy: o.adequacy,
    lcoe: o.eco.lcoe, npv: o.eco.npvCost, capex: o.eco.capex, byPeriod: o.eco.byPeriod, capexLines: lines, contingency: o.eco.contingency,
    opex: o.eco.opexByCat || null,
    loc: o.carbon.locationG, mkt: o.carbon.marketG, cfe: o.carbon.cfePct,
    ttp: o.ttp, unmet: o.unmet, res: o.resilience && o.resilience.status, deliv: o.deliv && o.deliv.score,
    design: sz.designMW, critical: sz.criticalMW, backup: sz.backup && { tech: sz.backup.tech, units: sz.backup.units, mw: sz.backup.mw, fuelM3: sz.backup.fuelM3 },
    bridge: sz.bridge && { tech: sz.bridge.tech, units: sz.bridge.units, mw: sz.bridge.mw, avail: sz.bridge.availMonth },
    prime: sz.prime && { tech: sz.prime.tech, units: sz.prime.units, mw: sz.prime.mw, avail: sz.prime.availMonth },
    storage: sz.storage, solarRoofMWp: sz.solarRoofMWp,
    sentences: sz.sentences,
    last: last && { year: last.year, demandGWh: r1(last.grossDemandMWh / 1000), gridGWh: r1(last.gridMWh / 1000), ppaGWh: r1((last.ppaDeliveredMWh || 0) / 1000),
      plants: (last.plants || []).map((p) => ({ tech: p.tech, role: p.role, gwh: r1(p.mwh / 1000), hours: Math.round(p.hours), curtGWh: r1((p.mslCurtailMWh || 0) / 1000) })) },
    years: o.dispatch && o.dispatch.years ? o.dispatch.years.map((y) => ({ year: y.year, demandGWh: r1(y.grossDemandMWh / 1000), gridGWh: r1(y.gridMWh / 1000), unmetMWh: Math.round(y.unmetMWh || 0),
      plants: (y.plants || []).map((p) => ({ tech: p.tech, gwh: r1(p.mwh / 1000), curtGWh: r1((p.mslCurtailMWh || 0) / 1000) })) })) : null,
    flags: (o.flags || []).filter((f) => f.severity !== 'info').map((f) => `${f.severity}:${f.id}`),
    assumed: (o.flags || []).filter((f) => f.assumed).map((f) => f.path || f.id),
  };
}
// Named strategies: the best-ranked option of each pattern.
export const PATTERNS = {
  gridOnly: { label: 'Grid only', m: (v) => v.C1 === 'wait' && v.C4 === 'none' },
  v1: { label: 'CCGT from mid-2028, kept as prime (v1)', m: (v) => v.C1 === 'bridge' && v.C2 === 'ccgt' && v.C3 === 'prime' && v.C4 === 'none' },
  rec2: { label: 'Rented gensets, then grid, then CCGT from 2031 (rev 2 recommendation)', m: (v) => v.C1 === 'bridge' && v.C2 === 'rented' && v.C3 === 'remove' && v.C4 === 'ccgt' },
  ccgtTopAny: { label: 'Any bridge, then CCGT top-up from 2031', m: (v) => v.C4 === 'ccgt' && v.C1 === 'bridge' },
  engines: { label: 'New gas engines kept (prime or split)', m: (v) => v.C1 === 'bridge' && v.C2 === 'gasRecip' && (v.C3 === 'prime' || v.C3 === 'split') && v.C4 === 'none' },
  enginesTop: { label: 'New gas engines top-up', m: (v) => v.C4 === 'gasRecip' && v.C4s === 'shortfall' },
  turbines: { label: 'New gas turbines kept', m: (v) => v.C1 === 'bridge' && v.C2 === 'gasTurbine' && (v.C3 === 'prime' || v.C3 === 'split') && v.C4 === 'none' },
  fuelCells: { label: 'Fuel cells', m: (v) => v.C4 === 'fuelCell' || (v.C2 === 'fuelCell' && (v.C3 === 'prime' || v.C3 === 'split')) },
  chp: { label: 'Gas CHP trigeneration', m: (v) => v.C4 === 'chp' },
  hvoPrime: { label: 'HVO-diesel prime kept', m: (v) => v.C2 === 'dieselPrime' && (v.C3 === 'prime' || v.C3 === 'split') },
  islanded: { label: 'Islanded', m: (v) => v.C1 === 'islanded' },
};
export function pick(run) {
  const byRank = [...run.options].sort((a, b) => a.rank - b.rank);
  const out = {};
  for (const [k, p] of Object.entries(PATTERNS)) { const o = byRank.find((x) => p.m(x.v)); out[k] = o ? summary(o) : null; }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2] || 'base';
  const model = process.argv[3] || 'repDays';
  const inp = scenarioInputs(name);
  if (process.env.W) { const [c, k, t, d] = process.env.W.split(',').map(Number); inp.weights = { ...inp.weights, cost: c, carbon: k, ttp: t, deliverability: d }; }
  if (process.env.C5) inp.choices.C5 = { state: 'locked', values: process.env.C5.split(',') };
  const tag = (process.env.TAG ? '-' + process.env.TAG : '');
  inp.settings.screeningModel = model;
  if (model === 'repDays') inp.settings.verifyTop = 20;
  const t0 = Date.now();
  const run = runModel(inp);
  const ms = Date.now() - t0;
  const byRank = [...run.options].sort((a, b) => a.rank - b.rank);
  const tc = topCards(run.options);
  const cards = tc.cards.map((c) => ({ id: c.o.id, rank: c.o.rank, strategy: c.strategy, pros: c.pros.map((x) => x.text), cons: c.cons.map((x) => x.text), majorFlags: c.majorFlags.map((f) => f.text || f.id), summary: summary(c.o) }));
  const res = {
    scenario: name, label: SCEN[name].label, model, seconds: ms / 1000, n: run.options.length,
    adequate: run.options.filter((o) => o.adequacy && o.adequacy.adequate).length,
    generated: run.generation ? { total: run.generation.total, afterRules: run.generation.afterRules, sampled: run.generation.sampled, removed: run.generation.removedByRule, keys: Object.keys(run.generation) } : null,
    rules: run.rules, timing: run.timing,
    runFlags: run.runFlags.map((f) => ({ id: f.id, text: f.text || f.message })),
    verification: run.verification && { verified: run.verification.verified, rounds: run.verification.rounds, agreement: run.verification.agreement },
    designTemp: run.ctx && run.ctx.prof ? run.ctx.prof.designTemp : null,
    top: byRank.slice(0, 20).map(summary), cards, named: pick(run),
    shortfall: run.shortfall || null,
  };
  res.all = run.options.map((o) => ({ id: o.id, rank: o.rank, v: o.v, name: o.name, score: o.score, lcoe: o.eco.lcoe, npv: o.eco.npvCost, capex: o.eco.capex, loc: o.carbon.locationG, mkt: o.carbon.marketG, cfe: o.carbon.cfePct,
    ttp: o.ttp.metric, first: o.ttp.firstPowerM, deliv: o.deliv.score, adequate: !!o.adequacy.adequate, res: o.resilience.status, verified: !!o.verified, unmetMWh: o.unmet ? o.unmet.mwh : null,
    major: o.flags.filter((f) => f.severity === 'major').map((f) => f.id) }));
  res.weights = run.inputs.weights;
  fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
  fs.writeFileSync(new URL(`./out/${name}-${model}${tag}.json`, import.meta.url), JSON.stringify(res, null, 1));
  console.log(name, model, (ms / 1000).toFixed(1), 's; adequate', res.adequate, 'of', res.n, '; leader', byRank[0].id, byRank[0].name, byRank[0].eco.lcoe.toFixed(1));
  for (const [k, s] of Object.entries(res.named)) console.log(' ', k.padEnd(11), s ? `#${s.rank} ${s.adequate ? 'A' : '-'} ${s.lcoe.toFixed(1)} €/MWh ${Math.round(s.capex / 1e6)} m ${Math.round(s.loc)} g | ${s.name}` : 'none');
}
