// The PDF report. Work package 10 (BRIEF §12.10) built it inputs first; work package 21 (owner 2026-11-02, "I want the
// app reports to look more like your reports … Everything really"; OPEN-QUESTIONS 141–146) rebuilt it in the layout of
// Claude's study report: the answer first, charts, short numbered sections in plain words, recommendations written by
// fixed rules, and the full inputs, defaults and tables in appendices.
//
//   front page (the answer, four headline figures, what decides it) · 1 the question and what was modelled · 2 power
//   need against grid supply (figure 1) · 3 the alternatives (figure 2) · 4 does it make financial sense? · 5 permitting,
//   land and resilience · 6 how robust is the answer? (figure 3) · 7 recommendations · 8 limits and what to do next ·
//   appendices A inputs · B defaults used · C ranked list · D compared options · E energy balance · F flags ·
//   G summary and method.
//
// The Site tab (Beta) is never included: no site plan, no site-fit figures, no site geometry inputs.
// Pure: built from the run and the view state handed in; no browser APIs.

import { PdfDoc, A4, INK, MUTED, ACCENT, FLAG, LINE, ORANGE, PALE, HEAD_FILL, textWidth, wrap, toWinAnsi } from './pdf.js';
const toWinAnsiSafe = (t) => toWinAnsi(t);
import { getRegistry, normalizeInputs, CHOICES, choiceLabel, LABEL, LABEL_SOURCED, REQUIRED_EXAMPLE, plantCandidates, PLANT_DEFAULTS, TECH, COUNTRIES } from '../engine/defaults.js';
import { PLANT_SOURCE } from '../engine/plants.js';
import { addMonths } from '../engine/dates.js';
import { NA } from '../engine/generator.js';
import { weatherSummary } from '../engine/weather.js';
import { topCards, cardOptions } from '../engine/cards.js';
import { measureById, sortRows } from '../engine/sensitivity.js';
import { plainSummary, summaryKey, shortFlag } from '../engine/summary.js';
import { isRealismOption, lateInfo, lateLine } from '../engine/labels.js';
import { nearestFlips, gridDateAt } from '../engine/breakeven.js';
import { itInstalledByMonth, gridCapByMonth, monthOf } from '../engine/context.js';
import { recommendations, gapFacts, runnerUp } from '../engine/recommend.js';
import { flagHeadline, inputName, inputApplies } from './plain.js';
import { noteText } from '../engine/flagnotes.js';
import { ensureDetail, detailIds } from '../engine/detail.js';
import { GUARDRAIL, sig, money, monthLabel, pct, perMWh, cur, displayCurrency } from '../format.js';

// Input sections in the order of the inputs panel; site geometry belongs to the Site tab (Beta) and is left out.
const SECTIONS = [
  ['project', 'Project'], ['site', 'Site (area and land)'], ['load', 'Load'], ['grid', 'Grid'], ['utilities', 'Utilities and PPA'], ['existing', 'Existing plant near the site (not in the list)'], ['plants', 'Existing gas plants near the site (bundled list)'],
  ['requirements', 'Requirements'], ['economics', 'Economics'], ['weights', 'Weights'], ['deliverability', 'Deliverability'], ['settings', 'Run settings'],
];
export const SITE_BETA_KEYS = ['site.boundary', 'site.setbackByEdge', 'site.heightZones', 'site.exclusions', 'site.poc', 'site.gasMain', 'site.access', 'site.receptors',
  'deliverability.siteFitPenalty', 'deliverability.siteFitFlagsPenalty', 'deliverability.siteFitNoFitPenalty'];
// Notes printed without their sentences about the Site tab (Beta) or site fit (AC 26; Haiku check H3, M2).
export const noSiteNote = (t) => String(t || '').split(/(?<=\.)\s+/).filter((x) => !/site tab|site[- ]fit|beta/i.test(x)).join(' ');

// The section headings, in order (tests and the bookmarks use them).
export const REPORT_SECTIONS = [
  '1 · The question and what was modelled', '2 · Power need against grid supply', '3 · The alternatives', '4 · Does it make financial sense?',
  '5 · Energy and carbon over the years', '6 · Permitting, land and resilience', '7 · How robust is the answer?', '8 · Recommendations', '9 · Limits of this report and what to do next',
  'Appendix A · Inputs', 'Appendix B · Defaults used', 'Appendix C · Ranked list', 'Appendix D · Compared options', 'Appendix E · Energy balance', 'Appendix F · Flags', 'Appendix G · Summary and method',
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function valueText(v) {
  if (v == null) return 'not set';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (typeof v === 'number') return !Number.isFinite(v) ? String(v) : Number.isInteger(v) ? String(v) : Number(v.toPrecision(6)).toLocaleString('en-GB', { maximumFractionDigits: 6 });
  if (Array.isArray(v)) {
    if (!v.length) return 'none';
    return v.map((x, i) => (x && typeof x === 'object' ? `${i + 1}: ${valueText(x)}` : valueText(x))).join('; ');
  }
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k} ${valueText(x)}`).join(', ');
  return String(v);
}

// Every input with its value and whether it was entered or a default (and the default's label).
export function inputRows(inputs) {
  const reg = getRegistry();
  const I = normalizeInputs(inputs);
  const out = [];
  for (const [sec, title] of SECTIONS) {
    const obj = I[sec];
    if (!obj || typeof obj !== 'object') continue;
    for (const [k, v] of Object.entries(obj)) {
      const path = `${sec}.${k}`;
      if (SITE_BETA_KEYS.includes(path)) continue;
      const r = reg[path];
      let status;
      const A = I.assumedInputs || {};
      if (path in REQUIRED_EXAMPLE) status = 'Entered (required)';
      else if (A[path]) status = `Default: ${A[path]}`;
      else if (path === 'assumedInputs') continue;
      else if (r && same(r.value, v)) status = `Default: ${r.label}${r.basis ? ` (${r.basis})` : ''}`;
      else status = 'Entered';
      out.push({ section: title, path, value: `${valueText(v)}${r && r.unit && typeof v === 'number' ? ` ${r.unit}` : ''}`, status, note: r && r.note ? noSiteNote(r.note) : '', isDefault: !!((r && same(r.value, v) && !(path in REQUIRED_EXAMPLE)) || A[path]) });
    }
  }
  // Hourly weather: one row (the 8,760-hour arrays are not printed).
  const ws = weatherSummary(I);
  out.push(ws
    ? { section: 'Weather', path: 'weather', value: ws.text, status: I.weather.source === 'station' ? 'Default: nearest NOAA station, chosen by the program' : 'Entered', note: '', isDefault: I.weather.source === 'station' }
    : { section: 'Weather', path: 'weather', value: 'synthetic country profile (made-up hourly temperatures)', status: 'Default: indicative — unverified (judgement)', note: 'Upload an EPW file (inputs section 1) to use measured weather.', isDefault: true });
  return out;
}

function choiceRows(inputs) {
  const I = normalizeInputs(inputs);
  return CHOICES.map((c) => {
    const st = I.choices[c.id] || {};
    const vals = (st.values || []).map((x) => choiceLabel(c.id, x)).join(', ');
    return [`${c.id} ${c.name}`, st.state || 'open', vals || '—'];
  });
}

const resText = (o) => (o.resilience ? o.resilience.status : '—');
const adeqText = (o) => (o.adequacy ? o.adequacy.status : '—');
const flagCount = (o, s) => o.flags.filter((f) => f.severity === s && !f.assumed).length;

// Energy balance of one dispatched year of an option (MWh).
export function energyBalance(o, yi = null) {
  const ys = o.dispatch && o.dispatch.years ? o.dispatch.years : [];
  if (!ys.length) return null;
  const y = ys[yi == null ? ys.length - 1 : yi];
  const firm = (y.plants || []).reduce((a, p) => a + (p.mwh || 0), 0);
  return {
    year: yi == null ? ys.length - 1 : yi,
    demand: y.demandMWh, grid: y.gridMWh, ppa: y.ppaDeliveredMWh, re: y.reUsedMWh, plant: firm,
    battery: y.bessDischargeMWh, flex: y.flexMWh, unmet: y.unmetMWh, curtail: y.curtailMWh,
  };
}
const mwh = (x) => (Number.isFinite(x) ? `${sig(x / 1000, 3)}` : '—');

// ---- Words and numbers used across the sections ----
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "2031-07" → "Jul 2031".
export const monthName = (ym) => { const [y, m] = String(ym).split('-').map(Number); return y && m ? `${MON[m - 1]} ${y}` : String(ym); };
const plural = (n, w, p = `${w}s`) => `${Number(n).toLocaleString('en-GB')} ${n === 1 ? w : p}`;
const listText = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const techName = (t) => (TECH[t] ? TECH[t].name : String(t || ''));
const lower = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const firstPart = (name) => String(name).split(' · ')[0];
// "Default: indicative — unverified (judgement)" → "Default (judgement)"; sourced defaults say so.
const shortStatus = (st) => {
  const t = String(st || '');
  if (!t.startsWith('Default')) return t;
  if (t.includes(LABEL_SOURCED)) return 'Default (sourced, not independently checked)';
  const m = /\(([^()]*)\)\s*$/.exec(t);
  return m ? `Default (${m[1]})` : /program/.test(t) ? 'Default (chosen by the program)' : 'Default';
};
const firstSentence = (t) => { const x = String(t || '').split(/(?<=\.)\s+/)[0]; return x.length > 170 ? `${x.slice(0, 167).replace(/\s+\S*$/, '')}…` : x; };

// On-site plant of an option in a few words: bridging, permanent, backup, solar and battery.
function plantText(o) {
  const s = o.sizing || {};
  const out = [];
  if (s.bridge && s.bridge.mw > 0) out.push(`bridge ${sig(s.bridge.mw, 3)} MW ${lower(techName(s.bridge.tech))}`);
  if (s.prime && s.prime.mw > 0) out.push(`prime ${sig(s.prime.mw, 3)} MW ${lower(techName(s.prime.tech))}`);
  if (s.backup && s.backup.mw > 0) out.push(`backup ${sig(s.backup.mw, 3)} MW ${lower(techName(s.backup.tech))}${s.backup.topology ? ` ${s.backup.topology}` : ''}`);
  if (s.solarMWp > 0.05) out.push(`PV ${sig(s.solarMWp, 2)} MWp`);
  if (s.bess && s.bess.mw > 0) out.push(`battery ${sig(s.bess.mw, 3)} MW / ${sig(s.bess.mwh, 3)} MWh`);
  return out.length ? out.join('; ') : 'grid only';
}
// The first major flag (else the first minor one) as a few words.
function mainIssue(o, start) {
  const fl = o.flags.filter((f) => !f.assumed && !f.siteFit);
  const f = fl.find((x) => x.severity === 'major') || fl.find((x) => x.severity === 'minor');
  return f ? `${f.severity === 'major' ? 'Major' : 'Minor'}: ${flagHeadline(f, start)}` : 'No major or minor flag';
}

// Nice axis ticks between lo and hi (about n of them).
function ticks(lo, hi, n = 5) {
  const span = hi - lo || Math.abs(hi) || 1;
  const raw = span / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => k >= raw) || raw;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { step, values: out };
}

// Month-by-month series for figure 1: IT handed over on the programme, the facility load at design (IT in use × the
// design PUE, plus any load outside the PUE) and the grid import available.
export function gapSeries(run) {
  const I = normalizeInputs(run.inputs);
  const g = gapFacts(run);
  const nT = (run.meta && run.meta.timelineMonths) || (run.ctx && run.ctx.nMonthsTimeline) || 12 * (I.economics.periodYears + 2);
  const grid = run.meta && run.meta.gridCap ? run.meta.gridCap.slice(0, nT) : run.ctx ? Array.from(run.ctx.gridCap.slice(0, nT)) : Array.from(gridCapByMonth(I, nT));
  const inst = itInstalledByMonth(I, nT);
  const perMWIT = (g ? g.peakPUE : I.load.pueMax) + (I.load.ancillaryFrac || 0);
  const phases = I.load.phases.map((p) => ({ m: monthOf(I, p.date), it: Number(p.itMW) }));
  const handed = Array.from({ length: nT }, (_, m) => phases.reduce((a, p) => a + (m >= p.m ? p.it : 0), 0));
  const design = Array.from(inst, (x) => x * perMWIT);
  const first = Math.min(...phases.map((p) => p.m)), last = Math.max(...phases.map((p) => p.m));
  const fullGrid = g && g.fullGridMonth != null ? g.fullGridMonth : last;
  const m0 = Math.max(0, Math.min(first, fullGrid) - 6);
  const m1 = Math.min(nT - 1, Math.max(last + (I.load.rampMonths || 0) + 12, fullGrid + 12, m0 + 24));
  return { m0, m1, handed, design, grid, perMWIT, first, last, fullGrid };
}

// Builds the report; returns { bytes, pages, sections }. view: { compareIds, sensitivity (a tornado result or null),
// sensitivityMeasure, created (Date), appVersion, summaryNote, breakevens, monteCarlo, details: { question,
// preparedFor, preparedBy } }.
export function buildReport(run0, view = {}) {
  const { compareIds = [], sensitivity = null, sensitivityMeasure = null, created = null, appVersion = '' } = view;
  // Work package 23: options outside the best 2,000 keep light records; rebuild those the report reads (the top 20, the
  // best of each of the first ten strategies, waiting for the grid, the cards and the compared options).
  const run = run0.options.some((o) => o.light) ? { ...run0 } : run0;
  if (run !== run0) {
    ensureDetail(run, detailIds(run, { topN: 20, extra: compareIds }));
    ensureDetail(run, cardOptions(run.options, 10).map((c) => c.o.id));
  }
  const details = view.details || {};
  const I = normalizeInputs(run.inputs);
  const start = (run.meta && run.meta.analysisStart) || I.project.analysisStart;
  const ml = (m) => (m == null ? 'not reached' : monthName(monthLabel(start, m)));
  const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
  const lead = ranked[0];
  const dateText = created instanceof Date ? created.toISOString().slice(0, 10) : '';
  const dateLong = created instanceof Date ? `${created.getUTCDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][created.getUTCMonth()]} ${created.getUTCFullYear()}` : '—';
  const doc = new PdfDoc({ title: `Energy strategy report: ${I.project.name}`, footer: `${I.project.name} · energy strategy screening study${dateText ? ` · ${dateLong}` : ''} · concept stage, indicative figures` });
  const sections = [];
  const H1 = (t, newPage = false) => { if (newPage && doc.y < A4.h - doc.m - 1) doc.newPage(); sections.push(t); doc.heading(t, 1); };
  const fig = { n: 0 };
  const P = (t, o = {}) => doc.prose(t, o);

  const be = view.breakevens && lead && view.breakevens.leaderId === lead.id ? view.breakevens : null;
  const mc = view.monteCarlo && view.monteCarlo.complete && lead && view.monteCarlo.leaderId === lead.id ? view.monteCarlo : null;
  const tor = sensitivity || null;
  const sm = plainSummary(run, { sensitivity: tor, breakevens: be, monteCarlo: mc, siteBeta: false });
  const rec = recommendations(run, { sensitivity: tor, breakevens: be, monteCarlo: mc });
  const g = gapFacts(run);
  const gs = gapSeries(run);
  const tcAll = topCards(run.options, 10);
  const cards = tcAll.cards;
  const tc5 = topCards(run.options, 5);
  const R = lead ? runnerUp(ranked) : null;
  const alts0 = () => { const a = cards.map((c) => c.o); if (Wref && !a.includes(Wref)) a.push(Wref); return a; };
  // The best option that waits for the grid: the reference for "what keeping the programme costs".
  const W = ranked.find((o) => o.v.C1 === 'wait') || null;
  const Wref = W && W !== lead ? W : null;
  const rows = inputRows(run.inputs);
  const rowOf = new Map(rows.map((r) => [r.path, r]));
  const reg = getRegistry();
  const allRecs = Object.values(reg);
  const unverified = allRecs.filter((r) => r.label === LABEL).length;
  const sourced = allRecs.filter((r) => r.label === LABEL_SOURCED).length;
  const defs = rows.filter((r) => r.isDefault);
  const W0 = run.scoring ? run.scoring.weights : I.weights;
  const wSum = W0.cost + W0.carbon + W0.ttp + W0.deliverability;
  const Wt = Object.fromEntries(['cost', 'carbon', 'ttp', 'deliverability'].map((k) => [k, wSum <= 1.01 ? W0[k] * 100 : (W0[k] / wSum) * 100]));
  const nAdeq = run.options.filter((o) => o.adequacy && o.adequacy.status === 'Adequate').length;
  const pueFlag = (run.runFlags || []).find((f) => f.id === 'pue-entered');
  const designT = pueFlag ? (/design temperature \(([-\d.]+) \u00b0C/.exec(pueFlag.message) || [])[1] : null;
  const country = COUNTRIES[(run.meta && run.meta.country) || (run.ctx && run.ctx.country)] || null;
  const ws = weatherSummary(I);
  const lastPhase = I.load.phases.length ? I.load.phases[I.load.phases.length - 1].date : start;

  // ---------------- Front page ----------------
  doc.kicker('Energy strategy screening study · concept stage');
  for (const l of wrap(I.project.name, doc.width, 22, true)) { doc.y -= 25; doc.text(doc.m, doc.y, l, 22, true, INK); }
  doc.y -= 8;
  const subtitle = details.question && String(details.question).trim()
    ? String(details.question).trim()
    : `Which energy strategy suits the ${sig(I.load.itMW, 3)} MW campus, what it costs and what decides it`;
  for (const l of wrap(subtitle, doc.width, 11.5, 'F1')) { doc.y -= 15; doc.text(doc.m, doc.y, l, 11.5, 'F1', INK); }
  doc.rule({ before: 12, after: 9 });
  doc.columns([
    [details.preparedFor ? `**Prepared for:** ${details.preparedFor}` : null, details.preparedBy ? `**Prepared by:** ${details.preparedBy}` : null, `**Date:** ${dateLong}`].filter(Boolean),
    [`**Basis:** concept-design energy strategy tool${run.engineVersion ? ` (engine ${run.engineVersion}${appVersion ? `, app ${appVersion}` : ''})` : ''}; ${run.options.length.toLocaleString('en-GB')} strategies screened hour by hour`, '**Status:** screening study; indicative figures, not for investment decisions'],
  ]);
  doc.rule({ before: 6, after: 12 });
  if (lead) {
    const late = lead.ttp.delayFull > 0 ? `, ${plural(Math.round(lead.ttp.delayFull), 'month')} after the programme` : ', on the programme';
    const gapS = g && g.temporary.months > 0
      ? ` The grid leaves a gap of up to ${sig(g.temporary.peakMW, 3)} MW at design for ${plural(g.temporary.months, 'month')} from ${ml(g.temporary.firstMonth)}${lead.sizing.bridge && lead.sizing.bridge.mw > 0 ? `, which the leader bridges with ${sig(lead.sizing.bridge.mw, 3)} MW of ${lower(techName(lead.sizing.bridge.tech))}` : ''}.`
      : g ? ' The grid import carries the design load in every month of the programme.' : '';
    const permS = g && g.permanent.months > 0 ? ` At full build the design load is above the grid import by up to ${sig(g.permanent.peakMW, 3)} MW for the life of the campus.` : '';
    const wS = Wref ? ` Against waiting for the grid (#${Wref.rank}), it costs ${money(Math.abs(lead.eco.npvCost - Wref.eco.npvCost), 3)} ${lead.eco.npvCost >= Wref.eco.npvCost ? 'more' : 'less'} in present value${Number.isFinite(Wref.ttp.fullLoadM) && Number.isFinite(lead.ttp.fullLoadM) && Wref.ttp.fullLoadM > lead.ttp.fullLoadM ? ` and reaches full load ${plural(Wref.ttp.fullLoadM - lead.ttp.fullLoadM, 'month')} earlier` : ''}.` : '';
    const rS = R && rec.items.some((x) => x.id === 'runner-up') ? ` #${R.rank} is close behind, ${(lead.score - R.score) < 0.995 ? (lead.score - R.score).toFixed(2) : sig(lead.score - R.score, 2)} points below it on the weighted score.` : '';
    const adeqS = lead.adequacy && lead.adequacy.adequate === false ? ' No option meets the power need in every hour, so this is the best of a set that falls short.' : '';
    P(`**The answer.** The leading option is **#1 ${lead.name}**. It supplies the campus at **${perMWh(lead.eco.lcoe, 3)}** with ${sig(lead.carbon.locationG, 3)} gCO2e/kWh and reaches full load in ${ml(lead.ttp.fullLoadM)}${late}; its capex is ${money(lead.eco.capex, 3)}.${gapS}${permS}${wS}${rS}${adeqS}`, { size: 10.5, lead: 1.45, gap: 12 });
    // Realism rebuild (2026-11-11; owner: "Building starts late, this will need to be highlighted though"): the IT the
    // leader powers, every late start with its building, months, new date and cause, and its buildability tier.
    if (isRealismOption(lead)) {
      const li = lateInfo(lead, start), en = lead.sizing.energise, d = lead.deliv;
      const itS = en.powered === en.buildings ? `all ${plural(en.buildings, 'building')} (${sig(en.poweredIT, 3)} MW IT)` : `${en.powered} of ${en.buildings} buildings (${sig(en.poweredIT, 3)} of ${sig(en.plannedIT, 3)} MW IT)`;
      const lateS = li.onPlan ? 'Every building starts on its planned date.' : `${li.late.length ? `**Late against the plan:** ${li.late.map(lateLine).join('. ')}.` : ''}${li.notBuilt ? ` **Not built:** building${li.notBuilt.to > li.notBuilt.from ? `s ${li.notBuilt.from} to ${li.notBuilt.to}` : ` ${li.notBuilt.from}`}: ${li.notBuilt.why}.` : ''}`;
      const tierS = d.tier === 'A' ? 'Tier A: buildable with no conditions beyond the standard consents.' : d.tier === 'B' ? `Tier B: buildable with ${plural(d.conditions.length, 'condition')}, each someone else's decision: ${d.conditions.map((c) => c.text).join('; ')}.` : `Tier C: unlikely to be built as it stands: ${d.unlikely.map((c) => c.text).join('; ')}.`;
      P(`**Against the plan.** The leading option powers ${itS}. ${lateS}`, { size: 10, lead: 1.4, gap: 6 });
      P(`**Buildability.** ${tierS}`, { size: 10, lead: 1.4, gap: 10 });
    }
    doc.tiles(frontTiles({ lead, g, Wref, gs, ml, I, lastPhase }));
    if (sm) {
      doc.heading('What decides it', 2);
      const order = ['why', 'gives-up', 'change', 'confidence', 'inputs'];
      const items = order.map((id) => sm.parts.find((p) => p.id === id)).filter((p) => p && p.text && !/^The tornado has not been run|^The last tornado was run on/.test(p.text)).map((p) => `**${p.heading}.** ${p.text}`);
      doc.list(items, { size: 9.5 });
    }
    const note = view.summaryNote && typeof view.summaryNote.text === 'string' ? view.summaryNote : null;
    if (note && !note.siteBeta) {
      doc.heading("Engineer's note (edited)", 2);
      if (sm && note.key !== summaryKey(run, { siteBeta: false, usedTornado: sm.usedTornado, usedBreakevens: sm.usedBreakevens, usedMonteCarlo: sm.usedMonteCarlo })) doc.para(`Written for an earlier result (leader then: ${note.leaderName || 'not recorded'}); the figures in this report are for this run.`, { size: 8.5, color: FLAG });
      for (const t of note.text.split(/\n+/)) P(t, { size: 9.5 });
      doc.para(`Edited ${String(note.editedAt || '').slice(0, 10)}.`, { size: 7.5, color: MUTED });
    } else if (note && note.siteBeta) doc.para('An edited summary note exists, but it was written with the Site tab (Beta) on, so it is left out of this report.', { size: 7.5, color: MUTED });
  }
  doc.para(GUARDRAIL, { size: 7.5, color: MUTED, gap: 2 });

  // ---------------- 1 · The question and what was modelled ----------------
  H1(REPORT_SECTIONS[0], true);
  if (details.question && String(details.question).trim()) P(`**The question.** ${String(details.question).trim()}`);
  const ph = I.load.phases;
  P(`**The campus.** ${sig(I.load.itMW, 4)} MW of IT in ${plural(ph.length, 'phase')} from ${monthName(ph[0] ? ph[0].date : start)} to ${monthName(lastPhase)}, on a site of ${sig(I.site.areaHa, 3)} ha at ${I.project.lat}, ${I.project.lon}${country ? ` (${country.name})` : ''}. The grid offers ${sig(I.grid.nowMW, 3)} MW of import now and ${sig(I.grid.fullMW, 3)} MW from ${monthName(I.grid.fullDate)}.`);
  P(`**What the tool did.** It built each strategy's plant, ran it hour by hour (8,760 hours a year) over ${I.economics.periodYears} years from ${monthName(start)} and scored it on cost (${sig(Wt.cost, 3)} %), carbon (${sig(Wt.carbon, 3)} %), time-to-power (${sig(Wt.ttp, 3)} %) and deliverability (${sig(Wt.deliverability, 3)} %). It screened ${run.options.length.toLocaleString('en-GB')}${run.generation ? ` of ${run.generation.totalCombinations.toLocaleString('en-GB')} possible` : ''} strategies; ${nAdeq.toLocaleString('en-GB')} meet the power need in every hour and rank first.`);
  {
    const st = (paths, names) => {
      const ds = paths.map((p, i) => [rowOf.get(p), names[i]]).filter(([r]) => r);
      const d = ds.filter(([r]) => r.isDefault);
      if (!d.length) return 'Entered';
      if (d.length === ds.length) return `Tool default (${LABEL})`;
      return `Entered; tool default for ${listText(d.map(([, n]) => n))}`;
    };
    const v = (p) => (rowOf.get(p) ? rowOf.get(p).value : '—');
    const byCountry = (p, unit) => { const x = getPathValue(I, p); return x === 'by country' || x == null ? 'country default' : `${sig(Number(x), 3)} ${unit}`; };
    const keyRows = [
      ['Site', `${sig(I.site.areaHa, 3)} ha at ${I.project.lat}, ${I.project.lon}${country ? `, ${country.name}` : ''}`, st(['site.areaHa', 'project.lat', 'project.country'], ['area', 'location', 'country profile'])],
      ['Weather', ws ? ws.text : `synthetic ${country ? country.name : 'country'} profile (made-up hourly temperatures)${designT ? `; design day ${designT} °C` : ''}`, rowOf.get('weather').isDefault ? `Tool default (${LABEL})` : 'Entered'],
      ['IT load and programme', `${sig(I.load.itMW, 4)} MW: ${ph.slice(0, 8).map((p) => `${sig(Number(p.itMW), 3)} MW in ${monthName(p.date)}`).join('; ')}${ph.length > 8 ? `; and ${ph.length - 8} more` : ''}`, st(['load.itMW', 'load.phases'], ['IT load', 'phasing'])],
      ['Load', `${I.load.shape} shape, ${pct(I.load.utilisation, 0)} average utilisation; each phase starts at ${pct(I.load.rampStart, 0)} and reaches full over ${plural(I.load.rampMonths, 'month')}`, st(['load.shape', 'load.utilisation', 'load.rampStart', 'load.rampMonths'], ['shape', 'utilisation', 'ramp start', 'ramp months'])],
      ['PUE', `annual ${sig(I.load.pueAnnual, 3)}, maximum ${sig(I.load.pueMax, 3)} at the design day${designT ? ` (${designT} °C)` : ''}; the hourly PUE follows the weather between them${I.load.ancillaryFrac ? `; plus ${pct(I.load.ancillaryFrac, 1)} of IT outside the PUE` : ''}`, st(['load.pueAnnual', 'load.pueMax'], ['annual PUE', 'maximum PUE'])],
      ['Grid', `${sig(I.grid.nowMW, 3)} MW now, ${sig(I.grid.fullMW, 3)} MW from ${monthName(I.grid.fullDate)}${I.grid.steps && I.grid.steps.length ? ` (${I.grid.steps.length} steps between)` : ''}; export ${sig(I.grid.exportMW, 3)} MW; connection charge ${money(I.grid.connectionCharge, 3)}`, st(['grid.nowMW', 'grid.fullMW', 'grid.fullDate', 'grid.connectionCharge'], ['import now', 'full import', 'full date', 'connection charge'])],
      ['Gas', `${({ yes: 'available', no: 'not available', unknown: 'availability not known' })[String(I.utilities.gasAvailable).toLowerCase()] || String(I.utilities.gasAvailable)}${Number(I.utilities.gasDateMonths) > 0 ? ` from ${ml(Number(I.utilities.gasDateMonths))}` : ''}; commodity price ${byCountry('utilities.gasPrice', '€/MWh')}`, st(['utilities.gasAvailable', 'utilities.gasDateMonths', 'utilities.gasPrice'], ['availability', 'date', 'price'])],
      ['Backup', `${pct(I.requirements.backedPct, 0)} of the facility at design, ${I.requirements.topology}, ${sig(I.requirements.autonomyH, 3)} h of fuel, ${sig(I.requirements.upsMin, 3)} min UPS`, st(['requirements.backedPct', 'requirements.topology', 'requirements.autonomyH', 'requirements.upsMin'], ['share backed', 'topology', 'autonomy', 'UPS'])],
      ['Prices and carbon', `grid price ${sig(I.grid.priceMultiplier, 3)} × the country profile, network adder ${byCountry('grid.priceAdder', '€/MWh')}; carbon price ${byCountry('economics.carbonPrice', '€/t')}; electricity price escalation ${pct(I.economics.elecEscalation, 1)} a year (real)`, st(['grid.priceMultiplier', 'grid.priceAdder', 'economics.carbonPrice', 'economics.elecEscalation'], ['grid price', 'network adder', 'carbon price', 'escalation'])],
      ['Economics', `${I.economics.periodYears} years from ${monthName(start)}, ${pct(I.economics.wacc, 1)} real discount rate, ${pct(I.economics.contingency, 0)} contingency; costs in ${displayCurrency().code === 'EUR' ? 'euro' : `${displayCurrency().code} at ${displayCurrency().rate} per euro`}`, st(['economics.periodYears', 'economics.wacc', 'economics.contingency', 'project.analysisStart'], ['period', 'WACC', 'contingency', 'start'])],
    ];
    doc.table([{ label: 'Input', w: 0.8 }, { label: 'Value used', w: 2.6 }, { label: 'Basis', w: 1.3 }], keyRows, { size: 7.8, headSize: 7.8, zebra: false, headFill: HEAD_FILL });
    doc.caption(`Every input, with its value and whether it was entered or left at the tool's default, is in Appendix A; the ${defs.length} defaults used are in Appendix B. Every default is labelled "${LABEL}" until it is researched.`);
  }

  // ---------------- 2 · Power need against grid supply ----------------
  H1(REPORT_SECTIONS[1], true);
  if (g) {
    const t = g.temporary, pm = g.permanent;
    const s1 = t.months > 0
      ? `With the programme kept, the first ${sig(Number(ph[0].itMW), 3)} MW of IT is handed over in ${monthName(ph[0].date)} and the grid carries the design load from ${ml(g.fullGridMonth)}. For ${plural(t.months, 'month')} from ${ml(t.firstMonth)} the facility load at design is above the grid import, by up to ${sig(t.peakMW, 3)} MW in ${ml(t.peakMonth)}: that is the gap to bridge or to wait out.`
      : 'The grid import carries the facility load at design in every month of the programme: there is no gap to bridge before the full connection.';
    const s2 = pm.months > 0 ? ` After the full connection the design load at full build (${sig(g.designMW, 3)} MW) is above the grid import (${sig(g.fullGridMW, 3)} MW) by up to ${sig(pm.peakMW, 3)} MW: a permanent shortfall that on-site plant has to cover.` : ` At full build the design load is ${sig(g.designMW, 3)} MW against ${sig(g.fullGridMW, 3)} MW of grid import (${g.fullGridMW > 0 ? `${sig(Math.max(0, 1 - g.designMW / g.fullGridMW) * 100, 2)} % headroom` : 'no grid'}).`;
    P(s1 + s2);
  }
  fig.n++;
  doc.space(8);
  doc.figure(230, (x0, y0, w, h) => drawGap(doc, gs, start, x0, y0, w, h, g));
  doc.caption(`Figure ${fig.n}. IT handed over on the programme (blue), the facility load at design (orange: IT in use × maximum PUE ${sig(gs.perMWIT, 3)}, each phase ramping as entered) and the grid import available (dashed). The shaded area is the gap.`);
  if (g && g.gridMatched && g.gridMatched.length) {
    P('If the programme waited for the grid instead, each phase could be energised only when the grid alone carries the cumulative design load:', { gap: 5 });
    doc.table([{ label: 'Phase', w: 0.45 }, { label: 'IT, cumulative', w: 0.8, align: 'right' }, { label: 'Design load', w: 0.8, align: 'right' }, { label: 'Programme', w: 0.8 }, { label: 'Grid alone carries it from', w: 1.2 }, { label: 'Delay', w: 0.7, align: 'right' }],
      g.gridMatched.map((x) => [String(x.phase), `${sig(x.cumITMW, 3)} MW`, `${sig(x.designMW, 3)} MW`, ml(x.plannedMonth), x.gridMonth == null ? 'never within the study' : ml(x.gridMonth), x.delayMonths == null ? '—' : plural(x.delayMonths, 'month')]), { size: 7.8, headSize: 7.8, zebra: false, headFill: HEAD_FILL });
  }

  {
    const rowsT = timelineRows(alts0(), lead, Wref);
    if (rowsT.length) {
      doc.ensure(120 + rowsT.reduce((a, r) => a + r.h, 0));
      P(`**What drives the dates.** Figure ${fig.n + 1} sets the programme beside the grid and the on-site plant of each strategy: when its plant could be ready (the tool orders it from day one and allows its permits and delivery) and when the programme needs it.`, { gap: 5 });
      fig.n++;
      doc.figure(32 + rowsT.reduce((a, r) => a + r.h, 0), (x0, y0, w, h) => drawTimeline(doc, rowsT, gs, I, start, x0, y0, w, h));
      doc.caption(`Figure ${fig.n}. Programme timeline. Diamonds: IT handovers. Grid: light until the full connection, dark after it. Each strategy: a thin line while its plant is being permitted and delivered, a thick bar once it is ready (orange bridging, blue permanent, grey backup); a tick where the programme needs it (red when the plant is late); a dot at full load.`);
    }
  }

  // ---------------- 3 · The alternatives ----------------
  H1(REPORT_SECTIONS[2], true);
  const alts = cards.map((c) => c.o);
  if (Wref && !alts.includes(Wref)) alts.push(Wref);
  const ref = Wref || lead;
  P(`The best-ranked option of each distinct strategy (grid approach, bridging, permanent on-site generation and backup), skipping options with the same results as a better-ranked one. Figure ${fig.n + 1} shows what each costs against ${Wref ? `waiting for the grid (#${Wref.rank}, the best option that does)` : 'the leader'}, as the present value of net cost over ${I.economics.periodYears} years.`);
  fig.n++;
  doc.figure(Math.max(120, alts.length * 21 + 40), (x0, y0, w, h) => drawAlternatives(doc, alts, ref, lead, x0, y0, w, h));
  doc.caption(`Figure ${fig.n}. Present value of net cost of each strategy's best option minus that of ${Wref ? 'waiting for the grid' : 'the leader'} (${I.economics.periodYears} years at ${pct(I.economics.wacc, 1)} real). The leading option is the dark bar.${Wref ? ' A strategy that keeps the programme supplies more energy in the early years, so part of its extra cost buys energy the waiting option does not supply.' : ''}`);
  doc.table([{ label: 'Option', w: 1.9 }, { label: 'On-site plant', w: 1.5 }, { label: 'LCOE', w: 0.6, align: 'right' }, { label: 'Carbon g/kWh', w: 0.55, align: 'right' }, { label: 'Full load', w: 0.6 }, { label: 'Main issue', w: 1.6 }, { label: 'Rank', w: 0.4, align: 'right' }],
    alts.map((o) => [`${o === lead ? '**' : ''}${o.name}${o === lead ? '** (leading)' : ''}${o === Wref ? ' (waiting for the grid)' : ''}`, plantText(o), perMWh(o.eco.lcoe, 3), sig(o.carbon.locationG, 3), ml(o.ttp.fullLoadM), mainIssue(o, start), `#${o.rank}`]),
    { size: 7, headSize: 7.5, zebra: false, highlight: new Set([alts.indexOf(lead)]), headFill: HEAD_FILL });
  doc.caption(`LCOE: present value of all energy costs ÷ present value of energy supplied. Carbon: location-based, Scope 1 and 2. Rank: the tool's, out of ${run.options.length.toLocaleString('en-GB')}; the full list is in Appendix C.`);

  // ---------------- 4 · Does it make financial sense? ----------------
  H1(REPORT_SECTIONS[3], true);
  if (lead) {
    const e = lead.eco;
    P(`The leader's present value of net cost over ${I.economics.periodYears} years is **${money(e.npvCost, 3)}**: ${money(e.pvCapex, 3)} of capex (${pct(e.pvCapex / e.npvCost, 0)}) and ${money(e.pvOpex, 3)} of running costs, energy, fuel and carbon. That gives an LCOE of ${perMWh(e.lcoe, 3)}. Its capex is ${money(e.capex, 3)}, between ${money(e.capexLow, 2)} and ${money(e.capexHigh, 2)} on the capex range, or ${money(e.capexPerMWIT, 3)} per MW of IT.`);
    if (Wref) {
      const d = lead.eco.npvCost - Wref.eco.npvCost;
      const dMWm = (Wref.ttp.gapMWm || 0) - (lead.ttp.gapMWm || 0);
      const itMWm = dMWm / gs.perMWIT;
      P(`**Against waiting for the grid.** The best option that waits (#${Wref.rank}, ${Wref.name}) has a present value of net cost of ${money(Wref.eco.npvCost, 3)}, so the leader costs ${money(Math.abs(d), 3)} ${d >= 0 ? 'more' : 'less'}${Number.isFinite(Wref.ttp.fullLoadM) && Wref.ttp.fullLoadM > lead.ttp.fullLoadM ? ` and reaches full load ${plural(Wref.ttp.fullLoadM - lead.ttp.fullLoadM, 'month')} earlier` : ''}.${d > 0 && itMWm > 1 ? ` Waiting leaves about ${Math.round(itMWm).toLocaleString('en-GB')} MW-months of IT without power at design; keeping the programme costs about ${money(d / itMWm, 3)} per MW-month of IT handed over on time. If the value of earlier IT to the customer is above that, keeping the programme pays for itself.` : ''}`);
    }
    // Capex of the leader by line.
    const by = new Map();
    for (const c of e.capexLines || []) by.set(c.item, (by.get(c.item) || 0) + c.amount);
    const lines = [...by.entries()].sort((a, b) => b[1] - a[1]);
    const tot = lines.reduce((a, [, x]) => a + x, 0);
    const top = lines.slice(0, 9);
    const rest = lines.slice(9).reduce((a, [, x]) => a + x, 0);
    const bu = [lead, R, Wref].filter((o, k, arr) => o && arr.indexOf(o) === k && costBuildUp(o));
    if (bu.length) {
      fig.n++;
      doc.figure(60 + bu.length * 34, (x0, y0, w, h) => drawBuildUp(doc, bu, lead, Wref, x0, y0, w, h));
      doc.caption(`Figure ${fig.n}. What makes up the LCOE (present value of each cost ÷ present value of energy supplied, ${I.economics.periodYears} years at ${pct(I.economics.wacc, 1)} real), for the leader${R ? `, #${R.rank}` : ''}${Wref && Wref !== R ? ` and waiting for the grid (#${Wref.rank})` : ''}. Grid import includes the network charges and levies. The parts add up to each option's LCOE, from the same ledger.`);
    }
    doc.heading("The leader's capex", 2);
    doc.table([{ label: 'Item', w: 2.6 }, { label: 'Capex', w: 0.8, align: 'right' }, { label: 'Share', w: 0.6, align: 'right' }],
      [...top.map(([k, x]) => [k, money(x, 3), pct(x / e.capex, 0)]), ...(rest > 0 ? [[`Other (${lines.length - 9} lines)`, money(rest, 3), pct(rest / e.capex, 0)]] : []), ...(e.capex - tot > 1 ? [[`Contingency (${pct(I.economics.contingency, 0)})`, money(e.capex - tot, 3), pct((e.capex - tot) / e.capex, 0)]] : []), ['**Total**', `**${money(e.capex, 3)}**`, '100 %']],
      { size: 7.8, headSize: 7.8, zebra: false, headFill: HEAD_FILL });
  }
  const periods = cards.length && cards[0].o.eco.byPeriod ? cards[0].o.eco.byPeriod.map((p) => p.years) : [];
  doc.heading('Cost of each strategy over each evaluation period', 2);
  doc.table([{ label: 'Option', w: 2.2 }, { label: 'Capex', align: 'right' }, ...(periods.length ? periods : [I.economics.periodYears]).flatMap((y) => [{ label: `LCOE ${y} yr`, align: 'right' }, { label: `NPV ${y} yr`, align: 'right' }])],
    cards.slice(0, 6).map((c) => [`#${c.o.rank} ${firstPart(c.o.name)}`, money(c.o.eco.capex, 3), ...(periods.length ? periods : [I.economics.periodYears]).flatMap((y) => { const p = (c.o.eco.byPeriod || []).find((q) => q.years === y); return p ? [perMWh(p.lcoe, 3), money(p.npvCost, 3)] : [perMWh(c.o.eco.lcoe, 3), money(c.o.eco.npvCost, 3)]; })]),
    { size: 7, headSize: 7, zebra: false, highlight: new Set([0]), headFill: HEAD_FILL });
  doc.caption(`NPV of net cost: present value of capex, running costs, energy, fuel and carbon less any revenue. The ${I.economics.periodYears}-year period sets the ranking. Every figure comes from the same yearly cash-flow ledger.`);

  // ---------------- 5 · Energy and carbon over the years ----------------
  H1(REPORT_SECTIONS[4], true);
  if (lead) {
    const ys = ((lead.dispatch && lead.dispatch.years) || []).map((y, k) => ({ k, y })).filter(({ y }) => (y.demandMWh || 0) > 0);
    const last = ys.length ? ys[ys.length - 1].y : null;
    if (last) {
      const plant = (last.plants || []).reduce((a, q) => a + (q.mwh || 0), 0);
      const sh = (x) => pct((x || 0) / last.demandMWh, 0);
      P(`**Where the energy comes from.** Once every phase is at full load the leader takes ${sh(last.gridMWh)} of its energy from the grid, ${sh(last.ppaDeliveredMWh)} from the PPA, ${sh(last.reUsedMWh)} from on-site solar and wind and ${sh(plant)} from on-site plant${last.unmetMWh > 0 ? `, and leaves ${sh(last.unmetMWh)} unserved` : ''}. Figure ${fig.n + 1} shows each modelled year; later years repeat the last one.`);
      fig.n++;
      doc.figure(200, (x0, y0, w, h) => drawMix(doc, ys, start, x0, y0, w, h));
      doc.caption(`Figure ${fig.n}. Energy supplied to the leader each modelled year (GWh), by source. On-site plant covers bridging, permanent and backup plant on primary hours; the battery's discharge is shown separately.`);
    }
    const series = [lead, R, Wref].filter((o, k, arr) => o && arr.indexOf(o) === k).map((o) => ({ o, pts: carbonByYear(o) })).filter((x) => x.pts.length > 1);
    if (series.length) {
      const pl = series[0].pts, a0 = pl[0], a1 = pl[pl.length - 1];
      P(`**Carbon.** The leader's location-based carbon goes from ${sig(a0.g, 3)} gCO2e/kWh in its first year with load to ${sig(a1.g, 3)} gCO2e/kWh in year ${a1.k + 1} of the evaluation period, as the grid decarbonises and its on-site plant ${lead.sizing.bridge && lead.sizing.bridge.mw > 0 && lead.v.C3 === 'remove' ? 'leaves the site' : 'runs less or keeps running'}. Over the period it averages ${sig(lead.carbon.locationG, 3)} gCO2e/kWh; its hourly carbon-free energy is ${pct(lead.carbon.cfePct, 0)}.`);
      fig.n++;
      doc.figure(190, (x0, y0, w, h) => drawCarbon(doc, series, lead, start, x0, y0, w, h));
      doc.caption(`Figure ${fig.n}. Location-based carbon intensity (Scope 1 and 2) each year of the evaluation period, for the leader${R ? `, #${R.rank}` : ''}${Wref && Wref !== R ? ` and waiting for the grid (#${Wref.rank})` : ''}.`);
    }
  }

  // ---------------- 6 · Permitting, land and resilience ----------------
  H1(REPORT_SECTIONS[5], true);
  if (lead) {
    const fl = lead.flags.filter((f) => !f.assumed && !f.siteFit && (f.severity === 'major' || f.severity === 'minor'));
    const nMaj = fl.filter((f) => f.severity === 'major').length;
    P(`**The leader.** Resilience: ${lower(resText(lead))}; power adequacy: ${lower(adeqText(lead))}. It carries ${plural(nMaj, 'major flag')} and ${plural(fl.length - nMaj, 'minor flag')}${fl.length ? ', listed below by subject' : ''}. Flags never hide, demote or resize an option.`);
    const ORDER = ['Permitting', 'Site', 'Resilience', 'Fuel and utilities', 'Grid', 'Technology', 'Targets and ceilings', 'Generation', 'Existing plant', 'Load', 'Adequacy', 'Model', 'Data', 'Design check'];
    const rank = (c) => { const i = ORDER.indexOf(c); return i < 0 ? ORDER.length : i; };
    const sorted = fl.slice().sort((a, b) => rank(a.category) - rank(b.category) || (a.severity === b.severity ? 0 : a.severity === 'major' ? -1 : 1));
    if (sorted.length) doc.list(sorted.map((f) => `**${f.category || 'Other'} (${f.severity}).** ${flagHeadline(f, start)}.`), { size: 9.5 });
    if (sorted.length) doc.caption('Each flag in a line; the full wording, with its thresholds and caveats, is in Appendix F.', { gap: 6 });
    P('**Land.** The Site tab (Beta) is not part of this report, so whether the plant and buildings fit the site is not checked here; land flags raised without the site plan are in the list above.', { size: 9.5 });
    // Realism rebuild (2026-11-11): the plan check, the leader's conditions and standard consents, and the country's rules.
    if (isRealismOption(lead)) {
      if (run.planCheck) {
        doc.heading('Plan check', 2);
        P(`Can the phasing plan be met at all? Worked out over every screened option. Latest acceptable start: ${plural(run.planCheck.allowanceM, 'month')} after a building's planned date.`, { size: 9.5 });
        doc.list(run.planCheck.items.map((i) => `${i.severity === 'major' ? '**Check.** ' : i.severity === 'minor' ? '**Note.** ' : ''}${i.text}`), { size: 9 });
        doc.table([{ label: 'Building', w: 0.5 }, { label: 'MW IT', w: 0.5, align: 'right' }, { label: 'Planned', w: 0.6 }, { label: 'Earliest start, any option', w: 1 }, { label: 'Months late', w: 0.6, align: 'right' }, { label: 'What holds it', w: 2.6 }],
          run.planCheck.buildings.map((b) => [String(b.building), sig(b.itMW, 3), b.planned, b.earliest || 'no option powers it', b.late == null ? '-' : String(b.late), b.reason || '-']), { size: 7.8, headSize: 7.8 });
      }
      doc.heading("The leader's conditions and consents", 2);
      const d = lead.deliv;
      const lines = [...d.unlikely.map((x) => `**Unlikely.** ${x.text}.${x.source ? ` Source: ${x.source}.` : ''}`), ...d.conditions.map((x) => `**Condition.** ${x.text}.${x.source ? ` Source: ${x.source}.` : ''}`), ...d.standard.map((x) => `**Standard consent.** ${x.text}.`)];
      if (lines.length) doc.list(lines, { size: 9 }); else P('No conditions and no standard consents were found by the tests.', { size: 9.5 });
      doc.caption('Buildability tests are a screening view: not a planning, permitting or legal determination.', { gap: 6 });
      if (run.countryRules && run.countryRules.rules.length) {
        doc.heading(`Rules for data centres to check in ${run.countryRules.country}`, 2);
        P(`${run.countryRules.note} Found on ${run.countryRules.accessed}; ${run.countryRules.label}.`, { size: 9 });
        doc.list(run.countryRules.rules.map((x) => `**${x.status[0].toUpperCase()}${x.status.slice(1)}.** ${x.text}${x.applies ? ` ${x.applies}` : ''} Source: ${x.source}.`), { size: 8.5 });
      }
    }
    const others = alts.filter((o) => o !== lead).slice(0, 6);
    if (others.length) {
      doc.heading('The main issue of each other strategy', 2);
      doc.list(others.map((o) => `**#${o.rank} ${firstPart(o.name)}.** ${mainIssue(o, start)}.`), { size: 9 });
    }
  }

  // ---------------- 7 · How robust is the answer? ----------------
  H1(REPORT_SECTIONS[6], true);
  if (sm) {
    const ch = sm.parts.find((p) => p.id === 'change');
    if (ch && ch.text) P(`**What would change the answer.** ${ch.text}`);
    const cf = sm.parts.find((p) => p.id === 'confidence');
    if (cf && cf.text) P(`**Confidence.** ${cf.text}`);
  }
  doc.heading('Sensitivity (tornado)', 2);
  if (!tor) P('The sensitivity test (tornado) was not run for this report. Run it in the Sensitivity tab, then make the report again to include it.', { color: MUTED });
  else {
    const m = measureById(sensitivityMeasure || tor.measure);
    const srows = sortRows(tor.allRows, m.id).slice(0, tor.topN);
    const fmt = (x) => (!Number.isFinite(x) ? 'not finite' : m.id === 'npv' ? money(x, 4) : m.id === 'lcoe' ? perMWh(x, 4) : m.id === 'carbon' ? `${sig(x, 3)} g/kWh` : sig(x, 4));
    P(`#${tor.optionRank} ${firstPart(tor.optionName)}: ${m.label} at each driver's low and high value, everything else held; base ${fmt(m.get(tor.base))}. ${tor.totalDrivers} drivers tested; largest swing first. Ranges are registry records, ${LABEL}.`, { size: 9.5 });
    const vals = [m.get(tor.base), ...srows.flatMap((r) => [m.get(r.low), m.get(r.high)])].filter(Number.isFinite);
    if (vals.length > 1) {
      fig.n++;
      doc.figure(Math.max(60, srows.length * 18 + 30), (x0, y0, w, h) => drawTornado(doc, srows, m, tor, fmt, x0, y0, w, h));
      doc.caption(`Figure ${fig.n}. ${m.label} of #${tor.optionRank} at each driver's low value (light bar) and high value (dark bar); the dashed line is today's value.`);
    }
    doc.table([{ label: 'Driver', w: 1.6 }, { label: 'Low' }, { label: m.label }, { label: 'High' }, { label: m.label }, { label: 'Score low · high', w: 1.1 }],
      srows.map((r) => [r.label, r.low.text, fmt(m.get(r.low)), r.high.text, fmt(m.get(r.high)), `${sig(r.low.score, 4)} · ${sig(r.high.score, 4)}`]), { size: 7.3, headSize: 7.3, zebra: false, headFill: HEAD_FILL });
  }
  doc.heading('Breakevens', 2);
  if (!be) P('The breakeven table was not run for this report. Run it in the Sensitivity tab, then make the report again to include it.', { color: MUTED });
  else {
    const nf = nearestFlips(be, 3);
    P(nf.length ? `**Nearest tipping points.** ${nf.map((f) => f.text).join('; ')}.` : "No flip within the drivers' ranges: the leader stays ahead of every competitor on every driver.");
    doc.caption(`The value of each driver, nearest its current value, at which the leader (#1) and a competitor swap places ("no flip" within the driver's range otherwise). Competitors: #2, then the best option of each other strategy; drivers: the ${be.rows.length} that move the leader's weighted score most. Each side of the current value is checked at its middle and its end and the first change of order narrowed to ${Math.round(be.tolerance * 100)} % of the range (whole-number drivers: to 1); a swap that reverses between two checked points is not seen.${be.baseModel === 'full-year re-run' ? " The run used the representative-day screening tier, so today's values of the leader and the competitors were re-run over the full year, as every other point is." : ''}`, { gap: 6 });
    const cell = (r, c, side) => { const f = c.flips[side]; return !f ? 'no flip' : r.id === 'grid-date' ? `${f.text} (${gridDateAt(be, f.at)})` : f.text; };
    doc.table([{ label: 'Driver (range)', w: 1.7 }, ...be.competitors.map((c) => ({ label: `#${c.rank}`, w: 1 }))],
      be.rows.map((r) => [`${r.label} (${r.lowText} to ${r.highText}${r.widened ? ', widened to include the value entered' : ''})`, ...r.cells.map((c) => `${r.id === 'grid-date' ? 'earlier' : 'lower'}: ${cell(r, c, 'down')}; ${r.id === 'grid-date' ? 'later' : 'higher'}: ${cell(r, c, 'up')}`)]), { size: 6.8, headSize: 7.3, zebra: false, headFill: HEAD_FILL });
    doc.bullets(be.competitors.map((c) => `#${c.rank} ${c.name}`), { size: 7.5 });
  }
  doc.heading('Uncertainty (Monte Carlo)', 2);
  if (!mc) P('The Monte Carlo was not run for this report. Run it in the Sensitivity tab, then make the report again to include it.', { color: MUTED });
  else {
    const pc = (x) => `${Math.round(x * 100)} %`;
    const lr = mc.rows.find((r) => r.id === mc.leaderId), rb = mc.rows.find((r) => r.id === mc.robustPickId);
    P(`${mc.samples.toLocaleString('en-GB')} Latin hypercube samples (seed ${mc.seed}) of ${mc.drivers.length} inputs drawn together, each triangular between its low and high value around the current one; grid and gas price correlated, and the capex factors. The ${mc.rows.length} leading options re-run in each sample with ${mc.screening ? 'representative-day' : 'full-year'} dispatch and put in the ranking's order. **#1 leads in ${pc(lr.pRank1)} of samples** and is in the top three in ${pc(lr.pTop3)}; the robust pick (most often within ${Math.round(mc.band * 100)} % of the best score) is #${rb.rank}${rb.id === lr.id ? ', the leader itself' : ` (within the band in ${rb.nRobust} of ${mc.samples.toLocaleString('en-GB')} samples, against ${lr.nRobust} for #1)`}.${mc.screening ? ' Representative-day dispatch makes adequacy and the order of the options approximate: now and then a full-year run would put a different option first in a sample.' : ''}${mc.drivers.some((d) => d.widened) ? ` Inputs entered outside their record's range were sampled over a widened range: ${mc.drivers.filter((d) => d.widened).map((d) => d.label).join('; ')}.` : ''}`, { size: 9.5 });
    doc.table([{ label: 'Option', w: 0.6 }, { label: 'Leads · top 3', w: 1 }, { label: `Within ${Math.round(mc.band * 100)} %`, w: 0.8 }, { label: 'LCOE P10 · P50 · P90', w: 1.9 }, { label: 'Carbon P50', w: 0.8 }, { label: 'Full load P10 – P90', w: 1.5 }, { label: 'Adequate', w: 0.7 }],
      mc.rows.map((r) => [`#${r.rank}`, `${pc(r.pRank1)} · ${pc(r.pTop3)}`, `${(r.pRobust * 100).toFixed(1)} %`, `${perMWh(r.lcoe.p10)} · ${perMWh(r.lcoe.p50)} · ${perMWh(r.lcoe.p90)}`, `${sig(r.carbon.p50, 3)} g/kWh`,
        r.fullLoadM.n ? `${monthLabel(start, Math.round(r.fullLoadM.p10))} – ${monthLabel(start, Math.round(r.fullLoadM.p90))}` : 'not reached', pc(r.pAdequate)]), { size: 7, headSize: 7.5, zebra: false, headFill: HEAD_FILL });
  }

  // ---------------- 8 · Recommendations ----------------
  H1(REPORT_SECTIONS[7], true);
  doc.caption(rec.note, { size: 8, gap: 8 });
  doc.list(rec.items.map((x) => x.text), { numbered: true, size: 9.8, lead: 1.4, gap: 4 });

  // ---------------- 9 · Limits and what to do next ----------------
  H1(REPORT_SECTIONS[8], true);
  const limits = [
    `**Concept stage.** ${GUARDRAIL}`,
    `**Defaults.** ${plural(defs.length, 'input')} of this run use the tool's default (Appendix B). The registry holds ${allRecs.length} records: ${unverified} are "${LABEL}" and ${sourced} "${LABEL_SOURCED}". None is presented as verified.`,
    ws ? `**Weather.** ${ws.text}.` : `**Weather.** A synthetic hourly year from the ${country ? country.name : 'country'} profile, not measured weather; the hourly PUE, the design day and solar output follow it.`,
    '**Site.** The Site tab (Beta) is not part of this report: the layout, land take and site fit of each option are not checked here.',
  ];
  if (sm && sm.notBuilt && sm.notBuilt.length) limits.push(`**Not modelled yet.** ${sm.notBuilt.join('; ')}.`);
  if (sm && sm.notRun && sm.notRun.length) limits.push(`**Not run for this report.** ${sm.notRun.join('; ')}.`);
  if (tcAll.identical && tcAll.identical.size) limits.push(`**Options with the same results.** ${plural(tcAll.identical.size, 'option')} give exactly the same figures as a better-ranked one; they are marked in Appendix C.`);
  limits.push(`**What to do next.** Work through the recommendations in section 8, replace the defaults that matter with project figures${!tor || !be || !mc ? ', run the tests not yet run' : ''}, and make the report again. Take the leading strategies to specialists (grid, permitting, plant suppliers) before any design or investment decision.`);
  doc.list(limits, { size: 9.5 });

  // ---------------- Appendix A · Inputs ----------------
  H1(REPORT_SECTIONS[9], true);
  const applies = rows.filter((r) => r.path === 'weather' || inputApplies(r.path, I));
  doc.para(`The ${applies.length} inputs that apply to this run, with their values and whether you entered them or the tool used its default (and the default's basis). Inputs that do not apply (for example the AI load settings with a daily load shape) and the program's own settings are left out; the study file (Save study) keeps every input. Site geometry belongs to the Site tab (Beta) and is not listed.`, { size: 8.5 });
  for (const [, title] of SECTIONS) {
    const rs = applies.filter((r) => r.section === title);
    if (!rs.length) continue;
    doc.heading(title, 3);
    doc.table([{ label: 'Input', w: 1.5 }, { label: 'Value', w: 1.9 }, { label: 'Entered or default', w: 1.1 }], rs.map((r) => [inputName(r.path), r.value, shortStatus(r.status)]), { size: 7.2, headSize: 7.5, headFill: HEAD_FILL });
  }
  {
    const wr = rows.find((r) => r.path === 'weather');
    doc.heading('Weather', 3);
    doc.table([{ label: 'Input', w: 1.5 }, { label: 'Value', w: 1.9 }, { label: 'Entered or default', w: 1.1 }], [[inputName(wr.path), wr.value, shortStatus(wr.status)]], { size: 7.2, headSize: 7.5, headFill: HEAD_FILL });
  }
  // Existing gas plants near the site (work package 19): each with its values and where they came from.
  {
    const pc = plantCandidates(I).all.filter((p) => !p.manual);
    if (I.plants && I.plants.auto !== false) {
      doc.heading('Existing gas plants found near the site', 3);
      const B = { list: 'list', default: 'default', type: 'by type', entered: 'entered', none: 'not known' };
      doc.para(pc.length
        ? `Every gas plant of ${PLANT_DEFAULTS.minMW} MW or more within ${PLANT_DEFAULTS.radiusKm} km of the site, from the bundled list (${PLANT_SOURCE.credit}, ${PLANT_SOURCE.url}; built ${PLANT_SOURCE.builtAt}). Values in brackets say where each came from; check every one with the plant's owner.`
        : `No gas plant of ${PLANT_DEFAULTS.minMW} MW or more within ${PLANT_DEFAULTS.radiusKm} km of the site in the bundled list (${PLANT_SOURCE.credit}).`, { size: 8.5 });
      if (pc.length) doc.table([{ label: 'Plant', w: 1.3 }, { label: 'km', w: 0.35 }, { label: 'MW (units)', w: 0.9 }, { label: 'First year · closes', w: 1.1 }, { label: 'In the analysis', w: 1.6 }],
        pc.map((p) => [`${p.name}${p.mergedFrom.length ? ` (merged with ${p.mergedFrom.map((m) => m.name).join(', ')})` : ''}`, p.km.toFixed(1),
          `${Math.round(p.mw)} (${B[p.basis.mw]}); ${p.units} × ${Math.round(p.unitMW)} (${B[p.basis.units]})`,
          `${p.firstYear ?? '—'} (${B[p.basis.firstYear]}) · ${p.closeYear ?? '—'} (${p.basis.closeYear === 'default' ? `${PLANT_DEFAULTS.lifeYears} years` : B[p.basis.closeYear]})`,
          !p.include ? (p.dataCentre && !(I.plants.edits && I.plants.edits[p.id] && I.plants.edits[p.id].include === false) ? 'left out: probably a data centre\'s own plant' : 'left out by the engineer') : [p.offersPower ? 'power, leased or bought' : null, p.offersTakeover ? `grid connection from ${addMonths(I.project.analysisStart, p.takeoverM)}` : null].filter(Boolean).join('; ') || 'nothing within the study']), { size: 7, headSize: 7.5, headFill: HEAD_FILL });
    }
  }
  doc.heading('Technology choices generated', 3);
  doc.table([{ label: 'Choice', w: 1.5 }, { label: 'State', w: 0.6 }, { label: 'Values generated', w: 2.4 }], choiceRows(run.inputs), { size: 7, headSize: 7.5, headFill: HEAD_FILL });

  // ---------------- Appendix B · Defaults used ----------------
  H1(REPORT_SECTIONS[10], true);
  doc.para(`${defs.length} inputs use the tool's default; each is marked "Default" in Appendix A. The registry holds ${allRecs.length} records (inputs, technology, cost, carbon, spatial and run settings): ${unverified} are "${LABEL}" and ${sourced} are "${LABEL_SOURCED}" (researched, with source, year and link, not checked by an independent person). None is presented as verified. The full registry is in the user guide's appendix.`, { size: 8.5 });
  if (lead) {
    const ka = lead.flags.filter((f) => f.assumed && f.path && String(f.id).startsWith('assumed:'));
    doc.heading('Key inputs the leader takes from the defaults', 3);
    if (ka.length) doc.table([{ label: 'Key input', w: 1.4 }, { label: 'Value and basis', w: 3.4 }], ka.map((f) => { const m = /^Assumed (.+?): (.*)$/.exec(f.message) || [null, inputName(f.path), f.message]; return [m[1], m[2]]; }), { size: 7.3, headSize: 7.5, zebra: false, headFill: HEAD_FILL });
    else doc.para('None: every key input was entered.', { size: 8.5, color: MUTED });
  }

  // ---------------- Appendix C · Ranked list ----------------
  H1(REPORT_SECTIONS[11], true);
  doc.para(`${run.options.length.toLocaleString('en-GB')} options were modelled hour by hour and ranked by the weighted score: cost ${sig(Wt.cost, 3)} %, carbon ${sig(Wt.carbon, 3)} %, time-to-power ${sig(Wt.ttp, 3)} %, deliverability ${sig(Wt.deliverability, 3)} % (cost measured as ${I.settings.costMetric === 'npv' ? 'NPV' : 'LCOE'}, carbon ${I.settings.carbonMetric}-based). Options that meet the power need in every hour (power adequacy) rank first: ${nAdeq.toLocaleString('en-GB')} of ${run.options.length.toLocaleString('en-GB')} are adequate.`, { size: 8.5 });
  if (lead) doc.para(`Leader: #${lead.rank} ${lead.name}, score ${sig(lead.score, 4)}, LCOE ${perMWh(lead.eco.lcoe, 3)}, ${sig(lead.carbon.locationG, 3)} gCO2e/kWh (location-based), full load ${monthLabel(start, lead.ttp.fullLoadM)}.`, { size: 9, bold: true });
  doc.heading('Top five strategies', 3);
  doc.para(`The best-ranked option of each distinct strategy, skipping options with the same results as a better-ranked one. Pros and cons are judged ${tc5.comparison}.`, { size: 8, color: MUTED });
  for (const c of tc5.cards) {
    const o = c.o;
    doc.ensure(110);
    doc.para(`#${o.rank} ${o.name}`, { bold: true, size: 9.5, gap: 2 });
    doc.table([{ label: 'Score' }, { label: `LCOE ${cur().trim()}/MWh` }, { label: 'Capex' }, { label: 'Carbon g/kWh' }, { label: 'First power' }, { label: 'Full load' }, { label: 'Resilience' }, { label: 'Adequacy' }],
      [[sig(o.score, 4), sig(o.eco.lcoe * displayCurrency().rate, 3), money(o.eco.capex, 3), sig(o.carbon.locationG, 3), monthLabel(start, o.ttp.firstPowerM), monthLabel(start, o.ttp.fullLoadM), resText(o), adeqText(o)]], { size: 7.3, headSize: 7.3, zebra: false, headFill: HEAD_FILL });
    if (c.pros.length) doc.bullets(c.pros.map((p) => `Pro: ${p.text}`), { size: 8 });
    if (c.cons.length) doc.bullets(c.cons.map((p) => `Con: ${p.text}`), { size: 8 });
    const major = c.majorFlags.filter((f) => !f.siteFit);
    doc.para(major.length ? `Main flags: ${major.slice(0, 4).map((f) => f.message.split(':')[0].split('.')[0]).join(' · ')}${major.length > 4 ? ` · +${major.length - 4} more` : ''}` : 'No major flags.', { size: 8, color: major.length ? FLAG : MUTED, gap: 8 });
  }
  doc.heading('Ranked list (top 20)', 3);
  doc.table([{ label: '#', w: 0.3, align: 'right' }, { label: 'Option', w: 3 }, { label: 'Score', w: 0.55, align: 'right' }, { label: `LCOE ${cur().trim()}/MWh`, w: 0.55, align: 'right' }, { label: 'Capex', w: 0.7, align: 'right' }, { label: 'g/kWh', w: 0.55, align: 'right' }, { label: 'Full load', w: 0.75 }, { label: 'Adequate', w: 0.6 }],
    ranked.slice(0, 20).map((o) => [String(o.rank), `${o.name}${tcAll.identical.has(o.id) ? ' (same results as a better-ranked option)' : ''}`, sig(o.score, 4), sig(o.eco.lcoe * displayCurrency().rate, 3), money(o.eco.capex, 3), sig(o.carbon.locationG, 3), monthLabel(start, o.ttp.fullLoadM), o.adequacy && o.adequacy.status === 'Adequate' ? 'yes' : 'no']), { size: 6.8, headSize: 7.3, headFill: HEAD_FILL });
  doc.ensure(330); // keep the heading, its line and the chart together
  doc.heading('Trade-offs: cost against carbon', 3);
  doc.para('Cost (LCOE, up) against carbon (location-based, across) for every option. Filled dots are adequate options, hollow dots are not; the top five are numbered by rank.', { size: 8.5 });
  drawScatter(doc, run, tc5);

  // ---------------- Appendix D · Compared options ----------------
  H1(REPORT_SECTIONS[12], true);
  const cmp = compareIds.map((id) => run.options.find((o) => o.id === id)).filter(Boolean);
  if (!cmp.length) doc.para('No options were chosen for comparison when the report was made (tick "Compare" on a card or use "Add to compare").', { size: 9, color: MUTED });
  else {
    const figs = [
      ['Rank', (o) => `#${o.rank}`], ['Weighted score', (o) => sig(o.score, 4)], ['Power adequacy', adeqText],
      ['LCOE', (o) => perMWh(o.eco.lcoe)], ['NPV of net cost', (o) => money(o.eco.npvCost, 3)], ['Capex', (o) => money(o.eco.capex, 3)],
      ['Carbon, location-based', (o) => `${sig(o.carbon.locationG)} g/kWh`], ['Carbon, market-based', (o) => `${sig(o.carbon.marketG)} g/kWh`], ['Hourly CFE', (o) => pct(o.carbon.cfePct)],
      ['First power · full load', (o) => `${monthLabel(start, o.ttp.firstPowerM)} · ${monthLabel(start, o.ttp.fullLoadM)}`], ['Deliverability', (o) => sig(o.deliv.score, 2)], ['Resilience', resText],
      ['Flags (major · minor · info)', (o) => `${flagCount(o, 'major')} · ${flagCount(o, 'minor')} · ${flagCount(o, 'info')}`],
    ];
    doc.table([{ label: 'Figure', w: 1.2 }, ...cmp.map((o) => ({ label: `#${o.rank} ${o.name}`, w: 1.4 }))], figs.map(([l, f]) => [l, ...cmp.map(f)]), { size: 7.3, headSize: 7.3, boldFirst: true, headFill: HEAD_FILL });
    const diff = CHOICES.filter((c) => new Set(cmp.map((o) => o.v[c.id])).size > 1);
    doc.heading('Choices on which they differ', 3);
    if (diff.length) doc.table([{ label: 'Choice', w: 1.2 }, ...cmp.map((o) => ({ label: `#${o.rank}`, w: 1.4 }))], diff.map((c) => [`${c.id} ${c.name}`, ...cmp.map((o) => (o.v[c.id] === NA ? 'n/a' : choiceLabel(c.id, o.v[c.id])))]), { size: 7.3, headSize: 7.3, headFill: HEAD_FILL });
    else doc.para('The options share every choice.', { size: 9 });
  }

  // ---------------- Appendix E · Energy balance ----------------
  H1(REPORT_SECTIONS[13]);
  doc.para('Where each top-five option gets its energy in the last modelled year (steady state, every phase at full load) and in the first year, in GWh. Plant is on-site generation (bridging, permanent and backup on primary hours); flexibility is load turned down; unmet is demand not served. Hour-by-hour charts are in the Dispatch tab.', { size: 8.5 });
  for (const which of ['last', 'first']) {
    const er = tc5.cards.map((c) => {
      const ys = (c.o.dispatch && c.o.dispatch.years) || [];
      const yi = which === 'last' ? null : Math.max(0, ys.findIndex((y) => y.demandMWh > 0));
      return [c.o, energyBalance(c.o, yi)];
    }).filter(([, b]) => b);
    const yr = (b) => `model year ${b.year + 1}, from ${monthLabel(start, 12 * b.year)}`;
    doc.heading(which === 'last' ? `Last modelled year, steady state${er.length ? ` (${yr(er[0][1])})` : ''}` : 'First year with load (each option, see the first column)', 3);
    doc.table([{ label: 'Option', w: 2.2 }, { label: 'Demand', align: 'right' }, { label: 'Grid', align: 'right' }, { label: 'PPA', align: 'right' }, { label: 'On-site RE', align: 'right' }, { label: 'Plant', align: 'right' }, { label: 'Battery', align: 'right' }, { label: 'Flex', align: 'right' }, { label: 'Unmet', align: 'right' }],
      er.map(([o, b]) => [`#${o.rank} ${o.name}${which === 'first' ? ` (${yr(b)})` : ''}`, mwh(b.demand), mwh(b.grid), mwh(b.ppa), mwh(b.re), mwh(b.plant), mwh(b.battery), mwh(b.flex), mwh(b.unmet)]), { size: 6.8, headSize: 7.3, headFill: HEAD_FILL });
  }

  // ---------------- Appendix F · Flags ----------------
  H1(REPORT_SECTIONS[14], true);
  doc.para('Every flag on the leader, and the major and minor flags of the other four top strategies, in the full wording of the tool. Flags never hide, demote or resize an option (the one exception agreed by the owner: power-adequate options rank first). Site-fit flags (Site tab, Beta) are not listed.', { size: 8.5 });
  for (const c of tc5.cards) {
    const fl = c.o.flags.filter((f) => !f.siteFit && (c.o === lead || f.severity !== 'info'));
    doc.heading(`#${c.o.rank} ${c.o.name}`, 3);
    if (!fl.length) { doc.para('No flags.', { size: 8.5, color: MUTED }); continue; }
    const order = { major: 0, minor: 1, info: 2 };
    doc.table([{ label: 'Severity', w: 0.55 }, { label: 'Category', w: 0.8 }, { label: 'Flag', w: 3.6 }], fl.slice().sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3)).map((f) => [f.originalSeverity && f.originalSeverity !== f.severity ? `${f.severity} (was ${f.originalSeverity})` : f.severity, f.category || '', noteText(f) ? `${f.message} ${noteText(f)}` : f.message]), { size: 6.8, headSize: 7.3, headFill: HEAD_FILL });
  }
  if (run.runFlags && run.runFlags.length) {
    doc.heading('Run notes', 3);
    doc.bullets(run.runFlags.map((f) => f.message), { size: 7.8 });
  }

  // ---------------- Appendix G · Summary and method ----------------
  H1(REPORT_SECTIONS[15], true);
  if (sm) {
    doc.heading('Summary as generated', 3);
    doc.para("Written by fixed templates from this run's figures, without a language model; the app's Options tab shows the same text.", { size: 8, color: MUTED });
    for (const p of sm.parts) { doc.ensure(36); doc.para(p.heading, { bold: true, size: 9, gap: 1 }); doc.para(p.text, { size: 8.5 }); }
    doc.para(sm.guardrail, { size: 8.5, bold: true, gap: 8 });
    doc.para(`The detail behind each part is on the Options tab. The flags of the leader are listed in full in Appendix F.${sm.notBuilt.length ? ` Not built yet, so not in the summary: ${sm.notBuilt.join('; ')}.` : ''}${sm.notRun.length ? ` Not run for this report: ${sm.notRun.join('; ')}.` : ''}`, { size: 7.5, color: MUTED });
  }
  doc.heading('Method', 3);
  doc.bullets([
    'Generation: every combination of the technology choices allowed by the compatibility rules, sampled above the generation cap with the archetypes always included.',
    'Sizing and dispatch: each option is sized from the design-day load and dispatched hour by hour (8,760 hours) for each year until its supply stops changing; later years repeat the last modelled year.',
    'Load: IT in use × the hourly PUE, which follows the weather between the annual and the maximum PUE entered; the design load is IT × the maximum PUE.',
    'Economics: one yearly cash-flow ledger per option gives the LCOE, the NPV and every cost breakdown (real terms, at the WACC).',
    'Carbon: location-based and market-based Scope 1 and 2, and hourly carbon-free energy (a PPA counts only against grid energy used in the same hour).',
    'Time-to-power: first power and full load from the programme of each technology (ordered from day one, with a six-month permitting allowance for plant that needs significant environmental permitting); the axis counts the months late against the phasing plan (first power against phase 1, full load against the last phase) plus half the power gap in months of design load. Rented bridging plant is hired a month before it is first needed.',
    'Ranking: power-adequate options first, then by the weighted score of the four axes, each scaled 0-100 across the run.',
    'Recommendations (section 8): fixed rules from the run\'s figures (the leader, a runner-up within 3 points or 2 % of LCOE, the bridging plant, the grid margin, the major flags, the key inputs left at default, the nearest breakeven, a more robust Monte Carlo pick, measured weather and tests not run); no judgement.',
    `Profiles: ${run.profileLabel || 'synthetic hourly profiles'}.`,
    `Run settings: generation cap ${I.settings.generationCap}; grid handling "${I.settings.gridHandling}"; run-hour handling "${I.settings.runHourHandling}"; evaluation period ${I.economics.periodYears} years; WACC ${pct(I.economics.wacc, 1)}.`,
    `Report: inputs fingerprint ${run.inputHash || '—'}; engine ${run.engineVersion || '—'}${appVersion ? `, app ${appVersion}` : ''}; made on this computer with no network connection.`,
  ], { size: 8 });
  doc.para(GUARDRAIL, { size: 8.5, bold: true });

  const bytes = doc.bytes({ created });
  return { bytes, pages: doc.pages.length, sections };
}

// A value at a dotted path of the inputs.
function getPathValue(I, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), I); }

// ---- Figures ----

// Figure 1: IT handed over, facility load at design and grid import by month, with the gap shaded.
function drawGap(doc, gs, start, x0, y0, w, h, g = null) {
  const { m0, m1, handed, design, grid } = gs;
  const L = 38, B = 30, T = 14, R = 8;
  const pw = w - L - R, ph = h - B - T;
  let ymax = 0;
  for (let m = m0; m <= m1; m++) ymax = Math.max(ymax, design[m] || 0, grid[m] || 0, handed[m] || 0);
  const tk = ticks(0, ymax * 1.08 || 1, 5);
  const yTop = tk.values[tk.values.length - 1] >= ymax ? tk.values[tk.values.length - 1] : ymax * 1.08;
  const X = (m) => x0 + L + ((m - m0) / (m1 + 1 - m0)) * pw;
  const Y = (v) => y0 + B + (v / yTop) * ph;
  for (const v of tk.values) {
    doc.line(x0 + L, Y(v), x0 + L + pw, Y(v), { color: [0.91, 0.905, 0.89], lw: 0.4 });
    doc.labelRight(x0 + L - 4, Y(v) - 2.4, sig(v, 3), 6.8, 'F1', MUTED);
  }
  doc.label(x0 + L - 18, y0 + h - 8, 'MW', 6.8, 'F1', MUTED);
  // x labels: January of each year (every six months on a short window).
  const span = m1 + 1 - m0;
  const every = span <= 42 ? 6 : 12;
  const p = String(start).split('-').map(Number);
  for (let m = m0; m <= m1 + 1; m++) {
    const mm = ((p[1] - 1 + m) % 12 + 12) % 12;
    if (mm % every !== 0) continue;
    doc.line(X(m), y0 + B, X(m), y0 + B - 3, { color: MUTED, lw: 0.5 });
    doc.labelCentre(X(m), y0 + B - 11, monthName(addMonths(start, m)), 6.8, 'F1', MUTED);
  }
  doc.line(x0 + L, y0 + B, x0 + L + pw, y0 + B, { color: MUTED, lw: 0.6 });
  // Gap: where the design load is above the grid import.
  for (let m = m0; m <= m1; m++) {
    const d = design[m] || 0, gr = grid[m] || 0;
    if (d > gr + 1e-6) doc.rect(X(m), Y(gr), X(m + 1) - X(m), Y(d) - Y(gr), { fill: [0.98, 0.86, 0.79] });
  }
  const step = (arr) => { const pts = []; for (let m = m0; m <= m1; m++) { const v = arr[m] || 0; pts.push([X(m), Y(v)], [X(m + 1), Y(v)]); } return pts; };
  doc.path(step(grid), { stroke: INK, lw: 0.9, dash: [3, 2] });
  doc.path(step(handed), { stroke: ACCENT, lw: 1.4 });
  doc.path(step(design), { stroke: ORANGE, lw: 1.4 });
  // Call-outs: the bridging gap and a permanent shortfall.
  const callout = (m, v, text) => {
    const px = X(m), py = Y(v);
    const tw = textWidth(toWinAnsiSafe(text), 6.8, 'F2');
    const tx = Math.min(Math.max(x0 + L + 4, px - tw / 2), x0 + L + pw - tw - 4), ty = Math.min(py + 26, y0 + h - T - 4);
    doc.line(px, py + 2, px, ty - 3, { color: INK, lw: 0.5 });
    doc.rect(tx - 3, ty - 3.5, tw + 6, 11, { fill: [1, 1, 1] });
    doc.label(tx, ty, text, 6.8, 'F2', INK);
  };
  if (g && g.temporary && g.temporary.months > 0 && g.temporary.peakMonth >= m0 && g.temporary.peakMonth <= m1) callout(g.temporary.peakMonth + 0.5, design[g.temporary.peakMonth] || 0, `${g.temporary.months}-month gap: up to ${sig(g.temporary.peakMW, 3)} MW at design`);
  if (g && g.permanent && g.permanent.months > 0) {
    const pmM = Math.min(m1, Math.max(m0, g.permanent.peakMonth));
    callout(pmM - (m1 - m0) * 0.12, design[Math.max(m0, Math.min(m1, Math.round(pmM - (m1 - m0) * 0.12)))] || 0, `Permanent shortfall: up to ${sig(g.permanent.peakMW, 3)} MW`);
  }
  // Legend, lower right.
  const lx = x0 + L + pw - 190, ly = y0 + B + 10;
  doc.rect(lx - 6, ly - 6, 192, 42, { fill: [1, 1, 1], stroke: [0.88, 0.87, 0.84], lw: 0.4 });
  [[ORANGE, null, 'Facility load at design (IT in use × maximum PUE)'], [ACCENT, null, 'IT handed over (programme)'], [INK, [3, 2], 'Grid import available']].forEach(([c, dash, t], i) => {
    const yy = ly + 26 - i * 11;
    doc.line(lx, yy + 2, lx + 16, yy + 2, { color: c, lw: 1.3, dash });
    doc.label(lx + 21, yy, t, 6.6, 'F1', INK);
  });
}

// Figure 2: present value of net cost of each strategy against the reference, as horizontal bars.
function drawAlternatives(doc, alts, ref, lead, x0, y0, w, h) {
  const L = 205, R = 52, T = 6, B = 26;
  const d = alts.map((o) => o.eco.npvCost - ref.eco.npvCost);
  let lo = Math.min(0, ...d), hi = Math.max(0, ...d);
  if (hi - lo < 1) { hi = 1; lo = -1; }
  const pad = (hi - lo) * 0.04;
  lo -= lo < 0 ? pad : 0; hi += pad;
  const G = 8, pw = w - L - R - G;
  const X = (v) => x0 + L + G + ((v - lo) / (hi - lo)) * pw;
  const rowH = (h - B - T) / alts.length;
  const tk = ticks(lo, hi, 5);
  for (const v of tk.values) {
    if (v < lo - 1e-9 || v > hi + 1e-9) continue;
    doc.line(X(v), y0 + B, X(v), y0 + h - T, { color: [0.91, 0.905, 0.89], lw: 0.4 });
    doc.labelCentre(X(v), y0 + B - 10, v < 0 ? `−${money(-v, 2)}` : money(v, 2), 6.6, 'F1', MUTED);
  }
  doc.line(X(0), y0 + B, X(0), y0 + h - T, { color: INK, lw: 0.7 });
  alts.forEach((o, i) => {
    const yc = y0 + h - T - (i + 0.5) * rowH;
    const lab = wrap(`#${o.rank} ${firstPart(o.name)}`, L - 10, 6.8, o === lead ? 'F2' : 'F1');
    const ls = lab.length > 2 ? [lab[0], `${lab[1].replace(/\s*\S{0,2}$/, '')}\x85`] : lab;
    ls.forEach((l, j) => doc.text(x0 + L - 8 - textWidth(l, 6.8, o === lead ? 'F2' : 'F1'), yc + (ls.length === 1 ? -2.4 : 1.6 - j * 8), l, 6.8, o === lead ? 'F2' : 'F1', INK));
    const bh = Math.min(12, rowH * 0.62);
    const a = X(Math.min(0, d[i])), b = X(Math.max(0, d[i]));
    doc.rect(a, yc - bh / 2, Math.max(0.8, b - a), bh, { fill: o === lead ? ACCENT : PALE });
    const txt = o === ref ? 'reference' : `${d[i] >= 0 ? '+' : '−'}${money(Math.abs(d[i]), 3)}`;
    doc.label(b + 4, yc - 2.4, txt, 6.8, 'F1', INK);
  });
  doc.labelCentre(x0 + L + G + pw / 2, y0 + 2, 'Present value of net cost against the reference (more cost to the right)', 6.8, 'F1', MUTED);
}

// Figure 3: the tornado of the leader.
function drawTornado(doc, srows, m, tor, fmt, x0, y0, w, h) {
  const vals = [m.get(tor.base), ...srows.flatMap((r) => [m.get(r.low), m.get(r.high)])].filter(Number.isFinite);
  const L = 170, R = 10, B = 18;
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || Math.abs(lo) * 0.01 || 1;
  lo -= pad; hi += pad;
  const X = (v) => x0 + L + ((Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : hi)) - lo) / (hi - lo)) * (w - L - R);
  const bx = X(m.get(tor.base));
  srows.forEach((r, i) => {
    const yy = y0 + h - 14 - i * 18;
    const lab = wrap(r.label, L - 8, 7.3, 'F1');
    doc.text(x0, yy, lab.length > 1 ? `${lab[0].replace(/\s*\S{0,2}$/, '')}\x85` : lab[0], 7.3, 'F1', INK);
    const xl = X(m.get(r.low)), xh = X(m.get(r.high));
    doc.rect(Math.min(bx, xl), yy - 3, Math.max(0.8, Math.abs(xl - bx)), 10, { fill: PALE });
    doc.rect(Math.min(bx, xh), yy - 3, Math.max(0.8, Math.abs(xh - bx)), 10, { fill: ACCENT });
  });
  doc.line(bx, y0 + B - 4, bx, y0 + h, { color: INK, lw: 0.6, dash: [2, 2] });
  doc.label(x0 + L, y0 + 2, `Axis ${fmt(lo)} to ${fmt(hi)}.`, 6.8, 'F1', MUTED);
}

// Cost against carbon for every option, the top five numbered.
function drawScatter(doc, run, tc) {
  const pts = run.options.filter((o) => Number.isFinite(o.eco.lcoe) && Number.isFinite(o.carbon.locationG));
  if (!pts.length) return;
  doc.figure(260, (x0, y0, w, h) => {
    const L = 46, B = 28, T = 24, R = 10;
    const xs = pts.map((o) => o.carbon.locationG), ys = pts.map((o) => o.eco.lcoe);
    let xl = Math.min(...xs), xh = Math.max(...xs), yl = Math.min(...ys), yh = Math.max(...ys);
    const px = (xh - xl) * 0.05 || 1, py = (yh - yl) * 0.05 || 1;
    xl -= px; xh += px; yl -= py; yh += py;
    const X = (v) => x0 + L + ((v - xl) / (xh - xl)) * (w - L - R);
    const Y = (v) => y0 + B + ((v - yl) / (yh - yl)) * (h - B - T);
    doc.rect(x0 + L, y0 + B, w - L - R, h - B - T, { stroke: LINE });
    for (let i = 0; i <= 4; i++) {
      const vx = xl + ((xh - xl) * i) / 4, vy = yl + ((yh - yl) * i) / 4;
      doc.label(X(vx) - 8, y0 + B - 11, sig(vx, 3), 7, false, MUTED);
      doc.label(x0 + 4, Y(vy) - 2, sig(vy * displayCurrency().rate, 3), 7, false, MUTED);
      doc.line(X(vx), y0 + B, X(vx), y0 + h - T, { color: [0.92, 0.91, 0.89], lw: 0.4 });
      doc.line(x0 + L, Y(vy), x0 + w - R, Y(vy), { color: [0.92, 0.91, 0.89], lw: 0.4 });
    }
    doc.label(x0 + L, y0 + 2, 'Carbon, location-based (gCO2e/kWh)', 7.5, false, INK);
    doc.label(x0 + 4, y0 + h - 8, `LCOE (${displayCurrency().code}/MWh)`, 7.5, false, INK);
    for (const o of pts) {
      const ad = o.adequacy && o.adequacy.status === 'Adequate';
      doc.circle(X(o.carbon.locationG), Y(o.eco.lcoe), 1.6, ad ? { fill: [0.55, 0.62, 0.7] } : { stroke: [0.65, 0.65, 0.65], lw: 0.4 });
    }
    for (const c of tc.cards) {
      const o = c.o;
      if (!Number.isFinite(o.eco.lcoe) || !Number.isFinite(o.carbon.locationG)) continue;
      doc.circle(X(o.carbon.locationG), Y(o.eco.lcoe), 4, { fill: ACCENT, stroke: [1, 1, 1], lw: 0.8 });
      doc.label(X(o.carbon.locationG) + 6, Y(o.eco.lcoe) + 2, `#${o.rank}`, 8, true, ACCENT);
    }
  });
}


// ---- Front page and the newer figures (work package 22) ----

// Four headline figures in the order of the study report: the gap, the bridging plant, the cost against waiting for
// the grid (or per MW-month of IT on time) and the months late; LCOE, capex and carbon fill any place left.
function frontTiles({ lead, g, Wref, gs, ml, I, lastPhase }) {
  const t = [];
  if (g && g.temporary.months > 0) t.push({ big: `${sig(g.temporary.peakMW, 3)} MW`, caption: `gap to bridge at design: grid import below the facility load for ${plural(g.temporary.months, 'month')} from ${ml(g.temporary.firstMonth)}` });
  else if (g && g.permanent.months > 0) t.push({ big: `${sig(g.permanent.peakMW, 3)} MW`, caption: 'permanent shortfall at full build: design load above the grid import for the life of the campus' });
  else t.push({ big: '0 MW', caption: 'gap to bridge: the grid import carries the design load in every month' });
  const br = lead.sizing && lead.sizing.bridge;
  if (br && br.mw > 0) {
    const after = { remove: 'removed when the grid is ready', backup: 'then kept as backup', prime: 'then kept as prime power', split: 'then kept for the shortfall', gridServices: 'then kept for grid services' }[lead.v.C3] || '';
    t.push({ big: `${sig(br.mw, 3)} MW`, caption: `${lower(techName(br.tech))} bridging the gap${br.units ? ` (${br.units} × ${sig(br.unitMW, 3)} MW)` : ''}${after ? `, ${after}` : ''}` });
  }
  if (Wref) {
    const d = lead.eco.npvCost - Wref.eco.npvCost;
    const itMWm = ((Wref.ttp.gapMWm || 0) - (lead.ttp.gapMWm || 0)) / gs.perMWIT;
    if (d > 0 && itMWm > 1) t.push({ big: money(d / itMWm, 3), caption: `per MW-month of IT handed over on time: the extra present value of keeping the programme (${money(d, 3)}) over ${Math.round(itMWm).toLocaleString('en-GB')} MW-months` });
    else t.push({ big: `${money(Math.abs(d), 3)} ${d >= 0 ? 'more' : 'less'}`, caption: `present value of net cost than waiting for the grid (#${Wref.rank}), over ${I.economics.periodYears} years` });
  }
  t.push({ big: plural(Math.round(lead.ttp.delayFull || 0), 'month'), caption: `late at full load against the programme (full load ${ml(lead.ttp.fullLoadM)}, last handover ${monthName(lastPhase)})` });
  const fill = [
    { big: perMWh(lead.eco.lcoe, 3), caption: `LCOE of the leader: present value of energy costs ÷ energy supplied, ${I.economics.periodYears} years at ${pct(I.economics.wacc, 1)} real` },
    { big: money(lead.eco.capex, 3), caption: `capex of the leader, with ${pct(I.economics.contingency, 0)} contingency` },
    { big: `${sig(lead.carbon.locationG, 3)} g/kWh`, caption: 'carbon of the leader, location-based (Scope 1 and 2)' },
  ];
  while (t.length < 4 && fill.length) t.push(fill.shift());
  // Keep the months late last.
  const late = t.findIndex((x) => /late at full load/.test(x.caption));
  const out = t.filter((_, k) => k !== late).slice(0, 3);
  out.push(t[late]);
  return out;
}

// Rows of the programme timeline: the handovers, the grid, then each strategy with its plant (from the permit outlook).
function timelineRows(alts, lead, Wref) {
  const rows = [{ kind: 'handovers', h: 22 }, { kind: 'grid', h: 20 }];
  const pick = alts.filter((o) => o !== Wref).slice(0, 5);
  if (Wref) pick.push(Wref);
  for (const o of pick) {
    const pl = ((o.sizing && o.sizing.permitOutlook) || []).filter((p) => ['bridge', 'prime', 'backup'].includes(p.role));
    rows.push({ kind: 'option', o, lead: o === lead, wait: o === Wref, plants: pl, h: Math.max(17, 7 + pl.length * 6) });
  }
  return rows;
}
function drawTimeline(doc, rows, gs, I, start, x0, y0, w, h) {
  const L = 170, R = 8, T = 6, B = 24;
  const m0 = 0, m1 = gs.m1;
  const pw = w - L - R;
  const X = (m) => x0 + L + ((Math.max(m0, Math.min(m1 + 1, m)) - m0) / (m1 + 1 - m0)) * pw;
  // Years.
  const p = String(start).split('-').map(Number);
  for (let m = m0; m <= m1 + 1; m++) {
    if (((p[1] - 1 + m) % 12 + 12) % 12 !== 0) continue;
    doc.line(X(m), y0 + B, X(m), y0 + h - T, { color: [0.92, 0.915, 0.9], lw: 0.4 });
    doc.labelCentre(X(m), y0 + B - 10, String(p[0] + Math.floor((p[1] - 1 + m) / 12)), 6.6, 'F1', MUTED);
  }
  let y = y0 + h - T;
  const ROLE = { bridge: ORANGE, prime: ACCENT, backup: [0.5, 0.5, 0.52] };
  for (const r of rows) {
    const yc = y - r.h / 2;
    if (r.kind === 'handovers') {
      doc.label(x0, yc - 2.4, 'IT handovers (programme)', 7, 'F2', INK);
      for (const ph of I.load.phases) {
        const m = monthOf(I, ph.date), px = X(m + 0.5);
        doc.path([[px, yc + 4], [px + 3.5, yc], [px, yc - 4], [px - 3.5, yc]], { fill: INK });
        doc.labelCentre(px, yc + 6, `${sig(Number(ph.itMW), 3)} MW`, 5.8, 'F1', MUTED);
      }
    } else if (r.kind === 'grid') {
      doc.label(x0, yc - 2.4, `Grid import (${sig(I.grid.nowMW, 3)} MW now, ${sig(I.grid.fullMW, 3)} MW full)`, 7, 'F2', INK);
      const full = Math.max(...gs.grid.slice(0, m1 + 1));
      for (let m = m0; m <= m1; m++) {
        const share = full > 0 ? (gs.grid[m] || 0) / full : 0;
        doc.rect(X(m), yc - 3.5, X(m + 1) - X(m) + 0.2, 7, { fill: share >= 1 - 1e-9 ? [0.25, 0.28, 0.33] : share > 0 ? [0.78, 0.8, 0.84] : [0.95, 0.95, 0.95] });
      }
    } else {
      const o = r.o;
      const lab = wrap(`#${o.rank} ${firstPart(o.name)}${r.wait ? ' (waiting)' : ''}`, L - 8, 6.6, r.lead ? 'F2' : 'F1');
      lab.slice(0, 2).forEach((l, j) => doc.text(x0, yc + (lab.length > 1 ? 1.5 - j * 7.5 : -2.4), j === 1 && lab.length > 2 ? `${l.replace(/\s*\S{0,2}$/, '')}\x85` : l, 6.6, r.lead ? 'F2' : 'F1', INK));
      r.plants.forEach((q, j) => {
        const yy = yc + (r.plants.length - 1) * 3 - j * 6;
        const c = ROLE[q.role] || MUTED;
        doc.line(X(m0), yy, X(q.readyMonth), yy, { color: [0.7, 0.7, 0.72], lw: 0.6 });
        doc.rect(X(q.readyMonth), yy - 2, Math.max(0.8, X(m1 + 1) - X(q.readyMonth)), 4, { fill: c });
        const nx = X(q.neededMonth);
        doc.line(nx, yy - 3.5, nx, yy + 3.5, { color: q.readyMonth > q.neededMonth ? FLAG : INK, lw: 1 });
      });
      if (Number.isFinite(o.ttp.fullLoadM)) doc.circle(X(o.ttp.fullLoadM + 0.5), yc, 2.6, { fill: r.lead ? ACCENT : [1, 1, 1], stroke: INK, lw: 0.6 });
    }
    doc.line(x0, y - r.h, x0 + w - R, y - r.h, { color: [0.93, 0.925, 0.91], lw: 0.3 });
    y -= r.h;
  }
}

// The LCOE split by cost, from the option's ledger: each cost's present value ÷ the present value of energy supplied
// (the same sums as the LCOE, so the parts add up to it exactly).
export const BUILD_UP = [
  ['capex', 'Capex', ACCENT], ['om', 'O&M', PALE], ['grid', 'Grid import and network charges', [0.4, 0.45, 0.55]], ['ppa', 'PPA', [0.36, 0.62, 0.42]],
  ['fuel', 'Fuel', ORANGE], ['rental', 'Hire of rented plant', [0.96, 0.72, 0.42]], ['carbon', 'Carbon', [0.55, 0.55, 0.57]], ['other', 'Tests and flexibility', [0.82, 0.82, 0.8]], ['revenue', 'Revenue', [0.75, 0.86, 0.75]],
];
export function costBuildUp(o) {
  const L = o.eco && o.eco.ledger;
  if (!Array.isArray(L) || !L.length) return null;
  const pv = Object.fromEntries(BUILD_UP.map(([k]) => [k, 0]));
  let pvE = 0;
  for (const y of L) {
    const df = y.opex > 0 ? y.pvOpex / y.opex : 0;
    pv.capex += y.pvCapex || 0;
    pv.om += ((y.fom || 0) + (y.vom || 0)) * df;
    pv.grid += ((y.grid || 0) + (y.gridFixed || 0)) * df; pv.ppa += (y.ppa || 0) * df; pv.fuel += (y.fuel || 0) * df; pv.rental += (y.rental || 0) * df; pv.carbon += (y.carbon || 0) * df;
    pv.other += ((y.testRun || 0) + (y.flex || 0)) * df;
    pv.revenue -= (y.revenue || 0) * df;
    pvE += (y.deliveredMWh || 0) * df;
  }
  if (!(pvE > 0)) return null;
  const parts = Object.fromEntries(Object.entries(pv).map(([k, x]) => [k, x / pvE]));
  return { parts, total: Object.values(parts).reduce((a, x) => a + x, 0) };
}
function drawBuildUp(doc, opts, lead, Wref, x0, y0, w, h) {
  const L = 150, R = 50, T = 4, B = 40;
  const bus = opts.map((o) => costBuildUp(o));
  const neg = Math.min(0, ...bus.map((b) => b.parts.revenue));
  const hi = Math.max(...bus.map((b) => b.total - b.parts.revenue));
  const pw = w - L - R;
  const X = (v) => x0 + L + ((v - neg) / (hi - neg || 1)) * pw;
  const tk = ticks(neg, hi, 5);
  for (const v of tk.values) { doc.line(X(v), y0 + B, X(v), y0 + h - T, { color: [0.92, 0.915, 0.9], lw: 0.4 }); doc.labelCentre(X(v), y0 + B - 10, perMWh(v, 3), 6.3, 'F1', MUTED); }
  const rowH = (h - B - T) / opts.length;
  opts.forEach((o, i) => {
    const yc = y0 + h - T - (i + 0.5) * rowH, b = bus[i];
    const lab = wrap(`#${o.rank} ${firstPart(o.name)}${o === Wref ? ' (waiting)' : ''}`, L - 10, 6.8, o === lead ? 'F2' : 'F1');
    lab.slice(0, 2).forEach((l0, j) => { const l = j === 1 && lab.length > 2 ? `${l0.replace(/\s*\S{0,2}$/, '')}\x85` : l0; doc.text(x0 + L - 8 - textWidth(l, 6.8, o === lead ? 'F2' : 'F1'), yc + (lab.length > 1 ? 1.5 - j * 8 : -2.4), l, 6.8, o === lead ? 'F2' : 'F1', INK); });
    let at = 0;
    for (const [k, , c] of BUILD_UP) {
      const v = b.parts[k];
      if (k === 'revenue' || !(v > 0)) continue;
      doc.rect(X(at), yc - 7, Math.max(0.4, X(at + v) - X(at)), 14, { fill: c });
      if (X(at + v) - X(at) > 26) doc.labelCentre((X(at) + X(at + v)) / 2, yc - 2.4, sig(v * displayCurrency().rate, 2), 6.2, 'F1', k === 'capex' || k === 'grid' ? [1, 1, 1] : INK);
      at += v;
    }
    if (b.parts.revenue < 0) doc.rect(X(b.parts.revenue), yc - 7, X(0) - X(b.parts.revenue), 14, { fill: BUILD_UP[BUILD_UP.length - 1][2] });
    doc.label(X(at) + 4, yc - 2.4, perMWh(b.total, 3), 6.8, 'F2', INK);
  });
  // Legend.
  let lx = x0 + L, ly = y0 + 6;
  for (const [k, name, c] of BUILD_UP) {
    if (!bus.some((b) => Math.abs(b.parts[k]) > 1e-9)) continue;
    const tw = textWidth(toWinAnsi(name), 6.4, 'F1') + 18;
    if (lx + tw > x0 + w) { lx = x0 + L; ly -= 9; }
    doc.rect(lx, ly - 0.5, 8, 6, { fill: c });
    doc.label(lx + 11, ly, name, 6.4, 'F1', INK);
    lx += tw + 6;
  }
}

// Energy supplied by source in each modelled year with load (GWh).
const MIX = [['grid', 'Grid', [0.4, 0.45, 0.55]], ['ppa', 'PPA', [0.36, 0.62, 0.42]], ['re', 'On-site solar and wind', [0.95, 0.78, 0.3]], ['plant', 'On-site plant', ORANGE], ['battery', 'Battery', PALE], ['unmet', 'Not served', FLAG]];
function drawMix(doc, ys, start, x0, y0, w, h) {
  const L = 40, R = 8, T = 16, B = 34;
  const vals = ys.map(({ y }) => ({ grid: y.gridMWh || 0, ppa: y.ppaDeliveredMWh || 0, re: y.reUsedMWh || 0, plant: (y.plants || []).reduce((a, q) => a + (q.mwh || 0), 0), battery: y.bessDischargeMWh || 0, unmet: y.unmetMWh || 0 }));
  const top = Math.max(...vals.map((v) => Object.values(v).reduce((a, x) => a + x, 0))) / 1000;
  const tk = ticks(0, top * 1.05, 5);
  const yTop = Math.ceil((top * 1.05) / tk.step) * tk.step;
  if (tk.values[tk.values.length - 1] < yTop - 1e-9) tk.values.push(yTop);
  const pw = w - L - R, ph = h - B - T;
  const Y = (v) => y0 + B + (v / yTop) * ph;
  for (const v of tk.values) { doc.line(x0 + L, Y(v), x0 + L + pw, Y(v), { color: [0.92, 0.915, 0.9], lw: 0.4 }); doc.labelRight(x0 + L - 4, Y(v) - 2.4, sig(v, 3), 6.6, 'F1', MUTED); }
  doc.label(x0, y0 + h - 6, 'GWh', 6.6, 'F1', MUTED);
  const bw = Math.min(46, (pw / vals.length) * 0.62);
  vals.forEach((v, i) => {
    const cx = x0 + L + (i + 0.5) * (pw / vals.length);
    let at = 0;
    for (const [k, , c] of MIX) { const g = v[k] / 1000; if (!(g > 0)) continue; doc.rect(cx - bw / 2, Y(at), bw, Y(at + g) - Y(at), { fill: c }); at += g; }
    doc.labelCentre(cx, Y(at) + 3, sig(at, 3), 6.3, 'F1', INK);
    doc.labelCentre(cx, y0 + B - 10, `Year ${ys[i].k + 1}`, 6.6, 'F1', MUTED);
    doc.labelCentre(cx, y0 + B - 18, monthName(addMonths(start, 12 * ys[i].k)), 5.8, 'F1', MUTED);
  });
  let lx = x0 + L, ly = y0 + 2;
  for (const [k, name, c] of MIX) {
    if (!vals.some((v) => v[k] > 0)) continue;
    doc.rect(lx, ly - 0.5, 8, 6, { fill: c });
    doc.label(lx + 11, ly, name, 6.4, 'F1', INK);
    lx += textWidth(toWinAnsi(name), 6.4, 'F1') + 24;
  }
}

// Carbon intensity each year of the evaluation period (location-based, gCO2e/kWh), from the ledger.
export function carbonByYear(o) {
  const L = (o.eco && o.eco.ledger) || [];
  return L.map((y, k) => ({ k, g: y.deliveredMWh > 0 ? (((y.scope1T || 0) + (y.scope2LocT || 0)) * 1000) / y.deliveredMWh : null })).filter((p) => p.g != null);
}
function drawCarbon(doc, series, lead, start, x0, y0, w, h) {
  const L = 40, R = 120, T = 16, B = 26;
  const all = series.flatMap((s) => s.pts);
  const k0 = Math.min(...all.map((p) => p.k)), k1 = Math.max(...all.map((p) => p.k));
  const gmax = Math.max(...all.map((p) => p.g)) * 1.08 || 1;
  const tk = ticks(0, gmax, 5);
  const yTop = Math.ceil(gmax / tk.step) * tk.step;
  if (tk.values[tk.values.length - 1] < yTop - 1e-9) tk.values.push(yTop);
  const pw = w - L - R, ph = h - B - T;
  const X = (k) => x0 + L + ((k - k0) / Math.max(1, k1 - k0)) * pw;
  const Y = (v) => y0 + B + (v / yTop) * ph;
  for (const v of tk.values) { doc.line(x0 + L, Y(v), x0 + L + pw, Y(v), { color: [0.92, 0.915, 0.9], lw: 0.4 }); doc.labelRight(x0 + L - 4, Y(v) - 2.4, sig(v, 3), 6.6, 'F1', MUTED); }
  doc.label(x0, y0 + h - 6, 'gCO2e/kWh', 6.6, 'F1', MUTED);
  const p = String(start).split('-').map(Number);
  for (let k = k0; k <= k1; k++) if ((k - k0) % Math.max(1, Math.round((k1 - k0) / 8)) === 0) doc.labelCentre(X(k), y0 + B - 10, String(p[0] + k), 6.6, 'F1', MUTED);
  const COL = [ACCENT, [0.55, 0.55, 0.57], ORANGE];
  series.forEach((s, i) => doc.path(s.pts.map((q) => [X(q.k), Y(q.g)]), { stroke: COL[i % 3], lw: s.o === lead ? 1.6 : 1, dash: i === 2 ? [3, 2] : null }));
  // End labels, two lines each, pushed apart so they do not overlap.
  const labs = series.map((s, i) => ({ s, i, y: Y(s.pts[s.pts.length - 1].g), x: X(s.pts[s.pts.length - 1].k) })).sort((a, b) => b.y - a.y);
  for (let j = 1; j < labs.length; j++) if (labs[j - 1].y - labs[j].y < 17) labs[j].y = labs[j - 1].y - 17;
  for (const { s, i, y, x } of labs) {
    const l2 = wrap(`#${s.o.rank} ${firstPart(s.o.name)}`, R - 12, 6.2, s.o === lead ? 'F2' : 'F1');
    l2.slice(0, 2).forEach((l, j) => doc.text(x + 6, y - 2 + 3.5 - j * 7.2, j === 1 && l2.length > 2 ? `${l.replace(/\s*\S{0,2}$/, '')}\x85` : l, 6.2, s.o === lead ? 'F2' : 'F1', COL[i % 3]));
  }
}

// File name for the report: project name and date, safe for Windows.
export function reportFileName(run, created = new Date()) {
  const name = String(normalizeInputs(run.inputs).project.name || 'project').replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'project';
  return `energy-strategy-report-${name}-${created.toISOString().slice(0, 10)}.pdf`;
}
