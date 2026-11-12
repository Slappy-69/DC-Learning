"""Speak each narration line with Piper voice B; writes voice/NN.wav (48 kHz mono) and voice/durations4.json."""
import json, os, subprocess, sys, hashlib, wave
import pathlib
# Voice B: Piper en_GB southern English female (low), CC BY-SA 4.0; see the README for the download.
MODEL = os.environ.get('PIPER_VOICE', 'voice/en-gb-southern_english_female-low.onnx')
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from script4 import LINES
json.dump({k: (t or c) for k, c, t in LINES}, open('lines4.json', 'w'), indent=1)
OUT = 'voice'
os.makedirs(OUT, exist_ok=True)
lines = json.load(open('lines4.json'))
durs = {}
for key, text in lines.items():
    h = hashlib.md5(text.encode()).hexdigest()[:8]
    raw = f'{OUT}/{key}-{h}.raw.wav'; fin = f'{OUT}/{key}-{h}.wav'
    if not os.path.exists(fin):
        subprocess.run(['piper', '-m', MODEL, '--length_scale', '1.07', '--sentence_silence', '0.25', '--output_file', raw], input=text.encode(), check=True, capture_output=True)
        # warm it slightly: gentle low shelf, a touch of room, 48 kHz; trim leading/trailing silence
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af',
                        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,'
                        'atempo=0.97,bass=g=2.5:f=180,aecho=0.85:0.5:28:0.10,aresample=48000',
                        '-ac', '1', '-ar', '48000', fin], check=True)
        os.remove(raw)
    with wave.open(fin) as w:
        durs[key] = {'file': fin, 'dur': w.getnframes() / w.getframerate()}
json.dump(durs, open(f'{OUT}/durations4.json', 'w'), indent=1)
print(f'{len(durs)} lines, {sum(d["dur"] for d in durs.values()):.1f} s of speech')
