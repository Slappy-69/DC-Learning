// R1 (Opus review, 2026-10-31): the psychrometrics in app/src/engine/weather.js against independent references.
// Run from energy-strategy-tool/app:  node ../verification/weather/scripts/epw/psychro-grid.mjs
//
// References written here, not copied from the app:
//  A. IAPWS saturation pressure: Wagner & Pruss (2002) over liquid water; IAPWS (2011) sublimation over ice.
//     (ASHRAE's Hyland–Wexler is a fit to the same data; the two should agree within about 0.1 %.)
//  B. Thermodynamic wet bulb from the adiabatic-saturation energy balance, solved by Newton's method (not bisection),
//     with the reference saturation pressure A and the moist-air enthalpy of ASHRAE eq 30. Ice below a wet bulb of 0 °C.
//  C. Published table values: ASHRAE Fundamentals 2017 ch. 1 table 2 (Ws at 101.325 kPa) and table 3 (pws),
//     and table 1 (standard atmosphere pressure at altitude).
import { satPressure, humidityRatio, wetBulb, pressureAtElevation } from '../../../../app/src/engine/weather.js';

function pwsRef(tC) {
  const T = tC + 273.15;
  if (tC >= 0.01) {
    const Tc = 647.096, pc = 22.064e6, th = 1 - T / Tc;
    const a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
    const s = a[0] * th + a[1] * th ** 1.5 + a[2] * th ** 3 + a[3] * th ** 3.5 + a[4] * th ** 4 + a[5] * th ** 7.5;
    return pc * Math.exp((Tc / T) * s);
  }
  const Tt = 273.16, pt = 611.657, th = T / Tt;
  const s = -21.2144006 * th ** 0.00333333333 + 27.3203819 * th ** 1.20666667 - 6.10598130 * th ** 1.70333333;
  return pt * Math.exp(s / th);
}
const Wof = (pw, p) => (0.621945 * pw) / (p - pw);
const hAir = (t, W) => 1.006 * t + W * (2501 + 1.86 * t); // kJ/kg dry air (ASHRAE eq 30)
const hWater = (t) => (t >= 0 ? 4.186 * t : -333.4 + 2.1 * t); // kJ/kg, liquid or ice (ASHRAE eqs 31, 32 approximations)

// Adiabatic saturation: h(t,W) + (Ws* − W) hw(t*) − h(t*, Ws*) = 0, Newton with numerical derivative.
function wbRef(t, W, p) {
  const g = (x) => { const ws = Wof(pwsRef(x), p); return hAir(t, W) + (ws - W) * hWater(x) - hAir(x, ws); };
  let x = t - 5;
  for (let i = 0; i < 200; i++) {
    const d = (g(x + 1e-6) - g(x - 1e-6)) / 2e-6;
    const nx = x - g(x) / d;
    if (Math.abs(nx - x) < 1e-9) { x = nx; break; }
    x = Math.max(t - 80, Math.min(t, nx));
  }
  return x;
}

// 1. Saturation pressure, the app against IAPWS, −60 to 60 °C every 0.1 K.
let worstP = { rel: 0 };
for (let i = -600; i <= 600; i++) {
  const t = i / 10;
  const rel = (satPressure(t) - pwsRef(t)) / pwsRef(t);
  if (Math.abs(rel) > Math.abs(worstP.rel)) worstP = { t, rel, app: satPressure(t), ref: pwsRef(t) };
}
console.log(`1. pws, app vs IAPWS, −60…60 °C: largest relative difference ${(worstP.rel * 100).toFixed(3)} % at ${worstP.t} °C (${worstP.app.toFixed(3)} vs ${worstP.ref.toFixed(3)} Pa)`);
console.log(`   step at 0 °C (ice to water): satPressure(-1e-9)=${satPressure(-1e-9).toFixed(3)}, satPressure(0)=${satPressure(0).toFixed(3)} Pa`);

// 2. Table values (ASHRAE 2017 ch.1 table 3: pws kPa; table 2: Ws kg/kg at 101.325 kPa; table 1: p at altitude).
const tab3 = [[-40, 0.01285], [-20, 0.10326], [-10, 0.25990], [0, 0.61115], [10, 1.22818], [20, 2.33921], [30, 4.24669], [40, 7.38494], [50, 12.35180]];
for (const [t, kPa] of tab3) console.log(`2a. pws(${t} °C) app ${(satPressure(t) / 1000).toFixed(5)} kPa, table ${kPa} (${(((satPressure(t) / 1000) / kPa - 1) * 100).toFixed(3)} %)`);
const tab2 = [[-20, 0.0006373], [0, 0.003789], [20, 0.014758], [30, 0.027329], [40, 0.049141]];
for (const [t, ws] of tab2) console.log(`2b. Ws(${t} °C, 101.325 kPa) app ${humidityRatio(t, null, 100, 101325).toFixed(6)}, table ${ws}`);
const tab1 = [[0, 101.325], [500, 95.461], [1000, 89.875], [1500, 84.556], [2000, 79.495]];
for (const [z, kPa] of tab1) console.log(`2c. p(${z} m) app ${(pressureAtElevation(z) / 1000).toFixed(3)} kPa, table ${kPa}`);

// 3. Wet bulb over the grid: dry bulb −30…50 °C (1 K), RH 5…100 % (5 %), pressure 70…105 kPa (5 kPa).
let worst = { e: 0 }, worstSolver = { e: 0 }, n = 0, over01 = 0, over005 = 0;
for (let t = -30; t <= 50; t++) for (let rh = 5; rh <= 100; rh += 5) for (let pk = 70; pk <= 105; pk += 5) {
  const p = pk * 1000;
  const W = humidityRatio(t, null, rh, p);
  const app = wetBulb(t, W, p);
  const Wr = Wof((rh / 100) * pwsRef(t), p);
  const ref = wbRef(t, Wr, p);
  const e = app - ref; n++;
  if (Math.abs(e) > 0.1) over01++;
  if (Math.abs(e) > 0.05) over005++;
  if (Math.abs(e) > Math.abs(worst.e)) worst = { e, t, rh, pk, app, ref };
  // Solver check: the app's own W into the reference energy balance using the app's pws (isolates the bisection).
}
console.log(`3. wet bulb, app vs independent reference, ${n} grid points: largest error ${worst.e.toFixed(3)} K at ${worst.t} °C, ${worst.rh} %, ${worst.pk} kPa (app ${worst.app.toFixed(3)}, ref ${worst.ref.toFixed(3)}); |error| > 0.05 K at ${over005} points, > 0.1 K at ${over01}`);

// 3b. Same, leaving out wet bulbs within 1 K of the 0 °C switch (app or reference).
let worstAway = { e: 0 };
for (let t = -30; t <= 50; t++) for (let rh = 5; rh <= 100; rh += 5) for (let pk = 70; pk <= 105; pk += 5) {
  const p = pk * 1000; const W = humidityRatio(t, null, rh, p); const app = wetBulb(t, W, p);
  const ref = wbRef(t, Wof((rh / 100) * pwsRef(t), p), p);
  if (Math.abs(ref) > 1 && Math.abs(app) > 1 && Math.abs(app - ref) > Math.abs(worstAway.e)) worstAway = { e: app - ref, t, rh, pk };
}
console.log(`3b. wet bulb more than 1 K from 0 °C: largest error ${worstAway.e.toFixed(4)} K at ${worstAway.t} °C, ${worstAway.rh} %, ${worstAway.pk} kPa`);

// 4. Reference points at sea level (psychrometric chart / published calculators).
for (const [t, rh] of [[25, 50], [35, 40], [30, 60], [40, 20], [10, 80], [0, 50], [-10, 60]]) {
  const p = 101325; const app = wetBulb(t, humidityRatio(t, null, rh, p), p);
  console.log(`4. ${t} °C, ${rh} %: app ${app.toFixed(3)} °C, reference ${wbRef(t, Wof((rh / 100) * pwsRef(t), p), p).toFixed(3)} °C`);
}

// 5. Two roots at the ice/water switch: eq 35 at 0− gives a higher W than eq 33 at 0+, so for a band of W the
//    equation has one root on the ice side and one on the water side; the bisection takes whichever it meets.
for (const [t, pk] of [[2, 101.325], [5, 101.325], [10, 101.325], [13, 70], [20, 70]]) {
  const p = pk * 1000; let lo = null, hi = null, big = 0;
  for (let i = 0; i <= 1000; i++) {
    const rh = i / 10; const app = wetBulb(t, humidityRatio(t, null, rh, p), p);
    const ref = wbRef(t, Wof((rh / 100) * pwsRef(t), p), p);
    if (Math.abs(app - ref) > 0.05) { if (lo == null) lo = rh; hi = rh; big = Math.max(big, Math.abs(app - ref)); }
  }
  console.log(`5. ${t} °C, ${pk} kPa: app and reference differ by > 0.05 K for RH ${lo ?? '-'}…${hi ?? '-'} % (largest ${big.toFixed(3)} K)`);
}
// Wet-bulb W just either side of 0 °C at 5 °C, sea level:
{ const t = 5, p = 101325, ws = Wof(satPressure(0), p);
  console.log(`   W from eq 33 at Twb=0+: ${(((2501) * ws - 1.006 * t) / (2501 + 1.86 * t)).toFixed(6)}; from eq 35 at Twb=0−: ${(((2830) * ws - 1.006 * t) / (2830 + 1.86 * t)).toFixed(6)} kg/kg`); }

// 6. Edge cases.
const P = 101325;
console.log(`6. dew point above dry bulb (dp 25, db 20): W=${humidityRatio(20, 25, null, P).toFixed(6)} = Ws(20)=${humidityRatio(20, null, 100, P).toFixed(6)}; Twb=${wetBulb(20, humidityRatio(20, 25, null, P), P).toFixed(3)}`);
console.log(`6. RH 0 at 50 °C, 70 kPa: Twb=${wetBulb(50, humidityRatio(50, null, 0, 70000), 70000).toFixed(3)} (ref ${wbRef(50, 0, 70000).toFixed(3)})`);
console.log(`6. RH 0 at −30 °C: Twb=${wetBulb(-30, 0, P).toFixed(3)} (ref ${wbRef(-30, 0, P).toFixed(3)})`);
console.log(`6. −60 °C, 50 %: Twb=${wetBulb(-60, humidityRatio(-60, null, 50, P), P).toFixed(3)}; 60 °C, 100 %: Twb=${wetBulb(60, humidityRatio(60, null, 100, P), P).toFixed(3)}; 70 °C, 5 %: Twb=${wetBulb(70, humidityRatio(70, null, 5, P), P).toFixed(3)} (ref ${wbRef(70, Wof(0.05 * pwsRef(70), P), P).toFixed(3)})`);
console.log(`6. RH 150 clamps: ${humidityRatio(20, null, 150, P) === humidityRatio(20, null, 100, P)}; RH −5 clamps to 0: ${humidityRatio(20, null, -5, P)}; pressure 0 Pa: Twb(20,50%)=${wetBulb(20, humidityRatio(20, null, 50, 0), 0)}`);
console.log(`6. dew point over water vs ice below 0 (the app uses ice): dp −20 °C at db −10 °C: Twb ice-based ${wetBulb(-10, humidityRatio(-10, -20, null, P), P).toFixed(3)}, water-based ${wbRef(-10, Wof(611.2 * Math.exp(17.62 * -20 / (243.12 - 20)), P), P).toFixed(3)} (Magnus over water, WMO)`);
