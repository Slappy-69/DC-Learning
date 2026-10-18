// One option through the run's own per-option chain (run.js stages 4–12), for the Dispatch tab inspector
// (inspect.js) and the tornado (sensitivity.js):
//   size → blocks → layout (one block set; equal to the run's batch, test 9d) → "fill residual" solar sized from
//   the layout → site fit → dispatch (optionally with hourly records) → time-to-power → economics → carbon →
//   resilience → flags (incl. the site-fit flags and the data flag) → deliverability.
// The same functions as the run, in the same order, so every figure equals the run's figure for the same option
// and inputs (test 12a checks it). Pure: no UI, no browser APIs.

import { sizeOption, applySolarFill } from './sizing.js';
import { buildBlocks } from './blocks.js';
import { runLayout } from './layout.js';
import { layoutFacts, siteFitOf } from './sitefit.js';
import { dispatchConfig, dispatchAll } from './dispatch.js';
import { timeToPower, economics, carbon, resilience, deliverability, allOptionFlags, unmetSummary } from './evaluate.js';

// ctx: a run context (context.js buildContext, with its site model); v: the option's choice vector.
// recordYears: model years whose hourly arrays are kept (null = none, as in the run).
export function evaluateOption(ctx, v, { recordYears = null } = {}) {
  const sz = sizeOption(ctx, v);
  const bs = buildBlocks(ctx, v, sz);
  const layout = runLayout(ctx.site, bs);
  const facts = layoutFacts(ctx.site, bs, layout);
  if (layout.fill) applySolarFill(sz, layout.fill);
  const siteFit = siteFitOf(ctx, ctx.site, bs, layout, facts, v, sz);
  const cfg = dispatchConfig(ctx, v, sz);
  const disp = dispatchAll(ctx, cfg, recordYears);
  const ttp = timeToPower(ctx, v, sz);
  const eco = economics(ctx, v, sz, disp, ttp);
  const carb = carbon(ctx, sz, eco, disp);
  const res = resilience(ctx, v, sz);
  const flags = allOptionFlags(ctx, v, sz, disp, ttp, eco, carb, res, siteFit);
  const deliv = deliverability(ctx, v, sz, disp, flags, siteFit);
  const unmet = unmetSummary(disp);
  return { v, sz, bs, layout, facts, siteFit, cfg, disp, ttp, eco, carb, res, flags, deliv, unmet };
}
