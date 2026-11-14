// Audit, part 3: order around #9 to #40, the leader's opex years, the SMR's dispatched years, SMR defaults.
import { E, runT1 } from './lib.mjs';
import { TECH } from '../app/src/engine/defaults.js';
const { run, inputs } = runT1();
const ranked = [...run.options].sort((a, b) => a.rank - b.rank);
for (const o of ranked.slice(8, 40)) console.log('R', o.rank, o.score.toFixed(3), (o.orderScore ?? 0).toFixed(3), o.groupRank, o.eco.lcoe.toFixed(3), o.carbon.locationG.toFixed(2), o.deliv.score, o.sizing.energise.avgLate, o.sizing.bridgeDropped ? 'DROPPED' : '', '|', o.name.slice(0, 70));
const L = ranked[0];
console.log('leader opex by year (EUR m):', L.eco.ledger.map((r, y) => `${y}:${(r.opex / 1e6).toFixed(1)}`).join(' '));
console.log('opexYear1', L.eco.opexYear1 / 1e6, 'index', L.eco.opexYear1Index, 'opexSteady', L.eco.opexSteady / 1e6, 'GBP', L.eco.opexSteady * 0.8377 / 1e6, 'last year GBP', L.eco.ledger[19].opex * 0.8377 / 1e6);
const S = run.options.find((o) => o.id === 'O1J82PZ7');
console.log('SMR dispatched years', S.dispatch.years.length, 'last year firm MWh', S.dispatch.years[S.dispatch.years.length - 1].firmMWh, 'year index 6 firm', S.dispatch.years[6] && S.dispatch.years[6].firmMWh);
console.log('SMR tech', JSON.stringify(TECH.smr.p), 'ownConsent', TECH.smr.ownConsent);
console.log('gasRecip', JSON.stringify(TECH.gasRecip.p));
console.log('backupHvo', JSON.stringify(TECH.backupHvo.p));
console.log('substation', JSON.stringify(TECH.substation.p));
console.log('PPA', JSON.stringify(E.PPA || null));
const I = run.options.find((o) => o.id === 'O16HAJCQ');
console.log('island adequacy', JSON.stringify(I.adequacy).slice(0, 300));
console.log('island resilience', JSON.stringify(I.resilience).slice(0, 600));
