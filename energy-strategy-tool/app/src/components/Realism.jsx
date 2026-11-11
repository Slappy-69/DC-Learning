import React from 'react';
import { lateInfo, lateLine, TIER_SHORT, isRealismOption } from '../engine/labels.js';
import { TIER_TEXT } from '../engine/buildability.js';
import { sig } from '../format.js';

// Realism rebuild (2026-11-11): the badges and blocks that show an option's tier, its conditions and its dates
// against the plan. Owner, 2026-11-11: "Building starts late, this will need to be highlighted though": a late start
// is a red badge with the building, the months, the new date and what holds it, in words on the page (never only a
// tooltip), on the cards, in the ranked list, in the option detail and in the comparison.

export function TierBadge({ o }) {
  if (!isRealismOption(o)) return null;
  const t = o.deliv.tier;
  const n = t === 'B' ? o.deliv.conditions.length : t === 'C' ? o.deliv.unlikely.length : 0;
  return <span className={`badge badge-tier badge-${t === 'A' ? 'ok' : t === 'B' ? 'warn' : 'bad'}`} title={TIER_TEXT[t]}>{TIER_SHORT[t]}{n ? ` (${n})` : ''}</span>;
}

export function ItBadge({ o }) {
  const en = o && o.sizing && o.sizing.energise;
  if (!en) return null;
  if (en.powered === en.buildings) return <span className="badge badge-ok">{sig(en.poweredIT, 3)} MW IT · all {en.buildings} building{en.buildings === 1 ? '' : 's'}</span>;
  return <span className="badge badge-bad">Powers {en.powered} of {en.buildings} buildings · {sig(en.poweredIT, 3)} of {sig(en.plannedIT, 3)} MW IT</span>;
}

// The late badge and its line of words. full: every late building (cards, detail); otherwise the worst one.
export function LateBlock({ o, start, allowance = null, full = false }) {
  const x = lateInfo(o, start);
  if (!x) return null;
  if (x.onPlan) return <div className="late-block"><span className="badge badge-ok">On plan</span> <span className="small">every building starts on its planned date</span></div>;
  const beyond = allowance != null && x.en.maxLate > allowance;
  const list = full ? x.late : x.worst ? [x.worst] : [];
  return (
    <div className="late-block">
      {x.late.length ? <span className="badge badge-late">Late · up to {x.en.maxLate} month{x.en.maxLate === 1 ? '' : 's'}{beyond ? ' · beyond the latest acceptable start' : ''}</span> : null}
      {x.notBuilt ? <span className="badge badge-late">Not built: building{x.notBuilt.to > x.notBuilt.from ? `s ${x.notBuilt.from} to ${x.notBuilt.to}` : ` ${x.notBuilt.from}`}</span> : null}
      <ul className="plain small late-list">
        {list.map((l) => <li key={l.building}>{lateLine(l)}.</li>)}
        {!full && x.late.length > 1 ? <li>{x.late.length - 1} more building{x.late.length - 1 === 1 ? '' : 's'} late (option detail).</li> : null}
        {x.notBuilt ? <li>Building{x.notBuilt.to > x.notBuilt.from ? `s ${x.notBuilt.from} to ${x.notBuilt.to} are` : ` ${x.notBuilt.from} is`} not built: {x.notBuilt.why}.</li> : null}
      </ul>
    </div>
  );
}

// Conditions and "unlikely" findings of an option. max: how many to list before "+n more".
export function ConditionList({ o, max = 99 }) {
  if (!isRealismOption(o)) return null;
  const u = o.deliv.unlikely, c = o.deliv.conditions;
  if (!u.length && !c.length) return <p className="small">No conditions: nothing in this option waits on someone else's decision beyond the standard consents.</p>;
  const all = [...u.map((x) => ({ ...x, kind: 'Unlikely' })), ...c.map((x) => ({ ...x, kind: 'Condition' }))];
  return (
    <ul className="plain small cond-list">
      {all.slice(0, max).map((x, i) => <li key={i} className={x.kind === 'Unlikely' ? 'flag-text' : ''}><strong>{x.kind}:</strong> {x.text}.{x.source ? <span className="sub"> Source: {x.source}.</span> : null}</li>)}
      {all.length > max ? <li>+{all.length - max} more (option detail).</li> : null}
    </ul>
  );
}

// Option detail: the building dates, the plant's consent steps, the tier with every finding.
export function RealismDetail({ o, start }) {
  const en = o && o.sizing && o.sizing.energise;
  if (!en || !isRealismOption(o)) return null;
  const x = lateInfo(o, start);
  const plants = [o.sizing.prime, o.sizing.bridge].filter((p) => p && p.consent && p.consent.steps.length);
  return (
    <div className="detail-realism">
      <h4>Against the plan <ItBadge o={o} /></h4>
      <LateBlock o={o} start={start} full />
      <table className="mini">
        <thead><tr><th scope="col">Building</th><th scope="col" className="num">MW IT</th><th scope="col">Planned</th><th scope="col">Starts</th><th scope="col" className="num">Months late</th><th scope="col">What holds it</th></tr></thead>
        <tbody>
          {en.starts.map((s, k) => {
            const l = x.late.find((q) => q.building === k + 1);
            return (
              <tr key={k}>
                <th scope="row">{k + 1}</th><td className="num">{sig(en.it[k], 3)}</td><td>{l ? l.planned : lateInfoDate(start, en.planned[k])}</td>
                <td>{s == null ? <span className="flag-text">not built</span> : lateInfoDate(start, s)}</td>
                <td className={`num ${en.late[k] > 0 ? 'flag-text' : ''}`}>{s == null ? '—' : en.late[k]}</td>
                <td>{en.reasons[k] ? en.reasons[k].text : s == null ? 'the building in front of it is not built' : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {plants.length ? <p className="small">Consent before ordering: {plants.map((p) => `${p.role === 'prime' ? 'firm plant' : 'bridging plant'} ${p.consent.months} months (${p.consent.steps.map((s) => s.text).join('; ')})`).join('. ')}. Standby plant ready in month {o.sizing.standbyReadyM}.</p> : <p className="small">Standby plant ready in month {o.sizing.standbyReadyM}.</p>}
      <h4>Buildability: tier <TierBadge o={o} /></h4>
      <p className="small">{TIER_TEXT[o.deliv.tier]}. A screening view, not a planning, permitting or legal determination.</p>
      <ConditionList o={o} />
      {o.deliv.standard.length ? <p className="small"><strong>Standard consents</strong> (no effect on the tier): {o.deliv.standard.map((s) => s.text).join('; ')}.</p> : null}
      {o.rankNote ? <p className="small flag-text"><strong>Ranks below the leading group:</strong> {o.rankNote}.</p> : null}
    </div>
  );
}
function lateInfoDate(start, m) {
  const [y, mo] = String(start).split('-').map(Number);
  const t = (y * 12 + (mo - 1)) + m;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

// The plan check and the country's rules, above the options (engine/plancheck.js).
export function PlanCheck({ run }) {
  const pc = run.planCheck, cr = run.countryRules;
  if (!pc && !cr) return null;
  const sev = (s) => (s === 'major' ? 'bad' : s === 'minor' ? 'warn' : 'ok');
  return (
    <section className="plan-check" aria-labelledby="plan-check-h">
      <h2 id="plan-check-h">Plan check</h2>
      {pc ? (
        <>
          <p className="note">Can the phasing plan be met at all? Worked out over every screened option, before any is ranked. Latest acceptable start: {pc.allowanceM} month{pc.allowanceM === 1 ? '' : 's'} after a building's planned date (Requirements).</p>
          <ul className="plain small plan-items">
            {pc.items.map((i) => <li key={i.id}><span className={`badge badge-${sev(i.severity)}`}>{i.severity === 'major' ? 'Check' : i.severity === 'minor' ? 'Note' : 'OK'}</span> {i.text}{i.source ? <span className="sub"> Source: {i.source}.</span> : null}</li>)}
          </ul>
          <div className="table-wrap" role="region" aria-label="Earliest start of each building" tabIndex={0}>
            <table className="mini">
              <thead><tr><th scope="col">Building</th><th scope="col" className="num">MW IT</th><th scope="col">Planned</th><th scope="col">Earliest start, any option</th><th scope="col" className="num">Months late</th><th scope="col">What holds it</th></tr></thead>
              <tbody>
                {pc.buildings.map((b) => (
                  <tr key={b.building}><th scope="row">{b.building}</th><td className="num">{sig(b.itMW, 3)}</td><td>{b.planned}</td><td>{b.earliest || <span className="flag-text">no option powers it</span>}</td><td className={`num ${b.late > 0 ? 'flag-text' : ''}`}>{b.late == null ? '—' : b.late}</td><td>{b.reason || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      {cr && cr.rules.length ? (
        <details className="country-rules">
          <summary>Rules for data centres in {cr.country}: {cr.rules.length} to check{cr.rules.some((r) => r.caught) ? ' (one applies to this campus)' : ''}</summary>
          <p className="note">{cr.note} Found on {cr.accessed}; {cr.label}.</p>
          <ul className="plain small">
            {cr.rules.map((r) => <li key={r.id}><span className={`badge badge-${r.status === 'in force' ? 'warn' : 'arch'}`}>{r.status}</span> {r.text}{r.applies ? <strong> {r.applies}</strong> : null}<span className="sub"> Source: {r.source}.</span></li>)}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
