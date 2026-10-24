// 35–37. Work package 11: engine fixes from the Haiku checks and the Pego study, revision 3 (known issues 1–3, 8–11,
// 14–18; OPEN-QUESTIONS 68–76, answered 2026-10-24 with Claude's recommendations, accepted in advance by the owner).

import assert from 'node:assert/strict';
import { referenceT1, normalizeInputs, TECH } from '../src/engine/defaults.js';
import { addMonths } from '../src/engine/dates.js';
import { runModel } from '../src/engine/run.js';
import { buildContext } from '../src/engine/context.js';
import { evaluateOption } from '../src/engine/option.js';
import { sizeOption } from '../src/engine/sizing.js';
import { dispatchConfig, dispatchAll, dispatchYears, dispatchYearsNeeded } from '../src/engine/dispatch.js';
import { permittingTriggers } from '../src/engine/permitting.js';
import { prosCons, CARD_METRICS, PRO_SHARE } from '../src/engine/cards.js';

const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

export async function engineFixesTests(test, ctxRuns) {
  const run = ctxRuns.runT1;
  const ctx = run.ctx;
  const opts = run.options;

  await test('35. Work package 11, inputs and the dispatch years (known issues 1, 17, 18): an entered grid price adder replaces the country value and moves every grid option\'s cost by exactly the difference × grid energy; the timeline always reaches full load plus a year; the repeated year starts after the last change; dispatch stops early only with a run flag', () => {
    const out = [];
    // Issue 18: the adder.
    const inp = normalizeInputs(referenceT1({ analysisStart: ctxRuns.START }));
    assert.equal(ctx.priceAdder, ctx.cdata.adder, 'with no entry the country value is used');
    const inp2 = structuredClone(inp);
    inp2.grid.priceAdder = ctx.cdata.adder + 25;
    const ctx2 = buildContext(inp2, { site: ctx.site });
    assert.equal(ctx2.priceAdder, ctx.cdata.adder + 25);
    const gridOnly = opts.find((o) => o.v.C1 === 'wait' && o.v.C13 === 'none');
    const a = evaluateOption(ctx, gridOnly.v), b = evaluateOption(ctx2, gridOnly.v);
    let checkedY = 0;
    for (let y = 0; y < a.eco.ledger.length; y++) {
      const d = a.disp.years[Math.min(y, a.disp.years.length - 1)];
      if (!d || !(a.eco.ledger[y].grid > 0)) continue;
      const esc = a.eco.ledger[y].grid / (d.gridCost + d.ppaNetworkCost);
      assert.ok(near(b.eco.ledger[y].grid - a.eco.ledger[y].grid, 25 * d.gridMWh * esc, 1e-6), `year ${y}: adder difference not 25 €/MWh × grid energy`);
      checkedY++;
    }
    assert.ok(checkedY > 10 && b.eco.lcoe > a.eco.lcoe);
    out.push(`adder ${ctx.cdata.adder} → ${ctx.cdata.adder + 25} €/MWh: grid cost up by 25 €/MWh × grid energy in all ${checkedY} years with grid energy; LCOE ${a.eco.lcoe.toFixed(1)} → ${b.eco.lcoe.toFixed(1)} €/MWh`);
    // Issue 17: the timeline covers full load and the full grid date with a year to spare.
    const inp3 = structuredClone(inp);
    inp3.load.phases = inp3.load.phases.map((p, k) => ({ ...p, date: addMonths(inp3.project.analysisStart, 30 + 36 * k) }));
    const ctx3 = buildContext(inp3, { site: ctx.site });
    const need3 = ctx3.lastPhaseM + inp3.load.rampMonths + 12;
    assert.ok(ctx3.nMonthsTimeline >= need3 && ctx3.nMonthsTimeline % 12 === 0, `timeline ${ctx3.nMonthsTimeline} months < ${need3}`);
    assert.equal(ctx.nMonthsTimeline, inp.settings.timelineMonths, 'T1 timeline changed');
    out.push(`last building at month ${ctx3.lastPhaseM}: timeline ${ctx3.nMonthsTimeline} months (setting ${inp.settings.timelineMonths})`);
    // Issue 1: the first repeated year starts after the last change (full load, grid steps, plant mode changes).
    let sampled = 0;
    for (const o of opts.filter((_, i) => i % 40 === 0)) {
      const sz = sizeOption(ctx, o.v), cfg = dispatchConfig(ctx, o.v, sz);
      let last = Math.max(ctx.lastPhaseM + inp.load.rampMonths, ctx.fullGridM);
      for (let m = 1; m < ctx.gridCap.length; m++) if (ctx.gridCap[m] !== ctx.gridCap[m - 1]) last = Math.max(last, m);
      for (const m of [cfg.solarAvailM, cfg.windAvailM, cfg.bessAvailM]) if (Number.isFinite(m)) last = Math.max(last, m);
      for (const p of cfg.plants) for (let m = 1; m < p.mode.length; m++) if (p.mode[m] !== p.mode[m - 1]) last = Math.max(last, m);
      const n = dispatchYears(ctx, cfg);
      assert.equal(n, dispatchYearsNeeded(ctx, cfg), `${o.id}: T1 needs more than the cap`);
      assert.ok(12 * (n - 1) >= last, `${o.id}: repeated year ${n - 1} starts at month ${12 * (n - 1)}, before the last change at month ${last}`);
      sampled++;
    }
    out.push(`${sampled} options: the repeated year starts after the last change`);
    // Issue 17: the run flag when the cap stops dispatch early, none at the default.
    assert.equal(inp.settings.maxDispatchYears, 15);
    assert.ok(!run.runFlags.some((f) => f.id === 'dispatch-truncated'), 'T1 flagged at the default cap');
    const inp4 = structuredClone(inp);
    inp4.settings.maxDispatchYears = 3;
    inp4.settings.generationCap = 60;
    const r4 = runModel(inp4);
    const f4 = r4.runFlags.find((f) => f.id === 'dispatch-truncated');
    assert.ok(f4 && f4.severity === 'minor' && /first 3 model years/.test(f4.message), 'no truncation flag with the cap at 3 years');
    out.push(`cap at 3 years: "${f4.message.slice(0, 90)}…"`);
    return out.join('; ') + '.';
  });

  await test('36. Work package 11, dispatch and plant (known issues 2, 3, 10, 11, 15, 16, H1 L-1): a plant held at its minimum stable load backs off grid import; export income follows the price multiplier; rented plant is hired a month before it is first needed; retained plant is bought building by building; the gas flag is raised only when plant that does not burn gas cannot carry the critical load; liquid fuel held for prime plant counts towards Seveso', () => {
    const out = [];
    const inp = normalizeInputs(referenceT1({ analysisStart: ctxRuns.START }));
    // Issue 11: no hour imports from the grid for demand while on-site output is curtailed.
    const firmOpts = opts.filter((o) => (o.v.C3 === 'prime' || o.v.C4 === 'chp' || o.v.C4 === 'fuelCell' || o.v.C1 === 'islanded')).filter((_, i) => i % 25 === 0).slice(0, 24);
    let hours = 0, bad = 0, minRun = 0;
    for (const o of firmOpts) {
      const sz = sizeOption(ctx, o.v), cfg = dispatchConfig(ctx, o.v, sz);
      const { years } = dispatchAll(ctx, cfg, Array.from({ length: 30 }, (_, i) => i));
      for (const y of years) {
        const r = y.hourly;
        for (let h = 0; h < r.grid.length; h++) {
          hours++;
          const imp = r.grid[h] - r.gridCharge[h];
          if (r.firm[h] > 0 && r.curt[h] > 1e-6) minRun++;
          if (imp > 1e-6 && r.curt[h] > 1e-6) bad++;
        }
      }
    }
    assert.equal(bad, 0, `${bad} hours import from the grid while output is curtailed`);
    out.push(`${firmOpts.length} options with firm plant, ${hours.toLocaleString('en-GB')} h: no hour imports while output is curtailed (${minRun.toLocaleString('en-GB')} h with firm plant running and a surplus)`);
    // Issue 3: export income × price multiplier.
    const exp = { ...opts.find((o) => o.v.C1 === 'wait' && o.v.C10 === 'roof').v, C1: 'export' };
    const inpE = structuredClone(inp); inpE.grid.exportMW = 20;
    const inpE2 = structuredClone(inpE); inpE2.grid.priceMultiplier = 1.5;
    const ctxE = buildContext(inpE, { site: ctx.site }), ctxE2 = buildContext(inpE2, { site: ctx.site });
    const e1 = evaluateOption(ctxE, exp), e2 = evaluateOption(ctxE2, exp);
    const rev1 = e1.disp.years.reduce((s, d) => s + d.exportRevenue, 0), rev2 = e2.disp.years.reduce((s, d) => s + d.exportRevenue, 0);
    const mwh1 = e1.disp.years.reduce((s, d) => s + d.exportMWh, 0), mwh2 = e2.disp.years.reduce((s, d) => s + d.exportMWh, 0);
    assert.ok(rev1 > 0 && near(mwh1, mwh2), 'no export in the test case');
    assert.ok(near(rev2, 1.5 * rev1, 1e-9), `export income ${rev2} ≠ 1.5 × ${rev1}`);
    out.push(`export income × 1.5 with the price multiplier at 1.5 (${mwh1.toFixed(0)} MWh exported)`);
    // Issue 2: the network charge on PPA energy is escalated like grid energy.
    const ppaO = opts.find((o) => o.v.C13 === 'hybrid' && o.v.C1 === 'wait');
    const inpP = structuredClone(inp); inpP.economics.elecEscalation = 0.03;
    const ctxP = buildContext(inpP, { site: ctx.site });
    const p = evaluateOption(ctxP, ppaO.v);
    const yP = p.eco.ledger.findIndex((r, y) => y >= 8 && r.grid > 0);
    const dP = p.disp.years[Math.min(yP, p.disp.years.length - 1)];
    assert.ok(dP.ppaNetworkCost > 0);
    const escP = p.eco.ledger[yP].grid / (dP.gridCost + dP.ppaNetworkCost);
    assert.ok(escP > 1.2 && near(escP, Math.pow(1.03, yP), 0.02), `year ${yP}: grid line ÷ (grid + PPA network) = ${escP.toFixed(4)}`);
    out.push(`PPA network charge escalated with grid energy (×${escP.toFixed(3)} in year ${yP} at 3 %/yr)`);
    // Issue 15: rented plant hired settings.rentalLeadMonths before the first month of need.
    const rented = opts.filter((o) => o.sizing.bridge && o.sizing.bridge.tech === 'rented');
    assert.ok(rented.length > 20);
    let later = 0;
    for (const o of rented) {
      const br = o.sizing.bridge;
      const s = o.sizing.sentences.find((x) => /^Rented generation could be on site from month/.test(x));
      if (!s) continue;
      const [, from, hire, need] = s.match(/month (\d+); it is hired from month (\d+), .* \(month (\d+)\)/).map(Number);
      assert.equal(hire, br.availMonth); assert.equal(from, br.earliestMonth);
      assert.equal(hire, Math.max(from, need - inp.settings.rentalLeadMonths));
      assert.ok(o.ttp.supplyReadyM == null || o.ttp.supplyReadyM <= Math.max(need, ctx.firstPhaseM), `${o.id}: hiring later delayed first power`);
      later++;
    }
    assert.ok(later > 0, 'no rented option hired later than its earliest month');
    // Hiring earlier never changes time-to-power; it only costs more rental.
    const r0 = rented.find((o) => o.sizing.bridge.earliestMonth != null);
    const inpR = structuredClone(inp); inpR.settings.rentalLeadMonths = 6;
    const ctxR = buildContext(inpR, { site: ctx.site });
    const ra = evaluateOption(ctx, r0.v), rb = evaluateOption(ctxR, r0.v);
    assert.equal(ra.ttp.metric, rb.ttp.metric);
    const rent = (e) => e.eco.ledger.reduce((s, r) => s + r.rental, 0);
    assert.ok(rent(rb) >= rent(ra) - 1e-6);
    out.push(`${later} of ${rented.length} rented options hired later than they could arrive, ${inp.settings.rentalLeadMonths} month before first need; hiring 6 months ahead keeps time-to-power and adds €${((rent(rb) - rent(ra)) / 1e6).toFixed(2)} m rental`);
    // Issue 16: retained bridging plant bought (or hired) in step with the buildings.
    const ret = opts.filter((o) => o.sizing.bridge && o.sizing.bridge.retainedPhasing);
    assert.ok(ret.length > 10, `${ret.length} options with retained phasing`);
    let staged = 0, hired = 0;
    const unitsAt = (br, m) => {
      const rp = br.retainedPhasing;
      let u = Math.min(rp.bridgingUnits, br.units), owned = rp.bridgingUnits;
      rp.cumUnitsByPhase.forEach((cu, k) => { const add = Math.max(0, cu - owned); if (add > 0) { if (Math.max(br.availMonth, rp.phaseMonths[k]) <= m) u += add; owned += add; } });
      if (owned < br.units) u += br.units - owned;
      return u;
    };
    for (const o of ret) {
      const br = o.sizing.bridge;
      assert.ok(o.sizing.sentences.some((x) => x.startsWith('Bought in step with the buildings')));
      if (br.tech === 'rented') {
        // Rental each month for the units on hire that month (retained: on site to the end).
        const rate = TECH.rented.p.rentalPerKWMonth;
        o.eco.ledger.forEach((r, y) => {
          if (y >= o.eco.ledger.length - 1) return;
          let mwM = 0;
          for (let m = 12 * y; m < 12 * y + 12; m++) if (m >= br.availMonth) mwM += unitsAt(br, m) * br.unitMW;
          assert.ok(near(r.rental, mwM * 1000 * rate, 1e-9), `${o.id} year ${y}: rental ${r.rental} ≠ ${mwM * 1000 * rate}`);
        });
        hired++;
        continue;
      }
      const t = TECH[br.tech];
      const lines = o.eco.capexLines.filter((l) => l.item === `${t.name} (bridging)` || l.item === `${t.name} (retained as backup)`);
      const total = lines.reduce((s, l) => s + l.amount, 0);
      assert.ok(near(total, br.units * br.unitMW * 1000 * t.p.capexPerKW), `${o.id}: phased capex ${total} ≠ fleet cost`);
      const first = lines.find((l) => l.item.endsWith('(bridging)'));
      if (first) assert.ok(near(first.amount, br.retainedPhasing.bridgingUnits * br.unitMW * 1000 * t.p.capexPerKW));
      if (lines.some((l) => l.item.endsWith('(retained as backup)') && l.year > Math.min(...lines.map((x) => x.year)))) staged++;
    }
    assert.ok(staged > 0 && hired > 0);
    out.push(`${ret.length} options keep bridging plant as backup: owned plant's capex lines add up to the fleet, ${staged} buy units with later buildings; ${hired} rented ones pay rental only for the units on hire each month`);
    // Issue 10: the gas flag.
    let gasOK = 0, gasFlagged = 0;
    for (const o of opts) {
      const r = o.resilience;
      const flagged = o.flags.some((f) => f.id === 'res-gas');
      assert.equal(flagged, r.gasDependent && r.nonGasFirmMW + 1e-9 < o.sizing.criticalMW, `${o.id}: gas flag`);
      if (r.gasDependent && !flagged) gasOK++;
      if (flagged) gasFlagged++;
      if (flagged) assert.ok(r.status !== 'Meets');
    }
    assert.ok(gasOK > 0 && gasFlagged > 0);
    out.push(`gas flag: ${gasFlagged} options flagged, ${gasOK} with gas plant not flagged because plant that does not burn gas covers the critical load`);
    // H1 L-1: liquid fuel held for running HVO-diesel prime or bridging plant counts towards Seveso (retained plant that
    // is the backup already has its store in the backup's fuel).
    const fs = TECH.fuelStorage.p, req = inp.requirements;
    const running = (sz, v) => [sz.prime, sz.bridge].filter((p) => p && TECH[p.tech] && TECH[p.tech].fuel === 'diesel' && !(p.role === 'bridge' && v.C5 === 'retained'));
    const dp = opts.filter((o) => running(o.sizing, o.v).length);
    assert.ok(dp.length > 0, 'no option runs HVO-diesel plant');
    let moreT = 0;
    for (const o of dp) {
      const sz = sizeOption(ctx, o.v);
      const t = permittingTriggers(sz, o.v, req);
      assert.ok(near(t.runFuelM3, running(sz, o.v).reduce((a, p) => a + p.mw * req.autonomyH * fs.dieselLPerKWh, 0)), `${o.id}: run store`);
      assert.ok(t.runFuelM3 > 0 && near(t.fuelT, ((sz.backup ? sz.backup.fuelM3 : 0) + t.runFuelM3) * fs.densityTPerM3));
      if (t.sevesoFuel !== o.flags.some((f) => f.id === 'permit-seveso-fuel')) assert.fail(`${o.id}: Seveso flag does not follow the store`);
      moreT += t.runFuelM3 * fs.densityTPerM3;
    }
    out.push(`${dp.length} options that run HVO-diesel plant count ${req.autonomyH} h of its fuel towards Seveso (${Math.round(moreT / dp.length)} t each on average)`);
    return out.join('; ') + '.';
  });

  await test('37. Work package 11, time-to-power and the option detail (known issues 8, 9, 14): the axis is months late against the phasing plan plus half the power gap; first power is never before building 1; "opex, first year with load"; a pro needs no more than 10 % of the run as good or better (so "no delay", shared by most options, is no pro)', () => {
    const out = [];
    let zero = 0;
    for (const o of opts) {
      const t = o.ttp;
      assert.ok(near(t.metric, t.delayFirst + t.delayFull + (0.5 * t.gapMWm) / o.sizing.designMW, 1e-9), `${o.id}: metric`);
      assert.ok(t.metric >= 0);
      if (t.firstPowerM != null) assert.ok(t.firstPowerM >= ctx.firstPhaseM && t.firstPowerM >= t.supplyReadyM, `${o.id}: first power ${t.firstPowerM} before building 1 (${ctx.firstPhaseM})`);
      if (t.metric === 0) zero++;
      const i = o.eco.ledger.findIndex((r) => r.netDemandMWh > 0);
      assert.equal(o.eco.opexYear1Index, i); assert.equal(o.eco.opexYear1, o.eco.ledger[i].opex);
    }
    const first = opts[0].eco.opexYear1Index;
    assert.ok(first >= 1, 'T1 has no load in 2027');
    out.push(`all ${opts.length} options: metric = months late (first + full) + half the gap; ${zero} on time with no gap score 0; first power never before month ${ctx.firstPhaseM}; opex shown for model year ${first} (the first with load)`);
    // Pros: a value most of the run shares is not a pro.
    const cache = new Map();
    let pros = 0;
    for (const o of opts.filter((_, i) => i % 10 === 0)) {
      for (const pr of prosCons(o, opts, cache).pros) {
        const m = CARD_METRICS.find((x) => x.id === pr.id);
        const x = m.get(o);
        const asGood = opts.filter((q) => { const y = m.get(q); return Number.isFinite(y) && (m.higher ? y >= x - 1e-12 : y <= x + 1e-12); }).length / opts.filter((q) => Number.isFinite(m.get(q))).length;
        assert.ok(asGood <= PRO_SHARE + 1e-12, `${o.id}: pro "${pr.text}" shared by ${(asGood * 100).toFixed(0)} % of the run`);
        pros++;
      }
    }
    out.push(`${pros} pros on ${Math.ceil(opts.length / 10)} options, each shared by no more than 10 % of the run`);
    return out.join('; ') + '.';
  });
}
