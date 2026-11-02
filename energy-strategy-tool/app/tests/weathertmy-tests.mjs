// 49. NOAA station records → typical year (release-time method, engine/weathertmy.js), on made-up observations.

import assert from 'node:assert/strict';
import { hourlyFromObs, prepareYear, typicalYear, fsStatistic, offsetFor, FIPS_TO_ISO, returnPeriodMax } from '../src/engine/weathertmy.js';
import { HOURS, exceeded } from '../src/engine/weather.js';

// Made-up station: METAR-style readings at hh:20 and hh:50 UTC; each year's temperature = climate + that year's anomaly
// (one value per year and month), dew point 5 K below, light wind.
function station({ years, anomaly, gaps = [], offset = 1, wind = () => 4 }) {
  const out = [];
  for (const y of years) {
    const obs = [];
    const t0 = Date.UTC(y, 0, 1) - 3600e3 * 2, t1 = Date.UTC(y + 1, 0, 1) + 3600e3 * 2;
    for (let ms = t0; ms < t1; ms += 1800e3) {
      const mm = new Date(ms + 20 * 60e3);
      const local = new Date(mm.getTime() + offset * 3600e3);
      const doy = (Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - Date.UTC(local.getUTCFullYear(), 0, 1)) / 864e5;
      const hr = local.getUTCHours() + local.getUTCMinutes() / 60;
      const temp = 10 + 9 * -Math.cos((2 * Math.PI * (doy - 15)) / 365) + 4 * Math.cos((2 * Math.PI * (hr - 15)) / 24) + anomaly(y, local.getUTCMonth());
      if (gaps.some(([gy, a, b]) => gy === y && mm >= a && mm < b)) continue;
      obs.push({ t: mm.getTime(), temp: Math.round(temp * 10) / 10, dew: Math.round((temp - 5) * 10) / 10, rh: NaN, p: 1013, wind: wind(y, local.getUTCMonth()) });
    }
    out.push({ year: y, obs });
  }
  return out;
}

export async function weatherTmyTests(test) {
  await test('49. NOAA station years → typical year (ISO 15927-4): readings at 20 and 50 past are put on the local-standard-time hour; gaps of up to 6 hours are filled and longer ones make the month unusable; for each month the year closest to the long-term distribution is picked; joins are smoothed; design conditions come from all years, not the typical year; a station without 10 usable years in a month is refused', () => {
    assert.equal(offsetFor('GB'), 0); assert.equal(offsetFor('FR'), 1); assert.equal(offsetFor('FI'), 2);
    assert.equal(Object.keys(FIPS_TO_ISO).length, 31); assert.equal(FIPS_TO_ISO.GM, 'DE'); assert.equal(FIPS_TO_ISO.UK, 'GB');
    // FS statistic: identical distributions → 0; shifted → larger.
    const base = Array.from({ length: 31 }, (v, i) => i), all = [...base, ...base].sort((a, b) => a - b);
    assert.ok(fsStatistic(base, all) < 0.02 && fsStatistic(base.map((x) => x + 10), all) > 0.2);
    const years = Array.from({ length: 15 }, (v, i) => 2010 + i);
    // Anomaly: year 2017 is exactly typical in every month; the others are warmer or cooler by up to 3 K.
    // The other 14 years come in warm/cool pairs of equal size, so the long-term distribution is centred on 2017.
    const others = years.filter((y) => y !== 2017);
    const anomaly = (y, m) => { if (y === 2017) return 0; const i = others.indexOf(y); return (i % 2 ? 1 : -1) * (1 + Math.floor(i / 2) * 0.3 + (m % 3) * 0.1); };
    // Readings removed for 7 days in March 2012 (168 hours, over 20 % of the month), 7 hours on 10 July 2014 and 5 hours on 5 May 2013.
    const gaps = [[2012, new Date(Date.UTC(2012, 2, 10, 3)), new Date(Date.UTC(2012, 2, 17, 3))], [2014, new Date(Date.UTC(2014, 6, 10, 3)), new Date(Date.UTC(2014, 6, 10, 11))], [2013, new Date(Date.UTC(2013, 4, 5, 3)), new Date(Date.UTC(2013, 4, 5, 9))]];
    const st = station({ years, anomaly, gaps });
    // Hour placement: in France (UTC+1) the 01:00 local value is the UTC 23:50 reading of 31 December rounded to 00:00
    // UTC? No: 00:00 UTC is 01:00 local, which ends hour 0; the 23:50 UTC reading is 10 minutes from it.
    const h2015 = hourlyFromObs(st.find((y) => y.year === 2015).obs, 2015, 1);
    assert.ok(h2015.temp.every(Number.isFinite), 'a complete year has an empty hour');
    const first = st.find((y) => y.year === 2015).obs.find((o) => o.t === Date.UTC(2014, 11, 31, 23, 50));
    assert.equal(h2015.temp[0], first.temp, 'hour 0 should hold the reading nearest 01:00 local');
    const prepared = st.map((y) => ({ year: y.year, months: prepareYear(hourlyFromObs(y.obs, y.year, 1), 50) }));
    assert.equal(prepared.find((y) => y.year === 2012).months[2], null, 'March 2012, 23 % missing, was used');
    assert.ok(prepared.find((y) => y.year === 2013).months[4], 'a 5-hour gap made May 2013 unusable');
    const jul14 = prepared.find((y) => y.year === 2014).months[6];
    assert.ok(jul14 && jul14.t.every(Number.isFinite), 'a 7-hour gap made July 2014 unusable');
    assert.equal(jul14.real.reduce((s, x) => s + x, 0), jul14.t.length - 7, 'the 7 hours filled from nearby days are not marked as fills');
    const r = typicalYear(prepared, { minYears: 10 });
    assert.ok(r.ok, r.reason);
    // Each month picks one of the most typical years: 2017 (no anomaly) or the ±1 K pair (humidity ratio grows faster
    // with warmth than it falls with cold, so the long-term humidity sits a little above 2017's and a slightly warm
    // year can rank first); never a year 1.3 K or more from the climate.
    const closest = new Set([2017, others[0], others[1]]);
    assert.ok(r.picks.every((p) => closest.has(p.year)), `picks ${r.picks.map((p) => p.year)}`);
    assert.ok(r.picks.filter((p) => p.year === 2017).length >= 6, `2017 picked in ${r.picks.filter((p) => p.year === 2017).length} months`);
    assert.equal(r.tmy.dryBulb.length, HOURS); assert.equal(r.tmy.wetBulb.length, HOURS);
    assert.ok(r.tmy.wetBulb.every((x, h) => x <= r.tmy.dryBulb[h]), 'wet bulb above dry bulb');
    // Design from all years: above the typical year's own 0.4 % (warm anomalies in other years).
    // Design (OPEN-QUESTIONS 115): n = 20 and n = 50 return-period maxima from the annual maxima of readings, above the
    // typical year's own hottest hour; n = 50 above n = 20; the 0.4 % value kept for information.
    assert.equal(r.design.kind, 'extreme');
    assert.ok(r.design.db20 > Math.max(...r.tmy.dryBulb), `n = 20 ${r.design.db20} against the typical year's hottest ${Math.max(...r.tmy.dryBulb)}`);
    assert.ok(r.design.db50 > r.design.db20 && r.design.wb50 >= r.design.wb20 && r.design.wb20 <= r.design.db20);
    assert.ok(r.design.db04 < r.design.db20 && r.design.hours > 14 * 8000);
    // Gumbel factors as ASHRAE: n = 20 → 1.866 s, n = 50 → 2.592 s above the mean of the annual maxima.
    const ann = [30, 31, 32, 33, 34];
    const m = 32, sd = Math.sqrt(2.5);
    assert.ok(Math.abs(returnPeriodMax(ann, 20) - (m + 1.866 * sd)) < 0.002 && Math.abs(returnPeriodMax(ann, 50) - (m + 2.592 * sd)) < 0.002);
    // Islands on their own clocks (R2 M2): Canary Islands UTC+0, Azores UTC−1, Madeira and mainland Spain as before.
    assert.equal(offsetFor('ES', -15.4), 0); assert.equal(offsetFor('ES', -3.7), 1); assert.equal(offsetFor('PT', -25.7), -1); assert.equal(offsetFor('PT', -16.9), 0);
    // 6-hourly readings (R2 H1): gaps of 5 hours are not filled by lines, so such a station's months are not usable.
    const six = station({ years: [2015], anomaly: () => 0 }).map((y) => ({ year: y.year, months: prepareYear(hourlyFromObs(y.obs.filter((o) => new Date(o.t).getUTCHours() % 6 === 0 && new Date(o.t).getUTCMinutes() === 50), y.year, 1), 50) }));
    assert.ok(six[0].months.every((mo) => mo === null), '6-hourly months were used');
    assert.ok(six[0].months.reasons.every((x) => /never reported|80 %/.test(x)), six[0].months.reasons.join(' | '));
    // Joins smoothed: no step larger than the hour-to-hour changes within months.
    const steps = r.tmy.dryBulb.slice(1).map((x, h) => Math.abs(x - r.tmy.dryBulb[h]));
    assert.ok(Math.max(...steps) < 2, `largest hour-to-hour step ${Math.max(...steps)}`);
    // Wind tie-break: when three years tie on temperature and humidity, the one with wind nearest the mean wins.
    const tie = station({ years, anomaly: (y) => ([2014, 2017, 2020].includes(y) ? 0 : 3 * (y % 2 ? 1 : -1)), wind: (y) => (y === 2020 ? 4 : y === 2014 ? 9 : y === 2017 ? 1 : 4) });
    const rt = typicalYear(tie.map((y) => ({ year: y.year, months: prepareYear(hourlyFromObs(y.obs, y.year, 1), 50) })));
    assert.ok(rt.picks.every((p) => p.year === 2020), `wind tie-break picks ${rt.picks.map((p) => p.year)}`);
    // Too few years.
    const few = typicalYear(prepared.slice(0, 9));
    assert.ok(!few.ok && /fewer than 10/.test(few.reason));
    return `15 made-up years: every month picks 2017 or the ±1 K pair (${r.picks.filter((p) => p.year === 2017).length} months 2017); 5 h and 7 h gaps filled from the same hour on nearby days (lines only up to 2 h; fills left out of the design values), 23 % missing drops the month; design n = 20 ${r.design.db20} °C and n = 50 ${r.design.db50} °C from ${r.design.nYears} annual maxima (0.4 % ${r.design.db04} °C; typical year's hottest hour ${Math.max(...r.tmy.dryBulb)} °C); island clocks; 6-hourly months refused; wind breaks a three-way tie; 9 years refused`;
  });
}
