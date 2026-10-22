#!/usr/bin/env python3
"""Build the EPUB edition (for Kindle and other e-readers) from src/.
Needs pandoc 3 and, for the cover, Playwright with Chromium (make_cover.py).
Output: out/Data-Centre-Energy-Strategy-Tool-User-Guide.epub"""
import shutil, subprocess, sys
from common import SRC, BUILD, OUT, TOOLS, FILES, TITLE_FILE
from prepare_md import prepare

md = prepare()
cover = BUILD / "cover.jpg"
if not cover.exists():
    subprocess.run([sys.executable, str(TOOLS / "make_cover.py")], check=True)

OUT.mkdir(parents=True, exist_ok=True)
epub = BUILD / "energy-strategy-tool-user-guide.epub"
cmd = ["pandoc", "--from", "markdown+fenced_divs+line_blocks+pipe_tables+implicit_figures+header_attributes+smart",
       "--to", "epub3", "-o", str(epub),
       "--metadata-file", str(SRC / "metadata.yaml"),
       "--toc", "--toc-depth=2", "--split-level=1",
       "--epub-cover-image", str(cover),
       "--css", str(TOOLS / "epub.css"),
       "--resource-path", str(SRC),
       ] + [str(md / f) for f in FILES]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode:
    sys.exit(r.stderr)
if r.stderr.strip():
    print("pandoc:", r.stderr.strip()[:2000])
final = OUT / f"{TITLE_FILE}.epub"
shutil.copyfile(epub, final)
print(f"EPUB: {final} ({final.stat().st_size / 1e6:.1f} MB)")
print("Check it with EPUBCheck (java -jar epubcheck.jar <file>) and look at pages with render_epub.py.")
