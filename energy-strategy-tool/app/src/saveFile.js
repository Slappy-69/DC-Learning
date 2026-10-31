/* global __HOSTED__ */
// Saving a file the app made (PDF report, study file, run log).
//
// Single file and Windows program: the browser's download (the Windows program turns it into a save dialog; see
// packaging/desktop/app/lib/guards.js).
//
// Hosted page (the phone version, owner 2026-10-30): a host's frame ignores downloads the page starts itself. The host
// offers saving through its "downloads" capability instead (claude.use('downloads').save({ filename, data })); the
// viewer confirms each save, or declines it. Without that capability the page offers no save (the run log is copied
// instead, RunProgress.jsx).
//
// __HOSTED__ is written out at each use (see RunProgress.jsx): esbuild folds it, so the hosted bundle keeps no browser
// download code and the other bundles no capability code (test 14 checks both).

let hostNs = null; // the host's downloads namespace, once it has answered
let hostPromise = null;

// Resolves the host's downloads namespace, or null when this view cannot save (no host, not granted, or not served).
export function hostDownloads() {
  return __HOSTED__ ? askHost() : Promise.resolve(null);
}

function askHost() {
  if (!hostPromise) {
    const c = typeof window !== 'undefined' ? window.claude : null;
    hostPromise = c && typeof c.use === 'function'
      ? Promise.resolve().then(() => c.use('downloads')).then((ns) => { hostNs = ns || null; return hostNs; }, () => null)
      : Promise.resolve(null);
  }
  return hostPromise;
}

function saveThroughHost(name, data) {
  if (!hostNs) return Promise.reject({ code: 'unavailable', message: 'Saving files is not available in this view.' });
  // A Uint8Array view is copied by the host; a string is saved as UTF-8.
  return hostNs.save({ filename: name, data });
}

function saveThroughBrowser(name, data, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve({ status: 'saved' });
}

// Offers the file. Resolves { status: 'saved' } (the browser download started, or the viewer accepted the host's save);
// rejects { code, message } in the hosted page when the viewer declines or the host refuses.
export function saveFile(name, data, type) {
  return __HOSTED__ ? saveThroughHost(name, data) : saveThroughBrowser(name, data, type);
}

// Plain words for a refused hosted save.
export function saveRefusal(e, what) {
  const code = e && e.code;
  if (code === 'declined') return `${what} not saved: the save was declined.`;
  if (code === 'rate_limited') return `${what} not saved: another save is still waiting for an answer. Try again in a moment.`;
  if (code === 'too_large') return `${what} not saved: the file is too large for this view.`;
  return `${what} could not be saved in this view${e && e.message ? ` (${e.message})` : ''}.`;
}
