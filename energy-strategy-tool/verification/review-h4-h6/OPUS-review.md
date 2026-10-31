# Opus review after Haiku checks H4, H5 and H6 (work packages 11 to 18)

Reviewer: Claude Opus 5.5. Date: 2026-10-30.
Branch: `feature/review-2026-10-30` (code identical to `main` at commit 3eb59a9). Working tree used as it is; no file changed outside this folder.
Scripts: `scripts/r1-…` to `scripts/r15-…` in this folder; their output is in `logs/`. Each script runs the engine directly in Node 22. One check (r13) also runs a scratch copy of the engine with a one-line change; that copy is outside the repository and is described where it is used.
Not run: `npm test` (77/77 on `main` today, and no code was changed) and the browser suite (41/41 elsewhere today). `npm run build` was run once to compare the single-file build with the committed copy.
The earlier cheaper pass in `/home/claude/review/` was not read before this report was written (see the end).

## (a) In one minute

The engine work in packages 11 to 15 is sound. The hourly energy balance, the lease and hire rules for existing and rented plant, the PPA back-off, the ledger and the study files all held in my own checks. Most of the Haiku fixes are real. Three things matter most. **First**, the "capex" driver used by the tornado, the breakeven table and the Monte Carlo does not scale the cooling capex line. So the breakeven "#2 would lead if capex rose to × 1.41" is false. That flip is shown in the table, the summary, the PDF and the guide. With the line scaled, there is no flip at all, and a full re-run at × 1.5 keeps the leader first. **Second**, if you run the Monte Carlo, the summary drops sentences to stay under 250 words. On T1 it then drops the leader's major permitting flag (IED). The summary and the PDF then say only "Open flags on the leader. Resilience: meets the requirement." **Third**, the robust pick sits on a one-sample margin. The summary and the PDF still name #7 as "the robust pick, not the leader", but changing the random seed or the number of options re-run gives #1 instead. Two smaller rule breaks are also worth fixing. Defaults for the existing plant are never flagged on the options that use them. And a study reopened with the Site tab off can still rank with the Beta site-fit penalty.

Status counts (rows in (b) to (e): 15 claims, 12 new findings, 41 sound checks, 9 not checked): **53 VERIFIED, 15 FAILED, 9 NOT VERIFIED** (77 rows). New findings: 2 high, 4 medium, 6 low, and one note (N-13). Fixed-claims table: 15 claims checked: 11 fixed or settled by the owner, 1 not fixed as recorded, 3 partly fixed.

## (b) The "fixed" claims for the High and Medium Haiku findings

| Haiku finding | Claim | Verdict | Evidence |
|---|---|---|---|
| H4 M-1 land-take ceiling hid options not laid out | Kept in view, chip says how many | **Fixed** (VERIFIED) | `scoring.js:157–163`. r6 (g): ceiling 10 ha keeps A (not laid out) and B, drops C; chip "Land take ≤ 10 ha (1 not laid out, kept)" |
| H4 M-2 rule (o) "changes no result" | Reworded: scores can move by hundredths | **Fixed** (VERIFIED) | `generator.js:117–118`; KNOWN-ISSUES 5. r11: with the Beta site-fit penalty on, T2, 40 options × 3 heat-rejection locations: deliverability and site fit never differ |
| H4 M-3 stale guide figures | Dated or made general | **Fixed** (VERIFIED) | `00-front.md:93`, `04-part4a.md:233`, `04-part4b.md:443` now give both dates |
| H4 M-4 Pego product figures not reproducible | Study file and script stored | **Fixed** (VERIFIED) | r9 (a): `studies/pego-rev3/pego-product.study.json` reopens with no warnings, runs in 13.9 s, leader €144.2/MWh, "Re-run matches the saved study" |
| H5 H1 site-fit text in the PDF through an edited note | Note records `siteBeta`; PDF leaves such a note out | **Partly fixed** (FAILED) | r5: a note saved with the Site tab on is left out (site-fit wording in PDF: false). The same text re-saved after the Site tab is turned off ("Edit note" starts from the note's own text, `SummaryPanel.jsx:15`, and stamps the current state, `:20`) is printed with "Site fit:" wording (true). Finding N-6 |
| H5 M1 250-word limit not enforced | Parts condensed until it fits | **Partly fixed** (FAILED) | The limit holds (r7: 247 words with everything run). But the last-resort loop (`summary.js:411–414`) pops required sentences, including the condensed flag count it has just added. Finding N-2 (High) |
| H5 M2 "gives up nothing" with one adequate option | New wording | **Fixed** (VERIFIED) | r9 (b): "It is the only one of the adequate options, so nothing in its group does better; options that rank below it … do better on deliverability (#682, 96.8 points) and carbon (#814, 71.5 g/kWh)" |
| H5 M3 hourly CFE called "carbon" | `figureName()` | **Fixed** (VERIFIED) | r9 (b): "On hourly CFE it has 66.8 %; the best … #426, has 67.8 %" |
| H5 M4 named parts did not add to the gap | Parts for #2 named by their points | **Fixed** (VERIFIED) | r9 (b): "0.12 points ahead … 0.23 points from cost …, less 0.11 points on hourly CFE"; my parts 0.2294 − 0.1130 = 0.1164 |
| H6 MED-1 six cards, not five | Owner chose six (2026-10-26); records amended | **Settled by the owner** (VERIFIED) | `breakeven.js:53` (`n + 1`); OPEN-QUESTIONS 93 amended; guide `03-part3b.md:253`. r2: competitors #2 #5 #7 #11 #16 |
| H6 MED-2 representative-day caveat too narrow | Panel, summary detail and PDF say the order is approximate | **Fixed** (VERIFIED) | `UncertaintyPanel.jsx:135`, `summary.js:285`, PDF text in r5. r4: the screening bias is small on T1 (LCOE −0.05 % to −0.19 % on the top 20; 100 samples: leader 82 % against 83 % full year, LCOE P10–P90 145.3–171.1 against 145.4–171.2) |
| H6 MED-3 robust pick on a one-sample margin | Counts shown; one decimal in the panel | **Partly fixed** (FAILED) | The panel adds "a gap of a few samples is within the noise of sampling". The summary and the PDF do not: they still say "#7, not the leader (300 of 300 samples against 299)" (r5). The pick changes with the seed and the option pool (r1). Finding N-3 |
| H6 MED-4 breakeven base from the run, re-runs on the full year | Base re-run over the full year with screening on | **Fixed** (VERIFIED) | r6 (h): `baseModel` "full-year re-run"; base points against my own full-year re-run: difference 0; against the run's screening scores: up to 0.0394 points (the stale gap the fix removes) |
| H6 MED-5 compute steps over 50 ms | Not fixed; recorded in BRIEF §17 and the guide | **Not fixed, as recorded** (VERIFIED) | BRIEF §17 note says "not met". r10 adds a case: on the Pego study, breakeven steps take 80–375 ms (finding N-8) |
| H6 MED-6 Appendix A lacked 14 records | Regenerated | **Fixed** (VERIFIED) | `07-appx-registry.md` has 573 entries (`grep -c "^- \*\*"` = 573); r6 (f): registry 573 |

## (c) New findings

### High

**N-1. The "capex (every line)" driver does not scale the cooling capex line, which makes a false breakeven flip.**
- What: `evaluate.js:104–107` applies the capex factor inside `addCapex`. The cooling capex delta against air is booked straight into the ledger (`evaluate.js:211–219`), so it is never scaled. The fuel-cell stack replacements (`evaluate.js:164`, `:191`) are built from unscaled unit costs too. The delta is −€4 m for evaporative cooling, +€15 m for DLC and +€25 m for immersion on T1. So "capex × 1.5" raises total capex by × 1.526 for the evaporative leader, × 1.418 for #2 (DLC) and × 1.370 for #7 (immersion), not × 1.5.
- Why it matters: the tornado, the breakeven table and the Monte Carlo all use this driver. The flip "#2 would lead if capex rose to × 1.41" comes from this error. That flip is shown in the breakeven table, summary part 5, the PDF, guide chapters 22 and 27, and BUILD-NOTES work package 17, whose explanation is that "the leader's capex lines [grow] faster". Haiku H6 row M5 marked this driver "VERIFIED (reading)".
- Evidence: r12: "#1 evap: cooling delta EUR -4.00 m at x1 and -4.00 m at x1.5; … total capex x1.526"; "#2 dlc: … 15.00 m at x1.5; … total capex x1.418"; "#7 immersion: … total capex x1.370". r13 runs the repository engine and then a scratch copy whose only change is `const amt = coolDelta * ps.share * capF;` at `evaluate.js:215`:
  - repository: flip "#2 would lead if capex rose to × 1.41"; full re-run at × 1.42: leader O67PEWY (#2); Monte Carlo 300: #1 leads 83.3 %, #7 16.0 %; tornado capex row €147.92–158.57/MWh.
  - with the line scaled: **no capex flip against any competitor**; full re-runs at × 1.42 and × 1.5: leader OP13Y1Y (the T1 leader), #2 stays #2; Monte Carlo 300: #1 leads 86.3 %, #7 13.7 %; tornado capex row €148.10–158.27/MWh.
- Fix: scale the cooling delta (and the stack-replacement amounts) by `capF` in `evaluate.js`. Add a test that capex × k multiplies `capexExContingency` by exactly k for every cooling type. Then re-run and correct the T1 figures in BUILD-NOTES (work packages 17 and 18), the guide (chapters 22, 27 and 46, and `04-part4b.md:405`, "'Capex' scales every line") and test 45's expectations. This needs a known-issue entry (22) and the owner's yes (see (f)).

**N-2. With the Monte Carlo run, the summary drops the leader's major flag and the breakevens to keep to 250 words.**
- What: the word fit first moves optional sentences, then condenses part 6 to "Resilience: …" plus a count line ("Other flags: 1 major flag and 4 minor flags, listed in More detail"). Then it removes sentences from every part, from the last part back, until the text fits (`summary.js:403–414`). The Monte Carlo adds two required sentences to parts 1 and 4. Parts 5 to 7 then lose their required sentences, and that includes the count line the previous step added. On T1 the leader carries a major permitting flag (IED, aggregated 337 MWth ≥ 50 MWth).
- Evidence: r7. With nothing run, or with the tornado and/or the breakevens, the flags part names the IED major flag. With the breakevens and the Monte Carlo, or with all three, it reads only "Resilience: meets the requirement.". The moved sentences include "Permitting: aggregated combustion thermal input 337 MWth ≥ 50 MWth (IED threshold), a major flag, and 2 minor flags.", "Other flags: 1 major flag and 4 minor flags, listed in More detail." and "Breakevens: #7 would lead if the grid full-connection date slipped by 14 months or more; …". r15 (PDF page 2): "Open flags on the leader Resilience: meets the requirement. Inputs with most influence …". The page has no mention of the IED flag, and the PDF's summary detail skips the flags part (`report.js:151`).
- Why High: running all three analyses is the normal state before printing. The summary page then reads as if the leader has no open permitting issue. Guide chapter 22 says that with many flags the summary "gives their count", which is not true here. BRIEF §14 and OPEN-QUESTIONS 97 put the flags and the nearest breakevens in the text.
- Fix: never remove the first sentence of part 6 or its count line, or a required breakeven sentence. Shorten parts 1 and 4 first (for example, move the Monte Carlo LCOE range to the detail when the tornado range is also there), or let the owner choose a higher limit when all three analyses are run (see (f)). Add a test with the tornado, breakevens and Monte Carlo on T1 that asserts the IED flag (or the count line) and the breakeven sentence stay in the text.

### Medium

**N-3. The summary and the PDF name a robust pick on a one-sample margin, and the pick changes with the seed and the option pool.**
- Evidence: r1. Default seed, top 20: robust pick #7 (300/300) against #1 (299). Seeds 1 and 2: #7. Seeds 3, 4 and 5: #1 (both 300/300, so the tie-break picks the leader). Same samples over the top 60: robust pick #1 (299/300). r5 summary: "the robust pick (most often within 1 % of the best) is #7, not the leader (300 of 300 samples against 299)". The PDF says the same with no caveat. Only the panel says such a gap is noise (`UncertaintyPanel.jsx:103`), and so does guide chapter 27 ("read it as about level").
- Fix: when the margin is within sampling noise (for example under √n samples, or a fixed few samples), say "the robust pick is level with the leader" and do not name another option. Carry the panel's caveat into the summary and the PDF. Owner choice in (f).

**N-4. Existing-plant defaults are not flagged on the options that use them.**
- What: the lease rate (€6/kW/month, judgement), the efficiency, minimum stable load and variable O&M by type (judgement records `existing.types.ccgt.*`), the connection to the campus (default €0) and the rental lead (1 month) are used without being entered. `KEY_INPUTS` in `assumed.js:22–48` has none of them. The decision log says: "Every value not entered by the user is flagged on each option that uses it, with its source listed per option (not only in the run summary)."
- Evidence: r3, T1 with a 2 × 40 MW CCGT and the lease left blank: 446 options use the plant; "options with an assumed-default flag naming the lease or the existing plant: 0 of 446". The cheapest of them (#493, €139.2/MWh) depends directly on the lease rate.
- Fix: add the existing-plant inputs (and `settings.rentalLeadMonths` for leased or rented plant) to `KEY_INPUTS` with "when" conditions on C2/C4 = existing or rented. Owner question in (f).

**N-5. A study reopened with the Site tab off keeps the Beta site-fit penalty in the ranking, and the PDF does not say so.**
- What: `openStudy` (`App.jsx:149–160`) sets the inputs from the file. Only switching the Site tab off clears `deliverability.siteFitPenalty` (`App.jsx:116`). So a study saved with the Site tab and its penalty on, then opened in a session where the Site tab is off (the default), ranks with site fit in deliverability. The penalty field is hidden while the Site tab is off (`InputsPanel.jsx:302`). The PDF leaves the penalty input out (`report.js:21–22`, `SITE_BETA_KEYS`) and says "The Site tab (Beta) is not part of this report".
- Evidence: r14 (T1): `readStudyFile` keeps `siteFitPenalty = true`; 5 of the top 20 positions differ from the run without it (the leader does not change on T1); PDF mentions the penalty: false; PDF says the Site tab is not part of the report: true.
- Fix: on opening a study with the Site tab off, clear the Beta-only inputs and say so in the status line. Or keep them, but turn on a visible flag in the header and the PDF. Owner choice in (f).

**N-6. An edited note can still carry site-fit wording into the PDF (the rest of H5 H1).**
- Evidence: r5 (T2, whose leader has 2 site-fit flags). A note saved with the Site tab on is left out of the PDF. The same text, re-saved with "Edit note" after the Site tab is turned off, is printed, and the PDF then holds "Site fit:" wording.
- Fix: when a note is re-saved, keep `siteBeta: true` if the earlier note had it or if its text holds the generated site-fit sentences. Or strip sentences beginning "Site fit" from a note in the PDF (`noSiteNote` already does this for record notes, `report.js:24`).

### Low

**N-7. "Leads in 83 %" is among the top 20 options only, and the summary and header strip do not say so.** r1: with the same samples over the top 60, the leader leads in 82.0 % (top three 97.7 %). Options #49 and #56 lead in 0.7 % and 1.3 % of samples; 7 options ranked below 20 reach a sample's top three. The panel and the PDF say "the 20 leading options are re-run". Fix: "leads in 83 % of samples among the top 20" in the summary (`summary.js:292`) and the header (`App.jsx:307`).

**N-8. Breakeven (and tornado) re-runs lay out every option, even when the run did not.** `breakeven.js:95` and `sensitivity.js:175` call `evaluateOption(ctx, o.v)` without `skipLayout`; the Monte Carlo passes it (`montecarlo.js:104, 129`). r10, Pego study (layout on demand): leader re-run 21 ms without the layout and 293 ms with it; first 12 breakeven steps 80–375 ms; about 1.3 minutes for the 448 planned steps on the main thread. Site fit cannot change the order there, so this is time only. Fix: pass `skipLayout` on the same rule as the Monte Carlo.

**N-9. "Rank requirement-compliant options first" forces the full layout, although compliance no longer reads site fit.** `run.js:153` and `montecarlo.js:104` treat compliant-first as "site fit can rank", but `isRequirementCompliant` reads the resilience status only (`scoring.js:110–112`, walkthrough 2026-10-21). On a large campus (Pego: layout work 135 million against the 20 million limit), ticking it would lay out every option (the guide estimates about 9 minutes) for no change in rank. Code reading; not run, because of the cost. Fix: drop `rankCompliantFirst` from both conditions.

**N-10. A study file with a null value inside a section is accepted and can run silently wrong.** r8: `economics.wacc = null` → `readStudyFile` ok, no warning; the run keeps `wacc: null`, which discounts nothing. Leader NPV goes from €940 m to €1,909 m, LCOE from €151.9 to €145.3/MWh, and the leader changes to O67PEWY, with no flag. The app's own number fields never write null, so this needs a damaged or hand-edited file. H4 L-3 was fixed for whole sections; H4 L-4 changed only the comment. Fix: in `readStudyFile`, replace a null leaf with today's default when the default is a number, and list it in the warnings.

**N-11. `ENGINE_VERSION` is still '0.2.0-site'** (`run.js:28`), though packages 11 to 18 changed results. So the study file's warning "Saved with engine …" (`study.js:95`) cannot fire between these versions. The leader comparison still catches changed results. Fix: bump the version when results change.

**N-12. Records and screen text that disagree with the code.**
- Guide chapter 22 (`03-part3b.md:20`, table row "Open flags on the leader"): "When many flags would take the text past 250 words, it gives their count". With everything run, the count is dropped (N-2).
- OPEN-QUESTIONS 103: "It runs in 25 ms slices, so the page stays responsive". BRIEF §17 now says steps up to 182 ms (MED-5), and r10 measured 375 ms on Pego.
- BUILD-NOTES work package 17, guide chapters 22 and 27, and the H6 records state the capex flip "#2 would lead if capex rose to × 1.41" as a T1 result. It comes from N-1.
- `04-part4b.md:405`: "'Capex' scales every line". It does not scale the cooling delta (N-1).
- `RunSummary.jsx:16–17` (Site tab on): "'Rank requirement-compliant options first' is on, so options that do not fit rank after those that do". Since the walkthrough, compliance ignores site fit (`scoring.js:107–112`).

**N-13. The share of PPA energy counted against market-based carbon uses the contract volume, including volume not delivered** (`evaluate.js:343`). This is standard for annual market-based reporting and is consistent with the earlier owner decisions. I note it only so the owner knows the hedge rule (no money without delivery) and the carbon rule (credit on the whole contract) differ on purpose. No change suggested. (Counted as VERIFIED in (d), not as a failure.)

## (d) Checked and found sound

| ID | Check | Status | Evidence |
|---|---|---|---|
| S1 | Breakeven grid-date flip against full re-runs | VERIFIED | r2: at +13 months the T1 leader leads; at +14 months #7 (O3ODMT4) leads the full 2,000-option run, as the table says |
| S2 | Breakeven capex flip against full re-runs (repository engine) | VERIFIED as computed | r2: × 1.41 leader #1; × 1.42 #2 leads. The flip is consistent with a full run, but the driver is wrong (N-1) |
| S3 | Monte Carlo sample leader against full re-runs | VERIFIED | r2: the first three samples, all thirteen values applied to a full run: the sample's first option is the full run's leader in 3 of 3 |
| S4 | A run of normalised inputs equals a run of raw inputs | VERIFIED | r2: OP13Y1Y 94.1497 in both |
| S5 | Monte Carlo leader share stable across seeds | VERIFIED | r1: 81.0–83.3 % over six seeds; top three 98.0–98.7 % |
| S6 | Representative-day bias in the Monte Carlo figures | VERIFIED | r4: see MED-2 row |
| S7 | Monte Carlo maths by reading: Acklam inverse normal, A–S erf, triangular inverse, one stratum per sample, copula, percentiles | VERIFIED (reading) | `montecarlo.js:42–89`; the formulas match their sources; H6 measured the marginals |
| S8 | Monte Carlo counts: leads, top three, robust band, ties | VERIFIED (reading) | `montecarlo.js:141–147, 165` |
| S9 | Breakeven bisection, widened range, side labels, nearest-flip distance | VERIFIED (reading) | `breakeven.js:138–195, 226–240`; whole-number drivers report the first value with the other order |
| S10 | Breakeven and Monte Carlo widened WACC (13 %) | VERIFIED | r6 (i): Monte Carlo WACC P90 0.1253, `widened` true; the breakeven row is not among T1's eight drivers at 13 %, so I used test 45's case (`breakeven-tests.mjs:119–127`) |
| S11 | Weight-change crossing (summary part 5) is exact | VERIFIED (reading) | `summary.js:94–131`: score linear in t with fixed ranges; H5 re-checked it by brute force |
| S12 | Existing plant: lease in the ledger | VERIFIED | r3: 53 re-evaluated options (25 as bridging); rent = months × MW × 1,000 × rate, 0 mismatches |
| S13 | Existing plant: lease start = max(available, first need − lead) | VERIFIED | r3: need found independently from design load, contracted grid and bridging plant; 0 mismatches |
| S14 | Existing plant: exactly the units offered, never above its MW, not drawn, outside the IED aggregation | VERIFIED | r3: max output above the plant's MW 0.000000; H4 and test 39 cover drawing and the IED |
| S15 | Hourly energy balance with existing plant and PPA | VERIFIED | r3: max error 2.84e-14 MWh over every recorded hour |
| S16 | Known issue 19: no PPA energy taken while plant output above need is curtailed | VERIFIED | r3: 0 hours; `dispatch.js:399–418` |
| S17 | No PPA payment on energy not delivered | VERIFIED | r3: ledger PPA = delivered MWh × price each year (max difference €0.000000); hedge outside the ledger (`evaluate.js:322–333`) |
| S18 | One ledger: LCOE and NPV rebuilt from the ledger rows | VERIFIED | r3: 0 mismatches on 53 options |
| S19 | Dispatch years: first year after the last change, cap, no off-by-one | VERIFIED (reading) | `dispatch.js:139–150`: change at month 24 → years 0–2, at 25 → 0–3 |
| S20 | Time-to-power metric as OPEN-QUESTIONS 68 | VERIFIED (reading) | `evaluate.js:43–69`; H4 recomputed 2,000 options |
| S21 | Layout decision made from the whole list in every worker (H4 L-1) | VERIFIED (reading) | `run.js:146–152` samples `gen.options`, which every worker generates in full |
| S22 | Study round trip with the existing plant, a WACC of 7 % and a note | VERIFIED | r6 (a): no warnings, note kept, "Re-run matches the saved study" |
| S23 | Study: unknown keys dropped, hash unchanged (H4 L-2) | VERIFIED | r6 (b) |
| S24 | Study: a section null, a list or a string is refused with its name (H4 L-3) | VERIFIED | r6 (c) |
| S25 | Study from before packages 11–12 is filled from today's defaults | VERIFIED | r6 (d): `rentalLeadMonths`, `maxDispatchYears` and `existing` added and listed |
| S26 | Summary key includes the Site tab, tornado, breakevens and Monte Carlo | VERIFIED (reading) | `summary.js:428–432`; `report.js:144` |
| S27 | Summary with nothing run matches guide chapter 22's example | VERIFIED | r7 [nothing run] flags part equals the guide's text |
| S28 | Registry: 573 records, 549 "indicative — unverified", 24 "sourced — not independently checked", none verified | VERIFIED | r6 (f); the run-log line counts the same 549/24 |
| S29 | Rule (o) with the Beta site-fit penalty | VERIFIED | r11 (see H4 M-2 row) |
| S30 | Offline: no `fetch`, XHR, WebSocket or beacon in `app/src` or the built single file | VERIFIED | `grep` of `app/src` and of `dist/energy-tool-single-file.html` (0 `fetch(`); the URLs found are source citations |
| S31 | The committed `energy-tool-single-file.html` equals a fresh build | VERIFIED | SHA-256 034cb511… for both after `npm run build` |
| S32 | Site tab hidden by default; the penalty is cleared when it is switched off; site fit not in compliance | VERIFIED (reading) | `defaults.js:1083` (`view.siteTabBeta` false); `App.jsx:111–117`; `scoring.js:110–112`. Exceptions: N-5, N-6 |
| S33 | Flag, never enforce, in packages 11–18 | VERIFIED (reading) | The breakevens and the Monte Carlo order by adequacy (the agreed exception) and compliance (a setting); the existing-plant rules (l)–(n) and rule (o) are generation rules, not constraints; view filters keep options not laid out |
| S34 | Pego Monte Carlo on a campus not laid out | VERIFIED | r9 (a): 20 samples × 20 in 1.5 s, `skipLayout` true |
| S35 | Market-based carbon on the PPA contract volume (N-13) | VERIFIED (reading) | `evaluate.js:343`; recorded so the owner knows |
| S36 | Guide example figures for the Monte Carlo (100 samples: 82 %, 98 %, €145–171) | VERIFIED | r4 (b): 82 %, 98 %, 145.3–171.1 (these will move once N-1 is fixed) |
| S37 | KNOWN-ISSUES 21: 13 key inputs on the T1 leader | VERIFIED | r5 summary: "It uses 13 key inputs left at their defaults" |
| S38 | STATUS and BUILD-NOTES T1 leader (OP13Y1Y, 94.15, €151.9/MWh) and breakeven competitors | VERIFIED | r1, r2 |
| S39 | Pego README no longer says the app lacks an existing-plant type (H4 L-8) | VERIFIED | `studies/pego-rev3/README.md:14` |
| S40 | Belly-tank allowance (H4 L-11) is 0 m³ | VERIFIED | `defaults.js:396` |
| S41 | Breakeven "no competitor" wording (H6 LOW-1) | VERIFIED (reading) | `summary.js:321` |

New-finding rows N-1 to N-12 above are the FAILED rows outside table (b). N-13 is not a failure; it is row S35.

## (e) Not checked, and why

| ID | Item | Why |
|---|---|---|
| X1 | `npm test` and `npm run test:browser` | Not re-run (77/77 and 41/41 today; no code changed) |
| X2 | Browser behaviour: the panels' slicing, cancelling, the header strip as drawn | The browser suite was out of scope |
| X3 | The Windows program's network trace (packaging check D12) | Needs the GitHub Windows build |
| X4 | N-9 on Pego with compliant-first ticked | Would take about 9 minutes of layout; code reading only |
| X5 | Dispatch still counts the whole retained fleet from its first date (recorded in BUILD-NOTES work package 11) | Recorded simplification; I did not measure its effect |
| X6 | The other tornado drivers' reach (PUE, capacity factors, grid price adder) beyond reading | Time; only the capex driver was traced line by line |
| X7 | Replacement and residual value of the cooling delta (it has no asset life) | Part of N-1's fix; not measured separately |
| X8 | Screen-reader (NVDA) check | Not in scope |
| X9 | The H6 browser timings (B39, B40) | Browser not run |

## (f) For the owner

1. **N-1 (capex driver).** Proposed known issue 22. (A) Scale the cooling capex delta and the fuel-cell stack replacements by the capex factor, as the label "every line" says. On T1 the capex flip disappears, and the Monte Carlo moves from 83 % to 86 % for #1 (16 % to 14 % for #7). Figures in the notes, the guide and test 45 change. (B) Keep the code and rename the driver "Capex (plant lines, not the cooling delta)". Then the flip stays, but it describes what the driver does.
2. **N-2 (summary length).** (A) Keep 250 words, but never drop the flags' first sentence, their count line or the breakevens. Shorten parts 1 and 4 instead (for example, put the Monte Carlo LCOE range only in the detail when it would push out a flag). (B) Allow a longer limit (for example 300 words) when the tornado, breakevens and Monte Carlo have all been run. This changes the agreed 250 (OPEN-QUESTIONS 86–92). (C) Keep the code and add a fixed line "See section 8 for all flags".
3. **N-3 (robust pick).** (A) Name a robust pick other than the leader only when its margin is clearly beyond sampling noise; otherwise say "level with the leader". (B) Keep naming it, but add the panel's noise sentence to the summary and the PDF. (C) Raise the default samples (1,000 takes about 40 s in Node).
4. **N-4 (existing-plant defaults).** Which existing-plant inputs should raise "assumed default" flags: the lease rate, performance by type, the connection to the campus, and the rental lead month? Related: the decision log asks for every value not entered to be flagged per option. The build flags 25 key inputs per option and counts all other registry records in one flag. Is that interpretation still what you want?
5. **N-5 (study opened with the Site tab off).** (A) Clear the Beta-only inputs and say so. (B) Ask whether to turn the Site tab on. (C) Keep the inputs and show a flag in the header and the PDF.
6. **Delivered energy (outside packages 11–18).** LCOE divides by facility demand less unmet load (`evaluate.js:336`, guide `04-part4b.md:68`). Curtailed (flexed) IT load therefore counts as delivered energy in LCOE, but as unmet load for adequacy (OPEN-QUESTIONS 61). Is that intended? It matters only with flexibility on.

Line for `verification/HISTORY.md` (for the lead; this review writes only in its own folder):
Opus review of H4–H6 | Opus | 2026-10-30, `feature/review-2026-10-30` = `main` 3eb59a9: 2 high, 4 medium, 6 low; 53 verified, 15 failed, 9 not verified. High: the capex driver skips the cooling capex delta (the T1 capex breakeven is an artefact); the summary drops the leader's major flag and the breakevens when the Monte Carlo is run. Report: `verification/review-h4-h6/OPUS-review.md`

## Comparison with the earlier pass (read after this report was written)

`/home/claude/review/` holds an earlier pass's scripts and logs (it describes itself as "Sonnet 5.5, 2026-10-30"). It checked run invariants on T1 and two variants (energy balance, ledger, ranks, determinism; all passed). It also checked the two T1 breakeven flips against full re-runs, and both agreed (`r3.log`). My r2 agrees with both points. That pass could not find N-1, because the full re-run uses the same capex driver as the table, so the two agree while both are wrong. Only a corrected driver (r13) shows it. It did not cover the summary's word fit (N-2), the robust pick's sensitivity to the seed (N-3), the existing-plant flags (N-4) or the Site-tab paths (N-5, N-6). Its finding of no engine defect in the dispatch and the ledger stands; N-1 is in how a sensitivity driver is applied, not in the dispatch.

## Scripts and logs

| Script | Checks | Log |
|---|---|---|
| r1-mc-scope.mjs | Monte Carlo top 20 against top 60; robust pick over six seeds | logs/r1-mc-scope.log |
| r2-flips-vs-rerun.mjs | Breakeven flips and Monte Carlo samples against full re-runs | logs/r2-flips-vs-rerun.log |
| r3-existing-plant.mjs | Existing-plant flags, lease, hire month, ledger, hourly balance, PPA back-off | logs/r3-existing-plant.log |
| r4-mc-repdays.mjs | Representative days against the full year in the Monte Carlo | logs/r4-mc-repdays.log |
| r5-summary-pdf.mjs | Summary and PDF with everything run; the Site-tab note path | logs/r5-summary-pdf.log |
| r6-study-view-be.mjs | Study files, view filters, registry, screening breakeven base, widened WACC | logs/r6-study-view-be.log |
| r7-summary-fit.mjs | What the 250-word fit removes as analyses are added | logs/r7-summary-fit.log |
| r8-study-null-leaf.mjs | A study with WACC null | logs/r8-study-null-leaf.log |
| r9-pego-and-summary-cases.mjs | Pego study reopened; one adequate option; hourly CFE wording | logs/r9-pego-and-summary-cases.log |
| r10-pego-breakeven-steps.mjs | Breakeven step times on Pego | logs/r10-pego-breakeven-steps.log |
| r11-rule-o-beta.mjs | Rule (o) with the Beta site-fit penalty | logs/r11-rule-o-beta.log |
| r12-capex-driver-cooling.mjs | What "capex × 1.5" does to each cooling type | logs/r12-capex-driver-cooling.log |
| r13-capex-flip-patched.mjs | The capex flip with the repository engine and with the cooling delta scaled (scratch copy; pass its `src` path as the argument) | logs/r13-capex-flip-repo.log, logs/r13-capex-flip-patched.log |
| r14-study-sitefit-penalty.mjs | A study reopened with the Beta site-fit penalty | logs/r14-study-sitefit-penalty.log |
| r15-pdf-summary-page.mjs | The PDF summary page with everything run | logs/r15-pdf-summary-page.log |
