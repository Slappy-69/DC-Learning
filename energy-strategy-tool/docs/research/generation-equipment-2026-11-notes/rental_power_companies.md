# Rental, lease and "power as a service" providers of generation and storage for European data centres (as of Nov 2026)

Research note, 13 Nov 2026. Coverage caveat: the shared web-search budget ran out partway through this run. Several named companies (Loxam/Hune, Kiloutou, Boels, Ramirent, Cramo, HSS, Cummins rental, Rehlko/SDMO partners, Wärtsilä, Siemens Energy SGT-A45, Mitsubishi FT8 MobilePac lease terms, Solar Turbines, Pure Energy Centre, Smart Power/Gen-Set, Off Grid Energy, EODev, AFC Energy beyond the Speedy JV, Bloom in Europe, Crusoe in Europe) could not be checked against a source. They appear in the Gaps sections, not in the cited findings. Search-result pages returned links only, not snippets, so every cited figure below comes from a fetched page. **No published or reported price per kW-month, per day or per MWh was found for any provider.**

Marks used in the table: **n/f** = not found in the sources fetched. **†** = background knowledge NOT verified in this run (treat as unverified; listed again in Gaps).

---

## 1. Which companies offer rental, lease or power-as-a-service generation and storage in Europe?

### Takeaway
Only a few firms have *verified, documented* European data centre bridging or standby work. Aggreko leads, with three Dublin/London data centre case studies and grid-code compliance for its 1.5 MW gas fleet in 11 European countries. Several groups split the work by technology:
- **Cat dealer rental:** Finning, Zeppelin and Pon, which took over the old Energyst business.
- **Battery rental:** Atlas Copco and Bredenoord.
- **Hydrogen units:** GeoPura (now Ballard), offered through Sunbelt UK & Ireland, and Speedy Hydrogen.
- **Aeroderivative turbine fleets:** GE Vernova, ProEnergy and APR Energy. These are mainly US-deployed, and APR's fleet appears to have been taken in-house by Elon Musk in 2026.
- **US behind-the-meter specialists:** VoltaGrid, Enchanted Rock and Bloom. No verified European deployments were found for any of them.

### Cited Findings
**Aggreko (UK)**
- Aggreko markets "fast, flexible power for data centres" for expansion, new builds and bridging grid connection delays. Its listed technologies are diesel, gas, HVO and Stage V generators, load banks, BESS, CHP, hybrid systems and HVAC. The page offers a "choice of fuel types, remote monitoring, and contract terms" but gives no unit sizes, fleet size or prices — [Aggreko data centre decentralised energy page](https://www.aggreko.com/en-gb/sectors/data-centres/data-centre-decentralised-energy)
- Sep 2026: Aggreko secured grid-code compliance for its **1.5 MW generator fleet** in **11 European countries**: UK, Ireland, Germany, France, Italy, Spain, Netherlands, Belgium, Poland, Romania and Czechia.
  - The article says this makes it "the only provider with this coverage in the region".
  - The fleet can connect to public networks for extra supply, demand-spike management, export and grid balancing.
  - The article says "gas-fuelled systems above 50MW can be deployed within months rather than years". It is unclear whether this refers to the certified 1.5 MW fleet — [IT Brief UK, 17 Sep 2026](https://itbrief.co.uk/story/aggreko-wins-grid-compliance-in-11-european-markets)
- Aggreko's bridging blog cites grid waits of "up to 13 years". It names grid delays in Dublin, London and Frankfurt, plus the Tier 2 markets Milan and Warsaw — [Aggreko blog, bridging power for data centres](https://www.aggreko.com/en-gb/resources/gu-blog---bridging-power-solutions-for-data-centres)

**APR Energy (US; Atlas Corp, then Fortress, then reportedly Elon Musk)**
- **The user's premise "APR Energy now part of Atlas Corp" is outdated.** The turbine fleet passed to "New APR Energy" on **31 Dec 2024**: 95% Fortress Investment Group, 5% Duos Technologies. Atlas Corp kept the "original APR Energy" entity.
- The New APR fleet was **30 gas turbines, about 850 MW**: 10 Pratt & Whitney FT8 MobilePacs and 20 GE TM2500s, running on diesel or natural gas (natural gas preferred).
- Rental agreements typically run **2–5 years**. Lead time for comparable new turbines is **2–3 years**.
- Before the sale APR also operated 1,400 kW and 1,640 kW diesel power modules.
- APR's past temporary power countries are Australia, Egypt, Japan, Libya, Uruguay and the US Virgin Islands. In Europe the article mentions only an **enquiry from Ireland** — [Construction Briefing, 26 Mar 2025](https://www.constructionbriefing.com/apr-looks-to-cash-in-on-data-centre-power-gold-rush/8051948.article)
- Jan 2026: APR acquired eight more mobile gas turbines, taking owned capacity from **850 MW to over 1.1 GW**. It claims mobile turbines can be "operational within 30 to 90 days", against 2–5 years for grid infrastructure. It supplies "one of the world's largest AI data centers" (unnamed) and full balance of plant. No European operations are mentioned — [APR Energy press release, 15 Jan 2026](https://energydigital.com/globenewswire/3219412)
- **Reported, not confirmed by APR:** Elon Musk acquired APR Energy for about **US$1bn**.
  - The value is inferred from a minority holder's SEC filing showing its 5% stake sold for about US$50.4m.
  - The deal was first flagged by an **FTC early-termination notice on 14 May 2026**.
  - The fleet is expected to serve Musk-related data centres (xAI Grok, Tesla) — [Not a Tesla App, 16 Jul 2026](https://www.notateslaapp.com/news/4451/elon-musk-buys-gas-turbine-company-in-1-billion-deal). DCD carried the same story ([DCD headline](https://www.datacenterdynamics.com/en/news/elon-musk-quietly-acquires-mobile-gas-generation-firm-apr-energy-report/)), but that page could not be fetched.

**Atlas Copco (Sweden; Specialty Rental, Belgium entity)**
- **ZBC 1000-1200 battery unit (Apr 2025):**
  - 1 MW from a single unit and 1,200 kWh in a 20 ft HQ container, LiFePO4, rated -20 to +50 °C.
  - Up to **16 units in parallel (16 MW)**.
  - Described as "ideal for demanding rental applications".
  - Atlas Copco has eight BESS models, from ZBP portable units starting at 2 kW up to the 1 MW ZBC — [International Rental News, 1 Apr 2025](https://internationalrentalnews.com/news/atlas-copco-rolls-out-zbc-1000-1200-energy-storage-system/8054954.article)
- **ZenergiZe ZBC range (Apr 2021):** 100–1,000 kVA and 250–2,000 kWh, up to 30 units in parallel. Offered "for rental or construction applications" — [KHL, 28 Apr 2021](https://www.khl.com/news/atlas-copco-adds-to-zenergize-range/8011920.article)
- **UK rental ZBC 250-575:** 250 kW/250 kVA, 576 kWh, 275 kW peak, 400 V. Recharges in under 3 h. Runs in hybrid mode (paralleled with diesel gensets) or island mode. Listed applications include back-up power and peak shaving. Rental contacts are in South Shields and Dundee — [Atlas Copco UK rental, energy storage](https://www.atlascopco.com/en-uk/rental/promotions/energy-storage-systems)
- **Atlas Copco Rental Europe power modules:**
  - QAS 150, 250, 325, 400, 500 and 630 kVA, plus PM1500 TwinPower at 1,446 kVA.
  - Diesel, with a Stage V module that is "HVO compatible" and "Fully EU Stage V compliant".
  - Scalable "from a single unit to multi-megawatt setups". Can be hybridised with the ZBC 250-575.
  - Offered for emergency, short-term and long-term use, 24/7. Data centres are not mentioned — [Atlas Copco Specialty Rental Europe leaflet](https://www.atlascopco.com/content/dam/atlas-copco/construction-technique/specialty-rental/documents/power/leaflet-power-modules/leaflet-modular-power-solutions-europe.pdf)

**Bredenoord (Netherlands)**
- HQ in Apeldoorn, NL. Rents generators "in various capacities", energy storage (the "Battery Box"), distribution and hybrid systems. Image captions mention biogas, methanol and Stage V generators.
- **Battery Box: 600 kWh.** Two in parallel delivered 1,000 kW, used for the Mammoet SK6000 crane.
- It has provided **backup generator service for Interconnect data centres (8,000 m²) for almost 15 years**. It has a German commercial team. No contract models are stated — [Bredenoord website](https://www.bredenoord.com/en/)

**Energyst, now Finning, Zeppelin, Pon and Finanzauto (Cat dealer rental)**
- Energyst was a Caterpillar/European Cat dealer rental joint venture. It was **dissolved in Dec 2020** and split four ways, with annual revenue of about US$97m:
  - **Zeppelin:** Germany and Sweden.
  - **Pon Equipment/Pon Power:** Benelux and Norway.
  - **Finning:** UK and Ireland (four UK depots, one in Ireland).
  - **Finanzauto:** Spain and the Mediterranean — [KHL, 18 Dec 2020](https://www.khl.com/news/energyst-dissolved-and-split-between-cat-dealers/1147594.article)
- Finning Ireland's critical facilities page still brands the service "Energyst, a leading Cat® rental power provider". It offers generators, load banks, transformers and ancillaries, with application engineers and custom solutions. It gives no sizes, fuels or references — [Finning Ireland, critical facilities rental](https://finning.com/en_IE/products/rentals/power-systems/industries/critical-facilities.html)
- **Caterpillar rental power units:** containerised, **455 kW–2 MW (570 kVA–2.3 MVA)** each, diesel or natural gas, with HVO shown in use. Packages include the genset, AVR, cooling, fuel storage and telematics. This is sponsored content by Caterpillar's Rental Power Solutions market development director — [Power Engineering, 14 Jun 2026](https://www.power-eng.com/onsite-power/the-advantages-of-rental-power-in-addressing-todays-energy-challenges/)
- Zeppelin Rental (Germany) lists "Stromerzeugung & Klimatechnik" (power generation and climate technology) and "Baustrom" (construction power) and promotes HVO. It cites a project for IKO in Kaisersesch running on mobile generators because the new plant is not yet grid-connected. No data centre references or sizes are given — [Zeppelin Rental website](https://www.zeppelin-rental.de/)

**GE Vernova (TM2500 mobile aeroderivative)**
- **TM2500 DLE (launched 31 Mar 2025):**
  - "Waterless, mobile **34 MW** power plant" on a two-trailer frame.
  - "**30-day lead time from contract to commissioning**" (GE claim).
  - 5-minute fast start. Fuels: gas, liquid fuel or hydrogen blend.
  - The release does not mention lease or rental. It names data centres as a market driver — [GE Vernova press release](https://www.gevernova.com/news/press-releases/ge-vernova-launches-tm2500-dle-aeroderivative-gas-turbine-worlds-first-mobile-power)
- The TM2500 DLE was built in Veresegyház, Hungary (late 2023). Build, connection, alignment and first-fire readiness took "less than three weeks" — [GE Vernova Hungary case study](https://www.gevernova.com/gas-power/resources/case-studies/TM2500-DLE-rollout-in-hungary)
- **European precedent (Swiss Federal Office of Energy, contract Sep 2022):**
  - **8 trailer-mounted TM2500s, up to 250 MW (about 32 MW each)**, as a temporary reserve plant at Birr, available "until 2026".
  - About **26 weeks from contract to commercial start-up**. Runs on natural gas, with diesel, hydrogen or SAF blends possible.
  - A 20 m noise wall was needed because of nearby housing.
  - The article does not say whether this was a purchase or a lease — [GE report, 17 Apr 2023](https://www.ge.com/news/reports/mobile-service-switzerland-is-shoring-up-its-energy-security-with-ges-brilliant-power-on)

**ProEnergy (US)**
- **PE6000 = 50 MW fast-start aeroderivative**, interchangeable with the LM6000PC.
- Supplying a **650 MW** "manufactured equipment solution" of **13 PE6000 sets for Crusoe AI Factories**. This is a US equipment supply, not a rental.
- Has a "PE6000 lease" engine case study, with no terms given. No European presence is stated — [ProEnergy website](https://www.proenergyservices.com/)
- ProEnergy offers retrofitted CF6-80C2 cores in packages of about 50 MW per unit — [Data Center Frontier, 25 Feb 2026](https://datacenterfrontier.com/energy/article/55358731/aeroderivative-turbines-move-to-the-center-of-ai-data-center-power-strategy)

**Mitsubishi Power (FT8 MobilePac)**
- Described as built for rapid delivery and a small footprint. It is historically used for peaking, grid support and temporary power. No unit size or lease terms are given — [Data Center Frontier, 25 Feb 2026](https://datacenterfrontier.com/energy/article/55358731/aeroderivative-turbines-move-to-the-center-of-ai-data-center-power-strategy). APR's fleet included 10 P&W FT8 mobile packs — [Construction Briefing, Mar 2025](https://www.constructionbriefing.com/apr-looks-to-cash-in-on-data-centre-power-gold-rush/8051948.article)

**Rolls-Royce mtu (Germany)**
- Rolls-Royce and Flexpowernet won a Stedin (NL) contract for **24 containerised mobile mtu gas gensets in six 10 MW blocks = 60 MW**.
  - Engines: Series 4000 L64 FNER.
  - Movable within the Netherlands, for "temporary use until 2036".
  - Rolls-Royce scope: EPC (including civil works and the 10 kV connection), maintenance and a **10-year availability guarantee**.
  - The article does not say whether this is a purchase or a rental. It is a DSO grid-congestion use, not a data centre one — [Enlit, 1 Sep 2025](https://www.enlit.world/library/stedin-taps-rolls-royce-mtu-gas-gensets-for-grid-stability)

**INNIO Jenbacher, Clarke Energy and Edina (gas engines)**
- Clarke Energy (INNIO Jenbacher distributor, also listing Rehlko) defines three operating bands:
  - **Backup:** under about 100 h/yr.
  - **Peaking:** about 1,000–1,500 h/yr.
  - **Baseload "bridging power":** up to about 8,600 h/yr per engine, or 8,760 h/yr with redundant engines.
  - After grid connection, a bridging plant can move to backup or grid-support/peaking duty (500–1,500 h/yr).
  - The article names **Ireland and the UK** as markets where on-site baseload gas is being considered or deployed while developers await grid upgrades. Baseload duty needs oxidation catalysts and, in some markets, **SCR**.
  - **No rental, BOO or energy-as-a-service offer is described** — [Clarke Energy article (2026)](https://www.clarke-energy.com/2026/how-operating-hours-define-gas%E2%80%91engine-roles-in-modern-data-centers)
- Edina (UK/IE, MWM gas engines):
  - Markets HVO standby generation "rated 10kVA to 4MVA", hydrogen-enabled MWM gas engines and BESS (grid-connected or microgrid).
  - Cites UK energy centres with "over 600MW" grid-connected capacity.
  - **No bridging, rental, BOO or EaaS is mentioned** — [Edina, DataCentres Ireland 2025 (posted 6 Oct 2025)](https://www.edina.eu/news/datacentres-ireland-2025)

**Centrica Business Solutions (UK/IE)**
- Mar 2026: Centrica and Ceres are collaborating on SOFC on-site power for data centres and other C&I sites. Centrica brings its supply, trading and services platform; Ceres handles origination, installation, commissioning, monitoring and maintenance. No unit sizes or contract model are given — [Enlit, 26 Mar 2026](https://www.enlit.world/library/centrica-and-ceres-speed-up-fuel-cell-deployment-amid-uk-grid-delays)
- May 2026: Centrica and Delta Electronics announced a "scalable off-grid fuel cell power solution for data centres". Only a summary was retrievable — [Digital Infrastructure News, 2 May 2026](https://digitalinfrastructure.news/news/22279-centrica-and-delta-launch-scalable-offgrid-fuel-cell-power-solution-for-data-centres)

**Power Electrics (UK)**
- UK generator hire "across the UK": single units from over 550 kVA up to **2,000 kVA**, with standby and prime power packages. No fuels, Stage V status, data centre references or prices are given — [Power Electrics 550–2000 kVA hire page](https://powerelectrics-website.azurewebsites.net/generator-hire/550-2000-kva-generator-hire)

**Himoinsa (Spain; a Yanmar company)**
- Product ranges (maximum kVA):
  - **DC (data centre) range:** diesel up to 2,617 kVA.
  - **HI/HP ranges:** diesel up to 2,617 kVA, gas up to 1,183 kVA.
  - **MV range:** up to 2,536 kVA.
  - **HR rental range:** for rental companies; no ratings given.
  - **EHR range:** battery storage.
- No rental fleet of its own or data centre references are named — [Himoinsa website](https://www.himoinsa.com/)

**GeoPura (UK, now Ballard) — hydrogen power units (HPUs)**
- **Business model:** GeoPura leases HPUs bundled with hydrogen it produces itself. It also sells merchant hydrogen. Its business is focused on the UK and EU.
- **Ballard acquisition:** £82.5m (about US$112m) cash plus 49.5m Ballard shares, plus an earn-out of up to £27.5m if 2026 revenue reaches £28m. The closing date is not stated. Data centre backup is named as a target market — [gasworld](https://www.gasworld.com/story/ballard-closes-acquisition-of-uk-hydrogen-generator-firm-geopura/2258341.article/)
- **Products and model:**
  - HPU Agile-H = towable **80 kW**. HPU2 is "scalable to multi-megawatt applications".
  - Offered through "Hire an HPU" and an "Energy as a Service" model that bundles the unit, hydrogen, infrastructure and support.
  - Ballard fuel cells; HPUs manufactured in the UK by Siemens Energy — [GeoPura website](https://www.geopura.com/)
- **Scale and plans:**
  - Targets **1,000 units over five years** (£1bn+) and 4,000 over a decade.
  - HPU2 is described as scaling up to 50 MW.
  - Hydrogen production at Croft Farm (Doncaster) and HyMarnham Power (Notts, with capacity for 300 t/day).
  - QTS Cambois and Latos Stockton are named as *future* HPU2 markets, with no contracts named — [Bdaily (undated, about Mar 2026)](https://www.bdaily.co.uk/articles/2026/03/15/driving-a-step-change-in-sustainable-energy-provision)
- **Sunbelt Rentals UK & Ireland trade partner agreement:** Sunbelt will offer GeoPura HPUs and green hydrogen supply through its UK and Ireland hire network. No data centre mention — [RER, 7 May 2026](https://www.rermag.com/news-analysis/headline-news/article/55375992/sunbelt-rentals-uk-ireland-partners-with-geopura-to-provide-hyrogen-power)

**Speedy Hydrogen Solutions (Speedy Hire + AFC Energy)**
- 50:50 joint venture, £5m (£2.5m each).
- Buys AFC Energy **30 kW H-Power** generators and provides full-service hire, including fuelling.
- **Exclusive UK & Ireland hire rights** for an initial three years.
- Initial £2m order for H1 2024, with orders planned to rise to £4.7m by Nov 2024.
- Units are paired with batteries from Green Power Hire, which Speedy acquired. No data centre mention — [The Construction Index, 15 Nov 2023](https://www.theconstructionindex.co.uk/news/view/speedy-launches-hydrogen-generator-jv)

**US players (Europe status)**
- **VoltaGrid:**
  - Vantage partnership for **more than 1 GW of prime power across North America** (Feb 2025), with installation "within months" — [Business Wire, 11 Feb 2025](https://www.businesswire.com/news/home/20250211912386/en/Vantage-Data-Centers-and-VoltaGrid-Establish-Partnership-to-Deploy-More-Than-One-Gigawatt-of-Power-Generation)
  - **1.5 GW order of Jenbacher J624/J620 engines (300 engines packaged into 25 MW QPac units), delivery 2028.** A separate Oct 2025 deal covers 2.3 GW for an unnamed data centre. **No Europe plans are mentioned** — [Enlit, 14 Feb 2026](https://www.enlit.world/library/voltagrid-orders15gw-for-behind-the-meter-power-from-innio)
- **Enchanted Rock (ERock, Houston):** offers bridge-to-grid power, flexible capacity, backup and "resiliency-as-a-service" using modular natural gas gensets. **No Europe presence is mentioned** — [ERock website](https://erock.com/)
- **Bloom Energy:** Equinix passed **100 MW of Bloom SOFC capacity across US sites** (Feb 2025, building on a 72 MW fleet). This is an aggregator page citing Bloom IR. **No European Bloom deal is listed** — [EnkiAI summary](https://enkiai.com/data-center/equinix-fuel-cell-backup-generation/). Search results claiming a "US$2.6bn Bloom–Nebius European deal" (May 2026) came only from spam/scraper domains and are **unverified**.
- **Crusoe:** launch customer for Boom Supersonic "Superpower" units (**42 MW each, 29 units**, part of a **1.21 GW** on-site plan, US). Baker Hughes is supplying 25 BRUSH DAX 7 generators, with deliveries from mid-2026 to 2028 — [Data Center Frontier, 25 Feb 2026](https://datacenterfrontier.com/energy/article/55358731/aeroderivative-turbines-move-to-the-center-of-ai-data-center-power-strategy). No European rental activity was found.

### Inferences
- For a European data centre bridge **today**, the realistic rental pool for MW-scale gas is Aggreko first, then Cat dealer rental (Finning UK/IE, Zeppelin DE/SE, Pon Benelux/NO, Finanzauto ES), then Rolls-Royce mtu-type EPC plus availability-guarantee deals.
  - Aggreko's 1.5 MW gas units are grid-code certified in 11 countries.
  - For the Cat dealer route, the 455 kW–2 MW Cat units were confirmed as a product line but not as a European fleet size.
- For mobile turbines, Europe has GE Vernova TM2500 precedent (Swiss SFOE) but **no verified European turbine-rental fleet**. APR's 1.1 GW fleet is US-deployed and probably no longer open to third parties after the reported Musk acquisition.
- Battery rental units top out at about 1 MW / 1.2 MWh per container (Atlas Copco ZBC 1000-1200). A 16-unit parallel stack is about 16 MW / 19 MWh. Rental BESS therefore suits peak-shaving or top-up of a limited connection and gen-set hybridisation, not tens of MW of bridge energy.
- Hydrogen rental is still kW to sub-MW scale: GeoPura 80 kW and about 250 kW units, AFC 30 kW. Equinix's 12-week Dublin pilot, at about 0.5 MW, is the only European data centre deployment found. Multi-MW HPU2 is a stated aim, not yet a delivered product.

### Gaps
- **Not verified in this run (search budget exhausted):**
  - Loxam (owns Ramirent and Hune †)
  - Kiloutou
  - Boels (owns Cramo †)
  - HSS (corporate status in 2025–26 not checked)
  - Sunbelt UK's own genset/BESS fleet
  - Speedy's conventional power fleet
  - Cummins rental
  - Rehlko/SDMO rental partners
  - Wärtsilä (rental/BOO)
  - Siemens Energy SGT-A45 mobile (≈44 MW class †) and its rental availability
  - Mitsubishi FT8 MobilePac lease terms (≈30 MW-class single / ≈60 MW twin †)
  - Solar Turbines Mobile Power Units (≈5–16 MW class †)
  - Pure Energy Centre
  - Smart Power / Gen-Set
  - Off Grid Energy (robots-blocked)
  - EODev GEH2 (≈100 kVA class †; site fetch failed)
  - AFC Energy beyond the Speedy JV
  - Crusoe's European sites (Norway/Iceland †, grid-powered rather than rental)
  - Country specialists in Ireland, Portugal, Italy and Poland
- No published or reported **prices** (per kW-month, per day, per MWh) were found for any provider. Neither Aggreko's H1 2025 results nor APR's releases disclose rates. APR says turbine margins exceed diesel margins, but gives no numbers.
- Aggreko's total European MW fleet, its gas fleet MW and its BESS fleet MWh were not found. The H1 2025 statement gives no fleet MW.

---

## 2. Company-by-company detail table

### Takeaway
The table brings together everything verified per company. For most companies, delivery times, contract models and prices are **not published**. The only stated delivery claims are APR's 30–90 days, GE's 30 days for the TM2500 DLE (26 weeks in the Swiss case) and Aggreko's "within months" for over 50 MW. The only stated contract terms are APR's 2–5 years and Aggreko's 12-month Dublin bridge.

### Cited Findings

| Company | HQ | European countries (verified) | Technologies | Unit sizes | Fleet / largest project | Fuels | Delivery time | Contract model | Price indications | Data centre references | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Aggreko | UK (Glasgow †) | Grid-code certified in UK, IE, DE, FR, IT, ES, NL, BE, PL, RO, CZ | Gas, diesel, HVO, Stage V gensets; BESS; CHP; hybrid; load banks; HVAC | 1.5 MW gas units; 1 MW and 1,250 kVA Stage V units | 43 MW, 4 yrs, Romania (grid supply); Europe H1-25 revenue US$322m | Natural gas, diesel, HVO | Over 50 MW of gas "within months" | Rental with 24/7 on-site support; 12-month bridge contract (Dublin) | n/f | Dublin 14 MW gas + BESS bridge; Dublin 20 MVA (24 × 1 MW) 12-month bridge; London 13 MW HVO standby + 15 MVA + 5 MVA load bank | [IT Brief](https://itbrief.co.uk/story/aggreko-wins-grid-compliance-in-11-european-markets); [case 1](https://www.aggreko.com/en-us/case-studies/data-centres/gas-power-for-a-data-centre); [case 2](https://www.aggreko.com/en-gb/case-studies/data-centres/supporting-sustainable-progress-for-a-new-data-centre); [case 3](https://bynder.aggreko.com/m/11dae7e0e1e41922/original/EUR-DC-GU-Case-Study-Providing-greater-resilience-at-a-critical-UK-Data-Centre.pdf); [H1-25](https://edge.sitecorecloud.io/aggrekoukli7a45-corporatesiaac7-production07bc-79cd/media/investordocuments/2025/albion-jvco---q2-25-results-statement.pdf) |
| APR Energy (New APR; reportedly Musk-owned since 2026) | Jacksonville, US | None verified (Ireland enquiry only) | Mobile gas turbines (TM2500, FT8 MobilePac); formerly diesel modules | Diesel modules 1,400 / 1,640 kW (pre-2025) | 850 MW (30 turbines) → over 1.1 GW (Jan 2026); 100 MW (4 turbines) at a US AI data centre | Natural gas, diesel | 30–90 days (claim) | Rental, typically 2–5 years; full balance of plant | n/f | US AI data centre, 100 MW; "one of the world's largest AI data centers" | [Construction Briefing](https://www.constructionbriefing.com/apr-looks-to-cash-in-on-data-centre-power-gold-rush/8051948.article); [APR PR](https://energydigital.com/globenewswire/3219412); [Not a Tesla App](https://www.notateslaapp.com/news/4451/elon-musk-buys-gas-turbine-company-in-1-billion-deal) |
| Atlas Copco (Specialty Rental) | Sweden †; rental entity in Belgium | UK depots (South Shields, Dundee); Europe-wide rental (countries not listed) | Diesel/HVO Stage V power modules; ZenergiZe BESS; hybrid | QAS 150–630 kVA; PM1500 at 1,446 kVA; ZBC 250-575 (250 kVA / 576 kWh); ZBC 1000-1200 (1 MW / 1,200 kWh); ZBC range 100–1,000 kVA / 250–2,000 kWh | Up to 16 ZBC 1000 units in parallel (16 MW) | Diesel, HVO | n/f | Rental (short and long term, 24/7) | n/f | None found | [IRN](https://internationalrentalnews.com/news/atlas-copco-rolls-out-zbc-1000-1200-energy-storage-system/8054954.article); [UK rental](https://www.atlascopco.com/en-uk/rental/promotions/energy-storage-systems); [leaflet](https://www.atlascopco.com/content/dam/atlas-copco/construction-technique/specialty-rental/documents/power/leaflet-power-modules/leaflet-modular-power-solutions-europe.pdf); [KHL](https://www.khl.com/news/atlas-copco-adds-to-zenergize-range/8011920.article) |
| Bredenoord | Apeldoorn, NL | NL, DE (sales team), DK (project) | Gensets (biogas, methanol, Stage V); Battery Box BESS; hybrid; distribution | Battery Box 600 kWh; 2 in parallel = 1,000 kW | Mammoet SK6000 crane (2 Battery Boxes) | Diesel †, biogas, methanol | n/f | Rental, sale, maintenance | n/f | Interconnect data centres: backup generator service for about 15 years | [Bredenoord](https://www.bredenoord.com/en/) |
| Finning (ex-Energyst UK/IE) | UK † | UK, IE | Cat gensets, load banks, transformers | Cat rental units 455 kW–2 MW | n/f | Diesel, natural gas, HVO | n/f | Rental with application engineering | n/f | None named | [Finning IE](https://finning.com/en_IE/products/rentals/power-systems/industries/critical-facilities.html); [KHL](https://www.khl.com/news/energyst-dissolved-and-split-between-cat-dealers/1147594.article); [Power Eng.](https://www.power-eng.com/onsite-power/the-advantages-of-rental-power-in-addressing-todays-energy-challenges/) |
| Zeppelin Rental (ex-Energyst DE/SE) | Germany | DE, SE | Mobile gensets, construction power | n/f | IKO Kaisersesch plant bridge (no grid connection yet) | Diesel, HVO | n/f | Rental | n/f | None found | [Zeppelin Rental](https://www.zeppelin-rental.de/); [KHL](https://www.khl.com/news/energyst-dissolved-and-split-between-cat-dealers/1147594.article) |
| Pon Power (ex-Energyst Benelux/NO) | NL † | Benelux, NO | Cat rental power | n/f | n/f | n/f | n/f | n/f | n/f | n/f | [KHL](https://www.khl.com/news/energyst-dissolved-and-split-between-cat-dealers/1147594.article) |
| Finanzauto (ex-Energyst ES) | Spain † | ES and the Mediterranean | Cat rental power | n/f | n/f | n/f | n/f | n/f | n/f | n/f | [KHL](https://www.khl.com/news/energyst-dissolved-and-split-between-cat-dealers/1147594.article) |
| GE Vernova (TM2500) | US | CH (8 × TM2500 reserve plant); built in HU | Trailer-mounted aeroderivative gas turbine | TM2500 about 32 MW; TM2500 DLE 34 MW | Swiss SFOE: 8 units, up to 250 MW, until 2026 | Gas, liquid fuel, H2 blend, SAF | 30 days contract to commissioning (DLE claim); 26 weeks (Swiss); under 3 weeks build to first-fire (HU) | Sale; lease/rental not stated | n/f | Data centres named as a market only | [GE PR](https://www.gevernova.com/news/press-releases/ge-vernova-launches-tm2500-dle-aeroderivative-gas-turbine-worlds-first-mobile-power); [Swiss](https://www.ge.com/news/reports/mobile-service-switzerland-is-shoring-up-its-energy-security-with-ges-brilliant-power-on); [HU](https://www.gevernova.com/gas-power/resources/case-studies/TM2500-DLE-rollout-in-hungary) |
| ProEnergy | Sedalia, Missouri, US | None stated | PE6000 aeroderivative (skid) | 50 MW | 650 MW (13 × PE6000) for Crusoe (US) | Natural gas | n/f | Equipment supply; PE6000 lease engine | n/f | Crusoe AI factories (US) | [ProEnergy](https://www.proenergyservices.com/) |
| Rolls-Royce mtu | Germany † | NL (Stedin) | Containerised mobile gas gensets | 2.5 MW each (24 units = 60 MW) †(derived); 10 MW blocks | Stedin, 60 MW, until 2036 | Natural gas | Installation mid-2026; use from Q3 2026 | EPC + maintenance + 10-yr availability guarantee | n/f | None (grid use) | [Enlit](https://www.enlit.world/library/stedin-taps-rolls-royce-mtu-gas-gensets-for-grid-stability) |
| Clarke Energy (INNIO Jenbacher) | UK † | IE, UK named as markets | Gas engines (bridge/peaking/backup) | n/f | n/f | Natural gas, biomethane, H2-ready | n/f | Rental/BOO not stated | n/f | None named | [Clarke Energy](https://www.clarke-energy.com/2026/how-operating-hours-define-gas%E2%80%91engine-roles-in-modern-data-centers) |
| Edina | UK/IE † | UK, IE | HVO standby gensets; MWM gas engines; BESS | Standby 10 kVA–4 MVA | UK energy centres over 600 MW (grid-connected) | HVO, gas, H2-enabled | n/f | Sale/EPC (no rental stated) | n/f | Bank of Ireland 2 × 1,000 kVA (not a data centre) | [Edina](https://www.edina.eu/news/datacentres-ireland-2025) |
| Centrica Business Solutions | UK | UK, IE | SOFC fuel cells (with Ceres; with Delta) | n/f | n/f | Natural gas/H2 † | "Quickly" | n/f | n/f | Data centres targeted | [Enlit](https://www.enlit.world/library/centrica-and-ceres-speed-up-fuel-cell-deployment-amid-uk-grid-delays); [DI News](https://digitalinfrastructure.news/news/22279-centrica-and-delta-launch-scalable-offgrid-fuel-cell-power-solution-for-data-centres) |
| Power Electrics | UK (Bristol †) | UK | Diesel generator hire | Over 550 kVA up to 2,000 kVA | n/f | n/f | n/f | Standby and prime packages | n/f | n/f | [Power Electrics](https://powerelectrics-website.azurewebsites.net/generator-hire/550-2000-kva-generator-hire) |
| Himoinsa (Yanmar) | Spain | ES (site region "Europe") | Diesel and gas gensets incl. DC range; HR rental range; EHR BESS | DC diesel up to 2,617 kVA; gas up to 1,183 kVA; MV up to 2,536 kVA | n/f | Diesel, gas | n/f | Supplies rental companies (HR range) | n/f | DC range only | [Himoinsa](https://www.himoinsa.com/) |
| GeoPura (Ballard) | Newcastle, UK | UK, IE (via Sunbelt); "UK and EU" | Hydrogen fuel cell HPUs with batteries | 80 kW (Agile-H); about 250 kW per unit (Equinix pilot, secondary source); HPU2 "multi-MW" | Equinix DB3 Dublin about 0.5 MW, 12 weeks | Green hydrogen (own production) | n/f | Hire; Energy-as-a-Service (unit + H2 + support) | n/f | Equinix DB3 Dublin pilot (Jun 2026) | [GeoPura](https://www.geopura.com/); [Hydrogen Central](https://hydrogen-central.com/equinix-trials-landmark-hydrogen-power-solution-at-dublin-data-centre/); [gasworld](https://www.gasworld.com/story/ballard-closes-acquisition-of-uk-hydrogen-generator-firm-geopura/2258341.article/); [RER](https://www.rermag.com/news-analysis/headline-news/article/55375992/sunbelt-rentals-uk-ireland-partners-with-geopura-to-provide-hyrogen-power) |
| Sunbelt Rentals UK & Ireland | UK † | UK, IE | Resells GeoPura HPUs + H2; own gensets † | n/f | n/f | H2 (GeoPura); HVO † | n/f | Hire | n/f | n/f | [RER](https://www.rermag.com/news-analysis/headline-news/article/55375992/sunbelt-rentals-uk-ireland-partners-with-geopura-to-provide-hyrogen-power) |
| Speedy Hydrogen Solutions (Speedy + AFC Energy) | UK | UK, IE (exclusive) | H2 fuel cell generators + batteries | 30 kW (AFC H-Power) | £2m initial order (H1 2024) | Hydrogen | n/f | Full-service hire incl. fuelling | n/f | None | [Construction Index](https://www.theconstructionindex.co.uk/news/view/speedy-launches-hydrogen-generator-jv) |
| VoltaGrid | Texas, US | None | Gas-engine microgrids (Jenbacher QPac) | 25 MW QPac units | Over 1 GW with Vantage (N. America); 1.5 GW engine order (delivery 2028); 2.3 GW deal | Natural gas (H2/RNG "when viable") | "Within months" | Prime power partnership | n/f | Vantage (N. America) | [Business Wire](https://www.businesswire.com/news/home/20250211912386/en/Vantage-Data-Centers-and-VoltaGrid-Establish-Partnership-to-Deploy-More-Than-One-Gigawatt-of-Power-Generation); [Enlit](https://www.enlit.world/library/voltagrid-orders15gw-for-behind-the-meter-power-from-innio) |
| Enchanted Rock (ERock) | Houston, US | None | Natural gas microgrids | n/f | n/f | Natural gas | "Installs quickly" | Bridge-to-grid; resiliency-as-a-service; EPC + O&M | n/f | Data centres targeted | [ERock](https://erock.com/) |
| Bloom Energy | US | No European deal verified | SOFC | n/f | Equinix over 100 MW (US) | Natural gas, H2 blends up to 50% | n/f | Long-term agreements | n/f | Equinix (US) | [EnkiAI (secondary)](https://enkiai.com/data-center/equinix-fuel-cell-backup-generation/) |
| Crusoe / Boom | US | None found | Boom Superpower turbines; ProEnergy PE6000 | 42 MW (Boom); 50 MW (PE6000) | 1.21 GW (29 Superpower units); 650 MW PE6000 | Natural gas, diesel backup | Deliveries mid-2026 to 2028 | Owner-operator (not rental) | n/f | Abilene, TX Stargate | [DCF](https://datacenterfrontier.com/energy/article/55358731/aeroderivative-turbines-move-to-the-center-of-ai-data-center-power-strategy) |

### Inferences
- The fields most often missing from every vendor's public material are fleet MW in Europe, contract length and price. A developer would need to issue RFQs to get them. For a planning tool, those inputs should be user-editable assumptions, not defaults drawn from published data.
- Rolls-Royce mtu unit size (2.5 MW) is derived arithmetically: 60 MW / 24 units. It is not stated by the source.

### Gaps
- No delivery-time or contract-length data for Atlas Copco, Bredenoord, the Cat dealers, Himoinsa, Edina, Centrica or Power Electrics.
- HQ cells marked † were not verified.
- No European fleet MW for any provider other than via the APR (global) figures.

---

## 3. Data centre references (Europe and worldwide)

### Takeaway
All the verified European data centre rental-power references are in **Dublin and London**, plus one Dutch backup-service relationship. Ireland is the clearest case of data centres running on temporary or on-site gas because of grid limits: Aggreko's Dublin bridges, Vantage Grange Castle and Pure DC. No German or Dutch data centre *rental bridge* project was found. Worldwide, the large rental and lease deployments are US AI campuses: APR 100 MW, VoltaGrid/Vantage over 1 GW, and Crusoe 1.21 GW (owned, not rented).

### Cited Findings
**Ireland**
- **Aggreko, Dublin (published Feb 2024):** a global colocation company building for a client.
  - **14 MW from 12 next-generation gas gensets plus BESS.**
  - Bridge "several months" until the grid connection, designed to ramp up as the IT load grew, with 24/7 on-site support — [Aggreko case study](https://www.aggreko.com/en-us/case-studies/data-centres/gas-power-for-a-data-centre)
- **Aggreko, Dublin (2024):** new data centre.
  - **20 MVA from 24 × 1 MW Stage V generators, 12-month contract.**
  - Bridged "the power gap" until the client's own gas turbines were operational; no grid connection was possible.
  - Fuel not named. The page also gives conflicting carbon-saving figures (2,107 t vs 4,052 t) — [Aggreko case study](https://www.aggreko.com/en-gb/case-studies/data-centres/supporting-sustainable-progress-for-a-new-data-centre)
- **Equinix DB3, Blanchardstown, Dublin (Jun 2026):** 12-week pilot with ESB and GeoPura.
  - Two containerised PEM hydrogen units in parallel, "up to half a megawatt".
  - Supported the cooling systems. One unit is owned by ESB — [Hydrogen Central, 24 Jun 2026](https://hydrogen-central.com/equinix-trials-landmark-hydrogen-power-solution-at-dublin-data-centre/)
  - A secondary source gives 2 × 250 kW, about 8% of site power — [EnkiAI](https://enkiai.com/data-center/equinix-fuel-cell-backup-generation/)
- **Vantage, Grange Castle, Dublin (reported Nov 2024):**
  - Planned to run on natural gas because "EirGrid has confirmed that there is not sufficient capacity in the current network", "until such time that a connection to the EirGrid is established".
  - Applied for an EPA Industrial Emissions licence.
- **Pure DC (site unnamed):** campus "currently powered using natural gas and backup generators fuelled with HVO" — [TheJournal.ie, 28 Nov 2024](https://www.thejournal.ie/investigates-data-centres-6554698-Nov2024/)
- **Microsoft Dublin:** 170 MW on-site gas plant, described as standby but intended to run 8 h/day, 365 days/yr under the regulator's flexible demand policy. The site is in a grid-constrained area. EPA licence was under assessment (DCD, undated in text) — [DCD](https://datacenterdynamics.com/en/news/microsoft-planning-170mw-gas-power-plant-at-dublin-campus)

**UK**
- **Aggreko, London (2025):** a data centre needed three feeds but "only two were available" at commissioning.
  - **13 × 1,250 kVA PowerMX2 Stage V gensets on HVO (13 MW).**
  - Plus a 15 MVA temporary standby package at 20 kV (6 × 6.3 MVA transformers), 138,000 L fuel storage and a 5 MVA load bank.
  - Role: standby/redundant third feed during commissioning — [Aggreko case study PDF](https://bynder.aggreko.com/m/11dae7e0e1e41922/original/EUR-DC-GU-Case-Study-Providing-greater-resilience-at-a-critical-UK-Data-Centre.pdf)

**Netherlands**
- **Bredenoord:** backup generator service for Interconnect data centres (8,000 m²) for almost 15 years — [Bredenoord](https://www.bredenoord.com/en/)
- **NorthC Eindhoven** (owned, not rental): 6 × Jenbacher J420 = 6 MWe backup, dual natural gas/100% H2, built 2023 and commissioned 2024, with two more planned — [Jenbacher case study](https://www.jenbacher.com/en/?p=84932)
- **NorthC Groningen:** 500 kW hydrogen fuel-cell backup (2022) — [ComputerWeekly](https://www.computerweekly.com/news/366634477/Dutch-datacentre-growth-stalls-while-hydrogen-remains-untapped)

**Germany**
- No German data centre rental bridge project was found. Aggreko names Frankfurt as a grid-delayed market — [Aggreko blog](https://www.aggreko.com/en-gb/resources/gu-blog---bridging-power-solutions-for-data-centres)

**Worldwide**
- **APR, US:** 4 turbines delivering 100 MW at "one of the largest AI-focused US data centres", with talks on 6 more for the same customer (Mar 2025) — [Construction Briefing](https://www.constructionbriefing.com/apr-looks-to-cash-in-on-data-centre-power-gold-rush/8051948.article)
- **VoltaGrid–Vantage:** over 1 GW of prime power across North America (Feb 2025) — [Business Wire](https://www.businesswire.com/news/home/20250211912386/en/Vantage-Data-Centers-and-VoltaGrid-Establish-Partnership-to-Deploy-More-Than-One-Gigawatt-of-Power-Generation)
- **Crusoe, Abilene TX:** 1.21 GW on-site, including 29 × 42 MW Boom Superpower — [DCF](https://datacenterfrontier.com/energy/article/55358731/aeroderivative-turbines-move-to-the-center-of-ai-data-center-power-strategy). Also 13 × PE6000 = 650 MW from ProEnergy — [ProEnergy](https://www.proenergyservices.com/)
- **Equinix–Bloom:** over 100 MW of SOFC across US data centres (Feb 2025) — [EnkiAI (secondary)](https://enkiai.com/data-center/equinix-fuel-cell-backup-generation/)

### Inferences
- Irish bridges are typically 12 months or "several months", at 14–20 MW scale, and end on either a grid connection or the client's own permanent gas plant. That suggests rental bridges in Ireland often precede a permanent on-site gas solution rather than a grid connection.
- Load-bank testing and commissioning standby are a distinct, well-documented rental use: the London case pairs a 5 MVA load bank with a 15 MVA standby package.

### Gaps
- No verified Dutch, German, Nordic, Spanish, Portuguese, Italian or Polish data centre rental bridge projects. Aggreko and Cat dealer case libraries for those countries were not reached.
- The Aggreko Dublin client names are confidential.
- No EPA licence references were tied to temporary rental units. EPA licence PDFs appeared in search results but were not opened.

---

## 4. Rules that limit rental generation in Europe

### Takeaway
- **UK:** specified generator controls exempt *mobile* generators, but not if they do a static generator's job or stay in place for 6 months or more. A multi-month data centre bridge is therefore likely to need a permit.
- **Ireland:** the CRU now *requires* new data centres to bring on-site or nearby generation and/or storage. Gas connection and private wire rules are tightening, and Industrial Emissions licences apply to generator fleets.
- **Netherlands:** grid congestion, a hyperscale zoning ban, nitrogen/Natura 2000 permitting and a 300 MWth EIA trigger are the main constraints. No data centre-specific temporary generation rule was found.

### Cited Findings
**UK (England) – specified generator / MCP regime**
- Controls apply to generators of **1–50 MWth**.
- "Specified generator controls do not apply to a mobile generator that is designed to move or be moved." However, they **do apply if it "performs a function that a static generator could do"**. "If it's in place for 6 months or more the regulator will consider it to be functioning like a static generator."
- Exempt uses: planned maintenance, emergencies and construction sites.
- Data centre backup generators used when frequency is unstable are excluded if not under a formal agreement, but remain MCPs needing a permit. **Testing is capped at 50 h per generator per year.**
- Deadlines:
  - Tranche A 5–50 MWth units above 500 mg/Nm³ NOx and running over 50 h must comply by **1 Jan 2025**.
  - Tranche A 1–5 MWth units must be permitted by **1 Jan 2030**.
  - NOx reference: 500 mg/Nm³ — [GOV.UK specified generator guidance](https://www.gov.uk/guidance/specified-generator-when-you-need-a-permit)
- Squire Patton Boggs (Aug 2026) says data centre generators may need MCP and specified generator permits. The permit hinges on "aggregate thermal input, operating-hour assumptions" and abatement. UK ETS may apply to large combustion capacity. Developers should assess whether "temporary, or onsite power solutions create additional consenting risk", and may consider a Section 35 Planning Act 2008 direction — [Squire Patton Boggs, Aug 2026](https://www.squirepattonboggs.com/insights/publications/ai-data-centres-in-the-uk-environmental-permitting-and-consenting-risks/)
- UK demand connection queue grew **460% in the six months to June 2025**, with waits of up to 15 years (government figures cited) — [Enlit, Mar 2026](https://www.enlit.world/library/centrica-and-ceres-speed-up-fuel-cell-deployment-amid-uk-grid-delays)

**Ireland – CRU / EirGrid / gas**
- **Dec 2025 CRU electricity connection rules:**
  - New data centres must provide **generation and/or storage, on-site or nearby, matching their requested maximum import capacity**.
  - They must also meet **at least 80% of annual demand with additional Irish renewables**, with six years allowed to deliver it — [Data Centre Review, 8 Sep 2026](https://datacentrereview.com/?p=90522)
- **Gas connection proposal (Sep 2026):**
  - The CRU is *considering* making new gas connections **interruptible for customers with peak demand above 50 MWth**, with a tariff discount.
  - SEM-participating gas generators would be exempt.
  - 17 planned data centres have applied for gas connections, with combined peak demand equal to about six 500 MWe CCGTs. A 9–18% gas shortfall is possible in severe cold over the next six to seven years — [Data Centre Review, 8 Sep 2026](https://datacentrereview.com/?p=90522)
- **Earlier connection policy:** applications are assessed on whether a data centre can "at least cover its demand with onsite dispatchable generation or storage", whether it can offer flexibility, and its location relative to constraints. EirGrid said temporary emergency generation for the system was not feasible in the required timeframe — [Newpower](https://www.newpower.info/?p=10864)
- **Private wire policy (Sep 2025):**
  - A private wire to gas-burning stations may be allowed for a "time-limited period and in exceptional cases only".
  - The government's July proposal included a *temporary* private wire provision.
  - Legislation could take until end-2026 — [Irish Examiner, 16 Sep 2025](https://www.irishexaminer.com/business/economy/arid-41706677.html)
- **Moratorium and gas connections:**
  - EirGrid imposed a de facto moratorium on new data centre connections in early 2022 — [TheJournal.ie](https://www.thejournal.ie/investigates-data-centres-6554698-Nov2024/)
  - No new Dublin applications until 2028 — [DCD](https://datacenterdynamics.com/en/news/microsoft-planning-170mw-gas-power-plant-at-dublin-campus)
  - The minister told Gas Networks Ireland not to connect data centres powered mainly by on-site fossil generation — [DCD](https://datacenterdynamics.com/en/news/microsoft-planning-170mw-gas-power-plant-at-dublin-campus)
- **Licensing (secondary reporting):** data centres need an Industrial Emissions licence to run backup generators for **more than 18 h/yr**. 15 IE licences had been issued (13 in Dublin), and more than 800 emergency/backup generators appear across 24 GHG permits — [TheJournal.ie, Nov 2024](https://www.thejournal.ie/investigates-data-centres-6554698-Nov2024/)

**Netherlands**
- **Connection backlog and access:**
  - About 14,000 DSO applications (about 9 GW) and more than 200 TSO requests (about 38 GW). Some regions are suspended, with waits of up to 10 years.
  - Data centres have no priority.
  - Non-firm options include time-duration rights at about 85% availability, plus time-block and fully variable rights.
  - Connections of 60 MW or more must offer flexible capacity (GOPACS).
- **Hyperscale ban:** in force since **1 Jan 2024** for sites over 10 ha and at least 70 MW. The only exceptions are Hogeland and Hollands Kroon.
- **EIA trigger:** may apply where combined combustion capacity exceeds **300 MWth** (2024 Council of State ruling).
- Nature permits near Natura 2000 sites are hard to obtain because of the nitrogen crisis. **No specific temporary generation rule** was found (status about Jun 2026) — [Slaughter and May](https://www.slaughterandmay.com/services/practices/infrastructure-and-energy/power-and-place-a-regulatory-guide-to-data-centre-developments-in-europe/the-netherlands/)
- Amsterdam will consider new data centre applications only from **2035** — [ComputerWeekly](https://www.computerweekly.com/news/366634477/Dutch-datacentre-growth-stalls-while-hydrogen-remains-untapped)
- **The DSO itself is using temporary gas:**
  - Stedin's 60 MW mobile mtu fleet is in Utrecht until 2036 — [Enlit](https://www.enlit.world/library/stedin-taps-rolls-royce-mtu-gas-gensets-for-grid-stability)
  - Generators were placed at at least four Utrecht locations from Jul 2026 to run "a few days a year". TenneT reinforcement is due 2031 at the earliest — [NL Times, 21 Jul 2026](https://nltimes.nl/2026/07/21/gas-generators-placed-around-utrecht-emergency-measure-grid-congestion)

**Switzerland (precedent for noise/siting)**
- The temporary TM2500 reserve plant needed a 20 m perimeter noise wall near housing — [GE report](https://www.ge.com/news/reports/mobile-service-switzerland-is-shoring-up-its-energy-security-with-ges-brilliant-power-on)

### Inferences
- In the UK, a data centre bridge of 6 months or more using mobile gensets above 1 MWth aggregate should be planned as a **permitted specified generator/MCP**. That has emissions implications: gas units or SCR-equipped diesel/HVO are favoured.
- Ireland now effectively *mandates* on-site/nearby dispatchable capacity, so the rental market there serves the bridge until permanent on-site plant is ready (as in the Aggreko 20 MVA case). Gas supply curtailment risk above 50 MWth may push towards dual-fuel (gas + HVO) rental fleets.
- In the Netherlands, the DSO's own use of temporary gas units shows mobile gas is permit-able. For data centres, though, the hyperscale ban and nitrogen permitting are bigger constraints than generator rules.

### Gaps
- **EU MCPD (2015/2193) text not verified this run** †: 1–50 MWth scope, plus the "<500 h/yr" derogation for emergency/limited-use plant.
- **EU NRMM Regulation 2016/1628 Stage V not verified this run** †. Background: it covers generating sets, and the NRG category above 560 kW has PM/NOx limits. Whether large containerised gensets above 560 kW fall in scope for rental use should be checked.
- No German (BImSchG / 44. BImSchV) or Nordic/Iberian/Italian/Polish temporary generation rules were found.
- No case was found where *temporary* gas generation for a data centre was explicitly refused.
- The CRU Dec 2025 decision reference number was not retrieved.

---

## 5. Rental market trends 2025–2026

### Takeaway
Demand is surging and capacity is being absorbed by US AI campuses:
- **Aggreko:** Europe revenue up 26% in H1 2025, with fleet capex up about 58%.
- **APR:** grew to 1.1 GW, then was reportedly bought by Musk.
- **VoltaGrid:** 1.5 GW of engines on order for 2028 delivery.

New turbine lead times of 2–3 years make rental and existing mobile fleets scarce. Suppliers are adding grid-code-certified gas, larger battery containers (1 MW / 1.2 MWh) and hydrogen hire (GeoPura via Sunbelt; the Ballard acquisition).

### Cited Findings
- **Aggreko H1 2025** (Albion JVCo):
  - Revenue US$1,496m (+17% reported, +19% underlying). Adjusted EBITDA US$565m.
  - **Europe revenue US$322m (+26%)**, helped by the 2024 Resalta acquisition, with growth in data centres.
  - Fleet investment **US$457m (vs US$290m)**.
  - No fleet MW or pricing commentary — [Aggreko H1-25 statement](https://edge.sitecorecloud.io/aggrekoukli7a45-corporatesiaac7-production07bc-79cd/media/investordocuments/2025/albion-jvco---q2-25-results-statement.pdf)
- **Aggreko grid-code compliance** for its 1.5 MW gas generator fleet in 11 European markets (Sep 2026) — [IT Brief](https://itbrief.co.uk/story/aggreko-wins-grid-compliance-in-11-european-markets). The same outlet ran "Aggreko invests in liquid-cooled load banks for AI sites" (headline only; the article could not be fetched).
- **APR Energy:**
  - Fleet grew from 850 MW to over 1.1 GW (Jan 2026) — [APR PR](https://energydigital.com/globenewswire/3219412)
  - Turbine margins are higher than diesel margins; new-turbine lead time is 2–3 years — [Construction Briefing](https://www.constructionbriefing.com/apr-looks-to-cash-in-on-data-centre-power-gold-rush/8051948.article)
  - Reported acquisition by Musk (~US$1bn, May–Jul 2026) — [Not a Tesla App](https://www.notateslaapp.com/news/4451/elon-musk-buys-gas-turbine-company-in-1-billion-deal)
- **Aeroderivative supply:** "extended waits for new units" — [Data Center Frontier, Feb 2026](https://datacenterfrontier.com/energy/article/55358731/aeroderivative-turbines-move-to-the-center-of-ai-data-center-power-strategy)
- **VoltaGrid:** 1.5 GW Jenbacher order, delivery **2028** — [Enlit, Feb 2026](https://www.enlit.world/library/voltagrid-orders15gw-for-behind-the-meter-power-from-innio)
- **Atlas Copco:** launched the 1 MW / 1.2 MWh ZBC 1000-1200 (Apr 2025), its largest rental battery — [IRN](https://internationalrentalnews.com/news/atlas-copco-rolls-out-zbc-1000-1200-energy-storage-system/8054954.article)
- **Hydrogen hire:**
  - Sunbelt UK & IE–GeoPura partnership (May 2026) — [RER](https://www.rermag.com/news-analysis/headline-news/article/55375992/sunbelt-rentals-uk-ireland-partners-with-geopura-to-provide-hyrogen-power)
  - Ballard acquired GeoPura (earn-out tied to £28m 2026 revenue) — [gasworld](https://www.gasworld.com/story/ballard-closes-acquisition-of-uk-hydrogen-generator-firm-geopura/2258341.article/)
  - GeoPura targets 1,000 units over five years — [Bdaily](https://www.bdaily.co.uk/articles/2026/03/15/driving-a-step-change-in-sustainable-energy-provision)
- **Fuel cells for data centres:** Centrica–Ceres (Mar 2026) and Centrica–Delta (May 2026) SOFC offers — [Enlit](https://www.enlit.world/library/centrica-and-ceres-speed-up-fuel-cell-deployment-amid-uk-grid-delays); [DI News](https://digitalinfrastructure.news/news/22279-centrica-and-delta-launch-scalable-offgrid-fuel-cell-power-solution-for-data-centres)
- **Grid operators are competing for the same mobile gas capacity:** Stedin (NL) 60 MW of mobile mtu gensets until 2036 — [Enlit](https://www.enlit.world/library/stedin-taps-rolls-royce-mtu-gas-gensets-for-grid-stability)
- **Headline only (not fetched):** Rehlko and INNIO entered a multi-year engine framework agreement, reported as 1.25 GW — [Clarke Energy US news link](https://www.clarke-energy.com/us/2026/rehlko-innio-enter-into-multi-year-engine-framework-agreement/); [idcnova](https://www.idcnova.com/html/1/59/153/5525.html)

### Inferences
- Gas engine and aeroderivative capacity is being locked up by US hyperscale/AI buyers through 2028 (VoltaGrid, Crusoe, the Musk–APR deal). European developers should expect long lead times and limited availability for turbine-class rental. Aggreko-type 1–1.5 MW gas modules and Cat dealer fleets are the more available European options.
- Rental prices are likely rising given strong demand, higher margins on turbines and constrained supply. **However, no source quantified price trends**, so this is an inference only.

### Gaps
- No quantified rental price or utilisation trend data for Europe (per kW-month, per day, per MWh).
- No 2025–26 data for Atlas Copco Power & Flow segment rental fleet growth, Ashtead/Sunbelt UK power fleet, Loxam, Kiloutou, Boels or Speedy.
- Aggreko's FY2025 results and 2026 interim figures were not retrieved; only H1 2025 was.
- Shortage reports specific to Europe (e.g. gas genset waiting lists) were not found.
