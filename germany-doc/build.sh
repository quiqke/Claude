#!/usr/bin/env bash
# Rebuild the documentary: voice timing → events → frames → sound → final mp4 (−14 LUFS).
# needs: Lemo-Opuscar at $LIB (default /root/lemo-opuscar), node + Playwright Chromium, python3 with numpy/scipy/soundfile/sherpa-onnx/soxr/imageio-ffmpeg
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; LIB="${LIB:-/root/lemo-opuscar}"; VF="${VF:-$HERE/../.claude/skills/video-factory/tools}"
FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
[ -f "$HERE/geo.json" ] || python3 "$HERE/tools/map.py"
python3 "$VF/align.py" "$HERE" --speed 1 --max-pause 0 --gap .7
(cd "$LIB" && node core/render/events.mjs "$HERE" --size 1920x1080 && node core/render/video.mjs "$HERE" --size 1920x1080 --fps 24 --workers 6)
python3 "$HERE/mix.py"
I=$("$FF" -hide_banner -i "$HERE/out/mix.wav" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14-($I)+0.4,1))")
"$FF" -hide_banner -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -af "volume=${G}dB,alimiter=limit=0.71:level=false:attack=2:release=60,aresample=48000" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/germany-doc.mp4"
"$FF" -hide_banner -i "$HERE/germany-doc.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|^\s+Peak:"
