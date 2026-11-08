# Data centre tax rules, with the local website that states each one (research, 7 November 2026)

Follows the owner's decision of 2026-11-07 (OPEN-QUESTIONS 204): data centre tax rules are **shown as flags** on the options, each saying which rate the tool used and why. The owner then asked that the notes name **the local (national) website that mentions the tax**. This note does that for the five countries with a special rule. The values themselves are in `levies-and-taxes-2026-11.md` and `.csv`. The machine-readable list is `data-centre-tax-rules-2026-11.csv`.

**Research and proposals only.** Nothing in `app/` or the defaults register changes (OPEN-QUESTIONS 201: wait until all the research is done).

"Local website" means the page of the country's own tax authority, parliament or government that states the rule. Where only a trade or press page was found for part of a rule, that is said. Pages were read on 7 November 2026 unless a line says otherwise.

## Summary

| Country | Rule for data centres | Local website that states it | What the page confirms | What it does not give |
|---|---|---|---|---|
| FR | Reduced excise on electricity above the first 1 GWh a year (€10/MWh, with conditions) | Impots.gouv.fr (tax administration): attestation form 2040-TIC-ATT-E-SD, and BOFiP ruling BOI-RES-EAT-000191 | Data storage centres are a reduced-rate use (code E16; Code des impositions sur les biens et services, art. L. 312-64 and L. 312-70) | The €10 rate and the six conditions: these come from an energy broker's page only |
| FI | Class II tax (€1.35/MWh) until 30 Jun 2026; class I (€23.25/MWh) from 1 Jul 2026 | Vero.fi (Tax Administration), "Sähkövero", last updated 23 Apr 2026 | The date of the move and the old 0.5 MW test | — (rates are on the English rates page of the same site) |
| SE | Reduced rate removed on 1 Jul 2023; general rate 36.0 öre/kWh | Skatteverket (Tax Agency), news of 16 Dec 2022 and "Skatt på el" | The removal and the 2026 general rate | Read in the first pass; not re-read in this one |
| NO | Reduced rate for data centres above 0.5 MW existed (2018 statement); now ended | Skatteetaten (Tax Administration) statement of 2018; Stortinget (Parliament) proposal of 3 Feb 2026 | The old rule (Skatteetaten); that it has ended (Stortinget) | The date it ended; Skatteetaten's 2026 page does not list data centres |
| GB | 92 % off the Climate Change Levy on electricity for holders of a Climate Change Agreement | GOV.UK, "Climate Change Levy rates" | The 2026–27 and 2027–28 rates and the 92 % discount for agreement holders | That data centres hold a sector agreement: GOV.UK does not say; the sector body (techUK) does |

Other countries: no special data centre tax rule was found in this research. Germany's 2026 electricity tax cut is for manufacturing, agriculture and forestry; a data centre is taken as paying the standard rate (not checked against the law).

## France (FR)

- **Rule:** electricity excise (accise sur l'électricité) is reduced for "centres de stockage de données numériques" on the part of consumption **above 1 GWh in a calendar year**. The business rate is €26.35/MWh from 1 August 2026; the data centre rate is **€10/MWh**. Both are in `levies-and-taxes-2026-11.md`.
- **Local website 1, tax administration form:** *Attestation* form **2040-TIC-ATT-E-SD, no. 16196\*04** (2026 file), impots.gouv.fr. It lists "Centres de stockage de données numériques (fraction qui excède 1 GWh sur une année civile) (E16)" among the uses taxed "à un tarif réduit". It states no rate and shows no issue date. The customer signs it and gives it to the supplier.
  https://www.impots.gouv.fr/sites/default/files/formulaires/2040-tic-att-e/2026/2040-tic-att-e_5293.pdf
- **Local website 2, tax doctrine:** BOFiP-Impôts, ruling **BOI-RES-EAT-000191**, effective 8 January 2025, period 1 February to 31 December 2025. It lists "Centres de stockage de données" under code E16, with the Code des impositions sur les biens et services, **art. L. 312-64 and L. 312-70**. It says reduced rates run from €0.5 to €12/MWh and does not give the rate for E16.
  https://bofip.impots.gouv.fr/node/361266
- **Not from a local website:** the €10/MWh rate and the six cumulative conditions (energy management system; recognised good-practice programme; waste heat in a heat network or an efficiency indicator met; water-use limit; electro-intensity of at least 2.25 %; dedicated, secured site) come from Opéra Énergie (energy broker, 1 October 2026). The text of art. L. 312-64 and L. 312-70 on Légifrance was **not found** by search and not read. A 2026 form 2040-TIC-ERA-E-SD (impots.gouv.fr) was also surfaced and not read.
  https://opera-energie.com/media/data-centers-eligibilite-taux-reduit-accise-electricite/
- **Confidence:** the rule exists: published and clear (local website). The rate and conditions: published, but from a secondary source.
- **To read next:** the code articles on Légifrance, to confirm €10 and the conditions at the source.

## Finland (FI)

- **Rule:** data centres paid the low class II electricity tax; **from 1 July 2026 they pay class I.**
- **Local website, tax administration:** Vero.fi, "Sähkövero" (Finnish page, **last updated 23 April 2026**). It lists "datakeskukset (30.6.2026 asti; siirtyvät I-veroluokkaan 1.7.2026)" among the class II uses, and repeats: "Datakeskuksissa käytetty sähkö siirretään I-veroluokkaan 1.7.2026." It also says that since the start of 2022 data centres with server capacity of at least **0.5 MW** that met energy-use or efficiency criteria could qualify for class II (data centres already receiving the reduction on 31 December 2021 were exempt from those criteria).
  https://vero.fi/yritykset-ja-yhteisot/verot-ja-maksut/valmisteverotus/sahkovero/
- **Rates (same site, English):** class I 2.325 c/kWh including the stockpile fee; class II 0.135 c/kWh.
  https://vero.fi/en/businesses-and-corporations/taxes-and-charges/excise-taxation/sahkovero/Tax-rates-on-electricity-and-certain-fuels/
- **Parliament:** Finance Committee report VaVM 28/2025 vp (5 December 2025), https://www2.eduskunta.fi/pdf/VaVM+28/2025+vp?lang=fi . A time-limited support scheme for data centres was planned for autumn 2026: **not checked**.
- **Confidence:** published and clear.

## Sweden (SE)

- **Rule:** data centres lost the reduced energy tax on electricity on **1 July 2023** and pay the general rate, **36.0 öre/kWh in 2026** (SEK 360/MWh).
- **Local website, tax agency:** Skatteverket, "Slopad skattenedsättning för datorhallar" (news, 16 December 2022), and "Skatt på el" (2026 rates). Read in the first pass of 7 November 2026; **not re-read in this pass**.
  https://skatteverket.se/foretag/skatterochavdrag/punktskatter/nyheterinompunktskatter/2022/nyheterinompunktskatter/slopadskattenedsattningfordatorhallar.5.1997e70d1848dabbac93896.html
  https://www.skatteverket.se/foretag/skatterochavdrag/punktskatter/energiskatter/skattpael
- **Open detail:** whether the 9.6 öre relief in northern municipalities applies to a data centre was not checked.
- **Confidence:** published and clear.

## Norway (NO)

- **Rule today:** the reduced rate for data centres has **ended**, so the standard rate applies: **7.13 øre/kWh in 2026** (NOK 71.3/MWh). The date it ended was **not found**.
- **Local website 1, tax administration (the old rule):** Skatteetaten, interpretation statement "Avgift på elektrisk kraft – datasentre og utvinning av kryptovaluta", issued 27 June 2018, published 9 August 2018. At that time data centres with **actual draw above 0.5 MW** paid a reduced rate of **0.48 øre/kWh** (standard 16.58 øre/kWh in the statement), under the excise regulation § 3-12-6. Conditions: storing and processing data is the company's main business; the rate covers servers, cooling, pumps, lighting, security, generators and directly supporting equipment; the network company applies it on a self-declaration and an electrician's confirmation of capacity. **This is the historical rule, not the current one.**
  https://www.skatteetaten.no/nn/rettskjelder/type/uttalelser/prinsipputtalelser/tolkningsuttalelse-elektrisk-kraft-datasentre-kryptovaluta/
- **Local website 2, tax administration (2026 rates):** Skatteetaten, "Avgift på elektrisk kraft", table "Sats for 2026": standard **7.13**, reduced **0.60** øre/kWh. The reduced rate is listed for industry and mining, district heating, ships in service, processing of energy products and Finnmark/Troms. **Data centres are not mentioned.** No "last updated" date on the page.
  https://www.skatteetaten.no/bedrift-og-organisasjon/avgifter/saravgifter/om/elektrisk-kraft/
- **Local website 3, parliament:** Stortinget, proposal Dok 8:105 S (3 February 2026): the data centre scheme "er avviklet"; it asks for a study of a higher rate.
  https://stortinget.no/no/Saker-og-publikasjoner/Publikasjoner/Representantforslag/2025-2026/dok8-202526-105s/
- **Surfaced, not read:** a second Skatteetaten statement on the 0.5 MW test and which period to use ("Avgift på elektrisk kraft levert til datasentre – forståelsen av kravet om faktisk uttak over 0,5 MW i særavgiftsforskriften § 3-12-6 …"). The reader refused the address (too long). It would date the rule better; it is not needed for 2026.
  https://www.skatteetaten.no/nn/rettskjelder/type/uttalelser/prinsipputtalelser/avgift-pa-elektrisk-kraft-levert-til-datasentre--forstaelsen-av-kravet-om-faktisk-uttak-over-05-mw-i-saravgiftsforskriften--3-12-6-og-hvilken-periode-som-skal-benyttes-ved-vurderingen/
- **Confidence:** the old rule: published and clear. That it has ended: published (parliament), but the end date and the tax authority's own confirmation were not found. Treat as **published, but unclear which tariff applies** until Skatteetaten's 2026 circular is read (the site refused automated reading in the first pass).

## Great Britain (GB)

- **Rule:** electricity is charged the Climate Change Levy (CCL). Holders of a **Climate Change Agreement (CCA)** get a **92 %** discount on the electricity levy.
- **Local website, government:** GOV.UK, "Climate Change Levy rates". Main rate for electricity: **£0.00801/kWh from 1 April 2026** (£8.01/MWh) and £0.00827/kWh from 1 April 2027. Table "Percentage discount for holders of a climate change agreement": **electricity 92 %** in both years. With the discount: about **£0.64/MWh** (worked out: 8.01 × 0.08).
  https://www.gov.uk/guidance/climate-change-levy-rates
  Policy paper for the April 2026 changes (surfaced, not read): https://www.gov.uk/government/publications/climate-change-levy-rates-from-1-april-2026
- **Data centres hold a sector agreement:** the sector body, techUK, reports a Climate Change Agreement for data centres for 2026–2030 (article of 16 October 2025: "Data centres Climate Change Agreement target periods 7–9 announced"). **GOV.UK's CCA guidance page does not mention data centres** and is out of date (visible date 2 March 2022; says the scheme runs to 31 March 2025), so a government page confirming the data centre sector agreement was **not found**.
  https://www.techuk.org/insights/news/data-centres-climate-change-agreement-target-periods-7-9-announced
  Also surfaced, not read: https://www.techuk.org/resource/climate-change-agreements-cca-for-data-centres.html ; https://www.gov.uk/government/publications/climate-change-agreements-scheme-the-carbon-emissions-factor-for-gas/climate-change-agreements-scheme-extension-to-new-sectors-and-processes-and-other-amendments
- **What the flag must say:** the 92 % applies only to a site that is a participant in the data centre sector agreement and meets its targets; without it the rate is £8.01/MWh (about £7.4/MWh more).
- **Confidence:** the levy rates and the 92 % discount: published and clear (GOV.UK). That a given campus qualifies: not known; depends on the participant.

## Draft flag wording (for the owner to approve; built only when the owner asks)

Each flag says which rate the tool used, why, and links the local website.

- **FR:** "Electricity excise: [reduced data centre rate, €10/MWh above the first 1 GWh a year, used / normal rate €26.35/MWh used]. The reduced rate needs six conditions and an attestation to the supplier. Source: impots.gouv.fr (form 2040-TIC-ATT-E-SD, code E16); rate from Opéra Énergie."
- **FI:** "Electricity tax: class I (€23.25/MWh) used. Data centres paid class II (€1.35/MWh) until 30 June 2026. Source: vero.fi, 'Sähkövero', updated 23 April 2026."
- **SE:** "Energy tax: general rate SEK 360/MWh used. Data centres lost the reduced rate on 1 July 2023. Source: Skatteverket."
- **NO:** "Electricity tax: standard rate 7.13 øre/kWh used. A reduced rate for data centres above 0.5 MW existed (Skatteetaten, 2018) and has ended (Stortinget, 3 February 2026); end date not found."
- **GB:** "Climate Change Levy: [92 % discount used (needs a Climate Change Agreement through the data centre sector) / full rate used]. Source: GOV.UK, 'Climate Change Levy rates'; sector agreement from techUK."

## Left for the owner

- **H2b (new, to ask later):** for France and Great Britain the rate depends on conditions the engineer must meet. Which rate should the tool use by default: the reduced rate (a note says the conditions are assumed met) or the normal rate until the engineer ticks that they are met? Claude's recommendation when asked: normal rate by default, reduced rate on a tick, because the tool must not present a conditional saving as certain.
- Sweden's and Norway's rules need no choice: one rate applies and the flag only explains it.
