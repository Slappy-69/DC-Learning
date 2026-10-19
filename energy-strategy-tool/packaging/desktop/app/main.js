'use strict';
// Concept Energy Optioneering: desktop shell (Electron main process).
// Loads the bundled single-file web app from app://bundle/index.html in a sandboxed window with no Node.js access,
// no network, no telemetry and no automatic updates. Everything the model does runs inside the page, on this computer.
const fs = require('node:fs');
const path = require('node:path');
const { BrowserWindow, Menu, app, dialog, nativeImage, nativeTheme, protocol, session } = require('electron');
const { WindowState } = require('./lib/window-state');
const { buildMenu } = require('./lib/menu');
const { ORIGIN, registerScheme, serveBundle, lockSession, guardContents, handleDownloads } = require('./lib/guards');

// build-info.json is written by stage.mjs: versions, the SHA-256 of the bundled web app and the CSP for it.
const INFO = JSON.parse(fs.readFileSync(path.join(__dirname, 'build-info.json'), 'utf8'));
const START_URL = `${ORIGIN}/index.html`;
const ICON = path.join(__dirname, 'icons', 'icon.png');

// No network at all: no host name resolves and proxy settings are ignored, so nothing can leave this computer, including
// requests Chromium makes by itself (Electron fetches spell-check dictionaries from redirector.gvt1.com at start-up,
// before the session's spell checker can be switched off). The webRequest filter and the page's CSP block requests too.
app.commandLine.appendSwitch('host-resolver-rules', 'MAP * ~NOTFOUND');
app.commandLine.appendSwitch('no-proxy-server');

registerScheme(protocol);
// The window sets sandbox: true and Electron sandboxes every other renderer by default. app.enableSandbox() is not
// used: it stops --no-sandbox reaching child processes, which breaks the app for anyone who must run it as root.
if (process.platform === 'win32') app.setAppUserModelId(INFO.appId);

let mainWindow = null;

function showAbout() {
  const detail = [
    `Version ${app.getVersion()} (model engine ${INFO.engineVersion})`,
    `Web app build ${INFO.webSha256.slice(0, 12)}`,
    `Electron ${process.versions.electron}, Chromium ${process.versions.chrome}, Node.js ${process.versions.node}`,
    '',
    'Concept-stage data centre energy optioneering. The model runs entirely on this computer: the app makes no network connections, sends no telemetry and does not update itself.',
  ].join('\n');
  const opts = { type: 'info', title: `About ${app.name}`, message: app.name, detail, buttons: ['OK'], noLink: true };
  if (process.platform !== 'darwin') { try { opts.icon = nativeImage.createFromPath(ICON); } catch { /* default icon */ } }
  return mainWindow && !mainWindow.isDestroyed() ? dialog.showMessageBox(mainWindow, opts) : dialog.showMessageBox(opts);
}

function forwardConsole(win) {
  // Page warnings and errors go to this process's output (seen when started from a terminal; used by the tests).
  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    const lv = typeof e.level === 'string' ? e.level : ['debug', 'info', 'warning', 'error'][level] || String(level);
    if (lv !== 'warning' && lv !== 'error') return;
    const msg = e.message !== undefined ? e.message : message;
    const ln = e.lineNumber !== undefined ? e.lineNumber : line;
    const src = e.sourceId !== undefined ? e.sourceId : sourceId;
    console.log(`[renderer:${lv}] ${msg}${src ? ` (${String(src).slice(0, 80)}:${ln})` : ''}`);
  });
}

function createWindow(state) {
  const s = state.load();
  const win = new BrowserWindow({
    x: s.x,
    y: s.y,
    width: s.width,
    height: s.height,
    minWidth: 360,
    minHeight: 400,
    show: false,
    title: app.name,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#15171a' : '#f6f5f1',
    icon: process.platform === 'linux' ? ICON : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: false,
      navigateOnDragDrop: false,
      spellcheck: false,
      safeDialogs: true,
      // Keep a model run going at full speed while the window is in the background or minimised.
      backgroundThrottling: false,
    },
  });
  state.track(win);
  forwardConsole(win);
  win.once('ready-to-show', () => {
    if (s.maximized) win.maximize();
    win.show();
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error(`[renderer] gone: ${details.reason} (exit code ${details.exitCode})`);
    if (details.reason === 'clean-exit' || win.isDestroyed()) return;
    const choice = dialog.showMessageBoxSync(win, {
      type: 'error',
      title: app.name,
      message: 'The tool stopped unexpectedly.',
      detail: `Reason: ${details.reason}. Reload to start again; inputs that were not saved are lost.`,
      buttons: ['Reload', 'Quit'],
      defaultId: 0,
      cancelId: 1,
    });
    if (choice === 0) win.reload(); else app.quit();
  });
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });
  win.loadURL(START_URL);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  // Another copy is already running: it is brought to the front (second-instance below) and this one quits.
  app.quit();
} else {
  app.on('second-instance', () => {
    console.log('[app] a second copy was started: showing this window instead');
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.on('web-contents-created', (_e, contents) => guardContents(contents));
  app.whenReady().then(() => {
    const ses = session.defaultSession;
    lockSession(ses);
    serveBundle(protocol, path.join(__dirname, 'web'), INFO.csp);
    handleDownloads(ses, () => mainWindow);
    Menu.setApplicationMenu(buildMenu({ appName: app.name, onAbout: showAbout }));
    const state = new WindowState(app.getPath('userData'));
    mainWindow = createWindow(state);
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) mainWindow = createWindow(state); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
