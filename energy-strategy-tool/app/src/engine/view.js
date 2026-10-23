// View state helpers (BRIEF §11 user view filters, §2 principle 5, §7.2 step 6, §12.2).
//
// Pure and UI-free. Two jobs:
//  1. Defaults read from the §18 registry at the point of use (registryValue), so the
//     "indicative — unverified" records and the behaviour cannot drift apart. DEFAULT_VIEW in
//     scoring.js keeps its own literal (scoring.js is not changed here); test 8f checks that it
//     equals the registry record.
//  2. Active view filters as removable chips (§11: "Active filters show as removable chips above the
//     results, are counted in the header strip"). One chip per removable unit; each chip knows how to
//     remove itself. activeFilterCount() counts filter kinds the same way applyView() does (test 8h).

import { DEFAULT_VIEW } from './scoring.js';
import { registryValue } from './defaults.js';

// Initial view state: no filter, "Hide dominated options" at its registered default (off).
export function defaultView() {
  return { ...DEFAULT_VIEW, hideDominated: registryValue('settings.hideDominated') === true };
}

// A registered view setting, e.g. viewSetting('pareto.canvasAbove') reads 'view.pareto.canvasAbove'.
export function viewSetting(key) {
  return registryValue(`view.${key}`);
}

// Rows per page in the ranked table and the trade-off table.
export function tablePageSize() {
  const n = Math.floor(Number(viewSetting('table.pageSize')));
  return n >= 1 ? n : 50;
}

// Flags offered in the view-filter selects (§11 "any flag"; the full flag list is in each option).
export const FLAG_FILTERS = [
  ['adequacy-short', 'Not adequate (power)'],
  ['grid-binding', 'Grid capacity binding'],
  ['res-backed', 'Backed load not met'],
  ['res-autonomy', 'Autonomy not met'],
  ['permit-ied', 'IED threshold'],
  ['fuel-gas-unknown', 'Gas connection unconfirmed'],
  ['tech-nascent', 'Nascent technology'],
  ['target-ttp', 'Time-to-power target missed'],
  ['site-does-not-fit', 'Does not fit (site)'],
  ['site-relaxed', 'Separation relaxed'],
  ['site-height', 'Height limit exceeded'],
  ['site-noise', 'Noise proxy above threshold'],
  ['target-landtake', 'Land take above ceiling'],
];
const flagLabel = (id) => (FLAG_FILTERS.find((f) => f[0] === id) || [id, id])[1];

// Site-fit flags belong to the Site tab (Beta): they are shown, counted and offered as filters in the main views
// only when the Site tab is turned on in the general settings (walkthrough, 2026-10-21). They never enter a score.
export const isSiteFlagId = (id) => id.startsWith('site-') || id === 'target-landtake';
export const isSiteFlag = (f) => f.siteFit === true || isSiteFlagId(f.id);
export const visibleFlags = (o, siteBeta) => (siteBeta ? o.flags : o.flags.filter((f) => !isSiteFlag(f)));
export const flagFilters = (siteBeta) => (siteBeta ? FLAG_FILTERS : FLAG_FILTERS.filter(([id]) => !isSiteFlagId(id)));

// Remove every site-fit part of a view (used when the Site tab is turned off).
export function withoutSiteFilters(v) {
  return { ...v, siteFit: [], landTakeCeilingHa: null, flagIds: (v.flagIds || []).filter((x) => !isSiteFlagId(x)), hideFlagIds: (v.hideFlagIds || []).filter((x) => !isSiteFlagId(x)),
    sortKey: v.sortKey === 'siteFit' || v.sortKey === 'landTake' ? 'rank' : v.sortKey };
}

function moneyM(x) {
  return `€${Number((x / 1e6).toPrecision(4)).toLocaleString('en-GB')} m`;
}

// Removable chips for the active view filters, in applyView() order. "Hide dominated options" is not
// a chip here: it has its own counter chip with a one-click "show" (§2 principle 5).
export function activeFilterChips(view) {
  const v = { ...DEFAULT_VIEW, ...view };
  const chips = [];
  for (const s of v.resilience) chips.push({ id: `res:${s}`, kind: 'resilience', label: `Resilience: ${s}`, remove: (w) => ({ ...w, resilience: w.resilience.filter((x) => x !== s) }) });
  for (const s of v.siteFit || []) chips.push({ id: `fit:${s}`, kind: 'siteFit', label: `Site fit: ${s}`, remove: (w) => ({ ...w, siteFit: (w.siteFit || []).filter((x) => x !== s) }) });
  for (const f of v.flagIds) chips.push({ id: `has:${f}`, kind: 'flagIds', label: `Has flag: ${flagLabel(f)}`, remove: (w) => ({ ...w, flagIds: w.flagIds.filter((x) => x !== f) }) });
  for (const f of v.hideFlagIds) chips.push({ id: `without:${f}`, kind: 'hideFlagIds', label: `Without flag: ${flagLabel(f)}`, remove: (w) => ({ ...w, hideFlagIds: w.hideFlagIds.filter((x) => x !== f) }) });
  if (v.capexCeiling != null) chips.push({ id: 'capex', kind: 'capexCeiling', label: `Capex ≤ ${moneyM(v.capexCeiling)}`, remove: (w) => ({ ...w, capexCeiling: null }) });
  if (v.landTakeCeilingHa != null) chips.push({ id: 'landTake', kind: 'landTakeCeilingHa', label: `Land take ≤ ${Number(v.landTakeCeilingHa.toPrecision(4)).toLocaleString('en-GB')} ha`, remove: (w) => ({ ...w, landTakeCeilingHa: null }) });
  if (v.dominated === 'only') chips.push({ id: 'dom', kind: 'dominated', label: 'Dominated only', remove: (w) => ({ ...w, dominated: 'all' }) });
  if (v.dominated === 'non') chips.push({ id: 'dom', kind: 'dominated', label: 'Non-dominated only', remove: (w) => ({ ...w, dominated: 'all' }) });
  if (v.archetypesOnly) chips.push({ id: 'arch', kind: 'archetypesOnly', label: 'Archetypes only', remove: (w) => ({ ...w, archetypesOnly: false }) });
  if (v.search) chips.push({ id: 'search', kind: 'search', label: `Name contains "${v.search}"`, remove: (w) => ({ ...w, search: '' }) });
  return chips;
}

// Number of active filter kinds (the header strip count), the same count as applyView()'s chips.
export function activeFilterCount(view) {
  return new Set(activeFilterChips(view).map((c) => c.kind)).size;
}
