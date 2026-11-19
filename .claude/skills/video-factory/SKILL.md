---
name: video-factory
description: End-to-end factory for narrated YouTube videos (long-form 8–15 min or Shorts) for the channel «А что если?» (survival / rules-horror, Russian, second person). Use when the user says «пишем новый сценарий», «делаем видео», sends voice parts part1.wav… from Google AI Studio, or asks for subtitles with coloured word highlights, HUD (day / time / place / rule n/N), notes, dialogues, rule cards, background music, or MrBeast-style titles/thumbnails and a first 20 seconds that match them. The user only chooses the style; everything else is automatic.
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
- Music samples: `sh $LIB/tools/fetch.sh instruments vsco2ce`, `… vcsl` (orchestral + percussion); for mood spy also `… freepats` (drum kit, electric guitar) and `… karoryfer` (jazz bass).
- Fonts with Cyrillic are in `assets/fonts` (Press Start 2P, Rubik, Caveat, JetBrains Mono, Old Standard; OFL).

## 0.5 Система MrBeast: название → превью → первые 20 секунд (user rule, Nov 2026)
The click is a promise; the first seconds must keep it **literally**. Order of work for every video:
1. **Concept = title + thumbnail first, script second.** Propose topics as: title (≤ 55 chars, one idea, a number or an extreme: «7 дней на необитаемом острове», «40 км до берега»), the thumbnail picture (one moment, one face, 2 plates) and the first spoken line. The user picks from these.
2. **Title ↔ voice.** The first sentence says the title in the voice's words (same key words, «ты» form): title «7 дней на необитаемом острове» → voice «Семь дней. Необитаемый остров. …» in the first 3 s, HUD «ДЕНЬ 1/7» on screen from frame 0. Title «Меня столкнули с круизного лайнера» → «Тебя столкнули с круизного лайнера. Ночью, в открытом море.» Avoid title words that the opening never says.
3. **Thumbnail ↔ frame 0.** The thumbnail is a real frame: the video opens on exactly that picture (same set, angle, face, colours, ring/arrow) with the same plates on screen; the plates fly off by ~1 s while the title is spoken, the picture comes alive and stays to the 5–10 s mark. All 3 «Тест и сравнение» variants show **the same opening moment** (they differ only in text, expression, zoom, colour), so whichever wins, the first seconds match it. Never use a later moment of the film as a test thumbnail.
4. **First 20 s blueprint:** 0–3 s the title promise over the thumbnail picture → 3–10 s the stakes in numbers, every noun shown (40 км, +14°, 6 часов, «плаваешь ты плохо») → 10–20 s the open loops and the goal («Кто это? И как продержаться до утра?») → only then «Вернёмся на N назад» or the first chapter. No greeting, no channel name, no «в этом видео», no «подпишись», no chapter card before 18 s.
5. **After 20 s:** progression you can feel (time/day counters, the stakes bar dropping), a re-engagement beat every 60–90 s (new problem, twist, poll, СТОП), the payoff at the end, then ≤ 20 s to the end screen.
6. **Gate:** `$PY $SK/hookcheck.py <proj>` reads `yt_title:` (or `title:`) and `thumb:` («ПЛАШКА 1 / ПЛАШКА 2») from the front matter: title words in the first 8 s, plate words in the first 10 s, `@thumb A` on the first block, first chapter ≥ 18 s, no intro words. Run it right after writing the script (it estimates timing) and again after `align.py`; fix the opening until it passes.
7. **Code:** `js/thumb.js` exports `use(g)`, `SCENE[v](t)` (picture only) and `plates(v, k)` (k = 1 as on the thumbnail → 0 flown off); `?thumb=A` renders `SCENE.A(1) + plates('A', 1) + grade()`. In `film.js` the first shot of the `@thumb A` block calls the same `SCENE.A(t)` and `plates('A', 1 - (t - .3) / .8)` — one drawing for the thumbnail and frame 0, so they can never drift apart (reference: `liner-toon/js/thumb.js`).

## 1. Script (сценарий) — markup
Write `<project>/script.md` (template: `sh $SK/init_project.sh <project> <style> <theme> 1920x1080`). Story rules for this channel: paradox hook in line 1, short sentences, «ты», numbers and times, a Chekhov's gun paid off late, rules as chapters, notes «на полях карандашом» as the previous keeper's mistakes, twist ending, question to viewers + «подпишись»-style CTA.

**Structure the user asked for (all new videos):**
- Chapters are `# ГЛАВА N · Название` (or ПРАВИЛО N for rule lists). **Everything written on screen is voiced**: a heading with no `!` line after it gets «Глава первая. Название.» added to the voice text automatically; the card appears exactly while it is spoken. Never put on-screen chapter text that the voice doesn't say.
- **Pace: brisk, nothing drawn out.** Short paragraphs (1–3 sentences), cut filler; the AI Studio prompt asks for a lively pace with short pauses; `align.py` additionally speeds the take up ×1.12 (pitch kept) and shortens every pause to ≤ 0.45 s.
- **HUD: minimal by default now (user, Nov 2026: «оставь худы, но убери лишние плашки»).** Front matter `hud: minimal` → the overlay draws only the rule chip `ПРАВИЛО n/N`, the clock, **at most 2 survival bars that matter to the plot** (e.g. ТЕПЛО + БЕНЗИН, ВОЗДУХ, ЕДА) and the fear pulse (heartbeat + red screen edges, no СТРАХ plate). In such scripts don't write `@place`, `@day`, `@objective`, `@counter`, `@item`, `@toast` — they are hidden anyway. Fire bars/danger on the exact word with a trailing `@слово`. (`hud: full` = the old game HUD with goals, counters, pick-up cards, toasts.)
- **Describe every action, show every action (user rule).** Write each physical action as its own short sentence, verb first, concrete objects: «Ты поворачиваешь ключ. Мотор кашляет и заводится. Стрелка бензина — чуть больше половины.» In `film.js` every such verb gets its own shot keyed to that word (key turning, gauge needle, window cracking open, breath freezing on glass, scarf tied to the antenna…). Before building the picture, list the script's verbs and nouns and tick each one off in the shot lists.

**«Сценарий-бомба» checklist (survival thriller; reference `liner-toon/`, «Меня столкнули с круизного лайнера»)** — every big script should tick all of these:
1. Hook in medias res on the thumbnail picture: the title said in the first sentence («Тебя столкнули с круизного лайнера»), the stakes in numbers, the open question (who? will you survive?), then «Вернёмся на N часов назад» — §0.5.
2. Ticking clock from a REAL rule that also gives the chapters (cold water «1-10-1» → `# МИНУТА 1 · …`, `# МИНУТА 10 · …`, `# ЧАС 1 · …`; use a `!` line for the spoken title, e.g. `! Первая минута. Холодовой шок.`).
3. Two mysteries at once: survival + a human one (who did it / who wrote it). One real suspect, one red herring with a matching false clue.
4. Fair-play clues planted in the setup (smell of cedar, a bracelet that clinks, the walk he insisted on) and a physical proof for the climax (scratches from your nails under his watch).
5. Chekhov's gun with emotion (father the lifeguard and his rule «паника убивает раньше холода») — it saves you in act 1 and closes the story (the call to dad).
6. Midpoint twist (the delayed message: he re-registered your life insurance), «all is lost» (the boat passes by, you stop shivering), then the comeback (SOS with the phone flashlight at 1 %).
7. Climax face to face, a callback line («Ты же плаваешь как топор» → «Как топор. Но меня учили не паниковать»), then a warm resolution.
8. Real, shareable survival facts in every chapter; mid-video «кто, по-твоему…? напиши в комментариях»; end question + «подпишись».

**Survival-thriller picture kit (reference `liner-toon/js/world.js` + `film.js`)**:
- **Live ticking clock** under the HUD: «В ВОДЕ h:mm:ss» counts story time between two spoken words (`WATER = {t0: wsc('push','соскальзывают'), t1: wsc('h6_rescue','вытаскивают')}`), interpolated from the `@time` marks so it jumps forward across chapters; turns red past the danger limit and green «СПАСЁН» after the rescue. Use it whenever the story has a clock (air, cold, fuel, battery).
- Sets: `liner()` (night/day, wake), `inWater()` (POV from the water: liner/boat on the horizon, head bobbing), `stern()` (rail, foam, hero leaning, pusher silhouette, smell lines), `pushHands()`, `wristScratch()` (bracelet slid off → three red scratches = the proof), `chatPhone()` (pouch, bars, battery, chat bubbles, «не доставлено», SOS flashlight), `jeansFloat()` / `floatTop()` (step-by-step jeans float), `helpPose()`, `stars()` (Big Dipper → Polaris), `jelly()`, `clueBoard()` (the clues as cards behind the comment poll), `restaurant()`, `rescueDeck()`, `port()`, `cupFall()`, `phoneCall()` (split screen with dad).
- The hook's first shot is the place of the crime (stern with the hero at the rail), not a wide establishing shot; then the push, the fall, the face in the water.
- Comment poll with the two suspects («КТО ТЕБЯ ТОЛКНУЛ? АРТЁМ / КРАСНАЯ РУБАШКА») over the clue board; СТОП freeze on the villain's face at the moment he sees you; end poll on the survival fact («А ТЫ ЗНАЛ ПРО ДЖИНСЫ?»).
- Thumbnails: A = the crime + the question (liner at night, the figure at the rail circled red, your face in the water, «МЕНЯ СТОЛКНУЛИ / КТО?»); B = the survival trick (inflated knotted jeans around the neck + arrow, «40 КМ ДО БЕРЕГА / ТОЛЬКО ДЖИНСЫ»); C = the payoff on the villain's face (shocked friend, falling cup, «ОН ДУМАЛ, / Я УТОНУЛ»).

**Format «7 дней выживания» (user, Nov 2026; reference `island-toon/`, «7 дней на необитаемом острове»)** — not rules but a day-by-day survival story:
- Chapters `# ДЕНЬ N · Название` (ДЕНЬ is counted → HUD chip «ДЕНЬ n/7», voiced «День первый. Песок.»). Hook in medias res on day 7 at the decisive moment + the open loop (the diary's last entry), then «Вернёмся на семь дней назад»; a short prologue (how you got there) before ДЕНЬ 1.
- Each day = one survival problem solved with concrete actions and a real fact (water: never sea water, dew on plastic, green coconuts; fire: a water bottle as a lens; signal: SOS in stones, green leaves for white smoke, three fires in a triangle; shelter, storm → high ground) + one step of the mystery.
- A personal Chekhov's gun planted in the prologue (father lost at sea when you were five, never learned to swim) pays off in the finale (the diary's author, the engraved watch, the photo) — emotional twist, not just a scare.
- Found texts (diary entries, notes) are `> «…»` note boxes; set the note header in `index.html` (`noteHead: 'ДНЕВНИК'`, or `''` for none).
- Same CTAs: mid-video «Как думаешь, кто написал…? Напиши в комментариях», end question + «подпишись».

**Format the user asked for: «10 правил выживания при страшном событии, одно правило скрыто»** (reference `snowroad-toon/`, «10 правил, если тебя замело на ночной трассе»):
- 10 chapters `# ПРАВИЛО N · …`; the hidden one is `# ПРАВИЛО 7 · ████████` followed by a spoken override `! Правило седьмое. Стёрто.` (the card shows the black bar, the voice says «стёрто»). Everywhere the rule list appears on screen, rule 7 is a black/scratched bar.
- The hidden rule is the real twist: clues to it through the video (a word half-readable under the scratches, a symptom, a sound), and it is revealed only in the finale (letters appear one by one — e.g. frost filling the scratches). Mix real survival facts (shareable, «может спасти жизнь») with horror; the hidden rule is the real life-saving fact.
- Hook in medias res: open at the scariest moment of the night (03:40, the knock), name the hidden rule as the open loop («от него зависит, доживёшь ли ты до утра»), then «Вернёмся на шесть часов назад».
- **CTAs (user rule): mid-video** at the hidden rule — «Как думаешь, что написано в седьмом правиле? Напиши в комментариях, в конце узнаешь, угадал ли ты»; **end** — a question («А ты бы опустил окно?») + «напиши в комментариях» + «подпишись». Also add the animated subscribe button at ~35 % and the comment poll on screen.

| Markup | Effect |
|---|---|
| front matter `title, format (1920x1080 \| 1080x1920), style, theme (pixel \| dossier \| woodcut \| clean \| spy), hud (minimal \| full), music (tension \| pixel \| adventure \| calm \| spy), voice, voice_style` | project settings |
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
| `@stat ВОДА 30` · `@stat ВОДА off` | survival bar 0–100 (several stack, top-left); change animates with ±delta and a blip |
| `@objective Найти воду` | «ЦЕЛЬ: …» line, slides in with a chime |
| `@item +1 ФИЛЬТР` | pick-up card slides in from the right with a jingle |
| `@counter УДАРЫ 3` · `@counter off` | big counter under the goal |
| `@danger 80` | fear meter with a heart; heartbeat sound speeds up; red pulse at the screen edges above 55 |
| `@toast Сохранено` | small notification, top centre |
| `… @слово` at the end of any of these | fire on that spoken word instead of the block start |

Then `$PY $SK/script2parts.py <project>` → `lines.json`, `voice/parts.json`, **`voice/AI-STUDIO.md`** (style prompt + parts of ≤ 380 words). Send the user that file: settings «Generate speech → Single-speaker, Algenib», one style for all parts, download WAV as `part1.wav…`.

## 2. Voice → timing
Put the uploads into `<project>/voice/part1.wav…` (any names the user gives → rename by number). Then:
```
$PY $SK/align.py <project>      # tighten (×1.12, pauses ≤ 0.45 s) + join → voice/narration.wav; ASR word times; voice/align-report.txt
                                # --speed 1 --max-pause 0 keeps the take untouched
$PY $SK/cues.py <project>       # cues.json (karaoke pages, boxes, HUD, cards, alerts, per-line word times) + subtitles.srt
```
`align.py` lists **MISSING** blocks (AI Studio sometimes drops the start of a part): tell the user the exact text to re-voice and to send it as e.g. `part2b.wav` (natural order: part2 < part2b < part3), then re-run both commands — nothing else changes. CHECK = few words matched (listen there).

## 3. Picture — the style page
`index.html` (from init_project) stacks two canvases: the **style layer** `js/film.js` (`init(canvas, cues) → {draw(t), EV}`) and the **overlay** (`overlay/overlay.js`: captions with the current word lit, emphasis colours, HUD, rule cards with progress bar, note/dialogue boxes paginated to the voice, alerts). The style layer is the only per-film code:
- one scene function per `@scene` tag; segments = consecutive blocks with the same tag; act on words with `wt(seg, 'слово')` (exact recogniser times), never on guessed seconds;
- deterministic in t (frames render in parallel and out of order — no per-frame state);
- emit sound events into `EV` (`{t, type, d?, v?}`, types listed in `mix.py`).
**Default style the user likes: «Мультфильм»** — `lighthouse-toon/js/toon.js` (thick boiling outline, flat colour, hard shadows, camera with constant line weight, expressive faces with `scream`, people with walk/kneel/sit/lying, soft light pools) + `world.js` sets (exterior, room, lantern room, stairs, courtyard, close-ups) + `film.js` scene list. Copy `toon.js` into a new project and write new sets/scenes the same way. Previous pixel version (rejected as a style, kept as code reference): `lighthouse-pixel/` (16-bit Pixel RPG on `$LIB/styles/pixel-rpg/demo` engine: indexed 320×180 framebuffer, Bayer fog, sprite rig with added `hero`/`vera`, in-world Cyrillic via Press Start 2P, step counter, party join/leave windows, palette fades/mosaic/shake). For another style, read `$LIB/styles/<style>/STYLE.md` and its demo engine, keep the same contract.
Check: `node $LIB/core/render/still.mjs <project> <t…> --out <project>/out/stills` (full size; `--size` crops) + `sheet.py` contact sheet, one frame per scene, before the full render.

**Style «Шпионские титры 60-х» (Shorts, 1080×1920)** — `init_project.sh <proj> spy-titles spy 1080x1920` copies `assets/spy/spy.js`; reference film `epochs-spy/` («Сколько ты проживёшь в каждой эпохе», 54 s).
- Look: cut paper in 4 flat inks per location (new ground colour every era), static scissor edges (`piece`, `cut`), paper shadow + cut gap, multiply paper grain (`paper(.45)`), puppets animated on twos (`tw(t)`). Type is the set: huge Oswald letters land letter-by-letter (`type(..., {land})`), columns spell «РИМ», chimneys «ЛОНДОН», sails «МАГЕЛЛАН». Merged-silhouette stickman `hero(x, feetY, scale, pose)` — poses stand, shiver, panic, run0/1, gesture, shrug, carry, cough, scratch, sit, wave, mask — red scarf accent, mustard bracelet.
- Editing: hard cuts on words with `pick(seg, t, [[word, fn]])`, min spacing **0.4 s** for Shorts (1.2 s skipped half the shots). One literal shot per named thing («блоха» → giant flea, «мышьяк» → green wallpaper, «морфий» → syrup bottle). Hook: the death moment first, freeze with «СТОП» on the danger word, the threat starts moving on the word before. Teleport between eras = `shatter()` strips (0.3 s) + `whoosh` + `paper` sfx.
- Payoff stamps: one global layer drawn after the shatter (`STAMPS` → `drawStamp`): cream slab «ВЫЖИЛ: 3 ДНЯ · ЛЕДНИК», lands on the number word, leaves upward 0.35 s into the next era — never put the payoff inside a scene (it got cut by the next shot).
- Layout for Shorts: HUD rows end ≈ y 230, scene titles at y 420–480, payoff stamp ≈ y 1150, captions at H·0.80 (theme spy: cream paper strip, Oswald 74), nothing important below y 1650 (Shorts UI).
- Sound: `music.py --mood spy` (needs events.json; swung ride, walking jazz bass, twang guitar riff, vibes, muted trumpet; brass stab on every EV `stab`, bigger + crash on `stamp`; warm coda from the line tagged `armor|finale|outro`). Mix with `--music-db -6 --bed none`. Keep danger ≥ 40 only on real peaks — the heartbeat bed runs while it stays high.
- Render vertical with `--size 1080x1920` for both still.mjs and video.mjs (default is 1920×1080 and crops).

**Thriller kit (reference `bunker-toon/`, «30 дней в бункере»)** — a mystery with fair-play clues told in rules:
- Script: open in the middle of the scariest moment (day 3), then «Вернёмся на три дня назад» (calendar rewind shot); one clue per rule chapter that the finale explains one by one; an open question mid-video («А ты бы ответил?» poll) answered on the end screen (poll with ✓).
- Sets in `bunker-toon/js/world.js`: `room()` (one wide set; close-ups are camera framings of it), **`crossSection()`** (above ground / soil / bunker in one frame — shows who is up there without leaving the hero), **`cameraPOV()`** (green CCTV look, REC, timestamp — «он смотрит на тебя»), **`triptych()`** (the same view on ДЕНЬ 9/10/11 — a repetition clue), `periView()` (static painted world: nothing ever moves), `waveTriptych()` (identical recordings), `rulesClose()` (typed rule sheet; red marker circle/cross on rule n), `newsClose()`, `polaroid()`, `wristGrab()` (the villain's knitted sleeve = early clue), `hand()`.
- Rule cards: the rule sheet slides up over the last shot, the rule is circled in red, «ДЕНЬ N · ЧЧ:ММ» typed in; the finale card crosses all rules out.
- Overlay: `noteHead: ''` hides «НА ПОЛЯХ» for notes that are not margin notes; `@objective off` hides the goal.
- Foley from words (`film.js` init): knocks, ticks bursts for the Geiger counter, static under every «Радио:» line, bolt/door/thud, dog `bark` (mix.py). Music `tension` needs `sh $LIB/tools/fetch.sh instruments salamander` (piano).

### Retention editing (every video)
- **Shots follow the script, ~every 4–7 s.** Each scene has a shot list `[word, draw]` (`pick()` in `planet-toon/js/film.js`): every new shot shows something *different* that the voice is talking about — the flower's eye, boots in the mud, the second sun, the wrist screen, the face — never just a zoom of the same picture. Shots change on story words, never faster than 2 s.
- **Steady, clean picture (user feedback):** no line boil animation, no camera drift / slow push-ins / whips; motion only where the story moves (a reveal pull-back, a shake on a scare). Every text (kinetic words, labels, polls, screens) is measured and kept inside its frame.
- `tools/retention.js` (`makeCuts` / `shotFraming`) is the older automatic reframing — use it only as a filler for long stretches with no story beats.
- **Show literally what the voice says (user rule).** Legs/boots → show the boots (in mud, on a twig); hands → gloves (shaking, on a trunk, on a helmet, reaching a hatch); a scratched inscription → **animate it being carved** letter by letter with the knife, sparks and shavings (`carve()`), never a finished text popping in; a screen/alarm → the wrist screen typing its message; a smell/taste/sound → the object close (red lake, cup of coffee, mouths in the wall). Go through the script noun by noun and verb by verb and give each beat its insert.
- **No flashing inserts at transitions** (user found them too fast): no flash-forward glimpses, no white cut flashes; a shot lives at least 2 s; transitions only at chapter cards (portal/iris).
- **Inserts kit**: `assets/toon/inserts.js` (`glove`, `boot`, `carve`, `capsuleInterior`, `cup`, `tentacleBoot`, `shakingHands`, `handOnHelmet`, `handToHatch`) + `assets/toon/toon.js` (static hand-drawn line, camera, faces with `scream`, people incl. lying/kneeling). Copy both into a new toon project's `js/` and add new inserts the same way for new nouns.
- **Kinetic words**: every red `**опасность**` word pops huge behind the captions for 0.7 s (`bigWords` + `drawBigWord`) with a low hit.
- **Flash-forward in the hook**: 3 glimpses (0.35 s each, glitch + hit) of the strongest later images during the first 8 s.
- Punch-in zoom + shake on `@danger ≥ 70`, white flash on hard cuts, portal/iris on chapter cards.
- Never stack two big overlays: suppress the kinetic red word while the СТОП freeze is on (a danger word right after the freeze collided with «СТОП» in island-toon), and never draw a big prop caption («ТОЛЧОК!») in a shot keyed to a red `**word**` — the kinetic word already says it.
- More ideas to use when the story allows: on-screen choice/poll before a twist («А ты бы открыл? ДА / НЕТ»), freeze-frame + «СТОП» + question, live countdown timer, mid-video «подпишись» pop at ~35 %, silence before a scare.

## 4. Sound
```
(cd $LIB && node core/render/events.mjs <project>)     # page EV → events.json
$PY $SK/music.py <project> [--mood tension|pixel|adventure|calm]   # score that follows the chapters: build per rule n/N, air + hit on each card, ending
$PY $SK/mix.py <project>                               # voice + ducked music (−8 dB under speech) + SFX + ambient bed → mix.wav ≈ −14 LUFS
# automatic sounds: whoosh on scene cuts, low hit on **опасность** words, card riser+hit, alert beeps, dialogue blips,
# pencil under notes, bar up/down blips, pick-up jingle, goal chime, toast pop, counter tick, heartbeat bed from @danger
```
If the user gives their own music, put it in `<project>/music/` (wav/mp3) — mix.py loops and ducks it instead of music.wav.

## 5. Render + encode
```
(cd $LIB && PATH=/root/opt/bin:$PATH node core/render/video.mjs <project> --fps 24 --workers 4 --out <project>/out/video.mp4)   # ~40 ms/frame/worker for pixel
sh $SK/encode.sh <project> <name>       # phone-safe H.264 BT.709 limited range, AAC 256k, faststart
```
Run the render in the background; send a contact sheet or short preview while waiting. Files over ~95 MB can't be pushed to GitHub — deliver them through the chat file card; commit the code, script, cues and srt.

## 6. Deliver
Send the mp4 (SendUserFile), `subtitles.srt` for YouTube, and `YOUTUBE.md`: 3 titles (each one said by the voice in the first 8 s — §0.5), description (hook in the first 2 lines, teaser, question, CTA, chapters `00:00 …` from cues card times, 3–6 hashtags) and tags ≤ 500 chars. Make **3 thumbnails** for YouTube «Тест и сравнение», all three of **the opening moment** that frame 0 shows (§0.5) (`?thumb=A|B|C` page in `js/thumb.js`: huge scared face with `scream`, red arrow/ring on the threat, vignette; export ≤ 2 MB).
Thumbnail text = **highlighted plates** (user's preferred look, `planet-toon/js/thumb.js` variants E/F, `plate()`): line 1 black Rubik 900 on a yellow `#ffd400` plate, line 2 the payoff (number / twist) huge white with black stroke on a red `#ff2a2a` plate; both with thick black border + hard offset shadow, rotated −2°, max 4–5 words, left 60 % of the frame; face on the right looking at the text. Background drawn then blurred (`dof()`), dark gradient behind the text (`sideShade`), sharp foreground props that prove the hook (numbered capsules #41, #40…), final `grade()` (saturate/contrast). Check at 320×180 — every word must still read. Text complements the title, never repeats it word for word, and its words are spoken in the first 10 s (`hookcheck.py`). Commit and push the project on the working branch.

## Lessons (keep)
- Never ask the user to paste API keys into chat; voices come from AI Studio by hand.
- Phones refused full-range yuvj420p and > 10 Mbit files → always `encode.sh`.
- Without ASR, pause-based alignment drifts on long takes (`align_pauses.py` is only a fallback).
- Character proportion inside a block is not good enough for karaoke; word times come from the recogniser.
- The user dislikes stick figures and colourless pictures; wants colour, motion graphics, strong hook, synced to the voice.
