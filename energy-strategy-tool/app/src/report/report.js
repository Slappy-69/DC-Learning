// The PDF report (work package 10, BRIEF §12.10; OPEN-QUESTIONS 32 answered 2026-10-23 with Claude's
// recommendation, accepted in advance by the owner). One PDF, inputs first and results after:
//   cover · summary (BRIEF §14, work package 16) · 1 inputs · 2 assumptions · 3 results (run summary, top five,
//   ranked list) · 4 trade-offs · 5 compare · 6 dispatch (energy balance) · 7 sensitivity · 8 flags · 9 method.
// The Site tab (Beta) is never included: no site plan, no site-fit figures, no site geometry inputs.
// Pure: built from the run and the view state handed in; no browser APIs.

import { PdfDoc, INK, MUTED, ACCENT, FLAG, LINE } from './pdf.js';
import { getRegistry, normalizeInputs, CHOICES, choiceLabel, LABEL, LABEL_SOURCED, REQUIRED_EXAMPLE } from '../engine/defaults.js';
import { NA } from '../engine/generator.js';
import { weatherSummary } from '../engine/weather.js';
import { topCards } from '../engine/cards.js';
import { measureById, sortRows } from '../engine/sensitivity.js';
import { plainSummary, summaryKey } from '../engine/summary.js';
import { nearestFlips, gridDateAt } from '../engine/breakeven.js';
import { GUARDRAIL, sig, money, monthLabel, pct, perMWh, cur, displayCurrency } from '../format.js';

// Input sections in the order of the inputs panel; site geometry belongs to the Site tab (Beta) and is left out.
const SECTIONS = [
  ['project', 'Project'], ['site', 'Site (area and land)'], ['load', 'Load'], ['grid', 'Grid'], ['utilities', 'Utilities and PPA'], ['existing', 'Existing plant near the site (lease)'],
  ['requirements', 'Requirements'], ['economics', 'Economics'], ['weights', 'Weights'], ['deliverability', 'Deliverability'], ['settings', 'Run settings'],
];
export const SITE_BETA_KEYS = ['site.boundary', 'site.setbackByEdge', 'site.heightZones', 'site.exclusions', 'site.poc', 'site.gasMain', 'site.access', 'site.receptors',
  'deliverability.siteFitPenalty', 'deliverability.siteFitFlagsPenalty', 'deliverability.siteFitNoFitPenalty'];
// Notes printed without their sentences about the Site tab (Beta) or site fit (AC 26; Haiku check H3, M2).
export const noSiteNote = (t) => String(t || '').split(/(?<=\.)\s+/).filter((x) => !/site tab|site[- ]fit|beta/i.test(x)).join(' ');

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
    ? { section: 'Weather', path: 'weather', value: ws.text, status: 'Entered', note: '', isDefault: false }
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

// Builds the report; returns { bytes, pages, sections }. view: { compareIds, sensitivity (a tornado result or null),
// sensitivityMeasure, created (Date), appVersion }.
export function buildReport(run, view = {}) {
  const { compareIds = [], sensitivity = null, sensitivityMeasure = null, created = null, appVersion = '' } = view;
  const I = normalizeInputs(run.inputs);
  const start = (run.meta && run.meta.analysisStart) || I.project.analysisStart;
  const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
  const lead = ranked[0];
  const dateText = created instanceof Date ? created.toISOString().slice(0, 10) : '';
  const doc = new PdfDoc({ title: `Energy strategy report: ${I.project.name}`, footer: `${I.project.name} · energy strategy report${dateText ? ` · ${dateText}` : ''} · concept stage, indicative figures` });
  const sections = [];
  const H1 = (t) => { sections.push(t); doc.heading(t, 1); };

  // ---- Cover ----
  doc.space(120);
  doc.para('Data centre campus', { size: 12, color: MUTED });
  doc.para('Energy strategy report', { size: 26, bold: true, color: ACCENT, gap: 10 });
  doc.para(I.project.name, { size: 16, bold: true, gap: 16 });
  doc.table([{ label: 'Item', w: 1 }, { label: 'Value', w: 2.4 }], [
    ['Date of report', dateText || '—'],
    ['Location', `${I.project.lat}, ${I.project.lon}${run.meta && run.meta.country ? ` (${run.meta.country})` : ''}`],
    ['Analysis start', String(start)],
    ['Currency shown', displayCurrency().code === 'EUR' ? 'Euro' : `${displayCurrency().code}, converted from euro at ${displayCurrency().rate} per euro (fixed ECB reference rate of the release); inputs in euro`],
    ['IT load at full build', `${sig(I.load.itMW, 4)} MW in ${I.load.phases.length} phase${I.load.phases.length === 1 ? '' : 's'}`],
    ['Options screened', `${run.options.length.toLocaleString('en-GB')}${run.generation ? ` of ${run.generation.totalCombinations.toLocaleString('en-GB')} combinations` : ''}`],
    ['Engine and app version', `${run.engineVersion || '—'}${appVersion ? ` · app ${appVersion}` : ''}`],
    ['Inputs fingerprint', String(run.inputHash || '—')],
  ], { size: 9, headSize: 9, boldFirst: true });
  doc.space(10);
  doc.rect(doc.m, doc.y - 64, doc.width, 64, { fill: [0.99, 0.95, 0.88], stroke: [0.85, 0.6, 0.2] });
  const gy = doc.y;
  doc.y -= 6;
  doc.para('Read this first', { bold: true, size: 10, indent: 8 });
  doc.para(GUARDRAIL, { size: 9, indent: 8 });
  doc.y = Math.min(doc.y, gy - 70);
  doc.para(`Every default is labelled "${LABEL}" until it is researched. The tool makes no network connection; this report was made on this computer from the run shown. The Site tab (Beta) is not part of this report.`, { size: 8.5, color: MUTED });

  // ---- Summary (work package 16, BRIEF §14): the generated text, its detail, and the engineer's edit marked "edited".
  // Site fit is never in it (the Site tab is Beta and kept out of the PDF).
  const sm = plainSummary(run, { sensitivity: view.sensitivity || null, breakevens: view.breakevens || null, monteCarlo: view.monteCarlo || null, siteBeta: false });
  if (sm) {
    doc.newPage();
    H1('Summary');
    doc.para("Written by fixed templates from this run's figures, without a language model: it describes the result under the run's weights and settings and does not advise.", { size: 8.5, color: MUTED });
    for (const p of sm.parts) { doc.ensure(40); doc.para(p.heading, { bold: true, size: 10, gap: 1 }); doc.para(p.text, { size: 9.5 }); }
    doc.para(sm.guardrail, { size: 9, bold: true, gap: 8 });
    const note = view.summaryNote && typeof view.summaryNote.text === 'string' ? view.summaryNote : null;
    // A note written with the Site tab (Beta) on can hold site-fit wording, and the Site tab stays out of the PDF (H5, H1).
    if (note && note.siteBeta) doc.para('An edited summary note exists, but it was written with the Site tab (Beta) on, so it is left out of this report.', { size: 8.5, color: MUTED });
    else if (note) {
      doc.ensure(60);
      doc.heading('Summary as edited by the engineer (edited)', 2);
      if (note.key !== summaryKey(run, { siteBeta: false, usedTornado: sm.usedTornado, usedBreakevens: sm.usedBreakevens, usedMonteCarlo: sm.usedMonteCarlo })) doc.para(`Written for an earlier result (leader then: ${note.leaderName || 'not recorded'}); the generated summary above is for this run.`, { size: 8.5, color: FLAG });
      for (const t of note.text.split(/\n+/)) doc.para(t, { size: 9.5 });
      doc.para(`Edited ${String(note.editedAt || '').slice(0, 10)}.`, { size: 8, color: MUTED });
    }
    doc.heading('Summary detail', 2);
    for (const p of sm.parts) {
      const d = sm.details[p.id] || [];
      if (p.id === 'flags' || !d.length) continue;
      doc.para(p.heading, { bold: true, size: 8.5, gap: 1 });
      doc.bullets(d, { size: 8 });
    }
    doc.para(`The flags of the leader are listed in full in section 8.${sm.notBuilt.length ? ` Not built yet, so not in the summary: ${sm.notBuilt.join('; ')}.` : ''}${sm.notRun.length ? ` Not run for this report: ${sm.notRun.join('; ')}.` : ''}`, { size: 8, color: MUTED });
  }

  // ---- 1 Inputs ----
  doc.newPage();
  H1('1. Inputs');
  doc.para('Every input of the run, with its value and whether you entered it or the tool used its default. A default is labelled with the registry label and its basis (source, judgement or run setting). Site geometry (boundary, exclusions, height zones, connection points, receptors) belongs to the Site tab (Beta) and is not listed.', { size: 9 });
  const rows = inputRows(run.inputs);
  for (const [, title] of SECTIONS) {
    const rs = rows.filter((r) => r.section === title);
    if (!rs.length) continue;
    doc.heading(title, 2);
    doc.table([{ label: 'Input', w: 1.3 }, { label: 'Value', w: 1.7 }, { label: 'Entered or default', w: 1.5 }], rs.map((r) => [r.path, r.value, r.status]), { size: 7.5, headSize: 8 });
  }
  doc.heading('Technology choices generated', 2);
  doc.table([{ label: 'Choice', w: 1.5 }, { label: 'State', w: 0.6 }, { label: 'Values generated', w: 2.4 }], choiceRows(run.inputs), { size: 7.5, headSize: 8 });

  // ---- 2 Assumptions ----
  H1('2. Assumptions');
  const defs = rows.filter((r) => r.isDefault);
  const reg = getRegistry();
  const all = Object.values(reg);
  const unverified = all.filter((r) => r.label === LABEL).length;
  const sourced = all.filter((r) => r.label === LABEL_SOURCED).length;
  doc.para(`${defs.length} inputs use their default. The registry holds ${all.length} records (inputs, technology, cost, carbon, spatial and run settings); ${unverified} are "${LABEL}" and ${sourced} are "${LABEL_SOURCED}" (researched, with source, year and link, approved by the owner, not checked by an independent person). None is presented as verified. The full registry is in the user guide's appendix, and the run log lists the records each run read.`, { size: 9 });
  doc.table([{ label: 'Default used', w: 1.2 }, { label: 'Value', w: 1 }, { label: 'Basis and note', w: 2.6 }], defs.map((r) => [r.path, r.value, `${r.status.replace(/^Default: /, '')}${r.note ? `. ${r.note}` : ''}`]), { size: 7, headSize: 8 });

  // ---- 3 Results ----
  H1('3. Results');
  const W0 = run.scoring ? run.scoring.weights : I.weights;
  const wSum = W0.cost + W0.carbon + W0.ttp + W0.deliverability;
  const W = Object.fromEntries(['cost', 'carbon', 'ttp', 'deliverability'].map((k) => [k, wSum <= 1.01 ? W0[k] * 100 : (W0[k] / wSum) * 100]));
  const nAdeq = run.options.filter((o) => o.adequacy && o.adequacy.status === 'Adequate').length;
  doc.para(`${run.options.length.toLocaleString('en-GB')} options were modelled hour by hour for a full year (8,760 hours) and ranked by a weighted score: cost ${sig(W.cost, 3)} %, carbon ${sig(W.carbon, 3)} %, time-to-power ${sig(W.ttp, 3)} %, deliverability ${sig(W.deliverability, 3)} % (cost measured as ${I.settings.costMetric === 'npv' ? 'NPV' : 'LCOE'}, carbon ${I.settings.carbonMetric}-based). Options that meet the power need in every hour (power adequacy) rank first: ${nAdeq.toLocaleString('en-GB')} of ${run.options.length.toLocaleString('en-GB')} are adequate.`, { size: 9 });
  if (lead) doc.para(`Leader: #${lead.rank} ${lead.name}, score ${sig(lead.score, 4)}, LCOE ${perMWh(lead.eco.lcoe, 3)}, ${sig(lead.carbon.locationG, 3)} gCO2e/kWh (location-based), full load ${monthLabel(start, lead.ttp.fullLoadM)}.`, { size: 9.5, bold: true });
  const tc = topCards(run.options, 5);
  doc.heading('Top five strategies', 2);
  doc.para(`The best-ranked option of each distinct strategy (grid approach, bridging, permanent on-site generation and backup), skipping options with the same results as a better-ranked one. Pros and cons are judged ${tc.comparison}.`, { size: 8.5, color: MUTED });
  for (const c of tc.cards) {
    const o = c.o;
    doc.ensure(120);
    doc.para(`#${o.rank} ${o.name}`, { bold: true, size: 10, gap: 2 });
    doc.table([{ label: 'Score' }, { label: `LCOE ${cur().trim()}/MWh` }, { label: 'Capex' }, { label: 'Carbon g/kWh' }, { label: 'First power' }, { label: 'Full load' }, { label: 'Resilience' }, { label: 'Adequacy' }],
      [[sig(o.score, 4), sig(o.eco.lcoe * displayCurrency().rate, 3), money(o.eco.capex, 3), sig(o.carbon.locationG, 3), monthLabel(start, o.ttp.firstPowerM), monthLabel(start, o.ttp.fullLoadM), resText(o), adeqText(o)]], { size: 7.5, headSize: 7.5, zebra: false });
    if (c.pros.length) doc.bullets(c.pros.map((p) => `Pro: ${p.text}`), { size: 8.5 });
    if (c.cons.length) doc.bullets(c.cons.map((p) => `Con: ${p.text}`), { size: 8.5 });
    const major = c.majorFlags.filter((f) => !f.siteFit);
    doc.para(major.length ? `Main flags: ${major.slice(0, 4).map((f) => f.message.split(':')[0].split('.')[0]).join(' · ')}${major.length > 4 ? ` · +${major.length - 4} more` : ''}` : 'No major flags.', { size: 8.5, color: major.length ? FLAG : MUTED, gap: 8 });
  }
  // Several evaluation periods (OPEN-QUESTIONS 21; Haiku check H2, M3): LCOE and NPV over each period; only the
  // scoring period ranks.
  const periods = tc.cards.length && tc.cards[0].o.eco.byPeriod ? tc.cards[0].o.eco.byPeriod.map((p) => p.years) : [];
  if (periods.length > 1) {
    doc.heading('Top five by evaluation period', 2);
    doc.para(`LCOE and NPV of net cost over each period; the ${I.economics.periodYears}-year period sets the ranking.`, { size: 8.5, color: MUTED });
    doc.table([{ label: 'Option', w: 2.2 }, ...periods.flatMap((y) => [{ label: `LCOE ${y} yr`, align: 'right' }, { label: `NPV ${y} yr`, align: 'right' }])],
      tc.cards.map((c) => [`#${c.o.rank} ${c.o.name}`, ...periods.flatMap((y) => { const p = (c.o.eco.byPeriod || []).find((q) => q.years === y); return p ? [perMWh(p.lcoe, 3), money(p.npvCost, 3)] : ['—', '—']; })]), { size: 7, headSize: 7 });
  }
  doc.heading('Ranked list (top 20)', 2);
  doc.table([{ label: '#', w: 0.3, align: 'right' }, { label: 'Option', w: 3 }, { label: 'Score', w: 0.55, align: 'right' }, { label: `LCOE ${cur().trim()}/MWh`, w: 0.55, align: 'right' }, { label: 'Capex', w: 0.7, align: 'right' }, { label: 'g/kWh', w: 0.55, align: 'right' }, { label: 'Full load', w: 0.75 }, { label: 'Adequate', w: 0.6 }],
    ranked.slice(0, 20).map((o) => [String(o.rank), `${o.name}${tc.identical.has(o.id) ? ' (same results as a better-ranked option)' : ''}`, sig(o.score, 4), sig(o.eco.lcoe * displayCurrency().rate, 3), money(o.eco.capex, 3), sig(o.carbon.locationG, 3), monthLabel(start, o.ttp.fullLoadM), o.adequacy && o.adequacy.status === 'Adequate' ? 'yes' : 'no']), { size: 7, headSize: 7.5 });

  // ---- 4 Trade-offs ----
  H1('4. Trade-offs');
  doc.para('Cost (LCOE, up) against carbon (location-based, across) for every option. Filled dots are adequate options, hollow dots are not; the top five are numbered by rank.', { size: 9 });
  const pts = run.options.filter((o) => Number.isFinite(o.eco.lcoe) && Number.isFinite(o.carbon.locationG));
  doc.figure(300, (x0, y0, w, h) => {
    const L = 46, B = 28, T = 18, R = 10;
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
    doc.label(x0 + 4, y0 + h - T + 2, `LCOE (${displayCurrency().code}/MWh)`, 7.5, false, INK);
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

  // ---- 5 Compare ----
  H1('5. Compare');
  const cmp = compareIds.map((id) => run.options.find((o) => o.id === id)).filter(Boolean);
  if (!cmp.length) doc.para('No options were chosen for comparison when the report was made (tick "Compare" on a card or use "Add to compare").', { size: 9, color: MUTED });
  else {
    const fig = [
      ['Rank', (o) => `#${o.rank}`], ['Weighted score', (o) => sig(o.score, 4)], ['Power adequacy', adeqText],
      ['LCOE', (o) => perMWh(o.eco.lcoe)], ['NPV of net cost', (o) => money(o.eco.npvCost, 3)], ['Capex', (o) => money(o.eco.capex, 3)],
      ['Carbon, location-based', (o) => `${sig(o.carbon.locationG)} g/kWh`], ['Carbon, market-based', (o) => `${sig(o.carbon.marketG)} g/kWh`], ['Hourly CFE', (o) => pct(o.carbon.cfePct)],
      ['First power · full load', (o) => `${monthLabel(start, o.ttp.firstPowerM)} · ${monthLabel(start, o.ttp.fullLoadM)}`], ['Deliverability', (o) => sig(o.deliv.score, 2)], ['Resilience', resText],
      ['Flags (major · minor · info)', (o) => `${flagCount(o, 'major')} · ${flagCount(o, 'minor')} · ${flagCount(o, 'info')}`],
    ];
    doc.table([{ label: 'Figure', w: 1.2 }, ...cmp.map((o) => ({ label: `#${o.rank} ${o.name}`, w: 1.4 }))], fig.map(([l, f]) => [l, ...cmp.map(f)]), { size: 7.5, headSize: 7.5, boldFirst: true });
    const diff = CHOICES.filter((c) => new Set(cmp.map((o) => o.v[c.id])).size > 1);
    doc.heading('Choices on which they differ', 2);
    if (diff.length) doc.table([{ label: 'Choice', w: 1.2 }, ...cmp.map((o) => ({ label: `#${o.rank}`, w: 1.4 }))], diff.map((c) => [`${c.id} ${c.name}`, ...cmp.map((o) => (o.v[c.id] === NA ? 'n/a' : choiceLabel(c.id, o.v[c.id])))]), { size: 7.5, headSize: 7.5 });
    else doc.para('The options share every choice.', { size: 9 });
  }

  // ---- 6 Dispatch ----
  H1('6. Dispatch: energy balance');
  doc.para('Where each top-five option gets its energy in the last modelled year (steady state, every phase at full load) and in the first year, in GWh. Plant is on-site generation (bridging, permanent and backup on primary hours); flexibility is load turned down; unmet is demand not served. Hour-by-hour charts are in the Dispatch tab.', { size: 9 });
  for (const which of ['last', 'first']) {
    const er = tc.cards.map((c) => {
      const ys = (c.o.dispatch && c.o.dispatch.years) || [];
      const yi = which === 'last' ? null : Math.max(0, ys.findIndex((y) => y.demandMWh > 0));
      return [c.o, energyBalance(c.o, yi)];
    }).filter(([, b]) => b);
    const yr = (b) => `model year ${b.year + 1}, from ${monthLabel(start, 12 * b.year)}`;
    doc.heading(which === 'last' ? `Last modelled year, steady state${er.length ? ` (${yr(er[0][1])})` : ''}` : 'First year with load (each option, see the first column)', 2);
    doc.table([{ label: 'Option', w: 2.2 }, { label: 'Demand', align: 'right' }, { label: 'Grid', align: 'right' }, { label: 'PPA', align: 'right' }, { label: 'On-site RE', align: 'right' }, { label: 'Plant', align: 'right' }, { label: 'Battery', align: 'right' }, { label: 'Flex', align: 'right' }, { label: 'Unmet', align: 'right' }],
      er.map(([o, b]) => [`#${o.rank} ${o.name}${which === 'first' ? ` (${yr(b)})` : ''}`, mwh(b.demand), mwh(b.grid), mwh(b.ppa), mwh(b.re), mwh(b.plant), mwh(b.battery), mwh(b.flex), mwh(b.unmet)]), { size: 7, headSize: 7.5 });
  }

  // ---- 7 Sensitivity ----
  H1('7. Sensitivity');
  if (!sensitivity) doc.para('The sensitivity test (tornado) was not run for this report. Run it in the Sensitivity tab, then make the report again to include it.', { size: 9, color: MUTED });
  else {
    const m = measureById(sensitivityMeasure || sensitivity.measure);
    const srows = sortRows(sensitivity.allRows, m.id).slice(0, sensitivity.topN);
    const fmt = (x) => (!Number.isFinite(x) ? 'not finite' : m.id === 'npv' ? money(x, 4) : m.id === 'lcoe' ? perMWh(x, 4) : m.id === 'carbon' ? `${sig(x, 3)} g/kWh` : sig(x, 4));
    doc.para(`#${sensitivity.optionRank} ${sensitivity.optionName}: ${m.label} at each driver's low and high value, everything else held; base ${fmt(m.get(sensitivity.base))}. ${sensitivity.totalDrivers} drivers tested; largest swing first. Ranges are registry records, ${LABEL}.`, { size: 9 });
    const vals = [m.get(sensitivity.base), ...srows.flatMap((r) => [m.get(r.low), m.get(r.high)])].filter(Number.isFinite);
    if (vals.length > 1) {
      doc.figure(Math.max(60, srows.length * 18 + 30), (x0, y0, w, h) => {
        const L = 170, R = 10, B = 18;
        let lo = Math.min(...vals), hi = Math.max(...vals);
        const pad = (hi - lo) * 0.08 || Math.abs(lo) * 0.01 || 1;
        lo -= pad; hi += pad;
        const X = (v) => x0 + L + ((Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : hi)) - lo) / (hi - lo)) * (w - L - R);
        const bx = X(m.get(sensitivity.base));
        srows.forEach((r, i) => {
          const yy = y0 + h - 14 - i * 18;
          doc.label(x0, yy, r.label.slice(0, 40), 7.5, false, INK);
          const xl = X(m.get(r.low)), xh = X(m.get(r.high));
          doc.rect(Math.min(bx, xl), yy - 3, Math.max(0.8, Math.abs(xl - bx)), 10, { fill: [0.62, 0.74, 0.85] });
          doc.rect(Math.min(bx, xh), yy - 3, Math.max(0.8, Math.abs(xh - bx)), 10, { fill: ACCENT });
        });
        doc.line(bx, y0 + B - 4, bx, y0 + h, { color: INK, lw: 0.6, dash: [2, 2] });
        doc.label(x0 + L, y0 + 2, `${m.label}: light bar = low value, dark bar = high value; dashed line = base. Axis ${fmt(lo)} to ${fmt(hi)}.`, 7, false, MUTED);
      });
    }
    doc.table([{ label: 'Driver', w: 1.6 }, { label: 'Low' }, { label: m.label }, { label: 'High' }, { label: m.label }, { label: 'Score low · high', w: 1.1 }],
      srows.map((r) => [r.label, r.low.text, fmt(m.get(r.low)), r.high.text, fmt(m.get(r.high)), `${sig(r.low.score, 4)} · ${sig(r.high.score, 4)}`]), { size: 7.5, headSize: 7.5 });
  }
  // Breakevens (work package 17, §13.3): the leader against five competitors, when they were run for this run.
  const be = view.breakevens && view.breakevens.leaderId === (lead && lead.id) ? view.breakevens : null;
  doc.heading('Breakevens', 2);
  if (!be) doc.para('The breakeven table was not run for this report. Run it in the Sensitivity tab, then make the report again to include it.', { size: 9, color: MUTED });
  else {
    doc.para(`The value of each driver, nearest its current value, at which the leader (#1) and a competitor swap places ("no flip" within the driver's range otherwise). Competitors: #2, then the best option of each other strategy; drivers: the ${be.rows.length} that move the leader's weighted score most. Each side of the current value is checked at its middle and its end and the first change of order narrowed to ${Math.round(be.tolerance * 100)} % of the range (whole-number drivers: to 1); a swap that reverses between two checked points is not seen.${be.baseModel === 'full-year re-run' ? ' The run used the representative-day screening tier, so today\'s values of the leader and the competitors were re-run over the full year, as every other point is.' : ''}`, { size: 8.5, color: MUTED });
    const cell = (r, c, side) => { const f = c.flips[side]; return !f ? 'no flip' : r.id === 'grid-date' ? `${f.text} (${gridDateAt(be, f.at)})` : f.text; };
    doc.table([{ label: 'Driver (range)', w: 1.7 }, ...be.competitors.map((c) => ({ label: `#${c.rank}`, w: 1 }))],
      be.rows.map((r) => [`${r.label} (${r.lowText} to ${r.highText}${r.widened ? ', widened to include the value entered' : ''})`, ...r.cells.map((c) => `${r.id === 'grid-date' ? 'earlier' : 'lower'}: ${cell(r, c, 'down')}; ${r.id === 'grid-date' ? 'later' : 'higher'}: ${cell(r, c, 'up')}`)]), { size: 7, headSize: 7.5 });
    doc.bullets(be.competitors.map((c) => `#${c.rank} ${c.name}`), { size: 7.5 });
    const nf = nearestFlips(be, 3);
    doc.para(nf.length ? `Nearest flips: ${nf.map((f) => f.text).join('; ')}.` : 'No flip within the drivers\' ranges: the leader stays ahead of every competitor on every driver.', { size: 8.5 });
  }

  // Uncertainty, Monte Carlo (work package 18, §13.2), when it was run for this run.
  const mc = view.monteCarlo && view.monteCarlo.complete && view.monteCarlo.leaderId === (lead && lead.id) ? view.monteCarlo : null;
  doc.heading('Uncertainty (Monte Carlo)', 2);
  if (!mc) doc.para('The Monte Carlo was not run for this report. Run it in the Sensitivity tab, then make the report again to include it.', { size: 9, color: MUTED });
  else {
    const pc = (x) => `${Math.round(x * 100)} %`;
    const lr = mc.rows.find((r) => r.id === mc.leaderId), rb = mc.rows.find((r) => r.id === mc.robustPickId);
    doc.para(`${mc.samples.toLocaleString('en-GB')} Latin hypercube samples (seed ${mc.seed}) of ${mc.drivers.length} inputs drawn together, each triangular between its low and high value around the current one; grid and gas price correlated, and the capex factors. The ${mc.rows.length} leading options re-run in each sample with ${mc.screening ? 'representative-day' : 'full-year'} dispatch and put in the ranking's order. #1 leads in ${pc(lr.pRank1)} of samples and is in the top three in ${pc(lr.pTop3)}; the robust pick (most often within ${Math.round(mc.band * 100)} % of the best score) is #${rb.rank}${rb.id === lr.id ? ', the leader itself' : ` (within the band in ${rb.nRobust} of ${mc.samples.toLocaleString('en-GB')} samples, against ${lr.nRobust} for #1)`}.${mc.screening ? ' Representative-day dispatch makes adequacy and the order of the options approximate: now and then a full-year run would put a different option first in a sample.' : ''}${mc.drivers.some((d) => d.widened) ? ` Inputs entered outside their record's range were sampled over a widened range: ${mc.drivers.filter((d) => d.widened).map((d) => d.label).join('; ')}.` : ''}`, { size: 8.5, color: MUTED });
    const startM = (run.meta && run.meta.analysisStart) || I.project.analysisStart;
    doc.table([{ label: 'Option', w: 0.6 }, { label: 'Leads · top 3', w: 1 }, { label: `Within ${Math.round(mc.band * 100)} %`, w: 0.8 }, { label: 'LCOE P10 · P50 · P90', w: 1.9 }, { label: 'Carbon P50', w: 0.8 }, { label: 'Full load P10 – P90', w: 1.5 }, { label: 'Adequate', w: 0.7 }],
      mc.rows.map((r) => [`#${r.rank}`, `${pc(r.pRank1)} · ${pc(r.pTop3)}`, `${(r.pRobust * 100).toFixed(1)} %`, `${perMWh(r.lcoe.p10)} · ${perMWh(r.lcoe.p50)} · ${perMWh(r.lcoe.p90)}`, `${sig(r.carbon.p50, 3)} g/kWh`,
        r.fullLoadM.n ? `${monthLabel(startM, Math.round(r.fullLoadM.p10))} – ${monthLabel(startM, Math.round(r.fullLoadM.p90))}` : 'not reached', pc(r.pAdequate)]), { size: 7, headSize: 7.5 });
  }

  // ---- 8 Flags ----
  H1('8. Flags');
  doc.para('Every flag raised on the top-five options. Flags never hide, demote or resize an option (the one exception agreed by the owner: power-adequate options rank first). Site-fit flags (Site tab, Beta) are not listed.', { size: 9 });
  for (const c of tc.cards) {
    const fl = c.o.flags.filter((f) => !f.siteFit);
    doc.heading(`#${c.o.rank} ${c.o.name}`, 3);
    if (!fl.length) { doc.para('No flags.', { size: 8.5, color: MUTED }); continue; }
    const order = { major: 0, minor: 1, info: 2 };
    doc.table([{ label: 'Severity', w: 0.55 }, { label: 'Category', w: 0.8 }, { label: 'Flag', w: 3.6 }], fl.slice().sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3)).map((f) => [f.severity, f.category || '', f.message]), { size: 7, headSize: 7.5 });
  }
  if (run.runFlags && run.runFlags.length) {
    doc.heading('Run notes', 3);
    doc.bullets(run.runFlags.map((f) => f.message), { size: 8 });
  }

  // ---- 9 Method ----
  H1('9. Method');
  doc.bullets([
    'Generation: every combination of the technology choices allowed by the compatibility rules, sampled above the generation cap with the archetypes always included.',
    'Sizing and dispatch: each option is sized from the design-day load and dispatched hour by hour (8,760 hours) for each year until its supply stops changing; later years repeat the last modelled year.',
    'Economics: one yearly cash-flow ledger per option gives the LCOE, the NPV and every cost breakdown (real terms, at the WACC).',
    'Carbon: location-based and market-based Scope 1 and 2, and hourly carbon-free energy (a PPA counts only against grid energy used in the same hour).',
    'Time-to-power: first power and full load from the programme of each technology (ordered from day one, with a six-month permitting allowance for plant that needs significant environmental permitting); the axis counts the months late against the phasing plan (first power against phase 1, full load against the last phase) plus half the power gap in months of design load. Rented bridging plant is hired a month before it is first needed.',
    'Ranking: power-adequate options first, then by the weighted score of the four axes, each scaled 0-100 across the run.',
    `Profiles: ${run.profileLabel || 'synthetic hourly profiles'}.`,
    `Run settings: generation cap ${I.settings.generationCap}; grid handling "${I.settings.gridHandling}"; run-hour handling "${I.settings.runHourHandling}"; evaluation period ${I.economics.periodYears} years; WACC ${pct(I.economics.wacc, 1)}.`,
  ], { size: 8.5 });
  doc.para(GUARDRAIL, { size: 8.5, bold: true });

  const bytes = doc.bytes({ created });
  return { bytes, pages: doc.pages.length, sections };
}

// File name for the report: project name and date, safe for Windows.
export function reportFileName(run, created = new Date()) {
  const name = String(normalizeInputs(run.inputs).project.name || 'project').replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'project';
  return `energy-strategy-report-${name}-${created.toISOString().slice(0, 10)}.pdf`;
}
