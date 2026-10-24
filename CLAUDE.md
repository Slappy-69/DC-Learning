# Working in this repository

This repository holds the concept-design energy strategy tool for data centre campuses (`energy-strategy-tool/`). These notes are for Claude sessions that pick the work up. They apply to every session, whoever starts it.

## Start here

Read these before doing anything, in this order:

1. `energy-strategy-tool/STATUS.md`: where things stand, branches, checks, open items.
2. `energy-strategy-tool/docs/BUILD-PLAN.md`: the agreed changes as work packages, in order, each with the brief sections, the questions to ask the owner first, the acceptance tests and the user-guide chapters and mock-ups that show the agreed design.
3. `energy-strategy-tool/brief-v2/BRIEF.md` (revision 5): the specification. Everything the owner's walkthrough of 2026-10-21 changed is marked "(walkthrough, 2026-10-21)", with "as built" notes where the code still follows an earlier rule. Read it with `OPEN-QUESTIONS.md`, `ASSUMPTIONS.md` and `CHANGELOG.md` in the same folder.
4. `energy-strategy-tool/docs/walkthrough-decisions-2026-10-21.md`: the owner's decision log. Where anything disagrees with it, the log is newer; ask the owner.
5. `energy-strategy-tool/docs/KNOWN-ISSUES.md`: defects found in the built engine. None is fixed; each needs the owner's decision.
6. `energy-strategy-tool/app/BUILD-NOTES.md`: architecture, every default with its label, decisions and test runs.
7. The user guide, `energy-strategy-tool/docs/user-guide/`: how every number is worked out (Part IV), the defaults checked against published sources (chapter 50), and drawings of the agreed screens (`mock/*.html`).

**Development is paused.** Nothing in the build plan has been started. Start building only when the owner asks, and then follow the build plan in order unless the owner says otherwise.

## Working with the owner

- The owner is a data centre engineer, not a software specialist. Explain GitHub and software terms in plain words. Write in British English, in plain words and short sentences.
- Ask **one question per message**. When a decision is needed, give the options and what each would mean, then wait. Never assume an answer to an open question (`OPEN-QUESTIONS.md` 19–35 have no default on purpose). Record each answer, with its date, in `OPEN-QUESTIONS.md` and the brief.
- Within an agreed work package, work on without check-ins between steps; stop for decisions that are hard to reverse.
- Before an expensive step, such as a long verification, say so: the owner's usage is limited and they may want to pause.

## Rules for the work

- **Branches.** Work on a `feature/<short-name>` branch and push it as the work goes. Never merge into `main` or change repository settings without the owner's yes.
- **Verification.** Builder and reviewer: Claude Opus. Verifier: Claude Haiku. After every three Haiku checks, one Opus review. Reports go in `energy-strategy-tool/verification/<slice>/`, with a line in `verification/HISTORY.md`.
- **Defaults.** Every default has a source record (brief §18). Until it is researched it stays labelled "indicative — unverified" (today every default is); once researched it carries its source, year, link and access date, or the label "judgement" with a reason. Never present an indicative value as verified. Every value the engineer did not enter is flagged on each option that uses it, with its source.
- **Flag, never enforce** (brief §2, principle 5): a breached constraint raises a flag. It never hides, demotes or resizes an option.
- **One ledger.** LCOE, NPV and every cost breakdown come from the same yearly cash-flow ledger.
- **Offline.** The Windows program must make no network connection (packaging check D12 traces every process). Data is prepared at each release and bundled.
- **Site tab.** Keep it working as a Beta feature: hidden by default, labelled Beta, kept out of the ranking and the PDF.
- **Records.** Update `STATUS.md` after every completed step; `app/BUILD-NOTES.md` for defaults, decisions and test runs; the user guide when a feature is built (`docs/user-guide/README.md` says how).
- After changing the app, copy `app/dist/energy-tool-single-file.html` over `energy-strategy-tool/energy-tool-single-file.html`.

## Commands

Needs Node.js 22.

```
cd energy-strategy-tool/app
npm ci
npm run build          # dist/, including energy-tool-single-file.html (build first: test 14 reads dist/)
npm test               # Node suite
npm run test:browser   # Playwright + axe (needs Chromium)
```

Packaging (installable web app and the Windows program) is in `energy-strategy-tool/packaging/README.md`. The user guide's own tools are in `energy-strategy-tool/docs/user-guide/README.md`.

## GitHub from a Claude session

- Git works only when the repository is attached to the session with push access. The `gh` command does not work in these sessions.
- The checks run on GitHub: `.github/workflows/ci.yml` (Node tests, build, installable web app tests and browser tests) on every push to `main` or a `feature/` branch and on pull requests; `desktop.yml` (the Windows program) when `energy-strategy-tool/packaging/` changes, on a `v*` tag, or by hand.
- Check results can be read from the public GitHub API, for example `https://api.github.com/repos/Slappy-69/DC-Learning/actions/runs`.
