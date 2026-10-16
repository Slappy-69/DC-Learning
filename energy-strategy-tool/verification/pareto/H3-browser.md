# H3 browser verification: Trade-offs view

**Overall: FAIL.** Two checks fail: the chart is not reached by Tab within 80 presses (H3-6a), and axe reports one serious color-contrast violation in both Trade-offs modes (H3-7a, H3-7b). Everything else passes at both viewports.

## Scope and method

- File under test: `/home/claude/build/app/dist/energy-tool-single-file.html` (459,832 bytes, built Oct 15 2026 17:27), opened by `file://`.
- Tooling: Chromium 141 (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) through Playwright 1.56.0, headless, `--no-sandbox` because the session runs as root. axe-core 4.10.2 installed in the scratch folder only, run with tags `wcag2a, wcag2aa, wcag21aa, wcag22aa` on the whole document in the Trade-offs state.
- Viewports: phone 375x812 (`isMobile`), desktop 1400x900. Keyboard and axe checks ran on desktop only.
- No source, test or document file was changed. `npm run build` was not run.
- Each page load reached "Run complete" (phone 12.0 s, desktop 12.6 s, keyboard context 11.6 s, axe context 13.5 s; status line "Last run 12 s on 1 worker").

## Results

| ID | Check | Viewport | Status | Evidence |
|---|---|---|---|---|
| H3-1 | Load; run finishes; console and page errors | 375x812 | PASS | "Run complete" present. Console errors 0, warnings 0, page errors 0, failed requests 0. |
| H3-1 | Load; run finishes; console and page errors | 1400x900 | PASS | Same: 0 console errors, 0 warnings, 0 page errors, 0 failed requests. |
| H3-2 | Open Trade-offs tab (role tab, name "Trade-offs") | 375x812 | PASS | `aria-selected="true"`; `section.pareto` rendered. Screenshots saved. |
| H3-2 | Open Trade-offs tab (role tab, name "Trade-offs") | 1400x900 | PASS | Same. |
| H3-3 | Horizontal overflow: scrollWidth <= clientWidth (chart and table modes) | 375x812 | PASS | Chart 375/375. Table 375/375. The 1242 px table scrolls inside its own `overflow-x:auto` wrapper, not the page. |
| H3-3 | Horizontal overflow: scrollWidth <= clientWidth (chart and table modes) | 1400x900 | PASS | Chart 1400/1400. Table 1400/1400. The 1302 px table scrolls inside a 940 px wrapper. |
| H3-4 | Chart rendered; text of weighted-pick line | 375x812 | PASS | Canvas `pc-canvas` draws the points (2,000 plotted, above the 500-point canvas threshold), plus an SVG overlay of 325x309 with the frontier path and focus layer. Pick line: "Weighted pick #1 Grid · Diesel N+1 · DLC · PV 7.8 MWp · PPA hybrid 100 %, score 86.0; LCOE 134 €/MWh; Carbon, location-based 113 gCO2e/kWh. Updates with the weights; no re-run." |
| H3-4 | Chart rendered; text of weighted-pick line | 1400x900 | PASS | Same canvas plus SVG overlay (942x460). Same pick line. |
| H3-5 | Table alternative: body rows | 375x812 | PASS | 50 body rows on page 1 (page size 50). Caption "2000 rows"; pager "Page 1 of 40". |
| H3-5 | Table alternative: body rows | 1400x900 | PASS | 50 body rows on page 1. Same caption and pager. |
| H3-6a | Keyboard: Tab from top reaches the chart within 80 presses | 1400x900 | FAIL | Not reached. The first 80 stops are the skip link, two top-bar buttons and inputs-panel controls; stop 80 is a focusable `span.tag.tag-unverified`. Supplementary, beyond the limit: Tab-only reaches the chart at press 261 (Options tab at press 255, ArrowRight selects Trade-offs, then 6 presses). Via "Skip to results": Enter on the link, then 30 Tab presses. |
| H3-6b | Keyboard: ArrowRight, ArrowRight, P, Enter on the chart; visible focus; Enter opens detail | 1400x900 | PASS (focus placed by script) | Every key kept focus on `svg[role=application]` with a solid 3 px outline (`:focus-visible` matched) and a focus ring. Enter opened the option detail. Focus was placed by script because H3-6a failed. See the table below. |
| H3-7a | axe (wcag2a, wcag2aa, wcag21aa, wcag22aa), Trade-offs chart mode | 1400x900 | FAIL | Violations by impact: critical 0, serious 1, moderate 0, minor 0. 33 rules passed. Serious: `color-contrast` (see below). |
| H3-7b | axe (same tags), Trade-offs table mode | 1400x900 | FAIL | Violations by impact: critical 0, serious 1, moderate 0, minor 0. 32 rules passed. Same serious `color-contrast` violation. |

## Keyboard detail (desktop 1400x900)

Focus was placed on the chart by script in this run, because Tab did not reach it within 80 presses. A script `focus()` call alone shows no outline (the `:focus-visible` rule), which is expected.

| Key | Focused element | Visible focus (computed) | Focus ring (`.pc-focus`) | Option named by live region | Option detail |
|---|---|---|---|---|---|
| (script focus) | `svg` role=application, aria-label "Trade-off chart: LCOE against Carbon, location-based, 2000 options. Arrow keys move between options, P jumps to the weighted pick, Enter opens the option detail…" | none (programmatic focus) | n/a | n/a | closed |
| ArrowRight | same svg | solid 3px outline, `:focus-visible` true, box-shadow none | yes | Rank 752: Islanded rented temporary generation · Gas CHP-trigen · retained-plant backup · DLC · PV 2.5 MWp | closed |
| ArrowRight | same svg | solid 3px outline, `:focus-visible` true | yes | Rank 702: Islanded gas recips · Fuel cells · Diesel N+1 · DLC · PV 2.5 MWp | closed |
| P | same svg | solid 3px outline, `:focus-visible` true | yes | Rank 1, weighted pick: Grid · Diesel N+1 · DLC · PV 7.8 MWp · PPA hybrid 100 % | closed |
| Enter | same svg | solid 3px outline, `:focus-visible` true | yes | Rank 1, weighted pick | opened: "#1 · Grid · Diesel N+1 · DLC · PV 7.8 MWp · PPA hybrid 100 %" |

Result: the chart's arrow, P and Enter handling works as designed. Enter did open the option detail.

## Axe violations

Counts by impact, Trade-offs chart mode: critical 0, serious 1, moderate 0, minor 0. Table mode: the same. No moderate or minor violations in either mode.

Serious (both modes, 27 nodes each):

1. **color-contrast**, impact serious. Help: "Elements must meet minimum color contrast ratio thresholds." Help URL: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=axeAPI
   - First two target selectors: `.rp-ev-progress.rp-ev:nth-child(190) > .rp-t` and `.rp-ev-progress.rp-ev:nth-child(190) > .rp-src`.
   - Axe message: contrast 4.25 (foreground #6b7079 on background #efede7, 12 px, normal weight), expected 4.5:1.
   - Location: the run-progress event log (`details.run-progress`), which is open by default and sits on the results page above the tabs.

Critical: none.

Incomplete, needs review (not counted as violations):

- **aria-prohibited-attr** (axe impact serious, needs review): 55 nodes in chart mode, 54 in table mode. First targets: `label[for=":r3:"] > .field-tags > .tag-unverified.tag` and `label[for=":r4:"] > .field-tags > .tag-unverified.tag`. Message: aria-label on a span with no valid role. These are the "unverified" tag spans, which also take Tab focus (see observations).
- **color-contrast** (needs review, background partly obscured): 767 nodes in chart mode, 750 in table mode, all in the run-progress log. This second page load reported different nodes from the 27 above (first targets `...:nth-child(1)`). The rule and colours are unchanged; the event log is generated during the run, so node counts differ between loads.

## Screenshots

- `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/tradeoffs-chart-phone-375x812.png` (full page, Trade-offs chart, 375 wide)
- `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/tradeoffs-chart-phone-375x812-section.png` (Trade-offs section only, 375 wide; layout check)
- `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/tradeoffs-table-phone-375x812.png` (full page, table mode, 375 wide)
- `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/tradeoffs-chart-desktop-1400x900.png` (full page, chart, 1400 wide)
- `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/tradeoffs-table-desktop-1400x900.png` (full page, table mode, 1400 wide)
- `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/kbd-after-P-1400x900.png` (viewport after P: focus outline and weighted-pick ring visible)
- `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/kbd-after-Enter-1400x900.png` (viewport after Enter: option detail open)

## Observations (not pass/fail)

- Tab order: 228 of the 261 Tab stops before the chart are inside the inputs panel. 54 of those stops are `span.tag.tag-unverified` elements, which have `tabindex="0"`, an `aria-label`, no role and no action. The DOM has 65 spans with `tabindex="0"`. These stops add focus without function and are the cause of the `aria-prohibited-attr` incomplete item.
- The "Skip to results" link works: Enter moves focus to `main#results`. From there the chart is 30 Tab presses away.
- The chart is drawn on canvas (2,000 options, above the 500-point threshold), so the points have no DOM nodes. Screen reader users get the option text from the live region on focus and from the table.
- The wide table scrolls inside `.table-wrap` (`overflow-x:auto`, `tabindex="0"`, `role="region"`, named "Trade-off data table"). It is keyboard-reachable, but on a phone it needs about 1242 px of horizontal scrolling inside a 323 px box.

## Files

- Check script: `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/verify-h3.js`
- Supplementary measurements: `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/supp-h3.js`
- Phone section screenshot script: `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/shot-phone-section.js`
- Raw results: `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/h3-results.json` and `/tmp/claude-0/-home-claude/a66cf92d-3564-56e6-89ee-bb0870057f0d/scratchpad/h3/h3-supp.json`
