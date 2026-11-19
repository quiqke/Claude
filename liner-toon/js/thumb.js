// thumb.js — YouTube thumbnails for «Меня столкнули с круизного лайнера» (1920×1080): highlighted plates, scared face, the hook prop.
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
// const waves = (x, y, n = 4, col = '#ffe7a0') => { for (let k = 0; k < n; k++) T.line(g, T.ell(x, y, 140 + k * 120, 90 + k * 80, 30, -Math.PI * .35, Math.PI * .35), { line: col, lw: 16 - k * 2 }); };
const ring = (x, y, r) => { T.line(g, T.ell(x, y, r, r * .85, 40), { line: '#ff2a2a', lw: 16 }); };
const waterline = (y, col = '#16305a') => T.shape(g, [[-300, y + 30], ...Array.from({ length: 26 }, (_, i) => [-300 + i * 100, y + 20 + Math.sin(i * 1.3) * 18]), [2300, y + 30], [2300, 1400], [-300, 1400]], { fill: col, line: false });
const VAR = {
  // A — «МЕНЯ СТОЛКНУЛИ / КТО?»: the liner leaving at night, a figure at the stern rail circled, the face in the water
  A() {
    W.inWater(g, 1, {}); W.liner(g, 1, 760, 560, .62, { night: true, wake: true });
    dof(2.5, 'saturate(1.2)'); vignette(.45);
    const sx = 760 - 900 * .62 + 70, sy = 560 - 40 * .62;     // stern rail
    g.fillStyle = '#05070f'; g.beginPath(); g.ellipse(sx, sy - 92, 20, 23, 0, 0, Math.PI * 2); g.fill(); g.fillRect(sx - 20, sy - 70, 40, 70);
    ring(sx, sy - 50, 95);
    rim(1480, 640, 300, 'rgba(120,170,255,.45)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'up', look: [-1, -.4], sweat: true, scream: .7, side: -.5 }, { noBg: true, x: 1490, y: 620, R: 300 });
    waterline(860);
    for (let r = 0; r < 4; r++) T.line(g, Array.from({ length: 26 }, (_, i) => [-300 + i * 100, 900 + r * 50 + Math.sin(i * 1.1 + r) * 8]), { line: 'rgba(170,200,255,.35)', lw: 5 + r, seed: r });
    plate('МЕНЯ СТОЛКНУЛИ', 50, 130, 130, '#ffd400', '#0b0614', { rot: -.035, max: 1120 });
    plate('КТО?', 70, 860, 260, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 900 });
    grade();
  },
  // B — «40 КМ ДО БЕРЕГА / ТОЛЬКО ДЖИНСЫ»: the face in the night sea, the two inflated knotted jeans legs around the neck
  B() {
    W.inWater(g, 1, { boat: 300, boatS: .3 }); dof(2.5, 'saturate(1.2)'); vignette(.45);
    rim(1470, 560, 280, 'rgba(120,170,255,.45)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'worried', look: [-1, .2], sweat: true, scream: .45, side: -.5 }, { noBg: true, x: 1470, y: 540, R: 270 });
    waterline(850);
    for (let r = 0; r < 4; r++) T.line(g, Array.from({ length: 26 }, (_, i) => [-300 + i * 100, 920 + r * 45 + Math.sin(i * 1.1 + r) * 8]), { line: 'rgba(170,200,255,.35)', lw: 5 + r, seed: r });
    for (const [x1, y1] of [[960, 820], [1990, 800]]) {
      T.shape(g, W.capsule(1470, 880, x1, y1, 184), { fill: '#3a6ab8', shade: '#2a4a88', shadeOff: [0, -18] });
      for (let k = 0; k < 3; k++) T.line(g, [[1470 + (x1 - 1470) * .2, 850 + k * 28], [1470 + (x1 - 1470) * .85, y1 - 30 + k * 28]], { line: '#6a9ae0', lw: 4, seed: k });
      T.shape(g, T.ell(x1, y1, 62, 52, 16), { fill: '#2a4a88', lw: 8 });
    }
    T.shape(g, T.rect(1350, 850, 240, 56), { fill: '#2a4a88', lw: 7 }); T.dot(g, 1470, 878, 12, '#c8a040');
    plate('40 КМ ДО БЕРЕГА', 50, 150, 130, '#ffd400', '#0b0614', { rot: -.035, max: 1150 });
    plate('ТОЛЬКО ДЖИНСЫ', 60, 400, 150, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1100 });
    arrow(520, 560, 900, 760, 44);
    grade();
  },
  // C — «ОН ДУМАЛ, / Я УТОНУЛ»: the friend in the restaurant, shocked, the cup falling
  C() {
    W.restaurant(g, 1, {}); dof(3, 'saturate(1.15)'); sideShade(.55, 1000); vignette(.5);
    rim(1460, 560, 300, 'rgba(255,200,120,.45)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'up', look: [-1, 0], sweat: true, scream: .8, side: -.4 }, { noBg: true, x: 1460, y: 540, R: 300, who: 'artem' });
    T.setRot(.9, 980, 860);
    T.shape(g, [[900, 780], [1060, 780], [1040, 940], [920, 940]], { fill: '#ffffff', shade: '#d8d4cc', shadeOff: [-12, 0], lw: 8 });
    T.line(g, T.ell(1068, 850, 36, 46, 16, -Math.PI / 2, Math.PI / 2), { line: '#ffffff', lw: 14 }); T.setRot(0);
    for (let i = 0; i < 3; i++) T.line(g, [[900 + i * 60, 700 - i * 10], [930 + i * 60, 760 - i * 10]], { line: '#fff6c8', lw: 10, seed: i }); for (let i = 0; i < 6; i++) T.dot(g, 900 + i * 38, 990 + (i % 2) * 22, 13, '#7a4a22');
    T.text(g, 'ДЗЫНЬ', 760, 960, 90, '#fff6c8', { rot: -.12 });
    plate('ОН ДУМАЛ,', 50, 170, 170, '#ffd400', '#0b0614', { rot: -.035, max: 1000 });
    plate('Я УТОНУЛ', 60, 440, 200, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1050 });
    grade();
  },
};
function draw() { T.setTime(0); T.setCam(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); VAR[V](); T.setCam(); }
