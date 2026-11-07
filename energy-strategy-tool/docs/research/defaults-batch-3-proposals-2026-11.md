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

## Questions for the owner (copied to the progress file)

1. Approve ACER 2026 as the source for cable route costs, split by voltage band?
2. Keep the network adders unchanged until levies are researched (proposed), or lower them now to the network part plus a placeholder for levies?
3. Gas connection pipe: keep €0.8 m/km as judgement with the ACER flag, or move to the ACER median €2.08 m/km?

## Sources

| Source | Type | Published | Accessed | URL |
|---|---|---|---|---|
| ACER, "Unit Investment Cost Indicators" (2026) | EU body | 24 Apr 2026 | 7 Nov 2026 | https://www.acer.europa.eu/sites/default/files/documents/Publications/ACER-2026-Unit-Investment-Cost-Indicators.pdf |
| fuel-prices.eu, "Europe fuel prices, week of 26 October 2026" (from the EU Weekly Oil Bulletin) | Press (data aggregator) | 26 Oct 2026 | 7 Nov 2026 | https://www.fuel-prices.eu/news/weekly/europe-fuel-prices-week-2026-10-26/ |
| National tariff sources for the adder table | Regulators and operators | 2025–2026 | 7 Nov 2026 | See `grid-capacity-charges-2026-11.md`, each country |
| User guide chapter 50 (defaults compared on 21–23 October 2026) and the plain-English summary chapter (T1 tornado order) | Project document | Oct 2026 | 7 Nov 2026 | `docs/user-guide/src/05-part5.md`, `03-part3b.md` |
