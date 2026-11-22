"""Check the first 20 seconds the MrBeast way: the title is said, the thumbnail is shown, no intro.

usage: python hookcheck.py <project_dir> [--title "…"] [--thumb "ПЛАШКА 1 / ПЛАШКА 2"]

Reads script.md front matter (`yt_title:` or `title:`, `thumb:`) and the word times from cues.json
(after align.py); before the voice exists it estimates times from lines.json at 2.7 words/s.
Checks (exit code 1 if any fails):
  1. ОБЕЩАНИЕ — at least 60 % of the title's content words are spoken in the first 8 s.
  2. ПРЕВЬЮ   — at least 50 % of the thumbnail plate words are spoken in the first 10 s.
  3. КАДР 1   — the first spoken block carries `@thumb A` (its first shot is the thumbnail picture).
  4. ГЛАВЫ    — the first chapter card comes at 18 s or later.
  5. БЕЗ ВСТУПЛЕНИЙ — no greeting / «в этом видео» / «подпишись» / «лайк» in the first 20 s.
"""
import json, re, sys, argparse
from pathlib import Path

NUM = {'1': 'один', '2': 'два', '3': 'три', '4': 'четыре', '5': 'пять', '6': 'шесть', '7': 'семь', '8': 'восемь', '9': 'девять',
       '10': 'десять', '12': 'двенадцать', '14': 'четырнадцать', '20': 'двадцать', '24': 'двадцать', '25': 'двадцать', '30': 'тридцать', '40': 'сорок', '45': 'сорок',
       '50': 'пятьдесят', '100': 'сто', '1000': 'тысяча'}
STOP = set('я меня мне мной мой моя мои ты тебя тебе тобой твой твоя твои он его ему она её ее мы нас вы вас они их это этот эта '
           'и а но или в во на с со к ко о об от до из за по под над при про для без что как если чем ли же бы не ни да нет '
           'что-если там тут так все всё уже ещё еще'.split())
INTRO = ['привет', 'добро пожаловать', 'в этом видео', 'в этом ролике', 'меня зовут', 'подпишись', 'подпишитесь', 'лайк', 'колокольчик']


def norm(w):
    return re.sub(r'[^0-9a-zа-я\-]', '', w.lower().replace('ё', 'е'))


def stem(w):
    w = NUM.get(w, w)
    return w[:max(3, min(5, len(w) - 2))]


def content_words(s):
    out = []
    for raw in re.split(r'[\s/·,.!?:;«»"—–]+', s):
        w = norm(raw)
        if not w or w in STOP or (len(w) < 3 and w not in NUM):
            continue
        out.append((raw.strip(), stem(w)))
    return out


def front(script):
    m = re.match(r'^---\n(.*?)\n---', script, re.S)
    fm = {}
    for ln in (m.group(1).split('\n') if m else []):
        mm = re.match(r'^(\w+):\s*(.*)$', ln)
        if mm: fm[mm.group(1)] = mm.group(2).strip()
    return fm


def timed_words(P):
    cj = P / 'cues.json'
    if cj.exists():
        c = json.loads(cj.read_text())
        ws = [(w['t0'], norm(w['w'])) for l in c['lines'].values() for w in l.get('words', [])]
        cards = [x['t'] for x in c.get('cards', [])]
        return sorted(ws), cards, 'по озвучке'
    L = json.loads((P / 'lines.json').read_text())
    L = L['lines'] if isinstance(L, dict) and 'lines' in L else L
    ws, cards, t = [], [], 0.0
    for ln in (L.values() if isinstance(L, dict) else L):
        if ln.get('kind') == 'title' and t > 0: cards.append(t)
        for w in ln.get('spoken', ln.get('text', '')).split():
            ws.append((t, norm(w))); t += 1 / 2.7
        t += .4
    return ws, cards, 'оценка 2.7 слова/с (озвучки ещё нет)'


def first_time(ws, st):
    for t, w in ws:
        if w and stem(w) == st:
            return t
    return None


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('proj'); ap.add_argument('--title'); ap.add_argument('--thumb')
    a = ap.parse_args(); P = Path(a.proj)
    script = (P / 'script.md').read_text(); fm = front(script)
    title = a.title or fm.get('yt_title') or fm.get('title', '')
    thumb = a.thumb or fm.get('thumb', '')
    ws, cards, how = timed_words(P)
    ok_all = True
    print(f'Первые 20 секунд ({how})\n')

    def block(name, text, limit, need):
        nonlocal ok_all
        cw = content_words(text)
        if not cw:
            print(f'{name}: не задано — впиши в front matter'); ok_all = False; return
        hits = 0
        rows = []
        for raw, st in cw:
            t = first_time(ws, st)
            good = t is not None and t <= limit
            hits += good
            rows.append(f'   {"✓" if good else "✗"} {raw:<16} ' + (f'{t:5.1f} с' if t is not None else 'не звучит'))
        ok = hits >= need * len(cw)
        ok_all &= ok
        print(f'{"✓" if ok else "✗"} {name} «{text}»: {hits}/{len(cw)} слов за {limit} с (нужно ≥ {int(need * 100)} %)')
        print('\n'.join(rows))

    block('ОБЕЩАНИЕ НАЗВАНИЯ', title, 8, .6)
    block('ТЕКСТ ПРЕВЬЮ', thumb, 10, .5)

    body = script.split('---', 2)[-1]
    first = re.split(r'\n\s*\n', body.strip())
    first_block = next((b for b in first if any(not x.startswith(('@', '#', '!')) and x.strip() for x in b.split('\n'))), '')
    th = re.search(r'^@thumb\s+(\w+)', first_block, re.M)
    print(f'{"✓" if th else "✗"} КАДР 1 = ПРЕВЬЮ: ' + (f'@thumb {th.group(1)} в первом блоке' if th else 'нет @thumb A в первом блоке'))
    ok_all &= bool(th)

    fc = min(cards) if cards else None
    good = fc is None or fc >= 18
    print(f'{"✓" if good else "✗"} ПЕРВАЯ ГЛАВА: ' + (f'{fc:.1f} с' if fc is not None else 'нет') + ' (нужно ≥ 18 с)')
    ok_all &= good

    txt20 = ' '.join(w for t, w in ws if t <= 20)
    bad = [p for p in INTRO if p in txt20]
    print(f'{"✓" if not bad else "✗"} БЕЗ ВСТУПЛЕНИЙ: ' + (', '.join(bad) if bad else 'чисто'))
    ok_all &= not bad
    print('\nИТОГ: ' + ('первые 20 секунд соответствуют названию и превью' if ok_all else 'переделай начало (см. ✗)'))
    sys.exit(0 if ok_all else 1)


if __name__ == '__main__':
    main()
