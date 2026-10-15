import React, { useMemo, useState } from 'react';
import { applyView, DEFAULT_VIEW } from '../engine/scoring.js';
import { sig, money, monthLabel, pct } from '../format.js';
import OptionDetail from './OptionDetail.jsx';

const PAGE = 50;
const RES_STATUSES = ['Meets', 'Meets with flags', 'Does not meet'];
const COMMON_FLAGS = [
  ['grid-binding', 'Grid capacity binding'],
  ['res-backed', 'Backed load not met'],
  ['res-autonomy', 'Autonomy not met'],
  ['permit-ied', 'IED threshold'],
  ['fuel-gas-unknown', 'Gas connection unconfirmed'],
  ['tech-nascent', 'Nascent technology'],
  ['target-ttp', 'Time-to-power target missed'],
];

function sevCounts(flags) {
  const c = { major: 0, minor: 0, info: 0 };
  for (const f of flags) c[f.severity]++;
  return c;
}

function ResBadge({ s }) {
  const cls = s === 'Meets' ? 'ok' : s === 'Meets with flags' ? 'warn' : 'bad';
  const icon = s === 'Meets' ? '✓' : s === 'Meets with flags' ? '!' : '✗';
  return <span className={`badge badge-${cls}`}><span aria-hidden="true">{icon}</span> {s}</span>;
}

export default function RankedList({ run, view, setView, start }) {
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);
  const { list, chips, hiddenDominated } = useMemo(() => applyView(run.options, view), [run, view]);
  const dominatedCount = useMemo(() => run.options.filter((o) => o.dominatedBy).length, [run]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const p = Math.min(page, pages - 1);
  const rows = list.slice(p * PAGE, p * PAGE + PAGE);
  const nameById = useMemo(() => new Map(run.options.map((o) => [o.id, o])), [run]);

  const sortBy = (k) => setView({ ...view, sortKey: k, sortDir: view.sortKey === k ? -view.sortDir : 1 });
  const th = (k, label, cls = '') => (
    <th scope="col" className={cls} aria-sort={view.sortKey === k ? (view.sortDir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sort-btn" onClick={() => sortBy(k)}>{label}{view.sortKey === k ? (view.sortDir === 1 ? ' ▲' : ' ▼') : ''}</button>
    </th>
  );
  const toggleIn = (arr, x) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);

  return (
    <div className="ranked">
      <div className="filters" role="group" aria-label="View filters (never change score or rank)">
        <span className="filters-label">View filters</span>
        {RES_STATUSES.map((s) => (
          <button key={s} type="button" className={`chip ${view.resilience.includes(s) ? 'on' : ''}`} aria-pressed={view.resilience.includes(s)}
            onClick={() => { setPage(0); setView({ ...view, resilience: toggleIn(view.resilience, s) }); }}>{s}</button>
        ))}
        <label className="inline-select">
          <span>Flag</span>
          <select value="" onChange={(e) => { if (e.target.value) { setPage(0); setView({ ...view, hideFlagIds: toggleIn(view.hideFlagIds, e.target.value) }); } }}>
            <option value="">Hide options with…</option>
            {COMMON_FLAGS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
          </select>
        </label>
        <button type="button" className={`chip ${view.archetypesOnly ? 'on' : ''}`} aria-pressed={view.archetypesOnly} onClick={() => { setPage(0); setView({ ...view, archetypesOnly: !view.archetypesOnly }); }}>Archetypes only</button>
        <label className="inline-check">
          <input type="checkbox" checked={view.hideDominated} onChange={(e) => { setPage(0); setView({ ...view, hideDominated: e.target.checked }); }} />
          <span>Hide dominated options</span>
          <span className="tag tag-unverified" title="indicative — unverified (judgement); off by default">unverified</span>
        </label>
        <label className="inline-search">
          <span className="sr-only">Search option names</span>
          <input type="search" placeholder="Search names" value={view.search} onChange={(e) => { setPage(0); setView({ ...view, search: e.target.value }); }} />
        </label>
      </div>
      {chips.length || view.hideDominated ? (
        <div className="chip-row" aria-label="Active view filters">
          {chips.map((c) => <span key={c} className="active-chip">{c}</span>)}
          {view.hideDominated ? <span className="active-chip">{hiddenDominated.toLocaleString('en-GB')} dominated options hidden <button type="button" className="link-btn" onClick={() => setView({ ...view, hideDominated: false })}>show</button></span> : null}
          <button type="button" className="link-btn" onClick={() => { setPage(0); setView({ ...DEFAULT_VIEW }); }}>Clear all filters</button>
        </div>
      ) : null}
      <p className="note">Showing {list.length.toLocaleString('en-GB')} of {run.options.length.toLocaleString('en-GB')} screened options ({dominatedCount.toLocaleString('en-GB')} dominated, all shown unless hidden). Scores are relative to the scoring set (all screened options); filters change only what is shown.</p>

      <div className="table-wrap" role="region" aria-label="Ranked options" tabIndex={0}>
        <table className="rank-table">
          <thead>
            <tr>
              {th('rank', 'Rank', 'num')}
              {th('name', 'Option')}
              {th('score', 'Score', 'num')}
              <th scope="col" className="num">Cost · Carbon · TTP · Deliv.</th>
              {th('lcoe', 'LCOE €/MWh', 'num')}
              {th('capex', 'Capex', 'num')}
              {th('carbon', 'Carbon', 'num')}
              {th('cfe', 'CFE', 'num')}
              <th scope="col">First power</th>
              <th scope="col">Full load</th>
              {th('unmet', 'Unmet MWh', 'num')}
              <th scope="col">Resilience</th>
              {th('flags', 'Flags', 'num')}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const c = sevCounts(o.flags);
              const open = openId === o.id;
              return (
                <React.Fragment key={o.id}>
                  <tr className={open ? 'row-open' : ''}>
                    <td className="num">{o.rank}</td>
                    <td className="name-cell">
                      <button type="button" className="row-btn" aria-expanded={open} onClick={() => setOpenId(open ? null : o.id)}>{o.name}</button>
                      <div className="row-tags">
                        {o.archetype ? <span className="badge badge-arch">{o.archetype} {o.archetypeName}</span> : null}
                        {o.dominatedBy ? <span className="badge badge-dom" title={`Dominated by #${nameById.get(o.dominatedBy)?.rank} ${nameById.get(o.dominatedBy)?.name}`}>Dominated by #{nameById.get(o.dominatedBy)?.rank}</span> : null}
                      </div>
                    </td>
                    <td className="num strong">{o.score.toFixed(1)}</td>
                    <td className="num axis-cell">
                      <span className="axis-bars" aria-label={`Cost ${o.axisScores.cost.toFixed(0)}, carbon ${o.axisScores.carbon.toFixed(0)}, time-to-power ${o.axisScores.ttp.toFixed(0)}, deliverability ${o.axisScores.deliverability.toFixed(0)}`}>
                        {['cost', 'carbon', 'ttp', 'deliverability'].map((k) => (
                          <span key={k} className={`axis-bar ax-${k}`} title={`${k} ${o.axisScores[k].toFixed(0)}`}><span style={{ width: `${o.axisScores[k]}%` }} /></span>
                        ))}
                      </span>
                    </td>
                    <td className="num">{sig(o.eco.lcoe)}</td>
                    <td className="num">{money(o.eco.capex, 2)}</td>
                    <td className="num">{sig(o.metrics.carbon, 2)}{run.inputs.settings.carbonMetric === 'cfe' ? '' : ' g'}</td>
                    <td className="num">{pct(o.carbon.cfePct)}</td>
                    <td>{monthLabel(start, o.ttp.firstPowerM)}</td>
                    <td>{monthLabel(start, o.ttp.fullLoadM)}</td>
                    <td className={`num ${o.unmet.mwh > 0 ? 'flag-text' : ''}`}>{o.unmet.mwh > 0 ? sig(o.unmet.mwh, 2) : '0'}{o.unmet.hours ? <div className="sub">{o.unmet.hours.toLocaleString('en-GB')} h</div> : null}</td>
                    <td><ResBadge s={o.resilience.status} /></td>
                    <td className="num"><span className="flag-counts" title={`${c.major} major, ${c.minor} minor, ${c.info} info`}>{c.major ? <span className="fc fc-major">{c.major}</span> : null}{c.minor ? <span className="fc fc-minor">{c.minor}</span> : null}<span className="fc fc-info">{c.info}</span></span></td>
                  </tr>
                  {open ? (
                    <tr className="detail-row"><td colSpan={13}><OptionDetail o={o} start={start} onClose={() => setOpenId(null)} /></td></tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <nav className="pager" aria-label="Pages">
        <button type="button" className="chip-btn" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</button>
        <span>Page {p + 1} of {pages}</span>
        <button type="button" className="chip-btn" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</button>
      </nav>
    </div>
  );
}
