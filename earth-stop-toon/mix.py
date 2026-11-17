# Score, foley and voice for «Что если Земля остановится на 1 секунду?» (Sci-Fi Sitcom Toon) — all synthesized (numpy), seeded, 48 kHz stereo.
# Palette from the style: pizzicato pulse, marimba tallies, kalimba per handshake, glockenspiel for the run, a soft
# vibraphone/strings chord at the end; small rounded foley; a soft low hit on every dive through the bracelet ring.
# usage: python mix.py [out.wav]     reads voice/narration.wav (from align.py), writes out/mix.wav
import numpy as np, soundfile as sf, sys, os
from scipy.signal import butter, lfilter, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'mix.wav')
import json
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
SR = 48000; DUR = float(EVJ['dur']); N = int(SR * DUR)
B = {e['type']: e['t'] for e in EVJ['ev']}
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


def wind(d): t = tt(d); return bp(noise(d), 200, 1600) * np.minimum(1, t / .2) * np.clip((d - t) / .5, 0, 1)
def pluck(m, d=.3): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 12) * np.minimum(1, t / .002)
# ---- voices of the style: theremin lead, analog bass, square arpeggio, drum machine, a few genre colours
def theremin(m, d, glide_from=None):
    t = tt(d); f0 = mtof(m); f = np.full(len(t), f0)
    if glide_from: f = mtof(glide_from) + (f0 - mtof(glide_from)) * np.minimum(1, t / .07)
    vib = 1 + .012 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, np.maximum(0, t - .15) / .2)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; s = np.sin(ph) + .18 * np.sin(2 * ph) + .08 * np.sin(3 * ph)
    return s * np.minimum(1, t / .04) * np.clip((d - t) / .12, 0, 1) * .5
def abass(m, d=.4): t = tt(d); f = mtof(m); s = 2 * (t * f % 1) - 1; return (lp(s, 1500) * np.exp(-t * 10) + lp(s, 500) * (1 - np.exp(-t * 10))) * np.exp(-t * 3) * np.minimum(1, t / .005)
def sq(m, d=.12): t = tt(d); f = mtof(m); return np.sign(np.sin(2 * np.pi * f * t)) * .3 * np.exp(-t * 14)
def dkick(): t = tt(.3); f = 50 + 100 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
def dsnare(): t = tt(.2); return bp(noise(.2), 1200, 6000) * np.exp(-t * 20) * .6 + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 30) * .4
def dhat(): t = tt(.05); return bp(noise(.05), 6000, 11000) * np.exp(-t * 80) * .4
def nylon(m, d=.9):   # Karplus–Strong pluck (elevator bossa)
    n = int(d * SR); p = int(SR / mtof(m)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return lp(out, 3000)
def tremolo(ms, d): t = tt(d); s = sum(np.sin(2 * np.pi * mtof(m) * t) + .3 * np.sin(4 * np.pi * mtof(m) * t) for m in ms) / len(ms); return s * (.6 + .4 * np.sign(np.sin(2 * np.pi * 12 * t))) * np.minimum(1, t / .1) * np.clip((d - t) / .2, 0, 1)
def tuba(m, d=.35): t = tt(d); f = mtof(m); s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.2 for k in range(1, 6)); return lp(s, 700) * np.minimum(1, t / .03) * np.exp(-t * 3)
def slide(d=.6, up=True): t = tt(d); f = (500 + 900 * t / d) if up else (1400 - 900 * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * .4
def rhodes(ms, d): t = tt(d); return sum(np.sin(2 * np.pi * mtof(m) * t) * (1 + .3 * np.sin(2 * np.pi * mtof(m) * 2 * t)) for m in ms) / len(ms) * np.exp(-t * .8) * np.minimum(1, t / .01)
def moo(): t = tt(.9); f = 120 + 30 * np.sin(np.pi * t / .9); ph = 2 * np.pi * np.cumsum(f) / SR; s = sum(np.sin(ph * k) * np.exp(-((k * f - 700) / 300) ** 2) for k in range(1, 12)); return s * np.sin(np.pi * t / .9) * .5
def hum(d): t = tt(d); return (np.sin(2 * np.pi * 110 * t) + .3 * np.sin(2 * np.pi * 220 * t)) * .15 * (1 + .2 * np.sin(2 * np.pi * 7 * t))

def section(a, b, kind):
    BEAT = .5; t = a; k = 0
    if b - a < .2: return
    if kind == 'theme':           # D minor, the chromatic descent on the theremin
        mel = [62, 57, 58, 57, 52, 53, 52, 51]
        for i, m in enumerate(mel):
            x = a + i * .5
            if x < b - .3: put(theremin(m + 12, .48, mel[i - 1] + 12 if i else None), x, .35, .1, True)
        while t < b - .1:
            put(abass(38 + (0, 0, 5, 3)[k % 4]), t, .5, 0, True); put(dkick() if k % 2 == 0 else dsnare(), t, .35, 0, True); put(dhat(), t + .25, .3, .3, True); t += BEAT; k += 1
    elif kind == 'arp':           # space: square arpeggio over a pad
        put(pad([62, 65, 69], b - a), a, .07, 0, True)
        while t < b - .05: put(sq((62, 65, 69, 74)[k % 4] + 12), t, .35, (-.3, .3)[k % 2], True); t += .125; k += 1
    elif kind == 'surf':          # street: surf-ish tremolo pluck + drums
        while t < b - .1:
            put(abass(40 + (0, 7, 5, 3)[k % 4], .3), t, .5, 0, True); put(dkick() if k % 2 == 0 else dsnare(), t, .35, 0, True)
            for j in range(4): put(pluck(64 + (0, 3, 7, 3)[k % 4], .15), t + j * .06, .12, .3, True)
            t += BEAT; k += 1
    elif kind == 'storm': put(tremolo([50, 53, 57, 62], b - a), a, .25, 0, True)
    elif kind == 'tuba':
        while t < b - .1: put(tuba((38, 45, 41, 45)[k % 4], .32), t, .5, 0, True); t += BEAT; k += 1
        put(slide(.6, True), a + .3, .3, .3, True)
    elif kind == 'rhodes': put(rhodes([62, 66, 69, 73], b - a), a, .3, 0, True); put(theremin(74, min(1.6, b - a)), a + .2, .25, .1, True)
    elif kind == 'bossa':
        while t < b - .1:
            put(nylon((50, 57, 55, 57)[k % 4], .5), t, .4, -.2, True)
            for j, m in enumerate((62, 65, 69)): put(nylon(m, .4), t + .25 + j * .02, .12, .2, True)
            put(dhat(), t + .25, .2, .3, True); t += BEAT; k += 1

S = B
section(0, S['stop'], 'theme')
section(S['space'], S['street'], 'arp'); section(S['street'], S['storm'], 'surf'); section(S['storm'], S['ocean'], 'storm')
section(S['ocean'], S['lab2'], 'tuba'); section(S['lab2'], S['good'], 'theme'); section(S['good'], S['bad'], 'rhodes')
# «Плохая:» — the music stops dead, room tone only, until the yard
section(S['yard'] + .2, DUR - .2, 'bossa')
put(pad([50, 57, 62], DUR - S['ask']), S['ask'], .08, 0, True)
# ---- foley
put(hum(S['press'] + 1.0), 0, .5)                                   # the button hums
put(tap(2500), S['press'] + .1, .8); put(hit(.6), S['press'] + .12, .5)
put(hit(1.2), S['stop'], .9); put(bed(40, 200, .8, .01, .6), S['stop'], .6)         # the planet brakes
put(sweep(.5), S['notYou'], .6, .6); put(blip(400, 150, .3), S['notYou'] + .05, .4)
for x in [S['space'], S['street'], S['storm'], S['ocean'], S['lab2'], S['yard']]: put(sweep(.4), x - .3, .45); put(hit(.5), x, .3)
put(bed(300, 2400, S['storm'] - S['street'], .2, .3), S['street'], .25, .3)      # rushing air on the street
put(clink(), S['coffee'], .5, .3); put(beep(520, .25) * .8, S['cars'], .4, .4); put(moo(), S['cows'], .55, .3)
put(wind(S['ocean'] - S['storm']) * .8, S['storm'], .6)
for x in np.arange(S['rip'], S['rip'] + 1.6, .4): put(sweep(.25, False), x, .35, .5)
put(bed(60, 600, S['lab2'] - S['ocean'], .4, .4), S['ocean'], .6)                # the ocean
put(tap(2500), S['lab2'] + .55, .7); put(gulp(), S['lab2'] + 1.3, .4)
put(sweep(.4), S['spins'] - .1, .5, -.6); put(blip(200, 600, .35), S['spins'] + .5, .45)
put(hum(S['yard'] - S['bad']) * .3, S['bad'], .3)                              # the cold pause: only the fridge hum
put(blip(900, 700, .1), S['other'] + .2, .2)
put(bed(800, 4000, 2.5, .8, .8) * .3, S['yard'], .1)                           # birds-ish air in the yard

# ---- voice
VP = os.path.join(HERE, 'voice', 'narration.wav')
v, vsr = sf.read(VP) if os.path.exists(VP) else (np.zeros(N), SR)
if v.ndim > 1: v = v.mean(1)
if vsr != SR: v = resample_poly(v, SR, vsr)
v = v[:N]; v = np.pad(v, (0, N - len(v)))
env = np.sqrt(np.maximum(lp(v ** 2, 8), 0)); thr = .06
gain = np.where(env > thr, (thr + (env - thr) / 3) / np.maximum(env, 1e-6), 1.); v = v * gain
v = v / (np.sqrt(np.mean(v[np.abs(v) > 1e-3] ** 2)) + 1e-9) * .14 if np.any(np.abs(v) > 1e-3) else v
speaking = lp((np.abs(v) > .01).astype(float), 3); duck = 1 - .55 * np.clip(speaking * 3, 0, 1)
M[0] *= duck; M[1] *= duck
mix = np.stack([L + M[0] + v, R + M[1] + v])
t = np.arange(N) / SR; mix *= np.clip((DUR - t) / 1.2, 0, 1)
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.3) * .9
os.makedirs(os.path.dirname(OUT), exist_ok=True); sf.write(OUT, mix.T, SR, subtype='PCM_16'); print('ok', OUT, mix.shape)
