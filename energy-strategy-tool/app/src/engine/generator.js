// Option generator (BRIEF §7.2, §7.3, §8).
//
// 1. Enumerate the Cartesian product of open choices (locked choices give one value).
//    Choices that are n/a for a combination collapse to "n/a" (compatibility rule d).
// 2. Remove logically impossible combinations with named compatibility rules and count each.
// 3. Archetype baselines are always generated, whatever the choice defaults.
// 4. If the count exceeds the cap and "Sample above cap" is on, keep every archetype,
//    then seeded Latin hypercube sampling over the remaining valid choice space.
//    The cap (2,000 by default) bounds the whole screened list, archetypes included: every
//    archetype plus (cap − archetypes) sampled combinations, so 2,000 in total (more only if
//    the archetypes alone exceed the cap). Combinations not drawn are absent from the option
//    list: they are not sized, dispatched, scored or shown. The run records the sampling
//    decision with the screened and total counts: run flag gen-sampling, and warning
//    cap-sampling in the run event log. Switching sampling off screens them all.

import { CHOICES, CHOICE_BY_ID, defaultChoiceState, choiceLabel } from './defaults.js';
import { mulberry32, subSeed, shuffle, hashString } from './prng.js';
import { permanentShortfallCoolings } from './adequacy.js';

// Cooling types with a permanent shortfall, once per inputs object (rule g).
const PERM = new WeakMap();
function permSet(inputs) {
  let s = PERM.get(inputs);
  if (!s) { s = permanentShortfallCoolings(inputs); PERM.set(inputs, s); }
  return s;
}

export const NA = 'n/a';
const IDS = CHOICES.map((c) => c.id);

// When is a choice irrelevant (n/a) given the values of earlier choices? (rule d)
export function isNA(id, v) {
  switch (id) {
    case 'C2': return !(v.C1 === 'bridge' || v.C1 === 'islanded');
    case 'C3': return v.C1 !== 'bridge';
    case 'C6': case 'C7': return v.C5 === 'none' || v.C5 === 'retained';
    case 'C4s': return v.C4 === 'none';
    case 'C12r': return v.C12 === 'none';
    case 'C14': return v.C13 === 'none';
    case 'C18': return v.C5 === 'none' || v.C5 === 'retained';
    default: return false;
  }
}

// Compatibility rules (BRIEF §7.2 step 2). Only logically impossible combinations.
export const RULES = [
  { id: 'a', name: '(a) CHP heat to absorption chillers requires a gas supply',
    detail: 'C4 = Gas CHP-trigen is not generated when Gas available = No.',
    fails: (v, inputs) => v.C4 === 'chp' && inputs.utilities.gasAvailable === 'No' },
  { id: 'b', name: '(b) Heat offtake requires a district-heating input',
    detail: 'C15 ≠ None is not generated when District heating offtake = No.',
    fails: (v, inputs) => v.C15 !== 'none' && v.C15 !== NA && inputs.utilities.districtHeating !== 'Yes' },
  { id: 'c', name: '(c) "BESS as bridging" requires a non-zero BESS size',
    detail: 'C12 role = Bridging support with C12 size = None is not generated.',
    fails: (v) => v.C12r === 'bridgingSupport' && v.C12 === 'none' },
  { id: 'e', name: '(e) Retained-bridging backup requires retained bridging plant',
    detail: 'C5 = Retained bridging plant needs bridging plant that stays on site (C1 = Islanded, or C1 = Bridge with C3 ≠ Remove). Added by the builder: see BUILD-NOTES "Brief issues".',
    fails: (v) => v.C5 === 'retained' && !(v.C1 === 'islanded' || (v.C1 === 'bridge' && v.C3 !== 'remove')) },
  { id: 'f', name: '(f) "Roof + ground" solar requires a ground area for PV',
    detail: 'C10 = Roof + ground is not generated while the ground area for PV is 0 (OPEN-QUESTIONS 54, 2026-10-22); it would repeat Roof only.',
    fails: (v, inputs) => v.C10 === 'roofGround' && !(inputs.site.pvGroundHa > 0) },
  { id: 'g', name: '(g) A top-up firm plant requires a permanent shortfall',
    detail: 'C4 sizing = Permanent shortfall is not generated for a cooling type whose design load the full grid covers (OPEN-QUESTIONS 58, 2026-10-23); it would repeat C4 = None. Islanded options always have one.',
    fails: (v, inputs) => v.C4s === 'shortfall' && v.C1 !== 'islanded' && !permSet(inputs).has(v.C8) },
];
export const RULE_D = { id: 'd', name: '(d) Choices that are n/a collapse to "n/a" rather than multiplying options',
  detail: 'C2 and C3 when there is no bridging, C4 sizing when there is no firm plant, C14 when there is no PPA, BESS role when there is no BESS, C6/C7/C18 when there are no gensets.' };

// Archetype baselines (BRIEF §7.3). Values not listed take the first open value of the choice.
export const ARCHETYPES = [
  { id: 'A1', name: 'Grid-only', v: { C1: 'wait', C4: 'none', C5: 'diesel', C10: 'none', C11: 'none', C12: 'none', C13: 'none' } },
  { id: 'A2', name: 'Grid + offsite PPA', v: { C1: 'wait', C4: 'none', C5: 'hvo', C10: 'none', C11: 'none', C12: 'none', C13: 'hybrid', C14: '100' } },
  { id: 'A3', name: 'Grid + on-site solar + BESS', v: { C1: 'wait', C4: 'none', C5: 'hvo', C10: 'roofGround', C11: 'none', C12: '4h50', C13: 'none' } },
  { id: 'A4', name: 'Grid + gas CHP/trigeneration + BESS', v: { C1: 'wait', C4: 'chp', C5: 'hvo', C10: 'none', C11: 'none', C12: '2h25', C13: 'none' } },
  { id: 'A5', name: 'Gas bridging to grid', v: { C1: 'bridge', C2: 'gasRecip', C3: 'backup', C4: 'none', C5: 'retained', C10: 'none', C11: 'none', C12: 'none', C13: 'none' } },
  { id: 'A6', name: 'Islanded gas + solar + BESS', v: { C1: 'islanded', C2: 'gasRecip', C4: 'none', C5: 'retained', C10: 'roofGround', C11: 'none', C12: '4h50', C13: 'none' } },
  { id: 'A7', name: 'Renewables-led', v: { C1: 'wait', C4: 'none', C5: 'hvo', C10: 'roofGround', C11: 'fit', C12: '4h50', C13: 'hybrid', C14: '100' } },
  { id: 'A8', name: 'Fuel cells + grid', v: { C1: 'wait', C4: 'fuelCell', C5: 'hvo', C10: 'none', C11: 'none', C12: 'none', C13: 'none' } },
  // A9 uses BESS-augmented UPS so it differs from A2 (which already uses HVO gensets, the first C5 default value).
  { id: 'A9', name: 'Low-carbon backup + grid + PPA', v: { C1: 'wait', C4: 'none', C5: 'bessUps', C10: 'none', C11: 'none', C12: 'none', C13: 'hybrid', C14: '100' } },
  { id: 'A10a', name: 'Nascent firm (SMR)', v: { C1: 'wait', C4: 'smr', C5: 'hvo', C10: 'none', C11: 'none', C12: 'none', C13: 'none' } },
  { id: 'A10b', name: 'Nascent firm (hydrogen)', v: { C1: 'wait', C4: 'hydrogen', C5: 'hvo', C10: 'none', C11: 'none', C12: 'none', C13: 'none' } },
];

function openValues(inputs, id) {
  const st = inputs.choices[id] || defaultChoiceState(id, inputs);
  const vals = st.state === 'locked' ? st.values.slice(0, 1) : st.values.slice();
  return vals.length ? vals : [defaultChoiceState(id, inputs).values[0]];
}

// Canonicalise: apply n/a collapse in choice order.
export function canonical(v) {
  const out = {};
  for (const id of IDS) out[id] = isNA(id, { ...v, ...out }) ? NA : v[id];
  return out;
}

export function choiceKey(v) {
  return IDS.map((id) => `${id}=${v[id]}`).join('|');
}

function firstFailingRule(v, inputs) {
  for (const r of RULES) if (r.fails(v, inputs)) return r.id;
  return null;
}

// "Values not generated" note (BRIEF §8 rules).
export function valuesNotGenerated(inputs) {
  const out = [];
  for (const c of CHOICES) {
    const def = defaultChoiceState(c.id, inputs);
    const st = inputs.choices[c.id] || def;
    const current = new Set(st.state === 'locked' ? st.values.slice(0, 1) : st.values);
    const omitted = c.values.filter(([val]) => !current.has(val)).map(([val, label]) => {
      let reason;
      if (def.values.includes(val)) reason = 'excluded by user';
      else if (c.id === 'C11' && def.windDefault) reason = `wind default (site ≤ ${inputs.settings.windSiteThresholdHa} ha)`;
      else if (c.id === 'C10' && def.groundDefault && val === 'roofGround') reason = 'ground area for PV is 0';
      else if (st.state === 'locked') reason = 'locked';
      else reason = 'default subset';
      return { value: val, label, reason };
    });
    if (omitted.length) {
      let note = '';
      if (c.id === 'C10' && def.groundDefault && omitted.some((o) => o.value === 'roofGround')) note = 'Roof + ground not generated: the ground area for PV is 0. Enter a ground area for PV (Site section) to include ground solar.';
      if (c.id === 'C11' && def.windDefault) note = `Wind not generated by default: site ≤ ${inputs.settings.windSiteThresholdHa} ha (threshold editable). Wind options are available through C11.`;
      // C17/C18: the run adds the "N options do not fit" count after the layout (run.js withSiteFitNotes).
      if (c.id === 'C17') note = 'GIS reduces substation footprint.';
      if (c.id === 'C18') note = 'Double-deck and in-building arrangements reduce genset footprint.';
      out.push({ id: c.id, name: c.name, state: st.state, omitted, note });
    }
  }
  return out;
}

// Fast count of valid combinations (no storage) for the Choices panel projected count.
export function countCombinations(inputs) {
  const domains = IDS.map((id) => openValues(inputs, id));
  let collapsed = 0;
  let valid = 0;
  const cur = {};
  const rec = (i) => {
    if (i === IDS.length) {
      collapsed++;
      if (!firstFailingRule(cur, inputs)) valid++;
      return;
    }
    const id = IDS[i];
    if (isNA(id, cur)) { cur[id] = NA; rec(i + 1); return; }
    for (const val of domains[i]) { cur[id] = val; rec(i + 1); }
  };
  rec(0);
  const archetypeExtra = ARCHETYPES.reduce((acc, a) => {
    const v = archetypeVector(a, inputs);
    const k = choiceKey(v);
    if (acc.seen.has(k)) return acc;
    acc.seen.add(k);
    // Archetype vectors outside the open space are generated in addition.
    const inSpace = IDS.every((id) => v[id] === NA || domains[IDS.indexOf(id)].includes(v[id])) && !firstFailingRule(v, inputs);
    if (!inSpace) acc.n++;
    return acc;
  }, { n: 0, seen: new Set() }).n;
  return { collapsed, valid, total: valid + archetypeExtra };
}

// Count and enumerate. Returns valid canonical combinations as plain objects.
export function enumerate(inputs, maxLeaves = 3000000) {
  const domains = IDS.map((id) => openValues(inputs, id));
  const rawTotal = domains.reduce((p, d) => p * d.length, 1);
  const removed = Object.fromEntries(RULES.map((r) => [r.id, 0]));
  const valid = [];
  let collapsedTotal = 0;
  let truncated = false;
  const cur = {};
  const rec = (i) => {
    if (truncated) return;
    if (i === IDS.length) {
      collapsedTotal++;
      if (collapsedTotal > maxLeaves) { truncated = true; return; }
      const r = firstFailingRule(cur, inputs);
      if (r) removed[r]++;
      else valid.push({ ...cur });
      return;
    }
    const id = IDS[i];
    if (isNA(id, cur)) {
      cur[id] = NA;
      rec(i + 1);
      return;
    }
    for (const val of domains[i]) {
      cur[id] = val;
      rec(i + 1);
    }
  };
  rec(0);
  return {
    rawTotal,
    collapsedTotal,
    removedByRule: { d: rawTotal - collapsedTotal, ...removed },
    valid,
    truncated,
    domains: Object.fromEntries(IDS.map((id, i) => [id, domains[i]])),
  };
}

function archetypeVector(a, inputs) {
  const v = {};
  for (const id of IDS) {
    if (a.v[id] !== undefined) v[id] = a.v[id];
    else v[id] = openValues(inputs, id)[0];
  }
  // Solar archetypes take "Roof + ground" only when a ground area for PV is entered; otherwise Roof only (rule f).
  if (v.C10 === 'roofGround' && !(inputs.site.pvGroundHa > 0)) v.C10 = 'roof';
  // Firm-plant archetypes take the top-up sizing only where there is a permanent shortfall (rule g).
  if (v.C4s === 'shortfall' && v.C1 !== 'islanded' && !permSet(inputs).has(v.C8)) v.C4s = 'average';
  return canonical(v);
}

// Seeded Latin hypercube over choice dimensions, with repair to valid unique combinations.
function lhsSample(valid, n, inputs, seed, exclude) {
  const rand = mulberry32(subSeed(seed, 'lhs'));
  const domains = IDS.map((id) => openValues(inputs, id));
  const strata = domains.map((d) => {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(d[i % d.length]);
    return shuffle(arr, rand);
  });
  const validByKey = new Map(valid.map((v) => [choiceKey(v), v]));
  const chosen = new Map();
  const misses = [];
  for (let i = 0; i < n; i++) {
    const v = {};
    IDS.forEach((id, j) => { v[id] = strata[j][i]; });
    const c = canonical(v);
    const k = choiceKey(c);
    if (validByKey.has(k) && !chosen.has(k) && !exclude.has(k)) chosen.set(k, validByKey.get(k));
    else misses.push(i);
  }
  // Repair: fill remaining slots uniformly at random from unchosen valid combinations.
  if (misses.length) {
    const pool = shuffle(valid.filter((v) => { const k = choiceKey(v); return !chosen.has(k) && !exclude.has(k); }), rand);
    for (let i = 0; i < misses.length && i < pool.length; i++) chosen.set(choiceKey(pool[i]), pool[i]);
  }
  return { sample: [...chosen.values()], repaired: misses.length };
}

export function generateOptions(inputs) {
  const en = enumerate(inputs);
  const cap = inputs.settings.generationCap;
  const sampling = inputs.settings.sampleAboveCap;
  const seed = inputs.project.seed;

  // Archetypes first (always generated, never sampled out).
  const archetypeTags = new Map();
  const list = [];
  for (const a of ARCHETYPES) {
    const v = archetypeVector(a, inputs);
    const k = choiceKey(v);
    if (!archetypeTags.has(k)) {
      archetypeTags.set(k, a);
      list.push({ v, key: k, archetype: a.id, archetypeName: a.name });
    }
  }
  const validKeys = new Set(en.valid.map(choiceKey));
  const archetypesOutsideSpace = list.filter((o) => !validKeys.has(o.key)).length;
  const totalCombinations = en.valid.length + archetypesOutsideSpace;

  let rest;
  let sampled = false;
  let repaired = 0;
  const projected = totalCombinations;
  if (sampling && projected > cap) {
    sampled = true;
    const r = lhsSample(en.valid, Math.max(0, cap - list.length), inputs, seed, new Set(archetypeTags.keys()));
    rest = r.sample;
    repaired = r.repaired;
  } else {
    rest = en.valid.filter((v) => !archetypeTags.has(choiceKey(v)));
  }
  for (const v of rest) list.push({ v, key: choiceKey(v), archetype: null, archetypeName: null });

  // Stable order by key hash so results do not depend on enumeration order details.
  list.forEach((o) => { o.hash = hashString(o.key); });

  return {
    options: list,
    summary: {
      rawTotal: en.rawTotal,
      collapsedTotal: en.collapsedTotal,
      removedByRule: en.removedByRule,
      validCombinations: en.valid.length,
      archetypes: archetypeTags.size,
      archetypesOutsideSpace,
      totalCombinations,
      screened: list.length,
      cap,
      sampling,
      sampled,
      lhsRepaired: repaired,
      truncated: en.truncated,
      valuesNotGenerated: valuesNotGenerated(inputs),
    },
  };
}

export function optionName(v, s) {
  const parts = [];
  if (v.C1 === 'wait') parts.push('Grid');
  else if (v.C1 === 'bridge') parts.push(`Grid + ${choiceLabel('C2', v.C2).toLowerCase()} bridge → ${choiceLabel('C3', v.C3).toLowerCase()}`);
  else if (v.C1 === 'islanded') parts.push(`Islanded ${choiceLabel('C2', v.C2).toLowerCase()}`);
  else if (v.C1 === 'export') parts.push('Grid + export');
  if (v.C4 !== 'none') parts.push(`${choiceLabel('C4', v.C4)}${v.C4s === 'shortfall' ? ' top-up' : ''}`);
  const backup = v.C5 === 'none' ? 'no backup' : v.C5 === 'retained' ? 'retained-plant backup' : `${choiceLabel('C5', v.C5).replace(' gensets', '')} ${v.C6}`;
  parts.push(backup);
  parts.push(choiceLabel('C8', v.C8).split(' ')[0]);
  if (s && s.solarMWp > 0) parts.push(`PV ${s.solarMWp.toFixed(s.solarMWp < 10 ? 1 : 0)} MWp`);
  if (s && s.windMW > 0) parts.push(`Wind ${s.windMW.toFixed(0)} MW`);
  if (v.C12 !== 'none') parts.push(`BESS ${v.C12.slice(0, 2).replace('h', ' h')}`);
  if (v.C13 !== 'none') parts.push(`PPA ${choiceLabel('C13', v.C13).toLowerCase()} ${v.C14} %`);
  return parts.join(' · ');
}

export { IDS as CHOICE_IDS, CHOICE_BY_ID };
