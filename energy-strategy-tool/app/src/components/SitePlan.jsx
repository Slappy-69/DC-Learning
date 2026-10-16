import React, { useMemo, useState } from 'react';
import { layoutSite } from '../engine/site.js';
import { sig } from '../format.js';

// Site tab (BRIEF §10): 2D plan of the selected option's blocks from the auto-layout, the area
// budget, the height check and a table alternative. Read-only: no drag or edit yet. Never changes
// the run, its scores or its ranking.
export default function SitePlan({ run }) {
  const ranked = useMemo(() => [...run.options].sort((a, b) => a.rank - b.rank).slice(0, 50), [run]);
  const [selected, setSelected] = useState(ranked[0] ? ranked[0].id : null);
  const option = run.options.find((o) => o.id === selected) || ranked[0];

  const layout = useMemo(() => {
    if (!option) return null;
    try { return { ok: true, value: layoutSite(run.inputs, option.sizing) }; } catch (e) { return { ok: false, error: String(e && e.message ? e.message : e) }; }
  }, [run, option]);

  if (!run.options.length) return <p className="empty">No options to lay out.</p>;
  if (!layout) return null;
  if (!layout.ok) return <p className="empty">Could not lay out this option: {layout.error}</p>;

  const L = layout.value;
  const g = L.geometry;
  const pad = 20;
  const vbW = g.innerW + 2 * pad;
  const vbH = g.innerH + 2 * pad;
  const oy = (y) => pad + g.roadsH + y; // envelope origin inside the inner rectangle (roads strip at top)
  const pct = L.budget.netM2 > 0 ? (100 * L.budget.landTakeM2) / L.budget.netM2 : 0;

  return (
    <section className="site" aria-labelledby="site-title">
      <h2 id="site-title" className="sens-title">Site layout</h2>
      <p className="sens-intro">Blocks from the sized option, placed by a fast greedy auto-layout on a {L.cellM} m grid (BRIEF §10.4). Not an optimiser: a different arrangement may fit. Footprints and separations are {'indicative — unverified'} defaults.</p>

      <div className="sens-controls">
        <label className="sens-select">
          <span>Option</span>
          <select value={option.id} onChange={(e) => setSelected(e.target.value)}>
            {ranked.map((o) => <option key={o.id} value={o.id}>{`#${o.rank} ${o.name}`}</option>)}
          </select>
        </label>
        <p className="sens-status">Status: <strong className={L.status === 'Fits' ? 'site-fits' : 'site-nofit'}>{L.status}</strong> · land take {pct.toFixed(0)} % of net developable area · {L.blocks.length} placed{L.unplaced.length ? `, ${L.unplaced.length} unplaced (${Math.round(L.unplacedAreaM2).toLocaleString('en-GB')} m²)` : ''}</p>
      </div>

      <figure className="site-figure">
        <svg viewBox={`0 0 ${vbW} ${vbH}`} role="img" aria-label={`Plan of ${option.name}: ${L.blocks.length} blocks placed, ${L.unplaced.length} unplaced`} preserveAspectRatio="xMidYMid meet" className="site-svg">
          <rect x={pad} y={pad} width={g.innerW} height={g.innerH} className="site-setback" />
          <rect x={pad} y={pad} width={g.innerW} height={g.roadsH} className="site-roads" />
          <rect x={pad} y={oy(0)} width={g.envW} height={g.envH} className="site-envelope" />
          {L.blocks.map((b) => (
            <g key={b.id}>
              <rect x={pad + b.x} y={oy(b.y)} width={b.w} height={b.d} fill={b.color} className="site-block"><title>{`${b.label}: ${Math.round(b.areaM2).toLocaleString('en-GB')} m², ${b.h} m high`}</title></rect>
              {b.w > 60 && b.d > 14 ? <text x={pad + b.x + 4} y={oy(b.y) + 13} className="site-label">{b.label}</text> : null}
            </g>
          ))}
          <text x={pad} y={pad - 5} className="site-dim">{`${Math.round(g.a)} m × ${Math.round(g.b)} m gross · setback ${g.setbackM} m`}</text>
        </svg>
        <figcaption className="site-legend">
          Dashed outline: setback. Top strip: roads and parking. Coloured blocks are placed; list below shows any unplaced blocks.
        </figcaption>
      </figure>

      {L.unplaced.length ? (
        <div className="site-tray">
          <h3>Unplaced</h3>
          <ul>{L.unplaced.map((u) => <li key={u.id}>{u.label}: {Math.round(u.areaM2).toLocaleString('en-GB')} m² with no feasible position</li>)}</ul>
        </div>
      ) : null}

      <h3 className="site-h3">Area budget and height</h3>
      <table className="sens-table">
        <thead><tr><th scope="col">Item</th><th scope="col">Value</th></tr></thead>
        <tbody>
          <tr><th scope="row">Net developable area</th><td>{Math.round(L.budget.netM2).toLocaleString('en-GB')} m²</td></tr>
          <tr><th scope="row">Land take (sum of blocks)</th><td>{Math.round(L.budget.landTakeM2).toLocaleString('en-GB')} m² ({pct.toFixed(0)} %)</td></tr>
          <tr><th scope="row">Residual after blocks</th><td>{Math.round(L.budget.residualM2).toLocaleString('en-GB')} m²</td></tr>
          <tr><th scope="row">Tallest block</th><td>{sig(L.height.tallestM, 3)} m against {L.height.limitM} m limit {L.height.ok ? '(ok)' : '(above limit)'}</td></tr>
        </tbody>
      </table>

      <h3 className="site-h3">Blocks placed</h3>
      <table className="sens-table">
        <thead><tr><th scope="col">Block</th><th scope="col">Area</th><th scope="col">Footprint</th><th scope="col">Height</th></tr></thead>
        <tbody>
          {L.blocks.map((b) => (
            <tr key={b.id}><th scope="row">{b.label}</th><td>{Math.round(b.areaM2).toLocaleString('en-GB')} m²</td><td>{Math.round(b.w)} × {Math.round(b.d)} m</td><td>{b.h} m</td></tr>
          ))}
        </tbody>
      </table>

      <ul className="sens-notes">{L.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
    </section>
  );
}
