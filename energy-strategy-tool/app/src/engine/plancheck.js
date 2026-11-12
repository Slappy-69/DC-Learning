// The plan check and the country rules of a run (realism rebuild of 2026-11-11, OPEN-QUESTIONS 248, 250).
//
// The plan check is shown above the options. It answers, before any option is read: can the phasing plan be met at
// all? For each building it gives the earliest start any option reaches and what holds it; it says when the standby
// gensets can be ready, whether any option powers the whole campus, and how the options split against the latest
// acceptable start. It is worked out over the whole screened set, so in a pooled run it is recomputed after the merge.
// Pure: no UI, no browser APIs.

import { TECH, COUNTRIES, realismOn, plantTwin } from './defaults.js';
import { addMonths, monthsBetween } from './dates.js';
import { campusRules, ruleSource, DC_RULES_ACCESSED, DC_RULES_LABEL } from './dcrules.js';

export const TRANSFORMER_LEAD = { lowM: 20, highM: 32, text: 'High-voltage transformers: 20 to 32 months from second-tier European makers, 48 to 60 months from the largest (June 2026)', source: 'gridreadiness.com, transformer lead times in Europe', url: 'https://gridreadiness.com/insights/transformer-lead-times-europe', accessed: DC_RULES_ACCESSED, label: DC_RULES_LABEL };

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function planCheck(options, inputs) {
  if (!realismOn(inputs)) return null;
  const withEn = options.filter((o) => o.sizing && o.sizing.energise);
  if (!withEn.length) return null;
  const en0 = withEn[0].sizing.energise;
  const ym = (m) => addMonths(inputs.project.analysisStart, m);
  const req = inputs.requirements;
  const allow = req.lateAllowanceM ?? 24;
  const n = en0.buildings;
  const items = [];

  // Each building: the earliest start any option reaches.
  const buildings = [];
  for (let k = 0; k < n; k++) {
    let best = null, powering = 0;
    for (const o of withEn) {
      const s = o.sizing.energise.starts[k];
      if (s == null) continue;
      powering++;
      if (!best || s < best.sizing.energise.starts[k]) best = o;
    }
    const e = best ? best.sizing.energise : null;
    buildings.push({
      building: k + 1, itMW: en0.it[k], plannedM: en0.planned[k], planned: ym(en0.planned[k]),
      earliestM: e ? e.starts[k] : null, earliest: e ? ym(e.starts[k]) : null, late: e ? e.late[k] : null,
      reason: e && e.reasons[k] ? e.reasons[k].text : null, reasonKind: e && e.reasons[k] ? e.reasons[k].kind : null, options: powering,
    });
  }

  // Standby gensets.
  const gens = withEn.filter((o) => o.sizing.backup && o.sizing.backup.tech && o.sizing.backup.units > 0);
  if (gens.length) {
    const g = gens.reduce((a, b) => ((a.sizing.standbyReadyM || 0) <= (b.sizing.standbyReadyM || 0) ? a : b));
    const ready = g.sizing.standbyReadyM || 0;
    const t = TECH[g.sizing.backup.tech];
    const regimes = g.sizing.backup.permitRegimes || [];
    const how = `${regimes.length ? `${req.permitAllowanceM} months of permitting allowance (${regimes.join(', ')}), then ` : ''}${t.p.procM} months of procurement and ${t.p.buildM} of installation`;
    if (ready > en0.planned[0]) items.push({ id: 'standby', severity: 'major', text: `Standby gensets can be ready in ${ym(ready)} at the earliest (month ${ready}: ${how}). Building 1 is planned for ${ym(en0.planned[0])}, so every option with standby gensets starts it ${plural(ready - en0.planned[0], 'month')} late. To hold the date, order the gensets before their permit (at risk), or plan a later start.` });
    else items.push({ id: 'standby', severity: 'info', text: `Standby gensets can be ready in ${ym(ready)} (month ${ready}: ${how}), ${plural(en0.planned[0] - ready, 'month')} before building 1.` });
  }
  for (const b of buildings) {
    if (b.earliestM == null) items.push({ id: `building-${b.building}`, severity: 'major', text: `Building ${b.building} (${b.itMW} MW IT, planned ${b.planned}): no option powers it.` });
    else if (b.late > 0 && b.reasonKind !== 'standby' && b.reasonKind !== 'sequence') items.push({ id: `building-${b.building}`, severity: b.late > allow ? 'major' : 'minor', text: `Building ${b.building} (planned ${b.planned}): no option starts it before ${b.earliest}, ${plural(b.late, 'month')} late: ${b.reason}.` });
  }

  // The IT the options deliver, and how they stand against the latest acceptable start.
  let maxIT = 0, maxBuildings = 0;
  const counts = { options: withEn.length, onPlan: 0, lateWithin: 0, lateBeyond: 0, partial: 0 };
  for (const o of withEn) {
    const e = o.sizing.energise;
    if (e.poweredIT > maxIT) { maxIT = e.poweredIT; maxBuildings = e.powered; }
    if (e.powered < e.buildings) counts.partial++;
    else if (e.maxLate === 0) counts.onPlan++;
    else if (e.maxLate <= allow) counts.lateWithin++;
    else counts.lateBeyond++;
  }
  if (maxIT < en0.plannedIT - 1e-6) items.push({ id: 'it', severity: 'major', text: `No option powers the whole campus: the most is ${maxBuildings} of ${n} buildings (${Math.round(maxIT)} of ${Math.round(en0.plannedIT)} MW IT).` });
  items.push({ id: 'counts', severity: counts.onPlan ? 'info' : 'minor', text: `Of ${counts.options.toLocaleString('en-GB')} options: ${counts.onPlan.toLocaleString('en-GB')} power every building on its planned date; ${counts.lateWithin.toLocaleString('en-GB')} start a building late but within the latest acceptable start (${plural(allow, 'month')}); ${counts.lateBeyond.toLocaleString('en-GB')} start one later than that; ${counts.partial.toLocaleString('en-GB')} do not power every building.` });

  // The plant entered by hand is also in the bundled list.
  const tw = plantTwin(inputs);
  if (tw) items.push({ id: 'plant-twice', severity: 'minor', text: `The plant entered by hand (${tw.manual.name}, ${Math.round(tw.manual.mw).toLocaleString('en-GB')} MW) looks like ${tw.list.name} from the plant list (${Math.round(tw.list.mw).toLocaleString('en-GB')} MW, ${tw.list.km.toFixed(1)} km away): the options offer both, with their own prices, and the cards treat them as one plant. Remove one of them to halve the plant options.` });

  // The campus substation's transformers against the grid date.
  if (inputs.grid.fullMW > 0 && inputs.grid.fullDate) {
    const tm = monthsBetween(inputs.project.analysisStart, inputs.grid.fullDate);
    if (tm < TRANSFORMER_LEAD.lowM) items.push({ id: 'transformer', severity: 'minor', text: `The full grid connection is due in ${inputs.grid.fullDate} (month ${tm}). ${TRANSFORMER_LEAD.text}: check that the transformers of the campus substation are already on order.`, source: `${TRANSFORMER_LEAD.source}, ${TRANSFORMER_LEAD.url}, accessed ${TRANSFORMER_LEAD.accessed}, ${TRANSFORMER_LEAD.label}` });
  }
  return { allowanceM: allow, plannedIT: en0.plannedIT, maxIT, maxBuildings, buildings, items, counts };
}

// The country's rules for a data centre campus, shown once (dcrules.js), with what the tool can tell from the inputs.
export function countryRulesFor(inputs, country) {
  if (!realismOn(inputs)) return null;
  const rules = campusRules(country).map((r) => {
    const out = { id: r.id, country: r.country, scope: r.scope, status: r.status, date: r.date, text: r.text, source: ruleSource(r), applies: null };
    if (r.id === 'nl-hyperscale') {
      const ha = Number(inputs.site.areaHa) || 0, mw = Number(inputs.grid.fullMW) || 0;
      out.applies = ha > 10 && mw >= 70 ? `This campus (${ha.toFixed(0)} ha, ${Math.round(mw)} MW connection) is caught by the rule: it can only be built in the two named areas. The tool does not know the municipality: check it.` : `This campus (${ha.toFixed(0)} ha, ${Math.round(mw)} MW connection) is below the rule's size.`;
      out.caught = ha > 10 && mw >= 70;
    }
    if (r.id === 'de-pue') {
      const pue = Number(inputs.load.pueAnnual ?? inputs.load.pue);
      if (Number.isFinite(pue)) { out.applies = pue > 1.2 + 1e-9 ? `The annual PUE entered is ${pue}: above 1.2.` : `The annual PUE entered is ${pue}: within 1.2.`; out.caught = pue > 1.2 + 1e-9; }
    }
    return out;
  });
  return { country, countryName: (COUNTRIES[country] && COUNTRIES[country].name) || country, accessed: DC_RULES_ACCESSED, label: DC_RULES_LABEL, rules, note: 'Screening only: a reading of published texts and law-firm summaries, not legal advice. Each rule needs checking for a real project.' };
}
