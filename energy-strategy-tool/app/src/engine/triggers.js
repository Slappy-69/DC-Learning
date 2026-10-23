// Demand-flexibility triggers (BRIEF §5.3; walkthrough 2026-10-21; OPEN-QUESTIONS 33, 34). Pure: no UI.
//
// Trigger hours: grid price, grid carbon intensity, or ambient temperature (weather and grid stress) at or above the
// trigger level, the same in every model year (one profile year). Events: consecutive trigger hours, at most
// load.flexEventH long, then load.flexRecoveryH hours before the next. When the engineer holds the hours covered fixed
// (load.flexBatteryFixed = 'hours'), the trigger level is the one whose event hours first reach the target.

import { H } from './profiles.js';

const metricOf = (ctx, L) => {
  const p = ctx.prof;
  if (L.flexTrigger === 'carbon') return (h) => p.carbon[h] * ctx.carbonMult;
  if (L.flexTrigger === 'stress') return (h) => p.temp[h];
  return (h) => p.price[h] * ctx.priceMult + ctx.priceAdder;
};
const statedLevel = (L) => (L.flexTrigger === 'carbon' ? L.flexTriggerCarbon : L.flexTrigger === 'stress' ? L.flexTriggerTemp : L.flexTriggerPrice);

function events(mask, evMax, recH) {
  let n = 0, hours = 0, inEvent = false, evLen = 0, rec = 0, longest = 0;
  for (let h = 0; h < H; h++) {
    let on = false;
    if (inEvent) { if (mask[h] && evLen < evMax) { evLen++; on = true; } else { inEvent = false; rec = recH; } }
    if (!on && !inEvent) { if (rec > 0) rec--; else if (mask[h]) { inEvent = true; evLen = 1; on = true; n++; } }
    if (on) { hours++; if (evLen > longest) longest = evLen; }
  }
  return { events: n, eventHours: hours, longestEventH: longest };
}

const CACHE = new WeakMap();
// { mask, level } for the run's inputs (cached per profile and trigger parameters).
export function triggerSet(ctx, L) {
  const evMax = Math.max(1, Math.round(L.flexEventH || 1)), recH = Math.max(0, Math.round(L.flexRecoveryH || 0));
  const fixed = L.flexBatteryFixed || 'threshold';
  const key = [L.flexTrigger, L.flexTriggerPrice, L.flexTriggerCarbon, L.flexTriggerTemp, ctx.priceMult, ctx.priceAdder, ctx.carbonMult, evMax, recH, fixed, L.flexBatteryHours].join('|');
  let byKey = CACHE.get(ctx.prof);
  if (!byKey) { byKey = new Map(); CACHE.set(ctx.prof, byKey); }
  if (byKey.has(key)) return byKey.get(key);
  const f = metricOf(ctx, L);
  const vals = new Float64Array(H);
  for (let h = 0; h < H; h++) vals[h] = f(h);
  const maskAt = (lv) => { const m = new Uint8Array(H); for (let h = 0; h < H; h++) m[h] = vals[h] >= lv ? 1 : 0; return m; };
  let level = statedLevel(L);
  if (fixed === 'hours') {
    // The highest level whose event hours reach the target (binary search over the sorted hourly values).
    const target = Math.max(0, L.flexBatteryHours || 0);
    const sorted = Array.from(vals).sort((a, b) => b - a);
    let lo = 0, hi = H - 1, best = sorted[H - 1];
    if (target <= 0) best = Infinity;
    else {
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const e = events(maskAt(sorted[mid]), evMax, recH);
        if (e.eventHours >= target) { best = sorted[mid]; hi = mid - 1; } else lo = mid + 1;
      }
    }
    level = best;
  }
  const mask = maskAt(level);
  const out = { mask, level, ...events(mask, evMax, recH) };
  byKey.set(key, out);
  return out;
}

export const triggerMask = (ctx, L) => triggerSet(ctx, L).mask;

// Historical analysis of the trigger (§5.3): how often it occurs in the profile year, and how many events and event
// hours the event length and recovery period allow (before the hours-a-year limit).
export function triggerAnalysis(ctx) {
  const L = ctx.inputs.load;
  const t = triggerSet(ctx, L);
  let raw = 0;
  for (let h = 0; h < H; h++) raw += t.mask[h];
  const unit = L.flexTrigger === 'carbon' ? ' gCO₂e/kWh' : L.flexTrigger === 'stress' ? ' °C' : ' €/MWh';
  const lv = Number.isFinite(t.level) ? `${Math.round(t.level * 10) / 10}${unit}` : 'none';
  return { trigger: L.flexTrigger, level: lv, levelValue: t.level, fixed: L.flexBatteryFixed || 'threshold', triggerHours: raw, events: t.events, eventHours: t.eventHours, longestEventH: t.longestEventH, withinLimitHours: Math.min(t.eventHours, L.flexHours) };
}
