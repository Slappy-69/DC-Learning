'use strict';
// Minimal application menu: Reload, zoom, full screen, About and Quit, plus the standard Edit commands (macOS needs
// them in the menu for copy and paste to work in text fields). Developer Tools stay available for diagnosing a
// problem in this local app (they can only do what the page itself can do: no Node.js, sandboxed).
const { Menu } = require('electron');

function buildMenu({ appName, onAbout }) {
  const isMac = process.platform === 'darwin';
  const about = { label: isMac ? `About ${appName}` : `&About ${appName}`, click: onAbout };
  const template = [];
  if (isMac) {
    template.push({ label: appName, submenu: [about, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] });
  } else {
    template.push({ label: '&File', submenu: [{ role: 'quit', label: process.platform === 'win32' ? 'E&xit' : '&Quit' }] });
  }
  template.push({ label: '&Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] });
  template.push({
    label: '&View',
    submenu: [
      { role: 'reload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomIn', accelerator: 'CommandOrControl+=', visible: false, acceleratorWorksWhenHidden: true },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
      { role: 'toggleDevTools' },
    ],
  });
  if (isMac) template.push({ role: 'windowMenu' });
  else template.push({ label: '&Help', submenu: [about] });
  return Menu.buildFromTemplate(template);
}

module.exports = { buildMenu };
