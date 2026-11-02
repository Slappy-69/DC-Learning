# Weather data (release-time)

Builds the bundled NOAA station weather years (owner's decision 2026-10-30, OPEN-QUESTIONS 106–107; research in
`../docs/research/hourly-weather-2026-10-30.md`). Needs internet, so it runs on GitHub (workflow **Weather data**:
by hand for a full build, or a 3-station trial on pushes to a weather branch), never inside the app or a Claude session.

- `build-stations.mjs`: reads the GHCNh station list, keeps stations in the tool's 31 countries, reads each station's
  yearly Parquet files (only the columns needed), and makes a typical year by ISO 15927-4 plus design conditions from
  all years. The method is `../app/src/engine/weathertmy.js`, tested in the app's Node suite (test 49).
- `merge-bundle.mjs`: joins the country groups into `weather-stations.json` (and `.gz`) with a summary.

Usable station (judgement, labelled as such): every calendar month has at least 10 usable years within the years read
(default 2010–2024). A month of one year is usable when at least 80 % of its hours have a reading after gaps of up to
6 hours are filled by straight lines; the rest are filled from the same hour on the nearest days. Design conditions
(0.4 % dry bulb and wet bulb) use only readings and the short fills, from every usable year.

Quality codes: GHCNh carries ISD's codes for European stations (first trial run, 2026-10-31). Kept: empty, 0, 1, 4, 5,
9 (passed); dropped: 2, 3, 6, 7 (suspect or erroneous) and anything else. Each run's report lists every code seen.

**Delivery (OPEN-QUESTIONS 114):** the Windows program only. A station is about 35 kB as binary data and about 47 kB as JSON (base64); the first full build (1,942 stations) was 91 MB as JSON and 39 MB compressed, too large for the single-file and phone pages, which use the EPW upload. The Desktop builds workflow takes only a full build (`weather-summary.json`: not a trial, default years and minimum years, nine groups, at least 1,500 stations).

**Licence:** NOAA's non-US data carry the WMO Resolution 40 condition (use for non-commercial international activities
without restriction; no redistribution for commercial purposes). The owner states the tool's use is non-commercial at
this point (OPEN-QUESTIONS 106).
