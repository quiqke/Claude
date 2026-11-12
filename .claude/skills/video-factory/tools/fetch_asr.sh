#!/bin/sh
# Offline Russian speech recognition for align.py: sherpa-onnx + Vosk zipformer-ru (Apache-2.0), from GitHub releases.
set -e
LIB=${LIB:-/root/lemo-opuscar}; DIR=${ASR_DIR:-/root/opt/asr}; M=sherpa-onnx-zipformer-ru-2024-09-18
uv pip install --python "$LIB/.venv/bin/python" sherpa-onnx soxr >/dev/null
mkdir -p "$DIR"; cd "$DIR"
[ -f "$M/tokens.txt" ] || { curl -sSL -O "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/$M.tar.bz2" && tar xjf "$M.tar.bz2" && rm "$M.tar.bz2"; }
echo "ASR ready: $DIR/$M"
