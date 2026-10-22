#!/usr/bin/env python3
"""Turn the mock-up pages in mock/ (drawn by make_mocks.py) into the figures src/img/m*.png: a full-page capture at
1040 px and 1.5x, the empty space below the drawing trimmed, then scaled to 1300 px wide.
Needs Playwright with Chromium and the Inter font. Usage: python3 shot_mocks.py [name-part ...]"""
import asyncio, io, sys
from PIL import Image, ImageChops
from playwright.async_api import async_playwright
from common import MOCK, save_figure

only = sys.argv[1:]


def trim_bottom(im, pad=12):
    """Cut the empty rows under the drawing (background = the bottom-left pixel)."""
    im = im.convert("RGB")
    bg = Image.new("RGB", im.size, im.getpixel((0, im.size[1] - 1)))
    box = ImageChops.difference(im, bg).getbbox()
    if not box:
        return im
    return im.crop((0, 0, im.size[0], min(im.size[1], box[3] + pad)))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1040, "height": 800}, device_scale_factor=1.5, color_scheme="light")
        page = await ctx.new_page()
        for f in sorted(MOCK.glob("*.html")):
            name = f.name.replace(".html", ".png")
            if only and not any(o in name for o in only):
                continue
            await page.goto(f.as_uri())
            await page.wait_for_timeout(300)
            png = await page.screenshot(full_page=True)
            save_figure(trim_bottom(Image.open(io.BytesIO(png))), name)
        await b.close()
asyncio.run(main())
