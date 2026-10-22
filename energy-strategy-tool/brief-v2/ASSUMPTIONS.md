# Assumptions

Each assumption was made because the goal did not specify it. Review and mark each as accept / change. IDs are referenced in `OPEN-QUESTIONS.md`.

None of the numeric defaults below has a verified source. All are indicative — unverified until the builder fills the source record (BRIEF §18).

**Walkthrough, 2026-10-21.** The owner's walkthrough changed or answered several assumptions; each change is noted in its row, and M25–M33 are new. Where a row and `../docs/walkthrough-decisions-2026-10-21.md` disagree, the decision log is newer.

## Product and users

| ID | Assumption | Where used | Impact if wrong |
|---|---|---|---|
| P1 | The primary user is a senior MEP/energy engineer running live client workshops; strategy leads and investors see summaries and exports. Walkthrough, 2026-10-21: engineers at data centre consultancies in general, not one firm; the repository stays public | BRIEF §1.3, §16 | UX depth and presentation mode |
| P2 | Geography stays Europe (EU-27, UK, Norway, Switzerland, Iceland), as in v1 | §5.1, §18 | Data scope; non-European sites only via custom uploads |
| P3 | One site per session; no portfolio comparison; no accounts or cloud | §1.4, §22 | Architecture stays client-side |
| P4 | **Changed (Walkthrough, 2026-10-21):** a Windows program (Electron) that makes no network connection, with data prepared at each release and bundled; the single HTML file stays for testing; the phone version is dropped. Before: a client-side web app (React + TypeScript), static hosting, works offline after load | §4 | Performance budget and data shipping; program size with the bundled map |
| P5 | "Podium/Forma-style" is read as: fast early-stage option generation, live metrics, a 2D/2.5D site context and side-by-side comparison. It does not mean a full 3D modelling environment, terrain, or BIM | §1, §10, §22 | Scope of the site view |
| P6 | Project JSON file is the persistence model; browser storage is an optional draft autosave only. Not built, and not covered by the walkthrough (OPEN-QUESTIONS 27) | §4 | Collaboration limited to sharing files |

## Concept-stage modelling

| ID | Assumption | Where used | Impact if wrong |
|---|---|---|---|
| M1 | Representative days (12 clustered days + design day + 7-day low-renewable window) are accurate enough for screening (±5 % on LCOE and carbon against 8760) | §9.1 | If not met, either more days (slower) or 8760 for more options |
| M2 | Rule-based sizing from discrete choices is the right generation method at concept stage, rather than continuous optimisation | §7, §9.2 | Option set may miss intermediate sizes; mitigated by numeric sweeps |
| M3 | 2,000 options is a sensible generation cap; typical default runs give 200–600. Above the cap, sampling is a visible run setting the user can switch off; dominated options are shown by default, and hiding them is a user view setting (off by default) | §2, §7.2, §17 | Performance targets scale with this; with sampling off, runs above 2,000 are slower and not held to §17 |
| M4 | Resilience is a requirement check that drives sizing, not a weighted axis (from the delivered v1 tool's principle) | §2, §9.7 | Ranking behaviour |
| M5 | The four weighted axes are Cost, Carbon, Time-to-power, Deliverability, with defaults 35/25/25/15 and the five presets in §5.7 (indicative — unverified; judgement, no source). Effective weights = raw / Σ raw. Walkthrough, 2026-10-21: the default weights are provisionally accepted | §5.7, §11 | Rankings and the plain-English summary |
| M6 | Site fit is a status, not a weighted axis. A site-fit penalty inside deliverability exists but is off by default. Walkthrough, 2026-10-21: the Site tab is Beta and kept out of the ranking, so the penalty stays off (Beta settings only) | §5.7, §9.9, §11 | Flag-not-enforce stays intact; with the penalty on, site fit enters the score and the axis is relabelled |
| M7 | Default resilience requirement: 100 % IT + essential mechanical backed, N+1, 48 h autonomy, 5 min UPS (indicative — unverified; practitioner starting point, no source). Walkthrough, 2026-10-21: N+1 with 100 % of IT backed kept; autonomy from fuel and generation, batteries or both, chosen by the engineer; the 5-minute UPS is the resilience reserve battery (M30) | §5.5 | Backup sizing and footprint on every option |
| M8 | Economics compare differences only: building shell and IT fit-out excluded; cooling choice costed as a delta to an air baseline | §9.5 | Absolute capex totals are not project totals; stated in outputs |
| M9 | Default WACC 7 % real, 20-year evaluation, 10 % contingency (all indicative — unverified, no source). Walkthrough, 2026-10-21: WACC 7 % real kept (judgement, research); several evaluation periods at once (which one scores: OPEN-QUESTIONS 21). Class 5 capex band −30 %/+50 % is a point within the AACE 18R-97 range (revision and year to be confirmed by the builder) | §5.6 | Economics and uncertainty bands |
| M10 | Time-to-power = max of technology programme durations, earliest-availability dates and grid steps; no critical-path or resource modelling | §9.8 | Dates are indicative |
| M11 | Deliverability formula penalties (−15 Emerging, −40 Nascent, −8 major flag, etc.) are a reasonable first cut and editable (indicative — unverified, no source) | §9.9 | Ranking for risk-averse users |
| M12 | Grid date uncertainty default is asymmetric −6/+24 months (indicative — unverified, judgement, no source) | §5.4 | Time-to-power ranges, robust pick |
| M13 | Triangular distributions and the stated correlation groups (ρ = 0.6 grid/gas price, 0.8 capex within a family; indicative — unverified, no source) are adequate for Monte Carlo | §13.1 | Width of P10–P90 ranges |
| M14 | **Changed (Walkthrough, 2026-10-21):** backup gensets are included by default; test runs **6 h/yr per generator** at a **75 % test load** (a separate input; source to verify against: NFPA 110); they can run as primary power for a set number of hours a year, dispatched and costed (default 0 h, as the built program behaves: backup gensets never run in normal dispatch). Unchanged: N+1 redundancy block size 10 units, catcher 1 per 4 blocks (all indicative — unverified, no source). Before: test runs 12 h/yr per unit, no normal dispatch | §9.2, §9.4 | Scope 1 emissions of backup; genset count and footprint |
| M15 | AI training load transients are not modelled; a flag is raised instead | §5.3, §15 | Under-states BESS/UPS needs for AI campuses |
| M16 | SMR is placed off-site by default with earliest availability 2035 (indicative) | §6.2 | SMR options look late and are always flagged |
| M17 | In dispatch, the grid capacity entered is modelled as given by default ("Show unmet load"; Walkthrough, 2026-10-21: the option's contracted capacity, M23): demand above it that no other source serves is shown as unmet load and flagged, and the option keeps its sizing, score and place in every view. This is modelling an input, not enforcing a constraint (BRIEF §2 principle 5). "Show exceedance" is selectable. Run-hour limits are flag-only by default ("Respect limit" selectable) | §2, §9.4, §15, §23 | A user who wants to see dependence on extra grid must switch to "Show exceedance" |
| M18 | Load and building defaults: IT uncertainty ±20 %, ramp 50 %→100 % over 12 months, utilisation 80 %, roof plant fraction 40 %, ancillary 2 % of IT, performance-parameter range ±20 %, gas unlimited from start + 18 months (all indicative — unverified, no source) | §5.3, §5.4, §13.1 | Energy, sizing, Monte Carlo width, gas option timing |
| M19 | Wind defaults to "None" on sites ≤ 20 ha. This is a visible default, not a lock: an info flag on the C11 row and in the run summary's "values not generated" note says wind is not generated and offers "Include wind"; the user can include it on any site. The 20 ha threshold is indicative — unverified, no source | §8 C11, §12, §15 | Wind options not generated on small sites unless the user includes them |
| M20 | Archetypes (including archetype 10, SMR and hydrogen variants) are always generated regardless of choice defaults; the hydrogen variant is flagged "hydrogen supply unavailable at current inputs" while hydrogen availability is No | §7.3, §5.4, §15 | Adds two Nascent options to every run |
| M21 | Run settings (generation cap 2,000; Monte Carlo 300 samples over the top 20; 2 s idle for uncertainty, 1 s idle and top 10 for verification; layout raster 2 m / 5 m above 50 ha; 12 representative-day clusters + 1 design day + 1 seven-day window; tornado top 12; breakeven 5 competitors × 8 drivers; worker pool 1–8; 150 ms slider throttle) are chosen for the §17 timing targets, not from a source. Judgement thresholds: robust-pick band 5 %, screening/verification deviation flag 5 %. All labelled indicative — unverified with `basis` "run setting" or "judgement" (BRIEF §23 label rule) | §4, §7.2, §9.1, §10.4, §13.2, §13.3, §23 | Speed vs resolution; all editable |
| M23 | **Changed (Walkthrough, 2026-10-21):** each option has its own contracted grid capacity, set by the engineer (as built: the full offer for every option), and the grid connection charge is one fixed amount, the same for every option, default 0 with the country's typical value shown for reference and flagged as assumed (OPEN-QUESTIONS 19, 20). Unchanged: any shortfall at design load is shown and becomes unmet load in dispatch, and the tool never resizes the connection (BRIEF §9.2) | §9.2, §5.4 | How grid-heavy and on-site-heavy options compare |
| M24 | Choice default states and on/off setting defaults are judgement choices; no choice state changes automatically in response to results (C17 and C18 no longer auto-open on tight sites) | §8, §11, §23 | On tight sites the user must include GIS or double-deck gensets themselves; the run summary shows a "does not fit" note next to the Include control |
| M22 | Compatibility rules remove only logically impossible combinations, each listed by name with its removed count in the run summary; choice defaults that omit values are listed in a "values not generated" note with "Include" controls | §2, §7.2, §8, §12 | If a rule is wrong, a buildable combination would be missed; the visible list lets the user spot it |
| M25 | **New (Walkthrough, 2026-10-21):** when the IT load is not entered it is estimated from the site area: area × site coverage 35 % × 1 storey × 5.5 kW IT per m² of floor. Coverage and storeys are judgements; the density is one benchmark (STACK Erskine Park, 450 MW on 82,020 m² of floor), and whether that figure is IT or facility load is not known (all research). It conflicts with the massing rule S3 (OPEN-QUESTIONS 26) | §5.3 | Every result on sites where the IT load is not entered |
| M26 | **New (Walkthrough, 2026-10-21):** grid capacity now, at full connection, and the connection date default to country values when not known (indicative; research), flagged on every option | §5.4 | Time-to-power, bridging and grid-dependence of every option |
| M27 | **New (Walkthrough, 2026-10-21):** every input has a default; anything the engineer did not enter is flagged on each option that uses it, with its source; only the location and the site area are required | §2 principle 10, §5, §15 | Many flags on lightly specified studies |
| M28 | **New (Walkthrough, 2026-10-21):** load shapes are flat, daily fluctuation, AI training or AI inference, with editable defaults (research); the hourly model cannot show swings shorter than an hour | §5.3 | Energy, peak and battery results for AI campuses |
| M29 | **New (Walkthrough, 2026-10-21):** demand flexibility is off by default; its trigger parameters (share, hours, trigger and level, duration, notice, recovery, cost) are judgements until researched; with battery response the economic battery is sized by default to cover the historical trigger hours | §5.3, §9.2, §9.4 | Cost and grid dependence of flexible options |
| M30 | **New (Walkthrough, 2026-10-21):** batteries are split into a resilience reserve (always kept; default 5 minutes of UPS at full IT) and an economic battery (flexibility, arbitrage, carbon); both are costed | §5.5, §9.2, §9.7 | Battery capex and the resilience check |
| M31 | **New (Walkthrough, 2026-10-21):** the carbon price is the latest EU ETS market price with its date; the gas price is the latest published wholesale price with its date, from a free monthly source; escalation follows a published forecast per commodity; all overridable (sources to research) | §5.4, §5.6, §18 | Operating cost of combustion and grid options |
| M32 | **New (Walkthrough, 2026-10-21):** the cooling type is chosen by the engineer, not generated as alternatives; a typical PUE and maximum demand are offered per type, editable (OPEN-QUESTIONS 28) | §5.3, §8 C8, §9.3 | Archetypes and options no longer compare cooling types |
| M33 | **New (Walkthrough, 2026-10-21):** design temperatures come from the nearest ASHRAE design station (flagged), and hourly weather from NOAA station records cleaned into a usable year by the app (method to research) or an uploaded EPW file | §5.1, §9.3, §18 | PUE and facility load; ASHRAE licence to check |

## Site and spatial

Walkthrough, 2026-10-21: everything in this section applies to the Site tab, a Beta feature kept out of the ranking and the PDF (BRIEF §10), except S9 (the map) and the analysis start date in S10.

| ID | Assumption | Where used | Impact if wrong |
|---|---|---|---|
| S1 | Flat site; no terrain, flood levels or level changes | §10.1, §22 | Layout may be optimistic on sloping sites |
| S2 | Rectangular blocks on a raster grid (2 m, or 5 m above 50 ha) with a greedy priority-order placement heuristic are good enough for concept fit | §10.4 | Fit statuses near the margin may be wrong; manual editing mitigates |
| S3 | Building massing from density (kW IT/m² whitespace by cooling type), gross-up 2.2, 2 storeys, 6 m storey height, 4 m roof plant zone (all indicative — unverified, no source) | §5.3 | Building footprint dominates site fit |
| S4 | Spatial defaults in BRIEF §6.3 (footprints, heights, separations) are indicative placeholders to be verified | §6.3 | Site-fit results until verified |
| S5 | Roads, parking and landscaping take 15 % of net developable area; default boundary setback 10 m; default height limit 25 m (all indicative — unverified, no source) | §5.2 | Available area for plant |
| S6 | Noise is a distance-based screening proxy (sound power + geometric spreading), threshold 45 dB(A) night at receptors (indicative — unverified, no source) | §10.6 | Flag only; not an acoustic assessment |
| S10 | Site rectangle aspect ratio 1.5:1 when only an area is given; analysis start date today + 3 months (both indicative — unverified, no source) | §5.1, §5.2 | Site-fit shape on area-only sites; programme dates |
| S11 | Connection voltage bands switch at 20 MW and 150 MW (indicative — unverified, no source) | §5.4 | Substation type, footprint and cost |
| S7 | BESS separation defaults follow the NFPA 855 / FM Global approach (10 m to occupied buildings) unless vendor test data is entered | §6.3 | BESS placement and footprint |
| S8 | Off-site generation land is an optional area with private-wire distance; no off-site layout | §5.2, §10.3 | Off-site options are simplified |
| S9 | **Changed (Walkthrough, 2026-10-21):** the map for the location pin is bundled with the program (OpenStreetMap data in Protomaps PMTiles format, all of Europe, roads level), so no online tiles are used; licence, attribution and file size to check. Before: online map tiles optional; the plan works with a user underlay or blank canvas | §5.1, §10.2 | Offline use, licensing and program size |

## Data

| ID | Assumption | Where used | Impact if wrong |
|---|---|---|---|
| D1 | Country-level representative days and 8760 profiles are shipped; location-specific solar/temperature is a stretch goal via user upload. Walkthrough, 2026-10-21: real hourly prices and generation from ENTSO-E (alternatives: Ember, World Bank, Eurostat), prepared at each release; weather from the nearest NOAA station or an uploaded EPW file (M33) | §9.1, §18 | Accuracy for large countries (e.g. north vs south) |
| D2 | Where dataset licences forbid redistribution, synthetic profiles calibrated to published annual statistics are acceptable (as in delivered v1). As built (2026-10-21), every profile is synthetic | §18 | Labelled as synthetic |
| D3 | All v1 indicative cost ranges carry over as confidence C until re-verified at build time | §18 | Unverified label on many defaults at first release |
| D4 | Permitting thresholds use the EU IED 50 MWth aggregated threshold and MCPD 1–50 MWth for every built-in country, editable per project, with national variation not built in. For non-EU countries the flag says the EU threshold is a proxy | §5.5, §15 | Flags may differ from national practice (e.g. UK post-Brexit equivalents) |
| D6 | Hazardous substance storage flags use the Seveso III lower-tier qualifying quantities as proxies (hydrogen 5 t; petroleum products and alternative fuels 2,500 t, assumed to include HVO) for every built-in country, editable (indicative — unverified, source pending) | §5.5, §15 | Flags may differ from national transpositions or from site aggregation rules |
| D5 | Exchange rates are fixed per data release (ECB reference), editable. Walkthrough, 2026-10-21: confirmed; currency chosen per site from a fixed list | §5.1 | Minor |

## Performance and quality

| ID | Assumption | Where used | Impact if wrong |
|---|---|---|---|
| Q1 | Reference machine: 4-core 2020+ laptop, 16 GB, current Chromium or Firefox; for the Windows program, Windows 10 or 11, 64-bit | §17 | All timing targets |
| Q2 | WCAG 2.2 AA is the accessibility standard | §17 | Test scope |
| Q3 | **Dropped (Walkthrough, 2026-10-21):** the phone version is dropped; the tool is a Windows program only. Before: phone use is read and light-edit only; full site editing needs tablet or larger | §16 | Mobile scope |
| Q4 | The plain-English summary is template-generated, with no external language model call. Not built, and not covered by the walkthrough (OPEN-QUESTIONS 12) | §14 | Wording flexibility vs determinism and offline use |
