// Opus review H4-H6, script r11: rule (o) keeps only the first heat rejection location when there is no rooftop solar,
// because the location "changes no cost, carbon, time-to-power, deliverability or flag". With the Site tab's site-fit
// penalty on (Beta), does the location change deliverability? T2 (6 ha, 15 m height limit), options without rooftop solar.
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT2, normalizeInputs } = await import(`${APP}defaults.js`);
const { buildContext } = await import(`${APP}context.js`);
const { buildSiteModel } = await import(`${APP}site.js`);
const { evaluateOption } = await import(`${APP}option.js`);
const { generateOptions } = await import(`${APP}generator.js`);
const inp = referenceT2();
inp.deliverability.siteFitPenalty = true;
const n = normalizeInputs(inp);
const ctx = buildContext(n, { site: buildSiteModel(n) });
const gen = generateOptions(n);
const none = gen.options.filter((g) => g.v.C10 === 'none').slice(0, 40);
let differ = 0, fitDiffer = 0, scoreSpan = 0;
const ex = [];
for (const g of none) {
  const out = ['roof', 'ground', 'split'].map((c9) => evaluateOption(ctx, { ...g.v, C9: c9 }));
  const d = out.map((e) => e.deliv.score), f = out.map((e) => e.siteFit.status);
  if (new Set(f).size > 1) fitDiffer++;
  if (Math.max(...d) - Math.min(...d) > 1e-9) { differ++; scoreSpan = Math.max(scoreSpan, Math.max(...d) - Math.min(...d)); if (ex.length < 3) ex.push(`${g.v.C9 ?? ''}: site fit ${f.join(' / ')}, deliverability ${d.map((x) => x.toFixed(1)).join(' / ')} (roof / ground / split)`); }
}
console.log(`T2 with the site-fit penalty on, ${none.length} generated options without rooftop solar, each evaluated with C9 = roof, ground and split:`);
console.log(`  site fit differs by location in ${fitDiffer}; deliverability differs in ${differ} (largest spread ${scoreSpan.toFixed(1)} points)`);
for (const x of ex) console.log(`  e.g. ${x}`);
console.log(`  generated C9 values among options without rooftop solar: ${[...new Set(gen.options.filter((g) => g.v.C10 === 'none').map((g) => g.v.C9))].join(', ')}`);
