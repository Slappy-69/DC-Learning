// Eemshaven study (owner's request 2026-10-31): a 750 MW IT campus on the Oostpolder next to Google's Eemshaven (GRQ)
// campus, as several large single-storey buildings in Google's style. Inputs are researched where a source exists and
// labelled judgement where not (see README.md). Run from this folder: node eemshaven.mjs <epw file> [out dir]
import fs from 'node:fs';
const E = new URL('../../app/src/engine/', import.meta.url).href;
const R = new URL('../../app/src/report/', import.meta.url).href;
const { buildDefaultInputs, runModel, studyFile, readEpw } = await import(E + 'index.js');
const { addMonths } = await import(E + 'dates.js');
const { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } = await import(E + 'sensitivity.js');
const { breakevens, nearestFlips } = await import(E + 'breakeven.js');
const { monteCarlo } = await import(E + 'montecarlo.js');
const { plainSummary } = await import(E + 'summary.js');
const { buildReport } = await import(R + 'report.js');

const [epwPath, outDir = new URL('./out/', import.meta.url).pathname] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

export function eemshavenInputs({ weather = null, gridFull = '2033-01', cooling = 'evap' } = {}) {
  const inputs = buildDefaultInputs({ analysisStart: '2027-01' });
  const s = inputs.project.analysisStart;
  inputs.project.name = 'Eemshaven 750 MW IT campus (Oostpolder)';
  inputs.project.lat = 53.425; inputs.project.lon = 6.875; // Oostpolder, south of the port, next to Google (approximate)
  inputs.project.country = 'NL';
  inputs.site.areaHa = 120; // judgement: Google-style single-storey halls with yards and setbacks
  inputs.load.itMW = 750;
  // Six 125 MW IT buildings, one every 9 months from January 2029 (Google builds in numbered phases; "fase 6" permitted 2025).
  inputs.load.phases = Array.from({ length: 6 }, (_, i) => ({ itMW: 125, date: addMonths(s, 24 + 9 * i) }));
  inputs.load.coolingApproach = cooling; // Google GRQ: cooling towers on industrial surface water (Google, 2021)
  // Grid: TenneT; regional grid congested for large consumers until the 110 kV expansion of 2032–2034 (TenneT, 17 April
  // 2025). A 750 MW campus needs a 380/220 kV connection: assumed nothing before 2033 (judgement, tested by breakevens).
  inputs.grid.nowMW = 0; inputs.grid.fullMW = 950; inputs.grid.fullDate = gridFull;
  inputs.utilities.gasAvailable = 'Yes'; inputs.utilities.gasDateMonths = 0; // Gasunie grid and the Eemshaven LNG terminal
  inputs.utilities.ppaInclude = true; inputs.utilities.ppaType = 'hybrid'; inputs.utilities.ppaCoverage = 100;
  if (weather) inputs.weather = weather;
  return inputs;
}

function brief(run, tag) {
  const by = [...run.options].sort((a, b) => a.rank - b.rank);
  const adequate = run.options.filter((o) => o.adequacy.adequate).length;
  const rows = by.slice(0, 8).map((o) => ({
    rank: o.rank, id: o.id, name: o.name, score: +o.score.toFixed(2), lcoe: +o.eco.lcoe.toFixed(1), capexM: Math.round(o.eco.capex / 1e6),
    npvM: Math.round(o.eco.npvCost / 1e6), carbonLoc: Math.round(o.carbon.locationG), ttp: o.ttp, adequate: o.adequacy.adequate,
    designMW: +o.sz.designMW.toFixed(1), peakPUE: +o.sz.peakPUE.toFixed(3), check50: o.sz.check50 ? { MW: +o.sz.check50.designMW.toFixed(1), pue: +o.sz.check50.peakPUE.toFixed(3) } : null,
    majorFlags: o.flags.filter((f) => f.severity === 'major').map((f) => f.message), minorFlags: o.flags.filter((f) => f.severity === 'minor').map((f) => f.message),
  }));
  return { tag, options: run.options.length, adequate, runFlags: run.runFlags.map((f) => f.message), top: rows };
}

const t0 = Date.now();
const epw = epwPath ? readEpw(fs.readFileSync(epwPath, 'utf8'), epwPath.split('/').pop()) : null;
if (epw && !epw.ok) throw new Error(epw.error);
const base = eemshavenInputs({ weather: epw ? epw.weather : null });
const run = runModel(base);
const out = { base: brief(run, epw ? 'measured weather (EPW)' : 'synthetic weather'), seconds: (Date.now() - t0) / 1000 };
const L = run.options.find((o) => o.rank === 1);
out.leaderSizing = L.sz.sentences;
out.leaderFlags = L.flags.map((f) => `${f.severity} · ${f.category}: ${f.message}`);
const site = run.ctx.site;
const tor = tornado(run, L.id, { site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
out.tornado = tor.rows.map((r) => ({ label: r.label, low: r.low.text, high: r.high.text, lcoeLow: +r.low.lcoe.toFixed(1), lcoeHigh: +r.high.lcoe.toFixed(1) }));
const be = breakevens(run, { site });
out.breakevens = { competitors: be.competitors.map((c) => `#${c.rank} ${c.name}`), flips: nearestFlips(be, Infinity).map((f) => f.text) };
const mc = monteCarlo(run, { site, samples: 300 });
const lr = mc.rows.find((r) => r.id === L.id);
out.monteCarlo = { leaderFirst: +(lr.pRank1 * 100).toFixed(1), leaderTop3: +(lr.pTop3 * 100).toFixed(1), lcoeP10: +lr.lcoe.p10.toFixed(1), lcoeP50: +lr.lcoe.p50.toFixed(1), lcoeP90: +lr.lcoe.p90.toFixed(1),
  others: mc.rows.filter((r) => r.id !== L.id && r.pRank1 > 0).map((r) => `#${r.rank} ${(r.pRank1 * 100).toFixed(1)} %`), robust: mc.rows.find((r) => r.id === mc.robustPickId).rank, level: mc.robustLevelWithId ? mc.rows.find((r) => r.id === mc.robustLevelWithId).rank : null };
const sm = plainSummary(run, { sensitivity: tor, breakevens: be, monteCarlo: mc });
out.summary = sm.text;
// Variants: grid two years earlier and later; synthetic weather; DLC instead of evaporative.
for (const [tag, opts] of [['grid 2031', { gridFull: '2031-01' }], ['grid 2035', { gridFull: '2035-01' }], ['synthetic weather', { weatherOff: true }], ['DLC cooling', { cooling: 'dlc' }]]) {
  const r = runModel(eemshavenInputs({ weather: opts.weatherOff || !epw ? null : epw.weather, gridFull: opts.gridFull || '2033-01', cooling: opts.cooling || 'evap' }));
  out[tag] = brief(r, tag);
}
const rep = buildReport(run, { sensitivity: tor, created: new Date(), breakevens: be, monteCarlo: mc });
fs.writeFileSync(outDir + 'eemshaven-tool-report.pdf', rep.bytes);
fs.writeFileSync(outDir + 'eemshaven.study.json', JSON.stringify(studyFile(base, run, { savedAt: new Date() })));
fs.writeFileSync(outDir + 'results.json', JSON.stringify(out, null, 1));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s; PDF ${rep.pages} pages`);
console.log(JSON.stringify({ base: out.base.top.slice(0, 3).map((o) => `#${o.rank} ${o.name} €${o.lcoe}`), adequate: out.base.adequate, mc: out.monteCarlo, flips: out.breakevens.flips }, null, 1));
