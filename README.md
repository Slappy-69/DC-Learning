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

Pick whichever suits you. All three run the same model entirely on your device, with no server and no network
connection while it runs.

1. **Single file (any browser, offline).** Download
   [`energy-strategy-tool/energy-tool-single-file.html`](energy-strategy-tool/energy-tool-single-file.html)
   (on that page: "Download raw file") and open it in Chrome, Edge, Firefox or Safari. Works on a phone too.
2. **Desktop program (Windows, macOS, Linux).** Open the **Actions** tab, choose **Desktop builds**, then
   **Run workflow**. When it finishes, download your platform's archive from the run's *Artifacts*, unzip it and start
   the program. The builds are **not code-signed**, so Windows SmartScreen ("Windows protected your PC" → *More info* →
   *Run anyway*) and macOS Gatekeeper (right-click the app → *Open*) warn the first time.
   See [`energy-strategy-tool/packaging/README.md`](energy-strategy-tool/packaging/README.md).
3. **Installable web app (PWA).** Built and tested in `energy-strategy-tool/packaging/` but **not hosted yet**: hosting
   it on GitHub Pages is a separate decision. Every CI run uploads the built PWA as the `pwa` artifact.

## Repository layout

| Path | What it is |
|---|---|
| `energy-strategy-tool/STATUS.md` | Current state, decisions waiting for the owner, known gaps. **Read this first.** |
| `energy-strategy-tool/brief-v2/` | The authoritative brief (`BRIEF.md`), change log, assumptions, open questions |
| `energy-strategy-tool/app/` | Source (React + a plain-JS engine), tests, build script; `BUILD-NOTES.md` records every default, decision and test run |
| `energy-strategy-tool/verification/` | Independent verification reports for each slice (`HISTORY.md` summarises them) |
| `energy-strategy-tool/packaging/` | PWA and Electron desktop packaging, with their tests |
| `energy-strategy-tool/energy-tool-single-file.html` | The latest single-file build, committed so it can be downloaded directly |
| `.github/workflows/` | `ci.yml`: Node tests, build, PWA tests and browser tests on every push to `main` or a `feature/` branch and on pull requests. `desktop.yml`: the four desktop builds and the Linux desktop test, run by hand, on a `v*` tag, or when `energy-strategy-tool/packaging/` changes on `main` or a `feature/` branch |

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
node desktop/build-desktop.mjs --platforms linux-x64 && npm run test:desktop   # desktop program (Linux, needs xvfb)
```

After changing the app, copy `app/dist/energy-tool-single-file.html` over `energy-strategy-tool/energy-tool-single-file.html`
so the downloadable file stays current.
