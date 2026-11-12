"""Final mix: narration + background music (ducked under the voice) + sound effects → mix.wav at about −14 LUFS.

usage: python mix.py <project_dir> [--music-db -9] [--sfx-db -10] [--bed sea|wind|room|none] [--theme pixel]
Inputs:  voice/narration.wav (align.py), music.wav (music.py — or your own music/*.wav|mp3, looped), cues.json, events.json
         (the page's window.EV, written by $LIB/core/render/events.mjs), all optional except the narration.
Sound effects come from two places, both automatic:
  • the overlay: a soft whoosh + low hit on chapter cards, a beep on alerts, text blips while dialogue boxes type,
    a pencil scribble under notes;
  • the page's events (EV): knock, tap, heart, step, stepOut, tick, click, hit, scratch, lampOn, lampOff, bolt, door,
    winch, chain, thud, rain, static, unplug, join, leave, rip, wind, pulse, crank, hiss, splat, dawn, scribble, pour,
    menu, save, warm. Unknown types are ignored, so a style page can emit whatever it likes.
Everything is synthesised (numpy); 8-bit flavour for theme pixel (bit-crushed blips)."""
import os, sys, json, argparse, subprocess, glob, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--music-db', type=float, default=-9); ap.add_argument('--sfx-db', type=float, default=-10)
ap.add_argument('--bed', default='sea'); ap.add_argument('--theme'); ap.add_argument('--lufs', type=float, default=-14); a = ap.parse_args()
P = a.project; SR = 48000; rng = np.random.default_rng(3)
C = json.load(open(os.path.join(P, 'cues.json'), encoding='utf-8')); theme = a.theme or C.get('theme', 'clean')
vo, sr = sf.read(os.path.join(P, 'voice', 'narration.wav')); assert sr == SR
DUR = C['total'] + 1.5; N = int(DUR * SR)
voice = np.zeros(N, np.float32); voice[:min(N, len(vo))] = vo[:N]
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
tt = lambda d: np.arange(int(d * SR)) / SR
db = lambda x: 10 ** (x / 20)
fx = np.zeros((N, 2), np.float32); bed = np.zeros((N, 2), np.float32)
def put(buf, x, t, g=1., pan=0.):
    s = int(t * SR); x = np.asarray(x, np.float32)
    if s >= N or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    e = min(N, s + len(x)); l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[s:e, 0] += x[:e - s] * g * l * 1.41; buf[s:e, 1] += x[:e - s] * g * r * 1.41
def env(d, a=.005, r=None): t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * (np.exp(-t / r) if r else np.minimum(1, (d - t) / .05))
def crush(x, bits=5, hold=4):                      # 8-bit flavour
    if theme != 'pixel': return x
    y = np.repeat(x[::hold], hold)[:len(x)]; q = 2 ** (bits - 1); return np.round(y * q) / q
def sq(f, d, duty=.5): t = tt(d); return np.where((f * t) % 1 < duty, 1., -1.)
# ── sound palette
S = {}
S['knock'] = lambda v=1: (lp(rng.standard_normal(int(.12 * SR)), 900) * env(.12, .001, .025) * 1.4 + np.sin(2 * np.pi * 95 * tt(.12)) * env(.12, .001, .04)) * v
S['tap'] = lambda v=1: bp(rng.standard_normal(int(.05 * SR)), 2500, 8000) * env(.05, .0005, .008) * 1.2 * v
S['heart'] = lambda v=1: np.concatenate([np.sin(2 * np.pi * 50 * tt(.18)) * env(.18, .004, .05), np.zeros(int(.07 * SR)), np.sin(2 * np.pi * 46 * tt(.2)) * env(.2, .004, .06) * .7]) * 1.6 * v
S['step'] = lambda v=1: (lp(rng.standard_normal(int(.09 * SR)), 1400) * env(.09, .001, .02) + np.sin(2 * np.pi * 70 * tt(.09)) * env(.09, .001, .03) * .5) * .8 * v
S['stepOut'] = lambda v=1: bp(rng.standard_normal(int(.12 * SR)), 300, 3000) * env(.12, .002, .04) * .7 * v
S['tick'] = lambda v=1: np.sin(2 * np.pi * 2900 * tt(.03)) * env(.03, .0005, .006) * .35 * v
S['click'] = lambda v=1: (np.sin(2 * np.pi * 1800 * tt(.06)) * env(.06, .0005, .01) + bp(rng.standard_normal(int(.06 * SR)), 2000, 7000) * env(.06, .0005, .006)) * .8 * v
S['hit'] = lambda v=1: (np.sin(2 * np.pi * (45 + 60 * np.exp(-tt(1.6) * 6)) * tt(1.6)) * env(1.6, .002, .5) * 1.3 + lp(rng.standard_normal(int(1.6 * SR)), 300) * env(1.6, .002, .15) * .6) * v
S['scratch'] = lambda d=3, v=1: bp(rng.standard_normal(int(d * SR)), 1500, 6000) * (np.abs(np.sin(2 * np.pi * 2.3 * tt(d))) ** 3) * (.6 + .4 * np.sin(2 * np.pi * .4 * tt(d))) * env(d, .3) * .35 * v
S['lampOn'] = lambda v=1: (crush(sq(110, .9, .25) * .2 + sq(220, .9) * .1) * env(.9, .01, .4) + lp(rng.standard_normal(int(.9 * SR)), 2000) * env(.9, .001, .05) * .4) * v
S['lampOff'] = lambda v=1: crush(sq(55, .4) * .25) * env(.4, .002, .1) * v
S['bolt'] = lambda v=1: (bp(rng.standard_normal(int(.35 * SR)), 800, 5000) * env(.35, .01) * .4 + np.sin(2 * np.pi * 300 * tt(.35)) * env(.35, .001, .02) * .3) * v
S['door'] = lambda v=1: (bp(rng.standard_normal(int(1. * SR)), 200, 1200) * np.abs(np.sin(2 * np.pi * 3 * tt(1.))) * env(1., .05) * .4) * v
S['winch'] = lambda d=4, v=1: bp(rng.standard_normal(int(d * SR)), 400, 2500) * (np.sin(2 * np.pi * 1.6 * tt(d)) > .3) * env(d, .1) * .35 * v
S['chain'] = lambda v=1: sum(bp(rng.standard_normal(int(1.2 * SR)), 2000 + 400 * k, 6000) * env(1.2, .001, .3 / (k + 1)) * (np.sin(2 * np.pi * (14 + k * 3) * tt(1.2)) > 0) for k in range(3)) * .4 * v
S['thud'] = lambda v=1: (np.sin(2 * np.pi * 60 * tt(.5)) * env(.5, .002, .12) * 1.4 + lp(rng.standard_normal(int(.5 * SR)), 500) * env(.5, .001, .04)) * v
S['rain'] = lambda d=10, v=1: hp(rng.standard_normal(int(d * SR)), 2500) * env(d, 1.5) * .06 * v
S['static'] = lambda d=5, v=1: bp(rng.standard_normal(int(d * SR)), 1200, 6000) * (.6 + .4 * (rng.random(int(d * SR)) < .02)) * env(d, .05) * .05 * v
S['unplug'] = lambda v=1: (bp(rng.standard_normal(int(.15 * SR)), 1000, 6000) * env(.15, .001, .03) + np.sin(2 * np.pi * 120 * tt(.15)) * env(.15, .001, .05) * .6) * v
def jingle(notes, d=.11, duty=.25, v=1):
    out = np.concatenate([sq(440 * 2 ** ((m - 69) / 12), d, duty) * env(d, .002, d * .8) for m in notes]); return crush(out * .15) * v
S['join'] = lambda v=1: jingle([62, 66, 69, 74, 78], .1) * v
S['leave'] = lambda v=1: jingle([74, 70, 67, 62, 58], .16, .5) * v
S['save'] = lambda v=1: jingle([69, 76, 81], .07, .125) * .8 * v
S['menu'] = lambda v=1: jingle([81, 88], .05, .125) * .7 * v
S['rip'] = lambda v=1: bp(rng.standard_normal(int(.45 * SR)), 1500, 7000) * env(.45, .01) * (rng.random(int(.45 * SR)) < .5) * .6 * v
S['wind'] = lambda d=8, v=1: bp(rng.standard_normal(int(d * SR)), 250, 1100) * (.6 + .4 * np.sin(2 * np.pi * .15 * tt(d))) * env(d, 1.) * .12 * v
S['pulse'] = lambda v=1: np.sin(2 * np.pi * 40 * tt(1.2)) * env(1.2, .2, .4) * 1.0 * v
S['crank'] = lambda d=8, v=1: sum(bp(rng.standard_normal(int(d * SR)), 900, 3500) * (np.sin(2 * np.pi * 2.2 * tt(d) + k) > .85) for k in range(2)) * env(d, .1) * .4 * v
S['hiss'] = lambda d=8, v=1: hp(rng.standard_normal(int(d * SR)), 3000) * env(d, .4) * .1 * v
S['splat'] = lambda v=1: (lp(rng.standard_normal(int(.3 * SR)), 700) * env(.3, .002, .06) * 1.2 + np.sin(2 * np.pi * 80 * tt(.3)) * env(.3, .001, .08)) * v
S['dawn'] = lambda v=1: sum(np.sin(2 * np.pi * f * tt(4)) for f in (587, 740, 880)) * env(4, .5, 1.5) * .06 * v
S['scribble'] = lambda d=2, v=1: bp(rng.standard_normal(int(d * SR)), 2500, 7000) * (np.abs(np.sin(2 * np.pi * 7 * tt(d) + np.sin(2 * np.pi * 1.3 * tt(d)) * 3)) ** 2) * env(d, .05) * .12 * v
S['pour'] = lambda v=1: hp(rng.standard_normal(int(.6 * SR)), 1800) * (rng.random(int(.6 * SR)) < .3) * env(.6, .05) * .25 * v
S['warm'] = lambda v=1: np.sin(2 * np.pi * 73 * tt(2.5)) * env(2.5, .6, .9) * .5 * v
S['blip'] = lambda f=880, v=1: crush(sq(f, .035, .25) * .1 * env(.035, .001)) * v
S['beep'] = lambda v=1: jingle([86, 86], .09, .5) * .6 * v
S['whoosh'] = lambda v=1: bp(rng.standard_normal(int(.7 * SR)), 400, 4000) * np.sin(np.pi * tt(.7) / .7) ** 2 * .25 * v
LONG = {'scratch', 'winch', 'rain', 'static', 'wind', 'crank', 'hiss', 'scribble'}
PAN = {'knock': .35, 'tap': -.4, 'tick': -.3, 'step': .1, 'stepOut': .1, 'scratch': -.2, 'static': -.3, 'splat': .3}
# ── events from the page
evp = os.path.join(P, 'events.json'); EV = []
if os.path.exists(evp): d = json.load(open(evp)); EV = d if isinstance(d, list) else d.get('ev', d.get('EV', []))
used = {}
for e in EV:
    ty = e.get('type'); f = S.get(ty)
    if not f: continue
    v = e.get('v', 1); x = f(e.get('d', 4), v) if ty in LONG else f(v)
    put(bed if ty in LONG else fx, x, e['t'], 1., PAN.get(ty, rng.uniform(-.15, .15))); used[ty] = used.get(ty, 0) + 1
# ── overlay sounds: cards, alerts, dialogue typing, notes
for c in C['cards']: put(fx, S['whoosh'](), c['t'] - .3); put(fx, S['hit'](.6), c['t'] + .05); put(fx, S['save'](.8), c['t'] + .2)
for al in C['alerts']: put(fx, S['beep'](), al['t'])
for b in C['boxes']:
    if b['kind'] == 'dialog':
        f0 = {'Мама': 520, 'Вера': 700, 'Рация': 400, 'Голос': 980, 'Ты': 600}.get(b.get('speaker'), 640)
        for w in b['words']:
            for k in range(max(1, len(w['w']) // 3)): put(fx, S['blip'](f0 * (1 + .03 * (k % 3)), .55), w['t0'] + k * .05)
    elif not any(abs(e['t'] - b['t0']) < 1.5 and e.get('type') == 'scribble' for e in EV): put(bed, S['scribble'](min(3, b['t1'] - b['t0']), .8), b['t0'] + .2)
# ── ambient bed under everything
if a.bed != 'none':
    n = rng.standard_normal(N).astype(np.float32); base = lp(n, 500) * (.6 + .4 * np.sin(2 * np.pi * .08 * np.arange(N) / SR)) * .05
    if a.bed == 'wind': base = bp(n, 250, 900) * .05
    bed[:, 0] += base; bed[:, 1] += np.roll(base, 997)
# ── music (generated, or the user's own track looped)
own = sorted(glob.glob(os.path.join(P, 'music', '*.wav')) + glob.glob(os.path.join(P, 'music', '*.mp3')))
if own:
    tmp = os.path.join(P, 'out', '_music48.wav'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '-1', '-i', own[0], '-t', str(DUR), '-ar', str(SR), '-ac', '2', tmp], check=True); m, _ = sf.read(tmp)
elif os.path.exists(os.path.join(P, 'music.wav')): m, _ = sf.read(os.path.join(P, 'music.wav'))
else: m = np.zeros((N, 2))
mus = np.zeros((N, 2), np.float32); n_ = min(N, len(m)); mus[:n_] = m[:n_] if m.ndim == 2 else np.stack([m[:n_]] * 2, 1)
# ── ducking: music −8 dB and beds −4 dB while the voice speaks (fast attack, slow release)
ve = uniform_filter1d(maximum_filter1d(np.abs(voice), int(.03 * SR)), int(.08 * SR)); on = (ve > .02).astype(np.float32)
hop = 480; o = on[::hop]; g = np.zeros_like(o); x = 0.
for i, v in enumerate(o): x += (v - x) * (.35 if v > x else .02); g[i] = x
g = np.repeat(g, hop)[:N]
mus *= (1 - (1 - db(-8)) * g)[:, None]; bed *= (1 - (1 - db(-4)) * g)[:, None]
# ── balance against the voice
def rms(x): x = x if x.ndim == 1 else x.mean(1); m = np.abs(x) > 1e-4; return float(np.sqrt(np.mean(x[m] ** 2))) if m.any() else 1e-9
vr = rms(voice); voice = hp(voice, 70).astype(np.float32)
mix = np.stack([voice, voice], 1) + mus * (vr / rms(mus)) * db(a.music_db) + fx * (vr / max(rms(fx), 1e-6)) * db(a.sfx_db) + bed * (vr / max(rms(bed), 1e-6)) * db(a.sfx_db - 8)
# ── loudness to target (ffmpeg ebur128 measure), then a true-peak-ish limiter
def limit(x, ceil=.89, look=.004):
    n = int(look * SR); m = maximum_filter1d(np.abs(x), 2 * n + 1); gg = np.minimum(1, ceil / np.maximum(m, 1e-9)); return x * uniform_filter1d(minimum_filter1d(gg, 2 * n + 1), n)
tmp = os.path.join(P, 'out', '_premix.wav'); os.makedirs(os.path.join(P, 'out'), exist_ok=True); sf.write(tmp, (mix / (np.abs(mix).max() + 1e-9) * .5).astype(np.float32), SR)
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', tmp, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float([l for l in r.split('\n') if l.strip().startswith('I:')][-1].split()[1])
mix = mix / (np.abs(mix).max() + 1e-9) * .5 * db(a.lufs - I + .7)   # +0.7 dB: the limiter takes back about that much
for _ in range(2): mix = np.stack([limit(mix[:, 0]), limit(mix[:, 1])], 1)
sf.write(os.path.join(P, 'mix.wav'), mix.astype(np.float32), SR)
print(f"mix.wav {DUR:.1f}s · premix {I:.1f} LUFS → target {a.lufs} · sfx events {sum(used.values())} {dict(sorted(used.items()))}")
