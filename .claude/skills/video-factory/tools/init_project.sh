#!/bin/sh
# Create a video-factory project: folder, script template, overlay + fonts, page skeleton.
# usage: sh init_project.sh <project_dir> [style] [theme] [format]
#   style: a Lemo-Opuscar style folder (pixel-rpg, halftone-dossier, woodcut …); its demo engine files are copied to js/engine/
#   theme: overlay theme pixel | dossier | woodcut | spy | clean (default clean);  format: 1920x1080 | 1080x1920
set -e
P=${1:?project dir}; STYLE=${2:-}; THEME=${3:-clean}; FMT=${4:-1920x1080}
SK=$(cd "$(dirname "$0")/.." && pwd); LIB=${LIB:-/root/lemo-opuscar}
W=${FMT%x*}; H=${FMT#*x}
mkdir -p "$P/voice" "$P/js" "$P/overlay/fonts" "$P/out"
cp "$SK/tools/overlay.js" "$P/overlay/"; cp "$SK/assets/fonts/"* "$P/overlay/fonts/"
case "$STYLE" in toon|scifi-toon|cartoon) cp "$SK/assets/toon/"*.js "$P/js/";; spy|spy-titles) cp "$SK/assets/spy/"*.js "$P/js/";; esac
if [ -n "$STYLE" ] && [ -d "$LIB/styles/$STYLE/demo" ]; then mkdir -p "$P/js/engine"; cp "$LIB/styles/$STYLE/demo/"*.js "$P/js/engine/" 2>/dev/null || true; fi
[ -f "$P/.gitignore" ] || printf 'voice/*.wav\nout/\n*.wav\n*.mp4\n' > "$P/.gitignore"   # never commit audio, renders or render segments
[ -f "$P/script.md" ] || cat > "$P/script.md" <<EOF
---
title: Название ролика
yt_title: Название на YouTube (≤ 55 знаков, его слова звучат в первые 8 с)
thumb: ПЛАШКА 1 / ПЛАШКА 2
format: $FMT
style: $STYLE
theme: $THEME
hud: minimal
music: tension
voice: Charon
voice_style: |
  Говори как живой человек, который ночью тихо рассказывает другу страшную историю, а не как диктор. Естественно, на русском, от второго лица («ты»). Темп живой, без растягивания слов. Перед поворотами — пауза и тише. Названия правил говори просто и весомо, как заголовок.
---

@time 03:40
@stat ТЕПЛО 30
@danger 80 @стук
@thumb A
@scene hook
Первая фраза = название ролика словами озвучки (кадр 0 = превью A, плашки улетают). Хук: самый страшный момент ночи — с *акцентом*, **опасностью**, ~холодом~ и ==числом==. Открытая петля: скрытое правило.

@scene rewind
Вернёмся на шесть часов назад.

# ПРАВИЛО 1 · Название правила

@time 22:30
@scene r1_action
Каждое действие — отдельной короткой фразой. Ты поворачиваешь ключ. Мотор кашляет и заводится.

# ПРАВИЛО 7 · ████████
! Правило седьмое. Стёрто.

@scene r7_cta
Как думаешь, что написано в седьмом правиле? Напиши в комментариях — в конце узнаешь.

Имя: «Реплика».
EOF
[ -f "$P/index.html" ] || cat > "$P/index.html" <<EOF
<!doctype html><html><head><meta charset="utf-8"><title>video</title>
<style>html,body{margin:0;background:#000;overflow:hidden}canvas{position:absolute;left:0;top:0;display:block;image-rendering:pixelated}</style>
</head><body><canvas id="stage" width="$W" height="$H"></canvas><canvas id="ov" width="$W" height="$H"></canvas>
<script type="module">
import { createOverlay } from './overlay/overlay.js';
const cues = await (await fetch('./cues.json')).json();
const thumb = new URLSearchParams(location.search).get('thumb');   // ?thumb=A|B|C → YouTube thumbnail (js/thumb.js, same drawing as frame 0)
const film = await import(thumb ? './js/thumb.js' : './js/film.js');
const st = await film.init(document.getElementById('stage'), cues, thumb);
const ov = thumb ? { draw() {} } : await createOverlay(document.getElementById('ov'), cues, { theme: cues.theme, base: './overlay/' });
window.DUR = cues.total; window.EV = st.EV || [];
window.render = t => { st.draw(t); ov.draw(t); };
window.READY = true;
</script></body></html>
EOF
[ -f "$P/js/film.js" ] || cat > "$P/js/film.js" <<'EOF'
// style layer: draw the picture for time t; cues.lines[id] = {t0, t1, kind, tags:{scene…}, words:[{w,t0,t1}]}
export async function init(cv, cues) {
  const g = cv.getContext('2d'), L = Object.entries(cues.lines);
  return { draw(t) { g.fillStyle = '#111'; g.fillRect(0, 0, cv.width, cv.height); const cur = L.find(([, l]) => t >= l.t0 && t < l.t1); g.fillStyle = '#444'; g.font = '40px monospace'; g.fillText(cur ? cur[1].tags.scene || cur[0] : '', 60, 100); } };
}
EOF
echo "project ready: $P  (edit script.md, then: python tools/script2parts.py $P)"
