"""Background score for the whole film, written to the narration: cues.json → music.wav (48 kHz stereo, not ducked; mix.py ducks it).

usage: python music.py <project_dir> [--mood tension|pixel|adventure|calm|spy] [--key D] [--bpm 0] [--seed 1]
Mood defaults to the script's front matter `music:` (else `pixel` for theme pixel, else `tension`).
  tension    — horror / mystery: low strings pad in a minor key, piano ostinato, tremolo violins as chapters go on,
               timpani + gong hits on chapter cards with a string riser into each card, bells at the end
  pixel      — 16-bit chiptune: pulse-wave arpeggios, triangle bass, noise hats; sparse at first, fuller each chapter;
               a soft low strings pad underneath so it doesn't sound thin
  adventure  — survival / action: spiccato strings ostinato, horns, snare and toms; builds per chapter
  calm       — piano + soft strings, for explainers and quiet stories
  spy        — 60s spy-titles big band (Shorts / fast explainers): swung ride + hats, walking jazz bass, twangy guitar
               riff, vibraphone comping, a muted-trumpet / sax line; brass stabs on every page EV 'stab' (cuts), a bigger
               stab + crash on 'stamp' events; hook = tense pulse until the first 'click'/'portal' EV, coda = warm
               vibes from the first line tagged scene armor|finale|outro (else the last 15 %). Needs events.json.
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
BPM = a.bpm or {'tension': 66, 'pixel': 96, 'adventure': 92, 'calm': 72, 'spy': 138}[mood]
rng = np.random.default_rng(a.seed); S.seed(a.seed)
DUR = C['total'] + 3.0; N = int(DUR * SR); beat = 60 / BPM; bar = 4 * beat
root = S.midi(a.key + '2')                                    # tonic, low register (D2 = 38)
# minor-key progressions (scale degrees as semitones from the tonic, chord quality), one chord per 2 bars
PROG = {'tension': [(0, 'm'), (8, 'M'), (5, 'm'), (7, 'M')], 'pixel': [(0, 'm'), (8, 'M'), (3, 'M'), (10, 'M')],
        'adventure': [(0, 'm'), (8, 'M'), (10, 'M'), (7, 'M')], 'calm': [(0, 'm'), (5, 'm'), (8, 'M'), (7, 'M')], 'spy': [(0, 'm')]}[mood]
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

SPY_USED = []
if mood == 'spy':                                                   # ── 60s spy big band (whole film, not per card)
    evp = os.path.join(P, 'events.json'); EVS = json.load(open(evp)) if os.path.exists(evp) else []
    EVS = EVS if isinstance(EVS, list) else EVS.get('ev', [])
    clicks = [e['t'] for e in EVS if e.get('type') in ('click', 'portal')]; t_in = clicks[0] if clicks else 3.0
    LS = sorted(C['lines'].values(), key=lambda l: l['t0'])
    co = [l['t0'] for l in LS if l.get('tags', {}).get('scene') in ('armor', 'finale', 'outro')]; t_co = co[0] - .2 if co else C['total'] * .85
    t_end = LS[-1]['t0'] - .15 if LS else C['total']
    SW = beat * 2 / 3                                               # swung 8th
    # 8-bar loop i–i–iv–iv–VI–V7–i–V7 (semitones from tonic, quality)
    CH = [(0, 'm7'), (0, 'm7'), (5, 'm7'), (5, 'm7'), (8, 'M7'), (7, '7'), (0, 'm7'), (7, '7')]
    TONES = {'m7': [0, 3, 7, 10], 'M7': [0, 4, 7, 11], '7': [0, 4, 7, 10]}
    def chord_at(t): b = int(max(0, t - t_in) / bar); return CH[b % 8]
    def kit(v, nm, vel): put(ht('drum_kit', v, vel), nm, 1, 0)
    # hook: low pizz pulse on every beat + closed hats, rising muted trumpet cluster
    x = 0.
    while x < t_in - .05:
        put(nt('contrabass_pizz', root, beat, .7), x, .9, 0); put(ht('hihat', 'closed', .35), x + beat / 2, .35, .3); x += beat
    put(nt('trumpet_mute', root + 27, t_in, .35, attack=t_in * .8, release=.1), 0, .35, .2)
    put(nt('trumpet_mute', root + 28, t_in, .3, attack=t_in * .8, release=.1), .02, .3, -.2)
    # groove
    nb = int((t_co - t_in) / beat)
    for b in range(nb):
        tb = t_in + b * beat; deg, q = chord_at(tb + .01); r = root + 12 + deg; bi = b % 4
        nxt = chord_at(tb + beat * (4 - bi) + .01); nr = root + 12 + nxt[0]
        walk = [r, r + TONES[q][1], r + 7, nr + (1 if (b // 4) % 2 else -1)][bi]          # root, third, fifth, approach
        put(nt('jazz_bass', walk, beat * 1.05, .8 if bi == 0 else .65), tb, 1.1, -.05)
        kit('ride_left', tb, .5 if bi % 2 else .42)
        if bi in (1, 3): kit('ride_left', tb - beat + SW, .32); kit('hi_hat_closed', tb, .45)
        if bi in (0, 2): kit('kick_drum_left', tb, .22)
        if rng.random() < .22: kit('snare_1', tb + SW, .18 + .12 * rng.random())
        if bi in (1, 3) and rng.random() < .5:                     # vibraphone comp, rootless voicing
            put(nt('vibraphone', r + 12 + TONES[q][1], beat, .35), tb + (SW if bi == 1 else 0), .5, .25)
            put(nt('vibraphone', r + 12 + TONES[q][3], beat, .3), tb + (SW if bi == 1 else 0), .5, .3)
        bar_i = b // 4
        if bi == 0 and bar_i % 4 == 0:                             # guitar twang riff, every 4 bars
            for off, st, d in [(0, 0, .3), (SW, 3, .2), (beat, 5, .3), (beat + SW, 6, .2), (2 * beat, 5, .4), (3 * beat, 3, .2), (3 * beat + SW, 0, .5)]:
                put(nt('electric_guitar', root + 12 + st, d + .2, .75), tb + off, .8, -.35)
        if bi == 0 and bar_i % 4 == 2 and bar_i >= 4:              # muted trumpet answer
            for off, m, d in [(0, 21, beat * 1.5), (beat * 1.67, 24, .25), (beat * 2, 26, beat), (beat * 3, 29, beat * .6)]:
                put(nt('trumpet_mute', root + m + 12, d, .45, attack=.02), tb + off, .45, .35)
    # brass stabs on cuts, bigger on stamps
    for e in EVS:
        ty = e.get('type')
        if ty not in ('stab', 'stamp') or e['t'] < t_in - .05: continue
        deg, q = chord_at(e['t'] + .01); r = root + 24 + deg; tn = TONES[q]; big = ty == 'stamp'
        for k, m in enumerate([r + tn[1], r + tn[2], r + tn[3], r + 14]): put(nt('trumpet_stac', m + 12, .3, .7 if big else .55), e['t'], .45 if big else .32, -.2 + .13 * k)
        for m in (r - 12, r - 12 + tn[2]): put(nt('trombone_stac', m, .35, .8 if big else .6), e['t'], .55 if big else .4, .1)
        if big: kit('crash_left', e['t'], .6); kit('kick_drum_left', e['t'], .7); put(nt('electric_guitar', root + 12 + deg, 1.2, .9), e['t'], .6, -.35)
    # coda: warm vibraphone chords, bass half notes, soft ride
    CO = [(8, 'M7'), (5, 'm7'), (0, 'm7')]; seglen = max(1.2, (t_end - t_co) / len(CO))
    for k, (deg, q) in enumerate(CO):
        tc = t_co + k * seglen; r = root + 12 + deg
        for m in TONES[q][1:]: put(nt('vibraphone', r + 12 + m, seglen + 1, .45), tc, .6, .15)
        put(nt('contrabass', r - 12 + 12, seglen + .5, .45, attack=.3, release=1), tc, .8, 0)
        put(nt('tenor_sax', r + 12 + TONES[q][1], seglen, .35, attack=.4, release=.6), tc + .1, .35, -.3)
        x = tc
        while x < tc + seglen - .05: kit('ride_left', x, .25); x += beat
    # tag: band hit on the last line, guitar riff, final Dm6/9 with crash
    kit('crash_left', t_end, .7); kit('kick_drum_left', t_end, .8)
    for off, st in [(0, 0), (SW, 3), (beat, 5), (beat + SW, 6), (2 * beat, 7)]: put(nt('electric_guitar', root + 12 + st, .5, .85), t_end + off, .85, -.35)
    fin = t_end + 3 * beat
    for m in (root + 24, root + 27, root + 31, root + 33, root + 38): put(nt('trumpet' if m > root + 30 else 'trombone', m + 12, 3.0, .55, release=1.5), fin, .35, 0)
    put(nt('vibraphone', root + 38, 3, .5), fin, .5, .2); put(nt('jazz_bass', root + 12, 2, .9), fin, 1.1, 0); kit('crash_right', fin, .6); kit('ride_bell_left', fin, .5)
    SPY_USED = ['contrabass_pizz', 'hihat', 'trumpet_mute', 'jazz_bass', 'drum_kit', 'vibraphone', 'electric_guitar', 'trumpet_stac', 'trombone_stac', 'contrabass', 'tenor_sax', 'trumpet', 'trombone']
for si, s in enumerate(secs if mood != 'spy' else []):
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
mus = S.room(mus, size=.35 if mood == 'spy' else .5, mix=.14 if mood == 'spy' else .22)
fade = int(2.5 * SR); mus[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2; mus[:int(.05 * SR)] *= np.linspace(0, 1, int(.05 * SR))[:, None]
mus = mus / (np.abs(mus).max() + 1e-9) * .8
mus = np.stack([limit(mus[:, 0], .9), limit(mus[:, 1], .9)], 1)
sf.write(os.path.join(P, 'music.wav'), mus.astype(np.float32), SR)
used = {'tension': ['cellos', 'violas', 'contrabass', 'piano', 'violins_trem', 'timpani', 'glockenspiel', 'gong', 'sus_cymbal', 'tubular_bells'],
        'pixel': ['cellos', 'violas', 'contrabass', 'timpani', 'gong', 'violins_trem', 'sus_cymbal', 'tubular_bells'],
        'adventure': ['cellos', 'violas', 'contrabass', 'cellos_spic', 'violins_spic', 'horn', 'snare', 'toms', 'timpani', 'gong', 'bass_drum', 'violins_trem', 'sus_cymbal', 'tubular_bells'],
        'calm': ['cellos', 'violas', 'piano', 'violins', 'timpani', 'gong', 'violins_trem', 'sus_cymbal', 'tubular_bells'], 'spy': SPY_USED}[mood]
try: open(os.path.join(P, 'MUSIC-CREDITS.txt'), 'w').write('\n'.join(S.credits(used)) if isinstance(S.credits(used), list) else str(S.credits(used)))
except Exception: pass
print(f'music: mood {mood}, {BPM:.0f} bpm, key {a.key} minor, {len(secs)} sections, {DUR:.1f}s → music.wav')
