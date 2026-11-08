import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
// The app beside this folder: build it first (cd ../app && npm run build). Outputs go to the current folder.
const APP = fileURLToPath(new URL('../app/', import.meta.url));
const require = createRequire(APP + 'package.json');
export const pw = require('playwright');
export const FILE = pathToFileURL(APP + 'dist/energy-tool-single-file.html').href;
export async function open({ width = 1920, height = 1080, dsf = 1 } = {}) {
  const browser = await pw.chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dsf, colorScheme: 'light' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(FILE, { waitUntil: 'load' });
  return { browser, ctx, page, errors };
}
export const ran = (page, t = 600000) => page.waitForFunction(() => { const t = (document.querySelector('.status') || {}).textContent || ''; return /Run failed/.test(t) || (/Last run/.test(t) && !/Screening options/.test(t)); }, null, { timeout: t, polling: 300 });
export async function fill(page, label, v) { const f = page.getByLabel(label).first(); await f.fill(String(v)); await f.press('Tab'); }
export async function sel(page, label, v) { const f = page.getByLabel(label).first(); await f.selectOption(v); }
export async function closeRunDetails(page) {
  await page.evaluate(() => { for (const q of ['details.run-progress', 'details.run-summary']) { const d = document.querySelector(q); if (d) d.open = false; } });
}
// The Pego scenario. hook(name) is called at the moments worth filming.
export async function setupPego(page, hook = async () => {}) {
  await ran(page);
  await page.getByRole('button', { name: 'Reset to defaults' }).click();
  await page.waitForTimeout(400);
  await ran(page);
  await hook('reset');
  await fill(page, /^Project name/, 'Pego campus, 750 MW IT');
  await fill(page, /^Latitude/, '39.4636');
  await fill(page, /^Longitude/, '-8.108');
  await hook('pin');
  await fill(page, /^IT load, full build/, '750');
  await fill(page, /^PUE, annual/, '1.25');
  await fill(page, /^Maximum PUE, design day/, '1.45');
  await fill(page, /^Grid date, full connection/, '2031-07');
  await fill(page, /^Grid capacity, full connection/, '1200');
  await hook('firstrun');
  await fill(page, /^Grid import now/, '300');
  await fill(page, /^Site area/, '90');
  const add = page.getByRole('button', { name: 'Add phase' });
  for (let i = 0; i < 5; i++) await add.click();
  for (let i = 0; i < 6; i++) {
    const it = page.getByLabel(`Phase ${i + 1} IT MW`); await it.fill('125'); await it.press('Tab');
    const d = page.getByLabel(`Phase ${i + 1} date`); await d.fill(`${2029 + i}-01`); await d.press('Tab');
  }
  await sel(page, /^Workload type/, 'ai-training');
  await sel(page, /^Load shape/, 'aiTraining');
  await fill(page, /^White-space density/, '3');
  await hook('phases');
  await page.waitForTimeout(600);
  await ran(page);
}
export async function fillIn(scope, label, v) { const f = scope.getByLabel(label).first(); await f.fill(String(v)); await f.press('Tab'); }
// Add the nearby plants: Margalha Solar on a supply contract through the grid, Elecgas Pego on a cost-plus contract by private wire.
export async function addPlants(page, hook = async () => {}) {
  await page.locator('.nearby-plants > summary').click();
  await fill(page, /^Smallest plant/, '5');
  await fill(page, /^Within/, '25');
  await page.waitForTimeout(300);
  await hook('nearby-list');
  await page.getByRole('button', { name: 'Add Margalha Solar Farm to the analysis' }).click();
  await page.waitForTimeout(300);
  const val = await page.locator('#nearby-plant-select option', { hasText: 'Elecgas Pego' }).getAttribute('value');
  await page.locator('#nearby-plant-select').selectOption(val);
  await hook('nearby-picked');
  await page.getByRole('button', { name: 'Add and run again' }).click();
  await page.waitForTimeout(500);
  await ran(page);
  const ms = page.locator('details.plant-detail', { hasText: 'Margalha Solar Farm: 120 MW' });
  await ms.evaluate((d) => { d.open = true; });
  await sel(ms, /^Route to the campus/, 'grid');
  await fillIn(ms, /^Contract price(?! set by)/, '45');
  const eg = page.locator('details.plant-edit', { hasText: 'Correct Elecgas Pego' });
  await eg.evaluate((d) => { d.open = true; });
  await sel(eg, /^Contract price set by/, 'costPlus');
  await fillIn(eg, /^Margin/, '10');
  await fillIn(eg, /^Contract MW/, '400');
  await hook('plants-set');
  await page.waitForTimeout(600);
  await ran(page);
}
export async function openStudy(page, file) {
  await ran(page);
  await page.locator('#open-study-file').setInputFiles(file);
  await page.waitForTimeout(800);
  await ran(page);
}
