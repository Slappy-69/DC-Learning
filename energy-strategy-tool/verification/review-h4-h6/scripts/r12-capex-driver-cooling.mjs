// Opus review H4-H6, script r12: the "Capex (every line)" driver (tornado, breakevens, Monte Carlo) and the cooling
// capex delta line, which evaluate.js books directly into the ledger, not through addCapex.
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1, normalizeInputs } = await import(`${APP}defaults.js`);
const { runModel } = await import(`${APP}run.js`);
const { buildContext } = await import(`${APP}context.js`);
const { evaluateOption } = await import(`${APP}option.js`);
const run = runModel(referenceT1());
const by = run.options.slice().sort((a, b) => a.rank - b.rank);
const pick = ['evap', 'dlc', 'immersion', 'air'].map((c) => by.find((o) => o.v.C8 === c)).filter(Boolean);
const ctxAt = (f) => { const i = normalizeInputs(run.inputs); i.economics.capexFactor = f; return buildContext(i, { site: run.ctx.site }); };
const c1 = ctxAt(1), c15 = ctxAt(1.5);
for (const o of pick) {
  const a = evaluateOption(c1, o.v, { skipLayout: true }), b = evaluateOption(c15, o.v, { skipLayout: true });
  const cool = (e) => e.eco.capexLines.filter((l) => /^Cooling capex delta/.test(l.item)).reduce((s, l) => s + l.amount, 0);
  const other = (e) => e.eco.capexLines.filter((l) => !/^Cooling capex delta/.test(l.item)).reduce((s, l) => s + l.amount, 0);
  console.log(`#${o.rank} ${o.v.C8}: cooling delta EUR ${(cool(a) / 1e6).toFixed(2)} m at x1 and ${(cool(b) / 1e6).toFixed(2)} m at x1.5; other lines x${(other(b) / other(a)).toFixed(3)}; total capex x${(b.eco.capexExContingency / a.eco.capexExContingency).toFixed(3)}; LCOE ${a.eco.lcoe.toFixed(2)} -> ${b.eco.lcoe.toFixed(2)}`);
}
