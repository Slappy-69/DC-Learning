// The text behind the "?" next to every parameter (work package 31; owner 2026-11-07, OPEN-QUESTIONS 181, 183, 184):
// what the parameter is (its plain name, unit and note), its basis and source, and what it does in one example study
// that is the same for every parameter (T1, worked out at release by scripts/build-help.mjs and bundled).
import { getRegistry, registryValue } from './defaults.js';
import { HELP_T1 } from '../data/help-t1.js';

const recOf = (path) => { const r = getRegistry()[path]; if (r) return r; try { registryValue(path); } catch { return null; } return getRegistry()[path] || null; };
const fmt = (x) => (Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('en-GB') : String(+Number(x).toPrecision(4)));

export function helpFor(path) {
  const r = recOf(path);
  if (!r) return null;
  const what = [r.unit ? `Unit: ${r.unit}.` : '', r.note ? String(r.note) : ''].filter(Boolean).join(' ');
  const basis = r.source ? `Source: ${r.source}${r.year ? ` (${r.year})` : ''}${r.url ? `, ${r.url}` : ''}. ${r.label}.` : `Basis: ${r.basis || 'judgement'}; ${r.label}.`;
  const range = Number.isFinite(r.low) && Number.isFinite(r.high) ? `Range considered: ${fmt(r.low)} to ${fmt(r.high)}.` : '';
  const t = HELP_T1.params[path];
  let example;
  const head = `In the example (${HELP_T1.study}; its best option, ${HELP_T1.option}, LCOE €${HELP_T1.base.lcoe}/MWh, cost €${fmt(HELP_T1.base.npv)} m in present value)`;
  if (t && t[6]) example = `${head}: no effect in this example, since that option does not use ${t[6]}.`;
  else if (t && t[2] === t[3] && t[4] === t[5]) example = `${head}: no effect in this example (the same LCOE and cost at ${fmt(t[0])} and ${fmt(t[1])}).`;
  else if (t) example = `${head}: at ${fmt(t[0])} the LCOE is €${t[2]}/MWh and the cost €${fmt(t[4])} m; at ${fmt(t[1])}, €${t[3]}/MWh and €${fmt(t[5])} m.`;
  else example = `${head}: its effect on the example was not worked out (it has no single low–high range, such as a choice, a date or a toggle; the tornado on the results shows the main drivers for your own study).`;
  return { what, basis, range, example };
}
