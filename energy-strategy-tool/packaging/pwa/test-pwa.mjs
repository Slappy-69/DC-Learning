// Tests for the PWA build (out/pwa), in Chromium via Playwright, served from http://localhost (a secure context) under
// /DC-Learning/ with GitHub Pages' cache header (max-age=600), so absolute paths or HTTP-cache mistakes would show.
//
// Usage: node pwa/test-pwa.mjs [--dir out/pwa] [--input <energy-tool-single-file.html>] [--headed]
//   --input is used to make a second build (one byte different) for the update-notice test.
// Writes test-results/pwa.json. Exit code 1 if any check fails.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_SINGLE_FILE, PACKAGING_ROOT, args, findChromium, loadPlaywright, startStaticServer } from '../lib/common.mjs';

const a = args();
const DIR = resolve(a.dir || join(PACKAGING_ROOT, 'out', 'pwa'));
const INPUT = resolve(a.input || DEFAULT_SINGLE_FILE);
const TMP = mkdtempSync(join(tmpdir(), 'pwa-test-'));
const pw = loadPlaywright();
const results = [];
let failures = 0;

async function check(name, fn) {
  const t0 = Date.now();
  try {
    const info = await fn();
    results.push({ name, status: 'PASS', info: info || null });
    console.log(`PASS  ${name}  (${((Date.now() - t0) / 1000).toFixed(1)} s)${info ? `\n      ${info}` : ''}`);
  } catch (e) {
    failures++;
    results.push({ name, status: 'FAIL', error: String(e && e.stack || e) });
    console.log(`FAIL  ${name}\n      ${e && e.stack ? e.stack.split('\n').slice(0, 5).join('\n      ') : e}`);
  }
}
const ok = (cond, msg) => { if (!cond) throw new Error(msg); };

// Second build for the update test: the same input with one comment added, so index.html and the sw.js version change.
const input2 = join(TMP, 'input2.html');
writeFileSync(input2, readFileSync(INPUT, 'utf8').replace(/<\/html>\s*$/, '<!-- update test build -->\n</html>\n'));
execFileSync(process.execPath, [join(PACKAGING_ROOT, 'pwa', 'build-pwa.mjs'), '--input', input2, '--out', join(TMP, 'pwa2')], { stdio: 'pipe' });
const v1 = JSON.parse(readFileSync(join(DIR, 'version.json'), 'utf8')).swVersion;
const v2 = JSON.parse(readFileSync(join(TMP, 'pwa2', 'version.json'), 'utf8')).swVersion;

const server = await startStaticServer({ root: DIR, prefix: '/DC-Learning/' });
const BASE = server.url; // http://localhost:<port>/DC-Learning/
const launchOpts = { headless: !a.headed, args: ['--no-sandbox', '--disable-dev-shm-usage'], viewport: { width: 1280, height: 860 } };
let ctx;
try {
  ctx = await pw.chromium.launchPersistentContext(join(TMP, 'profile'), { ...launchOpts, channel: 'chromium' });
} catch {
  ctx = await pw.chromium.launchPersistentContext(join(TMP, 'profile'), { ...launchOpts, executablePath: findChromium() });
}
const browserVersion = ctx.browser() ? ctx.browser().version() : 'unknown';
console.log(`PWA tests: ${DIR}\nserved at ${BASE} (Pages-like prefix, max-age=600); Chromium ${browserVersion}; build v1 ${v1}, update build v2 ${v2}`);

const page = ctx.pages()[0] || await ctx.newPage();
page.setDefaultTimeout(60000);
let errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
const takeErrors = () => { const e = errors; errors = []; return e; };

async function waitForRun(p = page) {
  await p.waitForFunction(() => {
    const st = document.querySelector('.status');
    const t = st ? st.textContent : '';
    return /Run failed/.test(t) || (/Last run/.test(t) && !/Screening options/.test(t));
  }, null, { timeout: 180000, polling: 250 });
  const status = (await p.locator('.status').innerText()).replace(/\s+/g, ' ').trim();
  ok(!/Run failed/.test(status), `run failed: ${status}`);
  return status;
}
const swVersion = () => page.evaluate(() => new Promise((res) => {
  const c = navigator.serviceWorker.controller;
  if (!c) { res(null); return; }
  const ch = new MessageChannel();
  ch.port1.onmessage = (e) => res(e.data.version);
  c.postMessage({ type: 'GET_VERSION' }, [ch.port2]);
  setTimeout(() => res('no reply'), 3000);
}));
const myCaches = () => page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('ceo-shell:')));

await check('P1. App loads from the Pages-like server and a model run completes (online, first visit)', async () => {
  const res = await page.goto(BASE, { waitUntil: 'load' });
  ok(res.status() === 200, `status ${res.status()}`);
  const status = await waitForRun();
  const errs = takeErrors();
  ok(!errs.length, `errors: ${errs.join(' | ')}`);
  return status;
});

await check('P2. Manifest: fetched from the link, required fields present, every icon served at its declared size', async () => {
  const m = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    const r = await fetch(link.href);
    return { href: link.getAttribute('href'), status: r.status, type: r.headers.get('content-type'), json: await r.json() };
  });
  ok(m.href === 'manifest.webmanifest' && m.status === 200, `manifest link ${m.href} -> ${m.status}`);
  ok(/application\/manifest\+json/.test(m.type), `content type ${m.type}`);
  const j = m.json;
  ok(j.name === 'Concept Energy Optioneering', `name ${j.name}`);
  ok(typeof j.short_name === 'string' && j.short_name.length > 0 && j.short_name.length <= 12, `short_name "${j.short_name}" (${j.short_name && j.short_name.length} chars)`);
  ok(j.start_url === '.' && j.scope === '.', `start_url ${j.start_url}, scope ${j.scope}`);
  ok(j.display === 'standalone', `display ${j.display}`);
  ok(j.background_color === '#f6f5f1' && j.theme_color === '#ffffff', `colours ${j.background_color} / ${j.theme_color}`);
  ok(j.id && j.description, 'id or description missing');
  const want = [['192x192', 'any'], ['512x512', 'any'], ['512x512', 'maskable']];
  for (const [sizes, purpose] of want) ok(j.icons.some((i) => i.sizes === sizes && (i.purpose || 'any').split(' ').includes(purpose) && i.type === 'image/png'), `no ${purpose} PNG icon ${sizes}`);
  for (const i of j.icons) ok(!i.src.startsWith('/') && !/^https?:/.test(i.src), `icon path not relative: ${i.src}`);
  const dims = await page.evaluate(async (icons) => Promise.all(icons.map(async (i) => {
    const r = await fetch(new URL(i.src, new URL('manifest.webmanifest', location.href)));
    const b = await r.blob();
    if (i.type !== 'image/png') return { src: i.src, status: r.status, ok: r.status === 200 };
    const bmp = await createImageBitmap(b);
    return { src: i.src, status: r.status, w: bmp.width, h: bmp.height, sizes: i.sizes };
  })), j.icons);
  for (const d of dims) ok(d.status === 200 && (d.ok || `${d.w}x${d.h}` === d.sizes), `icon ${d.src}: status ${d.status}, ${d.w}x${d.h} (declared ${d.sizes})`);
  // Head links: theme-color for light and dark, apple-touch-icon, favicon; all relative.
  const head = await page.evaluate(() => ({
    themes: [...document.querySelectorAll('meta[name="theme-color"]')].map((x) => `${x.media}=${x.content}`),
    apple: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
    icons: [...document.querySelectorAll('link[rel="icon"]')].map((x) => x.getAttribute('href')),
    appleStatus: null,
  }));
  ok(head.themes.length === 2 && head.themes.some((t) => /light/.test(t)) && head.themes.some((t) => /dark/.test(t)), `theme-color metas: ${head.themes}`);
  ok(head.apple === 'icons/apple-touch-icon-180.png' && head.icons.includes('icons/favicon-32.png'), `icon links ${head.apple} ${head.icons}`);
  const statuses = await page.evaluate(async (hrefs) => Promise.all(hrefs.map(async (h) => (await fetch(h)).status)), [head.apple, ...head.icons]);
  ok(statuses.every((s) => s === 200), `icon link statuses ${statuses}`);
  return `short_name "${j.short_name}", id "${j.id}", ${j.icons.length} icons OK; theme-color ${head.themes.join(', ')}`;
});

await check('P3. Maskable icon keeps the mark inside the 40 % safe zone (pixel scan) and fills the canvas', async () => {
  const r = await page.evaluate(async () => {
    const b = await (await fetch('icons/icon-maskable-512.png')).blob();
    const bmp = await createImageBitmap(b);
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const g = c.getContext('2d');
    g.drawImage(bmp, 0, 0);
    const d = g.getImageData(0, 0, bmp.width, bmp.height).data;
    const bg = [d[0], d[1], d[2]];
    let maxR = 0; let transparent = 0;
    for (let y = 0; y < bmp.height; y++) for (let x = 0; x < bmp.width; x++) {
      const i = (y * bmp.width + x) * 4;
      if (d[i + 3] < 255) transparent++;
      if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 24) {
        maxR = Math.max(maxR, Math.hypot(x + 0.5 - bmp.width / 2, y + 0.5 - bmp.height / 2));
      }
    }
    return { maxR: maxR / bmp.width, transparent, bg };
  });
  ok(r.transparent === 0, `${r.transparent} transparent pixels (maskable must be full bleed)`);
  ok(r.maxR <= 0.4, `mark reaches ${(r.maxR * 100).toFixed(1)} % of the width from the centre (safe zone 40 %)`);
  return `mark within ${(r.maxR * 100).toFixed(1)} % of the width from the centre; background rgb(${r.bg.join(',')}), no transparency`;
});

await check('P4. Service worker registers, and controls the page after one reload (response from the worker)', async () => {
  const active = await page.evaluate(() => navigator.serviceWorker.ready.then((r) => ({ script: r.active.scriptURL, scope: r.scope })));
  ok(active.script === `${BASE}sw.js` && active.scope === BASE, `registration ${JSON.stringify(active)}`);
  const res = await page.reload({ waitUntil: 'load' });
  ok(res.fromServiceWorker(), 'reload response did not come from the service worker');
  const ctl = await page.evaluate(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL);
  ok(ctl === `${BASE}sw.js`, `controller ${ctl}`);
  const v = await swVersion();
  ok(v === v1, `worker version ${v}, expected ${v1}`);
  const keys = await myCaches();
  ok(keys.length === 1 && keys[0] === `ceo-shell:/DC-Learning/:${v1}`, `caches ${keys}`);
  const cached = await page.evaluate(async (k) => (await (await caches.open(k)).keys()).map((r) => new URL(r.url).pathname), keys[0]);
  const shell = JSON.parse(readFileSync(join(DIR, 'version.json'), 'utf8')).shell;
  for (const s of shell) ok(cached.includes(`/DC-Learning/${s}`), `not pre-cached: ${s}`);
  await waitForRun();
  const errs = takeErrors();
  ok(!errs.length, `errors: ${errs.join(' | ')}`);
  return `controller ${ctl}; cache ${keys[0]} holds ${cached.length} files`;
});

await check('P5. Other pages on the same site are not taken over (online: the server answers, not the app)', async () => {
  const p2 = await ctx.newPage();
  const res = await p2.goto(`${BASE}some-other-page.html`);
  const body = await p2.locator('body').innerText();
  ok(res.status() === 404 && !res.fromServiceWorker() && /not found/.test(body), `other page: status ${res.status()}, from worker ${res.fromServiceWorker()}`);
  await p2.close();
  return 'GET /DC-Learning/some-other-page.html -> 404 from the server';
});

await check('P6. Offline: a reload still loads the app from the cache and a full model run completes (in workers)', async () => {
  await ctx.setOffline(true);
  server.setDown(true);
  const before = server.log.length;
  const res = await page.reload({ waitUntil: 'load' });
  ok(res.fromServiceWorker(), 'offline reload not served by the worker');
  const status = await waitForRun();
  ok(/worker/.test(status), `run did not use workers: ${status}`);
  // The only request that may reach the network is the browser's own update check for sw.js (it fails while down).
  const attempts = server.log.slice(before);
  ok(attempts.every((l) => /^GET \/DC-Learning\/sw\.js /.test(l)), `app requests went to the network while offline: ${attempts}`);
  const errs = takeErrors().filter((e) => !/Failed to update a ServiceWorker|ERR_INTERNET_DISCONNECTED/.test(e));
  ok(!errs.length, `errors: ${errs.join(' | ')}`);
  // A page outside the app is not served from the app's cache while offline.
  const p2 = await ctx.newPage();
  let failed = false;
  try { await p2.goto(`${BASE}some-other-page.html`); } catch { failed = true; }
  await p2.close();
  ok(failed, 'offline navigation to another page was answered (it should fail: not part of the app)');
  await ctx.setOffline(false);
  server.setDown(false);
  takeErrors();
  return `${status} Network attempts while offline: ${attempts.length ? attempts.join(', ') : 'none'}`;
});

await check('P7. Installability: Page.getInstallabilityErrors returns none; Page.getAppManifest reports no errors', async () => {
  const cdp = await ctx.newCDPSession(page);
  const inst = await cdp.send('Page.getInstallabilityErrors');
  const man = await cdp.send('Page.getAppManifest');
  let appId = null;
  try { appId = await cdp.send('Page.getAppId'); } catch { /* older Chromium */ }
  await cdp.detach();
  ok(Array.isArray(inst.installabilityErrors) && inst.installabilityErrors.length === 0, `installability errors: ${JSON.stringify(inst.installabilityErrors)}`);
  ok(Array.isArray(man.errors) && man.errors.length === 0, `manifest errors: ${JSON.stringify(man.errors)}`);
  ok(man.url === `${BASE}manifest.webmanifest`, `manifest url ${man.url}`);
  return `no installability errors; manifest ${man.url}; app id ${appId ? `${appId.appId} (recommended id "${appId.recommendedId}")` : 'n/a'}`;
});

await check('P8. Update: when sw.js changes, an accessible "Update ready — reload" notice appears; no reload is forced', async () => {
  await page.evaluate(() => { window.__noReloadMarker = 42; });
  server.setRoot(join(TMP, 'pwa2'));
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
  const notice = page.locator('.pwa-update');
  await notice.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForFunction(() => /Update ready/.test(document.querySelector('.pwa-update-msg').textContent));
  const n = await page.evaluate(() => {
    const m = document.querySelector('.pwa-update-msg');
    const r = document.querySelector('.pwa-update').getBoundingClientRect();
    return { text: m.textContent, role: m.getAttribute('role'), live: m.getAttribute('aria-live'), marker: window.__noReloadMarker, focusInNotice: !!document.activeElement.closest('.pwa-update'), inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth };
  });
  ok(n.text === 'Update ready — reload to use the new version.', `text "${n.text}"`);
  ok(n.role === 'status' && n.live === 'polite', `role ${n.role}, aria-live ${n.live}`);
  ok(n.marker === 42, 'page was reloaded without asking');
  ok(!n.focusInNotice, 'focus was moved into the notice');
  ok(n.inView, 'notice not fully in the viewport');
  ok(await page.getByRole('button', { name: 'Reload', exact: true }).isVisible(), 'no Reload button');
  ok(await page.getByRole('button', { name: /^Later/ }).isVisible(), 'no Later button');
  ok(await swVersion() === v1, 'the old worker should still control the page until the user reloads');
  const waitingV = await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r.waiting));
  ok(waitingV, 'no waiting worker');
  return `notice shown with role=status, aria-live=polite; old version ${v1} still in control; new version waiting`;
});

await check('P9. Update notice passes axe (WCAG 2.2 AA) in light and dark, and works at phone width', async () => {
  // axe-core comes from the web app's dev dependencies (../app, after npm ci there). A missing axe is a failure, not a
  // skip: earlier this path was hard-coded to another machine's folder and the axe part silently never ran.
  const axePath = [join(PACKAGING_ROOT, '..', 'app', 'node_modules', 'axe-core', 'axe.min.js'), join(PACKAGING_ROOT, 'node_modules', 'axe-core', 'axe.min.js')].find((p) => { try { readFileSync(p); return true; } catch { return false; } });
  ok(axePath, 'axe-core not found: run npm ci in ../app (its devDependencies include axe-core)');
  await page.addScriptTag({ content: readFileSync(axePath, 'utf8') });
  const out = [];
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    const r = await page.evaluate(() => window.axe.run({ include: [['.pwa-update']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
    ok(r.violations.length === 0, `${scheme}: ${r.violations.map((v) => `${v.id} (${v.nodes.length})`).join(', ')}`);
    out.push(`${scheme}: 0 violations, ${r.passes.length} rules passed`);
    mkdirSync(join(PACKAGING_ROOT, 'test-results'), { recursive: true });
    await page.screenshot({ path: join(PACKAGING_ROOT, 'test-results', `pwa-update-notice-${scheme}.png`) });
  }
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 375, height: 740 });
  const fit = await page.evaluate(() => { const r = document.querySelector('.pwa-update').getBoundingClientRect(); return { l: r.left, r: r.right, w: innerWidth, b: r.bottom, h: innerHeight }; });
  ok(fit.l >= 0 && fit.r <= fit.w && fit.b <= fit.h, `notice overflows at 375 px: ${JSON.stringify(fit)}`);
  await page.screenshot({ path: join(PACKAGING_ROOT, 'test-results', 'pwa-update-notice-375px.png') });
  await page.setViewportSize({ width: 1280, height: 860 });
  return `${out.join('; ')}; fits at 375 px`;
});

await check('P10. "Later" hides the notice; it comes back on the next load while the update waits', async () => {
  await page.getByRole('button', { name: /^Later/ }).click();
  ok(await page.locator('.pwa-update').isHidden(), 'notice still visible after Later');
  await page.reload({ waitUntil: 'load' });
  await page.locator('.pwa-update').waitFor({ state: 'visible', timeout: 30000 });
  ok(await swVersion() === v1, 'a plain reload should not activate the waiting worker');
  return 'hidden after Later; shown again after a reload (old version still in control)';
});

await check('P11. "Reload" activates the new version: page reloads under the new worker; old cache removed', async () => {
  await page.waitForFunction(() => /Update ready/.test(document.querySelector('.pwa-update-msg').textContent));
  await Promise.all([page.waitForEvent('load', { timeout: 30000 }), page.getByRole('button', { name: 'Reload', exact: true }).click()]);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const v = await swVersion();
  ok(v === v2, `controller version ${v}, expected ${v2}`);
  const keys = await myCaches();
  ok(keys.length === 1 && keys[0].endsWith(v2), `caches after update: ${keys}`);
  ok(await page.locator('.pwa-update').count() === 0 || await page.locator('.pwa-update').isHidden(), 'notice still shown after the update');
  const marker = await page.evaluate(() => window.__noReloadMarker);
  ok(marker === undefined, 'page did not reload');
  const html = await page.evaluate(() => document.documentElement.outerHTML.includes('update test build'));
  ok(html, 'page is not the new build');
  await waitForRun();
  const errs = takeErrors();
  ok(!errs.length, `errors: ${errs.join(' | ')}`);
  return `now version ${v2}; caches ${keys}`;
});
server.setRoot(DIR);
await ctx.close();

await check('P12. Without service workers the page still works: file:// copy, and a browser that blocks workers', async () => {
  const browser = await pw.chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], executablePath: findChromium() || undefined });
  const out = [];
  for (const mode of ['file', 'blocked']) {
    const c = await browser.newContext(mode === 'blocked' ? { serviceWorkers: 'block' } : {});
    const p = await c.newPage();
    const errs = [];
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', (e) => errs.push(e.message));
    const s2 = mode === 'blocked' ? await startStaticServer({ root: DIR }) : null;
    await p.goto(mode === 'file' ? pathToFileURL(join(DIR, 'index.html')).href : s2.url);
    const status = await waitForRun(p);
    const reg = await p.evaluate(async () => /^https?:$/.test(location.protocol) && ('serviceWorker' in navigator) ? (await navigator.serviceWorker.getRegistrations()).length : 'n/a');
    ok(await p.locator('.pwa-update').count() === 0 || await p.locator('.pwa-update').isHidden(), `${mode}: update notice present`);
    ok(!errs.length, `${mode}: errors ${errs.join(' | ')}`);
    ok(reg === 'n/a' || reg === 0, `${mode}: ${reg} registrations`);
    out.push(`${mode}: run OK, registrations ${reg}`);
    if (s2) await s2.close();
    await c.close();
  }
  await browser.close();
  return out.join('; ');
});

await server.close();
rmSync(TMP, { recursive: true, force: true });
mkdirSync(join(PACKAGING_ROOT, 'test-results'), { recursive: true });
writeFileSync(join(PACKAGING_ROOT, 'test-results', 'pwa.json'), `${JSON.stringify({ date: new Date().toISOString(), chromium: browserVersion, v1, v2, results }, null, 2)}\n`);
console.log(`\n${results.length - failures}/${results.length} PWA checks passed`);
process.exit(failures ? 1 : 0);
