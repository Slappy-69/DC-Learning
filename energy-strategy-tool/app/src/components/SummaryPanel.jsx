import React, { useMemo, useState } from 'react';
import { plainSummary, summaryKey, SUMMARY_TITLE } from '../engine/summary.js';

// Plain-English summary on the Options tab (BRIEF §14; work package 16; OPEN-QUESTIONS 12). Written from templates and
// the run's numbers; updated with every ranking change. The engineer can edit it: the edit is kept as a user note,
// marked "edited", and shown in place of the generated text until it is discarded. When the result changes after the
// edit, the note says so and the generated summary for the current result is shown under it.
export default function SummaryPanel({ run, sensitivity = null, breakevens = null, monteCarlo = null, siteBeta = false, note = null, onSaveNote, onDiscardNote, onShowSensitivity, open = true, onToggle }) {
  const s = useMemo(() => plainSummary(run, { sensitivity, breakevens, monteCarlo, siteBeta }), [run, sensitivity, breakevens, monteCarlo, siteBeta]);
  const key = useMemo(() => (s ? summaryKey(run, { siteBeta, usedTornado: s.usedTornado, usedBreakevens: s.usedBreakevens, usedMonteCarlo: s.usedMonteCarlo }) : ''), [run, s, siteBeta]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (!s) return null;
  const stale = note && note.key !== key;
  const startEdit = () => { setDraft(note ? note.text : s.text); setEditing(true); };
  const save = () => {
    const t = draft.trim();
    setEditing(false);
    if (!t || t === s.text.trim()) { if (onDiscardNote) onDiscardNote(); return; }
    if (onSaveNote) onSaveNote({ text: t, key, leaderId: s.leaderId, leaderName: s.leaderName, editedAt: new Date().toISOString(), siteBeta: !!siteBeta || !!(note && note.siteBeta) || /(^|[.\n]\s*)Site fit\b/.test(t) });  // N-6: a note once written with the Site tab on stays marked
  };
  const generated = (
    <div className="sum-text">
      {s.parts.map((p) => <p key={p.id} data-part={p.id}><strong>{p.heading}.</strong> {p.text}</p>)}
      <p className="sum-guardrail">{s.guardrail}</p>
    </div>
  );
  return (
    <section className="sum-panel" aria-labelledby="summary-h">
      <div className="sum-head">
        <h2 id="summary-h">{SUMMARY_TITLE}{note && !editing ? <> <span className="badge badge-edited">edited</span></> : null}</h2>
        <button type="button" className="chip-btn" aria-expanded={open} aria-controls="summary-body" onClick={() => onToggle && onToggle(!open)}>{open ? 'Hide' : 'Show'}</button>
      </div>
      {open ? (
        <div id="summary-body">
          <p className="note">Written by fixed templates from this run's figures: it describes the result under your weights and settings and does not advise. {s.words} of {s.wordLimit} words.</p>
          {editing ? (
            <div className="sum-edit">
              <label htmlFor="summary-edit" className="small">Summary text (kept as your note, marked “edited”){siteBeta ? '. With the Site tab (Beta) on, the note is left out of the PDF' : ''}</label>
              <textarea id="summary-edit" rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} />
              <div className="btn-row">
                <button type="button" className="chip-btn" id="summary-save" onClick={save}>Save note</button>
                <button type="button" className="chip-btn" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : note ? (
            <>
              {stale ? <p className="notice" role="status">Written for an earlier result (leader then: {note.leaderName}). The summary generated for the current result is below the note.</p> : null}
              <div className="sum-note" aria-label="Your edited summary">
                {note.text.split(/\n+/).map((t, i) => <p key={i}>{t}</p>)}
                <p className="small sum-meta">Edited {String(note.editedAt || '').slice(0, 10)}.{note.siteBeta ? ' Written with the Site tab (Beta) on, so it is left out of the PDF.' : ''}</p>
              </div>
              <div className="btn-row">
                <button type="button" className="chip-btn" id="summary-edit-btn" onClick={startEdit}>Edit note</button>
                <button type="button" className="chip-btn" id="summary-discard" onClick={() => onDiscardNote && onDiscardNote()}>Discard edit</button>
              </div>
              <details className="sum-generated" open={stale || undefined}>
                <summary>Generated summary</summary>
                {generated}
              </details>
            </>
          ) : (
            <>
              {generated}
              <div className="btn-row">
                <button type="button" className="chip-btn" id="summary-edit-btn" onClick={startEdit}>Edit summary</button>
                {(!s.usedTornado || !s.usedBreakevens || !s.usedMonteCarlo) && onShowSensitivity ? <button type="button" className="chip-btn" onClick={onShowSensitivity}>Sensitivity tab</button> : null}
              </div>
            </>
          )}
          <details className="sum-more">
            <summary>More detail</summary>
            {s.parts.map((p) => (s.details[p.id] && s.details[p.id].length ? (
              <div key={p.id}>
                <h3>{p.heading}</h3>
                <ul className="plain small">{s.details[p.id].map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            ) : null))}
            {s.notBuilt.length || s.notRun.length ? <p className="small">{s.notBuilt.length ? `Not built yet, so not in the summary: ${s.notBuilt.join('; ')}. ` : ''}{s.notRun.length ? `Not run yet for this result (Sensitivity tab): ${s.notRun.join('; ')}.` : ''}</p> : null}
          </details>
        </div>
      ) : null}
    </section>
  );
}
