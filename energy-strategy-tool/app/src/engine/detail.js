// Detail kept for the best options only (work package 23; owner 2026-11-06, "Keep detail for the top 2,000",
// OPEN-QUESTIONS 154). With every combination screened (T1: 17,344 options) the app held about 1 GB and a re-run crashed
// the page. So after a run the best DETAIL_KEEP options keep their full detail and the rest become light records: every
// figure the ranking, the views, the filters and the cards read is kept (scores, metrics, flags, statuses, the sizes of
// the plant), and the bulky parts are dropped (the hour-by-hour dispatch years, the yearly cash-flow ledger, the sizing
// sentences, the carbon trajectory, the site-fit detail). A weight change still ranks every option exactly. A light
// option that is opened, compared, shown on the Dispatch tab or put in the PDF is rebuilt with the run's own
// per-option chain (option.js), so its figures equal the run's (test 55). Pure: no browser APIs.

import { buildContext } from './context.js';
import { normalizeInputs } from './defaults.js';
import { evaluateOption } from './option.js';
import { optionName } from './generator.js';
import { slimOption } from './run.js';
import { hashInputs } from './runlog.js';
import { topCards } from './cards.js';

export const DETAIL_KEEP = 2000;
export const isLight = (o) => !!(o && o.light);

// The light record of a (slim or full) option.
export function lightOption(o) {
  if (!o || o.light) return o;
  const { sentences, firmByMonth, designByMonth, plants, ...sz } = o.sizing || {};
  const { ledger, capexLines, reconciliation, ppaHedge, ...eco } = o.eco || {};
  const { trajectory, ...carb } = o.carbon || {};
  const sf = o.siteFit;
  return {
    ...o,
    light: true,
    sizing: { ...sz, sentences: [] },
    eco: { ...eco, ledger: [], capexLines: [] },
    // Flags without their wording: the filters, counts and assumed-default notes read the id, severity, category and
    // path; the wording comes back when the option is rebuilt (the app rebuilds the options it shows).
    flags: (o.flags || []).map((f) => ({ id: f.id, severity: f.severity, category: f.category, message: '', assumed: f.assumed, path: f.path, siteFit: f.siteFit, permitting: f.permitting })),
    carbon: { ...carb, trajectory: [] },
    dispatch: { nExplicit: o.dispatch ? o.dispatch.nExplicit : 0, years: [] },
    siteFit: sf && typeof sf === 'object' ? { status: sf.status, skipped: sf.skipped, offsiteHa: sf.offsiteHa, landTakeM2: sf.landTakeM2, landTakeHa: sf.landTakeHa } : sf,
    layoutKey: undefined,
    dispatchKey: undefined,
  };
}

// After a run is scored: options ranked below `keep` become light (none when the run holds no more than `keep`).
// Changes run.options in place and returns the run.
export function lightenRun(run, keep = DETAIL_KEEP) {
  if (!run || !Array.isArray(run.options) || run.options.length <= keep) return run;
  let n = 0;
  // Identical flags (the same data flag, the same assumed default, the same permit threshold…) are shared between light
  // records, so thousands of options do not each hold their own copy. Flags are read, never changed.
  const shared = new Map();
  const share = (f) => { const k = JSON.stringify(f); let x = shared.get(k); if (!x) { x = f; shared.set(k, x); } return x; };
  run.options = run.options.map((o) => {
    if (o.light || o.pinned || o.custom || !(o.rank > keep)) return o;
    n++;
    const l = lightOption(o);
    l.flags = (l.flags || []).map(share);
    return l;
  });
  run.detail = { keep, light: run.options.filter((o) => o.light).length, lightenedNow: n };
  return run;
}

// The context used to rebuild options, kept for the last run (building it takes about a second).
const CACHE = { key: null, ctx: null };
function contextFor(run) {
  const I = normalizeInputs(run.inputs);
  const key = run.inputHash || hashInputs(I);
  if (CACHE.key !== key) { CACHE.ctx = buildContext(I); CACHE.key = key; }
  return CACHE.ctx;
}

// Rebuilt detail is kept for the last few hundred options, so a weight change that brings the same options back into
// view does not re-run them.
const REBUILT = new Map();
const REBUILT_MAX = 400;
function detailOf(run, o) {
  const key = `${run.inputHash || ''}|${o.id}`;
  let d = REBUILT.get(key);
  if (!d) {
    const e = evaluateOption(contextFor(run), o.v);
    const s = slimOption({ sizing: e.sz, dispatch: e.disp, ttp: e.ttp, eco: e.eco });
    d = {
      name: optionName(o.v, e.sz), sizing: s.sizing, dispatch: s.dispatch, ttp: s.ttp, eco: s.eco, carbon: e.carb, resilience: e.res,
      flags: e.flags, deliv: e.deliv, unmet: e.unmet, adequacy: e.adequacy, siteFit: e.siteFit,
    };
    REBUILT.set(key, d);
    if (REBUILT.size > REBUILT_MAX) REBUILT.delete(REBUILT.keys().next().value);
  }
  return d;
}

// The full option for a light one: the run's per-option chain on its choice vector, with the run's scoring kept.
export function rebuildOption(run, o) {
  if (!o || !o.light) return o;
  const { light, ...rest } = o;
  return { ...rest, ...detailOf(run, o), layoutKey: undefined, dispatchKey: undefined };
}

// Rebuilds the light options among `ids` in place (run.options is replaced by a new array); returns how many.
export function ensureDetail(run, ids) {
  if (!run || !Array.isArray(run.options)) return 0;
  const want = new Set((ids || []).filter((x) => x != null));
  if (!want.size || !run.options.some((o) => o.light && want.has(o.id))) return 0;
  let n = 0;
  run.options = run.options.map((o) => {
    if (!o.light || !want.has(o.id)) return o;
    n++;
    return rebuildOption(run, o);
  });
  return n;
}

// The options whose detail the screens and the PDF read: the top `topN` by rank, the best option of each of the first
// ten strategies (cards and section 3 of the report), the best option that waits for the grid, and any extra ids.
export function detailIds(run, { topN = 50, extra = [] } = {}) {
  if (!run || !run.options) return [];
  const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
  const ids = new Set(ranked.slice(0, topN).map((o) => o.id));
  const seen = new Set();
  for (const o of ranked) {
    const k = ['C1', 'C2', 'C4', 'C5'].map((c) => o.v[c]).join('|');
    if (seen.has(k)) continue;
    seen.add(k); ids.add(o.id);
    if (seen.size >= 10) break;
  }
  const w = ranked.find((o) => o.v.C1 === 'wait');
  if (w) ids.add(w.id);
  for (const x of extra) if (x != null) ids.add(x);
  return [...ids];
}

// The run the screens show: when options they read in full are light (the top 50, the strategy cards, the options on
// the Dispatch, Site, Sensitivity and Compare tabs: `extra`), a copy of the run with those rebuilt; otherwise the same run.
export function withDetail(run, extra = []) {
  if (!run || !Array.isArray(run.options) || !run.options.some((o) => o.light)) return run;
  const r = { ...run };
  let n = ensureDetail(r, detailIds(r, { topN: 50, extra }));
  n += ensureDetail(r, topCards(r.options, 10).cards.map((c) => c.o.id));
  return n ? r : run;
}

// The options a "choose an option" list offers (Dispatch, Site and Sensitivity tabs): all of them up to DETAIL_KEEP;
// above that the best DETAIL_KEEP and the one shown, not tens of thousands. `ranked` is sorted by rank.
export function listedOptions(ranked, shown = null) {
  if (ranked.length <= DETAIL_KEEP) return ranked;
  const top = ranked.slice(0, DETAIL_KEEP);
  return shown && !top.includes(shown) ? [...top, shown] : top;
}
