// Independent re-computation of the ranking from each option's own figures (not from o.rank / o.score).
import { E, runT1, t1 } from './lib.mjs';
const { run, inputs } = runT1();
const opts = run.options;
const W = { cost: 0.35, carbon: 0.25, ttp: 0.25, deliverability: 0.15 };
const key = (o) => {
  const en = o.sizing.energise;
  return [o.adequacy.adequate !== false, o.deliv.tier !== 'C', o.resilience.status !== 'Does not meet', en ? en.poweredIT : o.sizing.itMW, !en || en.maxLate <= 24];
};
const cmpKey = (a, b) => { for (let i = 0; i < 5; i++) { const x = +a[i], y = +b[i]; if (x !== y) return y - x; } return 0; };
const rows = opts.map((o) => ({ o, k: key(o) }));
rows.sort((a, b) => cmpKey(a.k, b.k));
const best = rows.filter((r) => cmpKey(r.k, rows[0].k) === 0);
const rng = (f) => [Math.min(...best.map(f)), Math.max(...best.map(f))];
const rc = rng((r) => r.o.eco.lcoe), rg = rng((r) => r.o.carbon.locationG);
console.log('leading group size', best.length, 'cost range', rc, 'carbon range', rg);
for (const r of rows) {
  const o = r.o;
  const a = { cost: 100 * (rc[1] - o.eco.lcoe) / (rc[1] - rc[0]), carbon: 100 * (rg[1] - o.carbon.locationG) / (rg[1] - rg[0]), ttp: 100 * (24 - o.sizing.energise.avgLate) / 24, deliverability: o.deliv.score };
  r.raw = Object.keys(W).reduce((s, k) => s + W[k] * a[k], 0);
  r.shown = Object.keys(W).reduce((s, k) => s + W[k] * Math.max(0, Math.min(100, a[k])), 0);
}
rows.sort((a, b) => cmpKey(a.k, b.k) || (b.raw - a.raw) || 0);
let mism = 0, scoreDiff = 0;
rows.forEach((r, i) => { r.myRank = i + 1; if (Math.abs(r.shown - r.o.score) > 1e-6) scoreDiff++; });
// rank ties are broken by other rules; count rank mismatches only where raw scores differ
const byRank = [...opts].sort((a, b) => a.rank - b.rank);
for (let i = 0; i < rows.length; i++) if (rows[i].o !== byRank[i] && Math.abs(rows[i].raw - (rows.find((r) => r.o === byRank[i]).raw)) > 1e-9) mism++;
console.log('options', rows.length, 'rank mismatches (beyond ties)', mism, 'score differences', scoreDiff);
console.log('top 20 identical order:', rows.slice(0, 20).every((r, i) => r.o === byRank[i]));
// groups
const groups = new Map();
for (const r of rows) { const g = JSON.stringify(r.k); groups.set(g, (groups.get(g) || 0) + 1); }
console.log('groups [adequate, likely, resilient, poweredIT, onTime] -> count'); for (const [g, n] of groups) console.log(' ', g, n);
// displayed score against rank order: how often a lower-ranked option shows a higher score than the one above it
let inv = 0, firstInv = null; for (let i = 1; i < byRank.length; i++) if (byRank[i].score > byRank[i - 1].score + 1e-9) { inv++; if (!firstInv) firstInv = [byRank[i - 1].rank, byRank[i - 1].score.toFixed(1), byRank[i].rank, byRank[i].score.toFixed(1)]; }
console.log('places where the shown score rises going down the list:', inv, 'first', firstInv);
const better = byRank.filter((o) => o.rank > 1 && o.score > byRank[0].score).length;
console.log('options ranked below the leader with a higher shown score:', better);
const cheaper = byRank.filter((o) => o.eco.lcoe < byRank[0].eco.lcoe); console.log('options with lower LCOE than leader:', cheaper.length, cheaper.slice(0, 6).map((o) => `${o.rank}:${o.eco.lcoe.toFixed(1)}:${o.sizing.energise.poweredIT}MW:${o.name.slice(0, 40)}`));
// tiers and what was resized
const tiers = {}; for (const o of opts) tiers[o.deliv.tier] = (tiers[o.deliv.tier] || 0) + 1; console.log('tiers', tiers);
const resized = opts.filter((o) => o.sizing.itMW < 100).length; console.log('options sized for less than the 100 MW entered:', resized, 'generated', run.generation.screened, run.generation.totalCombinations, 'validCombinations', run.generation.validCombinations);
// leader vs the "top-up" twin
const a = byRank[0], b = byRank[8];
console.log('leader vs #9: plants', JSON.stringify(a.sizing.plants.map((p) => [p.role, p.tech, p.mw])), JSON.stringify(b.sizing.plants.map((p) => [p.role, p.tech, p.mw, p.mwByMonth ? 'steps' : ''])), 'prime', JSON.stringify(b.sizing.prime && { mw: b.sizing.prime.mw, steps: b.sizing.prime.steps, avail: b.sizing.prime.availMonth }));
const ss = (o) => o.dispatch.years[o.dispatch.years.length - 1];
console.log('steady year firm MWh', ss(a).firmMWh, ss(b).firmMWh, 'hours', ss(a).plants.map((p) => p.hours), ss(b).plants.map((p) => p.hours), 'grid', ss(a).gridMWh, ss(b).gridMWh, 'ppa', ss(a).ppaDeliveredMWh, ss(b).ppaDeliveredMWh);
console.log('mc', E.dispatchConfig(run.ctx, a.v, a.sizing).plants.map((p) => [p.role, p.mc, p.msl, p.unitMW, p.units]), E.dispatchConfig(run.ctx, b.v, b.sizing).plants.map((p) => [p.role, p.mc, p.msl, p.unitMW, p.units]));
// SMR with a longer timeline
const i2 = t1(); i2.settings.timelineMonths = 132;
const smr = opts.find((o) => o.id === 'O1J82PZ7');
const ctx2 = E.buildContext(E.normalizeInputs(i2));
const r2 = E.evaluateOption(ctx2, smr.v);
console.log('SMR, timeline 132 months:', r2 && r2.sizing && JSON.stringify(r2.sizing.energise), r2.eco && r2.eco.lcoe, r2.name);
