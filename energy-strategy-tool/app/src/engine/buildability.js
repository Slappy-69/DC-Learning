// Buildability tests and tiers (realism rebuild of 2026-11-11, OPEN-QUESTIONS 250; owner: the top options "should be
// something that is likely to be built and represents a valid option for the dc developers").
//
// Before the rebuild the fourth axis, deliverability, took points off for every permitting flag. Two flags sat on
// every option of a large campus (the 50 MW thermal line and the fuel store), so the score told options apart by
// little, and an option that leased a neighbour's power station scored 100 because none of its plant was on site.
//
// The rebuild puts each option through named tests. Every finding is one of three kinds:
//   unlikely  — a rule in force that the option breaks, or something a regulator, a plant owner or the site itself is
//               unlikely to allow. One of these makes the option tier C.
//   condition — someone else's decision the option depends on, named so the developer can go and get it (an agreement
//               with a plant owner, an environmental assessment, a gas supply). One or more makes the option tier B.
//   standard  — a consent any campus of this size needs. Listed, with no effect on the tier or the score.
// Tier A: no conditions. Tier B: buildable with the conditions listed. Tier C: unlikely to be built as it stands.
// (There is no tier D input: an option that powers no building at all ranks last on its own.)
//
// Flag, never enforce (BRIEF §2, principle 5): nothing is hidden or resized. Tier C options rank below the others
// and say why. Screening only: not a planning, permitting or legal determination.
// Pure: no UI, no browser APIs.

import { TECH } from './defaults.js';
import { dcRule, ruleSource, isEUMember } from './dcrules.js';

export const TIER_TEXT = { A: 'Buildable: no conditions', B: 'Buildable with conditions', C: 'Unlikely to be built as it stands' };
// Judgement thresholds of the tests that have no input of their own (recorded in BUILD-NOTES).
export const NL_NITROGEN_KM = 25;     // the Netherlands: running plant within this distance of a Natura 2000 site
export const HABITATS_KM = 5;         // other EU states: an appropriate assessment is likely within this distance
export const GAS_CAPACITY_ASK_MWTH = 100; // above this, a gas supply with no capacity entered is a condition
export const LAND_TIGHT = 0.10;       // land take within 10 % over the net site: a condition; beyond: unlikely
export const PT_GAS_SHARE = 0.5;      // Portugal's planned decree: a supply that is mostly gas

const onSite = (p) => p && !TECH[p.tech].offsite && !TECH[p.tech].existingPlant;
const r0 = (x) => Math.round(x).toLocaleString('en-GB');

// Most hours a plant runs in one dispatched year, in its running roles.
function maxHours(disp, p, roles) {
  let h = 0;
  for (const y of disp.years) for (const q of y.plants || []) if (q.tech === p.tech && roles.includes(q.role)) h = Math.max(h, q.hours || 0);
  return h;
}

// ctx: the option's own context (context.js ctxFor with the sizing). flags: the option's flags (the Ireland test).
export function buildabilityTests(ctx, v, sz, disp, flags) {
  const inputs = ctx.inputs, req = inputs.requirements, cc = ctx.country;
  const unlikely = [], conditions = [], standard = [];
  const U = (id, text, extra = {}) => unlikely.push({ id, text, ...extra });
  const C = (id, text, extra = {}) => conditions.push({ id, text, ...extra });
  const S = (id, text, extra = {}) => standard.push({ id, text, ...extra });
  const prime = sz.prime, bridge = sz.bridge;
  const hPrime = prime ? maxHours(disp, prime, ['prime']) : 0;
  const hBridge = bridge ? maxHours(disp, bridge, ['bridge', 'bridgeKept']) : 0;
  const hoursOf = (p) => (p === prime ? hPrime : hBridge);
  const ss = disp.years[disp.years.length - 1];

  // 1. Someone else's plant: an agreement with its owner, unless ticked as agreed (plants.agreed).
  const agreed = (inputs.plants && inputs.plants.agreed) || {};
  const third = new Map();
  const note = (id, name, use, wire) => { const x = third.get(id) || { name, uses: [], wire: false }; x.uses.push(use); x.wire = x.wire || !!wire; third.set(id, x); };
  for (const p of [prime, bridge]) {
    if (!p || !TECH[p.tech].existingPlant) continue;
    const t = TECH[p.tech];
    note(t.plantKey || 'manual', t.name.replace(/ \((lease|bought|bought whole|bought, units used|supply contract)\)$/, ''), t.contract ? 'a supply contract' : t.bought ? 'its purchase' : 'a lease', t.contract ? t.p.contractRoute === 'wire' : true);
  }
  if (ctx.takeover) note(ctx.takeover.plant.id, ctx.takeover.plant.name, 'the takeover of its grid connection', false);
  if (sz.renewPlant) note(`r:${sz.renewPlant.id}`, sz.renewPlant.name, sz.renewPlant.mode === 'contract' ? 'a supply contract' : 'its purchase', sz.renewPlant.route !== 'grid');
  for (const [id, x] of third) {
    if (agreed[id] === true) continue;
    C('third-party', `Agreement with the owner of ${x.name} (${x.uses.join(' and ')}): not agreed yet${x.wire ? '; the private wire also needs a direct-line authorisation' : ''}`, { plant: id });
  }

  // 2. Consent for plant that runs on the campus.
  for (const p of [prime, bridge]) {
    if (!onSite(p)) continue;
    const t = TECH[p.tech];
    const h = hoursOf(p);
    const ol = (sz.permitOutlook || []).find((x) => x.role === p.role && x.tech === p.tech);
    const eia = p.consent && p.consent.steps.find((s) => s.id === 'EIA');
    const dco = p.consent && p.consent.steps.find((s) => s.id === 'DCO');
    if (ol && ol.outlook === 'unlikely') U('permit-unlikely', `${t.name}: a permit to run this plant is unlikely (${ol.reason})`, { tech: p.tech });
    else if (t.combustion && eia) {
      // One assessment for the campus's running plant, whatever the number of plants.
      const prev = conditions.find((x) => x.id === 'eia');
      if (prev) prev.text = prev.text.replace(/^([^:]+):/, `$1 and ${t.name}:`);
      else C('eia', `${t.name}: ${eia.text}, then the environmental permit${cc === 'GB' ? ' with a decarbonisation readiness report' : ''}`, { tech: p.tech, source: ruleSource(cc === 'GB' ? dcRule('gb-dr') : null) });
    }
    else if (t.combustion && ((p.permitRegimes && p.permitRegimes.length) || h > req.limitedRunHours)) C('permit-running', `${t.name}: environmental permit for plant that runs (up to ${r0(h)} h a year here; above ${req.limitedRunHours} h the emission limits apply, and the cost of abatement is not in the figures)${cc === 'GB' ? ', with a decarbonisation readiness report' : ''}`, { tech: p.tech });
    if (dco && !(prime && bridge && p === bridge && onSite(prime) && prime.consent && prime.consent.steps.some((s) => s.id === 'DCO'))) C('dco', `England: ${dco.text}`, { source: ruleSource(dcRule('gb-dco')) });
  }

  // 3. Rented generation is temporary plant.
  if (bridge && bridge.tech === 'rented') {
    const end = v.C1 === 'islanded' || v.C3 !== 'remove' ? inputs.economics.periodYears * 12 : sz.T;
    const months = Math.max(0, end - bridge.availMonth);
    if (months > req.rentalUnlikelyM) U('rental-long', `Rented generation stays on site for ${months} months (${(months / 12).toFixed(1)} years): rented sets are temporary plant; longer than ${req.rentalUnlikelyM} months is treated as unlikely`);
    else if (months > req.rentalConditionM) C('rental-long', `Rented generation stays on site for ${months} months: a permit and a contract for long-running temporary plant (longer than ${req.rentalConditionM} months)`);
  }

  // 4. Number of running units.
  // Engines and turbines the campus owns (rented sets and fuel-cell modules are built to be many).
  const counted = [prime, bridge].filter((p) => onSite(p) && TECH[p.tech].combustion && p.tech !== 'rented');
  const units = counted.reduce((a, p) => a + (p.units || 0), 0);
  if (units > req.unitCountCondition) C('unit-count', `${units} engines or turbines on site (${counted.map((p) => `${p.units} × ${p.unitMW} MW ${TECH[p.tech].name}`).join(', ')}): a plant of more than ${req.unitCountCondition} units is rare`);

  // 5. Gas supply as a capacity.
  let gasMWth = 0;
  for (const p of [prime, bridge]) if (onSite(p) && TECH[p.tech].fuel === 'gas' && p.fuelMonth !== Infinity) gasMWth += p.mw / (TECH[p.tech].p.eff || 1);
  if (sz.backup.tech && TECH[sz.backup.tech].fuel === 'gas') gasMWth += sz.backup.mw / (TECH[sz.backup.tech].p.eff || 1);
  if (gasMWth > 0) {
    const capGas = inputs.utilities.gasCapacityMWth;
    const avail = inputs.utilities.gasAvailable;
    if (capGas != null && gasMWth > capGas + 1e-9) U('gas-supply', `Gas supply: the plant needs ${r0(gasMWth)} MW of gas (thermal); the network can supply ${r0(capGas)} MW (entered)`);
    else if (avail === 'Unknown') C('gas-supply', `Gas supply of ${r0(gasMWth)} MW (thermal) not confirmed: gas availability is "Unknown"`, { points: inputs.deliverability.gasUnknownPenalty });
    else if (capGas == null && gasMWth >= GAS_CAPACITY_ASK_MWTH) C('gas-supply', `Gas supply of ${r0(gasMWth)} MW (thermal) not confirmed: no network capacity entered (a supply of this size needs a high-pressure connection with its own lead time)`);
  }

  // 6. Land: the area budget of the sizing against the net site.
  if (sz.area && sz.area.netM2 > 0 && sz.area.landTakeM2 > sz.area.netM2) {
    const over = sz.area.landTakeM2 / sz.area.netM2 - 1;
    const txt = `Land: buildings and plant need ${(sz.area.landTakeM2 / 1e4).toFixed(1)} ha; the net site is ${(sz.area.netM2 / 1e4).toFixed(1)} ha (${Math.round(over * 100)} % over)`;
    if (over > LAND_TIGHT) U('land', `${txt}: it does not fit the site`); else C('land', `${txt}: tight, needs a layout to confirm`);
  }

  // 7. Firm plant with no spare unit (existing plant near the site).
  if (prime && TECH[prime.tech].existingPlant && prime.units >= 1) {
    const last = ctx.nMonthsTimeline - 1;
    const grid = v.C1 === 'islanded' ? 0 : ctx.gridCap[Math.min(last, ctx.gridCap.length - 1)];
    const kept = bridge && v.C3 === 'split' ? bridge.primeMW || 0 : bridge && (v.C3 === 'prime' || v.C1 === 'islanded') ? bridge.mw : 0;
    const short = sz.designMW - grid - kept - (prime.units - 1) * prime.unitMW;
    if (short > 1e-6) C('outage', `${TECH[prime.tech].name}: no spare unit. With one unit out (${r0(prime.unitMW)} MW) the campus is ${r0(short)} MW short at design load; a planned outage of weeks would fall on the standby gensets, beyond their test hours`);
  }

  // 8. Country rules where the power strategy changes the outcome (dcrules.js).
  const runsLong = [prime, bridge].some((p) => onSite(p) && TECH[p.tech].combustion && hoursOf(p) > req.limitedRunHours);
  const gasMWh = ss.plants.filter((q) => TECH[q.tech] && TECH[q.tech].fuel === 'gas').reduce((a, q) => a + (q.mwh || 0), 0);
  const served = Math.max(1, ss.servedMWh || ss.netDemandMWh || ss.demandMWh || 1);
  if (cc === 'IE') {
    const leu = flags.find((f) => f.id === 'ireland-leu');
    if (leu && leu.pass === false) U('ie-cru', `Ireland: ${dcRule('ie-cru').text} This option's dispatchable plant is ${r0(leu.value)} MW short`, { source: ruleSource(dcRule('ie-cru')) });
    if (v.C1 === 'islanded') U('ie-islanded', `Ireland: ${dcRule('ie-islanded').text}`, { source: ruleSource(dcRule('ie-islanded')) });
    const ppaPct = v.C13 && v.C13 !== 'none' ? Number(v.C14) || 0 : 0;
    if (v.C1 !== 'islanded' && ppaPct < 80) C('ie-renew', `Ireland: ${dcRule('ie-renew').text} This option contracts ${ppaPct} %`, { source: ruleSource(dcRule('ie-renew')) });
  }
  if (cc === 'NL' && runsLong) {
    const km = inputs.site.natureSiteKm;
    if (km == null) C('nl-nitrogen', `Netherlands: ${dcRule('nl-nitrogen').text} The distance to the nearest protected site is not entered`, { source: ruleSource(dcRule('nl-nitrogen')) });
    else if (km <= NL_NITROGEN_KM) U('nl-nitrogen', `Netherlands: plant that runs for long hours ${km} km from a Natura 2000 site (within ${NL_NITROGEN_KM} km, a judgement): the nature permit is hard to obtain`, { source: ruleSource(dcRule('nl-nitrogen')) });
  } else if (cc !== 'NL' && isEUMember(cc) && runsLong && inputs.site.natureSiteKm != null && inputs.site.natureSiteKm <= HABITATS_KM) {
    C('habitats', `Plant that runs for long hours ${inputs.site.natureSiteKm} km from a protected nature site: an appropriate assessment under the Habitats Directive is likely (judgement: within ${HABITATS_KM} km)`);
  }
  if (cc === 'DE' && gasMWh / served > 0.01) C('de-enefg', `Germany: ${dcRule('de-enefg').text} Here ${Math.round((gasMWh / served) * 100)} % of the energy comes from gas plant`, { source: ruleSource(dcRule('de-enefg')) });
  if (cc === 'ES' && v.C1 !== 'islanded' && inputs.grid.fullMW >= 10) {
    const cfe = (ss.cfeMWh || 0) / served;
    if (cfe < 0.8) C('es-decree', `Spain (draft rule): ${dcRule('es-decree').text} This option's carbon-free share, hour by hour, is ${Math.round(cfe * 100)} %`, { source: ruleSource(dcRule('es-decree')) });
  }
  if (cc === 'PT' && gasMWh / served > PT_GAS_SHARE) C('pt-decree', `Portugal (announced rule): ${dcRule('pt-decree').text} Here ${Math.round((gasMWh / served) * 100)} % of the energy comes from gas plant`, { source: ruleSource(dcRule('pt-decree')) });

  // Standard consents: listed, no effect on the tier or the score.
  if (sz.backup.tech && sz.backup.permitRegimes && sz.backup.permitRegimes.length) S('standby-permit', `Environmental permit for the standby gensets (${sz.backup.permitRegimes.join(', ')}): ${sz.backup.units} sets, tested for a few hours a year`);
  const sev = flags.find((f) => f.id === 'permit-seveso-fuel');
  if (sev) S('seveso', sev.message.replace(/\s*Screening only.*$/, ''));
  const runMWth = [prime, bridge].filter(onSite).reduce((a, p) => a + p.mw / (TECH[p.tech].p.eff || 1), 0);
  if (runMWth > 20) S('ets', `Carbon market permit: ${r0(runMWth)} MW (thermal) of running plant on site, above 20 MW (its carbon cost is in the figures)`);

  const tier = unlikely.length ? 'C' : conditions.length ? 'B' : 'A';
  return { tier, unlikely, conditions, standard };
}
