# Part VI. Reference {#part6 .part}

# 54. Limitations and known issues {#ch54}

## What the model leaves out

**Data**

- Hourly profiles are synthetic and country-level, for a single year. Real data and location-specific profiles are agreed but not built.
- The design temperature is the hottest hour of the synthetic year, not a published design condition.
- Countries are chosen by the nearest reference point.

**Time**

- The model works in whole hours: nothing faster (UPS ride-through, AI training swings, generator starts) is represented. The 5-minute UPS requirement is recorded but not used.
- Months are 730-hour blocks, not calendar months.
- Grid outages are not simulated; backup gensets never run except for tests.

**Plant**

- Battery rules are fixed priorities, not an optimisation; no degradation or auxiliary power.
- Firm plant has no start-up costs, ramp limits or maintenance outages; minimum stable load applies to one unit.
- No electrical network modelling: losses inside the site are in the PUE, and there is no reactive power or power quality.
- PPA energy is assumed deliverable over the grid whenever the import capacity allows; there is no basis risk or curtailment of the PPA generator.

**Money**

- Real terms only: no inflation, tax, depreciation, financing structure or capacity payments.
- Network costs are one per-MWh adder per country, with no capacity charge.
- Revenue is limited to export income; grid services, heat reuse and arbitrage income are not modelled (C3 and C12r "grid services" behave like backup and shifting).
- Capex covers differences only (energy, backup, grid, substation, cooling delta), not the building or IT.

**Carbon**

- Scope 3 is excluded. Location-based carbon uses the average grid intensity, not the marginal. Market-based carbon applies the annual PPA contract volume. HVO's factor is a proxy. Grid decarbonisation is a straight line to a 2050 value.

**Scoring**

- Scores are relative to the options in the run, and the sample of 2,000 can miss combinations.
- Deliverability penalties and weights are judgements.

**Site (Beta)**

- Flat ground, rectangular blocks, a greedy layout, screening proxies for noise and separations; no terrain, flood levels or levels.

## Findings while writing this guide

These were found while checking the guide against the code and the T1 run. None has been fixed; each needs a decision before any change.

1. **Repeated year not fully steady.** When the last change falls mid-year, that year is repeated to the end of the evaluation period although it is still ramping. For T1 this undercounts facility energy in 2033–2046 by about 1.8 % (chapter 37).
2. **Network charge on PPA energy is not escalated.** The electricity escalation multiplies grid energy cost but not the adder on PPA energy. No effect at the default escalation of 0 %.
3. **Export income ignores the price multiplier.** Export is valued at 90 % of the unscaled wholesale price.
4. **Archetypes take the first open value of every unspecified choice.** With the defaults that makes every archetype air-cooled with roof heat rejection, which in T1 puts most of them out of reach of full load (chapter 47).
5. **Identical options.** Options that differ only in choices that change no number appear as separate rows with identical results (T1 ranks 10 and 11).
6. **Two density rules disagree.** The agreed IT estimate from area (5.5 kW/m² of floor) and the building massing (0.7–1.8 kW/m² of floor) differ by a factor of three to eight (chapter 16).
7. **Grid connection cost on islanded options.** Every option pays for the full offered connection, including islanded options that never use it. The agreed contracted capacity and fixed charge change this, but how islanded options are treated is open.
8. **"Opex year 1"** in the option detail is the first year of the analysis (2027 for T1), which has no load, so it shows €0.
9. **"First power"** can be month 0, before any phase exists, because it measures when the supply could energise phase 1.
10. **The status file's run time** (9–10 s) is out of date; the owner's figure is 15–20 s.

# 55. Verification and quality checks {#ch55}

## How the tool was built and checked

Each part of the program ("slice") was built by Claude Opus and then checked three times by Claude Haiku (claims and regressions; the brief's requirements; the browser, the phone layout and accessibility), followed by an Opus review that judged every finding. The record is in `verification/HISTORY.md`.

Highlights from that record:

- **Brief**: three Haiku checks and an Opus review before building; for example the first check caught that the brief's dominance filter hid options automatically, against its own "nothing hidden" principle.
- **Core and run log**: the Opus review corrected the combination count (57,024 valid + 4 archetypes = 57,028) and added the worker watchdog.
- **Trade-off view**: 98 review findings, 92 accepted; an infinite-cost dominance bug was found and fixed; accessibility checks (axe) show no serious or critical problems in light and dark themes.
- **Site**: an independent checker found no rule violations in 8,000 layouts.
- **Port (dispatch, tornado, PPA rule)**: the review confirmed the engine and fixed the sign of the PPA hedge's present value on 23 T1 options; 44 Node tests and 29 browser tests pass.
- **Packaging**: the Windows program is checked for structure, security settings and the absence of any network connection (traced at process level). The final Opus review of the packaging did not complete (usage limit).
- **Not yet done**: a screen-reader walk-through (NVDA, VoiceOver).

GitHub runs the tests, the build and the browser tests on every push to `main`, and builds the Windows program when the packaging changes.

## Checks built into the engine

- **Energy balance** every hour of every simulated year (warning above 10⁻⁶ MWh).
- **Reconciliation**: LCOE × present value of energy = NPV, for every option.
- **Re-run equality**: the Dispatch and Sensitivity tabs re-run an option and confirm they reproduce the ranking's figures.
- **Determinism**: the same inputs and seed give the same log, apart from timings.

## How this guide was checked

Every number in the worked examples comes from a run of the T1 example exported directly from the engine (the ledger, the hourly records, the scoring ranges), and every diagram was drawn from that data. Formulas were transcribed from the source code and checked against the T1 numbers (for example the capex lines, residual value, LCOE, scores and time-to-power above). Published values were taken from the sources listed in chapter 59, with their dates.

# 56. Status: built, agreed and open {#ch56}

| Feature | Status | Chapter |
|---|---|---|
| Windows program, offline, unsigned | Built | 2 |
| Single-file version | Built | 2 |
| Phone version | Dropped | 2 |
| Inputs with defaults and "unverified" tags | Built | 14–19 |
| Per-option "assumed default" flags with sources | Agreed | 14, 42 |
| Map pin, offline map, country from pin | Agreed | 14 |
| Currency per site | Agreed | 14 |
| ASHRAE design station, NOAA or EPW weather | Agreed | 6 |
| Real hourly data (ENTSO-E and others) at release | Agreed | 52 |
| Site tab as Beta (switch, label, kept out of the ranking) | Built (22 Oct 2026) | 28, 30 |
| Site area as one number (land for wind without the layout) | Agreed; open question | 15, 28 |
| Solar from roof and ground areas for PV; carport solar and belly tanks removed | Built (22 Oct 2026) | 8, 15, 35 |
| Power adequacy first: adequacy status, ranking, flag, option detail, header count, grid shortfall analysis (work package 3b, first part) | Built (23 Oct 2026) | 21, 22, 23, 42, 44, 45 |
| Plant ordered from day one; 6-month permitting allowance only under the IED or Seveso (work package 3b) | Built (23 Oct 2026) | 8, 35 |
| Firm generation sized two ways: average load (baseload) and permanent shortfall (top-up), choice C4s (work package 3b) | Built (23 Oct 2026) | 20, 34, 35 |
| Bridging plant split when the grid arrives: shortfall share kept as prime, rest as backup (C3, work package 3b) | Built (23 Oct 2026) | 20, 34, 35 |
| Permitting outlook: likely / uncertain / unlikely by technology, with ready and needed months (work package 3b; country differences still to research) | Built (23 Oct 2026) | 8, 23, 42 |
| IT the grid supports by grid period; grid-matched phasing reference in the run summary (work package 3b) | Built (23 Oct 2026) | 21 |
| Backup per building or pooled (C5a); retired bridging plant backs up whole buildings; pooled carries a client-perceived risk item (work package 3b) | Built (23 Oct 2026) | 20, 35, 43 |
| Batteries sized to the shortfall, with a recharge check (work package 3b) | Open: whether a battery counts as firm supply against the design load | — |
| IT load estimated from area | Agreed | 16 |
| Load shapes, AI profiles | Agreed | 16 |
| Flexibility with triggers; battery response | Agreed | 16 |
| Battery split: reserve and economic | Agreed | 18 |
| Gensets 6 h tests, separate test load, primary hours | Agreed | 18 |
| Grid "not known" with country defaults | Agreed | 17 |
| Contracted grid capacity per option | Agreed | 9, 19 |
| Fixed grid connection charge | Agreed | 9, 19 |
| Grid connection capex default 0 with reference | Agreed | 9, 19 |
| Several evaluation periods | Agreed | 11, 19 |
| Latest carbon and gas prices with dates; escalation forecasts | Agreed | 19 |
| Revenue options (off) | Agreed | 19 |
| Cooling chosen by the engineer | Agreed | 6 |
| No PPA income without delivery | Built | 39 |
| O1, O2, O3 PPA and carbon rules | Agreed | 12, 42 |
| 8,760-hour dispatch for every option | Built | 37 |
| Representative-day screening and verification | Agreed | 10 |
| Options table, option detail, trade-offs | Built | 22–24 |
| Top five cards with pros and cons | Agreed | 22 |
| Trade-off defaults (cost vertical, resilience bubbles) | Agreed | 24 |
| Compare up to three | Agreed | 25 |
| Dispatch tab | Built | 26 |
| Dispatch for any period, verified options | Agreed | 26 |
| Tornado (7 drivers, score and LCOE) | Built | 27 |
| Tornado with driver list, LCOE default | Agreed | 27 |
| Run log export | Built | 29 |
| PDF report; no Excel | Agreed | 29 |
| General settings: Site tab (Beta) switch | Built (22 Oct 2026) | 28, 30 |
| General settings: theme, run-log option, "About this copy" | Proposed | 30 |
| Project save and reopen | Open | 4 |
| Plain-English summary of the result | Not built; in the brief, not discussed in the walkthrough | — |
| Parallel coordinates, choice-impact chart | Not built; in the brief, not discussed in the walkthrough | — |
| Monte Carlo ranges, robust pick, breakevens, scenarios | Not built; in the brief, not discussed in the walkthrough | 13 |

## Open points

Collected from the chapters:

- How contracted capacities are set per option; whether islanded options at 0 MW pay the fixed charge (19, 48).
- Which evaluation period sets the score (48).
- How "prefer the no-PPA option" (O1) works in the ranking (48).
- Representative-day method and the number of verified options (10, 48).
- Whether the top five show distinct strategies, and whether pros and cons compare against the whole run or the five shown (22).
- The land budget for wind with the Site tab hidden (15); solar was settled on 22 October 2026 (OPEN-QUESTIONS 53).
- Which density rule to keep (16).
- Project save and reopen (4).
- Whether more than one cooling type can be compared in a run (6).

## Research before the first release

From the walkthrough log:

- Site coverage 35 %; the IT density benchmark (one campus; IT or facility load); the storey assumption.
- Grid availability and connection time by country; grid connection capex by country.
- Escalation forecast sources; the EU ETS price source; the wholesale gas source and its terms.
- The ASHRAE data licence.
- Protomaps and OpenStreetMap licence and attribution; the map file size at roads level.
- Cleaning NOAA hourly data into a usable year.
- Deliverability penalties and the other judgement values.
- Run speed and the representative-day tier.

To these, chapter 50 adds: the defaults marked "update suggested" (UK carbon price, hydrogen price, exchange rates, wholesale prices for seven countries, grid carbon for 19, roof PV O&M, battery and gas-turbine capex, wind PPA, genset unit size and lead time, SMR), and the basis for grid carbon.

# 57. Troubleshooting and questions {#ch57}

**Windows says "Windows protected your PC".** The program is not code-signed. Choose More info, then Run anyway (chapter 2).

**The status line says "running on the main thread instead".** The browser blocked background threads (common when opening the single file from disk). The results are the same; the run is slower. Use the Windows program, or another browser.

**A run takes 15–20 seconds.** That is normal for 2,000 options at 8,760 hours each. With sampling off, a run can screen tens of thousands of options and take much longer.

**I changed one input and scores moved everywhere.** Scores are relative to the run: a change that moves the best or worst option on an axis rescales everyone. Also, the sample of options can change. Compare within a run.

**Two runs with the same inputs differ.** They should not. Check the seed and the input hash in the run log; any input change (even the analysis start) changes the results.

**An option with unmet load ranks high.** Constraints are flagged, not enforced. Unmet load lowers the energy delivered and shows as a major flag; check the time-to-power and unmet columns, or rank requirement-compliant options first.

**Adding a PPA does not lower the carbon.** The default carbon metric is location-based, which counts PPA energy at grid intensity. Switch the carbon metric to market-based or hourly CFE.

**The LCOE shows "—".** The option delivers no energy (for example a grid-only option with no grid), so its LCOE is not finite; it scores 0 on cost.

**No wind options.** Sites of 20 ha or less get no wind by default. Include it from the "values not generated" list, or lower the threshold.

**Gas plant never runs.** Gas availability is "No", or the gas date is later than you think (18 months after the start by default).

**Hydrogen options are always flagged.** Hydrogen availability is "No" by default; the plant never runs and the option is flagged.

**The archetypes rank low.** They take the first open value of each choice they do not specify, which with the defaults means air cooling; on a constrained grid that can mean never reaching full load (chapter 47).

**The top options look the same.** They often are near neighbours. Use the filters (for example "archetypes only" or hide dominated), lock a choice to compare strategies, or look at the trade-off chart.

**Where are my results saved?** Nothing is saved automatically. Save the run log; the agreed PDF report will hold inputs and results.

# 58. Glossary {#ch58}

**AACE Class 5**: the concept-stage class of cost estimate in the AACE International classification, with a wide accuracy range.

**Absorption chiller**: a chiller driven by heat rather than electricity; used with CHP (trigeneration).

**Adder (non-commodity)**: network charges, levies and other costs paid per MWh on top of the wholesale price.

**AIS / GIS**: air-insulated or gas-insulated substation. GIS is smaller and dearer.

**Ancillary load**: lighting, offices, security and other non-IT, non-cooling load.

**API**: application programming interface: a web service a program uses to fetch data.

**Archetype**: one of eleven reference strategies always generated in every run.

**Autonomy**: hours the backup can run on stored fuel (or battery) at the critical load.

**Axis score**: an option's score from 0 to 100 on one axis, relative to the other options.

**BESS**: battery energy storage system.

**Block (backup)**: a group of 10 backup units to which N+1 redundancy is applied.

**Bridging**: supplying the site from on-site plant until the grid connection is large enough.

**Capex / opex**: capital expenditure (building plant) / operating expenditure (running it).

**Catcher**: distributed-redundant backup in which blocks share spare units.

**CFE (hourly carbon-free energy)**: share of each hour's demand met by carbon-free supply.

**CHP / trigeneration**: combined heat and power; with absorption chillers, also cooling.

**Choice (C1–C20)**: a design decision whose values the tool combines into options.

**Compatibility rule**: a rule removing logically impossible combinations.

**Contingency**: an allowance added to capex for unknowns (10 %).

**COP**: coefficient of performance of a chiller: heat removed per unit of electricity.

**Critical load**: the load the backup must carry: IT plus essential mechanical cooling.

**Curtailment**: on-site generation wasted because it is not needed and cannot be stored or exported.

**Deliverability**: the tool's 0–100 measure of how hard an option will be to deliver.

**Design load**: the facility load on the hottest hour with all IT installed; sizes the supply.

**Discount factor**: the multiplier that converts a future cost into today's money.

**Dispatch**: deciding, hour by hour, which source supplies the load.

**Dominated**: beaten or equalled on every axis by another option (with at least as good statuses).

**Dry-bulb / wet-bulb temperature**: air temperature / the lowest temperature reachable by evaporating water.

**EHV, HV, MV**: extra-high, high and medium voltage.

**Emission factor**: tonnes of CO₂ per MWh of fuel burnt.

**EPW**: EnergyPlus weather file format.

**ERA5**: the European reanalysis of global weather, hourly since 1940.

**Exceedance**: grid import above the offered capacity (when "Show exceedance" is chosen).

**Flag**: a warning attached to an option or a run: major, minor or info.

**Free cooling**: cooling with outdoor air or water, without compressors.

**Frontier (trade-off)**: the options not beaten on both of two chosen axes.

**GFA**: gross floor area.

**Hedge (PPA, not counted)**: the settlement of contracted PPA volume that was not delivered; reported outside the ledger.

**HVO**: hydrotreated vegetable oil, a renewable diesel substitute.

**IED**: the EU Industrial Emissions Directive (combustion plant of 50 MWth or more).

**Islanded**: operating without a grid connection.

**IT load**: power used by servers, storage and network equipment.

**Latin hypercube**: a sampling method that spreads a sample evenly across every choice's values.

**LCOE**: levelised cost of energy: NPV of cost ÷ present value of energy delivered.

**Location-based / market-based**: Scope 2 accounting with the grid average / with contracts.

**MCPD**: the EU Medium Combustion Plant Directive (units of 1 to 50 MWth).

**Merit order**: the order in which sources are used to meet demand each hour.

**Minimum stable load**: the lowest output at which a unit can run steadily.

**MWp / MWth**: megawatt-peak (solar rating) / thermal megawatt (fuel input).

**N, N+1, 2N**: no spare, one spare (per block), a full second system.

**NPV of net cost**: the sum of all costs (less revenue) in today's money.

**Option**: one complete energy strategy: a set of choices plus sizes.

**PMTiles**: a single-file format for map tiles, readable without a server.

**POC**: point of connection to the grid.

**PPA**: power purchase agreement: a long-term contract to buy electricity from a generator.

**PUE**: power usage effectiveness: facility energy ÷ IT energy.

**Ramp**: the rise of a phase's IT load from 50 % at opening to 100 % a year later.

**Real terms**: money in today's prices, without inflation.

**Registry**: the list of all 496 default records.

**Representative days**: a small set of typical days used to approximate a year quickly.

**Residual value**: the value of plant life remaining at the end of the evaluation period, credited back.

**Resilience status**: Meets, Meets with flags, or Does not meet the backup requirement.

**Run**: one evaluation of all options for one set of inputs.

**Seed**: the starting number of the random-number generator; same seed, same results.

**Seveso III**: the EU directive on major-accident hazards from dangerous substances.

**Site fit**: Fits, Fits with flags or Does not fit, from the site layout (Beta).

**SMR**: small modular reactor.

**SOFC**: solid oxide fuel cell.

**Strike price**: the agreed price per MWh in a PPA.

**Synthetic profile**: an hourly series generated by the program to match annual targets, not measured.

**Time-to-power**: how soon the supply can carry the full design load, plus a penalty for gaps.

**Topology**: the redundancy arrangement of backup (N, N+1, 2N, catcher).

**TTF**: the Dutch Title Transfer Facility, the main European gas price benchmark.

**UPS**: uninterruptible power supply: batteries that carry the load until gensets start.

**Utilisation**: average IT draw as a share of installed IT.

**WACC**: weighted average cost of capital; the discount rate.

**Weights**: the importance given to each axis in the weighted score.

**Whitespace**: data hall floor area for IT racks.

**WUE**: water usage effectiveness: litres of water per kWh of IT energy.

# 59. References {#ch59}

## Project documents

- Walkthrough decision log, 21 October 2026 (project document `claude/walkthrough-decisions-2026-10-21.md`).
- Handoff note (project document `claude/handoff-concept-tool.md`).
- Repository `energy-strategy-tool/`: `STATUS.md`; `brief-v2/BRIEF.md`, `ASSUMPTIONS.md`, `OPEN-QUESTIONS.md`; `app/BUILD-NOTES.md`; `app/src/engine/*.js`; `packaging/README.md`; `verification/HISTORY.md`.

## Market prices and exchange rates

- LSEG, *Q1 2026 EUA and UKA price update*. <https://www.lseg.com/content/dam/data-analytics/en_us/documents/reports/lseg-q1-2026-eua-and-uka-price-update.pdf>
- S&P Global, "European carbon prices drop to 7-week low", 5 October 2026. <https://www.spglobal.com/energy/en/news-research/latest-news/natural-gas/100526-european-carbon-prices-drop-to-7-week-low-as-market-eyes-upcoming-policy-agenda>
- S&P Global, "UK carbon prices surge on Burnham EU summit pledge", 29 September 2026. <https://www.spglobal.com/energy/en/news-research/latest-news/energy-transition/092926-uk-carbon-prices-surge-on-burnham-eu-summit-pledge>
- European Commission, Spring 2026 Economic Forecast, box on EU energy markets, 21 May 2026. <https://economy-finance.ec.europa.eu/economic-forecast-and-surveys/economic-forecasts/spring-2026-economic-forecast-slowdown-growth-energy-shock-drives-inflation/eu-energy-markets-evolving-gas-electricity-price-linkages-more-volatile-system_en>
- NAGA, natural gas price prediction (bank forecasts), October 2026. <https://naga.com/en/news-and-analysis/articles/natural-gas-price-prediction>
- World Bank blog, "Global gas price paths diverge as LNG reshapes market balances". <https://blogs.worldbank.org/en/opendata/global-gas-price-paths-diverge-as-lng-reshapes-market-balances>
- World Bank, Commodity Price Data (the Pink Sheet). <https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/world-bank-commodities-price-data-the-pink-sheet>
- fuel-prices.eu, "EU fuel prices 2026: from Iran strikes to September records" (EU Weekly Oil Bulletin data). <https://www.fuel-prices.eu/news/eu-fuel-prices-2026-from-iran-strikes-to-september-records/>
- European Central Bank, euro foreign exchange reference rates, 21 October 2026. <https://www.ecb.europa.eu/stats/shared/pdf/eurofxref.pdf>
- EEX, EU ETS auctions. <https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions>

## Electricity prices, carbon and network charges

- ACER, annual average day-ahead prices 2024 (from ENTSO-E). <https://aegis.acer.europa.eu/chest/dataitems/731/view>
- Ember, European wholesale electricity price data. <https://ember-energy.org/data/european-wholesale-electricity-price-data>
- Electricity Maps, *Grid in review 2025* (annual averages by country).
- GME, PUN index, via comparasemplice.it (12 months to December 2025).
- Our World in Data, carbon intensity of electricity generation (Ember data). <https://ourworldindata.org/grapher/carbon-intensity-electricity>
- 50Hertz Transmission, price sheet 2026 (network charges and construction-cost contributions). <https://www.50hertz.com/xspProxy/api/staticfiles/50hertz-client/dokumente/vertragspartner/netzkunden/netzzugang/251205_finales%20preisblatt%2050hertz%202026.pdf>
- Eurostat, electricity and gas prices for non-household consumers (nrg_pc_205, nrg_pc_203).

## Technology costs

- Lazard, *LCOE+*, July 2026. <https://lazard.com/media/sdvdrvc5/lazards-lcoeplus_vf.pdf>
- US EIA, *Capital Cost and Performance Characteristics for Utility-Scale Electric Power Generating Technologies* (AEO2025). <https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf>
- Fraunhofer ISE, *Stromgestehungskosten Erneuerbare Energien*, July 2024. <https://www.ise.fraunhofer.de/content/dam/ise/de/documents/publications/studies/DE2024_ISE_Studie_Stromgestehungskosten_Erneuerbare_Energien.pdf>
- Danish Energy Agency, technology data for generation of electricity and district heating (updated August 2026). <https://ens.dk/en/analyses-and-statistics/technology-data-generation-electricity-and-district-heating>
- IRENA, *Renewable Power Generation Costs in 2025*, July 2026.
- BloombergNEF, Energy Storage System Cost Survey 2025, reported by Energy-Storage.news. <https://www.energy-storage.news/?p=92133>
- Datacentres.com, article on the costs of diesel backup power for data centres, 3 September 2026. <https://www.datacentres.com/news/diesel-duty-cycles-and-dollars-inside-the-2-8m-per-mw-backup-power-stack-powerin-slot3-2026-09-03>
- World Nuclear News, Darlington SMR project, 23 May 2025.
- Wärtsilä, data centre engine order, 16 April 2026.

## Fuels and emission factors

- IPCC, *2006 Guidelines for National Greenhouse Gas Inventories*, Vol. 2, Ch. 1, Table 1.4. <https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf>
- S&P Global, HVO price outlook, 30 December 2025.
- ACER, hydrogen market monitoring report 2025, reported by pv magazine, 3 December 2025.

## PPA prices

- LevelTen Energy, PPA Price Index, Q2 2026 (23 July 2026).
- Pexapark, European PPA composite, September 2026 (14 October 2026).

## Data centres

- Uptime Institute, Global Data Center Survey 2025 and 2026 (29 July 2026).
- European Commission, first aggregate report on data centres under the Energy Efficiency Directive (reported by DCD, 17 April 2026).
- Orrick, German Energy Efficiency Act amendments, 16 April 2026.
- NFPA 110, *Standard for Emergency and Standby Power Systems*.
- DCD and W.Media on STACK Erskine Park, April 2025.

## Regulation and finance

- Directive 2010/75/EU (Industrial Emissions Directive). <https://eur-lex.europa.eu/eli/dir/2010/75/oj>
- Directive (EU) 2024/1785 (revision of the IED). <https://eur-lex.europa.eu/eli/dir/2024/1785/oj>
- Directive (EU) 2015/2193 (Medium Combustion Plant Directive). <https://eur-lex.europa.eu/eli/dir/2015/2193/oj>
- Directive 2012/18/EU (Seveso III). <https://eur-lex.europa.eu/eli/dir/2012/18/oj>
- Scottish Government, hydrogen planning guidance (Seveso thresholds for hydrogen).
- AACE International, Recommended Practice 18R-97, cost estimate classification.
- UK Department for Energy Security and Net Zero, *Electricity Generation Costs 2025* (January 2026).

## Grid connections

- The Register, Amazon Web Services on European grid connections, 3 February 2026.
- International Energy Agency, on grid connection waits in Europe's main data centre hubs (Frankfurt, London, Amsterdam, Paris and Dublin).
- Commission for Regulation of Utilities (Ireland), large energy users connection policy, decision of December 2025.
- Ofgem (Great Britain), connections consultation, 29 July 2026.
- Datacentres.com, Amsterdam grid capacity, 8 September 2026.

## Data sources and APIs

- ENTSO-E Transparency Platform. <https://transparency.entsoe.eu/>
- ENTSO-E API access procedure, as documented in the entsoe-api-node project. <https://github.com/rabinage/entsoe-api-node/blob/main/README.md>
- Ember API. <https://ember-energy.org/data/api>
- PVGIS API. <https://re.jrc.ec.europa.eu/api/v5_3/>
- Copernicus Climate Data Store. <https://cds.climate.copernicus.eu/>
- NOAA NCEI, Global Historical Climatology Network hourly. <https://www.ncei.noaa.gov/oa/global-historical-climatology-network/index.html#hourly/>
- The ISD redistribution notice, quoted on the EnergyPlus support list. <https://onebuilding.org/archive/energyplus-support/msg26071.html>
- ECB Data Portal API. <https://data-api.ecb.europa.eu/service/data/EXR/D.GBP.EUR.SP00.A?format=csvdata>
- Eurostat API, getting started. <https://ec.europa.eu/eurostat/de/web/user-guides/data-browser/api-data-access/api-getting-started/api>
- OpenStreetMap copyright and licence. <https://www.openstreetmap.org/copyright>
- Protomaps documentation. <https://docs.protomaps.com/>
