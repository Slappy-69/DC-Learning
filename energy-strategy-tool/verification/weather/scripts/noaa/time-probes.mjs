// R2 NOAA method review (2026-10-31): probes of hourlyFromObs's hour placement at day, year and leap-day boundaries.
// Run: node energy-strategy-tool/verification/weather/scripts/noaa/time-probes.mjs
// Each probe feeds one or two readings and prints the index (0-based hour of a 365-day year) where the value lands.
// Expected convention (EPW, engine/weather.js readEpw): index = (day-of-year − 1) × 24 + (hour − 1), where hour h covers
// (h−1):00–h:00 local standard time and its value is the reading at h:00. So the reading at local 01:00 on 1 January
// lands in index 0 and the reading at local 24:00 on 31 December (00:00 on 1 January next year) lands in index 8759.
import { hourlyFromObs } from '../../../../app/src/engine/weathertmy.js';

const where = (obs, year, off) => {
  const h = hourlyFromObs(obs, year, off);
  const out = [];
  h.temp.forEach((v, i) => { if (Number.isFinite(v)) out.push(`${i}=${v}`); });
  return out.join(' ') || '(nothing placed)';
};
const U = (...a) => Date.UTC(...a);
const rows = [
  ['FR (+1): UTC 2015-01-01 00:00 = local 01:00 → expect index 0', [{ t: U(2015, 0, 1, 0, 0), temp: 1 }], 2015, 1],
  ['FR (+1): UTC 2014-12-31 23:50 (local 00:50, in the 2014 file) → expect index 0 (but not in the 2015 file)', [{ t: U(2014, 11, 31, 23, 50), temp: 2 }], 2015, 1],
  ['FR (+1): UTC 2015-12-31 23:00 = local 2016-01-01 00:00 (in the 2015 file) → expect index 8759', [{ t: U(2015, 11, 31, 23, 0), temp: 3 }], 2015, 1],
  ['FR (+1): UTC 2015-12-31 22:50 = local 23:50 → expect index 8759', [{ t: U(2015, 11, 31, 22, 50), temp: 4 }], 2015, 1],
  ['FI (+2): UTC 2015-12-31 22:00 = local 24:00 (in the 2015 file) → expect index 8759', [{ t: U(2015, 11, 31, 22, 0), temp: 5 }], 2015, 2],
  ['FI (+2): UTC 2015-01-01 00:00 = local 02:00 → expect index 1', [{ t: U(2015, 0, 1, 0, 0), temp: 6 }], 2015, 2],
  ['GB (0): UTC 2015-12-31 23:50 → expect index 8759', [{ t: U(2015, 11, 31, 23, 50), temp: 7 }], 2015, 0],
  ['GB (0): UTC 2016-01-01 00:00 (in the 2016 file only) → index 8759 of 2015 cannot be filled from the 2015 file', [{ t: U(2016, 0, 1, 0, 0), temp: 8 }], 2015, 0],
  ['Leap 2016 FR: local 28 Feb 24:00 (= 29 Feb 00:00; UTC 28 Feb 23:00) → EPW keeps it as 28 Feb hour 24 (index 1415)', [{ t: U(2016, 1, 28, 23, 0), temp: 9 }], 2016, 1],
  ['Leap 2016 FR: local 1 Mar 00:00 (UTC 29 Feb 23:00) → where does it go?', [{ t: U(2016, 1, 29, 23, 0), temp: 10 }], 2016, 1],
  ['Leap 2016 FR: local 1 Mar 01:00 (UTC 1 Mar 00:00) → expect index 1416 (1 Mar hour 1)', [{ t: U(2016, 2, 1, 0, 0), temp: 11 }], 2016, 1],
  ['Leap 2016 FR: local 31 Dec 24:00 (UTC 31 Dec 23:00) → expect 8759', [{ t: U(2016, 11, 31, 23, 0), temp: 12 }], 2016, 1],
  ['Nearest rule: readings at local 12:29 and 12:31 → 12:29 to index 11 (ends 12:00)? No: 12:29 is 29 min from 12:00 → index 11; 12:31 → index 12', [{ t: U(2015, 0, 1, 11, 29), temp: 13 }, { t: U(2015, 0, 1, 11, 31), temp: 14 }], 2015, 1],
  ['Nearest rule: exactly 30 min (local 12:30) → kept (dist > 30 rejected only); which hour?', [{ t: U(2015, 0, 1, 11, 30), temp: 15 }], 2015, 1],
  ['Day boundary: local 2 Jan 00:00 (UTC 1 Jan 23:00) → expect index 23', [{ t: U(2015, 0, 1, 23, 0), temp: 16 }], 2015, 1],
];
for (const [label, obs, y, off] of rows) console.log(`${label}\n    → ${where(obs, y, off)}`);
