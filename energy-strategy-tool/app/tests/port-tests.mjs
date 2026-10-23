// Port slice tests (2026-10-18), called from tests/run-tests.mjs with its `test` helper and shared runs:
//  10. Bridging battery supplies from its programme month in sizing, time-to-power, dispatch and the BESS capex year
//      (port of the other line's test 13, commit e1161ce; BRIEF §9.8).
//  11. Owner decision 2026-10-18: PPA settlement counts only on PPA energy physically delivered; the settlement on
//      undelivered contracted volume is the "PPA hedge (not counted)" outside the ledger (11a); AC3 ledger
//      reconciliation for every option (11b).
//  12. Dispatch tab inspector (port of the other line's test 12, commit f236acc + e1161ce): the inspector equals the
//      run (12a), hourly sums equal the annual totals and the balance closes hourly (12b), the timeline gap equals
//      the time-to-power gap (12c), week slicing incl. the 8-day week 52 and the bridging battery month (12d), and
//      the rendered tab (12e).
//  13. Tornado sensitivity (port of the other line's test 9, commit f1fd5c5): the base re-run equals the run score,
//      rows sorted by swing, direction checks, the run unchanged (13a); every driver range is a §18 record that drives
//      the tornado, and the gas and carbon price inputs are read (13b); the rendered tab (13c).
//  14. Loading message, startup-error handler and hosted page (port of the other line's test 11, commits e9ed8f6 +
//      c3f81f5): index.html, the single file and dist/energy-tool-hosted.html (no document wrapper, no outside
//      reference, copy instead of download with the download code dropped). Run `npm run build` first.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  referenceT1, runModel, dispatchConfig, dispatchAll, techAvailMonth, bridgeActive, TECH, PPA,
  inspectOption, compareWithRun, weekRange, weekPresets, WEEKS_PER_YEAR, HOURS_PER_WEEK, H, normalizeInputs,
  tornado, TORNADO_DRIVERS, DEFAULT_DRIVER_IDS, TORNADO_MEASURES, sortRows, scoreAgainstRun, axisScore, getRegistry, LABEL, buildContext, COUNTRIES, FUEL, evaluateOption,
} from '../src/engine/index.js';
import { getViewBundle } from './view-bundle.mjs';

const relDiff = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b));

const ALL_YEARS = [0, 1, 2, 3, 4, 5, 6, 7];
const monthOfHour = (y, h) => y * 12 + (h < 8030 ? Math.floor(h / 730) : 11); // dispatch.js month of an hour

// T1 with C2 = BESS + solar added to the default subset: the only way bridging batteries are generated.
export function t1WithBridgingBattery(start) {
  const inp = referenceT1({ analysisStart: start });
  inp.choices = { ...(inp.choices || {}), C2: { state: 'open', values: ['gasRecip', 'fuelCell', 'rented', 'bessSolar'] } };
  return inp;
}

export async function batteryTimingTests(test, shared) {
  const runB = runModel(t1WithBridgingBattery(shared.START), { source: 'test10' });
  shared.runT1Bess = runB;
  await test('10. Bridging battery supplies from its programme month in sizing, time-to-power, dispatch and the BESS capex year (BRIEF §9.8), with and without a main battery', () => {
    const ctx = runB.ctx;
    const avail = techAvailMonth(ctx, TECH.bess);
    assert.ok(avail > 0, `BESS supply-available month ${avail}`);
    const bs = runB.options.filter((o) => o.v.C2 === 'bessSolar' && o.sizing.bridgeBess.mw > 0);
    const withMain = bs.filter((o) => o.v.C12 !== 'none');
    const noMain = bs.filter((o) => o.v.C12 === 'none');
    assert.ok(withMain.length > 0 && noMain.length > 0, `bridging-battery options with (${withMain.length}) and without (${noMain.length}) a main battery`);
    let fullAtOrAfter = 0;
    for (const o of bs) {
      // Sizing records the month; dispatch uses it for all battery capacity; time-to-power counts the battery from it.
      assert.equal(o.sizing.bridgeBess.availMonth, avail, `${o.id}: sizing month`);
      const cfg = dispatchConfig(ctx, o.v, o.sizing);
      assert.equal(cfg.bessAvailM, avail, `${o.id}: dispatch month ${cfg.bessAvailM} ≠ ${avail}`);
      for (let m = 0; m < ctx.nMonthsTimeline; m++) {
        const base = (o.v.C1 === 'islanded' ? 0 : ctx.gridCap[m]) + o.sizing.firmByMonth[m];
        const expect = base + (bridgeActive(o.v, m, o.sizing.T) && m >= avail ? o.sizing.bridgeBess.mw : 0);
        assert.ok(Math.abs(o.ttp.supplyByMonth[m] - expect) < 1e-9, `${o.id}: time-to-power supply in month ${m} ${o.ttp.supplyByMonth[m]} ≠ ${expect}`);
      }
      // The BESS capex line is booked in the year the battery can first supply.
      const line = o.eco.capexLines.find((l) => l.item === 'BESS');
      assert.ok(line && line.year === Math.floor(avail / 12), `${o.id}: BESS capex year ${line && line.year} ≠ ${Math.floor(avail / 12)}`);
      if (o.ttp.fullLoadM != null && o.ttp.fullLoadM >= avail) fullAtOrAfter++;
    }
    // Hourly: no charge or discharge in any hour of a month before the same month (one option with and one without a
    // main battery), the battery is used from that month, and the re-dispatch equals the run's annual figures.
    const notes = [];
    for (const o of [withMain[0], noMain[0]]) {
      const d = dispatchAll(ctx, dispatchConfig(ctx, o.v, o.sizing), ALL_YEARS);
      let early = 0, after = 0;
      d.years.forEach((yr, y) => {
        for (let h = 0; h < yr.hourly.dis.length; h++) {
          const act = yr.hourly.dis[h] > 1e-9 || yr.hourly.ch[h] > 1e-9;
          if (!act) continue;
          if (monthOfHour(y, h) < avail) early++; else after++;
        }
        for (const k of ['bessDischargeMWh', 'bessChargeMWh', 'unmetMWh', 'gridMWh', 'firmMWh']) assert.equal(yr[k], o.dispatch.years[y][k], `${o.id} year ${y}: ${k} differs from the run`);
      });
      assert.equal(early, 0, `${o.id}: battery active in ${early} hours before month ${avail}`);
      assert.ok(after > 0, `${o.id}: battery never used`);
      notes.push(`${o.v.C12 === 'none' ? 'no main battery' : `main battery ${o.v.C12}`} (${o.id}): ${after.toLocaleString('en-GB')} active hours, none before month ${avail}; full load month ${o.ttp.fullLoadM ?? 'not reached'}`);
    }
    // A main battery without a bridging battery uses the same month.
    const mainOnly = runB.options.find((o) => o.v.C2 !== 'bessSolar' && o.sizing.storage.mw > 0);
    assert.equal(dispatchConfig(ctx, mainOnly.v, mainOnly.sizing).bessAvailM, avail, 'main battery month differs');
    return `BESS supply-available month ${avail} (planning + procurement + construction); ${bs.length} bridging-battery options on T1 + BESS + solar (${withMain.length} with a main battery, ${noMain.length} without): sizing, dispatch and time-to-power all use month ${avail}, BESS capex in year ${Math.floor(avail / 12)}; ${fullAtOrAfter} reach full load at or after it; ${notes.join('; ')}.`;
  });
}

// Cost-axis spread: the axis range and how far apart the cost scores of the options with an ordinary LCOE are.
export function costAxisSpread(run) {
  const normal = run.options.filter((o) => Number.isFinite(o.eco.lcoe) && o.eco.lcoe >= 0 && o.eco.lcoe <= 1000);
  const sc = normal.map((o) => o.axisScores.cost);
  const lo = sc.length ? Math.min(...sc) : NaN, hi = sc.length ? Math.max(...sc) : NaN;
  return { range: run.scoring.ranges.cost, normal: normal.length, lo, hi, spread: hi - lo };
}

export async function ppaTests(test, { runT1, runT3 }) {
  await test('11a. PPA settlement counts only on PPA energy physically delivered; the settlement on undelivered contracted volume is the "PPA hedge (not counted)", outside the ledger, LCOE, NPV and score (owner decision 2026-10-18)', async () => {
    const out = [];
    for (const [label, run] of [['T1', runT1], ['T3', runT3]]) {
      const E = run.inputs.economics;
      const N = E.periodYears;
      const adder = run.ctx.priceAdder;
      let withPPA = 0, withHedge = 0, minor = 0, info = 0, oldNeg = 0, oldNonFinite = 0, mixedSign = 0;
      let hedgeIncome = 0, hedgeCost = 0;
      for (const o of run.options) {
        const d = o.dispatch.years;
        const nExp = d.length;
        assert.ok(o.eco.ledger.every((L) => !('ppaHedge' in L) && !('hedge' in L)), `${label} ${o.id}: a ledger row carries the hedge`);
        if (!o.sizing.ppa) {
          assert.equal(o.eco.ppaHedge, null, `${label} ${o.id}: hedge without a PPA`);
          assert.ok(o.eco.ledger.every((L) => L.ppa === 0), `${label} ${o.id}: PPA cost without a PPA`);
          assert.ok(!o.flags.some((f) => f.id === 'ppa-import-limited' || f.id === 'ppa-above-load'), `${label} ${o.id}: PPA flag without a PPA`);
          if (Number.isFinite(o.eco.lcoe) && o.eco.lcoe < 0) oldNeg++; // unchanged by the decision
          if (!Number.isFinite(o.eco.lcoe)) oldNonFinite++;
          continue;
        }
        withPPA++;
        const h = o.eco.ppaHedge;
        const price = PPA.strike[o.sizing.ppa.type] + PPA.shapingAdder;
        assert.equal(h.price, price);
        assert.equal(h.byYear.length, N);
        let pvOldExtra = 0; // PV of (old PPA line − new PPA line): what the old rule netted in on undelivered volume
        for (let y = 0; y < N; y++) {
          const dy = d[Math.min(y, nExp - 1)];
          const esc = Math.pow(1 + E.elecEscalation, y);
          assert.ok(Math.abs(dy.ppaContractMWh - dy.ppaDeliveredMWh - dy.ppaUndeliveredMWh) <= 1e-6 * Math.max(1, dy.ppaContractMWh), `${label} ${o.id} y${y}: contract ≠ delivered + undelivered`);
          assert.ok(relDiff(o.eco.ledger[y].ppa, dy.ppaDeliveredMWh * price) < 1e-12, `${label} ${o.id} y${y}: ledger PPA line ${o.eco.ledger[y].ppa} ≠ delivered × price`);
          assert.ok(o.eco.ledger[y].ppa >= 0, `${label} ${o.id} y${y}: negative PPA line`);
          assert.ok(relDiff(h.byYear[y], dy.ppaUndeliveredSpotValue * esc - dy.ppaUndeliveredMWh * price) < 1e-12, `${label} ${o.id} y${y}: hedge`);
          // The rule before the decision: PPA price on the whole contract, undelivered volume netted at the hourly grid
          // price incl. the non-commodity adder (reconstructed from this run's dispatch; the adder is one value per run).
          const oldLine = dy.ppaContractMWh * price - (dy.ppaUndeliveredSpotValue + adder * dy.ppaUndeliveredMWh) * esc;
          pvOldExtra += (oldLine - o.eco.ledger[y].ppa) * Math.pow(1 + E.wacc, -(y + 1));
        }
        const pvE = o.eco.reconciliation.pvEnergy;
        const oldLcoe = pvE > 0 ? (o.eco.npvCost + pvOldExtra) / pvE : Infinity;
        if (!Number.isFinite(oldLcoe)) oldNonFinite++; else if (oldLcoe < 0) oldNeg++;
        // O3 (2026-10-23): two flags, import-limited (minor) and above the load (info), shares adding to 100 %.
        const fl = o.flags.find((x) => x.id === 'ppa-import-limited');
        const fa = o.flags.find((x) => x.id === 'ppa-above-load');
        const f = fl || fa;
        if (h.undeliveredMWh > 1e-6) {
          withHedge++;
          if (h.total >= 0) hedgeIncome++; else hedgeCost++;
          assert.ok(f, `${label} ${o.id}: hedge of ${h.undeliveredMWh} MWh undelivered without a PPA flag`);
          assert.ok(f.message.includes('"PPA hedge (not counted)"') && f.message.includes('not in the cost ledger, LCOE, NPV or score'), `${label} ${o.id}: flag does not explain the hedge`);
          assert.equal(!!fl, h.limitedMWh > 1e-6, `${label} ${o.id}: import-limited flag`);
          assert.ok(!fl || fl.severity === 'minor'); assert.ok(!fa || fa.severity === 'info');
          assert.ok(Math.abs((fl ? fl.share : 0) + (fa ? fa.share : 0) - 100) < 1e-6, `${label} ${o.id}: O3 shares do not add to 100 %`);
          if (fl) minor++; else info++;
          // Opus review: a present value of the opposite sign to the total names its own sign in the flag.
          const word = (x) => (x >= 0 ? 'income' : 'cost');
          assert.ok(f.message.includes(`a net ${word(h.total)} of`), `${label} ${o.id}: flag names the wrong sign for the hedge total`);
          if (word(h.pv) !== word(h.total)) {
            mixedSign++;
            assert.ok(f.message.includes(`present value a net ${word(h.pv)} of`), `${label} ${o.id}: hedge total ${h.total} and present value ${h.pv} differ in sign but the flag does not say so`);
          }
        } else assert.ok(!f, `${label} ${o.id}: PPA flag with every PPA MWh delivered`);
      }
      const neg = run.options.filter((o) => Number.isFinite(o.eco.lcoe) && o.eco.lcoe < 0);
      const nonFinite = run.options.filter((o) => !Number.isFinite(o.eco.lcoe)).length;
      assert.equal(neg.length, 0, `${label}: ${neg.length} options with a negative LCOE (e.g. ${neg[0] && neg[0].id} ${neg[0] && neg[0].eco.lcoe})`);
      const sp = costAxisSpread(run);
      out.push(`${label}: ${withPPA} options with a PPA, ${withHedge} with undelivered volume (hedge income ${hedgeIncome}, cost ${hedgeCost}; ${mixedSign} with a present value of the other sign, named in the flag; flags: import-limited ${minor}, above the load only ${info}); PPA ledger line = delivered × price in every year; LCOE negative ${oldNeg} under the old rule (reconstructed) → ${neg.length}, non-finite ${oldNonFinite} → ${nonFinite}; cost axis ${sp.range.lo.toFixed(1)}–${sp.range.hi.toExponential(3)} €/MWh, ${sp.normal} options with LCOE 0–1,000 €/MWh span ${sp.spread.toFixed(3)} cost points (${sp.lo.toFixed(3)}–${sp.hi.toFixed(3)})`);
    }
    // Option detail (rendered): the hedge row names the present value's own sign when it differs from the total's.
    const word = (x) => (x >= 0 ? 'income' : 'cost');
    const mixed = runT1.options.find((o) => o.eco.ppaHedge && o.eco.ppaHedge.undeliveredMWh > 1e-6 && word(o.eco.ppaHedge.pv) !== word(o.eco.ppaHedge.total));
    if (mixed) {
      const B = await getViewBundle();
      const row = (B.renderOptionDetail(mixed).match(/<tr class="hedge-row">[\s\S]*?<\/tr>/) || [''])[0];
      assert.ok(row.includes(`net ${word(mixed.eco.ppaHedge.total)} `) && row.includes(`present value net ${word(mixed.eco.ppaHedge.pv)} `), `${mixed.id}: option detail hedge row does not name the present value's sign: ${row.replace(/<[^>]+>/g, '')}`);
      out.push(`option detail of ${mixed.id}: "${row.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()}"`);
    }
    return out.join('; ') + '.';
  });

  await test('11b. AC3: LCOE, NPV and the capex/opex split derive from the one cash-flow ledger for every option, T1 and T3 (difference < 0.1 %)', () => {
    let n = 0, worst = 0;
    for (const [label, run] of [['T1', runT1], ['T3', runT3]]) {
      const r = run.inputs.economics.wacc;
      for (const o of run.options) {
        const e = o.eco;
        let pvCapex = 0, pvOpex = 0, pvE = 0, capexEx = 0;
        e.ledger.forEach((L, y) => {
          const capexTotal = L.capex + L.contingency + L.replacement + L.residual;
          const opex = L.fom + L.vom + L.fuel + L.grid + L.ppa + L.carbon + L.rental + L.testRun - L.revenue;
          assert.ok(relDiff(capexTotal, L.capexTotal) < 1e-12 && relDiff(opex, L.opex) < 1e-12, `${label} ${o.id} y${y}: ledger row totals`);
          pvCapex += capexTotal * Math.pow(1 + r, -y);
          pvOpex += opex * Math.pow(1 + r, -(y + 1));
          pvE += L.deliveredMWh * Math.pow(1 + r, -(y + 1));
          capexEx += L.capex;
        });
        const npv = pvCapex + pvOpex;
        const d1 = Math.abs(npv - e.npvCost) / Math.max(1, Math.abs(npv));
        const d2 = pvE > 0 ? Math.abs(e.lcoe * pvE - npv) / Math.max(1, Math.abs(npv)) : (e.lcoe === Infinity ? 0 : 1);
        const d3 = npv !== 0 ? Math.abs(e.capexShare - pvCapex / npv) : 0;
        const d4 = Math.abs(capexEx - e.capexExContingency) / Math.max(1, Math.abs(capexEx));
        const d5 = Math.abs(e.capexLines.reduce((s, l) => s + l.amount, 0) - capexEx) / Math.max(1, Math.abs(capexEx));
        worst = Math.max(worst, d1, d2, d3, d4, d5);
        assert.ok(d1 < 1e-3 && d2 < 1e-3 && d3 < 1e-3 && d4 < 1e-3 && d5 < 1e-3, `${label} ${o.id}: ledger does not reconcile (NPV ${d1}, LCOE ${d2}, split ${d3}, capex ${d4}, lines ${d5})`);
        n++;
      }
    }
    return `${n} options (T1 and T3): NPV = Σ discounted ledger capex + opex, LCOE × discounted delivered energy = NPV, capex share = PV capex ÷ NPV, capex lines = ledger capex; largest relative difference ${worst.toExponential(2)} (limit 1e-3); the PPA hedge is in no ledger row.`;
  });
}

// Options to inspect: the leaders, one per archetype, and options that exercise each part of the pipeline.
function inspectionPicks(run, extra = []) {
  const ranked = run.options.slice().sort((a, b) => a.rank - b.rank);
  const picks = new Map();
  const add = (o, why) => { if (o && !picks.has(o.id)) picks.set(o.id, { o, why }); };
  add(ranked[0], 'leader'); add(ranked[1], 'rank 2');
  for (const o of ranked) if (o.archetype && ![...picks.values()].some((p) => p.o.archetype === o.archetype)) add(o, `archetype ${o.archetype}`);
  add(ranked.find((o) => o.v.C10 === 'roofGround' && o.sizing.solarGroundMWp > 0), 'ground PV');
  add(ranked.find((o) => o.sizing.storage.mw > 0 && o.v.C2 !== 'bessSolar'), 'main battery');
  add(ranked.find((o) => o.sizing.prime && o.sizing.bridge), 'prime + bridging plant');
  add(ranked.find((o) => o.siteFit && o.siteFit.status === 'Does not fit'), 'does not fit');
  add(ranked.find((o) => o.unmet.mwh > 1e-6), 'unmet load');
  add(ranked.find((o) => o.sizing.ppa), 'PPA');
  for (const [o, why] of extra) add(o, why);
  return [...picks.values()];
}

const ENGINE_YEAR_SKIP = new Set(['hourly', 'plants']);

export async function inspectorTests(test, shared) {
  const { runT1, runT3, runT1Bess: runB } = shared;
  const cases = [];
  await test('12a. Dispatch tab inspector (src/engine/inspect.js): re-running one option through the full pipeline (sizing, layout, fill-residual solar, dispatch with hourly records, time-to-power, economics, flags) gives exactly the figures of the run', () => {
    const bsWith = runB.options.find((o) => o.v.C2 === 'bessSolar' && o.sizing.bridgeBess.mw > 0 && o.v.C12 !== 'none');
    const bsNo = runB.options.find((o) => o.v.C2 === 'bessSolar' && o.sizing.bridgeBess.mw > 0 && o.v.C12 === 'none');
    const sets = [['T1', runT1, inspectionPicks(runT1)], ['T3', runT3, inspectionPicks(runT3).slice(0, 6)], ['T1 + BESS + solar', runB, [{ o: bsWith, why: 'bridging battery with a main battery' }, { o: bsNo, why: 'bridging battery without a main battery' }]]];
    const notes = [];
    let k = 0;
    for (const [label, run, picks] of sets) {
      for (const { o, why } of picks) {
        // Every other inspection rebuilds the site model, so both paths (run's site model and a rebuilt one) are covered.
        const I = inspectOption(run.inputs, o.v, k++ % 2 ? {} : { site: run.ctx.site });
        const c = compareWithRun(I, o);
        assert.ok(c.matches, `${label} ${o.id} (${why}): ${c.diffs.slice(0, 4).map((d) => `${d.label} ${d.inspector} vs ${d.run}`).join('; ')}`);
        assert.equal(I.years.length, o.dispatch.years.length, `${label} ${o.id}: dispatched years`);
        I.years.forEach((y, i) => {
          for (const [key, val] of Object.entries(o.dispatch.years[i])) {
            if (ENGINE_YEAR_SKIP.has(key)) continue;
            assert.deepEqual(y.engine[key], val, `${label} ${o.id} year ${i}: ${key}`);
          }
          assert.deepEqual(y.engine.plants, o.dispatch.years[i].plants, `${label} ${o.id} year ${i}: plants`);
        });
        assert.deepEqual(I.flagIds, o.flags.map((f) => f.id), `${label} ${o.id}: flags`);
        assert.equal(I.solarGroundMWp, o.sizing.solarGroundMWp, `${label} ${o.id}: ground PV`);
        assert.deepEqual(I.eco.ppaHedge, o.eco.ppaHedge, `${label} ${o.id}: PPA hedge`);
        assert.deepEqual(I.adequacy, o.adequacy, `${label} ${o.id}: power adequacy`);
        cases.push({ label, run, o, I, why });
      }
      notes.push(`${label}: ${picks.length} options (${picks.map((p) => p.why).join(', ')})`);
    }
    return `${cases.length} inspections equal the run in every dispatched year (all annual fields and per-plant figures), time-to-power, LCOE, NPV, PPA hedge, power adequacy, solar size, deliverability, site fit and flags; ${notes.join('; ')}.`;
  });

  await test('12b. Hourly records sum to the engine\'s annual totals, and the energy balance closes in every hour of every inspected year', () => {
    const SUMS = [['re', 'reGenMWh'], ['solar', 'solarMWh'], ['wind', 'windMWh'], ['ppa', 'ppaDeliveredMWh'], ['ppaContract', 'ppaContractMWh'], ['dis', 'bessDischargeMWh'], ['ch', 'bessChargeMWh'],
      ['firm', 'firmMWh'], ['gridCharge', 'gridChargeMWh'], ['unmet', 'unmetMWh'], ['curt', 'curtailMWh'], ['exp', 'exportMWh'], ['net', 'netDemandMWh'], ['demand', 'grossDemandMWh'], ['chpCredit', 'chpCreditMWh'], ['flex', 'flexMWh']];
    let years = 0, worstSum = 0, worstHour = 0, worstYear = 0;
    for (const { label, o, I } of cases) {
      for (const y of I.years) {
        const r = y.hourly;
        const tot = (a) => a.reduce((s, x) => s + x, 0);
        for (const [hk, ek] of SUMS) {
          const d = Math.abs(tot(r[hk]) - y.engine[ek]) / Math.max(1, Math.abs(y.engine[ek]));
          worstSum = Math.max(worstSum, d);
          assert.ok(d < 1e-9, `${label} ${o.id} year ${y.index}: Σ ${hk} ≠ ${ek}`);
        }
        const dg = Math.abs(tot(r.grid) + tot(r.gridCharge) - y.engine.gridMWh) / Math.max(1, y.engine.gridMWh);
        assert.ok(dg < 1e-9, `${label} ${o.id} year ${y.index}: grid to load + grid to battery ≠ gridMWh`);
        r.plant.forEach((a, i) => assert.ok(Math.abs(tot(a) - y.engine.plants[i].mwh) <= 1e-9 * Math.max(1, y.engine.plants[i].mwh), `${label} ${o.id}: plant ${i} hourly sum`));
        for (let h = 0; h < H; h++) {
          let pl = 0;
          for (const a of r.plant) pl += a[h];
          assert.ok(Math.abs(pl - r.firm[h]) < 1e-9, `${label} ${o.id} h${h}: plants ≠ firm`);
          assert.ok(Math.abs(r.solar[h] + r.wind[h] - r.re[h]) < 1e-9, `${label} ${o.id} h${h}: solar + wind ≠ renewables`);
        }
        worstHour = Math.max(worstHour, y.balance.maxHourlyResidual);
        worstYear = Math.max(worstYear, Math.abs(y.balance.residual));
        assert.ok(y.balance.maxHourlyResidual < 1e-9, `${label} ${o.id} year ${y.index}: hourly residual ${y.balance.maxHourlyResidual}`);
        years++;
      }
    }
    return `${years} inspected years: ${SUMS.length + 1} hourly sums equal the annual totals (largest relative difference ${worstSum.toExponential(1)}), per-plant hours sum to the firm output, solar + wind = renewables; largest hourly balance residual ${worstHour.toExponential(1)} MWh, largest annual in − out ${worstYear.toExponential(1)} MWh.`;
  });

  await test('12c. Phasing timeline: grid + firm plant by source + battery bridging = the supply time-to-power counts in every month, and the timeline gap equals the time-to-power power gap', () => {
    let n = 0, worstGap = 0;
    for (const { label, o, I } of cases) {
      const tl = I.timeline;
      for (let m = 0; m < tl.months; m++) {
        const pl = tl.plants.reduce((s, p) => s + p.values[m], 0);
        assert.ok(Math.abs(pl - tl.firm[m]) < 1e-9, `${label} ${o.id} month ${m}: plants ${pl} ≠ firm ${tl.firm[m]}`);
        assert.ok(Math.abs(tl.grid[m] + tl.firm[m] + tl.bess[m] - tl.supply[m]) < 1e-9, `${label} ${o.id} month ${m}: sources ≠ supply`);
        assert.equal(tl.design[m], o.sizing.designByMonth[m], `${label} ${o.id} month ${m}: design load`);
      }
      const gap = tl.gap.reduce((s, x) => s + x, 0);
      const months = tl.gap.filter((x) => x > 0).length;
      worstGap = Math.max(worstGap, Math.abs(gap - o.ttp.gapMWm));
      assert.ok(Math.abs(gap - o.ttp.gapMWm) < 1e-6, `${label} ${o.id}: timeline gap ${gap} ≠ time-to-power gap ${o.ttp.gapMWm}`);
      assert.equal(months, o.ttp.gapMonths, `${label} ${o.id}: gap months`);
      n++;
    }
    return `${n} timelines: sources add up to the time-to-power supply in every month; Σ power gap = time-to-power gap (largest difference ${worstGap.toExponential(1)} MW-months), gap months equal.`;
  });

  await test('12d. Weeks: 52 contiguous weeks cover all 8,760 hours (week 52 is 8 days, 192 h); presets name valid weeks and "most unmet" holds the most unmet load; the bridging battery is idle before its month in the inspector too', () => {
    let next = 0;
    for (let w = 1; w <= WEEKS_PER_YEAR; w++) {
      const r = weekRange(w);
      assert.equal(r.from, next);
      assert.equal(r.to - r.from, w < WEEKS_PER_YEAR ? HOURS_PER_WEEK : HOURS_PER_WEEK + 24, `week ${w} length`);
      next = r.to;
    }
    assert.equal(next, H, 'weeks do not cover the whole year');
    assert.deepEqual(weekRange(0), weekRange(1));
    assert.deepEqual(weekRange(99), weekRange(WEEKS_PER_YEAR));
    let checked = 0;
    for (const { o, I } of cases) {
      for (const y of I.years) {
        const pr = weekPresets(y.hourly);
        for (const p of pr) assert.ok(p.week >= 1 && p.week <= WEEKS_PER_YEAR, `${o.id}: preset ${p.id} week ${p.week}`);
        const un = pr.find((p) => p.id === 'unmet');
        if (un) {
          const wsum = (w) => { const r = weekRange(w); let s = 0; for (let h = r.from; h < r.to; h++) s += y.hourly.unmet[h]; return s; };
          const best = Math.max(...Array.from({ length: WEEKS_PER_YEAR }, (_, i) => wsum(i + 1)));
          assert.ok(Math.abs(wsum(un.week) - best) < 1e-6, `${o.id}: most-unmet week ${un.week} is not the maximum`);
          checked++;
        }
      }
    }
    // Bridging battery (port of the other line's test 13, inspector side): no battery in the timeline or in any hour
    // before its month, with and without a main battery.
    const notes = [];
    for (const { o, I, why } of cases.filter((c) => c.o.v.C2 === 'bessSolar')) {
      const avail = I.bess.bridgeAvailMonth;
      assert.ok(avail > 0, `${o.id}: bridging battery month ${avail}`);
      for (let m = 0; m < Math.min(avail, I.timeline.months); m++) assert.equal(I.timeline.bess[m], 0, `${o.id}: battery counted in month ${m} < ${avail}`);
      let early = 0;
      I.years.forEach((y) => { for (let h = 0; h < H; h++) { const m = y.fromMonth + (h < 8030 ? Math.floor(h / 730) : 11); if (m < avail && (y.hourly.dis[h] > 1e-9 || y.hourly.ch[h] > 1e-9)) early++; } });
      assert.equal(early, 0, `${o.id}: battery dispatched in ${early} hours before month ${avail}`);
      notes.push(`${why}: month ${avail}, full load month ${I.ttp.fullLoadM ?? 'not reached'}`);
    }
    return `52 weeks from hour 0 to 8,760 (week 52 = 192 h); presets valid in every inspected year, "most unmet" checked in ${checked} years; bridging battery idle before its month in timeline and dispatch (${notes.join('; ')}).`;
  });

  await test('12e. Dispatch tab (server render): timeline and hourly charts are keyboard-operable applications with a description, the legend uses the site plan\'s energy-source colours (wind with its hatch), table views, energy balance and the check against the ranking', async () => {
    const B = await getViewBundle();
    const out = [];
    const lead = cases[0];
    const html = B.renderDispatch(lead.run, lead.o, lead.I);
    for (const idc of ['dispatch-timeline', 'dispatch-chart']) {
      const tag = (html.match(new RegExp(`<div[^>]*id="${idc}"[^>]*>`)) || [''])[0];
      assert.ok(/role="application"/.test(tag) && /tabindex="0"/.test(tag) && /aria-label="[^"]*arrow keys/.test(tag), `${idc}: not a focusable application with keyboard help`);
    }
    for (const t of ['Phasing: supply against design load', 'Hourly dispatch (MW)', 'Timeline as a table', 'as a table (MW, hourly)', 'Energy balance, year', 'Total in', 'Total out', 'Week 52 runs to the end of the year']) assert.ok(html.includes(t), `"${t}" missing`);
    assert.ok(/data-check="match"/.test(html), 'the check against the ranking does not say it matches');
    const srcVars = [...new Set([...html.matchAll(/var\(--src-([a-zA-Z]+)\)/g)].map((m) => m[1]))].sort();
    assert.ok(srcVars.includes('grid'), 'grid colour missing');
    for (const v of srcVars) assert.ok(['grid', 'solar', 'wind', 'bess', 'gas', 'fuelCell', 'diesel', 'hydrogen', 'nuclear', 'curtail'].includes(v), `unexpected colour token --src-${v}`);
    out.push(`T1 leader: 2 charts${lead.I.bess.mwh > 0 ? ' + charge level' : ''}, tokens ${srcVars.map((v) => `--src-${v}`).join(', ')}, check says "match"`);
    // Firm plant draws in its plan colour with its plan hatch (texture carries identity where colour pairs fail).
    const firmCase = cases.find((c) => c.I.plants.length > 0 && c.I.years.some((y) => y.balance.firm > 1));
    const yF = firmCase.I.years.findIndex((y) => y.balance.firm > 1);
    const hf = B.renderDispatch(firmCase.run, firmCase.o, firmCase.I, yF);
    const firmSrc = firmCase.I.plants[0].source;
    const band = (hf.match(new RegExp(`<g data-series="firm-${firmSrc}">[\\s\\S]*?</g>`)) || [''])[0];
    assert.ok(band.includes(`var(--src-${firmSrc})`) && band.includes('fill="url(#'), `firm band ${firmSrc} without its colour and hatch`);
    out.push(`${firmCase.o.id} (${firmCase.why}): firm plant (${firmCase.I.plants.map((p) => p.source).join(', ')}) in its plan colour with its plan hatch`);
    // Wind: T1 with off-site land for wind; the wind band and its legend swatch carry the plan's wind hatch.
    const inp = normalizeInputs(lead.run.inputs);
    inp.site.offsiteLandHa = 100;
    const v = { ...lead.o.v, C11: 'offsite' };
    const Iw = inspectOption(inp, v);
    assert.ok(Iw.windMW > 0, 'no wind in the wind case');
    const yW = Iw.years.findIndex((y) => y.balance.wind > 1);
    assert.ok(yW >= 0, 'no year with wind');
    const hw = B.renderDispatch(lead.run, { ...lead.o, v }, Iw, yW);
    assert.ok(/var\(--src-wind\)/.test(hw), 'wind colour missing');
    const pats = (hw.match(/<pattern /g) || []).length;
    const wband = (hw.match(/<g data-series="wind">[\s\S]*?<\/g>/) || [''])[0];
    assert.ok(pats >= 1 && wband.includes('var(--src-wind)') && wband.includes('fill="url(#'), `wind band without hatch (${pats} patterns)`);
    out.push(`off-site wind case (year ${yW + 1}): ${Iw.windMW} MW wind, the wind band and its legend swatch carry the plan's wind hatch (${pats} pattern definitions)`);
    return out.join('; ') + '.';
  });
}

async function withRecordField(path, field, value, fn) {
  const r = getRegistry()[path];
  assert.ok(r, `no record ${path}`);
  const old = r[field];
  r[field] = value;
  try { return await fn(); } finally { r[field] = old; }
}

export async function sensitivityTests(test, shared) {
  const { runT1, runT3 } = shared;
  let resultT1 = null;
  await test('13a. Tornado (src/engine/sensitivity.js, §13.3): the base re-run reproduces the run score (T1 and T3 leaders), rows are sorted by swing with every driver once, directions hold, and the run is not changed', () => {
    const out = [];
    for (const [label, run] of [['T1', runT1], ['T3', runT3]]) {
      const before = run.options.map((o) => [o.id, o.score, o.rank]);
      const lead = run.options.reduce((a, b) => (a.rank < b.rank ? a : b));
      const t = tornado(run, lead.id, { site: run.ctx.site });
      const diff = Math.abs(t.base.score - lead.score);
      assert.ok(diff < 1e-9, `${label}: base re-run ${t.base.score} differs from the run score ${lead.score} by ${diff}`);
      assert.equal(t.base.lcoe, lead.eco.lcoe, `${label}: base LCOE`);
      assert.equal(t.measure, 'lcoe', `${label}: default measure is LCOE`);
      for (let i = 1; i < t.rows.length; i++) assert.ok(t.rows[i - 1].measureSwing >= t.rows[i].measureSwing, `${label}: rows not sorted by LCOE swing`);
      const bySc = sortRows(t.allRows, 'score');
      for (let i = 1; i < bySc.length; i++) assert.ok(bySc[i - 1].swing >= bySc[i].swing - 1e-12, `${label}: rows not sorted by score swing`);
      assert.equal(new Set(t.allRows.map((r) => r.id)).size, TORNADO_DRIVERS.length, `${label}: every driver once`);
      assert.equal(t.rows.length, Math.min(t.topN, TORNADO_DRIVERS.length));
      for (const r of t.allRows) for (const x of [r.low.score, r.high.score]) assert.ok(x >= 0 && x <= 100, `${label}: score ${x} outside 0–100`);
      const gd = t.allRows.find((r) => r.id === 'grid-date');
      assert.ok(gd.high.ttpMetric >= gd.low.ttpMetric - 1e-9, `${label}: a later grid date improves time-to-power`);
      const cp = t.allRows.find((r) => r.id === 'carbon-price');
      if (lead.carbon.scope1T > 0) assert.ok(Math.abs(cp.high.lcoe - cp.low.lcoe) > 0, `${label}: carbon price did not move LCOE despite Scope 1 emissions`);
      else assert.ok(Math.abs(cp.high.lcoe - cp.low.lcoe) <= 1e-9 * Math.abs(cp.low.lcoe), `${label}: carbon price moved LCOE without Scope 1 emissions`);
      const it = t.allRows.find((r) => r.id === 'it-load');
      assert.ok(it.low.lcoe !== it.high.lcoe, `${label}: IT load did not move LCOE`);
      // The run itself is untouched: same scores and ranks for every option.
      assert.deepEqual(run.options.map((o) => [o.id, o.score, o.rank]), before, `${label}: the tornado changed the run`);
      if (label === 'T1') resultT1 = t;
      out.push(`${label} leader ${lead.id}: base ${t.base.score.toFixed(6)} = run ${lead.score.toFixed(6)} (diff ${diff.toExponential(1)}); largest swings ${t.rows.slice(0, 3).map((r) => `${r.label} ${r.swing.toFixed(2)} pts (LCOE ${Number.isFinite(r.low.lcoe) ? r.low.lcoe.toFixed(1) : '∞'}–${Number.isFinite(r.high.lcoe) ? r.high.lcoe.toFixed(1) : '∞'} €/MWh)`).join('; ')}; carbon price swing ${cp.swing.toFixed(3)} pts (Scope 1 ${lead.carbon.scope1T > 0 ? 'yes' : 'no'})`);
    }
    // Clipping: a value outside the base range scores at the edge.
    const sc = scoreAgainstRun({ cost: -1, carbon: 1e9, ttp: 5, deliverability: 50 }, { cost: { lo: 0, hi: 10 }, carbon: { lo: 0, hi: 10 }, ttp: { lo: 0, hi: 10 }, deliverability: { lo: 0, hi: 100 } }, { cost: 0.25, carbon: 0.25, ttp: 0.25, deliverability: 0.25 });
    assert.deepEqual(sc.axes, { cost: 100, carbon: 0, ttp: 50, deliverability: 50 });
    assert.equal(axisScore('cost', 1, 1, 3), 100);
    assert.equal(axisScore('deliverability', 3, 1, 3), 100);
    return out.join('; ') + '; out-of-range axis values clip to 0–100.';
  });

  await test('13b. Every tornado driver range is a §18 record with the "indicative — unverified" label and drives the tornado (range record and sensitivity.topDrivers changed → rows follow); the gas and carbon price inputs are read by the engine', async () => {
    const out = [];
    const reg = getRegistry();
    for (const d of TORNADO_DRIVERS) {
      const r = reg[d.record];
      assert.ok(r, `${d.id}: no record ${d.record}`);
      assert.equal(r.label, LABEL, `${d.record}: label`);
      assert.ok(['source', 'judgement', 'run setting'].includes(r.basis) && r.confidence === 'C' && r.verified === false, `${d.record}: basis/confidence`);
    }
    for (const k of ['sensitivity.gasPriceFactor', 'sensitivity.carbonPriceFactor', 'sensitivity.itLoadFactor', 'sensitivity.topDrivers']) assert.ok(reg[k] && reg[k].label === LABEL, `${k} missing or unlabelled`);
    out.push(`${TORNADO_DRIVERS.length} drivers read ${TORNADO_DRIVERS.map((d) => d.record).join(', ')}`);
    const lead = runT1.options.reduce((a, b) => (a.rank < b.rank ? a : b));
    const itD = TORNADO_DRIVERS.filter((d) => d.id === 'it-load');
    await withRecordField('sensitivity.itLoadFactor', 'low', 0.5, () => {
      const t = tornado(runT1, lead.id, { site: runT1.ctx.site, drivers: itD });
      assert.equal(t.rows[0].low.x, 0.5, 'IT load low value does not follow its record');
    });
    const wd = TORNADO_DRIVERS.filter((d) => d.id === 'wacc');
    await withRecordField('economics.wacc', 'high', 0.15, () => {
      const t = tornado(runT1, lead.id, { site: runT1.ctx.site, drivers: wd });
      assert.equal(t.rows[0].high.x, 0.15, 'WACC high value does not follow its record');
    });
    await withRecordField('sensitivity.topDrivers', 'value', 1, () => {
      const t = tornado(runT1, lead.id, { site: runT1.ctx.site, drivers: [...itD, ...wd] });
      assert.equal(t.rows.length, 1, 'rows shown do not follow sensitivity.topDrivers');
      assert.equal(t.allRows.length, 2);
    });
    out.push('sensitivity.itLoadFactor low 0.5 → row low 0.5; economics.wacc high 0.15 → row high 15 %; sensitivity.topDrivers 1 → 1 row of 2');
    // Gas and carbon price inputs (§5.4, §5.6): "by country" = the country value; a number replaces it.
    const inp = normalizeInputs(runT1.inputs);
    const c0 = buildContext(inp, { site: runT1.ctx.site });
    const cd = COUNTRIES[c0.country];
    assert.equal(c0.carbonPrice, cd.carbonPrice);
    assert.equal(c0.gasPrice, cd.gas + FUEL.gasTransportAdder);
    const inp2 = normalizeInputs(inp);
    inp2.economics.carbonPrice = 123;
    inp2.utilities.gasPrice = 51;
    const c2 = buildContext(inp2, { site: runT1.ctx.site });
    assert.equal(c2.carbonPrice, 123);
    assert.equal(c2.gasPrice, 51 + FUEL.gasTransportAdder);
    // An option with gas plant: the entered prices change its cost; the leader (no combustion in dispatch) only via Scope 1 test runs.
    const gasOpt = runT1.options.find((o) => o.sizing.plants.some((p) => p.fuel === 'gas'));
    const e1 = evaluateOption(c0, gasOpt.v);
    const e2 = evaluateOption(c2, gasOpt.v);
    assert.equal(e1.eco.lcoe, gasOpt.eco.lcoe, 'country-default context differs from the run');
    assert.ok(e2.eco.lcoe !== e1.eco.lcoe, 'entered gas and carbon prices do not change a gas option\'s LCOE');
    out.push(`carbon price ${cd.carbonPrice} → 123 €/t and gas ${cd.gas} → 51 €/MWh_th entered: ctx follows; ${gasOpt.id} LCOE ${e1.eco.lcoe.toFixed(2)} → ${e2.eco.lcoe.toFixed(2)} €/MWh`);
    return out.join('; ') + '.';
  });

  await test('13d. Work package 9 drivers and measures: the new drivers each move the result they act on (capex, capacity factors, PUE, battery and grid connection capex, period, escalation, test hours; the flexibility trigger acts only with flexibility on); seven ticked by default; the measure re-sorts the rows without a re-run', () => {
    const out = [];
    assert.deepEqual(DEFAULT_DRIVER_IDS.slice().sort(), ['capacity-factors', 'capex', 'carbon-price', 'gas-price', 'grid-date', 'grid-price', 'wacc']);
    for (const id of DEFAULT_DRIVER_IDS) assert.ok(TORNADO_DRIVERS.some((d) => d.id === id), `default driver ${id} missing`);
    assert.deepEqual(TORNADO_MEASURES.map((m) => m.id), ['lcoe', 'npv', 'carbon', 'score']);
    assert.equal(TORNADO_DRIVERS.length, 16);
    const by = (id) => TORNADO_DRIVERS.filter((d) => d.id === id);
    const run = runT1;
    const pick = (f, what) => { const o = run.options.slice().sort((a, b) => a.rank - b.rank).find(f); assert.ok(o, `no T1 option ${what}`); return o; };
    const moved = (o, id, get, what) => {
      const t = tornado(run, o.id, { site: run.ctx.site, drivers: by(id) });
      const r = t.rows[0];
      const lo = get(r.low), hi = get(r.high);
      assert.ok(Number.isFinite(lo) && Number.isFinite(hi) && Math.abs(hi - lo) > 1e-9 * Math.max(1, Math.abs(lo)), `${id} did not move ${what} for ${o.id}: ${lo} → ${hi}`);
      out.push(`${id} ${what} ${lo.toPrecision(5)} → ${hi.toPrecision(5)}`);
      return r;
    };
    const lead = pick(() => true, 'at all');
    const capexR = moved(lead, 'capex', (s) => s.lcoe, 'LCOE');
    assert.ok(capexR.high.lcoe > capexR.low.lcoe, 'higher capex should raise LCOE');
    moved(lead, 'pue', (s) => s.lcoe, 'LCOE');
    // Grid connection capex scales the connection charge and the cable route (work package 3): with the default charge
    // of 0 and no cable route it moves nothing (test 31 checks it with a charge entered).
    if (lead.eco.capexLines.some((l) => /^Grid (connection charge|cable route)/.test(l.item) && l.amount > 0)) moved(lead, 'grid-capex', (s) => s.lcoe, 'LCOE');
    else { const g = tornado(run, lead.id, { site: run.ctx.site, drivers: by('grid-capex') }).rows[0]; assert.equal(g.low.lcoe, g.high.lcoe, 'grid capex moved LCOE with nothing to scale'); out.push('grid-capex: no charge or cable route, no swing'); }
    moved(lead, 'period', (s) => s.npvCost, 'NPV');
    moved(lead, 'escalation', (s) => s.lcoe, 'LCOE');
    moved(pick((o) => o.sizing.solarMWp > 0 || o.sizing.windMW > 0, 'with on-site solar or wind'), 'capacity-factors', (s) => s.lcoe, 'LCOE');
    moved(pick((o) => o.sizing.bess && o.sizing.bess.mwh > 0, 'with a battery'), 'bess-capex', (s) => s.lcoe, 'LCOE');
    moved(pick((o) => o.sizing.backup && o.sizing.backup.tech, 'with backup generation'), 'test-hours', (s) => s.lcoe, 'LCOE');
    // Measures: the result carries the measure; sortRows re-sorts the same rows.
    const t = tornado(run, lead.id, { site: run.ctx.site, drivers: TORNADO_DRIVERS.filter((d) => DEFAULT_DRIVER_IDS.includes(d.id)) });
    assert.equal(t.allRows.length, 7);
    for (const m of TORNADO_MEASURES) {
      const rs = sortRows(t.allRows, m.id);
      assert.equal(rs.length, 7);
      for (let i = 1; i < rs.length; i++) assert.ok(rs[i - 1].measureSwing >= rs[i].measureSwing, `${m.id}: not sorted`);
    }
    const ts = tornado(run, lead.id, { site: run.ctx.site, drivers: by('wacc'), measure: 'npv' });
    assert.equal(ts.measure, 'npv');
    const reg = getRegistry();
    for (const k of ['economics.capexFactor', 'economics.bessCapexFactor', 'economics.gridCapexFactor', 'utilities.reYieldFactor', 'load.coolingFactor', 'sensitivity.flexTriggerFactor', 'sensitivity.defaultMeasure']) assert.ok(reg[k] && reg[k].label === LABEL, `${k} missing or unlabelled`);
    return `${out.join('; ')}; LCOE order of the default seven: ${t.allRows.map((r) => r.id).join(', ')}.`;
  });

  await test('13c. Sensitivity tab (server render): the tornado is a keyboard-operable application with a description, one bar per driver, and the table lists every driver with its range record and "unverified" label and the base check', async () => {
    const B = await getViewBundle();
    const html = B.renderSensitivity(resultT1);
    const tag = (html.match(/<div[^>]*id="tornado-chart"[^>]*>/) || [''])[0];
    assert.ok(/role="application"/.test(tag) && /tabindex="0"/.test(tag) && /aria-label="Tornado for #1 [^"]*arrow keys/.test(tag) && /aria-describedby=/.test(tag), 'tornado is not a focusable application with keyboard help');
    const bars = (html.match(/<g data-driver="/g) || []).length;
    assert.equal(bars, resultT1.rows.length, 'one bar group per driver');
    const tbl = html.match(/<table class="mini sens-table[\s\S]*?<\/table>/)[0];
    assert.equal((tbl.match(/<tr data-driver="/g) || []).length, resultT1.rows.length, 'one table row per driver');
    for (const r of resultT1.rows) assert.ok(tbl.includes(r.record), `record ${r.record} not shown`);
    assert.ok((tbl.match(/tag-unverified/g) || []).length >= resultT1.rows.length, 'driver records without the unverified tag');
    assert.ok(/data-check="match"/.test(html), 'base check does not say it matches');
    return `${bars} driver bars and ${resultT1.rows.length} table rows, each with its record and the "unverified" tag; chart keyboard help and description present; base check "matches the ranking".`;
  });
}

// Value of the JS string literal starting at src[i] (as test 7 reads the inlined worker source).
function stringLiteralAt(src, i) {
  const q = src[i];
  assert.ok(q === '"' || q === "'" || q === '`', `expected a string literal at ${i}`);
  let j = i + 1;
  while (j < src.length && src[j] !== q) j += src[j] === '\\' ? 2 : 1;
  assert.ok(j < src.length, 'unterminated string literal');
  return new Function(`return ${src.slice(i, j + 1)};`)();
}

export async function hostedPageTests(test) {
  await test('14. Loading message and startup-error handler (index.html, single file) and the hosted page (dist/energy-tool-hosted.html): page content only (no <html>/<head>/<body>, no doctype), no outside reference, worker inlined, run log copied with a select-the-text fallback and the download code dropped', () => {
    const url = (f) => new URL(`../${f}`, import.meta.url);
    for (const f of ['dist/energy-tool-single-file.html', 'dist/energy-tool-hosted.html', 'dist/worker.js']) assert.ok(existsSync(url(f)), `${f} missing: run npm run build first`);
    const index = readFileSync(url('index.html'), 'utf8');
    const single = readFileSync(url('dist/energy-tool-single-file.html'), 'utf8');
    const hosted = readFileSync(url('dist/energy-tool-hosted.html'), 'utf8');
    const workerJs = readFileSync(url('dist/worker.js'), 'utf8');
    // index.html: the loading message sits inside #root (React replaces it on mount), with the instruction for viewers
    // that do not run scripts; a <noscript> says the same; the handler shows startup errors and stays quiet once running.
    const root = index.match(/<div id="root">([\s\S]*?)<\/div>\s*<\/div>/);
    assert.ok(root && /class="boot"/.test(root[1]) && /Loading the energy optioneering tool/.test(root[1]) && /open the file in a web browser/.test(root[1]), 'loading message not inside #root');
    assert.ok(/<noscript>[\s\S]*needs JavaScript[\s\S]*<\/noscript>/.test(index), 'noscript message missing');
    const handler = index.match(/<script>([\s\S]*?)<\/script>/)[1];
    assert.ok(/addEventListener\('error'/.test(handler) && /addEventListener\('unhandledrejection'/.test(handler), 'startup handler does not listen for errors');
    assert.ok(/root\.childElementCount && !root\.querySelector\('\.boot'\)/.test(handler), 'startup handler does not stay quiet once the app runs');
    new Function(handler); // parses
    // Hosted page: no document wrapper, starts with its <title>, then <style>, then the body content.
    for (const re of [/<!doctype/i, /<html[\s>]/i, /<head[\s>]/i, /<body[\s>]/i, /<\/html>/i, /<\/head>/i, /<\/body>/i, /<meta /i]) {
      assert.equal(re.test(hosted.replace(/<script>[\s\S]*?<\/script>/g, '')), false, `hosted page carries ${re}`);
    }
    assert.ok(/^<title>Concept Energy Optioneering<\/title>\n<style>/.test(hosted), 'hosted page does not start with <title> then <style>');
    for (const [label, html] of [['single file', single], ['hosted page', hosted]]) {
      assert.equal(/<script[^>]*\ssrc\s*=/i.test(html), false, `${label}: <script src> present`);
      assert.equal(/<link[^>]*\shref\s*=/i.test(html), false, `${label}: <link href> present`);
      assert.equal(/worker\.js/.test(html), false, `${label}: mentions worker.js`);
      const refs = [...html.matchAll(/\s(?:src|href)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]).filter((u) => !/^(data:|blob:|#|mailto:|javascript:)/i.test(u));
      assert.deepEqual(refs, [], `${label}: outside or relative references ${refs.join(', ')}`);
      assert.equal(/@import|url\(\s*["']?(?!data:)(?:https?:)?\/\//i.test(html.match(/<style>[\s\S]*?<\/style>/)[0]), false, `${label}: the stylesheet loads something`);
      assert.ok(html.includes('Loading the energy optioneering tool'), `${label}: loading message missing`);
      // Opus review: ASCII only, so the page does not depend on the charset of the document a host wraps it in.
      const nonAscii = html.match(/[^\x00-\x7F]/);
      assert.equal(nonAscii, null, `${label}: non-ASCII character ${nonAscii && JSON.stringify(nonAscii[0])} at ${nonAscii && nonAscii.index}`);
      const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      assert.equal(scripts.length, 2, `${label}: expected two inline scripts (startup handler + app), found ${scripts.length}`);
      const app = scripts.reduce((a, b) => (b.length > a.length ? b : a));
      const blob = [...app.matchAll(/URL\.createObjectURL\(new Blob\(\[(?=["'`])/g)];
      assert.equal(blob.length, 1, `${label}: inlined worker source not found`);
      assert.equal(stringLiteralAt(app, blob[0].index + blob[0][0].length), workerJs, `${label}: inlined worker differs from dist/worker.js`);
      for (const sc of scripts) new Function(sc); // both parse
    }
    // Copy instead of download, decided at build time: the hosted page has the copy control and fallback and no
    // download code; the single file has the download and no copy control.
    assert.ok(hosted.includes('Copy run log') && !hosted.includes('Download run log'), 'hosted page label');
    assert.ok(hosted.includes('did not allow copying') && hosted.includes('rp-copy-text'), 'hosted page has no select-the-text fallback');
    assert.ok(!/\.download=/.test(hosted) && !/revokeObjectURL/.test(hosted), 'hosted page still carries the download code');
    assert.ok(single.includes('Download run log') && !single.includes('Copy run log') && /\.download=/.test(single), 'single file label or download code');
    return `index.html: loading message in #root, noscript, startup handler (error + unhandledrejection, quiet once the app runs); single file ${(single.length / 1024).toFixed(1)} KB and hosted page ${(hosted.length / 1024).toFixed(1)} KB: 2 inline scripts each, worker inlined and equal to dist/worker.js, no <script src>, <link href> or other reference, ASCII only; hosted page starts with <title> then <style>, no doctype/<html>/<head>/<body>/<meta>, "Copy run log" with the select-the-text fallback and no download code; single file keeps "Download run log".`;
  });
}
