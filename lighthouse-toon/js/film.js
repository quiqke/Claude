// film.js — «11 правил маяка» as a bright cartoon: one scene per script block (tags.scene), actions keyed to spoken words.
import * as T from './toon.js';
import * as S from './world.js';
const { ROOM, LAMP, TW } = S;
let g, CU, SEG = [], EV = [], SH = [0, 0];
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const eo = t => 1 - (1 - t) * (1 - t);

export async function init(cv, cues) {
  g = cv.getContext('2d'); CU = cues;
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  let prev = 'hook';
  for (const l of L) {
    const sc = l.kind === 'title' ? 'title' : (l.tags.scene || (l.kind === 'note' ? 'note' : prev)); prev = sc;
    const last = SEG[SEG.length - 1];
    if (last && last.scene === sc && sc !== 'note' && sc !== 'title') last.lines.push(l); else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .25 });
  }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .2; s.i = i; }); SEG[0].t0 = 0;
  for (const s of SEG) if (s.scene === 'title') { const c = cues.cards.find(c => Math.abs(c.t - (s.lines[0].t0 - .3)) < .5); s.n = c ? c.n : null; }
  buildEvents();
  return { draw, EV };
}
// ── word timing
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0) { let k = 0; const p = norm(pat); for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; } return null; }
function wall(seg, pat) { const p = norm(pat), r = []; for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) r.push(w); return r; }
const speaking = (seg, t) => { for (const l of seg.lines) if (l.kind === 'dialog') for (const w of l.words) if (t >= w.t0 && t < w.t1) return 1; return 0; };
const mouth = (seg, t) => speaking(seg, t) * (Math.floor(t * 12) % 3 === 0 ? .25 : Math.floor(t * 12) % 3 === 1 ? .8 : .5);
function keyed(seg, t, keys, v0) { let v = v0; for (const [p, n, val] of keys) { const a = wt(seg, p, n); if (a != null && t >= a) v = val; } return v; }
function interp(seg, t, keys, v0, t0) {
  const pts = [[t0, v0]]; for (const [p, n, val] of keys) { const a = wt(seg, p, n); if (a != null) pts.push([a, val]); }
  pts.sort((a, b) => a[0] - b[0]); if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) { const [ta, va] = pts[i - 1], [tb, vb] = pts[i]; return va + (vb - va) * clamp((t - ta) / Math.max(.05, tb - ta)); }
  return pts[pts.length - 1][1];
}
const after = (t, a) => a != null && t >= a;
// camera with the frame's shake
const cam = (x = 960, y = 540, z = 1) => T.setCam(x, y, z, SH[0], SH[1]);
const push = (s, t, z0, z1) => z0 + (z1 - z0) * ss(s.t0, s.t1, t);     // slow push-in over the segment
const F = { wide: { eyes: 'wide', brow: 'worried', sweat: true }, calm: { eyes: 'open', brow: 'neutral' }, worry: { eyes: 'open', brow: 'worried' }, scared: { eyes: 'wide', brow: 'up', mouth: .3, sweat: true } };

// ── scenes
const SC = {
  hook(t, s) {
    const on = wt(s, 'сорок'), off = wt(s, 'и'), never = wt(s, 'никогда'), lamp = after(t, on) && !after(t, off) ? 1 : 0;
    const k = eo(clamp((t - s.t0) / 7)); cam(1300, 760 - 280 * k, 1.5 - .4 * k);
    S.ext(g, t, { mode: 'night', lamp, beam: lamp, windows: [0, 0, 0], fogTop: 900 });
    if (after(t, never)) T.tint(g, '#000018', .25);
  },
  fogsea(t, s) { cam(); const gone = wt(s, 'исчезло') ?? s.t1; S.ext(g, t, { mode: 'night', fogTop: 1100 - 560 * ss(s.t0, gone, t) }); },
  arrive(t, s) {
    const door = wt(s, 'засов') ?? s.t1 - 1, k = clamp((t - s.t0) / (door - s.t0)), x = 900 + k * 480, y = 940 - k * 160;
    cam(1150 + k * 200, 560, 1.15);
    S.ext(g, t, { mode: 'dusk', hero: k < 1 ? { x, y, s: .5, walk: t * 7, facing: 1, armF: Math.sin(t * 7) * .5, armB: -Math.sin(t * 7) * .5, face: { ...F.worry, look: [1, -.4] } } : null, fogTop: 950, fogDens: .7, windows: k >= 1 ? [1, 0, 0] : [0, 0, 0] });
  },
  room(t, s) {
    cam(700 + 1300 * ss(s.t0, s.t1, t), 520, 1);
    let look = [-1, 0], hx = 1500;
    for (const [w, x] of [['койка', ROOM.bunk], ['печка', ROOM.stove], ['часы', ROOM.clock], ['консерв', ROOM.sacks - 160], ['соли', ROOM.sacks + 60]]) { const a = wt(s, w); if (after(t, a)) look = [x < hx ? -1 : 1, 0]; }
    S.room(g, t, { clockTime: 18.07, outside: 'night', chars: [{ who: 'hero', x: hx, y: 1010, s: 1, facing: look[0], face: { ...F.calm, look } }] });
    for (const [w, x, y] of [['койка', ROOM.bunk, 650], ['печка', ROOM.stove, 600], ['часы', ROOM.clock, 300], ['консерв', ROOM.sacks - 160, 740], ['соли', ROOM.sacks + 60, 720]]) { const a = wt(s, w); if (a != null && t > a && t < a + 1.3) T.glowRings(g, x, y, 200, '#fff6a0', .3 * (1 - (t - a) / 1.3)); }
  },
  crank(t, s) {
    cam(1500, 560, push(s, t, 1, 1.3));
    S.lamp(g, t, { mode: 'night', chars: [{ who: 'hero', x: 1300, s: 1, facing: 1, face: { ...F.worry, look: [1, -.3] } }], holes: [{ x: LAMP.crank, y: 600, r: 520 }, { x: 1300, y: 600, r: 300 }] });
    for (const [w, y] of [['колба', 480], ['краской', 300]]) { const a = wt(s, w); if (a != null && t > a && t < a + 1.6) T.glowRings(g, LAMP.crank, y, 260, '#fff6a0', .3 * (1 - (t - a) / 1.6)); }
  },
  notebook(t, s) { cam(960, 540, push(s, t, 1, 1.12)); S.notebook(g, t, { progress: 0, lines: 0 }); },
  note(t, s) { const l = s.lines[0]; cam(1100, 520, push(s, t, 1.05, 1.2)); S.notebook(g, t, { progress: clamp((t - l.t0) / (l.t1 - l.t0)), lines: 9 }); },
  title(t, s) { cam(960, 540, push(s, t, 1, 1.06)); S.titleBg(g, t, s.n); },
  lights(t, s) {
    const on = wt(s, 'загораются') ?? s.t0, reach = wt(s, 'рука'), k = reach != null ? ss(reach, reach + 2.5, t) : 0;
    cam(900 + 300 * k, 520, 1 + .15 * k);
    S.lamp(g, t, { mode: 'night', seaLights: () => after(t, on) ? 1 : 0, lever: reach ? .3 * ss(reach + 1, s.t1, t) : 0,
      chars: [{ who: 'hero', x: 1050 + 180 * k, s: 1, facing: 1, armF: k > .5 ? 1.5 : .1, face: { eyes: after(t, on) ? 'wide' : 'half', brow: after(t, on) ? 'up' : 'neutral', look: [-1, 0], smile: after(t, wt(s, 'спасение')) ? .7 : 0 } }],
      holes: [{ x: 900, y: 560, r: 700 }] });
  },
  lights_wrong(t, s) {
    const beats = [...wall(s, 'раз'), ...wall(s, 'два')].sort((a, b) => a.t0 - b.t0), first = beats.length ? beats[0].t0 : 1e9;
    const on = t < first ? 1 : beats.some(b => t >= b.t0 - .05 && t < b.t0 + .3) ? 1 : 0;
    cam(800, 560, push(s, t, 1.1, 1.4));
    S.lamp(g, t, { mode: 'night', seaLights: () => on, chars: [{ who: 'hero', x: 1150, s: 1, facing: -1, face: { ...F.wide, look: [-1, 0], mouth: .2 } }], holes: [{ x: 900, y: 560, r: 700 }] });
    const h = wt(s, 'сердцу'); if (after(t, h)) T.tint(g, '#ff2a3a', .12 * Math.max(0, 1 - (t - h) / 1.5));
  },
  lights_off(t, s) {
    const off = wt(s, 'гаснут') ?? s.t0, below = wt(s, 'внизу');
    if (below == null || t < below) { cam(900, 540, 1.1); S.lamp(g, t, { mode: 'night', seaLights: () => t < off ? 1 : 0, chars: [{ who: 'hero', x: 1150, s: 1, facing: -1, armF: -.4, face: F.scared }], dark: .55 }); return { shake: off }; }
    cam(TW.x, 820, 1.6); S.ext(g, t, { mode: 'night', creatures: 4, fogTop: 840, fogDens: .9 });
  },
  stairs_down(t, s) {
    const step = Math.min(117, interp(s, t, [['спускаешься', 0, 2], ['сорок', 0, 40], ['семьдесят', 0, 70], ['десять', 0, 110], ['семнадцать', 0, 117]], 1, s.t0));
    cam(); S.stairs(g, t, { step, walk: true, counter: step, face: F.worry, mouth: speaking(s, t) ? .2 : 0 });
  },
  stairs_118(t, s) {
    const n = wt(s, 'восемнадцать') ?? wt(s, 'ниже') ?? s.t0, soft = wt(s, 'мягкое'), back = wt(s, 'спина'), step = 117 + ss(n - .6, n, t);
    cam(960, 560, 1 + .25 * ss(n, n + 3, t));
    S.stairs(g, t, { step, walk: t < n - .6, counter: Math.floor(step + .001), counterRed: t >= n, warm: after(t, soft), eyes: t >= n ? 'wide' : 'open', brow: t >= n ? 'up' : 'worried', sweat: t >= n, mouth: after(t, back) ? .5 : 0, look: [1, 1] });
    return { shake: n };
  },
  stairs_up(t, s) {
    const morning = wt(s, 'утром') ?? 1e9; cam();
    if (t < morning) { const step = 118 - 24 * ss(s.t0, morning, t); S.stairs(g, t, { step, walk: true, facing: 1, counter: step, eyes: 'wide', brow: 'up', sweat: true, look: [1, 1] }); }
    else { const step = Math.min(117, 1 + (t - morning) * 40); S.stairs(g, t, { step, walk: true, counter: step, amb: .35, eyes: 'open', brow: 'neutral' }); }
  },
  door_knock(t, s) {
    const knocks = wall(s, 'тук'), last = knocks.filter(k => t >= k.t0).pop(), bad = wt(s, 'неправильно'), mom = wt(s, 'голос');
    cam(ROOM.door - 300, 500, push(s, t, 1, 1.15));
    S.room(g, t, { light: 'cold', fire: 0, lamp: 0, clockTime: 2.25, knock: last ? last.t0 : null, knockN: knocks.indexOf(last), chars: [{ who: 'hero', x: ROOM.door - 420, y: 1010, s: 1, facing: 1, face: { eyes: last ? 'wide' : 'half', brow: after(t, mom) ? 'sad' : 'worried', look: [1, 0], sweat: after(t, bad) } }], holes: [{ x: ROOM.door - 420, y: 600, r: 420 }] });
    if (bad && t > bad && t < bad + 1.4) { T.setCam(); T.text(g, '✗ НЕПРАВИЛЬНО', 960, 260, 64, '#ff5a4a', { fixed: true }); }
  },
  door_voice(t, s) { cam(ROOM.door - 120, 480, 1.25); S.room(g, t, { light: 'cold', fire: 0, lamp: 0, underDoor: .6 + .25 * Math.sin(t * 3), chars: [{ who: 'hero', x: ROOM.door - 360, y: 1010, s: 1, facing: 1, face: { eyes: 'wide', brow: 'sad', look: [1, .3], tear: true } }], holes: [{ x: ROOM.door - 200, y: 700, r: 460 }] }); },
  door_inside(t, s) { S.closeFace(g, t, 'hero', { eyes: 'open', brow: 'sad', look: [1, 0], sweat: true, tear: true, mouth: .1, side: .5 }, '#232857'); cam(); T.tint(g, '#ff2a3a', .06 * (Math.sin(t * 8) + 1)); },
  door_prints(t, s) {
    const m = wt(s, 'утром');
    if (m == null || t < m) { cam(ROOM.door - 400, 560, 1.1); S.room(g, t, { light: 'cold', fire: 0, lamp: 0, chars: [{ who: 'hero', x: ROOM.door - 420, y: 1010, s: 1, facing: 1, face: { eyes: 'closed', brow: 'sad' } }], holes: [{ x: ROOM.door - 420, y: 600, r: 300 }] }); return; }
    const p = wt(s, 'ладони'), many = wt(s, 'много'); cam(960, 520, push(s, t, 1, 1.1));
    S.doorOut(g, t, { prints: p == null || t < p ? 0 : t < (many ?? p + 1) ? .15 : clamp(.15 + (t - many) * .5) });
  },
  thirst(t, s) {
    const k = wt(s, 'колодец') ?? s.t0; cam(ROOM.window - 200 + 200 * ss(s.t0, k, t), 520, 1.1);
    S.room(g, t, { light: 'day', outside: 'day', wellView: true, chars: [{ who: 'hero', x: ROOM.window - 260, y: 1010, s: 1, facing: 1, face: { eyes: 'half', brow: 'sad', look: [1, -.3], mouth: .1 } }] });
    const c = wt(s, 'двенадцать'); if (after(t, c)) { T.setCam(); T.text(g, 'ДО КОЛОДЦА: 12 ШАГОВ', 960, 250, 60, '#ffd23f', { fixed: true }); }
  },
  well(t, s) {
    const open = wt(s, 'отодвигаешь') ?? s.t0, st = wt(s, 'двенадцать') ?? open + 1, cr = wt(s, 'крутишь') ?? st + 4, up = wt(s, 'поднимается') ?? cr + 3;
    const steps = t < st ? 0 : Math.min(12, Math.floor((t - st) / ((cr - st) / 12)) + 1), x = 300 + (steps / 12) * 1080;
    cam(700 + 500 * (steps / 12), 560, 1);
    S.well(g, t, { mode: 'dusk', steps, crank: after(t, cr) ? (t - cr) * .8 : 0, bucket: t < cr ? 1 : 1 - ss(cr, up + 1, t),
      hero: { x: t < st ? 300 : x, walk: steps > 0 && steps < 12 ? t * 6 : null, facing: 1, armF: after(t, cr) ? 1.6 : .1, face: { eyes: 'open', brow: 'worried', look: [1, 0] } } });
  },
  reflection(t, s) { const b = wt(s, 'моргает'); cam(960, 540, push(s, t, 1, 1.15)); S.bucket(g, t, { blink: b != null && t > b && t < b + .35 }); return { shake: b }; },
  well_run(t, s) {
    const drop = wt(s, 'отпускаешь') ?? s.t0, run = wt(s, 'бежишь') ?? s.t1 - 3, rain = wt(s, 'дождь'), hx = t < run ? 1380 : 1380 - (t - run) * 420;
    cam(1100, 560, 1);
    S.well(g, t, { mode: 'dusk', steps: 12, bucket: t < drop ? 0 : clamp((t - drop) * 1.5), crank: t < drop ? 0 : (t - drop) * 3, rain: after(t, rain),
      hero: hx > 160 ? { x: hx, walk: t >= run ? t * 9 : null, facing: t >= run ? -1 : 1, armF: -.6, face: F.scared } : null });
    return { shake: wt(s, 'стук') };
  },
  clock_stop(t, s) { const st = wt(s, 'пропадает') ?? s.t0 + 2; cam(960, 540, push(s, t, 1, 1.2)); S.bigClock(g, t, { time: 3 + 17 / 60, stopped: t > st, cold: true }); },
  window_tap(t, s) {
    const look = wt(s, 'смотришь');
    if (look == null || t < look) { cam(960, 540, 1.05); S.glass(g, t, { shadow: true, nail: wall(s, 'тук').some(k => t >= k.t0 && t < k.t0 + .25) }); return { shake: wt(s, 'ногтем') }; }
    cam(ROOM.window - 200, 560, 1.15);
    S.room(g, t, { light: 'cold', fire: 0, lamp: 0, outside: 'night', shadow: true, clockTime: 3.283, clockStop: true, chars: [{ who: 'hero', x: ROOM.window - 380, y: 1010, s: 1, facing: -1, face: { eyes: 'open', brow: 'worried', look: [-.3, 1], sweat: true } }], holes: [{ x: ROOM.window - 380, y: 640, r: 360 }] });
  },
  window_write(t, s) { const b = wt(s, 'дышит') ?? s.t0, p = wt(s, 'пишет'); cam(960, 540, 1.05); S.glass(g, t, { shadow: true, breath: clamp((t - b) / 3) * .9, text: p ? 'ПОСМОТРИ' : null, reveal: p ? clamp((t - p) / 4, 0, .55) : 0 }); },
  window_look(t, s) {
    const go = wt(s, 'щелк') ?? s.t0, eyes = wt(s, 'поднимаешь') ?? go + 1.5, look = wt(s, 'посмотри'), inside = wt(s, 'изнутри');
    if (t < eyes) { cam(); S.bigClock(g, t, { time: 3 + 17 / 60 + Math.max(0, t - go) * .0003, stopped: t < go, cold: true }); return; }
    if (inside != null && t > inside) { cam(); S.closeFace(g, t, 'hero', { eyes: 'wide', brow: 'up', mouth: .7, sweat: true, look: [0, 0] }, '#2b1a3a'); return { shake: inside, flash: inside }; }
    cam(1000, 500, 1.1); S.glass(g, t, { breath: .9, text: 'ПОСМОТРИ', textCol: after(t, look) ? '#e8423a' : '#9aa3d6', reveal: 1 });
  },
  radio(t, s) { cam(700, 540, 1.05); S.lamp(g, t, { mode: 'night', radio: 1, chars: [{ who: 'hero', x: 820, s: 1, facing: -1, face: { eyes: 'wide', brow: 'up', look: [-1, 0] } }], holes: [{ x: 500, y: 560, r: 600 }] }); },
  radio_talk(t, s) { cam(960, 540, push(s, t, 1, 1.08)); S.radio(g, t, { on: 1, amp: speaking(s, t) }); },
  radio_mic(t, s) { const name = wt(s, 'имя'); cam(620, 520, 1.15); S.lamp(g, t, { mode: 'night', radio: 1, mic: [700, 520], chars: [{ who: 'hero', x: 720, s: 1, facing: -1, armF: 1.3, face: { eyes: after(t, name) ? 'wide' : 'open', brow: after(t, name) ? 'up' : 'worried', look: [-1, 0], sweat: after(t, name) } }], holes: [{ x: 520, y: 560, r: 600 }] }); },
  radio_pencil(t, s) { cam(1300, 650, push(s, t, 1.1, 1.4)); S.notebook(g, t, { progress: 1, lines: 6, pen: [1300, 760], warmPencil: true }); },
  radio_cut(t, s) {
    const cut = wt(s, 'выдергиваешь') ?? s.t0, off = wt(s, 'обрывается') ?? cut + 1, v = wt(s, 'видим');
    cam(960, 540, after(t, v) ? 1.25 : 1); S.radio(g, t, { on: t < off ? 1 : 0, amp: t < off ? .3 : 0, cord: t < cut + .3, ghost: after(t, v) ? clamp((t - v) / .6) : 0 });
    return { shake: v };
  },
  vera_knock(t, s) {
    const win2 = wt(s, 'открываешь'), knocks = wall(s, 'тук'), last = knocks.filter(k => t >= k.t0).pop(), ok = wt(s, 'правильно');
    if (win2 == null || t < win2) {
      cam(ROOM.door - 300, 520, 1.1);
      S.room(g, t, { light: 'dim', clockTime: 19.5, knock: last ? last.t0 : null, knockN: knocks.indexOf(last), chars: [{ who: 'hero', x: ROOM.door - 420, y: 1010, s: 1, facing: 1, face: { eyes: 'open', brow: after(t, ok) ? 'up' : 'worried', look: [1, 0], smile: after(t, ok) ? .5 : 0 } }] });
      if (ok && t > ok && t < ok + 1.6) { T.setCam(); T.text(g, '✓ ПРАВИЛЬНО', 960, 260, 64, '#7dff6a', { fixed: true }); }
      return;
    }
    cam(); S.slot(g, t, { who: after(t, wt(s, 'женщина')) ? 'vera' : null, eyes: 'half', brow: 'sad' });
  },
  vera_door(t, s) { cam(960, 520, push(s, t, 1, 1.1)); S.slot(g, t, { who: 'vera', mouth: mouth(s, t), tear: true, brow: 'sad', eyes: 'open' }); },
  salt(t, s) { const say = s.lines.find(l => l.kind === 'dialog'); cam(); S.slot(g, t, { who: 'vera', hand: true, saltIn: true, eyes: say && t > say.t0 ? 'wide' : 'open', brow: 'worried', look: [0, 1] }); },
  salt_ok(t, s) {
    const open = wt(s, 'открываешь');
    if (open == null || t < open) { const sq = wt(s, 'сжимает') ?? s.t0, un = wt(s, 'разжимает') ?? sq + 1; cam(); S.slot(g, t, { who: 'vera', fist: t < sq ? null : t < un ? 1 : 0, eyes: 'half', brow: 'neutral', look: [0, 1] }); return; }
    cam(ROOM.door - 260, 520, 1.1); S.room(g, t, { light: 'dim', bolt: 1 - ss(open, open + .8, t), chars: [{ who: 'hero', x: ROOM.door - 330, y: 1010, s: 1, facing: 1, armF: 1.5, face: { eyes: 'open', brow: 'neutral', smile: .3, look: [1, 0] } }] });
  },
  vera_room(t, s) {
    const smile = wt(s, 'смеется'), one = wt(s, 'один');
    cam(820, 560, push(s, t, 1, 1.12));
    S.room(g, t, { light: 'warm', chars: [{ who: 'vera', x: 560, y: 1010, s: .95, facing: 1, armF: -.9, face: { eyes: 'open', brow: 'up', mouth: after(t, smile) ? .55 : (Math.floor(t * 8) % 2 ? .4 : .1), smile: after(t, smile) ? 1 : .4, look: [1, 0] } },
      { who: 'hero', x: 1130, y: 1010, s: 1, facing: -1, face: { eyes: 'half', brow: 'neutral', smile: after(t, one) ? .9 : .3, look: [-1, 0] } }] });
    T.setCam(); const j = s.t0 + .6;
    if (t > j && t < j + 4) T.text(g, '+1  ВЕРА В ОТРЯДЕ', 960, 260, 64, '#7dff6a', { fixed: true });
    if (after(t, one - 1.2)) T.text(g, 'ВАС ДВОЕ', 960, 260, 64, '#ffd23f', { fixed: true });
  },
  vera_watch(t, s) {
    cam(520, 560, 1.05); const say = s.lines.find(l => l.kind === 'dialog');
    S.room(g, t, { light: 'dim', chars: [{ who: 'hero', x: ROOM.bunk + 20, y: 640, s: .9, lying: true, face: { eyes: 'half', brow: 'sad' } }, { who: 'vera', x: 560, y: 1010, s: .95, facing: -1, armF: 1.2, face: { eyes: 'open', brow: 'up', smile: .6, mouth: say ? mouth(s, t) : 0, look: [-1, .5] } }] });
  },
  wake_cold(t, s) {
    const w = wt(s, 'просыпаешься') ?? s.t0 + 1.5; cam(500, 560, 1.05);
    S.room(g, t, { light: t < w ? 'dim' : 'cold', fire: t < w ? 1 : 0, lamp: t < w ? 1 : 0, fogFloor: t > w ? .9 : 0, outside: 'night',
      chars: [{ who: 'hero', x: ROOM.bunk + 20, y: 640, s: .9, lying: true, face: { eyes: t < w ? 'closed' : 'wide', brow: t < w ? 'neutral' : 'up' } }], holes: [{ x: 300, y: 600, r: 520 }] });
  },
  beam_on(t, s) {
    const lit = wt(s, 'горит') ?? wt(s, 'свет') ?? s.t0 + 3; cam(900, 540, 1);
    S.lamp(g, t, { mode: 'night', fogIn: .9, lampOn: after(t, lit) ? 1 : 0, beam: after(t, lit) ? 1 : 0, fogTop: 700, chars: [{ who: 'hero', x: 1350, s: 1, facing: -1, armF: -.5, face: { ...F.scared, look: [-1, -.3] } }] });
    return { flash: lit };
  },
  vera_rail(t, s) { cam(); S.closeFace(g, t, 'vera', { eyes: 'open', brow: 'up', mouth: mouth(s, t), smile: speaking(s, t) ? .3 : .9, tear: true, look: [-.6, 0], side: -.4 }, '#f5e6a8'); T.glowRings(g, 300, 300, 600, '#ffffff', .2); },
  child_voice(t, s) { cam(1300, 700, 1.2); S.ext(g, t, { mode: 'night', lamp: 1, beam: 1, fogTop: 760, fogDens: 1 }); const k = wt(s, 'мама'); if (after(t, k)) { T.setCam(); } },
  vera_run(t, s) {
    const n15 = wt(s, 'пятнадцать'), n18 = wt(s, 'восемнадцать'), sil = wt(s, 'тишина');
    if (n15 == null || t < n15) { cam(1000, 540, 1); S.lamp(g, t, { mode: 'night', lampOn: 1, beam: 1, fogIn: .6, chars: [{ who: 'vera', x: 1200 - (t - s.t0) * 160, s: .95, walk: t * 9, facing: -1, face: { eyes: 'wide', brow: 'up', mouth: .4 } }, { who: 'hero', x: 1450, s: 1, facing: -1, armF: 1.6, face: { eyes: 'wide', brow: 'up', mouth: .8 } }] }); return { shake: wt(s, 'ткань') }; }
    const step = interp(s, t, [['пятнадцать', 0, 115], ['шестнадцать', 0, 116], ['семнадцать', 0, 117], ['восемнадцать', 0, 118]], 114, n15 - .5);
    if (sil != null && t > sil) { T.setCam(); g.fillStyle = '#0a0a1c'; g.fillRect(0, 0, 1920, 1080); T.text(g, 'ВЕРА ПОКИНУЛА ОТРЯД', 960, 520, 72, '#8a8fb0', { fixed: true }); return; }
    cam(); S.stairs(g, t, { step, who: 'vera', walk: true, counter: step, counterRed: after(t, n18), eyes: 'wide', brow: 'up', torch: false, amb: .45 });
  },
  fog_rise(t, s) {
    const f = interp(s, t, [['поднимается', 0, 760], ['первое', 0, 640], ['второе', 0, 500], ['третье', 0, 370], ['галереи', 0, 250]], 900, s.t0);
    cam(1300, 540, 1); S.ext(g, t, { mode: 'night', fogTop: f, fogDens: 1, windows: [0, 0, 1] });
  },
  fog_voice(t, s) { SC.fog_rise(t, s); },
  gallery(t, s) {
    const say = s.lines.find(l => l.kind === 'dialog' && t >= l.t0 && t < l.t1); cam(1100, 540, push(s, t, 1, 1.1));
    S.lamp(g, t, { mode: 'night', fogTop: 520, fogDens: 1, chars: [{ who: 'hero', x: 1250, s: 1, facing: -1, face: { eyes: say ? 'wide' : 'open', brow: 'worried', look: [-1, -.6], sweat: !!say } }], dark: .25 });
  },
  face(t, s) {
    const p = wt(s, 'пятно') ?? s.t0, f = wt(s, 'лицо'), close = wt(s, 'близко'), fy = 1100 - 420 * ss(p, close ?? s.t1, t);
    cam(1100, 560, 1 + .2 * ss(p, s.t1, t));
    S.lamp(g, t, { mode: 'night', fogTop: 520, fogDens: 1, face: after(t, p) ? { x: 700, y: fy } : null, chars: [{ who: 'hero', x: 1300, s: 1, facing: -1, face: { eyes: 'wide', brow: 'up', look: [-1, -.8], sweat: true, mouth: after(t, f) ? .3 : 0 } }], dark: .25 });
    return { shake: f };
  },
  climb(t, s) { const n = Math.round(4 + 20 * ss(s.t0, wt(s, 'десятки') ?? s.t1, t)); cam(TW.x, 560, 1.1); S.ext(g, t, { mode: 'night', creatures: n, fogTop: 860, fogDens: .9 }); },
  notebook_crank(t, s) { const r = wt(s, 'рукоять'); cam(1315, 560, push(s, t, 1.1, 1.35)); S.notebook(g, t, { progress: 1, lines: 4, word: 'РУКОЯТЬ', circles: r ? Math.min(3, Math.floor((t - r) / .35) + 1) : 0, pencil: false }); },
  crank_turn(t, s) {
    const gr = wt(s, 'хватаешься') ?? s.t0, cr = wt(s, 'кристаллы') ?? gr + 3, hs = wt(s, 'шипит');
    cam(960, 540, push(s, t, 1, 1.08)); S.flask(g, t, { crank: Math.max(0, t - gr) * .7, salt: 1 - .5 * ss(cr, s.t1, t), hand: true, hiss: after(t, hs) });
  },
  salt_storm(t, s) {
    const dawn = wt(s, 'рассвет') ?? s.t1, quiet = wt(s, 'тишина') ?? dawn - 2; cam(TW.x - 100, 560, 1.05);
    S.ext(g, t, { mode: after(t, dawn) ? 'dawn' : 'night', creatures: t < quiet ? 22 : 0, fall: clamp((t - s.t0) / 8), salt: t < quiet ? 1 : 0, fogTop: after(t, dawn) ? 950 : 880, fogDens: .8 });
    const c = keyed(s, t, [['один', 0, 1], ['пять', 0, 5], ['двадцать', 0, 20]], 0);
    if (c && t < quiet + .5) { T.setCam(); T.text(g, '×' + c, 360, 300, 140, '#ffd23f', { fixed: true, rot: -.1 }); }
  },
  dawn_sea(t, s) { cam(1200, 540, push(s, t, 1.1, 1)); S.ext(g, t, { mode: 'day', fogTop: 1000, fogDens: .5 }); },
  stairs_last(t, s) {
    const v = interp(s, t, [['семнадцать', 0, 100], ['держишь', 0, 110], ['пятнадцать', 0, 115], ['шестнадцать', 0, 116], ['семнадцать', 1, 117], ['восемнадцать', 0, 118]], 1, s.t0), warm = wt(s, 'теплая');
    cam(); S.stairs(g, t, { step: v, walk: v < 117.5, counter: v, counterRed: v > 117.5, warm: after(t, warm), amb: .55, eyes: v > 117.5 ? 'wide' : 'open', brow: 'worried' });
  },
  keeper(t, s) {
    const b = wt(s, 'бушлат'), he = wt(s, 'он'), warm = wt(s, 'теплый');
    if (after(t, b) && !after(t, he)) { cam(); S.closeFace(g, t, 'keeper', { eyes: 'closed', brow: 'sad', mouth: 0 }, '#3a3550'); return; }
    cam(1000, 640, 1.15); S.stairs(g, t, { step: 116.4, keeper: true, counter: 117, amb: .55, eyes: after(t, warm) ? 'wide' : 'open', brow: 'up', look: [1, 1] });
    if (after(t, warm)) T.glowRings(g, 1100, 700, 300, '#ff9a5a', .2);
  },
  keeper_page(t, s) { cam(1300, 560, 1.2); S.notebook(g, t, { progress: 0, lines: 0, pencil: false }); },
  letter(t, s) {
    for (const [w, what] of [['лягу', 'face'], ['стук', 'door'], ['матери', 'prints'], ['спасибо', 'face']]) { const a = wt(s, w);
      if (a != null && t > a - .1 && t < a + 2.2) { cam(); if (what === 'face') S.closeFace(g, t, 'keeper', { eyes: 'closed', brow: 'sad', smile: .3 }, '#3a3550'); if (what === 'door') { cam(ROOM.door, 500, 1.2); S.room(g, t, { light: 'dim', knock: a + .2 }); } if (what === 'prints') S.doorOut(g, t, { prints: 1 }); T.tint(g, '#3a2a10', .25); return; } }
    const l = s.lines[0]; cam(1300, 520, 1.15); S.notebook(g, t, { progress: clamp((t - l.t0) / (l.t1 - l.t0)), lines: 12, pencil: false, ink: '#5a4a7a' });
  },
  memory(t, s) {
    let cur = 'warm'; for (const [w, k] of [['теплую', 'warm'], ['правильный', 'door'], ['вера', 'vera'], ['тепло', 'warm'], ['двадцать', 'keeper'], ['для', 'face']]) { const a = wt(s, w); if (after(t, a)) cur = k; }
    cam();
    if (cur === 'warm') S.stairs(g, t, { step: 117.6, warm: true, counter: 118, counterRed: true, eyes: 'wide', brow: 'up' });
    if (cur === 'door') { cam(ROOM.door - 300, 520, 1.1); S.room(g, t, { light: 'dim', chars: [{ who: 'hero', x: ROOM.door - 420, y: 1010, s: 1, facing: 1, face: F.calm }] }); }
    if (cur === 'vera') { cam(820, 560, 1.1); S.room(g, t, { chars: [{ who: 'vera', x: 560, y: 1010, s: .95, facing: 1, face: { eyes: 'open', smile: 1, mouth: .4, brow: 'up' } }, { who: 'hero', x: 1130, y: 1010, s: 1, facing: -1, face: { eyes: 'half', smile: .6 } }] }); }
    if (cur === 'keeper') { cam(1000, 640, 1.15); S.stairs(g, t, { step: 116.4, keeper: true, amb: .55 }); }
    if (cur === 'face') S.closeFace(g, t, 'keeper', { eyes: 'closed', brow: 'sad', smile: .4 }, '#3a3550');
    T.setCam(); T.tint(g, '#e8c890', .28);                               // warm sepia memory wash
  },
  write(t, s) {
    const nb = wt(s, 'открываешь') ?? s.t0 + 4;
    if (t < nb) { const step = Math.max(1, 117 - (t - s.t0) * 40); cam(); S.stairs(g, t, { step, walk: true, counter: step, amb: .3, eyes: 'open', brow: 'sad' }); return; }
    cam(1300, 520, 1.15); S.notebook(g, t, { progress: clamp((t - nb) / 6, 0, .4), lines: 3, title: 'ПРАВИЛО 12' });
  },
  rule12(t, s) { const l = s.lines[0]; cam(1300, 540, push(s, t, 1.1, 1.2)); S.notebook(g, t, { progress: clamp((t - l.t0) / ((s.lines[1] || l).t1 - l.t0)), lines: 11, title: 'ПРАВИЛО 12', ink: '#c0333a' }); },
  salt_refill(t, s) {
    const a = wt(s, 'насыпаешь') ?? s.t0 + 4, n = Math.floor(clamp((t - a) / .9, 0, 5));
    if (t < a) { cam(1300, 540, 1.1); S.notebook(g, t, { progress: 1, lines: 11, title: 'ПРАВИЛО 12', ink: '#c0333a', pencil: false }); return; }
    cam(); S.flask(g, t, { salt: .06 * n + .02 * clamp(((t - a) / .9) % 1), crank: 0, hand: false });
  },
  thanks(t, s) {
    const kneel = wt(s, 'наклоняешься') ?? s.t0 + 3, out2 = wt(s, 'выходишь'), fogw = wt(s, 'туман');
    if (out2 == null || t < out2) { cam(1000, 640, 1.15); S.stairs(g, t, { step: 116.6, keeper: true, walk: t < kneel - 1, kneel: after(t, kneel), counter: 117, amb: .35, eyes: after(t, kneel) ? 'closed' : 'open', brow: 'sad', mouth: after(t, wt(s, 'шепчешь')) ? .3 : 0 }); return; }
    const k = t - out2; cam(1300, 560, 1.05);
    S.ext(g, t, { mode: 'day', hero: { x: TW.x - 40 - k * 120, y: 790 + k * 25, s: .5, walk: t * 7, facing: -1, face: { eyes: 'open', smile: .5, brow: 'neutral' } }, fogTop: after(t, fogw) ? 1000 - 200 * ss(fogw, fogw + 5, t) : 1050, fogDens: .8, windows: [0, 0, 0] });
  },
  question(t, s) { cam(1300, 540, 1); S.endCard(g, t, { fog: ss(s.t0, s.t1, t), menu: t > (wt(s, 'напиши') ?? s.t0 + 6) }); },
};

// ── events for the mix (same vocabulary as mix.py)
function buildEvents() {
  for (const s of SEG) {
    const sc = s.scene; ev(s.t0, 'cut', { scene: sc });
    if (sc === 'title') ev(s.lines[0].t0 - .35, 'save');
    if (['door_knock', 'vera_knock'].includes(sc)) for (const w of wall(s, 'тук')) { const n = w.w.split('-').length; for (let k = 0; k < n; k++) ev(w.t0 + k * Math.min(.2, (w.t1 - w.t0) / n), 'knock'); }
    if (sc === 'window_tap') for (const w of wall(s, 'тук')) ev(w.t0, 'tap');
    if (sc === 'lights_wrong') for (const w of [...wall(s, 'раз'), ...wall(s, 'два')]) ev(w.t0, 'heart');
    if (sc === 'door_inside') for (let x = s.t0 + .3; x < s.t1; x += .75) ev(x, 'heart', { v: .7 });
    if (sc.startsWith('stairs') || (sc === 'vera_run' && wt(s, 'пятнадцать'))) { const a = sc === 'vera_run' ? wt(s, 'пятнадцать') : s.t0; for (let x = a + .2; x < s.t1 - .3; x += .42) ev(x, 'step'); }
    if (['room', 'thirst', 'vera_room', 'vera_watch', 'door_knock', 'door_voice'].includes(sc)) for (let x = s.t0; x < s.t1; x += 1) ev(x, 'tick');
    if (sc === 'clock_stop') { const st = wt(s, 'пропадает') ?? s.t0 + 2; for (let x = s.t0; x < st; x += 1) ev(x, 'tick', { v: 1.3 }); }
    if (sc === 'window_look') { const gq = wt(s, 'щелк'); if (gq) { ev(gq, 'click'); for (let x = gq + 1; x < s.t1; x += 1) ev(x, 'tick'); } ev(wt(s, 'изнутри') ?? s.t1 - 1, 'hit'); }
    if (sc === 'lights_off') { ev(wt(s, 'гаснут') ?? s.t0, 'hit'); const b = wt(s, 'скребется'); if (b) ev(b, 'scratch', { d: s.t1 - b }); }
    if (sc === 'stairs_118') ev(wt(s, 'восемнадцать') ?? s.t0, 'hit');
    if (sc === 'hook') { const a = wt(s, 'сорок'); if (a) ev(a, 'lampOn'); const b = wt(s, 'и'); if (b) ev(b, 'lampOff'); }
    if (sc === 'arrive') { const d = wt(s, 'засов'); if (d) ev(d, 'bolt'); }
    if (sc === 'salt_ok') { const d = wt(s, 'открываешь'); if (d) ev(d, 'bolt'); }
    if (sc === 'well') { const st = wt(s, 'двенадцать'), cr = wt(s, 'крутишь'); if (st && cr) for (let k = 0; k < 12; k++) ev(st + k * (cr - st) / 12, 'stepOut'); if (cr) ev(cr, 'winch', { d: 4 }); }
    if (sc === 'well_run') { const d = wt(s, 'отпускаешь'); if (d) ev(d, 'chain'); const k = wt(s, 'стук'); if (k) ev(k, 'thud'); const r = wt(s, 'дождь'); if (r) ev(r, 'rain', { d: s.t1 - r + 2 }); }
    if (sc === 'reflection') { const b = wt(s, 'моргает'); if (b) ev(b, 'hit', { v: .7 }); }
    if (['radio_talk', 'radio'].includes(sc)) ev(s.t0, 'static', { d: s.t1 - s.t0 });
    if (sc === 'radio_cut') { const c = wt(s, 'выдергиваешь'); if (c) ev(c, 'unplug'); const v = wt(s, 'видим'); if (v) ev(v, 'hit', { v: .8 }); }
    if (sc === 'vera_room') ev(s.t0 + .6, 'join');
    if (sc === 'vera_run') { const tk = wt(s, 'ткань'); if (tk) ev(tk, 'rip'); const q = wt(s, 'тишина'); if (q) ev(q - .1, 'leave'); }
    if (sc === 'beam_on') { const l = wt(s, 'горит') ?? wt(s, 'свет'); if (l) ev(l, 'lampOn', { v: 1.4 }); ev(s.t0, 'wind', { d: s.t1 - s.t0 }); }
    if (sc === 'fog_rise') for (const w of ['первое', 'второе', 'третье']) { const a = wt(s, w); if (a) ev(a, 'pulse'); }
    if (sc === 'face') { const f = wt(s, 'лицо'); if (f) ev(f, 'hit'); }
    if (sc === 'climb') ev(s.t0, 'scratch', { d: s.t1 - s.t0, v: 1.4 });
    if (sc === 'crank_turn') { const gq = wt(s, 'хватаешься') ?? s.t0; ev(gq, 'crank', { d: s.t1 - gq + 3 }); const h = wt(s, 'шипит'); if (h) ev(h, 'hiss', { d: s.t1 - h + 4 }); }
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
function shakeAt(t, t0, amp = 22) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[1, -1, .8, -.7, .5, -.4, .3, -.1, 0][k] * amp, [.3, -.6, .5, -.3, .2, -.2, .1, 0, 0][k] * amp]; }
function draw(t) {
  T.setTime(t); const s = segAt(t), f = SC[s.scene] || SC.note;
  // shake is decided by the scene; evaluate once without, then redraw with the offset if needed
  SH = [0, 0]; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
  let r = f(t, s) || {};
  if (r.shake != null && t > r.shake && t < r.shake + .4) { SH = shakeAt(t, r.shake); g.fillRect(0, 0, 1920, 1080); r = f(t, s) || {}; }
  T.setCam(); T.setRot(0);
  if (r.flash != null && t > r.flash && t < r.flash + .3) T.tint(g, '#ffffff', 1 - (t - r.flash) / .3);
  // transitions: iris to black into rule cards, cut flash elsewhere
  const nx = SEG[s.i + 1];
  if (s.scene === 'title' && t - s.t0 < .35) iris(1 - (t - s.t0) / .35);
  else if (nx && nx.scene === 'title' && t > nx.t0 - .35) iris((t - (nx.t0 - .35)) / .35);
  if (s.scene === 'question' && t > CU.total - 1.2) T.tint(g, '#000', (t - (CU.total - 1.2)) / 1.2);
}
function iris(k) {   // k 0 open … 1 closed
  if (k <= 0) return; const R = 1200 * (1 - k); g.save(); g.fillStyle = '#0b0820'; g.beginPath(); g.rect(0, 0, 1920, 1080); g.moveTo(960 + R, 540); g.arc(960, 540, Math.max(0, R), 0, Math.PI * 2, true); g.fill('evenodd'); g.restore();
}
