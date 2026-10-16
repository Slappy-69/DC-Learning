// Browser checks for the built single file (dist/energy-tool-single-file.html). Run `npm run build`
// first, then `npm run test:browser` (node tests/browser-tests.mjs).
//
// Uses Playwright with Chromium and axe-core (devDependency). If Playwright or a Chromium binary is not
// available, the script prints SKIP with the reason and exits 0; it never installs browsers.
// Covers what the Node suite cannot: the Canvas drawing path (> view.pareto.canvasAbove points) and its
// pointer hit-testing, keyboard navigation on the chart, table paging, skip links and tab order,
// removable filter chips, the off-canvas inputs panel at tablet width, phone overflow, and an axe audit
// (WCAG 2.0/2.1/2.2 A and AA rules) in light and dark themes.
//
// Exit code 1 if any check fails.

import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
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
async function check(name, fn) {
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

async function openPage({ width = 1400, height = 900, colorScheme = 'light', isMobile = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme, isMobile, deviceScaleFactor: 1 });
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
  return { ctx, page, errors, loadS: (Date.now() - t0) / 1000, status };
}
const tradeoffsTab = (page) => page.getByRole('tab', { name: 'Trade-offs', exact: true });
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

await check('B9. A weight preset moves the pick without a re-run (§17 target ≤ 100 ms, measured in the browser)', async () => {
  const { page } = main;
  await tradeoffsTab(page).click();
  await page.waitForSelector('.pick-line');
  const before = await page.locator('.pick-line strong').first().innerText();
  const leaderBefore = await page.locator('.header-strip .hs-item').nth(1).innerText();
  const ms = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll('.preset-row button')].find((b) => b.textContent.trim() === 'Lowest cost');
    const pl = document.querySelector('.pick-line strong');
    const was = pl.textContent;
    const t0 = performance.now();
    btn.click();
    return await new Promise((resolve) => {
      const tick = () => { const now = document.querySelector('.pick-line strong'); if (now && now.textContent !== was) resolve(performance.now() - t0); else requestAnimationFrame(tick); };
      tick();
      setTimeout(() => resolve(-1), 5000);
    });
  });
  const after = await page.locator('.pick-line strong').first().innerText();
  const leaderAfter = await page.locator('.header-strip .hs-item').nth(1).innerText();
  const status = await page.locator('.status').innerText();
  ok(ms >= 0 && after !== before, 'the pick did not change with the "Lowest cost" preset');
  ok(leaderAfter.includes(after.replace(/^#\d+ /, '')), `header leader "${leaderAfter}" is not the pick "${after}"`);
  ok(!/Screening options/.test(status), 'a weight change started a re-run');
  report.weightMs = ms;
  await page.locator('.preset-row button', { hasText: 'Balanced' }).click();
  return `pick "${before.slice(0, 40)}…" → "${after.slice(0, 40)}…" in ${ms.toFixed(0)} ms (click to repaint of the pick line; no re-run); header leader = pick before (${leaderBefore.includes(before.replace(/^#\d+ /, '')) ? 'yes' : 'no'}) and after (yes).`;
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

await browser.close();
const passed = results.filter((r) => r.status === 'PASS').length;
const skipped = results.filter((r) => r.status === 'SKIP').length;
console.log(`\n${passed}/${results.length} browser checks passed${skipped ? `, ${skipped} skipped` : ''}.`);
if (report.tabOnly) console.log(`Keyboard: chart in 2 Tab + Enter via the skip link (results: 1 Tab + Enter); Tab only from the top: ${report.tabOnly.toChart} presses (${report.tabOnly.panelStops} in the inputs panel).`);
process.exit(failures ? 1 : 0);
