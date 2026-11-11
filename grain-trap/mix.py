"""Foley + VO + score → mix.wav. Every stroke on the board makes its own marker sound (shaped by the engine's
hand-speed curve, panned by its screen x). Marker/eraser/magnet foley adapted from the Lemo-Opuscar whiteboard demo (MIT).
Layers: room tone + stopwatch / campfire / wall-clock beds | foley | VO (Piper, Russian) | score (ducked under VO)."""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
C = next(e for e in E if e['type'] == 'cues'); VO = C['VO']
rng = np.random.default_rng(11)
NS = int((DUR + 1) * SR)
fol, room, vo = (np.zeros((NS, 2), np.float32) for _ in range(3))
tt = lambda d: np.arange(int(d * SR)) / SR
db = lambda x: 10 ** (x / 20)
dec = lambda d, tau: np.exp(-tt(d) / tau)

_band = {}
def band(n, lo, hi):
    k = (lo, hi)
    if k not in _band: _band[k] = bp(rng.standard_normal(SR * 8), lo, hi, 2).astype(np.float32)
    b = _band[k]; i = int(rng.integers(0, len(b) - n - 1)); return b[i:i + n]
def marker(dur, length, kind, pen, z=1.):
    d = max(.03, dur); n = int(d * SR); u = np.linspace(0, 1, n)
    v = 1 - .8 * np.cos(2 * np.pi * u)
    if kind == 'dash': v = np.ones(n) * 1.2
    a = (v / 1.8) ** .8 * np.minimum(1, u * d / .006) * np.minimum(1, (1 - u) * d / .012)
    br = {'black': 1.0, 'red': 1.12, 'blue': .92}.get(pen, 1.)
    x = (band(n, 2200 * br, 7500 * br) * (.55 + .45 * v / 1.8) + band(n, 500 * br, 1500 * br) * .45
         + bp((rng.random(n) < .004 * (1 + v)) * rng.standard_normal(n) * .8, 1500, 6000)) * a
    if kind != 'dash' and length > 140 and rng.random() < .25:          # dry-erase squeak
        s0 = rng.uniform(.15, .55) * d; sd = min(d - s0, rng.uniform(.06, .16))
        if sd > .03:
            m = int(sd * SR); ts = np.arange(m) / SR; f = rng.uniform(1500, 2600) * br * (1 + .03 * np.sin(2 * np.pi * rng.uniform(7, 13) * ts))
            sq = (np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * ts / sd) ** 1.5 * .35
            i0 = int(s0 * SR); x[i0:i0 + m] += sq[:len(x) - i0]
    k = int(.004 * SR); x[:k] += bp(rng.standard_normal(k), 2500, 6500) * np.linspace(1, 0, k) * 1.4
    return x * .32 * min(1.3, z ** .5)
def tap(z=1.):
    n = int(.03 * SR); return bp(rng.standard_normal(n), 1800, 6000) * dec(.03, .004) * .36 * min(1.3, z ** .5)
def ring(fs, taus, amps, d):
    x = np.zeros(int(d * SR)); t = tt(d)
    for f, ta, am in zip(fs, taus, amps): x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / ta) * am
    return x
def magnet(big=0):
    d = .5; x = np.zeros(int(d * SR)); k = int(.005 * SR)
    x[:k] += bp(rng.standard_normal(k), 2000, 9000) * np.linspace(1, 0, k) * 1.5
    x += ring([830, 1370, 2210, 3120], [.07, .05, .035, .02], [.35, .25, .15, .08], d) + ring([140 + 30 * big], [.09 + .06 * big], [.9 + .6 * big], d) * .9
    return x * (.55 + .35 * big)
def magnet_off():
    d = .35; x = lp(rng.standard_normal(int(d * SR)), 1800) * np.minimum(1, tt(d) / .15) * dec(d, .1) * .25
    x[:int(.004 * SR)] += bp(rng.standard_normal(int(.004 * SR)), 2500, 8000) * .8; return x
def slide(d):
    n = int(d * SR); return bp(rng.standard_normal(n), 300, 2500) * np.sin(np.pi * tt(d) / d) ** 2 * .18
def eraser(d):
    n = int(d * SR); t = tt(d)
    base = bp(rng.standard_normal(n), 250, 2600) * .6 + bp(rng.standard_normal(n), 2500, 6000) * .15
    return base * (.45 + .55 * np.abs(np.sin(np.pi * t / d * 7))) * np.minimum(1, t / .04) * np.minimum(1, (d - t) / .06) * .5
def slam():                                               # the box hits the ground: wood thud + board boom + rattle
    d = 1.4; t = tt(d); x = ring([62, 95, 180, 410], [.35, .18, .08, .03], [1.4, .9, .5, .25], d)
    x += lp(rng.standard_normal(len(t)), 900) * np.exp(-t / .05) * 1.2
    for o in [.07, .13, .18]: i = int(o * SR); r = ring([520, 1180], [.03, .02], [.3, .15], .1) * (1 - o * 3); x[i:i + len(r)] += r
    return x * .9
def cap_on():
    d = .2; x = np.zeros(int(d * SR))
    for k, o in enumerate([0, .045]):
        i = int(o * SR); n = int(.006 * SR); x[i:i + n] += bp(rng.standard_normal(n), 2500, 9000) * np.linspace(1, 0, n) * (1 - .4 * k)
        r = ring([2600], [.015], [.4], .06); x[i:i + len(r)] += r
    return x * .7
def whoosh(d, v=1.):
    n = int(d * SR); return bp(rng.standard_normal(n), 300, 2400) * np.sin(np.pi * tt(d) / d) ** 2 * .35 * v
def tick(k, f0=1250):
    d = .2; y = np.zeros(int(d * SR)); n = int(.004 * SR); y[:n] += bp(rng.standard_normal(n), 3000, 9000) * 1.2
    return (y + ring([f0 if k % 2 else f0 * 1.18, 2900], [.016, .01], [.35, .15], d)) * .22
def crackle(d):
    n = int(d * SR); x = lp(rng.standard_normal(n), 500) * .05
    pops = (rng.random(n) < 25 / SR) * rng.standard_normal(n); x += bp(pops, 900, 6000) * 1.4
    return x
def alarm(d=1.2):
    t = tt(d); g = (np.sin(2 * np.pi * 14 * t) > 0) * 1.0
    return (np.sin(2 * np.pi * 2300 * t) + .5 * np.sin(2 * np.pi * 3400 * t)) * g * np.minimum(1, (d - t) / .1) * .12
def put(buf, x, t, g=1., pan=0.):
    if 0 <= t < DUR: add(buf, np.asarray(x, np.float32), t, g, pan)

for e in E:
    ty, t = e['type'], e['t']; pan = e.get('pan', 0); z = e.get('z', 1); off = db(-9) if e.get('on', 1) == 0 else 1
    if ty in ('stroke', 'write', 'dash'): put(fol, marker(e['dur'], e['len'], ty, e.get('pen'), z), t, off * (.8 if ty == 'write' else 1.), pan)
    elif ty == 'tap': put(fol, tap(z), t, off, pan)
    elif ty == 'magnet': put(fol, magnet(e.get('big', 0)), t, 1.1, -.05)
    elif ty == 'magnetOff': put(fol, magnet_off(), t, 1, .1); put(fol, slide(C['swap1'] - t), t + .1, 1, 0)
    elif ty == 'erase': put(fol, eraser(e['dur']), t, 1.1, .1)
    elif ty == 'slam': put(fol, slam(), t, 1.1, 0)
    elif ty == 'capOn': put(fol, cap_on(), t, 1, .4)
for t in (C['drop1'], C['drop2']): put(fol, whoosh(.3, .4), t - .3, 1, 0)
by_pen = {}
for e in E:
    if e['type'] in ('stroke', 'write', 'dash', 'tap'): by_pen.setdefault(e['pen'], []).append(e)
for pen, L in by_pen.items():                             # pens flying in/out after long gaps
    L.sort(key=lambda e: e['t'])
    for a, b in zip(L, L[1:]):
        if b['t'] - (a['t'] + a['dur']) > .75: put(fol, whoosh(.38, .3), a['t'] + a['dur'], 1, .5); put(fol, whoosh(.42, .4), b['t'] - .42, 1, .4)
for t0, d, v in C['whips']: put(fol, whoosh(max(.4, d), v), t0, 1, 0)

# room: tone, stopwatch (J-cut into C), campfire crackle (L-cut under the whip back to the trap), wall clock owns the silence, alarm in G
tone = lp(rng.standard_normal(NS), 900) * .010 + lp(rng.standard_normal(NS), 180) * .012
room[:, 0] += tone; room[:, 1] += np.roll(tone, 311)
for k, t in enumerate(np.arange(VO['l11'] - .7, VO['l12'] + 1.2, .5)): put(room, tick(k, 1700), t, 1.0 if t > VO['l11'] else .6, .35)
fa, fb = VO['l14'] + 3.5, C['sil'][1][0] + 1.2; cr = crackle(fb - fa) * np.minimum(1, np.minimum(tt(fb - fa) / 1.5, (fb - fa - tt(fb - fa)) / 1.0))
put(room, cr, fa, .9, .2)
s0, s1 = C['sil'][1]
for k, t in enumerate(np.arange(s0 + .3, s1, C['BEAT'] * 2)): put(room, tick(k), t, 1.3, -.4)
for k, t in enumerate(np.arange(C['sil'][0][0] + .1, C['sil'][0][1], C['BEAT'] * 2)): put(room, tick(k), t, 1.1, -.4)
ia = next(e['t'] for e in E if e['type'] == 'vo' and e['id'] == 'l24') + 5.6
put(room, alarm(1.0), ia, 1, .3)
room = S.room(room, size=.35, mix=.25)

# VO: Piper 22.05 kHz → 48 kHz, compressed, a touch of room
lines = json.load(open(os.path.join(HERE, 'lines.json')))
vm = np.zeros(NS, np.float32)
for L in lines:
    y, sr = sf.read(os.path.join(HERE, 'voice', L['id'] + '.wav')); y = soxr.resample(y.astype(np.float32), sr, SR)
    i = int(VO[L['id']] * SR); vm[i:i + len(y)] += y[:NS - i]
vm = hp(vm, 80); vm = compress(vm / (np.abs(vm).max() + 1e-9) * .8, thr=.2, ratio=3.0, att=.004, rel=.1)
vo[:, 0] = vm; vo[:, 1] = vm
vo = vo * .88 + S.room(vo, size=.18, mix=.1) * .12

# score, ducked under VO
mus, _ = sf.read(os.path.join(HERE, 'music', 'score.wav')); mus = mus[:NS].astype(np.float32)
if len(mus) < NS: mus = np.pad(mus, ((0, NS - len(mus)), (0, 0)))
env = np.convolve(np.abs(vm), np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); on = (env > .02).astype(np.float32)
g = 0.; dk = np.zeros(NS, np.float32); att, rel = int(.06 * SR), int(.35 * SR)
for j in range(0, NS, 240): tgt = on[j]; g += (tgt - g) * (240 / att if tgt > g else 240 / rel); dk[j:j + 240] = g
mus = mus * (1 - (1 - db(-8)) * dk)[:, None]

def rms(x): m = np.abs(x).max(1) > 1e-4; return float(np.sqrt(np.mean(x[m] ** 2))) if m.any() else 1.
vr, mr, fr = rms(vo), rms(mus), rms(fol)
mix = vo + mus * (vr / mr) * db(-9) + fol * (vr / fr) * db(-12) + room
mix = np.stack([compress(mix[:, c], thr=.18, ratio=2.5, att=.003, rel=.12) for c in range(2)], 1)   # bus glue: tames TTS and slam peaks
mix = mix / (np.abs(mix).max() + 1e-9) * .9 * db(6.3)                 # ≈ −14 LUFS; the limiter takes the short marker/magnet transients
mix = np.stack([limit(limit(mix[:, c], .8), .8) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
st = os.path.join(HERE, 'out', 'stems'); os.makedirs(st, exist_ok=True)
for name, x in [('vo', vo), ('music', mus * (vr / mr) * db(-9)), ('foley', fol * (vr / fr) * db(-12)), ('room', room)]:
    sf.write(os.path.join(st, name + '.wav'), x[:int(DUR * SR)].astype(np.float32), SR)
print('rms dB vo/music/foley', round(20 * np.log10(vr), 1), round(20 * np.log10(mr), 1), round(20 * np.log10(fr), 1), 'peak', round(float(np.abs(mix).max()), 3))
