# R3 — Opus review: how measured weather is integrated (2026-10-31)

Reviewer: Claude Opus, independent. Code: `main` at 39e2e9b (working copy `feature/weather-review`). Scope: `inputs.weather`
from the defaults through the engine, flags, PDF, study files, the screen, the station bundle and the Windows packaging.
Not in scope: the EPW reader and psychrometrics, the NOAA typical-year method (other reviewers).
Scripts: `verification/weather/scripts/integration/` (run from `app/`, for example
`node ../verification/weather/scripts/integration/i3-study-station.mjs`). No app code, tests or records were changed.

## (a) Verdict

The engine side is sound. Every place that uses temperature reads the measured year: hourly PUE, the peak and
design-day PUE, the wet-bulb basis of the evaporative types, the weather-and-grid-stress trigger, the design load in
sizing, adequacy and the shortfall analysis, and the tornado, breakeven and Monte Carlo re-runs (they rebuild the
context from inputs that carry the weather). The sizing sentence shows the same design temperature the PUE uses.
Carrying 2 × 8,760 values costs about 10 ms of copying and hashing per input change. That is not noticeable.
The weak points are around the engine, not in it. A study saved with a NOAA station does not reopen cleanly.
The station's design-temperature flag contradicts the weather flag. A station chosen by the program is labelled
"Entered" and is never flagged as a default, even when it is far from the pin. The Windows build can pick up a trial
or partial station bundle, or silently ship without one. No finding is high. Nothing gives a wrong number in the
ranking. Five findings are medium, and three of them can mislead an engineer about where the climate came from.

## (b) Findings

### M1 (medium). A study saved with a NOAA station does not reopen cleanly; older studies silently change weather

- Where: `engine/study.js:57-69` (`fillFromDefaults` drops keys not in the defaults); `engine/defaults.js:952-956`
  (the default `weather` object has no `id`); `engine/stations.js:330` (station weather has `id`); `App.jsx:131-139`
  (nearest-station effect compares `w.id`); `App.jsx:206` and `210-215` (the comparison waits for a run whose hash equals
  the hash taken at opening).
- Evidence: `i3-study-station.mjs`:
  ```
  read ok true | warnings: [ '1 input in the file is not known to this version and was left out (weather.id).' ]
  hash saved 4ac3d11cae6b9e40 hash at open 05b744eda7ddd1a0 equal false
  nearest-station effect replaces the weather after opening: true
  hash of the inputs actually run 4ac3d11cae6b9e40 | equals openedStudy.hash (comparison fires): false | equals saved hash: true
  old study warnings: [ "Saved by an earlier version: 1 input not in the file takes today's defaults (weather)." ] | weather source after read: none
  ```
- What the engineer sees:
  - **Windows program.** A false warning that `weather.id` is unknown. The effect then puts the `id` back, so the
    weather changes after opening. The status line stays at "… Running it…" for good. The re-run in fact matches
    the saved study, but the engineer is never told so.
  - **Single-file page** (no bundle, so no effect). The run keeps the weather without its `id`. The hash differs from
    the saved one, so the page says "The tool's defaults or engine have changed since the study was saved, so the
    re-run differs". That is not true.
  - **A study saved without weather (older, or from the single-file page), opened in the Windows program.** The effect
    swaps in the nearest station. The result changes and the comparison never appears. Nothing says the weather was
    replaced.
- Suggested fix:
  - Add `id: null` to the default `weather` object. Better still, treat `weather` as one value in `fillFromDefaults`,
    as `choices` already is.
  - In `openStudy`, take the hash after the weather the program will use has been applied. Or keep the study's
    weather: do not run the nearest-station effect for an opened study unless the engineer asks. Then say in the study
    message which weather was used.
  - Add a Node test: study round trip with station weather, no warnings, same hash.

### M2 (medium). With a NOAA station, the "Design temperatures" assumed-default flag contradicts the weather flag

- Where: `engine/assumed.js:117-118`. The flag is raised whenever the design basis lacks the text "design conditions (".
  A station's basis is "the station's own readings, 2010–2024 (0.4 % … of every usable year)" (`stations.js:334`).
- Evidence: `i4-flags.mjs`. The same option carries both of these:
  ```
  Assumed Design temperatures: 27 °C dry bulb and 19 °C wet bulb, the 0.4 % hottest hours of the weather year, which understates design conditions when the year is a typical year (judgement)
  Weather: NOAA station FAR AWAY (typical year from 2010–2024), …; design 27 °C dry bulb and 19 °C wet bulb from the station's own readings, 2010–2024 (0.4 % dry bulb and 0.4 % wet bulb of every usable year)
  ```
- The first flag is wrong for stations. The values come from all usable years, as ASHRAE does it, not from the
  typical year. An engineer reading it could add a design margin that is not needed.
- Suggested fix: raise the "understates" flag only when `source === 'epw'` and the file has no design conditions. For
  stations, either raise no flag or raise an honest one: "multi-year 0.4 % from NOAA readings, not ASHRAE-published
  (judgement)". Extend test 48c to check the flags.

### M3 (medium). The automatically chosen station is labelled "Entered", is never an assumed default, and a far station is not flagged on the options

- Where:
  - `report/report.js:64-66`: any weather row is printed with status "Entered".
  - `engine/assumed.js:131-133`: the weather flag is `info`, not `assumed: true`. Its comment says "the engineer
    entered it".
  - `components/WeatherField.jsx:29`: the more-than-50 km warning appears in the panel only.
  - `engine/stations.js:311-314`: the nearest station is taken with no distance limit.
- Evidence: `i4-flags.mjs`, station 178 km from the pin:
  `PDF row: {"section":"Weather",…,"status":"Entered",…,"isDefault":false}`. The option flag is `severity=info
  assumed=false`. There is no run flag.
- Why it matters:
  - In the Windows program the engineer does not choose the station; the program does (`App.jsx:131-139`). CLAUDE.md
    says every value the engineer did not enter is flagged on each option that uses it, with its source.
  - The PDF calls it "Entered". The assumed-default filter and counts do not include it.
  - A station 100–200 km away, or across a mountain or coast, is flagged only by a sentence in the side panel.
- Suggested fix:
  - Mark station weather as "Default: nearest NOAA station (automatic; judgement)" in the PDF row.
  - Make the option flag `assumed: true` with its source, NOAA NCEI GHCNh, years and distance.
  - Above 50 km (and perhaps above an elevation difference), add a `minor` flag on every option and a run flag with
    the panel's wording.

### M4 (medium). The Windows build can pick up a trial or partial station bundle

- Where: `.github/workflows/desktop.yml:57-61`; `.github/workflows/weather-data.yml:5-13`; `weather-data/build-stations.mjs`
  (station errors are collected, not fatal).
- How:
  - The build takes the newest successful "Weather data" run on **any branch** whose summary has 500 stations or more.
  - A hand-started run with `limit` 60 gives 9 × 60 = 540 stations and qualifies.
  - So does a full run where NOAA refused many stations: errors are counted in the report, but the job still succeeds.
  - So does a run from an experimental branch with a changed method.
  - The bundle records no method version, branch or commit. `build-info.json` records the SHA-256 and the station
    count, not the run.
- Suggested fix:
  - Filter on `--branch main`. Have the merge job write `limit`, `errorCount`, method version and commit into
    `weather-summary.json`.
  - Accept a bundle only with no `limit`, a minimum station count per country, and few errors.
  - Record the run id in `build-info.json`.

### M5 (medium). A Windows build without stations passes its checks, and the program does not say the stations are missing

- Where: `packaging/desktop/test-desktop.mjs:171` (D5b returns "not tested" and counts as a pass);
  `desktop.yml:57-63` (no bundle found means the build carries on); `App.jsx:123-129` (`.catch(() => {})`).
- How: workflow artifacts expire, after 90 days by default. Once every full run has expired, every Windows build ships
  without stations. Each pin then falls back to the synthetic climate. The panel does say "Synthetic country profile",
  but nothing says the bundle was expected and is missing.
- Suggested fix: fail the Windows build, or at least make D5b fail, when no qualifying bundle is found, unless a
  workflow input allows it. Keep the bundle as a release asset, or set `retention-days`. In the program, show "Station
  data not found in this installation" when `app:` is the protocol and the load fails.

### L1 (low). Screens and the PDF still say all profiles are synthetic when measured temperatures are in use

- Where: `App.jsx:368` (header "Synthetic profiles"); `App.jsx:443` (footer "Profiles are synthetic and seeded");
  `report/report.js:374` (PDF method: "Profiles: Synthetic profile … — not measured data"); `engine/run.js:63` (run-log
  warning); `components/OptionDetail.jsx:121`; `components/DispatchView.jsx:428`; `engine/evaluate.js:657`.
- Suggested fix: say "temperatures measured (source); solar, wind, price and carbon synthetic" when `hasWeather`.

### L2 (low). The design temperature is the 0.4 % value, so the measured year has hours hotter than design

- Where: `engine/weather.js:178-179` with `profiles.js:203-205`. With the synthetic profile, design is the year's
  hottest hour, so no hour exceeds it.
- Evidence: `i1-design-basis.mjs`. The same temperatures with design at the 0.4 % value give 34 h (air), 35 h
  (evaporative) and 6 h (DLC) above the design PUE. Hourly maximum against design: 1.347 against 1.339 (air) and
  1.271 against 1.221 (evaporative).
- `i1c-grid-at-design.mjs` (grid set 0.1 MW above the design load): no grid-connected option gained unmet hours.
  Hourly IT is the utilisation share of installed IT, which absorbs the difference. With a flat 100 % load the hottest
  hours would sit about 0.6 % (air) to 4 % (evaporative) above the design load.
- `i1b-gap-detail.mjs` shows how sensitive results are to the design basis. Lowering the design temperature shrank a
  fuel-cell top-up from 11 to 6 units and left a 3 MW gap before full grid (months 28–29). The option became "not
  adequate". That is the top-up rule, not a weather defect, but it shows that the design basis drives rankings.
- Suggested fix: state the design basis in the sizing sentence and in the guide. Optionally report the hours above the
  design load per option.

### L3 (low). The screening tier's design day is the hottest dry-bulb day, also for evaporative cooling

- Where: `engine/dispatch.js:555` and `:197` (`indexOfMax(p.temp)`). The design-day shortfall check in dispatch
  (`:467`) uses the same day.
- Evidence: `i6-repdays.mjs`: "hottest dry-bulb day 207 picked: true; highest wet-bulb day 187 picked: false". The
  screening leader and top 10 still match the full year (10/10).
- Suggested fix: also keep the highest-wet-bulb day when an evaporative type is open.

### L4 (low). The upload control and its messages

- Where: `components/WeatherField.jsx:19-20, 34, 37`.
- What:
  - A successful upload clears the status (`setMsg('')`), so a screen-reader user hears nothing. The new text is in a
    paragraph that is not a live region.
  - With a station, or with a station study opened in the single-file page, there is no button back to the synthetic
    profile. The only button is shown for `epw`.
  - `aria-describedby` on a `<p>` does nothing.
- The hidden input with `tabIndex -1`, opened by a real button, is fine.
- Suggested fix: announce "Loaded <file>: design …". Offer "Use the synthetic profile" for any source. Drop the stray
  attribute.

### L5 (low). Start-up cost of the station bundle

- Where: `App.jsx:123-139`.
- Evidence: `i5-bundle-load.mjs` (Node 22, the same web streams). For 1,950 stations (91.5 MB JSON): decompress and
  parse about 4.5 s, heap +93 MB kept for the session, RSS +297 MB at peak. Nearest station 2.7 ms per pin move.
  Decoding one station 9 ms.
- The T1 run starts after 350 ms. When the bundle arrives, the effect changes the weather and the first run is thrown
  away and started again. Chromium will differ in detail but not in order of magnitude. Not measured in the packaged
  program.
- Suggested fix: hold the first run until the bundle has loaded or failed (on `app:` only). Optionally parse in a
  worker and keep only coordinates plus the packed strings.

### L6 (low). Stale notes

- `engine/defaults.js:953`: the `weather.source` record still says "station: … (not built yet)". It is shown with the
  record in the PDF appendix and the guide.
- `weather-data/README.md` still says "Not done yet: how the bundle reaches the app".

### L7 (low). Study files grow about 25 times

- Evidence: `i2-performance.mjs`: 13.5 kB without weather and 339 kB with it. The arrays are stored twice
  (`inputs` and `inputsAsRun`, `study.js:29-30`).
- Harmless, but `inputsAsRun.weather` could hold only the summary and a hash of the arrays.

## (c) Checked and sound

- **Temperature in the engine.** `buildContext` applies the weather once (`context.js:169`), and everything reads
  `ctx.prof`:
  - `coolingProfile` (hourly PUE, the dry-bulb or wet-bulb basis by cooling type) and `coolPeak` (design PUE);
  - `designDayPUE` (the hottest day of the right basis, shifted to the design temperature) and `designDemandByMonth`;
  - sizing: the design load sentence shows the same design temperature (`sizing.js:79`), and backup and heat-rejection
    use `coolPeak`;
  - adequacy and the shortfall analysis; the stress trigger (`triggers.js:13`); `dispatch.js` (design day);
  - the representative days (temperature is a clustering feature).
  - Test 48b confirms that the design values and hourly temperatures reach `ctx.prof`.
- **Re-runs.** The tornado, breakeven and Monte Carlo rebuild the context from `normalizeInputs(run.inputs)`, which
  keeps the weather. The PUE driver scales the measured cooling energy the same way as the synthetic. No driver
  perturbs weather, as designed. The Site (Beta) code reads no temperature.
- **Caches.**
  - `getProfiles` is cached by country, seed and latitude and is not mutated by `applyWeather` (it returns a new object).
  - Caches keyed on `ctx.prof` (triggers, top-price hours) miss once per context. That costs nothing measurable.
- **Hashing and re-runs.** The weather is in `hashInputs` and in `computeKey`, so a change of weather re-runs and is
  recorded. Workers receive the weather with the inputs (about 79 kB each); nothing else is needed.
- **Performance** (`i2-performance.mjs`, run in both orders on a 2-core machine):
  - `normalizeInputs` 2.9–3.6 ms (0.05 without weather); `hashInputs` 6–7.5 ms (0.4); App `computeKey` 2.1 ms (0.01).
    That is about 12–15 ms per input change, mostly once per commit.
  - T1 run 23.9/29.7 s against 19.7/25.8 s.
  - Tornado 0.33/0.98 s against 1.07/0.50 s; breakeven 1.55/4.15 s against 2.88/2.29 s; Monte Carlo (100 samples)
    7.3/13.7 s against 9.0/10.2 s.
  - Differences follow run order (JIT warm-up) and the different weather, not the size of the data. No regression worth
    acting on.
- **Representative-day screening** with a measured year still picks the hottest dry-bulb day. Its leader and top 10
  match the full year (`i6`).
- **Nearest-station effect** (`App.jsx:131-139`):
  - No loop. It returns when `w.id` equals the nearest id; the dependencies are the source and id, not the arrays.
  - An uploaded EPW is never overwritten.
  - "Reset to defaults" and "Load T1 example" go back to the nearest station in the Windows program and to synthetic
    elsewhere.
  - A pin moved during a run supersedes the run once: the station change lands inside the 350 ms settle delay.
  - Missing bundle: a 404 resolves to `null`; a corrupt gzip or bad JSON is caught. The program falls back to EPW or
    synthetic and does not crash (but see M5).
- **Offline and security.**
  - `stage.mjs` copies the bundle next to the page.
  - `guards.js` serves it from `app://bundle` only, path-checked, as `application/octet-stream` with `nosniff`. There is
    no `content-encoding`, so the page's own `DecompressionStream` is right.
  - The CSP `connect-src 'self'` allows exactly this fetch.
  - The fetch is attempted only on `app:`, so the single-file and phone pages never try it.
  - No http(s) request is involved (D12 still covers this).
- **Old studies without weather** open as synthetic, with a clear "earlier version" warning (Windows caveat: M1).
- **EPW studies** round-trip without warnings (test 48b).
- **PDF.** One row, no arrays printed. Every option carries the weather flag. The synthetic-climate flag is replaced.
- **Regression.** Browser checks B14, B41 (phone/hosted page) and B42 (EPW upload) pass on this build (3/3, about
  3 min). The single-file and hosted pages carry no station data.

## (d) Not checked, and why

- The packaged Windows or Linux program with a real bundle (D5b live, memory, start-up time). There is no bundle in
  this working copy, and `gh` does not work in these sessions. L5 uses a made-up bundle of the same shape.
- Whether any "Weather data" run on GitHub currently meets the desktop workflow's test, and its branch and limit.
  Needs the GitHub API, not opened.
- The full Node suite (about 8 minutes) and the full browser suite (about 25 minutes). Not run, to save usage. Only
  B14, B41 and B42 were run.
- Screen-reader behaviour in practice (NVDA). L4 is from the code.
- Psychrometrics, the EPW reader and the NOAA typical-year method (other reviewers).

## (e) Counts

High 0 · Medium 5 (M1–M5) · Low 7 (L1–L7). Scripts: 8 in `scripts/integration/` (i1, i1b, i1c, i2, i3, i4, i5, i6).
