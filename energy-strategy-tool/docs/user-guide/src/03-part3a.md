# Part III. Using the app, screen by screen {#part3 .part}

This part goes through every input and every results view. For each, it says what the field means, its default, how the engine uses it, and what the walkthrough agreed to change.

**How defaults are shown in the current version.** Every field still at its default carries a yellow **unverified** tag (in full: "indicative — unverified"). Hover over the tag to see the basis of the value (source, judgement or run setting), the source it should be checked against, and any note. Required fields show a grey **required · example value** tag: the program has filled them with the T1 example so it can run, but they are not defaults and you should replace them.

::: {.callout .agreed}
**Agreed, not built yet.** Every input says whether you entered it or the tool is assuming it. Assumed values are flagged on **every option that uses them, with their source** (for example "ASSUMED Grid full connection 120 MW in 48 months: country default, indicative — unverified"), not only in a global count.
:::

# 14. Inputs: project and location {#ch14}

![Current version: section 1, Project and location, with the T1 example.](img/s02-inputs-project.png)

| Field | Default | What it does |
|---|---|---|
| Project name | Untitled project | A label only |
| Latitude, longitude | required (T1: 52.29, −1.53) | Picks the country when "Country profile" is "From location"; sets the latitude used for the solar profile |
| Country profile | From location | Selects the country's hourly profiles and its price, network-charge, carbon, gas and carbon-price defaults |
| Analysis start | today + 3 months | Month 0 of every timeline; the base year for prices and discounting |
| Seed | 20261015 | Starting number for the synthetic profiles and the sampling of options |

**Country from location.** The current version picks the built-in country whose reference point (a single latitude and longitude per country) is closest to your location. Near a border this can pick the wrong country, so check the label "From location (…)" and override it if needed. The 31 built-in countries are the 27 EU member states plus the United Kingdom, Norway, Switzerland and Iceland.

**Analysis start.** All dates (phases, grid steps, plant availability) are counted in months from this month. It also sets the price base year: all money is in real terms of that year.

**Seed.** The synthetic profiles and the sampling of options use a seeded random-number generator. The same inputs and seed always give exactly the same results. Change the seed to see how much the results depend on the particular synthetic year.

::: {.callout .agreed}
**Agreed, not built yet.**

- **Map pin.** The location is set by clicking a map. The map is bundled with the program (OpenStreetMap data in Protomaps "PMTiles" format, all of Europe, to roads level) so the program stays offline. The licence terms and the file size still have to be checked.
- **Country from the pin**, shown and editable.
- **Currency** per site, from a fixed list; exchange rates fixed at each release.
- **Climate data**: the nearest ASHRAE design station and its distance are shown, with a flag that design temperatures come from that station, not the site; an EPW weather file can be uploaded instead.
:::

![MOCK-UP of the agreed project and location section: the map pin, country from the pin, currency, analysis start, the single site-area number and the nearest climate station flag.](img/m01-location.png)

# 15. Inputs: site {#ch15}

![Current version: section 2, Site.](img/s03-inputs-site.png)

| Field | Default | What it does |
|---|---|---|
| Site area | required (T1: 15 ha) | Gross site area |
| Aspect ratio | 1.5 : 1 | With the area, gives a rectangle, long side east–west |
| Boundary setback | 10 m | Strip around the edge where nothing is built |
| Height limit | 25 m | Flags blocks and stacks above it |
| Roads, parking, landscaping | 15 % | Share of the buildable area held back |
| Noise threshold at receptors (night) | 45 dB(A) | Flags the noise proxy at houses you add |
| Roof area for PV | empty (rule) | Roof covered by PV; empty = 50 % of the free roof after roof plant. Built 22 October 2026 |
| Ground area for PV | 0 ha | Ground covered by PV; above 0 adds the C10 choice "Roof + ground". Built 22 October 2026 |
| Off-site land for generation | 0 ha | Land for off-site wind or solar |
| Private-wire distance to off-site land | 2 km | Length of the cable to it |
| Soft exclusions usable by ground solar | on | Lets ground solar use soft exclusion zones |
| Ground conditions | "assumed suitable" | A note only |

**How the area is used.** The tool works out three areas:

::: formula
| buildable envelope = the site less the boundary setback
| net developable area = envelope × (1 − roads share)
| T1: 15 ha → 13.46 ha envelope → 11.44 ha net developable
:::

The net developable area is the land budget for every block of plant and the data halls. It decides whether the plant fits and (with the 20 ha threshold) whether wind is generated. Ground solar has its own input, the ground area for PV, below.

**Boundary and features.** The boundary polygon, setbacks per edge, exclusion zones (hard, such as easements and ecology; soft, such as flood zones), height zones, the grid point of connection (POC), the gas main, access points and noise receptors are edited on the Site tab (chapter 28).

::: {.callout .agreed}
**Agreed, not built yet.** The site area stays a **single number** in the main flow. The site layout, the planning constraints (setback, height, roads share) and boundary import move out of the main flow, into the Site tab, which becomes a **Beta** feature: hidden by default, turned on in the general settings, labelled Beta, and kept out of the ranking and the PDF export.
:::

::: {.callout .open}
**Open.** With the Site tab hidden, the engine still needs a land budget for the wind default. Ground solar was settled on 22 October 2026 (OPEN-QUESTIONS 53): it has its own area input.
:::

# 16. Inputs: load and building {#ch16}

![Current version: section 3, Load and building, with the T1 phasing.](img/s04-inputs-load.png)

| Field | Default | What it does |
|---|---|---|
| IT load at full build | required (T1: 100 MW) | Installed IT of the whole campus |
| Phasing table | one phase at the grid full-connection date | IT MW and energisation date of each phase |
| Ramp: share at energisation | 25 % (was 50 % until 22 October 2026) | Share of a phase's IT drawn when it opens |
| Ramp duration | 12 months | Time to reach 100 % |
| Average IT utilisation | 80 % | Average draw as a share of installed IT (energy only) |
| Workload type | Mixed cloud | Sets the daily load wave (chapter 5) |
| Cooling approach | Open choice (C8) | Fixes the cooling, or leaves all four open |
| Gross-up | 2.2 | Building gross floor area ÷ data hall whitespace |
| Storeys | 2 | Storeys of data hall |
| Non-IT ancillary load | 2 % of IT | Lighting, offices, security |

**The phasing table.** Add a row per phase with its IT MW and date (year and month). "Reset to default" returns to the one-phase default. The sum of the phases is shown against the IT load at full build; if they differ, the phasing table is what the engine uses month by month, while sizing uses the IT load at full build.

**Building massing.** The tool works out the data hall building from the IT load:

::: formula
| whitespace (m²) = IT load (kW) ÷ IT density (kW/m², by cooling)
| gross floor area = whitespace × gross-up
| footprint = gross floor area ÷ storeys
| height = storeys × 6 m + 4 m roof plant zone
| T1, DLC: 100,000 ÷ 4.0 = 25,000 m²; × 2.2 = 55,000 m²; ÷ 2 = 27,500 m²; 16 m high
:::

The footprint takes land on the site plan and gives the roof area for rooftop solar.

::: {.callout .agreed}
**Agreed, not built yet: estimating the IT load from the area.** If you do not know the IT load, choose "Estimate from area":

::: formula
| IT load ≈ site area × site coverage × storeys × IT density
| T1: 15 ha × 35 % × 1 storey × 5.5 kW/m² ≈ 290 MW
:::

Site coverage 35 % and one storey are judgements. The density, 5.5 kW per m² of floor, comes from a single benchmark: STACK's Erskine Park campus in Sydney (450 MW "operational capacity" on 82,020 m² of floor over three storeys, on 7.7 ha). The published sources do not say whether the 450 MW is IT load or facility load; if it is facility load, the IT density would be nearer 4 kW/m². The estimate is flagged as assumed on every option, and you can override the IT load at any time.
:::

::: {.callout .open}
**Open: two densities that disagree.** The estimate above assumes 5.5 kW of IT per m² of *floor*. The building massing assumes 1.5 to 4 kW per m² of *whitespace* with a gross-up of 2.2, which is only 0.7 to 1.8 kW per m² of floor. For the same site, the two rules differ by a factor of three to eight. One of them should change during the research of the defaults (chapter 50).
:::

![MOCK-UP of the agreed "enter what you know" pattern: grid capacity and IT load each "Known" or assumed, with the source and the per-option flags.](img/m02-knowledge-levels.png)

::: {.callout .agreed}
**Agreed, not built yet: load shape and flexibility.**

- **Load shape** is fully customisable: flat percentage of IT, daily fluctuation, AI training or AI inference. When an AI profile is selected, its editable defaults are shown, with the caveat that swings shorter than an hour cannot be modelled.
- **Demand flexibility** is off by default. When on, its parameters are: maximum curtailable share of IT, maximum hours a year, trigger (price, carbon, or weather and grid stress), trigger level, duration per event, notice time, recovery period, and cost of curtailment. The historical analysis covers both price and carbon triggers (data: ENTSO-E prices; weather source still to be researched).
- **Battery response**: batteries can run the site during trigger hours instead of curtailing. By default the tool sizes the battery to cover the historical trigger hours; the engineer can change it. Battery size and trigger threshold trade off, so the engineer chooses which is held fixed (battery size, trigger threshold, or a target of hours covered). The battery capex flows into the economics.
:::

![MOCK-UP of the agreed load shape and flexibility section. The AI training values and the trigger values shown are illustrative, not agreed defaults; the 10 % and 100 hours are the current defaults.](img/m03-load-flexibility.png)

# 17. Inputs: utilities and grid {#ch17}

![Current version: section 4, Utilities and grid.](img/s05-inputs-grid.png)

| Field | Default | What it does |
|---|---|---|
| Grid import now | required (T1: 20 MW) | Import capacity from the analysis start |
| Grid import at full connection | required (T1: 120 MW) | Import capacity from the full-connection date |
| Full-connection date | required (T1: 2029-07) | When the full capacity is available |
| Grid export capacity | 0 MW | Used only by C1 "Grid + export" |
| Grid price multiplier | × 1 | Scales the country's hourly wholesale prices |
| Grid carbon multiplier | × 1 | Scales the country's hourly grid carbon |
| Gas available | Unknown | Yes, No or Unknown |
| Gas available from | 18 months after start | Gas supply date (unlimited from then) |
| Gas commodity price | country default | €/MWh of gas; the transport adder (€4) is added either way |
| Hydrogen availability | No | Hydrogen plant runs only if Yes |
| District heating offtake nearby | No | Allows heat-reuse values of C15 (not costed) |

Two inputs exist in the engine but are not on screen in the current version: **grid steps** (intermediate capacities between "now" and "full", each from a date) and **water available** (m³ a day, for the water flag).

**What "Unknown" gas means.** Gas plant is generated and runs (from the gas date), but every gas-using option gets a minor flag ("Gas connection unconfirmed") and loses 10 deliverability points. With "No", gas CHP is not generated at all, and any other gas plant is flagged major and never runs. With "Yes", gas plant runs from the gas date with an information flag that the capacity and date are assumed.

**Multipliers.** The price and carbon multipliers scale the whole hourly profile, for example to test a high-price future. The tornado (chapter 27) uses ranges of 0.7 to 1.5 for price and 0.8 to 1.2 for carbon.

::: {.callout .agreed}
**Agreed, not built yet.**

- **Grid capacity and connection time can be "Not known".** The tool then uses country defaults, labelled indicative, and flags them on every option, with the source. These country values are still to be researched.
- **Contracted grid capacity per option**, set by the engineer, and a **fixed grid connection charge**, the same for every option (chapter 19).
- **Gas price**: the latest published wholesale price with its date, from a free monthly source, overridable with a current quote.
:::

# 18. Inputs: requirements, priorities and weights {#ch18}

![Current version: section 5, Requirements and priorities (first part).](img/s06-inputs-requirements-a.png)

![Current version: section 5, the weights and presets.](img/s06-inputs-requirements-b.png)

| Field | Default | What it does |
|---|---|---|
| Backed critical load | 100 % | Share of IT plus essential mechanical that backup must carry |
| Backup topology | N+1 | Required redundancy; also fixes choice C6 |
| On-site autonomy | 48 h | Required hours of backup; also fixes choice C7 |
| Islanding required | No | If Yes, on-site firm plant must carry the critical load |
| Carbon target | none | Flags options above it (g/kWh, location-based) |
| Capex ceiling | none | Flags options above it |
| Land-take ceiling | none (the net developable area) | Flags options above it |
| Max annual run-hours, on-site combustion | none | Flags (or limits) firm plant above it |
| Weights | 35 / 25 / 25 / 15 | Cost, carbon, time-to-power, deliverability |

**Requirements are checks, targets are flags.** The resilience requirement decides the backup sizing and the resilience status. The carbon target, capex ceiling, land-take ceiling and run-hour limit only raise flags; none of them removes an option.

**Weights.** Drag the sliders or pick a preset (Balanced, Lowest cost, Lowest carbon, Speed to market, Lowest risk). The effective weight of each axis is its raw value divided by the sum of all four. If all four are zero, the tool uses 25 % each and warns. Changing weights re-scores instantly, without re-running the model.

::: {.callout .agreed}
**Agreed, not built yet.**

- Resilience default N+1 with 100 % of IT backed. Autonomy from on-site fuel and generation, batteries, or a combination (the engineer chooses).
- Backup gensets included by default, tested **6 hours a year** each at a **test load of 75 %** (two separate inputs), with an option to run them as primary power for a set number of hours a year, dispatched and costed.
- Batteries in two allocations: a **resilience reserve** (always kept; default 5 minutes of UPS ride-through at full IT) and an **economic battery** (flexibility, arbitrage, carbon). Longer battery autonomy available site-wide.
- Weights stay 35/25/25/15 (provisionally accepted). The impact of each weight change is described live. The target for repainting the screen after a weight change is relaxed from 100 ms.
:::

![MOCK-UP of the agreed resilience, backup and battery inputs.](img/m04-batteries-backup.png)

# 19. Inputs: economics and run settings {#ch19}

In the current version, the economic inputs sit in the collapsed **Run and dispatch settings** section, together with settings that change how the run is done or reported.

| Field | Default | What it does |
|---|---|---|
| Grid capacity handling | Show unmet load | Or "Show exceedance" (chapter 9) |
| Run-hour limit handling | Flag only | Or "Respect limit": firm plant stops at the limit |
| Cost axis metric | LCOE | Or NPV of net cost |
| Carbon axis metric | Location-based | Or market-based, or 1 − hourly CFE |
| Rank requirement-compliant options first | off | Ranks failing options after the rest; scores unchanged |
| Include site-fit penalty in deliverability | off | −10 for "Fits with flags", −25 for "Does not fit" |
| Generation cap | 2,000 options | Maximum options screened |
| Sample above cap | on | Samples down to the cap; off screens all |
| Wind default site threshold | 20 ha | Wind not generated on smaller sites |
| Layout raster cell / large-site cell / threshold | 2 m / 5 m / 50 ha | Resolution of the auto-layout |
| WACC (real) | 7 % | Discount rate |
| Evaluation period | 20 years | Length of the cost ledger |
| Contingency | 10 % | Added to every capex line |
| Carbon price (Scope 1) | country default | €/t CO₂e; €85 everywhere except the United Kingdom (€50) |

**Rank requirement-compliant options first.** Off by default (flag, don't enforce). When on, options whose resilience is "Does not meet" or whose site fit is "Does not fit" are ranked after all the others. Their scores do not change. The setting is shown in the header.

**Sampling.** With sampling on, a run with more combinations than the cap screens all archetypes plus a seeded Latin hypercube sample of the rest (chapter 34). With sampling off, every combination is screened, which can take much longer. The header and the run summary always say which applies.

Several economic defaults have no field on screen in the current version: capex range −30 %/+50 %, carbon price escalation 2 % a year real, electricity and gas price escalation 0 %, and salvage value 50 % of remaining value.

::: {.callout .agreed}
**Agreed, not built yet: an Economics section.**

- **Evaluation periods**: several at once (for example 10, 15 and 20 years).
- **WACC**: 7 % real, labelled judgement until researched; explained on screen as "the blended return investors require, used as the discount rate".
- **Carbon price**: the latest EU ETS market price with its date (for example €82.40/t on 5 October 2026).
- **Gas price**: the latest published wholesale price with its date (for example the TTF front month, €75.75/MWh on 5 October 2026), from a free monthly source; overridable.
- **Escalation**: a published forecast per commodity, overridable.
- **Grid connection capex**: default 0, flagged as assumed on every option, with the country's typical value shown for reference.
- **Grid connection charge**: fixed, the same for every option.
- **Contracted grid capacity**: one value per option, set by the engineer.
- **Revenue options** (battery arbitrage or grid services, waste-heat reuse): off by default.
:::

![MOCK-UP of the agreed economics section, including contracted grid capacity per option. Prices shown are the published values found on the dates given.](img/m05-economics.png)

::: {.callout .open}
**Open.** How the engineer sets a contracted capacity for options that do not exist until the run has generated them (for example a rule per grid strategy, or editing after the run) is not yet specified. Also open: whether an islanded option that contracts 0 MW still pays the fixed connection charge (the agreed rule says the charge is the same for every option).
:::

# 20. Inputs: the design choices C1–C20 {#ch20}

![Current version: part of section 6, Choices. Filled values are included; outlined values are not generated.](img/s07-inputs-choices.png)

Each choice has a list of values. A choice is **open** (every included value is combined with the other choices) or **locked** (only its first included value is used). Click a value to include or exclude it; use "Open · lock to first value" or "Locked · open it" to switch. The badge on the section shows the projected number of combinations after the compatibility rules, the cap and whether sampling is on.

The table lists every choice, its values, and the values included by default (marked **bold**). "Locked" means only that value is used unless you open the choice.

| Choice | Values (default in bold) |
|---|---|
| C1 Grid strategy | **Wait for grid**, **Bridge until grid**, **Islanded**, Grid + export |
| C2 Bridging supply | **Gas recips**, Gas turbines, **Fuel cells**, HVO-diesel prime, BESS + solar only, **Rented temporary generation** |
| C3 Bridging plant after grid arrives | **Remove**, **Retain as backup**, **Retain as prime**, **Retain for grid services** |
| C4 Primary firm on-site generation | **None**, **Gas CHP-trigen**, Gas recips, **Fuel cells**, SMR, Hydrogen |
| C4s Firm generation sizing | **Average load (baseload)**, **Permanent shortfall (top-up)**; the top-up only for cooling types with a permanent shortfall, or islanded (built 23 October 2026) |
| C5 Backup power technology | **Diesel gensets**, **HVO gensets**, Gas gensets, BESS-augmented UPS + reduced gensets, **Retained bridging plant**, None |
| C6 Backup topology | locked to the required topology (**N+1**); N, 2N, catcher available |
| C7 Autonomy / fuel storage | locked to the required autonomy (**48 h**); 12, 24, 72 h |
| C8 Cooling approach | **all four** open, unless the cooling approach input fixes one |
| C9 Heat rejection location | **Roof**, **Ground**, **Split** |
| C10 On-site solar | **None**, **Roof only**; **Roof + ground** when the ground area for PV is above 0 |
| C11 On-site wind | **None** on sites ≤ 20 ha; otherwise **None**, **Fit as many as separations allow**, **Off-site land** |
| C12 BESS size | **None**, 1 h at 25 %, 1 h at 50 %, **2 h at 25 %**, 2 h at 50 %, 4 h at 25 %, **4 h at 50 %** |
| C12r BESS role | locked to **Peak-shave**; Shifting, Bridging support, Grid services available |
| C13 Offsite PPA | **None**, Annual-matched solar, Annual-matched wind, **Hybrid**, Baseload-shaped, 24/7-matched |
| C14 PPA coverage | **50 %**, **80 %**, **100 %** |
| C15 Heat reuse | locked to **None** unless district heating is nearby |
| C16 Demand flexibility | locked to **Off** |
| C17 Substation type | **AIS**; GIS available |
| C18 Genset arrangement | **Single-deck**; double-deck and in-building available |
| C19 Phasing of energy plant | locked to **Build per phase**; build all at phase 1 available |
| C20 Fuel decarbonisation pathway | locked to **None**; biomethane, HVO switch available |

**Which choices do something in the current engine.** Most choices change sizing, dispatch, costs or the layout. A few are recorded but have little or no effect yet:

- **C15 Heat reuse**: values are generated only with district heating nearby, and heat reuse is not costed.
- **C20 Fuel decarbonisation pathway**: has no effect on any calculation.
- **C3 "Retain for grid services"** behaves like "Retain as backup", and **C12r "Grid services"** like "Shifting": no grid-services income is modelled.
- **C17** (substation type) and **C18** (genset arrangement) change footprints and, for C17, the substation cost; C18 changes only the footprint.

**Not applicable values.** Some choices only matter when others take certain values: C2 and C3 only with bridging; C4s only with a firm plant; C14 only with a PPA; the BESS role only with a BESS; C6, C7 and C18 only with gensets. Otherwise they are set to "n/a" rather than multiplying the options (chapter 34).

::: {.callout .agreed}
**Agreed, not built yet.** The cooling approach is always chosen by the engineer (chapter 6). The flexibility and battery choices are replaced by the parameters described in chapters 16 and 18.
:::

# 21. Running: progress, run summary and run flags {#ch21}

## Run progress

The **Run progress** panel lists the 13 stages of the run (chapter 31), each with a bar, its cache counts and any warnings. Below it, the **event log** shows the last 200 events; **Download run log** saves the full log as JSON or CSV (in the Windows program, through a save dialog). The log is the audit trail of the run: every stage's start and end, progress every 250 items, every warning, the input hash and the leader.

## Run summary

![Current version: the run summary for the T1 run: generation counts, sampling and the compatibility rules with the number of combinations each removed.](img/s09-run-summary.png)

- **Generation**: the open-choice product, the count after the n/a collapse, the valid count after the compatibility rules, the archetypes, the total, and how many were screened. When sampling applies, the summary says so, with a **Screen all** link (switches sampling off) and a reminder that locking a choice narrows the space.
- **Compatibility rules**: each rule, what it removes, and how many combinations it removed.
- **Scoring set**: every screened option. View filters never change any score or rank.
- **Grid shortfall against the design load** (built 23 October 2026; OPEN-QUESTIONS 38): for each cooling type the run generates, the design load (the full contracted IT at the design-day PUE plus ancillary load), the **temporary** shortfall against the offered grid before the full connection date and the **permanent** shortfall from it on (peak MW, its month, and how many months), and the IT load the full grid connection supports on its own. In T1 (120 MW grid from 2029-07) air cooling needs 137 MW, so 16.7 MW stays short from 2031-12 and the full grid supports 87.8 MW of IT; DLC needs 113 MW, has only a temporary shortfall (peak 6.5 MW in 2029-06) and the grid supports 106 MW of IT. On-site generation must close both shortfalls for an option to be adequate.

## Values not generated

![Current version: the "values not generated" list. Each choice with values left out says why (default subset, locked, wind default) and offers an Include link.](img/s10-values-not-generated.png)

This list matters: it tells you which strategies the run did **not** look at. If a strategy you care about is missing, select **Include** next to it and the run repeats with it. For C17 and C18 the note also says how many options do not fit the site, because GIS substations and double-deck gensets save space.

## Dispatch summary

![Current version: the dispatch part of the run summary: the model, how grid capacity and run-hour limits are handled, the merit order and the profile source.](img/s11-run-summary-dispatch.png)

## Run flags

![Current version: run-level flags for the T1 run.](img/s12-run-flags.png)

Run flags apply to the whole run rather than to one option: how many combinations the rules removed; how many choices have values not generated; that sampling is active; that wind was not generated on a small site; that the IT utilisation assumption applies to energy but not sizing; and, when the workload is AI training, that transient loads are not modelled.
