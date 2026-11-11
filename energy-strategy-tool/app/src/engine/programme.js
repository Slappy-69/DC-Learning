// The consent step in an option's programme (realism rebuild of 2026-11-11, OPEN-QUESTIONS 249).
//
// Before the rebuild a plant waited one allowance (6 months) when the site came under the Industrial Emissions
// Directive or Seveso, whatever its size. The rebuild keeps that for standby gensets and adds, for plant that runs
// (firm plant and bridging plant on the campus, rented sets included):
//   - an environmental impact assessment when the running combustion plant on site is 300 MW of heat or more
//     (Directive 2011/92/EU, Annex I): requirements.eiaAllowanceM;
//   - in Great Britain (the rule is England's), a development consent order when the generating plant on site is
//     above 50 MW: requirements.dcoAllowanceM.
// The steps run side by side, so the plant waits for the longest. It is ordered when its consent is in hand, as
// before (OPEN-QUESTIONS 44, 45). Existing plant near the site keeps its own consent; wind, ground solar and small
// reactors keep their own planning months.
//
// Screening only: not a planning or permitting determination. Pure: no UI, no browser APIs.

import { TECH } from './defaults.js';

const onSiteRunning = (p) => p && p.mw > 0 && TECH[p.tech] && !TECH[p.tech].offsite && !TECH[p.tech].existingPlant;

// What the consent tests read: heat input of the running combustion plant and MW of the generating plant on site.
export function consentFacts({ prime, bridge }) {
  let runningMWth = 0, generatingMWe = 0, units = 0;
  for (const p of [prime, bridge]) {
    if (!onSiteRunning(p)) continue;
    const t = TECH[p.tech];
    if (t.ownConsent) continue;
    generatingMWe += p.mw;
    units += p.units || Math.round(p.mw / (p.unitMW || 1));
    if (t.combustion) runningMWth += p.mw / (t.p.eff || 1);
  }
  return { runningMWth, generatingMWe, units };
}

// The consent a running plant waits for. regimes: the IED / Seveso regimes that hold it (permitting.js).
export function consentFor(ctx, plant, regimes, facts) {
  const t = TECH[plant.tech];
  if (!t || t.existingPlant || t.offsite || t.ownConsent) return null;
  const req = ctx.inputs.requirements;
  const steps = [];
  if (regimes.length) steps.push({ id: regimes.join(' + '), months: req.permitAllowanceM, text: `${regimes.join(' and ')} permit` });
  if (t.combustion && facts.runningMWth >= req.eiaMWth) steps.push({ id: 'EIA', months: req.eiaAllowanceM, text: `environmental impact assessment (${Math.round(facts.runningMWth)} MW of heat in running plant; ${req.eiaMWth} or more needs one)` });
  if (ctx.country === 'GB' && facts.generatingMWe > req.dcoMWe) steps.push({ id: 'DCO', months: req.dcoAllowanceM, text: `development consent order (${Math.round(facts.generatingMWe)} MW of generating plant; above ${req.dcoMWe} MW in England)` });
  const months = steps.reduce((a, s) => Math.max(a, s.months), 0);
  return { months, steps };
}
