import React, { useMemo } from 'react';
import { NumberField, TextField, SelectField, ToggleField, Section, UnverifiedTag } from './Field.jsx';
import { COUNTRIES, CHOICES, PRESETS, defaultChoiceState, normalizeInputs, isAtDefault, countCombinations, countryFromPin, pinCountryInfo, effectiveWeights, expectedConnectionCharge, FX } from '../engine/index.js';
import MapPicker from './MapPicker.jsx';
import WeatherField from './WeatherField.jsx';
import PlantsField from './PlantsField.jsx';

const YM = '^\\d{4}-(0[1-9]|1[0-2])$';

export default function InputsPanel({ inputs, update, setWeights, siteBeta = false }) {
  const set = (path) => (val) => update(path, val);
  const norm = useMemo(() => normalizeInputs(inputs), [inputs]);
  const countryAuto = countryFromPin(inputs.project.lat, inputs.project.lon);
  const pin = pinCountryInfo(inputs.project.lat, inputs.project.lon);
  const countryNow = inputs.project.country && COUNTRIES[inputs.project.country] ? inputs.project.country : countryAuto;
  const countryOptions = [['', `From location (${COUNTRIES[countryAuto].name})`], ...Object.entries(COUNTRIES).map(([k, c]) => [k, c.name])];
  const { w, equal } = effectiveWeights(inputs.weights);

  return (
    <div className="inputs">
      <Section title="1 · Project and location" defaultOpen>
        <TextField label="Project name" value={inputs.project.name} onCommit={set('project.name')} path="project.name" inputs={inputs} />
        <MapPicker lat={inputs.project.lat} lon={inputs.project.lon} onPick={(la, lo) => { update('project.lat', la); update('project.lon', lo); }} />
        <div className="row2">
          <NumberField label="Latitude" unit="°" value={inputs.project.lat} onCommit={set('project.lat')} required min={-90} max={90} />
          <NumberField label="Longitude" unit="°" value={inputs.project.lon} onCommit={set('project.lon')} required min={-180} max={180} />
        </div>
        <SelectField label="Country profile" value={inputs.project.country || ''} options={countryOptions}
          onCommit={(v) => update('project.country', v || null)} path="project.country" inputs={inputs}
          hint={`Selects the synthetic country profile and price, carbon and gas defaults. From the pin: ${pin.inside ? `${COUNTRIES[countryAuto].name} (the pin is inside its outline)` : `${pin.mapName ? `${pin.mapName} has no built-in profile` : 'the pin is at sea or outside the map'}, so the nearest built-in country, ${COUNTRIES[countryAuto].name}, is used and flagged`}.`} />
        <SelectField label="Currency shown" value={inputs.project.currency || 'by country'} path="project.currency" inputs={inputs} onCommit={set('project.currency')}
          options={[['by country', `By country (${COUNTRIES[countryNow].currency})`], ['EUR', 'Euro (€)'], ...Object.keys(FX).filter((c) => c !== 'EUR').map((c) => [c, c])]}
          hint={`Results and the PDF are shown in this currency at the fixed ECB reference rate of the release (1 € = ${FX[!inputs.project.currency || inputs.project.currency === 'by country' ? COUNTRIES[countryNow].currency : inputs.project.currency] ?? 1} ${!inputs.project.currency || inputs.project.currency === 'by country' ? COUNTRIES[countryNow].currency : inputs.project.currency}). Inputs stay in euro.`} />
        <TextField label="Analysis start (YYYY-MM)" value={inputs.project.analysisStart} onCommit={set('project.analysisStart')} pattern={YM} path="project.analysisStart" inputs={inputs} />
        <NumberField label="Seed" value={inputs.project.seed} onCommit={(v) => update('project.seed', Math.round(v))} path="project.seed" inputs={inputs} step={1} />
        <WeatherField inputs={inputs} update={update} />
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
          <NumberField label="Roof area for PV" unit="m²" value={inputs.site.pvRoofM2} onCommit={set('site.pvRoofM2')} path="site.pvRoofM2" inputs={inputs} nullable min={0}
            placeholder="rule" hint="Empty = the default rule: 50 % of the free data-hall roof after roof plant. Enter the area you expect to cover (car-park canopies can go here or in the ground area)." />
          <NumberField label="Ground area for PV" unit="ha" value={inputs.site.pvGroundHa} onCommit={(v) => { update('site.pvGroundHa', v); update('choices.C10', null); }} path="site.pvGroundHa" inputs={inputs} min={0}
            hint={'0 = no ground solar. Any area above 0 adds the solar choice "Roof + ground", sized from this area.'} />
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
        <NumberField label="IT load at full build" unit="MW" value={inputs.load.itMW} onCommit={(v) => update('load.itMW', v)} path="load.itMW" inputs={inputs} nullable min={1} max={2000}
          placeholder={`Not known (estimate ${norm.load.itMW} MW)`} hint={norm.assumedInputs && norm.assumedInputs['load.itMW'] ? `Blank = not known: ${norm.assumedInputs['load.itMW']}. Every option is flagged "assumed" while it is blank.` : 'Blank = not known: estimated from the site area and flagged "assumed" on every option.'} />
        <PhasesEditor inputs={inputs} norm={norm} update={update} />
        <div className="row2">
          <NumberField label="Ramp: share at energisation" unit="%" scale={100} value={inputs.load.rampStart} onCommit={set('load.rampStart')} path="load.rampStart" inputs={inputs} min={0} max={1} />
          <NumberField label="Ramp duration" unit="months" value={inputs.load.rampMonths} onCommit={set('load.rampMonths')} path="load.rampMonths" inputs={inputs} min={0} />
        </div>
        <NumberField label="Average IT utilisation" unit="%" scale={100} value={inputs.load.utilisation} onCommit={set('load.utilisation')} path="load.utilisation" inputs={inputs} min={0.05} max={1} />
        <SelectField label="Workload type" value={inputs.load.workload} onCommit={set('load.workload')} path="load.workload" inputs={inputs}
          options={[['cloud', 'Mixed cloud'], ['ai-training', 'AI training'], ['ai-inference', 'AI inference'], ['enterprise', 'Enterprise']]} />
        <SelectField label="Load shape" value={inputs.load.shape} onCommit={set('load.shape')} path="load.shape" inputs={inputs}
          options={[['flat', 'Flat % of IT'], ['daily', 'Daily fluctuation'], ['aiTraining', 'AI training'], ['aiInference', 'AI inference']]}
          hint="Flat and daily fluctuation use the average IT utilisation below; the AI profiles use their own averages." />
        {inputs.load.shape === 'daily' ? <NumberField label="Daily swing" unit="% ±" scale={100} value={inputs.load.dailySwing} onCommit={set('load.dailySwing')} path="load.dailySwing" inputs={inputs} nullable min={0} max={0.5} hint="Blank = by workload type (±1 % AI training, ±8 % enterprise, ±4 % otherwise)." /> : null}
        {inputs.load.shape === 'aiTraining' ? <>
          <div className="row2">
            <NumberField label="Average utilisation (AI training)" unit="%" scale={100} value={inputs.load.aiTrainUtil} onCommit={set('load.aiTrainUtil')} path="load.aiTrainUtil" inputs={inputs} min={0} max={1} />
            <NumberField label="Checkpoint dip to" unit="% of IT" scale={100} value={inputs.load.aiTrainDip} onCommit={set('load.aiTrainDip')} path="load.aiTrainDip" inputs={inputs} min={0} max={1} />
          </div>
          <div className="row2">
            <NumberField label="Dip every" unit="h" value={inputs.load.aiTrainDipEveryH} onCommit={set('load.aiTrainDipEveryH')} path="load.aiTrainDipEveryH" inputs={inputs} min={1} />
            <NumberField label="Dip length" unit="h" value={inputs.load.aiTrainDipH} onCommit={set('load.aiTrainDipH')} path="load.aiTrainDipH" inputs={inputs} min={1} />
          </div>
        </> : null}
        {inputs.load.shape === 'aiInference' ? <>
          <div className="row2">
            <NumberField label="Average utilisation (AI inference)" unit="%" scale={100} value={inputs.load.aiInfUtil} onCommit={set('load.aiInfUtil')} path="load.aiInfUtil" inputs={inputs} min={0} max={1} />
            <NumberField label="Night trough" unit="% of peak" scale={100} value={inputs.load.aiInfTrough} onCommit={set('load.aiInfTrough')} path="load.aiInfTrough" inputs={inputs} min={0} max={1} />
          </div>
          <div className="row2">
            <NumberField label="Peak hour" unit="h" value={inputs.load.aiInfPeakHour} onCommit={set('load.aiInfPeakHour')} path="load.aiInfPeakHour" inputs={inputs} min={0} max={23} />
            <NumberField label="Weekend level" unit="% of weekdays" scale={100} value={inputs.load.aiInfWeekend} onCommit={set('load.aiInfWeekend')} path="load.aiInfWeekend" inputs={inputs} min={0} max={1.5} />
          </div>
        </> : null}
        {inputs.load.shape === 'aiTraining' || inputs.load.shape === 'aiInference' ? <p className="note">The model is hourly, so swings shorter than an hour (training steps, checkpoints of seconds) cannot be shown. They matter for UPS and battery sizing, which this concept tool does not model. The AI profile defaults are indicative — unverified, to research.</p> : null}
        <fieldset className="subgroup">
          <legend>Demand flexibility <span className="legend-note">(generated when choice C16 includes On)</span></legend>
          <div className="row2">
            <NumberField label="Max curtailable" unit="% of IT" scale={100} value={inputs.load.flexMaxPct} onCommit={set('load.flexMaxPct')} path="load.flexMaxPct" inputs={inputs} min={0} max={1} />
            <NumberField label="Max hours a year" unit="h" value={inputs.load.flexHours} onCommit={set('load.flexHours')} path="load.flexHours" inputs={inputs} min={0} />
          </div>
          <SelectField label="Trigger" value={inputs.load.flexTrigger} onCommit={set('load.flexTrigger')} path="load.flexTrigger" inputs={inputs}
            options={[['price', 'Grid price'], ['carbon', 'Grid carbon'], ['stress', 'Weather and grid stress (temperature)']]} />
          {inputs.load.flexTrigger === 'carbon' ? <NumberField label="Trigger level" unit="gCO₂e/kWh" value={inputs.load.flexTriggerCarbon} onCommit={set('load.flexTriggerCarbon')} path="load.flexTriggerCarbon" inputs={inputs} min={0} />
            : inputs.load.flexTrigger === 'stress' ? <NumberField label="Trigger level" unit="°C" value={inputs.load.flexTriggerTemp} onCommit={set('load.flexTriggerTemp')} path="load.flexTriggerTemp" inputs={inputs} />
            : <NumberField label="Trigger level" unit="€/MWh" value={inputs.load.flexTriggerPrice} onCommit={set('load.flexTriggerPrice')} path="load.flexTriggerPrice" inputs={inputs} min={0} />}
          <div className="row2">
            <NumberField label="Duration per event" unit="h" value={inputs.load.flexEventH} onCommit={set('load.flexEventH')} path="load.flexEventH" inputs={inputs} min={1} />
            <NumberField label="Notice" unit="h" value={inputs.load.flexNoticeH} onCommit={set('load.flexNoticeH')} path="load.flexNoticeH" inputs={inputs} min={0} hint="Recorded, not modelled: the hourly model knows prices and carbon a day ahead." />
          </div>
          <div className="row2">
            <NumberField label="Recovery period" unit="h" value={inputs.load.flexRecoveryH} onCommit={set('load.flexRecoveryH')} path="load.flexRecoveryH" inputs={inputs} min={0} />
            <NumberField label="Cost of curtailment" unit="€/MWh" value={inputs.load.flexCostPerMWh} onCommit={set('load.flexCostPerMWh')} path="load.flexCostPerMWh" inputs={inputs} min={0} />
          </div>
          <ToggleField label="Battery response: the battery runs the site in trigger hours instead of curtailing" checked={inputs.load.flexBatteryResponse} onCommit={set('load.flexBatteryResponse')} path="load.flexBatteryResponse" inputs={inputs} />
          <SelectField label="Hold fixed (battery sized to the trigger hours, C12)" value={inputs.load.flexBatteryFixed} onCommit={set('load.flexBatteryFixed')} path="load.flexBatteryFixed" inputs={inputs}
            options={[['threshold', 'Trigger threshold (size the battery)'], ['hours', 'Hours covered (set the threshold)'], ['size', 'Battery size (report hours)']]} />
          {inputs.load.flexBatteryFixed === 'hours' ? <NumberField label="Hours covered" unit="h/yr" value={inputs.load.flexBatteryHours} onCommit={set('load.flexBatteryHours')} path="load.flexBatteryHours" inputs={inputs} min={0} /> : null}
          {inputs.load.flexBatteryFixed === 'size' ? <div className="row2">
            <NumberField label="Battery power" unit="MW" value={inputs.load.flexBatteryMW} onCommit={set('load.flexBatteryMW')} path="load.flexBatteryMW" inputs={inputs} nullable min={0} />
            <NumberField label="Battery energy" unit="MWh" value={inputs.load.flexBatteryMWh} onCommit={set('load.flexBatteryMWh')} path="load.flexBatteryMWh" inputs={inputs} nullable min={0} />
          </div> : null}
          <p className="note">Flexibility acts in trigger hours and as the last step against a shortfall, within the same limits (OPEN-QUESTIONS 34). IT shed against a shortfall counts as unmet for power adequacy (OPEN-QUESTIONS 61). Values are indicative — unverified.</p>
        </fieldset>
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
          <NumberField label="Grid import now" unit="MW" value={inputs.grid.nowMW} onCommit={set('grid.nowMW')} path="grid.nowMW" inputs={inputs} nullable min={0} placeholder={`Not known (${norm.grid.nowMW})`} />
          <NumberField label="Grid import at full connection" unit="MW" value={inputs.grid.fullMW} onCommit={set('grid.fullMW')} path="grid.fullMW" inputs={inputs} nullable min={0} placeholder={`Not known (${norm.grid.fullMW})`} />
        </div>
        <TextField label="Full-connection date (YYYY-MM)" value={inputs.grid.fullDate} onCommit={set('grid.fullDate')} pattern={YM} path="grid.fullDate" inputs={inputs} nullable placeholder={`Not known (${norm.grid.fullDate})`}
          hint="Leave any grid value blank if it is not known: the tool assumes a default (now 0 MW; full connection about the design load, 48 months after the start), labelled indicative — unverified, and flags it on every grid-connected option." />
        <NumberField label="Grid export capacity" unit="MW" value={inputs.grid.exportMW} onCommit={set('grid.exportMW')} path="grid.exportMW" inputs={inputs} min={0}
          hint="Used only by C1 = Grid + export (not open by default)." />
        <fieldset className="subgroup">
          <legend>Contracted grid capacity <span className="legend-note">(per grid strategy; blank = the full offer)</span></legend>
          <div className="row2">
            <NumberField label="Wait for grid (C1)" unit="MW" value={inputs.grid.contractWaitMW} onCommit={set('grid.contractWaitMW')} path="grid.contractWaitMW" inputs={inputs} nullable min={0} placeholder="full offer" />
            <NumberField label="Bridge until grid (C1)" unit="MW" value={inputs.grid.contractBridgeMW} onCommit={set('grid.contractBridgeMW')} path="grid.contractBridgeMW" inputs={inputs} nullable min={0} placeholder="full offer" />
          </div>
          <p className="note">Each option imports no more than its strategy's contracted capacity in any hour, and never more than the offer of that period (OPEN-QUESTIONS 19). Islanded options contract 0 MW and keep the connection as backup only. Grid + export: {inputs.grid.contractExportMW == null ? 'the full offer' : `${inputs.grid.contractExportMW} MW`}.</p>
        </fieldset>
        {(() => {
          const ex = expectedConnectionCharge(normalizeInputs(inputs), 'wait');
          const exM = (ex.amount / 1e6).toFixed(1);
          return (
            <>
              <NumberField label="Grid connection charge" unit="€ m" scale={1e-6} value={inputs.grid.connectionCharge} onCommit={set('grid.connectionCharge')} path="grid.connectionCharge" inputs={inputs} min={0}
                hint={`One lump sum, the same for every grid-connected option; islanded options do not pay it (OPEN-QUESTIONS 20). Expected about €${exM} m: the standard rate of €${Math.round(ex.rate / 1000)}k per MW (${ex.band.toUpperCase()}, indicative — unverified) × ${Math.round(ex.mw)} MW contracted. Left at 0, every grid-connected option is flagged "assumed".`} />
              {ex.amount > 0 && Math.abs((Number(inputs.grid.connectionCharge) || 0) - ex.amount) > 1 ? (
                <button type="button" className="chip-btn" id="use-expected-charge" onClick={() => update('grid.connectionCharge', ex.amount)}>Use the expected figure (€{exM} m)</button>
              ) : null}
            </>
          );
        })()}
        <div className="row2">
          <NumberField label="Grid price multiplier" unit="×" value={inputs.grid.priceMultiplier} onCommit={set('grid.priceMultiplier')} path="grid.priceMultiplier" inputs={inputs} min={0} />
          <NumberField label="Grid carbon multiplier" unit="×" value={inputs.grid.carbonMultiplier} onCommit={set('grid.carbonMultiplier')} path="grid.carbonMultiplier" inputs={inputs} min={0} />
        </div>
        <NumberField label="Network charges and levies on grid energy" unit="€/MWh" value={typeof inputs.grid.priceAdder === 'number' ? inputs.grid.priceAdder : null} onCommit={set('grid.priceAdder')} path="grid.priceAdder" inputs={inputs} nullable min={0}
          placeholder={`${COUNTRIES[countryNow].adder} (country default)`} hint={`Added to every hour's wholesale price for grid energy (transmission and distribution charges, levies). Empty = the ${COUNTRIES[countryNow].name} default, ${COUNTRIES[countryNow].adder} €/MWh, a first-cut European figure; use the regulator's tariff for the connection voltage (for example ERSE in Portugal).`} />
        <SelectField label="Gas available" value={inputs.utilities.gasAvailable} onCommit={set('utilities.gasAvailable')} path="utilities.gasAvailable" inputs={inputs}
          options={[['Unknown', 'Unknown'], ['Yes', 'Yes'], ['No', 'No']]} />
        <NumberField label="Gas available from" unit="months after start" value={inputs.utilities.gasDateMonths} onCommit={set('utilities.gasDateMonths')} path="utilities.gasDateMonths" inputs={inputs} min={0} />
        <NumberField label="Gas commodity price" unit="€/MWh_th" value={typeof inputs.utilities.gasPrice === 'number' ? inputs.utilities.gasPrice : null} onCommit={set('utilities.gasPrice')} path="utilities.gasPrice" inputs={inputs} nullable min={0}
          placeholder={`${COUNTRIES[countryNow].gas} (country default)`} hint={`Empty = the ${COUNTRIES[countryNow].name} default, ${COUNTRIES[countryNow].gas} €/MWh_th; the gas transport adder is added either way.`} />
        <SelectField label="Hydrogen availability" value={inputs.utilities.hydrogenAvailable} onCommit={set('utilities.hydrogenAvailable')} path="utilities.hydrogenAvailable" inputs={inputs}
          options={[['No', 'No'], ['Yes', 'Yes']]} />
        <ToggleField label="Include an offsite PPA" checked={inputs.utilities.ppaInclude} onCommit={(v) => { update('utilities.ppaInclude', v); update('choices.C13', null); update('choices.C14', null); }} path="utilities.ppaInclude" inputs={inputs}
          hint="Off by default: options use the national grid's standard price and carbon. On: each strategy is generated with this PPA and without one (OPEN-QUESTIONS 49, 62)." />
        {inputs.utilities.ppaInclude ? <div className="row2">
          <SelectField label="PPA type" value={inputs.utilities.ppaType} onCommit={(v) => { update('utilities.ppaType', v); update('choices.C13', null); }} path="utilities.ppaType" inputs={inputs}
            options={[['solar', 'Annual-matched solar'], ['wind', 'Annual-matched wind'], ['hybrid', 'Hybrid'], ['baseload', 'Baseload-shaped'], ['cfe247', '24/7-matched']]} />
          <SelectField label="PPA coverage" value={String(inputs.utilities.ppaCoverage)} onCommit={(v) => { update('utilities.ppaCoverage', Number(v)); update('choices.C14', null); }} path="utilities.ppaCoverage" inputs={inputs}
            options={[['25', '25 %'], ['50', '50 %'], ['75', '75 %'], ['80', '80 %'], ['100', '100 %']]} />
        </div> : null}
        <ToggleField label="Existing plant near the site (lease)" checked={!!(inputs.existing && inputs.existing.include)} onCommit={(v) => { update('existing.include', v); update('choices.C2', null); update('choices.C4', null); }} path="existing.include" inputs={inputs}
          hint="A power plant beside the site that is not in the bundled list (work package 12). On: it is offered leased and bought (work package 19), as bridging plant (handed back when the grid arrives, or kept running) and as firm plant, with exactly the units entered and the lease paid from a month before it is first needed. It stands outside the campus: not on the site plan, not in the campus's emissions permit." />
        {inputs.existing && inputs.existing.include ? <>
          <div className="row2">
            <TextField label="Plant name" value={inputs.existing.name} onCommit={set('existing.name')} path="existing.name" inputs={inputs} />
            <SelectField label="Plant type" value={inputs.existing.type} onCommit={set('existing.type')} path="existing.type" inputs={inputs}
              options={[['ccgt', 'Combined-cycle gas turbine (CCGT)'], ['ocgt', 'Open-cycle gas turbines'], ['engines', 'Gas engines'], ['steam', 'Gas-fired steam plant']]} />
          </div>
          <div className="row2">
            <NumberField label="Units offered" unit="units" value={inputs.existing.units} onCommit={(v) => update('existing.units', v == null ? null : Math.max(1, Math.round(v)))} path="existing.units" inputs={inputs} nullable min={1} step={1} placeholder="Required" />
            <NumberField label="Net output per unit" unit="MW" value={inputs.existing.unitMW} onCommit={set('existing.unitMW')} path="existing.unitMW" inputs={inputs} nullable min={0} placeholder="Required" />
          </div>
          <div className="row2">
            <TextField label="Available from (YYYY-MM)" value={inputs.existing.availableDate} onCommit={set('existing.availableDate')} pattern={YM} path="existing.availableDate" inputs={inputs} nullable placeholder="The analysis start" />
            <NumberField label="Lease" unit="€/kW/month" value={inputs.existing.leasePerKWMonth} onCommit={set('existing.leasePerKWMonth')} path="existing.leasePerKWMonth" inputs={inputs} min={0} />
          </div>
          <div className="row2">
            <NumberField label="Efficiency" unit="fraction" value={inputs.existing.eff} onCommit={set('existing.eff')} path="existing.eff" inputs={inputs} nullable min={0.1} max={0.7} step={0.01} placeholder="By type" />
            <NumberField label="Minimum stable load" unit="fraction of a unit" value={inputs.existing.msl} onCommit={set('existing.msl')} path="existing.msl" inputs={inputs} nullable min={0} max={1} step={0.05} placeholder="By type" />
          </div>
          <div className="row2">
            <NumberField label="Variable O&M" unit="€/MWh" value={inputs.existing.vomPerMWh} onCommit={set('existing.vomPerMWh')} path="existing.vomPerMWh" inputs={inputs} nullable min={0} placeholder="By type" />
            <NumberField label="Connection to the campus" unit="€" value={inputs.existing.linkCapex} onCommit={set('existing.linkCapex')} path="existing.linkCapex" inputs={inputs} min={0} step={100000} />
          </div>
          <NumberField label="Closure year" unit="year" value={inputs.existing.closeYear} onCommit={(v) => { update('existing.closeYear', v == null ? null : Math.round(v)); update('choices.C21', null); }} path="existing.closeYear" inputs={inputs} nullable step={1} placeholder="Runs for the whole study"
            hint="Optional (work package 19). With a closure year the plant stops then (bought: 10 years later), and its grid connection is offered to the campus 12 months after it stops." />
        </> : null}
        <PlantsField inputs={inputs} norm={norm} update={update} />
        <SelectField label="District heating offtake nearby" value={inputs.utilities.districtHeating} onCommit={(v) => { update('utilities.districtHeating', v); update('choices.C15', null); }} path="utilities.districtHeating" inputs={inputs}
          options={[['No', 'No'], ['Yes', 'Yes']]} hint="Heat reuse is not costed in this slice." />
      </Section>

      <Section title="5 · Economics" defaultOpen>
        <div className="row2">
          <NumberField label="WACC (real)" unit="%" scale={100} value={inputs.economics.wacc} onCommit={set('economics.wacc')} path="economics.wacc" inputs={inputs} min={0} max={0.3}
            hint="The blended return the investors require, used as the discount rate for every cost and every MWh." />
          <NumberField label="Scoring evaluation period" unit="yr" value={inputs.economics.periodYears} onCommit={(v) => update('economics.periodYears', Math.round(v))} path="economics.periodYears" inputs={inputs} min={5} max={40} step={1}
            hint="This period sets the cost axis and the ranking (OPEN-QUESTIONS 21)." />
        </div>
        <TextField label="Further periods shown (years, comma-separated)" value={(inputs.economics.displayPeriods || []).join(', ')} path="economics.displayPeriods" inputs={inputs} nullable
          onCommit={(v) => update('economics.displayPeriods', v == null ? [] : String(v).split(/[ ,;]+/).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 60))}
          hint="LCOE and NPV for these periods are shown in each option's detail and the PDF, beside the scoring period. They do not change the ranking." />
        <NumberField label="Contingency" unit="%" scale={100} value={inputs.economics.contingency} onCommit={set('economics.contingency')} path="economics.contingency" inputs={inputs} min={0} max={1} />
        <NumberField label="Carbon price (Scope 1)" unit="€/tCO₂e" value={typeof inputs.economics.carbonPrice === 'number' ? inputs.economics.carbonPrice : null} onCommit={set('economics.carbonPrice')} path="economics.carbonPrice" inputs={inputs} nullable min={0}
          placeholder={`${COUNTRIES[countryNow].carbonPrice} (country default)`} hint={`Empty = the ${COUNTRIES[countryNow].name} EU/UK ETS default, ${COUNTRIES[countryNow].carbonPrice} €/tCO₂e; it escalates at the carbon escalation rate. Applied to Scope 1 combustion.`} />
        <div className="row2">
          <NumberField label="Electricity escalation (real)" unit="%/yr" scale={100} value={inputs.economics.elecEscalation} onCommit={set('economics.elecEscalation')} path="economics.elecEscalation" inputs={inputs} min={-0.1} max={0.1} />
          <NumberField label="Gas escalation (real)" unit="%/yr" scale={100} value={inputs.economics.gasEscalation} onCommit={set('economics.gasEscalation')} path="economics.gasEscalation" inputs={inputs} min={-0.1} max={0.1} />
        </div>
        <NumberField label="Carbon price escalation (real)" unit="%/yr" scale={100} value={inputs.economics.carbonEscalation} onCommit={set('economics.carbonEscalation')} path="economics.carbonEscalation" inputs={inputs} min={-0.1} max={0.2} />
        <p className="note">Currency: euro ({COUNTRIES[countryNow].name} profile; prices are converted to € in the country data). Revenue options are off by default and are opened in the choices below: export income (C1 = Grid + export), battery grid services (C12r role) and heat reuse (C15). The gas price is in section 4; the grid connection charge is with the grid.</p>
      </Section>

      <Section title="6 · Requirements and priorities" defaultOpen>
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
        {siteBeta ? <NumberField label="Land-take ceiling (on site, Site tab Beta)" unit="ha" value={inputs.requirements.landTakeCeilingHa} onCommit={set('requirements.landTakeCeilingHa')} path="requirements.landTakeCeilingHa" inputs={inputs} nullable min={0}
          hint="Flag only, shown with the Site tab (Beta). Empty = the net developable area (where it coincides with &quot;Does not fit&quot;); a lower value raises a minor flag without changing the site-fit status." /> : null}
        <NumberField label="Resilience reserve battery (UPS ride-through)" unit="min at full IT" value={inputs.requirements.upsMin} onCommit={set('requirements.upsMin')} path="requirements.upsMin" inputs={inputs} min={0}
          hint="Always kept and never used for economic duties; its battery capex is in every option's ledger. Longer autonomy can be chosen site-wide." />
        <div className="row2">
          <NumberField label="Genset test running" unit="h/yr per unit" value={inputs.requirements.testRunHours} onCommit={set('requirements.testRunHours')} path="requirements.testRunHours" inputs={inputs} min={0} />
          <NumberField label="Genset test load" unit="%" scale={100} value={inputs.requirements.testRunLoad} onCommit={set('requirements.testRunLoad')} path="requirements.testRunLoad" inputs={inputs} min={0} max={1} />
        </div>
        <NumberField label="Backup gensets as primary power" unit="h/yr" value={inputs.requirements.gensetPrimaryHours} onCommit={set('requirements.gensetPrimaryHours')} path="requirements.gensetPrimaryHours" inputs={inputs} min={0} max={8760}
          hint="0 = gensets never run in normal dispatch. Above 0: they run in the most expensive grid-price hours of each year, and their fuel, carbon and run hours are costed." />
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

      <Section title="7 · Choices (C1–C20)" defaultOpen badge={<ProjectedCount norm={norm} />}>
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
          hint={'Off by default. On: options whose resilience is "Does not meet" rank after the others; no score changes. Site fit does not count (Site tab is Beta).'} />
        <SelectField label="Client-perceived risk of pooled backup" value={inputs.deliverability.pooledBackupRisk} onCommit={set('deliverability.pooledBackupRisk')} path="deliverability.pooledBackupRisk" inputs={inputs}
          options={[['minor', 'Minor (default)'], ['major', 'Major']]}
          hint={`Options whose backup is pooled across the campus lose ${inputs.deliverability.minorFlagPenalty} deliverability points (minor) or ${inputs.deliverability.majorFlagPenalty} (major). Per-building backup is the rule (OPEN-QUESTIONS 47, 48).`} />
        {siteBeta ? <ToggleField label="Include site-fit penalty in deliverability (Site tab, Beta)" checked={inputs.deliverability.siteFitPenalty} onCommit={set('deliverability.siteFitPenalty')} path="deliverability.siteFitPenalty" inputs={inputs}
          hint={`Off by default: site fit is a status, not a weight. On: −${inputs.deliverability.siteFitFlagsPenalty} for "Fits with flags", −${inputs.deliverability.siteFitNoFitPenalty} for "Does not fit", and the axis reads "Deliverability (incl. site fit)". It is switched off whenever the Site tab is turned off.`} /> : null}
        <SelectField label="Dispatch model" value={inputs.settings.screeningModel} onCommit={set('settings.screeningModel')} path="settings.screeningModel" inputs={inputs}
          options={[['full', 'Full year, every hour, every option (default)'], ['repDays', 'Screening: representative days, then verify the best']]}
          hint="Full year by default: power adequacy needs every hour (OPEN-QUESTIONS 23). Screening dispatches each option over about 50 representative days (three clustered days a month, the dearest day and the design day), then re-runs the best options hour by hour for the full year and re-scores; every figure says which model produced it." />
        {inputs.settings.screeningModel === 'repDays' ? <NumberField label="Options verified with the full year" unit="options" value={inputs.settings.verifyTop} onCommit={(v) => update('settings.verifyTop', Math.round(v))} path="settings.verifyTop" inputs={inputs} min={1} max={200} step={1} /> : null}
        <NumberField label="Most dispatch years" unit="years" value={inputs.settings.maxDispatchYears} onCommit={(v) => update('settings.maxDispatchYears', Math.max(1, Math.round(v)))} path="settings.maxDispatchYears" inputs={inputs} min={1} max={30}
          hint="Each option is run hour by hour for every year until nothing changes (full load after the last phase and its ramp), then the last year repeats. This is the upper limit; a run flag says if it cuts an option short." />
        <NumberField label="Rented plant hired before it is needed" unit="months" value={inputs.settings.rentalLeadMonths} onCommit={(v) => update('settings.rentalLeadMonths', Math.max(0, Math.round(v)))} path="settings.rentalLeadMonths" inputs={inputs} min={0} max={6} step={1}
          hint="Rented bridging plant arrives and is paid for this many months before the first month it is needed (installation and commissioning), not from the month it could first arrive." />
        {siteBeta ? <SelectField label="Site layout in the run (Site tab, Beta)" value={inputs.settings.siteLayoutScope || 'auto'} onCommit={set('settings.siteLayoutScope')} path="settings.siteLayoutScope" inputs={inputs}
          options={[['auto', 'Every option, unless the campus is large (default)'], ['all', 'Every option, always']]}
          hint="A large campus (hundreds of genset blocks) can take minutes to lay out option by option. By default the run then skips it, because site fit does not change the ranking, and the Site tab lays out each option it shows. With the site-fit penalty or compliant-first ranking on, every option is always laid out." /> : null}
        <NumberField label="Generation cap" unit="options" value={inputs.settings.generationCap} onCommit={(v) => update('settings.generationCap', Math.round(v))} path="settings.generationCap" inputs={inputs} min={20} step={1} />
        <ToggleField label="Sample above cap" checked={inputs.settings.sampleAboveCap} onCommit={set('settings.sampleAboveCap')} path="settings.sampleAboveCap" inputs={inputs}
          hint="Off screens every combination (slow above the cap)." />
        <NumberField label="Wind default site threshold" unit="ha" value={inputs.settings.windSiteThresholdHa} onCommit={(v) => { update('settings.windSiteThresholdHa', v); update('choices.C11', null); }} path="settings.windSiteThresholdHa" inputs={inputs} min={0} />
        <div className="row2">
          <NumberField label="Layout raster cell" unit="m" value={inputs.settings.layoutCellM} onCommit={set('settings.layoutCellM')} path="settings.layoutCellM" inputs={inputs} min={1} max={10} />
          <NumberField label="Raster cell above the threshold" unit="m" value={inputs.settings.layoutCellLargeM} onCommit={set('settings.layoutCellLargeM')} path="settings.layoutCellLargeM" inputs={inputs} min={1} max={20} />
        </div>
        <NumberField label="Large-site threshold for the raster" unit="ha" value={inputs.settings.layoutLargeSiteHa} onCommit={set('settings.layoutLargeSiteHa')} path="settings.layoutLargeSiteHa" inputs={inputs} min={1} />
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
        {ch.id === 'C10' && def.groundDefault && atDefault ? <span className="info-inline">Roof + ground not generated: the ground area for PV is 0. Enter a ground area for PV (Site section) to include ground solar.</span> : null}
        {ch.id === 'C11' && def.windDefault && atDefault ? <span className="info-inline">Wind not generated by default: site ≤ {inputs.settings.windSiteThresholdHa} ha (threshold editable). Wind options are available through C11.</span> : null}
      </div>
    </fieldset>
  );
}
