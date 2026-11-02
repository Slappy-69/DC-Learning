# H3 verification: bundled plant data and the offline rule

Verifier: Claude Haiku (independent check, work package 19, branch feature/existing-plant, worktree /home/claude/eplant).
No source, test or record file was edited.

## Counts

- VERIFIED: 15
- FAILED: 0
- NOT VERIFIABLE: 1

## Results

### 1. Plant data against the pinned powerplantmatching file

1. **VERIFIED. Pinned file and checksum.** The pinned `powerplants.csv` (commit 2889ad9d1754a7ee4368b9282d7af835bf572ca2) was downloaded to `/tmp/h3/powerplants.csv`. Its sha256 is `ceccce02edd33813216a264fe6c8e3281ce2249435a259c1b1a1b729ce4f3d78`. This matches the `sha256` field in `app/src/data/gas-plants.js`.
2. **VERIFIED. Record count.** My own Python filter (Fueltype "Natural Gas", Capacity >= 50, lat and lon present, country in the tool's 31 countries) gives 608 records. `gas-plants.js` holds `count: 608` and 608 rows.
3. **VERIFIED. Identifiers.** The two sets of ids are identical (608 of 608, `ppm` prefix plus the CSV id).
4. **VERIFIED. All fields, all records.** For all 608 records I compared name, capacity, DateIn, DateOut, lat, lon, efficiency, technology and tool country code. There were 0 mismatches. Capacity and coordinates were allowed the rounding the build applies (1 decimal and 5 decimals).
5. **VERIFIED. Random sample.** 30 records were drawn at random (seed 19). All 30 match on every field checked (for example ppm743 Lage Weide, ppm22306 Piombino Elettra Staiton, ppm1408 Cottam Development Centre, ppm2257 Jena, ppm3815 Stade Dow).
6. **VERIFIED. The four plants within 10 km of 53.425 N 6.875 E.** All four are in the bundle with matching values:
   - ppm757 Eem, CCGT, 3,210 MW, in 1995, out 2030, 53.44489 N 6.85558 E, efficiency 0.323, 2.56 km
   - ppm4359 Magnum Centrale, CCGT, 1,311 MW, in 2013, no out date, 53.45149 N 6.85268 E, efficiency 0.58, 3.30 km
   - ppm11959 Eemshaven, CCGT, 1,410 MW, in 1976, no out date, 53.4414 N 6.8659 E, efficiency 0.243, 1.92 km
   - ppm11967 Eem, steam turbine, 131 MW, in 1987, no efficiency value, 53.44171 N 6.85605 E, 2.24 km
7. **VERIFIED. Fuel filter.** Only "Natural Gas" is kept. "Biogas" rows are excluded, as the build script intends.

### 2. Licence and credit

8. **VERIFIED. Licence.** The pinned README (line 107) says the default output `powerplants.csv` is released under CC BY 4.0. The code is MIT.
9. **VERIFIED (code path, not rendered). Credit in the app UI.** `components/PlantsField.jsx` line 31 puts `PLANT_SOURCE.credit` in the plant panel hint. `PLANT_SOURCE` takes its credit from `gas-plants.js`: "Power plant data: powerplantmatching, PyPSA (CC BY 4.0)". The credit also appears twice in `dist/energy-tool-single-file.html`. I did not open the page in a browser.
10. **VERIFIED (code path). Credit in the PDF.** `report/report.js` lines 185 and 186 put the credit in the plant section, whether or not plants are found.
11. **VERIFIED (code path). Credit in the flags.** `engine/evaluate.js` line 677 (plant-values flag) and `engine/run.js` lines 327 and 328 use the same credit text.

Observations on item 9 to 11 (not failures):
- CC BY 4.0 asks for a link to the source "to the extent reasonably practicable". The URL is stored as `PLANT_SOURCE.url`, but nothing in the UI, the PDF or the flags shows it. Consider adding the link to the credit text or to the PDF source line.
- The flag wording reads "values from Power plant data: powerplantmatching, PyPSA (CC BY 4.0) and defaults". It is correct but clumsy.

### 3. Offline rule

12. **VERIFIED. No run-time fetch of plant data.** `engine/plants.js`, `engine/defaults.js` and `data/gas-plants.js` contain no `fetch`, `XMLHttpRequest`, WebSocket or beacon calls. `defaults.js` has URLs only as text in source notes. `gas-plants.js` has its URL only in its header comment and its `url` field. The plant list is imported as a module and read from memory.
13. **VERIFIED. The bundle includes the plant data.** `grep -c "Magnum Centrale"` gives 2 in `dist/energy-tool-single-file.html`, 2 in `dist/energy-tool-hosted.html`, 1 in `dist/app.js` and 1 in `dist/worker.js`. The `dist/` folder already existed, so `npm run build` was not run.
14. **VERIFIED. dist is current.** No file under `app/src` is newer than `dist/app.js` (built 16:32). `dist/energy-tool-single-file.html` is byte-identical to `energy-strategy-tool/energy-tool-single-file.html`.
15. **NOT VERIFIABLE. Other network-looking code.** The only network-style call found in `app/src` is `App.jsx` line 126: `fetch('weather-stations.json.gz')`. It is a same-origin, relative file for the weather stations, not plant data. Whether the Windows program counts this as a network connection depends on the packaging. Packaging check D12 should confirm it; I did not run that check.

### 4. Distance function

16. **VERIFIED. distanceKm.** `engine/weather.js` lines 173 to 177 use a haversine with R = 6371.0088 km. I ran this function in Node and compared it with an independent haversine (R = 6371 km) for the four Eemshaven plants. Both give the same distances to four decimals: 2.5589 km (ppm757), 3.2958 km (ppm4359), 1.9207 km (ppm11959), 2.2424 km (ppm11967).

## Notes not covered by the checks

- The list merges several source databases (the build header names GEM, ENTSO-E, OPSD, JRC, MaStR, WRI and OSM, among others). The README states only the licence of the output file. I did not check the terms of the source databases. OpenStreetMap data, for example, has its own licence terms.

## Working files

Scratch scripts and the downloaded CSV are in `/tmp/h3/` and the session scratchpad. Nothing was written to the repository except this report.
