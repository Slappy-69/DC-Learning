// Imported first by the Node test runners: the suite pins sampled reference runs (T1 2,000 of 17,344 options), so it
// switches off "screen every combination below" (work package 23) unless a test sets it on its inputs (test 54).
process.env.ESTOOL_SCREEN_ALL_BELOW = process.env.ESTOOL_SCREEN_ALL_BELOW ?? '0';
// Work package 24 (2026-11-08): the suite's pinned reference figures (T1 and T3 are in Great Britain) were set with the
// indicative country adders; the researched adders are switched off for it, and test 56 checks them on their own.
process.env.ESTOOL_LEGACY_ADDERS = process.env.ESTOOL_LEGACY_ADDERS ?? '1';
// Realism rebuild (2026-11-11, OPEN-QUESTIONS 247 onward): the suite's pinned figures are those of the engine as merged on
// 2026-11-11, so the rebuild is switched off for it (settings.realism defaults to off, the lead times keep their earlier
// values). The engine version is 0.4.0 either way. tests/realism-tests.mjs checks the rebuild on its own, with the switch on.
process.env.ESTOOL_LEGACY_ENGINE = process.env.ESTOOL_LEGACY_ENGINE ?? '1';
