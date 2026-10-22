<!-- Copied word for word from the owner's Claude project ("Energy Strategy", document claude/walkthrough-decisions-2026-10-21.md) on 2026-10-21, so the repository holds the decision record. If the two copies ever differ, ask the owner which is current. -->

# Walkthrough decisions: concept-design energy strategy tool (2026-10-21)

Record of the user-workflow walkthrough, decision by decision. Items marked "research" go on the defaults register and must be checked before release. Items marked "judgement" are labelled as such in the app.

## Audience and principles
- Audience: data centre consultancies in general, not RED specifically. Repo stays public.
- The app must allow different levels and types of initial knowledge. Some inputs are always known (location, site area), some sometimes (grid availability, desired IT load), and some often unknown. Every input has a default, and any input the engineer leaves unset runs on that default.
- Every value not entered by the user is flagged on each option that uses it, with its source listed per option (not only in the run summary).
- Constraints are flagged, not enforced.

## Site and location
- Location is set by a map pin. The map is bundled offline (Protomaps PMTiles, all of Europe, roads detail) so the Windows program stays network-free. Licence and file size still to check.
- Phone version dropped.
- Country drives built-in profiles. Prices and profiles from ENTSO-E, with published sources (Ember, World Bank, Eurostat) as options.
- Grid availability and connection time default to country-level values, labelled indicative (research). If unknown, the tool runs with that stated assumption, and the assumption is flagged.
- Site area stays as a single number. Site layout, planning constraints (setback, height, roads share) and boundary import are out of the main flow.
- The existing Site tab is kept as a Beta feature: hidden by default, turned on in the app's general settings, labelled Beta, and kept out of the ranking and the PDF export.
- Climate: nearest ASHRAE station is flagged. PUE uses that station's design temperatures. Historical weather from NOAA (raw hourly data, cleaned by the app) or an EPW file (engineer downloads and uploads). ASHRAE data licence to check (research).

## Demand
- IT load: if unknown, estimated from floor area. Single storey (judgement). Site coverage 35% (judgement, research). IT density benchmark from one three-storey campus (Stack Erskine Park: 450 MW "operational capacity", 82,020 m² floor area, 7.7 ha) (research). The article does not say whether 450 MW is IT or facility load, so the benchmark depends on which it is. Engineer can override IT load independently of area.
- Bridging period: known or unknown, both supported.
- Load shape: fully customisable. Flat % of IT load, fluctuation profiles, AI training/inference profile with editable defaults shown when AI is selected. The hourly model cannot show sub-hour training swings (caveat).
- Flexibility: off by default. Parameters: max curtailable %, max hours per year, trigger (price, carbon, or weather/grid stress), trigger level, duration per event, notice time, recovery period, cost of curtailment. Historical analysis covers both price and carbon triggers (data: ENTSO-E prices; weather: research).
- Battery response: batteries can run the site during trigger hours instead of curtailing. The tool sizes the battery to cover historical trigger hours by default; engineer can change it.
- Battery size and trigger threshold trade off. The engineer chooses which is held fixed (or a target hours covered). Battery capex flows into finance.
- Batteries split into two: resilience reserve (always kept; default 5-minute UPS) and economic battery (flexibility, arbitrage, carbon). Longer battery autonomy available site-wide.

## Requirements
- Resilience target default: N+1, 100% of IT load backed. Autonomy from on-site fuel/generation, BESS, or a combination (engineer chooses).
- Weights default Cost 35 / Carbon 25 / Time-to-power 25 / Deliverability 15. Provisionally accepted. Impact of each weight change described live. Repaint target relaxed from 100 ms (accepted).
- Backup gensets included by default. Test running: 6 h/yr per generator (replaces brief's 12). Test load 75%, a separate editable input. Gensets can also run as primary power for a set number of hours per year, dispatched and costed.

## Economics
- Cooling type always chosen by engineer. Typical PUE and maximum demand offered per cooling type, editable.
- Evaluation period: multiple options (e.g. 10, 15, 20 years).
- WACC 7% real (judgement, research). WACC is the blended rate of return investors require, used here as the discount rate.
- Carbon price: latest EU ETS market price, date shown (research for source).
- Escalation: published forecast per commodity (electricity, gas, carbon), overridable (research for sources).
- Revenue options (battery arbitrage/grid services, waste-heat reuse): off by default.
- Grid connection capex and reinforcement: default 0, country typical value shown with reference, manual override. Flagged as assumed on every option that uses the default (research for country values).
- Grid connection charge is a fixed amount, the same for every option regardless of the grid capacity that option contracts (decided 2026-10-21).
- Gas price: latest published wholesale price with date. Default is a free monthly source (research). Engineer can override with a current quote.
- Currency: per site, from a fixed list, exchange rates fixed at each release.

## Grid capacity
- Each option has its own contracted grid capacity, set by the engineer (decided 2026-10-21). Options can therefore contract less than the full grid offer.

## PPA and carbon rules (from the 2026-10-18 and 2026-10-21 debates)
- No PPA income without physical delivery (owner decision 2026-10-18; implemented and verified).
- O1, PPA that cannot be delivered (no grid, islanded): flag it and prefer the no-PPA option (owner decision 2026-10-21). Code change not yet made.
- O2, carbon-free energy score: hourly matching (PPA counted only against grid energy used in that hour) (owner decision 2026-10-21). Code change not yet made.
- O3, `grid-ppa` flag: two separate flags, one for grid limits and one for other PPA limits. Each flag shows its calculated share of undelivered PPA volume (decided 2026-10-21, recommendation accepted). Code change not yet made.
- Open decision 1 (no-backup option): "Does not meet" stays as the default.
- Open decision 2 (contracting less than the full grid offer): decided 2026-10-21. Each option has its own contracted grid capacity, set by the engineer. The grid connection charge is fixed across options (see Economics).

## Results
- First screen: top 5 options. Each card: overall score, sub-scores, LCOE, carbon intensity, resilience, capex, main flags, assumed-default flags with sources, and up to 3 pros and 3 cons.
- Pros and cons are judged against the other options in the run ("n/a" if fewer). Each card says what it is compared against (for example "lowest of the 5 shown"), because a pro or con can change when the set of options changes.
- Trade-off chart: cost (vertical) against carbon (horizontal) by default, resilience as bubble size and colour. Either axis can be switched (e.g. to time-to-power or deliverability).
- Dispatch: any period of the year. Arbitrary-day views are available only for the verified top options (full 8,760-hour model); the screening run uses representative days.
- Compare: up to 3 options side by side. Option deep-dive card per option.
- Tornado: tick-box list of drivers (brief's seven: gas price, grid price, WACC, carbon price, capex, capacity factors, grid connection date, plus additions such as IT load, PUE, battery capex, grid connection capex, evaluation period, escalation, flexibility trigger, generator test hours). Default result measured: LCOE; other results selectable.
- Export: a single PDF, inputs first, results after. No Excel export.

## Open research before first release (all items labelled judgement or indicative until checked)
- Site coverage 35%; IT density benchmark (single data point); storey assumption; whether the benchmark is IT or facility load.
- Grid availability and connection time, country by country; grid connection capex country values.
- Escalation forecast sources; EU ETS price; wholesale gas source and its terms.
- ASHRAE station data licence for redistribution.
- Protomaps and OpenStreetMap licence and attribution terms; map file size at roads level.
- NOAA hourly data cleaning into a usable year.
- Deliverability penalties and the other judgement values in BRIEF/ASSUMPTIONS.
- Run speed and the representative-day tier (the brief's speed targets).

## Repo state
- STATUS.md update is on `main` (commit 441635e), recording the scope change. Checks were running at the time of writing; the previous `main` passed.
- The Site tab, layout, fit and GIS import in the repo are built and verified. Keeping them as Beta means no removal work; they still need the Beta label, the general-settings toggle, and exclusion from the ranking and the PDF export.
- The phone artifact is dropped.
- Run time: the owner's figure is 15–20 s for 2,000 options (confirmed 2026-10-21). STATUS.md still says 9–10 s and needs correcting at the next repo update.
