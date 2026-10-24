import React, { useEffect, useId, useState } from 'react';
import { getRegistry, registryValue, isAtDefault, LABEL, isSourced } from '../engine/defaults.js';

// The §18 record of a path; input records are created by buildDefaultInputs, so fill the registry on first use.
function recordOf(path) {
  const r = getRegistry()[path];
  if (r) return r;
  try { registryValue(path); } catch { return null; }
  return getRegistry()[path] || null;
}

// Full label text for a §18 record: label, basis, source to verify against, note.
export function unverifiedTip(path) {
  const r = recordOf(path);
  if (!r) return null;
  if (isSourced(r)) {
    return `${r.label} — ${r.source} (value dated ${r.year}; ${r.url}; accessed ${r.accessed}; approved by the owner ${r.approved})${r.note ? ` — ${r.note}` : ''}`;
  }
  return `${LABEL} (${r.basis})${r.sourceToVerify ? ` — source to verify against: ${r.sourceToVerify}` : ' — no source'}${r.note ? ` — ${r.note}` : ''}`;
}

// "indicative — unverified" label (§23), or "sourced — not independently checked" for a record researched
// and approved by the owner (OPEN-QUESTIONS 36, 2026-10-22). It has no action, so it is not a tab stop (it used to be:
// 54+ empty stops in the inputs panel, and aria-label on a role-less span). The basis shows on hover
// (title). For screen readers: with `descId`, a hidden copy of the text carries that id so the control
// it labels can point at it with aria-describedby (heard with the control, not as part of its name);
// without `descId`, the text is read inline as visually hidden text.
export function UnverifiedTag({ path, compact, descId, text }) {
  const r = recordOf(path);
  if (!r) return null;
  const tip = unverifiedTip(path);
  const sourced = isSourced(r);
  return (
    <span className={sourced ? 'tag tag-sourced' : 'tag tag-unverified'} title={tip}>
      {text || (compact ? (sourced ? 'sourced' : 'unverified') : r.label)}
      {!compact && !text && !sourced && <span className="tag-basis"> ({r.basis})</span>}
      {descId ? <span id={descId} hidden>{tip}</span> : <span className="sr-only">{`: ${tip}`}</span>}
    </span>
  );
}

export function RequiredTag() {
  return <span className="tag tag-required" title="Required input. The value shown is the T1 reference example, not a default.">required · example value</span>;
}

// The tag's text is inside the <label>, so "unverified" is part of the control's name; the full basis is
// its description (descId, hidden text referenced by aria-describedby).
function basisId(id) { return `${id}-basis`; }
function Label({ id, label, unit, path, atDefault, required, hint }) {
  return (
    <label htmlFor={id} className="field-label">
      <span className="field-name">{label}{unit ? <span className="unit"> ({unit})</span> : null}</span>
      <span className="field-tags">
        {required ? <RequiredTag /> : null}
        {atDefault ? <UnverifiedTag path={path} compact descId={basisId(id)} /> : null}
      </span>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

// Numeric input with commit on blur or Enter (BRIEF §4 input commit model).
export function NumberField({ label, unit, value, onCommit, path, inputs, required, min, max, step = 'any', scale = 1, hint, nullable, placeholder }) {
  const id = useId();
  const atDefault = path && inputs ? isAtDefault(inputs, path) : false;
  const shown = value == null ? '' : String(+(value * scale).toPrecision(10));
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);
  const commit = () => {
    if (draft.trim() === '' && nullable) { onCommit(null); return; }
    const x = Number(draft);
    if (!Number.isFinite(x)) { setDraft(shown); return; }
    let v = x / scale;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    if (String(v) !== String(value)) onCommit(v);
    else setDraft(shown);
  };
  return (
    <div className="field">
      <Label id={id} label={label} unit={unit} path={path} atDefault={atDefault} required={required} hint={hint} />
      <input id={id} type="number" inputMode="decimal" step={step} value={draft} aria-describedby={atDefault ? basisId(id) : undefined}
        placeholder={placeholder ?? (nullable ? 'none' : undefined)}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }} />
    </div>
  );
}

export function TextField({ label, value, onCommit, path, inputs, required, pattern, hint, placeholder, nullable }) {
  const id = useId();
  const atDefault = path && inputs ? isAtDefault(inputs, path) : false;
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  const commit = () => {
    if (nullable && draft.trim() === '') { if (value != null && value !== '') onCommit(null); return; }
    if (pattern && !new RegExp(pattern).test(draft)) { setDraft(value ?? ''); return; }
    if (draft !== value) onCommit(draft);
  };
  return (
    <div className="field">
      <Label id={id} label={label} path={path} atDefault={atDefault} required={required} hint={hint} />
      <input id={id} type="text" value={draft} placeholder={placeholder} aria-describedby={atDefault ? basisId(id) : undefined} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
    </div>
  );
}

export function SelectField({ label, value, options, onCommit, path, inputs, hint }) {
  const id = useId();
  const atDefault = path && inputs ? isAtDefault(inputs, path) : false;
  return (
    <div className="field">
      <Label id={id} label={label} path={path} atDefault={atDefault} hint={hint} />
      <select id={id} value={value ?? ''} onChange={(e) => onCommit(e.target.value)} aria-describedby={atDefault ? basisId(id) : undefined}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export function ToggleField({ label, checked, onCommit, path, inputs, hint }) {
  const id = useId();
  const atDefault = path && inputs ? isAtDefault(inputs, path) : false;
  return (
    <div className="field field-toggle">
      <input id={id} type="checkbox" checked={!!checked} onChange={(e) => onCommit(e.target.checked)} aria-describedby={atDefault ? basisId(id) : undefined} />
      <label htmlFor={id}>{label}</label>
      {atDefault ? <UnverifiedTag path={path} compact descId={basisId(id)} /> : null}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function Section({ title, children, defaultOpen = false, badge }) {
  return (
    <details className="section" open={defaultOpen}>
      <summary><span className="section-title">{title}</span>{badge ? <span className="section-badge">{badge}</span> : null}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}
