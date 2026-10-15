import React from 'react';
import { LABEL } from '../engine/defaults.js';

// Run summary (BRIEF §12): total combinations, compatibility rules with counts, "values not
// generated" with Include controls, sampling state and counts, dispatch handling modes.
export default function RunSummary({ run, onInclude, onSamplingOff, open, onToggle }) {
  const g = run.generation;
  return (
    <details className="run-summary" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary>
        <span className="section-title">Run summary</span>
        <span className="rs-line">
          {g.totalCombinations.toLocaleString('en-GB')} combinations · {g.screened.toLocaleString('en-GB')} screened
          {g.sampled ? ' (sampling on)' : ''} · {run.rules.filter((r) => r.id !== 'd').reduce((s, r) => s + r.removed, 0).toLocaleString('en-GB')} impossible not generated
          · {g.valuesNotGenerated.length} choices with values not generated
        </span>
      </summary>
      <div className="rs-body">
        <div className="rs-grid">
          <section aria-labelledby="rs-gen">
            <h3 id="rs-gen">Generation</h3>
            <ul className="plain">
              <li>Open-choice product: {g.rawTotal.toLocaleString('en-GB')}; after n/a collapse: {g.collapsedTotal.toLocaleString('en-GB')}; valid after compatibility rules: {g.validCombinations.toLocaleString('en-GB')}.</li>
              <li>Archetype baselines: {g.archetypes} (always generated; {g.archetypesOutsideSpace} sit outside the open choices and are added).</li>
              <li>Total combinations: <strong>{g.totalCombinations.toLocaleString('en-GB')}</strong>. Screened: <strong>{g.screened.toLocaleString('en-GB')}</strong>.</li>
              <li>
                Sample above cap: <strong>{g.sampling ? 'On' : 'Off'}</strong> <span className="tag tag-unverified" title="judgement">{LABEL}</span>. Cap {g.cap.toLocaleString('en-GB')} <span className="tag tag-unverified" title="run setting">{LABEL}</span>.
                {g.sampled ? (
                  <span className="notice-inline"> {g.screened.toLocaleString('en-GB')} of {g.totalCombinations.toLocaleString('en-GB')} combinations screened (sampling on; seeded Latin hypercube, {g.lhsRepaired} draws repaired to valid unique combinations). <button type="button" className="link-btn" onClick={onSamplingOff}>Screen all</button> · lock a choice to narrow the space.</span>
                ) : null}
              </li>
              <li>Scoring set: every screened option ({run.options.length.toLocaleString('en-GB')}){g.sampled ? ', i.e. the screened sample' : ''}. View filters never change any score or rank.</li>
            </ul>
          </section>
          <section aria-labelledby="rs-rules">
            <h3 id="rs-rules">Compatibility rules</h3>
            <table className="mini">
              <thead><tr><th scope="col">Rule</th><th scope="col" className="num">Removed</th></tr></thead>
              <tbody>
                {run.rules.map((r) => (
                  <tr key={r.id}><td title={r.detail}>{r.name}<div className="sub">{r.detail}</div></td><td className="num">{r.removed.toLocaleString('en-GB')}{r.id === 'd' ? ' collapsed' : ''}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section aria-labelledby="rs-vng" className="rs-wide">
            <h3 id="rs-vng">Values not generated</h3>
            <ul className="plain vng">
              {g.valuesNotGenerated.map((c) => (
                <li key={c.id}>
                  <strong>{c.id} {c.name}:</strong> {c.omitted.map((o) => `${o.label}${o.reason === 'excluded by user' ? ' (excluded by user)' : ''}`).join(', ')} not generated
                  {' '}({[...new Set(c.omitted.map((o) => o.reason))].filter((r) => r !== 'excluded by user').join(', ') || 'excluded by user'})
                  {' '}<button type="button" className="link-btn" onClick={() => onInclude(c.id, c.omitted.map((o) => o.value))}>{c.id === 'C11' ? 'Include wind' : 'Include'}</button>
                  {c.note ? <div className="sub">{c.note}</div> : null}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="rs-disp">
            <h3 id="rs-disp">Dispatch</h3>
            <ul className="plain">
              <li>Model: full-year hourly dispatch (8760 h per model year, chronological BESS state of charge) for every screened option; {run.timing.dispatchRuns.toLocaleString('en-GB')} distinct dispatch runs.</li>
              <li>Grid capacity handling: <strong>{run.dispatchHandling.grid === 'unmet' ? 'Show unmet load' : 'Show exceedance'}</strong> <span className="tag tag-unverified" title="judgement">{LABEL}</span></li>
              <li>Run-hour limit handling: <strong>{run.dispatchHandling.runHours === 'flag' ? 'Flag only' : 'Respect limit'}</strong> <span className="tag tag-unverified" title="judgement">{LABEL}</span></li>
              <li>Merit order: <ol>{run.meritOrder.map((m) => <li key={m}>{m}</li>)}</ol></li>
              <li>Profiles: {run.profileLabel} (country {run.country}).</li>
            </ul>
          </section>
        </div>
      </div>
    </details>
  );
}
