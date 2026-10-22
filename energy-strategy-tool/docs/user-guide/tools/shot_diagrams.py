#!/usr/bin/env python3
"""Turn the diagram pages in diag/ (drawn by make_diagrams.py) into the figures src/img/d*.png.
Needs Playwright with Chromium and the Inter font. Usage: python3 shot_diagrams.py [name-part ...]"""
import asyncio, io, sys
from PIL import Image
from playwright.async_api import async_playwright
from common import DIAG, save_figure

only = sys.argv[1:]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1200, "height": 900}, device_scale_factor=1, color_scheme="light")
        page = await ctx.new_page()
        for f in sorted(DIAG.glob("*.html")):
            name = f.name.replace(".html", ".png")
            if only and not any(o in name for o in only):
                continue
            await page.goto(f.as_uri())
            await page.wait_for_timeout(200)
            el = await page.query_selector("svg")
            png = await el.screenshot()
            save_figure(Image.open(io.BytesIO(png)), name)
        await b.close()
asyncio.run(main())
