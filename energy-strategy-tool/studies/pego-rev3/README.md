# Pego data centre campus, feasibility study revision 3.1 (24 October 2026)

Revision 3.1 re-runs revision 3 on the fixed engine (`feature/engine-fixes`, work package 11). The scripts here are the 3.1 versions;
revision 3's are in the git history (commit ddf0dad). Differences: the study build no longer sets ten dispatch years or a time-to-power
weight of 0 (both fixed in the tool); `analysis.mjs` takes the last dispatched year as the steady year; `charts3.py` reads the hire month
and the rented MW; `build3.py` adds the page "Revision 3.1: what was corrected" and reads revision 3's outputs from `../pego3/out/` for
it; `compare31.py` writes the comparison (`out/compare31.json`). The run "defaults without time-to-power" is no longer made.

The scripts that produce the Pego study with the current app. The report itself (a PDF) and the app's own PDF
report of the main run were delivered to the owner in the Claude session; they are not stored here.

## The study build

When revision 3 was made the app had no "existing plant" type (KNOWN-ISSUES 12, since built as work package 12), so `patch.py` makes a study build: a copy of `app/src` with

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
node runs.mjs base repDays          # the screening check
STUDY=0 TAG=tool node runs.mjs base full   # the tool's default settings
node strategies.mjs                 # named strategies on equal terms, every case (see the file for the case list)
node analysis.mjs                   # tornado, the app's PDF, hourly series, site layouts and massing renders
(cd app && node build.mjs) && python3 shots3.py   # screenshots of the study build in Chromium
python3 svg2png.py out/iso-*.svg && python3 compare31.py   # needs revision 3's out/ in ../pego3/out
python3 chart_market.py && python3 charts3.py && python3 diagrams3.py && python3 build3.py
```

`build3.py` also needs `css2.css` (the revision 2 stylesheet) in the same folder.

## Findings about the tool

Revision 3 found KNOWN-ISSUES 14–18 (the time-to-power metric, rented plant paid from availability, retained bridging plant bought all
at once, the eight-year dispatch cap, an entered grid adder ignored); all are fixed in work package 11. Revision 3.1 found KNOWN-ISSUES 19
(PPA energy not turned down when firm plant runs at its minimum), open.

## On the product (since work package 12)

`pego-product.mjs` runs Pego on the product itself, with the existing-plant input instead of the study build's CCGT records, and
`pego-product.study.json` holds its inputs as a study file (work package 15; the app's "Open study…" reads it too). Differences
from the study build: one availability date for the CCGT in both roles (the lease rule starts the top-up lease when it is needed,
month 51, rather than the study's January 2031), the C4 choice includes gas engines, and the run samples a different 2,000 options.
Result on 24 October 2026: 14.4 s; leader "rent, grid, existing CCGT top-up, 50 % PPA" at €144.2/MWh. The delivered report's figures
come from the study build.

