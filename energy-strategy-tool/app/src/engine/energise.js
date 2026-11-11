// When each building starts (realism rebuild of 2026-11-11; owner: "Building starts late, this will need to be
// highlighted though"; OPEN-QUESTIONS 247, 248).
//
// Before the rebuild every option had to carry the planned buildings on their planned dates; an option that could not
// was "not adequate", even by a sliver or by a few months. Now the IT an option delivers, and when, is a result:
// a building starts in the first month, not before its planned date and not before the building in front of it, in
// which
//   - its standby plant is ready, and
//   - the option's firm supply covers the design load of every building started so far, ramping as they fill, in that
//     month and in every later month of the timeline.
// A building the option can never carry is not built, and nor are the buildings after it. Nothing is hidden: the
// option says how many buildings it powers, how late each is and what holds it.
//
// Pure: no UI, no browser APIs.

import { supplyByMonth, bridgeMWAt, primeMWAt } from './supply.js';
import { contractedCap } from './context.js';
import { TECH } from './defaults.js';

const EPS = 1e-6;

// ctx: the option's context on the PLANNED phasing (the run's context, or the takeover context of work package 19).
// sz: the option sized on the phasing it is being tested against. floor: start months already fixed by an earlier
// pass (a building never starts earlier than there; null = never powered).
export function energise(ctx, v, sz, floor = null) {
  const L = ctx.inputs.load;
  const planned = ctx.phases;
  const n = ctx.nMonthsTimeline;
  const g = sz.peakPUE + L.ancillaryFrac;
  const rs = L.rampStart, rm = L.rampMonths;
  const ramp = (d) => (rm > 0 ? Math.min(1, rs + (1 - rs) * (d / rm)) : 1);
  const supply = supplyByMonth(ctx, v, sz);
  // Plant that is hired when it is needed (rented sets, a leased or bought existing plant) counts from the month it
  // could first be on site: its hire date follows the buildings, not the other way round. (The sizing then starts the
  // hire a lead before the first need on the dates found here.)
  for (const p of [sz.prime, sz.bridge]) {
    if (!p || p.earliestMonth == null || p.earliestMonth >= p.availMonth) continue;
    for (let m = Math.max(0, p.earliestMonth); m < Math.min(n, p.availMonth); m++) {
      if (m < p.fuelMonth || m >= (p.endMonth ?? Infinity)) continue;
      supply[m] += p === sz.prime ? primeMWAt(p, m) : bridgeMWAt(v, m, sz.T, p);
    }
  }
  const head = Float64Array.from(supply);
  const standby = Math.max(0, sz.standbyReadyM || 0);
  const starts = [], late = [], reasons = [];
  let prev = 0, powered = 0, poweredIT = 0, lateMWm = 0, maxLate = 0, plannedIT = 0;
  // A building fits from month s when its ramping load is covered in every month to the end of the timeline, and its
  // full load is covered at the end (a building started so late that the timeline ends before it has filled must
  // still be carried once it has).
  const fits = (it, s, h) => { for (let m = s; m < n; m++) if (it * g * ramp(m - s) > h[m] + EPS) return false; return it * g <= h[n - 1] + EPS; };
  const firstFit = (it, from, h) => { for (let s = Math.max(0, from); s < n; s++) if (fits(it, s, h)) return s; return null; };
  let stopped = false;
  for (let k = 0; k < planned.length; k++) {
    const p = planned[k];
    plannedIT += p.it;
    if (stopped || (floor && floor[k] == null)) { stopped = true; starts.push(null); late.push(null); reasons.push(null); lateMWm += p.it * Math.max(0, n - p.m); continue; }
    const from = Math.max(p.m, prev, floor ? floor[k] : 0);
    // The month the power alone would allow, then the standby plant's date.
    const sPower = firstFit(p.it, from, head);
    const s = sPower != null && sPower < standby ? firstFit(p.it, standby, head) : sPower;
    if (s == null) {
      stopped = true; starts.push(null); late.push(null); lateMWm += p.it * Math.max(0, n - p.m);
      reasons.push({ kind: 'never', text: `the supply never covers the design load of buildings 1 to ${k + 1} (${(plannedIT * g).toFixed(0)} MW) for the rest of the timeline` });
      continue;
    }
    for (let m = s; m < n; m++) head[m] -= p.it * g * ramp(m - s);
    if (s + rm > n - 1) head[n - 1] = Math.min(head[n - 1], supply[n - 1] - (plannedIT) * g); // its full load at the end of the timeline
    const d = s - p.m;
    let why = null;
    if (d > 0) {
      // What holds it: the standby plant, the building in front, or the power (and which source arrives that month).
      if (sPower < s) why = { kind: 'standby', text: `its standby plant is ready in month ${standby}` };
      else if (s === prev && prev > p.m) why = { kind: 'sequence', text: `it follows building ${k}, which starts in month ${prev}` };
      else why = { kind: 'power', text: powerReason(ctx, v, sz, s) };
    }
    starts.push(s); late.push(d); reasons.push(why);
    prev = s; powered++; poweredIT += p.it; lateMWm += p.it * d; if (d > maxLate) maxLate = d;
  }
  const shifted = powered < planned.length || late.some((x) => x != null && x > 0);
  return {
    starts, planned: planned.map((p) => p.m), it: planned.map((p) => p.it), late, reasons,
    buildings: planned.length, powered, poweredIT, plannedIT, maxLate, lateMWm, avgLate: plannedIT > 0 ? lateMWm / plannedIT : 0,
    standbyReadyM: standby, shifted, key: `${starts.map((x) => (x == null ? 'x' : x)).join(',')}`,
  };
}

// Which source arrives in month s (the month the building can start).
function powerReason(ctx, v, sz, s) {
  const parts = [];
  if (v.C1 !== 'islanded' && s > 0) {
    const cc = contractedCap(ctx, v.C1);
    if (cc[s] > cc[s - 1] + EPS) parts.push(`the grid connection reaches ${Math.round(cc[s])} MW in month ${s}`);
  }
  for (const p of [sz.bridge, sz.prime]) {
    if (!p) continue;
    const t = TECH[p.tech];
    const ready = Math.max(p.availMonth, p.fuelMonth === Infinity ? Infinity : p.fuelMonth);
    if (ready === s) parts.push(`${t.name} is ready in month ${s}${p.consent && p.consent.months ? ` (${p.consent.months} months of consent, then procurement and construction)` : ''}${p.fuelMonth > p.availMonth ? ' (when its fuel arrives)' : ''}`);
    else if (p.steps && p.steps.some((x) => x.month === s)) parts.push(`more ${t.name} units are in place in month ${s}`);
  }
  if (sz.shortfallBess && sz.shortfallBess.rechargeOK && Math.max(sz.T, sz.shortfallBess.availMonth) === s) parts.push(`the battery for the shortfall is ready in month ${s}`);
  return parts.length ? parts.join('; ') : `the supply first covers its load in month ${s}`;
}

// The words for an option's schedule (flags, cards, summary). ym: month → 'YYYY-MM'.
export function lateBits(en, ym) {
  const bits = [];
  if (!en) return bits;
  en.starts.forEach((s, k) => {
    if (s != null && en.late[k] > 0) bits.push(`building ${k + 1} starts ${en.late[k]} month${en.late[k] === 1 ? '' : 's'} late, in ${ym(s)} (planned ${ym(en.planned[k])}): ${en.reasons[k] ? en.reasons[k].text : 'supply not ready'}`);
  });
  return bits;
}
export function notBuiltText(en) {
  if (!en || en.powered >= en.buildings) return '';
  const first = en.powered + 1, many = en.buildings - en.powered > 1;
  return `building${many ? 's' : ''} ${first}${many ? ` to ${en.buildings}` : ''} ${many ? 'are' : 'is'} not built: ${en.reasons[en.powered] ? en.reasons[en.powered].text : 'the supply cannot carry them'}`;
}
export function lateText(en, ym) {
  return [...lateBits(en, ym), notBuiltText(en)].filter(Boolean).join('; ');
}
