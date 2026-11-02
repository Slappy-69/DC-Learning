# R2: NOAA station weather, release-time method and pipeline (independent Opus review, 2026-10-31)

Slice: `app/src/engine/weathertmy.js`, `weather-data/build-stations.mjs`, `weather-data/merge-bundle.mjs`,
`.github/workflows/weather-data.yml`, decoding in `app/src/engine/stations.js`, test 49. Code at `main` 39e2e9b.
Reviewer: Claude Opus. Nothing in the app, tests, workflows or records was changed. Scripts written for this review are
in `verification/weather/scripts/noaa/`.

Evidence used: the code; three probe scripts (below); the notices of the first full build (run 41201619910), read
from the public GitHub API (`/check-runs/<job>/annotations`), which list every quality code seen per country group;
the wetterdienst project's GHCNh reader (github.com/earthobservations/wetterdienst,
`src/wetterdienst/provider/noaa/ghcn/api.py`), which summarises Table 3 of the GHCNh documentation. The GHCNh
documentation PDF itself could not be read from this machine (blocked in the shell; WebFetch returned binary).

## (a) Verdict

The core method is sound in its arithmetic. Hours land on the right local-standard-time hour for mainland Europe; the
hour-ending convention matches the EPW reader; the month-join smoothing is exactly 8 hours each side between the hours
just outside; the wind tie-break and rank-summing follow ISO 15927-4. But one rule lets wrong design values through.
Gaps of up to 6 hours are filled by straight lines and those fills count as readings. So a station that reports only
every 6 hours passes every check as "complete". Its design dry bulb and wet bulb come out about 1 K low (probe A),
and nothing in the record shows it. Six narrower problems follow. Values marked "Null" are dropped as bad data, but
the GHCNh documentation means "no code" by it (124,000 British temperatures in the full build). The Canary Islands
and the Azores get the mainland time offset. A poor 2024 alone throws a station away. The design value leans towards
the months with more usable years. A partial bundle can reach the Windows program without anyone noticing. And
station coordinates are taken from the list unchecked. The low French and Spanish yield cannot be explained from
here without NOAA data; a diagnostic script for the owner to run is provided.

## (b) Findings

### High

**H1. Stations that report every 3 or 6 hours pass as complete, and their design values are too low.**
`weathertmy.js:116–118` (80 % rule counted after the ≤ 6 h straight-line fills), `:118` (the `real` mask is set
after those fills), `:196` (design uses `real` hours).
A 6-hourly synoptic station (00, 06, 12, 18 UTC) has gaps of 5 hours. All are filled by lines, so every month is
"100 % present" and every filled hour counts as a reading in the 0.4 % design values. The afternoon peak is never
observed (12 and 18 UTC are 13:00 and 19:00 in CET), so the line cuts under it.
Evidence (`node verification/weather/scripts/noaa/method-probes.mjs`, the same made-up climate reported three ways):
```
every 1 h: 180/180 month-years usable; design DB 33.2 °C, WB 28.6 °C
every 3 h: 180/180 month-years usable; design DB 33 °C,   WB 28.4 °C
every 6 h: 180/180 month-years usable; design DB 32.2 °C, WB 27.6 °C
```
So the design is 1.0 K low on both dry bulb and wet bulb, with no flag. That feeds the design load and chiller
sizing directly. The bundle record carries no reading count or reporting interval, so the app cannot warn. How many
of the 1,942 bundled stations report this sparsely is unknown. `diagnose-yield.mjs` prints "local hours reported
n/24" per station, which would show it.
Fix (one of): count only real readings for the 80 % rule (for example, at least 20 readings a day); or mark as `real`
only readings plus gaps of up to 2 hours; and store the median reporting interval in each record so the app can flag
"design from 3-/6-hourly readings". This is a method change, so the owner should decide.

### Medium

**M1. Quality code "Null" is treated as bad data; codes are read with ISD meanings whatever the source.**
`build-stations.mjs:26, 96–99`.
The wetterdienst reader, citing GHCNh Table 3, records that `Null` in a `_Quality_Code` column means *no code*
(sources 245 and 367 write it; one example given is UKI0000EGLL, London Heathrow). The full build dropped every such
value. From the run notices: GB `temperature:Null` 123,974, `dew_point_temperature:Null` 125,242, `wind_speed:Null`
124,425; ES `temperature:Null` 43,497; SE `temperature:Null` 6,774. That is about 14 station-years of British
temperature thrown away, possibly whole stations. Also, Table 3 gives the codes per *source*: in sources 220–223, 347
and 348 `1` is "Good"; in source 345 `1` is "Issue" and `3` "Error". The script never reads `*_Source_Code`, so a
source-345 value marked "Issue" is kept. Letter codes (`f`, `o` on relative humidity; `c`, `s`, `f` from GHCNh's own
checks) are rightly dropped.
Fix: treat `Null` as empty. Read `<element>_Source_Code` and apply Table 3 for each source (at least, drop `1` for
source 345). Count empty codes and dropped values in the report too (today only non-empty codes on finite values are
counted, so the share kept is unknown).

**M2. Canary Islands and Azores get the wrong local standard time.**
`weathertmy.js:27–31`; filter `build-stations.mjs:58` (lat > 25, lon > −32 keeps both).
Spain defaults to UTC+1, but the Canaries keep UTC+0. Portugal is UTC+0, but the Azores keep UTC−1. Madeira (UTC+0)
is right. For those stations the whole daily cycle sits one hour off the tool's other hourly profiles (solar, price,
carbon). Design values are not affected.
Fix: offset by longitude or by an ID list for these islands (ES lon < −12 → 0; PT lon < −20 → −1). Add both to test 49.

**M3. A single poor latest year throws a station away, and nothing records why.**
`build-stations.mjs:118` ("latest year has n usable months", with fewer than 6 usable months in 2024); `weathertmy.js:117, 119, 124, 139`
(four different reasons all return `null`).
In the full build this rule dropped 1,850 French, 820 Spanish, 486 German, 337 Swedish and 94 Italian stations. A
station with 14 good years and a bad 2024 (a humidity sensor out, a source change, 2024 not yet complete in GHCNh) is
lost, although the "cannot reach n usable years" check would already handle stations that are truly sparse. The likely
causes, in order, from the code: (1) no dew point or relative humidity, or humidity with long gaps (the month is
dropped at `:124`/`:139`); (2) stations that report only in the daytime, such as small aerodromes, whose night gap of
more than 6 hours leaves over 20 % missing (`:117`); (3) values dropped by the quality-code rule (M1; ES had 43,500
temperatures and relative humidities coded `Null`); (4) the hour-of-day never reported in a month (`:119`). This
cannot be settled without the data. Run `diagnose-yield.mjs` (section f).
Fix: have `prepareYear` return the reason for each rejected month and put the counts in the report. Apply the gate to
"any of the last three years", or drop it and rely on the arithmetic exit at `:122`, which is correct.

**M4. Design values lean towards the months with more usable years.**
`weathertmy.js:195–196`. Every usable hour of every usable month-year is pooled. When summer has 15 usable years and
winter 10, the pool has fewer cold hours, so the 0.4 % point rises. It falls in the opposite case. Probe B:
```
all 15 years every month: design DB 33.2
Oct–Mar only 10 years:    design DB 33.4   (equal-weight reference 33.2)
Jun–Aug only 10 years:    design DB 32.9   (equal-weight reference 33.2)
```
ASHRAE works on years that pass a completeness test, so its 0.4 % is "35 hours in a typical year". Here the basis
shifts by ±0.2–0.3 K with the data gaps. `stations.js:307` describes the basis as "0.4 % … of every usable year",
which suggests whole years.
Fix: weight each calendar month's hours by 1/(its usable years), so every month counts once per average year (the
reference column above). Or use only years with all 12 months usable.

**M5. A partial or unrepresentative bundle can reach the Windows program without anyone noticing; repeat builds can differ.**
`build-stations.mjs:72–80` (after 4 failed HEAD requests `readYear` returns `null`, the same as "no such file"), `:115`
(for the latest year, that becomes "no file for the latest year" and the station is skipped, not retried: the
whole-station retry at `:154` catches only thrown errors), `weather-data.yml:245–247` (merge `if: always()`), and
`desktop.yml:57–61` (takes any *successful* run with 500 or more stations, whatever its years, minimum years or
country coverage).
A NOAA outage during one group's job gives a "successful" run with that country thin or missing. A hand run with
`--years 2018-2024 --min-years 5` and more than 500 stations would also be picked up. The 16-station difference
between the first two full builds came partly from this.
Fix: make `readYear` throw on any non-404 failure, so the station retry and the error count see it. Write the run
inputs (years, min years, limit) into `weather-summary.json`. In `desktop.yml`, require the default inputs and a
minimum per country, or compare the counts with the previous accepted bundle.

**M6. Station coordinates come from the station list unchecked; some European entries are known to have the wrong sign.**
`build-stations.mjs:56`. The wetterdienst maintainers list 43 stations whose longitude in `ghcnh-station-list.csv`
(and the daily list) has lost its minus sign, 6 to 1,299 km off. They include FR000007510, FRE00104044, SP000007038,
SPM00008164, SPM00008165, SPM00008282, UK000003377, UKW00015014–15041 and several UKE… IDs. A mislocated station
becomes the "nearest station" for the wrong sites (`stations.js:284–287`). It is not known whether any of these is in
the bundle.
Fix: read `LATITUDE`/`LONGITUDE` from the Parquet file (already in the schema) and refuse or correct a station whose
list position differs by more than about 5 km. Add a check that the position lies within its country's box.

### Low

**L1. The last hour of the year is never a reading for on-the-hour stations; at UTC+2 the first hour is never one either.**
`weathertmy.js:49` tests the reading's own local year, not the year of the hour it is placed in. So the reading at
local 24:00 on 31 December (local 00:00 on 1 January) is dropped. Each by-year file covers a UTC year, so in the
+1/+2 countries the readings for local early 1 January sit in the previous year's file, which is never passed in.
Probe (`time-probes.mjs`):
```
FR (+1): UTC 2015-12-31 23:00 = local 2016-01-01 00:00 (in the 2015 file) → expect index 8759 → (nothing placed)
FI (+2): UTC 2015-12-31 22:00 = local 24:00 (in the 2015 file)           → expect index 8759 → (nothing placed)
```
Probe A shows the effect: 131,385 design hours from 15 complete hourly years, not 131,400 (one hour lost each
year). The hour is filled from nearby days, so the harm is tiny. Test 49 hides it, because its made-up station feeds
readings from 2 hours either side of the UTC year (`weathertmy-tests.mjs:13`), which a real file never has.
Fix: test `topLocal`'s year at line 49 (keep a reading that lands on local 00:00 of next year), and pass the
previous and next files' edge hours when they exist. Make test 49 use UTC-year-bounded readings.

**L2. Leap years: 28 February's last hour takes the 1 March 00:00 reading.** `weathertmy.js:57–60`. EPW keeps the
reading at 29 Feb 00:00 as 28 Feb hour 24. Here that reading is dropped, and the 1 March 00:00 reading goes to index
1415 (probe: "local 1 Mar 00:00 → 1415"). One hour per leap year, now 24 hours later than in EPW. This is harmless,
and arguably smoother, but it differs from the EPW reader. Record it, or follow EPW.

**L3. Design wet bulb counts hours whose humidity was filled from nearby days.** `weathertmy.js:118, 196`: the `real`
mask follows temperature only. In probe D, a 3-day dew-point gap each July left the design hours unchanged
(131,385), so the filled humidity was counted. Fix: AND the mask with "humidity was a reading or a short fill".

**L4. ISO 15927-4 departures beyond solar are not recorded.** The humidity variable is the humidity ratio. The standard
(and the 2006 Estonian test reference year paper that describes it) uses water vapour pressure, or relative humidity
in some implementations. The humidity ratio ranks almost exactly like vapour pressure, so this is a reasonable choice,
but say so. Also not recorded: the FS statistic uses i/n plotting positions and a mean, not ranks over (n+1) and a sum
(the ranking is equivalent within a month). The December–January join is not smoothed; some implementations smooth it
so the year can repeat. Only dry bulb and wet bulb are smoothed; humidity ratio is not output, so that is harmless,
and wet bulb ≤ dry bulb holds through the smoothing, because both use the same linear weights. Fix: one line each in
BUILD-NOTES and the user guide.

**L5. "years" overstates the record.** `weathertmy.js:197` gives the first and last years *read*, including years with
no usable month. `stations.js:305/307` then shows "typical year from 2010–2024". Use the first and last years that
contributed a usable month, and give their count.

**L6. Report and notices lose information.** `qualityCodesSeen` leaves out empty codes and does not count dropped
values (M1). `weather-data.yml:240`: a comma in a `::notice title=…::` ends the title, so the notices read "Weather
ES", "Weather GB", "Weather IT" and so on (seen in run 41201619910). Use `-` in the title. Retried stations count their
codes twice (`build-stations.mjs:154`).

**L7. The licence condition does not travel with the data.** The records (OPEN-QUESTIONS 106, README, research note,
`build-stations.mjs:9–11`) state the WMO Resolution 40 condition honestly, with the owner's "non-commercial" statement
and the trigger to revisit. But `weather-stations.json`'s `source` field (`merge-bundle.mjs:11`) and the station
record carry no notice. A copied bundle loses it. Fix: add "Non-US data: WMO Resolution 40, no redistribution for
commercial purposes" to the bundle's `source` and to the app's weather note. The research note's own view ("the tool
is for consultancies, so bundling … is commercial redistribution") still stands beside the owner's statement. That is
honest; it is the owner's call.

**L8. Two drop rules are judgements that are not recorded as such.** "No file for the latest year" (only stations
still reporting in 2024) and "fewer than 6 usable months in the latest year" are not in the README's definition of a
usable station. Record them with the label "judgement".

## (c) Checked and sound

- **Offsets:** mainland offsets are right for all 31 countries: GB, IE, PT, IS 0; FI, EE, LV, LT, RO, BG, GR, CY +2;
  the rest +1. Ireland's legal "standard time" quirk does not matter, because EPW uses UTC+0. No daylight saving, as
  in EPW. Exceptions: M2.
- **FIPS → ISO:** all 31 codes are right (AU→AT, BU→BG, EZ→CZ, DA→DK, EN→EE, GM→DE, EI→IE, LG→LV, LH→LT, LO→SK,
  PO→PT, SP→ES, SW→SE, UK→GB, SZ→CH, IC→IS, and the rest).
- **Hour placement:** the nearest reading within ±30 min (exactly 30 min goes to the later hour; 12:29 → hour ending
  12:00, 12:31 → hour ending 13:00). The value at hh:00 ends hour index doy×24+hh−1, which matches `readEpw`
  (idx = (doy)×24 + hr−1, hour 1 = 00:00–01:00). The day boundary is right (local 2 Jan 00:00 → index 23). Leap-year
  day-of-year arithmetic is right after February. The 31 December 23:50 reading → 8759.
- **Gap filling:** `fillRange` interpolates only inside the month and never extrapolates. `fillSameHour` stays inside
  the month slice, takes only the original values (no chained fills), uses the mean of the two nearest days or one
  side, and works up to 15 days. Its bias is small for single gaps. Pressure fill ≤ 24 h, else the standard pressure
  at the station's elevation; `p > 500 hPa` guards bad pressures. Dew point is capped at dry bulb.
- **ISO selection:** the FS statistic is computed per month on daily means, ranked per variable, ranks summed, top
  three by wind closeness to the multi-year mean; ties are broken by year, so the result is deterministic.
  **Smoothing:** probe C shows exactly the 16 hours j−8…j+7 changed, linear between j−9 and j+8 (0 → 0.6 … 9.4 → 10).
  Wet bulb ≤ dry bulb holds through the smoothing (same weights, a convex combination); the clip at `:193` is only a
  guard.
- **Design:** the dry bulb and wet bulb 0.4 % come from the same hours. Leap years have 8,760 hours like the others,
  so years are weighted equally (apart from M4). `exceeded` uses ceil(0.004·N)-th highest.
- **Early exit** `:122`: `left = y − y0` is the exact number of years still to read, so no station that could still
  reach the minimum is dropped by it.
- **Concurrency:** one-threaded `next++` is safe; results are sorted by ID; the merge removes duplicates by ID (the
  groups do not overlap anyway).
- **Bundle format:** Int16 × 10 holds −3,276.8…3,276.7 °C; values are rounded to 0.1 °C before packing, so the round
  trip is exact; little-endian on both sides; `stationWeather` refuses a length other than 8,760.
- **Test 49** passes here and checks what it says. Its weak point is L1.

## (d) Not checked, and why

- Real NOAA files: no access from this machine (the proxy blocks ncei.noaa.gov and the AWS mirror). So the yield
  causes (M3), the share of 3- and 6-hourly stations (H1) and whether 2024 is complete in GHCNh are open.
- The GHCNh documentation PDF (Table 3, ID format): not readable here. The quality-code meanings rest on the
  wetterdienst summary of Table 3. The meaning of the network letter (ID character 3: M, I, W, N, U, E, 0 …) is not
  confirmed. The diagnostic script tallies outcomes by that letter.
- The ISO 15927-4 text itself (a paid standard): checked against secondary descriptions only.
- Runner memory and time limits beyond reading the code (the first full build took 15 minutes; no sign of strain).
- The app side of the station records (nearest-station choice, flags): another reviewer covers it.

## (e) Counts

1 high, 6 medium, 8 low (15 findings). 3 scripts.

## (f) Scripts (`verification/weather/scripts/noaa/`)

- `time-probes.mjs`: 15 single-reading probes of hour placement (day, year, leap-day boundaries, ±30 min). Runs offline.
- `method-probes.mjs`: A reporting interval, B unequal month counts, C smoothing indices, D humidity fills in the
  design. Runs offline, about 14 s.
- `diagnose-yield.mjs`: **for the owner to run where there is internet** (own computer with Node 22, from
  `energy-strategy-tool/weather-data` after `npm ci`), for example
  `node ../verification/weather/scripts/noaa/diagnose-yield.mjs --country FR --sample 40 --year 2024`. For a spread
  sample of stations it prints the network letter, ICAO and WMO codes, temperature values by quality code (empty
  included), readings by minute past the hour, how many hours of the day are ever reported, dew point and relative
  humidity counts, report types and source codes, and for each month the first rule that rejects it (T<80%,
  T-samehour, HUM<80%, HUM-missing). It ends with a tally by network letter and by reason. It reads one year per
  station, about 40 files. It is not part of the workflow.
