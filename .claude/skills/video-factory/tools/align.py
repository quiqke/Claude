"""Voice parts → one narration track + word-accurate timing, using offline Russian speech recognition.

usage: python align.py <project_dir> [--gap 0.5]
Reads lines.json and every voice/part*.wav in natural order (part1, part2, part2b, part3 …; any rate, mono or stereo).
1. Tightens each part (pauses > --max-pause 0.45 s shortened, tempo --speed 1.12 with pitch kept), joins them with
   --gap seconds of silence → voice/narration.wav (48 kHz mono). Use --speed 1 --max-pause 0 to keep the take as recorded.
2. Recognises the speech (sherpa-onnx + Vosk zipformer-ru, Apache-2.0, offline; ~20× faster than real time on CPU)
   in ≤ 18 s chunks cut at pauses, with a time for every recognised word.
3. Aligns the script's words to the recognised words (Needleman–Wunsch on normalised words, fuzzy matching), so every
   script word gets its own t0/t1; words the recogniser missed are placed between their neighbours.
Writes voice/timing.json {lines: {id: {t0, t1, words: [[t0, t1], …], missing?}}, total} and voice/align-report.txt:
blocks with no voice («MISSING» — a part was cut off or skipped; voice that text and add it as e.g. part2b.wav) and blocks
where few words matched («CHECK»). Falls back to align_pauses.py if sherpa-onnx or the model is not installed.
Setup: uv pip install --python $LIB/.venv/bin/python sherpa-onnx; model: tools/fetch_asr.sh"""
import os, re, sys, json, argparse, subprocess, numpy as np, soundfile as sf
ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--gap', type=float, default=.35)
ap.add_argument('--speed', type=float, default=1.12, help='tempo of the voice (pitch kept); 1 = as recorded')
ap.add_argument('--max-pause', type=float, default=.45, help='longer silences are shortened to this'); a = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__)); MODEL = os.environ.get('ASR_MODEL', '/root/opt/asr/sherpa-onnx-zipformer-ru-2024-09-18')
try:
    import sherpa_onnx, soxr
    assert os.path.exists(os.path.join(MODEL, 'tokens.txt'))
except Exception:
    print('sherpa-onnx / model not found → pause-based alignment (align_pauses.py)'); sys.exit(subprocess.call([sys.executable, os.path.join(HERE, 'align_pauses.py'), a.project, '--gap', str(a.gap)]))
P = a.project; V = os.path.join(P, 'voice'); SR = 48000
lines = json.load(open(os.path.join(P, 'lines.json'), encoding='utf-8'))['lines']
nat = lambda s: [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', s)]
files = sorted([f for f in os.listdir(V) if re.match(r'part\d+[a-z]?\.wav$', f)], key=nat)
if not files: sys.exit('no voice/part*.wav')

FF = os.environ.get('FFMPEG') or ('/root/opt/bin/ffmpeg' if os.path.exists('/root/opt/bin/ffmpeg') else 'ffmpeg')
def tighten(x, sr):
    """shorten every pause longer than --max-pause (20 ms crossfades), then speed up the voice with ffmpeg atempo (pitch kept)"""
    if a.max_pause > 0:
        hop = int(.01 * sr); n = len(x) // hop; e = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)); sil = e < max(e.max() * .02, np.percentile(e, 20) * 1.5)
        keep, i, cf = [], 0, int(.02 * sr); last = 0
        while i < n:
            if sil[i]:
                j = i
                while j < n and sil[j]: j += 1
                if (j - i) / 100 > a.max_pause and i > 0 and j < n:
                    cut0 = (i + int(a.max_pause * 50)) * hop; cut1 = (j - int(a.max_pause * 50)) * hop
                    keep.append(x[last:cut0 + cf].copy()); last = cut1
                i = j
            else: i += 1
        keep.append(x[last:])
        y = keep[0]
        for seg_ in keep[1:]:
            r = np.linspace(1, 0, cf, dtype=np.float32); y[-cf:] = y[-cf:] * r + seg_[:cf] * (1 - r); y = np.concatenate([y, seg_[cf:]])
        x = y
    if abs(a.speed - 1) > .005:
        import tempfile; d = tempfile.mkdtemp(); fi, fo = os.path.join(d, 'i.wav'), os.path.join(d, 'o.wav'); sf.write(fi, x, sr)
        subprocess.run([FF, '-v', 'error', '-y', '-i', fi, '-filter:a', f'atempo={a.speed}', fo], check=True); x, _ = sf.read(fo); x = x.astype(np.float32)
    return x
def load(path, sr_out):
    y, sr = sf.read(path); y = (y if y.ndim == 1 else y.mean(1)).astype(np.float32)
    return soxr.resample(y, sr, sr_out) if sr != sr_out else y
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{MODEL}/encoder.int8.onnx', decoder=f'{MODEL}/decoder.onnx', joiner=f'{MODEL}/joiner.int8.onnx',
                                                   tokens=f'{MODEL}/tokens.txt', num_threads=os.cpu_count() or 4)
out, asr, t_off = [], [], 0.                       # asr: [(word, t0, t1)] on the joined timeline
for f in files:
    x = tighten(load(os.path.join(V, f), SR), SR); x16 = soxr.resample(x, SR, 16000)
    hop = 160; n = len(x16) // hop; e = np.sqrt((x16[:n * hop].reshape(n, hop) ** 2).mean(1)); thr = max(e.max() * .02, np.percentile(e, 20) * 1.5); sil = e < thr
    # chunk ends: the longest pause in each 12–18 s window
    cuts, s = [0], 0
    while (n - s) / 100 > 18:
        win = sil[s + 1200:s + 1800]; run = np.zeros(len(win)); c = 0
        for i, v in enumerate(win): c = c + 1 if v else 0; run[i] = c
        k = int(np.argmax(run)); s = s + 1200 + k - int(run[k] // 2); cuts.append(s)
    cuts.append(n)
    for c0, c1 in zip(cuts[:-1], cuts[1:]):
        st = rec.create_stream(); st.accept_waveform(16000, x16[c0 * hop:c1 * hop]); rec.decode_stream(st); r = st.result
        ws = []
        for tok, ts in zip(r.tokens, r.timestamps):
            if tok.startswith(' ') or not ws: ws.append([tok.strip(), ts])
            else: ws[-1][0] += tok
        for i, (w, ts) in enumerate(ws):
            t0 = c0 / 100 + ts; t1 = c0 / 100 + (ws[i + 1][1] if i + 1 < len(ws) else (c1 - c0) / 100)
            j = int(t1 * 100) - 1                       # trim the word end back to the last voiced frame
            while j > int(t0 * 100) + 8 and j < len(sil) and sil[j]: j -= 1
            asr.append((w, t_off + t0, t_off + min(t1, (j + 2) / 100)))
    out += [x, np.zeros(int(a.gap * SR), np.float32)]; t_off += len(x) / SR + a.gap
    print(f'{f}: {len(x) / SR:.1f}s recognised')
y = np.concatenate(out); sf.write(os.path.join(V, 'narration.wav'), y, SR)

# script words (whitespace tokens of the spoken text, same split as cues.py)
norm = lambda w: re.sub(r'[^а-яa-z0-9]', '', w.lower().replace('ё', 'е').replace('́', ''))
sw = [(l['id'], k, norm(w)) for l in lines for k, w in enumerate(l['spoken'].split())]
A = [s[2] for s in sw]; Bw = [norm(w) for w, _, _ in asr]
def sim(p, q):
    if not p or not q: return 0.
    if p == q: return 1.
    if p in q or q in p: return .75 if min(len(p), len(q)) >= 3 else .3
    n = min(len(p), len(q), 4); return .6 if n >= 3 and p[:n] == q[:n] else 0.
na, nb = len(A), len(Bw); G = -.45
S = np.zeros((na + 1, nb + 1), np.float32); S[:, 0] = G * np.arange(na + 1); S[0, :] = G * np.arange(nb + 1)
Tb = np.zeros((na + 1, nb + 1), np.int8)
for i in range(1, na + 1):
    ai = A[i - 1]; row, prev = S[i], S[i - 1]
    sims = np.array([sim(ai, b) for b in Bw], np.float32); diag = prev[:-1] + np.where(sims > 0, 2 * sims, -1.)
    up = prev[1:] + G
    for j in range(1, nb + 1):
        d, u, l_ = diag[j - 1], up[j - 1], row[j - 1] + G
        if d >= u and d >= l_: row[j], Tb[i, j] = d, 0
        elif u >= l_: row[j], Tb[i, j] = u, 1
        else: row[j], Tb[i, j] = l_, 2
i, j, match = na, nb, {}
while i > 0 and j > 0:
    t = Tb[i, j]
    if t == 0:
        if sim(A[i - 1], Bw[j - 1]) > 0: match[i - 1] = j - 1
        i, j = i - 1, j - 1
    elif t == 1: i -= 1
    else: j -= 1
# times for every script word: matched → recogniser time; unmatched → spread between neighbours by length
T0, T1 = np.full(na, np.nan), np.full(na, np.nan)
for i, j in match.items(): T0[i], T1[i] = asr[j][1], asr[j][2]
i = 0
while i < na:
    if not np.isnan(T0[i]): i += 1; continue
    k = i
    while k < na and np.isnan(T0[k]): k += 1
    lo = T1[i - 1] if i > 0 else 0.; hi = T0[k] if k < na else t_off - a.gap
    ln = np.array([len(A[m]) + 1 for m in range(i, k)], float); cum = np.concatenate([[0], np.cumsum(ln)]) / ln.sum()
    for m in range(i, k): T0[m], T1[m] = lo + (hi - lo) * cum[m - i], lo + (hi - lo) * cum[m - i + 1]
    i = k
timing, report, k = {}, [], 0
for l in lines:
    nw = len(l['spoken'].split()); idx = list(range(k, k + nw)); k += nw
    m = sum(1 for q in idx if q in match); t0, t1 = float(T0[idx[0]]), float(T1[idx[-1]])
    miss = m == 0 or (m / nw < .25 and (t1 - t0) < .08 * nw)
    timing[l['id']] = {'t0': round(t0, 3), 't1': round(max(t1, t0 + .05), 3), 'words': [[round(float(T0[q]), 3), round(float(T1[q]), 3)] for q in idx], **({'missing': True} if miss else {})}
    report.append(f"{l['id']} {t0:8.2f}s {t1 - t0:6.2f}s {m:3d}/{nw:<3d} {'MISSING' if miss else 'CHECK  ' if m / nw < .6 else '       '} {l['spoken'][:70]}")
open(os.path.join(V, 'align-report.txt'), 'w', encoding='utf-8').write('\n'.join(report) + '\n')
json.dump({'lines': timing, 'total': round(len(y) / SR, 3), 'files': files}, open(os.path.join(V, 'timing.json'), 'w'), indent=1)
json.dump([{'w': w, 't0': round(t0, 3), 't1': round(t1, 3)} for w, t0, t1 in asr], open(os.path.join(V, 'asr.json'), 'w', encoding='utf-8'), ensure_ascii=False)
mis = [r.split()[0] for r in report if 'MISSING' in r]; chk = sum('CHECK' in r for r in report)
print(f"narration {len(y) / SR:.1f}s · {len(match)}/{na} script words matched · {chk} blocks CHECK · {len(mis)} MISSING {' '.join(mis)} → voice/align-report.txt")
