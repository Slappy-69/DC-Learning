import React, { useMemo, useState } from 'react';
import { rebuildOption } from '../engine/detail.js';
import { CHOICES, choiceLabel } from '../engine/defaults.js';
import { NA } from '../engine/generator.js';
import { sig, money, monthLabel, pct, perMWh } from '../format.js';
import OptionDetail from './OptionDetail.jsx';
import { isRealismOption, lateInfo, lateLine, TIER_SHORT } from '../engine/labels.js';

// Compare (BRIEF §12.7; work package 7): up to three options side by side, chosen from the cards, the options table or
// the trade-off chart; the headline figures, the choices on which they differ, and a deep-dive card each.
const ROWS = [
  ['Rank', (o) => `#${o.rank}`],
  ['Weighted score', (o) => o.score.toFixed(1)],
  ['Axis scores (cost · carbon · TTP · deliverability)', (o) => ['cost', 'carbon', 'ttp', 'deliverability'].map((k) => o.axisScores[k].toFixed(0)).join(' · ')],
  ['Power adequacy', (o) => (o.adequacy ? o.adequacy.status : '—')],
  ['LCOE', (o) => perMWh(o.eco.lcoe)],
  ['NPV of net cost', (o) => money(o.eco.npvCost, 3)],
  ['Capex', (o) => money(o.eco.capex, 3)],
  ['Carbon, location-based', (o) => `${sig(o.carbon.locationG)} g/kWh`],
  ['Carbon, market-based', (o) => `${sig(o.carbon.marketG)} g/kWh`],
  ['Hourly CFE', (o) => pct(o.carbon.cfePct)],
  ['First power · full load', null],
  ['Deliverability', (o) => sig(o.deliv.score, 2)],
  ['Resilience', (o) => o.resilience.status],
  ['Unmet load (dispatched years)', (o) => `${sig(o.unmet.mwh, 2)} MWh`],
  ['Flags (major · minor · info)', (o) => ['major', 'minor', 'info'].map((s) => o.flags.filter((f) => f.severity === s && !f.assumed).length).join(' · ')],
  ['Assumed defaults (key inputs not entered)', (o) => String(o.flags.filter((f) => f.assumed && f.path).length)],
];
// Realism rebuild (2026-11-11): the tier, the IT delivered and any late start, in words, at the head of the table.
const REALISM_ROWS = [
  ['Buildability tier', (o) => `${TIER_SHORT[o.deliv.tier]}${o.deliv.conditions.length ? `: ${o.deliv.conditions.length} condition${o.deliv.conditions.length === 1 ? '' : 's'}` : ''}${o.deliv.unlikely.length ? `: ${o.deliv.unlikely.map((u) => u.text.split(':')[0]).join('; ')}` : ''}`],
  ['IT delivered', (o) => { const en = o.sizing.energise; return `${sig(en.poweredIT, 3)} of ${sig(en.plannedIT, 3)} MW · ${en.powered} of ${en.buildings} buildings`; }],
  ['Against the plan', (o, start) => { const x = lateInfo(o, start); return x.onPlan ? 'Every building on its planned date' : [...x.late.map(lateLine), x.notBuilt ? `Building${x.notBuilt.to > x.notBuilt.from ? `s ${x.notBuilt.from} to ${x.notBuilt.to}` : ` ${x.notBuilt.from}`} not built: ${x.notBuilt.why}` : null].filter(Boolean).join('. '); }],
];

export default function CompareView({ run, ids, onRemove, onClear, start }) {
  const [openId, setOpenId] = useState(null);
  // Work package 23: a compared option outside the best 2,000 is rebuilt with the run's own chain.
  const opts = useMemo(() => ids.map((id) => run.options.find((o) => o.id === id)).filter(Boolean).map((o) => (o.light ? rebuildOption(run, o) : o)), [ids, run]);
  if (!opts.length) {
    return (
      <section className="compare" aria-labelledby="cmp-h">
        <h2 id="cmp-h">Compare</h2>
        <p className="note">No options chosen. Tick "Compare" on a top-five card, or use "Add to compare" in an option's detail (options table or trade-off chart). Up to three options.</p>
      </section>
    );
  }
  const diff = CHOICES.filter((c) => new Set(opts.map((o) => o.v[c.id])).size > 1);
  const open = openId ? opts.find((o) => o.id === openId) : null;
  return (
    <section className="compare" aria-labelledby="cmp-h">
      <h2 id="cmp-h">Compare ({opts.length} of 3)</h2>
      <div className="table-wrap" role="region" aria-label="Comparison" tabIndex={0}>
        <table className="mini compare-table">
          <thead>
            <tr><th scope="col">Figure</th>{opts.map((o) => (
              <th scope="col" key={o.id}>
                <button type="button" className="row-btn" onClick={() => setOpenId(openId === o.id ? null : o.id)} aria-expanded={openId === o.id}>#{o.rank} {o.name}</button>
                <div><button type="button" className="link-btn" onClick={() => onRemove(o.id)}>Remove</button></div>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {opts.every(isRealismOption) ? REALISM_ROWS.map(([label, f]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {opts.map((o) => <td key={o.id} className={label === 'Against the plan' && o.sizing.energise.shifted ? 'flag-text' : ''}>{f(o, start)}</td>)}
              </tr>
            )) : null}
            {ROWS.map(([label, f]) => (
              <tr key={label}>
                <th scope="row">{opts.every(isRealismOption) ? label.replace('TTP · deliverability', 'delay · buildability').replace(/^Deliverability$/, 'Buildability score') : label}</th>
                {opts.map((o) => <td key={o.id}>{f ? f(o) : `${monthLabel(start, o.ttp.firstPowerM)} · ${monthLabel(start, o.ttp.fullLoadM)}`}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Choices on which they differ</h3>
      {diff.length ? (
        <table className="mini compare-table">
          <tbody>{diff.map((c) => <tr key={c.id}><th scope="row">{c.id} {c.name}</th>{opts.map((o) => <td key={o.id}>{o.v[c.id] === NA ? 'n/a' : choiceLabel(c.id, o.v[c.id])}</td>)}</tr>)}</tbody>
        </table>
      ) : <p className="small">The options share every choice.</p>}
      <p className="small"><button type="button" className="link-btn" onClick={onClear}>Clear the comparison</button> · Select an option's name for its deep-dive card.</p>
      {open ? <OptionDetail o={open} run={run} start={start} onClose={() => setOpenId(null)} /> : null}
    </section>
  );
}
