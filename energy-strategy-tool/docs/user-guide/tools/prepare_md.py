#!/usr/bin/env python3
"""Prepare the chapter Markdown for pandoc: link "chapter N" and "Appendix A/B" to their headings, and set
pipe-table column widths from the content. Reads src/, writes build/md/. Used by build_epub.py and build_pdf.py."""
import re
from common import SRC, BUILD, FILES

chap_re = re.compile(r"(?<![\[#\w])([Cc]hapter) (\d{1,2})\b(?!\])")
app_re = re.compile(r"(?<![\[#\w])Appendix ([AB])\b(?!\])")
sep_re = re.compile(r"^\|(\s*:?-+:?\s*\|)+\s*$")


def add_links(text):
    out = []
    for ln in text.split("\n"):
        # leave headings, image lines and tables without the word "chapter" alone
        if ln.startswith("#") or ln.lstrip().startswith("![") or ln.startswith("|") and "chapter" not in ln.lower():
            out.append(ln)
            continue
        ln = chap_re.sub(lambda m: f"[{m.group(1)} {m.group(2)}](#ch{m.group(2)})", ln)
        ln = app_re.sub(lambda m: f"[Appendix {m.group(1)}](#app{m.group(1)})", ln)
        out.append(ln)
    return "\n".join(out)


def fix_tables(text):
    """pandoc reads relative column widths from the dash counts of the separator line."""
    lines = text.split("\n")
    i = 0
    while i < len(lines) - 1:
        if lines[i].startswith("|") and sep_re.match(lines[i + 1]):
            j = i + 2
            rows = [lines[i]]
            while j < len(lines) and lines[j].startswith("|"):
                rows.append(lines[j])
                j += 1
            cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
            ncol = len(cells[0])
            if all(len(c) == ncol for c in cells):
                w = []
                for k in range(ncol):
                    lens = [len(re.sub(r"[*_`]", "", c[k])) for c in cells]
                    w.append(max(4.0, sum(lens) / len(lens)) ** 0.85)
                tot = sum(w)
                dashes = [max(3, round(60 * x / tot)) for x in w]
                lines[i + 1] = "|" + "|".join("-" * d for d in dashes) + "|"
            i = j
        else:
            i += 1
    return "\n".join(lines)


def prepare():
    md = BUILD / "md"
    md.mkdir(parents=True, exist_ok=True)
    for fn in FILES:
        text = (SRC / fn).read_text(encoding="utf-8")
        (md / fn).write_text(fix_tables(add_links(text)), encoding="utf-8")
    return md


if __name__ == "__main__":
    print("prepared", prepare())
