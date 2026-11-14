// thumb.js — YouTube thumbnails for «7 правил выживания на чужой планете» (1920×1080)
import * as T from './toon.js';
import * as W from './world.js';
import * as I from './inserts.js';
const { shape, line, ell, rrect, face, dot, glowRings, INK } = T;
let g, V;
export async function init(cv, cues, v) {
  g = cv.getContext('2d'); V = v || 'A';
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  return { draw, EV: [] };
}
function big(s, x, y, size, fill, o = {}) {   // giant word with double outline, fitted to max width
  g.save(); g.translate(x, y); g.rotate(o.rot || 0); let fs = size; g.font = `900 ${fs}px Rubik`; while (o.max && g.measureText(s).width > o.max && fs > 40) { fs -= 6; g.font = `900 ${fs}px Rubik`; }
  g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = fs * .34; g.strokeStyle = INK; g.strokeText(s, 0, 0); g.lineWidth = fs * .12; g.strokeStyle = '#fff'; g.strokeText(s, 0, 0);
  if (Array.isArray(fill)) { const gr = g.createLinearGradient(0, -fs / 2, 0, fs / 2); fill.forEach((c, i) => gr.addColorStop(i / (fill.length - 1), c)); g.fillStyle = gr; } else g.fillStyle = fill;
  g.fillText(s, 0, 0); g.restore();
}
function arrow(x0, y0, x1, y1, w = 46) { const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hl = w * 2.2;
  const pts = [[0, -w / 2], [L - hl, -w / 2], [L - hl, -w * 1.25], [L, 0], [L - hl, w * 1.25], [L - hl, w / 2], [0, w / 2]].map(([u, v]) => [x0 + u * Math.cos(a) - v * Math.sin(a), y0 + u * Math.sin(a) + v * Math.cos(a)]);
  shape(g, pts, { fill: '#ff2a2a', shade: '#c01818', shadeOff: [0, -10], lw: 12 }); }
function ring(x, y, rx, ry) { line(g, ell(x, y, rx, ry, 40, 0, Math.PI * 2.15), { line: '#ff2a2a', lw: 22, amp: 3 }); line(g, ell(x, y, rx, ry, 40, 0, Math.PI * 2.15), { line: INK, lw: 6, amp: 3 }); }
const vignette = (a = .55) => { const gr = g.createRadialGradient(960, 540, 300, 960, 540, 1150); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(5,0,20,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080); };
function astroFace(x, y, R, f) {              // big astronaut head: suit collar, face, glass helmet
  shape(g, [[x - R * 1.7, 1300], [x - R * 1.3, y + R * 1.15], [x + R * 1.3, y + R * 1.15], [x + R * 1.7, 1300]], { fill: '#f4f1ea', shade: '#cbc3b4', shadeOff: [R * .3, 0] });
  shape(g, T.rrect(x - R * .6, y + R * 1.5, R * 1.2, R * .3, R * .1), { fill: '#ff7a3a', lw: 6 });
  face(g, x, y, R, T.CAST.astro, f);
  g.save(); g.globalAlpha = .18; shape(g, ell(x, y + R * .1, R * 1.45, R * 1.4, 36), { fill: '#bfe8ff', line: false }); g.restore();
  line(g, ell(x, y + R * .1, R * 1.45, R * 1.4, 36, 0, Math.PI * 2.05), { lw: 10 }); line(g, ell(x - R * .25, y - R * .3, R * .9, R * .85, 14, Math.PI * 1.1, Math.PI * 1.45), { line: '#ffffff', lw: 12 });
}
const RULES = ['ПРАВИЛА:', '1. НЕ ШУМИ', '2. НЕ СТОЙ', '3. НЕ СМОТРИ НА 2-Е СОЛНЦЕ', '4. ПЕЙ СИНЮЮ', '5. НЕ ОТВЕЧАЙ ЭХУ', '6. НЕ ОТКРЫВАЙ ВТОРУЮ', '7. НАПИШИ ПРАВИЛА'];
function pill(x, y, w, h, bg, stroke) { g.save(); g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fillStyle = bg; g.fill(); g.lineWidth = 6; g.strokeStyle = stroke || INK; g.stroke(); g.restore(); }
const VAR = {
  // D — the essence: you carve the rules for the next you; old capsules all around, the next one already falling
  D() {
    T.setCam(1100, 600, 1.05); W.loopField(g, 0, { n: 41, hero: false });
    T.setCam();
    const fx = 1700, fy = 230; g.save(); g.globalAlpha = .9; for (let i = 0; i < 6; i++) line(g, [[fx + 30 + i * 6, fy - 40 - i * 4], [fx + 260 + i * 10, fy - 230 - i * 6]], { line: i % 2 ? '#ff7a3a' : '#ffd23f', lw: 26 - i * 3, seed: i }); g.restore();
    glowRings(g, fx, fy, 120, '#ffd23f', .5); shape(g, ell(fx, fy, 46, 40, 20), { fill: '#d8dde6', shade: '#a9b0bf', shadeOff: [-12, 0] });
    // the hull plate with the rules being carved
    T.setRot(-.04, 560, 600); shape(g, rrect(60, 230, 1000, 790, 30), { fill: '#c6ccd8', shade: '#9aa2b4', shadeOff: [-24, -16] });
    for (let y = 300; y < 1000; y += 230) line(g, [[80, y], [1040, y]], { line: '#9aa2b4', lw: 6, seed: y }); T.setRot(0);
    I.carve(g, 0.4, RULES, .985, { x: 120, y: 295, lh: 74, size: 60 });
    vignette(.45);
    astroFace(1430, 720, 230, { eyes: 'wide', brow: 'up', look: [-1, .2], sweat: true, scream: .8, side: -.5 });
    pill(110, 1000 - 130, 380, 70, '#0a2430', '#3df2ff'); g.font = '800 40px JBMono'; g.fillStyle = '#3df2ff'; g.textBaseline = 'middle'; g.fillText('ПОПЫТКА 42', 140, 1000 - 95);
    pill(520, 1000 - 130, 440, 70, '#5a0a0a', '#ff5a4a'); g.fillStyle = '#ff5a4a'; g.fillText('O₂', 548, 1000 - 95); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(620, 1000 - 108, 300, 26); g.fillStyle = '#ff3a2a'; g.fillRect(620, 1000 - 108, 18, 26);
    big('7 ПРАВИЛ ВЫЖИВАНИЯ', 960, 110, 150, ['#ffffff', '#ffe14a'], { rot: -.02, align: 'center', max: 1840 });
    big('ОТ САМОГО СЕБЯ', 1450, 1000, 110, ['#ff8a5a', '#ff1a1a'], { rot: -.04, align: 'center', max: 900 });
  },
  // A — «Я УМИРАЛ ЗДЕСЬ 41 РАЗ»: the field of capsules, a giant 41
  A() {
    T.setCam(1150, 640, 1.15); W.loopField(g, 0, { n: 41, hero: false });
    T.setCam(); glowRings(g, 1400, 560, 520, '#ff7a3a', .25); vignette(.45);
    big('41', 1420, 560, 470, ['#fff26a', '#ffb02a', '#ff3a1a'], { rot: -.07, align: 'center' });
    ring(1420, 860, 420, 120); arrow(1840, 760, 1700, 840, 40);
    astroFace(420, 660, 260, { eyes: 'wide', brow: 'up', scream: 1.1, sweat: true, look: [1, .3], side: .5 });
    big('Я УМИРАЛ ЗДЕСЬ', 60, 110, 140, ['#ffffff', '#ffe14a'], { rot: -.03, max: 1500 });
    big('РАЗ', 1760, 690, 120, ['#ff8a5a', '#ff1a1a'], { rot: -.08, align: 'center' });
  },
  // B — «ЭТО МОЙ ПОЧЕРК?!»: the carved rules on the hull, the scream
  B() {
    T.setCam(); W.hull(g, 0, { reveal: 1 }); T.setCam(1150, 540, 1.05);
    T.setCam(); g.save(); g.globalAlpha = .25; g.fillStyle = '#1b1035'; g.fillRect(0, 0, 1920, 1080); g.restore();
    ring(1080, 560, 560, 420); arrow(1850, 300, 1560, 420, 44);
    vignette(.5);
    astroFace(380, 700, 270, { eyes: 'wide', brow: 'up', scream: 1.1, sweat: true, look: [1, -.2], side: .5 });
    big('ЭТО МОЙ ПОЧЕРК?!', 960, 115, 150, ['#ff8a5a', '#ff1a1a'], { rot: -.02, align: 'center', max: 1820 });
  },
  // C — «НЕ СМОТРИ ВВЕРХ»: the second sun opens its eye
  C() {
    T.bands(g, 1920, [0, 300, 600], ['#ffb24a', '#ffc966', '#ffe08a']);
    for (let k = 0; k < 3; k++) shape(g, [[-100, 760 + k * 90], [400, 720 + k * 90], [900, 760 + k * 90], [1400, 710 + k * 90], [2000, 750 + k * 90], [2000, 1200], [-100, 1200]], { fill: ['#f0903a', '#e8742a', '#c95a1a'][k], line: false });
    glowRings(g, 1360, 420, 600, '#fff3c4', .35);
    shape(g, ell(1360, 420, 330, 330, 40), { fill: '#ffeaa0', lw: 12 });
    shape(g, ell(1360, 420, 250, 150, 36), { fill: '#ffffff', lw: 12 }); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; line(g, [[1360 + Math.cos(a) * 240, 420 + Math.sin(a) * 140], [1360 + Math.cos(a) * 170, 420 + Math.sin(a) * 95], [1360 + Math.cos(a + .2) * 140, 420 + Math.sin(a + .2) * 80]], { line: '#e8323c', lw: 6, seed: i }); } dot(g, 1300, 440, 80, '#d42a20'); dot(g, 1300, 440, 34, INK); dot(g, 1280, 415, 14, '#ffffff');
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; line(g, [[1360 + Math.cos(a) * 360, 420 + Math.sin(a) * 360], [1360 + Math.cos(a) * 430, 420 + Math.sin(a) * 430]], { lw: 12, seed: i }); }
    vignette(.4);
    astroFace(400, 700, 260, { eyes: 'wide', brow: 'up', scream: 1.1, sweat: true, look: [1, -1], side: .5 });
    big('НЕ СМОТРИ', 60, 110, 150, ['#ffffff', '#ffe14a'], { rot: -.03 });
    big('ВВЕРХ!', 760, 270, 170, ['#ff8a5a', '#ff1a1a'], { rot: -.04 });
  },
};
function draw() { T.setTime(0); T.setCam(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); VAR[V](); T.setCam(); }
