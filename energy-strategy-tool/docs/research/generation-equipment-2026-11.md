# Delivery slots now decide on-site power choices

For a European campus ordering in late 2026, the delivery date now sorts on-site power options more than efficiency or price. The order-to-power spread across technologies is as follows:

- **Bloom solid oxide fuel cells** (325 kW blocks) claim first power in **about three months** in the US.
- **Battery containers** take **about 18 months**.
- **High-speed 2–4.5 MW gas gensets and refurbished 50 MW aeroderivatives** arrive in **12–24 months**.
- **3 MW-class diesel standby sets** are quoted at **52–70 weeks** by US dealers, and new Cummins orders run into **H2 2028**.
- **Medium-speed 10–20 MW gas engines** ordered in mid-2026 ship in **2028–2030**.
- **Heavy-duty turbines** now deliver around **2030–31**, often behind slot-reservation fees.

Planning costs run from roughly **US$1,000/kW for diesel standby**, through **US$1,700–2,240/kW for gas-engine plant** and **US$2,000–2,500/kW for new aeroderivatives or combined cycle**, to **about US$2,900–4,000/kW for SOFC**. European turnkey batteries cost **US$177/kWh**. An islanded campus that adds redundancy, storage and gas infrastructure lands near **US$3,000–3,500/kW**.

Nearly all of this evidence is American. No OEM published a European lead time, and no euro-denominated capex dataset exists. Every number below should therefore be treated as a range, and the tool should expose it as an editable assumption.

Europe's rental market is shallow and modular. The realistic pool is **Aggreko's 1.5 MW gas units, now grid-code certified in 11 countries**, plus Caterpillar-dealer sets of 0.455–2 MW. The large trailer-turbine fleets have been taken up by US AI developers. No rental provider publishes prices. The only European anchor is an Irish emergency-generation contract worth **about €42/kW-month for availability alone**.

Annual running hours, not technology, decide which emission limits apply. Below about 500 h/yr most plant escapes limit values. Bridge or prime duty brings in limits that make SCR standard on engines and likely on long-running turbines.

## Order-to-power now spans three months to six years

US behind-the-meter (BTM) demand now sets delivery times for every buyer. Enverus forecasts **29.6 GW of gas-fired BTM capacity for US data centres and industry in 2026–2030**: 7.1 GW of reciprocating engines, 6.2 GW of small and medium turbines and 4.8 GW of fuel cells ([Enverus](https://www.enverus.com/newsroom/behind-the-meter-generation-forecast-skipping-the-queue/)). Cleanview counts about 90 GW proposed on-site in the US, but only about 2 GW was operating in mid-2026 ([Decrypt, citing Reuters](https://decrypt.co/382890/ai-data-centers-used-jet-engines-power-turbines)). Siemens Energy's CEO says US data centre demand has pushed out other customers' decisions ([Utility Dive](https://www.utilitydive.com/news/siemens-gas-turbine-backlog-nears-70-gw-as-company-expands-manufacturing/827390/)). European buyers therefore queue for the same factory slots.

The table condenses the evidence into planning inputs. Unit counts are derived from the 50 Hz ratings cited in later sections, at N with no redundancy. Costs are in the source currency and year. At the ECB rate of 1 EUR = 1.1127 USD (11 Nov 2026), US$1,000/kW ≈ €899/kW ([ECB](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html)).

| Technology (examples) | Unit size, 50 Hz | Units per 100 MW at N (derived) | Electrical efficiency (LHV) | Cost evidence | Order-to-power evidence, 2026 |
|---|---|---|---|---|---|
| High-speed gas gensets (Jenbacher J620/J624, Cat G3516/G3520, mtu 20V4000, MWM TCG 3020) | 2.3–4.5 MWe | 23–44 | 43–47% | US$2,240/kW for a 21 MW plant, 2022$ ([EIA AEO2023](https://www.eia.gov/aeo/assumptions/pdf/elec_cost_perf.pdf)); US$1,700–2,000/kW all-in, market ([Rabobank](https://www.rabobank.com/knowledge/d011524694-the-sprint-data-centers-are-building-a-parallel-energy-system-in-the-us)) | 12–24 months to operation ([Rabobank](https://www.rabobank.com/knowledge/d011524694-the-sprint-data-centers-are-building-a-parallel-energy-system-in-the-us); [Enverus](https://www.enverus.com/newsroom/behind-the-meter-generation-forecast-skipping-the-queue/)) |
| Medium-speed gas engines (Wärtsilä 34SG/31SG/50SG, Jenbacher J920, Everllence 51/60G, Bergen B36:45) | 9.8–20 MWe | 5–11 | 48.7–52% | As above. An islanded campus all-in is about US$3,000–3,500/kW (derived; see turbine section) | April 2026 orders: equipment 2028, full operation late 2029 ([Wärtsilä](https://www.wartsila.com/media/news/23-04-2026-wartsila-continues-to-expand-its-data-center-footprint-with-new-790-mw-order-in-texas-the-next-data-center-alley-3744599)). June 2026 order: delivery 2029–30 ([Wärtsilä](https://wartsila.com/media/news/29-06-2026-wartsila-secures-new-order-to-power-next-wave-of-ai-driven-data-center-growth-in-the-u-s--3767555)) |
| Diesel/HVO standby (Cummins QSK78/QSK95, mtu 20V4000, Cat C175-20, Rehlko KD) | 2.2–2.7 MWe DCC; 3.0–3.7 MWe standby | 37–45 at DCC | ~0.25 l/kWh at full load | ~US$1,000/kW, US, scope unclear ([Latitude Media](https://www.latitudemedia.com/news/the-data-center-boom-is-a-diesel-generator-boom/)) | 52–70 weeks for 1.25–3.25 MW ([Global Power Supply](https://globalpwr.com/blog/generator-lead-times-in-2026)); new Cummins orders H2 2028 ([Cummins call](https://www.fool.com/earnings/call-transcripts/2026/08/11/cummins-cmi-q2-2026-earnings-call-transcript/)) |
| Aeroderivative and industrial turbines (LM2500XPRESS, LM6000, SGT-800, Titan 350, NovaLT16) | 17–62 MWe | 1.6–6 | 36–41% simple cycle | US$2,275/kW, 2025$ ([EIA AEO2026](https://www.eia.gov/outlooks/aeo/assumptions/pdf/EMM_Assumptions.pdf)); new units US$2.0–2.5m/MW, used US$1.5–1.7m/MW ([Decrypt/Reuters](https://decrypt.co/382890/ai-data-centers-used-jet-engines-power-turbines)) | 12–24 months new; refurbished PE6000 about 12–15 months; rental-fleet units 30–90 days if free ([APR](https://aprenergy.com/fast-power/interim-power)) |
| Heavy-duty frame and CCGT (6F.03, 9HA, M701JAC, SGT5) | 88–593 MWe | ≤1.1 | 37–44% SC; >64% CC | CCGT US$2,000–2,500/kW; frame CT ~US$1,700/kW for 2030 COD ([E3](https://www.ethree.com/recost-q1-2026-update/); [Gas Outlook](https://gasoutlook.com/analysis/costs-to-build-gas-plants-triple-says-ceo-of-nextera-energy/)) | Delivery around 2031 ([Energy Connects/Bloomberg](https://www.energyconnects.com/news/renewables/2026/october/high-demand-for-gas-turbines-is-pushing-out-deliveries-to-2031-mitsubishi-power-says/)); six-year average ([Wood Mackenzie](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)) |
| SOFC (Bloom Energy Server 6.5) | 325 kW | 308 | 65% falling to 53% over module life | AEP deal ≈ US$2,944/kW ([Fintool](https://fintool.com/news/bloom-energy-aep-2-65-billion-fuel-cell-deal)); US$3,000–4,000/kW ([Rabobank](https://www.rabobank.com/knowledge/d011524694-the-sprint-data-centers-are-building-a-parallel-energy-system-in-the-us)) | "50 MW in 90 days, 100 MW in 120 days" once gas and permits are in place; US claim ([mgrid](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)) |
| Carbonate and phosphoric-acid fuel cells (FuelCell Energy; Doosan PureCell) | 1.25–12.5 MW; 440 kW | 8 blocks; 227 units | ~50% (Doosan, first-year average) | No list price published | Doosan Sep 2026 order delivers from Mar 2027 ([FN Korea](https://en.fnnews.com/news/202609030758521237)) |
| BESS, 2 h (Megapack 3, PowerTitan, Huawei Smart String) | 5–7 MWh and ~2–2.5 MW per container | 40–52 containers per 100 MW / 200 MWh | 87–93% round trip; the basis varies | Europe turnkey US$177/kWh ([BNEF via ESN](https://www.energy-storage.news/battery-storage-system-prices-continue-to-fall-sharply-bnef-and-ember-reports-find/)); Germany installed €700k/MW for 2 h ([Modo](https://modoenergy.com/research/en/germany-battery-investment-outlook-q2-2026-executive-summary)) | About 18 months to site ([Wärtsilä via ESN](https://www.energy-storage.news/wartsila-on-why-ai-data-centres-need-bess-to-smooth-demand-and-avoid-destroying-the-grid/)); commissioning takes weeks |

The tool should make one pattern in this table explicit: **the cheapest firm capacity per kW is the slowest to arrive**. EIA's 2023-dollar cost study put an aeroderivative simple-cycle plant at **US$1,606/kW**, against **US$836/kW** for an H-class simple-cycle unit ([EIA AEO2025 capital cost study](https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf)). Buyers pay that premium for modularity and speed.

Planning datasets now lag the market badly. EIA's AEO2026 values frame combustion turbines at **US$1,158/kW** and CCGT at **US$1,032–1,086/kW** (2025$) ([EIA AEO2026](https://www.eia.gov/outlooks/aeo/assumptions/pdf/EMM_Assumptions.pdf)). That is roughly half of current quotes: NextEra's CEO says a combined-cycle unit that cost **US$785/kW in 2022 now costs US$2,400/kW** ([Gas Outlook](https://gasoutlook.com/analysis/costs-to-build-gas-plants-triple-says-ceo-of-nextera-energy/)). Only EIA's aeroderivative value (US$2,275/kW) sits close to the market. The EIA fuel-cell value of **US$8,287/kW** is more than twice what Bloom's commercial contracts imply.

Balance-of-plant equipment now constrains schedules as much as the generators do. A Wood Mackenzie survey puts lead times at:

- **128 weeks** for power transformers;
- **144 weeks** for generator step-up (GSU) transformers;
- **44 weeks** for HV switchgear.

Power-transformer prices are up 77% since 2019 ([POWER](https://powermag.com/transformers-in-2026-shortage-scramble-or-self-inflicted-crisis/)). Campus designs built from MV-connected 1.5–20 MW blocks avoid the GSU and its 2.8-year wait. Relief is coming slowly. Jefferies expects supply of gas turbines and close substitutes to rise more than 80%, to **over 125 GW/yr by 2030**. It says generation equipment is "increasingly not the primary bottleneck", while HV equipment and skilled labour remain constrained ([Latitude Media](https://www.latitudemedia.com/news/is-the-gas-turbine-bottleneck-solving-itself/)).

### Operating hours switch the emissions rulebook

The emissions limits that apply depend on annual run hours more than on technology. That makes run hours a first-class input for any sizing tool. The Medium Combustion Plant Directive (MCPD) covers plant of 1–50 MWth. It lets member states exempt new plant running **≤500 h/yr on a three-year rolling average** from emission limit values ([MCPD Art. 6](https://legislation.gov.uk/eudr/2015/2193/article/6/data.pdf)). The Industrial Emissions Directive (IED) excludes emergency units running under 500 h/yr ([IED Annex V](https://www.legislation.gov.uk/eudr/2010/75/annex/V/part/2/adopted)).

| Regime | Plant | NOx limit, mg/Nm³ at 15% O2 | Source |
|---|---|---|---|
| MCPD, new plant | Gas engines, 1–50 MWth | 95 (190 for dual-fuel engines in gas mode) | [DieselNet](https://dieselnet.com/standards/eu/stationary.php) |
| MCPD, new plant | Diesel/gas-oil engines, 1–50 MWth | 190 (225 in some dual-fuel/slow-engine cases) | [DieselNet](https://dieselnet.com/standards/eu/stationary.php) |
| IED Annex V | Gas engines ≥50 MWth | 75; CO 100 | [DieselNet](https://dieselnet.com/standards/eu/stationary.php) |
| IED Annex V | Gas turbines ≥50 MWth | 50 (single cycle above 35% efficiency: 50 × η/35); CO 100; applies above 70% load | [IED Annex V](https://www.legislation.gov.uk/eudr/2010/75/annex/V/part/2/adopted) |
| LCP BAT conclusions | New CCGT >50 MWth | 10–30 yearly average; 15–40 daily average | [EA Keadby BAT assessment](https://consult.environment-agency.gov.uk/psc/dn17-3ef-keadby-next-generation-power-epr-hp3329ms/supporting_documents/appendix-e1-lcp-bat-assessmentpdf) |

National rules are tighter than the MCPD baseline:

- **Germany:** the 44. BImSchV waives the engine NOx limit only below **300 h/yr** or for emergency-only operation ([§16](https://www.gesetze-im-internet.de/bimschv_44/__16.html)).
- **Ireland:** running backup generators for **more than 18 h/yr** at ≥50 MWth needs an EPA industrial emissions (IE) licence ([TheJournal.ie](https://www.thejournal.ie/investigates-data-centres-6554698-Nov2024/)).
- **Netherlands:** diesel engines lose the 500 h exemption if they generate while the grid is available ([IPLO](https://iplo.nl/regelgeving/regels-voor-activiteiten/kleine-middelgrote-stookinstallaties-standaard/uitzonderingen-emissiegrenswaarden-std-brandstof/)).
- **England:** the Environment Agency caps generator testing at **under 50 h/yr** ([GOV.UK BAT guidance](https://www.gov.uk/guidance/emergency-backup-diesel-engines-on-installations-best-available-techniques-bat)).

**What this means for engines.** Engine NOx ratings are quoted at 5% O2 and must be converted to the 15% O2 reference (derived, factor 0.375). A "250 mg/Nm³ at 5% O2" tune is about 94 mg at 15% O2. It just passes the MCPD's 95 limit but fails the IED's 75. A "500 mg" tune is about 188 mg and fails both.

**What this means for turbines.** A 15 ppm DLE turbine emits about 31 mg/Nm³. It meets the IED limit of 50 but sits above the 10–30 BAT band.

The practical result is that prime or bridge plant at campus scale needs SCR, while backup-only plant usually does not.

## Gas engines split into fast 2–4.5 MW gensets and 10–20 MW efficiency blocks

The gas-engine market for data centres has formed two tiers ([SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)):

- **High-speed** (1,500/1,800 rpm) containerised gensets of **0.5–4.5 MWe**.
- **Medium-speed** (500–1,000 rpm) hall engines of **5–20 MWe**.

SemiAnalysis counts **22 manufacturers with multi-hundred-MW off-grid data centre orders**, up from 12 a year earlier. Major orders and deals in 2025–26:

- **Wärtsilä:** its US data centre sales passed **2.4 GW** with a 790 MW Texas order for 42 × 50SG ([Wärtsilä](https://www.wartsila.com/media/news/23-04-2026-wartsila-continues-to-expand-its-data-center-footprint-with-new-790-mw-order-in-texas-the-next-data-center-alley-3744599)).
- **INNIO Jenbacher:** a 2.3 GW deal with VoltaGrid in October 2025, the largest order in its history ([INNIO](https://www.innio.com/wp-content/uploads/2025/10/PR_INNIO-Secures-Largest-Order-in-Company-History-.pdf)), then a further 1.5 GW in February 2026 ([INNIO](https://www.innio.com/en/news-media/press-releases/innio-secures-additional-major-order-from-voltagrid-1-5-gw-for-behind-the-meter-power-generation/)).
- **Everllence:** 24 × 18V51/60G, 480 MW for one off-grid hyperscale site ([Everllence](https://www.everllence.com/company/press-releases/details/2026/07/29/everllence-to-supply-480-mw-for-off-grid-data-center-in-the-u.s)).
- **Bergen Engines:** about 750 MW for Crusoe ([Crusoe](https://crusoe.ai/resources/newsroom/bergen-engines-signs-approx-750mw-u-s-power-agreement-with-crusoe-for-ai-data-centers)) and more than 500 MW for Liberty ([Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/)).

All the European-relevant OEMs offer 50 Hz ratings and European service networks: Jenbacher, Wärtsilä, Caterpillar/MWM, Rolls-Royce mtu, Everllence and Bergen. No data centre references were found for Kawasaki, Mitsubishi or Liebherr.

| Model | MWe at 50 Hz | Efficiency, % LHV | Start to full load | Units per 100 MW at N (derived) | Source |
|---|---|---|---|---|---|
| Wärtsilä 18V50SG | 18.43 | 50.2 | Grid sync 30 s; <2 min fast start, <5 min normal | 6 | [Wärtsilä 50SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-50sg-gas-engine) |
| Everllence 18V51/60G | ~20 (derived: 480 MW / 24) | up to 50 (51 with two-stage turbo) | <5 min | 5 | [Everllence](https://www.everllence.com/company/press-releases/details/2026/07/29/everllence-to-supply-480-mw-for-off-grid-data-center-in-the-u.s); [MAN/Everllence](https://man-es.com/energy-storage/products/gas-fuel-engines/1000) |
| Bergen B36:45V20 AG2 / AG1 | 12.5 / 11.2 | not published | not published | 8–9 | [Crusoe](https://crusoe.ai/resources/newsroom/bergen-engines-signs-approx-750mw-u-s-power-agreement-with-crusoe-for-ai-data-centers); [Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/) |
| Wärtsilä 20V31SG | 11.78 | 51.5 (52.0 efficiency-optimised) | <2 min fast | 9 | [Wärtsilä 31SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-31sg-gas-engine) |
| Jenbacher J920 FleXtra | 10.6 | up to 48.7 | ~2 min | 10 | [Jenbacher Type 9](https://www.jenbacher.com:443/en/gas-engines/type-9) |
| Wärtsilä 20V34SG | 9.80 | 48.9 | <2 min fast | 11 | [Wärtsilä 34SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-34sg-gas-engine) |
| Kawasaki KG-18-V | 7.8 | 49.5 | 10 min (5 min option) | 13 | [Kawasaki](https://global.kawasaki.com/en/energy/equipment/gas_engines/line_up.html) |
| Jenbacher J624 | 4.51 | 46.9 (500 mg NOx tune); 45.9 (250 mg tune) | not published | 23 | [Jenbacher Type 6](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf) |
| Cat CG260-16 | 4.5 | 44.6 | not published | 23 | [Cat](https://www.cat.com/en_ZA/products/new/power-systems/electric-power/gas-generator-sets/15969827.html) |
| Jenbacher J620 | 3.36 (Fast Start variant 3.11) | 45.6 (500 mg); 44.8 (250 mg) | "Fast start", seconds not stated | 30 | [Jenbacher Type 6](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf); [J620 FS](https://www.jenbacher.com/en/gas-engines/type-6/j620-fast-start/) |
| Cat G3520 Fast Response | 2.6 | not published | 10 s from cold; ISO 8528-5 G2 | 39 | [Cat](https://www.cat.com/en_AU/news/engine-press-releases/cat-g3520-fast-response-natural-gas-generator-set-enabling-lower-greenhouse-gas-emissions.html) |
| mtu 20V4000 GS | 2.54 | 43.9 | <120 s; 45 s on the new 60 Hz L64 | 40 | [mtu](https://mtu-solutions.com/eu/en/applications/power-generation/power-generation-products/gas-generator-sets/natural-gas-generator-sets/gas-powered-series-4000.html); [Rolls-Royce](https://www.rolls-royce.com/media/press-releases/2025/02-10-2025-rr-introduces-fast-start-mtu-gas-gensets-for-powering-data-centers.aspx) |
| MWM TCG 3020 V20 | 2.3 | ~43.7–45.0 | not published | 44 | [MWM](https://www.mwm.net/en/gas-engines-gensets/gas-engine-tcg-3020-v20/) |
| Cummins HSK78G | ~2.0 | 44.2 | not published | ~50 | [Power Engineering](https://www.power-eng.com/gas/turbines/cummins-debuting-new-gas-fired-generator-series/) |

### Efficiency against speed

The two tiers trade efficiency against responsiveness:

- **Medium-speed spark-gas engines** reach **48.7–52% LHV**. They ramp at over 100%/min when hot, and Wärtsilä allows 10% minimum unit load and "no start cost, limitations nor degradation in number of starts" ([Wärtsilä 34SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-34sg-gas-engine)).
- **High-speed gensets** give up 3–7 points of efficiency but start far faster. Cat's G3516 fast-response sets reach full load in about seven seconds ([Heavy Equipment](https://www.heavyquipmag.com/2026/07/29/caterpillar-is-finding-its-next-growth-engine-inside-the-ai-power-crunch/)).

Maintenance intervals are published for some models: **84,000 h** to major overhaul for mtu Series 4000 gas ([mtu](https://mtu-solutions.com/eu/en/applications/power-generation/power-generation-products/gas-generator-sets/natural-gas-generator-sets/gas-powered-series-4000.html)), **60,000 h** for Jenbacher Type 6 ([Jenbacher](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf)) and **80,000 h** for MWM ([MWM](https://www.mwm.net/en/gas-engines-gensets/gas-engine-tcg-3020-v20/)). At 8,000 h/yr, prime plant will almost always have one unit in maintenance.

For backup duty, only dedicated fast-response gas sets come close to diesel's 10-second standard. Medium-speed engines need UPS or BESS ride-through measured in minutes.

### Step loads need storage alongside the engines

Step-load capability is the main technical risk for island AI campuses, and the evidence is mostly vendor claims:

- **Piller** (a flywheel vendor) says a medium-speed engine at about 90% load tolerates an instantaneous step of only **about 1% of rated load** ([Piller](https://www.piller.com/wp-content/uploads/2025/11/Lets-talk-behind-the-meter-island-power-for-AI-data-centers.pdf)).
- **Caterpillar** says its G3520 Fast Response recovers from a 100% block load ([Cat](https://www.cat.com/en_AU/news/engine-press-releases/cat-g3520-fast-response-natural-gas-generator-set-enabling-lower-greenhouse-gas-emissions.html)).
- **INNIO/VoltaGrid** claim their Jenbacher packs need "zero battery reliance" ([INNIO](https://www.innio.com/wp-content/uploads/2025/10/PR_INNIO-Secures-Largest-Order-in-Company-History-.pdf)).

Real projects mostly add storage anyway:

- **Pure DC, Dublin:** pairs **20 MW of BESS with 60 MW of Wärtsilä 34DF engines**, a ratio of 33% ([Wärtsilä](https://www.wartsila.com/energy/learn-more/references/other-industrial/pure-dc-and-avk-ireland)).
- **Liberty Energy:** its CFO reports battery power averaging **50% of gas capacity** across its data centre clients ([SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)).
- **Bergen/Liberty:** uses Piller flywheels to absorb sub-second steps of up to 30% ([Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/)).

**A sizing tool should therefore default to BESS or flywheel power of 30–50% of engine capacity for island AI loads.** That default is derived from the Pure DC and Liberty ratios. It should be validated against each OEM's ISO 8528-5 load-step tables, which no OEM published for large gas engines.

### Unit size drives the redundancy overhead

Larger units mean more spare capacity per redundant unit. This is the central sizing trade-off for a European campus tool (derived):

- At 100 MW, N+1 with 18.4 MW 50SGs needs **7 units, about 129 MW installed**.
- N+2 with 4.5 MW J624s needs **25 units, about 113 MW installed**, but means far more alternators, controls and maintenance events.

No 2025–26 order disclosed its redundancy scheme. Enverus cites overbuild as low as **1.1×** for engines, against about 1.5× for large-frame plant ([Enverus](https://www.enverus.com/newsroom/behind-the-meter-generation-forecast-skipping-the-queue/)). OpenAI's Shackelford site is the one disclosed IT-to-generation ratio: more than 500 J624s for 1.4 GW of IT implies **at least 1.5 MW of engines per MW of IT** once cooling load and redundancy are included ([SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)).

### Lead times have roughly doubled since 2022

Wärtsilä's CEO said in October 2026 that "lead times for our engines continue to increase" ([Wärtsilä Q3](https://www.wartsila.com/usa/media/news/27-10-2026-wartsila-s-interim-report-january-september-2026-3806530)). Its April 2026 orders target equipment in 2028 ([Wärtsilä 412 MW](https://www.wartsila.com/media/news/16-04-2026-wartsila-s-34sg-engine-makes-its-data-center-debut-with-new-412-mw-u-s-project-3740972)), and a June 2026 order delivers in **2029–2030** ([Wärtsilä](https://wartsila.com/media/news/29-06-2026-wartsila-secures-new-order-to-power-next-wave-of-ai-driven-data-center-growth-in-the-u-s--3767555)). Other suppliers:

- **Caterpillar** takes large engine orders for delivery as far out as 2029 ([Baxtel](https://baxtel.com/news/caterpillar-ramps-engine-and-turbine-output-as-data-center-orders-reach-2029)). For some packages it still claims to "begin generation in under a year" ([Heavy Equipment](https://www.heavyquipmag.com/2026/07/29/caterpillar-is-finding-its-next-growth-engine-inside-the-ai-power-crunch/)).
- **Bergen** delivers a June 2026 order from **H2 2027**, the fastest medium-speed slot found.
- **INNIO/VoltaGrid's** February 2026 order delivers by 2028.

The 2022 baseline is thin but telling: Dublin's 60 MW Winthrop plant of 22 Jenbacher Type 6 engines was announced in November 2022 for completion in Q3 2023 ([POWER](https://powermag.com/press-releases/innios-jenbacher-engines-to-power-60-mw-hyperscale-data-center-power-plant-in-ireland)). Compared with that, medium-speed lead times have roughly doubled to quadrupled.

Capacity expansions arrive mostly in 2027–2030:

- Wärtsilä adds 35% at Vaasa from Q1 2028 ([POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/)).
- Caterpillar plans to triple its 2024 large-engine capacity ([Manufacturing Dive](https://www.manufacturingdive.com/news/caterpillar-triple-power-generation-capacity-raises-2030-targets-q1-2026-earnings/819078/)).
- INNIO's US joint venture targets over 1 GW/yr of containerised modules by 2028 ([Manufacturing Today](https://manufacturing-today.com/news/innio-adds-testing-and-assembly-capacity-in-wisconsin-as-us-power-demand-climbs/)).

Slot reservation is now a recognised procurement route. Rehlko holds a **1.25 GW, three-year Jenbacher framework** ([Power Engineering](https://www.power-eng.com/gas/data-center-power-crunch-lifts-engines-aeroderivatives-into-larger-role/)).

**Planning assumption (derived):** 18–30 months order-to-delivery for high-speed containerised gensets, and 24–48 months for medium-speed hall plant.

### Cost and European references

Public cost data for engine plants is sparse:

- **EIA AEO2023** prices a 21 MW engine plant at **US$2,240/kW**, with fixed O&M of US$39.57/kW-yr, variable O&M of US$6.40/MWh and a heat rate of 8,295 Btu/kWh HHV ([EIA](https://www.eia.gov/aeo/assumptions/pdf/elec_cost_perf.pdf)).
- **RaboResearch** puts delivered energy from US BTM engines at about **US$107/MWh in year 5**, with a floor of US$74–84/MWh ([Rabobank](https://www.rabobank.com/knowledge/d011532274-the-marathon-can-behind-the-meter-data-center-power-solutions-endure-the-decade-in-the-us)).

European engine references are small next to US orders:

- **Pure DC, Dublin:** a 110 MW site whose 60 MW of primary engines run independently of the national grid, with HVO as fallback ([Wärtsilä](https://www.wartsila.com/energy/learn-more/references/other-industrial/pure-dc-and-avk-ireland)).
- **Winthrop, Dublin:** 60 MW for backup, grid support and island mode ([POWER](https://powermag.com/press-releases/innios-jenbacher-engines-to-power-60-mw-hyperscale-data-center-power-plant-in-ireland)).
- **KMW/Green Mountain, Mainz:** 12 Jenbacher modules for backup and peaking ([POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/)).

One outlet described Pure DC's plant as gas turbines ([DeSmog](https://www.desmog.com/2026/04/29/inside-the-plot-to-cover-europe-with-gas-powered-ai-data-centres/)). Wärtsilä's own reference lists engines, and that is the more reliable source.

## Diesel standby tops out near 3.2 MW per set, with 2028 slots

At 50 Hz, data centre standby relies on 16- and 20-cylinder engines of 60–103 litres. Cummins, Rolls-Royce mtu, Caterpillar and Rehlko dominate. MHI, Baudouin, Perkins/FG Wilson and HiMoinsa form a second tier with possibly shorter queues.

| OEM and model | Standby rating | Data centre continuous (DCC/DCP) | Load acceptance | HVO approval | Source |
|---|---|---|---|---|---|
| Cummins C3000D5BE (QSK78) | 2,400 kWe | 2,200 kWe | not published | Cummins approved HVO by 2022 | [Cummins](https://selfscreening.cummins.com/generators/products/c3000d5be); [DCF](https://datacenterfrontier.com/data-centers-embrace-vegetable-oil-as-cleaner-fuel-for-generators/) |
| Cummins C3750D5e (QSK95) | not published | 2,680 kWe; 664 l/h at 100% | not published | not on sheet | [EA / NTT Dagenham](https://consult.environment-agency.gov.uk/psc/rm10-7fz-ntt-global-data-centers-emea-uk-ltd/supporting_documents/Application%20Variation%20V003%20Generator%20set%20data%20sheet%2019122023.pdf) |
| mtu 20V4000 DS4000 | 3,200 kWe (4,000 kVA); 818 l/h | Data-centre continuous rating offered, value not published | Range: >50% first step, 100% per NFPA 110 within G3. DS4000 sheet: one-step rated load only with parameter changes | EN 15940 HVO/GtL | [EA / Ark Longcross](https://consult.environment-agency.gov.uk/psc/kt16-0ee-ark-data-centres-limited/supporting_documents/Application%20Bespoke%20Generator%20set%20Datasheet%20DS4000%20A001%2022052024.pdf); [mtu](https://mtu-solutions.com/na/en/applications/power-generation/power-generation-products/diesel-generator-sets/series/4000.html) |
| Cat C175-20 | 3,900–4,000 kVA ≈ 3,120–3,200 kWe (derived) | Continuous 3,150–3,250 kVA ≈ 2.5–2.6 MWe (derived) | 100% in one step; ISO 8528-5 G3 | EN 15940, neat or blended | [Warren CAT](https://www.warrencat.com/new/power-systems/electric-power/diesel-generator-sets/c175-20/) |
| Rehlko KD3500-E | 2,800 kWe ESP (alternator) | 2,600 kWe DCP | 100% one step, flagged "out of ISO criteria" | Diesel/HVO | [EA / VDC LHR21](https://consult.environment-agency.gov.uk/psc/nw10-6pf-vdc-lhr21-limited/supporting_documents/Application%20Bespoke%20Engine%20Information%20%2015122023.pdf) |
| Rehlko KD4000 / KD4500 | 3,488 / 3,680 kWe; MV/HV only at 50 Hz | not stated at 50 Hz | not published | EN 15940; up to 4% more fuel on HVO | [Rehlko catalogue](https://powersystems.rehlko.com/sea/wp-content/uploads/g12-478-sea-09-23_kd-series-800--4600-kva-catalog.pdf); [KD4000](https://www.powersystems.rehlko.com/sea/wp-content/uploads/kd4000.pdf) |
| MHI MGS3100R | 3,025 kVA ≈ 2,420 kWe | 2,750 kVA ≈ 2,200 kWe | G3; 10 s start (NFPA 110) | not published | [MHIET](https://www.mhi.com/group/mhiet/news/20230822.html) |
| Baudouin 20M61 | 6,250 kVA (≈5 MWe derived) | not published | not published | EN 15940 tested | [Baudouin](https://baudouin.com/?p=84141) |
| Perkins/FG Wilson P2500-3 | 2,000 kWe | 1,800 kWe (prime) | 5000 Series: 100% block load, G3 | 100% HVO | [FG Wilson](https://www.fgwilson.com/en_GB/products/new/fg-wilson/diesel-generators/large-range-800-kva/129762.html); [Perkins](https://www.perkins.com/en_GB/campaigns/5000-series/eame/data-centre.html) |
| HiMoinsa HGY / DC range | 1,250–3,500 kVA | DC range up to 2,253 kW | response <8 s | not published | [HiMoinsa](https://www.himoinsa.com/electric-generators/generator-sets-for-special-projects/generator-set-for-data-centres/5-11/eng.html) |

### Size on the continuous rating, not standby

The rating type matters more than the headline figure:

- **ISO 8528-1 standby (ESP)** limits a set to **200 h/yr at a 70% average load**.
- **Uptime Tier III/IV** requires no limit on consecutive run hours at N load.
- **DCC/DCP ratings** were created to meet that requirement. Cummins defines DCC as unlimited hours to a constant or varying data centre load ([Cummins PowerHour](https://www.cummins.com/sites/default/files/2020-01/Cummins%20PowerHour_Genset%20Ratings%20Data%20Centers%20and%20Others%20%281PDH%29.pdf)).

DCC runs from 92% of standby (Cummins C3000D5BE) ([Cummins](https://selfscreening.cummins.com/generators/products/c3000d5be)) to 100% (Rehlko's 60 Hz KD4000) ([Rehlko](https://www.powersystems.rehlko.com/sea/wp-content/uploads/kd4000.pdf)). **Usable 50 Hz DCC therefore clusters at 2.2–2.7 MWe per set.**

Fleet sizing (derived): assuming facility peak is about 1.3–1.4 × IT load, an N fleet needs **0.5–0.65 sets per MW of IT**. That rises to about 0.6–0.8 with N+1 in four-to-six-set blocks, and to 1.0–1.3 for 2N.

Physical and fuel figures:

- **Fuel use** is about **250 l/h per MWe at full load**, derived from the QSK95, DS4000 and KD3500 datasheets.
- **Fuel storage:** CyrusOne's Hanau site stores about 32 m³ per set, roughly 40–50 h at full load ([RP Darmstadt](https://rp-darmstadt.hessen.de/sites/rp-darmstadt.hessen.de/files/2025-03/aenderungsgenehmigungsbescheid_ndma_ff5_2_hanau.pdf)).
- **Weight and footprint:** units weigh 21–35 t and occupy 20–27 m² open, before enclosure and tanks.
- **Voltage:** 4 MVA-class 50 Hz units are often MV-only. Rehlko sells its KD4000/4500 only at MV/HV at 50 Hz.

### HVO is mainstream, and permits cap hours tightly

Every major OEM now approves EN 15940 HVO ([Warren CAT](https://www.warrencat.com/new/power-systems/electric-power/diesel-generator-sets/c175-20/); [mtu](https://mtu-solutions.com/na/en/applications/power-generation/power-generation-products/diesel-generator-sets/series/4000.html)). Pure DC reports an operating-cost premium **below 20%** over diesel and a shelf life of up to 10 years. It burned close to **3 million litres in 12 months** of short-term primary generation in Dublin ([Pure DC](https://puredc.com/2025/07/21/how-pure-dc-made-the-switch-to-hydrotreated-vegetable-oil-work-at-scale)). Digital Realty runs HVO at more than 20 European sites ([Datacentre Solutions](https://form.datacentre.solutions/news/67432/digital-realty-expands-renewable-generator-fuel-rollout)).

Permits allow tens of hours per unit per year, not hundreds:

- **Amazon, Grange Castle South (Dublin):** 70 sets licensed for **72 h/yr each at ≤90% load** ([EPA Ireland](https://epawebapp.epa.ie/licences/lic_eDMS/090151b280879452.pdf)).
- **CyrusOne FRA5.2 (Hanau):** 22 units capped at **641 h/yr site-wide**, with **SCR on every unit** and a NOx limit of 500 mg/Nm³ at 5% O2 ([RP Darmstadt](https://rp-darmstadt.hessen.de/sites/rp-darmstadt.hessen.de/files/2025-03/aenderungsgenehmigungsbescheid_ndma_ff5_2_hanau.pdf)).

Planners are pushing back. Edinburgh councillors refused a 213 MW scheme partly over "rows of diesel backup generators" ([The Register](https://www.theregister.com/2026/02/10/edinburgh_green_ai_datacenter/)). Amazon's Iver approval carried a **£600,382 air-quality payment** ([TechRadar](https://techradar.com/pro/need-for-data-centres-outweighs-other-considerations-local-council-in-the-london-commuter-belt-approves-amazons-massive-m25-hub-despite-air-quality-fears)).

Running diesel or HVO for bridge or prime power is legal in the EU. It does, however, lose the 500 h exemption, which brings full emission limits (in practice SCR), dispersion modelling and, in Ireland above 50 MWth, an IE licence.

### Lead times and cost

The largest frames are the bottleneck. Cummins says lead times for new orders reach into **H2 2028**, that 2026 growth is "constrained by capacity" for larger configurations, and that some customers are shifting to smaller gensets. It is adding about **20 GW** of capacity, phased 2027–2030 ([Cummins Q2 call](https://www.fool.com/earnings/call-transcripts/2026/08/11/cummins-cmi-q2-2026-earnings-call-transcript/)). Other supply signals:

- **Rolls-Royce** will assemble Series 4000 engines in a new Friedrichshafen plant from 2028 ([mtu](https://mtu-solutions.com/eu/en/pressreleases/2026/Strong-results-and-record-investments-Rolls-Royce-Power-Systems-continues-on-growth-path.html)). It also signed a five-year capacity framework with packager AVK for European emergency gensets ([Turbomachinery](https://www.turbomachinerymag.com/view/rolls-royce-signs-long-term-agreement-with-avk-to-ensure-generator-capacity)).
- **US dealers** quote **52–70 weeks** for 1,250–3,250 kW standby sets and 12–39 weeks for 750–1,000 kW ([Global Power Supply](https://globalpwr.com/blog/generator-lead-times-in-2026)).
- **Baudouin** reports critical components with lead times "exceeding 18 months" ([Baudouin](https://baudouin.com/?p=84135)).

**Planning assumption (derived):** 18–24 months or more for tier-1 3 MW-class units without a framework slot.

The only cost figure found is about **US$1,000/kW** (US, secondary source, scope unclear) ([Latitude Media](https://www.latitudemedia.com/news/the-data-center-boom-is-a-diesel-generator-boom/)). Tesla's storage-versus-diesel comparison assumes US$800–1,000/kW ([Tesla ERCOT](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf)). No European installed €/kW was found.

## Turbine shortage pushes campuses to aeroderivatives and refurbished cores

Gas turbines span more than two orders of magnitude in unit size. For a 50–500 MW European campus, the practical building blocks are 17–62 MW aeroderivative and industrial units. Heavy-duty frames matter only for gigawatt combined-cycle schemes.

| Model | Class | ISO MWe (50 Hz unless noted) | Simple-cycle efficiency, % LHV | Start | Units per 100 MW (derived) | Source |
|---|---|---|---|---|---|---|
| Capstone C1000S | Microturbine | 1.0 | 33 | not published | ~100 | [Capstone](https://d1io3yog0oux5.cloudfront.net/_76c0b637365040676f05fd35b8375f97/capstonegreenenergy/db/235/9470/file/C1000S+HPNG_331107F_lowres.pdf) |
| Siemens SGT-A05 | Small aero | 4.0–5.8 (5 MW at Equinix DB5) | not published | <90 s | ~20 | [Siemens Energy](https://assets.siemens-energy.com/dam/47e51057-e95f-4dba-9d0f-b29900a43d5a/Reference_TwoPager_Equinix-pdf_Original%20file.pdf) |
| Solar Titan 130 / 250 / 350 | Industrial | 16.5 / 23.1 / 38.0 | ~35.5 / 38.9 / 40.2 (derived) | not published | 6–7 / 4–5 / 3 | [Solar Turbines](https://www.solarturbines.com/en_US/products/turbine-ratings.html) |
| Baker Hughes NovaLT16 | Industrial | 16.9 | 36.4 | not published | 6 | [Baker Hughes](https://www.bakerhughes.com/gas-turbines/novalt-technology/novalt16) |
| MHI FT8 MobilePac | Mobile aero | 28.5 | 34.7 | 10 min | 4 | [MHI](https://power.mhi.com/regions/amer/products/aero-derivative-gas-turbine/ft8-mobilepac) |
| GE TM2500 | Mobile aero | 34.5 | 39.5 (DLE) | ~5 min | 3 | [GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/tm2500) |
| GE LM2500XPRESS | Aero | 34.5–36.3 | 39.0–39.4 | ~5 min | 3 | [GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/lm2500) |
| Siemens SGT-A35 (geared for 50 Hz) | Aero | 34–38 | 39–41 | 10 min | 3 | [Siemens Energy](https://www.siemens-energy.com/br/pt/home/products-services/product/peaker-plants.html) |
| Siemens SGT-750 | Industrial | 37–41 | 41–41.6 | ~10 min | 2.5–3 | [Siemens](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf) |
| Boom Superpower | Aero-derived | 42 | not published | not published | 2.4 | [DCF](https://datacenterfrontier.com/energy/article/55358731/aeroderivative-turbines-move-to-the-center-of-ai-data-center-power-strategy) |
| Siemens SGT-A45 | Mobile aero | 44 (ISO, 60 Hz; dual frequency) | not published | <8 min | 2.3 | [Siemens](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf) |
| ProEnergy PE6000 (refurbished CF6-80C2 core) | Aero | ~50 (60 Hz gross) | not published | not published | 2 | [ProEnergy](https://www.proenergyservices.com/wp-content/uploads/2025/12/Manufactured-Equipment.pdf) |
| GE LM6000 PF+ Sprint | Aero | 56.9 | 41.0 | 5 min | 2 | [GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/lm6000) |
| Siemens SGT-800 | Industrial | 45–62 | up to 41.1 | 10 min; 12.5 MW/min; 40% minimum load | 1.6 | [Siemens Energy](https://www.siemens-energy.com/br/pt/home/products-services/product/peaker-plants.html) |
| MHI FT4000 SwiftPac 70 / 140 | Aero | 70.2 / 140.5 | 40.4 | ~10 min | 1.4 / 0.7 | [MHI](https://power.mhi.com/regions/amer/products/aero-derivative-gas-turbine/ft4000-swiftpac) |
| GE 6F.03 | Heavy-duty F | 88 | 36.8 | 13 min hot restart | 1.1 | [GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/6f-01) |
| GE LMS100 PA+ | Intercooled aero | 112.9 | 43 | 8 min | ~1 | [GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/lms100) |
| GE 9HA.02 | Heavy-duty H | 571 | 44.0 (>64% CC) | 23 min hot | n/a | [GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/9ha) |

Three engineering traps stand out for European sites:

- **60 Hz-only machines.** The 7HA, M501JAC and direct-drive SGT-A35 cannot serve a 50 Hz grid directly. 50 Hz aeroderivative output is typically a few percent lower than 60 Hz.
- **Ambient derate.** Aeroderivatives lose output faster than frames as ambient temperature rises. That is why products such as the SGT-A45 offer water injection to hold rated output up to about 40 °C.
- **IED threshold.** Any single turbine above roughly 18–20 MWe exceeds 50 MWth of fuel input, which puts the 25–60 MW sweet spot under IED/LCP rules rather than the MCPD. Combined with BAT levels that a 15 ppm DLE combustor misses, long-running prime plant should budget for SCR.

GE says its SCR-equipped LM2500XPRESS fleet for Crusoe cuts emissions 90% against reciprocating engines ([GE Vernova](https://www.gevernova.com/news/press-releases/ge-vernova-crusoe-announce-major-29-unit-aeroderivative-gas-turbine-deliver-ai-data-centers)).

### How data centres actually deploy turbines

US campuses use turbines in two patterns.

**Many-unit fleets of 15–40 MW units for bridge or prime power:**

- Crusoe's **29 LM2500XPRESS units, nearly 1 GW**, at Abilene ([GE Vernova](https://www.gevernova.com/news/press-releases/ge-vernova-crusoe-announce-major-29-unit-aeroderivative-gas-turbine-deliver-ai-data-centers)).
- xAI's SMT-130 and Titan 350 units, stood up in under a year ([Tom's Hardware](https://tomshardware.com/tech-industry/xai-pushes-power-strategy-towards-1gw-ai-factory)).
- Meta/Williams' Socrates South, which mixes Titan 250, Solar PGM 130, SGT-400, Cat 3520 engines and diesel black-start sets on a site with no grid connection ([Power Engineering](https://www.power-eng.com/onsite-power/onsite-gas-turbines-reciprocating-engines-to-power-meta-data-center/)).

**Heavy-duty plants of 1–3 GW with first power in 2027–28:**

- Chevron/Microsoft's 2.67 GW "Kilby", built mainly on 7HA units ([Global Data Center Hub](https://www.globaldatacenterhub.com/p/chevron-and-microsoft-sign-9b-west)).
- Two M501JACs at Cheyenne ([Power Engineering](https://www.power-eng.com/?p=137156)).

Europe's turbine references are small. Equinix DB5 in Dublin runs **9 × 5 MW SGT-A05 (45 MW, N+1)** for peaking, backup and grid support ([Siemens Energy](https://assets.siemens-energy.com/dam/47e51057-e95f-4dba-9d0f-b29900a43d5a/Reference_TwoPager_Equinix-pdf_Original%20file.pdf)). Switzerland's eight trailer-mounted TM2500 reserve plant (see the rental section) is the main European mobile precedent.

### New heavy-duty slots are gone until about 2030

The order books are full:

- **GE Vernova:** gas backlog plus slot reservations reached **122 GW** at the end of Q3 2026 (64 GW of backlog and 58 GW of slot reservation agreements) ([Turbomachinery](https://www.turbomachinerymag.com/view/ge-vernova-q3-2026-gas-power-backlog-122-gw-trench-acquisition)). After Q1 2026, only about 10 GW remained across 2029 and 2030 combined, and the CEO puts heavy-duty lead time at about three years ([Power Engineering](https://www.power-eng.com/gas/turbines/data-centers-drive-record-surge-in-ge-vernova-power-equipment-orders-as-turbine-slots-tighten-through-2030/)).
- **Mitsubishi Power:** "We're talking about delivery at around 2031" ([Energy Connects](https://www.energyconnects.com/news/renewables/2026/october/high-demand-for-gas-turbines-is-pushing-out-deliveries-to-2031-mitsubishi-power-says/)).
- **Siemens Energy:** the CFO quotes "three years or more" ([Utility Dive](https://www.utilitydive.com/news/siemens-gas-turbine-backlog-nears-70-gw-as-company-expands-manufacturing/827390/)).
- **Market-wide:** Wood Mackenzie counts **110 GW of orders against 60–70 GW/yr of manufacturing capacity** and six-year lead times ([Wood Mackenzie](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)).
- **Reservation fees:** GE Vernova, Siemens Energy and Mitsubishi Power now all require one. Two Kentucky utilities paid GE **US$25m to reserve one turbine** for a 2030 commercial operation date ([Latitude Media](https://www.latitudemedia.com/news/gas-turbine-prices-are-up-and-arent-going-down-anytime-soon/)).

Smaller and refurbished units move faster:

- **ProEnergy PE6000:** 12 months from order to delivery for eight units ([ProEnergy](https://www.proenergyservices.com/wp-content/uploads/2025/12/Manufactured-Equipment.pdf)). Crusoe's 13 units ordered in April 2026 target summer 2027 ([TFTC](https://www.tftc.io/ai-data-centers-used-turbines-six-year-lead-time-crusoe-proenergy)).
- **Baker Hughes Frame-5:** awarded February 2026, deliveries in 2027 ([Turbomachinery](https://www.turbomachinerymag.com/view/baker-hughes-wins-award-to-deliver-frame-5-gas-turbines-for-data-center-projects)).
- **Mobile packages** install in two to four weeks once on site.

European-built capacity is flowing to US buyers. Siemens Energy will build **119 SGT-400 cores in Lincoln, UK** for US packager Dynamis, with the first batch in 2027 ([Turbomachinery](https://www.turbomachinerymag.com/view/siemens-energy-119-sgt-400-cores-dynamis-hypermobile-power)).

### Prices have roughly tripled

Turbine prices are up **195% since 2019** and heading to about **US$600/kW for equipment by end-2027**. Turbines make up 20–30% of CCGT project cost ([Wood Mackenzie](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)). GE Vernova's H1 2026 orders priced **10–20 points higher per kW** than its Q4 2025 orders ([Power Engineering](https://www.power-eng.com/gas/turbines/data-centers-drive-record-surge-in-ge-vernova-power-equipment-orders-as-turbine-slots-tighten-through-2030/)).

Implied all-in costs for BTM campuses (derived) are about **US$3,400/kW** for Kilby (US$7–9bn for 2.67 GW) and about **US$3,200/kW** for Socrates (US$1.6bn for about 504 MW plus a substation) ([Aterio](https://www.aterio.io/blog/socrates-williams-2gw-behind-the-meter-power-meta-new-albany-ohio)).

Used turbines offer little relief. Units in good condition trade at **US$1.5–1.7m/MW against US$2.0–2.5m/MW new**, a discount of only 15–30%, and EthosEnergy's CEO calls the secondary market "very, very hot" ([Decrypt/Reuters](https://decrypt.co/382890/ai-data-centers-used-jet-engines-power-turbines)). Relocating used US units to Europe adds 60-to-50 Hz conversion, IED permitting and grid-code compliance risk (inference).

## Fuel cells deliver in months, but only Bloom ships at scale

Three fuel-cell routes are commercial at data centre scale in 2026, and only one has gigawatt contracts:

- **Bloom Energy's SOFC** dominates prime and bridge power.
- **FuelCell Energy's carbonate blocks** and **Doosan's PAFC** have real but much smaller order books.
- **PEM hydrogen systems** remain at pilot or early-order stage for backup.

| Supplier and product | Technology and fuel | Unit size | Efficiency | Units per MW | European status | Source |
|---|---|---|---|---|---|---|
| Bloom Energy Server 6.5 | SOFC; natural gas (H2, biogas on request) | 325 kW; 9.0 × 1.3 × 2.5 m, 13 t | 65% falling to 53% LHV over module life (cumulative) | 3.08 | CE marked; 400/415 V, 50 Hz. No European data centre deployment named | [Bloom datasheet](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf); [Q3 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/) |
| FuelCell Energy Block | MCFC; natural gas, biogas | 1.25 / 2.5 / 12.5 MW | not on current pages | 0.8 modules | European activity is carbon capture only | [FCE](https://www.fuelcellenergy.com/industries/data-centers) |
| Doosan/HyAxiom PureCell M400 | PAFC; hydrogen (natural gas version exists) | 440 kW | 50% first-year average; 90% with CHP | 2.27 | Datasheet is 480 V/60 Hz only | [Doosan](https://www.doosan.com/images/media-center/ces2024/%28Data%20Sheet%29%20HyAxiom%20PureCell%20Model%20400%20Hydrogen.pdf) |
| Ballard FCmove-HD+ | PEM; hydrogen | 100 kW modules | not published | 10 | 15 MW off-grid genset order (not data centres) | [Hydrogen Central](https://hydrogen-central.com/ballard-announces-order-for-15-mw-in-the-stationary-power-market/) |
| Plug Power | PEM; hydrogen | 125 kW | not published | 8 | Microsoft 3 MW prototype (US) | [DCD](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant) |
| Nedstack | PEM; hydrogen | 500 kW blocks, up to 1.5 MW | not published | 2 | NorthC Groningen, 500 kW backup | [Nedstack](https://www.nedstack.com/projects/northc-hydrogen-backup) |
| GeoPura (Ballard) HPU | PEM; green hydrogen | ~250 kW per container | not published | ~4 | Equinix DB3 Dublin, 0.5 MW pilot | [Equinix](https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre) |

### Real-world performance falls below the datasheet

Bloom's datasheet efficiency of 65–53% describes beginning- and end-of-life values. Bloom quotes NOx of **0.001 kg/MWh**, CO2 of 308–378 kg/MWh, no water use in normal operation and over 36% heat recovery at above 350 °C ([Bloom datasheet](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)).

Independent meter data is less flattering. Hunterbrook Media's affiliate holds a short position in Bloom, so its analysis is adversarial, but it draws on public data. It found:

- New York systems average **52.0% HHV when new** and fall below the 46.9% guarantee line at a median of 20 months.
- California projects drop from 55.6% to 47.9% HHV by years three to five.
- Bloom's warranty accrual rose from **US$20.0m to US$77.8m** in the first half of 2026.

Source: [Hunterbrook](https://newsletter.hntrbrk.com/p/do-blooms-fuel-cells-work-as-claimed).

Bloom reports a median module life of **4.9 years** for its 2014–15 cohort, and modules swap on site in under an hour ([Bloom](https://www.bloomenergy.com/blog/reaching-new-milestones-in-the-field-proven-bloom-energy-server-longevity-and-reliability/)). For design, use a life-average of about **53–58% LHV** (derived) and carry stack replacement every 3–5 years as a recurring cost.

On step loads, Bloom demonstrated 40-to-100% steps only by adding supercapacitors ([Bloom](https://www.bloomenergy.com/wp-content/uploads/load-following-solid-oxide-fuel-cell.pdf)). No source gives a cold-start time for high-temperature fuel cells. Treat SOFC, MCFC and PAFC as always-on prime power, paired with BESS or supercapacitors.

### Contracts and factory capacity

Bloom's contracts are now in gigawatts:

- **AEP:** about **900 MW for US$2.65bn** (≈US$2,944/kW) ([Fintool](https://fintool.com/news/bloom-energy-aep-2-65-billion-fuel-cell-deal)).
- **Oracle:** up to **2.8 GW** ([Hydrogen Fuel News](https://www.hydrogenfuelnews.com/fuel-cell-capacity-growth-bloom-energys-expanded-deal-with-oracle/8575599/)).
- **Equinix:** a 10-year agreement for more than 100 MW in the US ([mgrid](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)).
- **Nebius:** 328 MW, for US sites ([Pulse/CNBC](https://www.pulse.bot/energy/news/bloom-energy-rises-12-after-partnering-with-european-ai-infrastructure-upstart-in-26-billion-deal-42cb17a9-9ea4-4527-a5f1-f2bd161b4c65/)).

Bloom's Q3 2026 revenue was **US$1,235.8m, up 138%** ([Bloom 8-K](https://www.sec.gov/Archives/edgar/data/0001664703/000162828026066890/ex991_q326financialresults.htm)). It targets **2 GW/yr** of production by end-2026 and claims "50 MW in as little as 90 days and 100 MW in 120 days when gas supply and permits are in place" ([mgrid](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)). Its CEO cited power at Oracle's Utah site "in less than 2 months" ([Q3 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)).

The other suppliers are an order of magnitude smaller:

- **FuelCell Energy:** produced at about **37 MW/yr** in Q3 FY2026, targeting 100 MW/yr from October 2026 and 500 MW/yr by June 2028. Its Fit Energy deal covers up to 380 MW ([FCE](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)).
- **Doosan:** heads to 350 MW/yr. A roughly ₩500bn US data centre PAFC order placed around September 2026 delivers from March 2027 ([FN Korea](https://en.fnnews.com/news/202609030758521237)).

### Europe remains untested

Bloom's 325 kW unit is CE-marked for 50 Hz. In October 2026, however, management named no European deployment and said only that it is "engaged with potential local partners" ([Q3 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)). Bloom's US 90-day claims depend on US crews, gas and permits. European time-to-power should be planned on gas-connection and permitting timelines instead.

The European-origin SOFC route is still early. Centrica and Delta, a Ceres licensee, plan a UK demonstrator "within the next year" and megawatt-scale systems in **3–5 years** ([Hydrogen Europe](https://hydrogeneurope.eu/centrica-looks-to-delta-for-sofc-systems-for-european-data-centres-and-industry/)). European hydrogen deployments stop at 0.5 MW: NorthC Groningen and Equinix's 12-week Dublin pilot.

On permitting, the MCPD defines combustion plant as apparatus in which fuels are oxidised "in order to use the heat thus generated" ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32015L2193)). That likely places fuel cells outside the directive, but national regulators should confirm. With NOx near zero, fuel cells have a strong case at air-quality-constrained sites.

### Cost

Cost estimates span a wide range:

- **AEP contract:** implies about US$2,900/kW.
- **Rabobank:** US$3,000–4,000/kW for SOFC.
- **US DOE (2015 status):** installed costs of **US$2,400–5,500/kW** for 100 kW–3 MW natural gas units ([DOE](https://www.energy.gov/eere/fuelcells/doe-technical-targets-fuel-cell-systems-stationary-combined-heat-and-power)).

Microsoft found hydrogen fuel-cell backup "currently much higher than diesel" per kWh ([DCD](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant)).

## Batteries become the mandatory partner for island AI loads

Container energy rose from 3.7–4 MWh to **5–7 MWh per 20 ft-class unit** during 2025–26, and every major product is LFP. "Mega" units of 9–14.5 MWh have been announced but are not yet common in Europe.

| Product | MWh per enclosure | MW per enclosure | Durations | Round-trip efficiency | Notes | Source |
|---|---|---|---|---|---|---|
| Tesla Megapack 2 XL | 3.85–3.92 | 1.93 (2 h) / 0.98 (4 h) | 2, 4 h | 92.0–93.7% at 480 V | 15-year warranty, extendable to 20 | [Tesla datasheet](https://portal.ct.gov/-/media/csc/3_petitions-medialibrary/petitions_medialibrary/mediapetitionnos1601-1700/pe1607/petitionersubmissions/supplement-attachment-a---megapack_2_xl_datasheet.pdf) |
| Tesla Megapack 3 | 5.0 | 2.5 | up to 8 h | 92.5% | 10,000+ cycles; deliveries toward end-2026 from Houston; ~US$1.39m per unit (secondary source) | [ESN](https://www.energy-storage.news/under-the-hood-inside-teslas-megapack-3-as-texas-production-begins/) |
| Tesla Megablock | 20 (4 × Megapack 3) | ~5 (4 h, derived) | 4 h | 91% at MV including auxiliaries | Integrated MV kit; 1 GWh in ~20 business days (claim) | [RenewEconomy](https://reneweconomy.com.au/tesla-unveils-megapack-3-and-new-megablock-says-they-will-be-40-pct-cheaper-to-build/) |
| Sungrow PowerTitan 2.0 | 5.015 | 2.52 / 1.26 MVA | 2, 4 h | not on US datasheet | 20 ft, 42 t | [Sungrow](https://info-support.sungrowpower.com/application/pdf/2024/12/07/ST5015UX-2H-US_ST5015UX-4H-US%20Datasheet.pdf) |
| Sungrow PowerTitan 3.0 (EU) | 7.14 | 1.7 | 4–8 h | 92% | Grid-forming, black start; European launch Jan 2026 | [ESN](https://www.energy-storage.news/sungrow-power-titan-3-ess-debuts-in-europe-at-7-2mw-28-5mwh/) |
| Fluence Gridstack Pro / Smartstack | 2.4–5.6 / 7.5–10 | not published | 2–8 h | >87% | Grid-forming for off-grid sites | [Fluence](https://info.fluenceenergy.com/hubfs/Fluence%20Gridstack%20Pro_Global_US%20EN.pdf); [ESS News](https://www.ess-news.com/2026/06/25/fluence-expands-smartstack-platform-with-high-density-10-mwh-bess-option/) |
| Huawei LUNA2000-5015-2S / 2236-1S | 5.015 / 2.236 | 2.51 / 2.236 | ~2 h / ~1 h | PCS 99.01% | Grid-forming standard; VDE 4120 and EN 50549 PCS | [Huawei](https://d1vnxmxnhoo2jv.cloudfront.net/catalogs/39f48e42-FusionSolar-Utility-Smart-String-Grid-Forming-ESS-Solution-Datasheet-20260408.pdf) |
| CATL TENER Stack | 9 | not published | not published | not published | Stacked design | [Battery Design](https://www.batterydesign.net/catl-unveils-9mwh-system-redefining-utility-scale-storage/) |
| BYD Haohan | 14.5 | not published | Long duration | not published | Launched Sep 2025 | [ESN](https://www.energy-storage.news/byd-launches-14-5mwh-bess-as-energy-density-race-continues/) |
| Hithium ∞Power (EU) / Trina Elementa 3 | 6.25 | not published | 2, 4 h | not published | EU-version products | [Hithium](https://www.finanzen.net/nachricht/aktien/hithium-launches-power-6-25mwh-2h-4h-bess-eu-version-and-accelerating-manufacturing-in-europe-through-partnership-with-gcrpv-14467519); [Trina](https://www.trinasolar.com/en-glb/newsroom202512160637/) |
| Wärtsilä Quantum3 | 5 | not published | not published | not published | AC block | [ESN](https://www.energy-storage.news/wartsila-joins-5mwh-club-with-latest-bess-product/) |
| Saft Intensium Max 20 HE | ~2 | 3 | ~40 min | not published | Microsoft Sweden diesel replacement | [DCD](https://datacenterdynamics.com/en/news/microsoft-replaces-diesels-with-battery-system-at-swedish-data-center) |

### Sizing follows the load swing, not the energy

Container counts (derived): a 2 h system needs about **0.4–0.5 containers per MW**, and a 4 h system about 0.6–1.0. A 100 MW / 200 MWh data centre BESS is therefore about **40–52 containers plus MV skids**.

Round-trip efficiency figures are not on a common basis. Tesla quotes at the 480 V terminals, while Megablock's 91% is at MV including auxiliaries. A tool should apply about **85–88% at the grid point** (judgement, not a sourced figure).

Vendors size BESS power to the load swing:

- **Wärtsilä:** starts with **BESS power equal to the load change at 2 h duration**. It says islanded AI data centres are "basically impossible" without batteries because engines cannot follow the load ([ESN](https://www.energy-storage.news/wartsila-on-why-ai-data-centres-need-bess-to-smooth-demand-and-avoid-destroying-the-grid/)).
- **Tesla:** its own 130 MW Gigafactory Texas data centre carries **130 MW / 260 MWh** behind the meter. Tesla reports load-smoothing that cuts AI training variability by over 70%, and ride-through about 30 ms after voltage recovery ([Tesla ERCOT](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf)).
- **Microsoft Sweden** (diesel replacement): **24 MW / 16 MWh**, about 40 minutes at full power, deployed in 16 months ([DCD](https://datacenterdynamics.com/en/news/microsoft-replaces-diesels-with-battery-system-at-swedish-data-center)).

**For island or bridge plant (inference):** BESS power should at least cover the largest step load plus the largest single generator trip, and the BESS should be grid-forming.

Regulation is now driving BESS adoption in Europe. Ireland's December 2025 Large Energy User decision requires new data centres above 10 MVA to provide on-site or nearby dispatchable generation or storage matching their maximum import capacity ([William Fry](https://www.williamfry.com/knowledge/cru-publishes-long-awaited-final-policy-on-data-centre-connections/)). In Germany, grid-forming inverters can earn inertia revenue of **€8–20k/MW/yr** ([Modo](https://modoenergy.com/research/en/germany-battery-investment-outlook-q2-2026-executive-summary)).

### European prices sit 50% above the global average

BNEF's December 2025 survey puts turnkey BESS at **US$177/kWh in Europe**, against US$117 globally, US$219 in the US and US$73 in China ([ESN](https://www.energy-storage.news/battery-storage-system-prices-continue-to-fall-sharply-bnef-and-ember-reports-find/)). Installed costs:

- **Germany (Modo, 2026 COD):** **€700k/MW for 2 h** (about €350/kWh) and **€935k/MW for 4 h** (about €234/kWh) ([Modo](https://modoenergy.com/research/en/germany-battery-investment-outlook-q2-2026-executive-summary)).
- **Global median (Modo, September 2026):** US$325k/MWh for 2 h and US$201k/MWh for 4 h ([Modo](https://modoenergy.com/research/en/global-battery-capex-september-2026-research)).
- **Grid connection** alone adds **US$30–100/kWh** ([Ember via ESN](https://www.energy-storage.news/battery-storage-system-prices-continue-to-fall-sharply-bnef-and-ember-reports-find/)).

For ride-through and step-load duty, cost per MW, not per kWh, should drive selection. High C-rate builds cost more per kWh but less per kW.

### Lead times and trade rules

Wärtsilä puts battery lead times at **about 18 months**, against years for transformers and gas generators ([ESN](https://www.energy-storage.news/wartsila-on-why-ai-data-centres-need-bess-to-smooth-demand-and-avoid-destroying-the-grid/)). Once delivered, vendors claim 1 GWh can be commissioned in 12–20 working days ([ESN](https://www.energy-storage.news/sungrow-power-titan-3-ess-debuts-in-europe-at-7-2mw-28-5mwh/)).

Supply tightened in 2026. The price of 314 Ah LFP cells rose from about 0.32 to 0.365 RMB/Wh in the first half, and most tier-1 order books extend into 2027 ([SMM](https://news.metal.com/en/newscontent/103999667-smm-analysis-riding-the-winds-in-and-outside-china-breaking-the-iron-law-of-old-cycles-2026-energy-storage-battery-cell)).

Two European rules now shape supplier choice:

- **EU funding ban:** since May 2026, EIB/EIF funding excludes projects that use "high-risk" (including Chinese) inverters, explicitly including BESS power conversion systems ([ESS News](https://www.ess-news.com/2026/05/04/eu-funding-ban-on-high-risk-inverters-including-chinese-suppliers-extends-to-bess-pcs/)).
- **Battery passport:** mandatory for industrial batteries from February 2027 ([ESN](https://www.energy-storage.news/three-years-on-how-much-has-the-eu-batteries-regulation-changed-the-bess-market/)).

## Europe's bridge market rents 1–2 MW modules, not turbines

Only a handful of firms have documented European data centre bridge or standby work. Their public material almost never states fleet size, contract length or price.

| Provider | European footprint | Equipment and unit size | Stated delivery speed | Contract terms stated | European data centre references | Source |
|---|---|---|---|---|---|---|
| Aggreko | Grid-code certified in UK, IE, DE, FR, IT, ES, NL, BE, PL, RO, CZ | 1.5 MW gas units; 1 MW and 1,250 kVA Stage V diesel/HVO sets; BESS; CHP; load banks | Over 50 MW "in a matter of months rather than years" | Rental with 24/7 support; 12-month Dublin bridge; 4-year, 43 MW Romanian CHP | Dublin 14 MW (12 gas gensets + BESS); Dublin 20 MVA (24 × 1 MW); London 13 MW HVO + 15 MVA standby + 5 MVA load bank | [Hydrocarbon Processing](https://hydrocarbonprocessing.com/news/2026/09/aggreko-tackles-petrochemical-grid-strain-with-pan-european-grid-code-compliance-certification/); [case 1](https://www.aggreko.com/en-us/case-studies/data-centres/gas-power-for-a-data-centre); [case 2](https://www.aggreko.com/en-gb/case-studies/data-centres/supporting-sustainable-progress-for-a-new-data-centre); [case 3](https://bynder.aggreko.com/m/11dae7e0e1e41922/original/EUR-DC-GU-Case-Study-Providing-greater-resilience-at-a-critical-UK-Data-Centre.pdf) |
| Cat dealer rental (ex-Energyst): Finning UK/IE, Zeppelin DE/SE, Pon Benelux/NO, Finanzauto ES | As listed | Cat rental units 455 kW–2 MW, diesel or gas, HVO shown | Not stated ("set up in weeks", per Cat's generic bridge-power paper) | Rental with application engineering | None named | [KHL](https://www.khl.com/news/energyst-dissolved-and-split-between-cat-dealers/1147594.article); [Power Engineering](https://www.power-eng.com/onsite-power/the-advantages-of-rental-power-in-addressing-todays-energy-challenges/); [Finning IE](https://finning.com/en_IE/products/rentals/power-systems/industries/critical-facilities.html) |
| Atlas Copco Specialty Rental | Europe-wide; UK depots | QAS 150–630 kVA and PM1500 (1,446 kVA) Stage V, HVO-compatible; ZBC 1000-1200 battery (1 MW / 1.2 MWh, 16 in parallel) | Not stated | Short- and long-term rental | None found | [Atlas Copco leaflet](https://www.atlascopco.com/content/dam/atlas-copco/construction-technique/specialty-rental/documents/power/leaflet-power-modules/leaflet-modular-power-solutions-europe.pdf); [IRN](https://internationalrentalnews.com/news/atlas-copco-rolls-out-zbc-1000-1200-energy-storage-system/8054954.article) |
| Bredenoord | NL, DE, DK | Gensets (biogas, methanol, Stage V); Battery Box 600 kWh | Not stated | Rental, sale, maintenance | Interconnect: backup service for ~15 years | [Bredenoord](https://www.bredenoord.com/en/) |
| Power Electrics | UK | Diesel 550–2,000 kVA | Not stated | Standby and prime packages | None named | [Power Electrics](https://powerelectrics-website.azurewebsites.net/generator-hire/550-2000-kva-generator-hire) |
| Rolls-Royce mtu (with Flexpowernet) | NL | 24 containerised Series 4000 gas gensets in six 10 MW blocks (60 MW) | Installed mid-2026, in use from Q3 2026 | EPC + maintenance + **10-year availability guarantee**; movable; until 2036 | DSO grid-congestion use, not a data centre | [Enlit](https://www.enlit.world/library/stedin-taps-rolls-royce-mtu-gas-gensets-for-grid-stability) |
| GE Vernova TM2500 | CH precedent; built in HU | 34 MW two-trailer aeroderivative | "30-day lead time from contract to commissioning" (claim); 26 weeks in the Swiss case | Sale; lease not stated | None | [GE Vernova](https://www.gevernova.com/news/press-releases/ge-vernova-launches-tm2500-dle-aeroderivative-gas-turbine-worlds-first-mobile-power); [GE Switzerland](https://www.ge.com/news/reports/mobile-service-switzerland-is-shoring-up-its-energy-security-with-ges-brilliant-power-on) |
| APR Energy | None current; Cyprus precedent (120 MW in 20 days) | Over 1.1 GW of TM2500 and FT8 mobile turbines | "30–90 days" | "12 months or five years", typically 2–5 years | None (Ireland enquiry only) | [APR](https://aprenergy.com/fast-power/interim-power); [Construction Briefing](https://www.constructionbriefing.com/apr-looks-to-cash-in-on-data-centre-power-gold-rush/8051948.article); [APR PR](https://energydigital.com/globenewswire/3219412) |
| ProEnergy | None stated | PE6000, 50 MW | 12 months from order (8 units) | Equipment sale; lease engines | None | [ProEnergy](https://www.proenergyservices.com/wp-content/uploads/2025/12/Manufactured-Equipment.pdf) |
| GeoPura (Ballard), also via Sunbelt UK & Ireland | UK, IE | Hydrogen fuel-cell units: 80 kW towable; ~250 kW containers; "multi-MW" HPU2 planned | Not stated | Hire, or energy-as-a-service bundling unit, hydrogen and support | Equinix DB3 Dublin, 0.5 MW, 12-week pilot | [GeoPura](https://www.geopura.com/); [RER](https://www.rermag.com/news-analysis/headline-news/article/55375992/sunbelt-rentals-uk-ireland-partners-with-geopura-to-provide-hyrogen-power); [gasworld](https://www.gasworld.com/story/ballard-closes-acquisition-of-uk-hydrogen-generator-firm-geopura/2258341.article/) |
| Speedy Hydrogen Solutions | UK, IE (exclusive) | AFC Energy 30 kW hydrogen units + batteries | Not stated | Full-service hire including fuelling | None | [Construction Index](https://www.theconstructionindex.co.uk/news/view/speedy-launches-hydrogen-generator-jv) |

### Aggreko leads; turbine fleets have gone to US buyers

Aggreko is the only rental provider with documented European data centre bridges at multi-MW scale. In September 2026 its **1.5 MW generator fleet won grid-code certification in 11 countries**, letting units run in parallel with public networks. Aggreko says gas projects above 50 MW can be deployed "in a matter of months rather than years" ([Hydrocarbon Processing](https://hydrocarbonprocessing.com/news/2026/09/aggreko-tackles-petrochemical-grid-strain-with-pan-european-grid-code-compliance-certification/)). Its European revenue grew **26% in H1 2025**, and fleet investment rose to **US$457m from US$290m** ([Aggreko H1 2025](https://edge.sitecorecloud.io/aggrekoukli7a45-corporatesiaac7-production07bc-79cd/media/investordocuments/2025/albion-jvco---q2-25-results-statement.pdf)).

Its Dublin case studies set the European norm: bridges of 14–20 MW lasting **"several months" to 12 months**. In one, 24 × 1 MW Stage V sets bridged a site until the client's own gas turbines came online ([Aggreko](https://www.aggreko.com/en-gb/case-studies/data-centres/supporting-sustainable-progress-for-a-new-data-centre)).

**A 100 MW bridge from 1.5 MW modules means about 67 units at N** (derived). That is feasible, but the European fleet depth behind it is unverified.

The turbine-class rental pool is effectively closed to European third parties:

- **APR Energy** grew from 850 MW to **over 1.1 GW** in January 2026 ([APR](https://energydigital.com/globenewswire/3219412)). It was then reportedly bought by Elon Musk for about **US$1bn** (an estimate), with the deal flagged by an FTC notice in May 2026 ([Latitude Media](https://www.latitudemedia.com/news/what-to-know-about-elon-musks-billion-dollar-turbine-deal/)). The fleet is expected to serve Musk-related data centres.
- **VoltaGrid** (25 MW Jenbacher packs), **Enchanted Rock** and **Crusoe's** owned fleets have no European presence ([DCF](https://www.datacenterfrontier.com/energy/article/55325092/innio-and-voltagrid-landmark-23-gw-modular-power-deal-signals-new-phase-for-ai-data-centers); [ERock](https://erock.com/)).

The one European turbine precedent is a utility reserve, not a data centre. Switzerland contracted **eight TM2500s (up to 250 MW)** in September 2022 as a reserve plant available until 2026. It took about **26 weeks from contract to commercial start-up** and needed a 20 m noise wall near housing ([GE](https://www.ge.com/news/reports/mobile-service-switzerland-is-shoring-up-its-energy-security-with-ges-brilliant-power-on)). The Stedin deal shows a different commercial model: Rolls-Royce mtu supplies EPC, maintenance and a **10-year availability guarantee** on a movable fleet ([Enlit](https://www.enlit.world/library/stedin-taps-rolls-royce-mtu-gas-gensets-for-grid-stability)).

### No rental price is published anywhere

No source gave a rental rate per kW-month, per day or per MWh for any provider. The best European proxy is ESB's 200 MW North Wall temporary emergency-generation contract with EirGrid: **€508.7m over five years**, or €357m if only three years were needed ([BreakingNews.ie](https://www.breakingnews.ie/ireland/emergency-power-plan-for-esb-north-wall-station-to-cost-e508m-over-five-years-1406362.html)). That works out at about **€42/kW-month, or €50/kW-month on the three-year basis** (derived). It covers availability with capped run hours only, so fuel and O&M come on top.

Ireland's full temporary-generation scheme of 650 MW has cost consumers **€1.44bn**, and the plants were called only twice, both times in 2026 ([Irish Times](https://www.irishtimes.com/business/2026/10/09/emergency-electricity-plants-to-cost-customers-14bn/)). For energy costs, RaboResearch estimates US BTM gas at **US$100–165/MWh**, against US$90–95/MWh for grid-connected alternatives ([Rabobank](https://www.rabobank.com/knowledge/d011524694-the-sprint-data-centers-are-building-a-parallel-energy-system-in-the-us)). The tool should keep rental prices as user inputs, with these anchors shown alongside.

### Rules turn long bridges into permanent plant

Each market treats temporary generation differently:

- **England:** mobile generators are exempt from specified-generator controls, unless they do a static generator's job or stay in place **six months or more** ([GOV.UK](https://www.gov.uk/guidance/specified-generator-when-you-need-a-permit)). A multi-month data centre bridge should therefore be planned as a permitted plant.
- **Ireland:** the CRU decision of December 2025 requires dispatchable generation or storage equal to **100% of de-rated maximum import capacity**, participating in the wholesale market. A data centre cannot ramp to full import until that capacity exists. The decision does not address temporary or bridge generation ([DLA Piper](https://www.dlapiper.com/insights/publications/2026/01/new-irish-large-energy-users-connection-policy)). The CRU is also considering making new gas connections above 50 MWth interruptible ([Data Centre Review](https://datacentrereview.com/?p=90522)), which favours dual-fuel gas/HVO fleets.
- **Netherlands:** the DSO itself now runs temporary gas, as the Stedin fleet shows. For data centres, the hyperscale zoning ban and nitrogen permitting are bigger constraints than generator rules ([Slaughter and May](https://www.slaughterandmay.com/services/practices/infrastructure-and-energy/power-and-place-a-regulatory-guide-to-data-centre-developments-in-europe/the-netherlands/)).

The Irish pattern is telling. Rental bridges there have ended in a grid connection or in the client's own permanent gas plant, and Vantage's Grange Castle campus planned to run on gas until EirGrid capacity exists ([TheJournal.ie](https://www.thejournal.ie/investigates-data-centres-6554698-Nov2024/)).

## Conclusion

The evidence argues for building the tool around two driving inputs: **target date of first power** and **annual running hours**. Technology choice largely follows from those two. A campus that needs power before 2028 is effectively choosing among four options:

- rented 1.5 MW gas modules;
- high-speed gas gensets;
- refurbished or mobile aeroderivatives;
- Bloom SOFC, if Bloom allocates European capacity.

Heavy-duty turbines become a phase-two asset for the early 2030s. Once running hours exceed a few hundred per year, the emissions regime changes, SCR becomes standard, and diesel's cost advantage largely disappears. The engine-plus-battery hybrid emerges as the default European island and bridge design. Engines are deliverable within two to three years. Batteries arrive faster than engines and are needed for AI step loads in any case. In Ireland, the CRU rules mean that hybrid becomes permanent plant rather than a temporary bridge.

Two further implications follow:

- **Cost inputs should be ranges with an explicit US-to-Europe adjustment and a dated escalation flag.** Turbine prices have nearly tripled, used equipment trades only 15–30% below new, and official planning datasets sit about half below market.
- **The constraint will shift from generators to transformers.** Supply of generation equipment should loosen around 2028–30 as OEM expansions land. HV transformers and switchgear show no firm easing date, so the tool should favour MV-connected modular blocks wherever the critical path runs through a GSU.
