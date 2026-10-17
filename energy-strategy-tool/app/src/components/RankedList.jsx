import React, { useEffect, useMemo, useState } from 'react';
import { applyView } from '../engine/scoring.js';
import { defaultView, tablePageSize, FLAG_FILTERS } from '../engine/view.js';
import { sig, money, monthLabel, pct } from '../format.js';
import OptionDetail from './OptionDetail.jsx';
import FilterChips from './FilterChips.jsx';
import { UnverifiedTag } from './Field.jsx';

const RES_STATUSES = ['Meets', 'Meets with flags', 'Does not meet'];
const FIT_STATUSES = ['Fits', 'Fits with flags', 'Does not fit'];

// Land-take ceiling view filter (§11), in ha on site; commits on blur or Enter; empty = no ceiling. A view
// filter only: it never changes a score or rank (the land-take ceiling input in step 5 raises a flag).
function LandTakeFilter({ value, onCommit }) {
  const shown = value == null ? '' : String(+value.toPrecision(10));
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);
  const commit = () => {
    const t = draft.trim();
    if (t === '') { if (value != null) onCommit(null); return; }
    const x = Number(t);
    if (!Number.isFinite(x) || x < 0) { setDraft(shown); return; }
    if (x !== value) onCommit(x);
  };
  return (
    <label className="inline-number">
      <span>Land take at most (ha)</span>
      <input type="number" min={0} step="any" inputMode="decimal" placeholder="none" value={draft}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); }} />
    </label>
  );
}

export function SiteFitBadge({ s }) {
  if (!s) return <span className="badge badge-arch">not assessed</span>;
  const cls = s === 'Fits' ? 'ok' : s === 'Fits with flags' ? 'warn' : 'bad';
  const icon = s === 'Fits' ? '✓' : s === 'Fits with flags' ? '!' : '✗';
  return <span className={`badge badge-${cls}`}><span aria-hidden="true">{icon}</span> {s}</span>;
}

// Capex ceiling view filter (§11), in € m; commits on blur or Enter; empty = no ceiling.
function CapexFilter({ value, onCommit }) {
  const shown = value == null ? '' : String(+(value / 1e6).toPrecision(10));
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);
  const commit = () => {
    const t = draft.trim();
    if (t === '') { if (value != null) onCommit(null); return; }
    const x = Number(t);
    if (!Number.isFinite(x) || x < 0) { setDraft(shown); return; }
    if (x * 1e6 !== value) onCommit(x * 1e6);
  };
  return (
    <label className="inline-number">
      <span>Capex at most (€ m)</span>
      <input type="number" min={0} step="any" inputMode="decimal" placeholder="none" value={draft}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); }} />
    </label>
  );
}

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

export default function RankedList({ run, view, setView, start, onShowSite }) {
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);
  const { list, hiddenDominated } = useMemo(() => applyView(run.options, view), [run, view]);
  const dominatedCount = useMemo(() => run.options.filter((o) => o.dominatedBy).length, [run]);
  const PAGE = tablePageSize();
  const hdDefault = defaultView().hideDominated;
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
        <span className="filters-sep" aria-hidden="true">·</span>
        {FIT_STATUSES.map((s) => (
          <button key={s} type="button" className={`chip ${(view.siteFit || []).includes(s) ? 'on' : ''}`} aria-pressed={(view.siteFit || []).includes(s)}
            onClick={() => { setPage(0); setView({ ...view, siteFit: toggleIn(view.siteFit || [], s) }); }}>{s}</button>
        ))}
        <LandTakeFilter value={view.landTakeCeilingHa ?? null} onCommit={(v) => { setPage(0); setView({ ...view, landTakeCeilingHa: v }); }} />
        <label className="inline-select">
          <span>Show only</span>
          <select value="" onChange={(e) => { if (e.target.value) { setPage(0); setView({ ...view, flagIds: toggleIn(view.flagIds, e.target.value) }); } }}>
            <option value="">options with flag…</option>
            {FLAG_FILTERS.map(([id, l]) => <option key={id} value={id}>{view.flagIds.includes(id) ? '✓ ' : ''}{l}</option>)}
          </select>
        </label>
        <label className="inline-select">
          <span>Hide</span>
          <select value="" onChange={(e) => { if (e.target.value) { setPage(0); setView({ ...view, hideFlagIds: toggleIn(view.hideFlagIds, e.target.value) }); } }}>
            <option value="">options with flag…</option>
            {FLAG_FILTERS.map(([id, l]) => <option key={id} value={id}>{view.hideFlagIds.includes(id) ? '✓ ' : ''}{l}</option>)}
          </select>
        </label>
        <CapexFilter value={view.capexCeiling} onCommit={(v) => { setPage(0); setView({ ...view, capexCeiling: v }); }} />
        <label className="inline-select">
          <span>Dominance</span>
          <select value={view.dominated} onChange={(e) => { setPage(0); setView({ ...view, dominated: e.target.value }); }}>
            <option value="all">All options</option>
            <option value="non">Non-dominated only</option>
            <option value="only">Dominated only</option>
          </select>
        </label>
        <button type="button" className={`chip ${view.archetypesOnly ? 'on' : ''}`} aria-pressed={view.archetypesOnly} onClick={() => { setPage(0); setView({ ...view, archetypesOnly: !view.archetypesOnly }); }}>Archetypes only</button>
        <label className="inline-check">
          <input type="checkbox" checked={view.hideDominated} onChange={(e) => { setPage(0); setView({ ...view, hideDominated: e.target.checked }); }}
            aria-describedby={view.hideDominated === hdDefault ? 'ranked-hd-basis' : undefined} />
          <span>Hide dominated options</span>
          {view.hideDominated === hdDefault ? <UnverifiedTag path="settings.hideDominated" compact descId="ranked-hd-basis" /> : null}
        </label>
        <label className="inline-search">
          <span className="sr-only">Search option names</span>
          <input type="search" placeholder="Search names" value={view.search} onChange={(e) => { setPage(0); setView({ ...view, search: e.target.value }); }} />
        </label>
      </div>
      <FilterChips view={view} setView={setView} hiddenDominated={hiddenDominated} onChange={() => setPage(0)} clearAll />
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
              {th('landTake', 'Land take ha', 'num')}
              {th('siteFit', 'Site fit')}
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
                        {o.dominatedBy ? (() => { const d = nameById.get(o.dominatedBy); const t = `Dominated by #${d?.rank} ${d?.name}`; return <span className="badge badge-dom" title={t}>{t}</span>; })() : null}
                      </div>
                    </td>
                    <td className="num strong">{o.score.toFixed(1)}</td>
                    <td className="num axis-cell">
                      <span className="axis-bars" role="img" aria-label={`Axis scores: cost ${o.axisScores.cost.toFixed(0)}, carbon ${o.axisScores.carbon.toFixed(0)}, time-to-power ${o.axisScores.ttp.toFixed(0)}, deliverability ${o.axisScores.deliverability.toFixed(0)}`}>
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
                    <td className="num">{o.siteFit ? sig(o.siteFit.landTakeHa, 3) : '—'}{o.siteFit && o.siteFit.offsiteHa > 0 ? <div className="sub">+{sig(o.siteFit.offsiteHa, 2)} off site</div> : null}</td>
                    <td><SiteFitBadge s={o.siteFit ? o.siteFit.status : null} />{o.siteFit && o.siteFit.status === 'Does not fit' ? <div className="sub">{o.siteFit.unplacedM2.toLocaleString('en-GB')} m² short</div> : null}</td>
                    <td><ResBadge s={o.resilience.status} /></td>
                    <td className="num"><span className="flag-counts" title={`${c.major} major, ${c.minor} minor, ${c.info} info`}>{c.major ? <span className="fc fc-major">{c.major}</span> : null}{c.minor ? <span className="fc fc-minor">{c.minor}</span> : null}<span className="fc fc-info">{c.info}</span></span></td>
                  </tr>
                  {open ? (
                    <tr className="detail-row"><td colSpan={15}><OptionDetail o={o} start={start} dominator={o.dominatedBy ? nameById.get(o.dominatedBy) : null} onClose={() => setOpenId(null)} onShowSite={onShowSite} /></td></tr>
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
        <UnverifiedTag path="view.table.pageSize" compact text={`${PAGE} rows per page · unverified`} />
      </nav>
    </div>
  );
}
