import React, { useEffect, useMemo, useState } from 'react';
import { tornado } from '../engine/sensitivity.js';
import { LABEL } from '../engine/defaults.js';
import { sig } from '../format.js';

// Sensitivity tab (BRIEF §13.3, tornado). Runs on the user's request only (no re-run on every
// keystroke), for one option at a time. Never changes the run, its scores or its ranking.
export default function SensitivityView({ run }) {
  const ranked = useMemo(() => [...run.options].sort((a, b) => a.rank - b.rank).slice(0, 50), [run]);
  const leaderId = ranked[0] ? ranked[0].id : null;
  const [selected, setSelected] = useState(leaderId);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ms, setMs] = useState(null);

  // A new run clears the old result; the selection falls back to the leader if it is gone.
  useEffect(() => {
    setResult(null);
    setErr(null);
    if (!run.options.some((o) => o.id === selected)) setSelected(leaderId);
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  function compute() {
    setBusy(true);
    setErr(null);
    // Yield once so the busy state paints before the synchronous computation.
    setTimeout(() => {
      try {
        const t0 = performance.now();
        const r = tornado(run, selected);
        setMs(performance.now() - t0);
        setResult(r);
      } catch (e) {
        setErr(String(e && e.message ? e.message : e));
        setResult(null);
      } finally {
        setBusy(false);
      }
    }, 0);
  }

  if (!run.options.length) return <p className="empty">No options to test. Adjust the inputs so at least one option is screened.</p>;

  const maxSwing = result ? Math.max(1e-9, ...result.rows.map((r) => r.swing)) : 1;
  const check = result ? Math.abs(result.base.score - result.baseRunScore) : null;

  return (
    <section className="sens" aria-labelledby="sens-title">
      <h2 id="sens-title" className="sens-title">Sensitivity (tornado)</h2>
      <p className="sens-intro">Shows how one option's weighted score moves when one input is set to its low and high value, with everything else held. The other options and their ranks are not changed. Driver ranges are judgement or registry values and are {LABEL} unless noted.</p>

      <div className="sens-controls">
        <label className="sens-select">
          <span>Option to test</span>
          <select value={selected || ''} onChange={(e) => { setSelected(e.target.value); setResult(null); }}>
            {ranked.map((o) => <option key={o.id} value={o.id}>{`#${o.rank} ${o.name}`}</option>)}
          </select>
        </label>
        <button type="button" className="btn primary" onClick={compute} disabled={busy || !selected} aria-describedby="sens-status">
          {busy ? 'Computing…' : result ? 'Run again' : 'Run sensitivity'}
        </button>
        <p id="sens-status" className="sens-status" role="status" aria-live="polite">
          {busy ? 'Re-running the option under each driver value.' : err ? `Could not run: ${err}` : result ? `Done in ${sig(ms / 1000, 2)} s on this device.` : 'Choose an option and run the test. Each driver is run twice, so this takes a few seconds.'}
        </p>
      </div>

      {result ? (
        <>
          <p className="sens-base">
            Base weighted score for <strong>{result.optionName}</strong>: <strong>{sig(result.base.score, 4)}</strong> / 100
            {check !== null && check < 1e-9 ? <span className="sens-ok"> · matches the run</span> : <span className="sens-warn"> · differs from the run by {sig(check, 2)}</span>}
          </p>
          <table className="sens-table">
            <caption className="sr-only">Score under low and high value of each driver, largest swing first</caption>
            <thead>
              <tr><th scope="col">Driver</th><th scope="col">Low value</th><th scope="col">Score at low</th><th scope="col">High value</th><th scope="col">Score at high</th><th scope="col">Swing</th></tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.label}<span className="sens-basis">{r.basis}</span></th>
                  <td>{r.low.text}</td>
                  <td>{sig(r.low.score, 4)}</td>
                  <td>{r.high.text}</td>
                  <td>{sig(r.high.score, 4)}</td>
                  <td>
                    <span className="sens-bar" aria-hidden="true"><span style={{ width: `${(100 * r.swing) / maxSwing}%` }} /></span>
                    <span className="sens-num">{sig(r.swing, 3)} pts</span>
                    <span className="sens-lcoe">LCOE {sig(r.low.lcoe, 3)} to {sig(r.high.lcoe, 3)} €/MWh</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="sens-notes">
            <li>Not yet in this test: capex by technology, cooling PUE, solar yield, BESS cost and procurement lead times. They are added in a later slice.</li>
            <li>Carbon price moves cost only for options with on-site (Scope 1) emissions. For grid-only options its swing is zero, by design.</li>
            <li>The time-to-power axis is normalised on the base run's range, so a value outside that range scores at the edge of 0–100.</li>
          </ul>
        </>
      ) : null}
    </section>
  );
}
