"""Shared paths and helpers for the user-guide tools. All paths are relative to this folder, so the tools run from any clone."""
from pathlib import Path

GUIDE = Path(__file__).resolve().parents[1]          # energy-strategy-tool/docs/user-guide
TOOLS = GUIDE / "tools"
SRC = GUIDE / "src"                                   # chapter Markdown, metadata.yaml, img/
IMG = SRC / "img"                                     # the figures the book uses (256-colour PNG)
DATA = GUIDE / "data"                                 # T1 run export and registry dump (2026-10-21)
MOCK = GUIDE / "mock"                                 # mock-up pages (HTML), drawn by make_mocks.py
DIAG = GUIDE / "diag"                                 # diagram pages (HTML), drawn by make_diagrams.py
BUILD = GUIDE / "build"                               # everything generated (not committed)
OUT = GUIDE / "out"                                   # finished EPUB and PDF (not committed)
APP = GUIDE.parents[1] / "app"                        # energy-strategy-tool/app
SINGLE_FILE = APP / "dist" / "energy-tool-single-file.html"

# Chapter files in reading order.
FILES = ["00-front.md", "01-part1.md", "02-part2.md", "03-part3a.md", "03-part3b.md", "04-part4a.md", "04-part4b.md",
         "05-part5.md", "06-part6.md", "07-appx-registry.md", "08-appx-countries.md"]

TITLE_FILE = "Data-Centre-Energy-Strategy-Tool-User-Guide"


def save_figure(im, name, maxw=1300):
    """Save a figure into src/img the way the book expects it: at most `maxw` pixels wide,
    reduced to 256 colours without dithering (keeps text crisp and the repository small)."""
    from PIL import Image
    IMG.mkdir(parents=True, exist_ok=True)
    im = im.convert("RGB")
    w, h = im.size
    if w > maxw:
        im = im.resize((maxw, round(h * maxw / w)), Image.LANCZOS)
    q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    q.save(IMG / name, optimize=True)
    print("figure", name, im.size)
