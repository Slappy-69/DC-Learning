import React, { createContext, useContext, useState } from 'react';
import { noteFor, optionNoteKey, SEVERITIES, noteText } from '../engine/flagnotes.js';

// The engineer's comment on a flag (work package 27, OPEN-QUESTIONS 170–176). The app provides the notes and a setter;
// without a provider (server renders, tests) the editor is not shown.
export const FlagNotesContext = createContext(null);

export function useFlagNotes() {
  return useContext(FlagNotesContext);
}

// One flag line with its comment, and an "Add comment" button that opens a small editor.
export function FlagWithNote({ f, o }) {
  const ctx = useFlagNotes();
  const [open, setOpen] = useState(false);
  const key = optionNoteKey(o);
  const orig = f.originalSeverity || f.severity;
  const n = ctx ? noteFor(ctx.notes, key, f.id) : null;
  const shared = !!(ctx && ctx.notes.byType && ctx.notes.byType[f.id] && !(ctx.notes.byOption && ctx.notes.byOption[key] && ctx.notes.byOption[key][f.id]));
  const [draft, setDraft] = useState(() => ({ comment: (n && n.comment) || '', mitigated: !!(n && n.mitigated), severity: (n && n.severity) || orig, toType: shared }));
  const lower = SEVERITIES.slice(SEVERITIES.indexOf(orig));
  const save = () => { ctx.setNote(key, f.id, { comment: draft.comment.trim(), mitigated: draft.mitigated, severity: draft.severity === orig ? undefined : draft.severity }, draft.toType); setOpen(false); };
  const clear = () => { ctx.setNote(key, f.id, null, draft.toType); setDraft({ comment: '', mitigated: false, severity: orig, toType: draft.toType }); setOpen(false); };
  const txt = noteText(f);
  return (
    <>
      {txt ? <span className="flag-note"> {txt}</span> : null}
      {ctx ? <button type="button" className="chip-btn flag-note-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{n ? 'Edit comment' : 'Add comment'}</button> : null}
      {ctx && open ? (
        <span className="flag-note-editor" role="group" aria-label="Engineer's comment on this flag">
          <label>Comment (printed beside the flag in the report)
            <textarea rows={2} value={draft.comment} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} />
          </label>
          <label><input type="checkbox" checked={draft.mitigated} onChange={(e) => setDraft({ ...draft, mitigated: e.target.checked })} /> Mitigated</label>
          <label>Severity
            <select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })}>
              {lower.map((s) => <option key={s} value={s}>{s}{s === orig ? ' (as raised)' : ''}</option>)}
            </select>
          </label>
          <label><input type="checkbox" checked={draft.toType} onChange={(e) => setDraft({ ...draft, toType: e.target.checked })} /> Apply to every option with this flag</label>
          <span className="note">A lowered permitting flag changes the deliverability score; adequacy and resilience tests do not change (OPEN-QUESTIONS 172–175).</span>
          <button type="button" className="chip-btn" onClick={save}>Save comment</button>
          {n ? <button type="button" className="chip-btn" onClick={clear}>Remove comment</button> : null}
        </span>
      ) : null}
    </>
  );
}
