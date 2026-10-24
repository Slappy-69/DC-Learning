import React from 'react';
import { NOISE_LABEL } from '../../engine/sitefit.js';
import { SourceSwatch } from './SitePlan.jsx';
import { UnverifiedTag } from '../Field.jsx';

const n0 = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString('en-GB') : '—');
const ha = (m2) => (Number.isFinite(m2) ? (m2 / 10000).toFixed(2) : '—');
const m1 = (x) => (x == null || !Number.isFinite(x) ? '—' : Number(x.toFixed(1)).toLocaleString('en-GB'));

export function FitBadge({ s }) {
  const cls = s === 'Fits' ? 'ok' : s === 'Fits with flags' ? 'warn' : s === 'Not laid out' ? 'arch' : 'bad';
  const icon = s === 'Fits' ? '✓' : s === 'Fits with flags' ? '!' : s === 'Not laid out' ? '–' : '✗';
  return <span className={`badge badge-${cls}`}><span aria-hidden="true">{icon}</span> {s}</span>;
}

// Stacked land take by source against the net developable area; anything beyond 100 % is the shortfall
// (hatched, in the flag colour). The table under it holds the same numbers.
function BudgetBar({ parts, netM2, id }) {
  const total = parts.reduce((a, p) => a + p.placedM2 + p.unplacedM2, 0);
  const scaleMax = Math.max(netM2, total) * 1.02 || 1;
  const W = 600, H = 26;
  const x = (m2) => (m2 / scaleMax) * W;
  let acc = 0;
  const segs = [];
  for (const p of parts) {
    if (p.placedM2 > 0) { segs.push({ key: `${p.key}-p`, src: p.key, x0: acc, w: p.placedM2, short: false }); acc += p.placedM2; }
  }
  for (const p of parts) {
    if (p.unplacedM2 > 0) { segs.push({ key: `${p.key}-u`, src: p.key, x0: acc, w: p.unplacedM2, short: true }); acc += p.unplacedM2; }
  }
  return (
    <svg className="budget-bar" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-labelledby={`${id}-cap`}>
      <defs>
        <pattern id={`${id}-short`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)" className="bb-pat-short"><line x1="0" y1="0" x2="0" y2="6" /></pattern>
      </defs>
      {segs.map((s) => (
        <g key={s.key}>
          <rect x={x(s.x0)} y="3" width={Math.max(0, x(s.w) - 1)} height={H - 6} style={{ fill: `var(--src-${s.src})` }} opacity={s.short ? 0.35 : 1} />
          {s.short ? <rect x={x(s.x0)} y="3" width={Math.max(0, x(s.w) - 1)} height={H - 6} fill={`url(#${id}-short)`} stroke="var(--bad)" strokeWidth="1" /> : null}
        </g>
      ))}
      <line className="bb-100" x1={x(netM2)} x2={x(netM2)} y1="0" y2={H} />
    </svg>
  );
}

export default function SiteFitPanel({ res, option, inputs }) {
  if (!res) return null;
  const f = res.siteFit, facts = res.facts;
  const parts = facts.parts.slice().sort((a, b) => (b.placedM2 + b.unplacedM2) - (a.placedM2 + a.unplacedM2));
  const total = parts.reduce((a, p) => a + p.placedM2 + p.unplacedM2, 0);
  const thr = inputs.requirements.noiseNightDbA;
  return (
    <section className="fit-panel" aria-labelledby="fit-h">
      <h3 id="fit-h">Site fit: <FitBadge s={f.status} /></h3>
      {option ? <p className="small">#{option.rank} {option.name}</p> : null}
      {f.reasons.length ? <ul className="plain small">{f.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul> : <p className="small">Every block is placed with the default clearances, separations and height limits.</p>}

      <h4 id="fit-budget-cap">Area budget: {ha(total)} ha of {ha(f.netM2)} ha net developable ({total > 0 && f.netM2 > 0 ? Math.round((total / f.netM2) * 100) : 0} %)</h4>
      <BudgetBar parts={parts} netM2={f.netM2} id="fit-budget" />
      <p className="note">The line marks 100 % of the net developable area; hatched segments are blocks that were not placed (shortfall).</p>
      <table className="mini">
        <caption className="sr-only">Land take by energy source against the net developable area</caption>
        <thead><tr><th scope="col">Source</th><th scope="col" className="num">Placed m²</th><th scope="col" className="num">Not placed m²</th></tr></thead>
        <tbody>
          {parts.map((p) => <tr key={p.key}><th scope="row"><SourceSwatch src={p.key} /> {p.label}</th><td className="num">{n0(p.placedM2)}</td><td className={`num ${p.unplacedM2 ? 'flag-text' : ''}`}>{n0(p.unplacedM2)}</td></tr>)}
          <tr><th scope="row">Total on site</th><td className="num">{n0(parts.reduce((a, p) => a + p.placedM2, 0))}</td><td className="num">{n0(parts.reduce((a, p) => a + p.unplacedM2, 0))}</td></tr>
        </tbody>
      </table>

      <h4>Land take</h4>
      <table className="mini">
        <tbody>
          <tr><th scope="row">On site, needed (all blocks + ground PV)</th><td className="num">{ha(f.landTakeM2)} ha</td></tr>
          <tr><th scope="row">Off site</th><td className="num">{f.offsiteHa > 0 ? `${f.offsiteHa.toFixed(2)} ha` : 'none'}</td></tr>
          <tr><th scope="row">Shortfall beyond 100 %</th><td className={`num ${f.budgetShortfallM2 ? 'flag-text' : ''}`}>{n0(f.budgetShortfallM2)} m²</td></tr>
          <tr><th scope="row">Residual net area (future expansion)</th><td className="num">{n0(f.residualM2)} m²{f.fillM2 > 0 ? ` (ground PV holds ${n0(f.fillM2)} m² that could be reclaimed)` : ''}</td></tr>
          <tr><th scope="row">Expansion headroom (estimate)</th><td className="num">{m1(f.expansionMW)} MW IT</td></tr>
        </tbody>
      </table>
      <p className="note">Expansion headroom: residual net area ÷ land take per MW IT of the blocks that scale with IT (everything except the substation), same density and plant ratios. An estimate; the extra blocks are not laid out.</p>

      {f.unplaced.length ? (
        <>
          <h4>Unplaced tray</h4>
          <ul className="plain small">{f.unplaced.map((u) => <li key={u.index} className="flag-text">✗ {u.name}: {n0(u.areaM2)} m² ({u.reason})</li>)}</ul>
        </>
      ) : null}
      {f.offsite.length ? (
        <>
          <h4>Off-site tray</h4>
          <ul className="plain small">{f.offsite.map((x, i) => <li key={i}>{x.name}: {x.landHa.toFixed(2)} ha, {x.distanceKm} km private wire. {x.note}</li>)}</ul>
        </>
      ) : null}

      <h4>Height check</h4>
      <table className="mini">
        <thead><tr><th scope="col">Zone</th><th scope="col" className="num">Limit</th><th scope="col">Tallest element</th><th scope="col">Status</th></tr></thead>
        <tbody>
          {facts.heights.map((h) => (
            <tr key={h.id}><th scope="row">{h.name}</th><td className="num">{h.limitM} m</td><td>{h.element ? `${h.element}, ${m1(h.tallestM)} m` : '—'}</td>
              <td className={h.status === 'exceeded' ? 'st-fail' : h.status === 'pass' ? 'st-pass' : ''}>{h.status === 'exceeded' ? '✗ exceeded' : h.status === 'pass' ? '✓ pass' : 'no element'}</td></tr>
          ))}
        </tbody>
      </table>

      <h4>Separation checklist</h4>
      {facts.separations.length ? (
        <table className="mini">
          <thead><tr><th scope="col">Rule</th><th scope="col" className="num">Required</th><th scope="col" className="num">Minimum</th><th scope="col" className="num">Achieved</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {facts.separations.map((x) => (
              <tr key={x.key}><th scope="row">{x.label}</th><td className="num">{x.kind === 'maxDistance' || x.kind === 'preference' ? '≤ ' : ''}{m1(x.requiredM)} m</td><td className="num">{x.minM == null ? '—' : `${m1(x.minM)} m`}</td><td className="num">{m1(x.actualM)} m</td>
                <td className={x.status === 'pass' ? 'st-pass' : x.status === 'fail' ? 'st-fail' : x.status === 'relaxed' ? 'st-relaxed' : 'st-notmet'}>{x.status === 'pass' ? '✓ pass' : x.status === 'fail' ? '✗ fail' : `! ${x.status}`}</td></tr>
            ))}
          </tbody>
        </table>
      ) : <p className="small">No separation rule applies (fewer than two placed blocks).</p>}

      <h4>Noise proxy <span className="sub">({NOISE_LABEL})</span></h4>
      {facts.noise.receptorLevels.length ? (
        <table className="mini">
          <thead><tr><th scope="col">Receptor</th><th scope="col" className="num">Normal operation</th><th scope="col" className="num">Standby gensets</th><th scope="col">Against {thr} dB(A) night</th></tr></thead>
          <tbody>
            {facts.noise.receptorLevels.map((r) => (
              <tr key={r.name}><th scope="row">{r.name}</th><td className="num">{r.normalDbA == null ? '—' : `${m1(r.normalDbA)} dB(A)`}</td><td className="num">{r.standbyDbA == null ? '—' : `${m1(r.standbyDbA)} dB(A)`}</td>
                <td className={r.normalDbA != null && r.normalDbA > thr ? 'st-fail' : 'st-pass'}>{r.normalDbA != null && r.normalDbA > thr ? '✗ above (flagged)' : '✓ at or below'}</td></tr>
            ))}
          </tbody>
        </table>
      ) : <p className="small">No noise-sensitive receptors entered: levels at receptors are not assessed (add receptors on the plan).</p>}
      <p className="note">Threshold {thr} dB(A) at night <UnverifiedTag path="requirements.noiseNightDbA" compact />. Sound power from the spatial library, geometric spreading only (Lp = Lw − 20·log10 r − 8), no barriers, ground or air absorption. Standby gensets run in outages and daytime tests and are reported separately. Highest normal-operation level on the site boundary (sampled): {facts.noise.boundaryMaxDbA == null ? '—' : `${m1(facts.noise.boundaryMaxDbA)} dB(A)`}.</p>
      {facts.noise.sources.length ? (
        <details>
          <summary className="small">Noise sources ({facts.noise.sources.length})</summary>
          <table className="mini">
            <thead><tr><th scope="col">Source</th><th scope="col" className="num">Lw dB(A)</th><th scope="col" className="num">To boundary</th><th scope="col" className="num">To receptor</th><th scope="col">Operation</th></tr></thead>
            <tbody>
              {facts.noise.sources.map((s, i) => (
                <tr key={i}><th scope="row">{s.type === 'roofPlant' ? `Roof plant on ${res.bs.ground[s.index].name}` : res.bs.ground[s.index].name}</th><td className="num">{m1(s.lwA)}</td><td className="num">{m1(s.boundaryM)} m ({m1(s.atBoundaryDbA)} dB(A))</td><td className="num">{s.receptorM == null ? '—' : `${m1(s.receptorM)} m (${m1(s.atReceptorDbA)} dB(A))`}</td><td>{s.kind === 'standby' ? 'standby' : 'continuous'}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}

      <h4>Roof use</h4>
      <table className="mini">
        <tbody>
          <tr><th scope="row">Roof area (data halls)</th><td className="num">{n0(f.roof.roofM2)} m²</td></tr>
          <tr><th scope="row">Roof plant</th><td className="num">{n0(f.roof.plantM2)} m²</td></tr>
          <tr><th scope="row">Rooftop PV</th><td className="num">{n0(f.roof.pvM2)} m²</td></tr>
          <tr><th scope="row">Roof-edge setback</th><td className="num">{n0(f.roof.edgeM2)} m²</td></tr>
          <tr><th scope="row">Free</th><td className={`num ${f.roof.overAllocated ? 'flag-text' : ''}`}>{n0(f.roof.freeM2)} m²{f.roof.overAllocated ? ' (over-allocated, flagged)' : ''}</td></tr>
        </tbody>
      </table>
      <p className="note">Site layouts are concept-stage proxies, not a design. Every spatial default is indicative — unverified.</p>
    </section>
  );
}
