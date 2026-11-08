"""Narration track from the timeline, with a soft synthesised pad underneath; writes narration4.m4a."""
import json, wave, subprocess
import numpy as np

SR = 48000
tl = json.load(open('timeline4.json'))
N = int(tl['total'] * SR) + SR
voice = np.zeros(N, np.float32)
for b in tl['beats']:
    if not b.get('wav'): continue
    with wave.open(b['wav']) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    i = int((b['t0'] + b['say_t0']) * SR)
    voice[i:i + len(x)] += x[:N - i]
# voice to about -18 dBFS RMS over speech
act = np.abs(voice) > 1e-3
rms = np.sqrt(np.mean(voice[act] ** 2))
voice *= 10 ** (-18 / 20) / rms

# pad: slow chords (D major 9, B minor 7, G major 7, A sus), each about 16 s, sines with slight detune and slow swell
t = np.arange(N) / SR
chords = [[73.42, 110.0, 146.83, 185.0, 220.0, 329.63], [61.74, 92.5, 123.47, 146.83, 220.0, 277.18],
          [49.0, 98.0, 146.83, 185.0, 246.94, 293.66], [55.0, 110.0, 164.81, 220.0, 293.66, 329.63]]
pad = np.zeros(N, np.float32)
seg = 16.0
nseg = int(np.ceil(tl['total'] / seg)) + 1
for k in range(nseg):
    c = chords[k % len(chords)]
    s0 = k * seg - 3.0; s1 = s0 + seg + 6.0  # overlapping crossfades
    i0, i1 = max(0, int(s0 * SR)), min(N, int(s1 * SR))
    if i1 <= i0: continue
    tt = t[i0:i1]
    env = np.sin(np.clip((tt - s0) / (s1 - s0), 0, 1) * np.pi) ** 2
    sig = np.zeros_like(tt)
    for j, f in enumerate(c):
        a = 1.0 / (1 + j * 0.6)
        sig += a * (np.sin(2 * np.pi * f * tt + j) + 0.6 * np.sin(2 * np.pi * f * 1.003 * tt + 2 * j))
    pad[i0:i1] += (sig * env).astype(np.float32)
# soften: simple one-pole low-pass twice
def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    # vectorised via lfilter-free recursion in chunks
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x).astype(np.float32)
try:
    pad = lp(lp(pad, 900), 900)
except Exception:
    pass
pad /= np.max(np.abs(pad)) + 1e-9
# duck under the voice: envelope of speech, smoothed
env = np.convolve(np.abs(voice), np.ones(SR // 5) / (SR // 5), mode='same')
duck = 1 - 0.55 * np.clip(env / (np.max(env) * 0.25), 0, 1)
level = 10 ** (-33 / 20)
fade = np.clip(t / 2.5, 0, 1) * np.clip((tl['total'] - t) / 3.0, 0, 1)
mix = voice + pad * level * duck * fade * 1.4
mix = np.clip(mix, -0.98, 0.98)
pcm = (mix * 32767).astype(np.int16)
with wave.open('narration4.wav', 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'narration4.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ac', '2', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-t', f"{tl['total']:.3f}", 'narration4.m4a'], check=True)
print('narration4.m4a', round(tl['total'], 1), 's')
