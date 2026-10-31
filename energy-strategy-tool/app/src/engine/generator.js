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

import { CHOICES, CHOICE_BY_ID, defaultChoiceState, choiceLabel, existingEntered, plantPowerValues, plantTakeoverValues, plantCandidates, registryValue } from './defaults.js';
import { parsePlantValue, isPlantPower, isTakeover } from './plants.js';
import { mulberry32, subSeed, shuffle, hashString } from './prng.js';
import { permanentShortfallCoolings, shortfallAnalysis } from './adequacy.js';
import { COOLING } from './defaults.js';
import { buildContext } from './context.js';
import { triggerSet } from './triggers.js';

// Trigger event hours for the inputs (rule j), once per inputs object.
const TRIG = new WeakMap();
function triggerHours(inputs) {
  if (!TRIG.has(inputs)) TRIG.set(inputs, triggerSet(buildContext(inputs, { site: { noSiteModel: true } }), inputs.load).eventHours);
  return TRIG.get(inputs);
}

// No grid capacity at any time (rule k, O1).
export function noGridEver(inputs) {
  const g = inputs.grid;
  return !(g.nowMW > 0) && !(g.fullMW > 0) && !(g.steps || []).some((s) => Number(s.mw) > 0);
}

// Open cooling type with the lowest design facility load, once per inputs object (known issue 4, work package 14): the
// archetypes use it, so a reference strategy is not judged on the cooling the engineer left open.
const LOWEST = new WeakMap();
function lowestDesignCooling(inputs, open) {
  let c = LOWEST.get(inputs);
  if (!c) {
    const ctx = buildContext(inputs, { site: { noSiteModel: true } });
    const by = shortfallAnalysis(ctx, Object.keys(COOLING)).byCooling;
    c = by.slice().sort((a, b) => a.designMW - b.designMW).map((x) => x.cooling);
    LOWEST.set(inputs, c);
  }
  return c.find((id) => open.includes(id)) || open[0];
}

// Cooling types with a permanent shortfall, once per inputs object (rule g).
const PERM = new WeakMap();
function permSet(inputs) {
  let s = PERM.get(inputs);
  if (!s) { s = permanentShortfallCoolings(inputs); PERM.set(inputs, s); }
  return s;
}

// Plant values offered by the inputs (work package 19), once per inputs object, as permSet.
const PSETS = new WeakMap();
function plantSets(inputs) {
  let x = PSETS.get(inputs);
  if (!x) { x = { power: new Set(plantPowerValues(inputs)), takeover: new Set(plantTakeoverValues(inputs)) }; PSETS.set(inputs, x); }
  return x;
}

export const NA = 'n/a';
const IDS = CHOICES.map((c) => c.id);

// When is a choice irrelevant (n/a) given the values of earlier choices? (rule d)
export function isNA(id, v) {
  switch (id) {
    case 'C2': return !(v.C1 === 'bridge' || v.C1 === 'islanded');
    case 'C3': return v.C1 !== 'bridge';
    case 'C5a': case 'C6': case 'C7': return v.C5 === 'none' || v.C5 === 'retained';
    case 'C4s': return v.C4 === 'none';
    case 'C12r': return v.C12 === 'none';
    case 'C14': return v.C13 === 'none';
    case 'C18': return v.C5 === 'none' || v.C5 === 'retained';
    // Work package 19: an islanded campus has no grid connection to take over.
    case 'C21': return v.C1 === 'islanded';
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
  { id: 'h', name: '(h) Splitting bridging plant requires generating plant and a permanent shortfall',
    detail: 'C3 = Keep shortfall share as prime, rest as backup is not generated with C2 = BESS + solar only (no generating plant to keep running), or for a cooling type whose design load the full grid covers (it would repeat Retain as backup) (OPEN-QUESTIONS 59, 2026-10-23).',
    fails: (v, inputs) => v.C3 === 'split' && (v.C2 === 'bessSolar' || !permSet(inputs).has(v.C8)) },
  { id: 'i', name: '(i) A shortfall battery requires a permanent shortfall and a grid to recharge from',
    detail: 'C12 = Sized to the permanent shortfall is not generated when islanded, for a cooling type whose design load the full grid covers, or with a BESS role other than peak-shave (OPEN-QUESTIONS 60, 2026-10-23).',
    fails: (v, inputs) => v.C12 === 'shortfall' && (v.C1 === 'islanded' || !permSet(inputs).has(v.C8) || v.C12r !== 'peakShave') },
  { id: 'j', name: '(j) A trigger-hours battery requires flexibility and trigger hours',
    detail: 'C12 = Sized to the trigger hours is generated only with C16 = On, and (unless the battery size is held fixed) only when the profile has trigger hours at the trigger level (OPEN-QUESTIONS 33, 2026-10-23).',
    fails: (v, inputs) => v.C12 === 'trigger' && (v.C16 !== 'on' || (inputs.load.flexBatteryFixed !== 'size' && triggerHours(inputs) <= 0)) },
  { id: 'k', name: '(k) A PPA requires a grid to deliver it',
    detail: 'C13 ≠ None is not generated when islanded, or when there is no grid capacity at any time: the PPA could never be delivered, and the option would repeat its no-PPA twin (O1; OPEN-QUESTIONS 22, 2026-10-23).',
    fails: (v, inputs) => v.C13 !== 'none' && v.C13 !== NA && (v.C1 === 'islanded' || noGridEver(inputs)) },
  // Work package 12 (OPEN-QUESTIONS 79, 2026-10-24): existing plant near the site, leased; generalised by work package 19
  // (OPEN-QUESTIONS 118–119, 2026-10-31) to every nearby plant from the bundled list, leased (xl:) or bought (xb:).
  { id: 'l', name: '(l) Existing plant requires a plant that offers power, used in one role',
    detail: 'C2 or C4 = an existing plant is generated only for a plant that offers power (entered, or from the bundled list and not closed), and never as both bridging and firm plant in one option (it is one plant).',
    fails: (v, inputs) => {
      const a = isPlantPower(v.C2), b = isPlantPower(v.C4);
      if (!a && !b) return false;
      const ok = plantSets(inputs).power;
      if ((a && !ok.has(v.C2)) || (b && !ok.has(v.C4))) return true;
      return a && b && parsePlantValue(v.C2).id === parsePlantValue(v.C4).id;
    } },
  { id: 'm', name: '(m) Leased existing plant as bridging plant is handed back or kept running',
    detail: 'C2 = a leased existing plant is generated only with C3 = Remove (the lease ends when the grid arrives) or Retain as prime (the lease continues), and never with C5 = Retained bridging plant: it stands outside the campus and is not its standby. A bought plant may be kept as backup (OPEN-QUESTIONS 122).',
    fails: (v) => isPlantPower(v.C2) && parsePlantValue(v.C2).mode === 'lease' && ((v.C3 !== 'remove' && v.C3 !== 'prime' && v.C3 !== NA) || v.C5 === 'retained') },
  // Work package 19 (OPEN-QUESTIONS 119–120): the grid connection of a plant that closes within the study period.
  { id: 'p', name: '(p) A grid connection is taken over only from a plant that offers it',
    detail: 'C21 = a plant\'s grid connection is generated only for a plant within reach whose closure falls within the study period (or that has closed), with a connection to take over.',
    fails: (v, inputs) => isTakeover(v.C21) && !plantSets(inputs).takeover.has(v.C21) },
  // OPEN-QUESTIONS 118: an option uses one plant or two together (Opus review of package 19, finding 9).
  { id: 'q', name: '(q) An option uses at most two existing plants',
    detail: 'Bridging plant, firm plant and a taken-over grid connection from three different existing plants are not generated: options use one plant or two together (OPEN-QUESTIONS 118).',
    fails: (v) => plantsOfOption(v).length > 2 },
  // Work package 14 (OPEN-QUESTIONS 85, 2026-10-24; known issue 5): a rule rather than an n/a collapse, because C9 comes
  // before C10 in the choice order and the Site tab (Beta) still needs a location to draw.
  { id: 'o', name: '(o) Heat rejection location matters only with rooftop solar',
    detail: 'Without rooftop solar (C10 = None) the heat rejection location changes no cost, carbon, time-to-power, deliverability or flag (only the Site tab drawing): it only frees roof area for PV. Only the first open location is generated then; the others would repeat it (scores can differ by a few hundredths of a point through the run\'s axis ranges).',
    fails: (v, inputs) => v.C10 === 'none' && v.C9 !== NA && v.C9 !== openValues(inputs, 'C9')[0] },
  { id: 'n', name: '(n) Existing plant as firm plant is sized once',
    detail: 'C4 = Existing plant is the units offered whatever the sizing rule, so only one C4 sizing is generated: Permanent shortfall where there is one (islanded included), otherwise Average load.',
    fails: (v, inputs) => isPlantPower(v.C4) && v.C4s === 'average' && (v.C1 === 'islanded' || permSet(inputs).has(v.C8)) },
];
export const RULE_D = { id: 'd', name: '(d) Choices that are n/a collapse to "n/a" rather than multiplying options',
  detail: 'C2 and C3 when there is no bridging, C4 sizing when there is no firm plant, the backup arrangement when there are no gensets, C14 when there is no PPA, BESS role when there is no BESS, C6/C7/C18 when there are no gensets, C21 when islanded.' };

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
  // isNA reads only earlier choices, so one working copy updated in choice order gives the same result as merging the
  // earlier outputs into v for every choice (and is much faster: work package 19 checks many more combinations).
  const out = {};
  const m = { ...v };
  for (const id of IDS) { const x = isNA(id, m) ? NA : v[id]; out[id] = x; m[id] = x; }
  return out;
}

// C21 (work package 19) is left out of the key while it is None or n/a, so option keys and ids of studies without a
// takeover are unchanged from before.
export function choiceKey(v) {
  return IDS.filter((id) => !(id === 'C21' && (v[id] === 'none' || v[id] === NA || v[id] === undefined))).map((id) => `${id}=${v[id]}`).join('|');
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
      if (val === 'existing' && !existingEntered(inputs)) reason = 'no existing plant entered';
      else if (parsePlantValue(val)) reason = 'plant not offered';
      else if (def.values.includes(val)) reason = 'excluded by user';
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
      if ((c.id === 'C2' || c.id === 'C4') && omitted.some((o) => o.value === 'existing') && !existingEntered(inputs)) note = (note ? note + ' ' : '') + 'Existing plant (lease) is generated when an existing plant near the site is entered (section 4).';
      if (c.id === 'C3' && omitted.some((o) => o.value === 'gridServices' && o.reason === 'default subset')) note = 'Retain for grid services is not generated by default: grid-service revenue is not modelled, so it repeats Retain as backup (revenue options are off by default). Tick it in Choices to include it.';
      if (c.id === 'C17') note = 'GIS reduces substation footprint.';
      if (c.id === 'C18') note = 'Double-deck and in-building arrangements reduce genset footprint.';
      out.push({ id: c.id, name: c.name, state: st.state, omitted, note });
    }
  }
  return out;
}

// Choice domains split into the base space (no existing plant) and the plant values (work package 19). The plant values
// of C2, C4 and C21 would multiply the whole space (each nearby plant adds two C2, two C4 and one C21 value), so the
// combinations with a plant are not enumerated as a product: each is reached from exactly one base row, its
// representative, in which every C2 or C4 plant value is replaced by a stand-in value (PLANT_TOKEN, named by no rule)
// and C21 by None. Every combination is still checked against every rule, and plant combinations count against the
// leaf limit like base ones (Opus review of package 19, findings 3–5).
export const PLANT_TOKEN = '__plant__';
function splitDomains(inputs) {
  const all = IDS.map((id) => openValues(inputs, id));
  const plantIn = (id, d) => (id === 'C2' || id === 'C4' ? d.filter(isPlantPower) : id === 'C21' ? d.filter(isTakeover) : []);
  const P = { C2: plantIn('C2', all[IDS.indexOf('C2')]), C4: plantIn('C4', all[IDS.indexOf('C4')]), C21: plantIn('C21', all[IDS.indexOf('C21')]) };
  const noneC21 = all[IDS.indexOf('C21')].includes('none');
  const base = all.map((d, i) => {
    const id = IDS[i];
    if (id === 'C21') return ['none'];
    if (!P[id] || !P[id].length) return d;
    return [...d.filter((x) => !P[id].includes(x)), PLANT_TOKEN];
  });
  // The base space without the stand-in, for the Latin hypercube over base options.
  const lhs = base.map((d, i) => (IDS[i] === 'C21' ? ['none'] : d.filter((x) => x !== PLANT_TOKEN)));
  const hasPlants = P.C2.length + P.C4.length + P.C21.length > 0;
  return { all, base, lhs, P, noneC21, hasPlants };
}

// Visit the valid combinations of the base space (fn(v) for each; v is reused, copy it to keep it).
function visitBase(inputs, domains, fn, maxLeaves, stats) {
  const cur = {};
  const rec = (i) => {
    if (stats.truncated) return;
    if (i === IDS.length) {
      stats.collapsed++;
      if (stats.collapsed + stats.plantCollapsed > maxLeaves) { stats.truncated = true; return; }
      const r = firstFailingRule(cur, inputs);
      if (r) stats.removed[r] = (stats.removed[r] || 0) + 1;
      else fn(cur);
      return;
    }
    const id = IDS[i];
    if (isNA(id, cur)) { cur[id] = NA; rec(i + 1); return; }
    for (const val of domains[i]) { cur[id] = val; rec(i + 1); }
  };
  rec(0);
}

// A base row that is not itself an option: a stand-in value, or C21 = None when the engineer excluded None.
const isStandInRow = (v, sd) => v.C2 === PLANT_TOKEN || v.C4 === PLANT_TOKEN || (v.C21 === 'none' && !sd.noneC21);

// The plant combinations reached from one base row r: fn(v) for each valid one (v is a fresh canonical object).
function expandPlants(r, sd, inputs, fn, stats, maxLeaves) {
  const { P } = sd;
  const c2s = r.C2 === PLANT_TOKEN ? P.C2 : [r.C2];
  const c4s = r.C4 === PLANT_TOKEN ? P.C4 : [r.C4];
  const standIn = r.C2 === PLANT_TOKEN || r.C4 === PLANT_TOKEN;
  // C21 from the engineer's domain: None only where the row stands in for a plant value (else it is the base row).
  const c21s = isNA('C21', r) ? [NA] : [...(standIn && sd.noneC21 ? ['none'] : []), ...P.C21];
  for (const C2 of c2s) for (const C4 of c4s) for (const C21 of c21s) {
    if (stats.truncated) return;
    if (!isPlantPower(C2) && !isPlantPower(C4) && !isTakeover(C21)) continue; // that is the base row itself
    if (++stats.plantCollapsed + stats.collapsed > maxLeaves) { stats.truncated = true; return; }
    const v = canonical({ ...r, C2, C4, C21 });
    const f = firstFailingRule(v, inputs);
    if (f) stats.removed[f] = (stats.removed[f] || 0) + 1;
    else fn(v);
  }
}

// Plants an option uses (power or connection), by plant id.
export function plantsOfOption(v) {
  const ids = new Set();
  for (const id of ['C2', 'C4', 'C21']) { const p = parsePlantValue(v[id]); if (p) ids.add(p.id); }
  return [...ids];
}

// Fast count of valid combinations (no storage) for the Choices panel projected count. Stops at maxLeaves (then
// `truncated`, and the count is a lower bound).
export function countCombinations(inputs, maxLeaves = 3000000) {
  const sd = splitDomains(inputs);
  const stats = { collapsed: 0, plantCollapsed: 0, removed: {}, truncated: false };
  let valid = 0, plant = 0;
  visitBase(inputs, sd.base, (v) => {
    if (!isStandInRow(v, sd)) valid++;
    if (sd.hasPlants) expandPlants(v, sd, inputs, () => { plant++; }, stats, maxLeaves);
  }, maxLeaves, stats);
  const domains = sd.all;
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
  return { collapsed: stats.collapsed + stats.plantCollapsed, valid: valid + plant, plant, total: valid + plant + archetypeExtra, truncated: stats.truncated };
}

// Growable Int32 store for the plant combinations (Opus review of package 19, finding 3: compact, within the leaf limit).
function intStore() {
  let a = new Int32Array(1024), n = 0;
  return { push(x) { if (n === a.length) { const b = new Int32Array(a.length * 2); b.set(a); a = b; } a[n++] = x; }, get: (i) => a[i], get length() { return n; } };
}

// Count and enumerate. Returns the valid canonical base combinations as plain objects, and the combinations with an
// existing plant (work package 19) as a compact store (plant.get(i) gives the i-th; plant.byPlant lists them per plant).
export function enumerate(inputs, maxLeaves = 3000000) {
  const sd = splitDomains(inputs);
  const rawTotal = sd.all.reduce((p, d) => p * d.length, 1);
  const stats = { collapsed: 0, plantCollapsed: 0, removed: Object.fromEntries(RULES.map((r) => [r.id, 0])), truncated: false };
  const valid = [];
  const reps = [];
  const pRow = intStore(), pCode = intStore();
  const dict = [], dictIx = new Map();
  const ix = (x) => { let k = dictIx.get(x); if (k === undefined) { k = dict.length; dict.push(x); dictIx.set(x, k); } return k; };
  const byPlant = new Map();
  visitBase(inputs, sd.base, (cur) => {
    const v = { ...cur };
    if (!isStandInRow(v, sd)) valid.push(v);
    if (sd.hasPlants) {
      let ri = -1;
      expandPlants(v, sd, inputs, (c) => {
        if (ri < 0) { ri = reps.length; reps.push(v); }
        const j = pRow.length;
        pRow.push(ri);
        pCode.push(ix(c.C2) | (ix(c.C4) << 10) | (ix(c.C21) << 20));
        for (const id of plantsOfOption(c)) { if (!byPlant.has(id)) byPlant.set(id, []); byPlant.get(id).push(j); }
      }, stats, maxLeaves);
    }
  }, maxLeaves, stats);
  const plant = {
    count: pRow.length,
    byPlant,
    get: (j) => { const c = pCode.get(j); return canonical({ ...reps[pRow.get(j)], C2: dict[c & 1023], C4: dict[(c >> 10) & 1023], C21: dict[(c >> 20) & 1023] }); },
  };
  const collapsedTotal = stats.collapsed + stats.plantCollapsed;
  return {
    rawTotal,
    collapsedTotal,
    removedByRule: { d: Math.max(0, rawTotal - collapsedTotal), ...stats.removed },
    valid,
    plant,
    truncated: stats.truncated,
    domains: Object.fromEntries(IDS.map((id, i) => [id, sd.all[i]])),
  };
}

function archetypeVector(a, inputs) {
  const v = {};
  for (const id of IDS) {
    if (a.v[id] !== undefined) v[id] = a.v[id];
    else v[id] = openValues(inputs, id)[0];
  }
  // Cooling (known issue 4, work package 14, OPEN-QUESTIONS 84): the engineer's cooling type when one is set; when it is
  // left open, the open type with the lowest design facility load, not the first in the list (air).
  const c8 = openValues(inputs, 'C8');
  if (c8.length > 1) v.C8 = lowestDesignCooling(inputs, c8);
  // Solar archetypes take "Roof + ground" only when a ground area for PV is entered; otherwise Roof only (rule f).
  if (v.C10 === 'roofGround' && !(inputs.site.pvGroundHa > 0)) v.C10 = 'roof';
  // Archetypes with a PPA use the engineer's PPA when one is ticked (OPEN-QUESTIONS 49), and drop it where it could
  // never be delivered (rule k).
  if (v.C13 !== 'none' && inputs.utilities.ppaInclude) { v.C13 = inputs.utilities.ppaType; v.C14 = String(inputs.utilities.ppaCoverage); }
  if (v.C13 !== 'none' && (v.C1 === 'islanded' || noGridEver(inputs))) v.C13 = 'none';
  // Firm-plant archetypes take the top-up sizing only where there is a permanent shortfall (rule g).
  if (v.C4s === 'shortfall' && v.C1 !== 'islanded' && !permSet(inputs).has(v.C8)) v.C4s = 'average';
  return canonical(v);
}

// Seeded Latin hypercube over choice dimensions, with repair to valid unique combinations.
function lhsSample(valid, n, inputs, seed, exclude) {
  const rand = mulberry32(subSeed(seed, 'lhs'));
  const domains = splitDomains(inputs).lhs;
  const strata = domains.map((d, j) => {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(d[i % d.length]);
    // C21 (work package 19) with no takeover to choose draws nothing from the seeded stream, so the sample of a study
    // without plants is the one drawn before C21 existed.
    if (IDS[j] === 'C21' && d.length === 1) return arr;
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
  const plantN = en.plant.count;
  const totalCombinations = en.valid.length + plantN + archetypesOutsideSpace;

  let rest;
  let sampled = false;
  let repaired = 0;
  let plantDrawn = [];
  const perPlant = {};
  const projected = totalCombinations;
  if (sampling && projected > cap) {
    sampled = true;
    const room = Math.max(0, cap - list.length);
    // Combinations with an existing plant (work package 19, OPEN-QUESTIONS 118): a share of the sample
    // (plants.sampleShare), split equally between the plants, so each plant gets its own share; drawn at random (seeded)
    // from that plant's combinations. A share a plant cannot fill goes to the next plants, then to the base space.
    if (plantN > 0) {
      const share = Math.min(plantN, Math.floor(room * registryValue('plants.sampleShare')));
      const ids = [...en.plant.byPlant.keys()].sort();
      const rand = mulberry32(subSeed(seed, 'plants'));
      const taken = new Set();
      let left = share;
      ids.forEach((id, i) => {
        const want = Math.floor(left / (ids.length - i));
        const pool = shuffle(en.plant.byPlant.get(id).filter((j) => !taken.has(j)), rand);
        let got = 0;
        for (const j of pool) { if (got >= want) break; taken.add(j); got++; }
        perPlant[id] = { combinations: en.plant.byPlant.get(id).length, drawn: got };
        left -= got;
      });
      plantDrawn = [...taken].sort((x, y) => x - y).map((j) => en.plant.get(j)).filter((v) => !archetypeTags.has(choiceKey(v)));
    }
    const r = lhsSample(en.valid, Math.max(0, room - plantDrawn.length), inputs, seed, new Set(archetypeTags.keys()));
    // Room the base space cannot fill goes back to the plant combinations (Opus review of package 19, finding 6).
    let spare = room - plantDrawn.length - r.sample.length;
    if (spare > 0 && plantN > plantDrawn.length) {
      const have = new Set(plantDrawn.map(choiceKey));
      const rand2 = mulberry32(subSeed(seed, 'plants-spare'));
      const order = shuffle(Array.from({ length: plantN }, (_, j) => j), rand2);
      for (const j of order) {
        if (spare <= 0) break;
        const v = en.plant.get(j), k = choiceKey(v);
        if (have.has(k) || archetypeTags.has(k)) continue;
        have.add(k); plantDrawn.push(v); spare--;
        for (const id of plantsOfOption(v)) if (perPlant[id]) perPlant[id].drawn++;
      }
    }
    rest = [...r.sample, ...plantDrawn];
    repaired = r.repaired;
  } else {
    rest = en.valid.filter((v) => !archetypeTags.has(choiceKey(v)));
    for (let j = 0; j < plantN; j++) rest.push(en.plant.get(j));
    for (const [id, js] of en.plant.byPlant) perPlant[id] = { combinations: js.length, drawn: js.length };
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
      validCombinations: en.valid.length + plantN,
      plantCombinations: plantN,
      plantSampling: perPlant,
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
  const c2 = isPlantPower(v.C2) ? choiceLabel('C2', v.C2) : choiceLabel('C2', v.C2).toLowerCase(); // plant names keep their case
  if (v.C1 === 'bridge') parts.push(`Grid + ${c2} bridge → ${choiceLabel('C3', v.C3).toLowerCase()}`);
  else if (v.C1 === 'islanded') parts.push(`Islanded ${c2}`);
  else if (v.C1 === 'export') parts.push('Grid + export');
  if (v.C4 !== 'none') parts.push(`${choiceLabel('C4', v.C4)}${v.C4s === 'shortfall' ? ' top-up' : ''}`);
  const backup = v.C5 === 'none' ? 'no backup' : v.C5 === 'retained' ? 'retained-plant backup' : `${choiceLabel('C5', v.C5).replace(' gensets', '')} ${v.C6}${v.C5a === 'pooled' ? ' pooled' : ''}`;
  parts.push(backup);
  parts.push(choiceLabel('C8', v.C8).split(' ')[0]);
  if (s && s.solarMWp > 0) parts.push(`PV ${s.solarMWp.toFixed(s.solarMWp < 10 ? 1 : 0)} MWp`);
  if (s && s.windMW > 0) parts.push(`Wind ${s.windMW.toFixed(0)} MW`);
  if (v.C12 === 'shortfall') parts.push('BESS for the shortfall');
  else if (v.C12 === 'trigger') parts.push('BESS for the trigger hours');
  else if (v.C12 !== 'none') parts.push(`BESS ${v.C12.slice(0, 2).replace('h', ' h')}`);
  if (v.C13 !== 'none') parts.push(`PPA ${choiceLabel('C13', v.C13).toLowerCase()} ${v.C14} %`);
  // Work package 19: a nearby plant's grid connection taken over.
  if (isTakeover(v.C21)) parts.push(choiceLabel('C21', v.C21).replace(': its grid connection', '\u2019s grid connection taken over'));
  return parts.join(' · ');
}

export { IDS as CHOICE_IDS, CHOICE_BY_ID };
