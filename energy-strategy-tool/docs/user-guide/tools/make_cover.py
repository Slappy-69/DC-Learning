#!/usr/bin/env python3
"""EPUB cover (1600 x 2560 px): title and a stylised trade-off scatter of the T1 run (carbon against cost), leader ringed.
Needs Playwright with Chromium and the Inter font. Writes build/cover.html, build/cover.png and build/cover.jpg."""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = str(Path(__file__).resolve().parents[1])  # docs/user-guide
os.makedirs(BASE + "/build", exist_ok=True)
pts = json.load(open(BASE + "/data/t1-all.json"))
# stylised trade-off scatter: carbon (x) vs LCOE (y) from the T1 run
fin = [o for o in pts if o["lcoe"] < 300 and o["loc"] < 600]
W, H = 1600, 2560
x0, x1, y0, y1 = 170, 1430, 1250, 2050
sx = lambda v: x0 + (v - 100) / 500 * (x1 - x0)
sy = lambda v: y1 - (v - 140) / 160 * (y1 - y0)
dots = "".join(f'<circle cx="{sx(o["loc"]):.1f}" cy="{sy(o["lcoe"]):.1f}" r="7" fill="{"#1d1f22" if not o["dom"] else "none"}" stroke="#1d1f22" stroke-width="2" opacity="{0.9 if not o["dom"] else 0.35}"/>' for o in fin[::3])
lead = [o for o in pts if o["rank"] == 1][0]
ring = f'<circle cx="{sx(lead["loc"]):.1f}" cy="{sy(lead["lcoe"]):.1f}" r="30" fill="none" stroke="#b4560a" stroke-width="8"/>'
html = f"""<!doctype html><html><head><meta charset='utf-8'><style>
html,body{{margin:0}} body{{width:{W}px;height:{H}px;background:#f4f2ec;font-family:Inter,sans-serif;color:#1d1f22;position:relative;overflow:hidden}}
.band{{position:absolute;left:0;right:0;top:0;height:28px;background:#1d1f22}}
h1{{position:absolute;left:150px;right:150px;top:250px;font-size:132px;line-height:1.04;font-weight:800;margin:0;letter-spacing:-2px}}
h2{{position:absolute;left:150px;right:150px;top:720px;font-size:66px;font-weight:500;margin:0;color:#3f444b}}
p.sub{{position:absolute;left:150px;right:150px;top:860px;font-size:44px;line-height:1.35;margin:0;color:#3f444b}}
.foot{{position:absolute;left:150px;right:150px;bottom:170px;font-size:44px;color:#3f444b;border-top:4px solid #1d1f22;padding-top:40px}}
svg{{position:absolute;left:0;top:0}}
</style></head><body><div class='band'></div>
<h1>Data Centre Energy Strategy Tool</h1>
<h2>User guide and technical reference</h2>
<p class='sub'>How to use it, how every number is worked out, and where the data comes from</p>
<svg width='{W}' height='{H}'><line x1='{x0}' y1='{y1}' x2='{x1}' y2='{y1}' stroke='#1d1f22' stroke-width='4'/><line x1='{x0}' y1='{y0-20}' x2='{x0}' y2='{y1}' stroke='#1d1f22' stroke-width='4'/>{dots}{ring}
<text x='{x1}' y='{y1+70}' font-size='40' text-anchor='end' fill='#3f444b' font-family='Inter'>carbon →</text>
<text x='{x0-30}' y='{y0+10}' font-size='40' text-anchor='end' fill='#3f444b' font-family='Inter' transform='rotate(-90 {x0-50} {y0+10})'>cost →</text></svg>
<div class='foot'>As agreed in the walkthrough of 21 October 2026</div>
</body></html>"""
open(BASE + "/build/cover.html", "w").write(html)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width": W, "height": H})
        await pg.goto("file://" + BASE + "/build/cover.html")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=BASE + "/build/cover.png")
        await b.close()
asyncio.run(main())
from PIL import Image
Image.open(BASE + "/build/cover.png").convert("RGB").save(BASE + "/build/cover.jpg", quality=88)
print("cover done")
