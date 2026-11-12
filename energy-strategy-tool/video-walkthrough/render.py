"""Render the timeline: python3 render.py timeline.json outdir [scene ...] | --frames t1,t2,..."""
import json, sys, os, subprocess, math
import numpy as np, cv2
from engine import *

TR = 0.75  # transition length (s)

def beat_rect(b, u):
    r1 = b['rect']; r2 = b.get('rect2') or r1
    k = u / max(b['dur'], 1e-6)
    return lerp_rect(r1, r2, min(1, max(0, k)))

def mapzoom_frame(b, u):
    """Continuous zoom through a ladder of map images; each next image is `k` times closer, centred where pins say."""
    imgs = b['ladder']  # list of {img, pin:[x,y], size:[w,h]}
    n = len(imgs) - 1
    t0, t1 = b.get('zoom_from', 0.3), b.get('zoom_to', b['dur'] - 0.6)
    s = n * ease((u - t0) / max(t1 - t0, 1e-6))  # 0..n
    i = min(int(s), n - 1) if n > 0 else 0
    f = s - i if n > 0 else 0
    def rect_in(a, bimg, frac):
        # the next image's base view expressed in this image's pixels; zoom towards it geometrically
        k = b['k']
        pA, pB = np.array(a['pin']), np.array(bimg['pin'])
        sc = (a['size'][0] / bimg['size'][0]) / k
        bx, by, bw, bh = bimg['rect']
        tl = pA + (np.array([bx, by]) - pB) * sc
        target = (tl[0], tl[1], bw * sc, bh * sc)
        return lerp_rect(a['rect'], target, frac, eased=False)
    a = imgs[i]
    if n == 0:
        return render_img(a['img'], a['rect'], a.get('size'))
    # linear zoom in log space: use frac as geometric interpolation directly (lerp_rect eases, so pass raw via inverse)
    ra = rect_in(a, imgs[i + 1], f)
    fa = render_img(a['img'], ra, a.get('size'))
    if f > 0.72:
        bimg = imgs[i + 1]
        # the same view in the next image's pixels
        k = b['k']; WA, HA = a['size']; WB, HB = bimg['size']
        pA, pB = np.array(a['pin']), np.array(bimg['pin'])
        sc = k * (WB / WA)
        x0 = pB + (np.array([ra[0], ra[1]]) - pA) * sc
        rb = (x0[0], x0[1], ra[2] * sc, ra[3] * sc)
        fb = render_img(bimg['img'], rb, bimg.get('size'))
        al = ease((f - 0.72) / 0.28)
        return cv2.addWeighted(fb, al, fa, 1 - al, 0)
    return fa

def render_img(path, rect, size=None):
    return view(path, rect)

def base_frame(b, u, with_boxes=True):
    if b.get('kind') == 'mapzoom':
        fr = mapzoom_frame(b, u)
        rect = None
    else:
        rect = beat_rect(b, u)
        fr = view(b['img'], rect)
    return fr, rect

def overlay(fr, b, u, rect, alpha_scale=1.0):
    """Boxes, spotlight and labels for beat b at local time u."""
    start = b.get('box_at', TR + 0.1)
    a = ease((u - start) / 0.4) * alpha_scale
    if a > 0 and rect is not None:
        sbs = [to_screen(bx, rect) for bx in b.get('boxes', [])]
        if b.get('spot') and sbs:
            spotlight(fr, sbs, a)
        for sb in sbs:
            draw_box(fr, sb, a)
        for ring in b.get('rings', []):
            cx, cy, _, _ = to_screen((ring['c'][0], ring['c'][1], 0, 0), rect)
            rr = ring['r'] * W / rect[2]
            over = fr.copy()
            cv2.circle(over, (int(cx), int(cy)), int(rr), (255, 255, 255), 3, cv2.LINE_AA)
            cv2.addWeighted(over, a * 0.75, fr, 1 - a * 0.75, 0, dst=fr)
            img = label_img(ring['text'], False, 24)
            blend(fr, img, cx - img.shape[1] / 2, cy - rr - img.shape[0] / 2, a)
        for lab in b.get('labels', []):
            # label: {text, at:[x,y] image px, dx, dy (screen px offset)}
            img = label_img(lab['text'], lab.get('dark', True), lab.get('size', 28))
            x, y, _, _ = to_screen((lab['at'][0], lab['at'][1], 0, 0), rect)
            blend(fr, img, x + lab.get('dx', 0), y + lab.get('dy', 0), a)
    if b.get('slide_labels'):
        for lab in b['slide_labels']:
            t0 = lab.get('t', 0)
            al = ease((u - t0) / 0.4) * alpha_scale
            if al <= 0: continue
            if 'line' in lab:
                (x0, y0), (x1, y1) = lab['line']
                over = fr.copy(); cv2.line(over, (int(x0), int(y0)), (int(x1), int(y1)), (255, 255, 255), 3, cv2.LINE_AA)
                cv2.circle(over, (int(x1), int(y1)), 7, (255, 255, 255), -1, cv2.LINE_AA)
                cv2.addWeighted(over, al, fr, 1 - al, 0, dst=fr)
            if 'text' in lab:
                img = label_img(lab['text'], lab.get('dark', True), lab.get('size', 28))
                blend(fr, img, lab['x'], lab['y'], al)

def frame_at(tl, t):
    beats = tl['beats']
    # locate beat
    j = 0
    while j + 1 < len(beats) and beats[j + 1]['t0'] <= t: j += 1
    b = beats[j]; u = t - b['t0']
    prev = beats[j - 1] if j > 0 else None
    trans = b.get('trans', 'fade' if (prev is None or prev.get('img') != b.get('img') or b.get('kind') == 'mapzoom' or prev.get('kind') == 'mapzoom') else 'move')
    if prev is not None and u < TR and trans != 'cut':
        k = ease(u / TR)
        if trans == 'move':
            r_prev = beat_rect(prev, prev['dur'])
            r_now = beat_rect(b, u)
            rect = lerp_rect(r_prev, r_now, k)
            fr = view(b['img'], rect)
            overlay(fr, b, u, rect)
        else:
            fp, rp = base_frame(prev, prev['dur'])
            overlay(fp, prev, prev['dur'], rp, 1 - k)
            fn, rn = base_frame(b, u)
            overlay(fn, b, u, rn)
            fr = cv2.addWeighted(fn, k, fp, 1 - k, 0)
    elif prev is None and u < 0.6 and b.get('fade_in', True):
        fr, rect = base_frame(b, u); overlay(fr, b, u, rect)
        fr = (fr.astype(np.float32) * ease(u / 0.6)).astype(np.uint8)
    else:
        fr, rect = base_frame(b, u); overlay(fr, b, u, rect)
    # chips
    sec = b.get('section')
    if sec:
        s0 = b.get('section_t0', b['t0'])
        al = min(ease((t - s0) / 0.4), ease((s0 + 4.0 - t) / 0.5))
        if al > 0: blend(fr, tag_img('section', sec), 40, 34, al * 0.97)
    if b.get('assumed'):
        al = ease((u - 0.3) / 0.4)
        img = tag_img('assumed', b['assumed'])
        blend(fr, img, W - img.shape[1] - 40, 34, al)
    if b.get('say') and not b.get('no_caption'):
        cs, ce = b['say_t0'], b['say_t0'] + b['say_dur'] + 0.25
        if cs - 0.1 <= u <= ce:
            al = min(ease((u - cs + 0.1) / 0.2), ease((ce - u) / 0.2))
            img = caption_img(b['say'])
            blend(fr, img, 0, H - img.shape[0] - 26, al)
    end = tl.get('end_fade')
    if end and t > tl['total'] - end:
        fr = (fr.astype(np.float32) * ease((tl['total'] - t) / end)).astype(np.uint8)
    return fr

def render_scene(tl, sc, outdir):
    t0, t1 = sc['t0'], sc['t1']
    n = int(round((t1 - t0) * FPS))
    tmp = os.path.join(outdir, f"{sc['name']}.part.mp4"); final = os.path.join(outdir, f"{sc['name']}.mp4")
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-movflags', '+faststart', tmp]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    last = None; last_key = None
    for i in range(n):
        t = t0 + i / FPS
        fr = frame_at(tl, t)
        p.stdin.write(fr.tobytes())
    p.stdin.close(); rc = p.wait()
    if rc == 0: os.replace(tmp, final)
    return rc, n

if __name__ == '__main__':
    tl = json.load(open(sys.argv[1]))
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    args = sys.argv[3:]
    if args and args[0] == '--frames':
        for s in args[1].split(','):
            t = float(s)
            cv2.imwrite(os.path.join(outdir, f'frame-{t:07.2f}.jpg'), frame_at(tl, t), [cv2.IMWRITE_JPEG_QUALITY, 88])
        sys.exit(0)
    names = set(args)
    for sc in tl['scenes']:
        if names and sc['name'] not in names: continue
        rc, n = render_scene(tl, sc, outdir)
        print(sc['name'], n, 'frames', 'ok' if rc == 0 else f'ffmpeg {rc}', flush=True)
