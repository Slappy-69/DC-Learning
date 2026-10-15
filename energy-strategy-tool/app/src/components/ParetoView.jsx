import React, { useMemo, useState } from 'react';
import { HOOKS } from '../engine/run.js';
import { PARETO_AXES, defaultParetoAxes } from '../engine/pareto.js';
import { LABEL } from '../engine/defaults.js';
import { sig, money } from '../format.js';
import ParetoChart, { SHAPE_LABEL } from './ParetoChart.jsx';
import ParetoTable, { fmtAxis } from './ParetoTable.jsx';
import OptionDetail from './OptionDetail.jsx';

// Trade-offs tab (§12.2 Pareto scatter). Uses HOOKS.paretoView; never scores, ranks or dispatches.
// The view state (filters, "Hide dominated options") is shared with the ranking table.
const PAGE = 50;

export default function ParetoView({ run, view, setView, start }) {
  const settings = run.inputs.settings;
  const [axes, setAxes] = useState(null); // null = follow the scoring metrics (default)
  const [mode, setMode] = useState('chart');
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(0);
  const ax = axes || defaultParetoAxes(settings);
  const model = useMemo(() => HOOKS.paretoView(run, ax, view), [run, ax.x, ax.y, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = useMemo(() => new Map(run.options.map((o) => [o.id, o])), [run]);
  const open = openId ? byId.get(openId) : null;
  const pick = model.pickId ? byId.get(model.pickId) : null;
  const pages = Math.max(1, Math.ceil(model.points.length / PAGE));
  const p = Math.min(page, pages - 1);
  const onOpen = (id) => setOpenId((cur) => (cur === id ? null : id));
  const tq = model.ttpScale;

  return (
    <section className="pareto" aria-labelledby="pareto-h">
      <div className="pareto-head">
        <h2 id="pareto-h">Trade-offs: cost against carbon</h2>
        <div className="pareto-controls" role="group" aria-label="Chart settings (never change score or rank)">
          <label className="inline-select">
            <span>Cost axis</span>
            <select value={ax.x} onChange={(e) => setAxes({ ...ax, x: e.target.value })}>
              {Object.values(PARETO_AXES.x).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </label>
          <label className="inline-select">
            <span>Carbon axis</span>
            <select value={ax.y} onChange={(e) => setAxes({ ...ax, y: e.target.value })}>
              {Object.values(PARETO_AXES.y).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </label>
          {axes ? <button type="button" className="link-btn" onClick={() => setAxes(null)}>Follow scoring metrics</button> : <span className="tag tag-unverified" title={`${LABEL} (judgement): axes follow the Cost and Carbon axis metrics`}>default axes · unverified</span>}
          <label className="inline-check">
            <input type="checkbox" checked={view.hideDominated} onChange={(e) => setView({ ...view, hideDominated: e.target.checked })} />
            <span>Hide dominated options</span>
          </label>
          <div className="seg" role="group" aria-label="Show as">
            <button type="button" className="chip-btn" aria-pressed={mode === 'chart'} onClick={() => setMode('chart')}>Chart</button>
            <button type="button" className="chip-btn" aria-pressed={mode === 'table'} onClick={() => setMode('table')}>Table</button>
          </div>
        </div>
      </div>

      <p className="pick-line" aria-live="polite">
        <span className="badge badge-pick"><span aria-hidden="true">◎</span> Weighted pick</span>{' '}
        {pick ? <><strong>#{pick.rank} {pick.name}</strong>, score {pick.score.toFixed(1)}; {model.xAxis.label} {fmtAxis(model.xAxis, PARETO_AXES.x[ax.x].get(pick))}; {model.yAxis.label} {fmtAxis(model.yAxis, PARETO_AXES.y[ax.y].get(pick))}.</> : 'none'}
        {pick && model.leaderId !== pick.id ? ' Ranked below rank 1 because "Rank requirement-compliant options first" is on.' : ''}
        {pick && !model.pickVisible ? <span className="flag-text"> Hidden by the current view filters; clear them to see it on the chart.</span> : null}
        <span className="sub"> Updates with the weights; no re-run.</span>
      </p>

      <p className="note">
        {model.points.length.toLocaleString('en-GB')} of {model.scoringSetSize.toLocaleString('en-GB')} screened options shown
        ({model.dominatedCount.toLocaleString('en-GB')} dominated on all four axes, drawn hollow{view.hideDominated ? `; ${model.hiddenDominated.toLocaleString('en-GB')} hidden` : ', all shown'}).
        {' '}{model.frontier.length} options are on the two-axis frontier.
        {model.notPlotted.length ? ` ${model.notPlotted.length} options have no finite value on an axis and are listed in the table only.` : ''}
        {' '}The frontier and the pick are computed over every screened option, so filters do not move them.
      </p>
      {model.chips.length || view.hideDominated ? (
        <div className="chip-row" aria-label="Active view filters">
          {model.chips.map((c) => <span key={c} className="active-chip">{c}</span>)}
          {view.hideDominated ? <span className="active-chip">{model.hiddenDominated.toLocaleString('en-GB')} dominated options hidden <button type="button" className="link-btn" onClick={() => setView({ ...view, hideDominated: false })}>show</button></span> : null}
        </div>
      ) : null}

      {mode === 'chart' ? (
        <>
          <ParetoChart model={model} selectedId={openId} onSelect={onOpen} />
          <div className="pc-legend" aria-label="Legend">
            <div className="lg-group">
              <span className="lg-title">Colour: time-to-power (months, quantile classes)</span>
              <span className="lg-ramp">
                {tq.min == null ? '—' : tq.rampSteps.map((step, i) => {
                  const lo = i === 0 ? null : tq.breaks[i - 1];
                  const hi = i < tq.breaks.length ? tq.breaks[i] : null;
                  const label = lo == null && hi == null ? `${sig(tq.min, 2)}–${sig(tq.max, 2)}` : lo == null ? (tq.min === hi ? `< ${sig(hi, 2)}` : `${sig(tq.min, 2)} to < ${sig(hi, 2)}`) : hi == null ? `${sig(lo, 2)}–${sig(tq.max, 2)}` : `${sig(lo, 2)} to < ${sig(hi, 2)}`;
                  return <span key={i} className="lg-step"><span className="lg-sw" style={{ background: `var(--ttp-${step + 1})` }} aria-hidden="true" />{label}</span>;
                })}
              </span>
            </div>
            <div className="lg-group">
              <span className="lg-title">Shape: resilience</span>
              <span><span aria-hidden="true">{SHAPE_LABEL.circle}</span> Meets</span>
              <span><span aria-hidden="true">{SHAPE_LABEL.triangle}</span> Meets with flags</span>
              <span><span aria-hidden="true">{SHAPE_LABEL.square}</span> Does not meet</span>
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
              <span><span className="lg-ring" aria-hidden="true" /> Weighted pick</span>
            </div>
          </div>
          <p className="note">Shape shows resilience status until site fit is assessed (the brief puts site-fit status on shape; there is no layout yet). Points are P50 values from the full-year hourly model; P10–P90 error crosses arrive with the uncertainty slice.</p>
        </>
      ) : (
        <>
          <div className="table-wrap" role="region" aria-label="Trade-off data table" tabIndex={0}>
            <ParetoTable model={model} page={p} pageSize={PAGE} onOpen={onOpen} openId={openId} />
          </div>
          <nav className="pager" aria-label="Table pages">
            <button type="button" className="chip-btn" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</button>
            <span>Page {p + 1} of {pages}</span>
            <button type="button" className="chip-btn" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</button>
          </nav>
        </>
      )}

      {open ? (
        <div className="pareto-detail">
          <OptionDetail o={open} start={start} onClose={() => setOpenId(null)} />
        </div>
      ) : null}
    </section>
  );
}
