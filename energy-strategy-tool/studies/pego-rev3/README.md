# Pego data centre campus, feasibility study revision 3 (24 October 2026)

The scripts that produced revision 3 of the Pego study with the current app. The report itself (a PDF) and the app's own PDF
report of the main run were delivered to the owner in the Claude session; they are not stored here.

## The study build

The app has no "existing plant" type (KNOWN-ISSUES 12), so `patch.py` makes a study build: a copy of `app/src` with

- two technology records for the Elecgás CCGT (2 × 427.5 MW): leased from mid-2028 as bridging plant, or from 2031 as firm top-up;
  lease €6/kW a month as fixed O&M, €3/MWh, 56 %, 45 % minimum load, exactly two units (no N+1), own consent, not drawn on the campus,
  the 400 kV link (€62 m) as capex;
- generator rules (l) and (m) for those records;
- `referencePego()`: the case inputs (nine 100 MW buildings every nine months from January 2029, grid 400 MW from January 2030,
  gas on site, roof solar only, hybrid PPA 50 % offered, ten dispatch years, the expected grid charge) and the study settings
  (HVO standby required, time-to-power weight 0; `study: false` gives the tool's defaults);
- the run's site-layout stage skipped (site fit is outside the ranking; on a 2-core machine the stage took over an hour for
  1,461 distinct block sets); the best 24 options are laid out after scoring.

Nothing here changes the product.

## Rebuilding

From a scratch folder holding these files:

```
cp -r <repo>/energy-strategy-tool/app/src app/src && cp <repo>/energy-strategy-tool/app/{build.mjs,index.html,package.json} app/
ln -s <repo>/energy-strategy-tool/app/node_modules app/node_modules
python3 patch.py app
node runs.mjs base full            # 2,000 options, about 15 s; also market, crisis, gridLate, grid600, eight, six
STUDY=0 TAG=tool node runs.mjs base full   # the tool's default settings
node strategies.mjs                 # named strategies on equal terms, every case (see the file for the case list)
node analysis.mjs                   # tornado, the app's PDF, hourly series, site layouts and massing renders
(cd app && node build.mjs) && python3 shots3.py   # screenshots of the study build in Chromium
python3 chart_market.py && python3 charts3.py && python3 diagrams3.py && python3 build3.py
```

`build3.py` also needs `css2.css` (the revision 2 stylesheet) in the same folder.

## Findings about the tool

Recorded as KNOWN-ISSUES 14–17 for the owner's decision: the time-to-power metric, rented plant paid from availability, retained
bridging plant bought all at once, and the eight-year dispatch cap.
