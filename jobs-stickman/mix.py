# Score, foley and voice for «Сколько ты проживёшь в самых смертельных профессиях?» — all synthesized (numpy), seeded, 48 kHz stereo.
# Palette from the style: pizzicato pulse, marimba tallies, kalimba per handshake, glockenspiel for the run, a soft
# vibraphone/strings chord at the end; small rounded foley; a soft low hit on every dive through the bracelet ring.
# usage: python mix.py [out.wav]     reads voice/narration.wav (from align.py), writes out/mix.wav
import numpy as np, soundfile as sf, sys, os
from scipy.signal import butter, lfilter, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'mix.wav')
SR = 48000; DUR = 56.25; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N); M = np.zeros((2, N))   # M: music bus (ducked under the voice)
rng = np.random.default_rng(11)
def lp(x, f, o=2): b, a = butter(o, min(f / (SR / 2), .99)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def put(sig, t0, gain=1., pan=0., music=False):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    s = sig[:N - i] * gain; l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    if music: M[0, i:i + len(s)] += s * l; M[1, i:i + len(s)] += s * r
    else: L[i:i + len(s)] += s * l; R[i:i + len(s)] += s * r
def tt(d): return np.arange(int(d * SR)) / SR
# ---- instruments
def pizz(m, d=.3): t = tt(d); f = mtof(m); return lp(np.sin(2 * np.pi * f * t) + .4 * np.sign(np.sin(2 * np.pi * f * t)), 1200) * np.exp(-t * 11) * np.minimum(1, t / .003)
def marimba(m, d=.6): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 6) + .3 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 28)) * np.minimum(1, t / .002)
def kalimba(m, d=1.2): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.5) + .25 * np.sin(2 * np.pi * f * 5.95 * t) * np.exp(-t * 14)) * np.minimum(1, t / .002)
def glock(m, d=1.4): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 7)) * np.minimum(1, t / .001)
def vib(ms, d): t = tt(d); s = sum(np.sin(2 * np.pi * mtof(m) * t) for m in ms) / len(ms); return s * (1 + .25 * np.sin(2 * np.pi * 5 * t)) * np.minimum(1, t / .02) * np.exp(-t * .5)
def pad(ms, d, cut=1600):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.15, .15): s += 2 / np.pi * np.arcsin(np.sin(2 * np.pi * mtof(m) * (1 + det / 100) * t))
    return lp(s / (2 * len(ms)), cut) * np.minimum(1, t / .4) * np.clip((d - t) / .6, 0, 1)
# ---- foley
def noise(d): return rng.standard_normal(int(d * SR))
def hit(g=1.):                                       # a soft low hit (a dive through the ring, a verdict)
    t = tt(.8); f = 55 + 70 * np.exp(-t * 20); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 1.6) * g
def sweep(d=.3, up=True):
    t = tt(d); x = noise(d); out = np.zeros(len(t)); seg = 1024
    for i in range(0, len(t), seg):
        p = i / len(t); fc = 300 + 3500 * (p if up else 1 - p); out[i:i + seg] = bp(x[max(0, i - 4096):i + seg], fc * .7, fc * 1.3)[-len(x[i:i + seg]):]
    return out * np.sin(np.pi * t / d) ** 2
def blip(f0=600, f1=1200, d=.12): t = tt(d); f = f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
def beep(f=1900, d=.12): t = tt(d); return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .005) * np.clip((d - t) / .02, 0, 1) * .5
def tap(f=900): t = tt(.08); return bp(noise(.08), f * .6, f * 2.2) * np.exp(-t * 70)
def gulp(): t = tt(.18); f = 220 * np.exp(-t * 8) + 90; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
def cough(): t = tt(.28); return bp(noise(.28), 250, 1800) * (np.exp(-t * 14) + .4 * np.exp(-((t - .1) / .04) ** 2))
def scratch(d=.8): t = tt(d); return bp(noise(d), 2500, 7000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 14 * t))) * np.clip(np.minimum(t / .05, (d - t) / .1), 0, 1)
def bed(lo, hi, d, a=.3, r=.3): t = tt(d); return bp(noise(d), lo, hi) * np.clip(np.minimum(t / a, (d - t) / r), 0, 1)
def boom():
    t = tt(1.6); s = lp(noise(1.6), 260) * np.exp(-t * 3.2) * 1.4; h = hit(.8); s[:len(h)] += h; return s
def whistle(d=.45): t = tt(d); f = 1800 * np.exp(-t * 2.2) + 400; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / .05) * .35
def squeak(): t = tt(.16); f = 2600 + 900 * np.sin(np.pi * t / .16); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / .16) * .4
def clink(): t = tt(.4); return (np.sin(2 * np.pi * 3100 * t) + .5 * np.sin(2 * np.pi * 7400 * t)) * np.exp(-t * 16) * .35
def powerdown(): t = tt(.7); f = 900 * np.exp(-t * 4) + 60; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) * .5


def crackle(d=.5):                                  # the bracelet sparking: dry electric ticks
    out = np.zeros(int(d * SR))
    for k in range(int(d * 40)):
        i = int(rng.uniform(0, d - .02) * SR); s = hp(noise(.012), 3000) * np.exp(-tt(.012) * 300); out[i:i + len(s)] += s * rng.uniform(.3, 1)
    return out
def fire_bed(d): t = tt(d); return (lp(noise(d), 900) * .8 + hp(noise(d), 4000) * .25 * (rng.random(len(t)) > .997)) * np.minimum(1, t / .4)
def bubbles(d, n): out = np.zeros(int(d * SR))
def bub(): t = tt(.09); f = 500 + 900 * t / .09; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * .5
def wind(d): t = tt(d); return bp(noise(d), 200, 1600) * np.minimum(1, t / .2) * np.clip((d - t) / .5, 0, 1)
def snap(): t = tt(.25); return bp(noise(.25), 300, 3000) * np.exp(-t * 30) + hit(.5)[:len(t)]

# ---- score: one pulse per job, its own chord; the tally on each verdict; the ring dive between jobs
JOBS = [(0, 4.85, 38, [50, 53, 57]), (4.85, 12.3, 43, [55, 58, 62]), (12.3, 22.05, 36, [48, 51, 55]), (22.05, 32.85, 41, [53, 56, 60]), (32.85, 43.1, 45, [57, 60, 64])]
BEAT = .6
for a, b, root, ch in JOBS:
    t = a; k = 0
    while t < b - .2: put(pizz(root + (0, 7, 12, 7)[k % 4]), t, .5, -.2, True); t += BEAT; k += 1
    put(pad([m + 12 for m in ch], b - a), a, .06, 0, True)
for t0, m in [(10.9, 62), (19.9, 60), (30.4, 61), (40.5, 64)]:
    for i, d in enumerate((0, -3, -7)): put(marimba(m + d), t0 + i * .11, .45, .2, True)
for b in [4.85, 12.3, 22.05, 32.85, 43.1]: put(sweep(.32), b - .32, .35); put(hit(), b, .5)
# hook: the sparking bracelet (the same sound returns at the very end, so the loop has no seam)
for x in (0.0, 1.1, 2.3, 3.6): put(crackle(.45), x, .35, -.3)
# taster: feast, chewing, the cup, the poison, the fall
put(bed(300, 1500, 7.4, .4, .4), 4.85, .06)
for x in np.arange(6.4, 9.0, .45): put(tap(700), x, .25, -.3)
put(clink(), 9.25, .5); put(bed(2000, 6000, 1.4, .3, .4), 9.45, .06)
put(hit(.7), 10.76, .45); put(gulp(), 10.95, .45); put(blip(500, 180, .35), 11.45, .35)
# chimney sweep: scraping, soot, the match, the fire
for x in np.arange(13.0, 19.3, .5): put(bed(1500, 6000, .18, .02, .1), x, .18, .2)
put(tap(4000), 19.3, .5); put(fire_bed(2.6), 19.45, .35, -.1)
for x in np.arange(19.7, 21.9, .25): put(tap(1200), x, .15, .3)
# diver: underwater bed, heavy steps, the hose snaps, bubbles, the squeeze
put(lp(noise(10.8), 400) * np.minimum(1, tt(10.8) / .5), 22.05, .18)
for x in np.arange(25.6, 27.2, .75): put(hit(.4), x, .25)
put(snap(), 27.25, .8)
for i in range(22): put(bub(), 27.3 + i * .08 + rng.uniform(0, .05), .5, rng.uniform(-.5, .5))
put(lp(noise(2.0), 150) * np.linspace(.2, 1, int(2.0 * SR)), 29.05, .6)
# beam: wind at height, the bird, the gust, the sandwich
put(wind(10.2) * .5, 32.85, .25)
for x in np.arange(37.5, 39.8, .17): put(blip(1200, 1500, .05), x, .08, .4)
put(wind(1.6), 40.2, .9, .3); put(sweep(.5), 40.25, .4, .5)
# office: quiet; laptop keys; the mug almost spills; the bracelet goes dark; it sparks again at the end
for x in np.arange(46.1, 48.3, .13): put(tap(3500), x, .12, .3)
put(powerdown(), 48.56, .55)
put(clink() * .6, 52.9, .4); put(blip(700, 1000, .1), 53.2, .2)
for x in (54.7, 55.3, 55.8): put(crackle(.45), x, .35, -.3)
# the ending of the office: the vibraphone gives way to the hook's pulse, so the end runs into the start
put(vib([62, 66, 69], 6.0), 43.1, .22, 0, True); put(pad([50, 57, 62, 66], 11.5, 1200), 43.1, .1, 0, True)
t = 54.6; k = 0
while t < DUR: put(pizz(38 + (0, 7, 12, 7)[k % 4]), t, .5, -.2, True); t += BEAT; k += 1

# ---- voice: compressed, music ducked under it (no fade at the end: the Short loops)
v, vsr = sf.read(os.path.join(HERE, 'voice', 'narration.wav'))
if v.ndim > 1: v = v.mean(1)
if vsr != SR: v = resample_poly(v, SR, vsr)
v = v[:N]; v = np.pad(v, (0, N - len(v)))
env = np.sqrt(np.maximum(lp(v ** 2, 8), 0)); thr = .06
gain = np.where(env > thr, (thr + (env - thr) / 3) / np.maximum(env, 1e-6), 1.); v = v * gain
v = v / (np.sqrt(np.mean(v[np.abs(v) > 1e-3] ** 2)) + 1e-9) * .14
speaking = lp((np.abs(v) > .01).astype(float), 3); duck = 1 - .6 * np.clip(speaking * 3, 0, 1)
M[0] *= duck; M[1] *= duck
mix = np.stack([L + M[0] + v, R + M[1] + v])
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.3) * .9
os.makedirs(os.path.dirname(OUT), exist_ok=True); sf.write(OUT, mix.T, SR, subtype='PCM_16'); print('ok', OUT, mix.shape)
