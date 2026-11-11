"""Hershey Cyrillic (.jhf, ASCII-keyed) → single-line font JSON for the whiteboard engine:
{"glyphs": {char: {"w": advance, "s": [[x, y, x, y, ...], ...]}}}, font units with y up, cap height 677.
usage: python tools/jhf2json.py cyrillic.jhf fonts/hershey-cyr.json"""
import json, sys
MAP_UP = dict(A='А', B='Б', V='В', G='Г', D='Д', H='Ж', Z='З', I='И', E='Й', K='К', L='Л', M='М', N='Н', O='О', P='П',
              R='Р', S='С', T='Т', Y='У', F='Ф', X='Х', J='Ч', Q='Ш', W='Щ', U='Ю', C='Э')
MAP_UP.update({'[': 'Е', ']': 'Ъ', '$': 'Ы', '_': 'Ь', '^': 'Я', '`': 'Ц'})
MAP_LO = {k.lower(): v.lower() for k, v in MAP_UP.items() if k.isalpha()}
MAP_LO.update({'{': 'е', '|': 'ъ', '&': 'ы', '~': 'ь', '}': 'я', '%': 'ц'})
KEEP = set('!(),-./0123456789:;?+*=<>"\'')
data = open(sys.argv[1]).read().replace('\n', '')
recs, p = [], 0
while p < len(data):
    n = int(data[p + 5:p + 8]); rec = data[p + 8:p + 8 + 2 * n]; p += 8 + 2 * n
    L, R = ord(rec[0]) - 82, ord(rec[1]) - 82; ss = [[]]
    for k in range(2, len(rec), 2):
        if rec[k:k + 2] == ' R': ss.append([]); continue
        ss[-1].append((ord(rec[k]) - 82, ord(rec[k + 1]) - 82))
    recs.append((L, R, [s for s in ss if s]))
K, BASE = 677 / 21, 9                       # Hershey complex: cap from y=-12 to baseline y=9
out = {}
for i, (L, R, ss) in enumerate(recs):
    a = chr(32 + i)
    ch = MAP_UP.get(a) or MAP_LO.get(a) or (a if a in KEEP or a == ' ' else None)
    if a == "'" : ch = None
    if not ch: continue
    out[ch] = {'w': round((R - L) * K, 1), 's': [[v for (x, y) in s for v in (round((x - L) * K, 1), round((BASE - y) * K, 1))] for s in ss]}
for src, dst in [('Е', 'Ё'), ('е', 'ё'), ('-', '—'), ('-', '–'), ('"', '«'), ('"', '»')]: out[dst] = out[src]
json.dump({'glyphs': out, 'source': 'Hershey Fonts (Dr. A. V. Hershey, U.S. National Bureau of Standards; data format by James Hurt, Cognition Inc.)'}, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(out), 'glyphs')
