# Renewable plant data: powerplantmatching against OpenStreetMap, a coverage check (research, 7 November 2026)

Part E of the research run of November 2026 (OPEN-QUESTIONS 194 to 197). The owner asked for nearby renewable plants on the map and in the drop box, with every plant use (rows 194–196), and chose to decide the data source after a coverage check (row 197). This note compares the two candidates for wind, solar and hydro in six countries (PT, ES, NL, GB, IE, DE). **It decides nothing.**

Confidence labels as in the other notes; every count below is "worked out" from the data, with the method stated.

## In short

- **powerplantmatching** (PyPSA, CC BY 4.0, the source of today's gas plant list) has every plant with coordinates, capacity and almost always a start date, and can be filtered by size. It is close to the official totals for wind in Spain, the Netherlands, Portugal and Ireland. Its weak points: **German wind is listed turbine by turbine** (from the German register), so at 10 MW or more it shows almost none of Germany's wind farms; **Great Britain's wind is over-counted** (39.6 GW operating against an official 32.9 GW); it holds **planned and closed units**, which must be filtered out by date; and solar is utility-scale only.
- **OpenStreetMap** (ODbL), read through OpenInfraMap's country statistics because the session's shell cannot reach OpenStreetMap services, has wind farms as farms (Germany: 1,674 wind plants, 49.2 GW) but **misses capacity on many plants** (German wind 49.2 GW of an official 77.7 GW; Spanish solar and wind well short). Plant size, start dates and status are tagged unevenly; there are no size bands without processing the raw data.
- **Licences:** CC BY 4.0 needs attribution only. ODbL needs attribution and **share-alike for a database you distribute**: an OpenStreetMap extract bundled in the public repository and in the Windows program would itself have to be offered under ODbL. Kept as a separate file ("collective database"), the rest of the tool is not affected.
- **Size:** a bundled list of all wind, solar and hydro plants of 10 MW or more in the 31 countries from powerplantmatching is **10,529 plants, about 0.7 MB as compact JSON (0.21 MB compressed)**; at 50 MW or more, 2,452 plants and 0.16 MB. Today's gas list is 79 KB.
- **Recommendation for the owner (not a decision): powerplantmatching**, the same pipeline as the gas plants, with two fixes at build time: group German wind turbines into farms by location, and keep only plants operating at the build date. OpenStreetMap could be added later as a check or for the map layer.

## Method

- **powerplantmatching:** the current `powerplants.csv` from GitHub (SHA-256 `ceccce02…3d78`, the same file as the commit already bundled for gas plants, 2889ad9d), 302,301 rows. Fuel types Wind, Solar and Hydro. "Operating" means a start year of 2025 or earlier (or none) and no closure year of 2025 or earlier. Counts and MW at 1 MW or more, 10 MW or more and 50 MW or more. Script kept in the session's scratch folder (not committed); it is about 40 lines of Python and easy to repeat.
- **OpenStreetMap:** OpenInfraMap's country statistics pages (plants by source, first source only, with the tagged output summed), updated 3–7 November 2026. Overpass, taginfo and Geofabrik could not be reached from the session's shell, so no size bands, coordinate shares or date shares could be computed from the raw data.
- **Official figures:** wind from WindEurope's 2025 statistics (end of 2025); hydro from IRENA's Renewable Capacity Statistics 2026 (end of 2025). National solar totals were not taken: they include rooftop systems that neither source is meant to hold, so a share would mislead.

## Coverage by country (operating plants)

powerplantmatching: count / GW at 1 MW or more, 10 MW or more, 50 MW or more. OpenStreetMap (OpenInfraMap): count / GW with an output tag, all sizes.

| Country | Type | ppm ≥ 1 MW | ppm ≥ 10 MW | ppm ≥ 50 MW | OSM (all) | Official (end 2025) | ppm ≥ 1 MW share | OSM share |
|---|---|---|---|---|---|---|---|---|
| PT | Wind | 265 / 6.3 | 139 / 5.8 | 32 / 3.4 | 360 / 6.9 | 6.0 (WindEurope) | 105 % | 115 % |
| PT | Solar | 175 / 4.0 | 81 / 3.7 | 18 / 2.1 | 1,028 / 4.0 | — | — | — |
| PT | Hydro | 133 / 8.4 | 50 / 8.1 | 30 / 7.7 | 197 / 8.4 | 8.4 (IRENA) | 100 % | 100 % |
| ES | Wind | 787 / 32.5 | 786 / 32.5 | 214 / 15.7 | 1,060 / 26.2 | 33.2 | 98 % | 79 % |
| ES | Solar | 1,890 / 41.5 | 651 / 36.8 | 207 / 27.2 | 3,336 / 26.6 | — | — | — |
| ES | Hydro | 175 / 18.2 | 148 / 18.1 | 83 / 16.3 | 564 / 12.7 | 20.1 | 91 % | 63 % |
| NL | Wind | 145 / 12.1 | 138 / 12.1 | 45 / 10.2 | 215 / 10.7 | 11.8 | 103 % | 91 % |
| NL | Solar | 537 / 7.2 | 228 / 5.8 | 20 / 1.7 | 932 / 6.5 | — | — | — |
| NL | Hydro | 0 | 0 | 0 | 4 / 0.04 | 0.04 | 0 % | 94 % |
| GB | Wind | 788 / 39.6 | 428 / 38.1 | 121 / 31.3 | 712 / 36.6 | 32.9 (UK) | 120 % | 111 % |
| GB | Solar | 1,259 / 13.7 | 400 / 9.9 | 23 / 1.8 | 2,009 / 13.0 | — | — | — |
| GB | Hydro | 85 / 4.8 | 45 / 4.6 | 12 / 3.8 | 219 / 4.5 | 4.8 (UK) | 100 % | 94 % |
| IE | Wind | 132 / 4.7 | 125 / 4.6 | 28 / 2.3 | 220 / 4.9 | 5.1 | 92 % | 95 % |
| IE | Solar | 39 / 1.4 | 19 / 1.3 | 12 / 1.1 | 59 / 1.4 | — | — | — |
| IE | Hydro | 6 / 0.55 | 6 / 0.55 | 3 / 0.4 | 12 / 0.51 | 0.53 | 104 % | 97 % |
| DE | Wind | 25,902 / 74.7 | **66 / 0.8** | **0** | 1,674 / 49.2 | 77.7 | 96 % | 63 % |
| DE | Solar | 6,807 / 35.6 | 731 / 18.8 | 78 / 6.6 | 6,746 / 13.6 | — | — | — |
| DE | Hydro | 355 / 11.3 | 117 / 10.4 | 38 / 8.8 | 679 / 9.4 | 11.0 | 103 % | 85 % |

Notes on the table:

- **powerplantmatching also holds 54.8 GW of planned German wind and 11.2 GW of planned German solar** (start years after 2025), and 2.4 GW of planned Spanish solar; these are excluded above, and must be excluded at build time.
- **German wind is per turbine** in powerplantmatching (the register lists units), so the 10 MW and 50 MW columns lose almost all of it. Grouping turbines within, say, 2 km into one farm at build time would fix this (a judgement value; not tested).
- **Over 100 %** (GB wind, PT wind) points to duplicates or sites counted twice; Great Britain's 39.6 GW against 32.9 GW is the largest gap found. The "official" UK hydro and wind figures are for the United Kingdom, which includes Northern Ireland.
- OSM shares count only plants with a capacity tag; many plants lack one, which is why OSM is short for German wind, Spanish wind and Spanish hydro.
- Coordinates: 100 % of powerplantmatching rows in these six countries have coordinates; start dates 71–100 % depending on country and type (lowest: Irish solar). For OpenStreetMap the shares could not be measured.

## Licences in plain words, and what they mean here

- **powerplantmatching output (`powerplants.csv`): CC BY 4.0.** Anyone can copy, change and redistribute it, including in the public repository and inside the Windows program, as long as the credit is shown (the tool already shows "Power plant data: powerplantmatching, PyPSA (CC BY 4.0)"). The code is MIT. One point for the owner: about 2 % of its renewable rows (5,410 of 253,262) list OpenStreetMap among their inputs; powerplantmatching publishes the combined file under CC BY 4.0, and this note does not judge whether that is right.
- **OpenStreetMap: ODbL 1.0.** Attribution "© OpenStreetMap contributors" with a link to the copyright page. **Share-alike:** a database made from OpenStreetMap and distributed publicly (an extract in the public repository, or bundled in the Windows program) must be offered under ODbL too, or the means to recreate it. A **produced work** (a map image, a screenshot in the PDF) can be under any licence, with attribution, but recipients may ask for the data behind it. Kept as a **separate file**, OSM data stays a "collective database": the tool's own code and other data are not affected.
- **For the offline Windows program:** both can be bundled. CC BY needs the credit line; ODbL needs the credit and a note that the bundled OSM extract is under ODbL (and the extract itself, or a build script, made available).

## Size of a bundled list for all 31 countries (powerplantmatching)

Worked out from the current file, operating or not (planned units would be removed at build time, making it smaller):

| Filter | Plants | Compact JSON | Compressed |
|---|---|---|---|
| Wind, solar, hydro, 10 MW or more | 10,529 (wind 4,725, solar 3,812, hydro 1,992) | 0.71 MB | 0.21 MB |
| The same, 50 MW or more | 2,452 | 0.16 MB | 0.05 MB |

Fields: country, type, technology, name, MW, start year, latitude, longitude. Largest countries: France 1,657, Spain 1,606, Germany 1,447 (before grouping wind turbines), Great Britain 875. Malta, Cyprus and Iceland have no rows at 10 MW or more in these types (Iceland's hydro and geothermal are not listed under this filter; geothermal was not counted).

## Comparison

| | powerplantmatching | OpenStreetMap |
|---|---|---|
| Licence | CC BY 4.0 (credit only) | ODbL (credit and share-alike for distributed databases) |
| Capacity per plant | Always | Often missing |
| Start date | Usually (71–100 %) | Unmeasured; often missing |
| Status (planned, closed) | Dates allow filtering | Unmeasured |
| Wind farms as farms | Yes, except Germany (turbines) | Yes |
| Duplicates | Some (GB over-count) | Unmeasured |
| Reachable from the session | Yes (GitHub) | No (raw data); statistics pages only |
| Build pipeline | Exists (`plant-data/build-plants.mjs`) | Would need a new one (Geofabrik or Overpass at release) |
| Refresh | Updated irregularly (the file has not changed since the gas list was built, 2026-10-31) | Continuous |

## Recommendation (for the owner to decide)

Use **powerplantmatching** for renewable plants, extending today's gas pipeline, with two build-time steps: (1) keep only plants operating at the build date; (2) group German wind turbines into farms by distance. Show the size and distance filters the owner chose (row 196) on top. Keep OpenStreetMap as a possible second step for the map layer or as a cross-check where powerplantmatching looks wrong (Great Britain's wind), with its ODbL file kept separate.

## Questions for the owner (copied to the progress file)

1. Source: powerplantmatching (recommended), OpenStreetMap, or both?
2. Accept the build-time grouping of German wind turbines into farms (a judgement distance), or show German wind turbine by turbine?
3. powerplantmatching's own licence mix (it draws on OpenStreetMap for about 2 % of renewable rows): accept its CC BY 4.0 statement, or ask a licensing adviser?

## Sources

| Source | Type | Published | Accessed | URL |
|---|---|---|---|---|
| PyPSA, powerplantmatching, `powerplants.csv` (commit 2889ad9d) and README (licence) | Community data | 2026 | 7 Nov 2026 | https://github.com/PyPSA/powerplantmatching |
| OpenInfraMap, statistics for Portugal, Spain, Netherlands, United Kingdom, Ireland, Germany | Community data (OpenStreetMap) | 3–7 Nov 2026 | 7 Nov 2026 | https://openinframap.org/stats/area/Portugal (and /Spain, /Netherlands, /United Kingdom, /Ireland, /Germany) |
| WindEurope, "Wind energy in Europe: 2025 statistics and the outlook for 2026–2030", table 1 (copy hosted by Rinnovabili) | Industry body | Feb 2026 | 7 Nov 2026 | https://www.rinnovabili.it/wp-content/uploads/2026/02/WindEurope-European-Stats-2025.pdf |
| IRENA, "Renewable Capacity Statistics 2026" (copy) | International agency | 2026 | 7 Nov 2026 | https://bdd.pseau.org/outils/ouvrages/irena_renewable_capacity_statistics_2026_2026.pdf |
| OSM Foundation, "Licence and Legal FAQ" | Community (licensor) | Undated | 7 Nov 2026 | https://osmfoundation.org/wiki/Licence_and_Legal_FAQ |

Not reachable from the session's shell: overpass-api.de, taginfo.openstreetmap.org, download.geofabrik.de, openinframap.org (all refused by the session's network allowlist). The OpenStreetMap copyright page needed a permission the session could not get; the OSM Foundation's FAQ was used instead.
