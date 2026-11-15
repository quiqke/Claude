// film.js — «30 дней в бункере»: shots keyed to spoken words; the rule sheet slides in on every rule card.
import * as T from './toon.js';
import * as W from './world.js';
let g, CU, SEG = [], EV = [], SH = [0, 0], BIGW = [], FREEZE = [], POLL = null, STOP = null, SUB = null;
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export async function init(cv, cues) {
  g = cv.getContext('2d'); CU = cues;
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  let prev = 'hook';
  for (const l of L) { const sc = l.kind === 'title' ? 'title' : (l.tags.scene || prev); prev = sc; const last = SEG[SEG.length - 1];
    if (last && last.scene === sc && sc !== 'title') last.lines.push(l); else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .2 }); }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .3; s.i = i; }); SEG[0].t0 = 0;
  SEG.forEach((s, i) => { if (s.scene === 'title') { s.prev = SEG[i - 1]; s.next = SEG[i + 1]; s.n = SEG.slice(0, i + 1).filter(x => x.scene === 'title').length; const h = [...cues.hud].reverse().find(x => x.t <= s.t1 + .5); s.day = h ? h.day : ''; s.clock = h ? h.time : ''; } });
  const wsc = (sc, pat, n = 0) => { for (const sg of SEG) if (sg.scene === sc) { const x = wt(sg, pat, n); if (x != null) return x; } return null; };
  const pq = wsc('poll', 'ответил'); if (pq != null) POLL = { t0: pq - .3, t1: (wsc('poll', 'прав') ?? pq + 3) + .6 };
  STOP = wsc('newspaper', 'разворачиваешь'); if (STOP != null) FREEZE.push([STOP, STOP + 1.5, STOP - .1]);
  SUB = cues.total * .35; for (const sg of SEG) if (sg.scene === 'title' && SUB > sg.t0 - 1 && SUB < sg.t1 + 3.6) SUB = sg.t1 + 4;
  if (POLL) ev(POLL.t0, 'poll'); if (STOP != null) ev(STOP, 'stop'); ev(SUB, 'subscribe');
  for (const e of cues.fx || []) if (e.type === 'danger' && e.value >= 90) ev(e.t, 'silence');
  for (const pg of cues.pages) { let pc = null; for (const w of pg.words) { if (w.c === 'danger' && pc !== 'danger') BIGW.push({ t: w.t0, w: w.w.replace(/[«»"“”.,:;!?—…]/g, '').toUpperCase() }); pc = w.c; } }
  for (const s of SEG) if (s.scene === 'title') { ev(s.t0, 'whoosh'); for (let i = 0; i < 14; i++) ev(s.t0 + .45 + i * .07, 'tap', { v: .6 }); }
  // foley keyed to words
  const W1 = (sc, w, type, o, n) => { const x = wsc(sc, w, n); if (x != null) ev(x, type, o); return x; };
  for (const [sc, w] of [['hook', 'стучит'], ['knock', 'стук'], ['knock', 'раз'], ['knock', 'два'], ['knock', 'три']]) W1(sc, w, 'knock', { v: 1.2 });
  W1('radio_on', 'щелкает', 'click'); W1('tube', 'лязгает', 'bolt'); W1('unplug', 'выдергиваешь', 'unplug'); W1('plug_back', 'вставляешь', 'click');
  for (const [w, n] of [['банка', 0], ['бутылка', 0], ['буханка', 0]]) { const x = wsc('tube', w, n); if (x != null) ev(x + .25, 'thud', { v: .5 }); }
  W1('newspaper', 'роняешь', 'thud'); W1('memory_hand', 'удар', 'hit'); W1('door_locked', 'поворачивается', 'bolt'); W1('rescue', 'лязг', 'bolt'); W1('rescue', 'скрип', 'door'); W1('light', 'распахивается', 'door');
  for (const [w, n] of [['бьешь', 0], ['снова', 0], ['снова', 1]]) { const x = wsc('climax_bang', w, n); if (x != null) { ev(x, 'knock', { v: 1.6 }); ev(x, 'thud', { v: .6 }); } }
  for (const x of [wsc('climax_vent', 'лай'), wsc('climax_bang', 'здесь'), wsc('rescue', 'собака')]) if (x != null) for (let i = 0; i < 4; i++) ev(x + i * .32, 'bark');
  const crackle = (t0, d) => { for (let i = 0; i < d * 9; i++) ev(t0 + i / 9 + ((i * 37) % 7) / 60, 'tick', { v: .9 }); };
  for (const [sc, w, d] of [['door', 'трещать', 3], ['counter_floor', 'трещит', 3], ['counter_radio', 'треск', 2.2]]) { const x = wsc(sc, w); if (x != null) crackle(x, d); }
  for (const b of cues.boxes) if (b.kind === 'dialog' && /Радио/.test(b.speaker || '')) ev(b.t0, 'static', { d: Math.max(1, b.t1 - b.t0), v: .5 });
  return { draw, EV };
}
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0) { if (!seg) return null; let k = 0; const p = norm(pat); for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; } return null; }
function cam(x = 960, y = 540, z = 1) { T.setCam(x, y, z, SH[0], SH[1]); }
let t_ = 0;
function pick(seg, t, list) { let cur = list[0][1], last = -1e9; for (const [w, fn, n] of list) { const at = w == null ? seg.t0 : wt(seg, w, n || 0); if (at != null && t >= at - .1 && at - last >= 2) { cur = fn; last = at; } } return cur(); }
const since = (seg, w, n = 0) => { const a = wt(seg, w, n); return a == null ? 0 : Math.max(0, t_ - a); };
const at = (seg, w, n = 0) => wt(seg, w, n);
const R = (o = {}) => W.room(g, t_, o);
const sitCot = (f, o = {}) => ({ x: 330, fy: 1010, s: 1, sit: true, facing: 1, armF: -.2, face: f, ...o });
const lieCot = f => ({ x: 560, fy: 735, s: .95, lie: true, facing: -1, face: f });
const stand = (x, f, o = {}) => ({ x, fy: 900, s: 1, face: f, ...o });
const tray = (items) => (x, y) => { for (const it of items) { if (it === 'can') { T.shape(g, T.rect(x - 52, y - 46, 34, 46), { fill: '#c94a3a', lw: 4 }); } if (it === 'bread') T.shape(g, T.rrect(x - 14, y - 36, 64, 36, 16), { fill: '#d8a060', lw: 4 }); if (it === 'news') T.shape(g, T.rrect(x - 14, y - 36, 64, 36, 16), { fill: '#e8e4d8', lw: 4 }); } };
const NIGHT = .8;
const SC = {
  hook(t, s) { return pick(s, t, [
    [null, () => { cam(); W.radioClose(g, t, { talk: true }); }],
    ['дверь', () => { cam(); W.doorClose(g, t, { night: .55 }); }],
    ['третью', () => { cam(700, 640, 1.5); R({ night: NIGHT, day: 3, hero: sitCot({ eyes: 'wide', brow: 'worried', look: [0, -1], sweat: true }) }); }],
    ['стучит', () => { cam(); W.ceilingKnock(g, t, [at(s, 'стучит'), at(s, 'стучит') + .45, at(s, 'стучит') + .9].filter(x => x != null)); return { shake: at(s, 'стучит') }; }],
  ]); },
  hook_voice(t, s) { return pick(s, t, [
    [null, () => { cam(); W.ventClose(g, t, { waves: 1, night: .5 }); }],
    ['мамы', () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [0, -1], tear: true }, { night: .45, lightY: 200 }); return { shake: at(s, 'мамы') }; }],
    ['зовет', () => { cam(); W.crossSection(g, t, { mouthWaves: true, people: { mom: { x: 470, armF: -1.4, face: { eyes: 'open', brow: 'worried', mouth: .6, look: [-.5, .5] } }, hero: { x: 800, face: { eyes: 'wide', brow: 'up', look: [-.5, -1] } } }, beam: [470, 330, 400] }); }],
    ['детским', () => { cam(); W.polaroid(g, t, 'mom'); }],
  ]); },
  hook_rules(t, s) { return pick(s, t, [
    [null, () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [0, -1], sweat: true }, { hands: true, night: .4 }); }],
    ['список', () => { cam(); W.rulesClose(g, t, {}); }],
    ['правило', () => { cam(); W.rulesClose(g, t, { circle: [[2, ss(at(s, 'правило'), at(s, 'правило') + .8, t)]] }); }],
  ]); },
  hook_bread(t, s) { return pick(s, t, [
    [null, () => { cam(); W.periView(g, t, {}); }],
    ['хлеб', () => { cam(); const a = at(s, 'хлеб'); W.tubeDrop(g, t, { open: 1, items: [{ kind: 'bread', x: 960, y: 700, k: (t - a) / .5, steam: .8 }] }); }],
    ['теплый', () => { cam(); W.breadHands(g, t, 1); }],
  ]); },
  rewind(t, s) { cam(); W.calendarClose(g, t, { cross: 3 * (1 - ss(s.t0, s.t1, t)) }); g.save(); g.globalAlpha = .5; g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const y = ((t * 900 + i * 197) % 1200) - 60; g.fillRect(0, y, 1920, 6 + (i % 3) * 4); } g.restore(); g.fillStyle = 'rgba(10,10,20,.8)'; g.fillRect(460, 470, 1000, 150); T.text(g, '◀◀ 3 ДНЯ НАЗАД', 960, 545, 96, '#fff6c8', { fixed: true }); },
  memory(t, s) { const fl = at(s, 'вспыхивает'); return pick(s, t, [
    [null, () => { cam(960, 600, 1); W.wasteland(g, t, { walk: true, hx: 500 + (t - s.t0) * 60 }); }],
    ['вспыхивает', () => { cam(960, 600, 1); W.wasteland(g, t, { flash: ss(fl, fl + .4, t), hx: 900, face: { eyes: 'wide', brow: 'up', look: [1, -.6], mouth: .5 } }); return { shake: fl }; }],
    ['ложись', () => { cam(); W.wristGrab(g, t, {}); return { shake: at(s, 'ложись') }; }],
    ['тянет', () => { cam(); W.wristGrab(g, t, { dark: ss(at(s, 'тянет'), at(s, 'темноту') ?? at(s, 'тянет') + 1.5, t) * .97 }); }],
  ]); },
  memory_hand(t, s) { return pick(s, t, [
    [null, () => { cam(); W.wristGrab(g, t, { smell: true }); }],
    ['мятными', () => { cam(); W.wrapperClose(g, t, { smell: true, tint: '#1a2a20' }); }],
    ['удар', () => { cam(); T.tint(g, '#000', 1); return { shake: at(s, 'удар') }; }],
  ]); },
  wake(t, s) { const op = at(s, 'просыпаешься'); return pick(s, t, [
    [null, () => { cam(); W.bigFace(g, t, { eyes: t - (op ?? t) > .8 ? 'open' : 'half', brow: 'worried', look: [0, -1], side: .3 }, { glow: [1000, 0, W.C.lamp] }); }],
    ['бетонные', () => { cam(); R({ day: 1, hero: sitCot({ eyes: 'open', brow: 'worried', look: [1, -.3] }) }); }],
    ['лампа', () => { cam(1000, 210, 3); R({ day: 1, lamp: Math.floor(t * 7) % 9 === 0 ? 0 : 1 }); }],
    ['пахнет', () => { cam(300, 90, 2.6); R({ day: 1 }); for (let i = 0; i < 4; i++) { const ph = ((t - (at(s, 'пахнет') ?? t)) * .8 + i / 4) % 1; T.dot(g, 280 + i * 30, 60 + ph * 120, 6, '#9fd0d8'); } }],
  ]); },
  tour(t, s) { const a0 = s.t0; return pick(s, t, [
    [null, () => { cam(); const k = clamp((t - a0) / 3.2); R({ day: 1, hero: stand(400 + k * 900, { eyes: 'open', brow: 'neutral', look: [1, 0] }, { walk: k < 1 ? t * 6 : null }) }); for (let i = 1; i <= Math.min(6, Math.floor(k * 6.99)); i++) T.text(g, String(i), 360 + i * 150, 960, 56, '#fff6c8', {}); }],
    ['полки', () => { cam(250, 520, 2.1); R({ day: 1 }); }],
    ['канистры', () => { cam(1400, 830, 2.6); R({ day: 1 }); }],
    ['противогаз', () => { cam(1560, 380, 3); R({ day: 1 }); }],
    ['перископ', () => { cam(880, 300, 1.8); R({ day: 1 }); }],
    ['радио', () => { cam(1110, 580, 2.6); R({ day: 1 }); }],
    ['счетчик', () => { cam(); W.counterClose(g, t, {}); }],
  ]); },
  wall_rules(t, s) { const a = at(s, 'список'); return pick(s, t, [
    [null, () => { cam(720, 420, 1.6); R({ day: 1, hero: stand(470, { eyes: 'open', brow: 'neutral', look: [1, -.4] }) }); }],
    ['семь', () => { cam(); W.rulesClose(g, t, { typed: (t - (at(s, 'семь') ?? t)) * 40 }); }],
  ]); },
  radio_on(t, s) { const on = at(s, 'оживает'); return pick(s, t, [
    [null, () => { cam(); W.radioClose(g, t, { on: on != null && t >= on, talk: on != null && t > on + .6 }); }],
    ['поверхности', () => { cam(); W.periView(g, t, {}); }],
    ['выживших', () => { cam(); W.radioClose(g, t, { talk: true }); }],
    ['тридцать', () => { cam(); W.calendarClose(g, t, { title: 'ДО ВЫХОДА' }); }],
  ]); },
  door(t, s) { const tr = at(s, 'трещать'); return pick(s, t, [
    [null, () => { cam(1300, 600, 1.3); const k = clamp((t - s.t0) / 2.5); R({ day: 1, hero: stand(900 + k * 520, { eyes: 'open', brow: 'worried', look: [1, 0] }, { walk: k < 1 ? t * 6 : null }) }); }],
    ['штурвалом', () => { cam(); W.doorClose(g, t, {}); }],
    ['ладонь', () => { cam(); W.doorClose(g, t, { hand: true, cold: true }); }],
    ['трещать', () => { cam(); W.counterClose(g, t, { clicks: 1 }); return { shake: tr }; }],
  ]); },
  door_counter(t, s) { return pick(s, t, [
    [null, () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [-1, 0], side: -.6, sweat: true }, { bg: '#7a847a' }); }],
    ['знал', () => { cam(); W.redDotClose(g, t, {}); }],
  ]); },
  smoke_dot(t, s) { return pick(s, t, [
    [null, () => { cam(); const k = clamp((t - s.t0) / 2); R({ day: 1, hero: stand(1420 - k * 300, { eyes: 'open', brow: 'worried', look: [1, 0] }, { walk: k < 1 ? -t * 6 : null }) }); }],
    ['потолком', () => { cam(1700, 250, 2.4); R({ day: 1 }); }],
    ['внимания', () => { cam(); W.redDotClose(g, t, {}); }],
  ]); },
  knock(t, s) { const hits = ['стук', 'раз', 'два', 'три'].map(w => at(s, w)).filter(x => x != null); return pick(s, t, [
    [null, () => { cam(600, 700, 1.4); R({ night: NIGHT, day: 3, hero: lieCot({ eyes: 'open', brow: 'worried', look: [0, -1] }) }); }],
    ['стук', () => { cam(); W.ceilingKnock(g, t, hits); const h = [...hits].reverse().find(x => t >= x); return { shake: h }; }],
    ['прямо', () => { cam(500, 640, 1.5); R({ night: NIGHT, day: 3, hero: sitCot({ eyes: 'wide', brow: 'up', look: [0, -1], sweat: true }) }); }],
  ]); },
  vent(t, s) { return pick(s, t, [
    [null, () => { cam(); W.ventClose(g, t, { waves: 1, night: .5 }); }],
    ['мама', () => { cam(); W.crossSection(g, t, { mouthWaves: true, people: { mom: { x: 470, armF: -1.4, face: { eyes: 'open', brow: 'worried', mouth: .7, look: [-.5, .5], tear: true } }, hero: { x: 800, face: { eyes: 'wide', brow: 'up', look: [-.5, -1] } } }, beam: [470, 330, 400] }); return { shake: at(s, 'мама') }; }],
    ['пожалуйста', () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'worried', look: [0, -1], tear: true }, { night: .45, lightY: 150 }); }],
  ]); },
  radio_warn(t, s) { return pick(s, t, [
    [null, () => { cam(); W.radioClose(g, t, { talk: true, alarm: true }); }],
    ['имитаторы', () => { cam(); W.ventClose(g, t, { night: .6 }); for (let i = 0; i < 3; i++) { const x = 700 + i * 260; T.shape(g, T.ell(x, 540, 70, 130, 20), { fill: '#05060c', line: false, seed: i }); T.dot(g, x - 20, 500, 10, '#ff3a2a'); T.dot(g, x + 20, 500, 10, '#ff3a2a'); T.shape(g, T.ell(x, 580, 30, 20 + 14 * Math.abs(Math.sin(t * 8 + i)), 14), { fill: '#7a1f2b', line: false }); } }],
    ['отвечайте', () => { cam(); W.radioClose(g, t, { talk: true, alarm: true }); }],
  ]); },
  mouth(t, s) { const men = { x: 640, facing: -1, armF: -.3, face: { eyes: 'half', brow: 'neutral', look: [-1, 0] } }; return pick(s, t, [
    [null, () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [0, -1], sweat: true }, { hands: true, night: .45, lightY: 150 }); }],
    ['сердце', () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [0, -1], sweat: true }, { hands: true, night: .45, lightY: 150 }); const b = Math.abs(Math.sin(t * 7)); T.text(g, 'ТУК-ТУК', 1520, 760, 80 + b * 18, '#ff8a7a', { fixed: true, rot: -.1 }); }],
    ['плач', () => { cam(); W.crossSection(g, t, { people: { mom: { x: 470, armF: .2, face: { eyes: 'closed', brow: 'sad', mouth: .4, tear: true } }, gena: men, hero: { x: 800, face: { eyes: 'wide', brow: 'up', look: [-.5, -1] } } }, beam: [640, 330, 520] }); }],
    ['знакомый', () => { cam(); W.bigFace(g, t, { eyes: 'open', brow: 'worried', look: [.5, -1] }, { night: .45, lightY: 150 }); }],
    ['здесь', () => { cam(); W.crossSection(g, t, { people: { mom: { x: 470, face: { eyes: 'half', brow: 'sad', tear: true } }, gena: { ...men, armF: -1.2 }, hero: { x: 800, face: { eyes: 'wide', brow: 'up', look: [-.5, -1] } } }, beam: [640, 330, 520] }); }],
  ]); },
  steps_away(t, s) { return pick(s, t, [
    [null, () => { cam(); const k = clamp((t - s.t0) / 3); W.crossSection(g, t, { people: { mom: { x: 470 + k * 500, walk: t * 5, face: { eyes: 'half', brow: 'sad' } }, gena: { x: 640 + k * 500, walk: t * 5 + 1, face: { eyes: 'half' } }, hero: { x: 800, face: { eyes: 'open', brow: 'sad', look: [.5, -1] } } } }); }],
    ['сидишь', () => { cam(500, 660, 1.5); R({ night: NIGHT, day: 3, hero: sitCot({ eyes: 'open', brow: 'sad', look: [0, -1] }) }); }],
  ]); },
  poll(t, s) { cam(); W.ventClose(g, t, { night: .55 }); },
  tube(t, s) { const L = at(s, 'лязгает'), it = (kind, w, x, y, o = {}) => ({ kind, x, y, k: (t - (at(s, w) ?? 1e9)) / .45, ...o }); return pick(s, t, [
    [null, () => { cam(); W.tubeDrop(g, t, { clock: true }); }],
    ['лязгает', () => { cam(); W.tubeDrop(g, t, { open: ss(L, L + .3, t), clank: t - L < .6 }); return { shake: L }; }],
    ['банка', () => { cam(); W.tubeDrop(g, t, { open: 1, items: [it('can', 'банка', 760, 700), it('bottle', 'бутылка', 960, 700), it('bread', 'буханка', 1180, 700)] }); }],
  ]); },
  bread(t, s) { const a = at(s, 'разламываешь'); return pick(s, t, [
    [null, () => { cam(); W.breadHands(g, t, ss(a, a + .8, t)); }],
    ['прижимаешь', () => { cam(); W.bigFace(g, t, { eyes: 'closed', brow: 'sad', smile: .5, side: .3 }, { bread: true, glow: [1300, 400, '#ffcf8a'] }); }],
    ['пекарня', () => { cam(); W.radioClose(g, t, { talk: true }); }],
  ]); },
  wrapper(t, s) { return pick(s, t, [
    [null, () => { cam(); W.tubeDrop(g, t, { open: 1, items: [{ kind: 'can', x: 760, y: 700, k: 1 }, { kind: 'bread', x: 1060, y: 700, k: 1 }, { kind: 'wrapper', x: 1300, y: 700, k: 1, ring: at(s, 'лишнее') != null && t > at(s, 'лишнее') }] }); }],
    ['фантик', () => { cam(); W.wrapperClose(g, t, {}); }],
    ['подносишь', () => { cam(); W.bigFace(g, t, { eyes: 'closed', brow: 'worried', side: .2 }, { wrapper: true }); }],
    ['вспоминаешь', () => { cam(); W.wristGrab(g, t, { smell: true }); T.tint(g, '#3a2a10', .25); }],
    ['запах', () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [0, -1] }, { wrapper: true }); return { shake: at(s, 'запах') }; }],
  ]); },
  wrapper_think(t, s) { return pick(s, t, [
    [null, () => { cam(); W.bigFace(g, t, { eyes: 'open', brow: 'worried', look: [.4, -1] }, {}); }],
    ['персонал', () => { cam(); W.radioClose(g, t, { talk: true }); }],
    ['одни', () => { cam(); W.redDotClose(g, t, {}); }],
  ]); },
  periscope_day(t, s) { return pick(s, t, [
    [null, () => { cam(880, 520, 1.6); R({ day: 12, hero: stand(880, { eyes: 'closed', brow: 'neutral' }, { s: .92, armF: -2.4, armB: -2.4 }) }); }],
    ['пепел', () => { cam(); W.periView(g, t, {}); }],
    ['ворона', () => { cam(); W.periView(g, t, { zoom: 'crow' }); }],
    ['часы', () => { cam(); W.periView(g, t, { zoom: 'clock' }); T.text(g, '4:17', 960, 1010, 70, '#fff6c8', { fixed: true, font: 'JBMono', weight: 800 }); }],
  ]); },
  periscope_days(t, s) { const tri = z => W.triptych(g, t, gg => W.periView(gg, t, { zoom: z }), ['ДЕНЬ 9', 'ДЕНЬ 10', 'ДЕНЬ 11']); return pick(s, t, [
    [null, () => { cam(); tri(null); }],
    ['ворона', () => { cam(); tri('crow'); }],
    ['часы', () => { cam(); tri('clock'); }],
  ]); },
  periscope_night(t, s) { return pick(s, t, [
    [null, () => { cam(); W.calendarClose(g, t, { cross: 12, ring: 12 }); }],
    ['подходишь', () => { cam(880, 560, 1.4); R({ night: .9, day: 12, hero: stand(880, { eyes: 'half', brow: 'worried', look: [0, -1] }, { s: .92, armF: -2.4, armB: -2.4 }) }); }],
    ['прижимаешься', () => { cam(); W.eyeClose(g, t, { light: 0 }); }],
  ]); },
  periscope_reveal(t, s) { const d = at(s, 'день'); return pick(s, t, [
    [null, () => { cam(); W.eyeClose(g, t, { light: ss(d ?? t, (d ?? t) + .3, t) }); }],
    ['день', () => { cam(); W.periView(g, t, { label: 'НОЧЬ · 23:40' }); return { shake: d }; }],
    ['ночи', () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [1, 0], scream: .8, side: .5 }, { night: .7, lightX: 1500, lightY: 450, glow: [1600, 450, '#fff6d0'] }); }],
    ['нарушение', () => { cam(); W.radioClose(g, t, { talk: true, alarm: true }); }],
  ]); },
  periscope_back(t, s) { return pick(s, t, [
    [null, () => { cam(880, 560, 1.3); const k = clamp((t - s.t0) / .8); R({ night: .85, day: 12, periGlow: .3, holes: [{ x: 880, y: 460, r: 220 }], hero: stand(880 - k * 160, { eyes: 'wide', brow: 'up', look: [1, -.5], sweat: true }, { armF: 1.2 }) }); }],
    ['точка', () => { cam(); W.redDotClose(g, t, { fast: true, night: .5 }); }],
  ]); },
  counter_floor(t, s) { return pick(s, t, [
    [null, () => { cam(); W.counterClose(g, t, { clicks: 1 }); }],
    ['ложишься', () => { cam(700, 820, 1.5); R({ day: 16, lamp: .6, hero: { x: 1100, fy: 880, s: .95, lie: true, facing: -1, mask: true, face: { eyes: 'closed' } } }); }],
    ['считаешь', () => { cam(); W.bigFace(g, t, { eyes: 'open' }, { mask: true, bg: '#5d625b' }); T.text(g, String(17 + Math.floor((t - (at(s, 'считаешь') ?? t)) * 3)), 1550, 300, 160, '#fff6c8', { fixed: true, font: 'JBMono', weight: 800 }); }],
    ['замечаешь', () => { cam(); W.bigFace(g, t, { eyes: 'half', brow: 'angry', look: [1, 0] }, { mask: true, bg: '#5d625b' }); }],
  ]); },
  counter_radio(t, s) { const on = at(s, 'включается'), off = at(s, 'замолкает'), live = on != null && t >= on && !(off != null && t >= off); cam();
    W.bg(g, '#2a2620'); T.shape(g, T.rect(-200, 820, 2400, 400), { fill: W.C.wood, shade: W.C.woodS, shadeOff: [0, -20] });
    W.radioBox(g, 160, 330, 3.3, { radioOn: live }); W.counterBox(g, 1180, 400, 4.2, { clicks: live ? 1 : 0, tt: t });
    if (live) { for (let k = 0; k < 3; k++) { const ph = (t * 1.4 + k / 3) % 1; g.save(); g.globalAlpha = 1 - ph; T.line(g, T.ell(360, 560, 220 + ph * 300, 220 + ph * 300, 30, -Math.PI * .3, Math.PI * .3), { line: '#ffe7a0', lw: 9 }); g.restore(); } if (Math.floor(t * 8) % 2) T.text(g, 'ТРЕСК', 1390, 300, 90, '#fff', { rot: .1 }); }
    T.text(g, live ? 'РАДИО: ВКЛ' : 'РАДИО: ВЫКЛ', 960, 200, 70, live ? '#7aff9a' : '#ff8a7a', { font: 'JBMono', weight: 800 }); },
  unplug(t, s) { const a = at(s, 'выдергиваешь'); return pick(s, t, [
    [null, () => { cam(); W.plugClose(g, t, { out: ss(a, a + .4, t) }); }],
    ['тишина', () => { cam(1150, 600, 2.4); R({ day: 16, radioOn: false }); }],
    ['подходишь', () => { cam(); W.doorClose(g, t, { hand: true }); }],
    ['молчит', () => { cam(); W.counterClose(g, t, {}); }],
  ]); },
  ceiling_voice(t, s) { return pick(s, t, [
    [null, () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [1, -1], sweat: true, side: .4 }, {}); }],
    ['потолка', () => { cam(); W.redDotClose(g, t, { waves: true }); return { shake: at(s, 'потолка') }; }],
    ['вставь', () => { cam(); W.plugClose(g, t, { out: 1 }); }],
    ['умрешь', () => { cam(); W.periView(g, t, {}); }],
  ]); },
  plug_back(t, s) { const a = at(s, 'вставляешь'); return pick(s, t, [
    [null, () => { cam(); W.plugClose(g, t, { out: 1, shake: true }); }],
    ['вставляешь', () => { cam(); W.plugClose(g, t, { out: 1 - ss(a, a + .4, t), spark: t - a > .4 && t - a < 1 }); }],
    ['доказательства', () => { cam(); W.bigFace(g, t, { eyes: 'half', brow: 'angry', look: [1, 0] }, {}); }],
  ]); },
  wires(t, s) { const hl = (t >= (at(s, 'третий') ?? 1e9)) ? 3 : t >= (at(s, 'второй') ?? 1e9) ? 2 : t >= (at(s, 'первый') ?? 1e9) ? 1 : 0; return pick(s, t, [
    [null, () => { cam(1150, 640, 1.6); R({ night: NIGHT, day: 20, holes: [{ x: 1110, y: 600, r: 260 }], hero: stand(1250, { eyes: 'open', brow: 'angry', look: [-1, 0] }, { facing: -1, armF: -1.2 }) }); }],
    ['провода', () => { cam(); W.wiresClose(g, t, hl); }],
    ['точке', () => { cam(1700, 300, 1.8); R({ night: .6, day: 20, holes: [{ x: 1860, y: 140, r: 200 }], extra: () => T.line(g, [[1210, 520], [1300, 300], [1600, 150], [1850, 140]], { line: '#fff6a0', lw: 10 }) }); }],
  ]); },
  camera(t, s) { const b = at(s, 'светишь'); return pick(s, t, [
    [null, () => { cam(700, 500, 1.2); R({ night: NIGHT, day: 20, holes: [{ x: 420, y: 400, r: 320 }], hero: { x: 400, fy: 770, s: 1, armF: -2.4, lamp: true, face: { eyes: 'open', brow: 'angry', look: [1, -1] } }, extra: () => { g.save(); g.globalAlpha = .25; g.fillStyle = '#fff6c8'; g.beginPath(); const a = T.P([460, 240]), b = T.P([1880, 60]), c = T.P([1880, 260]); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.fill(); g.restore(); } }); }],
    ['решеткой', () => { cam(); W.redDotClose(g, t, { beam: 1, lens: ss(at(s, 'объектив') ?? t + 9, (at(s, 'объектив') ?? t + 9) + .4, t) || .001, night: .3 }); }],
    ['смотрит', () => { cam(); W.cameraPOV(g, t, () => { cam(1300, 640, 1.2); R({ day: 20, hero: { x: 1420, fy: 760, s: 1, armF: -2.6, face: { eyes: 'wide', brow: 'up', look: [1, -1] } } }); }, 'КАМЕРА 1 · ДЕНЬ 20 · 03:14'); }],
  ]); },
  weather(t, s) { return pick(s, t, [
    [null, () => { cam(1110, 560, 1.8); R({ day: 20, hero: stand(900, { eyes: 'half', brow: 'angry', look: [1, 0] }, { s: .95, armF: -1.2 }) }); }],
    ['радиационный', () => { cam(); W.radioClose(g, t, { talk: true }); T.text(g, 'ВЕТЕР С-З · 8 М/С', 960, 150, 60, '#fff6c8', { fixed: true, font: 'JBMono', weight: 800 }); }],
  ]); },
  weather_tape(t, s) { return pick(s, t, [
    [null, () => { cam(); W.waveTriptych(g, t, {}); }],
    ['кашляет', () => { cam(); W.waveTriptych(g, t, { cough: true }); }],
    ['запись', () => { cam(); W.tapeReel(g, t); }],
  ]); },
  radio_live(t, s) { return pick(s, t, [
    [null, () => { cam(600, 700, 1.4); R({ night: NIGHT, day: 20, holes: [{ x: 1110, y: 580, r: 200 }], hero: lieCot({ eyes: 'open', brow: 'worried', look: [1, 0] }) }); }],
    ['знаю', () => { cam(); W.cameraPOV(g, t, () => { cam(500, 760, 1.6); R({ day: 20, lamp: .3, hero: lieCot({ eyes: 'wide', brow: 'up', look: [0, -1] }) }); }, 'КАМЕРА 1 · ДЕНЬ 20 · 02:51'); return { shake: at(s, 'знаю') }; }],
  ]); },
  newspaper(t, s) { const r = at(s, 'роняешь'); return pick(s, t, [
    [null, () => { cam(); W.tubeDrop(g, t, { open: 1, items: [{ kind: 'bread', x: 960, y: 700, k: 1, news: true }] }); }],
    ['разворачиваешь', () => { cam(); W.newsClose(g, t, { unfold: ss(at(s, 'разворачиваешь') + 1.4, at(s, 'разворачиваешь') + 2.2, t) }); }],
    ['роняешь', () => { cam(1300, 760, 1.6); R({ day: 24, hero: stand(1250, { eyes: 'wide', brow: 'up', look: [-1, 0], mouth: .5 }, { facing: -1, armF: -1.3 }), extra: () => { const k = ss(r, r + .5, t); T.shape(g, T.rrect(1140, 600 + k * 260, 120, 60, 26), { fill: '#d8a060', lw: 6 }); } }); return { shake: r }; }],
  ]); },
  flyer(t, s) { return pick(s, t, [
    [null, () => { cam(); W.newsClose(g, t, { photo: true }); return { shake: at(s, 'фотография') }; }],
  ]); },
  realize(t, s) { return pick(s, t, [
    [null, () => { cam(960, 600, 1); W.wasteland(g, t, { fireworks: true, square: true, hero: false }); }],
    ['войны', () => { cam(); W.bigFace(g, t, { eyes: 'wide', brow: 'up', look: [0, 0], mouth: .4 }, {}); }],
    ['булочной', () => { cam(); W.bakery(g, t); }],
    ['голос', () => { cam(); W.crossSection(g, t, { mouthWaves: true, people: { mom: { x: 470, armF: -1.4, face: { eyes: 'open', brow: 'worried', mouth: .6, tear: true } }, hero: { x: 800, face: { eyes: 'wide', brow: 'sad', look: [-.5, -1] } } }, beam: [470, 330, 400] }); T.tint(g, '#c89050', .12); }],
  ]); },
  door_locked(t, s) { const h = at(s, 'хватаешь'); return pick(s, t, [
    [null, () => { cam(1300, 600, 1.3); const k = clamp((t - s.t0) / 1.4); R({ day: 24, hero: stand(1000 + k * 420, { eyes: 'wide', brow: 'angry', look: [1, 0] }, { walk: k < 1 ? t * 9 : null }) }); }],
    ['хватаешь', () => { cam(); W.doorClose(g, t, { hand: true, two: true, strain: true, rot: Math.sin(t * 30) * .02 }); }],
    ['заперта', () => { cam(); W.doorClose(g, t, { bolt: ss(at(s, 'заперта'), at(s, 'заперта') + .4, t) }); return { shake: at(s, 'заперта') }; }],
    ['нашел', () => { cam(); W.radioClose(g, t, { talk: true, alarm: true }); }],
  ]); },
  climax_vent(t, s) { const cops = [{ x: 820, face: { eyes: 'open', brow: 'neutral', look: [-1, .3] } }, { x: 940, facing: -1, face: { eyes: 'open' } }]; return pick(s, t, [
    [null, () => { cam(); W.crossSection(g, t, { people: { cops, dog: { x: 300 }, gena: { x: 1200, facing: -1, face: { eyes: 'half', brow: 'worried' } }, hero: { x: 800, face: { eyes: 'wide', brow: 'up', look: [-.5, -1] } } }, beam: [820, 300, 400] }); }],
    ['собаки', () => { cam(330, 300, 2.4); W.crossSection(g, t, { people: { dog: { x: 300, bark: true }, cops } }); }],
    ['мамы', () => { cam(); W.crossSection(g, t, { mouthWaves: true, people: { mom: { x: 470, armF: -1.4, face: { eyes: 'open', brow: 'worried', mouth: .6 } }, cops, dog: { x: 250 }, hero: { x: 800, face: { eyes: 'wide', brow: 'up', look: [-.5, -1] } } }, beam: [470, 330, 400] }); }],
    ['молчи', () => { cam(); W.radioClose(g, t, { talk: true, alarm: true }); }],
  ]); },
  climax_choice(t, s) { const a = at(s, 'правило'), b = at(s, 'правило', 1); return pick(s, t, [
    [null, () => { cam(); W.rulesClose(g, t, { circle: [[2, ss(a, a + .6, t)], [7, ss(b ?? 1e9, (b ?? 1e9) + .6, t)]] }); }],
    ['срываешь', () => { cam(1560, 380, 2.6); const k = ss(at(s, 'срываешь'), at(s, 'срываешь') + .4, t); R({ day: 24, noMask: true, extra: () => { W.gasMask(g, 1560 - k * 80, 380 + k * 60, .9); W.hand(g, 1490 - k * 80, 470 + k * 60, .45, -1.2, { grip: true }); } }); }],
  ]); },
  climax_bang(t, s) { const hits = [at(s, 'бьешь'), at(s, 'снова'), at(s, 'снова', 1)].filter(x => x != null), last = [...hits].reverse().find(x => t >= x); return pick(s, t, [
    [null, () => { cam(400, 420, 1.6); R({ night: .6, day: 24, hero: stand(420, { eyes: 'half', brow: 'angry', look: [0, -1], mouth: .4 }, { armF: -2.8 + (last != null && t - last < .2 ? .8 : 0) }), extra: () => { if (last != null && t - last < .5) T.text(g, 'БАМ!', 300, 230, 90, '#fff6c8', { rot: -.1 }); } }); return { shake: last }; }],
    ['кричишь', () => { cam(); W.bigFace(g, t, { eyes: 'closed', brow: 'angry', mouth: 1, look: [0, -1] }, { night: .3, lightY: 200 }); return { shake: at(s, 'мама') }; }],
    ['здесь', () => { cam(); W.crossSection(g, t, { mouthWaves: true, people: { mom: { x: 470, armF: -1.6, face: { eyes: 'wide', brow: 'up', mouth: .7, look: [-.4, .6] } }, cops: [{ x: 640, walk: t * 8, face: { eyes: 'wide' } }, { x: 760, walk: t * 8 + 1, face: { eyes: 'open' } }], dog: { x: 300, bark: true }, hero: { x: 800, armF: -2.8, face: { eyes: 'closed', brow: 'angry', mouth: 1 } } } }); }],
  ]); },
  rescue(t, s) { const d = at(s, 'тяжелое'), w = at(s, 'штурвал'); return pick(s, t, [
    [null, () => { cam(1300, 300, 1.5); W.crossSection(g, t, { lit: true, people: { cops: [{ x: 1250, armF: -1.2, face: { eyes: 'open', brow: 'angry' } }], dog: { x: 1000, bark: true } } }); }],
    ['тяжелое', () => { cam(1400, 320, 1.6); W.crossSection(g, t, { lit: true, drag: ss(d, d + 2, t), people: { cops: [{ x: 1220 + ss(d, d + 2, t) * 260, armF: -1, lean: .3, face: { eyes: 'half', brow: 'angry', mouth: .3 } }] } }); }],
    ['скрип', () => { cam(); W.ceilingKnock(g, t, [at(s, 'скрип'), at(s, 'лязг')].filter(x => x != null)); return { shake: at(s, 'лязг') }; }],
    ['штурвал', () => { cam(); W.doorClose(g, t, { rot: ss(w, w + 2, t) * 3 }); }],
  ]); },
  light(t, s) { const o = at(s, 'распахивается'); return pick(s, t, [
    [null, () => { cam(1600, 560, 1.2); R({ day: 24, open: ss(o, o + .6, t) || .01, night: .5 * (1 - ss(o, o + 1, t)), holes: [{ x: 1740, y: 560, r: 500 }], hero: stand(1300, { eyes: 'half', brow: 'up', look: [1, -.2] }, { armF: -1.6 }) }); }],
    ['полицейский', () => { cam(); W.bg(g, '#1a1a20'); T.glowRings(g, 960, 300, 700, '#fff0b0', .5); T.shape(g, T.rect(560, 0, 800, 560), { fill: '#ffe8a8', line: false }); const r = T.person(g, 'cop', 960, 980, 1.2, { armF: -2.3, face: { eyes: 'open', brow: 'up', smile: .4, look: [0, 1] } }); W.cap(g, r.head[0], r.head[1], r.R); for (let y = 600; y < 1080; y += 70) T.line(g, [[560, y], [1360, y]], { line: '#8a8a8a', lw: 12 }); }],
    ['мама', () => { cam(); W.bg(g, '#e8c890'); T.glowRings(g, 960, 300, 800, '#fff0b0', .3); T.person(g, 'mom', 820, 1150, 1.6, { armF: -1.6, face: { eyes: 'closed', brow: 'sad', smile: .7, tear: true } }); T.person(g, 'you', 1150, 1150, 1.5, { armF: -1.7, facing: -1, face: { eyes: 'closed', brow: 'sad', smile: .5, tear: true } }); }],
  ]); },
  neighbor(t, s) { return pick(s, t, [
    [null, () => { cam(1400, 520, 1.3); W.garage(g, t, {}); }],
    ['дядя', () => { cam(); W.genaFace(g, t, { eyes: 'half', brow: 'sad', look: [-1, .4], side: -.4 }); }],
    ['детстве', () => { cam(); W.polaroid(g, t, 'gena'); }],
    ['полыхнуло', () => { cam(); W.genaFace(g, t, { eyes: 'open', brow: 'worried', mouth: .4, tear: true, look: [0, 0] }); }],
    ['спас', () => { cam(1560, 520, 2.2); W.garage(g, t, { gface: { eyes: 'closed', brow: 'sad', tear: true } }); }],
  ]); },
  neighbor_story(t, s) { return pick(s, t, [
    [null, () => { cam(); W.crossSection(g, t, { day: true, label: true, people: { gena: { x: 1300, facing: -1, face: { eyes: 'half', brow: 'sad' } } } }); }],
    ['салюта', () => { cam(960, 600, 1); W.wasteland(g, t, { fireworks: true, hero: false }); const r = T.person(g, 'gena', 1500, 1060, 1.1, { facing: -1, armF: -2, face: { eyes: 'wide', brow: 'up', scream: .9, look: [-1, -1] } }); W.glasses(g, r.head[0] - 3, r.head[1], r.R, -.7); }],
    ['понял', () => { cam(1700, 420, 2.4); W.garage(g, t, { gface: { eyes: 'closed', brow: 'sad' } }); T.dark(g, .55, [{ x: 1735, y: 445, r: 160 }], '#0a0e20'); }],
  ]); },
  explain(t, s) { return pick(s, t, [
    [null, () => { cam(); W.periCutaway(g, t); }],
    ['счетчик', () => { cam(); W.counterClose(g, t, { open: true }); }],
    ['красная', () => { cam(); W.redDotClose(g, t, { lens: 1 }); T.text(g, 'КАМЕРА', 960, 800, 90, '#fff', { fixed: true }); }],
    ['серая', () => { cam(); W.bg(g, '#3a3430'); T.shape(g, T.rrect(560, 380, 360, 360, 180), { fill: '#b8a080', lw: 8 }); T.shape(g, T.ell(740, 560, 80, 80, 24), { fill: '#3a3430', lw: 6 }); for (let i = 0; i < 5; i++) T.shape(g, T.rect(1050, 700 - i * 40, 420, 36), { fill: '#e8e4d8', lw: 5, seed: i }); T.text(g, 'ДЕНЬ 24', 960, 220, 90, '#fff6c8', { fixed: true, font: 'JBMono', weight: 800 }); }],
  ]); },
  outro(t, s) { return pick(s, t, [
    [null, () => { cam(); W.calendarClose(g, t, { cross: 23 * ss(s.t0, s.t0 + 2, t), title: 'ДВЕРЬ ОТКРЫТА' }); }],
    ['страх', () => { cam(); W.bigShadow(g, t); }],
    ['правила', () => { cam(); const k = ss(at(s, 'правила'), at(s, 'правила') + 1.6, t); W.bg(g, W.C.wall); g.save(); g.translate(0, k * 900); g.rotate(k * .2); W.rulesClose(g, t, {}); g.restore(); }],
  ]); },
  question(t, s) { cam(); W.bg(g, '#f0b070'); T.bands(g, 1920, [0, 420, 760], ['#f0b070', '#f8c890', '#7ab04a']); T.glowRings(g, 1650, 300, 300, '#fff6c8', .5);
    T.person(g, 'mom', 1260, 1060, 1.25, { armF: -.6, face: { eyes: 'closed', smile: .7 } }); T.person(g, 'you', 1580, 1060, 1.25, { facing: -1, armF: -.6, face: { eyes: 'open', smile: .6, look: [-1, 0] } }); },
  title(t, s) {
    const k = ss(s.t0, s.t0 + .45, t);
    if (k < 1 && s.prev && SC[s.prev.scene]) { SC[s.prev.scene](s.t0 - .01, s.prev); T.setCam(); }
    g.save(); g.translate(0, (1 - k) * 1100);
    if (s.n <= 7) W.rulesClose(g, t, { circle: [[s.n, ss(s.t0 + .5, s.t0 + 1.3, t)]] });
    else W.rulesClose(g, t, { cross: [1, 2, 3, 4, 5, 6, 7].map(i => [i, ss(s.t0 + .4 + i * .12, s.t0 + .7 + i * .12, t)]) });
    g.restore();
    const tag = `ДЕНЬ ${s.day || '?'} · ${s.clock || ''}`, n = Math.floor(clamp((t - s.t0 - .5) * 30, 0, tag.length));
    if (n) { g.save(); g.font = '800 46px JBMono'; g.textBaseline = 'middle'; const w = g.measureText(tag).width; g.fillStyle = 'rgba(20,16,12,.85)'; g.fillRect(40, 754, w + 48, 72); g.strokeStyle = '#ffc928'; g.lineWidth = 4; g.strokeRect(40, 754, w + 48, 72); g.fillStyle = '#ffc928'; g.fillText(tag.slice(0, n) + (Math.floor(t * 4) % 2 ? '_' : ''), 64, 790); g.restore(); }
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
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function pollBox(t, a, ans) {
  g.globalAlpha = a; rr(560, 250, 800, 400, 34); g.fillStyle = 'rgba(20,10,40,.92)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
  g.font = '900 60px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('А ТЫ БЫ ОТВЕТИЛ?', 960, 325);
  [['ДА', 760, '#3df2ff'], ['НЕТ', 1160, '#ff5a4a']].forEach(([lab, x, col], i) => { const sel = ans && i === 0, dim = ans && i === 1; rr(x - 150, 400, 300, 120, 26); g.fillStyle = sel ? col : dim ? 'rgba(80,80,100,.6)' : 'rgba(255,255,255,.1)'; g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke(); g.font = '900 64px Rubik'; g.fillStyle = sel ? '#14081e' : '#ffffff'; g.fillText(lab + (sel ? ' ✓' : ''), x, 462); });
  g.font = '700 32px Rubik'; g.fillStyle = '#ffd23f'; g.fillText(ans ? 'ПРАВ БЫЛ ТОТ, КТО ОТВЕТИЛ' : 'ПИШИ ОТВЕТ В КОММЕНТАРИЯХ', 960, 600); g.globalAlpha = 1;
}
function extras(t, s) {
  g.save(); g.textBaseline = 'middle';
  if (POLL && t >= POLL.t0 && t < POLL.t1) pollBox(t, Math.min(clamp((t - POLL.t0) / .25), clamp((POLL.t1 - t) / .3)), false);
  if (s.scene === 'question') { g.save(); g.translate(-420, 0); pollBox(t, clamp((t - s.t0) / .3), true); g.restore(); }
  if (STOP != null && t >= STOP && t < STOP + 1.5) { const k = t - STOP, n = 3 - Math.floor(k / .5);
    g.save(); g.translate(960, 420); g.rotate(-.08); g.font = '900 230px Rubik'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 40; g.strokeStyle = '#231629'; g.strokeText('СТОП', 0, 0); g.lineWidth = 14; g.strokeStyle = '#fff'; g.strokeText('СТОП', 0, 0); g.fillStyle = '#ff3a2a'; g.fillText('СТОП', 0, 0); g.restore();
    if (n > 0) { g.font = '900 120px Rubik'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#231629'; g.strokeText(String(n), 960, 620); g.fillStyle = '#ffd23f'; g.fillText(String(n), 960, 620); } }
  if (SUB != null && t >= SUB && t < SUB + 3.2) { const k = t - SUB, a = Math.min(clamp(k / .3), clamp((3.2 - k) / .3)), pressed = k > 1.3, x = 1460 + (1 - a) * 500, y = 860;
    g.globalAlpha = a; rr(x, y - 50, 400, 100, 50); g.fillStyle = pressed ? '#5a5a6a' : '#e62117'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.font = '900 40px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(pressed ? 'ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ', x + 200, y + 2);
    const bx = x + 440, sw = pressed ? Math.sin(k * 25) * .4 * clamp(1 - (k - 1.3) / 1) : 0; g.save(); g.translate(bx, y); g.rotate(sw); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-26, 18); g.quadraticCurveTo(-26, -30, 0, -32); g.quadraticCurveTo(26, -30, 26, 18); g.closePath(); g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 5; g.stroke(); g.beginPath(); g.arc(0, 24, 7, 0, 7); g.fill(); g.restore();
    g.globalAlpha = 1; }
  g.restore();
}
