// Bundled NOAA station years (owner 2026-10-31, OPEN-QUESTIONS 114: the Windows program only). The program carries
// weather-stations.json.gz next to the page (packaging/desktop/stage.mjs); the page loads it at start-up
// (App.jsx) and, unless an EPW file is uploaded, uses the station nearest the pin. The single-file and phone pages have
// no bundle and keep the EPW upload. Records come from weather-data/build-stations.mjs (method: weathertmy.js).

import { distanceKm, HOURS } from './weather.js';

let STATIONS = null;

export const stationsLoaded = () => !!(STATIONS && STATIONS.length);
// The Windows program found no station file (or could not read it): the panel says so (R3 M5).
let MISSING = false;
export const setStationsMissing = () => { MISSING = true; };
export const stationsMissing = () => MISSING;
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

// A station record → the inputs.weather object (the same shape as an uploaded EPW file). auto: chosen by the program,
// so it is flagged as an assumed default. Records from builds before 2026-10-31 carry only the 0.4 % design values:
// they are used as a fallback and labelled as such.
export function stationWeather(rec) {
  const dryBulb = unpack(rec.db), wetBulb = unpack(rec.wb);
  if (dryBulb.length !== HOURS || wetBulb.length !== HOURS) return null;
  const name = `${rec.name || rec.id}${rec.icao ? ` (${rec.icao})` : ''}`;
  const d = rec.design || null;
  const design = d && Number.isFinite(d.db20)
    ? { db: d.db20, wb: d.wb20, db50: d.db50, wb50: d.wb50, kind: d.kind || 'extreme',
      basis: d.kind === 'max-observed'
        ? `the station's highest readings, ${d.years || rec.years} (too few complete years for return-period values)`
        : `the station's own readings: n = 20 and n = 50-year return-period maxima (Gumbel fit to ${d.nYears} annual maxima, as ASHRAE does), ${d.years || rec.years}` }
    : { db: rec.designDB, wb: rec.designWB, db50: null, wb50: null, kind: 'p04', basis: `the station's 0.4 % values, ${rec.years} (an older station file without n-year extremes)` };
  return {
    source: 'station', auto: true, id: rec.id, name, country: rec.cc || null, file: null, lat: rec.lat, lon: rec.lon,
    elevationM: Number.isFinite(rec.elev) ? rec.elev : null,
    years: `typical year from ${rec.years}`, dataSource: 'NOAA NCEI GHCNh', dryBulb, wetBulb,
    designDB: design.db, designWB: design.wb, designDB50: Number.isFinite(design.db50) ? design.db50 : null, designWB50: Number.isFinite(design.wb50) ? design.wb50 : null,
    designKind: design.kind, designBasis: design.basis,
    design04DB: d && Number.isFinite(d.db04) ? d.db04 : (d ? null : rec.designDB), design04WB: d && Number.isFinite(d.wb04) ? d.wb04 : (d ? null : rec.designWB),
    readingIntervalH: Number.isFinite(rec.intervalH) ? rec.intervalH : null, humidityAssumedHours: 0, notes: [],
  };
}
