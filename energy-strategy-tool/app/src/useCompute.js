// Compute hook: runs the engine in a pool of Web Workers (BRIEF §4) and merges the slices.
// A new request terminates in-flight workers, so stale results never arrive.
// If workers are unavailable (for example some browsers on file://), it falls back to the
// main thread and says so in the status. That covers both a synchronous failure (the Worker
// constructor throws) and an asynchronous one (the script fails to load or a message cannot be
// deserialised: worker.onerror / worker.onmessageerror), a postMessage that throws, and a worker
// that goes silent without an error event (watchdog), in which case the pool is terminated.
//
// Worker source: the normal build loads 'worker.js'. The single-file build defines
// __INLINE_WORKER_SRC__ as the bundled worker source string and the worker is created from a
// Blob URL, so the single file loads no other file. The fallback runs the same pipeline in time slices
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

/* global __INLINE_WORKER_SRC__ */
// build.mjs defines __INLINE_WORKER_SRC__ in both builds (null in the normal build), so esbuild
// folds this branch and the single file carries no 'worker.js' reference.
let inlineWorkerUrl = null;
function createWorker() {
  if (__INLINE_WORKER_SRC__ !== null) {
    if (!inlineWorkerUrl) inlineWorkerUrl = URL.createObjectURL(new Blob([__INLINE_WORKER_SRC__], { type: 'text/javascript' }));
    return new Worker(inlineWorkerUrl);
  }
  return new Worker('worker.js');
}

const SLICE_MS = 30; // main-thread fallback: work per time slice before yielding to the browser
const UI_THROTTLE_MS = 150;
const WORKER_SILENCE_MS = 30000; // watchdog: no message from a working worker for this long = failed (run setting)
const WATCHDOG_EVERY_MS = 2000;

const IDLE = { status: 'idle', run: null, error: null, mode: null, ms: 0, progress: null, runMeta: null, notice: null };

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
    setState((s) => ({ ...s, status: 'running', error: null, notice: null, progress: tracker.snapshot(), runMeta }));

    // Main-thread fallback: same pipeline, run in time slices.
    const runOnMainThread = (mode, notice = null) => {
      runMeta.mode = mode;
      if (notice) setState((s) => ({ ...s, notice }));
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
          setState({ status: 'done', run, error: null, mode, ms: performance.now() - t0, progress: tracker.snapshot(), runMeta: { ...runMeta, inputHash: run.inputHash }, notice });
        } catch (err) {
          setState((s) => ({ ...s, status: 'error', error: String(err && err.stack ? err.stack : err), progress: tracker.snapshot() }));
        }
      };
      setTimeout(step, 0);
    };

    let cleanupPool = null;
    const timer = setTimeout(() => {
      let workers = [];
      const n = poolSize();
      try {
        for (let i = 0; i < n; i++) workers.push(createWorker());
      } catch (e) {
        workers.forEach((w) => w.terminate());
        workers = [];
      }
      if (!workers.length) {
        runOnMainThread('main thread (workers unavailable)', 'Web Workers unavailable: running on the main thread instead.');
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
      // Watchdog: a worker that dies without an error event (for example killed by the browser
      // for memory) would otherwise leave the run with no progress and no result. Workers stream
      // events at least every few hundred ms while working, so silence for WORKER_SILENCE_MS
      // before a worker's result counts as a failure and the run falls back to the main thread.
      const lastSeen = new Array(n).fill(performance.now());
      let watchdog = null;
      const stopWatchdog = () => { if (watchdog) { clearInterval(watchdog); watchdog = null; } };
      // Any asynchronous pool failure: terminate every worker and run on the main thread instead.
      const failPool = (kind) => {
        if (id !== reqRef.current || failed) return;
        failed = true;
        stopWatchdog();
        workers.forEach((x) => x.terminate());
        workersRef.current = [];
        runOnMainThread(`main thread (worker ${kind})`, `Worker ${kind}: workers terminated, running on the main thread instead.`);
      };
      watchdog = setInterval(() => {
        if (id !== reqRef.current || failed) { stopWatchdog(); return; }
        const now = performance.now();
        if (lastSeen.some((t, i) => parts[i] === undefined && now - t > WORKER_SILENCE_MS)) failPool('stopped responding');
      }, WATCHDOG_EVERY_MS);
      cleanupPool = stopWatchdog;
      workers.forEach((w, i) => {
        w.onmessage = (e) => {
          if (id !== reqRef.current || failed) return;
          lastSeen[i] = performance.now();
          const msg = e.data;
          if (msg.type === 'events') {
            onEvents(msg.events);
          } else if (msg.type === 'result') {
            parts[i] = msg.run;
            received++;
            if (received === n) {
              stopWatchdog();
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
            // The engine threw inside the worker; the main thread would throw the same way, so the
            // run ends with the error shown (not stuck, not retried).
            failed = true;
            stopWatchdog();
            workers.forEach((x) => x.terminate());
            workersRef.current = [];
            setState((s) => ({ ...s, status: 'error', error: msg.message, progress: tracker.snapshot() }));
          }
        };
        // Asynchronous failure (script failed to load, threw, or a message could not be
        // deserialised): terminate the pool and run on the main thread instead.
        const onWorkerFailure = (kind) => (ev) => {
          if (ev && ev.preventDefault) ev.preventDefault();
          failPool(kind);
        };
        w.onerror = onWorkerFailure('failed');
        w.onmessageerror = onWorkerFailure('message could not be read');
      });
      // postMessage can throw synchronously (for example a DataCloneError). Without this catch the
      // exception escapes the timer callback and the run stays "running" with no result.
      for (let i = 0; i < n && !failed; i++) {
        try {
          workers[i].postMessage({ id, inputs, sliceIndex: i, sliceCount: n, t0Abs });
        } catch (err) {
          failPool('could not be started');
        }
      }
    }, 350); // settle delay after an input commit

    return () => { clearTimeout(timer); if (flushTimer) clearTimeout(flushTimer); if (cleanupPool) cleanupPool(); };
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
