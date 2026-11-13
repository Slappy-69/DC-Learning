# Gas turbines for on-site data centre power (microturbines to heavy-duty), state as of November 2026

Research notes compiled 13 Nov 2026. Scope: unit sizes, units per MW, performance, cost, delivery times and the 2025-2026 turbine shortage, plus EU emissions limits, for European campuses of tens to several hundred MW.

Caveat on coverage: the shared web-search budget ran out partway through. Kawasaki, Ansaldo, Doosan, MAN/Everllence, SGT-400/600/700 efficiencies, M501JAC simple-cycle data and the MCPD gas-turbine limit values could not be retrieved. They are listed under Gaps rather than filled from memory.

Conventions:
- All OEM figures are ISO (15 °C, sea level, 60% RH), natural gas, LHV, as published. Each OEM states whether its figures are gross or net. Siemens Energy figures are gross; GE Vernova figures are net.
- European grids run at 50 Hz. Where an OEM gives 50 Hz and 60 Hz separately, the 50 Hz value is shown.

---

## 1. Which manufacturers and models matter, by class, and how do they perform?

### Takeaway
For a 50 Hz European campus of 50-500 MW, the realistic simple-cycle building blocks are:
- 30-60 MW aeroderivatives and industrial units: LM2500XPRESS, TM2500, LM6000, SGT-A35, SGT-A45, SGT-800, FT8, Titan 350.
- About 70-140 MW blocks: FT4000 SwiftPac, LMS100.
- Heavy-duty frames: 6B, 6F.03 and 9HA for combined cycle.

Aeroderivatives start in 5-10 minutes and ramp at about 50 MW/min, with about 39-44% LHV simple-cycle efficiency. Industrial units (Titan, NovaLT, SGT-800) reach 36-41%. Heavy-duty H-class reach about 43-44% in simple cycle and above 64% in combined cycle, but take 20-30 minutes to start.

Published DLE NOx is typically 15-25 ppm (about 31-51 mg/Nm³). That is close to or above EU BAT levels for long-running plant, so SCR should be assumed for prime power.

### Cited Findings

**Per-model table** (ISO, natural gas, LHV; "n/s" means not stated in the source retrieved):

| Manufacturer | Model | Class | ISO output MWe SC | Eff. % LHV SC (heat rate) | CC output / eff. | Start time | Ramp rate | Min load | NOx (DLE unless noted) | H2 capable | Notes | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GE Vernova | LM2500XPRESS (+G4 DLE / +G5 DLE, 50 Hz) | Aero | 34.5 / 36.3 (net) | 39.4% / 39.0% (9,146 / 9,233 kJ/kWh) | n/s (CC tabs blank) | about 5 min cold iron to base load | n/s | n/s | 15 ppm on gas | up to 75% | Package 28.5 × 3.04 m, height 8.2 m, largest lift 72 t; up to 95% factory assembled, 10 modules; install "<30 days" or "as few as two weeks" (the page contradicts itself) | [GE Vernova LM2500](https://www.gevernova.com/gas-power/products/gas-turbines/lm2500) |
| GE Vernova | TM2500 (trailer, 50 Hz) | Aero, mobile | 34.5 (DLE) / 34.6 (SAC); headline "up to 37" | 39.5% DLE (9,124 kJ/kWh); 34.8% SAC (10,354 kJ/kWh) | n/a | about 5 min | n/s | n/s | No standard figure; California unit with SCR 2.5 ppm | 75% (case study) | Package 27.9 × 3.04 m, height 8.2 m; about 14 days to install | [GE Vernova TM2500](https://www.gevernova.com/gas-power/products/gas-turbines/tm2500) |
| GE Vernova | LM6000VELOX PC Sprint / PF+ Sprint | Aero | 51.1 / 56.9 (net) | 39.7% / 41.0% (9,068 / 8,800 kJ/kWh) | Page says ">50%" and "56%" CC (inconsistent) | 5 min | about 50 MW/min | n/s | n/s | "100% hydrogen capable" (page claim) | Package 20.43 × 4.1 m, height 14.38 m, largest lift 71 t; page says specs cover 50 and 60 Hz | [GE Vernova LM6000](https://www.gevernova.com/gas-power/products/gas-turbines/lm6000) |
| GE Vernova | LMS100 PA+ (50 Hz) | Aero/intercooled | 112.9 (net); headline about 116 | 43% (8,372 kJ/kWh); headline about 44% | n/s | 8 min to full load | 50 MW/min; page also claims emergency ramp "up to 500 MW/min" (implausible, verify) | n/s | n/s | n/s | Reliability 99.6%, availability 96.7% | [GE Vernova LMS100](https://www.gevernova.com/gas-power/products/gas-turbines/lms100) |
| GE Vernova | 6B (6B.03) | Heavy-duty (small) | 45 (net) | 33.4% (10,779 kJ/kWh) | >51% CC | n/s | n/s | n/s | n/s | 100% with standard (diffusion) combustor; 30% with DLN | 50/60 Hz | [GE Vernova 6B](https://www.gevernova.com/gas-power/products/gas-turbines/6b) |
| GE Vernova | 6F.03 (formerly 6F.01 family name; .01 data not on page) | Heavy-duty (F) | 88 | 36.8% (9,788 kJ/kWh) | >57% CC | 13 min hot restart | 22 MW/min | 35% (DLN 2.6) | <15 ppm (DLN 2.6); CO 9 ppm | up to 100% | 50/60 Hz | [GE Vernova 6F](https://www.gevernova.com/gas-power/products/gas-turbines/6f-01) |
| GE Vernova | 7HA.02 / 7HA.03 (60 Hz only) | Heavy-duty H | 384 / 430 (net) | 42.6% / 43.3% (8,450 / 8,318 kJ/kWh) | 63-64% net CC; CC full load <30 min | 21 min hot restart | 60 / 75 MW/min | CC park mode 15% | n/s | 50%, pathway to 100% | US/60 Hz only; not usable directly on a 50 Hz grid | [GE Vernova 7HA](https://www.gevernova.com/gas-power/products/gas-turbines/7ha) |
| GE Vernova | 9HA.01 / 9HA.02 (50 Hz) | Heavy-duty H | 448 / 571 (net) | 42.9% / 44.0% (8,398 / 8,166 kJ/kWh) | >64% CC; <30 min to full plant load | 23 min (hot) | 65 / 88 MW/min | 30% turndown; park mode 7-15% | n/s | 50%, pathway to 100% | Brief only: one unit is larger than most campuses | [GE Vernova 9HA](https://www.gevernova.com/gas-power/products/gas-turbines/9ha) |
| Siemens Energy | SGT-A05 | Aero (small) | 4.0-5.8 (gross, 2019 brochure); Equinix reference 5 MW/unit | n/s | n/a | "Full power within 60 s" (2019); "<90 s" (Equinix reference) | n/s | n/s | n/s | "Hydrogen capability" (unquantified) | Used at Equinix DB5 Dublin | [Siemens portfolio 2019](https://www.amasenergy.com/sites/default/files/products/amas_import/industrialgasturbine_3446_1594746907_1594746907.pdf); [Siemens Energy Equinix ref.](https://assets.siemens-energy.com/dam/47e51057-e95f-4dba-9d0f-b29900a43d5a/Reference_TwoPager_Equinix-pdf_Original%20file.pdf) |
| Siemens Energy | SGT-A35 (34 MW geared DLE, 50/60 Hz; 39 MW geared non-DLE) | Aero | 33.7 (DLE) / 34.5 / 38.1 (gross); 34-39 range | 39.1% DLE (9,199 kJ/kWh); 40.5% at 38.1 MW (8,881 kJ/kWh); "up to 41%" | 1x1: 46.7-49.8 MW at 54.2-54.5%; 2x1: 92.6-100 MW at 53.7-54.7% (gross) | 10 min | up to 82 MW/min (load following); 21 MW/min (start-up) | 50% | n/s | Poster lists "WLE / 15% / DLE / 100%" with unclear pairing | Direct-drive version is 60 Hz only, so 50 Hz sites need the geared variant. Poster column mapping is ambiguous. | [SGT-A35 poster](https://assets.siemens-energy.com/dam/e91801e8-e149-4ac5-9e6f-b23000d7e0ff/sgt-a35-poster-for-print-pdf_Original%20file.pdf); [Siemens Energy peaker page (BR)](https://www.siemens-energy.com/br/pt/home/products-services/product/peaker-plants.html); [Siemens CC data 2025](https://assets.siemens-energy.com/dam/8224a82f-9ed8-475e-b946-b26c0169f8fd/brochure-combined-cycle-technical-Data-250121b-pdf_Original%20file.pdf) |
| Siemens Energy | SGT-A45 (mobile) | Aero, mobile | 44 at ISO, 60 Hz; 39-44 range; dual frequency | n/s ("high") | n/a | <8 min to full load, no hot lock-out | n/s | n/s | as low as 25 vppm | n/s | About 2 weeks to install; 4-unit 175 MW plant fits in about 1 ha (128 × 75 m); 3 trailers | [SGT-A45/SGT-750 brochure](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf) |
| Siemens Energy | SGT-400 | Industrial | 10.4-14.3 (gross, 2019) | n/s | n/s | n/s | n/s | n/s | n/s | n/s | Used at Meta/Williams Socrates | [Siemens portfolio 2019](https://www.amasenergy.com/sites/default/files/products/amas_import/industrialgasturbine_3446_1594746907_1594746907.pdf) |
| Siemens Energy | SGT-600 / SGT-700 | Industrial | 24.5 / 32.8 (gross, 2019) | n/s | SCC-600 1x1 36.5 MW at 50.7%; 2x1 74.2 MW at 51.6% (gross) | n/s | n/s | n/s | n/s | n/s | — | [Siemens portfolio 2019](https://www.amasenergy.com/sites/default/files/products/amas_import/industrialgasturbine_3446_1594746907_1594746907.pdf); [Siemens CC data 2025](https://assets.siemens-energy.com/dam/8224a82f-9ed8-475e-b946-b26c0169f8fd/brochure-combined-cycle-technical-Data-250121b-pdf_Original%20file.pdf) |
| Siemens Energy | SGT-750 | Industrial | 37-41 | 41-41.6% | SCC-750 1x1 53.9 MW at 54.1%; 2x1 108.1 MW at 54.3% (gross) | "Fast start"; one CHP project reached full load in 10 min | Not quantified ("rapid") | 50-100% load range | ≤9 ppmv gas; CO ≤25 ppmv | Fuel spec allows ≤15 mol% H2+CO | 40,000 h between overhauls | [SGT-A45/SGT-750 brochure](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf); [Siemens CC data 2025](https://assets.siemens-energy.com/dam/8224a82f-9ed8-475e-b946-b26c0169f8fd/brochure-combined-cycle-technical-Data-250121b-pdf_Original%20file.pdf) |
| Siemens Energy | SGT-800 | Industrial (heavy) | 45-62 (gross); 49.9-62.5 (2019) | up to 41.1% | Likely SCC-800: 1x1 about 66.5-89 MW at 57.2-59.6%; 2x1 about 134.5-182 MW at 57.8-60.6% (gross, for GT ratings 45-62 MW). The extraction labelled these rows "SGT-750", but the GT ratings match the SGT-800, so verify. | 10 min | 12.5 MW/min | 40% | "Low NOx", single-digit CO; no ppm figure | 75% vol (2023 poster); 100% targeted "by 2025" | >60% share of the 42-75 MW market; CC up to 6x1; reliability >99.4% | [Siemens Energy peaker page (BR)](https://www.siemens-energy.com/br/pt/home/products-services/product/peaker-plants.html); [SGT-800 poster 2023](https://assets.siemens-energy.com/dam/8a8e6ce3-5948-49f3-9bb7-b05d00e56df6/Poster-SGT-800-Feature-ENG-230127-pdf_Original%20file.pdf); [Siemens CC data 2025](https://assets.siemens-energy.com/dam/8224a82f-9ed8-475e-b946-b26c0169f8fd/brochure-combined-cycle-technical-Data-250121b-pdf_Original%20file.pdf) |
| Siemens Energy | SGT-A65 | Aero | 59.6-70.8 (gross, 2019) | n/s | n/s | n/s | n/s | n/s | n/s | n/s | — | [Siemens portfolio 2019](https://www.amasenergy.com/sites/default/files/products/amas_import/industrialgasturbine_3446_1594746907_1594746907.pdf) |
| Siemens Energy | SGT5-8000H / SGT5-9000HL (50 Hz) | Heavy-duty H/HL | 8000H: 450 gross; HL class: 405-593 | n/s | 8000H 1x1 675 MW, 2x1 1,350 MW at 62.4%; 9000HL 1x1 880 MW, 2x1 1,760 MW at >64% (gross) | n/s | HL: 85 MW/min | HL: 30% GT turndown; plant turndown <40% | n/s | n/s | Brief only | [Siemens CC data 2025](https://assets.siemens-energy.com/dam/8224a82f-9ed8-475e-b946-b26c0169f8fd/brochure-combined-cycle-technical-Data-250121b-pdf_Original%20file.pdf); [Siemens catalogue (DirectIndustry)](https://pdf.directindustry.com/pdf/siemens-power-genereration/gas-turbines-from-4-to-593-mw/23116-938938.html) |
| Mitsubishi Power Aero | FT8 MobilePac (trailer) | Aero, mobile | 28.5 (50 Hz) / 30.9 (60 Hz) | 34.7% / 36.7% (10,376 / 9,825 kJ/kWh) | n/a | 10 min from cold | n/s | n/s | Water injection (no ppm) | n/s | 2 trailers; 80 × 54 ft; no foundation; power "within one day" if pre-commissioned | [MHI FT8 MobilePac](https://power.mhi.com/regions/amer/products/aero-derivative-gas-turbine/ft8-mobilepac) |
| Mitsubishi Power Aero | FT4000 SwiftPac 70 / 140 | Aero | 70.2 / 140.5 (50 Hz); 71.9 / 144.2 (60 Hz) | 40.4-40.5% at 50 Hz (about 8,900 kJ/kWh); 41.5-41.6% at 60 Hz | n/s | about 10 min from cold | n/s | n/s | Water injection; SCR recommended per engine | n/s (separate H2 page) | GT unit 9 × 4 × 4 m, 43 t; flat foundation | [MHI FT4000 SwiftPac](https://power.mhi.com/regions/amer/products/aero-derivative-gas-turbine/ft4000-swiftpac) |
| Mitsubishi Power | H-25 | Heavy-duty (small) | 41.0 | 36.2% (9,949 kJ/kWh) | 1-on-1 60.1 MW at 54.0%; 2-on-1 121.4 MW at 54.5% | 22 min SC; 55 min CC | 3.4 MW/min (as published) | 50% | 15 ppm; CO 9 ppm at 15% O2 | n/s | 50/60 Hz | [MHI H-25](https://power.mhi.com/products/gasturbines/lineup/h25) |
| Mitsubishi Power | H-100 | Heavy-duty | 100-120 class | n/s | 150-170 / 300-350 MW class; 55-58% | n/s | n/s | n/s | n/s | n/s | — | [MHI lineup](https://power.mhi.com/products/gasturbines/lineup) |
| Mitsubishi Power | M501JAC (60 Hz) / M701JAC (50 Hz) | Heavy-duty J | about 453 / 448-574 class | n/s | 664 / 1,332 MW class (M501JAC); 650-840 MW class (M701JAC) | n/s | n/s | n/s | n/s | n/s | Brief only | [MHI lineup](https://power.mhi.com/products/gasturbines/lineup) |
| Solar Turbines (Caterpillar) | Titan 130 | Industrial | 16.53 | about 35.5% (10,130 kJ/kWh), derived | n/s | n/s | n/s | n/s | n/s (SoLoNOx) | n/s | Heat rate from a third-party guide; efficiency derived | [Solar ratings](https://www.solarturbines.com/en_US/products/turbine-ratings.html); [Diesel & Gas Turbine guide](https://www.dieselandgasturbineguide.net/c/c.aspx/SOL001/productspecs) |
| Solar Turbines | Titan 250 | Industrial | 23.1 | about 38.9% (9,260 kJ/kWh), derived | n/s | n/s | n/s | n/s | n/s | n/s | 2-shaft only | same as above |
| Solar Turbines | Titan 350 | Industrial | 38.0 | about 40.2% (8,965 kJ/kWh), derived | n/s | n/s | n/s | n/s | n/s | n/s | 2-shaft only; used at xAI Southaven | same as above |
| Solar Turbines | Mars 100 / Mars 90 | Industrial | 11.35 / 9.45 | about 32.9% / 31.9%, derived | n/s | n/s | n/s | n/s | n/s | n/s | — | same as above |
| Solar Turbines | Taurus 70 / Taurus 60 / Mercury 50 (recuperated) | Industrial | 8.18 / 5.67 / 4.6 | about 34.4% / 31.5% / 38.5%, derived | n/s | n/s | n/s | n/s | n/s | n/s | — | same as above |
| Baker Hughes | NovaLT16 | Industrial | 16.9 (generator drive) | 36.4% | CHP up to 84% | n/s | n/s | n/s | 15 ppm (9 ppm on request) | Starts and runs on 100% H2 with no hardware change | 50/60 Hz; hot gas path inspection 35,000 h, major 70,000 h | [Baker Hughes NovaLT16](https://www.bakerhughes.com/gas-turbines/novalt-technology/novalt16) |
| Capstone Green Energy | C1000S | Microturbine | 1.0 | 33% (10.9 MJ/kWh) | n/a | n/s | n/s | n/s | <9 ppmvd at 15% O2 (18 mg/m³) | n/s | 3.0 × 9.1 × 3.0 m; 17.1 t (grid-connect); exhaust 280 °C; datasheet ©2022 | [Capstone C1000S datasheet](https://d1io3yog0oux5.cloudfront.net/_76c0b637365040676f05fd35b8375f97/capstonegreenenergy/db/235/9470/file/C1000S+HPNG_331107F_lowres.pdf) |
| ProEnergy | PE6000 (overhauled GE CF6-80C2 core, LM6000-class) | Aero, refurbished core | about 48-50 | n/s | n/a | n/s | n/s | n/s | n/s | n/s | Sources disagree on per-unit rating (48 vs 50 MW) | [TFTC](https://www.tftc.io/ai-data-centers-used-turbines-six-year-lead-time-crusoe-proenergy); [Tom's Hardware](https://www.tomshardware.com/tech-industry/data-centers-turn-to-ex-airliner-engines-as-ai-power-crunch-bites) |

**Additional performance notes**
- **SGT-800 and SGT-A35, Siemens' own peaker summary:** SGT-800 is 45-62 MW, up to 41.1%, 10 min to full load, 12.5 MW/min, 40% minimum load. SGT-A35 is 34-39 MW, up to 41%, 10 min, up to 82 MW/min. — [Siemens Energy peaker plants (BR)](https://www.siemens-energy.com/br/pt/home/products-services/product/peaker-plants.html)
- **SGT6-5000F hydrogen:** can fire up to 30% hydrogen. — [Siemens Energy peaker plants (BR)](https://www.siemens-energy.com/br/pt/home/products-services/product/peaker-plants.html)
- **LM2500XPRESS emissions and footprint (Crusoe release):** GE Vernova says SCR gives "90% lower emissions" than gas or diesel reciprocating engines. It also says the 95% factory-assembled package saves real estate, switchgear and transformers. — [GE Vernova/Crusoe press release, 22 Jul 2025](https://www.gevernova.com/news/press-releases/ge-vernova-crusoe-announce-major-29-unit-aeroderivative-gas-turbine-deliver-ai-data-centers)
- **Secondary source on LM2500XPRESS NOx and lead times (low confidence):** a secondary, AI-maintained page gives raw LM2500XPRESS NOx of 25-40 ppm without SCR and <5 ppm with SCR, and a 24-32 kh maintenance interval. These figures are uncited and conflict with GE's 15 ppm DLE figure. — [Jared Watkins research page (secondary)](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/ge-vernova-aeroderivative/)
- **Solar ratings basis:** Solar publishes "typical new-equipment" ratings. Mars, Titan 250 and Titan 350 are 2-shaft only. — [Solar Turbines ratings](https://www.solarturbines.com/en_US/products/turbine-ratings.html)

### Inferences
- **Units needed per 100 MW** (my arithmetic, ISO rating, before N+1 or N+2 redundancy and before site derate):

  | Model | Rating used | Units per 100 MW |
  |---|---|---|
  | Capstone C1000S | 1 MW | about 100 |
  | NovaLT16 | 16.9 MW | about 6 |
  | Titan 130 | 16.5 MW | about 6-7 |
  | Titan 250 | 23.1 MW | about 4-5 |
  | FT8 MobilePac | 28.5 MW at 50 Hz | about 4 |
  | LM2500XPRESS | 34.5-36.3 MW | about 3 |
  | TM2500 | 34.5 MW | about 3 |
  | SGT-A35 | 34-38 MW | about 3 |
  | Titan 350 | 38 MW | about 3 |
  | H-25 | 41 MW | about 2.5 |
  | SGT-A45 | 44 MW | about 2.3 |
  | 6B | 45 MW | about 2.2 |
  | LM6000 PF+ | 56.9 MW | about 2 |
  | SGT-800 | 62 MW | about 1.6 |
  | FT4000 SwiftPac 70 | 70.2 MW | about 1.4 |
  | 6F.03 | 88 MW | about 1.1 |
  | LMS100 | 112.9 MW | about 1 |

  Aeroderivatives lose output faster than frames at high ambient temperature. That is why products such as the SGT-A45 offer water injection to hold 44 MW up to about 40 °C ([Siemens SGT-A45](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf)). A real-world N+1 or N+2 block for a 100 MW critical IT load is therefore likely 4-5 × 35 MW aero units, or 3 × 62 MW SGT-800.
- **Converting NOx ppm to mg/Nm³:** at 15% O2, 1 ppm of NOx is about 2 mg/Nm³ (as NO2). Capstone's 9 ppm = 18 mg/m³ is consistent with this. On that basis:
  - 15 ppm DLE (LM2500XPRESS, 6F.03, H-25, NovaLT16) ≈ 31 mg/Nm³.
  - 25 ppm (SGT-A45) ≈ 51 mg/Nm³.
  - 9 ppm (SGT-750, NovaLT16 option) ≈ 18 mg/Nm³.
- **Frequency:** 7HA, M501JAC, SGT6 and the direct-drive SGT-A35 are 60 Hz machines. For a European site use 9HA, M701JAC, SGT5, geared SGT-A35, or the dual-frequency aeroderivative packages. 50 Hz aero output is typically a few percent lower (FT8: 28.5 vs 30.9 MW; FT4000: 70.2 vs 71.9 MW).
- **Thermal input and directive thresholds:** at about 37-40% efficiency, any single gas turbine above roughly 18-20 MWe exceeds 50 MWth fuel input. Examples:
  - Titan 250: 23.1 MWe / 0.389 ≈ 59 MWth.
  - SGT-800: 62 / 0.41 ≈ 151 MWth.
  - Titan 130: 16.5 / 0.355 ≈ 46.5 MWth, which sits individually under the IED threshold.

  So most units in the 25-60 MW block-size sweet spot fall under IED Chapter III / LCP BREF rather than the MCPD (see section 5).

### Gaps
- Not retrieved (search budget exhausted):
  - Kawasaki GPB series (e.g. GPB180/GPB300)
  - Ansaldo Energia AE64.3A
  - Doosan Enerbility (DGT6-300H, 380 MW class)
  - MAN/Everllence MGT6000
  - Baker Hughes NovaLT12
  - GE LM9000
  - Siemens SGT-400/600/700 efficiency, start time and NOx
  - Solar Titan start times, ramp rates and SoLoNOx ppm
  - M501JAC/M701JAC simple-cycle efficiency
  - Capstone C65-C800
- Minimum emissions-compliant load is missing for most aeroderivatives (LM2500XPRESS, LM6000, LMS100, TM2500, FT8, FT4000, SGT-A45).
- No published NOx ppm figure was found for SGT-800, LM6000, LMS100, 7HA or 9HA.
- Combined-cycle MW for GE aeroderivatives and frames was blank on the GE pages (the 1x1/2x1 tabs had no values).
- The SGT-800 combined-cycle rows were mislabelled in the extracted Siemens brochure and need checking against the original PDF.

---

## 2. Real data centre projects using gas turbines (2024-2026)

### Takeaway
US hyperscale and AI campuses are using:
- many-unit fleets of 15-40 MW industrial and aeroderivative units (Titan 130/250/350, SMT-130, SGT-400, LM2500XPRESS, NovaLT16, refurbished CF6/LM6000 cores) for bridge power and off-grid prime power;
- HA- or JAC-class heavy-duty units for 1-3 GW dedicated plants with first power in 2027-2028.

European examples so far are small (Dublin, 45-110 MW). They are mostly peaking or backup, or engine-based, with a few larger UK proposals.

### Cited Findings

**xAI (Memphis, TN and Southaven, MS)**
- As of Sept 2025: 12 SMT-130 mobile turbines (about 16 MW each, about 192 MW) at Paul R. Lowry Rd, Memphis (Colossus-1), and 7 Titan 350s (>35 MW each, >245 MW) at Southaven, MS. About 460 MW in total, installed or under construction. — [Tom's Hardware, 18 Sep 2025](https://tomshardware.com/tech-industry/xai-pushes-power-strategy-towards-1gw-ai-factory)
- These were containerised bridge-power units, stood up in under a year. Shelby County permitted 15 turbines in July 2025 (under appeal). Southaven received a 12-month temporary authorisation. — [same source](https://tomshardware.com/tech-industry/xai-pushes-power-strategy-towards-1gw-ai-factory)
- In March 2026 the Mississippi DEQ approved a permanent construction permit for 41 gas turbines, up to 1.2 GW, at the former Duke Energy site in Southaven, to power Colossus 2 and the planned Colossus 3. Turbine models were not stated. — [Baxtel, 11 Mar 2026](https://baxtel.com/news/musk-s-xai-approved-for-41-natural-gas-turbines-in-mississippi-to-power-colossus-data-centers); [SELC, 10 Mar 2026](https://www.selc.org/press-releases/mississippi-regulators-rubber-stamp-air-permit-for-xai-power-plant-ignoring-overwhelming-public-pushback/)

**Crusoe with GE Vernova (Abilene, TX, Stargate)**
- 29 LM2500XPRESS packages (about 35 MW each, nearly 1 GW): 10 ordered in Dec 2024 and 19 in Q2 2025. The release cites "five-minute fast start" and SCR. — [GE Vernova press release, 22 Jul 2025](https://www.gevernova.com/news/press-releases/ge-vernova-crusoe-announce-major-29-unit-aeroderivative-gas-turbine-deliver-ai-data-centers)
- Tom's Hardware reports nearly 30 LM2500XPRESS units at the Stargate facility near Abilene. — [Tom's Hardware, 22 Oct 2025](https://www.tomshardware.com/tech-industry/data-centers-turn-to-ex-airliner-engines-as-ai-power-crunch-bites)
- A secondary source lists a separate "Stargate 29 × LM2500XPRESS" entry. It is probably the same order, but this is unconfirmed. — [Jared Watkins (secondary)](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/ge-vernova-aeroderivative/)

**Crusoe with ProEnergy**
- Ordered 16 Apr 2026: 13 PE6000 aeroderivative gensets built on overhauled GE CF6-80C2 cores. The article gives 50 MW each and 650 MW in total. The press-release URL says "48 MW". Delivery is targeted for summer 2027. — [TFTC, 9 Nov 2026](https://www.tftc.io/ai-data-centers-used-turbines-six-year-lead-time-crusoe-proenergy)

**Meta with Williams (New Albany, OH; "Socrates")**
- Socrates South, 200 MW, approved by the Ohio Power Siting Board on 9 Jun 2025:
  - 3 Solar Titan 250
  - 9 Solar PGM 130
  - 3 Siemens SGT-400
  - 15 Caterpillar 3520 engines
  - space for 1 SMT-130 mobile standby unit
  - 8 Cat C15 diesels (500 kW each) for black start
  
  The plant is not physically connected to the grid. In service is targeted by end-2026. — [Power Engineering, 11 Jun 2025](https://www.power-eng.com/onsite-power/onsite-gas-turbines-reciprocating-engines-to-power-meta-data-center/)
- Programme as of July 2026:

  | Site | Gas capacity | Target |
  |---|---|---|
  | Socrates South | about 252 MW | Q3 to end-2026 |
  | Socrates North | about 252 MW | Q3 to end-2026 |
  | STY | 306 MW | mid-2028 |
  | Neo | 676 MW | late 2028 |
  | **Total** | **1,486 MW** (1,431 MW turbines) | |

  Batteries add 838 MW / 1,676 MWh. Cost was about $1.6bn for the first two sites plus their substation. Williams has committed $5.1bn in total under a 10-year fixed-price PPA with Meta. — [Aterio, 6 Jul 2026](https://www.aterio.io/blog/socrates-williams-2gw-behind-the-meter-power-meta-new-albany-ohio)

**Chevron with Microsoft ("Project Kilby", West Texas)**
- 2.67 GW nameplate, phased, 100% behind the meter, with no ERCOT interconnection. Primarily GE Vernova 7HA (seven units committed), with supplemental Solar Turbines units. First power is targeted for 2028. Capex is estimated at $7-9bn. Deal announced 22 Jun 2026. — [Global Data Center Hub, 29 Jun 2026](https://www.globaldatacenterhub.com/p/chevron-and-microsoft-sign-9b-west)
- Earlier description: 2.5 GW initial, expandable to 5 GW, operations in 2027. This was based on the 2025 Chevron/Engine No. 1/GE Vernova 7HA programme. — [ENR, 14 Nov 2025](https://www.enr.com/articles/61972-chevron-to-build-its-first-data-center-power-plant-in-texas-permian-area)
- The two sources give different start dates (2027 vs 2028).

**Baker Hughes orders**
- **Frontier Infrastructure:** 16 NovaLT turbines, up to 270 MW, for behind-the-meter data centre sites in Wyoming and Texas; 100% H2 capable. — [Baker Hughes release, 29 May 2025](https://s21.q4cdn.com/548121662/files/doc_news/2025/05/baker-hughes-to-supply-novalt-gas-turbines-for-frontier-infrastructure-s-u-s-data-center-project-delivering-270-mw-of-reliable-power.pdf)
- **Dynamis Power Solutions:** 76 NovaLT16 units, about 1.3 GW, for "hypermobile" DT17 packages serving data centres and oil and gas. Booked Q2 2026. — [Turbomachinery Magazine, 11 Aug 2026](https://www.turbomachinerymag.com/view/baker-hughes-lands-76-unit-novalt16-order-from-dynamis-for-data-center-power)
- **Twenty20 Energy:** 10 Frame-5 turbines, up to 250 MW, for data centre projects in Georgia and Texas. Initial deliveries in 2027. — [Turbomachinery Magazine, 11 Feb 2026](https://www.turbomachinerymag.com/view/baker-hughes-wins-award-to-deliver-frame-5-gas-turbines-for-data-center-projects)

**Mitsubishi Power**
- Cheyenne Power Hub (Wyoming): 2 × M501JAC, about 1,150 MW, for a large data centre (project cost >$7bn). — [Power Engineering, 26 Oct 2026](https://www.power-eng.com/?p=137156)
- Mitsubishi estimates hyperscale data centres account for about 45% of growth in US heavy-duty gas turbine demand, which rose from 6.1 GW in 2020 to nearly 40 GW in 2025 (McCoy Power Reports data). — [same source](https://www.power-eng.com/?p=137156)

**Other US projects**
- **SB Energy Portsmouth Powered Land:** $33bn, 9.2 GW, potentially 24-30 heavy-duty turbines for the initial build-out (unveiled Feb 2026). — [Wood Mackenzie, 1 Apr 2026](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)
- **Caterpillar/Solar:** six publicly announced contracts of at least 1 GW each, including ProPower at 2.1 GW over five years. Caterpillar is expanding turbine capacity to 2.5× 2024 levels. — [TIKR, 20 May 2026](https://www.tikr.com/blog/caterpillar-power-chief-just-revealed-what-the-data-center-boom-really-means-for-cat-stock)
- **Contrast, engines not turbines:** VoltaGrid's 2.3 GW for Oracle uses INNIO Jenbacher reciprocating engines, with no turbines mentioned. — [POWER, 15 Oct 2025](https://www.powermag.com/oracle-taps-voltagrid-for-2-3-gw-modular-gas-fleet-to-power-ai-data-centers-across-texas/)
- **GE Vernova data centre orders:** over $5bn year-to-date to Q2 2026, more than double all of 2025. About 20% of the 100 GW under gas turbine contract is tied to data centre load (Q1 2026). — [Turbomachinery Magazine, 23 Jul 2026](https://www.turbomachinerymag.com/view/ge-vernova-gas-turbine-backlog-hits-116-gw-as-power-orders-more-than-double); [Power Engineering, 23 Apr 2026](https://www.power-eng.com/gas/turbines/data-centers-drive-record-surge-in-ge-vernova-power-equipment-orders-as-turbine-slots-tighten-through-2030/)

**Europe**
- **Equinix DB5, Dublin:** 9 × Siemens Energy SGT-A05 (5 MW each, 45 MW), N+1, dual-fuel, <90 s start. Used for peaking, emergency backup and grid support. — [Siemens Energy reference (©2025)](https://assets.siemens-energy.com/dam/47e51057-e95f-4dba-9d0f-b29900a43d5a/Reference_TwoPager_Equinix-pdf_Original%20file.pdf)
- **Pure DC with AVK, Dublin:** described as 90 MW of "dedicated gas-fired turbines", OEM not named, completed and announced March 2026. — [DeSmog, 29 Apr 2026](https://www.desmog.com/2026/04/29/inside-the-plot-to-cover-europe-with-gas-powered-ai-data-centres/)
  - Other outlets headline it as a 110 MW microgrid ([DataCentreNews UK](https://datacentrenews.uk/story/pure-data-centres-builds-110mw-dublin-microgrid-for-ai)).
  - A Wärtsilä reference PDF exists for the project ([Wärtsilä](https://www.wartsila.com/docs/default-source/energy-docs/references/pure-dc-AVK-data-centre.pdf)), which suggests reciprocating engines rather than turbines. Unverified.
- **Wapseys Wood, UK:** a 300 MW gas-powered data centre cleared in March 2026 to apply as nationally significant infrastructure. — [DeSmog](https://www.desmog.com/2026/04/29/inside-the-plot-to-cover-europe-with-gas-powered-ai-data-centres/)
- **Other UK and Germany:** seven UK data centre projects have been cleared to connect to the gas grid (Future Energy Network, via The Times). MWM (Caterpillar) cites German projects of up to 100 MW each, using engines. — [DeSmog](https://www.desmog.com/2026/04/29/inside-the-plot-to-cover-europe-with-gas-powered-ai-data-centres/)

### Inferences
- **Prime power versus bridge power:** off-grid prime-power plants (Socrates, Kilby) mix many 15-40 MW turbines, engines and batteries for N+X redundancy and block loading. Bridge or temporary fleets (xAI Memphis, Crusoe) favour trailer-mounted or packaged aeroderivative and industrial units (SMT-130, LM2500XPRESS, PE6000) that can later be redeployed.
- **Implied installed cost (low confidence):** Kilby works out at about $3,400/kW ($9bn / 2.67 GW). Socrates South and North work out at about $3,200/kW ($1.6bn / 504 MW of gas, but the scope includes a substation and possibly batteries). These are my arithmetic, not source figures.
- **Europe:** no large European prime-power gas turbine campus was found in operation. The European pattern so far is small aero or engine plants (Dublin) used for peaking or backup and grid support.

### Gaps
- Not retrieved (search budget exhausted):
  - OpenAI Stargate sites other than Abilene (e.g. Shackelford County, Milam County, New Mexico)
  - Meta Hyperion with Entergy (Louisiana CCGTs)
  - NextEra/GE Vernova co-development
  - Siemens Energy data centre deals (e.g. SGT-800 fleets)
  - Doosan Enerbility's reported US data centre orders (e.g. xAI)
  - Microsoft Ireland gas plant details
  - Boom Supersonic "Superpower" turbines
- The turbine models for xAI's 41-unit Southaven permit were not stated in the retrieved sources.
- The Cleanview behind-the-meter tracker (59 sites, about 90 GW) is paywalled. — [Cleanview](https://cleanview.co/reports/behind-the-meter-data-centers/full-report/colossus)

---

## 3. Delivery and lead times in 2026, backlogs, slot reservations, capacity expansion, smaller and used units

### Takeaway
New heavy-duty slots are essentially gone until 2029-2031:
- GE Vernova had about 10 GW left across 2029-2030 after Q1 2026.
- Mitsubishi says 2028-2029 is almost full and new deliveries are around 2031.
- Wood Mackenzie cites six-year average lead times.

Global orders (more than 100 GW) far exceed manufacturing capacity of 60-70 GW a year. Reservation fees are now standard; one cited example is $25M for one GE turbine.

Smaller and refurbished aeroderivative or industrial units are materially faster: refurbished PE6000 and Frame-5 orders placed in 2026 deliver in 2027, roughly 12-18 months.

### Cited Findings

**GE Vernova**
- End of Q3 2026: gas backlog plus slot reservation agreements (SRAs) of 122 GW (64 GW backlog, 58 GW SRAs, 13 GW converted in the quarter). At least 130 GW is expected by year-end. Q3 orders were 55 heavy-duty units (21 HA) and 57 aeroderivatives. Shipments were 5 GW. — [Turbomachinery Magazine, 29 Oct 2026](https://www.turbomachinerymag.com/view/ge-vernova-q3-2026-gas-power-backlog-122-gw-trench-acquisition)
- Q2 2026: 116 GW (53 GW backlog, 63 GW SRAs). Orders were 52 heavy-duty units (15 HA) and 61 aeroderivatives.
- Capacity: 20 GW/yr annualised output in Q3 2026, 24 GW in 2028, 30 GW in 2030. About 325 new machines were installed across factories by Q2 2026 and about 400 are expected by year-end. — [Turbomachinery Magazine, 23 Jul 2026](https://www.turbomachinerymag.com/view/ge-vernova-gas-turbine-backlog-hits-116-gw-as-power-orders-more-than-double)
- Slot availability: at the start of Q1 2026 there was about 10 GW of 2029 capacity; after Q1, about 10 GW remained across 2029 and 2030 combined. The CEO puts heavy-duty lead time at about three years. SRAs rose from 43 GW to 56 GW in Q1. — [Power Engineering, 23 Apr 2026](https://www.power-eng.com/gas/turbines/data-centers-drive-record-surge-in-ge-vernova-power-equipment-orders-as-turbine-slots-tighten-through-2030/)
- Expansion: over $160M to raise output from about 50 to 70-80 large-frame units a year by late 2026. — [Wood Mackenzie, 1 Apr 2026](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)
- Alternative framing: 70-80 heavy-duty units a year from H2 2026 and about 20 GW a year from 2027, with the backlog running through 2028. — [Gas Outlook, Apr 2026](https://gasoutlook.com/analysis/costs-to-build-gas-plants-triple-says-ceo-of-nextera-energy/)

**Siemens Energy (Q3 FY2026, to 30 Jun 2026)**
- Gas Services orders of €9.97bn (+61.9%), book-to-bill 2.65, segment backlog €73bn, group backlog €162bn (record). Data centres were cited as a US order driver. No unit, GW, capacity or lead-time figures were disclosed. — [Turbomachinery Magazine, 6 Aug 2026](https://www.turbomachinerymag.com/view/siemens-energy-posts-record-backlog-joining-ge-vernova-and-baker-hughes-in-a-record-quarter-for-gas-turbines)
- A $1bn US investment programme, with key facilities moved to 24/7 operation. — [Wood Mackenzie, 1 Apr 2026](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)

**Mitsubishi Heavy Industries / Mitsubishi Power**
- Large-frame backlog of 35 GW (from 23 GW a year earlier). FY2025: 35 large-frame units sold, 16 GW. Q1 FY2026: 10 large-frame orders (4 US, 6 Japan), for delivery in 2028-2030. Mitsubishi plans to double capacity from 2024 levels but will not immediately double order-taking. — [Utility Dive, 13 Aug 2026](https://www.utilitydive.com/news/mitsubishi-gas-turbine-backlog-earnings/827761/)
- $490M expansion of Savannah Machinery Works, adding 450,000 sq ft. — [Power Engineering, 26 Oct 2026](https://www.power-eng.com/?p=137156)
- October 2026: "We're talking about delivery at around 2031." Slots for 2028 and 2029 are almost full. Global orders of about 70-80 GW are projected for 2026. — [Bloomberg via Energy Connects, 28 Oct 2026](https://www.energyconnects.com/news/renewables/2026/october/high-demand-for-gas-turbines-is-pushing-out-deliveries-to-2031-mitsubishi-power-says/)

**Market-wide**
- Global orders of 110 GW at end-2025 against 60-70 GW a year of manufacturing capacity. Six-year lead times, with order books sold through 2027. Orders are expected to peak in 2026. — [Wood Mackenzie, 1 Apr 2026](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)
- November 2026: buyer conversations are "firmly focused on the 2030 to 2031 window" (Wood Mackenzie analyst). Jefferies puts US data centre demand at nearly 17 GW in 2026. — [TFTC, 9 Nov 2026, citing Reuters](https://www.tftc.io/ai-data-centers-used-turbines-six-year-lead-time-crusoe-proenergy)

**Caterpillar / Solar Turbines**
- Turbine capacity expanding to 2.5× 2024 levels, and large reciprocating engine capacity to nearly 3×. Record enterprise backlog of $63bn (Q1 2026). — [TIKR, 20 May 2026](https://www.tikr.com/blog/caterpillar-power-chief-just-revealed-what-the-data-center-boom-really-means-for-cat-stock)

**Baker Hughes**
- Industrial & Energy Technology (IET) orders of $7.1bn and a record IET backlog of $37.1bn (Q2 2026). Gas technology equipment orders rose more than fivefold. — [Turbomachinery Magazine, 6 Aug 2026](https://www.turbomachinerymag.com/view/siemens-energy-posts-record-backlog-joining-ge-vernova-and-baker-hughes-in-a-record-quarter-for-gas-turbines)

**Slot reservations and fees**
- GE Vernova, Siemens Energy and Mitsubishi Power all require a reservation fee to secure a manufacturing slot. Two Kentucky utilities paid GE Vernova $25M to reserve one turbine for a 2030 commercial operation date. — [Latitude Media, 17 Sep 2025](https://www.latitudemedia.com/news/gas-turbine-prices-are-up-and-arent-going-down-anytime-soon/)
- Development contracting now centres on managing turbine reservations and allocating payment, breakage and termination liabilities between power and data centre developers. New requests face "several years" of wait. No fee levels are given. — [Hunton / PFI, 6 May 2026](https://www.hunton.com/insights/publications/changing-market-for-powering-us-data-centres)

**Smaller, aeroderivative and refurbished units**
- **Crusoe/ProEnergy:** refurbished PE6000 units ordered April 2026 for summer 2027 delivery (about 15 months). Sulzer receives requests for used gas turbines for data centres "every few weeks". TVA reports that prices for new, used and refurbished equipment have "increased significantly". — [TFTC, 9 Nov 2026](https://www.tftc.io/ai-data-centers-used-turbines-six-year-lead-time-crusoe-proenergy)
- **Baker Hughes Frame-5:** awarded Feb 2026, initial deliveries in 2027. — [Turbomachinery Magazine, 11 Feb 2026](https://www.turbomachinerymag.com/view/baker-hughes-wins-award-to-deliver-frame-5-gas-turbines-for-data-center-projects)
- **LM2500XPRESS (low confidence, uncited secondary):** 24+ months for new orders as of Q4 2025, with a 12-18 month target by 2027. — [Jared Watkins (secondary)](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/ge-vernova-aeroderivative/)
- **Install time once delivered:**
  - TM2500 about 14 days ([GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/tm2500))
  - SGT-A45 about 2 weeks ([Siemens](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf))
  - FT8 MobilePac about one day if pre-commissioned ([MHI](https://power.mhi.com/regions/amer/products/aero-derivative-gas-turbine/ft8-mobilepac))
  - LM2500XPRESS about 2-4 weeks ([GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/lm2500))

### Inferences
- **Heavy-duty planning:** for a European campus ordering in 2027, assume heavy-duty F/H/J-class delivery in 2030-2031 at the earliest, unless a developer already holds a slot or SRA. The SRA market is effectively a secondary market for slots.
- **Aeroderivative and industrial planning:** orders in the 20-60 MW class (LM2500XPRESS, LM6000, SGT-800, Titan) appear to deliver in roughly 2-3 years. This rests on GE's about 60 aeroderivative orders a quarter, the 2026-to-2027 delivery of refurbished units and the secondary 24+ month figure. Exact quotes would need to come from OEMs.
- **Refurbished units:** refurbished or overhauled aero cores (PE6000, Frame-5) are the fastest route, at about 12-18 months.
- **Market timing:** global capacity is set to rise. GE is going to 24-30 GW a year, Mitsubishi is doubling and Solar is going to 2.5×. With orders expected to peak in 2026 (Wood Mackenzie), lead times could ease after about 2029. This is speculative.

### Gaps
- No quantified discount for used or refurbished turbines versus new was verified. A headline claims used turbines cost "up to 48% less" ([FourWeekMBA](https://fourweekmba.com/ai-used-turbines-cost-up-to-48-less-as-new-ones-take-6-years/)), but the page failed to load, so this is unverified.
- No OEM-published lead time in months for aeroderivatives (GE, Siemens, MHI) or for Solar or Baker Hughes industrial units was found.
- Siemens Energy has not disclosed slot or lead-time figures.
- Reservation fee levels beyond the single $25M example were not found. The ElectronEconomics analysis of slot reservations is paywalled ([ElectronEconomics](https://electroneconomics.substack.com/p/slotting-in-the-future-gas-turbine)).
- No Europe-specific delivery data was found. All slot data is global or US-centric.

---

## 4. Cost per kW (equipment and installed, simple and combined cycle) and price escalation

### Takeaway
Pre-shortage reference costs (EIA AEO2025, 2023 $) were about:
- $836/kW for a simple-cycle H-class CT
- $1,606/kW for an aeroderivative simple-cycle plant
- $868-921/kW for an H-class CCGT

By 2026, US CCGT installed costs are reported at about $2,000-2,500/kW (NextEra $2,400/kW; E3 about $2,500/kW for 2030 COD) and frame CTs at about $1,700/kW. Turbine equipment prices are up about 195% since 2019, heading to about $600/kW by end-2027. Implied all-in costs for behind-the-meter data centre plants are about $3,000-3,500/kW.

### Cited Findings

**Pre-shortage baseline**
- EIA AEO2025 capital cost study (Sargent & Lundy, Dec 2023; 2023 $, overnight):

  | Case | Capacity | Capital cost | Heat rate | Fixed O&M | Variable O&M |
  |---|---|---|---|---|---|
  | Aeroderivative simple-cycle, 4 × 54 MW | 211 MW | $1,606/kW | 9,447 Btu/kWh | $9.56/kW-yr | $5.70/MWh |
  | Simple-cycle H-class | 419 MW | $836/kW | 9,142 Btu/kWh | n/s | $1.24/MWh plus $23,100 per start |
  | CCGT H-class 2x2x1 | 1,227 MW | $868/kW | 6,266 Btu/kWh | n/s | n/s |
  | CCGT H-class 1x1x1 single-shaft | 627 MW | $921/kW | n/s | n/s | n/s |
  | CCGT with 95% carbon capture | n/s | $2,365/kW | n/s | n/s | n/s |

  — [EIA capital cost AEO2025](https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf)

**Escalation 2025-2026**
- **Wood Mackenzie (1 Apr 2026):** gas turbine prices are up 195% since 2019 and projected to reach $600/kW by end-2027. Turbines are about 20-30% of CCGT project cost, and a higher share for simple cycle. — [Wood Mackenzie](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)
- **GE Vernova:** new orders in H1 2026 are tracking 10-20 points higher in $/kW than Q4 2025 orders. — [Power Engineering, 23 Apr 2026](https://www.power-eng.com/gas/turbines/data-centers-drive-record-surge-in-ge-vernova-power-equipment-orders-as-turbine-slots-tighten-through-2030/)
- **NextEra CEO:** its last gas plant (2022) cost $785/kW; the same combined-cycle unit today costs $2,400/kW, about 3×. Jefferies says costs could reach $3,000/kW if renewable tax credits are repealed. — [Gas Outlook, Apr 2026](https://gasoutlook.com/analysis/costs-to-build-gas-plants-triple-says-ceo-of-nextera-energy/)
- **GridLab et al. (10 Sep 2025):** CCGTs completing in 2026 at $1,116/kW and in 2027 at $1,427/kW; recent projects at $2,000/kW. — [GridLab press release](https://gridlab.org/wp-content/uploads/2025/09/PRESS-RELEASE_Cost-of-Gas-1.pdf)
- **Latitude Media:** projects for 2030-2031 "routinely" report $2,000/kW or more, up to 75% above near-term prices. — [Latitude Media, 17 Sep 2025](https://www.latitudemedia.com/news/gas-turbine-prices-are-up-and-arent-going-down-anytime-soon/)
- **E3 RECOST Q1 2026 (23 Jan 2026):** median nominal capital cost for 2030 COD of about $1,700/kW for a frame CT and about $2,500/kW for a CCGT, with "a wide band of uncertainty". Levelised fixed cost for a frame CT (IPP) is $260/kW-yr. — [E3](https://www.ethree.com/recost-q1-2026-update/)

**Aeroderivative and behind-the-meter costs**
- **Secondary, uncited, low confidence:** complete installed aeroderivative plant about $2,000-3,000/kW; SCR about $50-100M per plant (5-10% of capex). — [Jared Watkins (secondary)](https://www.jaredwatkins.com/research/datacenters/behind-meter-power/ge-vernova-aeroderivative/)
- **Behind-the-meter project totals:**
  - Chevron/Microsoft Kilby: $7-9bn for 2.67 GW ([Global Data Center Hub](https://www.globaldatacenterhub.com/p/chevron-and-microsoft-sign-9b-west))
  - Williams Socrates South and North: about $1.6bn for about 504 MW of gas plus a substation ([Aterio](https://www.aterio.io/blog/socrates-williams-2gw-behind-the-meter-power-meta-new-albany-ohio))
  - Mitsubishi Cheyenne: >$7bn for about 1,150 MW, though project scope probably extends beyond the power plant ([Power Engineering](https://www.power-eng.com/?p=137156))

### Inferences
- **Implied turbine equipment price:** about $600/kW by 2027 ([Wood Mackenzie](https://www.woodmac.com/press-releases/gas-turbine-prices-soar-195-as-market-faces-supply-demand-crisis)) divided by 2.95 implies a 2019 baseline of about $200/kW. That is consistent with historic large-frame list prices. This is my back-calculation, not a source figure.
- **Suggested 2026 European planning ranges** (inference from US data, before European labour and permitting adjustments):

  | Plant type | Range | Basis |
  |---|---|---|
  | Heavy-duty CCGT | $2,000-2,500/kW | NextEra, E3, GridLab |
  | Frame simple-cycle | about $1,500-1,700/kW | E3, plus about 2× escalation on EIA $836 |
  | Aeroderivative or industrial multi-unit simple-cycle plant | about $2,000-3,000/kW | EIA aero $1,606 in 2023 $ plus escalation; secondary $2-3M/MW |
  | Off-grid behind-the-meter with redundancy, batteries, black start and gas infrastructure | about $3,000-3,500/kW | Kilby and Socrates implied figures |

- **Aeroderivative and industrial premium:** small units carry a higher $/kW than frames (EIA: aero $1,606 versus frame SC $836 in 2023 $). That premium is the price paid for faster start, modularity and shorter lead time.
- **Currency:** all figures are US dollars and mostly US-market. No euro-denominated European turbine price data was found.

### Gaps
- Not retrieved:
  - Gas Turbine World Handbook 2025/2026 equipment prices by model
  - NREL ATB 2024/2025 gas CT and CC costs
  - Lazard LCOE+ 2025/2026
  - European utility or TSO cost assumptions (e.g. UK DESNZ generation costs, Irish CRM)
- No source split equipment-only from installed costs for aeroderivative or industrial units in 2025-2026.
- No verified used or refurbished price data was found.

---

## 5. European constraints: IED/LCP BREF (≥50 MWth) and MCPD (1-50 MWth) NOx limits

### Takeaway
- **Units ≥50 MWth:** gas turbines of 50 MWth or more (roughly 18-20 MWe and up) fall under IED Chapter III / Annex V: NOx 50 mg/Nm³ and CO 100 mg/Nm³ at 15% O2, applying above 70% load. Simple-cycle units above 35% efficiency get an efficiency uplift to 50×η/35.
- **BAT levels for long-running new CCGTs:** the LCP BAT conclusions are tighter, at 10-30 mg/Nm³ yearly average and 15-40 mg/Nm³ daily average for NOx.
- **Implication:** a 15 ppm DLE machine (about 31 mg/Nm³) is marginal against BAT for prime-power duty, so SCR is likely.
- **Units 1-50 MWth:** these fall under the MCPD. It has applied to new plants since 20 Dec 2018, with limits applying above 70% load at 15% O2 and a 500 h/yr exemption.

### Cited Findings

**IED Annex V Part 2 (new plants)**
- Gas turbines including CCGTs on gaseous fuel: NOx 50 mg/Nm³ and CO 100 mg/Nm³.
- Single-cycle units with efficiency above 35% at ISO base load: NOx limit = 50×η/35 (about 57 mg/Nm³ at 40%).
- Reference O2 is 15%. Limits apply only above 70% load.
- Emergency units running under 500 h/yr are excluded.

— [IED 2010/75/EU Annex V Part 2 (legislation.gov.uk)](https://www.legislation.gov.uk/eudr/2010/75/annex/V/part/2/adopted)

**LCP BAT conclusions (as cited in the Keadby Next Generation permit BAT assessment)**
- New CCGT >50 MWth on natural gas: NOx 10-30 mg/Nm³ yearly average and 15-40 mg/Nm³ daily average; CO 5-30 mg/Nm³ (indicative).
- Plants with net electrical efficiency above 55% may adjust the upper end by multiplying it by EE/55.
- For DLN-equipped turbines, BAT-AELs apply only when DLN is effective.
- SCR is not applicable to plants operating under 500 h/yr.
- BAT 40 (combined cycle for new gas turbines) applies to units running over 1,500 h/yr.

— [Environment Agency, Keadby LCP BAT assessment, Appendix E1](https://consult.environment-agency.gov.uk/psc/dn17-3ef-keadby-next-generation-power-epr-hp3329ms/supporting_documents/appendix-e1-lcp-bat-assessmentpdf)

**MCPD (Directive (EU) 2015/2193)**
- Scope: 1 to <50 MWth; covers SO2, NOx and dust, with CO monitoring required.
- New plants: limits apply from start of operation, for plants operating on or after 20 Dec 2018.
- Existing plants: from 1 Jan 2025 for >5-50 MWth, and from 1 Jan 2030 for 1-5 MWth.
- NOx limits apply above 70% load. Values are at 15% O2 for turbines.
- 500 h/yr exemption: rolling three-year average for new plants, five-year for existing.
- Monitoring: periodic monitoring every year for plants above 20 MWth, every three years for 1-20 MWth.

— [Pollution Solutions / Uniper on MCPD](https://www.pollutionsolutions-online.com/article/air-monitoring/6/uniper-technologies/what-is-the-medium-combustionplant-directive-mcpd/2588); [MCPD text (legislation.gov.uk)](https://www.legislation.gov.uk/eudr/2015/2193/introduction/data.html)

**Published OEM NOx levels for comparison**
- 15 ppm DLE: LM2500XPRESS ([GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/lm2500)), 6F.03 ([GE Vernova](https://www.gevernova.com/gas-power/products/gas-turbines/6f-01)), H-25 ([MHI](https://power.mhi.com/products/gasturbines/lineup/h25)), NovaLT16 ([Baker Hughes](https://www.bakerhughes.com/gas-turbines/novalt-technology/novalt16))
- ≤9 ppmv: SGT-750 ([Siemens](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf))
- 25 vppm: SGT-A45 ([Siemens](https://assets.new.siemens.com/siemens/assets/api/uuid:4de437a8864594a098cf00eb86366a7ab1ad1760/sgt-a45-sgt-750-gas-turbines.pdf))
- <9 ppm (18 mg/m³): Capstone C1000S ([Capstone](https://d1io3yog0oux5.cloudfront.net/_76c0b637365040676f05fd35b8375f97/capstonegreenenergy/db/235/9470/file/C1000S+HPNG_331107F_lowres.pdf))
- Water injection only, with SCR recommended: FT8 and FT4000 ([MHI FT4000](https://power.mhi.com/regions/amer/products/aero-derivative-gas-turbine/ft4000-swiftpac))

### Inferences
- **Converting ppm** (about 2 mg/Nm³ per ppm at 15% O2):
  - 15 ppm DLE ≈ 31 mg/Nm³. This meets IED Annex V but sits above the 10-30 mg/Nm³ yearly BAT-AEL range for new CCGTs. Long-running (>1,500 h/yr) prime power will therefore likely need SCR or a 9 ppm combustor.
  - Water-injected FT8/FT4000 and 25 ppm SGT-A45 units would likely need SCR to meet the IED 50 mg/Nm³ limit (or the efficiency-adjusted limit of about 57 mg/Nm³) at baseload.
- **Applicability by unit size:**
  - Most 25-60 MWe units are individually ≥50 MWth, so IED/LCP rules apply.
  - Microturbines, NovaLT16, Titan 130 and the smaller Solar/Siemens units are individually <50 MWth (MCPD). They may be aggregated into an LCP if they discharge through a common stack, under the IED aggregation rules. Those rules were not retrieved.
- **Backup versus prime power:** backup-only operation under 500 h/yr is exempt from IED Annex V limits and SCR is not BAT. Prime power is not exempt. This is a key design split for European campuses.
- **CCGT efficiency trigger:** BAT 40 says new gas turbines running more than 1,500 h/yr should use combined cycle where applicable. A baseload open-cycle prime-power plant could therefore face pressure to add HRSGs in some member states. This is an inference to check against the full BAT conclusions.

### Gaps
- Not retrieved: the actual MCPD Annex II emission limit values for gas turbines on natural gas. I believe the new-plant NOx limit is 50 mg/Nm³ and the existing-plant limit is higher (about 150 mg/Nm³). That is from memory, unverified, and should not be used without checking Annex II.
- Not retrieved: the full LCP BAT conclusions (Decision (EU) 2017/1442, partly annulled and re-adopted in 2021) BAT-AELs for new OCGTs and for existing plants.
- Not retrieved: IED aggregation rules (Article 29).
- Not retrieved: the 2024 IED revision (Directive (EU) 2024/1785) changes affecting gas turbines.
- Not retrieved: national stricter limits (e.g. Netherlands, Germany 13./44. BImSchV, Ireland EPA).
