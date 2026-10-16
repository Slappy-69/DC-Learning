import React, { useEffect, useRef, useState } from 'react';
import { describeEvent, logToCSV, logToJSON, logFileName, validateRunLog, STAGE_LABEL, ENGINE_VERSION } from '../engine/index.js';

// Live run progress panel: current stage, percent complete per stage, a scrolling log of the last
// 200 events and a "Download run log" control (JSON and CSV).
// Accessibility: one polite live region announces the current stage only (not every event).

const pctText = (p) => `${Math.round(p * 100)} %`;

/* global __HOSTED__ */
// Hosted build (published page): the viewer's frame ignores downloads the page starts itself, so
// the log is copied to the clipboard instead, with a select-the-text fallback if that is refused.
const HOSTED = typeof __HOSTED__ !== 'undefined' && __HOSTED__;

function download(name, text, type) {
  // Dropped from the hosted build at build time (__HOSTED__ is defined true there): the host's
  // frame ignores downloads a page starts itself, and the hosted page copies the log instead.
  if (__HOSTED__) return;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function RunProgress({ compute, open, onToggle }) {
  const p = compute.progress;
  const logRef = useRef(null);
  const [follow, setFollow] = useState(true);
  const [stageAnnounce, setStageAnnounce] = useState('');
  const lastAnnounced = useRef('');
  const [copied, setCopied] = useState(null); // hosted build: { fmt, ok, text }
  const copyRef = useRef(null);
  const running = compute.status === 'running';
  const current = p && p.current;

  // Announce stage changes only.
  useEffect(() => {
    let msg = '';
    if (running) msg = current ? `Run in progress: ${current.label}, stage ${current.index + 1} of ${p.stages.length}.` : 'Run in progress.';
    else if (compute.status === 'done') msg = 'Run complete. All stages finished.';
    else if (compute.status === 'error') msg = 'Run failed.';
    if (msg && msg !== lastAnnounced.current) {
      lastAnnounced.current = msg;
      setStageAnnounce(msg);
    }
  }, [running, compute.status, current && current.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (follow && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [p && p.eventCount, follow, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = logRef.current;
    if (!el) return;
    setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  };

  const finalLog = compute.status === 'done' && compute.run && compute.run.log ? compute.run.log : null;
  const exportLog = (fmt) => {
    const events = finalLog || compute.getPartialLog();
    const partial = !finalLog;
    const meta = compute.runMeta || {};
    const now = new Date();
    const name = logFileName(meta.inputHash || 'unhashed', now, fmt, partial);
    let text;
    if (fmt === 'json') {
      const v = validateRunLog(events);
      text = logToJSON({
        inputHash: meta.inputHash, engineVersion: ENGINE_VERSION, mode: compute.mode || meta.mode, runStartedAt: meta.startedAt,
        exportedAt: now.toISOString(), status: partial ? `partial (${compute.status})` : 'complete',
        t_ms_basis: 'milliseconds since run start (runStartedAt)', validation: { ok: v.ok, problems: v.problems, stagesComplete: v.stagesComplete },
      }, events);
    } else {
      text = logToCSV(events);
    }
    if (!HOSTED) {
      download(name, text, fmt === 'json' ? 'application/json' : 'text/csv');
      return;
    }
    // Called inside the click handler, as the clipboard requires.
    const fail = () => setCopied({ fmt, ok: false, text });
    try {
      const pr = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : null;
      if (!pr) fail();
      else pr.then(() => setCopied({ fmt, ok: true, text: null }), fail);
    } catch (e) {
      fail();
    }
  };

  useEffect(() => {
    if (copied && !copied.ok && copyRef.current) { copyRef.current.focus(); copyRef.current.select(); }
  }, [copied]);

  const total = p ? p.eventCount : 0;
  const recent = p ? p.recent : [];
  const doneCount = p ? p.stages.filter((s) => s.status === 'done').length : 0;
  const headline = !p ? 'No run yet'
    : running ? (current ? `${current.label} · ${pctText(current.pct)}` : 'Starting…')
      : compute.status === 'done' ? `Complete · ${doneCount}/${p.stages.length} stages`
        : compute.status === 'error' ? `Failed during ${current ? current.label : 'run'}` : '';

  return (
    <details className="run-progress" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary>
        <span className="section-title">Run progress</span>
        <span className="rp-line">{headline}{p ? ` · ${total.toLocaleString('en-GB')} events · ${p.warnings} warning${p.warnings === 1 ? '' : 's'}` : ''}</span>
      </summary>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{stageAnnounce}</p>
      <div className="rp-body">
        {p ? (
          <ol className="rp-stages" aria-label="Stages">
            {p.stages.map((s) => (
              <li key={s.id} className={`rp-stage rp-${s.status}`} aria-current={current && current.id === s.id && running ? 'step' : undefined}>
                <span className="rp-name"><span className="rp-n" aria-hidden="true">{s.index + 1}</span>{s.label}</span>
                <span className="rp-bar" aria-hidden="true"><span style={{ width: `${Math.round(s.pct * 100)}%` }} /></span>
                <span className="rp-pct">{s.status === 'pending' ? 'pending' : pctText(s.pct)}</span>
                <span className="rp-meta">
                  {s.cacheHits != null ? `cache ${s.cacheHits.toLocaleString('en-GB')} hit / ${s.cacheMisses.toLocaleString('en-GB')} miss` : ''}
                  {s.warnings ? `${s.cacheHits != null ? ' · ' : ''}${s.warnings} warning${s.warnings === 1 ? '' : 's'}` : ''}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
        <div className="rp-log-head">
          <h3 id="rp-log-title">Event log <span className="sub">(last {recent.length} of {total.toLocaleString('en-GB')})</span></h3>
          <div className="btn-row">
            <span className="rp-dl-label">{HOSTED ? 'Copy run log' : 'Download run log'}{finalLog ? '' : ' (partial)'}:</span>
            <button type="button" className="chip-btn" onClick={() => exportLog('json')} disabled={!p || !total}>JSON</button>
            <button type="button" className="chip-btn" onClick={() => exportLog('csv')} disabled={!p || !total}>CSV</button>
            {HOSTED && copied && copied.ok ? <span className="rp-copied" role="status">Copied {copied.fmt.toUpperCase()} to the clipboard</span> : null}
          </div>
        </div>
        {HOSTED && copied && !copied.ok ? (
          <div className="rp-copy-fallback">
            <label htmlFor="rp-copy-text">This browser did not allow copying. The {copied.fmt.toUpperCase()} log is selected below: copy it with your browser's Copy command.</label>
            <textarea id="rp-copy-text" ref={copyRef} readOnly rows={6} value={copied.text} />
            <button type="button" className="link-btn" onClick={() => setCopied(null)}>Close</button>
          </div>
        ) : null}
        <div className="rp-log" ref={logRef} onScroll={onScroll} role="log" aria-live="off" aria-labelledby="rp-log-title" tabIndex={0}>
          {recent.map((e) => (
            <div key={`${e.detail.source}|${e.seq}`} className={`rp-ev rp-ev-${e.event}`}>
              <span className="rp-t">{(e.t_ms / 1000).toFixed(2)} s</span>
              <span className="rp-src">{e.detail.source}</span>
              <span className="rp-stg">{STAGE_LABEL[e.stage]}</span>
              <span className="rp-msg">{describeEvent(e)}</span>
            </div>
          ))}
        </div>
        {!follow ? <button type="button" className="link-btn" onClick={() => setFollow(true)}>Follow latest events</button> : null}
        {compute.status === 'done' && compute.run && compute.run.inputHash ? (
          <p className="note">Input hash {compute.run.inputHash} · {compute.mode} · events from every source merged in stage order (main, then workers by index) and renumbered.</p>
        ) : null}
      </div>
    </details>
  );
}
