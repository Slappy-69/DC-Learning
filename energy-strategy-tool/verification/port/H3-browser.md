# Port slice: Haiku check 3 (browser, hosted page, phone)

Verifier: Claude Haiku 5.5, 2026-10-18. Branch feature/port-concept-line (cbc785f).
Recorded from the verifier's final report. The verifier did not write this file itself; the orchestrator saved it.

## Result

PASS, with two unrecorded items (see Notes). No serious or critical accessibility violations.

## 1. Browser suite

`npm run test:browser` (TMPDIR set to the scratch folder): 29/29 PASS, exit 0, no SKIP. B1–B29 all passed, including the port checks B22–B29. No re-run needed.

## 2. Verifier's own checks (Chromium 141)

| Config | Run time | Overflow Dispatch / Sensitivity (scrollWidth / clientWidth) | Charts | Readouts | Presets | Week table | Sensitivity | Console / page errors |
|---|---|---|---|---|---|---|---|---|
| phone light 375×812, touch | 22.1 s | 375/375, 375/375 | timeline and hourly SVG with shapes; tornado 7 bars | month 0→1→2; hour changed | week 24→51 (Peak demand), 51→2 (Least renewables); chart week matched | 168 rows | leader shown; 7 drivers; largest swing 21.7 | none |
| phone dark | 19.2 s | 375/375, 375/375 | same | same | same | 168 rows | 7 drivers; 21.7 | none |
| desktop light 1400×900 | 26.6 s | 1400/1400, 1400/1400 | same | same | same | 168 rows | 7 drivers; 21.7 | none |
| desktop dark | 18.4 s | 1400/1400, 1400/1400 | same | same | same | 168 rows | 7 drivers; 21.7 | none |

Other details: the Timeline table has 120 rows. Leader: "#1 Grid · Diesel N+1 · DLC · PV 7.7 MWp · PPA hybrid 100 %". Base re-run matches the ranking (92.71). The 15 re-runs took 0.8–1.7 s. Largest swing: IT load (all phases), 21.7 points. Background rgb(246,245,241) light, rgb(21,23,26) dark. No non-file requests in any config.

## 3. Accessibility (axe, desktop light and dark; WCAG 2.0/2.1/2.2 A and AA tags)

- Dispatch: 0 violations, 33 rules passed, 1 needs-review item (id not recorded).
- Sensitivity: 0 violations, 33 rules passed, 1 needs-review item (id not recorded).
- No serious or critical violations in either theme.

## 4. Hosted page

- Wrapper used: `host-wrapper.html` (scratch folder). `dist/energy-tool-hosted.html` contains no doctype, html, head or body tags, in the raw file or outside script blocks.
- Loaded inside the wrapper: ran to completion in 34.6 s, 5 result tabs, no errors. No non-file requests (2 requests, both file:).
- JSON copy: "Copied JSON to the clipboard". CSV copy: "Copied CSV to the clipboard". No downloads.

## 5. Scripts off

Single-file build with JavaScript disabled: the loading message and the "needs JavaScript" note are shown. No requests made.

## 6. External requests and console

No external requests in any check. The only URL-like strings in the builds are namespace identifiers (w3.org, opengis) and a React error-decoder URL string, none of which is fetched. No console errors.

## Notes

- The needs-review items from axe were not identified. Identify them before the Opus review.
- The verifier did not run `npm run build`. Its results come from the browser suite and from the hosted and single-file outputs already present.
- Screenshots (scratch folder, not committed): dispatch and sensitivity at phone and desktop, light and dark; scripts-off desktop.
