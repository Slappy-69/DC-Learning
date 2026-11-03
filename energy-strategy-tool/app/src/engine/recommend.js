// Recommendations for the PDF report (work package 21; owner 2026-11-02, "Everything really": the report copies the
// layout of Claude's study report, recommendations included; OPEN-QUESTIONS 141–146).
//
// Written by fixed rules from the run's own figures, deterministic and offline (no language model). They name actions
// that follow from the figures: the leading option, a close runner-up, the bridging plant, the grid margin, the major
// flags, the defaults that matter most, the nearest tipping point, a more robust pick, measured weather and the tests
// not yet run. They cannot weigh what the tool does not know about the project; the report says so above the list.
// Pure: no browser APIs.

import { CHOICES, choiceLabel, TECH, getRegistry, LABEL, normalizeInputs } from './defaults.js';
import { NA } from './generator.js';
import { sameFigures } from './cards.js';
import { nearestFlips } from './breakeven.js';
import { shortFlag } from './summary.js';
import { weatherSummary } from './weather.js';
import { sig, money, monthLabel, perMWh } from '../format.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthText = (start, m) => { const [y, k] = String(monthLabel(start, m)).split('-').map(Number); return y && k ? `${MON[k - 1]} ${y}` : String(monthLabel(start, m)); };
const lower = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

// A runner-up is "close" within this many score points (scores run 0–100) or this share of the leader's LCOE
// (judgement, OPEN-QUESTIONS 143).
export const CLOSE_POINTS = 3;
export const CLOSE_LCOE = 0.02;
// The grid margin is "thin" when the design load at full build takes this share of the grid import or more (judgement).
export const THIN_MARGIN = 0.95;

const plural = (n, w, p = `${w}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? w : p}`;
const listText = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const techName = (t) => (TECH[t] ? TECH[t].name : t);

// The choices on which two options differ, as "C2 bridging technology: rented temporary generation against gas turbines".
export function choiceDifferences(a, b) {
  return CHOICES.filter((c) => a.v[c.id] !== b.v[c.id] && a.v[c.id] !== undefined && b.v[c.id] !== undefined)
    .map((c) => ({ id: c.id, name: c.name, a: a.v[c.id] === NA ? 'n/a' : choiceLabel(c.id, a.v[c.id]), b: b.v[c.id] === NA ? 'n/a' : choiceLabel(c.id, b.v[c.id]) }));
}

// The first option after the leader whose figures differ from it (the breakeven table's #2 rule).
export function runnerUp(ranked) {
  const L = ranked[0];
  return ranked.slice(1).find((o) => !sameFigures(L, o)) || null;
}

// Gap facts used by the report and the rules: from the run's shortfall analysis (design load against grid import).
export function gapFacts(run) {
  const sf = run.shortfall && run.shortfall.byCooling && run.shortfall.byCooling[0];
  if (!sf) return null;
  return { temporary: sf.temporary, permanent: sf.permanent, designMW: sf.designMW, fullGridMW: sf.fullGridMW, peakPUE: sf.peakPUE, fullGridMonth: run.shortfall.fullGridMonth, gridMatched: sf.gridMatched };
}

// opts: { sensitivity (a tornado result), breakevens, monteCarlo } as handed to the report.
export function recommendations(run, opts = {}) {
  if (!run || !run.options || !run.options.length) return { items: [], note: '' };
  const I = normalizeInputs(run.inputs);
  const start = (run.meta && run.meta.analysisStart) || I.project.analysisStart;
  const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
  const L = ranked[0];
  const items = [];
  const add = (id, text) => items.push({ id, text });
  const adequate = L.adequacy ? L.adequacy.adequate !== false : true;

  // 1. The leading option.
  if (adequate) {
    add('lead', `**Take #1 forward: ${L.name}.** It ranks first of the ${plural(run.options.length, 'option')} screened, meets the power need in every hour and supplies the campus at ${perMWh(L.eco.lcoe, 3)} with ${sig(L.carbon.locationG, 3)} gCO2e/kWh (location-based), for ${money(L.eco.capex, 3)} of capex.${L.resilience && L.resilience.status === 'Does not meet' ? ' It does not meet the resilience requirement: settle the backup before going further.' : ''}`);
  } else {
    const share = L.unmet && L.dispatch && L.dispatch.years && L.dispatch.years.length ? L.unmet.mwh / Math.max(1, L.dispatch.years.reduce((a, y) => a + (y.demandMWh || 0), 0)) : null;
    add('lead', `**Change the programme, the grid offer or the plant allowed: no option meets the power need in every hour.** The best, #1 ${L.name}, leaves ${sig((L.unmet && L.unmet.mwh) || 0, 3)} MWh unmet${share != null ? ` (${sig(share * 100, 2)} % of demand over the modelled years)` : ''}. Take no option forward until one is adequate.`);
  }

  // 2. A close runner-up.
  const R = runnerUp(ranked);
  if (R) {
    const dPts = L.score - R.score;
    const dL = Number.isFinite(L.eco.lcoe) && Number.isFinite(R.eco.lcoe) && L.eco.lcoe > 0 ? (R.eco.lcoe - L.eco.lcoe) / L.eco.lcoe : null;
    if (dPts <= CLOSE_POINTS || (dL != null && Math.abs(dL) <= CLOSE_LCOE)) {
      const diff = choiceDifferences(L, R).slice(0, 3).map((d) => `${lower(d.name)} (${lower(d.b)} against ${lower(d.a)})`);
      add('runner-up', `**Keep #${R.rank} open alongside it: ${R.name}.** It scores ${dPts < 0.995 ? `${dPts.toFixed(2)} points` : `${sig(dPts, 2)} points`} below the leader (out of 100)${dL != null ? ` and its LCOE is ${dL >= 0 ? `${sig(dL * 100, 2)} % higher` : `${sig(-dL * 100, 2)} % lower`}` : ''}, so a small change of input or weight can swap them.${diff.length ? ` It differs in ${listText(diff)}.` : ''}`);
    }
  }

  // 3. The bridging plant.
  const g = gapFacts(run);
  const br = L.sizing && L.sizing.bridge;
  if (br && br.mw > 0 && g && g.temporary && g.temporary.months > 0) {
    const permit = br.permitRegimes && br.permitRegimes.length ? ` It needs ${br.permitRegimes.length === 1 ? 'a permit' : 'permits'} under ${listText(br.permitRegimes)}; the programme allows ${plural(br.permitM || 0, 'month')} for ${br.permitRegimes.length === 1 ? 'it' : 'them'}.` : '';
    const after = { remove: 'removed when the grid is ready', backup: 'kept as the campus backup', prime: 'kept running as prime power', split: 'kept for the permanent shortfall, the rest as backup', gridServices: 'kept for grid services' }[L.v.C3] || '';
    add('bridge', `**Secure the bridging plant now.** ${sig(br.mw, 3)} MW of ${techName(br.tech).toLowerCase()}${br.units ? ` (${br.units} × ${sig(br.unitMW, 3)} MW)` : ''}, needed from ${monthText(start, g.temporary.firstMonth)} for ${plural(g.temporary.months, 'month')} until the grid carries the design load${g.fullGridMonth != null ? ` (${monthText(start, g.fullGridMonth)})` : ''}${after ? `, then ${after}` : ''}.${permit}`);
  }

  // 4. The grid margin at full build.
  if (g && g.fullGridMW > 0) {
    const share = g.designMW / g.fullGridMW;
    if (g.permanent && g.permanent.months > 0) add('grid-margin', `**Ask the network operator for more import capacity, or plan the permanent shortfall.** At full build the design load is ${sig(g.designMW, 3)} MW (IT × maximum PUE ${sig(g.peakPUE, 3)}) against ${sig(g.fullGridMW, 3)} MW of grid import, so up to ${sig(g.permanent.peakMW, 3)} MW must come from on-site plant for the life of the campus.`);
    else if (share >= THIN_MARGIN) add('grid-margin', `**Check the grid margin with the network operator.** At full build the design load is ${sig(g.designMW, 3)} MW (IT × maximum PUE ${sig(g.peakPUE, 3)}) against ${sig(g.fullGridMW, 3)} MW of grid import: ${share >= 1 - 1e-9 ? 'no headroom' : `${sig((1 - share) * 100, 2)} % headroom`}. Ask about extra capacity, or plan load management or batteries for the hottest hours.`);
  }

  // 5. Major flags on the leader.
  const major = L.flags.filter((f) => f.severity === 'major' && !f.assumed && !f.siteFit);
  if (major.length) add('flags', `**Clear the major flags early.** ${cap(listText(major.slice(0, 3).map((f) => shortFlag(f.message))))}${major.length > 3 ? `, and ${major.length - 3} more (Appendix F)` : ''}.`);

  // 6. Defaults that matter: the leader's key inputs left at their default, those with the largest tornado swing first.
  const assumed = L.flags.filter((f) => f.assumed && f.path && f.id.startsWith('assumed:'));
  if (assumed.length) {
    const tor = opts.sensitivity && opts.sensitivity.optionId === L.id ? opts.sensitivity : null;
    const swing = new Map();
    if (tor) for (const r of tor.allRows || []) if (r.record) swing.set(r.record, Math.max(swing.get(r.record) || 0, r.swing || 0));
    const named = assumed.map((f, i) => ({ name: f.message.replace(/^Assumed /, '').split(':')[0], s: swing.get(f.path) || 0, i }))
      .sort((a, b) => b.s - a.s || a.i - b.i);
    const reg = Object.values(getRegistry());
    const unverified = reg.filter((r) => r.label === LABEL).length;
    add('defaults', `**Replace the defaults that matter with project figures.** The leader uses ${plural(assumed.length, 'key input')} left at the tool's default${tor ? ', those that move its score most first' : ''}: ${listText(named.slice(0, 6).map((x) => lower(x.name)))}${named.length > 6 ? `, and ${named.length - 6} more` : ''}. Behind them, ${unverified} of ${reg.length} default records are ${LABEL}.`);
  }

  // 7. The nearest tipping point (breakevens, when run on this leader).
  const be = opts.breakevens && opts.breakevens.leaderId === L.id ? opts.breakevens : null;
  if (be) {
    const nf = nearestFlips(be, 2);
    if (nf.length) add('tipping', `**Watch the nearest tipping points.** ${cap(nf.map((f) => f.text).join('; '))}. Firm up these inputs before the choice is fixed.`);
  }

  // 8. A more robust pick (Monte Carlo, when run on this leader).
  const mc = opts.monteCarlo && opts.monteCarlo.complete && opts.monteCarlo.leaderId === L.id ? opts.monteCarlo : null;
  if (mc) {
    const lr = mc.rows.find((r) => r.id === mc.leaderId), rb = mc.rows.find((r) => r.id === mc.robustPickId);
    if (rb && lr && rb.id !== lr.id) add('robust', `**Consider #${rb.rank} as the safer choice.** Across ${mc.samples.toLocaleString('en-GB')} samples of the uncertain inputs it stays within ${Math.round(mc.band * 100)} % of the best score in ${rb.nRobust}, against ${lr.nRobust} for #1.`);
  }

  // 9. Measured weather.
  const ws = weatherSummary(I);
  if (!ws) add('weather', `**Load measured weather for the site.** This run uses a made-up hourly year from the country profile; the hourly PUE, the design day and the solar output all follow it. An EPW file for the nearest station replaces it (inputs section 1).`);
  else if (I.weather.source === 'station') add('weather', `**Check the weather station.** The program chose ${ws.text.split(';')[0]}; replace it with an EPW file if a closer or more suitable record exists.`);

  // 10. Tests not run for this report.
  const notRun = [];
  if (!(opts.sensitivity && opts.sensitivity.optionId === L.id)) notRun.push('the sensitivity test (tornado) on #1');
  if (!be) notRun.push('the breakevens');
  if (!mc) notRun.push('the uncertainty test (Monte Carlo)');
  if (notRun.length) add('tests', `**Run ${listText(notRun)} before relying on the order.** ${notRun.length === 1 ? 'It was' : 'They were'} not run for this report (Sensitivity tab); make the report again afterwards to include ${notRun.length === 1 ? 'it' : 'them'}.`);

  return {
    items,
    note: "Written by fixed rules from this run's figures, not by an engineer's judgement: check each one against what the tool does not know about the project (the client's priorities, the site, the market and the permitting authority).",
  };
}
