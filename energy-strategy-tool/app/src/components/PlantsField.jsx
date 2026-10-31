import React from 'react';
import { NumberField, TextField, ToggleField } from './Field.jsx';
import { plantCandidates, PLANT_DEFAULTS, PLANT_SOURCE, addMonths } from '../engine/index.js';

// Existing gas plants near the site from the bundled list (work package 19, owner 2026-10-31, OPEN-QUESTIONS 116–123).
// The tool finds them; the engineer sees each value with its source, and can correct it, leave a plant out, or keep two
// merged entries apart. Corrections are kept per list entry in inputs.plants.edits.
const BASIS = { list: 'list', default: 'default', type: 'by type', entered: 'entered', none: '—' };
const STATUS = { closed: 'closed (connection only)', 'closure dated': 'running, closure dated', running: 'running', 'running, no closure date': 'running, no closure date' };

export default function PlantsField({ inputs, norm, update }) {
  const P = inputs.plants || { auto: true, edits: {} };
  const edits = P.edits || {};
  const c = plantCandidates(norm);
  const list = c.all.filter((p) => !p.manual);
  const resetChoices = () => { update('choices.C2', null); update('choices.C4', null); update('choices.C21', null); };
  const edit = (id, key, val) => {
    const e = { ...(edits[id] || {}) };
    if (val === null || val === undefined || val === '') delete e[key]; else e[key] = val;
    const next = { ...edits };
    if (Object.keys(e).length) next[id] = e; else delete next[id];
    update('plants.edits', next);
    resetChoices();
  };
  const val = (id, key) => (edits[id] && edits[id][key] !== undefined ? edits[id][key] : null);
  const start = norm.project.analysisStart;
  return (
    <div className="plants-field">
      <ToggleField label="Existing gas plants near the site (from the bundled list)" checked={P.auto !== false}
        onCommit={(v) => { update('plants.auto', v); resetChoices(); }} path="plants.auto" inputs={inputs}
        hint={`Every gas plant of ${PLANT_DEFAULTS.minMW} MW or more within ${PLANT_DEFAULTS.radiusKm} km of the site enters the analysis: its power leased or bought, as bridging or firm plant, and its grid connection taken over when it closes. Values come from the list and labelled defaults; check them with the plant's owner. ${PLANT_SOURCE.credit}: ${PLANT_SOURCE.url}.`} />
      <p className="note">Changing, leaving out or splitting a plant resets choices C2, C4 and C21 to their defaults, so every plant's values are offered again.</p>
      {P.auto !== false ? (
        list.length === 0 ? <p className="note">No gas plant of {PLANT_DEFAULTS.minMW} MW or more within {PLANT_DEFAULTS.radiusKm} km of the pin in the bundled list ({PLANT_SOURCE.count} plants, {PLANT_SOURCE.builtAt}).</p> : <>
          <div className="table-wrap">
            <table className="plain small">
              <caption className="sr-only">Gas plants near the site</caption>
              <thead><tr><th scope="col">In</th><th scope="col">Plant</th><th scope="col" className="num">km</th><th scope="col" className="num">MW</th><th scope="col">Units</th><th scope="col">First year</th><th scope="col">Closes</th><th scope="col">Status</th><th scope="col">Offers</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td><input type="checkbox" aria-label={`Include ${p.name}`} checked={p.include} onChange={(e) => edit(p.id, 'include', e.target.checked ? null : false)} /></td>
                    <th scope="row">{p.name}{p.mergedFrom.length ? <span className="field-hint"> merged with {p.mergedFrom.map((m) => `${m.name} (${Math.round(m.mw)} MW)`).join(', ')}</span> : null}</th>
                    <td className="num">{p.km.toFixed(1)}</td>
                    <td className="num">{Math.round(p.mw)} <span className="field-hint">({BASIS[p.basis.mw]})</span></td>
                    <td>{p.units} × {Math.round(p.unitMW)} MW <span className="field-hint">({BASIS[p.basis.units]})</span></td>
                    <td>{p.firstYear ?? '—'} <span className="field-hint">({BASIS[p.basis.firstYear]})</span></td>
                    <td>{p.closeYear ?? '—'} <span className="field-hint">({p.basis.closeYear === 'default' ? `${PLANT_DEFAULTS.lifeYears} years` : BASIS[p.basis.closeYear]})</span></td>
                    <td>{STATUS[p.status] || p.status}</td>
                    <td>{[p.offersPower ? 'power' : null, p.offersTakeover ? `connection from ${addMonths(start, p.takeoverM)}` : null].filter(Boolean).join('; ') || 'nothing within the study'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.map((p) => (
            <details key={p.id} className="plant-edit">
              <summary>Correct {p.name} ({p.id}{p.sources.length ? `; from ${p.sources.join(', ')}` : ''})</summary>
              <div className="row2">
                <TextField label="Name" value={val(p.id, 'name')} placeholder={p.listName} onCommit={(v) => edit(p.id, 'name', v)} nullable />
                <NumberField label="Output" unit="MW" value={val(p.id, 'mw')} placeholder={String(Math.round(p.mw))} onCommit={(v) => edit(p.id, 'mw', v)} nullable min={0} />
              </div>
              <div className="row2">
                <NumberField label="Units" unit="units" value={val(p.id, 'units')} placeholder={String(p.units)} onCommit={(v) => edit(p.id, 'units', v == null ? null : Math.max(1, Math.round(v)))} nullable min={1} step={1} />
                <NumberField label="Net output per unit" unit="MW" value={val(p.id, 'unitMW')} placeholder={String(Math.round(p.unitMW))} onCommit={(v) => edit(p.id, 'unitMW', v)} nullable min={0} />
              </div>
              <div className="row2">
                <NumberField label="First year" unit="year" value={val(p.id, 'firstYear')} placeholder={p.firstYear == null ? 'Not known' : String(p.firstYear)} onCommit={(v) => edit(p.id, 'firstYear', v == null ? null : Math.round(v))} nullable step={1} />
                <NumberField label="Closure year" unit="year" value={val(p.id, 'closeYear')} placeholder={p.closeYear == null ? 'Not known' : String(p.closeYear)} onCommit={(v) => edit(p.id, 'closeYear', v == null ? null : Math.round(v))} nullable step={1} />
              </div>
              <div className="row2">
                <NumberField label="Efficiency" unit="fraction" value={val(p.id, 'eff')} placeholder={p.eff.toFixed(2)} onCommit={(v) => edit(p.id, 'eff', v)} nullable min={0.1} max={0.7} step={0.01} />
                <NumberField label="Lease" unit="€/kW/month" value={val(p.id, 'leasePerKWMonth')} placeholder={String(p.leasePerKWMonth)} onCommit={(v) => edit(p.id, 'leasePerKWMonth', v)} nullable min={0} />
              </div>
              <div className="row2">
                <NumberField label="Purchase price" unit="€/kW" value={val(p.id, 'buyPerKW')} placeholder={String(p.buyPerKW)} onCommit={(v) => edit(p.id, 'buyPerKW', v)} nullable min={0} />
                <NumberField label="Refurbishment when bought" unit="€/kW" value={val(p.id, 'refurbPerKW')} placeholder={String(p.refurbPerKW)} onCommit={(v) => edit(p.id, 'refurbPerKW', v)} nullable min={0} />
              </div>
              <div className="row2">
                <NumberField label="Fixed O&M when bought" unit="€/kW/yr" value={val(p.id, 'fomPerKW')} placeholder={String(p.fomPerKW)} onCommit={(v) => edit(p.id, 'fomPerKW', v)} nullable min={0} />
                <NumberField label="Connection to the campus" unit="€" value={val(p.id, 'linkCapex')} placeholder={String(p.linkCapex)} onCommit={(v) => edit(p.id, 'linkCapex', v)} nullable min={0} step={100000} />
              </div>
              <div className="row2">
                <NumberField label="Grid connection to take over" unit="MW" value={val(p.id, 'takeoverMW')} placeholder={String(Math.round(p.takeoverMW))} onCommit={(v) => edit(p.id, 'takeoverMW', v)} nullable min={0} />
                <NumberField label="Takeover cost" unit="€/MW" value={val(p.id, 'takeoverCostPerMW')} placeholder={String(Math.round(p.takeoverCostPerMW))} onCommit={(v) => edit(p.id, 'takeoverCostPerMW', v)} nullable min={0} step={1000} />
              </div>
              <div className="row2">
                <NumberField label="Months from closure to using its connection" unit="months" value={val(p.id, 'takeoverLagMonths')} placeholder={String(p.takeoverLagMonths)} onCommit={(v) => edit(p.id, 'takeoverLagMonths', v == null ? null : Math.max(0, Math.round(v)))} nullable min={0} step={1} />
                <NumberField label="Years the refurbishment adds when bought" unit="years" value={val(p.id, 'buyExtraYears')} placeholder={String(p.buyExtraYears)} onCommit={(v) => edit(p.id, 'buyExtraYears', v == null ? null : Math.max(0, Math.round(v)))} nullable min={0} step={1} />
              </div>
              {p.mergedFrom.length ? <ToggleField label="Keep the merged entries apart" checked={!!val(p.id, 'split')} onCommit={(v) => { const ids = [p.id, ...p.mergedFrom.map((m) => m.id)]; const next = { ...edits }; for (const id of ids) { const e = { ...(next[id] || {}) }; if (v) e.split = true; else delete e.split; if (Object.keys(e).length) next[id] = e; else delete next[id]; } update('plants.edits', next); resetChoices(); }}
                hint="The list may hold one plant twice; the tool merges entries that are close, of the same type and of similar size. Tick to treat them as separate plants." /> : null}
            </details>
          ))}
        </>
      ) : null}
    </div>
  );
}
