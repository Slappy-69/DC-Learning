# Owner's handwritten notes on the user guide (2026-10-22)

Transcribed from the owner's annotated PDF of the user guide (`Data-Centre-Energy-Strategy-Tool-User-Guide.pdf`, 171 pages, edition of 21 October 2026), sent on 22 October 2026. The notes are on 26 pages. Page numbers are the guide's printed page numbers. Words in [square brackets] are the transcriber's reading where the handwriting is unclear. "Struck through" means the owner drew a line through the printed text.

None of these notes has been acted on yet. Several of them touch decisions recorded earlier; those are listed at the end.

## Notes, page by page

| Page | Where (chapter, printed text) | Note |
|---|---|---|
| 3 | Contents, above the heading | "The example at the end, not beginning" (arrow to the contents: move the T1 worked example to the end of the guide) |
| 6 | About this guide, below the guardrail box | "↳ What can we do to take this to the next level?" |
| 7 | How to read this guide, heading "Conventions" | "→ separate page, more detail" |
| 8 | T1 example table, row "IT load: 100 MW, built as four phases of 25 MW" | "number of buildings?" |
| 8 | Below the T1 leader description ("… a power purchase agreement for wind and solar energy covering all the site's consumption …") | "Option to tick PPA, if not the default should be the national grid standard values for price and CO₂ → display info about grid operating details, cost, CO₂, source, uptime, etc." |
| 11 | Chapter 1, section "Who it is for" | Heading and paragraph struck through: "↳ remove" |
| 12 | Chapter 2, section "Phone" | Heading and paragraph struck through: "↳ remove" |
| 20 | Chapter 5, "Phasing and ramp", after "… reaching 100 MW in July 2032." | "→ is this buildings?" |
| 26 | Chapter 7, "Why backup", after the list UPS / standby generators / fuel | "4. BESS →?" (should battery storage be a fourth item in the backup chain?) |
| 29 | Chapter 8, heading "Power purchase agreements (PPAs)" | "→ make this an option, not default" |
| 30 | Chapter 8, "On-site solar", bullet "carport solar from 30 % of the roads and parking allowance, at 8 m² per kWp" | Bullet struck through (remove carport solar) |
| 30 | Chapter 8, bullet "ground solar either at a fixed size, or by 'filling the residual' … at 1.2 ha per MWp" | "→ user specifies area" |
| 35 | Chapter 10, "Representative days", box "Agreed, not built yet: a screening run uses representative days …" | Arrow to the box: "I want full run every time!" |
| 44 | Chapter 14, figure 7 (section 1, Project and location), latitude and longitude fields circled | "Maps!" |
| 46 | Chapter 15, figure 9 (section 2, Site), near "Roads, parking, landscaping (%)" | A single small dot; no text (probably a stray mark) |
| 48 | Chapter 16, figure 10 (section 3, Load and building), next to the phasing table | "Phase = Buildings? ↓ Data centres" |
| 48 | Chapter 16, figure 10, field "Ramp: share at energisation (%)", value 50 | Value struck through: "25 %" |
| 49 | Chapter 16, table row "Average IT utilisation: 80 %, average draw as a share of installed IT (energy only)" | "→ per year" |
| 50 | Chapter 16, figure 11 (mock-up "Grid and load: enter what you know"), field "Grid connection capex" | "→ ADD a user option, but also country standard calculated" |
| 51 | Chapter 16, figure 12 (mock-up "Load shape and flexibility"), heading | "→ more detail" |
| 51 | Chapter 16, below figure 12, arrow from the demand flexibility and battery response panel | "more information on what each parameter is ↳ live results if possible?" |
| 53 | Chapter 17, table row "Grid export capacity: 0 MW, used only by C1 'Grid + export'" | "→ ?" |
| 54 | Chapter 18, figure 14 (section 5, Requirements), arrow from "Islanding required" | "how does this align with on-site diesel gensets if the grid goes down?" |
| 59 | Chapter 20, figure 18, choice C7 Autonomy / fuel storage, value "Belly tanks only" | Value struck through (remove "belly tanks only") |
| 66 | Chapter 22, figure 23 (mock-up of the top five cards), bracket across cards #1 and #2 (PV 7.7 MWp and PV 2.5 MWp) | "What is the difference here? PV? Why?" |
| 66 | Chapter 22, figure 23, card #3, pro "Lowest capex of the 5 shown" | "→ ADD explanation" |
| 67 | Chapter 22, options table columns, row "Unmet MWh: unmet load over all simulated years" | "→ also want [unmet] MW" (peak unmet power as well as energy) |
| 69 | Chapter 23, figure 25 (option detail of the T1 leader), next to Economics / "NPV of net cost €937 m" | "↳ What NPV?" |
| 69 | Chapter 23, figure 25, arrow to "Unmet (all dispatched years): 650 MWh · 821 h · peak 2.02 MW" | "it shouldn't be possible to have unmet power for the best option" |
| 70 | Chapter 23, figure 26 (sizing and flags), next to the MAJOR flag "Grid capacity binding: 821 h, 650 MWh unmet (peak 2.0 MW)" | "→ this needs to push the option down" |
| 75 | Chapter 26, figure 31 (phasing chart), circle where the design load line rises above the 20 MW grid connection (around 2028–2029) | "FLAG ↑" |
| 76 | Chapter 26, figure 32 (hourly dispatch, week 24 of 2029), arrow to the red unmet-load strips | "↳ surely this means on-site power or BESS? ?" |

## Notes that touch earlier decisions

These notes ask for something different from what the walkthrough of 2026-10-21 or the brief recorded. They are not decided: each needs the owner's answer, one at a time, before anything changes.

1. **Unmet load and the ranking** (pages 69, 70, 75): "it shouldn't be possible to have unmet power for the best option" and "this needs to push the option down". Today, principle 5 ("flag, never enforce", brief §2) means unmet load is flagged but never demotes an option; its only effect on the score is through the time-to-power axis. Pushing such options down would be an exception to principle 5, which only the owner can make (compare OPEN-QUESTIONS 22, the same question for O1).
2. **Full run every time** (page 35): the walkthrough agreed the two-tier model (representative days for screening, 8,760 hours for the top options; OPEN-QUESTIONS 1 and 23; build plan package 8). The note asks for the full-year run every time.
3. **PPA as an option, not a default** (pages 8 and 29): C13 today generates "None" and "Hybrid" by default, and the T1 leader has a 100 % hybrid PPA. The note asks for the PPA to be ticked on by the engineer, with national grid price and CO₂ used when it is not, and for more information on the grid (operating details, cost, CO₂, source, uptime).
4. **Grid connection capex** (page 50): the walkthrough set the default to 0 with the country value shown for reference. The note asks for a user value and also a country standard value calculated by the tool (related to OPEN-QUESTIONS 20).
5. **Ramp share at energisation 25 %** (page 48): today's default is 50 % (indicative — unverified). This is a change of default for work package 0.
6. **Carport solar and "belly tanks only" removed** (pages 30 and 59): both are C10 and C7 alternatives in the brief §8.
7. **Ground solar area set by the user** (page 30): relates to OPEN-QUESTIONS 25 (land budget for ground solar with the Site tab hidden).
8. **Phases as buildings** (pages 8, 20, 48): the brief has no notion of buildings; a phase is IT MW and a date.
9. **Islanding and diesel backup** (page 54) and **BESS in the backup chain** (page 26): questions about how the resilience model works; related to the battery split (resilience reserve and economic battery, build plan package 4).
10. **Map for the location** (page 44): already agreed (build plan package 1).
11. **Guide changes** (pages 3, 7, 11, 12, 51, 66, 69): move the T1 example to the end; a separate, more detailed conventions page; remove "Who it is for" and "Phone"; more detail on load shape and flexibility; explain each pro and con on the cards; explain which NPV is shown.

## Settled so far

- Pages 69, 70, 75, 76 (unmet load): power adequacy first, OPEN-QUESTIONS 38–41 (2026-10-22).
- Option 1 of the worked example (bridging plant left idle after the grid; turbines): OPEN-QUESTIONS 42–48 (2026-10-22).
- Pages 8 and 29 (PPA as an option, not a default): OPEN-QUESTIONS 49 (2026-10-22).
- Page 50 (grid connection capex: user value and country standard): OPEN-QUESTIONS 50 (2026-10-22).
- Page 48 (ramp 25 %): OPEN-QUESTIONS 51 (2026-10-22).
- Pages 30 and 59 (carport solar, belly tanks, user-specified solar area): OPEN-QUESTIONS 52, 53 (2026-10-22).

Left open on 2026-10-22: page 35 ("I want full run every time"). Not yet discussed: pages 3, 6, 7, 8 ("number of buildings?" and the grid information panel, which question 49 places in package 1), 11, 12, 20, 26, 44, 48 ("phase = buildings"), 49, 51, 53, 54, 66, 67, 69 ("What NPV?"), 76.
