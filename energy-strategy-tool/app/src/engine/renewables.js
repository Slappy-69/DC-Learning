// Renewable plants near the site (work package 30; owner 2026-11-07, OPEN-QUESTIONS 194–196, 219–221): wind, solar and
// hydro plants from the bundled powerplantmatching list (German turbines grouped into farms), within the distance and
// above the size the engineer enters; neither has a default, so none is listed until both are entered (196).
// Imported by the screens only (not by the run), so the run's worker does not carry the list.
import { RENEWABLE_PLANTS } from '../data/renewable-plants.js';

export const RENEWABLE_SOURCE = { credit: RENEWABLE_PLANTS.credit, url: RENEWABLE_PLANTS.url, builtAt: RENEWABLE_PLANTS.builtAt, count: RENEWABLE_PLANTS.count, minMW: RENEWABLE_PLANTS.minMW, farmKm: RENEWABLE_PLANTS.farmKm, filter: RENEWABLE_PLANTS.filter };
export const RENEWABLE_TYPE = { wind: 'Wind onshore', windOff: 'Wind offshore', solar: 'Solar', hydroRor: 'Hydro (run of river)', hydroRes: 'Hydro (reservoir)' };
const km = (lat1, lon1, lat2, lon2) => {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
export function nearbyRenewables(lat, lon, minMW, radiusKm) {
  if (!(Number(minMW) >= 0) || !(Number(radiusKm) > 0) || minMW === null || radiusKm === null) return null;
  const dLat = radiusKm / 111, dLon = radiusKm / (111 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  const out = [];
  for (const r of RENEWABLE_PLANTS.rows) {
    const [id, name, cc, ty, mw, la, lo, dateIn, turbines] = r;
    if (mw < minMW || Math.abs(la - lat) > dLat || Math.abs(lo - lon) > dLon) continue;
    const d = km(lat, lon, la, lo);
    if (d <= radiusKm) out.push({ id, name, cc, type: ty, typeLabel: RENEWABLE_TYPE[ty] || ty, mw, lat: la, lon: lo, dateIn, turbines, km: d });
  }
  return out.sort((a, b) => a.km - b.km);
}
