import React, { useMemo } from 'react';
import { NumberField, TextField, SelectField, ToggleField, Section, UnverifiedTag } from './Field.jsx';
import { COUNTRIES, CHOICES, PRESETS, defaultChoiceState, normalizeInputs, isAtDefault, countCombinations, nearestCountry, effectiveWeights } from '../engine/index.js';

const YM = '^\\d{4}-(0[1-9]|1[0-2])$';

export default function InputsPanel({ inputs, update, setWeights }) {
  const set = (path) => (val) => update(path, val);
  const norm = useMemo(() => normalizeInputs(inputs), [inputs]);
  const countryAuto = nearestCountry(inputs.project.lat, inputs.project.lon);
  const countryOptions = [['', `From location (${COUNTRIES[countryAuto].name})`], ...Object.entries(COUNTRIES).map(([k, c]) => [k, c.name])];
  const { w, equal } = effectiveWeights(inputs.weights);

  return (
    <div className="inputs">
      <Section title="1 · Project and location" defaultOpen>
        <TextField label="Project name" value={inputs.project.name} onCommit={set('project.name')} path="project.name" inputs={inputs} />
        <div className="row2">
          <NumberField label="Latitude" unit="°" value={inputs.project.lat} onCommit={set('project.lat')} required min={-90} max={90} />
          <NumberField label="Longitude" unit="°" value={inputs.project.lon} onCommit={set('project.lon')} required min={-180} max={180} />
        </div>
        <SelectField label="Country profile" value={inputs.project.country || ''} options={countryOptions}
          onCommit={(v) => update('project.country', v || null)} path="project.country" inputs={inputs}
          hint="Selects the synthetic country profile and price, carbon and gas defaults." />
        <TextField label="Analysis start (YYYY-MM)" value={inputs.project.analysisStart} onCommit={set('project.analysisStart')} pattern={YM} path="project.analysisStart" inputs={inputs} />
        <NumberField label="Seed" value={inputs.project.seed} onCommit={(v) => update('project.seed', Math.round(v))} path="project.seed" inputs={inputs} step={1} />
      </Section>

      <Section title="2 · Site" defaultOpen>
        {norm.site.areaFromBoundary ? (
          <p className="note">Site area {norm.site.areaHa.toFixed(2)} ha, from the {inputs.site.boundary.source || 'drawn'} boundary polygon. Use the Site tab to change or remove it.</p>
        ) : (
          <>
            <NumberField label="Site area" unit="ha" value={inputs.site.areaHa} onCommit={set('site.areaHa')} required min={0.1} />
            <NumberField label="Aspect ratio" unit=": 1" value={inputs.site.aspect} onCommit={set('site.aspect')} path="site.aspect" inputs={inputs} min={1} max={10}
              hint="Area + aspect gives a rectangle, long side east–west. Draw, type or import a boundary on the Site tab instead." />
          </>
        )}
        <div className="row2">
          <NumberField label="Boundary setback" unit="m" value={inputs.site.setbackM} onCommit={set('site.setbackM')} path="site.setbackM" inputs={inputs} min={0} />
          <NumberField label="Height limit" unit="m" value={inputs.site.heightLimitM} onCommit={set('site.heightLimitM')} path="site.heightLimitM" inputs={inputs} min={0} />
        </div>
        <div className="row2">
          <NumberField label="Roads, parking, landscaping" unit="%" scale={100} value={inputs.site.roadsFraction} onCommit={set('site.roadsFraction')} path="site.roadsFraction" inputs={inputs} min={0} max={0.9} />
          <NumberField label="Noise threshold at receptors (night)" unit="dB(A)" value={inputs.requirements.noiseNightDbA} onCommit={set('requirements.noiseNightDbA')} path="requirements.noiseNightDbA" inputs={inputs} min={0} max={100} />
        </div>
        <div className="row2">
          <NumberField label="Off-site land for generation" unit="ha" value={inputs.site.offsiteLandHa} onCommit={set('site.offsiteLandHa')} path="site.offsiteLandHa" inputs={inputs} min={0} />
          <NumberField label="Private-wire distance to off-site land" unit="km" value={inputs.site.offsiteDistanceKm} onCommit={set('site.offsiteDistanceKm')} path="site.offsiteDistanceKm" inputs={inputs} min={0} />
        </div>
        <ToggleField label="Soft exclusions can be used by ground solar" checked={inputs.site.softUsableBySolar} onCommit={set('site.softUsableBySolar')} path="site.softUsableBySolar" inputs={inputs} />
        <TextField label="Ground conditions (note)" value={inputs.site.groundConditions} onCommit={set('site.groundConditions')} path="site.groundConditions" inputs={inputs} />
        <p className="note">Boundary polygon, per-edge setbacks, exclusion zones, height zones, grid point of connection, gas main, access and noise receptors are edited on the Site tab (draw on the plan, type coordinates or import GeoJSON/KML). {inputs.site.exclusions.length} exclusion zone{inputs.site.exclusions.length === 1 ? '' : 's'}, {inputs.site.heightZones.length} height zone{inputs.site.heightZones.length === 1 ? '' : 's'}, {inputs.site.receptors.length} receptor{inputs.site.receptors.length === 1 ? '' : 's'}.</p>
      </Section>

      <Section title="3 · Load and building" defaultOpen>
        <NumberField label="IT load at full build" unit="MW" value={inputs.load.itMW} onCommit={(v) => update('load.itMW', v)} required min={1} max={2000} />
        <PhasesEditor inputs={inputs} norm={norm} update={update} />
        <div className="row2">
          <NumberField label="Ramp: share at energisation" unit="%" scale={100} value={inputs.load.rampStart} onCommit={set('load.rampStart')} path="load.rampStart" inputs={inputs} min={0} max={1} />
          <NumberField label="Ramp duration" unit="months" value={inputs.load.rampMonths} onCommit={set('load.rampMonths')} path="load.rampMonths" inputs={inputs} min={0} />
        </div>
        <NumberField label="Average IT utilisation" unit="%" scale={100} value={inputs.load.utilisation} onCommit={set('load.utilisation')} path="load.utilisation" inputs={inputs} min={0.05} max={1} />
        <SelectField label="Workload type" value={inputs.load.workload} onCommit={set('load.workload')} path="load.workload" inputs={inputs}
          options={[['cloud', 'Mixed cloud'], ['ai-training', 'AI training'], ['ai-inference', 'AI inference'], ['enterprise', 'Enterprise']]} />
        <SelectField label="Cooling approach" value={inputs.load.coolingApproach} onCommit={(v) => { update('load.coolingApproach', v); update('choices.C8', null); }} path="load.coolingApproach" inputs={inputs}
          options={[['open', 'Open choice (C8)'], ['air', 'Air (CHW + free cooling)'], ['evap', 'Evaporative-adiabatic'], ['dlc', 'DLC + dry coolers'], ['immersion', 'Immersion']]} />
        <div className="row2">
          <NumberField label="Gross-up (GFA / whitespace)" value={inputs.load.grossUp} onCommit={set('load.grossUp')} path="load.grossUp" inputs={inputs} min={1} />
          <NumberField label="Storeys" value={inputs.load.storeys} onCommit={(v) => update('load.storeys', Math.round(v))} path="load.storeys" inputs={inputs} min={1} max={6} step={1} />
        </div>
        <NumberField label="Non-IT ancillary load" unit="% of IT" scale={100} value={inputs.load.ancillaryFrac} onCommit={set('load.ancillaryFrac')} path="load.ancillaryFrac" inputs={inputs} min={0} max={0.2} />
      </Section>

      <Section title="4 · Utilities and grid" defaultOpen>
        <div className="row2">
          <NumberField label="Grid import now" unit="MW" value={inputs.grid.nowMW} onCommit={set('grid.nowMW')} required min={0} />
          <NumberField label="Grid import at full connection" unit="MW" value={inputs.grid.fullMW} onCommit={set('grid.fullMW')} required min={0} />
        </div>
        <TextField label="Full-connection date (YYYY-MM)" value={inputs.grid.fullDate} onCommit={set('grid.fullDate')} pattern={YM} required />
        <NumberField label="Grid export capacity" unit="MW" value={inputs.grid.exportMW} onCommit={set('grid.exportMW')} path="grid.exportMW" inputs={inputs} min={0}
          hint="Used only by C1 = Grid + export (not open by default)." />
        <div className="row2">
          <NumberField label="Grid price multiplier" unit="×" value={inputs.grid.priceMultiplier} onCommit={set('grid.priceMultiplier')} path="grid.priceMultiplier" inputs={inputs} min={0} />
          <NumberField label="Grid carbon multiplier" unit="×" value={inputs.grid.carbonMultiplier} onCommit={set('grid.carbonMultiplier')} path="grid.carbonMultiplier" inputs={inputs} min={0} />
        </div>
        <SelectField label="Gas available" value={inputs.utilities.gasAvailable} onCommit={set('utilities.gasAvailable')} path="utilities.gasAvailable" inputs={inputs}
          options={[['Unknown', 'Unknown'], ['Yes', 'Yes'], ['No', 'No']]} />
        <NumberField label="Gas available from" unit="months after start" value={inputs.utilities.gasDateMonths} onCommit={set('utilities.gasDateMonths')} path="utilities.gasDateMonths" inputs={inputs} min={0} />
        <SelectField label="Hydrogen availability" value={inputs.utilities.hydrogenAvailable} onCommit={set('utilities.hydrogenAvailable')} path="utilities.hydrogenAvailable" inputs={inputs}
          options={[['No', 'No'], ['Yes', 'Yes']]} />
        <SelectField label="District heating offtake nearby" value={inputs.utilities.districtHeating} onCommit={(v) => { update('utilities.districtHeating', v); update('choices.C15', null); }} path="utilities.districtHeating" inputs={inputs}
          options={[['No', 'No'], ['Yes', 'Yes']]} hint="Heat reuse is not costed in this slice." />
      </Section>

      <Section title="5 · Requirements and priorities" defaultOpen>
        <div className="row2">
          <NumberField label="Backed critical load" unit="%" scale={100} value={inputs.requirements.backedPct} onCommit={set('requirements.backedPct')} path="requirements.backedPct" inputs={inputs} min={0} max={1} />
          <SelectField label="Backup topology" value={inputs.requirements.topology} onCommit={(v) => { update('requirements.topology', v); update('choices.C6', null); }} path="requirements.topology" inputs={inputs}
            options={[['N', 'N'], ['N+1', 'N+1'], ['2N', '2N'], ['catcher', 'Distributed-redundant (catcher)']]} />
        </div>
        <div className="row2">
          <NumberField label="On-site autonomy" unit="h" value={inputs.requirements.autonomyH} onCommit={(v) => { update('requirements.autonomyH', v); update('choices.C7', null); }} path="requirements.autonomyH" inputs={inputs} min={0} />
          <SelectField label="Islanding required" value={inputs.requirements.islanding} onCommit={set('requirements.islanding')} path="requirements.islanding" inputs={inputs} options={[['No', 'No'], ['Yes', 'Yes']]} />
        </div>
        <NumberField label="Carbon target (annual average cap)" unit="gCO₂e/kWh" value={inputs.requirements.carbonTarget} onCommit={set('requirements.carbonTarget')} path="requirements.carbonTarget" inputs={inputs} nullable min={0} />
        <NumberField label="Capex ceiling" unit="€ m" scale={1e-6} value={inputs.requirements.capexCeiling} onCommit={set('requirements.capexCeiling')} path="requirements.capexCeiling" inputs={inputs} nullable min={0} />
        <NumberField label="Land-take ceiling (on site)" unit="ha" value={inputs.requirements.landTakeCeilingHa} onCommit={set('requirements.landTakeCeilingHa')} path="requirements.landTakeCeilingHa" inputs={inputs} nullable min={0}
          hint="Flag only. Empty = the net developable area (where it coincides with &quot;Does not fit&quot;); a lower value raises a minor flag without changing the site-fit status." />
        <NumberField label="Max annual run-hours, on-site combustion" unit="h/yr" value={inputs.requirements.maxRunHours} onCommit={set('requirements.maxRunHours')} path="requirements.maxRunHours" inputs={inputs} nullable min={0} />

        <fieldset className="weights">
          <legend>Weights <span className="legend-note">(effective weight = raw ÷ Σ raw)</span></legend>
          <div className="preset-row" role="group" aria-label="Weight presets">
            {Object.keys(PRESETS).map((p) => (
              <button type="button" key={p} className="chip-btn" onClick={() => setWeights(PRESETS[p])}
                aria-pressed={Object.keys(PRESETS[p]).every((k) => PRESETS[p][k] === inputs.weights[k])}>{p}</button>
            ))}
          </div>
          {[['cost', 'Cost'], ['carbon', 'Carbon'], ['ttp', 'Time-to-power'], ['deliverability', 'Deliverability']].map(([k, l]) => (
            <WeightSlider key={k} k={k} label={l} raw={inputs.weights[k]} eff={w[k]} inputs={inputs} onChange={(v) => update(`weights.${k}`, v)} />
          ))}
          {equal ? <p className="notice" role="status">All weights are 0, so equal weights (25 % each) are used.</p> : null}
          <p className="note">Weight changes re-score and re-rank only; no dispatch is re-run.</p>
        </fieldset>
      </Section>

      <Section title="6 · Choices (C1–C20)" defaultOpen badge={<ProjectedCount norm={norm} />}>
        <ChoicesPanel inputs={inputs} norm={norm} update={update} />
      </Section>

      <Section title="Run and dispatch settings">
        <SelectField label="Grid capacity handling" value={inputs.settings.gridHandling} onCommit={set('settings.gridHandling')} path="settings.gridHandling" inputs={inputs}
          options={[['unmet', 'Show unmet load'], ['exceedance', 'Show exceedance']]} />
        <SelectField label="Run-hour limit handling" value={inputs.settings.runHourHandling} onCommit={set('settings.runHourHandling')} path="settings.runHourHandling" inputs={inputs}
          options={[['flag', 'Flag only'], ['respect', 'Respect limit']]} />
        <SelectField label="Cost axis metric" value={inputs.settings.costMetric} onCommit={set('settings.costMetric')} path="settings.costMetric" inputs={inputs}
          options={[['lcoe', 'LCOE'], ['npv', 'NPV of net cost']]} />
        <SelectField label="Carbon axis metric" value={inputs.settings.carbonMetric} onCommit={set('settings.carbonMetric')} path="settings.carbonMetric" inputs={inputs}
          options={[['location', 'Location-based'], ['market', 'Market-based'], ['cfe', '1 − hourly CFE %']]} />
        <ToggleField label="Rank requirement-compliant options first" checked={inputs.settings.rankCompliantFirst} onCommit={set('settings.rankCompliantFirst')} path="settings.rankCompliantFirst" inputs={inputs}
          hint={'Off by default. On: options whose resilience is "Does not meet" or whose site fit is "Does not fit" rank after the others; no score changes.'} />
        <ToggleField label="Include site-fit penalty in deliverability" checked={inputs.deliverability.siteFitPenalty} onCommit={set('deliverability.siteFitPenalty')} path="deliverability.siteFitPenalty" inputs={inputs}
          hint={`Off by default: site fit is a status, not a weight. On: −${inputs.deliverability.siteFitFlagsPenalty} for "Fits with flags", −${inputs.deliverability.siteFitNoFitPenalty} for "Does not fit", and the axis reads "Deliverability (incl. site fit)".`} />
        <NumberField label="Generation cap" unit="options" value={inputs.settings.generationCap} onCommit={(v) => update('settings.generationCap', Math.round(v))} path="settings.generationCap" inputs={inputs} min={20} step={1} />
        <ToggleField label="Sample above cap" checked={inputs.settings.sampleAboveCap} onCommit={set('settings.sampleAboveCap')} path="settings.sampleAboveCap" inputs={inputs}
          hint="Off screens every combination (slow above the cap)." />
        <NumberField label="Wind default site threshold" unit="ha" value={inputs.settings.windSiteThresholdHa} onCommit={(v) => { update('settings.windSiteThresholdHa', v); update('choices.C11', null); }} path="settings.windSiteThresholdHa" inputs={inputs} min={0} />
        <div className="row2">
          <NumberField label="Layout raster cell" unit="m" value={inputs.settings.layoutCellM} onCommit={set('settings.layoutCellM')} path="settings.layoutCellM" inputs={inputs} min={1} max={10} />
          <NumberField label="Raster cell above the threshold" unit="m" value={inputs.settings.layoutCellLargeM} onCommit={set('settings.layoutCellLargeM')} path="settings.layoutCellLargeM" inputs={inputs} min={1} max={20} />
        </div>
        <NumberField label="Large-site threshold for the raster" unit="ha" value={inputs.settings.layoutLargeSiteHa} onCommit={set('settings.layoutLargeSiteHa')} path="settings.layoutLargeSiteHa" inputs={inputs} min={1} />
        <div className="row2">
          <NumberField label="WACC (real)" unit="%" scale={100} value={inputs.economics.wacc} onCommit={set('economics.wacc')} path="economics.wacc" inputs={inputs} min={0} max={0.3} />
          <NumberField label="Evaluation period" unit="yr" value={inputs.economics.periodYears} onCommit={(v) => update('economics.periodYears', Math.round(v))} path="economics.periodYears" inputs={inputs} min={5} max={40} step={1} />
        </div>
        <NumberField label="Contingency" unit="%" scale={100} value={inputs.economics.contingency} onCommit={set('economics.contingency')} path="economics.contingency" inputs={inputs} min={0} max={1} />
      </Section>
    </div>
  );
}

function WeightSlider({ k, label, raw, eff, inputs, onChange }) {
  const id = `w-${k}`;
  const atDefault = isAtDefault(inputs, `weights.${k}`);
  return (
    <div className="weight">
      <label htmlFor={id}>{label} <span className="eff">{(eff * 100).toFixed(0)} %</span></label>
      <input id={id} type="range" min={0} max={100} step={1} value={raw} aria-describedby={atDefault ? `${id}-basis` : undefined}
        onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`raw ${raw}, effective ${(eff * 100).toFixed(0)} percent`} />
      {atDefault ? <UnverifiedTag path={`weights.${k}`} compact descId={`${id}-basis`} /> : null}
    </div>
  );
}

function PhasesEditor({ inputs, norm, update }) {
  const atDefault = inputs.load.phases == null;
  const phases = norm.load.phases;
  const setPhases = (p) => update('load.phases', p);
  return (
    <fieldset className="phases" aria-describedby={atDefault ? 'phases-basis' : undefined}>
      <legend>Phasing {atDefault ? <UnverifiedTag path="load.phases" compact descId="phases-basis" /> : null}</legend>
      {atDefault ? <p className="note">Default: 1 phase, 100 % of IT at the grid full-connection date.</p> : null}
      <table className="mini">
        <thead><tr><th scope="col">Phase</th><th scope="col">IT MW</th><th scope="col">Date</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
        <tbody>
          {phases.map((p, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><input aria-label={`Phase ${i + 1} IT MW`} type="number" min={0} defaultValue={p.itMW} key={`it${i}-${p.itMW}`}
                onBlur={(e) => { const x = Number(e.target.value); if (Number.isFinite(x) && x !== p.itMW) setPhases(phases.map((q, j) => (j === i ? { ...q, itMW: x } : q))); }} /></td>
              <td><input aria-label={`Phase ${i + 1} date`} type="text" defaultValue={p.date} key={`d${i}-${p.date}`} pattern="\d{4}-\d{2}"
                onBlur={(e) => { const v = e.target.value; if (/^\d{4}-(0[1-9]|1[0-2])$/.test(v) && v !== p.date) setPhases(phases.map((q, j) => (j === i ? { ...q, date: v } : q))); }} /></td>
              <td>{phases.length > 1 ? <button type="button" className="icon-btn" aria-label={`Remove phase ${i + 1}`} onClick={() => setPhases(phases.filter((_, j) => j !== i))}>×</button> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="btn-row">
        <button type="button" className="chip-btn" disabled={phases.length >= 10} onClick={() => setPhases([...phases, { itMW: 0, date: phases[phases.length - 1].date }])}>Add phase</button>
        {!atDefault ? <button type="button" className="chip-btn" onClick={() => setPhases(null)}>Reset to default</button> : null}
      </div>
      <p className="note">Sum of phases: {phases.reduce((s, p) => s + Number(p.itMW), 0)} MW (IT load at full build {inputs.load.itMW} MW).</p>
    </fieldset>
  );
}

function ProjectedCount({ norm }) {
  const c = useMemo(() => countCombinations(norm), [norm]);
  const cap = norm.settings.generationCap;
  const over = c.total > cap;
  return <span className={over ? 'warn-text' : ''}>{c.total.toLocaleString('en-GB')} combinations{over ? (norm.settings.sampleAboveCap ? ` · ${cap.toLocaleString('en-GB')} sampled` : ' · above cap, all screened') : ''}</span>;
}

function ChoicesPanel({ inputs, norm, update }) {
  const c = useMemo(() => countCombinations(norm), [norm]);
  const cap = norm.settings.generationCap;
  return (
    <div className="choices">
      <p className="note" role="status">
        Projected: <strong>{c.total.toLocaleString('en-GB')}</strong> combinations after compatibility rules (cap {cap.toLocaleString('en-GB')}; sample above cap: {norm.settings.sampleAboveCap ? 'on' : 'off'}).
        {c.total > cap && norm.settings.sampleAboveCap ? ` ${cap.toLocaleString('en-GB')} will be screened (every archetype kept, seeded Latin hypercube over the rest).` : ''}
        {c.total > cap && !norm.settings.sampleAboveCap ? ' Every combination will be screened; this is slow above the cap.' : ''}
      </p>
      {CHOICES.map((ch) => <ChoiceRow key={ch.id} ch={ch} inputs={inputs} norm={norm} update={update} />)}
    </div>
  );
}

function ChoiceRow({ ch, inputs, norm, update }) {
  const st = norm.choices[ch.id];
  const def = defaultChoiceState(ch.id, norm);
  const atDefault = inputs.choices[ch.id] == null || isAtDefault(inputs, `choices.${ch.id}`);
  const locked = st.state === 'locked';
  const included = new Set(locked ? st.values.slice(0, 1) : st.values);
  const toggle = (val) => {
    let values;
    if (locked) values = [val];
    else {
      values = included.has(val) ? st.values.filter((x) => x !== val) : [...st.values, val];
      if (!values.length) return; // at least one value
      values = ch.values.map((x) => x[0]).filter((x) => values.includes(x));
    }
    update(`choices.${ch.id}`, { state: st.state, values });
  };
  const setLock = (lock) => update(`choices.${ch.id}`, { state: lock ? 'locked' : 'open', values: lock ? [st.values[0]] : st.values });
  return (
    <fieldset className="choice-row" aria-describedby={atDefault ? `choice-${ch.id}-basis` : undefined}>
      <legend>
        <span className="choice-id">{ch.id}</span> {ch.name}
        {atDefault ? <UnverifiedTag path={`choices.${ch.id}`} compact descId={`choice-${ch.id}-basis`} /> : null}
      </legend>
      <div className="chips" role="group" aria-label={`${ch.name} values`}>
        {ch.values.map(([val, label]) => (
          <button key={val} type="button" className={`chip ${included.has(val) ? 'on' : ''}`} aria-pressed={included.has(val)} onClick={() => toggle(val)}>
            {label}
          </button>
        ))}
      </div>
      <div className="choice-ctrl">
        <button type="button" className="link-btn" onClick={() => setLock(!locked)} aria-pressed={locked}>{locked ? 'Locked · open it' : 'Open · lock to first value'}</button>
        {!atDefault ? <button type="button" className="link-btn" onClick={() => update(`choices.${ch.id}`, null)}>Reset to default</button> : null}
        {ch.id === 'C11' && def.windDefault && atDefault ? <span className="info-inline">Wind not generated by default: site ≤ {inputs.settings.windSiteThresholdHa} ha (threshold editable). Wind options are available through C11.</span> : null}
      </div>
    </fieldset>
  );
}
