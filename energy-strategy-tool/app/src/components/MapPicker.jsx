import React, { useId, useMemo, useRef, useState } from 'react';
import { MAP_COUNTRIES, MAP_SOURCE } from '../data/europe-map.js';
import { countryAtPoint } from '../engine/geocountry.js';

// Map pin (work package 1; BRIEF §5.1, AC 17): an offline map of Europe from the bundled Natural Earth outlines
// (no tiles, no network). Click or tap to place the pin; with the map focused, the arrow keys move it (0.1°, with
// Shift 1°), + and − zoom. The 31 built-in countries are shaded; the country under the pin is named below the map.

const K = Math.cos((50 * Math.PI) / 180); // equirectangular, scaled for central Europe
const px = (lon) => lon * K;
const py = (lat) => -lat;
const FULL = { x: px(-26), y: py(72), w: px(46) - px(-26), h: py(33) - py(72) };

let PATHS = null;
function paths() {
  if (PATHS) return PATHS;
  PATHS = MAP_COUNTRIES.map((c) => ({
    name: c.name, iso2: c.iso2,
    d: c.rings.map((r) => `M${r.map(([lon, lat]) => `${px(lon).toFixed(2)},${py(lat).toFixed(2)}`).join('L')}Z`).join(''),
  }));
  return PATHS;
}

export default function MapPicker({ lat, lon, onPick }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState(null); // null = follow the pin
  const P = useMemo(paths, []);
  const here = countryAtPoint(lat, lon);
  const cx = center ? center[0] : px(lon), cy = center ? center[1] : py(lat);
  const w = FULL.w / zoom, h = FULL.h / zoom;
  const vb = zoom === 1 ? FULL : { x: cx - w / 2, y: cy - h / 2, w, h };
  const toLatLon = (e) => {
    const svg = svgRef.current;
    const r = svg.getBoundingClientRect();
    const x = vb.x + ((e.clientX - r.left) / r.width) * vb.w;
    const y = vb.y + ((e.clientY - r.top) / r.height) * vb.h;
    return [Math.round(-y * 100) / 100, Math.round((x / K) * 100) / 100];
  };
  const pick = (la, lo) => { onPick(Math.max(-90, Math.min(90, la)), Math.max(-180, Math.min(180, lo))); setCenter(null); };
  const onKey = (e) => {
    const step = e.shiftKey ? 1 : 0.1;
    const r = (x) => Math.round(x * 100) / 100;
    if (e.key === 'ArrowUp') pick(r(lat + step), lon);
    else if (e.key === 'ArrowDown') pick(r(lat - step), lon);
    else if (e.key === 'ArrowLeft') pick(lat, r(lon - step));
    else if (e.key === 'ArrowRight') pick(lat, r(lon + step));
    else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(32, z * 2));
    else if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(1, z / 2));
    else return;
    e.preventDefault();
  };
  const pinR = vb.w / 120;
  const where = here ? `${here.name}${here.iso2 ? '' : ' (not a built-in country)'}` : 'at sea or outside the map';
  const latTxt = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`, lonTxt = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  return (
    <div className="map-picker">
      <svg ref={svgRef} id="map-picker" className="map-svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet"
        role="application" tabIndex={0} aria-label={`Location map. Pin at ${latTxt}, ${lonTxt}: ${where}. Arrow keys move the pin by 0.1 degree, with Shift 1 degree; plus and minus zoom.`}
        aria-describedby={`${uid}-src`} onKeyDown={onKey} onClick={(e) => { const [la, lo] = toLatLon(e); pick(la, lo); }}>
        <rect x={FULL.x - 50} y={FULL.y - 50} width={FULL.w + 100} height={FULL.h + 100} className="map-sea" />
        {P.map((c, i) => <path key={i} d={c.d} className={c.iso2 ? 'map-land map-builtin' : 'map-land'} style={{ strokeWidth: vb.w / 900 }} />)}
        {Number.isFinite(lat) && Number.isFinite(lon) ? (
          <g className="map-pin" aria-hidden="true">
            <circle cx={px(lon)} cy={py(lat)} r={pinR} />
            <circle cx={px(lon)} cy={py(lat)} r={pinR / 3} className="map-pin-dot" />
          </g>
        ) : null}
      </svg>
      <div className="btn-row">
        <button type="button" className="chip-btn" onClick={() => setZoom((z) => Math.min(32, z * 2))} aria-label="Zoom in">+</button>
        <button type="button" className="chip-btn" onClick={() => setZoom((z) => Math.max(1, z / 2))} aria-label="Zoom out">−</button>
        <button type="button" className="chip-btn" onClick={() => { setZoom(1); setCenter(null); }}>All of Europe</button>
        <span className="small" aria-live="polite">Pin {latTxt}, {lonTxt}: <strong>{where}</strong></span>
      </div>
      <p id={`${uid}-src`} className="note">Map: {MAP_SOURCE.name} ({MAP_SOURCE.licence}), bundled with the program; outlines to about 1 km, no roads or place names. Type the coordinates for a precise location.</p>
    </div>
  );
}
