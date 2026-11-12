"""Build slides and timeline.json from the shots, the voice lines and the plan below."""
import json, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from engine import fit_rect, font, W, H, ACCENT
from script4 import LINES

SH = 'shots/'
S = 3
IMG = (4800, 2700)
CAP = {k: c for k, c, t in LINES}
DUR = json.load(open('voice/durations4.json'))
S4 = 'shots4/'
os.makedirs('slides4', exist_ok=True)

def R(x, y, w, h): return [x * S, y * S, w * S, h * S]
def cam(x, y, w, h, pad=0.06, min_w=None): return list(fit_rect(R(x, y, w, h), IMG, pad, min_w=min_w * S if min_w else None))
def zoomed(r, f=0.96):
    x, y, w, h = r; nw, nh = w * f, h * f
    return [x + (w - nw) / 2, y + (h - nh) / 2, nw, nh]

# ---------- pin and markers on the high-resolution maps ----------
COLS = {'pin': (0xb3, 0x26, 0x1e), 'wind': (0x2b, 0x7b, 0xb9), 'solar': (0xd4, 0xb1, 0x06), 'hydro': (0x3a, 0x9d, 0x8f)}
def blobs(path, key):
    im = cv2.imread(path)[:, :, ::-1].astype(int)
    m = (np.abs(im - np.array(COLS[key])).sum(axis=2) < 40).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(m)
    return [tuple(cen[i]) for i in range(1, n) if st[i, 4] > 30]
LADDER = []
for z in [1, 2, 4, 8, 16]:
    p = f'{SH}maphi-z{z}.png'
    pin = blobs(p, 'pin')[0]
    iw, ih = Image.open(p).size
    h = iw * 9 / 16
    cy = (ih - h / 2) if z == 1 else pin[1]
    LADDER.append({'img': p, 'pin': list(pin), 'size': [iw, ih], 'rect': [0, cy - h / 2, iw, h]})
z32 = f'{SH}maphi-z32.png'
pin32 = blobs(z32, 'pin')[0]
hyd = sorted(blobs(z32, 'hydro'), key=lambda c: (c[0] - pin32[0]) ** 2 + (c[1] - pin32[1]) ** 2)
wind = blobs(z32, 'wind')[0]; solar = blobs(z32, 'solar')[0]
pts = [pin32, wind, solar] + hyd
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
mw = (max(xs) - min(xs)) * 2.6
MAPR = [cx - mw / 2 - 40, cy - mw * 9 / 32, mw, mw * 9 / 16]

# ---------- slides ----------
def title_slide():
    src = Image.open(f'{SH}maphi-z16.png').convert('RGB')
    iw, ih = src.size; pin = LADDER[4]['pin']
    cw = 2000; ch = cw * 9 / 16
    x0 = pin[0] - 0.7 * cw; y0 = pin[1] - 0.5 * ch
    bg = src.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.LANCZOS)
    grad = Image.new('L', (W, 1))
    for x in range(W): grad.putpixel((x, 0), int(240 * max(0.0, min(1.0, 1.15 - x / (W * 0.62)))))
    grad = grad.resize((W, H))
    dark = Image.new('RGB', (W, H), (11, 16, 22))
    im = Image.composite(dark, bg, grad)
    d = ImageDraw.Draw(im)
    d.text((120, 300), 'WALKTHROUGH  ·  CONCEPT ENERGY OPTIONEERING TOOL', font=font(26, 'SemiBold'), fill=ACCENT)
    d.text((114, 350), 'Pego, Portugal', font=font(124, 'Bold'), fill=(255, 255, 255))
    d.text((120, 510), 'A 750 MW AI campus with only 300 MW of grid', font=font(46, 'Medium'), fill=(225, 230, 236))
    d.text((120, 590), 'IT load 750 MW  ·  PUE 1.25 annual, 1.45 design day  ·  grid 300 MW', font=font(30, 'Medium'), fill=(170, 182, 194))
    im.save('slides4/title.png')
    return None

def report_slide():
    im = Image.new('RGB', (W, H), (14, 19, 26))
    d = ImageDraw.Draw(im)
    pages = [1, 2, 3, 5, 9, 10]
    ph = 760
    for i, p in enumerate(pages):
        pg = Image.open(f'pdf4/p-{p:02d}.jpg').convert('RGB')
        pw = int(pg.width * ph / pg.height)
        pg = pg.resize((pw, ph), Image.LANCZOS)
        x = 100 + i * 250; y = 150 + (i % 2) * 24
        sh = Image.new('RGBA', (pw + 60, ph + 60), (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle((30, 30, pw + 30, ph + 30), fill=(0, 0, 0, 160))
        sh = sh.filter(ImageFilter.GaussianBlur(14))
        im.paste(sh, (x - 22, y - 14), sh)
        im.paste(pg, (x, y))
    d.text((110, 60), 'PDF report: 29 pages, saved from the run', font=font(40, 'SemiBold'), fill=(255, 255, 255))
    im.save('slides4/report.png')

def end_slide():
    im = Image.new('RGB', (W, H), (12, 17, 23)); d = ImageDraw.Draw(im)
    d.text((120, 96), 'PEGO  ·  750 MW IT  ·  300 MW GRID  ·  TOP THREE STRATEGIES', font=font(26, 'SemiBold'), fill=ACCENT)
    d.text((116, 136), 'Three costed ways to close the gap', font=font(58, 'Bold'), fill=(255, 255, 255))
    cards = [
        ('#1', "Buy two of Elecgás' units", 'Gas for the shortfall, then backup', '€140/MWh', '€313 m capex', 'Resilience gap flagged', False),
        ('#2', 'Buy the whole plant', 'And Margalha Solar outright', '€141/MWh', '€401 m capex', 'Resilience gap flagged', False),
        ('#3', 'Gas engines + contract', '120 engines, Elecgás top-up', '€136/MWh', '€1.26 bn capex', 'Meets, with flags', True),
    ]
    for i, (rk, t1, t2, l, c, res, ok) in enumerate(cards):
        x = 120 + i * 570; y = 300
        d.rounded_rectangle((x, y, x + 530, y + 480), radius=22, fill=(24, 32, 42), outline=(52, 64, 78), width=2)
        d.text((x + 34, y + 30), rk, font=font(40, 'Bold'), fill=ACCENT)
        d.text((x + 34, y + 92), t1, font=font(36, 'Bold'), fill=(255, 255, 255))
        d.text((x + 34, y + 142), t2, font=font(26, 'Medium'), fill=(170, 182, 194))
        d.text((x + 34, y + 220), l, font=font(56, 'Bold'), fill=(255, 255, 255))
        d.text((x + 34, y + 296), c, font=font(32, 'Medium'), fill=(210, 218, 226))
        col = (88, 196, 120) if ok else (240, 120, 100)
        d.rounded_rectangle((x + 34, y + 384, x + 34 + font(26, 'SemiBold').getlength(res) + 40, y + 436), radius=26, fill=col + (0,) if False else (col[0] // 4 + 10, col[1] // 4 + 10, col[2] // 4 + 10), outline=col, width=2)
        d.text((x + 54, y + 394), res, font=font(26, 'SemiBold'), fill=col)
    d.text((120, 860), 'Concept-stage screening. LCOE and capex are indicative: the defaults behind them are labelled "indicative — unverified" until checked.', font=font(24, 'Medium'), fill=(150, 162, 174))
    d.text((120, 896), 'All three take Margalha Solar (120 MW); about two-thirds of the energy comes from gas burnt at or next to the site.', font=font(24, 'Medium'), fill=(150, 162, 174))
    im.save('slides4/end.png')

def credits_slide():
    im = Image.new('RGB', (W, H), (8, 11, 15)); d = ImageDraw.Draw(im)
    rows = [
        ('Voice', 'Piper text-to-speech, British English southern female voice, trained on the OpenSLR 83 dataset (CC BY-SA 4.0)'),
        ('Power plant data', 'powerplantmatching, PyPSA (CC BY 4.0), bundled with the tool'),
        ('Map', 'Natural Earth 1:50m countries (public domain), bundled with the tool'),
        ('Filmed on', 'The concept energy tool, main (9c356e2), 8 November 2026'),
        ('Assumed for the demo', 'Phasing, 300 MW of grid for life, the AI training load, density and site area, and both plant prices'),
    ]
    d.text((160, 250), 'Credits', font=font(56, 'Bold'), fill=(255, 255, 255))
    for i, (k, v) in enumerate(rows):
        y = 360 + i * 104
        d.text((160, y), k, font=font(28, 'SemiBold'), fill=ACCENT)
        from engine import wrap
        for j, ln in enumerate(wrap(v, font(28, 'Medium'), W - 520 - 120)):
            d.text((520, y + j * 38), ln, font=font(28, 'Medium'), fill=(220, 226, 232))
    im.save('slides4/credits.png')

title_slide(); report_slide(); end_slide(); credits_slide()
FULL = [0, 0, W, H]

# ---------- the plan ----------
B = []
def beat(key, img=None, rect=None, rect2=None, boxes=(), **kw):
    b = {'key': key, 'img': img, 'rect': rect, 'rect2': rect2 or (zoomed(rect, 0.975) if rect else None), 'boxes': [list(x) for x in boxes]}
    b.update(kw); B.append(b); return b
def lab(text, x, y, dx=12, dy=-20, **kw): return dict(text=text, at=[x * S, y * S], dx=dx, dy=dy, **kw)
P = lambda n: S4 + n + '.jpg'
T = 'slides4/title.png'
L1 = dict(text='Pego coal power station · closed 2021', x=120, y=680, size=30)
L2 = dict(text='Elecgás gas plant · 836 MW · next door', x=120, y=745, size=30)
L3 = dict(text='The brief: 750 MW of AI, 300 MW of grid', x=120, y=810, size=30, dark=False)
beat('t1', T, FULL, [24, 13.5, W - 48, H - 27], section=None, scene='title')
beat('t2', T, [24, 13.5, W - 48, H - 27], [48, 27, W - 96, H - 54], trans='move', slide_labels=[dict(L1, t=0.4), dict(L2, t=2.6)])
beat('t3', T, [48, 27, W - 96, H - 54], [72, 40.5, W - 144, H - 81], trans='move', slide_labels=[dict(L1, t=-1), dict(L2, t=-1), dict(L3, t=0.4)])
beat('t4', T, [72, 40.5, W - 144, H - 81], [90, 50.6, W - 180, H - 101], trans='move', slide_labels=[dict(L1, t=-1), dict(L2, t=-1), dict(L3, t=-1)])
# The tool
beat('a1', P('a01-reset'), [0, 0, 4800, 2700], section='The tool', scene='tool', labels=[lab('Inputs', 150, 660, dx=0, dy=0, size=40), lab('Results', 940, 660, dx=0, dy=0, size=40)])
beat('a2', P('a01-reset'), [0, 0, 4800, 2700], boxes=[R(990, 20, 125, 30)], trans='move', box_at=0.2)
beat('a3', P('a02-gs'), cam(16, 30, 1568, 420, 0.02), boxes=[R(33, 140, 700, 50)])
# Location
beat('m1', None, kind='mapzoom', ladder=LADDER, k=2, section='1 · Location', scene='location', zoom_from=0.5, slide_labels=[dict(text='Pego', x=990, y=505, t=6.0, size=34)])
beat('m2', P('a04-map'), cam(0, 230, 400, 640, 0.03), boxes=[R(14, 828, 371, 33), R(14, 675, 372, 76)])
beat('m3', P('a03-report-details'), cam(0, 0, 400, 320, 0.06), boxes=[R(14, 0, 371, 304)])
# First run inputs
beat('f1', P('a05-firstrun'), cam(12, 36, 375, 510, 0.05), boxes=[R(8, 32, 383, 518)], section='2 · First-run inputs', scene='firstrun')
beat('f2', P('a05-firstrun'), cam(12, 36, 375, 510, 0.05), boxes=[R(12, 195, 183, 83), R(205, 195, 183, 83)], trans='move', box_at=0.2)
beat('f3', P('a05-firstrun'), cam(12, 150, 375, 300, 0.1), boxes=[R(205, 195, 183, 83)], trans='move', labels=[lab('PUE = facility power ÷ IT power', 400, 218, dx=20, dy=0)])
beat('f4', P('a05-firstrun'), cam(12, 150, 375, 300, 0.1), boxes=[R(205, 294, 183, 122)], trans='move', labels=[lab('750 MW × 1.45 = 1,088 MW', 400, 330, dx=20, dy=0)])
beat('f5', P('a06-help'), cam(150, 380, 300, 500, 0.04), boxes=[R(205, 420, 183, 470), R(209, 392, 24, 24)])
beat('f6', P('a05-firstrun'), cam(12, 300, 375, 260, 0.1), boxes=[R(12, 432, 183, 106), R(205, 432, 183, 106)], assumed='Grid: 300 MW from the start, and never more')
# Site, load and requirements
beat('g1', P('a07-site-inputs'), cam(0, 0, 400, 320, 0.06), boxes=[R(14, 0, 371, 56), R(14, 202, 181, 105), R(205, 202, 181, 105)], section='3 · Site, load and requirements', scene='load')
beat('g2', P('a08-phases'), cam(14, 0, 371, 480, 0.04), boxes=[R(14, 0, 371, 336), R(14, 354, 372, 124)], assumed='A standard build rate: one 125 MW phase a year, 2029 to 2034')
beat('g3', P('a09-load'), cam(0, 0, 400, 460, 0.04), boxes=[R(14, 227, 181, 124), R(205, 227, 181, 124), R(14, 367, 181, 83), R(205, 367, 181, 83)], assumed='AI training load: 90 %, dipping to 55 % for 1 h every 6 h')
beat('g4', P('a10-pue-density'), cam(0, 0, 400, 340, 0.06), boxes=[R(14, 219, 181, 106)], assumed='3 kW/m² of white space on a 90 ha site')
beat('g5', P('a12-economics'), cam(0, 40, 400, 620, 0.03), boxes=[R(14, 48, 181, 180), R(205, 48, 181, 180), R(14, 506, 371, 139)])
beat('g6', P('a13-requirements'), cam(0, 40, 400, 460, 0.03), boxes=[R(14, 48, 181, 105), R(205, 48, 181, 105), R(14, 169, 181, 105)])
beat('g7', P('a14-ticks'), cam(16, 0, 367, 520, 0.05), boxes=[R(16, 0, 367, 520)])
beat('g8', P('a15-choices'), cam(0, 0, 400, 600, 0.03), boxes=[R(14, 0, 371, 300)])
# First run
beat('r1', P('a16-progress'), cam(416, 330, 1168, 560, 0.02), boxes=[R(416, 383, 1168, 494)], section='4 · First run', scene='run1')
beat('r2', P('a17-summary-rules'), cam(416, 0, 1168, 880, 0.02), boxes=[R(790, 20, 400, 860)])
beat('r3', P('a18-results1'), cam(416, 83, 1168, 300, 0.04), boxes=[R(427, 94, 223, 127), R(658, 94, 223, 127), R(416, 349, 1168, 31)])
# Nearby
beat('n1', P('b01-nearby'), cam(416, 0, 1168, 420, 0.03), boxes=[R(610, 85, 461, 21), R(428, 235, 560, 120)], section='5 · What is nearby', scene='nearby')
beat('n2', z32, MAPR, zoomed(MAPR, 0.94), labels=[
    dict(text='Elecgás Pego · gas · 836 MW · 0.7 km', at=list(pin32), dx=-560, dy=30),
    dict(text='Belver · hydro · 81 MW · 9.6 km', at=list(hyd[0]), dx=26, dy=-4),
    dict(text='Margalha Solar · 120 MW · 17.9 km', at=list(solar), dx=26, dy=18),
    dict(text='Serra da Amêndoa · wind · 24 MW · 19.6 km', at=list(wind), dx=26, dy=-28),
    dict(text='Castelo de Bode · hydro · 159 MW · 20.1 km', at=list(hyd[1]), dx=26, dy=-30)],
    rings=[dict(c=list(pin32), r=16 * 10, text='10 km'), dict(c=list(pin32), r=16 * 25, text='25 km')], box_at=0.8)
beat('n3', P('b02-pick'), cam(416, 0, 1168, 420, 0.03), boxes=[R(428, 268, 342, 26), R(610, 85, 461, 21), R(1078, 80, 134, 30)])
beat('n4', P('b03-plant-table'), cam(0, 200, 410, 760, 0.03), boxes=[R(15, 229, 394, 99), R(14, 474, 181, 34), R(14, 618, 181, 34), R(14, 690, 181, 34)])
beat('n5', P('b05-plant-uses'), cam(16, 150, 367, 260, 0.1), boxes=[R(29, 189, 166, 33), R(205, 189, 166, 34), R(29, 261, 166, 34), R(29, 333, 342, 33)], assumed='Elecgás contract: running cost + €10/MWh, 400 MW, private wire')
beat('n6', P('b06-margalha'), cam(16, 150, 367, 320, 0.1), boxes=[R(205, 239, 166, 33), R(205, 383, 166, 34)], assumed='Margalha Solar contract: €45/MWh, through the public grid')
# New run
beat('s1', P('c01-results2'), cam(416, 83, 1168, 340, 0.04), boxes=[R(427, 94, 223, 146), R(416, 367, 1168, 50)], section='6 · The new run', scene='run2')
beat('s2', P('c03-summary'), cam(416, 0, 1168, 568, 0.03), boxes=[R(416, 0, 1168, 568)], spot=True)
beat('s3', P('c04-top5'), cam(416, 60, 873, 570, 0.03), boxes=[R(416, 69, 285, 553), R(711, 69, 285, 553), R(1005, 69, 285, 553)])
# Option 1
beat('o1', P('d1-a'), cam(417, 0, 1000, 260, 0.03), boxes=[R(433, 12, 1150, 24)], section="Option #1 · Buy two of Elecgás' units", scene='opt1')
beat('o2', P('d1-a'), cam(417, 250, 1000, 450, 0.03), boxes=[R(433, 560, 567, 24), R(433, 608, 567, 25)], trans='move', box_at=0.3)
beat('o3', P('d1-a'), cam(417, 250, 1183, 450, 0.03), boxes=[R(1020, 293, 567, 24)], trans='move', box_at=0.3)
beat('o4', P('d1-c'), cam(417, 0, 900, 170, 0.04), boxes=[R(433, 32, 640, 110)])
beat('o5', P('d1-c'), cam(417, 0, 1183, 600, 0.03), boxes=[R(433, 32, 640, 110)], trans='move', spot=True, box_at=0.2)
beat('o6', P('d1-comment-edit'), cam(433, 40, 1167, 300, 0.03), boxes=[R(441, 67, 1150, 230)])
# Option 2
beat('o7', P('d2-a'), cam(417, 0, 1000, 760, 0.03), boxes=[R(433, 12, 814, 24), R(433, 577, 567, 24), R(433, 625, 567, 25)], section='Option #2 · Buy the whole plant', scene='opt2')
beat('o8', P('d2-a'), cam(417, 0, 1183, 300, 0.03), boxes=[R(433, 55, 1150, 40)], trans='move', box_at=0.3)
# Option 3
beat('o9', P('d3-b'), cam(417, 0, 1183, 340, 0.03), boxes=[R(451, 70, 1130, 20), R(451, 113, 1130, 42)], section='Option #3 · Gas engines + Elecgás contract', scene='opt3')
beat('o10', P('d3-a'), cam(417, 250, 1000, 450, 0.03), boxes=[R(433, 560, 567, 24), R(433, 608, 567, 25)])
beat('o11', P('d3-c'), cam(417, 0, 1183, 220, 0.04), boxes=[R(433, 116, 1100, 24)])
# Weights, filters, table
beat('w1', P('e01-weights'), cam(0, 0, 400, 460, 0.04), boxes=[R(25, 33, 349, 66)], section='Your priorities', scene='weights')
beat('w2', P('e02-weights-header'), cam(416, 83, 1168, 340, 0.03), boxes=[R(416, 367, 1168, 50), R(658, 248, 223, 108)])
beat('w3', P('f01-filter-meets'), cam(416, 0, 1168, 640, 0.02), boxes=[R(500, 0, 57, 28), R(417, 218, 1168, 300)])
beat('w4', P('f02-search'), cam(416, 0, 1168, 640, 0.02), boxes=[R(671, 74, 180, 32)])
beat('w5', P('f03-sort-lcoe'), cam(416, 0, 1168, 640, 0.02), boxes=[R(1171, 0, 102, 24), R(417, 30, 1168, 200)])
# Compare and trade-offs
beat('c1', P('g01-compare'), cam(416, 30, 1168, 560, 0.02), boxes=[R(417, 255, 1166, 22), R(417, 303, 1166, 22), R(417, 451, 1166, 22)], section='Compare and trade-offs', scene='compare')
beat('c2', P('g01-compare'), cam(416, 480, 1168, 380, 0.02), boxes=[R(416, 600, 1168, 230)], trans='move', box_at=0.3)
beat('c3', P('g03-tradeoffs'), cam(416, 180, 1168, 520, 0.02))
beat('c4', P('g04-tradeoffs-capex'), cam(416, 0, 1168, 700, 0.02), boxes=[R(731, 28, 212, 32)])
# Dispatch
beat('d1', P('h01-dispatch'), cam(429, 120, 1142, 360, 0.03), boxes=[R(846, 297, 712, 95), R(465, 390, 1093, 32)], section='Dispatch', scene='dispatch')
beat('d2', P('h02-dv-y4'), cam(429, 280, 1142, 320, 0.03), labels=[lab('checkpoint dips', 1330, 505, dx=14, dy=-10), lab('rooftop solar', 556, 548, dx=10, dy=-70)])
beat('d3', P('h03-dv-3days'), cam(429, 200, 1142, 400, 0.03), boxes=[R(429, 223, 600, 32)], labels=[lab('Elecgás gas plant', 560, 500, dx=0, dy=0)])
beat('d4', P('h04-balance'), cam(429, 360, 1142, 420, 0.03), boxes=[R(429, 373, 1142, 300)])
# Site
beat('i1', P('i01-site1'), cam(429, 60, 1150, 680, 0.02), boxes=[R(429, 198, 678, 505)], section='Site (Beta)', scene='site')
beat('i2', P('i02-site3'), cam(429, 60, 1150, 680, 0.02), boxes=[R(478, 388, 435, 245), R(1112, 251, 380, 24)])
# Sensitivity
beat('x1', P('j01-tornado'), cam(416, 40, 1168, 320, 0.03), boxes=[R(775, 137, 690, 24)], section='Sensitivity and uncertainty', scene='sens')
beat('x2', P('j02-breakevens'), cam(416, 80, 1168, 500, 0.02), boxes=[R(1065, 100, 140, 62), R(429, 540, 700, 22)])
beat('x3', P('j03-mc'), cam(416, 60, 1168, 300, 0.02), boxes=[R(430, 82, 760, 22), R(430, 138, 1150, 22)])
# Study, report and end
beat('k1', P('k02-reopened'), cam(416, 83, 1168, 380, 0.03), boxes=[R(416, 367, 1168, 44)], section='Study and report', scene='report')
beat('e1', 'slides4/report.png', FULL, [30, 17, W - 60, H - 34], section=None)
beat('e2', P('j04-header-mc'), cam(416, 83, 1168, 268, 0.04), boxes=[R(889, 232, 223, 108)], section='Defaults')
beat('e3', 'slides4/end.png', FULL, [12, 7, W - 24, H - 14], scene='end')
beat('credits', 'slides4/credits.png', FULL, FULL, scene='credits', hold=6.5)

# ---------- timing ----------
LEAD, TAIL = 0.35, 0.3
t = 0.0
scenes = []
cur_sec = None; sec_t0 = 0
for i, b in enumerate(B):
    k = b['key']
    if b.get('scene'):
        if scenes: scenes[-1]['t1'] = t
        scenes.append({'name': f"{len(scenes) + 1:02d}-{b['scene']}", 't0': t})
    if 'section' in b:
        cur_sec = b['section']; sec_t0 = t
    b['section'] = cur_sec; b['section_t0'] = sec_t0
    b['t0'] = t
    if k in DUR:
        d = DUR[k]['dur']
        lead = 0.6 if i == 0 else LEAD
        if b.get('kind') == 'mapzoom': lead = 0.4
        b['say'] = CAP[k]; b['say_t0'] = lead; b['say_dur'] = d; b['wav'] = DUR[k]['file']
        b['dur'] = lead + d + TAIL + b.get('extra', 0)
    else:
        b['dur'] = b.get('hold', 3)
    if b.get('kind') == 'mapzoom':
        b['zoom_to'] = b['dur'] - 1.4
    t += b['dur']
scenes[-1]['t1'] = t
# the first beat of the credits has no section chip; titles have none
for b in B:
    if b['scene' if False else 'key'] in ('t1', 't2', 't3', 't4', 'e3', 'credits'): b['section'] = None
tl = {'beats': B, 'scenes': scenes, 'total': t, 'end_fade': 1.0}
json.dump(tl, open('timeline4.json', 'w'), indent=1)
print(f'{len(B)} beats, {len(scenes)} scenes, {t:.1f} s ({int(t // 60)}:{t % 60:04.1f})')
for s in scenes: print(f"  {s['name']:<16} {s['t0']:6.1f} → {s['t1']:6.1f}")
