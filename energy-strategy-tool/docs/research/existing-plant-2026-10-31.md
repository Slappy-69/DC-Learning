# Existing gas plant near the site: research note (2026-10-31)

Owner, 2026-10-31: "I want the app to use local assets as more and more gas plants get decommissioned from the grid and can be used to data centres … They should be part of the analysis." So every suitable plant near the site enters the option generator automatically, in every way it could be used, and is ranked with the new-build strategies.

## What the tool does today (work package 12)

One plant per study, typed in by the engineer, leased by the month, used as bridging or firm plant (OPEN-QUESTIONS 78–82). No purchase, no grid connection takeover, no closure date, no list of plants.

## Data: who publishes a list of European gas plants

| Source | What it holds | Licence | Notes |
|---|---|---|---|
| **powerplantmatching** (PyPSA), `powerplants.csv` on GitHub | One merged record per plant from GEM, ENTSO-E, OPSD, JRC, MaStR (Germany), WRI, OSM and others; name, fuel, technology, country, capacity, efficiency, `DateIn`, `DateRetrofit`, `DateOut`, latitude, longitude, the source ids | Data CC BY 4.0, code MIT | Read 2026-10-31: 302,301 records, 40 MB. Natural gas: 14,567 records (13,950 German, mostly small MaStR units); **626 of 50 MW or more**, 254.5 GW. `DateOut` filled on 70 of the 626, and some of those are already closed (Didcot 2024, Hemweg 2019). Some `DateIn` values are the site's first year, not the plant's (Gersteinwerk 1917). Reachable from GitHub, so a release build can download it |
| Global Energy Monitor, Global Integrated Power Tracker / Europe Gas Tracker | Unit-level: capacity, status (operating, announced, mothballed, retired), owner, start year, retirement date, location (exact or approximate) | Not stated on the download page read; the download needs a form | Rolling updates, latest September 2026. Already one of powerplantmatching's inputs |
| Open Power System Data, conventional power plants | Germany (with BNetzA shutdown year) and 16 other countries, with coordinates | Text CC BY; data licence not stated | Last version 2020-10-01: out of date |

Eemshaven test (powerplantmatching, within about 15 km of the site):

| Name in the list | Capacity | Technology | In | Out |
|---|---|---|---|---|
| Eem (Eemscentrale) | 3,210 MW | CCGT | 1995 | 2030 |
| Magnum Centrale | 1,311 MW | CCGT | 2013 | — |
| Delesto (Delfzijl) | 523 MW | CCGT | 1987 | — |
| Eemshaven | 1,410 MW | CCGT | 1976 | — (probably the same plant as "Eem", listed twice) |
| Eem | 131 MW | Steam turbine | 1987 | — |

So the list finds the right plants, but it also carries duplicates and few closure dates. The engineer must see each plant's values and their source, and be able to correct them.

## Practice: old plant sites becoming data centres

Reported cases and plans: Engie, RWE and Enel looking to convert closing coal and gas sites (Reuters, via oEnergetice, August 2025); Drax, a 1 GW data centre at a former coal site at Selby (DCD, 2026); EDF and OpCore in France (2026); Nvidia looking at former German nuclear sites (October 2026). The value named in each case is the same: an existing grid connection, water for cooling and land already in industrial use, against a new grid connection that can take more than ten years.

Not found yet: the rules in each country for handing a closing plant's grid connection to a new user (for example TenneT's queue rules in the Netherlands, transfer of transmission entry capacity in Great Britain). Until researched, any takeover is an assumption, labelled and flagged.

## Sources (accessed 2026-10-31)

- [powerplantmatching, GitHub](https://github.com/PyPSA/powerplantmatching) and [documentation](https://powerplantmatching.readthedocs.io/)
- [GEM Global Integrated Power Tracker, download page](https://globalenergymonitor.org/projects/global-integrated-power-tracker/download-data/); [Europe Gas Tracker methodology](https://globalenergymonitor.org/projects/europe-gas-tracker/methodology/)
- [Open Power System Data, conventional power plants](https://data.open-power-system-data.org/conventional_power_plants/latest/)
- [oEnergetice: old power plants in Europe face a new future as data centres](https://oenergetice.cz/en/electricity/some-old-power-plants-in-europe-face-a-new-future-as-data-centers)
- [DCD: Drax floats 1 GW data centre at former coal plant in Selby](https://www.datacenterdynamics.com/en/news/drax-floats-plans-for-1gw-data-center-at-former-coal-plant-in-selby-yorkshire/)
- [TechRadar: tech giants looking to repurpose old power stations](https://www.techradar.com/pro/tech-giants-want-to-repurpose-old-power-stations-for-data-center-demand)
