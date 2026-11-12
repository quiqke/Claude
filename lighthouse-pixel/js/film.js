// film.js — the shot list for «11 правил маяка»: one scene per script block (tags.scene), actions keyed to spoken words.
import { W, H, FB, C, LUT, makeOut, mosaic, darken, whiten, clamp, ss, eo, bayer } from './engine/px.js';
import * as S from './world.js';

const fb = new FB();
let out, CU, SEG = [], EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });

export async function init(cv, cues) {
  CU = cues; out = makeOut(cv);
  try { const f = new FontFace('PressStart', 'url(./overlay/fonts/PressStart2P.ttf)'); await f.load(); document.fonts.add(f); } catch (e) {}
  // segments: consecutive voiced blocks with the same scene
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  const chapN = {}; cues.cards.forEach(c => { chapN[c.t] = c.n; });
  let prev = 'hook';
  for (const l of L) {
    const sc = l.kind === 'title' ? 'title' : (l.tags.scene || (l.kind === 'note' ? 'note' : prev)); prev = sc;
    const last = SEG[SEG.length - 1];
    if (last && last.scene === sc && sc !== 'note' && sc !== 'title') last.lines.push(l);
    else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .25 });
  }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .2; s.i = i; });
  SEG[0].t0 = 0;
  // the chapter number for title segments
  for (const s of SEG) if (s.scene === 'title') { const c = cues.cards.find(c => Math.abs(c.t - (s.lines[0].t0 - .3)) < .5); s.n = c ? c.n : null; }
  buildEvents();
  return { draw, EV };
}
// ── word timing helpers
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0, from = 0) {          // absolute time of the nth word in this segment starting with pat
  let k = 0; const p = norm(pat);
  for (const l of seg.lines) for (const w of l.words) if (w.t0 >= from && norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; }
  return null;
}
function wall(seg, pat) { const p = norm(pat), r = []; for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) r.push(w); return r; }
const after = (t, a, d = .4) => a == null ? 0 : clamp((t - a) / d, 0, 1);
const speaking = (seg, t) => { for (const l of seg.lines) for (const w of l.words) if (t >= w.t0 && t < w.t1) return 1; return 0; };
const mouth = (seg, t) => speaking(seg, t) * (Math.floor(t * 10) % 2 ? 1 : .3);
// counter keyed to words: keys [[pattern, nth, value]] → value at time t (linear between keys over .35 s)
function keyed(seg, t, keys, v0) { let v = v0; for (const [p, n, val] of keys) { const a = wt(seg, p, n); if (a != null && t >= a) v = val; } return v; }
// piecewise-linear through (t0, v0) and each spoken key (deterministic: no per-frame state, frames render in any order)
function interp(seg, t, keys, v0, t0, ease = .5) {
  const pts = [[t0, v0]]; for (const [p, n, val] of keys) { const a = wt(seg, p, n); if (a != null) pts.push([a, val]); }
  pts.sort((a, b) => a[0] - b[0]); if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) { const [ta, va] = pts[i - 1], [tb, vb] = pts[i]; return va + (vb - va) * clamp((t - ta) / Math.max(.05, Math.min(tb - ta, ease === null ? 1e9 : tb - ta)), 0, 1); }
  return pts[pts.length - 1][1];
}

// ── scenes: (t, seg, u = t - seg.t0) → { lut?, post? }
const SC = {
  hook(t, s) {
    const on = wt(s, 'сорок'), off = wt(s, 'и'), never = wt(s, 'никогда');
    const lamp = on != null && t >= on && t < (off ?? on + 3) ? 1 : 0;
    S.ext(fb, t, { mode: 'night', camY: Math.round(70 * (1 - eo(clamp((t - s.t0) / 7, 0, 1)))), lamp, lit: lamp, fogTop: 150, fogDens: .7, beam: lamp ? .8 : 0 });
    return { lut: never != null && t > never ? darken(LUT.full, .25) : LUT.full };
  },
  fogsea(t, s) { const g = wt(s, 'исчезло') ?? s.t1; S.ext(fb, t, { mode: 'night', fogTop: 180 - 90 * ss(s.t0, g, t), fogDens: 1 }); },
  arrive(t, s) {
    const door = wt(s, 'засов') ?? s.t1 - 1, k = clamp((t - s.t0) / (door - s.t0), 0, 1), x = 128 + k * 82;
    const gy = x < 160 ? 128 + Math.round((160 - x) * .9) : 128 + Math.round(6 * Math.sin(x * .05) + 3 * Math.sin(x * .17) - (x - 120) * .04);
    S.ext(fb, t, { mode: 'dusk', windows: [0, 0, 0], hero: k < 1 ? { x, y: Math.min(gy, 132), pose: 'walk' } : null, fogTop: 150, fogDens: .6, camY: 0 });
    if (t > door) S.glow(fb, S.TOWER.x, S.TOWER.base - 30, 14, .8);
  },
  room(t, s) {
    const cam = Math.round(80 * ss(s.t0, s.t1, t));
    S.room(fb, t, { cam, clockTime: 18.07, outside: 'fog', chars: [{ who: 'hero', pose: 'idle', x: 210 }] });
    for (const [w, x, y] of [['койка', 40, 120], ['печка', 112, 115], ['часы', 170, 46], ['консерв', 290, 128], ['соли', 335, 126]]) { const a = wt(s, w); if (a != null && t > a && t < a + 1.4) S.glow(fb, x - cam, y, 26, 1 - (t - a) / 1.4); }
  },
  crank(t, s) {
    const cam = Math.round(110 + 40 * ss(s.t0, s.t1, t));
    S.lamp(fb, t, { cam, mode: 'night', salt: 1, chars: [{ who: 'hero', pose: 'back', x: 238 }], lights: [{ x: S.LAMP.crank - cam, y: 100, r: 90 }] });
    const k = wt(s, 'колба'), w = wt(s, 'краской'); if (k && t > k && t < k + 1.6) S.glow(fb, S.LAMP.crank - cam, 96, 22, 1 - (t - k) / 1.6); if (w && t > w && t < w + 2) S.glow(fb, S.LAMP.crank - cam, 70, 40, 1 - (t - w) / 2);
  },
  notebook(t, s) { S.notebook(fb, t, { progress: 0, lines: 0 }); },
  note(t, s) { S.notebook(fb, t, { progress: clamp((t - s.lines[0].t0) / (s.lines[0].t1 - s.lines[0].t0), 0, 1), lines: 7 }); },
  title(t, s) { S.titleBg(fb, t, { n: s.n }); },
  lights(t, s) {
    const lightsOn = wt(s, 'загораются') ?? s.t0, reach = wt(s, 'рука');
    const k = reach != null ? ss(reach, reach + 2.5, t) : 0, cam = Math.round(20 + 90 * k);
    S.lamp(fb, t, { cam, mode: 'night', seaLights: () => t > lightsOn ? 1 : 0, lever: reach ? .25 * ss(reach + 1, s.t1, t) : 0,
      chars: [{ who: 'hero', pose: k > .6 ? 'cast' : 'back', x: 168 + 20 * k, flip: false }] });
  },
  lights_wrong(t, s) {
    const beats = [...wall(s, 'раз'), ...wall(s, 'два')].sort((a, b) => a.t0 - b.t0), first = beats.length ? beats[0].t0 : 1e9;
    const on = t < first ? 1 : beats.some(b => t >= b.t0 - .05 && t < b.t0 + .3) ? 1 : 0;
    S.lamp(fb, t, { cam: 40, mode: 'night', seaLights: () => on, chars: [{ who: 'hero', pose: 'back', x: 190 }] });
    const h = wt(s, 'сердцу'); if (h && t > h) S.glow(fb, 150, 60, 80, .4 * (1 - (t - h) / 2));
  },
  lights_off(t, s) {
    const off = wt(s, 'гаснут') ?? s.t0, below = wt(s, 'внизу');
    if (below == null || t < below) { S.lamp(fb, t, { cam: 40, mode: 'night', seaLights: () => t < off ? 1 : 0, chars: [{ who: 'hero', pose: 'hurt', x: 190 }], lever: 0 }); return { shake: off }; }
    S.ext(fb, t, { mode: 'night', camY: -10, creatures: 4, fogTop: 120, fogDens: .9 });
  },
  stairs_down(t, s) {
    const start = wt(s, 'спускаешься') ?? s.t0;
    const step = Math.min(117, interp(s, t, [['спускаешься', 0, 2], ['сорок', 0, 40], ['семьдесят', 0, 70], ['десять', 0, 110], ['семнадцать', 0, 117]], 1, s.t0));
    S.stairs(fb, t, { step, dir: -1, counter: step, pose: 'walk' });
  },
  stairs_118(t, s) {
    const n = wt(s, 'восемнадцать') ?? wt(s, 'ниже') ?? s.t0, soft = wt(s, 'мягкое'), step = 117 + ss(n - .6, n, t);
    S.stairs(fb, t, { step, dir: -1, counter: Math.floor(step + .001), counterRed: t >= n, pose: t < n - .6 ? 'walk' : 'idle', warm: soft != null && t > soft });
    return { shake: n };
  },
  stairs_up(t, s) {
    const morning = wt(s, 'утром') ?? 1e9;
    if (t < morning) { const step = 118 - 24 * ss(s.t0, morning, t); S.stairs(fb, t, { step, dir: 1, counter: step, pose: 'walk', flip: true, torchAng: .55 }); }
    else { const step = Math.min(117, 1 + (t - morning) * 40); S.stairs(fb, t, { step, dir: -1, counter: step, pose: 'walk', morning: true, amb: 1 }); }
  },
  door_knock(t, s) {
    const knocks = wall(s, 'тук'), last = knocks.filter(k => t >= k.t0).pop();
    S.room(fb, t, { cam: 250, cold: true, fire: 0, lamp: 0, clockTime: 2.25, knock: last ? last.t0 : null, chars: [{ who: 'hero', pose: 'idle', x: 330 }], torch: { x: 330, y: 110 } });
    const bad = wt(s, 'неправильно'); if (bad && t > bad && t < bad + 1.2) { S.win(fb, 116, 26, 88, 20, 'red'); S.ptext(fb, '✗ 1-1-3', 160, 32, C.white, { center: true }); }
  },
  door_voice(t, s) { S.room(fb, t, { cam: 250, cold: true, fire: 0, lamp: 0, underDoor: .6 + .2 * Math.sin(t * 3), chars: [{ who: 'hero', pose: 'idle', x: 322 }], torch: { x: 322, y: 110 } }); },
  door_inside(t, s) { S.room(fb, t, { cam: 262, cold: true, fire: 0, lamp: 0, underDoor: .5, chars: [{ who: 'hero', pose: 'push', x: 344 }], torch: { x: 344, y: 110 } }); },
  door_prints(t, s) {
    const m = wt(s, 'утром');
    if (m == null || t < m) { S.room(fb, t, { cam: 250, cold: true, fire: 0, lamp: 0, chars: [{ who: 'hero', pose: 'sit', x: 300 }], amb: 2 }); return; }
    const p = wt(s, 'ладони'), many = wt(s, 'много'); S.doorOut(fb, t, { prints: p == null ? 0 : t < p ? 0 : t < (many ?? p + 1) ? .15 : clamp(.15 + (t - many) * .5, 0, 1) });
  },
  thirst(t, s) {
    const k = wt(s, 'колодец') ?? s.t0;
    S.room(fb, t, { cam: Math.round(100 + 30 * ss(s.t0, k, t)), light: 'day', outside: 'day', wellView: true, chars: [{ who: 'hero', pose: 'back', x: 238 }] });
    const c = wt(s, 'двенадцать'); if (c && t > c) { S.win(fb, 196, 22, 112, 20); S.ptext(fb, 'ДО КОЛОДЦА: 12', 252, 28, C.white, { center: true }); }
  },
  well(t, s) {
    const open = wt(s, 'отодвигаешь') ?? s.t0, st = wt(s, 'двенадцать') ?? open + 1, cr = wt(s, 'крутишь') ?? st + 4, up = wt(s, 'поднимается') ?? cr + 3;
    const steps = t < st ? 0 : Math.min(12, Math.floor((t - st) / ((cr - st) / 12)) + 1), x = 50 + (Math.min(steps, 12) / 12) * 180;
    S.well(fb, t, { mode: 'dusk', steps, crank: t > cr ? (t - cr) * .8 : 0, bucket: t < cr ? 1 : 1 - ss(cr, up + 1, t), hero: { x: t < st ? 50 : x, pose: steps > 0 && steps < 12 ? 'walk' : t > cr ? 'push' : 'idle' } });
  },
  reflection(t, s) { const b = wt(s, 'моргает'); S.bucket(fb, t, { blink: b != null && t > b && t < b + .35 }); },
  well_run(t, s) {
    const drop = wt(s, 'отпускаешь') ?? s.t0, run = wt(s, 'бежишь') ?? s.t1 - 3, rain = wt(s, 'дождь');
    const hx = t < run ? 230 : 230 - (t - run) * 70;
    S.well(fb, t, { mode: 'dusk', steps: 12, bucket: t < drop ? 0 : clamp((t - drop) * 1.5, 0, 1), crank: t < drop ? 0 : (t - drop) * 3, hero: hx > 55 ? { x: hx, pose: t < run ? 'hurt' : 'walk', flip: t >= run } : null, rain: rain != null && t > rain });
    return { shake: wt(s, 'стук') };
  },
  clock_stop(t, s) { const st = wt(s, 'пропадает') ?? s.t0 + 2; S.closeClock(fb, t, { time: 3 + 17 / 60 - (t < st ? .002 * (st - t) : 0), stopped: t > st, amb: 2 }); },
  window_tap(t, s) {
    const look = wt(s, 'смотришь');
    if (look == null || t < look) { S.glass(fb, t, { shadow: true, nail: wall(s, 'тук').some(k => t >= k.t0 && t < k.t0 + .25) }); return { shake: wt(s, 'ногтем') }; }
    S.room(fb, t, { cam: 120, cold: true, fire: 0, lamp: 0, outside: 'night', chars: [{ who: 'hero', pose: 'grip', x: 196 }], clockTime: 3.283, clockStop: true, amb: 2 });
  },
  window_write(t, s) { const b = wt(s, 'дышит') ?? s.t0, p = wt(s, 'пишет'); S.glass(fb, t, { shadow: true, breath: clamp((t - b) / 3, 0, 1) * .9, text: p ? 'ПОСМОТРИ' : null, textCol: C.steel, reveal: p ? clamp((t - p) / 4, 0, .55) : 0 }); },
  window_look(t, s) {
    const go = wt(s, 'щелк') ?? s.t0, eyes = wt(s, 'поднимаешь') ?? go + 1.5, look = wt(s, 'посмотри'), inside = wt(s, 'изнутри');
    if (t < eyes) { S.closeClock(fb, t, { time: 3 + 17 / 60 + Math.max(0, t - go) * .0003, stopped: t < go, amb: 2 }); return; }
    S.glass(fb, t, { breath: .9, text: 'ПОСМОТРИ', textCol: look && t > look ? C.red : C.steel, reveal: 1 });
    return { shake: inside, flash: inside };
  },
  radio(t, s) { S.lamp(fb, t, { cam: 0, mode: 'night', radio: 1, chars: [{ who: 'hero', pose: 'idle', x: 110, flip: true }] }); },
  radio_talk(t, s) { S.radio(fb, t, { on: 1, amp: speaking(s, t) }); },
  radio_mic(t, s) { S.lamp(fb, t, { cam: 0, mode: 'night', radio: 1, chars: [{ who: 'hero', pose: 'cast', x: 84, flip: true }] }); },
  radio_pencil(t, s) { S.notebook(fb, t, { progress: 1, lines: 6, pen: [200, 120] }); S.glow(fb, 212, 108, 18, .9); },
  radio_cut(t, s) {
    const cut = wt(s, 'выдергиваешь') ?? s.t0, off = wt(s, 'обрывается') ?? cut + 1, v = wt(s, 'видим');
    S.radio(fb, t, { on: t < off ? 1 : 0, amp: t < off ? .3 : 0, cord: t < cut + .3, ghost: v && t > v ? clamp((t - v) / .6, 0, 1) : 0 });
    return { shake: v };
  },
  vera_knock(t, s) {
    const win2 = wt(s, 'открываешь'), knocks = wall(s, 'тук'), last = knocks.filter(k => t >= k.t0).pop();
    if (win2 == null || t < win2) {
      S.room(fb, t, { cam: 250, fire: 1, clockTime: 19.5, knock: last ? last.t0 : null, chars: [{ who: 'hero', pose: 'idle', x: 330 }] });
      const ok = wt(s, 'правильно'); if (ok && t > ok && t < ok + 1.5) { S.win(fb, 116, 26, 88, 20); S.ptext(fb, '✓ 1-1 . 1', 160, 32, C.lime, { center: true }); }
      return;
    }
    S.slot(fb, t, { who: wt(s, 'женщина') && t > wt(s, 'женщина') ? 'vera' : null, eyes: 'open' });
  },
  vera_door(t, s) { S.slot(fb, t, { who: 'vera', mouth: mouth(s, t), tear: true }); },
  salt(t, s) { const sp = s.lines.length > 1 ? s.lines[1].t0 : 1e9; S.slot(fb, t, { who: 'vera', hand: t < sp + .2 || true, saltIn: true, look: t > sp ? 1 : 0 }); },
  salt_ok(t, s) {
    const open = wt(s, 'открываешь');
    if (open == null || t < open) { const sq = wt(s, 'сжимает') ?? s.t0, un = wt(s, 'разжимает') ?? sq + 1; S.slot(fb, t, { who: 'vera', fist: t < sq ? 0 : t < un ? 1 : 0 }); return; }
    S.room(fb, t, { cam: 250, bolt: 1 - ss(open, open + .8, t), chars: [{ who: 'hero', pose: 'push', x: 340 }] });
  },
  vera_room(t, s) {
    const smile = wt(s, 'смеется');
    S.room(fb, t, { cam: 30, fire: 1, chars: [{ who: 'vera', pose: 'sit', x: 96 }, { who: 'hero', pose: 'sit', x: 146, flip: true }] });
    const j = s.t0 + .6; if (t > j && t < j + 4) { S.win(fb, 70, 22, 180, 22); S.ptext(fb, 'ВЕРА ПРИСОЕДИНИЛАСЬ', 160, 29, C.yellow, { center: true, shadow: C.night }); }
    const one = wt(s, 'один'); if (one && t > one - 1.2) { S.win(fb, 92, 22, 136, 22); S.ptext(fb, 'ОТРЯД: 2', 160, 29, C.white, { center: true, shadow: C.night }); }
    if (smile && t > smile) S.glow(fb, 96 - 30, 110, 30, .6);
  },
  vera_watch(t, s) { S.room(fb, t, { cam: 0, fire: 1, chars: [{ who: 'hero', pose: 'sitlean', x: 40 }, { who: 'vera', pose: 'idle', x: 70, flip: true }] }); },
  wake_cold(t, s) { const w = wt(s, 'просыпаешься') ?? s.t0 + 1.5; S.room(fb, t, { cam: 0, fire: t < w ? 1 : 0, lamp: t < w ? 1 : 0, cold: t > w, fogFloor: t > w ? .9 : 0, chars: [{ who: 'hero', pose: t < w ? 'sitlean' : 'sit', x: 40 }], outside: 'night' }); },
  beam_on(t, s) {
    const lit = wt(s, 'горит') ?? wt(s, 'свет') ?? s.t0 + 3;
    S.lamp(fb, t, { cam: 60, mode: 'night', fogIn: .9, lampOn: t > lit ? 1 : 0, beam: t > lit ? 1 : 0, fogTop: 100, chars: [{ who: 'hero', pose: 'hurt', x: 120 }] });
    return { flash: lit };
  },
  vera_rail(t, s) {
    S.lamp(fb, t, { cam: 60, mode: 'night', lampOn: 1, beam: 1, fogTop: 100, fogIn: .6 });
    for (let i = 0; i < fb.d.length; i++) { const x = i % W, y = (i / W) | 0, d = Math.hypot(x - 160, (y - 84) * 1.2); fb.d[i] = d < 70 ? S.DARK[S.DARK[fb.d[i]]] : S.DARK[fb.d[i]]; }
    S.faceBig(fb, 160, 84, 'vera', { eyes: 'open', mouth: mouth(s, t), smile: !speaking(s, t), tear: true, look: -.5 });
  },
  child_voice(t, s) { S.ext(fb, t, { mode: 'night', camY: -30, lamp: 1, lit: 1, beam: 1, fogTop: 110, fogDens: 1 }); },
  vera_run(t, s) {
    const n15 = wt(s, 'пятнадцать'), n18 = wt(s, 'восемнадцать'), sil = wt(s, 'тишина');
    if (n15 == null || t < n15) { S.lamp(fb, t, { cam: 60, mode: 'night', lampOn: 1, beam: 1, fogIn: .6, chars: [{ who: 'vera', pose: 'walk', x: 200 - (t - s.t0) * 30, flip: true }, { who: 'hero', pose: 'cast', x: 230, flip: true }] }); return { shake: wt(s, 'ткань') }; }
    const step = interp(s, t, [['пятнадцать', 0, 115], ['шестнадцать', 0, 116], ['семнадцать', 0, 117], ['восемнадцать', 0, 118]], 114, n15 - .5);
    S.stairs(fb, t, { step, dir: -1, counter: step, counterRed: n18 && t > n18, who: 'vera', pose: 'walk', torch: false, amb: 1 });
    if (sil && t > sil) { fb.clear(C.ink); S.win(fb, 80, 74, 160, 24, 'grey'); S.ptext(fb, 'ВЕРА ПОКИНУЛА ОТРЯД', 160, 82, C.steel, { center: true }); }
  },
  fog_rise(t, s) {
    const f = interp(s, t, [['поднимается', 0, 128], ['первое', 0, 104], ['второе', 0, 80], ['третье', 0, 56], ['галереи', 0, 36]], 150, s.t0);
    S.ext(fb, t, { mode: 'night', camY: 0, fogTop: f, fogDens: 1, windows: [0, 0, 1] });
  },
  gallery(t, s) { S.lamp(fb, t, { cam: 70, mode: 'night', fogTop: 96, fogDens: 1, chars: [{ who: 'hero', pose: 'back', x: 230 }] }); },
  face(t, s) {
    const p = wt(s, 'пятно') ?? s.t0, f = wt(s, 'лицо'), close = wt(s, 'близко');
    const fy = 200 - 60 * ss(p, close ?? s.t1, t);
    S.lamp(fb, t, { cam: 70, mode: 'night', fogTop: 96, fogDens: 1, face: t > p ? { x: 150, y: fy } : null, chars: [{ who: 'hero', pose: 'back', x: 230 }] });
    return { shake: f };
  },
  climb(t, s) { const n = Math.round(4 + 20 * ss(s.t0, wt(s, 'десятки') ?? s.t1, t)); S.ext(fb, t, { mode: 'night', camY: -20, creatures: n, fogTop: 140, fogDens: .9 }); },
  notebook_crank(t, s) { const r = wt(s, 'рукоять'); S.notebook(fb, t, { progress: 1, lines: 4, word: 'РУКОЯТЬ', circles: r ? Math.min(3, Math.floor((t - r) / .35) + 1) : 0, pencil: false }); },
  crank_turn(t, s) {
    const g = wt(s, 'хватаешься') ?? s.t0, cr = wt(s, 'кристаллы') ?? g + 3, hs = wt(s, 'шипит');
    S.flask(fb, t, { crank: Math.max(0, t - g) * .7, salt: 1 - .5 * ss(cr, s.t1, t), hand: true, hiss: hs != null && t > hs });
  },
  salt_storm(t, s) {
    const dawn = wt(s, 'рассвет') ?? s.t1, quiet = wt(s, 'тишина') ?? dawn - 2;
    S.ext(fb, t, { mode: t > dawn ? 'dawn' : 'night', camY: -20, creatures: t < quiet ? 22 : 0, fall: clamp((t - s.t0) / 8, 0, 1), salt: t < quiet ? 1 : 0, fogTop: t > dawn ? 150 : 130, fogDens: .8 });
    const c = keyed(s, t, [['один', 0, 1], ['пять', 0, 5], ['двадцать', 0, 20]], 0);
    if (c && t < quiet + .5) { S.win(fb, 124, 24, 72, 22, 'red'); S.ptext(fb, '×' + c, 160, 31, C.white, { center: true }); }
  },
  dawn_sea(t, s) { S.ext(fb, t, { mode: 'day', camY: 0, fogTop: 170, fogDens: .5, lit: 1 }); },
  stairs_last(t, s) {
    const v = interp(s, t, [['семнадцать', 0, 100], ['держишь', 0, 110], ['пятнадцать', 0, 115], ['шестнадцать', 0, 116], ['семнадцать', 1, 117], ['восемнадцать', 0, 118]], 1, s.t0); const warm = wt(s, 'теплая');
    S.stairs(fb, t, { step: v, dir: -1, counter: v, counterRed: v > 117.5, pose: v > 117.5 ? 'idle' : 'walk', warm: warm != null && t > warm, morning: true, amb: 1 });
  },
  keeper(t, s) {
    const b = wt(s, 'бушлат'), g = wt(s, 'глаза'), warm = wt(s, 'теплый');
    if (b != null && t > b && t < (wt(s, 'он') ?? s.t1)) { fb.clear(C.night); S.faceBig(fb, 160, 84, 'keeper', { eyes: 'closed' }); if (t > (g ?? 1e9)) S.glow(fb, 160, 86, 60, .2); return; }
    S.stairs(fb, t, { step: 116.4, dir: -1, keeper: 2, pose: 'idle', counter: 117, morning: true, amb: 1, torchAng: .7 });
    if (warm && t > warm) S.glow(fb, 175, 118, 36, .7);
  },
  keeper_page(t, s) { page(t, 0); },
  letter(t, s) {
    const cuts = [['лягу', 'keeperFace'], ['стук', 'door'], ['матери', 'prints'], ['спасибо', 'keeperFace']];
    for (const [w, what] of cuts) { const a = wt(s, w); if (a != null && t > a - .1 && t < a + 2.2) { if (what === 'keeperFace') { fb.clear(C.night); S.faceBig(fb, 160, 84, 'keeper', { eyes: 'closed' }); } if (what === 'door') S.room(fb, t, { cam: 250, chars: [], knock: a + .2 }); if (what === 'prints') S.doorOut(fb, t, { prints: 1 }); return { lut: LUT.faded }; } }
    page(t, clamp((t - s.lines[0].t0) / (s.lines[0].t1 - s.lines[0].t0), 0, 1));
  },
  memory(t, s) {
    const seq = [['теплую', 'warm'], ['правильный', 'door'], ['вера', 'vera'], ['тепло', 'warm'], ['двадцать', 'keeper'], ['для', 'face']];
    let cur = 'warm'; for (const [w, k] of seq) { const a = wt(s, w); if (a != null && t >= a) cur = k; }
    if (cur === 'warm') S.stairs(fb, t, { step: 117.6, warm: true, pose: 'idle', counter: 118, counterRed: true });
    if (cur === 'door') S.room(fb, t, { cam: 250, chars: [{ who: 'hero', pose: 'idle', x: 330 }] });
    if (cur === 'vera') S.room(fb, t, { cam: 30, chars: [{ who: 'vera', pose: 'sit', x: 96 }, { who: 'hero', pose: 'sit', x: 146, flip: true }] });
    if (cur === 'keeper') S.stairs(fb, t, { step: 116.4, keeper: 2, pose: 'idle', torchAng: .7, amb: 1 });
    if (cur === 'face') { fb.clear(C.night); S.faceBig(fb, 160, 84, 'keeper', { eyes: 'closed' }); }
    return { lut: LUT.faded };
  },
  write(t, s) {
    const nb = wt(s, 'открываешь') ?? s.t0 + 4;
    if (t < nb) { const step = Math.max(1, 117 - (t - s.t0) * 40); S.stairs(fb, t, { step, dir: 1, flip: true, counter: step, morning: true, amb: 1, pose: 'walk' }); return; }
    S.notebook(fb, t, { progress: clamp((t - nb) / 6, 0, .4), lines: 3, title: 'ПРАВИЛО 12' });
  },
  rule12(t, s) { const l = s.lines[0]; S.notebook(fb, t, { progress: clamp((t - l.t0) / ((s.lines[1] || l).t1 - l.t0), 0, 1), lines: 11, title: 'ПРАВИЛО 12', ink: C.crimson }); },
  salt_refill(t, s) {
    const a = wt(s, 'насыпаешь') ?? s.t0 + 4, n = Math.floor(clamp((t - a) / .9, 0, 5));
    if (t < a) { S.notebook(fb, t, { progress: 1, lines: 11, title: 'ПРАВИЛО 12', ink: C.crimson, pencil: false }); return; }
    S.flask(fb, t, { salt: .06 * n + .02 * clamp(((t - a) / .9) % 1, 0, 1), crank: 0 });
  },
  thanks(t, s) {
    const kneel = wt(s, 'наклоняешься') ?? s.t0 + 3, out2 = wt(s, 'выходишь'), fogw = wt(s, 'туман');
    if (out2 == null || t < out2) { S.stairs(fb, t, { step: 116.6, keeper: 2, pose: t > kneel ? 'kneel' : 'walk', morning: true, amb: 1, counter: 117 }); return; }
    const k = (t - out2);
    S.ext(fb, t, { mode: 'day', lit: 1, hero: { x: S.TOWER.x - 6 - k * 14, y: 132, pose: 'walk', flip: true }, fogTop: fogw && t > fogw ? 160 - 30 * ss(fogw, fogw + 5, t) : 170, fogDens: .8 });
  },
  question(t, s) { S.endCard(fb, t, { fog: ss(s.t0, s.t1, t), menu: t > (wt(s, 'напиши') ?? s.t0 + 6) }); },
};
function page(t, prog) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = (x * 7 + y * 13) % 17 === 0 ? C.dslate : ((x >> 3) + (y >> 3)) % 5 === 0 ? C.night : C.slate;
  fb.rect(86, 14, 150, 150, C.tan); fb.rect(88, 16, 146, 146, C.sand); for (let x = 88; x < 234; x += 3) if (Math.sin(x) > .5) fb.px(x, 16, C.slate);
  for (let k = 0; k < 13; k++) { const n = Math.floor((90 + (k * 37) % 40) * clamp(prog * 13 - k, 0, 1)); for (let x = 0; x < n; x++) if ((x * 13 + k) % 11 < 9) fb.px(96 + x, 26 + k * 10 + Math.round(Math.sin(x * .9 + k) * 1.2), C.dslate); }
  S.glow(fb, 160, 60, 120, .5);
}

// ── events for the sound mix (EV): knocks, steps, clock, heartbeat, creaks…
function buildEvents() {
  for (const s of SEG) {
    const sc = s.scene;
    ev(s.t0, 'cut', { scene: sc });
    if (sc === 'title') ev(s.lines[0].t0 - .35, 'save');
    if (['door_knock', 'vera_knock'].includes(sc)) for (const w of wall(s, 'тук')) { const n = w.w.split('-').length; for (let k = 0; k < n; k++) ev(w.t0 + k * Math.min(.2, (w.t1 - w.t0) / n), 'knock'); }
    if (sc === 'window_tap') for (const w of wall(s, 'тук')) ev(w.t0, 'tap');
    if (sc === 'lights_wrong') for (const w of [...wall(s, 'раз'), ...wall(s, 'два')]) ev(w.t0, 'heart');
    if (sc === 'door_inside') for (let x = s.t0 + .3; x < s.t1; x += .75) ev(x, 'heart', { v: .7 });
    if (sc.startsWith('stairs') || sc === 'vera_run' && wt(s, 'пятнадцать')) { const a = sc === 'vera_run' ? wt(s, 'пятнадцать') : s.t0; for (let x = a + .2; x < s.t1 - .3; x += .42) ev(x, 'step'); }
    if (['room', 'thirst', 'vera_room', 'vera_watch', 'door_knock', 'door_voice'].includes(sc)) for (let x = s.t0; x < s.t1; x += 1) ev(x, 'tick');
    if (sc === 'clock_stop') { const st = wt(s, 'пропадает') ?? s.t0 + 2; for (let x = s.t0; x < st; x += 1) ev(x, 'tick', { v: 1.3 }); }
    if (sc === 'window_look') { const g = wt(s, 'щелк'); if (g) { ev(g, 'click'); for (let x = g + 1; x < s.t1; x += 1) ev(x, 'tick'); } ev(wt(s, 'изнутри') ?? s.t1 - 1, 'hit'); }
    if (sc === 'lights_off') { ev(wt(s, 'гаснут') ?? s.t0, 'hit'); const b = wt(s, 'скребется'); if (b) ev(b, 'scratch', { d: s.t1 - b }); }
    if (sc === 'stairs_118') { ev(wt(s, 'восемнадцать') ?? s.t0, 'hit'); }
    if (sc === 'hook') { const a = wt(s, 'сорок'); if (a) ev(a, 'lampOn'); const b = wt(s, 'и'); if (b) ev(b, 'lampOff'); }
    if (sc === 'arrive') { const d = wt(s, 'засов'); if (d) ev(d, 'bolt'); }
    if (sc === 'salt_ok') { const d = wt(s, 'открываешь'); if (d) ev(d, 'bolt'); }
    if (sc === 'well') { const st = wt(s, 'двенадцать'), cr = wt(s, 'крутишь'); if (st && cr) for (let k = 0; k < 12; k++) ev(st + k * (cr - st) / 12, 'stepOut'); if (cr) ev(cr, 'winch', { d: 4 }); }
    if (sc === 'well_run') { const d = wt(s, 'отпускаешь'); if (d) ev(d, 'chain'); const k = wt(s, 'стук'); if (k) ev(k, 'thud'); const r = wt(s, 'дождь'); if (r) ev(r, 'rain', { d: s.t1 - r + 2 }); }
    if (sc === 'reflection') { const b = wt(s, 'моргает'); if (b) ev(b, 'hit', { v: .7 }); }
    if (['radio_talk', 'radio'].includes(sc)) ev(s.t0, 'static', { d: s.t1 - s.t0 });
    if (sc === 'radio_cut') { const c = wt(s, 'выдергиваешь'); if (c) ev(c, 'unplug'); const v = wt(s, 'видим'); if (v) ev(v, 'hit', { v: .8 }); }
    if (sc === 'vera_room') ev(s.t0 + .6, 'join');
    if (sc === 'vera_run') { const t = wt(s, 'ткань'); if (t) ev(t, 'rip'); const q = wt(s, 'тишина'); if (q) ev(q - .1, 'leave'); }
    if (sc === 'beam_on') { const l = wt(s, 'горит') ?? wt(s, 'свет'); if (l) ev(l, 'lampOn', { v: 1.4 }); ev(s.t0, 'wind', { d: s.t1 - s.t0 }); }
    if (sc === 'fog_rise') for (const w of ['первое', 'второе', 'третье']) { const a = wt(s, w); if (a) ev(a, 'pulse'); }
    if (sc === 'face') { const f = wt(s, 'лицо'); if (f) ev(f, 'hit'); }
    if (sc === 'climb') ev(s.t0, 'scratch', { d: s.t1 - s.t0, v: 1.4 });
    if (sc === 'crank_turn') { const g = wt(s, 'хватаешься') ?? s.t0; ev(g, 'crank', { d: s.t1 - g + 3 }); const h = wt(s, 'шипит'); if (h) ev(h, 'hiss', { d: s.t1 - h + 4 }); }
    if (sc === 'salt_storm') { for (const w of ['один', 'пять', 'двадцать']) { const a = wt(s, w); if (a) ev(a, 'splat'); } for (let x = s.t0 + .5; x < (wt(s, 'тишина') ?? s.t1); x += .37) ev(x, 'splat', { v: .4 }); const d = wt(s, 'рассвет'); if (d) ev(d, 'dawn'); }
    if (sc === 'notebook_crank') { const r = wt(s, 'рукоять'); if (r) for (let k = 0; k < 3; k++) ev(r + k * .35, 'scribble', { d: .3 }); }
    if (sc === 'note' || sc === 'rule12' || sc === 'letter') ev(s.lines[0].t0, 'scribble', { d: Math.min(4, s.lines[0].t1 - s.lines[0].t0) });
    if (sc === 'salt_refill') { const a = wt(s, 'насыпаешь'); if (a) for (let k = 0; k < 5; k++) ev(a + k * .9, 'pour'); }
    if (sc === 'thanks') { const o = wt(s, 'выходишь'); if (o) ev(o, 'door'); }
    if (sc === 'question') { const m = wt(s, 'напиши'); if (m) ev(m, 'menu'); }
    if (sc === 'stairs_118' || sc === 'stairs_last') { const w = wt(s, 'теплое') ?? wt(s, 'теплая'); if (w) ev(w, 'warm'); }
  }
  EV.sort((a, b) => a.t - b.t);
}

// ── frame
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function draw(t) {
  const s = segAt(t), f = SC[s.scene] || SC.note;
  const r = f(t, s) || {};
  let lut = r.lut || LUT.full;
  if (r.flash != null && t > r.flash && t < r.flash + .25) lut = whiten(lut, 1 - (t - r.flash) / .25);
  // chapter transitions: palette steps down into and up out of the title card; mosaic on other scene changes inside a chapter edge
  const nx = SEG[s.i + 1];
  if (s.scene === 'title') { lut = darken(lut, Math.max(0, 1 - (t - s.t0) / .3)); }
  else if (nx && nx.scene === 'title' && t > nx.t0 - .3) lut = darken(lut, (t - (nx.t0 - .3)) / .3);
  if (s.scene === 'question' && t > CU.total - 1.2) lut = darken(lut, (t - (CU.total - 1.2)) / 1.2);
  out.present(fb, lut);
  const m = s.i > 0 && SEG[s.i - 1].scene !== 'title' && s.scene !== 'title' && t - s.t0 < .2 ? Math.round(8 * (1 - (t - s.t0) / .2)) : 0;
  if (m > 1) mosaic(out.u32, m);
  if (r.shake != null && t > r.shake && t < r.shake + .4) { const [dx, dy] = S.shake(t, r.shake, 3); if (dx || dy) { const src = out.u32.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = clamp(x - dx, 0, W - 1), sy = clamp(y - dy, 0, H - 1); out.u32[y * W + x] = src[sy * W + sx]; } } }
  out.post(() => {}); out.show();
}
