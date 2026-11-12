// toon.js — bright 2D cartoon renderer: thick boiling outlines, flat colour, hard-edged shadow shapes, expressive faces.
// Everything is drawn in screen space at 1920×1080 so line weight stays constant at any zoom.
export const INK = '#231629';
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export let BOIL = 0;                                    // boil drawing index (3 drawings at 12 fps)
export function setTime(t) { BOIL = Math.floor(t * 12) % 3; }
// camera: world point (x, y) → screen; zoom changes positions only, line weight stays constant (screen-space strokes)
export const CAM = { x: 960, y: 540, z: 1, sx: 0, sy: 0 };
export function setCam(x = 960, y = 540, z = 1, sx = 0, sy = 0) { CAM.x = x; CAM.y = y; CAM.z = z; CAM.sx = sx; CAM.sy = sy; }
export const ROT = { a: 0, x: 0, y: 0 };
export function setRot(a = 0, x = 0, y = 0) { ROT.a = a; ROT.x = x; ROT.y = y; }   // rotate following drawing around (x, y) — e.g. a person lying down
export const P = ([x, y]) => {
  if (ROT.a) { const c = Math.cos(ROT.a), s = Math.sin(ROT.a), dx = x - ROT.x, dy = y - ROT.y; x = ROT.x + dx * c - dy * s; y = ROT.y + dx * s + dy * c; }
  return [(x - CAM.x) * CAM.z + 960 + CAM.sx, (y - CAM.y) * CAM.z + 540 + CAM.sy];
};
export function dot(g, x, y, r, col = INK) { const [X, Y] = P([x, y]); g.fillStyle = col; g.beginPath(); g.arc(X, Y, Math.max(1.5, r * CAM.z), 0, 7); g.fill(); }
// cartoon lettering: heavy rounded sans with a thick ink outline (comic sound words, labels, warnings)
export function text(g, s, x, y, size, fill = '#fff', o = {}) {
  const [X, Y] = P([x, y]), sz = size * (o.fixed ? 1 : CAM.z);
  g.save(); g.translate(X, Y); if (o.rot) g.rotate(o.rot); g.font = `${o.weight || 900} ${Math.round(sz)}px ${o.font || 'Rubik'}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
  if (o.reveal != null) { const w = g.measureText(s).width; g.beginPath(); g.rect(-w / 2 - 20, -sz, (w + 40) * o.reveal, sz * 2); g.clip(); }
  if (o.outline !== false) { g.lineJoin = 'round'; g.lineWidth = o.lw ?? Math.max(6, sz * .16); g.strokeStyle = o.outline || INK; g.strokeText(s, 0, 0); }
  g.fillStyle = fill; g.fillText(s, 0, 0); g.restore();
}
// resample a polyline (closed) every ~step px and push points along the normal with smooth noise → hand-drawn boil
function boil(pts, closed = true, amp = 1.7, step = 9, seed = 1) {
  const out = [], n = pts.length; if (n < 2) return pts;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n], L = Math.hypot(x1 - x0, y1 - y0), k = Math.max(1, Math.round(L / step));
    for (let j = 0; j < k; j++) out.push([x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k]);
  }
  if (!closed) out.push(pts[n - 1]);
  const m = out.length;
  return out.map(([x, y], i) => {
    const a = out[(i - 1 + m) % m], b = out[(i + 1) % m], nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1;
    const d = (Math.sin(i * .9 + seed * 3.1 + BOIL * 2.1) * .6 + (hash(i, seed, BOIL) - .5) * .8) * amp;
    return [x + nx / l * d, y + ny / l * d];
  });
}
function path(g, pts, closed = true) {
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (closed) g.closePath();
}
const scr = pts => pts.map(P);
// main primitive: fill + optional hard shadow (the same shape offset away from the light, clipped inside) + boiling outline
export function shape(g, pts, o = {}) {
  const seed = o.seed ?? (pts.length * 7 + Math.round(pts[0][0] + pts[0][1])); pts = scr(pts);
  const bp = o.boil === false ? pts : boil(pts, o.closed !== false, o.amp ?? 1.7, 9, seed);
  if (o.fill && o.closed !== false) { g.fillStyle = o.fill; path(g, bp); g.fill(); }
  if (o.shade && o.closed !== false) {
    g.save(); path(g, bp); g.clip(); g.fillStyle = o.shade; const [dx, dy] = (o.shadeOff || [18, 14]).map(v => v * CAM.z);
    path(g, bp.map(([x, y]) => [x - dx, y - dy])); g.rect(-5000, -5000, 12000, 12000); g.fill('evenodd'); g.restore();
  }
  if (o.hi && o.closed !== false) {                    // a flat highlight sliver on the lit side
    g.save(); path(g, bp); g.clip(); g.fillStyle = o.hi; const [dx, dy] = (o.hiOff || [-8, -8]).map(v => v * CAM.z);
    path(g, bp.map(([x, y]) => [x - dx, y - dy])); g.rect(-5000, -5000, 12000, 12000); g.fill('evenodd'); g.restore();
  }
  if (o.line !== false) { g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = o.line || INK; g.lineWidth = o.lw ?? 7; path(g, bp, o.closed !== false); g.stroke(); }
}
export const ell = (cx, cy, rx, ry, n = 40, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * i / (a1 - a0 >= 6.28 ? n : n - 1); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export function rrect(x, y, w, h, r) { const p = []; for (const [cx, cy, a] of [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]]) for (let i = 0; i <= 6; i++) { const t = a + i / 6 * Math.PI / 2; p.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]); } return p; }
export const xf = (pts, tx, ty, s = 1, rot = 0) => pts.map(([x, y]) => [tx + (x * Math.cos(rot) - y * Math.sin(rot)) * s, ty + (x * Math.sin(rot) + y * Math.cos(rot)) * s]);
export function line(g, pts, o = {}) { shape(g, pts, { ...o, closed: false, fill: null }); }
export function bands(g, W, ys, cols) { for (let i = 0; i < cols.length; i++) { const y0 = ys[i] <= 0 ? -10 : P([0, ys[i]])[1], y1 = i + 1 < cols.length ? P([0, ys[i + 1]])[1] : 4000; g.fillStyle = cols[i]; g.fillRect(0, y0, 1920, y1 - y0); } }
export function glowRings(g, x, y, r, col, a = .25) { const [X, Y] = P([x, y]); g.save(); g.globalAlpha = a; g.fillStyle = col; for (const k of [1, .7]) { g.beginPath(); g.arc(X, Y, r * k * CAM.z, 0, 7); g.fill(); } g.restore(); }
// darkness with holes of light (flashlight, lamp): screen-space overlay
let DK = null;
export function dark(g, a, holes = [], col = '#0b0b24') {          // soft-edged light pools in a dark overlay
  if (!DK) { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; DK = c.getContext('2d'); }
  DK.globalCompositeOperation = 'source-over'; DK.clearRect(0, 0, 1920, 1080); DK.globalAlpha = a; DK.fillStyle = col; DK.fillRect(0, 0, 1920, 1080);
  DK.globalAlpha = 1; DK.globalCompositeOperation = 'destination-out';
  for (const h of holes) { const [X, Y] = P([h.x, h.y]), R = h.r * CAM.z, sy = h.sy || 1; DK.save(); DK.translate(X, Y); DK.scale(1, sy);
    const gr = DK.createRadialGradient(0, 0, R * .25, 0, 0, R * 1.15); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.6, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    DK.fillStyle = gr; DK.beginPath(); DK.arc(0, 0, R * 1.15, 0, 7); DK.fill(); DK.restore(); }
  g.drawImage(DK.canvas, 0, 0);
}
export function tint(g, col, a) { g.save(); g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, 1920, 1080); g.restore(); }

// ═════ people ═════
export const CAST = {
  hero:   { skin: '#f2b48a', skinS: '#d98a62', hair: '#5a3220', hairS: '#3e2116', coat: '#ffc928', coatS: '#e09a12', pants: '#33415e', pantsS: '#232c44', boots: '#5b3a2a', hat: '#e2402f', hatS: '#b02a22', h: 1 },
  vera:   { skin: '#f6c39c', skinS: '#dd9670', hair: '#b4492b', hairS: '#80301c', coat: '#2fa39b', coatS: '#1f7a74', pants: '#3b2f4d', pantsS: '#2a2138', boots: '#3a2a24', long: true, h: .94 },
  keeper: { skin: '#e8b08c', skinS: '#c98a66', hair: '#e8e6e0', hairS: '#bdbab2', coat: '#2b4a7a', coatS: '#1d3459', pants: '#2e2e3a', pantsS: '#1f1f28', boots: '#2a211c', beard: true, h: 1.02 },
  mom:    { skin: '#e4b598', skinS: '#c7937a', hair: '#9a9aa6', hairS: '#77778a', coat: '#8b5a9b', coatS: '#68407a', pants: '#3a3046', pantsS: '#2a2234', boots: '#2a2228', long: true, h: .95 },
};
// face at (cx, cy), head radius R. f: {eyes: open|closed|wide|half, look:[dx,dy], mouth 0..1, smile -1..1, brow: neutral|worried|angry|sad|up, sweat, tear, side: 0 front | 1 three-quarter right | -1 left}
export function face(g, cx, cy, R, c, f = {}) {
  const side = f.side || 0, sx = side * R * .28;
  // hair back (long hair)
  if (c.long) shape(g, [...ell(cx, cy + R * .25, R * 1.12, R * 1.25, 30, Math.PI * .95, Math.PI * 2.05)].concat([[cx + R * 1.05, cy + R * 1.3], [cx - R * 1.05, cy + R * 1.3]]), { fill: c.hair, shade: c.hairS });
  shape(g, ell(cx, cy, R * .92, R, 36), { fill: c.skin, shade: c.skinS, shadeOff: [-R * .22 * (side || 1), -R * .1] });   // head
  shape(g, ell(cx - R * .9 + sx * .3, cy + R * .1, R * .16, R * .22, 14), { fill: c.skin, lw: 5 }); shape(g, ell(cx + R * .9 + sx * .3, cy + R * .1, R * .16, R * .22, 14), { fill: c.skin, lw: 5 });  // ears
  if (c.beard) shape(g, [[cx - R * .85, cy + R * .1], [cx + R * .85, cy + R * .1], [cx + R * .6, cy + R * .95], [cx, cy + R * 1.35], [cx - R * .6, cy + R * .95]], { fill: c.hair, shade: c.hairS });
  // hair / hat
  if (c.hat) {
    shape(g, [...ell(cx, cy - R * .25, R * .98, R * .9, 30, Math.PI, Math.PI * 2)].concat([[cx + R * 1.02, cy - R * .2], [cx - R * 1.02, cy - R * .2]]), { fill: c.hat, shade: c.hatS });
    shape(g, rrect(cx - R * 1.05, cy - R * .38, R * 2.1, R * .3, R * .12), { fill: c.hat, shade: c.hatS, lw: 6 });
    shape(g, ell(cx, cy - R * 1.12, R * .2, R * .18, 14), { fill: '#fff4e0', lw: 5 });                            // pompom
  } else {
    shape(g, [...ell(cx, cy - R * .15, R * .98, R * .95, 30, Math.PI * 1.02, Math.PI * 1.98), [cx + R * .7, cy - R * .35], [cx + R * .2, cy - R * .5], [cx - R * .3, cy - R * .38], [cx - R * .8, cy - R * .3]], { fill: c.hair, shade: c.hairS });
  }
  // eyes: big whites, tiny pupils
  const ey = cy + R * .05, ex = R * .36, er = R * .27, [lx, ly] = f.look || [0, 0], eyes = f.eyes || 'open';
  for (const s of [-1, 1]) {
    const x = cx + s * ex + sx, rx = er * (side ? (s === side ? 1.05 : .82) : 1);
    if (eyes === 'closed') { line(g, ell(x, ey, rx, er * .5, 10, Math.PI * .1, Math.PI * .9), { lw: 6 }); continue; }
    const ry = er * (eyes === 'wide' ? 1.25 : eyes === 'half' ? .65 : 1.05);
    shape(g, ell(x, ey, rx, ry, 22), { fill: '#ffffff', lw: 6 });
    const pr = eyes === 'wide' ? R * .05 : R * .065; dot(g, x + lx * rx * .5 + side * rx * .25, ey + ly * ry * .5, pr);
    if (eyes === 'half') shape(g, [...ell(x, ey, rx + 2, ry + 2, 14, Math.PI, Math.PI * 2), [x + rx, ey - ry * .1], [x - rx, ey - ry * .1]], { fill: c.skinS, lw: 6 });
    // brows
    const bw = rx * .9, by = ey - ry - R * .12, br = f.brow || 'neutral';
    const tilt = br === 'worried' ? -s * .35 : br === 'angry' ? s * .4 : br === 'sad' ? -s * .25 : 0, lift = br === 'up' || br === 'worried' ? -R * .08 : 0;
    line(g, [[x - bw, by + lift - Math.sin(tilt) * bw], [x + bw, by + lift + Math.sin(tilt) * bw]], { lw: 8, amp: 1 });
  }
  // nose
  line(g, [[cx + sx + R * .05, cy + R * .2], [cx + sx + R * .14 * (side || 1), cy + R * .38], [cx + sx - R * .02, cy + R * .42]], { lw: 5 });
  // mouth: open amount, smile curl
  const mo = Math.max(0, Math.min(1, f.mouth || 0)), sm = f.smile || 0, my = cy + R * .62, mw = R * (.3 + .1 * mo);
  if (f.scream) {                                       // terror: a tall dark O, teeth on top
    const h = R * .36 * (f.scream || 1), w = R * .24, pts = ell(cx + sx, my + R * .05, w, h, 24);
    shape(g, pts, { fill: '#5a1020', lw: 7 }); shape(g, ell(cx + sx, my + R * .05 + h * .55, w * .62, h * .32, 14), { fill: '#e8606a', line: false });
    shape(g, [[cx + sx - w * .7, my - h * .78], [cx + sx + w * .7, my - h * .78], [cx + sx + w * .6, my - h * .55], [cx + sx - w * .6, my - h * .55]], { fill: '#ffffff', lw: 4 });
  } else if (mo < .08) line(g, [[cx + sx - mw, my - sm * R * .1], [cx + sx, my + sm * R * .08], [cx + sx + mw, my - sm * R * .1]], { lw: 6 });
  else {
    const h = R * (.08 + .35 * mo), pts = [...ell(cx + sx, my, mw, h, 20, 0, Math.PI), [cx + sx - mw, my - sm * R * .06], [cx + sx + mw, my - sm * R * .06]];
    shape(g, pts, { fill: '#7a1f2b', lw: 6 }); if (mo > .3) shape(g, ell(cx + sx, my + h * .75, mw * .5, h * .3, 14), { fill: '#e8606a', line: false });
  }
  if (f.sweat) { shape(g, [[cx + R * .95, cy - R * .5], [cx + R * 1.08, cy - R * .2], [cx + R * .95, cy - R * .12], [cx + R * .84, cy - R * .22]], { fill: '#bfe8ff', lw: 4 }); }
  if (f.tear) shape(g, [[cx + sx + ex, ey + er * 1.2], [cx + sx + ex + R * .08, ey + er * 1.7], [cx + sx + ex, ey + er * 1.85], [cx + sx + ex - R * .08, ey + er * 1.7]], { fill: '#7fd0ff', lw: 4 });
}
// torso: rounded shoulders, slight waist, flared coat hem
function T_torso(cx, sy, tw, hy, bx) {
  const p = [];
  for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; p.push([cx + Math.cos(a) * tw, sy + tw * .45 + Math.sin(a) * tw * .45]); }
  p.push([cx + tw * .92, (sy + hy) / 2], [bx + tw * 1.18, hy], [bx - tw * 1.18, hy], [cx - tw * .92, (sy + hy) / 2]);
  return p;
}
// a whole person standing at (x, floorY), height ~ 520*s px. p: {lean, armF, armB (angles from down, rad), walk (phase or null), facing ±1, kneel, sit, face:{…}}
export function person(g, who, x, fy, s, p = {}) {
  const c = CAST[who], d = p.facing || 1, H = 520 * s * c.h, R = H * .135;
  const hipY = fy - H * .45, shY = fy - H * .76, walk = p.walk;
  const leg = (sgn, ph) => {
    const a = walk != null ? Math.sin(walk + ph) * .45 : (p.sit ? -1.3 * d : p.kneel ? (sgn > 0 ? -1.4 * d : .1) : sgn * .06);
    const knee = [x + sgn * H * .05 + Math.sin(a) * H * .22, hipY + Math.cos(a) * H * .22];
    const b = p.sit ? 0 : p.kneel && sgn > 0 ? 0 : walk != null ? Math.max(0, -Math.sin(walk + ph)) * .6 : 0;
    const foot = [knee[0] + Math.sin(b) * H * .2 * -d, knee[1] + Math.cos(b) * H * .22];
    const w = H * .055;
    shape(g, [[x + sgn * H * .05 - w, hipY], [x + sgn * H * .05 + w, hipY], [knee[0] + w, knee[1]], [foot[0] + w * .9, foot[1]], [foot[0] - w * .9, foot[1]], [knee[0] - w, knee[1]]], { fill: c.pants, shade: c.pantsS });
    shape(g, rrect(foot[0] - H * .05 + d * H * .025, foot[1] - H * .045, H * .12, H * .06, H * .025), { fill: c.boots, lw: 6 });
  };
  leg(-1, Math.PI); leg(1, 0);
  const arm = (ang, front) => {
    const sx = x + (front ? d : -d) * H * .12, sy = shY + H * .03, L = H * .3;
    const ex = sx + Math.sin(ang) * L * .5 * d, ey = sy + Math.cos(ang) * L * .5, hx = sx + Math.sin(ang * 1.15) * L * d, hy = sy + Math.cos(ang * 1.15) * L;
    const w = H * .055;
    shape(g, [[sx - w, sy], [sx + w, sy], [ex + w, ey], [hx + w * .8, hy], [hx - w * .8, hy], [ex - w, ey]], { fill: front ? c.coat : c.coatS, shade: front ? c.coatS : null });
    shape(g, ell(hx, hy + w * .4, w * 1.05, w * 1.15, 14), { fill: c.skin, lw: 6 });
    return [hx, hy];
  };
  arm(p.armB ?? .15, false);
  // torso / coat
  const lean = (p.lean || 0) * d, tw = H * .15, lx = lean * H * .2;
  shape(g, T_torso(x + lx, shY, tw, hipY + H * .1, x), { fill: c.coat, shade: c.coatS, shadeOff: [-d * H * .06, 0] });
  shape(g, [[x + lx - tw * .55, shY - H * .01], [x + lx, shY + H * .09], [x + lx + tw * .55, shY - H * .01], [x + lx + tw * .3, shY - H * .05], [x + lx - tw * .3, shY - H * .05]], { fill: c.coatS, lw: 6 });   // collar
  line(g, [[x + lean * H * .1 + d * 4, shY + H * .03], [x + d * 4, hipY + H * .1]], { lw: 5 });                // coat seam
  for (const k of [.3, .55, .8]) dot(g, x + d * H * .03, shY + (hipY + H * .1 - shY) * k, H * .01);
  const hand = arm(p.armF ?? -.1, true);
  face(g, x + lean * H * .25 + d * H * .01, shY - R * .95, R, c, { side: p.face?.side ?? d * .7, ...p.face });
  return { hand, head: [x + lean * H * .25, shY - R * .95], R };
}
