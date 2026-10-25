// 46. Work package 18: uncertainty by Monte Carlo (BRIEF §13.1–13.2; OPEN-QUESTIONS 98–104, answered 2026-10-25 with
// Claude's recommendations, accepted in advance by the owner).

import assert from 'node:assert/strict';
import { normalizeInputs } from '../src/engine/defaults.js';
import { buildContext } from '../src/engine/context.js';
import { evaluateOption } from '../src/engine/option.js';
import { representativeHours } from '../src/engine/dispatch.js';
import { axisMetrics, axisScore, SCORE_KEYS } from '../src/engine/scoring.js';
import { TORNADO_DRIVERS } from '../src/engine/sensitivity.js';
import { driverBase } from '../src/engine/breakeven.js';
import { monteCarlo, latinHypercube, triangular, normInv, normCdf, MC_DRIVER_IDS, mcCorrelations } from '../src/engine/montecarlo.js';
import { plainSummary, SUMMARY_WORD_LIMIT } from '../src/engine/summary.js';
import { buildReport } from '../src/report/report.js';
import { pdfPageTexts } from '../src/report/pdf.js';

// Spearman rank correlation.
function spearman(a, b) {
  const rk = (x) => { const idx = x.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(x.length); idx.forEach(([, i], k) => { r[i] = k; }); return r; };
  const ra = rk(a), rb = rk(b), n = a.length, m = (n - 1) / 2;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (ra[i] - m) * (rb[i] - m); da += (ra[i] - m) ** 2; db += (rb[i] - m) ** 2; }
  return num / Math.sqrt(da * db);
}

export async function monteCarloTests(test, ctxRuns) {
  await test('46. Monte Carlo (work package 18, BRIEF §13.1–13.2): Latin hypercube with one sample per stratum, triangular inputs, correlated prices and capex; each sample re-runs the leading options and orders them as the ranking does (a sample re-run on its own gives the same figures); the probabilities add up; the robust pick and the P10/P50/P90 are the samples\' own; deterministic; the run unchanged; in the summary and the PDF', () => {
    const out = [];
    // Building blocks.
    assert.ok(Math.abs(normCdf(normInv(0.975)) - 0.975) < 1e-6 && Math.abs(normInv(0.5)) < 1e-9 && Math.abs(normInv(0.8413447) - 1) < 1e-4);
    assert.equal(triangular(0, 1, 2, 4), 1); assert.equal(triangular(1, 1, 2, 4), 4);
    assert.ok(Math.abs(triangular(1 / 3, 1, 2, 4) - 2) < 1e-12, 'mode at the share (mode − low) ÷ (high − low)');
    const n = 300;
    const U = latinHypercube(n, MC_DRIVER_IDS, 12345);
    const correlated = new Set(mcCorrelations().map((c) => c[1]));
    for (const id of MC_DRIVER_IDS) {
      assert.equal(U[id].length, n);
      assert.ok(U[id].every((u) => u > 0 && u < 1));
      if (!correlated.has(id)) assert.deepEqual(U[id].map((u) => Math.floor(u * n)).sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i), `${id}: not one sample per stratum`);
    }
    const rhoP = spearman(U['grid-price'], U['gas-price']), rhoC = spearman(U.capex, U['bess-capex']), rho0 = spearman(U['grid-price'], U.wacc);
    assert.ok(rhoP > 0.45 && rhoP < 0.75 && rhoC > 0.7 && rhoC < 0.9 && Math.abs(rho0) < 0.15, `rank correlations ${rhoP.toFixed(2)}, ${rhoC.toFixed(2)}, ${rho0.toFixed(2)}`);
    out.push(`LHS ${n} × ${MC_DRIVER_IDS.length}: one sample per stratum; rank correlation grid–gas price ${rhoP.toFixed(2)} (ρ 0.6), capex–battery capex ${rhoC.toFixed(2)} (ρ 0.8), unrelated ${rho0.toFixed(2)}`);
    // The Monte Carlo on T1 (100 samples of the top 20, representative days).
    const run = ctxRuns.runT1;
    const before = run.options.map((o) => `${o.id}:${o.rank}:${o.score}`).join('|');
    const t0 = Date.now();
    const mc = monteCarlo(run, { site: run.ctx.site, samples: 100, nOptions: 20 });
    const ms = Date.now() - t0;
    assert.ok(mc.complete && mc.samples === 100 && mc.rows.length === 20);
    assert.ok(Math.abs(mc.rows.reduce((a, r) => a + r.pRank1, 0) - 1) < 1e-9, 'P(leads) does not add up to 1');
    assert.ok(Math.abs(mc.rows.reduce((a, r) => a + r.pTop3, 0) - 3) < 1e-9, 'P(top 3) does not add up to 3');
    for (const r of mc.rows) {
      for (const b of [r.lcoe, r.npv, r.capex, r.carbon, r.scoreBand]) assert.ok(b.p10 <= b.p50 + 1e-9 && b.p50 <= b.p90 + 1e-9);
      assert.ok(r.pRank1 <= r.pTop3 + 1e-12 && r.pRobust >= 0 && r.pRobust <= 1);
    }
    const rb = mc.rows.find((r) => r.id === mc.robustPickId);
    assert.ok(mc.rows.every((r) => r.pRobust < rb.pRobust || (r.pRobust === rb.pRobust && (r.pRank1 < rb.pRank1 || (r.pRank1 === rb.pRank1 && r.rank >= rb.rank)))), 'robust pick is not the most often within the band');
    // A sample re-run on its own gives the same figures and order.
    const inputs = normalizeInputs(run.inputs);
    const ctx0 = buildContext(normalizeInputs(inputs), { site: run.ctx.site });
    const w = run.scoring.weights, R = run.scoring.ranges;
    const line = (m) => SCORE_KEYS.reduce((a, k) => a + w[k] * axisScore(k, m[k], R[k].lo, R[k].hi), 0);
    for (const fs of mc.firstSamples.slice(0, 2)) {
      const inp = normalizeInputs(inputs);
      for (const d of TORNADO_DRIVERS.filter((x) => MC_DRIVER_IDS.includes(x.id))) d.apply(inp, fs.values[d.id], ctx0);
      const ctx = buildContext(inp, { site: run.ctx.site });
      const rep = representativeHours(ctx);
      for (const id of [mc.rows[0].id, mc.rows[5].id]) {
        const o = run.options.find((x) => x.id === id);
        const e = evaluateOption(ctx, o.v, { rep, skipLayout: true });
        assert.ok(Math.abs(e.eco.lcoe - fs.lcoe[id]) < 1e-9 * e.eco.lcoe, `${id}: LCOE ${e.eco.lcoe} against ${fs.lcoe[id]}`);
        assert.ok(Math.abs(line(axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, inputs.settings)) - fs.score[id]) < 1e-9);
      }
      // Every driver value lies in its range.
      for (const d of TORNADO_DRIVERS.filter((x) => MC_DRIVER_IDS.includes(x.id))) {
        const [lo, hi] = d.range(inputs), b0 = driverBase(d, inputs), x = fs.values[d.id];
        assert.ok(x >= Math.min(lo, b0) - 0.5 && x <= Math.max(hi, b0) + 0.5, `${d.id} ${x} outside ${lo}…${hi}`);
      }
    }
    // Skipping the layout changes no figure the ranking reads (site fit cannot rank in T1).
    const L = run.options.find((o) => o.rank === 1);
    const eA = evaluateOption(ctx0, L.v), eB = evaluateOption(ctx0, L.v, { skipLayout: true });
    assert.equal(eA.eco.lcoe, eB.eco.lcoe); assert.equal(eA.deliv.score, eB.deliv.score); assert.equal(eA.carb.locationG, eB.carb.locationG);
    // Deterministic; the run unchanged.
    assert.equal(JSON.stringify(monteCarlo(run, { site: run.ctx.site, samples: 100, nOptions: 20 })), JSON.stringify(mc));
    assert.equal(run.options.map((o) => `${o.id}:${o.rank}:${o.score}`).join('|'), before, 'the run changed');
    const lr = mc.rows.find((r) => r.id === mc.leaderId);
    out.push(`T1, 100 samples × 20 options in ${(ms / 1000).toFixed(1)} s: #1 leads in ${Math.round(lr.pRank1 * 100)} %, top three ${Math.round(lr.pTop3 * 100)} %, LCOE P10–P90 €${lr.lcoe.p10.toFixed(0)}–${lr.lcoe.p90.toFixed(0)}/MWh; robust pick #${rb.rank}; a sample re-run alone matches; deterministic; the run unchanged`);
    // The summary and the PDF.
    const sm = plainSummary(run, { monteCarlo: mc });
    assert.ok(sm.usedMonteCarlo && sm.words <= SUMMARY_WORD_LIMIT && !sm.notRun.includes('the Monte Carlo'));
    assert.ok(sm.parts[3].text.includes(`In 100 Monte Carlo samples it leads in ${Math.round(lr.pRank1 * 100)} %`), sm.parts[3].text);
    assert.ok(sm.parts[0].text.includes('Monte Carlo samples its LCOE is') || sm.details.leader.some((t) => /Monte Carlo samples its LCOE/.test(t)));
    assert.ok(!plainSummary(run, { monteCarlo: { ...mc, complete: false } }).usedMonteCarlo, 'a partial Monte Carlo used');
    const created = new Date('2026-10-25T12:00:00Z');
    const flat = (r) => pdfPageTexts(r.bytes).join(' ').replace(/\s+/g, ' ');
    const pdf = flat(buildReport(run, { created, monteCarlo: mc }));
    assert.ok(pdf.includes('Uncertainty (Monte Carlo)') && pdf.includes(`#1 leads in ${Math.round(lr.pRank1 * 100)} % of samples`));
    assert.ok(flat(buildReport(run, { created })).includes('The Monte Carlo was not run for this report'));
    out.push('in the summary (parts 1 and 4) and the PDF');
    return out.join('; ') + '.';
  });
}
