import React, { useEffect, useMemo, useState } from 'react';
import { inspectOption, weekPresets, weekRange, WEEKS_PER_YEAR } from '../engine/inspect.js';
import { TECH } from '../engine/defaults.js';
import { sig, monthLabel } from '../format.js';
import StackChart, { fmtMW } from './StackChart.jsx';

// Dispatch tab: how one option runs. Phasing timeline (BRIEF §12.6) and hourly dispatch for a
// chosen model year and week (§20 stage 4), with the annual energy balance and the engine's
// own balance check. Recomputes the selected option on the main thread (inspectOption); never
// changes the run, its scores or its ranking.

const C = { re: 'var(--src-re)', bess: 'var(--src-bess)', firm: 'var(--src-firm)', grid: 'var(--src-grid)', loss: 'var(--src-loss)' };
const MWh = (v) => `${Math.round(v).toLocaleString('en-GB')} MWh`;
const pad2 = (n) => String(n).padStart(2, '0');

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

export default function DispatchView({ run }) {
  const ranked = useMemo(() => [...run.options].sort((a, b) => a.rank - b.rank).slice(0, 50), [run]);
  const [selected, setSelected] = useState(ranked[0] ? ranked[0].id : null);
  const option = run.options.find((o) => o.id === selected) || ranked[0];
  const start = run.inputs.project.analysisStart;

  const insp = useMemo(() => {
    if (!option) return null;
    try {
      const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      const value = inspectOption(run.inputs, option.v);
      return { ok: true, value, ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 };
    } catch (e) {
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  }, [run, option]);

  const I = insp && insp.ok ? insp.value : null;
  const dy = useMemo(() => (I ? defaultYear(I) : { y: 0, why: '' }), [I]);
  const [year, setYear] = useState(dy.y);
  const [week, setWeek] = useState(1);
  const [weekDraft, setWeekDraft] = useState(null); // text while the week box is being edited
  useEffect(() => {
    if (!I) return;
    setYear(dy.y);
    setWeek(defaultWeek(I.years[dy.y].hourly));
  }, [I, dy]);
  const Y = I && I.years[Math.min(year, I.years.length - 1)];

  // Hourly series for the selected year (grid import includes PPA and grid-to-battery: physical import).
  const hs = useMemo(() => {
    if (!Y) return null;
    const r = Y.hourly;
    const gridIn = new Float64Array(r.net.length);
    for (let h = 0; h < gridIn.length; h++) gridIn[h] = r.grid[h] + r.gridCharge[h] + r.ppa[h];
    return { ...r, gridIn };
  }, [Y]);
  const presets = useMemo(() => (Y ? weekPresets(Y.hourly) : []), [Y]);

  if (!run.options.length) return <p className="empty">No options to inspect.</p>;
  if (!insp) return null;
  if (!insp.ok) return <p className="empty">Could not run this option: {insp.error}</p>;

  const tl = I.timeline;
  const T = I.ttp;
  const wr = weekRange(week);
  const yearHasLoad = Y.balance.net > 1e-6;
  const hasPPA = Y.balance.ppa > 1e-6;
  const hasBess = I.bess.mwh > 1e-9;
  const hasFirm = I.years.some((y) => y.balance.firm > 1e-6) || tl.firm.some((v) => v > 1e-9);
  const hasRE = I.years.some((y) => y.balance.re > 1e-6);
  const hasBridgeBess = tl.bess.some((v) => v > 1e-9);

  // Compare the inspected year with the figures the ranking run used for this option.
  const runYear = option.dispatch && option.dispatch.years ? option.dispatch.years[Y.index] : null;
  const runDiff = runYear ? Math.max(...['gridMWh', 'firmMWh', 'unmetMWh', 'reGenMWh', 'bessDischargeMWh'].map((k) => Math.abs((Y.engine[k] || 0) - (runYear[k] || 0)))) : null;

  // ---- Phasing timeline ----
  const tlTicks = [];
  for (let m = 0; m < tl.months; m += 12) tlTicks.push({ i: m, label: monthLabel(start, m).slice(0, 4) });
  const tlMarkers = [];
  if (!I.islanded && I.fullGridM < tl.months) tlMarkers.push({ i: I.fullGridM, label: 'Full grid connection' });
  if (T.fullLoadM != null) tlMarkers.push({ i: T.fullLoadM, label: 'Full load supplied' });
  if (T.firstPowerM != null && T.firstPowerM !== T.fullLoadM) tlMarkers.push({ i: T.firstPowerM, label: 'First power' });
  const tlReadout = (m) => ({
    title: `${monthLabel(start, m)} · month ${m}`,
    rows: [
      { label: 'Design load', text: fmtMW(tl.design[m]), key: 'line' },
      { label: I.islanded ? 'Grid (islanded: not counted)' : 'Grid connection (offered)', text: fmtMW(tl.grid[m]), color: C.grid },
      hasFirm ? { label: 'Firm on-site plant available', text: fmtMW(tl.firm[m]), color: C.firm } : null,
      hasBridgeBess ? { label: 'Battery bridging', text: fmtMW(tl.bess[m]), color: C.bess } : null,
      { label: 'Total supply', text: fmtMW(tl.supply[m]) },
      tl.gap[m] > 0 ? { label: '⚠ Power gap', text: fmtMW(tl.gap[m]), key: 'strip' } : null,
    ],
  });
  const tlLegend = [
    { label: I.islanded ? 'Grid (islanded: not counted)' : 'Grid connection (offered)', color: C.grid },
    hasFirm ? { label: 'Firm on-site plant', color: C.firm } : null,
    hasBridgeBess ? { label: 'Battery bridging', color: C.bess } : null,
    { label: 'Design load', kind: 'line' },
    { label: T.gapMWm > 0 ? '⚠ Power gap (strip above the plot)' : '⚠ Power gap: none', kind: 'strip' },
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
        hasRE ? { label: 'On-site renewables', text: fmtMW(hs.re[h]), color: C.re } : null,
        hasBess ? { label: 'Battery discharge', text: fmtMW(hs.dis[h]), color: C.bess } : null,
        hasFirm ? { label: 'Firm on-site plant', text: fmtMW(hs.firm[h]), color: C.firm } : null,
        { label: `Grid import${sub.length ? ` (${sub.join(', ')})` : ''}`, text: fmtMW(hs.gridIn[h]), color: C.grid },
        hs.unmet[h] > 1e-9 ? { label: '⚠ Unmet load', text: fmtMW(hs.unmet[h]), key: 'strip' } : null,
        hasBess ? { label: 'Battery charging', text: fmtMW(hs.ch[h]), color: C.bess, sub: true } : null,
        hs.curt[h] > 1e-9 ? { label: 'Curtailment', text: fmtMW(hs.curt[h]), color: C.loss, sub: true } : null,
        hs.exp[h] > 1e-9 ? { label: 'Export', text: fmtMW(hs.exp[h]), color: C.grid, sub: true } : null,
        hasBess ? { label: 'Battery charge level', text: `${sig(hs.soc[h], 3)} MWh`, sub: true } : null,
      ],
    };
  };
  const weekUnmet = (() => { let s = 0; for (let h = wr.from; h < wr.to; h++) s += hs.unmet[h]; return s; })();
  const hrLegend = [
    hasRE ? { label: 'On-site renewables', color: C.re } : null,
    hasBess ? { label: 'Battery: discharge above the axis, charging below', color: C.bess } : null,
    hasFirm ? { label: 'Firm on-site plant', color: C.firm } : null,
    { label: `Grid: import${hasPPA ? ' (incl. PPA)' : ''} above the axis${Y.balance.exp > 1e-6 ? ', export below' : ''}`, color: C.grid },
    Y.balance.curt > 1e-6 ? { label: 'Curtailment (below the axis)', color: C.loss } : null,
    { label: 'Facility demand (net)', kind: 'line' },
    { label: weekUnmet > 1e-6 ? '⚠ Unmet load (strip above the plot)' : '⚠ Unmet load: none this week', kind: 'strip' },
  ].filter(Boolean);

  const B = Y.balance;
  const E = Y.engine;
  const plantRows = (E.plants || []).filter((p) => p.mwh > 1e-6 || p.hours > 0);

  return (
    <section className="dv" aria-labelledby="dv-title">
      <h2 id="dv-title" className="sens-title">Dispatch</h2>
      <p className="sens-intro">How one option is supplied, month by month while the site is being energised and hour by hour in each model year. The figures are re-run for the selected option with the engine the ranking uses and are checked against it below.</p>

      <div className="sens-controls">
        <label className="sens-select">
          <span>Option</span>
          <select id="dv-option" value={option.id} onChange={(e) => setSelected(e.target.value)}>
            {ranked.map((o) => <option key={o.id} value={o.id}>{`#${o.rank} ${o.name}`}</option>)}
          </select>
        </label>
      </div>

      <h3 className="site-h3">Phasing: supply against design load (MW)</h3>
      <p className="dv-facts">
        First power <strong>{T.firstPowerM == null ? 'not reached' : `month ${T.firstPowerM} (${monthLabel(start, T.firstPowerM)})`}</strong>
        {' · '}Full load <strong>{T.fullLoadM == null ? `not reached in ${tl.months} months` : `month ${T.fullLoadM} (${monthLabel(start, T.fullLoadM)})`}</strong>
        {' · '}Power gap <strong>{T.gapMWm > 0 ? `${sig(T.gapMWm, 3)} MW-months over ${T.gapMonths} month${T.gapMonths === 1 ? '' : 's'}` : 'none'}</strong>
        {!I.islanded ? <>{' · '}Full grid connection month {I.fullGridM} ({monthLabel(start, I.fullGridM)})</> : <>{' · '}Islanded: the grid connection is not counted as supply</>}
      </p>
      <StackChart
        n={tl.months}
        pos={[
          { key: 'grid', label: 'Grid', color: C.grid, values: tl.grid },
          { key: 'firm', label: 'Firm', color: C.firm, values: tl.firm },
          { key: 'bess', label: 'Battery', color: C.bess, values: tl.bess },
        ]}
        line={{ label: 'Design load', values: tl.design }}
        strip={{ label: 'Power gap', values: tl.gap }}
        markers={tlMarkers}
        xTicks={tlTicks}
        height={200}
        readout={tlReadout}
        legendItems={tlLegend}
        ariaLabel={`Monthly supply against design load over ${tl.months} months for ${option.name}. Power gap ${sig(T.gapMWm, 3)} MW-months.`}
      />
      <details className="dv-table">
        <summary>Timeline as a table</summary>
        <div className="dv-scroll">
          <table className="sens-table dv-num">
            <thead><tr><th scope="col">Month</th><th scope="col">Design load MW</th><th scope="col">Grid MW</th><th scope="col">Firm MW</th><th scope="col">Battery bridging MW</th><th scope="col">Supply MW</th><th scope="col">Power gap MW</th></tr></thead>
            <tbody>
              {Array.from({ length: tl.months }, (_, m) => (
                <tr key={m}><th scope="row">{monthLabel(start, m)}</th><td>{sig(tl.design[m], 3)}</td><td>{sig(tl.grid[m], 3)}</td><td>{sig(tl.firm[m], 3)}</td><td>{sig(tl.bess[m], 3)}</td><td>{sig(tl.supply[m], 3)}</td><td>{tl.gap[m] > 0 ? sig(tl.gap[m], 3) : '0'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <h3 className="site-h3">Hourly dispatch (MW)</h3>
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
            <button type="button" className="chip-btn" onClick={() => { setWeekDraft(null); setWeek(Math.max(1, week - 1)); }} disabled={week <= 1} aria-label="Previous week">‹</button>
            <label className="dv-week">Week <input id="dv-week" type="number" inputMode="numeric" min={1} max={WEEKS_PER_YEAR} value={weekDraft ?? String(week)}
              onChange={(e) => {
                const t = e.target.value;
                setWeekDraft(t);
                const w = Number(t);
                if (t !== '' && Number.isInteger(w) && w >= 1 && w <= WEEKS_PER_YEAR) setWeek(w);
              }}
              onBlur={() => setWeekDraft(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setWeekDraft(null); }} /> of {WEEKS_PER_YEAR}</label>
            <button type="button" className="chip-btn" onClick={() => { setWeekDraft(null); setWeek(Math.min(WEEKS_PER_YEAR, week + 1)); }} disabled={week >= WEEKS_PER_YEAR} aria-label="Next week">›</button>
            {presets.map((p) => (
              <button key={p.id} type="button" className="chip-btn" aria-pressed={week === p.week} onClick={() => { setWeekDraft(null); setWeek(p.week); }}>{p.label} (week {p.week})</button>
            ))}
          </div>
        ) : null}
      </div>

      {yearHasLoad ? (
        <>
          <StackChart
            n={nH}
            offset={off}
            pos={[
              { key: 're', label: 'Renewables', color: C.re, values: hs.re },
              { key: 'dis', label: 'Battery discharge', color: C.bess, values: hs.dis },
              { key: 'firm', label: 'Firm', color: C.firm, values: hs.firm },
              { key: 'grid', label: 'Grid import', color: C.grid, values: hs.gridIn },
            ]}
            neg={[
              { key: 'ch', label: 'Battery charging', color: C.bess, values: hs.ch },
              { key: 'curt', label: 'Curtailment', color: C.loss, values: hs.curt },
              { key: 'exp', label: 'Export', color: C.grid, values: hs.exp },
            ]}
            line={{ label: 'Facility demand (net)', values: hs.net }}
            strip={{ label: 'Unmet load', values: hs.unmet }}
            xTicks={hrTicks}
            height={230}
            readout={hrReadout}
            legendItems={hrLegend}
            ariaLabel={`Hourly dispatch, year ${Y.index + 1}, week ${wr.week}, for ${option.name}. Unmet load this week ${MWh(weekUnmet)}.`}
          />
          <p className="dv-caption">Above the axis: where each hour's energy came from, stacked from the bottom as on-site renewables, battery, firm on-site plant, then grid import (PPA energy arrives over the grid connection, so it sits in the grid band). Below the axis: energy that did not serve the facility (battery charging, curtailment, export). The line is the facility demand; where it sits above the stack, that part of the demand was not met.</p>
          {hasBess ? (
            <>
              <h4 className="dv-h4">Battery charge level (MWh of {sig(I.bess.mwh, 3)} MWh)</h4>
              <StackChart
                n={nH}
                offset={off}
                line={{ label: 'Charge level', values: hs.soc }}
                xTicks={hrTicks}
                unit="MWh"
                height={80}
                readout={(i) => ({ title: `Year ${Y.index + 1} · day ${Math.floor((off + i) / 24) + 1} · ${pad2((off + i) % 24)}:00`, rows: [{ label: 'Battery charge level', text: `${sig(hs.soc[off + i], 3)} MWh`, key: 'line' }] })}
                ariaLabel={`Battery charge level, year ${Y.index + 1}, week ${wr.week}.`}
              />
            </>
          ) : null}
          <details className="dv-table">
            <summary>Week {wr.week} as a table (MW, hourly)</summary>
            <div className="dv-scroll">
              <table className="sens-table dv-num">
                <thead><tr><th scope="col">Hour</th><th scope="col">Demand</th><th scope="col">Renewables</th><th scope="col">Battery out</th><th scope="col">Firm</th><th scope="col">Grid to load</th><th scope="col">PPA</th><th scope="col">Grid to battery</th><th scope="col">Unmet</th><th scope="col">Battery in</th><th scope="col">Curtailed</th><th scope="col">Export</th>{hasBess ? <th scope="col">Charge level MWh</th> : null}</tr></thead>
                <tbody>
                  {Array.from({ length: nH }, (_, i) => {
                    const h = off + i;
                    return (
                      <tr key={h}><th scope="row">Day {Math.floor(h / 24) + 1} {pad2(h % 24)}:00</th><td>{sig(hs.net[h], 3)}</td><td>{sig(hs.re[h], 3)}</td><td>{sig(hs.dis[h], 3)}</td><td>{sig(hs.firm[h], 3)}</td><td>{sig(hs.grid[h], 3)}</td><td>{sig(hs.ppa[h], 3)}</td><td>{sig(hs.gridCharge[h], 3)}</td><td>{sig(hs.unmet[h], 3)}</td><td>{sig(hs.ch[h], 3)}</td><td>{sig(hs.curt[h], 3)}</td><td>{sig(hs.exp[h], 3)}</td>{hasBess ? <td>{sig(hs.soc[h], 3)}</td> : null}</tr>
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

      <h3 className="site-h3">Energy balance, year {Y.index + 1}</h3>
      <div className="dv-scroll">
        <table className="sens-table dv-num dv-balance">
          <thead><tr><th scope="col">In</th><th scope="col">MWh</th><th scope="col">Out</th><th scope="col">MWh</th></tr></thead>
          <tbody>
            <tr><th scope="row">On-site renewables{E.solarMWh > 0 || E.windMWh > 0 ? <span className="sens-basis">solar {MWh(E.solarMWh)}, wind {MWh(E.windMWh)}</span> : null}</th><td>{MWh(B.re)}</td>
              <th scope="row">Facility demand (net)<span className="sens-basis">gross {MWh(B.gross)}{B.chpCredit > 1e-6 ? `, less absorption-chiller credit ${MWh(B.chpCredit)}` : ''}{B.flex > 1e-6 ? `, less flexibility ${MWh(B.flex)}` : ''}</span></th><td>{MWh(B.net)}</td></tr>
            <tr><th scope="row">PPA delivered over the grid connection</th><td>{MWh(B.ppa)}</td>
              <th scope="row">Battery charging<span className="sens-basis">{hasBess ? `round-trip and storage losses ${MWh(E.bessLossMWh)}` : 'no battery'}</span></th><td>{MWh(B.ch)}</td></tr>
            <tr><th scope="row">Battery discharge</th><td>{MWh(B.dis)}</td>
              <th scope="row">Curtailment</th><td>{MWh(B.curt)}</td></tr>
            <tr><th scope="row">Firm on-site plant{plantRows.length ? <span className="sens-basis">{plantRows.map((p) => `${p.role === 'bridge' ? 'Bridging' : 'Prime'} ${TECH[p.tech] ? TECH[p.tech].name : p.tech}: ${MWh(p.mwh)}, ${Math.round(p.hours).toLocaleString('en-GB')} h${p.runHoursAboveLimit ? ' (above run-hour limit)' : ''}`).join('; ')}</span> : null}</th><td>{MWh(B.firm)}</td>
              <th scope="row">Export</th><td>{MWh(B.exp)}</td></tr>
            <tr><th scope="row">Grid import to load</th><td>{MWh(B.gridLoad)}</td><td colSpan={2} /></tr>
            <tr><th scope="row">Grid import to battery</th><td>{MWh(B.gridCharge)}</td><td colSpan={2} /></tr>
            <tr><th scope="row">⚠ Unmet load<span className="sens-basis">{B.unmetHours} h, peak {fmtMW(E.unmetPeakMW)}</span></th><td>{MWh(B.unmet)}</td><td colSpan={2} /></tr>
            <tr className="dv-total"><th scope="row">Total in</th><td>{MWh(B.in)}</td><th scope="row">Total out</th><td>{MWh(B.out)}</td></tr>
          </tbody>
        </table>
      </div>
      <ul className="sens-notes">
        <li>Balance: in − out = {B.residual.toExponential(1)} MWh over the year; the largest hourly error is {E.maxBalanceError.toExponential(1)} MWh (engine check: every hour must balance).</li>
        <li>{runDiff == null ? 'The ranking run has no figures for this year.' : runDiff < 1e-6 ? 'These annual figures match the figures the ranking used for this option.' : `These figures differ from the ranking run by up to ${MWh(runDiff)}.`} Re-run in {sig(insp.ms / 1000, 2)} s on this device.</li>
        {I.exceedance ? <li>Grid handling is "Show exceedance": grid import above the offered capacity is allowed and recorded instead of unmet load.</li> : null}
        <li>Profiles are synthetic (seeded, calibrated to indicative annual targets), not measured data. Week 52 runs to the end of the year (8 days).</li>
      </ul>
    </section>
  );
}
