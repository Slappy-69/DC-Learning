'use strict';
// Security guards for the desktop shell:
// - app://bundle/ protocol serving only the bundled web files, with the Content-Security-Policy as a response header
// - every permission denied except clipboard write (the run log copy); device pickers refused
// - every http(s)/ws(s)/ftp request from the page cancelled (the app needs no network; the CSP blocks it too)
// - navigation and new windows outside the app blocked; http(s) links go to the default browser
// - downloads (the run log) go through a save dialog, and only from the app itself
const fs = require('node:fs');
const path = require('node:path');
const { BrowserWindow, Menu, app, dialog, shell } = require('electron');

const SCHEME = 'app';
const HOST = 'bundle';
const ORIGIN = `${SCHEME}://${HOST}`;
const ALLOWED_PERMISSIONS = new Set(['clipboard-sanitized-write']);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
// Features the page never needs, switched off for it and anything it might embed (the permission handler refuses them too).
const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), usb=(), serial=(), hid=(), midi=(), payment=(), display-capture=()';

const isAppUrl = (u) => {
  try { const x = new URL(u); return x.protocol === `${SCHEME}:` && x.host === HOST; } catch { return false; }
};

function openIfWeb(u) {
  let x;
  try { x = new URL(u); } catch { return false; }
  if (x.protocol !== 'https:' && x.protocol !== 'http:') return false;
  shell.openExternal(x.href).catch((e) => console.warn(`[nav] could not open ${x.href} in the default browser: ${e.message}`));
  return true;
}

function registerScheme(protocol) {
  // Must run before the app is ready. "standard" gives the page a real origin (app://bundle), needed for its blob:
  // workers; "secure" makes it a secure context (clipboard); no service workers, no CORS access from elsewhere.
  protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, codeCache: true } }]);
}

function serveBundle(protocol, webRoot, csp) {
  const root = path.resolve(webRoot);
  const notFound = () => new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  protocol.handle(SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      if (url.host !== HOST || (request.method !== 'GET' && request.method !== 'HEAD')) return notFound();
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/' || rel === '') rel = '/index.html';
      const file = path.resolve(root, `.${rel}`);
      if (!file.startsWith(root + path.sep)) return notFound();
      const body = await fs.promises.readFile(file);
      return new Response(request.method === 'HEAD' ? null : body, {
        status: 200,
        headers: {
          'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'content-security-policy': csp,
          'permissions-policy': PERMISSIONS_POLICY,
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'no-referrer',
          'cross-origin-opener-policy': 'same-origin',
          'cache-control': 'no-cache',
        },
      });
    } catch {
      return notFound();
    }
  });
}

function lockSession(ses) {
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    const ok = ALLOWED_PERMISSIONS.has(permission) && isAppUrl((details && details.requestingUrl) || (wc && wc.getURL()) || '');
    if (!ok) console.log(`[permission] denied ${permission}`);
    callback(ok);
  });
  ses.setPermissionCheckHandler((wc, permission, requestingOrigin) => ALLOWED_PERMISSIONS.has(permission) && requestingOrigin === ORIGIN);
  // Device pickers (HID, serial, USB, Bluetooth): no select-* listeners are registered, so Electron cancels every
  // request; the check handler above and the Permissions-Policy header refuse them as well.
  ses.setDevicePermissionHandler(() => false);
  ses.setSpellCheckerEnabled(false); // no dictionary downloads
  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] }, (details, callback) => {
    console.log(`[net] blocked ${details.method} ${details.url}`);
    callback({ cancel: true });
  });
}

function guardContents(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    const ext = openIfWeb(url);
    console.log(`[nav] blocked new window for ${url}${ext ? ' (opened in the default browser)' : ''}`);
    return { action: 'deny' };
  });
  contents.on('will-attach-webview', (event) => event.preventDefault());
  if (contents.getType() === 'devtools') return;
  contents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    const ext = openIfWeb(url);
    console.log(`[nav] blocked navigation to ${url}${ext ? ' (opened in the default browser)' : ''}`);
  });
  contents.on('will-frame-navigate', (event) => {
    if (event.isMainFrame || isAppUrl(event.url)) return;
    event.preventDefault();
    console.log(`[nav] blocked frame navigation to ${event.url}`);
  });
  contents.on('will-redirect', (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    console.log(`[nav] blocked redirect to ${url}`);
  });
  // Cut/copy/paste on right-click in text fields, copy for selected text (Electron has no default context menu).
  contents.on('context-menu', (_event, params) => {
    const f = params.editFlags || {};
    let items = [];
    if (params.isEditable) {
      items = [{ role: 'undo', enabled: !!f.canUndo }, { role: 'redo', enabled: !!f.canRedo }, { type: 'separator' }, { role: 'cut', enabled: !!f.canCut }, { role: 'copy', enabled: !!f.canCopy }, { role: 'paste', enabled: !!f.canPaste }, { type: 'separator' }, { role: 'selectAll' }];
    } else if (params.selectionText && params.selectionText.trim()) {
      items = [{ role: 'copy' }, { type: 'separator' }, { role: 'selectAll' }];
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: BrowserWindow.fromWebContents(contents) || undefined });
  });
}

const safeName = (n) => (String(n || 'download').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/^\.+/, '').slice(0, 180) || 'download');

function handleDownloads(ses, getWindow) {
  let lastDir = null;
  ses.on('will-download', (event, item, wc) => {
    const src = item.getURL();
    if (!(src.startsWith(`blob:${ORIGIN}/`) || src.startsWith('data:'))) {
      event.preventDefault();
      console.log(`[download] refused (not from the app): ${src.slice(0, 120)}`);
      return;
    }
    const name = safeName(item.getFilename());
    const ext = path.extname(name).slice(1).toLowerCase();
    const filters = [];
    if (ext === 'json') filters.push({ name: 'JSON', extensions: ['json'] });
    else if (ext === 'csv') filters.push({ name: 'CSV (comma-separated values)', extensions: ['csv'] });
    filters.push({ name: 'All files', extensions: ['*'] });
    const win = (wc && BrowserWindow.fromWebContents(wc)) || getWindow();
    let downloads;
    try { downloads = app.getPath('downloads'); } catch { downloads = app.getPath('home'); }
    // Synchronous on purpose: the save path must be set before this handler returns (the page keeps running).
    const target = dialog.showSaveDialogSync(win, {
      title: /^run-log/.test(name) ? 'Save run log' : 'Save file',
      defaultPath: path.join(lastDir || downloads, name),
      filters,
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    if (!target) { item.cancel(); console.log(`[download] cancelled: ${name}`); return; }
    lastDir = path.dirname(target);
    item.setSavePath(target);
    item.once('done', (_e, state) => {
      console.log(`[download] ${state}: ${target}`);
      if (state !== 'completed' && win && !win.isDestroyed()) {
        dialog.showMessageBox(win, { type: 'warning', title: 'Not saved', message: 'The file was not saved.', detail: `${target}\n(${state})` });
      }
    });
  });
}

module.exports = { SCHEME, HOST, ORIGIN, isAppUrl, registerScheme, serveBundle, lockSession, guardContents, handleDownloads };
