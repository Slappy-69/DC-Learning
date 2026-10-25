// One option through the run's own per-option chain (run.js stages 4–12), for the Dispatch tab inspector
// (inspect.js) and the tornado (sensitivity.js):
//   size → blocks → layout (one block set; equal to the run's batch, test 9d) → site fit → dispatch (optionally with hourly records) → time-to-power → economics → carbon →
//   resilience → flags (incl. the site-fit flags and the data flag) → deliverability.
// The same functions as the run, in the same order, so every figure equals the run's figure for the same option
// and inputs (test 12a checks it). Pure: no UI, no browser APIs.

import { sizeOption } from './sizing.js';
import { buildBlocks } from './blocks.js';
import { runLayout } from './layout.js';
import { layoutFacts, siteFitOf, notLaidOut } from './sitefit.js';
import { dispatchConfig, dispatchAll } from './dispatch.js';
import { timeToPower, economics, carbon, resilience, deliverability, allOptionFlags, unmetSummary } from './evaluate.js';
import { adequacyOf } from './adequacy.js';

// ctx: a run context (context.js buildContext, with its site model); v: the option's choice vector.
// recordYears: model years whose hourly arrays are kept (null = none, as in the run). rep: representative hours for the
// screening tier (dispatch.js representativeHours; null = the full year). skipLayout: the option is not laid out, as in a
// run of a large campus (work package 13); its site fit is "Not laid out" (Monte Carlo, work package 18).
export function evaluateOption(ctx, v, { recordYears = null, rep = null, skipLayout = false } = {}) {
  const sz = sizeOption(ctx, v);
  const bs = buildBlocks(ctx, v, sz);
  const layout = skipLayout ? null : runLayout(ctx.site, bs);
  const facts = skipLayout ? null : layoutFacts(ctx.site, bs, layout);
  const siteFit = skipLayout ? notLaidOut(Math.round((ctx.site && ctx.site.areas && ctx.site.areas.netM2) || 0)) : siteFitOf(ctx, ctx.site, bs, layout, facts, v, sz);
  const cfg = dispatchConfig(ctx, v, sz);
  const disp = dispatchAll(ctx, cfg, recordYears, rep);
  const ttp = timeToPower(ctx, v, sz);
  const eco = economics(ctx, v, sz, disp, ttp);
  const carb = carbon(ctx, sz, eco, disp);
  const res = resilience(ctx, v, sz);
  const flags = allOptionFlags(ctx, v, sz, disp, ttp, eco, carb, res, siteFit);
  const deliv = deliverability(ctx, v, sz, disp, flags, siteFit);
  const unmet = unmetSummary(disp);
  const adequacy = adequacyOf(disp, ttp, unmet);
  return { v, sz, bs, layout, facts, siteFit, cfg, disp, ttp, eco, carb, res, flags, deliv, unmet, adequacy };
}
