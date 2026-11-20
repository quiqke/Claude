// thumb.js — YouTube thumbnails for «Меня заперли в морозилке» (1920×1080). All three variants are the OPENING moment
// (frame 0 of the film): the frosted face, the door window with a face, circled. SCENE[v](t) draws the picture, plates(v, k) the text.
import * as T from './toon.js';
import * as W from './world.js';
let g, V;
export async function init(cv, cues, v) {
  g = cv.getContext('2d'); V = v || 'A';
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  return { draw, EV: [] };
}
export function use(ctx) { g = ctx; }
const vignette = (a = .55) => { const gr = g.createRadialGradient(960, 540, 300, 960, 540, 1150); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(5,10,25,${a})`); g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080); };
function plate(s, x, y, size, bg, fg, o = {}) {
  g.save(); g.translate(x, y); g.rotate(o.rot || 0); let fs = size; g.font = `900 ${fs}px Rubik`;
  while (o.max && g.measureText(s).width + fs * .5 > o.max && fs > 40) { fs -= 4; g.font = `900 ${fs}px Rubik`; }
  const m = g.measureText(s), w = m.width, asc = m.actualBoundingBoxAscent, des = m.actualBoundingBoxDescent, padX = fs * .24, padY = fs * .17;
  const bw = w + 2 * padX, bh = asc + des + 2 * padY, by = -bh / 2, sh = Math.max(12, fs * .07);
  g.fillStyle = '#0b0614'; g.beginPath(); g.roundRect(sh, by + sh, bw, bh, fs * .08); g.fill();
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, by, bw, bh, fs * .08); g.fill(); g.lineWidth = Math.max(8, fs * .05); g.strokeStyle = '#0b0614'; g.stroke();
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; const tx = padX, ty = by + padY + asc;
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = fs * .13; g.strokeStyle = '#0b0614'; g.strokeText(s, tx, ty); }
  g.fillStyle = fg; g.fillText(s, tx, ty); g.restore();
}
function dof(px = 5, filt = '') { const c2 = new OffscreenCanvas(1920, 1080); c2.getContext('2d').drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${px}px) ${filt}`; g.drawImage(c2, 0, 0); g.restore(); }
export function grade() { const c2 = new OffscreenCanvas(1920, 1080); c2.getContext('2d').drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'saturate(1.25) contrast(1.08)'; g.drawImage(c2, 0, 0); g.restore(); }
function rim(x, y, R, col) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y, R * 1.2, x, y, R * 2.3); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - R * 3, y - R * 3, R * 6, R * 6); g.restore(); }
// the opening moment: freezer, the door window with a face (circled), your frosted face on the right
function opening(t, o = {}) {
  const z = o.z || 1.1, cx = 960 + (o.doorX ? (960 - o.doorX) / z : 400 / z), cy = 345 - ((o.doorY ?? 430) - 540) / z;
  T.setCam(cx, cy, z); W.fzRoom(g, t, { face: 1, carc: true, dark: .5, beam: [960, 360], beamR: 560 }); T.line(g, T.ell(960, 345, 125, 105, 40), { line: '#ff2a2a', lw: 12 }); T.setCam();
  dof(2.5, 'saturate(1.15)'); vignette(.45);
  rim(o.fx || 1470, (o.fy || 600) + 20, o.R || 300, 'rgba(140,200,255,.45)');
  W.frostFace(g, t, o.fx || 1470, o.fy || 600, o.R || 300, o.f || { eyes: 'wide', brow: 'up', look: [-1, -.3], scream: .6, side: -.45 }, { icicles: o.icicles });
  W.frostEdges(g, .55);
}
export const SCENE = {
  A(t = 1) { opening(t); },
  B(t = 1) { opening(t, { z: 1.25, doorX: 470, fx: 1450, fy: 560, R: 360, f: { eyes: 'wide', brow: 'worried', look: [-1, -.2], scream: .45, side: -.4 } }); },
  C(t = 1) { opening(t, { icicles: true, f: { eyes: 'half', brow: 'worried', look: [-1, -.3], scream: .35, side: -.45 } }); },
};
export const PLATES = {
  A() { plate('ЗАПЕРЛИ В МОРОЗИЛКЕ', 50, 130, 120, '#ffd400', '#0b0614', { rot: -.035, max: 1250 }); plate('−25°', 70, 860, 280, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 900 }); },
  B() { plate('−25° · 8 ЧАСОВ', 50, 140, 130, '#ffd400', '#0b0614', { rot: -.035, max: 1100 }); plate('КТО ЗАПЕР?', 70, 870, 200, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 1000 }); },
  C() { plate('ДО УТРА 8 ЧАСОВ', 50, 140, 130, '#ffd400', '#0b0614', { rot: -.035, max: 1150 }); plate('−25°', 70, 860, 280, '#ff2a2a', '#ffffff', { rot: -.035, stroke: true, max: 900 }); },
};
export function plates(v, k = 1) { if (k <= 0) return; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(-(1 - k) * 1500, 0); g.globalAlpha = Math.min(1, k * 1.5); PLATES[v](); g.restore(); }
function draw() { T.setTime(0); T.setCam(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); SCENE[V](1); plates(V, 1); grade(); T.setCam(); }
