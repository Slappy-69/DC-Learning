import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DETAIL_SOURCES } from '../data/europe-detail.js';
import { pinCountryInfo } from '../engine/context.js';
import { COUNTRIES } from '../engine/defaults.js';
import { paths, eachPath, places, countryLabels, substations, pointLL, nearest, kvClass } from './mapdetail.js';

// Map pin (work package 1; BRIEF §5.1, AC 17), with the detail of 2026-11-12 (owner: "improve the visual look of the
// map tool. I want to be able to see way more detail"). An offline map of Europe from bundled data (no tiles, no
// network): Natural Earth 1:10m land, borders, regions, rivers, lakes, built-up areas, roads, railways and towns, and
// the transmission grid from an unofficial extract of the ENTSO-E map. Drag to move the map, Ctrl + scroll or pinch to
// zoom (scroll alone in full screen), click or tap to place the pin. With the map focused the arrow keys move the pin
// (0.1°, with Shift 1°), + and − zoom, Escape leaves full screen.

const EUROPE = { lon: 7, lat: 52.5 };
const WIDE = 72; // degrees of longitude across the map at zoom 1
const BOX = { w: -32, e: 46, s: 33, n: 72 };
const ZMAX = 512;
const RINGS = [5, 10, 25];
const LAYERS = [
  ['towns', 'Towns and cities', true], ['roads', 'Roads', true], ['rail', 'Railways', false], ['water', 'Rivers and lakes', true],
  ['urban', 'Built-up areas', true], ['regions', 'Regions', true], ['grid', 'Power grid', true], ['plants', 'Nearby plants', true],
  ['rings', 'Distance rings (5, 10, 25 km)', true],
];
const KEY = 'estool.mapLayers';
function initialLayers() {
  const on = Object.fromEntries(LAYERS.map(([k, , v]) => [k, v]));
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') for (const k of Object.keys(on)) if (typeof s[k] === 'boolean') on[k] = s[k]; } catch { /* storage unavailable */ }
  return on;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const kOf = (lat) => Math.cos((clamp(lat, 30, 72) * Math.PI) / 180);
const nice = (x) => { const p = 10 ** Math.floor(Math.log10(x)); const m = x / p; return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p; };
const fmtPop = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} million` : n >= 1e3 ? `${Math.round(n / 1e3).toLocaleString('en-GB')},000` : String(n));

export default function MapPicker({ lat, lon, onPick, markers = [] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState(EUROPE);
  const [size, setSize] = useState({ w: 380, h: 330 });
  const [full, setFull] = useState(false);
  const [on, setOn] = useState(initialLayers);
  const [hint, setHint] = useState('');
  const drag = useRef(null);
  const cache = useRef(null);

  // Size of the drawing, for a crisp scale at any width.
  useEffect(() => {
    const el = svgRef.current; if (!el) return undefined;
    const read = () => { const r = el.getBoundingClientRect(); if (r.width > 10 && r.height > 10) setSize((s) => (Math.abs(s.w - r.width) > 1 || Math.abs(s.h - r.height) > 1 ? { w: r.width, h: r.height } : s)); };
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => ro.disconnect();
  }, [full]);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(on)); } catch { /* storage unavailable */ } }, [on]);
  useEffect(() => {
    if (!full) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', esc);
    if (svgRef.current) svgRef.current.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [full]);

  // The view: centre in degrees, width WIDE / zoom degrees of longitude; x = lon × cos(centre latitude), y = −lat.
  const K = kOf(center.lat);
  const vbW = (WIDE / zoom) * K, vbH = vbW * (size.h / size.w);
  const vb = { x: center.lon * K - vbW / 2, y: -center.lat - vbH / 2, w: vbW, h: vbH };
  const u = vbW / size.w; // map units per screen pixel
  const degPx = u; // degrees of latitude per pixel
  const wz = Math.log2(360 / (((WIDE / zoom) / size.w) * 256)); // the web-map zoom level the view matches
  const view = [vb.x / K, -(vb.y + vb.h), (vb.x + vb.w) / K, -vb.y]; // [w, s, e, n] in degrees

  // Geometry for the area around the view, rebuilt when the view leaves it or the zoom band changes.
  const band = Math.round(Math.log2(degPx) * 2);
  const layerKey = LAYERS.map(([k]) => (on[k] ? 1 : 0)).join('');
  let g = cache.current;
  const inside = g && g.band === band && g.layerKey === layerKey && view[0] >= g.area[0] && view[1] >= g.area[1] && view[2] <= g.area[2] && view[3] <= g.area[3];
  if (!inside) {
    const ww = view[2] - view[0], hh = view[3] - view[1];
    const area = [view[0] - ww, view[1] - hh, view[2] + ww, view[3] + hh];
    const tol = degPx * 0.7, z = wz + 1;
    g = { band, layerKey, area, wz };
    g.land = eachPath('land', area, tol);
    g.urban = on.urban && wz >= 4.5 ? paths('urban', area, tol, (f) => f.z <= z + 1) : new Map();
    g.lakes = on.water ? paths('lakes', area, tol, (f) => f.z <= z + 0.5) : new Map();
    g.rivers = on.water ? paths('rivers', area, tol, (f) => f.z <= z, (f) => (f.rank <= 3 ? 'r1' : f.rank <= 7 ? 'r2' : 'r3')) : new Map();
    g.regions = on.regions && wz >= 3.5 ? paths('regions', area, tol, (f) => f.z <= z + 1) : new Map();
    g.borders = paths('borders', area, tol);
    g.rail = on.rail && wz >= 4 ? paths('rail', area, tol, (f) => f.z <= z + 1) : new Map();
    g.roads = on.roads ? paths('roads', area, tol, (f) => f.z <= z + (f.cls <= 1 ? 1 : 0) && (f.cls <= 2 || wz >= 6), (f) => `c${f.cls}`) : new Map();
    g.grid = on.grid ? paths('grid', area, tol, (f) => f.dc || f.kv >= 380 || (f.kv >= 220 && wz >= 3.8) || wz >= 5.5, (f) => `${kvClass(f.kv, f.dc)}${f.uc ? ' uc' : ''}`) : new Map();
    cache.current = g;
  }
  const P = (m, k) => m.get(k) || '';

  // Points and labels in the view, placed in screen pixels without overlaps.
  const sx = (lo) => lo * K, sy = (la) => -la;
  const inView = (lo, la, m = 0) => lo >= view[0] - m && lo <= view[2] + m && la >= view[1] - m && la <= view[3] + m;
  const labels = useMemo(() => {
    const out = []; const boxes = [];
    const free = (x, y, w, h) => { for (const b of boxes) if (x < b[2] && x + w > b[0] && y < b[3] && y + h > b[1]) return false; boxes.push([x, y, x + w, y + h]); return true; };
    const pxOf = (lo, la) => [(lo * K - vb.x) / u, (-la - vb.y) / u];
    if (on.rings && Number.isFinite(lat) && Number.isFinite(lon)) {
      const [px0, py0] = pxOf(lon, lat);
      free(px0 - 12, py0 - 12, 24, 24); // the pin
      for (const k of RINGS) { const ry = k / 111.32 / u; if (ry >= 12) free(px0 - 20, py0 - ry - 14, 40, 14); }
    }
    if (wz < 6.2) {
      for (const c of countryLabels()) {
        if (c[1] > wz) continue;
        const [lo, la] = pointLL(c, 2); if (!inView(lo, la)) continue;
        const name = c[0].toUpperCase();
        const [x, y] = pxOf(lo, la); const w = name.length * 7.6 + 8;
        if (free(x - w / 2, y - 9, w, 17)) out.push({ kind: 'country', name, x: lo * K, y: -la });
      }
    }
    if (on.towns) {
      const minPop = wz < 3.5 ? 500000 : wz < 4.5 ? 150000 : wz < 5.5 ? 40000 : wz < 6.5 ? 12000 : wz < 7.5 ? 5000 : 0;
      const lim = wz < 4 ? 45 : wz < 6 ? 130 : 260;
      let n = 0;
      for (const p of places()) {
        if (n >= lim) break;
        if (p.pop < minPop && !(p.cap === 2 && wz >= 2.5) && !(p.cap === 1 && wz >= 4.5)) { if (p.pop < minPop / 20) break; continue; }
        if (!inView(p.lon, p.lat)) continue;
        const big = p.cap === 2 || p.pop >= 500000 || (wz >= 6 && p.pop >= 100000);
        const [x, y] = pxOf(p.lon, p.lat); const w = p.name.length * (big ? 7.2 : 6.3) + 10;
        if (!free(x - 3, y - 8, w, 16)) continue;
        n++;
        out.push({ kind: big ? 'city' : 'town', name: p.name, x: p.lon * K, y: -p.lat, pop: p.pop });
      }
    }
    return out;
  }, [K, vb.x, vb.y, u, wz, on.towns, on.rings, lat, lon, size.w]); // eslint-disable-line react-hooks/exhaustive-deps
  const subs = on.grid && wz >= 5.2 ? substations().filter((s) => (s[0] >= 380 || s[2] || wz >= 6.2) && inView(s[3] / 1000, s[4] / 1000, 0.05)) : [];

  // Pointer: drag moves the map, a tap places the pin, two fingers zoom.
  const toLL = (cx, cy) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = vb.x + ((cx - r.left) / r.width) * vb.w, y = vb.y + ((cy - r.top) / r.height) * vb.h;
    return [-y, x / K];
  };
  const zoomAt = (factor, cx, cy) => {
    const nz = clamp(zoom * factor, 1, ZMAX); if (nz === zoom) return;
    let c = center;
    if (cx != null) {
      const [la, lo] = toLL(cx, cy);
      const f = zoom / nz;
      c = { lon: lo + (center.lon - lo) * f, lat: la + (center.lat - la) * f };
    }
    setZoom(nz); setCenter(nz === 1 ? EUROPE : { lon: clamp(c.lon, BOX.w, BOX.e), lat: clamp(c.lat, BOX.s, BOX.n) });
  };
  useEffect(() => {
    const el = svgRef.current; if (!el) return undefined;
    const wheel = (e) => {
      if (!full && !e.ctrlKey && !e.metaKey) { setHint('Hold Ctrl and scroll to zoom, or open the full-screen map.'); return; }
      e.preventDefault();
      zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  });
  useEffect(() => { if (!hint) return undefined; const t = setTimeout(() => setHint(''), 2200); return () => clearTimeout(t); }, [hint]);
  const pts = useRef(new Map());
  const onDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    svgRef.current.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, [e.clientX, e.clientY]);
    drag.current = { x: e.clientX, y: e.clientY, c: center, moved: pts.current.size > 1, z: zoom, pinch: pts.current.size === 2 ? pinchState() : null };
  };
  const pinchState = () => { const [a, b] = [...pts.current.values()]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: zoom, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2 }; };
  const onMove = (e) => {
    const d = drag.current; if (!d || !pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.current.size === 2 && d.pinch) {
      const [a, b] = [...pts.current.values()]; const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const nz = clamp(d.pinch.z * (dist / Math.max(1, d.pinch.d)), 1, ZMAX);
      if (Math.abs(nz - zoom) / zoom > 0.02) zoomAt(nz / zoom, d.pinch.mx, d.pinch.my);
      d.moved = true; return;
    }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    if (zoom === 1 && !full) return; // the whole of Europe already fits
    const ud = (WIDE / zoom) * K / size.w; // units per pixel at the drag's start
    setCenter({ lon: clamp(d.c.lon - (dx * ud) / K, BOX.w, BOX.e), lat: clamp(d.c.lat + dy * ud, BOX.s, BOX.n) });
  };
  const onUp = (e) => {
    const d = drag.current;
    pts.current.delete(e.pointerId);
    if (pts.current.size) return;
    drag.current = null;
    if (!d || d.moved) return;
    const [la, lo] = toLL(e.clientX, e.clientY);
    onPick(Math.round(clamp(la, -90, 90) * 100) / 100, Math.round(clamp(lo, -180, 180) * 100) / 100);
  };

  const pick = (la, lo) => {
    onPick(clamp(la, -90, 90), clamp(lo, -180, 180));
    if (!inView(lo, la, -0.02 * (view[2] - view[0]))) setCenter({ lon: lo, lat: la });
  };
  const onKey = (e) => {
    const step = e.shiftKey ? 1 : 0.1;
    const r = (x) => Math.round(x * 100) / 100;
    if (e.key === 'ArrowUp') pick(r(lat + step), lon);
    else if (e.key === 'ArrowDown') pick(r(lat - step), lon);
    else if (e.key === 'ArrowLeft') pick(lat, r(lon - step));
    else if (e.key === 'ArrowRight') pick(lat, r(lon + step));
    else if (e.key === '+' || e.key === '=') zoomAt(2);
    else if (e.key === '-' || e.key === '_') zoomAt(0.5);
    else return;
    e.preventDefault();
  };
  const toSite = () => { if (Number.isFinite(lat) && Number.isFinite(lon)) { setCenter({ lon: clamp(lon, BOX.w, BOX.e), lat: clamp(lat, BOX.s, BOX.n) }); setZoom(48); } };

  const info = pinCountryInfo(lat, lon);
  const where = info.inside
    ? `${info.mapName}${info.via === 'coast' ? ` (nearest coast, ${info.km.toFixed(1)} km)` : ''}${info.nearBorder ? `; ${info.nearBorder.km.toFixed(1)} km from ${info.nearBorder.name}, check the country` : ''}`
    : `${info.mapName ? `${info.mapName} (no built-in profile)` : 'at sea or outside the map'}; nearest built-in country ${COUNTRIES[info.code].name}`;
  const latTxt = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`, lonTxt = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  const near = useMemo(() => nearest(Number(lat), Number(lon)), [lat, lon]);
  const pinOk = Number.isFinite(lat) && Number.isFinite(lon);

  // Scale bar: about 90 px.
  const kmPx = degPx * 111.32;
  const barKm = nice(kmPx * 90), barPx = barKm / kmPx;
  const ring = (k) => ({ rx: (k / (111.32 * Math.cos((lat * Math.PI) / 180))) * K, ry: k / 111.32 });
  const fs = (px) => px * u;

  const body = (
    <div className={`map-picker${full ? ' map-full' : ''}`} role={full ? 'dialog' : undefined} aria-modal={full ? 'true' : undefined} aria-label={full ? 'Full-screen site location map' : undefined}>
      {full ? <div className="map-full-bar"><strong>Site location</strong><span className="small">Drag to move, scroll or pinch to zoom, click to place the pin. Escape closes.</span></div> : null}
      <div className="map-wrap">
        <svg ref={svgRef} id="map-picker" className={`map-svg map-tier-${wz < 3.8 ? 1 : wz < 5.5 ? 2 : 3}`} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet"
          role="application" tabIndex={0} aria-label={`Location map. Pin at ${latTxt}, ${lonTxt}: ${where}. Arrow keys move the pin by 0.1 degree, with Shift 1 degree; plus and minus zoom.`}
          aria-describedby={`${uid}-src`} onKeyDown={onKey} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <rect x={vb.x - vb.w} y={vb.y - vb.h} width={vb.w * 3} height={vb.h * 3} className="map-sea" />
          <g transform={`scale(${K} 1)`}>
            {g.land.map(({ f, d }, i) => <path key={i} d={d} className={f.iso ? 'map-land map-builtin' : 'map-land'} fillRule="evenodd" />)}
            {g.urban.size ? <path d={P(g.urban, '')} className="map-urban" /> : null}
            {g.lakes.size ? <path d={P(g.lakes, '')} className="map-lake" fillRule="evenodd" /> : null}
            {['r3', 'r2', 'r1'].map((k) => (g.rivers.has(k) ? <path key={k} d={P(g.rivers, k)} className={`map-river map-river-${k}`} /> : null))}
            {g.regions.size ? <path d={P(g.regions, '')} className="map-region" /> : null}
            <path d={P(g.borders, '')} className="map-border" />
            {g.rail.size ? <path d={P(g.rail, '')} className="map-rail" /> : null}
            {['c3', 'c2', 'c1', 'c0'].map((k) => (g.roads.has(k) ? <path key={`k${k}`} d={P(g.roads, k)} className={`map-road-case map-road-${k}`} /> : null))}
            {['c3', 'c2', 'c1', 'c0'].map((k) => (g.roads.has(k) ? <path key={k} d={P(g.roads, k)} className={`map-road map-road-${k}`} /> : null))}
            {[...g.grid.keys()].sort().map((k) => <path key={k} d={P(g.grid, k)} className={`map-grid map-grid-${k.replace(' ', ' map-grid-')}`} />)}
          </g>
          {subs.map((s, i) => { const w = (s[0] >= 380 ? 6 : 4.5) * u; return <rect key={i} x={sx(s[3] / 1000) - w / 2} y={sy(s[4] / 1000) - w / 2} width={w} height={w} className={`map-sub map-grid-${kvClass(s[0], s[2])}${s[1] ? ' map-sub-uc' : ''}`}><title>{`Substation, ${s[2] ? 'HVDC converter' : `${s[0]} kV`}${s[1] ? ', under construction in 2022' : ''} (schematic position)`}</title></rect>; })}
          {on.rings && pinOk ? <g className="map-rings" aria-hidden="true">{RINGS.map((k) => { const r = ring(k); return r.ry / u < 12 ? null : <g key={k}><ellipse cx={sx(lon)} cy={sy(lat)} rx={r.rx} ry={r.ry} /><text x={sx(lon)} y={sy(lat) - r.ry - 2 * u} fontSize={fs(10.5)} strokeWidth={fs(3)} textAnchor="middle">{k} km</text></g>; })}</g> : null}
          {on.plants && markers.length ? <g className="map-markers" aria-hidden="true">{markers.map((m) => <circle key={m.id} cx={sx(m.lon)} cy={sy(m.lat)} r={(wz >= 6 ? 5.5 : 4) * u} className={`map-marker map-marker-${m.kind}`}><title>{m.title}</title></circle>)}</g> : null}
          <g className="map-labels" aria-hidden="true">
            {labels.map((l, i) => (l.kind === 'country'
              ? <text key={i} x={l.x} y={l.y} fontSize={fs(11)} strokeWidth={fs(3)} textAnchor="middle" className="map-label map-label-country">{l.name}</text>
              : <g key={i}><circle cx={l.x} cy={l.y} r={(l.kind === 'city' ? 2.6 : 2) * u} className="map-town-dot" /><text x={l.x + 4.5 * u} y={l.y + 3.6 * u} fontSize={fs(l.kind === 'city' ? 12 : 10.5)} strokeWidth={fs(3)} className={`map-label map-label-${l.kind}`}>{l.name}</text></g>))}
          </g>
          {pinOk ? (
            <g className="map-pin" aria-hidden="true">
              <circle cx={sx(lon)} cy={sy(lat)} r={8 * u} />
              <circle cx={sx(lon)} cy={sy(lat)} r={2.7 * u} className="map-pin-dot" />
            </g>
          ) : null}
        </svg>
        <div className="map-scale" aria-hidden="true"><span style={{ width: `${barPx}px` }} />{barKm >= 1 ? `${barKm.toLocaleString('en-GB')} km` : `${barKm * 1000} m`}</div>
        {hint ? <div className="map-hint" role="status">{hint}</div> : null}
      </div>
      <div className="btn-row map-buttons">
        <button type="button" className="chip-btn" onClick={() => zoomAt(2)} aria-label="Zoom in">+</button>
        <button type="button" className="chip-btn" onClick={() => zoomAt(0.5)} aria-label="Zoom out">−</button>
        <button type="button" className="chip-btn" onClick={toSite} disabled={!pinOk}>Zoom to the site</button>
        <button type="button" className="chip-btn" onClick={() => { setZoom(1); setCenter(EUROPE); }}>All of Europe</button>
        <button type="button" className="chip-btn" aria-pressed={full} onClick={() => setFull((f) => !f)}>{full ? 'Close full screen' : 'Full-screen map'}</button>
      </div>
      <p className="small map-where"><span aria-live="polite">Pin {latTxt}, {lonTxt}: <strong>{where}</strong></span></p>
      {near ? (
        <p className="small map-near">
          {near.town ? <>Nearest town in the map data: {near.town.name} ({fmtPop(near.town.pop)} people), {near.town.km.toFixed(1)} km. </> : null}
          {near.sub220 ? <>Nearest substation of 220 kV or more: {near.sub220.dc ? 'HVDC converter' : `${near.sub220.kv} kV`}, {near.sub220.km.toFixed(1)} km{near.sub && near.sub !== near.sub220 && near.sub.km < near.sub220.km ? `; of any voltage: ${near.sub.kv} kV, ${near.sub.km.toFixed(1)} km` : ''} (positions schematic, map of 2022).</> : null}
        </p>
      ) : null}
      <details className="map-layers">
        <summary>Layers and key</summary>
        <div className="map-layer-grid">
          {LAYERS.map(([k, label]) => (
            <label key={k} className="tick"><input type="checkbox" checked={!!on[k]} onChange={(e) => setOn((s) => ({ ...s, [k]: e.target.checked }))} /> {label}</label>
          ))}
        </div>
        <ul className="map-key small">
          <li><span className="sw sw-line map-grid-v380" /> Grid 380–750 kV</li>
          <li><span className="sw sw-line map-grid-v220" /> Grid 220–330 kV</li>
          <li><span className="sw sw-line map-grid-v132" /> Grid 110–150 kV (where shown)</li>
          <li><span className="sw sw-line sw-dash map-grid-dc" /> HVDC link; dashed lines are under construction (2022)</li>
          <li><span className="sw sw-box" /> Substation (from closer in)</li>
          <li><span className="sw sw-line map-road-c0" /> Motorway <span className="sw sw-line map-road-c1" /> Main road</li>
          <li><span className="sw sw-dot map-marker-gas-in" /> Gas plant in the search <span className="sw sw-dot map-marker-gas" /> other gas plant <span className="sw sw-dot map-marker-wind" /> wind <span className="sw sw-dot map-marker-solar" /> solar <span className="sw sw-dot map-marker-hydro" /> hydro</li>
        </ul>
      </details>
      <p id={`${uid}-src`} className="note">
        Map bundled with the program, no internet needed. {DETAIL_SOURCES.map((s) => `${s.layers[0].toUpperCase()}${s.layers.slice(1)}: ${s.name} (${s.licence}).`).join(' ')} Grid positions follow the ENTSO-E map, which favours a clear drawing over exact positions, and lines built since 2022 are missing. Detail to about 200 m: type the coordinates for a precise location.
      </p>
    </div>
  );
  // Full screen: drawn over the whole page (outside the inputs panel, so nothing of the page sits on top).
  return full && typeof document !== 'undefined' ? <>{createPortal(body, document.body)}<p className="small">The map is open in full screen.</p></> : body;
}
