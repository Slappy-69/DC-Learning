# Research run of November 2026: progress

Branch: `feature/research-2026-11`, created from `feature/takeover-decisions` on 2026-11-07. Prompt: the project note `claude/research-run-prompt-2026-11-07.md` (OPEN-QUESTIONS 155–200). Research and proposals only: nothing in `app/`, the defaults register or `main` is changed.

A new chat that picks this up: read this file, then carry on from the first part that is not "done", in the order C, D, B, A, E, G, F.

## Parts

| Part | Subject | Output | State | Dates |
|---|---|---|---|---|
| C | Great Britain's Data Centre Commitment Fee (OQ 199) | `gb-commitment-fee-2026-11.md` | Done | 2026-11-07 |
| D | Ireland's large energy user policy (OQ 198) | `ireland-large-energy-users-2026-11.md` | Done | 2026-11-07 |
| B | Closing plant's grid connection, more countries (OQ 155) | `plant-connection-takeover-part2-2026-11.md` | Done | 2026-11-07 |
| A | Yearly grid charge per MW, 31 countries (OQ 160–165) | `grid-capacity-charges-2026-11.md` and `.csv` | Done (5 random entries checked) | 2026-11-07 |
| E | Renewable plant data sources (OQ 194–197) | `renewable-plant-sources-2026-11.md` | Done | 2026-11-07 |
| G | Open map data for main utilities (OQ 200) | `utility-maps-2026-11.md` | Done | 2026-11-07 |
| F | Defaults research, batch 3 (work package 0) | `defaults-batch-3-proposals-2026-11.md` and `.csv` | Done (26 proposals in the run, 16 more on 7–8 Nov: gas price and transport, gas turbines and engines, licences, escalation, weather; still-not-reached list in the file) | 2026-11-07 to 08 |
| H | Levies and taxes per MWh, 31 countries (owner's choice after the run) | `levies-and-taxes-2026-11.md` and `.csv` | Done (28 countries with at least part found; second and third passes; 5 random entries checked) | 2026-11-07 to 08 |
| A (2nd pass) | Gaps in the grid charge per MW | end of `grid-capacity-charges-2026-11.md` | Done | 2026-11-08 |
| H (data centre rules) | Local website that states each data centre tax rule (owner's request, 7 Nov 2026, after OQ 204) | `data-centre-tax-rules-2026-11.md` and `.csv` | Done for FR, FI, SE, NO, GB (SE read in the first pass only; FR rate and conditions still from a broker page; GB sector agreement from techUK) | 2026-11-07 |

## Part A: countries

Order: PT, ES, NL, GB, IE, DE, FR, then AT BE BG HR CY CZ DK EE FI GR HU IS IT LV LT LU MT NO PL RO SK SI SE CH.

| Country | State |
|---|---|
| PT | Done 2026-11-07 |
| ES | Done 2026-11-07 |
| NL | Done 2026-11-07 |
| GB | Done 2026-11-07 |
| IE | Done 2026-11-07 (2025/26 rate; 2026/27 table not found) |
| DE | Done 2026-11-07 |
| FR | Done 2026-11-07 (August 2025 grid; the 1 August 2026 grid not read) |
| AT | Done 2026-11-07 |
| BE | Done 2026-11-07 |
| BG | Done 2026-11-07 (no capacity charge) |
| HR | Done 2026-11-07 (2025 items; 2026 not read) |
| CY | Done 2026-11-07 (no published value found) |
| CZ | Done 2026-11-07 (2025 prices; 2026 not read) |
| DK | Done 2026-11-07 |
| EE | Done 2026-11-07 (package II terms to check) |
| FI | Done 2026-11-07 (no capacity charge) |
| GR | Done 2026-11-07 (secondary sources) |
| HU | Done 2026-11-07 |
| IS | Done 2026-11-07 (2022 tariff; later not read) |
| IT | Done 2026-11-07 |
| LV | Done 2026-11-07 |
| LT | Done 2026-11-07 (no 2026 value found) |
| LU | Done 2026-11-07 |
| MT | Done 2026-11-07 (no published value found) |
| NO | Done 2026-11-07 |
| PL | Done 2026-11-07 (structure only; rate table not readable) |
| RO | Done 2026-11-07 (no capacity charge) |
| SK | Done 2026-11-07 |
| SI | Done 2026-11-07 (group naming to check) |
| SE | Done 2026-11-07 (no readable value) |
| CH | Done 2026-11-07 |

All 31 countries done. Second pass (7 Nov 2026): FR +3.34 % from 1 Aug 2026 (coefficients not read); SE expansion component 0 kr/kW on 2026 figures; IE 2026/27 demand tariffs not found; see the end of the Part A note. Values not found or not readable, to try again later: CY, LT, MT, PL (rate table), SE (price list); 2026 values not read for CZ, HR, IE (2026/27), FR (Aug 2026 grid); IS out of date (2022).

Notes gathered before Part A started (use them, then check):

- FI: Fingrid 2026 (Appendix 2, 1 Jan 2026): consumption fee €10.47/MWh winter weekday 07–21, €2.97/MWh other times; intake fee €1.07/MWh; no capacity fee for consumption (only plants €189.5/MW/month and storage €94.75/MW/month). 2027 prices published as attachments on Fingrid's fee page.
- IE: MIC bond = network capacity charge × 18 months × MIC (EirGrid, connection charges and security); the capacity charge rate itself still to find (TUoS statement).

## Part H: levies and taxes per MWh (owner's choice, 7 November 2026, after the run)

Output: `levies-and-taxes-2026-11.md` and `.csv`. Order: DE, NL, GB, FR, ES, PT, IE, IT, then the others alphabetically. Eurostat's component data could not be reached (shell refused; the DBnomics mirror shows only 2022 for band IG).

| Country | State |
|---|---|
| DE | Done 2026-11-07 |
| NL | Done 2026-11-07 |
| GB | Done 2026-11-07 (levies mostly from a secondary guide) |
| FR | Done 2026-11-07 (secondary sources) |
| ES | Done 2026-11-07 (tax only; small supplier items not researched) |
| PT | Done 2026-11-07 |
| IE | Done 2026-11-07 (capacity and imperfections charges not researched) |
| FI | Done 2026-11-07 |
| SE | Done 2026-11-07 |
| NO | Done 2026-11-07 (data centre rate unclear) |
| DK | Done 2026-11-07 |
| CH | Done 2026-11-07 |
| AT | Done 2026-11-07 (renewables contribution % not read) |
| BE | Done 2026-11-07 (2025 surcharges; federal excise not read) |
| PL | Done 2026-11-07 (excise not read) |
| CZ | Done 2026-11-07 (POZE state-paid 2026–27; OTE fee not read) |
| SK | Done 2026-11-07 (TPS banding not confirmed) |
| RO | Done 2026-11-07 |
| HU | Done 2026-11-07 (KÁT from press; to check) |
| GR | Done 2026-11-07 (partial: MV renewables levy only) |
| LU | Done 2026-11-07 (partial: tax not found) |
| EE | Done 2026-11-07 (partial: one fee only) |
| LV | Done 2026-11-07 (OIK zero, tax; energy charges missing) |
| CY | Done 2026-11-07 (partial: two levies; no network) |
| HR | Done 2026-11-07 (2023 fee; 2024 amendment not readable) |
| SI | Done 2026-11-07 (per-kW contribution from Oct 2024) |
| BG | Done 2026-11-07 (PSO not in force 2024; excise not found) |
| LT | Searched twice 2026-11-07: no value |
| MT | Searched 2026-11-07: no value (regulated tariff) |
| IS | Searched 2026-11-07: law not reachable |
| IT | Partly done 2026-11-07 (rate tables not readable) |

Part H: 23 countries researched (GR, LU and EE only in part). No usable value: LT, IS, MT; CY, LV, HR, SI, BG found in part; they and the remaining gaps are listed at the end of `levies-and-taxes-2026-11.md`.

## Assumptions taken

(Where the prompt did not settle something, the more cautious reading was taken and recorded here.)

- C: no Ofgem decision found up to 2026-11-07; the fee is treated as proposed. Its Chapter 7 (consequences of missed milestones) could not be read in full; consequences taken from the press release and the draft code text.
- C: a phased campus holds the whole fee until the grid energises (no stage-by-stage release found).
- D: standby gensets that never trade do not count towards Ireland's de-rated test (the policy asks for market plant without run-hour limits).
- D: the 8-hour storage de-rating column of the 2030/31 T-4 pack read the same as 2029/30; marked for checking against the PDF.

**Double-counting check (owner's question, 7 Nov 2026, 23:12 local).** The tool's hourly grid price is wholesale only and the adder is added on top (`defaults.js` comment: "price (wholesale €/MWh), adder (non-commodity €/MWh)"; brief §5.4), so the levies are not in the price. Two places still need a check before anything is built: (1) Ireland: EirGrid's System Services Charge (€26.5–29.1/MWh, in the network part) and SEMO's imperfections charge (€18.81/MWh, in the levies part) are taken as two different bills; the two documents were not read side by side. (2) The country price profiles are synthetic and calibrated to indicative annual figures (GB 95, IE 110 €/MWh, "indicative — unverified"); their calibration to a wholesale figure should be confirmed when the grid price source record is filled. Per-MW parts (for example GB TNUoS, FR capacity mechanism) are covered by OPEN-QUESTIONS 203.

## Questions for the owner

(Anything the owner must decide, gathered as the run goes.)

- C1. GB fee default: blank (engineer enters) or the published midpoint £475,000/MW as a labelled example? **Answered 2026-11-07 by the owner: "Yes blank" (OPEN-QUESTIONS 206).**
- C2. Cost of the money tied up: cash at the discount rate (Ofgem's worst case), or a letter-of-credit fee rate entered by the engineer? **Answered 2026-11-07 by the owner: "No extra cost other than the money on the deposit", read as cash at the discount rate, no bank fee (OPEN-QUESTIONS 207).**
- C3. Offer acceptance date: a new input, or a default number of years before the grid date? **Answered in part 2026-11-07 by the owner (OPEN-QUESTIONS 208): the deposit comes back when the grid capacity it was paid for becomes available, stage by stage. When it goes out: **day 1 of the analysis** (OPEN-QUESTIONS 209, question C3b).**
- D1. Ireland flag severity: major or minor? **Answered 2026-11-07 by the owner: "Minor" (OPEN-QUESTIONS 210).**
- D2. Do standby gensets count towards Ireland's de-rated test (cautious reading: no)? **Answered 2026-11-07 by the owner: "No" (OPEN-QUESTIONS 211).**
- D3. MVA against MW for Ireland's test: equal (EirGrid's example) or the option's power factor? **Answered 2026-11-07 by the owner: power factor 0.975, labelled judgement (OPEN-QUESTIONS 212).**
- D4. Bundle the latest T-4 de-rating table (2030/31, August 2026) and update it at each release? **Answered 2026-11-07 by the owner: "Yes" (OPEN-QUESTIONS 213).**
- B1. Norway's takeover flag: "likely unavailable" (reserved capacity cannot change purpose) rather than "not confirmed"? **Answered 2026-11-07 by the owner: "Likely not available" (OPEN-QUESTIONS 214).**
- B2. Should the general takeover flag say, for every country, that a plant's export connection is not an import connection? **Answered 2026-11-07 by the owner: "Yes" (OPEN-QUESTIONS 215).**
- A1. **(Answered before the run: OPEN-QUESTIONS 162, contracted MW.)** Countries that charge on measured peak (DE today, PT peak hours, NL monthly maximum, GB Triads): charge the per-MW line on the option's contracted grid MW anyway (as decided in OQ 162), or on its peak import?
- A2. Discounts for large flat loads (DE bandload, ES/PT electro-intensive): leave out, offer as a tick, or apply by default? **Answered 2026-11-07 by the owner: "Tick" and "Add it to a further research list" (OPEN-QUESTIONS 216; list: `further-research-list-2026-11.md`).**
- A3. GB's residual is fixed per site, not per MW: enter it as a yearly lump sum, or divide by the contracted MW? **Answered 2026-11-07 by the owner: "Lump sum" (OPEN-QUESTIONS 217).**
- A4. Where the network bill has both a contracted line and a peak line (NL, BE, PT), should the tick carry only the contracted line (the rest stays in the per-MWh adder), or both? **Answered 2026-11-07 (OPEN-QUESTIONS 203): the adder holds everything; the per-MW part, both lines, moves to the per-MW charge when ticked.**
- A5. Latvia charges on transformer capacity, usually above the contracted MW: accept the understatement, or add a transformer factor? **Answered 2026-11-07 by the owner: "Accept" (OPEN-QUESTIONS 218).**
- E1. Renewable plant source: powerplantmatching (recommended), OpenStreetMap, or both? **Answered 2026-11-07 by the owner: "Powerplant matching" (OPEN-QUESTIONS 219).**
- E2. Group German wind turbines into farms at build time (a judgement distance), or show them turbine by turbine?
- E3. powerplantmatching's licence mix (about 2 % of renewable rows draw on OpenStreetMap): accept its CC BY 4.0 statement, or ask a licensing adviser?
- G1. Which utilities first (proposed: electricity 220 kV+, gas, water, heat, telecoms)?
- G2. Each utility as a default distance that drives a cost (electricity, gas) or only as a flag (water, telecoms, heat)?
- G3. ODbL data (OpenStreetMap, PyPSA-Eur network) bundled as separate files in the public repository and the Windows program: acceptable?
- G4. Build a release script for OpenStreetMap extracts (needs a machine that can reach Geofabrik)?
- F1. Approve ACER 2026 as the source for cable route costs, split by voltage band?
- F2. Keep the network adders unchanged until levies are researched (proposed), or lower them now? **Answered 2026-11-07 by the owner (with H1): wait until all the research is done (OPEN-QUESTIONS 201).**
- F3. Gas connection pipe: keep 0.8 M EUR/km as judgement with the ACER flag, or move to the ACER median 2.08 M EUR/km?
- F4. Gas price: accept the Dutch TTF hub price (press-reported, dated) as the "latest dated price" beside the 2025 average (€42.9)? TTF closed at €85.6 on 6 Nov 2026.
- F5. (Withdrawn 8 Nov 2026: ASHRAE was already decided in OPEN-QUESTIONS 64, not bundled.)
- F6. Gas engines' minimum stable load: the Danish Energy Agency's 50 % (today 30 %), or keep 30 % as judgement?
- F7. Agency catalogue values are in 2015 money: use as published, or escalate (needs an escalation source)?
- F8. Escalation: World Bank (April 2026) for 2026–27, then the TYNDP 2026 path for gas and carbon?
- F9. (Withdrawn 8 Nov 2026: the tool already uses GHCNh; the ISD retirement does not affect it.)

- H1. Set the adder to network + levies and taxes for DE, NL, PT, FI, SE, DK, CH, IE now, or after the rest are researched? **Answered 2026-11-07 by the owner: "Wait for all the research is done before implementing" (OPEN-QUESTIONS 201).**
- H2. Show data centre tax rules (FR reduced rate, FI change on 1 Jul 2026, SE removal, GB CCA discount, NO ended rate) as flags on the options? **Answered 2026-11-07 by the owner: "Yes" (OPEN-QUESTIONS 204).** The owner also asked for the local website that mentions each tax: done in `data-centre-tax-rules-2026-11.md`.
- H2b. (New, to ask later.) Where the rate depends on conditions (FR, GB), which is the default: the reduced rate, or the normal rate until the engineer ticks that the conditions are met? Recommendation: normal rate by default.
- H3. GB: use levies from a secondary guide (about £78/MWh), or wait until each is read from its issuing body? **Answered 2026-11-07 by the owner: "Yes", use the guide's figures labelled "sourced — not independently checked" (OPEN-QUESTIONS 205).**

## Where the next run starts

**Owner, 7 Nov 2026, 23:31 local (OPEN-QUESTIONS 219):** the renewable plant source is powerplantmatching. Next question: E2.

**Owner, 7 Nov 2026, 23:30 local (OPEN-QUESTIONS 218):** Latvia's capacity fee: accept the understatement, flagged. Part A is done.

**Owner, 7 Nov 2026, 23:29 local (OPEN-QUESTIONS 217):** Great Britain's fixed residual is a yearly lump sum.

**Owner, 7 Nov 2026, 23:28 local (OPEN-QUESTIONS 216):** large flat load discounts are an optional tick, off by default; the eligibility research is on the new further research list.

**Owner, 7 Nov 2026, 23:26 local (OPEN-QUESTIONS 215):** the general takeover flag says an export connection is not an import connection. Part B is done.

**Owner, 7 Nov 2026, 23:25 local (OPEN-QUESTIONS 214):** Norway's takeover flag reads "likely not available".

**Owner, 7 Nov 2026, 23:24 local (OPEN-QUESTIONS 213):** the tool includes the latest Irish de-rating table, updated at each release. Part D is done.

**Owner, 7 Nov 2026, 23:22 local (OPEN-QUESTIONS 212):** Ireland's test converts MW to MVA at a power factor of 0.975.

**Owner, 7 Nov 2026, 23:21 local (OPEN-QUESTIONS 211):** standby generators do not count towards Ireland's test.

**Owner, 7 Nov 2026, 23:20 local (OPEN-QUESTIONS 210):** the Ireland flag is minor.

**Owner, 7 Nov 2026, 23:19 local (OPEN-QUESTIONS 209):** the Great Britain deposit goes out on day 1.

**Owner, 7 Nov 2026, 23:18 local (OPEN-QUESTIONS 208):** the Great Britain deposit comes back stage by stage as the grid capacity it was paid for becomes available.

**Owner, 7 Nov 2026, 23:17 local (OPEN-QUESTIONS 207):** the Great Britain commitment fee is a cash deposit with no bank fee; the cost is the money tied up.

**Owner, 7 Nov 2026, 23:15 local (OPEN-QUESTIONS 206):** the Great Britain commitment fee field starts blank, with Ofgem's range beside it.

**Owner, 7 Nov 2026, 23:14 local (OPEN-QUESTIONS 205):** Great Britain's levies are used from the guide, labelled.

**Owner, 7 Nov 2026, 22:15 local (OPEN-QUESTIONS 204):** data centre tax rules are shown as flags ("Yes"), and the notes must name the local website for each tax: done in `data-centre-tax-rules-2026-11.md` (impots.gouv.fr and BOFiP, Vero.fi, Skatteverket, Skatteetaten and Stortinget, GOV.UK). Next question to ask, one at a time: H3 (Great Britain levies: secondary guide or issuing bodies), then H2b, then the rest of the open list.

**Owner, 7 Nov 2026, 21:41 local (OPEN-QUESTIONS 202):** the research counts as done, except Italy's general system charges tables and Ireland's 2026/27 demand tariffs, which the owner will try to attach. Next: the open questions one at a time, starting with OPEN-QUESTIONS 203 (per-MW charges and the adder).

**8 Nov 2026 (after the usage limit reset):** done: the Danish Energy Agency's gas engine and 5–40 MW turbine sheets (turbine proposals revised to "keep as judgement"); France's excise confirmed; Hungary cross-check; escalation sources (World Bank April 2026, TYNDP 2026); NOAA's ISD found retired (the tool already uses its replacement, GHCNh; no change); five random new entries checked, all match as recorded (see the levies note). **Gaps that remain need documents this session cannot read or the owner's input:** ARERA's general system charges tables (Italy), Svenska kraftnät's 2026 price list, EirGrid's 2026/27 demand tariffs, PSE's rate table (Poland), Iceland's law (althingi.is refuses), Greece at high voltage, Hungary's KÁT rate for large users, Luxembourg's electricity tax, Estonia's 2026 renewables fee, Lithuania and Malta; and judgement items (grid connection date defaults, country gas spreads, an electricity price forecast by country).

**After the run (7 Nov 2026, evening):** the owner asked to carry on until all the research is done (OPEN-QUESTIONS 201). Done since: levies for all 31 countries (second pass included), Part A second pass, defaults batch 3 second set. The session hit the 5-hour usage limit at about 21:00 UTC while opening the Danish Energy Agency's catalogue (gas engine chapter, https://ens.dk/media/3283/download). Next, in order: that chapter; Hungary's KÁT for large users; Italy's general system charges (ARERA tables 227/2026 A and 588/2025 B); Greece at high voltage; Luxembourg's electricity tax; country gas spreads; escalation sources; NOAA cleaning; then the summaries and a check of the new figures against their sources.


Part F, the list "Not reached in this batch" in `defaults-batch-3-proposals-2026-11.md` (levies and taxes now done for 23 countries, see Part H), next the gas commodity price by country. Part A gaps to retry: CY, LT, MT, PL (section C table), SE (2026 price list), and the 2026 values for CZ, HR, IE (2026/27) and FR (August 2026 grid).

## Sites not reachable

(Sites that could not be reached, with the source used instead.)

- The session's shell cannot reach most websites (for example www.ofgem.gov.uk: refused by the session's network allowlist). Pages were read with the web-reading tool instead; no workaround was tried.
- Utility Week (article on government support for the GB fee): refused by the site.
- sinnfein.ie (refused) and stackpath.ie (does not allow automated reading): same content found elsewhere.
- B: lovdata.no (refused), anwalt.de (refused), gridreadiness.com (does not allow automated reading).
- A: several regulators' pages refused or did not extract tables (ft.dk, vert.lt, cru.ie publications, EirGrid statement of charges, CRE and PSE tariff tables, Ofgem from the shell). Sources used instead are named in each country section.
- Data centre rules: Légifrance (art. L. 312-64 and L. 312-70 of the Code des impositions sur les biens et services) was not surfaced by search, so the French rate is not confirmed at the source; one Skatteetaten statement address was too long for the reader.
- E: overpass-api.de, taginfo.openstreetmap.org, download.geofabrik.de and openinframap.org refused from the shell; OpenInfraMap's statistics pages were read with the web reader. openstreetmap.org/copyright needed a permission that was not granted; the OSM Foundation FAQ was used.
