import React, { useRef } from 'react';
import { activeFilterChips, defaultView } from '../engine/view.js';

// Active view filters as removable chips (BRIEF §11, §2 principle 5), shared by the Options and
// Trade-offs tabs. Each chip has its own remove button; "Hide dominated options" keeps its counter
// chip with a one-click "show". Removing a chip moves focus to the next chip (or the row), so keyboard
// focus is never dropped on the page.
export default function FilterChips({ view, setView, hiddenDominated = 0, onChange, clearAll = false }) {
  const rowRef = useRef(null);
  const chips = activeFilterChips(view);
  if (!chips.length && !view.hideDominated) return null;
  const apply = (next, index) => {
    if (onChange) onChange();
    setView(next);
    const focusNext = () => {
      const row = rowRef.current;
      if (!row) return;
      const xs = row.querySelectorAll('.chip-x');
      const target = xs[Math.min(index, xs.length - 1)] || row;
      target.focus();
    };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(focusNext);
  };
  return (
    <div className="chip-row" role="group" aria-label="Active view filters" ref={rowRef} tabIndex={-1}>
      {chips.map((c, i) => (
        <span key={c.id} className="active-chip">
          {c.label}
          <button type="button" className="chip-x" aria-label={`Remove filter: ${c.label}`} title="Remove filter" onClick={() => apply(c.remove(view), i)}>
            <span aria-hidden="true">×</span>
          </button>
        </span>
      ))}
      {view.hideDominated ? (
        <span className="active-chip">
          {hiddenDominated.toLocaleString('en-GB')} dominated options hidden{' '}
          <button type="button" className="link-btn" onClick={() => apply({ ...view, hideDominated: false }, chips.length)}>show</button>
        </span>
      ) : null}
      {clearAll && chips.length ? (
        <button type="button" className="link-btn" onClick={() => apply({ ...defaultView(), sortKey: view.sortKey, sortDir: view.sortDir }, 0)}>Clear all filters</button>
      ) : null}
    </div>
  );
}
