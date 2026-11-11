"""Score + foley + the user's narration → mix.wav for «7 правил выживания» (Halftone Dossier).
Synth pop-print kit (kick, snare, clap, hat, square bass, marimba pluck), stripped to bass + snaps for secret cards,
digital silence before the reveal. Foley: stamps, wipes, card fan, zombie groans, shutter, tape, counter ticks.
Narration: vo-src/gemini.wav, used whole at its own timing (offset 0)."""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); C = next(e for e in ev['ev'] if e['type'] == 'cues')
TL, DUR, SHAKES, WIPES = C['TL'], C['DUR'], C['SHAKES'], C['WIPES']; R = TL['R']
rng = np.random.default_rng(5); N = int((DUR + 2) * SR)
mus, fol, vo = (np.zeros((N, 2), np.float32) for _ in range(3))
tt = lambda d: np.arange(int(d * SR)) / SR; mtof = lambda m: 440 * 2 ** ((m - 69) / 12); db = lambda x: 10 ** (x / 20)
def put(buf, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 1: add(buf, np.asarray(x, np.float32), t, g, pan)
# ── kit
def kick(v=1.):
    t = tt(.45); f = 50 + 110 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * v * .9
def snare(v=1.):
    t = tt(.3); return (bp(rng.standard_normal(len(t)), 1500, 7000) * np.exp(-t * 18) * .6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * .4) * v * .6
def clap(v=1.):
    t = tt(.25); x = bp(rng.standard_normal(len(t)), 900, 4000); env = np.exp(-t * 22) + sum((np.abs(t - d) < .004) * 1.5 for d in (.0, .012, .024)); return x * env * v * .35
def hat(v=1.):
    t = tt(.06); return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70) * v * .18
def bass(m, d, v=1.):
    t = tt(d); f = mtof(m); x = np.sign(np.sin(2 * np.pi * f * t)) * .6 + np.sin(2 * np.pi * f * t) * .4
    return lp(x, 900) * np.minimum(1, t / .005) * np.exp(-t * 3) * v * .22
def pluck(m, v=1.):
    t = tt(.6); f = mtof(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + .4 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 25)) * v * .22
def snap(v=1.):
    t = tt(.08); return bp(rng.standard_normal(len(t)), 2000, 6000) * np.exp(-t * 60) * v * .5
def pad(ms, d, v=1.):
    t = tt(d); x = sum(2 * np.abs(2 * ((mtof(m) * t + .1 * k) % 1) - 1) - 1 for k, m in enumerate(ms)) / len(ms)
    return lp(x, 1200) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4) * v * .08
BPM = 96; B = 60 / BPM
PROG = [45, 41, 48, 43]                                   # Am F C G (bass roots)
MEL = [69, 72, 76, 74, 72, 69, 67, 69]
def groove(t0, t1, full=True, mel=True):
    k0 = int(np.ceil(t0 / (B / 2)))
    for k in range(k0, int(t1 / (B / 2))):
        t = k * B / 2; beat = k // 2; bar = beat // 4; root = PROG[bar % 4]
        put(mus, bass(root - 12 + (12 if k % 4 == 3 else 0), B / 2), t, 1, 0)
        if full:
            if k % 2 == 0 and beat % 4 in (0, 2): put(mus, kick(), t, 1, 0)
            if k % 2 == 0 and beat % 4 in (1, 3): put(mus, snare(), t, 1, .1); put(mus, clap(.8), t, 1, -.1)
            put(mus, hat(.7 if k % 2 else 1), t, 1, .3)
        else:
            if k % 2 == 0 and beat % 2 == 1: put(mus, snap(), t, 1, .4)
        if mel and k % 2 == 0 and full: put(mus, pluck(MEL[beat % 8] + (0 if bar % 2 == 0 else -2)), t, 1, -.25)
def padbar(t0, t1, v=1.):
    t = np.floor(t0 / (B * 4)) * B * 4
    while t < t1: a, b = max(t, t0), min(t + B * 4, t1); r = PROG[int(t / (B * 4)) % 4]; put(mus, pad([r + 12, r + 15 + (1 if r in (41, 48) else 0), r + 19], b - a + .3, v), a); t += B * 4
# ── score layout
groove(.0, TL['tNot'] - .05)                              # hook: full groove from frame 1
groove(TL['tNot'], TL['tList'], full=False)               # night "не зомби?": bass + snaps
padbar(TL['tNot'], TL['tList'], 1.2)
groove(TL['tList'], TL['t7'] - .1)                        # the rules: full groove
for k, r in enumerate(R):
    if k in (2, 4):                                       # night cards: strip down
        a = r; b = R[k + 1] if k < 5 else TL['t7']; i0, i1 = int(a * SR), int(b * SR); mus[i0:i1] *= .0
        groove(a, b, full=False); padbar(a, b, 1.1)
padbar(TL['t7'], TL['tReveal'] - .45, 1.4); groove(TL['t7'], TL['tReveal'] - .45, full=False, mel=False)
groove(TL['tReveal'], DUR - .3)                           # reveal → end: full groove again
put(mus, kick(1.4), TL['tReveal'], 1, 0); put(mus, pad([57, 60, 64, 69], 2.5, 1.6), TL['tReveal'])
# digital silence before the reveal stamp
i0, i1 = int((TL['tReveal'] - .45) * SR), int(TL['tReveal'] * SR); mus[i0:i1] = 0
# ── foley
def stamp(v=1.):
    t = tt(.6); f = 140 * np.exp(-t * 6) + 45; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    k = int(.006 * SR); x[:k] += bp(rng.standard_normal(k), 2000, 9000) * 2; x += bp(rng.standard_normal(len(t)), 300, 2000) * np.exp(-t * 30) * .4
    return x * v * .8
def whoosh(d=.45, v=1.):
    t = tt(d); x = bp(rng.standard_normal(len(t)), 400, 4000) * np.sin(np.pi * t / d) ** 2; return x * v * .35
def paper(d=.25, v=1.):
    t = tt(d); return bp(rng.standard_normal(len(t)), 1500, 8000) * (rng.random(len(t)) < .4) * np.sin(np.pi * t / d) * v * .3
def groan(d=1.1, v=1.):
    t = tt(d); f0 = 95 + 25 * np.sin(2 * np.pi * 1.3 * t); src = np.sign(np.sin(2 * np.pi * np.cumsum(f0) / SR)) * .5 + rng.standard_normal(len(t)) * .15
    fo = 500 + 400 * np.sin(np.pi * t / d); y = sum(bp(src, max(80, f * .8), f * 1.25) for f in (fo.mean(), fo.mean() * 2.4))
    return y * np.sin(np.pi * t / d) * v * .5
def shutter(): t = tt(.2); x = np.zeros(len(t)); k = int(.004 * SR); x[:k] = bp(rng.standard_normal(k), 2000, 8000) * 1.5; x[int(.07 * SR):int(.07 * SR) + k] = bp(rng.standard_normal(k), 2000, 8000); return x * .6
def tick(): t = tt(.05); return np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 90) * .25
def tape(d=.5): t = tt(d); return bp(rng.standard_normal(len(t)), 600, 5000) * (.6 + .4 * np.sin(2 * np.pi * 40 * t)) * np.sin(np.pi * t / d) * .3
for s in SHAKES: put(fol, stamp(1.0), s[0] - .01, 1, 0)
for r in R[1:] + [TL['t7']]: put(fol, stamp(.7), r - .55, 1, .3)          # ✓ ЖИВ stamps
for w in WIPES: put(fol, whoosh(.5, 1.0), w - .35, 1, -.2)
for i in range(7): put(fol, paper(.18, .9), TL['tList'] + .4 + i * .06, 1, (i - 3) * .1)
for i in range(9): put(fol, paper(.12, .6), TL['tDie'] + .1 + i * .12, 1, (i % 5 - 2) * .2)
for t0, v in [(.85, .9), (TL['tNot'] + .3, 1.1), (R[2] + 1.2, .7), (R[3] + 1.0, .6), (TL['tReveal'] + .1, .8)]: put(fol, groan(1.1, v), t0, 1, .3)
put(fol, shutter(), TL['tReveal'], 1, 0)
put(fol, tape(.5), R[5] + 1.5, 1, -.3); put(fol, tape(.5), R[5] + 1.65, 1, .3)
for k in range(int((DUR - TL['tEnd'] - .5) * 9)): put(fol, tick(), TL['tEnd'] + .5 + k / 9, 1, .2)
# ── narration (user's Gemini take, whole)
y, sr = sf.read(os.path.join(HERE, 'vo-src', 'gemini.wav')); y = y if y.ndim == 1 else y.mean(1)
y = soxr.resample(y.astype(np.float32), sr, SR); vm = np.zeros(N, np.float32); vm[:min(N, len(y))] = y[:N]
vm = hp(vm, 70); vm = compress(vm / (np.abs(vm).max() + 1e-9) * .8, thr=.22, ratio=2.5, att=.004, rel=.1)
vo[:, 0] = vm; vo[:, 1] = vm
mus = S.room(mus, size=.25, mix=.15)
env = np.convolve(np.abs(vm), np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); on = (env > .02).astype(np.float32)
g = 0.; dk = np.zeros(N, np.float32)
for j in range(0, N, 240): tgt = on[j]; g += (tgt - g) * (240 / (.05 * SR) if tgt > g else 240 / (.35 * SR)); dk[j:j + 240] = g
mus = mus * (1 - (1 - db(-8)) * dk)[:, None]; fol = fol * (1 - (1 - db(-3)) * dk)[:, None]
def rms(x): m = np.abs(x).max(1) > 1e-4; return float(np.sqrt(np.mean(x[m] ** 2)))
vr, mr, fr = rms(vo), rms(mus), rms(fol)
mix = vo + mus * (vr / mr) * db(-6) + fol * (vr / fr) * db(-9)
mix = np.stack([compress(mix[:, c], thr=.2, ratio=2.5, att=.003, rel=.12) for c in range(2)], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * .9 * db(float(os.environ.get('MIXGAIN', 6.1)))
mix = np.stack([limit(limit(mix[:, c], .74), .74) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('dur', DUR, 'rms dB vo/music/foley', round(20 * np.log10(vr), 1), round(20 * np.log10(mr), 1), round(20 * np.log10(fr), 1))
