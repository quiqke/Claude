// «Ловушка» · carved figures, built from body parts (each its own carved shape, so the knife halo separates them).
// Profile view facing +x (dir -1 flips), feet on the ground at (x, y), height ≈ 600·s plate units. No stick figures:
// tapered limbs with knees/elbows, torso, fur cloak or shirt, hair, beard, hands, feet, props in the hand.
import * as WC from './engine/index.js';

const cache = new Map();
export const LIGHT = WC.light(.7, -.55, .3);
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const along = (p, L, a) => [p[0] + Math.sin(a) * L, p[1] + Math.cos(a) * L];   // a: 0 = straight down, + = forward (+x)
const upv = (p, L, a) => [p[0] + Math.sin(a) * L, p[1] - Math.cos(a) * L];     // a: 0 = straight up, + = leaning forward (+x)

// tapered capsule p0→p1 with end widths w0, w1
export function cap(p0, p1, w0, w1, n = 7) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, out = [];
  const a1 = Math.atan2(ny, nx);
  for (let i = 0; i <= n; i++) { const a = a1 - Math.PI * i / n; out.push([p1[0] + Math.cos(a) * w1 / 2, p1[1] + Math.sin(a) * w1 / 2]); }
  for (let i = 0; i <= n; i++) { const a = a1 + Math.PI - Math.PI * i / n; out.push([p0[0] + Math.cos(a) * w0 / 2, p0[1] + Math.sin(a) * w0 / 2]); }
  return out;
}
const jag = (pts, amp, seed) => { let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; return pts.map(([x, y], i) => i % 2 ? [x + (r() - .5) * amp, y + r() * amp] : [x, y]); };

// pose → joints (local, s = 1, facing +x, before grounding)
function joints(p) {
  const hip = [0, p.sit ? -95 : -300], lean = p.lean ?? 0;
  const sh = upv(hip, 215, lean), neck = upv(sh, 34, lean * .8 + (p.head ?? 0) * .3);
  const head = upv(neck, 40, lean * .6 + (p.head ?? 0));
  const A = p.arms ?? [[.25, .1], [-.15, -.3]], L = p.legs ?? (p.sit ? [[1.45, .15], [1.35, .05]] : [[.12, 0], [-.1, -.05]]);
  const arm = (o, a) => { const e = along(o, 118, a[0]); return [o, e, along(e, 108, a[1])]; };
  const leg = (o, a) => { const k = along(o, 150, a[0]); return [o, k, along(k, 148, a[1])]; };
  return { hip, sh, neck, head, farArm: arm(add(sh, [-6, 4]), A[0]), nearArm: arm(add(sh, [6, 0]), A[1]), farLeg: leg(add(hip, [-8, 0]), L[0]), nearLeg: leg(add(hip, [8, 0]), L[1]) };
}

// figure: returns { draw(g, t) } drawing parts in order. spec: { x, y, s, dir, pose:{...}, kind:'hunter'|'worker'|'farmer'|'plain', prop, solid, reveal:{t0,t1}, rot }
export function figure(key, spec) {
  if (cache.has(key)) return cache.get(key);
  const s = spec.s ?? 1, dir = spec.dir ?? 1, p = spec.pose || {}, J = joints(p), kind = spec.kind || 'plain';
  let pts = [];
  const X = q => { let [x, y] = q; if (spec.rot) [x, y] = rot([x, y], spec.rot); return [spec.x + x * s * dir, spec.y + y * s]; };
  // ground: lowest foot at 0
  const low = Math.max(J.farLeg[2][1], J.nearLeg[2][1], p.sit ? 0 : -1e9) + 12;
  const G = q => X([q[0], q[1] - low]);
  const parts = [];
  const P = (name, poly, o = {}) => parts.push({ name, poly: poly.map(G), o });
  const limb = (name, [a, b, c2], w0, w1, w2) => { P(name + 'U', cap(a, b, w0, w1)); P(name + 'L', cap(b, c2, w1 * .95, w2)); };
  const foot = (name, ank) => P(name, [[ank[0] - 14, ank[1] - 8], [ank[0] + 34, ank[1] - 4], [ank[0] + 40, ank[1] + 10], [ank[0] - 16, ank[1] + 12]]);
  const hand = (name, w) => P(name, WC.ellipse(w[0] + 4, w[1] + 4, 15, 13, 14));
  // far side
  limb('farArm', J.farArm, 34, 27, 22); hand('farHand', J.farArm[2]);
  limb('farLeg', J.farLeg, 54, 38, 26); foot('farFoot', J.farLeg[2]);
  // torso + clothing
  P('torso', cap(J.hip, J.sh, 84, 100));
  if (kind === 'hunter') {
    const a = [J.sh[0] - 62, J.sh[1] - 6], b = [J.sh[0] + 52, J.sh[1] - 2], hemY = J.hip[1] + (p.sit ? 20 : 95);
    P('cloak', jag([a, [J.sh[0] - 10, J.sh[1] - 26], b, [J.hip[0] + 64, J.hip[1] - 20], [J.hip[0] + 58, hemY], [J.hip[0] + 30, hemY + 16], [J.hip[0] + 8, hemY], [J.hip[0] - 20, hemY + 18], [J.hip[0] - 46, hemY], [J.hip[0] - 66, hemY + 10], [J.hip[0] - 64, J.hip[1] - 40]], 14, key.length * 7));
  } else if (kind === 'farmer') {
    P('tunic', [[J.sh[0] - 54, J.sh[1] - 4], [J.sh[0] + 50, J.sh[1]], [J.hip[0] + 58, J.hip[1] + 70], [J.hip[0] - 58, J.hip[1] + 76]]);
  } else if (kind === 'worker') {
    P('shirt', cap(J.hip, J.sh, 96, 112));
  }
  limb('nearLeg', J.nearLeg, 56, 40, 27); foot('nearFoot', J.nearLeg[2]);
  // head, hair, beard
  P('neck', cap(J.neck, J.head, 30, 30));
  P('head', WC.ellipse(J.head[0] + 4, J.head[1], 37, 43, 20, p.head ?? 0));
  const hx = J.head[0], hy = J.head[1];
  if (kind === 'hunter') {
    const h = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (.85 + 1.2 * i / 12), r = i % 2 ? 46 : 64; h.push([hx - 4 + Math.cos(a) * r, hy - 4 + Math.sin(a) * r]); }
    h.push([hx + 10, hy - 22], [hx - 20, hy + 18], [hx - 44, hy + 42]); P('hair', h);
    P('beard', [[hx + 12, hy + 22], [hx + 44, hy + 20], [hx + 40, hy + 58], [hx + 22, hy + 82], [hx + 4, hy + 60]]);
  } else if (kind === 'farmer') {
    P('hat', [[hx - 58, hy - 22], [hx + 66, hy - 22], [hx + 34, hy - 40], [hx + 10, hy - 70], [hx - 18, hy - 42]]);
  } else if (kind === 'worker') {
    P('hair', [[hx - 38, hy - 4], [hx - 30, hy - 40], [hx + 8, hy - 50], [hx + 36, hy - 34], [hx + 30, hy - 22], [hx - 10, hy - 30], [hx - 26, hy + 6]]);
  }
  // near arm + prop in the near hand
  limb('nearArm', J.nearArm, 36, 29, 23); hand('nearHand', J.nearArm[2]);
  const w = J.nearArm[2];
  if (spec.prop === 'spear') { P('spear', cap([w[0] + 4, w[1] + 260], [w[0] + 4, w[1] - 420], 11, 9)); P('tip', [[w[0] - 12, w[1] - 412], [w[0] + 4, w[1] - 500], [w[0] + 20, w[1] - 412]]); }
  if (spec.prop === 'hoe') { const e = along(w, 260, .5); P('hoe', cap([w[0] - 60, w[1] - 110], e, 12, 10)); P('blade', [[e[0] - 6, e[1] - 6], [e[0] + 46, e[1] + 4], [e[0] + 40, e[1] + 22], [e[0] - 10, e[1] + 10]]); }
  if (spec.prop === 'flute') P('flute', cap([hx + 30, hy + 24], [w[0] + 40, w[1] + 8], 10, 10));
  // carve: each part a shape with halo; small or 'solid' figures skip hatching
  const solid = spec.solid || s < .42;
  const shapes = parts.map((q, i) => WC.shape([q.poly], { light: spec.light || LIGHT, sp: Math.max(4, 7 * s), halo: Math.max(2.5, 5 * s), haloW: 3, R: 30 * s, amb: 0, k: 1.1,
    lo: solid ? 9 : .42, hi: .95, dir: 'contour', a0: Math.PI / 2, depth: 24 * s, seg: [18 * s + 8, 60 * s + 20], gap: [2, 6], seed: i * 17 + key.length, res: solid ? 3 : 1.5,
    reveal: spec.reveal ? { t0: spec.reveal.t0 + (spec.reveal.t1 - spec.reveal.t0) * .6 * i / parts.length, t1: spec.reveal.t1, key: spec.reveal.key || (() => 0), jit: .9, speed: 2600 } : undefined }));
  const F = { parts, shapes, draw(g, t = 1e9) { for (const S of shapes) S.draw(g, t); }, joints: J, toPlate: G };
  cache.set(key, F);
  return F;
}
