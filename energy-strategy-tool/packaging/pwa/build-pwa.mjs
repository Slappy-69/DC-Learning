// Builds the installable web app (PWA) from the single-file web app build.
//
// Usage: node pwa/build-pwa.mjs [--input <energy-tool-single-file.html>] [--out <dir>] [--version <x.y.z>]
//   --input   default ../app/dist/energy-tool-single-file.html (relative to the packaging folder)
//   --out     default out/pwa (emptied first)
//   --version default: read from the bundle (engineVersion)
//
// Output (every path relative, so the folder works under https://slappy-69.github.io/DC-Learning/ or any other path):
//   index.html             the single-file app with manifest, theme-color, icon links, the update-notice style and the
//                          service-worker registration injected (the app's own markup and scripts are unchanged)
//   manifest.webmanifest   web app manifest
//   sw.js                  service worker; VERSION = hash of index.html and the other shell files
//   icons/                 PNG icons (192, 512, maskable 512, apple-touch 180, favicon 32) and the SVG favicon
//   version.json           engine version, service-worker version and the SHA-256 of the input (not cached by the worker)
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { APP_NAME, DEFAULT_SINGLE_FILE, ICONS_DIR, PACKAGING_ROOT, args, engineVersionFromHtml, sha256 } from '../lib/common.mjs';

const a = args();
const INPUT = resolve(a.input || DEFAULT_SINGLE_FILE);
const OUT = resolve(a.out || join(PACKAGING_ROOT, 'out', 'pwa'));
const HERE = join(PACKAGING_ROOT, 'pwa');

export const SHORT_NAME = 'Optioneering'; // 12 characters
export const COLORS = {
  background: '#f6f5f1', // app --bg (light)
  themeLight: '#ffffff', // app top bar --surface (light)
  themeDark: '#1e2125', // app top bar --surface (dark)
};
const DESCRIPTION = 'Concept-stage data centre energy optioneering: site inputs, hourly dispatch, option generation and scoring, trade-offs, site layout, dispatch and sensitivity. Runs on the device and works offline once installed.';
const ICONS = ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon-180.png', 'favicon-32.png', 'icon.svg'];

if (!existsSync(INPUT)) throw new Error(`input not found: ${INPUT} (build the web app first: npm run build in the app folder)`);
for (const f of ICONS) if (!existsSync(join(ICONS_DIR, f))) throw new Error(`icon missing: ${join(ICONS_DIR, f)} (run node icons/build-icons.mjs)`);

const src = readFileSync(INPUT, 'utf8');
// Guard: this must be the self-contained single-file build (no app.js/app.css/worker.js references, no remote loads).
if (!/<div id="root">/.test(src)) throw new Error('input has no <div id="root">: not the web app build');
if (/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(src.slice(0, src.indexOf('<script>') > 0 ? src.indexOf('<script>') : src.length))) throw new Error('input loads external scripts or styles: use energy-tool-single-file.html');
if (/["'`]worker\.js["'`]|src="app\.js"|href="app\.css"/.test(src)) throw new Error('input references app.js, app.css or worker.js: use energy-tool-single-file.html');
const version = a.version || engineVersionFromHtml(src);

// Injection points: the first </head> (before any script) and the last </body> (after the app's scripts; the bundle
// may contain the text "</body>" in a string, so the last occurrence is the document's).
const headAt = src.indexOf('</head>');
const firstScript = src.indexOf('<script');
const bodyAt = src.lastIndexOf('</body>');
if (headAt < 0 || bodyAt < 0 || (firstScript >= 0 && headAt > firstScript)) throw new Error('could not find </head> before the scripts and a closing </body>');

const css = readFileSync(join(HERE, 'update-notice.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '');
const reg = readFileSync(join(HERE, 'register-sw.js'), 'utf8');
if (/<\/script|<!--/i.test(reg) || /<\/style/i.test(css)) throw new Error('injected snippet contains a closing tag sequence');

const head = [
  '<link rel="manifest" href="manifest.webmanifest" />',
  `<meta name="theme-color" content="${COLORS.themeLight}" media="(prefers-color-scheme: light)" />`,
  `<meta name="theme-color" content="${COLORS.themeDark}" media="(prefers-color-scheme: dark)" />`,
  '<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png" />',
  '<link rel="icon" href="icons/icon.svg" type="image/svg+xml" />',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon-180.png" sizes="180x180" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  `<meta name="apple-mobile-web-app-title" content="${SHORT_NAME}" />`,
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  `<meta name="application-name" content="${APP_NAME}" />`,
  `<style>${css}</style>`,
].map((l) => `  ${l}\n`).join('');
const html = `${src.slice(0, headAt)}  <!-- PWA (packaging/pwa/build-pwa.mjs) -->\n${head}${src.slice(headAt, bodyAt)}<script>\n${reg}</script>\n${src.slice(bodyAt)}`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'icons'), { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);
for (const f of ICONS) copyFileSync(join(ICONS_DIR, f), join(OUT, 'icons', f));

const manifest = {
  id: 'concept-energy-optioneering',
  name: APP_NAME,
  short_name: SHORT_NAME,
  description: DESCRIPTION,
  lang: 'en-GB',
  dir: 'ltr',
  start_url: '.',
  scope: '.',
  display: 'standalone',
  orientation: 'any',
  background_color: COLORS.background,
  theme_color: COLORS.themeLight,
  categories: ['productivity', 'utilities', 'business'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
};
writeFileSync(join(OUT, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

// Shell = everything the app needs offline. The version hashes index.html first, then the other shell files, so any
// change to the app (or its icons/manifest) gives a new cache and an update notice.
const shell = ['index.html', 'manifest.webmanifest', ...ICONS.map((f) => `icons/${f}`)];
const swVersion = sha256(Buffer.concat(shell.map((f) => Buffer.concat([Buffer.from(`${f}\n`), readFileSync(join(OUT, f))])))).slice(0, 16);
let sw = readFileSync(join(HERE, 'sw.template.js'), 'utf8');
if (!sw.includes("'%%VERSION%%'") || !sw.includes('/*%%SHELL%%*/ []')) throw new Error('sw.template.js placeholders missing');
sw = sw.replace("'%%VERSION%%'", `'${swVersion}'`).replace('/*%%SHELL%%*/ []', JSON.stringify(shell));
writeFileSync(join(OUT, 'sw.js'), sw);

const info = { app: APP_NAME, engineVersion: version, swVersion, input: basename(INPUT), inputSha256: sha256(readFileSync(INPUT)), indexSha256: sha256(readFileSync(join(OUT, 'index.html'))), shell };
writeFileSync(join(OUT, 'version.json'), `${JSON.stringify(info, null, 2)}\n`);

let total = 0;
for (const f of [...shell, 'sw.js', 'version.json']) {
  const s = statSync(join(OUT, f)).size;
  total += s;
  console.log(`${f.padEnd(32)} ${(s / 1024).toFixed(1).padStart(8)} KB`);
}
console.log(`PWA built: ${OUT}\nengine ${version}, service worker version ${swVersion}, ${(total / 1024).toFixed(1)} KB in total`);
