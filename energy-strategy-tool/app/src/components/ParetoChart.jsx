import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { sig, money, displayCurrency, curUnit } from '../format.js';
import { paretoCanvasAbove } from '../engine/pareto.js';
import { fmtAxis } from './ParetoTable.jsx';
import { UnverifiedTag } from './Field.jsx';

// Pareto scatter (BRIEF §12.2), hand-written SVG with a Canvas layer above view.pareto.canvasAbove
// plotted points (§4; registry value read at render, default 500).
//  - x and y = any two axis metrics (default cost vs carbon); each axis states its better direction.
//  - colour = time-to-power (up to 5 quantile classes, one-hue violet ramp; more contrast with the surface = longer).
//  - size = capex (marker area grows linearly with capex, from a minimum mark size).
//  - shape = site-fit status (§12.2): circle Fits, triangle Fits with flags, square Does not fit.
//    (Until the site slice, shape carried resilience status; resilience is now in the tooltip, the
//    keyboard description and the table.) Options without a site-fit result fall back to a circle.
//  - dominated options (engine dominance mark, 4 axes + status) are hollow; non-dominated are filled.
//  - the 2-axis Pareto frontier is a step line; the weighted pick has a ring and a text label.
//  - the highest weighted score is marked separately (dashed ring) only when it is not the pick
//    ("Rank requirement-compliant options first" on).
// Keyboard: the plot is one tab stop. Arrow keys move between points (left/right along x, up/down along
// y), P jumps to the weighted pick, Enter or Space opens the option detail, Escape clears.

const SHAPES = { Fits: 'circle', 'Fits with flags': 'triangle', 'Does not fit': 'square' };
export const SHAPE_LABEL = { circle: '●', triangle: '▲', square: '■' };

function niceStep(span, n) {
  const raw = span / Math.max(1, n);
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m >= 5 ? 10 : m >= 2 ? 5 : m >= 1 ? 2 : 1) * p;
}
function niceTicks(lo, hi, n) {
  if (!(hi > lo)) { const d = Math.abs(lo) * 0.1 || 1; lo -= d; hi += d; }
  const step = niceStep(hi - lo, n);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const t = [];
  for (let v = a; v <= b + step * 1e-9; v += step) t.push(Number(v.toPrecision(12)));
  return { ticks: t, lo: a, hi: b };
}
function tickLabel(axis, v) {
  if (axis.unit === '€') return money(v, 2);
  if (axis.unit === '€/MWh') return sig(v * displayCurrency().rate, 3);
  if (axis.unit === '%') return `${sig(v * 100, 2)}`;
  return sig(v, 3);
}

// Marker path centred on 0,0 with "radius" r (area roughly matched across shapes).
function shapePath(shape, r) {
  if (shape === 'triangle') { const h = r * 1.35; return `M0,${-h} L${h * 0.95},${h * 0.7} L${-h * 0.95},${h * 0.7} Z`; }
  if (shape === 'square') { const s = r * 0.9; return `M${-s},${-s} H${s} V${s} H${-s} Z`; }
  return `M${-r},0 A${r},${r} 0 1,0 ${r},0 A${r},${r} 0 1,0 ${-r},0 Z`;
}
function drawShape(ctx, shape, x, y, r) {
  ctx.beginPath();
  if (shape === 'triangle') { const h = r * 1.35; ctx.moveTo(x, y - h); ctx.lineTo(x + h * 0.95, y + h * 0.7); ctx.lineTo(x - h * 0.95, y + h * 0.7); ctx.closePath(); }
  else if (shape === 'square') { const s = r * 0.9; ctx.rect(x - s, y - s, 2 * s, 2 * s); }
  else ctx.arc(x, y, r, 0, Math.PI * 2);
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useSize(ref) {
  const [w, setW] = useState(640);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => setW(Math.max(260, Math.floor(el.clientWidth || 640)));
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

// Read the theme colours from CSS custom properties (light and dark are defined in styles.css).
function readColours(el) {
  const cs = el && typeof getComputedStyle !== 'undefined' ? getComputedStyle(el) : null;
  const g = (k, d) => (cs && cs.getPropertyValue(k).trim()) || d;
  return {
    ttp: [1, 2, 3, 4, 5].map((i) => g(`--ttp-${i}`, ['#9d74c4', '#8659b0', '#70429b', '#592f83', '#421c69'][i - 1])),
    res: { Meets: g('--ok', '#1f7a3f'), 'Meets with flags': g('--warn', '#8a5a00'), 'Does not meet': g('--bad', '#b3261e') },
    surface: g('--surface', '#ffffff'),
    ink: g('--ink', '#1d1f22'),
  };
}

// Resilience encoding (work package 6): Meets large and green, Meets with flags medium and amber, Does not meet small and red.
const RES_R = { Meets: 1, 'Meets with flags': 0.6, 'Does not meet': 0.25 };

export default function ParetoChart({ model, selectedId, onSelect, forceSvg = false, initialWidth, svgId, encoding = 'resilience' }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const measured = useSize(wrapRef);
  const width = initialWidth || measured;
  const phone = width < 520;
  const height = Math.round(Math.max(280, Math.min(460, width * (phone ? 0.95 : 0.6))));
  const m = { top: 16, right: phone ? 12 : 20, bottom: 46, left: phone ? 54 : 70 };
  const iw = width - m.left - m.right, ih = height - m.top - m.bottom;
  const [hoverId, setHoverId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [colours, setColours] = useState(() => readColours(null));

  useEffect(() => {
    setColours(readColours(wrapRef.current));
    if (typeof matchMedia === 'undefined') return undefined;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setColours(readColours(wrapRef.current));
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, []);

  const pts = useMemo(() => model.points.filter((p) => p.plotted), [model]);
  const canvasAbove = paretoCanvasAbove();
  const useCanvas = !forceSvg && pts.length > canvasAbove;
  const xt = useMemo(() => niceTicks(model.xAxis.domain[0], model.xAxis.domain[1], Math.max(3, Math.floor(iw / 90))), [model, iw]);
  const yt = useMemo(() => niceTicks(model.yAxis.domain[0], model.yAxis.domain[1], Math.max(3, Math.floor(ih / 60))), [model, ih]);
  const sx = useCallback((v) => m.left + ((v - xt.lo) / (xt.hi - xt.lo)) * iw, [xt, iw, m.left]);
  const sy = useCallback((v) => m.top + ih - ((v - yt.lo) / (yt.hi - yt.lo)) * ih, [yt, ih, m.top]);
  const [cmin, cmax] = model.capexRange;
  const rMin = phone ? 2.5 : 3, rMax = phone ? 7 : 9;
  const radius = useCallback((c) => {
    if (!Number.isFinite(c) || !(cmax > cmin)) return (rMin + rMax) / 2;
    const t = Math.max(0, Math.min(1, (c - cmin) / (cmax - cmin)));
    return Math.sqrt(rMin * rMin + t * (rMax * rMax - rMin * rMin)); // area linear in capex (affine, from rMin)
  }, [cmin, cmax, rMin, rMax]);

  const geo = useMemo(() => pts.map((p) => ({
    p, cx: sx(p.x), cy: sy(p.y),
    r: encoding === 'resilience' ? Math.sqrt(rMin * rMin + (RES_R[p.resilience] ?? 0.5) * (rMax * rMax - rMin * rMin)) : radius(p.capex),
    shape: (model.showSiteFit !== false && SHAPES[p.siteFit]) || 'circle',
    fill: encoding === 'resilience' ? (colours.res[p.resilience] || colours.ink) : p.ttpClass == null ? colours.ink : colours.ttp[Math.min(4, p.ttpClass)],
  })), [pts, sx, sy, radius, colours, encoding, rMin, rMax]);
  // Draw order: dominated first, then non-dominated, then frontier, so the useful points sit on top.
  const drawOrder = useMemo(() => geo.slice().sort((a, b) => (a.p.dominatedBy ? 0 : 1) - (b.p.dominatedBy ? 0 : 1) || (a.p.onFrontier ? 1 : 0) - (b.p.onFrontier ? 1 : 0) || b.p.rank - a.p.rank), [geo]);
  const byId = useMemo(() => new Map(geo.map((g) => [g.p.id, g])), [geo]);

  // Canvas layer (more than canvasAbove plotted points).
  useEffect(() => {
    if (!useCanvas) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    cv.width = Math.round(width * dpr); cv.height = Math.round(height * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath(); ctx.rect(m.left, m.top, iw, ih); ctx.clip();
    for (const g of drawOrder) {
      drawShape(ctx, g.shape, g.cx, g.cy, g.r);
      // Hollow markers are stroked at full opacity: the ramp's lightest step is 3.67:1 (light) / 3.78:1
      // (dark) against the surface, and lowering the alpha would drop it below the 3:1 graphics target.
      if (g.p.dominatedBy) {
        ctx.lineWidth = 1.25; ctx.strokeStyle = g.fill; ctx.stroke();
      } else {
        ctx.fillStyle = g.fill; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = colours.surface; ctx.stroke();
      }
    }
    ctx.restore();
  }, [useCanvas, drawOrder, width, height, iw, ih, m.left, m.top, colours]);

  // Pointer hit test: nearest plotted point within 16 px (hit area larger than the mark).
  const nearest = useCallback((px, py) => {
    let best = null, bd = 16 * 16;
    for (const g of geo) { const d = (g.cx - px) ** 2 + (g.cy - py) ** 2; if (d < bd) { bd = d; best = g; } }
    return best;
  }, [geo]);
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const g = nearest(e.clientX - rect.left, e.clientY - rect.top);
    setHoverId(g ? g.p.id : null);
  };
  // Open the option the tooltip names. Pointer events carry fractional coordinates but click events
  // whole pixels, so recomputing the nearest point on click could open a neighbour where markers
  // overlap (found by tests/browser-tests.mjs B4). Without a hover (touch), use the click position.
  const onClick = (e) => {
    let id = hoverId && byId.has(hoverId) ? hoverId : null;
    if (!id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const g = nearest(e.clientX - rect.left, e.clientY - rect.top);
      id = g ? g.p.id : null;
    }
    if (id) { setFocusId(id); onSelect(id); }
  };

  // Keyboard navigation.
  const byX = useMemo(() => geo.slice().sort((a, b) => a.p.x - b.p.x || a.p.y - b.p.y || a.p.rank - b.p.rank), [geo]);
  const byY = useMemo(() => geo.slice().sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x || a.p.rank - b.p.rank), [geo]);
  const onKey = (e) => {
    if (!geo.length) return;
    const cur = focusId && byId.has(focusId) ? focusId : null;
    const step = (arr, d) => {
      if (!cur) return (model.pickId && byId.has(model.pickId)) ? model.pickId : arr[0].p.id;
      const i = arr.findIndex((g) => g.p.id === cur);
      return arr[Math.max(0, Math.min(arr.length - 1, i + d))].p.id;
    };
    let next = null;
    if (e.key === 'ArrowRight') next = step(byX, 1);
    else if (e.key === 'ArrowLeft') next = step(byX, -1);
    else if (e.key === 'ArrowUp') next = step(byY, 1); // up the screen = higher y value
    else if (e.key === 'ArrowDown') next = step(byY, -1);
    else if (e.key === 'Home') next = byX[0].p.id;
    else if (e.key === 'End') next = byX[byX.length - 1].p.id;
    else if (e.key === 'p' || e.key === 'P') next = model.pickId && byId.has(model.pickId) ? model.pickId : null;
    else if ((e.key === 'Enter' || e.key === ' ') && cur) { e.preventDefault(); onSelect(cur); return; }
    else if (e.key === 'Escape') { setFocusId(null); return; }
    else return;
    e.preventDefault();
    if (next) setFocusId(next);
  };

  const activeId = hoverId || focusId;
  const active = activeId ? byId.get(activeId) : null;
  const pick = model.pickId ? byId.get(model.pickId) : null;
  const topG = model.topScoreId ? byId.get(model.topScoreId) : null;
  const sel = selectedId ? byId.get(selectedId) : null;
  const frontierPath = useMemo(() => {
    const f = model.frontierXY.filter((q) => Number.isFinite(q.x) && Number.isFinite(q.y));
    if (!f.length) return '';
    let d = `M${sx(f[0].x)},${sy(f[0].y)}`;
    for (let i = 1; i < f.length; i++) d += ` H${sx(f[i].x)} V${sy(f[i].y)}`;
    return d;
  }, [model, sx, sy]);

  const describe = (g) => g ? `${g.p.name}. Rank ${g.p.rank}, score ${g.p.score.toFixed(1)}. ${model.xAxis.label} ${fmtAxis(model.xAxis, g.p.x)}; ${model.yAxis.label} ${fmtAxis(model.yAxis, g.p.y)}; time-to-power ${sig(g.p.ttp, 2)} months; capex ${money(g.p.capex, 2)}; ${model.showSiteFit !== false ? `site fit ${g.p.siteFit || 'not assessed'}; ` : ''}resilience ${g.p.resilience}; ${g.p.dominatedBy ? `dominated by ${g.p.dominatedByName} (rank ${g.p.dominatedByRank})` : 'not dominated'}${g.p.onFrontier ? '; on the frontier' : ''}${g.p.isPick ? '; weighted pick' : ''}${g.p.isTopScore ? '; highest weighted score, ranked below the pick because requirement-compliant options are ranked first' : ''}.` : '';
  const dirText = (a) => `${a.better} is better`;
  // Axis titles carry the better direction when they fit (about 6.9 px per character at 12 px semi-bold);
  // otherwise label and unit only. The direction is always stated in the help text below the chart.
  const titleFor = (a, len) => { const full = `${a.label} (${curUnit(a.unit)}), ${dirText(a)}`; return full.length * 6.9 <= len ? full : `${a.label} (${curUnit(a.unit)})`; };
  const xTitle = titleFor(model.xAxis, iw), yTitle = titleFor(model.yAxis, ih);
  const focusRegion = focusId ? describe(byId.get(focusId)) : '';
  const tipLeft = active ? Math.min(Math.max(8, active.cx + 12), width - (phone ? 210 : 260)) : 0;
  const tipTop = active ? (active.cy > height / 2 ? Math.max(4, active.cy - 120) : active.cy + 12) : 0;

  return (
    <div className="pareto-chart" ref={wrapRef}>
      <div className="pc-stage" style={{ width, height }}>
        {useCanvas ? <canvas ref={canvasRef} className="pc-canvas" style={{ width, height }} aria-hidden="true" /> : null}
        <svg
          className="pc-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}
          id={svgId} role="application" tabIndex={0}
          aria-label={`Trade-off chart: ${model.xAxis.label} (${dirText(model.xAxis)}) against ${model.yAxis.label} (${dirText(model.yAxis)}), ${pts.length} options. Arrow keys move between options, P jumps to the weighted pick, Enter opens the option detail. The same data is in the table view.`}
          aria-describedby="pc-help"
          onPointerMove={onMove} onPointerLeave={() => setHoverId(null)} onClick={onClick} onKeyDown={onKey}
          onFocus={() => { if (!focusId && model.pickId && byId.has(model.pickId)) setFocusId(model.pickId); }}
        >
          <g className="pc-grid" aria-hidden="true">
            {xt.ticks.map((t) => <line key={`gx${t}`} x1={sx(t)} x2={sx(t)} y1={m.top} y2={m.top + ih} />)}
            {yt.ticks.map((t) => <line key={`gy${t}`} x1={m.left} x2={m.left + iw} y1={sy(t)} y2={sy(t)} />)}
          </g>
          <g className="pc-axis" aria-hidden="true">
            <line x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} />
            <line x1={m.left} x2={m.left} y1={m.top} y2={m.top + ih} />
            {xt.ticks.filter((_, i) => !phone || i % 2 === 0).map((t) => <text key={`tx${t}`} x={sx(t)} y={m.top + ih + 16} textAnchor="middle">{tickLabel(model.xAxis, t)}</text>)}
            {yt.ticks.map((t) => <text key={`ty${t}`} x={m.left - 6} y={sy(t) + 4} textAnchor="end">{tickLabel(model.yAxis, t)}</text>)}
            <text className="pc-axis-title" x={m.left + iw / 2} y={height - 8} textAnchor="middle">{xTitle}</text>
            <text className="pc-axis-title" transform={`translate(${phone ? 12 : 14},${m.top + ih / 2}) rotate(-90)`} textAnchor="middle">{yTitle}</text>
          </g>
          <g clipPath="url(#pc-clip)">
            <defs><clipPath id="pc-clip"><rect x={m.left - 10} y={m.top - 10} width={iw + 20} height={ih + 20} /></clipPath></defs>
            {!useCanvas ? (
              <g className="pc-points" aria-hidden="true">
                {drawOrder.map((g) => (
                  <path key={g.p.id} data-id={g.p.id} transform={`translate(${g.cx},${g.cy})`} d={shapePath(g.shape, g.r)}
                    className={g.p.dominatedBy ? 'pc-pt pc-dom' : 'pc-pt'}
                    style={g.p.dominatedBy ? { stroke: g.fill } : { fill: g.fill }} />
                ))}
              </g>
            ) : null}
            {frontierPath ? <path className="pc-frontier" d={frontierPath} aria-hidden="true" /> : null}
            {sel && sel !== pick && sel !== topG ? <circle className="pc-sel" cx={sel.cx} cy={sel.cy} r={sel.r + 5} aria-hidden="true" /> : null}
            {topG ? (
              <g className="pc-top" aria-hidden="true">
                <circle cx={topG.cx} cy={topG.cy} r={topG.r + 6} />
                <text x={topG.cx > m.left + iw * 0.7 ? topG.cx - topG.r - 10 : topG.cx + topG.r + 10} y={topG.cy + topG.r + 16}
                  textAnchor={topG.cx > m.left + iw * 0.7 ? 'end' : 'start'}>Highest score #{topG.p.rank}</text>
              </g>
            ) : null}
            {pick ? (
              <g className="pc-pick" aria-hidden="true">
                <circle cx={pick.cx} cy={pick.cy} r={pick.r + 6} />
                <circle className="pc-pick-inner" cx={pick.cx} cy={pick.cy} r={pick.r + 3} />
                <text x={pick.cx > m.left + iw * 0.7 ? pick.cx - pick.r - 10 : pick.cx + pick.r + 10} y={pick.cy - pick.r - 6}
                  textAnchor={pick.cx > m.left + iw * 0.7 ? 'end' : 'start'}>Weighted pick #{pick.p.rank}</text>
              </g>
            ) : null}
            {active ? <circle className="pc-focus" cx={active.cx} cy={active.cy} r={Math.max(active.r + 4, 9)} aria-hidden="true" /> : null}
          </g>
        </svg>
        {active ? (
          <div className="pc-tip" style={{ left: tipLeft, top: tipTop }} aria-hidden="true">
            <div className="pc-tip-name">#{active.p.rank} {active.p.name}</div>
            <div><strong>{fmtAxis(model.xAxis, active.p.x)}</strong> <span className="pc-tip-k">{model.xAxis.label}</span></div>
            <div><strong>{fmtAxis(model.yAxis, active.p.y)}</strong> <span className="pc-tip-k">{model.yAxis.label}</span></div>
            <div><strong>{sig(active.p.ttp, 2)} months</strong> <span className="pc-tip-k">time-to-power</span> · <strong>{money(active.p.capex, 2)}</strong> <span className="pc-tip-k">capex</span></div>
            <div><strong>{active.p.score.toFixed(1)}</strong> <span className="pc-tip-k">score</span>{model.showSiteFit !== false ? ` · site: ${active.p.siteFit || 'not assessed'}` : ''} · resilience: {active.p.resilience}{active.p.onFrontier ? ' · frontier' : ''}{active.p.isPick ? ' · weighted pick' : ''}{active.p.isTopScore ? ' · highest weighted score' : ''}</div>
            {active.p.dominatedBy ? <div className="pc-tip-k">Dominated by #{active.p.dominatedByRank} {active.p.dominatedByName}</div> : null}
            <div className="pc-tip-k">Click or press Enter to open</div>
          </div>
        ) : null}
      </div>
      <p id="pc-help" className="note">
        {model.xAxis.label}: {dirText(model.xAxis)}; {model.yAxis.label}: {dirText(model.yAxis)}.{' '}
        Keyboard: focus the chart, then use the arrow keys to move between options (left and right along {model.xAxis.label}, up and down along {model.yAxis.label}), Home and End for the ends of the x axis, P for the weighted pick, Enter to open its detail.
        {useCanvas ? <> Drawn on Canvas (more than {canvasAbove} points) <UnverifiedTag path="view.pareto.canvasAbove" compact descId="pc-canvas-basis" />.</> : ''}
      </p>
      <div className="sr-only" aria-live="polite">{focusRegion}</div>
    </div>
  );
}
