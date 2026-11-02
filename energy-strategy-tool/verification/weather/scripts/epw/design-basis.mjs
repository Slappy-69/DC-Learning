// R1 (Opus review, 2026-10-31): what the 0.4 % design basis does to the design load, against the file's hottest hour
// and the ASHRAE n=20-year extreme in the same file. Run from energy-strategy-tool/app:
//   node ../verification/weather/scripts/epw/design-basis.mjs /tmp/epwdl/files/NLD_Amsterdam062400_IWEC.epw
import fs from 'node:fs';
import { readEpw } from '../../../../app/src/engine/weather.js';
import { referenceT1 } from '../../../../app/src/engine/defaults.js';
import { buildContext } from '../../../../app/src/engine/context.js';

const text = fs.readFileSync(process.argv[2], 'utf8');
const w = readEpw(text, 'ams.epw').weather;
const dc = text.split(/\r?\n/)[1].split(','); const x = dc.indexOf('Extremes');
const n20 = Number(dc[x + 14]);
const tMax = Math.max(...w.dryBulb), twMax = Math.max(...w.wetBulb);
const cases = [
  ['0.4 % (as built)', w.designDB, w.designWB],
  ['hottest hour of the file', tMax, twMax],
  [`ASHRAE n=20 extreme DB (${n20}) / extreme max WB (${Number(dc[x + 4])})`, n20, Number(dc[x + 4])],
];
for (const [label, db, wb] of cases) {
  const inp = referenceT1();
  inp.project.lat = w.lat; inp.project.lon = w.lon;
  inp.weather = { ...w, designDB: db, designWB: wb };
  const ctx = buildContext(inp);
  const out = Object.entries(ctx.cooling).map(([id, c]) => `${id} peak PUE ${(1 + c.coolPeak + c.lossFrac).toFixed(3)}`).join(', ');
  // Hours in which the hourly cooling exceeds the design (peak) cooling.
  const over = Object.entries(ctx.cooling).map(([id, c]) => `${id} ${c.coolFrac.filter((v) => v > c.coolPeak + 1e-12).length} h`).join(', ');
  console.log(`${label}: design ${db}/${wb} °C → ${out}\n   hours with hourly cooling above the design cooling: ${over}`);
}
