"""Score + foley + VO → mix.wav for the lighthouse test (Woodcut Print). All synthesised.
Low strings drone, timpani, tam-tam, struck metal; sea, wind, a distant foghorn, knife-into-wood on every new impression,
the lens flare and its ink-out, the paper peel, a clock tick, and a heartbeat locked to the blinking lights."""
import os, sys, json, numpy as np, soundfile as sf, soxr
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); C = next(e for e in ev['ev'] if e['type'] == 'cues')
VO, D, T, DUR, CUTS = C['VO'], C['D'], C['T'], C['DUR'], C['cuts']
rng = np.random.default_rng(9); N = int((DUR + 2) * SR)
mus, fol, room, vo = (np.zeros((N, 2), np.float32) for _ in range(4))
tt = lambda d: np.arange(int(d * SR)) / SR; mtof = lambda m: 440 * 2 ** ((m - 69) / 12); db = lambda x: 10 ** (x / 20)
def put(buf, x, t, g=1., pan=0.):
    if 0 <= t < DUR + 1: add(buf, np.asarray(x, np.float32), t, g, pan)
def drone(m, d, v=1., att=1.5):
    t = tt(d); x = sum((2 * ((mtof(m + det) * t + rng.uniform(0, 1)) % 1) - 1) for det in (-.08, 0, .07)) * (1 + .15 * np.sin(2 * np.pi * 4.8 * t))
    return lp(x, 650) * np.minimum(1, t / att) * np.minimum(1, (d - t) / min(1.5, d * .4)) * v * .05
def timp(m=38, v=1.):
    t = tt(2.2); f = mtof(m) * (1 + .08 * np.exp(-t * 18)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6); x[:200] += lp(rng.standard_normal(200), 2000) * np.linspace(1, 0, 200) * .8; return x * v * .7
def tamtam(d=5., v=1., swell=0.):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / (2.5 * 200 / f + .4)) * (200 / f) ** .3 for f in (61, 97, 133, 188, 261, 349, 470, 612))
    return x * (np.minimum(1, t / swell) if swell else 1) * v * .12
def metal(f=880, v=1., d=2.5):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * r * t) * np.exp(-t * (1.2 + r)) * a for r, a in [(1, 1), (2.76, .5), (5.4, .25), (8.9, .12)]); return x * v * .18
def knife(d=.35, v=1.):
    t = tt(d); x = bp(rng.standard_normal(len(t)), 1800, 7500) * (.4 + .6 * np.abs(np.sin(np.pi * t / d))) * (rng.random(len(t)) < .5)
    x[:200] += bp(rng.standard_normal(200), 1500, 9000) * np.linspace(1.5, 0, 200); return x * np.minimum(1, (d - t) / .05) * .22 * v
def sea(d, v=1.):
    t = tt(d); x = lp(rng.standard_normal(len(t)), 700) * (.55 + .45 * np.sin(2 * np.pi * .13 * t) ** 2); return x * np.minimum(1, np.minimum(t / 1, (d - t) / .8)) * .08 * v
def wind(d, v=1.):
    t = tt(d); return bp(rng.standard_normal(len(t)), 200, 900) * (.6 + .4 * np.sin(2 * np.pi * .11 * t)) * np.minimum(1, np.minimum(t / 1, (d - t) / .6)) * .07 * v
def foghorn(d=2.6, v=1.):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t) / k for k, f in enumerate((92, 184, 276, 368), 1)); return lp(x, 600) * np.minimum(1, t / .4) * np.minimum(1, (d - t) / .8) * v * .22
def heartbeat(v=1.):
    t = tt(.5); x = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 14) + lp(rng.standard_normal(len(t)), 200) * np.exp(-t * 30) * .4; return x * v * .9
def tick(): t = tt(.06); return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 80) * .2
def peel(d=1., v=1.):
    t = tt(d); x = bp(rng.standard_normal(len(t)), 600, 5000) * (t / d) ** 1.5 * np.exp(-((t - d * .75) / (d * .3)) ** 2); return x * .35 * v
def brayer(d=.6, v=1.):
    t = tt(d); return lp(rng.standard_normal(len(t)), 900) * (.5 + .5 * np.sin(2 * np.pi * 11 * t)) * np.sin(np.pi * t / d) * .25 * v
def flare():
    t = tt(1.2); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-((t - .15) / .3) ** 2) for f in (660, 990, 1320)) * .05; x += bp(rng.standard_normal(len(t)), 3000, 9000) * np.exp(-t * 6) * .3; return x
# score: a low drone that never resolves; a timpani on each new impression; a tam-tam swell into the rule card
put(mus, drone(38, T['fog'] + .5, 1.0), 0); put(mus, drone(45, T['fog'] - 1, .6), 1.0)
put(mus, timp(38, .9), .02); put(mus, timp(41, 1.0), T['n40'] - .05); put(mus, metal(587, .9), T['never'])
put(mus, metal(1175, 1.2, 3.0), T['on'], 1, 0)
put(mus, drone(36, T['rule'] - T['fog'] + .5, 1.0), T['fog']); put(mus, tamtam(4.5, .9, swell=T['rule'] - T['fog'] - .3), T['fog'] + .3)
put(mus, timp(34, 1.2), T['rule']); put(mus, drone(41, T['win'] - T['rule'] + .4, .9), T['rule'])
put(mus, drone(38, DUR - T['win'], 1.0), T['win']); put(mus, metal(740, .5), T['lights'], 1, -.3); put(mus, metal(698, .45), T['lights'] + .18, 1, 0); put(mus, metal(659, .4), T['lights'] + .36, 1, .3)
# foley and beds
for t0 in CUTS: put(fol, knife(.35, 1.2), t0, 1, rng.uniform(-.4, .4)); [put(fol, knife(.12, .5), t0 + .08 + k * .07, 1, rng.uniform(-.6, .6)) for k in range(4)]
put(fol, knife(.5, 1.0), T['n40'], 1, -.3); put(fol, knife(.4, .9), T['d40'], 1, -.3); put(fol, knife(.5, 1.0), T['ruleTxt'], 1, 0); put(fol, knife(.4, .9), T['clock'], 1, -.4)
put(fol, flare(), T['on'], 1, 0); put(fol, brayer(.6, 1.2), T['on'] + .55, 1, 0); put(fol, peel(.9, 1.3), T['rule'], 1, .3)
put(room, sea(T['never'], 1.0), 0, 1, .1); put(room, wind(T['rule'] - T['fog'], 1.2), T['fog']); put(room, foghorn(2.8, 1.0), T['smell'] - .4, 1, -.3)
put(room, wind(DUR - T['win'], .8), T['win']); put(room, sea(DUR - T['win'], .5), T['win'], 1, .3)
for k in range(int((DUR - T['clock']))): put(room, tick(), T['clock'] + k, 1, -.4)
t = T['blink'] - .02
while t < DUR - .3:
    put(fol, heartbeat(1.0), t, 1, 0); put(fol, heartbeat(.7), t + .82 * .2, 1, 0); t += .82
tone = lp(rng.standard_normal(N), 900) * .005; room[:, 0] += tone; room[:, 1] += np.roll(tone, 211); room = S.room(room, size=.4, mix=.25)
# voice
lines = json.load(open(os.path.join(HERE, 'lines.json'))); vm = np.zeros(N, np.float32)
for L in lines:
    y, sr = sf.read(os.path.join(HERE, 'voice', L['id'] + '.wav')); y = soxr.resample(y.astype(np.float32), sr, SR); i = int(VO[L['id']] * SR); vm[i:i + len(y)] += y[:N - i]
vm = hp(vm, 80); vm = compress(vm / (np.abs(vm).max() + 1e-9) * .8, thr=.2, ratio=3.0, att=.004, rel=.1)
vo[:, 0] = vm; vo[:, 1] = vm; vo = vo * .9 + S.room(vo, size=.2, mix=.1) * .1
mus = S.room(mus, size=.55, mix=.25)
env = np.convolve(np.abs(vm), np.ones(int(.05 * SR)) / int(.05 * SR), 'same'); on = (env > .02).astype(np.float32); g = 0.; dk = np.zeros(N, np.float32)
for j in range(0, N, 240): tgt = on[j]; g += (tgt - g) * (240 / (.06 * SR) if tgt > g else 240 / (.4 * SR)); dk[j:j + 240] = g
mus = mus * (1 - (1 - db(-8)) * dk)[:, None]; fol = fol * (1 - (1 - db(-3)) * dk)[:, None]
def rms(x): m = np.abs(x).max(1) > 1e-4; return float(np.sqrt(np.mean(x[m] ** 2)))
vr, mr, fr = rms(vo), rms(mus), rms(fol)
mix = vo + mus * (vr / mr) * db(-7) + fol * (vr / fr) * db(-11) + room * 1.4
mix = np.stack([compress(mix[:, c], thr=.18, ratio=2.5, att=.003, rel=.12) for c in range(2)], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * .9 * db(float(os.environ.get('MIXGAIN', 3.3)))
mix = np.stack([limit(limit(mix[:, c], .74), .74) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('dur', DUR, 'rms dB vo/music/foley', round(20 * np.log10(vr), 1), round(20 * np.log10(mr), 1), round(20 * np.log10(fr), 1))
