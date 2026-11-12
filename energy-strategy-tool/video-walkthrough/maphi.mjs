import { open, fill } from './lib.mjs';
const { browser, page } = await open({ width: 1600, height: 900, dsf: 8 });
await page.waitForSelector('#map-picker');
await fill(page, /^Latitude/, '39.4636');
await fill(page, /^Longitude/, '-8.108');
await page.waitForSelector('.nearby-plants > summary', { timeout: 120000 });
await page.locator('.nearby-plants > summary').click();
await fill(page, /^Smallest plant/, '5');
await fill(page, /^Within/, '25');
await page.locator('#map-picker').scrollIntoViewIfNeeded();
const zin = page.getByRole('button', { name: 'Zoom in' });
for (const z of [1, 2, 4, 8, 16, 32]) {
  await page.waitForTimeout(300);
  await page.locator('#map-picker').screenshot({ path: `shots/maphi-z${z}.png` });
  if (z < 32) await zin.click();
}
const titles = await page.locator('#map-picker circle title').allTextContents(); console.log(titles);
await browser.close();
