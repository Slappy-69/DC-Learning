import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InputsPanel from './components/InputsPanel.jsx';
import RankedList from './components/RankedList.jsx';
import RunSummary from './components/RunSummary.jsx';
import RunProgress from './components/RunProgress.jsx';
import ParetoView from './components/ParetoView.jsx';
import SensitivityView from './components/SensitivityView.jsx';
import { useCompute } from './useCompute.js';
import { referenceT1, buildDefaultInputs, normalizeInputs, getRegistry, LABEL, COUNTRIES } from './engine/index.js';
import { scoreOptions, DEFAULT_VIEW, effectiveWeights } from './engine/scoring.js';
import { GUARDRAIL, sig } from './format.js';

// Inputs that only affect scoring/ranking: changing them re-scores without re-running dispatch (§4).
const SCORE_ONLY = new Set(['weights', 'settings.costMetric', 'settings.carbonMetric', 'settings.rankCompliantFirst', 'settings.absoluteScaling']);
function isScoreOnly(path) {
  return SCORE_ONLY.has(path) || SCORE_ONLY.has(path.split('.')[0]);
}

function setIn(obj, path, val) {
  const keys = path.split('.');
  const out = { ...obj };
  let cur = out;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = Array.isArray(cur[keys[i]]) ? cur[keys[i]].slice() : { ...cur[keys[i]] };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = val;
  return out;
}

function computeKeyOf(inputs) {
  const { weights, ...rest } = inputs;
  const s = { ...rest.settings };
  delete s.costMetric; delete s.carbonMetric; delete s.rankCompliantFirst; delete s.absoluteScaling; delete s.hideDominated;
  return JSON.stringify({ ...rest, settings: s });
}

export default function App() {
  const [inputs, setInputs] = useState(() => referenceT1());
  const [view, setView] = useState({ ...DEFAULT_VIEW });
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [progressOpen, setProgressOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [tab, setTab] = useState('options'); // results view tabs (§16): Options, Trade-offs
  const computeKey = useMemo(() => computeKeyOf(inputs), [inputs]);
  const compute = useCompute(inputs, computeKey);
  const prevLeader = useRef(null);
  const prevRunRules = useRef(null);

  const update = useCallback((path, val) => setInputs((cur) => setIn(cur, path, val)), []);
  const setWeights = useCallback((w) => setInputs((cur) => ({ ...cur, weights: { ...w } })), []);

  // Re-score the latest run with the current weights and scoring settings (no dispatch).
  const run = useMemo(() => {
    if (!compute.run) return null;
    const r = { ...compute.run, options: compute.run.options.map((o) => ({ ...o })) };
    r.scoring = scoreOptions(r.options, normalizeInputs(inputs));
    r.inputs = { ...r.inputs, weights: inputs.weights, settings: { ...r.inputs.settings, costMetric: inputs.settings.costMetric, carbonMetric: inputs.settings.carbonMetric, rankCompliantFirst: inputs.settings.rankCompliantFirst } };
    return r;
  }, [compute.run, inputs.weights, inputs.settings.costMetric, inputs.settings.carbonMetric, inputs.settings.rankCompliantFirst]); // eslint-disable-line react-hooks/exhaustive-deps

  const leader = useMemo(() => (run ? run.options.reduce((a, b) => (a.rank < b.rank ? a : b)) : null), [run]);

  useEffect(() => {
    if (!leader) return;
    const msg = prevLeader.current && prevLeader.current !== leader.id ? `Options updated. New leader: ${leader.name}.` : 'Options updated. Leader unchanged.';
    prevLeader.current = leader.id;
    setAnnounce(msg);
  }, [leader]);

  // Expand the run summary when any entry is new since the last run (§12).
  useEffect(() => {
    if (!compute.run) return;
    const sig2 = JSON.stringify([compute.run.rules.map((r) => r.removed), compute.run.generation.valuesNotGenerated.map((v) => v.id + v.omitted.length), compute.run.generation.sampled]);
    if (prevRunRules.current !== null && prevRunRules.current !== sig2) setSummaryOpen(true);
    prevRunRules.current = sig2;
  }, [compute.run]);

  const onInclude = (id, values) => {
    setInputs((cur) => {
      const n = normalizeInputs(cur);
      const st = n.choices[id];
      const vals = [...new Set([...(st.state === 'locked' ? st.values.slice(0, 1) : st.values), ...values])];
      return setIn(cur, `choices.${id}`, { state: 'open', values: vals });
    });
  };

  const unverifiedCount = useMemo(() => {
    const reg = getRegistry();
    return Object.keys(reg).length;
  }, []);
  const { w } = effectiveWeights(inputs.weights);
  const start = run ? run.meta.analysisStart : inputs.project.analysisStart;
  const viewFilterCount = (view.resilience.length ? 1 : 0) + (view.hideFlagIds.length ? 1 : 0) + (view.archetypesOnly ? 1 : 0) + (view.search ? 1 : 0);
  const dominated = run ? run.options.filter((o) => o.dominatedBy).length : 0;
  const shown = run ? (() => { let n = run.options.length; return n; })() : 0;

  return (
    <div className="app">
      <a className="skip" href="#results">Skip to results</a>
      <header className="topbar">
        <div className="brand">
          <h1>Concept energy optioneering</h1>
          <span className="sub">Data centre campus · core slice + trade-off view</span>
        </div>
        <div className="topbar-actions">
          <button type="button" className="chip-btn panel-toggle" aria-expanded={panelOpen} aria-controls="inputs-panel" onClick={() => setPanelOpen(!panelOpen)}>{panelOpen ? 'Close inputs' : 'Inputs'}</button>
          <button type="button" className="chip-btn" onClick={() => setInputs(referenceT1())}>Load T1 example</button>
          <button type="button" className="chip-btn" onClick={() => setInputs(buildDefaultInputs())}>Reset to defaults</button>
        </div>
      </header>

      <div className="layout">
        <aside id="inputs-panel" className={`panel ${panelOpen ? 'open' : ''}`} aria-label="Inputs">
          <InputsPanel inputs={inputs} update={update} setWeights={setWeights} />
        </aside>

        <main id="results" className="main" tabIndex={-1}>
          <div className="header-strip" role="region" aria-label="Results header">
            <div className="hs-item"><span className="hs-k">Options</span><span className="hs-v">{run ? `${shown.toLocaleString('en-GB')} screened / ${run.generation.totalCombinations.toLocaleString('en-GB')} combinations · ${dominated.toLocaleString('en-GB')} dominated` : '—'}</span></div>
            <div className="hs-item"><span className="hs-k">Leader</span><span className="hs-v">{leader ? <>{leader.name} <strong>{leader.score.toFixed(1)}</strong></> : '—'}</span><span className="hs-sub">Rank probability not available in this slice (no Monte Carlo)</span></div>
            <div className="hs-item"><span className="hs-k">Model</span><span className="hs-v">Full-year hourly (8760 h)</span><span className="hs-sub">Synthetic profiles · {run ? COUNTRIES[run.country].name : ''}</span></div>
            <div className="hs-item"><span className="hs-k">Settings</span><span className="hs-v">
              Sample above cap: {inputs.settings.sampleAboveCap ? 'On' : 'Off'} · Hide dominated: {view.hideDominated ? 'On' : 'Off'} · View filters: {viewFilterCount}
              {inputs.settings.gridHandling === 'exceedance' ? <> · <strong className="warn-text">Grid capacity: exceedance mode</strong></> : null}
              {inputs.settings.rankCompliantFirst ? <> · <strong>Requirement-compliant options ranked first</strong></> : null}
            </span></div>
            <div className="hs-item"><span className="hs-k">Weights</span><span className="hs-v">Cost {(w.cost * 100).toFixed(0)} · Carbon {(w.carbon * 100).toFixed(0)} · TTP {(w.ttp * 100).toFixed(0)} · Deliv. {(w.deliverability * 100).toFixed(0)} %</span></div>
            <div className="hs-item"><span className="hs-k">Unverified defaults</span><span className="hs-v">All {unverifiedCount} default records are <span className="tag tag-unverified">{LABEL}</span></span></div>
          </div>

          <div className="status" role="status" aria-live="polite">
            {compute.notice ? <span className="flag-text">{compute.notice} </span> : null}
            {compute.status === 'running' ? (
              // Visual only: the run progress panel's live region announces stage changes (not every event).
              <span className="running" aria-hidden="true"><span className="spinner" /> Screening options: {compute.progress && compute.progress.current ? `${compute.progress.current.label} · ${Math.round(compute.progress.current.pct * 100)} %` : 'starting'}</span>
            ) : compute.status === 'error' ? (
              <span className="flag-text">Run failed: {compute.error}</span>
            ) : compute.status === 'done' ? (
              <span>{announce} Last run {sig(compute.ms / 1000, 2)} s on {compute.mode}.</span>
            ) : null}
          </div>

          <RunProgress compute={compute} open={progressOpen} onToggle={setProgressOpen} />

          {run ? (
            <>
              <RunSummary run={run} open={summaryOpen} onToggle={setSummaryOpen} onInclude={onInclude} onSamplingOff={() => update('settings.sampleAboveCap', false)} />
              {run.runFlags.length ? (
                <ul className="run-flags">{run.runFlags.map((f) => <li key={f.id} className={`sev-${f.severity}`}><span className="sev">{f.severity}</span> <span className="cat">{f.category}</span> {f.message}</li>)}</ul>
              ) : null}
              <div className="tabs" role="tablist" aria-label="Results views">
                {[['options', 'Options'], ['tradeoffs', 'Trade-offs'], ['sensitivity', 'Sensitivity']].map(([id, label]) => (
                  <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1}
                    className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}
                    onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const ids = ['options', 'tradeoffs', 'sensitivity']; const i = ids.indexOf(tab); const n = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]; setTab(n); setTimeout(() => document.getElementById(`tab-${n}`)?.focus(), 0); } }}>{label}</button>
                ))}
              </div>
              <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                {tab === 'options' ? <RankedList run={run} view={view} setView={setView} start={start} /> : tab === 'tradeoffs' ? <ParetoView run={run} view={view} setView={setView} start={start} /> : <SensitivityView run={run} />}
              </div>
            </>
          ) : compute.status !== 'error' ? (
            <p className="empty">Options appear here once the required inputs are set: location, site area, IT load, grid capacity now and at full connection, and the full-connection date.</p>
          ) : null}
        </main>
      </div>

      <footer className="footer">
        <p>{GUARDRAIL}</p>
        <p className="sub">Not in this slice: parallel coordinates, choice-impact and radar charts, sensitivity, scenarios, site layout and fit status, exports, Monte Carlo ranges, representative-day screening tier. Profiles are synthetic and seeded; every default is indicative — unverified.</p>
      </footer>
    </div>
  );
}
