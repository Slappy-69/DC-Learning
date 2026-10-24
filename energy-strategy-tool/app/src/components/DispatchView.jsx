import React, { useEffect, useMemo, useState } from 'react';
import { inspectOption, weekPresets, weekRange, WEEKS_PER_YEAR, compareWithRun } from '../engine/inspect.js';
import { normalizeInputs, TECH } from '../engine/defaults.js';
import { sig, money, monthLabel } from '../format.js';
import StackChart, { fmtMW } from './StackChart.jsx';
import { siteFor } from './SiteView.jsx';

// Dispatch tab (BRIEF §12.6 phasing timeline, §20 stage 4 dispatch visualisations): how one option is supplied,
// month by month while the site is energised and hour by hour in each model year, with the annual energy balance,
// the engine's hourly balance error and a check against the figures the ranking used. Port of the other line's
// DispatchView (commits f236acc, e1161ce), on this line's full pipeline (inspect.js re-runs the option through
// sizing, layout, dispatch and economics) and this line's energy-source colours (the site
// plan's --src-* tokens). Never changes the run, its scores or its ranking.

const SRC = (k) => `var(--src-${k})`;
const C = { solar: SRC('solar'), wind: SRC('wind'), bess: SRC('bess'), grid: SRC('grid'), curtail: SRC('curtail') };
const SOURCE_NAME = { gas: 'Gas plant', fuelCell: 'Fuel cells', diesel: 'HVO-diesel plant', hydrogen: 'Hydrogen plant', nuclear: 'Nuclear (SMR)' };
const MWh = (v) => `${Math.round(v).toLocaleString('en-GB')} MWh`;
const pad2 = (n) => String(n).padStart(2, '0');
const plantName = (p) => `${TECH[p.tech] ? TECH[p.tech].name : p.tech} (${p.role === 'bridge' ? 'bridging' : p.role === 'bridgeKept' ? 'bridging share kept as prime' : p.role === 'backupPrime' ? 'backup as primary power' : 'prime'})`;

// Inspections by run and option (weights never change dispatch, so re-scoring keeps them); small LRU.
const inspCache = new Map();
function cachedInspection(key) {
  const v = inspCache.get(key);
  if (v) { inspCache.delete(key); inspCache.set(key, v); }
  return v || null;
}
function storeInspection(key, v) {
  inspCache.set(key, v);
  while (inspCache.size > 4) inspCache.delete(inspCache.keys().next().value);
}
export function runInspection(run, option) {
  const nIn = normalizeInputs(run.inputs);
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const I = inspectOption(nIn, option.v, { site: siteFor(nIn) });
  return { I, ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 };
}

function defaultYear(I) {
  let best = -1;
  let bestU = 1e-6;
  I.years.forEach((y, i) => { if (y.balance.unmet > bestU) { bestU = y.balance.unmet; best = i; } });
  if (best >= 0) return { y: best, why: 'the year with the most unmet load' };
  return { y: I.years.length - 1, why: 'the steady-state year that later years repeat' };
}
function defaultWeek(rec) {
  const p = weekPresets(rec);
  return (p.find((x) => x.id === 'unmet') || p[0]).week;
}

// Firm plant grouped by energy source (same source = one band; the readout and tables split the plants).
function firmGroups(plants) {
  const groups = [];
  plants.forEach((p, i) => {
    let g = groups.find((x) => x.source === p.source);
    if (!g) { g = { source: p.source, idx: [], names: [] }; groups.push(g); }
    g.idx.push(i);
    g.names.push(plantName(p));
  });
  // Firm plant carries its site-plan hatch as well as its colour: the unhatched source colours that share every chart
  // (solar, battery, grid) pass the all-pairs colour checks in both themes, while some firm-plant colours do not pass
  // them against those (palette validation, BUILD-NOTES), so texture carries their identity, as on the plan.
  return groups.map((g) => ({ ...g, label: SOURCE_NAME[g.source] || g.source, color: SRC(g.source), hatch: g.source }));
}

export default function DispatchView({ run, optionId = null, setOptionId = () => {}, initial = null }) {
  // Screening runs (work package 8, BRIEF §12.13): dispatch views only for options verified with the full year.
  const screened = !!run.verification;
  const ranked = useMemo(() => run.options.filter((o) => !screened || o.verified).sort((a, b) => a.rank - b.rank), [run.options, screened]);
  const option = (optionId != null && ranked.find((o) => o.id === optionId)) || ranked[0] || null;
  const key = option ? `${run.inputHash || ''}|${option.id}` : null;
  const [state, setState] = useState(() => (initial && option ? { key, ...initial } : { key: null }));
  const optionList = useMemo(() => ranked.map((o) => <option key={o.id} value={o.id}>#{o.rank} {o.name}</option>), [ranked]);

  useEffect(() => {
    if (!option || state.key === key) return undefined;
    const hit = cachedInspection(key);
    if (hit) { setState({ key, ...hit }); return undefined; }
    setState({ key, busy: true });
    // Re-run on the next tick so the busy state paints first (the re-run takes a fraction of a second).
    const t = setTimeout(() => {
      try {
        const v = runInspection(run, option);
        storeInspection(key, v);
        setState({ key, ...v });
      } catch (e) {
        setState({ key, error: String(e && e.message ? e.message : e) });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!option) return <section className="dv"><h2>Dispatch</h2><p className="empty">No options to inspect.</p></section>;
  const ready = state.key === key && state.I;
  return (
    <section className="dv" aria-labelledby="dv-h">
      <div className="site-head">
        <h2 id="dv-h">Dispatch</h2>
        <label className="small site-pick">Option shown{' '}
          <select id="dv-option" value={option.id} onChange={(e) => setOptionId(e.target.value)} title={`#${option.rank} ${option.name}`}>
            {optionList}
          </select>
        </label>
      </div>
      {screened ? <p className="note">Screening run: only the {ranked.length} options verified with the full-year model are offered here; the others were dispatched over representative days only.</p> : null}
      <p className="dv-intro">How one option is supplied: month by month while the site is energised, and hour by hour in each model year. The option is re-run with the engine the ranking uses (sizing, site layout, dispatch and economics) and checked against the ranking's figures below.</p>
      {state.key === key && state.error ? <p className="flag-text" role="alert">Could not re-run this option: {state.error}</p>
        : !ready ? <p className="dv-wait" role="status">Re-running #{option.rank} {option.name} with hourly records…</p>
          : <DispatchPanel key={key} run={run} option={option} I={state.I} ms={state.ms} />}
    </section>
  );
}

export function DispatchPanel({ run, option, I, ms = null, chartWidth = null, initialYear = null }) {
  const start = I.analysisStart;
  const dy = useMemo(() => (initialYear != null && I.years[initialYear] ? { y: initialYear, why: '' } : defaultYear(I)), [I]); // eslint-disable-line react-hooks/exhaustive-deps
  const [year, setYear] = useState(dy.y);
  const [week, setWeek] = useState(() => defaultWeek(I.years[dy.y].hourly));
  const [weekDraft, setWeekDraft] = useState(null); // text while the week box is being edited
  // Any period of the year (work package 8, AC 25): a start day and a length in days, instead of a calendar week.
  const [period, setPeriod] = useState(null); // null = week view; { day: 1–365, len: 1–31 }
  const Y = I.years[Math.min(year, I.years.length - 1)];
  const groups = useMemo(() => firmGroups(I.plants), [I]);
  const check = useMemo(() => compareWithRun(I, option), [I, option]);

  // Hourly series for the selected year: firm output per source; grid import = grid to load + grid to battery + PPA
  // (the physical import over the connection).
  const hs = useMemo(() => {
    const r = Y.hourly;
    const gridIn = new Float64Array(r.net.length);
    for (let h = 0; h < gridIn.length; h++) gridIn[h] = r.grid[h] + r.gridCharge[h] + r.ppa[h];
    const firmBy = groups.map((g) => {
      const a = new Float64Array(r.net.length);
      for (const i of g.idx) { const p = r.plant[i]; for (let h = 0; h < a.length; h++) a[h] += p[h]; }
      return a;
    });
    return { ...r, gridIn, firmBy };
  }, [Y, groups]);
  const presets = useMemo(() => weekPresets(Y.hourly), [Y]);

  const tl = I.timeline;
  const T = I.ttp;
  const wk = weekRange(week);
  const wr = period
    ? (() => { const from = (period.day - 1) * 24; const to = Math.min(Y.hourly.net.length, from + period.len * 24); return { week: null, from, to }; })()
    : wk;
  const periodName = period ? `days ${period.day}–${Math.round(wr.to / 24)}` : `week ${wr.week}`;
  const PeriodName = periodName[0].toUpperCase() + periodName.slice(1);
  const B = Y.balance;
  const E = Y.engine;
  const yearHasLoad = B.net > 1e-6;
  const hasPPA = !!I.ppa;
  const hasBess = I.bess.mwh > 1e-9;
  const hasSolar = I.years.some((y) => y.balance.solar > 1e-6);
  const hasWind = I.years.some((y) => y.balance.wind > 1e-6);
  const tlGroups = useMemo(() => {
    const out = [];
    tl.plants.forEach((p) => {
      let g = out.find((x) => x.source === p.source);
      if (!g) { g = { source: p.source, label: SOURCE_NAME[p.source] || p.source, color: SRC(p.source), hatch: p.source, values: new Float64Array(tl.months), names: [] }; out.push(g); }
      for (let m = 0; m < tl.months; m++) g.values[m] += p.values[m];
      g.names.push(plantName(p));
    });
    return out;
  }, [tl]);
  const hasBridgeBess = tl.bess.some((v) => v > 1e-9);

  // ---- Phasing timeline (monthly) ----
  const tlTicks = [];
  for (let m = 0; m < tl.months; m += 12) tlTicks.push({ i: m, label: monthLabel(start, m).slice(0, 4) });
  const tlMarkers = [];
  if (!I.islanded && I.fullGridM < tl.months) tlMarkers.push({ i: I.fullGridM, label: 'Full grid connection' });
  if (T.fullLoadM != null) tlMarkers.push({ i: T.fullLoadM, label: 'Full load supplied' });
  if (T.firstPowerM != null && T.firstPowerM !== T.fullLoadM) tlMarkers.push({ i: T.firstPowerM, label: 'First power' });
  if (hasBridgeBess && I.bess.bridgeAvailMonth != null && I.bess.bridgeAvailMonth < tl.months) tlMarkers.push({ i: I.bess.bridgeAvailMonth, label: 'Battery available' });
  const gridLabel = I.islanded ? 'Grid (islanded: not counted)' : 'Grid connection (offered)';
  const tlReadout = (m) => ({
    title: `${monthLabel(start, m)} · month ${m}`,
    rows: [
      { label: 'Design load', text: fmtMW(tl.design[m]), key: 'line' },
      { label: gridLabel, text: fmtMW(tl.grid[m]), color: C.grid },
      ...tlGroups.map((g) => ({ label: `${g.label} available (${g.names.join(', ')})`, text: fmtMW(g.values[m]), color: g.color, hatch: g.hatch })),
      hasBridgeBess ? { label: 'Battery bridging', text: fmtMW(tl.bess[m]), color: C.bess } : null,
      { label: 'Total supply', text: fmtMW(tl.supply[m]) },
      tl.gap[m] > 0 ? { label: '! Power gap', text: fmtMW(tl.gap[m]), key: 'strip' } : null,
    ],
  });
  const tlLegend = [
    { label: gridLabel, color: C.grid },
    ...tlGroups.map((g) => ({ label: `${g.label}: ${g.names.join(', ')}`, color: g.color, hatch: g.hatch })),
    hasBridgeBess ? { label: 'Battery bridging', color: C.bess } : null,
    { label: 'Design load', kind: 'line' },
    { label: T.gapMWm > 0 ? '! Power gap (strip above the plot)' : '! Power gap: none', kind: 'strip' },
  ].filter(Boolean);

  // ---- Hourly week ----
  const off = wr.from;
  const nH = wr.to - wr.from;
  const hrTicks = [];
  for (let d = 0; d * 24 < nH; d++) hrTicks.push({ i: d * 24, label: `Day ${Math.floor((off + d * 24) / 24) + 1}` });
  const hrReadout = (i) => {
    const h = off + i;
    const sub = [];
    if (hs.grid[h] > 1e-9) sub.push(`spot ${sig(hs.grid[h], 3)}`);
    if (hs.ppa[h] > 1e-9) sub.push(`PPA ${sig(hs.ppa[h], 3)}`);
    if (hs.gridCharge[h] > 1e-9) sub.push(`to battery ${sig(hs.gridCharge[h], 3)}`);
    return {
      title: `Year ${Y.index + 1} · day ${Math.floor(h / 24) + 1} · ${pad2(h % 24)}:00`,
      rows: [
        { label: 'Facility demand (net)', text: fmtMW(hs.net[h]), key: 'line' },
        Math.abs(hs.demand[h] - hs.net[h]) > 1e-6 ? { label: 'Gross demand before credits', text: fmtMW(hs.demand[h]), sub: true } : null,
        hasSolar ? { label: 'Solar PV (on site)', text: fmtMW(hs.solar[h]), color: C.solar } : null,
        hasWind ? { label: 'Wind (on site)', text: fmtMW(hs.wind[h]), color: C.wind, hatch: 'wind' } : null,
        hasBess ? { label: 'Battery discharge', text: fmtMW(hs.dis[h]), color: C.bess } : null,
        ...groups.map((g, k) => ({ label: g.label, text: fmtMW(hs.firmBy[k][h]), color: g.color, hatch: g.hatch })),
        { label: `Grid import${sub.length ? ` (${sub.join(', ')})` : ''}`, text: fmtMW(hs.gridIn[h]), color: C.grid },
        hs.unmet[h] > 1e-9 ? { label: '! Unmet load', text: fmtMW(hs.unmet[h]), key: 'strip' } : null,
        hasBess ? { label: 'Battery charging', text: fmtMW(hs.ch[h]), color: C.bess, sub: true } : null,
        hs.curt[h] > 1e-9 ? { label: 'Curtailment', text: fmtMW(hs.curt[h]), color: C.curtail, sub: true } : null,
        hs.exp[h] > 1e-9 ? { label: 'Export', text: fmtMW(hs.exp[h]), color: C.grid, sub: true } : null,
        hasPPA ? { label: 'PPA contracted this hour', text: fmtMW(hs.ppaContract[h]), sub: true } : null,
        hasBess ? { label: 'Battery charge level', text: `${sig(hs.soc[h], 3)} MWh`, sub: true } : null,
      ],
    };
  };
  const weekUnmet = (() => { let s = 0; for (let h = wr.from; h < wr.to; h++) s += hs.unmet[h]; return s; })();
  const unmetNoneText = period ? '! Unmet load: none in this period' : '! Unmet load: none this week';
  const hrLegend = [
    hasSolar ? { label: 'Solar PV (on site)', color: C.solar } : null,
    hasWind ? { label: 'Wind (on site)', color: C.wind, hatch: 'wind' } : null,
    hasBess ? { label: 'Battery: discharge above the axis, charging below', color: C.bess } : null,
    ...groups.map((g) => ({ label: `${g.label}: ${g.names.join(', ')}`, color: g.color, hatch: g.hatch })),
    { label: `Grid: import${hasPPA ? ' (incl. PPA)' : ''} above the axis${B.exp > 1e-6 ? ', export below' : ''}`, color: C.grid },
    B.curt > 1e-6 ? { label: 'Curtailment (below the axis)', color: C.curtail } : null,
    { label: 'Facility demand (net)', kind: 'line' },
    { label: weekUnmet > 1e-6 ? '! Unmet load (strip above the plot)' : unmetNoneText, kind: 'strip' },
  ].filter(Boolean);
  const plantRows = (E.plants || []).filter((p) => p.mwh > 1e-6 || p.hours > 0);
  const hedge = I.eco.ppaHedge;
  const setWeekNow = (w) => { setWeekDraft(null); setPeriod(null); setWeek(w); };

  return (
    <>
      <h3>Phasing: supply against design load (MW)</h3>
      <p className="dv-facts">
        First power <strong>{T.firstPowerM == null ? 'not reached' : `month ${T.firstPowerM} (${monthLabel(start, T.firstPowerM)})`}</strong>
        {' · '}Full load <strong>{T.fullLoadM == null ? `not reached in ${tl.months} months` : `month ${T.fullLoadM} (${monthLabel(start, T.fullLoadM)})`}</strong>
        {' · '}Power gap <strong>{T.gapMWm > 0 ? `${sig(T.gapMWm, 3)} MW-months over ${T.gapMonths} month${T.gapMonths === 1 ? '' : 's'}` : 'none'}</strong>
        {!I.islanded ? <>{' · '}Full grid connection month {I.fullGridM} ({monthLabel(start, I.fullGridM)})</> : <>{' · '}Islanded: the grid connection is not counted as supply</>}
        {hasBridgeBess ? <>{' · '}Bridging battery {sig(I.bess.bridgeMW, 3)} MW from month {I.bess.bridgeAvailMonth} (its planning, procurement and construction)</> : null}
      </p>
      <StackChart
        id="dispatch-timeline"
        n={tl.months}
        pos={[
          { key: 'grid', label: 'Grid', color: C.grid, values: tl.grid },
          ...tlGroups.map((g) => ({ key: `firm-${g.source}`, label: g.label, color: g.color, hatch: g.hatch, values: g.values })),
          { key: 'bess', label: 'Battery bridging', color: C.bess, values: tl.bess },
        ]}
        line={{ label: 'Design load', values: tl.design }}
        strip={{ label: 'Power gap', values: tl.gap }}
        markers={tlMarkers}
        xTicks={tlTicks}
        height={200}
        readout={tlReadout}
        legendItems={tlLegend}
        initialWidth={chartWidth}
        ariaLabel={`Monthly supply against design load over ${tl.months} months for #${option.rank} ${option.name}. Power gap ${sig(T.gapMWm, 3)} MW-months.`}
      />
      <details className="dv-table">
        <summary>Timeline as a table</summary>
        <div className="dv-scroll" role="region" aria-label="Timeline table" tabIndex={0}>
          <table className="mini dv-num">
            <caption className="sr-only">Monthly supply that time-to-power counts, by source, against design load</caption>
            <thead><tr><th scope="col">Month</th><th scope="col">Design load MW</th><th scope="col">Grid MW</th>{tlGroups.map((g) => <th key={g.source} scope="col">{g.label} MW</th>)}<th scope="col">Battery bridging MW</th><th scope="col">Supply MW</th><th scope="col">Power gap MW</th></tr></thead>
            <tbody>
              {Array.from({ length: tl.months }, (_, m) => (
                <tr key={m}><th scope="row">{monthLabel(start, m)}</th><td>{sig(tl.design[m], 3)}</td><td>{sig(tl.grid[m], 3)}</td>{tlGroups.map((g) => <td key={g.source}>{sig(g.values[m], 3)}</td>)}<td>{sig(tl.bess[m], 3)}</td><td>{sig(tl.supply[m], 3)}</td><td>{tl.gap[m] > 0 ? sig(tl.gap[m], 3) : '0'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <h3>Hourly dispatch (MW)</h3>
      <div className="dv-controls">
        <div className="btn-row" role="group" aria-label="Model year">
          {I.years.map((yy) => (
            <button key={yy.index} type="button" className="chip-btn" aria-pressed={yy.index === Y.index}
              onClick={() => { setWeekDraft(null); setYear(yy.index); setWeek(defaultWeek(yy.hourly)); }}>
              Year {yy.index + 1}
            </button>
          ))}
        </div>
        <p className="dv-note">
          Year {Y.index + 1}: {monthLabel(start, Y.fromMonth)} to {monthLabel(start, Y.fromMonth + 11)}.
          {Y.index === dy.y ? ` Opened on ${dy.why}.` : ''}
          {I.nExplicit < I.evaluationYears ? ` Years ${I.nExplicit + 1} to ${I.evaluationYears} of the evaluation repeat year ${I.nExplicit}.` : ''}
        </p>
        {yearHasLoad ? (
          <div className="btn-row" role="group" aria-label="Week">
            <button type="button" className="chip-btn" onClick={() => setWeekNow(Math.max(1, week - 1))} disabled={week <= 1} aria-label="Previous week">‹</button>
            <label className="dv-week">Week <input id="dv-week" type="number" inputMode="numeric" min={1} max={WEEKS_PER_YEAR} value={weekDraft ?? String(week)}
              onChange={(e) => {
                const t = e.target.value;
                setWeekDraft(t);
                const w = Number(t);
                if (t !== '' && Number.isInteger(w) && w >= 1 && w <= WEEKS_PER_YEAR) setWeek(w);
              }}
              onBlur={() => setWeekDraft(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setWeekDraft(null); }} /> of {WEEKS_PER_YEAR}</label>
            <button type="button" className="chip-btn" onClick={() => setWeekNow(Math.min(WEEKS_PER_YEAR, week + 1))} disabled={week >= WEEKS_PER_YEAR} aria-label="Next week">›</button>
            {presets.map((p) => (
              <button key={p.id} type="button" className="chip-btn" aria-pressed={!period && week === p.week} onClick={() => setWeekNow(p.week)}>{p.label} (week {p.week})</button>
            ))}
          </div>
        ) : null}
        {yearHasLoad ? (
          <div className="btn-row dv-period" role="group" aria-label="Any period">
            <label className="small">Any period: start day <input id="dv-day" type="number" inputMode="numeric" min={1} max={365} key={`d${period ? period.day : 'w'}`} defaultValue={period ? period.day : wk.from / 24 + 1}
              onBlur={(e) => { const d = Math.round(Number(e.target.value)); if (d >= 1 && d <= 365) setPeriod({ day: d, len: period ? period.len : 7 }); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>
            <label className="small">length <select id="dv-len" value={period ? period.len : 7} onChange={(e) => setPeriod({ day: period ? period.day : wk.from / 24 + 1, len: Number(e.target.value) })}>
              {[1, 2, 3, 7, 14, 31].map((n) => <option key={n} value={n}>{n} day{n === 1 ? '' : 's'}</option>)}
            </select></label>
            {period ? <button type="button" className="chip-btn" onClick={() => setPeriod(null)}>Back to weeks</button> : null}
            <span className="small">{period ? `Showing ${periodName} of year ${Y.index + 1}.` : ''}</span>
          </div>
        ) : null}
      </div>

      {yearHasLoad ? (
        <>
          <StackChart
            id="dispatch-chart"
            n={nH}
            offset={off}
            pos={[
              { key: 'solar', label: 'Solar PV', color: C.solar, values: hs.solar },
              { key: 'wind', label: 'Wind', color: C.wind, hatch: 'wind', values: hs.wind },
              { key: 'dis', label: 'Battery discharge', color: C.bess, values: hs.dis },
              ...groups.map((g, k) => ({ key: `firm-${g.source}`, label: g.label, color: g.color, hatch: g.hatch, values: hs.firmBy[k] })),
              { key: 'grid', label: 'Grid import', color: C.grid, values: hs.gridIn },
            ]}
            neg={[
              { key: 'ch', label: 'Battery charging', color: C.bess, values: hs.ch },
              { key: 'curt', label: 'Curtailment', color: C.curtail, values: hs.curt },
              { key: 'exp', label: 'Export', color: C.grid, values: hs.exp },
            ]}
            line={{ label: 'Facility demand (net)', values: hs.net }}
            strip={{ label: 'Unmet load', values: hs.unmet }}
            xTicks={hrTicks}
            height={230}
            readout={hrReadout}
            legendItems={hrLegend}
            initialWidth={chartWidth}
            ariaLabel={`Hourly dispatch, year ${Y.index + 1}, ${periodName}, for #${option.rank} ${option.name}. Unmet load in this period ${MWh(weekUnmet)}.`}
            help="Above the axis: where each hour's energy came from, stacked from the bottom in merit order as on-site solar and wind, battery discharge, firm on-site plant, then grid import (PPA energy arrives over the grid connection, so it sits in the grid band; the readout splits it). Below the axis: energy that did not serve the facility (battery charging, curtailment, export). The line is the facility demand; where it sits above the stack, that part of the demand was not met. Colours and hatches are those of the site plan: solar, battery and grid in plain colour; wind (which shares the grid blue) and firm on-site plant with their plan hatch."
          />
          {hasBess ? (
            <>
              <h4 className="dv-h4">Battery charge level (MWh of {sig(I.bess.mwh, 3)} MWh{I.bess.availMonth != null ? `; available from month ${I.bess.availMonth}` : ''})</h4>
              <StackChart
                id="dispatch-soc"
                n={nH}
                offset={off}
                line={{ label: 'Charge level', values: hs.soc }}
                xTicks={hrTicks}
                unit="MWh"
                height={80}
                initialWidth={chartWidth}
                readout={(i) => ({ title: `Year ${Y.index + 1} · day ${Math.floor((off + i) / 24) + 1} · ${pad2((off + i) % 24)}:00`, rows: [{ label: 'Battery charge level', text: `${sig(hs.soc[off + i], 3)} MWh`, key: 'line' }] })}
                ariaLabel={`Battery charge level, year ${Y.index + 1}, ${periodName}.`}
              />
            </>
          ) : null}
          <details className="dv-table">
            <summary>{PeriodName} as a table (MW, hourly)</summary>
            <div className="dv-scroll" role="region" aria-label={`${PeriodName} table`} tabIndex={0}>
              <table className="mini dv-num">
                <caption className="sr-only">Hourly dispatch of {periodName}, year {Y.index + 1}</caption>
                <thead><tr><th scope="col">Hour</th><th scope="col">Demand</th><th scope="col">Solar</th><th scope="col">Wind</th><th scope="col">Battery out</th>{groups.map((g) => <th key={g.source} scope="col">{g.label}</th>)}<th scope="col">Grid to load</th><th scope="col">PPA delivered</th>{hasPPA ? <th scope="col">PPA contracted</th> : null}<th scope="col">Grid to battery</th><th scope="col">Unmet</th><th scope="col">Battery in</th><th scope="col">Curtailed</th><th scope="col">Export</th>{hasBess ? <th scope="col">Charge level MWh</th> : null}</tr></thead>
                <tbody>
                  {Array.from({ length: nH }, (_, i) => {
                    const h = off + i;
                    return (
                      <tr key={h}><th scope="row">Day {Math.floor(h / 24) + 1} {pad2(h % 24)}:00</th><td>{sig(hs.net[h], 3)}</td><td>{sig(hs.solar[h], 3)}</td><td>{sig(hs.wind[h], 3)}</td><td>{sig(hs.dis[h], 3)}</td>{groups.map((g, k) => <td key={g.source}>{sig(hs.firmBy[k][h], 3)}</td>)}<td>{sig(hs.grid[h], 3)}</td><td>{sig(hs.ppa[h], 3)}</td>{hasPPA ? <td>{sig(hs.ppaContract[h], 3)}</td> : null}<td>{sig(hs.gridCharge[h], 3)}</td><td>{sig(hs.unmet[h], 3)}</td><td>{sig(hs.ch[h], 3)}</td><td>{sig(hs.curt[h], 3)}</td><td>{sig(hs.exp[h], 3)}</td>{hasBess ? <td>{sig(hs.soc[h], 3)}</td> : null}</tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="dv-note">No facility load in year {Y.index + 1}. The first phase energises in month {I.firstPhaseM} ({monthLabel(start, I.firstPhaseM)}).</p>
      )}

      <h3>Energy balance, year {Y.index + 1}</h3>
      <div className="dv-scroll" role="region" aria-label={`Energy balance, year ${Y.index + 1}`} tabIndex={0}>
        <table className="mini dv-num dv-balance">
          <caption className="sr-only">Annual energy balance from the hourly records: energy in and energy out</caption>
          <thead><tr><th scope="col">In</th><th scope="col">MWh</th><th scope="col">Out</th><th scope="col">MWh</th></tr></thead>
          <tbody>
            <tr><th scope="row">On-site renewables<span className="dv-basis">solar {MWh(B.solar)}, wind {MWh(B.wind)}</span></th><td>{MWh(B.re)}</td>
              <th scope="row">Facility demand (net)<span className="dv-basis">gross {MWh(B.gross)}{B.chpCredit > 1e-6 ? `, less absorption-chiller credit ${MWh(B.chpCredit)}` : ''}{B.flex > 1e-6 ? `, less flexibility ${MWh(B.flex)}` : ''}</span></th><td>{MWh(B.net)}</td></tr>
            <tr><th scope="row">PPA delivered over the grid connection{hasPPA ? <span className="dv-basis">contracted {MWh(B.ppaContract)}; {MWh(Math.max(0, B.ppaContract - B.ppa))} not delivered (its settlement is the PPA hedge, not counted)</span> : null}</th><td>{MWh(B.ppa)}</td>
              <th scope="row">Battery charging<span className="dv-basis">{hasBess ? `round-trip and storage losses ${MWh(E.bessLossMWh)}` : 'no battery'}</span></th><td>{MWh(B.ch)}</td></tr>
            <tr><th scope="row">Battery discharge</th><td>{MWh(B.dis)}</td>
              <th scope="row">Curtailment</th><td>{MWh(B.curt)}</td></tr>
            <tr><th scope="row">Firm on-site plant{plantRows.length ? <span className="dv-basis">{plantRows.map((p) => `${plantName(p)}: ${MWh(p.mwh)}, ${Math.round(p.hours).toLocaleString('en-GB')} h${p.runHoursAboveLimit ? ' (above run-hour limit)' : ''}`).join('; ')}</span> : null}</th><td>{MWh(B.firm)}</td>
              <th scope="row">Export</th><td>{MWh(B.exp)}</td></tr>
            <tr><th scope="row">Grid import to load</th><td>{MWh(B.gridLoad)}</td><td colSpan={2} /></tr>
            <tr><th scope="row">Grid import to battery</th><td>{MWh(B.gridCharge)}</td><td colSpan={2} /></tr>
            <tr><th scope="row">! Unmet load<span className="dv-basis">{B.unmetHours} h, peak {fmtMW(E.unmetPeakMW)}</span></th><td>{MWh(B.unmet)}</td><td colSpan={2} /></tr>
            <tr className="dv-total"><th scope="row">Total in</th><td>{MWh(B.in)}</td><th scope="row">Total out</th><td>{MWh(B.out)}</td></tr>
          </tbody>
        </table>
      </div>
      <ul className="dv-notes">
        <li>Balance: in − out = {B.residual.toExponential(1)} MWh over the year; the largest hourly error is {E.maxBalanceError.toExponential(1)} MWh (engine check: every hour must balance).</li>
        <li data-check={check.matches ? 'match' : 'differ'}>{check.matches
          ? `Check against the ranking: every dispatched year, time-to-power, LCOE, NPV, solar size, deliverability and site fit match the figures the ranking used for this option.`
          : `Check against the ranking: ${check.diffs.length} figure${check.diffs.length === 1 ? '' : 's'} differ (largest ${sig(check.worst, 3)}), e.g. ${check.diffs.slice(0, 3).map((d) => d.label).join('; ')}.`}{ms != null ? ` Re-run in ${sig(ms / 1000, 2)} s on this device.` : ''}</li>
        {hedge ? <li>PPA hedge (not counted): {hedge.undeliveredMWh > 1e-6 ? `net ${hedge.total >= 0 ? 'income' : 'cost'} of ${money(Math.abs(hedge.total))} over the evaluation period on ${sig(hedge.undeliveredMWh / 1e6, 3)} TWh of contracted PPA volume that is not delivered` : 'none (all contracted PPA volume is delivered)'}. PPA settlement counts only on energy delivered over the grid connection, so the hedge is outside the cost ledger, LCOE, NPV and score.</li> : null}
        {I.exceedance ? <li>Grid handling is "Show exceedance": grid import above the offered capacity is allowed and recorded instead of unmet load.</li> : null}
        <li>Profiles are synthetic (seeded, calibrated to indicative annual targets), not measured data. Week 52 runs to the end of the year (8 days).</li>
      </ul>
    </>
  );
}
