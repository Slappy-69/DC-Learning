# Levies and taxes on grid electricity for a large campus, by country (research, November 2026)

Follow-on to the research run of 7 November 2026 (owner's choice, 7 November 2026: "1"). Part A gave the **network** charges by country; this note adds the **policy levies and taxes per MWh** (renewables and CHP support, public service obligations, capacity mechanism charges, electricity tax), so the per-MWh adder (`grid.priceAdder`, today €25–55/MWh, indicative) can be set as network + levies, each with its source. **Research and proposals only: nothing in `app/` or the defaults register changes.** VAT is left out: a business recovers it.

**Customer assumed:** a data centre campus of about 100 MW connected at transmission level, flat load, about 745 GWh a year. Where a reduction exists for large or energy-intensive users, it is recorded, with whether a data centre qualifies (often it does not: many reductions are for manufacturing only).

Confidence labels as in the other notes. The machine-readable list is `levies-and-taxes-2026-11.csv`.

## Summary

Twenty-three countries were researched (fourteen first, then nine more on the same day). Eight smaller markets gave no usable value; they are listed at the end.

Per MWh, for a 100 MW transmission-connected campus using about 745 GWh a year; network from Part A, levies and taxes from this note; VAT left out. "Proposed adder" = network + levies and taxes, worked out; today's adder is the tool's indicative default.

| Country | Network (Part A) | Levies and taxes | Proposed adder | Adder today | What is still missing |
|---|---|---|---|---|---|
| DE | €14.0 | €36.0 (tax €20.5, offshore €9.4, CHP €4.5, others €1.6) | **about €50** | €55 | Whether data centres get the 2026 tax cut (taken as no) |
| NL | €16.5 | €3.6 (energy tax) | **about €20** | €45 | — |
| GB | £10.8 | £78 (RO £32.7, BSUoS £13.1, CfD £10, CM £10, FiT £8, Sizewell C £3.5, CCL with CCA £0.6) | **about £89 (about €106)** | €55 | Most levies from a secondary guide; quarterly changes |
| FR | €4.1 (400 kV) | €10.0 with the data centre rate (€26.35 without) | **about €14** (€30.5 without the data centre rate) | €40 | Capacity mechanism cost; which normal rate is current |
| ES | Power part about €2.6; energy terms not averaged | about €3.9 (electricity tax) | **probably €8–12** | €40 | Period hours; capacity payments and small fees |
| PT | €10.5 | €1.0 (IEC) | **about €11.5** | €40 | — |
| IE | €34.2 (incl. system services about €27) | €1.4 (tax €1.0, PSO €0.4) | **about €36** | €50 | Capacity, imperfections and market operator charges |
| IT | €4.7 (transmission only) | Not readable | **not set** | €45 | General system charges (the largest item) and excise |
| FI | €4.8 | €23.25 (class I from 1 July 2026) | **about €28** | €30 | Data centre support scheme (autumn 2026) |
| SE | about €1–2 | €32.4 (SEK 360) | **about €34** | €30 | Network price list (Part A gap) |
| NO | NOK 9.1 plus losses | NOK 6.0 (reduced) or NOK 71.3 (standard) | **about €1.5 or €7.7** | €25 | Whether data centres get the reduced rate; regional grids |
| DK | DKK 23.8 plus losses | DKK 4 (net of refund) | **about €4.7** | €40 | Rate from 2028 |
| CH | CHF 19.7 | CHF 23.5 (grid surcharge) | **about CHF 43 (about €47)** | €50 | Municipal levies; surcharge refunds |
| AT | €6.0 | €8.3 | **about €14 plus the renewables contribution** | €45 | The renewables contribution percentage |
| BE | €8.3 | about €0.4–0.5 (Flemish or Walloon surcharge; Brussels €4.3) | **about €9** before the federal excise | €50 | Federal excise |
| PL | Not read (Part A gap) | PLN 59.5 (quality rate 33.2, capacity fee about 16.0 with the 0.17 factor, renewables and CHP 10.3) | **not set** | €40 | Network rates; excise |
| CZ | CZK 366 (2025, with system services) | CZK 28.3 (tax; renewables support paid by the state in 2026 and 2027) | **about CZK 394** (rough €16; exchange rate not sourced) | €45 | Market operator fee; 2026 network; support after 2027 |
| SK | €7.7–17.6 | €17.2 (system operation tariff €15.9, excise €1.3) | **about €25–35** | €40 | Nuclear fund payment; whether large users get a lower band |
| RO | RON 51.2 (extraction 36.45, system services 14.70; per MWh) | RON 90.6 (green certificates 73.0, CHP 13.6, excise 3.8, CfD 0.2) | **about RON 142** (rough €28; exchange rate not sourced) | €35 | Green certificate exemptions |
| HU | HUF 5,689 | HUF 398 tax + KÁT charge, about HUF 15,000 in press (to check) | **not set** | €40 | KÁT rate for large users; METÁR |
| GR | €7.1 (secondary) | Renewables levy about €1 at MV (unclear) | **not set** | €40 | High voltage levies; public service charge; excise |
| LU | €1.4 | Renewables mechanism paid by the state in 2026 (businesses not confirmed) | **not set** | €45 | Electricity tax; business treatment |
| EE | about €0.9 (capacity part only) | €3.73 balancing capacity fee | **not set** | €35 | Energy charges; renewables fee; excise |

**What it shows:**

- **Today's adders are badly off in both directions.** Far too high for the Netherlands, Portugal, Spain, Denmark, Norway, Austria, Belgium and France (with the data centre tax rate), and probably Czechia (renewables support now paid by the state); far too low for Great Britain (about €106 against €55); roughly right for Germany, Finland, Sweden and Switzerland.
- **Data centre tax treatment differs sharply and changes:** France gives data centres a reduced excise (€10/MWh, with conditions); Finland removed theirs on 1 July 2026; Sweden removed theirs in 2023; Great Britain's data centres get 92 % off the Climate Change Levy through their sector agreement; Norway's treatment was not confirmed; Germany's 2026 tax cut is for manufacturing.
- **These should be flags in the tool,** not only numbers: a reduced rate with conditions (France) or a rate under change (Finland) is exactly what an engineer needs to see on the option.

**Proposal (for the owner to approve, source by source):** set the adder by country to "network + levies and taxes" where both are published and clear (DE, NL, PT, FI, SE, DK, CH, IE with its caveat), keep the indicative values elsewhere until the gaps are filled, and add a flag where a data centre tax rule applies (FR, FI, GB, NO). If the per-MW grid charge tick (OPEN-QUESTIONS 160–165) is used, its part must come out of the adder at the same time.

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

## Italy (IT)

- **General system charges (oneri generali: ASOS for renewables support, ARIM for other costs):** **No published value found in readable form.** ARERA's page confirms the values in force from 1 October 2026 (ASOS as from 1 July 2026, ARIM as from 1 January 2026; decision 343/2026/R/com), but the rate tables (A and B) are in annexes that could not be read. A 2026 decree ("DL Bollette") cut ASOS for non-energy-intensive users at high and very high voltage; energy-intensive classes pay little or no ASOS (data centres are not normally in the energy-intensive classes; not checked).
- **Electricity excise (accisa):** not read in this pass.
- **For the tool:** Italy's adder cannot be set yet; the general system charges are known to be the largest non-commodity item on Italian bills.
- **Sources:** ARERA, "Oneri generali di sistema e ulteriori componenti", https://www.arera.it/area-operatori/prezzi-e-tariffe/oneri-generali-di-sistema-e-ulteriori-componenti; ARERA, technical report to decision 98/2026/R/com, https://www.arera.it/fileadmin/allegati/docs/26/98-2026-R-com_Relazione_tecnica.pdf (regulator, both accessed 7 Nov 2026).

## Finland (FI)

- **Electricity tax 2026 (including the strategic stockpile fee):** class I **2.325 c/kWh (€23.25/MWh)**; class II 0.135 c/kWh (€1.35/MWh) for industry, mining and agriculture.
- **Data centres moved from class II to class I on 1 July 2026** (Parliament's Finance Committee recommended the bill unchanged, report VaVM 28/2025 vp, signed 5 December 2025). No exception for waste heat in the bill; the government planned a time-limited support scheme for data centres from autumn 2026 (not checked).
- **Adder:** network €4.8/MWh (Part A) + tax €23.25 = **about €28/MWh**, against **€30** today (before any data centre support).
- **Confidence:** published and clear.
- **Sources:** Vero (tax administration), "Tax rates on electricity and certain fuels", https://vero.fi/en/businesses-and-corporations/taxes-and-charges/excise-taxation/sahkovero/Tax-rates-on-electricity-and-certain-fuels/; Eduskunta, Finance Committee report VaVM 28/2025 vp, https://www2.eduskunta.fi/pdf/VaVM+28/2025+vp?lang=fi (parliament). Both accessed 7 Nov 2026.

## Sweden (SE)

- **Energy tax on electricity 2026: 36.0 öre/kWh (SEK 360/MWh)** (43.9 in 2025). **Data centres lost their reduced rate on 1 July 2023** (Skatteverket) and pay the general rate. Manufacturing can deduct tax on process electricity; a 9.6 öre relief in northern municipalities covers services but not industry (whether it covers a data centre was not checked).
- **Adder:** network about €1–2/MWh (Part A; not read in full) + tax SEK 360 (about €32.4) = **about €34/MWh**, against **€30** today.
- **Confidence:** published and clear.
- **Sources:** Skatteverket, "Skatt på el", https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/energiskatter/skattpael; Skatteverket, "Slopad skattenedsättning för datorhallar" (16 Dec 2022) (tax authority; both accessed 7 Nov 2026).

## Norway (NO)

- **Electricity tax 2026: standard 7.13 øre/kWh (NOK 71.3/MWh); reduced 0.60 øre/kWh** for industry and mining (industry codes 05–33) and some other categories.
- **Data centres:** a tax authority interpretation statement on data centres with actual withdrawal above 0.5 MW exists (its title was seen; it could not be read), which suggests large data centres can use the reduced rate; the English guidance page does not mention them. Unclear: to check.
- **Adder:** network NOK 9.1/MWh plus losses (Part A, large-consumer rate) + tax NOK 6.0 (reduced) or NOK 71.3 (standard) = **about €1.5/MWh or €7.7/MWh**, against **€25** today. Regional grid tariffs, where a campus connects below Statnett, would add to this.
- **Confidence:** published (rates); data centre eligibility unclear.
- **Sources:** Skatteetaten, "Electrical power tax", https://www.skatteetaten.no/en/business-and-organisation/vat-and-duties/excise-duties/about-the-excise-duties/electrical-power-tax (tax authority, accessed 7 Nov 2026). Not reachable: the 2026 circular PDF (the site does not allow automated reading).

## Denmark (DK)

- **Electricity tax (elafgift): 0.8 øre/kWh in 2026 and 2027** (temporary cut); VAT-registered businesses reclaim down to the EU minimum of 0.4 øre/kWh, so **DKK 4/MWh net**. The rate from 2028 was not stated.
- **Adder:** network DKK 23.8/MWh plus losses (Part A) + tax DKK 4 = **about €3.7/MWh plus losses (about €1)**, against **€40** today.
- **Confidence:** published and clear.
- **Source:** Skattestyrelsen, "Midlertidig nedsættelse af elafgiften i 2026 og 2027", https://skat.dk/erhverv/afgifter-paa-varer-og-ydelser-punktafgifter/nyhedsbrev-afgifter/midlertidig-nedsaettelse-af-elafgiften-i-2026-og-2027 (tax authority, 1 Jan 2026, accessed 7 Nov 2026).

## Switzerland (CH)

- **Federal grid surcharge (Netzzuschlag) 2026: 2.30 Rp/kWh (CHF 23/MWh)**; "solidarised costs" 0.05 Rp/kWh. (The power reserve 0.41 and Swissgrid's ancillary services 0.27 Rp/kWh are already in Part A's Swissgrid figure.) Read from a municipal utility's 2026 tariff sheet.
- **Refunds:** electricity-intensive companies can have the grid surcharge refunded under a target agreement; conditions and data centre eligibility were not checked.
- **Municipal levies** vary by municipality (3.40 Rp/kWh in Nidau) and are not included.
- **Adder:** Swissgrid CHF 19.7/MWh (Part A) + CHF 23.5 = **about CHF 43/MWh (about €47)**, against **€50** today, before municipal levies.
- **Confidence:** published (from a local utility's sheet).
- **Source:** Stadt Nidau, "Elektrizitäts- und Netznutzungstarife 2026", https://www.nidau.ch/verwaltung/abteilungen/infrastruktur/tiefbau-und-umwelt/elektrizitaetsversorgung/stromtarife/elektrizitaets-und-netznutzungstarife-nidau-2026.pdf/download (municipal utility, accessed 7 Nov 2026).

## Austria (AT)

- **Electricity tax (Elektrizitätsabgabe) 2026: 0.82 ct/kWh (€8.2/MWh)** for all supplies except qualifying households.
- **Renewables flat fee (Erneuerbaren-Förderpauschale):** €60,524 a year per metering point at network levels 3–4 (about €0.08/MWh at 745 GWh); levels 1–2 are not on the sheet read.
- **Renewables contribution (Erneuerbaren-Förderbeitrag):** a percentage of network usage and loss charges set by ministerial regulation; **the percentage was not read**. Some provinces add a municipal use levy (Salzburg: 0.0562 ct/kWh at level 3).
- **Adder:** network €6.0/MWh (Part A, level 1) + tax €8.2 + flat fee €0.1 = **about €14/MWh plus the renewables contribution**, against **€45** today.
- **Confidence:** published and clear (tax and flat fee).
- **Source:** Salzburg Netz, "Zuschläge zum Systemnutzungsentgelt Strom, 01/2026", https://www.salzburgnetz.at/content/dam/salzburgnetz/dokumente/stromnetz/Strom-Zuschlaege-Systemnnutzung.pdf (network operator, accessed 7 Nov 2026).

## Belgium (BE)

- **Since 1 January 2022 the federal contribution, offshore green certificates, the strategic reserve and the capacity mechanism are paid from the federal budget**, not by surcharges on Elia's tariffs (Elia's 2025 sheet).
- **Regional surcharges at 380–110 kV (2025, € per MWh):** Flemish levy on pylons and cables **0.4669**; Walloon public domain use **0.3414**; Brussels road levy **4.2636** (Brussels only). Regional renewables support is charged at 70/36/30 kV and below (Flanders 0.3452, cut by 98 % above 250 GWh a year; Wallonia 3.4476), not listed at 380–110 kV.
- **Not read:** the 2026 values, and the federal excise on electricity for business customers (cut for large users after the 2022 reform; rate not found in this pass).
- **Adder:** network €8.3/MWh (Part A) + surcharges €0.3–0.5 (Flanders or Wallonia) = **about €9/MWh before the federal excise**, against **€50** today.
- **Confidence:** published and clear (surcharges, 2025).
- **Source:** Elia, "Tarieven openbaredienstverplichtingen en toeslagen 2025", https://elia.be/-/media/project/elia/elia-site/customers/tarrifs-and-invoicing/20241202_tarieven-odv_toeslag_2025-vdef.pdf (operator, 2 Dec 2024, accessed 7 Nov 2026).

## Poland (PL)

- **Levies 2026 (PLN per MWh):** renewables (OZE) fee **7.30**; cogeneration fee **3.00**; **capacity fee 219.40 on energy drawn on working days 07:00–21:59**, multiplied by 0.17 for a flat load (PSE tariff, Part A), which is **about 16.0 on all energy** (worked out: those hours are about 43 % of the year); quality rate **33.16** at medium and high voltage (from PSE's tariff). The transitional fee ends in 2026. Read from a supplier's notice of 2 February 2026, citing URE and the Minister's regulation.
- **Reductions:** industrial customers with declarations can pay 15 % or 25 % of the renewables and cogeneration fees; data centres taken as not eligible.
- **Not read:** the electricity excise; PSE's fixed network rate (Part A gap).
- **Worked out:** about **PLN 59.5/MWh** in levies and the quality rate, before excise and network charges.
- **Confidence:** published (secondary notice citing the official decisions).
- **Source:** RCEkoenergia (Unimot), "Stawki opłat na 2026", https://rcekoenergia.unimot.pl/media/6209/download/RCE-stawki%20op%C5%82at%20na%202026.pdf (supplier, 2 Feb 2026, accessed 7 Nov 2026).

## Czechia (CZ)

- **Renewables support (POZE): zero for 2026**, because the state budget pays it all from 1 January 2026; the government decided on 21 September 2026 to do the same for 2027. In 2025 it was about CZK 495/MWh (Part A note). Whether it returns after 2027 is a political decision: a flag, not a value.
- **Electricity tax:** **CZK 28.30/MWh** (Act No. 261/2007 Coll.); exemptions are by use (electrolysis, metallurgy, rail and others), not for data centres.
- **Not read:** the market operator (OTE) fee; ERÚ's price decision itself (a Word file the reader could not open; the shell is refused).
- **Worked out:** about **CZK 28/MWh** (about €1.1) in levies and taxes for 2026–27, on top of Part A's network and system services (CZK 366/MWh in 2025).
- **Confidence:** published (press and a trade guide; ERÚ's text not read).
- **Sources:** oEnergetice, "Government approves shift of all supported-energy payments to the state" (16 Dec 2025) https://oenergetice.cz/en/czech-energy-sector/government-approves-shift-of-all-supported-energy-payments-to-the-state-electricity-to-become-cheaper-in-czechia; oEnergetice, "Czech state again to cover all renewable support charges" (21 Sep 2026) https://oenergetice.cz/en/czech-energy-sector/electricity-prices-expected-to-keep-falling-czech-state-again-to-cover-all-renewable-support-charges; Pohoda portal, "Daň z elektřiny" https://portal.pohoda.cz/dane-ucetnictvi-mzdy/ostatni-dane/ekologicke-dane/dan-z-elektriny (all accessed 7 Nov 2026).

## Slovakia (SK)

- **Tariff for system operation (TPS):** **€15.90/MWh**, flat, in a supplier's 2026 price list citing ÚRSO's decision 0099/2025/E (2025–2027). It pays for renewables and CHP support and other items. A banded TPS with big discounts for large users was proposed in 2021; whether a data centre gets a lower band in 2026 was **not confirmed**.
- **Electricity excise:** **€1.32/MWh** (Act 609/2007 § 6); the exemptions are for electricity-intensive manufacturing.
- **Nuclear fund payment:** listed, amount not found.
- **Worked out:** about **€17.2/MWh** in levies and tax, before the nuclear fund payment; Part A's network and system services (€7.7–17.6) come on top.
- **Confidence:** the excise is published and clear (the law); the TPS is from a supplier's list, not ÚRSO.
- **Sources:** BTS price list from 1 Jan 2026 https://www.bts.aero/content/00/cennik-dodavatela-elektriny-pre-dodavku-elektriny-nepodliehajucu-cenovej-regulacii-platny-od-1-1-2026.pdf; Act 609/2007 (version from 1 Jan 2026) https://static.slov-lex.sk/static/SK/ZZ/2007/609/20260101.html; SITA, 26 Oct 2021 https://sita.sk/venergetike/podnikatelia-by-mohli-dalsi-rok-usetrit-na-tarife-za-prevadzkovanie-systemu-regulacny-urad-pripravil-tri-alternativy/ (all accessed 7 Nov 2026).

## Romania (RO)

- **Levies 2026 (RON per MWh):** green certificates **73.03** (worked out: quota 0.499387 certificates/MWh × RON 146.2532 each); cogeneration contribution **13.60** (from 1 Nov 2025); CfD contribution **0.166**; business-use excise **3.84**.
- **Worked out:** about **RON 90.6/MWh** in levies and tax. Network charges for a transmission user (Part A: no capacity charge) are per MWh: extraction TL 36.45 and system services 14.70 (same notice).
- **Not checked:** the green certificate exemption for energy-intensive industry (data centres taken as not eligible).
- **Confidence:** published (supplier notices citing ANRE orders).
- **Sources:** Axpo Romania, regulated tariffs from 1 Jan 2026 https://www.axpo.com/content/dam/axpo19/countries/romania/26012025_Tar%20regl%20EE_01.01.2026.pdf; Egger, 2026 invoice guide https://downloads.egger.com/static/east/2026_Ghid_explicativ_privind_elementele_din_factura.pdf; Capital.ro, 30 Oct 2025 https://www.capital.ro/facturile-la-energie-electrica-cresc-din-nou-de-la-1-noiembrie-anre-a-aprobat-majorarea-contributiei-pentru-cogenerare.html (all accessed 7 Nov 2026).

## Hungary (HU)

- **Energy tax:** **HUF 398/MWh** (an adviser's page dated 5 Aug 2026; the year of the rate is not stated).
- **KÁT renewables charge:** not a regulated published rate; suppliers pass it on. A business paper (24 May 2026) says it **rose from HUF 2–4 to nearly HUF 15 per kWh** (about HUF 15,000/MWh). If that holds for large users it is the largest item in the bill. **Needs checking** before use.
- **Not found:** METÁR; any other levies (MAVIR's network charge with its 100 % discount is in Part A).
- **Confidence:** published, but unclear which tariff applies.
- **Sources:** RSM Hungary, "Energy tax" https://www.rsm.hu/tax-to-know/energy-tax (5 Aug 2026); Economx, 24 May 2026 https://www.economx.hu/magyar-gazdasag/2026/05/24/aram-koltseg-dragulas-napelem/; E.ON system-use charges 2026 https://www.eon.hu/content/dam/eon/eon-hungary/documents/hatarozatok-szabalyzatok-aram/arak-tarifak/Aram_RHD_EON_20260101.pdf (all accessed 7 Nov 2026).

## Greece (GR)

- **Renewables levy (ETMEAR):** about **€1/MWh** for industrial customers at medium voltage, read from a supplier's list valid until July 2026; the table did not extract cleanly, so this is **unclear**. The public service charge (YKO) could not be read reliably and is not used. **No high voltage figures** found; excise not read.
- **Adder:** not set.
- **Source:** Protergia, regulated charges for business customers (2026) https://www.protergia.gr/media/41bpemxv/protergia-regulated-charges_business_2026-09.pdf (supplier, accessed 7 Nov 2026).

## Luxembourg (LU)

- **Compensation mechanism (renewables):** from 2026 **paid from the state budget**, as are network charges for households (Chronicle.lu, 2 Dec 2025). The article gives household figures only; whether large business users also pay nothing was **not confirmed**. The regulator's letter of 5 Feb 2026 speaks of future rate cuts for categories A and B only.
- **Electricity tax for large users:** not found.
- **Adder:** network €1.4/MWh (Part A) plus the electricity tax: **not set**.
- **Sources:** Chronicle.lu, "Electricity bills to fall as government funds network charges" (2 Dec 2025) https://chronicle.lu/category/energy/58271-electricity-bills-to-fall-as-government-funds-network-charges; ILR, letter of 5 Feb 2026 https://www.ilr.lu/wp-content/uploads/ilr-elc-pub-2026-02-05-FournElec-val-MdC-2025.pdf (both accessed 7 Nov 2026).

## Estonia (EE)

- **Balancing capacity fee:** **€3.73/MWh** from January 2026, paid by consumers and producers alike (ERR, 31 Oct 2025). A separate security of supply fee also started in January 2026; no per-MWh figure was read.
- **Not found:** the renewables fee for 2026, the electricity excise.
- **Adder:** Part A's capacity charge is about €0.9/MWh (package I, 330 kV, worked out); energy charges and the other levies are missing: **not set**.
- **Source:** ERR, "Uus tasu elektriarvel saab olema 3,73 eurot megavatt-tunni kohta" (31 Oct 2025) https://www.err.ee/1609844289/uus-tasu-elektriarvel-saab-olema-3-73-eurot-megavatt-tunni-kohta (public broadcaster, accessed 7 Nov 2026).

## Not researched in this pass (next)

**No usable value found in this pass:** Bulgaria, Croatia, Cyprus, Iceland, Latvia, Lithuania, Malta and Slovenia (searches found only network tariffs, household articles or out-of-date figures). Next, the gaps named in the table, above all Hungary's KÁT charge for large users, Poland's network rates and excise, Greece's high voltage levies, Luxembourg's electricity tax and Estonia's renewables fee; and the earlier gaps (Italy's general system charges, Ireland's capacity charges, France's capacity mechanism, Austria's renewables contribution, Norway's data centre rate). Eurostat's breakdown of taxes and levies for the largest industrial band would be a quick cross-check for the EU countries, but its data service could not be reached from this session.

## Questions for the owner (copied to the progress file)

1. Set the adder to "network + levies and taxes" for the eight countries where both are clear (DE, NL, PT, FI, SE, DK, CH, IE), now or after the rest are researched?
2. Should data centre tax rules (France's reduced rate, Finland's change, Great Britain's CCA discount, Norway's unclear rate) appear as flags on the options?
3. Great Britain: use the levies from the secondary guide (about £78/MWh), or wait until each is read from its issuing body?
