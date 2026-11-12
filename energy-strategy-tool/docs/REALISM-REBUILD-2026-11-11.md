# The realism rebuild (11 November 2026)

**Status: merged into `main` on 2026-11-12**, with the owner's yes: "Merge into main when everything is passing and ready" (2026-11-12, 09:39 local). It was built on the branch `feature/realism-rebuild` on 2026-11-11.

## What the owner asked for

On 2026-11-11, after the ranking study and the review of the option set:

> "I want you to fix all of that above and add anything else you think it's worth it. You have full access and responsibility permission. I give you carte blanch in decision. Just make it more realistic. Also look up country new rules for DC that just came in or are planned for the future"

Earlier the same day: "I'm happy to go through the rebuild"; "Building starts late, this will need to be highlighted though"; and "Yes" to a latest acceptable start that the owner sets.

The aim: the options at the top are ones a data centre developer could build.

**Every decision in the rebuild is Claude's, taken under that instruction.** Each is written down in `brief-v2/OPEN-QUESTIONS.md`, rows 247 to 255, and each can be reversed. One run setting, "Realism rebuild", turns all of it off. Off, the tool gives the same figures as `main`.

## What changed, in plain words

1. **Buildings start when they are powered.** Before, every option kept the planned dates, and an option that could not power them was marked "not adequate". Now each option has its own dates. A building starts when the grid, the firm plant and the standby plant can carry it. A building the supply can never carry is not built. The option is then sized and costed for what it really powers.
2. **A late start is highlighted.** On the header, the cards, the list, the option's detail, the summary and the PDF: which building, how many months, the new date and the cause.
3. **Plant waits for its consent.** A permit takes 6 months (already in the tool). Running plant of 300 MW of heat or more needs an environmental impact assessment: 18 months. In Great Britain a generating plant above 50 MW needs a development consent order: 30 months. Lead times are the figures of 2026: gas engines 21 months, gas turbines 40, fuel cells 12 plus 5 to install.
4. **Plant is bought when it is needed.** A top-up plant is bought one step per building. Bridging plant that would arrive after the grid is not bought. A top-up with nothing to top up is not bought. The option's name says what is really there.
5. **Each option gets a buildability tier.** Tier A: buildable, nothing beyond the standard consents. Tier B: buildable with conditions, each one named (an agreement with a plant's owner, an environmental assessment, a gas supply not confirmed, and so on). Tier C: unlikely to be built as it stands (a permit rated unlikely, a gas supply too small, a site too small, a country rule that closes the route).
6. **The ranking puts buildable options first.** In order: serves its load in every hour; likely to be built (tier A or B); meets the resilience requirement (the owner's decision 244); powers the most IT; starts every building within the latest acceptable start (12 months unless the owner sets another); then the weighted score, with the same four weights. An option further down says why.
7. **The cards show strategies.** A strategy is the permanent supply. How the first buildings are bridged is a variant of it. The last cards are a ladder: "Step down" is the best buildable option that powers fewer buildings, shown when it is cheaper. "Stands on its own" is the best buildable option that needs no other owner's plant or grid connection, shown when every leading card needs one.
8. **Options no developer would build are not generated.** Rented sets only as a bridge that leaves. No whole bridging plant kept beside a top-up plant. Gas turbines are added as firm plant.
9. **A plan check opens each run.** Can the plan be met at all? The earliest start of each building over every option, with the cause, before anything is ranked.
10. **The country's rules for data centres are listed with the run.** 30 rules in 16 jurisdictions, each with its status, date and source. A few are tested on each option. The research is in `docs/research/data-centre-rules-2026-11.md`.

## What the studies show now

Default weights (cost 35 %, carbon 25 %, delay 25 %, buildability 15 %). LCOE is the cost of each MWh over the period. The study files are not changed; these are fresh runs on the branch.

### One finding in every study

**Standby gensets cannot be ready for building 1.** With a 6-month permit, 15 months to buy and 6 to install, they are ready in April 2029. Building 1 is planned for January 2029. So every option with standby gensets starts building 1 three months late. To hold the date, the gensets would be ordered before their permit (at risk), which the tool does not model (known issue 42).

### Pego, 261 MW IT (9 buildings)

| Card | Option | LCOE €/MWh | Capex | Carbon g/kWh | Tier |
|---|---|---|---|---|---|
| 1 | Grid, with rented generation as a bridge that leaves | 94.6 | €345 m | 68 | B, 2 conditions |
| 2 | The same bridge, with own gas engines running as baseload | 108.1 | €622 m | 68 | B |
| 3 | Grid with units of the Elecgás plant bought | 113.5 | €460 m | 78 | B, 1 condition |
| 4 | The same bridge, with gas turbines | 113.2 | €775 m | 68 | B |
| 5 | The same bridge, with gas CHP | 115.9 | €744 m | 68 | B |

All nine buildings are powered. 270 of 5,625 options keep every planned date.

### Pego, 500 MW IT

| Card | Option | LCOE €/MWh | Capex | Carbon g/kWh | Tier |
|---|---|---|---|---|---|
| 1 | Grid, a rented bridge that leaves, own gas engines for the shortfall | 120.2 | €986 m | 143 | B |
| 2 | The same, with the engines running as baseload | 125.7 | €1,115 m | 143 | B |
| 3 | Grid with the Elecgás plant bought whole for the shortfall | 128.9 | €820 m | 165 | B, 1 condition |
| 4 | Grid, a rented bridge, gas CHP for the shortfall | 127.8 | €1,156 m | 150 | B |
| Step down | 222 MW IT (4 of 9 buildings): grid and a rented bridge that leaves | 95.7 | €309 m | 73 | B |

### Pego, 900 MW IT

| Card | Option | LCOE €/MWh | Capex | Carbon g/kWh | Tier |
|---|---|---|---|---|---|
| 1 | Grid, the Elecgás plant bought whole for the shortfall, own gas engines for what is left | 137.3 | €1,359 m | 225 | B, 5 conditions |
| 2 | The same with fuel cells for what is left | 144.3 | €1,659 m | 223 | B, 4 conditions |
| Stands on its own | Grid, a rented bridge that leaves, own gas engines for the shortfall (107 engines) | 157.5 | €2,030 m | 266 | B, 4 conditions |
| Step down | 800 MW IT (8 buildings): grid and the Elecgás plant bought whole | 132.9 | €1,102 m | 212 | B, 3 conditions |
| Step down | 200 MW IT (2 buildings): grid alone | 93.1 | €281 m | 71 | A |

The leader's five conditions: the agreement with the plant's owner and a direct line; an environmental impact assessment for 444 MW of heat in engines; a gas supply of 444 MW of heat not confirmed; no spare unit on the plant; Portugal's announced decree on gas-fired data centres. Before the rebuild the leader kept rented sets running for 20 years, at €140.7/MWh.

The study file holds the Elecgás plant twice: entered by hand (855 MW) and from the plant list (836 MW). The plan check now says so, and the cards treat them as one plant.

### Eemshaven, 750 MW IT (6 buildings; 10,000 options sampled of 275,430)

| Card | Option | LCOE €/MWh | Capex | Carbon g/kWh | Tier |
|---|---|---|---|---|---|
| 1 | Grid, by taking over the grid connection of the Eemshaven plant | 114.4 | €725 m | 145 | B, 2 conditions |
| 2 | A lease of the Eem plant as a bridge, and its grid connection taken over | 120.4 | €832 m | 150 | B, 2 conditions |
| 3 | Units of the Eem plant bought and partly kept; the Eem 131 MW connection taken over | 134.0 | €1,641 m | 158 | B, 3 conditions |
| 4 | The Eemshaven connection taken over, with own gas engines as baseload | 126.8 | €1,557 m | 144 | B, 5 conditions |
| Stands on its own | Grid, a rented bridge that leaves (46 months), own gas engines for the shortfall | 146.3 | €1,018 m | 178 | B, 4 conditions |

The new grid connection is not due until 2033. So every leading option rests on someone else's plant or connection. The leader's two conditions: the owner's agreement, with the month the connection comes free called a guess (the plant has no closure date); and the grid operator's agreement to an import right, because a plant's connection is a right to feed in.

## A fault found and fixed on the way

Known issue 40. Options that take over a grid connection were sometimes worked out on the grid of another option. At Eemshaven 859 options looked as if they could not serve their load. After the fix 40 remain, and those are right: an islanded campus on a plant that closes. The fault was only ever on this branch.

## What is not done

- No new-build combined-cycle plant, no dual-fuel engines, no plant outages, no flexible grid connection.
- Plant is never ordered before its consent.
- One firm plant per option.
- The user guide has no chapters for the rebuild yet.
- The Haiku and Opus verification rounds were not run. They need helper sessions, and the owner did not ask for them.
- The Windows program is not rebuilt yet. The phone page is no longer kept up to date (the owner, "Drop the phone build I don't care" (2026-11-12, 09:48 local)).

The full list: OPEN-QUESTIONS 255 and known issues 41 to 44.

## How to look at it

Open `energy-tool-single-file.html` from the `energy-strategy-tool` folder (GitHub → the file → download). It runs in any browser with no setup. The Options tab opens with the plan check, then the cards.

To compare with the tool as it was: in the inputs panel open "Run and dispatch settings", turn "Realism rebuild (11 November 2026)" off, and run again. The latest acceptable start is in section 6, "Requirements and priorities".

## Checks

- Node tests: 121 of 121. The 108 earlier tests run the engine as merged (rebuild off). Tests 67 to 79 are new.
- Browser checks: 44 of 44, run in four parts, also with the font of GitHub's runner. Check B44 is new.
- GitHub's checks passed on the branch before the merge.
