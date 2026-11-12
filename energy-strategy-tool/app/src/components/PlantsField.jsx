import React from 'react';
import { NumberField, TextField, ToggleField, SelectField } from './Field.jsx';
import { plantCandidates, PLANT_DEFAULTS, PLANT_SOURCE, addMonths } from '../engine/index.js';

// Existing gas plants near the site from the bundled list (work package 19, owner 2026-10-31, OPEN-QUESTIONS 116–123).
// The tool finds them; the engineer sees each value with its source, and can correct it, leave a plant out, or keep two
// merged entries apart. Corrections are kept per list entry in inputs.plants.edits.
const BASIS = { list: 'list', default: 'default', type: 'by type', entered: 'entered', none: '—' };
const STATUS = { 'running, default closure passed': 'running; closure unknown (40-year default passed)', closed: 'closed (connection only)', 'closure dated': 'running, closure dated', running: 'running', 'running, no closure date': 'running, no closure date' };

export default function PlantsField({ inputs, norm, update }) {
  const P = inputs.plants || { auto: true, edits: {} };
  const edits = P.edits || {};
  const c = plantCandidates(norm);
  const all = c.all.filter((p) => !p.manual);
  // Work package 28 (OPEN-QUESTIONS 179, 193): only the plants ticked from the results are shown here, with their inputs.
  const ticked = Array.isArray(P.ticked) ? P.ticked : null;
  const list = ticked ? all.filter((p) => ticked.includes(p.id)) : all;
  const untick = (id) => { update('plants.ticked', (ticked || all.map((p) => p.id)).filter((x) => x !== id)); resetChoices(); };
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
    <div className="plants-field" id="plants-field">
      <ToggleField label="Existing gas plants near the site (from the bundled list)" checked={P.auto !== false}
        onCommit={(v) => { update('plants.auto', v); resetChoices(); }} path="plants.auto" inputs={inputs}
        hint={`Every gas plant of ${PLANT_DEFAULTS.minMW} MW or more within ${PLANT_DEFAULTS.radiusKm} km of the site enters the analysis: its power leased or bought, as bridging or firm plant, and its grid connection taken over when it closes. Values come from the list and labelled defaults; check them with the plant's owner. ${PLANT_SOURCE.credit}: ${PLANT_SOURCE.url}.`} />
      <p className="note">Changing, leaving out or splitting a plant resets choices C2, C4 and C21 to their defaults, so every plant's values are offered again.</p>
      {P.auto !== false && ticked && list.length === 0 ? (
        <p className="note">{all.length ? `${all.length} gas plant${all.length === 1 ? '' : 's'} of ${PLANT_DEFAULTS.minMW} MW or more within ${PLANT_DEFAULTS.radiusKm} km. None is in the analysis: pick one from "Nearby plants" on the results to add it with every use, and its inputs appear here (OPEN-QUESTIONS 156, 179, 193).` : `No gas plant of ${PLANT_DEFAULTS.minMW} MW or more within ${PLANT_DEFAULTS.radiusKm} km of the pin in the bundled list.`}</p>
      ) : P.auto !== false ? (
        list.length === 0 ? <p className="note">No gas plant of {PLANT_DEFAULTS.minMW} MW or more within {PLANT_DEFAULTS.radiusKm} km of the pin in the bundled list ({PLANT_SOURCE.count} plants, {PLANT_SOURCE.builtAt}).</p> : <>
          <div className="table-wrap">
            <table className="plain small">
              <caption className="sr-only">Gas plants near the site</caption>
              <thead><tr><th scope="col">In</th><th scope="col">Plant</th><th scope="col" className="num">km</th><th scope="col" className="num">MW</th><th scope="col">Units</th><th scope="col">First year</th><th scope="col">Closes</th><th scope="col">Status</th><th scope="col">Offers</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td>{ticked ? <button type="button" className="chip-btn" aria-label={`Take ${p.name} out of the analysis`} onClick={() => untick(p.id)}>Remove</button> : <input type="checkbox" aria-label={`Include ${p.name}`} checked={p.include} onChange={(e) => edit(p.id, 'include', p.dataCentre ? (e.target.checked ? true : null) : (e.target.checked ? null : false))} />}</td>
                    <th scope="row">{p.name}{p.mergedFrom.length ? <span className="field-hint"> merged with {p.mergedFrom.map((m) => `${m.name} (${Math.round(m.mw)} MW)`).join(', ')}</span> : null}</th>
                    <td className="num">{p.km.toFixed(1)}</td>
                    <td className="num">{Math.round(p.mw)} <span className="field-hint">({BASIS[p.basis.mw]})</span></td>
                    <td>{p.units} × {Math.round(p.unitMW)} MW <span className="field-hint">({BASIS[p.basis.units]})</span></td>
                    <td>{p.firstYear ?? '—'} <span className="field-hint">({BASIS[p.basis.firstYear]})</span></td>
                    <td>{p.closeYear ?? '—'} <span className="field-hint">({p.basis.closeYear === 'default' ? `${PLANT_DEFAULTS.lifeYears} years` : BASIS[p.basis.closeYear]})</span></td>
                    <td>{!p.include && p.dataCentre ? 'left out: probably a data centre\'s own plant (tick to include)' : (STATUS[p.status] || p.status)}</td>
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
              {/* Realism rebuild (OPEN-QUESTIONS 250): an agreement in principle with the plant's owner. */}
              <ToggleField label="Its owner has agreed in principle" checked={!!(P.agreed && P.agreed[p.id])} onCommit={(v) => { const next = { ...(P.agreed || {}) }; if (v) next[p.id] = true; else delete next[p.id]; update('plants.agreed', next); }}
                hint="Unticked: every option that leases, buys or contracts this plant, or takes over its grid connection, carries the condition 'agreement with the plant's owner' and is tier B at best. Tick when the owner has agreed in principle." />
              <ToggleField label="The grid operator has confirmed import on its connection" checked={!!(P.importConfirmed && P.importConfirmed[p.id])} onCommit={(v) => { const next = { ...(P.importConfirmed || {}) }; if (v) next[p.id] = true; else delete next[p.id]; update('plants.importConfirmed', next); }}
                hint="A plant's connection is a right to feed in; the campus needs a right to take power. Unticked: every option that takes over this plant's grid connection carries that finding: a condition, or 'unlikely' in Spain, Portugal, Great Britain, Ireland and Norway, where the research found the route closed. Tick when the grid operator has confirmed it." />
              <PlantUses p={p} val={val} edit={edit} />
            </details>
          ))}
        </>
      ) : null}
    </div>
  );
}

// The new uses of a ticked plant (work package 29, OPEN-QUESTIONS 159, 161, 166–169, 177–180, 188–192), shown only for a
// plant ticked into the analysis (179). Every value is blank by default and flagged when used.
function PlantUses({ p, val, edit }) {
  const u = p.uses || { contract: {}, surplus: { share: {} }, standby: {} };
  const k = u.contract;
  const method = val(p.id, 'contractMethod') || 'fixed';
  return (
    <fieldset className="subgroup">
      <legend>Other uses of this plant <span className="legend-note">(blank = not used)</span></legend>
      <p className="note">B · Supply contract: generated as its own option once its price is entered (OPEN-QUESTIONS 192). C · The plant keeps selling the capacity the campus does not use; the campus keeps the share entered (blank = 0 %). D · Standby and flexibility income. A private wire carries the plant's power outside the grid connection, so no grid charges apply to it.</p>
      <div className="row2">
        <SelectField label="Contract price set by" value={method} onCommit={(v) => edit(p.id, 'contractMethod', v === 'fixed' ? null : v)} options={[['fixed', 'Fixed price'], ['costPlus', "The plant's cost plus a margin"], ['market', 'Wholesale price ± an adder']]} />
        {method === 'fixed' ? <NumberField label="Contract price" unit="€/MWh" value={val(p.id, 'contractPrice')} placeholder="Not entered" onCommit={(v) => edit(p.id, 'contractPrice', v)} nullable min={0} />
          : method === 'costPlus' ? <NumberField label="Margin" unit="€/MWh" value={val(p.id, 'contractMargin')} placeholder="Not entered" onCommit={(v) => edit(p.id, 'contractMargin', v)} nullable />
          : <NumberField label="Adder to the wholesale price" unit="€/MWh" value={val(p.id, 'contractAdder')} placeholder="Not entered" onCommit={(v) => edit(p.id, 'contractAdder', v)} nullable />}
      </div>
      <div className="row2">
        <NumberField label="Contract MW" unit="MW" value={val(p.id, 'contractMW')} placeholder={`${Math.round(k.mw || 0)} (up to the design load)`} onCommit={(v) => edit(p.id, 'contractMW', v)} nullable min={0} />
        <NumberField label="Contract years" unit="years" value={val(p.id, 'contractYears')} placeholder={`${k.years || ''} (the evaluation period)`} onCommit={(v) => edit(p.id, 'contractYears', v)} nullable min={1} step={1} />
      </div>
      <SelectField label="Route to the campus" value={val(p.id, 'contractRoute') || 'wire'} onCommit={(v) => edit(p.id, 'contractRoute', v === 'wire' ? null : v)} options={[['wire', 'Private wire'], ['grid', 'Through the public grid']]} />
      <div className="row2">
        <NumberField label="Surplus kept: bought" unit="%" value={val(p.id, 'surplusShareBuy')} placeholder="0" onCommit={(v) => edit(p.id, 'surplusShareBuy', v)} nullable min={0} max={100} />
        <NumberField label="Surplus kept: leased" unit="%" value={val(p.id, 'surplusShareLease')} placeholder="0" onCommit={(v) => edit(p.id, 'surplusShareLease', v)} nullable min={0} max={100} />
      </div>
      <div className="row2">
        <NumberField label="Surplus kept: supply contract" unit="%" value={val(p.id, 'surplusShareContract')} placeholder="0" onCommit={(v) => edit(p.id, 'surplusShareContract', v)} nullable min={0} max={100} />
        <NumberField label="Surplus sold at" unit="€/MWh" value={val(p.id, 'surplusPrice')} placeholder="Grid average" onCommit={(v) => edit(p.id, 'surplusPrice', v)} nullable min={0} />
      </div>
      <div className="row2">
        <NumberField label="Export limit" unit="MW" value={val(p.id, 'exportLimitMW')} placeholder="The plant's capacity" onCommit={(v) => edit(p.id, 'exportLimitMW', v)} nullable min={0} />
        <NumberField label="Standby income" unit="€/MW/yr" value={val(p.id, 'standbyPerMWYear')} placeholder="0" onCommit={(v) => edit(p.id, 'standbyPerMWYear', v)} nullable min={0} />
      </div>
      <NumberField label="Income when called" unit="€/MWh" value={val(p.id, 'standbyPerMWh')} placeholder="0" onCommit={(v) => edit(p.id, 'standbyPerMWh', v)} nullable min={0}
        hint="Recorded; not modelled, since the hours the plant is called are not known (OPEN-QUESTIONS 239)." />
    </fieldset>
  );
}

// Nearby renewable plants added from the results (work package 33, OPEN-QUESTIONS 195, 243): their uses and inputs.
export function RenewablePlantsField({ inputs, update }) {
  const P = inputs.plants || {};
  const list = Array.isArray(P.renewables) ? P.renewables : [];
  if (!list.length) return null;
  const edits = P.renewEdits || {};
  const val = (id, k) => (edits[id] && edits[id][k] !== undefined ? edits[id][k] : null);
  const edit = (id, k, x) => { const e = { ...(edits[id] || {}) }; if (x === null || x === undefined || x === '') delete e[k]; else e[k] = x; update('plants.renewEdits', { ...edits, [id]: e }); update('choices.C23', null); };
  const remove = (id) => { update('plants.renewables', list.filter((r) => r.id !== id)); update('choices.C23', null); };
  return (
    <fieldset className="subgroup" id="renew-plants-field">
      <legend>Nearby renewable plants in the analysis</legend>
      <p className="note">Each adds its uses to choice C23: bought (at the price entered, blank = the tool's new-build cost of the type, indicative), leased (once a rent is entered) and a supply contract (once a price is entered). Output follows the country's wind or solar profile scaled to the plant's MW (hydro: flat at the capacity factor), not the plant's own output.</p>
      {list.map((r) => {
        const method = val(r.id, 'contractMethod') || 'fixed';
        return (
          <details key={r.id} className="plant-detail" open>
            <summary>{r.name}: {Math.round(r.mw)} MW {String(r.typeLabel || r.type).toLowerCase()}, {Number(r.km).toFixed(1)} km <button type="button" className="chip-btn" aria-label={`Take ${r.name} out of the analysis`} onClick={() => remove(r.id)}>Remove</button></summary>
            <div className="row2">
              <NumberField label="Capacity used" unit="MW" value={val(r.id, 'mw')} placeholder={`${r.mw} (listed)`} onCommit={(x) => edit(r.id, 'mw', x)} nullable min={0} />
              <SelectField label="Route to the campus" value={val(r.id, 'route') || 'wire'} onCommit={(x) => edit(r.id, 'route', x === 'wire' ? null : x)} options={[['wire', 'Private wire'], ['grid', 'Through the public grid']]} />
            </div>
            {r.type && r.type.startsWith('hydro') ? <NumberField label="Capacity factor (hydro)" unit="fraction" value={val(r.id, 'capacityFactor')} placeholder="0.5 (judgement)" onCommit={(x) => edit(r.id, 'capacityFactor', x)} nullable min={0} max={1} step={0.01} /> : null}
            <div className="row2">
              <NumberField label="Purchase price" unit="€/MW" value={val(r.id, 'buyPricePerMW')} placeholder="New-build cost of the type" onCommit={(x) => edit(r.id, 'buyPricePerMW', x)} nullable min={0} step={10000} />
              <NumberField label="Rent" unit="€/MW/month" value={val(r.id, 'leasePerMWMonth')} placeholder="Not entered" onCommit={(x) => edit(r.id, 'leasePerMWMonth', x)} nullable min={0} />
            </div>
            <div className="row2">
              <SelectField label="Contract price set by" value={method} onCommit={(x) => edit(r.id, 'contractMethod', x === 'fixed' ? null : x)} options={[['fixed', 'Fixed price'], ['market', 'Wholesale price ± an adder']]} />
              {method === 'fixed' ? <NumberField label="Contract price" unit="€/MWh" value={val(r.id, 'contractPrice')} placeholder="Not entered" onCommit={(x) => edit(r.id, 'contractPrice', x)} nullable min={0} />
                : <NumberField label="Adder to the wholesale price" unit="€/MWh" value={val(r.id, 'contractAdder')} placeholder="Not entered" onCommit={(x) => edit(r.id, 'contractAdder', x)} nullable />}
            </div>
            <div className="row2">
              <NumberField label="Contract years" unit="years" value={val(r.id, 'contractYears')} placeholder="The evaluation period" onCommit={(x) => edit(r.id, 'contractYears', x)} nullable min={1} step={1} />
              <NumberField label="Surplus sold at" unit="€/MWh" value={val(r.id, 'surplusPrice')} placeholder="Hourly wholesale" onCommit={(x) => edit(r.id, 'surplusPrice', x)} nullable min={0} />
            </div>
            <div className="row2">
              <NumberField label="Surplus kept: bought" unit="%" value={val(r.id, 'surplusShareBuy')} placeholder="0" onCommit={(x) => edit(r.id, 'surplusShareBuy', x)} nullable min={0} max={100} />
              <NumberField label="Surplus kept: leased" unit="%" value={val(r.id, 'surplusShareLease')} placeholder="0" onCommit={(x) => edit(r.id, 'surplusShareLease', x)} nullable min={0} max={100} />
            </div>
            <NumberField label="Surplus kept: supply contract" unit="%" value={val(r.id, 'surplusShareContract')} placeholder="0" onCommit={(x) => edit(r.id, 'surplusShareContract', x)} nullable min={0} max={100} />
          </details>
        );
      })}
    </fieldset>
  );
}
