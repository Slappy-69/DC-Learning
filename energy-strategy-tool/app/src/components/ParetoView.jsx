import React, { useEffect, useMemo, useState } from 'react';
import { HOOKS } from '../engine/run.js';
import { PARETO_AXES, PARETO_AXIS_LIST, PARETO_AXIS_GROUPS, defaultParetoAxes, paretoDefaultDisplay } from '../engine/pareto.js';
import { defaultView, tablePageSize } from '../engine/view.js';
import { sig, money } from '../format.js';
import ParetoChart, { SHAPE_LABEL } from './ParetoChart.jsx';
import ParetoTable, { fmtAxis } from './ParetoTable.jsx';
import OptionDetail from './OptionDetail.jsx';
import FilterChips from './FilterChips.jsx';
import { UnverifiedTag, unverifiedTip } from './Field.jsx';

// Trade-offs tab (§12.2 Pareto scatter). Uses HOOKS.paretoView; never scores, ranks or dispatches.
// The view state (filters, "Hide dominated options") is shared with the ranking table.
export const CHART_ID = 'tradeoffs-chart'; // target of the "Skip to trade-offs chart" link

// Class edges at 2 significant figures, more where two edges would otherwise print the same
// (for example 30 and 30.4 months both print "30" at 2 s.f.).
function edgeFormat(values) {
  const distinct = new Set(values).size;
  for (let n = 2; n <= 4; n++) if (new Set(values.map((v) => sig(v, n))).size === distinct) return (v) => sig(v, n);
  return (v) => sig(v, 5);
}

function AxisSelect({ label, value, onChange, describedBy }) {
  return (
    <label className="inline-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy}>
        {PARETO_AXIS_GROUPS.map(([g, gl]) => (
          <optgroup key={g} label={gl}>
            {PARETO_AXIS_LIST.filter((a) => a.group === g).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export default function ParetoView({ run, view, setView, start, focusChart = false, onChartFocused }) {
  const settings = run.inputs.settings;
  const defaultDisplay = paretoDefaultDisplay();
  const pageSize = tablePageSize();
  const [axes, setAxes] = useState(null); // null = registered default axes (follow the scoring metrics)
  const [mode, setMode] = useState(defaultDisplay);
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(0);
  const ax = axes || defaultParetoAxes(settings);
  const X = PARETO_AXES.x[ax.x], Y = PARETO_AXES.y[ax.y];
  const model = useMemo(() => HOOKS.paretoView(run, ax, view), [run, ax.x, ax.y, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = useMemo(() => new Map(run.options.map((o) => [o.id, o])), [run]);
  const open = openId ? byId.get(openId) : null;
  const pick = model.pickId ? byId.get(model.pickId) : null;
  const top = model.topScoreId ? byId.get(model.topScoreId) : null;
  const pages = Math.max(1, Math.ceil(model.points.length / pageSize));
  const p = Math.min(page, pages - 1);
  const toggleOpen = (id) => setOpenId((cur) => (cur === id ? null : id)); // table rows (aria-expanded)
  const tq = model.ttpScale;
  const fe = tq.min == null ? (v) => sig(v, 2) : edgeFormat([tq.min, ...tq.breaks, tq.max]);
  const hdDefault = defaultView().hideDominated;
  // Any two axes (§12.2). Choosing the axis already on the other side swaps them.
  const setAxis = (which, v) => setAxes(which === 'x' ? { x: v, y: v === ax.y ? ax.x : ax.y } : { y: v, x: v === ax.x ? ax.y : ax.x });

  // "Skip to trade-offs chart": show the chart and move focus to it (one request at a time).
  useEffect(() => {
    if (!focusChart) return;
    if (mode !== 'chart') { setMode('chart'); return; }
    const el = typeof document !== 'undefined' ? document.getElementById(CHART_ID) : null;
    if (el) el.focus();
    if (onChartFocused) onChartFocused();
  }, [focusChart, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const hiddenReason = model.pickHiddenBy === 'hide-dominated'
    ? ` Not on the chart: "Hide dominated options" hides it${model.pickDominatedBy ? ` (dominated by #${model.pickDominatedBy.rank} ${model.pickDominatedBy.name}, which ties or nearly ties on weighted score)` : ''}; use "show" to see it.`
    : ' Not on the chart: hidden by the current view filters; remove them to see it.';
  const topReason = model.topScoreReason === 'compliant-first'
    ? `ranked #${model.topScoreRank}, below the pick, because "Rank requirement-compliant options first" is on and its resilience status is "${model.topScoreStatus}".`
    : `ranked #${model.topScoreRank} under the current ranking settings.`;

  return (
    <section className="pareto" aria-labelledby="pareto-h">
      <div className="pareto-head">
        <h2 id="pareto-h">Trade-offs: {X.label} against {Y.label}</h2>
        <div className="pareto-controls" role="group" aria-label="Chart settings (never change score or rank)">
          <AxisSelect label="X axis" value={ax.x} onChange={(v) => setAxis('x', v)} describedBy={axes ? undefined : 'pareto-x-basis'} />
          <AxisSelect label="Y axis" value={ax.y} onChange={(v) => setAxis('y', v)} describedBy={axes ? undefined : 'pareto-y-basis'} />
          {axes ? <button type="button" className="link-btn" onClick={() => setAxes(null)}>Reset to default axes</button> : (
            <span className="tag tag-unverified" title={`${unverifiedTip('view.pareto.xAxis')}\n${unverifiedTip('view.pareto.yAxis')}`}>
              default axes · unverified
              <span id="pareto-x-basis" hidden>{unverifiedTip('view.pareto.xAxis')}</span>
              <span id="pareto-y-basis" hidden>{unverifiedTip('view.pareto.yAxis')}</span>
            </span>
          )}
          <label className="inline-check">
            <input type="checkbox" checked={view.hideDominated} onChange={(e) => { setPage(0); setView({ ...view, hideDominated: e.target.checked }); }}
              aria-describedby={view.hideDominated === hdDefault ? 'pareto-hd-basis' : undefined} />
            <span>Hide dominated options</span>
            {view.hideDominated === hdDefault ? <UnverifiedTag path="settings.hideDominated" compact descId="pareto-hd-basis" /> : null}
          </label>
          <div className="seg" role="group" aria-label="Show as" aria-describedby={mode === defaultDisplay ? 'pareto-display-basis' : undefined}>
            <button type="button" className="chip-btn" aria-pressed={mode === 'chart'} onClick={() => setMode('chart')}>Chart</button>
            <button type="button" className="chip-btn" aria-pressed={mode === 'table'} onClick={() => setMode('table')}>Table</button>
            {mode === defaultDisplay ? <UnverifiedTag path="view.pareto.display" compact descId="pareto-display-basis" /> : null}
          </div>
        </div>
      </div>

      <p className="pick-line" aria-live="polite">
        <span className="badge badge-pick"><span aria-hidden="true">◎</span> Weighted pick</span>{' '}
        {pick ? <><strong>#{pick.rank} {pick.name}</strong>, score {pick.score.toFixed(1)}; {X.label} {fmtAxis(model.xAxis, X.get(pick))}; {Y.label} {fmtAxis(model.yAxis, Y.get(pick))}.</> : 'none'}
        {pick && model.pickShown && !model.pickPlotted ? <span className="flag-text"> Not drawn: it has no finite value on an axis; it is listed in the table.</span> : null}
        {pick && !model.pickShown ? <span className="flag-text">{hiddenReason}</span> : null}
        {top ? <><br /><span className="badge badge-top">Highest weighted score</span> <strong>#{top.rank} {top.name}</strong>, score {top.score.toFixed(1)}: {topReason}</> : null}
        <span className="sub"> The pick is the rank-1 option (the header leader) and moves with the weights; no re-run.</span>
      </p>

      <p className="note">
        {model.points.length.toLocaleString('en-GB')} of {model.scoringSetSize.toLocaleString('en-GB')} screened options shown
        ({model.dominatedCount.toLocaleString('en-GB')} dominated on all four axes with no better resilience or site-fit status, drawn hollow{view.hideDominated ? `; ${model.hiddenDominated.toLocaleString('en-GB')} hidden` : ', all shown'}).
        {' '}{model.frontier.length} options are on the two-axis frontier.
        {model.notPlotted.length ? ` ${model.notPlotted.length} options have no finite value on an axis and are listed in the table only.` : ''}
        {' '}Scores are relative to the scoring set (all screened options). The frontier and the pick are computed over every screened option, so filters do not move them.
      </p>
      <FilterChips view={view} setView={setView} hiddenDominated={model.hiddenDominated} onChange={() => setPage(0)} clearAll />

      {mode === 'chart' ? (
        <>
          <ParetoChart model={model} selectedId={openId} onSelect={(id) => setOpenId(id)} svgId={CHART_ID} />
          <div className="pc-legend" role="group" aria-label="Legend">
            <div className="lg-group">
              <span className="lg-title">Colour: time-to-power (months; up to {tq.maxClasses} quantile classes, tied edges merged) <UnverifiedTag path="view.pareto.ttpClasses" compact /></span>
              <span className="lg-ramp">
                {tq.min == null ? '—' : tq.rampSteps.map((step, i) => {
                  const lo = i === 0 ? null : tq.breaks[i - 1];
                  const hi = i < tq.breaks.length ? tq.breaks[i] : null;
                  const label = lo == null && hi == null ? `${fe(tq.min)}–${fe(tq.max)}` : lo == null ? (tq.min === hi ? `< ${fe(hi)}` : `${fe(tq.min)} to < ${fe(hi)}`) : hi == null ? `${fe(lo)}–${fe(tq.max)}` : `${fe(lo)} to < ${fe(hi)}`;
                  return <span key={i} className="lg-step"><span className="lg-sw" style={{ background: `var(--ttp-${step + 1})` }} aria-hidden="true" />{label}</span>;
                })}
              </span>
            </div>
            <div className="lg-group">
              <span className="lg-title">Shape: site fit</span>
              <span><span aria-hidden="true">{SHAPE_LABEL.circle}</span> Fits</span>
              <span><span aria-hidden="true">{SHAPE_LABEL.triangle}</span> Fits with flags</span>
              <span><span aria-hidden="true">{SHAPE_LABEL.square}</span> Does not fit</span>
            </div>
            <div className="lg-group">
              <span className="lg-title">Fill</span>
              <span><span className="lg-dot" aria-hidden="true" /> Not dominated</span>
              <span><span className="lg-dot lg-hollow" aria-hidden="true" /> Dominated (still ranked)</span>
            </div>
            <div className="lg-group">
              <span className="lg-title">Size: capex</span>
              <span>{money(model.capexRange[0], 2)} (small) to {money(model.capexRange[1], 2)} (large)</span>
            </div>
            <div className="lg-group">
              <span><span className="lg-line" aria-hidden="true" /> Two-axis frontier</span>
              <span><span className="lg-ring" aria-hidden="true" /> Weighted pick (rank 1)</span>
              {model.topScoreId ? <span><span className="lg-ring lg-ring-top" aria-hidden="true" /> Highest weighted score</span> : null}
            </div>
          </div>
          <p className="note">Shape shows site-fit status (§12.2); resilience status is in the tooltip and the table. Site fit is a status, not a weight: it does not change any score or rank, and options that do not fit stay in the chart. Points are P50 values from the full-year hourly model; P10–P90 error crosses arrive with the uncertainty slice.</p>
        </>
      ) : (
        <>
          <div className="table-wrap" role="region" aria-label="Trade-off data table" tabIndex={0}>
            <ParetoTable model={model} page={p} pageSize={pageSize} onOpen={toggleOpen} openId={openId} />
          </div>
          <nav className="pager" aria-label="Table pages">
            <button type="button" className="chip-btn" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</button>
            <span>Page {p + 1} of {pages}</span>
            <button type="button" className="chip-btn" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</button>
            <UnverifiedTag path="view.table.pageSize" compact text={`${pageSize} rows per page · unverified`} />
          </nav>
        </>
      )}

      {open ? (
        <div className="pareto-detail">
          <OptionDetail o={open} start={start} dominator={open.dominatedBy ? byId.get(open.dominatedBy) : null} onClose={() => setOpenId(null)} />
        </div>
      ) : null}
    </section>
  );
}
