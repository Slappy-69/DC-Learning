#!/usr/bin/env python3
"""Capture the leader's option detail as opened from the trade-off chart (build/raw/real-option-detail2.png),
used for figures s14–s16. Same set-up as shot_real.py."""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import BUILD, SINGLE_FILE
from shot_real import DONE, clip_el

OUT = BUILD / "raw"
OUT.mkdir(parents=True, exist_ok=True)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=2, color_scheme="light")
        page = await ctx.new_page()
        page.set_default_timeout(120000)
        await page.goto(SINGLE_FILE.as_uri())
        await page.wait_for_function(DONE, timeout=240000, polling=500)
        await page.get_by_role('tab', name='Trade-offs', exact=True).click()
        await page.wait_for_selector('#tradeoffs-chart')
        await page.wait_for_timeout(600)
        await page.locator('#tradeoffs-chart').focus()
        await page.keyboard.press('p')
        await page.wait_for_timeout(200)
        await page.keyboard.press('Enter')
        await page.wait_for_selector('.pareto-detail section.detail')
        await page.wait_for_timeout(500)
        await clip_el(page, page.locator('.pareto-detail section.detail'), OUT / "real-option-detail2.png", max_h=4000, pad=2)
        await b.close()
if __name__ == "__main__":
    asyncio.run(main())
