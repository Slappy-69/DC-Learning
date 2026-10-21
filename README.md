# DC-Learning

## Concept Energy Optioneering

A concept-stage tool for choosing an energy-supply strategy for a data centre campus. For one site it generates about
2,000 supply options (grid, diesel, gas, solar PV, batteries, PPA structures, cooling and resilience choices), runs each
through an 8,760-hour dispatch model and one cash-flow ledger, and scores them on four axes:

| Axis | Weight |
|---|---|
| Cost (LCOE from the ledger) | 35 % |
| Carbon | 25 % |
| Time to power | 25 % |
| Deliverability | 15 % |

Weights are editable. Site fit is shown as a badge ("Fits", "Fits with flags", "Does not fit"), not a weight.

Views: ranked options, a Pareto trade-off chart with a table alternative, a **Dispatch** tab (phasing timeline, hourly
dispatch, annual balance), a **Sensitivity** tab (tornado), a **Site** tab (draw or import a boundary as GeoJSON/KML,
automatic block layout, site-fit checks), and a run log you can export as JSON or CSV.

> Every default value is labelled "indicative — unverified". No default has a verified source yet. The tool is for
> comparing options at concept stage, not for design figures.

## Use it

The model runs entirely on your device, with no server and no network connection while it runs.

1. **Windows program.** Open the **Actions** tab, choose **Desktop builds**, open the latest run with a green tick (or
   press **Run workflow**), and download `desktop-win32-x64` from its *Artifacts* (signed in to GitHub). Unzip it and
   run `Concept Energy Optioneering.exe`. It is **not code-signed**, so Windows shows "Windows protected your PC" the
   first time: choose *More info* → *Run anyway*. Details in
   [`energy-strategy-tool/packaging/README.md`](energy-strategy-tool/packaging/README.md).
2. **Phone.** The owner's private Claude link, "Concept Energy Optioneering", holds the latest build and opens in the
   phone's browser.
3. **Any browser, offline.** Download
   [`energy-strategy-tool/energy-tool-single-file.html`](energy-strategy-tool/energy-tool-single-file.html)
   ("Download raw file") and open it in Chrome, Edge, Firefox or Safari.

## Repository layout

| Path | What it is |
|---|---|
| `energy-strategy-tool/STATUS.md` | Current state, decisions waiting for the owner, known gaps. **Read this first.** |
| `energy-strategy-tool/brief-v2/` | The authoritative brief (`BRIEF.md`), change log, assumptions, open questions |
| `energy-strategy-tool/app/` | Source (React + a plain-JS engine), tests, build script; `BUILD-NOTES.md` records every default, decision and test run |
| `energy-strategy-tool/verification/` | Independent verification reports for each slice (`HISTORY.md` summarises them) |
| `energy-strategy-tool/packaging/` | PWA and Electron desktop packaging, with their tests |
| `energy-strategy-tool/energy-tool-single-file.html` | The latest single-file build, committed so it can be downloaded directly |
| `.github/workflows/` | `ci.yml`: Node tests, build, PWA tests and browser tests on every push to `main` or a `feature/` branch and on pull requests. `desktop.yml`: the Windows program for download and a Linux build for the launch test, run by hand, on a `v*` tag, or when `energy-strategy-tool/packaging/` changes on `main` or a `feature/` branch |

## Develop

Needs Node.js 22.

```
cd energy-strategy-tool/app
npm ci
npm run build          # writes dist/: app files, energy-tool-single-file.html, energy-tool-hosted.html
npm test               # Node suite (engine, ledger, scoring, site layout, dispatch, sensitivity)
npm run test:browser   # Playwright + axe; needs Playwright and Chromium (skips with a message if absent)

cd ../packaging
npm ci
npm run pwa && npm run test:pwa                                        # installable web app
node desktop/build-desktop.mjs --platforms win32-x64,linux-x64 && npm run test:desktop   # Windows program; Linux build for the test (needs xvfb, strace)
```

After changing the app, copy `app/dist/energy-tool-single-file.html` over `energy-strategy-tool/energy-tool-single-file.html`
so the downloadable file stays current.
