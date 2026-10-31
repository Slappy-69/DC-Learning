// Existing gas plants near the site from the bundled list (work package 19, owner 2026-10-31, OPEN-QUESTIONS 116–123).
// Pure: the list (src/data/gas-plants.js, powerplantmatching, CC BY 4.0), distances, and the merge of entries that look
// like the same plant. Defaults, the technology records and the option values are in defaults.js (plantCandidates,
// applyPlants); the takeover of a plant's grid connection is in context.js (ctxFor).

import { GAS_PLANTS } from '../data/gas-plants.js';
import { distanceKm } from './weather.js';

export const PLANT_SOURCE = {
  name: GAS_PLANTS.source, licence: GAS_PLANTS.licence, credit: GAS_PLANTS.credit, url: GAS_PLANTS.url, ref: GAS_PLANTS.ref,
  builtAt: GAS_PLANTS.builtAt, count: GAS_PLANTS.count, filter: GAS_PLANTS.filter,
};

let LIST = null;
export function plantList() {
  if (!LIST) {
    const C = GAS_PLANTS.columns;
    LIST = GAS_PLANTS.rows.map((r) => Object.fromEntries(C.map((c, i) => [c, r[i]])));
  }
  return LIST;
}

// Plants within radiusKm of the point, of minMW or more, nearest first.
export function nearbyPlants(lat, lon, { radiusKm = 10, minMW = 50 } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  const out = [];
  for (const p of plantList()) {
    if (!(p.mw >= minMW)) continue;
    if (Math.abs(p.lat - lat) > radiusKm / 100 + 0.2) continue; // quick box test (1° latitude ≈ 111 km)
    const km = distanceKm(lat, lon, p.lat, p.lon);
    if (km <= radiusKm) out.push({ ...p, km });
  }
  return out.sort((a, b) => a.km - b.km || (a.id < b.id ? -1 : 1));
}

// Entries that look like the same plant (OPEN-QUESTIONS 118): within mergeKm of each other, of the same type, and of
// similar size (the smaller at least (1 − sizeFrac) of the larger). Grouped transitively; the entry from the most
// source lists (then the larger, then the lower id) stands for the group. `split` (a Set of entry ids) keeps those
// entries apart, as the engineer asked.
export function mergeDuplicates(list, { mergeKm = 1, sizeFrac = 0.25, split = new Set() } = {}) {
  const n = list.length;
  const parent = list.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = list[i], b = list[j];
    if (split.has(a.id) || split.has(b.id) || a.type !== b.type) continue;
    if (Math.min(a.mw, b.mw) < (1 - sizeFrac) * Math.max(a.mw, b.mw)) continue;
    if (distanceKm(a.lat, a.lon, b.lat, b.lon) > mergeKm) continue;
    parent[find(i)] = find(j);
  }
  const groups = new Map();
  list.forEach((p, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(p); });
  const rank = (p) => [-(p.sources || []).length, -p.mw, p.id];
  const cmp = (x, y) => { const a = rank(x), b = rank(y); for (let k = 0; k < 3; k++) if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1; return 0; };
  return [...groups.values()].map((g) => {
    const s = g.slice().sort(cmp);
    return { ...s[0], mergedFrom: s.slice(1).map((p) => ({ id: p.id, name: p.name, mw: p.mw, dateIn: p.dateIn, dateOut: p.dateOut, km: p.km })) };
  }).sort((a, b) => a.km - b.km || (a.id < b.id ? -1 : 1));
}

// Option values for a plant: power leased, power bought, grid connection taken over (C2, C4, C21).
export const plantValue = { lease: (id) => `xl:${id}`, buy: (id) => `xb:${id}`, takeover: (id) => `tk:${id}` };
// The manual plant of work package 12 keeps its value "existing" for the lease (study files from before stay valid).
export function parsePlantValue(val) {
  if (val === 'existing') return { id: 'manual', mode: 'lease' };
  const m = /^(xl|xb|tk):(.+)$/.exec(String(val || ''));
  return m ? { id: m[2], mode: m[1] === 'xl' ? 'lease' : m[1] === 'xb' ? 'buy' : 'takeover' } : null;
}
export const isPlantPower = (val) => { const p = parsePlantValue(val); return !!p && p.mode !== 'takeover'; };
export const isTakeover = (val) => { const p = parsePlantValue(val); return !!p && p.mode === 'takeover'; };
