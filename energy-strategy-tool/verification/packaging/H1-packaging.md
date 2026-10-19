# H1-packaging check (2026-10-18)

Verifier: Haiku, independent of the builder, on a worktree at commit f797cca. Saved here by the orchestrator. The
builder's responses are in `packaging/PACKAGING-PROGRESS.md`, "Haiku check H1-packaging: findings and responses".

## Summary

| # | Check | Verdict | Key point |
|---|---|---|---|
| 1 | PWA build and tests (claim 12/12) | PARTLY | Build and 12 PASS confirmed. P9 (axe and 375 px) passes without running. |
| 2 | Linux desktop build and tests (claim 11/11) | VERIFIED | Archive 123,637,246 bytes (117.9 MiB). SHA-256 `2d67e48f5c3b372d08d6f0ce37e9632fadd47d6e0f824faf8dc98059fe235521`. 11/11 PASS. |
| 3 | README security claims against code | PARTLY | Hardening settings, CSP and fuses confirmed. "No network connections" is contradicted by startup DNS and TCP attempts. Several guards are untested. |
| 4 | macOS Mach-O checker and darwin-arm64 build | VERIFIED, with limits | 14/14 files pass. Two in-range byte flips fail. A malformed signature crashes the checker. |
| 5 | Workflows `ci.yml` and `desktop.yml` | VERIFIED, with notes | YAML parses, triggers match headers, nothing publishes. Upload and CI issues found. Not run on GitHub. |
| 6 | READMEs: commands, paths, sizes | PARTLY | Commands run as written. Linux and darwin-arm64 sizes match. win32 and darwin-x64 not built. Root README trigger text incomplete. |
| 7 | `.gitignore` and `git status` | FAIL as stated | Ignore rules work. Status is not clean after the required test runs, because two tracked files are rewritten. |

No fixes were made. No files were changed except this report and scratch files. No ref-changing git command was run.

## Check 1: PWA build and tests

- `npm ci`, `npm run pwa` and `npm run test:pwa` all exited 0.
- `test:pwa` reports 12 PASS. It writes the tracked file `energy-strategy-tool/packaging/test-results/pwa.json`.
- P9 (axe and phone width) passes without running. `pwa/test-pwa.mjs` hard-codes the axe path `/home/claude/build/app/node_modules/axe-core/axe.min.js` at line 248. That path does not exist on this machine. Line 249 returns the message "axe-core not found: skipped the axe part". The axe checks in light and dark, and the 375 px check (lines 250 to 266), never run. The test still records a pass.
- CI runs the same script (`ci.yml` line 55), so CI skips these checks too.
- Not fixed, as instructed. Suggested direction: resolve axe from `../app/node_modules/axe-core/axe.min.js` relative to the packaging root, and fail when it is missing.

## Check 2: Linux desktop build and tests

- `node desktop/build-desktop.mjs --platforms linux-x64` succeeded. The build took 31 s.
- Archive `Concept-Energy-Optioneering-0.2.0-site-linux-x64.tar.gz` in `packaging/out/desktop/`:
  - Size: 123,637,246 bytes, which is 117.9 MiB.
  - SHA-256: `2d67e48f5c3b372d08d6f0ce37e9632fadd47d6e0f824faf8dc98059fe235521`. Re-hashed; it matches `build-desktop.json`.
  - Unpacked size: 285 MB in `build-desktop.json`, which matches the README.
- The nine fuses in `build-desktop.json` match `desktop/fuses.mjs` lines 7 to 20 and the README. The build uses `strictlyRequireAllFuses: true`.
- `npm run test:desktop`: 11/11 PASS. It writes the tracked file `packaging/test-results/desktop.json`.
- The session runs as root. `test-desktop.mjs` line 106 adds `--no-sandbox` for root, so this 11/11 run did not test the sandbox on. Checked separately as the non-root `claude` account: the page appeared in about 2 s.

## Check 3: Security claims in the README against the code

Confirmed:
- `desktop/app/main.js` lines 63 to 67: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Test D8 checks these at run time.
- `desktop/app/main.js` lines 104 to 114: single-instance lock. Test D10 checks it.
- `desktop/app/lib/guards.js` line 54: a CSP header, taken from `INFO.csp`, is set on every response.
- CSP hashes: the SHA-256 of both inline scripts in `out/.stage/app/web/index.html` (1,150 and 769,649 bytes) match `build-info.json`. The page has no `on*=` attributes, no `eval(` and no `new Function(`.
- `desktop/stage.mjs` `cspFor` (lines 16 to 40) sets `default-src 'none'`, `script-src` by hash only, `style-src 'self' 'unsafe-inline'`, and `connect-src 'self' blob: data:`.
- `desktop/fuses.mjs` sets nine fuses; the names match the library enum. `OnlyLoadAppFromAsar` is true.

Contradicted:
- `main.js` line 4 (file header) and line 30 (About text) say the app makes "no network connections, sends no telemetry and does not update itself"; README lines 46 to 47 repeat this. A strace of the packaged app at launch showed DNS lookups and TCP connection attempts to `redirector.gvt1.com`. The process was not identified.

Not verified:
- `guards.js` lines 79 to 82 cancel http, https, ws, wss and ftp requests through `webRequest.onBeforeRequest`. No test exercises this; under the CSP no page request reaches it.
- `test-desktop.mjs` D6 checks only that no "[net] blocked" lines appear and that a page fetch is refused. It cannot see traffic from the browser process, so its "0 requests" result does not prove the README claim.
- Downloads: `guards.js` line 128 accepts downloads from `blob:app://bundle/` or from any `data:` URL; the `data:` case is not bound to the origin. The save dialog is not tested.
- Window position restore is not tested; D11 checks only size and file.
- "No --inspect" holds only for Node's inspector; `--remote-debugging-port` still works on the packaged binary.

## Check 4: macOS Mach-O checker and darwin-arm64 build

- `desktop/macho-verify.mjs` constants and parsing match the format (LC_CODE_SIGNATURE 0x1d, SuperBlob 0xfade0cc0, CodeDirectory 0xfade0c02, CS_ADHOC 0x2, codeLimit 32-bit at 32 and 64-bit at 56 from version 0x20300, page size 2^n at 39, SHA-256 page hashes over [0, codeLimit)).
- `darwin-arm64` build with `--keep-unpacked` succeeded: 14 Mach-O files (4 file symlinks skipped), all pass. Zip 130,836,150 bytes (124.8 MiB), SHA-256 `ba3fb47effabdc413a85f0626c07c064231bbcab066c8eb8ef91cb3ce9abe9a7`, `zip -T` clean, 603 entries, 14 symlinks kept; after extraction 14/14 pass.

Flip tests on the main binary (39,696 bytes; signature at 33,552, size 6,144; 9 code slots of 4096 bytes):

| Change | Result |
|---|---|
| None | OK, exit 0 |
| Byte 20000 | FAIL, 1 of 9 page hashes, exit 1 |
| Byte 33551 (last signed byte) | FAIL, 1 of 9, exit 1 |
| Byte 33679 (CodeDirectory identifier, outside page hashes) | OK; not covered |
| Byte 33560 (SuperBlob count) | Uncaught RangeError at `macho-verify.mjs:59`, exit 1, no FAIL line |

Limits: special slots and CodeDirectory metadata outside the page hashes are not checked; malformed input crashes the checker; an ad hoc signature proves only that the file matches its own signature; the "six copies" claim in decision 14 has no script in the repository (two in-range flips and one malformed case were run here).

## Check 5: Workflows

- Both workflow files parse as YAML; triggers match their headers; permissions `contents: read`; no publish, release or deploy step.
- `ci.yml` runs `test:pwa`, so P9 also passes without running in CI.
- `desktop.yml` uploads the committed Linux `desktop.json` for all four targets, and does not upload `SHA256SUMS.txt`.
- The desktop push trigger is path-filtered: a change under `app/` alone does not start a desktop build.
- Neither workflow was run on GitHub by this check.

## Check 6: READMEs

- All commands run as written, exit 0: app `npm ci`, `npm run build`, `npm test` (44/44, 261 s), `npm run test:browser` (29/29, 976 s); packaging `npm ci`, `npm run pwa`, `npm run test:pwa` (12/12), Linux build, `npm run test:desktop` (11/11). The single-file build SHA-256 `c5226f2e...` equals the committed file. `npm run icons` reproduces all 13 committed icon files byte for byte.
- Paths named in the READMEs exist. linux-x64 and darwin-arm64 sizes match; win32-x64 and darwin-x64 not built here. "MB" means MiB.
- Root README describes `ci.yml` as "on every push to `main`" and `desktop.yml` as "run by hand or on a `v*` tag": both incomplete.

## Check 7: `.gitignore` and `git status`

- Ignore rules work for `node_modules/`, `dist/` (app) and `node_modules/`, `out/` (packaging).
- After the test runs, `git status --short` shows two modified tracked files: `packaging/test-results/desktop.json` and `packaging/test-results/pwa.json` (rewritten by every test run).

## Other findings

- The app's `npm ci` reports 1 moderate npm audit vulnerability (not investigated).

## Not checked

- win32-x64 and darwin-x64 builds; macOS launch and Gatekeeper; Windows SmartScreen; the workflows on GitHub; the sandbox-on Linux test on GitHub's runner; webRequest block, downloads, save dialog, window position restore; the process behind the `redirector.gvt1.com` traffic; the npm audit finding.
