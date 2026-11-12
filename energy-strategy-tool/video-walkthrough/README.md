# Video walkthrough tools

These scripts made the narrated Pego walkthrough of 8 November 2026 (7 min 45 s: 750 MW IT, PUE 1.25 annual and 1.45 design day, 300 MW of grid for life). They drive the built app in a browser, take screenshots, voice a script and render a 1080p video with captions. They are tools for making demos: nothing in the app uses them, and no video or screenshot is kept in the repository.

## What you need

- The app built: `cd ../app && npm ci && npm run build`.
- Node.js 22 with Playwright and Chromium (as for `npm run test:browser`).
- Python 3 with `numpy`, `opencv-python`, `pillow`, `scipy`; `ffmpeg`; `pdftoppm` (poppler).
- Piper text-to-speech: `pip install piper-tts` (`--break-system-packages` in a Claude session).
- Voice B, Piper's British English southern female voice (low quality), licence CC BY-SA 4.0 (dataset OpenSLR 83). In a Claude session Hugging Face is blocked; the voice downloads from GitHub: `https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-gb-southern_english_female-low.tar.gz`. Unpack it into `voice/` in the work folder, or set `PIPER_VOICE` to the `.onnx` file. The video's credits must name the voice and its licence.

## Steps

Run everything from an empty work folder outside the repository; every output is written there.

1. `node <this folder>/capture4.mjs`: enters the study through the app's own inputs, runs it twice (about 5 minutes) and saves about 60 screenshots at three times screen size to `shots4/`, with the boxes of the elements on each in `shots4/meta.json`, the option details, the PDF report and the saved study.
2. `node <this folder>/capture6.mjs`: opens that study, saves it again and reopens it, for the "Re-run matches the saved study" screen.
3. `node <this folder>/maphi.mjs`: the map at every zoom level at eight times screen size, with the nearby plants (`shots/maphi-z*.png`).
4. `pdftoppm -r 110 -jpeg shots4/report.pdf pdf4/p` (make `pdf4/` first): the report pages for the report slide.
5. `python3 <this folder>/tts.py`: voices every line of `script4.py` (about 2 minutes); lengths go to `voice/durations4.json`.
6. `python3 <this folder>/storyboard4.py`: draws the title, report, end and credit slides (`slides4/`) and writes the timeline (`timeline4.json`): each line of the script is one "beat" with its screenshot, camera framing, highlight boxes, labels and caption.
7. Check frames before the full render: `python3 <this folder>/render.py timeline4.json test --frames 15,120,300`.
8. `python3 <this folder>/render.py timeline4.json scenes4 [scene names]`: one encoded file per scene (H.264, 30 fps, veryfast). With two processor cores, run two processes, each with its own list of scenes: never let two processes write the same scene.
9. `python3 <this folder>/audio.py`: the voice track with a quiet synthesised pad underneath (`narration4.m4a`).
10. Join the scenes with ffmpeg's concat demuxer and `-c copy`, add the sound with `-c:v copy`, then make a smaller copy at `-crf 25` for sending (about 150 MB for 7 min 45 s).

## Changing the video

- New words: edit `script4.py` (caption text, and the spoken text where numbers or names need spelling out: "Peggo", "Elec gas", "Margalya"), run `tts.py`, `storyboard4.py`, and render again.
- New inputs or a new site: edit `capture4.mjs`; screen positions change with the results, so check the boxes in `storyboard4.py` against the new screenshots (the boxes are in screen pixels at 1600 × 900; `R()` scales them by three).
- Things that caught us out: the Compare tab is renamed "Compare (3)" once options are ticked; a wide option detail can scroll the page sideways (the scripts reset the scroll before each screenshot); after opening a study, wait for "Opened" before waiting for the run.
