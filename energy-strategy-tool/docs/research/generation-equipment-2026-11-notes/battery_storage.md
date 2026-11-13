# Utility-scale battery energy storage (BESS) for European data centre campuses, 2026

Scope note: research done 13 Nov 2026. Figures are from manufacturer datasheets, press releases and trade press. Where a figure is my own arithmetic (for example kWh/m² or units per MW), it is marked "derived". Where a source is secondary or an aggregator, it is marked "secondary". Older figures carry their date.

## 1. Which BESS makers and products matter in Europe, and what are their block sizes and performance?

### Takeaway
The market has moved from 3.7–4 MWh to 5–7 MWh per 20 ft-class container in 2025–26, with 9–14.5 MWh "mega" units (CATL TENER Stack, BYD Haohan) announced but not yet common in Europe. Every major product is LFP. The main products for a European campus are Tesla Megapack 2 XL / Megapack 3 / Megablock, Sungrow PowerTitan 2.0/3.0, Fluence Gridstack Pro / Smartstack, Huawei Smart String, CATL TENER, BYD MC Cube-T, Hithium ∞Power, Trina Elementa 3, Wärtsilä Quantum3 and Saft Intensium. For planning, one 2-hour container gives about 2–2.5 MW (0.4–0.5 units per MW). One 4-hour container gives about 1–1.7 MW (0.6–1.0 units per MW).

### Cited Findings

**Per-product table** (MWh and MW per enclosure; "n/s" = not stated in the source found)

| Manufacturer | Product | Chemistry | MWh per enclosure | MW per enclosure | Durations | RTE % | Cycle life / warranty | Footprint / density | Notes and source |
|---|---|---|---|---|---|---|---|---|---|
| Tesla | Megapack 2 XL | LFP (chemistry not on datasheet; see MP3 row) | 3.854 (2 h) / 3.916 (4 h) | 1.927 (2 h) / 0.979 (4 h) | 2 h, 4 h | 92.0 (2 h) / 93.7 (4 h), full cycle incl. PCS and thermal losses, 25 °C | 15 yr warranty standard, extendable to 20 yr | 8.8 × 1.65 × 2.785 m, 38.1 t; about 270 kWh/m² of container (derived) | 480 V AC output; UL 1973, UL 9540, UL 9540A, UL 1741 SB, IEC 62619, IEEE 1547; −30 to 50 °C; virtual inertia and frequency support modes — [Tesla datasheet via CT Siting Council](https://portal.ct.gov/-/media/csc/3_petitions-medialibrary/petitions_medialibrary/mediapetitionnos1601-1700/pe1607/petitionersubmissions/supplement-attachment-a---megapack_2_xl_datasheet.pdf) |
| Tesla | Megapack 3 | LFP, 2.8 L cells | 5.0 | 2.5 | up to 8 h | 92.5 | 10,000+ cycles; up to 25 yr life; up to 20 yr warranty; 100% DoD | 8.1 × 1.6 × 2.8 m, 38 t; 28% more energy than MP2 XL in same footprint; about 386 kWh/m² of container (derived) | Built in Brookshire (Houston), Texas, 50 GWh/yr plant; deliveries expected toward end-2026; about US$1.39m per unit (secondary) — [Energy-Storage.news](https://www.energy-storage.news/under-the-hood-inside-teslas-megapack-3-as-texas-production-begins/); −40 to 60 °C, 78% fewer connections — [RenewEconomy](https://reneweconomy.com.au/tesla-unveils-megapack-3-and-new-megablock-says-they-will-be-40-pct-cheaper-to-build/) |
| Tesla | Megablock | LFP | 20 (4 × Megapack 3) | about 5 (4 h; derived from 20 MWh / 4 h) | 4 h | 91 at MV incl. auxiliaries | 25 yr, 10,000+ cycles | up to 248 MWh/acre (about 613 MWh/ha, derived) | Integrated MV transformer and switchgear (kV not stated); 23% faster install, 40% lower construction cost, 1 GWh in about 20 business days (Tesla claims) — [RenewEconomy](https://reneweconomy.com.au/tesla-unveils-megapack-3-and-new-megablock-says-they-will-be-40-pct-cheaper-to-build/); [Energy-Storage.news](https://www.energy-storage.news/under-the-hood-inside-teslas-megapack-3-as-texas-production-begins/) |
| Sungrow | PowerTitan 2.0 (ST5015UX) | LFP 314 Ah | 5.015 | 2.52 MVA (2 h) / 1.26 MVA (4 h) | 2 h, 4 h | n/s on US datasheet | n/s | 6.058 × 2.896 × 2.438 m (20 ft), 42–42.5 t; about 340 kWh/m² of container (derived) | AC block with 210 kVA string PCS modules; UL 9540A, NFPA 855, NFPA 68/69 (optional), UL 9540, UL 1973, UL 1741SB, IEEE 1547; −30 to 50 °C — [Sungrow datasheet](https://info-support.sungrowpower.com/application/pdf/2024/12/07/ST5015UX-2H-US_ST5015UX-4H-US%20Datasheet.pdf) |
| Sungrow | PowerTitan 3.0 (EU version) | LFP 684 Ah cells ([ESS News, Jun 2025](https://www.ess-news.com/2025/06/10/sungrow-introduces-powertitan-3-0-bess-based-on-684-ah-cell-fully-liquid-cooled-silicon-carbide-pcs)) | 7.14 (20 ft) | 1.7 | 4 h standard, up to 8 h; 12 h 30 ft version not offered in Europe because of transport limits | 92 system RTE; SiC PCS 99.3% max | n/s | 483 kWh/m² (Sungrow figure; basis not stated) | 4 containers = 7.2 MW / 28.5 MWh block; grid-forming built in (black start, GFL/GFM switching, 20 ms response); launched in Europe, Madrid, Jan 2026 — [Energy-Storage.news](https://www.energy-storage.news/sungrow-power-titan-3-ess-debuts-in-europe-at-7-2mw-28-5mwh/). Conflict: [Solar Power World (Sep 2025)](https://www.solarpowerworldonline.com/2025/09/sungrow-powertitan-3-0-bess-reaches-6-9-mwh-in-20-ft-container/) gives 6.9 MWh per 20 ft. |
| Fluence | Gridstack Pro (2000 / 5000 series) | 3XX Ah (2000) / 5XX Ah (5000) cells; chemistry not named on sheet (LFP in Fluence cubes per DCD below) | 2.436; 4.872–5.016; 5.644 (sizes not clearly matched to series) | n/s | 2, 4, 6, 8 h | >87 | n/s | Enclosures 7.537 × 1.734 m, or 20 ft; "up to 40% improved density" for 100 MW / 4 h | Grid-forming for full or part off-grid sites; UL 9540A (cell, module, unit), NFPA 855/68/69/72, UL 1741SA / IEEE 1547; −20 to 50 °C; "design estimates only" — [Fluence spec sheet](https://info.fluenceenergy.com/hubfs/Fluence%20Gridstack%20Pro_Global_US%20EN.pdf) |
| Fluence | Smartstack (7.5 MWh and 10 MWh configurations) | 3XX Ah cells | 7.5 or 10 per configuration (battery pods of about 15 t and about 20 t) | n/s (max AC current 3,762 A at 7.5 MWh, 2,508 A at 10 MWh; 690 V AC) | 2–8 h (7.5 MWh); 4, 6, 8 h (10 MWh) | n/s | 25 yr system life guaranteed; up to 99% fleet availability | about 680 MWh/acre for 10 MWh version (about 1,680 MWh/ha, derived) | 1,500 V DC; UL 9540, UL 9540A, NFPA; isolated containment zones between pods; up to 40% lower balance-of-plant cost vs standard DC blocks (Fluence claim); 10 MWh option announced Jun 2026 — [ESS News](https://www.ess-news.com/2026/06/25/fluence-expands-smartstack-platform-with-high-density-10-mwh-bess-option/) |
| Huawei | Smart String Grid-Forming ESS, LUNA2000-5015-2S (also 4472-2S, 2507-2S, 2236-1S, 2.0 MWh and 1.0 MWh air-cooled) | LFP 2 × 314 Ah | 5.015 (flagship); 4.472; 2.507; 2.236; 2.032; 1.016 | 2.51 (5015, about 2 h); 2.236 (2236-1S, about 1 h); 0.51 to 2.03 (2.0 MWh series, 4 h to 1 h) | about 1, 2, 4 h (derived from kWh/kW) | System RTE n/s; PCS 99.01% max | n/s | 20 ft (6.058 × 2.896 × 2.438 m), <43 t; about 340 kWh/m² of container for 5015 (derived) | String PCS 200–213 kW modules, grid-forming standard, plant controller 30–40 ms reactive response; UL 9540A, IEC 62619, IEC 62933-5-2, IEC 62477-1; PCS VDE 4120, EN 50549; water sprinkler plus NOVEC 1230 — [Huawei datasheet, Apr 2026](https://d1vnxmxnhoo2jv.cloudfront.net/catalogs/39f48e42-FusionSolar-Utility-Smart-String-Grid-Forming-ESS-Solution-Datasheet-20260408.pdf) |
| CATL | TENER Stack | LFP 587 Ah | 9 (two stacked 4.5 MWh units, <36 t) | n/s | n/s | n/s | cells rated up to 15,000 cycles; 20 yr design life; "zero degradation" for 5 years | CATL claims 40% better land use, 20% lower station cost | Launched May 2025 (ees Europe); stacked design raises questions on vertical venting and EU acceptance — [Battery Design](https://www.batterydesign.net/catl-unveils-9mwh-system-redefining-utility-scale-storage/). Earlier TENER is 6.25 MWh (same source). |
| BYD | Haohan | LFP Blade, 2,710 Ah cell | 14.5 | n/s | aimed at long-duration storage | n/s | n/s | "10 MWh in a 20 ft area"; cell-to-system volume ratio 52.1% | Launched Sep 2025; BYD claims 21.7% lower project cost — [Energy-Storage.news](https://www.energy-storage.news/byd-launches-14-5mwh-bess-as-energy-density-race-continues/) |
| BYD | MC Cube-T | LFP Blade, cell-to-system | 6.432 | n/s | n/s | n/s | n/s | 24.7% smaller footprint than predecessor | Launched Apr 2024 — [Gasgoo](https://autonews.gasgoo.com/articles/news/byd-launches-all-new-energy-storage-system-mc-cube-t-70032455) |
| Hithium | ∞Power 6.25 MWh 2h/4h EU version | LFP; 4 h version uses 1,175 Ah cell | 6.25 | n/s | 2 h, 4 h | n/s | service life up to 25 yr | n/s | SIL2 functional safety BMS; −30 °C operation; MoU with Basque-backed GCRPV on EU manufacturing; shown May 2025 — [Hithium press release via finanzen.net](https://www.finanzen.net/nachricht/aktien/hithium-launches-power-6-25mwh-2h-4h-bess-eu-version-and-accelerating-manufacturing-in-europe-through-partnership-with-gcrpv-14467519); Eastern Europe projects with 587 Ah and 1,175 Ah cells — [Energy-Storage.news](https://www.energy-storage.news/hithium-signs-deal-for-eastern-europe-bess-projects-featuring-587ah-1175ah-cells/) |
| Trina Storage | Elementa 3 | LFP 587 Ah (in-house) | 6.25 | n/s | n/s | n/s | n/s | site energy density +24.7% vs previous generation | Up to 2 h full-cabin fire protection; 12 GWh Elementa fleet with zero safety incidents (company claim); Dec 2025 — [Trina](https://www.trinasolar.com/en-glb/newsroom202512160637/) |
| Wärtsilä | Quantum3 | n/s (LFP assumed, not confirmed by source) | 5 (20 ft) | n/s | n/s | n/s | n/s | n/s | AC block with integrated string PCS; Quantum2 was 4 MWh per 20 ft; Sep 2024 — [Energy-Storage.news](https://www.energy-storage.news/wartsila-joins-5mwh-club-with-latest-bess-product/) |
| Saft (TotalEnergies) | Intensium Max 20 High Energy (as used at Microsoft Sweden) | n/s in source | about 2 (8 containers = 16 MWh) | 3 | about 40 min at full power (derived) | n/s | n/s | n/s | High-power data centre backup build — [DCD](https://datacenterdynamics.com/en/news/microsoft-replaces-diesels-with-battery-system-at-swedish-data-center) |
| Samsung SDI | SBB 1.7 / SBB 2.0 | NCA (SBB 1.7); LFP (SBB 2.0) | 6.14 (SBB 1.7, 20 ft) | n/s | n/s | n/s | n/s | SBB 1.7 is about 17% denser than SBB 1.5 | Direct-injection fire suppression (EDI); US production from 2026; Sep 2025 — [Samsung SDI](https://www.samsungsdi.com/sdi-now/sdi-news/4522.html). Tesvolt–Samsung 5.26 MWh container for Europe — [ESS News](https://www.ess-news.com/2025/06/04/tesvolt-samsung-announce-5-26-mwh-containerized-battery) |
| LG Energy Solution (Vertech) | JF2 AC Link (NVIDIA "DSX Ready") | LFP (LGES plans >50 GWh of North American LFP capacity by end-2026) | n/s | n/s | n/s | n/s | n/s | n/s | Qualified Sep 2026 for AI load smoothing and voltage ride-through — [Battery-Tech](https://battery-tech.net/battery-markets-news/lg-energy-solution-dsx-bess/) |
| Vertiv | EnergyCore Grid | LFP | n/s | system 1 MW to >200 MW | 1–8 h (projects from 4 MW, per CPower tie-up) | n/s | n/s | n/s | Utility-grade BESS for data centre interconnection, peak shaving and black start; North America only (Dec 2025) — [Vertiv](https://www.vertiv.com/pt-emea/about/news-and-events/corporate-news/vertiv-launches-utility-grade-energy-storage-system-to-accelerate-data-center-interconnection-and-grid-resilience-in-north-america/); [Energy-Storage.news](https://www.energy-storage.news/us-roundup-bess-developers-highlight-bring-your-own-capacity-model-in-data-centre-announcements/) |

**Market context**
- The usual BESS cell grew from about 314 Ah to 600 Ah+ within a year. 5 MWh per unit has been the floor for several years and recent products are 6–7 MWh. Eve Energy "Mr Giant" units are about 5 MWh with 628 Ah cells — [Energy-Storage.news](https://www.energy-storage.news/byd-launches-14-5mwh-bess-as-energy-density-race-continues/).
- SMM expects volume of large-format (500 Ah+) cells to slip to after Q3 2026 — [SMM](https://news.metal.com/en/newscontent/103999667-smm-analysis-riding-the-winds-in-and-outside-china-breaking-the-iron-law-of-old-cycles-2026-energy-storage-battery-cell).
- Tesla gives a site density for Megapack 2 XL of about 200 MW / 400 MWh per acre. It puts the space need at about 0.5 acre per 100 MW of data centre load with a 2 h BESS (ERCOT, May 2025) — [Tesla ERCOT LLWG](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf). This conflicts with the "up to 248 MWh/acre" quoted for Megablock — [Energy-Storage.news](https://www.energy-storage.news/under-the-hood-inside-teslas-megapack-3-as-texas-production-begins/). The basis probably differs (MV kit and spacing included or not).
- Fire and safety standards on datasheets: UL 9540 / UL 9540A (test method), NFPA 855 / 68 / 69, IEC 62619, IEC 62933-5-2 (Huawei, Sungrow, Fluence, Tesla datasheets above).
- EU Batteries Regulation applies to BESS: CE marking and Declaration of Conformity since Aug 2024; extended producer responsibility since Aug 2025; supply-chain due diligence postponed to 2027 or later (Reg. (EU) 2025/1561); battery passport mandatory for industrial batteries >2 kWh from Feb 2027; recycled-content minimums from 2031 — [Energy-Storage.news](https://www.energy-storage.news/three-years-on-how-much-has-the-eu-batteries-regulation-changed-the-bess-market/).

### Inferences
- Units per MW for a campus layout (derived from the table):
  - 2 h: Megapack 2 XL about 0.52 per MW; Megapack 3 / Huawei 5015 / PowerTitan 2.0 2 h about 0.4 per MW.
  - 4 h: Megapack 2 XL about 1.02 per MW; PowerTitan 2.0 4 h about 0.79 per MW; PowerTitan 3.0 EU about 0.59 per MW; Megablock about 0.2 Megablocks (0.8 Megapack 3) per MW.
  - For a 100 MW / 200 MWh data centre BESS this means about 40–52 containers, plus MV skids. A 4 h system needs about 60–100 containers.
- RTE figures are not on the same basis. Tesla's 92–93.7% is at the 480 V container output, Megablock's 91% is at MV including auxiliaries, and Fluence's >87% is probably at the point of interconnection. A tool should apply about 85–88% at the grid point for planning (my judgement, not a sourced figure).
- High-energy 4–8 h products (PowerTitan 3.0 at 1.7 MW per 7.14 MWh, BYD Haohan, CATL TENER Stack) suit flexible-connection load shifting. Data centre ride-through and step-load roles need high C-rate (1C–1.5C) builds such as Huawei 2236-1S, the Huawei 2.0 MWh-1H1 or Saft's 3 MW / 2 MWh containers.

### Gaps
- No datasheet found for Envision, NHOA, Schneider, ABB or Eaton utility BESS. Their block sizes and RTE are not covered.
- Wärtsilä Quantum3 MW, RTE and certifications were not found. Megablock MV voltage and power rating are not published in the sources found.
- Cycle life and warranty terms are missing for most Chinese products (only CATL cell cycles and Tesla terms found).
- No source found that gives EU-specific BESS fire rules (no harmonised EN standard identified). Local fire authority and insurer (e.g. FM Global) practice was not researched.

## 2. How is BESS used at data centres, and what real projects exist (2023–2026)?

### Takeaway
BESS at data centres now does five jobs: (1) AI load smoothing and fault ride-through; (2) step-load and stability support for islanded gas engines or turbines (Wärtsilä says islanded AI sites are "basically impossible" without it); (3) flexible or curtailable grid connections and bridging until the full grid connection; (4) UPS or diesel replacement; (5) grid-service revenue. Rules of thumb from vendors: BESS power equal to the load swing (often about 1:1 with IT load), with about 2 h energy as a starting point and about 4 h for load-shifting flexible connections. In Ireland, the CRU's Dec 2025 decision requires new data centres above 10 MVA to provide on-site or nearby dispatchable generation or storage.

### Cited Findings
**How vendors size and use it**
- Tesla (ERCOT, May 2025) lists these uses:
  - Load smoothing: cuts AI training load variability by 70%+.
  - Low-voltage ride-through: Megapack "mimics" the load about 30 ms after voltage recovery, when UPS units have tripped.
  - Flexible grid connection: about 4 h of BESS shifts peak load so a site can connect before grid upgrades.
  - Backup: cost-competitive with diesel for about 16 h of backup. This assumes a 50% US ITC and diesel capex of US$800–1,000/kW, so it is US-specific.
  — [Tesla ERCOT LLWG](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf)
- The same Tesla deck gives AI load figures: swings at 0.1–1 Hz and 5–30 Hz, with up to 90% fluctuation (100% to 10% of peak). xAI Memphis saw 10–20 MW shifts several times per second. Dominion lost 1.5 GW across 60 data centres in a July 2024 fault event — [Tesla ERCOT LLWG](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf).
- Wärtsilä's starting sizing rule is BESS power equal to the load change (a 600 MW swing needs 600 MW of BESS), with 2 h duration, then full system modelling.
  - Islanded AI data centres are "basically impossible" without BESS because engines can't follow the load.
  - Existing island systems are mostly ≤100 MW, while some data centre proposals are about 1 GW.
  - Wärtsilä announced a 790 MW off-grid Texas data centre plant with 42 × 50SG gas engines.
  — [Energy-Storage.news](https://www.energy-storage.news/wartsila-on-why-ai-data-centres-need-bess-to-smooth-demand-and-avoid-destroying-the-grid/)
- Grid-forming products named for data centres or islanded sites:
  - Fluence Gridstack Pro: "grid forming capabilities" for full or partial off-grid sites — [Fluence](https://info.fluenceenergy.com/hubfs/Fluence%20Gridstack%20Pro_Global_US%20EN.pdf).
  - Sungrow PowerTitan 3.0: grid-forming, GW-scale black start, 20 ms response — [Energy-Storage.news](https://www.energy-storage.news/sungrow-power-titan-3-ess-debuts-in-europe-at-7-2mw-28-5mwh/).
  - Huawei: grid forming standard; GW-scale black start shown at 400 MW PV + 1.3 GWh in Saudi Arabia — [Huawei datasheet](https://d1vnxmxnhoo2jv.cloudfront.net/catalogs/39f48e42-FusionSolar-Utility-Smart-String-Grid-Forming-ESS-Solution-Datasheet-20260408.pdf).
- Data centre-specific products:
  - LG Energy Solution has an NVIDIA "DSX Ready" BESS for AI load smoothing and voltage ride-through (Sep 2026) — [Battery-Tech](https://battery-tech.net/battery-markets-news/lg-energy-solution-dsx-bess/).
  - Shoals and ON.energy pair a medium-voltage "AI UPS" with a BESS recombiner (Feb 2026) — [BeBeez / DCD opinion](https://bebeez.eu/2026/06/20/bess-is-becoming-the-bridge-between-ai-data-centers-and-the-grid).
  - Vertiv EnergyCore Grid (Dec 2025, North America) — [Vertiv](https://www.vertiv.com/pt-emea/about/news-and-events/corporate-news/vertiv-launches-utility-grade-energy-storage-system-to-accelerate-data-center-interconnection-and-grid-resilience-in-north-america/).
  - Samsung SDI U8A1 LMO UPS cells "optimised for AI data centres" — [Samsung SDI](https://www.samsungsdi.com/sdi-now/sdi-news/4522.html).

**Regulatory drivers (Europe)**
- Ireland: the CRU final Large Energy User connection policy was published around 15 Dec 2025.
  - Data centres above 10 MVA must provide new on-site or nearby dispatchable generation or storage. It must be separately connected and metered and take part in the SEM.
  - Sites of 1–10 MVA must act as autoproducers sized to 100% of MIC on a de-rated basis.
  - Compliant sites are exempt from mandatory demand curtailment.
  - 80% of annual demand must be matched by new Irish renewables within 6 years.
  - System operators had to publish the connection process by 31 Mar 2026.
  — [William Fry](https://www.williamfry.com/knowledge/cru-publishes-long-awaited-final-policy-on-data-centre-connections/). EirGrid's process document is v3, May 2026 — [EirGrid](https://cms.eirgrid.ie/sites/default/files/publications/Data-Centre-Connection-Offer-Process-and-Policy-V3-May-2026.pdf) (not read in full).
- Germany: grid-forming inverters are needed to earn inertia procurement revenue (€8–20k/MW/yr). Connection terms can include import/export caps and ramp limits — [Modo Energy, Mar 2026](https://modoenergy.com/research/en/germany-battery-investment-outlook-q2-2026-executive-summary).

**Real data centre BESS projects**

| Project | Location | Size | Supplier | Role | Date | Source |
|---|---|---|---|---|---|---|
| xAI Colossus 2 | Memphis, US | 720 Megapacks counted in Jul 2026 satellite images. Canary estimates about 2.8 GWh and 720–1,400 MW; xAI told TVA 3.3 GWh; MLGW cites about 2,000 MW behind the meter | Tesla (xAI bought US$430m of Megapacks in 2025 and US$405m in H1 2026) | Lets the site "come off the grid for four hours" (power interruption programme, a condition of connection); likely load smoothing (not confirmed); 69 mobile gas generators also on site | Article 11 Sep 2026 | [Canary Media](https://www.canarymedia.com/articles/batteries/xai-massive-battery-memphis-data-center) |
| xAI Colossus 1 | Memphis, US | about 250 MW, 200k GPU cluster (Megapack size not given) | Tesla | AI load smoothing, demand response | 2025 | [Tesla ERCOT LLWG](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf); 168 Megapacks reported (secondary, size not verified) — [DCD Brasil](https://www.datacenterdynamics.com/br/not%C3%ADcias/xai-implementa-168-megapacks-tesla-para-alimentar-seu-supercomputador-colossus-em-memphis-nos-eua/) |
| Tesla Gigafactory Texas data centre | Austin, US | 130 MW data centre load with 130 MW / 260 MWh behind-the-meter Megapack; plus 125 MW / 250 MWh front-of-meter | Tesla | Backup plus ERCOT participation | 2025 | [Tesla ERCOT LLWG](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf) |
| Microsoft data centre | Sweden (exact site not given) | 24 MW / 16 MWh (8 × 3 MW containers) | Saft Intensium Max 20 High Energy | Replaces diesel backup (up to 80 min), grid stability, black start; 16-month deployment | Delivered June (year not stated in article; about 2025) | [DCD](https://datacenterdynamics.com/en/news/microsoft-replaces-diesels-with-battery-system-at-swedish-data-center) |
| Microsoft Dublin | Ireland | MW/MWh not disclosed | Enel X (BESS), Eaton (UPS) | Li-ion grid-interactive UPS replacing lead-acid; EirGrid DS3 frequency response; Microsoft wants to repeat this worldwide | about 2022–23 | [Energy-Storage.news](https://www.energy-storage.news/microsoft-wants-to-replicate-proven-data-centre-battery-storage-project-worldwide) |
| Google St-Ghislain | Belgium | 2.75 MW / 5.5 MWh | Fluence (CATL LFP); Centrica runs it in a VPP | Replaces 1–2 diesel generators; Elia frequency services | announced Jan 2021, about 2022 | [DCD](https://www.datacenterdynamics.com/en/news/google-picks-fluence-for-275mw-grid-supporting-battery-system-in-belgium) |
| Pure DC / AVK microgrid | Dublin, Ireland | 110 MW microgrid; BESS size not stated | AVK (generation) | BESS handles load swings and response time; microgrid supplies power until the phased grid connection is complete | Mar 2026 | [W.Media](https://w.media/pure-dc-launches-large-scale-on-site-data-center-microgrid-in-dublin/) |
| Project Jupiter (secondary) | Germany | 500 MW / 2,000 MWh BESS with co-located AI data centre and 150 MW solar | n/s | Data centre supply plus grid services | 2025 | [EnkiAI aggregator](https://enkiai.com/data-center/top-10-bess-backed-data-center-projects-in-europe-in-2025/) |
| Eurowind / Edora (secondary) | Jutland, Denmark | 10.8 MW / 43.2 MWh with 2–10 MW data centre | n/s | Backup plus balancing | 2025, in development | [EnkiAI](https://enkiai.com/data-center/top-10-bess-backed-data-center-projects-in-europe-in-2025/) |
| Solaria Spinazzola (secondary) | Italy | 400 MW data centre, 140 MW BESS, 600 MW PV | n/s | "Energy island" | 2025 | [EnkiAI](https://enkiai.com/data-center/top-10-bess-backed-data-center-projects-in-europe-in-2025/) |
| Scandinavian Data Centers | Eskilstuna, Sweden | n/s | n/s | Resilience at underground data centre | Feb 2025 | [BeBeez](https://bebeez.eu/en/news/scandinavian-data-centers-launches-battery-storage-system-at-underground-data-center-site-in-sweden/) |
| Eos / Turbine-X | US | up to 2 GWh of Eos zinc BESS with behind-the-meter gas | Eos | "Bring your own capacity" for AI data centres | first deployments 2027 | [Energy-Storage.news](https://www.energy-storage.news/us-roundup-bess-developers-highlight-bring-your-own-capacity-model-in-data-centre-announcements/) |

### Inferences
- Tesla's own data centre is the cleanest public sizing reference: BESS MW about equal to data centre MW at 2 h, matching Wärtsilä's "power equal to load swing, 2 h". Sizing for diesel replacement is smaller in energy: Microsoft Sweden has 16 MWh for 24 MW, about 40 min at full power.
- For an islanded or bridging campus on gas engines or turbines, BESS power should cover at least the largest step load plus the largest single generator trip. It should also be grid-forming. This is my engineering inference from the Wärtsilä and Tesla statements, not a sourced rule.
- Ireland's CRU rule makes on-site storage or generation a connection condition for any new large data centre. Some storage capacity is likely to be sized to MIC on a de-rated basis, but the de-rating factors for batteries were not found.

### Gaps
- No MW/MWh found for Equinix, Microsoft Dublin, Pure DC or Scandinavian Data Centers BESS.
- No confirmed UK or Netherlands flexible (non-firm) connection offer that names a BESS size for a data centre was found. The UK REA "Data Centre Flex 101" (Jun 2026) was not read.
- Battery de-rating factors under the Irish LEU policy (needed to size to "100% MIC de-rated") were not found.
- Schneider, ABB and Eaton grid-interactive UPS product data (kW per cabinet, minutes of runtime) were not gathered.

## 3. What are delivery and lead times, supply conditions and trade effects in 2026?

### Takeaway
Battery containers take about 18 months from order to site (Wärtsilä, 2026). That is shorter than large transformers and gas generators, so BESS is often added late. Once on site, AC-block products commission very fast (1 GWh in about 12–20 working days, by vendor claims). Supply tightened through 2026: 314 Ah LFP cells were short, prices rose about 14% in H1, tier-1 order books ran into 2027 and Tesla reported a record backlog. Trade risk in Europe comes mainly from the May 2026 EU ban on funding projects that use Chinese inverters/PCS, plus the EU Batteries Regulation passport from Feb 2027. In the US, FEOC rules and tariffs are pushing costs up.

### Cited Findings
- Wärtsilä: batteries have lead times of about 18 months, against years for transformers and gas generators, so developers often secure generation first and add batteries later — [Energy-Storage.news](https://www.energy-storage.news/wartsila-on-why-ai-data-centres-need-bess-to-smooth-demand-and-avoid-destroying-the-grid/) (article undated; context suggests late 2026).
- Commissioning speed (vendor claims): Tesla Megablock 1 GWh in about 20 business days — [RenewEconomy](https://reneweconomy.com.au/tesla-unveils-megapack-3-and-new-megablock-says-they-will-be-40-pct-cheaper-to-build/). Sungrow PowerTitan up to 1 GWh in 12 days, based on the Bramley project; units self-configure within 1 hour — [Energy-Storage.news](https://www.energy-storage.news/sungrow-power-titan-3-ess-debuts-in-europe-at-7-2mw-28-5mwh/).
- Microsoft Sweden 24 MW / 16 MWh Saft BESS took 16 months to deploy — [DCD](https://datacenterdynamics.com/en/news/microsoft-replaces-diesels-with-battery-system-at-swedish-data-center).
- Tesla:
  - Megapack 3 entered production in early Aug 2026 — [Canary Media](https://www.canarymedia.com/articles/batteries/xai-massive-battery-memphis-data-center). Deliveries are expected toward end-2026 from the 50 GWh/yr Houston plant — [Energy-Storage.news](https://www.energy-storage.news/under-the-hood-inside-teslas-megapack-3-as-texas-production-begins/).
  - Q3 2026 storage deployments were 13.7 GWh (vs 12.5 GWh in Q3 2025), with the "highest-ever order rate and backlog" (no figure disclosed) — [The EV Report](https://theevreport.com/tesla-q3-2026-results-energy-storage-semi) (secondary).
  - Reports say 2027 Megapack capacity is sold out — [Basenor](https://www.basenor.com/blogs/news/tesla-energy-eyes-10gw-year-as-2027-megapack-capacity-sells-out) (secondary blog, not verified).
- Cell market, H1 2026 (SMM):
  - 314 Ah cell price rose from about 0.32 to about 0.365 RMB/Wh.
  - Lithium carbonate rose from 120k to 180k RMB/t.
  - Industry inventory was about 28 GWh (about 0.36 months).
  - Most tier-1 and tier-2 order books extend beyond Q3 2026, some into 2027; a structural 314 Ah shortage.
  - China cut the export VAT rebate in April 2026, with full cancellation expected at year-end or next year (timing unclear). A Q4 2026 export rush may push prices to an annual peak, with relief expected in 2027.
  - 2026 forecast: 1,033 GWh of ESS cell production against 946 GWh of demand.
  — [SMM](https://news.metal.com/en/newscontent/103999667-smm-analysis-riding-the-winds-in-and-outside-china-breaking-the-iron-law-of-old-cycles-2026-energy-storage-battery-cell)
- Late 2025: small-format 100 Ah cells were already sold out into 2026 — [ESS News, Oct 2025](https://www.ess-news.com/2025/10/29/battery-shortage-intensifies-as-100-ah-cells-sell-out-into-2026/).
- Older reference point (US, about Sep 2023): large transformers 32–36 months, HV breakers 14–18 months, MV switchgear 12–18 months — [Energy-Storage.news](https://www.energy-storage.news/lithium-supply-chain-much-improved-but-transformers-and-other-components-a-headache-for-bess-industry) (dated; for MV/HV balance-of-plant only).
- EU funding ban (from 1 May 2026):
  - EIB and EIF funding is restricted for solar, wind and storage projects that use inverters from "high-risk" countries (China, Russia, Iran, North Korea), including companies they own or control. BESS PCS are explicitly included, with no exemption by power class.
  - Projects approvable by 1 Nov 2026 are grandfathered.
  - Non-EU-grid projects must phase these inverters out by 15 Apr 2027.
  - Whether the ban reaches privately funded projects is not stated.
  — [ESS News](https://www.ess-news.com/2026/05/04/eu-funding-ban-on-high-risk-inverters-including-chinese-suppliers-extends-to-bess-pcs/)
- EU Batteries Regulation: battery passport mandatory from Feb 2027 for industrial batteries >2 kWh; due diligence postponed to 2027 or later. The regulation "does not currently appear to be favouring European manufacturers", but it sorts suppliers by their traceability capability — [Energy-Storage.news](https://www.energy-storage.news/three-years-on-how-much-has-the-eu-batteries-regulation-changed-the-bess-market/).
- US: FEOC limits on Chinese cells and tariffs are pushing storage costs up, with supply chains rerouted through Southeast Asia — [ESS News on Lazard 2026](https://www.ess-news.com/2026/07/13/battery-storage-costs-up-27-since-2020-says-lazard/). Modo puts US 2 h capex about 15% above the global average, citing tariffs on containerised BESS — [Modo Energy, Sep 2026](https://modoenergy.com/research/en/global-battery-capex-september-2026-research).
- Germany: only about 40% of projected 2025 German BESS capacity came online. Over 700 GW of storage sits in the grid queue against 2.5 GW connected — [Modo Energy, Mar 2026](https://modoenergy.com/research/en/germany-battery-investment-outlook-q2-2026-executive-summary).

### Inferences
- Planning lead time for a European data centre BESS (my estimate): about 12–18 months from order to delivery for containers, then about 1–3 months to install and commission. The critical path is usually the MV/HV transformer and switchgear and the grid or generator interface, not the battery. Use about 18–24 months order-to-energisation as the default, with a risk flag for 2027 supply if ordering in Q4 2026.
- If the campus seeks EIB/EU funding, the inverter ban favours non-Chinese PCS (Tesla, Fluence with non-Chinese PCS, Wärtsilä, Saft, SMA-type PCS). Equipment cost would rise, but this was not quantified in the sources.
- The US FEOC and tariff measures do not apply in Europe. They may divert non-Chinese (Korean, US-made) supply to the US, which would keep European buyers dependent on Chinese cells.

### Gaps
- No 2026 Europe-specific survey of BESS lead times in months was found (e.g. from Clean Horizon or Wood Mackenzie). The 18-month figure is one vendor executive's remark.
- No current (2026) European figures found for MV transformer or switchgear lead times.
- Lithuania and other national restrictions on Chinese inverters were not checked. EU anti-subsidy or tariff action on Chinese BESS was not found.

## 4. What does BESS cost per kWh and per kW in 2025–2026 (Europe where possible)?

### Takeaway
BNEF's 2025 survey puts European turnkey BESS (equipment, no EPC or grid) at US$177/kWh, against US$117 global and US$73 in China. All-in installed capex is around US$200–325k/MWh globally (Modo, Sep 2026: 4 h median US$201k/MWh, 2 h median US$325k/MWh). In Germany, 2026-COD capex is about €700k/MW for 2 h (about €350/kWh) and €935k/MW for 4 h (about €234/kWh). Cell prices rose in 2026, so 2027 contracts may not see further falls.

### Cited Findings
- BNEF Energy Storage System Cost Survey 2025 (10 Dec 2025), turnkey averages:
  - Global US$117/kWh (−31% vs 2024's revised US$169).
  - China US$73, Europe US$177, US US$219.
  - By duration (global): 2 h US$124/kWh, 4 h US$110/kWh.
  - 2035 forecast for 4 h: Europe US$101, China US$41, US US$108.
  — [Energy-Storage.news](https://www.energy-storage.news/battery-storage-system-prices-continue-to-fall-sharply-bnef-and-ember-reports-find/)
- Ember (Oct 2025) all-in capex for 4 h+ projects, ex-China/US: US$125/kWh. Of this, equipment is about US$75/kWh (enclosure, PCS, EMS) and installation plus grid connection about US$50/kWh. Grid connection alone is US$30–100/kWh. Shorter durations cost about 10–15% more per kWh. Tariffs or local-content rules can add US$100+/kWh — [Energy-Storage.news](https://www.energy-storage.news/battery-storage-system-prices-continue-to-fall-sharply-bnef-and-ember-reports-find/).
- Modo Energy global capex survey (9 Sep 2026), 20 markets:
  - 2 h median US$325k/MWh (US$660k/MW); 4 h median US$201k/MWh (mean about 11% above median).
  - Doubling duration cuts cost per MWh by 38%. The 4 h vs 2 h per-MW premium narrowed from 38% (2024) to 22%.
  - GB 2 h capex is down 29% over two years.
  - Containerised BESS is the largest capex item. Grid connection explains much of the variation between markets.
  — [Modo Energy](https://modoenergy.com/research/en/global-battery-capex-september-2026-research)
- Modo Energy, Germany (Mar 2026), capex for 2026-COD: 2 h €700k/MW (about €350/kWh, derived) and 4 h €935k/MW (about €234/kWh, derived). Future grid capacity charges are €10–25k/MW/yr for post-2029 connections — [Modo Energy](https://modoenergy.com/research/en/germany-battery-investment-outlook-q2-2026-executive-summary).
- Transaction reference: Econergy paid €73m for 100 MW / 200 MWh (2 h) of ready-to-build German BESS (Brandenburg, COD Q1 2027). That is about €365/kWh or €730k/MW (derived), including development value — [Energy-Storage.news, Jun 2025](https://www.energy-storage.news/econergy-enters-germany-with-e73-million-investment-into-100mw-200mwh-of-bess/).
- Tesla Megapack 3 is reported at about US$1.39m per unit (5 MWh), about US$278/kWh equipment (derived; secondary) — [Energy-Storage.news](https://www.energy-storage.news/under-the-hood-inside-teslas-megapack-3-as-texas-production-begins/). Megablock claims 40% lower construction cost — [RenewEconomy](https://reneweconomy.com.au/tesla-unveils-megapack-3-and-new-megablock-says-they-will-be-40-pct-cheaper-to-build/).
- Lazard LCOE+ 2026 (US): LCOS for 100 MW / 4 h is about US$210–292/MWh, with storage costs up about 27% since 2020, driven by tariffs and FEOC — [ESS News, Jul 2026](https://www.ess-news.com/2026/07/13/battery-storage-costs-up-27-since-2020-says-lazard/).
- Cell cost: 314 Ah LFP was 0.32 → 0.365 RMB/Wh in H1 2026 (about US$45–51/kWh at about 7.1 RMB/US$, derived) — [SMM](https://news.metal.com/en/newscontent/103999667-smm-analysis-riding-the-winds-in-and-outside-china-breaking-the-iron-law-of-old-cycles-2026-energy-storage-battery-cell).
- Diesel comparison (US): diesel generator capex is US$800–1,000/kW, with maintenance at 2.5% of capex per year (Tesla assumption) — [Tesla ERCOT LLWG](https://www.ercot.com/files/docs/2025/05/15/11-Megapack-at-Data-Centers-_-ERCOT-LLWG_5.16.25_vShare.pdf).

### Inferences
- Suggested 2026 planning defaults for a European data centre BESS (my synthesis of BNEF, Modo, Ember and the German data):

  | Item | 2 h | 4 h |
  |---|---|---|
  | Equipment (DC block + PCS + EMS, delivered) | about €160–200/kWh | about €140–170/kWh |
  | Installed, excluding grid connection | about €250–350/kWh (≈ €0.5–0.7m/MW) | about €200–240/kWh (≈ €0.8–0.95m/MW) |

  - Add MV/HV connection and a data centre premium (redundancy, grid-forming, fire separation from critical buildings).
  - BNEF's US$177/kWh Europe figure was converted at roughly parity to €; adjust for the exchange rate.
- Short-duration, high-power builds (1 h, or UPS-style 0.5 h) cost more per kWh but less per kW. Per-MW costs, not per-kWh, should drive data centre ride-through and step-load sizing.
- The 2026 rise in cell prices and the end of China's export rebate may hold European equipment prices flat or slightly up for 2027 deliveries. This conflicts with BNEF's falling long-term trend, so a sensitivity range is needed.

### Gaps
- NREL ATB 2025/2026, Clean Horizon and BNEF's 2026 survey (due Dec 2026) were not retrieved.
- No public Europe-specific split of equipment vs EPC vs grid costs for 2026 was found. Modo's regional spreadsheet sits behind a login.
- No price data for grid-forming PCS premiums or for data centre-grade (UPS-replacement) BESS was found.
