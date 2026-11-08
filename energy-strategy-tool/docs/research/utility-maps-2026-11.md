# Open map data for a data centre's main utilities (research, 7 November 2026)

Part G of the research run of November 2026 (OPEN-QUESTIONS 200). The owner asked for open maps of the main utilities, factored into the app. Today the map shows only the pin and country outlines; the Site tab (Beta) uses judgement values for the off-site routes; and the idea of listing OpenStreetMap substations near the pin is paused. The app is offline, so any data must be prepared at each release and bundled. **Research and proposals only; nothing is added to `app/`.** No sample extract was made: the session's shell cannot reach OpenStreetMap services (Overpass, Geofabrik), so sizes are taken from published files or estimated, and labelled so.

Confidence labels as in the other notes.

## Today's values a map could replace

From `app/src/engine/defaults.js` (all "indicative — unverified" or "judgement"):

| Value | Today | What sets the length today |
|---|---|---|
| Grid cable route cost | €1.5 m per km (range 0.8–3 m) | Route length from the site model, from a point of connection the engineer places on the Site tab (Beta) |
| Gas connection pipe | €0.8 m per km (range 0.4–2 m) | Straight line from a gas main the engineer places (Site tab) |
| Private wire to off-site plant | 2 km (judgement, 0.5–10 km) | Fixed default |
| Gas available | "Unknown" | Engineer's entry |
| Water available | "Unknown" (m³/day) | Engineer's entry |
| District heating | "No" | Engineer's entry |
| Grid connection capex per MW | €100–150 k/MW by voltage band | No distance at all |

## 1. Electricity: substations and lines at 110 kV and above

| Source | Coverage (31 countries) | Fields | Licence, in plain words | Size once reduced | Refresh and scripting |
|---|---|---|---|---|---|
| **PyPSA-Eur prebuilt network from OpenStreetMap** (Zenodo, version 0.7, 12 Feb 2026; OSM data of 11 Feb 2026) | 36 countries, all 31 of the tool's. **220 kV to 750 kV only; no 110–150 kV.** Substations within 500 m merged into one bus; exact substation locations kept | Bus (substation) location and voltage; lines and cables with voltage, circuits, length; HVDC links; transformers | **ODbL** (as OpenStreetMap): credit "© OpenStreetMap contributors"; a distributed extract must stay under ODbL (keep it as a separate file) | buses.csv 0.8 MB for all 36 countries (published file); reduced to points with voltage, a few hundred KB (estimate) | New versions several times a year; ready-made CSVs, easy to script |
| **OpenStreetMap directly** (power=substation, power=line, with voltage tags), via Geofabrik extracts or Overpass at release | All 31, including 110–150 kV. Quality uneven: lines without a voltage tag are 0.6 % of length in Portugal, 9 % in the Netherlands, 20 % in Spain, 34 % in Germany, 36 % in Great Britain, 37 % in Ireland (OpenInfraMap, 3–7 Nov 2026) | Location, voltage, operator, name, sometimes frequency and circuits; no capacity | ODbL, as above | Substations at 110 kV and above for 31 countries: likely 1–3 MB as compact points (estimate, not measured: no extract could be made) | Continuous; a release script would download Geofabrik extracts (several GB in all) and filter them |
| **ENTSO-E grid map** | Transmission (mostly 220 kV and above) for ENTSO-E members | Lines and substations, schematic | Not an open licence; the map is for viewing (not checked in detail) | — | Not suitable to bundle |
| **National operators' maps** (e.g. REN, Red Eléctrica, TenneT, National Grid ESO capacity maps) | One country each | Often capacity headroom, which no open source has | Varies; mostly not open for redistribution | — | Manual |

**Withheld for security:** Norway's power preparedness regulation treats detailed power system information as confidential ("kraftsensitiv", kbf. § 6-2): substation layouts, individual transformer ratings, cable routes and burial methods are withheld, while overview maps with substations as points and lines with their voltage are not sensitive (NVE's draft guide, 2024). Other countries were not checked one by one; OpenStreetMap's coverage reflects what mappers could see.

**How it could enter the app (proposal):** the distance from the pin to the nearest substation at the campus's voltage band (110–150 kV or 220–400 kV) sets the **default route length** for the grid cable cost (replacing the Site tab's point of connection when the engineer has not placed one), flagged "assumed: nearest mapped substation, straight-line distance × a route factor". The substation's highest voltage could also set the default voltage band, and so the per-MW connection costs. It would **not** say whether the substation has capacity; a flag should say so.

## 2. Gas: high-pressure pipelines and offtake points

| Source | Coverage | Fields | Licence | Size | Refresh |
|---|---|---|---|---|---|
| **SciGRID_gas IGGIELGN** (DLR, released July 2021, data mostly 2019) | European transmission network: about 237,000 km of pipeline segments, 248 compressor stations, 32 LNG terminals, 294 storages, 109 border points, artificial demand nodes | Diameter (32 % of segments from sources), capacity (13 %), pressure; the rest estimated | **CC BY** (credit only) | Not measured; a simplified line layer for 31 countries is likely a few MB (estimate) | No regular updates found since 2021 |
| **OpenStreetMap** (man_made=pipeline, substance=gas) | Uneven; many transmission pipelines are buried and unmapped | Location; sometimes operator, diameter | ODbL | Not measured | Continuous |
| **ENTSOG transparency platform and map** | Interconnection points, storage, LNG; capacities | Points with technical capacity | Data use terms not checked; points only | Small | Yearly map |
| **Global Energy Monitor, gas pipeline tracker** | Worldwide, with planned pipelines | Route, status, capacity | Not checked in this run | — | Regular |

**Offtake points** (where a campus could connect) are not in any open source found: SciGRID's demand nodes are artificial.

**How it could enter the app (proposal):** the distance from the pin to the nearest transmission pipeline sets the **default gas connection length** (replacing the Site tab's gas main point when none is placed) and turns "gas available: Unknown" into "pipeline within X km (mapped, 2019 data)", flagged as an assumption about access and capacity.

## 3. Water: mains, treatment works and cooling-water sources

| Source | Coverage | Fields | Licence | Size | Refresh |
|---|---|---|---|---|---|
| **EEA, Urban Waste Water Treatment Directive plants** (spatial data) | EU and EEA countries (EEA39); the version read is for 2013–2014 and marked superseded (newer reporting rounds exist) | Plant location, capacity (population equivalent), load treated, treatment type | **CC BY 4.0** (EEA) | Small (thousands of points) | Every two years |
| **Copernicus EU-Hydro river network** (2006–2012 imagery) | EEA38 and the United Kingdom | Rivers, lakes and wide rivers, catchments, drainage lines | **Free, full and open** (Copernicus policy): credit the source, do not imply EU endorsement, state changes | About 2 GB in full; a reduced layer of large rivers and lakes would be far smaller (estimate) | Not regularly updated; "not yet validated" |
| **OpenStreetMap** (water works, water towers; mains rarely mapped) | Mains almost absent | Location | ODbL | — | Continuous |

**How it could enter the app (proposal):** flags only. Nearest large river or lake and its distance ("cooling water source within X km"), and nearest waste water treatment plant and its size (for treated-water supply). Neither proves water is available or licensed; the default "water available: Unknown" would stay, with the distances shown beside it.

## 4. Telecoms: fibre routes, internet exchanges and cable landing stations

| Source | Coverage | Fields | Licence | Use here |
|---|---|---|---|---|
| **PeeringDB** (internet exchanges and colocation facilities) | Worldwide, good for exchanges and facilities | Name, address, often coordinates | **Not open for redistribution:** downloading in full is for network operations only, and reproducing or passing on the data needs PeeringDB's permission | Not usable without permission |
| **TeleGeography submarine cable map** | Worldwide cables and landing points | Route, landing points, owners | Commercial licence for the geocoded data; an older public repository carried a Creative Commons licence (version unconfirmed) | Not usable without checking |
| **OpenStreetMap** (telecom=exchange, telecom=data_center, cable landing tagging) | Patchy; long-distance fibre routes are rarely mapped | Location, name | ODbL | Possible for landing stations and exchanges, with gaps |

**How it could enter the app (proposal):** a flag only, and only with an open source: "nearest mapped cable landing station / internet exchange: X km". The best data (PeeringDB) needs permission first. Fibre routes: no open source found.

## 5. District heating networks and heat sources

| Source | Coverage | Licence | Note |
|---|---|---|---|
| **Pan-European Thermal Atlas (Peta) and sEEnergies layers** (Heat Roadmap Europe, Aalborg University) | EU and UK: heat demand density, district heating areas, excess heat sources | Not confirmed in this run (the pages could not be read) | Best known source for heat demand and existing district heating areas |
| **Hotmaps** (EU project) | EU28 hectare-level heat demand and related layers | Reported as open; not confirmed in this run | — |
| **OpenStreetMap** (heat networks, heating plants) | Very patchy | ODbL | — |

**How it could enter the app (proposal):** a flag on the heat-reuse option: "existing district heating area within X km" or "heat demand density around the site", replacing "district heating: No" as a default only when a mapped network is nearby, flagged as an assumption about connection.

## Licences together

- **CC BY sources** (SciGRID_gas, EEA): credit only; can be bundled in the public repository and the Windows program.
- **ODbL sources** (OpenStreetMap and data made from it, including PyPSA-Eur's network): credit "© OpenStreetMap contributors", and any bundled extract stays under ODbL. Keep each in its own file so the rest of the tool is not affected.
- **Copernicus**: credit and a "funded by the European Union" note.
- **Not open**: PeeringDB, TeleGeography (geocoded), ENTSO-E map: need permission.

## Ranked proposal (for the owner to choose; nothing decided)

1. **Electricity, 220 kV and above, from PyPSA-Eur's OpenStreetMap network** (ODbL, ready-made, 0.8 MB of substations for 36 countries): nearest substation sets the default grid route length and voltage band. Replaces the Site tab's judgement point of connection when none is placed. Add 110–150 kV from OpenStreetMap directly later (needs a release script on a machine that can reach Geofabrik).
2. **Gas, from SciGRID_gas** (CC BY): nearest transmission pipeline sets the default gas connection length and turns "gas available: Unknown" into a mapped distance. Data from 2019: flag its age.
3. **Water, from EEA and Copernicus** (open): flags only (distance to a large river or lake, to a waste water treatment plant).
4. **District heating, from Heat Roadmap Europe layers**, once the licence is confirmed: a flag on the heat-reuse option.
5. **Telecoms:** only after permission from PeeringDB (or using OpenStreetMap's patchy points): a flag.

Each layer should carry its own data date and licence line in the app and the PDF, and every distance should be flagged "mapped, straight line", never presented as a surveyed route.

## Questions for the owner (copied to the progress file)

1. Which utilities first (the ranking above, or another order)? **Answered 2026-11-07 by the owner: the ranking above, with fibre routes named in telecoms and district cooling added as a sixth utility (OPEN-QUESTIONS 222). Fibre routes and district cooling are on `further-research-list-2026-11.md`.**
2. How each enters: as a default distance that drives a cost (electricity, gas), or only as a flag (water, telecoms, heat)? **Answered 2026-11-07 by the owner: all six utilities (electricity, gas, water, district heating, fibre, district cooling) are warnings only; no mapped distance changes a cost (OPEN-QUESTIONS 223).**
3. ODbL data (OpenStreetMap, PyPSA-Eur network) in the public repository and the Windows program, kept as separate files: acceptable? **Answered 2026-11-07 by the owner: yes (OPEN-QUESTIONS 224).**
4. Should a release script for OpenStreetMap extracts be built (it needs a machine that can reach Geofabrik; this session cannot)?

## Sources

| Source | Type | Published | Accessed | URL |
|---|---|---|---|---|
| Xiong et al., "Prebuilt electricity network for PyPSA-Eur based on OpenStreetMap data", version 0.7 | Community data (research) | 12 Feb 2026 | 7 Nov 2026 | https://zenodo.org/records/18619025 |
| OpenInfraMap, statistics for PT, ES, NL, GB, IE, DE (line lengths by voltage) | Community data (OpenStreetMap) | 3–7 Nov 2026 | 7 Nov 2026 | https://openinframap.org/stats/area/Portugal |
| Diettrich et al., "SciGRID_gas: data model of the European gas transport network" (IGGIELGN) | Research (DLR) | 2022 (data 2021) | 7 Nov 2026 | https://arxiv.org/pdf/2201.08827 |
| EEA, "Urban Waste Water Treatment Directive, treatment plants (spatial data)" | EU body | Nov 2017 (superseded by later rounds) | 7 Nov 2026 | https://sdi.eea.europa.eu/catalogue/srv/api/records/38d0fcfd-ee1e-4de7-b4a0-cd87409b8fa5 |
| Copernicus Land Monitoring Service, "EU-Hydro river network database" | EU body | v1.3, 2020 | 7 Nov 2026 | https://land.copernicus.eu/api/en/products/eu-hydro/eu-hydro-river-network-database |
| PeeringDB, "Acceptable use policy" | Community data (terms) | Undated | 7 Nov 2026 | https://PeeringDB.com/aup |
| "Finding datasets to map the undersea cable network" (blog) | Community | Undated | 7 Nov 2026 | https://falliblevagrant.codeberg.page/finding-datasets-to-map-the-undersea-cable-network.html |
| NVE, draft guide to kbf. § 6-2 (power-sensitive information) | Regulator | 2024 (draft) | 7 Nov 2026 | https://nve.no/media/17578/midlertidig-veileder-for-kbf-5-2.pdf |
| OSM Foundation, "Licence and Legal FAQ" | Community (licensor) | Undated | 7 Nov 2026 | https://osmfoundation.org/wiki/Licence_and_Legal_FAQ |

Not reachable: overpass-api.de, download.geofabrik.de, taginfo (shell, refused); the EEA data page (refused; the catalogue record was used); the Duke Nicholas Institute page on Peta and the sEEnergies PDF (unreadable). ENTSOG and Global Energy Monitor terms were not checked in this run.
