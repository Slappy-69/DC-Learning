// Which grid lines does the T1 leader pay, and what would the driver scale? (Q3 evidence, H6 LOW-8)
const APP = new URL('../../../app/src/engine/', import.meta.url).href.replace(/\/$/, '');
const { referenceT1 } = await import(`${APP}/defaults.js`);
const { runModel } = await import(`${APP}/run.js`);
const run = runModel(referenceT1());
const L = run.options.slice().sort((a, b) => a.rank - b.rank)[0];
const lines = (L.eco && L.eco.capexLines) || [];
console.log('leader', L.id, 'keys', Object.keys(L).slice(0, 40).join(','));
console.log('capex lines found:', lines.length);
let tot = 0, sub = 0, conn = 0, route = 0;
for (const l of lines) { tot += l.amount; if (/^Substation/.test(l.item)) sub += l.amount; if (/^Grid connection charge/.test(l.item)) conn += l.amount; if (/^Grid cable route/.test(l.item)) route += l.amount; }
console.log({ totalEUR: Math.round(tot), substation: Math.round(sub), connectionCharge: Math.round(conn), cableRoute: Math.round(route), shareOfTotal: { substation: (sub / tot).toFixed(3), driverScales: ((conn + route) / tot).toFixed(3) } });
