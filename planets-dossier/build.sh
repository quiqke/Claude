#!/bin/sh
# One command: rebuild «Сколько ты проживёшь» (Halftone Dossier test, 50 s, 1920x1080, 30 fps)
#   sh build.sh
# Needs the Lemo-Opuscar library (LIB), its core tier, and ffmpeg 7+ (FFMPEG=…; a local .venv with imageio-ffmpeg works).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/root/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
FF=${FFMPEG:-$("$HERE/.venv/bin/python" -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())" 2>/dev/null || echo ffmpeg)}
mkdir -p "$HERE/out"
cd "$LIB"
"$LIB/.venv/bin/python" "$HERE/music.py" "$HERE/out/music.wav"                   # score + SFX, seeded
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers 4 --out "$HERE/out/video.mp4"
# master: two-pass loudnorm to -14 LUFS / -1.5 dBTP, AAC 256k, then mux (no grain: the paper is drawn by the page)
J=$("$FF" -hide_banner -i "$HERE/out/music.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
"$FF" -y -v error -i "$HERE/out/video.mp4" -i "$HERE/out/music.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 256k -shortest -movflags +faststart "$HERE/planets-dossier.mp4"
node core/render/still.mjs "$HERE" 41.0 >/dev/null
"$FF" -y -v error -i "$HERE/stills/t_41.0.jpg" -q:v 2 "$HERE/poster.jpg"
"$FF" -hide_banner -i "$HERE/planets-dossier.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -A6 "Summary" | sed -n '1,8p'
echo "done: $HERE/planets-dossier.mp4"
