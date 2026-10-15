import React, { useEffect, useId, useState } from 'react';
import { getRegistry, isAtDefault, LABEL } from '../engine/defaults.js';

// "indicative — unverified" label (§23). The basis is shown on hover/focus via title and in text for screen readers.
export function UnverifiedTag({ path, compact }) {
  const r = getRegistry()[path];
  if (!r) return null;
  const tip = `${LABEL} (${r.basis})${r.sourceToVerify ? ` — source to verify against: ${r.sourceToVerify}` : ' — no source'}${r.note ? ` — ${r.note}` : ''}`;
  return (
    <span className="tag tag-unverified" title={tip} tabIndex={0} aria-label={tip}>
      {compact ? 'unverified' : LABEL}
      {!compact && <span className="tag-basis"> ({r.basis})</span>}
    </span>
  );
}

export function RequiredTag() {
  return <span className="tag tag-required" title="Required input. The value shown is the T1 reference example, not a default.">required · example value</span>;
}

function Label({ id, label, unit, path, inputs, required, hint }) {
  const atDefault = path && inputs ? isAtDefault(inputs, path) : false;
  return (
    <label htmlFor={id} className="field-label">
      <span className="field-name">{label}{unit ? <span className="unit"> ({unit})</span> : null}</span>
      <span className="field-tags">
        {required ? <RequiredTag /> : null}
        {atDefault ? <UnverifiedTag path={path} compact /> : null}
      </span>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

// Numeric input with commit on blur or Enter (BRIEF §4 input commit model).
export function NumberField({ label, unit, value, onCommit, path, inputs, required, min, max, step = 'any', scale = 1, hint, nullable }) {
  const id = useId();
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
      <Label id={id} label={label} unit={unit} path={path} inputs={inputs} required={required} hint={hint} />
      <input id={id} type="number" inputMode="decimal" step={step} value={draft}
        placeholder={nullable ? 'none' : undefined}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }} />
    </div>
  );
}

export function TextField({ label, value, onCommit, path, inputs, required, pattern, hint, placeholder }) {
  const id = useId();
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  const commit = () => {
    if (pattern && !new RegExp(pattern).test(draft)) { setDraft(value ?? ''); return; }
    if (draft !== value) onCommit(draft);
  };
  return (
    <div className="field">
      <Label id={id} label={label} path={path} inputs={inputs} required={required} hint={hint} />
      <input id={id} type="text" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
    </div>
  );
}

export function SelectField({ label, value, options, onCommit, path, inputs, hint }) {
  const id = useId();
  return (
    <div className="field">
      <Label id={id} label={label} path={path} inputs={inputs} hint={hint} />
      <select id={id} value={value ?? ''} onChange={(e) => onCommit(e.target.value)}>
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
      <input id={id} type="checkbox" checked={!!checked} onChange={(e) => onCommit(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
      {atDefault ? <UnverifiedTag path={path} compact /> : null}
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
