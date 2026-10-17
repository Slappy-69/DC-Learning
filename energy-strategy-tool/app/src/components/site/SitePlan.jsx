import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SOURCE_LABEL } from '../../engine/blocks.js';
import { geometry as G } from '../../engine/index.js';

// 2D site plan (BRIEF §10.7): north-up local metres (x east, y north). Layers: boundary, setbacks
// (buildable envelope), exclusions and height zones, blocks in the energy-source colours with hatch
// patterns, clearance rings, flags, points (POC, gas main, access, receptors), scale bar and north arrow.
// Dimensions show on hover and on keyboard focus. Modes: "view" (arrow keys move between blocks), "draw"
// (tap or click to add points; keyboard crosshair: arrows move 1 m, Shift 10 m, Enter adds, Backspace
// removes the last point, F finishes, Escape cancels) and "place" (one point).

export const PATTERNS = {
  grid: 'h', diesel: 'd45', fuel: 'x', gas: 'd135', bess: 'grid', solar: 'v', cooling: 'dots', fuelCell: 'hdash', hydrogen: 'bigdots', nuclear: 'xd', wind: 'rings', building: null,
};
const SHORT = { building: 'Hall', substation: 'Sub', genset: 'Gen', fuel: 'Fuel', bess: 'BESS', gasEngine: 'Eng', turbine: 'GT', fuelCell: 'FC', hydrogen: 'H₂', heatRejection: 'HR', wind: 'WT', smr: 'SMR' };

function Pattern({ id, kind }) {
  const s = 7;
  let body = null;
  if (kind === 'h') body = <line className="sp-pat-line" x1="0" y1={s / 2} x2={s} y2={s / 2} />;
  else if (kind === 'v') body = <line className="sp-pat-line" x1={s / 2} y1="0" x2={s / 2} y2={s} />;
  else if (kind === 'd45') body = <path className="sp-pat-line" d={`M0,${s} L${s},0 M-1,1 L1,-1 M${s - 1},${s + 1} L${s + 1},${s - 1}`} />;
  else if (kind === 'd135') body = <path className="sp-pat-line" d={`M0,0 L${s},${s} M${s - 1},-1 L${s + 1},1 M-1,${s - 1} L1,${s + 1}`} />;
  else if (kind === 'x') body = <path className="sp-pat-line" d={`M0,${s / 2} H${s} M${s / 2},0 V${s}`} />;
  else if (kind === 'xd') body = <path className="sp-pat-line" d={`M0,0 L${s},${s} M${s},0 L0,${s}`} />;
  else if (kind === 'grid') body = <path className="sp-pat-line" d={`M0,0 H${s} V${s}`} fill="none" />;
  else if (kind === 'dots') body = <circle className="sp-pat-dot" cx={s / 2} cy={s / 2} r="1.1" />;
  else if (kind === 'bigdots') body = <circle className="sp-pat-dot" cx={s / 2} cy={s / 2} r="1.9" />;
  else if (kind === 'hdash') body = <line className="sp-pat-line" x1="1" y1={s / 2} x2={s - 2} y2={s / 2} />;
  else if (kind === 'rings') body = <circle className="sp-pat-line" cx={s / 2} cy={s / 2} r="2.2" fill="none" />;
  return <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">{body}</pattern>;
}

export function SourceSwatch({ src }) {
  const k = PATTERNS[src];
  const id = `sw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg className="sw-svg" width="18" height="13" viewBox="0 0 18 13" aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="17" height="12" style={{ fill: `var(--src-${src})` }} stroke="currentColor" />
      {k ? <rect x="0.5" y="0.5" width="17" height="12" fill={`url(#${id})`} /> : null}
      <defs>{k ? <Pattern id={id} kind={k} /> : null}</defs>
    </svg>
  );
}

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
function useWidth(ref, initial) {
  const [w, setW] = useState(initial || 640);
  useIso(() => {
    const el = ref.current;
    if (!el || initial) return undefined;
    const set = () => setW(Math.max(240, Math.floor(el.clientWidth || 640)));
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, initial]);
  return w;
}

const fmt = (x, d = 1) => (Number.isFinite(x) ? Number(x.toFixed(d)).toLocaleString('en-GB') : '—');
function niceLen(m) {
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  for (const f of [5, 2, 1]) if (f * p <= m) return f * p;
  return p;
}

// Plan extent (xy metres): the boundary plus the points near it (receptors far away do not shrink the site).
export function planExtent(site, extra = []) {
  const bb = G.bbox(site.boundary.xy);
  const span = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0);
  const pts = [site.points.poc.xy, ...(site.points.gasMain ? [site.points.gasMain.xy] : []), ...site.points.access.map((a) => a.xy),
    ...site.points.receptors.flatMap((r) => (r.kind === 'point' ? [r.xy] : r.xy)), ...extra];
  for (const p of pts) {
    if (Math.abs(p[0] - (bb.x0 + bb.x1) / 2) > 1.5 * span || Math.abs(p[1] - (bb.y0 + bb.y1) / 2) > 1.5 * span) continue;
    bb.x0 = Math.min(bb.x0, p[0]); bb.x1 = Math.max(bb.x1, p[0]); bb.y0 = Math.min(bb.y0, p[1]); bb.y1 = Math.max(bb.y1, p[1]);
  }
  const m = Math.max(10, 0.04 * span);
  return { x0: bb.x0 - m, y0: bb.y0 - m, x1: bb.x1 + m, y1: bb.y1 + m };
}

// Placed block rectangle (uv) -> plan polygon (xy).
export function rectXY(site, r) {
  return [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]].map((p) => site.toXYfromUV(p));
}

export default function SitePlan({
  site, res = null, layers = {}, mode = 'view', draft = [], onAddPoint, onFinish, onCancel, onUndo,
  extent = null, initialWidth = null, small = false, svgId, label, describeId, onActiveChange,
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const width = useWidth(wrapRef, initialWidth);
  const ext = extent || planExtent(site, draft);
  const pad = small ? 4 : 28;
  const k = (width - 2 * pad) / Math.max(1, ext.x1 - ext.x0);
  const height = Math.round((ext.y1 - ext.y0) * k + 2 * pad + (small ? 0 : 18));
  const X = (x) => pad + (x - ext.x0) * k;
  const Y = (y) => pad + (ext.y1 - y) * k;
  const toWorld = (px, py) => [ext.x0 + (px - pad) / k, ext.y1 - (py - pad) / k];
  const path = (ring) => `M${ring.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' L')} Z`;
  const L = { boundary: true, setbacks: true, exclusions: true, blocks: true, rings: false, flags: true, points: true, dims: true, edges: false, ...layers };

  // Blocks as plan polygons, in placement order (keyboard order).
  const blocks = useMemo(() => {
    if (!res) return [];
    return res.layout.placed.map((p) => {
      const b = res.bs.ground[p.index];
      const poly = rectXY(site, p);
      const ring = rectXY(site, { x0: p.x0 - (b.clearanceM || 0), y0: p.y0 - (b.clearanceM || 0), x1: p.x1 + (b.clearanceM || 0), y1: p.y1 + (b.clearanceM || 0) });
      const cx = poly.reduce((a, q) => a + q[0], 0) / 4, cy = poly.reduce((a, q) => a + q[1], 0) / 4;
      return { p, b, poly, ring, cx, cy, flagged: p.broken.length > 0, w: p.x1 - p.x0, h: p.y1 - p.y0 };
    });
  }, [res, site]);
  const fillPolys = useMemo(() => {
    if (!res || !res.layout.fill) return [];
    const g = site.grid, c = res.layout.cell;
    return res.layout.fill.rects.map(([i0, j0, i1, j1]) => rectXY(site, { x0: g.u0 + i0 * c, y0: g.v0 + j0 * c, x1: g.u0 + i1 * c, y1: g.v0 + j1 * c }));
  }, [res, site]);

  const [active, setActive] = useState(null); // index into blocks
  const [hover, setHover] = useState(null);
  const [cross, setCross] = useState(null); // draw-mode keyboard crosshair (xy)
  useEffect(() => { setActive(null); setHover(null); }, [res]);
  const shown = hover != null ? hover : active;
  const A = shown != null ? blocks[shown] : null;
  useEffect(() => { if (onActiveChange) onActiveChange(A ? A.p.index : null); }, [A && A.p.index]); // eslint-disable-line react-hooks/exhaustive-deps

  const describe = (x) => {
    if (!x) return '';
    const broken = x.p.broken.length ? ` Relaxed: ${x.p.broken.map((r) => r.rule).join(', ')}.` : '';
    return `${x.b.name}. ${fmt(x.w)} by ${fmt(x.h)} m, ${Math.round(x.b.areaM2).toLocaleString('en-GB')} m², height ${fmt(Math.max(x.b.heightM || 0, x.b.stackM || 0))} m${x.b.stackM ? ' (stack)' : ''}, clearance ${fmt(x.b.clearanceM)} m. Centre ${fmt(x.cx, 0)} m east, ${fmt(x.cy, 0)} m north of the site origin.${broken}`;
  };

  const onKey = (e) => {
    if (mode === 'draw' || mode === 'place') {
      const step = e.shiftKey ? 10 : 1;
      const c0 = cross || [(ext.x0 + ext.x1) / 2, (ext.y0 + ext.y1) / 2];
      let c1 = null;
      if (e.key === 'ArrowLeft') c1 = [c0[0] - step, c0[1]];
      else if (e.key === 'ArrowRight') c1 = [c0[0] + step, c0[1]];
      else if (e.key === 'ArrowUp') c1 = [c0[0], c0[1] + step];
      else if (e.key === 'ArrowDown') c1 = [c0[0], c0[1] - step];
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (onAddPoint) onAddPoint(c0); if (!cross) setCross(c0); return; }
      else if (e.key === 'Backspace') { e.preventDefault(); if (onUndo) onUndo(); return; }
      else if ((e.key === 'f' || e.key === 'F') && onFinish) { e.preventDefault(); onFinish(); return; }
      else if (e.key === 'Escape') { e.preventDefault(); if (onCancel) onCancel(); return; }
      else return;
      e.preventDefault();
      setCross(c1);
      return;
    }
    if (!blocks.length) return;
    let n = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = active == null ? 0 : Math.min(blocks.length - 1, active + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = active == null ? 0 : Math.max(0, active - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = blocks.length - 1;
    else if (e.key === 'Escape') { setActive(null); return; }
    else return;
    e.preventDefault();
    setHover(null);
    setActive(n);
  };
  const local = (e) => { const r = svgRef.current.getBoundingClientRect(); return [(e.clientX - r.left) * (width / r.width), (e.clientY - r.top) * (height / r.height)]; };
  const onMove = (e) => {
    if (mode !== 'view' || small) return;
    const [px, py] = local(e);
    const w = toWorld(px, py);
    let hit = null;
    for (let i = blocks.length - 1; i >= 0; i--) if (G.pointInRing(w, blocks[i].poly)) { hit = i; break; }
    setHover(hit);
  };
  const onClick = (e) => {
    if (small) return;
    const [px, py] = local(e);
    const w = toWorld(px, py);
    if (mode === 'draw' || mode === 'place') { if (onAddPoint) onAddPoint(w); setCross(w); return; }
    let hit = null;
    for (let i = blocks.length - 1; i >= 0; i--) if (G.pointInRing(w, blocks[i].poly)) { hit = i; break; }
    setActive(hit);
  };

  // Scale bar (about a quarter of the width) and north arrow.
  const barM = niceLen((width - 2 * pad) / k / 4);
  const barPx = barM * k;
  const env = site.envelope;
  // Tooltip beside the block (clear of the block and its dimension lines); on narrow plans it sits under the plan.
  const tipBelow = width < 480;
  const tipStyle = A && !tipBelow ? (() => {
    const xs = A.poly.map((q) => X(q[0])), ys = A.poly.map((q) => Y(q[1]));
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys);
    const tw = 262;
    let left = bx1 + 24;
    if (left + tw > width - 4) left = bx0 - 24 - tw;
    if (left < 4) left = Math.min(Math.max(4, bx0), width - tw - 4);
    const top = Math.min(Math.max(2, by0), Math.max(2, height - 110));
    return { left, top };
  })() : null;
  // Dimension lines along the active block's bottom and left edges (in its own frame).
  const dims = A && L.dims && !small ? (() => {
    const [p0, p1, , p3] = A.poly;
    const off = 10 / k;
    const nx = -(p1[1] - p0[1]), ny = p1[0] - p0[0];
    const ln = Math.hypot(nx, ny) || 1;
    const o1 = [(-nx / ln) * off, (-ny / ln) * off];
    const mx = -(p3[1] - p0[1]), my = p3[0] - p0[0];
    const lm = Math.hypot(mx, my) || 1;
    const o2 = [(mx / lm) * off, (my / lm) * off];
    return [
      { a: [p0[0] + o1[0], p0[1] + o1[1]], b: [p1[0] + o1[0], p1[1] + o1[1]], t: `${fmt(A.w)} m` },
      { a: [p0[0] + o2[0], p0[1] + o2[1]], b: [p3[0] + o2[0], p3[1] + o2[1]], t: `${fmt(A.h)} m` },
    ];
  })() : [];

  const pid = (s) => `${svgId || 'sp'}-${s}`;
  const Wrap = small ? 'span' : 'div'; // thumbnails sit inside buttons (phrasing content only)
  // Edge numbers (user's edge order, as in the setbacks table), just inside each edge's mid-point.
  const edgeLabels = L.edges && !small ? site.edges.map((e) => {
    const dx = e.to[0] - e.from[0], dy = e.to[1] - e.from[1];
    const len = Math.hypot(dx, dy) || 1;
    const sgn = site.boundary.reversed ? -1 : 1; // outward normal: right of a counter-clockwise ring
    const ox = (sgn * dy) / len, oy = (sgn * -dx) / len;
    const d = 12 / k;
    return { i: e.index, x: e.mid[0] - ox * d, y: e.mid[1] - oy * d };
  }) : [];
  const live = mode === 'view' ? describe(A) : mode === 'draw' ? `Drawing: ${draft.length} point${draft.length === 1 ? '' : 's'}${cross ? `; crosshair ${fmt(cross[0], 0)} m east, ${fmt(cross[1], 0)} m north` : ''}.` : cross ? `Crosshair ${fmt(cross[0], 0)} m east, ${fmt(cross[1], 0)} m north.` : '';

  return (
    <Wrap className="site-plan" ref={wrapRef}>
      <svg ref={svgRef} id={svgId} width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        role={small ? undefined : 'application'} aria-hidden={small ? 'true' : undefined} focusable={small ? 'false' : undefined}
        tabIndex={small ? undefined : 0} aria-label={small ? undefined : label} aria-describedby={small ? undefined : describeId}
        onKeyDown={small ? undefined : onKey} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={onClick}
        style={{ cursor: mode === 'view' ? 'default' : 'crosshair', touchAction: mode === 'view' ? 'auto' : 'none' }}>
        <defs>
          {Object.entries(PATTERNS).filter(([, kd]) => kd).map(([src, kd]) => <Pattern key={src} id={pid(`pat-${src}`)} kind={kd} />)}
          <pattern id={pid('pat-excl')} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line className="sp-pat-excl" x1="0" y1="0" x2="0" y2="6" /></pattern>
          <pattern id={pid('pat-soft')} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line className="sp-pat-soft" x1="0" y1="0" x2="0" y2="10" /></pattern>
        </defs>
        {L.boundary ? <path className="sp-boundary" d={path(site.boundary.xy)} /> : null}
        {L.setbacks && env ? <path className="sp-envelope" d={env.region.map((pc) => [pc.outer, ...pc.holes].map(path).join(' ')).join(' ')} /> : null}
        {L.setbacks && env ? env.region.map((pc, i) => <path key={i} className="sp-setback" d={path(pc.outer)} />) : null}
        {L.exclusions ? site.exclusions.map((x) => <path key={x.id} className={x.hard ? 'sp-excl-hard' : 'sp-excl-soft'} d={path(x.xy)} fill={`url(#${pid(x.hard ? 'pat-excl' : 'pat-soft')})`}><title>{`${x.name}: ${x.typeLabel}, ${x.hard ? 'hard' : 'soft'}`}</title></path>) : null}
        {L.exclusions ? site.heightZones.map((z) => {
          const c = G.ringCentroid(z.xy);
          return <g key={z.id}><path className="sp-zone" d={path(z.xy)} />{small ? null : <text className="sp-zone-label" x={X(c[0])} y={Y(c[1])} textAnchor="middle">≤ {z.limitM} m</text>}</g>;
        }) : null}
        {L.blocks ? fillPolys.map((poly, i) => (
          <g key={`f${i}`}>
            <path className="sp-fill" d={path(poly)} style={{ fill: 'var(--src-solar)' }} />
            <path className="sp-block-pat" d={path(poly)} fill={`url(#${pid('pat-solar')})`} />
          </g>
        )) : null}
        {L.blocks ? blocks.map((x, i) => {
          const pk = PATTERNS[x.b.source];
          const wpx = x.w * k, hpx = x.h * k;
          const showLabel = !small && Math.min(wpx, hpx) >= 14 && Math.max(wpx, hpx) >= 30;
          return (
            <g key={x.p.index} data-block={x.p.index}>
              <path className={`sp-block${L.flags && x.flagged ? ' sp-flagged' : ''}`} d={path(x.poly)} style={{ fill: `var(--src-${x.b.source})` }} />
              {pk ? <path className="sp-block-pat" d={path(x.poly)} fill={`url(#${pid(`pat-${x.b.source}`)})`} /> : null}
              {showLabel ? <text className="sp-label" x={X(x.cx)} y={Y(x.cy) + 4} textAnchor="middle">{SHORT[x.b.type] || x.b.type}{L.flags && x.flagged ? ' !' : ''}</text> : null}
              {L.rings && (x.b.clearanceM || 0) > 0 ? <path className="sp-ring" d={path(x.ring)} /> : null}
            </g>
          );
        }) : null}
        {A ? <path className="sp-active" d={path(A.poly)} /> : null}
        {dims.map((d, i) => (
          <g key={i} className="sp-dim">
            <line x1={X(d.a[0])} y1={Y(d.a[1])} x2={X(d.b[0])} y2={Y(d.b[1])} />
            <text x={(X(d.a[0]) + X(d.b[0])) / 2} y={(Y(d.a[1]) + Y(d.b[1])) / 2 - 3} textAnchor="middle">{d.t}</text>
          </g>
        ))}
        {L.points ? (
          <g className="sp-points">
            <g className="sp-point"><circle className="sp-poc" cx={X(site.points.poc.xy[0])} cy={Y(site.points.poc.xy[1])} r={small ? 3 : 6} />{small ? null : <text x={X(site.points.poc.xy[0]) + 8} y={Y(site.points.poc.xy[1]) - 6}>POC{site.points.poc.isDefault ? ' (default)' : ''}</text>}</g>
            {site.points.access.map((a, i) => (a.isDefault && site.points.poc.isDefault ? null : <g key={i} className="sp-point"><path className="sp-access" d={`M${X(a.xy[0]) - 5},${Y(a.xy[1]) + 5} L${X(a.xy[0])},${Y(a.xy[1]) - 6} L${X(a.xy[0]) + 5},${Y(a.xy[1]) + 5} Z`} />{small ? null : <text x={X(a.xy[0]) + 8} y={Y(a.xy[1]) + 12}>Access</text>}</g>))}
            {site.points.gasMain ? <g className="sp-point"><rect className="sp-gas" x={X(site.points.gasMain.xy[0]) - 5} y={Y(site.points.gasMain.xy[1]) - 5} width="10" height="10" />{small ? null : <text x={X(site.points.gasMain.xy[0]) + 8} y={Y(site.points.gasMain.xy[1]) - 6}>Gas main</text>}</g> : null}
            {site.points.receptors.map((r) => (r.kind === 'point'
              ? <g key={r.id} className="sp-point"><path className="sp-receptor" d={`M${X(r.xy[0])},${Y(r.xy[1]) - 7} L${X(r.xy[0]) + 6},${Y(r.xy[1]) + 5} L${X(r.xy[0]) - 6},${Y(r.xy[1]) + 5} Z`} />{small ? null : <text x={X(r.xy[0]) + 8} y={Y(r.xy[1]) + 4}>{r.name}</text>}</g>
              : <path key={r.id} className="sp-zone" d={path(r.xy)} />))}
          </g>
        ) : null}
        {edgeLabels.map((e) => (
          <g key={`e${e.i}`} className="sp-edge-label"><circle cx={X(e.x)} cy={Y(e.y)} r="8" /><text x={X(e.x)} y={Y(e.y) + 3.5} textAnchor="middle">{e.i + 1}</text></g>
        ))}
        {draft.length ? (
          <g>
            {draft.length >= 2 ? <path className="sp-draft" d={`M${draft.map((p) => `${X(p[0])},${Y(p[1])}`).join(' L')}${draft.length >= 3 ? ' Z' : ''}`} /> : null}
            {draft.map((p, i) => <circle key={i} className="sp-draft-pt" cx={X(p[0])} cy={Y(p[1])} r="4" />)}
          </g>
        ) : null}
        {(mode === 'draw' || mode === 'place') && cross ? (
          <g className="sp-cross"><line x1={X(cross[0]) - 10} y1={Y(cross[1])} x2={X(cross[0]) + 10} y2={Y(cross[1])} /><line x1={X(cross[0])} y1={Y(cross[1]) - 10} x2={X(cross[0])} y2={Y(cross[1]) + 10} /></g>
        ) : null}
        {small ? null : (
          <>
            <g className="sp-scale" transform={`translate(${pad},${height - 12})`}>
              <rect x="0" y="-6" width={barPx / 2} height="5" />
              <rect className="sp-scale-alt" x={barPx / 2} y="-6" width={barPx / 2} height="5" />
              <text x={barPx + 6} y="-1">{barM.toLocaleString('en-GB')} m</text>
            </g>
            <g className="sp-north" transform={`translate(${width - pad + 8},${pad + 4})`}>
              <path d="M0,-12 L6,6 L0,2 L-6,6 Z" />
              <text x="0" y="20" textAnchor="middle">N</text>
            </g>
          </>
        )}
      </svg>
      {A && !small ? (
        <div className={`sp-tip${tipBelow ? ' sp-tip-below' : ''}`} style={tipStyle || undefined} aria-hidden="true">
          <strong>{A.b.name}</strong>
          <div>{fmt(A.w)} × {fmt(A.h)} m · {Math.round(A.b.areaM2).toLocaleString('en-GB')} m²</div>
          <div>Height {fmt(A.b.heightM)} m{A.b.stackM ? ` · stack ${fmt(A.b.stackM)} m` : ''} · clearance {fmt(A.b.clearanceM)} m</div>
          <div>{SOURCE_LABEL[A.b.source]}</div>
          {A.p.broken.length ? <div className="flag-text">Relaxed: {A.p.broken.map((r) => r.rule).join(', ')}</div> : null}
        </div>
      ) : null}
      {small ? null : <div className="sr-only" aria-live="polite">{live}</div>}
    </Wrap>
  );
}
