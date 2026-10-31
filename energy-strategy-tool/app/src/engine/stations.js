// Bundled NOAA station years (owner 2026-10-31, OPEN-QUESTIONS 114: the Windows program only). The program carries
// weather-stations.json.gz next to the page (packaging/desktop/stage.mjs); the page loads it at start-up
// (App.jsx) and, unless an EPW file is uploaded, uses the station nearest the pin. The single-file and phone pages have
// no bundle and keep the EPW upload. Records come from weather-data/build-stations.mjs (method: weathertmy.js).

import { distanceKm, HOURS } from './weather.js';

let STATIONS = null;

export const stationsLoaded = () => !!(STATIONS && STATIONS.length);
export const stationCount = () => (STATIONS ? STATIONS.length : 0);

// Accepts the merged bundle ({ stations: [...] }) or a plain list; keeps only complete records.
export function setStations(bundle) {
  const list = Array.isArray(bundle) ? bundle : bundle && Array.isArray(bundle.stations) ? bundle.stations : [];
  STATIONS = list.filter((s) => s && s.id && Number.isFinite(s.lat) && Number.isFinite(s.lon) && typeof s.db === 'string' && typeof s.wb === 'string');
  return STATIONS.length;
}

export function nearestStations(lat, lon, n = 1) {
  if (!STATIONS || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  return STATIONS.map((s) => ({ s, km: distanceKm(lat, lon, s.lat, s.lon) })).sort((a, b) => a.km - b.km).slice(0, n);
}

function unpack(b64) {
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const v = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
  return Array.from(v, (x) => x / 10);
}

// A station record → the inputs.weather object (the same shape as an uploaded EPW file).
export function stationWeather(rec) {
  const dryBulb = unpack(rec.db), wetBulb = unpack(rec.wb);
  if (dryBulb.length !== HOURS || wetBulb.length !== HOURS) return null;
  const name = `${rec.name || rec.id}${rec.icao ? ` (${rec.icao})` : ''}`;
  return {
    source: 'station', id: rec.id, name, country: rec.cc || null, file: null, lat: rec.lat, lon: rec.lon,
    elevationM: Number.isFinite(rec.elev) ? rec.elev : null,
    years: `typical year from ${rec.years}`, dataSource: 'NOAA NCEI GHCNh', dryBulb, wetBulb,
    designDB: rec.designDB, designWB: rec.designWB,
    designBasis: `the station's own readings, ${rec.years} (0.4 % dry bulb and 0.4 % wet bulb of every usable year)`,
    notes: [],
  };
}
