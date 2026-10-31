// R2 NOAA method review (2026-10-31): probes of prepareYear / typicalYear on made-up stations.
// Run: node energy-strategy-tool/verification/weather/scripts/noaa/method-probes.mjs
//  A. Reporting interval: the same climate reported every hour, every 3 hours and every 6 hours (synoptic hours, UTC).
//     Does the station pass the 80 % rule, and how far does the 0.4 % design dry bulb move?
//  B. Unequal month counts: winter months usable in 10 years, summer months in 15. Design compared with equal weighting.
//  C. Smoothing indices at a month join: which hours change.
//  D. Wet-bulb design hours: does a long humidity gap (filled from the same hour on nearby days) enter the design wet bulb?
import { hourlyFromObs, prepareYear, typicalYear } from '../../../../app/src/engine/weathertmy.js';
import { HOURS, exceeded } from '../../../../app/src/engine/weather.js';

// Climate: seasonal + daily cycle peaking 15:00 local, sharper than a sine (afternoon peak), plus a per-year anomaly.
function temp(y, ms, off) {
  const local = new Date(ms + off * 3600e3);
  const doy = (Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - Date.UTC(local.getUTCFullYear(), 0, 1)) / 864e5;
  const hr = local.getUTCHours() + local.getUTCMinutes() / 60;
  const season = 14 + 10 * -Math.cos((2 * Math.PI * (doy - 15)) / 365);
  const swing = 5 + 3 * -Math.cos((2 * Math.PI * (doy - 15)) / 365); // 2 K in winter, 8 K half-swing in summer
  const c = Math.cos((2 * Math.PI * (hr - 15)) / 24);
  const day = swing * (c > 0 ? Math.pow(c, 0.7) : -Math.pow(-c, 1.3));
  const weather = 3 * Math.sin(doy * 0.9 + y) * Math.sin(doy * 0.23 + 2 * y); // day-to-day variation
  return season + day + weather + ((y % 5) - 2) * 0.4;
}
function stationYears(years, stepH, off = 1, opts = {}) {
  return years.map((y) => {
    const obs = [];
    for (let ms = Date.UTC(y, 0, 1); ms < Date.UTC(y + 1, 0, 1); ms += stepH * 3600e3) {
      const t = Math.round(temp(y, ms, off) * 10) / 10;
      let dew = Math.round((t - 6) * 10) / 10;
      if (opts.dewGap && opts.dewGap(y, ms)) dew = NaN;
      obs.push({ t: ms, temp: t, dew, rh: NaN, p: 1000, wind: 3 + (y % 3) });
    }
    const months = prepareYear(hourlyFromObs(obs, y, off), 100);
    if (opts.dropMonths) for (const m of opts.dropMonths(y)) months[m] = null;
    return { year: y, months };
  });
}
const years = Array.from({ length: 15 }, (v, i) => 2010 + i);

console.log('A. Reporting interval (same climate):');
for (const step of [1, 3, 6]) {
  const ys = stationYears(years, step);
  const usable = ys.reduce((s, y) => s + y.months.filter(Boolean).length, 0);
  const r = typicalYear(ys);
  console.log(`   every ${step} h: ${usable}/180 month-years usable; design DB ${r.ok ? r.design.db : r.reason} °C, WB ${r.ok ? r.design.wb : '-'} °C, design hours ${r.ok ? r.design.hours : '-'}`);
}

console.log('B. Unequal month counts (hourly reports):');
const full = stationYears(years, 1);
const rFull = typicalYear(full);
const winterShort = full.map((y) => ({ year: y.year, months: y.months.map((m, i) => ((i < 3 || i > 9) && y.year < 2015 ? null : m)) }));
const rWS = typicalYear(winterShort);
const summerShort = full.map((y) => ({ year: y.year, months: y.months.map((m, i) => (i >= 5 && i <= 7 && y.year < 2015 ? null : m)) }));
const rSS = typicalYear(summerShort);
console.log(`   all 15 years every month: design DB ${rFull.design.db}, hours ${rFull.design.hours}`);
console.log(`   Oct–Mar only 10 years (summer 15): design DB ${rWS.design.db}, hours ${rWS.design.hours}`);
console.log(`   Jun–Aug only 10 years (winter 15): design DB ${rSS.design.db}, hours ${rSS.design.hours}`);
// Equal weighting reference: per calendar month, the share of hours above x averaged over that month's years.
function equalWeighted(ys) {
  const lists = Array.from({ length: 12 }, () => []);
  ys.forEach((y) => y.months.forEach((m, i) => { if (m) lists[i].push(m.t); }));
  const above = (x) => lists.reduce((s, L, i) => s + (L.length ? L.reduce((a, t) => a + t.filter((v) => v > x).length, 0) / L.length : 0), 0) / HOURS;
  let lo = -30, hi = 50; for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (above(mid) > 0.004) lo = mid; else hi = mid; }
  return Math.round(lo * 10) / 10;
}
console.log(`   equal-weight reference (each calendar month averaged over its own years): full ${equalWeighted(full)}, winter-short ${equalWeighted(winterShort)}, summer-short ${equalWeighted(summerShort)}`);

console.log('C. Smoothing at the 1 Feb join: which hours of the typical year differ from the picked months?');
{
  // Two-level climate: picked January months at 0 °C flat, February at 10 °C flat.
  const flat = (v) => ({ t: new Float64Array(744).fill(v), W: new Float64Array(744).fill(0.003), wb: new Float64Array(744).fill(v - 3), wind: new Float64Array(744).fill(3), real: new Uint8Array(744).fill(1) });
  const mk = (y) => ({ year: y, months: Array.from({ length: 12 }, (v, m) => { const n = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m] * 24; const f = flat(m === 0 ? 0 : 10); for (const k of ['t', 'W', 'wb', 'wind', 'real']) f[k] = f[k].slice(0, n); return f; }) });
  const r = typicalYear(years.map(mk));
  const j = 744; const changed = [];
  for (let h = j - 12; h < j + 12; h++) changed.push(`${h - j}:${r.tmy.dryBulb[h]}`);
  console.log('   offset from the join (hour index − 744): value →', changed.join(' '));
}

console.log('D. A 3-day dew-point gap each July: are those hours in the design wet bulb?');
{
  const gap = (y, ms) => { const d = new Date(ms); return d.getUTCMonth() === 6 && d.getUTCDate() >= 10 && d.getUTCDate() < 13; };
  const a = typicalYear(stationYears(years, 1, 1, { dewGap: gap }));
  const b = typicalYear(stationYears(years, 1, 1));
  console.log(`   with gap: design WB ${a.design.wb} from ${a.design.hours} hours; without: ${b.design.wb} from ${b.design.hours} hours (hours equal → the filled humidity hours are counted)`);
}
