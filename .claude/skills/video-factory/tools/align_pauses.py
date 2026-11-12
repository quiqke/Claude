"""Voice parts → one narration track + per-block timing.

usage: python align.py <project_dir> [--gap 0.5] [--thr auto]
Reads voice/parts.json, lines.json and voice/part1.wav … (any rate, mono/stereo; AI Studio WAVs as downloaded).
Within each part, every sentence boundary is put in a pause so that each sentence's span best matches its text length
(dynamic programming over all pauses ≥ 0.12 s; the long pauses between paragraphs are preferred for block boundaries). Writes voice/narration.wav (48 kHz mono, parts joined with --gap seconds of silence),
voice/timing.json {lines: {id: {t0, t1}}, total} and voice/align-report.txt (blocks whose duration doesn't fit their text
are flagged «CHECK» — listen there first).
No speech recognition is used: word times inside a block are spread by character length (cues.py)."""
import os, re, sys, json, argparse, numpy as np, soundfile as sf
try: import soxr
except ImportError: soxr = None
ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--gap', type=float, default=.5); a = ap.parse_args()
P = a.project; V = os.path.join(P, 'voice'); SR = 48000
parts = json.load(open(os.path.join(V, 'parts.json'))); L = {l['id']: l for l in json.load(open(os.path.join(P, 'lines.json')))['lines']}

def load(path):
    y, sr = sf.read(path); y = y if y.ndim == 1 else y.mean(1); y = y.astype(np.float32)
    if sr != SR: y = soxr.resample(y, sr, SR) if soxr else np.interp(np.arange(0, len(y), sr / SR), np.arange(len(y)), y).astype(np.float32)
    return y
def energy(x):
    hop = int(.01 * SR); n = len(x) // hop; return np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1))

out, timing, report, t_off = [], {}, [], 0.
for p in parts:
    f = os.path.join(V, f"part{p['part']}.wav")
    if not os.path.exists(f): sys.exit(f'missing {f}')
    x = load(f); e = energy(x); thr = max(e.max() * .02, np.percentile(e, 20) * 1.5); sil = e < thr
    runs, i = [], 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]: j += 1
            runs.append((i / 100, (j - i) / 100)); i = j
        else: i += 1
    for k in range(len(runs) - 1, 0, -1):            # merge pauses split by a blip of < 60 ms
        (a0, d0), (a1, d1) = runs[k - 1], runs[k]
        if a1 - (a0 + d0) < .06: runs[k - 1] = (a0, a1 + d1 - a0); del runs[k]
    speech = np.concatenate([[0], np.cumsum(~sil)]) / 100
    on = np.nonzero(~sil)[0]; s0, s1 = on[0] / 100, (on[-1] + 1) / 100
    ids = p['lines']
    # sentence-level DP: every sentence boundary sits in a pause; a sentence's span should match its text length
    sents = []                                       # (line index, text)
    for k, lid in enumerate(ids):
        for sx in [q for q in re.split(r'(?<=[.!?…])[»”"]?\s+', L[lid]['spoken']) if q.strip()]: sents.append((k, sx))
    Ns = len(sents); w = np.array([len(sx) + 6 for _, sx in sents], float)
    cand = [(st, d) for st, d in runs if d >= .12 and s0 < st < s1]; mid = [s0 - .02] + [st + d / 2 for st, d in cand] + [s1 + .02]
    plen = [1.] + [d for _, d in cand] + [1.]; n = len(mid)
    if n - 1 < Ns: sys.exit(f"part{p['part']}: only {n - 2} pauses for {Ns} sentences — regenerate the take with clearer pauses")
    exp = w / w.sum() * (s1 - s0); INF = 1e18; C = np.full((Ns + 1, n), INF); B = np.zeros((Ns + 1, n), int); C[0, 0] = 0
    is_block_end = [k == Ns - 1 or sents[k + 1][0] != sents[k][0] for k in range(Ns)]
    for i in range(1, Ns + 1):
        e = exp[i - 1]; bonus = .5 if is_block_end[i - 1] else .25
        for j in range(i, n - (Ns - i)):
            best, bj = INF, 0
            for jp in range(max(i - 1, j - 25), j):
                c = C[i - 1, jp]
                if c >= INF: continue
                d = mid[j] - mid[jp]; sp = speech[min(len(speech) - 1, int(mid[j] * 100))] - speech[int(max(0, mid[jp]) * 100)]
                c += np.log(max(d, .05) / e) ** 2 - bonus * min(plen[j], 1.2) + (8. if sp < .25 else 0.)
                if c < best: best, bj = c, jp
            C[i, j], B[i, j] = best, bj
    j = n - 1; cuts = [j]
    for i in range(Ns, 0, -1): j = B[i, j]; cuts.append(j)
    cuts = [mid[c] for c in cuts[::-1]]                # Ns+1 cut times
    st_sent = []
    for k in range(Ns):
        a0, a1 = int(cuts[k] * 100), int(cuts[k + 1] * 100); sg = np.nonzero(~sil[a0:a1])[0]
        st_sent.append((cuts[k] + sg[0] / 100, cuts[k] + (sg[-1] + 1) / 100) if len(sg) else (cuts[k], cuts[k + 1]))
    for k, lid in enumerate(ids):
        ss_ = [st_sent[i] for i in range(Ns) if sents[i][0] == k]; t0, t1 = ss_[0][0], ss_[-1][1]
        timing[lid] = {'t0': round(t_off + t0, 3), 't1': round(t_off + t1, 3), 'part': p['part'], 'sents': [[round(t_off + x0, 3), round(t_off + x1, 3)] for x0, x1 in ss_]}
        rate = (t1 - t0) / max(1, len(L[lid]['spoken']))
        report.append((lid, t_off + t0, t1 - t0, rate, L[lid]['spoken'][:60]))
    out += [x, np.zeros(int(a.gap * SR), np.float32)]; t_off += len(x) / SR + a.gap
y = np.concatenate(out); sf.write(os.path.join(V, 'narration.wav'), y, SR)
rates = np.array([r[3] for r in report]); med = float(np.median(rates))
with open(os.path.join(V, 'align-report.txt'), 'w') as fh:
    for lid, t0, d, r, s in report: fh.write(f"{lid} {t0:8.2f}s {d:6.2f}s {'CHECK' if abs(r / med - 1) > .45 else '     '} {s}\n")
json.dump({'lines': timing, 'total': round(len(y) / SR, 3)}, open(os.path.join(V, 'timing.json'), 'w'), indent=1)
flag = sum(1 for r in rates if abs(r / med - 1) > .45)
print(f"narration {len(y) / SR:.1f}s, {len(timing)} blocks aligned, {flag} flagged CHECK → voice/align-report.txt")
