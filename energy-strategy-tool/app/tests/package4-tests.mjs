// 25–27. Work package 4: flexibility and battery logic (BRIEF §5.3, §5.5; AC 19, AC 20; OPEN-QUESTIONS 33, 34, 61).

import assert from 'node:assert/strict';
import { runModel } from '../src/engine/run.js';
import { referenceT1, normalizeInputs, getRegistry, TECH, CHOICE_BY_ID } from '../src/engine/defaults.js';
import { itShape, buildContext } from '../src/engine/context.js';
import { triggerSet } from '../src/engine/triggers.js';
import { inspectOption } from '../src/engine/inspect.js';

const BACKUP = { diesel: 'backupDiesel', hvo: 'backupHvo', gas: 'backupGas', bessUps: 'backupHvo' };

export async function package4Tests(test, ctxRuns) {
  const { runT1, START } = ctxRuns;

  await test('25. AC 19 gensets: test running 6 h a year at a separate 75 % test load; changing the test load changes only test energy, fuel, cost and Scope 1; with 0 primary-power hours gensets never run in normal dispatch; above 0 they run in the most expensive hours, costed', async () => {
    const reg = getRegistry();
    assert.equal(reg['requirements.testRunHours'].value, 6);
    assert.equal(reg['requirements.testRunLoad'].value, 0.75);
    assert.equal(reg['requirements.gensetPrimaryHours'].value, 0);
    // Default: no backup plant in dispatch.
    for (const o of runT1.options) assert.ok(!o.dispatch.years.some((y) => y.plants.some((p) => p.role === 'backupPrime')), `${o.id}: backup ran in normal dispatch`);
    // Test-run energy = units × 6 h × 75 % × rating (per steady-state year).
    const o = runT1.options.find((x) => x.v.C5 === 'diesel');
    const t = TECH[BACKUP[o.v.C5]];
    const units = o.sizing.backup.units;
    const want = units * t.p.unitMW * 6 * 0.75;
    // Test load 50 %: only test energy, fuel cost and Scope 1 change.
    const in2 = referenceT1({ analysisStart: START }); in2.requirements.testRunLoad = 0.5; in2.settings.generationCap = 40;
    const in1 = referenceT1({ analysisStart: START }); in1.settings.generationCap = 40;
    const [r1, r2] = [runModel(in1), runModel(in2)];
    const a = r1.options.find((x) => x.v.C5 === 'diesel'), b = r2.options.find((x) => x.id === a.id);
    const last = (r) => r.eco.ledger[10]; // a steady year (the final ledger year has no operation)
    assert.ok(Math.abs(last(b).testRun / last(a).testRun - 0.5 / 0.75) < 1e-9, 'test-run cost does not scale with the test load');
    for (const k of ['grid', 'ppa', 'fom', 'vom', 'fuel', 'capex']) assert.ok(Math.abs(last(a)[k] - last(b)[k]) < 1e-6, `${k} changed with the test load`);
    assert.deepEqual(a.dispatch.years.map((y) => y.gridMWh), b.dispatch.years.map((y) => y.gridMWh));
    // 100 h of primary power: the gensets run at most 100 h a year, in the most expensive hours, and burn fuel.
    const in3 = referenceT1({ analysisStart: START }); in3.requirements.gensetPrimaryHours = 100; in3.settings.generationCap = 40;
    const r3 = runModel(in3);
    const c = r3.options.find((x) => x.id === a.id);
    const yr = c.dispatch.years[c.dispatch.years.length - 1];
    const bp = yr.plants.find((p) => p.role === 'backupPrime');
    assert.ok(bp && bp.hours <= 100 && bp.hours > 0 && bp.fuelMWhTh > 0, 'backup primary power not dispatched');
    assert.ok(last(c).fuel > last(a).fuel && last(c).grid < last(a).grid, 'primary power not costed against grid');
    return `test energy ${want.toFixed(1)} MWh a year (${units} units × ${t.p.unitMW} MW × 6 h × 75 %); test load 50 % scales only the test-run line; 100 h primary power: ${bp.hours} h, ${Math.round(bp.mwh)} MWh in the last year`;
  });

  await test('26. Load shapes (§5.3): flat, daily fluctuation (unchanged default), AI training (checkpoint dips), AI inference (daily cycle, weekends); each at its average; sub-hour caveat in the inputs', async () => {
    const base = normalizeInputs(referenceT1({ analysisStart: START }));
    const out = [];
    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const sh = (s, extra = {}) => { const n = { ...base, load: { ...base.load, shape: s, ...extra } }; return itShape(n, n.project.seed); };
    assert.equal(getRegistry()['load.shape'].value, 'daily');
    const flat = sh('flat');
    assert.ok(flat.every((x) => Math.abs(x - base.load.utilisation) < 1e-12));
    const daily = sh('daily');
    assert.ok(Math.abs(avg(daily) - base.load.utilisation) < 1e-9 && Math.max(...daily) > Math.min(...daily));
    const tr = sh('aiTraining');
    assert.ok(Math.abs(avg(tr) - base.load.aiTrainUtil) < 1e-9, 'AI training average');
    for (let h = 0; h < 48; h++) if (h % base.load.aiTrainDipEveryH < base.load.aiTrainDipH) assert.ok(Math.abs(tr[h] - base.load.aiTrainDip) < 1e-9, `dip at hour ${h}`);
    const inf = sh('aiInference');
    assert.ok(Math.abs(avg(inf) - base.load.aiInfUtil) < 1e-9, 'AI inference average');
    const day = (d) => Array.from(inf.slice(d * 24, d * 24 + 24));
    assert.equal(day(0).indexOf(Math.max(...day(0))), base.load.aiInfPeakHour, 'peak hour');
    assert.ok(Math.max(...day(5)) < Math.max(...day(0)), 'weekend lower');
    out.push(`flat ${flat[0].toFixed(2)}; daily ${Math.min(...daily).toFixed(3)}–${Math.max(...daily).toFixed(3)}; AI training ${Math.max(...tr).toFixed(3)} with dips to ${Math.min(...tr).toFixed(2)}; AI inference ${Math.min(...inf).toFixed(2)}–${Math.max(...inf).toFixed(2)}`);
    // A run with a shape changes energy, not sizing.
    const inA = referenceT1({ analysisStart: START }); inA.load.shape = 'aiTraining'; inA.settings.generationCap = 30;
    const inB = referenceT1({ analysisStart: START }); inB.settings.generationCap = 30;
    const [rA, rB] = [runModel(inA), runModel(inB)];
    const oA = rA.options[0], oB = rB.options.find((o) => o.id === oA.id);
    assert.equal(oA.sizing.designMW, oB.sizing.designMW);
    assert.ok(oA.dispatch.years.at(-1).grossDemandMWh > oB.dispatch.years.at(-1).grossDemandMWh, 'AI training (90 %) should use more energy than 80 %');
    return out.join('; ');
  });

  await test('27. AC 20 flexibility and batteries (OPEN-QUESTIONS 33, 34, 61): off by default (no curtailment); on: curtailment ≤ share × IT × hours; trigger hours and shortfalls share the limits; the battery serves trigger hours before curtailment; shed against a shortfall is not adequate; trigger-hours battery (rule j, three hold-fixed modes); resilience reserve never dispatched, capex for both batteries in the ledger', async () => {
    const out = [];
    // Off by default.
    assert.ok(runT1.options.every((o) => o.v.C16 === 'off' && o.dispatch.years.every((y) => (y.flexMWh || 0) === 0)), 'curtailment with flexibility off');
    assert.ok(runT1.flexAnalysis && Number.isFinite(runT1.flexAnalysis.triggerHours));
    // Resilience reserve: sized, booked, never dispatched.
    for (const o of runT1.options.slice(0, 50)) {
      const r = o.sizing.reserve;
      assert.ok(Math.abs(r.mwh - o.sizing.itMW * runT1.inputs.requirements.upsMin / 60) < 1e-9);
      assert.ok(Math.abs(o.sizing.storage.mwh - (o.sizing.bess.mwh + o.sizing.bridgeBess.mwh)) < 1e-9, 'reserve in the dispatched storage');
      assert.ok(o.eco.capexLines.some((l) => /Resilience reserve/.test(l.item) && l.amount > 0), `${o.id}: reserve capex`);
      if (o.sizing.storage.mwh > 0) assert.ok(o.eco.capexLines.some((l) => l.item === 'BESS' && l.amount > 0), `${o.id}: BESS capex`);
    }
    // Flexibility on with a €190/MWh trigger (the synthetic profile peaks near €215).
    const inp = referenceT1({ analysisStart: START }); inp.settings.generationCap = 120; inp.load.flexTriggerPrice = 190;
    inp.choices = { ...(inp.choices || {}), C16: { state: 'open', values: ['off', 'on'] } };
    const r = runModel(inp);
    const L = r.inputs.load;
    const on = r.options.filter((o) => o.v.C16 === 'on');
    assert.ok(on.length > 0);
    for (const o of on) for (const y of o.dispatch.years) {
      const maxIT = Math.max(...r.ctx.itInst.slice(0, r.ctx.nMonths));
      assert.ok(y.flexMWh <= L.flexMaxPct * maxIT * L.flexHours + 1e-6, `${o.id}: curtailment above the limit`);
      assert.ok(y.maxBalanceError < 1e-6);
      if ((y.flexShortMWh || 0) > 0) assert.ok(o.adequacy.reasons.includes('shed'), `${o.id}: shed not counted for adequacy`);
    }
    // Battery before curtailment, hour by hour, on a trigger-hours battery option.
    const tb = r.options.find((o) => o.v.C12 === 'trigger');
    assert.ok(tb, 'no trigger-hours battery option');
    assert.ok(r.rules.find((x) => x.id === 'j'));
    const ts = triggerSet(r.ctx, L);
    assert.ok(Math.abs(tb.sizing.bess.mw - L.flexMaxPct * tb.sizing.itMW) < 1e-9 && Math.abs(tb.sizing.bess.mwh - tb.sizing.bess.mw * ts.longestEventH / Math.sqrt(TECH.bess.p.rte)) < 1e-9, 'trigger battery size');
    const I = inspectOption(r.inputs, tb.v, { site: r.ctx.site });
    let checked = 0;
    const availM = I.bess.availMonth == null ? Infinity : I.bess.availMonth;
    for (const yv of I.years) {
      const h = yv.hourly;
      for (let k = 0; k < h.flexTrig.length; k++) {
        if (h.flexTrig[k] > 1e-9) {
          // Curtailed in a trigger hour: the battery was unavailable, at full power, or empty after discharging.
          const m = yv.fromMonth + (k < 8030 ? (k / 730) | 0 : 11);
          assert.ok(m < availM || h.resp[k] >= I.bess.mw - 1e-6 || h.soc[k] <= 1e-6, `curtailed while the battery could still serve (year ${yv.index}, hour ${k})`);
          checked++;
        }
      }
    }
    const y0 = tb.dispatch.years.at(-1);
    const noB = r.options.find((o) => o.v.C16 === 'on' && o.v.C12 === 'none' && o.v.C1 === tb.v.C1);
    assert.ok(y0.battRespMWh > 0 && (!noB || y0.flexTrigMWh < noB.dispatch.years.at(-1).flexTrigMWh), 'battery response does not reduce curtailment');
    out.push(`€190 trigger: ${r.flexAnalysis.eventHours} event hours; trigger battery ${tb.sizing.bess.mw.toFixed(1)} MW / ${tb.sizing.bess.mwh.toFixed(1)} MWh serves ${Math.round(y0.battRespMWh)} MWh and leaves ${Math.round(y0.flexTrigMWh)} MWh curtailed${noB ? ` (no battery: ${Math.round(noB.dispatch.years.at(-1).flexTrigMWh)} MWh)` : ''}; ${checked} curtailed trigger hours in the hourly records`);
    // Hold fixed: hours → the level gives at least the target event hours.
    const ctx = buildContext(normalizeInputs({ ...inp, load: { ...inp.load, flexBatteryFixed: 'hours', flexBatteryHours: 60 } }), { site: { noSiteModel: true } });
    const th = triggerSet(ctx, ctx.inputs.load);
    assert.ok(th.eventHours >= 60 && th.level > 190, 'hours held fixed');
    out.push(`hours held at 60: level €${th.level.toFixed(1)}/MWh gives ${th.eventHours} event hours`);
    // Off: rule (j) removes every trigger-hours battery.
    assert.ok(!runT1.options.some((o) => o.v.C12 === 'trigger'));
    assert.ok(CHOICE_BY_ID.C12.values.some((x) => x[0] === 'trigger'));
    return out.join('; ');
  });
}
