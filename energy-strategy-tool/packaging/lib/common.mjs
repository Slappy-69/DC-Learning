// Shared helpers for the packaging scripts: paths, the engine version read from the built web app, hashing,
// Playwright/Chromium resolution and a small static file server for tests.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGING_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Default input: the app's dist folder next to this packaging folder (../app/dist), as in /home/claude/build and in the repo.
export const DEFAULT_DIST = resolve(PACKAGING_ROOT, '..', 'app', 'dist');
export const DEFAULT_SINGLE_FILE = join(DEFAULT_DIST, 'energy-tool-single-file.html');
export const ICONS_DIR = join(PACKAGING_ROOT, 'icons', 'generated');

export const APP_NAME = 'Concept Energy Optioneering';
export const APP_ID = 'io.github.slappy-69.concept-energy-optioneering';

const require = createRequire(import.meta.url);

/** Parses --key value and --flag arguments. */
export function args(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
export const sha256b64 = (buf) => createHash('sha256').update(buf).digest('base64');

/**
 * Reads the engine version from the built single-file app. The minified bundle passes the version as
 * engineVersion:<ident> and declares <ident>="x.y.z[-tag]"; identifiers change between builds, so they are resolved
 * rather than hard-coded. Every occurrence must agree (the bundle and its inlined worker both carry the engine).
 */
export function engineVersionFromHtml(html) {
  const idents = [...new Set([...html.matchAll(/engineVersion:([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))];
  const versions = new Set();
  for (const id of idents) {
    const esc = id.replace(/\$/g, '\\$');
    for (const m of html.matchAll(new RegExp(`(?:^|[^\\w$.])${esc}\\s*=\\s*"(\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?)"`, 'g'))) versions.add(m[1]);
  }
  if (versions.size !== 1) throw new Error(`could not read one engine version from the bundle (found ${versions.size ? [...versions].join(', ') : 'none'}); pass --version x.y.z`);
  return [...versions][0];
}

/** Splits "0.2.0-site" into the numeric core used where platforms need numbers only (Windows file version, macOS bundle version). */
export function numericVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
  if (!m) throw new Error(`not a semantic version: ${v}`);
  return `${m[1]}.${m[2]}.${m[3]}`;
}

export function loadPlaywright() {
  for (const base of [PACKAGING_ROOT, process.cwd(), '/home/claude']) {
    try { return require(require.resolve('playwright', { paths: [base] })); } catch { /* next */ }
  }
  try { return require('playwright'); } catch { /* fall through */ }
  throw new Error('Playwright is not resolvable (require("playwright")); install it or set NODE_PATH');
}

/** Launches Chromium; falls back to an explicit executable under PLAYWRIGHT_BROWSERS_PATH or /opt/pw-browsers. */
export async function launchChromium(pw, opts = {}) {
  const base = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], ...opts };
  try { return await pw.chromium.launch(base); } catch (e1) {
    const exe = findChromium();
    if (exe) return pw.chromium.launch({ ...base, executablePath: exe });
    throw e1;
  }
}
export function findChromium() {
  for (const r of [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean)) {
    if (!existsSync(r)) continue;
    for (const d of readdirSync(r).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      const exe = join(r, d, 'chrome-linux', 'chrome');
      if (existsSync(exe)) return exe;
    }
  }
  return null;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};
export const contentType = (p) => TYPES[extname(p).toLowerCase()] || 'application/octet-stream';

/**
 * Static server for tests that mimics GitHub Pages for a project site: files are served under a path prefix
 * (default /DC-Learning/), with Cache-Control: max-age=600 as Pages sends, and a 404 for everything else.
 * The served folder can be swapped at run time (server.setRoot) to simulate a new deployment.
 */
export function startStaticServer({ root, prefix = '/DC-Learning/', port = 0 } = {}) {
  let current = resolve(root);
  let down = false;
  const log = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    log.push(`${req.method} ${url.pathname}${down ? ' (refused: server down)' : ''}`);
    // "Down": the connection is reset, as when the device has no network. Page-level offline emulation does not
    // cover requests the browser makes itself (such as the service-worker update check), so tests use both.
    if (down) { req.socket.destroy(); return; }
    if (!url.pathname.startsWith(prefix)) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); return; }
    let rel = decodeURIComponent(url.pathname.slice(prefix.length));
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = normalize(join(current, rel));
    if (!file.startsWith(current + sep) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); return; }
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': contentType(file), 'content-length': body.length, 'cache-control': 'max-age=600', etag: `"${sha256(body).slice(0, 16)}"` });
    if (req.method === 'HEAD') { res.end(); return; }
    res.end(body);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => {
    const { port: p } = server.address();
    ok({
      url: `http://localhost:${p}${prefix}`, port: p, log,
      setRoot: (r) => { current = resolve(r); },
      setDown: (d) => { down = !!d; },
      close: () => new Promise((c) => server.close(() => c())),
    });
  }));
}

export { createReadStream };
