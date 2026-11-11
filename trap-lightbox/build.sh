#!/bin/sh
# «Ловушка» (test) — Paper-cut Lightbox, vertical 1080×1920 @ 30 fps. Rebuild from this folder.
#   sh build.sh          picture + sound + master + subtitles + poster
#   sh build.sh --vo     also re-synthesise the narration (Piper, offline Russian voice)
set -e
LIB=${LIB:-/root/lemo-opuscar}
PIPER_PY=${PIPER_PY:-/root/opt/piper-venv/bin/python}
export PIPER_MODEL=${PIPER_MODEL:-/root/opt/piper-dl/x/ru-irinia-medium.onnx}
export PATH=${FFMPEG_DIR:-/root/opt/bin}:$PATH            # ffmpeg 7+
export LEMO_ANGLE=${LEMO_ANGLE:-swiftshader}              # no GPU here; with a GPU, unset it and use more workers
HERE=$(cd "$(dirname "$0")" && pwd); export LIB
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"
if [ "$1" = "--vo" ]; then "$PIPER_PY" "$HERE/../grain-trap/tts_piper.py" "$HERE/lines.json" "$HERE/voice/"; fi
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 2 --q 'ssaa=1.25' $SZ --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/trap-lightbox.mp4" 30 1
"$PY" -c "import json;e=json.load(open('$HERE/events.json'))['ev'];json.dump([{'t0':x['t'],'t1':x['t1'],'text':x['text']} for x in e if x['type']=='sub'],open('$HERE/out/subs.json','w'),ensure_ascii=False)"
"$PY" core/render/srt.py "$HERE/out/subs.json" "$HERE/trap-lightbox.srt"
node core/render/still.mjs "$HERE" 3.6 --q 'nosub=1' $SZ --prefix poster_ --out "$HERE/out/stills" && cp "$HERE/out/stills/poster_3.6.jpg" "$HERE/poster.jpg"
echo "built $HERE/trap-lightbox.mp4"
