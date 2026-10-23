# Build Brief v2: Data Centre Concept Energy Optioneering Tool

Status: **revision 5, 2026-10-21**: the owner's user-workflow walkthrough of 2026-10-21 is folded in. Earlier: the draft for review (revision 1) and revisions 2–4, all 2026-10-15 (see `CHANGELOG.md`). Supersedes the v1 build prompt ("Build Prompt — Data Centre Campus Energy Strategy Tool").
Companion files: `CHANGELOG.md` (what changed from v1 and in each revision, and why), `ASSUMPTIONS.md` (assumptions to review), `OPEN-QUESTIONS.md` (decisions with proposed defaults, and the points the walkthrough left open). The walkthrough's decision log is `../docs/walkthrough-decisions-2026-10-21.md`; the plan for building the agreed changes is `../docs/BUILD-PLAN.md`; known issues in the built engine are in `../docs/KNOWN-ISSUES.md`.

**Revision 5 in short.** The walkthrough changed the scope. The audience is data centre consultancies in general. The product is a Windows program only (the phone version is dropped). The location is set by a pin on a map bundled with the program. The site is one figure, its area; the site layout becomes a Beta feature, kept out of the ranking and the PDF. The tool runs at any level of knowledge: every input has a default, and every value the engineer did not enter is flagged on each option that uses it, with its source. The results open on the top five options, and the only report export is one PDF (no Excel). Text changed in this revision is marked "(walkthrough, 2026-10-21)". Where this brief and the decision log disagree, the decision log is newer: follow it and tell the owner. Points the walkthrough left open are questions 19 onwards in `OPEN-QUESTIONS.md`: ask the owner, one question at a time, before building the part a question affects.

Conventions in this brief:
- **R** = required at concept stage (the tool cannot run without it). **D** = has a default; the user can run without touching it. **A** = derived automatically; the user can override it.
- "Indicative — unverified" means a default the builder has not verified against a named source. Until it is verified, the UI shows it with that label (see §18). Run settings and judgement choices have no source to verify against and keep the label (§23 label rule).
- All numbers given here as defaults are placeholders unless a source and year are shown and verified. The builder must not present any of them as sourced until verified.
- **Blanket rule:** every numeric default, threshold, weight or penalty in this brief that does not name a source is indicative — unverified, whether or not its row repeats the label. No default in this brief has a verified source yet. The full label rule, which also covers run settings, view settings and input-state defaults, is stated once in §23. Where a row says "indicative — unverified (run setting)" or "indicative — unverified (judgement)", the words in brackets are the basis recorded in §18, not a separate label. Where a row names a source, it is a *source to verify against*, not a citation; the builder fills `source`, `year` and `url` (§18) only after checking it. No years or editions are given here unless stated as known.
- Units: SI. Power in MW (electrical MWe unless marked MWth), energy in MWh, area in m² and ha, length in m, carbon in gCO₂e/kWh and tCO₂e, water in L/kWh (WUE). Currency is user-selectable.

---

## 1. Purpose and users

### 1.1 Purpose

An interactive tool for the **concept stage** of a data centre project, when the site boundary, IT load, grid offer and programme are still rough. It generates many energy-strategy options, checks each one against the site, and shows the trade-offs between them so that a designer can narrow down to a preferred strategy and two or three alternates, with the reasons recorded.

It answers five questions for each option:
1. **What does it cost?** (capex, opex, LCOE, NPV, as ranges)
2. **What is its carbon and water impact?**
3. **When does it deliver power?** (first MW, full load, any bridging gap)
4. **Does it fit on the site?** (footprint, height, separation, setbacks). Beta only (walkthrough, 2026-10-21): answered in the Site tab when it is turned on in the general settings, and kept out of the ranking and the PDF (§10).
5. **How deliverable and risky is it?** (technology maturity, permitting triggers, fuel dependency, resilience requirement met or not)

And across options: **which option leads under the user's priorities, how confident is that, and what would change the answer?**

**Owner, 2026-10-22 (OPEN-QUESTIONS 37).** The main question the tool answers (owner, 2026-10-22): **what is the best power strategy for a site to maximise the IT load while offering up to five nines (99.999 %) of availability to the customer.** Having enough power to meet the load at all times is the critical aspect of the tool.

### 1.2 What it is not

A decision-support aid for concept-stage screening. It is not financial, engineering, planning or legal advice, and its outputs are not a design (see §22 and §23).

### 1.3 Users

| User | What they need | Depth |
|---|---|---|
| MEP / energy engineer (primary) | Set up the site and load quickly, open and lock design choices, inspect sizing, dispatch and assumptions, test sensitivities, export evidence | Full: every assumption editable, dispatch and sizing visible |
| Development / strategy lead | Compare a handful of options on cost, carbon, time-to-power and site fit; understand what drives the ranking | Summary views, plain-English summary |
| Client / investor (viewer of exports or a shared screen) | Understand the shortlist and confidence in it | Report and presentation view only |

Primary persona for UX decisions: a senior MEP engineer in an early client workshop, iterating live on a laptop or large screen while the client watches.

Audience (walkthrough, 2026-10-21): engineers at data centre consultancies in general, not one firm. The repository stays public.

### 1.4 Scope of a session

One site and one project at a time. A project file (JSON) can be saved and reopened, and two saved projects can be compared offline by exporting each (multi-site portfolio is out of scope). Not built, and the walkthrough of 2026-10-21 did not cover it (OPEN-QUESTIONS 27).

---

## 2. Product principles

1. **Options first.** The default screen after setup is a set of options, not a single answer. The tool's main job is to generate, filter and compare.
2. **Fast first, then precise.** A fast screening model updates every option within the targets in §17. A full 8760-hour model verifies the shortlist on demand or in the background. Every result shows which model produced it.
3. **Site layout as a Beta feature** (walkthrough, 2026-10-21); replaces "Spatial by default". In the main flow the site is one figure, its area. The site layout, the planning constraints and boundary import live in the Site tab, which is a Beta feature: hidden by default, turned on in the general settings, labelled Beta, and kept out of the ranking and the PDF export (§10). When it is on, every option has a layout and a site-fit status ("Fits / Fits with flags / Does not fit"), shown but never scored.
4. **Ranges, not points.** Every headline metric is shown as P10–P50–P90 (or low–central–high) with the central value emphasised. Concept-stage inputs are rough, and the tool shows that.
5. **Flag, never enforce.** Constraints (land, height, grid capacity, emissions, run-hours, permitting thresholds, resilience requirement, capex and land-take ceilings, carbon and time-to-power targets) produce visible flags. **Definition (the only one in this brief):** "enforce" means the tool excluding, hiding, demoting or resizing an option because it breaches a constraint. The tool never does this. Modelling a stated input as given is not enforcement: for example, dispatch serves load from the grid only up to the grid capacity the user entered, and any demand above it is shown as unmet load and flagged (§9.4); likewise the grid connection on each option is the contracted capacity the engineer set for it (walkthrough, 2026-10-21; default the full offer, as built), never resized by the tool (§9.2). Sizing rules that take a stated requirement as a design input (backup and fuel storage sized to the resilience requirement, §9.2, principle 9) are not enforcement either: every option is sized by the same rule before any check, and no option is resized after it is found to breach a constraint. The consequence of a constraint is always visible in the results and flagged; it is never resolved silently.
   Everything that can reduce what is generated, screened or shown is listed below. Each is visible, reversible, shown with its state in the header strip or the run summary (§12), and listed in every export:
   - **Compatibility rules** (generation, §7.2 step 2). The one exception to "no option is excluded": combinations that are logically impossible (not merely unattractive or constrained) are not generated, because they cannot be built or even described. Each rule is listed by name in the run summary with the number of combinations it removed. Combinations that are possible but breach a constraint are always generated and flagged.
   - **Values not generated** (generation, §8 rules). Any choice whose default state omits alternatives (open with a subset, locked, or the C11 wind default), and any alternative the user excludes or locks out, shows in the "values not generated" note in the run summary listing the omitted values (user removals marked "excluded by user"), with one click to include them.
   - **"Sample above cap"** (run setting, §7.2 step 4). It only has an effect when the user opens more choices than the generation cap allows. The Choices panel shows the projected count and the setting before generation, so it is never a silent exclusion. The user can switch it off to screen every combination.
   - **User view filters** (§11): by site-fit status, resilience status, any flag, capex or land-take ceiling, dominated status, and brushing on any chart axis (§12.2). Each shows as a removable chip.
   - **"Hide dominated options"** (view setting, **off** by default; §7.2 step 6). When on, a counter shows how many are hidden and one click shows them again.
   View filters, brushing and "Hide dominated options" never change any score or rank (§11 scoring scope). The three generation items change which options exist and therefore the scoring set, and the scope note says so. The only setting that changes rank order without changing scores is "Rank requirement-compliant options first" (off by default, §11), which is shown in the header strip and exports when on.
6. **Nothing buried.** Every number that drives a result is visible, editable, and shows its source, year and confidence on demand.
7. **Reconciled numbers.** LCOE, NPV, capex/opex split and annual costs all derive from one cash-flow ledger per option (kept from v1).
8. **Grid timing is load-bearing.** Grid capacity over time and connection date are central drivers of option generation, time-to-power and bridging feasibility (kept from v1).
9. **Resilience is a requirement, not a weight.** The user states a resilience requirement. Options are sized to meet it, and any option that does not meet it is flagged. It is not traded off against cost in the weighted score (changed from v1; see CHANGELOG).
10. **Works at any level of knowledge** (walkthrough, 2026-10-21). Some inputs are always known (location, site area), some sometimes (grid availability, IT load) and some rarely. Every input has a default, and the tool runs with only a location and a site area. Every value the engineer did not enter is flagged on **each option that uses it**, with its source (the "assumed default" flag, §15), not only counted in the header strip. Each input shows whether the engineer entered it or the tool is assuming it.

---

## 3. Concept-stage workflow

The UI is a left-to-right workflow with seven steps shown as a stepper (revisions 1–4; whether this stays is OPEN-QUESTIONS 29). Users can jump to any step at any time. Results are live from step 4 onward, and any later edit to an earlier step updates the options without restarting.

| # | Step | User does | Tool does | Min. user time target |
|---|---|---|---|---|
| 1 | **Project** | Name; drops a pin on the map bundled with the program, or types coordinates; checks the country (from the pin, editable) and the currency (walkthrough, 2026-10-21) | Loads country profiles (climate, solar, wind, grid price, grid carbon), sets defaults; shows the nearest ASHRAE design station and its distance (walkthrough, 2026-10-21) | 30 s |
| 2 | **Site** | Enters the site area in hectares (walkthrough, 2026-10-21). Beta, in the Site tab only: draws or imports the boundary; exclusion zones, setbacks, height limit, grid point of connection (POC), gas main, access, noise receptors | Main flow: uses the area for the IT estimate and the land budget. Beta: calculates gross and net developable area and shows the buildable envelope | 15 s (Beta boundary drawing: 1–3 min) |
| 3 | **Load and building** | IT load target (MW) or "Estimate from area"; phasing (optional); load shape; demand flexibility (optional); cooling type (always chosen by the engineer); density (walkthrough, 2026-10-21) | Derives PUE (hourly, temperature-driven), facility load, building GFA and footprint, roof area. Beta: places the building massing on site | 1 min |
| 4 | **Utilities and grid** | Grid import capacity by date (stepped), each value of which can be "Not known" (walkthrough, 2026-10-21); connection voltage, price and carbon overrides, gas availability, water availability | Uses a country default, flagged on every option, for any grid value not known (walkthrough, 2026-10-21). Builds the hourly grid availability, price and carbon arrays and the bridging periods. **First options appear here** using defaults for the remaining steps | 1 min |
| 5 | **Requirements and priorities** | Resilience requirement, batteries and backup gensets, carbon target, time-to-power target, capex ceiling and land-take ceiling (optional), weights; economics (evaluation periods, WACC, prices, escalation, grid connection charge, revenue options) (walkthrough, 2026-10-21) | Re-applies the backup and fuel-storage sizing rules (§9.2) to every option with the new requirement, re-scores, re-ranks, raises flags (targets and ceilings are flag thresholds only, §5.5); describes the effect of each weight change in words (walkthrough, 2026-10-21) | 1 min |
| 6 | **Options** | Reads the top five option cards first (walkthrough, 2026-10-21); opens or locks design choices (§8), filters, explores the options table, the trade-off chart, parallel coordinates and (Beta) site plans; sets each option's contracted grid capacity (method open, OPEN-QUESTIONS 19); picks up to three options to compare | Generates and screens the option set, marks dominated options (shown unless the user switches on "Hide dominated options"); Beta: lays out each option on site | open-ended |
| 7 | **Stress test and decide** | Runs uncertainty and sensitivity, verifies the shortlist with the 8760 model, views dispatch for verified options, picks a preferred option and alternates, writes or edits the rationale, exports the PDF | Monte Carlo, tornado, breakevens, 8760 verification, plain-English summary, PDF report | open-ended |

The screen structure (a stepper, tabs or sections) was not covered by the walkthrough of 2026-10-21 (OPEN-QUESTIONS 29). The steps above describe the order of work, not a layout.

The time column is the target for a user working through the full stepper. First options appear at the end of step 4. With the site entered as an area, the sum of steps 1–4 is about **3 minutes** (walkthrough, 2026-10-21); drawing the boundary in the Beta Site tab adds 1–3 minutes. This path is not held to the 5-minute target.

Measurable target (quick-start mode only): a new user can get a ranked option set in **≤ 5 minutes** from a blank project by entering **2 required values**, the location and the site area (walkthrough, 2026-10-21). Every other input, including the IT load and the grid values, has a default that is flagged on every option that uses it; entering the IT MW, grid capacity and grid date when they are known improves the result. The quick-start form has a user-time target of **≤ 2 minutes**, which leaves margin for reading and first orientation.

"Quick start" mode: steps 1–4 collapse into one form with the two required values (location, site area) and the four values engineers most often know (IT MW, grid capacity now, grid capacity at full connection, full-connection date), each of which can be left "Not known" (walkthrough, 2026-10-21). Everything else defaults. Steps 5–7 are optional after first options appear.

---

## 4. Architecture and tech stack

- **Windows program** (walkthrough, 2026-10-21): Windows only; the phone version is dropped. A client-side single-page app, React (functional components and hooks) with TypeScript (as built: JavaScript; see `app/BUILD-NOTES.md`, Architecture), packaged with Electron as a Windows program that makes no network connection at all. No backend is required. The same app is also built as one HTML file that runs offline in a browser, for testing and quick looks. The map for the location pin is bundled with the program (§5.1); data is prepared when each release is made, not fetched by the program (§18).
- **Compute in Web Workers.** All option generation, screening, layout, Monte Carlo and 8760 verification run in a worker pool (size = `navigator.hardwareConcurrency − 1`, minimum 1, maximum 8; the bounds are indicative — unverified (run setting) and editable in advanced settings). The main thread only renders. Every compute job can be cancelled: a new input change cancels in-flight jobs for stale inputs.
- **Incremental recompute.** Keep a dependency graph from inputs to derived arrays to option results. An input change recomputes only what depends on it. For example, a weight change re-scores and re-ranks only (no dispatch), a site edit re-runs layout only, and a gas price change re-runs economics and the gas dispatch decisions only.
- **Input commit model.** Sliders and text fields update the screening results on commit (pointer up, Enter, blur) and, for sliders, also during drag with a 150 ms throttle (indicative — unverified (run setting), matching the §17 slider target) using the screening model only.
- **Charts:** a library that renders SVG or Canvas accessibly (Recharts or visx acceptable). Parallel coordinates and Pareto plots with more than 500 points use Canvas, with an accessible table alternative.
- **Site view:** 2D plan in SVG or Canvas (primary) with an optional 2.5D extruded massing view (three.js or similar, lazy-loaded). Plan and massing share one geometry model.
- **Geometry:** local planar coordinates in metres, projected from WGS84 using a local transverse Mercator centred on the site. Polygon operations (offset/setback, difference, area, point-in-polygon) via a maintained library (for example Turf.js or Clipper).
- **Persistence:** the project is saved as a downloadable JSON file and reopened by upload. Browser storage may hold an autosaved draft as a convenience only. Every storage call is wrapped in try/catch, and the app works fully without it. Not built; the walkthrough of 2026-10-21 did not cover saving and reopening a study (OPEN-QUESTIONS 27).
- **Determinism:** seeded PRNG for all stochastic steps (Latin hypercube option sampling and Monte Carlo), so the same project file plus seed gives identical results within the tolerance in §17 (1e-9 relative, allowing for floating-point differences between browsers). The seed is stored in the project file and shown in exports.

---

## 5. Inputs

Every numeric input has a default, a unit, a low/central/high range (for uncertainty, §13), a source tag (§18) and an "R / D / A" status. Inputs are grouped in collapsible sections in the order of the workflow.

**Knowledge levels (walkthrough, 2026-10-21).** Only the location and the site area are required. Every other input, including those marked **R** in earlier revisions (the IT load and the three grid values), has a default and can be left "Not known"; the tool then runs on the default and raises the "assumed default" flag on every option that uses it, naming the value and its source (§2 principle 10, §15). Each input shows whether the engineer entered it or the tool is assuming it.

Non-numeric defaults in these tables (for example Gas available "Unknown", Hydrogen availability "No", Water available "Unknown", Workload type "Mixed cloud", Cooling approach "Open choice", Substation type "AIS", Demand flexibility "Off", Carbon target "None", Grid export capacity 0) are judgement choices. Under the §23 label rule they are indicative — unverified (judgement), exactly like the numeric defaults, and the UI shows the label next to each one while it is at its default.

### 5.1 Project and location

| Input | Default | Status | Notes |
|---|---|---|---|
| Project name | "Untitled project" | D | |
| Location (lat, long) | none | **R** | A pin dropped on the map bundled with the program (walkthrough, 2026-10-21: OpenStreetMap data in Protomaps PMTiles format, all of Europe, to roads level; licence, attribution and file size to check, §18), typed coordinates, or a country centroid if the user only knows the country (flagged "location approximate"). The program makes no network connection |
| Country | derived from location | A | Derived from the pin, shown and editable (walkthrough, 2026-10-21). Selects country profiles and grid defaults. Built-in list: EU-27, UK, Norway, Switzerland, Iceland (see ASSUMPTIONS) |
| Currency | by country (€, £, NOK, SEK, DKK, CHF, ISK) | D | Chosen per site from a fixed list (walkthrough, 2026-10-21). Exchange rates are fixed at each release (ECB reference rates, with their date), editable |
| Climate station | nearest ASHRAE design station to the pin | A | Walkthrough, 2026-10-21. The station's name and distance are shown, and every option carries the flag "design temperatures from [station], N km from the site". The PUE design conditions use the station's design temperatures (§9.3). Hourly weather comes from NOAA station records (raw hourly data, cleaned into a usable year by the app; how, and whether when each release is prepared or in the program, is research), or from an EPW file the engineer downloads and uploads (confidence A). ASHRAE data licence to check (§18) |
| Price base year | current year | D | All costs in real terms of this year |
| Analysis start (project start) date | today + 3 months | D | Anchors programme and time-to-power. Indicative — unverified: no source; replace with the client's programme start |

### 5.2 Site

Everything in this table except the site area belongs to the Site tab, a Beta feature (walkthrough, 2026-10-21; §2 principle 3, §10): hidden by default, turned on in the general settings, labelled Beta, and kept out of the ranking and the PDF export.

| Input | Default | Status | Notes |
|---|---|---|---|
| Site area (ha) | none | **R** | The site is one number in the main flow (walkthrough, 2026-10-21). Used for the IT estimate (§5.3) and for the land budget of ground solar and wind (method while the Site tab is off: OPEN-QUESTIONS 25) |
| Site boundary (Beta) | rectangle from the site area and an aspect ratio (default 1.5:1, indicative — unverified, no source) | D | Site tab only: draw a polygon or import GeoJSON/KML; a drawn or imported boundary sets the site area |
| Underlay | none | D | Optional image (PNG/JPG/PDF page) scaled by two reference points, or online map tiles if enabled |
| Boundary setback | 10 m | D | Uniform; per-edge override allowed. Indicative — unverified: no source; replace with the local planning requirement |
| Exclusion zones | none | D | Polygons with type: easement/wayleave, flood zone, ecology, tree protection, existing structure, other. Each type has a "hard / soft" property. Soft exclusions can be used by solar only (configurable) |
| Height limit | 25 m | D | Planning or aviation limit. Per-zone override allowed. Indicative — unverified: no source; replace with the planning or aviation limit for the site |
| Ground conditions | "assumed suitable" | D | Free-text note only; no geotechnical modelling |
| Grid POC location | nearest boundary point to the map's nearest road | D | Point; drives substation placement preference and cable-route length for cost |
| Gas main location | none (gas off-site unknown) | D | Point; drives gas-plant placement and connection cost |
| Site access points | one, mid-point of longest edge | D | Drives roads allowance and fuel-delivery placement |
| Noise-sensitive receptors | none | D | Points or polygons; used for distance-based noise flags only |
| Roads, parking, landscaping allowance | 15 % of net developable area | D | Reserved and not available for plant. Indicative — unverified: no source; replace with a project benchmark |
| Roof area for PV | blank (rule: 50 % of the free roof after roof plant) | D | m² of data-hall roof covered by PV; replaces the rule when entered. Owner, 2026-10-22 (OPEN-QUESTIONS 53); built 2026-10-22 |
| Ground area for PV | 0 ha | D | Ground covered by PV, car-park canopies included if wanted; above 0 adds C10 "Roof + ground". Owner, 2026-10-22 (OPEN-QUESTIONS 53, 54); built 2026-10-22 |
| Off-site land available for generation | none | D | Optional separate polygon (or area in ha) for solar/wind/BESS connected by private wire, with distance (km) |

Derived: gross site area, net developable area (gross − setbacks − hard exclusions − allowance), buildable envelope polygon (these three in the Beta Site tab), available roof area (from building).

### 5.3 Load and building

| Input | Default | Status | Notes |
|---|---|---|---|
| IT load at full build (MW) | estimated from the site area when not entered (walkthrough, 2026-10-21) | D | Any value 1–2,000 MW, or "Estimate from area": IT ≈ site area × site coverage 35 % × 1 storey × IT density 5.5 kW per m² of floor. Coverage and storeys are judgements. The density comes from one benchmark (STACK Erskine Park: 450 MW "operational capacity" on 82,020 m² of floor over three storeys, 7.7 ha), and it is not known whether that figure is IT or facility load (about 4 kW/m² if facility). All three are research items (§18). The estimate is flagged on every option, and the engineer can override the IT load independently of the area. This density disagrees with the building-massing rule below (whitespace density × gross-up) by a factor of three to eight: OPEN-QUESTIONS 26 |
| IT load uncertainty | ±20 % | D | Feeds Monte Carlo. Indicative — unverified: no source |
| Phasing | 1 phase, 100 % at grid full-connection date | D | Table of phases: IT MW added and target date. Up to 10 phases |
| Ramp within phase | 25 % of phase IT at energisation (owner, 2026-10-22, OPEN-QUESTIONS 51; was 50 %), linear to 100 % over 12 months | D | Judgement (the owner's), no source; replace with the client's fit-out programme |
| Average IT utilisation | 80 % of installed IT | D | Energy = utilisation × IT; sizing uses 100 %. Indicative — unverified: no source |
| Workload type | "Mixed cloud" | D | Cloud / AI training / AI inference / enterprise. Sets default density, utilisation profile and load-swing note. AI training adds a flag about fast load transients (not modelled) |
| Load shape | as built: a gentle daily cycle around the average utilisation above (swing ±1 % for AI training, ±8 % for enterprise, ±4 % otherwise, with small seeded noise) | D | Fully customisable (walkthrough, 2026-10-21): a flat % of IT, daily fluctuation profiles, an AI training profile or an AI inference profile. Selecting an AI profile shows its editable defaults (values to research) and the caveat that swings shorter than an hour (training steps, checkpoints) cannot be shown by the hourly model |
| Cooling approach | chosen by the engineer (walkthrough, 2026-10-21) | see notes | Air (chilled water + free cooling), evaporative/adiabatic, direct-to-chip liquid (DLC) with dry coolers, immersion. The engineer always chooses it; it is no longer an open choice that generates all four. The tool offers a typical PUE and maximum demand for each type, both editable. What applies before the engineer has chosen, and whether more than one type can be compared in one run, are open (OPEN-QUESTIONS 28) |
| Whitespace density (kW IT/m² whitespace) | by cooling: air 1.5, evaporative 1.8, DLC 4.0, immersion 3.0 | D | Indicative — unverified. With the gross-up below this is 0.7–1.8 kW IT per m² of floor, against 5.5 kW/m² in the IT estimate from area (OPEN-QUESTIONS 26) |
| Gross-up factor (GFA / whitespace) | 2.2 | D | Covers electrical rooms, UPS/battery rooms, mechanical, office, logistics. Indicative — unverified |
| Storeys | 2 | D | Range 1–6. Indicative — unverified: no source. The IT estimate from area assumes 1 storey (walkthrough, 2026-10-21); which rule stays is part of OPEN-QUESTIONS 26 |
| Storey height | 6.0 m | D | Indicative — unverified: no source |
| Roof plant zone height | 4.0 m | D | Counts toward the height-limit check. Indicative — unverified: no source |
| Building footprint override | none | D | Beta: the user can draw the building in the Site tab instead of letting the tool size it |
| Roof plant fraction | 40 % of roof area if heat rejection is on the roof | A | Reduces roof area available for PV. Indicative — unverified: no source; the tool should derive it from the heat-rejection footprint (§6.3) where that is larger |
| Facility load | IT × hourly PUE | A | |
| PUE model | Hourly, from ambient dry/wet-bulb temperature and cooling approach | A | §9.3. Annual PUE and peak PUE are shown. User can override with a flat annual PUE. The typical PUE and maximum demand offered for the chosen cooling type are editable (walkthrough, 2026-10-21) |
| Non-IT ancillary load (offices, lighting) | 2 % of IT | D | Indicative — unverified: no source |
| Demand flexibility | Off | D | Parameters (walkthrough, 2026-10-21): maximum curtailable % of IT, maximum hours a year, trigger (price, carbon, or weather and grid stress), trigger level, duration per event, notice time, recovery period, and cost of curtailment. A historical analysis shows how often each trigger occurs (price and carbon from ENTSO-E data; weather source to research). Values are judgements until researched |
| Battery response to triggers | the economic battery covers the historical trigger hours | D | Walkthrough, 2026-10-21. Batteries can run the site during trigger hours instead of curtailing. By default the tool sizes the economic battery (§5.5, §9.2) to cover the historical trigger hours; the engineer can change it. Battery size and trigger threshold trade off, so the engineer chooses which is held fixed: the battery size, the trigger threshold, or a target number of hours covered. Battery capex flows into the economics |

### 5.4 Utilities and grid

| Input | Default | Status | Notes |
|---|---|---|---|
| Grid import capacity now (MW) | country default when "Not known" (walkthrough, 2026-10-21) | D | 0 allowed (no grid at start). "Not known" uses the country value, labelled indicative and flagged on every option with its source. Country values to research (§18) |
| Grid import capacity at full connection (MW) | country default when "Not known" (walkthrough, 2026-10-21) | D | As above |
| Full-connection date | country default connection time when "Not known" (walkthrough, 2026-10-21) | D | As above. The bridging period (time until the grid arrives) can therefore be known or not known; both are supported |
| Intermediate capacity steps | none | D | Table of (date, MW). Overrides the two-point profile |
| Grid date uncertainty | −6 / +24 months | D | Asymmetric by default: delays are more likely than advances. Feeds Monte Carlo and time-to-power ranges. Indicative — unverified: no source; a judgement default that strongly drives time-to-power, so the header strip counts it as a C-tagged driver whenever it affects the leader (OPEN-QUESTIONS 15) |
| Grid export capacity (MW) | 0 | D | Enables export of surplus on-site generation (revenue at hourly price × export factor) |
| Connection voltage | by capacity: < 20 MW → 11/20/33 kV; 20–150 MW → 110–150 kV; > 150 MW → 220–400 kV | A | Drives substation type, footprint, cost. The 20 MW and 150 MW band edges are indicative — unverified, no source; replace with the local DSO/TSO connection practice |
| Substation type | AIS | D | AIS / GIS. Open choice in §8 |
| Grid connection capex / reinforcement charge (the grid connection charge) | **0** (walkthrough, 2026-10-21) | D | One amount, the same for every option whatever grid capacity the option contracts (walkthrough, 2026-10-21). The country's typical value is shown next to the input with its reference (for example a transmission operator's published construction-cost contribution per kW), and the engineer can override it. Every option that uses the default 0 is flagged "assumed". Country values to research (§18). Whether the amount is entered as a lump sum or per kW of the offer, and whether an islanded option that contracts 0 MW pays it, are open (OPEN-QUESTIONS 20). Owner, 2026-10-22 (OPEN-QUESTIONS 50, not built yet): the default stays 0; next to the field the tool shows the expected cost (the country's standard rate per MW × the option's contracted capacity) with a button to copy it into the field. As built: an indicative per-MW value by voltage band on the offered capacity at full connection, plus the cable route from the POC |
| Contracted grid capacity (per option) | the full offer in each period (as built) | D | Each option has its own contracted grid capacity, set by the engineer (walkthrough, 2026-10-21), so an option can contract less than the offer (for example a bridging option that contracts 80 MW of a 120 MW offer). It is the option's import limit in dispatch (§9.2, §9.4). How the engineer sets it for options that only exist after generation is open (OPEN-QUESTIONS 19) |
| Grid import price | country hourly profile | D | Hourly prices from ENTSO-E, prepared at each release, with Ember, the World Bank and Eurostat as published alternatives (walkthrough, 2026-10-21); as built, synthetic profiles calibrated to indicative annual figures. Wholesale plus non-commodity uplift (network, levies) as an editable €/MWh adder, default by country. Indicative — unverified: no profile year stated; source to verify against is the §18 grid price row (ENTSO-E Transparency Platform, national regulators). The builder fills the profile year and source record |
| Grid carbon intensity | country hourly profile (location-based) | D | Indicative — unverified: no profile year stated; source to verify against is the §18 grid carbon row (Ember, ENTSO-E, EEA). The builder fills the profile year and source record |
| Grid decarbonisation trajectory | country default to 2050 | D | Annual multiplier on the hourly carbon profile |
| Gas available | "Unknown" | D | Yes / No / Unknown. "Unknown" generates gas options with a "gas connection unconfirmed" flag |
| Gas capacity (MWth) and date | unlimited, from project start + 18 months | D | Indicative — unverified: no source. While left at default, every gas-using option carries the info flag "gas capacity and date assumed, not confirmed" |
| Gas commodity price | latest published wholesale price, with its date (walkthrough, 2026-10-21) | D | From a free monthly source (to research, §18), plus the transport adder; the engineer can override it with a current quote. As built: a TTF-based country default. Indicative — unverified until the source record is filled |
| Hydrogen availability | No | D | If Yes: price and date. While No, hydrogen options are still generated where an archetype or open choice includes them, and carry the flag "hydrogen supply unavailable at current inputs" (§7.3, §15) |
| Water available (m³/day) | Unknown | D | Used for the WUE flag on evaporative options |
| District heating offtake nearby | No | D | If Yes: offtake price, max MWth, distance, supply temperature |

### 5.5 Requirements (flagged, never enforced)

| Input | Default | Status | Notes |
|---|---|---|---|
| Resilience requirement | Backed critical load 100 % of IT + essential mechanical; backup topology N+1; on-site autonomy 48 h at full load | D | Default kept: N+1 with 100 % of IT backed (walkthrough, 2026-10-21). Autonomy can come from on-site fuel and generation, from batteries, or a combination; the engineer chooses. §9.7. Choices: backed-load %, topology (N, N+1, 2N, distributed-redundant / catcher), autonomy hours, islanding (yes/no), optional Uptime-style tier label (label only, not certification; it does not change sizing). Indicative — unverified: no source; a common practitioner starting point, to be replaced by the client's stated requirement |
| UPS ride-through (the resilience reserve battery) | 5 min at full IT | D | Batteries are split into two allocations (walkthrough, 2026-10-21): a **resilience reserve**, always kept and never used for economic duties, and an **economic battery** for flexibility, arbitrage and carbon (§5.3, §9.2). Longer battery autonomy can be chosen site-wide. Indicative — unverified: no source |
| Backup gensets | included by default (walkthrough, 2026-10-21) | D | Test running **6 h a year per generator** (replaces 12 h) at a **test load of 75 %**, a separate editable input. Gensets can also run as primary power for a set number of hours a year, dispatched and costed (§9.4). Default 0 h, which is what the built program does: there is no input for it yet, and backup gensets never run in normal dispatch. Indicative — unverified: about 6 h a year matches monthly 30-minute exercise runs; source to verify against: NFPA 110 |
| Carbon target | None | D | One of: annual average gCO₂/kWh cap; % renewable (annual matched); % hourly carbon-free energy (24/7 CFE); net-zero year. Flag only: an option that misses it gets a "carbon target not met" flag (§15) |
| Time-to-power target | First IT MW at phase 1 date; full load at final phase date | D | Flag only: an option that misses it gets a "time-to-power target missed by N months" flag (§15) |
| Capex ceiling | None | D | Flag only, never a filter or exclusion. Minor flag if capex P50 > ceiling; info flag if only capex P90 > ceiling (§15). The user may filter on it in their own view (§11) |
| Land-take ceiling (Beta: Site tab only) | Net developable area | A | Flag only. Compared with on-site land take (off-site land excluded). At the default it coincides with the "Does not fit" site-fit status; a lower user value raises a minor flag "land take above ceiling" (§15) without changing the site-fit status |
| Permitting thresholds | EU IED and MCPD thresholds for every country in the built-in list; no national variation built in (ASSUMPTIONS D4) | D | Aggregated combustion thermal input ≥ 50 MWth → IED flag; individual units 1–50 MWth → medium combustion plant flag. Editable per project. For non-EU countries (UK, Norway, Switzerland, Iceland) the flag text says "EU threshold used as a proxy; national equivalent not checked by this tool". Indicative — unverified (source pending). Source to verify against: Directive 2010/75/EU (IED) and Directive (EU) 2015/2193 (MCPD). No consolidated-text date is given here: the builder records the consolidated version date checked in the §18 `year` field and confirms whether later amendments (the IED was revised in 2024) change either threshold |
| Hazardous substance storage thresholds | Hydrogen 5 t stored on site; diesel/HVO 2,500 t stored on site | D | Quantity at or above the threshold → "hazardous substance storage above threshold" flag (§15); hydrogen options also always carry the hydrogen flag in §6.3. Editable per project. Indicative — unverified (source pending). Source to verify against: Directive 2012/18/EU (Seveso III), Annex I, lower-tier qualifying quantities for hydrogen and for petroleum products and alternative fuels; the builder confirms the current text, records its date, and confirms whether HVO falls in the petroleum products and alternative fuels entry. Same proxy note for non-EU countries as the row above |
| Max annual run-hours for on-site combustion | None | D | Optional; e.g. for a medium-combustion-plant permit limit. Flag only by default (§9.4) |

### 5.6 Economics

| Input | Default | Status | Notes |
|---|---|---|---|
| Evaluation periods | 20 years (as built); several at once, for example 10, 15 and 20 years (walkthrough, 2026-10-21) | D | Results are shown for each period. Which period sets the score is open (OPEN-QUESTIONS 21). Indicative — unverified: no source |
| WACC (real) | 7 % | D | Range 4–12 %. Kept by the walkthrough of 2026-10-21 and labelled judgement until researched; shown on screen as "the blended return investors require, used as the discount rate". Indicative — unverified: no source and no year; replace with the client's hurdle rate |
| Carbon price | latest EU ETS market price, with its date (walkthrough, 2026-10-21) | D | Source to research (§18). As built: an EU ETS / UK ETS forward default by country, escalating. Applied to Scope 1 combustion. Optional shadow carbon price on Scope 2 (off by default; when on, it is shown as a separate cost line and can be excluded from the Cost axis). Indicative — unverified: no year or forward-curve date stated; source to verify against is the §18 carbon price row (EU ETS / UK ETS exchange data, official projections). The builder fills the year and source record |
| Escalation (real) for electricity, gas, carbon | a published forecast per commodity, overridable (walkthrough, 2026-10-21) | D | Sources to research (§18). Forward curves to their published horizon, then flat in real terms. High/central/low scenario sets (kept from v1). Indicative — unverified until the builder fills the source records; no source is named here |
| Revenue toggles | Off | D | BESS arbitrage/grid services; heat offtake (waste-heat reuse); export. Kept from v1; off by default confirmed (walkthrough, 2026-10-21) |
| Capex estimate class | AACE Class 5 (concept): −30 % / +50 % | D | Default uncertainty band applied to all capex not otherwise ranged (§13). Source to verify against: AACE International Recommended Practice 18R-97 (builder to confirm the current revision and year). That practice gives a range of ranges for Class 5; −30 % / +50 % is a point chosen within it, indicative — unverified |
| Cooling capex delta | per cooling approach, €/kW IT relative to air baseline | D | Indicative — unverified. Only the difference between cooling approaches is costed (§9.5) |
| Contingency | 10 % on capex | D | Shown separately. Indicative — unverified: no source |

Battery capex for both battery allocations, and for the battery response to flexibility triggers, flows into the ledger (walkthrough, 2026-10-21).

### 5.7 Priorities

Four weight sliders with presets. **Weight definition (the only one in this brief):** each slider holds a raw value 0–100. The effective weight is w_i = raw_i / Σ raw, so the effective weights always sum to 1 (shown as %). If all raw values are 0, equal weights (25 % each) are used and a notice says so. The weighted score is defined once, in §11.

| Axis | Default weight |
|---|---|
| Cost | 35 % |
| Carbon | 25 % |
| Time-to-power | 25 % |
| Deliverability (maturity, permitting, fuel and supply-chain risk; site fit excluded unless the optional site-fit penalty is switched on, §9.9) | 15 % |

Presets: Balanced (above), Lowest cost (70/10/10/10), Lowest carbon (20/60/10/10), Speed to market (20/10/60/10), Lowest risk (25/15/20/40). The default weights and all presets are indicative — unverified: they are a first-cut judgement with no source, and the methodology export says so. The default weights are provisionally accepted (walkthrough, 2026-10-21), and the effect of each weight change is described in words as it happens.

Resilience and site fit are **not** weighted. They are requirement checks with status badges, and either can be used as a user view filter (§11). By default site fit has no effect on the weighted score; the only way it can enter the score is the optional site-fit penalty in §9.9 (off by default). With the Site tab as Beta, kept out of the ranking (walkthrough, 2026-10-21), site fit plays no part in the ranking.

---

## 6. Technology library

Each technology is a record with the parameters below. All are editable per project. Cost and performance parameters keep the v1 set and add spatial and programme parameters.

### 6.1 Parameters per technology

| Group | Parameters |
|---|---|
| Identity | id, name, role (firm / intermittent / storage / backup / contractual / grid / heat), maturity (Commercial / Emerging / Nascent) with risk note, colour token |
| Cost | capex (€/kW or €/kWh), fixed O&M (€/MW/yr), variable O&M (€/MWh), fuel cost link, replacement interval and cost fraction, asset life, decommissioning (% capex) |
| Performance | efficiency or heat rate, min stable load %, ramp (screening ignores ramp), availability %, degradation %/yr, round-trip efficiency (storage), capacity factor (renewables, from profile), carbon intensity of fuel (Scope 1), water use |
| Unit | standard unit size (MW or MWh per unit), min and max units, stackable (yes/no, max tiers) |
| **Spatial** | footprint basis (m² per MW, m² per MWh, m² per unit, or ha per MWp), length:width ratio per block, block height, stack/flue height, clearance around block (m), separation rules to other block types and to the boundary (m), placement zone (ground / roof / off-site / in-building), can share land with (e.g. solar over BESS: no) |
| **Programme** | planning/permitting duration (months), procurement lead time (months), construction duration (months), earliest availability date |
| **Permitting** | combustion thermal input per MW (for threshold flags), noise sound power level (dB(A) per unit, indicative), hazardous substance flag, aviation flag (tall structures) |
| Sources | each value stored as `{ value, unit, low, high, source, year, url, confidence, verified }` (§18) |

### 6.2 Built-in technology set

| Technology | Role | Maturity | Placement | Notes |
|---|---|---|---|---|
| Grid import (via on-site substation) | Grid | Commercial | Ground near POC | Capacity per date profile |
| Offsite PPA (solar, wind, baseload) | Contractual | Commercial | None | Flows over the grid connection and uses import capacity (v1 fix kept). Cannot cover bridging if the grid is constrained |
| Solar PV ground-mount | Intermittent | Commercial | Ground / soft exclusions / off-site | Fills residual land after other blocks |
| Solar PV rooftop | Intermittent | Commercial | Roof | Limited by roof area minus roof plant |
| Solar PV carport | Intermittent | Commercial | Over parking allowance | Optional |
| Wind onshore | Intermittent | Commercial | Ground / off-site | Topple and noise separation usually flag on campus sites |
| BESS (Li-ion, containerised) | Storage | Commercial | Ground / off-site | Roles: shifting, peak-shave, bridging support, grid services, UPS augmentation (flagged) |
| Gas reciprocating engines | Firm | Commercial | Ground | Prime, bridging or backup duty |
| Gas turbines (OCGT / aeroderivative) | Firm | Commercial | Ground | |
| Gas CHP / trigeneration (with absorption chillers) | Firm + heat | Commercial | Ground | Heat used for cooling or offtake |
| Diesel / HVO standby gensets | Backup | Commercial | Ground, adjacent to building | Resilience and test runs (6 h a year each at 75 % load), plus primary-power hours if the engineer sets them (walkthrough, 2026-10-21). Fuel choice: diesel or HVO |
| Gas standby gensets | Backup | Commercial | Ground | Depends on gas supply security; flagged |
| Bulk fuel storage | Backup support | Commercial | Ground | Sized from autonomy hours |
| Fuel cells (SOFC, natural gas / biogas) | Firm | Emerging | Ground | |
| Hydrogen gensets / fuel cells | Firm / backup | Nascent | Ground | Large separation distances; hazardous-substance flag |
| Small modular reactor | Firm baseload | Nascent | Off-site or adjacent site | Not placed within a typical campus boundary by default; earliest availability default 2035, indicative — unverified |
| Heat reuse plant (heat exchangers + heat pumps) | Heat | Commercial | Ground / in building | Needs offtake |
| Heat rejection (dry / adiabatic coolers, chillers) | Cooling plant | Commercial | Roof or ground (open choice) | Footprint from heat rejected; affects roof PV and site fit |
| UPS + batteries | Resilience | Commercial | In building | Inside the gross-up factor; not placed separately. The resilience reserve battery (walkthrough, 2026-10-21), §5.5 |

### 6.3 Indicative spatial defaults (all indicative — unverified)

The builder must verify each against the named source type and record source, year and range. Until verified, the UI shows the "indicative — unverified" label.

| Block | Footprint basis (default, range) | Height | Clearance / separation defaults | Source to verify against |
|---|---|---|---|---|
| Data hall building | GFA from §5.3; footprint = GFA / storeys | storeys × storey height + roof zone | Boundary setback | Project benchmarks; industry density benchmarks |
| Substation 11–33 kV (switchroom + transformers) | 500 m² per 20 MVA (300–800) | 6 m | 5 m to other blocks | Utility / DNO standards, vendor data |
| Substation 110–150 kV | AIS 1.2 ha (0.8–2.0); GIS 0.4 ha (0.25–0.6) | AIS 12 m; GIS 15 m (building) | 10 m; preferred within 50 m of POC | TSO/DSO design standards |
| Substation 220–400 kV | AIS 4.0 ha (2.5–6.0); GIS 1.2 ha (0.8–2.0) | AIS 15 m; GIS 18 m | 10 m | TSO design standards |
| Diesel/HVO genset (containerised, 2.5–3.0 MWe) | 100 m² per unit incl. maintenance access (70–140) | 7 m incl. flue stub; stack height parameter 10 m | 3 m between units; adjacent to building (≤ 30 m) | Manufacturer datasheets |
| Genset stacking (double-deck) | halves footprint per unit | 12 m | as above | Manufacturer / project precedent |
| Bulk fuel storage (bunded) | 0.15 m² per m³ stored (0.10–0.25) | 7 m | 6 m to building, 10 m to boundary | Fuel storage regulations by country; fire engineer |
| Diesel consumption for autonomy sizing | 0.26 L/kWh at full load (0.24–0.28) | — | — | Manufacturer datasheets |
| BESS (Li-ion, containerised incl. PCS/MV) | 50 m² per MWh (30–90) | 3.5 m | 10 m to occupied buildings, 3 m between units unless test data supports less | NFPA 855 (current edition), FM Global DS 5-33, vendor UL 9540A data |
| Gas recip engine plant (incl. aux) | 200 m² per MWe (120–300) | 12 m hall; stack 25 m | 15 m to boundary | Danish Energy Agency Technology Catalogue; vendor data |
| Gas turbine plant | 120 m² per MWe (80–200) | 15 m; stack 30 m | 15 m to boundary | Danish Energy Agency Technology Catalogue; vendor data |
| CHP / trigeneration addition | +40 % on engine footprint for heat recovery and absorption chillers | 12 m | — | Vendor data |
| SOFC fuel cells | 120 m² per MW (60–200) | 4 m | 5 m | Vendor data |
| Hydrogen storage + gensets | 300 m² per MW + storage; separation 25 m (indicative) | 6 m | Hazardous-area separation; flag always | National hazardous-substance regulation; specialist input |
| Solar PV ground-mount | 1.2 ha per MWp (0.8–1.8) | 3 m | 5 m to other blocks | NREL land-use study (Ong et al., 2013) plus recent European project data |
| Solar PV rooftop | 5.5 m² per kWp of usable roof (4.5–7.0); usable fraction 50 % of free roof | +1 m | 1.5 m roof-edge setback | Vendor data, fire-access guidance |
| Wind onshore | 0.1 ha pad per turbine; tip height 180 m; topple buffer 1.5 × tip height; noise buffer 500 m to receptors | tip height | buffers above | National planning guidance |
| Heat rejection (ground) | 60 m² per MW rejected (40–100) | 4 m | 3 m; airflow clearance | Vendor data |
| Heat reuse plant | 30 m² per MWth (20–50) | 6 m | — | Vendor data |
| SMR (if placed on site) | 3 ha per ~300 MWe unit (indicative) | 40 m | Emergency planning zone not modelled; flag always | Vendor and regulator publications |

---

## 7. Option definition and generation

### 7.1 What an option is

An option is a complete, sized, placed energy strategy for the full build and every phase. It is defined by:

1. **A choice vector:** one value for each design choice in §8 (e.g. bridging = "gas recips", backup = "HVO gensets N+1", cooling = "DLC", solar = "fill residual land").
2. **A sizing vector:** installed capacity of each technology (MW / MWh / units) per phase, produced by the sizing rules in §9.2 from the choice vector, the load and the requirements. The user may override any size on a pinned option, which turns it into a "custom" option.
3. **A layout:** placed blocks on the site (§10), auto-generated and optionally edited by hand.
4. **Results:** screening results (always), 8760 verification results (when run), uncertainty results (when run).

Each option gets a short human-readable name built from its choices (e.g. "Grid + gas bridge → HVO N+1 · DLC · PV 4 MW · BESS 2 h"), a stable ID (hash of choice + sizing vectors), and an archetype tag (§7.3).

### 7.2 Generation

1. **Enumerate** the Cartesian product of all *open* choices (§8). Locked choices contribute one value each.
2. **Apply compatibility rules** to remove logically impossible combinations (the stated exception in §2 principle 5). These are combinations that cannot be built or described, not merely unattractive or constrained ones. Built-in rules: (a) CHP heat to absorption chillers requires a gas option; (b) heat offtake requires a district-heating input; (c) "BESS as bridging" requires a non-zero BESS size; (d) choices that are n/a for an option (e.g. C2 when C1 = wait) collapse to "n/a" rather than multiplying options. Every rule is shown by name in the run summary (§12) with the number of combinations it removed ("Compatibility rules: 412 impossible combinations not generated — view rules"); the methodology export lists the rules. Possible combinations that breach a constraint or depend on an unconfirmed input, such as gas options where gas availability is unknown or hydrogen options where hydrogen availability is No, are always kept and flagged.
3. **Size** each surviving combination with the sizing rules (§9.2). Where a choice has sizing variants (e.g. BESS duration 0 / 1 / 2 / 4 h; solar = none / roof only / roof + fill residual / fixed MWp), each variant is a separate option.
4. **Cap (visible, reversible run setting).** Default open choices give 200–600 options, so the cap (default 2,000; indicative — unverified (run setting)) is only reached when the user opens extra choices or adds numeric sweeps. Before generation, the Choices panel shows the projected count and, if it exceeds the cap, a setting **"Sample above cap: On / Off"** (default On; indicative — unverified (judgement)) with the estimated screening time for each (from the §17 rates). With sampling on, the tool keeps every archetype baseline, every custom and pinned option, then uses seeded Latin hypercube sampling over the remaining choice space, and shows a persistent notice with the real counts, e.g. "2,000 of 5,184 combinations screened (sampling on). Screen all · Lock a choice to narrow the space." With sampling off, every combination is screened (progressive results; §17 targets do not apply above 2,000). Unscreened combinations are never deleted: switching sampling off, or raising the cap, screens them. The setting and the counts are listed in exports.
5. **Screen** every option with the screening model (§9.1) and lay it out (§10).
6. **Dominance marking (no automatic hiding):** mark options that are Pareto-dominated on (cost P50, carbon P50, time-to-power P50, deliverability) **and** have no better site-fit or resilience status. Dominated options get a "Dominated by [option name]" badge and stay in every view by default. The user can switch on the view setting **"Hide dominated options"** (default **off**; indicative — unverified (judgement)). When on, a counter shows "312 dominated options hidden — show", the setting is listed in the header strip and exports, and switching it off restores them. Custom and pinned options are never hidden by this setting. The default (off) is logged as OPEN-QUESTIONS 17.
7. **Rank** all screened options (§11). Dominated options are ranked like any other.

Default open choices on a new project give about 200–600 options. Targets are in §17.

### 7.3 Archetypes (kept from v1 presets, extended)

Each archetype is a pre-set choice vector that is always generated as a reference, even when sampling:

1. Grid-only (wait for grid; no bridging)
2. Grid + offsite PPA
3. Grid + on-site solar + BESS
4. Grid + gas CHP/trigeneration + BESS hybrid
5. Gas bridging to grid (temporary recips, then standby or removal)
6. Islanded gas + solar + BESS (no or late grid)
7. Renewables-led (max on-site renewables + BESS + PPA, grid as balance)
8. Fuel cells + grid
9. Low-carbon backup (HVO gensets or BESS-augmented UPS) + grid + PPA
10. Nascent firm, generated in two variants (SMR; hydrogen), shown with the Nascent badge and its programme date

Archetypes use the engineer's cooling type (walkthrough, 2026-10-21). Known issue: as built, an archetype takes the first open value of every choice it does not specify, which with the defaults makes most archetypes air-cooled with roof heat rejection (`../docs/KNOWN-ISSUES.md`, item 4).

Archetypes are generated whatever the default state of the choices they use. Archetype 10 therefore appears even though C4's default subset omits SMR and hydrogen, and with hydrogen availability at its default (No, §5.4) the hydrogen variant carries the flag "hydrogen supply unavailable at current inputs" (§15). It is never removed for that reason.

### 7.4 Custom options

The user can create an option by:
- duplicating any option and editing choices or sizes, or
- building from blank in the "Option builder" (choice selectors plus size fields).

Custom options are always shown, are never hidden by the "Hide dominated options" setting, and are marked "Custom".

---

## 8. Optioneering choices

These are the decisions a designer makes at concept stage. Each is a **choice** with a set of alternatives. Each choice can be:
- **Open:** all alternatives (or a user-selected subset) are generated.
- **Locked:** one alternative is used for all options.
- **Excluded alternatives:** some alternatives are removed from generation, e.g. "no diesel".

Exposure in the UI: a "Choices" panel in step 6 lists every choice as a row with a segmented control or multi-select chips, a lock icon, and a count of how many options each alternative produces. Hovering an alternative shows its effect on the current ranking: best rank achieved, median score. After generation, each choice row shows a small "choice impact" bar: the spread of weighted score attributable to that choice, computed by main-effects analysis across the option set. This tells the designer which decisions matter most.

| # | Choice | Alternatives | Default state | What it drives |
|---|---|---|---|---|
| C1 | **Grid strategy** | Wait for grid (phase energisation follows grid capacity) / Bridge until grid / Islanded (on-site supply serves normal load; the offered grid capacity is the backup connection and is not dispatched in normal hours; a site with no grid at all is modelled by entering 0 MW grid capacity, §5.4) / Grid + export | Open (first three) | Time-to-power, bridging plant, cost, carbon |
| C2 | **Bridging supply** (only if C1 = bridge or islanded) | Gas recips / Gas turbines / Fuel cells / HVO-diesel prime (flagged) / BESS + solar only / Rented temporary generation | Open (gas recips, fuel cells, rented). Owner, 2026-10-22 (OPEN-QUESTIONS 43): every technology that can generate on site is considered for bridging, including gas turbines; not built yet | Bridging cost, carbon, permitting, time-to-power |
| C3 | **Bridging plant after grid arrives** | Remove / Retain as backup / Retain as prime (hybrid) / Retain for grid services | Open | Capex reuse, resilience, carbon |
| C4 | **Primary firm on-site generation** (long-term) | None / Gas CHP-trigen / Gas recips / Fuel cells / SMR (Nascent) / Hydrogen (Nascent) | Open (None, CHP, fuel cells) | Cost, carbon, footprint, permitting |
| C5 | **Backup power technology** | Diesel gensets / HVO gensets / Gas gensets / BESS-augmented UPS + reduced gensets (flagged: emerging approach) / Retained bridging plant / None (flagged) | Open (HVO, diesel, retained bridging) | Resilience check, footprint, permitting, Scope 1 carbon on test runs |
| C6 | **Backup topology** | N / N+1 / 2N / Distributed-redundant (catcher) | Locked to the resilience requirement; can be opened | Unit count, footprint, cost |
| C7 | **Autonomy / fuel storage** | 12 / 24 / 48 / 72 h ("belly tanks only" removed, owner 2026-10-22, OPEN-QUESTIONS 52; built 2026-10-22, branch `feature/solar-areas`) | Locked to the resilience requirement | Fuel storage footprint, cost |
| C8 | **Cooling approach** | Air (chilled water + free cooling) / Evaporative-adiabatic / DLC + dry coolers / Immersion | Locked to the engineer's cooling type (walkthrough, 2026-10-21); comparing several types in one run is open (OPEN-QUESTIONS 28). Before revision 5: open if the user left it open in §5.3 | PUE (hourly), WUE, building footprint (density), heat-reuse temperature, cooling capex delta |
| C9 | **Heat rejection location** | Roof / Ground / Split | Open | Roof PV area, ground footprint, building height |
| C10 | **On-site solar** | None / Roof only / Roof + ground. Owner, 2026-10-22 (OPEN-QUESTIONS 52–54; built 2026-10-22, branch `feature/solar-areas`): carport, fill residual and fixed MWp removed; solar sized from two site inputs, roof area for PV (`site.pvRoofM2`, blank = the 50 % usable rule) and ground area for PV (`site.pvGroundHa`, default 0) | Open (none, roof); Roof + ground added when the ground area for PV is above 0 (rule f) | Carbon, cost, land take |
| C11 | **On-site wind** | None / Fit as many as separations allow / Off-site land | Default "None" when site area ≤ 20 ha and no off-site land is given; otherwise open. This is a visible default the user can change on any site, not a lock. When it applies, the info flag "Wind not generated by default: site ≤ 20 ha (threshold editable). Wind options are available through C11." is shown on the C11 row of the Choices panel and in the run summary's "values not generated" note above the options list (§12), each with an "Include wind" control that opens C11 and regenerates. The 20 ha threshold is indicative — unverified, no source | Carbon, flags |
| C12 | **BESS role and size** | None / 1 h / 2 h / 4 h at a power rating of 25 % / 50 % of facility peak; role: shifting, peak-shave against grid cap, bridging support, grid services | Open (none, 2 h at 25 %, 4 h at 50 %), each with role "peak-shave against grid cap". The durations, the 25 % / 50 % ratings, the default subset and the default role are indicative — unverified (judgement). Batteries are split into a resilience reserve (always kept, §5.5) and an economic battery (walkthrough, 2026-10-21); how C12 maps to the economic battery, and whether its sizes are still generated when the battery is sized to the trigger hours (§5.3), is open (OPEN-QUESTIONS 33) | Grid-cap compliance, cost, carbon, revenue |
| C13 | **Offsite PPA** | None / Annual-matched solar / Annual-matched wind / Hybrid / Baseload-shaped / 24/7-matched | Open (none, hybrid). Owner, 2026-10-22 (OPEN-QUESTIONS 49; not built yet): off unless the engineer ticks it; without a PPA options use the national grid's standard price and carbon | Market-based carbon, CFE %, cost. A PPA that cannot be delivered (no grid, islanded) is flagged and the equivalent no-PPA option is preferred (O1, walkthrough, 2026-10-21; §11, §15) |
| C14 | **PPA coverage** | 50 / 80 / 100 % of annual consumption | Open with C13. Owner, 2026-10-22 (OPEN-QUESTIONS 49; not built yet): set by the engineer, not generated | As above |
| C15 | **Heat reuse** | None / Heat offtake (low-grade, direct) / Heat pump boost to network temperature | Locked "None" unless district heating = Yes | Revenue, carbon credit (reported separately, not netted), footprint |
| C16 | **Demand flexibility** | Off / On (per §5.3 settings) | Locked Off; when on, the trigger parameters and battery response in §5.3 apply (walkthrough, 2026-10-21) | Grid-cap compliance, cost |
| C17 | **Substation type** | AIS / GIS | AIS (GIS not generated by default). Never opens automatically. When any screened option is "Does not fit", the C17 entry in the run summary's "values not generated" note adds "N options do not fit; GIS reduces substation footprint" next to its "Include" control | Footprint, cost |
| C18 | **Genset arrangement** | Single-deck / Double-deck / In-building plant room | Single-deck (double-deck and in-building not generated by default). Never opens automatically; same "does not fit" note and "Include" control as C17 | Footprint, height, cost |
| C19 | **Phasing of energy plant** | Build all energy plant at phase 1 / Build per phase | Locked "per phase" | Capex timing, NPV |
| C20 | **Fuel decarbonisation pathway** | None / Switch gas to biomethane or H₂ blend in year X / Diesel → HVO in year X | Locked None | Carbon trajectory, fuel cost |

Rules:
- A choice that is irrelevant to an option is shown as "n/a" for that option, e.g. C2 when C1 = wait.
- The user can add a choice value as a numeric sweep, e.g. "solar fixed MWp = 2, 4, 6, 8", which multiplies options.
- The panel shows the projected option count before generation and warns above the cap.
- **Default states are judgement choices.** Every "Default state" in the table above (which alternatives are open, the default subset, and the locked value) is indicative — unverified (judgement) under the §23 label rule, and the Choices panel shows the label on each row left at its default.
- **No automatic change of the option set.** No choice opens, closes or changes its subset by itself in response to results (site fit, flags or ranking). Only the user changes choice states; the tool may only add a note next to an "Include" control.
- **Site tab off (the default, walkthrough, 2026-10-21).** No site-fit status appears in the main flow, so the C17 and C18 "N options do not fit" notes appear only when the Site tab is on.
- **Values not generated.** Any choice whose default state omits alternatives (an open choice with a default subset, e.g. C2, C4, C5, C10, C12, C13; a single default value, e.g. C17, C18; a locked choice, e.g. C6, C7, C15, C16, C19, C20; or the C11 wind default) is listed in a "values not generated" note in the run summary (§12), naming each choice and its omitted values, e.g. "C4 Primary firm generation: Gas recips, SMR, Hydrogen not generated (default subset) — Include". Each entry has an "Include" control that adds the values and regenerates, with the projected count shown first. Values the user removes themselves are listed the same way, marked "excluded by user". The note is in every export. Archetype baselines (§7.3) are generated regardless and are not affected by this list.

---

## 9. Engine

### 9.1 Two-tier model

| | Screening model (default, all options) | Verification model (shortlist) |
|---|---|---|
| Time base | **Representative days**: 12 clustered typical days (k-medoids on joint normalised temperature, solar, wind, grid price, grid carbon per country), each with a weight in days per year, plus 1 peak-temperature design day (weight 0, used for sizing and PUE peak) and 1 low-renewable 7-day window (weight from frequency, used for storage and autonomy checks). Total about 480 hours | Full 8760 hours for the analysed year, per phase year where load differs |
| Storage | Daily cycling within each representative day; the 7-day window carries SOC | Full chronological SOC |
| Years | Year 1 of each phase plus steady state, extended by escalation | Same, from the 8760 year |
| Purpose | Generate, rank, sensitivity, Monte Carlo | Confirm the shortlist and check energy balance, SOC limits, run-hours and grid-cap breaches |
| Accuracy target | Within ±5 % of verification on LCOE and annual carbon, and identical on resilience and site-fit status, for every archetype on the reference test set (§21) | Energy conserved each hour (0.00 % balance error) |

Representative days and weights are pre-computed offline per country and shipped as data. When a user uploads custom hourly profiles, the tool clusters them in a worker (≤ 3 s target).

Every result card shows a badge: **Screening** or **Verified (8760)**, plus the deviation between the two when both exist. If the deviation is above 5 % on any headline metric, the option gets a flag: "Screening and full-year results differ by more than 5 %; the verified figures are the full-year result." The 5 % threshold is indicative — unverified (judgement) and editable in advanced settings.

The representative-day set (12 clusters, 1 design day, 1 seven-day window) is indicative — unverified (run setting), chosen for the §17 timing and the ±5 % accuracy target (ASSUMPTIONS M1); the cluster count is editable in advanced settings for user-uploaded profiles (built-in profiles ship pre-clustered at 12).

Verification runs automatically in the background for the top 10 ranked options after each settled input change (1 s idle) and on demand for any pinned option. The top-10 count and 1 s idle are indicative — unverified (run setting); both are editable in advanced settings.

**Walkthrough, 2026-10-21.** The two-tier model is confirmed: the screening run uses representative days for every option, the top options are verified with the full 8760-hour model, and dispatch views of any period of the year are offered only for verified options (§12.13). As built, every option runs the full 8760-hour model (15–20 s for 2,000 options on the owner's machine), so the screening tier is still to build. The representative-day method and the number of options verified are open (OPEN-QUESTIONS 23), and run speed is a research item.

### 9.2 Sizing rules (from choices to MW)

Sizing is rule-based and transparent. Each rule is shown in the option's "Sizing" panel as a sentence with the numbers, e.g. "HVO gensets: 72.4 MW critical load ÷ 2.75 MW per unit = 26.3 → 27 units; 27 units form 3 blocks (block size 10); N+1 adds 1 per block = +3; total 30 units".

- **Design facility load** = IT installed × peak PUE (design day) + ancillary.
- **Critical load for backup** = backed-load % × (IT + mechanical load needed to cool it at design conditions).
- **Backup units:** N = ceil(critical load / unit rating). Blocks B = ceil(N / block size), block size default 10 units (indicative — unverified: no source). Redundancy: N+1 adds 1 unit per block (total N + B); 2N doubles (total 2N); catcher adds 1 unit per `n` blocks (total N + ceil(B / n), `n` default 4, indicative — unverified). Setting block size ≥ N gives the classic single-block N+1 (total N + 1).
- **Fuel storage** = critical load × autonomy hours × specific consumption, minus belly-tank volume.
- **Bridging plant after the grid arrives** (owner, 2026-10-22; OPEN-QUESTIONS 42, 47, 48; package 3b, not built): two alternatives are generated and ranked: rent the bridge and own only the plant for the permanent shortfall; or buy the bridging plant and retire the surplus into backup (dual-fuel on stored HVO where gas-network independence is needed). One backup technology per building, never mixed within a building; a site-wide pooled backup option is also generated, ranked with a "client-perceived risk" deliverability item (minor by default, raisable to major per project).
- **Bridging capacity** in each period: shortfall S = max(0, facility demand in that period − grid capacity in that period). Units N = ceil(S / unit rating of the C2 technology), plus redundancy by the same block rule as backup units (default N+1 per block of 10, i.e. total N + ceil(N / 10); indicative — unverified (judgement)). Installed bridging MW = total units × unit rating; it is sized to the largest S across bridging periods. For "BESS + solar only" bridging, BESS power = S and energy = S × 24 h by default (indicative — unverified (judgement)), with PV per C10.
- **Firm prime generation** (C4) = user fraction of facility average load (default 100 % of average for CHP, sized on heat match if CHP-trigen).
- **Solar** per C10 (owner, 2026-10-22, OPEN-QUESTIONS 53 and 54; built 2026-10-22): roof = roof area for PV ÷ m² per kWp, where a blank roof area means the rule (usable fraction of the free roof after roof plant); an entered area above the free roof is flagged (`solar-roof-area`, minor), not reduced. Ground = ground area for PV ÷ ha per MWp, only for C10 "Roof + ground". The layout places ground PV as one block of that area and never resizes it; a shortfall is a site-fit result (Beta). The former "fill residual" sizing (iterated with the layout, §10.4) is removed.
- **BESS** per C12: power = % of facility peak; energy = power × duration. Peak-shave role: the C12 size is kept as given (never enlarged or reduced by the tool); dispatch uses it to hold import within grid capacity on the design day where it can, and if it cannot, the option gets the minor flag "BESS peak-shave cannot hold import within grid capacity on the design day" (§15). Two allocations (walkthrough, 2026-10-21): the resilience reserve (default 5 minutes at full IT, §5.5) is always kept and never used for economic duties; the economic battery is sized from C12 or, when flexibility is on, to cover the historical trigger hours (§5.3), with the engineer choosing whether the battery size, the trigger threshold or the hours covered is held fixed (how C12 and this sizing fit together: OPEN-QUESTIONS 33).
- **PPA** per C13/C14: annual MWh = coverage × annual facility consumption; hourly shape from the chosen profile; delivered across the grid connection and capped by import capacity.
- **Grid connection** = the option's **contracted grid capacity** in each period (walkthrough, 2026-10-21: set by the engineer per option, up to the offered capacity of that period in the §5.4 stepped profile; default the full offer, as built). It is the option's import limit in dispatch. For C1 = Islanded the connection is used as backup only and not in normal dispatch (see C1). The tool never resizes it to fit a constraint or the option's own demand. **Grid shortfall at design load** = max(0, design facility load − firm on-site capacity counted as firm − contracted grid capacity) per period; it is shown in the Sizing panel as a sentence (e.g. "Grid connection 20 MW contracted; design load 64 MW less 30 MW firm on site leaves a 14 MW shortfall in 2027–2029") and becomes unmet load in dispatch under the default "Show unmet load" handling (§9.4). The grid connection charge (§5.4) is the same for every option, whatever it contracts (walkthrough, 2026-10-21). How the engineer sets the contracted capacity of options that only exist after generation is open (OPEN-QUESTIONS 19). Before revision 5 every option had the full offer, and a smaller contracted capacity needed a size override on a pinned option.
- **Heat reuse** = min(offtake MWth, recoverable heat at the cooling approach's supply temperature).
- **Backup gensets as primary power** (walkthrough, 2026-10-21): when the engineer sets primary-power hours (§5.5), the backup gensets are dispatched for up to that many hours a year (§9.4), and their fuel, variable O&M and Scope 1 carbon are costed.
- **Ground solar and wind with the Site tab off** (walkthrough, 2026-10-21): "fill residual" needs a land budget without the layout; the method is open (OPEN-QUESTIONS 25). As built, the layout runs in every run and sets it.

### 9.3 PUE model (kept from v1 delivered tool, now hourly by default)

Hourly PUE = 1 + (cooling power + electrical losses + ancillary) / IT, where cooling power depends on ambient dry-bulb (and wet-bulb for evaporative) temperature and the cooling approach's free-cooling threshold and mechanical COP curve. The parameters per approach (free-cooling threshold, partial free-cooling band, mechanical COP at reference, electrical loss fraction) are editable and sourced. Outputs: annual average PUE, design-day peak PUE, hourly PUE profile. Peak PUE drives sizing, and hourly PUE drives energy.

WUE per approach: L per kWh IT as a function of wet-bulb hours above threshold (evaporative), near zero for dry approaches. Shown as a range and indicative.

**Walkthrough, 2026-10-21.** The cooling type is chosen by the engineer, and the tool offers a typical PUE and maximum demand for each type, both editable. Design conditions come from the nearest ASHRAE design station, flagged as such (§5.1); hourly temperatures come from NOAA station records cleaned into a usable year by the app (method to research), or from an uploaded EPW file. As built, the design temperature is the hottest hour of the synthetic country year.

### 9.4 Dispatch (kept from v1, with explicit merit order)

The same six-step merit order as the v1 delivered tool, used by both tiers:
1. On-site renewables (solar, wind) serve load first.
2. PPA energy, delivered over the grid connection (uses import capacity).
3. BESS discharges against expensive or high-carbon hours (per role); it charges from surplus renewables or cheap grid within the import cap.
4. Firm on-site generation is dispatched against the hourly marginal cost of grid import, respecting min stable load. Must-run in bridging or islanded periods. Run-hour limits (§5.5) follow the "Run-hour limit handling" setting below.
5. Grid import, up to the grid capacity entered for that period, per the "Grid capacity handling" setting below.
6. Demand flexibility (if on). Then any remaining unmet load is recorded and flagged, never silently dropped. With the trigger parameters (walkthrough, 2026-10-21), flexibility acts in trigger hours (price, carbon, or weather and grid stress, §5.3) within the maximum share, hours, duration, notice and recovery limits; where battery response is chosen, the economic battery serves the flexible share before any curtailment. Where trigger-hour flexibility sits in this merit order, and whether it still acts on grid-limit shortfalls as built, is open (OPEN-QUESTIONS 34).

Constraint handling in dispatch (OPEN-QUESTIONS 16). Both settings are in advanced settings, shown in the methodology export and the run summary, and neither ever removes, hides, demotes or resizes an option (§2 principle 5):
- **Grid capacity handling:** two modes.
  - **"Show unmet load" (default).** The grid capacity entered for each period is modelled as given: grid import serves demand up to that capacity. Demand that no source in the merit order can serve is recorded as **unmet load** and is never dropped. Unmet load (MWh/yr, hours, peak MW, by period) is shown on the option card (Energy tab, dispatch stacks in the flag colour), as a ranking-table column, and in the phasing timeline as power gap. The option gets the major flag "Grid capacity binding: N h, X MWh unmet" (§15). The option keeps its sizing, its score and its place in every view. No cost penalty is added for unmet load: its effect on the weighted score is only through the Time-to-power axis (power gap, §9.8 and §11), and it is flagged.
  - **"Show exceedance" (selectable).** Import is not capped, so every option is served in full and the user can see how far a strategy depends on more grid than offered. The excess (peak MW, hours, MWh) is costed at the grid price and flagged major as "Import exceeds grid capacity". Because this serves energy that the stated grid offer does not provide, the header strip shows "Grid capacity: exceedance mode" while it is on.
- Both defaults ("Show unmet load", "Flag only") are indicative — unverified (judgement), per the §23 label rule.
- **Run-hour limit handling:** "Flag only" (default) lets firm plant run as dispatch requires and flags any hours above the limit as "Run-hours above limit". "Respect limit" (selectable) stops the plant at the limit; the shortfall moves to the next source in the merit order or becomes unmet load, and both cases are flagged.

Backup gensets contribute to the resilience check and to test-run energy, not to normal dispatch, unless the engineer sets primary-power hours (§5.5), in which case they run for up to those hours a year as firm plant in step 4. Test running (walkthrough, 2026-10-21): 6 h a year per generator (replacing 12 h) at a test load of 75 %, a separate editable input (indicative — unverified; source to verify against: NFPA 110).

The merit order is shown as an editable ordered list in the advanced settings.

### 9.5 Economics (kept from v1)

- One nominal and real cash-flow ledger per option is the source of truth for LCOE, NPV, capex/opex split and annual costs.
- Annualised capex via CRF; replacement capex and residual value booked automatically (kept from delivered v1).
- Capex timed by phase (C19).
- Capex scope: grid connection and reinforcement, substation, on-site generation, BESS, backup gensets, fuel storage, heat reuse plant, PPA contract costs (none upfront), plus the **cooling capex delta** relative to the air baseline. The data hall building shell and IT fit-out are excluded because they are common to all options. This exclusion is stated in every output.
- Opex: fixed O&M, variable O&M, fuel, grid energy and non-commodity charges, PPA cost (strike × volume, plus shaping/balancing adder), carbon cost (Scope 1 × carbon price), genset test-run fuel.
- Revenues (netted off, shown separately): BESS arbitrage/services, export, heat offtake.
- Metrics: LCOE (€/MWh delivered), NPV of net cost, total capex, capex per MW IT, annual opex year 1 and steady state, capex/opex split.
- Escalation and high/central/low scenarios (kept from v1).
- **Several evaluation periods** (walkthrough, 2026-10-21): the ledger is evaluated for each period chosen (§5.6); which one sets the score is open (OPEN-QUESTIONS 21).
- **Grid connection charge** (walkthrough, 2026-10-21): the same for every option (§5.4); default 0, flagged as assumed on every option that uses it.
- **Battery capex** for both allocations and for the battery response to triggers (walkthrough, 2026-10-21).
- **No PPA income without physical delivery** (owner decision 2026-10-18; built): PPA settlement counts only on delivered energy; settlement on undelivered volume is reported as a separate hedge line outside the cost ledger and the score.

### 9.6 Carbon and water

- **Location-based** annual average gCO₂e/kWh delivered (scored by default).
- **Market-based** gCO₂e/kWh (PPA certificates applied annually).
- **Hourly CFE %** (24/7 matching of on-site renewables + PPA against hourly load). O2 (walkthrough, 2026-10-21): PPA energy counts only against grid energy actually used in that hour.
- **O1** (walkthrough, 2026-10-21): a PPA that cannot be delivered (no grid, islanded) is flagged, and the equivalent option without the PPA is preferred (§11; how: OPEN-QUESTIONS 22).
- Scope 1 (on-site combustion) and Scope 2 split, in tCO₂e/yr and cumulative over the period, with the grid decarbonisation trajectory applied.
- Carbon trajectory chart per option (tCO₂e/yr over the evaluation period).
- Embodied carbon of energy plant: optional, off by default, using indicative kgCO₂e/kW factors marked indicative — unverified.
- Water: WUE (L/kWh) and annual m³, with a flag if it exceeds the stated water availability.

The user chooses which carbon metric the Carbon axis scores: location-based (default), market-based, or 1 − CFE %.

### 9.7 Resilience check (requirement, not score)

For each option, evaluate against the stated requirement:
- **Backed load:** firm on-site capacity available during a grid outage (backup gensets + retained bridging plant + firm prime + BESS energy for its duration) ≥ critical load, at the stated topology after removing the redundant units.
- **Autonomy:** fuel or stored energy ≥ autonomy hours at critical load.
- **Islanding:** if required, the option can serve the critical load indefinitely with on-site firm supply and fuel resupply assumed.
- **Fuel dependency:** gas-based backup is flagged "depends on gas network availability during grid outage".

Status: **Meets** / **Meets with flags** / **Does not meet**, with the failing item named, e.g. "Autonomy 31 h < 48 h required". The resilience panel shows the calculation.

Walkthrough, 2026-10-21: the engineer chooses whether autonomy comes from on-site fuel and generation, batteries, or a combination, and the check uses that choice; the resilience reserve battery (§5.5) is always kept. Open decision 1: a no-backup option whose on-site plant meets every requirement item stays "Does not meet" by default.

### 9.8 Time-to-power

**Owner, 2026-10-22 (OPEN-QUESTIONS 44–46; package 3b, not built).** Long-lead plant is ordered from day one of the project, in parallel with the first phase's construction. Plant that needs significant environmental permitting (EU: IED, ≥ 50 MW thermal input; Seveso for large fuel stores) is ordered after a six-month permitting allowance; other plant immediately. Each such item carries a permitting outlook (likely, uncertain, unlikely) with its reason, by country and technology, labelled judgement.

For each option and phase:
- **Supply available date** per source = max(project start + planning + procurement + construction durations for that technology, technology earliest-availability date, grid capacity step date for grid and PPA).
- **First power date** = earliest date when supply ≥ phase 1 initial IT demand (with PUE) at the required resilience.
- **Full load date** = earliest date when supply ≥ full design facility load.
- **Power gap** = MW-months where demand per the phasing plan exceeds available supply.

Outputs: first power date, full load date, months of delay against the phasing target, power gap (MW-months), and a phasing timeline chart (§12.6). Ranges come from the grid-date and lead-time uncertainty (§13).

When the grid date is "Not known", the country default connection time is used and flagged (walkthrough, 2026-10-21). Known issue: as built, "first power" can be month 0, before any phase exists (`../docs/KNOWN-ISSUES.md`, item 9).

### 9.9 Deliverability score

Transparent, additive, 0–100 (higher = more deliverable). Shown with its breakdown:
- Technology maturity: energy-weighted and capacity-weighted share of Emerging (−15 per 100 % share) and Nascent (−40 per 100 % share) technologies.
- Permitting triggers (§15): −8 per "major" flag (e.g. IED, hazardous substances, wind turbines), −3 per "minor" flag.
- Fuel supply dependency: −10 if gas availability is "Unknown" and gas is used; −10 for hydrogen.
- Supply chain: −5 per technology with procurement lead time > 24 months.
- Optional site-fit penalty (**off by default**, advanced setting "Include site-fit penalty in deliverability"): −10 for "Fits with flags", −25 for "Does not fit". When off, site fit has no effect on the deliverability score or the weighted score (§5.7). When on, the §5.7 axis label and every export say "Deliverability (incl. site fit)". With the Site tab as Beta, kept out of the ranking (walkthrough, 2026-10-21), the penalty stays off and belongs to the Beta settings only.

The score is floored at 0. All penalty values in this formula are indicative — unverified: they are a first-cut judgement with no source. They are editable in advanced settings and listed, with that label, in the methodology export. They are research items before the first release (walkthrough, 2026-10-21).

---

## 10. Site and footprint modelling

**Beta (walkthrough, 2026-10-21).** Everything in §10 belongs to the Site tab. It is built and verified (see `../STATUS.md`) and stays as a Beta feature: hidden by default, turned on in the general settings (§12.12), labelled Beta, and kept out of the ranking and the PDF export. Keep it working; do not extend it unless the owner asks. Still to build: the Beta label, the general-settings switch, and keeping it out of the ranking and the PDF.

### 10.1 Site model

- Site boundary polygon(s), setbacks, hard and soft exclusions, height-limit zones, POC, gas main, access, receptors, optional off-site land.
- **Net developable area** and **buildable envelope** derived as in §5.2.
- Flat ground assumed (terrain out of scope; see §22).

### 10.2 Basemap

- Default: plain plan with a scale bar, north arrow and the user's underlay if provided.
- Optional: online map tiles (OpenStreetMap or a user-configured tile URL), with attribution shown. If tiles fail to load, the plan works without them. With the Windows program making no network connection (walkthrough, 2026-10-21), the map bundled for the location pin (§5.1) is the basemap to use; online tiles are not used.

### 10.3 Blocks

Each technology instance in an option becomes one or more rectangular **blocks** with footprint, height, clearance ring and type. Blocks for unit-based technologies (gensets, BESS containers) are grouped into arrays with a configurable row/column arrangement. Rooftop blocks (PV, roof plant) sit on the building and count toward building height. Off-site blocks are listed in an "off-site" tray with land-take in ha and private-wire distance, and do not consume site area.

### 10.4 Auto-layout heuristic

Fast, deterministic, good enough for concept stage. It is not an optimiser.

1. Rasterise the buildable envelope to a grid (default cell 2 m; 5 m for sites > 50 ha). The cell sizes and the 50 ha switch are indicative — unverified, no source; they are run settings chosen for the §17 layout timing and are editable in advanced settings.
2. Place blocks in priority order:
   1. building (or the user-drawn building),
   2. substation (nearest feasible location to the POC),
   3. backup gensets and fuel storage (adjacent to the building, within the max distance, on the side away from receptors where possible),
   4. firm generation (near the gas main if present, away from receptors),
   5. BESS (near the substation, respecting separations),
   6. heat rejection (ground) and heat reuse plant,
   7. wind turbines (if any, with buffers),
   8. ground solar fills the remaining area (and soft exclusions if allowed).
3. Each placement tests clearances, separation rules to already-placed blocks and boundary, hard exclusions and height zones. The candidate position is the feasible cell minimising a cost of distance to its preferred anchor.
4. If a block cannot be placed, it goes to the "unplaced" tray with the area shortfall in m², and the option's status becomes "Does not fit".
5. If a block is placed only by relaxing a soft rule (e.g. a separation distance reduced to its "minimum" value), the option status becomes "Fits with flags", and the relaxed rule is named.

Iteration with sizing: "fill residual" solar sizing is computed after the other blocks are placed. No other sizing depends on layout.

### 10.5 Manual editing

- The user can drag, rotate (90° steps) and re-arrange blocks on a pinned option. Rules are re-checked live, and violations draw in the flag colour with a label.
- Keyboard: Tab cycles blocks, arrow keys move by one grid cell (Shift = 5 cells), R rotates, Delete sends to the tray.
- A manual layout is saved with the option. If a later input change resizes blocks, the tool keeps the manual positions where they still fit and auto-places the rest, then shows a notice listing what moved.

### 10.6 Site fit outputs per option

- **Status:** Fits / Fits with flags / Does not fit.
- **Area budget bar:** stacked land take by block type against net developable area, with any shortfall shown beyond 100 %.
- **Land take (ha)** on site and off site; **residual area** for future expansion.
- **Height check:** tallest element (building + roof zone, stacks, wind tip) against the limit per zone.
- **Separation check list:** each rule, pass / relaxed / fail.
- **Noise proxy:** distance from each noisy block to the nearest receptor and boundary, with an indicative level at the receptor from sound power and geometric spreading only (flag if > a user threshold, default 45 dB(A) at night; indicative — unverified, no source; replace with the local planning or environmental noise criterion). Labelled "screening proxy, not an acoustic assessment".
- **Roof use:** roof area split between plant, PV and free.
- **Expansion headroom:** maximum additional IT MW that would still fit, using the same density and plant ratios (estimate).

### 10.7 Site views

- 2D plan with layers: boundary, setbacks, exclusions, blocks (energy-source colour system), clearance rings, flags, dimensions on hover.
- 2.5D massing (optional): extruded blocks with height labels, the height-limit plane shown as a translucent surface, simple sun position for the analysed location (for orientation only, not shading analysis).
- Small-multiple plans: thumbnails of pinned or top options side by side at the same scale.

---

## 11. Scoring and ranking

- For each option, compute the four axis metrics: Cost (NPV of net cost, or LCOE, user-selectable; default LCOE P50), Carbon (selected metric, P50), Time-to-power (months to full load + 0.5 × power-gap MW-months / design MW, P50), Deliverability (score §9.9).
- **Scoring scope (the only definition in this brief):** the scoring set is every screened option, including dominated, flagged, custom and pinned options. View filters, "Hide dominated options" and brushing never change the scoring set, so filtering a view never changes any score or rank. With sampling on (§7.2 step 4), the scoring set is the screened sample, and the scope note says so.
- Normalise each axis metric to 0–100 across the scoring set (best = 100, worst = 0, linear), and show the absolute metric next to each score. Show a note that scores are relative to the set. Optionally the user can switch to **absolute scaling** against fixed anchors (user-set best/worst values, clamped to 0–100) so that scores do not shift when options are added.
- Weighted score = Σ w_i × axis score_i, using the effective weights w_i from §5.7 (Σ w_i = 1), so the weighted score is on a 0–100 scale.
- **Ranking:** by weighted score. Resilience status and site-fit status are shown as badges in the ranking. Options with "Does not meet" or "Does not fit" are **not demoted automatically**. The user can turn on "Rank requirement-compliant options first" (off by default, to keep flag-not-enforce), and the toggle state is shown in all exports. (Walkthrough, 2026-10-21: with the Site tab as Beta, site fit is not shown in the ranking and does not count towards "compliant"; see "Site fit" below. Built on branch `feature/site-tab-beta`, 2026-10-22: "compliant" uses the resilience status only, and dominance no longer uses site fit.)
- **User view filters:** the user can filter the view by site-fit status, resilience status, any flag, capex or land-take ceiling, dominated status or brushing. Active filters show as removable chips above the results, are counted in the header strip, and are listed in exports. Filters never change any score or rank (see scoring scope and §2 principle 5).
- **Ranking and scaling settings (part of this brief):** (a) "Absolute scaling" (off by default; relative scaling is the default); (b) "Rank requirement-compliant options first" (off by default); (c) "Auto-update uncertainty" (on by default, §13.2). Each default is indicative — unverified (judgement) under the §23 label rule. Each is shown in the header strip when not at its default and listed in exports.
- Changing weights re-ranks live (no recompute of dispatch). The Pareto pick and summary update to match, and the effect of the change is described in words (walkthrough, 2026-10-21).
- **O1 preference** (walkthrough, 2026-10-21): where a PPA cannot be delivered (no grid, islanded), the equivalent option without the PPA is preferred over it. How the preference works is open (OPEN-QUESTIONS 22). A tie-break toward the no-PPA option fits principle 5 (flag, never enforce); a demotion, or hiding the option by default, would make O1 an exception to principle 5, which only the owner can decide. Until the question is answered, the option carries the O1 flag and no preference is applied.
- **Evaluation period** (walkthrough, 2026-10-21): with several periods shown, which one the Cost axis uses is open (OPEN-QUESTIONS 21).
- **Power adequacy first** (owner, 2026-10-22; OPEN-QUESTIONS 38). Power adequacy comes first (owner, 2026-10-22, proposal approved): options with unmet load at any time rank at the bottom of the list, below every option that serves its load in every hour; they stay visible, never hidden. This is a deliberate exception to principle 5 (flag, never enforce), made by the owner. The engine is to (1) analyse the shortfall (temporary, before full grid connection; permanent, after it) before options are built, (2) generate options sized to close it (bridging, shortfall-sized on-site generation and batteries), (3) report the IT load the grid can support and a grid-matched phasing reference option, and (4) show unmet load as MWh, hours, peak MW and longest event. New work package 3b. Confirmed 2026-10-22 (OPEN-QUESTIONS 39–41): adequacy is tested against the site's peak demand (full contracted IT at the design-day PUE), with zero unmet hours and no tolerance; no availability (nines) measure in the tool.
  - *As built (2026-10-23, branch `feature/adequacy-first`):* adequate = no unmet load in any dispatched hour, no import above the grid capacity, and no time-to-power power gap against the design load in any month. Every adequate option ranks above every option that is not; within each group the existing order applies (weighted score, with "rank requirement-compliant options first" applied inside each group). Scores never change. An option that is not adequate carries the major flag `adequacy-short` and never dominates an adequate one. The run summary shows the grid shortfall against the design load per cooling type (temporary, permanent, IT the full grid supports). Confirmed by the owner 2026-10-23 (OPEN-QUESTIONS 55): a monthly power gap alone makes an option not adequate. Generation sized to close the shortfall, and the grid-matched phasing reference option, are not built yet.
- **Site fit** (walkthrough, 2026-10-21): with the Site tab as Beta, site-fit status is not shown in the ranking and "Rank requirement-compliant options first" uses the resilience status only.

---

## 12. Outputs and views

A collapsible **run summary** sits directly above the options list and in every export. It lists: total combinations, compatibility rules applied with the count each removed (§7.2 step 2), the "values not generated" note with "Include" controls (§8 rules), the sampling state and counts (§7.2 step 4), and the dispatch handling modes (§9.4). It is expanded automatically whenever any entry is new since the last run.

The results open on the **top five option cards** (§12.11; walkthrough, 2026-10-21).

Results area (step 6 onward) has a persistent header strip showing: option count (shown / total screened / total combinations, plus how many are dominated), active view filters and the state of "Hide dominated options" and "Sample above cap", leader name, leader's weighted score with its rank probability, model badge (screening / verified), and number of unverified defaults affecting the leader.

### 12.1 Ranking table

One row per option. Columns: rank, name, archetype, weighted score, axis scores with mini range bars (P10–P90), LCOE, capex, NPV, carbon (selected metric), CFE %, first power date, full load date, land take, site-fit badge, resilience badge, maturity badge, flag count, model badge. Sortable, filterable, column chooser, row pinning. Clicking a row opens the option card.

### 12.2 Trade-off views

- **Pareto scatter:** any two axes. Default (walkthrough, 2026-10-21): **cost on the vertical axis against carbon on the horizontal axis**, with **resilience status as the bubble size and colour**; either axis can be switched (for example to time-to-power or deliverability). Before revision 5: colour = time-to-power, marker shape = site-fit status, size = capex. P10–P90 error crosses on hover or for pinned options. The Pareto frontier is drawn, and the weighted pick is highlighted.
- **Parallel coordinates:** all axes plus key metrics (LCOE, capex, carbon, CFE %, first power date, land take, flags). Brushing on any axis filters the option set across all views.
- **Choice impact chart:** per choice (§8), the spread of weighted score by alternative (box or dot plot). Shows which design decisions matter most for this site.
- **Radar / profile** of up to 4 pinned options on the axis scores (with the table alternative).

### 12.3 Option card

Tabs: Summary (metrics with ranges, badges, flags, the assumed defaults with their sources, one-paragraph description), Choices and sizing (choice vector, sizing sentences, editable sizes), Site (Beta: plan and massing, site-fit outputs), Energy (annual supply mix, representative-day dispatch stacks, 8760 heat map and stacks if verified, BESS SOC, curtailment, unmet load), Cost (capex breakdown, cash-flow chart, LCOE build-up waterfall), Carbon and water (scope split, trajectory, CFE %, WUE), Programme (phasing timeline), Resilience (check calculation), Assumptions (every parameter used, with sources and unverified markers), Schematic.

### 12.4 Schematic

An auto-generated simplified power block diagram per option: grid POC → substation (voltage, transformer count) → MV distribution → UPS → IT; plus on-site generation, BESS, backup gensets with unit counts and redundancy, PPA as a contractual link. Labelled "concept schematic, not a single-line diagram".

### 12.5 Key quantities schedule

Per option: transformer count and rating, genset count and rating, fuel volume (m³), BESS MW/MWh and container count, PV MWp, firm generation MW and unit count, heat rejection MW, land take by block. This is the information a cost consultant or planner needs at concept stage.

### 12.6 Phasing timeline

Gantt-style chart per option: demand per phase (stepped line) against available supply stacked by source over time, bridging periods shaded, power gaps in the flag colour, grid-date uncertainty as a band. Side-by-side for pinned options.

### 12.7 Compare view

Up to **3** options side by side (walkthrough, 2026-10-21), chosen from the result cards or the trade-off chart, with a deep-dive card for each: headline figures with ranges, the choices on which they differ, phasing timelines, schematics, and a "differences" list (choices and sizes that differ, plus the metric deltas they cause). Site plans only when the Site tab (Beta) is on. Before revision 5: up to 4 pinned options.

### 12.8 Sensitivity and uncertainty views

See §13: tornado, breakeven table, rank-stability chart, P10–P90 bars, scenario switcher.

### 12.9 Plain-English summary

See §14.

### 12.10 Exports

- **PDF report** (walkthrough, 2026-10-21): the one report export. One PDF, **inputs first, results after**, saved through a file dialog; nothing is sent anywhere. The Site tab (Beta) is not included. Inputs come first, with their sources and every assumed default marked; results come after. The sections themselves were not covered by the walkthrough (OPEN-QUESTIONS 32): the list of revisions 1–4 (cover, executive summary from §14, inputs and assumptions with sources, option shortlist table, trade-off charts, phasing timelines, uncertainty and sensitivity, flags register, methodology, guardrail statement) is the starting point to discuss, without site plans while the Site tab is Beta.
- **Run log** (built): JSON or CSV from the run progress panel.
- **Excel: dropped** (walkthrough, 2026-10-21).
- **Project JSON:** full state (inputs, choices, manual layouts, seeds) for reopening. Not built; not covered by the walkthrough (OPEN-QUESTIONS 27).
- **GeoJSON** of the site and the layout of selected options (in WGS84), for import into GIS or massing tools: Site tab (Beta) only.
- **PNG/SVG** of any chart or plan, and **presentation mode** (full-screen, large type, a sequence of views for client workshops): not covered by the walkthrough and not in the current build plan.

### 12.11 Top five option cards (walkthrough, 2026-10-21)

The first results screen. Each card shows: the overall weighted score and the four axis scores; LCOE, carbon intensity, resilience status and capex; the main flags; the **assumed defaults** the option relies on, with their sources; and up to **three pros and three cons**, judged against the other options in the run ("n/a" if there are too few to compare). Each card says what it is compared against (for example "lowest of the 5 shown"), because a pro or a con can change when the set of options changes. Open (OPEN-QUESTIONS 24): whether the comparison set is the whole run or the five shown, and whether the five are the five highest scores or five distinct strategies.

### 12.12 General settings (walkthrough, 2026-10-21)

A page for features outside the main flow. Decided: the **Site tab (Beta)** switch, off by default. Anything else on the page (for example theme, run-log options, "About this copy" with the app and data versions) is a proposal to confirm with the owner.

### 12.13 Dispatch views (walkthrough, 2026-10-21)

Dispatch for **any period of the year**, not only whole weeks, offered only for options verified with the full 8760-hour model (§9.1), because the screening run uses representative days. Built today (Dispatch tab): phasing timeline, hourly dispatch for one week, and the annual energy balance, for any option.

---

## 13. Uncertainty and sensitivity

Not covered by the walkthrough of 2026-10-21: the ranges (§13.1), Monte Carlo (§13.2), the breakeven table and the scenarios (§13.3). They stay in the brief but are not in the current build plan; ask the owner before starting them. The tornado (§13.3) is built and was changed by the walkthrough.

### 13.1 Input uncertainty

- Every numeric parameter has low / central / high. Defaults: from the source where available; otherwise from the capex class band (−30 % / +50 %) for costs, ±20 % for performance parameters (indicative — unverified: no source), and the specific ranges listed in §5 and §6.
- Distribution: triangular (low, central, high) by default; the user can switch a parameter to uniform or fixed.
- Correlation groups (editable): grid price and gas price (ρ = 0.6), all capex within a technology family (ρ = 0.8), carbon price independent. Indicative — unverified: no source; the user should review.
- **Data confidence tag** per parameter: A (project-specific or quote), B (published source verified), C (indicative — unverified). The header strip counts C-tagged parameters that drive the leader.

### 13.2 Monte Carlo

- Latin hypercube sampling, default 300 samples (indicative — unverified (run setting)), run with the screening model over the top 20 options by weighted score (indicative — unverified (run setting); from the scoring set, §11) plus all pinned options.
- Outputs per option: P10/P50/P90 of LCOE, NPV, capex, carbon, first power and full load dates, and weighted score.
- **Rank stability:** probability that each option is ranked 1st, and the probability it is in the top 3. Shown as a stacked bar per option.
- **Robust pick:** the option with the highest probability of being within 5 % of the best weighted score in each sample. The 5 % band is indicative — unverified (judgement) and editable in advanced settings. Shown alongside the P50 leader. If they differ, the plain-English summary says so.
- Monte Carlo reruns automatically after inputs settle (2 s idle; indicative — unverified (run setting)) when "Auto-update uncertainty" is on (default on). A progress indicator shows samples completed. Partial results display as they arrive.

### 13.3 Deterministic sensitivity

- **Tornado** per option: weighted score and LCOE swing for each driver from low to high, top 12 drivers (indicative — unverified (run setting), editable 1–30). Default drivers: grid date, grid price, gas price, carbon price, WACC, IT load, PUE parameters, capex of each technology in the option, solar yield, PPA price, BESS cost, lead times. Walkthrough, 2026-10-21: the engineer picks the drivers from a **tick-box list**: the seven the decision log names (gas price, grid price, WACC, carbon price, capex, capacity factors, grid connection date) plus additions such as IT load, PUE, battery capex, grid connection capex, evaluation period, escalation, flexibility trigger and generator test hours. As built, the tornado has seven fixed drivers: grid connection date, grid price, grid carbon, gas price, carbon price, WACC and IT load (`app/src/engine/sensitivity.js`); capex, capacity factors and the other additions are not built. The **result measured defaults to LCOE**; NPV, carbon and the weighted score can be selected.
- **Breakeven table (default scope: 5 competitors × 8 drivers, matching §17):** the leader against 5 competitors: the runner-up, then the highest-ranked option of each other archetype in rank order until 5 competitors are reached (if fewer archetypes are present, the next-ranked options fill the list). Drivers: the 8 drivers with the largest weighted-score swing in the leader's tornado. For each pair and driver, the table gives the driver value at which their order flips, or "no flip within range" (e.g. "Gas bridging overtakes wait-for-grid if grid date slips beyond 2029-03"). Solved by bisection on the screening model. The default scope (5 × 8) and the competitor selection order are indicative — unverified (run setting), chosen for the §17 target. The user can change both counts (1–10 competitors, 1–12 drivers); the §17 target applies only to the default scope.
- **Scenarios:** high / central / low price and carbon sets (kept from v1), plus one user-defined scenario: the user sets escalation multipliers for electricity, gas and carbon price and, optionally, overrides any other input. It is saved in the project file. The scenario switcher re-ranks immediately.

### 13.4 Presentation rules

- Central values in full weight, ranges as lighter bars or bands, always on the same axis.
- Wherever a single number is shown in large type, its range is shown next to it in smaller type.
- Dates as ranges ("Q3 2028 – Q2 2029, P50 Q4 2028").
- Copy never claims precision beyond the input class: values are rounded to 2 significant figures in summary views and 3 in detail views.

---

## 14. Plain-English summary

Not built, and not covered by the walkthrough of 2026-10-21: ask the owner before building it (OPEN-QUESTIONS 12).

Generated deterministically from templates and results (no external language model). It updates whenever the ranking changes. The user can edit the text, and edits are kept as a user note and marked "edited". It describes results under the user's own weights and settings; it does not advise. The UI label is "Summary", never "Recommendation". The leading option is "the option that leads under the current weights", never "the recommended option".

Structure (≤ 250 words in the summary, expandable):
1. **Leading option** under the current priorities, with headline figures as ranges.
2. **Why it leads:** the two or three axis differences that matter most against the runner-up, in words.
3. **What it gives up:** where it is worse than the alternatives.
4. **Confidence:** rank probability and whether the robust pick differs; the number of unverified defaults driving the result.
5. **What would change the answer:** the two most relevant breakevens and the weight change at which the leader changes.
6. **Open flags on the leader:** site fit, resilience, permitting and fuel-supply flags on the leader, stated descriptively.
7. **Inputs with most influence:** the three inputs whose uncertainty moves the result most, chosen by tornado swing and data confidence, stated descriptively (e.g. "Grid full-connection date (confidence C): moves time-to-power by up to 20 months across its range"). No imperative wording.

Template tone: plain verbs, sentence case, no hype. No advice or directive language: no "we recommend", "you should", "get", "choose" or "invest" aimed at the reader; describe what the results show and what drives them. Always end with the guardrail sentence (§23).

---

## 15. Flags catalogue

Flags never remove or hide an option. Each flag has: id, severity (info / minor / major), category, message, the value that triggered it, the threshold, and a link to the input that controls it.

| Category | Examples (default thresholds, all editable) |
|---|---|
| Assumed defaults (walkthrough, 2026-10-21) | One info flag on each option for each default it uses that the engineer did not enter, naming the value and its source, e.g. "ASSUMED Grid full connection 120 MW in 48 months: country default, indicative — unverified"; location approximate; design temperatures from the nearest ASHRAE station, N km from the site |
| Site fit (Beta: Site tab only) | Block does not fit (area shortfall m²); separation relaxed; height limit exceeded; block in soft exclusion; roof over-allocated |
| Grid | Grid capacity binding: N h, X MWh unmet (major; default "Show unmet load" handling, §9.4); import exceeds grid capacity: peak MW, N h (major; "Show exceedance" handling); bridging unmet load; PPA flags (O3, walkthrough, 2026-10-21: two flags instead of one `grid-ppa` flag, one for PPA volume limited by the grid import capacity and one for other undelivered PPA volume, above the load in the hour, each showing its share of the undelivered volume; O1: PPA cannot be delivered, no grid or islanded); BESS peak-shave cannot hold import within grid capacity on the design day (minor, §9.2); grid shortfall at design load in a period (info, shown in the Sizing panel, §9.2); export exceeds export capacity |
| Resilience | Requirement not met (named item); backup depends on gas network; BESS-augmented UPS is an emerging approach |
| Permitting | Aggregated combustion thermal input ≥ 50 MWth (EU IED threshold for all countries; non-EU countries add "EU threshold used as a proxy; national equivalent not checked by this tool", §5.5); individual combustion units 1–50 MWth (medium combustion plant rules); run-hours above limit; hazardous substance storage above threshold (hydrogen, diesel/HVO; thresholds in §5.5); wind turbines (planning, aviation); stack height above height limit; noise proxy above threshold. All carry the note "Screening flag, not a permitting determination" |
| Fuel and utilities | Gas availability unknown; gas capacity and date assumed, not confirmed; hydrogen supply unavailable at current inputs (hydrogen availability = No, §5.4); hydrogen supply assumed (availability = Yes, date and price unconfirmed); water use above availability |
| Targets and ceilings | Carbon target not met; time-to-power target missed by N months; capex P50 above ceiling (minor) or only P90 above ceiling (info); land take above ceiling (minor) |
| Technology | Nascent technology in the option; earliest availability after the target date; wind not generated by default on a site ≤ 20 ha (info, §8 C11) |
| Generation | Compatibility rules removed N impossible combinations (info, run summary, §7.2 step 2); values not generated by default (info, run summary, §8 rules); sampling above cap active (info, §7.2 step 4) |
| Data | Result depends on C-tagged (unverified) parameters; screening vs verification deviation > 5 % |
| Load | AI training transient load not modelled; swings shorter than an hour not modelled when an AI load shape is selected (walkthrough, 2026-10-21); IT utilisation assumption; IT load estimated from area (walkthrough, 2026-10-21) |

The flags register (all flags across the shortlist) is a view and an export section.

---

## 16. UX, layout and visual style

- **Layout (≥ 1280 px):** left: workflow stepper and input panel (collapsible sections). Centre: the main view (site plan or results view, switchable tabs: Options, Trade-offs, Site, Compare, Uncertainty, Report). Right: option card drawer. Header strip as in §12. Walkthrough, 2026-10-21: the results open on the top five cards (§12.11), the Site tab is Beta (§10), and the tab structure itself was not covered (OPEN-QUESTIONS 29).
- **Narrow window (768–1279 px):** inputs as a slide-over panel; main view full width.
- **Phone: dropped** with the phone version (walkthrough, 2026-10-21). The Windows program window should still reflow sensibly when narrowed.
- **Signature element (kept from v1):** a consistent energy-source colour system used across dispatch stacks, site blocks, schematics and charts. Colour-blind-safe, with pattern or shape redundancy (site blocks have hatch patterns; chart series have distinct markers).
- **Status colours** (fits / flags / does not fit, meets / does not meet) are separate from the source colours and are always paired with an icon and text.
- **Copy:** plain verbs, sentence case, name things by what the user controls. Empty and error states say which inputs most affect the result and where they are entered (e.g. "Site fit needs a site boundary or an area").
- **Live update feedback:** after an input change, changed values flash subtly (respecting reduced motion), and a polite live region announces "Options updated. Leader unchanged" or "New leader: …".
- **Undo/redo** for all input, choice and layout changes (at least 50 steps).
- **Snapshot:** the user can save named snapshots of the whole state within a project (e.g. "Before grid offer") and compare the leader and metrics between snapshots.

---

## 17. Performance and quality targets

Walkthrough, 2026-10-21: the owner measures a full run of 2,000 options at **15–20 s** with the full 8760-hour model for every option. The screening targets below need the representative-day tier (§9.1); run speed is a research item before the first release.

Reference machine: a 4-core laptop CPU from 2020 or later, 16 GB RAM, current Chrome, Edge or Firefox (for the Windows program: Windows 10 or 11, 64-bit). Targets are p95 over 20 runs on the reference test project (§21: 100 MW IT, 4 phases, 15 ha site, default open choices). Where a row gives both a target and a ceiling, the target is the design aim and the ceiling is the acceptance limit (§21 AC 1 fails only above the ceiling); for screening or re-screening 600 options, 500 ms is the target and 1.0 s is the ceiling.

| Target | Value |
|---|---|
| Options generated and screened per run (default open choices) | 200–600 typical; up to 2,000 (cap) |
| Screening of 600 options (dispatch + economics + scoring) | Target ≤ 500 ms; ceiling ≤ 1.0 s |
| Screening of 2,000 options | ≤ 3.0 s, with progressive results from 0.5 s |
| Auto-layout per option | ≤ 20 ms on a 15 ha site (2 m grid) |
| Weight or scenario change → ranking, Pareto pick and plain-English summary updated | Relaxed from ≤ 100 ms (walkthrough, 2026-10-21); the new value is to agree with the owner (OPEN-QUESTIONS 35). The browser test fails above 300 ms to catch regressions |
| Single-parameter input change → all options re-screened, ranking updated | Target ≤ 500 ms; ceiling ≤ 1.0 s (600 options) |
| Site edit (boundary, exclusion, setback) → all layouts and site-fit statuses updated (Beta) | ≤ 1.0 s (600 options) |
| Slider drag update | ≤ 150 ms per frame of results using throttled screening |
| 8760 verification of 10 options | ≤ 3 s in background |
| Monte Carlo: 300 samples × 20 options | ≤ 8 s, progressive |
| Breakeven table (default scope, §13.3: leader vs 5 competitors × 8 drivers) | ≤ 3 s |
| Main thread long tasks during compute | none > 50 ms |
| Initial load to interactive (cold, broadband) | ≤ 3 s; JS bundle ≤ 1.5 MB gzipped excluding lazy 2.5D view and profile data |
| Country profile data per country | ≤ 300 KB gzipped (representative days + 8760 arrays) |
| Screening vs verification agreement | LCOE and annual carbon within ±5 %; resilience, site-fit and grid-cap flag status identical, for all 10 archetypes on the reference set |
| Energy balance (verification) | 0.00 % error every hour |
| Time to first ranked options for a new user (quick-start mode only, §3) | ≤ 5 min, 2 required inputs (location and site area; walkthrough, 2026-10-21); quick-start form ≤ 2 min of user input |
| Accessibility | WCAG 2.2 AA: full keyboard operation including site editing; visible focus; 4.5:1 text contrast, 3:1 for graphics; targets ≥ 24 × 24 px; reduced motion respected; every chart and plan has a data-table alternative; live-region announcements of updates; tested with NVDA on Windows (VoiceOver + Safari no longer applies with the Windows-only scope (walkthrough, 2026-10-21)) |
| Determinism | Same project file + seed → identical results across runs and browsers (within floating-point tolerance 1e-9 relative) |
| Provenance coverage | 100 % of built-in defaults have a source record or the "indicative — unverified" label |

---

## 18. Data sources and default requirements

Every built-in default is stored as:

```
{ value, unit, low, high, distribution, basis: "source"|"run setting"|"judgement", source, year, url, accessed, confidence: "A"|"B"|"C", verified: true|false, note }
```

**Walkthrough, 2026-10-21.** The program makes no network connection, so its data is bundled with it (prepared when each release is made) or loaded by the engineer from a file. Prices and generation from ENTSO-E (Transparency Platform), with Ember, the World Bank and Eurostat as published alternatives; weather from NOAA station records (raw hourly data cleaned into a usable year by the app; the method is research), or an EPW file uploaded by the engineer; design temperatures from the nearest ASHRAE design station (licence to check); the map from OpenStreetMap in Protomaps PMTiles format (licence, attribution and file size at roads level to check); grid availability, connection time and connection capex by country (to research); the latest EU ETS price and a free monthly gas price, each with its date; published escalation forecasts. Every default gets its source, year, link and access date as it is researched; values that stay judgements are labelled "judgement". The research list is in the decision log (`../docs/walkthrough-decisions-2026-10-21.md`). The user guide holds the detail: chapter 50 (important defaults checked against published sources on 2026-10-21, with suggested updates), chapter 52 (data sources and APIs), chapter 53 (licences) and Appendix B (country data), in `../docs/user-guide/src/05-part5.md` and `08-appx-countries.md`.

**Owner decision, 2026-10-22 (OPEN-QUESTIONS 36).** A default that has been researched, given its source, year, link and access date, and approved by the owner carries the label **"sourced — not independently checked"** instead of "indicative — unverified". It is not marked verified (`verified: false`) because the research was done by Claude and approved by the owner, not checked by a person responsible for the data; it becomes verified only after such a check. Values with no published source keep the label "judgement" with a reason. The owner chose this middle label over marking approved values verified, and over keeping them "indicative — unverified". The record keeps `source`, `year`, `url` and `accessed`, `confidence: "B"` (published source) and `verified: false`.

`basis` records why the value is what it is (§23 label rule). Run settings and judgement choices (including on/off settings and choice default states) get a record too, with `basis` set, `source` empty, `confidence: "C"` and `verified: false`, so the AC 9 test covers them.

Before release, the builder must verify each default against a current publication and fill the record. If it cannot be verified, `verified: false`, `confidence: "C"`, and the UI shows "indicative — unverified". The v1 indicative ranges carried into this brief (e.g. solar PV capex ~€600–800/kW, onshore wind ~€1,200–1,500/kW, gas recip ~€800–1,000/kW, BESS ~€250–400/kWh) are confidence C until re-verified.

| Data | What each default needs | Candidate sources (verify current edition and licence) |
|---|---|---|
| Hourly solar yield per kWp (per country, and per location if possible) | 8760 profile, typical year, tilt/azimuth assumptions | PVGIS (EU JRC), typical meteorological year data |
| Hourly wind capacity factor | 8760 profile, hub height and turbine class assumption | Renewables.ninja (check licence for redistribution), ERA5-derived datasets (Copernicus) |
| Hourly ambient temperature (dry and wet bulb) for PUE | 8760 profile per location or country | NOAA station records (Integrated Surface Database) or an uploaded EPW file (walkthrough, 2026-10-21); PVGIS TMY, Copernicus ERA5 |
| Design temperatures | Nearest station's design conditions, with the station named | ASHRAE design conditions (walkthrough, 2026-10-21); licence for redistribution to check |
| Map for the location pin | Europe to roads level, offline | OpenStreetMap data (ODbL) in Protomaps PMTiles format (walkthrough, 2026-10-21); attribution and file size to check |
| Grid availability, connection time and connection capex by country | Indicative country values with reference | To research (walkthrough, 2026-10-21); national TSO/DSO publications |
| IT density and site coverage for the IT estimate | kW per m² of floor; coverage % | To research (walkthrough, 2026-10-21); one benchmark so far (STACK Erskine Park) |
| Hourly grid price | Historic year with stated year; non-commodity adder by country | ENTSO-E Transparency Platform; national regulators for network charges |
| Hourly grid carbon intensity | Location-based hourly profile with stated year; decarbonisation trajectory | Ember, ENTSO-E generation mix with emission factors, EEA; national TSO projections |
| Gas price | Hub price, transport adder | TTF/NBP forward curves; national tariffs |
| Carbon price | EU ETS / UK ETS forward and outlook | Exchange data; official projections |
| Technology capex, O&M, efficiency, life | Value, range, year, currency basis | IRENA Renewable Power Generation Costs, NREL ATB, Danish Energy Agency Technology Catalogues, Lazard LCOE+, IEA, BNEF (licence permitting), vendor indications |
| Technology footprint, height, separations | m²/MW etc., range, source type | Danish Energy Agency Technology Catalogues, vendor datasheets, NFPA 855 and FM Global DS 5-33 (BESS), national fuel and hazardous-substance regulations, NREL land-use studies |
| Programme durations (planning, lead time, build) | Months, range, country variation | Industry surveys, vendor lead-time indications, national planning statistics; most will be C |
| PUE / WUE model parameters | Free-cooling thresholds, COP curves, loss fractions | ASHRAE TC 9.9 thermal guidelines, vendor data, published design studies |
| Permitting thresholds | Threshold values and the regulation name | EU IED and MCPD texts; national transpositions |
| Exchange rates | Rate and date | ECB reference rates |
| Representative days | Clustering method, k, weights, extreme-period selection | Derived by the builder from the above profiles; method documented in the methodology export |

Licensing: the builder must check that each dataset's licence permits redistribution of derived profiles inside the app. Where it does not, ship a synthetic profile calibrated to the dataset's published annual statistics (as in the v1 delivered tool) and label it "synthetic, calibrated to [source, year]".

Users can upload their own hourly CSVs (price, carbon, solar, wind, temperature, load), which override the built-in profiles and are tagged confidence A.

---

## 19. Persistence, sharing and audit

- Saving and reopening a study is not built and was not covered by the walkthrough of 2026-10-21 (OPEN-QUESTIONS 27). When it is built:
- Project JSON includes an integer `schemaVersion`. On load, the app migrates older versions step by step (one migration function per version increment), tells the user which version it migrated from, and keeps the original file untouched until the user saves. A file with a newer schema than the app opens read-only with a notice.
- Every export carries the app version, data version (profile and default set version), seed, date and the screening/verified status of each figure.
- A methodology section (generated) documents formulas, merit order, sizing rules, deliverability formula, layout heuristic and clustering.
- Decision log: when the user marks options as "preferred" or "alternate" or "rejected", they can add a reason. The log is saved in the project and exported.

---

## 20. Build order

**Revision 5 (walkthrough, 2026-10-21).** Stages 1 and 2 below are built and verified, with parts of stages 3–5 (the trade-off view, the Dispatch tab and the tornado); see `../STATUS.md`. The next work implements the walkthrough decisions in this order, recorded in the project's handoff note at the end of the walkthrough (`claude/handoff-concept-tool.md` in the owner's Claude project, 2026-10-21); confirm the order with the owner before the first package. The work packages, their acceptance checks and the questions to ask the owner first are in `../docs/BUILD-PLAN.md`.

0. Research the defaults before the first release (§18; the list in the decision log).
1. Map pin and country setup.
2. Input model with flagged defaults.
3. Contracted grid capacity and the fixed grid connection charge.
4. Flexibility and battery logic.
5. The O1–O3 PPA and carbon rules.
6. Results cards and the trade-off chart.
7. Compare.
8. Dispatch views.
9. Tornado.
10. PDF export.

Throughout: keep the Site tab working as a Beta feature (general-settings switch, Beta label, kept out of the ranking and the PDF).

The stages of revisions 1–4, kept for reference (each stage ends with a working, testable tool):

1. **Core loop:** project, quick-start inputs, country profiles (representative days), technology library with source records, option generation from choices, sizing rules, screening dispatch, economics ledger, carbon, resilience check, time-to-power, scoring, ranking table with live weights. Web Worker pipeline and incremental recompute in place from the start.
2. **Site:** boundary drawing and import, exclusions, setbacks, height; building massing; blocks and auto-layout; site-fit status and area budget; 2D plan; small multiples.
3. **Trade-off views:** Pareto, parallel coordinates with brushing, choice-impact chart, option card, compare view, phasing timeline, schematic, key quantities.
4. **Verification:** 8760 model, background verification of the top 10, deviation flags, dispatch visualisations.
5. **Uncertainty and sensitivity:** ranges, Monte Carlo, rank stability, robust pick, tornado, breakevens, scenarios.
6. **Plain-English summary, flags register, exports** (PDF, Excel, JSON, GeoJSON), presentation mode, decision log, snapshots.
7. **Polish:** manual layout editing, 2.5D massing, online tiles, custom profile upload and clustering, accessibility audit, performance tuning to §17.

---

## 21. Definition of done and acceptance tests

Reference test set (ship in the repo as project JSON files):
- **T1 Reference:** 100 MW IT, 4 phases of 25 MW, 15 ha site, grid 20 MW now and 120 MW in 30 months, gas available, central defaults.
- **T2 Tight site:** as T1 on 6 ha with a 15 m height limit (for the Site tab, Beta).
- **T3 No grid:** grid 0 MW for 5 years.
- **T4 Small edge:** 5 MW IT, 1 ha urban site, grid available now.
- **T5 AI campus:** 500 MW IT, DLC, 60 ha, grid in steps over 6 years, district heating available.

Acceptance criteria:
1. All §17 targets met on T1 (and on T5 for the 2,000-option cap).
2. Energy conserved every hour in verification; unmet load always flagged.
3. LCOE, NPV and capex/opex reconcile to the same ledger for every option (difference < 0.1 %).
4. Screening vs verification within ±5 % on LCOE and carbon for all archetypes on T1–T5.
5. Weight changes re-rank live; the highlighted Pareto pick and the plain-English summary always match the weighted leader.
6. Pushing the grid date out by 24 months on T1 visibly changes the leader toward bridging options, and the time-to-power ranges widen.
7. With the Site tab (Beta) turned on: on T2, at least one archetype shows "Does not fit" with a named shortfall. C17 and C18 stay at their defaults until the user changes them, and the run summary shows their "N options do not fit" notes; including C17 (GIS) and C18 (double-deck) yields options that fit or fit with flags. No option is hidden without the user filtering. With default settings, "Hide dominated options" is off and every screened option appears in the ranking table.
8. On T3, every grid-dependent option shows the unmet-load and time-to-power flags and remains in the list.
9. Every default shows its source and year, or "indicative — unverified". A test enumerates all defaults and fails if any lacks either.
10. Same project + seed gives identical outputs on two runs.
11. Accessibility audit passes WCAG 2.2 AA (automated axe check with zero serious issues, plus manual keyboard and NVDA screen-reader walk-through of steps 1–7).
12. (Applies when §14 is built.) The plain-English summary for T1 names the leader, runner-up, confidence, two breakevens, flags and the three most influential inputs, contains no directive wording (a test scans for the banned phrases in §14), and ends with the guardrail sentence.
13. On T1 with C11 at its default, the info flag for wind is shown on the C11 row and in the run summary's "values not generated" note, and "Include wind" generates wind options; on every reference project, the sampling and dominated-option settings and their counts appear in the header strip and exports, and the run summary lists each compatibility rule with its removed count and every omitted default value.
14. On T3 with default dispatch handling ("Show unmet load"), every grid-dependent option keeps its sizing and appears in the ranking with its unmet load (MWh, hours) shown and the "Grid capacity binding" flag; switching to "Show exceedance" removes the unmet load, raises "Import exceeds grid capacity" and shows the mode in the header strip. On T1, every grid-using option has a grid connection equal to its contracted capacity in each period (by default the full offer: 20 MW, then 120 MW), and its Sizing panel states the grid shortfall at design load.
15. A test enumerates every run setting, view or ranking setting, input-state default and choice default state, and fails if any lacks a §18 record with `basis` set and the "indicative — unverified" label shown in the UI.

Acceptance tests added with revision 5 (walkthrough, 2026-10-21). They test the decisions as recorded; confirm the details of each with the owner when its work package starts (`../docs/BUILD-PLAN.md`).

16. **Knowledge levels:** with only the T1 location and site area entered, a run completes; every option lists each default it uses that the engineer did not enter, with its source; entering a value removes its flag from every option.
17. **Map and country:** dropping a pin sets the country (editable) and names the nearest ASHRAE station with its distance; with the map bundled, the Windows program still makes no network connection (process trace, as in packaging check D12).
18. **Contracted capacity:** an option that contracts C MW below the offer never imports more than C MW in any hour (the rest is unmet load or exceedance, flagged); every option pays the same grid connection charge; with the default 0, every option carries the "assumed" flag for it.
19. **Gensets:** by default, test-run energy per year = generators × 6 h × 75 % × unit rating; changing the test load changes only test energy, fuel, cost and Scope 1 carbon; with 0 primary-power hours the gensets never run in normal dispatch.
20. **Flexibility and batteries:** with flexibility off, results match the engine before this package apart from intended changes; with it on, curtailed energy never exceeds the maximum share × IT × maximum hours; with battery response, the economic battery serves trigger hours before any curtailment; the resilience reserve is never discharged for economic duties; battery capex for both allocations is in the ledger.
21. **O1:** every option with a PPA that cannot be delivered (no grid, islanded) carries the O1 flag, and the equivalent no-PPA option is preferred in the way the owner decides (OPEN-QUESTIONS 22).
22. **O2:** hourly CFE counts PPA energy only against grid energy used in that hour (checked against a hand calculation for one day of T1).
23. **O3:** the two PPA flags' shares of the undelivered PPA volume add up to 100 % (T1 leader as built on 2026-10-21: 140 MWh, 0.003 %, limited by import capacity; 4,475,228 MWh, 99.997 %, above the load).
24. **Results:** the first screen shows five cards with the content in §12.11, each stating its comparison set; the trade-off chart opens on cost (vertical) against carbon (horizontal) with resilience as bubble size and colour; compare holds up to 3 options; the tornado measures LCOE by default and its drivers come from the tick-box list.
25. **Dispatch:** dispatch views of any period are offered only for verified options, and every figure states its model (screening or verified).
26. **PDF:** one file, inputs first, then results, saved through a file dialog, with no Site tab content and no network connection.
27. **Site tab:** hidden by default; when turned on in the general settings it is labelled Beta; the ranking, the scores and the PDF are identical with it on or off; and no site-fit status, flag or penalty enters the ranking, the scores or "Rank requirement-compliant options first".

---

## 22. Out of scope

- Detailed electrical design: load flow, fault level, protection, harmonics, earthing, single-line diagrams beyond the concept schematic, transient behaviour of AI loads.
- Detailed mechanical design: cooling plant selection, CFD, hydraulic design, detailed PUE certification.
- Acoustic modelling beyond the distance-based proxy; air dispersion modelling; stack height determination.
- Fire engineering beyond flagged default separation distances.
- Structural, geotechnical, flood and drainage design; terrain and topography (flat site assumed).
- Architectural design of the data hall; the building is a massing block from density rules.
- Layout optimisation; the auto-layout is a heuristic, and the user arranges by hand where needed.
- Cost estimates beyond AACE Class 5 concept level; the data hall building and IT fit-out costs.
- Corporate finance: tax, debt sizing, depreciation, tariff structures beyond a flat non-commodity adder, PPA contract structuring, revenue stacking optimisation for BESS beyond the simple dispatch rule.
- Grid application, connection studies or confirmation of grid capacity; the tool takes the grid offer as input.
- Permitting determination; flags only.
- Emergency planning for nuclear; hydrogen safety cases; COMAH/Seveso assessments.
- Real-time or live market data feeds; any network connection from the program (data is prepared at each release; walkthrough, 2026-10-21).
- The phone version, and macOS and Linux downloads (walkthrough, 2026-10-21).
- Excel export (walkthrough, 2026-10-21).
- Multi-user collaboration, accounts, cloud storage; multi-site portfolio comparison.
- BIM/IFC or DXF export; GeoJSON and images only.
- Sites outside Europe with built-in data (possible via custom uploads, unsupported).
- Embodied carbon beyond optional indicative factors; full life-cycle assessment.
- Any statement that an option is approved, compliant, bankable or certified (e.g. Uptime Tier certification).

---

## 23. Guardrails (kept from v1, extended)

- All built-in figures are indicative defaults for concept-stage screening and must be replaced with project-specific data, quotes and specialist advice before any design freeze or investment decision.
- Every built-in figure shows its source and year, or is clearly marked "indicative — unverified". No unverified figure may be presented as sourced.
- **Label rule (applies to every default in this brief).** Every default value or state, whether a numeric input, a threshold, a weight, a penalty, a run setting (counts, caps, idle times, throttles, cluster counts, raster sizes, pool sizes, display counts), a view or ranking setting (on/off toggles, handling modes), an input-state default (for example "Unknown", "No", "None", "Off") or a choice default state (§8), is labelled **"indicative — unverified"** until the builder has verified it against a named source and filled its §18 record. The one label is used for all of them; the reason is recorded in the §18 `basis` field ("source", "run setting" or "judgement") and shown on hover, and may appear in brackets after the label in this brief, e.g. "indicative — unverified (run setting)". Run settings and judgement choices have no external source, so they keep the label permanently unless the client replaces them with a project-specific value (confidence A). Rows in this brief that do not repeat the label are still covered by this rule. Once a default is researched and approved by the owner, its label becomes "sourced — not independently checked" (owner decision, 2026-10-22; §18, OPEN-QUESTIONS 36).
- Constraints are flagged, never enforced, as defined in §2 principle 5. No option is excluded, hidden, demoted or resized by the tool because it breaches a constraint; a stated grid capacity is modelled as given and any shortfall is shown as flagged unmet load (§9.4). The only things that reduce what is generated, screened or shown are those listed in §2 principle 5 (compatibility rules for impossible combinations, values not generated by default or excluded by the user, "Sample above cap", user view filters and "Hide dominated options"), and no choice state changes automatically in response to results (§8 rules); each is always visible, reversible and listed in exports.
- All assumptions stay visible and editable; no number that drives the result is buried.
- Site layouts, schematics and noise figures are concept-stage proxies, labelled as such on screen and in exports.
- The tool is a decision-support aid. It does not give financial, engineering, planning, legal or safety advice.
- Guardrail sentence (shown in the footer, plain-English summary and every export): "Concept-stage screening only. Figures are indicative and must be verified with project-specific data and specialist advice before any design or investment decision. This tool is decision support, not financial or engineering advice."
