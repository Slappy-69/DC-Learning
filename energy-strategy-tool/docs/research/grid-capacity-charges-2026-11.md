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
