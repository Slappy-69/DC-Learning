// i6: representative-day screening with a measured year: which days are picked (is the hottest day of the measured
// year among them, for dry and wet bulb?) and does the screening leader agree with the full-year leader?
import { referenceT1, getProfiles, resolveCountry, runModel, buildContext, normalizeInputs, representativeHours, H } from '../../../../app/src/engine/index.js';
const base = referenceT1({ analysisStart: '2027-01' });
const prof = getProfiles(resolveCountry(base), base.project.seed, base.project.lat);
// A measured-like year: the synthetic year shifted 2.5 °C with a 3-day heat wave in late July (day 205-207) peaking +9 °C
// in dry bulb and a humid spell on days 225-226 (wet bulb highest of the year, dry bulb ordinary).
const db = Array.from(prof.temp, (x, h) => { const d = Math.floor(h / 24); return Math.round((x + 2.5 + (d >= 205 && d <= 207 ? 9 * Math.sin(Math.PI * ((h % 24) / 24)) : 0)) * 10) / 10; });
const wb = Array.from(prof.wetbulb, (x, h) => { const d = Math.floor(h / 24); return Math.round((x + 2 + (d >= 225 && d <= 226 ? 6 : 0)) * 10) / 10; });
for (let h = 0; h < H; h++) if (wb[h] > db[h]) wb[h] = db[h];
const w = { source: 'station', id: 'T', name: 'T', lat: base.project.lat, lon: base.project.lon, years: 'x', dryBulb: db, wetBulb: wb, designDB: 30, designWB: 21, designBasis: "the station's own readings", notes: [] };
const inp = { ...base, weather: w };
const ctx = buildContext(normalizeInputs(inp), { site: { noSiteModel: true } });
const rep = representativeHours(ctx);
const days = rep.days.map((d) => d.day);
const argmaxDay = (a) => { let b = 0; for (let h = 1; h < H; h++) if (a[h] > a[b]) b = h; return Math.floor(b / 24); };
console.log(`${days.length} representative days; hottest dry-bulb day ${argmaxDay(db)} picked: ${days.includes(argmaxDay(db))}; highest wet-bulb day ${argmaxDay(wb)} picked: ${days.includes(argmaxDay(wb))}`);
const full = runModel(inp);
const scr = runModel({ ...inp, settings: { ...inp.settings, screeningModel: 'repDays' } });
const top = (r) => r.options.slice().sort((a, b) => a.rank - b.rank).slice(0, 10).map((o) => o.id);
const tf = top(full), ts = top(scr);
console.log(`full-year leader ${tf[0]}; screening leader ${ts[0]} (verification ${scr.verification ? JSON.stringify({ verified: scr.verification.verified }) : 'none in runModel'}); top-10 overlap ${tf.filter((x) => ts.includes(x)).length}/10`);
const evapF = full.options.filter((o) => o.v.C3 === 'evap' || /Evaporative/.test(o.name));
const dd = (r) => r.options.filter((o) => /Evaporative/.test(o.name)).filter((o) => o.adequacy && !o.adequacy.adequate).length;
console.log(`evaporative options not adequate: full ${dd(full)}, screening ${dd(scr)}`);
