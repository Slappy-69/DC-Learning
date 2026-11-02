# Plant data: the bundled list of European gas plants

Work package 19 (owner, 2026-10-31; OPEN-QUESTIONS 116–123). The tool carries a list of gas plants so that every plant near a site enters the analysis (its power leased or bought, its grid connection taken over when it closes).

- **Source:** powerplantmatching, PyPSA project, `powerplants.csv` (https://github.com/PyPSA/powerplantmatching). Data licence CC BY 4.0 (code MIT): the tool credits it on screen, in the PDF and in the flags.
- **Pinned version:** commit `2889ad9d1754a7ee4368b9282d7af835bf572ca2` (release v0.9.1, 2026-10-07). The script records the file's sha256.
- **Kept:** natural gas, 50 MW or more, in the tool's countries, with a position: 608 plants at this version.
- **Output:** `../app/src/data/gas-plants.js` (about 79 KB), bundled by the app build into every version. Nothing is downloaded at run time; the Windows program stays offline.

## Rebuild at a release

Needs Node 22 and internet (GitHub). No packages.

```
cd energy-strategy-tool/plant-data
node build-plants.mjs                 # the pinned version
node build-plants.mjs --ref <commit>  # a newer version of the list
node build-plants.mjs --csv <file>    # a local copy of powerplants.csv
```

Then rebuild the app (`cd ../app && npm run build`), run the tests (test 50 checks the Eemshaven plants), and record the new commit here and in `app/BUILD-NOTES.md`.

## What the list is and is not

The list merges GEM, ENTSO-E, OPSD, JRC, MaStR (Germany), WRI, OSM and other open lists. It carries some plants twice, few closure dates (70 of the 626 large gas plants in Europe at the research date) and some "first year" values that are the site's, not the plant's (`docs/research/existing-plant-2026-10-31.md`). The engine uses each value only where plausible and shows its basis; the engineer checks every plant with its owner.
