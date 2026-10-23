// Browser checks for the built single file (dist/energy-tool-single-file.html). Run `npm run build`
// first, then `npm run test:browser` (node tests/browser-tests.mjs).
//
// Uses Playwright with Chromium and axe-core (devDependency). If Playwright or a Chromium binary is not
// available, the script prints SKIP with the reason and exits 0; it never installs browsers.
// Covers what the Node suite cannot: the Canvas drawing path (> view.pareto.canvasAbove points) and its
// pointer hit-testing, keyboard navigation on the chart, table paging, skip links and tab order,
// removable filter chips, the off-canvas inputs panel at tablet width, phone overflow, an axe audit
// (WCAG 2.0/2.1/2.2 A and AA rules) in light and dark themes, and the Site tab (phone width with touch
// drawing, keyboard reach of the plan and its table, keyboard drawing, axe light and dark). Port slice (B22–B29):
// Dispatch and Sensitivity tabs (phone width, keyboard readouts, axe light and dark), the five-tab bar, skip links,
// the hosted page in a host-like document, the loading message without scripts and the startup-error display.
//
// Exit code 1 if any check fails.

import { createRequire } from 'node:module';
import { existsSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FILE = join(ROOT, 'dist', 'energy-tool-single-file.html');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

function tryRequire(name) {
  try { return require(require.resolve(name)); } catch { /* fall through */ }
  for (const base of [ROOT, process.cwd(), '/home/claude']) {
    try { return require(require.resolve(name, { paths: [base] })); } catch { /* next */ }
  }
  return null;
}
function tryResolve(name) {
  try { return require.resolve(name); } catch { return null; }
}

const results = [];
let failures = 0;
// BROWSER_ONLY=<regex> runs only the matching checks (development aid; the full run is the default).
const ONLY = process.env.BROWSER_ONLY ? new RegExp(process.env.BROWSER_ONLY) : null;
async function check(name, fn) {
  if (ONLY && !ONLY.test(name)) return;
  const t0 = Date.now();
  try {
    const info = await fn();
    if (info && info.skip) { results.push({ name, status: 'SKIP' }); console.log(`SKIP  ${name}\n      ${info.skip}`); return; }
    results.push({ name, status: 'PASS' });
    console.log(`PASS  ${name}  (${((Date.now() - t0) / 1000).toFixed(1)} s)${info ? `\n      ${info}` : ''}`);
  } catch (e) {
    failures++;
    results.push({ name, status: 'FAIL' });
    console.log(`FAIL  ${name}\n      ${e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n      ') : e}`);
  }
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }

const pw = tryRequire('playwright');
if (!pw) {
  console.log('SKIP  browser tests: Playwright is not installed or not resolvable (require("playwright")). Nothing was run.');
  process.exit(0);
}
if (!existsSync(FILE)) {
  console.log(`FAIL  browser tests: ${FILE} is missing. Run "npm run build" first.`);
  process.exit(1);
}
const AXE = tryResolve('axe-core/axe.min.js');

async function launch() {
  const opts = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] };
  try { return await pw.chromium.launch(opts); } catch (e1) {
    const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean);
    for (const r of roots) {
      if (!existsSync(r)) continue;
      for (const d of readdirSync(r).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
        const exe = join(r, d, 'chrome-linux', 'chrome');
        if (existsSync(exe)) { try { return await pw.chromium.launch({ ...opts, executablePath: exe }); } catch { /* next */ } }
      }
    }
    throw e1;
  }
}

let browser;
try { browser = await launch(); } catch (e) {
  console.log(`SKIP  browser tests: Chromium could not be launched (${String(e.message).split('\n')[0]}). Nothing was run.`);
  process.exit(0);
}
console.log(`Browser tests on ${pathToFileURL(FILE).href}\nChromium ${browser.version()}, Playwright ${pw.chromium ? require(require.resolve('playwright/package.json')).version : '?'}, axe-core ${AXE ? require(AXE.replace(/axe\.min\.js$/, 'package.json')).version : 'not found'}`);

async function openPage({ width = 1400, height = 900, colorScheme = 'light', isMobile = false, hasTouch = false, siteBeta = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme, isMobile, hasTouch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const t0 = Date.now();
  await page.goto(pathToFileURL(FILE).href, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const st = document.querySelector('.status');
    const txt = st ? st.textContent : '';
    return /Run failed/.test(txt) || (/Last run/.test(txt) && !/Screening options/.test(txt));
  }, null, { timeout: 180000, polling: 250 });
  const status = (await page.locator('.status').innerText()).replace(/\s+/g, ' ').trim();
  ok(!/Run failed/.test(status), `run failed: ${status}`);
  // The Site tab is a Beta feature, off by default (walkthrough, 2026-10-21): checks that use it turn it on in the
  // general settings first, as a user would. It is a view setting, so no re-run follows.
  if (siteBeta) await enableSiteBeta(page);
  return { ctx, page, errors, loadS: (Date.now() - t0) / 1000, status };
}
const tradeoffsTab = (page) => page.getByRole('tab', { name: 'Trade-offs', exact: true });
async function enableSiteBeta(page) {
  await page.getByRole('button', { name: 'General settings' }).click();
  await page.locator('#gs-site-beta').check();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.waitForSelector('#tab-site');
  // Put the sequential focus starting point back at the top of the page, as on a fresh load.
  await page.evaluate(() => { const b = document.body; b.tabIndex = -1; b.focus(); b.removeAttribute('tabindex'); window.scrollTo(0, 0); });
}
const siteTab = (page) => page.getByRole('tab', { name: 'Site Beta', exact: true });
// Site tab helpers: wait for the thumbnails, open every collapsible section, wait for a re-run after a site edit.
async function openSite(page) {
  await siteTab(page).click();
  await page.waitForSelector('#site-plan');
  await page.waitForFunction(() => !document.querySelector('.mult-wait'), null, { timeout: 60000, polling: 200 });
}
const openAllSiteDetails = (page) => page.evaluate(() => document.querySelectorAll('.site details').forEach((d) => { d.open = true; }));
async function waitSiteRerun(page, editorText) {
  await page.waitForFunction((t) => {
    const ed = document.querySelector('.site-editor');
    const st = document.querySelector('.status');
    return ed && ed.textContent.includes(t) && !document.querySelector('.site-stale') && st && /Last run/.test(st.textContent) && !/Screening options/.test(st.textContent);
  }, editorText, { timeout: 180000, polling: 250 });
}
const pageWidths = (page) => page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
const optionsTab = (page) => page.getByRole('tab', { name: 'Options', exact: true });
async function active(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { tag: 'body', id: '', text: '', inPanel: false, inMain: false, inChart: false, visible: false, focusVisible: false };
    const r = el.getBoundingClientRect();
    let fv = false; try { fv = el.matches(':focus-visible'); } catch { fv = false; }
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(), id: el.id || '', cls: el.getAttribute('class') || '', role: el.getAttribute('role') || '',
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      inPanel: !!el.closest('#inputs-panel'), inMain: !!el.closest('#results'), inChart: el.id === 'tradeoffs-chart',
      visible: r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && cs.visibility !== 'hidden',
      focusVisible: fv,
    };
  });
}
const liveText = (page) => page.evaluate(() => { const l = document.querySelector('.pareto-chart [aria-live]'); return l ? l.textContent.replace(/\s+/g, ' ').trim() : ''; });
const num = (s) => Number(String(s).replace(/,/g, ''));
function axisValues(text) {
  // "…. LCOE 134 €/MWh; Carbon, location-based 113 gCO₂e/kWh; …"
  const m = text.match(/Rank \d+, score [\d.]+\. [^;]*? ([\d,.]+) [^;]*; [^;]*? ([\d,.]+) [^;]*;/);
  return m ? { x: num(m[1]), y: num(m[2]) } : null;
}
async function runAxe(page, label) {
  if (!AXE) return { label, skipped: true };
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(async (tags) => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
    const pick = (v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, target: v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | '), msg: ((v.nodes[0] && (v.nodes[0].any[0] || v.nodes[0].all[0] || v.nodes[0].none[0])) || {}).message || '' });
    return { violations: res.violations.map(pick), incomplete: res.incomplete.map(pick), passes: res.passes.length };
  }, AXE_TAGS);
  return { label, ...r };
}
const axeLine = (r) => {
  const by = {}; for (const v of r.violations) by[v.impact] = (by[v.impact] || 0) + 1;
  return `${r.label}: ${r.passes} rules passed, violations ${JSON.stringify(by)}${r.violations.length ? ` [${r.violations.map((v) => `${v.impact} ${v.id} ×${v.nodes}: ${v.target}`).join('; ')}]` : ''}, needs review ${r.incomplete.length ? r.incomplete.map((v) => `${v.id} ×${v.nodes}`).join(', ') : 'none'}`;
};
const serious = (r) => r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
// axe leaves text it cannot place against a background as "needs review" (here: run-log rows clipped by
// the log's scroll box). Check those nodes from computed styles: foreground over the composited
// backgrounds of the element and its ancestors; 4.5:1, or 3:1 for large text.
async function verifyNeedsReviewContrast(page) {
  if (!AXE) return null;
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } });
    const inc = res.incomplete.find((v) => v.id === 'color-contrast');
    const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => Number(x.trim())); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
    const bgOf = (el) => {
      const layers = [];
      for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
      let bg = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
      return bg;
    };
    let n = 0, icons = 0, worst = null; const below = [];
    for (const node of inc ? inc.nodes : []) {
      const msg = ((node.any[0] || {}).message) || '';
      if (/non-text characters/.test(msg)) { icons++; continue; }
      const el = document.querySelector(node.target[0]);
      if (!el) continue;
      const cs = getComputedStyle(el);
      const bg = bgOf(el);
      const fg = over(parse(cs.color), bg);
      const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      const ratio = (hi + 0.05) / (lo + 0.05);
      const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
      const min = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      n++;
      if (!worst || ratio < worst.ratio) worst = { ratio: Math.round(ratio * 100) / 100, target: node.target.join(' '), color: cs.color, size };
      if (ratio < min) below.push(`${node.target.join(' ')} ${ratio.toFixed(2)}:1`);
    }
    return { n, icons, worst, below };
  });
}
const reviewLine = (label, v) => `${label}: ${v.n} "needs review" text nodes checked from computed styles, lowest ${v.worst ? `${v.worst.ratio}:1 (${v.worst.target.slice(0, 50)}, ${v.worst.color}, ${v.worst.size}px)` : 'n/a'}, ${v.below.length} below the minimum; ${v.icons} icon-only glyphs (decorative, beside text)`;

const report = {};

// ---------------------------------------------------------------------------
// 1. Keyboard reach from the top of a fresh page, Tab only (no skip link).
// ---------------------------------------------------------------------------
await check('B1. Tab order from the top of the page (no skip link): stops before the results and the chart, none hidden', async () => {
  const { ctx, page, errors, loadS } = await openPage();
  let presses = 0, toResults = null, toTabs = null, toChart = null, panelStops = 0, invisible = 0, skipStops = 0;
  const seen = [];
  while (presses < 400 && toChart == null) {
    await page.keyboard.press('Tab');
    presses++;
    const a = await active(page);
    seen.push(a);
    if (a.inPanel) panelStops++;
    if (!a.visible) invisible++;
    if (/skip/.test(a.cls)) skipStops++;
    if (toResults == null && a.inMain) toResults = presses;
    if (a.id === 'tab-options' && toTabs == null) { toTabs = presses; await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150); }
    if (a.inChart) toChart = presses;
  }
  ok(toChart != null, `chart not reached in ${presses} Tab presses`);
  ok(invisible === 0, `${invisible} Tab stops on elements that are not visible`);
  report.tabOnly = { toChart, toTabs, toResults, panelStops, skipStops };
  await ctx.close();
  ok(errors.length === 0, `console/page errors: ${errors.join(' | ')}`);
  return `loaded and ran in ${loadS.toFixed(1)} s; Tab only: ${toResults} presses to the first stop in the results, ${toTabs} to the results tab list (ArrowRight selects Trade-offs, ARIA tabs pattern), ${toChart} to the chart; ${panelStops} stops in the inputs panel, ${skipStops} skip links; every stop visible.`;
});

// ---------------------------------------------------------------------------
// Main page (desktop, light): skip links, keyboard, Canvas, SVG, paging, chips, axe.
// ---------------------------------------------------------------------------
const main = await openPage();
await check('B2. Skip links: "Skip to results" and "Skip to trade-offs chart" are the first two Tab stops and reach their targets', async () => {
  const { page } = main;
  await page.keyboard.press('Tab');
  const a1 = await active(page);
  ok(/Skip to results/.test(a1.text) && a1.visible, `first Tab stop is "${a1.text}"`);
  await page.keyboard.press('Tab');
  const a2 = await active(page);
  ok(/Skip to trade-offs chart/.test(a2.text) && a2.visible, `second Tab stop is "${a2.text}"`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'tradeoffs-chart', null, { timeout: 5000 });
  const a3 = await active(page);
  ok(a3.inChart && a3.focusVisible, 'chart focused without a visible focus indicator');
  ok((await tradeoffsTab(page).getAttribute('aria-selected')) === 'true', 'Trade-offs tab not selected');
  await page.waitForTimeout(250);
  const live = await liveText(page);
  ok(/weighted pick/.test(live), `live region does not name the weighted pick: "${live}"`);
  report.skip = { results: '1 Tab + Enter', chart: '2 Tab + Enter' };
  // Skip to results from the top of the same page: focus returns to the top via Shift+Tab is not needed;
  // check the first link's target directly.
  const target = await page.evaluate(() => { const a = document.querySelector('a.skip[href="#results"]'); const t = document.getElementById('results'); return !!a && !!t && t.tabIndex === -1; });
  ok(target, '"Skip to results" target #results missing or not focusable');
  return `chart reached with 2 Tab presses + Enter (focus on svg#tradeoffs-chart, :focus-visible, Trade-offs selected); live region: "${live.slice(0, 90)}…"; results reached with 1 Tab press + Enter (#results, tabindex −1).`;
});

await check('B3. Keyboard on the chart: arrows move along the axes, Home/End, P returns to the pick, Enter opens its detail, Escape clears', async () => {
  const { page } = main;
  const svg = page.locator('#tradeoffs-chart');
  const start = await liveText(page);
  ok(/weighted pick/.test(start), 'focus did not start on the weighted pick');
  const v0 = axisValues(start);
  ok(v0, `cannot read the axis values from "${start}"`);
  // Eight ArrowRight presses: a different option each time, x never decreases (values as announced, 3 s.f.).
  const xs = [v0.x], seenR = new Set([start]);
  for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80); const t = await liveText(page); seenR.add(t); xs.push(axisValues(t).x); }
  ok(seenR.size === 9, `ArrowRight did not move to a new option on every press (${seenR.size - 1} of 8)`);
  ok(xs.every((x, i) => i === 0 || x >= xs[i - 1]), `x decreased along ArrowRight: ${xs.join(', ')}`);
  for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(60); }
  ok((await liveText(page)) === start, 'eight ArrowLeft presses did not return to the pick');
  const ys = [v0.y];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(80); ys.push(axisValues(await liveText(page)).y); }
  ok(ys.every((y, i) => i === 0 || y >= ys[i - 1]), `y decreased along ArrowUp: ${ys.join(', ')}`);
  const v1 = { x: xs[xs.length - 1] }, u = { y: ys[ys.length - 1] };
  await page.keyboard.press('Home'); await page.waitForTimeout(120);
  const home = await liveText(page);
  ok(/on the frontier/.test(home), `Home did not land on the leftmost point, which is on the frontier: "${home.slice(0, 120)}"`);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(80);
  ok((await liveText(page)) === home, 'ArrowLeft moved past the leftmost point');
  await page.keyboard.press('End'); await page.waitForTimeout(120);
  const endText = await liveText(page);
  const end = axisValues(endText);
  ok(end && end.x >= axisValues(home).x, 'End did not land on the rightmost point');
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80);
  ok((await liveText(page)) === endText, 'ArrowRight moved past the rightmost point');
  await page.keyboard.press('p'); await page.waitForTimeout(120);
  ok((await liveText(page)) === start, 'P did not return to the weighted pick');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.pareto-detail section.detail h3');
  const title = (await page.locator('.pareto-detail section.detail h3').innerText()).trim();
  const pickName = start.split('. Rank')[0];
  ok(title.includes(pickName), `detail "${title}" is not the pick "${pickName}"`);
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  ok(await page.locator('.pareto-detail section.detail').count() === 1, 'a second Enter closed the detail (Enter opens, the × button closes)');
  await page.keyboard.press('Escape'); await page.waitForTimeout(120);
  ok(await page.locator('.pc-focus').count() === 0, 'Escape did not clear the focus ring');
  ok(await svg.evaluate((el) => document.activeElement === el), 'focus left the chart');
  return `pick → 8 × ArrowRight, 8 new options, x non-decreasing (${xs.join(' → ')}) → 8 × ArrowLeft back to the pick; 8 × ArrowUp, y non-decreasing (${ys[0]} → ${u.y}); Home → leftmost (on the frontier; ArrowLeft stays); End → rightmost (ArrowRight stays); P → pick; Enter opened "${title.slice(0, 60)}…" and a second Enter kept it open; Escape cleared the ring.`;
});

await check('B4. Canvas path (more than the registered threshold): points drawn on Canvas, no SVG markers, pixels at the pick, pointer hit-test opens the nearest option', async () => {
  const { page } = main;
  const info = await page.evaluate(() => {
    const cv = document.querySelector('.pareto-chart canvas.pc-canvas');
    const ring = document.querySelector('.pc-pick circle');
    const help = document.getElementById('pc-help');
    if (!cv) return { canvas: false };
    const ctx = cv.getContext('2d');
    const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let painted = 0;
    for (let i = 3; i < img.length; i += 4) if (img[i] > 0) painted++;
    const dpr = cv.width / cv.getBoundingClientRect().width;
    const cx = Number(ring.getAttribute('cx')), cy = Number(ring.getAttribute('cy'));
    const px = ctx.getImageData(Math.round(cx * dpr), Math.round(cy * dpr), 1, 1).data;
    return {
      canvas: true, w: cv.width, h: cv.height, painted, svgMarkers: document.querySelectorAll('.pc-points path[data-id]').length,
      pickAlpha: px[3], pickRGB: [px[0], px[1], px[2]], cx, cy, help: help ? help.textContent : '',
      label: document.getElementById('tradeoffs-chart').getAttribute('aria-label'),
    };
  });
  ok(info.canvas, 'no Canvas layer on T1 (2,000 points)');
  ok(info.svgMarkers === 0, `${info.svgMarkers} SVG markers drawn as well as the Canvas`);
  ok(info.painted > 2000, `only ${info.painted} painted pixels on the Canvas`);
  ok(info.pickAlpha > 0, 'nothing drawn on the Canvas at the weighted pick');
  const m = info.help.match(/more than (\d+) points/);
  const n = info.label.match(/, (\d+) options\./);
  ok(m && n && Number(n[1]) > Number(m[1]), `Canvas used without more points than the threshold (${n && n[1]} vs ${m && m[1]})`);
  // Pointer hit-test (Canvas has no DOM nodes): click at the pick's position, the nearest point opens.
  // Close the detail first and read the position afterwards: the layout (and the chart width) can change.
  if (await page.locator('.pareto-detail .icon-btn').count()) await page.locator('.pareto-detail .icon-btn').click();
  await page.locator('#tradeoffs-chart').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const at = await page.evaluate(() => { const c = document.querySelector('.pc-pick circle'); return { cx: Number(c.getAttribute('cx')), cy: Number(c.getAttribute('cy')) }; });
  const box = await page.locator('#tradeoffs-chart').boundingBox();
  // Markers overlap near the pick (many options share its LCOE and carbon to 3 s.f.) and the pointer
  // position is rounded to whole pixels, so the nearest marker to the click may be a neighbour. Check what
  // hit-testing promises: hover and click pick the same option, and it is no farther from the pointer than the pick.
  const px = box.x + at.cx, py = box.y + at.cy;
  await page.mouse.move(px, py);
  await page.waitForSelector('.pc-tip-name');
  const tip = (await page.locator('.pc-tip-name').innerText()).trim();
  await page.mouse.click(px, py);
  await page.waitForSelector('.pareto-detail section.detail h3');
  const title = (await page.locator('.pareto-detail section.detail h3').innerText()).trim();
  const [tipRank, ...tipName] = tip.split(' ');
  ok(title.startsWith(`${tipRank} · ${tipName.join(' ')}`.slice(0, 40)), `hover named "${tip}" but the click opened "${title}"`);
  const geo = await page.evaluate(() => { const f = document.querySelector('.pc-focus'); return f ? { fx: Number(f.getAttribute('cx')), fy: Number(f.getAttribute('cy')) } : null; });
  ok(geo, 'no focus ring on the clicked option');
  const dHit = Math.hypot(geo.fx - at.cx, geo.fy - at.cy);
  ok(dHit <= 16, `clicked option is ${dHit.toFixed(1)} px from the pointer (hit area 16 px)`);
  // The pick is within 0.71 px of the rounded pointer, so the nearest option is within 1.42 px of the pick's centre.
  ok(dHit <= 1.5, `a farther option (${dHit.toFixed(2)} px) was opened although the pick is under the pointer`);
  await page.locator('.pareto-detail .icon-btn').click();
  await page.mouse.move(box.x + 2, box.y + 2);
  return `${n[1]} plotted points > threshold ${m[1]}: Canvas ${info.w}×${info.h}, ${info.painted.toLocaleString('en-GB')} painted pixels, 0 SVG markers; pixel at the pick rgb(${info.pickRGB.join(', ')}); pointer at the pick: hover and click both chose "${title.slice(0, 45)}…" (${dHit.toFixed(2)} px from the pointer; overlapping markers).`;
});

await check('B5. SVG path (at or below the threshold): with "Hide dominated options" on, markers are SVG paths, one per plotted point, no Canvas', async () => {
  const { page } = main;
  await page.locator('section.pareto').getByLabel('Hide dominated options').check();
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({
    canvas: !!document.querySelector('.pareto-chart canvas'), paths: document.querySelectorAll('.pc-points path[data-id]').length,
    label: document.getElementById('tradeoffs-chart').getAttribute('aria-label'), chip: (document.querySelector('.chip-row') || {}).textContent || '',
  }));
  const n = Number((r.label.match(/, (\d+) options\./) || [])[1]);
  ok(!r.canvas, 'Canvas still drawn with few points');
  ok(r.paths === n && n > 0, `${r.paths} SVG markers for ${n} plotted points`);
  ok(/dominated options hidden/.test(r.chip), 'no counter chip for hidden dominated options');
  await page.locator('.chip-row').getByRole('button', { name: 'show' }).click();
  await page.waitForTimeout(300);
  ok(await page.locator('.pareto-chart canvas').count() === 1, '"show" did not restore every option');
  return `${n} points → ${r.paths} SVG markers, no Canvas; counter chip "${r.chip.trim().slice(0, 40)}"; "show" restored the Canvas view.`;
});

await check('B6. Table paging: every option reachable, page size as registered, rank order, the pick on page 1', async () => {
  const { page } = main;
  await page.getByRole('group', { name: 'Show as' }).getByRole('button', { name: 'Table', exact: true }).click();
  await page.waitForSelector('table.pareto-table');
  const caption = await page.locator('table.pareto-table caption').innerText();
  const total = Number(caption.match(/\((\d+) rows/)[1]);
  const pager = page.getByRole('navigation', { name: 'Table pages' });
  const first = await page.locator('table.pareto-table tbody tr').count();
  const pagerText = await pager.innerText();
  const pages = Number(pagerText.match(/of (\d+)/)[1]);
  ok(pages === Math.ceil(total / first), `pager says ${pages} pages for ${total} rows at ${first} per page`);
  ok(/rows per page/.test(pagerText), 'page size label missing');
  ok(await page.locator('table.pareto-table tbody tr').first().locator('.badge-pick').count() === 1, 'the weighted pick is not the first row of page 1');
  const ids = new Set(); const ranks = [];
  for (let i = 0; i < pages; i++) {
    const rows = await page.locator('table.pareto-table tbody tr').evaluateAll((trs) => trs.map((tr) => [tr.getAttribute('data-id'), Number(tr.cells[0].textContent)]));
    for (const [id, rk] of rows) { ids.add(id); ranks.push(rk); }
    const now = await pager.innerText();
    ok(now.includes(`Page ${i + 1} of ${pages}`), `pager shows "${now}" on page ${i + 1}`);
    if (i < pages - 1) await pager.getByRole('button', { name: 'Next' }).click();
  }
  ok(await pager.getByRole('button', { name: 'Next' }).isDisabled(), 'Next not disabled on the last page');
  const last = await page.locator('table.pareto-table tbody tr').count();
  ok(ids.size === total && ranks.length === total, `${ids.size} distinct rows over ${pages} pages, expected ${total}`);
  ok(ranks.every((r, i) => i === 0 || r > ranks[i - 1]), 'rows not in rank order across pages');
  await pager.getByRole('button', { name: 'Previous' }).click();
  ok((await pager.innerText()).includes(`Page ${pages - 1} of ${pages}`), 'Previous did not go back one page');
  return `${total} rows, ${first} per page, ${pages} pages; Next through every page collected ${ids.size} distinct options in rank order 1…${ranks[ranks.length - 1]} (last page ${last} rows); Next disabled at the end; Previous goes back; pick badge on row 1.`;
});

const axeLight = [];
await check('B7. axe (WCAG 2.0/2.1/2.2 A and AA rules), light theme: Trade-offs table, Trade-offs chart and Options tab have no serious or critical violation', async () => {
  const { page } = main;
  if (!AXE) return { skip: 'axe-core is not installed (npm install, devDependency axe-core).' };
  axeLight.push(await runAxe(page, 'Trade-offs, table'));
  await page.getByRole('group', { name: 'Show as' }).getByRole('button', { name: 'Chart', exact: true }).click();
  await page.waitForSelector('#tradeoffs-chart');
  axeLight.push(await runAxe(page, 'Trade-offs, chart'));
  await optionsTab(page).click();
  await page.waitForSelector('table.rank-table');
  axeLight.push(await runAxe(page, 'Options'));
  const review = await verifyNeedsReviewContrast(page);
  report.axeLight = axeLight;
  const bad = axeLight.flatMap((r) => serious(r).map((v) => `${r.label}: ${v.impact} ${v.id} ×${v.nodes} (${v.target}) ${v.msg}`));
  ok(bad.length === 0, bad.join(' | '));
  ok(review.below.length === 0, `needs-review text below the contrast minimum: ${review.below.slice(0, 5).join(' | ')}`);
  return [...axeLight.map(axeLine), reviewLine('Options (light)', review)].join('\n      ');
});

await check('B8. Removable filter chips: each filter shows a chip with its own remove button; removing it by keyboard keeps focus in the chip row', async () => {
  const { page } = main;
  await page.getByRole('group', { name: 'View filters (never change score or rank)' }).getByRole('button', { name: 'Meets', exact: true }).click();
  await page.getByLabel('Capex at most (€ m)').fill('150');
  await page.getByLabel('Capex at most (€ m)').press('Enter');
  await page.waitForTimeout(200);
  const chips = await page.locator('.chip-row .active-chip').allInnerTexts();
  ok(chips.some((c) => /Resilience: Meets/.test(c)) && chips.some((c) => /Capex ≤ €150 m/.test(c)), `chips: ${chips.join(' | ')}`);
  const header = await page.locator('.header-strip').innerText();
  ok(/View filters: 2/.test(header) && / shown \/ /.test(header), `header strip: ${header.replace(/\s+/g, ' ').slice(0, 200)}`);
  const removeMeets = page.getByRole('button', { name: 'Remove filter: Resilience: Meets' });
  await removeMeets.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  const after = await page.locator('.chip-row .active-chip').allInnerTexts();
  const a = await active(page);
  ok(!after.some((c) => /Resilience: Meets/.test(c)) && after.some((c) => /Capex/.test(c)), `after removing: ${after.join(' | ')}`);
  ok(/chip-x/.test(a.cls) || /chip-row/.test(a.cls), `focus went to ${a.tag}.${a.cls}`);
  await page.getByRole('button', { name: /^Remove filter: Capex/ }).click();
  await page.waitForTimeout(200);
  ok(await page.locator('.chip-row').count() === 0, 'chip row still shown with no filter');
  ok(/View filters: 0/.test(await page.locator('.header-strip').innerText()), 'header filter count not back to 0');
  return `chips "${chips.map((c) => c.replace('×', '').trim()).join('", "')}"; header counted 2 filters and the shown count; Enter on "Remove filter" removed only that chip and focus stayed on the next chip's remove button; last chip removed → no chip row, count 0.`;
});

// §17: "Weight or scenario change → ranking, Pareto pick and plain-English summary updated ≤ 100 ms" on the 4-core
// reference machine. This shared 2-core sandbox is not that machine, so the check asserts a regression bound (median
// of three preset changes) and reports the measured value against the 100 ms target (review O5: a check that cannot
// fail is not a check).
const B9_BOUND_MS = 300;
await check(`B9. A weight preset moves the pick without a re-run; repaint asserted ≤ ${B9_BOUND_MS} ms (median of 3, regression bound on this sandbox) and reported against the §17 target of 100 ms on the reference machine`, async () => {
  const { page } = main;
  await tradeoffsTab(page).click();
  await page.waitForSelector('.pick-line');
  const before = await page.locator('.pick-line strong').first().innerText();
  const leaderBefore = await page.locator('.header-strip .hs-item').nth(1).innerText();
  const timeClick = (label) => page.evaluate(async (lbl) => {
    const btn = [...document.querySelectorAll('.preset-row button')].find((b) => b.textContent.trim() === lbl);
    const pl = document.querySelector('.pick-line strong');
    const was = pl.textContent;
    const t0 = performance.now();
    btn.click();
    return await new Promise((resolve) => {
      const tick = () => { const now = document.querySelector('.pick-line strong'); if (now && now.textContent !== was) resolve(performance.now() - t0); else requestAnimationFrame(tick); };
      tick();
      setTimeout(() => resolve(-1), 5000);
    });
  }, label);
  // The first preset that moves the pick away from the Balanced leader. Which one does depends on the option sample
  // (it was "Lowest cost" until 2026-10-22 and "Speed to market" until the C4 sizing choice of 2026-10-23), so the
  // check tries them in turn; a preset that leaves the pick in place keeps it equal to the Balanced pick.
  let preset = null;
  let first = -1;
  for (const lbl of ['Speed to market', 'Lowest carbon', 'Lowest cost', 'Lowest risk']) {
    first = await timeClick(lbl);
    if (first >= 0) { preset = lbl; break; }
  }
  const samples = [first];
  const after = await page.locator('.pick-line strong').first().innerText();
  const leaderAfter = await page.locator('.header-strip .hs-item').nth(1).innerText();
  const status = await page.locator('.status').innerText();
  ok(preset && after !== before, 'no weight preset changed the pick');
  ok(leaderAfter.includes(after.replace(/^#\d+ /, '')), `header leader "${leaderAfter}" is not the pick "${after}"`);
  ok(!/Screening options/.test(status), 'a weight change started a re-run');
  samples.push(await timeClick('Balanced'));
  samples.push(await timeClick(preset));
  ok(samples.every((x) => x >= 0), `a preset change did not move the pick within 5 s (${samples.join(', ')})`);
  ok(!/Screening options/.test(await page.locator('.status').innerText()), 'a weight change started a re-run');
  const med = samples.slice().sort((a, b) => a - b)[1];
  report.weightMs = med;
  await page.locator('.preset-row button', { hasText: 'Balanced' }).click();
  ok(med <= B9_BOUND_MS, `median repaint ${med.toFixed(0)} ms is above the ${B9_BOUND_MS} ms regression bound (samples ${samples.map((x) => x.toFixed(0)).join(', ')} ms)`);
  return `"${preset}": pick "${before.slice(0, 40)}…" → "${after.slice(0, 40)}…"; click to repaint of the pick line ${samples.map((x) => x.toFixed(0)).join(', ')} ms, median ${med.toFixed(0)} ms ≤ ${B9_BOUND_MS} ms (asserted); §17 target ≤ 100 ms on the 4-core reference machine: ${med <= 100 ? 'also met on this sandbox' : `not met on this 2-core sandbox (median ${(med - 100).toFixed(0)} ms over; open performance item)`}; no re-run; header leader = pick before (${leaderBefore.includes(before.replace(/^#\d+ /, '')) ? 'yes' : 'no'}) and after (yes).`;
});
await main.ctx.close();
await check('B10. No console errors or page errors on the main page', async () => {
  ok(main.errors.length === 0, main.errors.join(' | '));
  return `0 errors (load and run ${main.loadS.toFixed(1)} s, status "${main.status.slice(0, 60)}").`;
});

// ---------------------------------------------------------------------------
// Dark theme axe.
// ---------------------------------------------------------------------------
await check('B11. axe, dark theme (prefers-color-scheme: dark): Trade-offs chart, table and Options tab have no serious or critical violation', async () => {
  if (!AXE) return { skip: 'axe-core is not installed.' };
  const { ctx, page, errors } = await openPage({ colorScheme: 'dark' });
  const isDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok(/21, 23, 26/.test(isDark), `dark theme not applied (body ${isDark})`);
  const out = [];
  await tradeoffsTab(page).click(); await page.waitForSelector('#tradeoffs-chart');
  out.push(await runAxe(page, 'Trade-offs, chart (dark)'));
  await page.getByRole('group', { name: 'Show as' }).getByRole('button', { name: 'Table', exact: true }).click();
  await page.waitForSelector('table.pareto-table');
  out.push(await runAxe(page, 'Trade-offs, table (dark)'));
  await optionsTab(page).click(); await page.waitForSelector('table.rank-table');
  out.push(await runAxe(page, 'Options (dark)'));
  const review = await verifyNeedsReviewContrast(page);
  report.axeDark = out;
  await ctx.close();
  const bad = out.flatMap((r) => serious(r).map((v) => `${r.label}: ${v.impact} ${v.id} ×${v.nodes} (${v.target}) ${v.msg}`));
  ok(bad.length === 0, bad.join(' | '));
  ok(review.below.length === 0, `needs-review text below the contrast minimum: ${review.below.slice(0, 5).join(' | ')}`);
  ok(errors.length === 0, errors.join(' | '));
  return [...out.map(axeLine), reviewLine('Options (dark)', review)].join('\n      ');
});

// ---------------------------------------------------------------------------
// Tablet width: the closed slide-over inputs panel takes no focus.
// ---------------------------------------------------------------------------
await check('B12. Tablet width (1000 px): the closed inputs panel takes no Tab stop; opened, its controls are reachable', async () => {
  const { ctx, page, errors } = await openPage({ width: 1000, height: 800 });
  let inPanel = 0, invisible = 0, presses = 0;
  for (; presses < 40; presses++) {
    await page.keyboard.press('Tab');
    const a = await active(page);
    if (a.inPanel) inPanel++;
    if (!a.visible) invisible++;
  }
  ok(inPanel === 0, `${inPanel} of ${presses} Tab stops inside the closed (off-screen) inputs panel`);
  ok(invisible === 0, `${invisible} Tab stops on invisible elements`);
  await page.getByRole('button', { name: 'Inputs' }).click();
  await page.waitForTimeout(350);
  let reached = false;
  for (let i = 0; i < 6 && !reached; i++) { await page.keyboard.press('Tab'); const a = await active(page); reached = a.inPanel && a.visible; }
  ok(reached, 'opened inputs panel not reachable by Tab');
  await ctx.close();
  ok(errors.length === 0, errors.join(' | '));
  return `closed: 0 of ${presses} Tab stops in the panel, all visible; opened: panel controls reached by Tab.`;
});

// ---------------------------------------------------------------------------
// Phone width: no horizontal page scroll on the Trade-offs tab.
// ---------------------------------------------------------------------------
await check('B13. Phone width (375 px): Trade-offs chart and table cause no horizontal page scroll', async () => {
  const { ctx, page, errors } = await openPage({ width: 375, height: 812, isMobile: true });
  await tradeoffsTab(page).click(); await page.waitForSelector('#tradeoffs-chart');
  const w1 = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  await page.getByRole('group', { name: 'Show as' }).getByRole('button', { name: 'Table', exact: true }).click();
  await page.waitForSelector('table.pareto-table');
  const w2 = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  await ctx.close();
  ok(w1[0] <= w1[1] && w2[0] <= w2[1], `scrollWidth/clientWidth chart ${w1.join('/')}, table ${w2.join('/')}`);
  ok(errors.length === 0, errors.join(' | '));
  return `chart ${w1.join('/')} px, table ${w2.join('/')} px (scrollWidth/clientWidth); the wide table scrolls inside its own region.`;
});

// ---------------------------------------------------------------------------
// Site tab (§10.7): phone width with touch drawing, keyboard, axe light and dark.
// ---------------------------------------------------------------------------
await check('B14. Phone width (375 px, touch): the Site tab causes no horizontal page scroll with every section open; a boundary drawn by tapping re-screens the options', async () => {
  const { ctx, page, errors } = await openPage({ width: 375, height: 812, isMobile: true, hasTouch: true, siteBeta: true });
  await openSite(page);
  await openAllSiteDetails(page);
  await page.waitForTimeout(300);
  const w1 = await pageWidths(page);
  const plan = await page.evaluate(() => { const r = document.getElementById('site-plan').getBoundingClientRect(); return { left: r.left, right: r.right, vw: innerWidth }; });
  ok(w1[0] <= w1[1], `Site tab: scrollWidth ${w1[0]} > clientWidth ${w1[1]}`);
  ok(plan.left >= 0 && plan.right <= plan.vw, `plan ${plan.left.toFixed(0)}–${plan.right.toFixed(0)} px outside the ${plan.vw} px screen`);
  // Tap-to-draw: four taps on the plan, then Finish.
  await page.getByRole('button', { name: 'Draw boundary on the plan' }).tap();
  await page.waitForSelector('.draw-banner');
  await page.locator('#site-plan').scrollIntoViewIfNeeded();
  const box = await page.locator('#site-plan').boundingBox();
  for (const [fx, fy] of [[0.2, 0.25], [0.8, 0.25], [0.8, 0.75], [0.2, 0.75]]) { await page.touchscreen.tap(box.x + fx * box.width, box.y + fy * box.height); await page.waitForTimeout(100); }
  const banner = (await page.locator('.draw-banner').innerText()).replace(/\s+/g, ' ');
  ok(/4 so far/.test(banner), `taps did not add 4 corners: "${banner.slice(0, 120)}"`);
  const w2 = await pageWidths(page);
  await page.getByRole('button', { name: 'Finish shape' }).tap();
  await waitSiteRerun(page, 'Drawn polygon: 4 edges');
  const rs = await page.evaluate(() => (document.querySelector('.run-summary') || {}).textContent || '');
  ok(/drawn polygon \(4 edges\)/.test(rs), 'run summary does not report the drawn boundary');
  const area = await page.evaluate(() => { const m = document.querySelector('.site-editor').textContent.match(/4 edges, ([\d.]+) ha/); return m ? Number(m[1]) : null; });
  await openAllSiteDetails(page);
  const w3 = await pageWidths(page);
  await ctx.close();
  ok(w2[0] <= w2[1] && w3[0] <= w3[1], `horizontal scroll while drawing (${w2.join('/')}) or after (${w3.join('/')})`);
  ok(errors.length === 0, errors.join(' | '));
  return `scrollWidth/clientWidth ${w1.join('/')} px with every section open, plan ${Math.round(plan.right - plan.left)} px wide; 4 taps + Finish → drawn 4-edge boundary of ${area} ha, options re-screened (run summary: "drawn polygon (4 edges)"); drawing ${w2.join('/')} px, after ${w3.join('/')} px.`;
});

await check('B15. Keyboard on the Site tab: Tab reaches the plan; arrow keys focus blocks with dimensions, tooltip, live text and the matching table row; the table alternative is reachable; a boundary can be drawn with the keyboard alone', async () => {
  const { ctx, page, errors } = await openPage({ siteBeta: true });
  await page.locator('#tab-options').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForSelector('#site-plan');
  ok((await active(page)).id === 'tab-site', 'ArrowRight × 2 from Options did not focus the Site tab');
  let presses = 0, onPlan = false;
  const stops = [];
  while (presses < 40 && !onPlan) {
    await page.keyboard.press('Tab'); presses++;
    const a = await active(page);
    ok(a.visible, `Tab stop ${presses} (${a.tag}) is not visible`);
    stops.push(a.tag);
    onPlan = a.id === 'site-plan';
  }
  ok(onPlan, `plan not reached in ${presses} Tab presses (${stops.join(', ')})`);
  ok((await active(page)).focusVisible, 'plan focused without a visible focus indicator');
  const read = () => page.evaluate(() => ({
    active: document.querySelectorAll('#site-plan .sp-active').length, dims: [...document.querySelectorAll('#site-plan .sp-dim text')].map((t) => t.textContent),
    tip: (document.querySelector('.sp-tip strong') || {}).textContent || '', live: (document.querySelector('.site-plan > [aria-live]') || {}).textContent || '',
    row: (document.querySelector('.blocks-table tr.on th') || {}).textContent || '',
  }));
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
  const s1 = await read();
  const name1 = s1.live.split('. ')[0];
  ok(s1.active === 1 && s1.dims.length === 2 && s1.dims.every((t) => / m$/.test(t)), `focused block: ${JSON.stringify(s1)}`);
  ok(/m²/.test(s1.live) && /east/.test(s1.live) && /north/.test(s1.live), `live text "${s1.live}"`);
  ok(s1.tip === name1 && s1.row === name1, `tooltip "${s1.tip}" / table row "${s1.row}" / live "${name1}" differ`);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100);
  const s2 = await read();
  ok(s2.live !== s1.live, 'ArrowRight did not move to the next block');
  await page.keyboard.press('End'); await page.waitForTimeout(100);
  const sEnd = await read();
  await page.keyboard.press('Home'); await page.waitForTimeout(100);
  ok((await read()).live === s1.live, 'Home did not return to the first block');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok((await read()).active === 0, 'Escape did not clear the focused block');
  // The table alternative: the next Tab stop is the "plan as a table" link; following it, Tab reaches the table region.
  await page.keyboard.press('Tab');
  const link = await active(page);
  ok(/The plan as a table/.test(link.text), `Tab after the plan went to "${link.text}"`);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  const inTable = await page.evaluate(() => document.activeElement.classList.contains('blocks-table-wrap'));
  ok(inTable, 'the table region was not the next Tab stop after the link target');
  const rows = await page.locator('.blocks-table tbody tr').count();
  // Keyboard drawing: the Draw button moves focus to the plan; arrows move the crosshair, Enter adds corners, F finishes.
  await page.getByRole('button', { name: 'Draw boundary on the plan' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'site-plan', null, { timeout: 5000 });
  await page.keyboard.press('Enter');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Shift+ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const liveDraw = (await read()).live;
  ok(/Drawing: 3 points/.test(liveDraw), `live text while drawing: "${liveDraw}"`);
  await page.keyboard.press('f');
  await waitSiteRerun(page, 'Drawn polygon: 3 edges');
  const area = await page.evaluate(() => { const m = document.querySelector('.site-editor').textContent.match(/3 edges, ([\d.]+) ha/); return m ? Number(m[1]) : null; });
  ok(Math.abs(area - 0.72) < 0.02, `keyboard triangle 120 × 120 m should be 0.72 ha, got ${area}`);
  await ctx.close();
  ok(errors.length === 0, errors.join(' | '));
  return `${presses} Tab presses from the Site tab to the plan (${stops.join(' → ')}), focus visible; ArrowRight → "${name1}" with dimensions ${s1.dims.join(' × ')}, tooltip and table row match; End → "${sEnd.live.split('. ')[0]}"; Home back; Escape clears; Tab → "The plan as a table" link → Enter → Tab → table region (${rows} rows); keyboard drawing: Enter, 12 × Shift+→, Enter, 12 × Shift+↑, Enter, F → 3-edge boundary of ${area} ha (120 × 120 m triangle), options re-screened.`;
});

await check('B16. GeoJSON import on the Site tab: each feature gets a "use as" choice (guessed from its name), and applying sets the boundary, a soft flood exclusion, the POC and a receptor, then re-screens the options', async () => {
  const { ctx, page, errors } = await openPage({ siteBeta: true });
  await openSite(page);
  // A 0.007° × 0.0036° boundary (about 240 × 400 m) around the current site, a flood zone, a POC and a dwelling.
  const corners = await page.evaluate(() => document.querySelector('.site-editor .typed textarea').value.trim().split('\n').map((l) => l.split(',').map(Number)));
  const lat0 = corners.reduce((a, c) => a + c[0], 0) / corners.length, lon0 = corners.reduce((a, c) => a + c[1], 0) / corners.length;
  const dLat = 0.0018, dLon = 0.0035;
  const box = (x0, y0, x1, y1) => [[[lon0 + x0 * dLon, lat0 + y0 * dLat], [lon0 + x1 * dLon, lat0 + y0 * dLat], [lon0 + x1 * dLon, lat0 + y1 * dLat], [lon0 + x0 * dLon, lat0 + y1 * dLat], [lon0 + x0 * dLon, lat0 + y0 * dLat]]];
  const gj = { type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { name: 'Site boundary' }, geometry: { type: 'Polygon', coordinates: box(-1, -1, 1, 1) } },
    { type: 'Feature', properties: { name: 'Flood zone 2' }, geometry: { type: 'Polygon', coordinates: box(0.4, -0.9, 0.9, -0.3) } },
    { type: 'Feature', properties: { name: 'Grid POC' }, geometry: { type: 'Point', coordinates: [lon0 - dLon, lat0] } },
    { type: 'Feature', properties: { name: 'Dwelling' }, geometry: { type: 'Point', coordinates: [lon0 + 1.5 * dLon, lat0] } },
  ] };
  const file = join(tmpdir(), `site-import-${process.pid}.geojson`);
  writeFileSync(file, JSON.stringify(gj));
  await page.locator('.import-geo input[type=file]').setInputFiles(file);
  await page.waitForSelector('.import-list table');
  unlinkSync(file); // after the page has read it (Chromium reads the file when the page asks for its text)
  const uses = await page.locator('.import-list select').evaluateAll((ss) => ss.map((x) => x.value));
  ok(JSON.stringify(uses) === JSON.stringify(['boundary', 'excl:flood', 'poc', 'receptor']), `guessed uses ${uses.join(', ')}`);
  await page.getByRole('button', { name: 'Apply import' }).click();
  const msg = (await page.locator('.import-geo [role=status]').innerText()).trim();
  ok(/Applied 4 of 4 features/.test(msg), `import message "${msg}"`);
  await waitSiteRerun(page, 'Imported polygon: 4 edges');
  const r = await page.evaluate(() => ({
    rs: [...document.querySelectorAll('.run-summary li')].map((l) => l.textContent.replace(/\s+/g, ' ')).filter((t) => /^Boundary|^Exclusions/.test(t)),
    facts: [...document.querySelectorAll('.site-facts tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ')),
    receptorRow: [...document.querySelectorAll('.fit-panel tr')].map((tr) => tr.textContent.replace(/\s+/g, ' ')).find((t) => /^Dwelling/.test(t)) || '',
  }));
  await ctx.close();
  ok(r.rs.some((t) => /imported polygon \(4 edges\)/.test(t)) && r.rs.some((t) => /Exclusions 1 \(0 hard\).*receptors 1/.test(t)), `run summary: ${r.rs.join(' | ')}`);
  ok(r.facts.some((t) => /Flood zone 2.*Flood zone, soft/.test(t)) && r.facts.some((t) => /^Grid POC/.test(t) && !/default/.test(t)), `site facts: ${r.facts.slice(0, 8).join(' | ')}`);
  ok(/dB\(A\)/.test(r.receptorRow), `no noise level at the imported receptor: "${r.receptorRow}"`);
  ok(errors.length === 0, errors.join(' | '));
  return `uses guessed ${uses.join(', ')}; "${msg}"; re-screened: ${r.rs[0].slice(0, 110)}…; receptor row "${r.receptorRow.slice(0, 70)}".`;
});

async function siteAxe(colorScheme) {
  const { ctx, page, errors } = await openPage({ colorScheme, siteBeta: true });
  await openSite(page);
  await openAllSiteDetails(page);
  const out = [];
  out.push(await runAxe(page, `Site tab, leader (${colorScheme})`));
  const review = await verifyNeedsReviewContrast(page);
  const noFit = await page.evaluate(() => { const o = [...document.querySelectorAll('.site-head select option')].find((x) => /Does not fit/.test(x.textContent)); return o ? o.value : null; });
  if (noFit) {
    await page.locator('.site-head select').selectOption(noFit);
    await page.waitForSelector('.fit-panel h4:has-text("Unplaced tray")');
    await openAllSiteDetails(page);
    out.push(await runAxe(page, `Site tab, an option that does not fit (${colorScheme})`));
  }
  await page.getByRole('button', { name: 'Draw boundary on the plan' }).click();
  await page.waitForSelector('.draw-banner');
  const box = await page.locator('#site-plan').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.3);
  out.push(await runAxe(page, `Site tab, drawing (${colorScheme})`));
  await page.getByRole('button', { name: 'Cancel' }).click();
  const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await ctx.close();
  return { out, errors, body, review };
}
await check('B17. axe, light theme: Site tab (plan, layers, legend, editor with every section open, site-fit panel incl. unplaced tray, small multiples, table) and drawing mode have no serious or critical violation', async () => {
  if (!AXE) return { skip: 'axe-core is not installed.' };
  const { out, errors, review } = await siteAxe('light');
  const bad = out.flatMap((r) => serious(r).map((v) => `${r.label}: ${v.impact} ${v.id} ×${v.nodes} (${v.target}) ${v.msg}`));
  ok(bad.length === 0, bad.join(' | '));
  ok(review.below.length === 0, `needs-review text below the contrast minimum: ${review.below.slice(0, 5).join(' | ')}`);
  ok(errors.length === 0, errors.join(' | '));
  return [...out.map(axeLine), reviewLine('Site tab (light)', review)].join('\n      ');
});
await check('B18. axe, dark theme: the same Site tab states have no serious or critical violation', async () => {
  if (!AXE) return { skip: 'axe-core is not installed.' };
  const { out, errors, body, review } = await siteAxe('dark');
  ok(/21, 23, 26/.test(body), `dark theme not applied (body ${body})`);
  const bad = out.flatMap((r) => serious(r).map((v) => `${r.label}: ${v.impact} ${v.id} ×${v.nodes} (${v.target}) ${v.msg}`));
  ok(bad.length === 0, bad.join(' | '));
  ok(review.below.length === 0, `needs-review text below the contrast minimum: ${review.below.slice(0, 5).join(' | ')}`);
  ok(errors.length === 0, errors.join(' | '));
  return [...out.map(axeLine), reviewLine('Site tab (dark)', review)].join('\n      ');
});

// ---------------------------------------------------------------------------
// Review of the site slice: phone layout (O1), Site tab width with the 2,000-option selector (O3), keyboard
// path to the plan (O4).
// ---------------------------------------------------------------------------
await check('B19. Phone width (375 px, touch): after the run, the tab bar and the start of the active tab are within the first 1,000 px; the run progress, event log and run summary sit in a closed "Run details" disclosure under a one-line status; during a run the progress panel is shown, not folded', async () => {
  const { ctx, page, errors } = await openPage({ width: 375, height: 812, isMobile: true, hasTouch: true });
  const m = await page.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) }; };
    const panel = document.querySelector('[role=tabpanel]');
    const first = panel && [...panel.querySelectorAll('h2, h3, p, table, button, select, input')].find((x) => x.getBoundingClientRect().height > 0);
    const det = document.querySelector('details.run-details');
    const inside = (s) => { const el = document.querySelector(s); return !!el && !!det && det.contains(el); };
    const st = document.querySelector('.status');
    return {
      tabs: box(document.querySelector('.tabs')), panel: box(panel), first: first ? { ...box(first), tag: first.tagName.toLowerCase(), text: first.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) } : null,
      det: det ? { open: det.open, summary: det.querySelector('summary').textContent.replace(/\s+/g, ' ').trim(), top: box(det).top, sumH: Math.round(det.querySelector('summary').getBoundingClientRect().height) } : null,
      folded: { progress: inside('.run-progress'), log: inside('.rp-log'), summary: inside('.run-summary') },
      status: st.textContent.replace(/\s+/g, ' ').trim(), statusH: Math.round(st.getBoundingClientRect().height), header: box(document.querySelector('.header-strip')),
    };
  });
  ok(m.tabs.bottom <= 1000, `the tab bar ends at ${m.tabs.bottom} px`);
  ok(m.first && m.first.top < 1000, `the active tab's first content starts at ${m.first && m.first.top} px`);
  ok(m.det && !m.det.open, '"Run details" is missing or open after the run');
  ok(m.folded.progress && m.folded.log && m.folded.summary, `not folded into "Run details": ${JSON.stringify(m.folded)}`);
  ok(/stages/.test(m.det.summary) && /screened/.test(m.det.summary), `"Run details" summary: "${m.det.summary}"`);
  ok(/Last run/.test(m.status) && m.statusH <= 60, `status line "${m.status}" (${m.statusH} px)`);
  const axeClosed = await runAxe(page, 'Phone, "Run details" closed');
  // Trackability one tap away: opening "Run details" shows the progress panel with every stage done.
  await page.locator('details.run-details > summary').tap();
  await page.waitForTimeout(250);
  const opened = await page.evaluate(() => { const rp = document.querySelector('.run-progress'); return { open: document.querySelector('details.run-details').open, done: document.querySelectorAll('.rp-stage.rp-done').length, stages: document.querySelectorAll('.rp-stage').length, h: Math.round(rp.getBoundingClientRect().height) }; });
  ok(opened.open && opened.h > 100 && opened.done === opened.stages && opened.stages > 0, `after one tap: ${JSON.stringify(opened)}`);
  const axeOpen = await runAxe(page, 'Phone, "Run details" open');
  const badAxe = [axeClosed, axeOpen].filter((r) => !r.skipped).flatMap((r) => serious(r).map((v) => `${r.label}: ${v.impact} ${v.id} ×${v.nodes} (${v.target})`));
  ok(badAxe.length === 0, badAxe.join(' | '));
  await page.locator('details.run-details > summary').tap();
  // A new run ("Reset to defaults"): the progress panel is shown outside "Run details" while it runs, then folds again.
  await page.getByRole('button', { name: 'Reset to defaults' }).tap();
  await page.waitForFunction(() => /Screening options/.test(document.querySelector('.status').textContent), null, { timeout: 30000, polling: 50 });
  const during = await page.evaluate(() => { const rp = document.querySelector('.run-progress'); const det = document.querySelector('details.run-details'); return { inDetails: !!(det && rp && det.contains(rp)), h: rp ? Math.round(rp.getBoundingClientRect().height) : 0 }; });
  ok(!during.inDetails && during.h > 30, `progress panel during the run: ${JSON.stringify(during)}`);
  await page.waitForFunction(() => { const t = document.querySelector('.status').textContent; return /Last run/.test(t) && !/Screening options/.test(t); }, null, { timeout: 180000, polling: 250 });
  const after = await page.evaluate(() => { const rp = document.querySelector('.run-progress'); const det = document.querySelector('details.run-details'); return { inDetails: !!(det && det.contains(rp)), open: det ? det.open : null, tabsBottom: Math.round(document.querySelector('.tabs').getBoundingClientRect().bottom + scrollY) }; });
  ok(after.inDetails && after.tabsBottom <= 1000, `after the second run: ${JSON.stringify(after)}`);
  await ctx.close();
  ok(errors.length === 0, errors.join(' | '));
  report.phone = { tabsBottom: m.tabs.bottom, firstTop: m.first.top };
  return `header strip ${m.header.top}–${m.header.bottom} px, status line ${m.statusH} px ("${m.status.slice(0, 60)}…"), "Run details" (closed) at ${m.det.top} px: "${m.det.summary}"; tab bar ${m.tabs.top}–${m.tabs.bottom} px, first content of the active tab (${m.first.tag} "${m.first.text}") at ${m.first.top} px (was about 5,400 px); one tap opens the progress panel (${opened.done}/${opened.stages} stages done); during a new run the panel is shown outside "Run details" (${during.h} px), and folds again when it finishes (tab bar at ${after.tabsBottom} px)${axeClosed.skipped ? '' : `\n      ${axeLine(axeClosed)}\n      ${axeLine(axeOpen)}`}.`;
});

await check('B20. Site tab at 1400, 1000 and 375 px: no horizontal page scroll with the option selector listing every screened option; the closed selector shows its full name as the title', async () => {
  const { ctx, page, errors } = await openPage({ width: 1400, height: 900, siteBeta: true });
  await openSite(page);
  const screened = Number(((await page.locator('.header-strip').innerText()).match(/([\d,]+) screened/) || [])[1].replace(/,/g, ''));
  const out = [];
  let first = null;
  for (const w of [1400, 1000, 375]) {
    await page.setViewportSize({ width: w, height: w < 768 ? 812 : 900 });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const s = document.querySelector('.site-head select'); const b = s.getBoundingClientRect();
      return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, left: Math.round(b.left), right: Math.round(b.right), n: s.options.length, title: s.title, text: s.options[s.selectedIndex].textContent.replace(/\s+/g, ' ').trim(), longest: Math.max(...[...s.options].map((o) => o.textContent.length)) };
    });
    ok(r.sw <= r.cw, `${w} px: scrollWidth ${r.sw} > clientWidth ${r.cw}`);
    ok(r.right <= r.cw, `${w} px: the selector ends at ${r.right} px`);
    ok(r.n === screened, `${w} px: the selector lists ${r.n} options, ${screened} screened`);
    ok(r.title.replace(/\s+/g, ' ').trim() === r.text, `${w} px: title "${r.title}" ≠ selected "${r.text}"`);
    if (!first) first = r;
    out.push(`${w} px: ${r.sw}/${r.cw}, selector ${r.left}–${r.right} px`);
  }
  await ctx.close();
  ok(errors.length === 0, errors.join(' | '));
  return `scrollWidth/clientWidth ${out.join('; ')}; ${first.n} options listed (= screened), longest label ${first.longest} characters; the title holds the full selected name.`;
});

await check('B21. "Skip to site plan" is the third Tab stop: Enter selects the Site tab and focuses the plan', async () => {
  const { ctx, page, errors } = await openPage({ siteBeta: true });
  const stops = [];
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); stops.push(await active(page)); }
  ok(/Skip to results/.test(stops[0].text) && /Skip to trade-offs chart/.test(stops[1].text) && /Skip to site plan/.test(stops[2].text) && stops[2].visible, `first three Tab stops: ${stops.map((a) => a.text).join(' | ')}`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'site-plan', null, { timeout: 15000 });
  const a = await active(page);
  ok(a.focusVisible, 'plan focused without a visible focus indicator');
  ok((await siteTab(page).getAttribute('aria-selected')) === 'true', 'Site tab not selected');
  await page.waitForFunction(() => !!document.querySelector('#site-plan g[data-block]'), null, { timeout: 30000 });
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
  const live = await page.evaluate(() => (document.querySelector('.site-plan > [aria-live]') || {}).textContent || '');
  ok(/m²/.test(live), `ArrowRight on the plan after the skip link: "${live}"`);
  await ctx.close();
  ok(errors.length === 0, errors.join(' | '));
  report.skipPlan = '3 Tab + Enter';
  return `Tab stops 1–3: "${stops.map((x) => x.text).join('", "')}"; Enter → Site tab selected, focus on the plan (:focus-visible); ArrowRight → "${live.split('. ')[0]}". Plan: 3 Tab + Enter (before: 36 Tab presses after "Skip to results", 218 with Tab only).`;
});

// ---------------------------------------------------------------------------
// Port slice (2026-10-18): Dispatch and Sensitivity tabs (phone width, keyboard readouts, axe light and dark), the
// five-tab bar (sideways scroll, ARIA keyboard pattern, skip links), the hosted page in a host-like document, the
// loading message without scripts and the startup-error display.
// ---------------------------------------------------------------------------
const dispatchTab = (page) => page.getByRole('tab', { name: 'Dispatch', exact: true });
const sensitivityTab = (page) => page.getByRole('tab', { name: 'Sensitivity', exact: true });
async function openDispatch(page) {
  await dispatchTab(page).click();
  await page.waitForSelector('#dispatch-chart', { timeout: 60000 });
}
async function runTornado(page) {
  await sensitivityTab(page).click();
  await page.getByRole('button', { name: /Run sensitivity|Run again/ }).click();
  await page.waitForSelector('#tornado-chart', { timeout: 120000 });
}
const openAllDetails = (page, sel) => page.evaluate((q) => document.querySelectorAll(`${q} details`).forEach((d) => { d.open = true; }), sel);
// Keyboard readout of a chart: focus it, press keys, return the live-region text and the visible readout text.
async function chartReadout(page, sel, keys) {
  await page.focus(sel);
  for (const k of keys) await page.keyboard.press(k);
  await page.waitForTimeout(150);
  return page.evaluate((q) => {
    const el = document.querySelector(q);
    const live = el.querySelector('[aria-live]');
    const tip = el.querySelector('.sc-tip, .tor-tip');
    let fv = false; try { fv = el.matches(':focus-visible'); } catch { fv = false; }
    return { live: live ? live.textContent.replace(/\s+/g, ' ').trim() : '', tip: tip ? tip.textContent.replace(/\s+/g, ' ').trim() : '', focused: document.activeElement === el, focusVisible: fv };
  }, sel);
}

const phonePort = await openPage({ width: 375, height: 812, isMobile: true, hasTouch: true, siteBeta: true });
await check('B22. Phone width (375 px, touch): the Dispatch tab causes no horizontal page scroll with its tables open; the timeline and hourly charts give a keyboard readout on screen and in a live region; year, week box (8-day week 52) and presets work; the check against the ranking says it matches', async () => {
  const { page, errors } = phonePort;
  const t0 = Date.now();
  await openDispatch(page);
  const ms = Date.now() - t0;
  await openAllDetails(page, '.dv');
  await page.waitForTimeout(300);
  const w1 = await pageWidths(page);
  ok(w1[0] <= w1[1], `Dispatch tab scrollWidth ${w1[0]} > clientWidth ${w1[1]}`);
  const r1 = await chartReadout(page, '#dispatch-timeline', ['ArrowRight', 'ArrowRight']);
  ok(r1.focused && r1.focusVisible, 'timeline chart not focused with a visible indicator');
  ok(/month 1/.test(r1.live) && /Design load/.test(r1.live) && r1.tip.includes('Design load'), `timeline readout: "${r1.live.slice(0, 120)}"`);
  const r2 = await chartReadout(page, '#dispatch-chart', ['ArrowRight', 'End']);
  ok(/Year \d+ · day \d+/.test(r2.live) && /Facility demand \(net\)/.test(r2.live), `hourly readout: "${r2.live.slice(0, 120)}"`);
  ok(r2.tip.includes('Facility demand (net)'), 'hourly readout not shown on screen');
  const check = await page.locator('.dv-notes [data-check]').getAttribute('data-check');
  ok(check === 'match', `check against the ranking: ${check}`);
  // The last model year (the steady state; year 1 has no load before the first phase), then week 52 typed: the week
  // table has 192 hourly rows (8 days).
  const years = page.locator('.dv-controls [role=group][aria-label="Model year"] button');
  const nYears = await years.count();
  await years.nth(nYears - 1).click();
  await page.locator('#dv-week').fill('52');
  await page.locator('#dv-week').press('Enter');
  await openAllDetails(page, '.dv');
  await page.waitForTimeout(200);
  const rows52 = await page.evaluate(() => { const t = [...document.querySelectorAll('.dv details')].find((d) => /Week 52 as a table/.test(d.textContent)); return t ? t.querySelectorAll('tbody tr').length : 0; });
  ok(rows52 === 192, `week 52 table rows ${rows52} (expected 192)`);
  const presets = await page.locator('.dv-controls button[aria-pressed]').count();
  const w2 = await pageWidths(page);
  ok(w2[0] <= w2[1], `after the week change scrollWidth ${w2[0]} > clientWidth ${w2[1]}`);
  ok(errors.length === 0, errors.join(' | '));
  return `Dispatch tab ready ${ms} ms after the click (option re-run on this device); ${w1[0]}/${w1[1]} px with every table open; timeline readout "${r1.live.slice(0, 70)}…"; hourly readout "${r2.live.slice(0, 70)}…"; check "match"; year ${nYears} week 52 = ${rows52} rows; ${presets} year/preset buttons; ${w2[0]}/${w2[1]} px after.`;
});

await check('B23. Phone width (375 px, touch): the Sensitivity tab runs the tornado for the leader without horizontal page scroll; arrow keys on the tornado give a readout (the live region repeats the on-screen readout); one table row per driver; the base re-run matches the ranking', async () => {
  const { page, errors } = phonePort;
  const t0 = Date.now();
  await runTornado(page);
  const ms = Date.now() - t0;
  const w = await pageWidths(page);
  ok(w[0] <= w[1], `Sensitivity tab scrollWidth ${w[0]} > clientWidth ${w[1]}`);
  const r = await chartReadout(page, '#tornado-chart', ['ArrowDown']);
  ok(r.focused && r.focusVisible, 'tornado not focused with a visible indicator');
  ok(/^1 of \d+: /.test(r.live) && /Swing [\d.]+ points/.test(r.live) && r.tip === r.live, `tornado readout: live "${r.live.slice(0, 80)}" tip "${r.tip.slice(0, 80)}"`);
  const r2 = await chartReadout(page, '#tornado-chart', ['End']);
  ok(/^(\d+) of \1: /.test(r2.live), `End: "${r2.live.slice(0, 60)}"`);
  const rows = await page.locator('.sens-table tbody tr').count();
  const bars = await page.locator('#tornado-chart g[data-driver]').count();
  ok(rows === bars && rows >= 7, `rows ${rows}, bars ${bars}`);
  ok((await page.locator('.sens-base [data-check]').getAttribute('data-check')) === 'match', 'base re-run differs from the ranking');
  ok(errors.length === 0, errors.join(' | '));
  return `tornado (15 re-runs) in ${(ms / 1000).toFixed(1)} s; ${w[0]}/${w[1]} px; readout "${r.live.slice(0, 80)}…"; End → "${r2.live.slice(0, 30)}…"; ${rows} drivers; base re-run matches the ranking.`;
});

await check('B24. Tab bar with five tabs at 375 px: the tab list scrolls sideways, the page does not; arrow keys wrap through all five tabs (ARIA tabs pattern), Home/End go to the first and last, and the selected tab is scrolled into view inside the list', async () => {
  const { page, errors } = phonePort;
  await optionsTab(page).click();
  const m = await page.evaluate(() => { const t = document.querySelector('.tabs'); return { sw: t.scrollWidth, cw: t.clientWidth, n: t.querySelectorAll('[role=tab]').length, labels: [...t.querySelectorAll('[role=tab]')].map((x) => x.textContent) }; });
  ok(m.n === 5 && m.sw > m.cw, `tab list ${m.n} tabs, scrollWidth ${m.sw} vs clientWidth ${m.cw}`);
  const w = await pageWidths(page);
  ok(w[0] <= w[1], `page scrollWidth ${w[0]} > ${w[1]}`);
  await page.focus('#tab-options');
  const seq = [];
  const inView = () => page.evaluate(() => { const a = document.activeElement; const t = document.querySelector('.tabs'); const ra = a.getBoundingClientRect(), rt = t.getBoundingClientRect(); return { id: a.id, sel: a.getAttribute('aria-selected'), tabindex: a.getAttribute('tabindex'), inside: ra.left >= rt.left - 1 && ra.right <= rt.right + 1 }; });
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    const a = await inView();
    seq.push(a.id.replace('tab-', ''));
    ok(a.sel === 'true' && a.tabindex === '0' && a.inside, `after ${i + 1} ArrowRight: ${JSON.stringify(a)}`);
  }
  ok(seq.join(',') === 'tradeoffs,site,dispatch,sensitivity,options', `ArrowRight order: ${seq.join(',')}`);
  await page.keyboard.press('End'); await page.waitForTimeout(200);
  const e = await inView();
  await page.keyboard.press('Home'); await page.waitForTimeout(200);
  const h = await inView();
  ok(e.id === 'tab-sensitivity' && e.inside && h.id === 'tab-options' && h.inside, `End → ${e.id} (${e.inside}), Home → ${h.id} (${h.inside})`);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(200);
  const l = await inView();
  ok(l.id === 'tab-sensitivity', `ArrowLeft from the first tab → ${l.id}`);
  ok(errors.length === 0, errors.join(' | '));
  return `tab list ${m.sw}/${m.cw} px (scrolls), page ${w[0]}/${w[1]} px; ArrowRight: ${seq.join(' → ')}; End → Sensitivity, Home → Options, ArrowLeft from Options → Sensitivity; the selected tab is inside the visible part of the list every time.`;
});
await phonePort.ctx.close();

await check('B25. Skip links with five tabs at 375 px: "Skip to results", "Skip to trade-offs chart" and "Skip to site plan" are still the first three Tab stops, and "Skip to site plan" selects the Site tab (scrolled into view in the tab list) and focuses the plan', async () => {
  const { ctx, page, errors } = await openPage({ width: 375, height: 812, isMobile: true, hasTouch: true, siteBeta: true });
  const stops = [];
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); stops.push(await active(page)); }
  ok(/Skip to results/.test(stops[0].text) && /Skip to trade-offs chart/.test(stops[1].text) && /Skip to site plan/.test(stops[2].text), `first three Tab stops: ${stops.map((a) => a.text).join(' | ')}`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'site-plan', null, { timeout: 30000 });
  const sel = await page.evaluate(() => { const a = document.getElementById('tab-site'); const t = document.querySelector('.tabs'); const ra = a.getBoundingClientRect(), rt = t.getBoundingClientRect(); return { sel: a.getAttribute('aria-selected'), inside: ra.left >= rt.left - 1 && ra.right <= rt.right + 1 }; });
  ok(sel.sel === 'true' && sel.inside, `Site tab ${JSON.stringify(sel)}`);
  await ctx.close();
  ok(errors.length === 0, errors.join(' | '));
  return `Tab stops 1–3: "${stops.map((x) => x.text).join('", "')}"; Enter on "Skip to site plan" → Site tab selected and inside the visible tab list, plan focused.`;
});

async function portAxe(colorScheme) {
  const { ctx, page, errors } = await openPage({ colorScheme, siteBeta: true });
  const out = [];
  await openDispatch(page);
  await openAllDetails(page, '.dv');
  await chartReadout(page, '#dispatch-chart', ['ArrowRight']);
  out.push(await runAxe(page, `Dispatch tab, tables open, readout shown (${colorScheme})`));
  const reviewD = await verifyNeedsReviewContrast(page);
  // An option with firm on-site plant and a battery (hatched firm bands, battery charge level chart).
  const pick = await page.evaluate(() => { const o = [...document.querySelectorAll('#dv-option option')].find((x) => /fuel cells|gas recips|CHP/i.test(x.textContent) && /BESS/.test(x.textContent)); return o ? o.value : null; });
  if (pick) {
    await page.locator('#dv-option').selectOption(pick);
    await page.waitForFunction(() => !document.querySelector('.dv-wait') && document.querySelector('#dispatch-chart'), null, { timeout: 60000 });
    await openAllDetails(page, '.dv');
    out.push(await runAxe(page, `Dispatch tab, an option with firm plant and a battery (${colorScheme})`));
  }
  await runTornado(page);
  await chartReadout(page, '#tornado-chart', ['ArrowDown']);
  out.push(await runAxe(page, `Sensitivity tab with the tornado and readout (${colorScheme})`));
  const reviewS = await verifyNeedsReviewContrast(page);
  const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await ctx.close();
  return { out, errors, body, reviewD, reviewS, pick };
}
for (const scheme of ['light', 'dark']) {
  await check(`B${scheme === 'light' ? 26 : 27}. axe, ${scheme} theme: Dispatch tab (charts, legend, readout, every table open; the leader and an option with firm plant and a battery) and Sensitivity tab (tornado, readout, table) have no serious or critical violation`, async () => {
    if (!AXE) return { skip: 'axe-core is not installed.' };
    const { out, errors, body, reviewD, reviewS, pick } = await portAxe(scheme);
    if (scheme === 'dark') ok(/30, 33, 37|21, 23, 26/.test(body), `dark theme not applied (body ${body})`);
    const bad = out.flatMap((r) => serious(r).map((v) => `${r.label}: ${v.impact} ${v.id} ×${v.nodes} (${v.target}) ${v.msg}`));
    ok(bad.length === 0, bad.join(' | '));
    for (const [lbl, rv] of [['Dispatch', reviewD], ['Sensitivity', reviewS]]) ok(!rv || rv.below.length === 0, `${lbl}: needs-review text below the contrast minimum: ${rv ? rv.below.slice(0, 5).join(' | ') : ''}`);
    ok(errors.length === 0, errors.join(' | '));
    ok(pick, 'no option with firm plant and a battery in the selector');
    return [...out.map(axeLine), reviewLine(`Dispatch tab (${scheme})`, reviewD), reviewLine(`Sensitivity tab (${scheme})`, reviewS)].join('\n      ');
  });
}

const HOSTED_FILE = join(ROOT, 'dist', 'energy-tool-hosted.html');
await check('B28. Hosted page (dist/energy-tool-hosted.html) inside a host-like document: no document wrapper of its own, loads, runs and shows results with no console errors; the run log is copied (or shown selected for copying), never downloaded', async () => {
  const { readFileSync } = await import('node:fs');
  ok(existsSync(HOSTED_FILE), 'dist/energy-tool-hosted.html missing: run npm run build');
  const content = readFileSync(HOSTED_FILE, 'utf8');
  ok(!/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(content.replace(/<script>[\s\S]*?<\/script>/g, '')), 'hosted page carries document tags');
  // The host adds the document: a doctype, head with charset and viewport, and a body holding the page content.
  const hostFile = join(tmpdir(), `host-${process.pid}.html`);
  writeFileSync(hostFile, `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${content}</body></html>`);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); } catch { /* not grantable here: the fallback path is checked instead */ }
  const page = await ctx.newPage();
  const errors = [];
  const downloads = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('download', (d) => downloads.push(d.suggestedFilename()));
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  try {
    await page.goto(pathToFileURL(hostFile).href, { waitUntil: 'load' });
    await page.waitForFunction(() => { const st = document.querySelector('.status'); const t = st ? st.textContent : ''; return /Run failed/.test(t) || (/Last run/.test(t) && !/Screening options/.test(t)); }, null, { timeout: 180000, polling: 250 });
    const status = (await page.locator('.status').innerText()).replace(/\s+/g, ' ').trim();
    ok(!/Run failed/.test(status), `run failed: ${status}`);
    ok(await page.locator('[role=tab]').count() === 4, 'results tabs missing (four with the Site tab, a Beta feature, off by default)');
    await page.evaluate(() => { const d = document.querySelector('details.run-progress'); if (d) d.open = true; });
    const label = await page.locator('.rp-dl-label').innerText();
    ok(/Copy run log/.test(label) && !/Download/.test(label), `run-log label "${label}"`);
    await page.locator('.rp-log-head').getByRole('button', { name: 'JSON' }).click();
    await page.waitForFunction(() => !!document.querySelector('.rp-copied') || !!document.querySelector('#rp-copy-text'), null, { timeout: 10000 });
    const res = await page.evaluate(async () => {
      const copied = document.querySelector('.rp-copied');
      const ta = document.querySelector('#rp-copy-text');
      let clip = null; try { clip = await navigator.clipboard.readText(); } catch { clip = null; }
      return { copied: copied ? copied.textContent : null, fallback: ta ? { len: ta.value.length, selected: document.activeElement === ta && ta.selectionEnd - ta.selectionStart === ta.value.length, head: ta.value.slice(0, 40) } : null, clipHead: clip ? clip.slice(0, 40) : null };
    });
    ok(res.copied ? /Copied JSON/.test(res.copied) : (res.fallback && res.fallback.selected && /"schema"|dc-energy-run-log/.test(res.fallback.head)), `copy result ${JSON.stringify(res)}`);
    await page.waitForTimeout(500);
    ok(downloads.length === 0, `a download started: ${downloads.join(', ')}`);
    const outside = requests.filter((u) => !/^(file:|blob:|data:)/.test(u));
    ok(outside.length === 0, `requests outside the page: ${outside.slice(0, 3).join(', ')}`);
    ok(errors.length === 0, errors.join(' | '));
    return `host-like document: ran (${status.slice(0, 60)}…); label "${label.trim()}"; JSON ${res.copied ? `copied to the clipboard (${res.clipHead ? `clipboard starts "${res.clipHead.slice(0, 24)}…"` : 'clipboard not readable here'})` : `not allowed, shown selected (${res.fallback.len.toLocaleString('en-GB')} characters)`}; 0 downloads; ${requests.length} requests, all file:/blob:/data:.`;
  } finally {
    await ctx.close();
    try { unlinkSync(hostFile); } catch { /* ignore */ }
  }
});

await check('B29. Loading message and startup errors: with scripts off the single file shows the loading message and the "needs JavaScript" note (never a blank page); a startup error is shown on the page (role=alert); once the app runs, a later error leaves the page alone', async () => {
  const { readFileSync } = await import('node:fs');
  const out = [];
  // (a) Scripts off.
  const c1 = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1000, height: 700 } });
  const p1 = await c1.newPage();
  await p1.goto(pathToFileURL(FILE).href, { waitUntil: 'load' });
  const t1 = (await p1.locator('body').innerText()).replace(/\s+/g, ' ');
  ok(/Loading the energy optioneering tool/.test(t1) && /open the file in a web browser/.test(t1) && /needs JavaScript/.test(t1), `scripts off: "${t1.slice(0, 160)}"`);
  await c1.close();
  out.push('scripts off: loading message with the "open in a web browser" instruction and the noscript note');
  // (b) A copy of the single file whose app script throws at startup.
  const html = readFileSync(FILE, 'utf8');
  const scripts = [...html.matchAll(/<script>[\s\S]*?<\/script>/g)];
  const appTag = scripts.reduce((a, b) => (b[0].length > a[0].length ? b : a));
  const broken = html.slice(0, appTag.index) + '<script>throw new Error("startup test error")</script>' + html.slice(appTag.index + appTag[0].length);
  const bFile = join(tmpdir(), `broken-${process.pid}.html`);
  writeFileSync(bFile, broken);
  const c2 = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const p2 = await c2.newPage();
  try {
    await p2.goto(pathToFileURL(bFile).href, { waitUntil: 'load' });
    await p2.waitForSelector('#boot-error', { timeout: 10000 });
    const e2 = await p2.evaluate(() => { const b = document.getElementById('boot-error'); return { role: b.getAttribute('role'), text: b.textContent }; });
    ok(e2.role === 'alert' && /startup test error/.test(e2.text) && /Reload the page/.test(e2.text), `startup error box ${JSON.stringify(e2)}`);
    out.push(`startup error shown: "${e2.text.slice(0, 70)}…" (role=alert)`);
  } finally {
    await c2.close();
    try { unlinkSync(bFile); } catch { /* ignore */ }
  }
  // (c) The running app: a later error does not add the startup box (the app's own handling applies).
  const { ctx, page } = await openPage();
  await page.evaluate(() => { window.dispatchEvent(new ErrorEvent('error', { message: 'late test error' })); });
  await page.waitForTimeout(200);
  const late = await page.evaluate(() => ({ box: !!document.getElementById('boot-error'), boot: !!document.querySelector('#root .boot'), tabs: document.querySelectorAll('[role=tab]').length }));
  ok(!late.box && !late.boot && late.tabs === 4, `after the app runs (four tabs: the Site tab is Beta, off by default): ${JSON.stringify(late)}`);
  await ctx.close();
  out.push('running app: a later error event leaves the page as it is (no startup box, loading message gone)');
  return out.join('; ') + '.';
});

// Site tab as a Beta feature (walkthrough, 2026-10-21; BRIEF §12.12, AC 27).
await check('B30. Site tab (Beta): hidden by default; turned on in the general settings it appears labelled Beta; the ranking (top 20 rows, scores, leader) is identical with it on or off and nothing re-runs; with it off the header strip and the options table show no site fit', async () => {
  const { ctx, page, errors } = await openPage();
  const tabNames = () => page.$$eval('[role=tab]', (ts) => ts.map((t) => t.textContent.trim()));
  const rows = () => page.$$eval('.rank-table tbody tr:not(.detail-row)', (trs) => trs.slice(0, 20).map((tr) => [...tr.querySelectorAll('td')].slice(0, 3).map((td) => td.textContent.trim()).join('|')));
  const leader = () => page.locator('.header-strip .hs-item').nth(1).innerText();
  const headers = () => page.$$eval('.rank-table thead th', (ths) => ths.map((t) => t.textContent.trim()));
  const off1 = { tabs: await tabNames(), rows: await rows(), leader: await leader(), heads: await headers(), strip: await page.locator('.header-strip').innerText() };
  ok(!off1.tabs.some((t) => /^Site/.test(t)), `Site tab shown by default: ${off1.tabs.join(', ')}`);
  ok(!/Site fit/i.test(off1.strip), 'header strip shows site fit with the tab off');
  ok(!off1.heads.some((h) => /Site fit|Land take/.test(h)), `options table shows site columns with the tab off: ${off1.heads.join(', ')}`);
  ok(!(await page.locator('a.skip', { hasText: 'Skip to site plan' }).count()), '"Skip to site plan" shown with the tab off');
  await enableSiteBeta(page);
  const status = await page.locator('.status').innerText();
  ok(!/Screening options/.test(status), 'turning the Site tab on started a re-run');
  const on = { tabs: await tabNames(), rows: await rows(), leader: await leader(), heads: await headers(), strip: await page.locator('.header-strip').innerText() };
  ok(on.tabs.includes('Site Beta'), `Site tab not labelled Beta: ${on.tabs.join(', ')}`);
  ok(/Site fit \(Beta\)/i.test(on.strip), 'header strip has no site-fit item with the tab on');
  ok(on.heads.some((h) => /Site fit \(Beta\)/.test(h)), 'options table has no site-fit column with the tab on');
  ok(JSON.stringify(on.rows) === JSON.stringify(off1.rows) && on.leader === off1.leader, 'the ranking differs with the Site tab on');
  // Off again from the Site tab: back to Options, the same ranking.
  await siteTab(page).click();
  await page.waitForSelector('#site-plan');
  await page.getByRole('button', { name: 'General settings' }).click();
  await page.locator('#gs-site-beta').uncheck();
  await page.getByRole('button', { name: 'Close settings' }).click();
  const off2 = { tabs: await tabNames(), sel: await page.$eval('[role=tab][aria-selected=true]', (t) => t.textContent.trim()), rows: await rows(), leader: await leader() };
  ok(!off2.tabs.some((t) => /^Site/.test(t)) && off2.sel === 'Options', `after turning it off: tabs ${off2.tabs.join(', ')}, selected ${off2.sel}`);
  ok(JSON.stringify(off2.rows) === JSON.stringify(off1.rows) && off2.leader === off1.leader, 'the ranking changed after turning the Site tab off');
  ok(errors.length === 0, errors.join('; '));
  await ctx.close();
  return `default tabs: ${off1.tabs.join(', ')}; on: ${on.tabs.join(', ')} (no re-run); top ${off1.rows.length} rows and leader identical off → on → off; site fit in the header strip and the table only when on; turning it off from the Site tab returns to Options.`;
});

await browser.close();
const passed = results.filter((r) => r.status === 'PASS').length;
const skipped = results.filter((r) => r.status === 'SKIP').length;
console.log(`\n${passed}/${results.length} browser checks passed${skipped ? `, ${skipped} skipped` : ''}.`);
if (report.tabOnly) console.log(`Keyboard: chart in 2 Tab + Enter via the skip link (results: 1 Tab + Enter${report.skipPlan ? `; site plan: ${report.skipPlan}` : ''}); Tab only from the top: ${report.tabOnly.toChart} presses (${report.tabOnly.panelStops} in the inputs panel).`);
if (report.weightMs != null) console.log(`Weight-change repaint: median ${report.weightMs.toFixed(0)} ms (asserted ≤ ${B9_BOUND_MS} ms here; §17 target ≤ 100 ms on the 4-core reference machine).`);
if (report.phone) console.log(`Phone (375 px): tab bar ends at ${report.phone.tabsBottom} px; active tab content starts at ${report.phone.firstTop} px (bound 1,000 px).`);
process.exit(failures ? 1 : 0);
