# Fuel cell systems for data centre prime, bridge and backup power (status as of Nov 2026)

Conventions used in these notes:
- **[primary]** = manufacturer datasheet, SEC filing, company press release, regulator or DOE page.
- **[secondary]** = trade press or aggregator restating a primary source; treat with more caution.
- **[calc]** = my own arithmetic from cited figures, not a published number.
- **[claim]** = manufacturer marketing claim not independently verified.
- Dates are given for every figure that is older than 2026 or where the publication date matters.
- Research date: 13 Nov 2026. Bloom's Q3 2026 results (22 Oct 2026) and FuelCell Energy's Q3 FY2026 results (1–2 Sep 2026) are the latest primary financial sources used.

---

## 1. Which manufacturers and products matter for a European data centre campus?

### Takeaway
At scale there are really only three commercial routes in 2026. **Bloom Energy SOFC** (natural gas, 325 kW building block) dominates prime and bridge power: it has GW-scale US contracts and a CE-marked 50 Hz/400 V product. **FuelCell Energy carbonate** (1.25 / 2.5 / 12.5 MW blocks) and **Doosan/HyAxiom PAFC** (440 kW) are the other natural-gas or hydrogen prime-power options with real data centre orders in 2026. **PEM hydrogen** systems (Ballard, Plug, PowerCell, Nedstack, GeoPura) remain at the pilot or early-order stage for backup and off-grid prime. Ceres-licensed SOFC (Doosan, Delta) is still pre-commercial for data centres; Europe gets a UK demonstrator first and MW-scale systems in roughly 3–5 years.

### Cited Findings

**Bloom Energy (SOFC, US)**
- Current product: Bloom Energy Server 6.5, 325 kW nameplate net AC per unit. Natural gas is the listed fuel; blended hydrogen, biogas or 100% hydrogen are available "contact Bloom" options — [Bloom datasheet Feb 2026, primary](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)
- A separate hydrogen datasheet exists. I found it but did not extract it — [Bloom hydrogen data sheet](https://www.bloomenergy.com/wp-content/uploads/hydrogen-data-sheet.pdf)
- CHP and CCHP (heat capture, absorption cooling) variants were published Sep 2025 — [Bloom CCHP datasheet 9.29.25](https://www.bloomenergy.com/wp-content/uploads/EnergyServer-CCHP_Datasheet_9.29.25.pdf); [Bloom CHP-S datasheet](https://www.bloomenergy.com/wp-content/uploads/EnergyServer-CHP-S_Datasheet_9.29.25.pdf)
- Bloom is promoting 800 V DC native output for AI data centres. The CEO claimed a "gigawatt data center will save over $5 billion" over 5 years with 800 V DC; no product timing given [claim] — [Bloom Q3 2026 call transcript, Motley Fool, 22 Oct 2026](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/); [Business Wire, 16 Sep 2026](https://secure.businesswire.com/news/home/20260916878071/en/Bloom-Energys-800V-DC-Native-Power-Can-Cut-Billions-from-AI-Data-Center-Costs-Reduce-Power-Use-and-Eliminate-Need-for-Transformers)
- Bloom has 700 MW of "carbon capture-enabled servers" in the AEP/Google context, and the CEO says hyperscalers would accept a "10% to 15% cost" premium for zero-carbon power — [Q3 2026 call transcript](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)

**FuelCell Energy (molten carbonate, US/Korea)**
- Products for data centres: "FuelCell Energy Block Systems" at 1.25 MW, 2.5 MW and 12.5 MW nameplate — [FCE data centers page, primary](https://www.fuelcellenergy.com/industries/data-centers)
- FCE claims to be the only fuel cell maker with demonstrated plants over 10, 20 and 58 MW running for more than 5 years. It had 188 modules in operation as of March 2025, with average age over 7 years for large plants. References include the 58.8 MW Gyeonggi Green Energy park and the 14.9 MW Bridgeport park — [FCE data centers page](https://www.fuelcellenergy.com/industries/data-centers)
- The SOFC programme has been effectively wound down: a $64.5M impairment on "prior investments in solid oxide technology" was taken in the prior-year period — [FCE Q3 FY2026 release, 1 Sep 2026, primary](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)
- FCE has an MoU with Siemens for Siemens to design and supply electrical balance of plant for "100+ MW commercial projects" — [FCE Q3 FY2026 release](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)

**Doosan Fuel Cell / HyAxiom (PAFC, Korea/US; SOFC via Ceres licence)**
- PureCell Model 400 (hydrogen version): 440 kW / 517 kVA, 480 VAC 60 Hz, hydrogen ≥99.9% purity — [HyAxiom PureCell M400 Hydrogen datasheet, CES 2024, primary](https://www.doosan.com/images/media-center/ces2024/(Data%20Sheet)%20HyAxiom%20PureCell%20Model%20400%20Hydrogen.pdf)
- Doosan SOFC uses Ceres technology. In Aug 2026 Doosan exported SOFC stacks to Reverion GmbH (Germany), described as "Doosan's largest overseas contract to date" and "the largest export order for Ceres-derived SOFC technology" — [Ceres newsroom, 11 Aug 2026, primary](https://ceres.tech/newsroom/news-and-insights/doosan-fuel-cell-and-reverion-sign-large-scale-supply-agreement/)

**Ceres Power licensees (SOFC)**
- Delta Electronics (Ceres licensee) and Centrica are partnering to deploy SOFC systems in Europe for data centre and industrial sites with grid constraints. Plan: a UK demonstration facility "within the next year", then "megawatt-scale" systems within 3–5 years. No MW, kW or efficiency figures given — [Hydrogen Europe (restating Centrica/Delta announcement, c. Apr–May 2026), secondary](https://hydrogeneurope.eu/centrica-looks-to-delta-for-sofc-systems-for-european-data-centres-and-industry/)

**PEM hydrogen suppliers**
- Ballard: FCmove-HD+ modules at 100 kW each. A June 2026 order covers 150 modules (15 MW) for an off-grid genset company (events, construction, critical infrastructure; data centres not mentioned), with deliveries from H2 2026. Ballard states its stationary offerings range from 100 kW modules to multi-MW, for prime, peak and backup — [Hydrogen Central restating Ballard PR of 15 Jun 2026, secondary](https://hydrogen-central.com/ballard-announces-order-for-15-mw-in-the-stationary-power-market/)
- Ballard also supplied the 1.5 MW fuel cell for the Microsoft/Caterpillar Cheyenne demonstration (Jan 2024) — [Caterpillar PR, primary](https://www.cat.com/en_US/news/engine-press-releases/caterpillar-demonstrates-viability-of-using-hydrogen-fuel-cell-technology-for-backup-power-at-microsoft-data-center.html)
- Plug Power: 125 kW PEM units. Microsoft's 3 MW prototype (2022) used two 40 ft containers, each holding 18 × 125 kW fuel cells — [DCD, 2022](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant). As of Aug 2026 the Microsoft collaboration "hasn't yet amounted to a deal". Plug is "exploring" data centre opportunities with Stream U.S. Data Centers but no fuel cell order is disclosed — [Motley Fool, 16 Aug 2026, secondary](https://www.fool.com/investing/2026/08/16/plug-power-backup-power-system-microsoft-ceo/)
- PowerCell (Sweden; Bosch is manufacturing partner and largest shareholder): PS190 containerised systems. A firm order from ECL (MW not stated in release) plus a non-binding MoU for about 300 MW, with the first deployment at ECL's 35 MW CSC-1 campus in Santa Clara — [Business Wire, 14 Jul 2026, primary](https://www.businesswire.com/news/home/20260714813440/en/)
- Nedstack (Netherlands): PEM stationary systems. Its 500 kW backup system at NorthC Groningen is modular in 500 kW steps up to 1.5 MW — [Nedstack project page, Sep 2023, primary](https://www.nedstack.com/projects/northc-hydrogen-backup)
- GeoPura (UK): containerised PEM hydrogen generators. Two units (0.5 MW total) were trialled at Equinix DB3 Dublin in June 2026 — [Equinix press release, 19 Jun 2026, primary](https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre)

**Mitsubishi Heavy Industries (SOFC–micro gas turbine hybrid, "MEGAMIE")**
- 250 kW-class SOFC/MGT hybrid on city gas. Marketing began in summer 2017, and the first commercial site (Marunouchi, Tokyo) was due for operation in Feb 2019. No data centre deployments found. 2019 data — [Modern Power Systems, 3 Jan 2019](https://modernpowersystems.com/features/featureintroducing-megamie-7058742/)

**Cummins Accelera**
- Search results show Cummins took a ~$240M charge and is reassessing its *electrolyser* business. I found no evidence of an active stationary fuel cell data centre product in 2026. Headline only, not fetched — [Hydrogen Fuel News](https://www.hydrogenfuelnews.com/cummins-reassesses-hydrogen-production-amid-240m-electrolyzer-charge/8573809)

### Inferences
- For a European campus, only Bloom currently offers a CE-marked, 50 Hz, 400/415 V product with a published datasheet at GW-order scale (see Q6). FCE and Doosan products in the data centre context are US/Korea-focused; the Doosan M400 datasheet is 480 V/60 Hz only.
- PEM suppliers are credible for backup and peak/off-grid hydrogen gensets in 100 kW–1.5 MW blocks. None has a European data centre deployment above 0.5 MW that I could find.
- Ceres-derived SOFC (Delta, Doosan) is the main European-origin SOFC route, but data centre-scale products are 2027–2030 at the earliest, going by the Centrica/Delta timeline.

### Gaps
- No usable sourced data found for: Toshiba (H2Rex), Siemens Energy (no stationary fuel cell product identified; Siemens AG's role is FCE balance of plant), Power Innovations (likely the supplier of Microsoft's 2020 250 kW 48-hour test, but the supplier was not named in the source I fetched), Proton Motor, Hyundai (HTWO stationary), SOLIDpower (only small-scale BlueGEN products are known; no data centre product found), Shell and Thermax (Ceres licensees, no data centre activity found).
- Ballard's reported acquisition of GeoPura appears only in aggregator headlines (enkiai.com) with inconsistent values (~$400M vs $515M). It is **unverified** and I could not confirm it from a primary source.
- PowerCell launched "hydrogen power systems for data centres backup". Only the headline was seen, not specs — [Hydrogen Europe](https://hydrogeneurope.eu/powercell-unveils-hydrogen-power-systems-for-data-centres-backup/)

---

## 2. Per-product performance: efficiency, degradation, start-up, load following, emissions, water, footprint

### Takeaway
Bloom's datasheet efficiency is 65% LHV falling to 53% over the module's life (cumulative). Independent analysis of US and Korean meter data shows real fleets start near 51–52% HHV (≈57–58% LHV [calc]) and drop about 4–5 points within two years. Stacks are replaced roughly every 5 years (Bloom) or every 2–4 years (projection from data in a short-seller report). Natural gas SOFC emits about 308–378 kg CO₂/MWh with negligible NOx and no water use. Footprint is about 3 units per MW. SOFC/MCFC/PAFC are prime-power machines that need supercapacitors or BESS for AI step loads. PEM starts in seconds to about 90 s and suits backup, but it still uses batteries to cover the first seconds.

### Cited Findings

**Per-product summary table** (blank or "n/s" = not stated in any source found)

| Manufacturer | Product | Technology | Fuel | Module size kW | Efficiency % LHV | Start time | Load following | Footprint | Stack life | Notes / source |
|---|---|---|---|---|---|---|---|---|---|---|
| Bloom Energy | Energy Server 6.5 | SOFC (~high temp) | NG; H₂ / biogas / blends on request | 325 | 65 → 53 (cumulative, net AC) | n/s in datasheet | Yes, with supercapacitors; 40→100% step demonstrated (Feb 2024) | 9.0 × 1.3 × 2.5 m, 13 t per unit; ≈28 kW/m² unit-only [calc] | Median 4.9 yr (2014–15 cohort), max 7.7 yr (Bloom, 2020/2025); 2–4 yr projected by Hunterbrook (short seller) | CE, UL 1741, FC1, CARB DG-058; 400/415/480 V, 50/60 Hz; NOx 0.001 kg/MWh; CO₂ 308–378 kg/MWh; no water in normal operation; >36% thermal recovery at >350 °C. [Datasheet](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf), [load-following paper](https://www.bloomenergy.com/wp-content/uploads/load-following-solid-oxide-fuel-cell.pdf), [life blog](https://www.bloomenergy.com/blog/reaching-new-milestones-in-the-field-proven-bloom-energy-server-longevity-and-reliability/), [Hunterbrook](https://newsletter.hntrbrk.com/p/do-blooms-fuel-cells-work-as-claimed) |
| FuelCell Energy | FCE Block System (1.25 / 2.5 / 12.5 MW) | Molten carbonate (MCFC) | NG, biogas; H₂ "future" | 1,250 (module) / 12,500 (block) | n/s on current pages | n/s | n/s | n/s | n/s | Fleet of 188 modules; largest park 58.8 MW. "No combustion – avoids need for air permits" (US). [FCE](https://www.fuelcellenergy.com/industries/data-centers) |
| Doosan / HyAxiom | PureCell Model 400 (H₂) | PAFC | H₂ ≥99.9% (NG version also exists) | 440 | 50 (first-year average); ~42 HHV [calc]; 90 total CHP | n/s | "Dynamically ramp up & down"; no rate | Power module 8.95 × 2.62 × 3.04 m (22.4 t) + cooling module 4.85 × 2.39 m; typical install area 30 × 40 ft (≈111 m²) | "10-year cell stack life" [claim] | Zero CO₂/NOx on H₂; no water consumption; 352 kW heat at up to 121 °C; −29 to 40 °C; 480 V/60 Hz. [Datasheet](https://www.doosan.com/images/media-center/ces2024/(Data%20Sheet)%20HyAxiom%20PureCell%20Model%20400%20Hydrogen.pdf) |
| Plug Power | 125 kW PEM unit (Microsoft 3 MW prototype) | PEM | H₂ | 125 | n/s | "in seconds" (secondary) | Batteries bridge start-up | 3 MW in 2 × 40 ft containers (36 × 125 kW = 4.5 MW gross [calc]) | n/s | 2022 prototype; no Microsoft deal as of Aug 2026. [DCD](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant), [Fool](https://www.fool.com/investing/2026/08/16/plug-power-backup-power-system-microsoft-ceo/) |
| Ballard | FCmove-HD+ (in stationary gensets); 1.5 MW system for Microsoft/Cat | PEM | H₂ | 100 | n/s | n/s | Microsoft/Cat system paired with 2 × Cat PGS 1260 BESS | n/s | n/s | [Hydrogen Central](https://hydrogen-central.com/ballard-announces-order-for-15-mw-in-the-stationary-power-market/), [Cat PR](https://www.cat.com/en_US/news/engine-press-releases/caterpillar-demonstrates-viability-of-using-hydrogen-fuel-cell-technology-for-backup-power-at-microsoft-data-center.html) |
| PowerCell | PS190 (containerised) | PEM | H₂ | n/s (name suggests ~190 kW, unverified) | n/s | n/s | Integrated with ECL microgrid controller | n/s | n/s | Bosch manufacturing. [Business Wire](https://www.businesswire.com/news/home/20260714813440/en/) |
| Nedstack | Stationary PEM system (NorthC) | PEM | Green H₂ | 500 per block (to 1.5 MW) | n/s | "Fast start" (no figure) | n/s | Containerised, rooftop | n/s | Nedstack production 10 MW/yr. [Nedstack](https://www.nedstack.com/projects/northc-hydrogen-backup), [DCD](https://datacenterdynamics.com/en/marketwatch/fuel-cells-set-to-take-off-from-2027) |
| GeoPura | H₂ power unit (container) | PEM | Green H₂ | ~250 per container (2 units = 0.5 MW) [calc] | n/s | n/s | Works through UPS | Shipping-container size | n/s | [Equinix PR](https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre) |
| MHI | MEGAMIE SOFC + micro GT hybrid | SOFC hybrid | City gas | 250-class | n/s | n/s | n/s | n/s | n/s | 2019 data; Japan only. [MPS](https://modernpowersystems.com/features/featureintroducing-megamie-7058742/) |
| Delta (Ceres licensee) | SOFC system (in development) | SOFC | n/s | n/s | n/s | n/s | n/s | n/s | n/s | UK demo ~2027; MW-scale in 3–5 yrs. [Hydrogen Europe](https://hydrogeneurope.eu/centrica-looks-to-delta-for-sofc-systems-for-european-data-centres-and-industry/) |

**Bloom detail**
- Efficiency: "65-53%" cumulative electrical efficiency (LHV, net AC). Heat rate 6,131–7,519 kJ/kWh (HHV). Total efficiency >90% with heat recovery; exhaust >350 °C — [Bloom datasheet Feb 2026](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)
- Fuel supply pressure 12–18 psig (15 nominal); noise <65 dBA at 3 m; operating range −20 to 45 °C; seismic ASCE7 SDC D — [Bloom datasheet Feb 2026](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)
- Load following: tests show 40% → 100% step changes meeting ITIC, IEC 62040 and SEMI power quality. This used "an inverter and supercapacitors", with the supercapacitors supplying instantaneous power while the stacks ramp. A simulated AI load step of 2000%/min was used. No native fuel cell ramp rate was published — [Bloom load-following white paper, Feb 2024, primary](https://www.bloomenergy.com/wp-content/uploads/load-following-solid-oxide-fuel-cell.pdf)
- Module life: the 2014–15 cohort had a "median recorded life of 4.9 years", with a maximum of 7.7 years. Over 900 modules exceeded 5 years. Modules swap on site "in under an hour". Fuel cell life is up >2.5× and power density 5× vs first generation — [Bloom blog, 2020, updated Aug 2025](https://www.bloomenergy.com/blog/reaching-new-milestones-in-the-field-proven-bloom-energy-server-longevity-and-reliability/)
- Independent challenge (Hunterbrook Media, 30 Jul 2026; **its affiliate holds a short position in Bloom**). The figures below are HHV basis:
  - New York: 37 systems averaged 52.0% new; all fell below the 46.9% guarantee line at a median of 20 months; average decline ~2.4 points/yr.
  - California SGIP: 231 projects, median 55.6% in the first 3 months falling to 47.9% in years 3–5.
  - EIA national: 126 plants, ~51% new falling to ~47% within 2 years.
  - Output: the median California project averaged ~84% of nameplate vs Bloom's 95% benchmark.
  - Stack life: Bloom told investors "over five years"; Hunterbrook projects 2–4 years in New York (estimate).
  - Bloom's accrued warranty liability rose from $20.0M (31 Dec 2025) to $77.8M (30 Jun 2026), which Bloom attributed to fleet degradation. Performance payments were $18M in 2025.
  - Source: [Hunterbrook, 30 Jul 2026, secondary/adversarial](https://newsletter.hntrbrk.com/p/do-blooms-fuel-cells-work-as-claimed)
- The Bloom CEO claims CHP heat reuse for cooling can cut "20% of your power demand" [claim] — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)

**Generic and DOE references**
- DOE stationary CHP fuel cells (100 kW–3 MW, natural gas):
  - 2015 status: electrical efficiency 42–47% LHV; CHP 70–90%; lifetime 40,000–80,000 h (to >10% power loss); availability 95%.
  - 2020 targets: >50% LHV and 80,000 h.
  - The page has no 2030 targets, start-up time or degradation figures.
  - Source: [DOE technical targets page (2015 status, updated 2019), primary](https://www.energy.gov/eere/fuelcells/doe-technical-targets-fuel-cell-systems-stationary-combined-heat-and-power)
- DOE data centre workshop (2019, UC Irvine/Brouwer):
  - PEM: cold start-up of 90 s (system on at t=30 s, load met at t=120 s), with a battery covering load steps.
  - SOFC: >52% electrical efficiency; "ramp rate of 1 A/s achieved" on a test stack.
  - Small lab systems, 2019 data.
  - Source: [DOE FCTO workshop 2019, primary](https://www.energy.gov/sites/prod/files/2019/04/f62/fcto-data-center-workshop-2019-brouwer.pdf)
- PEM vs SOFC start-up: batteries bridge the gap while fuel cells start, and "PEM cells start faster than SOFCs" (Microsoft, 2022) — [DCD](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant)
- Plug/Microsoft 3 MW system "ramps up in seconds" in simulated outages — [Motley Fool, Aug 2026, secondary](https://www.fool.com/investing/2026/08/16/plug-power-backup-power-system-microsoft-ceo/)

**Modules per MW and footprint** [calc from datasheets]
- Bloom ES 6.5 (325 kW): **3.08 units per MW**. The unit-only footprint of 11.7 m² gives ≈36 m²/MW (≈28 kW/m²) excluding access aisles, gas skid and transformers — [datasheet](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)
- Doosan PureCell M400 (440 kW): **2.27 units per MW**. Typical installation area 30 × 40 ft ≈ 111 m² per unit, so ≈253 m²/MW (≈4 kW/m²) including interface equipment — [datasheet](https://www.doosan.com/images/media-center/ces2024/(Data%20Sheet)%20HyAxiom%20PureCell%20Model%20400%20Hydrogen.pdf)
- FCE: 0.8 × 1.25 MW modules per MW; 12.5 MW blocks are the data centre building unit (e.g. 6 blocks = 75 MW Texas project) — [FCE Q3 FY2026](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)
- Plug 125 kW: 8 units per MW net (Microsoft used 12 per MW gross for N+ margin [calc: 36 units for 3 MW]) — [DCD](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant)
- Ballard FCmove-HD+ 100 kW: 10 modules per MW (modules only) — [Hydrogen Central](https://hydrogen-central.com/ballard-announces-order-for-15-mw-in-the-stationary-power-market/)
- Nedstack: 2 × 500 kW blocks per MW — [Nedstack](https://www.nedstack.com/projects/northc-hydrogen-backup)

**Emissions and water**
- Bloom on natural gas: CO₂ 308–378 kg/MWh; NOx 0.001 kg/MWh; SOx negligible; no water during normal operation — [datasheet](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)
- Doosan PAFC on H₂: zero CO₂, NOx, SOx, CO and VOC; water consumption "None" — [datasheet](https://www.doosan.com/images/media-center/ces2024/(Data%20Sheet)%20HyAxiom%20PureCell%20Model%20400%20Hydrogen.pdf)
- PEM on H₂: only water and heat as by-products; zero direct on-site emissions — [Equinix PR](https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre)

### Inferences
- For design, use about **53–58% LHV as a realistic life-average** for Bloom on natural gas rather than the 65% beginning-of-life figure. The datasheet range (65→53%) and independent meter data (~57–58% LHV new falling to ~52% LHV within 2 years [calc, HHV/0.9 conversion for natural gas]) broadly agree on the lower end.
- SOFC/MCFC/PAFC should be treated as **always-on prime or bridge power**, not standby. None of the sources gives a cold-start time for high-temperature fuel cells, and Bloom itself relies on supercapacitors for step loads. AI training load swings will need a BESS or supercapacitor layer sized for the step, plus N+1 or N+2 module redundancy.
- Plant heat-to-power: Bloom's >36% thermal output at >350 °C makes absorption chilling (CCHP) technically credible for the cooling plant. Doosan's 121 °C heat is lower grade.
- PEM hydrogen is the only fuel cell type credibly positioned as a **diesel-genset replacement for backup**: seconds to ~90 s start, with a UPS or BESS bridging. The binding constraints are hydrogen storage and logistics plus cost.

### Gaps
- No primary source found for SOFC or MCFC **cold-start or hot-standby times** (industry knowledge suggests many hours to days for SOFC heat-up, but this is unsourced here). Bloom's datasheet is silent.
- No published **ramp rate in kW/s or %/min** for Bloom, FCE or Doosan.
- FCE's current module **efficiency, footprint and water figures** are not on the current product pages. The older SureSource datasheets were not retrieved.
- PEM product efficiencies (Ballard, Plug, PowerCell, Nedstack) not found in sources retrieved.
- No source gave **MW per hectare** for full plants including gas and electrical balance of plant.

---

## 3. Real data centre deployments and orders (2023–2026)

### Takeaway
2025–26 saw fuel cells move from pilots to GW-scale prime and bridge power contracts, almost all in the US and almost all Bloom:
- Bloom: AEP ~900 MW for $2.65bn; Oracle up to 2.8 GW; Nebius 328 MW; Equinix >100 MW; Brookfield $5bn financing.
- FuelCell Energy: Fit Energy up to 380 MW, plus a 75 MW Texas reservation.
- Doosan: a ~₩500bn US data centre PAFC order (Sep 2026).

European data centre deployments remain small hydrogen PEM backup pilots: NorthC Groningen 500 kW (2023) and Equinix Dublin 0.5 MW (2026).

### Cited Findings

**Bloom Energy**
- Oracle: initial deal (24 Jul 2025) to deliver on-site power "for an entire data center within 90 days" [claim]. At that time Bloom had >400 MW deployed to data centres worldwide and 1.5 GW across >1,200 installations — [Bloom PR, 24 Jul 2025, primary](https://www.bloomenergy.com/news/oracle-and-bloom-energy-collaborate-to-deliver-power-to-data-centers-at-the-speed-of-ai/)
- Oracle expanded agreement: up to 2.8 GW (reported Apr 2026) — [Hydrogen Fuel News, 13 Apr 2026, secondary](https://www.hydrogenfuelnews.com/fuel-cell-capacity-growth-bloom-energys-expanded-deal-with-oracle/8575599/)
- Oracle Utah site: power delivered "in less than 2 months" (CEO, Oct 2026) — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)
- AEP: $2.65bn purchase of ~900 MW SOFC (exercising part of a Nov 2024 option of up to 1 GW) for a facility near Cheyenne, Wyoming. There is a 20-year offtake with an unnamed "high investment grade" customer, and closing conditions were expected by Q2 2026 — [Fintool restating AEP filing, 8 Jan 2026, secondary](https://fintool.com/news/bloom-energy-aep-2-65-billion-fuel-cell-deal)
- AEP/Google: Bloom CEO referenced "700 MW of carbon capture-enabled servers" — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/). Note: the AEP initial order was 100 MW under the 2024 GW-scale agreement — [mgrid.org, Feb 2026, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)
- Nebius (European-headquartered AI cloud, **US sites**): up to $2.6bn in service fees over 10 years; 250 MW of Bloom power for Nebius US data centres, 328 MW total installed under the deal (21 May 2026) — [Pulse/CNBC, secondary](https://www.pulse.bot/energy/news/bloom-energy-rises-12-after-partnering-with-european-ai-infrastructure-upstart-in-26-billion-deal-42cb17a9-9ea4-4527-a5f1-f2bd161b4c65/)
- Nebius New Jersey: planning approvals "within 3 months of signing the contract", with the first power block ready ~2 months after approval; "300 MW" referenced; "servers ready for the 300 MW" — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)
- Equinix: expanded 10-year agreement surpassing 100 MW of colocation deployments (US) — [mgrid.org, Feb 2026, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)
- CoreWeave: Bloom installations at AI cloud facilities in Illinois (no MW given) — [mgrid.org, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)
- Brookfield: $5bn strategic partnership (Oct 2025) — [mgrid.org, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/); Brookfield "ventures" referenced in [Bloom Q3 2026 8-K, primary](https://www.sec.gov/Archives/edgar/data/0001664703/000162828026066890/ex991_q326financialresults.htm)
- Other: U.S. Army installations via partner Indelible (conditional leases); first Texas units shipping Q3 2026; Bloom is "in the 100 megawatt class already" for US deployments, with its largest systems "approaching the gigawatt scale" — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)

**FuelCell Energy**
- Fit Energy: capital equipment purchase agreement for up to 380 MW "to supply baseload electricity for data center applications". Phase 0 is 30 MW (committed, delivery expected Q4 FY2026, i.e. Aug–Oct 2026). Phases 1–3 are 100/125/125 MW (awarded; Fit holds the option) — [FCE Q3 FY2026 release, primary](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)
- First data centre power agreement: an unnamed "major data center operator", planned 75 MW in Texas using 6 × 12.5 MW Block systems. It is a Capacity Reservation Agreement with an upfront payment (announced 2 Sep 2026); no delivery date — [FCE Q3 FY2026 release](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)

**Doosan Fuel Cell**
- US PAFC order "for data centers" worth ~₩500bn, with deliveries starting March 2027. The US supply price is reportedly higher than in Korea (DS Investment & Securities analyst view, Sep 2026) — [Financial News Korea, 3 Sep 2026, secondary](https://en.fnnews.com/news/202609030758521237)

**Hydrogen PEM pilots and backup**
- Microsoft/Caterpillar/Ballard, Cheyenne WY: 1.5 MW hydrogen fuel cell plus 2 × Cat PGS 1260 BESS and a Cat microgrid controller. It completed a simulated 48-hour backup event at 1,855 m altitude in below-freezing conditions, with NREL analysing safety, TEA and GHG (announced 19 Jan 2024) — [Caterpillar PR, primary](https://www.cat.com/en_US/news/engine-press-releases/caterpillar-demonstrates-viability-of-using-hydrogen-fuel-cell-technology-for-backup-power-at-microsoft-data-center.html)
- Microsoft/Plug, Latham NY: 3 MW PEM backup prototype run through Microsoft's diesel-genset acceptance tests (2022). An earlier 250 kW PEM test ran 48 hours (2020). Microsoft's goal is to eliminate diesel from backup by 2030 — [DCD](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant)
- ECL (US): MV-1 Mountain View has used hydrogen as the primary power source for >2 years. Next is CSC-1 Santa Clara (35 MW) with PowerCell PS190, plus a ~300 MW non-binding MoU (Jul 2026) — [Business Wire, 14 Jul 2026](https://www.businesswire.com/news/home/20260714813440/en/)
- ECL also announced a 1 GW off-grid hydrogen "AI factory" on 600 acres near Houston (TerraSite-TX1). Headline only, not fetched — [Data Center Frontier](https://www.datacenterfrontier.com/sustainability/article/55233745/ecl-debuts-1-gw-off-grid-hydrogen-powered-ai-factory-data-center-on-600-acres-near-houston)

**European data centre deployments**
- **Equinix DB3, Blanchardstown, Dublin (Ireland):**
  - Two GeoPura PEM hydrogen generators (one owned by ESB) giving up to 0.5 MW continuous.
  - Supports cooling systems as critical backup via UPS.
  - 12-week pilot announced 19 Jun 2026, with green hydrogen supplied by GeoPura.
  - Results (carbon, operations, safety, peak-shaving) not yet reported.
  - Source: [Equinix PR, primary](https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre)
- **NorthC Datacenters, Groningen (Netherlands):** 500 kW Nedstack PEM backup system replacing diesel, modular to 1.5 MW, on green hydrogen; project dated Sep 2023 — [Nedstack, primary](https://www.nedstack.com/projects/northc-hydrogen-backup)
- **Germany:** the Doosan → Reverion SOFC stack order is for "Reverion facilities across Germany and Europe" (clean power plants, application not specified, not stated as data centres) — [Ceres, 11 Aug 2026](https://ceres.tech/newsroom/news-and-insights/doosan-fuel-cell-and-reverion-sign-large-scale-supply-agreement/). Value ≈ ₩108.7bn (≈£60M) — [Investegate RNS summary (AI-generated summary on page; verify against RNS)](https://www.investegate.co.uk/announcement/rns/ceres-power-holdings--cwr/doosan-fuel-cell-sofc-order-with-reverion-gmbh/9708112)
- **UK:** Centrica/Delta SOFC demonstration facility planned "within the next year" — [Hydrogen Europe](https://hydrogeneurope.eu/centrica-looks-to-delta-for-sofc-systems-for-european-data-centres-and-industry/)
- **Bloom in Europe:** on the Q3 2026 call, no European deployments were named; Bloom is "engaged with potential local partners in a few of these markets" and expects "some good news" soon — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/). Bloom's Q3 2026 8-K mentions a Korean JV but not Europe — [8-K](https://www.sec.gov/Archives/edgar/data/0001664703/000162828026066890/ex991_q326financialresults.htm)

### Inferences
- Typical role is **prime or bridge-to-grid** for Bloom and FCE (baseload natural gas, behind the meter). Hydrogen PEM is **backup** (Microsoft, Equinix Dublin, NorthC) or niche off-grid prime (ECL).
- No European hyperscale-scale fuel cell data centre deployment exists as of Nov 2026. The largest European data centre fuel cell installations found are 0.5 MW hydrogen PEM backup units.
- Nebius is often reported as a "European deal", but the Bloom capacity is for US sites.

### Gaps
- Bloom–Equinix European sites, and the earlier (2021) EU-funded Equinix/Vertiv/SOLIDpower data centre fuel cell project, were not verified. Only a search-result headline was seen — [Data Center Knowledge](https://www.datacenterknowledge.com/power-and-cooling/equinix-vertiv-and-partners-are-set-develop-fuel-cells-data-centers)
- MW size of ECL's firm PowerCell order not stated in the primary release. A headline suggests 5 MW — [Converge Digest, headline only](https://convergedigest.com/ecl-orders-5-mw-of-powercell-hydrogen-fuel-cells/?amp=1)
- MW size of Doosan's ~₩500bn US PAFC order not found.
- Customer identity and MW for Bloom's Oracle sites beyond Utah were not found in primary sources.

---

## 4. Current delivery / lead times (2026), manufacturing capacity and backlogs

### Takeaway
Bloom is the only supplier quoting weeks rather than years. It claims 50 MW in 90 days and 100 MW in 120 days once gas and permits are in place, and cites Oracle Utah power in under 2 months. It is ramping toward 2 GW/yr (target end-2026) with a "5 GW milestone" in view. FuelCell Energy is at ~37 MW/yr, scaling to 100 MW/yr (Oct 2026) and 500 MW/yr by June 2028. Doosan PAFC is heading to 350 MW/yr by end-2026, with US data centre deliveries from March 2027. PEM suppliers are at tens of MW/yr (Nedstack 10 MW/yr).

### Cited Findings

**Bloom**
- Deployment claims [claim]: 90 days "for an entire data center" (Oracle, Jul 2025) — [Bloom PR](https://www.bloomenergy.com/news/oracle-and-bloom-energy-collaborate-to-deliver-power-to-data-centers-at-the-speed-of-ai/). "50 MW in as little as 90 days and 100 MW in 120 days when gas supply and permits are in place" — [mgrid.org, Feb 2026, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)
- Evidence on the Q3 2026 call: Oracle Utah power "in less than 2 months"; Nebius NJ approvals within 3 months, first power block ~2 months later. Asked if sub-90 days is still achievable, management did not give a figure — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)
- Capacity: 2 GW/yr annual production capacity targeted by end-2026, with sources inconsistent on whether it has been reached — [mgrid.org, Feb 2026, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/); see also [Utility Dive](https://www.utilitydive.com/news/bloom-energy-says-its-on-track-for-2-gw-annual-production-capacity/804291/) (headline only). On the Q3 2026 call, management referred to a "5-gigawatt milestone" with no timeline ("We were not going to provide a timeline"). Capex was $153M in Q3 and $231M YTD at Fremont and Newark — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)
- Financials:
  - Q3 2026 revenue $1,235.8M (+138% YoY); product revenue $1,073.6M; non-GAAP gross margin 34.5%.
  - FY2026 revenue guidance raised to $4.4–4.6bn.
  - Deferred revenue plus customer deposits ≈ $754.4M at 30 Sep 2026.
  - Systems manufactured in the US.
  - Source: [Bloom Q3 2026 8-K, primary](https://www.sec.gov/Archives/edgar/data/0001664703/000162828026066890/ex991_q326financialresults.htm)
- Backlog: not quantified on the Q3 call ("continuing to expand faster than our revenue") — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/). Q2 2026 revenue $1.065bn (+166% YoY) and "25 GW deployment visibility" — [Sentisense, Aug 2026, secondary](https://app.sentisense.ai/stories/bloom-energy-reports-record-q2-revenue-and-25-gw-deployment-visibility-08182026)
- Installed base ~1.4 GW at >1,000 locations in 9 countries (2025) — [mgrid.org, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)

**FuelCell Energy**
- Production: ~37.1 MW annualised rate in Q3 FY2026; 100 MW annualised targeted for Oct 2026; Torrington expansion to 500 MW annualised by June 2028 — [FCE Q3 FY2026, primary](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)
- Backlog (31 Jul 2026): Committed $1.296bn plus Awarded Capacity $2.350bn (almost entirely Fit Energy, "not contracted backlog") = $3.646bn — [FCE Q3 FY2026](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)
- Q3 FY2026 revenue $33.0M (−29% YoY) with a gross loss of $24.5M; positive adjusted EBITDA targeted Q4 FY2027 — [FCE Q3 FY2026](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)

**Doosan**
- PAFC production capacity expected to reach 350 MW by end-2026. US data centre PAFC deliveries begin March 2027 (an order made ~Sep 2026, so ~6 months to first delivery [calc]) — [Financial News Korea, 3 Sep 2026, secondary](https://en.fnnews.com/news/202609030758521237)

**PEM**
- Nedstack: 10 MW/yr production, expandable to ~20 MW/yr, building a "gigawatt factory" aiming to be ready by 2027 (DCD interview, undated, likely 2022–23) — [DCD](https://datacenterdynamics.com/en/marketwatch/fuel-cells-set-to-take-off-from-2027)
- Ballard 15 MW order: deliveries begin H2 2026 for an order placed June 2026 — [Hydrogen Central](https://hydrogen-central.com/ballard-announces-order-for-15-mw-in-the-stationary-power-market/)

**Context**
- Grid interconnection queues of 5–7 years and large-frame gas turbine lead times of 5–7 years (early 2026) are cited as the reason for fuel cell bridge power — [mgrid.org, secondary](https://mgrid.org/2026/02/24/bloom-energy-scales-to-2-gw-annual-fuel-cell-production-as-industrial-and-data-center-on-site-generation-demand-reaches-record-levels/)

### Inferences
- For a European project, Bloom's US "90 days" claims depend on gas supply, permits and US-based installation crews being in place. With no European data centre reference and no named European partner yet, realistic European time-to-power should be planned on permitting and gas connection timelines, not Bloom's US factory-to-energisation figure.
- Bloom's capacity (≈2 GW/yr) is already committed against multi-GW US contracts (Oracle 2.8 GW, AEP ~0.9 GW, Nebius 0.33 GW). European allocation could face queueing, though there is no source stating European lead times.
- FCE and Doosan capacity is an order of magnitude smaller than Bloom's and largely committed to Fit Energy and US/Korean customers through 2027–28.

### Gaps
- No primary-source **European lead time** quoted by any manufacturer.
- Bloom's backlog in $ or GW for Q3 2026 is not disclosed in the 8-K. The "$20B backlog" figure appears only in an aggregator headline (rallies.ai, Q1 2026) and is unverified.
- No capacity figures found for Ballard, Plug or PowerCell stationary lines specific to 2026.

---

## 5. Cost per kW (equipment and installed) and cost of electricity; EU incentives

### Takeaway
There are almost no published list prices. The best public anchors are: the AEP–Bloom contract (~$2,900/kW for equipment, derived from $2.65bn for ~900 MW, Jan 2026); DOE's 2015 status range for 100 kW–3 MW natural gas fuel cells ($1,200–4,500/kW equipment, $2,400–5,500/kW installed); and Bloom's product gross margin of ~38%. Hydrogen-fuelled backup remains much more expensive per kWh than diesel.

### Cited Findings
- AEP–Bloom: $2.65bn for ~900 MW gives ≈ **$2,944/kW** [calc by secondary source, Jan 2026; scope of supply (installation, service) unclear] — [Fintool restating AEP filing](https://fintool.com/news/bloom-energy-aep-2-65-billion-fuel-cell-deal)
- Nebius–Bloom: up to $2.6bn in "service fees" over 10 years for 328 MW installed. That is ≈ $7,900/kW over 10 years, or ≈ $790/kW-yr [calc; this is a power-as-a-service fee likely covering equipment, O&M and possibly fuel management, so it is not comparable to capex] — [Pulse/CNBC, 21 May 2026, secondary](https://www.pulse.bot/energy/news/bloom-energy-rises-12-after-partnering-with-european-ai-infrastructure-upstart-in-26-billion-deal-42cb17a9-9ea4-4527-a5f1-f2bd161b4c65/)
- DOE (100 kW–3 MW natural gas CHP fuel cells):
  - 2015 status: equipment $1,200–4,500/kW (the $1,200 is a projection at 1,000 systems/yr); installed $2,400–5,500/kW.
  - 2020 targets: $1,000/kW equipment and $1,500/kW installed.
  - Source: [DOE technical targets, primary, 2015/2019](https://www.energy.gov/eere/fuelcells/doe-technical-targets-fuel-cell-systems-stationary-combined-heat-and-power)
- Bloom margins: product gross margin 38.4% and services gross margin 21.4% in Q3 2026; FY2026 non-GAAP gross margin ~34% (vs 30% in 2025) — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/)
- Doosan US PAFC price is higher than its Korean price; estimated operating margin 6–7% on the US order (analyst view) — [Financial News Korea, Sep 2026, secondary](https://en.fnnews.com/news/202609030758521237)
- Microsoft (2022): hydrogen fuel cell backup cost per kWh is "currently much higher than diesel" — [DCD](https://datacenterdynamics.com/en/news/microsoft-builds-3mw-hydrogen-fuel-cell-backup-power-plant)
- Bloom performance guarantee exposure: payments of $18M in 2025 and $8.4M in Q1 2026; warranty accrual $77.8M at 30 Jun 2026 — [Hunterbrook (short seller), Jul 2026](https://newsletter.hntrbrk.com/p/do-blooms-fuel-cells-work-as-claimed)

### Inferences
- For concept-level estimating in 2026, a working range of roughly **$2,500–3,500/kW equipment** for SOFC at hyperscale volumes seems defensible, anchored on AEP ≈ $2,900/kW. Installed cost would be higher once gas connection, electrical BoP, BESS/supercapacitors and civils are added. This range is an inference, not a published figure.
- LCOE is dominated by gas price and efficiency. At 53–58% LHV, fuel use is about 1.7–1.9 MWh of gas per MWh of electricity [calc: 1/0.58 to 1/0.53]. Use European TTF-based gas prices, not US Henry Hub.
- Stack replacement every ~3–5 years should be carried as a recurring O&M or capex line in the LCOE.

### Gaps
- No published Bloom, FCE or Doosan list price or installed $/kW for 2026.
- No independent 2026 LCOE for fuel cell data centre power found (Lazard or NREL ATB were not retrieved in this pass).
- EU incentives (Clean Hydrogen Partnership, IPCEI Hy2Use/Hy2Move) not researched in this pass. No source retrieved links them to data centre fuel cell deployments.

---

## 6. European availability, certification and permitting (CE marking, MCPD)

### Takeaway
Bloom's ES 6.5 is CE-marked and specified for 400/415 V, 50 Hz, so it is technically saleable in Europe. However, Bloom has named no European data centre deployment or partner (Nov 2026). Doosan's M400 datasheet is 60 Hz/480 V only. Fuel cells are not mentioned in the MCPD text. The MCPD defines a combustion plant as apparatus where fuels are oxidised "in order to use the heat thus generated", so electrochemical fuel cells most likely fall outside it, but there is no explicit exemption and national regulators should be asked to confirm.

### Cited Findings
- Bloom ES 6.5 certifications:
  - Safety: FC1, UL 1741, UL 1998, **CE**, KESCO.
  - UL listed to ANSI/CSA FC1-2014.
  - CARB DG-058.
  - Grid codes: IEEE 1547-2018, UL 1741 SB, CA Rule 21.
  - Voltage 400, 415 or 480 V 3-phase, **50/60 Hz**.
  - Some certifications were "expected to be available in early 2026".
  - IEC 62282 (fuel cell standard) is not listed.
  - Source: [Bloom datasheet Feb 2026](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)
- Doosan/HyAxiom M400 (H₂) datasheet is 480 VAC / 60 Hz; no certifications listed — [datasheet](https://www.doosan.com/images/media-center/ces2024/(Data%20Sheet)%20HyAxiom%20PureCell%20Model%20400%20Hydrogen.pdf)
- Bloom Europe status: no European deployments named; "engaged with potential local partners" (Oct 2026) — [Q3 2026 call](https://www.fool.com/earnings/call-transcripts/2026/10/22/bloom-energy-be-q3-2026-earnings-call-transcript/). A historical non-data-centre European Bloom customer exists (EnBW, Germany; customer case study seen in search results, not fetched) — [Bloom EnBW case study](https://www.bloomenergy.com/wp-content/uploads/enbw-energie-bloomenergy-case-study.pdf)
- FCE has European activity only in carbon capture (Rotterdam, Esso Nederland), not data centres — [FCE Q3 FY2026](https://s21.q4cdn.com/256256048/files/content_files/FCEL-Q3-2026-Press-Release-9-1-2026-FINAL.pdf)
- European-made or supported PEM suppliers with data centre references: Nedstack (NL), PowerCell (SE, with Bosch), GeoPura (UK) — [Nedstack](https://www.nedstack.com/projects/northc-hydrogen-backup); [Business Wire](https://www.businesswire.com/news/home/20260714813440/en/); [Equinix PR](https://newsroom.equinix.com/2026-06-19-Equinix-Trials-Landmark-Hydrogen-Power-Solution-at-Dublin-Data-Centre)
- MCPD (Directive (EU) 2015/2193):
  - Art. 3(5) defines "combustion plant" as "any technical apparatus in which fuels are oxidised in order to use the heat thus generated".
  - The Art. 2(3) exclusion list does not mention fuel cells, and the text retrieved does not mention fuel cells anywhere.
  - Source: [EUR-Lex MCPD](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32015L2193)
- UK Environment Agency MCP/specified generator guidance does not mention fuel cells; it defines a generator as "a combustion plant that generates electricity" — [GOV.UK MCP guidance](https://www.gov.uk/guidance/medium-combustion-plant-and-specified-generators-environmental-permits)
- US precedent: FCE states that generating without combustion "avoids the need for air permits" (US context) — [FCE data centers page](https://www.fuelcellenergy.com/industries/data-centers). Bloom holds a CARB DG certification (DG-058), California's distributed generation emissions certification — [Bloom datasheet](https://www.bloomenergy.com/wp-content/uploads/bloom-energy-server-datasheet-feb-2026.pdf)

### Inferences
- Under the MCPD definition, fuel cells (electrochemical oxidation to produce electricity, not combustion for heat) are most likely out of scope. This is an interpretation: confirm with the relevant competent authority (EA, EPA Ireland, etc.). Any auxiliary burners (start-up heaters, reformer burners, tail-gas oxidisers) above 1 MWth aggregated could still attract scrutiny.
- In Europe, other consenting regimes will still apply: gas connection, COMAH/Seveso for large on-site hydrogen storage, ATEX/DSEAR for hydrogen areas, planning, and grid code compliance for parallel operation (e.g. EU RfG / G99 in GB). Bloom's IEEE 1547/UL 1741 SB grid certifications are US codes; European grid-code compliance (RfG, G99) is not listed on the datasheet.
- The very low NOx (0.001 kg/MWh) is a strong air-quality argument versus gas engines and turbines in AQMA-constrained European sites.

### Gaps
- No sourced statement from any EU or UK regulator explicitly confirming fuel cells are outside the MCPD.
- No evidence found of Bloom compliance with European grid codes (EN 50549, RfG, G99) or IEC 62282 certification.
- EU incentives (Clean Hydrogen Partnership calls, IPCEI) not researched in this pass.
