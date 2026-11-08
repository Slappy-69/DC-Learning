import React, { useMemo, useState } from 'react';
import { plantCandidates, normalizeInputs, PLANT_DEFAULTS } from '../engine/index.js';
import { nearbyRenewables, RENEWABLE_SOURCE } from '../engine/renewables.js';
import { NumberField } from './Field.jsx';
import { utilitiesNear, utilityLine } from '../engine/utilities.js';

// Nearby plants on the results (work package 28, owner 2026-11-07, OPEN-QUESTIONS 156–158, 193): the first run leaves
// existing plants out; when plants are found near the site, a drop box offers them, and picking one starts a new run
// with every use of that plant. Its inputs open in section 4 ("Nearby plants"). Takeover options rank on merit (157).
export default function NearbyPlantsBox({ inputs, update }) {
  const norm = useMemo(() => normalizeInputs(inputs), [inputs]);
  const c = plantCandidates(norm);
  const all = c.all.filter((p) => !p.manual);
  const P = inputs.plants || {};
  const ticked = Array.isArray(P.ticked) ? P.ticked : null;
  const [pick, setPick] = useState('');
  const rn = nearbyRenewables(Number(inputs.project.lat), Number(inputs.project.lon), P.renewMinMW, P.renewRadiusKm);
  const renew = (
    <div className="nearby-renew">
      <h4>Renewable plants near the site</h4>
      <div className="row2">
        <NumberField label="Smallest plant" unit="MW" value={P.renewMinMW ?? null} onCommit={(x) => update('plants.renewMinMW', x)} path="plants.renewMinMW" inputs={inputs} nullable min={RENEWABLE_SOURCE.minMW} placeholder="Enter" />
        <NumberField label="Within" unit="km" value={P.renewRadiusKm ?? null} onCommit={(x) => update('plants.renewRadiusKm', x)} path="plants.renewRadiusKm" inputs={inputs} nullable min={0} placeholder="Enter" />
      </div>
      {rn === null ? <p className="note">Enter both the smallest size and the distance to list wind, solar and hydro plants (no default, OPEN-QUESTIONS 196).</p>
        : !rn.length ? <p className="note">No renewable plant of {P.renewMinMW} MW or more within {P.renewRadiusKm} km in the bundled list.</p>
        : <>
          <ul className="plain small">{rn.slice(0, 20).map((r) => {
            const inAn = (P.renewables || []).some((x) => x.id === r.id);
            return <li key={r.id}>{r.name}: {r.mw.toLocaleString('en-GB')} MW {r.typeLabel.toLowerCase()}, {r.km.toFixed(1)} km{r.dateIn ? `, from ${r.dateIn}` : ''}{' '}
              {inAn ? <span className="note">(in the analysis)</span> : <button type="button" className="chip-btn" aria-label={`Add ${r.name} to the analysis`} onClick={() => { update('plants.renewables', [...(P.renewables || []), { id: r.id, name: r.name, type: r.type, typeLabel: r.typeLabel, mw: r.mw, km: Math.round(r.km * 10) / 10 }]); update('choices.C23', null); }}>Add</button>}</li>;
          })}</ul>
          {rn.length > 20 ? <p className="note">and {rn.length - 20} more (on the map in section 1).</p> : null}
        </>}
      <p className="note">Shown on the map and listed here. "Add" puts a plant in the analysis with every use (bought, leased once a rent is entered, a supply contract once a price is entered; by private wire or through the grid); its inputs are in section 4. Its output follows the country's typical wind or solar profile scaled to its MW, not the plant's own output (OPEN-QUESTIONS 195, 243). {RENEWABLE_SOURCE.credit}; {RENEWABLE_SOURCE.filter}.</p>
    </div>
  );
  // Folded by default (2026-11-08): on a phone the box would push the tabs below the first screen (browser check B19).
  const head = (txt) => <summary><span className="nearby-title">Nearby plants and utilities</span> <span className="note">{txt}</span></summary>;
  if (P.auto === false || !all.length) return <details className="nearby-plants">{head(P.auto === false ? 'plant list off' : 'no gas plant found')}{P.auto === false ? null : <p className="note">No gas plant of {PLANT_DEFAULTS.minMW} MW or more within {PLANT_DEFAULTS.radiusKm} km in the bundled list.</p>}{renew}<UtilitiesList inputs={inputs} /></details>;
  const free = ticked ? all.filter((p) => !ticked.includes(p.id)) : [];
  const inRun = ticked ? all.filter((p) => ticked.includes(p.id)) : all;
  const reset = () => { update('choices.C2', null); update('choices.C4', null); update('choices.C21', null); };
  const add = () => { if (!pick) return; update('plants.ticked', [...(ticked || []), pick]); reset(); setPick(''); };
  const label = (p) => `${p.name}: ${Math.round(p.mw).toLocaleString('en-GB')} MW ${p.typeLabel.toLowerCase()}, ${p.km.toFixed(1)} km${p.dataCentre ? ' (probably a data centre\'s own plant)' : ''}`;
  return (
    <details className="nearby-plants">
      {head(`${all.length} gas plant${all.length === 1 ? '' : 's'} found${ticked && inRun.length ? `, ${inRun.length} in the analysis` : ticked ? ', none in the analysis: open to add one' : ''}`)}
      <p className="note">{all.length} plant{all.length === 1 ? '' : 's'} of {PLANT_DEFAULTS.minMW} MW or more within {PLANT_DEFAULTS.radiusKm} km of the site. {ticked ? 'The first run leaves them out.' : 'This study was saved before plants were picked from the results, so every nearby plant is in the analysis.'} Picking a plant adds every use of it (leased, bought, its grid connection taken over) and runs again; its inputs are in section 4.</p>
      {free.length ? (
        <div className="nearby-pick">
          <label htmlFor="nearby-plant-select">Add a plant to the analysis</label>
          <select id="nearby-plant-select" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose a plant…</option>
            {free.map((p) => <option key={p.id} value={p.id}>{label(p)}</option>)}
          </select>
          <button type="button" className="chip-btn" disabled={!pick} onClick={add}>Add and run again</button>
        </div>
      ) : null}
      {ticked && inRun.length ? <p className="note">In the analysis: {inRun.map((p) => p.name).join(', ')}. <a href="#plants-field">Plant inputs in section 4</a>.</p> : null}
      {renew}
      <UtilitiesList inputs={inputs} />
    </details>
  );
}

// Utilities near the site (work package 32): warnings only, in the agreed order (OPEN-QUESTIONS 222, 234).
function UtilitiesList({ inputs }) {
  const u = utilitiesNear(Number(inputs.project.lat), Number(inputs.project.lon));
  return (
    <div className="nearby-utilities">
      <h4>Utilities near the site</h4>
      <ol className="plain small">{u.map((x) => <li key={x.id}>{utilityLine(x)}</li>)}</ol>
      <p className="note">Warnings only: no mapped distance changes a cost; the grid cable and gas pipe stay as entered (OPEN-QUESTIONS 223).</p>
    </div>
  );
}
