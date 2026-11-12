---
name: video-factory
description: End-to-end factory for narrated YouTube videos (long-form 8–15 min or Shorts) for the channel «А что если?» (survival / rules-horror, Russian, second person). Use when the user says «пишем новый сценарий», «делаем видео», sends voice parts part1.wav… from Google AI Studio, or asks for subtitles with coloured word highlights, HUD (day / time / place / rule n/N), notes, dialogues, rule cards, background music. The user only chooses the style; everything else is automatic.
---

# Video factory — сценарий → озвучка → видео

The user writes or approves a script, voices it in **Google AI Studio** (Gemini TTS, voice **Algenib**, one voice, second person), uploads `part1.wav…`, and chooses a visual style. Everything else is this pipeline. Talk to the user in Russian, briefly, in plain words.

```
SK=.claude/skills/video-factory/tools   LIB=/root/lemo-opuscar   PY=$LIB/.venv/bin/python   FF=/root/opt/bin/ffmpeg
```

## 0. One-time setup (check, don't redo)
- Lemo-Opuscar at `$LIB` (`.claude/skills/lemo-opuscar`), node + Chromium (pre-installed).
- ffmpeg at `/root/opt/bin/ffmpeg`.
- Speech recognition for alignment: `sh $SK/fetch_asr.sh` (sherpa-onnx + Vosk zipformer-ru, Apache-2.0, from GitHub releases; HF / Silero / alphacephei hosts are blocked here).
- Music samples: `sh $LIB/tools/fetch.sh instruments vsco2ce` and `… vcsl` (orchestral + percussion).
- Fonts with Cyrillic are in `assets/fonts` (Press Start 2P, Rubik, Caveat, JetBrains Mono, Old Standard; OFL).

## 1. Script (сценарий) — markup
Write `<project>/script.md` (template: `sh $SK/init_project.sh <project> <style> <theme> 1920x1080`). Story rules for this channel: paradox hook in line 1, short sentences, «ты», numbers and times, a Chekhov's gun paid off late, rules as chapters, notes «на полях карандашом» as the previous keeper's mistakes, twist ending, question to viewers + «подпишись»-style CTA.

| Markup | Effect |
|---|---|
| front matter `title, format (1920x1080 \| 1080x1920), style, theme (pixel \| dossier \| woodcut \| clean), music (tension \| pixel \| adventure \| calm), voice, voice_style` | project settings |
| `# ПРАВИЛО 3 · Текст` | chapter card; ПРАВИЛО/ШАГ/ГЛАВА/СОВЕТ/ЧАСТЬ headings are counted n/N in the HUD |
| `! Правило третье. Текст.` | spoken rule title — shown as the card while it is spoken |
| `@day 7` `@time 02:15` `@place ДВЕРЬ` | HUD from the next block on (clock colon blinks) |
| `@alert ТЕКСТ` | blinking red banner on the next block |
| `@scene name` (any `@tag value`) | free tags for the style page (which set / action) |
| `@part` | start a new voice part here (to match takes already recorded) |
| `> текст` | note box (handwriting / RPG window), typed in as spoken |
| `Имя: «реплика»` | dialogue box with a name plate, typewriter + voice blips |
| `*акцент*` `**опасность**` `~холод/тишина~` `==число==` | caption colours (yellow / red / cyan / green in pixel theme) |
| `[[текст]]` | spoken but not shown (e.g. `[[На полях — карандашом:]]`) |

Then `$PY $SK/script2parts.py <project>` → `lines.json`, `voice/parts.json`, **`voice/AI-STUDIO.md`** (style prompt + parts of ≤ 380 words). Send the user that file: settings «Generate speech → Single-speaker, Algenib», one style for all parts, download WAV as `part1.wav…`.

## 2. Voice → timing
Put the uploads into `<project>/voice/part1.wav…` (any names the user gives → rename by number). Then:
```
$PY $SK/align.py <project>      # joins parts → voice/narration.wav; ASR word times; voice/align-report.txt
$PY $SK/cues.py <project>       # cues.json (karaoke pages, boxes, HUD, cards, alerts, per-line word times) + subtitles.srt
```
`align.py` lists **MISSING** blocks (AI Studio sometimes drops the start of a part): tell the user the exact text to re-voice and to send it as e.g. `part2b.wav` (natural order: part2 < part2b < part3), then re-run both commands — nothing else changes. CHECK = few words matched (listen there).

## 3. Picture — the style page
`index.html` (from init_project) stacks two canvases: the **style layer** `js/film.js` (`init(canvas, cues) → {draw(t), EV}`) and the **overlay** (`overlay/overlay.js`: captions with the current word lit, emphasis colours, HUD, rule cards with progress bar, note/dialogue boxes paginated to the voice, alerts). The style layer is the only per-film code:
- one scene function per `@scene` tag; segments = consecutive blocks with the same tag; act on words with `wt(seg, 'слово')` (exact recogniser times), never on guessed seconds;
- deterministic in t (frames render in parallel and out of order — no per-frame state);
- emit sound events into `EV` (`{t, type, d?, v?}`, types listed in `mix.py`).
Reference implementation: `lighthouse-pixel/` (16-bit Pixel RPG on `$LIB/styles/pixel-rpg/demo` engine: indexed 320×180 framebuffer, Bayer fog, sprite rig with added `hero`/`vera`, in-world Cyrillic via Press Start 2P, step counter, party join/leave windows, palette fades/mosaic/shake). For another style, read `$LIB/styles/<style>/STYLE.md` and its demo engine, keep the same contract.
Check: `node $LIB/core/render/still.mjs <project> <t…> --out <project>/out/stills` (full size; `--size` crops) + `sheet.py` contact sheet, one frame per scene, before the full render.

## 4. Sound
```
(cd $LIB && node core/render/events.mjs <project>)     # page EV → events.json
$PY $SK/music.py <project> [--mood tension|pixel|adventure|calm]   # score that follows the chapters: build per rule n/N, air + hit on each card, ending
$PY $SK/mix.py <project>                               # voice + ducked music (−8 dB under speech) + SFX + ambient bed → mix.wav ≈ −14 LUFS
```
If the user gives their own music, put it in `<project>/music/` (wav/mp3) — mix.py loops and ducks it instead of music.wav.

## 5. Render + encode
```
(cd $LIB && PATH=/root/opt/bin:$PATH node core/render/video.mjs <project> --fps 24 --workers 4 --out <project>/out/video.mp4)   # ~40 ms/frame/worker for pixel
sh $SK/encode.sh <project> <name>       # phone-safe H.264 BT.709 limited range, AAC 256k, faststart
```
Run the render in the background; send a contact sheet or short preview while waiting. Files over ~95 MB can't be pushed to GitHub — deliver them through the chat file card; commit the code, script, cues and srt.

## 6. Deliver
Send the mp4 (SendUserFile), `subtitles.srt` for YouTube, and a title / description / tags / chapters block (chapters = card times from cues.json, `MM:SS ПРАВИЛО n · …`). Commit and push the project on the working branch.

## Lessons (keep)
- Never ask the user to paste API keys into chat; voices come from AI Studio by hand.
- Phones refused full-range yuvj420p and > 10 Mbit files → always `encode.sh`.
- Without ASR, pause-based alignment drifts on long takes (`align_pauses.py` is only a fallback).
- Character proportion inside a block is not good enough for karaoke; word times come from the recogniser.
- The user dislikes stick figures and colourless pictures; wants colour, motion graphics, strong hook, synced to the voice.
