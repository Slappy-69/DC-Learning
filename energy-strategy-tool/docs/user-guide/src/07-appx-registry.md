# Appendix A. The full defaults register {#appA}

Every default value in the current version: **496 records**. Each entry gives the record's path, its value and unit, its range where one exists, its basis (source, judgement or run setting) and, where the brief names one, the source it should be checked against. Every record is labelled "indicative — unverified" (confidence C, not verified). Chapter 50 compares the important values with published sources.

Abbreviations: **src** = basis "source" (should come from a published source); **judg** = judgement; **run** = run setting.


## Project

- **project.fx**: EUR 1; GBP 0.8377; NOK 10.488; SEK 11.112; DKK 7.4747; CHF 0.9211; ISK 136.2 (per EUR); src. Fixed rates; display conversion only. Engine works in EUR; check against ECB reference rates.
- **project.name**: Untitled project; judg.
- **project.country**: none; judg. null = derived from location (nearest built-in country centroid); overridable.
- **project.currency**: by country; judg.
- **project.analysisStart**: 2027-01 (YYYY-MM); judg. Today + 3 months. No source; replace with the client programme start.
- **project.seed**: 20261015 integer; run.

## Country profiles

- **profiles.countries**: built-in synthetic country set (31); src. Synthetic calibration targets for seeded synthetic hourly profiles. Not measured data. Replace with verified profiles; check against PVGIS (EU JRC), Renewables.ninja / ERA5, ENTSO-E Transparency Platform, Ember, TTF/NBP, EU ETS / UK ETS.

## Site

- **site.exclusionType.easement.hard**: hard; judg. Overhead lines and buried services; no plant over a wayleave without consent.
- **site.exclusionType.flood.hard**: soft; judg. Soft: raised ground solar can often use flood zones; critical plant cannot.
- **site.exclusionType.ecology.hard**: hard; judg.
- **site.exclusionType.tree.hard**: hard; judg. Root protection areas.
- **site.exclusionType.structure.hard**: hard; judg.
- **site.exclusionType.other.hard**: hard; judg.
- **site.aspect**: 1.5 ratio; range 1–3; judg. No source.
- **site.boundary**: none ({ points: [[lat, lon], …], source } or null); judg. null = rectangle from the site area and aspect ratio, long side east–west, centred on the project location. A drawn, typed or imported polygon replaces it and sets the site area.
- **site.setbackM**: 10 m; range 5–20; judg. No source; replace with local planning requirement.
- **site.setbackByEdge**: none (m per boundary edge (null entries = uniform setback)); judg. Per-edge override of the uniform boundary setback; null = uniform on every edge.
- **site.heightLimitM**: 25 m; range 15–40; judg.
- **site.heightZones**: none (list of { name, limitM, points }); judg. Per-zone override of the height limit; none by default.
- **site.exclusions**: none (list of { name, type, hard, points }); judg. None by default.
- **site.softUsableBySolar**: on; judg. Soft exclusions can be used by ground solar (configurable). Off: ground solar does not use them either. Other blocks never use a soft exclusion by default; only at the last relaxation level (L4), flagged "Block in soft exclusion" and "Fits with flags" (§10.4 step 5, §15).
- **site.poc**: none ([lat, lon] or null); judg. The brief default is the boundary point nearest the map's nearest road. This offline tool has no road data, so the default POC is the default access point (mid-point of the longest edge), standing in for the road side. Replace with the real POC.
- **site.gasMain**: none ([lat, lon] or null); judg. None: gas off-site, location unknown.
- **site.access**: none (list of [lat, lon] or null); judg. null = one access point at the mid-point of the longest edge.
- **site.receptors**: none (list of { name, point } or { name, points }); judg. None by default; used for distance-based noise flags only.
- **site.roadsFraction**: 0.15 fraction of net developable area; range 0.1–0.25; judg. Applied to the buildable envelope area: allowance = fraction × envelope, net developable = envelope − allowance (the brief's definition is circular). Held back as a land budget, not a located area.
- **site.pvRoofM2**: none (m² of roof available for PV, or null); judg. OPEN-QUESTIONS 53 (2026-10-22): blank = today's rule, 50 % of the free roof after roof plant is usable (solarRoof.usableFraction). An entered area replaces the rule; car-park canopies can be included here or in the ground area.
- **site.pvGroundHa**: 0 ha of ground available for PV; judg. OPEN-QUESTIONS 53 (2026-10-22): 0 = no ground solar. An entered area makes C10 "Roof + ground" available and sizes ground PV at solarGround.haPerMWp; with the Site tab (Beta) on it is placed as one block of that area.
- **site.offsiteLandHa**: 0 ha; judg.
- **site.offsiteDistanceKm**: 2 km private-wire distance; range 0.5–10; judg. Used only when off-site land or off-site plant exists; replace with the real route length.
- **site.groundConditions**: assumed suitable (free text); judg. Note only; no geotechnical modelling (flat site, §10.1).

## Load and building

- **load.rampStart**: 0.25 fraction of phase IT at energisation; range 0.1–0.5; judg. The owner's judgement (2026-10-22, OPEN-QUESTIONS 51; was 50 %). No source; replace with the client's fit-out programme.
- **load.rampMonths**: 12 months; range 6–24; judg.
- **load.utilisation**: 0.8 fraction of installed IT; range 0.6–0.95; judg.
- **load.workload**: cloud; judg. Mixed cloud.
- **load.coolingApproach**: open; judg. Open choice (C8).
- **load.grossUp**: 2.2 GFA / whitespace; range 1.8–2.6; judg.
- **load.storeys**: 2 storeys; range 1–6; judg.
- **load.storeyHeightM**: 6 m; range 5–7; judg.
- **load.roofZoneM**: 4 m; range 3–6; judg.
- **load.ancillaryFrac**: 0.02 fraction of installed IT; range 0.01–0.04; judg.
- **load.flexMaxPct**: 0.1 fraction of IT curtailable; range 0–0.3; judg.
- **load.flexHours**: 100 h/yr; range 0–500; judg.
- **load.phases**: none (list of {itMW, date}); judg. null = 1 phase, 100 % of IT at the grid full-connection date.

## Grid

- **grid.steps**: none (list of {date, MW}); judg.
- **grid.exportMW**: 0 MW; judg.
- **grid.exportFactor**: 0.9 × hourly price; range 0.7–1; judg.
- **grid.priceAdder**: by country (€/MWh); src; check against National regulators (network charges, levies).
- **grid.priceMultiplier**: 1 × country profile; range 0.7–1.5; judg.
- **grid.carbonMultiplier**: 1 × country profile; range 0.8–1.2; judg.
- **grid.dateUncertainty**: -6 / 24 months; judg. Feeds Monte Carlo (not in this slice).

## Utilities

- **utilities.gasAvailable**: Unknown; judg.
- **utilities.gasDateMonths**: 18 months from project start; range 12–36; judg. Gas capacity unlimited from this date.
- **utilities.gasPrice**: by country (€/MWh_th); src; check against TTF/NBP forward curves; national tariffs.
- **utilities.hydrogenAvailable**: No; judg.
- **utilities.waterAvailable**: Unknown (m³/day); judg.
- **utilities.districtHeating**: No; judg.

## Requirements

- **requirements.backedPct**: 1 fraction of IT + essential mechanical; range 0.5–1; judg.
- **requirements.topology**: N+1; judg.
- **requirements.autonomyH**: 48 h; range 12–72; judg.
- **requirements.islanding**: No; judg. Default not stated in brief; "No" chosen (judgement).
- **requirements.upsMin**: 5 min at full IT; range 5–15; judg.
- **requirements.blockSize**: 10 units per block; range 4–20; judg.
- **requirements.catcherN**: 4 blocks per catcher unit; range 2–6; judg.
- **requirements.carbonTarget**: none (gCO2e/kWh (annual average cap)); judg. None.
- **requirements.capexCeiling**: none (€); judg. None.
- **requirements.maxRunHours**: none (h/yr); judg. None.
- **requirements.iedMWth**: 50 MWth aggregated; src; check against Directive 2010/75/EU (IED), consolidated text; check 2024 revision.
- **requirements.mcpMinMWth**: 1 MWth per unit; src; check against Directive (EU) 2015/2193 (MCPD).
- **requirements.mcpMaxMWth**: 50 MWth per unit; src; check against Directive (EU) 2015/2193 (MCPD).
- **requirements.sevesoH2t**: 5 t hydrogen stored; src; check against Directive 2012/18/EU (Seveso III) Annex I lower tier.
- **requirements.permitAllowanceM**: 6 months before ordering plant that needs significant environmental permitting (IED, Seveso); range 0–18; judg. Owner's decision 2026-10-22 (OPEN-QUESTIONS 44, 45): plant is ordered from day one; only plant under the IED or Seveso waits this allowance. Wind, ground solar and SMRs keep their own planning months (OPEN-QUESTIONS 56).
- **requirements.sevesoFuelT**: 2,500 t diesel/HVO stored; src; check against Directive 2012/18/EU (Seveso III) Annex I lower tier.
- **requirements.testRunHours**: 12 h/yr per unit; range 6–24; judg.
- **requirements.testRunLoad**: 0.75 fraction of rating; range 0.5–1; judg.
- **requirements.bessUpsGensetFraction**: 1 genset capacity as fraction of critical load at topology N; judg. BESS-augmented UPS replaces redundant genset units with BESS for its duration.
- **requirements.landTakeCeilingHa**: none (ha on-site land take (null = net developable area)); judg. Flag only. At the default it coincides with the "Does not fit" status; a lower value raises the minor flag "land take above ceiling" without changing the site-fit status.
- **requirements.noiseNightDbA**: 45 dB(A) at receptors, night; range 35–55; judg. No source; replace with the local planning or environmental noise criterion. Screening proxy, not an acoustic assessment.

## Economics

- **economics.periodYears**: 20 yr; range 15–25; judg.
- **economics.wacc**: 0.07 real; range 0.04–0.12; judg.
- **economics.contingency**: 0.1 fraction of capex; range 0.05–0.2; judg.
- **economics.capexLow**: -0.3 fraction (AACE Class 5); src; check against AACE International RP 18R-97 (confirm revision and year).
- **economics.capexHigh**: 0.5 fraction (AACE Class 5); src; check against AACE International RP 18R-97 (confirm revision and year).
- **economics.carbonPrice**: by country (€/tCO2e); src. The country default comes from the scheme records country.carbonPrice.euEts and country.carbonPrice.ukEts (sourced); Switzerland is unresearched; check against EU ETS / UK ETS exchange data, official projections.
- **economics.carbonEscalation**: 0.02 real per yr; range 0–0.05; src; check against EU ETS / UK ETS forward curves.
- **economics.elecEscalation**: 0 real per yr; range -0.02–0.02; src; check against ENTSO-E / forward curves.
- **economics.gasEscalation**: 0 real per yr; range -0.02–0.02; src; check against TTF/NBP forward curves.
- **economics.salvageFraction**: 0.5 of remaining book value when removed; range 0.2–0.7; judg.
- **economics.revenueExport**: off; judg.

## Weights

- **weights.presets**: Balanced 35/25/25/15; Lowest cost 70/10/10/10; Lowest carbon 20/60/10/10; Speed to market 20/10/60/10; Lowest risk 25/15/20/40 (raw 0–100); judg. First-cut judgement, no source.
- **weights.cost**: 35 raw 0–100; judg.
- **weights.carbon**: 25 raw 0–100; judg.
- **weights.ttp**: 25 raw 0–100; judg.
- **weights.deliverability**: 15 raw 0–100; judg.

## Deliverability

- **deliverability.emergingPenalty**: 15 points per 100 % share; judg.
- **deliverability.nascentPenalty**: 40 points per 100 % share; judg.
- **deliverability.majorFlagPenalty**: 8 points per major permitting flag; judg.
- **deliverability.minorFlagPenalty**: 3 points per minor permitting flag; judg.
- **deliverability.gasUnknownPenalty**: 10 points; judg.
- **deliverability.hydrogenPenalty**: 10 points; judg.
- **deliverability.leadTimePenalty**: 5 points per technology; judg.
- **deliverability.leadTimeThresholdM**: 24 months procurement; judg.
- **deliverability.siteFitPenalty**: off; judg. Off by default: the site-fit status has no effect on the deliverability or weighted score. On: the axis is labelled "Deliverability (incl. site fit)".
- **deliverability.siteFitFlagsPenalty**: 10 points for "Fits with flags"; judg. Applies only when the site-fit penalty is on.
- **deliverability.siteFitNoFitPenalty**: 25 points for "Does not fit"; judg. Applies only when the site-fit penalty is on.

## Run settings

- **settings.generationCap**: 2,000 options; run.
- **settings.sampleAboveCap**: on; judg.
- **settings.gridHandling**: unmet ("unmet" | "exceedance"); judg. Show unmet load.
- **settings.runHourHandling**: flag ("flag" | "respect"); judg. Flag only.
- **settings.costMetric**: lcoe ("lcoe" | "npv"); judg.
- **settings.carbonMetric**: location ("location" | "market" | "cfe"); judg.
- **settings.absoluteScaling**: off; judg. Hook only in this slice.
- **settings.rankCompliantFirst**: off; judg. On: options whose resilience status is "Does not meet" rank after the others; scores do not change. Site fit does not count while the Site tab is Beta (AC 27, 2026-10-22).
- **settings.hideDominated**: off; judg.
- **settings.windSiteThresholdHa**: 20 ha; judg.
- **settings.bridgeBessHours**: 24 h; judg.
- **settings.timelineMonths**: 120 months; run. Time-to-power horizon.
- **settings.maxDispatchYears**: 8 years; run. Distinct 8760-h dispatch years before steady state is assumed.
- **settings.autonomyBasis**: critical load; judg.
- **settings.layoutCellM**: 2 m raster cell; run. Auto-layout raster cell size; chosen for the §17 layout timing, not from a source.
- **settings.layoutCellLargeM**: 5 m raster cell (large sites); run.
- **settings.layoutLargeSiteHa**: 50 ha gross site area above which the large cell is used; run.

## Choice default states

- **choices.C1**: open: wait, bridge, islanded; judg.
- **choices.C2**: open: gasRecip, fuelCell, rented; judg.
- **choices.C3**: open: remove, backup, prime, gridServices, split; judg.
- **choices.C4**: open: none, chp, fuelCell; judg.
- **choices.C4s**: open: average, shortfall; judg. Both sizings generated (OPEN-QUESTIONS 58, 2026-10-23); "Permanent shortfall" only for cooling types with a permanent shortfall (rule g).
- **choices.C5**: open: hvo, diesel, retained; judg.
- **choices.C6**: locked: N+1; judg.
- **choices.C7**: locked: 48; judg.
- **choices.C8**: open: air, evap, dlc, immersion; judg.
- **choices.C9**: open: roof, ground, split; judg.
- **choices.C10**: open: none, roof; judg. Default None and Roof only; Roof + ground is added when the ground area for PV (site.pvGroundHa) is above 0 (OPEN-QUESTIONS 54, 2026-10-22).
- **choices.C11**: open: none; judg. Default "None" when site area ≤ 20 ha and no off-site land; otherwise open.
- **choices.C12**: open: none, 2h25, 4h50; judg.
- **choices.C12r**: locked: peakShave; judg. Default role "peak-shave against grid cap" (§8 C12).
- **choices.C13**: open: none, hybrid; judg.
- **choices.C14**: open: 50, 80, 100; judg.
- **choices.C15**: locked: none; judg.
- **choices.C16**: locked: off; judg.
- **choices.C17**: open: AIS; judg.
- **choices.C18**: open: single; judg.
- **choices.C19**: locked: perPhase; judg.
- **choices.C20**: locked: none; judg.

## Fuels and emission factors

- **fuel.gasTransportAdder**: 4 €/MWh_th; range 2–8; src; check against National gas transport tariffs.
- **fuel.dieselPrice**: 110 €/MWh_th; range 85–140; src; check against National fuel price statistics.
- **fuel.hvoPrice**: 170 €/MWh_th; range 130–220; src; check against Fuel supplier indications.
- **fuel.hydrogenPrice**: 246 €/MWh_th; range 210–300; src. Renewable hydrogen delivered price; €8.20/kg ÷ 33.3 kWh/kg. Range €7–10/kg; check against Hydrogen supply price indications.
- **fuel.efGas**: 0.202 tCO2e/MWh_th; range 0.2–0.205; src; check against National GHG inventory emission factors.
- **fuel.efDiesel**: 0.267 tCO2e/MWh_th; range 0.264–0.27; src; check against National GHG inventory emission factors.
- **fuel.efHvo**: 0.03 tCO2e/MWh_th; range 0–0.06; src. Fossil-equivalent proxy; biogenic CO₂ not counted. Indicative; check against HVO supplier sustainability data.
- **fuel.efHydrogen**: 0 tCO2e/MWh_th; src. Scope 1 only; upstream production emissions not counted.

## PPA prices

- **ppa.strike.solar**: 55 €/MWh; range 45–70; src; check against PPA market indices (e.g. LevelTen, Pexapark).
- **ppa.strike.wind**: 65 €/MWh; range 55–80; src; check against PPA market indices.
- **ppa.strike.hybrid**: 62 €/MWh; range 50–75; src; check against PPA market indices.
- **ppa.strike.baseload**: 80 €/MWh; range 65–95; src; check against PPA market indices.
- **ppa.strike.cfe247**: 95 €/MWh; range 80–120; src; check against PPA market indices.
- **ppa.shapingAdder**: 5 €/MWh; range 2–10; src; check against PPA market indices.

## Cooling approaches


### Air (chilled water + free cooling)

Check against: ASHRAE TC 9.9 thermal guidelines; vendor data; published design studies.

- **tempBasis**: drybulb; src.
- **fcThreshold**: 10 °C; range 8–14; src.
- **band**: 10 K; range 6–12; src.
- **copRef**: 5 COP at tRef; range 4–6; src.
- **tRef**: 25 °C; src.
- **copSlope**: 0.12 COP per K; range 0.08–0.16; src.
- **fanFrac**: 0.07 MW per MW IT; range 0.05–0.09; src.
- **lossFrac**: 0.07 MW per MW IT; range 0.05–0.09; src.
- **densityKWm2**: 1.5 kW IT/m² whitespace; range 1.2–2; src.
- **wueBase**: 0.05 L/kWh IT; range 0–0.2; src.
- **capexDeltaPerKW**: 0 €/kW IT vs air; src.

### Evaporative-adiabatic

Check against: ASHRAE TC 9.9 thermal guidelines; vendor data; published design studies.

- **tempBasis**: wetbulb; src.
- **fcThreshold**: 14 °C wet-bulb; range 12–17; src.
- **band**: 6 K; range 4–8; src.
- **copRef**: 6.5 COP at tRef; range 5–8; src.
- **tRef**: 20 °C wet-bulb; src.
- **copSlope**: 0.15 COP per K; range 0.1–0.2; src.
- **fanFrac**: 0.05 MW per MW IT; range 0.04–0.07; src.
- **lossFrac**: 0.07 MW per MW IT; range 0.05–0.09; src.
- **densityKWm2**: 1.8 kW IT/m² whitespace; range 1.4–2.2; src.
- **wueBase**: 0.3 L/kWh IT; range 0.1–0.5; src.
- **wueEvap**: 1.8 L/kWh IT in adiabatic hours; range 1.2–2.5; src.
- **capexDeltaPerKW**: -40 €/kW IT vs air; range -80–0; src.

### DLC + dry coolers

Check against: ASHRAE TC 9.9 thermal guidelines; vendor data; published design studies.

- **tempBasis**: drybulb; src.
- **fcThreshold**: 26 °C; range 22–30; src.
- **band**: 10 K; range 6–12; src.
- **copRef**: 5.5 COP at tRef; range 4.5–6.5; src.
- **tRef**: 35 °C; src.
- **copSlope**: 0.1 COP per K; range 0.06–0.14; src.
- **fanFrac**: 0.045 MW per MW IT; range 0.03–0.06; src.
- **lossFrac**: 0.06 MW per MW IT; range 0.05–0.08; src.
- **densityKWm2**: 4 kW IT/m² whitespace; range 3–6; src.
- **wueBase**: 0.02 L/kWh IT; range 0–0.1; src.
- **capexDeltaPerKW**: 150 €/kW IT vs air; range 80–250; src.

### Immersion

Check against: ASHRAE TC 9.9 thermal guidelines; vendor data; published design studies.

- **tempBasis**: drybulb; src.
- **fcThreshold**: 30 °C; range 26–34; src.
- **band**: 10 K; range 6–12; src.
- **copRef**: 5.5 COP at tRef; range 4.5–6.5; src.
- **tRef**: 38 °C; src.
- **copSlope**: 0.1 COP per K; range 0.06–0.14; src.
- **fanFrac**: 0.03 MW per MW IT; range 0.02–0.05; src.
- **lossFrac**: 0.06 MW per MW IT; range 0.05–0.08; src.
- **densityKWm2**: 3 kW IT/m² whitespace; range 2–4.5; src.
- **wueBase**: 0.02 L/kWh IT; range 0–0.1; src.
- **capexDeltaPerKW**: 250 €/kW IT vs air; range 150–400; src.

## Technology library


### Solar PV ground-mount

Check against: IRENA Renewable Power Generation Costs, NREL ATB, Danish Energy Agency Technology Catalogues, Lazard LCOE+, vendor indications.

- **capexPerKW**: 700 €/kWp; range 600–800; src.
- **fomPerKW**: 12 €/kWp/yr; range 9–15; src.
- **life**: 30 yr; range 25–35; src.
- **haPerMWp**: 1.2 ha/MWp; range 0.8–1.8; src.
- **planM**: 9 months; range 6–18; src.
- **procM**: 6 months; range 3–9; src.
- **buildM**: 6 months; range 4–9; src.

### Solar PV rooftop

Check against: IRENA Renewable Power Generation Costs, NREL ATB, Danish Energy Agency Technology Catalogues, Lazard LCOE+, vendor indications.

- **capexPerKW**: 900 €/kWp; range 750–1,100; src.
- **fomPerKW**: 14 €/kWp/yr; range 10–18; src.
- **life**: 25 yr; range 20–30; src.
- **m2PerKWp**: 5.5 m²/kWp; range 4.5–7; src.
- **usableFraction**: 0.5 fraction of free roof; range 0.4–0.6; src.
- **procM**: 6 months; range 3–9; src.
- **buildM**: 4 months; range 3–6; src.

### Wind onshore

Check against: IRENA Renewable Power Generation Costs, NREL ATB, Danish Energy Agency Technology Catalogues, Lazard LCOE+, vendor indications.

- **capexPerKW**: 1,350 €/kW; range 1,200–1,500; src.
- **fomPerKW**: 35 €/kW/yr; range 25–45; src.
- **life**: 25 yr; range 20–30; src.
- **turbineMW**: 5 MW; range 3–6; src.
- **tipHeightM**: 180 m; range 150–220; src.
- **toppleFactor**: 1.5 × tip height; range 1.1–2; src.
- **haPerTurbine**: 33.75 ha per turbine (5 × 3 rotor diameters); range 20–50; src.
- **planM**: 24 months; range 12–48; src.
- **procM**: 18 months; range 12–24; src.
- **buildM**: 12 months; range 9–18; src.

### Battery storage (BESS)

Check against: IRENA Renewable Power Generation Costs, NREL ATB, Danish Energy Agency Technology Catalogues, Lazard LCOE+, vendor indications.

- **capexPerKWh**: 250 €/kWh; range 200–350; src.
- **capexPerKW**: 150 €/kW; range 100–200; src.
- **fomPct**: 0.015 fraction of capex/yr; range 0.01–0.025; src.
- **rte**: 0.88 round-trip efficiency; range 0.85–0.92; src.
- **life**: 15 yr; range 12–20; src.
- **m2PerMWh**: 50 m²/MWh; range 30–90; src.
- **socInit**: 0.5 fraction; src.
- **procM**: 9 months; range 6–15; src.
- **buildM**: 6 months; range 3–9; src.

### Gas reciprocating engines

Check against: Danish Energy Agency Technology Catalogue; vendor data.

- **capexPerKW**: 900 €/kW; range 800–1,000; src.
- **fomPerKW**: 15 €/kW/yr; range 10–20; src.
- **vomPerMWh**: 8 €/MWh; range 5–12; src.
- **eff**: 0.44 electrical efficiency (LHV); range 0.4–0.48; src.
- **msl**: 0.3 min stable load fraction; range 0.2–0.4; src.
- **unitMW**: 4.5 MW; range 2–10; src.
- **life**: 20 yr; range 15–25; src.
- **m2PerMW**: 200 m²/MWe; range 120–300; src.
- **stackM**: 25 m; range 20–30; src.
- **procM**: 9 months; range 6–15; src.
- **buildM**: 6 months; range 4–9; src.

### Gas turbines

Check against: Danish Energy Agency Technology Catalogue; vendor data.

- **capexPerKW**: 750 €/kW; range 600–900; src.
- **fomPerKW**: 12 €/kW/yr; range 8–16; src.
- **vomPerMWh**: 6 €/MWh; range 4–9; src.
- **eff**: 0.38 electrical efficiency (LHV); range 0.33–0.42; src.
- **msl**: 0.4 min stable load fraction; range 0.3–0.5; src.
- **unitMW**: 30 MW; range 10–50; src.
- **life**: 25 yr; range 20–30; src.
- **m2PerMW**: 120 m²/MWe; range 80–200; src.
- **stackM**: 30 m; range 25–40; src.
- **procM**: 12 months; range 9–24; src.
- **buildM**: 6 months; range 4–9; src.

### Gas CHP / trigeneration

Check against: Vendor data; Danish Energy Agency Technology Catalogue.

- **capexPerKW**: 1,300 €/kW; range 1,100–1,600; src.
- **fomPerKW**: 20 €/kW/yr; range 15–28; src.
- **vomPerMWh**: 10 €/MWh; range 7–14; src.
- **eff**: 0.42 electrical efficiency (LHV); range 0.38–0.46; src.
- **heatToPower**: 1 MWth recoverable per MWe; range 0.8–1.2; src.
- **absorptionCOP**: 0.7 COP; range 0.6–0.8; src.
- **msl**: 0.4 min stable load fraction; range 0.3–0.5; src.
- **unitMW**: 4.5 MW; range 2–10; src.
- **life**: 20 yr; range 15–25; src.
- **m2PerMW**: 280 m²/MWe (recip + 40 %); range 170–420; src.
- **stackM**: 25 m; range 20–30; src.
- **sizeFraction**: 1 fraction of average facility load; range 0.5–1; src.
- **procM**: 12 months; range 9–18; src.
- **buildM**: 9 months; range 6–12; src.

### Fuel cells (SOFC)

Check against: Vendor data.

- **capexPerKW**: 2,800 €/kW; range 2,200–3,500; src.
- **fomPerKW**: 40 €/kW/yr; range 30–60; src.
- **vomPerMWh**: 5 €/MWh; range 3–8; src.
- **eff**: 0.55 electrical efficiency (LHV); range 0.5–0.6; src.
- **msl**: 0.3 min stable load fraction; range 0.2–0.4; src.
- **unitMW**: 1 MW; range 0.3–2; src.
- **life**: 20 yr; range 15–25; src.
- **stackLife**: 7 yr; range 5–10; src.
- **stackFraction**: 0.25 fraction of capex; range 0.2–0.35; src.
- **m2PerMW**: 120 m²/MW; range 60–200; src.
- **procM**: 6 months; range 4–12; src.
- **buildM**: 3 months; range 2–6; src.

### HVO-diesel prime gensets

Check against: Manufacturer datasheets.

- **capexPerKW**: 450 €/kW; range 350–550; src.
- **fomPerKW**: 10 €/kW/yr; range 6–14; src.
- **vomPerMWh**: 12 €/MWh; range 8–16; src.
- **eff**: 0.4 electrical efficiency; range 0.36–0.43; src.
- **msl**: 0.3 min stable load fraction; range 0.2–0.4; src.
- **unitMW**: 2.75 MW; range 2.5–3; src.
- **life**: 15 yr; range 10–20; src.
- **m2PerMW**: 40 m²/MW; range 28–56; src.
- **stackM**: 10 m; range 8–12; src.
- **procM**: 9 months; range 6–15; src.
- **buildM**: 3 months; range 2–6; src.

### Rented temporary generation

Check against: Rental vendor indications.

- **rentalPerKWMonth**: 12 €/kW/month; range 8–18; src.
- **vomPerMWh**: 10 €/MWh; range 6–14; src.
- **eff**: 0.38 electrical efficiency; range 0.34–0.42; src.
- **msl**: 0.3 min stable load fraction; range 0.2–0.4; src.
- **unitMW**: 2 MW; range 1–3; src.
- **m2PerMW**: 150 m²/MW; range 100–250; src.
- **stackM**: 10 m; range 8–12; src.
- **procM**: 2 months; range 1–4; src.
- **buildM**: 2 months; range 1–3; src.

### Small modular reactor

Check against: Vendor and regulator publications.

- **capexPerKW**: 7,000 €/kW; range 5,000–12,000; src.
- **fomPerKW**: 120 €/kW/yr; range 80–160; src.
- **vomPerMWh**: 3 €/MWh; range 2–5; src.
- **fuelPerMWhE**: 9 €/MWh_e; range 6–12; src.
- **msl**: 0.5 min stable load fraction; range 0.4–0.7; src.
- **unitMW**: 80 MW; range 50–300; src.
- **life**: 60 yr; range 40–80; src.
- **earliestYear**: 2035 year; range 2032–2040; src.
- **planM**: 36 months; range 24–60; src.
- **procM**: 36 months; range 24–48; src.
- **buildM**: 48 months; range 36–72; src.

### Hydrogen gensets / fuel cells

Check against: National hazardous-substance regulation; specialist input; vendor data.

- **capexPerKW**: 2,500 €/kW; range 1,800–3,500; src.
- **fomPerKW**: 40 €/kW/yr; range 30–60; src.
- **vomPerMWh**: 5 €/MWh; range 3–8; src.
- **eff**: 0.5 electrical efficiency (LHV); range 0.4–0.55; src.
- **msl**: 0.2 min stable load fraction; range 0.1–0.3; src.
- **unitMW**: 1 MW; range 0.5–2; src.
- **life**: 15 yr; range 10–20; src.
- **m2PerMW**: 300 m²/MW + storage; range 200–450; src.
- **storageHours**: 24 h of full output stored on site; range 12–48; src.
- **procM**: 18 months; range 12–30; src.
- **buildM**: 9 months; range 6–12; src.

### Diesel standby gensets

Check against: Manufacturer datasheets.

- **capexPerKW**: 450 €/kW; range 350–550; src.
- **fomPerKW**: 8 €/kW/yr; range 5–12; src.
- **unitMW**: 2.75 MW; range 2.5–3; src.
- **eff**: 0.38 electrical efficiency; range 0.35–0.42; src.
- **life**: 25 yr; range 20–30; src.
- **m2PerUnit**: 100 m² per unit incl. access; range 70–140; src.
- **stackM**: 10 m; range 8–12; src.
- **procM**: 12 months; range 9–18; src.
- **buildM**: 6 months; range 3–9; src.

### HVO standby gensets

Check against: Manufacturer datasheets.

- **capexPerKW**: 460 €/kW; range 360–560; src.
- **fomPerKW**: 8 €/kW/yr; range 5–12; src.
- **unitMW**: 2.75 MW; range 2.5–3; src.
- **eff**: 0.38 electrical efficiency; range 0.35–0.42; src.
- **life**: 25 yr; range 20–30; src.
- **m2PerUnit**: 100 m² per unit incl. access; range 70–140; src.
- **stackM**: 10 m; range 8–12; src.
- **procM**: 12 months; range 9–18; src.
- **buildM**: 6 months; range 3–9; src.

### Gas standby gensets

Check against: Manufacturer datasheets.

- **capexPerKW**: 550 €/kW; range 450–700; src.
- **fomPerKW**: 9 €/kW/yr; range 6–13; src.
- **unitMW**: 2 MW; range 1.5–2.5; src.
- **eff**: 0.4 electrical efficiency; range 0.36–0.43; src.
- **life**: 25 yr; range 20–30; src.
- **m2PerUnit**: 110 m² per unit incl. access; range 80–150; src.
- **stackM**: 10 m; range 8–12; src.
- **procM**: 12 months; range 9–18; src.
- **buildM**: 6 months; range 3–9; src.

### BESS-augmented UPS

Check against: IRENA Renewable Power Generation Costs, NREL ATB, Danish Energy Agency Technology Catalogues, Lazard LCOE+, vendor indications.

- **durationH**: 2 h at redundancy capacity; range 1–4; src.

### Bulk fuel storage

Check against: Fuel storage regulations by country; fire engineer.

- **capexPerM3**: 1,200 €/m³; range 800–1,800; src.
- **m2PerM3**: 0.15 m² per m³; range 0.1–0.25; src.
- **dieselLPerKWh**: 0.26 L/kWh at full load; range 0.24–0.28; src.
- **bellyTankM3**: 0 m³ belly-tank volume credited; src.
- **densityTPerM3**: 0.84 t/m³; range 0.78–0.86; src.

### Grid connection and substation

Check against: TSO/DSO design standards and connection charging statements.

- **connCapexPerMW_mv**: 100,000 €/MW offered (11–33 kV); range 60,000–160,000; src.
- **connCapexPerMW_hv**: 150,000 €/MW offered (110–150 kV); range 90,000–250,000; src.
- **connCapexPerMW_ehv**: 120,000 €/MW offered (220–400 kV); range 70,000–200,000; src.
- **subCapexPerMW_mv**: 60,000 €/MW (11–33 kV); range 40,000–90,000; src.
- **subCapexPerMW_hv**: 80,000 €/MW (110–150 kV); range 50,000–120,000; src.
- **subCapexPerMW_ehv**: 70,000 €/MW (220–400 kV); range 45,000–110,000; src.
- **gisMultiplier**: 1.4 × AIS cost; range 1.2–1.7; src.
- **cablePerKm**: 1,500,000 €/km of cable route from the POC (route length from the site model, §5.2); range 800,000–3,000,000; src.
- **m2Per20MVA_mv**: 500 m² per 20 MVA; range 300–800; src.
- **haAIS_hv**: 1.2 ha; range 0.8–2; src.
- **haGIS_hv**: 0.4 ha; range 0.25–0.6; src.
- **haAIS_ehv**: 4 ha; range 2.5–6; src.
- **haGIS_ehv**: 1.2 ha; range 0.8–2; src.
- **bandMvMaxMW**: 20 MW (MV/HV band edge); src.
- **bandHvMaxMW**: 150 MW (HV/EHV band edge); src.

### Gas connection pipe

Check against: Gas network connection charging statements; pipeline cost benchmarks.

- **pipePerKm**: 800,000 €/km of connection pipe from the gas main; range 400,000–2,000,000; src.

### Heat rejection

Check against: Vendor data.

- **m2PerMW**: 60 m² per MW rejected; range 40–100; src.
- **roofPlantFraction**: 0.4 fraction of roof if heat rejection on roof; range 0.3–0.6; src.

## Spatial library (site layout)


### building

- **lw**: 1.5 length : width; range 1–3; judg. Plan proportion of each data hall block. No source.
- **clearanceM**: 6 m to other blocks; range 4–10; judg. Fire-tender access route around the building. Not in §6.3; replace with the fire strategy.
- **clearanceMinM**: 4 m (minimum when relaxed); range 3–6; judg. Minimum access width used only when the default cannot be met (option then "Fits with flags").
- **maxHallM2**: 25,000 m² footprint per data hall block; range 10,000–40,000; judg. A phase whose footprint exceeds this is split into equal halls.
- **splitByPhase**: on; judg. One building block per phase (each phase's share of the footprint).

### substation

Check against: Utility / DNO standards, TSO/DSO design standards, vendor data.

- **lw**: 1.5 length : width; range 1–3; judg. Plan proportion. No source.
- **mvPowerFactor**: 0.9 power factor (MVA = MW ÷ power factor), 11–33 kV footprint; range 0.85–0.95; judg. §6.3 gives the 11–33 kV footprint per 20 MVA; the offered MW is converted to MVA at this power factor. No source.
- **mvHeightM**: 6 m (11–33 kV); range 5–8; src.
- **mvClearanceM**: 5 m to other blocks (11–33 kV); range 3–8; src.
- **mvClearanceMinM**: 3 m (minimum when relaxed); range 2–5; judg.
- **hvAisHeightM**: 12 m (110–150 kV AIS); range 10–15; src.
- **hvGisHeightM**: 15 m (110–150 kV GIS building); range 12–18; src.
- **ehvAisHeightM**: 15 m (220–400 kV AIS); range 12–20; src.
- **ehvGisHeightM**: 18 m (220–400 kV GIS building); range 15–22; src.
- **hvClearanceM**: 10 m to other blocks (110–400 kV); range 8–15; src.
- **hvClearanceMinM**: 5 m (minimum when relaxed); range 3–8; judg.
- **pocPreferredM**: 50 m preferred maximum distance to the POC (110–150 kV); range 30–100; src.
- **noiseLwA**: 95 dB(A) sound power, 110–400 kV substation (transformers); range 85–105; judg. Screening value; verify with transformer data.
- **noiseLwAmv**: 85 dB(A) sound power, 11–33 kV substation; range 75–95; judg.

### genset

Check against: Manufacturer datasheets.

- **unitLw**: 2.5 length : width of one unit cell; range 2–3.5; judg. Unit cell = m² per unit (incl. maintenance access) at this proportion.
- **heightM**: 7 m incl. flue stub; range 6–8; src.
- **doubleDeckHeightM**: 12 m (double-deck); range 10–14; src. Source to verify against: manufacturer / project precedent.
- **doubleDeckFootprintFactor**: 0.5 × footprint per unit (double-deck); range 0.5–0.6; src. "Halves footprint per unit" (§6.3). Read by sizing (area budget) and by the blocks: ceil(units × factor) stacked positions of one unit footprint each (0.5 = two units per position).
- **clearanceM**: 3 m between units / arrays; range 2–5; src.
- **clearanceMinM**: 1.5 m (minimum when relaxed); range 1–3; judg.
- **maxDistBuildingM**: 30 m maximum distance to the building; range 15–50; src. "Adjacent to building (≤ 30 m)" (§6.3).
- **noiseLwA**: 101 dB(A) sound power per unit (acoustic container); range 95–110; judg. Screening value; verify with the manufacturer datasheet.

### fuel

Check against: Fuel storage regulations by country; fire engineer.

- **lw**: 2 length : width; range 1–4; judg.
- **heightM**: 7 m; range 5–9; src.
- **clearanceM**: 3 m to other blocks; range 2–5; judg.
- **clearanceMinM**: 1.5 m (minimum when relaxed); range 1–3; judg.
- **sepBuildingM**: 6 m to the data hall building; range 4–10; src.
- **sepBuildingMinM**: 3 m (minimum when relaxed); range 2–6; judg. For example with a fire wall; fire engineer to confirm.
- **sepBoundaryM**: 10 m to the site boundary; range 6–15; src.
- **sepBoundaryMinM**: 6 m (minimum when relaxed); range 3–10; judg.

### bess

Check against: NFPA 855 (current edition), FM Global DS 5-33, vendor UL 9540A data.

- **unitMWh**: 4 MWh per container (array unit); range 2–6; judg. Array unit for the row/column arrangement; the footprint basis is m²/MWh (TECH).
- **unitLw**: 2 length : width of one unit cell; range 1.5–3; judg.
- **heightM**: 3.5 m; range 3–4; src.
- **clearanceM**: 3 m between units / arrays; range 1–5; src.
- **clearanceMinM**: 1.5 m (minimum when relaxed); range 1–3; judg. Less than 3 m only where UL 9540A test data supports it.
- **sepBuildingM**: 10 m to occupied buildings (data hall); range 5–15; src.
- **sepBuildingMinM**: 3 m (minimum when relaxed); range 1.5–5; judg. Reduced separation needs test data or a fire-rated barrier.
- **noiseLwA**: 85 dB(A) sound power per container (PCS and HVAC); range 75–95; judg.

### gasEngine

Check against: Danish Energy Agency Technology Catalogue; vendor data.

- **unitLw**: 1.5 length : width of one unit cell; range 1–3; judg.
- **heightM**: 12 m engine hall (recips, CHP); range 9–15; src.
- **containerHeightM**: 7 m (containerised rented / HVO-diesel units); range 5–9; judg.
- **clearanceM**: 5 m to other blocks; range 3–8; judg.
- **clearanceMinM**: 3 m (minimum when relaxed); range 2–5; judg.
- **sepBoundaryM**: 15 m to the site boundary; range 10–25; src.
- **sepBoundaryMinM**: 10 m (minimum when relaxed); range 5–15; judg.
- **noiseLwA**: 105 dB(A) sound power per engine unit (attenuated hall or container); range 95–112; judg.

### turbine

Check against: Danish Energy Agency Technology Catalogue; vendor data.

- **unitLw**: 2 length : width of one unit cell; range 1.5–3; judg.
- **heightM**: 15 m; range 12–20; src.
- **clearanceM**: 5 m to other blocks; range 3–8; judg.
- **clearanceMinM**: 3 m (minimum when relaxed); range 2–5; judg.
- **sepBoundaryM**: 15 m to the site boundary; range 10–25; src.
- **sepBoundaryMinM**: 10 m (minimum when relaxed); range 5–15; judg.
- **noiseLwA**: 108 dB(A) sound power per turbine (enclosed); range 100–115; judg.

### fuelCell

Check against: Vendor data.

- **unitLw**: 2 length : width of one unit cell; range 1.5–3; judg.
- **heightM**: 4 m; range 3–5; src.
- **clearanceM**: 5 m to other blocks; range 3–8; src.
- **clearanceMinM**: 3 m (minimum when relaxed); range 2–5; judg.
- **noiseLwA**: 75 dB(A) sound power per MW; range 65–85; judg.

### hydrogen

Check against: National hazardous-substance regulation; specialist input.

- **unitLw**: 2 length : width of one unit cell; range 1.5–3; judg.
- **heightM**: 6 m; range 4–8; src.
- **clearanceM**: 25 m hazardous-area separation (indicative); range 15–50; src. Not relaxed by the layout; flagged always.
- **noiseLwA**: 95 dB(A) sound power per MW; range 85–105; judg.

### heatRejection

Check against: Vendor data.

- **moduleMW**: 5 MW rejected per array unit; range 1–10; judg. Array unit for the row/column arrangement; footprint basis m²/MW rejected (TECH).
- **unitLw**: 2 length : width of one unit cell; range 1.5–3; judg.
- **heightM**: 4 m; range 3–6; src.
- **clearanceM**: 3 m (airflow clearance); range 2–6; src.
- **clearanceMinM**: 1.5 m (minimum when relaxed); range 1–3; judg.
- **noiseLwAperMW**: 88 dB(A) sound power per MW rejected; range 80–95; judg. Ground or roof heat rejection runs day and night.

### solarGround

Check against: NREL land-use study (Ong et al., 2013) plus recent European project data.

- **heightM**: 3 m; range 2–4; src.
- **clearanceM**: 5 m to other blocks; range 3–8; src.
- **minArrayM**: 10 m minimum width of a fill area; range 6–20; judg. Residual strips narrower than this are not filled.

### solarRoof

Check against: Vendor data, fire-access guidance.

- **heightAboveRoofM**: 1 m above the roof; range 0.5–1.5; src.
- **edgeSetbackM**: 1.5 m roof-edge setback; range 1–3; src.

### wind

Check against: National planning guidance.

- **padM2**: 1,000 m² pad per turbine (0.1 ha); range 600–2,000; src.
- **noiseBufferM**: 500 m to noise-sensitive receptors; range 300–800; src.
- **noiseLwA**: 105 dB(A) sound power per turbine; range 100–110; judg.

### smr

Check against: Vendor and regulator publications.

- **haPer100MW**: 1 ha per 100 MWe (3 ha per ~300 MWe unit); range 0.7–2; src.
- **heightM**: 40 m; range 30–60; src.
- **lw**: 1.5 length : width (on-site SMR block); range 1–3; judg. Plan proportion of an on-site SMR block. No source.
- **clearanceM**: 10 m to other blocks (on-site SMR, never relaxed); range 5–50; judg. §6.3 gives no SMR clearance ("emergency planning zone not modelled; flag always"). Used only when spatial.smr.placement is "onsite"; not relaxed by the layout.
- **placement**: offsite ("offsite" | "onsite"); judg. Not placed within a typical campus boundary by default (§6.2).

### unitArrays

- **maxUnits**: 12 units per array block; range 4–24; judg. Units are grouped into arrays of at most this many.
- **maxArrayM2**: 4,000 m² maximum array block; range 1,500–10,000; judg. Large units (engines, turbines) are grouped into fewer units per array so that no array block exceeds this area (at least one unit per array).
- **rows**: 2 rows per array; range 1–4; judg. Row/column arrangement of the units in an array (§10.3).

### noise

Check against: ISO 9613-2 (geometric divergence term only).

- **hemisphericalDb**: 8 dB: Lp = Lw − 20·log10(r) − 8 (hemispherical spreading); range 8–11; src. Geometric spreading only; no barrier, ground or air absorption.

## View settings

- **view.pareto.xAxis**: follow-scoring ("follow-scoring" | "lcoe" | "npv" | "location" | "market" | "cfe" | "ttp" | "deliverability"); judg. Default x axis of the Pareto scatter. "follow-scoring" = the Cost axis metric (settings.costMetric, default LCOE); §12.2 default: cost vs carbon.
- **view.pareto.yAxis**: follow-scoring ("follow-scoring" | "lcoe" | "npv" | "location" | "market" | "cfe" | "ttp" | "deliverability"); judg. Default y axis of the Pareto scatter. "follow-scoring" = the Carbon axis metric (settings.carbonMetric, default location-based).
- **view.pareto.ttpClasses**: 5 quantile classes; run. Number of colour classes for time-to-power, quantiles over the scoring set.
- **view.pareto.canvasAbove**: 500 points; run. Points are drawn on Canvas above this count (§4), SVG at or below it.
- **view.pareto.display**: chart ("chart" | "table"); judg. Chart shown first; the table alternative is one click away and holds the same rows.
- **view.site.smallMultiples**: 6 plans; run. Number of top-ranked options drawn as small-multiple plans on the Site tab, all at the same scale (§10.7 "thumbnails of pinned or top options"; pinning is not in this slice). 0 hides them.
- **view.table.pageSize**: 50 rows per page; run. Rows per page in the ranked table and the trade-off table; every page is reachable with the pager.
- **view.siteTabBeta**: off; judg. Site tab (Beta): site layout, boundary drawing, GeoJSON/KML import and site fit. Hidden by default; when on it is labelled Beta and never affects the ranking or the PDF.

## Sensitivity (tornado)

- **sensitivity.gasPriceFactor**: 1 × current gas commodity price (country default or entered value); range 0.7–1.3; judg. Tornado driver range: low and high gas commodity price as factors on the current value. No source.
- **sensitivity.carbonPriceFactor**: 1 × current carbon price (country default or entered value); range 0.5–1.5; judg. Tornado driver range: low and high EU/UK ETS carbon price as factors on the current value. No source.
- **sensitivity.itLoadFactor**: 1 × IT load of every phase; range 0.8–1.2; judg. Tornado driver range: low and high IT load as factors on the entered phases. No source.
- **sensitivity.topDrivers**: 12 drivers shown; run. Largest-swing drivers shown in the tornado (§13.3: top 12 drivers, editable 1–30). This slice has 7 drivers and no control for this setting yet; the code clamps it to 1–30.
