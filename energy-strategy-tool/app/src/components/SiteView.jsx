import React, { useEffect, useMemo, useRef, useState } from 'react';
import SitePlan, { SourceSwatch, planExtent } from './site/SitePlan.jsx';
import SiteFitPanel, { FitBadge } from './site/SiteFitPanel.jsx';
import SiteEditor, { TypedCoords } from './site/SiteEditor.jsx';
import BlocksTable from './site/BlocksTable.jsx';
import { normalizeInputs, buildSiteModel, siteKey, layoutForOption, viewSetting, SOURCE_LABEL, EXCLUSION_TYPES, geometry as G } from '../engine/index.js';

// Site tab (BRIEF §10.7, §10.6, §5.2): 2D plan of one option (the leader unless another is chosen) with
// layers, scale bar, north arrow and dimensions on hover and keyboard focus; site-fit panel; small
// multiples of the top options at one scale; the plan as a table; and the site editor (area + aspect,
// draw, typed coordinates, GeoJSON/KML import). Layouts are recomputed on demand with the run's own
// functions (HOOKS.layout), so the plan is the layout the option's site-fit status came from.

// Site models by site key (building one rasterises the site, so it is cached; small LRU).
const siteCache = new Map();
function siteFor(nInputs) {
  const key = siteKey(nInputs);
  let m = siteCache.get(key);
  if (!m) {
    m = buildSiteModel(nInputs);
    siteCache.set(key, m);
    while (siteCache.size > 6) siteCache.delete(siteCache.keys().next().value);
  } else { siteCache.delete(key); siteCache.set(key, m); }
  return m;
}
// Layouts by run and option (rescoring does not change them).
const layoutCache = new Map();
function layoutFor(run, site, nInputs, o) {
  const key = `${run.inputHash || ''}|${site.key}|${o.id}|${o.layoutKey || ''}`;
  let r = layoutCache.get(key);
  if (!r) {
    r = layoutForOption(site, nInputs, o);
    layoutCache.set(key, r);
    while (layoutCache.size > 48) layoutCache.delete(layoutCache.keys().next().value);
  }
  return r;
}
function cachedLayout(run, site, o) {
  return layoutCache.get(`${run.inputHash || ''}|${site.key}|${o.id}|${o.layoutKey || ''}`) || null;
}

export function smallMultiplesCount() {
  const n = Math.floor(Number(viewSetting('site.smallMultiples')));
  return n >= 0 ? n : 6;
}

const LAYERS = [
  ['boundary', 'Boundary'], ['setbacks', 'Setbacks'], ['exclusions', 'Exclusions and height zones'], ['blocks', 'Blocks'],
  ['rings', 'Clearance rings'], ['flags', 'Flags'], ['points', 'POC, access, gas, receptors'], ['dims', 'Dimensions'], ['edges', 'Edge numbers'],
];

function Legend({ res }) {
  const srcs = res ? [...new Set([...res.bs.ground.map((b) => b.source), ...(res.layout.fill && res.layout.fill.areaM2 > 0 ? ['solar'] : [])])] : [];
  return (
    <div className="sp-legend" aria-label="Plan legend" role="group">
      {srcs.map((s) => <span key={s}><SourceSwatch src={s} /> {SOURCE_LABEL[s] || s}</span>)}
      <span><svg className="sw-svg" width="18" height="13" aria-hidden="true" focusable="false"><rect x="0.5" y="0.5" width="17" height="12" fill="none" stroke="var(--plan-excl)" strokeWidth="1.5" /><path d="M2,11 L9,2 M8,12 L16,2" stroke="var(--plan-excl)" /></svg> Hard exclusion</span>
      <span><svg className="sw-svg" width="18" height="13" aria-hidden="true" focusable="false"><rect x="0.5" y="0.5" width="17" height="12" fill="none" stroke="var(--plan-soft)" strokeWidth="1.5" strokeDasharray="4 2" /></svg> Soft exclusion</span>
      <span><svg className="sw-svg" width="18" height="13" aria-hidden="true" focusable="false"><rect x="0.5" y="0.5" width="17" height="12" fill="none" stroke="var(--plan-zone)" strokeWidth="1.5" strokeDasharray="2 3" /></svg> Height zone</span>
      <span><svg className="sw-svg" width="18" height="13" aria-hidden="true" focusable="false"><rect x="0.5" y="0.5" width="17" height="12" fill="none" stroke="var(--ink-3)" strokeDasharray="5 3" /></svg> Setback line</span>
      <span><svg className="sw-svg" width="18" height="13" aria-hidden="true" focusable="false"><rect x="1.5" y="1.5" width="15" height="10" fill="none" stroke="var(--bad)" strokeWidth="2.5" /></svg> Flagged block (!)</span>
      <span><svg className="sw-svg" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="5" fill="var(--accent)" /></svg> Grid POC</span>
      <span><svg className="sw-svg" width="14" height="14" aria-hidden="true" focusable="false"><path d="M2,12 L7,2 L12,12 Z" fill="var(--ink-2)" /></svg> Access</span>
      <span><svg className="sw-svg" width="14" height="14" aria-hidden="true" focusable="false"><rect x="2" y="2" width="10" height="10" fill="var(--src-gas)" /></svg> Gas main</span>
      <span><svg className="sw-svg" width="14" height="14" aria-hidden="true" focusable="false"><path d="M7,1 L13,12 L1,12 Z" fill="var(--bad)" /></svg> Noise receptor</span>
    </div>
  );
}

function DrawBanner({ edit, draft, onFinish, onUndo, onCancel, onTyped, error }) {
  const poly = edit.shape === 'polygon';
  return (
    <div className="draw-banner" role="region" aria-label={`Drawing ${edit.label}`}>
      <p><strong>{poly ? `Draw ${edit.label}` : `Place ${edit.label}`}:</strong> {poly
        ? `tap or click the plan to add corners (${draft.length} so far), then Finish.`
        : 'tap or click the plan.'} Keyboard: focus the plan; arrow keys move the crosshair 1 m (Shift: 10 m), Enter adds {poly ? 'a corner, Backspace removes the last one, F finishes' : 'the point'}, Escape cancels.</p>
      <div className="btn-row">
        {poly ? <button type="button" className="chip-btn" disabled={draft.length < 3} onClick={onFinish}>Finish shape</button> : null}
        {poly ? <button type="button" className="chip-btn" disabled={!draft.length} onClick={onUndo}>Undo last point</button> : null}
        <button type="button" className="chip-btn" onClick={onCancel}>Cancel</button>
      </div>
      {error ? <p className="flag-text" role="alert">{error}</p> : null}
      <TypedCoords shape={edit.shape} initial={edit.initial || ''} onUse={onTyped} buttonText={poly ? 'Use typed corners' : 'Use typed point'} />
    </div>
  );
}

function SmallMultiples({ run, site, items, selectedId, onSelect }) {
  const ext = useMemo(() => planExtent(site), [site]);
  const [ready, setReady] = useState(0);
  const sig = items.map((o) => o.id).join(',');
  useEffect(() => { setReady(0); }, [sig, site]);
  useEffect(() => {
    if (ready >= items.length) return undefined;
    const t = setTimeout(() => {
      const nIn = normalizeInputs(run.inputs);
      layoutFor(run, site, nIn, items[ready]);
      setReady((r) => r + 1);
    }, 0);
    return () => clearTimeout(t);
  }, [ready, sig, site]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!items.length) return null;
  const spanM = Math.round(ext.x1 - ext.x0);
  return (
    <section className="site-multiples" aria-labelledby="mult-h">
      <h3 id="mult-h">Top {items.length} options at the same scale</h3>
      <p className="note">Each thumbnail spans {spanM.toLocaleString('en-GB')} m east–west, north up. Choose one to show its plan, site fit and table above.</p>
      <div className="multiples">
        {items.map((o, i) => {
          const r = cachedLayout(run, site, o);
          const lt = o.siteFit ? o.siteFit.landTakeHa : null;
          return (
            <button key={o.id} type="button" className="multiple" aria-pressed={o.id === selectedId} onClick={() => onSelect(o.id)} data-id={o.id}>
              {r ? <SitePlan site={site} res={r} small extent={ext} initialWidth={240} svgId={`mult-${i}`} /> : <span className="mult-wait" aria-hidden="true">Laying out…</span>}
              <span className="mt">#{o.rank} {o.name}</span>
              <span className="mt">{o.siteFit ? <FitBadge s={o.siteFit.status} /> : null}{lt != null ? ` ${lt.toFixed(2)} ha on site` : ''}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function SiteView({ run, inputs, update, optionId, setOptionId, computing }) {
  const nRun = useMemo(() => normalizeInputs(run.inputs), [run.inputs]);
  const runSite = useMemo(() => siteFor(nRun), [nRun]);
  const nCur = useMemo(() => normalizeInputs(inputs), [inputs]);
  const editSite = useMemo(() => siteFor(nCur), [nCur]);
  const stale = editSite.key !== runSite.key;

  const ranked = useMemo(() => run.options.slice().sort((a, b) => a.rank - b.rank), [run.options]);
  const option = (optionId != null && run.options.find((o) => o.id === optionId)) || ranked[0] || null;
  const res = option && !stale ? layoutFor(run, runSite, nRun, option) : null;
  const optionList = useMemo(() => ranked.map((o) => <option key={o.id} value={o.id}>#{o.rank} {o.name} · {o.siteFit ? o.siteFit.status : ''}</option>), [ranked]);
  const nMult = smallMultiplesCount();
  const multiples = useMemo(() => ranked.slice(0, nMult), [ranked, nMult]);

  const [layers, setLayers] = useState({ boundary: true, setbacks: true, exclusions: true, blocks: true, rings: false, flags: true, points: true, dims: true, edges: false });
  const [edit, setEdit] = useState(null); // { kind, shape, label, meta, initial }
  const [draft, setDraft] = useState([]);
  const [drawError, setDrawError] = useState('');
  const [active, setActive] = useState(null);
  const [notice, setNotice] = useState('');
  const planRef = useRef(null);

  const site = editSite; // the plan always shows the current site inputs; blocks only when the run matches them
  const startEdit = (e) => {
    setEdit(e); setDraft([]); setDrawError(''); setNotice('');
    setTimeout(() => { const el = document.getElementById('site-plan'); if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest' }); } }, 0);
  };
  const endEdit = (msg) => { setEdit(null); setDraft([]); setDrawError(''); if (msg) setNotice(msg); };
  const commitShape = (e, ll) => {
    const s = inputs.site;
    const ex = Array.isArray(s.exclusions) ? s.exclusions : [];
    const zs = Array.isArray(s.heightZones) ? s.heightZones : [];
    const rs = Array.isArray(s.receptors) ? s.receptors : [];
    switch (e.kind) {
      case 'boundary': update('site.setbackByEdge', null); update('site.boundary', { points: ll, source: e.typed ? 'typed' : 'drawn' }); return 'Site boundary set. All options are re-screened.';
      case 'exclusion': update('site.exclusions', [...ex, { name: `${EXCLUSION_TYPES[e.meta.type].label} ${ex.length + 1}`, type: e.meta.type, points: ll }]); return 'Exclusion added.';
      case 'zone': update('site.heightZones', [...zs, { name: `Height zone ${zs.length + 1}`, limitM: e.meta.limitM, points: ll }]); return 'Height zone added.';
      case 'receptorArea': update('site.receptors', [...rs, { name: `Receptor ${rs.length + 1}`, points: ll }]); return 'Receptor area added.';
      case 'receptor': update('site.receptors', [...rs, { name: `Receptor ${rs.length + 1}`, point: ll[0] }]); return 'Receptor added.';
      case 'poc': update('site.poc', ll[0]); return 'Grid POC placed.';
      case 'gas': update('site.gasMain', ll[0]); return 'Gas main placed.';
      case 'access': update('site.access', [...(Array.isArray(s.access) ? s.access : []), ll[0]]); return 'Access point added.';
      default: return '';
    }
  };
  const onAddPoint = (xy) => {
    if (!edit) return;
    if (edit.shape === 'point') { endEdit(commitShape(edit, [site.toLatLon(xy)])); return; }
    setDrawError('');
    setDraft((d) => [...d, xy]);
  };
  const onFinish = () => {
    if (!edit || edit.shape !== 'polygon') return;
    if (draft.length < 3) { setDrawError('Add at least 3 corners.'); return; }
    const v = G.validateRing(draft);
    if (!v.ok) { setDrawError(`Shape not valid: ${v.errors.join('; ')}.`); return; }
    endEdit(commitShape(edit, draft.map((p) => site.toLatLon(p))));
  };
  const onTyped = (ll) => { if (edit) endEdit(commitShape({ ...edit, typed: true }, ll)); };

  if (!option) return <section className="site"><h2>Site</h2><p className="empty">No options to lay out. Site fit needs a site boundary or an area.</p></section>;
  const f = option.siteFit;
  const placedN = res ? res.layout.placed.length : 0;
  const planLabel = edit ? `Site plan, ${edit.shape === 'polygon' ? 'drawing' : 'placing'} ${edit.label}` : `Site plan of #${option.rank} ${option.name}: ${f ? f.status : ''}${res ? `, ${placedN} blocks placed${res.layout.unplaced.length ? `, ${res.layout.unplaced.length} not placed` : ''}` : ''}`;

  return (
    <section className="site" aria-labelledby="site-h">
      <div className="site-head">
        <h2 id="site-h">Site layout</h2>
        <label className="small">Option shown{' '}
          <select value={option.id} onChange={(e) => setOptionId(e.target.value)}>
            {optionList}
          </select>
        </label>
        {f ? <FitBadge s={f.status} /> : null}
      </div>
      {stale ? <p className="site-stale" role="status">The site inputs changed. The plan shows the new site; layouts and site-fit statuses update when the run finishes{computing ? ' (running now)' : ''}.</p> : null}
      {notice ? <p className="small" role="status">{notice}</p> : null}

      <div className="site-columns">
        <div className="site-plan-wrap">
          <fieldset className="sp-layers">
            <legend className="sr-only">Plan layers</legend>
            {LAYERS.map(([k, l]) => (
              <label key={k}><input type="checkbox" checked={!!layers[k]} onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })} /> {l}</label>
            ))}
          </fieldset>
          {edit ? <DrawBanner edit={edit} draft={draft} error={drawError} onFinish={onFinish} onUndo={() => setDraft((d) => d.slice(0, -1))} onCancel={() => endEdit('Drawing cancelled.')} onTyped={onTyped} /> : null}
          <div ref={planRef}>
            <SitePlan site={site} res={res} layers={layers} mode={edit ? (edit.shape === 'polygon' ? 'draw' : 'place') : 'view'} draft={draft}
              onAddPoint={onAddPoint} onFinish={onFinish} onCancel={() => endEdit('Drawing cancelled.')} onUndo={() => setDraft((d) => d.slice(0, -1))}
              svgId="site-plan" label={planLabel} describeId="site-plan-desc" onActiveChange={setActive} />
          </div>
          <p id="site-plan-desc" className="note">
            {edit ? 'Drawing mode.' : 'Arrow keys move between blocks in placement order (Home, End, Escape); the focused or hovered block shows its dimensions and details.'}{' '}
            <a href="#site-table-h">The plan as a table</a> lists the same blocks. Plain plan, no map tiles; flat ground.
          </p>
          <Legend res={res} />
          <SiteEditor inputs={inputs} site={editSite} update={update} startEdit={startEdit} editing={edit} />
        </div>
        <div className="site-side">
          {res ? <SiteFitPanel res={res} option={option} inputs={nRun} /> : <p className="small">Site fit appears when the run for the current site finishes.</p>}
        </div>
      </div>

      {!stale ? <SmallMultiples run={run} site={runSite} items={multiples} selectedId={option.id} onSelect={setOptionId} /> : null}
      <BlocksTable site={site} res={res} option={option} activeIndex={active} />
    </section>
  );
}
