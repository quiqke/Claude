// «Ловушка» · stage: vertical plate framing (1080×1920), camera, print pass, captions in the bottom margin.
// Adapted from the Lemo-Opuscar woodcut demo (MIT): sizes made vertical, caption wrapping for Russian.
import * as WC from './engine/index.js';

export const W = 1080, H = 1920;
export const IMG = { x: 40, y: 40, w: 1000, h: 1520 };       // printed image area; the caption lives in the bottom margin
export const PW = 1000, PH = 1520;                           // plate coordinates
export const [M, m] = WC.canvas(W, H);                       // carve mask (black = uncut wood, white = cut)
export const [C, c] = WC.canvas(W, H);                       // colour plate (alpha)
let P = null;
export const printer = () => P || (P = WC.makePrinter(W, H));

export function camMatrix(cam) {
  const z = cam.z ?? 1, r = cam.r ?? 0, cs = Math.cos(r) * z, sn = Math.sin(r) * z;
  const ox = IMG.x + IMG.w / 2 + (cam.sx || 0), oy = IMG.y + IMG.h / 2 + (cam.sy || 0);
  const x = cam.x ?? PW / 2, y = cam.y ?? PH / 2;
  return [cs, sn, -sn, cs, ox - (cs * x - sn * y), oy - (sn * x + cs * y)];
}
// a frame: paper everywhere, then the uncut block inside the image area, camera applied
export function begin(cam = {}) {
  for (const g of [m, c]) { g.setTransform(1, 0, 0, 1, 0, 0); }
  m.fillStyle = '#fff'; m.fillRect(0, 0, W, H); c.clearRect(0, 0, W, H);
  for (const g of [m, c]) { g.save(); g.beginPath(); g.rect(IMG.x, IMG.y, IMG.w, IMG.h); g.clip(); g.transform(...camMatrix(cam)); }
  m.fillStyle = '#000'; m.fillRect(-6000, -6000, 14000, 14000);
}
export function end() { m.restore(); c.restore(); m.setTransform(1, 0, 0, 1, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0); }

// letterpress caption in the bottom margin, wrapped to ≤ 2 lines, inked on the mask so it prints
export function caption(text, a = 1) {
  if (!text || a <= 0) return;
  m.save(); m.setTransform(1, 0, 0, 1, 0, 0);
  m.font = '400 50px "Old Standard"'; m.textAlign = 'center'; m.textBaseline = 'middle';
  const words = text.split(' '); let rows = [text];
  if (m.measureText(text).width > 940) {
    let best = 1, bd = 1e9;
    for (let i = 1; i < words.length; i++) { const d = Math.abs(m.measureText(words.slice(0, i).join(' ')).width - m.measureText(words.slice(i).join(' ')).width); if (d < bd) { bd = d; best = i; } }
    rows = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }
  const cy = IMG.y + IMG.h + (H - IMG.y - IMG.h) / 2 - 10;
  m.fillStyle = `rgba(0,0,0,${a})`;
  rows.forEach((r, i) => m.fillText(r, W / 2, cy + (i - (rows.length - 1) / 2) * 64));
  m.restore();
}
// carved title: white letters cut into the block, revealed left→right by u (0..1)
export function carveText(text, x, y, size, u = 1, o = {}) {
  if (u <= 0) return;
  m.save(); m.font = `${o.weight || 700} ${size}px "Old Standard"`; m.textAlign = 'center'; m.textBaseline = 'alphabetic';
  const w = m.measureText(text).width;
  m.beginPath(); m.rect(x - w / 2 - 10, y - size * 1.2, (w + 20) * u, size * 1.6); m.clip();
  m.fillStyle = '#fff'; m.fillText(text, x, y);
  m.restore();
}
export function print(g, o = {}) { const out = printer().render(M, C, o); g.drawImage(out, 0, 0); return out; }
