// film.js — «10 правил, если тебя замело на ночной трассе»: one shot per spoken action, the lid slides in on every rule card.
import * as T from './toon.js';
import * as W from './world.js';
let g, CU, SEG = [], EV = [], SH = [0, 0], BIGW = [], FREEZE = [], STOP = null, SUB = null, CTA = null;
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { if (a == null) return 0; const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export async function init(cv, cues) {
  g = cv.getContext('2d'); CU = cues;
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  let prev = 'hook';
  for (const l of L) { const sc = l.kind === 'title' ? 'title' : (l.tags.scene || prev); prev = sc; const last = SEG[SEG.length - 1];
    if (last && last.scene === sc && sc !== 'title') last.lines.push(l); else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .2 }); }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .3; s.i = i; }); SEG[0].t0 = 0;
  SEG.forEach((s, i) => { if (s.scene === 'title') { s.prev = SEG[i - 1]; s.next = SEG[i + 1]; s.n = SEG.slice(0, i + 1).filter(x => x.scene === 'title').length; const h = [...cues.hud].reverse().find(x => x.t <= s.t1 + .5); s.clock = h ? h.time : ''; } });
  const wsc = (sc, pat, n = 0) => { for (const sg of SEG) if (sg.scene === sc) { const x = wt(sg, pat, n); if (x != null) return x; } return null; };
  STOP = wsc('final_frost', 'иней'); if (STOP != null) FREEZE.push([STOP, STOP + 1.5, STOP - .1]);
  const c0 = wsc('r7_cta', 'остановись'); if (c0 != null) CTA = { t0: c0, t1: (wsc('r7_cta', 'угадал') ?? c0 + 5) + 1 };
  SUB = cues.total * .35; for (const sg of SEG) if (sg.scene === 'title' && SUB > sg.t0 - 1 && SUB < sg.t1 + 3.6) SUB = sg.t1 + 4;
  if (STOP != null) ev(STOP, 'stop'); ev(SUB, 'subscribe'); if (CTA) ev(CTA.t0, 'poll');
  for (const e of cues.fx || []) if (e.type === 'danger' && e.value >= 85) ev(e.t, 'silence');
  for (const pg of cues.pages) { let pc = null; for (const w of pg.words) { if (w.c === 'danger' && pc !== 'danger') BIGW.push({ t: w.t0, w: w.w.replace(/[«»"“”.,:;!?—…]/g, '').toUpperCase() }); pc = w.c; } }
  for (const s of SEG) if (s.scene === 'title') { ev(s.t0, 'whoosh'); ev(s.t0 + .5, 'scratch', { d: 1.2, v: .8 }); }
  // foley on the spoken words
  const E = (sc, w, type, o = {}, n = 0, dt = 0) => { const x = wsc(sc, w, n); if (x != null) ev(x + dt, type, o); return x; };
  const run = (a, b, v = .8) => { if (a != null && b != null && b > a) ev(a, 'engine', { d: b - a, v }); };
  run(SEG.find(s => s.scene === 'drive')?.t0, wsc('stuck', 'бесполезно') ?? wsc('no_signal', 'достаешь'), .7);
  run(wsc('r2_key', 'кашляет'), wsc('r2_fuel', 'глушишь')); run(wsc('r8_knock', 'заводишь'), wsc('r8_clear', 'глушишь'));
  run(wsc('r10_dawn', 'рев'), CU.total - 1, 1.3);
  for (const [sc, w, n] of [['hook', 'постучал', 0], ['r8_knock', 'стук', 0], ['r8_figure', 'стук', 0]]) { const x = wsc(sc, w, n); if (x != null) for (const d of [0, .33, .66]) ev(x + d, 'knock', { v: 1.3 }); }
  E('r1_door', 'открываешь', 'door'); E('r1_back', 'захлопываешь', 'thud', { v: 1 }); E('r2_key', 'поворачиваешь', 'click'); E('r2_fuel', 'глушишь', 'click');
  E('r8_clear', 'глушишь', 'click'); E('stuck', 'заднюю', 'click'); E('stuck', 'первую', 'click'); E('no_signal', 'набираешь', 'beep'); E('no_signal', 'гудок', 'beep');
  E('glovebox', 'открываешь', 'bolt', { v: .6 }); E('r9_want', 'берешься', 'click'); E('final_frost', 'проступает', 'dawn', { v: 1.4 });
  for (let i = 0; i < 4; i++) E('r4_sleepy', 'звенит', 'beep', {}, 0, i * .35);
  for (let i = 0; i < 6; i++) E('r9_off', 'мигаешь', 'tick', { v: 1.2 }, 0, i * .5);
  E('r8_head', 'скрежет', 'scratch', { d: 7, v: 1.4 });
  for (let i = 0; i < 3; i++) E('r1_door', 'шага', 'step', {}, 0, i * .45);
  for (let i = 0; i < 4; i++) E('r8_clear', 'шаги', 'step', { v: .7 }, 0, i * .5);
  for (const w of ['дворники']) { const x = wsc('drive', w); if (x != null) for (let i = 0; i < 6; i++) ev(x + i * .98, 'whoosh', { v: .35 }); }
  E('r6_snow', 'бутылку', 'pour'); E('r10_rescue', 'откапывает', 'scratch', { d: 3, v: 1 });
  for (const b of cues.boxes) if (b.kind === 'dialog') ev(b.t0, 'whoosh', { v: .2 });
  return { draw, EV };
}
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0) { if (!seg) return null; let k = 0; const p = norm(pat); for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; } return null; }
function cam(x = 960, y = 540, z = 1) { T.setCam(x, y, z, SH[0], SH[1]); }
let t_ = 0;
function pick(seg, t, list) { let cur = list[0][1], last = -1e9; for (const [w, fn, n] of list) { const at = w == null ? seg.t0 : wt(seg, w, n || 0); if (at != null && t >= at - .1 && at - last >= 1.4) { cur = fn; last = at; } } return cur(); }
const at = (seg, w, n = 0) => wt(seg, w, n);
const k_ = (seg, w, d = .6, n = 0) => ss(at(seg, w, n), (at(seg, w, n) ?? 0) + d, t_);
const LY = i => 120 + (i - 1) * 80;
const night = { bg: '#1e2436' }, dawnBg = { bg: '#9aaccc' };
function lcd(txt, col = '#7affb0') { W.bg(g, '#1a1e24'); T.shape(g, T.rrect(460, 300, 1000, 420, 40), { fill: '#0e1418', lw: 10 }); T.text(g, txt, 960, 520, 230, col, { outline: false, font: 'JBMono', weight: 800 }); T.glowRings(g, 960, 520, 500, col, .06); }
function pedal(t, k) { W.bg(g, '#1a1c22'); T.shape(g, T.rrect(820, 520 + k * 60, 300, 380, 30), { fill: '#3a3a3a', lw: 8 }); for (let i = 0; i < 5; i++) T.line(g, [[850, 560 + k * 60 + i * 70], [1090, 560 + k * 60 + i * 70]], { line: '#5a5a5a', lw: 8, seed: i }); T.shape(g, [[500, 200 + k * 60], [860, 380 + k * 60], [1100, 560 + k * 60], [1000, 700 + k * 60], [420, 420 + k * 60]], { fill: '#3a2a20', shade: '#2a1e16', shadeOff: [0, -20] }); T.text(g, 'ГАЗ', 1350, 300, 90, '#ffb03a', {}); }
function lot(t, o = {}) { W.bg(g, '#f0d8a8'); T.shape(g, T.rect(-200, 760, 2400, 400), { fill: '#9a9a90', line: false }); W.carSide(g, t, 760, 820, .9, {}); T.shape(g, T.rect(1250, 300, 300, 120), { fill: '#fff', lw: 6 }); T.text(g, 'ДЁШЕВО', 1400, 360, 54, '#e2402f', { outline: false });
  if (o.seller) { T.person(g, 'keeper', 1500, 980, 1, { facing: -1, armF: -1.2, face: { eyes: 'half', brow: 'worried', look: [1, .6], side: 1 } }); W.you(g, 1180, 980, .95, { facing: 1, scarf: false, armF: -1, face: { eyes: 'open', smile: .4, look: [1, 0] } }); }
  T.tint(g, '#c89050', .22); }
function ctaBox(t, a, ans = false, q = 'ЧТО В ПРАВИЛЕ 7?') {
  g.save(); g.globalAlpha = a; rr(560, 250, 800, 360, 34); g.fillStyle = 'rgba(14,16,30,.92)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
  g.font = '900 58px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(q, 960, 330);
  if (ans) [['ДА', 760, '#3df2ff'], ['НЕТ', 1160, '#ff5a4a']].forEach(([lab, x, col]) => { rr(x - 150, 390, 300, 110, 26); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke(); g.font = '900 60px Rubik'; g.fillStyle = '#fff'; g.fillText(lab, x, 447); });
  else { rr(640, 395, 640, 100, 24); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.font = '800 46px JBMono'; g.fillStyle = '#ffd23f'; g.fillText('7. ' + '█'.repeat(Math.max(1, Math.floor(t * 6) % 12 + 3)) + (Math.floor(t * 3) % 2 ? '_' : ''), 960, 447); }
  g.font = '800 34px Rubik'; g.fillStyle = '#ffd23f'; g.fillText('💬 НАПИШИ В КОММЕНТАРИЯХ', 960, 560); g.restore();
}
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
const CAB = (o = {}) => W.cabin(g, t_, o);
const OUT = (o = {}) => W.outside(g, t_, o);
const FACE = (f, o = {}) => W.faceClose(g, t_, f, { ...night, ...o });
const SC = {
  hook(t, s) { return pick(s, t, [
    [null, () => { cam(); lcd('−32°', '#9fd8ff'); }],
    ['твою', () => { cam(); OUT({ bury: .92, tail: .3 }); }],
    ['мотор', () => { cam(1000, 480, 1.4); CAB({ snow: .9, heroP: { face: { eyes: 'wide', brow: 'up', look: [-1, 0], sweat: true } } }); }],
    ['кто', () => { cam(); OUT({ bury: .92, tail: .6, figure: .85, figX: 360 }); }],
    ['постучал', () => { cam(); W.knockWindow(g, t, [at(s, 'постучал'), at(s, 'постучал') + .33, at(s, 'постучал') + .66]); return { shake: at(s, 'постучал') }; }],
  ]); },
  hook_rules(t, s) { return pick(s, t, [
    [null, () => { cam(); W.lid(g, t, { dark: .25 }); }],
    ['восьмое', () => { cam(); W.lid(g, t, { circle: [8, k_(s, 'восьмое', .8)], dark: .25 }); }],
  ]); },
  hook_hidden(t, s) { return pick(s, t, [
    [null, () => { cam(1080, LY(7), 1.5); W.lid(g, t, { q: true }); }],
    ['доживешь', () => { cam(); FACE({ eyes: 'wide', brow: 'up', look: [0, -.4], sweat: true }, { breath: true, night: .35 }); }],
  ]); },
  rewind(t, s) { cam(); const k = ss(s.t0, s.t1, t), m = Math.round(3 * 60 + 40 - k * 6 * 60), hh = ((Math.floor(m / 60) % 24) + 24) % 24, mm = ((m % 60) + 60) % 60;
    lcd(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, '#ffd23f'); g.save(); g.globalAlpha = .45; g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const y = ((t * 900 + i * 197) % 1200) - 60; g.fillRect(0, y, 1920, 6 + (i % 3) * 4); } g.restore(); T.text(g, '◀◀ 6 ЧАСОВ НАЗАД', 960, 830, 80, '#fff6c8', { fixed: true }); },
  drive(t, s) { return pick(s, t, [
    [null, () => { cam(); OUT({ head: 1, tail: .5, dark: false }); }],
    ['дворники', () => { cam(); W.windshield(g, t, { wipers: true }); }],
    ['навигатор', () => { cam(1390, 790, 2.1); W.windshield(g, t, { wipers: true, nav: true }); }],
    ['зеркале', () => { cam(); W.mirrorClose(g, t); }],
  ]); },
  car_history(t, s) { return pick(s, t, [
    [null, () => { cam(); lot(t); }],
    ['продавец', () => { cam(1320, 560, 1.7); lot(t, { seller: true }); }],
    ['замерз', () => { cam(); W.outside(g, 0, { bury: .5, dawn: 1, noStorm: true }); T.shape(g, T.rect(-200, 840, 2400, 300), { fill: '#7ab04a', line: false }); T.tint(g, '#c89050', .25); }],
  ]); },
  stuck(t, s) { return pick(s, t, [
    [null, () => { cam(); W.wheelClose(g, t, { spin: true }); }],
    ['ныряет', () => { cam(); OUT({ bury: .3 * k_(s, 'ныряет', .6), head: 1, tail: .5 }); return { shake: at(s, 'встает') }; }],
    ['давишь', () => { cam(); pedal(t, k_(s, 'давишь', .3)); }],
    ['ревет', () => { cam(); W.wheelClose(g, t, { spin: true }); return { shake: at(s, 'ревет') }; }],
    ['заднюю', () => { cam(); W.gearClose(g, t, t >= (at(s, 'первую') ?? 1e9) ? '1' : 'R'); }],
    ['глубже', () => { cam(); OUT({ bury: .3 + .15 * k_(s, 'глубже', 1), head: 1, tail: .5 }); }],
  ]); },
  no_signal(t, s) { return pick(s, t, [
    [null, () => { cam(); W.phoneClose(g, t, { bars: 1, screen: 'call', clock: '22:20' }); }],
    ['гудок', () => { cam(); W.phoneClose(g, t, { bars: 1, screen: 'call', failed: true, clock: '22:20' }); }],
    ['пишешь', () => { cam(); W.phoneClose(g, t, { bars: 1, screen: 'sms', clock: '22:21' }); }],
    ['заряда', () => { cam(1130, 200, 2.6); W.phoneClose(g, t, { bars: 1, screen: 'sms', clock: '22:21' }); }],
  ]); },
  glovebox(t, s) { return pick(s, t, [
    [null, () => { cam(1500, 560, 1.7); CAB({ engine: false, gloveOpen: true, heroP: { armF: 1.7, lean: .4, face: { eyes: 'open', brow: 'worried', look: [1, .5] } }, holes: [{ x: 1690, y: 660, r: 260 }] }); }],
    ['замираешь', () => { cam(); FACE({ eyes: 'wide', brow: 'up', look: [1, .5] }, { night: .3, glow: [1500, 700, '#bfe8ff'] }); }],
    ['царапины', () => { cam(); W.lid(g, t, { show: Math.floor(1 + (t - at(s, 'царапины')) * 4), dark: .2 }); }],
  ]); },
  glovebox_7(t, s) { return pick(s, t, [
    [null, () => { cam(1080, LY(7), 1.5); W.lid(g, t, { q: true }); }],
    ['подпись', () => { cam(1560, 900, 2); W.lid(g, t, {}); }],
  ]); },
  r1_door(t, s) { return pick(s, t, [
    [null, () => { cam(1100, 640, 1.2); OUT({ head: .5, tail: .4 }); W.you(g, 1340, 900, .85, { facing: 1, armF: -1.6, armB: .4, face: { eyes: 'half', brow: 'worried', look: [1, 0] } }); }],
    ['ветер', () => { cam(1300, 600, 1.6); OUT({ head: .5, tail: .4, storm: 260 }); W.you(g, 1340, 900, .85, { facing: -1, armF: -2.6, armB: -2, lean: -.3, face: { eyes: 'closed', brow: 'worried', mouth: .5 } }); return { shake: at(s, 'вырывает') }; }],
    ['снег', () => { cam(); FACE({ eyes: 'closed', brow: 'angry', mouth: .3 }, { bg: '#c8d2e4' }); W.blizzard(g, t * 1.5, 260, .95); }],
    ['шага', () => { cam(); W.bg(g, '#d8e0ee'); W.blizzard(g, t, 300, .9, '#ffffff'); T.glowRings(g, 300, 600, 80, '#fff6c8', .15 * (1 - k_(s, 'видишь', 1.2))); W.you(g, 1100, 900, .7, { walk: t * 4, facing: 1, face: { eyes: 'half', brow: 'worried', look: [-1, 0] } }); T.text(g, '3 ШАГА', 960, 200, 90, '#2a3450', { fixed: true }); }],
  ]); },
  r1_back(t, s) { return pick(s, t, [
    [null, () => { cam(); W.bg(g, '#d8e0ee'); for (let i = 0; i < 6; i++) T.shape(g, T.ell(400 + i * 180, 900 - (i % 2) * 20, 40, 14, 12), { fill: `rgba(120,140,170,${.6 - k_(s, 'заметает', 2) * .5})`, line: false, seed: i }); W.blizzard(g, t, 300, .9); W.you(g, 1300, 900, .8, { walk: -t * 3, facing: -1, armF: -1.5, face: { eyes: 'half', brow: 'worried', look: [-1, .5] } }); }],
    ['падаешь', () => { cam(1000, 480, 1.4); CAB({ snow: .1, heroP: { face: { eyes: 'closed', brow: 'worried', mouth: .5 } } }); return { shake: at(s, 'захлопываешь') }; }],
    ['трясешь', () => { cam(); FACE({ eyes: 'wide', brow: 'worried', mouth: .3 }, { hands: true, night: .2 }); }],
    ['люди', () => { cam(); OUT({ head: .3, tail: .4, steps: true, stepsFrom: 420, dark: false }); T.line(g, [[330, 960], [420, 960]], { line: '#ff3a2a', lw: 8 }); T.text(g, '10 ШАГОВ', 960, 200, 90, '#fff6c8', { fixed: true }); }],
  ]); },
  r2_key(t, s) { return pick(s, t, [
    [null, () => { cam(); W.ignition(g, t, k_(s, 'поворачиваешь', .5)); }],
    ['кашляет', () => { cam(); OUT({ bury: .3, tail: 1, exhaust: true }); return { shake: at(s, 'кашляет') }; }],
    ['печки', () => { cam(); W.heater(g, t); }],
  ]); },
  r2_fuel(t, s) { return pick(s, t, [
    [null, () => { cam(); W.fuel(g, t, .55); }],
    ['десять', () => { cam(); W.fuel(g, t, .55); T.text(g, '10 МИН / ЧАС', 960, 860, 90, '#fff6c8', { fixed: true }); }],
    ['ставишь', () => { const a = at(s, 'ставишь'), sec = Math.max(0, 600 - Math.floor((t - a) * 60)); cam(); W.phoneClose(g, t, { screen: 'timer', value: `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, clock: '23:00' }); }],
    ['глушишь', () => { cam(); W.ignition(g, t, 1 - k_(s, 'глушишь', .5)); }],
    ['тишина', () => { cam(1000, 480, 1.4); CAB({ snow: .2, heroP: { face: { eyes: 'open', brow: 'worried', look: [-1, -.3] } } }); }],
  ]); },
  r3_window(t, s) { return pick(s, t, [
    [null, () => { cam(); W.windowCrack(g, t, k_(s, 'опускаешь', 1)); }],
    ['хочется', () => { cam(); FACE({ eyes: 'half', brow: 'worried', mouth: .2 }, { breath: true }); }],
    ['процарапано', () => { cam(1080, LY(3) + 20, 1.5); W.lid(g, t, {}); T.text(g, 'угарный газ не пахнет. ты просто уснёшь', 540, LY(3) + 42, 34, '#c8ccd4', { align: 'left', font: 'Caveat', weight: 700, outline: false }); }],
    ['седьмую', () => { cam(1080, LY(7), 1.5); W.lid(g, t, { q: true }); }],
  ]); },
  r4_sleepy(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'sad', look: [0, .5] }, { breath: true, night: .35 }); }],
    ['опасное', () => { cam(); FACE({ eyes: 'closed', brow: 'neutral', smile: .2 }, { night: .5, tint: ['#9fd8ff', .12] }); }],
    ['будильник', () => { cam(); W.phoneClose(g, t, { screen: 'timer', value: '20:00', clock: '00:40' }); }],
    ['щиплешь', () => { cam(); FACE({ eyes: 'open', brow: 'angry', mouth: .3 }, { pinch: true, night: .3 }); }],
    ['шевелишь', () => { cam(); W.boot(g, t); }],
    ['звенит', () => { cam(); W.phoneClose(g, t, { screen: 'alarm', value: '01:00', clock: '01:00' }); return { shake: at(s, 'звенит') }; }],
    ['руки', () => { cam(); FACE({ eyes: 'wide', brow: 'worried' }, { hands: true, night: .3 }); }],
    ['дышишь', () => { cam(); FACE({ eyes: 'half', brow: 'worried', mouth: .4 }, { hands: true, breath: true, night: .3 }); }],
  ]); },
  r4_breath(t, s) { return pick(s, t, [
    [null, () => { cam(); W.frostGlass(g, t, .2 + .5 * k_(s, 'застывает', 2)); }],
    ['снаружи', () => { cam(); OUT({ bury: .55 }); }],
    ['сидишь', () => { cam(1000, 480, 1.3); CAB({ snow: .6, frost: .6, heroP: { armF: .3, armB: .2, face: { eyes: 'half', brow: 'sad', look: [0, .4] } } }); }],
  ]); },
  r5_scarf(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'open', brow: 'worried', look: [0, .6] }, { night: .3 }); W.hand(g, 1100, 860, 1.1, -1.2, { grip: true }); }],
    ['привязываешь', () => { cam(); W.antennaClose(g, t, { scarf: true, tying: true }); }],
    ['бьется', () => { cam(); W.antennaClose(g, t, { scarf: true }); }],
    ['утром', () => { cam(); OUT({ bury: .6, scarf: true }); }],
  ]); },
  r6_snow(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'sad', mouth: .2 }, { night: .35 }); }],
    ['сгребаешь', () => { cam(); W.windowCrack(g, t, 1); W.hand(g, 900, 300, 1, -1.6, { grip: true }); }],
    ['подносишь', () => { cam(); W.snowHand(g, t, {}); }],
    ['останавливаешься', () => { cam(); W.snowHand(g, t, { stop: true }); }],
    ['бутылку', () => { cam(); W.snowHand(g, t, { bottle: true }); }],
    ['пьешь', () => { cam(); W.snowHand(g, t, { bottle: true, melted: true }); }],
  ]); },
  r7_light(t, s) { return pick(s, t, [
    [null, () => { cam(); W.lid(g, t, { beam: [860, LY(7)], dark: .55 }); }],
    ['труба', () => { cam(1080, LY(7), 1.5); W.lid(g, t, { beam: [1060, LY(7)], word: true, dark: .4 }); }],
    ['понимаешь', () => { cam(); FACE({ eyes: 'open', brow: 'worried', look: [1, .3], side: .3 }, { night: .3, glow: [1500, 700, '#fff6c8'] }); }],
  ]); },
  r7_cta(t, s) { cam(1080, LY(7), 1.3); W.lid(g, t, { q: true, dark: .35 }); },
  r8_knock(t, s) { const k = at(s, 'стук'); return pick(s, t, [
    [null, () => { cam(); W.ignition(g, t, k_(s, 'заводишь', .5)); }],
    ['стук', () => { cam(); W.knockWindow(g, t, [k, k + .33, k + .66]); return { shake: k }; }],
    ['поворачиваешь', () => { cam(); FACE({ eyes: 'wide', brow: 'up', look: [-1, 0], side: -.6, sweat: true }, { night: .35 }); }],
    ['никого', () => { cam(); W.knockWindow(g, t, []); }],
  ]); },
  r8_figure(t, s) { const k = at(s, 'стук'); return pick(s, t, [
    [null, () => { cam(600, 420, 1.5); CAB({ snow: .7, engine: true }); if (k != null && t - k < .9) T.text(g, 'ТУК!', 340, 300, 70, '#fff6c8', {}); return { shake: k }; }],
    ['красном', () => { cam(700, 640, 1.2); OUT({ bury: .7, tail: 1, figure: 1, figX: 360, exhaust: true }); }],
    ['длинным', () => { cam(420, 640, 2.1); OUT({ bury: .7, tail: 1, figure: 1, figX: 360 }); }],
    ['тень', () => { cam(); CAB({ snow: .7, engine: true, shadow: k_(s, 'проходит', 3.5), heroP: { face: { eyes: 'wide', brow: 'up', look: [-1, -.2], sweat: true } } }); }],
  ]); },
  r8_hold(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'wide', brow: 'up', look: [-1, 0], sweat: true }, { night: .3 }); }],
    ['сердце', () => { cam(); FACE({ eyes: 'wide', brow: 'up', look: [-1, 0], sweat: true }, { night: .3 }); T.text(g, 'ТУК-ТУК', 1520, 760, 80 + Math.abs(Math.sin(t * 7)) * 18, '#ff8a7a', { fixed: true, rot: -.1 }); }],
    ['рука', () => { cam(); W.buttonHand(g, t, k_(s, 'тянется', 1.5)); }],
    ['убираешь', () => { cam(); W.buttonHand(g, t, 1 - k_(s, 'убираешь', .8)); }],
    ['снаружи', () => { cam(); OUT({ bury: .72, tail: .6, storm: 220 }); }],
  ]); },
  r8_head(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'worried', mouth: .2 }, { pain: true, night: .3, tint: ['#7a2a5a', .12] }); }],
    ['мотор', () => { cam(); W.phoneClose(g, t, { screen: 'alarm', value: '+20:14', clock: '03:10' }); }],
    ['скрежет', () => { cam(); W.trunkScrape(g, t); }],
    ['полосой', () => { cam(340, 380, 2); CAB({ snow: .85, stripe: true, engine: true }); }],
  ]); },
  r8_clear(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'neutral', look: [-1, 0] }, { night: .3 }); }],
    ['глушишь', () => { cam(); W.ignition(g, t, 1 - k_(s, 'глушишь', .5)); }],
    ['шаги', () => { cam(); const k = k_(s, 'шаги', 2.5); OUT({ bury: .75, figure: 1 - k, figX: 360 - k * 300, steps: true, stepsFrom: 460 }); }],
  ]); },
  r9_lights(t, s) { return pick(s, t, [
    [null, () => { cam(); W.windshield(g, t, { lights: k_(s, 'загораются', .8), beams: false }); }],
    ['двигаются', () => { cam(); OUT({ bury: .78, lights: 1 }); }],
    ['смотрят', () => { cam(); FACE({ eyes: 'wide', brow: 'up', look: [1, -.2], side: .4 }, { night: .45, lx: 1700, ly: 300, glow: [1800, 300, '#ffe08a'] }); }],
  ]); },
  r9_want(t, s) { return pick(s, t, [
    [null, () => { cam(); W.windshield(g, t, { lights: 1, beams: false }); }],
    ['берешься', () => { cam(); W.handle(g, t, k_(s, 'берешься', .8)); }],
    ['перечитываешь', () => { cam(); W.lid(g, t, { circle: [9, k_(s, 'перечитываешь', .8)], dark: .3 }); }],
    ['отпускаешь', () => { cam(); W.handle(g, t, 1 - k_(s, 'отпускаешь', .8)); }],
  ]); },
  r9_off(t, s) { return pick(s, t, [
    [null, () => { cam(); W.hazard(g, t); }],
    ['отвечают', () => { cam(); W.windshield(g, t, { lights: 1, beams: false }); }],
    ['гаснут', () => { cam(); W.windshield(g, t, { lights: 1 - k_(s, 'гаснут', .15), beams: false }); return { shake: at(s, 'гаснут') }; }],
  ]); },
  r10_dawn(t, s) { return pick(s, t, [
    [null, () => { cam(1000, 480, 1.3); CAB({ dawn: 1, snow: .9, frost: .7, heroP: { face: { eyes: 'half', brow: 'sad', look: [1, 0] } } }); }],
    ['бензина', () => { cam(); W.fuel(g, t, Math.floor(t * 3) % 2 ? .04 : .06); }],
    ['рук', () => { cam(); FACE({ eyes: 'half', brow: 'sad' }, { ...dawnBg, hands: true, frostbite: true }); }],
    ['рев', () => { cam(1000, 480, 1.3); CAB({ dawn: 1, snow: .9, plow: true, heroP: { face: { eyes: 'wide', brow: 'up', look: [1, 0] } } }); return { shake: at(s, 'рев') }; }],
    ['оранжевая', () => { cam(); OUT({ dawn: 1, bury: .85, plow: true, plowX: 1700 - k_(s, 'оранжевая', 4) * 200, scarf: true }); }],
  ]); },
  r10_rescue(t, s) { return pick(s, t, [
    [null, () => { cam(1000, 640, 1.2); OUT({ dawn: 1, bury: .8, plow: true, plowX: 1700, scarf: true }); const r = T.person(g, 'rescuer', 1260, 880, .9, { facing: -1, armF: -1.8, armB: -1.4, lean: .3, face: { eyes: 'open', brow: 'angry', mouth: .2 } }); T.line(g, [[r.hand[0], r.hand[1]], [r.hand[0] - 120, r.hand[1] + 160]], { lw: 12 }); }],
    ['протягивает', () => { cam(); W.bg(g, '#c8d4e8'); T.glowRings(g, 960, 300, 700, '#fff6e0', .4); W.blizzard(g, t, 40, .4); T.person(g, 'rescuer', 960, 1300, 1.7, { armF: -2.2, face: { eyes: 'open', brow: 'up', smile: .4, look: [0, 1] } }); }],
    ['живой', () => { cam(); W.bg(g, '#c8d4e8'); T.face(g, 960, 470, 280, T.CAST.rescuer, { eyes: 'open', brow: 'angry', mouth: .4, look: [0, .3] }); }],
    ['трубу', () => { cam(420, 780, 2.2); OUT({ dawn: 1, bury: .8, pipeClear: true, noStorm: true }); }],
    ['мотаешь', () => { cam(); FACE({ eyes: 'open', brow: 'worried', side: Math.sin(t * 6) * .6, look: [Math.sin(t * 6), 0] }, dawnBg); }],
  ]); },
  final_steps(t, s) { return pick(s, t, [
    [null, () => { cam(); OUT({ dawn: 1, bury: .8, pipeClear: true, steps: true, stepsFrom: 440, noStorm: true }); }],
    ['мужика', () => { cam(); OUT({ bury: .9, storm: 200, tail: 0 }); T.tint(g, '#c89050', .25); }],
    ['угорел', () => { cam(1000, 480, 1.3); CAB({ snow: .95, engine: true, heroP: { face: { eyes: 'closed', brow: 'sad' } } }); T.tint(g, '#c89050', .3); }],
  ]); },
  final_post(t, s) { return pick(s, t, [
    [null, () => { cam(); OUT({ dawn: 1, bury: .8, post: true, steps: true, stepsFrom: 440, noStorm: true }); }],
    ['венок', () => { cam(); W.plaque(g, t); }],
  ]); },
  final_frost(t, s) { const p = at(s, 'проступает'); return pick(s, t, [
    [null, () => { cam(); OUT({ dawn: 1, bury: .8, pipeClear: true, noStorm: true }); W.you(g, 1150 - k_(s, 'возвращаешься', 3) * 200, 900, .8, { walk: t * 4, facing: -1, face: { eyes: 'half', brow: 'sad', look: [-1, 0] } }); }],
    ['открываешь', () => { cam(); W.lid(g, t, { frostAll: .4 }); }],
    ['иней', () => { cam(); W.lid(g, t, { frostAll: .9 }); }],
    ['проступает', () => { cam(1100, LY(7), 1.2); W.lid(g, t, { frostAll: .9, frost: ss(p, p + 4.5, t) }); }],
  ]); },
  outro(t, s) { return pick(s, t, [
    [null, () => { cam(700, 640, 1.2); OUT({ bury: .75, tail: .8, figure: .9, figX: 360, exhaust: true }); T.tint(g, '#ffb070', .12); }],
    ['стучал', () => { cam(); W.knockWindow(g, t, []); T.glowRings(g, 960, 480, 500, '#ffd890', .2); }, 1],
    ['закрываешь', () => { cam(); W.lid(g, t, { frostAll: .9, frost: 1 }); }],
    ['спасибо', () => { cam(); FACE({ eyes: 'half', brow: 'sad', smile: .5, tear: true }, dawnBg); }],
  ]); },
  question(t, s) { cam(); OUT({ dawn: 1, bury: .3, pipeClear: true, plow: true, plowX: 1700, noStorm: true, scarf: true }); W.you(g, 1260, 900, .85, { facing: -1, face: { eyes: 'open', smile: .3, look: [-1, 0] } }); },
  title(t, s) {
    const k = ss(s.t0, s.t0 + .45, t);
    if (k < 1 && s.prev && SC[s.prev.scene]) { SC[s.prev.scene](s.t0 - .01, s.prev); T.setCam(); }
    g.save(); g.translate(0, (1 - k) * 1100);
    if (s.n === 7) W.lid(g, t, { q: true });
    else if (s.n <= 10) W.lid(g, t, { circle: [s.n, ss(s.t0 + .5, s.t0 + 1.3, t)] });
    else W.lid(g, t, { frostAll: .5 });
    g.restore();
    const tag = s.clock || '', n = Math.floor(clamp((t - s.t0 - .5) * 20, 0, tag.length));
    if (n) { g.save(); g.font = '800 46px JBMono'; g.textBaseline = 'middle'; const w = g.measureText(tag).width; g.fillStyle = 'rgba(14,16,30,.85)'; g.fillRect(40, 754, w + 48, 72); g.strokeStyle = '#9fd8ff'; g.lineWidth = 4; g.strokeRect(40, 754, w + 48, 72); g.fillStyle = '#9fd8ff'; g.fillText(tag.slice(0, n), 64, 790); g.restore(); }
  },
};
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function shakeAt(t, t0, amp = 22) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[1, -1, .8, -.7, .5, -.4, .3, -.1, 0][k] * amp, [.3, -.6, .5, -.3, .2, -.2, .1, 0, 0][k] * amp]; }
const DBG = new URLSearchParams(location.search).get('dbg');
function draw(t) {
  if (DBG) { t_ = t; g.setTransform(1, 0, 0, 1, 0, 0); T.setCam(); ({ cabin: () => CAB({ engine: true }), cabin2: () => CAB({ snow: .6, frost: .5, shadow: .4 }), out: () => OUT({ bury: .7, tail: 1, figure: 1, figX: 360, scarf: true, lights: 1 }), gear: () => W.gearClose(g, t, 'R') })[DBG](); return; }
  const tReal = t; for (const [a, b, ft] of FREEZE) if (t >= a && t < b) t = ft ?? a;
  t_ = t; T.setTime(t); const s = segAt(t), f = SC[s.scene] || SC.hook;
  SH = [0, 0]; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
  let r = f(t, s) || {};
  if (r.shake != null && t > r.shake && t < r.shake + .4) { SH = shakeAt(t, r.shake); g.fillRect(0, 0, 1920, 1080); r = f(t, s) || {}; }
  T.setCam(); T.setRot(0); t = tReal;
  if (FREEZE.some(([a, b]) => t >= a && t < b)) T.tint(g, '#1a1030', .25);
  extras(t, s);
  for (const b of BIGW) if (t >= b.t && t < b.t + .7 && s.scene !== 'title') { const p = (t - b.t) / .7, sc = p < .15 ? .6 + p / .15 * .5 : 1.1 - .1 * p; g.save(); g.globalAlpha = p > .75 ? (1 - p) / .25 : 1; g.translate(960, 470); g.rotate(-.06); g.scale(sc, sc); let fs = 190; g.font = `900 ${fs}px Rubik`; while (g.measureText(b.w).width > 1500 && fs > 70) { fs -= 10; g.font = `900 ${fs}px Rubik`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 34; g.strokeStyle = T.INK; g.strokeText(b.w, 0, 0); g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText(b.w, 0, 0); g.fillStyle = '#ff3a2a'; g.fillText(b.w, 0, 0); g.restore(); }
  if (t > CU.total - .8) T.tint(g, '#000', (t - (CU.total - .8)) / .8);
}
function extras(t, s) {
  g.save(); g.textBaseline = 'middle';
  if (CTA && t >= CTA.t0 && t < CTA.t1) ctaBox(t, Math.min(clamp((t - CTA.t0) / .25), clamp((CTA.t1 - t) / .3)));
  if (s.scene === 'question') ctaBox(t, clamp((t - s.t0) / .3), true, 'А ТЫ БЫ ОПУСТИЛ ОКНО?');
  if (STOP != null && t >= STOP && t < STOP + 1.5) { const k = t - STOP, n = 3 - Math.floor(k / .5);
    g.save(); g.translate(960, 420); g.rotate(-.08); g.font = '900 230px Rubik'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 40; g.strokeStyle = '#231629'; g.strokeText('СТОП', 0, 0); g.lineWidth = 14; g.strokeStyle = '#fff'; g.strokeText('СТОП', 0, 0); g.fillStyle = '#ff3a2a'; g.fillText('СТОП', 0, 0); g.restore();
    if (n > 0) { g.font = '900 120px Rubik'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#231629'; g.strokeText(String(n), 960, 620); g.fillStyle = '#ffd23f'; g.fillText(String(n), 960, 620); } }
  const subPop = (t0) => { if (t < t0 || t >= t0 + 3.2) return; const k = t - t0, a = Math.min(clamp(k / .3), clamp((3.2 - k) / .3)), pressed = k > 1.3, x = 1460 + (1 - a) * 500, y = 860;
    g.globalAlpha = a; rr(x, y - 50, 400, 100, 50); g.fillStyle = pressed ? '#5a5a6a' : '#e62117'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.font = '900 40px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(pressed ? 'ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ', x + 200, y + 2);
    const sw = pressed ? Math.sin(k * 25) * .4 * clamp(1 - (k - 1.3) / 1) : 0; g.save(); g.translate(x + 440, y); g.rotate(sw); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-26, 18); g.quadraticCurveTo(-26, -30, 0, -32); g.quadraticCurveTo(26, -30, 26, 18); g.closePath(); g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 5; g.stroke(); g.beginPath(); g.arc(0, 24, 7, 0, 7); g.fill(); g.restore(); g.globalAlpha = 1; };
  if (SUB != null) subPop(SUB); const q = SEG.find(x => x.scene === 'question'); if (q) { const ps = wt(q, 'подпишись'); if (ps != null) subPop(ps - .3); }
  g.restore();
}
