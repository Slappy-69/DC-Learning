# User guide: Data Centre Energy Strategy Tool

The user guide and technical reference for the tool, written on 2026-10-21. It describes the tool **as agreed in the owner's walkthrough of 2026-10-21** and labels everything:

- **Built**: in the current program (engine 0.2.0-site, `main` at commit 441635e). Screenshots are of this version.
- **Agreed, not built yet**: decided in the walkthrough. Pictures of these screens are mock-ups with a striped "MOCK-UP" banner; their layout and wording are illustrative.
- **Open**: not settled. Chapter 56 lists them; `../../brief-v2/OPEN-QUESTIONS.md` holds them as questions for the owner.

It comes in two editions with the same content: an EPUB for Kindle and other e-readers, and an A4 PDF. Neither is stored here; build them with the commands below (about a minute).

## What is where

| Folder | Contents |
|---|---|
| `src/` | The text: chapter Markdown in reading order (`00-front.md` … `08-appx-countries.md`), `metadata.yaml` |
| `src/img/` | The 46 figures: `s*` screenshots of the program, `m*` mock-ups of agreed screens, `d*` diagrams (256-colour PNG) |
| `mock/` | The mock-ups as HTML pages (open one in a browser to see an agreed screen); drawn by `tools/make_mocks.py` |
| `diag/` | The diagrams as HTML pages; drawn by `tools/make_diagrams.py` |
| `data/` | The full T1 example run of 2026-10-21 exported from the engine, and the defaults registry, country data and exchange rates. Every worked example in the guide comes from these files |
| `tools/` | The scripts that build the books and regenerate the figures, appendices and data |
| `build/`, `out/` | Made by the tools; not stored in the repository |

## Build the books

Needs Python 3 with `weasyprint`, `beautifulsoup4`, `Pillow` and `playwright` (with Chromium), pandoc 3, Node and npm, and the Inter font installed for the cover and figures. Optional: Java with EPUBCheck, and qpdf.

```
cd energy-strategy-tool/docs/user-guide/tools
python3 build_epub.py     # out/Data-Centre-Energy-Strategy-Tool-User-Guide.epub
python3 build_pdf.py      # out/Data-Centre-Energy-Strategy-Tool-User-Guide.pdf (fetches the fonts once)
```

Check the EPUB with EPUBCheck (`java -jar epubcheck.jar out/*.epub`, expect no errors) and look at chapter pages the way a small e-reader shows them with `python3 render_epub.py ch005.xhtml`. Rebuilding on 2026-10-22 gave an EPUB with no EPUBCheck messages and a 171-page PDF.

## Keep the guide in step with the program

When a work package of `../BUILD-PLAN.md` is built:

1. In the chapters it touches, change "Agreed, not built yet" to "Built" and describe what the program now does.
2. Replace its mock-up with a screenshot: capture with `tools/screenshots/shot_real.py` (build the app first), cut with `tools/screenshots/crop.py`, and point the chapter at the new `s*` figure. Delete the mock-up when nothing uses it.
3. Update the status table in chapter 56 and the findings in chapter 54.
4. If defaults changed, export the registry again and regenerate the appendices: `node dump-registry.mjs` then `python3 make_appendices.py`.
5. If worked examples changed, export the T1 run again (`node export-run.mjs`, `node export-temps.mjs`), compare it with the files in `data/`, and update the numbers in the text and the diagrams (`python3 make_diagrams.py`, then `python3 shot_diagrams.py`).
6. Rebuild the books only when the owner asks.

Each script says at the top what it reads and writes. On 2026-10-22 every script was run from this folder against `main` (commit 441635e) and reproduced the stored files exactly; the only difference was the run time recorded in `data/t1-scoring.json`.

## Fonts and data

The PDF uses Source Serif 4, Inter and JetBrains Mono, all under the SIL Open Font Licence, fetched from npm into `build/fonts`. The data files are outputs of the tool's own engine; the country data in them are the program's synthetic calibration targets, labelled indicative and unverified.
