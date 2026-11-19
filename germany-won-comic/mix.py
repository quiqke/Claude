# Score and foley for «Что если бы Германия выиграла войну?» — all synthesized (numpy), seeded, 48 kHz stereo, no voice.
# Each side has its own instrument family: Germany — tuba oom-pah; Britain — a bagpipe-like drone; USSR — a bayan (reed
# accordion); USA — banjo and a horn call. Paper foley: snips, slaps, a rip, peels. The dark panel (28–33.5 s) is only low
# strings and slow timpani — no comic sounds there.  usage: python mix.py [out.wav]   reads events.json, writes out/mix.wav
import numpy as np, soundfile as sf, sys, os, json
from scipy.signal import butter, lfilter
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'mix.wav')
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
SR = 48000; DUR = float(EVJ['dur']); N = int(SR * DUR)
B = {e['type']: e['t'] for e in EVJ['ev'] if 'k' not in e}
SLAPS = [e['t'] for e in EVJ['ev'] if e['type'] == 'slap' and 'k' in e]; PEELS = [e['t'] for e in EVJ['ev'] if e['type'] == 'peel' and 'k' in e]
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
def lp(x, f, o=2): b, a = butter(o, min(f / (SR / 2), .99)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def put(sig, t0, gain=1., pan=0.):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    s = sig[:N - i] * gain; l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:i + len(s)] += s * l; R[i:i + len(s)] += s * r
def env(t, d, a=.01, r=.05): return np.minimum(1, t / a) * np.clip((d - t) / r, 0, 1)

# ---- instruments
def tuba(m, d=.35): t = tt(d); f = mtof(m); s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.2 for k in range(1, 6)); return lp(s, 700) * np.minimum(1, t / .03) * np.exp(-t * 3) * env(t, d, .03, .05)
def brass(ms, d=.18): t = tt(d); s = sum(lp(2 * (t * mtof(m) % 1) - 1, 1800) for m in ms) / len(ms); return s * np.exp(-t * 9) * env(t, d, .008, .03)
def xylo(m, d=.4): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 14) + .3 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 40)) * np.minimum(1, t / .001)
def glock(m, d=1.4): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 7)) * np.minimum(1, t / .001)
def drone(ms, d):  # bagpipe-like: bright buzzy saws with a slow swell
    t = tt(d); s = sum(lp(2 * (t * mtof(m) * (1 + .002 * k) % 1) - 1, 2400) for k, m in enumerate(ms)) / len(ms)
    return s * env(t, d, .5, .6)
def chanter(m, d): t = tt(d); f = mtof(m) * (1 + .006 * np.sin(2 * np.pi * 6 * t)); ph = 2 * np.pi * np.cumsum(f) / SR; return bp(np.sign(np.sin(ph)) * .6 + np.sin(ph), 400, 3500) * env(t, d, .02, .05)
def bayan(ms, d):  # free-reed accordion: two detuned narrow pulses per note, bellows swell
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.25, .25): s += (((t * mtof(m) * (1 + det / 100)) % 1) < .3) - .3
    return lp(s / (2 * len(ms)), 2600) * (.75 + .25 * np.sin(np.pi * np.minimum(1, t / d))) * env(t, d, .05, .08)
def banjo(m, d=.5):  # Karplus–Strong, bright and short
    n = int(d * SR); p = max(2, int(SR / mtof(m))); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .985
    return hp(out, 300)
def horn(m, d): t = tt(d); f = mtof(m); ph = 2 * np.pi * f * t; return lp(np.sin(ph) + .5 * np.sin(2 * ph) + .25 * np.sin(3 * ph), 1400) * env(t, d, .06, .15) * .7
def strings(ms, d, cut=900):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.12, .12): s += lp(2 * (t * mtof(m) * (1 + det / 100) % 1) - 1, cut)
    return s / (2 * len(ms)) * env(t, d, .9, 1.2)
def timp(m=38, g=1.): t = tt(1.6); f = mtof(m) * (1 + .05 * np.exp(-t * 20)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4) + lp(noise(1.6), 300) * np.exp(-t * 12) * .4) * g
def pad(ms, d, cut=1600):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.15, .15): s += 2 / np.pi * np.arcsin(np.sin(2 * np.pi * mtof(m) * (1 + det / 100) * t))
    return lp(s / (2 * len(ms)), cut) * env(t, d, .4, .8)
# ---- foley
def snip(): t = tt(.09); return bp(noise(.09), 2500, 9000) * np.exp(-t * 60) + np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 90) * .3
def slap(g=1.):   # paper slapped onto a table: a crack plus a soft low thump
    t = tt(.35); s = bp(noise(.35), 400, 5000) * np.exp(-t * 45); f = 70 + 60 * np.exp(-t * 25)
    return (s + np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * .9) * g
def whoosh(d=.35, up=True):
    t = tt(d); x = noise(d); out = np.zeros(len(t)); sg = 1024
    for i in range(0, len(t), sg):
        p = i / len(t); fc = 300 + 3000 * (p if up else 1 - p); out[i:i + sg] = bp(x[max(0, i - 4096):i + sg], fc * .7, fc * 1.3)[-len(x[i:i + sg]):]
    return out * np.sin(np.pi * t / d) ** 2
def hit(g=1.): t = tt(.8); f = 55 + 70 * np.exp(-t * 20); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 1.6) * g
def rip(d=.7): t = tt(d); return bp(noise(d), 1200, 7000) * (.4 + .6 * (rng.random(len(t)) > .4)) * env(t, d, .02, .15) * (1 + .5 * np.sin(2 * np.pi * 23 * t))
def peel(d=.5): t = tt(d); return bp(noise(d), 1800, 6000) * (.5 + .5 * np.sin(2 * np.pi * 40 * t * (1 - t / d))) * env(t, d, .1, .1) * .6
def boing(): t = tt(.6); f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * .6
def fwump(): t = tt(.3); return lp(noise(.3), 700) * np.sin(np.pi * t / .3) ** 2 * 1.2
def creak(d=.5): t = tt(d); f = 140 + 30 * np.sin(2 * np.pi * 3 * t); return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 1600) * env(t, d, .05, .1) * .35
def fall_whistle(d=.8): t = tt(d); f = 1500 * np.exp(-t * 1.6) + 300; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, d, .05, .1) * .25

# ======== the score ========
TDE = 0.5                                    # Germany: oom-pah at 120 bpm, D minor
# 0–4: scissors and a light tuba walk
for k in range(14): put(snip(), .25 + k * .2856, .55, -.2 + .03 * k)
for k, m in enumerate([38, 45, 38, 45, 41, 45, 38, 33]): put(tuba(m, .4), .2 + k * TDE, .5)
# 4–12: the march: oom on the beat, pah on the off-beat; xylophone hops before each slap; a slap per patch
prog = [(38, [62, 65, 69]), (45, [61, 64, 69]), (38, [62, 65, 69]), (43, [62, 67, 70])]
for k in range(16):
    t0 = 4.2 + k * TDE; bass, ch = prog[(k // 2) % 4]
    put(tuba(bass if k % 2 == 0 else bass + 7, .4), t0, .55); put(brass(ch, .16), t0 + TDE / 2, .22, .2)
for s in SLAPS[:5]:
    for j, m in enumerate([74, 77, 81]): put(xylo(m), s - .42 + j * .1, .3, .3)
    put(slap(), s, .9, -.1); put(whoosh(.3, False), s - .3, .25)
# 12: face slam — a hit and a smug tuba sting
put(whoosh(.4), B['slam1'] - .35, .4); put(hit(), B['slam1'], .6); put(tuba(38, .9), B['slam1'] + .15, .6); put(brass([62, 65, 69], .5), B['slam1'] + .15, .3)
for k, m in enumerate([50, 53, 57, 62]): put(xylo(m + 12), B['slam1'] + .8 + k * .12, .25)
# 14.4–21: the Channel — a drone with a chanter tune, tuba fragments from across the water
put(drone([38, 45, 50], 6.6), B['channel'], .16, -.3)
for k, (m, d) in enumerate([(62, .6), (64, .3), (66, .3), (69, .9), (67, .3), (66, .3), (64, .6), (62, 1.2)]):
    put(chanter(m + 12, d), B['channel'] + .4 + sum(x[1] for x in [(62, .6), (64, .3), (66, .3), (69, .9), (67, .3), (66, .3), (64, .6), (62, 1.2)][:k]), .12, -.3)
for k, m in enumerate([38, 45, 38, 45]): put(tuba(m, .35), B['channel'] + .2 + k * TDE, .35, .4)
put(fwump(), B['umbrella'], .7, -.3); put(whoosh(.45), B['throw'] - .1, .5, .2)
put(boing(), B['bounce'], .8, -.2); put(slap(.6), B['bounce'], .6, -.2); put(fall_whistle(1.0), B['bounce'] + .1, .7, -.5)
put(tuba(33, .8), B['bounce'] + .5, .5, .3)    # deflated low note
# 21–28: the East — bayan chords against tuba, creaks of the tug, a rip, a heavy slap
for k, ch in enumerate([[50, 53, 57], [50, 53, 57], [48, 52, 55], [45, 49, 52], [50, 53, 57], [46, 50, 53], [45, 49, 52], [50, 53, 57]]):
    put(bayan(ch, .8), B['east'] + .1 + k * .45, .3, .35)
for k in range(7): put(tuba(38 if k % 2 == 0 else 45, .35), B['east'] + .3 + k * TDE, .35, -.3); put(creak(.45), B['east'] + .5 + k * .5, .5, (-1) ** k * .2)
put(rip(.8), B['tear'] - .2, .9); put(hit(.5), B['tear'] + .4, .5)
put(slap(1.2), SLAPS[5], 1.0); put(timp(38, .5), SLAPS[5], .6)
put(bayan([45, 48, 52], 1.6), SLAPS[5] + .5, .25, .35)    # the bayan sinks
# 28–33.5: the dark panel — low strings and slow timpani only
put(strings([38, 41, 45, 50], B['us'] - B['dark'] + .6, 700), B['dark'], .55)
put(strings([26, 33], B['us'] - B['dark'] + .6, 400), B['dark'], .5)
for k in range(3): put(timp(33, .5), B['dark'] + .6 + k * 1.7, .5)
# 33.5–41: USA — banjo picking and a horn call; the 1945 tag shimmers
pat = [55, 59, 62, 67, 62, 59]
for k in range(int((B['slam2'] - B['us']) / .21)): put(banjo(pat[k % 6] + (2 if (k // 12) % 2 else 0), .45), B['us'] + .2 + k * .21, .32, -.25)
for k in range(10): put(tuba(43 if k % 2 == 0 else 50, .3), B['us'] + .2 + k * .42, .25, .3)
for k, (m, d) in enumerate([(67, .3), (72, .3), (76, .9)]): put(horn(m, d + .1), B['tag'] - .9 + [0, .3, .6][k], .35, -.2)
for k, m in enumerate([84, 88, 91, 96]): put(glock(m), B['tag'] + k * .07, .18, -.3)
put(pad([60, 64, 67, 72], 2.4, 2400), B['tag'], .12, -.2)
# 38.3: shock — a hit and a falling tuba glissando
put(whoosh(.4), B['slam2'] - .35, .4); put(hit(1.), B['slam2'], .7)
t = tt(1.4); f = mtof(45) * 2 ** (-np.minimum(1, t / 1.2) * 1.0); put(lp(sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in range(1, 5)), 700) * env(t, 1.4, .03, .2) * (1 + .3 * np.sin(2 * np.pi * 7 * t)), B['slam2'] + .2, .55)
# 41–47: it falls apart — a stumbling march, peels and fall whistles
for k in range(11):
    t0 = B['peel'] + k * .55 + (rng.random() - .5) * .06; put(tuba(38 - (k // 3), .4), t0, .4 * (1 - k / 14)); put(brass([62 - k // 3, 65 - k // 3], .14), t0 + .27, .14 * (1 - k / 14), .2)
for p in PEELS: put(peel(.5), p, .7, rng.uniform(-.4, .4)); put(fall_whistle(1.0), p + .3, .45, rng.uniform(-.5, .5)); put(slap(.4), p + 1.5, .35)
# 47–51: the question card slaps on; a hanging, unresolved chord
put(slap(1.), B['end'] + .32, .9); put(timp(38, .4), B['end'] + .32, .5)
put(pad([50, 57, 62, 64], DUR - B['end'] - .3, 2000), B['end'] + .3, .3)
for k, m in enumerate([74, 76, 81]): put(glock(m), B['end'] + .9 + k * .5, .16)
# ---- master
mix = np.stack([L, R]); fade = np.minimum(1, np.arange(N) / (SR * .02)) * np.clip((N - np.arange(N)) / (SR * .8), 0, 1)
mix = mix * fade; mix = mix / (np.abs(mix).max() + 1e-9) * .89
os.makedirs(os.path.dirname(OUT), exist_ok=True); sf.write(OUT, mix.T, SR, subtype='PCM_24'); print('wrote', OUT, f'{DUR:.1f}s')
