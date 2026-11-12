// 67 onwards. The realism rebuild of 2026-11-11 (OPEN-QUESTIONS 247 onward; taken by Claude under the owner's carte
// blanche of that day: "fix all of that above ... just make it more realistic"). The suite pins the engine before the
// rebuild (tests/test-env.mjs), so every test here switches the rebuild on in its own inputs (settings.realism), and
// test 78 checks the defaults outside the suite in a child process.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { referenceT1, normalizeInputs, TECH, getRegistry, realismOn, plantCandidates, plantTwin } from '../src/engine/defaults.js';
import { buildContext, ctxFor, contractedCap } from '../src/engine/context.js';
import { runModel } from '../src/engine/run.js';
import { generateOptions, RULES, optionName } from '../src/engine/generator.js';
import { sizeOption } from '../src/engine/sizing.js';
import { supplyByMonth } from '../src/engine/supply.js';
import { evaluateOption } from '../src/engine/option.js';
import { topCards, strategyKey, supplyKey, dependsOnOthers } from '../src/engine/cards.js';
import { plainSummary } from '../src/engine/summary.js';
import { lateInfo, lateLine } from '../src/engine/labels.js';
import { DC_RULES, campusRules } from '../src/engine/dcrules.js';
import { planCheck } from '../src/engine/plancheck.js';
import { eemSmall } from './plants-tests.mjs';

const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// T1 with the rebuild on. `mod` edits the raw inputs.
function t1(START, mod = null, cap = 400) {
  const i = referenceT1({ analysisStart: START });
  i.settings.realism = true;
  i.settings.generationCap = cap;
  for (const k of ['C3', 'C4', 'C5']) delete i.choices[k]; // the rebuild's default lists
  if (mod) mod(i);
  return i;
}
// One option of a kind, from every valid combination (the suite samples the options; these tests name the option they need).
const all = (i) => generateOptions({ ...i, settings: { ...i.settings, screenAllBelow: 1e7, sampleAboveCap: false, generationCap: 1e7 } });
const find = (gen, f) => { const g = gen.options.find((x) => f(x.v)); assert.ok(g, 'an option of the kind the test needs is generated'); return g.v; };

export async function realismTests(test, ctxRuns) {
  const START = ctxRuns.START;
  let run = null; // one realism run of T1, shared
  const getRun = () => (run || (run = runModel(t1(START))));

  await test('67. Realism rebuild: buildings start when their power and standby are ready: never before the plan, the building in front or the standby plant; the firm supply covers the design load of the started buildings in every month; a building the supply can never carry is not built; the option is sized on its own dates', () => {
    const r = getRun();
    const L = r.inputs.load;
    let shifted = 0, partial = 0, onPlan = 0;
    for (const o of r.options) {
      const en = o.sizing.energise;
      assert.ok(en, `${o.id}: an energise record`);
      const ctx = ctxFor(r.ctx, o.v, o.sizing);
      let prev = 0, stopped = false;
      for (let k = 0; k < en.buildings; k++) {
        const s = en.starts[k];
        if (s == null) { stopped = true; continue; }
        assert.ok(!stopped, `${o.id}: a building after one that is not built is not built`);
        assert.ok(s >= en.planned[k] && s >= prev, `${o.id}: building ${k + 1} starts at ${s}, planned ${en.planned[k]}, previous ${prev}`);
        if (o.sizing.backup.tech) assert.ok(s >= o.sizing.standbyReadyM, `${o.id}: building ${k + 1} before its standby (${o.sizing.standbyReadyM})`);
        assert.equal(en.late[k], s - en.planned[k]);
        prev = s;
      }
      // The supply covers the design load on the option's own dates (the rule that replaces "not adequate: power gap").
      const sup = supplyByMonth(ctx, o.v, o.sizing);
      for (let m = 0; m < ctx.nMonthsTimeline; m++) assert.ok(o.sizing.designByMonth[m] <= sup[m] + 1e-6, `${o.id}: month ${m}: design ${o.sizing.designByMonth[m]} above supply ${sup[m]}`);
      assert.equal(o.ttp.gapMWm, 0, `${o.id}: no power gap`);
      // Sized on its own dates: the IT it powers.
      assert.ok(near(o.sizing.itMW, en.poweredIT), `${o.id}: sized for ${o.sizing.itMW} MW IT, powers ${en.poweredIT}`);
      if (en.shifted) shifted++;
      if (en.powered < en.buildings) partial++;
      if (!en.shifted) onPlan++;
    }
    assert.ok(shifted > 0 && partial > 0, 'T1 has late and partly built options');
    // By hand, a grid-only option: 20 MW now, 120 MW from month 30; four buildings of 25 MW IT at design PUE 1.5.
    const w = r.options.find((o) => o.v.C1 === 'wait' && o.v.C4 === 'none' && o.v.C12 === 'none' && o.v.C10 === 'none' && o.v.C13 === 'none' && o.sizing.backup.tech);
    assert.ok(w, 'a grid-only option');
    const en = w.sizing.energise, g = w.sizing.peakPUE + L.ancillaryFrac;
    assert.equal(en.powered, 3, 'three buildings: 3 × 25 × 1.5 = 112.5 MW fits 120 MW, the fourth (150 MW) does not');
    assert.equal(en.starts[3], null);
    // Building 1: the first month from which its ramp stays under the grid, and not before its standby gensets.
    const cc = contractedCap(r.ctx, 'wait');
    const ramp = (d) => Math.min(1, L.rampStart + (1 - L.rampStart) * (d / L.rampMonths));
    let s1 = null;
    for (let s = en.planned[0]; s < r.ctx.nMonthsTimeline && s1 == null; s++) {
      let ok = true;
      for (let m = s; m < r.ctx.nMonthsTimeline; m++) if (25 * g * ramp(m - s) > cc[m] + 1e-6) { ok = false; break; }
      if (ok) s1 = s;
    }
    assert.equal(en.starts[0], Math.max(s1, w.sizing.standbyReadyM), `building 1: power allows month ${s1}, standby month ${w.sizing.standbyReadyM}`);
    assert.match(en.reasons[3].text, /never covers the design load of buildings 1 to 4/);
    // The plant of a partly built option is sized for what it powers: fewer standby gensets than the full campus.
    const full = r.options.find((o) => o.sizing.energise.powered === 4 && o.sizing.backup.tech === w.sizing.backup.tech && o.v.C5a === w.v.C5a && o.v.C1 !== 'islanded' && o.v.C3 !== 'backup' && o.v.C3 !== 'split');
    if (full) assert.ok(w.sizing.backup.units < full.sizing.backup.units, 'standby gensets for three buildings, not four');
    return `${r.options.length} options: ${onPlan} on plan, ${shifted} with a late or unbuilt building (${partial} partly built); grid-only powers 3 of 4 buildings, building 1 in month ${en.starts[0]} (planned ${en.planned[0]})`;
  });

  await test('68. Realism rebuild: a late start is highlighted: a flag with the building, the months, the new date and the cause; major beyond the latest acceptable start; a building that is not built is a major flag; the same words for the cards and the summary; the plan check says when the standby gensets can be ready', () => {
    const r = getRun();
    const allow = r.inputs.requirements.lateAllowanceM;
    assert.equal(allow, 12);
    let nLate = 0, nMajor = 0, nNot = 0;
    for (const o of r.options) {
      const en = o.sizing.energise;
      const lf = o.flags.find((f) => f.id === 'late-start'), nb = o.flags.find((f) => f.id === 'not-built');
      assert.equal(!!lf, en.maxLate > 0, `${o.id}: late flag`);
      assert.equal(!!nb, en.powered < en.buildings, `${o.id}: not-built flag`);
      if (lf) {
        nLate++;
        assert.equal(lf.severity, en.maxLate > allow ? 'major' : 'minor');
        if (lf.severity === 'major') nMajor++;
        const k = en.late.findIndex((x) => x > 0);
        assert.match(lf.message, new RegExp(`building ${k + 1} starts ${en.late[k]} months? late, in \\d{4}-\\d{2} \\(planned \\d{4}-\\d{2}\\): `), lf.message);
        assert.equal(lf.category, 'Programme');
      }
      if (nb) { nNot++; assert.equal(nb.severity, 'major'); assert.match(nb.message, /^Powers \d+ of 4 buildings \(\d+ of 100 MW IT\): buildings? \d/); }
      const li = lateInfo(o, START);
      assert.equal(li.onPlan, !en.shifted);
      if (li.worst) assert.match(lateLine(li.worst), /^Building \d+ starts \d+ months? late, in \d{4}-\d{2} \(planned \d{4}-\d{2}\): \S/);
    }
    assert.ok(nLate > 0 && nNot > 0);
    // Plan check: standby gensets against building 1; counts add up.
    const pc = r.planCheck;
    assert.ok(pc && pc.buildings.length === 4 && pc.allowanceM === 12);
    const c = pc.counts;
    assert.equal(c.onPlan + c.lateWithin + c.lateBeyond + c.partial, r.options.length);
    const sb = pc.items.find((i) => i.id === 'standby');
    assert.ok(sb && /Standby gensets can be ready in \d{4}-\d{2}/.test(sb.text), sb && sb.text);
    assert.ok(r.runFlags.some((f) => f.id === 'plan-check') && r.runFlags.some((f) => f.id === 'country-rules'));
    assert.deepEqual(planCheck(r.options, r.inputs).counts, c, 'the plan check is a function of the options (recomputed after a pooled merge)');
    // The summary opens with the plan: the IT the leader powers, any late start in the same words, and its tier.
    const s = plainSummary(r, {});
    assert.equal(s.parts[0].id, 'plan');
    const leader = r.options.find((o) => o.rank === 1), li = lateInfo(leader, START);
    assert.match(s.parts[0].text, /^The leading option powers (all 4 buildings|\d of 4 buildings)/);
    if (li.worst) assert.ok(s.parts[0].text.includes(lateLine(li.worst).replace(/^Building/, 'building')), s.parts[0].text);
    assert.match(s.parts[0].text, /It is tier [ABC]:/);
    assert.ok(s.words <= s.wordLimit, `${s.words} words`);
    // An allowance of 0: every late option is beyond it.
    const r0 = runModel(t1(START, (i) => { i.requirements.lateAllowanceM = 0; }, 120));
    for (const o of r0.options) { const lf = o.flags.find((f) => f.id === 'late-start'); if (lf) assert.equal(lf.severity, 'major'); assert.equal(o.rankKeys.onTime, o.sizing.energise.maxLate === 0); }
    return `${nLate} options late (${nMajor} beyond ${allow} months), ${nNot} partly built; plan check: ${sb.text.slice(0, 90)}…; summary opens "${s.parts[0].text.slice(0, 80)}…"`;
  });

  await test('69. Realism rebuild: the consent step: an environmental assessment for 300 MW of heat or more in running plant (18 months), a development consent order in Great Britain above 50 MW (30 months), the permitting allowance otherwise; standby gensets keep the permitting allowance; the plant is ordered when its consent is in hand', () => {
    const out = [];
    // T1 as it is (Great Britain): a top-up plant of 40 MW: below both thresholds.
    const iS = normalizeInputs(t1(START));
    const cS = buildContext(iS), gS = all(iS);
    const vS = find(gS, (v) => v.C1 === 'wait' && v.C4 === 'gasRecip' && v.C4s === 'shortfall' && v.C5 === 'hvo');
    const sS = sizeOption(cS, vS);
    const t = TECH.gasRecip.p;
    assert.ok(sS.consentFacts.runningMWth < 300 && sS.consentFacts.generatingMWe <= 50, JSON.stringify(sS.consentFacts));
    assert.equal(sS.prime.consent.months, iS.requirements.permitAllowanceM);
    assert.equal(sS.prime.availMonth, iS.requirements.permitAllowanceM + t.procM + t.buildM);
    out.push(`40 MW of engines: ${sS.prime.consent.months} months`);
    // Four times the campus, Great Britain: above 50 MW of generating plant.
    const big = (cc) => t1(START, (i) => { i.load.itMW = 400; i.load.phases = i.load.phases.map((p) => ({ ...p, itMW: 100 })); i.grid.fullMW = 200; i.site.areaHa = 80; if (cc) i.project.country = cc; });
    for (const [cc, want, id] of [[null, 30, 'DCO'], ['NL', 18, 'EIA']]) {
      const i = normalizeInputs(big(cc));
      const c = buildContext(i), g = all(i);
      const v = find(g, (x) => x.C1 === 'wait' && x.C4 === 'gasRecip' && x.C4s === 'shortfall' && x.C5 === 'hvo');
      const s = sizeOption(c, v);
      assert.ok(s.consentFacts.runningMWth >= 300, `running plant ${s.consentFacts.runningMWth} MW of heat`);
      assert.equal(s.prime.consent.months, want, `${c.country}: ${JSON.stringify(s.prime.consent.steps.map((x) => [x.id, x.months]))}`);
      assert.ok(s.prime.consent.steps.some((x) => x.id === id) && s.prime.consent.steps.some((x) => x.id === 'EIA'));
      assert.equal(s.prime.consent.steps.some((x) => x.id === 'DCO'), c.country === 'GB');
      assert.equal(s.prime.availMonth, want + t.procM + t.buildM);
      assert.ok(s.prime.permitRegimes.includes('EIA'));
      // Standby gensets: the permitting allowance, whatever the running plant needs.
      assert.equal(s.backup.availMonth, i.requirements.permitAllowanceM + TECH[s.backup.tech].p.procM + TECH[s.backup.tech].p.buildM);
      assert.equal(s.standbyReadyM, s.backup.availMonth);
      out.push(`${c.country}, ${Math.round(s.consentFacts.runningMWth)} MW of heat: ${want} months (${s.prime.consent.steps.map((x) => x.id).join(', ')})`);
    }
    // The allowances are inputs.
    const i2 = normalizeInputs(t1(START, (i) => { Object.assign(i, big('NL')); i.requirements.eiaAllowanceM = 24; }));
    const s2 = sizeOption(buildContext(i2), find(all(i2), (x) => x.C1 === 'wait' && x.C4 === 'gasRecip' && x.C4s === 'shortfall' && x.C5 === 'hvo'));
    assert.equal(s2.prime.consent.months, 24);
    return out.join('; ');
  });

  await test('70. Realism rebuild: an owned top-up plant is bought in step with the buildings: one step when a building starts, the units in place cover the shortfall until the next; the same units in all as before; its capex is booked in the year of each step; a leased plant is not stepped; the hourly balance holds', () => {
    const i = normalizeInputs(t1(START, (x) => { x.grid.fullMW = 60; })); // a permanent shortfall of 90 MW: nine engines and a spare
    const c = buildContext(i), g = all(i);
    const v = find(g, (x) => x.C1 === 'wait' && x.C4 === 'gasRecip' && x.C4s === 'shortfall' && x.C5 === 'hvo' && x.C12 === 'none' && x.C10 === 'none' && x.C13 === 'none');
    const e = evaluateOption(c, v, { skipLayout: true });
    const p = e.sz.prime;
    assert.ok(p.steps && p.steps.length >= 2, `steps: ${JSON.stringify(p.steps)}`);
    assert.equal(p.steps.reduce((a, s) => a + s.units, 0), p.units, 'the steps add up to the plant');
    const octx = ctxFor(c, v, e.sz);
    for (const s of p.steps) assert.ok(s.month >= p.availMonth && octx.phases.some((ph) => ph.m === s.month || s.month === p.availMonth), `step in month ${s.month}`);
    // Capex of the plant: one line a step year; the same total as the whole plant.
    const lines = e.eco.capexLines.filter((l) => / \(prime\)$/.test(l.item));
    const years = new Set(p.steps.map((s) => Math.floor(s.month / 12)));
    assert.equal(lines.length, years.size);
    assert.ok(near(lines.reduce((a, l) => a + l.amount, 0), p.mw * 1000 * TECH.gasRecip.p.capexPerKW * (i.economics.capexFactor ?? 1)), 'total capex of the plant');
    // Against the engine before the rebuild: the same units, bought whole at the plant's first month.
    const i0 = normalizeInputs({ ...t1(START, (x) => { x.grid.fullMW = 60; }), settings: { ...t1(START).settings, realism: false } });
    const e0 = evaluateOption(buildContext(i0), v, { skipLayout: true });
    assert.equal(e0.sz.prime.steps, undefined);
    assert.equal(e0.sz.energise, undefined);
    assert.equal(e0.eco.capexLines.filter((l) => / \(prime\)$/.test(l.item)).length, 1);
    // Hour by hour: no balance error and no unmet load with the stepped plant.
    for (const y of e.disp.years) { assert.ok(y.maxBalanceError < 1e-6, `balance ${y.maxBalanceError}`); assert.equal(y.unmetMWh, 0); }
    assert.ok(e.adequacy.adequate);
    // A leased plant is hired when needed, not stepped.
    const iL = normalizeInputs(t1(START, (x) => { x.existing = { ...x.existing, include: true, name: 'Nearby CCGT', type: 'ccgt', units: 2, unitMW: 40, availableDate: '2028-01', leasePerKWMonth: 6, linkCapex: 8e6 }; delete x.choices.C4; }));
    const cL = buildContext(iL);
    const sL = sizeOption(cL, find(all(iL), (x) => x.C1 === 'wait' && x.C4 === 'existing' && x.C5 === 'hvo'));
    assert.equal(sL.prime.steps, undefined);
    return `${p.units} engines in ${p.steps.length} steps (months ${p.steps.map((s) => `${s.month}: ${s.units}`).join(', ')}); capex in ${lines.length} years; before the rebuild: one purchase in month ${e0.sz.prime.availMonth}`;
  });

  await test('71. Realism rebuild: the kept share of bridging plant is what the firm plant leaves uncovered; bridging units with nothing to bridge are not bought and the option says so; known issue 39: a leased plant is not counted as the campus backup in its firm role', () => {
    const mod = (x) => { x.existing = { ...x.existing, include: true, name: 'Nearby CCGT', type: 'ccgt', units: 1, unitMW: 20, availableDate: '2027-06', leasePerKWMonth: 6, linkCapex: 8e6 }; delete x.choices.C4; };
    const i = normalizeInputs(t1(START, mod));
    const c = buildContext(i), g = all(i);
    // Permanent shortfall 30 MW (150 MW design, 120 MW grid); the leased unit covers 20 MW; engines keep the rest.
    const v = find(g, (x) => x.C1 === 'bridge' && x.C2 === 'gasRecip' && x.C3 === 'split' && x.C4 === 'existing' && x.C5 === 'hvo' && x.C12 === 'none' && x.C10 === 'none' && x.C13 === 'none');
    const e = evaluateOption(c, v, { skipLayout: true });
    const b = e.sz.bridge;
    assert.ok(near(b.permanentShortfallMW, 10), `kept share for ${b.permanentShortfallMW} MW`);
    assert.equal(b.primeUnits, 2, 'one engine of 10 MW and its spare');
    // Before the rebuild the firm plant was ignored: the kept share covered the whole 30 MW.
    const i0 = normalizeInputs({ ...t1(START, mod), settings: { ...t1(START).settings, realism: false } });
    const s0 = sizeOption(buildContext(i0), v);
    assert.ok(near(s0.bridge.permanentShortfallMW, 30) && s0.bridge.primeUnits === 4);
    // Bridging duty: every option's bridging plant has a gap to bridge from the month it is ready, or is not bought.
    const r = getRun();
    let dropped = 0;
    for (const o of r.options) {
      const sz = o.sizing;
      if (sz.bridgeDropped) { dropped++; assert.ok(!(sz.bridge && sz.bridge.shortfallMW > 0)); assert.match(o.name, /too late|not needed|for the shortfall left/); assert.ok(sz.sentences.some((s) => /bridging share is not bought/.test(s))); }
    }
    // Known issue 39.
    const res = e.res.items.find((x) => x.item === 'Backed load');
    assert.ok(!/firm prime/.test(res.text), res.text);
    const e0 = evaluateOption(buildContext(i0), v, { skipLayout: true });
    assert.ok(/firm prime/.test(e0.res.items.find((x) => x.item === 'Backed load').text));
    return `kept share ${b.primeUnits} engines for ${b.permanentShortfallMW.toFixed(0)} MW beside the leased unit (before: ${s0.bridge.primeUnits} for ${s0.bridge.permanentShortfallMW.toFixed(0)} MW); ${dropped} T1 options name a bridging plant that is not bought; backed load: ${res.text.slice(0, 70)}…`;
  });

  await test('72. Realism rebuild: buildability tests and tiers: A no conditions, B conditions, C unlikely; the score is 100 less the points of each item; an agreement with a plant owner is a condition until ticked; gas capacity, land, rented duration, the Netherlands\' nitrogen rule and Ireland\'s rules; standard consents have no effect', () => {
    const r = getRun();
    const P = r.inputs.deliverability;
    const tiers = { A: 0, B: 0, C: 0 };
    for (const o of r.options) {
      const d = o.deliv;
      assert.ok(d.buildability && ['A', 'B', 'C'].includes(d.tier));
      tiers[d.tier]++;
      assert.equal(d.tier, d.unlikely.length ? 'C' : d.conditions.length ? 'B' : 'A');
      assert.ok(near(d.score, Math.max(0, Math.min(100, 100 + d.items.reduce((a, x) => a + x.points, 0)))));
      assert.equal(d.items.filter((x) => x.kind === 'condition').length, d.conditions.length);
      assert.equal(d.items.filter((x) => x.kind === 'unlikely').length, d.unlikely.length);
      for (const x of d.items) if (x.kind === 'unlikely') assert.equal(x.points, -P.unlikelyPenalty);
      assert.ok(!d.items.some((x) => /^Permitting flags/.test(x.item)), 'the count of permitting flags is gone');
      assert.equal(o.flags.some((f) => f.id === 'tier-unlikely'), d.tier === 'C');
      assert.equal(o.flags.some((f) => f.id === 'tier-conditions'), d.conditions.length > 0);
      // Standby gensets alone: the 50 MW line is a standard consent, a minor flag.
      const ied = o.flags.find((f) => f.id === 'permit-ied');
      if (ied) assert.equal(ied.severity, o.sizing.consentFacts.runningMWth > 0 ? 'major' : 'minor');
    }
    assert.ok(tiers.A > 0 && tiers.B > 0, JSON.stringify(tiers));
    const out = [`T1 tiers ${JSON.stringify(tiers)}`];
    // Third party: a leased plant, then its owner ticked as agreed.
    const mod = (agreed) => (x) => { x.existing = { ...x.existing, include: true, name: 'Nearby CCGT', type: 'ccgt', units: 2, unitMW: 40, availableDate: '2027-06', leasePerKWMonth: 6, linkCapex: 8e6 }; delete x.choices.C4; if (agreed) x.plants = { ...(x.plants || {}), agreed: { manual: true } }; };
    const pick = (x) => x.C1 === 'wait' && x.C4 === 'existing' && x.C5 === 'hvo' && x.C12 === 'none' && x.C10 === 'none' && x.C13 === 'none';
    const ev = (m) => { const i = normalizeInputs(t1(START, m)); const c = buildContext(i); return evaluateOption(c, find(all(i), pick), { skipLayout: true }); };
    const a = ev(mod(false)), b = ev(mod(true));
    assert.ok(a.deliv.conditions.some((x) => x.id === 'third-party' && /Agreement with the owner of Nearby CCGT \(a lease\): not agreed yet/.test(x.text)), JSON.stringify(a.deliv.conditions));
    assert.ok(!b.deliv.conditions.some((x) => x.id === 'third-party'));
    assert.ok(near(b.deliv.score - a.deliv.score, P.conditionPenalty));
    out.push(`leased plant: condition until agreed (${a.deliv.score} → ${b.deliv.score})`);
    // Gas capacity entered below the need: unlikely. Not entered and a small plant: no condition.
    const gasPick = (x) => x.C1 === 'wait' && x.C4 === 'gasRecip' && x.C4s === 'shortfall' && x.C5 === 'hvo' && x.C12 === 'none' && x.C10 === 'none' && x.C13 === 'none';
    const evG = (m) => { const i = normalizeInputs(t1(START, m)); return evaluateOption(buildContext(i), find(all(i), gasPick), { skipLayout: true }); };
    const g0 = evG(null), g1 = evG((x) => { x.utilities.gasCapacityMWth = 20; }), g2 = evG((x) => { x.utilities.gasAvailable = 'Unknown'; }), g3 = evG((x) => { x.utilities.gasCapacityMWth = 5000; });
    // No capacity entered: a condition from 50 MW of gas (thermal) up, nothing below; entered and enough: nothing.
    const gasNeed = g0.sz.prime.mw / TECH.gasRecip.p.eff;
    assert.equal(g0.deliv.conditions.some((x) => x.id === 'gas-supply'), gasNeed >= 50, `gas need ${gasNeed}`);
    assert.ok(!g0.deliv.unlikely.some((x) => x.id === 'gas-supply'));
    assert.ok(!g3.deliv.conditions.some((x) => x.id === 'gas-supply') && !g3.deliv.unlikely.some((x) => x.id === 'gas-supply'));
    assert.ok(g1.deliv.unlikely.some((x) => x.id === 'gas-supply') && g1.deliv.tier === 'C');
    assert.ok(g2.deliv.conditions.some((x) => x.id === 'gas-supply' && x.points === P.gasUnknownPenalty));
    out.push(`gas (${gasNeed.toFixed(0)} MW thermal): ${gasNeed >= 50 ? 'a condition with no capacity entered' : 'nothing below 50 MW'} / nothing when the capacity entered is enough / unlikely below the need / condition when "Unknown"`);
    // Land: a site too small for the buildings and plant.
    const l1 = evG((x) => { x.site.areaHa = 3; });
    assert.ok(l1.deliv.unlikely.some((x) => x.id === 'land') || l1.deliv.conditions.some((x) => x.id === 'land'), 'land on a 3 ha site');
    // The Netherlands: plant that runs for long hours near a protected site.
    const nl = (km) => { const i = normalizeInputs(t1(START, (x) => { x.project.country = 'NL'; x.site.natureSiteKm = km; x.grid.fullMW = 60; })); return evaluateOption(buildContext(i), find(all(i), gasPick), { skipLayout: true }); };
    const n0 = nl(null), n1 = nl(3), n2 = nl(60);
    const runs = n0.disp.years.some((y) => y.plants.some((p) => p.hours > 500));
    if (runs) {
      assert.ok(n0.deliv.conditions.some((x) => x.id === 'nl-nitrogen'));
      assert.ok(n1.deliv.unlikely.some((x) => x.id === 'nl-nitrogen') && n1.deliv.tier === 'C');
      assert.ok(!n2.deliv.unlikely.some((x) => x.id === 'nl-nitrogen') && !n2.deliv.conditions.some((x) => x.id === 'nl-nitrogen'));
      out.push('Netherlands nitrogen: condition (distance blank), unlikely at 3 km, nothing at 60 km');
    }
    // Ireland: an islanded campus is contrary to policy; the 80 % renewables rule is a condition without a PPA.
    const ie = normalizeInputs(t1(START, (x) => { x.project.country = 'IE'; }));
    const cI = buildContext(ie), gI = all(ie);
    const isl = evaluateOption(cI, find(gI, (x) => x.C1 === 'islanded' && x.C2 === 'gasRecip' && x.C5 === 'retained'), { skipLayout: true });
    assert.ok(isl.deliv.unlikely.some((x) => x.id === 'ie-islanded'));
    const grd = evaluateOption(cI, find(gI, (x) => x.C1 === 'wait' && x.C4 === 'none' && x.C13 === 'none' && x.C5 === 'hvo'), { skipLayout: true });
    assert.ok(grd.deliv.conditions.some((x) => x.id === 'ie-renew'));
    assert.ok(grd.deliv.unlikely.some((x) => x.id === 'ie-cru'), 'a grid-only campus fails the CRU test');
    out.push('Ireland: islanded unlikely; grid-only fails the dispatchable-plant test; 80 % renewables a condition');
    return out.join('; ');
  });

  await test('73. Realism rebuild: the ranking: adequate, likely to be built (tier A or B), resilience met, most IT, within the latest acceptable start, then the weighted score; the cost and carbon scales are taken over the leading group; delay and buildability on fixed scales; an option that ranks below says why; no score depends on the keys', () => {
    const r = getRun();
    const byRank = r.options.slice().sort((a, b) => a.rank - b.rank);
    assert.ok(r.scoring.realism);
    const allow = r.inputs.requirements.lateAllowanceM;
    for (let k = 1; k < byRank.length; k++) {
      const a = byRank[k - 1], b = byRank[k];
      assert.ok(a.groupRank >= b.groupRank, `#${a.rank} and #${b.rank}: groups`);
      if (a.groupRank === b.groupRank) assert.ok(a.orderScore >= b.orderScore - 1e-9, `#${a.rank} and #${b.rank}: scores`);
    }
    const order = (o) => [o.rankKeys.adequate, o.rankKeys.likely, o.rankKeys.resilient, o.rankKeys.poweredIT, o.rankKeys.onTime];
    for (const o of r.options) {
      const k = o.rankKeys;
      assert.equal(k.likely, o.deliv.tier !== 'C');
      assert.equal(k.resilient, o.resilience.status !== 'Does not meet');
      assert.equal(k.poweredIT, o.sizing.energise.poweredIT);
      assert.equal(k.onTime, o.sizing.energise.maxLate <= allow);
    }
    // Lexicographic: a better key earlier in the list always wins.
    for (let k = 1; k < byRank.length; k++) {
      const x = order(byRank[k - 1]), y = order(byRank[k]);
      for (let j = 0; j < x.length; j++) { if (x[j] === y[j]) continue; assert.ok(Number(x[j]) > Number(y[j]), `#${byRank[k].rank}: key ${j}`); break; }
    }
    const lead = r.options.filter((o) => o.groupRank === byRank[0].groupRank);
    for (const o of lead) assert.ok(near(o.orderScore, o.score), 'in the leading group the order score is the score');
    assert.equal(r.scoring.scaleScope, lead.length);
    const lo = Math.min(...lead.map((o) => o.metrics.cost)), hi = Math.max(...lead.map((o) => o.metrics.cost));
    assert.ok(near(r.scoring.ranges.cost.lo, lo) && near(r.scoring.ranges.cost.hi, hi), 'cost scale over the leading group');
    assert.deepEqual([r.scoring.ranges.ttp.lo, r.scoring.ranges.ttp.hi], [0, allow]);
    assert.deepEqual([r.scoring.ranges.deliverability.lo, r.scoring.ranges.deliverability.hi], [0, 100]);
    for (const o of r.options) {
      assert.ok(near(o.axisScores.deliverability, o.deliv.score), 'buildability as it is');
      assert.ok(near(o.axisScores.ttp, Math.max(0, Math.min(100, 100 * (1 - o.ttp.metric / allow)))), 'delay against the allowance');
      assert.ok(near(o.ttp.metric, o.sizing.energise.avgLate + (0.5 * o.ttp.gapMWm) / o.sizing.designMW));
      for (const k of ['cost', 'carbon']) assert.ok(o.axisScores[k] >= 0 && o.axisScores[k] <= 100);
      assert.equal(o.rankNote === null, o.groupRank === byRank[0].groupRank);
      const w = r.scoring.weights;
      assert.ok(near(o.score, ['cost', 'carbon', 'ttp', 'deliverability'].reduce((a, k) => a + w[k] * o.axisScores[k], 0)));
    }
    const notes = new Set(r.options.map((o) => o.rankNote).filter(Boolean));
    assert.ok([...notes].some((n) => /^powers \d+ MW of IT; the leading options power \d+ MW$/.test(n)), [...notes].join(' | '));
    // Resilience gate (owner, 2026-11-08, row 244): with no backup an option does not meet, and ranks below.
    const rn = runModel(t1(START, (i) => { i.choices.C5 = { state: 'open', values: ['hvo', 'none'] }; }, 200));
    const worstMeets = Math.max(...rn.options.filter((o) => o.rankKeys.adequate && o.rankKeys.likely && o.resilience.status !== 'Does not meet').map((o) => o.rank));
    const bestFails = Math.min(...rn.options.filter((o) => o.rankKeys.adequate && o.rankKeys.likely && o.resilience.status === 'Does not meet').map((o) => o.rank));
    assert.ok(Number.isFinite(bestFails) && bestFails > worstMeets, `does not meet from #${bestFails}, meets to #${worstMeets}`);
    return `leading group ${lead.length} of ${r.options.length}; cost scale ${lo.toFixed(1)} to ${hi.toFixed(1)}; notes: ${[...notes].slice(0, 3).join(' | ')}; resilience gate: "Does not meet" from #${bestFails}`;
  });

  await test('74. Realism rebuild: generation: rented sets only as a bridge that leaves (R1), no whole bridging plant kept beside a top-up plant (R2), no kept share beside an owned top-up plant (R3); gas turbines as firm plant; the default lists; nothing removed with the rebuild off', () => {
    const r = getRun();
    for (const o of r.options) {
      const v = o.v;
      assert.ok(!(v.C2 === 'rented' && (v.C1 === 'islanded' || v.C3 !== 'remove')), `${o.id}: R1`);
      assert.ok(!(v.C1 === 'bridge' && v.C3 === 'prime' && v.C4 !== 'none' && v.C4s === 'shortfall'), `${o.id}: R2`);
      assert.ok(!(v.C1 === 'bridge' && v.C3 === 'split' && v.C4 !== 'none' && v.C4s === 'shortfall' && v.C4 !== 'existing' && !/^x[lbw]:/.test(v.C4)), `${o.id}: R3`);
    }
    for (const id of ['R1', 'R2', 'R3']) assert.ok(RULES.some((x) => x.id === id) && r.rules.some((x) => x.id === id));
    assert.ok(r.generation.removedByRule.R1 > 0 && r.generation.removedByRule.R3 > 0, JSON.stringify(r.generation.removedByRule));
    const i = normalizeInputs(t1(START));
    assert.deepEqual(i.choices.C3.values, ['remove', 'backup', 'split']);
    assert.ok(i.choices.C4.values.includes('gasTurbine') && i.choices.C4.values.includes('gasRecip'));
    assert.deepEqual(i.choices.C5.values, ['hvo', 'retained']);
    assert.ok(r.options.some((o) => o.v.C4 === 'gasTurbine' && o.sizing.prime && o.sizing.prime.tech === 'gasTurbine'), 'gas turbines as firm plant');
    // With the kept share beside a nearby plant from the bundled list (the stand-in row of the generator).
    const eem = eemSmall({ cap: 300 }); eem.settings.realism = true; eem.grid.fullMW = 60; // a permanent shortfall, so the split is open (rule h)
    const ge = all(normalizeInputs(eem));
    assert.ok(ge.options.some((o) => o.v.C3 === 'split' && /^x[lbw]:/.test(o.v.C4)), 'a kept share beside a list plant');
    // Rebuild off: the three rules remove nothing.
    const off = t1(START); off.settings.realism = false;
    const g0 = generateOptions(normalizeInputs(off));
    for (const id of ['R1', 'R2', 'R3']) assert.equal((g0.summary || g0.stats || g0).removedByRule[id] || 0, 0, id);
    return `removed: R1 ${r.generation.removedByRule.R1}, R2 ${r.generation.removedByRule.R2}, R3 ${r.generation.removedByRule.R3}; C4 ${i.choices.C4.values.join(', ')}`;
  });

  await test('75. Realism rebuild: the cards: a strategy is the permanent supply (a nearby plant is one strategy whether leased, bought or contracted); the first cards are the leading strategies and the last the best option of each lower level of IT that is cheaper than the levels above it', () => {
    const r = getRun();
    const { cards } = topCards(r.options, 5);
    assert.ok(cards.length >= 3);
    const lead = cards.filter((c) => !c.step), steps = cards.filter((c) => c.step);
    assert.equal(new Set(lead.map((c) => supplyKey(c.o))).size, lead.length, 'distinct permanent supplies');
    const topIT = cards[0].o.sizing.energise.poweredIT;
    for (const c of lead) assert.equal(c.o.sizing.energise.poweredIT >= topIT - 1e-6 || lead.indexOf(c) >= 3, true);
    let floor = cards[0].o.metrics.cost, prevIT = topIT;
    for (const c of steps) {
      const it = c.o.sizing.energise.poweredIT;
      assert.ok(it < prevIT && c.o.metrics.cost < floor, `step ${it} MW at ${c.o.metrics.cost}`);
      assert.ok(c.o.rankKeys.adequate && c.o.rankKeys.likely && c.o.rankKeys.resilient);
      // The best-ranked option of its level among those a developer could build.
      const best = r.options.filter((o) => near(o.sizing.energise.poweredIT, it) && o.rankKeys.adequate && o.rankKeys.likely && o.rankKeys.resilient).reduce((a, b) => (a.rank < b.rank ? a : b));
      assert.equal(c.o.id, best.id);
      floor = c.o.metrics.cost; prevIT = it;
    }
    assert.ok(steps.length >= 1, 'T1 has a cheaper step down (three buildings on the grid alone)');
    // One plant, one strategy.
    const v = { C1: 'wait', C4s: 'shortfall', C21: 'none' };
    assert.equal(supplyKey({ v: { ...v, C4: 'xl:abc' } }), supplyKey({ v: { ...v, C4: 'xb:abc' } }));
    assert.notEqual(supplyKey({ v: { ...v, C4: 'xl:abc' } }), supplyKey({ v: { ...v, C4: 'xl:def' } }));
    assert.equal(supplyKey({ v: { ...v, C1: 'bridge', C2: 'rented', C3: 'remove', C4: 'none' } }), supplyKey({ v: { ...v, C4: 'none' } }), 'a bridge that leaves is a variant of the same supply');
    assert.equal(strategyKey(cards[0].o), supplyKey(cards[0].o));
    return `${lead.length} leading strategies at ${topIT} MW IT; step${steps.length === 1 ? '' : 's'} down: ${steps.map((c) => `${c.o.sizing.energise.poweredIT} MW at ${c.o.eco.lcoe.toFixed(1)}/MWh against ${cards[0].o.eco.lcoe.toFixed(1)}`).join(', ')}`;
  });

  await test('76. Realism rebuild: country rules for data centres: every record has its status, date, source and link; the campus rules of a country (with the European Union\'s for a member state) are listed with the run; the Netherlands\' hyperscale rule is checked against the site', () => {
    for (const x of DC_RULES) {
      assert.ok(['in force', 'adopted', 'draft', 'announced'].includes(x.status), `${x.id}: status`);
      assert.ok(x.text.length > 20 && x.source.length > 3 && /^https:\/\//.test(x.url) && ['campus', 'option'].includes(x.scope) && /^[A-Z]{2}$/.test(x.country), x.id);
    }
    assert.equal(new Set(DC_RULES.map((x) => x.id)).size, DC_RULES.length);
    const gb = campusRules('GB'), nl = campusRules('NL');
    assert.ok(gb.some((x) => x.id === 'gb-covenant') && !gb.some((x) => x.country === 'EU'), 'Great Britain: no EU rules');
    assert.ok(nl.some((x) => x.id === 'nl-hyperscale') && nl.some((x) => x.id === 'eu-label'));
    const r = getRun();
    assert.equal(r.countryRules.country, 'GB');
    assert.ok(r.countryRules.rules.length === gb.length && r.countryRules.rules.every((x) => /accessed 2026-11-11, sourced — not independently checked$/.test(x.source)));
    const rn = runModel(t1(START, (i) => { i.project.country = 'NL'; i.site.areaHa = 15; }, 60));
    const hs = rn.countryRules.rules.find((x) => x.id === 'nl-hyperscale');
    assert.ok(hs.caught && /is caught by the rule/.test(hs.applies), hs.applies);
    assert.equal(rn.runFlags.find((f) => f.id === 'country-rules').severity, 'major');
    const rs = runModel(t1(START, (i) => { i.project.country = 'NL'; i.site.areaHa = 8; }, 60));
    assert.ok(!rs.countryRules.rules.find((x) => x.id === 'nl-hyperscale').caught);
    return `${DC_RULES.length} rules in ${new Set(DC_RULES.map((x) => x.country)).size} jurisdictions; GB ${gb.length}, NL ${nl.length} (with the EU's); hyperscale rule caught at 15 ha and 120 MW, not at 8 ha`;
  });

  await test('77. Realism rebuild: with the rebuild off the engine is the one merged on 2026-11-11: no building dates, tiers, plan check or rank keys; the same options, sizes and figures as a run that never knew the setting', () => {
    const a = referenceT1({ analysisStart: START }); a.settings.generationCap = 120; a.settings.realism = false;
    const b = referenceT1({ analysisStart: START }); b.settings.generationCap = 120; delete b.settings.realism; // the suite's default: off
    assert.equal(realismOn(normalizeInputs(b)), false, 'the suite pins the engine before the rebuild');
    const ra = runModel(a), rb = runModel(b);
    assert.equal(ra.options.length, rb.options.length);
    assert.ok(!ra.planCheck && !ra.countryRules && !ra.scoring.realism);
    for (let k = 0; k < ra.options.length; k++) {
      const x = ra.options[k], y = rb.options[k];
      assert.equal(x.key, y.key);
      assert.ok(x.sizing.energise === undefined && x.deliv.tier === undefined && x.rankKeys === undefined);
      assert.ok(x.eco.lcoe === y.eco.lcoe && x.score === y.score && x.rank === y.rank && x.deliv.score === y.deliv.score && x.ttp.metric === y.ttp.metric, x.id);
    }
    return `${ra.options.length} options: identical keys, LCOE, scores and ranks with the rebuild off`;
  });

  await test('79. Realism rebuild: a grid connection taken over: the option is dispatched on its own grid whatever was evaluated before it (known issue 40); the import right is a condition, unlikely where the country research found the route closed, and gone when ticked as confirmed; a bridge or a top-up with nothing left to do is not bought and not named; the standby wait follows plant that is bought; a card that stands on its own when every leading card needs another owner; a plant entered by hand that is also in the list counts once', () => {
    const eem = (mod = null) => { const x = eemSmall({ cap: 300 }); x.settings.realism = true; x.grid.fullMW = 60; if (mod) mod(x); return normalizeInputs(x); };
    const i = eem();
    const gen = all(i);
    const TK = 'tk:ppm11959';
    const plain = (x) => x.C5 === 'hvo' && x.C5a === 'perBuilding' && x.C12 === 'none' && x.C10 === 'none' && x.C13 === 'none';
    const vBridge = find(gen, (x) => plain(x) && x.C1 === 'bridge' && x.C2 === 'rented' && x.C3 === 'remove' && x.C4 === 'gasRecip' && x.C4s === 'shortfall' && x.C21 === 'none');
    const vTake = find(gen, (x) => plain(x) && x.C1 === 'wait' && x.C4 === 'none' && x.C21 === TK);
    // Known issue 40: the same building dates, with and without the takeover, in one context.
    const ctx = buildContext(i);
    const eb = evaluateOption(ctx, vBridge, { skipLayout: true });
    const et = evaluateOption(ctx, vTake, { skipLayout: true });
    assert.ok(eb.sz.energise.shifted && eb.sz.energise.key === et.sz.energise.key, `the two options share their building dates (${eb.sz.energise.key} / ${et.sz.energise.key})`);
    const octx = ctxFor(ctx, vTake, et.sz);
    assert.ok(octx.takeover && octx.takeover.value === TK && octx.energise, 'the option\'s context carries its takeover and its own dates');
    assert.ok(octx.gridCap[octx.takeover.month] > ctx.gridCap[octx.takeover.month], 'its grid is the taken-over connection');
    const fresh = evaluateOption(buildContext(i), vTake, { skipLayout: true });
    assert.ok(et.adequacy.adequate && fresh.adequacy.adequate && near(et.eco.lcoe, fresh.eco.lcoe) && near(et.eco.capex, fresh.eco.capex), `evaluated after another option: ${et.eco.lcoe} against ${fresh.eco.lcoe} alone`);
    const out = [`takeover option after a bridged one with the same dates (${et.sz.energise.key}): adequate, LCOE as evaluated alone`];
    // The import right on the plant's connection.
    const f = (e, id) => ({ c: e.deliv.conditions.find((x) => x.id === id), u: e.deliv.unlikely.find((x) => x.id === id) });
    assert.ok(f(et, 'takeover-import').c && /grid operator's agreement to an import right/.test(f(et, 'takeover-import').c.text) && !f(et, 'takeover-import').u);
    assert.ok(/has no closure date, so month 12 for its connection is a guess/.test(f(et, 'third-party').c.text), f(et, 'third-party').c.text);
    assert.equal(et.deliv.tier, 'B');
    const iOk = eem((x) => { x.plants = { ...x.plants, importConfirmed: { ppm11959: true }, agreed: { ppm11959: true } }; });
    const ok = evaluateOption(buildContext(iOk), vTake, { skipLayout: true });
    assert.ok(!f(ok, 'takeover-import').c && !f(ok, 'takeover-import').u && !f(ok, 'third-party').c, 'ticked: no finding');
    assert.ok(near(ok.deliv.score - et.deliv.score, 2 * i.deliverability.conditionPenalty));
    for (const cc of ['PT', 'GB', 'NO']) {
      const iC = eem((x) => { x.project.country = cc; });
      const e = evaluateOption(buildContext(iC), vTake, { skipLayout: true });
      assert.ok(f(e, 'takeover-import').u && e.deliv.tier === 'C', `${cc}: unlikely`);
    }
    out.push('import right: condition in the Netherlands, unlikely in Portugal, Great Britain and Norway, nothing when ticked');
    // Nothing to bridge, nothing to top up.
    const vNoBridge = find(gen, (x) => plain(x) && x.C1 === 'bridge' && x.C2 === 'gasRecip' && x.C3 === 'remove' && x.C4 === 'none' && x.C21 === TK);
    const nb = evaluateOption(ctx, vNoBridge, { skipLayout: true });
    assert.ok(!nb.sz.bridge && nb.sz.bridgeDropped && nb.sz.bridgeDropped.reason === 'none');
    const nbName = optionName(nb.v, nb.sz);
    assert.ok(/^Grid \(no bridge needed\) · /.test(nbName) && !/gas recips/i.test(nbName), nbName);
    assert.ok(near(nb.eco.lcoe, et.eco.lcoe), 'the same figures as the plain grid option');
    assert.equal(supplyKey({ v: nb.v, sizing: nb.sz }), supplyKey({ v: et.v, sizing: et.sz }), 'one strategy');
    const vTop = find(gen, (x) => plain(x) && x.C1 === 'wait' && x.C4 === 'gasRecip' && x.C4s === 'shortfall' && x.C21 === TK);
    const tp = evaluateOption(ctx, vTop, { skipLayout: true });
    assert.ok(!tp.sz.prime && tp.sz.topUpDropped && !/top-up/.test(optionName(tp.v, tp.sz)) && /Gas recips top-up/.test(optionName(vTop, null)), optionName(tp.v, tp.sz));
    assert.ok(tp.sz.sentences.some((x) => /no permanent shortfall on this option's grid/.test(x)));
    assert.equal(supplyKey({ v: tp.v, sizing: tp.sz }), supplyKey({ v: et.v, sizing: et.sz }));
    const vTop0 = find(gen, (x) => plain(x) && x.C1 === 'wait' && x.C4 === 'gasRecip' && x.C4s === 'shortfall' && x.C21 === 'none');
    const tp0 = evaluateOption(ctx, vTop0, { skipLayout: true });
    assert.ok(tp0.sz.prime && tp0.sz.prime.units > 0 && /Gas recips top-up/.test(optionName(tp0.v, tp0.sz)), 'without the takeover the shortfall stands and the top-up is bought');
    out.push(`"${nbName.split(' · ')[0]}" and no top-up beside a connection that covers the load`);
    // A run: the standby wait, the fallback card.
    const r = runModel(eem());
    let zero = 0;
    for (const o of r.options) {
      const b = o.sizing.backup;
      if (b.tech && !(b.units > 0) && !(b.bessMW > 0)) { zero++; assert.equal(o.sizing.standbyReadyM, o.sizing.bridge && o.sizing.bridge.units > 0 ? (o.sizing.bridge.earliestMonth ?? o.sizing.bridge.availMonth) : 0, `${o.id}: no gensets bought, no wait for them`); }
    }
    const sb = r.planCheck.items.find((x) => x.id === 'standby');
    const withGens = r.options.filter((o) => o.sizing.backup.tech && o.sizing.backup.units > 0);
    assert.ok(sb && new RegExp(`month ${Math.min(...withGens.map((o) => o.sizing.standbyReadyM))}:`).test(sb.text), sb && sb.text);
    const { cards } = topCards(r.options, 5);
    const lead = cards.filter((c) => !c.step && !c.fallback);
    const buildable = (o) => o.rankKeys.adequate && o.rankKeys.likely && o.rankKeys.resilient && o.sizing.energise.poweredIT > 0;
    const independent = r.options.filter((o) => buildable(o) && !dependsOnOthers(o));
    for (const c of cards.filter((x) => x.fallback)) assert.ok(!dependsOnOthers(c.o) && buildable(c.o));
    if (lead.every((c) => dependsOnOthers(c.o)) && independent.length) {
      const fb = cards.filter((c) => c.fallback);
      assert.equal(fb.length, 1, 'one card that stands on its own');
      assert.equal(fb[0].o.rank, Math.min(...independent.filter((o) => !topCards(r.options, 5).identical.has(o.id)).map((o) => o.rank)), 'the best-ranked of them');
      out.push(`cards: ${lead.length} leading (each needs another owner), then #${fb[0].o.rank} that stands on its own`);
    } else out.push(`cards: a leading card already stands on its own (${zero} options with no gensets to wait for)`);
    assert.ok(cards.some((c) => dependsOnOthers(c.o)) && r.options.some((o) => o.v.C21 === TK), 'the run holds takeover options');
    // A plant entered by hand that is in the list.
    const mag = plantCandidates(i).plants.find((c) => c.id === 'ppm4359');
    const iT = eem((x) => { x.project.lat = mag.lat; x.project.lon = mag.lon; x.existing = { ...x.existing, include: true, name: 'Magnum by hand', type: 'ccgt', units: 3, unitMW: 430, availableDate: '2027-06', leasePerKWMonth: 6, linkCapex: 8e6 }; });
    const tw = plantTwin(iT);
    assert.ok(tw && tw.list.id === 'ppm4359' && tw.manual.manual, 'the twin is found');
    assert.equal(plantTwin(i), null);
    const gT = all(iT), cT = buildContext(iT);
    const hand = evaluateOption(cT, find(gT, (x) => plain(x) && x.C1 === 'wait' && x.C4 === 'existing' && x.C4s === 'shortfall' && x.C21 === 'none'), { skipLayout: true });
    const list = evaluateOption(cT, find(gT, (x) => plain(x) && x.C1 === 'wait' && x.C4 === 'xl:ppm4359' && x.C4s === 'shortfall' && x.C21 === 'none'), { skipLayout: true });
    assert.equal(hand.sz.plantTwin, 'ppm4359');
    assert.equal(supplyKey({ v: hand.v, sizing: hand.sz }), supplyKey({ v: list.v, sizing: list.sz }), 'one plant, one strategy');
    out.push('a plant entered by hand that is in the list is one strategy');
    return out.join('; ');
  });

  await test('78. Realism rebuild: outside the test suite the rebuild is on: the lead times of 2026 with their sources (gas engines 21 months, turbines 40, fuel cells 12 + 5), engine 0.4.0, and a T1 run in which every option balances hour by hour, has a tier and building dates, and none has a power gap', () => {
    const env = { ...process.env }; delete env.ESTOOL_LEGACY_ENGINE; delete env.ESTOOL_LEGACY_ADDERS; env.ESTOOL_SCREEN_ALL_BELOW = '0';
    const durl = new URL('../src/engine/defaults.js', import.meta.url).href, rurl = new URL('../src/engine/run.js', import.meta.url).href;
    const code = `import { referenceT1, normalizeInputs, TECH, getRegistry, LABEL_SOURCED } from '${durl}'; import { runModel, ENGINE_VERSION } from '${rurl}';
      const i = referenceT1({ analysisStart: '${START}' }); i.settings.generationCap = 150;
      const n = normalizeInputs(i); const reg = getRegistry();
      const r = runModel(i);
      let bal = 0, gap = 0, noTier = 0, noEn = 0;
      for (const o of r.options) { for (const y of o.dispatch.years) bal = Math.max(bal, y.maxBalanceError); gap += o.ttp.gapMWm; if (!o.deliv.tier) noTier++; if (!o.sizing.energise) noEn++; }
      const L = r.options.find((o) => o.rank === 1);
      console.log(JSON.stringify({ realism: n.settings.realism, version: ENGINE_VERSION, lead: [TECH.gasRecip.p.procM, TECH.gasTurbine.p.procM, TECH.chp.p.procM, TECH.fuelCell.p.procM, TECH.fuelCell.p.buildM],
        sourced: ['tech.gasRecip.procM', 'tech.gasTurbine.procM', 'tech.fuelCell.procM', 'requirements.eiaMWth', 'requirements.limitedRunHours', 'requirements.dcoMWe'].map((p) => reg[p] && reg[p].label === LABEL_SOURCED && /^https:/.test(reg[p].url || '')),
        judgement: ['requirements.lateAllowanceM', 'requirements.eiaAllowanceM', 'requirements.dcoAllowanceM'].map((p) => reg[p] && reg[p].basis),
        c3: n.choices.C3.values, options: r.options.length, bal, gap, noTier, noEn, leader: L.name, tier: L.deliv.tier, late: L.sizing.energise.late, adequate: r.options.filter((o) => o.adequacy.adequate).length, plan: !!r.planCheck, rules: r.countryRules.rules.length }));`;
    const x = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env, maxBuffer: 1 << 26 }).toString());
    assert.equal(x.realism, true); assert.equal(x.version, '0.4.0');
    assert.deepEqual(x.lead, [21, 40, 21, 12, 5]);
    assert.ok(x.sourced.every(Boolean), `sourced records: ${x.sourced}`);
    assert.deepEqual(x.judgement, ['judgement', 'judgement', 'judgement']);
    assert.deepEqual(x.c3, ['remove', 'backup', 'split']);
    assert.ok(x.bal < 1e-6 && x.gap === 0 && x.noTier === 0 && x.noEn === 0 && x.plan && x.rules > 0, JSON.stringify(x));
    assert.equal(x.adequate, x.options, 'every option serves its load on its own dates');
    return `engine ${x.version}; lead times ${x.lead.join(', ')} months; ${x.options} T1 options, all balanced and adequate on their own dates; leader "${x.leader}" (tier ${x.tier}, late ${x.late.join('/')})`;
  });
}
