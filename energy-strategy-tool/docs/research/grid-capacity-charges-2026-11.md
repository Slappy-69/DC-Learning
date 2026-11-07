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
