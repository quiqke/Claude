# Score, foley and voice for «Сколько ты проживёшь в каждой эпохе?» — all synthesized (numpy), seeded, 48 kHz stereo.
# Palette from the style: pizzicato pulse, marimba tallies, kalimba per handshake, glockenspiel for the run, a soft
# vibraphone/strings chord at the end; small rounded foley; a soft low hit on every dive through the bracelet ring.
# usage: python mix.py [out.wav]     reads voice/narration.wav (from align.py), writes out/mix.wav
import numpy as np, soundfile as sf, sys, os
from scipy.signal import butter, lfilter, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'mix.wav')
SR = 48000; DUR = 66.0; N = int(SR * DUR)
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

# ---- score: one pulse per epoch, its own chord; the tally on each verdict; the ring dive between epochs
EPOCHS = [(0, 7.7, 38, [50, 53, 57]), (7.7, 12.95, 41, [53, 57, 60]), (12.95, 18.95, 43, [55, 58, 62]), (20.3, 26.6, 38, [50, 53, 57]),
          (26.6, 33.95, 34, [46, 50, 53]), (33.95, 40.25, 41, [53, 57, 60]), (40.25, 45.6, 36, [48, 51, 55]), (45.6, 50.75, 37, [49, 52, 56])]
BEAT = .6
for a, b, root, ch in EPOCHS:
    t = a + .05; k = 0
    while t < b - .25:
        put(pizz(root + (0, 7, 12, 7)[k % 4]), t, .55, -.2, True); t += BEAT; k += 1
    put(pad([m + 12 for m in ch], b - a), a, .07, 0, True)
VERDICT = [(6.7, 62), (12.25, 65), (17.95, 67), (30.9, 58), (39.35, 72), (44.7, 60), (49.85, 61)]
for t0, m in VERDICT:
    for i, d in enumerate((0, -3, -7) if m != 72 else (0, 4, 7, 12)): put(marimba(m + d), t0 + i * .11, .45, .2, True)
for b in [7.7, 12.95, 26.6, 33.95, 40.25, 45.6, 50.75]:
    put(sweep(.32), b - .32, .35); put(hit(), b, .5)
put(beep(), 7.2, .5, .3)                                   # «Писк»
# ---- foley per epoch (times from the picture)
put(bed(1500, 6000, 7.7), 0, .12)                           # blizzard
for i in range(28): put(tap(2200), .2 + i * .25, .05, -.3)  # chattering teeth
put(glock(88), 3.12, .25, .3)                               # the scratch
put(bed(60, 300, 2.2, 1.2, .5), 4.6, .5)                    # the beast comes out of the snow
for i in range(9): put(bed(80, 400, .4, .05, .2), 7.9 + i * .32, .25, -.4)   # the block drags
put(gulp(), 10.9, .5); put(gulp(), 11.25, .45); put(scratch(.5) * .3, 11.8, .4)
put(bed(300, 1500, 6.0, .5, .5), 12.95, .1)                 # arena crowd
for x in (13.8, 14.3, 14.8): put(sweep(.25), x, .2, .3)
put(whistle(.3), 15.18, .5); put(hit(1.2), 15.45, .8); put(tap(500), 15.45, .6)
put(blip(300, 700, .2), 16.6, .4); put(bed(300, 1500, 1.2, .3, .8), 16.6, .25)
put(hit(.9), 19.06, .6)                                      # «Стоп»: the film stops
put(glock(84), 20.9, .3); put(tap(3000), 22.06, .4)
for i in range(8): put(glock(74 + (0, 2, 4, 7, 9, 12, 14, 16)[i]), 23.15 + i * .32, .3, -.4 + .1 * i, True)
for x in (23.95, 24.85, 25.85): put(sweep(.18, False), x, .25)
put(bed(100, 900, 7.3), 26.6, .08)                           # plague street
put(scratch(.85), 29.15, .35)
for i, x in enumerate((29.73, 29.88, 30.02)): put(blip(1400, 2200, .06), x, .3, .3 - .2 * i)
put(hit(.8), 30.85, .6)
put(bed(100, 700, 6.3, .5, .5) * (1 + .5 * np.sin(2 * np.pi * .25 * tt(6.3))), 33.95, .18)   # the sea
for x in np.arange(35.85, 36.8, .07): put(tap(1800), x, .12)
put(squeak(), 38.42, .6, .3); put(squeak(), 38.75, .4, .5)
for i in range(9): put(tap(700), 40.4 + i * .6, .25, .4)    # the factory beat
for x in (40.9, 41.3, 41.7, 42.05): put(cough(), x, .7)
put(bed(200, 2000, 2.0, 1.4, .4), 43.6, .12)
for x in (47.6, 47.95, 48.25, 49.1): put(whistle(), x - .45, .5); put(boom(), x, .8)
put(bed(2000, 8000, 2.3, .6, .4), 48.4, .12)
put(bed(100, 400, 1.8, .2, .6), 51.0, .02)                   # near silence, room tone
t0 = 53.15
for i in range(4): put(beep(660 if i % 2 else 880, .28) * .3, t0 + i * .3, .25, .5)
put(tap(1500), 54.23, .5); put(clink(), 54.85, .6); put(gulp(), 55.3, .5)
put(powerdown(), 56.0, .6)
# ---- the ending: chord, kalimba per handshake, glockenspiel along the chain, the rows, a final chord
put(vib([62, 66, 69], 9.0), 57.0, .25, 0, True); put(pad([50, 57, 62, 66], 9.0, 1200), 57.0, .12, 0, True)
for i in range(5): put(blip(500, 900, .12), 57.57 + i * .12, .2, -.4 + .2 * i)
for i, x in enumerate((58.72, 58.84, 58.96, 59.08)): put(kalimba(74 + (0, 2, 4, 7)[i]), x, .5, .3 - .2 * i, True); put(tap(900), x, .25)
for i in range(5): put(glock(86 + (0, 2, 4, 7, 12)[i]), 59.55 + i * .16, .3, 0, True)
for x in (60.45, 60.85, 61.2):
    for i in range(6): put(kalimba(62 + (0, 4, 7, 12, 16, 19)[i], .8), x + i * .03, .12, -.5 + .2 * i, True)
put(vib([62, 66, 69, 74], 4.0), 61.9, .4, 0, True); put(pad([38, 50, 57, 66], 4.1, 1400), 61.9, .2, 0, True)

# ---- voice: compressed, music ducked under it
v, vsr = sf.read(os.path.join(HERE, 'voice', 'narration.wav'))
if v.ndim > 1: v = v.mean(1)
if vsr != SR: v = resample_poly(v, SR, vsr)
v = v[:N]; v = np.pad(v, (0, N - len(v)))
env = np.sqrt(np.maximum(lp(v ** 2, 8), 0)); thr = .06
gain = np.where(env > thr, (thr + (env - thr) / 3) / np.maximum(env, 1e-6), 1.); v = v * gain   # 3:1 above the threshold
v = v / (np.sqrt(np.mean(v[np.abs(v) > 1e-3] ** 2)) + 1e-9) * .14
speaking = lp((np.abs(v) > .01).astype(float), 3); duck = 1 - .6 * np.clip(speaking * 3, 0, 1)
M[0] *= duck; M[1] *= duck
mix = np.stack([L + M[0] + v, R + M[1] + v])
t = np.arange(N) / SR; mix *= np.clip((DUR - t) / 1.5, 0, 1)
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.3) * .9
os.makedirs(os.path.dirname(OUT), exist_ok=True); sf.write(OUT, mix.T, SR, subtype='PCM_16'); print('ok', OUT, mix.shape)
