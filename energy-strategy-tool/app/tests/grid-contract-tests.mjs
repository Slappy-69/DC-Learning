// 31. Work package 3: contracted grid capacity and the fixed grid connection charge (AC 14, AC 18; OPEN-QUESTIONS 19,
// 20, 50 answered 2026-10-23 with Claude's recommendation, accepted in advance by the owner; KNOWN-ISSUES item 7).

import assert from 'node:assert/strict';
import { normalizeInputs } from '../src/engine/defaults.js';
import { buildContext, contractedCap } from '../src/engine/context.js';
import { evaluateOption } from '../src/engine/option.js';
import { dispatchConfig, dispatchAll } from '../src/engine/dispatch.js';
import { expectedConnectionCharge } from '../src/engine/evaluate.js';
import { tornado, TORNADO_DRIVERS } from '../src/engine/sensitivity.js';
import { TECH } from '../src/engine/defaults.js';

export async function gridContractTests(test, ctxRuns) {
  await test('31. Contracted grid capacity and the grid connection charge (work package 3, AC 14 and AC 18): a strategy that contracts 80 MW of a 120 MW offer never imports more than 80 MW in any hour, its sizing and time-to-power use 80 MW, blank = the full offer; one lump-sum charge, default 0 and flagged "assumed" on every grid-connected option, the same for every option, not paid by islanded options; the expected figure is the standard rate × contracted MW', async () => {
    const out = [];
    const run = ctxRuns.runT1;
    const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
    const bridge = ranked.find((o) => o.v.C1 === 'bridge');
    const wait = ranked.find((o) => o.v.C1 === 'wait');
    const isl = ranked.find((o) => o.v.C1 === 'islanded');
    assert.ok(bridge && wait && isl, 'T1 has bridge, wait and islanded options');
    // Defaults: blank contracted = the full offer, charge 0 → no charge line, the "assumed" flag on grid options only.
    const I0 = normalizeInputs(run.inputs);
    assert.equal(I0.grid.contractBridgeMW, null);
    assert.equal(I0.grid.connectionCharge, 0);
    const ctx0 = buildContext(I0, { site: run.ctx.site });
    assert.equal(contractedCap(ctx0, 'bridge'), ctx0.gridCap, 'blank contract is not the offer');
    for (const o of [bridge, wait]) {
      assert.ok(o.flags.some((f) => f.id === 'grid-charge-assumed'), `${o.id} lacks the assumed-charge flag`);
      assert.ok(!o.eco.capexLines.some((l) => /^Grid connection charge/.test(l.item)), `${o.id} books a charge of 0`);
    }
    assert.ok(!isl.flags.some((f) => f.id === 'grid-charge-assumed'), 'islanded option flagged for a charge it does not pay');
    assert.ok(!isl.eco.capexLines.some((l) => /^Grid (connection|cable)/.test(l.item)), 'islanded option pays for the grid connection');
    const ex = expectedConnectionCharge(I0, 'wait');
    assert.equal(ex.amount, I0.grid.fullMW * TECH.substation.p[`connCapexPerMW_${ex.band}`]);
    out.push(`defaults: blank = offer; charge 0 flagged "assumed" on ${run.options.filter((o) => o.flags.some((f) => f.id === 'grid-charge-assumed')).length} options, none islanded; expected €${(ex.amount / 1e6).toFixed(1)} m (${ex.mw} MW × €${ex.rate / 1000}k, ${ex.band})`);

    // 80 MW of the 120 MW offer for bridging options; a charge of €30 m.
    const I1 = normalizeInputs(run.inputs);
    I1.grid.contractBridgeMW = 80;
    I1.grid.connectionCharge = 30e6;
    const ctx1 = buildContext(I1, { site: run.ctx.site });
    const cc = contractedCap(ctx1, 'bridge');
    for (let m = 0; m < cc.length; m++) assert.equal(cc[m], Math.min(ctx1.gridCap[m], 80));
    assert.equal(contractedCap(ctx1, 'wait'), ctx1.gridCap, 'the wait strategy follows its own (blank) contract');
    const e1 = evaluateOption(ctx1, bridge.v);
    assert.ok(Math.max(...e1.sz.grid.byMonth) <= 80 + 1e-9, 'sizing uses more than the contracted capacity');
    const cfg = dispatchConfig(ctx1, bridge.v, e1.sz);
    assert.equal(cfg.gridLimit, 80);
    const years = Array.from({ length: e1.disp.years.length }, (_, i) => i);
    const d = dispatchAll(ctx1, cfg, years);
    let maxImport = 0;
    for (const y of d.years) for (let h = 0; h < y.hourly.grid.length; h++) maxImport = Math.max(maxImport, y.hourly.grid[h] + y.hourly.gridCharge[h]);
    assert.ok(maxImport <= 80 + 1e-6, `imports ${maxImport} MW above the 80 MW contracted`);
    const e0 = evaluateOption(ctx0, bridge.v);
    out.push(`bridge option ${bridge.id}: max import ${maxImport.toFixed(1)} MW (offer 120 MW, contract 80 MW); unmet ${Math.round(e0.disp.years.reduce((a, y) => a + y.unmetMWh, 0))} → ${Math.round(e1.disp.years.reduce((a, y) => a + y.unmetMWh, 0))} MWh; full load month ${e0.ttp.fullLoadM} → ${e1.ttp.fullLoadM}`);
    // The charge: one amount on every grid-connected option, none on islanded ones, no "assumed" flag.
    const eW = evaluateOption(ctx1, wait.v), eI = evaluateOption(ctx1, isl.v);
    const charge = (e) => e.eco.capexLines.filter((l) => l.item === 'Grid connection charge').reduce((a, l) => a + l.amount, 0);
    assert.equal(charge(e1), 30e6);
    assert.equal(charge(eW), 30e6);
    assert.equal(charge(eI), 0);
    assert.ok(!e1.flags.some((f) => f.id === 'grid-charge-assumed') && !eW.flags.some((f) => f.id === 'grid-charge-assumed'));
    out.push('charge €30 m: booked once on the bridge and wait options, not on the islanded one; no "assumed" flag');
    // The grid connection capex tornado driver scales the charge.
    const r1 = { ...run, inputs: I1 };
    const lead = ranked.find((o) => o.v.C1 !== 'islanded');
    const t = tornado(r1, lead.id, { site: run.ctx.site, drivers: TORNADO_DRIVERS.filter((x) => x.id === 'grid-capex') });
    assert.ok(t.rows[0].high.lcoe > t.rows[0].low.lcoe, 'grid connection capex driver does not move LCOE with a charge entered');
    out.push(`grid connection capex driver with the charge: LCOE ${t.rows[0].low.lcoe.toFixed(2)} → ${t.rows[0].high.lcoe.toFixed(2)} €/MWh`);
    // Owner, 2026-10-26 (OPEN-QUESTIONS 105): the driver scales the charge (and the cable route), never the substation.
    const I2 = normalizeInputs(run.inputs);
    I2.grid.contractBridgeMW = 80;
    I2.grid.connectionCharge = 30e6;
    I2.economics = { ...I2.economics, gridCapexFactor: 2 };
    const eW2 = evaluateOption(buildContext(I2, { site: run.ctx.site }), wait.v);
    const sumOf = (e, re) => e.eco.capexLines.filter((l) => re.test(l.item)).reduce((a, l) => a + l.amount, 0);
    assert.equal(sumOf(eW2, /^Grid connection charge/), 60e6, 'the factor should double the charge');
    assert.equal(sumOf(eW2, /^Substation/), sumOf(eW, /^Substation/), 'the grid connection capex factor must not scale the substation');
    assert.ok(sumOf(eW, /^Substation/) > 0, 'the wait option has no substation line to compare');
    out.push(`grid connection capex × 2: charge ${sumOf(eW, /^Grid connection charge/) / 1e6} → ${sumOf(eW2, /^Grid connection charge/) / 1e6} m, substation unchanged at ${(sumOf(eW, /^Substation/) / 1e6).toFixed(1)} m`);
    return out.join('; ') + '.';
  });
}
