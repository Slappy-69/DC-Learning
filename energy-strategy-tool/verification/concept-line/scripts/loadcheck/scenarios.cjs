// Load scenarios for the single-file build. Usage: node scenarios.cjs <path-to-html> [scenario ...]
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

const file = process.argv[2];
const only = process.argv.slice(3);
const html = fs.readFileSync(file);

const CSP = {
  none: null,
  noBlobWorker: "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:",
  noInline: "default-src 'self'; script-src 'self'; style-src 'self'",
};

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/tool.html') {
    const csp = CSP[u.searchParams.get('csp') || 'none'];
    const h = { 'Content-Type': 'text/html; charset=utf-8' };
    if (csp) h['Content-Security-Policy'] = csp;
    res.writeHead(200, h);
    return res.end(html);
  }
  if (u.pathname === '/hosted-inner.html') {
    const frag = fs.readFileSync(process.env.HOSTED_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline' blob: https://cdnjs.cloudflare.com; worker-src blob:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:" });
    return res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${frag}</body></html>`);
  }
  if (u.pathname === '/hosted.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`<!doctype html><body style="margin:0"><iframe id="f" sandbox="allow-scripts allow-forms allow-popups" src="/hosted-inner.html" style="width:100vw;height:100vh;border:0"></iframe></body>`);
  }
  if (u.pathname === '/frame.html') {
    const sb = u.searchParams.get('sandbox');
    const csp = u.searchParams.get('csp') || 'none';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`<!doctype html><body style="margin:0"><iframe id="f" ${sb !== null ? `sandbox="${sb}"` : ''} src="/tool.html?csp=${csp}" style="width:100vw;height:100vh;border:0"></iframe></body>`);
  }
  res.writeHead(404); res.end();
});

const scenarios = [
  { id: 'plain-http', url: '/tool.html' },
  { id: 'csp-no-blob-worker', url: '/tool.html?csp=noBlobWorker' },
  { id: 'csp-no-inline-script', url: '/tool.html?csp=noInline', expectFail: true },
  { id: 'iframe-sandbox-scripts-only', url: '/frame.html?sandbox=allow-scripts', frame: true },
  { id: 'iframe-sandbox-same-origin', url: '/frame.html?sandbox=allow-scripts%20allow-same-origin', frame: true },
  { id: 'iframe-sandbox-no-scripts', url: '/frame.html?sandbox=', frame: true, expectFail: true },
  { id: 'hosted-page-in-sandboxed-frame', url: '/hosted.html', frame: true, frameMatch: '/hosted-inner.html', copyCheck: true },
  { id: 'hosted-page-phone', url: '/hosted.html', frame: true, frameMatch: '/hosted-inner.html', mobile: true },
  { id: 'phone-4x-cpu', url: '/tool.html', mobile: true, throttle: 4 },
  { id: 'phone-4x-cpu-no-worker', url: '/tool.html?csp=noBlobWorker', mobile: true, throttle: 4 },
];

(async () => {
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const s of scenarios) {
    if (only.length && !only.includes(s.id)) continue;
    const ctx = await browser.newContext(s.mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 160)));
    if (s.throttle) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: s.throttle }); }
    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:${port}${s.url}`);
    let target = page;
    if (s.frame) {
      await page.waitForTimeout(500);
      target = page.frames().find((f) => f.url().includes(s.frameMatch || '/tool.html')) || page.mainFrame();
    }
    let firstUi = null, done = null, text = '';
    const deadline = Date.now() + 240000;
    while (Date.now() < deadline) {
      const st = await target.evaluate(() => ({
        ui: !!(document.getElementById('root') && document.getElementById('root').childElementCount),
        done: !!document.getElementById('tab-options'),
        text: document.body ? document.body.innerText.slice(0, 4000) : '',
      })).catch(() => ({ ui: false, done: false, text: '' }));
      if (st.ui && firstUi === null) firstUi = Date.now() - t0;
      text = st.text;
      if (st.done) { done = Date.now() - t0; break; }
      if (s.expectFail && Date.now() - t0 > 8000) break;
      await page.waitForTimeout(250);
    }
    const statusLine = (text.match(/Last run[^\n]*/) || text.match(/Worker[^\n]*/) || text.match(/main thread[^\n]*/) || [''])[0];
    const visible = text.replace(/\s+/g, ' ').slice(0, 140);
    console.log(`\n[${s.id}] firstUI=${firstUi ?? 'never'} ms, results=${done ?? 'never'} ms${s.expectFail ? ' (expected to fail)' : ''}`);
    console.log(`  status: ${statusLine.slice(0, 160)}`);
    console.log(`  loading message still shown: ${/Loading the energy optioneering tool/.test(text)}; startup error shown: ${/stopped with an error/.test(text)}`);
    if (!firstUi) console.log(`  visible text: "${visible}"`);
    console.log(`  console: ${errors.length ? [...new Set(errors)].slice(0, 4).join(' | ') : 'none'}`);
    if (s.copyCheck && done) {
      const r = await target.evaluate(async () => {
        const det = document.querySelector('details.run-progress'); if (det) det.open = true;
        await new Promise((ok) => setTimeout(ok, 300));
        const label = (document.querySelector('.rp-dl-label') || {}).textContent || '';
        const btn = [...document.querySelectorAll('.rp-log-head .chip-btn')].find((b) => b.textContent === 'JSON');
        if (btn) btn.click();
        await new Promise((ok) => setTimeout(ok, 800));
        const copied = (document.querySelector('.rp-copied') || {}).textContent || '';
        const ta = document.getElementById('rp-copy-text');
        return { label, copied, fallbackChars: ta ? ta.value.length : 0, selected: ta ? ta.selectionEnd - ta.selectionStart : 0 };
      });
      console.log(`  copy-log check: label "${r.label}", copied "${r.copied}", fallback text ${r.fallbackChars} chars (selected ${r.selected})`);
      await page.screenshot({ path: __dirname + '/hosted-desktop.png' });
    }
    if (s.id === 'hosted-page-phone' && done) await page.screenshot({ path: __dirname + '/hosted-phone.png' });
    if (s.id === 'hosted-page-phone' && done) console.log(`  phone overflow px: ${await target.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)}`);
    await ctx.close();
  }
  await browser.close();
  server.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
