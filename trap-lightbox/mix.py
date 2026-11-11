"""Score + foley + VO → mix.wav for «Ловушка» (Paper-cut Lightbox). Everything synthesised (no samples).
Score: felt piano, music box, celesta, soft strings — A minor, 72 BPM. The lamp-off silence before «А потом человек посадил зерно».
Reads events.json (cues: VO, END, plan) + lines.json + voice/dur.json. usage: $LIB/.venv/bin/python mix.py"""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); DUR = ev['dur']; C = next(e for e in ev['ev'] if e['type'] == 'cues')
VO, END = C['VO'], C['END']; PLAN = dict((p[0] + ('#2' if p[0] in dict(C['plan'][:i]) else ''), p[1]) for i, p in enumerate(C['plan']))
lines = json.load(open(os.path.join(HERE, 'lines.json'))); D = json.load(open(os.path.join(HERE, 'voice', 'dur.json')))
LN = {L['id']: L for L in lines}
def AT(id, word, k=0):
    s = (LN[id].get('say') or LN[id]['text']).lower(); i = -1
    for _ in range(k + 1): i = s.index(word.lower(), i + 1)
    return VO[id] + .03 + (D[id] - .1) * (i / len(s))
rng = np.random.default_rng(3)
N = int((DUR + 2) * SR); mus, fol, room, vo = (np.zeros((N, 2), np.float32) for _ in range(4))
tt = lambda d: np.arange(int(d * SR)) / SR
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
db = lambda x: 10 ** (x / 20)
def put(buf, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 1: add(buf, np.asarray(x, np.float32), t, g, pan)

# ── key moments (same formulas as the picture)
tA, tB, tH = AT('l01', 'вдвое'), AT('l01', 'тебя'), AT('l02', 'здоровее')
tOff = VO['l05'] + D['l05'] + .25; tG = AT('l06', 'зерно') - .1
hits = [AT('l07', 'еды'), AT('l07', 'детей'), AT('l07', 'больше людей'), AT('l07', 'больше полей', 1), AT('l07', 'работы')]
tFor = AT('l08', 'назад'); tSlam = AT('l09', 'ловушка') + .03; tCity = PLAN['cityBox']; tOut = AT('l09', 'до сих')
tEnd = PLAN['twoWindows#2']; tStrip17 = AT('l05', 'семнадцати')

# ── instruments
def piano(m, v=1., d=2.2):
    f = mtof(m); t = tt(d); x = np.zeros(len(t))
    for k in range(1, 8): fk = f * k * np.sqrt(1 + .0004 * k * k); x += np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.2 + k * .9)) / k ** 1.3
    x *= np.minimum(1, t / .006); x = lp(x, 2600)                      # felt: soft, dark attack
    return x * v * .32
def mbox(m, v=1.):
    f = mtof(m); t = tt(1.4)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + .35 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 9) + .12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 18)
    x[:40] += rng.standard_normal(40) * .05
    return x * v * .16
def celesta(m, v=1.):
    f = mtof(m); t = tt(2.5); x = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.6) + .3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3)
    return x * v * .2
def strings(ms, d, v=1., att=1.2):
    t = tt(d); x = np.zeros(len(t))
    for m in ms:
        for det in (-.07, 0, .06):
            f = mtof(m + det); ph = rng.uniform(0, 1)
            saw = 2 * ((f * t + ph) % 1) - 1; x += saw * (1 + .1 * np.sin(2 * np.pi * 5.2 * t))
    x = lp(x, 1500) * np.minimum(1, t / att) * np.minimum(1, (d - t) / min(1.2, d * .4))
    return x * v * .018
BEAT = 60 / 72; BAR = 4 * BEAT
CH = [(57, [45, 52, 57, 60, 64]), (53, [41, 48, 53, 57, 60]), (48, [48, 52, 55, 60, 64]), (55, [43, 50, 55, 59, 62])]   # Am F C G
def chord(t): return CH[int(max(0, t) / BAR) % 4]
def arps(t0, t1, v=.7, step=BEAT / 2, pat=(0, 2, 3, 4, 3, 2), pan=-.2):
    k = 0; t = np.ceil(t0 / step) * step
    while t < t1: _, ns = chord(t); put(mus, piano(ns[pat[k % len(pat)]] + 12, v * (1 if k % 2 == 0 else .7)), t, 1, pan); k += 1; t += step
def pad(t0, t1, v=1., oct=0):
    t = np.floor(t0 / BAR) * BAR
    while t < t1:
        a, b = max(t, t0), min(t + BAR, t1)
        if b - a > .2: _, ns = chord(t); put(mus, strings([ns[1] + oct, ns[2] + oct, ns[4] + oct], b - a + .6, v, .6 if a > t0 else 1.2), a, 1, 0)
        t += BAR
MEL = [76, 74, 72, 71, 72, 69]                                           # the music-box motif
def motif(t0, v=1., tr=0, step=BEAT):
    for i, m in enumerate(MEL): put(mus, mbox(m + tr, v), t0 + i * step, 1, .25)

# ── score
arps(.0, tOff, .7)                                                        # hook → camp: felt piano
motif(.25, .9); motif(PLAN['dig'] + .2, .7)
pad(PLAN['trapTease'], tOff, .8)
put(mus, celesta(81, .9), tA, 1, -.3); put(mus, celesta(76, .7), tB, 1, .3)
put(mus, celesta(84, .7), PLAN['trapTease'] + .1, 1, 0)
# silence: the lamp goes out (tOff → tG). One celesta note lights the grain.
put(mus, celesta(88, 1.1), tG, 1, 0); put(mus, celesta(81, .6), tG + BEAT, 1, .2)
# growth: piano returns and quickens, strings rise, one music-box note per «больше»
arps(hits[0] - .1, tSlam, .65, BEAT / 2); arps(hits[2], tSlam, .5, BEAT / 4, (0, 3, 2, 4), .3)
pad(hits[0] - .2, tSlam, 1.1); pad(hits[2], tSlam, .8, 12)
for i, h in enumerate(hits): put(mus, mbox(72 + [0, 2, 4, 5, 7][i], 1.1), h, 1, .2)
# the box shuts: everything cuts; the city: cold, slow
i0 = int(tSlam * SR); mus[i0:] *= 0
def coldpad(t0, t1): put(mus, strings([57, 60, 64, 71], t1 - t0, 1.1, 1.0), t0, 1, 0)
coldpad(tCity + .1, tEnd + 1.0); motif(tCity + .6, .7, -12, BEAT * 1.2)
# ending: the hook's piano, unresolved, and a last celesta
arps(tEnd, END - .6, .6); put(mus, celesta(76, .9), END - 1.2, 1, 0)

# ── foley and beds
def crackle(d, v=1.):
    n = int(d * SR); x = lp(rng.standard_normal(n), 600) * .04; pops = (rng.random(n) < 30 / SR) * rng.standard_normal(n); x += bp(pops, 900, 6500) * 1.3
    return x * np.minimum(1, np.minimum(tt(d) / .5, (d - tt(d)) / .5)) * v
def hum(d, v=1.):
    t = tt(d); x = lp(rng.standard_normal(len(t)), 300) * .06 + np.sin(2 * np.pi * 55 * t) * .01 + bp(rng.standard_normal(len(t)), 800, 2500) * .01
    return x * np.minimum(1, np.minimum(t / 1, (d - t) / .5)) * v
def crickets(d, v=1.):
    t = tt(d); g = (np.sin(2 * np.pi * 15 * t) > .3) * (np.sin(2 * np.pi * .7 * t) > -.2)
    return np.sin(2 * np.pi * 4300 * t) * g * .02 * np.minimum(1, np.minimum(t / 1, (d - t) / .4)) * v
def paper(d=.35, v=1.):
    n = int(d * SR); x = bp(rng.standard_normal(n), 1500, 7000) * (rng.random(n) < .3) * 1.0 + bp(rng.standard_normal(n), 400, 2000) * .3
    return x * np.sin(np.pi * tt(d) / d) ** 1.5 * .25 * v
def switch():
    d = .9; t = tt(d); x = np.zeros(len(t)); n = int(.005 * SR); x[:n] += bp(rng.standard_normal(n), 2000, 8000) * np.linspace(1, 0, n)
    for f in (1760, 2217, 2637, 3520): x += np.sin(2 * np.pi * f * t) * np.exp(-((t - .35) / .25) ** 2) * .02     # rising shimmer
    return x
def thud():
    d = 1.2; t = tt(d); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / ta) * a for f, ta, a in [(55, .35, 1.2), (90, .2, .7), (180, .08, .4)])
    x += lp(rng.standard_normal(len(t)), 700) * np.exp(-t / .04) * .8
    return x * .8
def whoosh(d=.7, v=1.):
    n = int(d * SR); return bp(rng.standard_normal(n), 300, 2500) * np.sin(np.pi * tt(d) / d) ** 2 * .15 * v
put(room, crackle(PLAN['trapTease'] + .5, 1.0), 0, 1, -.1)
put(room, crackle(tOff + .4 - PLAN['camp'], 1.1), PLAN['camp'], 1, 0)
put(room, crickets(tOff - PLAN['camp'] + .3, 1.0), PLAN['camp'], 1, .3)
put(room, hum(PLAN['trapTease'] + .5, .6), 0, 1, .1)
put(room, hum(tEnd - tCity + .6, 1.2), tCity, 1, 0)
put(room, crackle(END - tEnd, .9), tEnd, 1, -.1); put(room, hum(END - tEnd, .5), tEnd, 1, .1)
for t in (tA, tB, tStrip17): put(fol, paper(.4, 1), t, 1, .2)
for p in ('trapTease', 'dig', 'camp', 'growth', 'twoWindows#2'): put(fol, whoosh(.8, .6), PLAN[p] - .2, 1, 0)
put(fol, switch(), tG - .05, 1, 0); put(fol, switch(), tCity + .05, 1, 0)
for h in hits: put(fol, paper(.45, 1.4), h - .1, 1, 0)
put(fol, paper(1.2, 1.0), tFor, 1, -.5)
put(fol, whoosh(.35, 1.2), tSlam - .35, 1, 0); put(fol, thud(), tSlam, 1.4, 0)
for k in range(6): put(fol, switch() * .4, tCity + .2 + k * .25, 1, (k % 3 - 1) * .3)
tone = lp(rng.standard_normal(N), 900) * .006; room[:, 0] += tone; room[:, 1] += np.roll(tone, 211)
room = S.room(room, size=.3, mix=.2)

# ── voice (Piper 22.05 kHz → 48 kHz), forward and compressed
vm = np.zeros(N, np.float32)
for L in lines:
    y, sr = sf.read(os.path.join(HERE, 'voice', L['id'] + '.wav')); y = soxr.resample(y.astype(np.float32), sr, SR)
    i = int(VO[L['id']] * SR); vm[i:i + len(y)] += y[:N - i]
vm = hp(vm, 80); vm = compress(vm / (np.abs(vm).max() + 1e-9) * .8, thr=.2, ratio=3.0, att=.004, rel=.1)
vo[:, 0] = vm; vo[:, 1] = vm; vo = vo * .9 + S.room(vo, size=.15, mix=.1) * .1

# ── silence when the lamp goes out: music and beds drop to room tone
for buf in (mus,):
    a, b = int(tOff * SR), int((tG - .05) * SR); f = int(.25 * SR); buf[a:a + f] *= np.linspace(1, 0, f)[:, None]; buf[a + f:b] = 0
mus = S.room(mus, size=.45, mix=.25)
env = np.convolve(np.abs(vm), np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); on = (env > .02).astype(np.float32)
g = 0.; dk = np.zeros(N, np.float32)
for j in range(0, N, 240): tgt = on[j]; g += (tgt - g) * (240 / (.06 * SR) if tgt > g else 240 / (.4 * SR)); dk[j:j + 240] = g
mus = mus * (1 - (1 - db(-6)) * dk)[:, None]
def rms(x): m = np.abs(x).max(1) > 1e-4; return float(np.sqrt(np.mean(x[m] ** 2))) if m.any() else 1.
vr, mr, fr = rms(vo), rms(mus), rms(fol)
mix = vo + mus * (vr / mr) * db(-8) + fol * (vr / fr) * db(-16) + room * 1.2
mix = np.stack([compress(mix[:, c], thr=.18, ratio=2.5, att=.003, rel=.12) for c in range(2)], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * .9 * db(7.5)
mix = np.stack([limit(limit(mix[:, c], .8), .8) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
st = os.path.join(HERE, 'out', 'stems'); os.makedirs(st, exist_ok=True)
for name, x in [('vo', vo), ('music', mus * (vr / mr) * db(-8)), ('foley', fol * (vr / fr) * db(-16)), ('room', room)]: sf.write(os.path.join(st, name + '.wav'), x[:int(DUR * SR)].astype(np.float32), SR)
print('dur', DUR, 'rms dB vo/music/foley', round(20 * np.log10(vr), 1), round(20 * np.log10(mr), 1), round(20 * np.log10(fr), 1))
