# 22. Results: the top five and the options table {#ch22}

## The top five cards

::: {.callout .agreed}
**Agreed, not built yet.** The first results screen shows the **top five options** as cards. Each card shows:

- the overall weighted score and the four axis scores;
- LCOE, carbon intensity, resilience status and capex;
- the main flags;
- the **assumed defaults** the option relies on, with their sources;
- up to **three pros and three cons**, judged against the other options in the run ("n/a" if there are too few to compare). Each card says what it is compared against, for example "lowest of the 5 shown", because a pro or a con can change when the set of options changes.
:::

![MOCK-UP of the agreed top-five cards, filled with the real T1 results. In this mock-up the pros and cons are worked out against the five options shown.](img/m06-top5.png)

**What the T1 top five shows.** All five are variations of one strategy: wait for the grid, diesel or HVO gensets N+1, direct liquid cooling, and a 100 % hybrid PPA, differing only in the solar size and the backup fuel. Their scores span 92.5 to 92.7. This is typical: the best options are often near neighbours.

::: {.callout .open}
**Open.** The decision says pros and cons are judged against the other options in the run, while its example reads "lowest of the 5 shown"; which comparison set to use needs confirming. The agreed design also does not yet say whether the top five should be the five highest scores (as in the mock-up) or five *different* strategies (for example the best of each grid strategy or backup type). Five near-identical cards say less than five distinct ones. Options that differ only in a choice that changes no number (for example the heat rejection location of an option with no rooftop solar) appear as separate, identical rows today (ranks 10 and 11 in T1).
:::

## The options table (current version)

![Current version: the Options tab after the T1 run, with view filters above the ranked table.](img/s13-options.png)

The **Options** tab lists every screened option in rank order. Columns:

| Column | Meaning |
|---|---|
| Rank | Position by weighted score (1 = best) |
| Option | Name built from the main choices and sizes; select to open the detail |
| Score | Weighted score, 0–100 |
| Cost · Carbon · TTP · Deliv. | The four axis scores as small bars |
| LCOE €/MWh | Levelised cost |
| Capex | Capital cost including contingency |
| Carbon | g/kWh by the scoring carbon metric |
| CFE | Hourly carbon-free energy share |
| First power, Full load | Months when the supply can first energise phase 1, and carry the full design load |
| Unmet MWh | Unmet load over all simulated years |
| Land take ha | Land used on site |
| Site fit, Resilience | Status of the two requirement checks |
| Flags | Count of flags by severity |

The table rounds to **two significant figures** (the detail view uses three), which is why the leader's €113.7 m capex shows as €110 m.

**Option names** are built from the choices: grid strategy (and the bridging plant and what happens to it), firm generation, backup and topology, cooling (first word), solar size, wind size, battery hours, and PPA type and coverage. For example "Grid + fuel cells bridge → remove · HVO N+1 · DLC · PV 7.2 MWp · PPA hybrid 100 %".

**Filters** (above the table) change only what is shown, never a score or a rank:

- resilience status (Meets, Meets with flags, Does not meet) and site-fit status (Fits, Fits with flags, Does not fit);
- land take at most (ha) and capex at most (€ m);
- show only, or hide, options with a given flag;
- dominance: all options, non-dominated only, or dominated only;
- archetypes only; and a name search;
- **Hide dominated options** (off by default; custom and pinned options are never hidden).

Active filters appear as chips that can be cleared one by one. Click a column heading to sort by it (click again to reverse). The table shows 50 rows a page.

A dominated option carries a dashed label "Dominated by #k …" naming the option that beats it on every axis.

# 23. Option detail {#ch23}

Selecting an option's name opens its detail. It is the most useful single view in the tool: everything the engine worked out about that option.

![Current version: the top of the option detail for the T1 leader: scores, site fit, economics, carbon and energy, time-to-power, resilience and deliverability.](img/s14-detail-a.png)

**Scores.** The weighted score and the four axis scores (rounded).

**Site fit.** The status, the land take against the net developable area, the ground solar fill, the residual area, and an estimate of the extra IT the leftover land could take. A link opens the layout on the Site tab.

**Economics.**

- LCOE and NPV of net cost (chapter 39).
- Capex including contingency, with the Class 5 range (−30 % to +50 %).
- Opex in the first year of the analysis and in the steady-state year. For T1 the first is €0, because 2027 has no load yet.
- Capex share of the present-value cost: how much of the NPV is capital (10 % for the T1 leader: its cost is mostly energy).
- **PPA hedge (not counted)**: the settlement of contracted PPA volume that was not delivered (chapter 39), reported but outside the ledger.

The note under the table restates the capex scope: energy, backup, grid connection, substation and cooling delta only.

**Carbon and energy.** Location-based and market-based carbon, the hourly CFE share, the yearly Scope 1 and Scope 2 averages and the WUE.

**Steady-state year energy.** Where the energy comes from in the last simulated year: facility demand; on-site renewables used; PPA delivered; firm on-site generation; grid import; battery charge, discharge and losses; curtailment; and unmet load over all simulated years.

**Time-to-power.** First power, full load, the power gap in MW-months, and the axis metric (chapter 38). A link opens the option on the Dispatch tab.

**Resilience.** The status and each check (backed load, topology, autonomy, islanding) with its numbers.

**Deliverability.** The score and each penalty (chapter 43).

![Current version: the sizing sentences and flags of the T1 leader.](img/s15-detail-b.png)

**Sizing.** Plain-English sentences, one per sizing step, each with the arithmetic. These are the quickest way to see why an option is the size it is (chapter 35 explains every rule).

**Flags.** Every flag, with its severity (major, minor or info), category and message (chapter 42).

![Current version: the choice vector of the T1 leader.](img/s16-detail-c.png)

**Choice vector.** The value of every choice C1–C20 for this option ("n/a" where the choice does not apply).

# 24. Trade-offs {#ch24}

![Current version: the Trade-offs tab for the T1 run, LCOE against location-based carbon. The weighted pick is ringed; the dashed step line is the two-axis frontier.](img/s17-tradeoffs.png)

The **Trade-offs** tab plots every screened option on two axes. Each axis can be any of: LCOE, NPV of net cost, location-based carbon, market-based carbon, 1 − hourly CFE, time-to-power, or deliverability.

In the current version:

- **Colour** shows time-to-power in up to five classes (quantiles of all options, merged where many options tie).
- **Shape** shows site fit: circle for Fits, triangle for Fits with flags, square for Does not fit.
- **Fill**: solid for options not dominated, hollow for dominated options.
- **Size** shows capex.
- The **dashed step line** joins the options on the two-axis frontier.
- The **weighted pick** (the rank-1 option, the same as the header's leader) is ringed and named above the chart, with its score and its two plotted values.

Points are drawn on a canvas when there are more than 500 (faster), and as individual shapes below that. A **Table** button shows the same rows as a table. With the keyboard: focus the chart, then use the arrow keys to move between options, Home and End for the ends of the axis, P for the weighted pick and Enter to open its detail.

**Reading the T1 chart.** The options form bands of carbon:

- **about 113 g/kWh**: every option supplied by the grid with no on-site plant running in normal hours, **with or without a PPA**. Location-based carbon counts PPA energy at the grid's intensity, so a PPA does not lower it (it lowers the market-based figure instead);
- **about 120 to 350 g/kWh**: options that run gas engines, fuel cells or CHP on site, lower when a larger PPA displaces some of the gas burn;
- **about 360 to 530 g/kWh**: islanded options, which burn gas for everything.

Within a band, cost varies with the cooling approach and the plant. The leader sits at the bottom-left of the lowest band.

::: {.callout .agreed}
**Agreed, not built yet.** The default chart is **cost on the vertical axis against carbon on the horizontal axis**, with **resilience status as the bubble size and colour**. Either axis can be switched (for example to time-to-power or deliverability).
:::

![MOCK-UP of the agreed trade-off chart, with every other T1 option plotted (finite LCOE below €300/MWh). The top five overlap at about 113 g/kWh and €154/MWh.](img/m11-tradeoff.png)

# 25. Compare {#ch25}

::: {.callout .agreed}
**Agreed, not built yet.** Up to **three options side by side**, chosen from the result cards or the trade-off chart, with a deep-dive card for each. The comparison lists the headline figures and the choices on which the options differ.
:::

![MOCK-UP of the agreed Compare view with three real T1 options: the leader, the best immersion-cooled option (#6) and the best fuel-cell bridging option (#12).](img/m07-compare.png)

The example shows why compare matters: option #12 bridges with fuel cells until the grid arrives, so its unmet load falls from 650 MWh to 11 MWh and full load arrives at the same time, for €28 m more capex and a slightly higher LCOE.

# 26. Dispatch {#ch26}

The **Dispatch** tab shows how one option is supplied. Choose the option at the top (the leader by default). The option is re-run with the same engine the ranking used, and checked against the ranking's figures.

![Current version: the phasing chart of the T1 leader: offered grid capacity (blue) against design load (black line), with the power gap marked above the plot.](img/s18-dispatch-phasing.png)

**Phasing.** Month by month: the offered grid capacity, firm on-site plant, and the design load as phases open and ramp. First power, full load, the power gap (MW-months and months) and the full grid connection month are marked. "Timeline as a table" gives the same numbers.

![Current version: hourly dispatch of the T1 leader in week 24 of 2029, the week with most unmet load.](img/s19-dispatch-hourly.png)

**Hourly dispatch.** Choose a simulated year (Year 1 to Year 6 for T1; later years repeat the last), then a week, or jump to the **peak demand week**, the week with **most unmet load**, or the week with **least on-site renewables**. Above the axis, each hour's supply is stacked in merit order (solar and wind, battery discharge, firm plant, then grid import, which includes PPA energy because it arrives over the grid). Below the axis: battery charging, curtailment and export. The line is the facility demand; where it sits above the stack, demand was not met, and a red strip marks those hours. Hover (or use the table) for each hour's numbers.

![Current version: the energy balance of the T1 leader in 2029.](img/s20-dispatch-balance.png)

**Energy balance.** For the chosen year: every source in, every use out, and the totals, which must match. The notes below state the balance error (the largest hourly error was 7 × 10⁻¹⁵ MWh: rounding only), confirm that every year, time-to-power, LCOE, NPV, solar size, deliverability and site fit match the ranking, and report the PPA hedge.

::: {.callout .agreed}
**Agreed, not built yet.** Dispatch views of **any period of the year**, not just whole weeks; available only for the verified top options, because the screening run will use representative days (chapter 10).
:::

# 27. Sensitivity (tornado) {#ch27}

![Current version: the tornado for the T1 leader. Each bar runs from the weighted score at a driver's low value (L) to its high value (H); the table gives the values, scores and LCOEs.](img/s21-sensitivity.png)

Choose the option to test (the leader by default). The tool re-runs that one option 15 times (the base case, then each of seven drivers at its low and its high value, everything else unchanged) and shows how its weighted score and LCOE move. The other options and their ranks are not changed: the re-run scores are measured against the base run's axis ranges.

| Driver | Low | High |
|---|---|---|
| IT load (all phases) | × 0.8 | × 1.2 |
| Grid full-connection date | −6 months | +24 months |
| Grid import price | × 0.7 | × 1.5 |
| WACC (real) | 4 % | 12 % |
| Grid carbon intensity | × 0.8 | × 1.2 |
| Carbon price (Scope 1) | × 0.5 | × 1.5 |
| Gas commodity price | × 0.7 | × 1.3 |

Drivers are sorted by the swing in score, largest first. A check confirms that the base re-run reproduces the ranking's score exactly.

**Reading the T1 tornado.** IT load swings the score most (from 92.5 to 70.8): at 120 MW of IT the design load (136 MW) exceeds the 120 MW grid, the option never reaches full load, and its time-to-power score collapses. The grid date comes next (+24 months costs 7 points). The grid price moves LCOE most (€142 to €173/MWh), but the score less, because every option would pay it. Gas price has no effect: the leader burns no gas.

::: {.callout .agreed}
**Agreed, not built yet.** A tick-box list of drivers: the brief's seven (gas price, grid price, WACC, carbon price, capex, capacity factors, grid connection date) plus additions such as IT load, PUE, battery capex, grid connection capex, evaluation period, escalation, flexibility trigger and generator test hours. The **result measured defaults to LCOE**; NPV, carbon and weighted score can be selected.
:::

![MOCK-UP of the agreed tornado measuring LCOE. The LCOE ranges for the seven built drivers are from the T1 run.](img/m08-tornado.png)

# 28. Site (Beta) {#ch28}

::: {.callout .built}
**Built (22 October 2026).** The Site tab is a **Beta** feature: hidden by default, turned on in the general settings (chapter 30), and labelled Beta. Site fit never changes a score or a rank: "Rank requirement-compliant options first" uses the resilience status only, and dominance marks ignore site fit. With the tab off, the main views show no site fit at all: no header item, table columns, filters, chart shapes, option-detail section or site-fit flags. Turning the tab off also switches off the optional site-fit penalty, which is a Beta setting. The site inputs other than the area are still used while the tab is off: the POC and gas main set the route costs, and the layout still runs. Ground solar no longer depends on the layout: it comes from the ground area for PV (chapter 15, built 22 October 2026). Keeping the Site tab out of the PDF follows when the PDF is built.
:::

![Current version: the site plan of the T1 leader: four data halls, heat rejection, gensets and fuel storage next to the halls, the substation near the default point of connection, and ground solar filling the rest.](img/s22-site-plan.png)

**The plan.** A north-up plan of the site with layers you can switch: boundary, setbacks, exclusions and height zones, blocks, clearance rings, flags, the POC, access, gas main and receptors, dimensions and edge numbers. The plan has no map tiles and assumes flat ground. Use the arrow keys to move between blocks; "The plan as a table" lists them.

**Editing the site.** Draw the boundary on the plan, type coordinates, or import a GeoJSON or KML file. Add exclusion zones (hard or soft, by type), height zones, the POC, the gas main, access points and noise receptors. Per-edge setbacks override the uniform setback.

![Current version: site fit of the T1 leader: area budget, land take and expansion headroom.](img/s23-site-fit-a.png)

![Current version: the height check, separation checklist, noise proxy and roof use for the T1 leader.](img/s23-site-fit-b.png)

**Site fit panel.**

- **Area budget**: each kind of block's placed and unplaced area against the net developable area.
- **Land take**: on site, off site, shortfall, residual area, and an estimate of expansion headroom in MW of IT.
- **Height check**: the tallest element in each height zone against its limit.
- **Separation checklist**: each spacing rule with the required distance, the minimum allowed when relaxed, the distance achieved and the status (pass, relaxed or fail).
- **Noise proxy**: sound levels at receptors and the boundary from geometric spreading only (a screening proxy, not an acoustic assessment).
- **Roof use**: roof area, roof plant, rooftop solar, edge setback and free roof.

![Current version: the top six options drawn at the same scale.](img/s24-site-multiples.png)

**Small multiples.** The six top-ranked options drawn at the same scale, with their site-fit status and land take. Choose one to show its plan above.

How the layout works is in chapter 36.

# 29. Export: PDF report and run log {#ch29}

## Run log (current version)

From the Run progress panel, **Download run log** saves the log of the last run as JSON or CSV. The Windows program asks where to save it. The log has the schema name `dc-energy-run-log/1` and one row per event: sequence number, stage, event type (start, progress, end or warning), milliseconds since the start, count, total, and details (the source, and stage-specific data such as cache hits or the leader). Two runs with the same inputs give identical logs apart from the timings.

## PDF report

::: {.callout .agreed}
**Agreed, not built yet.** One **PDF report**, **inputs first, results after**, saved with a file dialog (nothing is sent anywhere). **No Excel export.** The Site tab (Beta) is not included.
:::

![MOCK-UP of the agreed PDF report contents.](img/m09-pdf.png)

The mock-up suggests these sections: cover (project, date, app and data version, guardrail); inputs (every input with its value and whether it was entered or assumed); assumptions (the defaults used, with source, year and link, or "judgement"); results (top five); trade-offs; compare; dispatch (selected periods); sensitivity; flags; and method (formulas, settings, guardrail).

# 30. General settings {#ch30}

::: {.callout .built}
**Built (22 October 2026): the Site tab (Beta) switch.** The **General settings** button at the top of the window opens the settings, which hold features outside the main flow. The one built item is the **Site tab (Beta)** switch, off by default. It is a view setting: turning it on or off changes what is shown, never a score, a rank or a run.
:::

::: {.callout .agreed}
**Proposals, not agreed yet.** The mock-up below also shows the theme (follow Windows, light or dark), a run-log option, and an "About this copy" panel with the app version, the data version (with the dates of prices, carbon and profiles) and a reminder that the program never connects to the internet. The walkthrough did not decide these; they wait for the owner.
:::

![MOCK-UP of the agreed general settings.](img/m10-settings.png)
