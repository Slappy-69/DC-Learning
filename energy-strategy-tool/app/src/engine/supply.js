// Firm supply month by month (BRIEF §9.8): what an option can put against its design load. One rule, read by
// time-to-power (evaluate.js), the energise schedule (energise.js) and the Dispatch tab's timeline (inspect.js).
// Pure: no UI, no browser APIs.

import { contractedCap } from './context.js';

export function bridgeActive(v, m, T) {
  if (v.C1 === 'islanded') return true;
  if (v.C1 !== 'bridge') return false;
  if (m < T) return true;
  return v.C3 === 'prime';
}

// Bridging plant MW running in month m (before availability and fuel checks): the whole plant while bridgeActive; the
// kept share after the full grid date for C3 = Keep shortfall share as prime (OPEN-QUESTIONS 59).
export function bridgeMWAt(v, m, T, bridge) {
  if (bridgeActive(v, m, T)) return bridge.mw;
  if (v.C1 === 'bridge' && v.C3 === 'split' && m >= T) return bridge.primeMW || 0;
  return 0;
}

// Firm plant bought in step with the need (realism rebuild, OPEN-QUESTIONS 248): the MW in place in month m.
export function primeMWAt(prime, m) {
  if (!prime) return 0;
  if (!prime.steps) return prime.mw;
  let u = 0;
  for (const s of prime.steps) if (s.month <= m) u += s.units;
  return u * prime.unitMW;
}

// Supply against the design load in each month of the timeline: the contracted grid (none when islanded), the firm
// plant on site, and batteries that count as firm (a bridging battery while it bridges; a battery sized to the
// permanent shortfall that can recharge on the design day, OPEN-QUESTIONS 60).
export function supplyByMonth(ctx, v, sz) {
  const n = ctx.nMonthsTimeline;
  const supply = new Float64Array(n);
  const cc = contractedCap(ctx, v.C1);
  for (let m = 0; m < n; m++) {
    let s = v.C1 === 'islanded' ? 0 : cc[m];
    s += sz.firmByMonth[m];
    if (v.C2 === 'bessSolar' && bridgeActive(v, m, sz.T) && m >= sz.bridgeBess.availMonth) s += sz.bridgeBess.mw;
    if (sz.shortfallBess && sz.shortfallBess.rechargeOK && m >= sz.T && m >= sz.shortfallBess.availMonth) s += sz.shortfallBess.mw;
    supply[m] = s;
  }
  return supply;
}
