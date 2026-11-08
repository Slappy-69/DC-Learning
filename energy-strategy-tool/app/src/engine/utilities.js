// Utilities near the site (work package 32; owner 2026-11-07, OPEN-QUESTIONS 200, 222–225, 234–235): seven utilities in
// the agreed order, each a warning only. The nearest mapped feature and its straight-line distance are shown, flagged
// "mapped, straight line"; planned features are marked "planned" with their year. No mapped distance changes a cost.
import { UTILITY_DATA } from '../data/utilities/index.js';

export const UTILITIES = [
  { id: 'electricity', label: 'Electricity, 220 kV and above', none: 'no open electricity network data bundled in this release (PyPSA-Eur\'s OpenStreetMap network, ODbL, to be bundled at release)' },
  { id: 'gas', label: 'Gas transmission', none: 'no open gas network data bundled in this release (SciGRID_gas, to be bundled at release)' },
  { id: 'water', label: 'Water and cooling-water sources', none: 'no open water data bundled in this release (EEA and Copernicus, to be bundled at release)' },
  { id: 'districtHeating', label: 'District heating', none: 'no open district heating data bundled (OpenStreetMap points wait for the release script, OPEN-QUESTIONS 225)' },
  { id: 'telecoms', label: 'Telecoms (fibre routes, internet exchanges, cable landings)', none: 'no open fibre route data found (further research list, item 2)' },
  { id: 'districtCooling', label: 'District cooling', none: 'district cooling data not researched yet (further research list, item 3)' },
  { id: 'hydrogen', label: 'Hydrogen pipelines', none: 'no open hydrogen pipeline data bundled (the Hydrogen Infrastructure Map states no licence; further research list, item 5)' },
];

const km = (lat1, lon1, lat2, lon2) => {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// The nearest feature of each utility: built and planned separately, so a planned pipeline nearer than a built one is
// shown as well (OPEN-QUESTIONS 235). data: an object like UTILITY_DATA (tests pass their own).
export function utilitiesNear(lat, lon, data = UTILITY_DATA) {
  return UTILITIES.map((u) => {
    const d = data[u.id];
    if (!d || !Array.isArray(d.features) || !d.features.length) return { ...u, bundled: false };
    let built = null, planned = null;
    for (const f of d.features) {
      const [la, lo, name, size, status, year] = f;
      const dist = km(lat, lon, la, lo);
      const rec = { km: dist, name, size, status: status || 'built', year: year || null };
      if (rec.status === 'planned') { if (!planned || dist < planned.km) planned = rec; } else if (!built || dist < built.km) built = rec;
    }
    return { ...u, bundled: true, built, planned, credit: d.credit, licence: d.licence, date: d.date };
  });
}

export function utilityLine(u) {
  if (!u.bundled) return `${u.label}: ${u.none}`;
  const one = (r) => `${r.km.toFixed(1)} km${r.name ? ` (${r.name}${r.size ? `, ${r.size}` : ''})` : ''}${r.status === 'planned' ? `, planned${r.year ? ` for ${r.year}` : ''}` : ''}`;
  const parts = [];
  if (u.built) parts.push(`nearest ${one(u.built)}`);
  if (u.planned && (!u.built || u.planned.km < u.built.km)) parts.push(`nearest planned ${one(u.planned)}`);
  return `${u.label}: ${parts.join('; ') || 'none in the data'}, mapped, straight line (${u.credit}${u.licence ? `, ${u.licence}` : ''}${u.date ? `, ${u.date}` : ''})`;
}

export function utilitiesText(lat, lon, data = UTILITY_DATA) {
  return utilitiesNear(lat, lon, data).map(utilityLine).join('. ');
}
