'use strict';
// Remembers the main window's size, position and maximised state in <userData>/window-state.json.
// A saved position is used only if the window would still be mostly visible on a connected display (a monitor may
// have been unplugged since); otherwise the window opens centred at the saved (or default) size.
const fs = require('node:fs');
const path = require('node:path');
const { screen } = require('electron');

const MIN_VISIBLE_W = 200;
const MIN_VISIBLE_H = 120;

class WindowState {
  constructor(dir, { width = 1400, height = 900 } = {}) {
    this.file = path.join(dir, 'window-state.json');
    this.defaults = { width, height };
    this.timer = null;
  }

  load() {
    const work = screen.getPrimaryDisplay().workAreaSize;
    const fallback = { width: Math.min(this.defaults.width, Math.round(work.width * 0.92)), height: Math.min(this.defaults.height, Math.round(work.height * 0.92)), maximized: false };
    let s;
    try { s = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch { return fallback; }
    const num = (v) => (Number.isFinite(v) ? Math.round(v) : null);
    const width = num(s.width);
    const height = num(s.height);
    if (!width || !height || width < 200 || height < 200) return fallback;
    const out = { width, height, maximized: !!s.maximized };
    const x = num(s.x);
    const y = num(s.y);
    if (x !== null && y !== null && this.visible({ x, y, width, height })) { out.x = x; out.y = y; }
    return out;
  }

  visible(r) {
    return screen.getAllDisplays().some(({ workArea: w }) => {
      const ix = Math.min(r.x + r.width, w.x + w.width) - Math.max(r.x, w.x);
      const iy = Math.min(r.y + r.height, w.y + w.height) - Math.max(r.y, w.y);
      return ix >= MIN_VISIBLE_W && iy >= MIN_VISIBLE_H;
    });
  }

  track(win) {
    const later = () => { clearTimeout(this.timer); this.timer = setTimeout(() => this.save(win), 600); };
    win.on('resize', later);
    win.on('move', later);
    win.on('maximize', later);
    win.on('unmaximize', later);
    win.on('close', () => { clearTimeout(this.timer); this.save(win); });
  }

  save(win) {
    if (win.isDestroyed() || win.isMinimized() || win.isFullScreen()) return;
    const maximized = win.isMaximized();
    // getNormalBounds: the size and place the window returns to when un-maximised.
    const b = maximized ? win.getNormalBounds() : win.getBounds();
    const data = JSON.stringify({ x: b.x, y: b.y, width: b.width, height: b.height, maximized });
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, data);
      fs.renameSync(tmp, this.file);
    } catch (e) {
      console.warn(`[window-state] not saved: ${e.message}`);
    }
  }
}

module.exports = { WindowState };
