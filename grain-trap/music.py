"""Score for «Зерновая ловушка»: clockwork minimalism, all synthesised (no samples).
Marimba (modal), woodblock, pizzicato, glockenspiel, soft bass. 96 BPM, D minor: Dm – B♭ – F – C.
Reads events.json (cue times shared with the picture) → music/score.wav (48 kHz stereo).
usage: $LIB/.venv/bin/python music.py   (with LIB set, or run from build.sh)"""
import os, sys, json, numpy as np, soundfile as sf
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, add
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
C = next(e for e in E if e['type'] == 'cues'); VO = C['VO']; BEAT = C['BEAT']; S16 = BEAT / 4
rng = np.random.default_rng(5)
N = int((DUR + 2) * SR); out = np.zeros((N, 2), np.float32)
tt = lambda d: np.arange(int(d * SR)) / SR
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

# ───────── instruments
def marimba(m, v=1., d=1.0):
    f = mtof(m); t = tt(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / (.45 * 440 / max(f, 200)) ** .7 / 1.0) \
        + .35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / .06) + .12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / .02)
    x[:120] += rng.standard_normal(120) * np.linspace(.4, 0, 120)          # mallet
    return lp(x, 5000) * v * .5
def woodblock(v=1., f=1050):
    d = .12; t = tt(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .025) + .5 * np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t / .012)
    x[:90] += bp(rng.standard_normal(90), 1500, 7000) * .6
    return x * v * .35
def pizz(m, v=1.):
    f = mtof(m); d = .7; t = tt(d); x = np.zeros(len(t))
    for k in range(1, 9): x += np.sin(2 * np.pi * f * k * t + rng.uniform(0, 3)) * np.exp(-t * (6 + k * 3.5)) / k ** 1.1
    x[:60] += rng.standard_normal(60) * .15
    return lp(x, 3500) * v * .45
def glock(m, v=1.):
    f = mtof(m); d = 2.2; t = tt(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .9) + .3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / .3) + .12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / .1)
    return x * v * .22
def bass(m, v=1., d=.5):
    f = mtof(m); t = tt(d)
    x = (np.sin(2 * np.pi * f * t) + .45 * np.sin(4 * np.pi * f * t) + .2 * np.sin(6 * np.pi * f * t)) * np.minimum(1, t / .01) * np.exp(-t / (d * .6))
    return lp(x, 900) * v * .5
def put(x, t, g=1., pan=0.):
    if 0 <= t < DUR + 1.5: add(out, np.asarray(x, np.float32), t, g, pan)

# ───────── harmony: one chord per bar
CH = [(62, [50, 57, 62, 65, 69]), (58, [46, 53, 58, 62, 65]), (65, [53, 60, 65, 69, 72]), (60, [48, 55, 60, 64, 67])]   # (root, arpeggio notes)
BAR = BEAT * 4
def chord(t): return CH[int(t / BAR) % 4]
PAT = [0, 2, 1, 3, 2, 4, 3, 1]                                   # 8th-note arpeggio shape

l = lambda id, f=0.: VO[id]
sil = C['sil']
def silent(t): return any(a - .05 <= t < b for a, b in sil)

def arps(t0, t1, v=.8, step=BEAT / 2, oct=0, pan=-.25, shift=0, tempo=1.):
    t = t0; k = 0
    while t < t1:
        if not silent(t):
            _, notes = chord(t); m = notes[PAT[(k + shift) % 8]] + 12 * oct
            put(marimba(m, v * (1 if k % 2 == 0 else .75)), t, 1, pan)
        k += 1; t = t0 + k * step / tempo
def blocks(t0, t1, v=.6, every=BEAT, f=1050, pan=.3):
    t = np.ceil(t0 / every) * every
    while t < t1:
        if not silent(t): put(woodblock(v * (1 if round(t / BEAT) % 4 == 0 else .7), f), t, 1, pan)
        t += every
def pizzline(t0, t1, v=.6):
    t = np.ceil(t0 / BEAT) * BEAT
    while t < t1:
        if not silent(t): r, notes = chord(t); put(pizz(notes[1] - 12 if round(t / BEAT) % 2 == 0 else notes[3] - 12, v), t, 1, .35)
        t += BEAT
def bassline(t0, t1, v=.8):
    t = np.ceil(t0 / BEAT) * BEAT
    while t < t1:
        if not silent(t) and round(t / BEAT) % 2 == 0: r, _ = chord(t); put(bass(r - 24, v, BEAT * 1.6), t, 1, 0)
        t += BEAT
def bells(t0, t1, v=.6, every=BAR):
    t = np.ceil(t0 / every) * every
    while t < t1:
        if not silent(t): _, notes = chord(t); put(glock(notes[4] + 12, v), t, 1, -.1)
        t += every

g = lambda t: np.ceil(t / BEAT) * BEAT
# A: hook — tick and two-bar marimba
blocks(.0, l('l04'), .55); arps(g(.4), l('l04'), .55)
# B: dig — pulse without bass, quieter, then silence (sil[0]) before «Но всё ровно наоборот!»
arps(g(l('l04')), C['swap0'], .45, BEAT / 2, -1, -.3)
bells(C['drop1'], C['drop1'] + .1, .7, 1); bells(C['drop2'], C['drop2'] + .1, .7, 1)
# after the turn: bells come in under the swap
put(glock(74, .8), C['swap1'], 1, 0); bells(C['swap1'], l('l11') - .3, .45)
arps(C['swap1'], l('l11') - .3, .5)
# C: stopwatch + week — pizzicato joins; duet = two marimbas at two tempi until the red pen stops
arps(g(l('l11')), C['duet0'], .55); pizzline(g(l('l11')), l('l14') - .2, .55)
arps(C['duet0'], C['duetEnd'], .55, BEAT / 2, 0, -.5)
arps(C['duet0'], C['dRed'], .5, BEAT / 2, 1, .5, 3, 1.07)
put(glock(81, .7), C['dRed'], 1, .5)
arps(C['duetEnd'], l('l14') - .2, .5)
# D: campfire — softer, bells, no woodblock
arps(g(l('l14')), sil[1][0], .38, BEAT, 0, -.2); bells(g(l('l14')), sil[1][0], .5, BAR / 2)
# silence (sil[1]) until the slam; then everything: bass enters, one instrument per step of the loop
arps(C['slam'], l('l22') - .2, .6, BEAT / 2); bassline(C['slam'], l('l24') - .2, .8)
put(bass(38, 1.2, 2.5), C['slam'], 1.3, 0)
blocks(VO['l19'] + 1.2, l('l22') - .2, .55); pizzline(VO['l19'] + 2.4, l('l22') - .2, .55)
arps(VO['l20'], l('l22') - .2, .4, BEAT / 4, 1, .4)          # 16ths: the crowd grows
# F: 90 000 hours — alarm-like 16th woodblock + marimba
blocks(l('l22'), l('l24') - .2, .4, BEAT / 4, 1400, .25); arps(l('l22'), l('l24') - .2, .55)
# G: the choice — thin, bells and sparse marimba; final cadence after the box closes
arps(g(l('l24')), C['boxT1'] + 1.5, .4, BEAT, 0); bells(g(l('l24')), C['boxT1'] + 1.5, .5, BAR / 2)
put(bass(38, .9, 3), C['boxT1'], 1, 0); put(glock(74, .9), C['boxT1'], 1, 0)
put(glock(81, .9), C['circT0'] + 1.0, 1, 0); put(glock(86, .6), C['circT0'] + 1.0 + BEAT, 1, .2)
for m in [50, 57, 62, 65, 69]: put(marimba(m, .5, 2.0), C['circT0'] + 1.0, 1, 0)

out[:] = hp(out.T, 40).T.astype(np.float32)
out /= np.abs(out).max() + 1e-9; out *= .8
f = int(min(len(out), (DUR + .5) * SR)); fade = int(1.2 * SR); out[f - fade:f] *= np.linspace(1, 0, fade)[:, None]; out[f:] = 0
os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
sf.write(os.path.join(HERE, 'music', 'score.wav'), out[:int(DUR * SR)], SR)
print('score', round(DUR, 2), 's')
