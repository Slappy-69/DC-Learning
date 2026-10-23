// Power adequacy (owner's decisions of 2026-10-22, OPEN-QUESTIONS 37–41; build plan work package 3b).
//
// The tool's main question is the best power strategy to maximise IT load with up to five nines of availability
// (OPEN-QUESTIONS 37). Adequacy comes first (38): an option is adequate only if it serves its load in every hour
// of every dispatched year (no unmet load, no import above the grid capacity) and its firm supply covers the site's
// peak demand in every month, tested against the full contracted IT at the design-day PUE plus ancillary load (39),
// with no tolerance (40). There is no availability (nines) measure (41). Options that are not adequate rank below
// every adequate option (scoring.js); they are never hidden. This is the owner's deliberate exception to
// principle 5 ("flag, never enforce").
//
// Pure: no UI, no browser APIs.

import { designDemandByMonth } from './context.js';

export const ADEQUATE = 'Adequate';
export const NOT_ADEQUATE = 'Not adequate';
const EPS = 1e-6;

// Adequacy of one evaluated option, from its dispatch (unmet load and import above the grid capacity) and its
// time-to-power power gap (firm supply below the design load in a month).
export function adequacyOf(disp, ttp, unmet) {
  const exceedMWh = disp.years.reduce((a, y) => a + (y.exceedMWh || 0), 0);
  const exceedHours = disp.years.reduce((a, y) => a + (y.exceedHours || 0), 0);
  const reasons = [];
  if (unmet.mwh > EPS) reasons.push('unmet');
  if (exceedMWh > EPS) reasons.push('exceed');
  if (ttp.gapMWm > EPS) reasons.push('gap');
  return {
    adequate: reasons.length === 0,
    status: reasons.length === 0 ? ADEQUATE : NOT_ADEQUATE,
    reasons,
    unmetMWh: unmet.mwh, unmetHours: unmet.hours, unmetPeakMW: unmet.peakMW, longestH: unmet.longestH || 0,
    exceedMWh, exceedHours,
    gapMWm: ttp.gapMWm, gapMonths: ttp.gapMonths,
  };
}

// The words for an option that is not adequate (flag message, option detail).
export function adequacyText(a) {
  if (a.adequate) return 'Serves its load in every hour and its firm supply covers the design load in every month.';
  const parts = [];
  if (a.reasons.includes('unmet')) parts.push(`${Math.round(a.unmetMWh).toLocaleString('en-GB')} MWh unmet over ${a.unmetHours.toLocaleString('en-GB')} h (peak ${a.unmetPeakMW.toFixed(1)} MW, longest event ${a.longestH.toLocaleString('en-GB')} h)`);
  if (a.reasons.includes('exceed')) parts.push(`import above the grid capacity in ${a.exceedHours.toLocaleString('en-GB')} h (${Math.round(a.exceedMWh).toLocaleString('en-GB')} MWh)`);
  if (a.reasons.includes('gap')) parts.push(`firm supply below the design load: ${Math.round(a.gapMWm).toLocaleString('en-GB')} MW-months over ${a.gapMonths} month${a.gapMonths === 1 ? '' : 's'}`);
  return `Not adequate: ${parts.join('; ')}.`;
}

// Shortfall analysis before options are built (OPEN-QUESTIONS 38, step 1): the design load of the phased campus
// against the offered grid capacity, month by month, for each cooling approach the run generates. Temporary
// shortfall = before the full grid connection date; permanent = from it on. Also the IT load the full grid
// connection supports on its own.
export function shortfallAnalysis(ctx, coolingIds) {
  const inputs = ctx.inputs;
  const anc = inputs.load.ancillaryFrac;
  const T = Math.min(ctx.fullGridM, ctx.nMonthsTimeline);
  const out = [];
  for (const id of coolingIds) {
    const { arr, peakPUE } = designDemandByMonth(ctx, id);
    const part = (from, to) => {
      let peak = 0, peakM = -1, months = 0, firstM = -1, mwMonths = 0;
      for (let m = from; m < to; m++) {
        const s = Math.max(0, arr[m] - ctx.gridCap[m]);
        if (s > EPS) { months++; mwMonths += s; if (firstM < 0) firstM = m; if (s > peak) { peak = s; peakM = m; } }
      }
      return { peakMW: peak, peakMonth: peakM, months, firstMonth: firstM, mwMonths };
    };
    const fullMW = ctx.gridCap[Math.min(Math.max(T, 0), ctx.gridCap.length - 1)] || 0;
    const perMWIT = peakPUE + anc;
    out.push({
      cooling: id, peakPUE, designMW: inputs.load.itMW * perMWIT,
      temporary: part(0, T), permanent: part(T, ctx.nMonthsTimeline),
      fullGridMW: fullMW, itSupportedMW: fullMW / perMWIT,
    });
  }
  return { fullGridMonth: ctx.fullGridM, byCooling: out };
}
