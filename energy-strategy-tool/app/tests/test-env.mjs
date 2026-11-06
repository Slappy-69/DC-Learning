// Imported first by the Node test runners: the suite pins sampled reference runs (T1 2,000 of 17,344 options), so it
// switches off "screen every combination below" (work package 23) unless a test sets it on its inputs (test 54).
process.env.ESTOOL_SCREEN_ALL_BELOW = process.env.ESTOOL_SCREEN_ALL_BELOW ?? '0';
