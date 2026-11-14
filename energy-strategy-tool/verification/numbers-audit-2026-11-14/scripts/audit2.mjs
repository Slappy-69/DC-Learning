// Audit, part 2 (2026-11-14): facts for the findings and the PDF in pounds, built as the app builds it.
// Run from /home/claude/fable-audit:  node scripts/audit2.mjs [--mc]
import { E, runT1, t1 } from './lib.mjs';
import fs from 'node:fs';
import { setDisplayCurrency, perMWh, money } from '../app/src/format.js';
import { topCards } from '../app/src/engine/cards.js';
import { buildReport } from '../app/src/report/report.js';
import { breakevens } from '../app/src/engine/breakeven.js';
import { monteCarlo } from '../app/src/engine/montecarlo.js';
import { visibleFlags } from '../app/src/engine/view.js';

const out = {};
const log = (...a) => { console.log(...a); };
const t0 = Date.now();
const { run, inputs } = runT1();
log('run ms', Date.now() - t0, 'options', run.options.length);
const code = E.displayCurrencyCode(inputs);
setDisplayCurrency(code, E.FX[code]);
log('display', code, E.FX[code]);
const ranked = [...run.options].sort((a, b) => a.rank - b.rank);
const byId = (id) => run.options.find((o) => o.id === id);
const L = ranked[0], ISL = byId('O16HAJCQ'), SMR = byId('O1J82PZ7');
const brief = (o) => ({ rank: o.rank, id: o.id, name: o.name, C1: o.v.C1, C2: o.v.C2, C3: o.v.C3, C4: o.v.C4, C4s: o.v.C4s, starts: o.sizing.energise.starts, late: o.sizing.energise.late, poweredIT: o.sizing.energise.poweredIT,
  fullLoadM: o.ttp.fullLoadM, firstPowerM: o.ttp.firstPowerM, delayFull: o.ttp.delayFull, lcoe: +o.eco.lcoe.toFixed(3), npv: +(o.eco.npvCost / 1e6).toFixed(3), capex: +(o.eco.capex / 1e6).toFixed(3), carbon: +o.carbon.locationG.toFixed(2), score: +o.score.toFixed(3), tier: o.deliv.tier,
  plants: o.sizing.plants.map((p) => `${p.role}:${p.tech}:${p.mw}MW@${p.availMonth ?? ''}`), bridge: o.sizing.bridge && { mw: o.sizing.bridge.mw, avail: o.sizing.bridge.availMonth, shortfallMW: o.sizing.bridge.shortfallMW }, prime: o.sizing.prime && { mw: o.sizing.prime.mw, avail: o.sizing.prime.availMonth, steps: o.sizing.prime.steps } });
out.leader = brief(L);
out.top12 = ranked.slice(0, 12).map(brief);
const W = ranked.find((o) => o.v.C1 === 'wait');
out.waitRef = brief(W);
log('LEADER', JSON.stringify(out.leader));
log('WAIT REF', JSON.stringify(out.waitRef));
for (const o of out.top12) log('TOP', o.rank, o.C1, o.C3, o.C4, o.C4s, o.starts.join(','), 'fullLoad', o.fullLoadM, o.lcoe, o.npv, o.score, o.plants.join(' '), '|', o.name);

// Ledger: leader against #9, year by year (what makes the NPV gap)
const yrs = (o) => o.eco.ledger.map((r) => r.opex + r.capexTotal);
const dl = yrs(L).map((x, i) => x - yrs(W)[i]);
log('leader minus wait-ref, cost by year (EUR m):', dl.map((x) => (x / 1e6).toFixed(2)).join(' '));
const hrs = (o) => o.dispatch.years.map((d) => d.plants.map((p) => `${p.role}:${p.hours}h:${Math.round(p.mwh)}MWh`).join('/'));
log('leader plant hours by dispatched year', JSON.stringify(hrs(L)));
log('wait-ref plant hours by dispatched year', JSON.stringify(hrs(W)));

// The best 75 MW option with no SMR, and the 75 MW group
const g75 = ranked.filter((o) => o.sizing.energise && Math.round(o.sizing.energise.poweredIT) === 75 && o.rankKeys.adequate && o.rankKeys.likely && o.rankKeys.resilient);
const g75n = g75.filter((o) => o.v.C4 !== 'smr');
log('75 MW buildable options', g75.length, 'of which SMR', g75.length - g75n.length);
log('best 75 MW without SMR', JSON.stringify(brief(g75n[0])));
log('cheapest 75 MW without SMR', JSON.stringify(brief(g75n.slice().sort((a, b) => a.eco.lcoe - b.eco.lcoe)[0])));
const smr100 = ranked.filter((o) => o.v.C4 === 'smr').slice(0, 3).map(brief);
log('best SMR options', JSON.stringify(smr100));
// Why 75 MW: the SMR option on a timeline two years longer
const i2 = t1(); i2.settings.timelineMonths = 144;
const ctx2 = E.buildContext(E.normalizeInputs(i2));
const r2 = E.evaluateOption(ctx2, SMR.v);
log('SMR option, timeline 144 months:', JSON.stringify({ starts: r2.sz.energise.starts, late: r2.sz.energise.late, poweredIT: r2.sz.energise.poweredIT, lcoe: r2.eco.lcoe }));
// Plant bought twice (the Pego finding): any option with two purchase lines of the same existing plant, or C2 and C4 the same plant
const valsC = {}; for (const o of run.options) for (const c of ['C2', 'C4', 'C23']) if (o.v[c] && o.v[c] !== 'none' && o.v[c] !== 'n/a') valsC[`${c}=${o.v[c]}`] = (valsC[`${c}=${o.v[c]}`] || 0) + 1;
log('C2/C4/C23 values in T1', JSON.stringify(valsC));
let dbl = 0; const dblEx = [];
for (const o of run.options) { if (!o.eco || !o.eco.capexLines) continue; const seen = new Map(); for (const l of o.eco.capexLines) { if (!/bought|existing|takeover|lease|purchase/i.test(l.item)) continue; const k = l.item.replace(/\(.*?\)/g, ''); seen.set(k, (seen.get(k) || 0) + 1); } for (const [k, n] of seen) if (n > 1) { dbl++; if (dblEx.length < 5) dblEx.push(`${o.rank} ${k} x${n}`); } }
log('options with an existing-plant purchase line twice', dbl, dblEx.join('; '));
const plantInputs = { existing: inputs.existing, plants: inputs.plants && Object.keys(inputs.plants), nearby: (run.ctx.nearbyPlants || []).length };
log('existing plant inputs', JSON.stringify(plantInputs).slice(0, 400));
// Within-group order against the shown score
let inv = 0, invEx = [];
for (let i = 1; i < ranked.length; i++) { const a = ranked[i - 1], b = ranked[i]; if (a.groupRank === b.groupRank && b.score > a.score + 0.05) { inv++; if (invEx.length < 4) invEx.push(`#${a.rank} ${a.score.toFixed(2)} above #${b.rank} ${b.score.toFixed(2)}`); } }
log('within a group, next option shows a higher score (by > 0.05 points):', inv, invEx.join('; '));
// The residual credit of the SMR
const smrRes = SMR.eco.ledger[inputs.economics.periodYears].residual;
log('SMR option residual at year 20 (EUR m)', (smrRes / 1e6).toFixed(1), 'PV', (smrRes / 1.08 ** 20 / 1e6).toFixed(1), 'wacc', run.inputs.economics.wacc);

// Flags as each screen counts them
const cnt = (fl) => ['major', 'minor', 'info'].map((s) => fl.filter((f) => f.severity === s && !f.assumed).length).join(' · ');
for (const [nm, o] of [['leader', L], ['island', ISL], ['smr', SMR]]) log('FLAGS', nm, 'all (Compare, PDF table)', cnt(o.flags), '| visible, Site off (table, detail)', cnt(visibleFlags(o, false)));
const tc = topCards(run.options, 5);
for (const c of tc.cards) log('CARD', c.o.rank, c.step ? 'STEP' : '', c.fallback ? 'FALLBACK' : '', perMWh(c.o.eco.lcoe), money(c.o.eco.capex, 3), 'major flags on card:', c.majorFlags.map((f) => f.id).join(','), '|', c.o.name);

// Tornado (default seven drivers, LCOE) and breakevens for the leader
let t1s = Date.now();
const tor = E.tornado(run, L.id, { site: run.ctx.site, drivers: E.TORNADO_DRIVERS.filter((d) => E.DEFAULT_DRIVER_IDS.includes(d.id)), measure: 'lcoe' });
log('tornado ms', Date.now() - t1s, 'base lcoe', tor.base.lcoe);
for (const r of tor.rows) log('TOR', r.id, r.label, '| low', r.low.text, r.low.lcoe && r.low.lcoe.toFixed(2), '| high', r.high.text, r.high.lcoe && r.high.lcoe.toFixed(2));
t1s = Date.now();
const be = breakevens(run, { site: run.ctx.site });
log('breakeven ms', Date.now() - t1s);
fs.writeFileSync('out/breakevens.json', JSON.stringify(be, null, 1));
let mc = null;
if (process.argv.includes('--mc')) {
  t1s = Date.now();
  mc = monteCarlo(run, { site: run.ctx.site });
  log('monte carlo ms', Date.now() - t1s, 'samples', mc.samples);
  fs.writeFileSync('out/montecarlo.json', JSON.stringify(mc, (k, v) => (v && v.BYTES_PER_ELEMENT ? Array.from(v) : v)));
}
fs.writeFileSync('out/tornado.json', JSON.stringify(tor, null, 1));

// The PDF as the app makes it (App.jsx savePdf, line 258): the compared options, the tornado, the breakevens, the Monte Carlo.
const rep = buildReport(run, { compareIds: [L.id, ISL.id, SMR.id], sensitivity: tor, sensitivityMeasure: 'lcoe', created: new Date('2026-11-14T10:00:00Z'), breakevens: be, monteCarlo: mc, details: {} });
fs.writeFileSync('out/report_audit.pdf', Buffer.from(rep.bytes));
log('PDF pages', rep.pages);
fs.writeFileSync('out/audit2.json', JSON.stringify(out, null, 1));
