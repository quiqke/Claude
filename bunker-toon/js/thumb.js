// thumb.js — YouTube thumbnails for «30 дней в бункере» (1920×1080): highlighted plates, scared face, the hook prop.
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
  // A — «МАМА ЗОВЁТ / НЕ ОТВЕЧАЙ!»: the vent with mom's voice, the face with hands over the mouth
  A() {
    W.ventClose(g, 0, {}); T.setCam(); g.save(); g.translate(-420, 120); g.scale(.85, .85); W.ventClose(g, 0, {}); g.restore();
    for (let k = 0; k < 4; k++) T.line(g, T.ell(420, 560, 420 + k * 120, 260 + k * 80, 40, 0, Math.PI * 2.02), { line: '#ffe7a0', lw: 14 });
    dof(4, 'saturate(1.2)'); sideShade(.55, 1100); vignette(.5);
    rim(1460, 600, 300, 'rgba(255,200,90,.45)');
    W.bigFace(g, 0, { eyes: 'wide', brow: 'up', look: [-1, -.4], sweat: true, tear: true, side: -.4 }, { noBg: true, hands: true, x: 1460, y: 560, R: 300 });
    plate('МАМА ЗОВЁТ', 60, 170, 150, '#ffd400', '#0b0614', { rot: -.035, max: 1080 });
    plate('НЕ ОТВЕЧАЙ!', 70, 470, 220, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1100 });
    grade();
  },
  // B — «СНАРУЖИ ВСЕ МЕРТВЫ / ИЛИ НЕТ?»: the periscope's dead world, the face peeking
  B() {
    W.bg(g, '#0a0a10'); g.save(); g.translate(-330, 110); W.periView(g, 0, {}); g.restore();
    sideShade(.35, 900); vignette(.45);
    rim(1480, 600, 300, 'rgba(255,240,200,.35)');
    W.bigFace(g, 0, { eyes: 'wide', brow: 'up', look: [-1, 0], sweat: true, scream: .9, side: -.5 }, { noBg: true, x: 1480, y: 580, R: 300 });
    plate('СНАРУЖИ ВСЕ МЕРТВЫ', 50, 120, 112, '#ffd400', '#0b0614', { rot: -.03, max: 1200 });
    plate('ИЛИ НЕТ?', 70, 380, 210, '#ff2a2a', '#ffffff', { rot: -.03, stroke: true, max: 900 });
    arrow(820, 760, 640, 660, 40);
    grade();
  },
  // C — «30 ДНЕЙ / НЕ ОТКРЫВАЙ»: the door wheel, the red dot watching
  C() {
    g.save(); g.translate(-360, 60); W.doorClose(g, 0, {}); g.restore(); dof(3, 'saturate(1.2)'); sideShade(.5, 1100); vignette(.5);
    rim(1460, 600, 300, 'rgba(255,90,60,.4)');
    W.bigFace(g, 0, { eyes: 'wide', brow: 'up', look: [-1, -.2], sweat: true, side: -.4, scream: .8 }, { noBg: true, x: 1460, y: 560, R: 300 });
    plate('НЕ ОТКРЫВАЙ', 60, 170, 150, '#ffd400', '#0b0614', { rot: -.035, max: 1080 });
    plate('30 ДНЕЙ', 70, 470, 250, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1100 });
    T.dot(g, 1840, 90, 22, '#ff2a2a'); T.glowRings(g, 1840, 90, 70, '#ff2a2a', .35);
    grade();
  },
  // D — «ЭТО МАМА? / НЕ ОТВЕЧАЙ!»: two big faces — mom calling above the ground, you under it with hands over the mouth
  D() {
    W.bg(g, '#141c38'); for (let i = 0; i < 50; i++) T.dot(g, (i * 397) % 1920, (i * 233) % 420, 2.5, '#e8e0ff');
    g.save(); g.globalAlpha = .28; g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(1180, 330); g.lineTo(900, 520); g.lineTo(1120, 520); g.fill(); g.restore();
    T.shape(g, [[-100, 470], [2100, 470], [2100, 590], [-100, 590]], { fill: W.C.soil, shade: W.C.soilS, shadeOff: [0, -20] });
    for (let i = 0; i < 18; i++) T.shape(g, T.ell((i * 211) % 1920, 500 + (i * 37) % 70, 18, 11, 10), { fill: '#7a6050', lw: 4, seed: i });
    T.shape(g, [[0, 590], [1920, 590], [1920, 1100], [0, 1100]], { fill: '#2e342c', line: false });
    T.shape(g, T.rect(1000, 330, 50, 330), { fill: '#7a817a', lw: 6 }); T.shape(g, [[970, 330], [1080, 330], [1025, 290]], { fill: '#6a706a', lw: 6 });
    // mom above: big face, purple coat, flashlight glow
    T.glowRings(g, 1420, 270, 300, '#ffe7a0', .18);
    T.shape(g, [[1180, 520], [1250, 400], [1590, 400], [1660, 520]], { fill: '#8b5a9b', shade: '#68407a', shadeOff: [-30, 0] });
    T.face(g, 1420, 250, 170, T.CAST.mom, { eyes: 'wide', brow: 'worried', scream: .7, look: [-.6, .7], tear: true, side: -.3 });
    for (let k = 0; k < 4; k++) T.line(g, T.ell(1025, 640, 90 + k * 70, 40 + k * 32, 24, 0, Math.PI), { line: '#ffe7a0', lw: 10 - k * 2 });
    // you below
    W.bigFace(g, 0, { eyes: 'wide', brow: 'up', look: [-.3, -1], sweat: true, side: -.2 }, { noBg: true, hands: true, x: 1460, y: 800, R: 210 });
    T.dark(g, .35, [{ x: 1460, y: 800, r: 420 }, { x: 1420, y: 260, r: 420 }], '#05081a');
    vignette(.4);
    plate('ЭТО МАМА?', 50, 170, 160, '#ffd400', '#0b0614', { rot: -.035, max: 860 });
    plate('НЕ ОТВЕЧАЙ!', 60, 440, 190, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 900 });
    grade();
  },
  // E — «30 ДНЕЙ ПОД ЗЕМЛЁЙ / ОН СМОТРИТ»: the red dot in the ceiling is a camera
  E() {
    g.save(); g.translate(-380, 60); W.redDotClose(g, 0.2, { lens: 1, beam: .6 }); g.restore(); dof(2, 'saturate(1.2)'); sideShade(.45, 1000); vignette(.5);
    T.glowRings(g, 700, 530, 160, '#ff2a2a', .35);
    rim(1460, 620, 300, 'rgba(255,60,40,.4)');
    W.bigFace(g, 0, { eyes: 'wide', brow: 'up', look: [-1, -.8], sweat: true, side: -.4, scream: .8 }, { noBg: true, x: 1460, y: 600, R: 300 });
    plate('30 ДНЕЙ ПОД ЗЕМЛЁЙ', 50, 130, 110, '#ffd400', '#0b0614', { rot: -.035, max: 1150 });
    plate('ОН СМОТРИТ', 60, 360, 190, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1100 });
    arrow(380, 800, 590, 600, 40);
    grade();
  },
};
function draw() { T.setTime(0); T.setCam(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); VAR[V](); T.setCam(); }
