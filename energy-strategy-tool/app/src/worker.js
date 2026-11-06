// Compute worker (BRIEF §4): option generation, sizing, 8760-h dispatch and evaluation run here.
// The main thread only renders and merges/scores. A new run terminates in-flight workers (cancellation).
//
// Run log: the worker records its own ordered events (source "worker k", own seq from 0) and returns
// them with the result (run.log). For the live progress panel it also streams copies of the events in
// batches; the main thread uses the returned log, not the streamed copies, to build the merged log.
import { runModel, toTransferable, lightPart, detailPart } from './engine/index.js';

const FLUSH_EVENTS = 200;
const FLUSH_MS = 120;

// Work package 23: when the whole run (every slice) holds more options than `lightAbove` (the app sends DETAIL_KEEP),
// the result carries light records only; the run is held here until the main thread asks for the full detail of the
// options it ranks among the best (a 'detail' request), then let go.
let held = null;

self.onmessage = (e) => {
  if (e.data && e.data.type === 'detail') {
    const { id, ids } = e.data;
    try {
      self.postMessage({ id, type: 'detail', options: held && held.id === id ? detailPart(held.run, ids) : [] });
    } catch (err) {
      self.postMessage({ id, type: 'detail', options: [], error: String(err && err.message ? err.message : err) });
    }
    held = null;
    return;
  }
  const { id, inputs, sliceIndex, sliceCount, t0Abs, lightAbove = null } = e.data;
  held = null;
  let buf = [];
  let last = performance.now();
  const flush = () => {
    if (!buf.length) return;
    self.postMessage({ id, type: 'events', sliceIndex, events: buf });
    buf = [];
    last = performance.now();
  };
  try {
    const run = runModel(inputs, {
      sliceIndex, sliceCount, skipScore: true, source: `worker ${sliceIndex}`, t0Abs,
      onEvent: (ev) => {
        buf.push(ev);
        if (buf.length >= FLUSH_EVENTS || performance.now() - last >= FLUSH_MS) flush();
      },
    });
    flush();
    if (lightAbove != null && run.generation && run.generation.screened > lightAbove) {
      held = { id, run };
      self.postMessage({ id, type: 'result', sliceIndex, run: lightPart(run) });
    } else self.postMessage({ id, type: 'result', sliceIndex, run: toTransferable(run) });
  } catch (err) {
    flush();
    self.postMessage({ id, type: 'error', message: String(err && err.stack ? err.stack : err) });
  }
};
