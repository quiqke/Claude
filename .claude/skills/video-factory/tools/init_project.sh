#!/bin/sh
# Create a video-factory project: folder, script template, overlay + fonts, page skeleton.
# usage: sh init_project.sh <project_dir> [style] [theme] [format]
#   style: a Lemo-Opuscar style folder (pixel-rpg, halftone-dossier, woodcut …); its demo engine files are copied to js/engine/
#   theme: overlay theme pixel | dossier | woodcut | clean (default clean);  format: 1920x1080 | 1080x1920
set -e
P=${1:?project dir}; STYLE=${2:-}; THEME=${3:-clean}; FMT=${4:-1920x1080}
SK=$(cd "$(dirname "$0")/.." && pwd); LIB=${LIB:-/root/lemo-opuscar}
W=${FMT%x*}; H=${FMT#*x}
mkdir -p "$P/voice" "$P/js" "$P/overlay/fonts" "$P/out"
cp "$SK/tools/overlay.js" "$P/overlay/"; cp "$SK/assets/fonts/"* "$P/overlay/fonts/"
if [ -n "$STYLE" ] && [ -d "$LIB/styles/$STYLE/demo" ]; then mkdir -p "$P/js/engine"; cp "$LIB/styles/$STYLE/demo/"*.js "$P/js/engine/" 2>/dev/null || true; fi
[ -f "$P/script.md" ] || cat > "$P/script.md" <<EOF
---
title: Название ролика
format: $FMT
style: $STYLE
theme: $THEME
music: tension
voice: Algenib
voice_style: |
  Читай по-русски, от второго лица, напряжённым голосом, в живом темпе — чуть быстрее обычного рассказа, не растягивай слова. Паузы между предложениями короткие, между абзацами — около полсекунды. Названия глав («Глава первая. …») — чётко и весомо.
---

@day 1
@time 23:40
@place МАЯК
@objective Дожить до утра
@stat ЕДА 60
@stat ВОДА 40
@scene hook
Хук: первая фраза с *акцентом*, **опасностью**, ~холодом~ и ==числом==.

# ГЛАВА 1 · Название главы

@danger 40 @стук
@item +1 ФОНАРИК @фонарик
Короткий абзац. Один–три предложения. Находишь *фонарик*. И слышишь **стук**.

> [[На полях — карандашом:]] «Записка».

Имя: «Реплика».
EOF
[ -f "$P/index.html" ] || cat > "$P/index.html" <<EOF
<!doctype html><html><head><meta charset="utf-8"><title>video</title>
<style>html,body{margin:0;background:#000;overflow:hidden}canvas{position:absolute;left:0;top:0;display:block;image-rendering:pixelated}</style>
</head><body><canvas id="stage" width="$W" height="$H"></canvas><canvas id="ov" width="$W" height="$H"></canvas>
<script type="module">
import { createOverlay } from './overlay/overlay.js';
const cues = await (await fetch('./cues.json')).json();
const film = await import('./js/film.js');                       // export async function init(canvas, cues) → { draw(t) }
const st = await film.init(document.getElementById('stage'), cues);
const ov = await createOverlay(document.getElementById('ov'), cues, { theme: cues.theme, base: './overlay/' });
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
