// Tests for the Linux desktop build (out/desktop/Concept-Energy-Optioneering-<version>-linux-x64.tar.gz).
// The archive is unpacked to a temporary folder and the program is started under a virtual display (xvfb-run when
// there is no DISPLAY). Playwright attaches over Chromium's remote-debugging port: Playwright's own Electron launcher
// needs Node's --inspect, which the EnableNodeCliInspectArguments fuse switches off on purpose.
//
// Usage: node desktop/test-desktop.mjs [--archive <path>] [--input <energy-tool-single-file.html>] [--keep]
// Writes test-results/desktop.json. Exit code 1 if any check fails.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { EXPECTED, readFuses } from './fuses.mjs';
import { CONFIG } from './stage.mjs';
import { APP_NAME, DEFAULT_SINGLE_FILE, PACKAGING_ROOT, args, loadPlaywright, sha256 } from '../lib/common.mjs';

const require = createRequire(import.meta.url);
const asar = require('@electron/asar');
const a = args();
const OUT = join(PACKAGING_ROOT, 'out', 'desktop');
const ARCHIVE = resolve(a.archive || (existsSync(OUT) ? join(OUT, readdirSync(OUT).find((f) => /-linux-x64\.tar\.gz$/.test(f)) || 'missing') : 'missing'));
const INPUT = resolve(a.input || DEFAULT_SINGLE_FILE);
const TMP = mkdtempSync(join(tmpdir(), 'desktop-test-'));
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
    results.push({ name, status: 'FAIL', error: String((e && e.stack) || e) });
    annotate(name, String((e && e.message) || e));
    console.log(`FAIL  ${name}\n      ${e && e.stack ? e.stack.split('\n').slice(0, 5).join('\n      ') : e}`);
  }
}
const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
// On GitHub Actions, failures also become annotations, which anyone can read on the run page without the full log.
const esc = (t) => String(t).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
function annotate(title, message) {
  if (process.env.GITHUB_ACTIONS) console.log(`::error title=${esc(title.slice(0, 80)).replace(/[:,]/g, ' ')}::${esc(message.slice(0, 1500))}`);
}
const freePort = () => new Promise((res, rej) => { const s = createServer(); s.once('error', rej); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); });
const until = async (fn, ms, what) => { const t = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > t) throw new Error(`timed out after ${ms / 1000} s: ${what}`); await new Promise((r) => setTimeout(r, 250)); } };

if (!existsSync(ARCHIVE)) {
  console.log(`No Linux archive found (${ARCHIVE}). Build it first: node desktop/build-desktop.mjs --platforms linux-x64`);
  process.exit(1);
}
console.log(`Desktop tests: ${ARCHIVE}`);

// --- Unpack ---------------------------------------------------------------------------------------------------------
const UNPACK = join(TMP, 'unpacked');
mkdirSync(UNPACK, { recursive: true });
execFileSync('tar', ['-xzf', ARCHIVE, '-C', UNPACK]);
const [FOLDER] = readdirSync(UNPACK);
const DIR = join(UNPACK, FOLDER);
const BIN = join(DIR, CONFIG.linuxExecutableName);
const RES = join(DIR, 'resources');
const ASAR = join(RES, 'app.asar');

await check('D1. Archive: checksum listed in SHA256SUMS.txt, folder holds the executable and resources/app.asar only (no loose app folder)', async () => {
  const sums = readFileSync(join(OUT, 'SHA256SUMS.txt'), 'utf8');
  const name = ARCHIVE.split('/').pop();
  const line = sums.split('\n').find((l) => l.endsWith(`  ${name}`));
  ok(line, `${name} not listed in SHA256SUMS.txt`);
  ok(line.split(/\s+/)[0] === sha256(readFileSync(ARCHIVE)), 'checksum does not match the archive');
  ok(existsSync(BIN) && (statSync(BIN).mode & 0o111), `executable missing or not executable: ${BIN}`);
  ok(existsSync(ASAR), 'resources/app.asar missing');
  ok(!existsSync(join(RES, 'app')), 'resources/app folder present: code could load from outside the asar');
  const mb = (statSync(ARCHIVE).size / 1048576).toFixed(1);
  const unpackedMB = execFileSync('du', ['-sm', DIR]).toString().split(/\s+/)[0];
  return `${name}: ${mb} MB (unpacked ${unpackedMB} MB); folder ${FOLDER}`;
});

let info = null;
await check('D2. app.asar holds the unmodified web app (SHA-256 equals the input build) and build-info.json with the CSP', async () => {
  const files = asar.listPackage(ASAR).map((f) => f.replace(/\\/g, '/'));
  for (const f of ['/main.js', '/package.json', '/build-info.json', '/web/index.html', '/lib/guards.js', '/lib/menu.js', '/lib/window-state.js', '/icons/icon.png']) ok(files.includes(f), `${f} missing from app.asar`);
  info = JSON.parse(asar.extractFile(ASAR, 'build-info.json').toString('utf8'));
  const web = asar.extractFile(ASAR, 'web/index.html');
  ok(sha256(web) === info.webSha256, 'web/index.html does not match build-info.webSha256');
  if (existsSync(INPUT)) ok(sha256(web) === sha256(readFileSync(INPUT)), `bundled web app differs from ${INPUT} (rebuild the desktop program)`);
  ok(/default-src 'none'/.test(info.csp) && /script-src 'sha256-/.test(info.csp) && !/unsafe-eval/.test(info.csp), `unexpected CSP: ${info.csp}`);
  return `${files.length} files; web app ${info.webSha256.slice(0, 12)}; version ${info.version}; ${info.scriptHashes.length} script hashes`;
});

await check('D3. Electron fuses in the binary are as configured (no run-as-Node, no NODE_OPTIONS, no --inspect, app only from asar)', async () => {
  const got = await readFuses(BIN);
  const bad = Object.entries(EXPECTED).filter(([k, v]) => got[k] !== v).map(([k, v]) => `${k}: expected ${v}, got ${got[k]}`);
  ok(!bad.length, bad.join('; '));
  // Behaviour, not only the wire: with RunAsNode off, ELECTRON_RUN_AS_NODE must not turn the binary into Node.
  let out = '';
  try {
    out = execFileSync(BIN, ['-e', 'console.log("NODE-MODE")'], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DISPLAY: '' }, timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (e) { out = String(e.stdout || ''); }
  ok(!/NODE-MODE/.test(out), 'ELECTRON_RUN_AS_NODE=1 still runs scripts as Node');
  return Object.entries(got).map(([k, v]) => `${k}=${v}`).join(', ');
});

// --- Launch -----------------------------------------------------------------------------------------------------------
const pw = loadPlaywright();
const HOME = join(TMP, 'home');
mkdirSync(HOME, { recursive: true });
const env = { ...process.env, HOME, XDG_CONFIG_HOME: join(HOME, '.config'), ELECTRON_ENABLE_LOGGING: '0' };
delete env.ELECTRON_RUN_AS_NODE;
const needsXvfb = !process.env.DISPLAY;
const rootFlags = process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : []; // Chromium refuses to run as root otherwise
const userData = join(HOME, '.config', APP_NAME); // Electron names the folder after productName

const launched = [];
const stopAll = () => { for (const c of launched) c.stopAll(); };
process.on('exit', stopAll);
function launch(extra = []) {
  const argv = [...rootFlags, '--disable-gpu', ...extra];
  const [cmd, cargs] = needsXvfb ? ['xvfb-run', ['-a', '-s', '-screen 0 1400x900x24', BIN, ...argv]] : [BIN, argv];
  // Own process group, so the whole tree (xvfb-run, Xvfb, Electron and its helpers) can be stopped together.
  const child = spawn(cmd, cargs, { env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  child.stopAll = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ } };
  launched.push(child);
  child.log = [];
  const take = (d) => { for (const l of d.toString().split('\n')) if (l.trim()) child.log.push(l); };
  child.stdout.on('data', take);
  child.stderr.on('data', take);
  child.exited = new Promise((r) => child.on('exit', (code, sig) => r({ code, sig })));
  return child;
}

const port = await freePort();
const app = launch([`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1']);
let browser = null;
let page = null;
const pageErrors = [];

await check('D4. The program starts and its window loads the bundled app from app://bundle/index.html', async () => {
  // Generous limits: on a busy 2-core machine the window can take well over 30 s to appear.
  // Wait until the window's page target exists, then attach: connecting before Electron creates the window leaves
  // Playwright without that page (it does not pick up Electron windows created after connectOverCDP).
  await until(async () => {
    try { return (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).some((t) => t.type === 'page' && t.url.startsWith('app://bundle/')); } catch { return false; }
  }, 120000, 'app window target');
  browser = await pw.chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  page = await until(async () => browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().startsWith('app://bundle/')), 120000, 'app window');
  page.on('pageerror', (e) => pageErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`); });
  await page.waitForSelector('#root *', { timeout: 120000 });
  return `${page.url()}; title "${await page.title()}"`;
});

await check('D5. A model run completes inside the desktop window, with no page errors', async () => {
  ok(page, 'no window');
  await page.waitForFunction(() => {
    const st = document.querySelector('.status');
    const t = st ? st.textContent : '';
    return /Run failed/.test(t) || (/Last run/.test(t) && !/Screening options/.test(t));
  }, null, { timeout: 240000, polling: 250 });
  const status = (await page.locator('.status').innerText()).replace(/\s+/g, ' ').trim();
  ok(!/Run failed/.test(status), `run failed: ${status}`);
  ok(!pageErrors.length, pageErrors.join(' | '));
  const rendererErrors = app.log.filter((l) => /\[renderer:error\]/.test(l));
  ok(!rendererErrors.length, rendererErrors.join(' | '));
  return status;
});

await check('D6. Offline, page level: the page made no request while loading and running; a request it tries is refused (the whole program is traced in D12)', async () => {
  ok(page, 'no window');
  const before = app.log.filter((l) => /^\[net\] blocked/.test(l));
  ok(!before.length, `the app tried the network: ${before.join(' | ')}`);
  const r = await page.evaluate(async () => { try { await fetch('https://example.com/'); return 'fetched'; } catch (e) { return `refused: ${e.name}`; } });
  ok(/^refused/.test(r), `fetch to https://example.com was not refused (${r})`);
  return `0 requests during load and run; test fetch ${r}`;
});

await check('D7. Content-Security-Policy applies: an injected inline script does not run and a violation is reported', async () => {
  ok(page, 'no window');
  const r = await page.evaluate(() => new Promise((res) => {
    let violation = null;
    document.addEventListener('securitypolicyviolation', (e) => { violation = e.violatedDirective; }, { once: true });
    window.__cspProbe = 'not run';
    const s = document.createElement('script');
    s.textContent = 'window.__cspProbe = "ran";';
    document.head.appendChild(s);
    setTimeout(() => res({ probe: window.__cspProbe, violation }), 300);
  }));
  ok(r.probe === 'not run', 'injected inline script ran');
  ok(r.violation && /script-src/.test(r.violation), `no script-src violation reported (${r.violation})`);
  return `inline script blocked; violated directive ${r.violation}`;
});

await check('D8. The page has no Node.js access (context isolation, sandbox): require, process and module are absent', async () => {
  ok(page, 'no window');
  const r = await page.evaluate(() => ({ require: typeof require, process: typeof process, module: typeof module, Buffer: typeof Buffer, isSecure: window.isSecureContext, origin: location.origin }));
  ok(r.require === 'undefined' && r.process === 'undefined' && r.module === 'undefined' && r.Buffer === 'undefined', JSON.stringify(r));
  ok(r.isSecure && r.origin === 'app://bundle', JSON.stringify(r));
  return JSON.stringify(r);
});

await check('D9. Navigation and new windows outside the app are blocked; the window stays on app://bundle', async () => {
  ok(page, 'no window');
  const opened = await page.evaluate(() => { const w = window.open('https://example.com/', '_blank'); return w === null ? 'null' : 'window'; });
  ok(opened === 'null', 'window.open returned a window');
  await page.evaluate(() => { location.href = 'https://example.com/'; });
  await new Promise((r) => setTimeout(r, 1500));
  ok(page.url().startsWith('app://bundle/'), `window navigated to ${page.url()}`);
  const pages = browser.contexts().flatMap((c) => c.pages()).filter((p) => !p.url().startsWith('devtools://'));
  ok(pages.length === 1, `${pages.length} windows open`);
  const logged = app.log.filter((l) => /^\[nav\] blocked/.test(l));
  ok(logged.length >= 2, `expected two blocked-navigation log lines, got ${logged.length}`);
  return logged.map((l) => l.replace(/ \(opened in the default browser\)/, '')).join('; ');
});

await check('D10. A second copy hands over to the running one and exits', async () => {
  const second = launch();
  const r = await Promise.race([second.exited, new Promise((res) => setTimeout(() => res({ code: 'timeout' }), 30000))]);
  if (r.code === 'timeout') second.stopAll();
  ok(r.code === 0, `second copy exit ${JSON.stringify(r)}`);
  await until(async () => app.log.some((l) => /a second copy was started/.test(l)), 10000, 'second-instance log in the first copy');
  return `second copy exited with code ${r.code}; first copy logged the hand-over`;
});

await check('D11. Closing the window quits the program cleanly and saves the window size', async () => {
  ok(page, 'no window');
  await page.close().catch(() => {});
  const r = await Promise.race([app.exited, new Promise((res) => setTimeout(() => res({ code: 'timeout' }), 30000))]);
  ok(r.code !== 'timeout', 'program still running 30 s after its window closed');
  const f = join(userData, 'window-state.json');
  ok(existsSync(f), `${f} not written`);
  const s = JSON.parse(readFileSync(f, 'utf8'));
  ok(s.width > 0 && s.height > 0, `window state ${JSON.stringify(s)}`);
  return `exit ${JSON.stringify(r)}; window-state ${JSON.stringify(s)}`;
});

await check('D12. No network from the whole program: under strace, start-up and the first model run make no DNS lookup and no connection off this computer, and proxy settings are ignored', async () => {
  // Separate launch with its own profile (the single-instance lock is per profile), traced by strace for every
  // process. A DNS lookup shows as a connect() to port 53; anything else off the computer as a connect() to a
  // non-loopback address. Proxy variables point at a local listener, so a request routed through a proxy is seen too.
  let strace = null;
  try { strace = execFileSync('sh', ['-c', 'command -v strace']).toString().trim(); } catch { /* none */ }
  ok(strace, 'strace is not installed: this check cannot run (install strace; it is not skipped silently)');
  const proxyHits = [];
  const proxy = createServer((sock) => { proxyHits.push(Date.now()); sock.destroy(); });
  await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
  const proxyUrl = `http://127.0.0.1:${proxy.address().port}`;
  const home2 = join(TMP, 'home-trace');
  mkdirSync(home2, { recursive: true });
  const traceFile = join(TMP, 'strace.txt');
  const env2 = { ...env, HOME: home2, XDG_CONFIG_HOME: join(home2, '.config'), HTTPS_PROXY: proxyUrl, HTTP_PROXY: proxyUrl, ALL_PROXY: proxyUrl, https_proxy: proxyUrl, http_proxy: proxyUrl, all_proxy: proxyUrl, NO_PROXY: '', no_proxy: '' };
  // --no-sandbox here only: tracing sandboxed helper processes is not reliable; this check is about the network.
  const argv = [strace, '-f', '-qq', '-yy', '--seccomp-bpf', '-e', 'trace=connect,sendto,sendmsg,sendmmsg', '-o', traceFile, BIN, '--no-sandbox', '--disable-gpu'];
  const [cmd, cargs] = needsXvfb ? ['xvfb-run', ['-a', '-s', '-screen 0 1400x900x24', ...argv]] : [argv[0], argv.slice(1)];
  const child = spawn(cmd, cargs, { env: env2, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  child.stopAll = () => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ } };
  launched.push(child);
  const out = [];
  child.stdout.on('data', (d) => out.push(d.toString()));
  child.stderr.on('data', (d) => out.push(d.toString()));
  // Start-up requests (such as Chromium's dictionary download) happen in the first seconds; 40 s also covers most of a run.
  await new Promise((r) => setTimeout(r, 40000));
  child.stopAll();
  await new Promise((r) => proxy.close(r));
  ok(existsSync(traceFile), `no strace output (${out.join('').slice(-300)})`);
  // -yy names each socket's protocol. Off-computer traffic is: any DNS (port 53), any TCP connect off loopback, or any
  // data sent to an address off loopback. A UDP connect() alone sends nothing: Chromium connects a UDP socket to
  // 2001:4860:4860::8888:443 at start-up only to learn whether IPv6 routing exists (seen on GitHub's runners).
  const all = readFileSync(traceFile, 'utf8').split('\n');
  const isLoop = (a) => /^127\./.test(a) || a === '::1' || /^::ffff:127\./.test(a);
  const off = [];
  const probes = [];
  let connects = 0;
  for (const l of all) {
    const proto = (/(?:connect|sendto|sendmsg|sendmmsg)\(\d+<(TCPv6|TCP|UDPv6|UDP)/.exec(l) || [])[1] || '';
    if (/\bconnect\(/.test(l) && /AF_INET6?/.test(l)) {
      connects++;
      const port = Number((/sin6?_port=htons\((\d+)\)/.exec(l) || [])[1]);
      const addr = (/inet_addr\("([^"]+)"\)/.exec(l) || /inet_pton\(AF_INET6, "([^"]+)"/.exec(l) || [])[1] || '?';
      if (port === 53) off.push(`DNS ${addr}:${port}`);
      else if (!isLoop(addr) && !proto.startsWith('UDP')) off.push(`${proto || 'connect'} ${addr}:${port}`);
      else if (!isLoop(addr)) probes.push(`${addr}:${port}`);
    } else if (/\b(?:sendto|sendmsg|sendmmsg)\(/.test(l) && proto) {
      const m = /->(\[[^\]]+\]|[0-9.]+):(\d+)\]>/.exec(l) || /(?:inet_addr\("([^"]+)"\)|inet_pton\(AF_INET6, "([^"]+)")/.exec(l);
      const addr = m ? (m[1] || m[2] || '').replace(/^\[|\]$/g, '') : '';
      if (addr && !isLoop(addr)) off.push(`data sent (${proto}) to ${addr}`);
    }
  }
  const started = readFileSync(traceFile, 'utf8').length > 0;
  ok(started, 'the traced program did not start');
  ok(!off.length, `connections off this computer or DNS lookups: ${[...new Set(off)].join(', ')}`);
  ok(!proxyHits.length, `${proxyHits.length} connection(s) to the proxy set in the environment`);
  return `${connects} inet connect() calls traced over 40 s: no DNS, no TCP off this computer, no data sent off it${probes.length ? `; ${new Set(probes).size} send-nothing UDP route probe(s) (${[...new Set(probes)].join(', ')})` : ''}; 0 connections to the proxy in HTTPS_PROXY/HTTP_PROXY/ALL_PROXY`;
});

if (browser) await browser.close().catch(() => {});
stopAll();

const log = app.log.slice(-40);
if (failures) annotate('Desktop program output (last lines)', app.log.filter((l) => !/dbus|Floss|vaapi/.test(l)).slice(-15).join('\n') || '(no output)');
if (!a.keep) rmSync(TMP, { recursive: true, force: true });
mkdirSync(join(PACKAGING_ROOT, 'test-results'), { recursive: true });
writeFileSync(join(PACKAGING_ROOT, 'test-results', 'desktop.json'), `${JSON.stringify({ date: new Date().toISOString(), archive: ARCHIVE.split('/').pop(), version: info && info.version, sandboxFlag: rootFlags.length ? '--no-sandbox (tests run as root)' : 'none', results, processLog: log }, null, 2)}\n`);
console.log(`\n${results.length - failures}/${results.length} desktop checks passed`);
process.exit(failures ? 1 : 0);
