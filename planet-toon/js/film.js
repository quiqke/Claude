// film.js — «7 правил выживания на чужой планете»: scenes keyed to spoken words, a portal jump into every new zone.
import * as T from './toon.js';
import * as W from './world.js';
let g, CU, SEG = [], EV = [], SH = [0, 0], PUNCH = [], CUTS = [], BIGW = [], FREEZE = [], POLL = null, STOP = null, SUB = null, O2 = [];
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
  // retention cuts: a new framing every 3–5 s, preferably where a caption phrase starts
  const pages = cues.pages.map(p => p.t0);
  for (const sg of SEG) { if (sg.scene === 'title') continue; let last = sg.t0; const cand = pages.filter(x => x > sg.t0 + 1 && x < sg.t1 - 1).sort((a, b) => a - b);
    for (const c of cand) { while (c - last > 5.2) { last += 4; CUTS.push(last); } if (c - last >= 3) { CUTS.push(c); last = c; } }
    while (sg.t1 - last > 5.5) { last += 4; CUTS.push(last); } }
  CUTS.sort((a, b) => a - b);
  const wsc = (sc, pat, n = 0) => { for (const sg of SEG) if (sg.scene === sc) { const x = wt(sg, pat, n); if (x != null) return x; } return null; };
  const pr = wsc('second_pod', 'рука'); if (pr != null) POLL = { t0: pr, ans: wsc('second_pod', 'шестое') ?? pr + 4, t1: (wsc('second_pod', 'обратно') ?? pr + 7) + 1.2 };
  STOP = wsc('loop', 'поднимаешь');
  if (POLL) FREEZE.push([POLL.t0, POLL.t0 + 2.2]); if (STOP != null) FREEZE.push([STOP, STOP + 1.5, STOP - .15]);
  SUB = cues.total * .35; for (const sg of SEG) if (sg.scene === 'title' && SUB > sg.t0 - 1 && SUB < sg.t1 + 3.6) SUB = sg.t1 + 4;
  O2 = (cues.fx || []).filter(e => e.type === 'stat' && e.name === 'КИСЛОРОД' && e.value != null).map(e => [e.t, e.value]);
  if (POLL) { ev(POLL.t0, 'poll'); ev(POLL.ans, 'answer'); } if (STOP != null) ev(STOP, 'stop'); ev(SUB, 'subscribe');
  for (const e of cues.fx || []) if (e.type === 'danger' && e.value >= 90) ev(e.t, 'silence');
  // big kinetic words: the first word of every red «опасность» group
  for (const pg of cues.pages) { let pc = null; for (const w of pg.words) { if (w.c === 'danger' && pc !== 'danger') BIGW.push({ t: w.t0, w: w.w.replace(/[«»"“”.,:;!?—…]/g, '').toUpperCase() }); pc = w.c; } }
  for (const s of SEG) { if (s.scene === 'title') { ev(s.t0, 'whoosh'); ev(s.t0 + .1, 'portal'); } }
  for (const p of PUNCH) ev(p, 'hit', { v: .7 });
  for (const ta of [2.3, 4.6, 6.8]) ev(ta, 'hit', { v: .45 });
  return { draw, EV };
}
const norm = w => w.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, nth = 0) { if (!seg) return null; let k = 0; const p = norm(pat); for (const l of seg.lines) for (const w of l.words) if (norm(w.w).startsWith(p)) { if (k++ === nth) return w.t0; } return null; }
const after = (t, a) => a != null && t >= a;
function shotInfo(t) { const s = segAt(t); let k = 0, st = s.t0; for (const c of CUTS) { if (c <= s.t0) continue; if (c > t) break; k++; st = c; } return { k, st }; }
function cam(x = 960, y = 540, z = 1, focus = null) {
  let pz = 0; for (const p of PUNCH) if (t_ >= p && t_ < p + .35) pz = .14 * (1 - (t_ - p) / .35);
  const { k, st } = shotInfo(t_), v = k % 4, p = clamp((t_ - st) / 5);
  if (v === 1) { if (focus) { x = focus[0]; y = focus[1]; z = Math.max(z * 1.9, 2.2); } else { y -= 60; z *= 1.45; } }
  else if (v === 2) { x += 170; y += 30; z *= 1.22; } else if (v === 3) { x -= 150; y -= 20; z *= .92; }
  z = Math.min(3.2, z) * (1 + .05 * p); x += (k % 2 ? 30 : -30) * p;
  const wp = t_ - st; let wx = 0; if (k > 0 && wp < .12) wx = (k % 2 ? 1 : -1) * 240 * (1 - wp / .12);
  T.setCam(x, y, z * (1 + pz), SH[0] + wx, SH[1]);
}
let t_ = 0;

// framing inside a long segment: the k-th spoken line picks wide / close-up / medium so the picture keeps moving
function lineIdx(seg, t) { let k = 0; seg.lines.forEach((l, i) => { if (t >= l.t0 - .15) k = i; }); return k; }
const HEAD_Y = 655;
function frame(seg, t, hx, wide = [960, 560, 1]) { return cam(wide[0], wide[1], wide[2], [hx, HEAD_Y]); }
const SC = {
  crash(t, s) {
    const scr = wt(s, 'экран'), out = wt(s, 'выбираешься'), mem = wt(s, 'последнее'), k = ss(s.t0, s.t1, t);
    if (scr != null && t >= scr - .2 && (out == null || t < out - .2)) { cam(); W.screen(g, t, ['! АТМОСФЕРА НЕПРИГОДНА', 'СВЯЗИ НЕТ', 'СПАСЕНИЕ НЕ ОЖИДАЕТСЯ'], { alarm: true, typed: t - scr }); return; }
    if (mem != null && t >= mem - .2) { const off = wt(s, 'погас'); cam(960, 540, 1 + .1 * ss(mem, s.t1, t)); W.flashback(g, t, { out: off != null && t >= off ? ss(off, off + 1, t) : 0 }); return; }
    if (out != null && t >= out - .2) { cam(1000, 520, 1.1, [520, HEAD_Y]); W.crash(g, t, { hx: 520, face: { eyes: 'open', brow: 'up', look: [1, -1], mouth: .2 } }); return; }
    cam(1000, 560, 1.25 - .2 * k, [560 + 120 * k, HEAD_Y]); W.crash(g, t, { hx: 560 + 120 * k, face: { eyes: 'wide', brow: 'up', look: [1, 0], sweat: true, mouth: .3 } });
  },
  scratches(t, s) {
    const hand = wt(s, 'твой') ?? s.t0 + 3, num = wt(s, 'сорок'), dec = wt(s, 'скафандр');
    if (dec != null && t >= dec - .2) { cam(560, HEAD_Y, 2.2); W.crash(g, t, { hx: 560, face: { eyes: 'half', brow: 'angry', look: [1, 0], smile: .2 } }); return; }
    if (num != null && t >= num - .2) { cam(1100, 760, 1.25); W.hull(g, t, { reveal: 1, extra: '41', extraReveal: ss(num, num + .6, t) }); return { shake: num }; }
    if (t < hand) { cam(960, 540, 1 + .1 * ss(s.t0, hand, t)); W.hull(g, t, { reveal: clamp((t - s.t0) / Math.max(.5, hand - s.t0)) }); return; }
    cam(560, HEAD_Y, 2.4); W.crash(g, t, { hx: 560, face: { eyes: 'wide', brow: 'up', look: [1, 0], scream: 1, sweat: true } }); return { shake: hand };
  },
  title(t, s) {
    const nx = s.next; if (nx && SC[nx.scene]) SC[nx.scene](t, { ...nx, t0: s.t0 });
    T.setCam(); const k = ss(s.t0 + .1, s.t0 + 1.1, t), R = 1300 * k;
    g.save(); g.beginPath(); g.rect(0, 0, 1920, 1080); g.arc(960, 540, Math.max(1, R), 0, Math.PI * 2, true); g.clip('evenodd');
    g.fillStyle = '#071a2a'; g.fillRect(0, 0, 1920, 1080);
    for (let i = 0; i < 16; i++) { const a0 = t * 4 + i * .4; g.strokeStyle = i % 2 ? W.SCAN : '#9bff5a'; g.lineWidth = 34; g.globalAlpha = .85; g.beginPath(); for (let u = 0; u < 1; u += .02) { const r = 40 + u * 1300, a = a0 + u * 6; g[u ? 'lineTo' : 'moveTo'](960 + Math.cos(a) * r, 540 + Math.sin(a) * r); } g.stroke(); }
    g.globalAlpha = 1; g.restore();
    if (R > 1) { g.save(); g.strokeStyle = T.INK; g.lineWidth = 16; g.beginPath(); g.arc(960, 540, R, 0, Math.PI * 2); g.stroke(); g.strokeStyle = W.SCAN; g.lineWidth = 8; g.stroke(); g.restore(); }
  },
  jungle(t, s) {
    const cr = wt(s, 'хрустит'), tr = cr ?? wt(s, 'поворачиваются'), away = wt(s, 'отворачиваются'), steps = wt(s, 'следы'), hx = 900 + ss(s.t0, s.t1, t) * 160;
    const turn = after(t, tr) ? (after(t, away) ? 1 - ss(away, away + 1.2, t) : ss(tr, tr + .5, t)) : 0;
    frame(s, t, hx, [900, 600, 1.05]);
    W.jungle(g, t, { turn, hx, face: { eyes: after(t, tr) && !after(t, away) ? 'wide' : 'open', brow: 'worried', look: [-1, -.5], mouth: 0, sweat: after(t, tr) } });
    if (after(t, steps)) for (let i = 0; i < 6; i++) T.shape(g, T.ell(hx + 160 + i * 110, 1040 + (i % 2) * 24, 26, 12, 12), { fill: '#2a0838', line: false, seed: i });
    return { shake: cr };
  },
  swamp(t, s) {
    const st = wt(s, 'останавливаешься') ?? s.t0 + 2, go = wt(s, 'шагай') ?? st + 4, hel = wt(s, 'шлем');
    const sink = t < st ? 0 : t < go ? ss(st, go, t) * .8 : .8 * (1 - ss(go, go + 1.2, t)), hx = 760 + (after(t, go) ? Math.min(500, (t - go) * 90) : 0);
    if (after(t, hel)) { cam(1350, 760, 1.4); W.swamp(g, t, { sink: 0, walk: true, hx: Math.min(1250, hx) }); W.helmetInMud(g, 1560, 980); return { shake: hel }; }
    frame(s, t, hx, [900, 600, 1.05]); W.swamp(g, t, { sink, walk: t < st || after(t, go), hx });
  },
  desert(t, s) {
    const look = wt(s, 'смотрит'), scr = wt(s, 'экран'), two = wt(s, 'две'), rest = wt(s, 'садишься'), hx = 880;
    if (after(t, rest)) { cam(hx, HEAD_Y + 60, 2); W.desert(g, t, { eye: 1, lookX: -.6, hx, face: { eyes: 'half', brow: 'sad', look: [0, .6], sweat: true } }); return; }
    if (after(t, scr) && !after(t, two)) { cam(); W.screen(g, t, ['ОБЪЕКТ «СОЛНЦЕ-2»', 'ДИСТАНЦИЯ: −1 КМ / ВЗГЛЯД', 'НЕ СМОТРИ ВВЕРХ'], { alarm: true, typed: t - scr, bg: '#c95a1a' }); return; }
    if (after(t, two)) { cam(1100, 860, 1.25); W.desert(g, t, { eye: 1, lookX: -.6, cover: false, hx, face: { eyes: 'wide', brow: 'up', look: [1, 1], sweat: true } }); W.shadows(g, hx, 1010, t); return { shake: two }; }
    cam(1100, 500, 1 + .25 * (look != null ? ss(look - .3, look + .5, t) : 0)); W.desert(g, t, { eye: after(t, look) ? ss(look, look + .3, t) : 0, lookX: -.6, cover: after(t, look + .3), hx });
    return { shake: look };
  },
  lakes(t, s) {
    const mv = wt(s, 'шевелится'), scr = wt(s, 'экран'), blue = wt(s, 'синему'), sigh = wt(s, 'вздыхает');
    if (after(t, scr) && !after(t, blue)) { cam(); W.screen(g, t, ['АНАЛИЗ ЖИДКОСТИ', 'КРАСНАЯ: ЖИВАЯ', 'СИНЯЯ: H2O + Fe'], { alarm: true, typed: t - scr, bg: '#5a2030' }); return; }
    if (after(t, blue)) { if (after(t, sigh)) cam(1420, 820, 1.4); else cam(760, HEAD_Y + 110, 1.8); W.lakes(g, t, { wiggle: after(t, sigh) ? .4 : 0, kneel: true, hx: 760, face: { eyes: 'half', brow: 'neutral', look: [-1, .5] } }); return; }
    frame(s, t, 1100, [960, 620, 1]); W.lakes(g, t, { wiggle: after(t, mv) ? ss(mv, mv + .5, t) : 0, hx: 1100 - ss(s.t0, mv ?? s.t1, t) * 100, face: { eyes: after(t, mv) ? 'wide' : 'open', brow: 'worried', look: [1, .4] } }); return { shake: mv };
  },
  ice(t, s) {
    const ec = wt(s, 'эхо'), nm = wt(s, 'имени'), mic = wt(s, 'зажимаешь'), hand = wt(s, 'иней');
    if (after(t, hand)) { cam(1650, 420, 1.5); W.ice(g, t, { call: 0, face: { eyes: 'half', brow: 'worried', look: [1, -.4] } }); W.frostHand(g, 1650, 420, ss(hand, hand + 1, t)); return; }
    frame(s, t, 900, [900, 560, 1]);
    W.ice(g, t, { call: after(t, nm) && !after(t, hand) ? .9 : after(t, ec) ? .35 : 0, face: { eyes: 'wide', brow: 'up', look: [1, -.4], sweat: true, mouth: after(t, mic) ? 0 : after(t, nm) ? .4 : 0 } });
    return { shake: nm };
  },
  second_pod(t, s) {
    const tv = wt(s, 'твоя'), hand = wt(s, 'рука'), back = wt(s, 'обратно'), k = ss(s.t0, s.t1, t);
    if (after(t, hand)) { cam(1450, 640, 1.8); W.beige(g, t, { hx: 1180, face: { eyes: after(t, back) ? 'half' : 'open', brow: 'sad', look: [1, 0] } }); return; }
    cam(1000 + 300 * k, 600, 1 + .25 * k); W.beige(g, t, { walk: true, hx: 600 + k * 400, face: { eyes: after(t, tv) ? 'wide' : 'open', brow: 'worried', look: [1, -.3] } }); return { shake: tv };
  },
  second_pod_scratch(t, s) {
    const k = wt(s, 'считаешь') ?? wt(s, 'сорок'), r = wt(s, 'приписка') ?? wt(s, 'сорок', 1), dn = s.t1;
    cam(1100, 540, 1 + .15 * ss(s.t0, s.t1, t));
    W.hull(g, t, { old: true, reveal: 1, tally: after(t, k) ? 41 * ss(k, k + 1.5, t) : 0, extra: after(t, r) ? '41 раз. Не сдавайся. Это всё ещё ты' : null, extraReveal: r ? clamp((t - r) / Math.max(.5, dn - r - .5)) : 0 });
  },
  loop(t, s) {
    const knife = wt(s, 'берешь') ?? s.t0 + 2, eyes = wt(s, 'поднимаешь'), sit = wt(s, 'садишься');
    if (after(t, sit)) { const k = ss(sit, s.t1, t); cam(1100, 860 - 120 * k, 1.8 - .6 * k); W.loopField(g, t, { n: 41, hx: 1030, face: { eyes: t > sit + 3 ? 'closed' : 'half', brow: 'sad', smile: .3 } }); return; }
    if (after(t, eyes)) { const k = ss(eyes, eyes + 3, t); cam(1250 - 290 * k, 820 - 280 * k, 1.6 - .6 * k); W.loopField(g, t, { n: 41, hx: 1030, face: { eyes: 'wide', brow: 'up', look: [-1, -.3] } }); return { shake: wt(s, 'десятки') }; }
    if (t < knife) { cam(1250, 760, 1.3); W.loopField(g, t, { n: 0, hx: 1000, face: { eyes: 'half', brow: 'sad', look: [1, 0] } }); return; }
    cam(1250, 820, 1.6); W.loopField(g, t, { n: 0, hx: 1030, scratch: true, face: { eyes: 'open', brow: 'sad', look: [1, .3] } });
  },
  question(t, s) { cam(960, 540, 1); W.loopField(g, t, { n: 41, hx: 1030, fall: ss(s.t0, s.t1, t), face: { eyes: 'closed', brow: 'sad', smile: .3 } }); },
};
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function shakeAt(t, t0, amp = 22) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[1, -1, .8, -.7, .5, -.4, .3, -.1, 0][k] * amp, [.3, -.6, .5, -.3, .2, -.2, .1, 0, 0][k] * amp]; }
function draw(t) {
  const tReal = t; for (const [a, b, ft] of FREEZE) if (t >= a && t < b) t = ft ?? a;          // freeze-frame windows
  t_ = t; T.setTime(t); const s = segAt(t), f = SC[s.scene] || SC.crash;
  SH = [0, 0]; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
  // flash-forward teaser inside the hook: 0.35 s glimpses of what is coming, with a glitch
  const TZ = [[2.3, () => { T.setCam(1460, 260, 2.2); W.desert(g, t, { eye: 1, lookX: -.2, hx: 880 }); }], [4.6, () => { T.setCam(900, 420, 1.5); W.ice(g, t, { call: .9 }); }], [6.8, () => { T.setCam(960, 600, .95); W.loopField(g, t, { n: 41, hero: false }); }]];
  for (const [ta, fn] of TZ) if (t >= ta && t < ta + .35) { fn(); T.setCam(); T.tint(g, '#3df2ff', .12); for (let i = 0; i < 6; i++) { const y = (i * 173 + Math.floor(t * 24) * 61) % 1080; g.drawImage(g.canvas, 0, y, 1920, 40, (i % 2 ? 30 : -30), y, 1920, 40); } return; }
  let r = f(t, s) || {};
  if (r.shake != null && t > r.shake && t < r.shake + .4) { SH = shakeAt(t, r.shake); g.fillRect(0, 0, 1920, 1080); r = f(t, s) || {}; }
  T.setCam(); T.setRot(0);
  if (s.scene !== 'title' && t - s.t0 < .12 && s.i > 0) T.tint(g, '#ffffff', .5 * (1 - (t - s.t0) / .12));     // cut flash
  // zone tag (retro terminal) typed in at every portal jump, stays 3.5 s
  const ts = [...SEG].reverse().find(x => x.scene === 'title' && t >= x.t0 && t < x.t0 + 3.6);
  if (ts && ts.next) { const tag = `ЗОНА ${ts.n} · ${ZONE[ts.next.scene] || ''}`, n = Math.floor(clamp((t - ts.t0 - .25) * 34, 0, tag.length)), a = clamp((ts.t0 + 3.6 - t) / .3);
    if (n) { g.save(); g.globalAlpha = a; g.font = '800 46px JBMono'; g.textBaseline = 'middle'; const w = g.measureText(tag).width, y = 790; g.fillStyle = 'rgba(7,26,42,.85)'; g.fillRect(40, y - 36, w + 48, 72); g.strokeStyle = W.SCAN; g.lineWidth = 4; g.strokeRect(40, y - 36, w + 48, 72); g.fillStyle = W.SCAN; g.fillText(tag.slice(0, n) + (Math.floor(t * 4) % 2 ? '_' : ''), 64, y); g.restore(); } }
  t = tReal; T.setCam();
  if (FREEZE.some(([a, b]) => t >= a && t < b)) { T.tint(g, '#1a1030', .25); }
  hudExtras(t, s);
  // kinetic words: a huge red word pops behind the captions on every «опасность» word
  for (const b of BIGW) if (t >= b.t && t < b.t + .7 && s.scene !== 'title') { const p = (t - b.t) / .7, sc = p < .15 ? .6 + p / .15 * .5 : 1.1 - .1 * p; g.save(); g.globalAlpha = p > .75 ? (1 - p) / .25 : 1; g.translate(960, 470); g.rotate(-.06); g.scale(sc, sc); g.font = '900 190px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 34; g.strokeStyle = T.INK; g.strokeText(b.w, 0, 0); g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText(b.w, 0, 0); g.fillStyle = '#ff3a2a'; g.fillText(b.w, 0, 0); g.restore(); }
  if (t > CU.total - .8) T.tint(g, '#000', (t - (CU.total - .8)) / .8);
}

// ── retention extras: live oxygen timer, route map, poll, СТОП, subscribe pop
const ZORDER = ['jungle', 'swamp', 'desert', 'lakes', 'ice', 'second_pod', 'loop'];
const ZPOS = [[110, 70], [200, 40], [270, 95], [210, 150], [120, 170], [55, 120], [150, 115]];
function o2At(t) { if (!O2.length) return null; let v = O2[0][1]; for (let i = 0; i < O2.length; i++) { const [a, va] = O2[i], nx = O2[i + 1]; if (t >= a) v = nx ? va + (nx[1] - va) * clamp((t - a) / Math.max(.1, nx[0] - a)) : va; } return v; }
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function hudExtras(t, s) {
  g.save(); g.textBaseline = 'middle';
  // 3) live oxygen timer (7 h of air mapped from the bar; seconds keep ticking)
  const v = o2At(t); if (v != null && s.scene !== 'question') { const secs = Math.max(0, v / 100 * 7 * 3600 - (t * 37) % 60), hh = Math.floor(secs / 3600), mm = Math.floor(secs % 3600 / 60), sc = Math.floor(secs % 60);
    const txt = `ВОЗДУХ ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(sc).padStart(2, '0')}`, low = v < 20, blink = low && Math.floor(t * 3) % 2;
    g.font = '800 40px JBMono'; const w = g.measureText(txt).width + 44; rr(960 - w / 2, 22, w, 60, 16); g.fillStyle = low ? 'rgba(120,0,0,.75)' : 'rgba(7,26,42,.75)'; g.fill(); g.strokeStyle = low ? '#ff5a4a' : W.SCAN; g.lineWidth = 3; g.stroke();
    g.fillStyle = blink ? '#ffffff' : low ? '#ff5a4a' : W.SCAN; g.textAlign = 'center'; g.fillText(txt, 960, 53); }
  // 6) route map for 4 s after each portal jump
  const ts = [...SEG].reverse().find(x => x.scene === 'title' && t >= x.t1 && t < x.t1 + 4);
  if (ts && ts.next) { const zi = ZORDER.indexOf(ts.next.scene); if (zi >= 0) { const a = Math.min(clamp((t - ts.t1) / .3), clamp((ts.t1 + 4 - t) / .4)), X = 1560, Y = 700; g.globalAlpha = a;
    rr(X - 10, Y - 10, 340, 230, 20); g.fillStyle = 'rgba(7,26,42,.82)'; g.fill(); g.strokeStyle = W.SCAN; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(X + 160, Y + 110, 100, 0, 7); g.fillStyle = '#3a2f5c'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.setLineDash([8, 8]); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); ZPOS.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](X + x, Y + y)); g.stroke(); g.setLineDash([]);
    ZPOS.forEach(([x, y], i) => { g.beginPath(); g.arc(X + x, Y + y, i === zi ? 12 : 7, 0, 7); g.fillStyle = i < zi ? '#7dff6a' : i === zi ? (Math.floor(t * 4) % 2 ? '#ffd23f' : '#ffffff') : '#8a8fb0'; g.fill(); });
    const pk = clamp((t - ts.t1) / 1.5), pa = ZPOS[Math.max(0, zi - 1)], pb = ZPOS[zi]; g.beginPath(); g.arc(X + pa[0] + (pb[0] - pa[0]) * pk, Y + pa[1] + (pb[1] - pa[1]) * pk, 9, 0, 7); g.fillStyle = W.SCAN; g.fill();
    g.font = '800 22px JBMono'; g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.fillText(`МАРШРУТ ${zi + 1}/7`, X + 10, Y + 205); g.globalAlpha = 1; } }
  // 1) poll before the twist
  if (POLL && t >= POLL.t0 && t < POLL.t1) { const a = Math.min(clamp((t - POLL.t0) / .25), clamp((POLL.t1 - t) / .3)), ans = t >= POLL.ans; g.globalAlpha = a;
    rr(560, 250, 800, 330, 34); g.fillStyle = 'rgba(20,10,40,.92)'; g.fill(); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.stroke();
    g.font = '900 64px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('А ТЫ БЫ ОТКРЫЛ?', 960, 325);
    [['ДА', 760, '#3df2ff'], ['НЕТ', 1160, '#ff5a4a']].forEach(([lab, x, col], i) => { const sel = ans && i === 1, dim = ans && i === 0; rr(x - 150, 400, 300, 120, 26); g.fillStyle = sel ? col : dim ? 'rgba(80,80,100,.6)' : 'rgba(255,255,255,.1)'; g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke();
      g.font = '900 64px Rubik'; g.fillStyle = sel ? '#14081e' : '#ffffff'; g.fillText(lab + (sel ? ' ✓' : ''), x, 462); });
    if (!ans) { g.font = '700 30px Rubik'; g.fillStyle = '#ffd23f'; g.fillText('ПИШИ ОТВЕТ В КОММЕНТАРИЯХ 👇', 960, 600); } g.globalAlpha = 1; }
  // 2) СТОП freeze before the reveal
  if (STOP != null && t >= STOP && t < STOP + 1.5) { const k = t - STOP, n = 3 - Math.floor(k / .5);
    g.save(); g.translate(960, 420); g.rotate(-.08); g.font = '900 230px Rubik'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 40; g.strokeStyle = '#231629'; g.strokeText('СТОП', 0, 0); g.lineWidth = 14; g.strokeStyle = '#fff'; g.strokeText('СТОП', 0, 0); g.fillStyle = '#ff3a2a'; g.fillText('СТОП', 0, 0); g.restore();
    if (n > 0) { g.font = '900 120px Rubik'; g.textAlign = 'center'; g.lineWidth = 18; g.strokeStyle = '#231629'; g.strokeText(String(n), 960, 620); g.fillStyle = '#ffd23f'; g.fillText(String(n), 960, 620); } }
  // 4) subscribe pop at ~35 %
  if (SUB != null && t >= SUB && t < SUB + 3.2) { const k = t - SUB, a = Math.min(clamp(k / .3), clamp((3.2 - k) / .3)), pressed = k > 1.3, x = 1460 + (1 - a) * 500, y = 860;
    g.globalAlpha = a; rr(x, y - 50, 400, 100, 50); g.fillStyle = pressed ? '#5a5a6a' : '#e62117'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.font = '900 40px Rubik'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(pressed ? 'ВЫ ПОДПИСАНЫ' : 'ПОДПИСАТЬСЯ', x + 200, y + 2);
    const bx = x + 440, sw = pressed ? Math.sin(k * 25) * .4 * clamp(1 - (k - 1.3) / 1) : 0; g.save(); g.translate(bx, y); g.rotate(sw); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-26, 18); g.quadraticCurveTo(-26, -30, 0, -32); g.quadraticCurveTo(26, -30, 26, 18); g.closePath(); g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 5; g.stroke(); g.beginPath(); g.arc(0, 24, 7, 0, 7); g.fill(); g.restore();
    const hx = x + 200 + (1 - clamp((k - .6) / .6)) * 220, hy = y + 40 + (1 - clamp((k - .6) / .6)) * 120 - (pressed && k < 1.5 ? 0 : 0); g.beginPath(); g.arc(hx, hy, 34, 0, 7); g.fillStyle = '#f4f1ea'; g.fill(); g.strokeStyle = '#231629'; g.lineWidth = 6; g.stroke();
    g.globalAlpha = 1; }
  g.restore();
}
