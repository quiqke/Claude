#!/bin/sh
# «7 правил выживания» — Halftone Dossier Shorts, 1080×1920 @ 30 fps, timed to the narration in vo-src/gemini.wav.
set -e
LIB=${LIB:-/root/lemo-opuscar}; export PATH=${FFMPEG_DIR:-/root/opt/bin}:$PATH
HERE=$(cd "$(dirname "$0")" && pwd); export LIB; PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ                   # word-synced cue map → events.json
"$PY" "$HERE/mix.py"                                      # score + foley + narration → mix.wav (≈ −14 LUFS)
node core/render/video.mjs "$HERE" --fps 30 --workers 3 $SZ --out "$HERE/out/video.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video.mp4" -i "$HERE/mix.wav" -map 0:v -map 1:a -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 26 -maxrate 8M -bufsize 16M \
  -af "volume=-0.2dB,alimiter=limit=0.76:attack=1:release=60:level=disabled" -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/zombie-rules.mp4"
"$PY" -c "import json;e=json.load(open('$HERE/events.json'))['ev'];json.dump([{'t0':x['t'],'t1':x['t1'],'text':x['text']} for x in e if x['type']=='sub'],open('$HERE/out/subs.json','w'),ensure_ascii=False)"
"$PY" core/render/srt.py "$HERE/out/subs.json" "$HERE/zombie-rules.srt"
node core/render/still.mjs "$HERE" 1.6 $SZ --prefix poster_ --out "$HERE/out/stills" && cp "$HERE/out/stills/poster_1.6.jpg" "$HERE/poster.jpg"
echo "built $HERE/zombie-rules.mp4"
