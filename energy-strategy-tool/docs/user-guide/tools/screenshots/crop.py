#!/usr/bin/env python3
"""Cut the raw screenshots (build/raw/real-*.png, from shot_real.py and shot_detail.py) into the figures
src/img/s01-s24 and scale them. The boxes are in raw pixels (window 1440 x 1000 at 2x) and match the program as of
2026-10-21; check each figure after re-capturing, because a screen that grows moves the cuts.
Usage: python3 crop.py"""
import sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import BUILD, save_figure

R = BUILD / "raw"


def raw(name):
    return Image.open(R / name)


def crop(src, box, name, maxw=1300):
    im = raw(src)
    w, h = im.size
    x0, y0, x1, y1 = box
    save_figure(im.crop((x0, y0, min(x1, w), min(y1, h))), name, maxw)


save_figure(raw("real-header-strip.png"), "s01-header-strip.png")
for i, n in [(1, "s02-inputs-project.png"), (2, "s03-inputs-site.png"), (3, "s04-inputs-load.png"),
             (4, "s05-inputs-grid.png"), (6, "s07-inputs-choices.png")]:
    save_figure(raw(f"real-inputs-{i}.png"), n, maxw=900)
# Section 5 (requirements and priorities) is split in two so each half fits a page.
crop("real-inputs-5.png", (0, 0, 758, 1080), "s06-inputs-requirements-a.png", maxw=900)
crop("real-inputs-5.png", (0, 1080, 758, 99999), "s06-inputs-requirements-b.png", maxw=900)
save_figure(raw("real-run-progress.png"), "s08-run-progress.png")
crop("real-run-summary.png", (0, 0, 2024, 1095), "s09-run-summary.png")
save_figure(raw("real-values-not-generated.png"), "s10-values-not-generated.png")
save_figure(raw("real-run-summary-dispatch.png"), "s11-run-summary-dispatch.png", maxw=700)
save_figure(raw("real-run-flags.png"), "s12-run-flags.png")
crop("real-options.png", (0, 0, 2024, 1500), "s13-options.png")
crop("real-option-detail2.png", (0, 0, 1968, 1800), "s14-detail-a.png")
crop("real-option-detail2.png", (0, 1800, 1968, 3060), "s15-detail-b.png")
crop("real-option-detail2.png", (0, 3060, 1968, 4166), "s16-detail-c.png")
save_figure(raw("real-tradeoffs.png"), "s17-tradeoffs.png")
crop("real-dispatch-full.png", (0, 0, 2024, 1000), "s18-dispatch-phasing.png")
crop("real-dispatch-full.png", (0, 1000, 2024, 2215), "s19-dispatch-hourly.png")
crop("real-dispatch-full.png", (0, 2215, 2024, 3128), "s20-dispatch-balance.png")
save_figure(raw("real-sensitivity.png"), "s21-sensitivity.png")
crop("real-site-full.png", (0, 0, 1210, 1400), "s22-site-plan.png", maxw=1000)
# The site-fit panel is split in two so each half fits a page.
crop("real-site-full.png", (1195, 100, 2024, 1550), "s23-site-fit-a.png", maxw=900)
crop("real-site-full.png", (1195, 1550, 2024, 3420), "s23-site-fit-b.png", maxw=900)
crop("real-site-full.png", (0, 3440, 2024, 3900), "s24-site-multiples.png")
