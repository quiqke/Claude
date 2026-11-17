// thumb.js — YouTube thumbnails for «10 правил, если тебя замело на ночной трассе» (1920×1080): highlighted plates, scared face, the hook prop.
import * as T from './toon.js';
import * as W from './world.js';
const INK = T.INK;
let g, V;
export async function init(cv, cues, v) {
  g = cv.getContext('2d'); V = v || 'A';
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  return { draw, EV: [] };
}
const vignette = (a = .55) => { const gr = g.createRadialGradient(960, 540, 300, 960, 540, 1150); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(5,0,20,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080); };
function arrow(x0, y0, x1, y1, w = 46) { const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), hl = w * 2.2;
  const pts = [[0, -w / 2], [L - hl, -w / 2], [L - hl, -w * 1.25], [L, 0], [L - hl, w * 1.25], [L - hl, w / 2], [0, w / 2]].map(([u, v]) => [x0 + u * Math.cos(a) - v * Math.sin(a), y0 + u * Math.sin(a) + v * Math.cos(a)]);
  T.shape(g, pts, { fill: '#ff2a2a', shade: '#c01818', shadeOff: [0, -10], lw: 12 }); }
function plate(s, x, y, size, bg, fg, o = {}) {
  g.save(); g.translate(x, y); g.rotate(o.rot || 0); let fs = size; g.font = `900 ${fs}px Rubik`;
  while (o.max && g.measureText(s).width + fs * .5 > o.max && fs > 40) { fs -= 4; g.font = `900 ${fs}px Rubik`; }
  const m = g.measureText(s), w = m.width, asc = m.actualBoundingBoxAscent, des = m.actualBoundingBoxDescent, padX = fs * .24, padY = fs * .17;
  const bx = o.align === 'center' ? -w / 2 - padX : o.align === 'right' ? -w - 2 * padX : 0, bw = w + 2 * padX, bh = asc + des + 2 * padY, by = -bh / 2;
  const sh = o.shadow ?? Math.max(12, fs * .07);
  g.fillStyle = '#0b0614'; g.beginPath(); g.roundRect(bx + sh, by + sh, bw, bh, fs * .08); g.fill();
  g.fillStyle = bg; g.beginPath(); g.roundRect(bx, by, bw, bh, fs * .08); g.fill();
  g.lineWidth = Math.max(8, fs * .05); g.strokeStyle = '#0b0614'; g.stroke();
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; const tx = bx + padX, ty = by + padY + asc;
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = fs * .13; g.strokeStyle = '#0b0614'; g.strokeText(s, tx, ty); }
  g.fillStyle = fg; g.fillText(s, tx, ty); g.restore();
  return { w: bw, h: bh, fs };
}
function dof(px = 5, filt = '') {                  // blur what is already drawn (background depth), optional grade
  const c2 = new OffscreenCanvas(1920, 1080); c2.getContext('2d').drawImage(g.canvas, 0, 0);
  g.save(); g.filter = `blur(${px}px) ${filt}`; g.drawImage(c2, 0, 0); g.restore();
}
function grade() { const c2 = new OffscreenCanvas(1920, 1080); c2.getContext('2d').drawImage(g.canvas, 0, 0); g.save(); g.filter = 'saturate(1.25) contrast(1.08)'; g.drawImage(c2, 0, 0); g.restore(); }
function sideShade(a = .75, w = 1150) { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, `rgba(10,4,24,${a})`); gr.addColorStop(1, 'rgba(10,4,24,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, 1080); }
function rim(x, y, R, col) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y, R * 1.2, x, y, R * 2.3); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - R * 3, y - R * 3, R * 6, R * 6); g.restore(); }
const waves = (x, y, n = 4, col = '#ffe7a0') => { for (let k = 0; k < n; k++) T.line(g, T.ell(x, y, 140 + k * 120, 90 + k * 80, 30, -Math.PI * .35, Math.PI * .35), { line: col, lw: 16 - k * 2 }); };
const VAR = {
  // A — «НЕ ОПУСКАЙ ОКНО / КТО-ТО СТУЧИТ»: the side window, a dark figure in the blizzard, the scared face
  A() {
    W.bg(g, W.C.cabin); g.save(); g.beginPath(); g.rect(0, 0, 1300, 1080); g.clip(); W.outside(g, 1.3, { bury: .5, tail: 1, figure: 1, figX: 640, storm: 200 }); g.restore();
    T.shape(g, [[0, 0], [1300, 0], [1300, 1080], [0, 1080]], { fill: null, line: '#1a1c22', lw: 40 });
    for (const [x, y] of [[760, 430], [820, 520]]) for (let k = 0; k < 3; k++) T.line(g, T.ell(x, y, 30 + k * 30, 22 + k * 22, 24, 0, Math.PI * 2.05), { line: 'rgba(255,255,255,.75)', lw: 6 });
    dof(3, 'saturate(1.2)'); sideShade(.45, 1000); vignette(.5);
    rim(1480, 600, 300, 'rgba(255,60,40,.4)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'up', look: [-1, -.2], sweat: true, scream: .9, side: -.5 }, { noBg: true, x: 1480, y: 560, R: 300 });
    plate('НЕ ОПУСКАЙ ОКНО', 60, 150, 120, '#ffd400', '#0b0614', { rot: -.035, max: 1060 });
    plate('КТО СТУЧИТ?', 70, 410, 210, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1120 });
    grade();
  },
  // B — «ПРАВИЛО 7 / СТЁРТО»: the scratched lid, the hidden line, ???
  B() {
    T.setCam(1000, 470, 1.2); W.lid(g, 0, { q: true }); T.setCam(); dof(2); sideShade(.55, 1100); vignette(.45);
    rim(1480, 600, 300, 'rgba(160,210,255,.35)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'worried', look: [-1, .2], sweat: true, side: -.5, scream: .6 }, { noBg: true, x: 1480, y: 560, R: 300 });
    plate('ПРАВИЛО 7', 60, 160, 170, '#ffd400', '#0b0614', { rot: -.035, max: 1000 });
    plate('СТЁРТО', 70, 430, 260, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1000 });
    grade();
  },
  // C — «−32° / НЕ ВЫХОДИ!»: the buried car, the figure, the faraway headlights
  C() {
    W.outside(g, 1.1, { bury: .85, tail: 1, figure: 1, figX: 340, lights: 1, scarf: true, storm: 220 }); dof(2, 'saturate(1.2)'); sideShade(.4, 1000); vignette(.45);
    rim(1480, 600, 300, 'rgba(160,210,255,.35)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'up', look: [-1, 0], sweat: true, scream: .9, side: -.5 }, { noBg: true, x: 1480, y: 560, R: 300 });
    plate('−32° · НОЧЬ', 60, 160, 150, '#ffd400', '#0b0614', { rot: -.035, max: 1000 });
    plate('НЕ ВЫХОДИ!', 70, 420, 220, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1100 });
    grade();
  },
};
function draw() { T.setTime(0); T.setCam(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); VAR[V](); T.setCam(); }
