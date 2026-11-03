# Taking over a closing plant's grid connection: what the rules say (research, 2 November 2026)

The owner chose this research on 2 November 2026 (item 15 of Claude's list). The tool's choice C21 (work package 19) lets a campus take over a closing gas plant's grid connection 12 months after the plant stops, at about €30k per MW, flagged as an assumed right. This note checks that assumption against published rules. It is a screening of public sources (government notices, the regulators' press releases and law-firm notes), not legal advice.

## In short

- **No source found lets a demand user take over a closing plant's connection as of right.** Where the rule is written down (Spain, Portugal), the capacity a closing plant frees goes back to the state or the network operator. It is re-awarded by tender, for new renewable generation and storage, not for demand.
- **In Great Britain and Ireland a data centre needs its own demand connection.** It goes through the new readiness rules (GB) or the large energy user policy (Ireland). Nothing in the sources found moves an old connection agreement to a new user.
- **What a former plant site does offer is the physical node:** a substation, lines and land zoned for industry. That can shorten the works and is why data centres are being planned on such sites (Didcot A in England, RWE's "energised land", former nuclear sites in Germany). The sources do not say that the old connection right transfers.

## By country

| Country | What happens to a closing plant's connection | Source |
|---|---|---|
| Spain | The access capacity a closing thermal or nuclear plant frees at a "just transition node" is awarded by tender to new renewable generation (and storage), on social and environmental criteria. Distribution connections at the node were held back until the tender was resolved. Example: on 26 December 2024 MITECO opened tenders for 836 MW at Narcea (354 MW), La Pereda (74 MW) and Meirama (408 MW). | CNMC, 14 February 2022; MITECO, 26 December 2024 |
| Portugal | When Pego's coal plant closed (its contract ended 30 November 2021), the government tendered its injection point on the public grid. The tender was limited to renewable production (electricity, renewable gases, synthetic fuels; storage valued), with regional criteria. Endesa won it in 2022. | Portuguese Government, September 2021; Jornal de Negócios |
| Great Britain | Transmission connections (above 132 kV in England and Wales) move from "first come" to "first ready and needed". Demand projects meet the strategic test automatically; readiness needs secured land or planning. In 2026 Ofgem proposed a Data Centre Commitment Fee of £237,000 to £712,500 per MW (returned on energisation) and progress milestones for connections of 40 MW or more. The sources say nothing on transferring a closing plant's capacity to a data centre. | Gowling WLG 2025 and 26 August 2026 |
| Ireland | CRU decision of 12 December 2025: data centres of 10 MVA or more must provide dispatchable on-site or nearby generation or storage matching 100 % of their maximum import capacity (de-rated) and take part in the market. They cannot reach full import until it is running. At least 80 % of annual demand must be matched with new renewable generation in Ireland. Nothing on reusing old connections; repowering decommissioned plant can count towards the renewables. | DLA Piper, 7 January 2026 |
| Germany | Utilities offer former and existing plant sites to data centres. RWE: "pre-developed, grid-connected sites", "3 GW grid capacity applied or secured". Nvidia and PreussenElektra are to assess former nuclear sites (2026). The sources do not say whether the old connection stays available to a new user. | RWE "Energised land"; WinBuzzer, 27 October 2026 |
| UK example | RWE sold the Didcot A site, demolished between 2014 and 2020, to a hyperscaler (planning in the name of Amazon Data Services) for a data centre. The article does not say whether the old connection is reused. | DatacenterDynamics |

## What it means for the tool (for the owner to decide)

1. **The takeover flag can say more by country.** In Spain and Portugal the freed capacity is tendered for renewables and storage, so a data centre takeover looks unavailable. In Great Britain and Ireland the campus needs its own demand connection under the new rules. Elsewhere it stays "not confirmed: an assumed right".
2. **C21 could be left out by default for Spain and Portugal** (still available when ticked, flagged).
3. **Ireland's large energy user policy is a requirement the tool does not model.** That is dispatchable on-site or nearby capacity of 100 % of the import (de-rated), no full import until it runs, and 80 % new renewables. At least a flag on every Irish run, or a requirement input.
4. **Great Britain's proposed commitment fee** (£237k–£712.5k per MW, returned on energisation) could be a cash-flow line for connections of 40 MW or more, once Ofgem decides (intended later in 2026).

## Sources

- CNMC, "La CNMC indica cómo preservar la capacidad liberada tras el cierre de centrales térmicas", 14 February 2022: https://www.cnmc.es/prensa/consulta-nudos-transicion-justa-20220214
- MITECO, "El MITECO lanza los concursos de transición justa de Meirama (Galicia) y Narcea y La Pereda (Asturias)", 26 December 2024: https://www.miteco.gob.es/es/prensa/ultimas-noticias/2024/diciembre/el-miteco-lanza-los-concursos-de-transicion-justa-de-meirama--ga.html
- Portuguese Government, "Aberto concurso público para a atribuição de ponto de ligação à rede elétrica do Pego", September 2021: https://portugal.gov.pt/gc22/comunicacao/comunicados/aberto-concurso-publico-para-a-atribuicao-de-ponto-de-ligacao-a-rede-eletrica-do-pego
- Jornal de Negócios, "Espanhola Endesa ganha concurso para o Pego": https://www.jornaldenegocios.pt/empresas/energia/detalhe/espanhola-endesa-ganha-concurso-para-o-pego
- Gowling WLG, "Transmission connection reform: impact on data centres", 2025: https://gowlingwlg.com/insights-resources/articles/2025/transmission-connection-reform-impact-on-data-centres
- Gowling WLG, "Ofgem demand connection queue reform", 26 August 2026: https://gowlingwlg.com/en/insights-resources/articles/2026/ofgem-demand-connection-queue-reform
- DLA Piper, "New Irish Large Energy Users connection policy", 7 January 2026: https://www.dlapiper.com/en-cl/insights/publications/2026/01/new-irish-large-energy-users-connection-policy
- RWE, "Energised land – energy for data centres": https://www.rwe.com/en/the-group/rwest/energised-land-energy-for-data-centres/
- WinBuzzer, "Nvidia eyes former German nuclear sites for AI data centers", 27 October 2026: https://winbuzzer.com/2026/10/27/nvidia-eyes-former-german-nuclear-sites-ai-data-centers-xcxwbn/
- DatacenterDynamics, "RWE sells Didcot A coal plant in UK to Amazon for data center": https://www.datacenterdynamics.com/en/news/rwe-sells-didcot-a-coal-plant-in-uk-to-amazon-for-data-center/

Not covered yet: the Netherlands (a court case on TenneT refusing a data centre connection was seen in search results but not read), France (RTE's "fast-track" sites for data centres), Italy, Belgium and the Nordic countries.
