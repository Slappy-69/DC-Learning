#!/usr/bin/env python3
"""Build the PDF edition (A4) from src/: same text and figures as the EPUB, laid out with WeasyPrint.
Needs pandoc 3, WeasyPrint (pip install weasyprint), BeautifulSoup (bs4), npm (to fetch the fonts once) and,
optionally, qpdf (to optimise the file for fast opening).
Output: out/Data-Centre-Energy-Strategy-Tool-User-Guide.pdf"""
import json, re, shutil, subprocess, sys, tarfile, time, html as H
from bs4 import BeautifulSoup
from common import SRC, IMG, DATA, BUILD, OUT, TOOLS, FILES, TITLE_FILE
from prepare_md import prepare

P = BUILD / "pdf"
FONTS = BUILD / "fonts"
P.mkdir(parents=True, exist_ok=True)

# 0. Fonts (SIL Open Font Licence), fetched once from npm into build/fonts.
FONT_PACKAGES = {
    "@expo-google-fonts/source-serif-4@0.4.2": ["400Regular", "400Regular_Italic", "600SemiBold", "600SemiBold_Italic", "700Bold", "700Bold_Italic"],
    "@expo-google-fonts/inter@0.4.2": ["400Regular", "400Regular_Italic", "500Medium", "600SemiBold", "700Bold", "800ExtraBold"],
    "@expo-google-fonts/jetbrains-mono@0.4.1": ["400Regular", "600SemiBold"],
}
if not (FONTS / "Inter_800ExtraBold.ttf").exists():
    FONTS.mkdir(parents=True, exist_ok=True)
    for pkg, weights in FONT_PACKAGES.items():
        r = subprocess.run(["npm", "pack", pkg, "--pack-destination", str(FONTS)], capture_output=True, text=True)
        if r.returncode:
            sys.exit("could not fetch " + pkg + ": " + r.stderr[-500:])
        tgz = FONTS / r.stdout.strip().split("\n")[-1]
        with tarfile.open(tgz) as tf:
            for m in tf.getmembers():
                if m.name.endswith(".ttf") and any(m.name.split("/")[-2] == w for w in weights):
                    m.name = m.name.split("/")[-1]
                    try:
                        tf.extract(m, FONTS, filter="data")
                    except TypeError:  # Python without extraction filters
                        tf.extract(m, FONTS)
        tgz.unlink()
shutil.copyfile(TOOLS / "print.css", P / "print.css")

# 1. Markdown: the prepared chapters (cross-reference links, table widths). Superscript digit runs such as 10⁻¹⁵
#    become real superscripts (the body font has no superscript minus).
md = prepare()
sup_map = str.maketrans("⁻⁰¹²³⁴⁵⁶⁷⁸⁹", "−0123456789")
parts = []
for fn in FILES:
    t = (md / fn).read_text(encoding="utf-8")
    t = re.sub(r"([⁻⁰¹⁴⁵⁶⁷⁸⁹][⁻⁰¹²³⁴⁵⁶⁷⁸⁹]*)", lambda m: "^" + m.group(1).translate(sup_map) + "^", t)
    parts.append(t)
(P / "guide.md").write_text("\n\n".join(parts), encoding="utf-8")
r = subprocess.run(["pandoc", "--from", "markdown+fenced_divs+line_blocks+pipe_tables+implicit_figures+header_attributes+smart",
                    "--to", "html5", "--section-divs", "--wrap=none", "-o", str(P / "body.html"), str(P / "guide.md")],
                   capture_output=True, text=True)
if r.returncode:
    sys.exit(r.stderr)
soup = BeautifulSoup((P / "body.html").read_text(encoding="utf-8"), "html.parser")

# 2. Top-level sections: classify, restructure headings, collect the contents list.
toc = []          # (kind, id, label, title)
for sec in soup.find_all("section", recursive=False):
    sid = sec.get("id", "")
    h1 = sec.find("h1")
    text = h1.get_text().strip()
    h1["data-title"] = text
    if sid.startswith("part"):
        m = re.match(r"Part ([IVX]+)\. (.*)", text)
        sec["class"] = ["level1", "part"]
        h1.clear(); h1.append(m.group(2))
        lab = soup.new_tag("div", attrs={"class": "partlabel"}); lab.string = "Part " + m.group(1)
        h1.insert_before(lab)
        toc.append(("part", sid, "Part " + m.group(1), m.group(2)))
    elif re.match(r"ch\d+$", sid):
        m = re.match(r"(\d+)\. (.*)", text)
        sec["class"] = ["level1", "chapter"]
        h1.clear()
        sp = soup.new_tag("span", attrs={"class": "chapnum"}); sp.string = "Chapter " + m.group(1)
        h1.append(sp); h1.append(m.group(2))
        toc.append(("chapter", sid, m.group(1), m.group(2)))
    elif sid.startswith("app"):
        m = re.match(r"(Appendix [A-Z])\. (.*)", text)
        sec["class"] = ["level1", "appendix"]
        h1.clear()
        sp = soup.new_tag("span", attrs={"class": "chapnum"}); sp.string = m.group(1)
        h1.append(sp); h1.append(m.group(2))
        toc.append(("appendix", sid, m.group(1), m.group(2)))
    else:
        sec["class"] = ["level1", "front"]
        toc.append(("front", sid, "", text))

# Part pages list their chapters with page numbers.
cur, part_ch = None, {}
for kind, sid, label, title in toc:
    if kind == "part":
        cur = sid; part_ch[cur] = []
    elif kind == "chapter" and cur:
        part_ch[cur].append((sid, label, title))
    else:
        cur = None
for sid, chs in part_ch.items():
    sec = soup.find("section", id=sid)
    ol = soup.new_tag("ol", attrs={"class": "part-toc"})
    for cid, n, title in chs:
        li = soup.new_tag("li"); a = soup.new_tag("a", href="#" + cid)
        sp = soup.new_tag("span", attrs={"class": "n"}); sp.string = n
        a.append(sp); a.append(title); li.append(a); ol.append(li)
    sec.append(ol)

# Appendix A: the register in two columns.
appA = soup.find("section", id="appA")
cols = soup.new_tag("div", attrs={"class": "cols"})
subs = appA.find_all("section", recursive=False)
subs[0].insert_before(cols)
for s in subs:
    cols.append(s.extract())

# 3. Figures from src/img; a thin frame on screenshots of the app.
nfig = 0
for img in soup.find_all("img"):
    name = img["src"].split("/")[-1]
    path = IMG / name
    if not path.exists():
        sys.exit("missing image " + name)
    img["src"] = path.as_uri()
    if name.startswith("s"):
        img["class"] = ["shot"]
    nfig += 1
for fc in soup.find_all("figcaption"):
    del fc["aria-hidden"]

# 4. Tables: right-align columns that hold only numbers.
num_re = re.compile(r"^[−\-+±]?[€£]?\d[\d,]*(\.\d+)?\s?(%|×)?$")
for tb in soup.find_all("table"):
    rows = tb.find_all("tr")
    body = [r for r in rows if r.find("td")]
    if not body:
        continue
    ncol = max(len(r.find_all(["td", "th"])) for r in rows)
    for k in range(1, ncol):
        vals = [r.find_all("td")[k].get_text().strip() for r in body if k < len(r.find_all("td"))]
        vals = [v for v in vals if v not in ("", "–", "—", "n/a")]
        if vals and sum(bool(num_re.match(v)) for v in vals) / len(vals) >= 0.9:
            for r in rows:
                cells = r.find_all(["td", "th"])
                if k < len(cells):
                    cells[k]["class"] = cells[k].get("class", []) + ["num"]
body_html = str(soup)

# 5. Contents.
t = ['<nav class="toc" id="contents"><h1>Contents</h1><ul>']
open_part = False
for kind, sid, label, title in toc:
    if kind == "part":
        if open_part:
            t.append("</ul></li>")
        t.append(f'<li class="part"><a href="#{sid}"><span class="pl">{H.escape(label)}.</span> {H.escape(title)}</a><ul>')
        open_part = True
    elif kind == "chapter":
        t.append(f'<li class="chapter"><a href="#{sid}"><span class="n">{label}</span>{H.escape(title)}</a></li>')
    else:
        if open_part:
            t.append("</ul></li>"); open_part = False
        lab = f"{H.escape(label)}. " if label else ""
        t.append(f'<li class="{kind}"><a href="#{sid}">{lab}{H.escape(title)}</a></li>')
if open_part:
    t.append("</ul></li>")
t.append("</ul></nav>")
toc_html = "\n".join(t)

# 6. Cover (vector): the T1 run's options, carbon against cost, with the leader ringed.
pts = json.loads((DATA / "t1-all.json").read_text())
fin = [o for o in pts if o["lcoe"] < 300 and o["loc"] < 600]
x0, x1, y0, y1 = 70, 1640, 30, 900
sx = lambda v: x0 + (v - 100) / 500 * (x1 - x0)
sy = lambda v: y1 - (v - 140) / 160 * (y1 - y0)
dots = "".join(
    f'<circle cx="{sx(o["loc"]):.1f}" cy="{sy(o["lcoe"]):.1f}" r="7.5" fill="{"#1d1f22" if not o["dom"] else "none"}" '
    f'stroke="#1d1f22" stroke-width="2" opacity="{0.88 if not o["dom"] else 0.33}"/>' for o in fin[::3])
lead = [o for o in pts if o["rank"] == 1][0]
ring = f'<circle cx="{sx(lead["loc"]):.1f}" cy="{sy(lead["lcoe"]):.1f}" r="26" fill="none" stroke="#b4560a" stroke-width="6"/>'
svg = (f'<svg viewBox="0 0 1660 1000" xmlns="http://www.w3.org/2000/svg">'
       f'<line x1="{x0}" y1="{y1}" x2="{x1}" y2="{y1}" stroke="#1d1f22" stroke-width="3"/>'
       f'<line x1="{x0}" y1="{y0 - 10}" x2="{x0}" y2="{y1}" stroke="#1d1f22" stroke-width="3"/>{dots}{ring}'
       f'<text x="{x1}" y="{y1 + 55}" font-size="30" text-anchor="end" fill="#3f444b" font-family="Guide Sans">carbon →</text>'
       f'<text x="{x0 - 22}" y="{y0 + 4}" font-size="30" text-anchor="end" fill="#3f444b" font-family="Guide Sans" '
       f'transform="rotate(-90 {x0 - 22} {y0 + 4})">cost →</text></svg>')
cover = f"""<section class="cover"><div class="band"></div>
<div class="cv-title">Data Centre Energy Strategy Tool</div>
<div class="cv-sub">User guide and technical reference</div>
<div class="cv-desc">How to use it, how every number is worked out, and where the data comes from</div>
{svg}
<div class="cv-foot">As agreed in the walkthrough of 21 October 2026</div></section>"""

desc = ("How to use the concept-design energy strategy tool for data centre campuses, how every value is calculated, "
        "which defaults it uses and where they come from, and which data sources and APIs it needs.")
title_page = f"""<section class="titlepage">
<div class="tp-title">Data Centre Energy Strategy Tool</div>
<div class="tp-sub">User guide and technical reference</div>
<p class="tp-desc">{desc}</p>
<table class="tp-meta">
<tr><th>Date</th><td>21 October 2026</td></tr>
<tr><th>Describes</th><td>The tool as agreed in the walkthrough of 21 October 2026. Screenshots show the current version (model engine 0.2.0-site); screens that are agreed but not built yet are shown as labelled mock-ups.</td></tr>
<tr><th>Prepared by</th><td>Energy Strategy Tool project</td></tr>
<tr><th>Status</th><td>Internal reference document. Screenshots and figures from the T1 example run.</td></tr>
<tr><th>Editions</th><td>This PDF has the same content as the EPUB edition of the same date.</td></tr>
</table></section>"""

doc = f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<title>Data Centre Energy Strategy Tool: User guide and technical reference</title>
<meta name="author" content="Energy Strategy Tool project">
<meta name="description" content="{H.escape(desc)}">
<meta name="keywords" content="data centre, energy strategy, concept design, optioneering, user guide">
<meta name="dcterms.created" content="2026-10-21T12:00:00+01:00">
<meta name="dcterms.modified" content="2026-10-21T12:00:00+01:00">
<link rel="stylesheet" href="print.css"></head>
<body>
{cover}
{title_page}
{toc_html}
{body_html}
</body></html>"""
(P / "guide.html").write_text(doc, encoding="utf-8")
print("figures:", nfig, " contents entries:", len(toc))

# 7. Render: tagged PDF that opens with the bookmarks showing.
import pydyf
from weasyprint import HTML


def finisher(document, pdf):
    pdf.catalog["PageMode"] = "/UseOutlines"
    pdf.catalog["ViewerPreferences"] = pydyf.Dictionary({"DisplayDocTitle": "true"})


t0 = time.time()
raw = P / "guide.pdf"
HTML(str(P / "guide.html"), base_url=str(P) + "/").write_pdf(str(raw), pdf_tags=True, optimize_images=True, finisher=finisher)
OUT.mkdir(parents=True, exist_ok=True)
final = OUT / f"{TITLE_FILE}.pdf"
if shutil.which("qpdf"):
    subprocess.run(["qpdf", "--linearize", str(raw), str(final)], check=True)
else:
    shutil.copyfile(raw, final)
print(f"PDF: {final} ({final.stat().st_size / 1e6:.1f} MB) in {time.time() - t0:.0f} s")
