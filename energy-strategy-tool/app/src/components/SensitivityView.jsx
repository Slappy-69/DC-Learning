import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { tornadoSteps, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS, TORNADO_MEASURES, measureById, sortRows } from '../engine/sensitivity.js';
import { normalizeInputs, LABEL } from '../engine/defaults.js';
import { UnverifiedTag } from './Field.jsx';
import { sig, money, perMWh, cur, curUnit } from '../format.js';
import { siteFor } from './SiteView.jsx';
import BreakevenPanel from './BreakevenPanel.jsx';
import UncertaintyPanel from './UncertaintyPanel.jsx';

// Sensitivity tab (BRIEF §13.3 tornado). Port of the other line's SensitivityView (commit f1fd5c5): one option at a
// time (the leader unless another is chosen), run on request, never changing the run, its scores or its ranking.
// Each driver re-runs the option at its low and high value through the full per-option chain (sensitivity.js), one
// re-run per tick so the page stays responsive. The tornado is a keyboard-operable chart (arrow keys read the
// drivers, a polite live region repeats the readout) with the same values in a table.

const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
function useWidth(ref, initial) {
  const [w, setW] = useState(initial || 640);
  useIso(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => setW(Math.max(260, Math.floor(el.clientWidth || initial || 640)));
    set();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

const lcoeText = (x) => (Number.isFinite(x) ? perMWh(x, 3) : 'not finite (no delivered energy)');
// A value of the chosen measure as text (work package 9: LCOE, NPV, carbon or score).
export function measureText(m, x) {
  if (!Number.isFinite(x)) return 'not finite';
  if (m.id === 'lcoe') return perMWh(x, 3);
  if (m.id === 'npv') return money(x, 4);
  if (m.id === 'carbon') return `${sig(x, 3)} g/kWh`;
  return `${sig(x, 4)} points`;
}
const swingText = (m, r) => (r.measureSwing >= 0 ? (m.id === 'npv' ? money(r.measureSwing, 3) : m.id === 'score' ? `${sig(r.measureSwing, 3)} points` : measureText(m, r.measureSwing)) : 'not finite');
function rowReadout(r, i, n, m) {
  return `${i + 1} of ${n}: ${r.label}. Low ${r.low.text}: ${m.label} ${measureText(m, m.get(r.low))}. High ${r.high.text}: ${m.label} ${measureText(m, m.get(r.high))}. Swing ${swingText(m, r)}.`;
}

// Tornado chart: one row per driver, largest swing first; a bar from the score at the low value to the score at the
// high value around the base score (dashed line). Low and high sides differ in lightness and are labelled L and H.
export function TornadoChart({ result, rows: rowsIn = null, measure = 'score', initialWidth = null }) {
  const wrapRef = useRef(null);
  const W = useWidth(wrapRef, initialWidth);
  const [active, setActive] = useState(null);
  const [kbd, setKbd] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const m = measureById(measure);
  const rows = rowsIn || result.rows;
  const val = (s) => m.get(s);
  const scale = m.id === 'npv' ? 1e-6 : 1;
  const narrow = W < 560;
  const labelW = narrow ? 0 : Math.min(Math.round(W * 0.4), Math.round(Math.max(...rows.map((r) => r.label.length)) * 6.6 + 16));
  const rowH = narrow ? 46 : 30;
  const M = { l: 12 + labelW, r: 16, t: 26, b: 30 };
  const plotW = Math.max(80, W - M.l - M.r);
  const H = M.t + rows.length * rowH + M.b;
  const baseV = val(result.base) * scale;
  const vals = [baseV, ...rows.flatMap((r) => [val(r.low) * scale, val(r.high) * scale])].filter(Number.isFinite);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const span0 = hi - lo;
  const pad = Math.max(span0 * 0.12, Math.abs(baseV) * 0.005, 1e-6);
  lo -= pad; hi += pad;
  if (m.id === 'score') { lo = Math.max(0, lo); hi = Math.min(100, hi); if (hi - lo < 1) { lo = Math.max(0, lo - 0.5); hi = Math.min(100, hi + 0.5); } }
  // A non-finite value (no delivered energy) is drawn at the far edge.
  const x = (v) => M.l + ((Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : hi)) - lo) / (hi - lo)) * plotW;
  const ticks = [];
  const raw = (hi - lo) / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * mag).find((k) => k >= raw) || 10 * mag;
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9 * step; t += step) ticks.push(Number(t.toPrecision(10)));
  const axisLabel = m.id === 'score' ? "Weighted score (0–100, base run's axis ranges)" : m.id === 'npv' ? `${m.label} (${cur().trim()} m)` : `${m.label} (${curUnit(m.unit)})`;
  const onKey = (e) => {
    let n = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = active == null ? 0 : Math.min(rows.length - 1, active + 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = active == null ? 0 : Math.max(0, active - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = rows.length - 1;
    else if (e.key === 'Escape') { setActive(null); return; }
    else return;
    e.preventDefault();
    setKbd(true);
    setActive(n);
  };
  const bx = x(baseV);
  return (
    <div className="tor-wrap" ref={wrapRef}>
      <div id="tornado-chart" className="tor" tabIndex={0} role="application"
        aria-label={`Tornado for #${result.optionRank} ${result.optionName}: ${m.label} at the low and high value of ${rows.length} drivers, largest swing first; base ${measureText(m, val(result.base))}. Up and down arrow keys read the drivers, Home and End go to the first and last.`}
        aria-describedby={`${uid}-help`}
        onKeyDown={onKey} onBlur={() => { if (kbd) setActive(null); }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" className="tor-svg">
          {ticks.map((t) => (
            <g key={`t${t}`}>
              <line x1={x(t)} x2={x(t)} y1={M.t - 4} y2={H - M.b + 4} className="tor-grid" />
              <text x={x(t)} y={H - M.b + 18} textAnchor="middle" className="tor-tick">{sig(t, 4)}</text>
            </g>
          ))}
          <text x={M.l} y={14} className="tor-tick">{axisLabel}</text>
          {rows.map((r, i) => {
            const y0 = M.t + i * rowH;
            const barY = narrow ? y0 + 20 : y0 + 7;
            const barH = 14;
            const xl = x(val(r.low) * scale), xh = x(val(r.high) * scale);
            const segs = [['low', xl], ['high', xh]].sort((a, b) => Math.abs(b[1] - bx) - Math.abs(a[1] - bx));
            return (
              <g key={r.id} data-driver={r.id}>
                {active === i ? <rect x={2} y={y0 + 1} width={W - 4} height={rowH - 2} className="tor-active" rx="3" /> : null}
                <text x={narrow ? M.l : M.l - 8} y={narrow ? y0 + 13 : y0 + 18} textAnchor={narrow ? 'start' : 'end'} className="tor-label">{r.label}</text>
                {segs.map(([side, xe]) => (
                  <rect key={side} x={Math.min(bx, xe)} y={barY} width={Math.max(1, Math.abs(xe - bx))} height={barH} className={side === 'low' ? 'tor-low' : 'tor-high'} />
                ))}
                <text x={xl + (xl <= bx ? -4 : 4)} y={barY + 11} textAnchor={xl <= bx ? 'end' : 'start'} className="tor-end">L</text>
                <text x={xh + (xh < bx ? -4 : 4)} y={barY + 11} textAnchor={xh < bx ? 'end' : 'start'} className="tor-end">H</text>
              </g>
            );
          })}
          <line x1={bx} x2={bx} y1={M.t - 6} y2={H - M.b + 2} className="tor-base" />
        </svg>
        {/* The readout sits under the chart (it never covers a bar). */}
        {active != null ? <div className="tor-tip tor-tip-below" aria-hidden="true">{rowReadout(rows[active], active, rows.length, m)}</div> : null}
        <p className="sr-only" aria-live="polite">{kbd && active != null ? rowReadout(rows[active], active, rows.length, m) : ''}</p>
      </div>
      <p id={`${uid}-help`} className="note">Bars run from the {m.label} at the driver's low value (L, lighter) to the {m.label} at its high value (H, darker); the dashed line is the base value. Keyboard: focus the chart, then use the up and down arrow keys. The table below holds the same values.</p>
    </div>
  );
}

export function SensitivityResult({ result, ms = null, chartWidth = null, measure = null }) {
  const check = Math.abs(result.base.score - result.baseRunScore);
  const m = measureById(measure || result.measure);
  // Changing the measure re-sorts the drivers without re-running them.
  const allRows = sortRows(result.allRows, m.id);
  const rows = allRows.slice(0, result.topN);
  return (
    <>
      <p className="sens-base">
        Base for <strong>#{result.optionRank} {result.optionName}</strong>: {m.label} <strong data-base-measure={m.id}>{measureText(m, m.get(result.base))}</strong>; weighted score <strong>{sig(result.base.score, 4)}</strong> / 100
        {check < 1e-9 ? <span className="sens-ok" data-check="match"> · re-run matches the ranking</span> : <span className="flag-text" data-check="differ"> · re-run differs from the ranking by {sig(check, 2)} points</span>}
        {ms != null ? <span className="sub"> · {result.totalDrivers * 2 + 1} re-runs in {sig(ms / 1000, 2)} s on this device</span> : null}
      </p>
      <TornadoChart result={result} rows={rows} measure={m.id} initialWidth={chartWidth} />
      <div className="dv-scroll" role="region" aria-label="Tornado values" tabIndex={0}>
        <table className="mini sens-table dv-num">
          <caption className="sr-only">{m.label} and weighted score of the option at the low and high value of each driver, largest {m.label} swing first</caption>
          <thead><tr><th scope="col">Driver (range record)</th><th scope="col">Low value</th><th scope="col">{m.label}</th><th scope="col">Score</th><th scope="col">High value</th><th scope="col">{m.label}</th><th scope="col">Score</th><th scope="col">Swing ({m.id === 'npv' ? `${cur().trim()} m` : m.id === 'score' ? 'points' : curUnit(m.unit)})</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-driver={r.id}>
                <th scope="row">{r.label}<span className="dv-basis">{r.record} · <UnverifiedTag path={r.record} compact /></span></th>
                <td>{r.low.text}</td><td>{measureText(m, m.get(r.low))}</td><td>{sig(r.low.score, 4)}</td>
                <td>{r.high.text}</td><td>{measureText(m, m.get(r.high))}</td><td>{sig(r.high.score, 4)}</td>
                <td><strong>{swingText(m, r)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="dv-notes">
        <li>Each driver range is a §18 record and is {LABEL}: the input's own low and high for grid price, grid carbon, WACC, evaluation period, escalation and generator test hours, the grid date uncertainty for the grid date, and factor records for the others. {rows.length} of {result.totalDrivers} drivers shown (top {result.topN}, <UnverifiedTag path="sensitivity.topDrivers" compact />).</li>
        <li>Scores use the base run's axis ranges and weights, so the other options and their ranks do not change; a value outside the base range scores at the edge of 0–100.</li>
        <li>Gas price {result.context.gasFromInput ? 'entered' : `country default for ${result.context.country}`}: {sig(result.context.gasCommodity, 3)} €/MWh_th; carbon price {result.context.carbonFromInput ? 'entered' : 'country default'}: {sig(result.context.carbonPrice, 3)} €/tCO₂e. The carbon price moves cost only for options with on-site (Scope 1) combustion.</li>
        <li>Capex scales every capex line and battery capex the battery lines. Grid connection capex scales only the grid connection charge and the cable route, not the substation, which moves with capex. Capacity factors scale on-site solar and wind output; PUE scales the cooling energy and the design-day cooling load. Not in this tornado yet: PPA price, the capex of each technology on its own and lead times; scenarios. Breakevens and the Monte Carlo are below.</li>
      </ul>
    </>
  );
}

// Results by run, option, weights and ticked drivers (a weight change changes the scores, so it is part of the key);
// small LRU.
const sensCache = new Map();
// The ticked drivers and the measure stay while the app is open (work package 9).
const sensChoice = { drivers: null, measure: null };
const DEFAULT_MEASURE = 'lcoe';
// The last finished tornado, for the PDF report (work package 10): { result, inputHash, measure }.
let latest = null;
export function latestSensitivity(run) {
  if (!latest || !run || latest.inputHash !== (run.inputHash || '') || !run.options.some((o) => o.id === latest.result.optionId)) return null;
  return { result: latest.result, measure: sensChoice.measure || DEFAULT_MEASURE };
}

export default function SensitivityView({ run, optionId = null, setOptionId = () => {}, onResult = null }) {
  const ranked = useMemo(() => run.options.slice().sort((a, b) => a.rank - b.rank), [run.options]);
  const option = (optionId != null && run.options.find((o) => o.id === optionId)) || ranked[0] || null;
  const [ticked, setTicked] = useState(() => sensChoice.drivers || DEFAULT_DRIVER_IDS.slice());
  const [measure, setMeasure] = useState(() => sensChoice.measure || DEFAULT_MEASURE);
  const drivers = useMemo(() => TORNADO_DRIVERS.filter((d) => ticked.includes(d.id)), [ticked]);
  const key = option ? `${run.inputHash || ''}|${option.id}|${JSON.stringify(run.scoring.weights)}|${run.inputs.settings.costMetric}|${run.inputs.settings.carbonMetric}|${drivers.map((d) => d.id).join(',')}` : null;
  const toggleDriver = (id) => setTicked((t) => { const n = t.includes(id) ? t.filter((x) => x !== id) : [...t, id]; sensChoice.drivers = n; return n; });
  const pickMeasure = (v) => { sensChoice.measure = v; setMeasure(v); };
  const [state, setState] = useState(() => ({ key, ...(sensCache.get(key) || {}) }));
  const timer = useRef(null);
  const optionList = useMemo(() => ranked.map((o) => <option key={o.id} value={o.id}>#{o.rank} {o.name}</option>), [ranked]);

  useEffect(() => {
    // A new run, option or weighting: stop a re-run in progress and show the cached result for the new key, if any.
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (state.key !== key) setState({ key, ...(sensCache.get(key) || {}) });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const start = () => {
    if (!option || state.busy || !drivers.length) return;
    const nIn = normalizeInputs(run.inputs);
    let it;
    try {
      it = tornadoSteps(run, option.id, { site: siteFor(nIn), drivers, measure });
    } catch (e) { setState({ key, error: String(e && e.message ? e.message : e) }); return; }
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    setState({ key, busy: true, progress: { done: 0, total: 1 + 2 * drivers.length, label: 'starting' } });
    // One re-run per tick: each takes a fraction of a second, and the page stays responsive in between.
    const tick = () => {
      try {
        const r = it.next();
        if (r.done) {
          const v = { result: r.value, ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 };
          sensCache.set(key, v);
          latest = { result: r.value, inputHash: run.inputHash || '' };
          while (sensCache.size > 6) sensCache.delete(sensCache.keys().next().value);
          setState({ key, ...v });
          timer.current = null;
          return;
        }
        setState((s) => (s.key === key ? { ...s, progress: r.value } : s));
        timer.current = setTimeout(tick, 0);
      } catch (e) {
        setState({ key, error: String(e && e.message ? e.message : e) });
        timer.current = null;
      }
    };
    timer.current = setTimeout(tick, 0);
  };

  if (!option) return <section className="sens"><h2>Sensitivity</h2><p className="empty">No options to test.</p></section>;
  const mine = state.key === key;
  const busy = mine && state.busy;
  const p = mine ? state.progress : null;
  return (
    <section className="sens" aria-labelledby="sens-h">
      <div className="site-head">
        <h2 id="sens-h">Sensitivity (tornado)</h2>
        <label className="small site-pick">Option tested{' '}
          <select id="sens-option" value={option.id} disabled={busy} onChange={(e) => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } setOptionId(e.target.value); }} title={`#${option.rank} ${option.name}`}>
            {optionList}
          </select>
        </label>
      </div>
      <p className="dv-intro">How one option's result moves when one input is set to its low and then its high value, with everything else held (§13.3). The option is re-run with the engine the ranking uses, including the site layout; the other options and their ranks are not changed.</p>
      <fieldset className="sens-drivers" disabled={busy}>
        <legend>Drivers tested ({drivers.length} of {TORNADO_DRIVERS.length})</legend>
        <div className="sens-driver-list">
          {TORNADO_DRIVERS.map((d) => (
            <label key={d.id} className="small sens-driver">
              <input type="checkbox" data-driver-tick={d.id} checked={ticked.includes(d.id)} onChange={() => toggleDriver(d.id)} /> {d.label}
            </label>
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="chip-btn" onClick={() => { const n = DEFAULT_DRIVER_IDS.slice(); sensChoice.drivers = n; setTicked(n); }}>Default seven</button>
          <button type="button" className="chip-btn" onClick={() => { const n = TORNADO_DRIVERS.map((d) => d.id); sensChoice.drivers = n; setTicked(n); }}>Tick all</button>
        </div>
      </fieldset>
      <label className="small site-pick">Result measured{' '}
        <select id="sens-measure" value={measure} onChange={(e) => pickMeasure(e.target.value)}>
          {TORNADO_MEASURES.map((mm) => <option key={mm.id} value={mm.id}>{mm.label}</option>)}
        </select>
      </label>
      <div className="btn-row">
        <button type="button" className="chip-btn sens-run" onClick={start} disabled={busy || !drivers.length}>{busy ? 'Running…' : mine && state.result ? 'Run again' : 'Run sensitivity'}</button>
      </div>
      <p className="dv-note" role="status" aria-live="polite">
        {busy && p ? `Re-running ${p.done} of ${p.total}: ${p.label}.`
          : mine && state.error ? `Could not run: ${state.error}`
            : mine && state.result ? `Done: ${state.result.totalDrivers} drivers, each at its low and high value.`
              : !drivers.length ? 'Tick at least one driver.'
                : `Run the test for #${option.rank}. Each of the ${drivers.length} ticked drivers is re-run twice (${1 + 2 * drivers.length} re-runs, a few seconds).`}
      </p>
      {mine && state.result ? <SensitivityResult result={state.result} ms={state.ms} measure={measure} /> : null}
      <BreakevenPanel run={run} onResult={onResult} />
      <UncertaintyPanel run={run} onResult={onResult} />
    </section>
  );
}
