// Long walkthrough: Pego, 750 MW IT, 300 MW grid import for life. Writes shots4/*.jpg and shots4/meta.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { open, ran, fill, sel, fillIn, closeRunDetails } from './lib.mjs';
const OUT = 'shots4';
mkdirSync(OUT, { recursive: true });
const { browser, ctx, page, errors } = await open({ width: 1600, height: 900, dsf: 3 });
const meta = {};
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(0)} s]`, ...a);
const save = () => writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
const unscroll = () => page.evaluate(() => { document.querySelectorAll('*').forEach((e) => { if (e.scrollLeft) e.scrollLeft = 0; }); window.scrollTo(0, window.scrollY); });
async function boxes(spec) {
  const out = {};
  for (const [k, loc] of Object.entries(spec)) { try { const b = await loc.first().boundingBox({ timeout: 2000 }); if (b) out[k] = [b.x, b.y, b.width, b.height].map((v) => Math.round(v)); } catch { /* skip */ } }
  return out;
}
async function cap(name, spec = {}, extra = {}) {
  await unscroll();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 92 });
  meta[name] = { boxes: await boxes(spec), ...extra }; save();
  log('shot', name, JSON.stringify(meta[name].boxes));
}
async function mapShot(name) { await page.waitForTimeout(250); await page.locator('#map-picker').screenshot({ path: `${OUT}/${name}.png` }); log('map', name); }
const header = () => page.locator('.hs-item').first().locator('..');
const hsItem = (i) => page.locator('.hs-item').nth(i);
const status = () => page.locator('.status');
const panelTop = () => page.evaluate(() => { const p = document.querySelector('#inputs-panel'); if (p) p.scrollTop = 0; });
const toTop = () => page.evaluate(() => window.scrollTo(0, 0));
const scrollTo = async (loc, block = 'start') => { await loc.first().evaluate((e, b) => e.scrollIntoView({ block: b }), block); await unscroll(); };
const field = (label) => page.locator('.field', { has: page.getByLabel(label) }).first();
const txt = async (loc) => (await loc.first().innerText()).replace(/\s+/g, ' ');

await ran(page);
await page.getByRole('button', { name: 'Reset to defaults' }).click();
await page.waitForTimeout(400); await ran(page); await closeRunDetails(page);
await cap('a01-reset', { firstrun: page.locator('.first-run'), reset: page.getByRole('button', { name: 'Reset to defaults' }), gs: page.getByRole('button', { name: 'General settings' }), save: page.locator('#open-study') });

// General settings: the Site tab (Beta)
await page.getByRole('button', { name: 'General settings' }).click();
await page.waitForTimeout(300);
await page.locator('#gs-site-beta').check();
await cap('a02-gs', { panel: page.locator('#general-settings'), beta: page.locator('#gs-site-beta').locator('..') });
await page.getByRole('button', { name: 'Close settings' }).click();

// Location and report details
await fill(page, /^Project name/, 'Pego campus, 750 MW IT, 300 MW grid');
await fill(page, /^Latitude/, '39.4636');
await fill(page, /^Longitude/, '-8.108');
await page.locator('summary', { hasText: 'Report details (PDF only)' }).click();
await fill(page, /^Question the report answers/, 'How do we power 750 MW of IT at Pego with only 300 MW of grid?');
await fill(page, /^Prepared for/, 'Pego campus client (demo)');
await fill(page, /^Prepared by/, 'Energy strategy team');
await scrollTo(page.locator('summary', { hasText: 'Report details (PDF only)' }), 'start');
await cap('a03-report-details', { details: page.locator('details', { has: page.locator('summary', { hasText: 'Report details (PDF only)' }) }).last() });
await scrollTo(page.locator('.map-picker'), 'center');
await cap('a04-map', { map: page.locator('.map-picker'), country: page.getByLabel(/^Country profile/), lat: field(/^Latitude/), lon: field(/^Longitude/), currency: page.getByLabel(/^Currency shown/) });

// First run inputs
await fill(page, /^IT load, full build/, '750');
await fill(page, /^PUE, annual/, '1.25');
await fill(page, /^Maximum PUE, design day/, '1.45');
await fill(page, /^Grid date, full connection/, '2029-01');
await fill(page, /^Grid capacity, full connection/, '300');
await panelTop();
const FR = page.locator('.first-run');
await cap('a05-firstrun', { firstrun: FR, it: FR.locator('.field', { hasText: 'IT load, full build' }), pue: FR.locator('.field', { hasText: 'PUE, annual' }), maxpue: FR.locator('.field', { hasText: 'Maximum PUE, design day' }), griddate: FR.locator('.field', { hasText: 'Grid date' }), gridcap: FR.locator('.field', { hasText: 'Grid capacity' }) });
const help = FR.locator('.field', { hasText: 'Maximum PUE, design day' }).locator('.help-btn').first();
await help.click(); await page.waitForTimeout(300);
await cap('a06-help', { panel: page.locator('.help-panel').first(), btn: help });
await help.click();

// Site, grid now, phasing, load
await fill(page, /^Site area/, '90');
await scrollTo(field(/^Site area/), 'start');
await cap('a07-site-inputs', { area: field(/^Site area/), aspect: field(/^Aspect ratio/), setback: field(/^Boundary setback/), height: field(/^Height limit/) });
await fill(page, /^Grid import now/, '300');
const add = page.getByRole('button', { name: 'Add phase' });
for (let i = 0; i < 5; i++) await add.click();
for (let i = 0; i < 6; i++) {
  const it = page.getByLabel(`Phase ${i + 1} IT MW`); await it.fill('125'); await it.press('Tab');
  const d = page.getByLabel(`Phase ${i + 1} date`); await d.fill(`${2029 + i}-01`); await d.press('Tab');
}
await sel(page, /^Workload type/, 'ai-training');
await sel(page, /^Load shape/, 'aiTraining');
await fill(page, /^White-space density/, '3');
await scrollTo(page.locator('fieldset.phases'), 'start');
await cap('a08-phases', { phases: page.locator('fieldset.phases'), ramp: field(/^Ramp: share at energisation/), rampm: field(/^Ramp duration/) });
await scrollTo(field(/^Workload type/), 'start');
await cap('a09-load', { workload: field(/^Workload type/), shape: field(/^Load shape/), util: field(/^Average utilisation \(AI training\)/), dip: field(/^Checkpoint dip to/), every: field(/^Dip every/), len: field(/^Dip length/) });
await scrollTo(field(/^Annual PUE/), 'start');
await cap('a10-pue-density', { pue: field(/^Annual PUE/), maxpue: field(/^Maximum PUE \(design day\)/), density: field(/^White-space density/), wue: field(/^Water use/) });
await scrollTo(field(/^Grid import now/), 'center');
await cap('a11-grid', { now: field(/^Grid import now/), full: field(/^Grid import at full connection/), date: field(/^Full-connection date/) });
await scrollTo(page.locator('details.section', { has: page.locator('summary', { hasText: '5 · Economics' }) }), 'start');
await cap('a12-economics', { wacc: field(/^WACC/), period: field(/^Scoring evaluation period/), carbon: field(/^Carbon price/), contingency: field(/^Contingency/) });
await scrollTo(page.locator('details.section', { has: page.locator('summary', { hasText: '6 · Requirements' }) }), 'start');
await cap('a13-requirements', { backed: field(/^Backed critical load/), topo: field(/^Backup topology/), autonomy: field(/^On-site autonomy/), island: field(/^Islanding required/), carbon: field(/^Carbon target/), capex: field(/^Capex ceiling/) });
const ticks = page.getByText('Rented temporary generation', { exact: true }).locator('xpath=ancestor::fieldset[1]');
await scrollTo(ticks, 'start');
await cap('a14-ticks', { ticks, choices: page.locator('summary', { hasText: '7 · Choices' }) });
await page.evaluate(() => { const t = [...document.querySelectorAll('legend, h4, strong, span')].find((e) => /^C1/.test(e.textContent.trim()) && /Grid strategy/.test(e.textContent)); if (t) t.scrollIntoView({ block: 'start' }); });
await unscroll();
await cap('a15-choices', { c1: page.getByRole('button', { name: 'Bridge until grid' }), islanded: page.getByRole('button', { name: 'Islanded' }) });

// The run, with its progress panel open
await page.waitForTimeout(300);
await toTop();
await page.evaluate(() => { const d = document.querySelector('details.run-progress'); if (d) d.open = true; });
try {
  await page.waitForFunction(() => /Screening options/.test((document.querySelector('.status') || {}).textContent || ''), null, { timeout: 15000, polling: 100 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { const d = document.querySelector('details.run-progress'); if (d) d.open = true; });
  await cap('a16-progress', { progress: page.locator('details.run-progress'), status: status() });
} catch (e) { log('no live progress', e.message.split('\n')[0]); }
await ran(page);
log(await status().innerText());
await page.evaluate(() => { const d = document.querySelector('details.run-summary'); if (d) d.open = true; const p = document.querySelector('details.run-progress'); if (p) p.open = false; });
await scrollTo(page.locator('details.run-summary'), 'start');
await cap('a17-summary-rules', { summary: page.locator('details.run-summary') });
await closeRunDetails(page);
await toTop();
await cap('a18-results1', { header: header(), options: hsItem(0), leader: hsItem(1), adequacy: hsItem(2), status: status() }, { status: await status().innerText(), leader: await txt(hsItem(1)), options: await txt(hsItem(0)) });

// Nearby plants
await page.locator('.nearby-plants > summary').click();
await fill(page, /^Smallest plant/, '5');
await fill(page, /^Within/, '25');
await page.waitForTimeout(300);
await scrollTo(page.locator('.nearby-plants'), 'start');
await cap('b01-nearby', { box: page.locator('.nearby-plants'), gas: page.locator('#nearby-plant-select'), renew: page.getByText('Renewable plants near the site'), utilities: page.getByText('Utilities near the site') });
await page.getByRole('button', { name: 'Add Margalha Solar Farm to the analysis' }).click();
await page.waitForTimeout(300);
const val = await page.locator('#nearby-plant-select option', { hasText: 'Elecgas Pego' }).getAttribute('value');
await page.locator('#nearby-plant-select').selectOption(val);
await scrollTo(page.locator('.nearby-plants'), 'start');
await cap('b02-pick', { box: page.locator('.nearby-plants'), gas: page.locator('#nearby-plant-select'), addrun: page.getByRole('button', { name: 'Add and run again' }), margalha: page.locator('.nearby-plants li', { hasText: 'Margalha' }) });
await page.getByRole('button', { name: 'Add and run again' }).click();
await page.waitForTimeout(500); await ran(page);

const eg = page.locator('details.plant-edit', { hasText: 'Correct Elecgas Pego' });
await eg.evaluate((d) => { d.open = true; });
const plantsTable = page.locator('.plants-field').first();
await scrollTo(plantsTable, 'start');
await cap('b03-plant-table', { table: plantsTable.locator('table').first(), units: eg.getByLabel(/^Units/), eff: eg.getByLabel(/^Efficiency/), buy: eg.getByLabel(/^Purchase price/), lease: eg.getByLabel(/^Lease/), takeover: eg.getByLabel(/^Grid connection to take over/) });
await scrollTo(eg.getByLabel(/^Efficiency/), 'start');
await cap('b04-plant-values', { eff: field(/^Efficiency/), lease: field(/^Lease/), buy: field(/^Purchase price/), refurb: field(/^Refurbishment when bought/), fom: field(/^Fixed O&M when bought/), link: field(/^Connection to the campus/), takeover: field(/^Grid connection to take over/), tcost: field(/^Takeover cost/) });
await sel(eg, /^Contract price set by/, 'costPlus');
await fillIn(eg, /^Margin/, '10');
await fillIn(eg, /^Contract MW/, '400');
const uses = eg.locator('fieldset.subgroup').first();
await scrollTo(uses, 'start');
await cap('b05-plant-uses', { uses, method: eg.getByLabel(/^Contract price set by/), margin: eg.getByLabel(/^Margin/), mw: eg.getByLabel(/^Contract MW/), route: eg.getByLabel(/^Route to the campus/), surplus: eg.getByLabel(/^Surplus kept: bought/), standby: eg.getByLabel(/^Standby income/) });
const ms = page.locator('details.plant-detail', { hasText: 'Margalha Solar Farm: 120 MW' });
await ms.evaluate((d) => { d.open = true; });
await sel(ms, /^Route to the campus/, 'grid');
await fillIn(ms, /^Contract price(?! set by)/, '45');
await scrollTo(page.locator('#renew-plants-field'), 'start');
await cap('b06-margalha', { field: page.locator('#renew-plants-field'), route: ms.getByLabel(/^Route to the campus/), price: ms.getByLabel(/^Contract price(?! set by)/), buy: ms.getByLabel(/^Purchase price/), rent: ms.getByLabel(/^Rent/) });
await page.waitForTimeout(600); await ran(page); await closeRunDetails(page);
await toTop();
log(await status().innerText());
await cap('c01-results2', { header: header(), options: hsItem(0), leader: hsItem(1), adequacy: hsItem(2), status: status() }, { status: await status().innerText(), leader: await txt(hsItem(1)), options: await txt(hsItem(0)), adequacy: await txt(hsItem(2)) });
await page.screenshot({ path: `${OUT}/full-results2.jpg`, type: 'jpeg', quality: 55, fullPage: true, scale: 'css' });
// info flags block
const infos = page.locator('.status').locator('xpath=following-sibling::*');
await scrollTo(page.locator('details.run-summary'), 'start');
await cap('c02-infos', { minor: page.locator('text=Sampling above cap').first() });
await scrollTo(page.locator('.sum-panel'), 'start');
await cap('c03-summary', { panel: page.locator('.sum-panel') }, { text: await txt(page.locator('.sum-panel')) });
await scrollTo(page.locator('.top5'), 'start');
const cards = page.locator('.top5-card');
await cap('c04-top5', { top5: page.locator('.top5'), c1: cards.nth(0), c2: cards.nth(1), c3: cards.nth(2), c4: cards.nth(3), c5: cards.nth(4) });
meta.cards = []; for (let i = 0; i < 5; i++) meta.cards.push(await txt(cards.nth(i))); save();

async function detail(i) {
  await scrollTo(page.locator('.top5'), 'start');
  await cards.nth(i).locator('.tc-name').click();
  await page.waitForTimeout(1200);
  const d = page.locator('section.detail').first();
  await d.waitFor();
  writeFileSync(`${OUT}/detail${i + 1}.txt`, await d.innerText());
  const h = (t) => d.locator('h4', { hasText: t }).first();
  const row = (t) => d.locator('tr', { hasText: t }).first();
  await scrollTo(d, 'start');
  await cap(`d${i + 1}-a`, { title: d.locator('h3'), adequacy: h('Power adequacy'), scores: h('Scores'), economics: h('Economics'), lcoe: row('LCOE'), capex: row('Capex (incl'), deliv: row('Deliverability'), carbon: row('Location-based'), ttp: h('Time-to-power') });
  await scrollTo(h('Sizing'), 'start');
  await cap(`d${i + 1}-b`, { sizing: h('Sizing'), list: h('Sizing').locator('xpath=following-sibling::*[1]') });
  const items = h('Sizing').locator('xpath=following-sibling::*[1]').locator('li');
  const n = await items.count(); const ib = [];
  for (let k = 0; k < n; k++) { const b = await items.nth(k).boundingBox(); ib.push([await items.nth(k).innerText(), b && [b.x, b.y, b.width, b.height].map(Math.round)]); }
  meta[`d${i + 1}-b`].items = ib; save();
  await scrollTo(h('Flags ('), 'start');
  await cap(`d${i + 1}-c`, { flags: h('Flags ('), list: h('Flags (').locator('xpath=following-sibling::*[1]') });
  const fl = h('Flags (').locator('xpath=following-sibling::*[1]').locator('li, .flag-row, p').filter({ hasText: /MAJOR|MINOR|INFO/ });
  const fn = Math.min(await fl.count(), 14); const fb = [];
  for (let k = 0; k < fn; k++) { const b = await fl.nth(k).boundingBox(); fb.push([(await fl.nth(k).innerText()).slice(0, 160), b && [b.x, b.y, b.width, b.height].map(Math.round)]); }
  meta[`d${i + 1}-c`].items = fb; save();
  return d;
}
const d1 = await detail(0);
try {
  await scrollTo(d1.locator('h4', { hasText: 'Flags (' }), 'start');
  await d1.locator('.flag-note-btn').first().click();
  const ed = d1.locator('.flag-note-editor').first();
  await ed.locator('textarea').fill('Grid is the second source. Agree the backup basis with the client before stage 2.');
  await ed.locator('select').selectOption({ index: 1 }).catch(() => {});
  await cap('d1-comment-edit', { editor: ed, flags: d1.locator('h4', { hasText: 'Flags (' }) });
  await ed.getByRole('button', { name: 'Save comment' }).click();
  await page.waitForTimeout(800);
  await scrollTo(d1.locator('h4', { hasText: 'Flags (' }), 'start');
  await cap('d1-comment', { flags: d1.locator('h4', { hasText: 'Flags (' }), first: d1.locator('.flag-note-btn').first() });
} catch (e) { log('comment failed', e.message.split('\n')[0]); }
await detail(1);
await detail(2);

// Weights: presets re-rank without a re-run
const pre = page.getByRole('group', { name: 'Weight presets' });
await scrollTo(page.locator('fieldset.weights'), 'start');
await cap('e01-weights', { weights: page.locator('fieldset.weights'), presets: pre });
let presetUsed = null;
for (const p of ['Lowest cost', 'Lowest carbon', 'Speed to market', 'Lowest risk']) {
  const before = await txt(hsItem(1));
  await pre.getByRole('button', { name: p }).click();
  await page.waitForTimeout(2500);
  const after = await txt(hsItem(1));
  log('preset', p, '→', after.slice(0, 160));
  if (after.split(' ').slice(1, 12).join(' ') !== before.split(' ').slice(1, 12).join(' ')) { presetUsed = p; break; }
}
presetUsed = presetUsed || 'Lowest carbon';
await pre.getByRole('button', { name: presetUsed }).click(); await page.waitForTimeout(2500);
await toTop();
await cap('e02-weights-header', { header: header(), leader: hsItem(1), weights: page.locator('.hs-item', { hasText: 'Weights' }).last(), status: status() }, { preset: presetUsed, status: await status().innerText(), leader: await txt(hsItem(1)) });
await scrollTo(page.locator('fieldset.weights'), 'start');
await cap('e03-weights-panel', { weights: page.locator('fieldset.weights'), presets: pre });
await pre.getByRole('button', { name: 'Balanced' }).click(); await page.waitForTimeout(2500);

// Filters and the options table
await scrollTo(page.getByRole('button', { name: 'Meets', exact: true }), 'start');
await page.getByRole('button', { name: 'Meets', exact: true }).click(); await page.waitForTimeout(1200);
await scrollTo(page.getByRole('button', { name: 'Meets', exact: true }), 'start');
await cap('f01-filter-meets', { filters: page.getByRole('button', { name: 'Meets', exact: true }).locator('xpath=ancestor::*[contains(@class,"filters") or contains(@class,"view-filters")][1]'), meets: page.getByRole('button', { name: 'Meets', exact: true }), table: page.locator('table').filter({ has: page.locator('th', { hasText: 'Option' }) }).first() }, { firstRows: await txt(page.locator('table tbody').first()).then((t) => t.slice(0, 600)) });
await page.locator('input[placeholder="Search names"]').fill('supply contract'); await page.waitForTimeout(1200);
await scrollTo(page.getByRole('button', { name: 'Meets', exact: true }), 'start');
await cap('f02-search', { search: page.locator('input[placeholder="Search names"]'), table: page.locator('table').filter({ has: page.locator('th', { hasText: 'Option' }) }).first() });
await page.locator('input[placeholder="Search names"]').fill(''); await page.waitForTimeout(600);
const chipX = page.locator('.chip-remove, button[aria-label^="Remove filter"]').first();
if (await chipX.count()) await chipX.click(); else await page.getByRole('button', { name: 'Meets', exact: true }).click();
await page.waitForTimeout(1000);
const lcoeHead = page.getByRole('button', { name: /^LCOE/ }).first();
await lcoeHead.click(); await page.waitForTimeout(1000);
await scrollTo(lcoeHead, 'start');
await cap('f03-sort-lcoe', { head: lcoeHead, table: page.locator('table').filter({ has: page.locator('th', { hasText: 'Option' }) }).first() });
await page.getByRole('button', { name: /^Rank/ }).first().click(); await page.waitForTimeout(800);

// Compare
await scrollTo(page.locator('.top5'), 'start');
for (let i = 0; i < 3; i++) { const cb = cards.nth(i).locator('input[type=checkbox]'); if (!(await cb.isChecked())) await cb.check(); }
await page.getByRole('tab', { name: /^Compare/ }).click(); await page.waitForTimeout(800);
await scrollTo(page.locator('section.compare'), 'start');
await cap('g01-compare', { compare: page.locator('section.compare'), table: page.locator('.compare-table') });
writeFileSync(`${OUT}/compare.txt`, await page.locator('section.compare').innerText());
await scrollTo(page.getByText('Choices on which they differ'), 'start');
await cap('g02-compare-choices', { title: page.getByText('Choices on which they differ') });

// Trade-offs
await page.getByRole('tab', { name: /^Trade-offs/ }).click(); await page.waitForTimeout(2000);
await scrollTo(page.locator('#pareto-h'), 'start');
await cap('g03-tradeoffs', { title: page.locator('#pareto-h'), section: page.locator('#pareto-h').locator('xpath=ancestor::section[1]') });
const ysel = page.locator('label.inline-select', { hasText: 'Y axis' }).locator('select');
const capexVal = await ysel.evaluate((s) => { const o = [...s.options].find((x) => /^Capex/.test(x.textContent)); return o ? o.value : null; });
if (capexVal) { await ysel.selectOption(capexVal); await page.waitForTimeout(2000); }
await scrollTo(page.locator('#pareto-h'), 'start');
await cap('g04-tradeoffs-capex', { title: page.locator('#pareto-h'), x: page.locator('label.inline-select', { hasText: 'X axis' }), y: ysel });

// Dispatch
await page.getByRole('tab', { name: /^Dispatch/ }).click();
await page.waitForSelector('#dispatch-chart', { timeout: 300000 }); await page.waitForTimeout(1500);
await scrollTo(page.locator('section.dv'), 'start');
await cap('h01-dispatch', { dv: page.locator('section.dv') });
writeFileSync(`${OUT}/dispatch.txt`, await page.locator('section.dv').innerText());
const yrs = page.getByRole('group', { name: 'Model year' }).getByRole('button');
await yrs.nth(3).click(); await page.waitForTimeout(800);
const wk = page.locator('#dv-week'); await wk.fill('30'); await wk.press('Enter'); await page.waitForTimeout(800);
await scrollTo(page.locator('#dispatch-chart'), 'center');
await cap('h02-dv-y4', { chart: page.locator('#dispatch-chart'), years: page.getByRole('group', { name: 'Model year' }), weeks: page.getByRole('group', { name: 'Week' }) });
await yrs.nth((await yrs.count()) - 1).click(); await page.waitForTimeout(800);
await page.locator('#dv-day').fill('200'); await page.locator('#dv-day').press('Enter');
await page.selectOption('#dv-len', '3'); await page.waitForTimeout(1000);
await scrollTo(page.locator('#dispatch-chart'), 'center');
await cap('h03-dv-3days', { chart: page.locator('#dispatch-chart'), period: page.getByRole('group', { name: 'Any period' }) });
await scrollTo(page.getByText(/^Energy balance, year/), 'start');
await cap('h04-balance', { title: page.getByText(/^Energy balance, year/) });

// Site tab (Beta), option #3 (gas engines on site)
await page.getByRole('tab', { name: 'Site Beta', exact: true }).click();
await page.waitForSelector('#site-plan', { timeout: 120000 });
await page.waitForFunction(() => !document.querySelector('.mult-wait'), null, { timeout: 120000, polling: 300 });
await page.waitForTimeout(1000);
await scrollTo(page.locator('#site-plan'), 'center');
await cap('i01-site1', { plan: page.locator('#site-plan'), fit: page.getByText(/^Site fit/).first() });
const siteSel = page.locator('label.site-pick select').first();
const opt3 = await siteSel.evaluate((s, name) => { const o = [...s.options].find((x) => x.textContent.includes(name)); return o ? o.value : null; }, (meta.cards[2] || '').split(' ').slice(1, 6).join(' '));
if (opt3) { await siteSel.selectOption(opt3); await page.waitForFunction(() => !document.querySelector('.mult-wait'), null, { timeout: 120000, polling: 300 }); await page.waitForTimeout(1500); }
await scrollTo(page.locator('#site-plan'), 'center');
await cap('i02-site3', { plan: page.locator('#site-plan'), fit: page.getByText(/^Site fit/).first(), pick: siteSel }, { option: opt3 });
await page.screenshot({ path: `${OUT}/full-site.jpg`, type: 'jpeg', quality: 55, fullPage: true, scale: 'css' });

// Sensitivity: tornado, break-evens, Monte Carlo
await page.getByRole('tab', { name: /^Sensitivity/ }).click(); await page.waitForTimeout(800);
const sr = page.locator('.sens-run'); await sr.click();
await page.waitForFunction(() => { const b = document.querySelector('.sens-run'); return b && !/Running/.test(b.textContent); }, null, { timeout: 900000, polling: 500 });
await scrollTo(sr, 'start');
await cap('j01-tornado', { run: sr });
await scrollTo(page.getByText(/^Drivers tested/).first(), 'start');
await cap('j00-drivers', { drivers: page.getByText(/^Drivers tested/).first().locator('xpath=ancestor::fieldset[1]') });
const be = page.locator('.be-run'); await be.click();
await page.waitForFunction(() => { const b = document.querySelector('.be-run'); return b && !/Running/.test(b.textContent); }, null, { timeout: 900000, polling: 500 });
await scrollTo(be, 'start');
await cap('j02-breakevens', { run: be });
const mc = page.locator('.mc-run'); await mc.click();
await page.waitForFunction(() => { const b = document.querySelector('.mc-run'); return b && !/Running/.test(b.textContent); }, null, { timeout: 1500000, polling: 500 });
await scrollTo(mc, 'start');
await cap('j03-mc', { run: mc });
writeFileSync(`${OUT}/sens.txt`, await page.locator('[role=tabpanel]').first().innerText().catch(() => ''));
await page.screenshot({ path: `${OUT}/full-sens.jpg`, type: 'jpeg', quality: 55, fullPage: true, scale: 'css' });
await toTop();
await cap('j04-header-mc', { header: header(), leader: hsItem(1), unverified: page.locator('.hs-item', { hasText: 'Unverified defaults' }) });

// PDF report, then save the study and open it again
try {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 300000 }), page.locator('#save-pdf').click()]);
  await dl.saveAs(`${OUT}/report.pdf`); log('pdf saved');
} catch (e) { log('pdf failed', e.message.split('\n')[0]); }
const [st] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.locator('#save-study').click()]);
await st.saveAs(`${OUT}/study.json`);
await page.waitForTimeout(500);
await cap('k01-saved', { save: page.locator('#save-study'), status: status() }, { status: await status().innerText() });
await page.locator('#open-study-file').setInputFiles(`${OUT}/study.json`);
await page.waitForTimeout(800); await ran(page); await closeRunDetails(page); await toTop();
await cap('k02-reopened', { status: status(), header: header() }, { status: await status().innerText() });
log('errors', errors);
await browser.close();
