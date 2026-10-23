import React from 'react';
import { LABEL, CHOICE_BY_ID } from '../engine/defaults.js';
import { monthLabel, sig } from '../format.js';

// What site fit does and does not change (§5.7, §9.9, §10.4, §11), in words. The status is never a weight:
// it enters a score only through the optional site-fit penalty and the order only through "Rank
// requirement-compliant options first" (both off by default). Site inputs are another matter: the POC and
// gas-main positions set route lengths for cost (§5.2); every score moves with the relative scale (§11). Ground
// solar is sized from the ground area for PV, never from the layout (OPEN-QUESTIONS 54, 2026-10-22).
export function siteFitEffect(inputs) {
  const d = (inputs && inputs.deliverability) || {};
  const s = (inputs && inputs.settings) || {};
  const status = d.siteFitPenalty
    ? `The site-fit penalty is on, so the status lowers deliverability (${d.siteFitFlagsPenalty} points for "Fits with flags", ${d.siteFitNoFitPenalty} for "Does not fit").`
    : 'The status changes no score.';
  const order = s.rankCompliantFirst
    ? 'No option is hidden for not fitting; "Rank requirement-compliant options first" is on, so options that do not fit rank after those that do.'
    : 'No option is hidden or demoted for not fitting.';
  return `${status} ${order} The layout never resizes an option: ground solar comes from the ground area for PV. The POC and gas-main positions set the cable and gas-pipe route costs.`;
}

// Grid shortfall analysis (OPEN-QUESTIONS 38, step 1, 2026-10-22): the phased design load (contracted IT at the
// design-day PUE plus ancillary) against the offered grid capacity, month by month, for each cooling type the run
// generates. Temporary = before the full grid connection date; permanent = from it on.
const coolingName = (id) => { const v = CHOICE_BY_ID.C8 && CHOICE_BY_ID.C8.values.find((x) => x[0] === id); return v ? v[1] : id; };
function ShortfallSection({ sf, start }) {
  const part = (x) => (x.months
    ? <>peak {sig(x.peakMW, 3)} MW in {monthLabel(start, x.peakMonth)}; {x.months} month{x.months === 1 ? '' : 's'} from {monthLabel(start, x.firstMonth)}</>
    : 'none');
  return (
    <section aria-labelledby="rs-shortfall" className="rs-wide">
      <h3 id="rs-shortfall">Grid shortfall against the design load</h3>
      <p className="small">Design load: the full contracted IT, phased, at the design-day PUE plus ancillary load, against the offered grid capacity. Temporary shortfall is before the full grid connection ({monthLabel(start, sf.fullGridMonth)}); permanent shortfall is from it on. On-site generation must close both for an option to be adequate.</p>
      <table className="mini">
        <thead><tr><th scope="col">Cooling</th><th scope="col" className="num">Design load</th><th scope="col">Temporary shortfall</th><th scope="col">Permanent shortfall</th><th scope="col" className="num">IT the full grid supports</th></tr></thead>
        <tbody>
          {sf.byCooling.map((c) => (
            <tr key={c.cooling}>
              <th scope="row">{coolingName(c.cooling)}<div className="sub">design-day PUE {c.peakPUE.toFixed(2)}</div></th>
              <td className="num">{sig(c.designMW, 3)} MW</td>
              <td>{part(c.temporary)}</td>
              <td>{part(c.permanent)}</td>
              <td className="num">{sig(c.itSupportedMW, 3)} MW IT<div className="sub">on {sig(c.fullGridMW, 3)} MW grid</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// Run summary (BRIEF §12): total combinations, compatibility rules with counts, "values not
// generated" with Include controls, sampling state and counts, dispatch handling modes.
// C17/C18 notes without the site-fit count, for when the Site tab (Beta) is off (BRIEF §8 rules, walkthrough 2026-10-21).
const SITE_NOTE_BASE = { C17: 'GIS reduces substation footprint.', C18: 'Double-deck and in-building arrangements reduce genset footprint.' };

export default function RunSummary({ run, onInclude, onSamplingOff, open, onToggle, siteBeta = false }) {
  const g = run.generation;
  const fit = { Fits: 0, 'Fits with flags': 0, 'Does not fit': 0 };
  for (const o of run.options) if (o.siteFit) fit[o.siteFit.status]++;
  return (
    <details className="run-summary" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary>
        <span className="section-title">Run summary</span>
        <span className="rs-line">
          {g.totalCombinations.toLocaleString('en-GB')} combinations · {g.screened.toLocaleString('en-GB')} screened
          {g.sampled ? ' (sampling on)' : ''} · {run.rules.filter((r) => r.id !== 'd').reduce((s, r) => s + r.removed, 0).toLocaleString('en-GB')} impossible not generated
          · {g.valuesNotGenerated.length} choices with values not generated
        </span>
      </summary>
      <div className="rs-body">
        <div className="rs-grid">
          <section aria-labelledby="rs-gen">
            <h3 id="rs-gen">Generation</h3>
            <ul className="plain">
              <li>Open-choice product: {g.rawTotal.toLocaleString('en-GB')}; after n/a collapse: {g.collapsedTotal.toLocaleString('en-GB')}; valid after compatibility rules: {g.validCombinations.toLocaleString('en-GB')}.</li>
              <li>Archetype baselines: {g.archetypes} (always generated; {g.archetypesOutsideSpace} sit outside the open choices and are added).</li>
              <li>Total combinations: <strong>{g.totalCombinations.toLocaleString('en-GB')}</strong>. Screened: <strong>{g.screened.toLocaleString('en-GB')}</strong>.</li>
              <li>
                Sample above cap: <strong>{g.sampling ? 'On' : 'Off'}</strong> <span className="tag tag-unverified" title="judgement">{LABEL}</span>. Cap {g.cap.toLocaleString('en-GB')} <span className="tag tag-unverified" title="run setting">{LABEL}</span>.
                {g.sampled ? (
                  <span className="notice-inline"> {g.screened.toLocaleString('en-GB')} of {g.totalCombinations.toLocaleString('en-GB')} combinations screened (sampling on; seeded Latin hypercube, {g.lhsRepaired} draws repaired to valid unique combinations). <button type="button" className="link-btn" onClick={onSamplingOff}>Screen all</button> · lock a choice to narrow the space.</span>
                ) : null}
              </li>
              <li>Scoring set: every screened option ({run.options.length.toLocaleString('en-GB')}){g.sampled ? ', i.e. the screened sample' : ''}. View filters never change any score or rank.</li>
            </ul>
          </section>
          <section aria-labelledby="rs-rules">
            <h3 id="rs-rules">Compatibility rules</h3>
            <table className="mini">
              <thead><tr><th scope="col">Rule</th><th scope="col" className="num">Removed</th></tr></thead>
              <tbody>
                {run.rules.map((r) => (
                  <tr key={r.id}><td title={r.detail}>{r.name}<div className="sub">{r.detail}</div></td><td className="num">{r.removed.toLocaleString('en-GB')}{r.id === 'd' ? ' collapsed' : ''}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section aria-labelledby="rs-vng" className="rs-wide">
            <h3 id="rs-vng">Values not generated</h3>
            <ul className="plain vng">
              {g.valuesNotGenerated.map((c) => (
                <li key={c.id}>
                  <strong>{c.id} {c.name}:</strong> {c.omitted.map((o) => `${o.label}${o.reason === 'excluded by user' ? ' (excluded by user)' : ''}`).join(', ')} not generated
                  {' '}({[...new Set(c.omitted.map((o) => o.reason))].filter((r) => r !== 'excluded by user').join(', ') || 'excluded by user'})
                  {' '}<button type="button" className="link-btn" onClick={() => onInclude(c.id, c.omitted.map((o) => o.value))}>{c.id === 'C11' ? 'Include wind' : 'Include'}</button>
                  {!siteBeta && SITE_NOTE_BASE[c.id] ? <div className="sub">{SITE_NOTE_BASE[c.id]}</div>
                    : c.note ? <div className={c.doesNotFit ? 'sub site-note' : 'sub'}>{c.note}</div> : null}
                </li>
              ))}
            </ul>
          </section>
          {run.shortfall ? <ShortfallSection sf={run.shortfall} start={run.meta ? run.meta.analysisStart : run.inputs.project.analysisStart} /> : null}
          <section aria-labelledby="rs-site">
            <h3 id="rs-site">Site layout</h3>
            {run.site ? (
              <ul className="plain">
                <li>Boundary: {run.site.source === 'area' ? 'rectangle from the site area and aspect ratio' : `${run.site.source} polygon`} ({run.site.edges} edges); gross {(run.site.grossM2 / 10000).toFixed(2)} ha, buildable envelope {(run.site.envelopeM2 / 10000).toFixed(2)} ha, net developable {(run.site.netM2 / 10000).toFixed(2)} ha after the roads, parking and landscaping allowance.</li>
                <li>Exclusions {run.site.exclusions} ({run.site.hardExclusions} hard), height zones {run.site.heightZones}, receptors {run.site.receptors}. Raster {run.site.cellM} m cells ({run.site.nx} × {run.site.ny}) <span className="tag tag-unverified" title="run setting">{LABEL}</span>.</li>
                {siteBeta ? <li>Site fit (Beta): <strong>{fit.Fits.toLocaleString('en-GB')}</strong> fit, <strong>{fit['Fits with flags'].toLocaleString('en-GB')}</strong> fit with flags, <strong>{fit['Does not fit'].toLocaleString('en-GB')}</strong> do not fit. Site fit is a status, not a weight. {siteFitEffect(run.inputs)} Site-fit penalty in deliverability: <strong>{run.inputs.deliverability && run.inputs.deliverability.siteFitPenalty ? 'on' : 'off'}</strong> <span className="tag tag-unverified" title="judgement">{LABEL}</span>.</li>
                  : <li>Site fit is a Beta feature: turn on the Site tab in the general settings to see it. It never changes a score or a rank. The site inputs still set the route costs below; ground solar comes from the ground area for PV in the Site section.</li>}
                {run.site.routes ? <li>Route lengths for cost (straight line to the buildable envelope, the same for every option): grid cable {run.site.routes.pocM == null ? 'not costed (no buildable area)' : `${Math.round(run.site.routes.pocM).toLocaleString('en-GB')} m from the POC${run.site.pocDefault ? ' (default POC: the access point, standing in for the road side)' : ''}`}; gas pipe {run.site.routes.gasMainM == null ? 'not costed (no gas main location; default: gas off-site, location unknown)' : `${Math.round(run.site.routes.gasMainM).toLocaleString('en-GB')} m from the gas main (gas-burning options only)`}.</li> : null}
                {run.layoutSummary ? <li>Auto-layout: {run.layoutSummary.distinctLayouts.toLocaleString('en-GB')} distinct layouts for {run.options.length.toLocaleString('en-GB')} options (options with the same blocks share one layout); {run.layoutSummary.placements.toLocaleString('en-GB')} block placements; ground PV placed as one block of the entered area.</li> : null}
                {run.site.warningMessages && run.site.warningMessages.length ? <li className="flag-text">{run.site.warningMessages.join(' ')}</li> : null}
              </ul>
            ) : <p className="small">No site model in this run.</p>}
          </section>
          <section aria-labelledby="rs-disp">
            <h3 id="rs-disp">Dispatch</h3>
            <ul className="plain">
              <li>Model: full-year hourly dispatch (8760 h per model year, chronological BESS state of charge) for every screened option; {run.timing.dispatchRuns.toLocaleString('en-GB')} distinct dispatch runs.</li>
              <li>Grid capacity handling: <strong>{run.dispatchHandling.grid === 'unmet' ? 'Show unmet load' : 'Show exceedance'}</strong> <span className="tag tag-unverified" title="judgement">{LABEL}</span></li>
              <li>Run-hour limit handling: <strong>{run.dispatchHandling.runHours === 'flag' ? 'Flag only' : 'Respect limit'}</strong> <span className="tag tag-unverified" title="judgement">{LABEL}</span></li>
              <li>Merit order: <ol>{run.meritOrder.map((m) => <li key={m}>{m}</li>)}</ol></li>
              <li>Profiles: {run.profileLabel} (country {run.country}).</li>
            </ul>
          </section>
        </div>
      </div>
    </details>
  );
}
