// Opus review H4-H6, script r13: is the breakeven "#2 would lead if capex rose to x 1.41" caused by the cooling capex
// delta not being scaled by the capex driver (finding from r12)? Run with the repository engine, and with a scratch
// copy whose only change is that evaluate.js scales the cooling capex delta by the capex factor.
// Usage: node r13-capex-flip-patched.mjs <path to an app/src folder>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const SRC = pathToFileURL(path.resolve(process.argv[2] || new URL('../../../app/src', import.meta.url).pathname) + '/').href;
const { referenceT1, normalizeInputs } = await import(`${SRC}engine/defaults.js`);
const { runModel } = await import(`${SRC}engine/run.js`);
const { buildContext } = await import(`${SRC}engine/context.js`);
const { breakevens, nearestFlips } = await import(`${SRC}engine/breakeven.js`);
const { monteCarlo } = await import(`${SRC}engine/montecarlo.js`);
const { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } = await import(`${SRC}engine/sensitivity.js`);
console.log(`engine: ${process.argv[2] || 'repository'}`);
const base = referenceT1();
const run = runModel(base);
const site = run.ctx.site;
const L = run.options.find((o) => o.rank === 1);
console.log(`T1 leader ${L.id} ${L.score.toFixed(4)} LCOE ${L.eco.lcoe.toFixed(2)}`);
const tor = tornado(run, L.id, { site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
const cr = tor.allRows.find((r) => r.id === 'capex');
console.log(`tornado on #1, capex row: LCOE ${cr.low.lcoe.toFixed(2)} at ${cr.low.text}, ${cr.high.lcoe.toFixed(2)} at ${cr.high.text}`);
const be = breakevens(run, { site });
console.log(`breakevens: drivers ${be.rows.map((r) => r.id).join(', ')}`);
for (const f of nearestFlips(be, Infinity)) console.log(`  flip: ${f.text}`);
const capexRow = be.rows.find((r) => r.id === 'capex');
if (capexRow) for (const c of capexRow.cells) { const comp = be.competitors.find((x) => x.id === c.competitorId); console.log(`  capex vs #${comp.rank}: lower ${c.flips.down ? c.flips.down.text : 'no flip'}; higher ${c.flips.up ? c.flips.up.text : 'no flip'}`); }
const ctx0 = buildContext(normalizeInputs(base), { site });
const d = TORNADO_DRIVERS.find((x) => x.id === 'capex');
for (const x of [1.42, 1.5]) {
  const inp = normalizeInputs(base); d.apply(inp, x, ctx0);
  const r = runModel(inp);
  const lead = r.options.find((o) => o.rank === 1);
  const o2 = r.options.find((o) => o.id === be.competitors[0].id), oL = r.options.find((o) => o.id === L.id);
  console.log(`full re-run at capex x${x}: leader ${lead.id}${lead.id === L.id ? ' (T1 leader)' : ''}; T1 leader #${oL.rank} LCOE ${oL.eco.lcoe.toFixed(2)}; T1 #2 now #${o2.rank} LCOE ${o2.eco.lcoe.toFixed(2)}`);
}
const mc = monteCarlo(run, { site, samples: 300 });
const lr = mc.rows.find((r) => r.id === L.id), r7 = mc.rows.find((r) => r.rank === 7), rb = mc.rows.find((r) => r.id === mc.robustPickId);
console.log(`Monte Carlo 300: #1 leads ${(lr.pRank1 * 100).toFixed(1)} %, #7 (${run.options.find((o) => o.rank === 7).v.C8}) leads ${(r7.pRank1 * 100).toFixed(1)} %; robust pick #${rb.rank} (${rb.nRobust} vs #1 ${lr.nRobust}); #1 LCOE P10-P90 ${lr.lcoe.p10.toFixed(1)}-${lr.lcoe.p90.toFixed(1)}`);
