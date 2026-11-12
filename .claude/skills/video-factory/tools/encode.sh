#!/bin/sh
# Final phone-safe encode: rendered video + mix.wav → <name>.mp4 (H.264 High 4.1, BT.709 limited range, AAC 256k, faststart).
# usage: sh encode.sh <project_dir> [name] [crf]
# Why: full-range yuvj420p and very high bitrates made earlier films fail to open on phones; this matches what YouTube and
# phone players expect. Subtitles: <project>/subtitles.srt can be uploaded to YouTube separately.
set -e
P=${1:?project}; NAME=${2:-$(basename "$P")}; CRF=${3:-22}
FF=${FFMPEG:-$(command -v /root/opt/bin/ffmpeg || command -v ffmpeg)}
"$FF" -hide_banner -loglevel error -y -i "$P/out/video.mp4" -i "$P/mix.wav" -map 0:v -map 1:a \
  -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -profile:v high -level 4.1 -preset slow -crf "$CRF" -tune animation -maxrate 8M -bufsize 16M -g 48 \
  -af "volume=-0.2dB,alimiter=limit=0.76:attack=1:release=60:level=disabled" -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$P/$NAME.mp4"
ls -la "$P/$NAME.mp4"
