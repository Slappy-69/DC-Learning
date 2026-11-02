// Stages the desktop app for packaging: Electron main-process source (desktop/app) + the unmodified single-file web
// app + build-info.json (versions, web app hash and the Content-Security-Policy computed for it) + icons.
//
// Usage: node desktop/stage.mjs [--input <energy-tool-single-file.html>] [--out <dir>] [--version <x.y.z>]
//   --out default out/.stage (emptied first). Produces <out>/app (what goes into app.asar) and <out>/build-resources
//   (icon.ico, icon.icns, icon.png for the packagers; not shipped inside the app).
// Also used by build-desktop.mjs and by the GitHub Actions workflow (electron-builder).
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { APP_ID, APP_NAME, DEFAULT_SINGLE_FILE, ICONS_DIR, PACKAGING_ROOT, args, engineVersionFromHtml, numericVersion, sha256, sha256b64 } from '../lib/common.mjs';

export const CONFIG = JSON.parse(readFileSync(join(PACKAGING_ROOT, 'desktop', 'desktop-config.json'), 'utf8'));

/** CSP for the bundled page: its inline scripts by SHA-256 hash, inline styles, blob: workers, nothing remote. */
export function cspFor(html) {
  const scripts = [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script\s*>/gi)];
  if (!scripts.length) throw new Error('no inline scripts found in the web app');
  for (const m of scripts) if (m[1] && /\bsrc\s*=/i.test(m[1])) throw new Error(`the web app loads an external script (${m[1].trim()}): use the single-file build`);
  // The HTML parser turns CR LF and CR into LF before the script text is hashed by the browser.
  const hashes = scripts.map((m) => `'sha256-${sha256b64(Buffer.from(m[2].replace(/\r\n?/g, '\n'), 'utf8'))}'`);
  const csp = [
    "default-src 'none'",
    `script-src ${hashes.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' blob: data:",
    'worker-src blob:',
    'child-src blob:',
    "frame-src 'none'",
    "object-src 'none'",
    "media-src 'none'",
    "manifest-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
  return { csp, hashes };
}

// Bundled NOAA station years (OPEN-QUESTIONS 114: the Windows program only), from the latest full "Weather data" run.
// Copied next to the page when present. Without one, an empty station list goes there instead (owner's choice B,
// OPEN-QUESTIONS 131, known issue 35), so the page never asks for a missing file: it finds no stations, says they are
// missing (R3 M5) and uses the EPW upload or the synthetic profile. build-info.json records which of the two it is.
export const DEFAULT_WEATHER = join(PACKAGING_ROOT, 'weather', 'weather-stations.json.gz');
export const EMPTY_STATIONS = { source: 'none: this build carries no NOAA station years (no full "Weather data" build was available)', stations: [] };

export function stage({ input = DEFAULT_SINGLE_FILE, out = join(PACKAGING_ROOT, 'out', '.stage'), version, weather = DEFAULT_WEATHER } = {}) {
  input = resolve(input);
  out = resolve(out);
  if (!existsSync(input)) throw new Error(`input not found: ${input} (build the web app first: npm run build in the app folder)`);
  const html = readFileSync(input, 'utf8');
  if (!/<div id="root">/.test(html) || /src="app\.js"|["'`]worker\.js["'`]/.test(html)) throw new Error('input is not the single-file web app build');
  const full = version || engineVersionFromHtml(html);
  const numeric = numericVersion(full);
  const { csp, hashes } = cspFor(html);
  for (const f of ['icon.ico', 'icon.icns', 'icon-linux-512.png']) if (!existsSync(join(ICONS_DIR, f))) throw new Error(`icon missing: ${f} (run node icons/build-icons.mjs)`);

  rmSync(out, { recursive: true, force: true });
  const app = join(out, 'app');
  const res = join(out, 'build-resources');
  mkdirSync(join(app, 'web'), { recursive: true });
  mkdirSync(join(app, 'icons'), { recursive: true });
  mkdirSync(res, { recursive: true });
  const src = join(PACKAGING_ROOT, 'desktop', 'app');
  copyFileSync(join(src, 'main.js'), join(app, 'main.js'));
  cpSync(join(src, 'lib'), join(app, 'lib'), { recursive: true });
  copyFileSync(input, join(app, 'web', 'index.html'));
  let weatherInfo = null;
  let weatherPlaceholder = null;
  if (weather && existsSync(weather)) {
    copyFileSync(weather, join(app, 'web', 'weather-stations.json.gz'));
    const summary = join(weather, '..', 'weather-summary.json');
    weatherInfo = { file: 'weather-stations.json.gz', sha256: sha256(readFileSync(weather)), bytes: readFileSync(weather).length, stations: existsSync(summary) ? JSON.parse(readFileSync(summary, 'utf8')).stations : null };
  } else {
    const empty = gzipSync(Buffer.from(`${JSON.stringify(EMPTY_STATIONS)}\n`));
    writeFileSync(join(app, 'web', 'weather-stations.json.gz'), empty);
    weatherPlaceholder = { file: 'weather-stations.json.gz', sha256: sha256(empty), bytes: empty.length, stations: 0 };
  }
  copyFileSync(join(ICONS_DIR, 'icon-linux-512.png'), join(app, 'icons', 'icon.png'));
  copyFileSync(join(ICONS_DIR, 'icon.ico'), join(res, 'icon.ico'));
  copyFileSync(join(ICONS_DIR, 'icon.icns'), join(res, 'icon.icns'));
  copyFileSync(join(ICONS_DIR, 'icon-linux-512.png'), join(res, 'icon.png'));

  const pkg = {
    name: CONFIG.packageName,
    productName: APP_NAME,
    version: full,
    description: CONFIG.description,
    author: CONFIG.author,
    main: 'main.js',
    private: true,
  };
  writeFileSync(join(app, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  const info = { name: APP_NAME, appId: APP_ID, version: full, engineVersion: full, numericVersion: numeric, webSha256: sha256(readFileSync(input)), csp, scriptHashes: hashes, weatherStations: weatherInfo, weatherPlaceholder };
  writeFileSync(join(app, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`);
  return { out, app, resources: res, version: full, numeric, csp, info };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = args();
  const r = stage({ input: a.input || DEFAULT_SINGLE_FILE, out: a.out, version: a.version, weather: a.weather || DEFAULT_WEATHER });
  console.log(`Staged ${APP_NAME} ${r.version} (numeric ${r.numeric}) in ${r.out}\nCSP: ${r.csp}`);
}
