// icons.js — motion pieces for the documentary, drawn in the toon line (constant ink width, soft boil).
// Every icon is centred on (0,0) and about 100 units across; callers place them with push/translate/scale.
// No emblems, flags, insignia or symbols anywhere: vehicles and people are plain shapes in side colours.
import { lerp, hash, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, quad, dot, text } from './toon.js';

export const PAL = { paper: '#f4ead2', paperS: '#e2d3b0', grey: '#8b8e86', greyS: '#6e716a', red: '#b8323a', redD: '#8e1f35', blue: '#2f4b8a', blueD: '#1c2a5a',
  gold: '#e3a43a', goldL: '#f2c66a', steel: '#9aa1ac', steelD: '#6b7280', wood: '#7a5134', green: '#5b6a52', fire: '#ff8a2a', snow: '#f4f6fb', mud: '#6b4a32' };

export function tank(col = '#6f7564') {
  shape(rr(-56, -6, 112, 34, 16), { fill: '#3e4238', lw: 6, shade: () => { for (let i = 0; i < 5; i++) dot(-40 + i * 20, 11, 7, '#2a2c26'); } });
  shape([[-48, -6], [48, -6], [38, -34], [-34, -34]], { fill: col, lw: 6 });
  shape(rr(-20, -54, 44, 22, 8), { fill: col, lw: 6 }); stroke([[22, -44], [72, -48]], 9);
}
export function truck(col = '#6f7564') {
  shape(rr(-56, -40, 70, 46, 6), { fill: col, lw: 6 }); shape([[14, -30], [40, -30], [54, -10], [54, 6], [14, 6]], { fill: col, lw: 6, shade: () => fillOnly([[22, -26], [38, -26], [48, -12], [22, -12]], '#cfd8e6', { boil: 0 }) });
  for (const x of [-36, 34]) shape(ell(x, 10, 13, 13, 14), { fill: '#2a2c26', lw: 5 });
}
export function plane(col = '#7d8372') {
  shape(spline([[-60, 0], [-30, -10], [50, -8], [66, 0], [50, 8], [-30, 10]]), { fill: col, lw: 6 });
  shape([[-6, -6], [14, -6], [-10, -58], [-26, -58]], { fill: col, lw: 6 }); shape([[-6, 6], [14, 6], [-10, 50], [-26, 50]], { fill: col, lw: 6 });
  shape([[-54, -4], [-44, -4], [-58, -26], [-66, -26]], { fill: col, lw: 5 });
}
export function boat(col = '#c98a2b') {
  shape([[-56, -6], [56, -6], [40, 20], [-44, 20]], { fill: col, lw: 6 }); stroke([[0, -6], [0, -62]], 6);
  shape([[4, -60], [44, -14], [4, -14]], { fill: PAL.paper, lw: 5 });
}
export function ship(col = '#5a6272') {
  shape([[-80, -4], [86, -4], [64, 24], [-70, 24]], { fill: col, lw: 6 }); shape(rr(-34, -30, 60, 28, 4), { fill: col, lw: 6 }); shape(rr(-8, -52, 20, 24, 3), { fill: col, lw: 5 });
  stroke([[34, -18], [70, -24]], 7);
}
export function crate(label = '') {
  shape(rr(-40, -34, 80, 68, 4), { fill: '#a8784e', lw: 6, shade: () => { stroke([[-40, -34], [40, 34]], 4, { line: '#7a5134' }); stroke([[40, -34], [-40, 34]], 4, { line: '#7a5134' }); } });
  if (label) text(label, 0, 0, { font: '900 18px Nunito', fill: INK });
}
export function barrel(col = '#3e4238') {
  shape(rr(-26, -36, 52, 72, 10), { fill: col, lw: 6, shade: () => { fillOnly(rect(-30, -14, 60, 6), '#2a2c26', { boil: 0 }); fillOnly(rect(-30, 10, 60, 6), '#2a2c26', { boil: 0 }); } });
}
export function train(cars = 3, col = '#4a4f58', cargo = null) {
  shape(rr(-60, -50, 80, 56, 6), { fill: col, lw: 6 }); shape(rr(10, -70, 22, 26, 3), { fill: col, lw: 5 }); shape(rr(-50, -72, 40, 24, 4), { fill: col, lw: 5 });
  for (const x of [-44, -6]) shape(ell(x, 10, 13, 13, 14), { fill: '#2a2c26', lw: 5 });
  for (let i = 0; i < cars; i++) { const x = -160 - i * 110; stroke([[x + 50, -10], [x + 100, -10]], 5);
    shape(rr(x - 46, -48, 96, 48, 5), { fill: '#7a5134', lw: 6 }); for (const dx of [-26, 26]) shape(ell(x + dx, 8, 11, 11, 12), { fill: '#2a2c26', lw: 5 });
    if (cargo) { push(); translate(x, -70); scale(.42); cargo(); pop(); } }
}
export function factory(col = '#8a6a55') {
  shape([[-70, 40], [-70, -10], [-40, -30], [-40, -10], [-10, -30], [-10, -10], [20, -30], [20, 40]], { fill: col, lw: 6 });
  shape(rr(26, -70, 26, 110, 3), { fill: col, lw: 6 }); shape(rr(-50, 6, 18, 18, 2), { fill: PAL.goldL, lw: 4 }); shape(rr(-20, 6, 18, 18, 2), { fill: PAL.goldL, lw: 4 });
}
export function gear(r = 50, teeth = 10, col = '#9aa1ac', a = 0) {
  const p = []; for (let i = 0; i < teeth * 4; i++) { const u = i / (teeth * 4) * TAU + a, rr2 = (i % 4 < 2) ? r : r * .8; p.push([Math.cos(u) * rr2, Math.sin(u) * rr2]); }
  shape(p, { fill: col, lw: 6 }); shape(ell(0, 0, r * .28, r * .28, 20), { fill: '#4a4f58', lw: 5 });
}
export function rocket(col = '#e9e4da') {
  shape(spline([[0, -80], [16, -50], [18, 40], [-18, 40], [-16, -50]]), { fill: col, lw: 6, shade: () => fillOnly(rect(-20, -6, 40, 14), '#3e4238', { boil: 0 }) });
  for (const s of [-1, 1]) shape([[s * 16, 10], [s * 36, 44], [s * 16, 40]], { fill: '#3e4238', lw: 5 });
}
export function bomb(col = '#6b7280') {
  shape(spline([[-58, 0], [-40, -26], [30, -24], [50, 0], [30, 24], [-40, 26]]), { fill: col, lw: 6 });
  shape([[-58, 0], [-78, -24], [-82, 24]], { fill: '#4a4f58', lw: 5 });
}
export function atom(t = 0, col = PAL.gold) {
  for (let k = 0; k < 3; k++) { push(); rotate(k * Math.PI / 3 + t * .4); shape(ell(0, 0, 70, 24, 40), { line: col, lw: 6, fill: null }); dot(Math.cos(t * 3 + k * 2) * 70, Math.sin(t * 3 + k * 2) * 24, 8, col); pop(); }
  dot(0, 0, 14, PAL.red);
}
export function person(col = '#5b6a52', head = '#f6e4c4') {   // tiny generic person (crowds, refugees, workers)
  stroke([[0, -24], [0, 14]], 8, { line: col }); stroke([[0, 14], [-10, 40]], 7); stroke([[0, 14], [10, 40]], 7); stroke([[-14, 0], [14, 0]], 7);
  shape(ell(0, -40, 16, 16, 16), { fill: head, lw: 5 });
}
export function coin() { shape(ell(0, 0, 22, 22, 20), { fill: PAL.goldL, lw: 5, shade: () => fillOnly(ell(6, 4, 14, 14, 14), PAL.gold, { boil: .2 }) }); }
export function spark(t = 0, s = 1) {   // a partisan fire: flickering flame with a dark core
  const f = 1 + .12 * Math.sin(t * 17 + s * 9);
  shape(spline([[0, -60 * f], [22, -20], [26, 14], [0, 30], [-26, 14], [-22, -20]]), { fill: PAL.fire, lw: 6, shade: () => fillOnly(spline([[0, -24 * f], [12, 4], [0, 24], [-12, 4]]), PAL.goldL, { boil: .4 }) });
}
export function chair() {
  shape(rr(-44, -10, 88, 18, 4), { fill: PAL.wood, lw: 6 }); shape(rr(-40, -110, 80, 100, 8), { fill: PAL.redD, lw: 6 });
  for (const x of [-36, 36]) stroke([[x, 8], [x, 70]], 9);
}
export function mushroom(u = 1) {   // a paper atomic cloud, grows with u (0..1)
  const h = 60 + 260 * u, w = 40 + 120 * u;
  shape(spline([[-26 * u - 10, 0], [-18 * u - 8, -h * .55], [18 * u + 8, -h * .55], [26 * u + 10, 0]]), { fill: '#e9d9b8', lw: 7 });
  shape(spline([[-w, -h * .62], [-w * .8, -h], [-w * .2, -h - 50 * u], [w * .5, -h - 40 * u], [w, -h * .78], [w * .6, -h * .5], [-w * .6, -h * .5]]), { fill: '#f3e6c8', lw: 7, shade: () => fillOnly(ell(w * .3, -h * .62, w * .6, 30 * u + 8, 20), '#e0c89c', { boil: .4 }) });
  shape(spline([[-w * 1.2, -6], [-w * .6, -36 * u], [w * .6, -36 * u], [w * 1.2, -6], [0, 10]]), { fill: '#e9d9b8', lw: 6 });
}
export function tent(col = '#6f7564') { shape([[-50, 30], [0, -40], [50, 30]], { fill: col, lw: 6 }); shape([[-10, 30], [0, 0], [10, 30]], { fill: '#2a2c26', lw: 5 }); }
export function sandbags(n = 5) { for (let i = 0; i < n; i++) shape(ell(-n * 18 + i * 36 + 18, 0, 20, 12, 16), { fill: '#b9a27a', lw: 5 }); }
export function snowflake(s = 1) { for (let k = 0; k < 3; k++) { push(); rotate(k * Math.PI / 3); stroke([[-14 * s, 0], [14 * s, 0]], 4, { line: PAL.snow }); pop(); } }

// a paper card with typewriter lines: lines = [{t:'TEXT', f:'font', c:'#col'}]; w,h in px
export function card(w, h, lines, { fill = PAL.paper, clip = true, tilt = 0, pin = true } = {}) {
  push(); rotate(tilt);
  fillOnly(rr(-w / 2 + 10, -h / 2 + 14, w, h, 10), 'rgba(10,8,20,.32)', { boil: .3 });
  shape(rr(-w / 2, -h / 2, w, h, 10), { fill, lw: 7, shade: () => { for (let y = -h / 2 + 30; y < h / 2; y += 34) stroke([[-w / 2 + 20, y], [w / 2 - 20, y]], 2, { line: 'rgba(120,100,70,.18)', boil: .2 }); } });
  if (clip) { shape(rr(-w / 2 + 30, -h / 2 - 16, 26, 52, 8), { fill: null, line: '#7d8590', lw: 6 }); }
  if (pin) dot(w / 2 - 34, -h / 2 + 26, 10, PAL.red);
  let y = -h / 2 + 30 + (lines.length ? 0 : 0); const total = lines.reduce((a, l) => a + (l.lh || 56), 0); y = -total / 2;
  for (const l of lines) { const lh = l.lh || 56; text(l.t, l.x ?? 0, y + lh / 2, { font: l.f || '900 40px Nunito', fill: l.c || INK, align: l.a || 'center' }); y += lh; }
  pop();
}
// a rubber stamp: thick frame + caps text, slightly rotated; a = alpha (ink strength)
export function stamp(label, col = PAL.red, { w = 520, h = 140, size = 72, a = 1, sub = null } = {}) {
  g.save(); g.globalAlpha = a;
  shape(rr(-w / 2, -h / 2, w, h, 14), { fill: 'rgba(255,255,255,0)', line: col, lw: 12 });
  shape(rr(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 8), { fill: null, line: col, lw: 4 });
  text(label, 0, sub ? -12 : 4, { font: `400 ${size}px "Russo One"`, fill: col });
  if (sub) text(sub, 0, h / 2 - 34, { font: '900 28px Nunito', fill: col });
  g.restore();
}
