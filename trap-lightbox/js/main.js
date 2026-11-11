// «Ловушка» — Paper-cut Lightbox, vertical 1080×1920 @ 30 fps. The voice timeline (voice/dur.json + pauses) drives shots, subtitles and the mix.
import * as THREE from 'three';
import { Pipe } from './post.js';
import { dispose } from './stage.js';
import { ss, seg, clamp } from './lib.js';
import * as SH from './shots.js';

const Q = new URLSearchParams(location.search), SSAA = +(Q.get('ssaa') || 1.5);
export const SW = 1080, SH_ = 1920;
const GAP = { l03: .35, l04: .28, l05: .75, l06: .4, l08: .35, l09: .45 }, START = .25, TAIL = 1.5;
const dur = await (await fetch('voice/dur.json')).json(), lines = await (await fetch('lines.json')).json();
const VO = {}; { let t = START; for (const L of lines) { VO[L.id] = +t.toFixed(3); t += dur[L.id] + (GAP[L.id] ?? .22); } }
const END = +(VO.l10 + dur.l10 + TAIL).toFixed(2);
const LN = Object.fromEntries(lines.map(L => [L.id, L]));
const F = (id, f) => VO[id] + dur[id] * f;
const AT = (id, word, k = 0) => { const s = (LN[id].say || LN[id].text).toLowerCase(); let i = -1; for (let n = 0; n <= k; n++) { i = s.indexOf(word.toLowerCase(), i + 1); if (i < 0) throw new Error(`"${word}" not in ${id}`); } return VO[id] + .03 + (dur[id] - .1) * (i / s.length); };

// shot plan: [builder, start, transition, variant]
const PLAN = Q.has('shot') ? [[Q.get('shot'), 0, 'cut', Q.get('variant')]] : [
  ['twoWindows', 0, 'cut'],
  ['trapTease', VO.l03 - .25, 'dissolve'],
  ['dig', VO.l04 - .25, 'dissolve'],
  ['camp', VO.l05 - .25, 'dissolve'],
  ['growth', VO.l07 - .35, 'dissolve'],
  ['cityBox', AT('l09', 'ловушка') + .1, 'cut'],
  ['twoWindows', VO.l10 - .3, 'dissolve', 'phone'],
];
const DISS = .7;
const plan = PLAN.map(([id, start, tr, variant]) => ({ id, start, tr, variant }));
plan.forEach((s, i) => { s.end = i + 1 < plan.length ? plan[i + 1].start : END; });
window.DUR = END;

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(SSAA); renderer.setSize(SW, SH_, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const pipe = new Pipe(renderer, SW, SH_, SSAA);
await Promise.all([document.fonts.load('700 40px Cormorant', 'Ловушка 17'), document.fonts.load('600 40px Cormorant', 'Ловушка')]);

const live = new Map();
function get(i) { if (!live.has(i)) { const p = plan[i]; live.set(i, SH[p.id]({ VO, D: dur, F, AT, T0: p.start, dur: p.end - p.start, variant: p.variant })); } return live.get(i); }
function gc(keep) { for (const [i, s] of live) if (!keep.includes(i)) { dispose(s.S.scene); live.delete(i); } }
function draw(i, t, target) { const s = get(i); s.update(t); pipe.shot(s.S.scene, s.S.cam, s.post(), target); return s.grade(t); }

// subtitles: clauses ≤ 30 chars, timed by character position in the spoken line
const SUBS = [];
for (const L of lines) {
  const txt = L.text, t0 = VO[L.id], d = dur[L.id];
  const parts = txt.match(/[^,.:!?—]+[,.:!?—…]*\s*/g).reduce((acc, p) => { const last = acc[acc.length - 1]; if (last != null && (last + p).trim().length <= 44) acc[acc.length - 1] += p; else acc.push(p); return acc; }, []);
  let c0 = 0;
  for (const p of parts) { const f0 = c0 / txt.length, f1 = (c0 + p.trimEnd().length) / txt.length; c0 += p.length; SUBS.push({ t0: t0 + f0 * d - .08, t1: t0 + f1 * d + .25, text: p.trim().replace(/\s*—$/, '').replace(/(\d) (\d)/g, '$1 $2') }); }
}
for (let i = 0; i < SUBS.length - 1; i++) { const a = SUBS[i], b = SUBS[i + 1]; if (b.t0 - a.t1 < .2 && (a.t1 - a.t0 < 1.4 || b.t1 - b.t0 < 1.4) && (a.text + ' ' + b.text).length <= 50) { a.text += ' ' + b.text; a.t1 = b.t1; SUBS.splice(i + 1, 1); i--; } }
for (let i = 0; i < SUBS.length - 1; i++) SUBS[i].t1 = Math.min(Math.max(SUBS[i].t1, SUBS[i].t0 + 1.5), SUBS[i + 1].t0 - .04);
const sub = document.getElementById('sub'), subT = sub.querySelector('.t');

function R(t) {
  let i = plan.findIndex(p => t >= p.start && t < p.end); if (i < 0) i = plan.length - 1;
  const p = plan[i], tl = t - p.start;
  let g, mixB = 0;
  if (i > 0 && p.tr === 'dissolve' && tl < DISS) { draw(i - 1, t, pipe.rtA); g = draw(i, t, pipe.rtB); mixB = ss(tl / DISS); gc([i - 1, i]); }
  else { g = draw(i, t, pipe.rtA); gc([i]); }
  pipe.final({ ...g, mixB, fade: (g.fade ?? 1) * ss(clamp(t / .35)) * (1 - ss(seg(t, END - .5, END))) });
  let c = null, a = 0;
  for (const q of SUBS) if (t > q.t0 && t < q.t1) { c = q; a = Math.min(ss(seg(t, q.t0, q.t0 + .18)), 1 - ss(seg(t, q.t1 - .2, q.t1))); }
  subT.textContent = c ? c.text : ''; sub.style.opacity = Q.has('nosub') ? 0 : a;
}
window.render = t => R(t);
window.EV = [{ t: 0, type: 'cues', VO, END, plan: plan.map(p => [p.id, p.start]) }, ...SUBS.map(s => ({ t: +s.t0.toFixed(3), type: 'sub', t1: +s.t1.toFixed(3), text: s.text }))];
window.__H = { VO, F, AT, END };
window.READY = true;
