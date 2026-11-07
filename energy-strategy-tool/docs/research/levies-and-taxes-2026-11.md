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

## Netherlands (NL)

- **Energy tax (energiebelasting) on electricity 2026, € per kWh, per connection by yearly bracket:** 0–10,000 kWh **0.09161**; 10,001–50,000 **0.06671**; 50,001–10 million **0.03735**; above 10 million kWh **0.00310** for business use (0.00379 non-business). No separate renewable surcharge: the old ODE was folded into the energy tax from 2023.
- **Reductions:** the tax authority's page lists refunds only "in certain cases"; none for energy-intensive users was found.
- **Worked out for 745 GWh at one connection:** about €2.65 m a year, **€3.56/MWh** (the third bracket, up to 10 million kWh, makes most of it).
- **Adder:** network €16.5/MWh (Part A, 220/380 kV) + €3.6 = **about €20/MWh**, against **€45** today.
- **Confidence:** published and clear.
- **Source:** Belastingdienst, "Energiebelasting" (tax authority), https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/overige_belastingen/belastingen_op_milieugrondslag/energiebelasting (accessed 7 Nov 2026).

## Great Britain (GB)

- **Levies passed through by suppliers, 2026/27 (£/MWh):** Renewables Obligation **£32.73** (0.472 ROC per MWh × £69.34 buy-out price: DESNZ and Ofgem); Feed-in Tariff about £7–9; Contracts for Difference about £10 (interim rate, Q1 2026; may reach £20.67 by Q3 2027); Capacity Market about £10 (smeared); balancing (BSUoS) £13.74 (April–September 2026) and £12.49 (October 2026–March 2027); AAHEDC about £0.42; Sizewell C levy £3.49 (interim). Except the RO, these come from a secondary guide (updated July 2026); the bodies that set them (LCCC, NESO, the Capacity Market delivery body) were not read.
- **Climate Change Levy:** 0.801 p/kWh from April 2026 (£8.01/MWh; 0.827 p from April 2027). **Data centres hold a sector Climate Change Agreement for 2026–2030** (techUK, 16 October 2025), which cuts the levy on electricity by 92 % (rate from a secondary source): about £0.64/MWh for a participant.
- **Exemptions not available to data centres (taken as not eligible):** energy-intensive industries are exempt from the RO, FiT, CfD and Capacity Market charges, and from April 2026 can reclaim up to 90 % of network charges; the coming British Industrial Competitiveness Scheme (2027) extends exemptions to about 7,000 businesses, mainly manufacturing. Whether any data centre qualifies was not checked.
- **Worked out:** RO 32.73 + FiT 8 + CfD 10 + CM 10 + BSUoS 13.12 + AAHEDC 0.42 + Sizewell C 3.49 + CCL with CCA 0.64 = **about £78/MWh** (£86 without a CCA). With TNUoS from Part A (about £10.8/MWh for a 100 MW transmission-connected campus in London) the adder would be **about £89/MWh, roughly €106**, against **€55** today. The England 260 MW study used £66/MWh of non-commodity costs with long-run averages; today's figure is higher.
- **Confidence:** the RO is published and clear; the other levies are from a secondary guide and move quarterly; check against LCCC, NESO and the Capacity Market body before use.
- **Sources:** DESNZ, "Calculating the level of the Renewables Obligation for 2026 to 2027", https://www.gov.uk/government/publications/renewables-obligation-level-calculations-2026-to-2027/calculating-the-level-of-the-renewables-obligation-for-2026-to-2027 (government, 29 Sep 2025); Ofgem, "Renewables Obligation: buy-out price … 2026 to 2027", https://www.ofgem.gov.uk/data/renewables-obligation-buy-out-price-and-mutualisation-threshold-and-ceilings-2026-2027 (regulator, 31 Mar 2026); Energy Advice Hub, "A guide to non-commodity cost rises … 2026 and 2027", https://energyadvicehub.org/a-guide-to-non-commodity-cost-rises-on-your-electricity-bill-2026-and-2027/ (industry guide, updated July 2026); TotalEnergies, "Non-commodity charges 2026", https://business.totalenergies.uk/non-commodity-charges-2026 (supplier, 17 Feb 2026); techUK, "Data centres Climate Change Agreement target periods 7–9 announced", https://www.techuk.org/insights/news/data-centres-climate-change-agreement-target-periods-7-9-announced (industry body, 16 Oct 2025). All accessed 7 Nov 2026.

## France (FR)

- **Electricity excise (accise sur l'électricité), business rate 2026:** **€26.35/MWh from 1 August 2026** (Opéra Énergie, 1 October 2026); another adviser gives €26.58/MWh from 1 February 2026 (GAC, 12 February 2026). The two secondary sources disagree; the tax code was not read.
- **Reduced rate for data centres: €10/MWh** on consumption above the first GWh, for eligible "centres de stockage de données numériques", subject to cumulative conditions: an energy management system; a recognised good-practice programme; waste heat recovered in a heat network or an efficiency indicator met; a limit on cooling water; electro-intensity of at least 2.25 %; a dedicated, secured site. Claimed by attestation to the supplier.
- **Not researched:** the capacity mechanism cost (passed through by suppliers) and the network-linked contribution (CTA).
- **Worked out for 745 GWh:** with the data centre rate **about €10.0/MWh** (1 GWh at €26.35, the rest at €10); without it €26.35.
- **Adder:** network €4.1/MWh at 400 kV (Part A) + excise €10.0 = **about €14/MWh with the data centre rate** (€30.5 without), against **€40** today; capacity mechanism costs would add to this.
- **Confidence:** published, but from secondary sources that disagree slightly on the normal rate.
- **Sources:** Opéra Énergie, "Data centers : éligibilité au taux réduit d'accise sur l'électricité", https://opera-energie.com/media/data-centers-eligibilite-taux-reduit-accise-electricite/ (energy broker, 1 Oct 2026); GAC Group, "TICFE (excise duty on electricity): exemptions, reduced rates and audit in 2026", https://group-gac.com/en/ticfe-company-exemptions/ (consultancy, 12 Feb 2026). Both accessed 7 Nov 2026.

## Spain (ES)

- **Policy charges ("cargos") are already in Part A** (Orden TED/1524/2025): for 6.4TD €3,583/MW a year on power plus €0.228–2.848/MWh on energy by period.
- **Electricity tax (Impuesto Especial sobre la Electricidad):** **5.11269632 % of the electricity bill before VAT**, at least €0.5/MWh for professional use. Cut temporarily to 0.5 % from 22 March to 30 June 2026 (Royal Decree-law 7/2026); the tax agency's note does not state the rate after June, taken as the normal rate. An 85 % reduction exists for listed industrial processes, not for data centres (not checked).
- **Not researched:** capacity payments, the market and system operators' fees, and the energy efficiency fund contribution passed through by suppliers (each small, around €0.1–2/MWh).
- **Worked out:** at a bill of about €76/MWh before tax (wholesale €70 plus network and charges), the tax is **about €3.9/MWh**.
- **Adder:** network and charges from Part A (power part about €2.6/MWh with the charges; energy terms by period not averaged, a few €/MWh) + tax €3.9 = **probably €8–12/MWh**, against **€40** today. Too uncertain to propose a single figure until the period hours are averaged.
- **Confidence:** published and clear (tax rate); the total is a rough working.
- **Source:** Agencia Tributaria, "Medidas extraordinarias RDL 7/2026" (tax authority, March 2026), https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/II_especiales/electricidad/Medidas_extra_RDL_7_2026.pdf (accessed 7 Nov 2026).

## Portugal (PT)

- **Electricity consumption tax (IEC): €1.0/MWh** (€0.001/kWh, supplier glossary; the tax authority's 2026 circular read covers fuels only). Social-tariff customers are exempt.
- **Policy costs (CIEG)** are already inside the access tariff of Part A (ERSE's MAT average €11.6/MWh in 2026).
- **Adder:** network €10.5/MWh (Part A) + IEC €1.0 = **about €11.5/MWh**, against **€40** today.
- **Confidence:** published, from a supplier's glossary.
- **Source:** Goldenergy, "Imposto Especial sobre o Consumo de eletricidade (IEC)", https://goldenergy.pt/glossario/imposto-especial-sobre-consumo-eletricidade-iec/ (supplier, 2026, accessed 7 Nov 2026).

## Ireland (IE)

- **Electricity Tax: €1.00/MWh** for business use (since 1 January 2020; Revenue).
- **PSO levy:** €0.24 per kVA of MIC per month from 1 October 2026 (Part A): about €0.39/MWh for 100 MVA and 745 GWh.
- **Not researched:** capacity market costs, imperfections and market operator charges passed through by suppliers. Capacity costs in the Single Electricity Market can be significant; they should be checked before the adder is set.
- **Adder:** TUoS €34.2/MWh (Part A, including system services of about €27) + tax €1.0 + PSO €0.4 = **about €36/MWh before capacity and imperfections charges**, against **€50** today.
- **Confidence:** published and clear (tax and PSO).
- **Sources:** Revenue, "Energy excise duty rates" (tax authority, 15 Oct 2026), https://www.revenue.ie/en/tax-professionals/tdm/excise/excise-duty-rates/energy-excise-duty-rates-20261015030028.pdf; CRU, 29 Jul 2026 (see Part A). Both accessed 7 Nov 2026.
