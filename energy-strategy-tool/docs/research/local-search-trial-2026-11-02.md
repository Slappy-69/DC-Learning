# Search around the leaders: a cheap trial (2 November 2026)

The owner chose this step on 2 November 2026 (item 10 of Claude's list): "a search around the leaders, to find better options than sampling finds, a cheap trial first". Script: `app/tools/local-search-trial.mjs` (`node tools/local-search-trial.mjs T1` from `app/`). Not product code.

## What the trial did

1. Ran T1 and T3 as the tool does today: 2,000 options sampled from every valid combination.
2. Ran every valid combination (no sampling) as the ground truth, and ranked them the way the tool ranks (adequate options first, then the weighted score).
3. From the sampled run's top 10, a greedy search: change one choice at a time, move to the best neighbour while it ranks higher, stop when none does.

## Results (Node 22, one thread, this sandbox)

| | T1 | T3 |
|---|---|---|
| Valid combinations | 17,344 | 9,424 |
| Time for the 2,000 sampled | 17 s | 14 s |
| Time for every combination | 49 s | 19 s |
| Sampled leader's rank among all | #11 | #11 |
| Was the true best sampled? | no | no |
| Score gap to the true best (out of 100) | 0.31 points | 0.0001 points |
| Local search: extra evaluations | 207 | 188 |
| Local search: best rank found | #9 | #1 |

## What it shows

- **Sampling misses the best option.** In both cases the true best was not among the 2,000, and the sampled leader was 11th. On T1 the gap is small (0.31 points) but the true best is a different strategy: gas engines kept as prime with diesel backup, against rented gas kept for the shortfall with HVO backup. On T3 the two are effectively tied.
- **A one-step local search helps but is not reliable.** It found the true best on T3 but stopped at #9 on T1: the better options differ from the sampled top ten in two or more choices at once.
- **Screening every combination is affordable at these sizes.** T1 takes about 50 s instead of 17 s in Node on one thread; the app runs in several workers. Memory stayed under 1.2 GB in Node.

## Options for the owner

- **A. Screen every combination when there are fewer than a set number (for example 20,000), and sample only above it.** It removes the question for runs of T1's size. The cost is a longer run and more memory in the browser, which needs checking on the phone page.
- **B. Keep the 2,000 sample and add the local search,** with two-choice moves to get past T1's case. That is cheaper per run but still not exact.
- **C. Both:** every combination below the threshold, sampling plus the local search above it.
