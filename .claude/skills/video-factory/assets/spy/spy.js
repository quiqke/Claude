// spy.js — 60s spy title-sequence look in canvas 2D: hand-cut paper pieces (static scissor edges, cached), cut gaps,
// small paper shadows, one paper texture over everything, condensed type as set pieces, a silhouette hero with an accent.
export const W = 1080, H = 1920;
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const rnd = hash;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export let g = null, GROUND = '#efe4c9';
export function setCtx(ctx) { g = ctx; }
export function ground(col) { GROUND = col; g.fillStyle = col; g.fillRect(0, 0, W, H); }
// scissor cut: resample every ~9 px, push along the normal by smooth noise; same seed → same edge (cut once)
function cut(pts, seed = 1, amp = 1.8) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n], L = Math.hypot(x1 - x0, y1 - y0), k = Math.max(1, Math.round(L / 9)); for (let j = 0; j < k; j++) out.push([x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k]); }
  const m = out.length;
  return out.map(([x, y], i) => { const a = out[(i - 1 + m) % m], b = out[(i + 1) % m], nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1;
    const d = (Math.sin(i * .37 + seed * 1.3) * .6 + Math.sin(i * 1.1 + seed * 2.7) * .4) * amp + (hash(i, seed) < .03 ? -1.5 : 0); return [x + nx / l * d, y + ny / l * d]; });
}
function path(pts) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }
// a paper piece: shadow, cut gap in the ground colour, flat ink
export function piece(pts, col, o = {}) {
  const p = cut(pts, o.seed ?? (pts.length * 13 + Math.round(pts[0][0] * .7 + pts[0][1] * 1.3)), o.amp ?? 1.8);
  if (o.shadow !== false) { g.save(); g.shadowColor = 'rgba(0,0,0,.32)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 5; path(p); g.fillStyle = col; g.fill(); g.restore(); }
  if (o.gap !== false) { path(p); g.lineWidth = 5; g.strokeStyle = o.gapCol || GROUND; g.stroke(); }
  path(p); g.fillStyle = col; g.fill();
}
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const ell = (cx, cy, rx, ry, n = 36, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n }, (_, i) => [cx + Math.cos(a0 + (a1 - a0) * i / n) * rx, cy + Math.sin(a0 + (a1 - a0) * i / n) * ry]);
export const poly = (...p) => p;
export const rot = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
export function capsule(x0, y0, x1, y1, w) { const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2, c0 = ell(x0, y0, w / 2, w / 2, 10, a + Math.PI / 2, a + Math.PI * 1.5), c1 = ell(x1, y1, w / 2, w / 2, 10, a - Math.PI / 2, a + Math.PI / 2); return [...c0, ...c1]; }
// paper texture over the whole frame (built once)
let TEX = null;
export function paper(a = .5) {
  if (!TEX) { TEX = document.createElement('canvas'); TEX.width = 540; TEX.height = 960; const t = TEX.getContext('2d'), im = t.createImageData(540, 960);
    for (let y = 0; y < 960; y++) for (let x = 0; x < 540; x++) { const i = (y * 540 + x) * 4, v = 200 + (Math.sin(x * .05 + Math.sin(y * .02) * 3) * 8 + Math.sin(y * .03) * 6) + (hash(x, y) - .5) * 26 + (hash(x >> 3, y >> 3, 7) < .02 ? -40 : 0);
      im.data[i] = im.data[i + 1] = im.data[i + 2] = Math.max(0, Math.min(255, v)); im.data[i + 3] = 255; } t.putImageData(im, 0, 0); }
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.drawImage(TEX, 0, 0, W, H); g.restore();
}
// condensed type as cut paper, each letter jittered (static), optional landing slide (p 0..1)
export function type(s, x, y, size, col, o = {}) {
  g.save(); g.font = `700 ${size}px OswaldC, OswaldL, Rubik`; g.textBaseline = 'alphabetic';
  let tw = 0; const ws = [...s].map(ch => { const w = g.measureText(ch).width; tw += w + (o.track ?? 0); return w; });
  let cx = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
  [...s].forEach((ch, i) => {
    const land = o.land == null ? 1 : clamp(o.land * [...s].length - i), off = (1 - (1 - land) ** 3) ;
    if (land <= 0) { cx += ws[i] + (o.track ?? 0); return; }
    const r = (hash(i, s.length, 3) - .5) * .028, by = (hash(i, s.length, 5) - .5) * 3;
    g.save(); g.translate(cx + ws[i] / 2, y + by - (1 - off) * (o.drop ?? 160)); g.rotate(r + (o.rot || 0));
    if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 7; g.shadowOffsetX = 4; g.shadowOffsetY = 5; }
    g.lineJoin = 'round'; g.lineWidth = Math.max(4, size * .04); g.strokeStyle = o.gapCol || GROUND; g.strokeText(ch, -ws[i] / 2, 0); g.shadowColor = 'transparent';
    g.fillStyle = col; g.fillText(ch, -ws[i] / 2, 0); g.restore();
    cx += ws[i] + (o.track ?? 0);
  });
  g.restore(); return tw;
}
export function fitSize(s, size, maxW) { g.save(); let fs = size; g.font = `700 ${fs}px OswaldC, OswaldL`; while (g.measureText(s).width > maxW && fs > 20) { fs -= 4; g.font = `700 ${fs}px OswaldC, OswaldL`; } g.restore(); return fs; }

// ── the hero: a tall stick-silhouette (7 heads), merged into one outline; red scarf + mustard bracelet
export const INK = '#1b1714';
// pose: angles in radians from straight down for limbs; {lean, armL:[sh,el], armR:[sh,el], legL:[hip,knee], legR, head:[dx,dy]}
const POSES = {
  stand: { lean: 0, armL: [.15, .1], armR: [-.15, -.1], legL: [.08, 0], legR: [-.08, 0] },
  shiver: { lean: -.05, armL: [.6, 1.9], armR: [-.6, -1.9], legL: [.06, 0], legR: [-.06, 0] },
  panic: { lean: -.1, armL: [2.6, .3], armR: [-2.6, -.3], legL: [.25, -.1], legR: [-.25, .1] },
  run0: { lean: .25, armL: [-.9, -1.2], armR: [1.1, 1.3], legL: [-.7, .9], legR: [.8, .2] },
  run1: { lean: .25, armL: [1.1, 1.3], armR: [-.9, -1.2], legL: [.8, .2], legR: [-.7, .9] },
  gesture: { lean: .05, armL: [1.9, .4], armR: [-1.2, -1.4], legL: [.12, 0], legR: [-.1, 0] },
  shrug: { lean: 0, armL: [1.2, -1.8], armR: [-1.2, 1.8], legL: [.1, 0], legR: [-.1, 0] },
  carry: { lean: .15, armL: [2.9, .5], armR: [-2.9, -.5], legL: [.3, .1], legR: [-.2, .2] },
  cough: { lean: .5, armL: [.9, 1.6], armR: [.4, .6], legL: [.15, .2], legR: [-.15, .1] },
  scratch: { lean: .05, armL: [2.4, 2.4], armR: [-.8, -1.8], legL: [.1, 0], legR: [-.1, 0] },
  sit: { lean: -.05, armL: [.4, .3], armR: [-.4, -.3], legL: [1.5, -1.4], legR: [1.4, -1.5] },
  wave: { lean: 0, armL: [.15, .1], armR: [-2.8, -.4], legL: [.08, 0], legR: [-.08, 0] },
  mask: { lean: .1, armL: [2.2, 2.6], armR: [-2.2, -2.6], legL: [.2, 0], legR: [-.2, .1] },
};
export function hero(x, fy, s = 1, poseName = 'stand', o = {}) {
  const P = typeof poseName === 'string' ? POSES[poseName] : poseName, U = 70 * s;            // U = head height
  const hip = [x, fy - U * 3.3], neck = [x + Math.sin(P.lean) * U * 2.4, hip[1] - Math.cos(P.lean) * U * 2.4], headC = [neck[0] + Math.sin(P.lean) * U * .7 + (o.headDx || 0), neck[1] - U * .65];
  const limb = (o_, a, b, L1, L2) => { const k = [o_[0] + Math.sin(a) * L1, o_[1] + Math.cos(a) * L1], e = [k[0] + Math.sin(a + b) * L2, k[1] + Math.cos(a + b) * L2]; return [k, e]; };
  const w = U * .42, col = o.col || INK, out = [];
  const add = pts => out.push(pts);
  for (const [side, L] of [['legL', P.legL], ['legR', P.legR]]) { const [k, e] = limb(hip, L[0], L[1], U * 1.6, U * 1.6); add(capsule(hip[0], hip[1], k[0], k[1], w * 1.1)); add(capsule(k[0], k[1], e[0], e[1], w)); add(capsule(e[0], e[1], e[0] + U * .45 * (o.facing || 1), e[1], w * .7)); }
  add([[hip[0] - U * .45, hip[1] + U * .2], [hip[0] + U * .45, hip[1] + U * .2], [neck[0] + U * .55, neck[1]], [neck[0] - U * .55, neck[1]]]);
  const hands = [];
  for (const [side, A] of [['armL', P.armL], ['armR', P.armR]]) { const sh = [neck[0] + (side === 'armL' ? -1 : 1) * U * .4, neck[1] + U * .15], [k, e] = limb(sh, -A[0] * (side === 'armL' ? 1 : -1) * (o.facing || 1), -A[1] * (side === 'armL' ? 1 : -1) * (o.facing || 1), U * 1.25, U * 1.2); add(capsule(sh[0], sh[1], k[0], k[1], w * .85)); add(capsule(k[0], k[1], e[0], e[1], w * .75)); add([[e[0], e[1] - w * .4], [e[0] + w * .9, e[1] + w * .2], [e[0], e[1] + w * .5]]); hands.push(e); }
  add(ell(headC[0], headC[1], U * .5, U * .58, 24));
  // one merged silhouette: draw all parts with a shared shadow, then the cut gap outline, then fill
  g.save(); g.shadowColor = 'rgba(0,0,0,.32)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 5; g.fillStyle = col; for (const p of out) { path(cut(p, 7, 1.2)); g.fill(); } g.restore();
  g.lineWidth = 6; g.strokeStyle = o.gapCol || GROUND; for (const p of out) { path(cut(p, 7, 1.2)); g.stroke(); } g.fillStyle = col; for (const p of out) { path(cut(p, 7, 1.2)); g.fill(); }
  // accent scarf (hot colour) streaming back, eye slit for close-ups
  const sc = o.scarf ?? '#d23a22', wind = o.wind ?? .3, f = o.facing || 1;
  piece([[neck[0] - U * .45, neck[1] - U * .05], [neck[0] + U * .45, neck[1] - U * .05], [neck[0] + U * .4, neck[1] + U * .2], [neck[0] - U * .5, neck[1] + U * .2]], sc, { seed: 31, shadow: false });
  piece([[neck[0] - f * U * .3, neck[1]], [neck[0] - f * U * (1.2 + wind), neck[1] + U * (.2 + (1 - wind) * .8)], [neck[0] - f * U * (1.1 + wind), neck[1] + U * (.5 + (1 - wind) * .8)], [neck[0] - f * U * .2, neck[1] + U * .25]], sc, { seed: 32 });
  if (o.eye) piece(ell(headC[0] + f * U * .2, headC[1] - U * .05, U * .16, U * .05, 10), '#efe4c9', { seed: 33, shadow: false, gap: false });
  if (o.bracelet !== false) { const [bx, by] = hands[o.braceletHand ?? 1]; const bc = o.braceletOff ? '#8a8270' : '#e2a52a'; if (!o.braceletOff) { g.save(); g.globalAlpha = .35; g.fillStyle = '#ffd25a'; g.beginPath(); g.arc(bx, by, U * .55, 0, 7); g.fill(); g.restore(); } piece(rect(bx - U * .22, by - U * .4, U * .44, U * .26), bc, { seed: 34 }); }
  return { head: headC, hands, neck, hip, U };
}
// a diagonal "teleport" shatter: slice the current frame into strips that slide off alternately (k 0..1)
export function shatter(k, col = '#e2a52a') {
  if (k <= 0) return; const snap = document.createElement('canvas'); snap.width = W; snap.height = H; snap.getContext('2d').drawImage(g.canvas, 0, 0);
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  const n = 9, a = -.52; for (let i = 0; i < n; i++) { const d = (i % 2 ? 1 : -1) * (k ** 2) * 2200; g.save(); g.translate(W / 2, H / 2); g.rotate(a); const sw = 2600 / n, x0 = -1300 + i * sw; g.beginPath(); g.rect(x0, -1600, sw + 1, 3200); g.clip(); g.translate(0, d); g.rotate(-a); g.translate(-W / 2, -H / 2); g.drawImage(snap, 0, 0); g.restore(); }
}
