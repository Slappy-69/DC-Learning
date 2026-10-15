// Runs the browser Web Worker entry (src/worker.js) inside a Node worker_thread for tests:
// maps self.postMessage / self.onmessage onto worker_threads' parentPort.
import { parentPort } from 'node:worker_threads';

globalThis.self = globalThis;
globalThis.self.postMessage = (msg) => parentPort.postMessage(msg);
await import('../src/worker.js');
parentPort.on('message', (data) => globalThis.self.onmessage({ data }));
