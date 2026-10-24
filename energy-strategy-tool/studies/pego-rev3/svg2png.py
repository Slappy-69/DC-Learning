import sys, asyncio, pathlib
from playwright.async_api import async_playwright
async def main(files):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(device_scale_factor=1)
        for f in files:
            f = pathlib.Path(f).resolve()
            await pg.goto(f.as_uri())
            el = await pg.query_selector('svg')
            await el.screenshot(path=str(f.with_suffix('.png')))
            print('png', f.with_suffix('.png'))
        await b.close()
asyncio.run(main(sys.argv[1:]))
