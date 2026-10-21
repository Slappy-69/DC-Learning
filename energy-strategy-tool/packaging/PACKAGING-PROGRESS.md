# Packaging slice progress (PWA + Electron desktop, 2026-10-18)

Read this first if resumed. Task: package the built web app (input `../app/dist/energy-tool-single-file.html`,
built with `npm run build` in `app/`) as (A) an installable PWA for GitHub Pages under
`https://slappy-69.github.io/DC-Learning/` (all paths relative) and (B) an Electron desktop program for Windows, macOS
(x64, arm64) and Linux. Nothing is published from here.
Keep this folder under about 1.2 GB; build one desktop platform at a time and clear Electron caches.

## Status: closed (2026-10-21). Windows and phone only, at the owner's request. Haiku check done and answered; the Opus review stopped at the usage limit and did not report

| Part | State | Files | Tests |
|---|---|---|---|
| 0 Plan, environment check | done | this file | — |
| A1 Icons (SVG mark, PNG/ICO/ICNS) | done | icons/icon-art.mjs (parametric SVG), icons/build-icons.mjs, icons/generated/* (preview.png = contact sheet) | visual check of preview.png |
| A2 build-pwa.mjs, manifest, sw.js | done | pwa/build-pwa.mjs, pwa/sw.template.js, pwa/register-sw.js, pwa/update-notice.css, lib/common.mjs; output out/pwa/ | — |
| A3 test-pwa.mjs | done | pwa/test-pwa.mjs; test-results/pwa.json + pwa-update-notice-*.png | 12/12 pass (P1–P12) |
| B1 Electron app source (main.js etc.) | done | desktop/app/main.js, desktop/app/lib/{guards,menu,window-state}.js | through B3 |
| B2 build-desktop.mjs (packager, fuses, archives) | done | desktop/build-desktop.mjs, desktop/stage.mjs, desktop/fuses.mjs, desktop/desktop-config.json | Linux, Windows and both macOS targets built locally |
| B3 test-desktop.mjs (Linux build under xvfb) | done | desktop/test-desktop.mjs; test-results/desktop.json | 12/12 pass (D1–D12) |
| B4 GitHub workflows | done | ../../.github/workflows/desktop.yml (all four targets, Linux tested), ../../.github/workflows/ci.yml (tests, builds, PWA) | run on GitHub after the merge |
| C README.md, final sizes | done | README.md | — |

## Environment facts (checked 2026-10-18)

- Node 22.22.0, npm 10.9.4, running as root, 2 CPUs, ~7 GB RAM, ~30 GB free disk.
- Playwright 1.56.0 resolves with CommonJS `require('playwright')` (NODE_PATH); Chromium 1194 + headless shell in /opt/pw-browsers.
- Electron latest stable 44.9.0 (2026-10-17); @electron/packager 20.3.0 uses `resedit` (pure JS), so the Windows exe icon and
  version info can be embedded without wine/rcedit; @electron/fuses 2.1.3; electron-builder 26.x.
- Engine version in the bundle: `engineVersion:<ident>` -> `<ident>="0.2.0-site"` (read from the dist file, not the source).

## Judgement calls (running list; copied into README "Decisions")

1. Input is the single-file build only (energy-tool-single-file.html); the hosted variant is for a host's frame (copy instead of
   download) and is not packaged.
2. Icon: trade-off frontier with dominated options and the picked knee in amber on the app's accent blue (#1f5f8b / #ffb366).
   Simplified art at 16–32 px; maskable art scaled 0.8 (mark reaches 31 % of the width from the centre; safe zone 40 %).
3. short_name "Optioneering" (12 chars); manifest id "concept-energy-optioneering" (resolves against the origin, so it stays the
   same whatever path the site is deployed under; Chrome reports the computed id http(s)://<origin>/concept-energy-optioneering).
4. Colours: background_color #f6f5f1 (app --bg); theme_color #ffffff, theme-color metas #ffffff light / #1e2125 dark (the app's
   top bar --surface in each theme, so the installed window's title bar blends with the top bar).
5. SW version = SHA-256 (16 hex) over index.html first, then the manifest and icons (any shell change gives a new cache).
6. The SW only handles this app's URLs (scope path and scope/index.html for navigations; the shell files otherwise) and only
   deletes caches named ceo-shell:<scope path>:*, because https://slappy-69.github.io is shared by every Pages site of the
   account and DC-Learning may host other pages. No .nojekyll (it would change how the rest of the repo's site is built).
7. "Network update" = the browser's sw.js check on each load, plus reg.update() when the app becomes visible (>= 60 s since the
   last check) and hourly; the shell itself is cache-first with no background re-fetch, so one version is never mixed with another.
8. Update notice: role=status / aria-live=polite text, Reload and Later buttons, focus never moved, app colour tokens; Reload
   sends SKIP_WAITING and reloads on controllerchange (3 s fallback). Later hides it; it returns on the next load.
9. Registration is skipped unless the page is http(s) in a secure context with serviceWorker support; failures are swallowed so
   the app's own start-up error box never shows for them.

10. **CI builds with the tested script, not electron-builder.** The plan named electron-builder for the GitHub workflow.
    The workflow runs `desktop/build-desktop.mjs` instead, the script built and tested here, so what GitHub produces is
    what was tested. Trade-off: no installers (NSIS, DMG, AppImage), only archives to unzip and run. electron-builder
    can be added later if installers are wanted.
11. **Electron download in a child process with 3 attempts.** Through this sandbox's HTTPS proxy, undici (inside
    @electron/get) twice threw an uncaught assertion when the connection dropped mid-download, which killed the build.
    The download now runs first in a child process, retried up to 3 times; @electron/packager then reads the cached zip.
12. **Desktop test attaches over Chromium's remote-debugging port**, because Playwright's Electron launcher needs Node's
    `--inspect`, which the EnableNodeCliInspectArguments fuse disables on purpose. The test waits for the window's page
    target before attaching (attaching earlier leaves Playwright without the window) and starts the program in its own
    process group so every helper process is stopped at the end.
13. **Tests run as root pass `--no-sandbox`** (Chromium refuses to start as root otherwise). The window still has
    `sandbox: true` and context isolation, and D8 confirms the page has no Node.js; only the OS-level sandbox is off in
    the test, not in normal use.

14. **macOS signature check by page hashes** (`desktop/macho-verify.mjs`), because `rcodesign verify` 0.29 rejects every
    ad hoc signature ("CMS error: missing further values"). Tested: 14 of 14 binaries pass in each macOS build; 6 of 6
    copies with one byte flipped fail (one page each).

## Haiku check H1-packaging: findings and responses (2026-10-18)

Report: `../verification/packaging/H1-packaging.md` (commit f797cca).

| Finding | Response |
|---|---|
| P9 passed without running: axe path hard-coded to another machine's folder | **Fixed.** axe is resolved from `../app/node_modules/axe-core` (or packaging's own), and a missing axe now fails P9. P9 now runs: 0 violations light and dark, fits at 375 px. The earlier "12/12" in this file did not include a real P9. |
| "No network connections" contradicted: DNS and TCP to `redirector.gvt1.com` at start-up | **Fixed.** Traced here too: Electron's spell-check dictionary download, started before the session's spell checker is switched off, and routed through any proxy in the environment. `main.js` now sets `host-resolver-rules=MAP * ~NOTFOUND` and `no-proxy-server`. New test **D12** traces every process with strace for 40 s (start-up and a run): no connect() to port 53 or off loopback, and no connection to a proxy listener set in HTTPS_PROXY/HTTP_PROXY/ALL_PROXY. Negative control: the build before the fix fails D12 (it reached the proxy). strace missing is a failure, not a skip. |
| D6 cannot see browser-process traffic | Accepted; D6 is renamed "page level" and D12 covers the whole program. |
| `data:` downloads not bound to the app | **Fixed.** A `data:` download is accepted only when the requesting page is an app page. |
| Save dialog, window position restore, webRequest layer untested | Accepted as gaps; listed in the README under "Not covered by a test". The webRequest layer is now a second line behind the resolver block. |
| `--remote-debugging-port` still works | Accepted; the README now says so (anyone who can start programs as you can already do more). |
| Checker crashes on a malformed signature | **Fixed.** Errors become a FAIL line ("malformed Mach-O or signature"); the CLI continues. |
| Six-copy tamper claim has no script | **Fixed.** Every macOS build now runs a self-check: copies of the main executable with a changed header byte, a changed code byte and a corrupted blob count must all fail, or the build stops. darwin-arm64: 3 of 3 rejected. |
| Special slots and identifier not checked | Accepted; stated in the checker header and README decision 14. |
| `desktop.yml` uploads the Linux `desktop.json` for every target; no `SHA256SUMS.txt` | **Fixed.** Checksums uploaded with each target; the test results uploaded once, from the Linux job, as `desktop-test-results`. |
| Root README trigger text incomplete | **Fixed.** |
| Test runs rewrite the committed result files | Kept by design (the files are the record of the last verified run); the README says to commit them with a verified change. |
| Workflows not run on GitHub | Since run: Desktop builds green (all four targets, Linux test with the sandbox on, non-root runner); CI green on 90e4677 (Node 44/44, PWA, browser 29/29). |
| npm audit: 1 moderate (app) | esbuild ≤ 0.24.2, GHSA-67mh-4wv8-2f99: affects only esbuild's development server (`serve`), which `build.mjs` never starts. Not exploitable here; the fix is a breaking upgrade to 0.28 that could change the bundle. Left at 0.23.1 and recorded. Packaging: 0 vulnerabilities. |
| win32-x64, darwin-x64 sizes not verified by the check | Built locally (151.6 MB, 130.2 MB) and on GitHub (artifact sizes 151.4 MB and 129.8 MB, which are the artifact zips). |

## Local build sizes (2026-10-18, Electron 44.9.0, engine 0.2.0-site)

| Target | Archive | Unpacked | Signing |
|---|---|---|---|
| linux-x64 | 117.9 MB .tar.gz | 285 MB | none (not needed) |
| win32-x64 | 151.6 MB .zip | 370 MB | none; exe has no certificate table |
| darwin-x64 | 130.2 MB .zip | 314 MB | ad hoc, 14 Mach-O files checked |
| darwin-arm64 | 124.8 MB .zip | 311 MB | ad hoc, 14 Mach-O files checked |

## Close-out (2026-10-21)

- **Owner: Windows and phone only; stop development and tidy up.** `desktop.yml` builds Windows for download and Linux
  only to launch-test; macOS and Linux downloads dropped. Phone = the private Claude artifact (hosted build), not the PWA.
- **D12 false alarm on GitHub (ea22f75):** the runner showed a UDP connect to 2001:4860:4860::8888:443, Chromium's
  start-up check for IPv6 routing, which sends no data. D12 now traces connect and send calls with socket protocols
  (`strace -yy`) and fails on DNS, on TCP off loopback, or on data sent off loopback; a send-nothing UDP connect is
  reported, not failed. Local: 12/12.
- **Opus review of the packaging:** started, stopped at the weekly usage limit (resets 2026-10-23 15:00 La Paz time)
  without a report. Not resumed: the owner asked to stop development. Recorded as not done.
- Merged to `main` with the owner's approval of 2026-10-18.
