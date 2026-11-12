"""Background score for the whole film, written to the narration: cues.json → music.wav (48 kHz stereo, not ducked; mix.py ducks it).

usage: python music.py <project_dir> [--mood tension|pixel|adventure|calm] [--key D] [--bpm 0] [--seed 1]
Mood defaults to the script's front matter `music:` (else `pixel` for theme pixel, else `tension`).
  tension    — horror / mystery: low strings pad in a minor key, piano ostinato, tremolo violins as chapters go on,
               timpani + gong hits on chapter cards with a string riser into each card, bells at the end
  pixel      — 16-bit chiptune: pulse-wave arpeggios, triangle bass, noise hats; sparse at first, fuller each chapter;
               a soft low strings pad underneath so it doesn't sound thin
  adventure  — survival / action: spiccato strings ostinato, horns, snare and toms; builds per chapter
  calm       — piano + soft strings, for explainers and quiet stories
The arrangement follows the film: a new section at every chapter card, intensity rising with chapter n/N, a beat of
silence right before each card, a hit on the card, and an ending that resolves. Uses VSCO 2 CE samples
(sh $LIB/tools/fetch.sh instruments vsco2ce); the chiptune layer is synthesised."""
import os, sys, json, argparse, numpy as np, soundfile as sf
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, add, limit, lp, hp, bp
from core.audio import sampler as S

ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--mood'); ap.add_argument('--key', default='D')
ap.add_argument('--bpm', type=float, default=0); ap.add_argument('--seed', type=int, default=1); a = ap.parse_args()
P = a.project; C = json.load(open(os.path.join(P, 'cues.json'), encoding='utf-8'))
meta = json.load(open(os.path.join(P, 'lines.json'), encoding='utf-8'))['meta']
mood = a.mood or meta.get('music') or ('pixel' if C.get('theme') == 'pixel' else 'tension')
BPM = a.bpm or {'tension': 66, 'pixel': 96, 'adventure': 92, 'calm': 72}[mood]
rng = np.random.default_rng(a.seed); S.seed(a.seed)
DUR = C['total'] + 3.0; N = int(DUR * SR); beat = 60 / BPM; bar = 4 * beat
root = S.midi(a.key + '2')                                    # tonic, low register (D2 = 38)
# minor-key progressions (scale degrees as semitones from the tonic, chord quality), one chord per 2 bars
PROG = {'tension': [(0, 'm'), (8, 'M'), (5, 'm'), (7, 'M')], 'pixel': [(0, 'm'), (8, 'M'), (3, 'M'), (10, 'M')],
        'adventure': [(0, 'm'), (8, 'M'), (10, 'M'), (7, 'M')], 'calm': [(0, 'm'), (5, 'm'), (8, 'M'), (7, 'M')]}[mood]
PROG2 = [(0, 'm'), (1, 'M'), (0, 'm'), (8, 'M')]              # darker Phrygian turn for the last third
def triad(deg, q): r = root + deg; return [r, r + (3 if q == 'm' else 4), r + 7]

# sections: intro → one per chapter card → end
cards = sorted(C['cards'], key=lambda c: c['t']); bounds = [0.] + [max(.5, c['t']) for c in cards] + [C['total'] + .5]
secs = []
for i in range(len(bounds) - 1):
    t0, t1 = bounds[i], bounds[i + 1]
    if t1 - t0 < 1: continue
    c = cards[i - 1] if i > 0 else None
    lvl = (c['n'] / c['N']) if (c and c.get('n')) else (i / max(1, len(bounds) - 2))
    secs.append({'t0': t0, 't1': t1, 'lvl': float(np.clip(lvl, 0, 1)), 'card': c is not None, 'last': i == len(bounds) - 2})
mus = np.zeros((N, 2), np.float32)
def put(x, t, g=1., pan=0.):
    if 0 <= t < DUR: add(mus, np.asarray(x, np.float32), t, g, pan)
def nt(inst, m, d, v, **kw):
    try: return S.note(inst, int(m), d, v, **kw)
    except Exception as e: print('skip', inst, m, e); return np.zeros(1, np.float32)
def ht(inst, var=None, v=.8):
    try: return S.hit(inst, var, v)
    except Exception as e: print('skip', inst, var, e); return np.zeros(1, np.float32)

# ── chiptune voices (synthesised, band-limited enough not to hurt)
def pulse(f, d, duty=.25, v=1.):
    t = np.arange(int(d * SR)) / SR; ph = (f * t) % 1; x = np.where(ph < duty, 1., -1.) - (2 * duty - 1)
    x = lp(x, 4200) * np.minimum(1, t / .004) * np.exp(-t * 3.5) * np.minimum(1, (d - t) / .01); return x * v * .09
def tri(f, d, v=1.):
    t = np.arange(int(d * SR)) / SR; x = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
    return x * np.minimum(1, t / .005) * np.minimum(1, (d - t) / .02) * v * .16
def nhat(v=1., d=.05):
    t = np.arange(int(d * SR)) / SR; return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 90) * v * .05
def nkick(v=1.):
    t = np.arange(int(.18 * SR)) / SR; f = 50 + 110 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16) * v * .35
def nsnare(v=1.):
    t = np.arange(int(.16 * SR)) / SR; return bp(rng.standard_normal(len(t)), 900, 6000) * np.exp(-t * 22) * v * .12
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

for si, s in enumerate(secs):
    t0, t1, L = s['t0'], s['t1'], s['lvl']; dark = L > .66 and mood in ('tension', 'pixel')
    prog = PROG2 if dark else PROG; clen = 2 * bar; nch = max(1, int(np.ceil((t1 - t0) / clen)))
    if s['card']:                                                   # the card hit
        put(ht('timpani', 0, .55 + .35 * L), t0, 1.1, 0); put(ht('gong', None, .35 + .3 * L), t0 + .02, .7, .1)
        if mood == 'adventure': put(ht('bass_drum', None, .8), t0, .9, 0)
        if mood == 'pixel': put(nkick(1.2), t0); [put(pulse(hz(root + 36 + d), .12, .5, .9), t0 + k * .07, 1, .2) for k, d in enumerate((0, 3, 7, 12))]
    for k in range(nch):
        c0 = t0 + k * clen; d = min(clen, t1 - c0) + 1.0
        if d < .6: break
        deg, q = prog[(k + si) % len(prog)]; tr = triad(deg, q)
        # pad: low strings, always (softer in calm)
        pv = .28 + .25 * L
        put(nt('cellos', tr[0] + 12, d, pv, attack=1.2, release=1.5), c0, .9, -.25)
        put(nt('violas', tr[1] + 12, d, pv * .9, attack=1.4, release=1.5), c0, .7, .25)
        if mood != 'calm': put(nt('contrabass', tr[0], d, .35 + .2 * L, attack=.8, release=1.2), c0, .9, 0)
        if mood == 'tension':
            if L > .15:                                           # piano ostinato: root–fifth eighths, sparse
                for b in range(int(min(clen, t1 - c0) / (beat / 2))):
                    if rng.random() < .55 + .3 * L: put(nt('piano', (tr[0] + 36) if b % 2 == 0 else (tr[2] + 36), beat, .22 + .15 * L), c0 + b * beat / 2, .55, .15)
            if L > .45: put(nt('violins_trem', tr[2] + 36, d, .2 + .25 * L, attack=2.0, release=1.5), c0, .45 + .3 * L, .35)
            if L > .7 and k % 2 == 0: put(ht('timpani', 0, .35), c0, .6, 0); put(ht('timpani', 0, .3), c0 + bar, .5, 0)
            if k == 0: [put(nt('glockenspiel', m, 1.5, .25), t0 + .6 + j * beat, .35, -.3) for j, m in enumerate((tr[2] + 48, tr[1] + 48, tr[0] + 48, tr[1] + 48))]
        elif mood == 'pixel':
            arp = [tr[0], tr[1], tr[2], tr[1] + 12, tr[2], tr[1]]; step = beat / 4 if L > .35 else beat / 2
            for b in range(int(min(clen, t1 - c0) / step)):
                if L < .2 and b % 2: continue
                put(pulse(hz(arp[b % len(arp)] + 36), step * 1.6, .25 if b % 4 else .125, .8 + .3 * L), c0 + b * step, 1, -.25 + .5 * (b % 2))
            for b in range(int(min(clen, t1 - c0) / beat)):           # triangle bass, octave bounce
                put(tri(hz(tr[0] + 24 + (12 if b % 2 else 0)), beat * .9, .9), c0 + b * beat, 1, 0)
            if L > .3:
                for b in range(int(min(clen, t1 - c0) / (beat / 2))): put(nhat(.6 + .4 * (b % 2)), c0 + b * beat / 2, 1, .3)
            if L > .55:
                for b in range(int(min(clen, t1 - c0) / beat)): put(nkick(.8) if b % 2 == 0 else nsnare(.9), c0 + b * beat, 1, 0)
            if k % 2 == 1 and L > .2:                               # a little lead phrase every other chord
                for j, m in enumerate(rng.choice([tr[2], tr[1], tr[0] + 12, tr[2] + 2], 4)): put(pulse(hz(m + 48), beat * .9, .5, .7), c0 + bar + j * beat / 2, 1, .2)
        elif mood == 'adventure':
            for b in range(int(min(clen, t1 - c0) / (beat / 2))):
                put(nt('cellos_spic', tr[0] + 12 + (7 if b % 4 == 3 else 0), beat / 2, .45 + .3 * L), c0 + b * beat / 2, .7, -.2)
                if L > .3: put(nt('violins_spic', tr[2] + 36 - (12 if b % 2 else 0), beat / 2, .35 + .3 * L), c0 + b * beat / 2, .5, .3)
            if L > .4: put(nt('horn', tr[1] + 24, bar * 1.5, .45 + .3 * L, attack=.4), c0 + bar * .5, .6, -.1)
            if L > .5:
                for b in range(int(min(clen, t1 - c0) / beat)): put(ht('snare', None, .25 + .2 * (b % 2)), c0 + b * beat, .45, .1)
            if k % 2 == 0: put(ht('toms', 0, .5 + .3 * L), c0, .6, -.2)
        else:                                                       # calm
            for j, m in enumerate([tr[0] + 24, tr[2] + 24, tr[1] + 36, tr[2] + 36]): put(nt('piano', m, 2 * beat, .3), c0 + j * beat, .6, .1)
            if k % 2: put(nt('violins', tr[2] + 36, bar, .25, attack=1.5, release=2), c0 + bar * .5, .4, .3)
    # riser into the next card: tremolo strings + reverse cymbal swell, then 0.35 s of air before the hit
    nxt = secs[si + 1]['t0'] if si + 1 < len(secs) and secs[si + 1]['card'] else None
    if nxt and nxt - t0 > 4:
        rd = 2.6; tr = triad(*prog[0])
        x = nt('violins_trem', tr[2] + 24, rd, .5, attack=rd * .95, release=.05); put(x, nxt - rd - .35, .6, .2)
        sw = ht('sus_cymbal', None, .5)[:int(rd * SR)][::-1].copy(); put(sw, nxt - .35 - len(sw) / SR, .5, -.2)
    if s['last']:                                                   # ending: resolve on the tonic, bells
        tr = triad(0, 'm'); te = t1 - .2
        put(nt('cellos', tr[0] + 12, 6, .45, attack=.3, release=3), te, .9, -.2); put(nt('contrabass', tr[0], 6, .4, release=3), te, .9, 0)
        put(ht('tubular_bells', None, .5), te, .5, .2); put(ht('gong', None, .45), te, .6, 0)

# gaps of air before each card (music dips to −14 dB for 0.35 s, recovers on the hit)
g = np.ones(N, np.float32)
for c in cards:
    i0, i1 = int((c['t'] - .5) * SR), int(c['t'] * SR)
    if 0 < i0 < i1 < N: g[i0:i1] = np.minimum(g[i0:i1], np.linspace(1, .2, i1 - i0) ** 2)
mus *= g[:, None]
mus = S.room(mus, size=.5, mix=.22)
fade = int(2.5 * SR); mus[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2; mus[:int(.05 * SR)] *= np.linspace(0, 1, int(.05 * SR))[:, None]
mus = mus / (np.abs(mus).max() + 1e-9) * .8
mus = np.stack([limit(mus[:, 0], .9), limit(mus[:, 1], .9)], 1)
sf.write(os.path.join(P, 'music.wav'), mus.astype(np.float32), SR)
used = {'tension': ['cellos', 'violas', 'contrabass', 'piano', 'violins_trem', 'timpani', 'glockenspiel', 'gong', 'sus_cymbal', 'tubular_bells'],
        'pixel': ['cellos', 'violas', 'contrabass', 'timpani', 'gong', 'violins_trem', 'sus_cymbal', 'tubular_bells'],
        'adventure': ['cellos', 'violas', 'contrabass', 'cellos_spic', 'violins_spic', 'horn', 'snare', 'toms', 'timpani', 'gong', 'bass_drum', 'violins_trem', 'sus_cymbal', 'tubular_bells'],
        'calm': ['cellos', 'violas', 'piano', 'violins', 'timpani', 'gong', 'violins_trem', 'sus_cymbal', 'tubular_bells']}[mood]
try: open(os.path.join(P, 'MUSIC-CREDITS.txt'), 'w').write('\n'.join(S.credits(used)) if isinstance(S.credits(used), list) else str(S.credits(used)))
except Exception: pass
print(f'music: mood {mood}, {BPM:.0f} bpm, key {a.key} minor, {len(secs)} sections, {DUR:.1f}s → music.wav')
