// Words for the four axes and the realism results (realism rebuild of 2026-11-11, OPEN-QUESTIONS 251). With the
// rebuild on, the third axis measures the delay against the phasing plan and the fourth is buildability. Pure: no UI.
import { addMonths } from './dates.js';

export const isRealismRun = (run) => !!(run && run.scoring && run.scoring.realism);
export const isRealismOption = (o) => !!(o && o.deliv && o.deliv.buildability);
export function axisLabels(realism) {
  return realism
    ? { cost: 'Cost', carbon: 'Carbon', ttp: 'Delay against plan', deliverability: 'Buildability', ttpShort: 'Delay', delivShort: 'Build.' }
    : { cost: 'Cost', carbon: 'Carbon', ttp: 'Time-to-power', deliverability: 'Deliverability', ttpShort: 'TTP', delivShort: 'Deliv.' };
}
export const TIER_SHORT = { A: 'A · no conditions', B: 'B · with conditions', C: 'C · unlikely' };

// What a card or a row says about an option's dates: null when every building starts on its planned date.
export function lateInfo(o, start) {
  const en = o && o.sizing && o.sizing.energise;
  if (!en) return null;
  const ym = (m) => addMonths(start, m);
  const late = [];
  en.starts.forEach((s, k) => { if (s != null && en.late[k] > 0) late.push({ building: k + 1, months: en.late[k], date: ym(s), planned: ym(en.planned[k]), why: en.reasons[k] ? en.reasons[k].text : 'supply not ready' }); });
  const notBuilt = en.powered < en.buildings ? { from: en.powered + 1, to: en.buildings, why: en.reasons[en.powered] ? en.reasons[en.powered].text : 'the supply cannot carry them' } : null;
  if (!late.length && !notBuilt) return { onPlan: true, late, notBuilt, en };
  return { onPlan: false, late, notBuilt, en, worst: late.reduce((a, b) => (b.months > (a ? a.months : -1) ? b : a), null) };
}
export const lateLine = (x) => `Building ${x.building} starts ${x.months} month${x.months === 1 ? '' : 's'} late, in ${x.date} (planned ${x.planned}): ${x.why}`;
