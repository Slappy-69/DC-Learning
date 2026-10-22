#!/usr/bin/env python3
"""Capture raw screenshots of the current program for the guide (build/raw/real-*.png): the single-file build of
the app, T1 example, 1440 x 1000 window at 2x, light theme, after the first run finishes.
Build the app first: cd energy-strategy-tool/app && npm ci && npm run build.
The selectors match the program as of 2026-10-21; update them when the screens change.
Then run crop.py to cut and scale the figures into src/img (some figures were split further by hand)."""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import BUILD, SINGLE_FILE

OUT = BUILD / "raw"
OUT.mkdir(parents=True, exist_ok=True)
DONE = """() => { const st=document.querySelector('.status'); const t=st?st.textContent:''; return /Run failed/.test(t) || (/Last run/.test(t) && !/Screening options/.test(t)); }"""


async def clip_el(page, loc, path, max_h=None, pad=0):
    await loc.scroll_into_view_if_needed()
    await page.wait_for_timeout(250)
    bb = await loc.bounding_box()
    sy = await page.evaluate("window.scrollY"); sx = await page.evaluate("window.scrollX")
    x, y, w, h = bb['x'] + sx - pad, bb['y'] + sy - pad, bb['width'] + 2 * pad, bb['height'] + 2 * pad
    if max_h:
        h = min(h, max_h)
    await page.screenshot(path=str(path), full_page=True, clip={"x": x, "y": y, "width": w, "height": h})
    print("saved", Path(path).name, int(w), int(h))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=2, color_scheme="light")
        page = await ctx.new_page()
        page.set_default_timeout(120000)
        await page.goto(SINGLE_FILE.as_uri())
        await page.wait_for_function(DONE, timeout=240000, polling=500)
        hs = await page.locator('.header-strip').bounding_box()
        await page.screenshot(path=str(OUT / "real-header.png"), clip={"x": 0, "y": 0, "width": 1440, "height": hs['y'] + hs['height'] + 8})
        await clip_el(page, page.locator('.header-strip'), OUT / "real-header-strip.png", pad=4)
        secs = page.locator('.inputs > details.section')
        for i in range(await secs.count()):
            await clip_el(page, secs.nth(i), OUT / f"real-inputs-{i + 1}.png", max_h=1500, pad=2)
        await clip_el(page, page.locator('details.run-progress'), OUT / "real-run-progress.png", pad=2)
        await clip_el(page, page.locator('details.run-summary'), OUT / "real-run-summary.png", max_h=1100, pad=2)
        vng = page.locator('details.run-summary section.rs-wide')
        if await vng.count():
            await clip_el(page, vng, OUT / "real-values-not-generated.png", pad=4)
        disp_sec = page.locator('details.run-summary section[aria-labelledby="rs-disp"]')
        if await disp_sec.count():
            await clip_el(page, disp_sec, OUT / "real-run-summary-dispatch.png", pad=4)
        rf = page.locator('ul.run-flags')
        if await rf.count():
            await clip_el(page, rf, OUT / "real-run-flags.png", pad=2)
        await clip_el(page, page.locator('.ranked'), OUT / "real-options.png", max_h=1000, pad=2)
        first = page.locator('table.rank-table tbody tr').first.locator('button, a').first
        await first.click()
        await page.wait_for_selector('section.detail')
        await page.wait_for_timeout(400)
        await clip_el(page, page.locator('section.detail').first, OUT / "real-option-detail.png", max_h=2600, pad=2)
        await page.get_by_role('tab', name='Trade-offs', exact=True).click()
        await page.wait_for_selector('#tradeoffs-chart')
        await page.wait_for_timeout(800)
        await clip_el(page, page.locator('section.pareto'), OUT / "real-tradeoffs.png", max_h=1300, pad=2)
        await page.get_by_role('tab', name='Dispatch', exact=True).click()
        await page.wait_for_selector('section.dv')
        await page.wait_for_function("() => !document.querySelector('.dv-wait')", timeout=120000)
        await page.wait_for_timeout(800)
        await clip_el(page, page.locator('section.dv'), OUT / "real-dispatch-full.png", max_h=6000, pad=2)
        await page.get_by_role('tab', name='Sensitivity', exact=True).click()
        await page.wait_for_selector('section.sens')
        await page.locator('.sens-run').click()
        await page.wait_for_selector('.sens-base', timeout=120000)
        await page.wait_for_timeout(800)
        await clip_el(page, page.locator('section.sens'), OUT / "real-sensitivity.png", max_h=3000, pad=2)
        # The Site tab is a Beta feature (2026-10-22): turn it on in the general settings first, and capture the settings.
        await page.get_by_role('button', name='General settings').click()
        await page.locator('#gs-site-beta').check()
        await clip_el(page, page.locator('#general-settings'), OUT / "real-general-settings.png", pad=4)
        await page.get_by_role('button', name='Close settings').click()
        await page.get_by_role('tab', name='Site Beta', exact=True).click()
        await page.wait_for_selector('#site-plan')
        await page.wait_for_function("() => !document.querySelector('.mult-wait')", timeout=120000)
        await page.wait_for_timeout(1000)
        await clip_el(page, page.locator('section.site'), OUT / "real-site-full.png", max_h=5000, pad=2)
        await b.close()
asyncio.run(main())
