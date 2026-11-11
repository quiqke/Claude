#!/bin/sh
# «Зерновая ловушка» — rebuild the film from this folder.
#   sh build.sh          picture + sound + master + subtitles + poster
#   sh build.sh --vo     also re-synthesise the narration (Piper, offline Russian voice)
set -e
LIB=${LIB:-/root/lemo-opuscar}                                # the Lemo-Opuscar library (setup.sh prints LIB=…)
PIPER_PY=${PIPER_PY:-/root/opt/piper-venv/bin/python}         # venv with piper-tts
export PIPER_MODEL=${PIPER_MODEL:-/root/opt/piper-dl/x/ru-irinia-medium.onnx}   # github.com/rhasspy/piper releases v0.0.2, voice-ru-irinia-medium
export PATH=${FFMPEG_DIR:-/root/opt/bin}:$PATH               # ffmpeg 7+ (mux.sh needs it; 6.x misreports loudnorm length)
HERE=$(cd "$(dirname "$0")" && pwd); export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"
[ -f "$HERE/fonts/hershey-cyr.json" ] || { echo "fonts/hershey-cyr.json missing: python tools/jhf2json.py <hershey-fonts>/cyrillic.jhf fonts/hershey-cyr.json"; exit 1; }
if [ "$1" = "--vo" ]; then "$PIPER_PY" "$HERE/tts_piper.py" "$HERE/lines.json" "$HERE/voice/"; fi
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ                      # strokes, wipes, magnets, cues, subtitles → events.json
"$PY" "$HERE/music.py"                                       # score → music/score.wav
"$PY" "$HERE/mix.py"                                         # foley + VO + score → mix.wav
node core/render/video.mjs "$HERE" --fps 24 --workers 3 $SZ --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/grain-trap.mp4" 24 1
"$PY" -c "import json;e=json.load(open('$HERE/events.json'))['ev'];json.dump([{'t0':x['t'],'t1':x['t1'],'text':x['text']} for x in e if x['type']=='sub'],open('$HERE/out/subs.json','w'),ensure_ascii=False)"
"$PY" core/render/srt.py "$HERE/out/subs.json" "$HERE/grain-trap.srt"
node core/render/still.mjs "$HERE" 145.6 --q 'nosubs=1&nopens=1' $SZ --prefix poster_ --out "$HERE/out/stills" && cp "$HERE/out/stills/poster_145.6.jpg" "$HERE/poster.jpg"
echo "built $HERE/grain-trap.mp4"
