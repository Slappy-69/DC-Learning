# Screenshots of the study build of the current app (Pego, revision 3).
import asyncio, pathlib, sys, json
from playwright.async_api import async_playwright
HERE = pathlib.Path(__file__).resolve().parent
APP = HERE / 'app' / 'dist' / 'energy-tool-single-file.html'
OUT = HERE / 'shots'; OUT.mkdir(exist_ok=True)
DONE = """() => { const st=document.querySelector('.status'); const t=st?st.textContent:''; return /Run failed/.test(t) || (/Last run/.test(t) && !/Screening options/.test(t) && !/Verifying/.test(t)); }"""
LEAD = json.load(open(HERE / 'out' / 'lead.json'))['id']

async def clip(page, loc, name, max_h=None, pad=3):
    await loc.scroll_into_view_if_needed(); await page.wait_for_timeout(250)
    bb = await loc.bounding_box(); sy = await page.evaluate("window.scrollY"); sx = await page.evaluate("window.scrollX")
    h = bb['height'] + 2 * pad
    if max_h: h = min(h, max_h)
    await page.screenshot(path=str(OUT / name), full_page=True, clip={"x": bb['x'] + sx - pad, "y": bb['y'] + sy - pad, "width": bb['width'] + 2 * pad, "height": h})
    print('saved', name, int(bb['width']), int(h), flush=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1920, "height": 1100}, device_scale_factor=2, color_scheme="light", accept_downloads=True)
        page = await ctx.new_page(); page.set_default_timeout(180000)
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(APP.as_uri())
        await page.wait_for_function(DONE, timeout=900000, polling=1000)
        status = await page.locator('.status').first.inner_text()
        print('status:', status[:300].replace('\n', ' '), flush=True)
        hs = await page.locator('.header-strip').bounding_box()
        await page.screenshot(path=str(OUT / 'header.png'), clip={"x": 0, "y": 0, "width": 1920, "height": hs['y'] + hs['height'] + 8})
        secs = page.locator('.inputs > details.section')
        n = await secs.count()
        for i in range(n):
            await clip(page, secs.nth(i), f'inputs-{i+1}.png', max_h=2400)
        rs = page.locator('details.run-summary').first
        if await rs.count():
            await rs.evaluate("e => e.open = true"); await page.wait_for_timeout(300)
            await clip(page, rs, 'run-summary.png', max_h=2600)
        # Options tab: the top five cards and the head of the ranked list
        await page.get_by_role('tab', name='Options', exact=True).click(); await page.wait_for_timeout(500)
        await clip(page, page.locator('section.top5'), 'top5.png')
        await clip(page, page.locator('.ranked'), 'ranked.png', max_h=1500)
        # Detail of #1
        await page.locator('table.rank-table tbody tr').first.locator('button.row-btn').click()
        await page.wait_for_selector('section.detail'); await page.wait_for_timeout(600)
        await clip(page, page.locator('section.detail').first, 'detail-1.png', max_h=9000)
        await page.locator('table.rank-table tbody tr').first.locator('button.row-btn').click(); await page.wait_for_timeout(300)
        # Compare the first three cards
        cards = page.locator('.top5-card')
        for i in range(3):
            await cards.nth(i).get_by_label('Compare').check()
        await page.get_by_role('tab', name='Compare (3)').click(); await page.wait_for_timeout(800)
        await clip(page, page.locator('[id="panel-compare"]'), 'compare.png', max_h=6000)
        # Trade-offs
        await page.get_by_role('tab', name='Trade-offs', exact=True).click()
        await page.wait_for_selector('#tradeoffs-chart'); await page.wait_for_timeout(1200)
        await clip(page, page.locator('section.pareto'), 'tradeoffs.png', max_h=1800)
        # Dispatch: #1, steady-state year, the peak week via "any period"
        await page.get_by_role('tab', name='Dispatch', exact=True).click()
        await page.wait_for_selector('#dv-option'); await page.select_option('#dv-option', LEAD); await page.wait_for_timeout(800)
        await page.wait_for_function("() => !document.querySelector('.dv-wait')", timeout=300000); await page.wait_for_timeout(800)
        years = page.locator('.dv-controls [role=group][aria-label="Model year"] button')
        ny = await years.count()
        if ny: await years.nth(ny - 1).click(); await page.wait_for_timeout(1200)
        await page.wait_for_function("() => !document.querySelector('.dv-wait')", timeout=300000); await page.wait_for_timeout(800)
        await clip(page, page.locator('section.dv'), 'dispatch-week.png', max_h=5000)
        await page.locator('#dv-day').fill('196'); await page.locator('#dv-day').press('Enter'); await page.wait_for_timeout(500)
        await page.select_option('#dv-len', '3'); await page.wait_for_timeout(1200)
        await clip(page, page.locator('section.dv'), 'dispatch-period.png', max_h=5000)
        # Sensitivity: all 16 drivers, LCOE
        await page.get_by_role('tab', name='Sensitivity', exact=True).click()
        await page.wait_for_selector('#sens-option'); await page.select_option('#sens-option', LEAD); await page.wait_for_timeout(500)
        await page.get_by_role('button', name='Tick all').click(); await page.wait_for_timeout(300)
        await page.locator('.sens-run').click()
        await page.wait_for_selector('.sens-base', timeout=600000); await page.wait_for_timeout(1500)
        await clip(page, page.locator('section.sens'), 'sensitivity.png', max_h=6000)
        # PDF report, from the app
        btn = page.locator('#save-pdf')
        async with page.expect_download(timeout=120000) as dl:
            await btn.click()
        d = await dl.value
        await d.save_as(str(OUT / d.suggested_filename))
        print('pdf', d.suggested_filename, flush=True)
        st = await page.locator('.status[role=status]').first.inner_text()
        print('status after pdf:', st[:200].replace('\n', ' '), flush=True)
        # Site tab (Beta)
        await page.get_by_role('button', name='General settings').click()
        await page.locator('#gs-site-beta').check()
        await page.get_by_role('button', name='Close settings').click()
        await page.get_by_role('tab', name='Site Beta', exact=True).click()
        await page.wait_for_selector('#site-plan')
        await page.locator('section.site select').first.select_option(LEAD); await page.wait_for_timeout(1500)
        await page.wait_for_function("() => !document.querySelector('.mult-wait')", timeout=600000); await page.wait_for_timeout(1500)
        await clip(page, page.locator('#site-plan'), 'site-plan.png')
        await clip(page, page.locator('section.site'), 'site.png', max_h=9000)
        print('errors:', errs, flush=True)
        await b.close()
asyncio.run(main())
