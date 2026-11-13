// thumb.js — YouTube thumbnails for «11 правил маяка» (1920×1080, scaled to 1280×720): huge scared face, 2–3 giant words, a red arrow at the threat.
import * as T from './toon.js';
import * as S from './world.js';
const { shape, line, ell, rect, rrect, face, dot, text, glowRings, INK } = T;
let g, V;
export async function init(cv, cues, v) {
  g = cv.getContext('2d'); V = v || 'A';
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  return { draw, EV: [] };
}
// giant thumbnail word: heavy, thick double outline (ink + white rim), slight tilt, optional gradient
function big(s, x, y, size, fill, o = {}) {
  g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.font = `900 ${size}px Rubik`; g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * .34; g.strokeStyle = INK; g.strokeText(s, 0, 0);
  g.lineWidth = size * .12; g.strokeStyle = o.rim || '#ffffff'; g.strokeText(s, 0, 0);
  if (Array.isArray(fill)) { const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); fill.forEach((c, i) => gr.addColorStop(i / (fill.length - 1), c)); g.fillStyle = gr; } else g.fillStyle = fill;
  g.fillText(s, 0, 0); g.restore();
}
function arrow(x0, y0, x1, y1, w = 46) {          // fat red arrow with ink outline
  const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hl = w * 2.2;
  const pts = [[0, -w / 2], [L - hl, -w / 2], [L - hl, -w * 1.25], [L, 0], [L - hl, w * 1.25], [L - hl, w / 2], [0, w / 2]].map(([u, v]) => [x0 + u * Math.cos(a) - v * Math.sin(a), y0 + u * Math.sin(a) + v * Math.cos(a)]);
  shape(g, pts, { fill: '#ff2a2a', shade: '#c01818', shadeOff: [0, -10], lw: 12 });
}
function ring(x, y, rx, ry) { line(g, ell(x, y, rx, ry, 40, 0, Math.PI * 2.15), { line: '#ff2a2a', lw: 22, amp: 3 }); line(g, ell(x, y, rx, ry, 40, 0, Math.PI * 2.15), { line: INK, lw: 6, amp: 3 }); }
function burst(x, y, r, col) { const p = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, rr = i % 2 ? r : r * .62; p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } shape(g, p, { fill: col, lw: 10 }); }
function heroFace(x, y, R, f) {                   // big scared face with raincoat collar
  shape(g, [[x - R * 1.5, 1300], [x - R * 1.15, y + R * 1.05], [x + R * 1.15, y + R * 1.05], [x + R * 1.5, 1300]], { fill: '#ffc928', shade: '#e09a12', shadeOff: [R * .25, 0] });
  shape(g, [[x - R * .7, y + R * .95], [x, y + R * 1.45], [x + R * .7, y + R * .95], [x + R * .4, y + R * .8], [x - R * .4, y + R * .8]], { fill: '#e09a12', lw: 8 });
  face(g, x, y, R, T.CAST.hero, f);
}
function creep(x, y, R) {                        // the thing in the fog: long pale face, black hollow eyes, a black slot of a mouth
  glowRings(g, x, y, R * 2.2, '#cfd2ff', .18);
  shape(g, ell(x, y, R * .82, R * 1.15, 36), { fill: '#e9e6f3', shade: '#b9b4d6', shadeOff: [R * .2, R * .1] });
  for (const d of [-1, 1]) { shape(g, ell(x + d * R * .33, y - R * .15, R * .22, R * .3, 18), { fill: '#120a1e', lw: 6 }); dot(g, x + d * R * .33 - R * .05, y - R * .2, R * .045, '#ffffff'); }
  shape(g, ell(x, y + R * .55, R * .16, R * .36, 18), { fill: '#120a1e', lw: 6 });
}
const vignette = (a = .55) => { const gr = g.createRadialGradient(960, 540, 300, 960, 540, 1150); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(5,0,20,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080); };

const VAR = {
  // F — «СВЕТ = СМЕРТЬ»: the beam on, things swarming the tower, the face
  F() {
    T.setCam(1380, 330, 1.9); S.ext(g, 2.3, { mode: 'night', lamp: 1, beam: 1, creatures: 30, fall: 0, fogTop: 640, fogDens: .9 });
    T.setCam(); glowRings(g, 1080, 240, 520, '#fff2a0', .25); vignette(.5);
    ring(1090, 700, 230, 330); arrow(1700, 420, 1330, 620, 46);
    heroFace(420, 780, 320, { eyes: 'wide', brow: 'up', scream: 1.1, sweat: true, look: [1, -.7], side: .5 });
    big('СВЕТ', 60, 140, 190, ['#fff6b0', '#ffd23f'], { rot: -.03 });
    big('=', 640, 150, 170, '#ffffff', { rot: -.03 });
    big('СМЕРТЬ', 820, 155, 190, ['#ff8a5a', '#ff1a1a'], { rot: -.03 });
  },
  // G — «ОН ЛЕЖИТ ТАМ 47 ДНЕЙ»: the old keeper on the glowing 118th step, in the torch beam
  G() {
    T.setCam(1150, 470, 1); S.stairs(g, 0, { step: 110, hero: false, torch: false, dark: false });
    T.setCam(); T.tint(g, '#0a0420', .45);
    shape(g, [[760, 760], [1920, 650], [1920, 880], [760, 1000]], { fill: '#ff9a3c', shade: '#e0602a', shadeOff: [0, -30] });
    glowRings(g, 1340, 760, 520, '#ff7a2a', .3);
    T.setRot(Math.PI / 2 - .1, 1000, 800); T.person(g, 'keeper', 1000, 800, 1.15, { armF: .1, armB: .1, face: { eyes: 'closed', mouth: 0, brow: 'sad', side: .2 } }); T.setRot(0);
    g.save(); g.globalAlpha = .28; g.fillStyle = '#fff4c0'; g.beginPath(); g.moveTo(820, 0); g.lineTo(980, 0); g.lineTo(1920, 640); g.lineTo(1920, 1000); g.lineTo(1100, 1000); g.closePath(); g.fill(); g.restore();
    vignette(.6);
    ring(1350, 760, 470, 190); arrow(1780, 330, 1600, 560, 46);
    heroFace(360, 800, 290, { eyes: 'wide', brow: 'up', scream: .9, sweat: true, look: [1, .8], side: .5 });
    big('ОН ЛЕЖИТ ТАМ', 60, 120, 150, ['#ffffff', '#ffe14a'], { rot: -.03 });
    big('47 ДНЕЙ', 900, 300, 200, ['#ff8a5a', '#ff1a1a'], { rot: -.04 });
  },
  // D — BIG: one giant face, one giant number, two giant words (reads on a phone at thumbnail size)
  D() {
    T.setCam(1150, 470, 1); S.stairs(g, 0, { step: 117, warm: true, hero: false, torch: false, dark: false });
    T.setCam(); T.tint(g, '#12062a', .45); glowRings(g, 1450, 620, 700, '#ff5a1a', .35);
    big('118', 1440, 610, 520, ['#fff26a', '#ffb02a', '#ff3a1a'], { rot: -.07, align: 'center' });
    creep(1690, 900, 120); ring(1690, 900, 170, 190);
    vignette(.55);
    heroFace(450, 730, 330, { eyes: 'wide', brow: 'up', scream: 1.1, sweat: true, look: [1, .6], side: .5 });
    big('НЕ СПУСКАЙСЯ!', 960, 125, 170, ['#ffffff', '#ffe14a'], { rot: -.02, align: 'center' });
  },
  // E — BIG: the door, the word, the face
  E() {
    T.setCam(2520, 470, 1.4); S.room(g, 0, { light: 'cold', fire: 0, lamp: 0, underDoor: 1, chars: [], holes: [{ x: 2520, y: 600, r: 520 }] });
    T.setCam(); text(g, 'ТУК!', 1380, 330, 230, '#ffe14a', { fixed: true, rot: -.15, lw: 34 }); text(g, 'ТУК!', 1700, 620, 190, '#ffe14a', { fixed: true, rot: .12, lw: 30 });
    vignette(.6);
    heroFace(450, 730, 330, { eyes: 'wide', brow: 'worried', scream: .8, tear: true, sweat: true, look: [1, 0], side: .5 });
    big('НЕ ОТКРЫВАЙ!', 960, 125, 165, ['#ff9a6a', '#ff2a2a'], { rot: -.02, align: 'center' });
  },
  // A — the 118th step: a pale face below the stairs, the counter in red
  A() {
    T.setCam(1150, 470, 1); S.stairs(g, 0, { step: 117, warm: true, hero: false, torch: false, dark: false });
    T.setCam(); T.tint(g, '#140a30', .35);
    glowRings(g, 1350, 700, 420, '#ff6a2a', .28);
    creep(1560, 800, 170);
    ring(1560, 800, 230, 260);
    big('118', 1160, 560, 260, ['#ffef5a', '#ff5a2a'], { rot: -.08, align: 'center' });
    vignette(.6);
    heroFace(430, 600, 300, { eyes: 'wide', brow: 'up', scream: 1, sweat: true, look: [1, .7], side: .55 });
    big('НЕ СПУСКАЙСЯ', 70, 150, 150, ['#ffffff', '#ffe14a'], { rot: -.03 });
    arrow(1820, 260, 1680, 540, 50);
  },
  // B — the light: the beam on, dozens of things crawling up the tower
  B() {
    T.setCam(1330, 420, 1.45); S.ext(g, 2.3, { mode: 'night', lamp: 1, beam: 1, creatures: 26, fall: 0, fogTop: 760, fogDens: .9 });
    T.setCam(); vignette(.55);
    heroFace(400, 640, 300, { eyes: 'wide', brow: 'up', scream: 1, sweat: true, look: [1, -.6], side: .55 });
    big('НЕ ВКЛЮЧАЙ', 70, 140, 150, ['#ffffff', '#ffe14a'], { rot: -.03 });
    big('СВЕТ!', 120, 320, 190, ['#ff8a5a', '#ff2a2a'], { rot: -.03 });
    ring(1340, 560, 250, 330); arrow(820, 420, 1110, 520, 46);
  },
  // C — the door: three knocks in the night and a voice that is not mum
  C() {
    T.setCam(2520, 470, 1.25); S.room(g, 0, { light: 'cold', fire: 0, lamp: 0, underDoor: 1, chars: [], holes: [{ x: 2520, y: 600, r: 520 }] });
    T.setCam();
    text(g, 'ТУК!', 1420, 230, 150, '#ffe14a', { fixed: true, rot: -.15, lw: 28 }); text(g, 'ТУК!', 1700, 420, 120, '#ffe14a', { fixed: true, rot: .1, lw: 24 }); text(g, 'ТУК!', 1460, 600, 100, '#ffe14a', { fixed: true, rot: -.05, lw: 20 });
    for (let k = 0; k < 7; k++) { const x = 1250 + (k * 97) % 500, y = 760 + (k * 53) % 120; g.save(); g.globalAlpha = .9; shape(g, ell(x, y, 30, 36, 16), { fill: '#f4f0ff', line: false, seed: k }); for (let f = 0; f < 4; f++) shape(g, ell(x - 22 + f * 15, y - 50 + (f % 3 ? 0 : 10), 7, 19, 10), { fill: '#f4f0ff', line: false, seed: k * 5 + f }); g.restore(); }
    vignette(.6);
    heroFace(430, 610, 300, { eyes: 'wide', brow: 'worried', scream: .7, tear: true, sweat: true, look: [1, 0], side: .55 });
    big('ЭТО НЕ', 80, 150, 170, ['#ffffff', '#ffe14a'], { rot: -.04 });
    big('МАМА', 120, 330, 210, ['#ff8a5a', '#ff2a2a'], { rot: -.04 });
  },
};
function draw() { T.setTime(0); T.setCam(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); VAR[V](); T.setCam(); }
