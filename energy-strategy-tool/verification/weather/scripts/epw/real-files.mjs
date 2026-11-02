// R1 (Opus review, 2026-10-31): readEpw on real EPW files, with an independent field-by-field reader for comparison.
// Run from energy-strategy-tool/app:  node ../verification/weather/scripts/epw/real-files.mjs /tmp/epwdl/files
// The files are read as text only (untrusted data). Not kept in the repository.
import fs from 'node:fs';
import path from 'node:path';
import { readEpw, exceeded, wetBulb, humidityRatio, pressureAtElevation } from '../../../../app/src/engine/weather.js';

const dir = process.argv[2] || '/tmp/epwdl/files';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.epw')).sort();

// Independent reader: EnergyPlus Auxiliary Programs, "Weather Converter", EPW data dictionary: fields
// N1 year, N2 month, N3 day, N4 hour (1–24), N5 minute, A1 source flags, N6 dry bulb (missing 99.9), N7 dew point (99.9),
// N8 RH (999), N9 pressure (999999). DESIGN CONDITIONS (ASHRAE 2009 layout): after "Cooling": hottest month, DB range,
// 0.4 % DB, MCWB, 1 % DB, MCWB, 2 % DB, MCWB, 0.4 % WB, MCDB, ...; "Extremes": WS 1/2.5/5 %, max WB, mean annual min/max
// DB, SD min/max, n=5 min/max, n=10, n=20, n=50.
function mine(text) {
  const lines = text.split(/\r?\n/);
  const rows = lines.slice(8).filter((l) => l.trim()).map((l) => l.split(','));
  const dc = (lines[1] || '').split(',');
  const c = dc.indexOf('Cooling'), x = dc.indexOf('Extremes');
  return {
    n: rows.length,
    first: rows[0].slice(0, 4).join('-'),
    db: rows.map((r) => Number(r[6])), dp: rows.map((r) => Number(r[7])), rh: rows.map((r) => Number(r[8])), p: rows.map((r) => Number(r[9])),
    dcDB: c > 0 ? Number(dc[c + 3]) : null, dcMCWB: c > 0 ? Number(dc[c + 4]) : null, dcWB: c > 0 ? Number(dc[c + 9]) : null, dcMCDB: c > 0 ? Number(dc[c + 10]) : null,
    ext20: x > 0 ? Number(dc[x + 14]) : null, extWBmax: x > 0 ? Number(dc[x + 4]) : null, extMeanMax: x > 0 ? Number(dc[x + 6]) : null,
    tz: (lines[0].split(','))[8], elev: Number(lines[0].split(',')[9]),
  };
}

for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const r = readEpw(text, f);
  const m = mine(text);
  if (!r.ok) { console.log(`${f}: REFUSED: ${r.error}`); continue; }
  const w = r.weather;
  // Hour mapping: row k of the file (Jan 1 hour 1 first, no leap day in these files) must be engine hour k.
  let dbMis = 0; for (let k = 0; k < 8760; k++) if (Math.abs(w.dryBulb[k] - Math.round(m.db[k] * 10) / 10) > 1e-9) dbMis++;
  // Wet bulb recomputed here from the file's own fields (dew point, file pressure) and compared.
  let wbMax = 0; for (let k = 0; k < 8760; k++) { const p = m.p[k] < 999999 ? m.p[k] : pressureAtElevation(m.elev); const t = m.db[k]; const wb = wetBulb(t, humidityRatio(t, m.dp[k], null, p), p); wbMax = Math.max(wbMax, Math.abs(Math.round(wb * 10) / 10 - w.wetBulb[k])); }
  const above = w.dryBulb.filter((x) => x > w.designDB).length, aboveWB = w.wetBulb.filter((x) => x > w.designWB).length;
  const own = [exceeded(w.dryBulb), exceeded(w.wetBulb)].map((x) => Math.round(x * 10) / 10);
  const mx = Math.max(...w.dryBulb), mxw = Math.max(...w.wetBulb);
  console.log(`${f}\n  name "${w.name}", ${w.country}, lat ${w.lat} lon ${w.lon}, elev ${w.elevationM} m, tz ${m.tz}; years ${w.years}; rows ${m.n}; warnings: ${r.warnings.join(' | ') || 'none'}\n  hour map: ${dbMis} dry-bulb hours differ from the file row in the same position; wet bulb vs recompute max diff ${wbMax.toFixed(2)} K\n  design used ${w.designDB}/${w.designWB} °C from "${w.designBasis}"\n  independent reader: 0.4 % DB ${m.dcDB} (MCWB ${m.dcMCWB}), 0.4 % WB ${m.dcWB} (MCDB ${m.dcMCDB}); extremes: max WB ${m.extWBmax}, mean annual max DB ${m.extMeanMax}, n=20 max DB ${m.ext20}\n  file hours: 0.4 % ${own[0]}/${own[1]} °C; max ${mx}/${mxw} °C; hours above design DB ${above}, above design WB ${aboveWB}`);
}
