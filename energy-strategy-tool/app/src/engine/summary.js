// Plain-English summary (BRIEF §14; work package 16; OPEN-QUESTIONS 12, answered 2026-10-24 with Claude's
// recommendation, accepted in advance by the owner: templates, deterministic, offline, editable as a user note).
//
// Written from fixed templates and the run's own numbers: no language model and no network, so the Windows program
// (packaging check D12) and the hosted page give the same words for the same run. It describes the result under the
// engineer's own weights and settings; it never advises. The label is "Summary", never "Recommendation", and the
// leading option is "the option that leads under the current weights".
//
// Seven parts (§14), at most 250 words with the closing guardrail sentence (§23); each part has more detail that the
// screen and the PDF can show expanded:
//   1 leading option and its headline figures (ranges only from a tornado run on the leader; Monte Carlo is not built);
//   2 why it leads: the axis differences against #2, in score points;
//   3 what it gives up: where #2 or the best option on an axis does better;
//   4 confidence: the lead, the options close to it, the defaults behind it (rank probability is not built);
//   5 what would change the answer: the smallest change of one weight that changes the leader (exact: the score is
//     linear in the weights and the axis ranges do not depend on them); the two nearest breakevens when the breakeven
//     table (breakeven.js, work package 17) has been run on the leader;
//   6 open flags on the leader: resilience, permitting, fuel and utilities, any other major flag, and site fit only
//     while the Site tab (Beta) is on (never in the PDF);
//   7 inputs with most influence: from a tornado run on the leader, by swing, data confidence breaking ties.
// Pure: no UI, no browser APIs.

import { CHOICES, choiceLabel, getRegistry, LABEL } from './defaults.js';
import { NA } from './generator.js';
import { sameFigures } from './cards.js';
import { SCORE_KEYS, isRequirementCompliant } from './scoring.js';
import { visibleFlags } from './view.js';
import { sortRows, measureById } from './sensitivity.js';
import { nearestFlips } from './breakeven.js';
import { GUARDRAIL, perMWh, money, sig } from '../format.js';

export const SUMMARY_TITLE = 'Summary';
export const SUMMARY_WORD_LIMIT = 250;
// Words the templates never use (§14 "no advice or directive language"); the tests read the generated text against it.
export const DIRECTIVE_WORDS = /\b(we recommend|recommend|recommended|recommendation|you should|should|must choose|choose|invest|get)\b/i;

// Words: the tokens with a letter or a digit ("·", "→", "%" and "—" are not words).
export const wordCount = (s) => String(s || '').trim().split(/\s+/).filter((t) => /[A-Za-z0-9]/.test(t)).length;

const AXIS_NAME = { cost: 'cost', carbon: 'carbon', ttp: 'time-to-power', deliverability: 'deliverability' };
const adequate = (o) => !(o.adequacy && o.adequacy.adequate === false);
const pct0 = (x) => `${Math.round(x * 100)} %`;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const list = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const pts = (x) => { const a = Math.abs(x); return a < 0.005 ? 'less than 0.01' : a < 10 ? a.toFixed(2) : a.toFixed(1); };
const plural = (n, one, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

// The figure behind each axis, as the run measures it (settings.costMetric, settings.carbonMetric).
function axisFigure(k, settings) {
  if (k === 'cost') return settings.costMetric === 'npv'
    ? { name: 'NPV of net cost', tag: 'NPV', get: (o) => o.eco.npvCost, fmt: (x, n) => money(x, n) }
    : { name: 'LCOE', tag: 'LCOE', get: (o) => o.eco.lcoe, fmt: (x, n) => perMWh(x, n) };
  if (k === 'carbon') {
    if (settings.carbonMetric === 'cfe') return { name: 'hourly carbon-free energy', tag: 'hourly CFE', get: (o) => o.carbon.cfePct, fmt: (x, n) => `${sig(x * 100, n)} %` };
    const market = settings.carbonMetric === 'market';
    return { name: `carbon (${market ? 'market' : 'location'}-based)`, tag: market ? 'market-based' : '', get: (o) => (market ? o.carbon.marketG : o.carbon.locationG), fmt: (x, n) => `${sig(x, n)} g/kWh` };
  }
  if (k === 'ttp') return { name: 'time-to-power', get: (o) => o.ttp.metric, fmt: (x, n) => (x < 0.05 ? 'on time' : `${sig(x, n)} months late`) };
  return { name: 'deliverability', get: (o) => o.deliv.score, fmt: (x, n) => `${sig(x, n)} points` };
}
// The name of what an axis measures, as the run measures it: "carbon", "market-based carbon", "hourly CFE".
function figureName(k, f) { return k === 'carbon' && f.tag ? (f.tag === 'market-based' ? 'market-based carbon' : f.tag) : AXIS_NAME[k]; }
// Two values that read differently: more significant figures until they do (at most 5).
function pair(f, a, b) {
  for (let n = 3; n <= 5; n++) { const x = f.fmt(f.get(a), n), y = f.fmt(f.get(b), n); if (x !== y || n === 5) return [x, y]; }
  return [f.fmt(f.get(a), 3), f.fmt(f.get(b), 3)];
}

// "€152/MWh" and "€153/MWh" → "€152" and "€153/MWh": the unit after the last digit is written once when both share it.
function compactPair(a, b) {
  const m = /^(.*\d)(\D+)$/.exec(a);
  return m && b.endsWith(m[2]) && /\d/.test(b) ? [m[1], b] : [a, b];
}

// The options the leader is ranked with: the same power adequacy and, with "rank requirement-compliant options
// first" on, the same compliance (scoring.js rankOptions). Only these can take its place by a weight change.
function rankGroup(options, leader, compliantFirst) {
  const same = (o) => adequate(o) === adequate(leader) && (!compliantFirst || isRequirementCompliant(o) === isRequirementCompliant(leader));
  return options.filter(same);
}

// The choices on which two options differ (C-list order), strategy choices first.
const STRATEGY = ['C1', 'C2', 'C3', 'C4', 'C5'];
function differingChoices(a, b) {
  const d = CHOICES.filter((c) => a.v[c.id] !== b.v[c.id] && !(a.v[c.id] === NA && b.v[c.id] === NA));
  return [...d.filter((c) => STRATEGY.includes(c.id)), ...d.filter((c) => !STRATEGY.includes(c.id))]
    .map((c) => ({ id: c.id, name: c.name, value: b.v[c.id] === NA ? 'n/a' : choiceLabel(c.id, b.v[c.id]) }));
}

// The smallest change of one weight that changes the leader (part 5). Each axis is raised towards 100 % or lowered
// towards 0 %, the others scaled in proportion; the score of every option is then (1 − t)·S + t·D, where D is its
// score under the target weights, so the crossing with the leader is exact. The reported weight is the first whole
// per cent past the crossing, and the new leader is the best option at that weight (it is checked, not assumed).
export function weightChanges(run) {
  const opts = run.options;
  if (!opts.length) return [];
  const w = run.scoring.weights;
  const leader = opts.reduce((a, b) => (a.rank < b.rank ? a : b));
  const group = rankGroup(opts, leader, !!(run.inputs.settings && run.inputs.settings.rankCompliantFirst));
  if (group.length < 2) return [];
  const out = [];
  for (const k of SCORE_KEYS) {
    for (const dir of ['up', 'down']) {
      // Nothing to raise at 100 % or to lower at 0 %; lowering the only weighted axis leaves no weights to scale up.
      if (w[k] >= 1 - 1e-12 || (dir === 'down' && w[k] <= 1e-12)) continue;
      // D: each option's score under the target weights (all of k, or none of k with the rest in proportion).
      const D = (o) => (dir === 'up' ? o.axisScores[k] : (o.score - w[k] * o.axisScores[k]) / (1 - w[k]));
      const dL = D(leader);
      let tMin = Infinity;
      for (const o of group) {
        if (o === leader) continue;
        const gap = leader.score - o.score, gain = D(o) - dL;
        if (gain <= 1e-12) continue;
        const t = Math.max(0, gap) / (Math.max(0, gap) + gain);
        if (t < tMin) tMin = t;
      }
      if (!Number.isFinite(tMin)) continue;
      const exact = dir === 'up' ? w[k] + tMin * (1 - w[k]) : w[k] * (1 - tMin);
      const toPct = dir === 'up' ? Math.floor(exact * 100 + 1e-9) + 1 : Math.ceil(exact * 100 - 1e-9) - 1;
      if (toPct > 100 || toPct < 0) continue;
      const t = dir === 'up' ? (toPct / 100 - w[k]) / (1 - w[k]) : 1 - toPct / 100 / w[k];
      if (!(t > 0 && t <= 1 + 1e-12)) continue;
      const at = (o) => (1 - t) * o.score + t * D(o);
      let best = leader;
      for (const o of group) { const s = at(o), sb = at(best); if (s > sb + 1e-12 || (Math.abs(s - sb) <= 1e-12 && o.id < best.id)) best = o; }
      if (best === leader) continue;
      out.push({ axis: k, dir, fromPct: Math.round(w[k] * 100), exactPct: exact * 100, toPct, change: Math.abs(toPct - w[k] * 100), newLeader: { id: best.id, rank: best.rank, name: best.name } });
    }
  }
  return out.sort((a, b) => a.change - b.change || (a.axis < b.axis ? -1 : 1));
}

// The first clause of a flag message, short enough for the summary.
export function shortFlag(m) {
  let s = String(m).split(/(?<=\.)\s/)[0].replace(/\.$/, '').replace(/\s*\(flagged in \u00a7[^)]*\)/, '');
  if (wordCount(s) > 16 && s.includes(': ')) s = s.split(': ')[0];
  if (wordCount(s) > 16) {
    // Cut at the last clause boundary (comma, semicolon, bracket) inside the first 16 words; a word cut only without one.
    const head = s.split(/\s+/).slice(0, 16).join(' ');
    const k = Math.max(head.lastIndexOf(', '), head.lastIndexOf('; '), head.lastIndexOf(' ('));
    s = k > 20 ? `${head.slice(0, k)}…` : `${head}…`;
  }
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

const RES_TEXT = { Meets: 'meets the requirement', 'Meets with flags': 'meets the requirement with flags', 'Does not meet': 'does not meet the requirement' };
const CONF_ORDER = { C: 0, B: 1, A: 2 };

// The summary of a run. opts.sensitivity: the last tornado result (sensitivity.js), used when it was run on the leader;
// opts.siteBeta: the Site tab (Beta) is on (site-fit flags are left out otherwise, and always in the PDF).
//
// Each part is a list of sentences; a sentence with a priority p > 0 is optional. When the text would pass the word
// limit, optional sentences are moved to the part's detail, the highest p first (from the last part back), until it
// fits; nothing is lost.
export function plainSummary(run, { sensitivity = null, breakevens = null, monteCarlo = null, siteBeta = false, wordLimit = SUMMARY_WORD_LIMIT } = {}) {
  if (!run || !run.options || !run.options.length) return null;
  const settings = run.inputs.settings || {};
  const w = run.scoring.weights;
  // The leader and #2 by a linear pass (the run can hold 50,000 options and the summary updates on every weight change,
  // BRIEF §19 ≤ 300 ms); the full order only when #2 has the same figures as #1.
  let L = null, R = null;
  for (const o of run.options) { if (o.rank === 1) L = o; else if (o.rank === 2) R = o; }
  if (!L) L = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
  const group = rankGroup(run.options, L, !!settings.rankCompliantFirst);
  const kind = `${adequate(L) ? 'adequate ' : ''}${settings.rankCompliantFirst ? 'requirement-compliant ' : ''}`;
  const groupName = `${kind}options`;
  const tor = sensitivity && sensitivity.optionId === L.id && Array.isArray(sensitivity.allRows) ? sensitivity : null;
  // Monte Carlo (work package 18) finished for this leader: ranges, rank probability and the robust pick.
  const mc = monteCarlo && monteCarlo.complete && monteCarlo.leaderId === L.id && Array.isArray(monteCarlo.rows) ? monteCarlo : null;
  const mcL = mc ? mc.rows.find((r) => r.id === L.id) : null;
  const parts = [];
  const notBuilt = [];
  const notRun = [];
  const add = (id, heading, sentences, more = [], condensed = null) => parts.push({ id, heading, sentences: sentences.filter((x) => x && x.t), more, condensed });
  const req = (t) => ({ t, p: 0 });
  const opt = (t, p) => ({ t, p });
  // The cost figure is named (LCOE or NPV); a carbon figure is already named by figureName ("hourly CFE").
  const vs = (k, f, a, b) => {
    const tag = k === 'cost' && f.tag ? `${f.tag} ` : '';
    const [x0, y0] = pair(f, a, b);
    if (x0 === y0) return `${tag}both ${x0}`;
    const [x, y] = compactPair(x0, y0);
    return `${tag}${x} against ${y}`;
  };

  // 1. Leading option.
  {
    const wText = SCORE_KEYS.map((k) => `${AXIS_NAME[k]} ${pct0(w[k])}`).join(', ');
    const ttp = L.ttp.metric < 0.05 ? 'power on time' : `time-to-power ${sig(L.ttp.metric, 3)} months late`;
    const more = [`Score ${L.score.toFixed(2)}; axis scores: ${SCORE_KEYS.map((k) => `${AXIS_NAME[k]} ${L.axisScores[k].toFixed(1)}`).join(', ')}.`,
      `NPV of net cost ${money(L.eco.npvCost)}; hourly carbon-free energy ${Math.round(L.carbon.cfePct * 100)} %; deliverability ${sig(L.deliv.score)} points.`];
    let range = null;
    if (mcL) {
      const [a, b] = compactPair(perMWh(mcL.lcoe.p10), perMWh(mcL.lcoe.p90));
      range = req(`In ${mc.samples.toLocaleString('en-GB')} Monte Carlo samples its LCOE is ${a} to ${b} (P10 to P90; P50 ${perMWh(mcL.lcoe.p50)}).`);
      more.push(`Monte Carlo P10–P90: NPV of net cost ${money(mcL.npv.p10)} to ${money(mcL.npv.p90)}; capex ${money(mcL.capex.p10)} to ${money(mcL.capex.p90)}; carbon ${sig(mcL.carbon.p10)} to ${sig(mcL.carbon.p90)} g/kWh (location-based).`);
      if (tor) { const vals = [tor.base.lcoe, ...tor.allRows.flatMap((r) => [r.low.lcoe, r.high.lcoe])].filter(Number.isFinite); more.push(`Tornado (one input at a time): LCOE ${compactPair(perMWh(Math.min(...vals)), perMWh(Math.max(...vals))).join(' to ')}.`); }
    } else if (tor) {
      const vals = [tor.base.lcoe, ...tor.allRows.flatMap((r) => [r.low.lcoe, r.high.lcoe])].filter(Number.isFinite);
      // Optional, but kept longer than the inputs that follow it in part 7 (priority 1.5 against 1).
      range = opt(`With the ${plural(tor.allRows.length, 'tested input')} moved one at a time across their ranges, its LCOE is ${compactPair(perMWh(Math.min(...vals)), perMWh(Math.max(...vals))).join(' to ')}.`, 1.5);
      more.push('That range is one input at a time (the tornado on the Sensitivity tab), not a joint range.');
    } else range = opt('These are single values: the Monte Carlo has not been run for this result (Sensitivity tab).', 4);
    if (settings.rankCompliantFirst) more.push('Requirement-compliant options are ranked first (run setting).');
    add('leader', 'Leading option', [
      req(`The option that leads under the current weights (${wText}${run.scoring.equalWeightsUsed ? ', equal because every weight was 0' : ''}) is #1, ${L.name}, with a score of ${L.score.toFixed(1)}.`),
      req(`LCOE ${perMWh(L.eco.lcoe)}${settings.costMetric === 'npv' ? ` (NPV of net cost ${money(L.eco.npvCost)})` : ''}, capex ${money(L.eco.capex)}, carbon ${sig(L.carbon.locationG)} g/kWh (location-based${settings.carbonMetric === 'market' ? `; market-based ${sig(L.carbon.marketG)} g/kWh` : settings.carbonMetric === 'cfe' ? `; hourly CFE ${Math.round(L.carbon.cfePct * 100)} %` : ''}), ${ttp}.`),
      adequate(L) ? null : req('No option serves the load in every hour; it is the best-scoring of those that do not.'),
      range,
    ], more);
  }

  // 2. Why it leads, and 3. what it gives up.
  let cmp = null;
  {
    const s = [], more = [];
    if (!R) s.push(req('It is the only option in the run.'));
    else {
      if (sameFigures(L, R)) {
        s.push(req('#2 has the same figures, so their order is by option code only.'));
        cmp = run.options.slice().sort((a, b) => a.rank - b.rank).find((o) => o !== L && !sameFigures(L, o)) || null;
      } else cmp = R;
      if (cmp && group.includes(cmp)) {
        const diffs = differingChoices(L, cmp);
        const contrib = SCORE_KEYS.map((k) => ({ k, c: w[k] * (L.axisScores[k] - cmp.axisScores[k]), f: axisFigure(k, settings) }));
        const pos = contrib.filter((x) => x.c > 0.005).sort((a, b) => b.c - a.c);
        const neg = contrib.filter((x) => x.c < -0.005).sort((a, b) => a.c - b.c);
        const level = contrib.filter((x) => Math.abs(x.c) <= 0.005).map((x) => AXIS_NAME[x.k]);
        // Every part that favours #1 is named with its figures, and every part that favours #2 by its points (its figures
        // are in part 3), so the named parts add up to the gap (to rounding; parts below 0.005 points are left out).
        const negText = neg.length ? `, less ${list(neg.map((x) => `${pts(x.c)} points on ${figureName(x.k, x.f)}`))}, where #${cmp.rank} does better` : '';
        s.push(req(`It is ${pts(L.score - cmp.score)} points ahead of #${cmp.rank}${pos.length ? `: ${list(pos.map((x) => `${pts(x.c)} points from ${figureName(x.k, x.f)} (${vs(x.k, x.f, L, cmp)})`))}${negText}` : ', a difference that rounds away on every axis'}.`));
        if (diffs.length) s.push(opt(`#${cmp.rank} differs in ${plural(diffs.length, 'choice')}, among them ${diffs[0].name.toLowerCase()}: ${diffs[0].value}.`, 3));
        if (level.length && pos.length) s.push(opt(`They are level on ${list(level)}.`, 4));
        more.push(`#${cmp.rank}: ${cmp.name} (score ${cmp.score.toFixed(2)}).`);
        if (diffs.length) more.push(`Choices of #${cmp.rank} that differ from #1: ${diffs.map((d) => `${d.id} ${d.name}: ${d.value}`).join('; ')}.`);
        for (const x of contrib) more.push(`${cap(figureName(x.k, x.f))}: ${vs(x.k, x.f, L, cmp)}; ${Math.abs(x.c) < 0.005 ? 'no weighted difference (less than 0.01 points)' : `weighted difference ${x.c > 0 ? '+' : '−'}${pts(x.c)} points, in favour of #${x.c > 0 ? 1 : cmp.rank}`}.`);
      } else if (cmp) s.push(req(`#${cmp.rank} and every option below it rank lower because ${settings.rankCompliantFirst ? 'they do not serve the load in every hour or do not meet the resilience requirement' : 'they do not serve the load in every hour'}.`));
    }
    add('why', 'Why it leads', s, more);

    const g = [], gMore = [];
    if (cmp && group.includes(cmp)) {
      const worse = SCORE_KEYS.map((k) => ({ k, c: w[k] * (L.axisScores[k] - cmp.axisScores[k]) })).filter((x) => x.c < -0.005);
      if (worse.length) g.push(req(`Against #${cmp.rank} it gives up ${list(worse.map((x) => { const f = axisFigure(x.k, settings); return `${figureName(x.k, f)} (${vs(x.k, f, L, cmp)}, ${pts(x.c)} points)`; }))}.`));
    }
    // The best option of the group on each axis (axis score; ties keep the leader).
    const bestOn = SCORE_KEYS.map((k) => {
      const best = group.reduce((a, o) => (o.axisScores[k] > a.axisScores[k] + 1e-12 ? o : a), L);
      return { k, best, gap: best.axisScores[k] - L.axisScores[k] };
    });
    const GAP = 0.5; // axis points (of 100) below which a gap is not reported in the summary (it is in the detail)
    const gaps = bestOn.filter((x) => x.gap > GAP).sort((a, b) => b.gap - a.gap);
    gaps.slice(0, 2).forEach((x, i) => {
      const f = axisFigure(x.k, settings);
      const [a, b] = pair(f, L, x.best);
      const t = `On ${figureName(x.k, f)} it has ${a}; the best of the ${groupName}, #${x.best.rank}, has ${b}.`;
      g.push((g.length && i === 0) || i > 0 ? opt(t, 2) : req(t));
    });
    for (const x of bestOn.filter((y) => y.gap > 1e-9)) { const f = axisFigure(x.k, settings); const [a, b] = pair(f, L, x.best); gMore.push(`${cap(figureName(x.k, f))}: ${a}; best of the ${groupName}: #${x.best.rank} ${x.best.name}, ${b} (axis score ${x.best.axisScores[x.k].toFixed(1)} against ${L.axisScores[x.k].toFixed(1)}).`); }
    // Options outside the leader's group (they rank below it whatever their score) that do better on an axis (H5, M2).
    const outside = SCORE_KEYS.map((k) => {
      let best = null;
      for (const o of run.options) if (!group.includes(o) && o.axisScores[k] > L.axisScores[k] + GAP && (!best || o.axisScores[k] > best.axisScores[k])) best = o;
      return best ? { k, best, gap: best.axisScores[k] - L.axisScores[k] } : null;
    }).filter(Boolean).sort((a, b) => b.gap - a.gap);
    let none;
    if (group.length === 1) {
      none = `It is the only one of the ${groupName}, so nothing in its group does better${outside.length ? `; options that rank below it ${adequate(L) ? 'because they do not serve the load in every hour ' : ''}do better on ${list(outside.slice(0, 2).map((x) => { const f = axisFigure(x.k, settings); return `${figureName(x.k, f)} (#${x.best.rank}, ${f.fmt(f.get(x.best), 3)})`; }))}` : ''}.`;
    } else if (bestOn.every((x) => x.gap <= 1e-9)) none = `It is the best of the ${groupName} on every axis, so it gives up nothing to them.`;
    else none = `On every axis it is within ${GAP} points (of 100) of the best of the ${groupName}.`;
    for (const x of outside) { const f = axisFigure(x.k, settings); gMore.push(`Outside its group: #${x.best.rank} ${x.best.name} does better on ${figureName(x.k, f)} (${f.fmt(f.get(x.best), 3)} against ${f.fmt(f.get(L), 3)}).`); }
    add('gives-up', 'What it gives up', g.length ? g : [req(none)], gMore);
  }

  // 4. Confidence.
  {
    const more = [];
    const close = group.filter((o) => o !== L && L.score - o.score <= 1 + 1e-12).length;
    const assumed = L.flags.filter((f) => f.assumed && f.path);
    const reg = Object.values(getRegistry());
    const unv = reg.filter((r) => r.label === LABEL).length;
    if (!mc) notRun.push('the Monte Carlo');
    if (assumed.length) more.push(`Key inputs at their defaults: ${assumed.map((f) => f.message.replace(/^Assumed /, '').split(':')[0]).join('; ')}.`);
    const within = [0.1, 1, 5].map((d) => [d, group.filter((o) => o !== L && L.score - o.score <= d + 1e-12).length]);
    more.push(`Other ${groupName} close to the leader: ${within.map(([d, n]) => `${n.toLocaleString('en-GB')} within ${d} point${d === 1 ? '' : 's'}`).join(', ')}.`);
    add('confidence', 'Confidence', [
      req(close ? `${plural(close, `other ${kind}option`)} score${close === 1 ? 's' : ''} within 1 point of it.` : `No other ${kind}option scores within 1 point of it.`),
      mcL ? req(`In ${mc.samples.toLocaleString('en-GB')} Monte Carlo samples it leads in ${Math.round(mcL.pRank1 * 100)} % and is in the top three in ${Math.round(mcL.pTop3 * 100)} %; ${(() => { const rb = mc.rows.find((r) => r.id === mc.robustPickId); return rb && rb.id !== L.id ? `the robust pick (most often within ${Math.round(mc.band * 100)} % of the best) is #${rb.rank}, not the leader` : `it is also the robust pick (most often within ${Math.round(mc.band * 100)} % of the best)`; })()}.`)
        : opt('Rank probability and the robust pick come from the Monte Carlo, not run for this result.', 3),
      req(`${assumed.length ? `It uses ${plural(assumed.length, 'key input')} left at ${assumed.length === 1 ? 'its default' : 'their defaults'}` : 'No key input it uses is left at its default'}; ${unv.toLocaleString('en-GB')} of ${reg.length.toLocaleString('en-GB')} default records are ${LABEL}.`),
    ], more);
  }

  // 5. What would change the answer.
  const wc = weightChanges(run);
  {
    const s = [], more = [];
    const words = (x) => `the ${AXIS_NAME[x.axis]} weight ${x.dir === 'up' ? 'rose' : 'fell'} from ${x.fromPct} % to ${x.toPct} %`;
    if (wc.length) {
      const first = wc[0];
      const second = wc.find((x) => x.axis !== first.axis);
      if (second && second.newLeader.id === first.newLeader.id) {
        s.push(req(`#${first.newLeader.rank} would lead if ${words(first)}, or if ${words(second)}, the other weights scaled in proportion.`));
      } else {
        s.push(req(`#${first.newLeader.rank} would lead if ${words(first)}, the other weights scaled in proportion.`));
        if (second) s.push(opt(`#${second.newLeader.rank} would lead if ${words(second)}.`, 2));
      }
      for (const x of wc) more.push(`${cap(words(x))} (crossing at ${x.exactPct.toFixed(1)} %): #${x.newLeader.rank} ${x.newLeader.name} leads.`);
      more.push('Not listed: a weight at exactly 100 %, where many options tie on that axis and the order between them is by option code, and lowering a weight that is already 100 %.');
    } else s.push(req(group.length < 2 ? `No weight change alters the leader: it is the only one of the ${groupName}.` : 'No change of a single weight alters the leader.'));
    // Breakevens (work package 17, OPEN-QUESTIONS 97): the two flips nearest the current values, when the table was run on
    // this leader; otherwise said not to have been run.
    const be = breakevens && breakevens.leaderId === L.id && Array.isArray(breakevens.rows) ? breakevens : null;
    if (be) {
      const nf = nearestFlips(be, 2);
      if (nf.length) s.push(req(`Breakevens: ${nf.map((f) => f.text).join('; ')}.`));
      else s.push(req(`Breakevens: none of the ${plural(be.competitors.length, 'competitor')} overtakes it on the ${plural(be.rows.length, 'driver')} tested, within their ranges.`));
      for (const f of nearestFlips(be, Infinity)) more.push(`${cap(f.text)} (${Math.round(f.distance * 100)} % of the driver's range from today's value).`);
    } else {
      s.push(opt('Breakevens have not been run for this result (Sensitivity tab).', 4));
      notRun.push('the breakevens');
    }
    add('change', 'What would change the answer', s, more);
  }

  // 6. Open flags on the leader.
  {
    const vis = visibleFlags(L, siteBeta).filter((f) => !f.assumed);
    const CATS = ['Permitting', 'Fuel and utilities', ...(siteBeta ? ['Site fit'] : [])];
    const resF = vis.filter((f) => f.category === 'Resilience' && f.severity !== 'info');
    const s = [req(`Resilience: ${RES_TEXT[L.resilience.status] || L.resilience.status}${resF.length ? ` (${resF.slice(0, 2).map((f) => shortFlag(f.message).replace(/: /g, ', ')).join('; ')}${resF.length > 2 ? `; and ${resF.length - 2} more` : ''})` : ''}.`)];
    for (const c of CATS) {
      const fs = vis.filter((f) => f.category === c && f.severity !== 'info');
      if (!fs.length) continue;
      const maj = fs.filter((f) => f.severity === 'major'), min = fs.filter((f) => f.severity === 'minor');
      let t;
      if (maj.length) t = `${maj.map((f) => shortFlag(f.message)).join('; ')}, ${maj.length === 1 ? 'a major flag' : `${maj.length} major flags`}${min.length ? `, and ${plural(min.length, 'minor flag')}` : ''}`;
      else t = min.length === 1 ? `${shortFlag(min[0].message)}, a minor flag` : plural(min.length, 'minor flag');
      t = t.replace(/: /g, ', ');
      s.push(maj.length ? req(`${c}: ${t}.`) : opt(`${c}: ${t}.`, 2));
    }
    const otherMajor = vis.filter((f) => f.severity === 'major' && f.category !== 'Resilience' && !CATS.includes(f.category));
    if (otherMajor.length) s.push(req(`Other major flags: ${otherMajor.map((f) => shortFlag(f.message).replace(/: /g, ', ')).join('; ')}.`));
    if (s.length === 1) s.push(req('No permitting or fuel flags.'));
    const more = vis.filter((x) => x.severity !== 'info').map((f) => `${f.category} (${f.severity}): ${f.message}`);
    // When the text is still too long with only required sentences, part 6 keeps its first sentence and this count.
    const rest = vis.filter((f) => f.severity !== 'info' && f.category !== 'Resilience');
    const nMaj = rest.filter((f) => f.severity === 'major').length, nMin = rest.length - nMaj;
    add('flags', 'Open flags on the leader', s, more, rest.length ? `Other flags: ${plural(nMaj, 'major flag')} and ${plural(nMin, 'minor flag')}, listed in More detail.` : null);
  }

  // 7. Inputs with most influence.
  {
    const s = [], more = [];
    if (tor) {
      const m = measureById(tor.measure === 'score' ? 'lcoe' : tor.measure);
      const reg = getRegistry();
      const conf = (r) => (reg[r.record] && reg[r.record].confidence) || 'C';
      const rows = sortRows(tor.allRows, m.id).filter((r) => r.measureSwing > 0)
        .sort((a, b) => b.measureSwing - a.measureSwing || CONF_ORDER[conf(a)] - CONF_ORDER[conf(b)] || (a.id < b.id ? -1 : 1));
      const fmt = (x) => (m.id === 'lcoe' ? perMWh(x) : m.id === 'npv' ? money(x) : `${sig(x)} ${m.unit}`);
      const ttpOf = (r) => Math.abs((r.high.ttpMetric ?? 0) - (r.low.ttpMetric ?? 0));
      // "Capex (every line)" → "capex": the short name in the summary (the full label is in the detail).
      const low = (t) => t.replace(/\s*\([^)]*\)$/, '').replace(/^[A-Z][a-z]/, (x) => x.toLowerCase());
      const ttpText = (r) => (ttpOf(r) >= 1 ? ` and time-to-power by up to ${sig(ttpOf(r), 2)} months` : '');
      if (rows.length) {
        const [a, b, c] = rows;
        s.push(req(`Of the ${plural(tor.allRows.length, 'input')} tested on #1, ${low(a.label)} (confidence ${conf(a)}) moves ${m.label} by up to ${fmt(a.measureSwing)}${ttpText(a)} across its range.`));
        if (b) s.push(opt(`Next: ${[b, c].filter(Boolean).map((r) => `${low(r.label)} (${conf(r)}), ${fmt(r.measureSwing)}${ttpText(r)}`).join('; ')}.`, 1));
      } else s.push(req(`None of the ${plural(tor.allRows.length, 'input')} tested on #1 moves its ${m.label}.`));
      more.push(`Ordered by the swing in ${m.label}; data confidence breaks ties (C, the least certain, first).`);
      for (const r of rows) more.push(`${r.label} (${r.recordLabel}, confidence ${conf(r)}): ${m.label} ${fmt(m.get(r.low))} at ${r.low.text}, ${fmt(m.get(r.high))} at ${r.high.text}.`);
    } else if (sensitivity && sensitivity.optionId) {
      const o = run.options.find((x) => x.id === sensitivity.optionId);
      s.push(req(`The last tornado was run on ${o ? `#${o.rank}` : 'another option'}, not on #1, so the inputs with most influence on the leader are not listed.`));
    } else s.push(req('The tornado has not been run on #1 (Sensitivity tab), so the inputs with most influence are not listed.'));
    if (!tor) notRun.push('the tornado on #1');
    add('inputs', 'Inputs with most influence', s, more);
  }

  // Fit the word limit: move optional sentences to the detail, the highest priority number first.
  const count = () => parts.reduce((a, p) => a + p.sentences.reduce((b, x) => b + wordCount(x.t), 0), 0) + wordCount(GUARDRAIL);
  const moved = [];
  const prios = [...new Set(parts.flatMap((p) => p.sentences.map((x) => x.p)).filter((x) => x > 0))].sort((a, b) => b - a);
  for (const pr of prios) {
    if (count() <= wordLimit) break;
    for (let i = parts.length - 1; i >= 0 && count() > wordLimit; i--) {
      const p = parts[i];
      for (let j = p.sentences.length - 1; j >= 0 && count() > wordLimit; j--) {
        if (p.sentences[j].p === pr) { p.more.unshift(p.sentences[j].t); moved.push(p.sentences[j].t); p.sentences.splice(j, 1); }
      }
    }
  }
  // Still over the limit with required sentences only (H5, M1: several major flags, a long option name): part 6 is
  // condensed to its first sentence and a count; then each part, from the last back, keeps only its first sentence
  // until the text fits. The sentences moved go to the detail.
  if (count() > wordLimit) {
    const fp = parts.find((p) => p.id === 'flags');
    if (fp && fp.condensed && fp.sentences.length > 1) {
      const gone = fp.sentences.slice(1).map((x) => x.t);
      fp.more.unshift(...gone); moved.push(...gone);
      fp.sentences = [fp.sentences[0], req(fp.condensed)];
    }
  }
  for (let i = parts.length - 1; i >= 0 && count() > wordLimit; i--) {
    const p = parts[i];
    while (p.sentences.length > 1 && count() > wordLimit) { const x = p.sentences.pop(); p.more.unshift(x.t); moved.push(x.t); }
  }
  const out = parts.map((p) => ({ id: p.id, heading: p.heading, text: p.sentences.map((x) => x.t).join(' ') }));
  const details = Object.fromEntries(parts.map((p) => [p.id, p.more]));
  const text = `${out.map((p) => `${p.heading}. ${p.text}`).join('\n')}\n${GUARDRAIL}`;
  return {
    title: SUMMARY_TITLE, leaderId: L.id, leaderName: L.name, comparedWith: cmp ? cmp.id : null,
    parts: out, details, guardrail: GUARDRAIL, text, words: count(), wordLimit, overLimit: count() > wordLimit, moved,
    weightChanges: wc, usedTornado: !!tor, usedBreakevens: !!(breakevens && breakevens.leaderId === L.id), usedMonteCarlo: !!mc, notBuilt, notRun,
  };
}

// The key of the result a summary describes: the inputs, the leader, the weights and scoring settings, and what the text
// drew on (the Site tab, a tornado and breakevens on the leader; H5, H1 and L6). A user note written for one key is shown
// as written for an earlier result when the key changes.
export function summaryKey(run, { siteBeta = false, usedTornado = false, usedBreakevens = false, usedMonteCarlo = false } = {}) {
  if (!run || !run.options || !run.options.length) return '';
  const L = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
  return `${run.inputHash || ''}|${L.id}|${SCORE_KEYS.map((k) => Math.round(run.scoring.weights[k] * 1000)).join(',')}|${run.inputs.settings.costMetric}|${run.inputs.settings.carbonMetric}|${run.inputs.settings.rankCompliantFirst ? 1 : 0}|s${siteBeta ? 1 : 0}|t${usedTornado ? 1 : 0}|b${usedBreakevens ? 1 : 0}|m${usedMonteCarlo ? 1 : 0}`;
}
