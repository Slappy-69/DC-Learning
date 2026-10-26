// Uncertainty: Monte Carlo over the leading options (BRIEF §13.1–13.2; work package 18; OPEN-QUESTIONS 98–104, answered
// 2026-10-25 with Claude's recommendations, accepted in advance by the owner).
//
// The uncertain inputs are the tornado drivers that describe the world rather than the design (grid date, prices, carbon,
// costs, performance; not the IT load, the evaluation period or the flexibility trigger, which the engineer sets). Each has
// a triangular distribution (low, current, high) from its §18 record. Latin hypercube sampling, seeded, so a run gives
// the same samples every time; the grid and gas prices are correlated (ρ 0.6) and the three capex factors (ρ 0.8), by a
// normal copula on the hypercube. In each sample all drivers move together, the leading options are re-run with the
// representative-day dispatch (§9.1 screening tier) or the full year, and they are put in the ranking's order on the
// run's own axis scales (as the breakevens do). Out: P10/P50/P90 of each option's figures, the probability that each
// leads and is in the top three, and the robust pick: the option most often within the robust band (1 %, a run setting) of
// the best score in its sample. The run itself is never changed. Pure: no UI, no browser APIs.

import { buildContext } from './context.js';
import { normalizeInputs, registryValue } from './defaults.js';
import { buildSiteModel, siteKey } from './site.js';
import { evaluateOption } from './option.js';
import { axisMetrics, axisScore, SCORE_KEYS } from './scoring.js';
import { TORNADO_DRIVERS } from './sensitivity.js';
import { driverBase } from './breakeven.js';
import { representativeHours } from './dispatch.js';
import { mulberry32, subSeed, shuffle } from './prng.js';

// Drivers sampled (OPEN-QUESTIONS 98): every tornado driver except the engineer's own design choices.
export const MC_DRIVER_IDS = ['grid-date', 'grid-price', 'grid-carbon', 'gas-price', 'carbon-price', 'wacc', 'capex', 'capacity-factors', 'pue', 'bess-capex', 'grid-capex', 'escalation', 'test-hours'];
// Correlation groups (§13.1, indicative — unverified): pairs and their coefficient; each pair is correlated to its first
// driver through a normal copula.
export const mcCorrelations = () => {
  const p = Number(registryValue('uncertainty.correlationPrices')), c = Number(registryValue('uncertainty.correlationCapex'));
  return [['grid-price', 'gas-price', p], ['capex', 'bess-capex', c], ['capex', 'grid-capex', c]].filter((x) => Number.isFinite(x[2]) && Math.abs(x[2]) < 1);
};

const num = (path, lo, hi, dflt) => { const x = Number(registryValue(path)); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : dflt; };
export const mcSamples = () => Math.round(num('uncertainty.samples', 20, 2000, 300));
export const mcOptions = () => Math.round(num('uncertainty.options', 2, 50, 20));
export const mcRobustBand = () => num('uncertainty.robustBand', 0, 0.5, 0.01);
export const mcSeed = () => Math.round(num('uncertainty.seed', 0, 2 ** 31, 20261025));
export const mcScreening = () => registryValue('uncertainty.screening') !== false;

// Inverse normal CDF (Acklam's approximation, relative error below 1.2e-9) and the normal CDF (Abramowitz–Stegun 7.1.26
// via erf, error below 1.5e-7), enough for a copula on 300 samples.
export function normInv(p) {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
export function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
// Triangular distribution (low, mode, high) at the quantile u.
export function triangular(u, lo, mode, hi) {
  if (!(hi > lo)) return mode;
  const m = Math.min(hi, Math.max(lo, mode));
  const f = (m - lo) / (hi - lo);
  return u < f ? lo + Math.sqrt(u * (hi - lo) * (m - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - m));
}

// Latin hypercube quantiles: n samples × the drivers, one stratum per sample on each driver, the strata shuffled with a
// seeded generator, a random point inside each stratum; then the correlated pairs through a normal copula.
export function latinHypercube(n, ids, seed, correlations = mcCorrelations()) {
  const U = {};
  for (const id of ids) {
    const rand = mulberry32(subSeed(seed, id));
    const strata = shuffle(Array.from({ length: n }, (_, i) => i), rand);
    U[id] = strata.map((k) => (k + rand()) / n);
  }
  for (const [a, b, rho] of correlations) {
    if (!U[a] || !U[b]) continue;
    U[b] = U[b].map((ub, i) => { const za = normInv(U[a][i]), zb = normInv(ub); return normCdf(rho * za + Math.sqrt(1 - rho * rho) * zb); });
  }
  return U;
}

const pctl = (sorted, p) => {
  if (!sorted.length) return NaN;
  const x = (sorted.length - 1) * p, i = Math.floor(x), f = x - i;
  return i + 1 < sorted.length ? sorted[i] + f * (sorted[i + 1] - sorted[i]) : sorted[i];
};
const band = (xs) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return { p10: pctl(s, 0.1), p50: pctl(s, 0.5), p90: pctl(s, 0.9), n: s.length, nonFinite: xs.length - s.length }; };

// The Monte Carlo as a generator yielding { done, total, label } after each re-run (the UI runs it in time slices and
// shows partial results: `partial` holds the summary so far every tenth sample); monteCarlo() drains it.
export function* monteCarloSteps(run, { site = null, samples = mcSamples(), nOptions = mcOptions(), seed = mcSeed(), screening = mcScreening(), every = 10 } = {}) {
  const inputs = normalizeInputs(run.inputs);
  const weights = run.scoring.weights, ranges = run.scoring.ranges, settings = inputs.settings;
  const compliantFirst = !!(run.inputs.settings && run.inputs.settings.rankCompliantFirst);
  const opts = run.options.slice().sort((a, b) => a.rank - b.rank).filter((o, i) => i < nOptions || o.pinned);
  const drivers = TORNADO_DRIVERS.filter((d) => MC_DRIVER_IDS.includes(d.id));
  const U = latinHypercube(samples, drivers.map((d) => d.id), seed);
  // An input whose current value lies outside its record's range is sampled over a range widened to include it (H6, LOW-2).
  const widened = new Set(drivers.filter((d) => { const [lo, hi] = d.range(inputs); const b0 = driverBase(d, inputs); return b0 < lo || b0 > hi; }).map((d) => d.id));
  const baseSite = site && site.key === siteKey(inputs) ? site : buildSiteModel(inputs);
  // The layout changes no figure the ranking reads unless site fit can rank (the rule of run.js, work package 13).
  const skipLayout = !(inputs.deliverability.siteFitPenalty || inputs.settings.rankCompliantFirst) || !!(run.layoutSummary && run.layoutSummary.onDemand);
  const ctx0 = buildContext(normalizeInputs(inputs), { site: baseSite });
  const lineScore = (m) => SCORE_KEYS.reduce((a, k) => a + weights[k] * (ranges[k] ? axisScore(k, m[k], ranges[k].lo, ranges[k].hi) : 0), 0);
  const per = new Map(opts.map((o) => [o.id, { lcoe: [], npv: [], capex: [], carbon: [], firstPowerM: [], fullLoadM: [], score: [], rank1: 0, top3: 0, robust: 0, adequate: 0 }]));
  const values = [];
  const firstSamples = []; // the first three samples in full, so a test can re-run one on its own
  const total = samples * opts.length;
  let done = 0;
  const summarise = (nDone) => ({ ...summariseMC(run, opts, per, nDone, values, drivers, { samples, seed, screening, skipLayout, widened }), firstSamples });
  for (let i = 0; i < samples; i++) {
    const inp = normalizeInputs(inputs);
    const vals = {};
    for (const d of drivers) {
      const [lo, hi] = d.range(inputs);
      const b0 = driverBase(d, inputs);
      let x = triangular(U[d.id][i], Math.min(lo, b0), b0, Math.max(hi, b0));
      if (d.id === 'grid-date' || d.id === 'test-hours') x = Math.round(x);
      vals[d.id] = x;
      d.apply(inp, x, ctx0);
    }
    values.push(vals);
    const ctx = buildContext(inp, { site: siteKey(inp) === baseSite.key ? baseSite : null });
    const rep = screening ? representativeHours(ctx) : null;
    const res = [];
    for (const o of opts) {
      const e = evaluateOption(ctx, o.v, { rep, skipLayout });
      const m = axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, settings);
      const r = { o, line: lineScore(m), adequate: e.adequacy ? e.adequacy.adequate !== false : true, compliant: !(e.res && e.res.status === 'Does not meet') };
      const p = per.get(o.id);
      p.lcoe.push(e.eco.lcoe); p.npv.push(e.eco.npvCost); p.capex.push(e.eco.capex); p.carbon.push(e.carb.locationG);
      p.firstPowerM.push(e.ttp.firstPowerM ?? NaN); p.fullLoadM.push(e.ttp.fullLoadM ?? NaN); p.score.push(r.line);
      if (r.adequate) p.adequate++;
      res.push(r);
      done++;
      yield { done, total, label: `sample ${i + 1} of ${samples}: #${o.rank}` };
    }
    // The ranking's order in this sample: adequacy, compliance (when that setting is on), score, option code.
    res.sort((a, b) => (b.adequate - a.adequate) || (compliantFirst ? (b.compliant - a.compliant) : 0) || (b.line - a.line) || (a.o.id < b.o.id ? -1 : 1));
    per.get(res[0].o.id).rank1++;
    for (const r of res.slice(0, 3)) per.get(r.o.id).top3++;
    // Robust: within the band of the best score among the options in the sample's first group.
    const best = res[0];
    const head = res.filter((r) => r.adequate === best.adequate && (!compliantFirst || r.compliant === best.compliant));
    for (const r of head) if (r.line >= best.line - mcRobustBand() * Math.abs(best.line)) per.get(r.o.id).robust++;
    if (i < 3) firstSamples.push({ values: vals, lcoe: Object.fromEntries(opts.map((o) => [o.id, per.get(o.id).lcoe[i]])), score: Object.fromEntries(opts.map((o) => [o.id, per.get(o.id).score[i]])), order: res.map((r) => r.o.id) });
    if ((i + 1) % every === 0 && i + 1 < samples) yield { done, total, label: `sample ${i + 1} of ${samples}`, partial: summarise(i + 1) };
  }
  return summarise(samples);
}

function summariseMC(run, opts, per, n, values, drivers, meta) {
  const rows = opts.map((o) => {
    const p = per.get(o.id);
    return {
      id: o.id, rank: o.rank, name: o.name, score: o.score,
      lcoe: band(p.lcoe), npv: band(p.npv), capex: band(p.capex), carbon: band(p.carbon), firstPowerM: band(p.firstPowerM), fullLoadM: band(p.fullLoadM), scoreBand: band(p.score),
      pRank1: p.rank1 / n, pTop3: p.top3 / n, pRobust: p.robust / n, pAdequate: p.adequate / n,
      nRobust: p.robust, // the counts behind the shares, so a one-sample margin can be shown as such (H6, MED-3)
    };
  });
  // Ties go to the option that leads more often, then to the better rank.
  const byRobust = rows.slice().sort((a, b) => b.pRobust - a.pRobust || b.pRank1 - a.pRank1 || a.rank - b.rank);
  const byRank1 = rows.slice().sort((a, b) => b.pRank1 - a.pRank1 || a.rank - b.rank);
  const leader = rows.find((r) => r.rank === Math.min(...rows.map((x) => x.rank)));
  return {
    samples: n, samplesPlanned: meta.samples, seed: meta.seed, screening: meta.screening, skipLayout: meta.skipLayout, band: mcRobustBand(),
    complete: n === meta.samples, correlations: mcCorrelations().map(([a, b, r]) => ({ a, b, rho: r })),
    leaderId: leader ? leader.id : null, rows,
    robustPickId: byRobust.length ? byRobust[0].id : null, mostOftenFirstId: byRank1.length ? byRank1[0].id : null,
    drivers: drivers.map((d) => ({ id: d.id, label: d.label, record: d.record, widened: meta.widened.has(d.id), values: band(values.map((v) => v[d.id])) })),
  };
}

export function monteCarlo(run, opts = {}) {
  const it = monteCarloSteps(run, opts);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}
