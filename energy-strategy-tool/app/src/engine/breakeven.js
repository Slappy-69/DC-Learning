// Breakeven table (BRIEF §13.3; work package 17; OPEN-QUESTIONS 93–97, answered 2026-10-24 with Claude's
// recommendations, accepted in advance by the owner).
//
// The leader against up to five competitors (#2, then the best option of each other strategy in rank order, the
// strategies of the first six cards: the leader's own card gives no competitor, so six cards reach five; owner's answer
// of 2026-10-26, OPEN-QUESTIONS 93), on the eight drivers with the largest weighted-score swing in the leader's tornado.
// For each competitor and driver: the driver value, nearest the current value on each side, at which their order
// flips, or "no flip within range". Each option is re-run with the engine the ranking uses (option.js), the driver set as
// the tornado sets it, and scored against the run's own axis ranges and weights (as the tornado does), so the run itself
// is never changed. Order = power adequacy first, then (with "rank requirement-compliant options first" on) resilience,
// then the weighted score, as in scoring.js rankOptions; the score is taken on the run's axis scales without clipping.
//
// Search: each side of the current value (low … current, current … high) is checked at its middle and its end; the
// first change of order, walking out from the current value, is then narrowed by bisection to 2 % of the driver's range
// (one month, one year or one hour for whole-number drivers). A flip that happens and reverses again between two
// checked points is not seen; the table says the search is on a grid of points. Pure: no UI, no browser APIs.

import { buildContext } from './context.js';
import { normalizeInputs, registryValue } from './defaults.js';
import { buildSiteModel, siteKey } from './site.js';
import { evaluateOption } from './option.js';
import { axisMetrics, axisScore, SCORE_KEYS } from './scoring.js';
import { TORNADO_DRIVERS, scoreAgainstRun } from './sensitivity.js';
import { topCards, sameFigures } from './cards.js';
import { addMonths } from './dates.js';

const settingNum = (path, lo, hi, dflt) => { const n = Math.floor(Number(registryValue(path))); return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : dflt)); };
export const breakevenCompetitorCount = () => settingNum('sensitivity.breakevenCompetitors', 1, 10, 5);
export const breakevenDriverCount = () => settingNum('sensitivity.breakevenDrivers', 1, TORNADO_DRIVERS.length, 8);
export const breakevenTolerance = () => { const x = Number(registryValue('sensitivity.breakevenTolerance')); return Number.isFinite(x) && x > 0 && x < 0.5 ? x : 0.02; };

// Drivers set in whole numbers (months, years, hours).
const WHOLE = new Set(['grid-date', 'period', 'test-hours']);

// The current value of a driver, on the scale of its range (factor drivers: 1; the grid date: 0 months).
export function driverBase(d, inp) {
  if (d.id === 'grid-date') return 0;
  if (d.id === 'wacc') return inp.economics.wacc;
  if (d.id === 'period') return inp.economics.periodYears;
  if (d.id === 'escalation') return inp.economics.elecEscalation;
  if (d.id === 'test-hours') return inp.requirements.testRunHours;
  return 1;
}

// Competitors (§13.3): #2 (or the next option whose figures differ from #1), then the best option of each other strategy
// in rank order, up to n.
export function breakevenCompetitors(run, n = breakevenCompetitorCount()) {
  const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
  const L = byRank[0];
  const out = [];
  const second = byRank.find((o) => o !== L && !sameFigures(L, o));
  if (second) out.push(second);
  for (const c of topCards(run.options, n + 1).cards) {
    if (out.length >= n) break;
    if (c.o !== L && !out.includes(c.o)) out.push(c.o);
  }
  // Fewer strategies than n: the next-ranked options with other figures fill the list.
  for (const o of byRank) {
    if (out.length >= n) break;
    if (o !== L && !out.includes(o) && !sameFigures(L, o)) out.push(o);
  }
  return out.slice(0, n).sort((a, b) => a.rank - b.rank);
}

// The order key of a re-run option: adequacy, compliance (when the setting is on), score.
const key = (s, compliantFirst) => [s.adequate ? 1 : 0, compliantFirst ? (s.compliant ? 1 : 0) : 0, s.line];
// > 0 when the leader stays ahead, < 0 when the competitor is ahead (ties go to the lower option code, as in the ranking).
function lead(sL, sC, idL, idC, compliantFirst) {
  const a = key(sL, compliantFirst), b = key(sC, compliantFirst);
  for (let i = 0; i < 2; i++) if (a[i] !== b[i]) return a[i] - b[i];
  const d = a[2] - b[2];
  if (Math.abs(d) > 1e-12) return d;
  return idL < idC ? 1e-12 : -1e-12;
}

// The breakevens as a generator yielding { done, total, label } after each re-run, so the UI can run it in time slices;
// breakevens() drains it. opts.site: the run's site model (reused while its key matches).
export function* breakevenSteps(run, { site = null } = {}) {
  const inputs = normalizeInputs(run.inputs);
  const weights = run.scoring.weights, ranges = run.scoring.ranges, settings = inputs.settings;
  const compliantFirst = !!(run.inputs.settings && run.inputs.settings.rankCompliantFirst);
  const byRank = run.options.slice().sort((a, b) => a.rank - b.rank);
  const L = byRank[0];
  const comps = breakevenCompetitors(run);
  const nD = breakevenDriverCount(), tol = breakevenTolerance();
  const baseSite = site && site.key === siteKey(inputs) ? site : buildSiteModel(inputs);
  let ctx0 = null;
  const ctxAt = (d, x) => {
    const inp = normalizeInputs(inputs);
    if (!ctx0) ctx0 = buildContext(normalizeInputs(inputs), { site: baseSite });
    d.apply(inp, x, ctx0);
    return buildContext(inp, { site: siteKey(inp) === baseSite.key ? baseSite : null });
  };
  const scoreOf = (ctx, o) => {
    const e = evaluateOption(ctx, o.v);
    const metrics = axisMetrics({ eco: e.eco, carbon: e.carb, ttp: e.ttp, deliv: e.deliv }, settings);
    return { score: scoreAgainstRun(metrics, ranges, weights).score, line: lineScore(metrics), adequate: e.adequacy ? e.adequacy.adequate !== false : true, compliant: !(e.res && e.res.status === 'Does not meet'), lcoe: e.eco.lcoe };
  };
  // The weighted score on the run's axis scales without the clipping to 0–100 the tornado uses: two options whose
  // figures both move past the end of the run's range (for example every LCOE below the run's lowest at a low grid
  // price) still compare by how far apart they are.
  const lineScore = (m) => SCORE_KEYS.reduce((a, k) => a + weights[k] * (ranges[k] ? axisScore(k, m[k], ranges[k].lo, ranges[k].hi) : 0), 0);
  const baseScore = (o) => ({ score: o.score, line: lineScore(o.metrics), adequate: !(o.adequacy && o.adequacy.adequate === false), compliant: !(o.resilience && o.resilience.status === 'Does not meet'), lcoe: o.eco.lcoe });
  let done = 0;
  // With the representative-day screening tier on, only the best `verifyTop` options carry full-year figures in the run;
  // the others carry screening figures. Every point of the table is a full-year re-run, so the base (today's value) is
  // re-run the same way, or an option next to the leader could show a flip that is only the difference between the two
  // models (H6, MED-4). With the default full-year run the re-run equals the run's own figures (checked: difference 0).
  const rescoreBase = inputs.settings.screeningModel === 'repDays';
  // Step 1: the leader at each driver's low and high (its tornado on every driver), to choose the drivers.
  const est = (rescoreBase ? 1 + comps.length : 0) + 2 * TORNADO_DRIVERS.length + nD * 2 * (1 + comps.length) + nD * comps.length * 8;
  let total = est;
  let baseFull = null;
  if (rescoreBase) {
    if (!ctx0) ctx0 = buildContext(normalizeInputs(inputs), { site: baseSite });
    baseFull = new Map();
    for (const o of [L, ...comps]) {
      baseFull.set(o.id, scoreOf(ctx0, o));
      done++;
      yield { done, total, label: `#${o.rank} at today's values, full year` };
    }
  }
  const baseOf = (o) => (baseFull ? baseFull.get(o.id) : baseScore(o));
  const lowHigh = new Map();
  for (const d of TORNADO_DRIVERS) {
    const [lo, hi] = d.range(inputs);
    const r = {};
    for (const [side, x] of [['low', lo], ['high', hi]]) {
      r[side] = { x, s: scoreOf(ctxAt(d, x), L) };
      done++;
      yield { done, total, label: `#1 at ${d.label}, ${side}` };
    }
    lowHigh.set(d.id, { lo, hi, swing: Math.abs(r.high.s.score - r.low.s.score), L: r });
  }
  const drivers = TORNADO_DRIVERS.slice().sort((a, b) => lowHigh.get(b.id).swing - lowHigh.get(a.id).swing || (a.id < b.id ? -1 : 1)).slice(0, nD);
  // Step 2: every option at the middle and the end of each side; step 3: bisection of the first flip on each side.
  const rows = [];
  for (const d of drivers) {
    const { lo: rLo, hi: rHi, L: Lr } = lowHigh.get(d.id);
    const b0 = driverBase(d, inputs);
    // The side labelled "lower" must hold lower values and "higher" higher ones. When the engineer's own value lies outside
    // the record's range (a WACC of 13 % against 4–12 %), the range used grows to include it (H6, LOW-2); nothing beyond the
    // record's range is tested on that side, and the table says the range was widened.
    const lo = Math.min(rLo, b0), hi = Math.max(rHi, b0);
    const widened = lo !== rLo || hi !== rHi;
    const whole = WHOLE.has(d.id);
    const pt = (a, b) => (whole ? Math.round((a + b) / 2) : (a + b) / 2);
    const xs = [lo, pt(lo, b0), b0, pt(b0, hi), hi];
    const all = [L, ...comps];
    const at = new Map(); // x → Map(option id → score)
    at.set(b0, new Map(all.map((o) => [o.id, baseOf(o)])));
    for (const x of xs) {
      let m = at.get(x);
      if (!m) { m = new Map(); at.set(x, m); }
      if (x === rLo && !m.has(L.id)) m.set(L.id, Lr.low.s);
      if (x === rHi && !m.has(L.id)) m.set(L.id, Lr.high.s);
      const need = all.filter((o) => !m.has(o.id));
      if (!need.length) continue;
      const ctx = ctxAt(d, x);
      for (const o of need) {
        m.set(o.id, scoreOf(ctx, o));
        done++;
        yield { done, total, label: `${d.label} at ${d.text(x)}: #${o.rank}` };
      }
    }
    const width = Math.abs(hi - lo) || 1;
    const cells = [];
    for (const C of comps) {
      const sign = (x) => lead(at.get(x).get(L.id), at.get(x).get(C.id), L.id, C.id, compliantFirst);
      const flips = {};
      for (const [side, path] of [['down', [b0, xs[1], lo]], ['up', [b0, xs[3], hi]]]) {
        const pts = path.filter((x, i) => i === 0 || x !== path[i - 1]);
        let found = null;
        for (let i = 1; i < pts.length && !found; i++) {
          if (Math.sign(sign(pts[i - 1])) !== Math.sign(sign(pts[i]))) found = [pts[i - 1], pts[i]];
        }
        if (!found) { flips[side] = null; continue; }
        // Bisection between the last point with the current order (a) and the first with the other order (b).
        let [a, b] = found;
        const sa = Math.sign(sign(a));
        while (whole ? Math.abs(b - a) > 1 : Math.abs(b - a) > tol * width) {
          const m = whole ? Math.round((a + b) / 2) : (a + b) / 2;
          if (m === a || m === b) break;
          const ctx = ctxAt(d, m);
          const sL = scoreOf(ctx, L), sC = scoreOf(ctx, C);
          done += 2;
          if (done > total - 2) total = done + 20;
          yield { done, total, label: `${d.label}: #1 against #${C.rank} near ${d.text(m)}` };
          if (Math.sign(lead(sL, sC, L.id, C.id, compliantFirst)) === sa) a = m; else b = m;
        }
        flips[side] = { from: a, to: b, at: whole ? b : (a + b) / 2, text: d.text(whole ? b : (a + b) / 2), leaderAheadBefore: sa > 0 };
      }
      cells.push({ competitorId: C.id, flips, baseLeaderAhead: sign(b0) > 0 });
    }
    rows.push({ id: d.id, label: d.label, unit: d.unit, record: d.record, low: lo, high: hi, base: b0, whole, widened, swing: lowHigh.get(d.id).swing, lowText: d.text(lo), highText: d.text(hi), cells });
  }
  return {
    leaderId: L.id, leaderRank: L.rank, leaderName: L.name,
    competitors: comps.map((o) => ({ id: o.id, rank: o.rank, name: o.name, score: o.score })),
    rows, tolerance: tol, evaluations: done,
    baseModel: rescoreBase ? 'full-year re-run' : 'run',
    baseLines: Object.fromEntries([L, ...comps].map((o) => [o.id, baseOf(o).line])), // the weighted scores the base points used
    gridDate: inputs.grid.fullDate,
  };
}

export function breakevens(run, opts = {}) {
  const it = breakevenSteps(run, opts);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

// Words for one flip: "#7 leads if the grid full-connection date slips by more than 9 months (2031-04)".
export function flipText(row, cell, flip, compRank, side) {
  const who = flip.leaderAheadBefore ? `#${compRank} would lead` : `#1 would lead #${compRank}`;
  if (row.id === 'grid-date') {
    const m = Math.abs(flip.at);
    return `${who} if the grid full-connection date ${side === 'up' ? 'slipped by' : 'came forward by'} ${m} month${m === 1 ? '' : 's'} or more`;
  }
  const dir = side === 'up' ? 'rose to' : 'fell to';
  return `${who} if ${row.label.replace(/\s*\([^)]*\)$/, '').replace(/^[A-Z][a-z]/, (x) => x.toLowerCase())} ${dir} ${flip.text}`;
}

// The flips nearest the current values, as a share of each driver's range (for the summary, part 5).
export function nearestFlips(be, n = 2) {
  const out = [];
  for (const row of be.rows) {
    const width = Math.abs(row.high - row.low) || 1;
    row.cells.forEach((cell) => {
      for (const side of ['down', 'up']) {
        const f = cell.flips[side];
        if (!f) continue;
        const comp = be.competitors.find((c) => c.id === cell.competitorId);
        out.push({ row, cell, side, flip: f, comp, distance: Math.abs(f.at - row.base) / width, text: flipText(row, cell, f, comp.rank, side) });
      }
    });
  }
  return out.sort((a, b) => a.distance - b.distance || a.comp.rank - b.comp.rank).slice(0, n);
}

export const gridDateAt = (be, months) => addMonths(be.gridDate, months);
