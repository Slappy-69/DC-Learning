#!/usr/bin/env python3
"""Look at the EPUB the way a small e-reader would: unpack out/*.epub into build/x and render pages of the named
chapter files (e.g. ch005.xhtml) at 560 x 760 px into build/render/. Usage: python3 render_epub.py ch005.xhtml ..."""
import asyncio, sys, zipfile
from playwright.async_api import async_playwright
from common import BUILD, OUT, TITLE_FILE

X = BUILD / "x"
with zipfile.ZipFile(OUT / f"{TITLE_FILE}.epub") as z:
    z.extractall(X)
TEXT = X / "EPUB" / "text"
R = BUILD / "render"
R.mkdir(parents=True, exist_ok=True)
files = sys.argv[1:] or sorted(p.name for p in TEXT.glob("ch*.xhtml"))[:3]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 560, "height": 760}, device_scale_factor=1.6)
        pg = await ctx.new_page()
        for f in files:
            await pg.goto((TEXT / f).as_uri())
            await pg.add_style_tag(content="body{font-family:Georgia,serif;font-size:17px;background:#fff}")
            await pg.wait_for_timeout(300)
            h = await pg.evaluate("document.body.scrollHeight")
            n = min(6, (h // 760) + 1)
            for i in range(n):
                await pg.evaluate(f"window.scrollTo(0,{i * 760})")
                await pg.screenshot(path=str(R / f"{f.replace('.xhtml', '')}-{i}.png"))
            print(f, h, n)
        await b.close()
asyncio.run(main())
