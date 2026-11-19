// film.js — «Меня столкнули с круизного лайнера»: one shot per spoken action, a live «В ВОДЕ» timer from the push to the rescue.
import * as T from './toon.js';
import * as W from './world.js';
let g, CU, SEG = [], EV = [], SH = [0, 0], BIGW = [], FREEZE = [], STOP = null, SUB = null, CTA = null, WATER = null, CLK = [];
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
  SEG.forEach((s, i) => { if (s.scene === 'title') { s.prev = SEG[i - 1]; s.n = SEG.slice(0, i + 1).filter(x => x.scene === 'title').length; } });
  const wsc = (sc, pat, n = 0) => { for (const sg of SEG) if (sg.scene === sc) { const x = wt(sg, pat, n); if (x != null) return x; } return null; };
  // story clock keyframes from the HUD (film time → minutes since 03:00) for the live «В ВОДЕ» timer
  for (const h of cues.hud) if (h.time) { const [hh, mm] = h.time.split(':').map(Number); let m = hh * 60 + mm - 180; if (m < -60) m += 1440; CLK.push([h.t, m]); }
  WATER = { t0: wsc('push', 'соскальзывают') ?? wsc('push', 'руки'), t1: wsc('h6_rescue', 'вытаскивают') };
  STOP = wsc('final_face', 'видит'); if (STOP != null) FREEZE.push([STOP, STOP + 1.5, STOP - .1]);
  const c0 = wsc('h1_cta', 'остановись'); if (c0 != null) CTA = { t0: c0, t1: (wsc('h1_cta', 'угадал') ?? c0 + 5) + 1 };
  SUB = cues.total * .35; for (const sg of SEG) if (sg.scene === 'title' && SUB > sg.t0 - 1 && SUB < sg.t1 + 3.6) SUB = sg.t1 + 4;
  if (STOP != null) ev(STOP, 'stop'); ev(SUB, 'subscribe'); if (CTA) ev(CTA.t0, 'poll');
  for (const e of cues.fx || []) if (e.type === 'danger' && e.value >= 90) ev(e.t, 'silence');
  for (const pg of cues.pages) { let pc = null; for (const w of pg.words) { if (w.c === 'danger' && pc !== 'danger') BIGW.push({ t: w.t0, w: w.w.replace(/[«»"“”.,:;!?—…]/g, '').toUpperCase() }); pc = w.c; } }
  for (const s of SEG) if (s.scene === 'title') { ev(s.t0, 'whoosh'); ev(s.t0 + .2, 'splat', { v: .6 }); }
  const E = (sc, w, type, o = {}, n = 0, dt = 0) => { const x = wsc(sc, w, n); if (x != null) ev(x + dt, type, o); return x; };
  E('hook', 'летишь', 'whoosh', { v: 1.2 }); E('hook', 'воду', 'splat', { v: 1.4 }); E('hook', 'воду', 'sub'); E('push', 'звякает', 'tick', { v: 1.6 }); E('push', 'соскальзывают', 'whoosh'); E('dinner', 'поднимает', 'tick', { v: .8 });
  E('bar', 'проливает', 'pour'); E('text_msg', 'приходит', 'beep', { v: .7 }); E('h3_signal', 'вздрагивает', 'beep'); E('h3_signal', 'вздрагивает', 'beep', {}, 0, .25); E('h3_sos', 'гудок', 'beep'); E('h3_sos', 'доставлено', 'blip');
  E('m10_swing', 'опускаешь', 'splat', { v: 1.1 }); E('m1_cough', 'кашляешь', 'splat', { v: .6 }); E('h5_jeans', 'набираешь', 'splat', { v: .8 });
  E('h6_turn', 'гудок', 'horn', { v: 1.3 }); E('h6_rescue', 'вытаскивают', 'thud', { v: .8 }); E('final_face', 'чашка', 'thud'); E('final_face', 'звякает', 'tick', { v: 1.6 }); E('final_restaurant', 'ресторан', 'whoosh', { v: .4 });
  for (let i = 0; i < 9; i++) E('h6_flash', 'мигаешь', 'tick', { v: 1.1 }, 0, i * (i % 3 === 2 ? .5 : .3) + (i >= 3 ? .4 : 0) + (i >= 6 ? .4 : 0));
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
const WATERV = (o = {}) => W.inWater(g, t_, o);
const FACE = (f, o = {}) => W.faceClose(g, t_, f, o);
const sepia = (a = .3) => T.tint(g, '#c89050', a);
function lcd(txt, col = '#ffd23f', bgc = '#0e1430') { W.bg(g, bgc); T.shape(g, T.rrect(460, 300, 1000, 420, 40), { fill: '#0e1418', lw: 10 }); T.text(g, txt, 960, 520, 220, col, { outline: false, font: 'JBMono', weight: 800 }); T.glowRings(g, 960, 520, 500, col, .06); }
function rule110(t, hl = 0) { W.bg(g, '#0e1a34'); [['1', 'МИНУТА', 'ДЫШАТЬ'], ['10', 'МИНУТ', 'ДЕЙСТВОВАТЬ'], ['1', 'ЧАС', 'ДО ПОТЕРИ СОЗНАНИЯ']].forEach(([n, u, d], i) => { const x = 380 + i * 580, on = hl === i + 1; T.shape(g, T.rrect(x - 240, 220, 480, 520, 40), { fill: on ? '#1e3a6a' : '#16243e', line: on ? '#ffd23f' : '#3a4a6a', lw: on ? 10 : 6 }); T.text(g, n, x, 400, 220, on ? '#ffd23f' : '#9fd8ff', {}); T.text(g, u, x, 560, 64, '#ffffff', {}); T.text(g, d, x, 650, d.length > 12 ? 30 : 40, '#bfe8ff', { outline: false }); }); }
function fall(t, k) { W.bg(g, '#0e1430'); T.shape(g, T.rect(1100, -200, 900, 1500), { fill: '#f4f1ea', shade: '#c8c4b8', shadeOff: [-30, 0] }); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) T.shape(g, T.ell(1200 + c * 200, -100 + r * 180 - k * 600, 34, 34, 16), { fill: '#ffe7a0', lw: 4, seed: r * 4 + c }); T.setRot(k * 2.5, 800, 300 + k * 500); T.person(g, 'you', 800, 520 + k * 500, .8, { armF: -2.6, armB: -2.4, face: { eyes: 'wide', brow: 'up', scream: 1 } }); T.setRot(0); for (let i = 0; i < 6; i++) T.line(g, [[640 + i * 50, 100 + k * 400], [640 + i * 50, 0 + k * 400]], { line: 'rgba(255,255,255,.4)', lw: 5, seed: i }); }
function schoolPhoto(t) { W.bg(g, '#2a2620'); T.setRot(-.05, 960, 540); T.shape(g, T.rect(560, 140, 800, 800), { fill: '#f8f6f0', lw: 6 }); g.save(); const a = T.P([600, 180]), b = T.P([1320, 820]); g.beginPath(); g.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); g.clip(); W.bg(g, '#f0d8a8'); T.shape(g, T.rect(-200, 640, 2400, 400), { fill: '#9a9a90', line: false }); T.person(g, 'kid', 820, 900, 1.9, { armF: -.6, face: { eyes: 'closed', smile: 1, mouth: .4 } }); T.person(g, 'kid', 1100, 900, 2, { armF: -2.6, facing: -1, face: { eyes: 'open', smile: .9 } }); g.restore(); T.setRot(0); sepia(.3); T.text(g, '1 «А»', 960, 880, 60, '#5a4a3a', { outline: false, font: 'Caveat', weight: 700 }); }
function bar(t, o = {}) { W.bg(g, '#1a1030'); for (let i = 0; i < 5; i++) T.shape(g, T.rect(200 + i * 340, 80, 220, 40), { fill: i % 2 ? '#ff3a8a' : '#3ad8ff', line: false }); T.glowRings(g, 960, 100, 900, '#ff3a8a', .08); T.shape(g, T.rect(-100, 760, 2200, 400), { fill: '#2a1e3a', line: false }); T.shape(g, T.rect(-100, 700, 2200, 70), { fill: '#5a3a2a', lw: 6 });
  W.you && null; const h = o.spill ? .4 : 0; T.person(g, 'you', 760, 1000, 1, { facing: 1, lean: -h, armF: -1.2, face: { eyes: o.spill ? 'wide' : 'open', brow: o.spill ? 'angry' : 'neutral', mouth: o.spill ? .6 : 0, look: [1, 0] } }); const r = T.person(g, 'redshirt', 1160, 1000, 1.05, { facing: -1, lean: .2, armF: -1.4, face: { eyes: 'half', brow: 'angry', mouth: o.spill ? .5 : 0, look: [-1, 0] } });
  if (o.spill) { T.shape(g, [[r.hand[0] - 30, r.hand[1] - 60], [r.hand[0] + 30, r.hand[1] - 60], [r.hand[0] + 20, r.hand[1]], [r.hand[0] - 20, r.hand[1]]], { fill: 'rgba(255,240,200,.6)', lw: 5 }); for (let i = 0; i < 8; i++) T.dot(g, r.hand[0] - 80 - i * 25, r.hand[1] - 20 + Math.sin(i) * 30, 9, '#ff8a3a'); } }
function chain(t) { W.bg(g, '#1a1030'); T.shape(g, [[-100, 440], [1260, 450], [1260, 650], [-100, 660]], { fill: W.CAST ? '#e8a878' : '#e8a878', shade: '#c88a5a', shadeOff: [0, 20] }); for (let i = 0; i < 9; i++) T.shape(g, T.ell(700 + i * 34, 550 + Math.sin(i) * 6, 26, 40, 14), { fill: '#d8b040', lw: 5, seed: i }); T.shape(g, [[-100, 420], [400, 430], [400, 670], [-100, 680]], { fill: '#d83a2a', lw: 6 }); T.text(g, 'ЗВЯК', 1300, 300, 100, '#fff6c8', {}); }
function corridorDoor(t, k) { W.bg(g, '#e8e4d8'); T.shape(g, T.rect(-100, 820, 2200, 300), { fill: '#a8303a', line: false }); T.shape(g, T.rect(760, 200, 400, 620), { fill: '#16305a', lw: 8 }); for (let i = 0; i < 20; i++) T.dot(g, 780 + (i * 97) % 360, 220 + (i * 53) % 400, 2, '#e8e0ff'); T.shape(g, T.rect(760 - k * 380, 200, 400 * (1 - k * .9) + 20, 620), { fill: '#c8c4b8', lw: 8 }); T.text(g, 'ПАЛУБА', 960, 160, 50, '#5a5a5a', { outline: false, font: 'JBMono', weight: 800 }); T.person(g, 'you', 960, 980, .9, { walk: t * 3, facing: 1, face: { eyes: 'half', brow: 'neutral', look: [1, 0] } }); }
function sneakers(t) { W.bg(g, '#0a1830'); for (let i = 0; i < 20; i++) T.dot(g, (i * 211) % 1920, (i * 97) % 1080, 5, 'rgba(120,180,255,.3)'); for (const x of [700, 1100]) { T.shape(g, T.rect(x - 60, -100, 120, 700), { fill: '#3a4a6a', lw: 6 }); T.shape(g, T.rrect(x - 90, 600, 220, 110, 40), { fill: '#e8e4d8', lw: 6 }); T.line(g, [[x - 80, 660], [x + 120, 660]], { line: '#3a8ac8', lw: 8 }); } T.text(g, 'ТЕПЛЕЕ', 960, 860, 90, '#bfe8ff', {}); }
function ctaPoll(t, a, q, opts, foot) { g.save(); g.globalAlpha = a; g.beginPath(); g.roundRect(500, 240, 920, 380, 34); g.fillStyle = 'rgba(10,16,34,.94)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
  let fs = 56; g.font = `900 ${fs}px Rubik`; while (g.measureText(q).width > 840 && fs > 30) { fs -= 2; g.font = `900 ${fs}px Rubik`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(q, 960, 320);
  opts.forEach(([lab, col], i) => { const x = 720 + i * 480; g.beginPath(); g.roundRect(x - 210, 390, 420, 110, 26); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke(); let f2 = 50; g.font = `900 ${f2}px Rubik`; while (g.measureText(lab).width > 380 && f2 > 26) { f2 -= 2; g.font = `900 ${f2}px Rubik`; } g.fillStyle = '#fff'; g.fillText(lab, x, 447); });
  g.font = '800 34px Rubik'; g.fillStyle = '#ffd23f'; g.fillText(foot, 960, 570); g.restore(); }
const restP = (o = {}) => () => { const a = T.person(g, 'artem', o.ax ?? 1180, 1000, 1, { facing: -1, armF: o.armF ?? -1, face: o.af || { eyes: 'half', brow: 'sad', look: [-1, .4] } }); if (o.captain !== false) { const c = T.person(g, 'captain', 1480, 1000, 1, { facing: -1, face: o.cf || { eyes: 'open', brow: 'worried', look: [-1, 0] } }); W.capCap(g, c.head[0], c.head[1], c.R); } if (o.you) { T.person(g, 'you', 520, 1000, 1, { facing: 1, face: o.yf || { eyes: 'half', brow: 'angry', look: [1, 0] } }); T.shape(g, [[400, 600], [640, 600], [660, 860], [380, 860]], { fill: '#ffc928', shade: '#e09a12', shadeOff: [-20, 0] }); for (const x of [260, 140]) { const r = T.person(g, 'cop', x, 1000, 1, { facing: 1, face: { eyes: 'open', brow: 'neutral' } }); W.capCopG(g, r.head[0], r.head[1], r.R); } } };
const SC = {
  hook(t, s) { return pick(s, t, [
    [null, () => { cam(); W.stern(g, t, { hero: true, lean: .3 }); }],
    ['толкают', () => { cam(); W.pushHands(g, t, k_(s, 'толкают', .3)); return { shake: at(s, 'толкают') }; }],
    ['переваливаешься', () => { cam(); W.stern(g, t, { hero: true, lean: 1.2 * k_(s, 'переваливаешься', .6) + .3, pusher: 1, heroF: { eyes: 'wide', brow: 'up', scream: 1 } }); }],
    ['летишь', () => { cam(); fall(t, k_(s, 'летишь', 1.6)); }],
  ]); },
  hook_ship(t, s) { return pick(s, t, [
    [null, () => { cam(); WATERV({ liner: .1, head: { f: { eyes: 'wide', brow: 'up', scream: .8 } } }); }],
    ['лайнер', () => { cam(); WATERV({ liner: .1 + .5 * k_(s, 'уходит', 5) }); }],
    ['берега', () => { cam(); WATERV({ liner: .7 }); T.text(g, '40 КМ ДО БЕРЕГА', 960, 300, 100, '#fff6c8', { fixed: true }); }],
  ]); },
  hook_who(t, s) { cam(); W.stern(g, t, { pusher: 1 }); T.tint(g, '#05081a', .2); },
  rewind(t, s) { cam(); const k = ss(s.t0, s.t1, t), m = 180 - k * 240, hh = ((Math.floor(m / 60) % 24) + 24) % 24, mm = ((Math.floor(m) % 60) + 60) % 60; lcd(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`); g.save(); g.globalAlpha = .45; g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const y = ((t * 900 + i * 197) % 1200) - 60; g.fillRect(0, y, 1920, 6 + (i % 3) * 4); } g.restore(); T.text(g, '◀◀ 4 ЧАСА НАЗАД', 960, 830, 80, '#fff6c8', { fixed: true }); },
  dinner(t, s) { return pick(s, t, [
    [null, () => { cam(); W.restaurant(g, t, { people: () => { T.person(g, 'you', 700, 1000, 1, { facing: 1, armF: -1.2, face: { eyes: 'open', smile: .6, look: [1, 0] } }); T.person(g, 'artem', 1220, 1000, 1.02, { facing: -1, armF: -2.4, face: { eyes: 'open', smile: .8, mouth: .4, look: [-1, 0] } }); } }); }],
    ['дружите', () => { cam(); schoolPhoto(t); }],
    ['круиз', () => { cam(); W.bg(g, '#9ad0f0'); W.sea(g, t, 600, {}); W.liner(g, t, 960, 600, .8, {}); }],
    ['кедровым', () => { cam(); FACE({ eyes: 'half', smile: .7, side: -.3 }, { who: 'artem', bg: '#6a4a32' }); for (let i = 0; i < 3; i++) { const ph = (t * .5 + i / 3) % 1; g.save(); g.globalAlpha = 1 - ph; T.line(g, Array.from({ length: 8 }, (_, k) => [1300 + i * 90 + Math.sin(k + t * 2) * 20, 500 - ph * 200 - k * 26]), { line: '#c8a070', lw: 9 }); g.restore(); } }],
    ['часы', () => { cam(); W.wristScratch(g, t, { bg: '#6a4a32' }); }],
    ['за', () => { cam(); W.toast(g, t); }, 2],
    ['топор', () => { cam(); FACE({ eyes: 'closed', smile: 1, mouth: .6 }, { who: 'artem', bg: '#6a4a32' }); }],
  ]); },
  dinner_dad(t, s) { return pick(s, t, [
    [null, () => { cam(); W.restaurant(g, t, { people: () => { T.person(g, 'you', 700, 1000, 1, { facing: 1, face: { eyes: 'half', smile: .3, look: [1, 0] } }); T.person(g, 'artem', 1220, 1000, 1.02, { facing: -1, face: { eyes: 'closed', smile: 1, mouth: .5 } }); } }); }],
    ['отец', () => { cam(); W.dadMemory(g, t); }],
    ['паника', () => { cam(); FACE({ eyes: 'open', brow: 'worried', mouth: .4 }, { who: 'dad', bg: '#9ad0f0' }); sepia(.2); T.text(g, 'ПАНИКА УБИВАЕТ РАНЬШЕ ХОЛОДА', 960, 120, 64, '#fff6c8', { fixed: true }); }],
  ]); },
  bar(t, s) { return pick(s, t, [
    [null, () => { cam(); bar(t, {}); }],
    ['толкает', () => { cam(); bar(t, { spill: true }); return { shake: at(s, 'толкает') }; }],
    ['ругаетесь', () => { cam(); FACE({ eyes: 'half', brow: 'angry', mouth: .5, look: [1, 0] }, { who: 'redshirt', bg: '#1a1030' }); }],
    ['запястье', () => { cam(); chain(t); }],
  ]); },
  text_msg(t, s) { return pick(s, t, [
    [null, () => { cam(); W.chatPhone(g, t, { clock: '02:50', batt: 76, bars: 1, msgs: t >= (at(s, 'приходит') ?? 1e9) + .4 ? [{ text: ['Не спится. Выйди', 'на палубу, подышим'] }] : [] }); }],
    ['палубу', () => { cam(); corridorDoor(t, k_(s, 'палубу', 3)); }],
  ]); },
  deck(t, s) { return pick(s, t, [
    [null, () => { cam(); W.stern(g, t, { hero: true, lean: 0 }); }],
    ['кедром', () => { cam(); W.stern(g, t, { hero: true, smell: true, heroF: { eyes: 'half', brow: 'worried', look: [-1, 0] } }); }],
    ['наклоняешься', () => { cam(960, 520, 1.3); W.stern(g, t, { hero: true, lean: .5 * k_(s, 'наклоняешься', 1) }); }],
  ]); },
  push(t, s) { return pick(s, t, [
    [null, () => { cam(); W.pushHands(g, t, k_(s, 'руки', .3)); return { shake: at(s, 'руки') }; }],
    ['вцепиться', () => { cam(); W.wristScratch(g, t, { nails: true, scratches: t > (at(s, 'вцепиться') ?? 1e9) + .4 }); }],
    ['звякает', () => { cam(); W.wristScratch(g, t, { scratches: true, clink: true }); return { shake: at(s, 'звякает') }; }],
    ['соскальзывают', () => { cam(); fall(t, k_(s, 'соскальзывают', 2)); }],
  ]); },
  m1_water(t, s) { return pick(s, t, [
    [null, () => { cam(); lcd('+14°', '#9fd8ff'); }],
    ['холод', () => { cam(); W.underwater(g, t); FACE({ eyes: 'wide', brow: 'up', scream: 1 }, { noBg: true, R: 230 }); T.tint(g, '#0a2a5a', .35); return { shake: at(s, 'холод') }; }],
    ['вдох', () => { cam(); W.underwater(g, t); FACE({ eyes: 'closed', brow: 'worried', scream: .7 }, { noBg: true, R: 230 }); for (let i = 0; i < 12; i++) T.shape(g, T.ell(960 + Math.sin(i) * 80, 600 - ((t * 200 + i * 60) % 600), 18, 18, 12), { fill: null, line: '#bfe8ff', lw: 4, seed: i }); T.tint(g, '#0a2a5a', .35); }],
  ]); },
  m1_cough(t, s) { return pick(s, t, [
    [null, () => { cam(); WATERV({ liner: .6, head: { f: { eyes: 'closed', brow: 'worried', mouth: .7 } } }); }],
    ['соленая', () => { cam(); FACE({ eyes: 'half', brow: 'worried', mouth: .4 }, { bg: '#16305a', night: .3 }); }],
    ['сверху', () => { cam(); WATERV({ liner: .75 }); }],
    ['хочется', () => { cam(); WATERV({ liner: .8, head: { f: { eyes: 'wide', brow: 'up', scream: .9 } } }); }],
    ['голове', () => { cam(); W.dadMemory(g, t); }],
  ]); },
  m1_breath(t, s) { return pick(s, t, [
    [null, () => { cam(); W.floatTop(g, t, { f: { eyes: 'closed', brow: 'worried' } }); }],
    ['вдох', () => { cam(); FACE({ eyes: 'closed', brow: 'neutral', mouth: Math.abs(Math.sin(t * 1.5)) * .3 }, { bg: '#16305a', night: .3 }); }],
    ['правило', () => { cam(); rule110(t, Math.min(3, 1 + Math.floor((t - at(s, 'правило')) / 1.2))); }],
    ['минута', () => { cam(); rule110(t, 1); }, 1],
  ]); },
  m10_tired(t, s) { return pick(s, t, [
    [null, () => { cam(); WATERV({ liner: 1, head: { f: { eyes: 'half', brow: 'sad', mouth: .3 } } }); }],
    ['десять', () => { cam(); rule110(t, 2); }],
  ]); },
  m10_jeans(t, s) { return pick(s, t, [
    [null, () => { cam(); sneakers(t); }],
    ['джинсы', () => { cam(); W.jeansFloat(g, t, 0, { hands: true }); }],
    ['дважды', () => { cam(); W.underwater(g, t); W.jeansFloat && null; T.text(g, 'ПОД ВОДУ', 960, 300, 90, '#bfe8ff', { fixed: true }); return { shake: at(s, 'дважды') }; }],
    ['завязываешь', () => { cam(); W.jeansFloat(g, t, 0, { hands: true, knots: true }); }],
  ]); },
  m10_swing(t, s) { return pick(s, t, [
    [null, () => { cam(); W.jeansFloat(g, t, 0, { hands: true, knots: true, lift: k_(s, 'поднимаешь', 1) }); }],
    ['опускаешь', () => { const k = k_(s, 'опускаешь', .5); cam(); W.jeansFloat(g, t, 0, { hands: true, knots: true, lift: 1 - k, inflated: k, splash: k > .7 ? 1 : 0 }); }],
    ['штанины', () => { cam(); W.jeansFloat(g, t, 0, { knots: true, inflated: 1 }); }],
  ]); },
  m10_float(t, s) { return pick(s, t, [
    [null, () => { cam(); W.floatTop(g, t, { f: { eyes: 'half', brow: 'worried', look: [0, -1] } }); }],
    ['держат', () => { cam(); W.floatTop(g, t, { f: { eyes: 'closed', brow: 'sad', smile: .4 } }); }],
  ]); },
  h1_help(t, s) { return pick(s, t, [
    [null, () => { cam(); W.helpPose(g, t); }],
    ['трясет', () => { cam(); W.floatTop(g, t, { f: { eyes: 'half', brow: 'worried', mouth: .2 }, shiver: true }); }],
  ]); },
  h1_stars(t, s) { return pick(s, t, [
    [null, () => { cam(); W.stars(g, t, {}); }],
    ['полярную', () => { cam(); W.stars(g, t, { polaris: true }); }],
    ['течения', () => { cam(); W.floatTop(g, t, { f: { eyes: 'open', brow: 'neutral', look: [0, -1] } }); }],
  ]); },
  h1_jelly(t, s) { cam(); W.jelly(g, t); return { shake: at(s, 'обжигает') }; },
  h1_clues(t, s) { const n = t >= (at(s, 'царапина') ?? 1e9) ? 3 : t >= (at(s, 'звон') ?? 1e9) ? 2 : 1; return pick(s, t, [
    [null, () => { cam(); W.clueBoard(g, t, n); }],
    ['мужчина', () => { cam(); FACE({ eyes: 'half', brow: 'angry', look: [1, 0] }, { who: 'redshirt', bg: '#1a1030' }); }],
  ]); },
  h1_cta(t, s) { cam(); W.clueBoard(g, t, 3, { suspects: true }); },
  h3_phone(t, s) { return pick(s, t, [
    [null, () => { cam(); W.floatTop(g, t, { f: { eyes: 'half', brow: 'worried', look: [0, 1] } }); }],
    ['чехол', () => { cam(); W.chatPhone(g, t, { pouch: true, dark: true, bg: '#16305a' }); }],
  ]); },
  h3_signal(t, s) { return pick(s, t, [
    [null, () => { cam(); W.chatPhone(g, t, { pouch: true, bg: '#16305a', batt: 9, clock: '06:00', from: '', msgs: [] }); }],
    ['полоска', () => { cam(1000, 200, 2.2); W.chatPhone(g, t, { pouch: true, bg: '#16305a', batt: 9, bars: 1, clock: '06:00', from: '' }); }],
    ['сообщение', () => { cam(); W.chatPhone(g, t, { pouch: true, bg: '#16305a', batt: 9, bars: 1, clock: '06:00', from: 'Помощница', msgs: [{ text: ['Артём вчера', 'переоформил'] }, { text: ['страховку твоей', 'жизни на себя'] }, { text: ['Это странно.', 'Позвони мне'] }] }); return { shake: at(s, 'вздрагивает') }; }],
  ]); },
  h3_realize(t, s) { return pick(s, t, [
    [null, () => { cam(); W.clueBoard(g, t, 3); }],
    ['выйди', () => { cam(); W.chatPhone(g, t, { pouch: true, bg: '#16305a', batt: 9, clock: '06:01', msgs: [{ text: ['Не спится. Выйди', 'на палубу, подышим'] }] }); }],
    ['артем', () => { cam(); FACE({ eyes: 'half', brow: 'angry', smile: .5, side: -.3 }, { who: 'artem', bg: '#1a0a14' }); T.tint(g, '#3a0010', .2); return { shake: at(s, 'артем') }; }],
  ]); },
  h3_sos(t, s) { return pick(s, t, [
    [null, () => { const lost = t >= (at(s, 'пропадает') ?? 1e9); cam(); W.chatPhone(g, t, { pouch: true, bg: '#16305a', batt: 8, bars: lost ? 0 : 1, clock: '06:02', from: '112', msgs: [{ text: [lost ? 'Вызов прерван' : 'Вызов…'] }] }); }],
    ['пишешь', () => { cam(); W.chatPhone(g, t, { pouch: true, bg: '#16305a', batt: 7, clock: '06:03', from: 'Спасатели', msgs: [{ me: true, text: ['Упал за борт', 'лайнера.'] }, { me: true, text: ['Меня столкнули'], err: t >= (at(s, 'доставлено') ?? 1e9) }] }); }],
  ]); },
  h5_jeans(t, s) { return pick(s, t, [
    [null, () => { cam(); W.jeansFloat(g, t, 0, { knots: true, inflated: .2 + .3 * Math.abs(Math.sin(t)) }); }],
    ['снова', () => { cam(); W.jeansFloat(g, t, 0, { hands: true, knots: true, lift: .6 + .4 * Math.sin(t * 2) }); }],
    ['руки', () => { cam(); FACE({ eyes: 'half', brow: 'worried', mouth: .5 }, { bg: '#16305a', night: .35 }); }],
  ]); },
  h5_lights(t, s) { return pick(s, t, [
    [null, () => { cam(); WATERV({ boat: 1400, boatS: .35 }); }],
    ['кричишь', () => { cam(); WATERV({ boat: 1400, boatS: .35, head: { f: { eyes: 'wide', brow: 'up', mouth: 1, look: [1, -.4] } } }); }],
  ]); },
  h5_pass(t, s) { const k = ss(s.t0, s.t1, t); cam(); WATERV({ boat: 1400 + k * 600, boatS: .35 - k * .2 }); },
  h5_warm(t, s) { return pick(s, t, [
    [null, () => { cam(); W.floatTop(g, t, { f: { eyes: 'half', brow: 'neutral', smile: .2 } }); T.tint(g, '#3a6ab8', .2); }],
    ['закрываешь', () => { cam(); FACE({ eyes: 'closed', brow: 'neutral', smile: .2 }, { bg: '#16305a', night: .4 + .4 * k_(s, 'закрываешь', 2) }); }],
    ['голос', () => { cam(); W.dadMemory(g, t); return { shake: at(s, 'спать') }; }],
    ['открываешь', () => { cam(); FACE({ eyes: 'wide', brow: 'up', mouth: .3 }, { bg: '#16305a', night: .3 }); return { shake: at(s, 'открываешь') }; }],
  ]); },
  h6_dawn(t, s) { return pick(s, t, [
    [null, () => { cam(); WATERV({ dawn: true }); }],
    ['вдруг', () => { cam(); WATERV({ dawn: true, boat: 1500, boatS: .3, lightsOn: false }); }],
  ]); },
  h6_flash(t, s) { cam(); W.chatPhone(g, t, { pouch: true, bg: '#5a7aa8', batt: 1, clock: '09:00', flash: t >= (at(s, 'включаешь') ?? 1e9) ? 1 : 0, from: '', msgs: [] }); },
  h6_turn(t, s) { const k = k_(s, 'поворачивает', 3); cam(); WATERV({ dawn: true, boat: 1500 - k * 500, boatS: .3 + k * .3 }); return { shake: at(s, 'гудок') }; },
  h6_rescue(t, s) { return pick(s, t, [
    [null, () => { cam(); W.rescueDeck(g, t, { pull: true }); }],
    ['куртку', () => { cam(); W.rescueDeck(g, t, { sit: true }); }],
    ['чай', () => { cam(); W.rescueDeck(g, t, { sit: true, tea: true }); }],
    ['рыбак', () => { cam(); W.rescueDeck(g, t, { sit: true, tea: true, radio: true }); }],
    ['смеешься', () => { cam(); W.rescueDeck(g, t, { sit: true, laugh: true, radio: true }); }],
  ]); },
  final_port(t, s) { cam(); W.port(g, t); },
  final_restaurant(t, s) { return pick(s, t, [
    [null, () => { cam(); W.restaurant(g, t, { day: true, people: restP({}) }); }],
    ['перебрал', () => { cam(); FACE({ eyes: 'half', brow: 'sad', mouth: .3, look: [-.5, .5] }, { who: 'artem', bg: '#6a4a32' }); }],
  ]); },
  final_face(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'wide', brow: 'up', scream: .8 }, { who: 'artem', bg: '#6a4a32' }); return { shake: at(s, 'видит') }; }],
    ['чашка', () => { cam(); W.cupFall(g, t, k_(s, 'чашка', .7)); }],
    ['звякает', () => { cam(); W.wristScratch(g, t, { bg: '#6a4a32', clink: true }); }],
  ]); },
  final_scratch(t, s) { return pick(s, t, [
    [null, () => { cam(); W.wristScratch(g, t, { bg: '#6a4a32', cuff: true }); }],
    ['сдвигает', () => { cam(); W.wristScratch(g, t, { bg: '#6a4a32', cuff: true, braceletOff: k_(s, 'сдвигает', .6) > .5, scratches: k_(s, 'сдвигает', .6) > .5 }); }],
    ['ты', () => { cam(); FACE({ eyes: 'wide', brow: 'worried', mouth: .4 }, { who: 'artem', bg: '#6a4a32', tint: ['#ffffff', .12] }); }],
  ]); },
  final_answer(t, s) { cam(); FACE({ eyes: 'half', brow: 'angry', smile: .2, look: [1, 0], side: .3 }, { bg: '#6a4a32' }); T.shape(g, [[400, 1100], [520, 820], [1400, 820], [1520, 1100]], { fill: '#ffc928', shade: '#e09a12', shadeOff: [-40, 0] }); },
  outro(t, s) { cam(); W.phoneCall(g, t); },
  question(t, s) { cam(); WATERV({ dawn: true }); W.floatTop && null; },
  title(t, s) {
    const k = ss(s.t0, s.t0 + .45, t);
    if (k < 1 && s.prev && SC[s.prev.scene]) { SC[s.prev.scene](s.t0 - .01, s.prev); T.setCam(); }
    g.save(); g.globalAlpha = k; W.underwater(g, t); g.restore();
  },
};
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function shakeAt(t, t0, amp = 22) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[1, -1, .8, -.7, .5, -.4, .3, -.1, 0][k] * amp, [.3, -.6, .5, -.3, .2, -.2, .1, 0, 0][k] * amp]; }
function storyMin(t) { if (!CLK.length) return 0; let v = CLK[0][1]; for (let i = 0; i < CLK.length; i++) { const [a, va] = CLK[i], nx = CLK[i + 1]; if (t >= a) v = nx ? va + (nx[1] - va) * clamp((t - a) / Math.max(.1, nx[0] - a)) : va; } return v; }
function draw(t) {
  const tReal = t; for (const [a, b, ft] of FREEZE) if (t >= a && t < b) t = ft ?? a;
  t_ = t; T.setTime(t); const s = segAt(t), f = SC[s.scene] || SC.hook;
  SH = [0, 0]; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
  let r = f(t, s) || {};
  if (r.shake != null && t > r.shake && t < r.shake + .4) { SH = shakeAt(t, r.shake); g.fillRect(0, 0, 1920, 1080); r = f(t, s) || {}; }
  T.setCam(); T.setRot(0); t = tReal;
  if (FREEZE.some(([a, b]) => t >= a && t < b)) T.tint(g, '#1a1030', .25);
  extras(t, s);
  for (const b of BIGW) if (t >= b.t && t < b.t + .7 && s.scene !== 'title' && !(STOP != null && t >= STOP - .2 && t < STOP + 1.7)) { const p = (t - b.t) / .7, sc = p < .15 ? .6 + p / .15 * .5 : 1.1 - .1 * p; g.save(); g.globalAlpha = p > .75 ? (1 - p) / .25 : 1; g.translate(960, 470); g.rotate(-.06); g.scale(sc, sc); let fs = 190; g.font = `900 ${fs}px Rubik`; while (g.measureText(b.w).width > 1500 && fs > 70) { fs -= 10; g.font = `900 ${fs}px Rubik`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 34; g.strokeStyle = T.INK; g.strokeText(b.w, 0, 0); g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText(b.w, 0, 0); g.fillStyle = '#ff3a2a'; g.fillText(b.w, 0, 0); g.restore(); }
  if (t > CU.total - .8) T.tint(g, '#000', (t - (CU.total - .8)) / .8);
}
function extras(t, s) {
  g.save(); g.textBaseline = 'middle';
  // live «В ВОДЕ» timer: from the push to the rescue
  if (WATER && WATER.t0 != null && t >= WATER.t0 && (WATER.t1 == null || t < WATER.t1 + 2)) { const done = WATER.t1 != null && t >= WATER.t1; const m = Math.max(0, storyMin(Math.min(t, WATER.t1 ?? t))), secs = Math.floor(m * 60 + (done ? 0 : (t * 37) % 60)), hh = Math.floor(secs / 3600), mm = Math.floor(secs % 3600 / 60), sc = secs % 60;
    const txt = `В ВОДЕ ${hh}:${String(mm).padStart(2, '0')}:${String(sc).padStart(2, '0')}`, low = m > 240 && !done;
    g.font = '800 40px JBMono'; const w = g.measureText(txt).width + 44; g.beginPath(); g.roundRect(960 - w / 2, 22, w, 60, 16); g.fillStyle = done ? 'rgba(0,90,40,.8)' : low ? 'rgba(120,0,0,.75)' : 'rgba(7,26,42,.75)'; g.fill(); g.strokeStyle = done ? '#7aff9a' : low ? '#ff5a4a' : '#7ad8ff'; g.lineWidth = 3; g.stroke();
    g.fillStyle = done ? '#7aff9a' : low && Math.floor(t * 3) % 2 ? '#ffffff' : low ? '#ff5a4a' : '#7ad8ff'; g.textAlign = 'center'; g.fillText(done ? txt.replace('В ВОДЕ', 'СПАСЁН') : txt, 960, 53); }
  if (CTA && t >= CTA.t0 && t < CTA.t1) ctaPoll(t, Math.min(clamp((t - CTA.t0) / .25), clamp((CTA.t1 - t) / .3)), 'КТО ТЕБЯ ТОЛКНУЛ?', [['АРТЁМ', '#3df2ff'], ['КРАСНАЯ РУБАШКА', '#ff5a4a']], '💬 НАПИШИ В КОММЕНТАРИЯХ');
  if (s.scene === 'question') ctaPoll(t, clamp((t - s.t0) / .3), 'А ТЫ ЗНАЛ ПРО ДЖИНСЫ?', [['ДА', '#3df2ff'], ['НЕТ', '#ff5a4a']], '💬 НАПИШИ В КОММЕНТАРИЯХ');
  if (STOP != null && t >= STOP && t < STOP + 1.5) { const k = t - STOP, n = 3 - Math.floor(k / .5);
    g.save(); g.translate(960, 420); g.rotate(-.08); g.font = '900 230px Rubik'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 40; g.strokeStyle = '#231629'; g.strokeText('СТОП', 0, 0); g.lineWidth = 14; g.strokeStyle = '#fff'; g.strokeText('СТОП', 0, 0); g.fillStyle = '#ff3a2a'; g.fillText('СТОП', 0, 0); g.restore();
    if (n > 0) { g.font = '900 120px Rubik'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#231629'; g.strokeText(String(n), 960, 620); g.fillStyle = '#ffd23f'; g.fillText(String(n), 960, 620); } }
  const subPop = (t0) => { if (t < t0 || t >= t0 + 3.2) return; const k = t - t0, a = Math.min(clamp(k / .3), clamp((3.2 - k) / .3)), pressed = k > 1.3, x = 1460 + (1 - a) * 500, y = 860;
    g.globalAlpha = a; g.beginPath(); g.roundRect(x, y - 50, 400, 100, 50); g.fillStyle = pressed ? '#5a5a6a' : '#e62117'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.font = '900 40px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(pressed ? 'ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ', x + 200, y + 2); g.globalAlpha = 1; };
  if (SUB != null) subPop(SUB); const q = SEG.find(x => x.scene === 'question'); if (q) { const ps = wt(q, 'подпишись'); if (ps != null) subPop(ps - .3); }
  g.restore();
}
