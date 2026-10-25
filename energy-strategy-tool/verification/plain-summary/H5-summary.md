# H5 verification: work package 16 (plain-English summary)

Verifier: Claude Haiku 5.5 (independent verifier, H5). Date: 2026-10-24.
Commit checked: 324f71a on `feature/plain-summary`, through a `git archive` export of HEAD (not the working tree).
Scope: BRIEF §14 with its "As built" note and acceptance criterion 12; OPEN-QUESTIONS 12 and 86–92; `app/BUILD-NOTES.md` "Work package 16"; `docs/BUILD-PLAN.md` package 16; the summary code (`app/src/engine/summary.js`), `SummaryPanel.jsx`, the summary page in `report/report.js`, the note in `engine/study.js`, the wiring in `App.jsx` and `RankedList.jsx`; known issue 21 and its fix in `engine/assumed.js`; tests 43 and 44; browser check B38 (read only); guide chapters 22, 29, 44, 54 and 56 (the summary rows).
Repository: no file changed except this report. No git command that changes state, no push, no network, no browser test run. The line for `verification/HISTORY.md` is left for the lead, because the brief limits changes to this report.
Working tree: another session has uncommitted work-package-17 edits in the working tree (`defaults.js`, `report.js`, `App.jsx`, `SensitivityView.jsx`, `styles.css`, new breakeven files, tests and docs). I did not verify that work. Registry counts in the guide (539 of 563, correct for HEAD) will change once it is committed.

## What I checked and how

- Read the code, tests and documents named in the scope.
- Independent scorer (`scratchpad/h5/head/indep.mjs`): re-scored the T1 run from its axis scores and weights, apart from the engine. Score difference 0.00 across all 2,000 options; the gap and the four axis parts recomputed by hand.
- Weight changes: for every axis and both directions, every whole per cent from 0 to 100 re-scored on a copy of the run (`scoreOptions`); the leader compared with the one the summary states. Exact crossings solved by bisection.
- Variants (19 cases, `scratchpad/h5/head/out/variants.json`): NPV cost, market carbon, CFE carbon, requirement-compliant first, three presets, Lowest risk, all weights 0, one weight at 100 (each axis), CFE weights 20/60/10/10, T3 base, T3 with NPV, market and compliant first, and T3 with all weights 0. Each run with and without the seven default tornado drivers on the leader.
- Edge cases on copies of the T1 run (`scratchpad/h5/head-edge2.mjs`, `scratchpad/h5/head/head-edge.mjs`): twin of #1 at #2; leader best on every axis; one adequate option; no adequate option; one option only; tornado on #3; Site tab on and off; resilience statuses; five long major flags; long leader name; no key-input flags.
- Study file and PDF (`scratchpad/h5/head-study-pdf.mjs`): round trip through `studyFile` and `readStudyFile`; damaged notes; PDF page order and text, with the note and "(edited)" heading, Site tab off and on. PDF text was read from the bytes, so the euro sign and em dash show as missing in the extracted text only.
- Fresh process (`scratchpad/h5/head-fresh.mjs`) against a process that built the defaults first.
- Known issue 21 fix: pre-WP16 tree (`git archive` of 324f71a^) against HEAD, single thread, 2,000 options (`scratchpad/h5/fixcmp.mjs`).
- Snapshot of every option, score and scoring setting before and after the summary calls, with the Site tab on and off (`scratchpad/h5/head/h5-snap.mjs`).
- Speed (`scratchpad/h5/head-speed.mjs`): median of 5 calls. The 2,000-option sample, and the full 48,340-option run with sampling off (needed `--max-old-space-size=12000`; the default heap ran out).
- All logs are in `scratchpad/h5/head/out/`. Scripts are in `scratchpad/h5/` and `scratchpad/h5/head/`, all pointing at the HEAD export.

## Results

Status key: VERIFIED = the run or code agrees with the claim. FAILED = the run or code contradicts the claim, or the behaviour is wrong or misleading. NOT VERIFIED = not checked in this session, with the reason.

| ID | Check | Status | Evidence (numbers; file:line) |
|---|---|---|---|
| 1.1 | Leader OP13Y1Y, score 94.1 | VERIFIED | Independent scorer: score difference 0.00, same leader (`t1-checks.log`). Leader score 94.1497 (`t1-run.log`, rank-1 row). |
| 1.2 | LCOE €152/MWh, capex €84.9 m, carbon 121 g/kWh (location), power on time | VERIFIED | `t1-run.log` rank-1 row: LCOE 151.91; capex 84,938,091; location carbon 121.31; time-to-power 0 months late; resilience "Meets". |
| 1.3 | Gap to #2 is 0.15 points (#2 = O67PEWY) | VERIFIED | Independent gap 0.14967 (`t1-checks.log`); scores 94.1497 against 94.0000. |
| 1.4 | Axis parts: cost 0.11, carbon 0.04, time-to-power 0, deliverability 0 | VERIFIED | Parts 0.10584, 0.04383, 0, 0; sum 0.149673 equals the gap (`t1-checks.log`). |
| 1.5 | Figures in "why it leads": LCOE €152 against €153/MWh; carbon 121 against 122 g/kWh | VERIFIED | #2 LCOE 152.620; #2 carbon 122.354 (`t1-checks.log`). |
| 1.6 | "#2 differs in 8 choices", first named is bridging after grid arrives, "Remove" | VERIFIED | 8 differing choices; #1 "prime", #2 "remove" (`t1-checks.log`). |
| 1.7 | Gives up on deliverability: 89 against 96.8 points (#595) | VERIFIED | Leader raw 89; best adequate #595 raw 96.77 (`t1-checks.log`). Summary text at `summary.js:232–233`. |
| 1.8 | 21 other adequate options within 1 point | VERIFIED | Count 21 (`t1-checks.log`, "others within 1 point 21"). |
| 1.9 | 13 key inputs left at their defaults | VERIFIED | 13 assumed flags on the leader (`t1-checks.log`); the fresh-process list is identical (`fresh.out`). |
| 1.10 | Registry: 539 of 563 default records indicative | VERIFIED | "registry now: 563 records, 539 indicative" (`t1-checks.log`), HEAD only. |
| 1.11 | Weight changes named: #26 at 0 % (deliverability), #595 at 13 % (cost) | VERIFIED | Five changes: deliverability down 15 → 0 (#26); cost down 35 → 13 (#595); deliverability up 15 → 38 (#595); cost up 35 → 97 (#26); carbon up 25 → 99 (#145). The two named are the two smallest (`t1-checks.log`). |
| 1.12 | Flags on the leader: permitting major (aggregated 337 MWth ≥ 50, IED); two minor permitting; fuel minor; resilience meets | VERIFIED | `flagcat-head.log`: permit-ied (major), permit-mcp and permit-outlook (minor, Permitting), fuel-diesel-prime (minor, Fuel and utilities). Resilience status "Meets" (`t1-run.log`); resilience not recomputed. |
| 1.13 | Tornado on #1: seven drivers; LCOE €140–171/MWh; grid import price €30.7/MWh (C), grid date €11.7/MWh, capex €10.7/MWh | VERIFIED | `t1-summary-tor.txt`, from the earlier session's run on HEAD (`t1-tornado.json`). Not re-run here. |
| 1.14 | With the tornado: 250 words; tornado text is for #1 only | VERIFIED | `variants.json` T1 base wordsTor 250; E6 (tornado on #3) states that the tornado was run on #3 (`edge2.log`). |
| 2.1 | Exact crossings: deliverability down 0.3465 %, cost down 13.5443 %, deliverability up 37.4711 %, cost up 96.1341 %, carbon up 98.6222 % | VERIFIED | Engine equals the bisection to four decimals (`t1-checks.log`). |
| 2.2 | The stated whole per cent changes the leader; one per cent short does not | VERIFIED | Brute scan (`t1-checks.log`): deliverability down changes the leader only at 0 %; cost down at 0–13 % (14 % does not); deliverability up at 38–100 % (37 % does not); cost up at 97–100 %; carbon up at 99–100 %. |
| 2.3 | No smaller single-weight change exists (T1 base) | VERIFIED | Brute-force nearest per axis and direction: 0, 13, 38, 97 and 99 per cent (`t1-checks.log`). |
| 2.4 | Same test on the 19 variants (NPV, market, CFE, compliant first, presets, all weights 0, one weight 100, T3) | VERIFIED | `variants.json`: engine's smallest change equals the brute-force smallest in all 19. Ties of equal size only, in T1 time-to-power 100 % (carbon up 0 → 1 and cost up 0 → 1) and T1 CFE 20/60/10/10 (carbon down 60 → 58 and cost up 20 → 22). |
| 2.5 | Weight changes list every change that moves the leader, and the scan ignores none | FAILED (L8) | Time-to-power up to 100 % changes the T1 leader (brute: #86 at 100 %, from 25 %) and is not in the engine list. A weight of 100 % is never lowered (`summary.js` `weightChanges`, `w[k] >= 1` skip). No effect on the smallest-change claim. |
| 3.1 | Word count as the code counts it: 242 words without tornado | VERIFIED | Engine 242; recount of parts plus guardrail 242; with headings 266 (`t1-checks.log`). Count rule `summary.js:37–38` (tokens with a letter or digit). |
| 3.2 | With tornado: 250 words | VERIFIED | `variants.json` (T1 base wordsTor 250). |
| 3.3 | All 19 variants with and without tornado at or under 250 | VERIFIED | `variants.json`: highest 250 (T1 NPV cost without tornado; T3 NPV, market and compliant first without tornado; T1 Lowest cost with tornado). |
| 3.4 | T3 (`referenceT3`) within limit | VERIFIED | T3 base 239 words (244 with tornado); all T3 variants ≤ 250 (`variants.json`). |
| 3.5 | Full run, sampling off (48,340 options): within limit | VERIFIED | 250 words without tornado and 248 with (`speed-full.log`). |
| 3.6 | Guardrail sentence last in every text | VERIFIED | `guardrailLast` true in 19 of 19 variants; `text.endsWith` asserted by test 43 (`summary-tests.mjs:42`). |
| 3.7 | No directive words ("recommend", "should", "choose", "get", "invest") in the text | VERIFIED | Directive count 0 in 19 variants; "directive match: null" on T1 (`t1-checks.log`). Regex `summary.js:35`. |
| 3.8 | No directive words in the detail text | VERIFIED | Earlier session scan of the detail text for every variant, and the detail texts read in `texts-*.log`. |
| 3.9 | The limit holds when the required sentences alone are long (no optional sentence to move) | FAILED (M1) | E9 (five distinct majors, T1 and T3 mixed): 270 words, "moved 6" (`edge2.log`). E9b: 288 words, "within limit? false" (`edge2.log`). E9 rerun on HEAD: 288 words, "moved 7" (`edge-head.log`). Only optional sentences move (`summary.js:339` onwards); no final check. |
| 4.1 | #2 has the same figures as #1 | VERIFIED | "#2 has the same figures, so their order is by option code only"; comparison moves to #4, the next option with different figures (`edge-head.log`, E1). |
| 4.2 | Leader not adequate; no adequate option at all | VERIFIED | "No option serves the load in every hour; it is the best-scoring of those that do not." (`summary.js:189`; present once in `edge2.log`, E4). "the best of the options, #682" uses "options", not "adequate options" (`summary.js:158`). |
| 4.3 | Only one adequate option | FAILED (M2) | E3: "It is the best of the adequate options on every axis, so it gives up nothing within this run." (`edge2.log`). The leader has 89 deliverability points; the best option in the same run is #682 at 96.8 (E4 run, same options). |
| 4.4 | Leader best on every axis | VERIFIED | E2: "gives up nothing" is right; "No change of a single weight alters the leader"; engine lists 0 changes (`edge2.log`). |
| 4.5 | Tornado run on another option (#3) | VERIFIED | "The last tornado was run on #3, not on #1, so the inputs with most influence on the leader are not listed." (`edge2.log`, E6). |
| 4.6 | Site-fit flags with the Site tab off | VERIFIED | No site-fit text in part 6 or the detail (`edge2.log` E7 off; `study-pdf.log`). |
| 4.7 | Site-fit flags with the Site tab on | VERIFIED | "Site fit: does not fit the site: 3 blocks outside the boundary, a major flag, and 1 minor flag." (`edge-head.log`, E7). Wording fault in L3. |
| 4.8 | Resilience statuses "meets with flags" and "does not meet" | VERIFIED | Both read correctly (`edge-head.log`, E8). |
| 4.9 | CFE carbon: the figure is labelled as carbon | FAILED (M3) | "On carbon it has 66.8 %; the best of the adequate options, #426, has 67.8 %." (`texts-cfe.log`). The figure is the hourly CFE share; the same text earlier says "hourly CFE 66.8 against 67.2 %". |
| 4.10 | CFE "why it leads" parts add up to the gap | FAILED (M4) | "0.12 points ahead of #2, from cost (LCOE €152 against €153/MWh, 0.23 points)" (`texts-cfe.log`). The carbon part (−0.11 for #1) is not named in this sentence (the next sentence gives it as a gives-up figure), so the named part exceeds the gap. |
| 4.11 | NPV cost: figures in the text | VERIFIED | "NPV €927 against €930 m, 0.06 points"; NPV of net cost €927 m (`texts-npv.log`). |
| 4.12 | NPV cost: "what would change" names one option twice | FAILED (L5) | "#449 would lead if the cost weight fell from 35 % to 14 %… #449 would lead if the deliverability weight rose from 15 % to 36 %" (`texts-npv.log`). |
| 4.13 | Market carbon: figure shown with its unit | FAILED (L1) | "market-based 0.0358" and "(market-based 0.0358 against 0.531 g/kWh, 0.02 points)" with no unit on the first figure (`texts-market.log`, lines 2–3). |
| 4.14 | Detail wording: no sign or "less than" in a difference | FAILED (L2) | "weighted difference +less than 0.01 points" and "time-to-power: on time against on time" (`pdf-page2.txt`; `summary.js:212`). |
| 4.15 | Flag text cut at clause boundaries, with the double colon removed | FAILED (L3) | "…large separation…" cut mid-clause (`edge2.log`, E9). "Site fit: does not fit the site:" has a double colon (`edge-head.log`, E7; `summary.js:132–134`). |
| 4.16 | Zero key inputs at default is worded sensibly | FAILED (L4) | "It uses 0 key inputs left at their defaults" (`edge-head.log`, E11). |
| 5.1 | Summary calls change no option score, rank, figure or flag (snapshot before and after, Site tab on and off) | VERIFIED | "snapshot unchanged after summary calls: true" (`snap-head.log`). |
| 5.2 | Known issue 21 fix (`assumed.js:69`) changes no score, rank or figure, single thread | VERIFIED | Pre-WP16 against HEAD, 2,000 options: differences 0 in score, rank, figures, flag ids, assumed-key count, dominance and names; leader score 94.1497 and assumed count 13 in both (`fixcmp.log`). |
| 5.3 | Fresh process gives the same assumed-default flags as a process that built the defaults first | VERIFIED | Fresh process: registry 387 before the run, 563 after; 13 flags with the same 13 keys as the built-first run (`fresh.out`; `t1-checks.log`). Pre-fix count for the T1 leader not measured here (see Not checked). |
| 6.1 | Note round trip through `studyFile` and `readStudyFile` | VERIFIED | "round trip ok: true; notes equal: true; warnings: []" (`study-pdf.log`). |
| 6.2 | Reopened note key equals `summaryKey` of the reopened run | VERIFIED | "reopened key equals summaryKey(run): true" (`study-pdf.log`). |
| 6.3 | Damaged note (text not a string, empty text, summary a string or an array) dropped with a warning | VERIFIED | Four cases each give "The summary note in the file is damaged and was left out." (`study-pdf.log`). |
| 6.4 | Other damaged shapes dropped with a warning | FAILED (L7) | "notes is a string" and "summary is null" with no warning (`study-pdf.log`); `study.js:97–100` (silent when `notes` is not an object). |
| 6.5 | PDF: Summary page after the cover; sections begin with Summary | VERIFIED | "Summary on page 2"; sections "Summary, 1. Inputs, 2. Assumptions"; 22 pages (`study-pdf.log`, `pdf-page1.txt`, `pdf-page2.txt`). |
| 6.6 | Note printed under "Summary as edited by the engineer (edited)" with its text and date | VERIFIED | Heading and note text present; "Edited 2026-10-24." (`pdf-page2.txt`; `report.js:141`). |
| 6.7 | PDF with Site tab off: no site-fit content anywhere | VERIFIED | "site flag anywhere in PDF: false"; "Site fit" word anywhere: false (`study-pdf.log`). |
| 6.8 | Note saved with Site tab on: site-fit text in the PDF is flagged or left out | FAILED (H1) | "note with site-fit wording printed in PDF: true; flagged as earlier result: false" (`study-pdf.log`). Stored key "656156fb89527ced\|OP13Y1Y\|350,250,250,150\|lcoe\|location\|0" has no Site tab or tornado part (`summary.js:361`). |
| 6.9 | Edit box is prefilled with generated text, which includes site sentences when the Site tab is on | VERIFIED (code reading) | `SummaryPanel.jsx:15` (`setDraft(note ? note.text : s.text)`); the generated text includes site sentences when `siteBeta` is on (`summary.js:290`). Not run in a browser. |
| 6.10 | "Written for an earlier result" appears when the key differs | NOT VERIFIED | Only the matching-key case was run (`study-pdf.log`: "present (key matches, expected no): false"). |
| 7.1 | Chapter 22 numbers: 94.1; 0.15; parts 0.11 and 0.04; 8 choices; 21 within 1 point; 13 key inputs; 539 of 563; tornado €140–171, €30.7, €11.7, €10.7 | VERIFIED | `03-part3b.md:27–35` against rows 1.1–1.14. |
| 7.2 | Chapter 22 example currency: figures in pounds (caption) | FAILED (L9) | Caption: "figures in pounds, the display currency for T1" (`03-part3b.md:9`); quoted text uses € (`03-part3b.md:27–35`). The app sets display currency from the site's country (`App.jsx:100`). |
| 7.3 | Chapter 22: "at most 250 words" | FAILED (M1) | `03-part3b.md:6` states the limit as absolute; row 3.9 shows it is not enforced. |
| 7.4 | Chapter 29: "Site-fit flags are left out" of the summary | FAILED (H1) | `03-part3b.md:324` against row 6.8. |
| 7.5 | Chapter 44: crossings 0.3 %, 13.5 %, 37.5 %; thresholds 13 % and 38 % | VERIFIED | Exact crossings 0.3465, 13.5443 and 37.4711 (`t1-checks.log`); `04-part4b.md:375`. |
| 7.6 | Chapter 44: "survives every change but two modest ones" and names three changes | FAILED (L10) | `04-part4b.md:375`. The engine lists five changes (row 1.11); the chapter omits cost up to 97 % and carbon up to 99 %. |
| 7.7 | "17 key inputs" in KNOWN-ISSUES row 21, BUILD-NOTES WP16 ("Node said 13–17") and chapter 54 ("the T1 leader showed 2 instead of 17") | FAILED (L11) | Default T1 leader has 13 (rows 1.9, 5.3). 17 comes from the NPV-cost variant (`texts-npv.log`) and from test 44's configuration (earlier session). `KNOWN-ISSUES.md:29`; `app/BUILD-NOTES.md:1942`; `06-part6.md:63`. |
| 7.8 | "Axis differences add up to the gap exactly" (BUILD-NOTES WP16; OPEN-QUESTIONS 88) | FAILED (M4) | Holds only when every part favours #1 (row 4.10). `app/BUILD-NOTES.md:1927`; `brief-v2/OPEN-QUESTIONS.md:110`. |
| 7.9 | Chapter 56, WP16 row: built 24 October; breakevens and rank probability wait for later work | VERIFIED | `06-part6.md:151–154`; HEAD summary says "Breakeven values are not built yet". |
| 7.10 | Chapter 56, WP17 row: breakeven table is in the summary and built | NOT VERIFIED | WP17 is uncommitted in the working tree (see top); HEAD's summary does not include breakevens. |
| 7.11 | BUILD-NOTES WP16 counts: 242 and 250 words; 539 of 563 | VERIFIED | Rows 1.10, 3.1, 3.2. |
| 8.1 | Sample run (2,000 options), median of 5: plainSummary 16.5 ms without tornado (min 6.1, max 41.3), 5.0 ms with tornado; weightChanges 0.7 ms | VERIFIED | `speed-sampled.log`; `head-speed.mjs` (n = 5). Budget 300 ms (`browser-tests.mjs` B9_BOUND_MS). |
| 8.2 | Full run, sampling off (48,340 options), median of 5: plainSummary 76.9 ms without tornado (min 55.9, max 187.1), 68.8 ms with tornado; weightChanges 31.3 ms | VERIFIED | `speed-full.log`. Well under 300 ms. |
| B1 | B38 assertion message | FAILED (L13) | `browser-tests.mjs:594`: the test asserts the summary names the header's leader, but its message says "does not name". Read only. |
| B2 | B38 behaviour in a browser | NOT VERIFIED | Browser tests not run (brief). |
| T1 | Test 43 coverage | FAILED (L12) | `summary-tests.mjs:31–75` asserts the limit, guardrail, directive words, part order, weight changes and part 1 score only. No test of required-only overflow (`:100–102` tests optional moves only); no part 1 LCOE, capex, carbon or time-to-power values; no part 3 figures; CFE, market and NPV wording only checked for limit and directives (`:115–119`); the "add up" assertion (`:49–50`) uses the test's own numbers, not the sentence's, so it would not catch M4. |
| T2 | Test 44 passes | NOT VERIFIED | `npm test` not run. Its fresh-process comparison was repeated by script (row 5.3). |

## Findings

### High

**H1. Site-fit text reaches the PDF through an edited note (breaks the Site tab rule).**
- What: with the Site tab on, the Edit box is prefilled with the generated text, which includes the site-fit sentences (`SummaryPanel.jsx:15`). The note's key covers the inputs hash, leader, weights, cost and carbon metric and the compliant-first setting, but not the Site tab or the tornado (`summary.js:361`). So the note is not marked as written for an earlier result. The PDF prints the note as saved (`report.js:141`), and in `study-pdf.log` it carried "Site fit: does not fit the site" with no notice. CLAUDE.md says the Site tab is "kept out of the ranking and the PDF", and chapter 29 says site-fit flags are left out (`03-part3b.md:324`).
- Why High: a stated project rule is broken on an ordinary path (edit the summary with the Site tab on, save, print), with no warning.
- Fix: add the Site tab and the tornado to `summaryKey`; do not prefill the Edit box with site sentences (or strip them before the PDF); in the PDF, print the note only when its key matches the Site-tab-off key, or remove the site sentences. Add a test: a note saved with the Site tab on prints no site-fit text.

### Medium

**M1. The 250-word limit is not enforced when the required sentences are long.**
- What: the fit loop moves only optional sentences to "More detail" (`summary.js:339` onwards). Nothing checks the final count. With five major flags on the leader the text was 288 words (`edge-head.log`, E9; `edge2.log`, E9b); with every distinct major flag of T1 and T3 it was 270 words (`edge2.log`, E9).
- Reach: every run tested stayed within 250 (19 variants; sampling-off T1 at exactly 250). Over-limit output needs several major flags on the leader at once.
- Fix: cap the flag list (name the first two or three and say "and N more") or move extra required flag sentences to "More detail"; assert the limit in code and in test 43 with a five-major-flag case; correct the "at most 250 words" claim in chapter 22 (`03-part3b.md:6`) until fixed.

**M2. "Gives up nothing" is misleading when only one option is adequate.**
- What: with one adequate option the comparison group is that option alone, so the sentence "It is the best of the adequate options on every axis, so it gives up nothing within this run" is true only inside a group of one. The leader has 89 deliverability points; the best option in the same run has 96.8 (#682, which is not adequate). The text does not say this.
- Where: `summary.js:237` (text), `summary.js:158` (group name).
- Fix: when the group has one member, say "It is the only adequate option. Options that do not serve every hour do better on deliverability (#682, 96.8 points)." Use "gives up nothing" only when the group has more than one member and no option in the run is better on that axis.

**M3. CFE mode: the hourly CFE share is called "carbon".**
- What: "On carbon it has 66.8 %; the best of the adequate options, #426, has 67.8 %" (`texts-cfe.log`). The axis is hourly carbon-free energy. The same text earlier says "hourly CFE 66.8 against 67.2 %", so one figure has two names.
- Where: `summary.js:232–233`, which uses the axis name rather than the figure's tag.
- Fix: use the figure's own tag in the "gives up" sentence ("hourly CFE 66.8 %"); keep the axis name in the heading only.

**M4. "Why it leads" names parts that do not add to the stated gap, and the "adds up exactly" claim is wrong when an axis favours #2.**
- What: CFE mode: "It is 0.12 points ahead of #2, from cost (LCOE €152 against €153/MWh, 0.23 points)" (`texts-cfe.log`). The carbon part is −0.11 for #1 and is not named in this sentence, so the named part (0.23) does not fit the gap (0.12). `summary.js:207–212` names only the positive parts (top three, c > 0.005). BUILD-NOTES WP16 (`app/BUILD-NOTES.md:1927`) and OPEN-QUESTIONS 88 say the parts add up exactly; that holds only when every part favours #1. Test 43 (`summary-tests.mjs:49–50`) checks the sum of the test's own numbers, so it does not catch this.
- Fix: name the negative part in the same sentence ("…, against #2 on carbon by 0.11 points"), or say "the parts that favour #1 add to X, and #2 is ahead on Y". Correct the BUILD-NOTES and OPEN-QUESTIONS wording.

### Low

**L1. Market-based carbon has no unit.** `texts-market.log` lines 2–3: "market-based 0.0358" and "(market-based 0.0358 against 0.531 g/kWh, 0.02 points)". Fix: add g/kWh to the market figure (`summary.js:186` and the axis figure, about `summary.js:47–58`).

**L2. Difference wording in the detail.** "weighted difference +less than 0.01 points" (`summary.js:212`; `pdf-page2.txt`) and "time-to-power: on time against on time". Fix: "less than 0.01 points" with no sign; "both on time" or "level".

**L3. Flag text cut badly, and a double colon.** "…large separation…" is cut mid-clause (`edge2.log`, E9); "Site fit: does not fit the site:" has a double colon (`edge-head.log`, E7; `summary.js:132–134`). Fix: cut at a clause boundary, keep the reason, and change to "Site fit: does not fit: 3 blocks outside the boundary…".

**L4. "It uses 0 key inputs left at their defaults".** `edge-head.log`, E11. Fix: when the count is 0, say "No key input is left at its default."

**L5. Same option named in both "would lead" sentences.** "#449 would lead… #449 would lead…" (`texts-npv.log`). Fix: when both changes name the same option, merge them into one sentence.

**L6. The summary key ignores the tornado.** The text changes with the tornado (242 against 250 words), but the note key does not (`summary.js:361`). Fix: include the tornado in the key, together with H1.

**L7. Silent drop of a damaged notes section.** `study.js:97–100`: when `notes` is a string, or `summary` is null, the note is dropped with no warning (`study-pdf.log`). Fix: warn when `notes` is present and is not an object (no warning when it is missing).

**L8. Some weight changes are not listed.** Time-to-power up to 100 % changes the T1 leader (brute: #86 at 100 %, from 25 %) and is not in the engine list; a weight of 100 % is never lowered (`summary.js` weightChanges, `w[k] >= 1` skip). Neither changes the smallest-change claim. Fix: document both limits in the summary's "What would change the answer" note or the guide, or handle them.

**L9. Currency in chapter 22.** The caption says pounds; the quoted text uses € (`03-part3b.md:9` against `:27–35`). The app shows pounds for the T1 site (`App.jsx:100`); the example was run in Node with euro. Fix: say the quoted text is in euro, or quote the app's pounds.

**L10. Chapter 44 names three changes but says "two".** `04-part4b.md:375`: "survives every change but two modest ones", then names three. The engine lists five (row 1.11). Fix: list all five, or say "three of the five" and name the rest.

**L11. "17 key inputs" is not the T1 default.** `KNOWN-ISSUES.md:29` (row 21), `app/BUILD-NOTES.md:1942` ("Node said 13–17") and `06-part6.md:63` ("the T1 leader showed 2 instead of 17"). The default T1 leader has 13. 17 comes from the NPV-cost variant (`texts-npv.log`) and from test 44's configuration. The four extra key inputs in the NPV-cost variant were not traced. Fix: say 13 for the default T1 leader, name the configuration for 17, and check whether the NPV setting should add key inputs.

**L12. Test 43 gaps.** No test of required-only overflow; no assertion of part 1 LCOE, capex, carbon or time-to-power, or of part 3 figures; no CFE, market or NPV wording assertions (`summary-tests.mjs:31–75`, `:115–119`); the "add up" assertion uses the test's own numbers (`:49–50`). Fix: add those cases; assert the sentence's named parts against the run.

**L13. B38 message is inverted.** `browser-tests.mjs:594` asserts that the summary names the header's leader, but the message says it "does not name" it. Fix: change the message to "the summary names the header's leader". Not run.

## Not checked

- `npm test`, `npm run build` and `npm run test:browser`; B38 behaviour in a browser; the Site tab's Beta rules in the browser.
- The working tree and the other session's WP17 work (uncommitted).
- The stale-notice branch of `SummaryPanel` when the key differs (row 6.10).
- The pre-fix fresh-process count for the T1 leader (test 44's own configuration gave 2 before and 17 after, in the earlier session).
- The NPV variant's four extra key inputs (L11).
- Pool-worker behaviour in the app itself (fresh Node process used as the proxy for a worker).
- The `Other major flags: not adequate` truncation (code reading only; not run).
- Tornado figures were not re-run; row 1.13 relies on the earlier session's run on HEAD.

## Summary

- Status counts: 74 rows: 50 VERIFIED, 20 FAILED, 4 NOT VERIFIED
- High findings: 1 (H1). Medium findings: 4 (M1 to M4). Low findings: 13 (L1 to L13).
- The summary's figures, weight changes, counts, word limit on the tested runs, guardrail, directive check, study round trip, PDF order and "(edited)" heading, the summary's no-change property and the known issue 21 fix all hold on HEAD (324f71a). The speed is well under the 300 ms budget, with and without sampling.
- The main risks are the Site tab rule (H1) and the cases where the word limit is not enforced and the "why it leads" parts do not add to the gap (M1, M4).
