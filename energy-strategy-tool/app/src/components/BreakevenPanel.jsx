import React, { useEffect, useRef, useState } from 'react';
import { breakevenSteps, nearestFlips, gridDateAt } from '../engine/breakeven.js';
import { normalizeInputs } from '../engine/defaults.js';
import { UnverifiedTag } from './Field.jsx';
import { sig } from '../format.js';
import { siteFor } from './SiteView.jsx';

// Breakeven table (BRIEF §13.3; work package 17; OPEN-QUESTIONS 93–97): the leader against five competitors on the
// eight drivers that move its score most. Run on request, one re-run per tick so the page stays responsive; the run,
// its scores and its ranking are never changed.

// Results by run, weights and scoring settings (the leader and the scores depend on them); small LRU.
const beCache = new Map();
let latest = null;
export const breakevenKey = (run) => `${run.inputHash || ''}|${JSON.stringify(run.scoring.weights)}|${run.inputs.settings.costMetric}|${run.inputs.settings.carbonMetric}|${run.inputs.settings.rankCompliantFirst ? 1 : 0}`;
// The breakevens for the run on screen, if they were run for it (for the summary and the PDF).
export function latestBreakevens(run) {
  if (!latest || !run || latest.key !== breakevenKey(run)) return null;
  return latest.result;
}

function cellText(row, cell, be, side) {
  const f = cell.flips[side];
  if (!f) return 'no flip';
  if (row.id === 'grid-date') return `${f.text} (${gridDateAt(be, f.at)})`;
  return f.text;
}

export default function BreakevenPanel({ run, onResult = null }) {
  const key = breakevenKey(run);
  const [state, setState] = useState(() => ({ key, ...(beCache.get(key) || {}) }));
  const timer = useRef(null);
  useEffect(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (state.key !== key) setState({ key, ...(beCache.get(key) || {}) });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const start = () => {
    if (state.busy) return;
    let it;
    try { it = breakevenSteps(run, { site: siteFor(normalizeInputs(run.inputs)) }); } catch (e) { setState({ key, error: String(e && e.message ? e.message : e) }); return; }
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    setState({ key, busy: true, progress: { done: 0, total: 1, label: 'starting' } });
    const tick = () => {
      try {
        const r = it.next();
        if (r.done) {
          const v = { result: r.value, ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 };
          beCache.set(key, v);
          while (beCache.size > 6) beCache.delete(beCache.keys().next().value);
          latest = { key, result: r.value };
          setState({ key, ...v });
          if (onResult) onResult();
          timer.current = null;
          return;
        }
        setState((s) => (s.key === key ? { ...s, progress: r.value } : s));
        timer.current = setTimeout(tick, 0);
      } catch (e) {
        setState({ key, error: String(e && e.message ? e.message : e) });
        timer.current = null;
      }
    };
    timer.current = setTimeout(tick, 0);
  };
  const mine = state.key === key;
  const busy = mine && state.busy;
  const be = mine ? state.result : null;
  const p = mine ? state.progress : null;
  const near = be ? nearestFlips(be, 3) : [];
  const nFlips = be ? be.rows.reduce((a, r) => a + r.cells.reduce((b, c) => b + (c.flips.down ? 1 : 0) + (c.flips.up ? 1 : 0), 0), 0) : 0;
  return (
    <section className="be" aria-labelledby="be-h">
      <h3 id="be-h">Breakevens: the leader against five competitors</h3>
      <p className="dv-intro">For the leader (#1) and each competitor, the value of each driver, nearest its current value, at which the two swap places, or “no flip” within the driver's range. Competitors: #2, then the best option of each other strategy. Drivers: the eight that move the leader's weighted score most. Each option is re-run with the engine the ranking uses; the run, its scores and ranks are not changed.</p>
      <div className="btn-row">
        <button type="button" className="chip-btn be-run" onClick={start} disabled={busy}>{busy ? 'Running…' : be ? 'Run again' : 'Run breakevens'}</button>
      </div>
      <p className="be-note" role="status" aria-live="polite">
        {busy && p ? `Re-running ${p.done} of about ${p.total}: ${p.label}.`
          : mine && state.error ? `Could not run: ${state.error}`
            : be ? `Done: ${be.competitors.length} competitors × ${be.rows.length} drivers, ${be.evaluations} re-runs${state.ms != null ? ` in ${sig(state.ms / 1000, 2)} s` : ''}; ${nFlips} flip${nFlips === 1 ? '' : 's'} found.`
              : 'About 200–400 re-runs; a few seconds to a minute on this device.'}
      </p>
      {be ? (
        <>
          <div className="dv-scroll" role="region" aria-label="Breakeven table" tabIndex={0}>
            <table className="mini be-table">
              <caption className="sr-only">Driver values at which a competitor and the leader swap places, below and above the current value</caption>
              <thead>
                <tr><th scope="col">Driver (range)</th>{be.competitors.map((c) => <th scope="col" key={c.id} title={c.name}>#{c.rank}</th>)}</tr>
              </thead>
              <tbody>
                {be.rows.map((r) => (
                  <tr key={r.id} data-driver={r.id}>
                    <th scope="row">{r.label}<span className="dv-basis">{r.lowText} to {r.highText} · <UnverifiedTag path={r.record} compact /></span></th>
                    {r.cells.map((c) => (
                      <td key={c.competitorId} data-competitor={c.competitorId}>
                        <span className="be-side">{r.id === 'grid-date' ? 'Earlier' : 'Lower'}: {cellText(r, c, be, 'down')}</span>
                        <span className="be-side">{r.id === 'grid-date' ? 'Later' : 'Higher'}: {cellText(r, c, be, 'up')}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="plain small be-comps">{be.competitors.map((c) => <li key={c.id}>#{c.rank} {c.name} (score {sig(c.score, 4)})</li>)}</ul>
          {near.length ? <p className="small"><strong>Nearest flips:</strong> {near.map((f) => f.text).join('; ')}.</p> : <p className="small"><strong>No flip</strong> within the drivers' ranges: the leader stays ahead of every competitor on every driver.</p>}
          <ul className="dv-notes">
            <li>Search: each side of the current value is checked at its middle and its end, and the first change of order is narrowed to {Math.round(be.tolerance * 100)} % of the driver's range (<UnverifiedTag path="sensitivity.breakevenTolerance" compact />), or to one month, one year or one hour for whole-number drivers. A swap that reverses again between two checked points is not seen.</li>
            <li>Order as in the ranking: power adequacy first, then the weighted score on the run's axis scales (not clipped at 0 and 100, so options beyond the run's range still compare). Scope: {be.competitors.length} competitors × {be.rows.length} drivers, run settings (§13.3 default 5 × 8) <UnverifiedTag path="sensitivity.breakevenCompetitors" compact />.</li>
          </ul>
        </>
      ) : null}
    </section>
  );
}

