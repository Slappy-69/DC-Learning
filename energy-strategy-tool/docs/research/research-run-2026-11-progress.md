# Research run of November 2026: progress

Branch: `feature/research-2026-11`, created from `feature/takeover-decisions` on 2026-11-07. Prompt: the project note `claude/research-run-prompt-2026-11-07.md` (OPEN-QUESTIONS 155–200). Research and proposals only: nothing in `app/`, the defaults register or `main` is changed.

A new chat that picks this up: read this file, then carry on from the first part that is not "done", in the order C, D, B, A, E, G, F.

## Parts

| Part | Subject | Output | State | Dates |
|---|---|---|---|---|
| C | Great Britain's Data Centre Commitment Fee (OQ 199) | `gb-commitment-fee-2026-11.md` | Done | 2026-11-07 |
| D | Ireland's large energy user policy (OQ 198) | `ireland-large-energy-users-2026-11.md` | In progress | Started 2026-11-07 |
| B | Closing plant's grid connection, more countries (OQ 155) | `plant-connection-takeover-part2-2026-11.md` | Not started | |
| A | Yearly grid charge per MW, 31 countries (OQ 160–165) | `grid-capacity-charges-2026-11.md` and `.csv` | Not started | |
| E | Renewable plant data sources (OQ 194–197) | `renewable-plant-sources-2026-11.md` | Not started | |
| G | Open map data for main utilities (OQ 200) | `utility-maps-2026-11.md` | Not started | |
| F | Defaults research, batch 3 (work package 0) | `defaults-batch-3-proposals-2026-11.md` and `.csv` | Not started | |

## Part A: countries

Order: PT, ES, NL, GB, IE, DE, FR, then AT BE BG HR CY CZ DK EE FI GR HU IS IT LV LT LU MT NO PL RO SK SI SE CH.

| Country | State |
|---|---|
| (none yet) | |

## Assumptions taken

(Where the prompt did not settle something, the more cautious reading was taken and recorded here.)

- C: no Ofgem decision found up to 2026-11-07; the fee is treated as proposed. Its Chapter 7 (consequences of missed milestones) could not be read in full; consequences taken from the press release and the draft code text.
- C: a phased campus holds the whole fee until the grid energises (no stage-by-stage release found).

## Questions for the owner

(Anything the owner must decide, gathered as the run goes.)

- C1. GB fee default: blank (engineer enters) or the published midpoint £475,000/MW as a labelled example?
- C2. Cost of the money tied up: cash at the discount rate (Ofgem's worst case), or a letter-of-credit fee rate entered by the engineer?
- C3. Offer acceptance date: a new input, or a default number of years before the grid date?

## Sites not reachable

(Sites that could not be reached, with the source used instead.)

- The session's shell cannot reach most websites (for example www.ofgem.gov.uk: refused by the session's network allowlist). Pages were read with the web-reading tool instead; no workaround was tried.
- Utility Week (article on government support for the GB fee): refused by the site.
