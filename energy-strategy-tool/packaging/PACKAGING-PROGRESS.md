# Packaging slice progress (PWA + Electron desktop, 2026-10-18)

Read this first if resumed. Task: package the built web app (read-only input
`/home/claude/build/app/dist/energy-tool-single-file.html`) as (A) an installable PWA for GitHub Pages under
`https://slappy-69.github.io/DC-Learning/` (all paths relative) and (B) an Electron desktop program for Windows, macOS
(x64, arm64) and Linux. Never modify `/home/claude/build/app` or run its build; no git; no publishing.
Keep this folder under about 1.2 GB; build one desktop platform at a time and clear Electron caches.

## Status: in progress

| Part | State | Files | Tests |
|---|---|---|---|
| 0 Plan, environment check | done | this file | — |
| A1 Icons (SVG mark, PNG/ICO/ICNS) | done | icons/icon-art.mjs (parametric SVG), icons/build-icons.mjs, icons/generated/* (preview.png = contact sheet) | visual check of preview.png |
| A2 build-pwa.mjs, manifest, sw.js | done | pwa/build-pwa.mjs, pwa/sw.template.js, pwa/register-sw.js, pwa/update-notice.css, lib/common.mjs; output out/pwa/ | — |
| A3 test-pwa.mjs | done | pwa/test-pwa.mjs; test-results/pwa.json + pwa-update-notice-*.png | 12/12 pass (P1–P12) |
| B1 Electron app source (main.js etc.) | pending | | |
| B2 build-desktop.mjs (packager, fuses, archives) | pending | | |
| B3 test-desktop.mjs (Linux build under xvfb) | pending | | |
| B4 github/desktop.yml (electron-builder) | pending | | |
| C README.md, final sizes | pending | | |

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

## Next step

B1 Electron app source.
