// Site layout of one option on demand (UI thread and tests), with the same functions the run uses, so the
// plan drawn for an option is the layout its site-fit status came from (test 9d checks it).
import { buildSiteModel } from './site.js';
import { buildBlocks } from './blocks.js';
import { runLayout } from './layout.js';
import { layoutFacts, siteFitOf } from './sitefit.js';

// The parts of the run context that blocks and site fit read: inputs, phases in date order, site model.
export function lightContext(inputs, site) {
  const phases = (inputs.load.phases || []).map((p, i) => ({ it: Number(p.itMW), date: p.date, i }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.i - b.i));
  return { inputs, phases, site };
}

// inputs: normalised inputs of the run; option: a run option (v, sizing). Returns blocks, layout, layout
// facts (§10.6 detail) and the site-fit summary.
export function layoutForOption(site, inputs, option) {
  const s = site || buildSiteModel(inputs);
  const ctx = lightContext(inputs, s);
  const bs = buildBlocks(ctx, option.v, option.sizing);
  const layout = runLayout(s, bs);
  const facts = layoutFacts(s, bs, layout);
  const siteFit = siteFitOf(ctx, s, bs, layout, facts, option.v, option.sizing);
  return { site: s, bs, layout, facts, siteFit };
}
