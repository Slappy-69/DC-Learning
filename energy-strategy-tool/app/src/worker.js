// Compute worker (BRIEF §4): option generation, sizing, 8760-h dispatch and evaluation run here.
// The main thread only renders and merges/scores. A new run terminates in-flight workers (cancellation).
import { runModel, toTransferable } from './engine/index.js';

self.onmessage = (e) => {
  const { id, inputs, sliceIndex, sliceCount } = e.data;
  try {
    const run = runModel(inputs, {
      sliceIndex, sliceCount, skipScore: true,
      onProgress: (done, total) => self.postMessage({ id, type: 'progress', sliceIndex, done, total }),
    });
    self.postMessage({ id, type: 'result', sliceIndex, run: toTransferable(run) });
  } catch (err) {
    self.postMessage({ id, type: 'error', message: String(err && err.stack ? err.stack : err) });
  }
};
