# Gas-fired reciprocating engine gensets for data centre prime, bridge and backup power (1-20 MWe class), status November 2026

Research date: 13 November 2026. All figures are from the source linked next to them. "Derived" or "Inference" means I calculated or judged it myself; it is not a source figure. OEM ratings are ISO 3046 / site-reference ratings at the generator terminals unless stated otherwise. Efficiency is % LHV: OEM heat rates in kJ/kWh convert exactly to the stated efficiency on an LHV basis, e.g. 3600/7165 = 50.2%. 50 Hz ratings are given first. Search budget note: the web-search quota ran out partway through. Several OEM datasheets (Mitsubishi, Liebherr, Bergen, Everllence 35/44G electrical ratings) could not be retrieved and are listed under Gaps.

## 1. Which manufacturers and model families matter for data centres (2024-2026)?

### Takeaway
The data centre gas-engine market has split into two tiers. One is high-speed (1,500/1,800 rpm) gensets of 0.5-4.5 MWe: Jenbacher Type 6 J620/J624, Cat G3516/G3520, mtu Series 4000, Cummins, MWM, plus newcomers such as ERock. These usually come containerised and in very large counts. The other is medium-speed (500-1,000 rpm) engines of 5-20 MWe: Wärtsilä 34SG/31SG/50SG, Everllence 51/60G, Bergen B36:45, Jenbacher J920, Cat CG260/MaK, Kawasaki KG, built into halls or large enclosures. In 2025-2026, US behind-the-meter (BTM) orders in the hundreds of MW to multi-GW were booked by INNIO Jenbacher, Caterpillar, Wärtsilä, Everllence, Bergen and Rolls-Royce mtu. I found no data centre references for Kawasaki, Mitsubishi or Liebherr.

### Cited Findings
- SemiAnalysis counts 22 manufacturers with multi-hundred-MW off-grid data centre orders, up from 12 a year earlier. It tracks 30+ OEMs. It describes high-speed (1,500-1,800 rpm) units as roughly 0.5-4.5 MW and medium-speed (500-1,000 rpm) units as roughly 5-20 MW, with "solutions from 0.5 MW to 20 MW per unit being adopted at scale" (10 Sep 2026; partly paywalled; secondary/analyst). — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)
- Named by SemiAnalysis as active in data centre BTM: ERock (0.5 MW gensets on a 21.9-litre V12 gas engine), INNIO Jenbacher (J624, Type 6, J920), Caterpillar (G3520), Wärtsilä (34SG, 31SG, 50SG), Everllence (51/60G), FTAI Power, Dynamis, Cummins. — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)
- POWER Magazine (2 Mar 2026) lists data centre-relevant models: Cat G3516 and G3520K; INNIO J920 FleXtra and high-speed Jenbachers; Rolls-Royce mtu 20V Series 4000 L64; Wärtsilä 50SG, 31SG, Wärtsilä 31; Everllence 18V51/60DF; Volvo Penta G17 (~450 kWe at 1,800 rpm). — [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/)
- Enverus (11 Aug 2026) forecasts 29.6 GW of gas-fired BTM capacity for US data centres and industry in 2026-2030, of which reciprocating engines are 7.1 GW, small/medium-frame turbines 6.2 GW and fuel cells 4.8 GW. — [Enverus](https://www.enverus.com/newsroom/behind-the-meter-generation-forecast-skipping-the-queue/)
- RaboResearch (24 Jun 2026): of ~40 GW of US gas capacity with a specified class, engines are 26%, aeroderivatives/small simple-cycle turbines 36% and combined cycle 26%. — [Rabobank](https://www.rabobank.com/knowledge/d011532274-the-marathon-can-behind-the-meter-data-center-power-solutions-endure-the-decade-in-the-us)
- Packagers and integrators are an important layer between the OEM and the data centre:
  - VoltaGrid packages Jenbacher J620/J624 into 25 MW "QPac" units. — [INNIO](https://www.innio.com/en/news-media/press-releases/innio-secures-additional-major-order-from-voltagrid-1-5-gw-for-behind-the-meter-power-generation/)
  - Rehlko/Clarke Energy holds a 1.25 GW, three-year Jenbacher framework. — [Power Engineering](https://www.power-eng.com/gas/data-center-power-crunch-lifts-engines-aeroderivatives-into-larger-role/)
  - Liberty Energy / Liberty Power Innovations buys from both Wärtsilä and Bergen. — [Wärtsilä](https://wartsila.com/media/news/29-06-2026-wartsila-secures-new-order-to-power-next-wave-of-ai-driven-data-center-growth-in-the-u-s--3767555); [Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/)
  - AVK integrated Wärtsilä engines for Pure DC in Dublin. — [Wärtsilä](https://www.wartsila.com/energy/learn-more/references/other-industrial/pure-dc-and-avk-ireland)
- Caterpillar is restarting a 10 MW MaK gas engine. First units ship in Q4 2026, ramping over about 18 months toward roughly 1.5 GW of capacity (Q3 2026 earnings, 29 Oct 2026, via Baxtel; secondary). — [Baxtel](https://baxtel.com/news/caterpillar-ramps-engine-and-turbine-output-as-data-center-orders-reach-2029)
- Rolls-Royce launched fast-start mtu gas gensets for data centres on 2 Oct 2025. Existing units are in a UK fleet of 500+ mtu gas gensets and at SpaceDC Jakarta. — [Rolls-Royce](https://www.rolls-royce.com/media/press-releases/2025/02-10-2025-rr-introduces-fast-start-mtu-gas-gensets-for-powering-data-centers.aspx)

### Inferences
- Caterpillar's "10 MW MaK gas engine" is very probably the G20CM34 / M34-family gas engine. The source does not name the model.
- For European campuses the realistic shortlist is: Jenbacher (J620/J624/J920), Wärtsilä (34SG/31SG/50SG), Cat (G3520, CG260-16, MaK), Rolls-Royce mtu Series 4000, Everllence 51/60G and 35/44G, Bergen B36:45, MWM TCG 3020. All have 50 Hz ratings and European service networks. Kawasaki, Mitsubishi and Liebherr appear marginal for data centres on the evidence found.

### Gaps
- Mitsubishi (MACH-30G / KU30GSI) and Liebherr gas-genset data: searched but no datasheet retrieved before the search quota ran out.
- I found no data centre references for Kawasaki, Mitsubishi, Liebherr or Cummins HSK78G (Cummins appears only as a name in SemiAnalysis).
- I did not verify whether "Dynamis" and "FTAI Power" use reciprocating engines or turbines.

## 2. Per-model performance data

### Takeaway
Medium-speed spark-gas engines lead on efficiency: Wärtsilä 31SG 51.5-52.0%, Wärtsilä 50SG 50.2%, Everllence 51/60G up to ~50-51%, Kawasaki KG-18 49-51%, Wärtsilä 34SG 48.9%, J920 48.7%. They reach full load in under 2 minutes (fast start) to under 5 minutes, ramp at more than 100%/min when hot, and can run down to 10% unit load. High-speed gensets are less efficient (43-47%) but faster: Cat G3520 Fast Response reaches full load in 10 s from cold and is rated ISO 8528-5 G2, and mtu's new 20V4000 reaches full load in 45 s. Most OEMs now offer 25 vol% H2 blending. NOx without SCR is typically 250-500 mg/Nm³ at 5% O2 (≈94-188 mg/Nm³ at 15% O2). EU new-plant limits therefore generally need SCR or a 250 mg@5%O2 lean-burn tune.

### Cited Findings

**Per-model table.** Ratings are at 50 Hz unless marked. "n/s" = not stated in the source retrieved.

| Manufacturer | Model | Fuel | Unit output MWe (50 Hz / 60 Hz) | Efficiency % LHV (50/60 Hz) | Start to full load | Ramp rate | Min load % | NOx | H2 blend | Typical package | Notes / source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Wärtsilä | 20V34SG | NG (also biogas, synthetic methane) | 9.795 / 9.388 | 48.9 / 48.8 (HR 7,363 kJ/kWh) | <5 min regular; <2 min fast; grid sync 30 s | >100%/min (hot) | 10 (unit), 1 (plant) | n/s | "capable of H2 blending", % n/s | Power-plant hall / modular blocks | 12V 5.84 MW, 48.0%; 16V 7.83 MW, 48.9%. First data centre use Apr 2026. [Wärtsilä 34SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-34sg-gas-engine) |
| Wärtsilä | 31SG (20V) | NG | 11.777 / 11.377 (power-optimised 12.762 / 12.372; efficiency-optimised 10.790 / 10.389) | 51.5 / 51.6 (eff-opt 52.0 / 52.1; power-opt 50.2 / 50.4) | <5 min regular; <2 min fast | >100%/min | 10 (unit), 1 (plant) | n/s | % n/s | Hall | [Wärtsilä 31SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-31sg-gas-engine). POWER quotes 2.5 min to full output. [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/) |
| Wärtsilä | 18V50SG | NG | 18.434 / 18.875 | 50.2 / 50.0 (HR 7,165 kJ/kWh) | <5 min regular; <2 min fast | >100%/min | 10 (unit), 1 (plant) | <5 ppm with SCR (secondary, unverified) | % n/s | Hall | 5,000+ MW installed. [Wärtsilä 50SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-50sg-gas-engine); NOx from AI-maintained secondary page [jaredwatkins](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/wartsila-btm/). Texas order quotes HR ~6,800 Btu/kWh (~50%) and full output above 100°F. [Wärtsilä](https://www.wartsila.com/media/news/23-04-2026-wartsila-continues-to-expand-its-data-center-footprint-with-new-790-mw-order-in-texas-the-next-data-center-alley-3744599) |
| INNIO Jenbacher | J920 FleXtra | NG | 10.606 / 9.542 (frequency pairing inferred) | up to 48.7 | ~2 min to full power | n/s ("fast load") | n/s | Ratings at 250/500 mg/Nm³ @5% O2; SCR + oxicat integrated | n/s | Hall / power-unit modules | [Jenbacher Type 9](https://www.jenbacher.com:443/en/gas-engines/type-9) |
| INNIO Jenbacher | J624 | NG | 4.507 / 4.459 | 46.9 / 46.4 (@500 mg NOx); 45.9 / 45.5 (@250 mg) | n/s | n/s | n/s | 250 or 500 mg/Nm³ @5% O2 | "Ready for H2": convertible up to 100% in future | Container (12-20.5 m L) or hall | Genset 12.8 x 2.5 x 2.9 m, 52.1 t. 60,000 h to first major overhaul. [Jenbacher Type 6 ETS](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf) |
| INNIO Jenbacher | J620 | NG | 3.360 / 3.331 | 45.6 / 45.2 (@500); 44.8 / 44.4 (@250) | n/s | n/s | n/s | 250/500 mg/Nm³ @5% O2 | as above | Container / hall | Genset 8.9 x 2.2 x 2.8 m, 36.9 t. [Type 6 ETS](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf) |
| INNIO Jenbacher | J620 Fast Start | NG | 3.114 (600 V-11 kV) / 3.091 (480 V-13.8 kV) | up to 43.3 / 43.0 | "fast start", seconds n/s | "high transient" | n/s | 250/500 mg/Nm³ @5% O2; SCR + oxicat BoP | n/s | Containerised 3 MW concept "for data center applications" | [Jenbacher J620 Fast Start](https://www.jenbacher.com/en/gas-engines/type-6/j620-fast-start/) |
| INNIO Jenbacher | J616 / J612 | NG | 2.676 / 2.646; 2.007 / 1.979 | 45.7 / 45.2; 45.4 / 44.7 (@500) | n/s | n/s | n/s | 250/500 @5% O2 | as above | Container | [Type 6 ETS](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf) |
| Caterpillar | G3520 Fast Response | NG | 2.6 (3,250 kVA) at 50 Hz | n/s | 10 s from cold start; recovers from 100% block load | n/s | n/s | n/s | n/s | Enclosure/container | ISO 8528-5 G2. Rated for emergency standby and demand response. Launched Aug 2024. [Cat](https://www.cat.com/en_AU/news/engine-press-releases/cat-g3520-fast-response-natural-gas-generator-set-enabling-lower-greenhouse-gas-emissions.html) |
| Caterpillar | G3516 Fast Response | NG | n/s | n/s | ~7 s zero to full load | n/s | n/s | n/s | n/s | Enclosure | Used for 2 GW AIP/Monarch (WV). [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/); [Heavy Equipment](https://www.heavyquipmag.com/2026/07/29/caterpillar-is-finding-its-next-growth-engine-inside-the-ai-power-crunch/) |
| Caterpillar | G3520K | NG | n/s | n/s | n/s | n/s | n/s | n/s | n/s | n/s | Joule 4 GW Utah prime power with CCHP. [Power Progress](https://www.powerprogress.com/power-generation/news/joule-taps-caterpillar-and-wheeler-for-4-gw-data-center-in-utah/8082992.article) |
| Caterpillar | CG260-16 | NG | 4.5 / 4.05 (continuous, ekW; pairing inferred) | 44.6 / 44.3 (max) | n/s | n/s | n/s | n/s | up to 25 vol% | Hall / enclosure | 1,000/900 rpm. Genset 9.42 x 2.79 x 3.39 m, 53.3 t. [Cat CG260-16](https://www.cat.com/en_ZA/products/new/power-systems/electric-power/gas-generator-sets/15969827.html) |
| Caterpillar (MaK) | 10 MW MaK gas engine (likely G20CM34; inference) | NG | ~10 | n/s | n/s | n/s | n/s | n/s | n/s | Hall | Restart, first ship Q4 2026. [Baxtel](https://baxtel.com/news/caterpillar-ramps-engine-and-turbine-output-as-data-center-orders-reach-2029) |
| Rolls-Royce mtu | 20V4000 GS (Series 4000 gas) | NG | 2.538 / 2.521 | 43.9 / 43.6 (range peak 44.4) | <120 s (fast-start option) | n/s | 35 (continuous operation allowed down to) | 250/500 mg/Nm³ @5% O2 without EGAT; <100 mg with EGAT | 25% now; 100% "soon" | Container available | 8V 1.013 MW; 12V 1.521 MW; 16V 2.028 MW. 84,000 h TBO. [mtu Series 4000](https://mtu-solutions.com/eu/en/applications/power-generation/power-generation-products/gas-generator-sets/natural-gas-generator-sets/gas-powered-series-4000.html) |
| Rolls-Royce mtu | 20V4000 L64 (new, 60 Hz US) | NG | 2.8 (60 Hz) | n/s | 45 s to full output (from 2026) | n/s | n/s | n/s | 100% H2 or admixture (future) | Container; no gearbox | [Rolls-Royce](https://www.rolls-royce.com/media/press-releases/2025/02-10-2025-rr-introduces-fast-start-mtu-gas-gensets-for-powering-data-centers.aspx) |
| Everllence (ex-MAN ES) | 18V51/60G | NG | ~20 per unit (derived: 480 MW / 24). Up to 20.7 MWm mechanical | up to 50% single cycle (order PR); 51% for 51/60G TS (two-stage turbo) | <5 min | "within minutes" | n/s | SCR + oxidation catalyst | up to 25 vol% | Hall | 8 GW installed (51/60 family). [Everllence](https://www.everllence.com/company/press-releases/details/2026/07/29/everllence-to-supply-480-mw-for-off-grid-data-center-in-the-u.s); [MAN/Everllence](https://man-es.com/energy-storage/products/gas-fuel-engines/1000) |
| Everllence | 35/44G (TS) | NG | up to 12.8 MWm mechanical; electrical n/s | n/s | 90 s start to full load | n/s | n/s | n/s | up to 25 vol% (35/44G TS) | Hall | 720/750 rpm. [MAN/Everllence](https://man-es.com/energy-storage/products/gas-fuel-engines/1000) |
| Bergen Engines | B36:45V20AG2 | NG | 12.5 | n/s | n/s | n/s | n/s | n/s | n/s | Hall / enclosure | Marelli alternators; Crusoe order. [Crusoe](https://crusoe.ai/resources/newsroom/bergen-engines-signs-approx-750mw-u-s-power-agreement-with-crusoe-for-ai-data-centers) |
| Bergen Engines | B36:45V20AG1 | NG | 11.2 | n/s | n/s | n/s | n/s | n/s | n/s | n/s | Liberty order. [Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/) |
| Bergen Engines | B36:45L9AG | NG | 5.0 | n/s | n/s | n/s | n/s | n/s | n/s | n/s | [Crusoe](https://crusoe.ai/resources/newsroom/bergen-engines-signs-approx-750mw-u-s-power-agreement-with-crusoe-for-ai-data-centers) |
| Cummins | HSK78G | NG | up to ~2.0 | up to 44.2 (50 Hz) / 43.5 (60 Hz) | n/s | n/s | n/s | n/s | n/s | Enclosure / hall | Launched Jan 2019. Prime and peaking. [Power Engineering 2019](https://www.power-eng.com/gas/turbines/cummins-debuting-new-gas-fired-generator-series/) |
| Cummins | QSK60G (C995-C1540 N5C/N5CC 50 Hz; C1000-C1400 N6/N6C 60 Hz) | Lean-burn NG | ~1.0-1.54 (inferred from model designations) | up to 43.8 (C1540 N5CC); 41.0-43.8 at 50 Hz | n/s | n/s | n/s | as low as 250 mg/Nm³ (0.5 g/hp-hr) | n/s | Enclosure | Prime/peaking/CHP. [Cummins QSK60G](https://www.cummins.com/generators/qsk60g-gas-generator-series) |
| MWM (Caterpillar) | TCG 3020 V20 | NG | 2.3 (50 & 60 Hz); V16 1.84; V12 1.38 | ~43.7-45.0 (@500 mg); ~42.3-44.0 (@250 mg) | n/s | n/s | n/s | 250/500 mg/Nm³ @5% O2 | 25 vol% (new plants; 25H2-Kit retrofit) | Container / hall | Overhaul 80,000 h; cylinder head 40,000 h (natural gas). [MWM](https://www.mwm.net/en/gas-engines-gensets/gas-engine-tcg-3020-v20/) |
| Kawasaki | KG-18-V / KG-18-T / KG-12 | NG | KG-18-V 7.8 (50 Hz); KG-18-T 7.5 (60 Hz); KG-12 5.2 / 5.0 | 49.5 (KG-18-V); 51.0 (KG-18-T); 49.0 (KG-12/18) | within 10 min (5 min option) | n/s | n/s | 200 ppm (O2 = 0%) | n/s on page | Hall | 750/720 rpm. [Kawasaki](https://global.kawasaki.com/en/energy/equipment/gas_engines/line_up.html) |
| Volvo Penta | G17 | NG | ~0.45 (1,800 rpm) | n/s | n/s | n/s | n/s | n/s | n/s | Container | [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/) |
| ERock | V12 21.9 L gas genset | NG | 0.5 | n/s | n/s | n/s | n/s | n/s | n/s | Skid/container | Truck-derivative. [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the) |

**Maintenance and availability data points**
- mtu Series 4000 gas: 84,000 operating hours to major overhaul (TBO). — [mtu](https://mtu-solutions.com/eu/en/applications/power-generation/power-generation-products/gas-generator-sets/natural-gas-generator-sets/gas-powered-series-4000.html); [Rolls-Royce](https://www.rolls-royce.com/media/press-releases/2025/02-10-2025-rr-introduces-fast-start-mtu-gas-gensets-for-powering-data-centers.aspx)
- Jenbacher Type 6: 60,000 operating hours before the first major overhaul. — [Jenbacher Type 6 ETS](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf)
- MWM TCG 3020 on natural gas: first service 4,000 h; cylinder head inspection by 40,000 h; general overhaul 80,000 h. Oil consumption 0.15 g/kWhel. — [MWM](https://www.mwm.net/en/gas-engines-gensets/gas-engine-tcg-3020-v20/)
- Caterpillar example: 20,000-hour top-end and 80,000-hour overhaul. Jenbacher major work at 60,000 or 80,000 h. At 8,000 h/yr that is ~2.5 years to top-end and 7.5-10 years to major overhaul (analyst). — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)
- Wärtsilä 50SG overhaul every 60,000-80,000 h (AI-maintained secondary page, unverified). — [jaredwatkins](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/wartsila-btm/)
- Wärtsilä says SG engines have "no start cost, limitations nor degradation in number of starts". — [Wärtsilä 34SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-34sg-gas-engine)

**Footprint and other data points**
- Jenbacher Type 6 containerised package envelope: 12,000-20,500 mm L x 3,000-6,000 mm W x 7,500 mm H (all models). — [Type 6 ETS](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf)
- Jenbacher Type 6 exhaust outlet temperature is 120°C on natural gas (heat recovery). — [Type 6 ETS](https://careers.jenbacher.com/images/medias/files/167/innio_ets_t6_a4_en_2023_screen_ijb-123006-en.pdf)
- J920 delivers ~94% total efficiency in CHP mode. — [Jenbacher Type 9](https://www.jenbacher.com:443/en/gas-engines/type-9)

### Inferences
- **NOx unit conversion** (Inference, standard O2 correction (21-15)/(21-5) = 0.375). 500 mg/Nm³ @5% O2 ≈ 188 mg/Nm³ @15% O2, and 250 mg/Nm³ @5% O2 ≈ 94 mg/Nm³ @15% O2. So Jenbacher, MWM and mtu "250 mg" tunes roughly meet the EU MCPD new-plant limit of 95 mg/Nm³ @15% O2 (see Q7) without SCR, at a 0.4-1.0 point efficiency penalty, as in the Jenbacher and MWM tables above. "500 mg" tunes need SCR.
- Kawasaki's 200 ppm @0% O2 ≈ 57 ppm @15% O2 ≈ ~117 mg/Nm³ as NO2 (Inference, assumes 2.05 mg/Nm³ per ppm NO2). That is above the MCPD new-plant limit, so SCR would be needed in the EU.
- **Genset-only power density** (Inference). J624: 4.5 MW over 12.8 x 2.5 m ≈ 0.14 MW/m². CG260-16: 4.5 MW over 9.42 x 2.79 m ≈ 0.17 MW/m². This is engine-alternator skid only. Plant-level density, with aisles, cooling, SCR, stacks, gas reception and switchgear, will be several times lower.
- EIA's heat rate for its 21 MW ICE reference plant (8,295 Btu/kWh, see Q6) is on an HHV basis (EIA convention). It equals ~41% HHV, or roughly 45-46% LHV, which matches high-speed/medium-speed engine efficiencies above.
- Wärtsilä's 30 s to grid sync, under 2 min fast start and more than 100%/min hot ramp make medium-speed SG engines suitable for prime/island duty. They cannot replace a 10-second standby set for Tier-type backup unless paired with UPS/BESS ride-through.

### Gaps
- **Part-load efficiency curves:** no OEM part-load figures retrieved. The only qualitative reference is Everllence's "low fuel consumption under partial load".
- **Minimum stable load:** found only for Wärtsilä (10% unit) and mtu (35% continuous).
- **Missing NOx with SCR:** no firm OEM figures in mg/Nm³ @15% O2 for most models.
- **Missing H2 percentages:** none for Wärtsilä SG or Kawasaki.
- **Electrical ratings:** Everllence 35/44G and 51/60G electrical ratings (official MWe) not retrieved. Bergen B36:45 efficiency not retrieved.
- **Cat data:** official kWe/efficiency datasheets for G3516 Fast Response and G3520K not retrieved (Cat QA-site pages redirect to a login).
- **Availability:** no OEM-published availability/reliability (%) figures found.
- **Plant footprint:** no plant-level footprint (MW/ha) figures found.

## 3. How many units per MW, and real data centre projects

### Takeaway
Real 2025-2026 orders show three sizing patterns:
- **Medium-speed:** ~5-6 units per 100 MW (Wärtsilä 50SG ~18.8 MW, Everllence 51/60G ~20 MW) or ~10 per 100 MW (Wärtsilä 34SG, Bergen 11-12.5 MW).
- **High-speed:** ~22-30 units per 100 MW (Jenbacher J624/J620).
- **Very high counts:** ~40-50 units per 100 MW (Cat G3516/G3520, ~2-2.5 MW).

Announced MW figures generally equal nameplate unit count x unit rating. No order states its redundancy level (N+1/N+2). The one disclosed IT-to-generation ratio (OpenAI Shackelford) implies ≥1.5 MW of engines per MW IT. The main European data points are Dublin: Pure DC (6 x Wärtsilä 34DF + 20 MW BESS) and Winthrop (22 x Jenbacher Type 6, 60 MW).

### Cited Findings

**US data centre orders, 2025-2026**

| Date | OEM / packager | Customer / site | Plant MW | Units and model | Implied MW/unit (derived) | Role | Delivery / COD | Source |
|---|---|---|---|---|---|---|---|---|
| 7 Aug 2025 | Caterpillar / Wheeler | Joule Capital Partners, Utah (4,000 acres) | up to 4,000 | G3520K fleet (count n/s) + CCHP + 1.1 GWh grid-forming BESS | n/a | Prime (plus backup from diverse fuels) | GW-scale operations from 2026 | [Power Progress](https://www.powerprogress.com/power-generation/news/joule-taps-caterpillar-and-wheeler-for-4-gw-data-center-in-utah/8082992.article) |
| Aug 2025 | Caterpillar | Hunt Energy, North America (first in Texas) | up to 1,000 | n/s | n/a | n/s | multi-year | [Baxtel](https://baxtel.com/news/caterpillar-ramps-engine-and-turbine-output-as-data-center-orders-reach-2029); [Heavy Equipment](https://www.heavyquipmag.com/2026/07/29/caterpillar-is-finding-its-next-growth-engine-inside-the-ai-power-crunch/) |
| Jul 2025 (secondary) | Wärtsilä | Ohio | 282 | 15 x 18V50SG | 18.8 | n/s | late 2026-2027 | [jaredwatkins (AI-maintained secondary)](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/wartsila-btm/) |
| 21 Oct 2025 | INNIO / VoltaGrid | "one of the world's largest data center" operators | 2,300 | 92 x 25 MW power packs (Jenbacher) | 25 per pack | Prime, backup and peak | n/s | [INNIO PR](https://www.innio.com/wp-content/uploads/2025/10/PR_INNIO-Secures-Largest-Order-in-Company-History-.pdf) |
| Nov 2025 (secondary) | Wärtsilä | US, undisclosed | 507 | 27 x 50SG | 18.8 | n/s | equipment 2027 | [jaredwatkins](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/wartsila-btm/) |
| Jan 2026 | Wärtsilä | US IOU data centre plant | 429 | 24 x 50SG | ~17.9 | n/s | n/s | [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/) |
| Jan-Mar 2026 | Caterpillar (Boyd CAT) / AIP; Nscale | Monarch Compute Campus, Mason County, WV | 2,000 | G3516 fast-response gensets (Baxtel record cites 864 x G3516 for Monarch Bldg2) | ~2.3 if 864 units = 2 GW (inconsistent with G3516 size; see Inferences) | Off-grid prime, future grid option | n/s | [Power Engineering](https://www.power-eng.com/gas/data-center-power-crunch-lifts-engines-aeroderivatives-into-larger-role/); [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/); [Baxtel](https://baxtel.com/news/caterpillar-ramps-engine-and-turbine-output-as-data-center-orders-reach-2029) |
| 11 Feb 2026 | INNIO / VoltaGrid | US data centres | 1,500 | 300 x J624 + J620 (split n/s), packaged into 25 MW units | 5.0 average (above J624 4.5 MW rating; see Inferences) | Prime, backup, peaking; "no batteries" | by 2028 | [INNIO](https://www.innio.com/en/news-media/press-releases/innio-secures-additional-major-order-from-voltagrid-1-5-gw-for-behind-the-meter-power-generation/) |
| Apr 2026 | INNIO / Rehlko (Clarke Energy) | framework | 1,250 over 3 years (expands earlier 700 MW reservation) | Jenbacher | n/a | n/a | 3-year supply | [Power Engineering](https://www.power-eng.com/gas/data-center-power-crunch-lifts-engines-aeroderivatives-into-larger-role/) |
| 16 Apr 2026 | Wärtsilä | Hyperscale, Ohio | 412 | 40 x 34SG | 10.3 (above 20V34SG 60 Hz rating of 9.39) | Primary power, off-grid | COD early 2028 | [Wärtsilä](https://www.wartsila.com/media/news/16-04-2026-wartsila-s-34sg-engine-makes-its-data-center-debut-with-new-412-mw-u-s-project-3740972) |
| 23 Apr 2026 | Wärtsilä | Texas, off-grid | 790 | 42 x 50SG | 18.8 (= 60 Hz rating 18.875) | Primary power | Equipment 2028; full operation late 2029 | [Wärtsilä](https://www.wartsila.com/media/news/23-04-2026-wartsila-continues-to-expand-its-data-center-footprint-with-new-790-mw-order-in-texas-the-next-data-center-alley-3744599) |
| Q2 2026 | INNIO | Unnamed US data centre developer | ~1,100 | >200 x J624 (4.5 MW, containerised) | ~4.5-5.5 | BTM prime | phased | [DCD](https://www.datacenterdynamics.com/en/news/innio-secures-11gw-gas-engine-order-from-data-center-developer-in-us/) |
| 2 Jun 2026 | Bergen / Liberty Energy (LPI) | US AI data centres | >500 | 45 x B36:45V20AG1 at 11.2 MWe | 11.2 | Island or grid-parallel baseload; Piller SHIELDX flywheel | deliveries from H2 2027 | [Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/) |
| 3 Jun 2026 | Bergen | Crusoe, multiple US sites | ~438 firm + 310 LOI ≈ 750 | 27 x B36:45V20AG2 (12.5 MWe) + 20 x B36:45L9AG (5 MWe) | mixed | Continuous baseload | phased through 2027 | [Crusoe](https://crusoe.ai/resources/newsroom/bergen-engines-signs-approx-750mw-u-s-power-agreement-with-crusoe-for-ai-data-centers) |
| 29 Jun 2026 | Wärtsilä / Liberty Energy | US | n/s (EUR 292 m) | 34SG | n/a | n/s | delivery 2029-2030 | [Wärtsilä](https://wartsila.com/media/news/29-06-2026-wartsila-secures-new-order-to-power-next-wave-of-ai-driven-data-center-growth-in-the-u-s--3767555) |
| 29 Jul 2026 | Everllence | US hyperscale, off-grid | 480 | 24 x 18V51/60G | 20 | Off-grid baseload | two phases from mid-2026 | [Everllence](https://www.everllence.com/company/press-releases/details/2026/07/29/everllence-to-supply-480-mw-for-off-grid-data-center-in-the-u.s) |
| Q3 2026 | Wärtsilä | US data centre (major IPP per secondary source) | 282 | 15 x 50SG | 18.8 | Onsite power | delivery 2028; full operation 2029 (secondary) | [Wärtsilä Q3 interim](https://www.wartsila.com/usa/media/news/27-10-2026-wartsila-s-interim-report-january-september-2026-3806530) |
| 2026 (analyst) | INNIO Jenbacher | OpenAI, Shackelford County TX (1.4 GW IT) | n/s | >500 x J624 at 4.25 MW | 4.25 | Prime | "imminent" | [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the) |
| 2026 (analyst) | ERock | Anthropic; Meta | 300-500 each | 0.5 MW gensets | 0.5 (≈2 per MW) | n/s | n/s | [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the) |
| 2026 (analyst) | not stated | Nexus Hubbard campus (Energy Transfer gas 150 MMcf/d) | ~750 ordered; air permit for 5,230 MW | recips | n/a | n/a | n/a | [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the) |

- Wärtsilä cumulative US data centre sales: >1.6 GW after its fourth order (16 Apr 2026) and >2.4 GW after its fifth (23 Apr 2026). — [Wärtsilä 412 MW](https://www.wartsila.com/media/news/16-04-2026-wartsila-s-34sg-engine-makes-its-data-center-debut-with-new-412-mw-u-s-project-3740972); [Wärtsilä 790 MW](https://www.wartsila.com/media/news/23-04-2026-wartsila-continues-to-expand-its-data-center-footprint-with-new-790-mw-order-in-texas-the-next-data-center-alley-3744599)

**European examples**
- **Pure DC, Dublin (Wärtsilä / AVK):** site total 110 MW on completion. Primary power 60 MW (30 + 30 MW from energy centres EC1 and EC2), each with 3 x Wärtsilä 34DF dual-fuel gensets, plus 20 MW BESS. Engines run baseload as primary power. Fully independent of the national grid, with HVO as a gas-supply-disruption fallback. Delivery 2026; hydrogen-blend and CHP ready. — [Wärtsilä reference](https://www.wartsila.com/energy/learn-more/references/other-industrial/pure-dc-and-avk-ireland)
- **Winthrop Technologies, Dublin (announced 24 Nov 2022):** 60 MW continuous from 22 containerised Jenbacher Type 6 engines, about 2.7 MW each (derived). Role: emergency backup, grid support at peak and island mode. Completion was expected Q3 2023. — [POWER (INNIO PR)](https://powermag.com/press-releases/innios-jenbacher-engines-to-power-60-mw-hyperscale-data-center-power-plant-in-ireland)
- **KMW / Green Mountain "Green Rocks" data centre (Mainz, Germany):** 12 Jenbacher modular energy systems for backup during grid failure and for peaking. INNIO claims up to 95% lower NOx than diesel gensets. — [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/)

**Redundancy and overbuild**
- Enverus: overbuild factors as low as 1.1x for reciprocating engines and fuel cells, versus ~1.5x for large-frame plants (Aug 2026). — [Enverus](https://www.enverus.com/newsroom/behind-the-meter-generation-forecast-skipping-the-queue/)
- SemiAnalysis: some projects plan for only 2-3 "nines" in full island mode, and designs are trending toward lower redundancy. Onsite supply must be overbuilt to match the ~99.93% average US grid availability. — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)

### Inferences
- **Units per 100 MW net at N** (derived from 50 Hz ratings, before redundancy):

| Model | Units at N per 100 MW |
|---|---|
| Wärtsilä 50SG | 6 |
| Everllence 18V51/60G | 5 |
| Wärtsilä 31SG | 9 |
| Bergen B36:45V20 | 8-9 |
| J920 | 10 |
| Wärtsilä 20V34SG | 11 |
| Kawasaki KG-18 | 13 |
| J624 / CG260-16 | 23 |
| J620 | 30 |
| Cat G3520 FR / mtu 20V4000 | 39-40 |
| MWM TCG 3020 V20 | 44 |
| Cummins HSK78G (~2 MW) | ~50 |
| ERock 0.5 MW | 200 |

- **Redundancy overhead scales with unit size** (Inference). At 100 MW, N+1 with 18.4 MW 50SGs means 7 units ≈ 129 MW installed (~29% over load). N+2 with 4.5 MW J624s means 25 units ≈ 113 MW (~13% over load). Small units cost less in redundancy but need many more units, alternators, controls and maintenance events. This is the main trade-off for a European campus sizing tool.
- **Maintenance rotation.** With ~20,000 h top-end and 60,000-84,000 h major overhauls at ~8,000 h/yr, island prime plants will nearly always have one unit in maintenance. That points to at least N+1 for maintenance plus one for forced outage, i.e. N+2, for continuous prime duty (engineering judgement; no source states the redundancy used in these orders).
- **Generation-to-IT ratio.** OpenAI Shackelford's >500 x 4.25 MW ≈ ≥2.1 GW of engines for 1.4 GW IT implies ≥1.5 MW engines per MW IT. That covers PUE (cooling load) plus redundancy. Enverus's 1.1x "overbuild" is presumably measured against facility load, not IT load. The two figures are not directly comparable.
- **Discrepancies to flag:**
  - Wärtsilä's 412 MW / 40 x 34SG = 10.3 MW/unit exceeds the 20V34SG datasheet (9.8 MW at 50 Hz, 9.39 MW at 60 Hz). The headline MW may include other equipment, or use a site/power-optimised rating.
  - VoltaGrid's 1.5 GW / 300 engines = 5 MW/engine exceeds the J624's 4.5 MW rating. Possible explanations are uprated QPac versions or counting of other plant.
  - Baxtel's 864 x G3516 for the 2 GW Monarch implies ~2.3 MW/unit, which is high for a G3516. Treat the counts as approximate.
- Two Wärtsilä orders of 282 MW / 15 x 50SG exist. One is from July 2025 (secondary source). The other is in the Q3 2026 primary interim report. The arithmetic of the cumulative >1.6 GW and >2.4 GW totals (282 + 507 + 429 + 412 = 1,630; + 790 = 2,420) supports the July 2025 order being real and distinct.

### Gaps
- No order discloses its redundancy scheme (N+1/N+2), spinning-reserve policy or availability target.
- No public European data centre gas-engine plant above ~60-110 MW was found. Continental European examples beyond Dublin and Mainz were not found within the search budget.
- Unit counts for Joule, Hunt and Nscale/AIP (Cat) are not officially published.

## 4. Can gas engines meet data centre step-load / block-load needs? Load acceptance and the role of BESS

### Takeaway
Purpose-built fast-response high-speed gas gensets can now meet standby-type requirements:
- Cat G3520 Fast Response: 10 s from cold, ISO 8528-5 G2, recovers from a 100% block load.
- Cat G3516 Fast Response: ~7 s.
- mtu 20V4000: 45 s.

Large lean-burn and medium-speed engines are much less tolerant of instantaneous steps. Island AI campuses therefore pair engines with BESS (Pure DC 20 MW per 60 MW; Joule 1.1 GWh; a Liberty CFO reports BESS power ≈ 50% of gas capacity on average) or flywheels (Piller SHIELDX with Bergen). The exception is VoltaGrid/INNIO, which claims J624 packs handle AI transients with no batteries. Evidence on step capability is mostly vendor claims with conflicts of interest.

### Cited Findings
- **Cat G3520 Fast Response (50 Hz, 2.6 MW):** "10 seconds from cold start" to full load, ISO 8528-5 G2, can recover from a "100% block load". Targeted at emergency standby and demand response, including data centres (Aug 2024). — [Cat](https://www.cat.com/en_AU/news/engine-press-releases/cat-g3520-fast-response-natural-gas-generator-set-enabling-lower-greenhouse-gas-emissions.html)
- **Cat G3516 fast-response gensets:** ramp from zero to full load in about seven seconds. — [Heavy Equipment](https://www.heavyquipmag.com/2026/07/29/caterpillar-is-finding-its-next-growth-engine-inside-the-ai-power-crunch/); [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/)
- **mtu 20V4000 gas:** 45 s to full output (60 Hz, from 2026), against 120 s for existing mtu gas gensets. — [Rolls-Royce](https://www.rolls-royce.com/media/press-releases/2025/02-10-2025-rr-introduces-fast-start-mtu-gas-gensets-for-powering-data-centers.aspx)
- **Medium-speed starts:**
  - Wärtsilä SG: grid sync 30 s, full load <2 min (fast) or <5 min (regular), ramp >100%/min hot. — [Wärtsilä 50SG](https://www.wartsila.com/energy/solutions/engine-power-plants/wartsila-50sg-gas-engine)
  - J920: ~2 min. — [Jenbacher Type 9](https://www.jenbacher.com:443/en/gas-engines/type-9)
  - MAN/Everllence 35/44G: 90 s. — [Everllence](https://man-es.com/energy-storage/products/gas-fuel-engines/1000)
  - Everllence 51/60G: <5 min. — [Everllence](https://www.everllence.com/company/press-releases/details/2026/07/29/everllence-to-supply-480-mw-for-off-grid-data-center-in-the-u.s)
  - Kawasaki: 10 min (5 min option). — [Kawasaki](https://global.kawasaki.com/en/energy/equipment/gas_engines/line_up.html)
- **Piller (flywheel vendor; undated, c. Nov 2025):**
  - A modern medium-speed gas engine at ~90% load can tolerate an instantaneous step of only about 1% of rated load before frequency dips past acceptable limits.
  - AI loads step between 80%, 50% and 90%, i.e. tens of MW on a 100 MW+ plant.
  - A 1:1 SHIELDX-to-genset ratio covers 25-30% steps; higher ratios cover up to 100%.
  - Piller criticises BESS for C-rate limits, degradation and poor short-circuit support.
  - Note: commercial bias, and it conflicts with Cat's block-load claims for high-speed units. — [Piller](https://www.piller.com/wp-content/uploads/2025/11/Lets-talk-behind-the-meter-island-power-for-AI-data-centers.pdf)
- **Bergen/Liberty:** the Piller SHIELDX flywheel absorbs sub-second AI load steps of up to 30%, so that "no oversized generation capacity" is needed (company claims). — [Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/)
- **INNIO/VoltaGrid:** the 2.3 GW platform keeps full power and efficiency up to 50°C, has "superior" transient performance for volatile load swings and "zero battery reliance" (company claims, Oct 2025). — [INNIO PR](https://www.innio.com/wp-content/uploads/2025/10/PR_INNIO-Secures-Largest-Order-in-Company-History-.pdf). The Feb 2026 order repeats that the solution "eliminates the need for batteries". — [INNIO](https://www.innio.com/en/news-media/press-releases/innio-secures-additional-major-order-from-voltagrid-1-5-gw-for-behind-the-meter-power-generation/)
- **Siemens Energy (sponsored content, c. Nov 2025):**
  - AI demand swings can reach 100 MW or more, several times per minute, on sub-second timescales.
  - Reciprocating engines are "designed for relatively stable baseload operation".
  - Grid-forming BESS acts as virtual spinning reserve. — [P&GJ / Siemens Energy](https://pgjonline.com/news/2025/november/load-smoothing-in-ai-data-centers-the-case-for-batteries-and-integrated-electrical-system-design)
- **BESS sizing data points:**
  - Pure DC Dublin: 20 MW BESS with 60 MW of engines. — [Wärtsilä](https://www.wartsila.com/energy/learn-more/references/other-industrial/pure-dc-and-avk-ireland)
  - Joule Utah: 1.1 GWh grid-forming BESS with up to 4 GW of G3520K. — [Power Progress](https://www.powerprogress.com/power-generation/news/joule-taps-caterpillar-and-wheeler-for-4-gw-data-center-in-utah/8082992.article)
  - Liberty Energy CFO (23 Jul 2026): battery power capacity averages 50% of gas capacity across its data centre clients (engine type not specified). — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)
- Engines and turbines deliver five to ten times rated current into a fault, which is an advantage over inverter-based sources for protection (analyst). — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)
- Wärtsilä promotes engine + storage packages for AI load smoothing (DCD Connect New York tech showcase, title only; not fetched). — [DCD](https://www.datacenterdynamics.com/en/dcdconnect-live/new-york/2026/dcdtech-showcase-w%C3%A4rtsil%C3%A4/)

### Inferences
- **Two design philosophies:**
  - Many small, fast high-speed units (J624/J620, G3516/G3520) running part-loaded, so that spinning headroom absorbs steps.
  - Fewer, efficient medium-speed units (50SG, 51/60G, B36:45) paired with BESS or flywheels to absorb sub-second AI swings.

  A sizing tool should model a BESS/flywheel power rating of roughly 30-50% of engine capacity for island AI loads. That figure comes from the Pure DC ratio (33%) and the Liberty average (50%).
- **Backup duty in Europe** (Tier III/IV, e.g. 10-15 s to accept load): only the dedicated fast-response gas gensets (Cat G3520/G3516 FR, possibly mtu 45 s plus UPS) come close to diesel standby performance. Medium-speed units need UPS/BESS ride-through of minutes, not seconds.
- Piller's "~1% step at 90% load" claim should be treated as a worst-case vendor figure. OEM ISO 8528-5 step tables for each model are needed before design.

### Gaps
- I could not retrieve OEM ISO 8528-5 load-step tables (first/second/third step %, frequency dip, recovery time) for any large gas engine except the Cat G3520 FR's G2 class and 100% block-load claim.
- No independent test data on gas-engine response to real AI-training load profiles.
- I found no OEM statement of the maximum MW/s ramp a plant can follow without storage, beyond Wärtsilä's >100%/min hot ramp.

## 5. Lead times in 2026, change since 2022, capacity expansions and backlogs

### Takeaway
Order-to-delivery lead times for large gas engines lengthened sharply through 2025-2026. Wärtsilä orders booked in mid-2025 were for late-2026/2027 delivery. Orders booked in Q2 2026 are for 2028 delivery, and the June 2026 Liberty order is for 2029-2030 delivery. Wärtsilä says its engine lead times "continue to increase" (Oct 2026), and Caterpillar is taking large recip orders for delivery as far out as 2029. Enverus still puts recips at ~18-24 months to commercial operation, against up to 80 months for large-frame CCGT. Caterpillar claims it can "begin generation in under a year" from order for some packages. All major OEMs announced capacity expansions, but most new capacity arrives 2027-2030.

### Cited Findings
- **Wärtsilä Q3 2026 (27 Oct 2026), CEO:** "Considering the strong Energy order intake, lead times for our engines continue to increase". Delivery times kept rising and push revenue recognition later. Group order book EUR 9,876 m (+22%); Q3 equipment order intake EUR 1,418 m (+53%). — [Wärtsilä interim report](https://www.wartsila.com/usa/media/news/27-10-2026-wartsila-s-interim-report-january-september-2026-3806530); [Wärtsilä IR blog](https://www.wartsila.com/investors/blog/post/key-messages-and-q-a-on-interim-report-for-january-september-2026)
- Wärtsilä says customers value engines over gas turbines for efficiency, very low water use, no thermal or altitude derating, and modularity. — [Wärtsilä IR blog](https://www.wartsila.com/investors/blog/post/key-messages-and-q-a-on-interim-report-for-january-september-2026)
- **Wärtsilä capacity:** EUR 140 m (~$165 m) investment to raise production capacity by 35% at Vaasa, Finland; new capacity expected Q1 2028. — [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/)
- **Order-to-delivery examples:**
  - Wärtsilä 790 MW (ordered Apr 2026): equipment 2028, full operation late 2029. — [Wärtsilä](https://www.wartsila.com/media/news/23-04-2026-wartsila-continues-to-expand-its-data-center-footprint-with-new-790-mw-order-in-texas-the-next-data-center-alley-3744599)
  - Wärtsilä 412 MW (Apr 2026): COD early 2028. — [Wärtsilä](https://www.wartsila.com/media/news/16-04-2026-wartsila-s-34sg-engine-makes-its-data-center-debut-with-new-412-mw-u-s-project-3740972)
  - Wärtsilä/Liberty (Jun 2026): delivery 2029-2030. — [Wärtsilä](https://wartsila.com/media/news/29-06-2026-wartsila-secures-new-order-to-power-next-wave-of-ai-driven-data-center-growth-in-the-u-s--3767555)
  - INNIO/VoltaGrid 1.5 GW (Feb 2026): delivery by 2028. — [INNIO](https://www.innio.com/en/news-media/press-releases/innio-secures-additional-major-order-from-voltagrid-1-5-gw-for-behind-the-meter-power-generation/)
  - Bergen/Liberty (Jun 2026): deliveries from H2 2027. — [Capacity](https://capacityglobal.com/news/bergen-engines-secures-500mw-of-orders-from-liberty-energy-to-advance-power-services-for-ai-data-centres/)
  - Bergen/Crusoe (Jun 2026): phased through 2027. — [Crusoe](https://crusoe.ai/resources/newsroom/bergen-engines-signs-approx-750mw-u-s-power-agreement-with-crusoe-for-ai-data-centers)
  - Everllence 480 MW (announced Jul 2026): deliveries from mid-2026, implying the slot was reserved before the announcement. — [Everllence](https://www.everllence.com/company/press-releases/details/2026/07/29/everllence-to-supply-480-mw-for-off-grid-data-center-in-the-u.s)
  - Wärtsilä 282 MW (Jul 2025, secondary): delivery late 2026-2027. — [jaredwatkins](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/wartsila-btm/)
- **Caterpillar:**
  - Large recip orders taken for delivery as far out as 2029; turbines into 2030.
  - Target is nearly 3x 2024 large-recip capacity by 2030 (turbines 2.5x).
  - Winston-Salem, NC becomes a second 3600-series assembly/test site.
  - MaK 10 MW gas engine restart: first units Q4 2026.
  - Power generation sales +30% to $3.421 bn in Q3 2026; total backlog a record $78 bn at end-September 2026 (Q3 2026 earnings, 29 Oct 2026). — [Baxtel](https://baxtel.com/news/caterpillar-ramps-engine-and-turbine-output-as-data-center-orders-reach-2029)
- Caterpillar says it can "begin generation in under a year from the initial order" for natural gas gensets (company claim, Jul 2026). — [Heavy Equipment](https://www.heavyquipmag.com/2026/07/29/caterpillar-is-finding-its-next-growth-engine-inside-the-ai-power-crunch/)
- Caterpillar Q1 2026: Power Generation sales +41% to $2.817 bn, driven by large recips, turbines and services "primarily for data center applications". — [Heavy Equipment](https://www.heavyquipmag.com/2026/07/29/caterpillar-is-finding-its-next-growth-engine-inside-the-ai-power-crunch/)
- **INNIO:**
  - >$300 m investment at Waukesha, Wisconsin (engine assembly plus an 80,000+ sq ft test facility to relieve validation bottlenecks; 24 Aug 2026).
  - New ~69,000 sq ft component facility at Hall in Tirol, Austria.
  - US JV with Gföllner Group for containerised Jenbacher modules, with annual capacity expected to exceed 1 GW by 2028. — [Manufacturing Today](https://manufacturing-today.com/news/innio-adds-testing-and-assembly-capacity-in-wisconsin-as-us-power-demand-climbs/)
- **INNIO/Rehlko** multi-year supply framework of 1.25 GW over three years, expanding a 700 MW reservation. Rehlko's CEO says securing multi-year supply "enhances visibility and confidence in delivery" (Apr 2026). — [Power Engineering](https://www.power-eng.com/gas/data-center-power-crunch-lifts-engines-aeroderivatives-into-larger-role/)
- **Enverus (11 Aug 2026):** reciprocating engines, small/medium-frame turbines and fuel cells "reach commercial operation in approximately 18-24 months". Large-frame combined cycle takes up to 80 months. — [Enverus](https://www.enverus.com/newsroom/behind-the-meter-generation-forecast-skipping-the-queue/)
- **Turbines for comparison:** sold out with first slots past 2030. A released slot trades at a 16% premium (46% all-in), per SemiAnalysis (Sep 2026). — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)
- **Earlier baseline (2022):** the Winthrop Dublin 60 MW Jenbacher plant was announced Nov 2022 with completion expected Q3 2023, i.e. ~10 months as planned. — [POWER (INNIO PR)](https://powermag.com/press-releases/innios-jenbacher-engines-to-power-60-mw-hyperscale-data-center-power-plant-in-ireland)
- **EIA modelling assumption:** 2-year lead time for a 21 MW ICE plant (AEO2022 and AEO2023). — [EIA AEO2023](https://www.eia.gov/aeo/assumptions/pdf/elec_cost_perf.pdf)

### Inferences
- Derived order-to-equipment-delivery spans:
  - Mid-2025 medium-speed orders: ~15-24 months (secondary data).
  - Q2 2026 orders: ~20-32 months (delivery 2028).
  - Mid-2026 large blocks: ~36-48 months (Wärtsilä/Liberty, 2029-2030).
  - Bergen (12-18 months) and high-speed packaged units (INNIO/Cat, ~12-24 months) appear shorter.
- Compared with ~10-12 months in 2022 (Winthrop), lead times have roughly doubled to quadrupled for large medium-speed blocks. Evidence for the 2022 baseline is thin (one project plus EIA's 2-year planning assumption).
- For a European campus ordering in 2027, a planning assumption of 18-30 months order-to-delivery for high-speed containerised gensets, and 24-48 months for medium-speed hall plant, seems prudent (inference). Slot reservation or framework agreements, as Rehlko did, are now a recognised way to secure delivery.
- Much of the 2025-2026 OEM capacity is being absorbed by US BTM orders. European buyers compete for the same slots, and Wärtsilä's +35% Vaasa capacity only arrives in Q1 2028.

### Gaps
- No OEM published explicit lead times in months for engines or complete gensets in 2026. All figures above are derived from order and delivery dates or come from analysts.
- No 2022-2024 time series of lead times was found. The "change since 2022" is inferred from few data points.
- Order backlogs specific to gas engines (as opposed to group- or segment-level) are not disclosed by Wärtsilä, Caterpillar or INNIO (INNIO is private).
- I did not find Rolls-Royce mtu, Everllence or Cummins capacity-expansion announcements for gas gensets within the search budget. Search results showed a Rolls-Royce/AVK five-year "guaranteed capacity" deal (Dec 2025) for emergency power, but it was not fetched and appears to be diesel-oriented.

## 6. Equipment and installed cost per kW

### Takeaway
Public $/kW data for gas-engine plants is scarce and dated. EIA's reference 21 MW ICE plant is $2,018/kW (2021$, AEO2022) rising to $2,240/kW (2022$, AEO2023) overnight installed, with FOM ~$37-40/kW-yr, VOM ~$6/MWh and heat rate 8,295 Btu/kWh (HHV). No OEM or project disclosed equipment-only $/kW in 2025-2026. Analyst LCOE-type figures put US BTM engine power at ~$107/MWh (year 5), with a floor of ~$74-84/MWh.

### Cited Findings
- **EIA AEO2023** (Mar 2023, 2022$), internal combustion engine, 21 MW: overnight cost $2,240/kW; fixed O&M $39.57/kW-yr; variable O&M $6.40/MWh; heat rate 8,295 Btu/kWh; lead time 2 years. For comparison, aeroderivative CT (105 MW) is $1,428/kW and industrial frame CT (237 MW) is $867/kW. — [EIA AEO2023](https://www.eia.gov/aeo/assumptions/pdf/elec_cost_perf.pdf)
- **EIA AEO2022** (Mar 2022, 2021$), ICE 21 MW: $2,018/kW; FOM $36.81/kW-yr; VOM $5.96/MWh; heat rate 8,295 Btu/kWh. — [EIA AEO2022](https://EIA.GOV/outlooks/aeo/assumptions/pdf/electricity.pdf)
- **RaboResearch "sustained cost of delivered energy"** (24 Jun 2026, unsubsidised, gas $3.5/MMBtu, US):
  - Reciprocating engines ≈ $107/MWh in year 5 (aeroderivatives ≈ $106); roughly $80s by year 9; reset to ~$100 around year 10 for overhauls.
  - Summary floor $74-84/MWh.
  - CCGT reaches ~$55/MWh by year 15. US industrial grid benchmark ~$86/MWh (2025). — [Rabobank](https://www.rabobank.com/knowledge/d011532274-the-marathon-can-behind-the-meter-data-center-power-solutions-endure-the-decade-in-the-us)
- **SemiAnalysis:** an islanded plant for a 1 GW IT data centre typically costs about $5 bn (technology mix not specified). Developers' yield-on-cost envelopes commonly exceed $20 m/MW including onsite power (Sep 2026). — [SemiAnalysis](https://newsletter.semianalysis.com/p/what-is-so-hard-about-behind-the)
- **Willkie Farr & Gallagher** (Nov 2025) rates natural-gas recip/turbine on-site power as "Medium" upfront capital, "Medium" lifetime maintenance and "Fast" speed to market, but gives no $/kW. — [Willkie](https://www.willkie.com/publications/2025/11/on-site-power-for-data-centers-series-commercial-considerations-and-infrastructure-costs)
- The Wärtsilä/Liberty order is worth EUR 292 m, but the MW was not disclosed, so no $/kW can be derived. — [Wärtsilä](https://wartsila.com/media/news/29-06-2026-wartsila-secures-new-order-to-power-next-wave-of-ai-driven-data-center-growth-in-the-u-s--3767555)
- INNIO estimates VoltaGrid's 2.3 GW will save more than $300 m/yr in fuel versus alternatives, with up to 10 percentage points higher efficiency (company claim). — [INNIO PR](https://www.innio.com/wp-content/uploads/2025/10/PR_INNIO-Secures-Largest-Order-in-Company-History-.pdf)

### Inferences
- SemiAnalysis's ~$5 bn per GW IT for islanded power equals ~$5,000/kW IT. Using the ≥1.5 MW engine per MW IT ratio from Q3, that is roughly ~$3,300/kW of installed generation all-in. It includes BESS, gas infrastructure, switchgear and redundancy, and the technology is unspecified. This is far above EIA's ~$2,240/kW (2022$) for a 21 MW ICE plant, consistent with 2023-2026 price inflation and the cost of island-mode balance of plant. Treat as a rough bracket only.
- For a European tool, the only sourced bracket is:
  - Lower bound ≈ EIA's $2,240/kW (2022$, US, 21 MW plant, before 2023-2026 escalation).
  - Upper bound ≈ the ~$3,300/kW-of-generation derived from SemiAnalysis (US island campus, all-in, technology unspecified).

  Any € figure for European turnkey EPC should be marked as an assumption pending vendor quotes. No 2026 European source was found.

### Gaps
- No 2025-2026 OEM, Lazard, NREL ATB or IEA $/kW figure specifically for reciprocating engines was retrieved. NREL ATB does not cover recips; Lazard's gas peaking LCOE is turbine-based.
- No equipment-only (ex-works genset) $/kW figures found for any OEM.
- No European project capex disclosures (Pure DC, Winthrop) found.
- More recent EIA AEO2025 ICE cost figures were not retrieved; only AEO2022/2023 tables were accessible.

## 7. European constraints: MCPD, IED and noise

### Takeaway
Gas engines of 1-50 MWth thermal input fall under the Medium Combustion Plant Directive. New natural-gas engines must meet 95 mg/Nm³ NOx at 15% O2 (190 for dual-fuel in gas mode); existing engines 190 mg/Nm³. Member states may exempt plants running under 500 h/yr. Plants of 50 MWth and above fall under the IED, which sets a gas-engine ELV of 75 mg/Nm³ NOx (permits after 7 Jan 2013) and CO 100 mg/Nm³, with a 500 h/yr emergency exemption. UK "specified generator" rules impose 190 mg/Nm³ and exempt backup sets tested ≤50 h/yr. A prime-power campus of tens to hundreds of MW will almost certainly be IED-scale and need SCR.

### Cited Findings
- **MCPD (1 ≤ P < 50 MWth) ELVs for gas engines,** at 15% O2, dry, 273 K/101.3 kPa:
  - Natural gas, new: NOx 95 mg/Nm³ (190 for dual-fuel engines in gas mode).
  - Natural gas, existing: NOx 190 mg/Nm³ (380 for dual-fuel in gas mode).
  - No PM or SO2 limits for natural gas.
  - New plants since 20 Dec 2018; existing >5 MWth from 1 Jan 2025; existing ≤5 MWth from 1 Jan 2030.
  - Member states may define exemptions for plants operating under 500 h/yr. — [DieselNet](https://dieselnet.com/standards/eu/stationary.php)
- **MCPD liquid-fuel engines** (relevant to diesel backup or HVO fallback): new diesel/gas-oil engines 1-50 MWth NOx 190 mg/Nm³ (225 for dual-fuel liquid mode, or for ≤20 MW engines at ≤1,200 rpm). — [DieselNet](https://dieselnet.com/standards/eu/stationary.php)
- **IED (≥50 MWth) gas engines:** NOx 100 mg/Nm³ for permits before 7 Jan 2013, 75 mg/Nm³ after; CO 100 mg/Nm³. Gas engines for emergency use under 500 h/yr are exempt. Limits are updated via the BREF process. — [DieselNet](https://dieselnet.com/standards/eu/stationary.php)
- **UK (Northern Ireland example) specified generator controls:**
  - NOx limit 190 mg/Nm³. Where secondary abatement is needed, new generators must reach compliance within 10 minutes of start (20 minutes for existing).
  - Emergency backup generators tested for ≤50 h/yr are excluded.
  - Monitoring: annual for 20-50 MW plant, every 3 years for 1-20 MW, and at least every 5 years under the limited-hours exemption. — [DAERA NI](https://www.daera-ni.gov.uk/articles/medium-combustion-plant-directive-and-specified-generators)
- An industry summary (England and Wales) gives MCPD NOx of 190 mg/Nm³ @15% O2 for 1-50 MWth. This appears to quote the existing-plant/specified-generator value, not the new-engine 95 mg value. — [Edina](https://www.edina.eu/power/cogeneration-chp/medium-combustion-plant-directive-mcpd)
- **OEM claims for diesel replacement:**
  - Jenbacher Winthrop Dublin: up to 90% less NOx and 25% less CO2 than traditional diesel gensets, "compliant with EU emission regulations". — [POWER (INNIO PR)](https://powermag.com/press-releases/innios-jenbacher-engines-to-power-60-mw-hyperscale-data-center-power-plant-in-ireland)
  - KMW Mainz: up to 95% lower NOx than diesel. — [POWER](https://www.powermag.com/engine-power-plants-surge-as-data-centers-drive-unprecedented-demand/)
- Everllence 51/60G and Jenbacher J920 are offered with SCR + oxidation catalysts as standard for these applications. — [Everllence](https://www.everllence.com/company/press-releases/details/2026/07/29/everllence-to-supply-480-mw-for-off-grid-data-center-in-the-u.s); [Jenbacher Type 9](https://www.jenbacher.com:443/en/gas-engines/type-9)

### Inferences
- **Thermal input check.** At ~45-50% electrical efficiency, 1 MWe ≈ 2.0-2.2 MWth input. A single 18-20 MWe medium-speed engine (~37-40 MWth) is MCPD-scale on its own. A plant of more than ~23-25 MWe on a common stack/site crosses 50 MWth, and in practice any tens-to-hundreds-MW data centre plant will be assessed as IED/LCP.
  - The IED aggregation rules (common stack; units under 15 MWth excluded from aggregation) were not verified in this research; check the Directive text.
- **NOx compliance by tune** (using the conversion in Q2):
  - 500 mg@5%O2 (≈188 @15%) engines meet existing-MCPD/UK 190 but not new-MCPD 95 or IED 75. They need SCR.
  - 250 mg@5%O2 (≈94 @15%) tunes just meet new-MCPD 95 but not IED 75.
  - So IED-scale prime plants will need SCR (urea/ammonia storage, catalyst footprint, ammonia slip limits), which also affects layout and footprint.
- **Backup-only plants** that stay under 500 h/yr (EU member-state exemption) or ≤50 h/yr testing (UK) can avoid the ELVs. A bridge/prime plant running 8,000 h/yr cannot. The operating regime therefore drives emissions design, and a sizing tool should switch ELVs by operating hours.
- BAT-AELs under the 2017 LCP BREF may be tighter than the IED Annex V 75 mg/Nm³. These were not retrieved; check them.

### Gaps
- LCP BREF (2017) BAT-AEL ranges for new gas engines were not retrieved.
- National transpositions (Ireland EPA, Netherlands, Germany 44. BImSchV/TA Luft, Nordics) were not retrieved. Germany's 44. BImSchV is known to be stricter, but no source was retrieved here.
- **Noise:** no OEM sound power/pressure data and no European noise limits for engine halls or containers were found within the search budget. This needs vendor data and local planning-authority limits.
- No sources found on CO, formaldehyde or methane-slip limits applicable to lean-burn gas engines in the EU, or on EU ETS applicability for >20 MWth installations (which will apply to most campus plants).
