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
