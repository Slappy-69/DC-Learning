import React, { useId, useState } from 'react';
import { helpFor } from '../engine/help.js';

// The "?" next to a parameter (work package 31, OPEN-QUESTIONS 181, 183, 184): what it is, its basis and what it does
// in the T1 example, shown on click (works without a mouse and on a phone).
export function HelpButton({ path, label }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!path) return null;
  const h = open ? helpFor(path) : null;
  return (
    <span className="help">
      <button type="button" className="help-btn" aria-expanded={open} aria-controls={id} aria-label={`What is "${label}"?`} onClick={() => setOpen(!open)}>?</button>
      {open ? (
        <span id={id} className="help-panel" role="note">
          {h ? <>
            {h.what ? <span className="help-line">{h.what}</span> : null}
            <span className="help-line">{h.basis}{h.range ? ` ${h.range}` : ''}</span>
            <span className="help-line">{h.example}</span>
          </> : <span className="help-line">No record for this parameter.</span>}
        </span>
      ) : null}
    </span>
  );
}
