#!/usr/bin/env python3
"""Explanatory diagrams and charts for the user guide (e-ink friendly: ink, greys, hatching, direct labels).
Reads data/t1-*.json; writes SVG wrapped in HTML to diag/*.html; shot_diagrams.py renders them to src/img/d*.png."""
import json, math, os, html

from pathlib import Path
BASE = str(Path(__file__).resolve().parents[1])  # docs/user-guide; every path below is relative to it
OUT = BASE + "/diag"
DATA = BASE + "/data"
os.makedirs(OUT, exist_ok=True)

INK, INK2, INK3 = "#1d1f22", "#3f444b", "#62676f"
G1, G2, G3, G4 = "#8a8f98", "#b9bdc3", "#d9dbde", "#eef0f2"
ACC = "#b4560a"      # accent (dark orange; reads as mid-dark grey on e-ink)
W = 1200

def esc(s):
    return html.escape(str(s), quote=False)

def T(x, y, s, size=24, weight=400, anchor="start", fill=INK, extra=""):
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{fill}" {extra}>{esc(s)}</text>'

def R(x, y, w, h, fill="#fff", stroke=INK, sw=2, rx=8, extra=""):
    st = f'stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" {st} {extra}/>'

def L(x1, y1, x2, y2, stroke=INK, sw=2, extra=""):
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'

DEFS = f'''<defs>
<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{INK}"/></marker>
<marker id="arrg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{INK3}"/></marker>
<pattern id="hatch" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)"><rect width="10" height="10" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="10" stroke="{INK2}" stroke-width="3"/></pattern>
<pattern id="hatchl" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)"><rect width="10" height="10" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="10" stroke="{G1}" stroke-width="3"/></pattern>
<pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#ffffff"/><circle cx="5" cy="5" r="2" fill="{INK2}"/></pattern>
</defs>'''

def page(name, w, h, body):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="Inter, sans-serif">{DEFS}<rect width="{w}" height="{h}" fill="#ffffff"/>{body}</svg>'
    open(f"{OUT}/{name}.html", "w").write(f"<!doctype html><html><head><meta charset='utf-8'><style>html,body{{margin:0;background:#fff}}svg{{display:block}}</style></head><body>{svg}</body></html>")

def fmt(x, d=0):
    return f"{x:,.{d}f}"

# ------------------------------------------------------------------ d01 pipeline
stages = [
    ("Once per run", [
        (1, "Input normalisation", "Fills defaults, resolves choice states, hashes the inputs"),
        (2, "Context build", "Country, hourly profiles, PUE per cooling type, grid and IT by month"),
        (3, "Option generation", "Combinations, compatibility rules, archetypes, sampling to the cap"),
    ]),
    ("For every option (split across worker threads)", [
        (4, "Sizing", "Rule-based size of every plant item"),
        (5, "Site layout", "Blocks placed on the plan, residual solar filled, site-fit status"),
        (6, "Dispatch (8,760 h)", "Hour-by-hour supply for each model year"),
        (7, "Time-to-power", "First power, full load and power gap from monthly supply"),
        (8, "Economics", "Year-by-year cost ledger, NPV and LCOE"),
        (9, "Carbon and water", "Location- and market-based carbon, hourly CFE, WUE"),
        (10, "Resilience", "Backed load, topology, autonomy and islanding checks"),
        (11, "Flags", "Grid, permitting, fuel, target, technology and site-fit flags"),
        (12, "Deliverability", "100 points less maturity, permitting and supply penalties"),
    ]),
    ("Across all options", [
        (13, "Scoring and ranking", "Normalise four axes, apply weights, mark dominance, rank"),
    ]),
]
caches = {4: "cache: hourly demand", 5: "cache: block set", 6: "cache: configuration"}
y = 20
body = T(40, y + 30, "The run pipeline: 13 stages", 32, 700)
y += 62
for gname, items in stages:
    body += R(40, y, W - 80, 44, fill=G4, stroke=None, rx=6) + T(58, y + 30, gname, 23, 600, fill=INK2)
    y += 56
    for n, name, desc in items:
        body += f'<circle cx="78" cy="{y + 32}" r="24" fill="{INK}"/>' + T(78, y + 41, n, 23, 700, "middle", "#fff")
        body += R(120, y, W - 160, 64, fill="#fff", stroke=INK3, sw=1.5, rx=8)
        body += T(140, y + 28, name, 25, 700) + T(140, y + 55, desc, 21, 400, fill=INK2)
        if n in caches:
            body += R(W - 330, y + 10, 270, 32, fill="#fff", stroke=G1, sw=1.5, rx=16, extra='stroke-dasharray="5 4"') + T(W - 195, y + 33, caches[n], 19, 500, "middle", INK3)
        if n < 13:
            body += L(78, y + 58, 78, y + 76, INK, 2)
        y += 76
    y += 6
body += T(40, y + 22, "Each stage reports progress to the run log. Cached stages reuse earlier work when two options", 20, 400, fill=INK3)
body += T(40, y + 48, "share the same inputs to that stage (for example the same plant configuration in dispatch).", 20, 400, fill=INK3)
page("d01-pipeline", W, y + 70, body)

# ------------------------------------------------------------------ d02 generation funnel
sc = json.load(open(DATA + "/t1-scoring.json"))
g = sc["generation"]
steps = [
    (fmt(g["rawTotal"]), "Product of the open values of C1–C20 and the BESS role", None),
    (fmt(g["collapsedTotal"]), "after rule (d): choices that do not apply collapse to n/a", f"− {fmt(g['removedByRule']['d'])} collapsed"),
    (fmt(g["validCombinations"]), "after rules (a), (b), (c), (e): impossible combinations removed", f"− {fmt(g['removedByRule']['e'])} by rule (e)"),
    (fmt(g["totalCombinations"]), "plus archetypes that sit outside the open choices", f"+ {g['archetypesOutsideSpace']} archetypes"),
    (fmt(g["screened"]), "screened: all 11 archetypes + 1,989 seeded Latin hypercube draws", f"cap {fmt(g['cap'])}"),
]
y = 20
body = T(40, y + 30, "Option generation in the T1 example", 32, 700)
y += 70
bw = [1040, 900, 800, 800, 800]
for i, (num, desc, delta) in enumerate(steps):
    w = bw[i]
    x = (W - w) / 2
    fill = INK if i == len(steps) - 1 else "#fff"
    fg = "#fff" if i == len(steps) - 1 else INK
    body += R(x, y, w, 96, fill=fill, stroke=INK, sw=2, rx=10)
    body += T(W / 2, y + 44, num, 38, 800, "middle", fg)
    body += T(W / 2, y + 80, desc, 21, 400, "middle", "#fff" if i == len(steps) - 1 else INK2)
    if i < len(steps) - 1:
        body += L(W / 2, y + 98, W / 2, y + 150, INK, 2.5, 'marker-end="url(#arr)"')
        d = steps[i + 1][2]
        body += T(W / 2 + 24, y + 132, d, 22, 600, "start", ACC)
    y += 156
body += T(W / 2, y + 4, f"{g['lhsRepaired']} of the sampled draws landed on an invalid or repeated combination and were replaced (“repaired”).", 20, 400, "middle", INK3)
page("d02-generation", W, y + 30, body)

# ------------------------------------------------------------------ d03 merit order
merit = [
    ("On-site renewables", "Solar and wind serve the load first. Surplus is kept for battery charging, export or curtailment."),
    ("PPA over the grid connection", "Contracted PPA energy for the hour, up to the remaining load and the import capacity."),
    ("Battery discharge", "Per role: cover a shortfall against the grid limit, and/or the day's dearest hours."),
    ("Firm on-site plant", "Runs if cheaper than grid import, or to cover a grid shortfall; must-run when islanded."),
    ("Grid import", "Up to the offered capacity (“Show unmet load”), or uncapped (“Show exceedance”)."),
    ("Flexibility, then unmet load", "Curtail flexible IT load if on; whatever is left is recorded as unmet and flagged."),
]
y = 20
body = T(40, y + 30, "Merit order: how each hour is supplied", 32, 700)
y += 66
for i, (name, rule) in enumerate(merit):
    body += f'<circle cx="80" cy="{y + 46}" r="28" fill="{INK}"/>' + T(80, y + 56, i + 1, 27, 800, "middle", "#fff")
    body += R(126, y, W - 166, 104, fill="#fff", stroke=INK3, sw=1.5, rx=8)
    body += T(148, y + 36, name, 26, 700)
    # wrap rule text at ~78 chars
    words, lines, cur = rule.split(), [], ""
    for wd in words:
        if len(cur) + len(wd) + 1 > 88:
            lines.append(cur); cur = wd
        else:
            cur = (cur + " " + wd).strip()
    lines.append(cur)
    for k, ln in enumerate(lines[:2]):
        body += T(148, y + 64 + 24 * k, ln, 21, 400, fill=INK2)
    if i < len(merit) - 1:
        body += L(80, y + 76, 80, y + 118, INK, 2.5, 'marker-end="url(#arr)"')
    y += 122
body += R(40, y + 4, W - 80, 104, fill=G4, stroke=None, rx=8)
body += T(60, y + 38, "After the hour is supplied", 23, 700, fill=INK2)
body += T(60, y + 66, "The battery charges only in hours with no discharge: first from surplus on-site generation, then from", 20, 400, fill=INK2)
body += T(60, y + 92, "the grid in the day’s cheapest hours, within the connection. Remaining surplus is exported or curtailed.", 20, 400, fill=INK2)
page("d03-merit-order", W, y + 128, body)

# ------------------------------------------------------------------ d04 PUE curves (small multiples)
pue = json.load(open(DATA + "/t1-pue.json"))
temps = json.load(open(DATA + "/t1-temps.json"))
names = {"air": "Air (chilled water + free cooling)", "evap": "Evaporative-adiabatic", "dlc": "Direct liquid cooling + dry coolers", "immersion": "Immersion"}
def pue_at(p, t):
    c = max(1.5, p["copRef"] - p["copSlope"] * (t - p["tRef"]))
    part = 0 if t <= p["fcThreshold"] else 1 if t >= p["fcThreshold"] + p["band"] else (t - p["fcThreshold"]) / p["band"]
    return 1 + p["fanFrac"] + part / c + p["lossFrac"]
PW, PH = 560, 410
y0 = 92
body = T(40, 50, "Hourly PUE against outdoor temperature (cooling model)", 32, 700)
body += T(40, 82, "Line: PUE in an hour at that temperature. Grey: hours of the year at each temperature (United Kingdom synthetic profile).", 20, 400, fill=INK3)
order = ["air", "evap", "dlc", "immersion"]
for k, cid in enumerate(order):
    p = pue["pue"][cid]["params"]
    wet = p["tempBasis"] == "wetbulb"
    lo, hi = (-10, 30) if wet else (-10, 40)
    ox = 40 + (k % 2) * (PW + 40)
    oy = y0 + 30 + (k // 2) * (PH + 70)
    px0, px1, py0, py1 = ox + 74, ox + PW - 16, oy + 70, oy + PH - 56
    sx = lambda t: px0 + (t - lo) / (hi - lo) * (px1 - px0)
    sy = lambda v: py1 - (v - 1.0) / (0.45) * (py1 - py0)
    body += T(ox, oy + 26, names[cid], 24, 700)
    an = pue["pue"][cid]["annualPUE"]; pk = pue["pue"][cid]["peakPUE"]
    body += T(ox, oy + 54, f"annual {an:.3f} · design-day peak {pk:.3f}", 20, 600, fill=INK2)
    hist = temps["wet"] if wet else temps["dry"]
    hlo = temps["wetLo"] if wet else temps["dryLo"]
    hmax = max(hist)
    for i2, cnt in enumerate(hist):
        t = hlo + i2
        if t < lo or t >= hi or cnt == 0:
            continue
        hh = cnt / hmax * (py1 - py0) * 0.42
        body += f'<rect x="{sx(t) + 1:.1f}" y="{py1 - hh:.1f}" width="{sx(t + 1) - sx(t) - 2:.1f}" height="{hh:.1f}" fill="{G3}"/>'
    for v in [1.0, 1.1, 1.2, 1.3, 1.4]:
        body += L(px0, sy(v), px1, sy(v), G3 if v > 1.0 else INK3, 1)
        body += T(px0 - 10, sy(v) + 7, f"{v:.1f}", 19, 400, "end", INK3)
    body += f'<text transform="translate({ox + 16},{(py0 + py1) / 2:.1f}) rotate(-90)" font-size="18" font-weight="600" text-anchor="middle" fill="{INK3}">PUE</text>'
    for t in range(lo, hi + 1, 10):
        body += T(sx(t), py1 + 26, f"{t}", 19, 400, "middle", INK3)
    body += T((px0 + px1) / 2, py1 + 52, ("wet-bulb" if wet else "dry-bulb") + " temperature (°C)", 19, 400, "middle", INK3)
    pts = []
    t = lo
    while t <= hi + 1e-9:
        v = min(pue_at(p, t), 1.45)
        pts.append(f"{sx(t):.1f},{sy(v):.1f}")
        t += 0.25
    body += f'<polyline points="{" ".join(pts)}" fill="none" stroke="{INK}" stroke-width="3"/>'
    dt = temps["designWetbulb"] if wet else temps["designTemp"]
    dv = pue_at(p, dt)
    body += L(sx(dt), py0 + 4, sx(dt), py1, ACC, 2, 'stroke-dasharray="6 5"')
    body += f'<circle cx="{sx(dt):.1f}" cy="{sy(dv):.1f}" r="7" fill="{ACC}"/>'
    body += T(sx(dt) - 8, py0 + 22, f"design {dt:.1f} °C", 18, 600, "end", ACC)
page("d04-pue", W, y0 + 30 + 2 * (PH + 70) - 20, body)

# ------------------------------------------------------------------ d05 cost ledger of the leader
led = json.load(open(DATA + "/t1-leader-ledger.json"))
rows = led["ledger"]
cap = [r["capexTotal"] / 1e6 for r in rows]
opx = [r["opex"] / 1e6 for r in rows]
pv = [(r["pvCapex"] + r["pvOpex"]) / 1e6 for r in rows]
H5 = 800
px0, px1, py0, py1 = 120, W - 40, 150, H5 - 160
vmin, vmax = -40, 120
sx = lambda i: px0 + (i + 0.5) / len(rows) * (px1 - px0)
sy = lambda v: py1 - (v - vmin) / (vmax - vmin) * (py1 - py0)
bwid = (px1 - px0) / len(rows) * 0.36
body = T(40, 50, "Cost ledger of the T1 leader, year by year (€ million, real terms)", 30, 700)
lx = 40
body += R(lx, 78, 26, 26, fill="url(#hatch)", stroke=INK2, sw=1.5, rx=3) + T(lx + 36, 99, "Capex incl. contingency (residual value below zero)", 20)
body += R(lx + 560, 78, 26, 26, fill=INK2, stroke=None, rx=3) + T(lx + 596, 99, "Opex", 20)
body += L(lx + 700, 91, lx + 740, 91, ACC, 3) + f'<circle cx="{lx + 720}" cy="91" r="6" fill="{ACC}"/>' + T(lx + 752, 99, "Present value of the year (7 % real)", 20)
body += T(px0 - 12, py0 - 18, "€ m", 18, 600, "end", INK3)
for v in range(vmin, vmax + 1, 20):
    body += L(px0, sy(v), px1, sy(v), INK3 if v == 0 else G3, 1.5 if v == 0 else 1)
    body += T(px0 - 12, sy(v) + 7, f"{v}", 19, 400, "end", INK3)
for i, r in enumerate(rows):
    x = sx(i)
    c = cap[i]
    if abs(c) > 1e-9:
        top_, bot = (sy(c), sy(0)) if c > 0 else (sy(0), sy(c))
        body += R(x - bwid - 1, top_, bwid, bot - top_, fill="url(#hatch)", stroke=INK2, sw=1.2, rx=2)
    o = opx[i]
    if o > 1e-9:
        body += R(x + 1, sy(o), bwid, sy(0) - sy(o), fill=INK2, stroke=None, rx=2)
    if i % 2 == 0 or i == len(rows) - 1:
        body += T(x, py1 + 30, i, 19, 400, "middle", INK3)
pts = " ".join(f"{sx(i):.1f},{sy(v):.1f}" for i, v in enumerate(pv))
body += f'<polyline points="{pts}" fill="none" stroke="{ACC}" stroke-width="3"/>'
body += "".join(f'<circle cx="{sx(i):.1f}" cy="{sy(v):.1f}" r="5" fill="{ACC}"/>' for i, v in enumerate(pv))
body += T((px0 + px1) / 2, py1 + 62, "Year of the evaluation period (year 0 = 2027, the first year of the analysis)", 20, 400, "middle", INK3)
body += T(sx(12), sy(107.8) - 14, "steady state: grid €72.1 m + PPA €34.4 m + other €1.4 m", 18, 600, "middle", INK2)
body += T(sx(20) - 14, sy(cap[20]) + 26, "residual value", 18, 600, "end", INK2)
npv = led["npv"] / 1e6
body += T(40, py1 + 104, f"Sum of the yearly present values = NPV of net cost, €{npv:,.1f} m.", 21, 700, "start", INK)
body += T(40, py1 + 134, f"NPV ÷ present value of delivered energy (6.09 million MWh) = LCOE €{led['lcoe']:.1f}/MWh.", 21, 700, "start", INK)
page("d05-ledger", W, H5 + 10, body)

# ------------------------------------------------------------------ d06 scoring
top = json.load(open(DATA + "/t1-top20.json"))
ld = top[0]
rg = sc["ranges"]; wts = sc["weights"]
axes = [("cost", "Cost: LCOE (€/MWh)", ld["metrics"]["cost"], True, "{:.1f}"),
        ("carbon", "Carbon: location-based (gCO₂e/kWh)", ld["metrics"]["carbon"], True, "{:.1f}"),
        ("ttp", "Time-to-power metric (months)", ld["metrics"]["ttp"], True, "{:.2f}"),
        ("deliverability", "Deliverability (points)", ld["metrics"]["deliverability"], False, "{:.1f}")]
y = 20
body = T(40, y + 30, "From metrics to the weighted score (T1 leader)", 32, 700)
body += T(40, y + 62, "Each axis is rescaled over all 2,000 screened options: best value = 100, worst = 0, straight line in between.", 20, 400, fill=INK3)
y += 96
lx0, lx1 = 60, W - 60
for key, label, val, lower, f in axes:
    lo, hi = rg[key]["lo"], rg[key]["hi"]
    best, worst = (lo, hi) if lower else (hi, lo)
    s_ = ld["axisScores"][key]
    body += T(40, y + 28, label, 23, 700) + T(W - 40, y + 28, f"axis score {s_:.1f}", 23, 700, "end", ACC)
    ly = y + 74
    body += L(lx0, ly, lx1, ly, INK, 3)
    for xx in (lx0, lx1):
        body += L(xx, ly - 10, xx, ly + 10, INK, 3)
    body += T(lx0, ly + 34, f"best {f.format(best)} = 100", 19, 600, "start", INK2)
    body += T(lx1, ly + 34, f"worst {f.format(worst)} = 0", 19, 600, "end", INK2)
    frac = (best - val) / (best - worst)
    xv = lx0 + frac * (lx1 - lx0)
    body += f'<circle cx="{xv:.1f}" cy="{ly}" r="11" fill="{ACC}" stroke="#fff" stroke-width="2"/>'
    tx = min(max(xv, lx0 + 260), lx1 - 260)
    body += T(tx, ly - 18, f"leader {f.format(val)}", 19, 700, "middle", INK)
    y += 132
y += 6
body += T(40, y + 26, "Weighted sum", 24, 700)
contrib = [(k, wts[k], ld["axisScores"][k], wts[k] * ld["axisScores"][k]) for k in ["cost", "carbon", "ttp", "deliverability"]]
bx0, bx1 = 40, W - 40
scale = (bx1 - bx0) / 100
x = bx0
fills = [INK, G1, "url(#hatch)", G3]
labs = {"cost": "Cost", "carbon": "Carbon", "ttp": "Time-to-power", "deliverability": "Deliv."}
for (k, w_, s_, c_), fl in zip(contrib, fills):
    wpx = c_ * scale
    body += R(x, y + 44, wpx - 3, 56, fill=fl, stroke=INK if fl.startswith("url") or fl == G3 else None, sw=1.2, rx=3)
    body += T(x + 6, y + 128, f"{labs[k]}", 19, 700)
    body += T(x + 6, y + 152, f"{w_ * 100:.0f} % × {s_:.1f} = {c_:.2f}", 19, 400, fill=INK2)
    x += wpx
body += L(bx0 + 100 * scale, y + 36, bx0 + 100 * scale, y + 108, INK3, 2, 'stroke-dasharray="5 4"')
body += T(bx0 + 100 * scale, y + 30, "100", 18, 400, "end", INK3)
total = sum(c[3] for c in contrib)
body += T(x - 4, y + 30, f"= {total:.2f}", 24, 800, "end", ACC)
page("d06-scoring", W, y + 176, body)

# ------------------------------------------------------------------ d07 agreed data flow
y = 20
body = T(40, y + 30, "Agreed data flow: data is fetched at release time, not by the app", 30, 700)
y += 60
cx_ = [40, 440, 850]
cw = [340, 350, 310]
heads = ["Published sources", "Release data build", "Windows program"]
subs = ["online, at each release", "run by the maintainers", "offline, no network"]
for i in range(3):
    body += T(cx_[i] + cw[i] / 2, y + 30, heads[i], 25, 700, "middle")
    body += T(cx_[i] + cw[i] / 2, y + 58, subs[i], 19, 400, "middle", INK3)
y0 = y + 80
srcs = ["ENTSO-E: prices, load, generation", "Ember: grid carbon, prices", "PVGIS / ERA5: solar, weather", "NOAA hourly or EPW: weather",
        "ASHRAE: design conditions", "ECB: exchange rates", "EU ETS carbon, TTF gas", "OpenStreetMap / Protomaps: map"]
for k, s in enumerate(srcs):
    yy = y0 + k * 62
    body += R(cx_[0], yy, cw[0], 52, fill="#fff", stroke=INK3, sw=1.5, rx=6) + T(cx_[0] + 14, yy + 33, s, 18.5, 500)
    body += L(cx_[0] + cw[0], yy + 26, cx_[0] + cw[0] + 24, yy + 26, G1, 1.5)
top_y, bot_y = y0 + 26, y0 + 7 * 62 + 26
mid_y = (top_y + bot_y) / 2
body += L(cx_[0] + cw[0] + 24, top_y, cx_[0] + cw[0] + 24, bot_y, G1, 1.5)
body += L(cx_[0] + cw[0] + 24, mid_y, cx_[1] - 8, mid_y, INK, 2.5, 'marker-end="url(#arr)"')
bh = 300
by = mid_y - bh / 2
body += R(cx_[1], by, cw[1], bh, fill=G4, stroke=INK, sw=2, rx=10)
mid = ["Download and check", "Clean gaps and outliers", "Build hourly profiles", "Record source, date, licence", "Version the data pack"]
for k, s in enumerate(mid):
    body += T(cx_[1] + 22, by + 52 + k * 52, f"{k + 1}. {s}", 19.5, 500)
body += L(cx_[1] + cw[1] + 4, mid_y, cx_[2] - 8, mid_y, INK, 2.5, 'marker-end="url(#arr)"')
body += R(cx_[2], by, cw[2], bh, fill=INK, stroke=INK, sw=2, rx=10)
prog = ["Dated data pack built in", "Every default shows its", "source, year and link", "Engineer overrides any", "value; flags show the rest"]
for k, s in enumerate(prog):
    body += T(cx_[2] + 22, by + 52 + k * 52, s, 19.5, 500, "start", "#fff")
ey = by + bh + 50
body += R(cx_[2], ey, cw[2], 120, fill="#fff", stroke=INK3, sw=1.5, rx=8, extra='stroke-dasharray="6 5"')
body += T(cx_[2] + 18, ey + 36, "Engineer's own data", 20, 700)
body += T(cx_[2] + 18, ey + 66, "EPW weather file, quotes,", 18.5, 400, fill=INK2)
body += T(cx_[2] + 18, ey + 94, "grid offer, IT load", 18.5, 400, fill=INK2)
body += L(cx_[2] + cw[2] / 2, ey - 2, cx_[2] + cw[2] / 2, by + bh + 8, INK, 2.5, 'marker-end="url(#arr)"')
yb = max(y0 + 8 * 62, ey + 120) + 34
body += T(40, yb, "Today the app ships synthetic profiles calibrated to indicative country targets; this flow is the agreed design, not built yet.", 19, 400, fill=INK3)
page("d07-data-flow", W, yb + 24, body)

# ------------------------------------------------------------------ d08 two example hours
hrs = json.load(open(DATA + "/t1-leader-hours.json"))
A = hrs["hUnmet"]["rec"]; B = hrs["hSun"]["rec"]
H8 = 760
body = T(40, 50, "Two hours of the T1 leader in 2029 (grid import limited to 20 MW until July 2029)", 26, 700)
def panel(ox, title, sub, rec, vmax, ticks):
    px0, px1, py0, py1 = ox + 80, ox + 540, 190, H8 - 130
    sy = lambda v: py1 - v / vmax * (py1 - py0)
    s = T(ox, 100, title, 24, 700) + T(ox, 128, sub, 19, 400, fill=INK3)
    for v in ticks:
        s += L(px0, sy(v), px1, sy(v), INK3 if v == 0 else G3, 1)
        s += T(px0 - 10, sy(v) + 6, f"{v}", 18, 400, "end", INK3)
    s += T(px0 - 10, py0 - 26, "MW", 18, 600, "end", INK3)
    bx, bw_ = px0 + 20, 100
    parts = [("Solar", rec["solar"], "url(#dots)"), ("PPA", rec["ppa"], G2), ("Grid", rec["grid"], INK2), ("Unmet", rec["unmet"], "url(#hatch)")]
    yy = 0.0
    for nm, v, fl in parts:
        if v < 1e-6:
            continue
        s += R(bx, sy(yy + v), bw_, sy(yy) - sy(yy + v), fill=fl, stroke=INK, sw=1.2, rx=0)
        hpx = sy(yy) - sy(yy + v)
        if hpx > 40 and nm == "PPA":
            s += T(bx + bw_ / 2, (sy(yy + v) + sy(yy)) / 2 + 7, f"{v:.2f}", 19, 700, "middle")
            s += T(bx + bw_ + 12, (sy(yy + v) + sy(yy)) / 2 + 7, "PPA delivered", 18, 600)
        else:
            s += T(bx + bw_ + 12, (sy(yy + v) + sy(yy)) / 2 + 7, f"{nm} {v:.2f}", 18, 600)
        yy += v
    s += L(bx - 12, sy(rec["demand"]), bx + bw_ + 12, sy(rec["demand"]), ACC, 3)
    s += T(bx + bw_ / 2, sy(rec["demand"]) - 12, f"demand {rec['demand']:.2f}", 18, 700, "middle", ACC)
    cx = px0 + 330
    s += R(cx, sy(rec["ppaContract"]), 80, sy(0) - sy(rec["ppaContract"]), fill="#fff", stroke=INK, sw=2, rx=0, extra='stroke-dasharray="6 4"')
    s += R(cx, sy(rec["ppa"]), 80, sy(0) - sy(rec["ppa"]), fill=G2, stroke=INK, sw=1.2, rx=0)
    s += T(cx + 40, sy(rec["ppaContract"]) - 12, f"contract {rec['ppaContract']:.2f}", 18, 700, "middle")
    s += T(bx + bw_ / 2, py1 + 30, "supply", 18, 600, "middle", INK3) + T(bx + bw_ / 2, py1 + 54, "in the hour", 17, 400, "middle", INK3)
    s += T(cx + 40, py1 + 30, "PPA contract", 18, 600, "middle", INK3) + T(cx + 40, py1 + 54, "vs delivered", 17, 400, "middle", INK3)
    return s
body += panel(40, "2 May 2029, 17:00", "evening: little sun, import limit binds", A, 25, [0, 5, 10, 15, 20, 25])
body += panel(640, "28 June 2029, 11:00", "sunny and windy: contract far above load", B, 120, [0, 20, 40, 60, 80, 100, 120])
body += T(40, H8 - 40, "Solar = on-site PV. PPA = PPA energy delivered over the grid connection. Dashed outline = contracted PPA volume in the hour.", 18, 400, fill=INK3)
body += T(40, H8 - 14, "Note: each panel has its own MW scale.", 18, 600, fill=INK3)
page("d08-hours", W, H8 + 10, body)

# ------------------------------------------------------------------ d10 backup sizing blocks
y = 20
body = T(40, y + 30, "Backup gensets for the T1 leader: N+1 per block of 10", 30, 700)
body += T(40, y + 64, "Critical load 105.1 MW ÷ 2.75 MW per unit = 38.2 → N = 39 units, in 4 blocks; N+1 adds one unit per block.", 20, 400, fill=INK2)
y += 100
blocks = [10, 10, 10, 9]
sq, gap = 62, 12
for b, n in enumerate(blocks):
    yy = y + b * (sq + 26)
    body += T(40, yy + sq / 2 + 8, f"Block {b + 1}", 21, 700)
    for k in range(n + 1):
        xx = 170 + k * (sq + gap)
        red = k == n
        body += R(xx, yy, sq, sq, fill="url(#hatch)" if red else INK2, stroke=INK, sw=1.5, rx=4)
    body += T(170 + (n + 1) * (sq + gap) + 10, yy + sq / 2 + 8, f"{n} + 1", 21, 600, fill=INK2)
y += 4 * (sq + 26) + 10
body += R(40, y, 30, 30, fill=INK2, stroke=INK, sw=1.5, rx=3) + T(80, y + 23, "unit needed to carry the critical load (N)", 20)
body += R(560, y, 30, 30, fill="url(#hatch)", stroke=INK, sw=1.5, rx=3) + T(600, y + 23, "redundant unit (+1 per block)", 20)
body += T(40, y + 70, "Total 43 units × 2.75 MW = 118.25 MW installed; 39 units (107.3 MW) still run if any one unit per block fails.", 20, 600)
page("d10-backup-blocks", W, y + 96, body)

print("diagrams:", sorted(os.listdir(OUT)))
