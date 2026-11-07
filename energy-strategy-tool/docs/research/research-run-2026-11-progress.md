# Research run of November 2026: progress

Branch: `feature/research-2026-11`, created from `feature/takeover-decisions` on 2026-11-07. Prompt: the project note `claude/research-run-prompt-2026-11-07.md` (OPEN-QUESTIONS 155–200). Research and proposals only: nothing in `app/`, the defaults register or `main` is changed.

A new chat that picks this up: read this file, then carry on from the first part that is not "done", in the order C, D, B, A, E, G, F.

## Parts

| Part | Subject | Output | State | Dates |
|---|---|---|---|---|
| C | Great Britain's Data Centre Commitment Fee (OQ 199) | `gb-commitment-fee-2026-11.md` | Done | 2026-11-07 |
| D | Ireland's large energy user policy (OQ 198) | `ireland-large-energy-users-2026-11.md` | Done | 2026-11-07 |
| B | Closing plant's grid connection, more countries (OQ 155) | `plant-connection-takeover-part2-2026-11.md` | Done | 2026-11-07 |
| A | Yearly grid charge per MW, 31 countries (OQ 160–165) | `grid-capacity-charges-2026-11.md` and `.csv` | In progress | Started 2026-11-07 |
| E | Renewable plant data sources (OQ 194–197) | `renewable-plant-sources-2026-11.md` | Not started | |
| G | Open map data for main utilities (OQ 200) | `utility-maps-2026-11.md` | Not started | |
| F | Defaults research, batch 3 (work package 0) | `defaults-batch-3-proposals-2026-11.md` and `.csv` | Not started | |

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

Notes gathered before Part A started (use them, then check):

- FI: Fingrid 2026 (Appendix 2, 1 Jan 2026): consumption fee €10.47/MWh winter weekday 07–21, €2.97/MWh other times; intake fee €1.07/MWh; no capacity fee for consumption (only plants €189.5/MW/month and storage €94.75/MW/month). 2027 prices published as attachments on Fingrid's fee page.
- IE: MIC bond = network capacity charge × 18 months × MIC (EirGrid, connection charges and security); the capacity charge rate itself still to find (TUoS statement).

## Assumptions taken

(Where the prompt did not settle something, the more cautious reading was taken and recorded here.)

- C: no Ofgem decision found up to 2026-11-07; the fee is treated as proposed. Its Chapter 7 (consequences of missed milestones) could not be read in full; consequences taken from the press release and the draft code text.
- C: a phased campus holds the whole fee until the grid energises (no stage-by-stage release found).
- D: standby gensets that never trade do not count towards Ireland's de-rated test (the policy asks for market plant without run-hour limits).
- D: the 8-hour storage de-rating column of the 2030/31 T-4 pack read the same as 2029/30; marked for checking against the PDF.

## Questions for the owner

(Anything the owner must decide, gathered as the run goes.)

- C1. GB fee default: blank (engineer enters) or the published midpoint £475,000/MW as a labelled example?
- C2. Cost of the money tied up: cash at the discount rate (Ofgem's worst case), or a letter-of-credit fee rate entered by the engineer?
- C3. Offer acceptance date: a new input, or a default number of years before the grid date?
- D1. Ireland flag severity: major or minor?
- D2. Do standby gensets count towards Ireland's de-rated test (cautious reading: no)?
- D3. MVA against MW for Ireland's test: equal (EirGrid's example) or the option's power factor?
- D4. Bundle the latest T-4 de-rating table (2030/31, August 2026) and update it at each release?
- B1. Norway's takeover flag: "likely unavailable" (reserved capacity cannot change purpose) rather than "not confirmed"?
- B2. Should the general takeover flag say, for every country, that a plant's export connection is not an import connection?
- A1. Countries that charge on measured peak (DE today, PT peak hours, NL monthly maximum, GB Triads): charge the per-MW line on the option's contracted grid MW anyway (as decided in OQ 162), or on its peak import?
- A2. Discounts for large flat loads (DE bandload, ES/PT electro-intensive): leave out, offer as a tick, or apply by default?
- A3. GB's residual is fixed per site, not per MW: enter it as a yearly lump sum, or divide by the contracted MW?

## Sites not reachable

(Sites that could not be reached, with the source used instead.)

- The session's shell cannot reach most websites (for example www.ofgem.gov.uk: refused by the session's network allowlist). Pages were read with the web-reading tool instead; no workaround was tried.
- Utility Week (article on government support for the GB fee): refused by the site.
- sinnfein.ie (refused) and stackpath.ie (does not allow automated reading): same content found elsewhere.
- B: lovdata.no (refused), anwalt.de (refused), gridreadiness.com (does not allow automated reading).
