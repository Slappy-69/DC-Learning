# Changelog: v1 build prompt → v2 concept-design brief

v1 = "Build Prompt — Data Centre Campus Energy Strategy Tool" (PDF, 16 sections). v2 = `BRIEF.md`.
Section references: v1 §n / v2 §n.

## Kept (with reason)

| Item | v1 | v2 | Why kept |
|---|---|---|---|
| Client-side React SPA, all compute in the browser | §3 | §4 | No backend means easy deployment and sharing; data stays local |
| Responsive, keyboard-accessible, reduced motion | §3, §15 | §16, §17 | Still required; now measurable (WCAG 2.2 AA) |
| Sourced defaults with `{value, unit, source, year, url}` and "indicative — unverified" | §6 | §18 | User guardrail; extended with range and confidence fields |
| Technology set and maturity badges | §5 | §6 | Same core technologies; maturity drives the deliverability score |
| Per-country hourly profiles | §7 | §9.1, §18 | Still the basis for both model tiers |
| Explicit, adjustable merit-order dispatch | §7 | §9.4 | Transparent and already validated in the delivered v1 tool. Aligned to its six-step order including PPA over the grid connection |
| Bridging-period logic and grid capacity over time as a central driver | §4, §7, §15 | §5.4, §8 C1–C3, §9.8 | Load-bearing for data centre strategy; now feeds time-to-power too |
| Single cash-flow ledger; LCOE, NPV, capex/opex reconcile; CRF; escalation; high/central/low scenarios | §8, §15 | §9.5, §13.3 | Correctness principle from v1 |
| Demand flexibility settings | §4, §7 | §5.3, §8 C16 | Still a valid option lever |
| Revenue toggles (BESS, heat offtake) | §4, §8 | §5.6, §8 C15 | Still relevant |
| Archetype presets | §11 | §7.3 | Kept as reference options always generated; extended from 7 to 10 |
| Custom option builder | §11 | §7.4 | Engineers need to test their own configurations |
| Pareto frontier with weighted pick | §11, §12 | §12.2 | Core trade-off view |
| Tornado sensitivity | §12 | §13.3 | Kept and extended with breakevens |
| Plain-English recommendation (renamed "plain-English summary" in revision 2) | §12 | §14 | Kept, with a fixed structure including confidence and the most influential inputs; descriptive, not advisory |
| PDF and Excel export | §12 | §12.10 | Kept, with more formats added |
| Flag, never enforce | §12 | §2, §11, §15, §23 | User guardrail |
| Energy-source colour system as signature element | §13 | §16 | Now also used on site blocks and schematics |
| Plain copy rules | §13 | §16 | Unchanged |
| Decision-support-only guardrail | §16 | §23 | User guardrail; extended to cover layouts, schematics and noise proxies |

## Changed

| # | Change | v1 | v2 | Reason |
|---|---|---|---|---|
| 1 | Purpose reframed from "screening tool for a campus" to "concept-stage optioneering tool" | §1 | §1 | New goal: early-stage use with rough inputs; optioneering is the core |
| 2 | Primary output changed from a ranked list of presets plus one optimised answer to a generated option set (200–2,000 options) with user filtering and dominance marking | §11 | §7 | Optioneering requires many options with visible trade-offs, not one best answer |
| 3 | "Auto-optimise" (heuristic search over sizing) replaced by enumeration of design choices with rule-based sizing, optional Latin hypercube sampling above a cap (visible, switchable), and Pareto dominance marking (hiding is an opt-in view setting) | §11 | §7.2, §9.2 | Designers think in discrete choices (bridge or wait, which backup, which cooling), not continuous sizes. Enumeration makes every option explainable and gives the choice-impact view. The v1 optimiser was ~90 candidates in ~2.5 s, too slow for live iteration at concept stage |
| 4 | Single 8760 model replaced by a two-tier model: representative-day screening for all options plus 8760 verification for the shortlist | §7 | §9.1 | Fast iteration target (≤ 500 ms for 600 options) is not achievable with 8760 dispatch for every option. 8760 kept for accuracy where it matters |
| 5 | Resilience moved from a weighted axis to a requirement check (Meets / Meets with flags / Does not meet) that drives sizing | §4, §10, §11 | §2, §5.5, §9.7 | Matches the principle adopted in the delivered v1 tool; resilience is a design requirement, not something to trade against cost |
| 6 | Weight axes changed from Cost/Carbon/Resilience to Cost/Carbon/Time-to-power/Deliverability | §4 | §5.7 | Time-to-power and deliverability are major concept-stage decision drivers for data centres. Resilience became a requirement (change 5) |
| 7 | Load input changed from "IT MW + bridging period" to IT MW with phasing table, ramp, utilisation and workload type | §4 | §5.3 | Concept-stage campuses are phased; time-to-power needs a demand-over-time profile |
| 8 | Cooling type changed from a fixed input to an optioneering choice (C8) with effect on PUE, WUE, building footprint, heat reuse and cooling capex delta | §4 | §5.3, §8 | Cooling is a key concept-stage decision that interacts with the energy strategy and the site |
| 9 | PUE changed from climate band to an hourly temperature-driven model | §4 | §9.3 | Matches the delivered v1 tool and the user's earlier redirect |
| 10 | Grid input extended with stepped capacity profile, date uncertainty, export capacity, voltage, substation type and POC location | §4 | §5.4 | Needed for time-to-power, substation footprint and site layout |
| 11 | Point outputs replaced by ranges (P10/P50/P90) everywhere, with Monte Carlo, rank stability and a robust pick | §8, §12 | §13 | New goal: clear presentation of uncertainty; concept inputs are rough |
| 12 | Every input gets low/central/high, a distribution and a data-confidence tag (A/B/C) | §6 | §5, §13.1, §18 | Needed for uncertainty and to show how much of the result rests on unverified data |
| 13 | Land use changed from "ha/MW" per technology (a flag on total land) to a full spatial model with footprint, height, clearances, separations, placement zone | §5, §12 | §6.1, §6.3, §10 | New goal: show what fits on the site and where |
| 14 | Optimisation modes (presets / custom / auto) replaced by the Choices panel with open/locked/excluded per choice and a choice-impact chart | §11 | §8 | Exposes the designer's decisions directly and shows which ones matter |
| 15 | Results update model changed from "update on commit with debounce" to incremental recompute in Web Workers with cancellable jobs and throttled live slider updates | §3 | §4, §17 | New goal: fast iteration with measurable targets |
| 16 | "No browser storage" changed to "project JSON file is the source of truth; browser storage only for an optional autosave draft, wrapped in try/catch" | §3 | §4 | Concept work is iterative across sessions; needs save/reopen while staying robust without storage |
| 17 | Carbon metric extended from location-based average only to location-based, market-based, hourly CFE %, Scope 1/2 split, trajectory; user chooses the scored metric | §9 | §9.6 | Concept-stage clients often have 24/7 CFE or market-based targets |
| 18 | Build order restructured: site model in stage 2; verification, uncertainty and exports later | §14 | §20 | Site fit and fast screening are the core of the new goal |
| 19 | Definition of done extended with five reference test projects and measurable criteria | §15 | §21 | Makes acceptance testable without asking questions |
| 20 | Currency list kept; real-terms price base year added; capex class band (AACE Class 5) added as default uncertainty | §2, §4 | §5.1, §5.6 | Concept-stage cost estimates need a stated class and base year |
| 21 | Economics scope stated explicitly: excludes data hall shell and IT fit-out; includes cooling capex delta only | §8 | §9.5 | Options must be compared on their differences; the building is common to all |
| 22 | Recommendation given a fixed seven-part structure, deterministic templates, and user editing (renamed "plain-English summary" in revision 2) | §12 | §14 | Consistent and testable; avoids dependence on an external language model |

## Added (new in v2)

| # | Addition | v2 | Reason |
|---|---|---|---|
| A1 | Seven-step concept workflow with quick-start mode (≤ 6 required inputs, ≤ 5 minutes) | §3 | New goal: early-stage use with rough inputs |
| A2 | Site model: boundary drawing/import, setbacks, hard/soft exclusions, height zones, POC, gas main, access, receptors, off-site land | §5.2, §10.1 | Site-linked requirement |
| A3 | Building massing derived from IT load, density, gross-up, storeys | §5.3 | Building is the largest block; fixes the land left for energy plant |
| A4 | Auto-layout heuristic with fit statuses, unplaced tray and manual editing | §10.4, §10.5 | Show what fits and what does not |
| A5 | Site-fit outputs: area budget, height check, separations, noise proxy, roof use, expansion headroom | §10.6 | Concept-stage decisions on land and planning |
| A6 | 2D plan, optional 2.5D massing, small multiples | §10.7 | Podium/Forma-style spatial context |
| A7 | Twenty explicit optioneering choices (C1–C20) | §8 | "All optioneering choices a designer makes" |
| A8 | Time-to-power model with phasing timeline and power gap | §9.8, §12.6 | Speed to power is a primary data centre driver |
| A9 | Deliverability score with transparent formula | §9.9 | Captures maturity, permitting and supply risk in one axis |
| A10 | Flags catalogue including permitting triggers (IED/MCP thresholds, hazardous substances, noise, height) | §15 | Concept-stage permitting awareness without enforcing |
| A11 | Parallel coordinates, choice-impact chart, compare view, concept schematic, key quantities schedule | §12 | Optioneering and handover to cost and planning consultants |
| A12 | Breakeven table, rank stability, robust pick | §13 | Makes "what would change the answer" quantitative |
| A13 | Water (WUE) metric and flag | §9.6 | Cooling choice changes water use; increasingly a planning issue |
| A14 | Exports: project JSON, GeoJSON, presentation mode; decision log; snapshots; undo/redo | §12.10, §16, §19 | Iterative workshops and audit trail |
| A15 | Measurable performance and accessibility targets | §17 | Requested by the user; makes "fast iteration" testable |
| A16 | Explicit out-of-scope list | §22 | Requested by the user; prevents scope creep |
| A17 | Indicative spatial defaults table with sources to verify | §6.3 | Site fit needs footprints from day one |
| A18 | Optional Uptime-style tier label on the resilience requirement (label only, no effect on sizing, not certification) | §5.5 | Clients often state requirements in tier language; recording it avoids misreading, without implying certification |
| A19 | Optional Scope 2 shadow carbon price (off by default; shown as a separate cost line) | §5.6 | Some clients price grid carbon internally; off by default so the Cost axis reflects actual cash costs |
| A20 | One user-defined price/carbon scenario alongside high/central/low | §13.3 | Lets the user test a client's own view of prices without editing the defaults |
| A21 | Seeded PRNG determinism with a 1e-9 relative tolerance, seed saved in the project and exports | §4, §17 | Makes sampling and Monte Carlo results reproducible and testable (AC 10) while allowing floating-point differences between browsers |
| A22 | Project JSON schema version with step-by-step migration on load | §19 | Project files must reopen after app updates |
| A23 | Weight presets (Balanced, Lowest cost, Lowest carbon, Speed to market, Lowest risk) | §5.7 | Fast workshop switching between common client priorities; values indicative — unverified |
| A24 | Optional absolute scaling of axis scores against user-set anchors (off by default; relative scaling is the default) | §11 | Scores stop shifting when options are added; recorded in revision 3 (finding 22) |
| A25 | "Rank requirement-compliant options first" toggle (off by default, shown in header and exports) | §11; OPEN-QUESTIONS 11 | Lets users who want compliant leaders get them without breaking flag-not-enforce by default; recorded in revision 3 (finding 22) |
| A26 | "Auto-update uncertainty" setting (on by default; Monte Carlo reruns after 2 s idle) | §13.2 | Keeps ranges current during live workshops; can be switched off on slow machines; recorded in revision 3 (finding 22) |
| A27 | Run summary above the options list: compatibility rules with removed counts, "values not generated" note with Include controls, sampling state, dispatch handling modes | §12, §7.2, §8 | Makes every generation-stage reduction visible (revision 3, findings 1, 4, 5) |

## Removed

| Item | v1 | Reason |
|---|---|---|
| Resilience weight slider | §4 | Replaced by the requirement check (change 5) |
| Climate/temperature band input | §4 | Replaced by hourly temperature from location (change 9) |
| "Auto-optimise" heuristic sizing search as a mode | §11 | Replaced by enumeration and dominance (change 3). Users can still sweep a size as a numeric choice |
| Instruction "do not stub the dispatch engine" as a stand-alone rule | §1 | Superseded by the two-tier model and acceptance criteria 2 and 4, which require both tiers to be real |

---

## Revision 2 (2026-10-15): verifier findings

39 findings (1 high, 22 medium, 16 low; header corrected in revision 3, finding 21). All 39 fixed; none declined. "IU" below = marked "indicative — unverified" with "no source" stated. No sources or years were invented: where a source is named it is a *source to verify against*, and where a revision or year is unknown the brief says the builder must confirm it.

| Finding | Sev. | Change | Where |
|---|---|---|---|
| 34 | High | Dominance filter no longer hides anything by default. Dominated options get a badge and stay in every view. "Hide dominated options" is a user view setting, **off** by default, visible in the header strip and exports, one click to reverse; custom and pinned options are never hidden. Ranking now covers all screened options | BRIEF §2 p5, §3 step 6, §7.2 step 6–7, §7.4, §12 header, §21 AC 7, §23; ASSUMPTIONS M3; OPEN-QUESTIONS 2, 17 |
| 35 | Med | Sampling above the cap is a visible run setting "Sample above cap: On / Off", shown with projected counts and time estimates before generation; switching it off screens every combination; nothing deleted; archetype, custom and pinned options always kept; state in exports | BRIEF §2 p5, §7.2 step 4, §23 |
| 36 | Med | Dispatch gets two switchable handling modes. Grid capacity: "Physical limit" (default; shortfall becomes flagged unmet load) or "Report exceedance". Run-hours: "Flag only" (default) or "Respect limit". Both always flagged; neither hides options. Flag catalogue updated to match | BRIEF §9.4, §15 Grid row, §5.5; ASSUMPTIONS M17; OPEN-QUESTIONS 16 |
| 37 | Med | C11 wind changed from "locked None" to a default state with an info flag naming the reason and how to open it; 20 ha threshold editable and IU | BRIEF §8 C11, §15 Technology row, §21 AC 13; ASSUMPTIONS M19 |
| 38 | Med | Capex and land-take ceilings, and carbon and time-to-power targets, given stated flag-only behaviour (thresholds, severities, comparison basis) and a new "Targets and ceilings" flag category. §3 "budget ceiling" renamed to match §5.5 | BRIEF §2 p5, §3, §5.5, §11, §15 |
| 1 | Med | Breakeven default scope defined as 5 competitors (runner-up, then best of each other archetype, topped up by rank) × 8 drivers (largest tornado swing), matching §17; user can change counts, target applies to default only | BRIEF §13.3, §17 |
| 2 | Med | Example counts changed to "2,000 of 5,184" and the step now says the cap is reached only when the user opens extra choices or sweeps, so it no longer conflicts with 200–600 per default run | BRIEF §7.2 step 4 |
| 3 | Med | Kept the block rule and corrected the example: 27 units → 3 blocks → +3 → 30 units. Rule rewritten as formulas (N, B, totals for N+1, 2N, catcher) with a note that block size ≥ N gives classic N+1 | BRIEF §9.2 |
| 6 | Med | Site-fit penalty in deliverability is now optional and off by default, so by default deliverability excludes site fit as §5.7 says; when on, the axis is relabelled. Single definitions added: effective weights w = raw / Σ raw (§5.7) and scoring scope = all screened options regardless of view filters (§11). Monte Carlo set and M6 aligned | BRIEF §5.7, §9.9, §11, §13.2; ASSUMPTIONS M5, M6 |
| 7 | Med | Boundary setback 10 m marked IU | BRIEF §5.2; ASSUMPTIONS S5 |
| 10 | Med | IT load ±20 % marked IU | BRIEF §5.3; ASSUMPTIONS M18 |
| 15 | Med | Grid date −6/+24 months marked IU and counted as a C-tagged driver in the header strip | BRIEF §5.4; ASSUMPTIONS M12; OPEN-QUESTIONS 15 |
| 16 | Med | Gas capacity default marked IU; info flag "gas capacity and date assumed, not confirmed" while at default | BRIEF §5.4, §15; ASSUMPTIONS M18 |
| 17 | Med | Resilience default marked IU (practitioner starting point, no source) | BRIEF §5.5; ASSUMPTIONS M7; OPEN-QUESTIONS 7 |
| 19 | Med | WACC 7 % marked IU, no source and no year stated | BRIEF §5.6; ASSUMPTIONS M9 |
| 20 | Med | Evaluation period 20 years and contingency 10 % marked IU | BRIEF §5.6; ASSUMPTIONS M9 |
| 21 | Med | Escalation default now says it derives from the §18 price and carbon sources (forward curves, then flat real) and is IU until source records are filled; no source named | BRIEF §5.6 |
| 22 | Med | AACE Class 5 linked to AACE Recommended Practice 18R-97 as the source to verify; revision and year left for the builder to confirm; −30/+50 % stated as a point within that practice's range and IU | BRIEF §5.6; ASSUMPTIONS M9 |
| 23 | Med | Weights 35/25/25/15 and all presets marked IU (judgement, no source) | BRIEF §5.7; ASSUMPTIONS M5; OPEN-QUESTIONS 3 |
| 24 | Med | Backup block size 10 units and test runs 12 h/yr at 75 % marked IU; catcher `n` given a default (4, IU); M14 extended to cover block size | BRIEF §9.2, §9.4; ASSUMPTIONS M14 |
| 25 | Med | Deliverability penalty values marked IU; score floored at 0 | BRIEF §9.9; ASSUMPTIONS M11 |
| 33 | Med | Made consistent on EU IED/MCPD thresholds for every built-in country with no national variation built in; non-EU countries get a "proxy, check national equivalent" note. §15 "IED / national equivalent" and §5.5 "country defaults" removed. Directive numbers named as sources to verify | BRIEF §5.5, §15; ASSUMPTIONS D4; OPEN-QUESTIONS 9 |
| 39 | Med | "Recommendation" renamed "plain-English summary" throughout BRIEF; part 7 "Next steps" replaced by descriptive "Inputs with most influence"; banned directive phrases listed and tested (AC 12) | BRIEF §1.3, §3, §11, §12.9, §12.10, §13.2, §14, §16, §17, §20, §21, §23 |
| 4 | Low | Stated that the ≤ 5 min target applies to quick-start mode only, gave the quick-start form a ≤ 2 min input target, and stated the full-stepper sum (3.5–5.5 min to first options) as not held to the target | BRIEF §3, §17 |
| 5 | Low | Phone breakpoint changed to 360–767 px (below 360 px untested) | BRIEF §16 |
| 8 | Low | Height limit 25 m marked IU | BRIEF §5.2; ASSUMPTIONS S5 |
| 9 | Low | Roads/parking/landscaping 15 % marked IU | BRIEF §5.2; ASSUMPTIONS S5 |
| 11 | Low | Ramp 50 %→100 % over 12 months marked IU | BRIEF §5.3; ASSUMPTIONS M18 |
| 12 | Low | Utilisation 80 % marked IU | BRIEF §5.3; ASSUMPTIONS M18 |
| 13 | Low | Storeys, storey height, roof plant zone marked IU | BRIEF §5.3; ASSUMPTIONS S3 |
| 14 | Low | Roof plant fraction 40 % and ancillary 2 % marked IU; roof plant fraction to use the heat-rejection footprint where larger | BRIEF §5.3; ASSUMPTIONS M18 |
| 18 | Low | UPS ride-through 5 min marked IU | BRIEF §5.5 |
| 26 | Low | ±20 % performance range marked IU | BRIEF §13.1; ASSUMPTIONS M18 |
| 27 | Low | Tier label recorded (A18); clarified it does not change sizing | CHANGELOG; BRIEF §5.5 |
| 28 | Low | Scope 2 shadow carbon price recorded (A19); behaviour when on stated | CHANGELOG; BRIEF §5.6 |
| 29 | Low | User-defined scenario recorded (A20) and defined (multipliers plus optional overrides, saved in project) | CHANGELOG; BRIEF §13.3 |
| 30 | Low | Seeded determinism and tolerance recorded (A21); §4 now cross-references the §17 tolerance and names the stochastic steps | CHANGELOG; BRIEF §4 |
| 31 | Low | Schema version and migration recorded (A22) and specified (integer version, stepwise migration, newer-file read-only) | CHANGELOG; BRIEF §19 |
| 32 | Low | Weight presets recorded (A23) | CHANGELOG |

Also added: a blanket rule in the BRIEF conventions that any unsourced numeric default is indicative — unverified even where its row does not repeat the label. This covers values the verifier did not list individually.

### Judgement calls in revision 2

- **Grid capacity stays a physical limit by default (#36).** *(Superseded in revision 3, finding 2: the mode is renamed "Show unmet load" and §2 principle 5 now defines enforcement so that modelling a stated input is not enforcement.)* **Original reasoning:** Import above an offer is not available in reality, so treating it as a soft cap by default would overstate grid-dependent options. Enforcement in dispatch is kept, but it never hides or excludes an option: the shortfall shows as flagged unmet load, and "Report exceedance" is one setting away.
- **"Sample above cap" defaults to On (#35).** Off would break the §17 timing targets when users open many choices. It never acts on a default run, and it is shown before generation.
- **"Hide dominated options" defaults to Off (#34).** This follows the principle literally at the cost of longer lists. Logged as OPEN-QUESTIONS 17.
- **Site-fit penalty made optional and off (#6)** rather than removing site fit from §5.7's exclusion or deleting the penalty. This keeps the feature for users who want it.
- **#3 fixed by correcting the example, not the rule.** Per-block N+1 is the more conservative rule for large genset farms.
- **#39 renamed the feature** rather than only rewording part 7, because a "Recommendation" label is itself advice language.

---

## Revision 3 (2026-10-15): verifier findings (Haiku check 2)

22 findings (1 high, 9 medium, 12 low). All 22 fixed; none declined. "IU" = marked "indicative — unverified" with "no source" stated. No sources, years or editions were invented: where a year is unknown the brief now says so and leaves it for the builder to fill in the §18 source record.

| Finding | Sev. | Change | Where |
|---|---|---|---|
| 2 | High | **Resolution: the default dispatch mode models the stated grid capacity as an input, and that is defined as not enforcement.** §2 principle 5 now holds the single definition of "enforce" (the tool excluding, hiding, demoting or resizing an option because it breaches a constraint) and says that modelling a stated input as given is not enforcement. The default grid mode is renamed from "Physical limit" to **"Show unmet load"**: import serves demand up to the capacity entered, demand no source can serve is recorded as unmet load, shown (option card, ranking column, phasing timeline) and flagged major, and the option keeps its sizing, score and place in every view. No cost penalty is added; unmet load affects the score only through the time-to-power power gap. **"Show exceedance"** (renamed from "Report exceedance") stays selectable and shows its state in the header strip. Rest of the brief made consistent: §9.4 step 5 wording, §15 Grid row, §23 guardrail, new AC 14, ASSUMPTIONS M17, OPEN-QUESTIONS 16, and the revision 2 judgement call marked superseded | BRIEF §2 p5, §9.4, §15, §21 AC 14, §23; ASSUMPTIONS M17; OPEN-QUESTIONS 16; CHANGELOG rev 2 judgement calls |
| 1 | Med | Compatibility rules are now the one stated exception in principle 5 (logically impossible combinations only). §7.2 step 2 lists the four built-in rules and requires each to appear by name in the run summary with the count it removed; listed in the methodology export; new "Generation" flag category (info) | BRIEF §2 p5, §7.2 step 2, §12 run summary, §15; ASSUMPTIONS M22 |
| 3 | Med | Principle 5 now lists everything that can reduce what is generated, screened or shown: compatibility rules, default values not generated, "Sample above cap", user view filters (site fit, resilience, flag, capex/land-take ceiling, dominated status, brushing) and "Hide dominated options". It states that view filters, brushing and hiding never change any score or rank, that the three generation items change the scoring set (and the scope note says so), and that "Rank requirement-compliant options first" is the only setting that changes order without changing scores. §11 filter line aligned | BRIEF §2 p5, §11 |
| 4 | Med | C11 wind default made a visible default: info flag on the C11 row and in the run summary's "values not generated" note, each with an "Include wind" control; the user can include it on any site. AC 13 extended to test the control | BRIEF §8 C11, §12, §21 AC 13; ASSUMPTIONS M19 |
| 5 | Med | New §8 rule "Values not generated": every choice whose default omits values (open subset, locked, or C11 default) is listed in the run summary with the omitted values and an "Include" control (projected count shown first); user exclusions listed as "excluded by user"; in every export; archetypes unaffected. New §12 run summary specified to hold it | BRIEF §2 p5, §8 rules, §12, §21 AC 13; ASSUMPTIONS M22 |
| 7 | Med | Q4 renamed to "The plain-English summary is template-generated" | ASSUMPTIONS Q4 |
| 8 | Med | "recommended default" → "proposed default" (intro and column header); "the recommendation" → "the plain-English summary" (OQ 3); "template-based recommendation" → "template-based plain-English summary" (OQ 12). BRIEF line 4 companion-file note changed to "proposed defaults" for consistency | OPEN-QUESTIONS intro, header, 3, 12; BRIEF header |
| 13 | Med | Connection voltage band edges 20 MW and 150 MW marked IU, to be replaced with local DSO/TSO practice | BRIEF §5.4; ASSUMPTIONS S11 |
| 14 | Med | Carbon price marked IU: no year or forward-curve date stated; §18 row named as source to verify (EU ETS / UK ETS exchange data, official projections); builder fills year | BRIEF §5.6 |
| 15 | Med | Grid import price, grid carbon intensity and gas commodity price each marked IU with "no year stated", the §18 source row named as source to verify, and the builder to fill the year | BRIEF §5.4 |
| 6 | Low | Archetype 10 split into SMR and hydrogen variants; text states archetypes are generated whatever the choice defaults, and the hydrogen variant is flagged "hydrogen supply unavailable at current inputs" while hydrogen availability is No. §5.4 hydrogen row, §7.2 step 2 and §15 Fuel row updated to match | BRIEF §5.4, §7.2, §7.3, §15; ASSUMPTIONS M20 |
| 9 | Low | §16 copy rule reworded: empty and error states "say which inputs most affect the result and where they are entered", with a non-directive example | BRIEF §16 |
| 10 | Low | OPEN-QUESTIONS 16 cited in §9.4 (constraint handling) and OPEN-QUESTIONS 17 in §7.2 step 6; OQ 16 and 17 now cite back to the BRIEF sections | BRIEF §7.2 step 6, §9.4; OPEN-QUESTIONS 16, 17 |
| 11 | Low | Aspect ratio 1.5:1 marked IU, no source | BRIEF §5.2; ASSUMPTIONS S10 |
| 12 | Low | Analysis start "today + 3 months" marked IU, no source | BRIEF §5.1; ASSUMPTIONS S10 |
| 16 | Low | Raster cell 2 m / 5 m and the 50 ha switch marked IU and described as run settings for the §17 layout timing | BRIEF §10.4; ASSUMPTIONS M21 |
| 17 | Low | Noise threshold 45 dB(A) marked IU in BRIEF and ASSUMPTIONS | BRIEF §10.6; ASSUMPTIONS S6 |
| 18 | Low | "Run setting — not a source-based default" added to the 2,000 cap, 300 samples, top 20 and 2 s idle; also added to the verification top 10 and 1 s idle in §9.1 (same kind of value) | BRIEF §7.2 step 4, §9.1, §13.2; ASSUMPTIONS M21 |
| 19 | Low | Correlation groups now "Indicative — unverified: no source" | BRIEF §13.1; ASSUMPTIONS M13 |
| 20 | Low | §17 states 500 ms is the target and 1.0 s the ceiling (acceptance limit) for screening or re-screening 600 options; both rows now read "Target ≤ 500 ms; ceiling ≤ 1.0 s" | BRIEF §17 |
| 21 | Low | Revision 2 header corrected to "1 high, 22 medium, 16 low" (counted from the table) | CHANGELOG rev 2 |
| 22 | Low | Confirmed all three are part of the brief. Recorded as additions A24 (absolute scaling), A25 (rank compliant first) and A26 (auto-update uncertainty); §11 now lists them together with their defaults and says each shows in the header strip when not at default | CHANGELOG Added; BRIEF §11 |

### Judgement calls in revision 3

- **Finding 2: redefine and rename rather than change the arithmetic.** The verifier asked for a default where dispatch may show unmet load with the shortfall flagged. The revision 2 default already produced exactly that arithmetic; the conflict was the name "Physical limit" and the phrase "enforcing" against principle 5. So the fix defines enforcement once (acting on the option: exclude, hide, demote, resize) and renames the default mode "Show unmet load". The alternative, making uncapped import the default, was rejected: it would serve energy the stated grid offer does not provide and make grid-dependent options look better than the input allows. "Show exceedance" stays selectable for users who want to see grid dependence.
- **No cost penalty for unmet load.** A value-of-lost-load penalty would be a hidden enforcement through the score and needs a sourced value. Unmet load enters the score only through the existing time-to-power power gap, and is shown and flagged.
- **Compatibility rules kept as an exception** rather than generating impossible combinations and flagging them, because an impossible combination cannot be sized, placed or costed. The exception is narrow (logically impossible only), named and counted.
- **A new run summary panel** (A27) holds the generation-stage notes, rather than putting them in the header strip, which is already dense.

---

## Revision 4 (2026-10-15): Opus review of checks 1–3

Scope: an independent review of the 17 Haiku check 3 findings, a check that checks 1 and 2 (39 and 22 findings, fixed in revisions 2 and 3) missed nothing material, and a check that no finding was raised on text that does not say what the verifier claimed. Backups of the pre-revision files are kept outside the brief folder.

**Result:** 16 of the 17 check 3 findings accepted (F-02 to F-05 at lower severity; F-13 in part) and 1 rejected (F-08; its row was clarified anyway). 16 fixes for accepted findings plus 8 fixes for issues all three checks missed (R4-1 to R4-8): 24 fixes in total. Superseded wording: revision 3 finding 18 introduced the label "run setting — not a source-based default"; revision 4 replaces it with the single label below.

### Label rule adopted

One label for every unverified default: **"indicative — unverified"**. The reason sits in a new §18 `basis` field ("source", "run setting" or "judgement") and may follow the label in brackets, e.g. "indicative — unverified (run setting)". The rule is stated once, in §23, and covers numeric inputs, thresholds, weights, penalties, run settings, view and ranking settings, handling modes, input-state defaults and choice default states. The conventions and §5 intro point to it. New AC 15 tests it.

### Check 3 decisions

| Finding | Haiku sev. | Decision | Reasoning (one line) | Change | Where |
|---|---|---|---|---|---|
| F-01 | Med | Valid | Revision 3 used a second label ("run setting — not a source-based default") that the conventions do not define, so a builder could not tell whether run settings show the "indicative — unverified" label | All five instances relabelled "indicative — unverified (run setting)"; label rule stated once in §23; `basis` field added to the §18 record | BRIEF conventions, §7.2 step 4, §9.1, §13.2, §18, §23; ASSUMPTIONS M21 |
| F-02 | Med→Low | Valid, lower severity | The blanket rule (conventions) already made the 5 % band indicative — unverified, so there was no provenance gap; but with F-01's mixed labels the right label was unclear | Labelled "indicative — unverified (judgement)", editable | BRIEF §13.2 |
| F-03 | Med→Low | Valid, lower severity | As F-02: covered by the blanket rule but not explicit | Labelled "(judgement)", editable | BRIEF §9.1 |
| F-04 | Med→Low | Valid, lower severity | As F-02; also M1 named the accuracy assumption but not the cluster count as a run setting | Labelled "(run setting)"; cluster count editable for uploaded profiles | BRIEF §9.1; ASSUMPTIONS M21 |
| F-05 | Med→Low | Valid, lower severity | As F-02 | Tornado top 12 and breakeven scope labelled "(run setting)"; tornado count editable 1–30 | BRIEF §13.3; ASSUMPTIONS M21 |
| F-06 | Low | Valid | Run settings with no label, same class as F-01 | Worker pool bounds and 150 ms throttle labelled "(run setting)" | BRIEF §4; ASSUMPTIONS M21 |
| F-07 | Low | Valid | The blanket rule covers numeric values only; the C12 default subset and default role are judgement choices not covered by it, and the default role was not stated at all | Default role stated ("peak-shave against grid cap"); subset, ratings, durations and role labelled "(judgement)"; new §8 rule labels every choice default state | BRIEF §8 C12, §8 rules |
| F-08 | Low | Not valid as raised | Conventions line 10 states that no years or editions are given unless known, and the directive numbers carry their adoption years; the consolidated-text date is a §18 field for the builder | No fix required. Row clarified anyway: the builder records the consolidated version date and checks whether the 2024 IED revision changes the threshold; row labelled "indicative — unverified (source pending)" | BRIEF §5.5 |
| F-09 | Low | Valid | On/off and mode defaults are not numeric, so the blanket rule did not cover them | Each labelled "(judgement)" where defined; covered by the §23 rule and AC 15 | BRIEF §7.2 steps 4 and 6, §9.4, §11, §23 |
| F-10 | Low | Valid | "Unknown", "No", "None", "Off" defaults are judgement choices with no label | §5 intro states that non-numeric input defaults are "indicative — unverified (judgement)" and lists them; covered by §23 and AC 15 | BRIEF §5 intro, §23, §21 AC 15 |
| F-11 | Med | Valid | min(grid capacity, demand − firm) sets the option's connection by clamping to the constraint, which matches "resizing an option because it breaches a constraint" in principle 5, and it hid the shortfall inside the sizing | Grid connection = offered capacity per period for every option, never resized; shortfall at design load shown in the Sizing panel and dispatched as unmet load (§9.4); connection capex on offered capacity; smaller contracted capacity only by user override on a custom option. C1 Islanded clarified to match. New info flag; AC 14 extended; OPEN-QUESTIONS 18 records the capex trade-off | BRIEF §2 p5, §5.4, §8 C1, §9.2, §15, §21 AC 14; ASSUMPTIONS M23; OPEN-QUESTIONS 18 |
| F-12 | Low | Valid | §8 rules list user exclusions in the "values not generated" note, but principle 5's list (which claims to be complete) did not name them | Principle 5 item renamed "Values not generated" and now names user-excluded and locked-out alternatives; §23 matches | BRIEF §2 p5, §23 |
| F-13 | Low | Valid in part | No stated rule bans these texts (the §14 ban covers the summary and "check" is not a banned phrase), but permitting flags are copied into summary part 6, so directive wording would enter the summary | Reworded descriptively: "national equivalent not checked by this tool"; "Screening flag, not a permitting determination" | BRIEF §5.5, §15 |
| F-14 | Low | Valid | The rename note mentioning "Physical limit" is change history, which belongs in CHANGELOG, and the old name now appeared in the builder's spec | Sentence removed from §9.4 (history stays in CHANGELOG revisions 2–3) | BRIEF §9.4 |
| F-15 | Low | Valid | "Flags to resolve" is a directive heading inside the summary that §14 requires to be descriptive | Renamed "Open flags on the leader", stated descriptively | BRIEF §14 |
| F-16 | Low | Valid | Revision 2 row 39 says "plain-English summary" was applied throughout including §17, but §17 said only "summary" | §17 row now says "plain-English summary"; this revision records the correction (row 39 left as written for the audit trail) | BRIEF §17 |
| F-17 | Med | Valid | "Auto-opens when any option does not fit" changes the generated option set (and so the scoring set) automatically, which principle 5's list does not allow and no CHANGELOG entry recorded | C17 and C18 no longer open automatically; defaults AIS and single-deck appear in the "values not generated" note with an "N options do not fit" note beside the Include control; new §8 rule "No automatic change of the option set"; AC 7 updated | BRIEF §8 C17, C18, rules, §21 AC 7, §23; ASSUMPTIONS M24 |

### Issues all three checks missed (fixed in this revision)

| ID | Issue | Change | Where |
|---|---|---|---|
| R4-1 | Hazardous-substance flag said "above a threshold" with no threshold value, so a builder could not implement it | Threshold row added: hydrogen 5 t, diesel/HVO 2,500 t, as proxies from Seveso III lower-tier quantities, "indicative — unverified (source pending)", builder to verify the current text, its date and whether HVO falls under the petroleum products entry | BRIEF §5.5, §15; ASSUMPTIONS D6 |
| R4-2 | Bridging capacity formula "× (1 + redundancy margin, default N+1 at unit level)" multiplies MW by a topology label and cannot be computed | Rewritten as a unit count with the same block rule as backup units; sized to the largest shortfall; BESS + solar bridging default 24 h labelled "(judgement)" | BRIEF §9.2 |
| R4-3 | BESS peak-shave "size to keep import ≤ grid cap" implied the tool resizes BESS to a constraint, the same conflict as F-11 | C12 size kept as given; dispatch uses it; minor flag if it cannot hold import within capacity | BRIEF §9.2, §15 |
| R4-4 | §3 step 5 "Re-sizes backup and firm plant to the requirement" reads as resizing against principle 5's definition | Reworded to re-applying the §9.2 sizing rules to every option; principle 5 now states that sizing every option by the same rule from a stated requirement, before any check, is not enforcement | BRIEF §2 p5, §3 |
| R4-5 | C11 info flag ended "Open C11 to include wind options", directive in the same way as F-13 | Reworded "Wind options are available through C11" | BRIEF §8 C11 |
| R4-6 | Deviation flag text "use the verified figures" is directive | Reworded "...differ by more than 5 %; the verified figures are the full-year result" | BRIEF §9.1 |
| R4-7 | C1 "Islanded (grid as backup or none)" left the grid connection undefined, which the F-11 fix depends on | Islanded keeps the offered capacity as a backup connection not dispatched in normal hours; no-grid sites are modelled as 0 MW | BRIEF §8 C1, §9.2 |
| R4-8 | Conventions defined "indicative — unverified" only as a value awaiting source checks, which cannot apply to run settings | Definition widened and pointed to the §23 rule | BRIEF conventions |

### Verifier soundness

- **No finding was raised on text that does not exist.** Every check 3 finding quotes or describes text that was in the revision 3 brief (checked line by line against the backup copy).
- **Check 3 judgement errors:** F-02 to F-05 were rated medium as missing labels without accounting for the blanket rule in the conventions, which already made those numeric values indicative — unverified; the real defect was the ambiguity from F-01 (downgraded to low). F-08 asked for a year the conventions explicitly leave to the builder (rejected). F-13 described the flag texts as breaching a rule; no stated rule banned them (accepted in part on a different basis).
- **Checks 1 and 2 missed:** R4-1 to R4-8 above. R4-3, R4-4 and R4-7 are the same class as F-11 and were present before check 2's finding 2 introduced the definition of "enforce"; check 2 tested dispatch against that definition but not sizing. R4-5 and R4-6 are the same class as check 2's directive-wording findings (7, 8, 9) and were not caught.
- **Fix-induced defect:** F-01 was introduced by the revision 3 fix for check 2 finding 18, not by a verifier; the new label was added without updating the conventions.

### Judgement calls in revision 4

- **F-11: full offered capacity, not demand-sized.** Making the connection equal to the offered capacity removes the clamp to the constraint and makes the shortfall visible. Trade-off: every grid-using option now carries the same connection capex, so options with a lot of firm on-site plant no longer save on connection capex. Logged as OPEN-QUESTIONS 18; a user can set a smaller contracted capacity on a custom option.
- **One label with a recorded basis rather than two labels.** Keeps the UI and AC 9 test simple; the brackets carry the reason without creating a second label.
- **C17/C18: note instead of auto-open.** This keeps the help on tight sites (the "N options do not fit" note next to Include) without changing the option set by itself.

## Revision 5 (2026-10-21): the owner's user-workflow walkthrough

Scope: the owner and Claude walked through the whole user workflow on 2026-10-21, one decision at a time. The decision log is `../docs/walkthrough-decisions-2026-10-21.md` (a copy of the owner's project document). This revision folds every decision into the brief. Changed text in `BRIEF.md` is marked "(walkthrough, 2026-10-21)", with the earlier rule kept as "before revision 5" where a builder could otherwise be confused by the code. Nothing in the app was changed.

| # | Change | BRIEF sections | Decision log section |
|---|---|---|---|
| 1 | Audience: data centre consultancies in general, not one firm; the repository stays public | §1.3 | Audience and principles |
| 2 | Platform: Windows program only, no network connection; phone dropped; single HTML file kept for testing | §4, §16, §17, §22 | Site and location; Repo state |
| 3 | New principle 10: works at any level of knowledge. Only location and site area are required; every value not entered is flagged on each option that uses it, with its source ("assumed default" flag) | §2, §3, §5, §15, §17, §21 AC 16 | Audience and principles |
| 4 | Location by a pin on a bundled offline map (Protomaps PMTiles, Europe, roads level); country from the pin; currency per site | §3, §5.1, §10.2, §18 | Site and location; Economics |
| 5 | Site area is one number; the Site tab becomes a Beta feature (hidden by default, general-settings switch, labelled Beta, out of the ranking and the PDF). Principle 3 "Spatial by default" replaced | §1.1, §2, §3, §5.2, §8 rules, §9.9, §10, §11, §12, §21 | Site and location |
| 6 | Climate: nearest ASHRAE station for design temperatures (flagged); NOAA hourly records or an uploaded EPW file | §5.1, §9.3, §18 | Site and location |
| 7 | Grid values can be "Not known" and then use country defaults (flagged); the bridging period can be known or not | §3, §5.4, §9.8 | Site and location; Demand |
| 8 | IT load estimated from area when not entered (35 % coverage, 1 storey, 5.5 kW/m² of floor; research) | §5.3, §18 | Demand |
| 9 | Load shapes (flat, fluctuation, AI training, AI inference) with the sub-hour caveat | §5.3, §15 | Demand |
| 10 | Flexibility parameters and triggers; battery response sized to the historical trigger hours; battery split into resilience reserve and economic battery; battery capex in the ledger | §5.3, §5.5, §5.6, §8 C12 and C16, §9.2, §9.4, §9.5 | Demand |
| 11 | Resilience default kept (N+1, 100 % of IT); autonomy from fuel, batteries or both; gensets included by default, 6 h/yr tests at a separate 75 % test load, optional primary-power hours | §5.5, §6.2, §9.2, §9.4, §9.7 | Requirements |
| 12 | Weights 35/25/25/15 provisionally accepted; effect of each weight change described live; repaint target relaxed | §3, §5.7, §11, §17 | Requirements |
| 13 | Cooling type chosen by the engineer, with typical PUE and maximum demand offered (C8 locked) | §3, §5.3, §7.3, §8 C8, §9.3 | Economics |
| 14 | Economics: several evaluation periods; WACC 7 % real (judgement); latest EU ETS price and latest wholesale gas price with dates; published escalation forecasts; revenue options off | §5.4, §5.6, §9.5 | Economics |
| 15 | Grid: contracted capacity per option set by the engineer; one fixed grid connection charge for every option; connection capex default 0 with the country value shown | §2, §5.4, §9.2, §9.5, §21 AC 14 and 18 | Economics; Grid capacity |
| 16 | PPA and carbon rules O1 (flag undeliverable PPA, prefer no-PPA), O2 (hourly CFE matching), O3 (two `grid-ppa` flags with shares); open decision 1 ("Does not meet" stays) | §8 C13, §9.6, §9.7, §11, §15, §21 AC 21–23 | PPA and carbon rules |
| 17 | Results: top five cards; trade-off chart cost (vertical) against carbon with resilience bubbles; compare up to 3; dispatch for any period of verified options; tornado with a tick-box driver list, LCOE by default | §12, §12.11, §12.13, §13.3, §21 AC 24–25 | Results |
| 18 | Export: one PDF, inputs first, results after; no Excel | §12.10, §22, §21 AC 26 | Results |
| 19 | General settings page with the Site tab (Beta) switch | §12.12, §21 AC 27 | Site and location |
| 20 | Build order replaced by the implementation order recorded at the end of the walkthrough (stages of revisions 1–4 kept for reference); to confirm with the owner before the first package | §20 | Project handoff note (`claude/handoff-concept-tool.md`, 2026-10-21) |
| 21 | Research before the first release listed with the data sources | §18 | Open research |
| 22 | Acceptance tests 16–27 added for the decisions; AC 7, 11, 12 and 14 adjusted | §21 | All |

### Open questions added

Questions 19–35 in `OPEN-QUESTIONS.md`: the details the walkthrough left open (contracted capacity of generated options, the connection charge for islanded options, which evaluation period scores, how O1 ranks, the representative-day method, the top-five comparison set, the land budget with the Site tab hidden, the density rule, saving a study, cooling before a choice, screen structure, run progress, known issues, PDF sections, C12 and the economic battery, flexibility in the merit order, the repaint target). They carry no proposed default: the owner decides them one at a time. Questions 1–18 now record what the walkthrough did to each.

### Judgement calls in revision 5

- **Edit in place rather than a separate addendum.** One brief to read, with the section numbers the code and build notes already cite. Changes are marked so they can be found.
- **"As built" stated next to changed rules** where the code still follows the earlier rule, so a builder reading the code is not misled.
- **Grid connection charge read as the connection capex.** The decision log has "grid connection capex and reinforcement: default 0" and "grid connection charge: fixed, the same for every option". Open question 18 asked about "the same connection cost", so the two are read as one charge. This is an interpretation: whether they are one charge, and how it is entered, is open question 20.
- **Defaults stated only where the walkthrough or the built program gives one.** For example contracted capacity "the full offer (as built)" and primary-power hours "0 h" (as built, backup gensets never run in normal dispatch). Where neither gives one, the point is an open question with no proposed default.
- **Acceptance tests 16–27 are proposals.** They test the decisions as recorded; the details of each are to confirm with the owner when its work package starts.

### Verifier findings (Haiku check, 2026-10-22)

An independent Haiku check of revision 5, the build plan, the known issues, `STATUS.md` and `CLAUDE.md` against the decision log and the code found twelve points. All were confirmed and fixed:

1. O1: the interim rule now says the option carries the O1 flag and no preference is applied until question 22 is answered; question 22 notes that a demotion or hiding by default would be an exception to principle 5.
2. Tornado: the drivers built today were listed wrongly. As built: grid connection date, grid price, grid carbon, gas price, carbon price, WACC, IT load (§13.3, build plan package 9).
3. NOAA weather: the decision log says the app cleans the raw hourly data; when and how is research (§5.1, §9.3, §18). It was shown as decided ("prepared at each release").
4. "As built" labels: the load shape as built is a gentle daily cycle, not flat (§5.3); primary-power hours have no input yet, and backup gensets never run in normal dispatch (§5.5).
5. Known issue 6: the IT estimate's coverage, storeys and density are research values, not agreed figures.
6. `CLAUDE.md`: the defaults rule now matches the labels in use ("indicative — unverified" until researched).
7. `STATUS.md`: "verified" now names the unfinished packaging review and the known issues.
8. §11 ranking: the earlier rule is marked, with the walkthrough change and the as-built behaviour next to it.
9. Build order: its source is the project's handoff note written at the end of the walkthrough; confirm the order with the owner before the first package.
10. Grid connection charge and capex: reading them as one charge is an interpretation; question 20 now asks it.
11. AC 27: also tests that no site-fit status, flag or penalty enters the ranking.
12. Known issue 9: the line number of `timeToPower()` corrected.

## Revision 5, as-built notes (2026-10-24): work package 11, engine fixes

No change to the agreed design; the brief records what the program now does where the engine was corrected (Claude's recommendations, accepted in advance by the owner; OPEN-QUESTIONS 68–76):

1. §11: the time-to-power axis counts months late against the phasing plan (first power against phase 1, full load against the last phase) plus half the power gap; supply ready early earns nothing.
2. §9.8: rented bridging plant is hired one month before it is first needed; bridging plant kept as the backup is bought (or hired) in step with the buildings; dispatch runs to the first year that starts after the last change (limit 15 years, with a run flag); firm plant needed below its minimum stable load runs at its minimum while the grid import backs off; first power is the later of the phase 1 date and the month the supply is ready.
3. §5.4: an entered network charge and levy figure replaces the country default.
4. §5.4, §7.2, §8: existing plant near the site, leased (work package 12, OPEN-QUESTIONS 78–82): an input group, C2 and C4 value "Existing plant (lease)", generator rules (l)–(n). Firm plant needed at its minimum stable load displaces PPA energy before its output is wasted (OPEN-QUESTIONS 77).
