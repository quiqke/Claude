#!/bin/sh
# One command: rebuild the film. Needs the Lemo-Opuscar library (LIB), its core tier, ffmpeg 7+ (FFMPEG=…),
# and for re-timing a new voice take: sherpa-onnx + the Vosk model (video-factory/tools/fetch_asr.sh).
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-/root/lemo-opuscar}; export LIB
FF=${FFMPEG:-ffmpeg}; PY="$LIB/.venv/bin/python"; VF="$HERE/../.claude/skills/video-factory/tools"
[ -f "$HERE/voice/timing.json" ] || FFMPEG=$FF "$PY" "$VF/align.py" "$HERE" --speed 1 --max-pause 0.6           # voice/part1.wav → narration.wav + word times
"$PY" "$HERE/mix.py" "$HERE/out/mix.wav"
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 60 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
J=$("$FF" -hide_banner -i "$HERE/out/mix.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
"$FF" -y -v error -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -maxrate 9M -bufsize 18M \
  -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=192000,alimiter=limit=0.7:level=false,aresample=48000" \
  -c:a aac -b:a 256k -shortest -movflags +faststart "$HERE/jobs-stickman.mp4"
node core/render/still.mjs "$HERE" 20.5 --size 1080x1920 >/dev/null && "$FF" -y -v error -i "$HERE/stills/t_20.5.jpg" -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/jobs-stickman.mp4"
