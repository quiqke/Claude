#!/bin/sh
# «11 правил маяка» — test, Woodcut Print 1920×1080 @ 24 fps.
set -e
LIB=${LIB:-/root/lemo-opuscar}; export PATH=${FFMPEG_DIR:-/root/opt/bin}:$PATH; HERE=$(cd "$(dirname "$0")" && pwd); export LIB
cd "$LIB"; node core/render/events.mjs "$HERE"; "$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video.mp4" -i "$HERE/mix.wav" -map 0:v -map 1:a -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 24 -tune grain -maxrate 10M -bufsize 20M -af "volume=-0.2dB,alimiter=limit=0.76:attack=1:release=60:level=disabled" -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/lighthouse-test.mp4"
echo "built $HERE/lighthouse-test.mp4"
