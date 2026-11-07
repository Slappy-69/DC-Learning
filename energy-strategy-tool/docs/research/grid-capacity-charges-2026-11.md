# Yearly grid charges per MW for a large demand customer, 31 countries (research, November 2026)

Part A of the research run of November 2026 (OPEN-QUESTIONS 160 to 165). The tool will get an optional tick, unticked by default, for a yearly charge per MW on each option's contracted grid capacity; a private wire avoids it. Today the tool has a per-MWh adder by country (`grid.priceAdder`, all indicative, €25–55/MWh) and a lump-sum connection charge. This charge is separate from both. Where no clear published charge exists, the tool will leave the value blank and flag "no published value found" (OPEN-QUESTIONS 165).

**Customer assumed:** a demand customer connected at 110 kV or above (the usual connection for a campus of 50 MW or more). Where the tariff differs by voltage, 110–150 kV and 220–400 kV are given separately.

**What is recorded for each country:** the tariff, operator, year and status; the yearly charge per MW (or kW) of contracted, connection or reserved capacity in the original currency; where the country charges on measured peak demand instead, the figure with the basis "peak"; the energy part (per MWh) and any fixed standing part separately, so nothing is counted twice against the per-MWh adder; bands, minimum periods and discounts; a worked example for a 100 MW customer where the tariff is a formula. Currencies and units are kept as published; the app converts.

**Confidence labels:** "published and clear"; "published, but unclear which tariff applies"; "worked out from a formula (calculation shown)"; "No published value found".

**Basis labels used in the table and the CSV:** "contracted" (charged on the contracted, connection or reserved capacity, whatever is drawn); "peak" (charged on measured demand: the highest quarter-hour or hour, or an average in set peak hours); "energy" (per MWh); "fixed" (per connection point or per month); "none" (no capacity charge at that level).

The summary table is at the top; country sections follow, in the order researched (PT, ES, NL, GB, IE, DE, FR, then alphabetical). The machine-readable version is `grid-capacity-charges-2026-11.csv`.

## Summary

(Filled in when every country is done.)

## Portugal (PT)

- **Tariff:** "Tarifa de Acesso às Redes" for customers in MAT (very high voltage, above 110 kV), set by the regulator ERSE (Directive 10/2025, article 15(a)) for 2026. The network operator at that level is REN. In force from 1 January 2026. One tariff covers 150, 220 and 400 kV.
- **Capacity part, two charges:**
  - **Contracted power: €0.0126 per kW per day**, that is €4.60 per kW a year, **€4,599 per MW a year** (worked out: 0.0126 × 365). Basis: contracted.
  - **Power in peak hours: €0.0716 per kW per day**, €26.13 per kW a year. Basis: peak. It is charged on the average power drawn during the tariff's peak-hour periods, not on the contracted power. An optional seasonal version charges €0.1002 / €0.0889 / €0.0546 per kW per day in the high / mid / low season.
- **Energy part:** €0.0073 (peak), €0.0069 (shoulder), €0.0067 (normal off-peak), €0.0063 (super off-peak) per kWh. Reactive energy €0.0236 (inductive) and €0.0177 (capacitive) per kvarh.
- **Fixed part:** none found in the access tariff.
- **Worked example, 100 MW contracted, flat 85 MW load (worked out):** contracted power 100,000 kW × €4.60 = €0.46 m a year; peak-hour power 85,000 kW × €26.13 = €2.22 m a year; energy about 745 GWh × €0.0068 ≈ €5.1 m a year. Total about €7.8 m a year, about €10.5 per MWh, in line with ERSE's own average for MAT of about €11.6/MWh in 2026 (read from a chart in ERSE's note on the 2027 proposal).
- **2027:** ERSE proposed (15 October 2026) a 1.3 % cut for MAT access tariffs, to an average of about €11.1/MWh; final tariffs are due by 15 December 2026.
- **Discounts:** electro-intensive customers get reductions on the policy-cost part (CIEG); ERSE gives an average MAT price of €9.0/MWh after them. Whether a data centre qualifies was not checked.
- **For the tool:** the per-MW charge on contracted capacity is small (€4,599/MW a year). Most of the network cost is the peak-hour power charge, which follows the load, so it behaves more like an energy charge for a flat load. Both together with the energy part are what `grid.priceAdder` (Portugal: €40/MWh, indicative) should cover if the tick is off; if the tick is on, only the contracted-power line belongs in the new charge, or the peak-hour line is counted twice.
- **Confidence:** published and clear.
- **Sources:** ERSE, Directive 10/2025 (2026 tariffs), https://www.erse.pt/media/lamnmp31/diretiva-erse-10-2025-tep-se-2026.pdf (regulator, December 2025, accessed 7 Nov 2026); ERSE, questions and answers on the 2027 proposal, https://www.erse.pt/media/5uzj003s/perguntas_e_respostas_proposta_tse_2027.pdf (regulator, 15 Oct 2026, accessed 7 Nov 2026).

## Spain (ES)

- **Tariff:** two parts billed together. (1) The transmission and distribution access tolls ("peajes"), set by the regulator CNMC (resolution of 18 December 2025, BOE 22 December 2025), in force from 1 January 2026. (2) The system charges ("cargos", policy costs), set by the Ministry (Orden TED/1524/2025 of 23 December 2025). The transmission operator is Red Eléctrica. Groups: **6.3TD for 72.5–145 kV** (110 and 132 kV) and **6.4TD for 145 kV and above** (220 and 400 kV, and connections to the transmission grid).
- **Capacity part (contracted power, € per kW per year, periods P1 to P6):**

  | Group | Part | P1 | P2 | P3 | P4 | P5 | P6 | Sum |
  |---|---|---|---|---|---|---|---|---|
  | 6.4TD | Tolls | 6.606205 | 3.935625 | 0.987554 | 0.686109 | 0.020376 | 0.013971 | 12.249840 |
  | 6.4TD | Charges | 1.299240 | 0.650162 | 0.472451 | 0.472451 | 0.472451 | 0.216540 | 3.583295 |
  | 6.3TD | Tolls | 10.397365 | 6.258717 | 2.096386 | 1.366437 | 0.044362 | 0.038723 | 20.201990 |
  | 6.3TD | Charges | 2.656027 | 1.329146 | 0.965679 | 0.965679 | 0.965679 | 0.442671 | 7.324881 |

  Each period's price applies to the power contracted for that period; the rules require the contracted power not to fall from P1 to P6. A flat data centre contracts the same power in all six, so the yearly charge is the sum (worked out): **6.4TD: €12,250 per MW a year in tolls plus €3,583 in charges, €15,833 per MW a year in all. 6.3TD: €20,202 plus €7,325, €27,527 per MW a year.** Basis: contracted.
- **Excess power:** drawing above the contracted power is billed per kW of excess (CNMC Annex II; for 6.4TD with hourly metering €2.736629 per kW in P1 down to €0.005787 in P6). So the contract must cover the peak.
- **Energy part (€ per kWh, P1 to P6):** 6.4TD tolls 0.008427 / 0.003946 / 0.001458 / 0.000716 / 0.000038 / 0.000004; 6.4TD charges 0.002848 / 0.002109 / 0.001139 / 0.000570 / 0.000365 / 0.000228. 6.3TD tolls 0.011279 / 0.005324 / 0.001994 / 0.000995 / 0.000048 / 0.000014; 6.3TD charges 0.007496 / 0.005552 / 0.002998 / 0.001499 / 0.000961 / 0.000600.
- **Fixed part:** none in the tolls or charges.
- **Worked example, 100 MW contracted in all periods (worked out):** 6.4TD €1.58 m a year (€1.22 m tolls, €0.36 m charges); 6.3TD €2.75 m a year.
- **Discounts:** consumers with the electro-intensive status (Royal Decree 1106/2020) can get reductions on the charges; whether a data centre qualifies was not checked. Other items on a Spanish bill (capacity payments, interruptibility, the operators' fees, the electricity tax of about 5 %) are outside the tolls and charges and were not researched here.
- **2027:** no 2027 proposal was found in a quick search.
- **For the tool:** the per-MW line is the power term (tolls and charges). The energy terms are what `grid.priceAdder` (Spain: €40/MWh, indicative) partly covers.
- **Confidence:** published and clear (the tolls checked against the BOE text, the charges against the Ministry's page; the sums are worked out).
- **Sources:** CNMC, resolution of 18 December 2025 (2026 access tolls), BOE-A-2025-26348, https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-26348 (regulator, 22 Dec 2025, accessed 7 Nov 2026); Ministry for the Ecological Transition, "Peajes de acceso … y cargos", with Orden TED/1524/2025 (BOE-A-2025-26705), https://www.miteco.gob.es/en/energia/energia-electrica/electricidad/peajes.html (government, December 2025, accessed 7 Nov 2026); EDP Energía, "Costes regulados del sector eléctrico 2026" (supplier summary used only to cross-check), https://www.edpenergia.es/media/fjwn01qi/peajes-el%C3%A9ctricos-2026.pdf.

## Netherlands (NL)

- **Tariff:** TenneT's transport tariffs ("transporttarieven") for customers on the extra-high-voltage grid (EHS: 220 and 380 kV) and the high-voltage grid (HS: 110 and 150 kV), set by the regulator ACM (tariff decision ACM/UIT/662819, 18 November 2025) for 2026. In force. TenneT's proposal for 2027 (29 September 2026) is with ACM.
- **Capacity part (2026):**

  | Level | Fixed per year | Contracted, € per kW per year | Weighted monthly maximum, € per kW per month | Option for use of at most 600 h a year |
  |---|---|---|---|---|
  | EHS (220/380 kV) | €12,478.96 | **49.28** | 6.17 | 24.63 per kW a year plus 2.13 per kW per week |
  | HS (110/150 kV) | €2,760.00 | **65.62** | 7.77 | 32.80 per kW a year plus 2.69 per kW per week |

  So **€49,280 per MW a year at EHS and €65,620 at HS on contracted capacity** (basis: contracted), **plus** a charge on the month's highest demand ("kW maxgewogen", weighted under ACM's time-of-use rules; the weighting itself was not checked): €74.04 per kW a year at EHS and €93.24 at HS if the peak is the same every month (basis: peak).
- **2027 proposal:** EHS 57.03 contracted and 4.44 a month; HS 79.66 and 9.24 a month. Not yet decided.
- **Energy part:** none in TenneT's transport tariff. (Energy tax and the renewable surcharge are levies outside this research.)
- **Fixed part:** €12,478.96 (EHS) or €2,760 (HS) a year per connection for the transport service. The connection service and metering are separate and were not researched.
- **Discounts:** the volume discount for large baseload users ("volumecorrectieregeling") was abolished from 2024 (ACM, 24 May 2023). None found today.
- **Worked example, 100 MW contracted at EHS, peak 100 MW every month (worked out):** contracted €4.93 m; monthly maximum 100,000 kW × €6.17 × 12 = €7.40 m; fixed €0.01 m. **About €12.3 m a year, about €123,000 per MW**, about €16.6/MWh at an 85 % load factor. At HS: €6.56 m + €9.32 m + €0.003 m ≈ €15.9 m a year.
- **For the tool:** the Netherlands is the clearest case of a large per-MW charge. Today `grid.priceAdder` (Netherlands: €45/MWh, indicative) carries all network cost per MWh. If the tick is on, the contracted part (€49,280/MW at EHS) is the new line, and the monthly-maximum part either stays in the adder or becomes a second per-MW line charged on the option's peak import. Counting both the adder and the per-MW lines would double count.
- **Confidence:** published and clear (the 2026 values read from the 2026 column of TenneT's 2027 proposal table, consistent with the corrections in ACM's 2026 decision).
- **Sources:** ACM, "Tarievenbesluit TenneT 2026", ACM/UIT/662819, https://www.acm.nl/system/files/documents/tarievenbesluit-tennet-2026-acm.pdf (regulator, 18 Nov 2025, accessed 7 Nov 2026); TenneT, tariff proposal 2027 to ACM, https://www.acm.nl/system/files/documents/tarievenvoorstel-tennet-op-land%202027.pdf (operator, 29 Sep 2026, accessed 7 Nov 2026); TenneT, "Transport tariffs 2026 set by ACM", https://www.tennet.eu/nl-en/news/transport-tariffs-2026-set-acm (operator, 27 Nov 2025); ACM, "In 2024 geen volumekorting meer voor grootverbruikers", https://www.acm.nl/nl/node/23740 (regulator, 24 May 2023).

## Great Britain (GB)

- **Tariff:** Transmission Network Use of System charges (TNUoS) for demand, published by NESO under the connection and use of system code, final tariffs for 2026/27 (January 2026), in force from 1 April 2026. Two parts: a **residual charge, fixed per site per day by band**, and a **locational charge per kW of demand in the three "Triad" half-hours** (the three half-hours of highest national demand between November and February, each at least ten days apart).
- **Voltage:** in England and Wales the transmission grid is 275 and 400 kV, and 132 kV is distribution ("EHV"); in Scotland 132 kV is transmission. A campus at 132 kV in England pays the EHV residual band and the distribution operator's site-specific EHV charges (EDCM) as well.
- **Residual part (2026/27, £ per site per day):** transmission-connected bands T-Demand1 £1,401.95, T-Demand2 £2,931.23, T-Demand3 £7,586.41, **T-Demand4 £20,829.24**; EHV bands EHV1 £325.48 to **EHV4 £5,698.39**. Transmission-connected bands are set by annual consumption (T-Demand4: over 163,880 MWh a year) and EHV bands by agreed capacity (EHV4: over 20,000 kVA), according to a secondary source (GridVolt, 22 April 2026); NESO's own band table was not read. A campus of 50 MW or more falls in T-Demand4 or EHV4 (worked out). Basis: **fixed per site, not per MW**: T-Demand4 is **£7.60 m a year per site**, EHV4 £2.08 m a year. NESO's five-year view (9 October 2026) forecasts T-Demand4 at £26,610.78 a day for 2027/28 (£9.71 m a year).
- **Locational part:** £ per kW of Triad demand. 2026/27 average £2.79/kW; zones 1 to 7 (Scotland, the North, North West, Yorkshire, North Wales and Mersey, East Midlands) are floored at zero. Zone values were read for 2027/28 (forecast, October 2026): Midlands £3.87, Eastern £1.41, London £5.49, South East £4.46, Southern £8.48, South Western £16.91 per kW. Basis: peak (Triad demand).
- **Energy part:** balancing services (BSUoS) and policy levies are charged per MWh; not researched here; they belong in the per-MWh adder.
- **Worked example, 100 MW transmission-connected campus in London, 85 MW in the Triads (worked out):** residual £7.60 m a year (the same for a 60 MW or a 600 MW site in band T-Demand4); locational 85,000 kW × £5.49 ≈ £0.47 m (2027/28 forecast rate). About £8.1 m a year, £81,000 per MW for 100 MW, but only £13,500 per MW for a 600 MW campus.
- **For the tool:** the GB residual is a charge **per site**, not per MW, so a per-MW tick on contracted capacity cannot represent it exactly. Two readings for the owner: enter it as a lump sum per year (it does not change between options that use the grid), or divide it by the campus's contracted MW (correct only for that size). The locational part is per kW of peak demand in winter. `grid.priceAdder` (GB: €55/MWh, indicative) carries all of this today.
- **Confidence:** published and clear for the rates; the band thresholds come from a secondary source.
- **Sources:** NESO, "Final TNUoS Tariffs for 2026/27", version 1.0, https://www.neso.energy/document/376336/download (operator, January 2026, accessed 7 Nov 2026); NESO, "Five-Year View of TNUoS", version 1.0, https://www.neso.energy/document/388496/download (operator, 9 Oct 2026, accessed 7 Nov 2026); NESO, "Transmission Demand Residual (TDR) guidance", https://www.neso.energy/document/288186/download (operator, undated); GridVolt, "TNUoS charges 2026" (band thresholds), https://www.gridvolt.com/blog/tnuos-charges-2026 (press, 22 Apr 2026).

## Ireland (IE)

- **Tariff:** EirGrid's demand transmission use-of-system tariffs (D-TUoS), approved by the regulator CRU. Tariff year 1 October 2025 to 30 September 2026 (CRU information paper CRU2025119, 26 August 2025). Schedule **DTS-T** for customers connected to the transmission system (110, 220 and 400 kV in Ireland). The 2026/27 tariffs (from 1 October 2026) were approved on 29 July 2026 (allowed transmission revenue up 8.1 %), but the 2026/27 tariff table was not found: CRU's publication pages do not allow automated reading.
- **Capacity part:** **Network Capacity Charge, DTS-T: €2,009.7013 per MW per month on the maximum import capacity (MIC)**, about **€24,116 per MW a year** (worked out). Basis: contracted (MIC). CRU's table prints "€/MW" without a period; the period is monthly according to EirGrid's bond rule (the MIC bond is the network capacity charge × 18 months × MIC) and the data centre policy paper (demand TUoS paid monthly on MIC). Distribution-connected schedule DTS-D1: €1,662.2188 per MW per month.
- **Energy part:** Network Transfer Charge €4.09/MWh; System Services Charge €26.4697/MWh off-peak and €29.1167/MWh at peak (17:00–19:00).
- **Policy levy on capacity:** the PSO levy (support for renewables and other public service obligations) is charged to medium and large business customers **per kVA of MIC per month: €0.24 from 1 October 2026** (€2,880 per MVA a year). Basis: contracted. It is a levy, not a network charge.
- **Fixed part:** none found in D-TUoS.
- **Worked example, 100 MW MIC at transmission, 85 % load factor (worked out):** capacity €2.41 m a year; transfer 745 GWh × €4.09 = €3.05 m; system services about €20 m; PSO about €0.29 m (at 100 MVA). The capacity line is about €24,000 per MW a year.
- **Also:** the MIC bond before signing a connection offer is 18 months of the capacity charge × MIC (about €3.6 m for 100 MW at 2025/26 rates), see Part C and D.
- **For the tool:** the per-MW line is the Network Capacity Charge on MIC (the tool's contracted capacity). Transfer and system services charges are per MWh and belong in `grid.priceAdder` (Ireland: €50/MWh, indicative); system services alone are about €27/MWh.
- **Confidence:** published and clear (2025/26); the monthly period is worked out from EirGrid's bond rule; the 2026/27 rate was not found.
- **Sources:** CRU, "Electricity transmission network allowed revenues for 2026 and TUoS tariffs for 2025/26", CRU2025119, https://cruie-live-96ca64acab2247eca8a850a7e54b-5b34f62.divio-media.com/documents/Electricity_Transmission_Network_Allowed_Revenues_for_2026_and_TUoS_Tariffs_for_2025-2.PDF (regulator, 26 Aug 2025, accessed 7 Nov 2026); CRU, "CRU approves 2026/27 electricity network charges and reduced PSO levy", https://www.cru.ie/about-us/news/cru-approves-202627-electricity-network-charges-and-reduced-pso-levy/ (regulator, 29 Jul 2026); EirGrid, "Connection charges and security", https://www.eirgrid.ie/industry/customer-information/connection-charges-and-security (operator); Bord Gáis Energy, "What is the PSO levy for business customers?" (supplier, for the kVA basis). Not reachable: EirGrid's Statement of Charges 2025/26 PDF (the site does not allow automated reading) and CRU's publication page for the 2026/27 paper.

## Germany (DE)

- **Tariff:** the network charges of the four transmission operators (50Hertz, Amprion, TenneT Germany, TransnetBW), uniform across Germany. 50Hertz's final price sheet for 2026 (8 December 2025), in force from 1 January 2026. Set with the €6.5 bn federal subsidy to transmission charges for 2026 (§ 24c EnWG). Customers connected at the extra-high-voltage level (HöS, 220 and 380 kV) or at the transformation level to 110 kV at a transmission substation (HöS/HS). A campus connected to a distribution operator's 110 kV grid pays that operator's price sheet instead (not researched; it differs by operator).
- **Capacity part (2026), for 2,500 or more use hours a year (a flat data centre):** **HöS €53.06 per kW a year; HöS/HS €76.70 per kW a year.** Below 2,500 hours: €11.39 and €17.18. Basis: **peak**. The capacity price is multiplied by the **year's highest withdrawal** ("Jahreshöchstleistung", StromNEV § 17(2)), not by a contracted figure; the year's peak comes from quarter-hour metering.
- **Energy part:** HöS 0.69 ct/kWh (€6.90/MWh); HöS/HS 0.43 ct/kWh (≥ 2,500 h). Statutory levies come on top (published on netztransparenz.de; not researched).
- **Fixed part:** metering €3,584 a year per metering point at HöS and HöS/HS.
- **One-off:** a connection cost contribution (Baukostenzuschuss): HöS €96.91/kW, HöS/HS €113.15/kW. This is not a yearly charge; it belongs with the tool's lump-sum connection charge.
- **Bandload discount:** a customer with at least 7,000 use hours and more than 10 GWh a year can agree an individual charge of no less than 20 % of the published charge (15 % at 7,500 h, 10 % at 8,000 h), with the regulator's approval (StromNEV § 19(2)). A flat data centre usually meets the test. A law firm blog (2026) says the ordinance runs to 31 December 2028, an extension to 2031 applies to existing customers only, and the future of the bandload rule is to be decided in early 2027. Treat it as uncertain for a new campus.
- **From 2029:** the regulator's AgNes reform moves customers above 100,000 kWh a year from the annual peak price to a **booked capacity price (€ per kW a year)**, with a surcharge for exceeding it (draft, framework decision expected at the end of 2026). That would make Germany's basis "contracted".
- **Worked example, 100 MW peak, 745 GWh a year, at HöS (worked out):** capacity 100,000 kW × €53.06 = €5.31 m; energy 745 GWh × €6.90 = €5.14 m; about €10.4 m a year, about €14/MWh. At HöS/HS: €7.67 m + €3.20 m ≈ €10.9 m. With the bandload discount at 8,000 h the charge could fall to as little as 10 % of that.
- **For the tool:** today's German charge is on the year's measured peak, not on contracted capacity; for a flat campus the two are close. The per-MW line would be €53,060 (HöS) or €76,700 (HöS/HS) per MW a year; the energy part belongs in `grid.priceAdder` (Germany: €55/MWh, indicative). The bandload discount could cut the per-MW line by up to 90 %; it needs the owner's decision (question A2 in the progress file).
- **Confidence:** published and clear.
- **Sources:** 50Hertz, "Preisblatt 2026" (final, 8 Dec 2025), https://www.50hertz.com/xspProxy/api/staticfiles/50hertz-client/dokumente/vertragspartner/netzkunden/netzzugang/251205_finales%20preisblatt%2050hertz%202026.pdf (operator, accessed 7 Nov 2026); Stromnetzentgeltverordnung (StromNEV) §§ 2, 17, 19, https://www.gesetze-im-internet.de/stromnev/BJNR222500005.html (government, accessed 7 Nov 2026); Energie und Recht, "Rechenzentren: Netzentgelte, Bandlast und die AgNES-Reform", https://www.energieundrecht.com/blog/rechenzentren-netzentgelte-bandlast-agnes (law firm blog, 2026, accessed 7 Nov 2026).

## France (FR)

- **Tariff:** the transmission tariff TURPE 7 HTB, set by the regulator CRE and applied by RTE, grid in force from 1 August 2025 (RTE brochure, July 2025). CRE changed the grid on 1 August 2026 (deliberation 2026-104 of 21 May 2026: +3.34 % on average, applied to the "2026 reference grids"); the 2026 grid itself could not be read (the tables in CRE's PDF did not come through), so the figures below are the August 2025 grid.
- **Voltage domains:** HTB1 above 50 up to 130 kV (63 and 90 kV); HTB2 above 130 up to 350 kV (150 and 225 kV); HTB3 above 350 up to 500 kV (400 kV). France has no 110 kV level; 63/90 kV is HTB1.
- **Capacity part:** charged on the **subscribed power** for each of five time classes (peak, winter full hours, winter off-peak, summer full hours, summer off-peak). The formula charges b1 × the peak-class power plus, for each later class, its coefficient × the increase over the class before. With the same power subscribed in every class (a flat campus), only b1 is paid (worked out). Basis: contracted.
  - **HTB3 (400 kV): no power charge at all.** The withdrawal charge is energy only: 0.41 c€/kWh (€4.10/MWh).
  - **HTB2, long-use version: b1 = €11.28 per kW a year → €11,280 per MW a year.** Energy 0.67 / 0.64 / 0.59 / 0.52 / 0.48 c€/kWh.
  - **HTB1, long-use version: b1 = €41.64 per kW a year → €41,640 per MW a year** (the extraction tool flagged this row as a reading of the page layout: check). Energy 0.73 / 0.70 / 0.63 / 0.57 / 0.52 c€/kWh.
  - Short- and medium-use versions have lower power coefficients and higher energy coefficients; a flat campus would pick the long-use version (worked out).
- **Exceeding the subscribed power** is charged separately (not researched).
- **Fixed part:** management component €11,545.32 a year (HTB); metering €800.04 (RTE's meter) or €682.20 (customer's meter) per device a year.
- **Worked example, 100 MW subscribed, 745 GWh a year (worked out, 2025 grid):** HTB3: power €0, energy about €3.05 m, about €4.1/MWh. HTB2 long use: power €1.13 m, energy about €4.1 m (about 0.55 c€/kWh on average). HTB1 long use: power €4.16 m, energy about €4.6 m.
- **Discounts:** the brochure mentions none. French law has a network tariff reduction for electro-intensive sites; it was not researched and its use by data centres was not checked.
- **For the tool:** a 400 kV campus in France pays no per-MW network charge. At 150/225 kV it is about €11,000 per MW a year. The energy part belongs in `grid.priceAdder` (France: €40/MWh, indicative).
- **Confidence:** published and clear for the 2025 grid; the 2026 grid (about 3 % higher on average) was not read.
- **Sources:** RTE, "Tarification des réseaux : comprendre le tarif" (TURPE 7, July 2025), https://www.services-rte.com/files/live/sites/services-rte/files/plaquette_consoprod_TURPE7-VF.pdf (operator, accessed 7 Nov 2026); CRE, deliberation 2026-104 on the change of TURPE 7 HTB on 1 August 2026, https://www.cre.fr/fileadmin/Documents/Deliberations/2026/260521_2026-104_Evolution_TURPE_7_HTB.pdf (regulator, 21 May 2026, accessed 7 Nov 2026).

## Austria (AT)

- **Tariff:** network usage charge ("Netznutzungsentgelt") under the system charges ordinance of the regulator E-Control (SNE-V 2018 as amended for 2026, BGBl. II Nr. 305/2025, 18 December 2025), in force from 1 January 2026. Level 1 is the transmission grid of APG (220 and 380 kV); level 2 is the transformation to 110 kV; level 3 is 110 kV, priced by regional area.
- **Capacity part:** level 1 (Österreich zone) **900.0 cent/kW, that is €9.00 per kW a year, €9,000 per MW a year**; level 2 **1,000.0 cent/kW (€10,000 per MW a year)**; level 3 (110 kV) 2,028 to 5,484 cent/kW by area (€20,280 to €54,840 per MW a year; Oberösterreich €24,120, Wien €38,520, Niederösterreich €48,480). The regulation prints "Cent/kW" without a period; it is read as a yearly price because ENTSO-E's 2025 synthesis gives €8.70/kW for level 1 in 2025. Basis: taken as **peak** (measured demand); the text read does not say how the demand is measured.
- **Energy part:** level 1: 0.2550 cent/kWh plus 0.1360 cent/kWh, and the network loss charge 0.092 cent/kWh (about €4.8/MWh in all); level 2: 0.4200 plus losses 0.145 cent/kWh; level 3: 0.46–0.90 cent/kWh plus losses up to 0.146.
- **Fixed part:** none found in the ordinance read.
- **Worked example, 100 MW at level 1 (worked out):** capacity €0.90 m a year; energy about 745 GWh × €4.8 = €3.6 m. At 110 kV in Niederösterreich: capacity €4.85 m plus energy about €6.6 m.
- **Change ahead:** a new principles ordinance (SNE-G-V, BGBl. II 2026/299) under the new electricity law is to change tariff structures from 2027 (not researched).
- **Confidence:** published, but the period of the capacity price and its basis were not stated in the text read.
- **Sources:** BGBl. II Nr. 305/2025 (SNE-V 2018, amendment 2026), copy published by TINETZ, https://www.tinetz.at/uploads/tx_bh/765/tinetz_sne-v_2026.pdf?mod=1766133961 (regulator's ordinance, 18 Dec 2025, accessed 7 Nov 2026); ENTSO-E, "Overview of Transmission Tariffs in Europe: Synthesis 2025", https://eepublicdownloads.blob.core.windows.net/public-cdn-container/clean-documents/mc-documents/transmission-tariffs/l_260405_entso-e_TTO_2025_03.pdf (EU body, 2026, accessed 7 Nov 2026).

## Belgium (BE)

- **Tariff:** Elia's grid access tariffs for 2024–2027, approved by the regulator CREG; 2026 values. In force. One level covers the 380, 220, 150 and 110 kV network; 70/36/30 kV is the next level down.
- **Capacity part (380/220/150/110 kV, 2026):**
  - **Power made available for offtake ("puissance mise à disposition"): €8.7676 per kVA a year** on the contracted offtake capacity, **€8,768 per MVA a year**. Basis: contracted. Drawing above it is billed for that month and the next 11 months at this tariff plus 50 %.
  - **Monthly peak: €0.4525 per kW per month** (the month's highest quarter-hour, outside April–September weekdays 10:00–19:00) and **annual peak: €11.0243 per kW a year** (highest quarter-hour in winter weekday evenings over 12 months). Basis: peak. Together about €16.45 per kW a year at a constant peak (worked out).
  - At 70/36/30 kV: €14.9049/kVA a year, €0.6765/kW a month and €16.3701/kW a year.
- **Energy part:** system management €2.5209, market integration €0.6851, power and black-start reserves €1.7108 per MWh: €4.92/MWh. Federal and regional levies are extra (not researched; ENTSO-E notes €0.81/MWh for regional taxes on towers and cables).
- **Fixed part:** a yearly fee for managing the connection bay (in Elia's separate connection tariffs; not researched).
- **Worked example, 100 MVA contracted, 100 MW peak, 745 GWh (worked out):** contracted €0.88 m; peaks €0.54 m + €1.10 m; energy €3.66 m. About €6.2 m a year; the per-MW contracted line alone is €8,768/MVA.
- **Confidence:** published and clear.
- **Sources:** Elia Transmission Belgium, "Tarifs pour accès au réseau, période 2024-2027", https://www.elia.be/-/media/project/elia/elia-site/customers/tarrifs-and-invoicing/20231206_tarifs-pour-acces-au-reseau-2024-2027.pdf (operator, 6 Dec 2023, accessed 7 Nov 2026).

## Bulgaria (BG)

- **Tariff:** prices for access to and transmission through the transmission network of ESO, set yearly by the regulator EWRC (KEVR) from 1 July (decision Ц-13 of 1 July 2026, period 1 July 2026 to 30 June 2027). Bulgaria uses the euro from 2026.
- **Capacity part:** **none.** ESO's charges to end consumers are per MWh. **No published value found** for a per-MW charge (searched EWRC decisions Ц-12 and Ц-13 of 1 July 2026 and its press release of 2 June 2026).
- **Energy part:** ESO's application of 31 March 2026 asked for €0.22/MWh (access) and €9.22/MWh (transmission), against €0.18 and €7.60 for 2025/26. EWRC made corrections; the final prices were beyond the part of the decision that could be read. A separate "obligations to society" charge per MWh also applies (not found).
- **For the tool:** the tick should stay blank for Bulgaria; network charges belong in `grid.priceAdder` (€35/MWh, indicative).
- **Confidence:** No published value found (capacity); published, but final value not read (energy).
- **Sources:** EWRC, decision Ц-13 of 1 July 2026, https://www.dker.bg/uploads/reshenia/2026/res-c-13-2026.pdf (regulator, accessed 7 Nov 2026); EWRC, decision Ц-12 of 1 July 2026, https://www.dker.bg/uploads/reshenia/2026/res-c-12-2026.pdf; EWRC press information, 2 June 2026, https://www.dker.bg/uploads/2026/Pres_prices_072026.pdf.

## Croatia (HR)

- **Tariff:** transmission tariff items of HOPS, set by the regulator HERA. The 2025 items (HERA decision, NN 145/2024) were read from HOPS's page; the 2026 items (NN 150/2025, in force 1 January 2026) were not found, but HERA's notice of 12 December 2025 says it accepted a 10 % increase for HOPS.
- **Capacity part (2025, high voltage):** **billing peak active power €2.081 per kW**, taken as a monthly charge on the month's measured peak (the page does not print the period; Croatian peak-power prices are monthly), about **€24.97 per kW a year, €24,970 per MW a year**. Basis: peak.
- **Energy part (2025):** €0.005946/kWh (higher daily tariff) and €0.002972/kWh (lower), about €3–6/MWh (the page's columns were poorly aligned). Excess reactive energy €0.023784/kvarh.
- **Fixed part:** €10.108 a month per metering point.
- **Worked example, 100 MW peak each month, 2025 items (worked out):** capacity €2.50 m a year; energy about €3.3 m.
- **Confidence:** published, but the period of the peak charge and the 2026 values were not confirmed.
- **Sources:** HOPS, "Usluge prijenosa", https://www.hops.hr/usluge-prijenosa (operator, accessed 7 Nov 2026), citing HERA's decision NN 145/2024, https://narodne-novine.nn.hr/clanci/sluzbeni/2024_12_145_2403.html; HERA, notice of 12 December 2025, https://www.hera.hr/hr/docs/2025/Obavijest_2025-12-12.pdf (regulator).

## Cyprus (CY)

- **No published value found.** Searched the regulator CERA's price analysis page and summaries of the EAC tariffs (2026). Network use of system charges in Cyprus are presented per kWh within the supply tariffs (high-voltage commercial and industrial tariff code 50); no per-kVA or per-kW network charge for a high-voltage (132 kV) customer was found. The transmission system operator is TSOC; the grid owner is EAC.
- **For the tool:** blank and flagged; network charges stay in `grid.priceAdder` (€40/MWh, indicative).
- **Sources:** CERA, "Analysis of electricity prices", https://www.cera.org.cy/en-gb/katanalotes/details/times-ilektrikis-energeias (regulator, undated, accessed 7 Nov 2026).

## Czechia (CZ)

- **Tariff:** the regulator ERÚ's price decision for network services. The 2025 decision (11/2024) was read; the 2026 decision was not found (ERÚ's 2026 bulletin read holds the methodology for 2026–2030, not the prices; an industry article says regulated components moved about +1.1 % in the 2026 draft). A new tariff structure for 110 kV and transmission starts in 2027 (ERÚ, not researched).
- **Capacity part (2025):**
  - **Customers connected to the transmission system (ČEPS, 220 and 400 kV): 104,942 CZK per MW per month**, about **1,259,304 CZK per MW a year**, billed on the month's highest quarter-hour power drawn (point 2.4). Basis: peak.
  - **110 kV (VVN) distribution customers, annual reserved capacity: 109,554 (ČEZ Distribuce), 95,783 (EG.D), 112,078 (PREdistribuce) CZK per MW per month**, about 1.15–1.34 million CZK per MW a year. Basis: contracted (reserved for the year). Monthly reservations cost more (105,784–123,566).
- **Energy part (2025):** use of the transmission network 26.91 CZK/MWh; use of 110 kV networks 31.08–54.66 CZK/MWh; system services 170.92 CZK/MWh; renewables support (POZE) 495 CZK/MWh in the 2026 draft.
- **Worked example, 100 MW at transmission, 2025 prices (worked out):** capacity about 126 million CZK a year (roughly €5 m); energy about 745 GWh × 198 CZK = 147 million CZK, plus POZE.
- **For the tool:** Czechia has one of the largest capacity charges in this survey (about 1.26 million CZK, roughly €50,000, per MW a year).
- **Confidence:** published (2025); 2026 values not read.
- **Sources:** ERÚ, price decision 11/2024 (prices for 2025), copy at https://euroenergie.cz/CenovaRozhodnutiERU/2025/ERU-CR_2024_11.pdf (regulator's decision, accessed 7 Nov 2026); ERÚ, Energetický regulační věstník 9/2025 (methodology 2026–2030), https://portal.gov.cz/vestniky/eeuaau7/1583280064.pdf; energie.cz, "Regulované ceny pro rok 2026" (press, 1 Dec 2025).

## Denmark (DK)

- **Tariff:** Energinet's tariff catalogue for 2026, under methods approved by the regulator Forsyningstilsynet. In force. From 2026, consumers connected directly to the transmission grid pay the grid tariff as a capacity subscription instead of per kWh.
- **Capacity part:** **"effektabonnement" DKK 59,187 per MW a year** for transmission-connected consumers, set by how much capacity the customer needs (read as subscribed capacity; the catalogue does not say measured or subscribed). Basis: contracted. With a limited grid access agreement (curtailable access): **DKK 19,729 per MW a year**.
- **Energy part:** grid loss tariff 1.42 % of the spot price; system tariff 7.2 øre/kWh (DKK 72/MWh), **cut by 90 % to 0.72 øre/kWh for consumption above 100 GWh a year**. (Distribution-connected users pay a grid tariff of 4.3 øre/kWh instead of the subscription.)
- **Fixed part:** system subscription DKK 187 a year per metering point.
- **Worked example, 100 MW subscribed, 745 GWh (worked out):** subscription DKK 5.92 m; system tariff 100 GWh × DKK 72 + 645 GWh × DKK 7.2 = DKK 11.8 m; losses about 1.4 % of the energy bill. With a limited-access agreement the subscription falls to DKK 1.97 m.
- **For the tool:** a clean per-MW charge on subscribed capacity (about €7,900 per MW a year), with a cheaper curtailable option that matches the tool's flexibility settings.
- **Confidence:** published and clear.
- **Sources:** Energinet, "Energinets tarifkatalog 2026", https://www.energinet.dk/media/ikylsqle/energinets-tarifkatalog-2026.pdf (operator, accessed 7 Nov 2026); Energinet, "Fremskrivning af Energinets eltariffer 2025-2027", https://www.energinet.dk/media/alpn1j0h/fremskrivning-af-energinets-eltariffer-2025-2027-1.pdf (operator, Sep 2024).

## Estonia (EE)

- **Tariff:** Elering's transmission price list, approved by the Competition Authority (decision 7-3/2026-025, 1 February 2026), in force from 5 May 2026. Customers at 330 kV and at 110 kV, with two price packages.
- **Capacity part (€ per MVA a year):**
  - **330 kV:** package I **€6,425.85** (plus €14.50/MWh and €90,779.76 a year per consumption point); package II **€11,958.54** (as read, with no per-MWh transmission fee).
  - **110 kV:** package I **€10,785.86** (plus €23.67/MWh and €11,487.92 a year per point); package II **€19,232.56**.
  - Basis: taken as contracted (a fee per MVA of capacity); the page does not say whether it is the permitted or the ordered capacity.
- **Energy part:** package I transmission fee as above; security of supply charge €7.58/MWh from 1 January 2026 on all consumed energy; renewable energy charge (not read); reactive energy €1.88/MVArh.
- **Worked example, 100 MVA at 330 kV, 745 GWh (worked out):** package I: €0.64 m + €10.8 m + €0.09 m ≈ €11.5 m; package II: €1.20 m + €0.09 m ≈ €1.3 m. As read, a large flat load would choose package II; check that package II really carries no transmission fee per MWh.
- **Confidence:** published, but the package II terms and the capacity basis need checking against Elering's price list document.
- **Sources:** Elering, "Price list and standard terms and conditions", https://www.elering.ee/en/price-list-and-standard-terms-and-conditions (operator, price list from 5 May 2026, accessed 7 Nov 2026); Elering, "Varustuskindluse tasu", https://elering.ee/varustuskindluse-tasu (operator, accessed 7 Nov 2026).

## Finland (FI)

- **Tariff:** Fingrid's main grid service pricing for 2026 (Appendix 2, in force from 1 January 2026). The main grid is 110, 220 and 400 kV.
- **Capacity part:** **none for consumption.** Fingrid charges capacity fees only to power plants (€189.5 per MW a month) and energy storage (€94.75 per MW a month on each side). Basis: none.
- **Energy part:** consumption fee €10.47/MWh on winter weekdays 07:00–21:00 (1 December to end of February) and €2.97/MWh at other times; grid intake fee €1.07/MWh. Reactive power above the connection point's limits: €1,000 per Mvar a month and €5.00/Mvarh.
- **Fixed part:** none listed.
- **Worked example, flat 85 MW (745 GWh) (worked out):** about 6 % of hours are winter weekday daytime, so about €2.8 m in consumption fees plus €0.8 m intake fee, about €4.8/MWh. No per-MW charge.
- **Coming:** Fingrid has proposed that data centres flex 30 % of their demand in faults or shortages, and the government is preparing priority rules for connections (Part B). Fingrid's 2027 prices are published (attachments on its fees page; not read).
- **For the tool:** the tick should hold €0 per MW for Finland, with a note that the network charge is per MWh.
- **Confidence:** published and clear.
- **Sources:** Fingrid, "Kantaverkkopalveluhinnoittelu 2026" (Appendix 2), https://www.fingrid.fi/globalassets/dokumentit/fi/palvelut/kayttovarma-sahkonsiirto/liite-2-kantaverkkopalveluhinnoittelu-2026.pdf (operator, 1 Jan 2026, accessed 7 Nov 2026); Fingrid, "Main grid contract and service fees", https://www.fingrid.fi/en/grid/grid-connection-agreement-phases/main-grid-contract-and-service-fees/ (operator).

## Greece (GR)

- **Tariff:** transmission system use charges (ΧΧΣ) of IPTO (ADMIE), approved by the regulator RAAEY (decision Ε-189/2025, Government Gazette Β΄7211, 31 December 2025), applied from 1 February 2026. The transmission grid customer level is 150 kV ("ΥΤ", high voltage).
- **Capacity part:** **€4,391 per MW per month** for high-voltage customers, **€52,692 per MW a year** (worked out). The figure comes from two press and supplier summaries of the decision, not from the decision itself; one says it is charged on measured peak power. Basis: taken as **peak**, to confirm.
- **Energy part:** none for high-voltage customers in the transmission charge (the summaries say so). Other regulated charges per MWh (public service obligations, special levies) are outside this research.
- **Worked example, 100 MW peak every month (worked out):** €5.27 m a year.
- **Confidence:** published, but read from secondary summaries; check against decision Ε-189/2025.
- **Sources:** RAAEY, "Εφαρμογή νέων Χρεώσεων Χρήσης Συστήματος", https://www.raaey.gr/energeia/genika-nea/121807/ (regulator, 15 Jan 2026, accessed 7 Nov 2026); Thriassio, "Οι νέες χρεώσεις Συστήματος σε αριθμούς", https://thriassio.gr/xxs-revma-1-2-2026/ (press, 14 Jan 2026); Selectra Greece, "Χρέωση μεταφοράς ηλεκτρικής ενέργειας 2026", https://selectra.gr/energeia/timologia-reymatos/xreosi-metaforas-ilektrikis-energeias-ti-einai-kai-pos-ypologizetai (supplier comparison site).

## Hungary (HU)

- **Tariff:** network use charges ("rendszerhasználati díjak") set nationally by the regulator MEKH (decision H2995/2025), in force from 1 January 2026; read from E.ON's published sheet. Large customers connect at high voltage (NAF, 120 kV and above); a customer connected at a high/medium-voltage substation is "NAF/KÖF".
- **Capacity part:** **contracted capacity charge ("lekötött teljesítménydíj") 2,376 HUF per kW a year at NAF**, **2,376,000 HUF per MW a year** (about €6,000). Basis: contracted. NAF/KÖF: 8,004 HUF/kW a year.
- **Energy part:** distribution 1.98 HUF/kWh (NAF); transmission 3.39 HUF/kWh, listed with a 100 % discount under MEKH decree 10/2024 (who qualifies was not checked); reactive energy 3.26 HUF/kVArh. Other per-MWh levies (renewables support and others) apply on top (ENTSO-E lists €13.50/MWh for renewables support); not researched.
- **Fixed part:** 433,008 HUF a year per connection point (NAF).
- **Worked example, 100 MW contracted, 745 GWh (worked out):** capacity 237.6 million HUF; distribution energy 1.48 billion HUF; transmission energy 2.53 billion HUF before any discount.
- **Confidence:** published and clear (the capacity charge); the transmission discount needs checking.
- **Sources:** E.ON Hungary, "Rendszerhasználati díjak" from 1 January 2026 (MEKH H2995/2025), https://www.eon.hu/content/dam/eon/eon-hungary/documents/hatarozatok-szabalyzatok-aram/arak-tarifak/Aram_RHD_EON_20260101.pdf (operator publishing the regulator's charges, accessed 7 Nov 2026).

## Iceland (IS)

- **Tariff:** Landsnet's tariff for transmission and system services. The latest version that could be read is **tariff no. 43, valid from 1 April 2022**; Landsnet has changed its tariff since (a news item "Breytingar á gjaldskrá" could not be read), so these values are old.
- **Capacity part (2022):** for **large users ("stórnotendur") USD 27,435 per MW a year**; for distribution operators ISK 6,760,830 per MW a year. Charged on the **average of the four highest monthly 60-minute peaks** of the year at each delivery point (art. 4.5). Basis: peak.
- **Energy part (2022):** large users USD 1.388/MWh; distribution operators ISK 489.56/MWh; system services ISK 69.99/MWh and losses ISK 387.73/MWh on all withdrawals.
- **Fixed part:** delivery point charge USD 47,097 a year (large users).
- **Which applies to a data centre:** not checked; most Icelandic data centres buy through distribution operators, whose own tariffs would then apply.
- **Confidence:** published, but out of date (2022) and the customer class unclear.
- **Sources:** Landsnet, "Gjaldskrá fyrir flutning á raforku og kerfisþjónustu nr. 43", https://www.landsnet.is/library?itemid=085e1cec-0533-4d22-97a6-03d0643edc20 (operator, 1 Apr 2022, accessed 7 Nov 2026).

## Italy (IT)

- **Tariff:** the transmission tariff (TRAS) of the regulator ARERA's integrated text for 2024–2027 (TIT, delibera 616/2023/R/eel), updated for 2026 by delibera 573/2025/R/eel (23 December 2025). Terna is the operator. One value for high voltage, for very high voltage below 380 kV and for 380 kV and above.
- **Capacity part:** **TRASP 2,939.69 c€ per kW a year, €29.40 per kW, €29,397 per MW a year**, charged per kW of "potenza impegnata" (committed power). Basis: contracted (ARERA's wording); in Italian rules the committed power of a metered customer may be set from the measured monthly maximum: to check.
- **Energy part:** TRASE 0.076 c€/kWh (€0.76/MWh). Distribution, metering and the general system charges ("oneri generali", mostly per kWh, with some per-kW parts) are separate; not researched.
- **Worked example, 100 MW committed, 745 GWh (worked out):** power €2.94 m; energy €0.57 m.
- **Confidence:** published and clear.
- **Sources:** ARERA, "Tariffa per il servizio di trasmissione", https://www.arera.it/area-operatori/prezzi-e-tariffe/tariffa-per-il-servizio-di-trasmissione (regulator, 2026 values, accessed 7 Nov 2026); ARERA, delibera 573/2025/R/eel, https://www.arera.it/fileadmin/allegati/docs/25/573-2025-R-eel.pdf (regulator, 23 Dec 2025).

## Latvia (LV)

- **Tariff:** AST's transmission tariffs for 2026–2028, approved by the regulator SPRK (Public Utilities Commission) on 27 November 2025. In force from 1 January 2026.
- **Capacity part:** **330 kV busbars €6.759 per kW a year (€6,759 per MW)**; 110 kV lines €11.376; 110 kV busbars €12.959 per kW a year. Charged on the **nominal capacity (kVA) of the customer's transformers** from their technical documentation. Basis: contracted (installed capacity, fixed whatever is drawn).
- **Energy part:** €1.39/MWh (330 kV), €1.45 (110 kV lines), €1.98 (110 kV busbars).
- **Worked example, 100 MVA of transformers at 330 kV, 745 GWh (worked out):** capacity €0.68 m; energy €1.04 m.
- **For the tool:** the basis is transformer capacity, which is usually larger than the contracted grid capacity (N+1 transformers): charging on the option's contracted MW would understate it.
- **Confidence:** published and clear.
- **Sources:** AST, "Transmission tariff", https://ast.lv/en/content/transmission-tariff (operator, tariffs 2026–2028, accessed 7 Nov 2026).

## Lithuania (LT)

- **No published value found for 2026.** The regulator VERT's tariff page refused the request, and Litgrid's price page shows 2017–2019 only. Those older prices had a capacity component (about €1.2–1.3 per kW, period not clear on the page) and an energy component (0.389–0.434 ct/kWh at 330–110 kV), plus system services per kW. ENTSO-E's 2025 synthesis puts Lithuania's transmission charge for its standard customer at €31.1/MWh, one of the highest in Europe, all of it charged to load.
- **For the tool:** blank and flagged until the 2026 prices are read from VERT's decision.
- **Sources:** Litgrid, "Service prices", https://www.litgrid.eu/index.php/services/service-prices/2480 (operator, accessed 7 Nov 2026); ENTSO-E, "Overview of Transmission Tariffs in Europe: Synthesis 2025" (EU body). Not reachable: VERT, https://vert.lt/elektra/Puslapiai/tarifai/elektros-energijos-perdavimo-paslaugos-kainos.aspx.

## Luxembourg (LU)

- **Tariff:** Creos network use tariffs for 2026 (version of 26 November 2025), approved by the regulator ILR. In force. Customers at 220 kV and 65 kV.
- **Capacity part (over 3,000 use hours a year):** **220 kV €6.54 per kW a year (€6,540 per MW)**; 65 kV €8.87 per kW a year. Under 3,000 hours: €1.11 and €3.59. Basis: not stated in the tariff sheet (annual peak or connection capacity); taken as **peak**, to check.
- **Energy part (over 3,000 h):** 220 kV €0.0005/kWh; 65 kV €0.0031/kWh.
- **Fixed part:** metering at 220 kV (THT) €124.06 a month.
- **Note:** the 2026 tariffs include a €150 m state contribution that lowers them.
- **Worked example, 100 MW at 220 kV, 745 GWh (worked out):** power €0.65 m; energy €0.37 m.
- **Confidence:** published, but the basis of the power charge was not stated.
- **Sources:** Creos Luxembourg, "Tarifs électricité 2026", https://www.creos-net.lu/fileadmin/dokumente/downloads/fr_tarif_electricite_2026.pdf (operator, 26 Nov 2025, accessed 7 Nov 2026).

## Malta (MT)

- **No published value found.** Malta has no separate transmission tariff: Enemalta runs the network and sells bundled supply tariffs to non-residential customers. A search of Enemalta's non-residential pages and general searches found no separately published network or demand charge per kVA or kW for a high-voltage customer. Malta is not in the tables of ENTSO-E's 2025 synthesis.
- **For the tool:** blank and flagged; the bundled supply price would have to come from Enemalta.
- **Sources:** Enemalta, "Non-residential property services", https://enemalta.com.mt/?p=13811 (operator, accessed 7 Nov 2026).

## Norway (NO)

- **Tariff:** Statnett's transmission tariffs for 2026 (tariff booklet 2026), under the regulator RME. In force. Statnett's 2027 booklet is published (not read). Many Norwegian data centres connect to regional grids, which publish their own tariffs (not researched).
- **Capacity part:** **fixed component for consumption NOK 135 per kW a year (NOK 135,000 per MW)**, charged on the **average withdrawal in the national peak-load hour over the previous five years**, times the connection point's k-factor (which lowers it where generation shares the connection point; floor 0.6). Basis: peak (a historical average in one hour a year, so a new campus has no history at first: how a new connection is billed was not stated). **Large consumers** (one enterprise at one site with withdrawal above 15 MW and more than 100 GWh a year) **get 50 % off: about NOK 67.50 per kW a year**. Billed monthly.
- **Energy part:** the hourly area price × the marginal loss rate (day and night/weekend rates, capped at ±15 %), published weekly.
- **Reactive power:** NOK 40 per kVAr above 10 MVAr.
- **Worked example, 100 MW campus qualifying as a large consumer (worked out):** 100,000 kW × NOK 67.50 = NOK 6.75 m a year (about €0.58 m).
- **Confidence:** published and clear.
- **Sources:** Statnett, "Tariffer for transmisjonsnettet 2026", https://www.statnett.no/globalassets/for-aktorer-i-kraftsystemet/tariff/tariffhefte-2026.pdf (operator, accessed 7 Nov 2026).

## Poland (PL)

- **Tariff:** PSE's tariff for 2026 (consolidated text of 16 January 2026), approved by the regulator URE.
- **Capacity part:** final customers connected to the transmission grid (group II) pay the **fixed component of the network rate monthly on their contracted capacity ("moc umowna", ordered by 25 August for the next year)** (section 2.1.1.1). Basis: contracted. **The rate itself could not be read**: the tables of section C did not come through from the PDF. **No published value found** in readable form.
- **Capacity market fee:** charged per MWh consumed in URE's designated peak hours (2025: PLN 141.20/MWh according to ENTSO-E; 2026 rate in URE notice 58/2025, not read), multiplied by 0.17 to 1.00 according to how much peak-hour use exceeds off-peak use. A flat data centre gets the 0.17 multiplier (worked out). Per MWh, not per MW.
- **Energy part:** variable network component, quality rate, renewables and CHP fees per MWh (rates not read); industrial customers can get 15 % or 25 % factors on the renewables and CHP fees.
- **For the tool:** blank and flagged until the rate is read from section C of the tariff.
- **Sources:** PSE, "Taryfa dla energii elektrycznej na rok 2026" (consolidated, 16 Jan 2026), https://www.pse.pl/documents/20182/7005343691/20260116_Tekst_Taryfy_na_2026_tekst_jednolity.pdf (operator, accessed 7 Nov 2026); ENTSO-E, "Overview of Transmission Tariffs in Europe: Synthesis 2025" (EU body).

## Romania (RO)

- **Tariff:** Transelectrica's transmission tariff for extraction (TL) and the system services tariff, set by the regulator ANRE (orders 74/2025 and 73/2025), from 1 January 2026; read from a supplier's summary (Axpo Romania).
- **Capacity part:** **none.** All transmission, system service and distribution charges are per MWh. Basis: none.
- **Energy part:** TL 36.45 RON/MWh; system services 14.70 RON/MWh (changed from 1 October 2026: not read); 110 kV distribution 23.83 to 40.46 RON/MWh by distribution operator.
- **For the tool:** €0 per MW; network charges stay per MWh.
- **Confidence:** published and clear (from a supplier summary of the ANRE orders).
- **Sources:** Axpo Romania, "Tarife reglementate EE 01.01.2026", https://www.axpo.com/content/dam/axpo19/countries/romania/26012025_Tar%20regl%20EE_01.01.2026.pdf (supplier, accessed 7 Nov 2026).

## Slovakia (SK)

- **Tariff:** SEPS's tariffs for users connected directly to the transmission system, set by the regulator ÚRSO (decision 0010/2025/E of 25 October 2024) for 1 January 2025 to 31 December 2027; system services by decision 0067/2026/E (3 December 2025) for 2026.
- **Capacity part:** **reserved capacity tariff €22,217.50 per MW a year** on the reserved capacity. Basis: contracted. (Before 2025: €26,489.57.)
- **Energy part:** transmission €1.9358/MWh; losses €1.6745/MWh; system services 2026 €1.0979 to €10.9796/MWh by group (how a customer is grouped was not read).
- **Worked example, 100 MW reserved, 745 GWh (worked out):** capacity €2.22 m; transmission and losses €2.69 m; system services €0.8–8.2 m depending on the group.
- **Confidence:** published and clear.
- **Sources:** ÚRSO, decision 0010/2025/E (SEPS), https://data.urso.gov.sk/CISRES/Agenda.nsf/0/4A472CEB7C135CFCC1258BBF002DB1D4/$FILE/0010_2025_E.pdf (regulator, 25 Oct 2024, accessed 7 Nov 2026); ÚRSO, decision 0067/2026/E (system services 2026), https://data.urso.gov.sk/CISRES/Agenda.nsf/0/971AC1B41B518692C1258D5400329F43/$FILE/0067_2026_E.pdf (regulator, 3 Dec 2025).

## Slovenia (SI)

- **Tariff:** the Energy Agency's act on tariff items for network charges (consolidated text in force 1 March to 31 December 2026), for the transmission network of ELES. Since 2024 Slovenia charges power by five time blocks: block 1 is the most expensive and applies only in the high season (November to February); block 5 the cheapest, only in the low season.
- **Capacity part (user group 0, taken as customers on the transmission network; the text read numbers the groups without naming them):** €0.28011 / 0.07462 / 0.02114 / 0.00075 / 0.00015 per kW per month for blocks 1 to 5, charged on the power agreed for each block (Slovenia's method; not printed in the text read). With the same power in every block: **about €2.28 per kW a year, €2,280 per MW** (worked out: four high-season months of blocks 1–4 and eight low-season months of blocks 2–5). Basis: contracted.
- **Energy part:** €0.00774 / 0.00671 / 0.00551 / 0.00602 / 0.00440 per kWh by block, about €5–6/MWh.
- **Worked example, 100 MW in all blocks, 745 GWh (worked out):** power €0.23 m; energy about €4.3 m.
- **Confidence:** published, but the group naming and the power basis need checking against the act itself (read through a consolidated copy).
- **Sources:** "Akt o določitvi tarifnih postavk za omrežnine elektrooperaterjev", consolidated 1 March 2026, https://tax-fin-lex.si/dokument/podrobnosti/b12a35d0-81c2-4df5-946b-f6bb5c074f52 (regulator's act via a legal database, accessed 7 Nov 2026).

## Sweden (SE)

- **Tariff:** Svenska kraftnät's transmission grid tariff, overseen by the regulator Ei. The latest price list found was for 2024; the 2026 list was not found. A tariff review is under way (Svenska kraftnät's papers on fixed and subscription charges, 2025).
- **Capacity part:** a **power charge ("effektavgift") on the annual subscribed power for withdrawal**, varying by connection point with latitude. Basis: contracted. The withdrawal values in the 2024 list did not come through as SEK/kW (they extracted as percentages: 49–50 at Stockholm points, 56–57 in Skåne), so **no published value found** in readable form. Temporary subscriptions: 1/200 of the yearly charge per week and kW. Overrun: SEK 2,800 per MW per hour from the third hour.
- **Energy part:** losses: (spot price + SEK 13/MWh) × the point's loss factor (negative, a credit, at southern withdrawal points).
- **Scale:** ENTSO-E's 2025 synthesis puts Sweden's transmission charge for its standard case at about €1.16/MWh, the lowest in Europe.
- **For the tool:** blank and flagged; likely small.
- **Sources:** Svenska kraftnät, "Prislista 2024 för transmissionsnätet", https://www.svk.se/siteassets/aktorsportalen/anslut-till-transmissionsnatet/transmissionsnatstariff/aktuella-prislistor/prislista-2024-for-transmissionsnatet.pdf (operator, accessed 7 Nov 2026); ENTSO-E, "Overview of Transmission Tariffs in Europe: Synthesis 2025" (EU body).
