// Compute hook: runs the engine in a pool of Web Workers (BRIEF §4) and merges the slices.
// A new request terminates in-flight workers, so stale results never arrive.
// If workers are unavailable (for example some browsers on file://), it falls back to the
// main thread and says so in the status. The fallback runs the same pipeline in time slices
// (runModelSteps) so the page stays responsive and the progress panel stays live.
//
// Run log: every event from every source is collected per source; the progress panel is fed from
// those events (throttled). The final log is the merged log returned by mergeRuns (pool) or by the
// run itself (main thread). A partial log (run cancelled or failed) is merged the same way.
import { useEffect, useRef, useState } from 'react';
import {
  runModelSteps, toTransferable, mergeRuns, startPooledRun, normalizeInputs, hashInputs,
  createProgressTracker, mergeLogs, nowAbs,
} from './engine/index.js';

function poolSize() {
  const hc = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2;
  return Math.max(1, Math.min(8, hc - 1)); // §4 bounds 1–8: indicative — unverified (run setting)
}

const SLICE_MS = 30; // main-thread fallback: work per time slice before yielding to the browser
const UI_THROTTLE_MS = 150;

const IDLE = { status: 'idle', run: null, error: null, mode: null, ms: 0, progress: null, runMeta: null };

export function useCompute(inputs, computeKey) {
  const [state, setState] = useState(IDLE);
  const workersRef = useRef([]);
  const reqRef = useRef(0);
  const liveRef = useRef(null); // { bySource: Map(source -> events[]), meta }

  useEffect(() => {
    const id = ++reqRef.current;
    workersRef.current.forEach((w) => w.terminate());
    workersRef.current = [];
    const t0 = performance.now();
    const t0Abs = nowAbs();
    const startedAt = new Date();
    let inputHash = null;
    try { inputHash = hashInputs(normalizeInputs(inputs)); } catch (e) { inputHash = 'unhashed'; }
    const runMeta = { startedAt: startedAt.toISOString(), startedAtMs: startedAt.getTime(), inputHash, mode: null };
    const live = { bySource: new Map(), meta: runMeta };
    liveRef.current = live;
    let tracker = createProgressTracker({ sources: ['main'] });
    let flushTimer = null;
    const pushUi = () => {
      flushTimer = null;
      if (id !== reqRef.current) return;
      setState((s) => ({ ...s, progress: tracker.snapshot() }));
    };
    const onEvents = (events) => {
      if (id !== reqRef.current || !events.length) return;
      for (const e of events) {
        const src = e.detail.source;
        if (!live.bySource.has(src)) live.bySource.set(src, []);
        live.bySource.get(src).push(e);
      }
      tracker.ingest(events);
      if (!flushTimer) flushTimer = setTimeout(pushUi, UI_THROTTLE_MS);
    };
    const resetTracker = (sources) => {
      tracker = createProgressTracker({ sources, mainSource: 'main' });
      live.bySource = new Map();
    };
    setState((s) => ({ ...s, status: 'running', error: null, progress: tracker.snapshot(), runMeta }));

    // Main-thread fallback: same pipeline, run in time slices.
    const runOnMainThread = (mode) => {
      runMeta.mode = mode;
      resetTracker(['main']);
      let it;
      try {
        it = runModelSteps(inputs, { source: 'main', t0Abs, onEvent: (e) => onEvents([e]) });
      } catch (err) {
        setState((s) => ({ ...s, status: 'error', error: String(err) }));
        return;
      }
      const step = () => {
        if (id !== reqRef.current) return; // superseded: abandon
        const until = performance.now() + SLICE_MS;
        try {
          let r = it.next();
          while (!r.done && performance.now() < until) r = it.next();
          if (!r.done) { setTimeout(step, 0); return; }
          const run = toTransferable(r.value);
          if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
          setState({ status: 'done', run, error: null, mode, ms: performance.now() - t0, progress: tracker.snapshot(), runMeta: { ...runMeta, inputHash: run.inputHash } });
        } catch (err) {
          setState((s) => ({ ...s, status: 'error', error: String(err && err.stack ? err.stack : err), progress: tracker.snapshot() }));
        }
      };
      setTimeout(step, 0);
    };

    const timer = setTimeout(() => {
      let workers = [];
      const n = poolSize();
      try {
        for (let i = 0; i < n; i++) workers.push(new Worker('worker.js'));
      } catch (e) {
        workers.forEach((w) => w.terminate());
        workers = [];
      }
      if (!workers.length) {
        runOnMainThread('main thread (workers unavailable)');
        return;
      }
      workersRef.current = workers;
      const mode = `${n} worker${n === 1 ? '' : 's'}`;
      runMeta.mode = mode;
      resetTracker(Array.from({ length: n }, (_, i) => `worker ${i}`));
      // Coordinator: input-normalisation stage on the main thread (gives the input hash).
      let coord;
      try {
        coord = startPooledRun(inputs, { t0Abs, onEvent: (e) => onEvents([e]) });
        runMeta.inputHash = coord.inputHash;
      } catch (err) {
        workers.forEach((w) => w.terminate());
        setState((s) => ({ ...s, status: 'error', error: String(err) }));
        return;
      }
      const parts = new Array(n);
      let received = 0;
      let failed = false;
      workers.forEach((w, i) => {
        w.onmessage = (e) => {
          if (id !== reqRef.current || failed) return;
          const msg = e.data;
          if (msg.type === 'events') {
            onEvents(msg.events);
          } else if (msg.type === 'result') {
            parts[i] = msg.run;
            received++;
            if (received === n) {
              workers.forEach((x) => x.terminate());
              workersRef.current = [];
              try {
                // Scoring and ranking events reach the panel through coord.log's onEvent.
                const run = mergeRuns(parts, inputs, { log: coord.log });
                if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
                setState({ status: 'done', run, error: null, mode, ms: performance.now() - t0, progress: tracker.snapshot(), runMeta: { ...runMeta, inputHash: run.inputHash } });
              } catch (err) {
                setState((s) => ({ ...s, status: 'error', error: String(err && err.stack ? err.stack : err) }));
              }
            }
          } else if (msg.type === 'error') {
            failed = true;
            workers.forEach((x) => x.terminate());
            setState((s) => ({ ...s, status: 'error', error: msg.message, progress: tracker.snapshot() }));
          }
        };
        w.onerror = (ev) => {
          if (id !== reqRef.current || failed) return;
          failed = true;
          workers.forEach((x) => x.terminate());
          workersRef.current = [];
          if (ev && ev.preventDefault) ev.preventDefault();
          // Retry on the main thread (e.g. worker script blocked)
          runOnMainThread('main thread (worker failed to start)');
        };
        w.postMessage({ id, inputs, sliceIndex: i, sliceCount: n, t0Abs });
      });
    }, 350); // settle delay after an input commit

    return () => { clearTimeout(timer); if (flushTimer) clearTimeout(flushTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeKey]);

  useEffect(() => () => workersRef.current.forEach((w) => w.terminate()), []);

  // Partial log of the current (or last) run, merged like the final log: main first, then workers.
  const getPartialLog = () => {
    const live = liveRef.current;
    if (!live) return [];
    const srcs = [...live.bySource.keys()].sort((a, b) => (a === 'main' ? -1 : b === 'main' ? 1 : Number(a.split(' ')[1]) - Number(b.split(' ')[1])));
    return mergeLogs(srcs.map((s) => live.bySource.get(s)));
  };
  return { ...state, getPartialLog };
}
