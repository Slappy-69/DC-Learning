import React, { useMemo, useState } from 'react';
import { plantCandidates, normalizeInputs, PLANT_DEFAULTS } from '../engine/index.js';
import { nearbyRenewables, RENEWABLE_SOURCE } from '../engine/renewables.js';
import { NumberField } from './Field.jsx';

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
          <ul className="plain small">{rn.slice(0, 20).map((r) => <li key={r.id}>{r.name}: {r.mw.toLocaleString('en-GB')} MW {r.typeLabel.toLowerCase()}, {r.km.toFixed(1)} km{r.dateIn ? `, from ${r.dateIn}` : ''}</li>)}</ul>
          {rn.length > 20 ? <p className="note">and {rn.length - 20} more (on the map in section 1).</p> : null}
        </>}
      <p className="note">Shown on the map and listed here. Their uses in the analysis (supply contract, private wire, buy, lease, surplus sales: OPEN-QUESTIONS 195) are not modelled yet: a renewable plant needs its own hourly output, which the tool does not hold for a named plant (OPEN-QUESTIONS 240). {RENEWABLE_SOURCE.credit}; {RENEWABLE_SOURCE.filter}.</p>
    </div>
  );
  if (P.auto === false || !all.length) return <section className="nearby-plants" aria-label="Nearby plants"><h3>Nearby plants</h3>{P.auto === false ? null : <p className="note">No gas plant of {PLANT_DEFAULTS.minMW} MW or more within {PLANT_DEFAULTS.radiusKm} km in the bundled list.</p>}{renew}</section>;
  const free = ticked ? all.filter((p) => !ticked.includes(p.id)) : [];
  const inRun = ticked ? all.filter((p) => ticked.includes(p.id)) : all;
  const reset = () => { update('choices.C2', null); update('choices.C4', null); update('choices.C21', null); };
  const add = () => { if (!pick) return; update('plants.ticked', [...(ticked || []), pick]); reset(); setPick(''); };
  const label = (p) => `${p.name}: ${Math.round(p.mw).toLocaleString('en-GB')} MW ${p.typeLabel.toLowerCase()}, ${p.km.toFixed(1)} km${p.dataCentre ? ' (probably a data centre\'s own plant)' : ''}`;
  return (
    <section className="nearby-plants" aria-label="Nearby plants">
      <h3>Nearby plants</h3>
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
    </section>
  );
}
