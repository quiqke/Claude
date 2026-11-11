"""Offline Russian narration with Piper (voice: ru irinia medium, from github.com/rhasspy/piper releases v0.0.2).
usage: <piper-venv>/bin/python tts_piper.py lines.json voice/ [--model PATH] [--scale 0.95]
Writes voice/<id>.wav (22.05 kHz mono, silence trimmed) and voice/dur.json. `say` is spoken instead of `text` when present."""
import argparse, json, os, wave, io
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

ap = argparse.ArgumentParser()
ap.add_argument('lines'); ap.add_argument('out')
ap.add_argument('--model', default=os.environ.get('PIPER_MODEL', '/root/opt/piper-dl/x/ru-irinia-medium.onnx'))
ap.add_argument('--scale', type=float, default=0.95)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
v = PiperVoice.load(a.model)
durs = {}
for L in json.load(open(a.lines, encoding='utf-8')):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        v.synthesize_wav(L.get('say', L['text']), w, syn_config=SynthesisConfig(length_scale=L.get('scale', a.scale), noise_scale=0.6, noise_w_scale=0.7))
    buf.seek(0)
    with wave.open(buf) as r:
        sr = r.getframerate(); x = np.frombuffer(r.readframes(r.getnframes()), np.int16)
    env = np.abs(x.astype(np.float32)) > 300
    idx = np.nonzero(env)[0]
    i0 = max(0, idx[0] - int(0.03 * sr)); i1 = min(len(x), idx[-1] + int(0.08 * sr))
    x = x[i0:i1]
    with wave.open(os.path.join(a.out, L['id'] + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(x.tobytes())
    durs[L['id']] = round(len(x) / sr, 3)
    print(L['id'], durs[L['id']])
json.dump(durs, open(os.path.join(a.out, 'dur.json'), 'w'), indent=1)
print('total', round(sum(durs.values()), 2))
