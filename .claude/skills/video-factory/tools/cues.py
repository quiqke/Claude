"""lines.json + voice/timing.json → cues.json for the overlay (karaoke pages, HUD timeline, chapter cards, notes, dialogues, alerts).

usage: python cues.py <project_dir> [--max-chars N] [--lead 0.0]
Word times inside a block are spread by character length over the block's speech (no speech recognition).
Emphasis classes: acc (*…*), danger (**…**), cool (~…~), num (==…==); plain words have no class."""
import os, re, json, argparse
ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--max-chars', type=int, default=0); ap.add_argument('--lead', type=float, default=0.); a = ap.parse_args()
P = a.project; D = json.load(open(os.path.join(P, 'lines.json'), encoding='utf-8')); T = json.load(open(os.path.join(P, 'voice', 'timing.json')))
meta, lines, chapters = D['meta'], D['lines'], D['chapters']
W, H = [int(v) for v in meta.get('format', '1920x1080').split('x')]
maxc = a.max_chars or (30 if H > W else 44)
TOK = re.compile(r'\*\*(.+?)\*\*|\*(.+?)\*|~(.+?)~|==(.+?)==|(\S+)')
CLS = ['danger', 'acc', 'cool', 'num', None]

def words_of(text):
    """whitespace tokens of the spoken text (same split as align.py), each with its emphasis class and hidden flag"""
    out, cur, st, i = [], None, {'**': 0, '*': 0, '~': 0, '==': 0, '[[': 0}, 0
    while i < len(text):
        two = text[i:i + 2]
        if two in ('**', '==', '[[', ']]'):
            k = '[[' if two in ('[[', ']]') else two; st[k] = 1 if two == '[[' else 0 if two == ']]' else 1 - st[k]; i += 2; continue
        ch = text[i]
        if ch in '*~': st[ch] ^= 1; i += 1; continue
        if ch.isspace(): cur = None; i += 1; continue
        if cur is None:
            c = 'danger' if st['**'] else 'num' if st['=='] else 'acc' if st['*'] else 'cool' if st['~'] else None
            cur = {'w': '', 'c': c, **({'h': 1} if st['[['] else {})}; out.append(cur)
        elif cur['c'] is None and (st['**'] or st['=='] or st['*'] or st['~']):
            cur['c'] = 'danger' if st['**'] else 'num' if st['=='] else 'acc' if st['*'] else 'cool'
        cur['w'] += ch; i += 1
    return out
shown = lambda ws: [{k: v for k, v in w.items() if k != 'h'} for w in ws if not w.get('h')]
pages, notes_dialogs, hud, alerts, LT, titles = [], [], [], [], {}, {}
for l in lines:
    tm = T['lines'][l['id']]; t0, t1 = tm['t0'] + a.lead, tm['t1'] + a.lead
    if tm.get('missing'): print('skip (not voiced):', l['id'], l['spoken'][:50]); continue
    ws = words_of(l['text']); tot = sum(len(w['w']) + 1 for w in ws) or 1; acc = 0
    if tm.get('words') and len(tm['words']) == len(ws):          # recogniser times per word (align.py)
        for w, (w0, w1) in zip(ws, tm['words']): w['t0'], w['t1'] = round(w0 + a.lead, 3), round(w1 + a.lead, 3)
    else:
        if tm.get('words'): print('word count differs, spreading by length:', l['id'])
        for w in ws:
            w['t0'] = round(t0 + (t1 - t0) * acc / tot, 3); acc += len(w['w']) + 1; w['t1'] = round(t0 + (t1 - t0) * acc / tot, 3)
    hud.append({'t': round(t0 - .15, 3), **l['hud']})
    LT[l['id']] = {'t0': round(t0, 3), 't1': round(t1, 3), 'kind': l['kind'], 'chapter': l.get('chapter'), 'tags': l.get('tags', {}),
                   'words': [{'w': re.sub(r'[«»"“”.,:;!?—…()]', '', w['w']).lower(), 't0': w['t0'], 't1': w['t1']} for w in ws]}
    ws = shown(ws)
    if l['kind'] == 'title':
        titles.setdefault(l.get('chapter'), (t0, t1)); continue
    if l.get('alert'): alerts.append({'t': round(t0, 3), 'text': l['alert'], 'dur': 2.6})
    if l['kind'] in ('note', 'dialog'):
        notes_dialogs.append({'kind': l['kind'], 'speaker': l.get('speaker'), 't0': round(t0 - .2, 3), 't1': round(t1 + .6, 3), 'words': ws}); continue
    cur = []
    plen = lambda ws_: sum(len(x['w']) + 1 for x in ws_)
    punct = lambda x: re.search(r'[.,:;!?…»]$', x['w'])
    for w in ws:                                     # karaoke pages: ≤ maxc chars; break at sentence ends and long pauses,
        n = plen(cur)                                # prefer after punctuation, never inside an emphasis group
        if cur and ((n > maxc * .5 and re.search(r'[.!?…»]$', cur[-1]['w'])) or (n > 12 and w['t0'] - cur[-1]['t1'] > .7)):
            pages.append(cur); cur = []
        elif cur and n + len(w['w']) > maxc:
            cand = [k for k in range(1, len(cur) + 1) if plen(cur[:k]) > maxc * .3 and not (k < len(cur) + 1 and k < len(cur) and cur[k - 1]['c'] and cur[k - 1]['c'] == cur[k]['c']) and not (k == len(cur) and cur[-1]['c'] and cur[-1]['c'] == w['c'])]
            good = [k for k in cand if punct(cur[k - 1])]
            k = (good or cand or [len(cur)])[-1]
            pages.append(cur[:k]); cur = cur[k:]
        cur.append(w)
    if cur: pages.append(cur)
out_pages = []
for i, pg in enumerate(pages):
    out_pages.append({'t0': round(pg[0]['t0'] - .12, 3), 't1': round(pg[-1]['t1'] + .35, 3), 'words': pg})
for i in range(len(out_pages) - 1):
    out_pages[i]['t1'] = min(max(out_pages[i]['t1'], out_pages[i]['t0'] + 1.0), out_pages[i + 1]['t0'] - .02)
cards = []
for c in chapters:
    if not c.get('first'): continue
    if c['id'] in titles: t0, t1 = titles[c['id']]; cards.append({'t': round(t0 - .3, 3), 'd': round(t1 - t0 + 1.3, 3), 'title': c['title'], 'n': c.get('n'), 'N': c.get('N')}); continue
    first = next((l['id'] for l in lines if l.get('chapter') == c['id'] and not T['lines'][l['id']].get('missing')), None)
    if first is None: continue                        # chapter not voiced at all
    t = T['lines'][first]['t0']
    cards.append({'t': round(t - .45, 3), 'd': 2.6, 'title': c['title'], 'n': c.get('n'), 'N': c.get('N')})
json.dump({'W': W, 'H': H, 'theme': meta.get('theme', 'clean'), 'total': T['total'], 'pages': out_pages, 'boxes': notes_dialogs, 'hud': hud, 'cards': cards, 'alerts': alerts, 'lines': LT},
          open(os.path.join(P, 'cues.json'), 'w', encoding='utf-8'), ensure_ascii=False)
# subtitles file for YouTube (pages + note/dialog text)
def ts(t): t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}'
subs = [(p['t0'], p['t1'], ' '.join(w['w'] for w in p['words'])) for p in out_pages] + [(b['t0'], b['t1'], ' '.join(w['w'] for w in b['words'])) for b in notes_dialogs]
subs.sort()
with open(os.path.join(P, 'subtitles.srt'), 'w', encoding='utf-8') as f:
    for k, (s0, s1, tx) in enumerate(subs, 1): f.write(f'{k}\n{ts(s0)} --> {ts(s1)}\n{re.sub(r"[*~=]", "", tx)}\n\n')
print(f"{len(out_pages)} caption pages, {len(notes_dialogs)} note/dialog boxes, {len(cards)} chapter cards, {len(alerts)} alerts → cues.json, subtitles.srt")
