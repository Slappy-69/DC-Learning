// Compute hook: runs the engine in a pool of Web Workers (BRIEF §4) and merges the slices.
// A new request terminates in-flight workers, so stale results never arrive.
// If workers are unavailable (for example some browsers on file://), it falls back to the
// main thread in a deferred task and says so in the status.
import { useEffect, useRef, useState } from 'react';
import { runModel, toTransferable, mergeRuns } from './engine/index.js';

function poolSize() {
  const hc = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2;
  return Math.max(1, Math.min(8, hc - 1)); // §4 bounds 1–8: indicative — unverified (run setting)
}

export function useCompute(inputs, computeKey) {
  const [state, setState] = useState({ status: 'idle', run: null, progress: 0, error: null, mode: null, ms: 0 });
  const workersRef = useRef([]);
  const reqRef = useRef(0);

  useEffect(() => {
    const id = ++reqRef.current;
    workersRef.current.forEach((w) => w.terminate());
    workersRef.current = [];
    const t0 = performance.now();
    setState((s) => ({ ...s, status: 'running', progress: 0, error: null }));

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
        // Main-thread fallback
        setTimeout(() => {
          if (id !== reqRef.current) return;
          try {
            const run = toTransferable(runModel(inputs));
            setState({ status: 'done', run, progress: 1, error: null, mode: 'main thread (workers unavailable)', ms: performance.now() - t0 });
          } catch (err) {
            setState((s) => ({ ...s, status: 'error', error: String(err) }));
          }
        }, 0);
        return;
      }
      workersRef.current = workers;
      const parts = new Array(n);
      const prog = new Array(n).fill(0);
      let received = 0;
      let failed = false;
      workers.forEach((w, i) => {
        w.onmessage = (e) => {
          if (id !== reqRef.current || failed) return;
          const msg = e.data;
          if (msg.type === 'progress') {
            prog[i] = msg.total ? msg.done / msg.total : 0;
            const p = prog.reduce((a, b) => a + b, 0) / n;
            setState((s) => ({ ...s, progress: p }));
          } else if (msg.type === 'result') {
            parts[i] = msg.run;
            received++;
            if (received === n) {
              const run = mergeRuns(parts, inputs);
              workers.forEach((x) => x.terminate());
              workersRef.current = [];
              setState({ status: 'done', run, progress: 1, error: null, mode: `${n} worker${n === 1 ? '' : 's'}`, ms: performance.now() - t0 });
            }
          } else if (msg.type === 'error') {
            failed = true;
            workers.forEach((x) => x.terminate());
            setState((s) => ({ ...s, status: 'error', error: msg.message }));
          }
        };
        w.onerror = (ev) => {
          if (id !== reqRef.current || failed) return;
          failed = true;
          workers.forEach((x) => x.terminate());
          // Retry on the main thread (e.g. worker script blocked)
          setTimeout(() => {
            if (id !== reqRef.current) return;
            try {
              const run = toTransferable(runModel(inputs));
              setState({ status: 'done', run, progress: 1, error: null, mode: 'main thread (worker failed to start)', ms: performance.now() - t0 });
            } catch (err) {
              setState((s) => ({ ...s, status: 'error', error: String(err) }));
            }
          }, 0);
          if (ev && ev.preventDefault) ev.preventDefault();
        };
        w.postMessage({ id, inputs, sliceIndex: i, sliceCount: n });
      });
    }, 350); // settle delay after an input commit

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeKey]);

  useEffect(() => () => workersRef.current.forEach((w) => w.terminate()), []);
  return state;
}
