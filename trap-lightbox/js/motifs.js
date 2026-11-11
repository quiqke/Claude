// Paper motifs for «Ловушка»: silhouettes, cave, fire, city, grain, skeletons, strips. Metres, y up, canvas from paper.js paint().
import * as THREE from 'three';
import { sheet, text } from './paper.js';
import { mulberry, TAU, lerp } from './lib.js';

export const PAPER = '#9a9a9a', BASE = new THREE.Color(PAPER).r;
export const tint = (m, hex, k = 1) => { m.material.color.set(hex).multiplyScalar(k / BASE); return m; };
export const cut = (x, fn) => { x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.strokeStyle = '#000'; fn(); x.restore(); };
const dirv = a => [Math.sin(a), -Math.cos(a)];          // angle 0 = straight down (y up), + toward +x

// ── a jointed silhouette as thick strokes (Reiniger-like). feet at (px, py), height h.
// o: arms [[a1,a2],[a1,a2]], legs [[a1,a2],[a1,a2]], bend (spine forward), rot (whole figure), sit (hips at ground), hair, spear, hoe, flute, phone
export function person(x, px, py, h, o = {}) {
  x.save(); x.translate(px, py); if (o.rot) x.rotate(o.rot); if (o.flip) x.scale(-1, 1);
  const w = h * (o.w ?? .085), r = h * .1, b = o.bend ?? 0;
  const hipY = o.sit ? h * .16 : h * .5;
  const hip = [0, hipY], sh = [b * h * .26, hipY + h * .3 * (1 - b * .25)], hd = [sh[0] + b * h * .12 + h * .02, sh[1] + h * .13];
  x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = w;
  const pl = pts => { x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.stroke(); };
  const limb = (p, l1, a1, l2, a2) => { const [dx, dy] = dirv(a1), m = [p[0] + dx * l1, p[1] + dy * l1], [ex, ey] = dirv(a2); const e = [m[0] + ex * l2, m[1] + ey * l2]; pl([p, m, e]); return e; };
  // torso: a tapered wedge (shoulders wider) + hips
  x.beginPath(); x.moveTo(hip[0] - w * .55, hip[1]); x.lineTo(sh[0] - w * .85, sh[1]); x.lineTo(sh[0] + w * .85, sh[1]); x.lineTo(hip[0] + w * .55, hip[1]); x.closePath(); x.fill();
  pl([hip, sh]);
  x.beginPath(); x.arc(hd[0], hd[1], r, 0, TAU); x.fill();
  if (o.hair) { x.beginPath(); for (let k = -3; k <= 3; k++) { const a = Math.PI / 2 + k * .32, q = [hd[0] + Math.cos(a) * r * 1.45, hd[1] + Math.sin(a) * r * 1.4]; x.moveTo(hd[0] + Math.cos(a) * r * .7, hd[1] + Math.sin(a) * r * .7); x.lineTo(...q); } x.lineWidth = w * .45; x.stroke(); x.lineWidth = w; }
  const A = o.arms ?? [[-.25, -.1], [.25, .1]], L = o.legs ?? [[-.18, -.08], [.18, .08]];
  const hands = A.map(([a1, a2]) => limb(sh, h * .17, a1, h * .16, a2));
  const ll = o.sit ? [h * .2, h * .18] : [h * .25, h * .25];
  L.forEach(([a1, a2]) => limb(hip, ll[0], a1, ll[1], a2));
  x.lineWidth = w * .35;
  if (o.spear) { const [sx, sy] = hands[1]; pl([[sx, -h * .05], [sx, h * 1.15]]); x.beginPath(); x.moveTo(sx - w * .5, h * 1.13); x.lineTo(sx, h * 1.3); x.lineTo(sx + w * .5, h * 1.13); x.fill(); }
  if (o.hoe) { const [sx, sy] = hands[1]; pl([[sx - h * .1, sy + h * .15], [sx + h * .18, sy - h * .3]]); x.lineWidth = w * .6; pl([[sx + h * .18, sy - h * .3], [sx + h * .3, sy - h * .26]]); }
  if (o.flute) { const [sx, sy] = hands[1]; pl([[hd[0] + r * .6, hd[1] - r * .4], [sx + h * .2, sy - h * .06]]); }
  x.restore();
  return { head: hd, hands };
}
// fire: paper flames (draw) and the hot core (glow)
export function flames(x, cx, cy, s, glow = false) {
  const R = mulberry(9), tongue = (dx, hh, ww) => { x.beginPath(); x.moveTo(cx + dx - ww, cy); x.quadraticCurveTo(cx + dx - ww * .9, cy + hh * .55, cx + dx + ww * .15, cy + hh); x.quadraticCurveTo(cx + dx + ww * .5, cy + hh * .45, cx + dx + ww, cy); x.closePath(); x.fill(); };
  if (glow) { tongue(0, s * 1.0, s * .42); tongue(-s * .25, s * .7, s * .28); tongue(s * .26, s * .62, s * .26); return; }
  tongue(0, s * 1.2, s * .5); tongue(-s * .32, s * .85, s * .34); tongue(s * .34, s * .78, s * .32);
  x.lineWidth = s * .14; x.lineCap = 'round';                                     // logs
  for (const [a, b] of [[-.55, .1], [.55, .1]]) { x.beginPath(); x.moveTo(cx - s * .62, cy - s * .12 * (a < 0 ? 1 : -1) - s * .04); x.lineTo(cx + s * .62, cy + s * .12 * (a < 0 ? 1 : -1) - s * .04); x.stroke(); }
}
// rock band with a ragged top/bottom edge
export function rock(x, x0, x1, yTop, yBot, seed = 1, rough = .006) {
  const R = mulberry(seed); x.beginPath(); x.moveTo(x0, yBot);
  for (let u = x0; u <= x1 + 1e-4; u += .004) x.lineTo(u, yTop + (R() - .5) * rough + .004 * Math.sin(u * 40 + seed));
  x.lineTo(x1, yBot); x.closePath(); x.fill();
}
// city block: buildings with window grids. lit(i) → whether window i glows. glow=true draws only lit windows (for glowDraw)
export function city(x, x0, x1, base, o = {}) {
  const R = mulberry(o.seed || 4), out = []; let u = x0, k = 0;
  while (u < x1) {
    const bw = (o.bw ?? .03) * (.7 + R() * .7), bh = (o.bh ?? .08) * (.5 + R() * .9);
    if (!o.glow) x.fillRect(u, base - .2, bw, bh + .2);
    const cols = Math.max(2, Math.floor(bw / .0075)), rows = Math.max(3, Math.floor(bh / .0085));
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const wx = u + bw * (c + .5) / cols - .0015, wy = base + bh - (r + 1) * bh / (rows + .4), on = o.lit ? o.lit(k, R()) : R() < .5; k++;
      if (o.glow) { if (on) x.fillRect(wx, wy, .003, .0045); }
      else if (o.holes !== false) cut(x, () => x.fillRect(wx, wy, .003, .0045));
    }
    u += bw + .002 + R() * .004;
  }
}
// a wheat grain ear (paper or glow)
export function grain(x, cx, cy, s) {
  x.lineCap = 'round'; x.lineWidth = s * .07; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + s * .05, cy + s * .5, cx + s * .02, cy + s * .9); x.stroke();
  for (let k = 0; k < 5; k++) { const yy = cy + s * (.45 + k * .12); for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(cx + sd * s * .09 + s * .02, yy + s * .04, s * .07, s * .12, sd * -.5, 0, TAU); x.fill(); } }
  x.beginPath(); x.ellipse(cx + s * .03, cy + s * 1.02, s * .06, s * .1, 0, 0, TAU); x.fill();
}
// skeleton outline cut as holes (call inside cut()), standing, feet at (cx, cy), height h, bend 0..1
export function bones(x, cx, cy, h, b = 0) {
  const lw = h * .028; x.lineWidth = lw; x.lineCap = 'round';
  const pl = pts => { x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.stroke(); };
  const hip = [cx, cy + h * .48], nk = [cx + b * h * .22, cy + h * .82], md = [lerp(hip[0], nk[0], .5) + b * h * .1, lerp(hip[1], nk[1], .5)], sk = [nk[0] + b * h * .12, nk[1] + h * .09];
  x.beginPath(); x.arc(sk[0], sk[1], h * .075, 0, TAU); x.fill();                                    // skull
  x.beginPath(); x.moveTo(sk[0] - h * .045, sk[1] - h * .06); x.lineTo(sk[0] + h * .045, sk[1] - h * .06); x.lineTo(sk[0] + h * .03, sk[1] - h * .1); x.lineTo(sk[0] - h * .03, sk[1] - h * .1); x.closePath(); x.fill();   // jaw
  pl([hip, md, nk]);
  for (let k = 0; k < 4; k++) { const u = .5 + k * .11, p = [lerp(hip[0], nk[0], u) + b * h * .08, lerp(hip[1], nk[1], u)], rw = h * (.11 - k * .01); x.lineWidth = lw * .7; x.beginPath(); x.moveTo(p[0] - rw, p[1] - rw * .4); x.quadraticCurveTo(p[0], p[1] + rw * .25, p[0] + rw, p[1] - rw * .4); x.stroke(); }
  x.lineWidth = lw; x.beginPath(); x.ellipse(hip[0], hip[1], h * .085, h * .04, 0, 0, TAU); x.fill();
  const sh = [lerp(hip[0], nk[0], .95), lerp(hip[1], nk[1], .95)];
  const limb = (p, l1, a1, l2, a2) => { const [dx, dy] = dirv(a1), m = [p[0] + dx * l1, p[1] + dy * l1], [ex, ey] = dirv(a2); pl([p, m, [m[0] + ex * l2, m[1] + ey * l2]]); x.beginPath(); x.arc(m[0], m[1], lw * .9, 0, TAU); x.fill(); };
  limb([sh[0] - h * .1, sh[1]], h * .17, -.15 + b * .6, h * .16, -.05 + b * 1.1); limb([sh[0] + h * .1, sh[1]], h * .17, .15 + b * .6, h * .16, .05 + b * 1.1);
  limb([hip[0] - h * .05, hip[1]], h * .24, -.04 - b * .2, h * .23, .02 + b * .3); limb([hip[0] + h * .05, hip[1]], h * .24, .04 - b * .2, h * .23, .06 + b * .3);
  return { skull: sk, spine: [hip, md, nk] };
}

// paper text strip that grows from its left edge: { mesh, set(k) }
export function strip(U, s, o) {
  const w = o.w, h = o.h;
  const m = sheet({ U, w, h, z: o.z, x: o.x, y: o.y, ax: -w / 2, trans: o.trans ?? .35, shadow: true, recv: false,
    draw: x => { x.fillStyle = '#9a9a9a'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, h * .12); x.fill();
      cut(x, () => text(x, s, 0, -h * .04, o.size ?? h * .62, 'Cormorant', { weight: 700 })); } });
  tint(m, o.col || '#d8b88a');
  const map = m.material.map;
  return { mesh: m, set(k) { k = Math.max(.0001, Math.min(1, k)); m.scale.x = k; map.repeat.x = k; m.visible = k > .001; } };
}
