# Score + sound effects for «Сколько ты проживёшь»: synthesized in code (instrument voices from the Halftone Dossier demo), 120 BPM, one bar = 2 s
import numpy as np
from scipy.signal import lfilter, butter
import wave, sys, os
# usage: python music.py [output.wav]   writes music.wav next to this script by default
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music.wav')

SR = 44100
DUR = 50.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
BEAT = 0.5
BAR = 2.0

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * l * 1.414
    R[i:i + len(sig)] += sig * r * 1.414

def env(n, a=0.002, d=0.2, s=0.0, rel=0.05, hold=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if hold is None:
        e = e * np.exp(-np.maximum(0, t - a) / d)
    else:
        e = np.where(t < hold, e, e * np.exp(-(t - hold) / rel))
    return e

def lp(x, fc, order=2):
    b, a = butter(order, min(fc / (SR / 2), 0.99)); return lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)

# ---------- instruments ----------
def kick(g=1.0):
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 9) + 0.25 * np.exp(-t * 300) * rng.standard_normal(n) * 0.3
    return np.tanh(s * 1.6) * g

def snare():
    n = int(0.22 * SR); t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1500, 8000) * np.exp(-t * 18)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return noise * 0.7 + tone * 0.5

def clap():
    n = int(0.25 * SR); out = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR); m = n - i; t = np.arange(m) / SR
        out[i:] += bp(rng.standard_normal(m), 900, 5000) * np.exp(-t * (60 if k < 2 else 16))
    return out * 0.6

def snap():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 70) * 0.8

def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * (18 if open_ else 90)) * 0.35

def pluck(m, dur=0.35, bright=1.0):
    # xylophone/marimba feel: fundamental + 4× overtone with fast decay
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 7)
         + 0.35 * bright * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 30)
         + 0.12 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 12))
    return s * np.minimum(1, t / 0.002)

def bell(m, dur=1.6):
    # music box
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.6)
         + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
         + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 11))
    return s * np.minimum(1, t / 0.001)

def bass(m, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    ph = 2 * np.pi * f * t
    s = np.sin(ph) + 0.3 * np.sign(np.sin(ph)) * 0.5
    s = lp(s, 900)
    return s * env(n, 0.004, 0.18, hold=dur * 0.7, rel=0.03)

def pizz(m, dur=0.18):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    s = lp(np.sign(np.sin(2 * np.pi * f * t)) * 0.6 + np.sin(2 * np.pi * f * t), 1400)
    return s * np.exp(-t * 16) * np.minimum(1, t / 0.003)

def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        f = mtof(m)
        for det in (-0.12, 0.12):
            ph = 2 * np.pi * f * (1 + det / 100) * t
            s += 2 / np.pi * np.arcsin(np.sin(ph))  # triangle wave
    s = lp(s / (len(ms) * 2), 2200)
    a = np.minimum(1, t / 0.08); r = np.minimum(1, (dur - t) / 0.15)
    return s * a * np.clip(r, 0, 1)

# ---------- sound effects ----------
def stamp(big=False):
    n = int(0.9 * SR); t = np.arange(n) / SR
    f = 40 + 90 * np.exp(-t * 18)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (4 if big else 7))
    click = lp(rng.standard_normal(n), 3000) * np.exp(-t * 55)
    s = np.tanh((boom * 1.4 + click * 0.9) * 1.5)
    if big:
        cr = hp(rng.standard_normal(n), 4000) * np.exp(-t * 3.2) * 0.35
        s = s + cr
    return s

def shutter():
    n = int(0.16 * SR); out = np.zeros(n)
    for off in (0, 0.06):
        i = int(off * SR); m = n - i; t = np.arange(m) / SR
        out[i:] += bp(rng.standard_normal(m), 1200, 6000) * np.exp(-t * 110)
    return out * 0.9

def boing(f0=220, f1=520, dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 14)) + 25 * np.sin(2 * np.pi * 18 * t) * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.7

def pop(f=900):
    n = int(0.12 * SR); t = np.arange(n) / SR
    fr = f * (1 + 1.2 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 35)

def clink(f=2600):
    n = int(0.3 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t * 22) * 0.4

def crash_glass():
    n = int(1.1 * SR); t = np.arange(n) / SR
    s = hp(rng.standard_normal(n), 2500) * np.exp(-t * 7) * 0.6
    s += lp(rng.standard_normal(n), 400) * np.exp(-t * 25) * 0.8
    for k in range(14):
        f = rng.uniform(2200, 7500); d = rng.uniform(0, 0.25)
        i = int(d * SR); m = n - i; tt = np.arange(m) / SR
        s[i:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * rng.uniform(10, 25)) * 0.18
    return s

def whoosh(dur=0.55, up=True):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); out = np.zeros(n)
    seg = 512
    for i in range(0, n, seg):
        p = i / n; fc = 400 + 3500 * (p if up else 1 - p)
        out[i:i + seg] = bp(x[max(0, i - 2048):i + seg], fc * 0.7, fc * 1.3)[-len(x[i:i + seg]):]
    return out * np.sin(np.pi * t / dur) ** 2 * 1.2

def plop():
    n = int(0.25 * SR); t = np.arange(n) / SR
    f = 260 * np.exp(-t * 6) + 80
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * 0.9

def key_click():
    n = int(0.04 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2500, 9000) * np.exp(-t * 160) * 0.5

def sparkle():
    out = np.zeros(int(0.9 * SR))
    for k, m in enumerate([84, 88, 91, 96, 100]):
        b = bell(m, 0.7) * 0.35; i = int(k * 0.045 * SR)
        out[i:i + len(b)] += b[: len(out) - i]
    return out

def meow(dur=0.5, f0=640, gain=0.6):
    n = int(dur * SR); t = np.arange(n) / SR; p = t / dur
    f = f0 * (0.9 + 0.45 * np.sin(np.pi * np.clip(p * 1.25, 0, 1)) - 0.25 * p) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    # formants glide /i/ → /a/ → /u/
    F1 = np.interp(p, [0, .35, 1], [350, 850, 400]); F2 = np.interp(p, [0, .35, 1], [2300, 1400, 900])
    s = np.zeros(n)
    for h in range(1, 16):
        fh = f * h
        a = np.exp(-((fh - F1) / 260) ** 2) + 0.7 * np.exp(-((fh - F2) / 380) ** 2) + 0.05
        s += a * np.sin(ph * h) / h ** 0.3
    s += 0.02 * hp(rng.standard_normal(n), 3000)
    e = np.minimum(1, t / 0.03) * np.clip((dur - t) / 0.12, 0, 1)
    return s / 6 * e * gain

def roll(t0, t1):
    # snare roll, accelerando + crescendo
    t = t0
    while t < t1:
        p = (t - t0) / (t1 - t0)
        add(snare(), t, 0.15 + 0.5 * p, pan=rng.uniform(-.2, .2))
        t += 0.125 * (1 - p) + 0.03 * p


# ---------- arrangement ----------
Am, F, C, G, Dm, E7 = [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [50, 53, 57], [52, 56, 59, 62]
MEL = {
    'A1': [69, 0, 72, 76, 74, 0, 72, 69], 'F1': [72, 0, 69, 72, 77, 76, 74, 0], 'C1': [76, 0, 79, 76, 74, 72, 0, 67],
    'G1': [74, 0, 71, 74, 79, 0, 77, 74], 'D1': [74, 77, 0, 81, 79, 77, 74, 0], 'E1': [76, 0, 80, 83, 0, 80, 76, 0],
    'A2': [81, 0, 84, 81, 79, 76, 0, 74], 'F2': [77, 0, 81, 84, 86, 84, 81, 77], 'G2': [79, 81, 83, 86, 0, 83, 86, 0],
    'C2': [84, 0, 83, 84, 79, 0, 76, 79],
    'T1': [72, 76, 79, 84, 79, 76, 72, 0], 'T2': [77, 81, 84, 0, 81, 77, 74, 0], 'T3': [79, 83, 86, 0, 83, 79, 74, 79],
}
PLAN = {
    0: (Am, None, 'hook'), 1: (Am, None, 'hook'),
    2: (Am, 'A1', 'full'), 3: (F, 'F1', 'full'), 4: (C, 'C1', 'full'), 5: (G, 'G1', 'full'), 6: (Am, 'A1', 'full'),
    7: (F, 'F1', 'full'), 8: (Dm, 'D1', 'full'), 9: (E7, 'E1', 'full'), 10: (Am, 'A2', 'full'), 11: (F, 'F2', 'full'),
    12: (G, 'G2', 'full'),
    13: (C, 'T1', 'titan'), 14: (F, 'T2', 'titan'), 15: (G, 'T3', 'titan'),
    16: (Am, None, 'mars'), 17: (Am, None, 'mars'), 18: (Am, None, 'silence'),
    19: (C, 'C2', 'full'), 20: (F, 'F2', 'drop'), 21: (C, None, 'outro'), 22: (Am, None, 'outro'), 23: (F, None, 'outro2'),
    24: (C, None, 'end'),
}
for b, (ch, mel, mode) in PLAN.items():
    t0 = b * BAR
    root = ch[0] - 12 if ch[0] >= 55 else ch[0]
    root = root - 12 if root > 50 else root
    if mode in ('full', 'drop'):
        sb = 2 if mode == 'drop' else 0            # the stamp at 40.5 lands alone: 40.0–41.0 left empty
        for k in range(sb, 4): add(kick(), t0 + k * BEAT, 0.9)
        for k in (1, 3):
            if k < sb: continue
            add(snare(), t0 + k * BEAT, 0.55); add(clap(), t0 + k * BEAT, 0.35, 0.15)
        for k in range(sb * 2, 8): add(hat(k == 7), t0 + k * BEAT / 2 + (0.012 if k % 2 else 0), 0.55, 0.35)
        for k, o in enumerate([0, None, 12, 0, None, 0, 12, None]):
            if o is None or k < sb * 2: continue
            add(bass(root + o), t0 + k * BEAT / 2, 0.55)
        add(pad([m + 12 for m in ch], BAR if sb == 0 else BAR / 2), t0 + sb * BEAT, 0.14)
        if mel:
            for k, m in enumerate(MEL[mel]):
                if m and k >= sb * 2:
                    add(pluck(m), t0 + k * BEAT / 2, 0.32, pan=0.2 if k % 2 else -0.2)
                    add(pluck(m + 12, bright=0.5), t0 + k * BEAT / 2 + 0.18, 0.06, 0.6)
    elif mode == 'hook':                            # the countdown: bass pulse, ticking hat, a heartbeat kick
        for k in range(8): add(bass(root, 0.16), t0 + k * BEAT / 2, 0.5)
        for k in range(8): add(hat(), t0 + k * BEAT / 2, 0.45, 0.3)
        add(kick(0.7), t0, 0.8); add(kick(0.5), t0 + 0.22, 0.5); add(kick(0.7), t0 + 2 * BEAT, 0.8); add(kick(0.5), t0 + 2 * BEAT + 0.22, 0.5)
    elif mode == 'titan':                           # the breath: no kick, marimba line, bells, a pad
        add(pad([m + 12 for m in ch], BAR), t0, 0.18)
        for k, m in enumerate(MEL[mel]):
            if m: add(pluck(m, 0.6), t0 + k * BEAT / 2, 0.3, pan=-0.3 + 0.08 * k)
        add(bell(MEL[mel][0] + 12, 1.8), t0, 0.12, 0.4)
        for k in range(4): add(hat(), t0 + k * BEAT + BEAT / 2, 0.25, -0.3)
        add(bass(root, 1.6), t0, 0.35)
    elif mode == 'mars':                            # tension: bass pulse alone, heartbeat
        for k in range(8): add(bass(root - 12 if root > 40 else root, 0.14), t0 + k * BEAT / 2, 0.45)
        add(kick(0.6), t0, 0.7); add(kick(0.45), t0 + 0.22, 0.45); add(kick(0.6), t0 + 2 * BEAT, 0.7); add(kick(0.45), t0 + 2 * BEAT + 0.22, 0.45)
    elif mode == 'silence':                         # the pulse stops at 36.4, then nothing until the airlock
        for k in range(0, 1): add(bass(root - 12, 0.3), t0 + k * BEAT / 2, 0.35)
    elif mode == 'outro':
        add(pad([m + 12 for m in ch], BAR), t0, 0.14)
        for k, m in enumerate([76, 72, 69, 72, 76, 0, 79, 0] if ch == C else [72, 69, 64, 69, 72, 0, 76, 0]):
            if m: add(bell(m), t0 + k * BEAT / 2, 0.2, pan=-0.3 + 0.08 * k)
        add(bass(root, 1.2), t0, 0.3)
    elif mode == 'outro2':
        add(pad([m + 12 for m in ch], BAR), t0, 0.12)
        add(bass(root, 1.6), t0, 0.28)
    elif mode == 'end':
        for k, m in enumerate([72, 76, 79, 84, 88]): add(bell(m, 2.2), t0 + 0.1 + k * 0.035, 0.2, pan=-0.4 + 0.2 * k)
        add(pad([m + 12 for m in ch], BAR), t0, 0.1)

# ---------- beds ----------
def bed(t0, t1, lo, hi, gain, swell=False):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), lo, hi)
    e = np.minimum(1, t / 0.3) * np.clip((t1 - t0 - t) / 0.3, 0, 1)
    if swell: e = e * (0.4 + 0.6 * t / (t1 - t0))
    add(x * e * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t)), t0, gain)
bed(9.0, 15.0, 3000, 9000, 0.05)                # Mercury: frying hiss on the hot side
bed(20.5, 25.5, 300, 1800, 0.45, swell=True)    # Neptune: wind
bed(33.0, 36.4, 200, 1200, 0.35, swell=True)    # Mars: dust storm, cut dead at 36.4

# ---------- sound-effect timetable (times from index.html) ----------
def pops(t0, n, st, g=0.12, f0=600):
    for i in range(n): add(pop(f0 + 40 * (i % 6)), t0 + i * st, g, 0.2 if i % 2 else -0.2)
for k in range(10): add(pop(1600), k * 0.5, 0.16, 0.3)            # bracelet beeps
for k in (1, 2, 3, 4): add(key_click(), k, 0.6)                    # countdown ticks
pops(0.3, 16, 0.05); add(pop(700), 1.2, 0.2)
for w in (4.7, 8.7, 20.2, 25.2, 32.7, 42.2): add(whoosh(0.4), w, 0.35)
add(boing(220, 520), 5.05, 0.45); pops(5.3, 10, 0.06); add(shutter(), 5.6, 0.6)
add(whoosh(0.3), 5.75, 0.25); add(pop(700), 6.2, 0.2); add(plop(), 7.95, 0.3)
pops(9.3, 8, 0.06); pops(9.6, 5, 0.05, 0.08, 900); pops(9.8, 5, 0.05, 0.08, 900); add(pop(700), 9.9, 0.2)
add(whoosh(0.3, up=False), 12.7, 0.35); add(pop(1100), 12.8, 0.25); add(stamp(), 13.0, 0.75)
add(stamp(), 15.0, 0.35)                                            # the hard cut lands like a slam
pops(15.3, 6, 0.07); add(pop(700), 16.0, 0.2)
add(whoosh(0.45, up=False), 16.55, 0.55); add(stamp(big=True), 17.0, 0.8); add(plop(), 17.02, 0.7)
add(boing(320, 160, 0.4), 17.35, 0.3)
add(stamp(), 19.0, 0.75); add(pop(1100), 19.25, 0.25)
pops(20.8, 6, 0.07); add(pop(700), 21.4, 0.2)
for i, w in enumerate((21.3, 22.1, 22.9)): add(whoosh(0.35), w, 0.4, -0.6 + 0.6 * i)
add(stamp(), 24.0, 0.75); add(pop(1100), 24.25, 0.25)
pops(25.8, 5, 0.08); add(sparkle(), 26.0, 0.35); add(pop(700), 26.5, 0.2)
t = 26.0
while t < 32.6: add(whoosh(0.25), t, 0.12, 0.2); t += 2 * np.pi / 7
add(stamp(), 31.0, 0.75); add(sparkle(), 31.25, 0.3)
t = 33.0
while t < 36.4: add(pop(1600), t, 0.14, 0.3); t += 0.5             # bracelet blinking on Mars
pops(33.3, 4, 0.08); add(pop(700), 33.9, 0.2)
add(stamp(big=True), 38.0, 0.7); add(shutter(), 38.0, 0.4)          # the airlock: first sound after the silence
pops(38.6, 11, 0.06); add(pop(700), 39.2, 0.2)
add(stamp(big=True), 40.5, 0.95); add(sparkle(), 40.6, 0.45); add(boing(300, 700, 0.5), 40.55, 0.3)
pops(42.8, 11, 0.05, 0.09); pops(43.2, 17, 0.04, 0.09); add(pop(700), 43.5, 0.2)
pops(46.8, 9, 0.05, 0.1); add(key_click(), 47.0, 0.8); add(plop(), 47.02, 0.5); pops(47.1, 16, 0.04, 0.1)

# ---------- silence window and bus ----------
i0, i1 = int(36.45 * SR), int(38.0 * SR)                           # a real silence before the turn
L[i0:i1] *= np.linspace(1, 0, i1 - i0) ** 6; R[i0:i1] *= np.linspace(1, 0, i1 - i0) ** 6
mix = np.stack([L, R])
t = np.arange(N) / SR
mix *= np.clip((DUR - t) / 1.2, 0, 1)
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 1.6
mix = np.tanh(mix) * 0.9
out = (mix.T * 32767).astype(np.int16)
w = wave.open(OUT, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(out.tobytes()); w.close()
print('ok', out.shape, '->', OUT)
