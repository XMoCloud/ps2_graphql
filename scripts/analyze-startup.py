"""Measure light trajectories/timing from the supplied recording, never export video frames as runtime art.

Local tooling: python -m pip install pillow numpy imageio-ffmpeg
Run from the repository root. Frames used for visual QA remain under .local/.
"""
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np

WIDTH, HEIGHT, FPS = 640, 360, 30
process = subprocess.run([
    imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', 'public/ps2_assets/ps2_startup.mp4',
    '-vf', f'scale={WIDTH}:{HEIGHT}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'
], capture_output=True, check=True)
frames = np.frombuffer(process.stdout, dtype=np.uint8).reshape(-1, HEIGHT, WIDTH, 3)
tracks = {name: [] for name in ['green', 'pink', 'red', 'violet']}
titles = []
for index, frame in enumerate(frames):
    r, g, b = frame.astype(float).transpose(2, 0, 1)
    scores = {
        'green': g - r*.65 - b*.65,
        'pink': np.minimum(r, b)*.85 - g - np.maximum(b-r, 0)*1.5,
        'red': r - g*.8 - b*.65,
        'violet': np.minimum(r, b) - g*.85,
    }
    # Exclude pink from violet, and vice versa; their white cores have colored halos.
    scores['pink'][b > r*1.22] = 0
    scores['violet'][b < r*1.05] = 0
    scores['violet'][:int(HEIGHT*.60)] = 0
    # Distinguish the two red-family lights by their separate measured paths.
    # Pink crosses above the cloud; red stays at its right edge.
    scores['pink'][:, int(WIDTH*.59):] = 0
    scores['pink'][int(HEIGHT*.50):] = 0
    scores['red'][:, :int(WIDTH*.60)] = 0
    for name, score in scores.items():
        score[:8] = score[-8:] = 0
        score[:, :8] = score[:, -8:] = 0
        y, x = np.unravel_index(np.argmax(score), score.shape)
        strength = score[y, x]
        if strength < (13 if name in ['violet', 'pink'] else 28):
            tracks[name].append(None)
            continue
        lo_x, hi_x = max(0, x-5), min(WIDTH, x+6)
        lo_y, hi_y = max(0, y-5), min(HEIGHT, y+6)
        weights = np.maximum(score[lo_y:hi_y, lo_x:hi_x] - strength*.40, 0)
        yy, xx = np.mgrid[lo_y:hi_y, lo_x:hi_x]
        cx, cy = (xx*weights).sum()/weights.sum(), (yy*weights).sum()/weights.sum()
        tracks[name].append([round(cx/WIDTH, 6), round(cy/HEIGHT, 6), round(float(strength), 2)])
    text = frame[int(HEIGHT*.47):int(HEIGHT*.54), int(WIDTH*.18):int(WIDTH*.82)]
    titles.append(int((text.min(axis=2) > 180).sum()))

result = {'fps': FPS, 'duration': len(frames)/FPS, 'source': 'ps2_startup.mp4', 'tracks': tracks,
          'titleWhitePixels': titles}
target = Path('src/experience/startup/reference-tracks.json')
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(result, separators=(',', ':')), encoding='utf-8')
print(json.dumps({'frames': len(frames), 'duration': result['duration'],
                  'trackSamples': {k: sum(p is not None for p in v) for k,v in tracks.items()},
                  'title': [(i/FPS, v) for i,v in enumerate(titles) if i%15 == 0]}))
