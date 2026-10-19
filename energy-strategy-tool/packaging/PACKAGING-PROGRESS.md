# Packaging slice progress (PWA + Electron desktop, 2026-10-18)

Read this first if resumed. Task: package the built web app (input `../app/dist/energy-tool-single-file.html`,
built with `npm run build` in `app/`) as (A) an installable PWA for GitHub Pages under
`https://slappy-69.github.io/DC-Learning/` (all paths relative) and (B) an Electron desktop program for Windows, macOS
(x64, arm64) and Linux. Nothing is published from here.
Keep this folder under about 1.2 GB; build one desktop platform at a time and clear Electron caches.

## Status: done (2026-10-18), pending the packaging Haiku check and Opus review

| Part | State | Files | Tests |
|---|---|---|---|
| 0 Plan, environment check | done | this file | — |
| A1 Icons (SVG mark, PNG/ICO/ICNS) | done | icons/icon-art.mjs (parametric SVG), icons/build-icons.mjs, icons/generated/* (preview.png = contact sheet) | visual check of preview.png |
| A2 build-pwa.mjs, manifest, sw.js | done | pwa/build-pwa.mjs, pwa/sw.template.js, pwa/register-sw.js, pwa/update-notice.css, lib/common.mjs; output out/pwa/ | — |
| A3 test-pwa.mjs | done | pwa/test-pwa.mjs; test-results/pwa.json + pwa-update-notice-*.png | 12/12 pass (P1–P12) |
| B1 Electron app source (main.js etc.) | done | desktop/app/main.js, desktop/app/lib/{guards,menu,window-state}.js | through B3 |
| B2 build-desktop.mjs (packager, fuses, archives) | done | desktop/build-desktop.mjs, desktop/stage.mjs, desktop/fuses.mjs, desktop/desktop-config.json | Linux, Windows and both macOS targets built locally |
| B3 test-desktop.mjs (Linux build under xvfb) | done | desktop/test-desktop.mjs; test-results/desktop.json | 11/11 pass (D1–D11), two runs |
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

## Local build sizes (2026-10-18, Electron 44.9.0, engine 0.2.0-site)

| Target | Archive | Unpacked | Signing |
|---|---|---|---|
| linux-x64 | 117.9 MB .tar.gz | 285 MB | none (not needed) |
| win32-x64 | 151.6 MB .zip | 370 MB | none; exe has no certificate table |
| darwin-x64 | 130.2 MB .zip | 314 MB | ad hoc, 14 Mach-O files checked |
| darwin-arm64 | 124.8 MB .zip | 311 MB | ad hoc, 14 Mach-O files checked |

## Next step

Haiku check and Opus review of the packaging, then merge to `main` (owner approved 2026-10-18).
