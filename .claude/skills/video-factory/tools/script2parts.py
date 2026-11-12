"""script.md (marked-up script) → lines.json (for captions/HUD) + voice/AI-STUDIO.md and parts.json (text to voice in AI Studio).

usage: python script2parts.py <project_dir> [--max-words 380]

Script format (see ../SKILL.md, «Разметка сценария»):
  front matter between --- lines: title, format (1920x1080 | 1080x1920), style, theme, voice, voice_style (multi-line with |)
  # ЗАГОЛОВОК            chapter card (shown, not spoken). Headings starting with ПРАВИЛО/ШАГ/ГЛАВА are counted for the HUD (n/N)
  @day 4 · @time 23:40 · @place МАЯК · @alert ТЕКСТ · @chapter ТЕКСТ   HUD directives, apply from the next spoken block
  > текст               a note (spoken; shown in a note box)
  Имя: «текст»          a dialogue line (spoken without the name; shown in a dialogue box with the name)
  ! текст               the spoken title of the current chapter (shown as the chapter card while it is spoken, no subtitles)
  any other paragraph   narration (spoken; karaoke subtitles)
  inline emphasis: *акцент*  **опасность**  ~тихо/холод~  ==число==
  [[текст]]             spoken but not shown (e.g. «[[На полях — карандашом:]] «…»»)
  @part                 start a new voice part here (to match parts you already recorded)
  @scene x · @shot x · @any value   free tags for the style page, attached to the next spoken block only
Blocks are separated by blank lines."""
import re, sys, json, os, argparse

ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--max-words', type=int, default=380); a = ap.parse_args()
P = a.project; src = open(os.path.join(P, 'script.md'), encoding='utf-8').read()

meta = {}
m = re.match(r'^---\n(.*?)\n---\n', src, re.S)
if m:
    body = src[m.end():]; key = None
    for ln in m.group(1).split('\n'):
        mm = re.match(r'^(\w+):\s*(.*)$', ln)
        if mm and not ln.startswith(' '):
            key, val = mm.group(1), mm.group(2).strip()
            meta[key] = '' if val == '|' else val
        elif key:
            meta[key] = (meta[key] + '\n' + ln.strip()).strip()
else:
    body = src

EMPH = re.compile(r'\*\*(.+?)\*\*|\*(.+?)\*|~(.+?)~|==(.+?)==')
def plain(s): return re.sub(r'\s+', ' ', EMPH.sub(lambda q: next(g for g in q.groups() if g is not None), s.replace('[[', '').replace(']]', ''))).strip()

blocks = [b.strip() for b in re.split(r'\n\s*\n', body) if b.strip()]
lines, chapters, hud, pend_alert, chap_cur = [], [], {'day': '', 'time': '', 'place': '', 'chapter': ''}, None, None
HUDK, tags, force_part = set(hud), {}, set()
COUNTED = re.compile(r'^(ПРАВИЛО|ШАГ|ГЛАВА|СОВЕТ|ЧАСТЬ|RULE|STEP)\b', re.I)
for b in blocks:
    text_lines = []
    for ln in b.split('\n'):
        ln = ln.rstrip()
        if ln.startswith('@'):
            mm = re.match(r'^@(\w+)\s*(.*)$', ln); k, v = mm.group(1).lower(), mm.group(2).strip()
            if k == 'alert': pend_alert = v
            elif k == 'part': force_part.add(len(lines))
            elif k in HUDK: hud[k] = v
            else: tags[k] = v
        elif ln.startswith('# '):
            title = ln[2:].strip(); chap_cur = {'id': f'c{len(chapters) + 1:02d}', 'title': title, 'counted': bool(COUNTED.match(title))}
            chapters.append(chap_cur); hud['chapter'] = title
        else:
            text_lines.append(ln)
    if not text_lines: continue
    t = ' '.join(x.strip() for x in text_lines).strip()
    kind, speaker = 'narr', None
    if t.startswith('>'): kind, t = 'note', t.lstrip('> ').strip()
    elif t.startswith('!'): kind, t = 'title', t.lstrip('! ').strip()
    else:
        mm = re.match(r'^([А-ЯЁA-Z][\w\-ёЁ ]{0,20}):\s*([«"“].*)$', t)
        if mm: kind, speaker, t = 'dialog', mm.group(1).strip(), mm.group(2).strip()
    ln = {'id': f'l{len(lines) + 1:03d}', 'kind': kind, 'text': t, 'spoken': plain(t), 'hud': dict(hud), 'chapter': chap_cur['id'] if chap_cur else None}
    if speaker: ln['speaker'] = speaker
    if pend_alert: ln['alert'] = pend_alert; pend_alert = None
    if tags: ln['tags'] = tags; tags = {}
    lines.append(ln)

# chapter → first line; counters n/N for counted chapters
N = sum(1 for c in chapters if c['counted']); n = 0
for c in chapters:
    if c['counted']: n += 1; c['n'] = n; c['N'] = N
    c['first'] = next((l['id'] for l in lines if l['chapter'] == c['id']), None)

# parts: ≤ max words, never splitting a block; prefer to start a part at a chapter when the part is ≥ 60 % full
parts, cur, words = [], [], 0
for i, l in enumerate(lines):
    w = len(l['spoken'].split()); starts_chapter = any(c['first'] == l['id'] for c in chapters)
    if cur and (i in force_part or (not force_part and (words + w > a.max_words or (starts_chapter and words > .6 * a.max_words)))):
        parts.append(cur); cur, words = [], 0
    cur.append(l['id']); words += w
if cur: parts.append(cur)

os.makedirs(os.path.join(P, 'voice'), exist_ok=True)
json.dump({'meta': meta, 'chapters': chapters, 'lines': lines}, open(os.path.join(P, 'lines.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump([{'part': k + 1, 'lines': ids} for k, ids in enumerate(parts)], open(os.path.join(P, 'voice', 'parts.json'), 'w'), indent=1)
L = {l['id']: l for l in lines}
out = [f"# {meta.get('title', 'Озвучка')} — текст для Google AI Studio", '',
       f"Режим: **Generate speech → Single-speaker**. Голос: **{meta.get('voice', 'Algenib')}**. Каждую часть генерируйте отдельно с одним и тем же стилем; скачайте WAV как `part1.wav`, `part2.wav`… и пришлите.", '',
       '## Style instructions (одинаковые для всех частей)', '', '```', meta.get('voice_style', 'Читай по-русски, выразительно, с паузами между абзацами.'), '```', '']
for k, ids in enumerate(parts):
    wc = sum(len(L[i]['spoken'].split()) for i in ids)
    out += [f'## Часть {k + 1} из {len(parts)} · {wc} слов', '', '```', '\n\n'.join(L[i]['spoken'] for i in ids), '```', '']
open(os.path.join(P, 'voice', 'AI-STUDIO.md'), 'w', encoding='utf-8').write('\n'.join(out))
print(f"{len(lines)} blocks, {len(chapters)} chapters ({N} counted), {len(parts)} voice parts → voice/AI-STUDIO.md")
