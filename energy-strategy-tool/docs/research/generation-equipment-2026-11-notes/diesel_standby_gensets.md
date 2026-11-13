# Diesel and HVO standby generator sets for data centres (state as of Nov 2026)

Scope: large high-speed diesel gensets (about 1.5 to 4 MWe per unit) used as data centre backup, with a European (50 Hz) focus. Researched 13 Nov 2026. The web-search budget ran out before every gap was closed; the remaining gaps are listed under each question. 60 Hz figures are labelled. "kWe" means electrical output. Unless a source says otherwise, kVA is at power factor 0.8.

## 1. Which manufacturers and model families matter, and what does each unit deliver?

### Takeaway
At 50 Hz, the data-centre workhorses are 16- and 20-cylinder engines of 60 to 103 litres, giving about 2.0 to 3.2 MWe standby per unit. Data centre continuous (DCC/DCP) ratings are about 2.2 to 2.7 MWe per unit. The main suppliers are Cummins (QSK78/QSK95), Rolls-Royce mtu (20V4000), Caterpillar (C175-20, 3516 family) and Rehlko/Kohler (KD series), with Mitsubishi (MGS), Baudouin, Perkins/FG Wilson and HiMoinsa as second-tier or regional players. Baudouin is now marketing single units up to 6,250 kVA standby.

### Cited Findings

#### Per-model table (50 Hz unless marked)

| Manufacturer | Model (engine) | Unit output kWe, 50 Hz | Rating type | Start time | Block load | Fuel l/h at 100% (75%) | HVO approved | Emissions / after-treatment | Package / footprint | Notes | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cummins | C3000D5BE, Centum (QSK78-G21) | 2,400 standby (3,000 kVA); 2,200 prime (2,750 kVA); **2,200 DCC (2,750 kVA)** | Standby / Prime / DCC (continuous rating offered, no figure) | Not stated | Not stated | Not stated | Not stated on page (Cummins approved HVO in 2021–22, see Q2) | Listed certifications: EU stationary, EU mobile, EPA stationary emergency, EPA non-emergency | Unhoused | DCC = prime figure | [Cummins](https://selfscreening.cummins.com/generators/products/c3000d5be) |
| Cummins | C3750D5e (QSK95-G10, 16-cyl, 1,500 rpm, 2,903 kWm gross) | **2,680 DCC (3,350 kVA)**; 2,758 DCC without fan (3,448 kVA) | DCC | Not stated | Not stated | 664 (514); 363 at 50% | Not stated | EPA Tier 2 | Dry 28,801 kg; wet 30,668 kg | Datasheet submitted to UK EA for NTT Dagenham (Dec 2023) | [EA / NTT datasheet](https://consult.environment-agency.gov.uk/psc/rm10-7fz-ntt-global-data-centers-emea-uk-ltd/supporting_documents/Application%20Variation%20V003%20Generator%20set%20data%20sheet%2019122023.pdf) |
| Cummins | QSK78-G15 (CyrusOne FRA5.2) | Not stated in permit | Emergency | – | – | – | Diesel in permit | **SCR fitted** on all units; NOx limit 500 mg/Nm³ at 5% O2 | – | 20 units on one German site | [RP Darmstadt permit](https://rp-darmstadt.hessen.de/sites/rp-darmstadt.hessen.de/files/2025-03/aenderungsgenehmigungsbescheid_ndma_ff5_2_hanau.pdf) |
| Rolls-Royce mtu | 20V4000 DS4000 (20V4000G94LF, 95.4 l, 3,308 kWm, 1,500 rpm) | **3,200 standby (4,000 kVA)** at 400 V; 3,160 (3,950 kVA) at 11 kV; 3,200 at 11 kV with engine-optimised alternator | Standby (datasheet gives no prime/DCC) | Not stated | Rated load in one step per NFPA 110 *with parameter changes*; "exceeds load steps according to ISO 8528-5" | 818 (598); 429 at 50%; 205 g/kWh at 100% | Not on datasheet (mtu Series 4000 page says EN 15940 HVO/GtL OK) | "Tier 2 optimized", "NEA (ORDE) optimized" | Open unit 6,343 × 1,810 × 2,421 mm; 20,810 kg dry | Ark Longcross UK permit application (May 2024) | [EA / Ark datasheet](https://consult.environment-agency.gov.uk/psc/kt16-0ee-ark-data-centres-limited/supporting_documents/Application%20Bespoke%20Generator%20set%20Datasheet%20DS4000%20A001%2022052024.pdf) |
| Rolls-Royce mtu | 20V4000 DS3600 | ~3,000 standby (3,730 kVA); ~2,700 prime (3,390 kVA) | Standby / Prime | "a matter of seconds" | – | – | – | – | About 20 m² | Launched Aug 2018 | [Rolls-Royce 2018](https://www.mylearning.rolls-royce.com/media/press-releases/2018/10-08-2018-rr-rolls-out-new-standby-gensets-from-mtu-onsite-energy-with-up-to-4000-kva.aspx) |
| Rolls-Royce mtu | Series 4000 range (16V/20V) | 50 Hz up to 4,000 kVA; 60 Hz 1,125–3,250 kWe | Six ratings incl. Standby, Prime and **Data Center Continuous Power** (stated to meet Uptime Tier I–IV) | "Full power within a few seconds"; Türk Telekom case reports cut-in within 9 s in parallel mode | >50% in first step; 100% block load per NFPA 110 within G3 limits; meets ISO 8528-5 G2 and G3 | – | **Yes, EN 15940 HVO/GtL** | – | 40 °C and 50 °C radiator packages | Load factor up to 100% for data centres vs 85% standby | [mtu Series 4000](https://mtu-solutions.com/na/en/applications/power-generation/power-generation-products/diesel-generator-sets/series/4000.html) |
| Caterpillar | C175-20 (50 Hz) | kVA only: standby/mission critical 4,000 (no fan) / 3,900 / 3,350 (no fan); prime 3,600 (no fan) / 3,500; continuous 3,150 / 3,250 (no fan). **≈3,120–3,200 kWe standby at pf 0.8 (derived)** | Standby/MC, Prime, Continuous | Not stated | **100% block load in one step**; NFPA 110; **ISO 8528-5 G3** | Not stated | **Yes**: HVO/RD/HRD meeting EN 15940 or ASTM D975, neat or blended | "Low fuel" or "low emissions" optimised versions | L 264–331 in (6.7–8.4 m), W 85–128 in, H 88–151 in; dry 55,100–66,200 lb (25–30 t) | – | [Warren CAT dealer page](https://www.warrencat.com/new/power-systems/electric-power/diesel-generator-sets/c175-20/) |
| Rehlko (Kohler) | KD3500-E (KD83V16, 16-cyl, 1,500 rpm) | **2,600 DCP (3,250 kVA, ISO 8528-1)**; alternator 2,800 kWe / 3,500 kVA ESP/DCP; site derate at 44 °C: PRP 2,530, ESP/DCP 2,790 | DCP / ESP / PRP | Not stated | 100% one-step load acceptance, marked "Out of ISO criteria" | 707.5 (559.8); 394.4 at 50% (ESP, with cooling) | **Yes**: fuel listed as "Diesel Fuel/HVO" | EPA Tier 2; NOx 9.3 g/kWh at 100% ESP; 5.88 g/kWh weighted D2 cycle | Engine only 3,240 × 1,777 × 2,125 mm, 11,300 kg dry | VDC LHR21 (London) permit submittal, Dec 2023; DCP figure conflicts with alternator figure, so check | [EA / VDC LHR21](https://consult.environment-agency.gov.uk/psc/nw10-6pf-vdc-lhr21-limited/supporting_documents/Application%20Bespoke%20Engine%20Information%20%2015122023.pdf) |
| Rehlko (Kohler) | KD series 50 Hz (G-Drive K135/K175 blocks) | Standby kWe / prime kWe: KD2500 2,000/1,818; KD2800 2,240/2,036; KD3100 2,480/2,254; KD3300 2,640/2,400; KD3500 2,800/2,546; KD3750 3,000/2,727; **KD4000 3,488/3,176 (4,360 kVA)**; **KD4500 3,680/3,344 (4,600 kVA)** | ESP / PRP (no DCP in catalogue) | – | – | – | – | Emission- or fuel-optimised versions | 20 ft HC ISO container for emergency; 40 ft HC "CPU" containers (France models) | KD4000/4500 offered in MV/HV only at 50 Hz | [Rehlko KD catalogue 09-23](https://powersystems.rehlko.com/sea/wp-content/uploads/g12-478-sea-09-23_kd-series-800--4600-kva-catalog.pdf) |
| Rehlko (Kohler) | KD4000 (KD103V20, 103 l, 20V) – **60 Hz** | 60 Hz: 4,000 standby (5,000 kVA); 3,640 prime; **DCC = standby rating** | ESP / PRP / DCC | Not stated | 100% one step; ISO 8528-5 class referenced but not given | 60 Hz: 1,060 (870) standby; prime 959 (774) | **Yes**: EN 15940 / ASTM D975 HVO/RD; consumption up to 4% higher on HVO | EPA Tier 2 stationary emergency; low-NOx option | 8,263 × 3,172 × 3,451 mm; 35,199 kg wet | Noise 99 dB(A) at 7 m (open) | [Rehlko KD4000 spec](https://www.powersystems.rehlko.com/sea/wp-content/uploads/kd4000.pdf) |
| Mitsubishi Heavy Industries | MGS3100R (S16R2-PTAWT-CR, common rail) | kVA only: **3,025 standby/critical; 2,750 prime/DCC** (≈2,420 / 2,200 kWe at pf 0.8, derived) | Standby, critical, prime, DCC | NFPA 110 10 s start cited | **ISO 8528-5 G3** | – | – | – | 6,785 × 2,820 × 3,170 mm; 23,100 kg dry | Launched Aug 2023; assembled in Singapore and Vietnam; marketed mainly in Asia-Pacific | [MHIET press release](https://www.mhi.com/group/mhiet/news/20230822.html) |
| Baudouin | 20M33 / 12M55 / 16M55 / 20M55 / **20M61** | kVA only: 2,500 / 3,125 / 4,125 / 5,250 / **6,250 kVA standby (20M61)**; range 1,900–6,250 kVA | Rating type given only for 20M61 (standby) | – | – | – | **HVO-tested, EN 15940** | – | – | June 2026 marketing page | [Baudouin](https://baudouin.com/?p=84141) |
| Perkins / FG Wilson | P2500-3 (Perkins 4016-61TRG3, 61.1 l, 16-cyl) | 2,000 standby (2,500 kVA); 1,800 prime (2,250 kVA) | Standby / Prime | – | – | – | Not on page | Fuel-optimised | – | Smallest of the large class | [FG Wilson](https://www.fgwilson.com/en_GB/products/new/fg-wilson/diesel-generators/large-range-800-kva/129762.html) |
| Perkins | 5000 Series data centre range | 750–2,500 kVA | "Data Centre Power ratings" (no values) | – | **100% block load; G3** | – | **Compatible with 100% HVO** (to Perkins spec) | Tier II / China III capability | – | 750 h service intervals; Green Mountain (Norway) uses 4016-61TRG3 | [Perkins](https://www.perkins.com/en_GB/campaigns/5000-series/eame/data-centre.html) |
| HiMoinsa | HGY series (Yanmar engines) + DC range | HGY 1,250–3,500 kVA, "future 4,000 kVA"; DC range < 2,617 kVA PRP / < 2,253 kW | "DCP (Data Center Power) certified engines" | Response < 8 s | – | – | Not stated | – | – | Spanish OEM (Yanmar group) | [HiMoinsa](https://www.himoinsa.com/electric-generators/generator-sets-for-special-projects/generator-set-for-data-centres/5-11/eng.html) |

#### Other model and company facts
- Cummins sells the QSK78 as its "Centum Series"; the 60 Hz family is C2750D6E–C3000D6EB — [Cummins Centum QSK78](https://www.cummins.com/generators/c2750d6e-c3000d6eb-centum-series). Cummins' large range runs from 600 to 3,750 kVA — [Cummins](https://www.cummins.com/generators/above-600-kva).
- One US site, CloudHQ LC4 in Ashburn, has 101 Cat C175 gensets giving 313 MW of standby power, about 3.1 MW per unit at 60 Hz — [Cat data centre page](https://www.cat.com/datacenter-ame).
- Rolls-Royce mtu sells through the AVK packager. AVK says more than 500 mtu Series 2000/4000 gensets have been delivered, adding nearly 1.3 GW of standby capacity in the UK and Europe, with 120 HVO-powered gensets on order (undated article) — [Data Centre Magazine](https://datacentremagazine.com/news/avk-rolls-royce-deliver-1-3gw-of-hvo-power-to-data-centres). A separate report says Rolls-Royce delivered 600 mtu gensets to AVK over 10 years. AVK's mtu diesel range is 825–4,000 kVA — [Turbomachinery Magazine, Dec 2025](https://www.turbomachinerymag.com/view/rolls-royce-signs-long-term-agreement-with-avk-to-ensure-generator-capacity).

### Inferences
- At 50 Hz, the usable DCC/DCP rating per unit clusters at **2.2 MWe (QSK78, MGS3100R) to 2.6–2.7 MWe (QSK95, KD3500)**. Standby ratings are ~3.0–3.5 MWe (mtu DS4000 3.2 MWe, C175-20 ~3.1–3.2 MWe derived, KD4000 3.49 MWe). For Uptime Tier III/IV designs, size on DCC/DCP rather than standby. That is about 10–20% less than the standby figure (Cummins C3000D5BE: DCC = 92% of standby).
- 4 MVA-class units at 50 Hz (mtu DS4000, C175-20, KD4000/4500) are often supplied as MV (11 kV) alternators. Rehlko offers KD4000/KD4500 only at MV/HV at 50 Hz. LV units at that size run at roughly 5,800 A, per the mtu DS4000 at 400 V.
- Full-load fuel use scales at about 0.25–0.26 l/kWh: 664 l/h at 2,680 kWe for the QSK95, 818 l/h at 3,200 kWe for the mtu DS4000, 707 l/h at 2,800 kWe for the KD3500. A rule of thumb is ~250 l/h per MWe at full load (derived from cited datasheets).
- Units weigh 21–35 t and occupy roughly 20–27 m² open, before enclosure, attenuation and fuel tanks.

### Gaps
- **Cat 3516/3516E 50 Hz ratings** and **C175-20 kWe, fuel consumption and DCC/mission-critical figures** were not retrieved: cat.com product pages redirect to a login.
- **Cummins QSK60 50 Hz** data centre ratings were not retrieved.
- **mtu "DS4500" / "kinetic" rating:** no evidence was found of a 50 Hz mtu DS4500 diesel genset. The mtu page caps 50 Hz Series 4000 at 4,000 kVA. "Kinetic" more likely refers to DRUPS (diesel rotary UPS) packages that use mtu engines, but this was not verified. mtu's DCP rating values per model were not retrieved.
- **Volvo Penta, Aggreko/rental and Doosan** data were not researched (budget).
- Noise was available only for the KD4000 (open). Container and acoustic package sizes for 3 MW+ units are generally not public.
- Start times are rarely stated on 50 Hz datasheets. NFPA 110 Type 10 (10 s) is the de facto claim (MHI, mtu "9 s" case).

## 2. Rating types, start and block-load performance, emissions after-treatment and HVO approvals

### Takeaway
ISO 8528-1 standby (ESP) limits a set to 200 h/yr and a 70% average load. Uptime Tier III/IV instead requires no limit on consecutive run hours at N load, which is why OEMs created DCC/DCP ratings for unlimited hours. All major OEMs now approve EN 15940 HVO. In Europe, emergency gensets are usually supplied "Tier 2 / TA Luft 2g" NOx-optimised without SCR, but German and Irish permits for large sites increasingly impose SCR.

### Cited Findings
- ISO 8528-1 ratings, as summarised by Cummins — [Cummins PowerHour PDF](https://www.cummins.com/sites/default/files/2020-01/Cummins%20PowerHour_Genset%20Ratings%20Data%20Centers%20and%20Others%20(1PDH).pdf):
  - **ESP:** up to 200 h/yr; average 24 h output ≤70% of ESP.
  - **LTP:** up to 500 h/yr.
  - **PRP:** unlimited hours, variable load.
  - **COP:** unlimited hours, constant load.
- Cummins defines **DCC** as "the maximum power which the generator is capable of delivering continuously to a constant or varying electrical load for unlimited hours in a data center application". It states DCC meets Uptime Tier III and IV — [Cummins PowerHour PDF](https://www.cummins.com/sites/default/files/2020-01/Cummins%20PowerHour_Genset%20Ratings%20Data%20Centers%20and%20Others%20(1PDH).pdf).
- Uptime Tier Standard (as quoted by Cummins): "Engine-generators for Tier III and Tier IV sites shall not have a limitation on consecutive hours of operation when loaded to 'N' demand" — [Cummins PowerHour PDF](https://www.cummins.com/sites/default/files/2020-01/Cummins%20PowerHour_Genset%20Ratings%20Data%20Centers%20and%20Others%20(1PDH).pdf).
- Rehlko states that on the KD4000 (60 Hz), DCC is "Same as the Standby Rating" — [Rehlko KD4000](https://www.powersystems.rehlko.com/sea/wp-content/uploads/kd4000.pdf). mtu says its Series 4000 load factor can reach 100% for data centres, against 85% for standby — [mtu](https://mtu-solutions.com/na/en/applications/power-generation/power-generation-products/diesel-generator-sets/series/4000.html). This means DCC/DCP as a share of standby varies by OEM from about 92% to 100%.
- **Block load and start:**
  - Cat C175-20 accepts 100% block load in one step and conforms to ISO 8528-5 G3 — [Warren CAT](https://www.warrencat.com/new/power-systems/electric-power/diesel-generator-sets/c175-20/).
  - mtu Series 4000 accepts >50% in the first step and 100% block load per NFPA 110 within G3 limits — [mtu](https://mtu-solutions.com/na/en/applications/power-generation/power-generation-products/diesel-generator-sets/series/4000.html).
  - MHI MGS3100R meets G3 and NFPA 110 10 s starting — [MHIET](https://www.mhi.com/group/mhiet/news/20230822.html).
  - Perkins 5000 Series: 100% block load, G3 — [Perkins](https://www.perkins.com/en_GB/campaigns/5000-series/eame/data-centre.html).
  - Rehlko KD3500-E: 100% one-step acceptance is "Out of ISO criteria", i.e. it does not stay inside G-class transient limits — [EA / VDC LHR21](https://consult.environment-agency.gov.uk/psc/nw10-6pf-vdc-lhr21-limited/supporting_documents/Application%20Bespoke%20Engine%20Information%20%2015122023.pdf).
  - mtu DS4000 can take rated load in one step only "with changes to standard parameter sets" — [EA / Ark](https://consult.environment-agency.gov.uk/psc/kt16-0ee-ark-data-centres-limited/supporting_documents/Application%20Bespoke%20Generator%20set%20Datasheet%20DS4000%20A001%2022052024.pdf).
- **HVO approvals:**
  - Cat: HVO/RD/HRD to EN 15940 or ASTM D975, neat or blended with EN 590 — [Warren CAT](https://www.warrencat.com/new/power-systems/electric-power/diesel-generator-sets/c175-20/).
  - Rehlko: EN 15940 / ASTM D975, with fuel consumption up to 4% higher than on ULSD — [Rehlko KD4000](https://www.powersystems.rehlko.com/sea/wp-content/uploads/kd4000.pdf).
  - mtu: EN 15940 HVO and GtL — [mtu](https://mtu-solutions.com/na/en/applications/power-generation/power-generation-products/diesel-generator-sets/series/4000.html).
  - Baudouin: HVO-tested, EN 15940 — [Baudouin](https://baudouin.com/?p=84141).
  - Perkins: 100% HVO — [Perkins](https://www.perkins.com/en_GB/campaigns/5000-series/eame/data-centre.html).
  - Cat, Cummins and Kohler had approved HVO by 2021–Feb 2022 (DCF, June 2022) — [Data Center Frontier](https://datacenterfrontier.com/data-centers-embrace-vegetable-oil-as-cleaner-fuel-for-generators/).
- **NOx baseline and the UK BAT benchmark:**
  - UK EA BAT guidance treats "emissions optimised" engines at ~2,000 mg/m³ NOx at 5% O2 (≈750 mg/m³ at 15% O2), i.e. "2g TA Luft" or US EPA Tier 2, as BAT for emergency diesels without monitoring.
  - Fuel-optimised engines are not BAT unless abated.
  - Balancing-market use is accepted only "occasionally, when NOx is abated".
  - Source: [gov.uk EA BAT guidance](https://www.gov.uk/guidance/emergency-backup-diesel-engines-on-installations-best-available-techniques-bat) (published Aug 2023).
- KD3500-E NOx: 9.3 g/kWh at 100% ESP and 5.88 g/kWh on the weighted EPA D2 cycle — [EA / VDC LHR21](https://consult.environment-agency.gov.uk/psc/nw10-6pf-vdc-lhr21-limited/supporting_documents/Application%20Bespoke%20Engine%20Information%20%2015122023.pdf).
- **German example with SCR (CyrusOne FRA5.2, Hanau, permit 19 Mar 2025):** 22 SCR systems, each with a 400 l urea day tank, plus 3 × 50,000 l urea main tanks. No diesel particulate filter is required because dust is expected to stay below 50 mg/Nm³. Limits: NOx 500 mg/Nm³ and NH3 30 mg/Nm³ at 5% O2 — [RP Darmstadt permit](https://rp-darmstadt.hessen.de/sites/rp-darmstadt.hessen.de/files/2025-03/aenderungsgenehmigungsbescheid_ndma_ff5_2_hanau.pdf).
- **SCR warm-up caveat:** an air-quality consultant quoted on DataVita (Scotland) said emission controls can take 10 minutes or longer to start cutting emissions, so outage-time NO2 may be underestimated (Sep 2026, secondary press) — [Resultsense](https://www.resultsense.com/news/2026-09-29-datavita-chapelhall-diesel-generators/).
- **Kit with mixed after-treatment:** DataVita DV1 has 12 generators, with emission controls on only six; the rest are to be upgraded within three years — [Resultsense](https://www.resultsense.com/news/2026-09-29-datavita-chapelhall-diesel-generators/).

### Inferences
- The baseline European spec for an emergency-only set is a NOx-optimised "TA Luft 2g / EPA Tier 2" engine without after-treatment. **Budget SCR (plus urea storage) wherever:**
  - the permit allows more than about 300 h/yr in Germany;
  - the site is a ≥50 MWth Irish IE-licensed or German 4. BImSchV-permitted installation near receptors;
  - any non-emergency use (grid services, load support) is planned.

  The DPF requirement depends on dust limits. The Hanau permit shows SCR without DPF.
- EU Stage V (Regulation 2016/1628) is the non-road mobile machinery regime. Stationary standby gensets are normally governed instead by MCPD/national combustion rules. Cummins listing both "E.U., mobile application" and "E.U., stationary application" certifications for the same set is consistent with this. This was not verified against the regulation text (see Gaps).

### Gaps
- Stage V text (scope exclusion for stationary gensets) was not fetched. The statement above is an inference and needs confirming against [Regulation (EU) 2016/1628](https://eur-lex.europa.eu/eli/reg/2016/1628/oj).
- No public TA Luft NOx figures (mg/Nm³) were obtained for Cummins QSK95 or mtu 20V4000 at 50 Hz.
- No figures were found for how much SCR adds to footprint or cost per unit.

## 3. Typical fleet design, European examples, HVO switch-overs and planning limits

### Takeaway
Hyperscale campuses run tens to over a hundred 2.5–3 MW-class sets per site (e.g. 70 units at Amazon Grange Castle South, 105 at AWS Clonshaugh, 20 + 2 at CyrusOne FRA5.2). Permits typically cap operation at tens of hours a year per unit (Ireland 72 h/unit; Hanau 641 h/yr site total) and hold 1–4 days of fuel. HVO is now mainstream in Europe: Digital Realty has 20+ European sites, Kao Data was all-HVO from 2021, Pure DC uses it in London and Dublin, and Amazon's Iver site will too. Planners are increasingly scrutinising diesel fleets (Edinburgh refusal 2026; Iver air-quality payment).

### Cited Findings
**Design norms**
- Uptime Tier III guidance (secondary): at least 12 hours of on-site fuel storage and N+1 redundancy. The same article also mentions 72 h runtime without reconciling the two — [POWER Magazine](https://www.powermag.com/understanding-uptime-institutes-tier-iii-standard-a-guide-to-data-center-electrical-system-design).
- US hyperscale sites "typically" have hundreds of generators of 2–4 MW each and up to 96 h of fuel on site. An Amazon site in Manassas, VA has 93 × 2.5 MW (Mar 2026) — [Latitude Media](https://www.latitudemedia.com/news/the-data-center-boom-is-a-diesel-generator-boom/).
- Global data-centre diesel generator capacity rose from 20 GW (2018) to 55 GW (2024), per the Better Data Center Project. Virginia alone had more than 10,500 permitted units totalling 27 GW by end-2025 — [Latitude Media](https://www.latitudemedia.com/news/the-data-center-boom-is-a-diesel-generator-boom/).

**European examples**
- **Amazon, Grange Castle South, Dublin 22** (EPA IE licence; application Jan 2022, inspector's report May 2023) — [EPA Ireland](https://epawebapp.epa.ie/licences/lic_eDMS/090151b280879452.pdf):
  - 70 × 6.49 MWth diesel generators (26/18/26 across buildings A/B/C) plus 3 × 2.19 MWth admin generators. Combined thermal input 460.87 MWth; simultaneous operation capped at 421.93 MWth.
  - Operation limited to 72 h/yr per generator at ≤90% load.
  - Testing: weekly at ≤25% load for 30 min; quarterly at ≤90% load for 1 h; weekdays 08:00–17:00 only.
  - 1,245 t diesel stored; 1,486 t annual use. Condition 7 requires a biofuel study.
- **AWS, Clonshaugh, Dublin:** 105 backup diesel generators plus 4 diesel fire pumps, "674MW of power" (likely thermal input; undated DCD article) — [DCD](https://datacenterdynamics.com/en/news/aws-buys-105-back-up-diesel-generators-for-new-data-center-in-dublin).
- **Ireland overall (Nov 2024)** — [The Journal](https://www.thejournal.ie/investigates-data-centres-6554698-Nov2024/):
  - More than 800 emergency/backup generators across 24 GHG permits.
  - 15 IE licences issued (13 in Dublin), 9 pending.
  - An IE licence is required for running backup generators more than 18 h/yr at ≥50 MW thermal input; a GHG permit applies above 20 MW thermal.
  - EdgeConneX Lucan: 28 generators, almost 130,000 t CO2 since 2017.
- **CyrusOne FRA5.2, Hanau (Frankfurt region), permit 19 Mar 2025** — [RP Darmstadt](https://rp-darmstadt.hessen.de/sites/rp-darmstadt.hessen.de/files/2025-03/aenderungsgenehmigungsbescheid_ndma_ff5_2_hanau.pdf):
  - 20 × Cummins QSK78-G15 main generators plus 2 life-safety sets (QSX15, QSK23); 123 MWth total, down from 136 MWth in 2024.
  - Emergency plus test operation capped at 641 h/yr in total; fortnightly function tests ≤26 h/yr per unit; "black building" test ≤10×/yr at ≤13 h each.
  - Diesel storage 20 × 32.3 m³ plus two smaller tanks (~679 m³); SCR on all units.
- **UK permit submittals (EA) give model choices:**
  - Ark Longcross: mtu 20V4000 DS4000 — [EA](https://consult.environment-agency.gov.uk/psc/kt16-0ee-ark-data-centres-limited/supporting_documents/Application%20Bespoke%20Generator%20set%20Datasheet%20DS4000%20A001%2022052024.pdf).
  - NTT Dagenham: Cummins C3750D5e (QSK95) — [EA](https://consult.environment-agency.gov.uk/psc/rm10-7fz-ntt-global-data-centers-emea-uk-ltd/supporting_documents/Application%20Variation%20V003%20Generator%20set%20data%20sheet%2019122023.pdf).
  - Virtus LHR21: Rehlko KD3500-E — [EA](https://consult.environment-agency.gov.uk/psc/nw10-6pf-vdc-lhr21-limited/supporting_documents/Application%20Bespoke%20Engine%20Information%20%2015122023.pdf).
- **Amazon, Iver (Bucks, UK), approved Oct 2026:** 27 backup generators expected to run mainly on "processed vegetable fuel", with diesel as fallback. Conditions include a £600,382 air-quality mitigation payment and an emissions monitoring plan — [TechRadar](https://techradar.com/pro/need-for-data-centres-outweighs-other-considerations-local-council-in-the-london-commuter-belt-approves-amazons-massive-m25-hub-despite-air-quality-fears).
- **DataVita Chapelhall DV4 (Scotland, 120 MW, Sep 2026):** 48 generators, up to 32 in "load support mode" when ambient >21 °C, at most 80 h/yr, on HVO. Not yet approved; full EIA required — [Resultsense](https://www.resultsense.com/news/2026-09-29-datavita-chapelhall-diesel-generators/).

**HVO switch-overs**
- Kao Data Harlow: all generators on HVO from July 2021. Digital Realty Interxion PA8 Paris: HVO blend (2022). Equinix: pilots, and HVO-capable gensets in new builds and retrofits. Microsoft Sweden (2021): a tall-oil-based fuel ("Evolution") rather than HVO — [DCF, Jun 2022](https://datacenterfrontier.com/data-centers-embrace-vegetable-oil-as-cleaner-fuel-for-generators/).
- Digital Realty: HVO at "20+ sites" in Europe including Amsterdam and Madrid, covering ~15% of its global portfolio across 7 markets. The first US sites are PDX12, SC1 and LAX12 (undated article) — [Datacentre Solutions](https://form.datacentre.solutions/news/67432/digital-realty-expands-renewable-generator-fuel-rollout).
- Pure DC (Jul 2025) — [Pure DC](https://puredc.com/2025/07/21/how-pure-dc-made-the-switch-to-hydrotreated-vegetable-oil-work-at-scale):
  - HVO for backup in London and for "short-term primary generation" in Dublin; Dublin used close to 3 million litres in 12 months.
  - Operational cost premium below 20% vs diesel; HVO shelf life up to 10 years.
- Microsoft Ireland (Grange Castle, Oct 2025): uses "renewable biofuel to power our backup generators alongside natural gas generators" — [Microsoft fact sheet](https://local.microsoft.com/wp-content/uploads/2025/10/Microsoft-datacentres-in-Ireland.pdf).

**Planning refusals and limits**
- Edinburgh, South Gyle (213 MW IT, Shelborn): planning permission in principle refused by councillors against officer advice (reported Feb 2026). Objections included "rows of diesel backup generators" — [The Register](https://www.theregister.com/2026/02/10/edinburgh_green_ai_datacenter/).

### Inferences
- **Units per MW IT (estimate):** with DCC of 2.2–2.7 MWe per set and facility peak of ~1.3–1.4 × IT, an N fleet needs about **0.5–0.65 sets per MW IT**, before redundancy. With N+1 per 4–6-set block, that is ~0.6–0.8 sets per MW IT; with 2N, ~1.0–1.3. Cross-check: Grange Castle South has 70 × 6.49 MWth sets. At ~40% electrical efficiency each is ≈2.6 MWe, so the fleet is ≈180 MWe. IT capacity is not public. This is an estimate only.
- **Fuel:** at ~250 l/h per MWe full load (see Q1), 24 h for 100 MWe of running generators is ≈600 m³. FRA5.2's ~32 m³ per set covers ~40–50 h at full load for a ~2.5 MWe QSK78, consistent with 48 h practice. The Uptime Tier III minimum is 12 h.
- European permits run to tens of hours per unit per year, not hundreds: Ireland 72 h/unit at one site; the 18 h/yr licence trigger; Germany 641 h site total for 22 units (≈29 h per unit). Testing regimes (weekly at low load, quarterly at high load) consume most of this.

### Gaps
- No public numbers were found for Amsterdam/Netherlands fleets with named models, or for an Equinix or Microsoft fleet with models.
- Fleet topology choices (block redundant vs distributed redundant vs catcher) were not found in primary sources for named European sites.
- The 6.49 MWth to MWe conversion assumes ~40% efficiency (estimate).

## 4. Lead times, backlog and OEM capacity expansion (2022 to 2026)

### Takeaway
As of late 2026, large (2–4 MW) genset slots are effectively sold out to the second half of 2028 at Cummins. US dealer quotes for 1.25–3.25 MW units run 52–70 weeks for whatever stock or slot is available. Cat, Cummins and Rolls-Royce mtu are all expanding large-engine capacity, but the main additions arrive in 2027–2030. Cat plans to triple large reciprocating engine capacity versus 2024; Cummins is adding ~20 GW; mtu has a new Series 4000 plant from 2028. Hyperscalers are locking up multi-GW framework agreements.

### Cited Findings
- **Cummins** (Q2 2026 call, 4 Aug 2026; machine transcript, verify against the 10-Q) — [Motley Fool transcript](https://www.fool.com/earnings/call-transcripts/2026/08/11/cummins-cmi-q2-2026-earnings-call-transcript/):
  - Lead times for new orders now extend into H2 2028.
  - 2026 growth is "constrained by capacity", particularly for larger generator configurations; some customers are shifting to smaller gensets.
  - A multiyear agreement with a global hyperscaler covers "several gigawatts" of backup genset demand.
  - ~20 GW of incremental capacity was announced at Analyst Day (May 2026): some online in 2027, a bigger step in 2028, phasing through 2030. The end-2025 North American expansion included the 95-litre line.
  - Power Systems Q2 revenue was a record $2.3 bn (+19%).
- **Caterpillar** (Q1 2026, 30 Apr 2026) — [Manufacturing Dive](https://www.manufacturingdive.com/news/caterpillar-triple-power-generation-capacity-raises-2030-targets-q1-2026-earnings/819078/):
  - Will "triple its large reciprocating engine capacity from 2024 levels", investing heavily 2027–2029. This follows a Jan 2024 plan to double.
  - Large recip engine backlog is up more than 3.5× since Jan 2024; total company backlog is a record $63 bn.
  - Power & Energy Q1 sales were $7.0 bn (+22%).
- **Rolls-Royce Power Systems (mtu):**
  - 2025 order intake +21% to €7.14 bn; the data centre business "grew significantly".
  - A "high three-digit million" investment includes a new plant to assemble Series 4000 from 2028 in Friedrichshafen and +23,000 m² at Mankato (US).
  - Source: [mtu press release, 27 Feb 2026](https://mtu-solutions.com/eu/en/pressreleases/2026/Strong-results-and-record-investments-Rolls-Royce-Power-Systems-continues-on-growth-path.html).
  - Data centre orders rose more than 50% in H1 2026 (CFO to CNBC, 30 Jul 2026; secondary) — [MarketScale](https://www.marketscale.com/industries/energy/rolls-royce-reports-50-plus-order-surge-in-data-center-energy-as-ai-infrastructure-demand-reshapes-power-procurement).
  - Five-year framework agreement with AVK (Dec 2025) to secure Series 4000 emergency genset production capacity for Europe — [Turbomachinery Magazine](https://www.turbomachinerymag.com/view/rolls-royce-signs-long-term-agreement-with-avk-to-ensure-generator-capacity).
- **Dealer view (US, 11 May 2026):** 1,250–3,250 kW standby units 52–70 weeks; 750–1,000 kW units 12–39 weeks; start procurement 12–18 months ahead (secondary, dealer marketing) — [Global Power Supply](https://globalpwr.com/blog/generator-lead-times-in-2026).
- **Baudouin (29 Jun 2026):** some critical components have lead times "exceeding 18 months". It claims "some of the best delivery times available" but gives no numbers — [Baudouin](https://baudouin.com/?p=84135).
- **Historical context:** in 2006, 2 MW diesel gensets had lead times of up to one year — [Data Center Knowledge, Oct 2006](https://datacenterknowledge.com/business/generator-backlogs-cause-delivery-delays). Long lead times have occurred in earlier data-centre build cycles too.

### Inferences
- For a European campus ordering in late 2026, plan for **~18–24+ months** from order to delivery for 3 MW-class 50 Hz units from tier-1 OEMs unless slots are pre-reserved via a framework agreement. This is consistent with Cummins' "H2 2028" for new orders and dealer quotes of 52–70 weeks for available slots. Smaller 2 MW-class units (e.g. 2,000–2,500 kVA) and second-tier OEMs (Baudouin, HiMoinsa, Perkins, MHI) may be faster.
- Cat's "3.5× backlog since Jan 2024" and Cummins' statement that customers are downsizing unit size both indicate the constraint is worst at the largest frames: QSK95, C175, 20V4000, KD4000+.

### Gaps
- No reliable primary source was found giving 2022 lead times in months for 2–4 MW sets. The 2022 baseline comparison is therefore not sourced. A secondary aggregator ("104-week lead times", enkiai.com) was seen in search results but not used because of reliability concerns.
- No Europe-specific lead time statement from mtu, Cummins or Rehlko was found. Kohler/Rehlko capacity-expansion announcements were not retrieved.

## 5. Cost per kW

### Takeaway
Public cost data is thin. The only figure found is about $1,000/kW capital cost for data-centre diesel generators (US, secondary, Mar 2026). No European €/kW figure from a primary source was found.

### Cited Findings
- Generators run "around $1,000 per kilowatt", against ~$1,300/kW for 4-hour battery storage (NREL June 2025) (US, Mar 2026; secondary, unspecified whether equipment-only or installed) — [Latitude Media](https://www.latitudemedia.com/news/the-data-center-boom-is-a-diesel-generator-boom/).
- A law-firm comparison rates "Utility Grid + Diesel Engine-generator for Backup" as "Low" upfront capital cost vs "Medium" for gas recips/turbines, with no figures (Nov 2025) — [Willkie Farr & Gallagher](https://www.willkie.com/publications/2025/11/on-site-power-for-data-centers-series-commercial-considerations-and-infrastructure-costs).
- HVO operating cost premium: below 20% vs diesel (Pure DC, Jul 2025) — [Pure DC](https://puredc.com/2025/07/21/how-pure-dc-made-the-switch-to-hydrotreated-vegetable-oil-work-at-scale).

### Inferences
- Treat ~$1,000/kW (~€900/kW) as an order-of-magnitude US figure, probably for the generator package. European installed cost including enclosure, fuel system, SCR (where needed), MV switchgear and civils is likely higher. This is unverified.

### Gaps
- No European equipment or installed €/kW figure was found, nor any OEM price list. No data was found on price inflation since 2022. The search budget was exhausted before cost-specific searches (e.g. cost consultants such as Turner & Townsend or Linesight) could be completed.

## 6. Can diesel gensets legally run for prime/bridge power or grid services in EU countries?

### Takeaway
The EU MCPD lets member states exempt plants running at most 500 h/yr (3-year rolling average for new plant) from emission limit values. Most countries apply this to emergency gensets, and some set tighter national thresholds: Germany 300 h/yr; Ireland's 18 h/yr licensing trigger at ≥50 MWth. Using diesel sets for prime, bridge or grid-services operation removes the exemption. The plant must then meet full ELVs, which in practice means SCR and possibly a DPF, and the Netherlands explicitly excludes diesel engines generating while the grid is available. Large-scale diesel bridge power in the EU is therefore legally possible but needs a full combustion-plant permit with after-treatment.

### Cited Findings
- **MCPD (EU) 2015/2193:**
  - Art. 6(8): member states may exempt new MCPs operating ≤500 h/yr (3-year rolling average) from Annex II Part 2 ELVs; a 100 mg/Nm³ dust ELV still applies for solid fuels.
  - Art. 6(3): existing plants ≤500 h/yr on a 5-year rolling average, extendable to 1,000 h for island backup or cold-weather heat.
  - Source: [legislation.gov.uk (EU 2015/2193 Art. 6)](https://legislation.gov.uk/eudr/2015/2193/article/6/data.pdf).
- **Germany, 44. BImSchV §16** — [gesetze-im-internet.de §16](https://www.gesetze-im-internet.de/bimschv_44/__16.html):
  - NOx ELV for liquid fuels is 0.1 g/m³ (as reported by fetch; verify).
  - Abs. 7 Satz 2: the NOx ELV does not apply to engines running fewer than 300 h/yr or only in emergency operation, but engine-internal NOx measures must be exhausted.
  - Abs. 5: such ≤300 h plants need a soot filter, or dust ≤50 mg/m³ without one.
  - Abs. 6: the CO limit is waived.
  - The Hanau permit (641 h site cap, SCR, NOx 500 mg/Nm³) shows how a large site is permitted in practice — [RP Darmstadt](https://rp-darmstadt.hessen.de/sites/rp-darmstadt.hessen.de/files/2025-03/aenderungsgenehmigungsbescheid_ndma_ff5_2_hanau.pdf).
- **Netherlands, Besluit activiteiten leefomgeving** — [IPLO](https://iplo.nl/regelgeving/regels-voor-activiteiten/kleine-middelgrote-stookinstallaties-standaard/uitzonderingen-emissiegrenswaarden-std-brandstof/):
  - Art. 4.1299 lid 2: small/medium installations running <500 h/yr are exempt from ELVs, provided monthly hour-meter readings are kept.
  - **Exception:** diesel engines used to generate electricity "wanneer het elektriciteitsnet beschikbaar is" (when the grid is available) do not get the exemption.
  - Art. 4.1323: up to 120 h of operation during a fault.
- **UK (England), EA BAT guidance** — [gov.uk](https://www.gov.uk/guidance/emergency-backup-diesel-engines-on-installations-best-available-techniques-bat):
  - Testing must be under 50 h/yr, one engine at a time, avoided during poor air quality.
  - Emergency engines are framed as up to 500 h/yr and "exempt from ELVs" (page metadata).
  - Balancing-market use only "occasionally, when NOx is abated".
  - MCPD Schedule 25A and specified-generator Schedule 25B apply "where appropriate".
- **Ireland:**
  - Running backup gens >18 h/yr at ≥50 MWth requires an EPA IE licence; Amazon Grange Castle South is licensed for 72 h/yr per unit — [The Journal](https://www.thejournal.ie/investigates-data-centres-6554698-Nov2024/); [EPA](https://epawebapp.epa.ie/licences/lic_eDMS/090151b280879452.pdf).
  - The CRU Large Energy Users connection policy (proposed decision 18 Feb 2025) requires new data centres to provide dispatchable generation or storage on or near site that participates in the wholesale market. Diesel and fuel type were not addressed in the summary — [Mason Hayes & Curran](https://mhc.ie/latest/insights/large-energy-users-connection-policy). Another project researcher covers the final LEU decision.
  - Demand-side units won 544 MW in the 2018 I-SEM capacity auction at €41,800/MW. Data-centre diesel participation was only speculated by the blog author — [Irish Energy Blog, Jun 2018](https://irishenergyblog.blogspot.com/2018/06/demand-side-units-now-reach-540mw.html).
  - Dublin grid services by data centres have moved to UPS batteries: Digital Realty with Enel X, initially 6 MW UPS capacity (Apr 2024); Microsoft Dublin grid-interactive UPS from 2022 — [The Register](https://www.theregister.com/2024/04/23/digital_realty_irish_grid/).
- **Bridge / short-term primary on HVO (Ireland):** Pure DC Dublin uses HVO gensets for "short-term primary generation", ~3 million litres over 12 months — [Pure DC](https://puredc.com/2025/07/21/how-pure-dc-made-the-switch-to-hydrotreated-vegetable-oil-work-at-scale).
- **Load support (Scotland):** DataVita proposes generators in load-support mode for at most 80 h/yr — [Resultsense](https://www.resultsense.com/news/2026-09-29-datavita-chapelhall-diesel-generators/).

### Inferences
- **Emergency-only operation** (tests plus genuine outages) generally fits under the MCPD 500 h exemption. National caps are tighter: Germany 300 h/yr for the NOx waiver; Ireland's licensing trigger at 18 h/yr; site permits of tens of hours per unit.
- **Prime/bridge power on diesel or HVO** (e.g. while waiting for a grid connection) means:
  - full MCPD/IED ELVs, effectively SCR (plus DPF where dust limits bite);
  - a full permit with air dispersion modelling;
  - in Ireland, an IE licence above 50 MWth;
  - in the Netherlands, loss of the 500 h exemption whenever the grid is available.

  Running hours would also make DCC/PRP ratings mandatory and drive maintenance and fuel logistics. One example: Pure DC Dublin's ~3 million litres/yr ≈ 12 GWh at ~0.25 l/kWh (estimate).
- **Grid services from diesel** are permitted only in limited cases: occasionally with NOx abatement (UK); excluded from the NL exemption. Batteries and UPS have largely taken over this role in Ireland.

### Gaps
- Not covered: national rules for France, Spain, Nordics, Belgium and Italy; IED thresholds for aggregated engines above 50 MWth (whether engines count toward Annex I 1.1 aggregation varies by member state); the final text of the Irish CRU LEU decision.
- The 44. BImSchV NOx figure of 0.1 g/m³ for liquid-fuel engines looks low compared with typical engine limits. It may be misread from the fetched text and should be verified against the original §16(7) before use.
