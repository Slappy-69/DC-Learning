// Opus review H4-H6, script r3: existing plant (work package 12) and the PPA back-off (known issue 19) on T1 with an
// example plant: 2 x 40 MW CCGT from 2028-01, connection EUR 8 m, lease left at its default (not entered).
// (a) which flags an option using the plant carries, and whether any names the lease rate left at its default;
// (b) the lease in the ledger against an independent count of months x MW x rate;
// (c) the lease start against max(available, first need - lead), need found independently;
// (d) LCOE and NPV rebuilt from the ledger rows;
// (e) hourly: plant output within its MW, energy balance, no PPA energy taken while plant output is curtailed at its
//     minimum, and PPA cost in the ledger only on delivered energy.
const APP = new URL('../../../app/src/engine/', import.meta.url).href;
const { referenceT1, normalizeInputs, TECH, PPA } = await import(`${APP}defaults.js`);
const { runModel } = await import(`${APP}run.js`);
const { buildContext, contractedCap } = await import(`${APP}context.js`);
const { evaluateOption } = await import(`${APP}option.js`);
const inp = referenceT1();
inp.existing = { ...inp.existing, include: true, name: 'Nearby CCGT', type: 'ccgt', units: 2, unitMW: 40, availableDate: '2028-01', linkCapex: 8e6 };
delete inp.existing.leasePerKWMonth; // not entered: the default applies
const t0 = Date.now();
const run = runModel(inp);
console.log(`T1 + existing plant: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${run.options.length} options; lease rate used ${TECH.existing.p.rentalPerKWMonth} EUR/kW/month`);
const ex = run.options.filter((o) => o.v.C2 === 'existing' || o.v.C4 === 'existing');
console.log(`options with the plant: ${ex.length} (bridging ${ex.filter((o) => o.v.C2 === 'existing').length}, firm ${ex.filter((o) => o.v.C4 === 'existing').length})`);
// (a) flags
const ids = new Map();
for (const o of ex) for (const f of o.flags) ids.set(f.id, (ids.get(f.id) || 0) + 1);
console.log('(a) flag ids on options with the plant:', [...ids.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' '));
const leaseFlag = ex.filter((o) => o.flags.some((f) => /lease|existing/i.test(f.message) && f.assumed));
console.log(`(a) options with an assumed-default flag naming the lease or the existing plant: ${leaseFlag.length} of ${ex.length}`);
const anyLease = ex.filter((o) => o.flags.some((f) => /lease/i.test(f.message)));
console.log(`(a) options with any flag mentioning the lease: ${anyLease.length}; example: ${anyLease.length ? anyLease[0].flags.find((f) => /lease/i.test(f.message)).message.slice(0, 160) : '-'}`);
// (b)-(e) on a re-evaluated sample
const ctx = buildContext(normalizeInputs(inp), { site: run.ctx.site });
const rate = TECH.existing.p.rentalPerKWMonth;
const lead = ctx.inputs.settings.rentalLeadMonths ?? 1;
const N = ctx.inputs.economics.periodYears;
let nB = 0, badRent = 0, badHire = 0, badLedger = 0, badHourly = 0, badPpaCost = 0, checked = 0, maxBal = 0, maxOver = 0, mslViol = 0, ppaCostDiffMax = 0;
const sample = ex.filter((o, i) => i % Math.max(1, Math.floor(ex.length / 60)) === 0).slice(0, 60);
for (const o of sample) {
  if (o.v.C2 === 'rented') continue; // rented bridging also pays rental; keep the comparison clean
  const e = evaluateOption(ctx, o.v, { recordYears: Array.from({ length: 16 }, (_, y) => y) });
  checked++;
  const sz = e.sz, T = sz.T;
  const isB = o.v.C2 === 'existing';
  const p = isB ? sz.bridge : sz.prime;
  // (b) rental by an independent count
  let mwMonths = 0;
  for (let m = 0; m < N * 12; m++) {
    if (m < p.availMonth) continue;
    if (isB && !(o.v.C1 === 'islanded' || m < T || o.v.C3 !== 'remove')) continue;
    mwMonths += p.mw;
  }
  const expRent = mwMonths * 1000 * rate;
  const ledRent = e.eco.ledger.reduce((a, r) => a + r.rental, 0);
  if (Math.abs(expRent - ledRent) > 1) { badRent++; if (badRent <= 3) console.log(`  (b) rent differs ${o.id}: ledger ${ledRent.toFixed(0)} expected ${expRent.toFixed(0)}`); }
  // (c) hire month, need found independently
  const cc = contractedCap(ctx, o.v.C1);
  let need = null;
  if (isB) {
    for (let m = 0; m < ctx.nMonthsTimeline; m++) { const g = o.v.C1 === 'islanded' ? 0 : cc[m]; if (sz.designByMonth[m] > g + 1e-9) { need = m; break; } }
  } else {
    for (let m = 0; m < ctx.nMonthsTimeline; m++) {
      const g = o.v.C1 === 'islanded' ? 0 : cc[m];
      const b = sz.bridge && m >= sz.bridge.availMonth && (o.v.C1 === 'islanded' || m < T || o.v.C3 !== 'remove') ? sz.bridge.mw : 0;
      if (sz.designByMonth[m] > g + b + 1e-9) { need = m; break; }
    }
    if (p.sizing === 'average') { let lm = 0; while (lm < sz.designByMonth.length && !(sz.designByMonth[lm] > 1e-9)) lm++; need = need == null ? lm : Math.min(need, lm); }
  }
  const earliest = p.earliestMonth ?? p.availMonth;
  const expHire = need == null ? earliest : Math.max(earliest, need - lead);
  if (expHire !== p.availMonth) { badHire++; if (badHire <= 3) console.log(`  (c) hire differs ${o.id} ${isB ? 'bridge' : 'firm ' + p.sizing}: availMonth ${p.availMonth}, expected ${expHire} (need ${need}, earliest ${earliest})`); }
  // (d) LCOE and NPV from the ledger
  const r = ctx.inputs.economics.wacc;
  let pv = 0, pe = 0;
  e.eco.ledger.forEach((L, y) => { pv += (L.capex + L.contingency + L.replacement + L.residual) * (1 + r) ** -y + (L.fom + L.vom + L.fuel + L.grid + L.ppa + L.carbon + L.rental + L.testRun + L.flex - L.revenue) * (1 + r) ** -(y + 1); pe += L.deliveredMWh * (1 + r) ** -(y + 1); });
  if (Math.abs(pv - e.eco.npvCost) > 1e-6 * Math.abs(pv) || Math.abs(pv / pe - e.eco.lcoe) > 1e-9 * e.eco.lcoe) badLedger++;
  // (e) hourly
  const pi = e.cfg.plants.findIndex((q) => q.tech === 'existing');
  const ppaPrice = sz.ppa ? PPA.strike[sz.ppa.type] + PPA.shapingAdder : 0;
  for (const [y, d] of e.disp.years.entries()) {
    const h = d.hourly; if (!h) continue;
    for (let k = 0; k < h.demand.length; k++) {
      const bal = h.re[k] + h.ppa[k] + h.dis[k] + h.firm[k] + h.grid[k] + h.gridCharge[k] + h.unmet[k] - (h.net[k] + h.ch[k] + h.curt[k] + h.exp[k]);
      if (Math.abs(bal) > maxBal) maxBal = Math.abs(bal);
      if (pi >= 0) { const over = h.plant[pi][k] - e.cfg.plants[pi].mw; if (over > maxOver) maxOver = over; }
      if (h.curt[k] > 1e-6 && h.ppa[k] > 1e-6 && h.firm[k] > 1e-6 && h.firm[k] > h.net[k] - h.re[k] - h.dis[k] - h.ppa[k] - h.grid[k] + 1e-6) mslViol++;
    }
    if (y < N && sz.ppa) { const diff = Math.abs(e.eco.ledger[y].ppa - d.ppaDeliveredMWh * ppaPrice); if (diff > ppaCostDiffMax) ppaCostDiffMax = diff; }
  }
  if (isB) nB++;
}
console.log(`(b-e) re-evaluated ${checked} options with the plant (${nB} as bridging): rent mismatches ${badRent}; hire-month mismatches ${badHire}; ledger LCOE/NPV mismatches ${badLedger}`);
console.log(`(e) max hourly balance error ${maxBal.toExponential(2)} MWh; max plant output above its MW ${maxOver.toFixed(6)} MW; hours with PPA delivered while plant output above need is curtailed ${mslViol}; max |ledger PPA - delivered x price| ${ppaCostDiffMax.toFixed(6)} EUR`);
const ch = ex.slice().sort((a, b) => a.eco.lcoe - b.eco.lcoe)[0];
console.log(`cheapest with the plant: #${ch.rank} ${ch.id} EUR ${ch.eco.lcoe.toFixed(1)}/MWh, ${ch.carbon.locationG.toFixed(1)} g/kWh; ${ch.name}`);
