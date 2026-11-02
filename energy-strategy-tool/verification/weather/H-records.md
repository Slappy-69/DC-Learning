# Haiku check H-records: hourly weather records against code and each other

Verifier: Claude Haiku 5.5. Date: 2026-10-31. Working copy: `/home/claude/wreview` at `main` 39e2e9b (the merged `feature/weather` and `feature/phone-2026-10-30`). Nothing in the repository was changed; this file is the only output.

**Method.** Each claim in the listed records was read against the code, the test output, the GitHub run records (public API: workflow runs, jobs and check-run notices), and the NOAA and ISD notices (read through a summary tool, so exact wording is checked only where a quote is given).

- `node tests/run-tests.mjs` (full Node suite): 85 of 85 passed, exit 0.
- `node tests/only-tests.mjs 48`: 48a, 48b and 48c passed. Note that `only-tests.mjs` does not run group 49, so test 49 was run with a scratch runner that calls `weatherTmyTests` from `tests/weathertmy-tests.mjs`; it passed.
- `readEpw` on the EnergyPlus Golden, CO (TMY3) file found in the session's `/tmp/epwdl/files/` (read only).
- A T1 run (60 options) with a made-up station record, to see which weather flags appear.
- GitHub: runs 41200080919 to 41203335752 (Weather data, all push events on `feature/weather`); their jobs and check-run notices; Desktop builds run 41203170579 (commit 91c5520); CI run 41206538098 (main, 39e2e9b, success).
- Source notices: NESDIS 5 May 2023 ISD notice; NESDIS ISD service-location notice; ISD format document; IRI copy of the WMO Resolution 40 notice.

**Status key.** VERIFIED: the claim matches the code, the run or the source. FAILED: the claim is wrong, or out of date, or contradicted by another record. NOT VERIFIABLE: not checkable from the repository or the sources I could reach, or it is a guess.

Record shorthand: BN = `app/BUILD-NOTES.md` (weather section, lines 2051 to 2066); ST = `STATUS.md`; OQ = `brief-v2/OPEN-QUESTIONS.md`; BR = `brief-v2/BRIEF.md`; GU = `docs/user-guide/src/`; RS = `docs/research/hourly-weather-2026-10-30.md`; WD = `weather-data/README.md`; PR = `packaging/README.md`. Paths in evidence are under `energy-strategy-tool/` unless shown.

## 1. Claims and status

### 1a. BUILD-NOTES, hourly weather section

| # | Where | Claim (quoted or closely paraphrased) | Status | Evidence |
|---|---|---|---|---|
| 1 | BN 2053 | "NOAA station records plus an EPW upload (OPEN-QUESTIONS 106, non-commercial use stated), every usable station (107)" | VERIFIED | OQ rows 106 and 107 (lines 128, 129) say this. |
| 2 | BN 2055 | `readEpw` reads LOCATION, DESIGN CONDITIONS and 8,760 hourly rows; 29 February dropped; gaps of 6 h or less filled, longer refused | VERIFIED | `app/src/engine/weather.js` 80–108 (29 February at line 98; `fillGaps(db, 6)` at 107); test 48a (7 h gap refused, 6 h accepted). |
| 3 | BN 2055 | Wet bulb 25 °C/50 % gives 17.9 °C; 35 °C/40 % gives 23.9 °C | VERIFIED | Test 48a output: 17.89 and 23.93 °C. |
| 4 | BN 2055 | Design from the file's DESIGN CONDITIONS fields Cooling+3 and +9 | VERIFIED | `weather.js` 128–138 (`t[k + 3]`, `t[k + 9]`). On the Golden file these give 33 and 18.4. In the ASHRAE layout +9 is the evaporation wet bulb at 0.4 %, followed by its mean coincident dry bulb (+10), so the pairing is right. |
| 5 | BN 2055 | Otherwise the 0.4 % hottest hours of the file, flagged as understating | VERIFIED | `weather.js` 140–142; `assumed.js` 117–118 gives the flag. |
| 6 | BN 2055 | Stored in `inputs.weather` (rounded to 0.1 °C), so study files keep it | VERIFIED | `weather.js` 120–121 (`r1`), 148–152; test 48b study round trip. |
| 7 | BN 2055 | `context.js` replaces the synthetic temperatures and design temperatures (`applyWeather`) | VERIFIED | `context.js` 168–169; `weather.js` 170–183. |
| 8 | BN 2055 | An info flag "Weather: ..." on every option; the synthetic-climate assumed flag goes | VERIFIED | `assumed.js` 113–116 (synthetic flag only without weather), 131–133 (info flag); test 48b. A design-temperature assumed flag still appears (see row 44). |
| 9 | BN 2055 | PDF: one "Weather" row | VERIFIED | `report/report.js` 63–67 (one row); test 48b checks one row. |
| 10 | BN 2055 | Golden, CO (TMY3): 33.0 and 18.4 °C from its ASHRAE line against 32.2 and 17.5 °C from its own hours | VERIFIED | Run of `readEpw` on the Golden TMY3 file: design 33 and 18.4; 0.4 % of its hours 32.2 and 17.5. |
| 11 | BN 2057 | "ISD reached end of life in August 2025" | FAILED | NOAA's ISD notice says the product is "superseded, with no update beyond 08/24/2025" (that is the last data update, not the end of the product). The same notice gives a planned retirement of the ISD downloads on 31 July 2026. The 2023 notice (5 May 2023) announced the end of online ISD service. "End of life, August 2025" is not what NOAA says. See correction C1. |
| 12 | BN 2057 | GHCNh by-year Parquet files, hyparquet 1.31.3 | VERIFIED | `weather-data/package.json` (`hyparquet` 1.31.3); `weather-data/package-lock.json` line 20; `build-stations.mjs` line 15 and 19. |
| 13 | BN 2057 | Hour placement: nearest reading within 30 min of each local-standard-time hour; country offsets, no daylight saving | VERIFIED | `weathertmy.js` 26–31 (offsets; 0 for GB, IE, PT, IS; 2 for FI, EE, LV, LT, RO, BG, GR, CY; 1 otherwise), 53–56 (30 min limit at 55). |
| 14 | BN 2057 | A month of one year usable at 80 % or more of hours after gaps of 6 h or less are filled; the rest from the same hour on the nearest days | VERIFIED | `weathertmy.js` 109–119 (`minShare` 0.8, `maxGap` 6), 98 (same hour, up to 15 days either side). |
| 15 | BN 2057 | Typical year by ISO 15927-4 on daily mean temperature and humidity ratio; wind breaks the tie among the best three; joins smoothed over 8 h either side | VERIFIED | `weathertmy.js` 145–192 (Finkelstein-Schafer on daily means, ranks, wind pick at 173–180, joins at 185–192); test 49 passes. |
| 16 | BN 2057 | "Design: 0.4 % of every usable year's readings (not the fills)" | FAILED | `weathertmy.js` 116–118: `real` is set after the 6 h straight-line fills (116), so it includes those short fills. Only the same-hour fills (119) are excluded. The header of `weathertmy.js` (lines 10–11) and `WD` lines 16–17 say "readings and the short fills", and test 49 (`weathertmy-tests.mjs` 54) checks that only the 7 same-hour hours are unmarked. See correction C2. |
| 17 | BN 2057 | Station usable: every month has at least 10 usable years in 2010 to 2024 (judgement) | VERIFIED | `weathertmy.js` 163 (`minYears = 10`); `build-stations.mjs` 30 and 33; `.github/workflows/weather-data.yml` 11–12. |
| 18 | BN 2057 | Quality codes kept: empty, 0, 1, 4, 5, 9 | VERIFIED | `build-stations.mjs` 26. NOAA's ISD format document: 4 and 5 are NCEI-source versions of 0 and 1; 9 is "passed gross limits check if element is present". The comment in `build-stations.mjs` 21–25 matches. |
| 19 | BN 2057 | "found on the first trial: European values carry '1'" | VERIFIED | Notice of Weather DE, run 41201619910 (check-run 124538377274): temperature code 1 on 13,071,350 values; code 2 on 2,392. |
| 20 | BN 2059 | Trials, 3 stations per group: (1) no usable station; (2) 4 of 27; (3) 11 of 27 after the 80 % rule | VERIFIED | Push runs 41200080919 (0 usable), 41200664217 (4), 41200807637 (11, with the 80 % rule). 27 = 9 groups times 3. |
| 21 | BN 2059 | Trial (1): "closed stations first in the list, and every value with code '1' dropped" | NOT VERIFIABLE | The first trial's code (commit ceb3a98) is not in the working copy; the current code keeps code 1 (see row 18). I did not check the historic list order. |
| 22 | BN 2059 | "About 45 kB a station as JSON (18 kB compressed)" | VERIFIED | Trial run 41200807637: 0.5 MB and 0.2 MB for 11 stations (about 45 and 18 kB each). Full run: 91.3 MB and 38.8 MB for 1,942 stations (about 47 and 20 kB). |
| 23 | BN 2061 | "Not built: how the station bundle reaches the program and the station lookup in the app (decision: size)" | FAILED | Out of date. The bundle reaches the Windows program and the lookup is built (`App.jsx` 120–139, `stage.mjs` 68–71, `desktop.yml` 51–62). See correction C3. |
| 24 | BN 2063 | Station delivery: `stations.js` decode and nearest station; `App.jsx` loads the bundle only on `app:`, un-gzips it with `DecompressionStream`; nearest station used unless an EPW is in use; "Use the nearest NOAA station" returns from an EPW | VERIFIED | `engine/stations.js` 14–46; `App.jsx` 120–139 (protocol check at 124; EPW check at 134); `components/WeatherField.jsx` 23 and 34 (button only when `source` is `epw`). |
| 25 | BN 2063 | `stage.mjs` copies the bundle next to the page; `build-info.json` records `weatherStations`; `desktop.yml` takes the latest successful run with at least 500 stations, else builds without it | VERIFIED | `packaging/desktop/stage.mjs` 42–44, 67–71, 88; `.github/workflows/desktop.yml` 51–62 (500 at line 61). |
| 26 | BN 2063 | Tests 48c (Node) and D5b (desktop; "not tested" for a build with no stations) | VERIFIED | `tests/weather-tests.mjs` 102–121 (48c passes; also in `run-tests.mjs` line 1264); `packaging/desktop/test-desktop.mjs` 169–173 (the "not tested" text at 171). |
| 27 | BN 2063 | "Not tested yet: the program with the real bundle (needs the first full run)" | FAILED | Contradicted by the record itself and by the runs. Desktop run 41203170579 (commit 91c5520) fetched the real bundle (1,942 stations) and both build jobs and the Linux test step (which runs D5b) succeeded. The sentence should go. See correction C4. |
| 28 | BN 2065 | First full build: run 41201619910, 15 minutes | VERIFIED | Push run 41201619910 on 24bbe68, which contains the FULL-RUN marker; jobs ran 12:33 to 12:48 UTC. |
| 29 | BN 2065 | "1,942 usable stations" | VERIFIED | Weather bundle notice, check-run 124541500965: `stations` 1,942; per-country counts add to 1,942. |
| 30 | BN 2065 | "1,942 usable stations of 10,705 in the 31 countries" | FAILED | The nine station-group notices of the same run give 11,470 stations read (for example FR 3,211, DE 1,545, SE 2,113). The 31 countries are right: `defaults.js` `COUNTRIES` has 31 codes, and the workflow matrix lists the same 31. See correction C5. |
| 31 | BN 2065 | Germany 491, Norway 179, Finland 167, France 128, Great Britain 124, Iceland 104, Switzerland 101, Austria 96, Romania 84, Poland 69 | VERIFIED | Bundle notice `byCountry`. |
| 32 | BN 2065 | "thinnest Luxembourg 1, Denmark, Lithuania and Hungary 7" | FAILED | Luxembourg 1 and Denmark 7 and Lithuania 7 are right. Hungary is 8, and Cyprus (6) is thinner than all of them and is left out. See correction C5. |
| 33 | BN 2065 | "91.3 MB as JSON, 38.8 MB gzipped" | VERIFIED | Bundle notice: MB 91.3, MBgzip 38.8. |
| 34 | BN 2065 | France (1,850) and Spain (820) lose most stations this way | VERIFIED | Group notices: FR "latest year has n usable months" 1,850; ES 820. |
| 35 | BN 2065 | Most dropped stations had no file for 2024 or fewer than 6 usable months in it | VERIFIED | Across the nine notices: 5,465 "no file for the latest year" and 3,721 "latest year has n usable months", out of 9,528 dropped. |
| 36 | BN 2065 | "(likely stations without humidity or with sparse 2024 reports)" | NOT VERIFIABLE | A guess, marked as one. No check was made. |
| 37 | BN 2065 | A duplicate full build gave 1,926 (network errors), so a failed station is now retried once | VERIFIED | Run 41200927731 (47e723b): bundle 1,926. Retry at `build-stations.mjs` 151–154. The cause ("network errors") was not checked in the logs. |
| 38 | BN 2065 | The Desktop builds for commit 91c5520 fetched the bundle ("1942 stations from run 41201619910"); both builds passed; the Linux launch test included | VERIFIED | Desktop run 41203170579: notices "1942 stations from run 41201619910"; both build jobs and the Linux test step succeeded. The per-check results (D5b, D12) inside the test-results artifact were not read. |
| 39 | BN 2090 (phone section, merge note) | "npm test 85/85"; "npm run test:browser ... B42 ... passed together" | VERIFIED | Full Node suite now 85 of 85. Browser: CI run 41206538098 on main (39e2e9b) succeeded, which includes the browser suite (B41 and B42). The browser suite was not re-run locally. |

### 1b. STATUS.md, OPEN-QUESTIONS and BRIEF

| # | Where | Claim | Status | Evidence |
|---|---|---|---|---|
| 40 | ST 4 | Merged into `main` with the owner's yes ("Yes", 2026-10-31): `feature/weather` and `feature/phone-2026-10-30` | VERIFIED | `main` merge commits 10ee96d and 2f905b9, both dated 2026-10-31. |
| 41 | ST 4 | `feature/weather` holds "the Opus review of H4–H6 and its fixes, KNOWN-ISSUES 22–27" | VERIFIED | `verification/review-h4-h6/` (Opus review, 2026-10-30) and `verification/HISTORY.md` line 116; `docs/KNOWN-ISSUES.md` rows 22 to 27 exist. (Conflicts with ST 116; see note N3.) |
| 42 | ST 47 | "NOAA/EPW weather moved to package 0 (OPEN-QUESTIONS 63–65)" | VERIFIED | OQ 65 (line 87) answers "package 0" on 2026-10-23. |
| 43 | ST 124 | "Built on `feature/weather` (2026-10-31): EPW upload with ASHRAE wet bulb and design values (tests 48, B42); NOAA GHCNh typical-year method (test 49), release script and workflow; three trials on real data: 11 of 27 usable" | VERIFIED | Tests 48a to c and 49 pass; `browser-tests.mjs` 1429 (B42); trial run 41200807637 (11). |
| 44 | ST 124 | "First full build running on GitHub. Not merged. Nothing built yet." | FAILED | Out of date. The full build finished (run 41201619910, 15 minutes); station delivery is built (`App.jsx`, `stage.mjs`); `feature/weather` is merged (10ee96d). See correction C6. |
| 45 | ST 124 | "Owner chose NOAA (2026-10-30, OPEN-QUESTIONS 106), non-commercial use stated; plus the EPW upload; every usable station (OPEN-QUESTIONS 107)" | VERIFIED | OQ rows 106 and 107. |
| 46 | ST 124 | "Station delivery (OPEN-QUESTIONS 114): the Windows program only, ... (tests 48c, desktop D5b)" | VERIFIED | OQ 114 (line 136); row 24 to 26 above. |
| 47 | OQ 106 (line 128) | Owner's words: "I'd like the NOAA and despite this being for a consultant at this point is not commercial usage by no means"; NOAA cleaned into a typical year by ISO 15927-4 at each release; EPW upload as well | VERIFIED | The same quote is in `RS` line 79; the build does the cleaning at release (`weather-data.yml`, `build-stations.mjs`). |
| 48 | OQ 106 (line 128) | WMO Resolution 40: "use for non-commercial international activities without restriction; no redistribution for commercial purposes" | NOT VERIFIABLE | The first half matches the IRI copy of the notice ("can be used within the U.S. or for non-commercial international activities without restriction"). The notice's redistribution clause, as summarised from the IRI copy, says re-distribution "must provide this same notification"; the words "no redistribution for commercial purposes" were not found. Owner to check the wording before the tool is used commercially. |
| 49 | OQ 107 (line 129) | "'Usable' still to be defined in the build (minimum years and completeness)" | FAILED | Out of date. The definition is in `BN` 2057, `WD` 8–11, and `weathertmy.js` 5–17. See correction C7. |
| 50 | OQ 114 (line 136) | Answer "A": the Windows program only, as a separate file; single-file and phone versions use the EPW upload | VERIFIED | `App.jsx` 124 (`app:` only); `stations.js` 1–4; no station code runs in the single-file or hosted page (`App.jsx` 124); test 48c. |
| 51 | BR 132 | Climate station row: "design temperatures come from the synthetic profile, flagged on every option ... (*Answered 2026-10-23*)"; hourly weather "cleaned into a usable year by the app" | FAILED | Out of date. The EPW upload and the Windows station are built, and the cleaning is done at release, not by the app (OQ 106, 114). See correction C8. |
| 52 | BR 474 | "As built, the design temperature is the hottest hour of the synthetic country year" and "not built yet" | FAILED | Out of date (`context.js` 168–169; `weather.js` 140–142; `App.jsx` 130–139). See correction C8. |
| 53 | BR 857 | "NOAA station records (raw hourly data cleaned into a usable year by the app; the method is research)" | FAILED | Out of date (minor): cleaning is done at release by `weather-data/` (OQ 106), and the method is researched and built. See correction C8. |
| 54 | BR 869 | Hourly ambient temperature from "NOAA station records ... or an uploaded EPW file" | VERIFIED | Consistent with the build. |

### 1c. User guide, chapter 2 (Design temperature) and related guide lines

| # | Where | Claim | Status | Evidence |
|---|---|---|---|---|
| 55 | GU 02-part2 line 120 | "Without a weather file the tool takes the hottest hour of its synthetic year as the design temperature, flagged on every option." | FAILED | Out of date for the Windows program: with the bundle, the nearest NOAA station is used with no file (`App.jsx` 130–139), and its design is the 0.4 % of usable years (`weather.js` 186–195 via `stationWeather`). The guide does not mention stations at all. See correction C9. |
| 56 | GU 02-part2 line 123 | "It replaces the synthetic temperatures for the hourly PUE, the design load and the weather trigger." | VERIFIED | `context.js` 169; `profiles.js` 181 and 203 (PUE and design); `engine/triggers.js` 13 (weather trigger uses `prof.temp`). |
| 57 | GU 02-part2 line 123 | Wet bulb from dry bulb, dew point (or humidity) and pressure, with the ASHRAE psychrometric equations (Fundamentals 2017, chapter 1) | VERIFIED | `weather.js` 6–8 and 13–46. |
| 58 | GU 02-part2 line 123 | Design values are the file's ASHRAE cooling design values when it has them; otherwise the 0.4 % hottest hours, flagged as understating | VERIFIED | `weather.js` 125–143; `assumed.js` 117–118. |
| 59 | GU 02-part2 line 123 | Every option carries a "Weather" flag (file, distance, design basis); the panel warns beyond 50 km | VERIFIED | `assumed.js` 133 (flag); `components/WeatherField.jsx` 29 (warning when `km > 50`). |
| 60 | GU 02-part2 line 123 | "The solar, wind, price and carbon profiles stay synthetic." | VERIFIED | `weather.js` 176–177 replaces only `temp` and `wetbulb`. |
| 61 | GU 02-part2 line 123 | Golden example: 33.0 and 18.4 °C against 32.2 and 17.5 °C | VERIFIED | Same as row 10. |
| 62 | GU 03-part3a line 35 | "the design day stays the hottest hour of the country profile ... Hourly weather from NOAA records or an uploaded EPW file moves to package 0" | FAILED | Out of date (minor): the EPW upload and the station year are built (OQ 106, 114). Correction C9. |
| 63 | GU 06-part6 line 109 | Table row: NOAA or EPW weather (package 0), answered 23 Oct 2026 | VERIFIED | Dated correctly; the later decision (OQ 106, 30 Oct) is recorded elsewhere. |

### 1d. Research note, weather-data README, packaging README and workflows

| # | Where | Claim | Status | Evidence |
|---|---|---|---|---|
| 64 | RS 13–15 | `profiles.js` lines 47–89; wet bulb from a made-up depression (line 88); design from the hottest hour (159–165); PUE and sizing at 181, 203, and `sizing.js` 79 | VERIFIED | `engine/profiles.js` 47, 88–89, 156–165, 181, 203; `engine/sizing.js` 79. The lines match the file as it is now. |
| 65 | RS 23 | WMO quote "can be used within the U.S. or for non-commercial international activities without restriction" | VERIFIED | IRI copy of the notice. |
| 66 | RS 23 | WMO quote "the non-U.S. data cannot be redistributed for commercial purposes" | NOT VERIFIABLE | The IRI copy's redistribution clause reads "Re-distribution of these data by others must provide this same notification". The quoted words were not found; the EnergyPlus support list it cites was not checked. |
| 67 | RS 13 | "NOAA announced in 2023 that ISD would be replaced by GHCNh" | VERIFIED | NESDIS notice dated 5 May 2023 (ending online service for ISD, replaced by GHCNh). |
| 68 | RS 13 | "the ISD page still says it is active" | NOT VERIFIABLE | Not checked. NOAA's later notice gives 31 July 2026 for the ISD download retirement, so this needs the same check as row 11. |
| 69 | RS 55–57 | 35 kB a point (8,760 hours times 2 values times 2 bytes); 35 MB for 1,000 points, 175 MB for 5,000 | VERIFIED | Arithmetic: 8,760 × 2 × 2 = 35,040 bytes. This is binary only; the bundle is about 47 kB a station in JSON (row 22). |
| 70 | RS 58 | "The program is already about 370 MB" | NOT VERIFIABLE | No build size was available to check. |
| 71 | RS 61–71 | Recommendation: bundle ERA5 typical years; "Drop NOAA station cleaning as the bundled source" | FAILED | Out of date (minor). Overruled by the owner on 2026-10-30 (RS 77–79, OQ 106). Nothing in the recommendation says so. See correction C10. |
| 72 | RS 24–26, 92–93 | Licences: PVGIS "likely open, to confirm"; ERA5 CC-BY 4.0 from 2 July 2025; TMYx "All Rights Reserved" | NOT VERIFIABLE | Not checked against the sources. |
| 73 | WD 4–5 | "runs on GitHub (workflow Weather data, started by hand)" | FAILED | All eight runs so far were push events on `feature/weather` (41200080919 to 41203335752). The full build (41201619910) ran from a push because the FULL-RUN marker was in that commit. See correction C11. |
| 74 | WD 8–11 | Usable station: every calendar month at least 10 usable years in 2010 to 2024; a month usable at 80 % after fills of 6 h or less | VERIFIED | `weathertmy.js` 109–119, 163; `build-stations.mjs` 30, 33. |
| 75 | WD 13–15 | Quality codes kept: empty, 0, 1, 4, 5, 9; dropped 2, 3, 6, 7 and others | VERIFIED | `build-stations.mjs` 26; ISD format document (row 18). |
| 76 | WD 20 | "Not done yet: how the bundle reaches the app" | FAILED | Out of date. Built (rows 23 to 25). See correction C3. |
| 77 | WD 20 | "about 35 kB a station before compression (2 × 8,760 values)" | FAILED | Minor. 35 kB is the binary size. The JSON file is about 47 kB a station (base64 text), about 20 kB compressed (91.3 MB and 38.8 MB for 1,942 stations). See correction C12. |
| 78 | WD 21 | "a few thousand stations are tens of MB: too large for the single-file page and the phone page (16 MB limit)" | FAILED | Minor. 1,942 stations are 91 MB as JSON; a few thousand would be about 100 MB or more, not "tens". The conclusion (too large for the single-file and phone pages) holds. See correction C12. |
| 79 | WD 25 | Licence: WMO Resolution 40, non-commercial use | VERIFIED | First half verified (row 65); the second half as row 48. |
| 80 | `.github/workflows/weather-data.yml` 1–2 | "Started by hand only; uploads the result as a download; commits nothing." | FAILED | As row 73. The workflow's own push trigger (lines 6–8) starts runs. The upload and "commits nothing" parts are right (lines 43–51, 66–71). |
| 81 | `weather-data.yml` 5 | "the full build is by hand" | FAILED | The first full build started from a push (row 28). The FULL-RUN marker (lines 38 to 41) makes a push a full build; the marker is no longer on the branch (99432f8 onwards). See correction C11. |
| 82 | `weather-data.yml` 28, 36–42 | Nine groups covering the 31 countries; 3-station trial on push; full run when FULL-RUN is present | VERIFIED | Matrix lists the 31 codes (checked against `defaults.js` `COUNTRIES`); lines 38–42 as stated. |
| 83 | `weather-data/merge-bundle.mjs` 2 | "The app's use of the bundle is not built yet (see README)." | FAILED | Out of date. See correction C3. |
| 84 | `desktop.yml` 51–62 | Fetches the latest successful "Weather data" run with at least 500 stations, else builds without | VERIFIED | Line 61 (`-ge 500`); run 41203170579 notice. |
| 85 | `packaging/desktop/stage.mjs` 28, 42–44, 67–71, 88 | Bundle copied to `web/`; CSP `connect-src 'self'`; `build-info.json` records `weatherStations` | VERIFIED | Lines as stated; D5b passed in run 41203170579 with the bundle loaded from `app://bundle`. |
| 83b | `packaging/README.md` 107 | "Bundled weather stations ... copied next to the page ... The page reads it from app://bundle ... Without it the program uses the EPW upload or the synthetic profile. Check D5b." | VERIFIED | As row 85; `test-desktop.mjs` 169–173. |

### 1e. Code comments and behaviour

| # | Where | Claim | Status | Evidence |
|---|---|---|---|---|
| 84b | `app/src/engine/defaults.js` 953 | Record note for `weather.source`: "station: the nearest bundled NOAA station (not built yet)" | FAILED | Out of date; the station source is built (`App.jsx` 120–139). See correction C13. |
| 85b | `app/src/engine/weather.js` 2 | "... or (later) the nearest bundled NOAA station year" | FAILED | Minor, stale comment. See correction C13. |
| 86 | `app/src/engine/assumed.js` 117–118 with station weather | With a bundled station, the design temperature flag is wrong: "Assumed Design temperatures: 29.1 °C dry bulb ... the 0.4 % hottest hours of the weather year, which understates design conditions when the year is a typical year" | FAILED | Reproduced: a T1 run (60 options) with a station record gives this flag on 60 of 60 options. The station's design is 0.4 % of usable years' readings, not the hottest hours, and the flag's regex (`/design conditions \(/`) matches only the EPW wording. Test 48c does not check flags. See correction C14. |
| 87 | `app/src/report/report.js` 66 | PDF "Weather" row status "Entered" for any measured weather | FAILED | Minor. A station is not entered by the engineer; it is automatic (`App.jsx` 130–139). See correction C15. |
| 88 | `app/tests/weather-tests.mjs` (48b description) | "every option carries a 'Weather' flag (station, distance, design basis)" | FAILED | Minor. The test checks the EPW wording ("uploaded EPW file"); the word "station" is wrong here. See correction C15. |
| 89 | Tests 48a, 48b, 48c, 49 | Names and numbers as in BN | VERIFIED | Four tests pass (rows 2, 3, 8, 26 and the scratch run of 49); full suite 85 of 85. |
| 90 | BN 2051 and 2059 | "Haiku" and "Opus" roles; branch names `feature/weather` and `feature/weather-research` | VERIFIED | `git branch` lists both; the merge is in `main`. |

## 2. FAILED items and suggested corrections

- **C1 (row 11, BN 2057).** Replace "ISD reached end of life in August 2025" with: "NOAA's ISD product has no updates after 24 August 2025; NOAA planned to retire its ISD downloads on 31 July 2026, and GHCNh replaces it." Check the two NOAA notices first, since they were read through a summary tool.
- **C2 (row 16, BN 2057).** Replace "(not the fills)" with "(the readings and the straight-line fills of 6 h or less, not the same-hour fills)". Also check that the wording in `WD` matches.
- **C3 (rows 23, 76, 83, BN 2061, WD 20, `merge-bundle.mjs` 2).** State that the bundle reaches the Windows program only (OQ 114) and that the lookup is built; delete "Not built" and "not built yet".
- **C4 (row 27, BN 2063).** Delete "Not tested yet: the program with the real bundle". Desktop run 41203170579 tested it; say so with the run number.
- **C5 (rows 30 and 32, BN 2065).** Use 11,470 stations read (not 10,705). Correct "thinnest" to: "Luxembourg 1, Cyprus 6, Denmark 7, Lithuania 7, Hungary 8".
- **C6 (row 44, ST 124).** Replace "First full build running on GitHub. Not merged. Nothing built yet." with "Full build done (run 41201619910, 1,942 stations); station delivery built; merged into `main` 2026-10-31 (10ee96d)."
- **C7 (row 49, OQ 107).** Add the definition: "Usable: each calendar month has at least 10 usable years in 2010 to 2024; a month is usable when 80 % of its hours have readings after fills of 6 h or less (judgement; BUILD-NOTES 2026-10-31)."
- **C8 (rows 51 to 53, 52, BR 132, 474, 857).** Add a note on each: "Superseded 2026-10-30 and 2026-10-31: see OQ 106, 107 and 114; station years are built for the Windows program and the EPW upload for all versions. Cleaning is done at release (`weather-data/`), not by the app." Rewrite BR 474 so that "as built" describes the current state.
- **C9 (rows 55 and 62, GU 02-part2 line 120 and 03-part3a line 35).** Rewrite line 120: "Without a weather file, the Windows program uses the nearest NOAA station (its own 0.4 % design of the usable years); the single-file and phone versions use the synthetic profile, with the hottest hour as the design temperature, flagged on every option." Add a sentence that the Windows station is automatic and can be replaced by an EPW file. Update 03-part3a line 35 the same way.
- **C10 (row 71, RS 61–71).** Add above the Recommendation: "Overruled by the owner on 2026-10-30 (NOAA station records plus an EPW upload, OQ 106). Kept for the record."
- **C11 (rows 73, 80, 81, WD 4–5, `weather-data.yml` 1–2 and 5).** Replace "started by hand" with: "Runs on pushes to `feature/weather` that change the weather code (a 3-station trial), and by hand (workflow_dispatch) for the full run. The first full run (41201619910) started from a push with the FULL-RUN marker." Check that the marker's behaviour matches the comment at lines 38–41.
- **C12 (rows 77 and 78, WD 20–21).** Replace with: "The bundle is about 35 kB a station as binary data and about 47 kB as JSON (base64). 1,942 stations are 91 MB as JSON (39 MB compressed); a few thousand stations would be about 100 MB or more, too large for the single-file and phone pages (16 MB limit)."
- **C13 (rows 84b, 85b, `defaults.js` 953, `weather.js` 2).** In `defaults.js`: "station: the nearest bundled NOAA station (Windows program only, built 2026-10-31)." In `weather.js`: "or the nearest bundled NOAA station year (Windows program only)".
- **C14 (row 86, `assumed.js` 117–118).** Do not raise the design-temperature flag when `inputs.weather.source === 'station'`, or give the station basis its own text: "0.4 % dry bulb and wet bulb of every usable year (station readings)". Add a flag assertion to test 48c so this stays fixed. (Found by a T1 run with a station record; the existing tests do not check flags for station weather.)
- **C15 (rows 87 and 88, `report.js` 66, `weather-tests.mjs` 48b description).** For a station, show status "From NOAA station (automatic)" rather than "Entered". In the test description, replace "(station, distance, design basis)" with "(file, distance, design basis)".

## 3. Counts

| Status | Count |
|---|---|
| VERIFIED | 60 |
| FAILED | 26 |
| NOT VERIFIABLE | 7 |
| Total rows | 93 |

Counted from the table in section 1 (rows 1 to 90, with sub-rows 83b, 84b and 85b). The FAILED rows are 11, 16, 23, 27, 30, 32, 44, 49, 51, 52, 53, 55, 62, 71, 73, 76, 77, 78, 80, 81, 83, 84b, 85b, 86, 87 and 88.

## 4. Notes outside the weather records (not counted)

- **N1.** `verification/weather/` has untracked files (`R3-integration.md`, `scripts/epw/`, `scripts/integration/`) that were not there when I first listed the folder. They are not mine and I did not touch them.
- **N2.** `only-tests.mjs` does not run group 49 (it handles 40, 46, 47 and 48 only). A developer who uses it for weather checks will miss test 49.
- **N3.** `ST` line 116 says the Opus review of H4 to H6 is still due and deferred; `verification/HISTORY.md` line 116 and `verification/review-h4-h6/` record that it was done on 2026-10-30. One of the two needs correcting.
- **N4.** The Measured label in the panel (`WeatherField.jsx` 28) also says "Measured" for a NOAA typical year, which is a model year built from station readings. Owner's wording to choose.
- **N5.** Per the Haiku rule, this check should add a line to `verification/HISTORY.md`. Not done, because this check changes no file but its report.
