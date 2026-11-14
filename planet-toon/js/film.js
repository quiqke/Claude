// film.js — «7 правил выживания на чужой планете»: scenes keyed to spoken words, a portal jump into every new zone.
import * as T from './toon.js';
import * as W from './world.js';
let g, CU, SEG = [], EV = [], SH = [0, 0], PUNCH = [];
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ZONE = { jungle: 'ПУРПУРНЫЕ ДЖУНГЛИ', swamp: 'ЛАЙМОВОЕ БОЛОТО', desert: 'ОРАНЖЕВАЯ ПУСТЫНЯ', lakes: 'ДВА ОЗЕРА', ice: 'ЛЕДЯНЫЕ ПЕЩЕРЫ', second_pod: 'БЕЖЕВАЯ РАВНИНА', loop: 'МЕСТО ПАДЕНИЯ' };

export async function init(cv, cues) {
  g = cv.getContext('2d'); CU = cues;
  for (const [n, u] of [['Rubik', 'Rubik.ttf'], ['Caveat', 'Caveat.ttf'], ['JBMono', 'JetBrainsMono.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  let prev = 'crash';
  for (const l of L) { const sc = l.kind === 'title' ? 'title' : (l.tags.scene || prev); prev = sc; const last = SEG[SEG.length - 1];
    if (last && last.scene === sc && sc !== 'title') last.lines.push(l); else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .2 }); }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .3; s.i = i; }); SEG[0].t0 = 0;
  SEG.forEach((s, i) => { if (s.scene === 'title') { s.next = SEG[i + 1]; s.n = SEG.slice(0, i + 1).filter(x => x.scene === 'title').length; } });
  PUNCH = (cues.fx || []).filter(e => e.type === 'danger' && e.value >= 70).map(e => e.t);
  for (const s of SEG) { if (s.scene === 'title') { ev(s.t0, 'whoosh'); ev(s.t0 + .1, 'portal'); } }
  for (const p of PUNCH) ev(p, 'hit', { v: .7 });
  return { draw, EV };
}
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0) { if (!seg) return null; let k = 0; const p = norm(pat); for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; } return null; }
const after = (t, a) => a != null && t >= a;
function cam(x = 960, y = 540, z = 1) { let pz = 0; for (const p of PUNCH) if (t_ >= p && t_ < p + .35) pz = .14 * (1 - (t_ - p) / .35); T.setCam(x, y, z * (1 + pz), SH[0], SH[1]); }
let t_ = 0;

const SC = {
  crash(t, s) { const k = ss(s.t0, s.t1, t); cam(1000, 560, 1.25 - .2 * k); W.crash(g, t, { hx: 560 + 120 * k, face: { eyes: 'wide', brow: 'up', look: [1, 0], sweat: true, mouth: k > .6 ? .3 : 0 } }); },
  scratches(t, s) {
    const hand = wt(s, 'твоим') ?? s.t1 - 1.5;
    if (t < hand) { cam(960, 540, 1 + .1 * ss(s.t0, hand, t)); W.hull(g, t, { reveal: clamp((t - s.t0) / Math.max(.5, hand - s.t0)) }); return; }
    cam(960, 540, 1.6); W.crash(g, t, { hx: 900, face: { eyes: 'wide', brow: 'up', look: [0, 0], scream: 1, sweat: true } }); return { shake: hand };
  },
  title(t, s) {                                   // portal jump into the next zone, zone tag typed in
    const nx = s.next; if (nx && SC[nx.scene]) { const r = SC[nx.scene](t, { ...nx, t0: s.t0 }) || {}; }
    T.setCam(); const k = ss(s.t0 + .1, s.t0 + 1.1, t), R = 1300 * k;
    g.save(); g.beginPath(); g.rect(0, 0, 1920, 1080); g.arc(960, 540, Math.max(1, R), 0, Math.PI * 2, true); g.clip('evenodd');
    g.fillStyle = '#071a2a'; g.fillRect(0, 0, 1920, 1080);
    for (let i = 0; i < 16; i++) { const a0 = t * 4 + i * .4; g.strokeStyle = i % 2 ? W.SCAN : '#9bff5a'; g.lineWidth = 34; g.globalAlpha = .85; g.beginPath(); for (let u = 0; u < 1; u += .02) { const r = 40 + u * 1300, a = a0 + u * 6; g[u ? 'lineTo' : 'moveTo'](960 + Math.cos(a) * r, 540 + Math.sin(a) * r); } g.stroke(); }
    g.globalAlpha = 1; g.restore();
    if (R > 1) { g.save(); g.strokeStyle = T.INK; g.lineWidth = 16; g.beginPath(); g.arc(960, 540, R, 0, Math.PI * 2); g.stroke(); g.strokeStyle = W.SCAN; g.lineWidth = 8; g.stroke(); g.restore(); }
  },
  jungle(t, s) { const tr = wt(s, 'поворачиваются') ?? wt(s, 'задерживаешь'); cam(900, 600, 1.05); W.jungle(g, t, { turn: after(t, tr) ? ss(tr, tr + .5, t) : 0, hx: 900 + ss(s.t0, s.t1, t) * 120, face: { eyes: 'wide', brow: 'worried', look: [-1, -.5], mouth: 0, sweat: after(t, tr) } }); return { shake: tr }; },
  swamp(t, s) { const st = wt(s, 'остановился') ?? s.t0 + 1, go = wt(s, 'шагай') ?? s.t1 - 1; const sink = t < st ? 0 : t < go ? ss(st, go, t) * .8 : .8 * (1 - ss(go, go + 1, t)); cam(900 + (after(t, go) ? (t - go) * 120 : 0), 600, 1.05); W.swamp(g, t, { sink, walk: t < st || after(t, go), hx: 760 + (after(t, go) ? (t - go) * 160 : 0) }); },
  desert(t, s) { const look = wt(s, 'смотрит') ?? s.t1 - 1, two = wt(s, 'второе'); cam(1100, 500, 1 + .25 * ss(look - .3, look + .5, t)); W.desert(g, t, { eye: after(t, look) ? ss(look, look + .3, t) : 0, lookX: -.6, cover: after(t, look + .3), hx: 880 }); return { shake: look }; },
  lakes(t, s) { const mv = wt(s, 'шевелится'), drink = wt(s, 'пьешь'); cam(960, 620, 1); W.lakes(g, t, { wiggle: after(t, mv) ? ss(mv, mv + .5, t) : 0, kneel: after(t, drink), hx: after(t, drink) ? 760 : 960 - ss(s.t0, mv ?? s.t1, t) * 150, face: { eyes: after(t, mv) && !after(t, drink) ? 'wide' : 'open', brow: 'worried', look: [after(t, drink) ? -1 : 1, .4] } }); return { shake: mv }; },
  ice(t, s) { const nm = wt(s, 'имени') ?? s.t1 - 1, ec = wt(s, 'эхо'); cam(900, 560, 1 + .2 * ss(nm - .2, nm + .6, t)); W.ice(g, t, { call: after(t, ec) ? ss(ec, ec + 1.2, t) * .9 : 0, face: { eyes: 'wide', brow: 'up', look: [1, -.4], sweat: true, mouth: after(t, nm) ? .4 : 0 } }); return { shake: nm }; },
  second_pod(t, s) { const tv = wt(s, 'твоя'); cam(1100 + 200 * ss(s.t0, s.t1, t), 600, 1 + .25 * ss(s.t0, s.t1, t)); W.beige(g, t, { walk: true, hx: 600 + ss(s.t0, s.t1, t) * 300, face: { eyes: after(t, tv) ? 'wide' : 'open', brow: 'worried', look: [1, -.3] } }); return { shake: tv }; },
  second_pod_scratch(t, s) { const k = wt(s, 'сорок'), dn = wt(s, 'сдавайся') ?? s.t1; cam(1100, 540, 1 + .15 * ss(s.t0, s.t1, t)); W.hull(g, t, { old: true, reveal: 1, tally: after(t, k) ? 41 * ss(k, k + 1.2, t) : 0, extra: after(t, wt(s, 'раз')) ? '41 раз. Не сдавайся' : null, extraReveal: clamp((t - (wt(s, 'раз') ?? t)) / (Math.max(.3, dn - (wt(s, 'раз') ?? t)))) }); },
  loop(t, s) {
    const knife = wt(s, 'берешь') ?? s.t0 + 2, next = wt(s, 'следующего');
    if (t < knife) { cam(1250, 760, 1.3); W.loopField(g, t, { n: 0, hx: 1000, face: { eyes: 'half', brow: 'sad', look: [1, 0] } }); return; }
    if (next == null || t < next) { cam(1250, 820, 1.6); W.loopField(g, t, { n: 0, hx: 1030, scratch: true, face: { eyes: 'open', brow: 'sad', look: [1, .3] } }); return; }
    const k = ss(next, next + 2.5, t); cam(1250 - 290 * k, 820 - 280 * k, 1.6 - .6 * k); W.loopField(g, t, { n: 41, hx: 1030, scratch: false, face: { eyes: 'half', brow: 'sad', look: [1, 0] } });
  },
  question(t, s) { cam(960, 540, 1); W.loopField(g, t, { n: 41, hx: 1030, fall: ss(s.t0, s.t1, t), face: { eyes: 'wide', brow: 'up', look: [1, -1] } }); },
};
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function shakeAt(t, t0, amp = 22) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[1, -1, .8, -.7, .5, -.4, .3, -.1, 0][k] * amp, [.3, -.6, .5, -.3, .2, -.2, .1, 0, 0][k] * amp]; }
function draw(t) {
  t_ = t; T.setTime(t); const s = segAt(t), f = SC[s.scene] || SC.crash;
  SH = [0, 0]; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
  let r = f(t, s) || {};
  if (r.shake != null && t > r.shake && t < r.shake + .4) { SH = shakeAt(t, r.shake); g.fillRect(0, 0, 1920, 1080); r = f(t, s) || {}; }
  T.setCam(); T.setRot(0);
  if (s.scene !== 'title' && t - s.t0 < .12 && s.i > 0) T.tint(g, '#ffffff', .5 * (1 - (t - s.t0) / .12));     // cut flash
  // zone tag (retro terminal) typed in at every portal jump, stays 3.5 s
  const ts = [...SEG].reverse().find(x => x.scene === 'title' && t >= x.t0 && t < x.t0 + 3.6);
  if (ts && ts.next) { const tag = `ЗОНА ${ts.n} · ${ZONE[ts.next.scene] || ''}`, n = Math.floor(clamp((t - ts.t0 - .25) * 34, 0, tag.length)), a = clamp((ts.t0 + 3.6 - t) / .3);
    if (n) { g.save(); g.globalAlpha = a; g.font = '800 46px JBMono'; g.textBaseline = 'middle'; const w = g.measureText(tag).width, y = 790; g.fillStyle = 'rgba(7,26,42,.85)'; g.fillRect(40, y - 36, w + 48, 72); g.strokeStyle = W.SCAN; g.lineWidth = 4; g.strokeRect(40, y - 36, w + 48, 72); g.fillStyle = W.SCAN; g.fillText(tag.slice(0, n) + (Math.floor(t * 4) % 2 ? '_' : ''), 64, y); g.restore(); } }
  if (t > CU.total - .8) T.tint(g, '#000', (t - (CU.total - .8)) / .8);
}
