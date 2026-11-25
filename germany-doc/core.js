// core.js — the documentary motion system: a camera over a Natural Earth map, paper patches, animated arrows and dashed
// lines, map labels, overlays (cards, stamps, counters, cross-outs), full-screen paper "sheets" that slide in for diagrams,
// face slams over a blurred map, a timeline strip, a «КАК БЫЛО / ЧТО ЕСЛИ» badge and karaoke subtitles.
// Everything is keyed to word times of the voice (voice/timing.json) through wt(line, word).
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, rr, rect, spline, dot, text, reset } from './toon.js';
import { puppet } from './countries.js';
import * as I from './icons.js';
export { W, H, INK, I };
export const PAL = I.PAL;
export const C = { sea: '#1c2a5a', seaL: '#26386f', land: '#ecdcb4', grey: '#8b8e86', greyS: '#6e716a', vichy: '#b4b3a7' };
export const q = t => Math.floor(t * 12 + 1e-6) / 12;

const canvas = document.getElementById('c'); init(canvas);
const J = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };
const GEO = await J('geo.json'), LJ = await J('lines.json'), TIM = await J('voice/timing.json');
export const LINES = LJ.lines;
export const DUR = Math.ceil((TIM.total + 3) * 24) / 24;

// —— words ——
const norm = s => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9-]/g, '');
export const LID = i => 'l' + String(i).padStart(3, '0');
const TOK = Object.fromEntries(LINES.map(l => [l.id, l.spoken.split(/\s+/).map(norm)]));
export const MISS = []; window.MISS = MISS;
export const L0 = i => TIM.lines[LID(i)].t0, L1 = i => TIM.lines[LID(i)].t1;
export function wt(i, w, n = 0) {
  const id = LID(i), tk = TOK[id], tm = TIM.lines[id], k0 = norm(w); let c = 0;
  for (let k = 0; k < tk.length; k++) if (tk[k].startsWith(k0)) { if (c === n) return tm.words[k][0]; c++; }
  MISS.push(`${id}:${w}`); return tm.t0;
}
export const EV = []; const ev = (t, type, k) => EV.push({ t: +t.toFixed(3), type, ...(k ? { k } : {}) });
export { ev };

// —— small animation helpers ——
export const pop01 = (t, t0, d = .22) => t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.2);
export const fadeIO = (t, t0, t1, d = .3) => ss(seg(t, t0, t0 + d)) * (1 - ss(seg(t, t1 - d, t1)));

// —— projection and camera ——
export const P = (lon, lat) => [(lon - 15) * 24.8, -(lat - 52) * 40];
export let CAM = { x: 0, y: 0, z: 1 };
export const S = (lon, lat) => { const [x, y] = P(lon, lat); return [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z]; };
const CAMK = [];
export const cam = (t, lon, lat, z, d = 1.6) => CAMK.push({ t, P: P(lon, lat), z, d });
function camEval(k, t) {
  const u = eio(seg(t, k.t, k.t + k.d)), dr = 1 + .02 * Math.max(0, t - k.t - k.d) / 10;
  return { x: lerp(k.from.x, k.P[0], u), y: lerp(k.from.y, k.P[1], u), z: Math.exp(lerp(Math.log(k.from.z), Math.log(k.z), u)) * dr };
}
let camReady = false;
function camPrep() { CAMK.sort((a, b) => a.t - b.t); CAMK.forEach((k, i) => { k.from = i ? camEval(CAMK[i - 1], k.t) : { x: k.P[0], y: k.P[1], z: k.z }; }); camReady = true; }
function camAt(t) { if (!camReady) camPrep(); let k = CAMK[0]; for (const x of CAMK) if (x.t <= t) k = x; return camEval(k, Math.max(t, k.t)); }
let SHAKE = [];
export const shake = (t, amp = 14, d = .35) => SHAKE.push({ t, amp, d });
function camApply(t) {
  let sx = 0, sy = 0; for (const s of SHAKE) if (t >= s.t && t < s.t + s.d) { const f = Math.floor(t * 24), a = s.amp * (1 - (t - s.t) / s.d); sx += (hash(f) - .5) * 2 * a; sy += (hash(f + 77) - .5) * 2 * a; }
  reset(); translate(W / 2 + sx, H / 2 + sy); scale(CAM.z); translate(-CAM.x, -CAM.y);
}

// —— the map ——
const RINGS = [];
for (const [name, rs] of Object.entries(GEO)) for (const r of rs) { const pts = r.map(p => P(...p)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); RINGS.push({ name, pts, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }); }
const GREYC = new Set(['Germany', 'Austria', 'Czechia']);
let GREYF = () => 1;                                    // how grey the Reich's core is (fades at the end)
export const setGreyF = f => { GREYF = f; };
const mix = (a, b, u) => { const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], u)).toString(16).padStart(2, '0')).join(''); };
const TINTS = [];                                       // map tints: {t0,t1,col,a}
export const tint = (t0, t1, col, a) => TINTS.push({ t0, t1, col, a });
function drawMap(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = C.sea; g.fillRect(0, 0, W, H);
  g.strokeStyle = C.seaL; g.lineWidth = 3; const off = (-CAM.y * CAM.z * .35) % 64;
  for (let y = off - 64; y < H + 64; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 24); g.stroke(); }
  camApply(t);
  const m = 80 / CAM.z, vx0 = CAM.x - W / 2 / CAM.z - m, vx1 = CAM.x + W / 2 / CAM.z + m, vy0 = CAM.y - H / 2 / CAM.z - m, vy1 = CAM.y + H / 2 / CAM.z + m;
  const vis = RINGS.filter(r => r.bb[2] > vx0 && r.bb[0] < vx1 && r.bb[3] > vy0 && r.bb[1] < vy1);
  for (const r of vis) shape(r.pts, { fill: C.land, lw: 9, boil: 0 });
  const gc = mix(C.land, C.grey, GREYF(t));
  for (const r of vis) { const c = GREYC.has(r.name) ? gc : C.land; shape(r.pts, { fill: c, lw: 3, line: c, boil: 0 }); }
}
function drawTints(t) { for (const k of TINTS) { const a = fadeIO(t, k.t0, k.t1, .8) * k.a; if (a > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.fillStyle = k.col; g.fillRect(0, 0, W, H); g.globalAlpha = 1; } } }

// —— paper patches ——
const PATCH = {};
const ragged = (pts, seed) => { const o = []; pts.forEach((p, i) => { const q2 = pts[(i + 1) % pts.length]; for (let k = 0; k < 3; k++) { const u = k / 3; o.push([lerp(p[0], q2[0], u) + (hash(seed + i * 7 + k) - .5) * .3, lerp(p[1], q2[1], u) + (hash(seed + i * 11 + k * 3) - .5) * .3]); } }); return o.map(p => P(...p)); };
export const defPatch = (k, pts, col = C.grey) => { PATCH[k] = { pts: ragged(pts, Object.keys(PATCH).length * 97 + 5), col }; };
const PATCHES = [];
export const patchOn = (k, t, off = null, peel = true) => { PATCHES.push({ k, t, off, peel }); ev(t, 'slap', k); if (off != null) ev(off, peel ? 'peel' : 'paper', k); };
const centroid = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
function paperPoly(pts, col, a = 1, cracks = 0) {
  fillOnly(pts.map(p => [p[0] + 8 / CAM.z, p[1] + 11 / CAM.z]), `rgba(10,8,20,${.28 * a})`, { boil: .4 });
  shape(pts, { fill: col, lw: 6, alpha: a, shade: () => { for (let i = 0; i < 6; i++) { const p = pts[Math.floor(i * pts.length / 6)], d = 26 / CAM.z; stroke([[p[0] - d, p[1]], [p[0] + d, p[1] + d * .4]], 3, { line: 'rgba(80,82,76,.5)' }); } } });
  if (cracks > 0) { const c = centroid(pts); for (let i = 0; i < 4; i++) { const p = pts[Math.floor((i + .5) * pts.length / 4)]; const e = [lerp(c[0], p[0], cracks), lerp(c[1], p[1], cracks)];
    stroke([c, [lerp(c[0], e[0], .5) + (hash(i) - .5) * 30 / CAM.z, lerp(c[1], e[1], .5)], e], 4, { line: INK }); } }
}
let CRACK = () => 0; export const setCrack = f => { CRACK = f; };
function drawPatches(t) {
  camApply(t);
  for (const p of PATCHES) {
    if (t < p.t - .35) continue; if (p.off != null && t > p.off + (p.peel ? 1.8 : .5)) continue;
    const D = PATCH[p.k], fall = seg(t, p.t - .35, p.t), land = t >= p.t, c = centroid(D.pts);
    const sq = land ? 1 + .06 * Math.exp(-(t - p.t) * 12) * Math.cos((t - p.t) * 40) : lerp(1.3, 1, ei(fall));
    let pts = D.pts.map(v => [c[0] + (v[0] - c[0]) * sq, c[1] + (v[1] - c[1]) * sq - (land ? 0 : (1 - ei(fall)) * 220 / CAM.z)]);
    let a = 1;
    if (p.off != null && t > p.off) {
      if (p.peel) { const u = seg(t, p.off, p.off + 1.8); push(); translate(c[0] + Math.sin(u * 8) * 40 / CAM.z * u, c[1] + u * u * 1100 / CAM.z); rotate(u * 2.2 * (hash(c[0]) > .5 ? 1 : -1)); scale(1 - u * .3); translate(-c[0], -c[1]); paperPoly(pts, D.col, 1, CRACK(t)); pop(); continue; }
      a = 1 - seg(t, p.off, p.off + .5);
    }
    paperPoly(pts, D.col, land ? a : .7 * a, CRACK(t));
  }
}
export const peelAll = (t0, step = .22) => { let i = 0; for (const p of PATCHES) if (p.off == null) { p.off = t0 + i * step; p.peel = true; ev(p.off, 'peel', p.k); i++; } };
export const patchCentre = k => centroid(PATCH[k].pts);

// —— arrows, dashed lines, rings (map-anchored, drawn in screen space with constant widths) ——
function partial(pts, u) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const target = L[L.length - 1] * u, out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { if (L[i] <= target) out.push(pts[i]); else { const f = (target - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; } }
  return out;
}
const smooth = pts => pts.length > 2 ? spline(pts, false, 10) : pts;
const ARROWS = [];
export const arrow = (pts, t0, dur = 1.2, o = {}) => { ARROWS.push({ pts, t0, dur, off: o.off ?? null, col: o.col ?? PAL.red, w: o.w ?? 20, icon: o.icon ?? null, is: o.is ?? .5 }); ev(t0, 'arrow'); };
function drawArrows(t) {
  reset();
  for (const a of ARROWS) {
    if (t < a.t0) continue; if (a.off != null && t > a.off + .4) continue;
    const u = eo(seg(t, a.t0, a.t0 + a.dur)), al = a.off != null ? 1 - seg(t, a.off, a.off + .4) : 1;
    const sp = partial(smooth(a.pts.map(p => S(...p))), Math.max(.02, u)); if (sp.length < 2) continue;
    const e = sp[sp.length - 1], pr = sp[Math.max(0, sp.length - 3)], ang = Math.atan2(e[1] - pr[1], e[0] - pr[0]);
    const body = sp.slice(); const hb = a.w * 1.1; body[body.length - 1] = [e[0] - Math.cos(ang) * hb, e[1] - Math.sin(ang) * hb];
    stroke(body, a.w + 12, { line: INK, alpha: al }); stroke(body, a.w, { line: a.col, alpha: al });
    push(); translate(e[0], e[1]); rotate(ang); shape([[8, 0], [-a.w * 1.6, -a.w * 1.4], [-a.w * 1.6, a.w * 1.4]], { fill: a.col, lw: 6, alpha: al }); pop();
    if (a.icon && u < 1.02) { push(); translate(e[0] - Math.cos(ang) * a.w * 3.2, e[1] - Math.sin(ang) * a.w * 3.2 - 40); scale(a.is * (Math.cos(ang) < 0 ? -1 : 1), a.is); I[a.icon](); pop(); }
  }
}
const DLINES = [];
export const dline = (pts, t0, dur = 1.2, o = {}) => DLINES.push({ pts, t0, dur, off: o.off ?? null, col: o.col ?? PAL.red, w: o.w ?? 8, dash: o.dash ?? 26, closed: o.closed ?? false, jag: o.jag ?? 0 });
export const ring = (lon, lat, r, t0, dur, o = {}) => { DLINES.push({ ring: [lon, lat, r], t0, dur, off: o.off ?? null, col: o.col ?? PAL.red, w: o.w ?? 9, dash: o.dash ?? 22, jag: 0 }); ev(t0, 'draw'); };
function drawDLines(t) {
  reset();
  for (const d of DLINES) {
    if (t < d.t0) continue; if (d.off != null && t > d.off + .4) continue;
    const u = eo(seg(t, d.t0, d.t0 + d.dur)), al = d.off != null ? 1 - seg(t, d.off, d.off + .4) : 1;
    let pts;
    if (d.ring) { const [cx, cy] = S(d.ring[0], d.ring[1]); pts = []; for (let i = 0; i <= 64; i++) { const a = -Math.PI / 2 + i / 64 * TAU; pts.push([cx + Math.cos(a) * d.ring[2], cy + Math.sin(a) * d.ring[2]]); } }
    else pts = smooth(d.pts.map(p => S(...p)));
    if (d.jag) pts = pts.map((p, i) => [p[0] + (hash(i * 3.1 + Math.floor(t * 12)) - .5) * d.jag, p[1] + (hash(i * 5.7 + Math.floor(t * 12)) - .5) * d.jag]);
    const sp = partial(pts, Math.max(.01, u));
    if (!d.dash) { stroke(sp, d.w + 6, { line: INK, alpha: al }); stroke(sp, d.w, { line: d.col, alpha: al }); continue; }
    let acc = 0, on = true, cur = [sp[0]];
    for (let i = 1; i < sp.length; i++) { const l = Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); acc += l; cur.push(sp[i]);
      if (acc > d.dash) { if (on) stroke(cur, d.w, { line: d.col, alpha: al }); on = !on; acc = 0; cur = [sp[i]]; } }
    if (on && cur.length > 1) stroke(cur, d.w, { line: d.col, alpha: al });
  }
}
// —— map labels: a dot and a paper plate in screen space ——
const LABS = [];
export const lab = (name, lon, lat, t0, t1, o = {}) => LABS.push({ name, lon, lat, t0, t1, ...o });
function drawLabs(t) {
  reset();
  for (const l of LABS) {
    if (t < l.t0 || t > l.t1 + .3) continue; const p = pop01(t, l.t0) * (1 - ss(seg(t, l.t1, l.t1 + .3))); if (p <= 0) continue;
    const [x, y] = S(l.lon, l.lat);
    if (l.sea) { g.save(); g.globalAlpha = Math.min(1, p); text(l.name, x, y, { font: 'italic 900 34px Nunito', fill: '#c9d4f2' }); g.restore(); continue; }
    if (!l.nodot) dot(x, y, 9 * Math.min(1, p), INK);
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = `900 ${l.size || 32}px Nunito`; const w = g.measureText(l.name).width;
    push(); translate(x + (l.dx ?? 18), y + (l.dy ?? -30)); scale(p);
    shape(rr(-8, -24, w + 16, 46, 8), { fill: l.fill || PAL.paper, lw: 5 }); text(l.name, w / 2, 0, { font: `900 ${l.size || 32}px Nunito`, fill: l.col || INK });
    pop();
  }
}
// —— custom drawers: map-anchored acts (above the map) and screen overlays ——
const FX = []; export const fx = (t0, t1, f, layer = 1) => FX.push({ t0, t1, f, layer });
const NOTES = [];
export const note = (o) => { NOTES.push(o); ev(o.t, 'card'); };
function drawNotes(t) {
  for (const n of NOTES) {
    if (t < n.t || (n.off != null && t > n.off + .4)) continue;
    const p = n.soft ? ss(seg(t, n.t, n.t + .8)) : pop01(t, n.t, .25), out = n.off != null ? ei(seg(t, n.off, n.off + .4)) : 0;
    reset(); push(); translate(n.x + out * 1400, n.y); scale(n.soft ? 1 : p); rotate((n.tilt ?? -.02) + out * .3);
    if (n.soft) g.globalAlpha = p;
    I.card(n.w, n.h, n.lines, { fill: n.fill, clip: n.clip ?? true, pin: n.pin ?? true });
    if (n.icon) { push(); translate(n.ix ?? 0, n.iy ?? 0); scale(n.is ?? .8); I[n.icon](); pop(); }
    g.globalAlpha = 1; pop();
  }
}
const STAMPS = [];
export const stampAt = (o) => { STAMPS.push(o); ev(o.t, 'stamp'); };
function drawStamps(t) {
  for (const s of STAMPS) {
    if (t < s.t || (s.off != null && t > s.off + .3)) continue;
    const th = 1 + .6 * (1 - eo(seg(t, s.t, s.t + .16))), a = seg(t, s.t, s.t + .06) * (s.off != null ? 1 - seg(t, s.off, s.off + .3) : 1);
    reset(); push(); translate(s.x, s.y); rotate(s.rot ?? -.06); scale(th * (s.sc ?? 1)); I.stamp(s.label, s.col || PAL.red, { w: s.w, h: s.h, size: s.size, a: a * .92, sub: s.sub }); pop();
  }
}
const COUNTERS = [];
export const counter = (o) => { COUNTERS.push({ d: 1.3, from: 0, ...o }); ev(o.t, o.soft ? 'soft' : 'count'); };
const fmtRU = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
function drawCounters(t) {
  for (const c of COUNTERS) {
    if (t < c.t || (c.off != null && t > c.off + .4)) continue;
    const p = c.soft ? ss(seg(t, c.t, c.t + 1)) : pop01(t, c.t), out = c.off != null ? ei(seg(t, c.off, c.off + .4)) : 0;
    const v = c.soft ? c.to : lerp(c.from, c.to, eo(seg(t, c.t + .15, c.t + .15 + c.d)));
    const s = (c.fmt || fmtRU)(v);
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = `400 ${c.size || 84}px "Russo One"`; const w = Math.max(g.measureText(s).width, (c.label || '').length * 17) + 90;
    reset(); push(); translate(c.x + out * 1200, c.y); scale(c.soft ? 1 : p); rotate(c.tilt ?? .02); if (c.soft) g.globalAlpha = p;
    I.card(w, c.label ? 190 : 140, [{ t: s, f: `400 ${c.size || 84}px "Russo One"`, c: c.col || PAL.redD, lh: 100 }, ...(c.label ? [{ t: c.label, f: '900 28px Nunito', c: INK, lh: 44 }] : [])], { clip: false, fill: c.fill });
    g.globalAlpha = 1; pop();
  }
}
const XS = []; export const xout = (t, x, y, w, h, o = {}) => { XS.push({ t, x, y, w, h, off: o.off ?? null }); ev(t, 'scratch'); };
function drawXs(t) {
  reset();
  for (const x of XS) { if (t < x.t || (x.off != null && t > x.off + .4)) continue; const u1 = eo(seg(t, x.t, x.t + .2)), u2 = eo(seg(t, x.t + .15, x.t + .35));
    const a = [x.x - x.w / 2, x.y - x.h / 2], b = [x.x + x.w / 2, x.y + x.h / 2], c = [x.x + x.w / 2, x.y - x.h / 2], d = [x.x - x.w / 2, x.y + x.h / 2];
    stroke([a, [lerp(a[0], b[0], u1), lerp(a[1], b[1], u1)]], 16, { line: PAL.red }); if (u2 > 0) stroke([c, [lerp(c[0], d[0], u2), lerp(c[1], d[1], u2)]], 16, { line: PAL.red }); }
}
// —— full-screen paper sheets (diagrams, chapter cards) slide in from the right and out to the left ——
const SETS = []; export const sheet = (t0, t1, f, o = {}) => { SETS.push({ t0, t1, f, ...o }); };
function sheetX(s, t) { const a = s.t0 - .45; if (t < a || t > s.t1 + .45) return null; if (t < s.t0) return W * (1 - eo(seg(t, a, s.t0))); if (t > s.t1) return -W * ei(seg(t, s.t1, s.t1 + .45)); return 0; }
function prepSheets() { SETS.sort((a, b) => a.t0 - b.t0); for (const s of SETS) ev(s.t0 - .45, 'whoosh'); }
// —— face slams ——
const SLAMS = []; export const slam = (t0, t1, side, o = {}) => { SLAMS.push({ t0, t1, side, ...o }); ev(t0, 'slam'); };
const backC = Object.assign(document.createElement('canvas'), { width: W, height: H });
// —— timeline strip and the mode badge ——
const YEARS = []; export const year = (t, y, label) => YEARS.push({ t, y, label });
const yx = y => y <= 1946 ? lerp(150, 1330, (y - 1939) / 7) : lerp(1330, 1770, (y - 1946) / 29);
const MODES = []; export const mode = (t0, t1, m) => MODES.push({ t0, t1, m });
function drawTimeline(t, a) {
  if (a <= 0 || !YEARS.length) return; let k = 0; for (let i = 0; i < YEARS.length; i++) if (YEARS[i].t <= t) k = i;
  const cur = YEARS[k], prev = YEARS[Math.max(0, k - 1)], u = eio(seg(t, cur.t, cur.t + 1)), yv = k ? lerp(prev.y, cur.y, u) : cur.y;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.fillStyle = 'rgba(15,10,20,.62)'; g.fillRect(0, 0, W, 78);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(120, 52); g.lineTo(1800, 52); g.stroke();
  g.font = '900 20px Nunito'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.7)';
  for (const y of [1939, 1940, 1941, 1942, 1943, 1944, 1945, 1946, 1955, 1965, 1975]) { const x = yx(y); g.fillRect(x - 1.5, 44, 3, 16); g.fillText(String(y), x, 28); }
  const x = yx(yv); g.fillStyle = PAL.gold; g.beginPath(); g.moveTo(x, 64); g.lineTo(x - 13, 82); g.lineTo(x + 13, 82); g.fill(); g.fillRect(x - 3, 40, 6, 26);
  if (t >= YEARS[0].t) { const lp = pop01(t, cur.t, .25); g.font = '400 30px "Russo One"'; const w = g.measureText(cur.label).width + 34, lx = clamp(x, w / 2 + 10, W - w / 2 - 10);
    g.save(); g.translate(lx, 112); g.scale(lp, lp); g.fillStyle = PAL.gold; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-w / 2, -24, w, 48, 10); g.fill(); g.stroke();
    g.fillStyle = INK; g.textBaseline = 'middle'; g.fillText(cur.label, 0, 2); g.restore(); }
  const md = MODES.find(m => t >= m.t0 && t < m.t1);
  if (md) { const p = fadeIO(t, md.t0, md.t1, .4); reset(); push(); translate(1745, 128); rotate(-.05); scale(.42); I.stamp(md.m === 'real' ? 'КАК БЫЛО' : 'ЧТО ЕСЛИ', md.m === 'real' ? PAL.blue : PAL.red, { w: 520, h: 130, size: 70, a: p }); pop(); }
  g.globalAlpha = 1; g.textBaseline = 'alphabetic';
}
// —— karaoke subtitles: phrases of ≤ 7 words, the word being said in gold ——
const CHUNKS = [];
for (const l of LINES) {
  if (l.kind === 'title') continue; const tm = TIM.lines[l.id]; if (!tm) continue; const tok = l.spoken.split(/\s+/);
  const emit = ids => CHUNKS.push({ words: ids.map(k => tok[k]), t: ids.map(k => tm.words[k][0]), t0: tm.words[ids[0]][0] - .06, lend: tm.t1 });
  const real = ids => ids.filter(k => tok[k] !== '—').length;
  const split = ids => { if (real(ids) <= 7) return emit(ids); let best = null; const mid = ids.length / 2;
    ids.forEach((k, i) => { if (i > 0 && i < ids.length - 1 && /[—,:]$/.test(tok[k]) && (best === null || Math.abs(i + 1 - mid) < Math.abs(best - mid))) best = i + 1; });
    const c = best ?? Math.floor(mid); split(ids.slice(0, c)); split(ids.slice(c)); };
  let sent = []; tok.forEach((x, k) => { sent.push(k); if (/[.?!]$/.test(x)) { split(sent); sent = []; } }); if (sent.length) split(sent);
}
CHUNKS.forEach((c, i) => { const nx = CHUNKS[i + 1]; c.t1 = nx && nx.t0 - c.lend < .6 ? nx.t0 : Math.min(c.lend + .35, nx ? nx.t0 : 1e9); });
function drawSubs(t) {
  const c = CHUNKS.find(x => t >= x.t0 && t < x.t1); if (!c) return;
  const a = ss(seg(t, c.t0, c.t0 + .08)) * (1 - ss(seg(t, c.t1 - .08, c.t1)));
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = '900 46px Nunito'; const sp = g.measureText(' ').width, ww = c.words.map(x => g.measureText(x).width);
  const width = ww.reduce((p, x) => p + x, 0) + sp * (ww.length - 1), y = 1010;
  g.globalAlpha = a; g.fillStyle = 'rgba(15,10,20,.74)'; g.beginPath(); g.roundRect(960 - width / 2 - 26, y - 36, width + 52, 72, 16); g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle'; let x = 960 - width / 2;
  for (let i = 0; i < ww.length; i++) { const on = t >= c.t[i] && (i + 1 >= c.t.length || t < c.t[i + 1]) && c.words[i] !== '—'; g.fillStyle = on ? PAL.goldL : '#fff'; g.fillText(c.words[i], x, y + 2); x += ww[i] + sp; }
  g.globalAlpha = 1; g.textBaseline = 'alphabetic';
}

// —— the frame ——
function drawWorld(t) {
  drawMap(t); drawPatches(t); drawTints(t); drawDLines(t); drawArrows(t); drawLabs(t);
  for (const f of FX) if (f.layer === 1 && t >= f.t0 && t < f.t1) { reset(); f.f(t); }
}
export function render(t) {
  frame(t); CAM = camAt(t);
  const sl = SLAMS.find(s => t >= s.t0 && t < s.t1);
  const sheets = SETS.map(s => [s, sheetX(s, t)]).filter(x => x[1] != null), covered = sheets.some(x => x[1] === 0);
  if (sl) {
    init(backC); frame(t); drawWorld(t); init(canvas);
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(16px)'; g.drawImage(backC, -40, -40, W + 80, H + 80); g.filter = 'none'; g.fillStyle = 'rgba(20,10,30,.25)'; g.fillRect(0, 0, W, H);
    const p = back(seg(t, sl.t0, sl.t0 + .2), 1.6); reset();
    puppet({ side: sl.side, x: 960 + (sl.dx || 0), y: 1500, s: 1.5 * (.85 + .15 * p), face: sl.face ?? 1, t: q(t), mood: sl.mood || 'shock', nerv: sl.nerv ?? 0, look: sl.look || [0, 0], armR: sl.armR, armL: sl.armL });
  } else if (!covered) drawWorld(t);
  if (!covered && !sl) for (const f of FX) if (f.layer === 2 && t >= f.t0 && t < f.t1) { reset(); f.f(t); }
  if (!covered) { drawNotes(t); drawCounters(t); drawStamps(t); drawXs(t); }
  for (const [s, x] of sheets) {
    reset(); push(); translate(x, 0);
    fillOnly(rect(0, 0, W, H), s.bg || PAL.paper, { boil: 0 }); s.f(t, s); pop();
    if (x > 0) { g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createLinearGradient(x - 40, 0, x, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(x - 40, 0, 40, H); }
  }
  if (covered) { const top = sheets.find(x => x[1] === 0)[0]; if (top.overlays) { drawNotes(t); drawCounters(t); drawStamps(t); drawXs(t); } }
  const noTL = sheets.some(([s, x]) => s.noTL && Math.abs(x) < W * .5);
  drawTimeline(t, noTL ? 0 : 1);
  drawSubs(t); reset();
  const end = seg(t, DUR - 1.2, DUR); if (end > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(0,0,0,${end})`; g.fillRect(0, 0, W, H); }
}
export function finish() {
  prepSheets(); camPrep(); YEARS.sort((a, b) => a.t - b.t);
  for (const y of YEARS) ev(y.t, 'tick');
  window.DUR = DUR; window.render = render; window.TEXTS = t => { render(t); return []; };
  window.EV = EV.sort((a, b) => a.t - b.t);
}
