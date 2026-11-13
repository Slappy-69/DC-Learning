# Visual rework proposal: Concept energy optioneering

Date: 2026-11-13. Proposal only. Nothing in the app, the repository or the published page was changed.

> **Repository copy (2026-11-13).** Copied from the review session into `docs/visual-rework/`, with its picture paths changed to point here. Some large pictures were saved with fewer colours to keep the repository small; the text in them is unchanged. Since it was written: the owner put it on the to-do list ("Use opus to create this onto the to do list", 20:12 local) and took all of its suggestions ("Use all the fable suggestions", 20:15 local). The four decisions it asks for are answered in `../../brief-v2/OPEN-QUESTIONS.md` 272 to 275 (phasing chart alternative A; "Late" amber inside the allowed window; the map beside the verdict panel; gas orange). The items are work packages 37 to 40 in `../BUILD-PLAN.md`, not built. The four defects at the end are known issues 45 to 48 in `../KNOWN-ISSUES.md`. File names in the items are relative to `app/src/` (`report/` is `app/src/report/`) and `tests/` to `app/`; the build plan corrects the file lists where the code differs (for example, the map is drawn inside `components/InputsPanel.jsx`, and `components/RankedList.jsx` draws the plan check).

## Summary

The tool works out a great deal and shows nearly all of it at once, at the same size and weight. The engineer has to scroll about 6,200 px before the first result tab, the options table shows five rows a screen and runs off the right edge, and the option detail is 4,000 px tall. Red is used for gas plant, for 380 kV lines and for "late", so it no longer means "problem". The screens and the PDF draw the same things in different colours. This proposal keeps the seven accepted points (1, 2, 3, 5, 6, 7, 8) and adds a small set of shared parts (colours, status marks, type sizes, cards, tables, buttons) used on every screen and in the PDF. It redraws the phasing chart in two alternatives, both built to be read at a glance. It then applies the same rules to the hourly chart, the energy balance, the options table, Compare, Sensitivity, the option detail, the plan check, the settings and the PDF. No figure, rule or ranking changes: only layout, drawing and wording. The work is in four phases, 14 items.

## How the evidence was gathered

- The built page was opened in Chrome at 1440 × 900 and 1280 × 800, with the T1 example run complete (6,170 options).
- Every screen was captured: header, inputs, Options, Trade-offs, Compare (three options ticked), Dispatch, Sensitivity (tornado, breakevens and Monte Carlo all run), option detail, full-screen map, General settings, and the PDF report (27 pages, saved from the app).
- Today's screens are in `evidence/`.
- The "after" pictures are separate drawings made from this run's own numbers (read from the live page and its tables). They are pictures, not working code.
- Not checked: dark mode, the Site tab (Beta, left out as asked), and how the text sits in the wider font that GitHub's test machine uses.

## The design system

One sheet shows all of it: `shots/13-design-system.png`.

**1. One colour per technology.** The same colour on every card, chart, key and PDF figure. Plain fills, no hatching.

| Technology | Colour | Today |
|---|---|---|
| Grid connection | blue `#2a78d6` | same |
| PPA (delivered over the grid) | green `#008300` | not drawn on screen (hidden inside the grid band); green in the PDF |
| Gas engines, turbines, CHP | orange `#eb6834` | red with hatching on screen; orange in the PDF |
| Solar PV | yellow `#eda100` | same |
| Batteries | teal `#1baf7a` | same |
| Fuel cells | violet `#6250d6` | green |
| SMR | pink `#e87ba4` | same |
| Standby diesel / HVO | grey `#8a9099` | orange |

Standby plant is grey because it is backup, not supply. That frees orange for gas. These colours were run through a colour-blindness check in the order they are stacked on the charts (solar, battery, gas, grid, PPA) and pass. Three of them (yellow, teal, pink) are too pale to carry meaning alone, so every chart keeps labels and a table. Wind keeps today's drawing for now (it shares the grid blue with a hatch). It is rarely generated, and a ninth colour should be chosen only when it is needed.

*Note on point 4.* You rejected the colour change on the phasing chart because the chart was hard to read, not because of the colour. The new palette still moves gas from red to orange, because the brief for this rework is that red only means a problem. The phasing chart itself is redrawn in item 1. If you would rather keep gas red, items 1 and 3 still work; only the swatch changes.

**2. Status: five levels, each a mark and a word.** Colour never carries the meaning alone.

| Level | Mark | Used for |
|---|---|---|
| OK | ✓ green | adequate, meets, on its date |
| Caution | ▲ amber | minor flag, buildable with conditions, late within the allowed window |
| Problem | ✕ red | major flag, not adequate, does not meet, building not built, later than the allowed window |
| Note | i grey-blue | facts about the run and its assumptions (today's INFO) |
| Neutral | outline | beaten by another option ("dominated"), Step down, Beta |

A default that is not yet verified is a hollow amber ring beside the label (accepted point 6). Its source shows on hover and in the detail, so every default is still flagged with its source.

**3. Type: six sizes.** 28 px key figures, 20 px screen titles, 16 px section titles, 14 px body, 13 px tables, 12 px captions. System fonts only (Segoe UI on Windows). Nothing is downloaded.

**4. Spacing: six steps.** 4, 8, 12, 16, 24, 32 px.

**5. Parts.** Cards: white, 1 px line, 10 px corners, 16 px padding. Tables: 13 px, numbers right-aligned in equal-width digits, grey header row. Buttons: three kinds only (one filled main action per screen, outline, text link) plus a two-way switch for views. Flags: a coloured bar at the left, the level in words, then the text.

**6. Charts.** The title says the finding ("supply stays ahead of the design load"), not only the subject. Names sit on the chart where they fit; a key stays underneath. One y axis. Milestones sit on the time axis. Every chart keeps a "Table" button.

## What the engineer sees first, screen by screen

| Screen | First | Then | One click away |
|---|---|---|---|
| Results (Options) | Verdict panel and map | Plan-check line, five strategy cards | Run details, all options table |
| Trade-offs | The chart with the five leaders numbered (accepted point 5) | Axis choices | Table, help text |
| Compare | What makes the options different | Rows where figures differ, best marked | Rows that are the same |
| Dispatch | Phasing chart with its finding as the title | Hourly chart with the week's energy mix | Energy balance table, engine checks |
| Sensitivity | Tornado with values on the bars | Nearest change of leader | Driver list, full tables, method notes |
| Option detail | Name, score, status, five key figures | What it is, what needs attention | Sizing, all flags, defaults, choices |
| Settings | Every setting in one side panel | | |
| PDF | Same figures, colours and status marks as the screens | | |

## The items, in priority order

Effort: S = up to a day, M = two to four days, L = a week or more (Claude building, including tests). Risk is the chance of breaking something or needing a decision from you.

### Phase 1: foundations (do first; everything else uses them)

**Item 1. Phasing chart rework** (your point 4 comment)

- *Problem.* Dispatch tab, `evidence/today-dispatch-tab.png`. Ten years on the x axis, of which only May 2029 to Aug 2032 changes; the chart is flat for the last four and a half years. Three milestone labels overlap at the top ("Full grid connection" runs into "Full load supplied"). Gas is a red hatched block, which reads as a warning. The key is a separate row, so the eye goes back and forth. Spare capacity is not shown: you have to subtract the line from the blocks. The late start of building 1 is not on the chart at all.
- *Proposal, alternative A* (`shots/01-phasing-chart-A-stacked-supply.png`). Keep the stacked blocks, in plain colour. The part of each block in use (under the load line) is full colour; the spare part is pale. Names and megawatts are written on the blocks. The view opens on the build period (mid 2028 to mid 2033) with a switch to the whole study. Two lanes under the time axis carry the milestones: supply events (grid to 120 MW, gas engines on) and buildings (B1 to B4, design load reached). Building 1's planned date and its 9-month slip are drawn as an amber arrow. The tightest month is called out (Jul 2029, 5.9 MW spare). A power gap would be a red block; there is none in this option.
- *Proposal, alternative B* (`shots/02-phasing-chart-B-headroom-and-lanes.png`). Two lines only, firm supply and design load, with the space between shaded as spare. Underneath, one bar per source shows what the supply is made of and when each part arrives. Same milestone lanes.
- *Which one.* A is closer to today's chart and shows the make-up and the spare in one picture. B answers "is there enough?" fastest, but takes two panels. My pick is A. B is the better choice if you find any stacked chart hard to read.
- *What is new on screen.* "Spare" and "tightest month" are supply minus load from the chart's own table. No engine change. Worth a test that they match the table.
- *Effort* M. *Risk* low to medium: the chart component is shared with the hourly chart, and browser tests read its parts.
- *Accessibility.* Table button stays. Keyboard read-out (arrow keys) stays. Labels and marks carry the meaning, not colour.
- *Files.* `components/StackChart.jsx`, `components/DispatchView.jsx`, `styles.css`, `tests/browser-tests.mjs`.

**Item 2. Design tokens: colours, status, type, spacing**

- *Problem.* `styles.css` has good colour variables, but gas is red (`--src-gas: #e34948`), "late" is a dark red pill, and sizes and gaps are set case by case. Top five cards, `evidence/today-top-five-cards.png`: three shades of red text and pills on a card whose option is adequate and buildable.
- *Proposal.* Put the design system above into `styles.css` as named values, and move every screen onto them. `shots/13-design-system.png`.
- *Decision for you.* "Late · up to 9 months" becomes amber when the start is inside your allowed window (24 months), red when outside it. The engine already calls this a MINOR flag in the option detail, so the screen would agree with it. The plan check itself stays MAJOR and red.
- *Effort* M. *Risk* medium: touches every screen; contrast must be re-checked (the automatic accessibility check covers it). Dark mode needs its own values.
- *Files.* `styles.css`, `components/Realism.jsx`, `components/FlagNotes.jsx`, `components/TopFive.jsx`, `components/RankedList.jsx`, `components/site/SitePlan.jsx` (patterns).

**Item 3. Results first: fold the run details, verdict beside the map** (accepted points 1, 2, 7, 8 together)

- *Problem.* Options tab at 1440 × 900, `evidence/today-1440-first-screen.png`. The first screen is the eight-box strip, run progress and the event log. The tabs start 6,197 px down, because the run summary (4,889 px, mostly the compatibility rules table) is open above them. At 1280 px the stage names are also cut ("Input normal…"), `evidence/today-1280-first-screen.png`.
- *Proposal.* `shots/11-overall-results-screen.png` (1440) and `shots/12-overall-results-screen-1280.png`. Header as accepted. Verdict panel and map card side by side, so both are on the first screen with the tabs and the first cards just below. Run progress, run summary and the eight notes fold into one "Run details" line. The eight-box strip goes: its content is in the verdict, the header pill and Run details.
- *Decision for you.* Point 8 was accepted as a full-width map above the results. Side by side keeps the verdict on the first screen. Full width is still possible; the verdict then starts about 350 px lower.
- *Effort* M. *Risk* low. Run details must stay reachable by keyboard and open by itself while a run is in progress or when a run has warnings.
- *Files.* `App.jsx`, `components/RunProgress.jsx`, `components/RunSummary.jsx`, `components/SummaryPanel.jsx`, `components/MapPicker.jsx`, `styles.css`.

### Phase 2: the screens used most

**Item 4. Strategy cards** (accepted point 3, made consistent)

- *Problem.* Cards are 808 to 932 px tall, mostly sentences: two conditions in full, the late sentence, flags in red, 18 defaults.
- *Proposal.* In `shots/11-overall-results-screen.png`. Name split into strategy (bold) and variant (small). Supply bar and timeline as accepted, in the new colours, with the planned date shown as a dashed ring. Status marks in one row. Three figures. One "+" line and a count of conditions. Everything else is in the detail. About 400 px tall.
- *Effort* S to M. *Risk* low. *Files.* `components/TopFive.jsx`, `styles.css`.

**Item 5. Options table**

- *Problem.* `evidence/today-options-table.png`. Each row is about 165 px tall because the same late sentence and pills repeat on every row: five rows a screen, 50 rows = 8,374 px. The table is 1,544 px wide in a 1,008 px space, so seven columns (CFE, first power, full load, adequacy, unmet, resilience, flags) need sideways scrolling. The filter bar is three rows of mixed controls.
- *Proposal.* `shots/04-options-table.png`. Compact rows: strategy and variant, score with the four small bars, LCOE, capex, carbon, first power → full load, four status marks, flag counts. Twelve rows a screen, no sideways scroll at 1440. Something true of every row on the page is said once above the table. One search box, one three-way switch, and "Filters" and "Columns" menus. A Compact / Full switch brings back today's rows. Below 1,360 px wide the inputs column narrows and one column moves into the Columns menu.
- *Flag, never enforce.* Nothing is hidden or reordered. Every badge is still there as a mark with a hover text, and in Full view as today.
- *Effort* M. *Risk* medium: sorting, paging and several browser tests read this table.
- *Files.* `components/RankedList.jsx`, `components/FilterChips.jsx`, `components/Realism.jsx`, `styles.css`, `tests/browser-tests.mjs`.

**Item 6. Option detail**

- *Problem.* `evidence/today-option-detail.png`. 4,007 px tall. It opens inside the table, about 2,000 px below the card that was clicked, and is as wide as the table (1,544 px), so the right end of every long line and table is off screen. Its third column (time-to-power, permitting outlook) is off screen to the right, which leaves what looks like a blank area in the middle. 16 flags and 18 defaults are listed in full at the same weight; the one major flag is the sixth in the list.
- *Proposal.* `shots/08-option-detail.png`. A panel the width of the results column. Top: name, score, status marks, five key figures. Section tabs. Overview shows "what it is" (energy mix bar and plant list) and "what needs attention" (major first, then minor). Score make-up and cost by period. Everything else (programme, cost lines, sizing, all flags, defaults, choices) keeps today's content, folded, one click away. About 1,500 px.
- *Effort* L. *Risk* medium: `detail-tests.mjs` and the "Add comment" buttons on flags must keep working; the PDF takes some of its text from the same places.
- *Files.* `components/OptionDetail.jsx`, `components/FlagNotes.jsx`, `components/Realism.jsx`, `components/RankedList.jsx` (where it opens), `styles.css`.

**Item 7. Hourly dispatch and energy balance**

- *Problem.* `evidence/today-dispatch-tab.png`. The blue band is "grid import including PPA", so the largest source (PPA, 67 % of the year) cannot be seen. Gas is red hatching. Three rows of controls. A 100-word paragraph explains how to read the chart. The energy balance is a two-sided table where six of twelve rows are 0 MWh.
- *Proposal.* `shots/03-hourly-dispatch-and-energy-balance.png`. PPA drawn as its own green band above grid import. Plain colours, names on the bands. One row of controls. Under the chart, one bar for the week's energy mix. The explanation moves behind "How to read this chart". Energy balance: an In bar and an Out bar, then a four-row table with shares; the zero rows fold into one line.
- *Check.* The split uses the columns already in the hourly table ("Grid to load", "PPA delivered"). The order stays solar, battery, on-site plant, grid, with PPA on top of grid.
- *Effort* M. *Risk* low to medium (shared chart component).
- *Files.* `components/StackChart.jsx`, `components/DispatchView.jsx`, `styles.css`.

### Phase 3: the analysis tabs

**Item 8. Plan check and run notes**

- *Problem.* `evidence/today-plan-check.png` and `today-run-notes.png`. The plan check is two paragraphs and a table; the key fact (building 1 cannot start on time in any option) is in the second sentence. Above the tabs, nine notes are listed at the same weight, eight grey and one red.
- *Proposal.* `shots/07-plan-check-and-run-notes.png`. A four-row timeline: planned date, earliest start, the slip in red. The cause in one line. One bar showing how the 6,170 options split (3,841 late inside the window, 1,716 outside it, 613 not powering every building). The eight notes fold into Run details.
- *Effort* S to M. *Risk* low. *Files.* `components/Realism.jsx`, `App.jsx`, `styles.css`.

**Item 9. Sensitivity**

- *Problem.* `evidence/today-sensitivity-tab.png`. 3,085 px. The driver tick-list (267 px) comes before any result. Tornado bars have only "L" and "H" at their ends. The breakeven table has 40 cells holding 80 entries, 75 of which say "no flip". The Monte Carlo table is 20 rows of digits; the finding (the leader leads in 27 % of samples, #11 is steadier) is one sentence in small type.
- *Proposal.* `shots/06-sensitivity.png`. Titles state the finding. Tornado: input value and LCOE written at each bar end, swing in a column at the right, drivers behind a menu. Breakevens: a dot for "no change", amber cells for the five changes of leader, the nearest ones in a line above. Monte Carlo: a bar for "leads / top three", a line and dot for the score range, the leader and the steadier pick marked.
- *Effort* M. *Risk* low. Tables stay available. The tornado's keyboard use stays.
- *Files.* `components/SensitivityView.jsx`, `components/BreakevenPanel.jsx`, `components/UncertaintyPanel.jsx`, `styles.css`.

**Item 10. Compare**

- *Problem.* `evidence/today-compare-tab.png`. 19 rows at the same weight. 9 of them are identical across the three options. The same late sentence appears three times in red. The rows that explain why the options differ ("choices") are at the bottom.
- *Proposal.* `shots/05-compare.png`. Choices first. Then result, cost, carbon, programme and risk. Rows that differ are bold with the best value marked; identical rows are grey and say "same for all three". A switch shows all rows as today.
- *Note.* "Best" means lowest cost and carbon, highest score, earliest full load. This is a marking only.
- *Effort* S to M. *Risk* low. *Files.* `components/CompareView.jsx`, `styles.css`.

**Item 11. Trade-off chart** (accepted point 5)

- *Proposal.* Build as accepted (`first-round/point-5-a-tidier-trade-off-chart.png`), using the new tokens: grey faded dots, the five leaders numbered with a key. The control rows above the chart fold into one row. The key under the chart uses the status marks.
- *Effort* M. *Risk* medium (canvas drawing, keyboard movement between 6,170 points). *Files.* `components/ParetoChart.jsx`, `components/ParetoView.jsx`.

### Phase 4: consistency and the edges

**Item 12. PDF report**

- *Problem.* `evidence/today-pdf-pages-3-and-8.png`. The PDF has its own palette: orange is the facility load on page 3 and on-site plant on page 8; grid is grey-blue; PPA is green. On screen, grid is blue, gas is red and PPA is not drawn. An engineer moving between the screen and the report has to relearn the colours.
- *Proposal.* `shots/10-pdf-report-page.png`. The PDF's colour list takes the same technology colours and the same status marks. The leader's phasing figure is drawn as on the Dispatch tab. Existing figures keep their content; only colours, labels and keys change. Figure 1 (need against the grid alone) stays, with grid blue, load as the black line and the gap shaded. Body text stays in Times and headings in Helvetica, as today (both are built into every PDF reader, so nothing is embedded).
- *Limit.* The PDF writer cannot draw ✓ or ▲ in its fonts today (it writes "yes" and "x"). The marks would be drawn as small shapes.
- *Effort* M. *Risk* medium: three report test files check the layout and page count.
- *Files.* `report/report.js`, `report/pdf.js`, `tests/report-*.mjs`, user guide mock `m09-pdf.html`.

**Item 13. Inputs column and settings** (accepted point 6, plus settings)

- *Problem.* With every section open the inputs column is 16,964 px tall. General settings is a box with one tick-box that pushes the whole page down 180 px (`evidence/today-general-settings.png`). Other settings live elsewhere: display currency and "sample above cap" in the inputs, rows per page under the table. "Load T1 example" and "Reset to defaults" sit in the header beside Save.
- *Proposal.* `shots/09-general-settings.png` and the left column of `shots/11-overall-results-screen.png`. Inputs: the six first-run fields, then each section as one closed line that shows its main values. Settings: a side panel that gathers the settings that exist today, plus the new Compact / Full choice. Load example and Reset move into it (accepted point 7 already takes them out of the header).
- *Check before building.* Whether a colour theme switch exists today; if not, leave it out.
- *Effort* M. *Risk* low to medium: the panel must hold keyboard focus while open and give it back on close.
- *Files.* `components/InputsPanel.jsx`, `components/Field.jsx`, `components/Help.jsx`, `App.jsx`, `styles.css`.

**Item 14. Full-screen map and records**

- *Problem.* `evidence/today-full-screen-map.png`. The map opens on all of Europe although the site is known. The layers panel covers a quarter of the map. Four lines of source text sit under it. 380 kV lines are red (the usual convention on grid maps).
- *Proposal.* Open zoomed to the site. Layers panel closed until asked for. Sources behind "About this map". Keep the voltage colours, since engineers know them from grid maps, and say so in the key; the site ring changes from red to dark ink.
- *Also.* Update the user guide mock-ups (`docs/user-guide/mock/m06`, `m07`, `m08`, `m09`, `m10`, `m11`) and chapters to match what is built.
- *Effort* S (map), M (user guide). *Risk* low. *Files.* `components/MapPicker.jsx`, `docs/user-guide/`.

## Phases at a glance

| Phase | Items | Why in this order |
|---|---|---|
| 1 Foundations | 1 phasing chart, 2 tokens, 3 results first | Your open complaint first; the tokens are used by everything after |
| 2 Most-used screens | 4 cards, 5 table, 6 detail, 7 hourly and balance | Where an engineer spends the time |
| 3 Analysis tabs | 8 plan check, 9 sensitivity, 10 compare, 11 trade-offs | Same parts, applied tab by tab |
| 4 Consistency | 12 PDF, 13 inputs and settings, 14 map and user guide | Brings the report and the edges into line |

Each phase can be built, checked and merged by itself. Phase 1 already changes how the tool feels.

## Accessibility, across all items

- Contrast: the text and badge pairs in the design system were measured against the 4.5 to 1 rule. All pass except one: white text on the grid blue is 4.4 to 1, just under. When built, labels on blue should be 14 px bold or larger, or the blue one step darker. Dark ink is used on orange and yellow.
- Colour is never the only signal: each status has a mark and a word; each chart has names on it, a key and a table.
- Keyboard: folded sections are ordinary open/close elements; the side panel and the detail panel need focus handling (noted in items 6 and 13).
- The automatic accessibility check (axe) and the browser tests should run after each item. Several tests look for today's element names, so they will need updating with the screens.

## Found while looking (not visual; for your decision)

These are outside "layout, drawing and wording", so nothing here is proposed as part of the rework. Each should go to `KNOWN-ISSUES.md` if you agree.

1. **Options table, LCOE column.** The header says "LCOE £/MWh" but the values are in euro: 210 for the leader, where the card, Compare and the detail say £176/MWh. In `components/RankedList.jsx` the column is formatted without the currency conversion that the capex column beside it uses. The mock-up shows the pound figures (euro value × 0.8377, the rate the tool quotes).
2. **Capex filter.** Labelled "Capex at most (€ m)" while the results show pounds.
3. **Flag text.** Several flags quote euro amounts ("€14.8 m") beside pound results.
4. **Flag counts.** For the leader the table shows 1 major, 5 minor, 10 info and the detail lists 16 flags, but Compare shows "2 · 5 · 10".

## What the mock-ups do not show

- They are drawn at one size each (1,008 px panels; 1,440 and 1,280 px for the whole screen). Narrower windows and dark mode are not drawn.
- Hover read-outs, sorting and folding are described, not shown.
- Option names are shortened in two places ("gas engine bridge, kept as prime") as accepted in point 2; elsewhere the tool's own names are used.
- The settings panel shows settings believed to exist today; item 13 says what to confirm.

## Files

- This proposal: `docs/visual-rework/PROPOSAL.md`
- Mock-ups: `docs/visual-rework/shots/01` to `13` (listed in each item)
- Today's screens: `docs/visual-rework/evidence/`
- The first round's eight before-and-after pictures (points 1 to 8): `docs/visual-rework/first-round/`
- The scripts that made the pictures, and the data read from the live page, were not copied into the repository.
