// film.js — «Меня заперли в морозилке»: frame 0 = the thumbnail (thumb.js SCENE.A + plates flying off), one shot per spoken action,
// a live «ТЫ 36,6° · КАМЕРА −25°» readout from the slam to the rescue, the suspect poll, СТОП on Oleg's face.
import * as T from './toon.js';
import * as W from './world.js';
import * as TH from './thumb.js';
let g, CU, SEG = [], EV = [], SH = [0, 0], BIGW = [], FREEZE = [], STOP = null, SUB = null, CTA = null, LIVE = null, LIGHT = {};
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { if (a == null) return 0; const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export async function init(cv, cues) {
  g = cv.getContext('2d'); CU = cues; TH.use(g);
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  let prev = 'hook';
  for (const l of L) { const sc = l.kind === 'title' ? 'title' : (l.tags.scene || prev); prev = sc; const last = SEG[SEG.length - 1];
    if (last && last.scene === sc && sc !== 'title') last.lines.push(l); else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .2 }); }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .3; s.i = i; }); SEG[0].t0 = 0;
  SEG.forEach((s, i) => { if (s.scene === 'title') { s.prev = SEG[i - 1]; s.n = SEG.slice(0, i + 1).filter(x => x.scene === 'title').length; } });
  const wsc = (sc, pat, n = 0) => { for (const sg of SEG) if (sg.scene === sc) { const x = wt(sg, pat, n); if (x != null) return x; } return null; };
  // light phases in the freezer: lit → pitch dark → phone flashlight → dim (phone dead) → door open
  LIGHT = { off: wsc('slam', 'гаснет'), torch: wsc('dark_knob', 'включаешь'), dead: wsc('send', 'гаснет'), open: wsc('open', 'распахивается') };
  // live readout: body temperature from the chapter cards, the camera sensor from −25 to +30 (armpit)
  const cards = SEG.filter(s => s.scene === 'title').map(s => s.t0 + .3), temps = [36.6, 36, 35, 34, 33, 32];
  LIVE = { t0: wsc('hook', 'минус'), hookEnd: wsc('rewind', 'вернемся'), t1: LIGHT.off, rescue: wsc('rescue', 'выносят'), warm: wsc('armpit', 'плюс'), keys: cards.slice(0, 6).map((t, i) => [t, temps[i]]) };
  STOP = wsc('manager_face', 'видит'); if (STOP != null) FREEZE.push([STOP, STOP + 1.5, STOP - .1]);
  const c0 = wsc('cta', 'остановись'); if (c0 != null) CTA = { t0: c0, t1: (wsc('cta', 'угадал') ?? c0 + 5) + 1 };
  SUB = cues.total * .35; for (const sg of SEG) if (sg.scene === 'title' && SUB > sg.t0 - 1 && SUB < sg.t1 + 3.6) SUB = sg.t1 + 4;
  if (STOP != null) ev(STOP, 'stop'); ev(SUB, 'subscribe'); if (CTA) ev(CTA.t0, 'poll');
  for (const e of cues.fx || []) if (e.type === 'danger' && e.value >= 90 && e.t > 2) ev(e.t, 'silence');
  for (const pg of cues.pages) { let pc = null; for (const w of pg.words) { if (w.c === 'danger' && pc !== 'danger') BIGW.push({ t: w.t0, w: w.w.replace(/[«»"“”.,:;!?—…]/g, '').toUpperCase() }); pc = w.c; } }
  for (const s of SEG) if (s.scene === 'title') { ev(s.t0, 'whoosh'); ev(s.t0 + .2, 'thud', { v: .5 }); }
  const E = (sc, w, type, o = {}, n = 0, dt = 0) => { const x = wsc(sc, w, n); if (x != null) ev(x + dt, type, o); return x; };
  E('hook', 'заперли', 'thud', { v: 1.2 }); E('hook_who', 'мелькает', 'whoosh', { v: .5 }); E('rewind', 'вернемся', 'whoosh', { v: .8 });
  for (let i = 0; i < 3; i++) E('kitchen', 'гремит', 'tick', { v: 1.2 }, 0, i * .22); E('kitchen', 'гаснут', 'blip'); E('door_fix', 'отвертку', 'tick', { v: 1.2 });
  E('enter', 'открываешь', 'whoosh', { v: .9 }); E('slam', 'хлопает', 'thud', { v: 1.5 }); E('slam', 'щелкает', 'tick', { v: 1.8 }); E('slam', 'гаснет', 'tick', { v: .9 });
  E('dark_knob', 'включаешь', 'blip'); for (let i = 0; i < 4; i++) E('bang', 'бьешь', 'thud', { v: 1.1 }, 0, i * .26); for (let i = 0; i < 3; i++) E('bang', 'бьешь', 'thud', { v: 1 }, 1, i * .26);
  for (let i = 0; i < 3; i++) E('bang', 'набираешь', 'beep', { v: .6 }, 0, i * .3); E('bang', 'сети', 'blip');
  E('sweat', 'распахиваешь', 'whoosh', { v: .4 }); E('shelter', 'стаскиваешь', 'thud', { v: .7 }); E('shelter', 'кладешь', 'paper'); E('wrap', 'обматываешь', 'paper'); E('write', 'пишешь', 'paper');
  for (let i = 0; i < 4; i++) E('door_wifi', 'звонит', 'beep', { v: .7 }, 0, i * .35); E('door_wifi', 'ловит', 'blip'); E('chat', 'олег', 'beep', { v: .6 }); E('chat', 'витек', 'beep', { v: .6 });
  E('send', 'нажимаешь', 'blip'); E('send', 'гаснет', 'thud', { v: .5 }); E('panel', 'уведомление', 'beep', { v: .6 }); E('fan_stop', 'хрипит', 'thud', { v: .5 });
  for (const w of ['сто', 'двести', 'триста']) E('beep', w, 'tick', { v: .7 }); for (let i = 0; i < 6; i++) E('beep', 'пищит', 'beep', { v: .5 }, 0, i * .4);
  for (let i = 0; i < 3; i++) E('open', 'шаги', 'thud', { v: .4 }, 0, i * .35); E('open', 'щелчок', 'tick', { v: 1.8 }); E('open', 'распахивается', 'whoosh', { v: 1.2 });
  E('rescue', 'чай', 'pour'); E('log', 'журнал', 'blip'); E('pocket', 'жвачка', 'tick'); E('pocket', 'ключи', 'tick'); E('pocket', 'грибок', 'stamp'); E('outro', 'чайник', 'pour');
  for (const b of cues.boxes) if (b.kind === 'dialog') ev(b.t0, 'whoosh', { v: .2 });
  return { draw, EV };
}
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0) { if (!seg) return null; let k = 0; const p = norm(pat); for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; } return null; }
function cam(x = 960, y = 540, z = 1) { T.setCam(x, y, z, SH[0], SH[1]); }
let t_ = 0;
function pick(seg, t, list) { let cur = list[0][1], last = -1e9; for (const [w, fn, n] of list) { const a = w == null ? seg.t0 : wt(seg, w, n || 0); if (a != null && t >= a - .1 && a - last >= 1.4) { cur = fn; last = a; } } return cur(); }
const at = (seg, w, n = 0) => wt(seg, w, n);
const k_ = (seg, w, d = .6, n = 0) => ss(at(seg, w, n), (at(seg, w, n) ?? 0) + d, t_);
const after = x => x != null && t_ >= x;
const FACE = (f, o = {}) => W.faceClose(g, t_, f, o);
const sepia = (a = .3) => T.tint(g, '#c89050', a);
// the freezer with the current light phase
function lightNow() { const t = t_; if (after(LIGHT.open)) return 0; if (after(LIGHT.dead)) return .6; if (after(LIGHT.torch)) return .72; if (after(LIGHT.off)) return .96; return 0; }
function FZR(o = {}) { const d = o.dark ?? lightNow(); W.fzRoom(g, t_, { ...o, dark: d, beam: d ? (o.beam || [o.hx ?? 640, 600]) : null, beamR: d > .9 ? 1 : (o.beamR || 380) }); }
function FROST(f, o = {}) { W.bg(g, o.bg || '#16304a'); T.glowRings(g, 960, 500, 700, '#7ad8ff', .12); W.frostFace(g, t_, 960, o.y ?? 470, o.R ?? 300, f, o); if (o.coatBox) {} W.frostEdges(g, o.frost ?? .5); }
function lcd(txt, col = '#ffd23f', bgc = '#0e1430', sub) { W.bg(g, bgc); T.shape(g, T.rrect(460, 300, 1000, 420, 40), { fill: '#0e1418', lw: 10 }); T.text(g, txt, 960, 510, 220, col, { outline: false, font: 'JBMono', weight: 800 }); T.glowRings(g, 960, 510, 500, col, .06); if (sub) T.text(g, sub, 960, 820, 70, '#ffffff', {}); }
function ctaPoll(t, a, q, opts, foot) { g.save(); g.globalAlpha = a; g.beginPath(); g.roundRect(500, 240, 920, 380, 34); g.fillStyle = 'rgba(10,16,34,.94)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
  g.font = '900 54px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(q, 960, 320);
  opts.forEach(([s, c], i) => { const x = 560 + i * 420; g.beginPath(); g.roundRect(x, 390, 380, 110, 22); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill(); g.strokeStyle = c; g.lineWidth = 5; g.stroke(); let fs = 50; g.font = `900 ${fs}px Rubik`; while (g.measureText(s).width > 340 && fs > 26) { fs -= 2; g.font = `900 ${fs}px Rubik`; } g.fillStyle = '#ffffff'; g.fillText(s, x + 190, 446); });
  g.font = '800 34px Rubik'; g.fillStyle = '#ffd23f'; g.fillText(foot, 960, 570); g.restore(); }
// ── inserts
function fists(t, t0) { W.bg(g, W.FZ.door); for (let i = 0; i < 12; i++) T.line(g, [[0, 80 + i * 90], [1920, 90 + i * 90]], { line: W.FZ.doorS, lw: 3, seed: i }); const ph = ((t - (t0 ?? 0)) / .26) % 1, hit = ph < .25;
  for (const [x, s] of [[720, 1], [1200, -1]]) { const p = (x === 720 ? ph : (ph + .5) % 1), dz = Math.sin(p * Math.PI) * 120; W.hand(g, x, 760 - dz, 1.7, -Math.PI / 2 + s * .15, { grip: true }); }
  if (hit) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; T.line(g, [[960 + Math.cos(a) * 160, 420 + Math.sin(a) * 110], [960 + Math.cos(a) * 260, 420 + Math.sin(a) * 170]], { line: '#ffffff', lw: 10, seed: i }); }
  T.dark(g, lightNow(), [{ x: 960, y: 500, r: 520 }], '#04101c'); }
function chest(t, o = {}) { W.bg(g, '#16304a'); const open = o.open ?? 0; T.shape(g, T.rect(460, 80, 1000, 1100), { fill: '#4a7ab8', shade: '#3a5a8a', shadeOff: [-30, 0] }); T.line(g, T.ell(960, 80, 160, 90, 20, 0, Math.PI), { lw: 8 });
  if (o.ice) for (let i = 0; i < 26; i++) { const x = 620 + (i * 97) % 680, y = 260 + (i * 61) % 640, k = clamp(o.ice * 2 - (i % 5) * .2); T.shape(g, T.ell(x, y, 30, 22, 10), { fill: k > .5 ? '#e8f6ff' : 'rgba(30,50,90,.5)', line: k > .5 ? '#a8d0f0' : false, lw: 3, seed: i }); if (k > .5) for (let j = 0; j < 3; j++) T.line(g, [[x, y], [x + Math.cos(j * 2.1) * 36, y + Math.sin(j * 2.1) * 36]], { line: '#ffffff', lw: 3, seed: i + j }); }
  for (const s of [-1, 1]) { const ex = 960 + s * (30 + open * 330); T.shape(g, [[ex, 60], [960 + s * 1100, 60], [960 + s * 1100, 1200], [ex, 1200]], { fill: '#f4f2ec', shade: '#cfcabc', shadeOff: [s * 30, 0], seed: s + 5 }); for (let k = 0; k < 4; k++) T.dot(g, ex + s * 70, 240 + k * 200, 16, '#2a2a2a'); }
  if (open > .3) W.steam(g, t, 960, 200, open, '#ffffff', 130); if (o.label) T.text(g, o.label, 960, 200, 70, '#ffd23f', {}); }
function zipper(t, k, up) { W.bg(g, '#16304a'); T.shape(g, T.rect(0, 0, 1920, 1080), { fill: '#f4f2ec', line: false }); T.line(g, [[960, -50], [960, 1130]], { line: '#9a9a9a', lw: 24 }); for (let i = 0; i < 30; i++) T.line(g, [[940, i * 40], [980, i * 40 + 10]], { line: '#7a7a7a', lw: 5, seed: i });
  const y = 120 + (up ? 1 - k : k) * 760; T.shape(g, T.rrect(900, y - 60, 120, 140, 18), { fill: '#c8ccd4', lw: 8 }); W.hand(g, 1080, y + 80, 1.4, -2.6, { grip: true }); W.frostEdges(g, .5); }
function windChill(t, k) { W.bg(g, '#0e1a2a'); for (const [x, v, lab] of [[560, -25, 'ВОЗДУХ'], [1360, -35, 'НА ВЕТРУ']]) { const show = v === -25 || k > 0; if (!show) continue; T.shape(g, T.rrect(x - 280, 260, 560, 420, 40), { fill: '#0e1418', lw: 8 }); T.text(g, `−${Math.abs(v)}°`, x, 450, 200, v === -35 ? '#7ad8ff' : '#bfe8ff', { outline: false, font: 'JBMono', weight: 800 }); T.text(g, lab, x, 760, 60, '#ffffff', {}); }
  if (k > 0) { T.line(g, [[880, 470], [1040, 470]], { line: '#ffd23f', lw: 16 }); T.shape(g, [[1040, 430], [1100, 470], [1040, 510]], { fill: '#ffd23f', lw: 5 }); }
  for (let i = 0; i < 5; i++) { const ph = (t * .8 + i / 5) % 1; T.line(g, [[200 + ph * 1500, 900 + i * 25], [320 + ph * 1500, 900 + i * 25]], { line: 'rgba(255,255,255,.5)', lw: 5, seed: i }); } }
function floorHeat(t, o = {}) { W.bg(g, W.FZ.wall); T.shape(g, T.rect(-100, 560, 2200, 600), { fill: W.FZ.floor, line: false }); for (let i = 0; i < 30; i++) T.line(g, [[(i * 137) % 1960, 600 + (i * 53) % 440], [(i * 137) % 1960 + 40, 590 + (i * 53) % 440]], { line: W.FZ.floorS, lw: 5, seed: i });
  W.hand(g, 960, 520, 2, Math.PI / 2, {}); for (let i = 0; i < 5; i++) { const ph = (t * .9 + i / 5) % 1, x = 820 + i * 70, y = 640 + ph * 300; g.save(); g.globalAlpha = 1 - ph; T.line(g, [[x, y - 70], [x, y]], { line: '#ff5a3a', lw: 18 }); T.shape(g, [[x - 28, y], [x + 28, y], [x, y + 44]], { fill: '#ff5a3a', lw: 4 }); g.restore(); }
  for (let i = 0; i < 16; i++) T.dot(g, 700 + (i * 71) % 520, 560 + (i * 29) % 60, 7, '#f4fbff'); T.text(g, 'МЕТАЛЛ ЗАБИРАЕТ ТЕПЛО', 960, 200, 74, '#ffffff', {}); }
function flatBox(t, k) { W.bg(g, '#16304a'); const w = 300 + k * 500; T.shape(g, T.rect(960 - w / 2, 520 - (1 - k) * 180, w, 300 + (1 - k) * 60), { fill: '#d8b878', shade: '#b89858', shadeOff: [-14, 0] }); for (const [x, s] of [[960 - w / 2 - 40, 1], [960 + w / 2 + 40, -1]]) W.hand(g, x, 600, 1.3, s > 0 ? 0 : Math.PI, { grip: true }); T.text(g, 'ПЕЛЬМЕНИ', 960, 620 - (1 - k) * 90, 60, '#7a4a1a', { outline: false }); T.dark(g, lightNow(), [{ x: 960, y: 560, r: 600 }], '#04101c'); }
function filmRoll(t) { W.bg(g, W.FZ.wall); T.shape(g, T.rect(300, 640, 1300, 30), { fill: '#c8ccd4', lw: 6 }); T.shape(g, W.capsule(700, 560, 1220, 560, 150), { fill: 'rgba(230,244,255,.8)', shade: '#c8dce8', shadeOff: [0, -16] }); T.shape(g, T.ell(700, 560, 30, 75, 20), { fill: '#d8b878', lw: 6 }); T.shape(g, [[1220, 600], [1500, 620], [1480, 900], [1210, 640]], { fill: 'rgba(230,244,255,.5)', lw: 4 }); T.text(g, 'ПИЩЕВАЯ ПЛЁНКА', 960, 380, 70, '#2a4a6a', { outline: false }); T.dark(g, lightNow(), [{ x: 960, y: 560, r: 640 }], '#04101c'); }
function armpits(t) { W.bg(g, '#16304a'); T.shape(g, T.rect(460, 160, 1000, 1000), { fill: '#f4f2ec', shade: '#cfcabc', shadeOff: [-30, 0] }); for (const [x, r] of [[620, -.2], [1300, Math.PI + .2]]) W.hand(g, x, 560, 1.4, r, { grip: true }); for (const x of [700, 1220]) T.shape(g, T.ell(x, 560, 140, 80, 20), { fill: '#e8e4dc', lw: 6 }); T.glowRings(g, 960, 560, 360, '#ff9a4a', .15); T.text(g, 'ЛАДОНИ — ПОД МЫШКИ', 960, 200, 70, '#ffffff', {}); }
function bodyHeat(t, o = {}) { W.bg(g, '#0e1a2a'); T.person(g, 'you', 960, 980, 1.4, { armF: .2, armB: .1, face: { eyes: 'half', brow: 'worried' } }); const p = .5 + .5 * Math.sin(t * 6); T.glowRings(g, 960, 640, 180 + p * 40, '#ff8a2a', .35); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + t; T.line(g, [[960 + Math.cos(a) * 200, 640 + Math.sin(a) * 200], [960 + Math.cos(a) * 240, 640 + Math.sin(a) * 240]], { line: '#ffb03a', lw: 8, seed: i }); }
  if (o.sensor) { T.shape(g, T.rrect(1150, 520, 20, 70, 6), { fill: '#c8ccd4', lw: 4 }); T.line(g, [[1160, 520], [1300, 200]], { line: '#3a3a3a', lw: 4 }); T.text(g, '+30°', 1400, 500, 110, '#ff5a4a', {}); }
  T.text(g, o.label || 'ДРОЖЬ = ПЕЧКА', 960, 200, 64, '#ffd23f', {}); }
function stiffHand(t, k) { W.bg(g, '#16304a'); W.hand(g, 900, 560, 2.4, -.2, { grip: k > .5 }); for (let i = 0; i < 20; i++) T.dot(g, 900 + (i * 53) % 400, 420 + (i * 37) % 260, 6, 'rgba(240,250,255,.8)'); T.text(g, 'ПАЛЬЦЫ', 960, 200, 90, '#7ad8ff', {}); W.frostEdges(g, .5); }
function ruleCard(t, a, b) { W.bg(g, '#0e1a34'); T.shape(g, T.rrect(360, 260, 1200, 520, 40), { fill: '#1e3a6a', line: '#ffd23f', lw: 10 }); T.text(g, a, 960, 420, 96, '#ffd23f', {}); T.text(g, b, 960, 600, 80, '#ffffff', {}); }
function pocketPhone(t, k) { W.bg(g, '#16304a'); T.shape(g, T.rect(360, 100, 1200, 1000), { fill: '#f4f2ec', shade: '#cfcabc', shadeOff: [-30, 0] }); T.shape(g, T.rect(760, 520, 400, 40), { fill: '#cfcabc', lw: 6 }); const y = 200 + k * 420; g.save(); g.beginPath(); g.rect(0, 0, 1920, 540); g.clip(); T.shape(g, T.rrect(840, y, 240, 420, 30), { fill: '#111', lw: 6 }); g.restore(); W.hand(g, 1160, y + 200, 1.3, -2.4, { grip: true }); T.glowRings(g, 960, 700, 300, '#ff9a4a', .12); T.text(g, 'К ТЕЛУ', 960, 200, 80, '#ffffff', {}); }
function coatHook(t) { W.bg(g, '#e8eef0'); for (let x = 0; x < 1920; x += 80) T.line(g, [[x, 0], [x, 1080]], { line: '#cfd8dc', lw: 3, seed: x }); T.shape(g, T.rect(500, 200, 900, 40), { fill: '#8a5a2a', lw: 6 }); T.line(g, [[960, 240], [960, 300]], { lw: 10 });
  W.puffer(g, 960, 290, 1.25); T.text(g, 'ТВОЙ ПУХОВИК', 1500, 460, 70, '#2a2a2a', { outline: false }); }
function trap(t) { W.bg(g, '#2a0e14'); T.shape(g, T.ell(960, 420, 260, 280, 40), { fill: '#3a1a24', lw: 8 }); T.shape(g, T.ell(960, 380, 180, 130, 30), { fill: '#ff8aa0', shade: '#d86a80', shadeOff: [-14, 0] }); for (let i = 0; i < 5; i++) T.line(g, T.ell(960, 380, 60 + i * 26, 30 + i * 22, 14, 0, Math.PI), { line: '#b84a60', lw: 5, seed: i }); T.text(g, 'ЖАРКО?!', 1480, 260, 110, '#ff5a4a', { rot: .08 }); T.text(g, 'ЛОВУШКА МОЗГА', 960, 760, 90, '#ffd23f', {}); }
function snowUndress(t) { W.bg(g, '#0e1a2a'); for (let i = 0; i < 60; i++) T.dot(g, (i * 211) % 1920, ((i * 97) + t * 60) % 1080, 4, '#ffffff'); T.shape(g, T.rect(-100, 820, 2200, 300), { fill: '#e8f0f8', line: false }); T.person(g, 'you', 900, 860, 1.1, { armF: -2.6, armB: -2.4, face: { eyes: 'half', brow: 'neutral', smile: .4 } }); T.setRot(.6, 1250, 500); T.shape(g, [[1180, 380], [1380, 380], [1420, 640], [1140, 640]], { fill: '#f4f2ec', shade: '#cfcabc', shadeOff: [-16, 0] }); T.setRot(0); T.text(g, '−25°', 1500, 200, 110, '#7ad8ff', {}); }
function feet(t) { W.bg(g, W.FZ.floor); for (const x of [740, 1180]) { T.shape(g, T.rect(x - 90, -100, 180, 620), { fill: '#2e2e38', lw: 6 }); T.shape(g, T.rrect(x - 130, 500, 300, 150, 50), { fill: '#1a1a1a', lw: 6 }); for (let i = 0; i < 10; i++) T.dot(g, x - 100 + (i * 37) % 260, 520 + (i * 23) % 110, 7, '#f4fbff'); } T.text(g, 'НОГИ НЕ ЧУВСТВУЮТСЯ', 960, 200, 70, '#ffffff', {}); T.dark(g, lightNow(), [{ x: 960, y: 520, r: 600 }], '#04101c'); W.frostEdges(g, .7); }
function doorOpen(t, k, o = {}) { W.fzRoom(g, t, { dark: .6 * (1 - k) + .1, beam: [960, 500], beamR: 300 + k * 500 }); g.save(); g.globalAlpha = k; T.shape(g, T.rect(770, 230, 380, 532), { fill: '#ffe7a0', line: false }); T.shape(g, [[770, 762], [1150, 762], [1500, 1100], [420, 1100]], { fill: 'rgba(255,231,160,.55)', line: false }); g.restore();
  if (o.owner) { const r = T.person(g, 'owner', 900, 762, .82, { facing: 1, armF: -.6, face: { eyes: 'wide', brow: 'up', look: [1, .3] } }); for (let i = 0; i < 4; i++) T.line(g, [[860, 640 + i * 30], [940, 640 + i * 30]], { line: '#ffffff', lw: 3 }); } if (o.vitya) T.person(g, 'vitya', 1080, 762, .82, { facing: -1, face: { eyes: 'wide', brow: 'worried' } }); }
function blanket(t, o = {}) { T.setCam(980, 700, 1.25, SH[0], SH[1]); W.kitchen(g, t, { off: true, sink: false }); T.person(g, 'you', 760, 1000, 1, { sit: true, face: { eyes: 'half', brow: 'sad', smile: o.smile || 0 } }); T.shape(g, [[600, 640], [920, 640], [990, 980], [530, 980]], { fill: '#8a8a9a', shade: '#6a6a7a', shadeOff: [-20, 0] }); if (o.coat) T.shape(g, [[620, 640], [900, 640], [880, 800], [640, 800]], { fill: '#3a7ab8', shade: '#2a5a8a', shadeOff: [-14, 0] });
  if (o.owner) { const r = T.person(g, 'owner', 1400, 1000, 1, { facing: -1, armF: -2.4, face: { eyes: 'open', brow: 'worried', mouth: Math.abs(Math.sin(t * 7)) * .4 } }); T.shape(g, T.rrect(r.hand[0] - 20, r.hand[1] - 70, 44, 90, 10), { fill: '#111', lw: 4 }); } if (o.vitya) T.person(g, 'vitya', 1100, 1000, 1.05, { facing: -1, armF: -1.2, face: { eyes: 'open', brow: 'worried', look: [-1, .3] } }); }
function rubHands(t, grab) { W.bg(g, '#e8eef0'); const d = grab ? 0 : Math.sin(t * 14) * 30; W.hand(g, 760 + d, 560, 1.7, 0, {}); W.hand(g, 1160 - d, 600, 1.7, Math.PI, {}); if (grab) { W.hand(g, 700, 380, 1.5, .6, { who: 'vitya', sleeve: '#3a7ab8', grip: true }); W.hand(g, 1220, 380, 1.5, Math.PI - .6, { who: 'vitya', sleeve: '#3a7ab8', grip: true }); T.text(g, 'НЕЛЬЗЯ ТЕРЕТЬ!', 960, 200, 90, '#ff3a2a', {}); } }
function teaCup(t) { W.bg(g, '#f0c890'); T.shape(g, [[820, 480], [1100, 480], [1070, 760], [850, 760]], { fill: '#ffffff', lw: 8 }); T.line(g, T.ell(1110, 600, 50, 70, 16, -Math.PI / 2, Math.PI / 2), { line: '#ffffff', lw: 18 }); T.shape(g, T.ell(960, 490, 140, 26, 20), { fill: '#a8582a', lw: 5 }); W.steam(g, t, 960, 420, .9); T.text(g, 'МАЛЕНЬКИМИ ГЛОТКАМИ', 960, 200, 70, '#5a3a1a', { outline: false }); }
function bottleX(t) { W.bg(g, '#f0c890'); T.shape(g, [[880, 300], [1040, 300], [1060, 820], [860, 820]], { fill: '#bfe0c8', lw: 8 }); T.shape(g, T.rect(920, 180, 80, 130), { fill: '#bfe0c8', lw: 7 }); T.line(g, [[700, 260], [1220, 860]], { line: '#ff2a2a', lw: 30 }); T.line(g, [[1220, 260], [700, 860]], { line: '#ff2a2a', lw: 30 }); T.text(g, 'БЕЗ АЛКОГОЛЯ', 960, 120, 80, '#2a2a2a', { outline: false }); }
function bed(t) { W.bg(g, '#1a1e3a'); T.shape(g, T.rect(300, 600, 1400, 300), { fill: '#3a4a7a', lw: 7 }); T.shape(g, T.rrect(320, 520, 360, 120, 40), { fill: '#e8e4d8', lw: 6 }); W.faceClose(g, t, { eyes: 'wide', brow: 'worried', look: [1, -.4] }, { noBg: true, x: 520, y: 470, R: 130, who: 'vitya' }); T.shape(g, T.ell(1300, 280, 260, 200, 30), { fill: '#ffffff', lw: 6 }); W.puffer(g, 1300, 150, .38); T.text(g, '?', 1500, 200, 90, '#ffd23f', {}); }
function callSplit(t) { W.bg(g, '#1a1e3a'); T.bands(g, 1920, [0, 540], ['#2a2e4a', '#1a1e3a']); T.line(g, [[960, 0], [960, 1080]], { lw: 10, line: '#2a2a2a' }); W.faceClose(g, t, { eyes: 'open', brow: 'angry', mouth: Math.abs(Math.sin(t * 8)) * .5 }, { noBg: true, x: 480, y: 500, R: 220, who: 'owner' }); W.faceClose(g, t, { eyes: 'wide', brow: 'up' }, { noBg: true, x: 1440, y: 500, R: 220, who: 'vitya' }); T.text(g, 'У ТЕБЯ ЕСТЬ КЛЮЧ!', 480, 200, 54, '#ffd23f', {}); }
function clipboard(t) { W.bg(g, '#e8eef0'); T.shape(g, T.rrect(620, 160, 680, 820, 30), { fill: '#a87848', lw: 8 }); T.shape(g, T.rect(670, 240, 580, 700), { fill: '#f8f6ee', lw: 5 }); T.shape(g, T.rrect(860, 130, 200, 80, 16), { fill: '#c8ccd4', lw: 6 }); T.text(g, 'ОСТАТКИ', 960, 310, 60, '#2a2a2a', { outline: false }); ['Свинина — ?', 'Пельмени — ?', 'Рыба — ?'].forEach((s, i) => T.text(g, s, 720, 430 + i * 110, 54, '#2a2a2a', { outline: false, align: 'left', font: 'Caveat', weight: 700 })); W.hand(g, 1380, 760, 1.3, -2.6, { grip: true }); T.shape(g, T.rect(1250, 560, 30, 240), { fill: '#1a1a1a', lw: 5 }); }
function waiters(t) { W.kitchen(g, t, { sink: false }); for (const [x, f] of [[700, 1], [1150, -1]]) { const r = T.person(g, 'waiter', x, 1000, 1, { facing: f, armF: -1.2, face: { eyes: 'half', brow: 'neutral', smile: .5, look: [0, 1] } }); for (let i = 0; i < 3; i++) T.shape(g, T.rect(r.hand[0] - 40 + i * 8, r.hand[1] - 20 - i * 6, 80, 40), { fill: '#5ab85a', lw: 4, seed: i + x }); } T.text(g, 'ЧАЕВЫЕ', 960, 120, 70, '#2a2a2a', { outline: false }); }
function ownerTalk(t) { W.kitchen(g, t, { sink: false }); T.person(g, 'owner', 1250, 1000, 1, { facing: -1, face: { eyes: 'open', brow: 'neutral', look: [-1, 0] } }); T.person(g, 'you', 700, 1000, 1, { facing: 1, armF: -.9, face: { eyes: 'open', brow: 'worried', mouth: Math.abs(Math.sin(t * 8)) * .4 } }); sepia(.3); T.text(g, 'ВЧЕРА', 960, 120, 70, '#5a3a1a', { outline: false }); }
function vityaSink(t) { W.kitchen(g, t, { off: after(LIGHT._x) }); T.person(g, 'vitya', 1540, 1000, 1.1, { facing: 1, armF: -1.4 + Math.sin(t * 10) * .2, armB: -1.2, face: { eyes: 'half', brow: 'angry', look: [1, 0] } }); T.person(g, 'you', 520, 1000, 1, { facing: 1, face: { eyes: 'open', brow: 'worried', look: [1, 0] } }); }
function office(t, o = {}) { W.bg(g, '#d8c8a8'); T.shape(g, T.rect(-100, 760, 2200, 400), { fill: '#8a6a4a', line: false }); T.shape(g, T.rect(1000, 600, 700, 40), { fill: '#6a4a2a', lw: 6 }); T.shape(g, T.rrect(1300, 200, 300, 240, 20), { fill: '#f8f6ee', lw: 6 }); T.text(g, 'УПРАВЛЯЮЩИЙ', 1450, 320, 30, '#2a2a2a', { outline: false });
  T.person(g, 'oleg', 1250, 1000, 1, { facing: -1, face: { eyes: 'half', brow: 'neutral', smile: .5, mouth: o.chew ? Math.abs(Math.sin(t * 9)) * .25 : 0, look: [-1, 0] } }); T.person(g, 'you', o.youX ?? 650, 1000, 1, { facing: 1, walk: o.walk ? t * 3 : null, face: { eyes: 'open', brow: 'worried', look: [1, 0], mouth: o.talk ? Math.abs(Math.sin(t * 8)) * .4 : 0 } }); }
const olegFace = (f = {}, bgc = '#d8c8a8') => FACE({ eyes: 'half', brow: 'neutral', smile: .5, look: [-.6, 0], side: -.3, ...f }, { bg: bgc, who: 'oleg' });
// ── scenes
const SC = {
  hook(t, s) { cam(); TH.SCENE.A(t); TH.plates('A', 1 - clamp((t - .35) / .8)); TH.grade(); },
  hook_stakes(t, s) { return pick(s, t, [
    [null, () => { cam(); W.fzRoom(g, t, { carc: true }); T.person(g, 'you', 640, 900, 1, { facing: 1, armF: .5, armB: .4, face: { eyes: 'wide', brow: 'worried', look: [1, -.2] } }); W.breath(g, t, 600, 440, .8, -1); W.frostEdges(g, .4); }],
    ['телефон', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#16304a', wifi: false, batt: 40, top: '23:04', msgs: [{ text: ['Нет сети'], name: '112', nameCol: '#c82a2a' }] }); }],
    ['аварийной', () => { cam(); W.knobClose(g, t, { ring: true }); }]]); },
  hook_who(t, s) { return pick(s, t, [
    [null, () => { cam(); W.windowClose(g, t, 0); }],
    ['мелькает', () => { cam(); W.windowClose(g, t, 1 - k_(s, 'исчезает', .4)); }],
    ['кто', () => { cam(); W.windowClose(g, t, 0, { ring: true }); T.text(g, '?', 960, 540, 320, '#ff3a2a', {}); }],
    ['дожить', () => { cam(); W.hoursBar(g, t, k_(s, 'дожить', 1.5)); }],
    ['мороз', () => { cam(); W.thermo(g, t, -25); }]]); },
  rewind(t, s) { cam(); const k = ss(s.t0, s.t1, t), m = 23 * 60 + 4 - k * 124, hh = Math.floor(m / 60), mm = Math.floor(m % 60); lcd(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`); g.save(); g.globalAlpha = .45; g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const y = ((t * 900 + i * 197) % 1200) - 60; g.fillRect(0, y, 1920, 6 + (i % 3) * 4); } g.restore(); T.text(g, '◀◀ 2 ЧАСА НАЗАД', 960, 830, 80, '#fff6c8', { fixed: true }); },
  kitchen(t, s) { return pick(s, t, [
    [null, () => { cam(); W.kitchen(g, t, {}); T.text(g, 'РЕСТОРАН «ТАЙГА»', 1540, 300, 64, '#2a2a2a', { outline: false }); }],
    ['повар', () => { cam(); W.kitchen(g, t, { sink: false }); T.person(g, 'you', 960, 1000, 1.05, { facing: 1, armF: -.8, face: { eyes: 'half', brow: 'neutral', smile: .3 } }); }],
    ['плиты', () => { cam(560, 470, 1.6); W.kitchen(g, t, { off: after(at(s, 'гаснут')) }); }],
    ['официанты', () => { cam(); waiters(t); }],
    ['посудомойщик', () => { cam(); vityaSink(t); }],
    ['вчера', () => { cam(); ownerTalk(t); }],
    ['попляшешь', () => { cam(); FACE({ eyes: 'half', brow: 'angry', look: [1, 0], mouth: Math.abs(Math.sin(t * 9)) * .5, side: .3 }, { bg: '#e8eef0', who: 'vitya' }); }]]); },
  invoices(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'worried', look: [1, -.4], side: .3 }, { bg: '#e8eef0' }); }],
    ['накладные', () => { cam(); W.invoice(g, t, {}); }],
    ['двести', () => { cam(); W.invoice(g, t, { circle: true }); }],
    ['морозилке', () => { cam(); W.invoice(g, t, { circle: true, vs: true }); }],
    ['продает', () => { cam(); W.backDoor(g, t); }]]); },
  manager(t, s) { return pick(s, t, [
    [null, () => { cam(); office(t, { walk: true, youX: 450 + k_(s, 'идешь', 2.5) * 250 }); }],
    ['костюм', () => { cam(1250, 640, 1.6); office(t, {}); }],
    ['жвачка', () => { cam(); olegFace({ mouth: Math.abs(Math.sin(t * 9)) * .3, smile: .2 }); }],
    ['улыбка', () => { cam(); olegFace({ smile: .8 }); }],
    ['говоришь', () => { cam(); office(t, { talk: true }); }],
    ['перестает', () => { cam(); olegFace({ smile: 0, eyes: 'open', brow: 'angry', look: [-1, 0] }); }],
    ['пиши', () => { cam(); olegFace({ smile: .4, mouth: Math.abs(Math.sin(t * 7)) * .3 }); }],
    ['замерзни', () => { cam(); olegFace({ smile: .9, eyes: 'half' }); T.tint(g, '#7ad8ff', .12); }]]); },
  door_fix(t, s) { return pick(s, t, [
    [null, () => { cam(); W.corridorDoor(g, t, {}); T.person(g, 'you', 380, 1000, 1, { facing: 1, walk: t * 3, face: { eyes: 'open', brow: 'neutral', look: [1, .3] } }); }],
    ['отвертку', () => { cam(); W.corridorDoor(g, t, { screwdriver: true, ring: true }); }],
    ['улыбается', () => { cam(); W.corridorDoor(g, t, { screwdriver: true, oleg: true }); }]]); },
  grandpa(t, s) { return pick(s, t, [
    [null, () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#e8eef0', batt: 40, top: '22:58', msgs: [] }); T.text(g, '40%', 960, 560, 160, '#2a2a2a', { outline: false, font: 'JBMono', weight: 800 }); }],
    ['вспоминаешь', () => { cam(); W.polar(g, t, { kid: true }); }],
    ['повторял', () => { cam(); W.polar(g, t, { talk: true, point: true, rules: (after(at(s, 'пот')) ? 1 : 0) + (after(at(s, 'ветер')) ? 1 : 0) + (after(at(s, 'сон')) ? 1 : 0) }); }]]); },
  enter(t, s) { return pick(s, t, [
    [null, () => { cam(); lcd('23:00'); }],
    ['берешь', () => { cam(); clipboard(t); }],
    ['открываешь', () => { cam(); W.corridorDoor(g, t, { open: true, frost: true }); }],
    ['заходишь', () => { cam(); W.fzRoom(g, t, {}); T.person(g, 'you', 700 + k_(s, 'заходишь', 2) * 100, 900, 1, { facing: 1, walk: t * 3, face: { eyes: 'open', brow: 'neutral', look: [1, -.3] } }); W.breath(g, t, 700, 440, .7, -1); }],
    ['свиные', () => { cam(1580, 480, 1.6); W.fzRoom(g, t, {}); }],
    ['коробки', () => { cam(320, 360, 1.7); W.fzRoom(g, t, {}); }],
    ['ящики', () => { cam(320, 560, 1.7); W.fzRoom(g, t, {}); }]]); },
  slam(t, s) { return pick(s, t, [
    [null, () => { cam(); W.fzRoom(g, t, {}); T.person(g, 'you', 1300, 900, 1, { facing: -1, face: { eyes: 'wide', brow: 'up', look: [-1, -.2] } }); return { shake: at(s, 'хлопает') }; }],
    ['щелкает', () => { cam(); W.corridorDoor(g, t, { lockK: k_(s, 'щелкает', .25) }); if (after(at(s, 'гаснет'))) T.tint(g, '#02060c', .96); return { shake: at(s, 'щелкает') }; }],
    ['гаснет', () => { cam(); FZR({ dark: .97 }); }]]); },
  dark_knob(t, s) { return pick(s, t, [
    [null, () => { cam(); FZR({ beam: [760 + Math.sin(t * 1.3) * 200, 520] }); }],
    ['находишь', () => { cam(); W.knobClose(g, t, { dark: .7 }); }],
    ['грибок', () => { cam(); W.knobClose(g, t, { knob: true }); T.text(g, 'ТАК ДОЛЖНО БЫТЬ', 960, 900, 64, '#2a2a2a', { outline: false }); }],
    ['нет', () => { cam(); W.knobClose(g, t, { dark: .6 }); }],
    ['дырки', () => { cam(); W.knobClose(g, t, { dark: .5, ring: true }); }]]); },
  bang(t, s) { return pick(s, t, [
    [null, () => { cam(); fists(t, at(s, 'бьешь')); return { shake: at(s, 'бьешь') }; }],
    ['кричишь', () => { cam(); FROST({ eyes: 'wide', brow: 'angry', scream: 1 }); }],
    ['набираешь', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#16304a', wifi: false, batt: 38, top: '23:06', msgs: [{ me: true, text: ['112 ☎'] }, { name: 'Ошибка', text: ['Нет сети'], nameCol: '#c82a2a' }] }); }],
    ['бьешь', () => { cam(); fists(t, at(s, 'бьешь', 1)); return { shake: at(s, 'бьешь', 1) }; }, 1],
    ['мокрый', () => { cam(); FROST({ eyes: 'half', brow: 'worried', sweat: true, mouth: .3 }); W.steam(g, t, 960, 180, .8, '#ffffff', 140); }]]); },
  sweat(t, s) { return pick(s, t, [
    [null, () => { cam(); W.polar(g, t, { talk: true }); sepia(.15); }],
    ['замерзает', () => { cam(); chest(t, { ice: k_(s, 'замерзает', 1.5), open: .7 }); }],
    ['останавливаешься', () => { cam(); FZR({ hx: 760 }); T.person(g, 'you', 760, 900, 1, { facing: 1, armF: .2, face: { eyes: 'half', brow: 'worried' } }); }],
    ['распахиваешь', () => { cam(); chest(t, { open: k_(s, 'распахиваешь', .5) }); }],
    ['застегиваешь', () => { cam(); chest(t, { open: 1 - k_(s, 'застегиваешь', .5), zip: 1 - k_(s, 'застегиваешь', .5) }); }],
    ['дышишь', () => { cam(); FROST({ eyes: 'closed', brow: 'neutral' }); }]]); },
  fan(t, s) { return pick(s, t, [
    [null, () => { cam(1460, 175, 2); FZR({ wind: true, beam: [1460, 175], beamR: 500 }); }],
    ['гоняет', () => { cam(); FZR({ wind: true, beam: [960, 400], beamR: 800 }); T.person(g, 'you', 760, 900, 1, { facing: 1, armF: .6, armB: .5, face: { eyes: 'half', brow: 'worried' } }); }],
    ['ощущаются', () => { cam(); windChill(t, k_(s, 'тридцать', .4)); }],
    ['дед', () => { cam(); W.polar(g, t, { talk: true, point: true }); }]]); },
  shelter(t, s) { return pick(s, t, [
    [null, () => { cam(); FZR({ hx: 500 }); T.person(g, 'you', 760 - k_(s, 'уходишь', 2.5) * 300, 900, 1, { facing: -1, walk: t * 3, face: { eyes: 'half', brow: 'worried' } }); }],
    ['стаскиваешь', () => { cam(); FZR({ hx: 480, pallet: true }); T.person(g, 'you', 860, 900, 1, { facing: -1, lean: .4, armF: -1.2, armB: -1, face: { eyes: 'half', brow: 'angry' } }); }],
    ['металлический', () => { cam(); floorHeat(t); }],
    ['разбираешь', () => { cam(); flatBox(t, k_(s, 'разбираешь', 1.2)); }],
    ['кладешь', () => { cam(480, 760, 1.5); FZR({ hx: 480, beam: [480, 840], pallet: true, cardboard: 1 + Math.floor(clamp((t - (at(s, 'кладешь') ?? t)) / 1.2) * 2.99) }); }]]); },
  wrap(t, s) { return pick(s, t, [
    [null, () => { cam(); filmRoll(t); }],
    ['обматываешь', () => { cam(); FZR({ hx: 760, pallet: true, cardboard: 3 }); W.cocoon(g, t, 760, 900, 1, { wrap: k_(s, 'обматываешь', 2.5), armF: -.6 }); }],
    ['пропускает', () => { cam(); FZR({ hx: 760, wind: true, pallet: true, cardboard: 3 }); W.cocoon(g, t, 760, 900, 1, {}); T.glowRings(g, 760, 650, 260, '#ff9a4a', .14); }],
    ['голову', () => { cam(760, 520, 1.6); FZR({ hx: 760, beam: [760, 400], pallet: true, cardboard: 3 }); W.cocoon(g, t, 760, 900, 1, { box: true }); }],
    ['смешно', () => { cam(); FROST({ eyes: 'half', brow: 'sad', smile: .3 }); T.shape(g, T.rect(600, 40, 720, 220), { fill: '#d8b878', shade: '#b89858', shadeOff: [-16, 0], lw: 8 }); T.text(g, 'ПЕЛЬМЕНИ', 960, 150, 80, '#7a4a1a', { outline: false }); }]]); },
  huddle(t, s) { return pick(s, t, [
    [null, () => { cam(); FZR({ hx: 480, beam: [480, 700], pallet: true, cardboard: 3 }); W.cocoon(g, t, 480, 830, 1, { sit: true, box: true }); }],
    ['ладони', () => { cam(); armpits(t); }],
    ['посылку', () => { cam(480, 640, 1.5); FZR({ hx: 480, beam: [480, 640], pallet: true, cardboard: 3 }); W.cocoon(g, t, 480, 830, 1, { sit: true, box: true }); T.setRot(-.1, 640, 600); T.shape(g, T.rect(560, 560, 230, 90), { fill: '#ffffff', lw: 5 }); T.text(g, 'ХРУПКОЕ', 675, 605, 34, '#c82a2a', { outline: false }); T.setRot(0); }],
    ['впервые', () => { cam(); FROST({ eyes: 'half', brow: 'neutral', smile: .2 }, { frost: .3 }); }]]); },
  shiver(t, s) { return pick(s, t, [
    [null, () => { cam(); FROST({ eyes: 'wide', brow: 'worried', mouth: .2 }, { shiver: true }); }],
    ['печка', () => { cam(); bodyHeat(t); }],
    ['пальцы', () => { cam(); stiffHand(t, k_(s, 'перестанут', .8)); }],
    ['правило', () => { cam(); ruleCard(t, 'ПАЛЬЦЫ ЕЩЁ РАБОТАЮТ?', 'ДЕЛАЙ ВСЁ СЕЙЧАС'); }]]); },
  battery(t, s) { return pick(s, t, [
    [null, () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#16304a', wifi: false, batt: Math.round(25 - k_(s, 'тает', 2) * 5), top: '00:30', msgs: [] }); T.text(g, `${Math.round(25 - k_(s, 'тает', 2) * 5)}%`, 960, 560, 170, '#c82a2a', { outline: false, font: 'JBMono', weight: 800 }); }],
    ['убираешь', () => { cam(); pocketPhone(t, k_(s, 'убираешь', 1)); }],
    ['будильник', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#16304a', wifi: false, batt: 20, top: '00:31', msgs: [], alarm: 'КАЖДЫЕ 20 МИН' }); }],
    ['уснуть', () => { cam(); FROST({ eyes: 'half', brow: 'worried' }); }]]); },
  write(t, s) { return pick(s, t, [
    [null, () => { cam(); const a = at(s, 'пишешь') ?? s.t0, b = (at(s, 'сняли') ?? a + 5) + .5; W.boxWrite(g, t, clamp((t - a) / (b - a)), ['23:00.', 'ДВЕРЬ ЗАКРЫЛИ СНАРУЖИ.', 'КНОПКУ СНЯЛИ.']); T.dark(g, .45, [{ x: 960, y: 500, r: 700 }], '#04101c'); }],
    ['улика', () => { cam(); W.boxWrite(g, t, 1, ['23:00.', 'ДВЕРЬ ЗАКРЫЛИ СНАРУЖИ.', 'КНОПКУ СНЯЛИ.']); T.line(g, [[230, 760], [1500, 760]], { line: '#ff2a2a', lw: 14 }); T.text(g, 'УЛИКА', 1560, 640, 110, '#ff3a2a', { rot: -.08 }); }]]); },
  clues(t, s) { return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'angry', look: [1, 0], side: .3 }, { bg: '#e8eef0', who: 'vitya' }); sepia(.2); }],
    ['ключ', () => { cam(); W.suspects(g, t, { hl: 'vitya' }); }],
    ['отвертку', () => { cam(); W.corridorDoor(g, t, { screwdriver: true, oleg: true, ring: true }); sepia(.2); }],
    ['отправил', () => { cam(); W.suspects(g, t, { hl: 'oleg' }); }]]); },
  cta(t, s) { cam(); W.suspects(g, t, { q: true }); },
  door_wifi(t, s) { return pick(s, t, [
    [null, () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: false, batt: 14, top: '02:00', msgs: [], alarm: '02:00' }); }],
    ['встаешь', () => { cam(); FZR({ hx: 760, pallet: true, cardboard: 3 }); W.cocoon(g, t, 760, 900, 1, { armF: .2, armB: .2, face: { eyes: 'half', brow: 'worried' } }); }],
    ['подходишь', () => { cam(); W.windowClose(g, t, 0); T.dark(g, .5, [{ x: 960, y: 540, r: 500 }], '#04101c'); }],
    ['ловит', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 13, top: '02:01', msgs: [] }); if (Math.floor(t * 3) % 2) T.glowRings(g, 760, 150, 80, '#2a8a2a', .4); }]]); },
  chat(t, s) { const m1 = { name: 'Олег В. · 23:05', text: ['Повар ушёл раньше,', 'сказал, что заболел.', 'Камеру я закрыл.'] }, m2 = { name: 'Витёк', nameCol: '#3a7ab8', text: ['Странно. Его пуховик', 'висит на крючке.'] };
    return pick(s, t, [
    [null, () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 13, top: 'РАБОЧИЙ ЧАТ «ТАЙГА»', msgs: [] }); }],
    ['олег', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 13, top: 'РАБОЧИЙ ЧАТ «ТАЙГА»', msgs: [m1] }); }],
    ['витек', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 12, top: 'РАБОЧИЙ ЧАТ «ТАЙГА»', msgs: [m1, m2] }); }],
    ['пуховик', () => { cam(); coatHook(t); }]]); },
  realize(t, s) { return pick(s, t, [
    [null, () => { cam(); FROST({ eyes: 'wide', brow: 'up', look: [0, .6] }); T.glowRings(g, 960, 900, 300, '#6ab0ff', .2); }],
    ['всем', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 12, top: 'РАБОЧИЙ ЧАТ «ТАЙГА»', msgs: [{ name: 'Олег В. · 23:05', text: ['Повар ушёл раньше,', 'сказал, что заболел.', 'Камеру я закрыл.'] }] }); T.line(g, T.ell(915, 330, 260, 120, 30), { line: '#ff2a2a', lw: 10 }); }],
    ['утром', () => { cam(); W.corridorDoor(g, t, { oleg: true }); T.person(g, 'owner', 420, 1000, 1, { facing: 1, face: { eyes: 'open', brow: 'sad' } }); sepia(.35); T.shape(g, T.ell(1330, 300, 290, 120, 30), { fill: '#fff8ea', lw: 6 }); T.shape(g, [[1420, 400], [1470, 470], [1380, 410]], { fill: '#fff8ea', lw: 5 }); T.text(g, '«САМ ЗАШЁЛ,', 1330, 270, 46, '#3a2a1a', { outline: false }); T.text(g, 'САМ ЗАХЛОПНУЛ»', 1330, 330, 46, '#3a2a1a', { outline: false }); }],
    ['врет', () => { cam(); olegFace({ smile: .7, eyes: 'half' }, '#3a2a3a'); }]]); },
  send(t, s) { const msg = 'Я в камере. Меня запер Олег'; return pick(s, t, [
    [null, () => { cam(); const k = k_(s, 'пишешь', 2.5); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 3, top: 'Захар Ильич', msgs: [{ me: true, text: [msg.slice(0, Math.ceil(msg.length * k)).replace(/(.{16}\S*)\s/, '$1\n').split('\n')].flat() }] }); }],
    ['нажимаешь', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 1, top: 'Захар Ильич', msgs: [{ me: true, text: ['Я в камере.', 'Меня запер Олег'], status: 'отправляется…' }], spin: true }); }],
    ['гаснет', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', off: true, zero: Math.floor(t * 3) % 2 === 0 }); return { shake: at(s, 'гаснет') }; }]]); },
  panel(t, s) { return pick(s, t, [
    [null, () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#0e1a2a', wifi: true, batt: 1, top: '02:04', msgs: [], notif: ['КАМЕРА № 1', 'Температура −25°C', 'Норма'] }); }],
    ['датчик', () => { cam(1215, 340, 2.2); FZR({ beam: [1215, 340], beamR: 300, sensorRing: true }); }],
    ['теплее', () => { cam(); W.thermo(g, t, -15, { label: 'ПОРОГ ТРЕВОГИ', col: '#ff5a4a' }); }],
    ['тревога', () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#2a0e14', top: 'Захар Ильич', msgs: [], notif: ['⚠ КАМЕРА № 1', 'АВАРИЯ: теплее −15°C', 'Сообщение хозяину'] }); }]]); },
  stop_shiver(t, s) { return pick(s, t, [
    [null, () => { cam(); FROST({ eyes: 'half', brow: 'neutral' }, { frost: .8, icicles: true }); }],
    ['тепло', () => { cam(480, 620, 1.3); FZR({ hx: 480, beam: [480, 640], pallet: true, cardboard: 3 }); W.cocoon(g, t, 480, 830, 1, { sit: true, face: { eyes: 'half', brow: 'neutral', smile: .5 } }); T.tint(g, '#ff9a4a', .18); }],
    ['снять', () => { cam(); FROST({ eyes: 'half', brow: 'neutral', smile: .4 }, { bg: '#5a2a1a', frost: .4 }); T.tint(g, '#ff9a4a', .15); }],
    ['молнию', () => { cam(); zipper(t, k_(s, 'тянешь', 1.5), false); T.tint(g, '#ff9a4a', .12); }]]); },
  undress(t, s) { return pick(s, t, [
    [null, () => { cam(); trap(t); }],
    ['раздеваются', () => { cam(); snowUndress(t); }],
    ['закрываешь', () => { cam(); FROST({ eyes: 'closed', brow: 'neutral', smile: .2 }, { frost: .8 }); T.tint(g, '#000', k_(s, 'секунду', 2.5) * .75); }]]); },
  grandpa_voice(t, s) { return pick(s, t, [
    [null, () => { cam(); W.iceFishing(g, t, {}); }],
    ['спать', () => { cam(); W.iceFishing(g, t, { shout: true, wake: true }); return { shake: at(s, 'спать') }; }],
    ['открываешь', () => { cam(); FROST({ eyes: 'wide', brow: 'up' }, { frost: .7 }); }],
    ['застегиваешь', () => { cam(); zipper(t, k_(s, 'застегиваешь', 1.2), true); }]]); },
  plan(t, s) { return pick(s, t, [
    [null, () => { cam(); FZR({ beam: [960, 450], beamR: 420 }); }],
    ['обмануть', () => { cam(); FROST({ eyes: 'half', brow: 'angry', look: [1, -.5] }, { frost: .7 }); }],
    ['встаешь', () => { cam(); FZR({ hx: 1200, pallet: true, cardboard: 3 }); W.cocoon(g, t, 1200, 900, 1, { armF: -.4, face: { eyes: 'half', brow: 'angry', look: [1, -.6] } }); }],
    ['испаритель', () => { cam(1460, 200, 1.8); FZR({ beam: [1460, 180], beamR: 500, wind: true }); }],
    ['датчик', () => { cam(1215, 340, 2.4); FZR({ beam: [1215, 340], beamR: 300, sensorRing: true, wind: true }); T.text(g, 'ДАТЧИК', 1215, 430, 30, '#ffd23f', {}); }]]); },
  fan_stop(t, s) { const stop = after(at(s, 'останавливается')); return pick(s, t, [
    [null, () => { cam(1460, 180, 2); FZR({ beam: [1460, 180], beamR: 500, film: after((at(s, 'обматываешь') ?? 0) + 1), fanStop: stop, wind: !stop }); W.hand(g, 1340, 280, .7, -1.2, { grip: true }); }],
    ['ветра', () => { cam(); FZR({ beam: [960, 400], beamR: 700, film: true, fanStop: true }); }]]); },
  armpit(t, s) { return pick(s, t, [
    [null, () => { cam(1215, 340, 2.4); FZR({ beam: [1215, 340], beamR: 300, film: true, fanStop: true }); W.hand(g, 1175, 420, .5, -1.5, { grip: true }); }],
    ['засовываешь', () => { cam(); FZR({ hx: 1300, film: true, fanStop: true }); W.cocoon(g, t, 1300, 900, 1, { armF: -1.9, face: { eyes: 'half', brow: 'angry' } }); T.line(g, [[1250, 200], [1215, 230], [1360, 520]], { line: '#3a3a3a', lw: 4 }); }],
    ['тепло', () => { cam(); bodyHeat(t, { sensor: true, label: 'ТВОЁ ТЕПЛО → ДАТЧИК' }); }],
    ['плюс', () => { cam(); W.thermo(g, t, 30, { label: 'ДАТЧИК КАМЕРЫ', alarm: true }); }]]); },
  beep(t, s) { const nums = [['сто', '100'], ['двести', '200'], ['триста', '300']]; return pick(s, t, [
    [null, () => { cam(); FZR({ hx: 480, beam: [480, 640], pallet: true, cardboard: 3, film: true, fanStop: true }); W.cocoon(g, t, 480, 830, 1, { sit: true, face: { eyes: 'half', brow: 'worried', mouth: Math.abs(Math.sin(t * 6)) * .3 } }); let n = ''; for (const [w, v] of nums) if (after(at(s, w))) n = v; if (n) T.text(g, n + '…', 1100, 400, 160, '#ffd23f', {}); }],
    ['пищит', () => { cam(); W.kitchen(g, t, { off: true, door: true, sink: false }); T.dark(g, .55, [{ x: 1300, y: 300, r: 260 }], '#04101c'); const on = Math.floor(t * 3) % 2; T.shape(g, T.rrect(1240, 250, 130, 100, 14), { fill: on ? '#ff3a2a' : '#5a1a1a', lw: 6 }); T.text(g, 'АВАРИЯ', 1305, 380, 34, '#ff5a4a', {}); if (on) T.glowRings(g, 1305, 300, 160, '#ff2a2a', .3); }],
    ['сломалась', () => { cam(); W.thermo(g, t, 30, { label: 'КАМЕРА № 1', alarm: true }); }]]); },
  wait(t, s) { return pick(s, t, [
    [null, () => { cam(); lcd(after(at(s, 'шесть')) ? '06:00' : '05:30', '#ffd23f', '#0e1430'); }],
    ['никто', () => { cam(); W.windowClose(g, t, 0); T.dark(g, .5, [{ x: 960, y: 540, r: 500 }], '#04101c'); }],
    ['ног', () => { cam(); feet(t); }],
    ['прижимаешь', () => { cam(); FROST({ eyes: 'half', brow: 'sad', mouth: Math.abs(Math.sin(t * 5)) * .15 }, { frost: .9, icicles: true }); }]]); },
  open(t, s) { return pick(s, t, [
    [null, () => { cam(); lcd('06:40'); }],
    ['шаги', () => { cam(); W.windowClose(g, t, 0, { light: true }); const x = 700 + ((t * 300) % 500); T.shape(g, T.ell(x, 760, 90, 30, 16), { fill: 'rgba(0,0,0,.35)', line: false }); }],
    ['щелчок', () => { cam(); W.corridorDoor(g, t, { lockK: 1 - k_(s, 'щелчок', .25) }); return { shake: at(s, 'щелчок') }; }],
    ['распахивается', () => { cam(); doorOpen(t, k_(s, 'распахивается', .5), { owner: after(at(s, 'пороге')), vitya: after(at(s, 'витек')) }); }]]); },
  rescue(t, s) { return pick(s, t, [
    [null, () => { cam(); blanket(t, {}); }],
    ['накидывает', () => { cam(); blanket(t, { coat: true, vitya: true }); }],
    ['звонит', () => { cam(); blanket(t, { coat: true, owner: true }); }],
    ['растереть', () => { cam(); rubHands(t, after(at(s, 'хватает'))); }],
    ['чай', () => { cam(); teaCup(t); }],
    ['алкоголя', () => { cam(); bottleX(t); }]]); },
  why_vitya(t, s) { return pick(s, t, [
    [null, () => { cam(960, 430, 1.45); W.chat(g, t, { bg: '#1a1e3a', top: '05:20', batt: 64, msgs: [], notif: ['⚠ КАМЕРА № 1 · 05:20', 'АВАРИЯ КАМЕРЫ: +30°C', 'Ресторан «Тайга»'] }); }],
    ['позвонил', () => { cam(); callSplit(t); }],
    ['спал', () => { cam(); bed(t); }],
    ['пуховик', () => { cam(); coatHook(t); }]]); },
  manager_in(t, s) { const clock = () => { T.shape(g, T.ell(1540, 250, 110, 110, 30), { fill: '#ffffff', lw: 8 }); T.line(g, [[1540, 250], [1540, 160]], { lw: 8 }); T.line(g, [[1540, 250], [1490, 290]], { lw: 10 }); T.text(g, '07:00', 1540, 410, 44, '#2a2a2a', { outline: false, font: 'JBMono', weight: 800 }); };
    return pick(s, t, [
    [null, () => { cam(); W.kitchen(g, t, { sink: false }); clock(); T.person(g, 'you', 640, 1000, 1, { sit: true, face: { eyes: 'half', brow: 'sad', look: [1, 0] } }); T.shape(g, [[480, 640], [800, 640], [860, 980], [420, 980]], { fill: '#8a8a9a', shade: '#6a6a7a', shadeOff: [-20, 0] }); }],
    ['входит', () => { cam(); W.kitchen(g, t, { sink: false }); clock(); T.person(g, 'oleg', 1500 - k_(s, 'входит', 2) * 300, 1000, 1, { facing: -1, walk: t * 3, face: { eyes: 'half', brow: 'neutral', smile: .5, mouth: Math.abs(Math.sin(t * 9)) * .25 } }); }],
    ['жвачкой', () => { cam(); olegFace({ mouth: Math.abs(Math.sin(t * 9)) * .3, smile: .4 }, '#e8eef0'); }]]); },
  manager_face(t, s) { return pick(s, t, [
    [null, () => { cam(); olegFace({ eyes: 'wide', brow: 'up', smile: 0, scream: .5, look: [-1, .2], sweat: true }, '#e8eef0'); return { shake: at(s, 'видит') }; }],
    ['перестает', () => { cam(); olegFace({ eyes: 'wide', brow: 'worried', smile: 0, scream: .35, sweat: true }, '#e8eef0'); }],
    ['домой', () => { cam(); olegFace({ eyes: 'wide', brow: 'worried', smile: 0, scream: .25 + Math.abs(Math.sin(t * 6)) * .15, sweat: true }, '#e8eef0'); }]]); },
  log(t, s) { return pick(s, t, [
    [null, () => { cam(); W.kitchen(g, t, { sink: false }); T.person(g, 'owner', 760, 1000, 1, { facing: 1, armF: -1.6, face: { eyes: 'half', brow: 'angry', look: [1, 0] } }); T.person(g, 'oleg', 1300, 1000, 1, { facing: -1, face: { eyes: 'wide', brow: 'worried', sweat: true } }); }],
    ['журнал', () => { cam(); W.tablet(g, t, clamp((t - at(s, 'журнал')) / 4 + .2), { hl: after(at(s, 'десять')) }); }]]); },
  pocket(t, s) { const kk = (ss(at(s, 'жвачка'), (at(s, 'жвачка') ?? 0) + .4, t) + ss(at(s, 'ключи'), (at(s, 'ключи') ?? 0) + .4, t) + ss(at(s, 'грибок'), (at(s, 'грибок') ?? 0) + .4, t)) / 3;
    return pick(s, t, [
    [null, () => { cam(); FACE({ eyes: 'half', brow: 'angry', look: [1, 0], mouth: Math.abs(Math.sin(t * 6)) * .3, side: .3 }, { bg: '#e8eef0', who: 'owner' }); }],
    ['выворачивает', () => { cam(); W.pockets(g, t, kk); }]]); },
  callback(t, s) { return pick(s, t, [
    [null, () => { cam(980, 700, 1.25); W.kitchen(g, t, { sink: false }); T.person(g, 'you', 700, 1000, 1, { facing: 1, face: { eyes: 'half', brow: 'angry', look: [1, 0] } }); T.shape(g, [[540, 650], [860, 650], [900, 960], [500, 960]], { fill: '#8a8a9a', shade: '#6a6a7a', shadeOff: [-20, 0] }); T.person(g, 'oleg', 1250, 1000, 1, { facing: -1, face: { eyes: 'wide', brow: 'worried', sweat: true, look: [-1, 0] } }); }],
    ['замерз', () => { cam(); FACE({ eyes: 'half', brow: 'angry', look: [1, 0], side: .3, smile: .1 }, { bg: '#e8eef0' }); }],
    ['двести', () => { cam(); W.invoice(g, t, { circle: true }); }],
    ['пятьдесят', () => { cam(); W.invoice(g, t, { circle: true, vs: true }); }]]); },
  outro(t, s) { return pick(s, t, [
    [null, () => { cam(); W.grandpaHome(g, t, {}); }],
    ['спрашивает', () => { cam(); W.grandpaHome(g, t, { talk: true }); }],
    ['кивает', () => { cam(); W.grandpaHome(g, t, { smile: true }); }]]); },
  question(t, s) { cam(); W.grandpaHome(g, t, { smile: true }); T.tint(g, '#000', .3); },
  title(t, s) {
    const k = ss(s.t0, s.t0 + .45, t), vals = [36.6, 36, 35, 34, 33, 32, 34.5];
    if (k < 1 && s.prev && SC[s.prev.scene]) { SC[s.prev.scene](s.t0 - .01, s.prev); T.setCam(); }
    g.save(); g.globalAlpha = k; W.bigThermo(g, t, vals[(s.n || 1) - 1] ?? 36.6); g.restore();
  },
};
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function shakeAt(t, t0, amp = 22) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[1, -1, .8, -.7, .5, -.4, .3, -.1, 0][k] * amp, [.3, -.6, .5, -.3, .2, -.2, .1, 0, 0][k] * amp]; }
function bodyTemp(t) { const K = LIVE.keys; if (!K.length || t < K[0][0]) return 36.6; for (let i = 0; i < K.length; i++) { const [a, va] = K[i], nx = K[i + 1]; if (!nx) return va; if (t < nx[0]) return va + (nx[1] - va) * clamp((t - a) / Math.max(.1, nx[0] - a)); } return K[K.length - 1][1]; }
function draw(t) {
  const tReal = t; for (const [a, b, ft] of FREEZE) if (t >= a && t < b) t = ft ?? a;
  t_ = t; T.setTime(t); const s = segAt(t), f = SC[s.scene] || SC.hook;
  SH = [0, 0]; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
  let r = f(t, s) || {};
  if (r.shake != null && t > r.shake && t < r.shake + .4) { SH = shakeAt(t, r.shake); g.fillRect(0, 0, 1920, 1080); r = f(t, s) || {}; }
  T.setCam(); T.setRot(0); t = tReal;
  if (FREEZE.some(([a, b]) => t >= a && t < b)) T.tint(g, '#1a1030', .25);
  extras(t, s);
  for (const b of BIGW) if (t >= b.t && t < b.t + .7 && t > 1.6 && s.scene !== 'title' && !(STOP != null && t >= STOP - .2 && t < STOP + 1.7)) { const p = (t - b.t) / .7, sc = p < .15 ? .6 + p / .15 * .5 : 1.1 - .1 * p; g.save(); g.globalAlpha = p > .75 ? (1 - p) / .25 : 1; g.translate(960, 470); g.rotate(-.06); g.scale(sc, sc); let fs = 190; g.font = `900 ${fs}px Rubik`; while (g.measureText(b.w).width > 1500 && fs > 70) { fs -= 10; g.font = `900 ${fs}px Rubik`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 34; g.strokeStyle = T.INK; g.strokeText(b.w, 0, 0); g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText(b.w, 0, 0); g.fillStyle = '#ff3a2a'; g.fillText(b.w, 0, 0); g.restore(); }
  if (t > CU.total - .8) T.tint(g, '#000', (t - (CU.total - .8)) / .8);
}
function chip(txt, col, bgc, x = 960) { g.font = '800 40px JBMono'; const w = g.measureText(txt).width + 44; g.beginPath(); g.roundRect(x - w / 2, 22, w, 60, 16); g.fillStyle = bgc; g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke(); g.fillStyle = col; g.textAlign = 'center'; g.fillText(txt, x, 53); }
function extras(t, s) {
  g.save(); g.textBaseline = 'middle';
  // live readout: the camera from the title promise to the rewind, then you + the camera from the slam to the rescue
  if (LIVE.t0 != null && t >= LIVE.t0 && t < (LIVE.hookEnd ?? 0)) chip('КАМЕРА −25°C', '#7ad8ff', 'rgba(7,26,42,.8)');
  if (LIVE.t1 != null && t >= LIVE.t1 && s.scene !== 'title') { const done = LIVE.rescue != null && t >= LIVE.rescue; if (!done || t < LIVE.rescue + 6) {
    const bt = bodyTemp(Math.min(t, LIVE.rescue ?? t)), warm = LIVE.warm != null && t >= LIVE.warm && !done, low = bt <= 33.5;
    const txt = done ? 'СПАСЁН · 06:40' : `ТЫ ${bt.toFixed(1).replace('.', ',')}° · КАМЕРА ${warm ? '+30' : '−25'}°`;
    const col = done ? '#7aff9a' : warm && Math.floor(t * 3) % 2 ? '#ffffff' : warm ? '#ff5a4a' : low ? '#ffb03a' : '#7ad8ff';
    chip(txt, col, done ? 'rgba(0,90,40,.8)' : warm ? 'rgba(120,0,0,.75)' : 'rgba(7,26,42,.8)'); } }
  if (CTA && t >= CTA.t0 && t < CTA.t1) ctaPoll(t, Math.min(clamp((t - CTA.t0) / .25), clamp((CTA.t1 - t) / .3)), 'КТО ТЕБЯ ЗАПЕР?', [['ВИТЁК', '#3df2ff'], ['УПРАВЛЯЮЩИЙ', '#ff5a4a']], '💬 НАПИШИ В КОММЕНТАРИЯХ');
  if (s.scene === 'question') ctaPoll(t, clamp((t - s.t0) / .3), 'А ТЫ ЭТО ЗНАЛ?', [['ДА', '#3df2ff'], ['НЕТ', '#ff5a4a']], '💬 НАПИШИ В КОММЕНТАРИЯХ');
  if (STOP != null && t >= STOP && t < STOP + 1.5) { const k = t - STOP, n = 3 - Math.floor(k / .5);
    g.save(); g.translate(960, 420); g.rotate(-.08); g.font = '900 230px Rubik'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 40; g.strokeStyle = '#231629'; g.strokeText('СТОП', 0, 0); g.lineWidth = 14; g.strokeStyle = '#fff'; g.strokeText('СТОП', 0, 0); g.fillStyle = '#ff3a2a'; g.fillText('СТОП', 0, 0); g.restore();
    if (n > 0) { g.font = '900 120px Rubik'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#231629'; g.strokeText(String(n), 960, 620); g.fillStyle = '#ffd23f'; g.fillText(String(n), 960, 620); } }
  const subPop = (t0) => { if (t < t0 || t >= t0 + 3.2) return; const k = t - t0, a = Math.min(clamp(k / .3), clamp((3.2 - k) / .3)), pressed = k > 1.3, x = 1460 + (1 - a) * 500, y = 860;
    g.globalAlpha = a; g.beginPath(); g.roundRect(x, y - 50, 400, 100, 50); g.fillStyle = pressed ? '#5a5a6a' : '#e62117'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.font = '900 40px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(pressed ? 'ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ', x + 200, y + 2); g.globalAlpha = 1; };
  if (SUB != null) subPop(SUB); const q = SEG.find(x => x.scene === 'question'); if (q) { const ps = wt(q, 'подпишись'); if (ps != null) subPop(ps - .3); }
  g.restore();
}
