// thumb.js — YouTube thumbnails for «7 дней на необитаемом острове» (1920×1080): highlighted plates, scared face, the hook prop.
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
  // A — «НАШЁЛ ДНЕВНИК / ОН ЗНАЛ ВСЁ»: the open diary, the scared face
  A() {
    T.setCam(700, 500, 1.15); W.diary(g, 0, { left: ['День первый.', 'Очнулся лицом в песке.', 'Во рту соль.', 'Солнце жжёт затылок.'], right: ['День второй.', 'Пил росу с пакета.', 'Потом зелёные кокосы.'], glow: true }); T.setCam();
    dof(2.5, 'saturate(1.15)'); sideShade(.5, 1050); vignette(.5);
    rim(1480, 600, 300, 'rgba(255,200,120,.45)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'up', look: [-1, .3], sweat: true, scream: .8, side: -.5 }, { noBg: true, x: 1480, y: 560, R: 300, salt: true, sunburn: true });
    plate('НАШЁЛ ДНЕВНИК', 50, 160, 140, '#ffd400', '#0b0614', { rot: -.035, max: 1060 });
    plate('ОН ЗНАЛ ВСЁ', 60, 420, 200, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1080 });
    grade();
  },
  // B — «ДЕНЬ 7 / ПОСЛЕДНИЙ ШАНС»: the torch on the beach, the ship on the horizon
  B() {
    W.island(g, 1.2, { sky: 'dawn', ship: 600, shipS: .55 }); dof(2, 'saturate(1.2)'); sideShade(.35, 1000); vignette(.45);
    T.line(g, [[1180, 1100], [1300, 500]], { line: '#6a4a2a', lw: 34 }); W.flame(g, 1.2, 1310, 520, 1.4);
    rim(1560, 640, 280, 'rgba(255,160,60,.45)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'worried', look: [-1, -.2], sweat: true, side: -.5, scream: .6 }, { noBg: true, x: 1580, y: 600, R: 270, sunburn: true });
    plate('ДЕНЬ 7', 60, 170, 170, '#ffd400', '#0b0614', { rot: -.035, max: 900 });
    plate('ПОСЛЕДНИЙ ШАНС', 60, 420, 150, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1080 });
    grade();
  },
  // C — «6 ЗАРУБОК / ГДЕ ОН?»: the empty hut with six notches
  C() {
    T.setCam(1100, 560, 1.1); W.hutClose(g, 0, { tally: 6 }); T.setCam(); dof(2); sideShade(.5, 1000); vignette(.5);
    rim(1480, 600, 300, 'rgba(255,220,160,.35)');
    W.faceClose(g, 0, { eyes: 'wide', brow: 'up', look: [-1, 0], sweat: true, side: -.5, scream: .6 }, { noBg: true, x: 1480, y: 560, R: 300, sunburn: true });
    plate('6 ЗАРУБОК', 60, 170, 170, '#ffd400', '#0b0614', { rot: -.035, max: 1000 });
    plate('ГДЕ ОН?', 60, 440, 230, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1000 });
    grade();
  },
};
function draw() { T.setTime(0); T.setCam(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); VAR[V](); T.setCam(); }
