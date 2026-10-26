/* global __HOSTED__ */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InputsPanel from './components/InputsPanel.jsx';
import RankedList from './components/RankedList.jsx';
import RunSummary from './components/RunSummary.jsx';
import RunProgress from './components/RunProgress.jsx';
import ParetoView from './components/ParetoView.jsx';
import SiteView from './components/SiteView.jsx';
import DispatchView from './components/DispatchView.jsx';
import CompareView from './components/CompareView.jsx';
import SensitivityView, { latestSensitivity } from './components/SensitivityView.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import { latestBreakevens } from './components/BreakevenPanel.jsx';
import { latestMonteCarlo } from './components/UncertaintyPanel.jsx';
import { buildReport, reportFileName } from './report/report.js';
import { saveBytes } from './saveFile.js';
import { useCompute } from './useCompute.js';
import { referenceT1, buildDefaultInputs, normalizeInputs, getRegistry, LABEL, COUNTRIES, weightedPick, defaultView, activeFilterCount, studyFile, studyFileName, readStudyFile, compareWithSaved, hashInputs } from './engine/index.js';
import { viewSetting, withoutSiteFilters } from './engine/view.js';
import { UnverifiedTag } from './components/Field.jsx';
import { scoreOptions, effectiveWeights, applyView } from './engine/scoring.js';
import { describeWeightChange } from './engine/cards.js';
import { GUARDRAIL, sig, setDisplayCurrency } from './format.js';
import { displayCurrencyCode, FX } from './engine/index.js';

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
  // The display currency (work package 1) converts the figures shown; it never needs a re-run.
  const p = { ...rest.project };
  delete p.currency;
  return JSON.stringify({ ...rest, project: p, settings: s });
}

// Media query state (phone layout, §16 "Phone (360–767 px)"). Re-renders when the viewport crosses the query.
function useMediaQuery(q) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener(on); };
  }, [q]);
  return m;
}

export default function App() {
  const [inputs, setInputs] = useState(() => referenceT1());
  const [view, setView] = useState(() => defaultView()); // registry defaults: no filter, hide dominated off
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [progressOpen, setProgressOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  // Compare (work package 7): up to three option ids; the oldest drops out when a fourth is added.
  const [compareIds, setCompareIds] = useState([]);
  const toggleCompare = (id) => setCompareIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3)));
  const [tab, setTab] = useState('options'); // results view tabs (§16): Options, Trade-offs, Site
  const [siteOptionId, setSiteOptionId] = useState(null); // option shown on the Site tab (null = the leader)
  const [dispatchOptionId, setDispatchOptionId] = useState(null); // option shown on the Dispatch tab (null = the leader)
  const [sensOptionId, setSensOptionId] = useState(null); // option tested on the Sensitivity tab (null = the leader)
  // Plain-English summary (work package 16, BRIEF §14): the engineer's edit, kept as a note marked "edited" (saved in the
  // study file, printed in the PDF), and whether the summary is shown on the Options tab.
  const [summaryNote, setSummaryNote] = useState(null);
  const [summaryShown, setSummaryShown] = useState(true);
  // Bumped when the breakevens or the Monte Carlo finish, so the header and the summary read the new result.
  const [, setExtras] = useState(0);
  const [focusChart, setFocusChart] = useState(false); // "Skip to trade-offs chart" request
  const [focusPlan, setFocusPlan] = useState(false); // "Skip to site plan" request
  // General settings (§12.12): the Site tab (Beta) switch, off by default (walkthrough, 2026-10-21). A view setting:
  // it changes what is shown, never a score, a rank or a run (AC 27).
  const [siteBeta, setSiteBetaState] = useState(() => viewSetting('siteTabBeta') === true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Phone width (review O1): once a run has finished, the run progress panel, its event log and the run summary
  // fold into one "Run details" disclosure (closed by default, one tap away) so the results come first; while a
  // run is in progress the progress panel stays visible.
  const narrow = useMediaQuery('(max-width: 767px)');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const computeKey = useMemo(() => computeKeyOf(inputs), [inputs]);
  // Display currency for every figure on screen and in the PDF (work package 1); set before the children render.
  const curCode = displayCurrencyCode(inputs);
  setDisplayCurrency(curCode, FX[curCode]);
  const compute = useCompute(inputs, computeKey);
  const prevLeader = useRef(null);
  const prevRunRules = useRef(null);

  const update = useCallback((path, val) => setInputs((cur) => setIn(cur, path, val)), []);
  // Turning the Site tab off removes every site-fit part of the main flow: the tab, site-fit view filters and the
  // optional site-fit penalty (which belongs to the Beta settings only, BRIEF §9.9).
  const setSiteBeta = (on) => {
    setSiteBetaState(on);
    if (!on) {
      setTab((t) => (t === 'site' ? 'options' : t));
      setView((v) => withoutSiteFilters(v));
      if (inputs.deliverability.siteFitPenalty) update('deliverability.siteFitPenalty', false);
    }
  };
  const setWeights = useCallback((w) => setInputs((cur) => ({ ...cur, weights: { ...w } })), []);

  // Re-score the latest run with the current weights and scoring settings (no dispatch).
  const run = useMemo(() => {
    if (!compute.run) return null;
    const r = { ...compute.run, options: compute.run.options.map((o) => ({ ...o })) };
    r.scoring = scoreOptions(r.options, normalizeInputs(inputs));
    r.inputs = { ...r.inputs, weights: inputs.weights, settings: { ...r.inputs.settings, costMetric: inputs.settings.costMetric, carbonMetric: inputs.settings.carbonMetric, rankCompliantFirst: inputs.settings.rankCompliantFirst } };
    return r;
  }, [compute.run, inputs.weights, inputs.settings.costMetric, inputs.settings.carbonMetric, inputs.settings.rankCompliantFirst]); // eslint-disable-line react-hooks/exhaustive-deps

  // The leader is the weighted pick (rank 1): the same function the Trade-offs view uses, so the header,
  // the live region and the highlighted pick always name the same option (AC5).
  const leader = useMemo(() => (run ? weightedPick(run.options) : null), [run]);
  // PDF report (work package 10): made on this computer from the run on screen; never in the hosted page.
  const [pdfMsg, setPdfMsg] = useState('');
  // Study files (work package 15, OPEN-QUESTIONS 27): save the inputs (and a record of the result); open one, re-run it and
  // say whether the result matches the record.
  const [studyMsg, setStudyMsg] = useState('');
  const [openedStudy, setOpenedStudy] = useState(null);
  const studyInput = useRef(null);
  const saveStudy = () => {
    if (__HOSTED__) return;
    try {
      const hash = hashInputs(normalizeInputs(inputs));
      const f = studyFile(inputs, compute.run && compute.run.inputHash === hash ? compute.run : null, { note: summaryNote });
      saveBytes(studyFileName(inputs), JSON.stringify(f, null, 1), 'application/json');
      setStudyMsg(`Study saved: ${f.name}${f.result ? `, with the result of the last run (leader ${f.result.leader.name})` : ' (inputs only: run it before saving to keep a record of the result)'}.`);
    } catch (e) { setStudyMsg(`Could not save the study: ${e && e.message ? e.message : e}`); }
  };
  const openStudy = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const r = readStudyFile(await file.text());
      if (!r.ok) { setStudyMsg(`Could not open ${file.name}: ${r.error}`); return; }
      setInputs(r.inputs);
      setSummaryNote(r.notes && r.notes.summary ? r.notes.summary : null);
      setOpenedStudy({ file: r.file, hash: hashInputs(normalizeInputs(r.inputs)) });
      setStudyMsg(`Opened "${r.file.name}" (saved ${String(r.file.savedAt || '').slice(0, 10)}). ${r.warnings.join(' ')} Running it…`.replace(/\s+/g, ' '));
    } catch (err) { setStudyMsg(`Could not open ${file.name}: ${err && err.message ? err.message : err}`); }
  };
  useEffect(() => {
    if (!openedStudy || compute.status !== 'done' || !compute.run || compute.run.inputHash !== openedStudy.hash) return;
    const c = compareWithSaved(openedStudy.file, compute.run);
    setStudyMsg(`Opened "${openedStudy.file.name}". ${c ? c.message : 'The file holds no saved result to compare with.'}`);
    setOpenedStudy(null);
  }, [compute.status, compute.run, openedStudy]);
  useEffect(() => { setPdfMsg(''); }, [run]);
  const savePdf = () => {
    if (__HOSTED__ || !run) return;
    try {
      const sens = latestSensitivity(run);
      const created = new Date();
      const r = buildReport(run, { compareIds, sensitivity: sens ? sens.result : null, sensitivityMeasure: sens ? sens.measure : null, created, summaryNote, breakevens: latestBreakevens(run), monteCarlo: latestMonteCarlo(run) });
      saveBytes(reportFileName(run, created), r.bytes, 'application/pdf');
      setPdfMsg(`PDF report made: ${r.pages} pages${compareIds.length ? `, ${compareIds.length} compared option${compareIds.length === 1 ? '' : 's'}` : ''}${sens ? ', with the sensitivity test' : ', without a sensitivity test (run one in the Sensitivity tab to include it)'}${latestBreakevens(run) ? ', the breakevens' : ''}${latestMonteCarlo(run) ? ', the Monte Carlo' : ''}.`);
    } catch (e) { setPdfMsg(`Could not make the PDF report: ${e && e.message ? e.message : e}`); }
  };

  useEffect(() => {
    if (!leader) return;
    // The option id is the hash of its choices; its name carries sizes (e.g. PV MWp), which a site
    // edit can change while the choices, and so the leader, stay the same (review, H3 F3).
    const prev = prevLeader.current;
    // A weight change on the same run is described live (BRIEF §11; walkthrough 2026-10-21; work package 6).
    const wNow = effectiveWeights(inputs.weights).w;
    const sameRun = prev && prev.run === compute.run;
    const wDesc = sameRun && prev.w ? describeWeightChange(prev.w, wNow, prev, leader, run.options) : null;
    const msg = wDesc ? wDesc
      : prev && prev.id !== leader.id ? `Options updated. New leader: ${leader.name}.`
        : prev && prev.name !== leader.name ? `Options updated. Leader unchanged (same choices, re-sized): ${leader.name}.`
          : 'Options updated. Leader unchanged.';
    prevLeader.current = { id: leader.id, name: leader.name, score: leader.score, run: compute.run, w: wNow };
    setAnnounce(msg);
  }, [leader, inputs.weights]); // eslint-disable-line react-hooks/exhaustive-deps

  // The selected tab is scrolled into view inside the tab list (it scrolls sideways on phones), without moving the page.
  useEffect(() => {
    const el = typeof document !== 'undefined' ? document.getElementById(`tab-${tab}`) : null;
    const bar = el && el.parentElement;
    if (!el || !bar || bar.scrollWidth <= bar.clientWidth) return;
    const br = bar.getBoundingClientRect(), er = el.getBoundingClientRect();
    if (er.left < br.left) bar.scrollLeft -= br.left - er.left + 8;
    else if (er.right > br.right) bar.scrollLeft += er.right - br.right + 8;
  }, [tab, run ? 1 : 0]);

  // Expand the run summary when any entry is new since the last run (§12).
  useEffect(() => {
    if (!compute.run) return;
    const sig2 = JSON.stringify([compute.run.rules.map((r) => r.removed), compute.run.generation.valuesNotGenerated.map((v) => v.id + v.omitted.length), compute.run.generation.sampled]);
    if (prevRunRules.current !== null && prevRunRules.current !== sig2) { setSummaryOpen(true); setDetailsOpen(true); }
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

  const [unverifiedCount, recordCount] = useMemo(() => {
    const reg = Object.values(getRegistry());
    return [reg.filter((r) => r.label === LABEL).length, reg.length];
  }, []);
  const { w } = effectiveWeights(inputs.weights);
  const start = run ? run.meta.analysisStart : inputs.project.analysisStart;
  const viewFilterCount = activeFilterCount(view);
  const dominated = run ? run.options.filter((o) => o.dominatedBy).length : 0;
  const adequate = run ? run.options.filter((o) => !o.adequacy || o.adequacy.adequate).length : 0;
  const shown = useMemo(() => (run ? applyView(run.options, view).list.length : 0), [run, view]);
  const skipToChart = (e) => { e.preventDefault(); setTab('tradeoffs'); setFocusChart(true); };
  const skipToPlan = (e) => { e.preventDefault(); setTab('site'); setFocusPlan(true); };
  const showSite = (id) => { setSiteOptionId(id); setTab('site'); setTimeout(() => document.getElementById('tab-site')?.focus(), 0); };
  const showDispatch = (id) => { setDispatchOptionId(id); setTab('dispatch'); setTimeout(() => document.getElementById('tab-dispatch')?.focus(), 0); };
  const fitCounts = useMemo(() => {
    const c = { Fits: 0, 'Fits with flags': 0, 'Does not fit': 0 };
    if (run) for (const o of run.options) if (o.siteFit) c[o.siteFit.status]++;
    return c;
  }, [run]);
  const penaltyOn = !!inputs.deliverability.siteFitPenalty;
  const TABS = [['options', 'Options'], ['tradeoffs', 'Trade-offs'], ['compare', compareIds.length ? `Compare (${compareIds.length})` : 'Compare'], ...(siteBeta ? [['site', 'Site']] : []), ['dispatch', 'Dispatch'], ['sensitivity', 'Sensitivity']];

  // Run progress, run summary and run-level flags; on a phone they fold into "Run details" (review O1).
  const progressEl = <RunProgress compute={compute} open={progressOpen} onToggle={setProgressOpen} />;
  const summaryEl = run ? (
    <>
      <RunSummary run={run} open={summaryOpen} onToggle={setSummaryOpen} onInclude={onInclude} onSamplingOff={() => update('settings.sampleAboveCap', false)} siteBeta={siteBeta} />
      {run.runFlags.length ? (
        <ul className="run-flags">{run.runFlags.map((f) => <li key={f.id} className={`sev-${f.severity}`}><span className="sev">{f.severity}</span> <span className="cat">{f.category}</span> {f.message}</li>)}</ul>
      ) : null}
    </>
  ) : null;
  const foldProgress = narrow && compute.status === 'done';
  const foldSummary = narrow && !!run;
  const prog = compute.progress;
  const detailsLine = [
    foldProgress && prog ? `${prog.stages.filter((x) => x.status === 'done').length}/${prog.stages.length} stages, ${prog.warnings} warning${prog.warnings === 1 ? '' : 's'}` : 'summary of the last run',
    run ? `${run.generation.screened.toLocaleString('en-GB')} of ${run.generation.totalCombinations.toLocaleString('en-GB')} screened` : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="app">
      <a className="skip" href="#results">Skip to results</a>
      {run ? <a className="skip" href={`#tradeoffs-chart`} onClick={skipToChart}>Skip to trade-offs chart</a> : null}
      {run && siteBeta ? <a className="skip" href="#site-plan" onClick={skipToPlan}>Skip to site plan</a> : null}
      <header className="topbar">
        <div className="brand">
          <h1>Concept energy optioneering</h1>
          <span className="sub">Data centre campus · core slice, trade-off view, site layout, dispatch and sensitivity</span>
        </div>
        <div className="topbar-actions">
          <button type="button" className="chip-btn panel-toggle" aria-expanded={panelOpen} aria-controls="inputs-panel" onClick={() => setPanelOpen(!panelOpen)}>{panelOpen ? 'Close inputs' : 'Inputs'}</button>
          <button type="button" className="chip-btn" onClick={() => { setInputs(referenceT1()); setSummaryNote(null); }}>Load T1 example</button>
          <button type="button" className="chip-btn" onClick={() => { setInputs(buildDefaultInputs()); setSummaryNote(null); }}>Reset to defaults</button>
          {!__HOSTED__ ? <button type="button" className="chip-btn" id="save-study" onClick={saveStudy}>Save study</button> : null}
          <button type="button" className="chip-btn" id="open-study" onClick={() => studyInput.current && studyInput.current.click()}>Open study…</button>
          <input ref={studyInput} id="open-study-file" type="file" accept=".json,application/json" hidden onChange={openStudy} aria-label="Study file to open" />
          {run && !__HOSTED__ ? <button type="button" className="chip-btn" id="save-pdf" onClick={savePdf} disabled={compute.status === 'running'}>Save PDF report</button> : null}
          <button type="button" className="chip-btn" aria-expanded={settingsOpen} aria-controls="general-settings" onClick={() => setSettingsOpen(!settingsOpen)}>General settings</button>
        </div>
      </header>
      {settingsOpen ? (
        <section id="general-settings" className="general-settings" aria-labelledby="gs-title">
          <h2 id="gs-title">General settings</h2>
          <h3>Features</h3>
          <div className="gs-row">
            <input id="gs-site-beta" type="checkbox" checked={siteBeta} onChange={(e) => setSiteBeta(e.target.checked)} aria-describedby="gs-site-beta-desc" />
            <label htmlFor="gs-site-beta">Site tab <span className="beta-badge">Beta</span></label>
            {siteBeta === (viewSetting('siteTabBeta') === true) ? <UnverifiedTag path="view.siteTabBeta" compact /> : null}
            <p id="gs-site-beta-desc" className="field-hint">Site layout, boundary drawing, GeoJSON/KML import and site fit. Hidden by default. When on, it is labelled Beta, and it never affects the ranking or the PDF export.</p>
          </div>
          <button type="button" className="chip-btn" onClick={() => setSettingsOpen(false)}>Close settings</button>
        </section>
      ) : null}

      <div className="layout">
        <aside id="inputs-panel" className={`panel ${panelOpen ? 'open' : ''}`} aria-label="Inputs">
          <InputsPanel inputs={inputs} update={update} setWeights={setWeights} siteBeta={siteBeta} />
        </aside>

        <main id="results" className="main" tabIndex={-1}>
          <div className="header-strip" role="region" aria-label="Results header">
            <div className="hs-item"><span className="hs-k">Options</span><span className="hs-v">{run ? `${shown.toLocaleString('en-GB')} shown / ${run.options.length.toLocaleString('en-GB')} screened / ${run.generation.totalCombinations.toLocaleString('en-GB')} combinations · ${dominated.toLocaleString('en-GB')} dominated` : '—'}</span></div>
            <div className="hs-item"><span className="hs-k">Leader</span><span className="hs-v">{leader ? <>{leader.name} <strong>{leader.score.toFixed(1)}</strong></> : '—'}</span><span className="hs-sub">{(() => { const mc = run ? latestMonteCarlo(run) : null; const r = mc && leader ? mc.rows.find((x) => x.id === leader.id) : null; return r ? `Leads in ${Math.round(r.pRank1 * 100)} % of ${mc.samples.toLocaleString('en-GB')} Monte Carlo samples` : 'Rank probability: run the Monte Carlo (Sensitivity tab)'; })()}</span></div>
            <div className="hs-item"><span className="hs-k">Power adequacy</span><span className="hs-v">{run ? <>✓ {adequate.toLocaleString('en-GB')} adequate · ✗ {(run.options.length - adequate).toLocaleString('en-GB')} not adequate</> : '—'}</span><span className="hs-sub">Adequate options rank first; none is hidden.</span></div>
            {siteBeta ? <div className="hs-item"><span className="hs-k">Site fit (Beta)</span><span className="hs-v">{run ? <>✓ {fitCounts.Fits.toLocaleString('en-GB')} fit · ! {fitCounts['Fits with flags'].toLocaleString('en-GB')} with flags · ✗ {fitCounts['Does not fit'].toLocaleString('en-GB')} do not fit</> : '—'}</span><span className="hs-sub">{penaltyOn ? 'Site-fit penalty on: deliverability includes site fit.' : 'Status only: it changes no score or rank.'} Site inputs set the POC and gas-main route costs.</span></div> : null}
            <div className="hs-item"><span className="hs-k">Model</span><span className="hs-v">{run && run.verification ? `Screening (representative days); best ${run.verification.verified} verified with the full year` : 'Full-year hourly (8760 h)'}</span><span className="hs-sub">Synthetic profiles · {run ? COUNTRIES[run.country].name : ''}</span></div>
            <div className="hs-item"><span className="hs-k">Settings</span><span className="hs-v">
              Sample above cap: {inputs.settings.sampleAboveCap ? 'On' : 'Off'} · Hide dominated: {view.hideDominated ? 'On' : 'Off'} · View filters: {viewFilterCount}
              {inputs.settings.gridHandling === 'exceedance' ? <> · <strong className="warn-text">Grid capacity: exceedance mode</strong></> : null}
              {inputs.settings.rankCompliantFirst ? <> · <strong>Requirement-compliant options ranked first</strong></> : null}
              {penaltyOn ? <> · <strong>Site-fit penalty in deliverability: on</strong></> : null}
            </span></div>
            <div className="hs-item"><span className="hs-k">Weights</span><span className="hs-v">Cost {(w.cost * 100).toFixed(0)} · Carbon {(w.carbon * 100).toFixed(0)} · TTP {(w.ttp * 100).toFixed(0)} · {penaltyOn ? 'Deliverability (incl. site fit)' : 'Deliv.'} {(w.deliverability * 100).toFixed(0)} %</span></div>
            <div className="hs-item"><span className="hs-k">Unverified defaults</span><span className="hs-v">{unverifiedCount} of {recordCount} default records are <span className="tag tag-unverified">{LABEL}</span>{recordCount - unverifiedCount > 0 ? <> · {recordCount - unverifiedCount} <span className="tag tag-sourced">sourced — not independently checked</span></> : null}</span><span className="hs-sub">The count affecting the leader needs a per-option record map (not in this slice)</span></div>
          </div>

          {studyMsg ? <p className="study-msg" role="status" aria-live="polite">{studyMsg}</p> : null}
          <div className="status" role="status" aria-live="polite">
            {compute.notice ? <span className="flag-text">{compute.notice} </span> : null}
            {compute.status === 'running' ? (
              // Visual only: the run progress panel's live region announces stage changes (not every event).
              <span className="running" aria-hidden="true"><span className="spinner" /> Screening options: {compute.progress && compute.progress.current ? `${compute.progress.current.label} · ${Math.round(compute.progress.current.pct * 100)} %` : 'starting'}</span>
            ) : compute.status === 'error' ? (
              <span className="flag-text">Run failed: {compute.error}</span>
            ) : compute.status === 'done' ? (
              <span>{announce} Last run {sig(compute.ms / 1000, 2)} s on {compute.mode}.{pdfMsg ? ` ${pdfMsg}` : ''}</span>
            ) : null}
          </div>

          {foldProgress ? null : progressEl}
          {foldSummary ? (
            <details className="run-details" open={detailsOpen} onToggle={(e) => setDetailsOpen(e.currentTarget.open)}>
              <summary><span className="section-title">Run details</span>{' '}<span className="rd-line">{detailsLine}</span></summary>
              <div className="rd-body">
                {foldProgress ? progressEl : null}
                {summaryEl}
              </div>
            </details>
          ) : summaryEl}

          {run ? (
            <>
              <div className="tabs" role="tablist" aria-label="Results views">
                {TABS.map(([id, label]) => (
                  <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1}
                    className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}
                    onKeyDown={(e) => {
                      // ARIA tabs pattern (automatic activation): arrows wrap, Home and End go to the first and last tab.
                      const i = TABS.findIndex((t) => t[0] === tab);
                      let k = null;
                      if (e.key === 'ArrowRight') k = (i + 1) % TABS.length;
                      else if (e.key === 'ArrowLeft') k = (i + TABS.length - 1) % TABS.length;
                      else if (e.key === 'Home') k = 0;
                      else if (e.key === 'End') k = TABS.length - 1;
                      if (k == null) return;
                      e.preventDefault();
                      const n = TABS[k][0];
                      setTab(n); setTimeout(() => document.getElementById(`tab-${n}`)?.focus(), 0);
                    }}>{label}{id === 'site' ? <> <span className="beta-badge">Beta</span></> : null}</button>
                ))}
              </div>
              <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                {tab === 'options' ? <RankedList run={run} view={view} setView={setView} start={start} onShowSite={showSite} onShowDispatch={showDispatch} siteBeta={siteBeta} onCompare={toggleCompare} compareIds={compareIds}
                  summary={<SummaryPanel run={run} sensitivity={latestSensitivity(run) ? latestSensitivity(run).result : null} breakevens={latestBreakevens(run)} monteCarlo={latestMonteCarlo(run)} siteBeta={siteBeta} note={summaryNote} onSaveNote={setSummaryNote} onDiscardNote={() => setSummaryNote(null)}
                    onShowSensitivity={() => { setSensOptionId(null); setTab('sensitivity'); setTimeout(() => document.getElementById('tab-sensitivity')?.focus(), 0); }} open={summaryShown} onToggle={setSummaryShown} />} />
                  : tab === 'tradeoffs' ? <ParetoView run={run} view={view} setView={setView} start={start} focusChart={focusChart} onChartFocused={() => setFocusChart(false)} onShowSite={showSite} onShowDispatch={showDispatch} siteBeta={siteBeta} onCompare={toggleCompare} compareIds={compareIds} />
                    : tab === 'compare' ? <CompareView run={run} ids={compareIds} onRemove={toggleCompare} onClear={() => setCompareIds([])} start={start} />
                    : tab === 'site' && siteBeta ? <SiteView run={run} inputs={inputs} update={update} optionId={siteOptionId} setOptionId={setSiteOptionId} computing={compute.status === 'running'} focusPlan={focusPlan} onPlanFocused={() => setFocusPlan(false)} />
                      : tab === 'dispatch' ? <DispatchView run={run} optionId={dispatchOptionId} setOptionId={setDispatchOptionId} />
                        : <SensitivityView run={run} optionId={sensOptionId} setOptionId={setSensOptionId} onResult={() => setExtras((x) => x + 1)} />}
              </div>
            </>
          ) : compute.status !== 'error' ? (
            <p className="empty">Options appear here once the required inputs are set: location, site area or boundary, IT load, grid capacity now and at full connection, and the full-connection date. Site fit needs a site boundary or an area.</p>
          ) : null}
        </main>
      </div>

      <footer className="footer">
        <p>{GUARDRAIL}</p>
        <p className="sub">Not built yet: parallel coordinates, choice-impact and radar charts, the rest of the tornado drivers, scenarios, manual layout editing, 2.5D massing, map tiles and underlays, exports, a range for every numeric input in the Monte Carlo, an automatic Monte Carlo. Site layouts and noise figures are concept-stage proxies. PPA settlement counts only on PPA energy delivered over the grid connection. Profiles are synthetic and seeded; every default is indicative — unverified.</p>
      </footer>
    </div>
  );
}
