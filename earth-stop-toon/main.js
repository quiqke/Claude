// «Что если Земля остановится на 1 секунду?» — Sci-Fi Sitcom Toon, vertical 1080×1920, 24 fps (characters on twos).
// Shots are keyed to the words of the voice (voice/timing.json from the offline recogniser); without it, words are estimated.
// ?scene=sheet renders the model sheet.
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, screenRect, reset } from './toon.js';
import { tim, zin, stopBox, teaCup, PAL } from './chars.js';
import * as Wd from './worlds.js';

init(document.getElementById('c'));
const Q = new URLSearchParams(location.search);
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const LINES = (await J('lines.json'))?.lines || [], TIM = await J('voice/timing.json');
const q = t => Math.floor(t * 12 + 1e-6) / 12;                       // drawing time on twos
const norm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9-]/g, '');

// ———— word times: from the recogniser, or estimated at ≈2.3 words/s ————
const WORDS = [];   // {li, w, t0, t1}
{ let tt = .1;
  LINES.forEach((l, li) => {
    const toks = l.text.split(/\s+/).filter(w => /[a-zа-яё0-9]/i.test(w)), v = TIM?.lines?.[l.id];
    toks.forEach((w, i) => { let t0, t1; if (v) { const wt = v.words[Math.min(i, v.words.length - 1)]; [t0, t1] = wt; } else { t0 = tt; t1 = tt + .38; tt += .43; }
      WORDS.push({ li, w: norm(w), raw: w, t0, t1 }); });
    if (!v) tt += .45;
  }); }
const DUR = TIM ? TIM.total + 2.4 : (WORDS.length ? WORDS[WORDS.length - 1].t1 + 2.4 : 50);
// cue(line, word, n-th match) → start time of that word
function cue(li, w, n = 0) { const k = norm(w); let c = 0; for (const x of WORDS) if (x.li === li && x.w.startsWith(k)) { if (c === n) return x.t0; c++; } return null; }
const lineT = li => { const ws = WORDS.filter(x => x.li === li); return ws.length ? [ws[0].t0, ws[ws.length - 1].t1] : [0, 0]; };

// ———— the beats ————
const B = {};
function beats() {
  const c = (li, w, n, d) => cue(li, w, n) ?? d;
  B.press = c(0, 'нажимаешь', 0, 2.6); B.one = c(0, 'одну', 0, 4); B.stop = lineT(1)[0] || 5.2; B.notYou = c(1, 'нет', 0, B.stop + 1.2);
  B.space = lineT(2)[0] || 7; B.equator = c(2, 'тысяча', 0, B.space + 1.4); B.moscow = c(2, 'москве', 0, B.space + 4); B.plane = c(2, 'быстрее', 0, B.space + 6);
  B.street = lineT(3)[0] || 14; B.you = c(3, 'ты', 0, B.street + 2.4); B.coffee = c(3, 'кофе', 0, B.you + .6); B.cars = c(3, 'машины', 0, B.you + 1.2); B.cows = c(3, 'коровы', 0, B.you + 1.8);
  B.storm = lineT(4)[0] || 20; B.rip = c(4, 'срывает', 0, B.storm + 3);
  B.ocean = lineT(5)[0] || 25; B.lab2 = lineT(6)[0] || 29; B.spins = c(6, 'земля', 0, B.lab2 + 2);
  B.good = lineT(7)[0] || 33; B.bad = c(7, 'плохая', 0, B.good + 2); B.other = c(7, 'закрутил', 0, B.bad + 1);
  B.yard = lineT(8)[0] || 38; B.ask = c(8, 'что', 0, B.yard + 2.5); B.end = DUR;
}
beats();
// shots: [t0, name]; swirl wipes at the world jumps
const SHOTS = () => [[0, 'labOpen'], [B.press - .05, 'pressCU'], [B.one - .1, 'oneCU'], [B.stop - .05, 'freeze'], [B.space, 'space'], [B.street, 'street'],
  [B.you + .9, 'flyCU'], [B.storm, 'storm'], [B.ocean, 'ocean'], [B.lab2, 'lab2'], [B.good, 'goodCU'], [B.bad, 'badCU'], [B.other, 'otherCU'], [B.yard, 'yard']];
const shotAt = t => { const S = SHOTS(); let s = S[0]; for (const x of S) if (t >= x[0]) s = x; return s; };
const WIPES = () => [B.space, B.street, B.storm, B.ocean, B.lab2, B.yard];
const TAGS = () => [[0, B.stop, 'ЛАБОРАТОРИЯ', '00:00:00,0', '#3e5146', '#ffd84a'], [B.space, B.street, 'ОРБИТА', 'ВРАЩЕНИЕ: 0', '#101848', '#ff9c3a'],
  [B.street, B.storm, 'МОСКВА', 'СКОРОСТЬ: 940 КМ/Ч', '#1f7d75', '#ffe3c6'], [B.storm, B.ocean, 'ВЕТЕР', 'СИЛЬНЕЕ ТОРНАДО', '#3b3456', '#ffe066'],
  [B.ocean, B.lab2, 'МАТЕРИК', 'УРОВЕНЬ ОКЕАНА: ↑', '#1d4fa8', '#ffcab4'], [B.yard, DUR, 'ВСЁ НОРМАЛЬНО', 'СОЛНЦЕ: ЗАПАД', '#a98a62', '#f6ecd8']];

// ———— camera ————
function cam(cx, cy, z, shake = 0, t = 0) {
  reset(); translate(W / 2, H / 2);
  if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); }
  scale(z); translate(-cx, -cy);
}
const landSq = (t, tl) => { const u = t - tl; if (u < 0 || u > .6) return 1; return 1 - .22 * Math.exp(-u * 9) * Math.cos(u * 30); };
const blink = (t, ph = 0) => (Math.floor(t * 12 + ph * 31) % 41) < 2;
const TX = 360, ZX = 760, FL = Wd.FLOOR;
const T0 = (t, o = {}) => ({ x: TX, y: FL, s: 1, face: 1, t: q(t), nerv: .25, look: [.5, -.1], blink: blink(t), mouth: { o: 0, sm: -.3 }, sq: 1 + .01 * Math.sin(q(t) * 3), ...o });
const Z0 = (t, o = {}) => ({ x: ZX, y: FL, s: 1, face: -1, t: q(t), lid: .55, look: [.4, 0], blink: blink(t, .5), holdR: 'tea', armR: { h: [30, 90], bend: 20 }, sq: 1 + .008 * Math.sin(q(t) * 2.3), ...o });

// ———— shots ————
const SH = {
  labOpen(t) {   // insert on the glowing button, pull back to the duo
    const u = eio(seg(t, .2, Math.max(.8, B.press - .6)));
    cam(lerp(560, 560, u), lerp(1080, 980, u), lerp(2.4, 1, u), 0, t);
    Wd.lab(t);
    zin(Z0(t, { armL: { h: [-60, 40], bend: -30 }, look: [.6, .1], mouth: { o: 0, sm: .1 } }));
    stopBox(560, 1060, .95, { t, glow: 1 });
    tim(T0(t, { look: [.9, .3], lean: .06, armR: { h: [60, 120], bend: 20 }, mouth: { o: .15, sm: .4 }, nerv: .1 }));
  },
  pressCU(t) {   // hard cut: the finger presses
    const p = ss(seg(t, B.press, B.press + .2));
    cam(560, 900, 2.6, 0, t); Wd.lab(t);
    stopBox(560, 1060, .95, { t, glow: 1, press: p });
    push(); translate(560, lerp(730, 880, p)); rotate(Math.PI / 2 + .1);
    shape(rr(-200, -26, 220, 52, 26), { fill: PAL.skinT, lw: 7 }); shape(rr(-320, -46, 130, 92, 30), { fill: PAL.tee, lw: 7 }); pop();
  },
  oneCU(t) {     // reaction close-up: he holds up one finger, you shut your eyes
    cam(560, 760, 1.55, 0, t); Wd.lab(t);
    zin(Z0(t, { x: 780, armL: { h: [-10, -150], bend: -10 }, holdR: 'tea', lid: .62, mouth: { o: 0, sm: 0 } }));
    tim(T0(t, { x: 330, blink: true, nerv: .6, brow: 1, mouth: { o: .2, sm: -.8, w: .7 }, armR: { h: [40, 40], bend: 30, fist: true } }));
  },
  freeze(t) {    // the Earth stops; you don't
    const go = B.notYou, u = clamp((t - go) / .5), still = t < go;
    cam(540, 960, 1, t > B.stop && t < B.stop + .35 ? 18 : 0, t);
    Wd.lab(t); zin(Z0(still ? B.stop : t, { lid: .6, mouth: { o: 0, sm: 0 } }));
    stopBox(560, 1060, .95, { t, glow: 1, press: 1 });
    if (still) tim(T0(B.stop, { nerv: 0, look: [0, 0], eyeS: 1.15, pupil: 3, mouth: { o: .45, sm: -.6 } }));
    else tim(T0(t, { x: lerp(TX, 1500, eo(u)), y: FL - Math.sin(u * Math.PI) * 120, sq: lerp(1, .7, u), s: 1, lean: .6, nerv: 1, eyeS: 1.3, mouth: { o: 1, sm: -.8, w: 1.3 }, armL: { h: [-160, -60], bend: -30 }, armR: { h: [-140, 40], bend: 30 } }));
  },
  space(t) {     // the Earth, the speeds
    const k = seg(t, B.space, B.space + 6);
    cam(540, 960, lerp(1, 1.12, k), 0, t); Wd.space(t);
    Wd.earth(540, 980, 360, 1.2 + Math.max(0, .8 - (t - B.space)) * 1.2);
    if (t > B.equator) { const a = eo(seg(t, B.equator, B.equator + .4)); Wd.arrow(540, 980, 540 + 520 * a, 980, '#ffffff', 12);
      text('1670 КМ/Ч', 560, 900, { font: '900 74px Nunito', fill: '#ffffff', outlineW: 12, align: 'left' }); text('ЭКВАТОР', 560, 1060, { font: '900 40px Nunito', fill: '#ff9c3a', outlineW: 8, align: 'left' }); }
    if (t > B.moscow) { const a = eo(seg(t, B.moscow, B.moscow + .4)); dot(470, 760, 16, '#ff4a3a'); Wd.arrow(470, 760, 470 + 320 * a, 720, '#ffe066', 10);
      text('МОСКВА · 940 КМ/Ч', 480, 660, { font: '900 58px Nunito', fill: '#ffe066', outlineW: 11 }); }
    if (t > B.plane) { const u = seg(t, B.plane, B.plane + 2.5); Wd.plane(lerp(1250, -260, u), 450, .9); text('САМОЛЁТ · 900', lerp(1250, -260, u), 520, { font: '900 34px Nunito', fill: '#ffffff', outlineW: 8 }); }
  },
  street(t) {    // everything not nailed down flies east
    const u = t - B.street;
    cam(540, 960, 1, 4, t); Wd.street(t, { scroll: u * 900 });
    const fly = (t0, y, draw) => { if (t < t0) return; const k = (t - t0) / 1.6; draw(lerp(-300, 1400, k), y - Math.sin(k * Math.PI) * 120, k); };
    fly(B.cars, 1250, (x, y, k) => Wd.car(x, y, k * 2.2, .9));
    fly(B.cows, 980, (x, y, k) => Wd.cow(x, y, -k * 3, .8, t));
    fly(B.coffee, 760, (x, y, k) => teaCup(x, y, k * 6, { steam: 0 }));
    const k = seg(t, B.street, B.street + 2.6);
    tim(T0(t, { x: lerp(-200, 620, eo(k)), y: 1180 + Math.sin(t * 4) * 30, lean: 1.1, spin: 0, sq: .86, nerv: 1, eyeS: 1.3, mouth: { o: .9, sm: -.8, w: 1.2 }, armL: { h: [-200, -40], bend: -20 }, armR: { h: [-180, 60], bend: 20 }, legL: [-120, -60], legR: [-90, -20] }));
  },
  flyCU(t) {     // reaction close-up mid-air
    cam(560, 760, 1.7, 6, t); Wd.street(t, { scroll: (t - B.street) * 1400 });
    tim(T0(t, { x: 560, y: 1180, lean: 1.0, nerv: 1.2, eyeS: 1.4, pupil: 3, mouth: { o: 1, sm: -1, w: 1.4 }, sweat: t, armL: { h: [-200, -40], bend: -20 }, armR: { h: [-180, 60], bend: 20 } }));
    if (t > B.cows) Wd.cow(lerp(-200, 1300, seg(t, B.cows, B.cows + 1.2)), 560, -t * 3, .7, t);
  },
  storm(t) {     // houses torn off like paper; you hold a pole, flapping
    cam(540, 960, 1, 10, t); Wd.storm(t);
    const r = seg(t, B.rip, B.rip + 1.8);
    for (let i = 0; i < 3; i++) Wd.paperHouse(lerp(200 + i * 330, 1500 + i * 400, eo(seg(r, i * .2, 1))), 1150 - eo(seg(r, i * .2, 1)) * 600, eo(seg(r, i * .2, 1)) * 3, .9);
    Wd.pole(260, 1150, 760);
    const fl = Math.sin(q(t) * 28) * .08;
    push(); translate(260, 600); rotate(-Math.PI / 2 + .06 + fl); translate(0, 745); tim(T0(t, { x: 0, y: 0, nerv: 1, eyeS: 1.3, mouth: { o: .8, sm: -.9 }, armL: { h: [-14, -278], bend: 10, fist: true }, armR: { h: [14, -278], bend: -10, fist: true }, legL: [-60 + Math.sin(t * 30) * 30, 0], legR: [40 + Math.cos(t * 26) * 30, -20] })); pop();
  },
  ocean(t) {     // the ocean walks onto the continent; you ride the cow
    const r = seg(t, B.ocean, B.ocean + 3);
    cam(540, lerp(960, 900, r), lerp(1.08, 1, r), 0, t); Wd.ocean(t, { rise: eo(r) });
    Wd.bigWave(lerp(-200, 260, r), 1200, t, 1.1);
    const y = lerp(1500, 760, eo(r)) - 40 + Math.sin(t * 4) * 16;
    Wd.cow(620, y, Math.sin(t * 3) * .15, .9, t);
    tim(T0(t, { x: 600, y: y - 30, s: .62, nerv: .8, eyeS: 1.2, mouth: { o: .5, sm: -.7 }, legL: [-50, -80], legR: [60, -80], armL: { h: [-100, -60], bend: -10 }, armR: { h: [90, -70], bend: 10 } }));
  },
  lab2(t) {      // he calmly presses it back; you fly in from the left (now the other way) and land
    const k = seg(t, B.lab2, B.lab2 + 4);
    cam(560, lerp(980, 900, k), lerp(1, 1.06, k), 0, t); Wd.lab(t);
    const p = ss(seg(t, B.lab2 + .5, B.lab2 + .8));
    stopBox(560, 1060, .95, { t, glow: 1, press: p * (1 - ss(seg(t, B.lab2 + 1.2, B.lab2 + 1.5))) });
    zin(Z0(t, { armL: p > 0 ? { h: [-140, -20], bend: -20 } : { h: [-30, 120], bend: -14 }, lid: .62, look: [.3, .2], mouth: { o: 0, sm: .15 } }));
    const tl = B.spins + .5;
    if (t < B.spins) return;
    const u = seg(t, B.spins, tl);
    tim(T0(t, { x: lerp(-260, TX, eo(u)), y: FL - Math.sin(u * Math.PI) * 160, sq: landSq(t, tl), nerv: t > tl ? .5 : 1, eyeS: 1.2, mouth: { o: t > tl ? .1 : .9, sm: -.6 }, sweat: t > tl ? t : null }));
  },
  goodCU(t) {    // relief
    cam(400, 760, 1.7, 0, t); Wd.lab(t);
    tim(T0(t, { nerv: .1, brow: -.2, lid: .2, look: [.3, -.3], mouth: { o: .25, sm: .9, w: 1.2 }, armR: { h: [60, 60], bend: 30, fist: true } }));
  },
  badCU(t) {     // cold pause: he looks at you
    cam(760, 820, 1.8, 0, t); Wd.lab(t);
    zin(Z0(t, { lid: .66, look: [.7, .1], mouth: { o: 0, sm: -.1 } }));
  },
  otherCU(t) {   // the shrug; the doodle globe on the board spins the wrong way
    cam(560, 820, 1.25, 0, t); Wd.lab(t);
    zin(Z0(t, { armL: { h: [-90, 20], bend: -40 }, armR: { h: [90, 10], bend: 40 }, holdR: null, lid: .62, mouth: { o: 0, sm: .2, skew: .4 } }));
    tim(T0(t, { eyeS: 1.35, pupil: 3, nerv: .8, mouth: { o: .45, sm: -.8 } }));
    const a = (t - B.other) * -4; push(); translate(140, 560); rotate(a); stroke([[0, -70], [0, 70]], 6, { line: '#ffd84a' }); stroke([[-70, 0], [70, 0]], 6, { line: '#ffd84a' }); pop();
  },
  yard(t) {      // suspiciously normal: the sun rises in the west; you turn to us slowly
    const k = seg(t, B.yard, B.yard + 4);
    cam(540, lerp(960, 900, k), lerp(1, 1.08, k), 0, t);
    Wd.beige(t, { sunX: 170, sunY: lerp(1250, 760, eo(seg(t, B.yard, B.yard + 2.5))) });
    zin(Z0(t, { x: 820, y: FL - 150, s: .8, lid: .7, look: [-.6, -.3], mouth: { o: 0, sm: .2 } }));
    const turn = ss(seg(t, B.ask - .8, B.ask));
    tim(T0(t, { x: 470, y: FL - 150, face: turn > .5 ? 1 : -1, look: turn > .5 ? [0, 0] : [-.7, -.4], eyeS: 1.2, nerv: .2, mouth: { o: 0, sm: turn > .5 ? -.2 : -.6 }, lid: turn > .5 ? .25 : 0 }));
  },
};

// ———— screen layer: swirl wipes, world tag, subtitles, end question ————
function wipes(t) {
  for (const tc of WIPES()) { const d = Math.abs(t - tc), hw = .28; if (d > hw) continue;
    const u = 1 - d / hw; reset(); Wd.swirl(540, 960, 1500 * Math.pow(u, .6), t); }
}
function tag(t) {
  for (const [a, b, id, desc, bg, fg] of TAGS()) { if (t < a || t >= b) continue;
    const n = Math.floor((t - a) * 40), s1 = id.slice(0, n), s2 = desc.slice(0, Math.max(0, n - id.length));
    reset(); push(); translate(56, 150); scale(back(seg(t, a, a + .18), 2.2));
    g.font = '700 46px "JetBrains Mono"'; const w = Math.max(g.measureText('▶ ' + id).width, g.measureText(desc).width * .72) + 56;
    shape(rr(0, 0, Math.max(340, w), 108, 12), { fill: bg, lw: 7 });
    text('▶ ' + s1 + (n < id.length && Math.floor(t * 6) % 2 ? '█' : ''), 24, 36, { font: '700 42px "JetBrains Mono"', fill: fg, align: 'left' });
    text(s2, 26, 80, { font: '700 30px "JetBrains Mono"', fill: fg, align: 'left' });
    pop(); }
}
let SUBS = [];
function buildSubs() {
  // sentences from the words; never across a world cut; hold ≥ max(1.8 s, speech + .6 s)
  const cuts = WIPES().concat([B.press, B.one, B.stop, B.good, B.bad, B.other]);
  LINES.forEach((l, li) => { const ws = WORDS.filter(x => x.li === li); let cur = [];
    const toks = l.text.split(/\s+/); let wi = 0;
    for (const tok of toks) { cur.push(tok); if (/[a-zа-яё0-9]/i.test(tok)) wi++;
      if (/[.?!:]$/.test(tok) || wi === ws.length && tok === toks[toks.length - 1]) { const a = ws[Math.max(0, wi - cur.filter(x => /[a-zа-яё0-9]/i.test(x)).length)], b = ws[wi - 1];
        if (a && b) SUBS.push({ t0: a.t0, t1: b.t1, text: cur.join(' ') }); cur = []; } } });
  SUBS.sort((a, b) => a.t0 - b.t0);
  SUBS.forEach((s, i) => { const nx = SUBS[i + 1]?.t0 ?? DUR; let t1 = Math.max(s.t1 + .6, s.t0 + 1.8); t1 = Math.min(t1, nx);
    const cut = cuts.filter(c => c > s.t1 - .05 && c < t1).sort((a, b) => a - b)[0]; if (cut) t1 = Math.max(cut, s.t1 + .25); s.t1 = t1; });
}
function wrapSub(str) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = '900 54px Nunito';
  const words = str.split(' '), lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > 900 && cur) { lines.push(cur); cur = w; } else cur = n; }
  lines.push(cur); return lines;
}
function subs(t) {
  const s = SUBS.find(x => t >= x.t0 && t < x.t1); if (!s) return;
  const lines = wrapSub(s.text), p = back(seg(t, s.t0, s.t0 + .12), 2), y0 = 1500 - (lines.length - 1) * 68;
  reset(); push(); translate(540, y0); scale(p); translate(-540, -y0);
  lines.forEach((l, k) => text(l, 540, y0 + k * 68, { font: '900 54px Nunito', fill: '#ffffff', outlineW: 12 }));
  pop();
}
function endAsk(t) {
  if (t < B.ask) return;
  const p = back(seg(q(t), B.ask, B.ask + .25), 2.2);
  reset(); push(); translate(540, 420); scale(p); rotate(-.04);
  text('А ЧТО БЫ', 0, -60, { font: '400 96px "Russo One"', fill: '#f6c44e', outlineW: 18 });
  text('ТЫ СПАС?', 0, 50, { font: '400 120px "Russo One"', fill: '#fff6dc', outlineW: 20 });
  pop();
}

// ———— model sheet ————
function sheet(t) {
  frame(t); reset(); screenRect('#efe7f7');
  text('ТЫ', 270, 160, { font: '400 72px "Russo One"', fill: INK }); text('ЗИНОВИЙ МАРКОВИЧ', 780, 160, { font: '400 50px "Russo One"', fill: INK });
  tim(T0(t, { x: 270, y: 1050, nerv: 0 }));
  zin(Z0(t, { x: 780, y: 1050 }));
  const faces = [['спокоен', { nerv: 0, mouth: { o: 0, sm: .3 }, brow: 0 }], ['паника', { nerv: 1, eyeS: 1.35, pupil: 3, mouth: { o: 1, sm: -1, w: 1.3 }, brow: 1 }], ['облегчение', { lid: .2, mouth: { o: .25, sm: .9, w: 1.2 }, brow: -.2 }], ['ужас', { eyeS: 1.2, pupil: 3, mouth: { o: .45, sm: -.8 }, brow: 1 }]];
  stopBox(560, 1250, .7, { t, glow: 1 });
  fillOnly(rect(0, 1340, 1080, 580), '#efe7f7', { boil: 0 });
  faces.forEach(([lab, o], i) => { const cx = 140 + i * 265; push(); translate(cx, 1560); scale(.9); translate(-TX - 4, -(FL - 610)); tim(T0(t, { ...o })); pop();
    fillOnly(rect(cx - 140, 1690, 280, 300), '#efe7f7', { boil: 0 }); text(lab, cx, 1730, { font: '900 32px Nunito', fill: INK }); });
}

// ———— frame ————
function render(t) {
  frame(t); screenRect('#000');
  const [, name] = shotAt(t);
  SH[name](t);
  wipes(t); tag(t); endAsk(t); subs(t);
  reset();
}
buildSubs();
window.DUR = DUR;
window.render = Q.get('scene') === 'sheet' ? sheet : render;
window.EV = Object.entries(B).map(([k, v]) => ({ t: +v.toFixed(3), type: k }));
await document.fonts.load('900 54px Nunito', 'АБВабв'); await document.fonts.load('400 96px "Russo One"', 'АБВ'); await document.fonts.load('700 42px "JetBrains Mono"', 'АБВ▶█'); await document.fonts.ready;
window.render(+(Q.get('t') || 0));
window.READY = true;
