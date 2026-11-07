# Levies and taxes on grid electricity for a large campus, by country (research, November 2026)

Follow-on to the research run of 7 November 2026 (owner's choice, 7 November 2026: "1"). Part A gave the **network** charges by country; this note adds the **policy levies and taxes per MWh** (renewables and CHP support, public service obligations, capacity mechanism charges, electricity tax), so the per-MWh adder (`grid.priceAdder`, today €25–55/MWh, indicative) can be set as network + levies, each with its source. **Research and proposals only: nothing in `app/` or the defaults register changes.** VAT is left out: a business recovers it.

**Customer assumed:** a data centre campus of about 100 MW connected at transmission level, flat load, about 745 GWh a year. Where a reduction exists for large or energy-intensive users, it is recorded, with whether a data centre qualifies (often it does not: many reductions are for manufacturing only).

Confidence labels as in the other notes. The machine-readable list is `levies-and-taxes-2026-11.csv`.

## Summary

(Filled in when the countries are done.)

## Germany (DE)

- **Levies 2026 (ct/kWh, published by the network operators on netztransparenz.de; read from a local operator's sheet of 31 October 2025):** CHP levy (KWKG) **0.446**; offshore grid levy **0.941**; § 19 StromNEV levy **1.559 on the first 1 GWh per metering point, at most 0.050 above it** (0.025 for manufacturing with electricity costs above 4 % of turnover); concession fee for special-contract customers **0.11** (whether it applies at a transmission connection was not checked).
- **Electricity tax (Stromsteuer) 2026: 2.05 ct/kWh** (€20.50/MWh). From 2026 a permanent cut applies to certain companies (manufacturing, agriculture, forestry); a data centre is a service activity and is taken as paying the standard rate (to check).
- **Reductions:** the CHP and offshore levies can be cut for listed electricity-intensive sectors under the Energiefinanzierungsgesetz; data centres were not checked and are taken as not eligible.
- **Worked out for 745 GWh:** CHP 4.46 + offshore 9.41 + § 19 levy about 0.52 (1 GWh at 15.59, the rest at 0.50) + concession 1.10 + electricity tax 20.50 = **about €36.0/MWh**. With the network charges of Part A (€14.0/MWh at 220/380 kV) the adder would be **about €50/MWh**, against **€55** today.
- **Confidence:** published and clear (levies); the tax rate for data centres and the concession fee at transmission level need checking.
- **Sources:** Stadtwerke Homburg, "Konzessionsabgaben und Umlagen 2026" (operator sheet, 31 Oct 2025), https://www.stadtwerke-homburg.de/fileadmin/dokumente/Netze/Stromnetz/Netzentgelte/2026/20251031_STROM_02_KA_und_Umlagen_2026_final.pdf; Vattenfall, "Steuern und Umlagen 2026" (supplier, 11 Mar 2026), https://www.vattenfall.de/geschaeftskunden/ves/magazin/energie/preisentwicklung-strom-und-gas-2026 (both accessed 7 Nov 2026).
