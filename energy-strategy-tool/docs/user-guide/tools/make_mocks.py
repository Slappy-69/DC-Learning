#!/usr/bin/env python3
"""Generate HTML mock-ups of the agreed (walkthrough 2026-10-21) design, styled with the app's tokens.
Each page carries a visible MOCK-UP banner. Figures come from the T1 example run where stated.
Reads data/t1-top20.json and t1-all.json; writes mock/*.html; shot_mocks.py renders them to src/img/m*.png."""
import json, os, math, html

from pathlib import Path
BASE = str(Path(__file__).resolve().parents[1])  # docs/user-guide; every path below is relative to it
OUT = BASE + "/mock"
DATA = BASE + "/data"
os.makedirs(OUT, exist_ok=True)

top = json.load(open(DATA + "/t1-top20.json"))
allopts = json.load(open(DATA + "/t1-all.json"))

CSS = r"""
:root{--bg:#f6f5f1;--surface:#fff;--surface-2:#efede7;--ink:#1d1f22;--ink-2:#4a4f57;--ink-3:#62676f;--line:#d8d5cc;
--control-border:#888681;--accent:#1f5f8b;--focus:#b4560a;--ok:#1e6b3a;--ok-bg:#e3f1e7;--warn:#7a5200;--warn-bg:#fbf0d4;
--bad:#9b1c1c;--bad-bg:#fbe3e1;--info:#3f4a5a;--info-bg:#e8ecf1;--unv:#6a4b00;--unv-bg:#fff4d6;
--ax-cost:#1f5f8b;--ax-carbon:#2f7d4f;--ax-ttp:#8a4fa3;--ax-deliv:#a2611b;--asm:#5b3d8f;--asm-bg:#efe8fb;
--font:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--bg);color:var(--ink);font:15px/1.45 var(--font);width:1040px;padding:0 0 12px}
.mock{margin:0 0 10px;padding:8px 14px;background:repeating-linear-gradient(135deg,#ece8de 0 10px,#e2ddd0 10px 20px);
border-bottom:2px dashed #8a8579;font-size:13px;font-weight:600;color:#3d3a33;letter-spacing:.02em}
.mock span{font-weight:400}
.wrap{padding:6px 16px}
h2{font-size:19px;margin:6px 0 8px}h3{font-size:16px;margin:12px 0 6px}h4{font-size:14px;margin:10px 0 4px;color:var(--ink-2)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:12px 14px;margin:8px 0}
.row{display:flex;gap:14px}.col{flex:1;min-width:0}
.field{margin:8px 0}.lbl{font-size:13.5px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.unit{color:var(--ink-3)}
.input{border:1px solid var(--control-border);border-radius:4px;padding:6px 9px;background:#fff;font-size:14.5px;min-height:34px;display:flex;align-items:center;justify-content:space-between}
.input.muted{color:var(--ink-3);background:#fbfaf7}
.hint{color:var(--ink-3);font-size:12.5px;margin-top:3px}
.tag{display:inline-block;border-radius:10px;padding:0 7px;font-size:11.5px;line-height:18px;white-space:nowrap}
.tag-unv{background:var(--unv-bg);color:var(--unv);border:1px solid #e7cf86}
.tag-req{background:var(--info-bg);color:var(--info);border:1px solid #c5ceda}
.tag-asm{background:var(--asm-bg);color:var(--asm);border:1px solid #c9b8ea}
.tag-ok{background:var(--ok-bg);color:var(--ok);border:1px solid #a9d3b5}
.tag-warn{background:var(--warn-bg);color:var(--warn);border:1px solid #e3c785}
.tag-bad{background:var(--bad-bg);color:var(--bad);border:1px solid #ecb0aa}
.tag-beta{background:#1d1f22;color:#fff}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}
.chip{border:1px solid var(--control-border);border-radius:14px;padding:3px 11px;font-size:13px;background:#fff}
.chip.on{background:var(--accent);border-color:var(--accent);color:#fff}
.btn{display:inline-block;border:1px solid var(--control-border);border-radius:5px;padding:5px 12px;font-size:13.5px;background:#fff}
.btn.pri{background:var(--accent);border-color:var(--accent);color:#fff}
.seg{display:inline-flex;border:1px solid var(--control-border);border-radius:5px;overflow:hidden}
.seg span{padding:5px 12px;font-size:13.5px;border-right:1px solid var(--control-border);background:#fff}
.seg span:last-child{border-right:0}.seg span.on{background:var(--accent);color:#fff}
.toggle{display:inline-flex;align-items:center;gap:8px;font-size:14px}
.sw{width:36px;height:20px;border-radius:10px;background:#c9c6be;position:relative;display:inline-block}
.sw::after{content:"";position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:2px;left:2px}
.sw.on{background:var(--accent)}.sw.on::after{left:18px}
.pop{border:1px solid #c9b8ea;background:#faf7ff;border-radius:6px;padding:9px 11px;font-size:13px;margin-top:6px}
.pop b{color:var(--asm)}
table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{text-align:left;padding:5px 7px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-weight:600;color:var(--ink-2);font-size:12.5px}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.note{color:var(--ink-3);font-size:12.5px}
.flag{font-size:12.5px;border-radius:4px;padding:3px 7px;margin:3px 0}
.flag.major{background:var(--bad-bg)}.flag.minor{background:var(--warn-bg)}.flag.info{background:var(--info-bg)}.flag.asm{background:var(--asm-bg)}
.sev{font-weight:700;font-size:11px;margin-right:5px;letter-spacing:.03em}
.bar{height:8px;border-radius:4px;background:#e6e3db;position:relative;overflow:hidden}
.bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.kv{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:13.5px}
.kv div:nth-child(odd){color:var(--ink-2)}
.pc{font-size:13px;margin:2px 0}.pc b{font-weight:600}
.plus{color:var(--ok)}.minus{color:var(--bad)}
"""

BANNER = '<div class="mock">MOCK-UP · agreed design, not built yet <span>(walkthrough of 21 October 2026). Layout and wording are illustrative; figures are illustrative unless the caption says they come from the T1 example run.</span></div>'

def page(name, body):
    doc = f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{BANNER}<div class='wrap'>{body}</div></body></html>"
    open(f"{OUT}/{name}.html", "w").write(doc)

def eur_m(x):
    return f"€{x/1e6:,.0f} m"

# ---------------------------------------------------------------- M1 map pin
roads = []
import random
random.seed(7)
svg_roads = ""
# generic street pattern
for y in [60, 140, 205, 290, 360, 430]:
    svg_roads += f'<path d="M0 {y} C 200 {y-20}, 420 {y+25}, 640 {y-5}" stroke="#fff" stroke-width="{6 if y in (205,360) else 3}" fill="none"/>'
for x in [80, 190, 330, 470, 560]:
    svg_roads += f'<path d="M{x} 0 C {x+20} 160, {x-25} 300, {x+10} 480" stroke="#fff" stroke-width="{7 if x==330 else 3}" fill="none"/>'
svg_map = f"""
<svg viewBox="0 0 640 470" width="640" height="470" style="display:block;border:1px solid var(--line);border-radius:6px;background:#ecebe4">
  <rect x="380" y="225" width="150" height="110" fill="#dfe9d6"/>
  <rect x="40" y="300" width="120" height="90" fill="#dfe9d6"/>
  <path d="M0 400 C 120 380, 220 440, 640 395 L640 470 L0 470 Z" fill="#cfe0ea"/>
  {svg_roads}
  <rect x="395" y="236" width="118" height="80" fill="none" stroke="#1d1f22" stroke-width="2" stroke-dasharray="6 4"/>
  <g transform="translate(452,272)"><path d="M0 0 C -12 -18,-14 -30,0 -38 C 14 -30,12 -18,0 0 Z" fill="#b4560a" stroke="#fff" stroke-width="2"/><circle cx="0" cy="-26" r="5" fill="#fff"/></g>
  <rect x="12" y="12" width="250" height="56" rx="5" fill="#fff" stroke="#d8d5cc"/>
  <text x="22" y="34" font-size="13" font-family="Inter,system-ui" fill="#1d1f22">Pin: 52.2900° N, 1.5300° W</text>
  <text x="22" y="54" font-size="12" font-family="Inter,system-ui" fill="#4a4f57">Country from pin: United Kingdom</text>
  <g transform="translate(20,440)"><rect width="60" height="5" fill="#1d1f22"/><rect x="60" width="60" height="5" fill="#fff" stroke="#1d1f22"/><text x="128" y="7" font-size="11" font-family="Inter,system-ui">500 m</text></g>
  <text x="628" y="462" font-size="11" text-anchor="end" font-family="Inter,system-ui" fill="#4a4f57">© OpenStreetMap contributors · offline map (Europe, roads)</text>
  <text x="600" y="30" font-size="15" font-family="Inter,system-ui" fill="#1d1f22">N ▲</text>
</svg>"""
page("m01-location", f"""
<h2>1 · Project and location</h2>
<div class="row">
 <div class="col" style="flex:0 0 340px">
  <div class="field"><div class="lbl">Project name</div><div class="input">Campus A, concept stage</div></div>
  <div class="field"><div class="lbl">Location <span class="tag tag-req">required</span></div>
   <div class="input">Pinned on the map <span class="note">52.2900, −1.5300</span></div>
   <div class="hint">Click the map to move the pin, or type coordinates.</div></div>
  <div class="field"><div class="lbl">Country <span class="tag tag-asm">from pin</span></div><div class="input">United Kingdom ▾</div>
   <div class="hint">Selects the country data: prices, grid carbon, grid timing and cost defaults.</div></div>
  <div class="field"><div class="lbl">Currency</div><div class="input">£ GBP (rate fixed at this release) ▾</div></div>
  <div class="field"><div class="lbl">Analysis start <span class="tag tag-unv">indicative — unverified</span></div><div class="input">2027-01</div></div>
  <div class="field"><div class="lbl">Site area <span class="tag tag-req">required</span></div><div class="input">15 <span class="unit">ha</span></div>
   <div class="hint">One number. Layout and planning constraints are in the Site tab (Beta, off by default).</div></div>
  <div class="field"><div class="lbl">Climate data</div><div class="input muted">Nearest design station: 18 km away</div>
   <div class="pop"><b>Flag:</b> design temperatures come from the nearest weather station, not from the site itself. You can upload an EPW file instead.</div></div>
 </div>
 <div class="col">{svg_map}
  <p class="note">The map is bundled with the Windows program, so it works with no internet connection. Map data © OpenStreetMap contributors (ODbL).</p></div>
</div>""")

# ---------------------------------------------------------------- M2 knowledge levels
page("m02-knowledge-levels", """
<h2>4 · Grid and load: enter what you know</h2>
<p class="note" style="margin-top:-2px">Each input says whether you entered it or the tool is assuming it. Assumed values are flagged on every option that uses them, with their source.</p>
<div class="row">
<div class="col card">
 <h3 style="margin-top:0">Grid connection</h3>
 <div class="field"><div class="lbl">Grid capacity now</div><div class="seg"><span>Known</span><span class="on">Not known</span></div>
  <div class="input muted" style="margin-top:6px">Assumed: 0 MW now <span class="tag tag-asm">assumed default</span></div></div>
 <div class="field"><div class="lbl">Full connection</div><div class="seg"><span>Known</span><span class="on">Not known</span></div>
  <div class="input muted" style="margin-top:6px">Assumed: 120 MW in 48 months <span class="tag tag-asm">assumed default</span></div>
  <div class="pop"><b>Source:</b> country default for the United Kingdom, indicative — unverified (research pending). <b>Used by:</b> all options. Replace with the grid offer when you have it.</div></div>
 <div class="field"><div class="lbl">Grid connection capex</div><div class="input">0 <span class="unit">€</span></div>
  <div class="hint">Default 0. Country typical value shown for reference: Germany EHV construction contribution 96.91 €/kW (50Hertz, 2026). The same fixed charge applies to every option.</div></div>
</div>
<div class="col card">
 <h3 style="margin-top:0">IT load</h3>
 <div class="field"><div class="lbl">IT load at full build</div><div class="seg"><span>Known</span><span class="on">Estimate from area</span></div></div>
 <table>
  <tr><td>Site area</td><td class="num">15 ha</td><td><span class="tag tag-req">entered</span></td></tr>
  <tr><td>Site coverage</td><td class="num">35 %</td><td><span class="tag tag-unv">judgement</span></td></tr>
  <tr><td>Storeys</td><td class="num">1</td><td><span class="tag tag-unv">judgement</span></td></tr>
  <tr><td>IT density benchmark</td><td class="num">5.5 kW/m²</td><td><span class="tag tag-unv">one campus</span></td></tr>
  <tr><td><b>Estimated IT load</b></td><td class="num"><b>≈ 290 MW</b></td><td><span class="tag tag-asm">assumed</span></td></tr>
 </table>
 <div class="pop"><b>How it is worked out:</b> 15 ha × 35 % × 1 storey = 52,500 m² of floor; × 5.5 kW/m² ≈ 290 MW. The benchmark is a single three-storey campus (450 MW on 82,020 m²); it is not known whether its 450 MW is IT or facility load. Override the IT load at any time.</div>
</div>
</div>
<div class="card"><h4 style="margin-top:0">On each option card</h4>
 <div class="flag asm"><span class="sev">ASSUMED</span>Grid full connection 120 MW in 48 months: country default, indicative — unverified. Source: research pending.</div>
 <div class="flag asm"><span class="sev">ASSUMED</span>IT load ≈ 290 MW estimated from site area (35 % coverage, 1 storey, 5.5 kW/m²). Source: one campus benchmark (STACK Erskine Park, 2025).</div>
</div>
""")

# ---------------------------------------------------------------- M3 load shape and flexibility
def day_curve(kind):
    pts = []
    for h in range(0, 25):
        if kind == 'flat':
            v = 0.8
        elif kind == 'fluct':
            v = 0.78 + 0.06 * math.sin(2 * math.pi * (h - 9) / 24)
        elif kind == 'train':
            v = 0.92 if (h % 6) not in (0,) else 0.55
        else:
            v = 0.55 + 0.35 * max(0, math.sin(math.pi * (h - 7) / 16)) if 7 <= h <= 23 else 0.55
        pts.append((h, v))
    return " ".join(f"{20 + h*10:.0f},{90 - v*70:.1f}" for h, v in pts)
cards = ""
for kind, label, on in [("flat", "Flat % of IT", False), ("fluct", "Daily fluctuation", False), ("train", "AI training", True), ("infer", "AI inference", False)]:
    cards += f"""<div class="card" style="flex:1;{'outline:2px solid var(--accent)' if on else ''}"><div style="font-weight:600;font-size:14px">{label}</div>
<svg viewBox="0 0 280 100" width="100%" height="90"><line x1="20" y1="90" x2="260" y2="90" stroke="#bbb"/><polyline points="{day_curve(kind)}" fill="none" stroke="#1f5f8b" stroke-width="2.5"/></svg>
<div class="note">{'Selected · editable defaults shown below' if on else '24 h shape'}</div></div>"""
page("m03-load-flexibility", f"""
<h2>3 · Load shape and flexibility</h2>
<div class="row">{cards}</div>
<div class="row">
 <div class="col card"><h3 style="margin-top:0">AI training profile <span class="tag tag-unv">indicative — unverified</span></h3>
  <table><tr><td>Average utilisation</td><td class="num">90 %</td></tr><tr><td>Checkpoint dip</td><td class="num">to 55 % for 1 h every 6 h</td></tr><tr><td>Ramp between states</td><td class="num">within the hour</td></tr></table>
  <div class="pop"><b>Caveat:</b> the model is hourly, so swings shorter than an hour (training steps, checkpoints of seconds) cannot be shown. They matter for UPS and battery sizing, which this concept tool does not model.</div></div>
 <div class="col card"><h3 style="margin-top:0">Demand flexibility <span class="toggle"><span class="sw on"></span> On</span></h3>
  <div class="note" style="margin-top:-4px">Off by default.</div>
  <table>
   <tr><td>Max curtailable</td><td class="num">10 % of IT</td></tr>
   <tr><td>Max hours per year</td><td class="num">100 h</td></tr>
   <tr><td>Trigger</td><td><span class="chips"><span class="chip on">Price</span><span class="chip">Carbon</span><span class="chip">Weather / grid stress</span></span></td></tr>
   <tr><td>Trigger level</td><td class="num">≥ €250/MWh</td></tr>
   <tr><td>Duration per event · notice</td><td class="num">4 h · 1 h</td></tr>
   <tr><td>Recovery period</td><td class="num">12 h</td></tr>
   <tr><td>Cost of curtailment</td><td class="num">€500/MWh</td></tr>
  </table>
  <h4>Battery response</h4>
  <div class="toggle"><span class="sw on"></span> The battery runs the site in trigger hours instead of curtailing</div>
  <div class="field"><div class="lbl">Hold fixed</div><div class="seg"><span class="on">Battery size</span><span>Trigger threshold</span><span>Hours covered</span></div></div>
  <div class="hint">Default: the tool sizes the battery to cover the historical trigger hours; its capex goes into the finance.</div></div>
</div>""")

# ---------------------------------------------------------------- M4 batteries and backup
page("m04-batteries-backup", """
<h2>5 · Resilience, backup and batteries</h2>
<div class="row">
 <div class="col card"><h3 style="margin-top:0">Requirement</h3>
  <table><tr><td>Backed load</td><td class="num">100 % of IT</td><td><span class="tag tag-unv">default</span></td></tr>
  <tr><td>Topology</td><td class="num">N+1</td><td><span class="tag tag-unv">default</span></td></tr>
  <tr><td>Autonomy</td><td class="num">48 h</td><td><span class="tag tag-unv">default</span></td></tr></table>
  <div class="field"><div class="lbl">Autonomy comes from</div><div class="seg"><span class="on">On-site fuel</span><span>Battery</span><span>Combination</span></div></div>
  <h4>Backup gensets <span class="toggle"><span class="sw on"></span> included</span></h4>
  <table><tr><td>Test running</td><td class="num">6 h/yr per generator</td><td><span class="tag tag-unv">default</span></td></tr>
  <tr><td>Test load</td><td class="num">75 %</td><td><span class="tag tag-unv">default</span></td></tr>
  <tr><td>Run as primary power</td><td class="num">0 h/yr</td><td><span class="note">dispatched and costed if &gt; 0</span></td></tr></table>
 </div>
 <div class="col card"><h3 style="margin-top:0">Batteries: two allocations</h3>
  <svg viewBox="0 0 440 150" width="100%" height="150">
   <rect x="20" y="20" width="400" height="60" rx="6" fill="#e6f4ef" stroke="#199e70"/>
   <rect x="20" y="20" width="70" height="60" rx="6" fill="#199e70"/>
   <text x="55" y="55" font-size="12" text-anchor="middle" fill="#fff" font-family="Inter,system-ui">Reserve</text>
   <text x="250" y="48" font-size="13" text-anchor="middle" font-family="Inter,system-ui">Economic battery</text>
   <text x="250" y="66" font-size="11.5" text-anchor="middle" fill="#4a4f57" font-family="Inter,system-ui">flexibility · arbitrage · carbon shifting</text>
   <text x="20" y="104" font-size="12" font-family="Inter,system-ui">Resilience reserve: always kept, never used for economics.</text>
   <text x="20" y="124" font-size="12" font-family="Inter,system-ui">Default 5 minutes of UPS ride-through at full IT load.</text>
  </svg>
  <table><tr><td>Resilience reserve</td><td class="num">5 min at full IT</td><td><span class="tag tag-unv">default</span></td></tr>
  <tr><td>Longer battery autonomy</td><td class="num">off</td><td><span class="note">site-wide option</span></td></tr>
  <tr><td>Economic battery</td><td class="num">sized by choice C12</td><td></td></tr></table>
 </div>
</div>""")

# ---------------------------------------------------------------- M5 economics
page("m05-economics", """
<h2>6 · Economics</h2>
<div class="row">
<div class="col card">
 <div class="field"><div class="lbl">Evaluation periods (years)</div><div class="chips"><span class="chip on">10</span><span class="chip on">15</span><span class="chip on">20</span><span class="chip">25</span><span class="chip">+ add</span></div><div class="hint">Results are shown for each period you tick.</div></div>
 <div class="field"><div class="lbl">WACC (real) <span class="tag tag-unv">judgement · research</span></div><div class="input">7.0 <span class="unit">%</span></div><div class="hint">The blended return investors require, used as the discount rate.</div></div>
 <div class="field"><div class="lbl">Carbon price</div><div class="input">€82.40/tCO₂ <span class="note">EU ETS, latest market price, 5 Oct 2026</span></div>
  <div class="hint">Latest price with its date (source configured at release). Escalates with the published forecast.</div></div>
 <div class="field"><div class="lbl">Gas price</div><div class="input">€75.75/MWh <span class="note">TTF front month, 5 Oct 2026</span></div>
  <div class="hint">Latest published wholesale price with its date. Override with a current quote.</div></div>
 <div class="field"><div class="lbl">Escalation</div><div class="input">Published forecast per commodity ▾</div></div>
</div>
<div class="col card">
 <div class="field"><div class="lbl">Grid connection capex</div><div class="input">0 <span class="unit">€</span></div>
  <div class="hint">Default 0, flagged as assumed on every option. Country typical value shown with its reference.</div></div>
 <div class="field"><div class="lbl">Grid connection charge</div><div class="input">Fixed, same for every option</div></div>
 <h4>Contracted grid capacity per option</h4>
 <table><tr><th>Option</th><th class="num">Offer</th><th class="num">Contracted</th></tr>
  <tr><td>#1 Grid · Diesel N+1 · DLC</td><td class="num">120 MW</td><td class="num">120 MW</td></tr>
  <tr><td>#7 Grid + gas recips bridge</td><td class="num">120 MW</td><td class="num"><b>80 MW</b> ✎</td></tr>
  <tr><td>#12 Islanded gas + solar + BESS</td><td class="num">120 MW</td><td class="num">0 MW (backup only)</td></tr></table>
 <div class="hint">Set by the engineer for each option. The connection charge stays the same.</div>
 <div class="field"><div class="lbl">Revenue options</div><div class="chips"><span class="chip">Battery arbitrage / grid services</span><span class="chip">Waste-heat reuse</span></div><div class="hint">Off by default.</div></div>
</div></div>""")

# ---------------------------------------------------------------- M6 top 5 cards (T1 data)
five = top[:5]
SHORT = {'grid-binding':'Grid capacity binding','permit-ied':'IED threshold: combustion ≥ 50 MWth','permit-seveso-fuel':'Seveso fuel storage','res-backed':'Backed load not met'}
def rel(vals, i, better='low'):
    v = vals[i]
    s = sorted(vals)
    if better == 'low':
        if v == s[0]: return 'best'
        if v == s[-1]: return 'worst'
    else:
        if v == s[-1]: return 'best'
        if v == s[0]: return 'worst'
    return None
lcoes = [o['lcoe'] for o in five]; carbs = [o['locationG'] for o in five]; capexs = [o['capex'] for o in five]; unm = [o['unmet']['mwh'] for o in five]
cards = ""
for i, o in enumerate(five):
    pros, cons = [], []
    if rel(lcoes, i) == 'best': pros.append("Lowest LCOE of the 5 shown")
    if rel(lcoes, i) == 'worst': cons.append("Highest LCOE of the 5 shown")
    if rel(carbs, i) == 'best': pros.append("Lowest carbon of the 5 shown")
    if rel(carbs, i) == 'worst': cons.append("Highest carbon of the 5 shown")
    if rel(capexs, i) == 'best': pros.append("Lowest capex of the 5 shown")
    if rel(capexs, i) == 'worst': cons.append("Highest capex of the 5 shown")
    if rel(unm, i) == 'best': pros.append("Least unmet load of the 5 shown")
    if rel(unm, i) == 'worst': cons.append("Most unmet load of the 5 shown")
    if not pros: pros.append("n/a: not best on any listed metric")
    if not cons: cons.append("n/a: not worst on any listed metric")
    ax = o['axisScores']
    bars = ''.join(f"<div style='display:flex;align-items:center;gap:6px;font-size:12px'><span style='width:88px'>{lab}</span><div class='bar' style='flex:1'><i style='width:{ax[k]:.0f}%;background:var({col})'></i></div><span style='width:30px;text-align:right'>{ax[k]:.0f}</span></div>"
                   for k, lab, col in [('cost','Cost','--ax-cost'),('carbon','Carbon','--ax-carbon'),('ttp','Time-to-power','--ax-ttp'),('deliverability','Deliverability','--ax-deliv')])
    majors = [f for f in o['flags'] if f['severity'] == 'major']
    cards += f"""<div class="card" style="padding:10px 12px">
 <div style="display:flex;justify-content:space-between;gap:10px"><div><span style="font-weight:700">#{o['rank']}</span> {html.escape(o['name'])}</div><div style="font-size:20px;font-weight:700">{o['score']:.1f}</div></div>
 <div class="row" style="gap:16px;margin-top:6px"><div style="flex:1.2">{bars}</div>
  <div class="kv" style="flex:1"><div>LCOE</div><div>€{o['lcoe']:.0f}/MWh</div><div>Carbon</div><div>{o['locationG']:.0f} g/kWh</div><div>Resilience</div><div>{o['resilience']}</div><div>Capex</div><div>{eur_m(o['capex'])}</div></div>
  <div style="flex:1.3"><div class="pc"><b class="plus">+</b> {' · '.join(pros[:3])}</div><div class="pc"><b class="minus">−</b> {' · '.join(cons[:3])}</div>
  <div class="note">Pros and cons compared against the 5 shown.</div></div></div>
 <div style="margin-top:4px">{''.join(f"<span class='tag tag-bad' style='margin-right:4px'>{SHORT.get(f['id'], f['id'])}</span>" for f in majors)}<span class="tag tag-asm">Assumed defaults used · show sources</span></div>
</div>"""
page("m06-top5", f"""<h2>Results: top 5 options <span class="note" style="font-weight:400">(T1 example run; weights Cost 35 · Carbon 25 · Time-to-power 25 · Deliverability 15)</span></h2>{cards}""")

# ---------------------------------------------------------------- M7 compare 3
c3 = [top[0], top[5], top[11]]
def cell(o, k):
    return {
        'score': f"{o['score']:.1f}", 'lcoe': f"€{o['lcoe']:.0f}/MWh", 'npv': eur_m(o['npv']), 'capex': eur_m(o['capex']),
        'carbon': f"{o['locationG']:.0f} g/kWh", 'cfe': f"{o['cfePct']*100:.0f} %", 'full': f"month {o['ttp']['fullLoadM']}",
        'deliv': f"{o['deliv']:.0f}", 'res': o['resilience'], 'unmet': f"{o['unmet']['mwh']:,.0f} MWh"}[k]
rows = [('score','Weighted score'),('lcoe','LCOE'),('npv','NPV of net cost'),('capex','Capex'),('carbon','Carbon, location-based'),('cfe','Hourly CFE'),('full','Full load'),('deliv','Deliverability'),('res','Resilience'),('unmet','Unmet load (dispatched years)')]
trs = ''.join(f"<tr><td>{lab}</td>{''.join(f'<td class=num>{cell(o,k)}</td>' for o in c3)}</tr>" for k, lab in rows)
diffs = []
for k in ['C2','C3','C8','C10','C12']:
    vals = [o['v'].get(k) for o in c3]
    if len(set(vals)) > 1: diffs.append(f"{k}: " + ' / '.join(str(x) for x in vals))
page("m07-compare", f"""<h2>Compare (up to 3 options)</h2>
<table><tr><th></th>{''.join(f"<th class=num>#{o['rank']} {html.escape(o['name'][:42])}{'…' if len(o['name'])>42 else ''}</th>" for o in c3)}</tr>{trs}</table>
<div class="card"><h4 style="margin-top:0">Differences between the three</h4><div class="note">{'<br>'.join(html.escape(d) for d in diffs)}</div></div>
<p class="note">Figures from the T1 example run (current engine). Pick the options to compare from the result cards or the trade-off chart.</p>""")

# ---------------------------------------------------------------- M8 tornado LCOE with tick boxes
drv = [("IT load (all phases)", 155, 153, True), ("Grid full-connection date", 154, 155, True), ("Grid import price", 142, 173, True), ("WACC (real)", 150, 162, True),
       ("Grid carbon intensity", 154, 154, True), ("Carbon price (Scope 1)", 154, 154, True), ("Gas commodity price", 154, 154, True)]
extra = ["PUE", "Battery capex", "Grid connection capex", "Evaluation period", "Escalation", "Flexibility trigger", "Generator test hours", "Capacity factors", "Capex (all technologies)"]
base = 154
sv = ""
y = 30
x0 = 230; scale = 9
for name, lo, hi, on in sorted(drv, key=lambda d: -abs(d[2]-d[1])):
    a, b = min(lo, hi), max(lo, hi)
    sv += f'<text x="{x0-10}" y="{y+12}" font-size="12.5" text-anchor="end" font-family="Inter,system-ui">{name}</text>'
    sv += f'<rect x="{x0+(a-130)*scale:.1f}" y="{y}" width="{max(2,(b-a)*scale):.1f}" height="16" fill="#3d4148"/>'
    sv += f'<text x="{x0+(b-130)*scale+6:.1f}" y="{y+12}" font-size="11.5" font-family="Inter,system-ui">€{lo}–{hi}</text>'
    y += 28
sv = f'<svg viewBox="0 0 700 {y+30}" width="700" height="{y+30}"><line x1="{x0+(base-130)*scale}" y1="20" x2="{x0+(base-130)*scale}" y2="{y}" stroke="#1d1f22" stroke-dasharray="4 3"/>' + sv + \
     ''.join(f'<text x="{x0+(v-130)*scale}" y="{y+18}" font-size="11" text-anchor="middle" font-family="Inter,system-ui">€{v}</text>' for v in (130,140,150,160,170)) + '</svg>'
ticks = ''.join(f"<div style='font-size:13px;margin:3px 0'>☑ {d[0]}</div>" for d in drv) + ''.join(f"<div style='font-size:13px;margin:3px 0;color:var(--ink-3)'>☐ {e} <span class='tag tag-unv'>agreed, not built</span></div>" for e in extra)
page("m08-tornado", f"""<h2>Sensitivity (tornado)</h2>
<div class="row"><div class="card" style="flex:0 0 300px"><h4 style="margin-top:0">Drivers</h4>{ticks}</div>
<div class="col card"><div class="field"><div class="lbl">Result measured</div><div class="seg"><span class="on">LCOE</span><span>NPV</span><span>Carbon</span><span>Weighted score</span></div></div>
<h4>#1 Grid · Diesel N+1 · DLC · PV 7.7 MWp · PPA hybrid 100 % (LCOE, €/MWh)</h4>{sv}
<p class="note">Bars run from the LCOE at the driver's low value to the LCOE at its high value; the dashed line is the base case (€154/MWh). LCOE values for the seven built drivers are from the T1 example run.</p></div></div>""")

# ---------------------------------------------------------------- M9 PDF export
pages = [("Cover", "Project, date, app and data version, guardrail"), ("1 Inputs", "Every input with its value and whether it was entered or assumed"),
         ("2 Assumptions", "Defaults used, with source, year and link, or judgement"), ("3 Results", "Top 5 options, scores and headline metrics"),
         ("4 Trade-offs", "Cost against carbon, chosen axes"), ("5 Compare", "Up to 3 options side by side"), ("6 Dispatch", "Selected periods"),
         ("7 Sensitivity", "Tornado and drivers"), ("8 Flags", "Every flag on the shown options"), ("9 Method", "Formulas and settings; guardrail")]
thumbs = ''.join(f"""<div style="width:150px;height:200px;background:#fff;border:1px solid var(--line);box-shadow:0 1px 3px rgba(0,0,0,.15);padding:9px;font-size:11.5px;display:flex;flex-direction:column;gap:6px">
<b style="font-size:12.5px">{t}</b><div style="height:5px;background:#d9d6cd"></div><div style="height:5px;width:80%;background:#e4e1d9"></div><div style="height:5px;width:90%;background:#e4e1d9"></div>
<div class="note" style="margin-top:auto">{d}</div></div>""" for t, d in pages)
page("m09-pdf", f"""<h2>Export: one PDF report</h2>
<p class="note" style="margin-top:-2px">Inputs first, results after. No Excel export. The Site tab (Beta) is not included.</p>
<div style="display:flex;flex-wrap:wrap;gap:12px">{thumbs}</div>
<p style="margin-top:12px"><span class="btn pri">Save PDF…</span> <span class="note">Saved with a file dialog; nothing is sent anywhere.</span></p>""")

# ---------------------------------------------------------------- M10 settings
page("m10-settings", """<h2>General settings</h2>
<div class="card"><h3 style="margin-top:0">Features</h3>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><div><b>Site tab</b> <span class="tag tag-beta">Beta</span><div class="note">Site layout, boundary drawing, GeoJSON/KML import and site fit. Hidden by default. When on, it is labelled Beta, and it never affects the ranking or the PDF export.</div></div><span class="sw"></span></div>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><div><b>Theme</b><div class="note">Follow Windows, light or dark.</div></div><span class="input" style="min-height:28px">Follow Windows ▾</span></div>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><b>Run log</b><div class="note">Keep the progress panel open during runs.</div></div><span class="sw on"></span></div>
</div>
<div class="card"><h3 style="margin-top:0">About this copy</h3><div class="kv"><div>App version</div><div>(release number)</div><div>Data version</div><div>(prices, carbon, profiles: dates shown)</div><div>Network</div><div>None: the program never connects to the internet</div></div></div>""")

# ---------------------------------------------------------------- M11 trade-off chart, agreed encoding (T1 data)
W, H = 760, 470; L, R, T, B = 70, 20, 20, 50
fin = [o for o in allopts if o['lcoe'] and math.isfinite(o['lcoe']) and o['lcoe'] < 300 and o['loc'] < 600]
cmin, cmax, kmin, kmax = 100, 600, 125, 300   # carbon on x, cost on y
def sx(v): return L + (v - cmin) / (cmax - cmin) * (W - L - R)
def sy(v): return T + (1 - (v - kmin) / (kmax - kmin)) * (H - T - B)
col = {"Meets": "#1e6b3a", "Meets with flags": "#b07c00", "Does not meet": "#9b1c1c"}
rad = {"Meets": 4.5, "Meets with flags": 3.2, "Does not meet": 2.2}
pts = ''.join(f'<circle cx="{sx(o["loc"]):.1f}" cy="{sy(o["lcoe"]):.1f}" r="{rad.get(o["res"],3)}" fill="{col.get(o["res"],"#888")}" fill-opacity=".55" />' for o in fin[::2])
lab = (f'<circle cx="{sx(top[0]["locationG"]):.1f}" cy="{sy(top[0]["lcoe"]):.1f}" r="9" fill="none" stroke="#b4560a" stroke-width="2.5"/>'
       f'<line x1="{sx(top[0]["locationG"])+6:.1f}" y1="{sy(top[0]["lcoe"])+7:.1f}" x2="{sx(top[0]["locationG"])+26:.1f}" y2="{sy(133):.1f}" stroke="#b4560a" stroke-width="1.5"/>'
       f'<text x="{sx(top[0]["locationG"])+30:.1f}" y="{sy(133)+4:.1f}" font-size="12.5" font-family="Inter,system-ui" fill="#b4560a">#1 to #5 overlap here: all about 113 g/kWh and €154/MWh</text>')
grid = ''.join(f'<line x1="{sx(v):.1f}" y1="{T}" x2="{sx(v):.1f}" y2="{H-B}" stroke="#e4e1d9"/><text x="{sx(v):.1f}" y="{H-B+18}" font-size="12" text-anchor="middle" font-family="Inter,system-ui">{v}</text>' for v in range(100, 601, 100))
grid += ''.join(f'<line x1="{L}" y1="{sy(v):.1f}" x2="{W-R}" y2="{sy(v):.1f}" stroke="#e4e1d9"/><text x="{L-8}" y="{sy(v)+4:.1f}" font-size="12" text-anchor="end" font-family="Inter,system-ui">{v}</text>' for v in range(140, 301, 20))
chart = f'''<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}" style="background:#fff;border:1px solid var(--line);border-radius:6px">{grid}{pts}{lab}
<text x="{(L+W-R)/2}" y="{H-8}" font-size="13" text-anchor="middle" font-family="Inter,system-ui">Carbon, location-based (gCO₂e/kWh), lower is better</text>
<text transform="translate(16,{(T+H-B)/2}) rotate(-90)" font-size="13" text-anchor="middle" font-family="Inter,system-ui">Cost: LCOE (€/MWh), lower is better</text></svg>'''
legend = ''.join(f'<span style="display:inline-flex;align-items:center;gap:6px;margin-right:14px;font-size:13px"><svg width="14" height="14"><circle cx="7" cy="7" r="{rad[k]+1}" fill="{c}" fill-opacity=".7"/></svg>{k}</span>' for k, c in col.items())
page("m11-tradeoff", f"""<h2>Trade-offs: cost against carbon</h2>
<div style="display:flex;gap:12px;align-items:center;margin-bottom:6px;flex-wrap:wrap"><span>Vertical axis</span><span class="input" style="min-height:28px">Cost: LCOE ▾</span><span>Horizontal axis</span><span class="input" style="min-height:28px">Carbon ▾</span><span class="note">either axis can switch, for example to time-to-power or deliverability</span></div>
{chart}<div style="margin-top:6px">{legend}<span class="note">Resilience status sets bubble size and colour. Ringed: the top 5.</span></div>
<p class="note">Points: every other option of the T1 example run with a finite LCOE below €300/MWh (current engine).</p>""")

print("mock-ups written:", sorted(os.listdir(OUT)))
