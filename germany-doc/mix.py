# Score, foley and voice for the documentary «Что если бы Германия выиграла войну» — all synthesized (numpy/scipy), seeded, 48 kHz.
# Score: a slow documentary bed per chapter (string pad, low bass, soft pulse, plucked arpeggio, glockenspiel shimmer),
# minor through the war, a brief major for the "peace", strings only for the chapter «Цена», a warm major resolve at the end.
# Foley from events.json: paper slaps and peels, stamps, card swishes, counters, arrows, sheet whooshes, booms.
# No comic sounds inside «Цена» (lines l021–l024). The bed ducks ~9 dB under the voice.
# usage: python mix.py [out.wav]   reads voice/narration.wav, voice/timing.json, lines.json, events.json → out/mix.wav
import numpy as np, soundfile as sf, sys, os, json
from scipy.signal import butter, lfilter, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'mix.wav')
EVJ = json.load(open(os.path.join(HERE, 'events.json'))); TIM = json.load(open(os.path.join(HERE, 'voice', 'timing.json')))['lines']
SR = 48000; DUR = float(EVJ['dur']); N = int(SR * DUR)
rng = np.random.default_rng(5)
MUS = np.zeros((2, N)); FOL = np.zeros((2, N))
def lp(x, f, o=2): b, a = butter(o, min(f / (SR / 2), .99)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def env(t, d, a=.01, r=.05): return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def put(bus, sig, t0, gain=1., pan=0.):
    i = int(t0 * SR)
    if i >= N or i < 0 or len(sig) == 0: return
    s = sig[:N - i] * gain; l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    bus[0, i:i + len(s)] += s * l; bus[1, i:i + len(s)] += s * r
L0 = lambda i: TIM['l%03d' % i]['t0']; L1 = lambda i: TIM['l%03d' % i]['t1']

# ---- instruments
def strings(ms, d, cut=1400, a=1.2, r=1.5):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.14, .0, .14): s += 2 * ((t * mtof(m) * (1 + det / 100) + rng.random()) % 1) - 1
    return lp(s / (3 * len(ms)), cut) * (1 + .04 * np.sin(2 * np.pi * 5 * t)) * env(t, d, a, r)
def bass(m, d): t = tt(d); f = mtof(m); return lp(np.sin(2 * np.pi * f * t) + .35 * (2 * (t * f % 1) - 1), 300) * env(t, d, .05, .4) * np.exp(-t * .25)
def pluck(m, d=1.2): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6)) * np.exp(-t * 3.2) * np.minimum(1, t / .003)
def glock(m, d=1.6): t = tt(d); f = mtof(m); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.5) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 7)) * np.minimum(1, t / .001)
def pulse(d=.5): t = tt(d); f = 52 + 30 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + lp(noise(d), 200) * np.exp(-t * 20) * .3
def timp(m=38, g=1.): t = tt(2.2); f = mtof(m) * (1 + .04 * np.exp(-t * 20)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8) + lp(noise(2.2), 260) * np.exp(-t * 10) * .4) * g
def brass(ms, d): t = tt(d); s = sum(lp(2 * (t * mtof(m) % 1) - 1, 900) for m in ms) / len(ms); return s * env(t, d, .4, .8)

# ---- the score: sections with a progression (root triads), and which layers play
BEAT = 60 / 72
MINOR = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]          # Dm Bb F C
DARK = [[50, 53, 57], [46, 50, 53], [45, 49, 52], [50, 53, 57]]           # Dm Bb A Dm
MAJOR = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53]]          # F C Dm Bb
RESOLVE = [[50, 54, 57], [55, 59, 62], [47, 50, 54], [57, 61, 64], [50, 54, 57]]   # D G Bm A D
SEC = [
    (0, L0(3), MINOR, 0, dict(pulse=1, arp=0, gl=0)),
    (L0(3), L0(9), MINOR, 0, dict(pulse=1, arp=1, gl=0)),
    (L0(9), L0(14), MAJOR, 0, dict(pulse=0, arp=1, gl=1)),
    (L0(14), L0(21), DARK, -2, dict(pulse=1, arp=1, gl=0, brass=1)),
    (L0(21), L0(25), DARK, -5, dict(pulse=0, arp=0, gl=0, low=1)),
    (L0(25), L0(30), MINOR, 2, dict(pulse=1, arp=1, gl=0)),
    (L0(30), L0(38), DARK, 4, dict(pulse=1, arp=1, gl=1)),
    (L0(38), L0(43) + 1, MINOR, 0, dict(pulse=0, arp=1, gl=0)),
    (L0(43) + 1, DUR, RESOLVE, 0, dict(pulse=0, arp=1, gl=1, warm=1)),
]
for (a, b, prog, tr, ly) in SEC:
    chordLen = 8 * BEAT * (1.5 if ly.get('low') else 1); k = 0; t0 = a
    while t0 < b - .5:
        d = min(chordLen, b - t0) + 1.2; ch = [m + tr for m in prog[k % len(prog)]]
        if ly.get('low'): put(MUS, strings([m - 12 for m in ch], d, 700, 2, 2), t0, .5)
        else: put(MUS, strings(ch, d, 1600 if ly.get('warm') else 1300), t0, .42, -.15); put(MUS, strings([ch[0] + 12], d, 2200), t0, .12, .3)
        put(MUS, bass(ch[0] - 24, min(chordLen, b - t0) + .3), t0, .5)
        if ly.get('brass'): put(MUS, brass([ch[0] - 12, ch[2] - 12], d), t0, .12)
        nb = int(min(chordLen, b - t0) / BEAT)
        for j in range(nb):
            tb = t0 + j * BEAT
            if ly.get('pulse') and j % 2 == 0: put(MUS, pulse(), tb, .45)
            if ly.get('arp'):
                for h in range(2):
                    m = [ch[0], ch[1], ch[2], ch[1] + 12][(j * 2 + h) % 4] + 12
                    put(MUS, pluck(m, 1.0), tb + h * BEAT / 2, .14, .25 if h else -.25)
            if ly.get('gl') and j % 4 == 2: put(MUS, glock(ch[2] + 24), tb, .06, .4)
        if ly.get('low') and k % 2 == 0: put(MUS, timp(ch[0] - 24, .35), t0 + .1, .5)
        t0 += chordLen; k += 1
# chapter cards: a soft timpani hit and a rising swell
for c in json.load(open(os.path.join(HERE, 'lines.json')))['chapters']:
    t = TIM[c['first']]['t0']; put(MUS, timp(38, .7), t - .05, .7); s = noise(1.2); put(MUS, bp(s, 300, 3000) * np.linspace(0, 1, len(s)) ** 2, t - 1.2, .12)

# ---- foley
def slap(g=1.): t = tt(.35); f = 70 + 60 * np.exp(-t * 25); return (bp(noise(.35), 400, 5000) * np.exp(-t * 45) + np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * .9) * g
def whoosh(d=.45, up=True):
    t = tt(d); x = noise(d); out = np.zeros(len(t)); sg = 1024
    for i in range(0, len(t), sg):
        p = i / len(t); fc = 300 + 2600 * (p if up else 1 - p); out[i:i + sg] = bp(x[max(0, i - 4096):i + sg], fc * .7, fc * 1.3)[-len(x[i:i + sg]):]
    return out * np.sin(np.pi * t / d) ** 2
def stamp(): t = tt(.4); return lp(noise(.4), 900) * np.exp(-t * 30) * 1.4 + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 18) * .8
def swish(): t = tt(.3); return bp(noise(.3), 1500, 7000) * np.sin(np.pi * t / .3) ** 2 * .6
def tick(): t = tt(.05); return bp(noise(.05), 2000, 6000) * np.exp(-t * 90)
def roll(d=1.3):
    out = np.zeros(int(d * SR) + 4000)
    for k in range(16):
        i = int((1 - (1 - k / 16) ** 2) * d * SR); s = tick() * (.8 - .03 * k); out[i:i + len(s)] += s
    return out
def scratch(d=.35): t = tt(d); return bp(noise(d), 2500, 7000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 18 * t))) * env(t, d, .02, .08) * .6
def hit(g=1.): t = tt(1.2); f = 50 + 60 * np.exp(-t * 18); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * 1.6) * g
def boom(d=2.5):
    t = tt(d); s = lp(noise(d), 220) * np.exp(-t * 1.8) * 1.6; h = hit(.8); s[:len(h)] += h[:len(s)]; return s
def nuke(): t = tt(7); s = lp(noise(7), 140) * np.minimum(1, t / .05) * np.exp(-t * .55) * 2.2; s[:len(hit())] += hit(1.)[:len(s)]; return s
def peel(): t = tt(.6); return bp(noise(.6), 1800, 6000) * (.5 + .5 * np.sin(2 * np.pi * 40 * t * (1 - t / .6))) * env(t, .6, .1, .1) * .5
def fire(d=2.5): t = tt(d); x = noise(d) * (rng.random(len(t)) > .995) * 6; return (bp(x, 800, 5000) + lp(noise(d), 300) * .15) * env(t, d, .3, .8) * .5
def planes(d=3.5): t = tt(d); f = 95 + 10 * np.sin(2 * np.pi * .4 * t); return lp(2 * ((np.cumsum(f) / SR) % 1) - 1, 600) * env(t, d, 1, 1) * .5 + bp(noise(d), 200, 900) * env(t, d, 1, 1) * .3
def launch(d=2.5): t = tt(d); return lp(noise(d), 900) * env(t, d, .3, .8) * (1 + t) * .5
def wall(d=1.6): t = tt(d); return lp(noise(d), 160) * env(t, d, .2, .5) * 1.4
def crack(): t = tt(.5); return bp(noise(.5), 1500, 8000) * (rng.random(len(t)) > .7) * np.exp(-t * 6) * 1.2
def coin_seq():
    out = np.zeros(int(1.6 * SR))
    for k in range(6): i = int(k * .22 * SR); t = tt(.3); s = (np.sin(2 * np.pi * 3200 * t) + .5 * np.sin(2 * np.pi * 4700 * t)) * np.exp(-t * 20) * .3; out[i:i + len(s)] += s
    return out
def popsnd(): t = tt(.15); f = 500 + 900 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25) * .5
def click(): t = tt(.06); return bp(noise(.06), 1000, 4000) * np.exp(-t * 80)
def draw(d=1.2): t = tt(d); return bp(noise(d), 2000, 6000) * (.6 + .4 * np.sin(2 * np.pi * 7 * t)) * env(t, d, .05, .2) * .25

QUIET = (L0(21) - .5, L1(24) + 1)
for e in EVJ['ev']:
    t, ty = e['t'], e['type']; quiet = QUIET[0] <= t <= QUIET[1]
    if quiet and ty not in ('soft', 'whoosh', 'tick'): continue
    pan = rng.uniform(-.3, .3)
    if ty == 'slap': put(FOL, slap(), t, .55, pan)
    elif ty == 'peel': put(FOL, peel(), t, .5, pan)
    elif ty == 'paper': put(FOL, swish(), t, .3, pan)
    elif ty == 'stamp': put(FOL, stamp(), t, .6)
    elif ty == 'card': put(FOL, swish(), t, .4, pan)
    elif ty == 'count': put(FOL, roll(), t + .15, .5)
    elif ty == 'soft': put(FOL, swish(), t, .15)
    elif ty == 'arrow': put(FOL, whoosh(.6), t, .25, pan)
    elif ty == 'draw': put(FOL, draw(), t, .5)
    elif ty == 'whoosh': put(FOL, whoosh(.5), t, .35)
    elif ty == 'slam': put(FOL, whoosh(.3), t - .25, .4); put(FOL, hit(.8), t, .6)
    elif ty == 'tick': put(FOL, tick(), t, .25, .6)
    elif ty == 'scratch': put(FOL, scratch(), t, .5)
    elif ty in ('hit', 'thud'): put(FOL, hit(), t, .5)
    elif ty == 'boom': put(FOL, boom(), t, .7)
    elif ty == 'nuke': put(FOL, nuke(), t, .9)
    elif ty == 'fire': put(FOL, fire(), t, .4, pan)
    elif ty == 'planes': put(FOL, planes(), t, .45, -.4)
    elif ty == 'launch': put(FOL, launch(), t, .5, .4)
    elif ty == 'wall': put(FOL, wall(), t, .7)
    elif ty == 'crack': put(FOL, crack(), t, .5)
    elif ty == 'coins': put(FOL, coin_seq(), t, .6)
    elif ty == 'pop': put(FOL, popsnd(), t, .5, pan)
    elif ty == 'click': put(FOL, click(), t, .8, .4)
# a moment of silence in the music before the Trinity flash
tn = next(e['t'] for e in EVJ['ev'] if e['type'] == 'nuke'); a, b = int((tn - 1.5) * SR), int((tn + 4) * SR)
MUS[:, a:b] *= np.concatenate([np.linspace(1, 0, int(1.5 * SR)), np.zeros(b - a - int(1.5 * SR))])[None, :]
c = int(4 * SR); MUS[:, b:b + c] *= np.linspace(0, 1, c)[None, :]

# ---- voice, ducking, master
v, vsr = sf.read(os.path.join(HERE, 'voice', 'narration.wav')); v = v.mean(1) if v.ndim > 1 else v
if vsr != SR: v = resample_poly(v, SR, vsr)
v = np.pad(v, (0, max(0, N - len(v))))[:N]; v = hp(v, 70) / (np.abs(v).max() + 1e-9) * .9
e = lp(np.abs(v), 6); e = np.minimum(1, e / (np.percentile(e[e > 1e-4], 50) + 1e-9)); w = int(SR * .3); e = np.clip(np.convolve(e, np.ones(w) / w, 'same'), 0, 1)
MUS = MUS / (np.abs(MUS).max() + 1e-9) * .30 * (1 - .62 * e)
FOL = FOL / (np.abs(FOL).max() + 1e-9) * .55 * (1 - .3 * e)
mix = MUS + FOL + np.stack([v, v])
fade = np.minimum(1, np.arange(N) / (SR * .05)) * np.clip((N - np.arange(N)) / (SR * 1.5), 0, 1)
mix = mix * fade; mix = mix / (np.abs(mix).max() + 1e-9) * .89
os.makedirs(os.path.dirname(OUT), exist_ok=True); sf.write(OUT, mix.T, SR, subtype='PCM_24'); print('wrote', OUT, f'{DUR:.1f}s')
