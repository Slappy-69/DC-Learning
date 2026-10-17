import React, { useEffect, useId, useState } from 'react';
import { NumberField, ToggleField } from '../Field.jsx';
import { geometry as G, EXCLUSION_TYPES } from '../../engine/index.js';

// Site input on the Site tab (BRIEF §5.2, §10.1, §16 phone): boundary by area + aspect rectangle, drawing
// on the plan (tap or click; keyboard crosshair), typed coordinates, or GeoJSON/KML import; per-edge
// setbacks; typed exclusions and height zones; POC, gas main, access points and noise receptors.
// Every change goes through the normal input path (update), so the run re-screens all options.

const f6 = (x) => Number(x).toFixed(6);
const n0 = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString('en-GB') : '—');
export const fmtLL = (p) => (Array.isArray(p) ? `${f6(p[0])}, ${f6(p[1])}` : '—');

// "lat, lon" per line, decimal point, separated by a comma, semicolon, tab or spaces; "#" starts a comment.
export function parseLatLonText(text) {
  const points = [], errors = [];
  String(text || '').split(/\r?\n/).forEach((line, i) => {
    const t = line.replace(/#.*$/, '').trim();
    if (!t) return;
    const parts = t.split(/[\s,;]+/).filter(Boolean);
    if (parts.length !== 2) { errors.push(`line ${i + 1}: expected "lat, lon"`); return; }
    const lat = Number(parts[0]), lon = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { errors.push(`line ${i + 1}: not a number (use a decimal point)`); return; }
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) { errors.push(`line ${i + 1}: latitude must be within ±90° and longitude within ±180°`); return; }
    points.push([lat, lon]);
  });
  return { points, errors };
}

// Polygon check in a local projection about the points' mean (same rules as the site model).
export function checkPolygonLL(points) {
  if (!Array.isArray(points) || points.length < 3) return { ok: false, errors: ['needs at least 3 points'], areaHa: 0 };
  const o = G.meanLatLon(points);
  const P = G.makeProjection(o[0], o[1]);
  const v = G.validateRing(points.map(P.toXY));
  return { ok: v.ok, errors: v.errors, areaHa: v.area / 10000 };
}

// Default "use as" for an imported feature, from its name (judgement; the user changes it before applying).
function guessPolygonUse(p, i) {
  const nm = String(p.name || '').toLowerCase();
  if (/flood/.test(nm)) return 'excl:flood';
  if (/easement|wayleave|pipeline|cable|overhead/.test(nm)) return 'excl:easement';
  if (/ecolog|habitat|wetland|hedge/.test(nm)) return 'excl:ecology';
  if (/tree|root/.test(nm)) return 'excl:tree';
  if (/structure|existing|building/.test(nm)) return 'excl:structure';
  if (/height|aviation|airport|safeguard/.test(nm)) return 'zone';
  if (/receptor|dwelling|house|school|hospital|residential/.test(nm)) return 'receptorArea';
  if (/off.?site/.test(nm)) return 'offsite';
  return i === 0 ? 'boundary' : 'ignore';
}
function guessPointUse(p) {
  const nm = String(p.name || '').toLowerCase();
  if (/\bpoc\b|point of connection|grid|substation/.test(nm)) return 'poc';
  if (/gas/.test(nm)) return 'gas';
  if (/access|entrance|gate/.test(nm)) return 'access';
  if (/receptor|dwelling|house|school|hospital|residen/.test(nm)) return 'receptor';
  return 'ignore';
}
const POLY_USES = [
  ['boundary', 'Site boundary'],
  ...Object.values(EXCLUSION_TYPES).map((t) => [`excl:${t.id}`, `Exclusion: ${t.label} (${t.hard ? 'hard' : 'soft'} by default)`]),
  ['zone', 'Height zone'],
  ['receptorArea', 'Noise receptor (area)'],
  ['offsite', 'Off-site land (area only)'],
  ['ignore', 'Ignore'],
];
const POINT_USES = [['poc', 'Grid POC'], ['gas', 'Gas main'], ['access', 'Access point'], ['receptor', 'Noise receptor'], ['ignore', 'Ignore']];

// Typed coordinates for a polygon or a point.
export function TypedCoords({ shape, initial = '', onUse, buttonText, label }) {
  const id = useId();
  const [text, setText] = useState(initial);
  const [err, setErr] = useState('');
  useEffect(() => { setText(initial); setErr(''); }, [initial]);
  const use = () => {
    const { points, errors } = parseLatLonText(text);
    if (errors.length) { setErr(errors.slice(0, 3).join('; ')); return; }
    if (shape === 'point') {
      if (points.length !== 1) { setErr('Enter one "lat, lon" pair.'); return; }
    } else {
      const c = checkPolygonLL(points);
      if (!c.ok) { setErr(`Shape not valid: ${c.errors.join('; ')}.`); return; }
    }
    setErr('');
    onUse(points);
  };
  return (
    <div className="typed">
      <label htmlFor={id} className="small">{label || (shape === 'point' ? 'Type "lat, lon" (decimal degrees)' : 'Type the corners, one "lat, lon" per line (decimal degrees)')}</label>
      {shape === 'point'
        ? <input id={id} type="text" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="51.501000, -0.142000" aria-describedby={err ? `${id}-err` : undefined} />
        : <textarea id={id} value={text} onChange={(e) => setText(e.target.value)} placeholder={'51.501000, -0.142000\n51.501000, -0.138000\n51.499000, -0.138000'} aria-describedby={err ? `${id}-err` : undefined} />}
      <div className="btn-row"><button type="button" className="chip-btn" onClick={use}>{buttonText || 'Use typed coordinates'}</button></div>
      {err ? <p id={`${id}-err`} className="flag-text small" role="alert">{err}</p> : null}
    </div>
  );
}

function SetbackInput({ edge, value, uniform, onCommit }) {
  const shown = value == null ? '' : String(value);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);
  const commit = () => {
    const t = draft.trim();
    if (t === '') { if (value != null) onCommit(null); return; }
    const x = Number(t);
    if (!Number.isFinite(x) || x < 0) { setDraft(shown); return; }
    if (x !== value) onCommit(x);
  };
  return (
    <input type="number" inputMode="decimal" min="0" step="any" value={draft} placeholder={`${uniform}`}
      aria-label={`Setback of edge ${edge.index + 1} (${edge.side}-facing side), metres; blank uses the uniform ${uniform} m`}
      onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
  );
}

function TextCell({ value, label, onCommit }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => setDraft(value || ''), [value]);
  return <input type="text" value={draft} aria-label={label} onChange={(e) => setDraft(e.target.value)} onBlur={() => { if (draft !== (value || '')) onCommit(draft); }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}
function NumCell({ value, label, onCommit, min = 0 }) {
  const shown = value == null ? '' : String(value);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);
  return <input type="number" inputMode="decimal" step="any" min={min} value={draft} aria-label={label} onChange={(e) => setDraft(e.target.value)}
    onBlur={() => { const x = Number(draft); if (draft.trim() !== '' && Number.isFinite(x) && x >= min && x !== value) onCommit(x); else setDraft(shown); }}
    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

function ImportGeo({ inputs, update }) {
  const id = useId();
  const [imp, setImp] = useState(null);
  const [msg, setMsg] = useState('');
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setMsg('');
    let text = '';
    try { text = await f.text(); } catch (err) { setImp(null); setMsg(`Could not read the file: ${err.message}`); return; }
    const r = G.parseGeoFile(text, f.name);
    const items = [
      ...r.polygons.map((p, i) => {
        const c = checkPolygonLL(p.rings[0] || []);
        const lim = Number(p.props && (p.props.limitM ?? p.props.heightLimit ?? p.props.height));
        return { key: `p${i}`, kind: 'polygon', name: p.name || `Polygon ${i + 1}`, rings: p.rings, use: c.ok ? guessPolygonUse(p, i) : 'ignore', ok: c.ok, errors: c.errors, areaHa: c.areaHa, limitM: Number.isFinite(lim) ? lim : inputs.site.heightLimitM };
      }),
      ...r.points.map((p, i) => ({ key: `q${i}`, kind: 'point', name: p.name || `Point ${i + 1}`, point: p.point, use: guessPointUse(p), ok: true, errors: [] })),
    ];
    setImp({ fileName: f.name, format: r.format, items, warnings: r.warnings });
  };
  const setUse = (key, field, val) => setImp((cur) => ({ ...cur, items: cur.items.map((it) => (it.key === key ? { ...it, [field]: val } : it)) }));
  const apply = () => {
    const s = inputs.site;
    let boundary = null, poc = null, gas = null, offsiteHa = 0, nOff = 0;
    const exclusions = [...(s.exclusions || [])], zones = [...(s.heightZones || [])], receptors = [...(s.receptors || [])];
    let access = Array.isArray(s.access) ? [...s.access] : null;
    const notes = [];
    for (const it of imp.items) {
      if (it.use === 'ignore') continue;
      if (it.kind === 'polygon') {
        const outer = it.rings[0];
        const holes = it.rings.slice(1);
        if (it.use === 'boundary') {
          if (boundary) { notes.push(`${it.name}: a second boundary is ignored`); continue; }
          boundary = { points: outer, source: 'imported' };
          holes.forEach((h, k) => exclusions.push({ name: `${it.name}: hole ${k + 1}`, type: 'other', points: h }));
          if (holes.length) notes.push(`${it.name}: ${holes.length} hole(s) added as hard exclusions (type Other)`);
        } else if (it.use.startsWith('excl:')) {
          exclusions.push({ name: it.name, type: it.use.slice(5), points: outer });
          if (holes.length) notes.push(`${it.name}: holes ignored`);
        } else if (it.use === 'zone') zones.push({ name: it.name, limitM: Number(it.limitM), points: outer });
        else if (it.use === 'receptorArea') receptors.push({ name: it.name, points: outer });
        else if (it.use === 'offsite') { offsiteHa += it.areaHa; nOff++; }
      } else if (it.use === 'poc') poc = it.point;
      else if (it.use === 'gas') gas = it.point;
      else if (it.use === 'access') access = [...(access || []), it.point];
      else if (it.use === 'receptor') receptors.push({ name: it.name, point: it.point });
    }
    if (boundary) { update('site.setbackByEdge', null); update('site.boundary', boundary); }
    if (exclusions.length !== (s.exclusions || []).length) update('site.exclusions', exclusions);
    if (zones.length !== (s.heightZones || []).length) update('site.heightZones', zones);
    if (receptors.length !== (s.receptors || []).length) update('site.receptors', receptors);
    if (access && (!s.access || access.length !== s.access.length)) update('site.access', access);
    if (poc) update('site.poc', poc);
    if (gas) update('site.gasMain', gas);
    if (nOff) update('site.offsiteLandHa', Number(offsiteHa.toFixed(3)));
    const used = imp.items.filter((it) => it.use !== 'ignore').length;
    setMsg(`Applied ${used} of ${imp.items.length} features from ${imp.fileName}.${notes.length ? ` ${notes.join('; ')}.` : ''}${nOff ? ` Off-site land set to ${offsiteHa.toFixed(2)} ha (area only; the polygon is not drawn).` : ''}`);
    setImp(null);
  };
  const boundaryBad = imp && imp.items.some((it) => it.use === 'boundary' && !it.ok);
  return (
    <div className="import-geo">
      <label htmlFor={id} className="small">Import a GeoJSON or KML file (WGS84 polygons and points)</label>
      <input id={id} type="file" accept=".geojson,.json,.kml,application/geo+json,application/vnd.google-earth.kml+xml" onChange={onFile} />
      {imp ? (
        <div className="import-list">
          <p className="small">{imp.format} file {imp.fileName}: {imp.items.length} feature{imp.items.length === 1 ? '' : 's'}. Choose what each one is, then apply.</p>
          {imp.warnings.length ? <ul className="plain small warn-text">{imp.warnings.slice(0, 6).map((w, i) => <li key={i}>{w}</li>)}</ul> : null}
          {imp.items.length ? (
            <table className="mini">
              <thead><tr><th scope="col">Feature</th><th scope="col">Use as</th></tr></thead>
              <tbody>
                {imp.items.map((it) => (
                  <tr key={it.key}>
                    <th scope="row">{it.name}<span className="sub"> · {it.kind === 'polygon' ? (it.ok ? `${it.areaHa.toFixed(2)} ha` : `not valid: ${it.errors.join('; ')}`) : fmtLL(it.point)}</span></th>
                    <td>
                      <select value={it.use} aria-label={`Use ${it.name} as`} onChange={(e) => setUse(it.key, 'use', e.target.value)}>
                        {(it.kind === 'polygon' ? POLY_USES : POINT_USES).map(([v, l]) => <option key={v} value={v} disabled={it.kind === 'polygon' && !it.ok && v !== 'ignore'}>{l}</option>)}
                      </select>
                      {it.use === 'zone' ? <> <NumCell value={it.limitM} label={`Height limit of ${it.name}, metres`} onCommit={(x) => setUse(it.key, 'limitM', x)} /> m</> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <div className="btn-row">
            <button type="button" className="chip-btn" onClick={apply} disabled={!imp.items.length || boundaryBad}>Apply import</button>
            <button type="button" className="chip-btn" onClick={() => setImp(null)}>Discard</button>
          </div>
        </div>
      ) : null}
      {msg ? <p className="small" role="status">{msg}</p> : null}
    </div>
  );
}

export default function SiteEditor({ inputs, site, update, startEdit, editing }) {
  const s = inputs.site;
  // Boundary section open at first when the site is still the area rectangle. Fixed after mount, so applying
  // a drawn, typed or imported boundary does not collapse the section the user is working in.
  const [boundaryOpen] = useState(() => site.boundary.fromArea);
  const [newType, setNewType] = useState('easement');
  const [newLimit, setNewLimit] = useState(15);
  const exList = Array.isArray(s.exclusions) ? s.exclusions : [];
  const zList = Array.isArray(s.heightZones) ? s.heightZones : [];
  const rList = Array.isArray(s.receptors) ? s.receptors : [];
  const exModel = (e, i) => site.exclusions.find((x) => x.id === (e.id || `X${i + 1}`));
  const zModel = (z, i) => site.heightZones.find((x) => x.id === (z.id || `Z${i + 1}`));
  const setAt = (path, list, i, patch) => update(path, list.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const removeAt = (path, list, i) => update(path, list.filter((_, k) => k !== i));
  const byEdge = Array.isArray(s.setbackByEdge) ? s.setbackByEdge : null;
  const setEdge = (k, v) => {
    const arr = site.edges.map((e, j) => (byEdge && byEdge.length === site.edges.length ? byEdge[j] ?? null : null));
    arr[k] = v;
    update('site.setbackByEdge', arr.every((x) => x == null) ? null : arr);
  };
  const bText = site.boundary.fromArea
    ? `Rectangle from the site area (${Number(s.areaHa).toLocaleString('en-GB')} ha) and aspect ratio ${s.aspect}:1, long side east–west, centred on the project location.`
    : `${site.boundary.source === 'imported' ? 'Imported' : site.boundary.source === 'typed' ? 'Typed' : 'Drawn'} polygon: ${site.edges.length} edges, ${(site.areas.grossM2 / 10000).toFixed(2)} ha (sets the site area).`;
  const draw = (e) => startEdit(e);
  const dis = !!editing;
  return (
    <div className="site-editor" role="group" aria-label="Edit the site">
      {site.boundary.errors.length || site.warnings.length ? (
        <ul className="plain small warn-text">{site.warnings.map((w, i) => <li key={i}>! {w.message}</li>)}</ul>
      ) : null}

      <details open={boundaryOpen}>
        <summary>Boundary</summary>
        <p className="small">{bText}</p>
        {site.boundary.fromArea ? (
          <div className="field-pair">
            <NumberField label="Site area" unit="ha" value={s.areaHa} path="site.areaHa" inputs={inputs} min={0.1} max={5000} onCommit={(v) => update('site.areaHa', v)} />
            <NumberField label="Aspect ratio (long side ÷ short side)" value={s.aspect} path="site.aspect" inputs={inputs} min={1} max={10} onCommit={(v) => update('site.aspect', v)} />
          </div>
        ) : null}
        <div className="btn-row">
          <button type="button" className="chip-btn" disabled={dis} onClick={() => draw({ kind: 'boundary', shape: 'polygon', label: 'the site boundary', initial: site.boundary.llUser.map(fmtLL).join('\n') })}>Draw boundary on the plan</button>
          {!site.boundary.fromArea ? <button type="button" className="chip-btn" disabled={dis} onClick={() => { update('site.setbackByEdge', null); update('site.boundary', null); }}>Use an area rectangle instead</button> : null}
        </div>
        <TypedCoords shape="polygon" initial={site.boundary.llUser.map(fmtLL).join('\n')} buttonText="Use these corners as the boundary"
          label="Boundary corners, one &quot;lat, lon&quot; per line (decimal degrees); edit and apply"
          onUse={(pts) => { update('site.setbackByEdge', null); update('site.boundary', { points: pts, source: 'typed' }); }} />
        <ImportGeo inputs={inputs} update={update} />
        <p className="note">Flat ground is assumed (no terrain). On a phone the area rectangle is the simplest input; drawing works by tapping corners.</p>
      </details>

      <details>
        <summary>Setbacks ({byEdge ? 'per edge' : `uniform ${s.setbackM} m`})</summary>
        <NumberField label="Boundary setback, every edge" unit="m" value={s.setbackM} path="site.setbackM" inputs={inputs} min={0} max={200} onCommit={(v) => update('site.setbackM', v)} />
        <table className="mini">
          <caption className="small">Per-edge override (blank = uniform). Edge numbers are shown on the plan with the "Edge numbers" layer.</caption>
          <thead><tr><th scope="col">Edge</th><th scope="col">Faces</th><th scope="col" className="num">Length m</th><th scope="col">Setback m</th></tr></thead>
          <tbody>
            {site.edges.map((e) => (
              <tr key={e.index}>
                <th scope="row">{e.index + 1}</th><td>{e.side}</td><td className="num">{n0(e.length)}</td>
                <td><SetbackInput edge={e} value={byEdge && byEdge.length === site.edges.length ? byEdge[e.index] ?? null : null} uniform={s.setbackM} onCommit={(v) => setEdge(e.index, v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {byEdge ? <button type="button" className="link-btn" onClick={() => update('site.setbackByEdge', null)}>Use the uniform setback on every edge</button> : null}
      </details>

      <details>
        <summary>Exclusions and height zones ({exList.length + zList.length})</summary>
        <div className="btn-row">
          <label className="small">New exclusion type{' '}
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {Object.values(EXCLUSION_TYPES).map((t) => <option key={t.id} value={t.id}>{t.label} ({t.hard ? 'hard' : 'soft'})</option>)}
            </select>
          </label>
          <button type="button" className="chip-btn" disabled={dis} onClick={() => draw({ kind: 'exclusion', shape: 'polygon', meta: { type: newType }, label: `an exclusion (${EXCLUSION_TYPES[newType].label})` })}>Draw exclusion</button>
        </div>
        {exList.length ? (
          <table className="mini">
            <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Hard / soft</th><th scope="col" className="num">Area</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {exList.map((e, i) => {
                const m = exModel(e, i);
                return (
                  <tr key={i}>
                    <td><TextCell value={e.name} label={`Name of exclusion ${i + 1}`} onCommit={(v) => setAt('site.exclusions', exList, i, { name: v })} /></td>
                    <td><select value={EXCLUSION_TYPES[e.type] ? e.type : 'other'} aria-label={`Type of exclusion ${i + 1}`} onChange={(ev) => setAt('site.exclusions', exList, i, { type: ev.target.value })}>{Object.values(EXCLUSION_TYPES).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></td>
                    <td><select value={typeof e.hard === 'boolean' ? String(e.hard) : 'default'} aria-label={`Hard or soft, exclusion ${i + 1}`} onChange={(ev) => { const v = ev.target.value; const { hard, ...rest } = e; update('site.exclusions', exList.map((x, k) => (k === i ? (v === 'default' ? rest : { ...rest, hard: v === 'true' }) : x))); }}>
                      <option value="default">Type default ({(EXCLUSION_TYPES[e.type] || EXCLUSION_TYPES.other).hard ? 'hard' : 'soft'})</option><option value="true">Hard</option><option value="false">Soft</option>
                    </select></td>
                    <td className="num">{m ? `${(m.areaM2 / 10000).toFixed(2)} ha` : <span className="flag-text">not used</span>}</td>
                    <td><button type="button" className="link-btn" onClick={() => removeAt('site.exclusions', exList, i)} aria-label={`Remove exclusion ${e.name || i + 1}`}>Remove</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="small">No exclusions. Hard exclusions are not buildable; soft ones (flood zones by default) take ground solar only.</p>}
        <ToggleField label="Soft exclusions usable by ground solar" checked={s.softUsableBySolar !== false} path="site.softUsableBySolar" inputs={inputs} onCommit={(v) => update('site.softUsableBySolar', v)} />
        <div className="btn-row">
          <label className="small">New zone limit{' '}<input type="number" inputMode="decimal" min="1" step="any" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} aria-label="Height limit of the new zone, metres" /> m</label>
          <button type="button" className="chip-btn" disabled={dis || !(newLimit > 0)} onClick={() => draw({ kind: 'zone', shape: 'polygon', meta: { limitM: newLimit }, label: `a height zone (≤ ${newLimit} m)` })}>Draw height zone</button>
        </div>
        {zList.length ? (
          <table className="mini">
            <thead><tr><th scope="col">Name</th><th scope="col">Limit m</th><th scope="col" className="num">Area</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {zList.map((z, i) => {
                const m = zModel(z, i);
                return (
                  <tr key={i}>
                    <td><TextCell value={z.name} label={`Name of height zone ${i + 1}`} onCommit={(v) => setAt('site.heightZones', zList, i, { name: v })} /></td>
                    <td><NumCell value={z.limitM} min={1} label={`Height limit of zone ${i + 1}, metres`} onCommit={(v) => setAt('site.heightZones', zList, i, { limitM: v })} /></td>
                    <td className="num">{m ? `${(m.areaM2 / 10000).toFixed(2)} ha` : <span className="flag-text">not used</span>}</td>
                    <td><button type="button" className="link-btn" onClick={() => removeAt('site.heightZones', zList, i)} aria-label={`Remove height zone ${z.name || i + 1}`}>Remove</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
        <NumberField label="Height limit (outside zones)" unit="m" value={s.heightLimitM} path="site.heightLimitM" inputs={inputs} min={1} max={300} onCommit={(v) => update('site.heightLimitM', v)} />
      </details>

      <details>
        <summary>Grid POC, gas main, access and receptors</summary>
        <table className="mini">
          <tbody>
            <tr><th scope="row">Grid POC</th><td>{s.poc ? fmtLL(s.poc) : 'Default: the access point (no road data offline)'}</td>
              <td><button type="button" className="link-btn" disabled={dis} onClick={() => draw({ kind: 'poc', shape: 'point', label: 'the grid POC' })}>Place</button>{s.poc ? <button type="button" className="link-btn" onClick={() => update('site.poc', null)}>Use default</button> : null}</td></tr>
            <tr><th scope="row">Gas main</th><td>{s.gasMain ? fmtLL(s.gasMain) : 'None (gas off site, location unknown)'}</td>
              <td><button type="button" className="link-btn" disabled={dis} onClick={() => draw({ kind: 'gas', shape: 'point', label: 'the gas main connection' })}>Place</button>{s.gasMain ? <button type="button" className="link-btn" onClick={() => update('site.gasMain', null)}>Remove</button> : null}</td></tr>
            <tr><th scope="row">Access</th><td>{Array.isArray(s.access) && s.access.length ? s.access.map((p, i) => <span key={i} className="nowrap">{fmtLL(p)} <button type="button" className="link-btn" aria-label={`Remove access point ${i + 1}`} onClick={() => update('site.access', s.access.length > 1 ? s.access.filter((_, k) => k !== i) : null)}>Remove</button><br /></span>) : 'Default: mid-point of the longest edge'}</td>
              <td><button type="button" className="link-btn" disabled={dis} onClick={() => draw({ kind: 'access', shape: 'point', label: 'an access point' })}>Add</button></td></tr>
          </tbody>
        </table>
        <h4 className="small">Noise-sensitive receptors</h4>
        {rList.length ? (
          <table className="mini">
            <thead><tr><th scope="col">Name</th><th scope="col">Where</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {rList.map((r, i) => (
                <tr key={i}>
                  <td><TextCell value={r.name} label={`Name of receptor ${i + 1}`} onCommit={(v) => setAt('site.receptors', rList, i, { name: v })} /></td>
                  <td className="small">{Array.isArray(r.point) ? fmtLL(r.point) : `area, ${Array.isArray(r.points) ? r.points.length : 0} corners`}</td>
                  <td><button type="button" className="link-btn" onClick={() => removeAt('site.receptors', rList, i)} aria-label={`Remove receptor ${r.name || i + 1}`}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="small">None: the noise proxy reports boundary levels only.</p>}
        <div className="btn-row">
          <button type="button" className="chip-btn" disabled={dis} onClick={() => draw({ kind: 'receptor', shape: 'point', label: 'a noise receptor' })}>Add receptor point</button>
          <button type="button" className="chip-btn" disabled={dis} onClick={() => draw({ kind: 'receptorArea', shape: 'polygon', label: 'a noise receptor area' })}>Draw receptor area</button>
        </div>
        <NumberField label="Night noise threshold at receptors" unit="dB(A)" value={inputs.requirements.noiseNightDbA} path="requirements.noiseNightDbA" inputs={inputs} min={20} max={90} onCommit={(v) => update('requirements.noiseNightDbA', v)} />
      </details>
    </div>
  );
}
