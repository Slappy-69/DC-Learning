// R1 (Opus review, 2026-10-31): readEpw on altered copies of a real file (in memory only).
// Run from energy-strategy-tool/app:  node ../verification/weather/scripts/epw/robustness.mjs /tmp/epwdl/files/NLD_Amsterdam062400_IWEC.epw
import fs from 'node:fs';
import { readEpw, weatherSummary, applyWeather } from '../../../../app/src/engine/weather.js';

const base = fs.readFileSync(process.argv[2] || '/tmp/epwdl/files/NLD_Amsterdam062400_IWEC.epw', 'utf8');
const L = base.split(/\r?\n/).filter((l, i, a) => !(i === a.length - 1 && l === ''));
const head = L.slice(0, 8), data = L.slice(8);
const ref = readEpw(base, 'ams.epw').weather;
const show = (label, text, extra) => {
  const r = readEpw(text, 'x.epw');
  if (!r.ok) { console.log(`${label}: REFUSED — ${r.error}`); return r; }
  const w = r.weather;
  const diff = w.dryBulb.reduce((n, x, h) => n + (Math.abs(x - ref.dryBulb[h]) > 1e-9 ? 1 : 0), 0);
  console.log(`${label}: ok; lat ${w.lat} lon ${w.lon}; name "${w.name}" country "${w.country}"; years ${w.years}; design ${w.designDB}/${w.designWB}; ${diff} dry-bulb hours differ from the original${extra ? '; ' + extra(w) : ''}${r.warnings.length ? '; warnings: ' + r.warnings.join(' | ') : ''}`);
  return r;
};
const set = (rows, i, field, v) => { const f = rows[i].split(','); f[field] = v; rows[i] = f.join(','); };

show('original', base);
show('BOM + CRLF', '﻿' + L.join('\r\n'));
show('blank lines between rows and at the end', [...head, ...data.flatMap((l, i) => (i % 1000 === 0 ? [l, ''] : [l])), '', ''].join('\n'));
show('old Mac line ends (CR only)', L.join('\r'));
// LOCATION with a comma inside the city name (not allowed by the format, but seen in hand-made files).
show('comma in LOCATION city', [head[0].replace('AMSTERDAM', 'AMSTERDAM, SCHIPHOL'), ...head.slice(1), ...data].join('\n'));
show('LOCATION latitude 152.3 (out of range)', [head[0].replace(',52.30,', ',152.30,'), ...head.slice(1), ...data].join('\n'));
show('southern hemisphere (lat −33.9, Sydney-like)', [head[0].replace(',52.30,4.77,', ',-33.95,151.18,'), ...head.slice(1), ...data].join('\n'));
// Header with 7 lines (COMMENTS 2 missing): the first data row is line index 7.
show('7 header lines (no COMMENTS 2)', [...head.slice(0, 6), head[7], ...data].join('\n'));
// First hour of the year missing (99.9).
{ const d = [...data]; set(d, 0, 6, '99.9'); show('first hour dry bulb missing (99.9)', [...head, ...d].join('\n')); }
{ const d = [...data]; set(d, 8759, 6, '99.9'); show('last hour dry bulb missing (99.9)', [...head, ...d].join('\n')); }
// Negative zero and a plausible value just under the missing code.
{ const d = [...data]; set(d, 100, 6, '-0.0'); set(d, 4000, 6, '99.8'); show('−0.0 at h100, 99.8 °C at h4000', [...head, ...d].join('\n'), (w) => `h100 ${Object.is(w.dryBulb[100], -0) ? '-0' : w.dryBulb[100]}, h4000 ${w.dryBulb[4000]}, wet ${w.wetBulb[4000]}, design ${w.designDB}`); }
// Out-of-range: dew point far above dry bulb, RH 150, pressure 120000, pressure 40000.
{ const d = [...data]; set(d, 5000, 7, '40'); set(d, 5001, 7, '99.9'); set(d, 5001, 8, '150'); set(d, 5002, 9, '40000'); show('dp 40 > db, RH 150 without dp, pressure 40 kPa', [...head, ...d].join('\n'), (w) => `h5000 ${w.dryBulb[5000]}/${w.wetBulb[5000]}, h5001 ${w.dryBulb[5001]}/${w.wetBulb[5001]}, h5002 ${w.wetBulb[5002]} (orig ${ref.wetBulb[5002]})`); }
// No humidity at all.
{ const d = data.map((l) => { const f = l.split(','); f[7] = '99.9'; f[8] = '999'; return f.join(','); }); show('no dew point or RH in any hour', [...head, ...d].join('\n'), (w) => `design WB ${w.designWB} (file's design line still used)`); }
// Leap year file: 8,784 rows (AMY 2020 calendar).
{ const out = []; for (const l of data) { out.push(l); const f = l.split(','); if (f[1] === '2' && f[2] === '28') { f[2] = '29'; out.push(f.join(',')); } } show('leap-year file (29 Feb rows added)', [...head, ...out].join('\n')); }
// File starting on 1 July (Jul–Dec 2020 then Jan–Jun 2021).
{ const i = data.findIndex((l) => l.split(',')[1] === '7'); const rot = [...data.slice(i), ...data.slice(0, i)].map((l, k) => { const f = l.split(','); f[0] = k < 8760 - i ? '2020' : '2021'; return f.join(','); }); show('file starting 1 July (2020–2021)', [...head, ...rot].join('\n')); }
// Two full years (17,520 rows): the second silently overwrites the first.
{ const y2 = data.map((l) => { const f = l.split(','); f[0] = '2001'; f[6] = String(Number(f[6]) + 5); return f.join(','); }); show('two years in one file (second 5 K hotter)', [...head, ...data, ...y2].join('\n'), (w) => `mean dry bulb ${(w.dryBulb.reduce((a, b) => a + b, 0) / 8760).toFixed(2)} (original ${(ref.dryBulb.reduce((a, b) => a + b, 0) / 8760).toFixed(2)})`); }
// Half-hourly file (minute 30 and 60 rows): every hour written twice, the later wins.
{ const out = []; for (const l of data) { const f = l.split(','); const g = [...f]; g[4] = '30'; g[6] = String(Number(f[6]) - 3); out.push(g.join(',')); out.push(l); } show('half-hourly rows (minute 30 row 3 K cooler before minute 60)', [...head, ...out].join('\n')); }
// A month with day 31 in a 30-day month (bad row) overwrites the next month's first day.
{ const d = [...data]; const i = d.findIndex((l) => l.startsWith('1995,4,30,1,') || /^\d+,4,30,1,/.test(l)); const f = d[i].split(','); f[2] = '31'; f[6] = '55'; d.splice(i + 24, 0, f.join(',')); show('an invalid date 31 April with 55 °C', [...head, ...d].join('\n'), (w) => `1 May hour 1 = ${w.dryBulb[(120) * 24]} (original ${ref.dryBulb[120 * 24]}), max ${Math.max(...w.dryBulb)}`); }
// DESIGN CONDITIONS present but in another layout (no 'Cooling' token) or empty.
show('DESIGN CONDITIONS,0', [head[0], 'DESIGN CONDITIONS,0', ...head.slice(2), ...data].join('\n'));
show('DESIGN CONDITIONS with lower-case "cooling" and spaces', [head[0], head[1].replace(',Cooling,', ', cooling ,'), ...head.slice(2), ...data].join('\n'));
// 6-hour gap and 7-hour gap in dew point only (falls back to RH).
{ const d = [...data]; for (let h = 3000; h < 3010; h++) set(d, h, 7, '99.9'); show('10-hour dew-point gap (RH present)', [...head, ...d].join('\n'), (w) => `wet bulb diff at h3005 ${(w.wetBulb[3005] - ref.wetBulb[3005]).toFixed(1)} K`); }
// Far from the pin: distance text.
{ const s = weatherSummary({ weather: ref, project: { lat: -33.9, lon: 151.2 } }); console.log(`summary for a pin in Sydney: ${s.text.slice(0, 120)}… km=${s.km.toFixed(0)}`); }
{ const s = weatherSummary({ weather: ref, project: { lat: 52.3, lon: 4.77 } }); console.log(`summary for a pin on the station: ${s.text}`); }
// applyWeather: design used vs file max.
{ const prof = { stats: {}, temp: null }; const a = applyWeather(prof, { weather: ref, project: { lat: 52.3, lon: 4.77 } }); console.log(`applyWeather: designTemp ${a.designTemp}, designWetbulb ${a.designWetbulb}, tMax ${a.stats.tMax}, twMax ${a.stats.twMax}`); }
// Hours written 0–23 (some converters): hour 0 rows are skipped and the rest shift by one hour.
{ const d = data.map((l) => { const f = l.split(','); f[3] = String(Number(f[3]) - 1); return f.join(','); }); show('hours numbered 0–23', [...head, ...d].join('\n')); }
// 400 rows missing in scattered single hours (rows deleted): accepted, filled by lines.
{ const d = data.filter((l, i) => i % 22 !== 5); show(`${data.length - data.filter((l, i) => i % 22 !== 5).length} single rows deleted`, [...head, ...d].join('\n')); }
