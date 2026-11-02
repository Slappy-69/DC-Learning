# R1. Opus review: EPW reader and psychrometrics (2026-10-31)

Reviewer: Claude Opus 5.5, independent of the builder. Code: `main` at 39e2e9b (working copy on `feature/weather-review`).
Slice: `energy-strategy-tool/app/src/engine/weather.js` (readEpw, satPressure, humidityRatio, wetBulb,
pressureAtElevation, exceeded, fillGaps, applyWeather, weatherSummary, distanceKm). Scripts:
`verification/weather/scripts/epw/` (run each from `energy-strategy-tool/app`). Real EPW files were downloaded to
`/tmp/epwdl/files` (not in the repository): six EnergyPlus TMY3 sample files (Golden, Chicago, San Francisco, Tampa,
Dulles, Phoenix), the IWEC file for Amsterdam and a reanalysis typical-year file for 45° N 8° E (northern Italy, no
design conditions), both from the pvlib test data.

## (a) Verdict

The psychrometrics are right. The saturation pressure, the humidity ratio, both wet-bulb equations and the pressure
at altitude match ASHRAE Fundamentals 2017 chapter 1. Over 12,960 grid points the wet bulb agrees with an independent
reference within 0.009 K, except in narrow bands where the wet bulb is close to 0 °C. The EPW reader puts every hour
of eight real files in the right place, and it reads the ASHRAE 0.4 % dry bulb and 0.4 % wet bulb from the right
fields. The main problem is the design basis, not the arithmetic. With a weather file, the design load now uses the
0.4 % value. That is a condition the same file exceeds for 25 to 40 hours a year. Before, without a file, the design
used the hottest hour. The owner never made this choice, and nothing records it as a judgement. For DLC it lowers the
design PUE by 7 to 10 %. The other findings are about trust in odd files: some are overwritten without a warning, some
are refused with a misleading message, and every "Weather" flag on an option is info only, even when the station is
16,000 km away.

## (b) Findings

### F1 (high). The design temperature changed from the hottest hour to the 0.4 % value, without the owner's decision; the model then runs above its own design load for 25–40 hours a year

- Where: `weather.js:127–143` (the design values), `weather.js:178–179` (applyWeather puts them in place of the hottest
  hour). It touches `profiles.js:203` (coolPeak), `context.js:258–289` (design day, design load) and `sizing.js:76–95`
  (design facility load, critical load for backup).
- What: without a file, `profiles.js:165` uses the hottest synthetic hour as the design temperature. With a file,
  `applyWeather` uses the file's ASHRAE 0.4 % values, or the 0.4 % value of the file's own hours. ASHRAE defines 0.4 %
  as the value exceeded for 35 hours in an average year. So the hourly model has hours above the design load. The
  design-day shift (`context.js:271`) also moves the file's hottest day **down** to the 0.4 % value. In data centre
  practice, chillers and the grid connection are often sized to an extreme, such as the ASHRAE n = 20-year value
  (ASHRAE TC 9.9 guidance for mission-critical sites), or to 0.4 % plus a margin. The research note
  (`docs/research/hourly-weather-2026-10-30.md`, line 44) left the choice open: "for example a 0.4 % or n-year
  extreme". I found no owner answer in `OPEN-QUESTIONS.md`, the brief or the decision log. The value has no
  "judgement" label in `BUILD-NOTES.md`. Repository rule: never assume an answer, and label every default.
- The file's DESIGN CONDITIONS line already holds the extremes (the "Extremes" block: extreme maximum wet bulb, and
  the n = 5/10/20/50-year maximum dry bulb). The reader does not use them.
- Evidence: `node ../verification/weather/scripts/epw/design-basis.mjs /tmp/epwdl/files/NLD_Amsterdam062400_IWEC.epw`
  ```
  0.4 % (as built): design 27.8/20.7 °C → air peak PUE 1.354, evap 1.276, dlc 1.134, immersion 1.090
     hours with hourly cooling above the design cooling: air 40 h, evap 25 h, dlc 40 h, immersion 9 h
  hottest hour of the file: design 32.7/23.2 °C → air 1.385, evap 1.286, dlc 1.222, immersion 1.135   (0 h above)
  ASHRAE n=20 extreme DB (34.6) / extreme max WB (24.5): air 1.400, evap 1.292, dlc 1.260, immersion 1.169   (0 h above)
  ```
  The real files show the same picture (`real-files.mjs`). The hours above the design dry bulb are: Amsterdam 40,
  Dulles 32, Tampa 24, Golden 17, San Francisco 15, Phoenix 8, Chicago 5. The n = 20 maximum is 3 to 10 K above the
  0.4 % value (Amsterdam 34.6 against 27.8 °C).
- Effect: for a 100 MW IT DLC campus in Amsterdam, the design facility load is about 9 MW lower than with the
  hottest hour of the same file, and about 13 MW lower than with the n = 20 extreme. The critical load for backup
  falls too. An engineer would size the grid request on this number.
- Suggested fix: ask the owner, as a single question, which basis to use: (A) 0.4 %, as built; (B) the hottest hour
  of the hourly year, as without a file; (C) the ASHRAE n = 20-year extreme dry bulb and the extreme maximum wet bulb
  from the file's Extremes block, falling back to B. Then record the answer, with the source or the "judgement"
  label, in `OPEN-QUESTIONS.md`, the brief and `BUILD-NOTES.md`. Whatever the answer, raise a flag when the hourly
  cooling goes above the design cooling in any hour.

### F2 (medium). The "Weather" flag on each option is info only, whatever the distance or design basis

- Where: `weather.js:186–194` (weatherSummary works out `km` but sets no level); `assumed.js:133` (always `'info'`).
  The 50 km warning appears only in the panel (`WeatherField.jsx:29`). It is not on the options and not in the PDF.
- Evidence (`robustness.mjs`): the Amsterdam file against a pin in Sydney gives
  `uploaded EPW file "ams.epw" (AMSTERDAM, …), 16656 km from the pin; design 27.8 °C …`, as an info flag. The fallback
  basis ("a typical year understates design conditions") and the warning that 50 % RH was assumed for every hour
  (`no dew point or RH in any hour` case) are also info only.
- Suggested fix: when the station is more than 50 km away, when the design comes from the file's own hours, or when
  humidity was assumed, give the flag the warning level and carry the warning words into the option flag and the
  PDF. This is "flag, never enforce": the options stay as they are.

### F3 (medium). Rows for the same hour overwrite each other without a warning

- Where: `weather.js:93–104` (`db[idx] = …` with no check that the hour is already filled; `rows++` counts
  duplicates).
- Evidence (`robustness.mjs`):
  - Two years in one file (17,520 rows; the second year 5 K hotter): accepted with no warning. Only the last year
    is used (mean 15.03 °C against 10.03 °C). The label says "1982–2001 (months from several years)".
  - A half-hourly file (minute 30 and minute 60 rows): accepted. The last row of each hour wins.
  - A row with a date that does not exist (31 April) is written into 1 May, hour 1. Here the real 1 May row came
    later and overwrote it again. In the other order, the bad value would stay.
- Effect: a multi-year actual-weather download, which engineers often hold, quietly becomes its last year.
- Suggested fix: reject or warn when an hour is written twice, or when the day does not exist in the month
  (`d > days in month`). Say how many rows were read beyond 8,760. For multi-year files, either refuse ("one year
  per file") or use the first full year and say so.

### F4 (low). A gap at the first or last hour is never filled, so the file is refused with a misleading message

- Where: `weather.js:65` (`h > 0 && e < a.length`), `weather.js:91` (data rows searched only from line 9), and
  `weather.js:108` (the message).
- Evidence (`robustness.mjs`): the first hour missing (99.9), the last hour missing, a header of 7 lines, and hours
  numbered 0–23 each give `REFUSED — x.epw: 1 hours of dry-bulb temperature are missing in gaps longer than 6 hours.`
  No gap is longer than 6 hours. In the 0–23 case the whole year is also shifted by one hour, and the user is not
  told.
- Suggested fix: fill a gap of 6 hours or less at either end of the year from the nearest value, or wrap round the
  year. Find the first data row by its pattern, not by line number. Refuse hour 0 with a clear message ("hours must be
  numbered 1–24"). Fix "1 hours".

### F5 (low). No range checks on the LOCATION line or the hourly values

- Where: `weather.js:86–87` (lat and lon only need to be numbers) and `weather.js:72–75` (`num` only rejects the
  missing code).
- Evidence (`robustness.mjs`): a comma in the city name ("AMSTERDAM, SCHIPHOL") shifts the fields. The reader then
  accepts lat 62400, lon 52.3, and the country becomes "-". Latitude 152.3 is accepted. A dry bulb of 99.8 °C is
  accepted, giving a wet bulb of 39.8 °C. The EPW dictionary allows −70 to 70 °C; EnergyPlus Auxiliary Programs, EPW
  data dictionary, field N6.
- Suggested fix: refuse lat outside −90…90 or lon outside −180…180, with the message "the LOCATION line could not
  be read (a comma in the place name?)". Treat dry bulb and dew point outside −70…70 °C as missing, and RH outside
  0…110 % as missing. Warn with the count.

### F6 (low). Two roots where the wet bulb is near 0 °C

- Where: `weather.js:34–44`. Eq 35 at a wet bulb just below 0 gives a higher W than eq 33 just above 0 (at 5 °C and
  sea level, 0.001991 against 0.001757 kg/kg). So for a band of W the equation has one root on the ice side and one
  on the water side, and the bisection takes whichever it meets.
- Evidence (`psychro-grid.mjs`, items 3 and 5): the largest error on the grid is −0.754 K at 13 °C, 5 %, 70 kPa
  (app −0.229 °C, reference +0.525 °C). There are 38 of 12,960 points with an error over 0.05 K, all with the wet
  bulb within 1 K of 0 °C. At 5 °C and sea level the error is up to 0.35 K for RH 32.7–37 %.
- Effect: none on cooling. Every cooling type is in full free cooling at these temperatures. PsychroLib switches the
  same way.
- Suggested fix (optional): solve with the water equation first, and keep that root if it is at or above 0 °C;
  otherwise solve with the ice equation.

### F7 (low). Filled hours are not reported

- Where: `weather.js:79` (the comment promises `hoursFilled`, but nothing sets it) and `weather.js:107–110` (the
  counts of filled hours are thrown away).
- Evidence: 398 single rows deleted from the Amsterdam file. The file is accepted with no warning, and 354 hours
  differ from the original.
- Suggested fix: add a warning such as "N hours of dry bulb (M of humidity) were filled by straight lines".

### F8 (low). The "years" label can mislead

- Where: `weather.js:150`.
- Evidence: one year starting on 1 July is shown as "2020–2021 (two years)". The two-year file in F3 is shown as
  "months from several years".
- Suggested fix: "one year, July 2020 to June 2021", or the list of years, by month.

### F9 (low). A dew point below 0 °C is treated as a frost point

- Where: `weather.js:28` (`satPressure(dp)` uses the ice equation below 0 °C).
- What: meteorological dew points below 0 °C are normally given with respect to water (the WMO convention).
- Evidence: a dew point of −20 °C at −10 °C dry bulb gives a wet bulb of −11.98 °C (ice) against −11.69 °C (water).
- Effect: none on cooling. Record it in BUILD-NOTES, or use the water equation for the dew point.

### F10 (low). Files with old Mac line ends (CR only) are refused

- Where: `weather.js:83` (`split(/\r?\n/)`).
- Evidence: the message is "no hourly data rows were found."
- Suggested fix: `split(/\r\n|\r|\n/)`.

## (c) Checked and sound

1. Hyland–Wexler over ice, C1–C7 (`weather.js:16`), and over water, C8–C13 (`weather.js:18`): the same as ASHRAE
   2017 ch. 1 eqs 5 and 6. Against an independent IAPWS reference (Wagner–Pruss 2002 over water, IAPWS 2011 over
   ice), the largest difference from −60 to 60 °C is 0.033 %. Against ASHRAE table 3, it is within 0.04 % from −40
   to 50 °C (`psychro-grid.mjs` items 1 and 2a).
2. The humidity ratio constant 0.621945 (eq 20). Ws is 0.4 % below ASHRAE table 2, because the equation leaves out
   the enhancement factor, as eq 22 does. The effect on the wet bulb is under 0.01 K.
3. Eq 33 (above freezing) and eq 35 (below freezing): term by term, the same as ASHRAE 2017.
4. Pressure at altitude, eq 3: the same as ASHRAE table 1 to 0.001 kPa at 0, 500, 1,000, 1,500 and 2,000 m.
5. The wet bulb against an independent energy-balance reference, solved by Newton's method, on dry bulb −30…50 °C,
   RH 5…100 %, pressure 70…105 kPa: the largest error is 0.0086 K away from 0 °C. Sea-level points: 25 °C/50 %
   gives 17.889 °C; 35/40 gives 23.935; 30/60 gives 23.813; 40/20 gives 22.032.
6. The bisection bounds (t − 60 to t) hold from −60 to 70 °C, at RH 0 and at saturation. A dew point above the
   dry bulb is clamped, so the wet bulb equals the dry bulb. RH above 100 or below 0 is clamped. A pressure below
   50 kPa is replaced by the standard pressure at the file's elevation.
7. EPW field positions: dry bulb 6, dew point 7, RH 8, pressure 9. Missing codes: 99.9, 99.9, 999 and 999999,
   rejected as "≥ missing". All of these match the EnergyPlus Auxiliary Programs EPW data dictionary
   (`doc/readthedocs/sphinx/auxiliary-programs/auxiliary-programs.rst`, lines 3089–3114).
8. Hour convention: the same document says "Hour 1 is 00:01 to 01:00" (line 3232). The reader maps hour 1 to engine
   index 0, the hour ending 01:00. This is the same rule as the NOAA method (`weathertmy.js:6–7, 61`), and it agrees
   with `h % 24` in the profiles and dispatch, to within the usual half-hour ambiguity. On all eight real files, 0 of
   8,760 hours differ from the file row in the same position. The wet bulb recomputed separately from the file's
   fields differs by 0.00 K (`real-files.mjs`).
9. Typical-year files that mix years: placed by month and day, not by row order. 29 February is dropped, with a
   warning. A file starting on 1 July lands in the right calendar hours.
10. DESIGN CONDITIONS: Cooling + 3 is the 0.4 % dry bulb and Cooling + 9 is the 0.4 % wet bulb, in the ASHRAE 2009
    layout. Confirmed on seven real files with an independent reader. Examples: Amsterdam 27.8/20.7 °C, Chicago
    O'Hare 33.3/25.5 °C, Golden 33.0/18.4 °C. These match the builder's Golden figures. Files with
    `DESIGN CONDITIONS,0`, or with no line, fall back to the file's hours, with the text that this understates. A
    lower-case "cooling" with spaces is handled.
11. `exceeded()` takes the 36th-highest of 8,760 values, so 35 hours lie above it, which is ASHRAE's 0.4 %. On the
    reanalysis file there are 35 hours above both the dry-bulb and the wet-bulb value.
12. Using the 0.4 % wet bulb (the evaporation column), not the mean-coincident wet bulb, for `designWetbulb` is the
    right column for the wet-bulb cooling types. The dry-bulb types use only the dry bulb, so the mean-coincident
    values are not needed. The basis level itself is F1.
13. A byte-order mark, CRLF line ends, blank lines between rows and at the end, and −0.0 are all handled.
14. No humidity in the file: 50 % RH is assumed, with a warning. A dew-point gap of over 6 hours falls back to RH.
15. `distanceKm`: 0.0 km at the station. Amsterdam to Sydney is 16,656 km, which is right for a great circle.
16. `applyWeather` replaces the temperatures, the design values and the statistics. Without a weather file it
    returns the profile unchanged.
17. A southern-hemisphere site (Amsterdam data with a Sydney location, as no real file was at hand): no
    hemisphere-specific code, and the design day is found anywhere in the year. Nothing depends on the season order.
18. The builder's test 48a passes when run on its own (`run-48a.mjs`).

## (d) Not checked, and why

1. The full `npm test`: stopped by the 10-minute time limit here. Only 48a was run, on its own. Browser test B42 was
   not run.
2. PsychroLib was downloaded but not run: downloaded code is untrusted, under the session rules. I read its source
   text and wrote an independent reference instead (IAPWS saturation pressure and a Newton energy balance).
3. The ASHRAE Handbook itself was not open here. The coefficients were checked against the published values I know
   and against PsychroLib's source text, which quotes ASHRAE 2017.
4. The DESIGN CONDITIONS layout in Climate.OneBuilding TMYx files, whose design data come from the 2017 or 2021
   ASHRAE data: none could be downloaded from this machine. All files tested carried the 2009 layout.
5. The time basis of reanalysis and PVGIS EPW files. Some are in UTC, not local standard time, and the reader ignores
   the time-zone field. In Europe that would shift the daily cycle by 1–2 hours against the synthetic load and price.
   Not confirmed.
6. A real southern-hemisphere file: none was at hand; it was simulated (c17).

## (e) Counts

18 verified (section c), 10 failed (F1–F10: 1 high, 2 medium, 7 low), 6 not checked (section d).
