# Defaults research, batch 3: proposals (research, 7 November 2026)

Part F of the research run of November 2026 (work package 0, further batches). 549 of 573 records are "indicative — unverified" and 24 "sourced — not independently checked". This batch takes the records in order of how much they move the result, using the T1 tornado as reported in the user guide's plain-English summary chapter (`docs/user-guide/src/03-part3b.md`): **grid import price** (moves LCOE by up to €30.7/MWh), then the **grid full-connection date** (€11.7/MWh), then **capex** (€10.2/MWh). **Nothing in `app/` or the defaults register is changed**: every line below is a proposal for the owner to approve, source by source. The machine-readable list is `defaults-batch-3-proposals-2026-11.csv`.

Confidence labels as in the other notes. Nothing indicative is presented as verified.

## Where this batch stopped

This batch stopped after the records below, to finish the run within the owner's usage (the run had already hit a usage limit once). Done: the grid network adder (by country), the cable route cost, the gas connection pipe cost, the substation cost cross-checks and the diesel price. Not reached: the gas commodity price by country, the gas transport adder, the grid connection date and capacity defaults by country, the escalation sources, the ASHRAE and Protomaps licences, NOAA cleaning and the other items of the decision log's "Open research before first release". They are listed at the end for the next batch.

## 1. Grid import price: the non-commodity adder (`grid.priceAdder`, by country)

The grid import price is wholesale × multiplier + the adder. The wholesale part was sourced in batch 2 (Electricity Maps 2025). The adder (€25–55/MWh, all "indicative — unverified") stands for network charges and levies. Part A of this run gives the **network** charges by country, so the network share of the adder can now be worked out for a transmission-connected campus.

**Method (worked out):** a flat campus of 100 MW contracted and 100 MW peak, 85 MW average (745 GWh a year), at the transmission level, with each country's 2026 tariff from Part A (2025 where 2026 was not read). Network charges only: policy levies, renewable support charges and electricity taxes were **not researched** and are not included.

| Country | Adder today (€/MWh) | Network charges found (per MWh) | What is left out |
|---|---|---|---|
| PT | 40 | €10.5 | Levies outside the access tariff (ERSE's own MAT average: €11.6/MWh) |
| ES | 40 | €2.1 for the power part only | Energy terms by period (not averaged); taxes |
| NL | 45 | €16.5 | Energy tax, renewable surcharge |
| GB | 55 | £10.8 (TNUoS) | BSUoS, policy levies; the residual is per site, so this depends on size |
| IE | 50 | €34.2 (of which system services about €27) | PSO levy and other charges |
| DE | 55 | €14.0 | Statutory levies, electricity tax; before any bandload discount |
| FR | 40 | €4.1 (400 kV) / €7.0 (150–225 kV) | Taxes |
| AT | 45 | €6.0 | Levies |
| BE | 50 | €8.3 | Federal and regional levies |
| DK | 40 | DKK 23.8 plus losses | Electricity tax |
| FI | 30 | €4.8 | Electricity tax |
| IT | 45 | €4.7 (transmission only) | Distribution, metering and general system charges (large in Italy) |
| LV | 35 | €2.3 | Levies |
| LU | 45 | €1.4 | Levies (2026 includes a state contribution) |
| NO | 25 | NOK 9.1 plus losses | Regional grid, electricity tax |
| SK | 40 | €7.7–17.6 | Levies; the range is the system services group |
| CH | 50 | CHF 19.7 | Levies |
| GR | 40 | €7.1 (secondary sources) | Other regulated charges |
| HR | 40 | €7.8 (2025) | Levies |
| CZ | 45 | CZK 366 (2025, with system services) | Renewables support about CZK 495 |
| HU | 40 | HUF 5,689 (before a listed discount) | Other levies |
| BG, CY, EE, IS, LT, MT, PL, RO, SE | — | See Part A (some per-MWh charges found; not all worked out) | — |

**What it shows:** at the transmission level, **network charges are typically €2–20/MWh** (Ireland higher because of system services). Today's adders of €25–55/MWh are **far above the network part** in every country checked. The gap is either levies and taxes (not yet researched) or the adder is too high for a transmission-connected campus. **Proposal:** do not change the adders yet. Research the levies and taxes per MWh for large transmission-connected users by country (the next batch), then set the adder as network (this table) + levies, each with its source. If the owner ticks the new per-MW grid charge (OPEN-QUESTIONS 160–165), the per-MW part must come out of the adder at the same time, or it is counted twice (Part A, question A4).

## 2. Grid cable route cost (`tech.substation.cablePerKm`)

- **Today:** €1.5 m per km for every voltage (range €0.8–3 m), indicative.
- **Published (ACER, Unit Investment Cost Indicators, 24 April 2026, Table I.1, medians of underground AC cable):** 110–150 kV single circuit **€0.68 m/km** (n = 20), double circuit **€1.87 m/km** (n = 7); 220 kV single **€2.08 m/km** (n = 20), double **€3.28 m/km** (n = 9). No 400 kV underground class. Ranges are wide (€0.36–5.56 m/km).
- **Proposal:** one value per voltage band (and per circuit if the tool sizes circuits), with ACER as the source and its range as low/high. Confidence: published and clear (small samples).

## 3. Gas connection pipe (`tech.gasConnection.pipePerKm`)

- **Today:** €0.8 m per km (range €0.4–2 m), indicative.
- **Published:** ACER 2026, Table I.4: onshore pipelines of 12–16 inch, median **€2.08 m/km** (n = 4; gas, hydrogen and biomethane blending pipelines). A campus spur is usually smaller than 12 inch; no like-for-like figure found.
- **Proposal:** keep €0.8 m as a **judgement**, with a note that the only published European median (for larger pipe) is €2.08 m/km; look for a distribution-pipe source next. Today's value is far from the published figure: flag it.

## 4. Substation capex (`tech.substation.subCapexPerMW_hv`, `_ehv`): cross-checks

ACER 2026 gives substation costs per asset, not per MW (Table I.2, medians): new AIS 6–9 bays €11.34 m; new GIS 10–60 bays €38.95 m; transformers 400/110 kV €3.51 m each, 400/220 kV €6.96 m (Table I.3).

- **EHV (worked out):** a 400 MW GIS substation at €38.95 m is about **€97,000/MW**; the tool's €70,000 × GIS factor 1.4 = **€98,000/MW**: consistent.
- **HV (worked out):** a 200 MW AIS substation at €11.34 m is about **€57,000/MW**, below the tool's €80,000/MW.
- Both depend on the assumed bays and MW per substation. **Proposal:** keep both, label "judgement, cross-checked against ACER 2026 (order of magnitude)", and record the ACER medians as the low/high evidence. No change proposed.

## 5. Diesel price (`fuel.dieselPrice`)

- **Today:** €110/MWh (about €1.09/litre), indicative.
- **Published:** EU average diesel **with taxes** €2.146/litre in the week of 26 October 2026 (EU Weekly Oil Bulletin, via fuel-prices.eu), about €217/MWh. **No pre-tax figure was read.**
- **Proposal:** no value; keep €110/MWh labelled **judgement (pre-tax industrial price)** and say in the app that it excludes duty and VAT. Next batch: the Weekly Oil Bulletin's prices without taxes.

## Not reached in this batch (next, in order of influence)

1. Levies and taxes per MWh for large transmission-connected users, by country (to complete the adder).
2. Gas commodity price by country and its date (the walkthrough's rule: latest published price with date; an exchange or regulator source needs the owner's approval).
3. Grid full-connection date and capacity defaults for "not known" by country (chapter 50: no published table exists; likely to stay judgement).
4. Technology capex not yet sourced (substation connection capex per MW; gas engine and turbine O&M, efficiencies and lead times).
5. The decision log's list: escalation sources; ASHRAE station data licence; Protomaps and OpenStreetMap licence and map size; NOAA cleaning; deliverability penalties (judgement); run speed.

## Second batch of records (7 November 2026, after the run)

Owner's decision of 7 November 2026 (OPEN-QUESTIONS 201): nothing goes into the tool until all the research is done. These are proposals only.

### 6. Gas commodity price (`country.gas`, by country)

- **Today:** €40–45/MWh_th for most countries (Cyprus 70, Malta 60, Iceland 80), indicative.
- **Published 2025 average:** **€42.9/MWh_th** (PyPSA technology-data, from the World Bank's 2025 commodity prices and the TYNDP 2024 inputs; dataset commit e5d25186). Today's defaults sit on it.
- **Latest dated price:** the Dutch TTF hub closed at **€85.6/MWh on 6 November 2026** (SoldiOnline; Investing.com reports €87.40 traded the same day, after a week down 15 % on hopes of an end to the US–Iran conflict). On 23 June 2026 it was €41.6 (Trading Economics). The market has doubled since mid-year.
- **Proposal:** keep the defaults as the labelled 2025 average, show the latest dated TTF price beside them, and offer the high-price case. Under the walkthrough's rule an exchange price needs the owner's approval as a source. Country spreads to TTF were not researched.

### 6b. Better sources for the gas price (owner's question, 7 Nov 2026, 23:41 local)

The owner asked for better sources than a news site's daily close. What was found:

| Source | What it gives | Fits the walkthrough rule ("latest published price, with date, from a free monthly source")? | Read? |
|---|---|---|---|
| **World Bank, Commodity Price Data ("Pink Sheet")**, monthly file `CMO-Historical-Data-Monthly.xlsx` (series "Natural gas, Europe", the TTF price) | A monthly average, official, published every month; the document page lists monthly reports through October 2026 | **Yes**: official, monthly, free to download. It is also the source the PyPSA technology data used for its 2025 average | The page was read; the **file could not be**: the web reader cannot open spreadsheets and the session's shell was refused (HTTP 403). So the latest monthly value was not read. The page states no licence: **to confirm** |
| **Eurostat**, natural gas prices for non-household consumers (half-yearly, by country and consumption band) | Retail price paid by businesses, by country. Latest release 8 May 2026 (second half of 2025): EU average €6.05 per 100 kWh in the 10,000–100,000 GJ band; Bulgaria €4.14 lowest, Sweden €10.65 highest | **No** for the commodity price (it includes network charges and some levies, the tax basis of the headline figure was not stated, and it is half-yearly). **Useful for country spreads**, which were not researched | The news item was read; the large-user bands (a campus burning gas would sit above 4 million GJ a year) are in the database and were not read |
| **ACER** (EU energy regulators' agency), hub price data (AEGIS "CHEST" application) | Hub prices | Not checked | Surfaced by search, not read |
| Daily TTF close (SoldiOnline, Investing.com) | One day's price (€85.6/MWh on 6 Nov 2026) | No (news site, one day) | Read |

**Answered 2026-11-07 by the owner: yes, the World Bank's monthly series is the source (OPEN-QUESTIONS 228).** **Default: the latest month, with the 2025 average shown beside it (OPEN-QUESTIONS 229).**

**Proposal (replaces the one in section 6):** use the World Bank's monthly "Natural gas, Europe" series as the source of the latest published price, read at each release and bundled with its month; keep the daily TTF close only as a cross-check; use Eurostat's large-user bands for country spreads later. A monthly average smooths a one-day spike. The World Bank's value converts from US dollars per million BTU to €/MWh with the tool's exchange rate (1 MWh = 3.412 million BTU).

### 7. Gas transport adder (`fuel.gasTransportAdder`)

- **Today:** €4/MWh_th (range 2–8), indicative.
- **Cross-check:** Germany's proposed single transmission tariff for domestic exits is **€6.06 per kWh/h a year** (ACER report of 8 April 2025): about **€0.7/MWh at full load, €1.4/MWh at 50 % load** (worked out). That is exit only; distribution and metering are extra.
- **Proposal:** keep €4 as **judgement**, with the German figure recorded as the low end for a transmission-connected campus.

### 8. Gas turbine running costs and efficiency (`tech.gasTurbine.*`)

Revised on 8 November 2026 after reading the Danish Energy Agency's sheet for 5–40 MW turbines, which fits the tool's 30 MW unit better than the large OCGT sheet used first.

- **Fixed O&M:** today €12/kW/yr. Published: agency, 5–40 MW, **€19.5** (2015 €, insurance excluded, daily start); agency, large OCGT, **€10.6** (worked out); EIA aeroderivative **about €8.6**. Proposal: **keep €12 as judgement** inside the published range €8.6–19.5.
- **Variable O&M:** today €6/MWh. Published: agency €5.4 (5–40 MW) and €6.01 (large); EIA about €5.1. Proposal: keep €6, now **sourced**.
- **Efficiency:** today 0.38 (LHV). Published: agency 0.37 nominal / 0.35 annual average (5–40 MW), 0.405 (large); EIA about 0.40 LHV (worked out). Proposal: **keep 0.38 as judgement** inside the published range.
- **Sources:** Danish Energy Agency, "Technology Data for Energy Plants for Electricity and District Heating Generation" (August 2016, amended January 2020), workbook mirrored in PyPSA technology-data (commit e5d25186) https://raw.githubusercontent.com/PyPSA/technology-data/e5d2518647b3ade0e448679141550a4c6f0c602e/inputs/technology_data_for_el_and_dh.xlsx; PyPSA `costs_2025.csv`; EIA AEO2025 capital cost study https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf (accessed 7–8 Nov 2026).

### 9. Gas engines (`tech.gasRecip.*`)

Read on 8 November 2026 from the agency's sheet 06 (spark ignition engine, natural gas, 1–10 MWe), 2020 column, 2015 €:

| Record | Today | Agency (range) | Proposal |
|---|---|---|---|
| Fixed O&M | €15/kW/yr | €9.75 (7–20), at 4,000 h a year | €9.75, labelled 2015 € |
| Variable O&M | €8/MWh | €5.4 (4–12) | €5.4, labelled 2015 € |
| Efficiency (LHV) | 0.44 | 0.45 annual average, 0.47 nominal (0.38–0.48) | 0.45 |
| Minimum stable load | 0.3 | 0.5 (0.3–0.5) | question for the owner |
| Life | 20 years | 25 (25 to more than 25) | 25 |
| Build time | 6 months | 1 year (0.5–1.5) | 12 months |
| Capex | €900/kW (sourced in batch 2) | €0.95 m/MW (0.9–1.1), 2015 € | no change |

The catalogue is from 2016 (amended 2020) and in 2015 money; the figures are not escalated. Space: the agency gives 40 m²/MW for the engine plant itself; today's 200 m²/MW includes more of the site and is not compared.

### 10. Licences

- **ASHRAE climatic design data:** a **paid licence** (one-time fee, ASHRAE Bookstore) is offered to developers who include the data in their own software. This matches the decision already taken (OPEN-QUESTIONS 64, 23 Oct 2026: not bundled; every option carries the flag "design temperatures from the synthetic country profile"). No new proposal.
- **Protomaps basemap:** matches the user guide's chapter 50: an **ODbL Produced Work**, OpenStreetMap attribution required; the planet file is about **120 GB** to zoom 15, and each extra zoom level roughly doubles it (use `pmtiles extract --maxzoom`). Offline redistribution follows the ODbL (Part G, question G3).

### 11. Escalation sources (walkthrough: "published forecast per commodity, overridable")

- **Gas, near term:** World Bank, Commodity Markets Outlook (April 2026): natural gas Europe **US$12.0/mmbtu in 2025, 15.0 in 2026, 12.0 in 2027** (about €36.6, €45.8 and €36.6 per MWh, worked out at 1.1181 $/€). It stops at 2027. An October 2026 edition may exist (press reports) but was not read.
- **Gas and carbon, long term:** ENTSOG and ENTSO-E, TYNDP 2026 scenarios methodology (June 2026), Table 6, in 2024 money: gas **€9.2/GJ in 2030 (€33.1/MWh), €9.8 in 2035 (€35.3), €10.4 in 2040 (€37.4)**; CO2 **€97.5/t in 2030, €197.5 in 2035, €297.5 in 2040**, the Commission's recommended values for national climate plans.
- **Electricity:** no published forecast per country was found in this pass; the TYNDP market results would be the next place to look.
- **Proposal:** World Bank for the first two years, then the TYNDP 2026 path, each labelled with its edition; the engineer can override. Note that both sit far below the TTF price of November 2026 (€85.6/MWh).

### 12. NOAA hourly weather: source and cleaning

- **Already in place (corrected 8 Nov 2026):** the tool's weather build (`weather-data/build-stations.mjs`, OPEN-QUESTIONS 106–107, 114–115) already uses **GHCNh**, NOAA's replacement for the Integrated Surface Data, with its quality codes and the typical-year method. A first draft of this section wrongly said the tool used the retired source.
- **What the new notice changes:** nothing for the tool. NOAA retired the old ISD download paths (`/pub/data/noaa/`, `/data/global-hourly/`) on 31 July 2026 and says ISD has had no update since 24 August 2025. The build reads GHCNh from `/oa/global-historical-climatology-network/hourly/`, which the notice does not touch. The GHCNh page reports "intermittent degraded order fulfillment" during a cloud move, which could slow a release build.
- **The walkthrough's research item "NOAA hourly data cleaning into a usable year"** is covered by that build; no new proposal.
- **Sources:** https://www.nesdis.noaa.gov/news/service-location-change-integrated-surface-data-global-hourly; https://ncei.noaa.gov/products/global-historical-climatology-network-hourly (accessed 8 Nov 2026).

### Still not reached

Grid connection date and capacity defaults by country (no published table; judgement), deliverability penalties (judgement), run speed (a test, not research); country gas spreads; an electricity price forecast by country.

## Questions for the owner (copied to the progress file)

1. Approve ACER 2026 as the source for cable route costs, split by voltage band? **Answered 2026-11-07 by the owner: yes (OPEN-QUESTIONS 226).**
2. Keep the network adders unchanged until levies are researched (proposed), or lower them now to the network part plus a placeholder for levies?
3. Gas connection pipe: keep €0.8 m/km as judgement with the ACER flag, or move to the ACER median €2.08 m/km? **Answered 2026-11-07 by the owner: switch to €2.08 m/km (OPEN-QUESTIONS 227).**
4. Gas price: accept the Dutch TTF hub price, as reported by the press with its date, as the "latest dated price" shown beside the 2025 average? (The walkthrough says an exchange source needs the owner's approval.) **Replaced after the owner asked for better sources (section 6b): answered 2026-11-07, yes to the World Bank's monthly series (OPEN-QUESTIONS 228); the default is the latest month (OPEN-QUESTIONS 229).**
5. Gas engines' minimum stable load: the agency's 50 % (today 30 %), or keep 30 % for modern 10 MW engines as judgement? **Answered 2026-11-07 by the owner: keep 30 % as judgement (OPEN-QUESTIONS 230).**
6. Values from the agency's catalogue are in 2015 money: use them as published, or escalate them to today's money (needs an escalation source)? **Answered 2026-11-07 by the owner: as published (OPEN-QUESTIONS 231); an index is on the further research list.**
7. Escalation: World Bank (April 2026) for the first two years, then the TYNDP 2026 path for gas and carbon?

## Sources

| Source | Type | Published | Accessed | URL |
|---|---|---|---|---|
| PyPSA technology-data, `costs_2025.csv` (Danish Energy Agency and World Bank inputs; commit e5d25186) | Open dataset | 2025–2026 | 7 Nov 2026 | https://raw.githubusercontent.com/PyPSA/technology-data/master/outputs/costs_2025.csv |
| EIA, "Capital Cost and Performance Characteristics" (AEO2025) | Government | Jan 2024 | 7 Nov 2026 | https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf |
| ACER, "Gas Tariff Report Germany 2025" | EU body | 8 Apr 2025 | 7 Nov 2026 | https://www.acer.europa.eu/sites/default/files/documents/Publications/ACER-Gas-Tariff-Report-Germany-2025.pdf |
| SoldiOnline, TTF close 6 Nov 2026; Investing.com, 6 Nov 2026 | Press | 6 Nov 2026 | 7 Nov 2026 | https://soldionline.it/notizie/forex-commodities/gas-perche-il-ttf-scende-del-55-a-856-euro-cosa-ce-dietro |
| ASHRAE, Climatic Design Data License FAQ | Standards body | undated | 7 Nov 2026 | https://www.ashrae.org/file%20library/technical%20resources/publication%20errata%20and%20updates/_climatic-design-data-license-faq_.pdf |
| Protomaps, basemap downloads | Project documentation | 2026 | 7 Nov 2026 | https://docs.protomaps.com/basemaps/downloads |
| World Bank, Commodity Markets Outlook, April 2026 (forecast table) | International organisation | Apr 2026 | 8 Nov 2026 | https://thedocs.worldbank.org/en/doc/f3138644a1e8e2bb631399ae11d6c408-0050012026/related/CMO-April-2026-Forecasts.pdf |
| ENTSOG and ENTSO-E, TYNDP 2026 Scenarios Methodology Report | EU bodies | Jun 2026 | 8 Nov 2026 | https://www.entsog.eu/sites/default/files/2026-06/ENTSOs_TYNDP2026_Scenarios_Methodology_Report_260611.pdf |
| NOAA NESDIS, service location change for ISD (Global Hourly) | Government | 23 Jun 2026 | 8 Nov 2026 | https://www.nesdis.noaa.gov/news/service-location-change-integrated-surface-data-global-hourly |
| NCEI, GHCNh product page | Government | 2026 | 8 Nov 2026 | https://ncei.noaa.gov/products/global-historical-climatology-network-hourly |
| Danish Energy Agency, technology data workbook (via PyPSA technology-data, commit e5d25186) | Government (via open dataset) | 2016, amended 2020 | 8 Nov 2026 | https://raw.githubusercontent.com/PyPSA/technology-data/e5d2518647b3ade0e448679141550a4c6f0c602e/inputs/technology_data_for_el_and_dh.xlsx |
| ACER, "Unit Investment Cost Indicators" (2026) | EU body | 24 Apr 2026 | 7 Nov 2026 | https://www.acer.europa.eu/sites/default/files/documents/Publications/ACER-2026-Unit-Investment-Cost-Indicators.pdf |
| fuel-prices.eu, "Europe fuel prices, week of 26 October 2026" (from the EU Weekly Oil Bulletin) | Press (data aggregator) | 26 Oct 2026 | 7 Nov 2026 | https://www.fuel-prices.eu/news/weekly/europe-fuel-prices-week-2026-10-26/ |
| National tariff sources for the adder table | Regulators and operators | 2025–2026 | 7 Nov 2026 | See `grid-capacity-charges-2026-11.md`, each country |
| User guide chapter 50 (defaults compared on 21–23 October 2026) and the plain-English summary chapter (T1 tornado order) | Project document | Oct 2026 | 7 Nov 2026 | `docs/user-guide/src/05-part5.md`, `03-part3b.md` |
