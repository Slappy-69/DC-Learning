"""Frame renderer for the walkthrough: beats on one timeline, one encoded file per scene.

A beat shows one image (a 3x screenshot, a map or a composed slide) through a camera rectangle in image pixels,
with highlight boxes and labels in the same coordinates, and a caption (the narration sentence) at the bottom.
"""
import math, os, subprocess, functools
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1920, 1080, 30
FONT_DIR = '/usr/share/fonts/opentype/inter/'
def font(size, weight='Medium'):
    return ImageFont.truetype(f'{FONT_DIR}Inter-{weight}.otf', size)

ACCENT = (242, 169, 0)       # amber highlight
INK = (17, 24, 32)

def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)

@functools.lru_cache(maxsize=12)
def load(path):
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im is None:
        raise FileNotFoundError(path)
    levels = [im]
    while levels[-1].shape[1] > 2400:
        levels.append(cv2.resize(levels[-1], (levels[-1].shape[1] // 2, levels[-1].shape[0] // 2), interpolation=cv2.INTER_AREA))
    return levels

def view(path, rect, out=(W, H)):
    """Render image `path` through rect (x, y, w, h in full-image pixels) to out size; aspect is kept by the rect."""
    levels = load(path)
    x, y, w, h = rect
    scale = out[0] / w
    lvl = 0
    while lvl + 1 < len(levels) and scale * (2 ** (lvl + 1)) <= 1.3:
        lvl += 1
    f = 2 ** lvl
    src = levels[lvl]
    s = scale * f
    M = np.array([[s, 0, -x / f * s], [0, s, -y / f * s]], dtype=np.float64)
    return cv2.warpAffine(src, M, out, flags=cv2.INTER_LINEAR if s <= 1.05 else cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(245, 244, 240))

def fit_rect(box, img_wh, pad=0.08, aspect=W / H, min_w=None):
    """Camera rect (x, y, w, h) around box with padding, at the frame aspect, kept inside the image when possible."""
    bx, by, bw, bh = box
    iw, ih = img_wh
    w = bw * (1 + 2 * pad); h = bh * (1 + 2 * pad)
    if min_w: w = max(w, min_w)
    if w / h < aspect: w = h * aspect
    else: h = w / aspect
    if w > iw: w = iw; h = w / aspect
    if h > ih: h = ih; w = h * aspect
    cx, cy = bx + bw / 2, by + bh / 2
    x = min(max(cx - w / 2, 0), iw - w) if w <= iw else (iw - w) / 2
    y = min(max(cy - h / 2, 0), ih - h) if h <= ih else (ih - h) / 2
    return (x, y, w, h)

def lerp_rect(a, b, t, eased=True):
    # geometric interpolation of size keeps zoom speed even
    t = ease(t) if eased else min(1.0, max(0.0, t))
    wa, wb = a[2], b[2]
    w = wa * (wb / wa) ** t if wa > 0 and wb > 0 else wa + (wb - wa) * t
    h = w * (a[3] / a[2] + (b[3] / b[2] - a[3] / a[2]) * t)
    # centre linear
    cxa, cya = a[0] + a[2] / 2, a[1] + a[3] / 2
    cxb, cyb = b[0] + b[2] / 2, b[1] + b[3] / 2
    if eased:
        cx = cxa + (cxb - cxa) * t; cy = cya + (cyb - cya) * t
    else:
        # in a pure zoom the centre moves with the size, so a fixed point stays fixed
        r = (w - wa) / (wb - wa) if abs(wb - wa) > 1e-9 else t
        cx = cxa + (cxb - cxa) * r; cy = cya + (cyb - cya) * r
    return (cx - w / 2, cy - h / 2, w, h)

def to_screen(box, rect):
    x, y, w, h = rect
    s = W / w
    return ((box[0] - x) * s, (box[1] - y) * s, box[2] * s, box[3] * s)

# ---------- overlays ----------
def wrap(text, fnt, maxw):
    words = text.split(); lines = []; cur = ''
    for wd in words:
        t = (cur + ' ' + wd).strip()
        if fnt.getlength(t) <= maxw: cur = t
        else:
            if cur: lines.append(cur)
            cur = wd
    if cur: lines.append(cur)
    return lines

@functools.lru_cache(maxsize=64)
def caption_img(text):
    fnt = font(36, 'Medium')
    lines = wrap(text, fnt, W - 360)
    if len(lines) == 2:
        # balance two lines: split at the space nearest the middle that still fits
        words = text.split(); best = None
        for i in range(1, len(words)):
            a, b = ' '.join(words[:i]), ' '.join(words[i:])
            la, lb = fnt.getlength(a), fnt.getlength(b)
            if max(la, lb) <= W - 360 and (best is None or max(la, lb) < best[0]): best = (max(la, lb), [a, b])
        if best: lines = best[1]
    lh = 48
    bh = lh * len(lines) + 36
    img = Image.new('RGBA', (W, bh + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    widest = max(fnt.getlength(l) for l in lines)
    bx0 = (W - widest) / 2 - 34; bx1 = (W + widest) / 2 + 34
    d.rounded_rectangle((bx0, 10, bx1, 10 + bh), radius=16, fill=(12, 17, 23, 205))
    for i, l in enumerate(lines):
        lw = fnt.getlength(l)
        d.text(((W - lw) / 2, 10 + 18 + i * lh), l, font=fnt, fill=(255, 255, 255, 255))
    return np.array(img)

@functools.lru_cache(maxsize=64)
def tag_img(kind, text):
    """Top-left chips: kind 'section' (title of the step) or 'assumed' (an assumption made for the demo)."""
    if kind == 'section':
        fnt = font(30, 'SemiBold'); pad = 18
        tw = fnt.getlength(text)
        img = Image.new('RGBA', (int(tw + 2 * pad + 20), 64), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
        d.rounded_rectangle((0, 4, tw + 2 * pad + 8, 60), radius=12, fill=(12, 17, 23, 225))
        d.rectangle((0, 4, 8, 60), fill=ACCENT + (255,))
        d.text((pad + 8, 14), text, font=fnt, fill=(255, 255, 255, 255))
        return np.array(img)
    fnt_k = font(22, 'Bold'); fnt = font(26, 'Medium')
    lines = wrap(text, fnt, 640)
    tw = max(fnt.getlength(l) for l in lines)
    kw = fnt_k.getlength('ASSUMED FOR THE DEMO')
    w = int(max(tw, kw) + 44); h = int(52 + 36 * len(lines))
    img = Image.new('RGBA', (w + 6, h + 6), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w, h), radius=12, fill=(255, 248, 230, 240), outline=ACCENT + (255,), width=3)
    d.text((22, 12), 'ASSUMED FOR THE DEMO', font=fnt_k, fill=(150, 98, 0, 255))
    for i, l in enumerate(lines):
        d.text((22, 44 + i * 36), l, font=fnt, fill=INK + (255,))
    return np.array(img)

@functools.lru_cache(maxsize=256)
def label_img(text, dark=True, size=28):
    fnt = font(size, 'SemiBold')
    lines = text.split('\n')
    tw = max(fnt.getlength(l) for l in lines); lh = int(size * 1.3)
    w = int(tw + 32); h = int(lh * len(lines) + 20)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=10, fill=(12, 17, 23, 230) if dark else (255, 255, 255, 240), outline=ACCENT + (255,) if not dark else None, width=2)
    for i, l in enumerate(lines):
        d.text((16, 9 + i * lh), l, font=fnt, fill=(255, 255, 255, 255) if dark else INK + (255,))
    return np.array(img)

def blend(frame, rgba, x, y, alpha=1.0):
    """Alpha-blend an RGBA numpy image (RGB order) onto a BGR frame at x, y."""
    if alpha <= 0: return
    h, w = rgba.shape[:2]
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(x, 0), max(y, 0); x1, y1 = min(x + w, W), min(y + h, H)
    if x1 <= x0 or y1 <= y0: return
    sub = rgba[y0 - y:y1 - y, x0 - x:x1 - x]
    a = (sub[:, :, 3:4].astype(np.float32) / 255.0) * alpha
    rgb = sub[:, :, 2::-1].astype(np.float32)  # RGB -> BGR
    reg = frame[y0:y1, x0:x1].astype(np.float32)
    frame[y0:y1, x0:x1] = (reg * (1 - a) + rgb * a).astype(np.uint8)

def draw_box(frame, sb, alpha, color=ACCENT, thick=5, pad=10):
    if alpha <= 0: return
    x, y, w, h = sb
    x -= pad; y -= pad; w += 2 * pad; h += 2 * pad
    over = frame.copy()
    # dim outside slightly
    bgr = (color[2], color[1], color[0])
    cv2.rectangle(over, (int(x), int(y)), (int(x + w), int(y + h)), bgr, thick, lineType=cv2.LINE_AA)
    cv2.addWeighted(over, alpha, frame, 1 - alpha, 0, dst=frame)

def spotlight(frame, sbs, alpha):
    """Darken everything outside the given screen boxes."""
    if alpha <= 0 or not sbs: return
    mask = np.ones((H, W), np.float32)
    for (x, y, w, h) in sbs:
        x0, y0 = int(max(0, x - 14)), int(max(0, y - 14)); x1, y1 = int(min(W, x + w + 14)), int(min(H, y + h + 14))
        mask[y0:y1, x0:x1] = 0
    mask = cv2.GaussianBlur(mask, (0, 0), 6)
    k = 1 - 0.38 * alpha * mask
    frame[:] = (frame.astype(np.float32) * k[:, :, None]).astype(np.uint8)
