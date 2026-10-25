// "Assumed default" flags (work package 2; BRIEF §2 principle 10, §5, §15; AC 16). Every key input the engineer did
// not enter raises an info flag on each option that uses it, naming the value and its source; entering the value
// removes the flag from every option. The technology, cost and carbon records behind every option are summarised in
// one further flag (they are listed in the PDF report's assumptions and the user guide's appendix).
// Pure: no UI, no browser APIs.

import { getRegistry, COUNTRIES, TECH, LABEL, buildDefaultInputs } from './defaults.js';
import { pinCountryInfo } from './context.js';

const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const gridConnected = (v) => v.C1 !== 'islanded';
const burnsGas = (v, sz) => [sz.prime, sz.bridge].some((p) => p && TECH[p.tech] && TECH[p.tech].fuel === 'gas') || !!(sz.backup && sz.backup.tech && TECH[sz.backup.tech] && TECH[sz.backup.tech].fuel === 'gas');
const combusts = (v, sz) => [sz.prime, sz.bridge].some((p) => p && TECH[p.tech] && TECH[p.tech].fuel) || !!(sz.backup && sz.backup.tech);
const hasBackup = (v, sz) => !!(sz.backup && sz.backup.tech);
const flexOn = (v) => v.C16 === 'on';
const hasPpa = (v) => v.C13 && v.C13 !== 'none';

// Key inputs: [path, name, when the option uses it].
export const KEY_INPUTS = [
  ['load.itMW', 'IT load at full build', () => true],
  ['load.phases', 'Phasing', () => true],
  ['grid.nowMW', 'Grid import now', gridConnected],
  ['grid.fullMW', 'Grid import at full connection', gridConnected],
  ['grid.fullDate', 'Grid full-connection date', gridConnected],
  ['project.analysisStart', 'Analysis start', () => true],
  ['load.utilisation', 'Average IT utilisation', () => true],
  ['load.rampStart', 'Ramp: share at energisation', () => true],
  ['load.shape', 'Load shape', () => true],
  ['load.coolingApproach', 'Cooling type', () => true], // OPEN-QUESTIONS 28: not chosen = all four compared
  ['grid.priceAdder', 'Grid non-commodity adder', gridConnected],
  ['economics.elecEscalation', 'Electricity price escalation', gridConnected],
  ['utilities.gasAvailable', 'Gas availability', burnsGas],
  ['utilities.gasDateMonths', 'Gas available from', burnsGas],
  ['utilities.gasPrice', 'Gas commodity price', burnsGas],
  ['economics.carbonPrice', 'Carbon price (Scope 1)', combusts],
  ['economics.wacc', 'WACC (real)', () => true],
  ['economics.periodYears', 'Evaluation period', () => true],
  ['requirements.autonomyH', 'Backup autonomy', hasBackup],
  ['requirements.testRunHours', 'Generator test hours', hasBackup],
  ['requirements.upsMin', 'UPS ride-through', () => true],
  ['utilities.ppaType', 'PPA type', hasPpa],
  ['load.flexMaxPct', 'Flexibility: maximum curtailment', flexOn],
  ['load.flexHours', 'Flexibility: hours a year', flexOn],
  ['load.flexTriggerPrice', 'Flexibility: price trigger', (v) => flexOn(v)],
];

function valueText(path, x, rec, inputs) {
  if (path === 'load.phases') return `${x.length} phase${x.length === 1 ? '' : 's'}`;
  if (typeof x === 'number') {
    const u = rec && rec.unit ? rec.unit.split(' (')[0] : '';
    const n = Number(x.toPrecision(4)).toLocaleString('en-GB');
    return !u ? n : u.length <= 8 ? `${n} ${u}` : `${n} (${u})`;
  }
  return String(x);
}

// Inputs filled by resolveUnknowns (defaults.js): flagged only when they were left blank.
const RESOLVED = ['load.itMW', 'load.phases', 'grid.nowMW', 'grid.fullMW', 'grid.fullDate'];

// Per-run list of key inputs at their default, with the sentence each flag gives. Cached on the context.
export function assumedBase(ctx) {
  if (ctx.assumedBase) return ctx.assumedBase;
  const inputs = ctx.inputs;
  // The input and run-setting records are created by buildDefaultInputs(). A pool worker (or any process that runs
  // inputs it did not build) has not called it, so without this the flags missed every registry-backed key input and
  // counted 387 instead of 563 records (known issue 21, found 2026-10-24 while building the summary).
  if (!('economics.wacc' in getRegistry())) buildDefaultInputs();
  const reg = getRegistry();
  const A = inputs.assumedInputs || {};
  const cname = COUNTRIES[ctx.country] ? COUNTRIES[ctx.country].name : ctx.country;
  const list = [];
  for (const [path, name, when] of KEY_INPUTS) {
    const r = reg[path];
    const cur = getPath(inputs, path);
    let text = null;
    if (A[path]) text = `${A[path]} (indicative — unverified)`;
    else if (path === 'load.coolingApproach') { if (cur === 'open') text = 'not chosen, so all four types are compared in this run (OPEN-QUESTIONS 28; judgement, indicative — unverified)'; }
    else if (r && !RESOLVED.includes(path)) {
      if (r.derived && typeof r.value === 'string' && r.value.startsWith('by ')) {
        if (cur == null || cur === r.value) text = `${cname} default (${r.basis}, ${r.label})`;
      } else if (same(cur, r.value)) {
        text = `${valueText(path, cur, r, inputs)}, default (${r.basis}, ${r.label})`;
      }
    }
    if (text) list.push({ path, name, when, text });
  }
  // Pin outside the built-in countries (work package 1): the nearest country's profile is assumed.
  if (!inputs.project.country) {
    const pc = pinCountryInfo(inputs.project.lat, inputs.project.lon);
    if (!pc.inside) list.push({ path: 'project.country', name: 'Country profile', when: () => true, text: `the pin is ${pc.mapName ? `in ${pc.mapName}, which has no built-in profile` : 'at sea or outside the map'}; the nearest built-in country, ${cname}, is used (judgement, indicative — unverified)` });
    else if (pc.nearBorder) list.push({ path: 'project.country', name: 'Country profile', when: () => true, text: `${cname} from the pin, which is ${pc.nearBorder.km.toFixed(1)} km from ${pc.nearBorder.name} on the simplified map outlines (about 1–2 km accurate); check the country (judgement, indicative — unverified)` });
  }
  // Design temperatures (work package 1): no ASHRAE station data is bundled (licensed data), so the design day is the
  // hottest hour of the synthetic country profile.
  list.push({ path: 'project.climate', name: 'Design temperatures', when: () => true, text: `from the synthetic ${cname} profile (hottest hour of the year), not from a design station; ASHRAE station data is licensed and not bundled (judgement, indicative — unverified)` });
  // Every other record the run reads is a default too (technology, cost, carbon, spatial); counted once.
  const all = Object.values(reg);
  const unverified = all.filter((x) => x.label === LABEL).length;
  ctx.assumedBase = { list, unverified, total: all.length };
  return ctx.assumedBase;
}

export function assumedFlags(ctx, v, sz, flag) {
  const b = assumedBase(ctx);
  const out = [];
  for (const a of b.list) if (a.when(v, sz)) out.push(flag(`assumed:${a.path}`, 'info', 'Assumed default', `Assumed ${a.name}: ${a.text}`, { assumed: true, path: a.path }));
  out.push(flag('assumed-records', 'info', 'Assumed default', `Technology, cost, carbon and other defaults: ${b.unverified} of ${b.total} registry records are ${LABEL} (PDF report section 2; user guide appendix)`, { assumed: true }));
  return out;
}
