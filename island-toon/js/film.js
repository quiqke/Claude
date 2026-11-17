// film.js — «7 дней на необитаемом острове»: one shot per spoken action; every day opens on a diary page.
import * as T from './toon.js';
import * as W from './world.js';
let g, CU, SEG = [], EV = [], SH = [0, 0], BIGW = [], FREEZE = [], STOP = null, SUB = null, CTA = null;
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { if (a == null) return 0; const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const DAYW = ['', 'первый', 'второй', 'третий', 'четвёртый', 'пятый', 'шестой', 'седьмой'];

export async function init(cv, cues) {
  g = cv.getContext('2d'); CU = cues;
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  let prev = 'hook';
  for (const l of L) { const sc = l.kind === 'title' ? 'title' : (l.tags.scene || prev); prev = sc; const last = SEG[SEG.length - 1];
    if (last && last.scene === sc && sc !== 'title') last.lines.push(l); else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .2 }); }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .3; s.i = i; }); SEG[0].t0 = 0;
  SEG.forEach((s, i) => { if (s.scene === 'title') { s.prev = SEG[i - 1]; s.n = SEG.slice(0, i + 1).filter(x => x.scene === 'title').length; } });
  const wsc = (sc, pat, n = 0) => { for (const sg of SEG) if (sg.scene === sc) { const x = wt(sg, pat, n); if (x != null) return x; } return null; };
  STOP = wsc('final_photo', 'выпадает'); if (STOP != null) FREEZE.push([STOP, STOP + 1.5, STOP - .1]);
  const c0 = wsc('d3_cta', 'остановись'); if (c0 != null) CTA = { t0: c0, t1: (wsc('d3_cta', 'угадал') ?? c0 + 5) + 1 };
  SUB = cues.total * .35; for (const sg of SEG) if (sg.scene === 'title' && SUB > sg.t0 - 1 && SUB < sg.t1 + 3.6) SUB = sg.t1 + 4;
  if (STOP != null) ev(STOP, 'stop'); ev(SUB, 'subscribe'); if (CTA) ev(CTA.t0, 'poll');
  for (const e of cues.fx || []) if (e.type === 'danger' && e.value >= 85) ev(e.t, 'silence');
  for (const pg of cues.pages) { let pc = null; for (const w of pg.words) { if (w.c === 'danger' && pc !== 'danger') BIGW.push({ t: w.t0, w: w.w.replace(/[«»"“”.,:;!?—…]/g, '').toUpperCase() }); pc = w.c; } }
  for (const s of SEG) if (s.scene === 'title') { ev(s.t0, 'whoosh'); ev(s.t0 + .4, 'scribble', { d: 1.4, v: .9 }); }
  const E = (sc, w, type, o = {}, n = 0, dt = 0) => { const x = wsc(sc, w, n); if (x != null) ev(x + dt, type, o); return x; };
  for (let i = 0; i < 6; i++) E('ferry_sink', 'сирена', 'beep', { v: .8 }, 0, i * .45);
  E('ferry_sink', 'волна', 'hit', { v: 1.3 }); E('ferry_sink', 'черная', 'sub'); E('d1_inventory', 'щелкает', 'click'); E('d1_inventory', 'щелкает', 'click', {}, 0, .3);
  for (let i = 0; i < 4; i++) E('d1_sos', 'таскаешь', 'thud', { v: .5 }, 0, i * .6);
  E('d1_sea', 'выливаешь', 'pour'); E('d2_coconut', 'срываешься', 'thud'); E('d2_coconut', 'сбиваешь', 'knock', { v: 1.2 }); E('d2_coconut', 'ножом', 'scratch', { d: 1, v: .8 });
  E('d3_open', 'разворачиваешь', 'paper', { v: .9 }); E('d3_shock', 'листаешь', 'paper', { v: .9 }); E('d6_last', 'открываешь', 'paper', { v: .9 }); E('final_photo', 'открываешь', 'paper', { v: .9 });
  E('d4_fire', 'вспыхивает', 'fire', { d: 6, v: 1 }); E('d4_fish', 'жаришь', 'fire', { d: 4, v: .8 }); E('d7_fire', 'поджигаешь', 'fire', { d: 16, v: 1.4 });
  for (let i = 0; i < 3; i++) E('d4_fish', 'мимо', 'splat', { v: .7 }, 0, i * .5);
  E('d5_sky', 'небо', 'rain', { d: 18, v: 1.2 }); E('d5_cave', 'волны', 'hit', { v: 1.2 }); E('d5_sky', 'ветер', 'hit', { v: .7 });
  E('d7_turn', 'гудок', 'horn', { v: 1.2 }); E('d6_ship', 'дым', 'horn', { v: .35 });
  for (const b of cues.boxes) if (b.kind === 'note') ev(b.t0, 'scribble', { d: Math.min(3, b.t1 - b.t0), v: .8 });
  return { draw, EV };
}
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0) { if (!seg) return null; let k = 0; const p = norm(pat); for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; } return null; }
function cam(x = 960, y = 540, z = 1) { T.setCam(x, y, z, SH[0], SH[1]); }
let t_ = 0;
function pick(seg, t, list) { let cur = list[0][1], last = -1e9; for (const [w, fn, n] of list) { const at = w == null ? seg.t0 : wt(seg, w, n || 0); if (at != null && t >= at - .1 && at - last >= 1.4) { cur = fn; last = at; } } return cur(); }
const at = (seg, w, n = 0) => wt(seg, w, n);
const k_ = (seg, w, d = .6, n = 0) => ss(at(seg, w, n), (at(seg, w, n) ?? 0) + d, t_);
const ISL = (o = {}) => W.island(g, t_, o);
const FACE = (f, o = {}) => W.faceClose(g, t_, f, o);
const DIA = (o = {}) => W.diary(g, t_, o);
const sepia = (a = .3) => T.tint(g, '#c89050', a);
function harbor(t) { W.bg(g, '#f0d0a0'); T.bands(g, 1920, [0, 300], ['#f0c890', '#f8dcb0']); W.sea(g, t, 520, {}); W.ship(g, t, 1300 + (t % 20) * 4, 500, 1.1); T.shape(g, T.rect(-100, 760, 1100, 400), { fill: '#8a6a4a', line: false }); T.person(g, 'kid', 600, 780, 1.6, { armF: -2.7, facing: 1, face: { eyes: 'open', brow: 'sad', look: [1, -.3] } }); sepia(.32); }
function vest(t, k) { W.bg(g, '#1a2238'); T.shape(g, [[560, 200], [1360, 200], [1420, 1100], [500, 1100]], { fill: '#ff7a1a', shade: '#d85a0a', shadeOff: [-30, 0] }); for (const y of [500, 760]) T.line(g, [[480, y], [1440, y + k * 10]], { line: '#1a1a1a', lw: 26 }); W.hand(g, 700 + k * 120, 520, 1.2, -.1, { grip: true }); W.hand(g, 1220 - k * 120, 540, 1.2, Math.PI + .1, { grip: true }); }
function aerial(t) { W.bg(g, W.C.sea); for (let r = 0; r < 10; r++) T.line(g, Array.from({ length: 22 }, (_, i) => [-100 + i * 100, r * 120 + Math.sin(i + t + r) * 8]), { line: 'rgba(255,255,255,.3)', lw: 4, seed: r }); T.shape(g, T.ell(960, 540, 260, 170, 30), { fill: W.C.sand, shade: W.C.sandS, shadeOff: [0, -20] }); T.shape(g, T.ell(940, 520, 170, 100, 24), { fill: '#3a9a4a', line: false }); T.shape(g, T.ell(1100, 480, 70, 60, 16), { fill: W.C.rock, line: false }); T.text(g, '1 ЧАС ПЕШКОМ', 960, 860, 70, '#fff6c8', {}); }
function torch(t) { W.bg(g, '#e8a0a0'); T.bands(g, 1920, [0, 300, 600], ['#7a8ac8', '#e8a0a0', '#f8d098']); const sh = Math.sin(t * 30) * 6; T.line(g, [[900 + sh, 1100], [1060 + sh, 380]], { line: '#6a4a2a', lw: 30 }); W.flame(g, t, 1070 + sh, 400, 1.3); W.hand(g, 820 + sh, 900, 1.4, -1.35, { grip: true }); }
function stickSharp(t) { W.bg(g, W.C.sand); T.line(g, [[400, 760], [1500, 520]], { line: '#9a6a3a', lw: 30 }); T.shape(g, [[1500, 520], [1600, 490], [1500, 540]], { fill: '#c89a6a', lw: 6 }); T.shape(g, [[1360, 470], [1560, 380], [1580, 410], [1380, 500]], { fill: '#c8ccd4', lw: 5 }); for (let i = 0; i < 6; i++) { const ph = (t * 1.5 + i / 6) % 1; T.shape(g, T.ell(1420 - ph * 200, 560 + ph * 300, 16, 8, 10), { fill: '#e8c89a', lw: 3, seed: i }); } W.hand(g, 1600, 360, 1, -2.6, { grip: true }); }
function fishCoals(t) { W.bg(g, '#1a1410'); W.flame(g, t, 960, 760, 1.4); T.shape(g, [[760, 560], [1060, 520], [1180, 560], [1060, 610]], { fill: '#d8a060', lw: 6 }); T.shape(g, [[1180, 560], [1260, 520], [1260, 600]], { fill: '#d8a060', lw: 6 }); T.line(g, [[600, 600], [1360, 540]], { line: '#6a4a2a', lw: 12 }); }
function leaves(t) { W.bg(g, W.C.sand); for (let i = 0; i < 9; i++) T.shape(g, [[600 + i * 80, 820], [700 + i * 80, 500 - (i % 3) * 40], [760 + i * 80, 820]], { fill: i % 2 ? '#2f9a4a' : '#3aaa5a', lw: 5, seed: i }); T.text(g, 'БЕЛЫЙ ДЫМ', 960, 300, 100, '#fff', {}); }
function ctaBox(t, a, q, ans) {
  g.save(); g.globalAlpha = a; g.beginPath(); g.roundRect(560, 250, 800, 360, 34); g.fillStyle = 'rgba(30,20,10,.92)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
  let fs = 56; g.font = `900 ${fs}px Rubik`; while (g.measureText(q).width > 740 && fs > 30) { fs -= 2; g.font = `900 ${fs}px Rubik`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(q, 960, 330);
  if (ans) [['ДА', 760, '#3df2ff'], ['НЕТ', 1160, '#ff5a4a']].forEach(([lab, x, col]) => { g.beginPath(); g.roundRect(x - 150, 390, 300, 110, 26); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke(); g.font = '900 60px Rubik'; g.fillStyle = '#fff'; g.fillText(lab, x, 447); });
  else { g.font = '700 70px Caveat'; g.fillStyle = '#ffd23f'; g.fillText('«Н.» = ' + '?'.repeat(1 + Math.floor(t * 3) % 3), 960, 447); }
  g.font = '800 34px Rubik'; g.fillStyle = '#ffd23f'; g.fillText('💬 НАПИШИ В КОММЕНТАРИЯХ', 960, 560); g.restore();
}
const E1 = ['День первый.', 'Очнулся лицом в песке.', 'Во рту соль.', 'Солнце жжёт затылок.'];
const E2 = ['День второй.', 'Пил росу с пакета.', 'Потом зелёные кокосы.', 'Сложил шалаш под скалой.', '', 'Сыну завтра пять.', 'Обещал научить его плавать.'];
const E3 = ['День третий.', 'Нашёл ручей за скалой,', 'где кричат птицы.'];
const E4 = ['День четвёртый. Огонь.', 'Бутылка с водой — это линза.', '', 'Красное у скал не ешь.', 'Два дня рвало.'];
const E5 = ['День пятый.', 'Шторм с севера.', 'Уходи в пещеру над ручьём.', 'Хижину унесёт.'];
const E6 = ['День шестой.', 'Корабль на горизонте.', 'Дров мало.', 'Огонь не зажигаю —', 'подожду, пока подойдёт ближе.'];
const dawn = { sky: 'dawn' };
const SC = {
  hook(t, s) { return pick(s, t, [
    [null, () => { cam(); ISL({ ...dawn, ship: 1100, hero: { x: 760, armF: -2.6, face: { eyes: 'wide', brow: 'worried', look: [1, -.3] } } }); W.flame(g, t, 690, 470, .6); }],
    ['горящей', () => { cam(); torch(t); }],
    ['корабль', () => { cam(1100, 420, 2.4); ISL({ ...dawn, ship: 1100 }); }],
  ]); },
  hook_diary(t, s) { return pick(s, t, [
    [null, () => { cam(); DIA({ left: E1, right: E2.slice(0, 4), glow: true }); }],
    ['описывает', () => { cam(620, 340, 1.8); DIA({ left: E1, right: E2.slice(0, 4) }); }],
  ]); },
  hook_last(t, s) { return pick(s, t, [
    [null, () => { cam(1320, 420, 1.5); DIA({ left: E5, right: E6.slice(0, 4), kr: k_(s, 'корабль', 4) }); }],
    ['человек', () => { cam(); W.hutClose(g, t, { tally: 6 }); }],
  ]); },
  rewind(t, s) { cam(); DIA({ left: E1 }); g.save(); g.globalAlpha = .45; g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const y = ((t * 900 + i * 197) % 1200) - 60; g.fillRect(0, y, 1920, 6 + (i % 3) * 4); } g.restore(); g.fillStyle = 'rgba(10,10,20,.8)'; g.fillRect(460, 470, 1000, 150); T.text(g, '◀◀ 7 ДНЕЙ НАЗАД', 960, 545, 96, '#fff6c8', { fixed: true }); },
  ferry(t, s) { return pick(s, t, [
    [null, () => { cam(); harbor(t); }],
    ['плавать', () => { cam(); FACE({ eyes: 'open', brow: 'worried', look: [1, .3], side: .3 }, { bg: '#1a2238', night: .3 }); }],
    ['пароме', () => { cam(); W.ferry(g, t, { sink: 0 }); }],
    ['тонет', () => { cam(); W.ferry(g, t, { sink: .3 * k_(s, 'тонет', 1.5), siren: true }); return { shake: at(s, 'тонет') }; }],
  ]); },
  ferry_sink(t, s) { const w = at(s, 'волна'); return pick(s, t, [
    [null, () => { cam(); W.ferry(g, t, { sink: .3 + .5 * k_(s, 'палуба', 3), siren: true, hero: true }); }],
    ['затягиваешь', () => { cam(); vest(t, k_(s, 'ремни', .6)); }],
    ['волна', () => { cam(); W.bigWave(g, t, ss(w, w + .8, t)); return { shake: w }; }],
    ['черная', () => { cam(); W.underwater(g, t); }],
    ['темнота', () => { cam(); T.tint(g, '#000', 1); }],
  ]); },
  d1_wake(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'worried', look: [0, 0], side: -.6 }, { bg: W.C.sand, salt: true, lips: true, x: 1000, y: 520 }); }],
    ['солнце', () => { cam(); W.bg(g, '#ffe8a0'); T.glowRings(g, 960, 300, 500, '#fff6c8', .7); T.shape(g, T.ell(960, 300, 160, 160, 30), { fill: '#fff6c8', line: false }); FACE({ eyes: 'closed', brow: 'worried', side: .2 }, { noBg: true, y: 1000, R: 260, sunburn: true }); }],
  ]); },
  d1_look(t, s) { return pick(s, t, [
    [null, () => { cam(900, 640, 1.3); ISL({ hero: { x: 900, kneel: true, face: { eyes: 'open', brow: 'up', look: [1, -.2] } } }); }],
    ['белый', () => { cam(); ISL({}); }],
    ['остров', () => { cam(); aerial(t); }],
    ['океан', () => { cam(960, 400, 1.6); W.bg(g, '#7ac8f0'); W.sea(g, t, 420, {}); T.text(g, '???', 960, 260, 120, '#ffffff', {}); }],
  ]); },
  d1_inventory(t, s) { const it = t >= (at(s, 'бутылка') ?? 1e9) ? 3 : t >= (at(s, 'мокрая') ?? 1e9) ? 2 : t >= (at(s, 'складной') ?? 1e9) ? 1 : 0; return pick(s, t, [
    [null, () => { cam(); W.sandPockets(g, t, { items: it, spark: t >= (at(s, 'щелкает') ?? 1e9) }); }],
  ]); },
  d1_sos(t, s) { return pick(s, t, [
    [null, () => { cam(); ISL({ hero: { x: 700 + (t % 3) * 60, armF: -1.2, armB: -1.2, lean: .2, walk: t * 3, face: { eyes: 'half', brow: 'angry' } } }); T.shape(g, T.ell(840 + (t % 3) * 60, 700, 40, 32, 14), { fill: '#9a9a9a', lw: 5 }); }],
    ['выкладываешь', () => { cam(); W.sosTop(g, t, k_(s, 'выкладываешь', 5)); }],
    ['самолета', () => { cam(); W.sosTop(g, t, 1); T.shape(g, [[1500, 120], [1700, 140], [1800, 120], [1700, 100]], { fill: '#e8e4d8', lw: 4 }); }],
  ]); },
  d1_sea(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'sad', mouth: .2 }, { lips: true, sunburn: true }); }],
    ['заходишь', () => { cam(960, 640, 1.2); ISL({ hero: { x: 960, fy: 700, face: { eyes: 'open', brow: 'worried', look: [0, 1] } } }); T.shape(g, [[-300, 640], [2300, 640], [2300, 720], [-300, 720]], { fill: 'rgba(42,168,200,.7)', line: false }); }],
    ['зачерпываешь', () => { cam(); W.handsWater(g, t, 0); }],
    ['выливаешь', () => { cam(); W.handsWater(g, t, k_(s, 'выливаешь', 1)); }],
  ]); },
  d2_dew(t, s) { return pick(s, t, [
    [null, () => { cam(); W.dewBag(g, t, .3 + .6 * k_(s, 'собирается', 2)); }],
    ['слизываешь', () => { cam(); FACE({ eyes: 'closed', brow: 'sad', mouth: .3 }, { lips: true }); }],
    ['мало', () => { cam(); W.dewBag(g, t, .15); T.text(g, 'МАЛО', 960, 200, 120, W.C.red, {}); }],
  ]); },
  d2_coconut(t, s) { const fall = at(s, 'сбиваешь'); return pick(s, t, [
    [null, () => { cam(); W.palmClimb(g, t, 0); }],
    ['кора', () => { cam(); W.palmClimb(g, t, .4 * k_(s, 'кора', 1)); }],
    ['срываешься', () => { cam(); W.palmClimb(g, t, .4 + .6 * k_(s, 'срываешься', .4)); return { shake: at(s, 'срываешься') }; }],
    ['сбиваешь', () => { cam(); W.palmClimb(g, t, 0, { stick: true, drop: ss(fall + .4, fall + 1, t) }); }],
    ['ножом', () => { cam(); W.knifeCoconut(g, t, k_(s, 'прорезаешь', .6)); }],
    ['пьешь', () => { cam(); FACE({ eyes: 'closed', brow: 'neutral', smile: .5 }, { coconut: true }); }],
  ]); },
  d2_shelter(t, s) { return pick(s, t, [
    [null, () => { cam(1500, 640, 1.6); ISL({ shelter: true, hero: { x: 1380, armF: -1.6, face: { eyes: 'open', brow: 'neutral', look: [1, 0] } } }); }],
    ['ложишься', () => { cam(1500, 700, 1.5); ISL({ sky: 'dusk', shelter: true }); T.setRot(-Math.PI / 2, 1560, 760); T.person(g, 'you', 1560, 760, .55, { face: { eyes: 'closed' } }); T.setRot(0); }],
    ['засыпаешь', () => { cam(); FACE({ eyes: 'closed', brow: 'neutral', smile: .2, side: .3 }, { bg: '#26305a', night: .4 }); }],
  ]); },
  d3_camp(t, s) { return pick(s, t, [
    [null, () => { cam(400, 640, 1.5); ISL({ hut: true, hero: { x: 560, facing: -1, face: { eyes: 'wide', brow: 'up', look: [-1, 0] } } }); }],
    ['зарубки', () => { cam(1300, 520, 1.6); W.hutClose(g, t, { tally: Math.min(6, Math.floor((t - at(s, 'зарубки')) * 3) + 1) }); }],
    ['внутри', () => { cam(960, 860, 1.8); W.hutClose(g, t, { tally: 6, inside: true }); }],
  ]); },
  d3_open(t, s) { return pick(s, t, [
    [null, () => { cam(); W.hutClose(g, t, { tally: 6, inside: true }); }],
    ['дневник', () => { cam(); DIA({ glow: true }); return { shake: at(s, 'дневник') }; }],
    ['почерк', () => { cam(620, 380, 1.6); DIA({ left: E1, kl: k_(s, 'почерк', 3) }); }],
    ['день', () => { cam(620, 380, 1.6); DIA({ left: E1 }); }],
  ]); },
  d3_shock(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'wide', brow: 'up', look: [0, .5], sweat: true }, { diary: true, bg: '#c8b896' }); return { shake: at(s, 'твой') }; }],
    ['листаешь', () => { cam(1320, 420, 1.5); DIA({ left: E1, right: E2.slice(0, 4), kr: k_(s, 'листаешь', 3) }); }],
  ]); },
  d3_who(t, s) { return pick(s, t, [
    [null, () => { cam(860, 820, 2.2); DIA({ left: E1, sign: true }); }],
    ['сыну', () => { cam(1320, 560, 1.5); DIA({ left: E1, right: E2 }); T.line(g, [[1010, 520], [1520, 520]], { line: W.C.red, lw: 5 }); }],
  ]); },
  d3_stream(t, s) { return pick(s, t, [
    [null, () => { cam(620, 330, 1.7); DIA({ left: E3, right: E4.slice(0, 0) }); }],
    ['бежишь', () => { cam(); ISL({ hero: { x: 600 + ((t - at(s, 'бежишь')) * 300) % 900, walk: t * 9, lean: .3, face: { eyes: 'wide', brow: 'up', look: [1, 0] } } }); }],
    ['чайки', () => { cam(); W.stream(g, t, {}); }],
    ['пьешь', () => { cam(); W.stream(g, t, { drink: true }); }],
  ]); },
  d3_cta(t, s) { cam(); DIA({ left: E1, right: E2, sign: true }); },
  d4_read(t, s) { cam(620, 330, 1.6); DIA({ left: E4.slice(0, 2), kl: k_(s, 'огонь', 2) }); },
  d4_lens(t, s) { const d = at(s, 'дымиться'); return pick(s, t, [
    [null, () => { cam(); W.stream(g, t, { drink: true }); T.shape(g, [[880, 860], [1040, 860], [1040, 640], [880, 640]], { fill: 'rgba(170,220,250,.7)', lw: 6 }); }],
    ['держишь', () => { cam(); W.lensFire(g, t, 0); }],
    ['солнце', () => { cam(965, 760, 1.8); W.lensFire(g, t, .1); }],
    ['дымиться', () => { cam(); W.lensFire(g, t, .3 + .5 * ss(d, d + 1, t)); }],
  ]); },
  d4_fire(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'worried', mouth: .1, side: .4 }, { bg: '#f2dca0', glow: [1500, 900, '#ffb03a'] }); }],
    ['вспыхивает', () => { cam(); W.lensFire(g, t, 1); return { shake: at(s, 'вспыхивает') }; }],
    ['смеешься', () => { cam(); FACE({ eyes: 'closed', brow: 'up', smile: 1, mouth: .6 }, { bg: '#f8d098', glow: [960, 1000, '#ffb03a'], sunburn: true }); }],
  ]); },
  d4_berries(t, s) { return pick(s, t, [
    [null, () => { cam(); W.berries(g, t, 0); }],
    ['вспоминаешь', () => { cam(620, 470, 1.6); DIA({ left: E4 }); T.line(g, [[300, 380], [700, 380]], { line: W.C.red, lw: 5 }); }],
    ['разжимаешь', () => { cam(); W.berries(g, t, k_(s, 'разжимаешь', .8)); }],
  ]); },
  d4_fish(t, s) { return pick(s, t, [
    [null, () => { cam(); stickSharp(t); }],
    ['стоишь', () => { cam(); W.spearFish(g, t, {}); }],
    ['мимо', () => { cam(); W.spearFish(g, t, { strike: true }); }],
    ['двадцатый', () => { cam(); W.spearFish(g, t, { fish: true }); }],
    ['жаришь', () => { cam(); fishCoals(t); }],
  ]); },
  d5_sky(t, s) { return pick(s, t, [
    [null, () => { cam(); ISL({ sky: 'storm', windy: true, shelter: true }); }],
    ['ветер', () => { cam(500, 400, 1.5); ISL({ sky: 'storm', windy: true, storm: true, shelter: true }); }],
    ['открываешь', () => { cam(620, 360, 1.6); DIA({ left: E5, kl: k_(s, 'шторм', 3) }); T.tint(g, '#2a2e3a', .3); }],
  ]); },
  d5_cave(t, s) { const w = at(s, 'волны'); return pick(s, t, [
    [null, () => { cam(); ISL({ sky: 'storm', windy: true, storm: true, shelter: true, hero: { x: 1300 + ((t - s.t0) * 120) % 300, walk: t * 9, lean: .3, armF: -1.2, face: { eyes: 'wide', brow: 'up', look: [1, 0] } } }); }],
    ['карабкаешься', () => { cam(1700, 560, 1.6); ISL({ sky: 'storm', windy: true, storm: true, shelter: true, hero: { x: 1690, fy: 640, s: .7, armF: -2.6, face: { eyes: 'wide', brow: 'up', look: [1, -1] } } }); }],
    ['волны', () => { cam(); ISL({ sky: 'storm', windy: true, storm: true, shelter: true, wave: ss(w, w + 2, t) }); return { shake: w }; }],
    ['шалаш', () => { cam(1500, 640, 1.5); ISL({ sky: 'storm', windy: true, storm: true, wave: .3 }); }],
  ]); },
  d5_night(t, s) { return pick(s, t, [
    [null, () => { cam(); W.cave(g, t, { hero: true }); }],
    ['человек', () => { cam(); FACE({ eyes: 'half', brow: 'sad', side: .3, tear: true }, { bg: '#2a2a30', diary: true, night: .3 }); }],
  ]); },
  d6_watch(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'sad', mouth: .2 }, { sunburn: true, lips: true }); }],
    ['блестит', () => { cam(1800, 600, 2.2); ISL({}); T.glowRings(g, 1830, 640, 60, '#ffffff', .8); }],
    ['часы', () => { cam(); W.watch(g, t); }],
  ]); },
  d6_ship(t, s) { return pick(s, t, [
    [null, () => { cam(); ISL({ ship: 1300, shipS: .35 }); }],
    ['кричишь', () => { cam(); ISL({ ship: 1300, shipS: .35, hero: { x: 760, armF: -2.8, armB: -2.6, face: { eyes: 'wide', brow: 'up', mouth: .8, look: [1, -.4] } } }); }],
    ['далеко', () => { cam(1300, 400, 2.6); ISL({ ship: 1300, shipS: .35 }); }],
  ]); },
  d6_last(t, s) { return pick(s, t, [
    [null, () => { cam(1320, 400, 1.5); DIA({ left: E5, right: E6, kr: k_(s, 'последней', 5) }); }],
    ['пустые', () => { cam(); DIA({ left: [], right: [], blank: true }); }],
  ]); },
  d6_wait(t, s) { return pick(s, t, [
    [null, () => { cam(); W.woodpile(g, t); }],
    ['ждешь', () => { cam(); ISL({ sky: 'dusk', ship: 1500 + (t - at(s, 'ждешь')) * 40, shipS: .3, hero: { x: 760, sit: true, face: { eyes: 'half', brow: 'sad', look: [1, -.2] } } }); }],
    ['исчезает', () => { cam(1500, 420, 2); ISL({ sky: 'dusk' }); }],
  ]); },
  d7_ship(t, s) { return pick(s, t, [
    [null, () => { cam(); ISL({ ...dawn, ship: 1600, shipS: .35 }); }],
    ['обратно', () => { cam(1550, 410, 2.4); ISL({ ...dawn, ship: 1600 - (t - at(s, 'обратно')) * 20, shipS: .35 }); }],
  ]); },
  d7_choice(t, s) { cam(); FACE({ eyes: 'half', brow: 'angry', look: [1, 0], side: .3 }, { bg: '#f8d098', sunburn: true }); },
  d7_fire(t, s) { const p = at(s, 'поджигаешь'); return pick(s, t, [
    [null, () => { cam(); ISL({ ...dawn, ship: 1500, shipS: .35, hero: { x: 600 + ((t - s.t0) * 100) % 400, walk: t * 6, lean: .3, armF: -1.1, armB: -1.1, face: { eyes: 'open', brow: 'angry', look: [1, 0] } } }); T.line(g, [[520 + ((t - s.t0) * 100) % 400, 700], [760 + ((t - s.t0) * 100) % 400, 760]], { line: '#c8b896', lw: 20 }); }],
    ['рубашку', () => { cam(); W.woodpile(g, t, { label: false, n: 9 }); T.shape(g, [[860, 560], [1060, 560], [1080, 640], [840, 640]], { fill: '#eeeae0', lw: 5 }); }],
    ['зеленых', () => { cam(); leaves(t); }],
    ['поджигаешь', () => { cam(); W.bg(g, '#f8d098'); W.smokeColumn(g, t, 960, 760, 1.4, '#f4f4f4', 800); W.flame(g, t, 960, 900, 2.2 * ss(p, p + .8, t) + .1); }],
    ['ладони', () => { cam(); W.bg(g, '#1a1410'); W.flame(g, t, 1100, 800, 1.6); W.hand(g, 720, 760, 1.3, -.3, { red: true }); }],
  ]); },
  d7_three(t, s) { const a = at(s, 'разводишь'); cam(); W.threeFires(g, t, 1 + Math.min(2, Math.floor((t - (a ?? t)) / 1.2))); },
  d7_turn(t, s) { return pick(s, t, [
    [null, () => { cam(); ISL({ ...dawn, ship: 1500, shipS: .35, fires: [[700, 900], [900, 820], [1100, 900]] }); }],
    ['гудок', () => { cam(1500, 410, 2.4); ISL({ ...dawn, ship: 1500, shipS: .35 }); return { shake: at(s, 'гудок') }; }],
    ['поворачивает', () => { const k = k_(s, 'поворачивает', 4); cam(); ISL({ ...dawn, ship: 1500 - k * 300, shipS: .35 + k * .35, fires: [[700, 900], [900, 820], [1100, 900]] }); }],
  ]); },
  final_boat(t, s) { return pick(s, t, [
    [null, () => { cam(); W.deck(g, t, { people: true, cface: { eyes: 'open', brow: 'neutral', look: [-1, .3] } }); }],
    ['капитан', () => { cam(1300, 640, 1.6); W.deck(g, t, { people: true, cface: { eyes: 'open', brow: 'worried', look: [-.2, .6] } }); }],
    ['замирает', () => { cam(); W.faceClose(g, t, { eyes: 'wide', brow: 'up', scream: .5, look: [0, .3] }, { who: 'captain', bg: '#9ad0f0' }); W.capCap(g, 960, 470, 290); return { shake: at(s, 'замирает') }; }],
    ['николай', () => { cam(); W.faceClose(g, t, { eyes: 'half', brow: 'sad', look: [.3, 0] }, { who: 'captain', bg: '#9ad0f0' }); W.capCap(g, 960, 470, 290); }],
    ['искали', () => { cam(); W.watch(g, t); }],
  ]); },
  final_photo(t, s) { const o = at(s, 'выпадает'); return pick(s, t, [
    [null, () => { cam(); DIA({ left: E6, right: [], blank: true }); }],
    ['выпадает', () => { cam(); W.photo(g, t, ss(o + 1.4, o + 2.2, t)); }],
  ]); },
  final_you(t, s) { cam(); FACE({ eyes: 'open', brow: 'sad', tear: true, smile: .2 }, { bg: '#9ad0f0', sunburn: true }); },
  outro(t, s) { return pick(s, t, [
    [null, () => { cam(); ISL({ sky: 'dusk' }); g.save(); g.globalAlpha = .45; T.person(g, 'father', 760, 860, 1, { armF: -2.6, face: { eyes: 'open', smile: .6, look: [1, 0] } }); g.restore(); }],
    ['успел', () => { cam(); W.photo(g, t, 1); }],
  ]); },
  question(t, s) { cam(); W.deck(g, t, { sky: 'dusk', island: true, islandX: 420 }); T.person(g, 'you', 1560, 1000, 1, { facing: -1, face: { eyes: 'half', smile: .4, look: [-1, -.2] } }); },
  title(t, s) {
    const k = ss(s.t0, s.t0 + .45, t);
    if (k < 1 && s.prev && SC[s.prev.scene]) { SC[s.prev.scene](s.t0 - .01, s.prev); T.setCam(); }
    g.save(); g.translate(0, (1 - k) * 1100);
    if (s.n <= 7) { DIA({ left: [`День ${DAYW[s.n]}.`], kl: ss(s.t0 + .4, s.t0 + 1.2, t) }); for (let i = 0; i < s.n; i++) T.line(g, [[300 + i * 40, 880], [320 + i * 40, 940]], { lw: 7, line: W.C.ink, seed: i }); }
    else DIA({ left: E6, right: [], blank: true, sign: true });
    g.restore();
  },
};
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function shakeAt(t, t0, amp = 22) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[1, -1, .8, -.7, .5, -.4, .3, -.1, 0][k] * amp, [.3, -.6, .5, -.3, .2, -.2, .1, 0, 0][k] * amp]; }
function draw(t) {
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
  if (CTA && t >= CTA.t0 && t < CTA.t1) ctaBox(t, Math.min(clamp((t - CTA.t0) / .25), clamp((CTA.t1 - t) / .3)), 'КТО НАПИСАЛ ДНЕВНИК?');
  if (s.scene === 'question') { g.save(); g.translate(-360, -60); ctaBox(t, clamp((t - s.t0) / .3), 'А ТЫ БЫ ЗАЖЁГ ПОСЛЕДНИЕ ДРОВА?', true); g.restore(); }
  if (STOP != null && t >= STOP && t < STOP + 1.5) { const k = t - STOP, n = 3 - Math.floor(k / .5);
    g.save(); g.translate(960, 420); g.rotate(-.08); g.font = '900 230px Rubik'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 40; g.strokeStyle = '#231629'; g.strokeText('СТОП', 0, 0); g.lineWidth = 14; g.strokeStyle = '#fff'; g.strokeText('СТОП', 0, 0); g.fillStyle = '#ff3a2a'; g.fillText('СТОП', 0, 0); g.restore();
    if (n > 0) { g.font = '900 120px Rubik'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#231629'; g.strokeText(String(n), 960, 620); g.fillStyle = '#ffd23f'; g.fillText(String(n), 960, 620); } }
  const subPop = (t0) => { if (t < t0 || t >= t0 + 3.2) return; const k = t - t0, a = Math.min(clamp(k / .3), clamp((3.2 - k) / .3)), pressed = k > 1.3, x = 1460 + (1 - a) * 500, y = 860;
    g.globalAlpha = a; g.beginPath(); g.roundRect(x, y - 50, 400, 100, 50); g.fillStyle = pressed ? '#5a5a6a' : '#e62117'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.font = '900 40px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(pressed ? 'ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ', x + 200, y + 2); g.globalAlpha = 1; };
  if (SUB != null) subPop(SUB); const q = SEG.find(x => x.scene === 'question'); if (q) { const ps = wt(q, 'подпишись'); if (ps != null) subPop(ps - .3); }
  g.restore();
}
