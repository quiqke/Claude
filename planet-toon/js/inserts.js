// inserts.js — reusable close-up «inserts» for the toon style: show exactly what the voice names.
// Hands, boots, a knife carving text letter by letter, belts across the shoulders, alarm light, cup, screens…
// Every function draws a full frame in world coords 1920×1080 (call T.setCam() first for a straight frame).
import * as T from './toon.js';
const { shape, line, ell, rect, rrect, dot, text, glowRings, tint, dark, INK } = T;
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const SUIT = { fill: '#f4f1ea', shade: '#cbc3b4', glove: '#e9e4da', gloveS: '#c4bcae' };

// a gloved hand (palm / fist / point / grip), at x,y, scale s, rotation r
export function glove(g, x, y, s = 1, r = 0, pose = 'palm') {
  T.setRot(r, x, y);
  shape(g, rrect(x - 90 * s, y + 40 * s, 180 * s, 260 * s, 50 * s), { fill: SUIT.fill, shade: SUIT.shade, shadeOff: [-20 * s, 0] });           // cuff/sleeve
  shape(g, rrect(x - 80 * s, y - 70 * s, 160 * s, 140 * s, 40 * s), { fill: SUIT.glove, shade: SUIT.gloveS, shadeOff: [-14 * s, -8 * s] });  // palm
  const fing = pose === 'fist' ? [] : pose === 'point' ? [[-10, 1.6]] : [[-55, 1], [-18, 1.15], [20, 1.1], [56, .95]];
  for (const [fx, l] of fing) shape(g, rrect(x + fx * s - 18 * s, y - 70 * s - 110 * s * l, 36 * s, 120 * s * l, 18 * s), { fill: SUIT.glove, shade: SUIT.gloveS, shadeOff: [-6 * s, 0], seed: fx });
  if (pose === 'fist' || pose === 'grip') for (let k = 0; k < 4; k++) shape(g, rrect(x - 72 * s + k * 38 * s, y - 100 * s, 36 * s, 50 * s, 16 * s), { fill: SUIT.glove, shade: SUIT.gloveS, seed: k + 9 });
  shape(g, rrect(x - 108 * s, y + 40 * s, 52 * s, 110 * s, 22 * s), { fill: SUIT.glove, shade: SUIT.gloveS, seed: 33 });                      // thumb
  T.setRot(0);
}
// a boot (side view) standing on y; o.sink 0..1 hides it in mud of colour o.mud
export function boot(g, x, y, s = 1, o = {}) {
  shape(g, rrect(x - 70 * s, y - 330 * s, 140 * s, 260 * s, 30 * s), { fill: SUIT.fill, shade: SUIT.shade, shadeOff: [-24 * s, 0] });       // shin
  shape(g, [[x - 80 * s, y - 90 * s], [x + 80 * s, y - 90 * s], [x + 190 * s, y - 30 * s], [x + 190 * s, y], [x - 90 * s, y]], { fill: '#5a5f6e', shade: '#3e4250', shadeOff: [0, -14 * s] });
  shape(g, rect(x - 90 * s, y - 14 * s, 280 * s, 18 * s), { fill: '#2e313c', lw: 5 });
}
// carving text with a knife, letter by letter: lines[], prog 0..1 over all characters; sparks at the blade
export function carve(g, t, lines, prog, o = {}) {
  const x0 = o.x ?? 520, y0 = o.y ?? 210, lh = o.lh ?? 88, size = o.size ?? 66, total = lines.reduce((a, l) => a + l.length, 0);
  let left = Math.floor(clamp(prog) * total), tip = null;
  g.save(); g.font = `700 ${size}px Caveat`; g.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    const n = Math.min(ln.length, Math.max(0, left)); left -= ln.length; if (n <= 0) return;
    const part = ln.slice(0, n), y = y0 + i * lh, w = g.measureText(part).width;
    g.save(); g.translate(x0, y); g.rotate(-.02); g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = o.ink || '#3a3f50'; g.strokeText(part, 0, 0); g.fillStyle = o.fill || '#f8f8ff'; g.fillText(part, 0, 0); g.restore();
    if (n < ln.length) tip = [x0 + w, y];
  });
  g.restore();
  if (tip && o.knife !== false) {                                   // the knife + glove at the blade tip, sparks and shavings
    const [kx, ky] = tip, jit = Math.sin(t * 40) * 3;
    for (let i = 0; i < 9; i++) { const a = -1.2 - hash(i, Math.floor(t * 20)) * 1.6, r = 20 + hash(i, 3, Math.floor(t * 20)) * 50; dot(g, kx + Math.cos(a) * r, ky + Math.sin(a) * r, 3 + hash(i, 5) * 3, i % 3 ? '#fff6b0' : '#ffffff'); }
    shape(g, [[kx, ky + jit], [kx + 26, ky - 30 + jit], [kx + 150, ky - 150 + jit], [kx + 132, ky - 168 + jit], [kx + 6, ky - 38 + jit]], { fill: '#d8dde6', shade: '#a9b0bf', shadeOff: [6, 0] });
    shape(g, rrect(kx + 128, ky - 250 + jit, 60, 120, 18), { fill: '#3a2a1a', lw: 6 });
    glove(g, kx + 200, ky - 230 + jit, .7, -.6, 'grip');
  }
}
// interior of the capsule: seat, belts across the shoulders, red alarm light
export function capsuleInterior(g, t, o = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#2a2f44', line: false });
  for (let x = -200; x < 2200; x += 240) line(g, [[x, -100], [x + 60, 1200]], { line: '#222638', lw: 8, seed: x });
  const alarm = o.alarm ? (Math.sin(t * 9) > 0 ? 1 : .2) : 0;
  shape(g, ell(1500, 140, 70, 46, 20), { fill: alarm > .5 ? '#ff3a2a' : '#7a1a14' }); if (alarm > .5) glowRings(g, 1500, 140, 420, '#ff3a2a', .25);
  shape(g, rrect(560, 200, 800, 1000, 120), { fill: '#3a3f58', shade: '#2a2e42', shadeOff: [-30, 0] });                                         // seat back
  shape(g, [[700, 1200], [760, 640], [1160, 640], [1220, 1200]], { fill: SUIT.fill, shade: SUIT.shade, shadeOff: [-40, 0] });                    // torso
  shape(g, ell(960, 470, 210, 200, 36), { fill: '#bfe8ff', line: false }); line(g, ell(960, 470, 210, 200, 36, 0, Math.PI * 2.05), { lw: 8 });  // helmet glass
  T.face(g, 960, 470, 130, T.CAST.astro, o.face || { eyes: 'half', brow: 'worried' });
  const tight = o.tight ? Math.sin(t * 14) * 4 : 0;
  for (const d of [-1, 1]) shape(g, [[960 + d * 230, 600 + tight], [960 + d * 290, 620 + tight], [960 - d * 60, 1200], [960 - d * 130, 1200]], { fill: '#e8742a', shade: '#c95a1a', shadeOff: [0, 10] });
  shape(g, rrect(900, 860, 120, 80, 14), { fill: '#c9ccd4', lw: 6 });
  if (alarm) tint(g, '#ff2020', .16 * alarm);
}
// a mug of coffee, close (the flashback)
export function cup(g, t, o = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#3a4256', line: false }); shape(g, rect(-400, 700, 3000, 900), { fill: '#5a6480', shade: '#3a4256', shadeOff: [0, -30] });
  shape(g, [[760, 700], [1160, 700], [1120, 300], [800, 300]], { fill: '#f4f1ea', shade: '#cbc3b4', shadeOff: [-30, 0] }); shape(g, ell(960, 300, 160, 40, 30), { fill: '#5a3220' });
  for (let i = 0; i < 3; i++) { const ph = (t * .5 + i / 3) % 1; g.save(); g.globalAlpha = .5 * (1 - ph); line(g, [[900 + i * 60, 260 - ph * 200], [920 + i * 60 + Math.sin(ph * 6) * 20, 180 - ph * 200]], { line: '#ffffff', lw: 8 }); g.restore(); }
  if (o.out) dark(g, .8 * clamp(o.out), [{ x: 960, y: 500, r: 200 * (1 - clamp(o.out)) + 1 }], '#05070f');
}
// a red tentacle reaching for a boot (lakes)
export function tentacleBoot(g, t, k = 1) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#463a62', line: false }); shape(g, [[-400, 700], [2400, 640], [2400, 1500], [-400, 1500]], { fill: '#d8323c', shade: '#b0222c', shadeOff: [0, -30] });
  boot(g, 1200, 700, 1.1);
  const pts = Array.from({ length: 14 }, (_, i) => [300 + i * 60 * k + Math.sin(t * 5 + i) * 10, 820 - Math.sin(i / 13 * Math.PI) * 160 * k]); line(g, pts, { line: '#8a1a24', lw: 40 }); line(g, pts, { line: '#ff5a64', lw: 14 });
}
// hands shaking (fear / heat), hand pressed on the helmet (silence), glove reaching (hatch)
export function shakingHands(g, t, bg = '#c95a1a') { shape(g, rect(-400, -400, 3000, 2000), { fill: bg, line: false }); const j = Math.sin(t * 30) * 6; glove(g, 700 + j, 700, 1.2, .3, 'palm'); glove(g, 1240 - j, 700 + j, 1.2, -.3, 'palm'); }
export function handOnHelmet(g, t) { shape(g, rect(-400, -400, 3000, 2000), { fill: '#0d2a46', line: false }); T.face(g, 960, 520, 230, T.CAST.astro, { eyes: 'wide', brow: 'up', sweat: true }); g.save(); g.globalAlpha = .2; shape(g, ell(960, 540, 340, 330, 36), { fill: '#bfe8ff', line: false }); g.restore(); line(g, ell(960, 540, 340, 330, 36, 0, Math.PI * 2.05), { lw: 10 }); glove(g, 960, 720, 1.1, 0, 'palm'); }
export function handToHatch(g, t, k = 1, o = {}) { shape(g, rect(-400, -400, 3000, 2000), { fill: o.bg || '#a49a8a', line: false }); shape(g, ell(1100, 520, 330, 300, 40), { fill: '#857b6c', lw: 10 }); shape(g, rrect(1040, 470, 140, 100, 30), { fill: '#5a5348', lw: 8 }); glove(g, 300 + 700 * clamp(k), 640, 1, -1.2, 'grip'); }
