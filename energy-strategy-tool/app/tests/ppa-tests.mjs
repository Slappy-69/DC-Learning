// 28. Work package 5: the O1–O3 PPA and carbon rules (AC 21–23) and the PPA tick (OPEN-QUESTIONS 22, 49, 62).

import assert from 'node:assert/strict';
import { buildDefaultInputs, normalizeInputs, defaultChoiceState } from '../src/engine/defaults.js';
import { inspectOption } from '../src/engine/inspect.js';

export async function ppaRuleTests(test, ctxRuns) {
  await test('28. PPA rules: no PPA unless ticked, then with and without at one coverage (OPEN-QUESTIONS 49, 62); O1 a PPA that can never be delivered is not generated (rule k, OPEN-QUESTIONS 22); O2 hourly CFE counts PPA only against grid energy used in the hour (whole year by hand); O3 two flags whose shares add to 100 %', async () => {
    const out = [];
    // Tick: off by default.
    const def = normalizeInputs(buildDefaultInputs({ analysisStart: ctxRuns.START }));
    assert.equal(def.utilities.ppaInclude, false);
    assert.deepEqual(defaultChoiceState('C13', def), { state: 'locked', values: ['none'] });
    const on = { ...def, utilities: { ...def.utilities, ppaInclude: true, ppaType: 'wind', ppaCoverage: 75 } };
    assert.deepEqual(defaultChoiceState('C13', on), { state: 'open', values: ['none', 'wind'] });
    assert.deepEqual(defaultChoiceState('C14', on), { state: 'locked', values: ['75'] });
    const { runT1, runT3 } = ctxRuns;
    const ppaOpts = runT1.options.filter((o) => o.v.C13 !== 'none');
    assert.ok(ppaOpts.length > 0 && ppaOpts.every((o) => o.v.C13 === 'hybrid' && o.v.C14 === '100'), 'T1 PPA options at the ticked type and coverage');
    out.push(`default: no PPA; T1 (hybrid 100 % ticked): ${ppaOpts.length} PPA options, ${runT1.options.length - ppaOpts.length} without`);
    // O1: never islanded with a PPA; none at all on T3 (no grid); rule (k) counted.
    assert.ok(!runT1.options.some((o) => o.v.C1 === 'islanded' && o.v.C13 !== 'none'), 'islanded option with a PPA');
    assert.ok(!runT3.options.some((o) => o.v.C13 !== 'none'), 'T3 (no grid) option with a PPA');
    const k1 = runT1.rules.find((r) => r.id === 'k'), k3 = runT3.rules.find((r) => r.id === 'k');
    assert.ok(k1 && k1.removed > 0 && k3 && k3.removed > 0);
    out.push(`O1: rule (k) removed ${k1.removed.toLocaleString('en-GB')} (T1) and ${k3.removed.toLocaleString('en-GB')} (T3)`);
    // O2: CFE by hand for a PPA option without firm plant, every hour of every dispatched year.
    // Fossil plant gives no carbon-free energy, so an option without SMR or hydrogen counts its firm output as 0.
    const clean = (x) => ![x.sizing.prime, x.sizing.bridge].some((p) => p && (p.tech === 'smr' || p.tech === 'hydrogen'));
    const o = ppaOpts.find((x) => clean(x) && x.sizing.solarMWp > 0) || ppaOpts.find(clean);
    const I = inspectOption(runT1.inputs, o.v, { site: runT1.ctx.site });
    let maxDiff = 0;
    for (const y of I.years) {
      const h = y.hourly;
      let cfe = 0;
      for (let k = 0; k < h.demand.length; k++) {
        const reUse = Math.min(h.re[k], h.demand[k]);
        const gridUsed = h.ppa[k] + h.grid[k];
        const c = reUse + Math.min(h.ppaContract[k], gridUsed);
        cfe += Math.min(c, h.net[k]);
      }
      maxDiff = Math.max(maxDiff, Math.abs(cfe - y.engine.cfeMWh) / Math.max(1, y.engine.cfeMWh));
    }
    assert.ok(maxDiff < 1e-9, `O2 CFE by hand differs by ${maxDiff}`);
    out.push(`O2: ${o.id} CFE by hand equals the engine in all ${I.years.length} years`);
    // O3: flags and shares (the port test checks every option); the T1 PPA options with undelivered volume.
    let nBoth = 0, nAbove = 0, nLim = 0;
    for (const x of ppaOpts) {
      const fl = x.flags.find((f) => f.id === 'ppa-import-limited'), fa = x.flags.find((f) => f.id === 'ppa-above-load');
      if (fl || fa) assert.ok(Math.abs((fl ? fl.share : 0) + (fa ? fa.share : 0) - 100) < 1e-6);
      if (fl && fa) nBoth++; else if (fa) nAbove++; else if (fl) nLim++;
    }
    out.push(`O3: ${nBoth} options with both flags, ${nAbove} above the load only, ${nLim} import-limited only`);
    // Known issue 13 (fixed 2026-10-23): a PPA never makes an option less adequate than its no-PPA twin.
    const noPPA = new Map(runT1.options.filter((x) => x.v.C13 === 'none').map((x) => [JSON.stringify({ ...x.v, C13: 0, C14: 0 }), x]));
    let twins = 0;
    for (const x of ppaOpts) {
      const t = noPPA.get(JSON.stringify({ ...x.v, C13: 0, C14: 0 }));
      if (!t) continue;
      twins++;
      if (t.adequacy.adequate) assert.ok(x.adequacy.adequate, `${x.id}: PPA option less adequate than its twin ${t.id} (${x.adequacy.reasons.join(', ')})`);
    }
    out.push(`known issue 13: ${twins} PPA/no-PPA twins in the sample, none less adequate with the PPA; ${ppaOpts.filter((x) => x.adequacy.adequate).length} of ${ppaOpts.length} PPA options adequate`);
    return out.join('; ');
  });
}
