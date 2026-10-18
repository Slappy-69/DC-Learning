// Renders the icon set from icon-art.mjs with Playwright/Chromium and writes it to icons/generated/:
//   icon.svg, icon-maskable.svg, icon-small.svg, icon-macos.svg   SVG sources (icon.svg is also the SVG favicon)
//   icon-192.png, icon-512.png                                    manifest "any" icons
//   icon-maskable-512.png                                         manifest maskable icon (full bleed, safe padding)
//   apple-touch-icon-180.png                                      iOS home screen icon (full bleed; iOS rounds it)
//   favicon-32.png                                                browser tab icon (simplified art)
//   icon.ico                                                      Windows (16, 24, 32, 48, 64, 128, 256; PNG entries)
//   icon.icns                                                     macOS (16 to 1024; PNG entries)
//   icon-linux-512.png                                            Linux window and launcher icon
//   preview.png                                                   contact sheet for a visual check (not shipped)
// Usage: node icons/build-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICONS_DIR, launchChromium, loadPlaywright } from '../lib/common.mjs';
import { iconAny, iconMac, iconMaskable, iconSmall } from './icon-art.mjs';

mkdirSync(ICONS_DIR, { recursive: true });
const SVG = { any: iconAny(), maskable: iconMaskable(), small: iconSmall(), mac: iconMac() };
writeFileSync(join(ICONS_DIR, 'icon.svg'), SVG.any);
writeFileSync(join(ICONS_DIR, 'icon-maskable.svg'), SVG.maskable);
writeFileSync(join(ICONS_DIR, 'icon-small.svg'), SVG.small);
writeFileSync(join(ICONS_DIR, 'icon-macos.svg'), SVG.mac);

const pw = loadPlaywright();
const browser = await launchChromium(pw);
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function render(svg, size) {
  await page.setViewportSize({ width: size, height: size });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}img{display:block}</style></head><body><img src="${src}" width="${size}" height="${size}"></body></html>`);
  await page.waitForFunction(() => { const i = document.querySelector('img'); return i && i.complete && i.naturalWidth > 0; });
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

const out = {};
const put = (name, buf) => { writeFileSync(join(ICONS_DIR, name), buf); out[name] = buf.length; };

put('icon-192.png', await render(SVG.any, 192));
put('icon-512.png', await render(SVG.any, 512));
put('icon-maskable-512.png', await render(SVG.maskable, 512));
put('apple-touch-icon-180.png', await render(SVG.maskable, 180));
put('favicon-32.png', await render(SVG.small, 32));
put('icon-linux-512.png', await render(SVG.any, 512));

// Windows .ico: PNG-compressed entries (supported since Windows Vista); simplified art at 32 px and below.
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoImages = [];
for (const s of icoSizes) icoImages.push({ size: s, png: await render(s <= 32 ? SVG.small : SVG.any, s) });
put('icon.ico', buildIco(icoImages));

// macOS .icns: PNG entries for every standard slot.
const icnsTypes = [['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024], ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512]];
const icnsCache = new Map();
const icnsEntries = [];
for (const [type, s] of icnsTypes) {
  if (!icnsCache.has(s)) icnsCache.set(s, await render(SVG.mac, s));
  icnsEntries.push({ type, png: icnsCache.get(s) });
}
put('icon.icns', buildIcns(icnsEntries));

// Contact sheet: every variant on light and dark backgrounds, plus the maskable icon under a circle mask.
{
  const b64 = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const cells = (bg) => `
    <div class="row" style="background:${bg}">
      <img src="${b64(SVG.any)}" width="192"><img src="${b64(SVG.maskable)}" width="192" style="border-radius:50%">
      <img src="${b64(SVG.maskable)}" width="180" style="border-radius:40px"><img src="${b64(SVG.mac)}" width="192">
      <img src="${b64(SVG.any)}" width="48"><img src="${b64(SVG.small)}" width="32"><img src="${b64(SVG.small)}" width="16">
    </div>`;
  await page.setViewportSize({ width: 1000, height: 480 });
  await page.setContent(`<!doctype html><html><head><style>body{margin:0}.row{display:flex;align-items:center;gap:24px;padding:20px}</style></head><body>${cells('#f6f5f1')}${cells('#15171a')}</body></html>`);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  writeFileSync(join(ICONS_DIR, 'preview.png'), await page.screenshot({ fullPage: true }));
}

await browser.close();
for (const [k, v] of Object.entries(out)) console.log(`${k.padEnd(28)} ${(v / 1024).toFixed(1).padStart(7)} KB`);

function buildIco(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, png }, i) => {
    const o = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, o); head.writeUInt8(size >= 256 ? 0 : size, o + 1);
    head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3); head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(png.length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });
  return Buffer.concat([head, ...images.map((x) => x.png)]);
}

function buildIcns(entries) {
  const parts = entries.map(({ type, png }) => {
    const h = Buffer.alloc(8);
    h.write(type, 0, 'ascii'); h.writeUInt32BE(8 + png.length, 4);
    return Buffer.concat([h, png]);
  });
  const body = Buffer.concat(parts);
  const h = Buffer.alloc(8);
  h.write('icns', 0, 'ascii'); h.writeUInt32BE(8 + body.length, 4);
  return Buffer.concat([h, body]);
}
