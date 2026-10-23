import React from 'react';
import { CHOICES, choiceLabel } from '../engine/defaults.js';
import { NA } from '../engine/generator.js';
import { sig, money, monthLabel, pct } from '../format.js';
import { visibleFlags } from '../engine/view.js';
import { adequacyText } from '../engine/adequacy.js';

function FitBadge({ s }) {
  const cls = s === 'Fits' ? 'ok' : s === 'Fits with flags' ? 'warn' : 'bad';
  const icon = s === 'Fits' ? '✓' : s === 'Fits with flags' ? '!' : '✗';
  return <span className={`badge badge-${cls}`}><span aria-hidden="true">{icon}</span> {s}</span>;
}

// Site fit (§10.6) summary for the option detail; the full outputs and the plan are on the Site tab.
function SiteFitSummary({ o, onShowSite }) {
  const f = o.siteFit;
  if (!f) return null;
  return (
    <div className="detail-site">
      <h4>Site fit <span className="beta-badge">Beta</span> <FitBadge s={f.status} /></h4>
      {f.reasons.length ? <ul className="plain small">{f.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul> : <p className="small">Every block placed with the default clearances, separations and height limits.</p>}
      {f.unplaced.length ? (
        <p className="small"><strong>Unplaced tray:</strong> {f.unplaced.map((u) => `${u.name} (${u.areaM2.toLocaleString('en-GB')} m²; ${u.reason})`).join('; ')}.</p>
      ) : null}
      <table className="mini">
        <tbody>
          <tr><th scope="row">Land take on site</th><td className="num">{sig(f.landTakeHa, 3)} ha of {sig(f.netM2 / 10000, 3)} ha net developable{f.budgetShortfallM2 > 0 ? ` (${f.budgetShortfallM2.toLocaleString('en-GB')} m² beyond 100 %)` : ''}</td></tr>
          {f.fillM2 > 0 ? <tr><th scope="row">Ground PV fill</th><td className="num">{f.fillM2.toLocaleString('en-GB')} m² → {sig(f.fillMWp, 3)} MWp</td></tr> : null}
          <tr><th scope="row">Residual net area</th><td className="num">{f.residualM2.toLocaleString('en-GB')} m²</td></tr>
          {f.offsite.length ? <tr><th scope="row">Off site</th><td className="num">{f.offsite.map((x) => `${x.name}: ${sig(x.landHa, 2)} ha, ${x.distanceKm} km private wire`).join('; ')}</td></tr> : null}
          <tr><th scope="row">Expansion headroom (estimate)</th><td className="num">{sig(f.expansionMW, 2)} MW IT</td></tr>
        </tbody>
      </table>
      {onShowSite ? <button type="button" className="link-btn" onClick={() => onShowSite(o.id)}>Show this option's layout on the Site tab</button> : null}
    </div>
  );
}

// Power adequacy (OPEN-QUESTIONS 37–41, 2026-10-22): serves the load in every hour, no import above the grid
// capacity, and firm supply at or above the design load (full contracted IT at design-day PUE plus ancillary) in
// every month. No tolerance. Not adequate ranks below every adequate option; it is never hidden.
export function AdequacySummary({ a }) {
  return (
    <div className={`detail-adequacy ${a.adequate ? 'ok' : 'bad'}`}>
      <h4>Power adequacy: {a.status}</h4>
      <p className="small">{adequacyText(a)}{a.adequate ? '' : ' It ranks below every adequate option, by its weighted score among the options that are not adequate.'}</p>
      <table className="mini">
        <tbody>
          <tr><th scope="row">Unmet load (all dispatched years)</th><td className="num">{sig(a.unmetMWh)} MWh · {a.unmetHours.toLocaleString('en-GB')} h · peak {sig(a.unmetPeakMW)} MW · longest event {a.longestH.toLocaleString('en-GB')} h</td></tr>
          <tr><th scope="row">Import above the grid capacity</th><td className="num">{sig(a.exceedMWh)} MWh · {a.exceedHours.toLocaleString('en-GB')} h</td></tr>
          {a.shedMWh > 0 ? <tr><th scope="row">IT shed by flexibility against a shortfall</th><td className="num">{sig(a.shedMWh)} MWh · {a.shedHours.toLocaleString('en-GB')} h</td></tr> : null}
          <tr><th scope="row">Power gap against the design load</th><td className="num">{sig(a.gapMWm)} MW-months · {a.gapMonths} month{a.gapMonths === 1 ? '' : 's'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

// Permitting outlook (OPEN-QUESTIONS 46, 2026-10-22): plant held by the IED or Seveso, its outlook (judgement by
// technology, indicative — unverified), and whether it is ready when first needed.
export function PermitOutlook({ items, start }) {
  return (
    <div className="detail-permit">
      <h4>Permitting outlook</h4>
      <table className="mini">
        <thead><tr><th scope="col">Plant</th><th scope="col">Outlook</th><th scope="col">Ready / needed</th></tr></thead>
        <tbody>
          {items.map((x) => (
            <tr key={`${x.role}-${x.tech}`}>
              <th scope="row">{x.name}<div className="sub">{x.role === 'bridge' ? 'bridging' : x.role} · {x.regimes.join(', ')}</div></th>
              <td><span className={`badge badge-${x.outlook === 'likely' ? 'ok' : x.outlook === 'uncertain' ? 'warn' : 'bad'}`}>{x.outlook}</span><div className="sub">{x.reason}</div></td>
              <td>{monthLabel(start, x.readyMonth)}{x.neededMonth != null ? <> / {monthLabel(start, x.neededMonth)}<div className={`sub ${x.floatMonths < 0 ? 'flag-text' : ''}`}>{x.floatMonths >= 0 ? `${x.floatMonths} months' float` : `${-x.floatMonths} months late`}</div></> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">Screening judgement, indicative — unverified; not a permitting determination. The same outlook in every country until country differences are researched.</p>
    </div>
  );
}

// PPA hedge (owner decision 2026-10-18): settlement on contracted PPA volume that is not delivered physically,
// reported next to the economics but never in the ledger, LCOE, NPV or score (evaluate.js economics).
export function PpaHedgeRow({ h }) {
  const und = h.undeliveredMWh;
  // The present value names its own sign when it differs from the total's (Opus review 2026-10-18).
  const word = (x) => (x >= 0 ? 'income' : 'cost');
  const pvWord = word(h.pv) === word(h.total) ? '' : `net ${word(h.pv)} `;
  return (
    <tr className="hedge-row">
      <th scope="row">PPA hedge (not counted)</th>
      <td className="num">
        {und > 1e-6
          ? <>net {word(h.total)} {money(Math.abs(h.total))} (present value {pvWord}{money(Math.abs(h.pv))}) on {sig(und / 1e6, 3)} TWh not delivered of {sig(h.contractMWh / 1e6, 3)} TWh contracted</>
          : <>none: all {sig(h.contractMWh / 1e6, 3)} TWh contracted is delivered</>}
      </td>
    </tr>
  );
}

export default function OptionDetail({ o, start, onClose, dominator = null, onShowSite = null, onShowDispatch = null, siteBeta = false }) {
  const shownFlags = visibleFlags(o, siteBeta);
  const sz = o.sizing;
  const ss = o.dispatch.years[o.dispatch.years.length - 1];
  return (
    <section className="detail" aria-labelledby={`det-${o.id}`}>
      <header className="detail-head">
        <h3 id={`det-${o.id}`}>#{o.rank} · {o.name}</h3>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close option detail">×</button>
      </header>
      <p className="model-badge">Full-year hourly (8760 h) · synthetic profiles · all defaults indicative — unverified</p>
      <p className="small">
        {o.dominatedBy
          ? <>Dominated by #{dominator ? dominator.rank : '?'} {dominator ? dominator.name : o.dominatedBy}: equal or better on cost, carbon, time-to-power and deliverability, and better on at least one, with no worse resilience status. Still ranked and shown.</>
          : 'Not dominated on cost, carbon, time-to-power and deliverability.'}
      </p>
      {o.adequacy ? <AdequacySummary a={o.adequacy} /> : null}
      <div className="detail-grid">
        <div>
          <h4>Scores</h4>
          <table className="mini">
            <tbody>
              <tr><th scope="row">Weighted score</th><td className="num">{o.score.toFixed(1)}</td></tr>
              <tr><th scope="row">Cost</th><td className="num">{o.axisScores.cost.toFixed(0)}</td></tr>
              <tr><th scope="row">Carbon</th><td className="num">{o.axisScores.carbon.toFixed(0)}</td></tr>
              <tr><th scope="row">Time-to-power</th><td className="num">{o.axisScores.ttp.toFixed(0)}</td></tr>
              <tr><th scope="row">{o.deliv.includesSiteFit ? 'Deliverability (incl. site fit)' : 'Deliverability'}</th><td className="num">{o.axisScores.deliverability.toFixed(0)}</td></tr>
            </tbody>
          </table>
          {siteBeta ? <SiteFitSummary o={o} onShowSite={onShowSite} /> : null}
          <h4>Economics</h4>
          <table className="mini">
            <tbody>
              <tr><th scope="row">LCOE</th><td className="num">€{sig(o.eco.lcoe)}/MWh</td></tr>
              <tr><th scope="row">NPV of net cost</th><td className="num">{money(o.eco.npvCost)}</td></tr>
              <tr><th scope="row">Capex (incl. contingency)</th><td className="num">{money(o.eco.capex)} <span className="range">({money(o.eco.capexLow, 2)}–{money(o.eco.capexHigh, 2)})</span></td></tr>
              <tr><th scope="row">Opex year 1 / steady state</th><td className="num">{money(o.eco.opexYear1)} / {money(o.eco.opexSteady)}</td></tr>
              <tr><th scope="row">Capex share of PV cost</th><td className="num">{pct(o.eco.capexShare)}</td></tr>
              {o.eco.ppaHedge ? <PpaHedgeRow h={o.eco.ppaHedge} /> : null}
            </tbody>
          </table>
          <p className="note">Capex scope: energy, backup (including the resilience reserve battery), grid connection, substation and cooling delta only. Data hall shell and IT fit-out excluded.{o.eco.ppaHedge ? ' PPA settlement counts only on PPA energy delivered over the grid connection; the PPA hedge is reported outside the ledger, LCOE, NPV and score.' : ''}</p>
        </div>
        <div>
          <h4>Carbon and energy</h4>
          <table className="mini">
            <tbody>
              <tr><th scope="row">Location-based</th><td className="num">{sig(o.carbon.locationG)} gCO₂e/kWh</td></tr>
              <tr><th scope="row">Market-based</th><td className="num">{sig(o.carbon.marketG)} gCO₂e/kWh</td></tr>
              <tr><th scope="row">Hourly CFE</th><td className="num">{pct(o.carbon.cfePct)}</td></tr>
              <tr><th scope="row">Scope 1 / Scope 2 (loc.) per yr</th><td className="num">{sig(o.carbon.scope1Annual)} / {sig(o.carbon.scope2LocAnnual)} tCO₂e</td></tr>
              <tr><th scope="row">WUE</th><td className="num">{sig(o.carbon.wue, 2)} L/kWh</td></tr>
            </tbody>
          </table>
          <h4>Steady-state year energy (MWh)</h4>
          <table className="mini">
            <tbody>
              <tr><th scope="row">Facility demand</th><td className="num">{sig(ss.grossDemandMWh)}</td></tr>
              <tr><th scope="row">On-site renewables used</th><td className="num">{sig(ss.reUsedMWh)}</td></tr>
              <tr><th scope="row">PPA delivered</th><td className="num">{sig(ss.ppaDeliveredMWh)}</td></tr>
              <tr><th scope="row">Firm on-site</th><td className="num">{sig(ss.firmMWh)}</td></tr>
              <tr><th scope="row">Grid import</th><td className="num">{sig(ss.gridMWh)}</td></tr>
              <tr><th scope="row">BESS charge / discharge / losses</th><td className="num">{sig(ss.bessChargeMWh)} / {sig(ss.bessDischargeMWh)} / {sig(ss.bessLossMWh)}</td></tr>
              <tr><th scope="row">Curtailment</th><td className="num">{sig(ss.curtailMWh)}</td></tr>
              <tr><th scope="row">Unmet (all dispatched years)</th><td className="num">{sig(o.unmet.mwh)} MWh · {o.unmet.hours} h · peak {sig(o.unmet.peakMW)} MW</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4>Time-to-power</h4>
          <table className="mini">
            <tbody>
              <tr><th scope="row">First power</th><td>{monthLabel(start, o.ttp.firstPowerM)}</td></tr>
              <tr><th scope="row">Full load</th><td>{monthLabel(start, o.ttp.fullLoadM)}</td></tr>
              <tr><th scope="row">Power gap</th><td className="num">{sig(o.ttp.gapMWm)} MW-months</td></tr>
              <tr><th scope="row">Axis metric</th><td className="num">{sig(o.ttp.metric)} months</td></tr>
            </tbody>
          </table>
          {onShowDispatch ? <button type="button" className="link-btn" onClick={() => onShowDispatch(o.id)}>Show this option's phasing and hourly dispatch on the Dispatch tab</button> : null}
          {o.sizing.permitOutlook && o.sizing.permitOutlook.length ? <PermitOutlook items={o.sizing.permitOutlook} start={start} /> : null}
          <h4>Resilience: {o.resilience.status}</h4>
          <ul className="plain small">{o.resilience.items.map((i) => <li key={i.item}>{i.ok ? '✓' : '✗'} <strong>{i.item}:</strong> {i.text}</li>)}</ul>
          <h4>{o.deliv.includesSiteFit ? 'Deliverability (incl. site fit)' : 'Deliverability'} {sig(o.deliv.score, 2)}</h4>
          <ul className="plain small">{o.deliv.items.map((i) => <li key={i.item}>{i.item}: {i.points.toFixed(1)}</li>)}</ul>
        </div>
      </div>
      <h4>Sizing</h4>
      <ul className="sizing">{sz.sentences.map((s, i) => <li key={i}>{s}</li>)}</ul>
      <h4>Flags ({shownFlags.length})</h4>
      <ul className="flags-list">{shownFlags.map((f, i) => <li key={i} className={`sev-${f.severity}`}><span className="sev">{f.severity}</span> <span className="cat">{f.category}</span> {f.message}</li>)}</ul>
      <h4>Choice vector</h4>
      <table className="mini choice-vector">
        <tbody>{CHOICES.map((c) => <tr key={c.id}><th scope="row">{c.id} {c.name}</th><td>{o.v[c.id] === NA ? 'n/a' : choiceLabel(c.id, o.v[c.id])}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
