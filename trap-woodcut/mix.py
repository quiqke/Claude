"""Score + foley + VO → mix.wav for «Ловушка» (Woodcut Print). All synthesised: low strings (pizzicato, drone), log drum,
woodblock, gran cassa, timpani, tam-tam, struck metal; knife-into-wood, brayer, paper peel, the box slam.
Every hit sits on a plate cut or a carve that the picture places on a spoken word (events.json cues.T)."""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); C = next(e for e in ev['ev'] if e['type'] == 'cues')
VO, D, T, DUR, CUTS = C['VO'], C['D'], C['T'], C['DUR'], C['cuts']
rng = np.random.default_rng(7)
N = int((DUR + 2) * SR); mus, fol, room, vo = (np.zeros((N, 2), np.float32) for _ in range(4))
tt = lambda d: np.arange(int(d * SR)) / SR
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
db = lambda x: 10 ** (x / 20)
def put(buf, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 1: add(buf, np.asarray(x, np.float32), t, g, pan)

# ── instruments
def pizz(m, v=1.):
    f = mtof(m); t = tt(1.0); x = sum(np.sin(2 * np.pi * f * k * t + rng.uniform(0, 3)) * np.exp(-t * (5 + k * 3)) / k ** 1.1 for k in range(1, 9))
    x[:50] += rng.standard_normal(50) * .2; return lp(x, 2400) * v * .5
def drone(m, d, v=1., att=1.5):
    t = tt(d); x = np.zeros(len(t))
    for det in (-.08, 0, .07): f = mtof(m + det); x += (2 * ((f * t + rng.uniform(0, 1)) % 1) - 1) * (1 + .15 * np.sin(2 * np.pi * 4.8 * t))
    return lp(x, 700) * np.minimum(1, t / att) * np.minimum(1, (d - t) / min(1.5, d * .4)) * v * .05
def timp(m=38, v=1.):
    t = tt(2.2); f = mtof(m) * (1 + .08 * np.exp(-t * 18)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) + .4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.exp(-t * 3)
    x[:200] += lp(rng.standard_normal(200), 2000) * np.linspace(1, 0, 200) * .8; return x * v * .7
def cassa(v=1.):
    t = tt(2.5); x = np.sin(2 * np.pi * 48 * t) * np.exp(-t * 1.4) + .5 * np.sin(2 * np.pi * 71 * t) * np.exp(-t * 2.4) + lp(rng.standard_normal(len(t)), 400) * np.exp(-t * 6) * .6
    return x * v * .9
def logdrum(f=180, v=1.):
    t = tt(.4); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 14) + .5 * np.sin(2 * np.pi * f * 2.3 * t) * np.exp(-t * 22)) * v * .5
def woodblock(v=1., f=1000):
    t = tt(.12); x = np.sin(2 * np.pi * f * t) * np.exp(-t / .02) + .5 * np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t / .01); return x * v * .3
def tamtam(d=5., v=1., swell=.0):
    t = tt(d); x = np.zeros(len(t))
    for f in (61, 97, 133, 188, 261, 349, 470, 612, 803):
        x += np.sin(2 * np.pi * f * t * (1 + .002 * np.sin(2 * np.pi * .7 * t)) + rng.uniform(0, 6)) * np.exp(-t / (2.5 * 200 / f + .4)) * (200 / f) ** .3
    env = np.minimum(1, t / max(.01, swell)) if swell else 1
    return x * env * v * .12
def metal(f=880, v=1., d=2.5):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * r * t) * np.exp(-t * (1.2 + r)) * a for r, a in [(1, 1), (2.76, .5), (5.4, .25), (8.9, .12)])
    x[:100] += rng.standard_normal(100) * .2; return x * v * .18

# ── foley
def knife(d=.35, v=1.):
    n = int(d * SR); t = tt(d); x = bp(rng.standard_normal(n), 1800, 7500) * (.4 + .6 * np.abs(np.sin(np.pi * t / d))) * (rng.random(n) < .5)
    x[:200] += bp(rng.standard_normal(200), 1500, 9000) * np.linspace(1.5, 0, 200)
    return x * np.minimum(1, (d - t) / .05) * .22 * v
def brayer(d=.6, v=1.):
    n = int(d * SR); t = tt(d); return lp(rng.standard_normal(n), 900) * (.5 + .5 * np.sin(2 * np.pi * 11 * t)) * np.sin(np.pi * t / d) * .25 * v
def peel(d=1., v=1.):
    n = int(d * SR); t = tt(d); x = bp(rng.standard_normal(n), 600, 5000) * (t / d) ** 1.5 * np.exp(-((t - d * .75) / (d * .3)) ** 2)
    k = int(.02 * SR); x[-k:] += bp(rng.standard_normal(k), 300, 3000) * np.linspace(1, 0, k) * 2; return x * .35 * v
def crack(v=1.):
    t = tt(.6); x = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 18); x += sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 9) for f in (220, 340, 510)) * .3; return x * v * .7
def crackle(d, v=1.):
    n = int(d * SR); x = lp(rng.standard_normal(n), 600) * .03 + bp((rng.random(n) < 28 / SR) * rng.standard_normal(n), 900, 6500) * 1.2
    return x * np.minimum(1, np.minimum(tt(d) / .4, (d - tt(d)) / .4)) * v
def wind(d, v=1.):
    n = int(d * SR); t = tt(d); return bp(rng.standard_normal(n), 200, 900) * (.6 + .4 * np.sin(2 * np.pi * .13 * t)) * np.minimum(1, np.minimum(t / 1, (d - t) / .6)) * .06 * v
def hum(d, v=1.):
    t = tt(d); return (lp(rng.standard_normal(len(t)), 250) * .05 + np.sin(2 * np.pi * 50 * t) * .008) * np.minimum(1, np.minimum(t / .5, (d - t) / .5)) * v

h = T['h']
# ── score (D minor). Hook: hard hits on the three impressions, log-drum pulse under it
put(mus, cassa(.9), 0, 1, 0); put(mus, timp(38, .9), 0)
put(mus, timp(41, 1.), T['you'], 1, -.2); put(mus, cassa(1.1), T['tall'], 1, 0); put(mus, metal(587, .8), T['tall'], 1, .3)
BEAT = 60 / 84
for k in range(int(T['trap'] / (BEAT / 2))): put(mus, logdrum(170 if k % 2 else 130, .7), k * BEAT / 2, 1, -.3 if k % 2 else .3)
put(mus, drone(38, T['dig'] + .5, 1.0), 0, 1, 0)
# trap: pizzicato ostinato + tam-tam swell into the snap
pat = [38, 45, 41, 45]; k = 0; t = T['trap']
while t < T['dig']: put(mus, pizz(pat[k % 4], .9), t, 1, -.2); k += 1; t += BEAT / 2
put(mus, tamtam(4, .9, swell=T['trapSnap'] - T['trap']), T['trap'], 1, 0); put(mus, timp(36, 1.1), T['trapSnap'], 1, 0)
# dig: low pulse; a struck-metal ping per skeleton; dissonance on the teeth and the spine
t = T['dig']
while t < T['camp']: put(mus, pizz(26 + (int(t / BEAT) % 2) * 7, .7), t, 1, 0); t += BEAT
put(mus, drone(26, T['camp'] - T['dig'] + .5, .9), T['dig']); put(mus, metal(659, .9), T['hunters'], 1, -.3); put(mus, metal(622, .9), T['farmers'], 1, .3)
put(mus, metal(698, .5), T['teeth'], 1, .3); put(mus, metal(740, .5), T['spine'], 1, .4)
# camp: warm — pizzicato arpeggio, drone, soft log drum; «17 ч» gets a timpani roll
t = T['camp']; arp = [50, 57, 62, 65, 62, 57]; k = 0
while t < T['dark']: put(mus, pizz(arp[k % 6], .6), t, 1, .2); k += 1; t += BEAT / 2
put(mus, drone(50, T['dark'] - T['camp'] + .2, .8), T['camp']); put(mus, timp(38, .8), T['n17'])
# the lamp goes out: silence; the grain lands on one pure bell
put(mus, metal(1175, 1.2, 4.0), T['seed'], 1, 0)
# series: one hit per impression, a layer added each time
for i, x in enumerate(h):
    put(mus, cassa(.7 + i * .1), x, 1, 0); put(mus, timp(38 + i * 2, .8), x, 1, .2)
    put(mus, drone(38 + [0, 7, 12, 15, 19][i], (h[i + 1] if i < 4 else T['back']) - x + .3, .6 + i * .15), x)
t = h[2]
while t < T['back']: put(mus, logdrum(150, .6), t, 1, -.3); t += BEAT / 4
# back: open drone; then digital silence right before the slam
put(mus, drone(26, T['slam'] - T['back'], 1.0), T['back']); put(mus, tamtam(3.5, .7, swell=2.5), T['back'] + .5)
put(mus, cassa(1.5), T['slam'], 1, 0); put(mus, timp(34, 1.4), T['slam'], 1, 0); put(mus, tamtam(6, 1.3), T['slam'], 1, 0)
# city: cold metal and slow pizzicato; finale: the hook's pulse, quieter; last timpani
put(mus, drone(37, T['fin'] - T['peel'] + .5, .7), T['peel']); t = T['peelEnd']
while t < T['fin']: put(mus, metal(880 + 110 * (int(t * 2) % 3), .35, 1.2), t, 1, (int(t * 2) % 3 - 1) * .4); t += BEAT
t = T['fin']
while t < DUR - 1: put(mus, logdrum(150 if int(t / BEAT * 2) % 2 else 120, .45), t, 1, .2); t += BEAT / 2
put(mus, drone(38, DUR - T['fin'], .7), T['fin']); put(mus, timp(38, 1.0), DUR - 1.3)

# ── foley: a knife into wood on every new impression, chips during carves
for t0, kind in CUTS:
    if kind == 'dark': continue
    put(fol, knife(.35, 1.2), t0, 1, rng.uniform(-.4, .4))
    for k in range(4): put(fol, knife(.12, .5), t0 + .08 + k * .07, 1, rng.uniform(-.6, .6))
for t0 in (T['hunters'], T['farmers'], T['n17']): put(fol, knife(.5, 1.0), t0, 1, 0)
put(fol, brayer(.6, 1.2), T['dark'], 1, 0)
put(fol, knife(.3, 1.4), T['seed'] - .2, 1, 0)
put(fol, crack(1.4), T['slam'], 1, 0)
put(fol, peel(1.0, 1.4), T['peel'], 1, .3)
put(room, crackle(T['you'], 1.0), 0, 1, -.1); put(room, crackle(T['dark'] - T['camp'], 1.0), T['camp'], 1, 0); put(room, crackle(DUR - T['fin'], .8), T['fin'], 1, -.1)
put(room, hum(T['tall'] - T['you'], .8), T['you']); put(room, wind(T['camp'] - T['trap'], 1.0), T['trap']); put(room, wind(T['slam'] - T['back'], 1.0), T['back'])
put(room, hum(T['fin'] - T['peel'], 1.0), T['peel'])
tone = lp(rng.standard_normal(N), 900) * .005; room[:, 0] += tone; room[:, 1] += np.roll(tone, 211)
room = S.room(room, size=.3, mix=.2)

# ── voice (Piper 22.05 kHz → 48 kHz): low and plain, forward
lines = json.load(open(os.path.join(HERE, 'lines.json'))); vm = np.zeros(N, np.float32)
for L in lines:
    y, sr = sf.read(os.path.join(HERE, 'voice', L['id'] + '.wav')); y = soxr.resample(y.astype(np.float32), sr, SR)
    i = int(VO[L['id']] * SR); vm[i:i + len(y)] += y[:N - i]
vm = hp(vm, 80); vm = compress(vm / (np.abs(vm).max() + 1e-9) * .8, thr=.2, ratio=3.0, att=.004, rel=.1)
vo[:, 0] = vm; vo[:, 1] = vm; vo = vo * .9 + S.room(vo, size=.15, mix=.1) * .1

# silences: the lamp-out (music only) and digital silence before the slam (music + beds)
def hush(buf, a, b, f=.2):
    i0, i1, k = int(a * SR), int(b * SR), int(f * SR); buf[i0:i0 + k] *= np.linspace(1, 0, k)[:, None]; buf[i0 + k:i1] = 0
hush(mus, T['dark'] + .1, T['seed'] - .05); hush(mus, T['slam'] - .45, T['slam'] - .01, .1); hush(room, T['slam'] - .45, T['slam'] - .01, .1)
mus = S.room(mus, size=.5, mix=.22)
env = np.convolve(np.abs(vm), np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); on = (env > .02).astype(np.float32)
g = 0.; dk = np.zeros(N, np.float32)
for j in range(0, N, 240): tgt = on[j]; g += (tgt - g) * (240 / (.06 * SR) if tgt > g else 240 / (.4 * SR)); dk[j:j + 240] = g
mus = mus * (1 - (1 - db(-8)) * dk)[:, None]; fol = fol * (1 - (1 - db(-4)) * dk)[:, None]
def rms(x): m = np.abs(x).max(1) > 1e-4; return float(np.sqrt(np.mean(x[m] ** 2))) if m.any() else 1.
vr, mr, fr = rms(vo), rms(mus), rms(fol)
mix = vo + mus * (vr / mr) * db(-7) + fol * (vr / fr) * db(-14) + room * 1.2
mix = np.stack([compress(mix[:, c], thr=.18, ratio=2.5, att=.003, rel=.12) for c in range(2)], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * .9 * db(GAIN := float(os.environ.get('MIXGAIN', 7.0)))
mix = np.stack([limit(limit(mix[:, c], .8), .8) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
st = os.path.join(HERE, 'out', 'stems'); os.makedirs(st, exist_ok=True)
for name, x in [('vo', vo), ('music', mus * (vr / mr) * db(-7)), ('foley', fol * (vr / fr) * db(-14)), ('room', room)]: sf.write(os.path.join(st, name + '.wav'), x[:int(DUR * SR)].astype(np.float32), SR)
print('dur', DUR, 'gain', GAIN, 'rms dB vo/music/foley', round(20 * np.log10(vr), 1), round(20 * np.log10(mr), 1), round(20 * np.log10(fr), 1))
