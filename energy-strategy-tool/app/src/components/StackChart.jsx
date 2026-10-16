import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { sig } from '../format.js';

// Stacked step chart for dispatch and phasing views (hand-written SVG, one y-axis).
//  - pos: series stacked upwards from zero, bottom to top in the order given (merit order).
//  - neg: series stacked downwards from zero (energy that does not serve the load).
//  - line: one reference line (demand), 2px in the primary ink.
//  - strip: a status strip above the plot in the critical colour, drawn where its value > 0
//    (unmet load or power gap). It never touches the categorical bands (colour checks: the
//    critical red is too close to the source colours to sit beside them).
//  - markers: labelled vertical hairlines at interval starts (dates, events).
// Every value is per interval (an hour or a month), so bands and the line are steps.
// Hover or arrow keys move a crosshair; the readout lists every series at that interval.
// Colours come from CSS tokens (styles.css), set per theme; text uses the ink tokens only.

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useWidth(ref) {
  const [w, setW] = useState(640);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => setW(Math.max(240, Math.floor(el.clientWidth || 640)));
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function niceStep(span, n) {
  const raw = span / Math.max(1, n);
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m >= 5 ? 10 : m >= 2 ? 5 : m >= 1 ? 2 : 1) * p;
}
function niceTicks(lo, hi, n) {
  if (!(hi > lo)) hi = lo + 1;
  const step = niceStep(hi - lo, n);
  const a = Math.floor(lo / step + 1e-9) * step;
  const b = Math.ceil(hi / step - 1e-9) * step;
  const t = [];
  for (let v = a; v <= b + step * 1e-9; v += step) t.push(Number(v.toPrecision(12)));
  return { ticks: t, lo: a, hi: b };
}

const f1 = (v) => (Math.round(v * 10) / 10).toString();

function bandPath(x, y, base, top, n) {
  let d = `M${f1(x(0))},${f1(y(top[0]))}H${f1(x(1))}`;
  for (let i = 1; i < n; i++) d += `V${f1(y(top[i]))}H${f1(x(i + 1))}`;
  for (let i = n - 1; i >= 0; i--) d += `V${f1(y(base[i]))}H${f1(x(i))}`;
  return `${d}Z`;
}
function stepLine(x, y, vals, n) {
  let d = `M${f1(x(0))},${f1(y(vals[0]))}H${f1(x(1))}`;
  for (let i = 1; i < n; i++) d += `V${f1(y(vals[i]))}H${f1(x(i + 1))}`;
  return d;
}

export function fmtMW(v, unit = 'MW') {
  return `${sig(v, 3)} ${unit}`;
}

export default function StackChart({
  n, offset = 0, pos = [], neg = [], line = null, strip = null, markers = [], xTicks = [],
  unit = 'MW', height = 220, readout, ariaLabel, legendItems = [],
}) {
  const wrapRef = useRef(null);
  const W = useWidth(wrapRef);
  const [hover, setHover] = useState(null);
  const [kbd, setKbd] = useState(false);
  useEffect(() => { setHover(null); }, [n, offset]);

  const geom = useMemo(() => {
    const at = (arr, i) => {
      const v = arr ? arr[offset + i] : 0;
      return Number.isFinite(v) && v > 0 ? v : 0;
    };
    let base = new Float64Array(n);
    const posS = pos.map((s) => {
      const top = new Float64Array(n);
      let any = false;
      for (let i = 0; i < n; i++) { const v = at(s.values, i); top[i] = base[i] + v; if (v > 1e-9) any = true; }
      const out = { ...s, base, top, any };
      base = top;
      return out;
    });
    const posTop = base;
    let nb = new Float64Array(n);
    const negS = neg.map((s) => {
      const bot = new Float64Array(n);
      let any = false;
      for (let i = 0; i < n; i++) { const v = at(s.values, i); bot[i] = nb[i] - v; if (v > 1e-9) any = true; }
      const out = { ...s, base: nb, top: bot, any };
      nb = bot;
      return out;
    });
    const lineV = line ? Float64Array.from({ length: n }, (_, i) => at(line.values, i)) : null;
    let hi = 0;
    let lo = 0;
    for (let i = 0; i < n; i++) {
      if (posTop[i] > hi) hi = posTop[i];
      if (lineV && lineV[i] > hi) hi = lineV[i];
      if (nb[i] < lo) lo = nb[i];
    }
    const runs = [];
    if (strip) {
      let s0 = null;
      for (let i = 0; i <= n; i++) {
        const on = i < n && at(strip.values, i) > 1e-6;
        if (on && s0 === null) s0 = i;
        if (!on && s0 !== null) { runs.push([s0, i]); s0 = null; }
      }
    }
    return { posS, negS, lineV, runs, ticks: niceTicks(lo, hi > lo ? hi : lo + 1, height >= 150 ? 5 : 3) };
  }, [n, offset, pos, neg, line, strip, height]);

  // Marker labels on as many rows as needed so they never overlap.
  const M = { l: 46, r: 10, b: 24 };
  const plotW = Math.max(60, W - M.l - M.r);
  const x = (i) => M.l + (i / n) * plotW;
  const charW = 6.1;
  const placed = [];
  for (const mk of [...markers].sort((a, b) => a.i - b.i)) {
    if (mk.i == null || mk.i < 0 || mk.i > n) continue;
    const px = x(mk.i);
    const w = mk.label.length * charW + 8;
    const anchorEnd = px + w > M.l + plotW;
    const left = anchorEnd ? px - w : px;
    let row = 0;
    while (placed.some((p) => p.row === row && !(left >= p.right + 4 || left + w <= p.left - 4))) row++;
    placed.push({ ...mk, px, row, left, right: left + w, anchorEnd });
  }
  const rows = placed.length ? Math.max(...placed.map((p) => p.row)) + 1 : 0;
  const stripH = strip ? 14 : 0;
  M.t = 6 + rows * 14 + stripH;
  const H = M.t + height + M.b;
  const { lo, hi, ticks } = geom.ticks;
  const y = (v) => M.t + (1 - (v - lo) / (hi - lo)) * height;
  const bw = plotW / n;

  const tickEvery = xTicks.length > 1 ? (x(xTicks[1].i) - x(xTicks[0].i)) : plotW;
  const tickLabels = xTicks.filter((t, k) => tickEvery >= 30 || k % Math.ceil(30 / Math.max(1, tickEvery)) === 0);

  const onMove = (e) => {
    const r = e.currentTarget.ownerSVGElement ? e.currentTarget.ownerSVGElement.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.floor(((px - M.l) / plotW) * n);
    setKbd(false);
    setHover(i >= 0 && i < n ? i : null);
  };
  const onKey = (e) => {
    const step = e.shiftKey ? Math.max(1, Math.round(n / 12)) : 1;
    let next = null;
    if (e.key === 'ArrowRight') next = hover == null ? 0 : Math.min(n - 1, hover + step);
    else if (e.key === 'ArrowLeft') next = hover == null ? n - 1 : Math.max(0, hover - step);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') { setHover(null); return; }
    else return;
    e.preventDefault();
    setKbd(true);
    setHover(next);
  };

  const ro = hover != null && readout ? readout(hover) : null;
  const tipW = Math.min(260, W - 8);
  const tipLeft = hover != null ? (x(hover) + bw / 2 + 14 + tipW <= W ? x(hover) + bw / 2 + 14 : Math.max(4, x(hover) + bw / 2 - 14 - tipW)) : 0;
  const roText = ro ? `${ro.title}. ${ro.rows.filter(Boolean).map((r) => `${r.label} ${r.text}`).join('; ')}` : '';

  return (
    <div className="sc">
      {legendItems.length ? (
        <ul className="sc-legend" aria-label="Legend">
          {legendItems.map((it) => (
            <li key={it.label}>
              {it.kind === 'line' ? <span className="sc-key-line" aria-hidden="true" />
                : it.kind === 'strip' ? <span className="sc-key-strip" aria-hidden="true" />
                  : <span className="sc-key-area" style={{ background: it.color }} aria-hidden="true" />}
              <span>{it.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="sc-wrap" ref={wrapRef} tabIndex={0} role="group" aria-label={`${ariaLabel} Use the left and right arrow keys to read values; Shift moves faster.`}
        onKeyDown={onKey} onBlur={() => { if (kbd) setHover(null); }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="sc-svg">
          {ticks.map((t) => (
            <g key={`t${t}`}>
              <line x1={M.l} x2={M.l + plotW} y1={Math.round(y(t)) + 0.5} y2={Math.round(y(t)) + 0.5} className={Math.abs(t) < 1e-12 ? 'sc-zero' : 'sc-grid'} />
              <text x={M.l - 6} y={y(t)} className="sc-tick" textAnchor="end" dominantBaseline="middle">{sig(t, 3)}</text>
            </g>
          ))}
          <text x={4} y={M.t - stripH - 4 > 8 ? M.t - stripH - 4 : 10} className="sc-unit">{unit}</text>
          {geom.posS.map((s) => (s.any ? <path key={`p${s.key}`} d={bandPath(x, y, s.base, s.top, n)} fill={s.color} className="sc-band" /> : null))}
          {geom.negS.map((s) => (s.any ? <path key={`n${s.key}`} d={bandPath(x, y, s.base, s.top, n)} fill={s.color} className="sc-band" /> : null))}
          {geom.lineV ? <path d={stepLine(x, y, geom.lineV, n)} className="sc-line" /> : null}
          {strip ? geom.runs.map(([a, b]) => <rect key={`s${a}`} x={x(a)} y={M.t - stripH + 2} width={Math.max(1.5, x(b) - x(a))} height={8} className="sc-strip" />) : null}
          {placed.map((p) => (
            <g key={`m${p.label}${p.i}`}>
              <line x1={Math.round(p.px) + 0.5} x2={Math.round(p.px) + 0.5} y1={6 + p.row * 14 + 4} y2={M.t + height} className="sc-marker" />
              <text x={p.anchorEnd ? p.px - 4 : p.px + 4} y={6 + p.row * 14 + 9} className="sc-mlabel" textAnchor={p.anchorEnd ? 'end' : 'start'}>{p.label}</text>
            </g>
          ))}
          {tickLabels.map((t) => {
            const px = x(t.i);
            const end = px + t.label.length * charW > M.l + plotW;
            return <text key={`x${t.i}`} x={end ? M.l + plotW : px + 2} y={M.t + height + 15} className="sc-tick" textAnchor={end ? 'end' : 'start'}>{t.label}</text>;
          })}
          {hover != null ? (bw >= 6
            ? <rect x={x(hover)} y={M.t} width={bw} height={height} className="sc-hoverband" />
            : <line x1={x(hover) + bw / 2} x2={x(hover) + bw / 2} y1={M.t} y2={M.t + height} className="sc-cross" />) : null}
          <rect x={M.l} y={M.t - stripH} width={plotW} height={height + stripH} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => { if (!kbd) setHover(null); }} />
        </svg>
        {ro ? (
          <div className="sc-tip" style={{ left: tipLeft, top: M.t + 4, width: tipW }} aria-hidden="true">
            <div className="sc-tip-title">{ro.title}</div>
            {ro.rows.filter(Boolean).map((r) => (
              <div key={r.label} className={`sc-tip-row${r.sub ? ' sc-tip-sub' : ''}`}>
                {r.key === 'line' ? <span className="sc-key-line" /> : r.key === 'strip' ? <span className="sc-key-strip" /> : r.color ? <span className="sc-key-tip" style={{ background: r.color }} /> : <span className="sc-key-none" />}
                <strong>{r.text}</strong>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">{kbd ? roText : ''}</p>
      </div>
    </div>
  );
}
