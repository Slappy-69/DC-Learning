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
//     linear in the weights and the axis ranges do not depend on them); breakevens are not built;
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
  if (wordCount(s) > 16) s = `${s.split(/\s+/).slice(0, 16).join(' ')}…`;
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

const RES_TEXT = { Meets: 'meets the requirement', 'Meets with flags': 'meets the requirement with flags', 'Does not meet': 'does not meet the requirement' };
const CONF_ORDER = { C: 0, B: 1, A: 2 };

// The summary of a run. opts.sensitivity: the last tornado result (sensitivity.js), used when it was run on the leader;
// opts.siteBeta: the Site tab (Beta) is on (site-fit flags are left out otherwise, and always in the PDF).
//
// Each part is a list of sentences; a sentence with a priority p > 0 is optional. When the text would pass the word
// limit, optional sentences are moved to the part's detail, the highest p first, until it fits; nothing is lost.
export function plainSummary(run, { sensitivity = null, siteBeta = false, wordLimit = SUMMARY_WORD_LIMIT } = {}) {
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
  const parts = [];
  const notBuilt = [];
  const add = (id, heading, sentences, more = []) => parts.push({ id, heading, sentences: sentences.filter((x) => x && x.t), more });
  const req = (t) => ({ t, p: 0 });
  const opt = (t, p) => ({ t, p });
  const vs = (k, f, a, b) => { const [x, y] = compactPair(...pair(f, a, b)); return `${f.tag ? `${f.tag} ` : ''}${x} against ${y}`; };

  // 1. Leading option.
  {
    const wText = SCORE_KEYS.map((k) => `${AXIS_NAME[k]} ${pct0(w[k])}`).join(', ');
    const ttp = L.ttp.metric < 0.05 ? 'power on time' : `time-to-power ${sig(L.ttp.metric, 3)} months late`;
    const more = [`Score ${L.score.toFixed(2)}; axis scores: ${SCORE_KEYS.map((k) => `${AXIS_NAME[k]} ${L.axisScores[k].toFixed(1)}`).join(', ')}.`,
      `NPV of net cost ${money(L.eco.npvCost)}; hourly carbon-free energy ${Math.round(L.carbon.cfePct * 100)} %; deliverability ${sig(L.deliv.score)} points.`];
    let range = null;
    if (tor) {
      const vals = [tor.base.lcoe, ...tor.allRows.flatMap((r) => [r.low.lcoe, r.high.lcoe])].filter(Number.isFinite);
      range = req(`With the ${plural(tor.allRows.length, 'tested input')} moved one at a time across their ranges, its LCOE is ${compactPair(perMWh(Math.min(...vals)), perMWh(Math.max(...vals))).join(' to ')}.`);
      more.push('That range is one input at a time (the tornado on the Sensitivity tab), not a joint range.');
    } else {
      range = opt('These are single values: Monte Carlo ranges are not built yet.', 4);
      notBuilt.push('ranges (Monte Carlo)');
    }
    if (settings.rankCompliantFirst) more.push('Requirement-compliant options are ranked first (run setting).');
    add('leader', 'Leading option', [
      req(`The option that leads under the current weights (${wText}${run.scoring.equalWeightsUsed ? ', equal because every weight was 0' : ''}) is #1, ${L.name}, with a score of ${L.score.toFixed(1)}.`),
      req(`LCOE ${perMWh(L.eco.lcoe)}${settings.costMetric === 'npv' ? ` (NPV of net cost ${money(L.eco.npvCost)})` : ''}, capex ${money(L.eco.capex)}, carbon ${sig(L.carbon.locationG)} g/kWh (location-based${settings.carbonMetric === 'market' ? `; market-based ${sig(L.carbon.marketG)}` : settings.carbonMetric === 'cfe' ? `; hourly CFE ${Math.round(L.carbon.cfePct * 100)} %` : ''}), ${ttp}.`),
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
        const pos = contrib.filter((x) => x.c > 0.005).sort((a, b) => b.c - a.c).slice(0, 3);
        const level = contrib.filter((x) => Math.abs(x.c) <= 0.005).map((x) => AXIS_NAME[x.k]);
        s.push(req(`It is ${pts(L.score - cmp.score)} points ahead of #${cmp.rank}${pos.length ? `, from ${list(pos.map((x) => `${AXIS_NAME[x.k]} (${vs(x.k, x.f, L, cmp)}, ${pts(x.c)} points)`))}` : ', a difference that rounds away on every axis'}.`));
        if (diffs.length) s.push(opt(`#${cmp.rank} differs in ${plural(diffs.length, 'choice')}, among them ${diffs[0].name.toLowerCase()}: ${diffs[0].value}.`, 3));
        if (level.length && pos.length) s.push(opt(`They are level on ${list(level)}.`, 4));
        more.push(`#${cmp.rank}: ${cmp.name} (score ${cmp.score.toFixed(2)}).`);
        if (diffs.length) more.push(`Choices of #${cmp.rank} that differ from #1: ${diffs.map((d) => `${d.id} ${d.name}: ${d.value}`).join('; ')}.`);
        for (const x of contrib) more.push(`${cap(AXIS_NAME[x.k])}: ${vs(x.k, x.f, L, cmp)}; weighted difference ${x.c >= 0 ? '+' : '−'}${pts(x.c)} points.`);
      } else if (cmp) s.push(req(`#${cmp.rank} and every option below it rank lower because ${settings.rankCompliantFirst ? 'they do not serve the load in every hour or do not meet the resilience requirement' : 'they do not serve the load in every hour'}.`));
    }
    add('why', 'Why it leads', s, more);

    const g = [], gMore = [];
    if (cmp && group.includes(cmp)) {
      const worse = SCORE_KEYS.map((k) => ({ k, c: w[k] * (L.axisScores[k] - cmp.axisScores[k]) })).filter((x) => x.c < -0.005);
      if (worse.length) g.push(req(`Against #${cmp.rank} it gives up ${list(worse.map((x) => `${AXIS_NAME[x.k]} (${vs(x.k, axisFigure(x.k, settings), L, cmp)}, ${pts(x.c)} points)`))}.`));
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
      g.push((g.length && i === 0) || i > 0 ? opt(`On ${AXIS_NAME[x.k]} it has ${a}; the best of the ${groupName}, #${x.best.rank}, has ${b}.`, 2)
        : req(`On ${AXIS_NAME[x.k]} it has ${a}; the best of the ${groupName}, #${x.best.rank}, has ${b}.`));
    });
    for (const x of bestOn.filter((y) => y.gap > 1e-9)) { const f = axisFigure(x.k, settings); const [a, b] = pair(f, L, x.best); gMore.push(`${cap(AXIS_NAME[x.k])}: ${a}; best of the ${groupName}: #${x.best.rank} ${x.best.name}, ${b} (axis score ${x.best.axisScores[x.k].toFixed(1)} against ${L.axisScores[x.k].toFixed(1)}).`); }
    const none = bestOn.every((x) => x.gap <= 1e-9)
      ? `It is the best of the ${groupName} on every axis, so it gives up nothing within this run.`
      : `On every axis it is within ${GAP} points (of 100) of the best of the ${groupName}.`;
    add('gives-up', 'What it gives up', g.length ? g : [req(none)], gMore);
  }

  // 4. Confidence.
  {
    const more = [];
    const close = group.filter((o) => o !== L && L.score - o.score <= 1 + 1e-12).length;
    const assumed = L.flags.filter((f) => f.assumed && f.path);
    const reg = Object.values(getRegistry());
    const unv = reg.filter((r) => r.label === LABEL).length;
    notBuilt.push('rank probability and the robust pick (Monte Carlo)');
    if (assumed.length) more.push(`Key inputs at their defaults: ${assumed.map((f) => f.message.replace(/^Assumed /, '').split(':')[0]).join('; ')}.`);
    const within = [0.1, 1, 5].map((d) => [d, group.filter((o) => o !== L && L.score - o.score <= d + 1e-12).length]);
    more.push(`Other ${groupName} close to the leader: ${within.map(([d, n]) => `${n.toLocaleString('en-GB')} within ${d} point${d === 1 ? '' : 's'}`).join(', ')}.`);
    add('confidence', 'Confidence', [
      req(close ? `${plural(close, `other ${kind}option`)} score${close === 1 ? 's' : ''} within 1 point of it.` : `No other ${kind}option scores within 1 point of it.`),
      opt('Rank probability and the robust pick are not built yet (no Monte Carlo).', 3),
      req(`It uses ${plural(assumed.length, 'key input')} left at ${assumed.length === 1 ? 'its default' : 'their defaults'}; ${unv.toLocaleString('en-GB')} of ${reg.length.toLocaleString('en-GB')} default records are ${LABEL}.`),
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
      s.push(req(`#${first.newLeader.rank} would lead if ${words(first)}, the other weights scaled in proportion.`));
      if (second) s.push(opt(`#${second.newLeader.rank} would lead if ${words(second)}.`, 2));
      for (const x of wc) more.push(`${cap(words(x))} (crossing at ${x.exactPct.toFixed(1)} %): #${x.newLeader.rank} ${x.newLeader.name} leads.`);
    } else s.push(req(group.length < 2 ? `No weight change alters the leader: it is the only one of the ${groupName}.` : 'No change of a single weight alters the leader.'));
    s.push(opt('Breakeven values are not built yet.', 4));
    notBuilt.push('breakevens');
    add('change', 'What would change the answer', s, more);
  }

  // 6. Open flags on the leader.
  {
    const vis = visibleFlags(L, siteBeta).filter((f) => !f.assumed);
    const CATS = ['Permitting', 'Fuel and utilities', ...(siteBeta ? ['Site fit'] : [])];
    const resF = vis.filter((f) => f.category === 'Resilience' && f.severity !== 'info');
    const s = [req(`Resilience: ${RES_TEXT[L.resilience.status] || L.resilience.status}${resF.length ? ` (${resF.map((f) => shortFlag(f.message)).join('; ')})` : ''}.`)];
    for (const c of CATS) {
      const fs = vis.filter((f) => f.category === c && f.severity !== 'info');
      if (!fs.length) continue;
      const maj = fs.filter((f) => f.severity === 'major'), min = fs.filter((f) => f.severity === 'minor');
      let t;
      if (maj.length) t = `${maj.map((f) => shortFlag(f.message)).join('; ')}, ${maj.length === 1 ? 'a major flag' : `${maj.length} major flags`}${min.length ? `, and ${plural(min.length, 'minor flag')}` : ''}`;
      else t = min.length === 1 ? `${shortFlag(min[0].message)}, a minor flag` : plural(min.length, 'minor flag');
      s.push(maj.length ? req(`${c}: ${t}.`) : opt(`${c}: ${t}.`, 2));
    }
    const otherMajor = vis.filter((f) => f.severity === 'major' && f.category !== 'Resilience' && !CATS.includes(f.category));
    if (otherMajor.length) s.push(req(`Other major flags: ${otherMajor.map((f) => shortFlag(f.message)).join('; ')}.`));
    if (s.length === 1) s.push(req('No permitting or fuel flags.'));
    const more = vis.filter((x) => x.severity !== 'info').map((f) => `${f.category} (${f.severity}): ${f.message}`);
    add('flags', 'Open flags on the leader', s, more);
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
    add('inputs', 'Inputs with most influence', s, more);
  }

  // Fit the word limit: move optional sentences to the detail, the highest priority number first.
  const count = () => parts.reduce((a, p) => a + p.sentences.reduce((b, x) => b + wordCount(x.t), 0), 0) + wordCount(GUARDRAIL);
  const moved = [];
  for (let pr = 4; pr >= 1 && count() > wordLimit; pr--) {
    for (let i = parts.length - 1; i >= 0 && count() > wordLimit; i--) {
      const p = parts[i];
      for (let j = p.sentences.length - 1; j >= 0 && count() > wordLimit; j--) {
        if (p.sentences[j].p === pr) { p.more.unshift(p.sentences[j].t); moved.push(p.sentences[j].t); p.sentences.splice(j, 1); }
      }
    }
  }
  const out = parts.map((p) => ({ id: p.id, heading: p.heading, text: p.sentences.map((x) => x.t).join(' ') }));
  const details = Object.fromEntries(parts.map((p) => [p.id, p.more]));
  const text = `${out.map((p) => `${p.heading}. ${p.text}`).join('\n')}\n${GUARDRAIL}`;
  return {
    title: SUMMARY_TITLE, leaderId: L.id, leaderName: L.name, comparedWith: cmp ? cmp.id : null,
    parts: out, details, guardrail: GUARDRAIL, text, words: count(), wordLimit, moved,
    weightChanges: wc, usedTornado: !!tor, notBuilt,
  };
}

// The key of the result a summary describes: the leader, its score and the weights. A user note written for one key is
// shown as written for an earlier result when the key changes.
export function summaryKey(run) {
  if (!run || !run.options || !run.options.length) return '';
  const L = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
  return `${run.inputHash || ''}|${L.id}|${SCORE_KEYS.map((k) => Math.round(run.scoring.weights[k] * 1000)).join(',')}|${run.inputs.settings.costMetric}|${run.inputs.settings.carbonMetric}|${run.inputs.settings.rankCompliantFirst ? 1 : 0}`;
}
