#!/usr/bin/env bash
# Rebuild «Что если бы Германия выиграла войну?»: map → frames → events → sound → final mp4 (−14 LUFS).
# needs: the Lemo-Opuscar library at $LIB (default /root/lemo-opuscar), node + Playwright Chromium, python3 with numpy/scipy/soundfile/imageio-ffmpeg
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; LIB="${LIB:-/root/lemo-opuscar}"
FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
[ -f "$HERE/geo.json" ] || python3 "$HERE/tools/map.py"
(cd "$LIB" && node core/render/readcheck.mjs "$HERE" --size 1080x1920 && node core/render/events.mjs "$HERE" --size 1080x1920 \
  && node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers 5)
python3 "$HERE/mix.py"
"$FF" -hide_banner -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" \
  -af "volume=6.8dB,alimiter=limit=0.71:level=false:attack=2:release=60,aresample=48000" \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/germany-won.mp4"
"$FF" -hide_banner -i "$HERE/germany-won.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|^\s+Peak:"
