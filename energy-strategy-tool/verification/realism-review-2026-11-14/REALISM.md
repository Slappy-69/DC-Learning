# Are the tool's top options realistic? A review on three cases

14 November 2026. For the owner. Reviewer's view: an experienced European data centre developer and energy consultant, late 2026.

The tool was not changed. The engine used is a copy of `app/src` at `main` 3d34390, with the realism rebuild on and today's defaults. How each run was set up is at the end.

> **Public copy.** A third case, a real client brief, was reviewed too. Its section and its details are left out of this copy, as the owner asked on 2026-11-02 that study be kept offline; it is called "the private case" here. The full review is kept privately.

---

## Verdict

**Not yet. A developer could take one or two of each top five to a board, but not five.** The realism rebuild fixed the worst faults: rented sets kept for 20 years have gone, and the plan check and the named conditions are right and useful. But in every case at least two of the top five are options no developer would take forward: a small nuclear reactor the engineer never selected, scored "buildable, no conditions" (T1 and the private case); the same plant shown twice; baseload gas engines beside a grid that already carries the load; or a gigawatt of fuel cells. The answer a developer would pick is usually in the list, but often not on the cards. **How far off:** the engine's physics and costs are mostly sound. The faults are in what is generated, how options are grouped into cards, and how conditions and delay are weighed. Five targeted changes, none of them large, would make the top five credible for T1 and the private case. Pego also needs two concepts the tool lacks before its 900 MW top five mean much: using the gas plant's own grid connection, or contracting only the megawatts needed from it, and a flexible grid connection. Work package 36 corrects the equipment figures but fixes none of the five; it makes two of them worse.

---

## Case 1: T1 (built-in example, near Leamington Spa)

**Set-up:** 100 MW IT in four 25 MW buildings (2028-08 to 2031-08); grid 20 MW now, 120 MW from 2029-08; PUE 1.5 at peak, so a design load of 150 MW; PPA ticked; SMR, fuel cells and hydrogen not ticked. 6,170 options, all screened.

**Plan check:** building 1 starts nine months late in every option, because the standby gensets wait six months for a permit before they are ordered.

### Top five as ranked

| Card | Option | £/MWh | Capex | g/kWh | Tier | Judgement |
|---|---|---|---|---|---|---|
| 1 (#1) | Grid + 40 MW gas engines, called a "bridge" but ready in 2030-05 (after the grid), kept for the shortfall · HVO N+1 · PV 6.7 MWp · PPA | 175.5 | 128 m | 178 | B (permit for running plant, gas supply) | **Would build, as a fallback.** It closes the 30 MW gap between 150 MW of design load and 120 MW of grid. Buildable in Great Britain with a permit and an 89 MW (thermal) gas connection. Calling it a "bridge" misleads. |
| 2 (#9) | Grid · gas engines top-up 40 MW · the same | 176.7 | 128 m | 175 | B | **The same plant as card 1.** Two cards for one solution. |
| 3 (#89) | Grid · gas CHP-trigen top-up 36 MW | 181.0 | 138 m | 175 | B | Only with a heat customer, and T1 has none. A developer would not shortlist it. |
| 4 (#338) | Grid · gas engines 100 MW baseload | 178.9 | 176 m | 212 | B (adds a development consent order) | **No.** It runs 100 MW of engines for 20 years beside a 120 MW grid. Building 4 starts nine months late. |
| 5 (step down, #3708) | 75 MW IT: Grid · SMR 80 MW from 2037 | 152.1 | 659 m | 69 | **A** | **No.** SMR was not ticked. A private SMR on this timescale is not credible. Tier A is wrong. |

**Is the order sensible?** Cards 1 and 2 should be one card. Card 4 should not be above anything credible. Card 5 should not exist.

**What a developer would shortlist instead:**
1. Ask the network operator for 150 MW of import, or for the top 30 MW as a flexible (curtailable) connection. Then no gas is needed.
2. Phase building 4 to the grid: three buildings on 120 MW. That is 75 MW IT, tier A, £178/MWh, capex £73 m (#3709 in the list). The tool shows no card for it because its cost per MWh is not lower. A developer weighs cost per MW of IT and risk, not cost per MWh alone.
3. The gas top-up of cards 1 and 2 as the fallback, in high-speed 2–4.5 MW gensets (12–24 months), not 10 MW medium-speed units (deliveries in 2028–30).
4. Order the standby gensets at risk. In the check run (`t1-atrisk`), building 1 then starts in 2029-03, seven months late instead of nine. What remains comes from the 20 MW interim grid.

**Work package 36 (approximation, `wp36-t1`):** the same leaders, £185.6/MWh; building 1 now 14 months late, because standby procurement goes from 15 to 20 months. The SMR card stays.

---

## Case 2: Pego (Portugal, Abrantes), next to the Elecgás combined-cycle plant

**Set-up:** the saved study file as it is (`studies/pego-rev3/pego-product.study.json`). Nine 100 MW buildings, 2029-01 to 2035-01. Grid 400 MW from 2030-01. The Elecgás plant entered by hand (855 MW, two units) and also found in the plant list (836 MW). HVO standby, roof PV, hybrid PPA 50 %. 5,848 options, all screened. Design load about 1,368 MW, so roughly 970 MW must come from plant for 20 years.

**Plan check:** building 1 starts three months late in every option (standby gensets). It also says the plant is entered twice.

### 900 MW, top five as ranked (study lists)

| Card | Option | €/MWh | Capex | g/kWh | Tier | Judgement |
|---|---|---|---|---|---|---|
| 1 (#1) | Grid + 125 MW fuel cells (from 2028-06, kept) · Elecgás plant leased as top-up · HVO N+1 · PV 60 MWp | 147.2 | 1,424 m | 223 | B, 4 conditions (plant owner, gas supply, no spare unit, Portugal's announced decree) | **No.** It rests on the plant owner taking its whole station off the market for 20 years, with a direct-line licence. With one unit out the campus is 416 MW short, and the gap falls on the standby gensets, beyond their run-hour limits. 57 % of the energy is gas, which conflicts with the decree Portugal has announced. 125 MW of fuel cells has no European data centre reference: in October 2026 Bloom named no European deployment. Lenders would not fund this as it stands. |
| 2 (#3) | Grid + 140 MW gas engines (too late to bridge, kept) · Elecgás lease · HVO | 141.5 | 1,177 m | 225 | B, 5 conditions | **No, for the same reasons.** Medium-speed engines ordered now ship in 2028–30. |
| 3 (stands on its own, #109) | Grid · 1,065 MW fuel cells top-up · HVO | 180.0 | 4,251 m | 223 | B (gas supply 1,936 MW thermal, decree) | **No.** About half a year of Bloom's stated world output, on one European site with no reference. |
| 4 (step down, #2250) | 800 MW IT: Grid · Elecgás lease top-up · HVO | 137.7 | 940 m | 212 | B, 3 conditions | **The nearest to the consultant's plan.** The tool finds the rented bridge unnecessary. Credible only if the plant owner signs and the plant has a spare unit, which it does not. |
| 5 (step down, #3818) | 200 MW IT: grid alone · HVO | 93.1 | 281 m | 71 | **A** | **Would build.** This is the developer's base case. Building 1 is 12 months late (the grid comes in 2030-01), so a bridge is worth testing. |

**Default lists run (`pego-900d`): a fault.** The leader (#1, €139.2/MWh) buys the Elecgás plant twice: the plant-list entry (836 MW) as the bridge, and the entry made by hand (855 MW) as the top-up. That is about 1,690 MW from one 855 MW station. 1,464 options do this, including 98 of the top 100. The plan check spots the twin and the cards merge it, but the option generator does not stop it.

### 500 MW: the open case (OPEN-QUESTIONS 254 d)

Two readings were run. Both give the same leader type.

| Reading | #1 | €/MWh | Capex | Tier |
|---|---|---|---|---|
| Nine buildings of 55.6 MW (the review's `lowload.mjs`) | Rented gas bridge, 106 MW, removed when the grid comes · 400 MW own gas engines top-up from 2031-04 · HVO · PV 33 MWp | 120.2 | 986 m | B (environmental impact assessment, gas supply 1,168 MW thermal) |
| Five buildings of 100 MW | The same family (190 MW rented) | 123.4 | 972 m | B |

The other cards (nine-building reading): #11 the same with 530 MW of engines run as baseload (€125.7); #42 396 MW of fuel cells (€139.6); #58 400 MW of engines "kept from the bridge" (€121.8, physically the same as #1); and a step down to 222 MW, grid alone, tier A (€92.8). In the five-building reading, card 4 is **the Elecgás plant leased as top-up: €135.1/MWh, one condition (the owner's agreement) and no outage problem**, because the grid plus one unit covers the design load.

**My reading of 254 (d).** Do not make it a study yet. At 500 MW the grid carries about 260 MW of IT. The rest rests on 400 MW of new gas engines for 20 years, an asset with no European data centre precedent at that size. The 106–190 MW rented bridge is five to ten times the largest European data centre rental bridges on record (14–20 MW in Dublin). If it becomes a study, use the five-building reading (100 MW halls are the product), and model the Elecgás plant as a supply contract for the 300–400 MW needed, not a lease of all 855 MW. That route is the one a developer would chase. Today it loses only because the lease charges for the whole plant at a judgement rate of €6/kW a month.

### What a developer would shortlist at Pego

1. **Phase 1 sized to the grid:** two to three buildings on 400 MW (the 261 MW reading: grid alone, tier A, €92.9/MWh, from `docs/REALISM-REBUILD-2026-11-11.md`). Add a rented bridge for building 1, sized on its ramp.
2. **Phase 2 by contract, not by building plant:** a supply contract with Elecgás over a direct line, for the MW needed. The other option is using the plant's own 400 kV connection: the campus takes power through it when the plant is off. Either way, the plant must have N+1 or the grid must back it up.
3. **Win more grid.** Under Portugal's National Data Centre Plan, grid capacity for a data centre is won through a special procedure with a deposit, not simply requested (`docs/research/data-centre-rules-2026-11.md`). The full 900 MW should depend on that, not on a gigawatt of on-site gas.

**Work package 36 (approximation):** 900 MW leader €156.3/MWh, with the fuel cells now from month 9, because WP36 makes fuel cells faster. 500 MW leader €133.3/MWh, with the engines arriving in 2032-07 instead of 2031-04. Same families.

---

## Root causes across the cases

Ordered by how much they distort the top five. For each: the evidence, where it sits in the code, whether work package 36 (WP36) fixes it, and a decision for you.

### 1. Archetypes ignore the engineer's selection, and an SMR passes every buildability test

- **Evidence.** T1: the SMR step-down card, with SMR not ticked. The private case shows the same, including a PPA option generated with "include PPA" off. The SMR has no condition at all, so it is tier A. Its cost is a "built many times" figure (€8,000/kW). The tool's own note says Ontario's first units suggest much more.
- **Where.** `app/src/engine/generator.js` lines 167–181 (`ARCHETYPES`, including A2/A7/A9 with a PPA, A8 fuel cells, A10a SMR, A10b hydrogen) and 396–411 (`archetypeVector` takes the archetype's values directly; there is no tick check, unlike `applyTicks` in `defaults.js` lines 294–305). `defaults.js` lines 443–446 (SMR: `ownConsent: true`, maturity "Nascent" not used anywhere) and 1002 (the cost note). `buildability.js` lines 87–104: consent tests cover combustion plant only, and there is no test for nuclear plant or for nascent technology.
- **WP36:** no. The SMR is unchanged. Fuel cells get a "Europe untested" flag only.
- **Decision for you.**
  - (a) Archetypes obey the ticks: no PPA archetype unless the PPA is ticked, no SMR, fuel-cell or hydrogen archetype unless ticked. **Recommended.**
  - (b) Keep the archetypes for reference, but label them "not selected" and keep them off the cards.
  - Separately, for nascent technology: (i) tier C before a first year the engineer enters; or (ii) tier B, with the consents named (for an SMR in Great Britain: design assessment, nuclear site licence, development consent order) and a first-of-a-kind cost.

### 2. The cards hide the bridging decision, and show one plant twice

- **Evidence.** A strategy is the permanent supply. A bridge that leaves is a "variant" of waiting, so the card shows whichever ranks better, usually waiting. In the private case the consultant's recommended bridge is on no card, even with root cause 1 removed. In T1, cards 1 and 2 are the same 40 MW of engines, keyed once as "kept bridge" and once as "top-up".
- **Where.** `app/src/engine/cards.js` lines 11–29 (`supplyKey`: a bridge that leaves is dropped from the key; a kept bridge and a top-up are keyed differently) and 172–179 (filling the cards).
- **WP36:** no.
- **Decision for you.**
  - (a) One card per strategy, with two lines: "wait" and "best bridge", each with its start dates and cost. **Recommended:** it answers the developer's usual question on one card.
  - (b) A bridge that moves a start date becomes its own strategy.
  - Either way: a kept bridge and a top-up of the same technology count as one strategy.

### 3. A month of delay has no money value, and it is diluted

- **Evidence.** Delay is the average months late over all the planned IT, scored from 0 to 24 months, at 25 % weight. A few months late on one building of a large campus costs about 1 point. Three conditions on a bridge cost about 2.7. So waiting beats a bridge almost always. In the private case the result flips only when the latest acceptable start is set to 3 months. At Pego (261 MW reading), waiting 12 months beats a rented bridge by €1.7/MWh (`docs/REALISM-REBUILD-2026-11-11.md`). A developer counts lost rent, and the tenant's late-delivery penalties, in money.
- **Where.** `app/src/engine/evaluate.js` line 88 (`metric: en.avgLate + …`); `scoring.js` lines 66–70 (fixed 0–24 month scale); `docs/BUILD-PLAN.md` line 358 ("lost rent and delay penalties" not chosen, 2026-11-02).
- **WP36:** no. Worse: the €42/kW-month rental makes bridges dearer, while delay stays nearly free.
- **Decision for you.**
  - (a) Add an input "value of a delayed MW of IT per month" (lost rent), blank by default. When filled, it becomes its own line in the yearly ledger and the cost axis. When blank, the tool states each bridge's break-even rent. **Recommended.**
  - (b) Score delay in MW-months against a shorter scale (for example, six months).
  - (c) Leave the scoring, but ask for the latest acceptable start in the first-run box. The answer depends on it.

### 4. "Powers the most IT" ranks above how buildable an option is, and tier B is too wide

- **Evidence.** Pego 900 MW: every leading card is tier B with four or five conditions. Among them: another owner's whole plant, no spare unit (416 MW short with one unit out) and a clash with a decree Portugal has announced. A tier A phased plan appears only as a step-down card. Pego 500 MW: 400 MW of new gas engines is tier B. One small condition and five decisive ones get the same tier.
- **Where.** `app/src/engine/scoring.js` lines 102–118 (group order: adequate, tier not C, resilient, **most IT**, on time, then score). `buildability.js` line 187 (any condition gives tier B) and lines 146–153 (no spare unit is a condition only; known issue 44). 6 points a condition (`defaults.js` line 1328).
- **WP36:** no.
- **Decision for you.**
  - (a) Name "gating" conditions that make an option tier C until resolved. They would be: another owner's plant carrying a large share of the design load, not yet agreed; no spare unit when one unit out leaves the campus short; a clash with a country rule. Work package 35 already re-runs an option when its condition is ticked as resolved. **Recommended.**
  - (b) A "B with three or more conditions" group, ranked below tier B.
  - (c) Let the engineer choose the order: "most IT first" (today) or "most buildable first".

### 5. Plant is never ordered at risk, so every option starts late for the same reason

- **Evidence.** In every plan check, the standby gensets wait six months for a permit before they are ordered. T1 building 1 is nine months late; Pego building 1 three months. With WP36's 20-month lead time: 14 and 8 months. The tool itself lists the standby permit as a "standard" consent. Developers reserve factory slots and order standby sets before the permit. With ordering at risk (`t1-atrisk`, a proxy that removes the wait for all permitted plant), T1 building 1 starts two months earlier.
- **Where.** `app/src/engine/sizing.js` lines 495, 600, 608–614; `programme.js` line 40; known issue 42; `buildability.js` line 181 (standby permit counted as standard).
- **WP36:** no. Worse: the longer standby lead time.
- **Decision for you.**
  - (a) Standby gensets ordered at risk by default (the permit runs alongside), with the money at risk shown. **Recommended.**
  - (b) An "order at risk" tick for each plant.
  - (c) Keep it, but show it only in the plan check, not in each option's delay.

### 6. Options no developer would build are still generated

- **Evidence.** (i) The same plant bought twice: Pego with default lists, 1,464 options including the #1. (ii) Baseload own gas beside a grid that already covers the design load: T1 card 4, and the private case. (iii) A "bridge" that arrives after the grid and is kept for the shortfall: really a top-up, named as a bridge (T1 card 1, Pego cards 1 and 2: "too late to bridge").
- **Where.** `app/src/engine/generator.js` lines 153–161 (rules R1–R3; there is no twin-plant rule). The twin is known in sizing (`plantTwin`) but used only by the cards (`cards.js` line 25). Baseload sizing is the `C4s` "average" choice (`defaults.js` lines 219–221).
- **WP36:** no.
- **Decision for you.**
  - (a) New generation rules: no plant and its twin in two roles; no baseload firm plant where the grid alone covers the steady-state design load; a bridge that arrives after the grid is renamed "top-up" or not generated. **Recommended.**
  - (b) Keep generating them, but rank them below the rest and say why.

### 7. Concepts a developer would use are missing or unused

- **Missing:**
  - a flexible (non-firm) grid connection: the grid always counts as firm (OPEN-QUESTIONS 255);
  - using an *operating* plant's grid connection: only takeover of a *closing* plant's connection exists;
  - demand-side measures: a lower design PUE, an IT cap per hall, or standby sets used for peak lopping within their run-hour limits;
  - energy centre as a service (on the list since 2026-11-02);
  - a check of rental fleet depth: `buildability.js` lines 106–112 test how long sets are rented, not how many. Pego rents 106–190 MW against a European record of about 20 MW;
  - a European reference test for large fuel-cell plants.
- **Present but unused in the cases:** stepped grid capacity (`grid.steps`, which can model an interim or early partial energisation); contracting below the grid offer (`grid.contractWaitMW`, `contractBridgeMW`); a supply contract for a nearby plant (work package 29).
- **Smaller faults:**
  - A temporary bridge's land is counted as permanent, so a short rental can tip a tight site over and add a condition (`sizing.js` line 732; seen in the private case).
  - A leased plant is charged for every MW, even when a third of it is used.
- **WP36:** adds the high-speed engine class (useful for fast top-ups and bridges), the combined-cycle class, and the SCR and step-load flags. It adds none of the concepts above.
- **Decision for you:** which concept comes first.
  - (a) The flexible grid connection. **Recommended for T1 and the private case.**
  - (b) An operating plant's connection used by the campus, plus supply contracts sized to the MW needed. **Recommended for Pego.**
  - (c) Rental-depth and fuel-cell reference conditions: small, and could go into WP36.

### 8. Defaults: WP36 fixes most, but not all

- **WP36 fixes:**
  - gas engines too cheap and too fast (€900 to €1,650/kW; medium-speed 21 to 48 months);
  - standby sets 15 to 20 months;
  - rental €12 to €42/kW-month (a proxy that likely overstates module rental);
  - batteries;
  - turbines.
- **WP36 leaves or worsens:**
  - SMR cost and timing unchanged;
  - fuel cells made faster (6 + 3 months) and smaller in unit size, so they become the quickest owned plant. In the WP36 approximation they are the Pego "bridge" from month 9. The research says European time to power should follow gas-connection and permit timelines, not US claims (`docs/research/generation-equipment-2026-11.md`, "Europe remains untested").
- **Decision for you.**
  - (a) Add a European delivery allowance for fuel cells, and a first-of-a-kind SMR cost, to WP36 before it is built. **Recommended.**
  - (b) Build WP36 as approved and treat these under root cause 1.

### What WP36 fixes, and what needs something new

| Root cause | Fixed by WP36? | Needs |
|---|---|---|
| 1 Archetypes and SMR | No (fuel cells: flag only) | Generator and buildability change |
| 2 Cards | No | Cards change |
| 3 Value of delay | No; worse with the €42 rent | New input and a ledger line, or a new scale |
| 4 Ranking order and tier width | No | Ranking and tier rules |
| 5 Ordering at risk | No; worse with 20-month standby | Programme change (known issue 42) |
| 6 Unrealistic options generated | No | Generation rules, and the twin-plant fault fixed |
| 7 Missing concepts | Partly (high-speed engines) | New features |
| 8 Defaults | Mostly | Two additions to WP36 |

---

## How each run was set up

- **Engine:** `/home/claude/fable-realism/src`, a copy of `app/src` at `main` 3d34390 (checked: identical). Realism rebuild on, today's defaults, latest acceptable start 24 months unless stated. Every combination screened (below 20,000). Default weights. Pounds at the tool's rate (0.8377).
- **Scripts** (all in `/home/claude/fable-realism/`; results in `out/`):
  - `lib.mjs`: shared report writer (cards, plan check, top 20, compact JSON of every option). By the earlier reviewer.
  - `t1.mjs`: T1 exactly as the page opens it (`referenceT1()`, analysis start 2027-02) → `out/t1.*`.
  - `pego.mjs 900 | 500 | 500x5 [d]`: the saved Pego study file. `500` = nine buildings of 55.6 MW (the review's reading); `500x5` = the first five 100 MW buildings. `d` = bridging and firm-plant lists left to today's defaults → `out/pego-900*`, `pego-500*`.
  - `wp36.mjs t1 | pego900 | pego500`: WP36's approved figures put on today's classes in memory. The new classes are not added, so it is an approximation → `out/wp36-*`.
  - `groups.mjs <tag> [fx]`: the best-ranked option of each family.
  - `run.mjs <case> [noarch] [atrisk] [late=N] [dflt]`: the shared runner, written in this session. `noarch` filters archetypes by the ticks in memory; `atrisk` sets the permitting allowance to 0 (a proxy for ordering at risk, applied to all permitted plant) → `out/t1-atrisk.*`.
- **Run times:** 11–53 s each in Node 22 (Pego with default lists needs about 8 GB of memory).
- **Not run:** Pego 261 MW (its figures above are from `docs/REALISM-REBUILD-2026-11-11.md`). `out/pego-500d.log` is an empty, stopped run by the earlier reviewer.
- **Nothing changed** in `/home/claude/dc-learning`. No commit, push or publication.
