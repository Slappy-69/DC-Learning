#!/bin/bash
# Search 5-of-8 subsets of the reference palette that pass --pairs all in both modes on the app's surfaces.
V=/tmp/claude-0/bundled-skills/2.1.301/920506917b5bd5bea7e7b09f360d5cd8/dataviz/scripts/validate_palette.js
L=(2a78d6 eb6834 1baf7a eda100 e87ba4 008300 6250d6 e34948)
D=(3987e5 d95926 199e70 c98500 d55181 008300 9085e9 e66767)
N=(blue orange aqua yellow magenta green violet red)
for a in 0 1 2 3 4 5 6 7; do for b in $(seq $((a+1)) 7); do for c in $(seq $((b+1)) 7); do for d in $(seq $((c+1)) 7); do for e in $(seq $((d+1)) 7); do
  lp="#${L[$a]},#${L[$b]},#${L[$c]},#${L[$d]},#${L[$e]}"
  dp="#${D[$a]},#${D[$b]},#${D[$c]},#${D[$d]},#${D[$e]}"
  if node $V "$lp" --mode light --surface "#ffffff" --pairs all >/dev/null 2>&1 && node $V "$dp" --mode dark --surface "#1e2125" --pairs all >/dev/null 2>&1; then
    echo "PASS5: ${N[$a]} ${N[$b]} ${N[$c]} ${N[$d]} ${N[$e]}"
  fi
done; done; done; done; done
echo "--- 4-of-8 subsets passing all-pairs in both modes:"
for a in 0 1 2 3 4 5 6 7; do for b in $(seq $((a+1)) 7); do for c in $(seq $((b+1)) 7); do for d in $(seq $((c+1)) 7); do
  lp="#${L[$a]},#${L[$b]},#${L[$c]},#${L[$d]}"
  dp="#${D[$a]},#${D[$b]},#${D[$c]},#${D[$d]}"
  if node $V "$lp" --mode light --surface "#ffffff" --pairs all >/dev/null 2>&1 && node $V "$dp" --mode dark --surface "#1e2125" --pairs all >/dev/null 2>&1; then
    echo "PASS4: ${N[$a]} ${N[$b]} ${N[$c]} ${N[$d]}"
  fi
done; done; done; done
