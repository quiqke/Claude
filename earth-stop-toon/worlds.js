// worlds.js — one palette per world (vertical stage 1080×1920, floor at y ≈ 1350), the Earth, flying junk, the swirl wipe.
import { clamp, lerp, hash, vnoise, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, bands } from './toon.js';
import { PAL, eye, mouth } from './chars.js';
export const FLOOR = 1350;
const X0 = -1500, X1 = 2600;

// ———————————— Lab: grey-lilac walls, mustard, dark wood ————————————
export function lab(t, { shake = 0 } = {}) {
  fillOnly(rect(X0, -2000, X1 - X0, 3400), '#a99cbf', { boil: 0 });
  fillOnly(rect(X0, 900, X1 - X0, 460), '#9486ad', { boil: 0 });
  for (let x = -600; x < 1800; x += 180) stroke([[x, -400], [x, FLOOR]], 4, { line: '#958ab0', boil: .3 });
  // shelf with junk, a chalkboard with a globe doodle
  shape(rr(-40, 380, 600, 380, 18), { fill: '#3e5146', lw: 7, shade: () => fillOnly(rect(400, 370, 200, 400), '#334339', { boil: .3 }) });
  stroke(ell(140, 560, 90, 90, 30), 5, { line: '#e9f1e6' }); stroke([[50, 560], [230, 560]], 4, { line: '#e9f1e6' }); stroke(arc(140, 560, 40, 90, -Math.PI / 2, Math.PI / 2, 14), 4, { line: '#e9f1e6' });
  text('ω = 7,29·10⁻⁵', 400, 470, { font: '900 34px Nunito', fill: '#e9f1e6' }); text('СКРИПИТ?!', 400, 640, { font: '900 40px Nunito', fill: '#ffd84a', rot: -.08 });
  shape(rr(640, 300, 380, 30, 6), { fill: '#7a4f33', lw: 6 });
  shape(rr(670, 200, 70, 100, 10), { fill: '#e2a93b', lw: 6 }); shape(ell(820, 250, 50, 50, 24), { fill: '#3fb6a8', lw: 6 }); shape([[900, 300], [960, 180], [1010, 300]], { fill: '#ff8a2a', lw: 6 });
  // floor and a workbench
  fillOnly(rect(X0, FLOOR, X1 - X0, 900), '#6b4a36', { boil: 0 });
  for (let x = -600; x < 1800; x += 140) stroke([[x, FLOOR], [x - 60, FLOOR + 560]], 4, { line: '#5a3d2c', boil: .3 });
  stroke([[X0, FLOOR], [X1, FLOOR]], 7);
  shape(rr(250, 1060, 560, 40, 8), { fill: '#8a5f3e', lw: 7 }); stroke([[290, 1100], [290, FLOOR]], 10); stroke([[770, 1100], [770, FLOOR]], 10);
}

// ———————————— Space: deep blue, an orange Earth, white speed arrows ————————————
export function space(t, { stop = 0 } = {}) {
  fillOnly(rect(X0, -2000, X1 - X0, 6000), '#101848', { boil: 0 });
  for (let i = 0; i < 70; i++) { const x = hash(i) * 1400 - 160, y = hash(i + 50) * 2100 - 90, r = 2 + hash(i + 7) * 3;
    const tw = .6 + .4 * Math.sin(t * 3 + i); dot(x, y, r * tw, '#fff6d8'); }
}
// the Earth: spin is the rotation angle; Moscow and the equator marked
export function earth(cx, cy, R, spin, { markers = 0 } = {}) {
  push(); translate(cx, cy);
  shape(ell(0, 0, R, R, 64), { fill: '#ff9c3a', lw: 8, shade: () => {
    // continents as flat blobs that slide with the spin (orthographic-ish wrap)
    for (let k = 0; k < 7; k++) { const lon = (hash(k * 3.1) * TAU + spin) % TAU, lat = (hash(k * 7.7) - .5) * 1.8;
      const x = Math.sin(lon) * Math.cos(lat) * R, y = Math.sin(lat) * R * .9, vis = Math.cos(lon);
      if (vis > -.2) fillOnly(ell(x, y, R * (.18 + hash(k) * .16) * Math.max(.25, vis), R * (.12 + hash(k + 2) * .1), 20), '#3fb6a8', { boil: .4 }); }
    fillOnly(ell(R * .45, R * .1, R * .9, R * 1.1, 40), 'rgba(160,60,20,.28)', { boil: .2 });
    fillOnly(ell(-R * .42, -R * .5, R * .22, R * .12, 16), 'rgba(255,255,255,.55)', { boil: .2 }); } });
  stroke(arc(0, 0, R, R * .16, 0, Math.PI, 30), 5, { line: '#ffffff' });                   // the equator
  pop();
}
export function arrow(x0, y0, x1, y1, col = '#ffffff', lw = 12) {
  stroke([[x0, y0], [x1, y1]], lw + 10); stroke([[x0, y0], [x1, y1]], lw, { line: col });
  const a = Math.atan2(y1 - y0, x1 - x0), h = 38;
  shape([[x1 + Math.cos(a) * 14, y1 + Math.sin(a) * 14], [x1 - Math.cos(a - .5) * h, y1 - Math.sin(a - .5) * h], [x1 - Math.cos(a + .5) * h, y1 - Math.sin(a + .5) * h]], { fill: col, lw: 6 });
}
export function plane(x, y, s = 1) {
  push(); translate(x, y); scale(s);
  shape(spline([[-120, 0], [-90, -18], [100, -18], [140, -4], [100, 12], [-90, 12]]), { fill: '#f1eee8', lw: 6 });
  shape([[-10, -6], [40, -6], [-30, 60], [-60, 60]], { fill: '#d6d2ca', lw: 6 }); shape([[-96, -14], [-74, -14], [-104, -56], [-122, -56]], { fill: '#d6d2ca', lw: 6 });
  for (let i = 0; i < 6; i++) dot(-50 + i * 24, -4, 4, '#5a6ea8');
  pop();
}

// ———————————— Street: peach sky bands, teal houses, asphalt ————————————
export function street(t, { scroll = 0, rip = 0 } = {}) {
  bands(['#ffb38a', '#ffc49c', '#ffd5b0', '#ffe3c6'], -800, FLOOR - 200);
  for (let i = 0; i < 9; i++) { const w = 230 + hash(i) * 120, h = 420 + hash(i + 3) * 380, x = -500 + i * 300 - (scroll % 300);
    const tear = rip ? Math.max(0, rip - hash(i + 9) * .6) : 0;
    push(); translate(x + w / 2, FLOOR - 200); rotate(-tear * .5); translate(tear * 900, -tear * 300);
    shape(rect(-w / 2, -h, w, h), { fill: i % 2 ? '#2a9d93' : '#35b3a6', lw: 7, shade: () => fillOnly(rect(w * .2, -h - 10, w * .4, h + 20), '#1f7d75', { boil: .3 }) });
    for (let r = 0; r < Math.floor(h / 110); r++) for (let c = 0; c < 2; c++) shape(rect(-w / 2 + 30 + c * (w / 2 - 10), -h + 40 + r * 110, 60, 70), { fill: '#ffe9a6', lw: 5 });
    pop(); }
  fillOnly(rect(X0, FLOOR - 200, X1 - X0, 900), '#5b5d6b', { boil: 0 });
  stroke([[X0, FLOOR - 200], [X1, FLOOR - 200]], 7);
  for (let x = -600; x < 1800; x += 220) { const xx = x - (scroll * 1.6) % 220; stroke([[xx, FLOOR + 100], [xx + 120, FLOOR + 100]], 12, { line: '#f4f1ea', boil: .3 }); }
}
// flying junk: a car, a cow, a coffee cup
export function car(x, y, a = 0, s = 1, col = '#e8392b') {
  push(); translate(x, y); rotate(a); scale(s);
  shape(spline([[-130, 0], [-120, -50], [-60, -60], [-30, -100], [60, -100], [90, -60], [130, -50], [135, 0]]), { fill: col, lw: 7, shade: () => fillOnly(rect(40, -110, 110, 120), 'rgba(0,0,0,.18)', { boil: .3 }) });
  shape([[-20, -92], [52, -92], [74, -60], [-40, -60]], { fill: '#bfe9ff', lw: 5 });
  for (const wx of [-80, 80]) shape(ell(wx, 0, 30, 30, 20), { fill: '#2b2b33', lw: 6, shade: () => fillOnly(ell(wx, 0, 12, 12, 12), '#b5b8c2', { boil: 0 }) });
  pop();
}
export function cow(x, y, a = 0, s = 1, t = 0) {
  push(); translate(x, y); rotate(a); scale(s);
  for (const lx of [-70, -40, 40, 70]) shape(noodle([lx, 10], [lx + Math.sin(t * 14 + lx) * 14, 80], 0, 22, 18), { fill: '#f6f1e6', lw: 6 });
  shape(ell(0, 0, 110, 60, 30), { fill: '#f6f1e6', lw: 7, shade: () => { fillOnly(ell(-40, -10, 34, 26, 16), INK, { boil: .3 }); fillOnly(ell(50, 20, 26, 20, 14), INK, { boil: .3 }); } });
  shape(ell(118, -40, 44, 40, 24), { fill: '#f6f1e6', lw: 6 }); shape(ell(140, -24, 26, 18, 16), { fill: '#ffb4b4', lw: 5 });
  eye(110, -52, 14, 18, { look: [-.6, -.4], pupil: 3.5, lw: 5 }); stroke([[96, -78], [84, -100]], 6); stroke([[128, -80], [138, -102]], 6);
  pop();
}

// ———————————— Storm: slate violet, yellow lightning ————————————
export function storm(t) {
  bands(['#3b3456', '#463e66', '#524a75', '#5d5582'], -800, FLOOR - 200);
  for (let i = 0; i < 3; i++) { const on = (Math.floor(t * 6) + i * 2) % 7 === 0; if (!on) continue; const x = 150 + i * 360;
    shape([[x, -100], [x + 40, 200], [x - 10, 210], [x + 50, 520], [x - 40, 260], [x + 6, 250], [x - 30, -100]], { fill: '#ffe066', lw: 6 }); }
  for (let i = 0; i < 18; i++) { const y = hash(i) * 1700, sp = 2600 + hash(i + 3) * 1600, x = ((t * sp + hash(i + 8) * 2400) % 2600) - 800;
    stroke([[x, y], [x + 220 + hash(i) * 200, y - 30]], 6, { line: '#d9d3f0', boil: .5 }); }
  fillOnly(rect(X0, FLOOR - 200, X1 - X0, 900), '#2a2540', { boil: 0 }); stroke([[X0, FLOOR - 200], [X1, FLOOR - 200]], 7);
}
export function paperHouse(x, y, a, s = 1) {   // a house torn off like paper
  push(); translate(x, y); rotate(a); scale(s);
  shape([[-110, 0], [-110, -170], [0, -260], [110, -170], [110, 0]], { fill: '#f1e3c6', lw: 7, shade: () => fillOnly([[30, -240], [130, -160], [130, 10], [30, 10]], '#d6c4a2', { boil: .3 }) });
  shape(rect(-30, -100, 60, 100), { fill: '#8a5a3a', lw: 5 }); shape(rect(-90, -150, 50, 44), { fill: '#bfe9ff', lw: 5 });
  pop();
}
export function pole(x, y, h = 700) { shape(rect(x - 16, y - h, 32, h), { fill: '#7b7f8c', lw: 7 }); stroke([[x - 80, y - h + 40], [x + 80, y - h + 40]], 10); }

// ———————————— Ocean on the continent: deep blue, coral ————————————
export function ocean(t, { rise = 0 } = {}) {
  bands(['#ff8a73', '#ff9f86', '#ffb59c', '#ffcab4'], -800, 800);
  for (let i = 0; i < 6; i++) { const x = -200 + i * 240, h = 360 + hash(i) * 400; shape(rect(x, 1100 - h, 180, h + 400), { fill: '#e7765f', lw: 7 });
    for (let r = 0; r < 4; r++) shape(rect(x + 30, 1100 - h + 40 + r * 100, 50, 60), { fill: '#ffe2c4', lw: 5 }); }
  const lvl = lerp(1500, 760, rise), P = [[X0, 2600], [X0, lvl]];
  for (let x = X0; x <= X1; x += 60) P.push([x, lvl + Math.sin(x / 90 + t * 4) * 24 + Math.sin(x / 31 + t * 7) * 8]);
  P.push([X1, lvl], [X1, 2600]);
  shape(P, { fill: '#1d4fa8', lw: 8, shade: () => { for (let k = 0; k < 6; k++) stroke(arc(-200 + k * 260 + (t * 120) % 260, lvl + 120 + k % 2 * 120, 60, 16, Math.PI * 1.1, Math.PI * 1.9, 10), 6, { line: '#6f9be8' }); } });
}
export function bigWave(x, y, t, s = 1) {
  push(); translate(x, y); scale(s);
  shape(spline([[-600, 400], [-560, 0], [-300, -420], [0, -560], [260, -460], [340, -300], [240, -260], [140, -340], [60, -260], [80, 400]]), { fill: '#1d4fa8', lw: 8, shade: () => {
    fillOnly(spline([[-200, -480], [0, -560], [260, -460], [300, -340], [200, -360], [60, -440]]), '#f1f6ff', { boil: .4 }); } });
  for (let i = 0; i < 6; i++) dot(260 + Math.sin(t * 6 + i) * 40, -420 + i * 30, 10, '#f1f6ff');
  pop();
}

// ———————————— Beige yard: suspiciously normal ————————————
export function beige(t, { sunX = 200, sunY = 820 } = {}) {
  bands(['#efe0c2', '#f1e3c6', '#f3e7cf', '#f6ecd8'], -800, FLOOR - 150);
  shape(ell(sunX, sunY, 110, 110, 40), { fill: '#f6c44e', lw: 7 });
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + t * .2; stroke([[sunX + Math.cos(a) * 140, sunY + Math.sin(a) * 140], [sunX + Math.cos(a) * 190, sunY + Math.sin(a) * 190]], 7); }
  fillOnly(rect(X0, FLOOR - 150, X1 - X0, 900), '#c9b48c', { boil: 0 }); stroke([[X0, FLOOR - 150], [X1, FLOOR - 150]], 7);
  for (let i = 0; i < 3; i++) { const x = 560 + i * 200; shape(rect(x, FLOOR - 470, 160, 320), { fill: '#d9c39c', lw: 6 }); shape([[x - 20, FLOOR - 470], [x + 80, FLOOR - 560], [x + 180, FLOOR - 470]], { fill: '#a98a62', lw: 6 }); }
  // the sign post
  shape(rect(300, 1000, 24, 200), { fill: '#8a6a48', lw: 6 }); shape([[180, 960], [420, 960], [450, 1000], [420, 1040], [180, 1040]], { fill: '#f6ecd8', lw: 6 });
  text('ВОСТОК', 300, 1001, { font: '900 40px Nunito', fill: INK });
}

// ———————————— the swirl wipe: the button's glow spinning over the frame ————————————
export function swirl(cx, cy, R, t) {
  push(); translate(cx, cy);
  shape(ell(0, 0, R, R, 64), { fill: PAL.glow, lw: 8, shade: () => {
    const arms = 6;
    for (let k = 0; k < arms; k++) { const a1 = [], a2 = [];
      for (let j = 0; j <= 24; j++) { const u = j / 24, r = R * (1 - u), a = k / arms * TAU + u * 4 + t * 7; a1.push([Math.cos(a) * r, Math.sin(a) * r]); const b = a + .5 * (1 - u * .7); a2.push([Math.cos(b) * r, Math.sin(b) * r]); }
      fillOnly([...a1, ...a2.reverse()], k % 2 ? PAL.glowL : '#8a2fe0', { boil: .4 }); }
    fillOnly(ell(0, 0, R * .18, R * .18, 24), PAL.glowCore, { boil: .4 }); } });
  pop();
}
