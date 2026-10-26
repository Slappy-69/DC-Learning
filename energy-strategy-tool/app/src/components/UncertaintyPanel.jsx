import React, { useEffect, useRef, useState } from 'react';
import { monteCarloSteps, mcSamples, mcOptions, mcScreening } from '../engine/montecarlo.js';
import { normalizeInputs } from '../engine/defaults.js';
import { UnverifiedTag } from './Field.jsx';
import { sig, perMWh, monthLabel } from '../format.js';
import { siteFor } from './SiteView.jsx';

// Uncertainty, Monte Carlo (BRIEF §13.1–13.2; work package 18; OPEN-QUESTIONS 98–104). Run on request; the steps run in
// slices of about 25 ms so the page stays responsive, and the table fills in every ten samples. The run, its scores and
// its ranking are never changed.

const mcCache = new Map();
let latest = null;
export const mcKey = (run) => `${run.inputHash || ''}|${JSON.stringify(run.scoring.weights)}|${run.inputs.settings.costMetric}|${run.inputs.settings.carbonMetric}|${run.inputs.settings.rankCompliantFirst ? 1 : 0}`;
// The finished Monte Carlo for the run on screen, if there is one (header, summary, PDF).
export function latestMonteCarlo(run) {
  if (!latest || !run || latest.key !== mcKey(run) || !latest.result.complete) return null;
  return latest.result;
}

const pc = (x) => `${Math.round(x * 100)} %`;
const pc1 = (x) => `${(x * 100).toFixed(1)} %`;
const SAMPLE_CHOICES = [100, 300, 1000];
// Time for n re-runs: about 2 ms each in Node and about 5 ms in a browser with representative days (measured on T1, work
// package 18 and check H6); the full year takes roughly 2.5 to 3 times as long (about 6 ms a re-run in Node).
const estimateSeconds = (reRuns) => { const k = mcScreening() ? 1 : 2.75; return [Math.max(1, Math.round(reRuns * 0.002 * k)), Math.max(2, Math.round(reRuns * 0.005 * k))]; };

export default function UncertaintyPanel({ run, onResult = null }) {
  const key = mcKey(run);
  const [samples, setSamples] = useState(() => mcSamples());
  const ck = `${key}|${samples}`;
  const [state, setState] = useState(() => ({ ck, ...(mcCache.get(ck) || {}) }));
  const timer = useRef(null);
  useEffect(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (state.ck !== ck) setState({ ck, ...(mcCache.get(ck) || {}) });
  }, [ck]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const start = () => {
    if (state.busy) return;
    let it;
    try { it = monteCarloSteps(run, { site: siteFor(normalizeInputs(run.inputs)), samples }); } catch (e) { setState({ ck, error: String(e && e.message ? e.message : e) }); return; }
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const t0 = now();
    setState({ ck, busy: true, progress: { done: 0, total: 1, label: 'starting' } });
    const tick = () => {
      try {
        const t1 = now();
        let r = it.next();
        let partial = null;
        while (!r.done && now() - t1 < 25) { if (r.value.partial) partial = r.value.partial; r = it.next(); }
        if (r.done) {
          const v = { result: r.value, ms: now() - t0 };
          mcCache.set(ck, v);
          while (mcCache.size > 4) mcCache.delete(mcCache.keys().next().value);
          latest = { key, result: r.value };
          setState({ ck, ...v });
          if (onResult) onResult();
          timer.current = null;
          return;
        }
        if (r.value.partial) partial = r.value.partial;
        setState((s) => (s.ck === ck ? { ...s, progress: r.value, ...(partial ? { partial } : {}) } : s));
        timer.current = setTimeout(tick, 0);
      } catch (e) {
        setState({ ck, error: String(e && e.message ? e.message : e) });
        timer.current = null;
      }
    };
    timer.current = setTimeout(tick, 0);
  };
  const mine = state.ck === ck;
  const busy = mine && state.busy;
  const p = mine ? state.progress : null;
  const mc = mine ? (state.result || (busy ? state.partial : null)) : null;
  const start0 = (run.meta && run.meta.analysisStart) || run.inputs.project.analysisStart;
  const leaderRow = mc ? mc.rows.find((r) => r.id === mc.leaderId) : null;
  const robust = mc ? mc.rows.find((r) => r.id === mc.robustPickId) : null;
  const dates = (b) => (b.n ? `${monthLabel(start0, Math.round(b.p10))} – ${monthLabel(start0, Math.round(b.p90))}` : 'not reached');
  return (
    <section className="mc" aria-labelledby="mc-h">
      <h3 id="mc-h">Uncertainty (Monte Carlo)</h3>
      <p className="dv-intro">The inputs that describe the world rather than the design (grid date, prices, carbon, costs and performance) are drawn together from their ranges, and the {mcOptions()} leading options are re-run in each sample. The table gives each option's P10, P50 and P90, how often it leads and how often it is in the top three. The run, its scores and ranks are not changed.</p>
      <div className="btn-row">
        <label className="small site-pick">Samples{' '}
          <select id="mc-samples" value={samples} disabled={busy} onChange={(e) => setSamples(Number(e.target.value))}>
            {[...new Set([...SAMPLE_CHOICES, mcSamples()])].sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n.toLocaleString('en-GB')}</option>)}
          </select>
        </label>
        <button type="button" className="chip-btn mc-run" onClick={start} disabled={busy}>{busy ? 'Running…' : mine && state.result ? 'Run again' : 'Run uncertainty'}</button>
      </div>
      <p className="mc-note" role="status" aria-live="polite">
        {busy && p ? `Re-running ${p.done.toLocaleString('en-GB')} of ${p.total.toLocaleString('en-GB')}: ${p.label}.`
          : mine && state.error ? `Could not run: ${state.error}`
            : mc ? `Done: ${mc.samples.toLocaleString('en-GB')} samples × ${mc.rows.length} options${state.ms != null ? ` in ${sig(state.ms / 1000, 2)} s` : ''}, ${mc.screening ? 'representative-day dispatch' : 'full-year dispatch'}.`
              : `${(samples * mcOptions()).toLocaleString('en-GB')} re-runs; about ${estimateSeconds(samples * mcOptions()).join('–')} s on this device.`}
      </p>
      {mc ? (
        <>
          {leaderRow ? (
            <p className="small mc-lead">
              {busy ? <em>Partial, {mc.samples} of {mc.samplesPlanned} samples. </em> : null}
              <strong>#1 leads in {pc(leaderRow.pRank1)}</strong> of the samples and is in the top three in {pc(leaderRow.pTop3)}. Robust pick (most often within {Math.round(mc.band * 100)} % of the best score in its sample): <strong>#{robust.rank}</strong>{robust.id === mc.leaderId ? ', the leader itself' : `, not the leader (within the band in ${robust.nRobust} of ${mc.samples} samples, against ${leaderRow.nRobust} for #1; read the margin in samples, a gap of a few samples is within the noise of sampling)`}.
            </p>
          ) : null}
          <div className="dv-scroll" role="region" aria-label="Monte Carlo results" tabIndex={0}>
            <table className="mini mc-table dv-num">
              <caption className="sr-only">For each option: how often it leads, is in the top three and is within the robust band, and the P10, P50 and P90 of its score, LCOE, carbon and full-load date</caption>
              <thead><tr><th scope="col">Option</th><th scope="col">Leads · top 3</th><th scope="col">Within {Math.round(mc.band * 100)} %</th><th scope="col">Score P10 · P50 · P90</th><th scope="col">LCOE P10 · P50 · P90</th><th scope="col">Carbon P50 (g/kWh)</th><th scope="col">Full load P10 – P90</th><th scope="col">Adequate</th></tr></thead>
              <tbody>
                {mc.rows.map((r) => (
                  <tr key={r.id} data-option={r.id}>
                    <th scope="row" title={r.name}>#{r.rank}</th>
                    <td>
                      <span className="mc-bar" aria-hidden="true"><span className="mc-bar-1" style={{ width: `${r.pRank1 * 100}%` }} /><span className="mc-bar-3" style={{ width: `${Math.max(0, r.pTop3 - r.pRank1) * 100}%` }} /></span>
                      {pc(r.pRank1)} · {pc(r.pTop3)}
                    </td>
                    <td>{pc1(r.pRobust)}</td>
                    <td>{sig(r.scoreBand.p10, 3)} · {sig(r.scoreBand.p50, 3)} · {sig(r.scoreBand.p90, 3)}</td>
                    <td>{perMWh(r.lcoe.p10)} · {perMWh(r.lcoe.p50)} · {perMWh(r.lcoe.p90)}</td>
                    <td>{sig(r.carbon.p50, 3)}</td>
                    <td>{dates(r.fullLoadM)}{r.fullLoadM.nonFinite ? ` (not reached in ${r.fullLoadM.nonFinite})` : ''}</td>
                    <td>{pc(r.pAdequate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mc-drivers">
            <summary>Inputs sampled ({mc.drivers.length})</summary>
            <ul className="plain small">{mc.drivers.map((d) => <li key={d.id}>{d.label}: P10 {sig(d.values.p10, 3)}, P50 {sig(d.values.p50, 3)}, P90 {sig(d.values.p90, 3)}{d.widened ? ' (range widened to include the value you entered, which lies outside the record\'s range)' : ''} · <UnverifiedTag path={d.record} compact /></li>)}</ul>
          </details>
          <ul className="dv-notes">
            <li>Each input is triangular between its low and high value, with the current value as the most likely; Latin hypercube sampling with a fixed seed ({mc.seed}), so the same run gives the same samples. Grid and gas price move together (ρ {mc.correlations.find((c) => c.b === 'gas-price')?.rho ?? '—'}), and so do the capex factors (ρ {mc.correlations.find((c) => c.b === 'bess-capex')?.rho ?? '—'}) <UnverifiedTag path="uncertainty.correlationPrices" compact />. Not sampled: the IT load, the evaluation period and the flexibility trigger, which are the engineer's choices.</li>
            <li>Order in each sample as in the ranking: power adequacy first, then the weighted score on the run's axis scales (not clipped). Scores are on that scale, so P10–P90 can pass 100. {mc.screening ? 'Dispatch on representative days (§9.1): adequacy is approximate, and so is the order of the options; now and then the option that leads a sample is not the one a full-year run would put first. The full-year setting (uncertainty.screening off) takes roughly 2.5 to 3 times as long.' : 'Dispatch over the full year.'} Robust band <UnverifiedTag path="uncertainty.robustBand" compact />.</li>
          </ul>
        </>
      ) : null}
    </section>
  );
}
