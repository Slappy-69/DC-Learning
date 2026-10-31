# Hourly weather: research (2026-10-30)

Work package 0 (research the defaults), on the owner's request of 2026-10-30: "Start with the real hourly weather,
start with the research". This note is research only. Nothing in the app has changed. The decision at the end is the
owner's.

Background: the walkthrough (2026-10-21, BRIEF §5.1 and §18) asked for hourly temperatures "from NOAA station records
cleaned into a usable year by the app (method to research), or from an uploaded EPW file", with design conditions from
the nearest ASHRAE station. OPEN-QUESTIONS 65 moved this to package 0 because the method was unresearched.

## What the model does today

`app/src/engine/profiles.js` makes a synthetic year for the site: dry-bulb temperature from a seasonal curve, a daily
swing and random day-to-day weather (lines 47–89), and wet-bulb as dry-bulb minus a made-up depression (line 88). The
design temperature is the hottest synthetic hour (lines 159–165). The PUE each hour and the design load follow from
these (`profiles.js` 181 and 203; `sizing.js` 79), and the "weather and grid stress" flexibility trigger uses the same
temperature. So the weather touches every option's energy, the design load and the sizing.

## Sources compared

| Source | What it is | Variables | Gaps to clean | Licence for bundling in the tool | Effort |
|---|---|---|---|---|---|
| **NOAA ISD / GHCNh** (station records; the walkthrough's choice) | Hourly observations from airport and synoptic stations. NOAA announced in 2023 that ISD would be replaced by GHCNh; the ISD page still says it is active | Dry bulb, dew point, humidity, pressure, wind | Yes: missing hours, station moves, different reporting intervals | **Risk.** Non-US data carry the WMO Resolution 40 notice: "can be used within the U.S. or for non-commercial international activities without restriction", and "the non-U.S. data cannot be redistributed for commercial purposes". The tool is for consultancies, so bundling cleaned European station data in it is commercial redistribution | High: download, quality control, gap filling, then the typical-year method |
| **PVGIS TMY** (European Commission, JRC) | A ready typical year for any point, made by the ISO 15927-4 method | Dry bulb, humidity, irradiance, wind, pressure; outputs CSV, JSON or **EPW** | No (reanalysis and satellite data, complete) | **Likely open, to confirm.** JRC data follow the Commission's reuse rules (Decision 2011/833/EU) and its "fully, freely, openly" open-data principles, but the PVGIS pages do not state a licence. Needs a written confirmation or the exact licence text before bundling | Low: one call per point at each release (limit 30 calls a second) |
| **ERA5** (Copernicus reanalysis, every hour since 1940, about 31 km grid) | Raw hourly data, from which the tool's own typical year would be built | Dry bulb, dew point, pressure, wind, radiation | No (complete by construction) | **Clear.** CC-BY 4.0 since 2 July 2025, with attribution | Medium: download at each release, then the ISO 15927-4 method in our release script |
| **TMYx** (Climate.OneBuilding) | Ready EPW files for about 17,000 stations, made from ISD with ISO 15927-4 | Full EPW | No (already done) | **Not allowed.** "All Rights Reserved", no licence, and built on ISD (so the WMO Resolution 40 notice too). Fine for an engineer to upload their own copy | None for bundling (not possible); good source for uploads |
| **EPW upload** by the engineer | Any EPW file the engineer has | Full EPW | No | The engineer's responsibility; nothing bundled | Low: a file reader in the app, offline |

## How a usable year is made (ISO 15927-4)

The standard method, as described by the JRC team that runs PVGIS (Huld et al., 2018):

1. For each calendar month and each candidate year, compare that month's daily means of temperature, humidity and
   solar radiation with the long-term distribution (the Finkelstein–Schafer statistic).
2. Rank the years for each quantity, add the ranks, and keep the three best years for each month.
3. Of those three, pick the one whose wind speed is closest to the long-term mean.
4. Join the twelve chosen months, smoothing the 8 hours either side of each join.

Two points matter for this tool:

- **A typical year is not a design year.** By construction it leaves out extreme months, so its hottest hour sits
  below a design condition. Today the tool takes the design temperature from the hottest hour of its synthetic year.
  With a typical year that would understate the design load. The design value should come from the full multi-year
  record (for example a 0.4 % or n-year extreme) or from ASHRAE, flagged, as the brief already says.
- **Wet bulb** is not in an EPW or in PVGIS directly. It follows from dry bulb, humidity and pressure by the standard
  psychrometric equations, which would replace the made-up depression in `profiles.js` line 88.

The same paper found that building a typical year adds more error than the difference between reanalysis and station
data, and suggests a long series of real years is better than a typical year. With ERA5 the tool could run a typical
year for the ranking and keep the hottest real years for sizing.

## Keeping the Windows program offline

The program must make no network connection (check D12). So the weather has to be prepared at each release and bundled,
and the app picks the nearest point to the pin. Size, my arithmetic (8,760 hours × 2 values, dry bulb and dew point, at
2 bytes each, before compression): **35 kB a point**, so about 35 MB for 1,000 points and about 175 MB for 5,000 points
(roughly a 0.5° grid over Europe's land). The program is already about 370 MB. A 1° grid, or one point per region,
keeps it near 35 MB. The download at release needs internet, so it runs on GitHub or the owner's computer, not in a
Claude session (the session's network is limited).

## Recommendation

*Overruled by the owner on 2026-10-30 (NOAA station records plus an EPW upload, OPEN-QUESTIONS 106). Kept for the record. Design basis decided on 2026-10-31 (OPEN-QUESTIONS 115: n = 20 sizing, n = 50 check).*

1. **Build the EPW upload in every case.** It is cheap, offline, and lets an engineer use any file they hold (TMYx,
   their own station data, a future-climate file).
2. **Bundled default: a typical year from ERA5, made by our own release script with ISO 15927-4.** ERA5 is the only
   source with a clear licence for bundling (CC-BY 4.0) and needs no gap cleaning. PVGIS gives the same kind of year with
   less work, but its licence must be confirmed first; it can replace step 2 if the JRC confirms reuse in writing.
3. **Drop NOAA station cleaning as the bundled source** (it reverses part of the walkthrough decision): the WMO
   Resolution 40 notice forbids commercial redistribution of non-US station data, and it needs the most cleaning.
4. **Design conditions from the multi-year record**, not the typical year; ASHRAE stays named and flagged where its
   licence allows.

Not researched yet: the PVGIS licence text; how close ERA5's hottest hours come to station extremes in Europe (a check
against a few stations is needed before using ERA5 extremes for design); the grid spacing the owner wants (size against
accuracy); whether solar and wind profiles should come from the same data (they are synthetic today too).

## Owner's decision (2026-10-30)

Route C, NOAA station records, with the EPW upload (OPEN-QUESTIONS 106). In the owner's words: "I'd like the NOAA and despite this being for a consultant at this point is not commercial usage by no means". The WMO Resolution 40 condition stays recorded; if the tool's use becomes commercial, the bundled source must be revisited (ERA5 is the fallback with a clear licence).

## Sources (accessed 2026-10-30)

- NOAA NESDIS, "Global Historical Climate Network hourly / Integrated Surface Data global hourly" (2023 notice):
  https://www.nesdis.noaa.gov/news/global-historical-climate-network-hourly-integrated-surface-data-global-hourly
- NOAA NCEI, Integrated Surface Database: https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database
- NOAA NCEI, GHCNh version 1 metadata: https://www.ncei.noaa.gov/metadata/geoportal/rest/metadata/item/gov.noaa.ncdc:C01688/html
- WMO Resolution 40 notice for NOAA non-US data (IRI copy): https://iridl.ldeo.columbia.edu/SOURCES/.NOAA/.NCDC/.GDCN/.agreement.html
  and the EnergyPlus support list quoting NOAA (2012): https://onebuilding.org/archive/energyplus-support/msg26071.html
- JRC, PVGIS TMY generator: https://joint-research-centre.ec.europa.eu/PVGIS/tools/tmy_en
- JRC, PVGIS API (rate limit, EPW output): https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/api-non-interactive-service_en
- JRC data policy: https://joint-research-centre.ec.europa.eu/jrc-mission-statement-work-programme/data-policy_en
- ECMWF forum, "CC-BY licence to replace Licence to use Copernicus Products on 02 July 2025":
  https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464
- Climate.OneBuilding (TMYx): https://climate.onebuilding.org/ and https://climate.onebuilding.org/sources
- Huld, T. et al. (2018), Atmosphere 9(2), 53, doi:10.3390/atmos9020053 (the PVGIS typical-year method, cited by the
  PVGIS TMY page; CC-BY 3.0): https://www.mdpi.com/2073-4433/9/2/53
