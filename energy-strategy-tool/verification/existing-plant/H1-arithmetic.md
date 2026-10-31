# H1: arithmetic check of the existing gas plant package (work package 19)

**Counts: 119 VERIFIED, 0 FAILED, 1 NOT VERIFIABLE** (120 checks in total; the not-verifiable item is the reserve battery energy, see below).

Checked by: Haiku verifier, 2026-10-31, branch `feature/existing-plant` (worktree `/home/claude/eplant`). No source, test or record file was edited. The check script is at `/tmp/h1/h1-check.mjs` (outside the repository).

## How the check was made

- Inputs come from the test fixture `eemSmall()` in `app/tests/plants-tests.mjs` (100 MW IT in two 50 MW phases, from 2029-01 and 2030-01; 0 MW grid until 2033-01, then 130 MW; 20-year period; WACC and contingency as in the defaults).
- Plant data come from the raw list rows in `app/src/data/gas-plants.js`. Defaults come from `PLANT_DEFAULTS`, `EXISTING_TYPES` and `TECH.substation.p`.
- Every plant value, the demand, the shortfall, the takeover size and month, the grid offered per month, the lease and purchase months, the O&M and the capex were recomputed in the script from the rules in OPEN-QUESTIONS 119–122 and the BUILD-NOTES, not taken from the engine.
- The engine was then run with `evaluateOption` (skip layout) and `ctxFor`, and the two were compared.
- One input was taken from the engine and not recomputed: the peak PUE of the evaporative cooling profile (1.2753). It comes from the weather profile, which cannot be checked by hand. Demand, need and everything after it were recomputed from that figure.
- The email address, memory and other project files were not used.

## Key inputs (recomputed)

| Item | Value | Source |
|---|---|---|
| Analysis start | 2027-01 (month 0) | fixture |
| Campus demand | 100 MW IT; 50 MW from month 24 (2029-01), 50 MW from month 36 (2030-01); 25 % start, 12-month ramp | fixture; ramp formula as `itInstalledByMonth` |
| Design need | 100 × (1.2753 + 0.02) = **129.53 MW** | peak PUE from engine; ancillary 2 % (default) |
| Grid offered | 0 MW to month 72 (2033-01), then 130 MW | fixture |
| Eem (`ppm757`), CCGT, 3,210 MW | 8 units × 401.25 MW; list efficiency 32.3 % is outside the CCGT range, so 56 % (type) | list row; `EXISTING_TYPES.ccgt` |
| Eem closure | list date 2030 → month 36 (2030-01); takeover month 48 | `dateOut` 2030; +12 months |
| Eemshaven (`ppm11959`), CCGT, 1,410 MW | 4 units × 352.5 MW; list efficiency 24.3 % outside range, so 56 %; closed by the 40-year default (1976 + 40 = 2016); takeover month 12 | list row; `lifeYears` |
| Distance Eem / Eemshaven | 2.559 km / 1.921 km (haversine, Earth radius 6371.0088 km as in `weather.js`) | list coordinates, site pin |
| Lease | €6/kW/month | `leasePerKWMonth` |
| Purchase + refurbishment | €150 + €100 = €250/kW; life extended 10 years (bought Eem stops month 156, 2040-01) | `buyPerKW`, `refurbPerKW`, `buyExtraYears` |
| Fixed O&M (bought) | €25/kW/yr | `fomPerKW` |
| Connection to campus | km × €1.5 m/km: Eem €3,837,890 | `cablePerKm` |
| Takeover | MW = min(plant output, design need) = 129.53 MW; cost €30,000/MW (0.25 × €120,000/MW) = €3,885,791 | `takeoverCostFrac`, `connCapexPerMW_ehv` |

## Candidate table (engine against the recomputation)

All 36 checks passed: units, unit size, efficiency, closure year and month, status, distance, offers power and takeover, takeover month, and connection cost for the four list entries (Eem 3,210 MW; Eemshaven 1,410 MW; Magnum Centrale 1,311 MW; Eem steam 131 MW). The engine's and the script's distances agree to 1e-6 km once the same Earth radius is used. The first run used 6371 km and differed by about €5 on a connection cost; the difference was in the script, not the engine.

## Results by option

Each figure below is the engine's value and matches the recomputation.

### (a) Eem bought as bridging, retained as prime (C1 bridge, C2 xb:Eem, C3 prime)

- Units used: 1 of 8 (401.25 MW), because the shortfall before handover is 129.53 MW (VERIFIED).
- Purchase + refurbishment capex: **€100,312,500**, booked in year 0 (VERIFIED).
- Connection to campus: €3,837,890 in year 0 (VERIFIED).
- Fixed O&M: **€10,031,250 a year** in years 0–12, then nothing (VERIFIED). Plus the reserve battery O&M (see below).
- No lease (VERIFIED: no rental in any year).
- Plant stops at month 156 (2040-01); ledger removal year 13 (VERIFIED).
- Bridging hands over at month 72 (VERIFIED).
- LCOE from the ledger, recomputed: **€222.95/MWh**, equal to `eco.lcoe` (VERIFIED). NPV cost and PV energy also match (see the ledger section).
- Flags: plant-values (info), plant-closes (minor), plant-ownership (minor), as expected (VERIFIED).

### (b) Eem leased as bridging, retained as prime (C2 xl:Eem, C3 prime)

- Units used: 1 (401.25 MW) (VERIFIED).
- Hire starts month 23 (2028-12): the first shortfall month is 24, less `rentalLeadMonths` = 1. This is the lease rule in `sizing.js` (VERIFIED).
- Stops month 36 (closure) (VERIFIED).
- Lease months: 13 (months 23 to 35) (VERIFIED).
- Lease per month: **€2,407,500** (401.25 MW × 1,000 × €6/kW).
- Lease by year: year 1 €2,407,500; year 2 €28,890,000; total **€31,297,500** (VERIFIED).
- No purchase, no fixed O&M for the leased plant (VERIFIED).
- LCOE: €181.04/MWh (engine; not recomputed by hand beyond the ledger check).
- Flags: plant-values and plant-closes only; the adequacy flags (adequacy-short, grid-binding) are raised because the campus is unserved from month 36 to 72 (see observations).

### (c) Gas recips bridging, takeover of the closed Eemshaven connection (C2 gasRecip, C21 tk:Eemshaven)

- Takeover month: 12 (VERIFIED). The plant closed by the 40-year default; the 12-month lag is counted from the analysis start because the closure date is already past (VERIFIED).
- Takeover MW: **129.53 MW** (capped at need, not the 1,410 MW output) (VERIFIED).
- Takeover capex: **€3,885,791** in year 1 (VERIFIED).
- Grid offered: 129.53 MW from month 12 (VERIFIED for every month). From month 72 it is 259.53 MW (see observations).
- Bridging hands over at month 12 (VERIFIED).
- No bridging plant is sized: no shortfall before month 12, and the first load is month 24 (VERIFIED). The option therefore has no gas recips at all; its label says "gas recips" but the engine does not size them.
- LCOE: €147.39/MWh (engine).
- Flag: plant-takeover, major (VERIFIED).

### (d) Eem leased as bridging, takeover of its own connection (C2 xl:Eem, C3 remove, C21 tk:Eem)

- Units used: 1 (401.25 MW) (VERIFIED).
- Hire starts month 23 (VERIFIED, same rule as (b)).
- Shortfall before handover: 125.48 MW, at month 47 (VERIFIED).
- Takeover month: 48 (closure 36 + 12). The lease ends at 48 as well, so the plant runs until its connection is ready (VERIFIED).
- Lease months: 25 (23 to 47) (VERIFIED).
- Lease by year: year 1 €2,407,500; years 2 and 3 €28,890,000 each; total **€60,187,500** (VERIFIED).
- Takeover MW: 129.53 MW; takeover capex **€3,885,791** in year 4 (VERIFIED).
- Bridging hands over at month 48 (VERIFIED).
- Grid offered: 129.53 MW from month 48; 259.53 MW from month 72 (VERIFIED).
- LCOE: €184.93/MWh (engine).
- Flags: plant-values, plant-closes ("keeps it running until then"), plant-takeover (major) (VERIFIED).

## Ledger and LCOE (option a)

- The ledger capex equals the sum of the capex lines (€179,787,059) (VERIFIED). Ledger contingency equals capex × 10 % (VERIFIED).
- LCOE recomputed from the ledger rows (capex + contingency + replacement + residual for capex; the opex sum for opex; delivered MWh for energy, using the formula in `evaluate.js`): **€222.9497/MWh**, equal to `eco.lcoe` (VERIFIED).
- NPV cost recomputed: €1,447,241,032, equal to `eco.npvCost` (VERIFIED).
- PV energy recomputed: 6,491,333 MWh, equal to `eco.reconciliation.pvEnergy` (VERIFIED).
- LCOE × PV energy equals NPV cost (VERIFIED).

## Fixed O&M run (option a with backup none)

The UPS resilience reserve battery is on in every option by default. Its O&M (1 % a year of 8.33 MWh × €500/kWh, times the IT share of the year) is outside the plant.

- Year 0 fixed O&M equals the plant alone: €10,031,250 (VERIFIED).
- Each year from 0 to 19 equals plant O&M plus the reserve battery O&M, to the euro (VERIFIED).
- After the plant stops (year 13), only the reserve battery remains: €41,667 a year (VERIFIED).
- Not verifiable: the reserve battery's energy (8.33 MWh) and its IT-share scaling come from the engine (see below).

## First run: expectations I got wrong (corrected, not engine faults)

My first run gave 18 failures. Each one was a mistake in my expected values, and the engine was right each time.

1. Earth radius: I used 6371 km; the engine uses 6371.0088 km (`weather.js`). This gave about €5 on each connection cost and a 1e-6 difference in distance.
2. Lease start: I started leases at month 0. The engine hires a leased plant `rentalLeadMonths` (1) before the first shortfall month (24), so from month 23.
3. O&M: I left out the reserve battery's O&M. Once it was included, every year matched.
4. Two checks compared a value with itself (a lease month count and a removal year) and gave no evidence. I replaced them with independent comparisons.

## Not verifiable

- Peak PUE (1.2753) of the evaporative cooling profile: comes from the weather profile, not recomputed. The design need, the shortfall and every later figure are checked against it.
- Reserve battery energy (8.33 MWh) and its IT-share scaling: from the engine's `sz.reserve`, not recomputed.

## Observations for the owner (not arithmetic failures)

These follow the rules as written, but the decision records do not settle them. Each needs an owner's answer, not a fix.

1. **The takeover stacks on the new connection (options c and d).** After 2033 the offered grid is 259.53 MW (130 MW new plus 129.53 MW taken over) against a need of 129.53 MW. Each takeover is capped at the campus need, but nothing caps the total. The new 130 MW connection is still built and paid for (substation €10.4m, in year 1 in (c) and year 4 in (d)). Question for the owner: should a takeover replace the new connection's cost, or sit on top of it?
2. **The new substation moves earlier with the takeover (option d).** The engine books the substation in the year of the handover (year 4), not at the full grid date (year 6), because the handover month moves the "full grid" year forward. This is an effect of the handover rule, not a separate decision.
3. **A bought plant costs O&M and capex before the campus needs it (option a).** The purchase is booked in year 0 and O&M runs from year 0. The first load is in year 2, so about €20.1m of fixed O&M (undiscounted) is booked in years 0 and 1 with no load. The decision records do not say when a plant is bought; the owner should confirm the purchase date (for example, at first need).
4. **A leased plant can stop before the grid arrives (option b).** The lease ends at closure (month 36, 2030); the grid does not arrive until month 72. The sizing covers the shortfall before the grid date and ignores when the plant stops. The campus is then unserved for 36 months. The engine flags this (adequacy-short and grid-binding raised as major; time-to-power gap of 36 months), so it is not hidden, but the sizing does not avoid it. This matches the earlier note in the BUILD-NOTES on bridging sized to the shortfall.
5. **Option (c) has no gas recips.** The takeover hands over at month 12, before the first load (month 24), so no bridging plant is needed. The option name says "gas recips", but none are sized.
6. **Eemshaven's 1976 entry.** Its closure (2016) comes from the 40-year default, and its connection is offered from month 12 (2028). BUILD-NOTES already flags that this entry may be an older listing of Eemscentrale.
7. **Plausibility ranges.** The efficiency ranges used to reject a list value (CCGT 45–63 %, steam 30–45 %) are in the source (`defaults.js`) but not in the decision records. The owner should confirm them or add them to OPEN-QUESTIONS 121.

## Records

- Nothing was written to the repository except this report. `verification/HISTORY.md` is not updated; the main session should add the line.
