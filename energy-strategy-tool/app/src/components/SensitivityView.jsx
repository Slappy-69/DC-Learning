import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { tornadoSteps, TORNADO_DRIVERS } from '../engine/sensitivity.js';
import { normalizeInputs, LABEL } from '../engine/defaults.js';
import { UnverifiedTag } from './Field.jsx';
import { sig } from '../format.js';
import { siteFor } from './SiteView.jsx';

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

const lcoeText = (x) => (Number.isFinite(x) ? `€${sig(x, 3)}/MWh` : 'not finite (no delivered energy)');
function rowReadout(r, i, n) {
  return `${i + 1} of ${n}: ${r.label}. Low ${r.low.text}: score ${sig(r.low.score, 4)}, LCOE ${lcoeText(r.low.lcoe)}. High ${r.high.text}: score ${sig(r.high.score, 4)}, LCOE ${lcoeText(r.high.lcoe)}. Swing ${sig(r.swing, 3)} points.`;
}

// Tornado chart: one row per driver, largest swing first; a bar from the score at the low value to the score at the
// high value around the base score (dashed line). Low and high sides differ in lightness and are labelled L and H.
export function TornadoChart({ result, initialWidth = null }) {
  const wrapRef = useRef(null);
  const W = useWidth(wrapRef, initialWidth);
  const [active, setActive] = useState(null);
  const [kbd, setKbd] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rows = result.rows;
  const narrow = W < 560;
  const labelW = narrow ? 0 : Math.min(Math.round(W * 0.4), Math.round(Math.max(...rows.map((r) => r.label.length)) * 6.6 + 16));
  const rowH = narrow ? 46 : 30;
  const M = { l: 12 + labelW, r: 16, t: 26, b: 30 };
  const plotW = Math.max(80, W - M.l - M.r);
  const H = M.t + rows.length * rowH + M.b;
  const vals = [result.base.score, ...rows.flatMap((r) => [r.low.score, r.high.score])];
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(0.5, (hi - lo) * 0.12);
  lo = Math.max(0, lo - pad); hi = Math.min(100, hi + pad);
  if (hi - lo < 1) { lo = Math.max(0, lo - 0.5); hi = Math.min(100, hi + 0.5); }
  const x = (v) => M.l + ((v - lo) / (hi - lo)) * plotW;
  const ticks = [];
  const step = (hi - lo) > 20 ? 10 : (hi - lo) > 8 ? 2 : (hi - lo) > 4 ? 1 : 0.5;
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) ticks.push(Number(t.toFixed(2)));
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
  const bx = x(result.base.score);
  return (
    <div className="tor-wrap" ref={wrapRef}>
      <div id="tornado-chart" className="tor" tabIndex={0} role="application"
        aria-label={`Tornado for #${result.optionRank} ${result.optionName}: weighted score at the low and high value of ${rows.length} drivers, largest swing first; base score ${sig(result.base.score, 4)}. Up and down arrow keys read the drivers, Home and End go to the first and last.`}
        aria-describedby={`${uid}-help`}
        onKeyDown={onKey} onBlur={() => { if (kbd) setActive(null); }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" className="tor-svg">
          {ticks.map((t) => (
            <g key={`t${t}`}>
              <line x1={x(t)} x2={x(t)} y1={M.t - 4} y2={H - M.b + 4} className="tor-grid" />
              <text x={x(t)} y={H - M.b + 18} textAnchor="middle" className="tor-tick">{sig(t, 3)}</text>
            </g>
          ))}
          <text x={M.l} y={14} className="tor-tick">Weighted score (0–100, base run's axis ranges)</text>
          {rows.map((r, i) => {
            const y0 = M.t + i * rowH;
            const barY = narrow ? y0 + 20 : y0 + 7;
            const barH = 14;
            const xl = x(r.low.score), xh = x(r.high.score);
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
        {active != null ? <div className="tor-tip tor-tip-below" aria-hidden="true">{rowReadout(rows[active], active, rows.length)}</div> : null}
        <p className="sr-only" aria-live="polite">{kbd && active != null ? rowReadout(rows[active], active, rows.length) : ''}</p>
      </div>
      <p id={`${uid}-help`} className="note">Bars run from the score at the driver's low value (L, lighter) to the score at its high value (H, darker); the dashed line is the base score. Keyboard: focus the chart, then use the up and down arrow keys. The table below holds the same values.</p>
    </div>
  );
}

export function SensitivityResult({ result, ms = null, chartWidth = null }) {
  const check = Math.abs(result.base.score - result.baseRunScore);
  return (
    <>
      <p className="sens-base">
        Base weighted score for <strong>#{result.optionRank} {result.optionName}</strong>: <strong>{sig(result.base.score, 4)}</strong> / 100
        {check < 1e-9 ? <span className="sens-ok" data-check="match"> · re-run matches the ranking</span> : <span className="flag-text" data-check="differ"> · re-run differs from the ranking by {sig(check, 2)} points</span>}
        {ms != null ? <span className="sub"> · {result.totalDrivers * 2 + 1} re-runs in {sig(ms / 1000, 2)} s on this device</span> : null}
      </p>
      <TornadoChart result={result} initialWidth={chartWidth} />
      <div className="dv-scroll" role="region" aria-label="Tornado values" tabIndex={0}>
        <table className="mini sens-table dv-num">
          <caption className="sr-only">Weighted score and LCOE of the option at the low and high value of each driver, largest swing first</caption>
          <thead><tr><th scope="col">Driver (range record)</th><th scope="col">Low value</th><th scope="col">Score</th><th scope="col">LCOE</th><th scope="col">High value</th><th scope="col">Score</th><th scope="col">LCOE</th><th scope="col">Swing (points)</th></tr></thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.id} data-driver={r.id}>
                <th scope="row">{r.label}<span className="dv-basis">{r.record} · <UnverifiedTag path={r.record} compact /></span></th>
                <td>{r.low.text}</td><td>{sig(r.low.score, 4)}</td><td>{lcoeText(r.low.lcoe)}</td>
                <td>{r.high.text}</td><td>{sig(r.high.score, 4)}</td><td>{lcoeText(r.high.lcoe)}</td>
                <td><strong>{sig(r.swing, 3)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="dv-notes">
        <li>Each driver range is a §18 record and is {LABEL}: the input's own low and high for grid price, grid carbon and WACC, the grid date uncertainty for the grid date, and sensitivity records for gas price, carbon price and IT load. {result.shown} of {result.totalDrivers} drivers shown (top {result.topN}, <UnverifiedTag path="sensitivity.topDrivers" compact />).</li>
        <li>Scores use the base run's axis ranges and weights, so the other options and their ranks do not change; a value outside the base range scores at the edge of 0–100.</li>
        <li>Gas price {result.context.gasFromInput ? 'entered' : `country default for ${result.context.country}`}: {sig(result.context.gasCommodity, 3)} €/MWh_th; carbon price {result.context.carbonFromInput ? 'entered' : 'country default'}: {sig(result.context.carbonPrice, 3)} €/tCO₂e. The carbon price moves cost only for options with on-site (Scope 1) combustion.</li>
        <li>Not in this tornado yet (§13.3): PUE parameters, capex of each technology, solar yield, PPA price, BESS cost and lead times; breakevens, Monte Carlo and scenarios.</li>
      </ul>
    </>
  );
}

// Results by run, option and weights (a weight change changes the scores, so it is part of the key); small LRU.
const sensCache = new Map();

export default function SensitivityView({ run, optionId = null, setOptionId = () => {} }) {
  const ranked = useMemo(() => run.options.slice().sort((a, b) => a.rank - b.rank), [run.options]);
  const option = (optionId != null && run.options.find((o) => o.id === optionId)) || ranked[0] || null;
  const key = option ? `${run.inputHash || ''}|${option.id}|${JSON.stringify(run.scoring.weights)}|${run.inputs.settings.costMetric}|${run.inputs.settings.carbonMetric}` : null;
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
    if (!option || state.busy) return;
    const nIn = normalizeInputs(run.inputs);
    let it;
    try {
      it = tornadoSteps(run, option.id, { site: siteFor(nIn) });
    } catch (e) { setState({ key, error: String(e && e.message ? e.message : e) }); return; }
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    setState({ key, busy: true, progress: { done: 0, total: 1 + 2 * TORNADO_DRIVERS.length, label: 'starting' } });
    // One re-run per tick: each takes a fraction of a second, and the page stays responsive in between.
    const tick = () => {
      try {
        const r = it.next();
        if (r.done) {
          const v = { result: r.value, ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 };
          sensCache.set(key, v);
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
      <p className="dv-intro">How one option's weighted score and LCOE move when one input is set to its low and then its high value, with everything else held (§13.3). The option is re-run with the engine the ranking uses, including the site layout; the other options and their ranks are not changed.</p>
      <div className="btn-row">
        <button type="button" className="chip-btn sens-run" onClick={start} disabled={busy}>{busy ? 'Running…' : mine && state.result ? 'Run again' : 'Run sensitivity'}</button>
      </div>
      <p className="dv-note" role="status" aria-live="polite">
        {busy && p ? `Re-running ${p.done} of ${p.total}: ${p.label}.`
          : mine && state.error ? `Could not run: ${state.error}`
            : mine && state.result ? `Done: ${state.result.totalDrivers} drivers, each at its low and high value.`
              : `Run the test for #${option.rank}. Each of the ${TORNADO_DRIVERS.length} drivers is re-run twice (${1 + 2 * TORNADO_DRIVERS.length} re-runs, a few seconds).`}
      </p>
      {mine && state.result ? <SensitivityResult result={state.result} ms={state.ms} /> : null}
    </section>
  );
}
