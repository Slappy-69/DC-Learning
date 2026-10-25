#!/usr/bin/env python3
"""Capture the Summary panel of the Options tab (work package 16, 2026-10-24) for chapter 22: the single-file build of the
app, T1 example, 1440 x 1000 window at 2x, light theme, after the first run finishes. Writes build/raw/real-summary.png
and the figure src/img/s25-summary.png.
Build the app first: cd energy-strategy-tool/app && npm ci && npm run build."""
import asyncio, sys
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import BUILD, SINGLE_FILE, save_figure

OUT = BUILD / "raw"
OUT.mkdir(parents=True, exist_ok=True)
DONE = """() => { const st=document.querySelector('.status'); const t=st?st.textContent:''; return /Run failed/.test(t) || (/Last run/.test(t) && !/Screening options/.test(t)); }"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=2, color_scheme="light")
        page = await ctx.new_page()
        page.set_default_timeout(120000)
        await page.goto(SINGLE_FILE.as_uri())
        await page.wait_for_function(DONE, timeout=240000, polling=500)
        loc = page.locator('.sum-panel')
        await loc.scroll_into_view_if_needed()
        await page.wait_for_timeout(300)
        raw = OUT / "real-summary.png"
        await loc.screenshot(path=str(raw))
        print("saved", raw.name)
        await b.close()
    save_figure(Image.open(raw), "s25-summary.png")
    print("saved s25-summary.png")


asyncio.run(main())
