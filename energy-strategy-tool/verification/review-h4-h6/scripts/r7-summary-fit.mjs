// Opus review H4-H6, script r7: which sentences the 250-word fit removes from the summary on T1, as more analyses are
// run on the leader (none; tornado; tornado + breakevens; tornado + breakevens + Monte Carlo), and whether the leader's
// major flags and the nearest breakevens survive in the main text.
const APP = new URL('../../../app/src/', import.meta.url).href;
const { referenceT1 } = await import(`${APP}engine/defaults.js`);
const { runModel } = await import(`${APP}engine/run.js`);
const { tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS } = await import(`${APP}engine/sensitivity.js`);
const { breakevens } = await import(`${APP}engine/breakeven.js`);
const { monteCarlo } = await import(`${APP}engine/montecarlo.js`);
const { plainSummary } = await import(`${APP}engine/summary.js`);
const run = runModel(referenceT1());
const site = run.ctx.site;
const L = run.options.find((o) => o.rank === 1);
const majors = L.flags.filter((f) => f.severity === 'major' && !f.assumed);
console.log(`leader ${L.id}: major flags ${majors.map((f) => `${f.id} (${f.category})`).join(', ') || 'none'}`);
const tor = tornado(run, L.id, { site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
const be = breakevens(run, { site });
const mc = monteCarlo(run, { site, samples: 300 });
for (const [tag, o] of [['nothing run', {}], ['tornado', { sensitivity: tor }], ['tornado + breakevens', { sensitivity: tor, breakevens: be }], ['breakevens + Monte Carlo', { breakevens: be, monteCarlo: mc }], ['tornado + breakevens + Monte Carlo', { sensitivity: tor, breakevens: be, monteCarlo: mc }]]) {
  const s = plainSummary(run, o);
  const flags = s.parts.find((p) => p.id === 'flags').text, change = s.parts.find((p) => p.id === 'change').text;
  console.log(`\n[${tag}] ${s.words} words; moved ${s.moved.length}`);
  console.log(`  flags part: "${flags}"`);
  console.log(`  IED (major) named in the main text: ${/IED|aggregat/i.test(s.text)}; "Other flags" count line: ${/Other flags/.test(s.text)}; breakevens in part 5: ${/Breakevens/.test(change)}`);
  for (const t of s.moved) console.log(`  moved: ${t.slice(0, 150)}`);
}
