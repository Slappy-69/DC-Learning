// 48. Measured hourly weather (owner 2026-10-30, OPEN-QUESTIONS 106–107): EPW upload, wet bulb by the ASHRAE
// psychrometric equations, design temperatures, and the weather in the engine, flags, study files and PDF.

import assert from 'node:assert/strict';
import { referenceT1 } from '../src/engine/defaults.js';
import { runModel } from '../src/engine/run.js';
import { readEpw, wetBulb, humidityRatio, satPressure, exceeded, HOURS } from '../src/engine/weather.js';
import { studyFile, readStudyFile } from '../src/engine/study.js';
import { inputRows } from '../src/report/report.js';

// A made-up EPW year: a seasonal and daily temperature cycle, dew point 6 K below, sea-level pressure.
export function fakeEpw({ design = true, leap = false, gap = 0, offset = 0, lat = 51.5, lon = -0.1 } = {}) {
  const head = [
    `LOCATION,Testville,-,GBR,Made-up test file,000000,${lat},${lon},0.0,20.0`,
    design ? 'DESIGN CONDITIONS,1,Climate Design Data 2009 ASHRAE Handbook,,Heating,1,-5,-3,-9,1,0,-7,1,1,8,2,7,2,3,40,Cooling,7,9,30.5,19.5,29,19,27,18.5,21.2,28,20.5,27,19.8,26,4,40,17,12,22,16,11.5,21,15,11,20,55,28,53,27,51,26,700,Extremes,9,8,7,20,-8,33,2,1,-9,34,-10,35,-11,36,-12,37' : 'DESIGN CONDITIONS,0',
    'TYPICAL/EXTREME PERIODS,0', 'GROUND TEMPERATURES,0', 'HOLIDAYS/DAYLIGHT SAVINGS,No,0,0,0', 'COMMENTS 1,test', 'COMMENTS 2,test', 'DATA PERIODS,1,1,Data,Sunday, 1/ 1,12/31',
  ];
  const ml = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const rows = [];
  let h = 0;
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= ml[m - 1]; d++) for (let hr = 1; hr <= 24; hr++) {
    const doy = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][m - 1] + Math.min(d, ml[m - 1] === 29 && m === 2 ? 28 : d) - 1; // calendar day: a leap day repeats 28 Feb
    const t = 11 + offset + 9 * -Math.cos((2 * Math.PI * (doy - 15)) / 365) + 4 * Math.cos((2 * Math.PI * (hr - 15)) / 24);
    const miss = gap && h >= 3000 && h < 3000 + gap;
    rows.push(`${2010 + (m % 3)},${m},${d},${hr},60,A7A7,${miss ? 99.9 : t.toFixed(1)},${(t - 6).toFixed(1)},70,101325,0,0,0,0,0,0,0,0,0,0,180,3.0,5,5,20,7777,9,999999999,10,0.1,0,88,0.2,0,1.0`);
    h++;
  }
  return [...head, ...rows].join('\r\n');
}

export async function weatherTests(test, ctxRuns) {
  await test('48a. EPW reader and psychrometrics: wet bulb matches the ASHRAE chart and saturation table; the year is read hour by hour (29 February left out, gaps of 6 h or less filled, longer gaps refused); design temperatures from the file\'s ASHRAE cooling design line, or the 0.4 % hottest hours without one; a file that is not EPW is refused', () => {
    // ASHRAE Fundamentals (2017) table 3: saturation pressure 2339 Pa at 20 °C, 259.9 Pa at −10 °C (over ice).
    assert.ok(Math.abs(satPressure(20) - 2339) < 2 && Math.abs(satPressure(-10) - 259.9) < 0.1);
    const p = 101325;
    const wb = (t, rh) => wetBulb(t, humidityRatio(t, null, rh, p), p);
    // Psychrometric chart (sea level): 25 °C and 50 % → 17.9 °C; 35 °C and 40 % → 23.9 °C; saturated air: wet bulb = dry bulb.
    assert.ok(Math.abs(wb(25, 50) - 17.9) < 0.15, `25/50: ${wb(25, 50)}`);
    assert.ok(Math.abs(wb(35, 40) - 23.9) < 0.15, `35/40: ${wb(35, 40)}`);
    assert.ok(Math.abs(wb(20, 100) - 20) < 0.02 && Math.abs(wb(-5, 100) + 5) < 0.02);
    const r = readEpw(fakeEpw(), 'test.epw');
    assert.ok(r.ok, r.error);
    const w = r.weather;
    assert.equal(w.dryBulb.length, HOURS); assert.equal(w.wetBulb.length, HOURS);
    assert.equal(w.designDB, 30.5); assert.equal(w.designWB, 21.2);
    assert.match(w.designBasis, /design conditions \(Climate Design Data 2009 ASHRAE Handbook/);
    assert.ok(w.wetBulb.every((x, h) => x <= w.dryBulb[h] + 1e-9), 'wet bulb above dry bulb');
    const leap = readEpw(fakeEpw({ leap: true }), 'leap.epw');
    assert.ok(leap.ok && leap.warnings.some((x) => /29 February/.test(x)));
    assert.deepEqual(leap.weather.dryBulb, w.dryBulb, 'the leap-day file does not match the same calendar without 29 February');
    const noDesign = readEpw(fakeEpw({ design: false }), 'nd.epw');
    assert.equal(noDesign.weather.designDB, Math.round(exceeded(noDesign.weather.dryBulb) * 10) / 10);
    assert.match(noDesign.weather.designBasis, /0\.4 % hottest hours.*understates/);
    const g6 = readEpw(fakeEpw({ gap: 6 }), 'g6.epw');
    assert.ok(g6.ok && g6.weather.dryBulb.every(Number.isFinite));
    assert.ok(!readEpw(fakeEpw({ gap: 7 }), 'g7.epw').ok, 'a 7-hour gap accepted');
    assert.ok(!readEpw('Year,Month,Day\n2020,1,1', 'x.csv').ok);
    assert.ok(!readEpw(fakeEpw().split('\r\n').slice(0, 4000).join('\n'), 'short.epw').ok);
    return `wet bulb 25 °C/50 % ${wb(25, 50).toFixed(2)} °C, 35 °C/40 % ${wb(35, 40).toFixed(2)} °C; design ${w.designDB}/${w.designWB} °C from the file's ASHRAE line; without it ${noDesign.weather.designDB}/${noDesign.weather.designWB} °C (0.4 % of hours); leap day dropped, 6 h gap filled, 7 h refused`;
  });

  await test('48b. Measured weather in the engine: T1 with a hotter EPW year raises the design load and the hourly PUE; every option carries a "Weather" flag (station, distance, design basis) and no synthetic-climate flag; the weather survives a study file; the PDF lists it in one row; without a file nothing changes', () => {
    const base = ctxRuns.runT1;
    const inp = referenceT1({ analysisStart: ctxRuns.START });
    inp.settings.generationCap = 60;
    const syn = runModel(inp);
    const r = readEpw(fakeEpw({ offset: 6, lat: inp.project.lat + 0.3, lon: inp.project.lon }), 'hot.epw');
    const inpW = { ...inp, weather: r.weather };
    const run = runModel(inpW);
    const L = run.options.find((o) => o.rank === 1), Ls = syn.options.find((o) => o.rank === 1);
    assert.equal(run.ctx.prof.designTemp, 30.5); assert.equal(run.ctx.prof.designWetbulb, 21.2);
    assert.equal(run.ctx.prof.temp[4000], r.weather.dryBulb[4000]);
    // Hotter weather: higher peak and average cooling power for every cooling type.
    for (const id of Object.keys(run.ctx.cooling)) {
      assert.ok(run.ctx.cooling[id].coolPeak >= syn.ctx.cooling[id].coolPeak - 1e-12, `${id} peak`);
      assert.ok(run.ctx.cooling[id].coolAvg >= syn.ctx.cooling[id].coolAvg - 1e-12, `${id} average`);
    }
    assert.ok(Object.keys(run.ctx.cooling).some((id) => run.ctx.cooling[id].coolAvg > syn.ctx.cooling[id].coolAvg + 1e-6), 'no cooling type uses more energy in the hotter year');
    for (const o of run.options) {
      const f = o.flags.find((x) => x.id === 'weather');
      assert.ok(f && /uploaded EPW file "hot\.epw".*km from the pin.*design 30\.5 °C dry bulb and 21\.2 °C wet bulb/.test(f.message), `${o.id}: ${f && f.message}`);
      assert.ok(!o.flags.some((x) => x.path === 'project.climate'), `${o.id} still flags the synthetic climate`);
    }
    assert.ok(syn.options.every((o) => o.flags.some((x) => x.path === 'project.climate') && !o.flags.some((x) => x.id === 'weather')));
    const km = /, ([\d.]+) km from the pin/.exec(L.flags.find((x) => x.id === 'weather').message);
    assert.ok(km && Math.abs(Number(km[1]) - 33) < 2, `distance ${km && km[1]}`);
    // The base T1 run (no file) is unchanged by the weather code: same leader as the suite's run.
    assert.equal(base.options.find((o) => o.rank === 1).id, runModel(referenceT1({ analysisStart: ctxRuns.START })).options.find((o) => o.rank === 1).id);
    // Study round trip.
    const back = readStudyFile(JSON.stringify(studyFile(inpW, run, {})));
    assert.ok(back.ok && back.inputs.weather.source === 'epw' && back.inputs.weather.dryBulb.length === HOURS && back.warnings.length === 0, back.warnings.join(' '));
    assert.deepEqual(back.inputs.weather.wetBulb, r.weather.wetBulb);
    // PDF inputs list.
    const rows = inputRows(inpW).filter((x) => x.section === 'Weather');
    assert.equal(rows.length, 1); assert.match(rows[0].value, /hot\.epw/);
    assert.match(inputRows(inp).find((x) => x.section === 'Weather').value, /synthetic/);
    return `design ${run.ctx.prof.designTemp}/${run.ctx.prof.designWetbulb} °C (synthetic ${syn.ctx.prof.designTemp.toFixed(1)}/${syn.ctx.prof.designWetbulb.toFixed(1)} °C); leader LCOE €${L.eco.lcoe.toFixed(1)} against €${Ls.eco.lcoe.toFixed(1)}/MWh with the synthetic year; cooling never lower, higher for the mechanically cooled types; ${run.options.length} options flagged; study and PDF keep it`;
  });
}
