# Status: concept-design energy strategy tool

Checkpoint, updated after every completed step so any session can resume from here. New sessions: read `../CLAUDE.md` first.

**Last updated: 2026-11-06**: work package 23 (screen every combination below 20,000; full detail for the best 2,000 options) merged into `main` with the owner's yes ("Merge"), a fast-forward to afeb99b after GitHub's checks passed on it. Earlier: work package 22 (the report review), the local search trial and the takeover research merged into `main` with the owner's yes ("Merge"). Rebuilds of the Windows program and the phone page still on hold (owner, 2026-11-06). Work package 23 (screen every combination below 20,000) built on `feature/screen-all`, not merged; with T1 screened in full a re-run crashed the browser page, so the owner chose "Keep detail for the top 2,000" (OPEN-QUESTIONS 154): built the same day on the same branch (T1 in the page: 1,033 MB to 287 MB; the workers now send the best 2,000 in full and the rest as light records). Node suite 97/97 and browser suite 43/43 passed on 12793fc; GitHub's checks passed on afeb99b; merged into `main` with the owner's yes ("Merge", 2026-11-06), a fast-forward to afeb99b. The owner can delete `feature/screen-all` on GitHub. The owner asked for the old branches to be deleted; a Claude session cannot delete branches (both git and the GitHub API refuse), so the owner deletes them on GitHub. Earlier: work package 22 (the report review: study-style front figures, plain flag lines, shorter appendices, four new figures and a new section 5, new recommendations) built on `feature/report-review`, not merged. Earlier: work packages 20 (PUE entered directly) and 21 (the PDF report in the layout of the study report) merged into `main` with the owner's yes ("Go ahead with the merge"), a fast-forward to c6b63f5; OPEN-QUESTIONS 140 and 142–146 confirmed. The Windows and phone rebuilds are on hold, and the Haiku check, the OpenStreetMap idea, known issue 35 and the defaults research are paused (owner). The England 260 MW study is closed ("that's done"); its files stay offline. Earlier the same day: `STATUS.md` rewritten and shortened at the owner's request; known issue 35 logged; both merged into `main` from `feature/status-tidy` with the owner's yes ("Yes merge", 2026-11-02); the four old branches not in `main` copied to `archive/` branches; deleting the 33 old branches left to the owner on GitHub (see "Old branches").

## Where things stand

- **`main` holds everything built:** work packages 0 to 22 and 3b, the hourly weather work, the phone version, the Eemshaven study, the local search trial and the takeover research. Each was merged with the owner's yes (dates under "Work packages"). Nothing is built and waiting on another branch.
- **Built, not merged:** nothing. Work package 23 merged on 2026-11-06 (owner: "Merge").
- **GitHub checks (CI):** passed on `main` at 39442fb (run 41474468291, 2026-11-02: Node tests, build, installable web app tests and browser tests). The earlier runs on the merge (3b607e8) and the next note (991e85e) were cancelled, each by the next push.
- **Windows program:** not rebuilt since work packages 20 and 21 (on hold, owner, 2026-11-02). "Desktop builds" run 41474031494 (from `main` 991e85e, 2026-11-02) passed on Windows and Linux, with 2,926 NOAA stations bundled from "Weather data" run 41470033736. Download: GitHub → Actions → Desktop builds → that run → Artifacts → `desktop-win32-x64` (219 MB, kept until 2027-01-31). A duplicate run, 41474599019 (from 39442fb, which changed only records), also passed.
- **Phone page:** version 8 (2026-10-30). It does not have the weather work, package 19 or packages 20–21. Republishing is on hold (owner, 2026-11-02).
- **Eemshaven study:** made before the plant list, so its figures leave out existing plants. The re-run is dropped for now (owner, 2026-11-02).
- **Known issues:** 1 to 34 resolved; 35 open (`docs/KNOWN-ISSUES.md`).
- **Waiting for the owner:** the next step (candidates under "Next"), the fix for known issue 35, and the rest of the notes on the user guide ("Open items").

## Where to look

- **Brief (authoritative):** `brief-v2/BRIEF.md` (revision 5), with `CHANGELOG.md`, `ASSUMPTIONS.md` and `OPEN-QUESTIONS.md` (1–130).
- **Decision log of the walkthrough:** `docs/walkthrough-decisions-2026-10-21.md`. Where this file or the brief disagrees with it, the log is newer.
- **Build plan:** `docs/BUILD-PLAN.md`: each work package with its questions, acceptance tests and guide chapters, and the "Not scheduled" list.
- **Known issues:** `docs/KNOWN-ISSUES.md` (35 items: 1–34 resolved, 35 open).
- **Build notes:** `app/BUILD-NOTES.md`: architecture, every default with its label, decisions and test runs.
- **Verification:** `verification/HISTORY.md`, with one folder of reports per slice.
- **User guide:** `docs/user-guide/` (text, figures, mock-ups of the agreed screens, and the tools that build the EPUB and PDF).
- **Windows program:** see "Where things stand". Unsigned: Windows shows "Windows protected your PC" the first time (More info → Run anyway). `packaging/README.md`.
- **Phone:** the private Claude page "Concept Energy Optioneering" (https://claude.ai/artifact/KZ5isQcoksrwHY1AqTHU55). `app/BUILD-NOTES.md`, "Phone version".
- **Any browser, offline:** `energy-tool-single-file.html`; open it directly, no setup.
- **Case studies:** `studies/pego-rev3/` (Pego, revision 3.1, 2026-10-24) and `studies/eemshaven/` (Eemshaven 750 MW, 2026-11-02; written report: the Claude Docs document "Eemshaven 750 MW IT Campus — Energy Strategy Study", https://claude.ai/artifact/88xvQzuyEZDgfHUPd96MJR).

## Scope (walkthrough of 2026-10-21, with later changes)

- **Audience:** data centre consultancies in general, not RED specifically. The repository stays public.
- **Platforms:** the Windows program, and the phone page (dropped in the walkthrough, restored by the owner on 2026-10-30: "Create a proper working phone version"). No macOS or Linux downloads.
- **Location:** a map pin sets the location and the country. Planned, not built: an offline map with roads (licence and file size not checked).
- **Site tab:** Beta. Hidden by default, turned on in the general settings, labelled Beta, and kept out of the ranking and the PDF.
- **Results and export:** top five cards, the cost-against-carbon trade-off chart, compare up to three, tornado measured in LCOE by default, one PDF export (inputs first). No Excel.

## Work packages

All built and merged into `main` with the owner's yes. Details and acceptance tests: `docs/BUILD-PLAN.md`.

| # | Package | Merged |
|---|---|---|
| 0 | Research the defaults. Batches 1 and 2 applied: 24 records "sourced — not independently checked"; 585 of 609 still "indicative — unverified". Further batches wait for the owner (each source and each default change needs the owner's approval) | 2026-10-24 (batches 1 and 2) |
| 1 | Map pin and country setup (offline outlines, display currency) | 2026-10-24 |
| 2 | Input model with flagged defaults; Site tab Beta switch; solar from roof and ground areas | 2026-10-24 |
| 3 | Contracted grid capacity and the fixed grid connection charge | 2026-10-24 |
| 3b | Power adequacy first: bridging, ordering from day one, firm generation sized two ways, backup per building or pooled | 2026-10-24 |
| 4 | Flexibility and battery logic | 2026-10-24 |
| 5 | The O1–O3 PPA and carbon rules | 2026-10-24 |
| 6, 7 | Results cards and the trade-off chart; Compare | 2026-10-24 |
| 8 | Dispatch views and the representative-day screening tier (off by default) | 2026-10-24 |
| 9, 10 | Tornado; PDF export | 2026-10-24 |
| 11 | Engine fixes from the Haiku checks and the Pego study (known issues 1–3, 8–11, 14–18) | 2026-10-24 |
| 12 | Existing plant near the site, leased | 2026-10-24 |
| 13 | A large campus laid out on demand | 2026-10-24 |
| 14 | Archetypes and identical options (known issues 4, 5) | 2026-10-24 |
| 15 | Study files: save and reopen | 2026-10-24 |
| 16 | Plain-English summary | 2026-10-25 |
| 17 | Breakeven table | 2026-10-25 (check H6 fixes 2026-10-26) |
| 18 | Uncertainty by Monte Carlo | 2026-10-25 (check H6 fixes 2026-10-26) |
| 19 | Existing gas plants near the site in the analysis: 608 plants bundled (powerplantmatching, CC BY 4.0), leased, bought for the units used or bought whole, grid connection takeover (C21), backup after a bought plant stops (C22); OPEN-QUESTIONS 116–130 | 2026-11-02 |
| 20 | PUE entered directly: annual and maximum PUE in place of the four cooling types (C8 removed); hourly PUE follows the weather between them; backup and heat rejection at the maximum PUE; optional WUE; one white-space density; no CHP absorption credit | 2026-11-02 |
| 21 | PDF report in the layout of the study report: answer-first front page with four headline figures, sections 1–8 with three charts, recommendations by fixed rules, inputs and tables in appendices A–G; report details (question, prepared for and by) kept with the study | 2026-11-02 |
| 22 | Report review: study-style front figures; one plain line per flag; Appendix A with plain names and only the inputs that apply, Appendices B, F and G shortened; programme timeline, LCOE build-up, energy by year and carbon by year (new section 5); call-outs on figure 1; recommendations on consents, fuel store, gas supply and backup, with budgets | 2026-11-06 |
| 23 | Screen every combination below a limit: `settings.screenAllBelow` 20,000; every valid combination screened up to it, sampling above it; full detail kept for the best 2,000 options, the rest rebuilt when shown (OPEN-QUESTIONS 154) | Merged 2026-11-06 (owner: "Merge") |

Also merged: the fixes from the Opus review of checks H4–H6 (known issues 22–27) and the hourly weather work (EPW upload; NOAA station years in the Windows program; OPEN-QUESTIONS 106–107, 114), both 2026-10-31; the phone version, 2026-10-31; the fixes from the weather review (known issues 28–32, OPEN-QUESTIONS 115) with the Eemshaven study, 2026-11-02.

## Verification

Builder and reviewer: Claude Opus. Verifier: Claude Haiku. After every three Haiku checks, one Opus review. Full record: `verification/HISTORY.md`.

| Slice | Checks |
|---|---|
| Brief v2; core; run log; single-file build; Pareto view; Site (now Beta) | Haiku ×3 and Opus each (2026-10-15 to 2026-10-17) |
| Port from the other line: Dispatch tab, tornado, PPA rule | Haiku H1–H3 and Opus (2026-10-18) |
| Packaging (Windows program, PWA, workflows) | Haiku H1; **the Opus review stopped at a usage limit on 2026-10-19 and never reported** |
| Brief revision 5 and the build handoff | Haiku check 1 (2026-10-22) |
| Packages 0–10 (walkthrough build) | Haiku H1–H3 (2026-10-23); Opus review waived by the owner |
| Packages 11–15 | Haiku H4 (2026-10-24); Opus review waived by the owner |
| Package 16 | Haiku H5 (2026-10-24) |
| Packages 17, 18 | Haiku H6 (2026-10-26); then the Opus review of H4–H6 (2026-10-30), fixed as known issues 22–27 |
| Hourly weather | Opus R1–R3 and Haiku H-records (2026-10-31), fixed as known issues 28–32 |
| Package 19 | Haiku H1–H3 and Opus (2026-10-31), fixed or decided (OPEN-QUESTIONS 124–130, known issue 33) |
| Phone version | Browser check B41 and a phone-width run; no Haiku or Opus check |

No Opus review is due: no Haiku check has run since the package 19 review.

Last full local test runs (2026-11-02): Node 90/91 and browser 41/43, the failures fixed and re-run on their own (known issue 34; B9 and B38 timing). The full suites were not re-run locally after those fixes; GitHub's run on 0ec8849 is the check of record.

## Builds on GitHub

- **CI** (`.github/workflows/ci.yml`): Node tests, build, installable web app tests and browser tests, on every push to `main` or a `feature/` branch and on pull requests. A newer push to the same branch cancels the older run.
- **Desktop builds** (`desktop.yml`): the Windows program, with a Linux copy built only to launch-test it under a virtual display. Runs when the packaging or the workflow changes, on a `v*` tag, or by hand. It bundles the stations of the latest full "Weather data" run (not a trial, 2010–2024, 10 years, all nine groups, at least 1,500 stations). Without one it warns, and a tag fails; but see known issue 35.
- **Weather data** (`weather-data.yml`): by hand. Full build of 2026-11-02 (run 41470033736): 24 minutes, 2,926 stations in 30 countries (none in Malta), 137.9 MB, 59.7 MB compressed. The first full build (2026-10-31, 1,942 stations) predates the summary fields and no longer qualifies.
- **Starting a workflow from a Claude session:** POST to `https://api.github.com/repos/Slappy-69/DC-Learning/actions/workflows/<file>/dispatches` with the body `{"ref":"main"}`. Results can be read from the public API.

## Next

The owner chooses. Candidates (2026-11-02):

- rebuild the Windows program and republish the phone page with work packages 19–21 (on hold, owner, 2026-11-02);
- re-run Eemshaven with the plant list on;
- a second search around the leaders (local search), to find the best option more surely than sampling (a cheap trial first);
- research of each country's rules for taking over a closing plant's grid connection (every takeover is flagged as an assumption until then);
- the defaults research (549 of 573 records "indicative — unverified"), starting with the values that move the ranking most (paused, owner, 2026-11-02);
- a first tagged release (version 1.0), after known issue 35 and the packaging Opus review.

Not scheduled (ask the owner first): `docs/BUILD-PLAN.md`, "Not scheduled".

## Open items

- **Work packages 20 and 21:** the user guide's T1 worked examples outside chapters 6 and 33 still show the cooling-type model (re-export the T1 run, README step 5), figure 10 still shows the cooling selector, and the figure of the PDF contents (`img/m09-pdf.png`) shows the layout of 23 October. The owner will come back to the report's content. Not verified by Haiku (paused, owner, 2026-11-02).
- **Work package 22:** OPEN-QUESTIONS 148–152 (front figures, plain flag lines, shorter appendices, the new figures, the new recommendations) are Claude's defaults, for the owner to confirm.
- **Done on 2026-11-02 from the owner's list:** the local search trial (`docs/research/local-search-trial-2026-11-02.md`: sampling missed the best option on T1 and T3, the sampled leader was 11th; screening every combination took 49 s on T1; options A to C put to the owner) and the takeover research (`docs/research/plant-connection-takeover-2026-11.md`: no source lets a demand user take over a closing plant's connection; Spain and Portugal re-tender it for renewables; Ireland's large energy user policy is not modelled; four changes put to the owner).
- **Next, chosen by the owner (2026-11-02):** still to do: the user guide pictures (after the report and the search), and two modelling ideas for the list: energy centre as a service, and earning from the standby fleet (`docs/BUILD-PLAN.md`, "Next, chosen by the owner").
- **Planning round on existing plants (owner, 2026-11-07), no building until the owner says the plan is done:** the takeover flag by country, the takeover and every other use of a nearby plant switched on from a drop box on the results, takeover options ranked on merit, and four new uses (private wire, supply contract, plant keeps selling, standby and flexibility income), and optional grid charges per MW: OPEN-QUESTIONS 155–165, on `feature/takeover-decisions` (not merged).
- **Idea, paused (owner, 2026-11-02):** bundle OpenStreetMap substations (110 kV and above) to list those near the pin and set a default off-site cable route (possible work package 22).
- **Known issue 35:** a Windows build without weather stations fails launch check D5 instead of going on with a warning. Fix not decided. Paused (owner, 2026-11-02).
- **Packaging Opus review** not done (stopped 2026-10-19). Run one before further packaging work or a release.
- **Windows program:** launch-tested only on its Linux copy, never automatically on Windows itself. Not code-signed.
- **Screen reader:** the NVDA walk-through has not been done.
- **Defaults:** 549 of 573 records "indicative — unverified", 24 "sourced — not independently checked", none verified (after work package 20 removed the cooling-type records). Some core run constants have no §18 default record yet. The research is paused (owner, 2026-11-02).
- **Owner's notes on the user guide** (`docs/owner-notes-on-user-guide-2026-10-22.md`): page 35 ("I want full run every time") left open on 2026-10-22; the screening tier was then built off by default (OPEN-QUESTIONS 23), so every run is a full-year run unless the engineer turns it on. Pages not yet discussed are listed at the end of that file.
- **Speed:** a run takes 15–20 s for 2,000 options on the owner's machine (owner's figure, 2026-10-21); the owner has said speed is not a priority. Breakevens take 4–5 s in Node and 7 s in a browser (target 3 s); Monte Carlo 300 × 20 about 12 s in Node and 30 s in a browser (target 8 s); some of their steps on the main thread last up to 180 ms (target 50 ms; a worker would fix it, not scheduled). Weight-change repaint 96–166 ms in the sandbox (OPEN-QUESTIONS 35; the browser check fails above 300 ms).
- **Idea, not decided:** skipping the site layout in every run while the Site tab is off would roughly halve T1's run time (17 s to about 8 s). OPEN-QUESTIONS 83 covers only large campuses.
- **Left from the Haiku checks:** no Grid + export contract input; two tornado observations (`app/BUILD-NOTES.md`, "Verification fixes").
- **Site (Beta) gaps:** roads allowance from access points, image underlay, footprint override, heat-reuse blocks. The gas-pipe rate (€0.8 m/km) is a judgement value.
- **From package 19, suggested and not asked for:** a link from the plant list's "Eemshaven" 1976 entry to Eemscentrale (the list may hold it twice).

## Decisions

Every decision is recorded with its date in `brief-v2/OPEN-QUESTIONS.md` (1–130) and the brief; the walkthrough's in its decision log. Questions 19–130 are answered, except 31 (fix the known issues found while writing the guide), whose items are all resolved but whose row has not been updated. Questions 1–18 each have a proposed default in the brief, and each row's last column says what the walkthrough did with it (2, 6, 9, 11, 15 and 17 were not discussed and use their defaults). Interpretations taken without asking are in `app/BUILD-NOTES.md`.

The decisions that shape the most:

- **Main question** (OPEN-QUESTIONS 37): the best power strategy to maximise IT load with up to five nines of availability.
- **Power adequacy first** (38–41): unmet load at any hour puts an option at the bottom of the ranking.
- **Flag, never enforce** (brief §2, principle 5): every other breach raises a flag and never hides, demotes or resizes an option.
- **No PPA income without physical delivery** (2026-10-18), with O1–O3 (2026-10-21; OPEN-QUESTIONS 22, 49, 62).
- **Defaults** (OPEN-QUESTIONS 36): a researched default shows "sourced — not independently checked" until a person responsible for the data checks it.
- **Offline:** the Windows program makes no network connection (check D12); data is prepared at each release and bundled.

## Old branches

The owner asked on 2026-11-02 to archive the 33 branches below, and then said "Yes delete them". The four not in `main` were copied the same day to `archive/codex/energy-tool-experiment`, `archive/concept-sensitivity-tab`, `archive/concept-site-layout` and `archive/feature/windows-build-2026-10-30` (each checked on GitHub to point at the same commit). **The 33 originals are still on GitHub:** a Claude session's connection to GitHub refuses both tags and branch deletions (HTTP 403), so the owner deletes them on GitHub (Code → Branches → the bin icon on each row). `feature/status-tidy` (this rewrite), `feature/pue-inputs` and `feature/report-redesign` (work packages 20 and 21, merged 2026-11-02) are in `main` too and can be deleted with them: 36 branches in all. Keep `feature/known-issue-35`: it holds unmerged work on known issue 35 (paused). Once the 36 are gone, the branches left are `main`, `feature/known-issue-35` and the four `archive/` copies.

"In `main`" means every commit of the branch is part of `main`'s history, so nothing on it is lost if the branch goes; it can be recreated exactly from its last commit: `git push origin <commit>:refs/heads/<branch>`.

| Branch | Last commit | What it held | In `main` |
|---|---|---|---|
| `codex/energy-tool-experiment` | d9008e4 (2026-10-19) | The owner's own experiment: `codex-build/README.md` and a test workflow | No: 2 commits |
| `concept-sensitivity-tab` | f1fd5c5 (2026-10-15) | Parallel work by another session: a tornado tab (its useful parts were ported) | No: 1 commit, also on `concept-site-layout` |
| `concept-site-layout` | 2f73715 (2026-10-18) | Parallel work by another session: site layout, Dispatch tab, hosted build (its useful parts were ported) | No: 8 commits |
| `feature/windows-build-2026-10-30` | f1d3598 (2026-10-30) | A note recording the Windows rebuild of 2026-10-30 (`packaging/PACKAGING-PROGRESS.md`), which started Desktop builds run 41142184199 | No: 1 commit |
| `docs/status-walkthrough-2026-10-21` | 441635e | The status update of 2026-10-21 | Yes |
| `feature/build-handoff-2026-10-21` | ec5d309 | Brief revision 5, build plan, known issues, decision log, user guide, `CLAUDE.md` | Yes |
| `feature/pareto-verification` | 60fe41a | Pareto view and its checks | Yes |
| `feature/site-layout` | d3ba899 | Site slice and its checks | Yes |
| `feature/port-concept-line` | 9919f5b | The port: Dispatch tab, tornado, PPA rule | Yes |
| `feature/packaging` | 4559184 | Windows program, PWA, workflows | Yes |
| `feature/defaults-research` | c8890d6 | Package 0, batch 1 | Yes |
| `feature/site-tab-beta` | 7979f54 | Package 2: the Site tab's Beta switch | Yes |
| `feature/solar-areas` | 2cc9396 | Package 2: solar areas | Yes |
| `feature/adequacy-first` | 410b784 | Package 3b | Yes |
| `feature/flex-batteries` | e1d7753 | Package 4 | Yes |
| `feature/ppa-rules` | ac86bc9 | Package 5 | Yes |
| `feature/results-cards` | 5599268 | Packages 6, 7, 9, 10 | Yes |
| `feature/grid-contract` | 0e397a3 | Package 3 | Yes |
| `feature/input-model` | de90263 | Packages 1, 2, 8 | Yes |
| `feature/defaults-batch2` | 8ec5a29 | Package 0, batch 2 | Yes |
| `feature/verification-fixes` | ddf0dad | Fixes for Haiku H1–H3 of the walkthrough build; Pego revision 3 | Yes |
| `feature/engine-fixes` | 05aa425 | Packages 11–15 | Yes |
| `feature/plain-summary` | 33f9c1a | Packages 16–18 | Yes |
| `feature/handoff-2026-10-25` | ed08f9c | The new-chat handoff of 2026-10-25 | Yes |
| `feature/verification-h6` | 3eb59a9 | Haiku check H6 and its fixes | Yes |
| `feature/review-2026-10-30` | e61ed9d | The Opus review of H4–H6 | Yes |
| `feature/review-fixes` | 616523c | Its fixes (known issues 22–27) | Yes |
| `feature/weather-research` | a6f62c3 | The hourly weather research | Yes |
| `feature/phone-2026-10-30` | ea84c54 | The phone version | Yes |
| `feature/weather` | 59be52e | Hourly weather: EPW upload, NOAA station years | Yes |
| `feature/weather-review` | 2b2b8cb | The weather review (R1–R3, H-records) | Yes |
| `feature/weather-fixes` | bf12bce | The weather review fixes and the Eemshaven study | Yes |
| `feature/existing-plant` | 0ec8849 | Package 19 | Yes |

## How to run

```
cd app
npm ci
npm run build          # dist/, including energy-tool-single-file.html (build first: test 14 reads dist/)
npm test               # Node suite
npm run test:browser   # Playwright and axe (needs Chromium)
```

## Working rules

The full list is in `../CLAUDE.md`. In short: work on a `feature/` branch and push as you go; nothing goes into `main` without the owner's written yes; one question per message, in plain British English, never assuming an answer; say before an expensive step; update this file after every completed step.
