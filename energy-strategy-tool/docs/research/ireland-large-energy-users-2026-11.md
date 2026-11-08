# Ireland's large energy user connection policy for data centres (research, 7 November 2026)

Part D of the research run of November 2026 (OPEN-QUESTIONS 198). The owner chose "a flag on every Irish run". This note says what the published rules require, so the flag can say it accurately and test what the tool can test. It is a screening of public sources, not legal advice.

Confidence labels: "published and clear"; "published, but unclear which tariff applies"; "worked out from a formula (calculation shown)"; "No published value found".

## In short

- **The decision:** CRU/2025236, "Large Energy Users Connection Policy", published by the Commission for Regulation of Utilities (CRU) on 12 December 2025. Despite the name it applies **only to data centres**.
- **Thresholds (maximum import capacity, MIC, in MVA):** below 1 MVA, most of it does not apply. 1 MVA to under 10 MVA: an "autoproducer" (own generation) covering 100 % of the MIC, de-rated. **10 MVA and above:** new dispatchable generation and/or storage, on site or "proximate", separately connected and metered, trading in the wholesale market, with de-rated capacity of at least 100 % of the MIC.
- **De-rating** uses the factors of the all-island capacity market's latest T-4 auction, by technology and unit size. Gas turbines are about 0.82–0.87; batteries are low unless long (4 h about 0.14–0.16 in the 2030/31 pack); wind about 0.06 and solar about 0.04.
- **No import before the plant:** the data centre "cannot energise or ramp demand" beyond the de-rated capacity actually delivered. Demand and plant step up together.
- **Renewables:** at least 80 % of **annual** demand from **new** renewable generation in the Republic of Ireland that feeds the Irish grid, reached within a six-year glide path from energisation, checked yearly from year 7. Annual matching, not hourly. Output from supported schemes (REFIT, RESS, ORESS) does not count unless fully repowered.
- **Under legal challenge:** three environmental groups were granted leave for a judicial review in the High Court on 28 April 2026. No outcome found up to 7 November 2026. EirGrid warns that applicants proceed at their own risk.

## Findings

| Item | Finding | Confidence | Source |
|---|---|---|---|
| Reference and date | CRU/2025236, "Large Energy Users Connection Policy Decision Paper", 12 December 2025. Replaces CRU/21/124 for new applications. | Published and clear | CRU decision paper; EirGrid policy paper V3 |
| Who it applies to | Data centres only, connecting to the transmission or distribution system. Applies to applications received from 12 December 2025, and to MIC increases (treated as new applications). Applications already in process stay under CRU/21/124. Splitting a project to fall under a threshold is not allowed. | Published and clear | CRU decision paper; EirGrid V3 sections 1, 3.5.3.2 |
| Thresholds and their unit | MIC in **MVA**: de minimis below 1 MVA; 1 to under 10 MVA, an autoproducer at 100 % of MIC de-rated; 10 MVA and above, the full requirement. EirGrid handles MIC of 20 MVA or more; ESB Networks handles under 20 MVA. | Published and clear | CRU decision paper; Mason Hayes & Curran, 11 June 2026 |
| MVA against MW | Neither paper gives a power factor. EirGrid's worked example treats 30 MVA as 30 MW. | No published value found (EirGrid's example implies 1:1) | EirGrid V3 Appendix 1 |
| What counts | New generation and/or storage. Technology and fuel are not prescribed; CRU asks for plant that is "futureproofed" (for example gas plant able to move to low- or zero-carbon fuels). Plant already operating, already contracted in the capacity market, or already counted in adequacy studies does not count as new. No run-hour limits beyond routine maintenance and testing. | Published and clear | CRU decision paper section 3.4; EirGrid V3 section 2.1 |
| "On site" and "proximate" | EirGrid: on site means "at the same node" as the data centre demand. Proximate means connected to the same local network as the data centre, a local network being the part of the system between two meshed nodes (a meshed node has three or more connections to the wider network). CRU declined to set a distance: proximate means at least "electrically close". No distance in km. | Published and clear (no distance) | EirGrid V3 section 2.4; CRU decision paper section 3.4.2 |
| Market participation | The plant must trade in the Single Electricity Market as a standalone unit, separately connected and metered, and join the capacity market after the connection agreement is signed. It may bid only for one-year capacity contracts, capped at the data centre's contracted MIC. | Published and clear | CRU decision paper section 3.4; EirGrid V3 sections 2.6, Table 5 |
| How the de-rating is worked out | Each technology's installed MW is multiplied by its de-rating factor from the most recent capacity market T-4 auction information pack available at the planning application stage, by technology and unit size. The sum must be at least the MIC for the whole life of the connection. Renewable plant can count, but only at its own de-rated value, and only up to the 80 % renewable volume. CRU's footnote example: at a gas factor of 0.85, a 100 MVA MIC needs about 118 MW. | Published and clear | CRU decision paper section 3.4.7; EirGrid V3 section 2.7 |
| De-rating factors, 2030/31 T-4 pack (4 August 2026) | Gas turbine, by unit size: 0.868 (up to 10 MW), 0.857 (10–20), 0.848 (20–30), 0.833 (40–50), 0.819 (90–100), 0.797 (190–200), 0.733 (390–400). Storage ("other storage units"), 90–100 MW: 1 h 0.043, 2 h 0.077, 4 h 0.143, 8 h 0.534. Wind 0.059; solar 0.041. A new gas turbine with a run-hour limit of 500 h or less is multiplied by 0.14, 500–1,500 h by 0.43. | Published and clear (the 8-hour storage column reads the same as the 2029/30 pack: check against the PDF before use) | SEMO, IAIP3031T-4 v1.0, Tables 1, 3, 5, 6 |
| De-rating factors, earlier packs | EirGrid's worked example used gas 0.863 and wind 0.056 from the 2028/29 pack. The 2029/30 pack (13 August 2025): gas turbine 0.881 (up to 10 MW) to 0.843 (90–100 MW); storage 90–100 MW 1 h 0.072, 2 h 0.142, 4 h 0.275, 8 h 0.534; wind 0.063; solar 0.049. Battery factors for short durations roughly halved between the 2029/30 and 2030/31 packs. | Published and clear | EirGrid V3 Appendix 1; SEMO IAIP2930T-4 v1.1 |
| Which class a gas engine falls in | The packs give "Gas Turbine", "Steam Turbine", "Hydro", "DSU" and storage classes. No separate class for reciprocating gas engines was found in what was read. | Published, but unclear which class applies | SEMO IAIP3031T-4 |
| Worked example (EirGrid) | 30 MVA site, 80 % utilisation: demand 210 GWh a year; 80 % renewable is 168 GWh; at a 35 % wind capacity factor that is about 54.9 MW of wind, de-rated at 0.056 to about 3.1 MW; the rest, 26.9 MW, from gas at 0.863: about 31.2 MW of gas. With no renewable credit: 30 ÷ 0.863 ≈ 34.8 MW. | Published and clear | EirGrid V3 Table 4 and Appendix 1 |
| "No full import until it runs" | The data centre "cannot be operational or ramp up to its full MIC" without the plant delivered. Demand may not energise or ramp beyond the de-rated capacity actually delivered; the plant must build up "in a stepwise manner" with demand, following a ramp-up profile in the connection offer. The plant's delivery date is the earliest possible energisation date. No fixed interim import level is published. | Published and clear | CRU decision paper section 3.4.9; EirGrid V3 sections 2.7, 3.3, Tables 5 and 7 |
| Renewables: how much and how matched | At least 80 % of **annual** electricity demand, measured with actual output over the year. No hourly matching. | Published and clear | CRU decision paper; EirGrid V3 section 2.2, Table 3 |
| Renewables: what counts | New or additional renewable generation in the Republic of Ireland that physically feeds the Irish grid. Existing operating renewables do not qualify. Output from projects supported by REFIT, RESS, ORESS or other schemes is excluded unless fully repowered. Evidence: a letter from the generator and a binding commercial relationship (a PPA with a new Irish project is an accepted route). Guarantees of origin are not mentioned. A law firm notes EirGrid's wording on "new" is not fully consistent. | Published and clear (with that caveat) | EirGrid V3 sections 2.2, 3.2, Table 3; Mason Hayes & Curran, 11 June 2026 |
| Renewables: when | Six-year glide path from energisation; full compliance assessed from year 7, with a yearly renewable plan and yearly actual figures. | Published and clear | EirGrid V3 Table 3 |
| If it is not met | Falling short of 80 % after the glide path may lead to a reduced MIC and/or termination. If the plant underperforms or is lost, the MIC can be reduced. | Published and clear | EirGrid V3 Table 3, sections 2.8, 3.4 |
| Location | An application in a constrained area cannot be progressed. EirGrid treats Greater Dublin as fully constrained; some 220 kV capacity may exist in Galway, Limerick and Cork (about 50–100 MW each). ESB Networks assesses 27 planning zones. | Published and clear | EirGrid V3 section 2.3; Mason Hayes & Curran, 11 June 2026 |
| Money | Application fee (first instalment €7,000 including VAT); MIC bond before signing the offer (network capacity charge × 18 months × MIC); connection charge security by the consents date. No reservation fee. | Published and clear | EirGrid V3 sections 3.2, 4.3; EirGrid "Connection charges and security" |
| Later changes and legal challenge | Judicial review against the decision by Friends of the Irish Environment, Friends of the Earth Ireland and ClientEarth: leave granted by the High Court on 28 April 2026. The challenge targets the room left for fossil-fuelled plant. No ruling found up to 7 November 2026. A Supreme Court ruling of 4 February 2026 (Coolglass) on public bodies and the Climate Act is cited by critics as undermining the decision; that is a politician's view, not a ruling on this policy. EirGrid says its process may change as a result and applicants proceed at their own risk. CRU says it may review the requirements. | Published and clear (outcome unknown) | Irish Times, 28 Apr 2026; Pinsent Masons, 24 Mar 2026; EirGrid V3 section 1 |

## For the tool: what the flag should say, and what it can test

> **Flag on every run with the pin in Ireland (plain words)**
>
> "Ireland: data centres of 10 MVA or more must bring new dispatchable plant or storage, on site or on the same local network, whose capacity after the capacity market's de-rating is at least the maximum import capacity. Demand cannot step up beyond the de-rated plant actually built. At least 80 % of yearly demand must come from new Irish renewables within six years of energisation. Source: CRU decision CRU/2025236 (12 December 2025) and EirGrid's process paper V3 (20 May 2026). The decision is under judicial review (leave granted 28 April 2026)."
>
> **What the tool can test, per option**
>
> 1. **Import:** the option's contracted grid capacity (MW) stands in for the MIC. MVA against MW: EirGrid's own example treats them as equal; the tool could use its power factor instead (the owner decides).
> 2. **De-rated firm capacity:** for each on-site plant, installed MW × the factor for its technology and unit size from the latest T-4 pack (gas turbine about 0.82 for 100 MW units; battery by hours of storage; wind 0.059, solar 0.041). Add them up. Pass if the sum is at least the import; otherwise show the shortfall in MW.
> 3. **Step by step:** in each year, the de-rated plant in place against the import used that year (the tool's phasing). A year where import runs ahead of the plant is a breach.
> 4. **Renewables:** the option's share of yearly demand met by new renewables (on-site renewables plus any PPA from new Irish plant) from year 7, against 80 %. The tool counts PPA energy hourly (O2), which is stricter than the annual test, so the flag should say the policy is annual.
> 5. **Not testable by the tool:** whether the site is in a constrained area, whether plant is "proximate", and whether the legal challenge changes the rules.

Recorded as an assumption: a standby genset fleet that never trades is not "dispatchable plant participating in the market" under the policy, so the tool's backup gensets should not count towards the test unless the option runs them as market plant. The owner should confirm.

## Questions for the owner (copied to the progress file)

1. The flag's severity: major (it can block a connection) or minor (information)? **Answered 2026-11-07 by the owner: minor (OPEN-QUESTIONS 210).**
2. Do standby gensets count towards the de-rated test? The cautious reading is no, since the policy asks for plant that trades in the market without run-hour limits.
3. MVA against MW for the test: equal (as in EirGrid's example), or the option's power factor?
4. Which de-rating table to bundle: the latest T-4 pack (2030/31, August 2026), updated at each release?

## Sources

| Source | Type | Published | Accessed | URL |
|---|---|---|---|---|
| CRU, "Large Energy Users Connection Policy Decision Paper", CRU/2025236 | Regulator | 12 Dec 2025 | 7 Nov 2026 | https://cruie-live-96ca64acab2247eca8a850a7e54b-5b34f62.divio-media.com/documents/CRU2025236_Large_Energy_User_connection_policy_decision_paper.pdf |
| EirGrid, "Data Centre Connection Offer Process and Policy", V3 (IOO-CC-001-R3) | Operator | 20 May 2026 | 7 Nov 2026 | https://cms.eirgrid.ie/sites/default/files/publications/Data-Centre-Connection-Offer-Process-and-Policy-V3-May-2026.pdf |
| EirGrid, "Connection charges and security" | Operator | Undated | 7 Nov 2026 | https://www.eirgrid.ie/industry/customer-information/connection-charges-and-security |
| SEMO, "2030/2031 T-4 Capacity Auction Initial Auction Information Pack" (IAIP3031T-4) v1.0 | Operator (market operator) | 4 Aug 2026 | 7 Nov 2026 | https://www.sem-o.com/sites/semo/files/2026-08/IAIP3031T-4.pdf |
| SEMO, "2029/2030 T-4 Capacity Auction Initial Auction Information Pack" (IAIP2930T-4) v1.1 | Operator (market operator) | 13 Aug 2025 | 7 Nov 2026 | https://www.sem-o.com/sites/semo/files/2025-08/IAIP2930T-4.pdf |
| Mason Hayes & Curran, "New data centre connection rules: EirGrid and ESB Networks…" | Law firm | 11 Jun 2026 | 7 Nov 2026 | https://www.mhc.ie/latest/insights/new-data-centre-connection-rules |
| Pinsent Masons (Out-Law), "Data centre projects in Ireland face legal challenge impact" | Law firm | 24 Mar 2026 | 7 Nov 2026 | https://www.pinsentmasons.com/out-law/news/data-centre-projects-in-ireland-face-legal-challenge-impact |
| The Irish Times, "Environmental groups granted leave to challenge data centre policy" | Press | 28 Apr 2026 | 7 Nov 2026 | https://www.irishtimes.com/ireland/2026/04/28/environmental-groups-granted-leave-to-challenge-data-centre-policy/ |
| Lynn Boylan MEP, "Supreme Court ruling leaves CRU data centre policy legally untenable" | Press (politician's statement) | 4 Feb 2026 | 7 Nov 2026 | https://lynnboylan.ie/?p=3869 |

Not reachable: sinnfein.ie (same statement; the site refused the request) and stackpath.ie (the site does not allow automated reading).
