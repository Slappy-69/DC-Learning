// Screening tier (work package 8, BRIEF §9.1; OPEN-QUESTIONS 23 answered 2026-10-23 with Claude's recommendation,
// accepted in advance by the owner). With settings.screeningModel = 'repDays' every option is dispatched over
// representative days (dispatch.js representativeHours); the best-ranked options (settings.verifyTop) are then
// re-run hour by hour for the full year with the same per-option chain as the run (option.js evaluateOption), their
// figures replaced, and every option re-scored. Each option says which model produced its figures. Off by default:
// power adequacy needs every hour, so the full-year model stays the default.
// Pure: no UI, no browser APIs. The generator yields after each verified option, so the UI can run it in slices.

import { buildContext } from './context.js';
import { normalizeInputs } from './defaults.js';
import { evaluateOption } from './option.js';
import { scoreOptions } from './scoring.js';
import { slimOption } from './run.js';

export const FULL_MODEL = 'Full-year hourly (8760 h)';

export function* verifySteps(run, rawInputs, { ctx = null, slim = false } = {}) {
  const inputs = normalizeInputs(rawInputs);
  if (inputs.settings.screeningModel !== 'repDays' || !run.scoring) return run;
  const K = Math.max(0, Math.min(run.options.length, Math.round(inputs.settings.verifyTop ?? 10)));
  const c = ctx || buildContext(inputs);
  const byId = new Map(run.options.map((o, i) => [o.id, i]));
  let done = 0, rounds = 0;
  // Verify the best K, re-score, and repeat while an option not yet verified has moved into the best K (Haiku check
  // H2, M1); at most 5 rounds.
  while (rounds < 5) {
    const todo = run.options.slice().sort((a, b) => a.rank - b.rank).slice(0, K).filter((o) => !o.verified);
    if (!todo.length) break;
    rounds++;
    for (const o of todo) {
      const e = evaluateOption(c, o.v);
      const screening = { model: o.model, lcoe: o.eco.lcoe, npvCost: o.eco.npvCost, carbonG: o.carbon.locationG, unmetMWh: o.unmet.mwh, adequate: o.adequacy.adequate, score: o.score, rank: o.rank };
      let v = {
        ...o, sizing: e.sz, dispatch: e.disp, ttp: e.ttp, eco: e.eco, carbon: e.carb, resilience: e.res, flags: e.flags, deliv: e.deliv,
        unmet: e.unmet, adequacy: e.adequacy, siteFit: e.siteFit, model: `${FULL_MODEL}, verified`, verified: true, screening,
      };
      if (slim) v = slimOption(v);
      run.options[byId.get(o.id)] = v;
      done++;
      yield { done, total: K, label: `verified #${o.rank} ${o.name}` };
    }
    run.scoring = scoreOptions(run.options, inputs);
  }
  run.verification = {
    model: 'representative days, then full-year verification', verified: done, rounds, topK: K,
    agreement: run.options.filter((o) => o.verified).map((o) => ({ id: o.id, lcoeScreen: o.screening.lcoe, lcoeFull: o.eco.lcoe, diffPct: (o.screening.lcoe / o.eco.lcoe - 1) * 100, carbonScreen: o.screening.carbonG, carbonFull: o.carbon.locationG })),
  };
  return run;
}

export function verifyTop(run, rawInputs, opts = {}) {
  const it = verifySteps(run, rawInputs, opts);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}
