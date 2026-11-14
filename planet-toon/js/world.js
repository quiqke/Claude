// world.js — «7 правил выживания на чужой планете», Sci-Fi Sitcom Toon: one palette per zone, thick boiling line,
// flat colour + hard shadows; the only glowing thing on the planet is your wrist scanner.
import * as T from './toon.js';
const { shape, line, ell, rect, rrect, person, face, dot, text, glowRings, tint, dark, setRot, INK } = T;
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
T.CAST.astro = { skin: '#f2b48a', skinS: '#d98a62', hair: '#5a3220', hairS: '#3e2116', coat: '#f4f1ea', coatS: '#cbc3b4', pants: '#f4f1ea', pantsS: '#cbc3b4', boots: '#5a5f6e', h: 1 };
export const SCAN = '#3df2ff';                       // the one glow colour

export const PAL = {
  crash:  { sky: ['#160d30', '#22124a', '#341a66', '#4a237c'], ground: ['#3a2f5c', '#2a2244'], far: '#2b2550', accent: '#ff7a3a' },
  jungle: { sky: ['#2a0a3a', '#3d0f52', '#55186e'], ground: ['#4a1a5a', '#36104a'], far: '#5c1d74', accent: '#ff4fa6' },
  swamp:  { sky: ['#14361f', '#1f4a2a', '#2f6230'], ground: ['#a6e22e', '#79b81f'], far: '#3f7a32', accent: '#e6ff5a' },
  desert: { sky: ['#ffb24a', '#ffc966', '#ffe08a'], ground: ['#e8742a', '#c95a1a'], far: '#f09040', accent: '#fff3c4' },
  lakes:  { sky: ['#1f2a5a', '#2a3a72', '#3d5292'], ground: ['#5a4a7a', '#463a62'], far: '#4a5a90', accent: '#d8323c' },
  ice:    { sky: ['#0d2a46', '#123a5a', '#1a4e72'], ground: ['#bfeeff', '#8fd6f2'], far: '#7fd4f2', accent: '#ffffff' },
  beige:  { sky: ['#efe6d2', '#e6dbc2', '#ddd0b2'], ground: ['#cdbd9c', '#b5a582'], far: '#d8caa8', accent: '#8a7a5a' },
  dusk:   { sky: ['#1b1035', '#3a1650', '#7a2a6a', '#e0603a'], ground: ['#3a2f5c', '#2a2244'], far: '#2b2550', accent: '#ff7a3a' },
};
const HZ = 640;
export function backdrop(g, t, P, o = {}) {
  T.bands(g, 1920, [0, 170, 330, 500].slice(0, P.sky.length), P.sky);
  if (o.stars) for (let i = 0; i < 70; i++) dot(g, hash(i, 1) * 2400 - 240, hash(i, 2) * 560, hash(i, 3) < .2 ? 3.5 : 2, '#e8e0ff');
  if (o.moons) { shape(g, ell(420, 200, 90, 90, 30), { fill: '#e9d8ff', shade: '#c4aee8', shadeOff: [-24, -16] }); shape(g, ell(600, 130, 36, 36, 20), { fill: '#ffd6a8', shade: '#e8b47a', shadeOff: [-10, -6] }); }
  shape(g, [[-400, HZ], ...Array.from({ length: 14 }, (_, i) => [-400 + i * 230, HZ - 40 - hash(i, 9) * 90]), [2800, HZ], [2800, 1400], [-400, 1400]], { fill: P.far, line: false, seed: 4 });
  shape(g, [[-400, HZ + 30], [2800, HZ + 10], [2800, 1500], [-400, 1500]], { fill: P.ground[0], shade: P.ground[1], shadeOff: [0, -40], seed: 5 });
}
// the astronaut: person + glass helmet + backpack + glowing wrist scanner
export function astro(g, x, fy, s, p = {}) {
  const r = person(g, 'astro', x, fy, s, p), [hx, hy] = r.head, R = r.R;
  // orange chest stripe and patch
  const d = p.facing || 1; shape(g, rrect(x - R * .55, fy - 520 * s * .7, R * 1.1, R * .28, R * .1), { fill: '#ff7a3a', lw: 5 });
  // helmet bubble
  g.save(); g.globalAlpha = .22; shape(g, ell(hx, hy + R * .1, R * 1.45, R * 1.4, 32), { fill: '#bfe8ff', line: false }); g.restore();
  line(g, ell(hx, hy + R * .1, R * 1.45, R * 1.4, 32, 0, Math.PI * 2.05), { lw: 7 });
  line(g, ell(hx - R * .2, hy - R * .25, R * .9, R * .85, 14, Math.PI * 1.1, Math.PI * 1.45), { line: '#ffffff', lw: 8 });
  shape(g, rrect(hx - R * 1.1, hy + R * 1.3, R * 2.2, R * .35, R * .15), { fill: '#cbc3b4', lw: 6 });
  // wrist scanner (the only glow)
  const [wx, wy] = r.hand; glowRings(g, wx, wy - 10, 46 * s / .62 * .5 + 20, SCAN, .35); shape(g, rrect(wx - 18 * s / .62, wy - 24 * s / .62, 36 * s / .62, 22 * s / .62, 6), { fill: SCAN, lw: 5 });
  return r;
}
// the escape capsule: rounded pod, orange stripes, dents, scorch
export function pod(g, x, y, s = 1, o = {}) {
  const old = o.old;
  shape(g, [...ell(x, y, 230 * s, 170 * s, 36, Math.PI, Math.PI * 2), [x + 230 * s, y + 60 * s], [x - 230 * s, y + 60 * s]], { fill: old ? '#a49a8a' : '#d8dde6', shade: old ? '#857b6c' : '#a9b0bf', shadeOff: [-50 * s, 0], seed: o.seed || 1 });
  shape(g, rect(x - 230 * s, y - 10 * s, 460 * s, 34 * s), { fill: old ? '#9a6a3a' : '#ff7a3a', lw: 6, seed: (o.seed || 1) + 2 });
  shape(g, ell(x + 60 * s, y - 80 * s, 62 * s, 48 * s, 22), { fill: old ? '#3a3a3a' : '#2a3a6a', shade: old ? '#222' : '#1c2850', shadeOff: [-10 * s, 0] });
  for (let i = 0; i < 5; i++) dot(g, x - 180 * s + i * 90 * s, y + 40 * s, 6 * s);
  line(g, [[x - 120 * s, y - 120 * s], [x - 70 * s, y - 90 * s], [x - 90 * s, y - 60 * s]], { lw: 5 });
  if (o.smoke) for (let i = 0; i < 6; i++) { const ph = ((o.t || 0) * .25 + i / 6) % 1; g.save(); g.globalAlpha = .55 * (1 - ph); shape(g, ell(x - 120 * s + ph * 80, y - 160 * s - ph * 420 * s, (40 + ph * 120) * s, (34 + ph * 90) * s, 18), { fill: o.old ? '#d8d0c0' : '#5a4a72', line: false, seed: i }); g.restore(); }
}
export function hull(g, t, o = {}) {           // close-up of the hull with scratched rules
  shape(g, rect(-400, -400, 3000, 2000), { fill: o.old ? '#9a9080' : '#c6ccd8', line: false });
  for (let y = 60; y < 1080; y += 260) line(g, [[-100, y], [2100, y]], { line: o.old ? '#7a7062' : '#9aa2b4', lw: 6, seed: y });
  for (let y = 60; y < 1080; y += 260) for (let x = 40; x < 1920; x += 160) dot(g, x, y + 20, 8, o.old ? '#6a6052' : '#8890a2');
  if (o.old) for (let i = 0; i < 14; i++) shape(g, ell(hash(i, 1) * 1900, hash(i, 2) * 1080, 60 + hash(i, 3) * 90, 40 + hash(i, 4) * 60, 16), { fill: '#7a5a3a', line: false, seed: i });
  const rules = ['ПРАВИЛА:', '1. НЕ ШУМИ', '2. НЕ СТОЙ', '3. НЕ СМОТРИ НА 2-Е СОЛНЦЕ', '4. ПЕЙ СИНЮЮ', '5. НЕ ОТВЕЧАЙ ЭХУ', '6. НЕ ОТКРЫВАЙ ВТОРУЮ', '7. НАПИШИ ПРАВИЛА'];
  const n = o.reveal ?? 1;
  rules.forEach((r, i) => { const p = clamp(n * rules.length - i); if (p > 0) text(g, r, 600, 210 + i * 88, i ? 66 : 80, '#f8f8ff', { align: 'left', font: 'Caveat', weight: 700, outline: '#3a3f50', lw: 7, reveal: p, rot: -.02 }); });
  if (o.extra) text(g, o.extra, 1300, 900, 74, '#ff5a4a', { font: 'Caveat', weight: 700, outline: '#3a1a1a', lw: 8, rot: -.05, reveal: o.extraReveal ?? 1 });
  if (o.tally) { const k = Math.floor(o.tally); for (let i = 0; i < k; i++) { const gx = 1180 + (Math.floor(i / 5) % 5) * 130, gy = 170 + Math.floor(i / 25) * 120; if (i % 5 === 4) line(g, [[gx - 8, gy + 70], [gx + 90, gy + 10]], { line: '#f8f8ff', lw: 7, seed: i }); else line(g, [[gx + (i % 5) * 20, gy], [gx + (i % 5) * 20, gy + 80]], { line: '#f8f8ff', lw: 7, seed: i }); } }
}
// ── zones
export function crash(g, t, o = {}) {
  backdrop(g, t, PAL.crash, { stars: true, moons: true });
  for (let i = 0; i < 6; i++) shape(g, [[200 + i * 330, 760], [260 + i * 330, 640 - hash(i, 4) * 120], [330 + i * 330, 760]], { fill: '#2a2244', shade: '#1e1834', shadeOff: [-14, 0], seed: i });
  shape(g, ell(1180, 830, 380, 70, 30), { fill: '#241c3c', line: false });
  pod(g, 1180, 780, 1, { smoke: true, t });
  if (o.hero !== false) astro(g, o.hx ?? 600, 1000, .76, { facing: 1, armF: .6, armB: .1, face: o.face || { eyes: 'wide', brow: 'up', look: [1, 0], sweat: true } });
}
export function jungle(g, t, o = {}) {
  backdrop(g, t, PAL.jungle);
  for (let i = 0; i < 8; i++) { const x = -100 + i * 290, h = 420 + hash(i, 2) * 200; shape(g, [[x, 1100], [x + 30, 1100 - h], [x + 60, 1100]], { fill: '#3a0e4a', line: false, seed: i });
    shape(g, [[x + 30, 1100 - h], [x - 140, 1100 - h + 60], [x - 60, 1100 - h + 160]], { fill: '#7a2a9a', shade: '#5a1a78', seed: i + 20 }); shape(g, [[x + 30, 1100 - h], [x + 200, 1100 - h + 80], [x + 110, 1100 - h + 170]], { fill: '#9a36b0', shade: '#7a2a9a', seed: i + 40 }); }
  // the listening flowers: petals + an eye that turns toward you
  const turn = o.turn ?? 0;
  for (const [x, y, s] of [[300, 600, 1.1], [1500, 520, 1.3], [1720, 760, .9], [950, 430, .8]]) {
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + t * .3; shape(g, ell(x + Math.cos(a) * 70 * s, y + Math.sin(a) * 70 * s, 50 * s, 30 * s, 14), { fill: '#ff4fa6', shade: '#d42a80', seed: k + x }); }
    shape(g, ell(x, y, 50 * s, 50 * s, 24), { fill: '#fff6fb' });
    const tx = (o.hx ?? 900) - x, ty = 900 - y, l = Math.hypot(tx, ty) || 1, lk = turn;
    dot(g, x + tx / l * 22 * s * lk, y + ty / l * 22 * s * lk, 16 * s, INK);
  }
  astro(g, o.hx ?? 900, 1010, .76, { facing: 1, walk: o.walk ? t * 4 : null, armF: .3, armB: -.2, face: o.face || { eyes: 'wide', brow: 'worried', look: [-1, -.5], mouth: 0, sweat: true } });
  for (let i = 0; i < 6; i++) shape(g, [[-200 + i * 420, 1200], [-120 + i * 420, 860], [-40 + i * 420, 1200]], { fill: '#2a0838', line: false, seed: i + 70 });
}
export function swamp(g, t, o = {}) {
  backdrop(g, t, PAL.swamp);
  for (let i = 0; i < 10; i++) { const x = (i * 211 + t * 20) % 2200 - 140, y = 760 + (i % 4) * 70, r = 14 + (Math.sin(t * 3 + i) + 1) * 12; shape(g, ell(x, y, r, r, 14), { fill: '#d8ff7a', lw: 4, seed: i }); }
  for (let i = 0; i < 5; i++) shape(g, [[100 + i * 420, 700], [120 + i * 420, 420], [150 + i * 420, 700]], { fill: '#2f6230', line: false, seed: i });
  const sink = o.sink ?? 0, hx = o.hx ?? 900;
  astro(g, hx, 1000 + sink * 230, .76, { facing: 1, walk: o.walk ? t * 6 : null, armF: sink > .3 ? -1.2 : .3, armB: sink > .3 ? 1.2 : -.2, face: o.face || { eyes: sink > .3 ? 'wide' : 'open', brow: 'worried', mouth: sink > .3 ? .5 : 0, look: [0, 1], sweat: sink > .3 } });
  shape(g, [[-400, 1000 + 20 * Math.sin(t)], ...Array.from({ length: 12 }, (_, i) => [-400 + i * 260, 990 + Math.sin(t * 2 + i) * 10]), [2800, 1000], [2800, 1500], [-400, 1500]], { fill: '#a6e22e', shade: '#79b81f', shadeOff: [0, -30], seed: 8 });
}
export function desert(g, t, o = {}) {
  backdrop(g, t, PAL.desert);
  shape(g, ell(520, 260, 110, 110, 30), { fill: '#fff3c4', line: false });
  const s2 = [1460, 220], open = o.eye ?? 0;
  shape(g, ell(...s2, 130, 130, 30), { fill: '#ffeaa0', lw: 7 });
  if (open > 0) { shape(g, ell(s2[0], s2[1], 95, 60 * open, 24), { fill: '#ffffff', lw: 7 }); dot(g, s2[0] + (o.lookX ?? 0) * 40, s2[1] + 8, 28 * open, INK); }
  else line(g, [[s2[0] - 90, s2[1]], [s2[0], s2[1] + 22], [s2[0] + 90, s2[1]]], { lw: 8 });
  for (let k = 0; k < 3; k++) shape(g, [[-400, 760 + k * 90], ...Array.from({ length: 8 }, (_, i) => [-400 + i * 420, 720 + k * 90 - Math.sin(i * 1.7 + k) * 60]), [2800, 780 + k * 90], [2800, 1500], [-400, 1500]], { fill: ['#f0903a', '#e8742a', '#c95a1a'][k], line: false, seed: k + 3 });
  astro(g, o.hx ?? 900, 1010, .76, { facing: -1, armF: o.cover ? -2.6 : .2, armB: o.cover ? -2.4 : .1, face: o.face || { eyes: o.cover ? 'closed' : 'open', brow: 'worried', look: [-1, 0], sweat: true } });
}
export function lakes(g, t, o = {}) {
  backdrop(g, t, PAL.lakes, { stars: true });
  shape(g, ell(520, 860, 440, 110, 32), { fill: '#2fa6e0', shade: '#1f86c0', shadeOff: [0, -24] });
  shape(g, ell(1420, 860, 440, 110, 32), { fill: '#d8323c', shade: '#b0222c', shadeOff: [0, -24] });
  const wig = o.wiggle ?? 0; if (wig > 0) for (let k = 0; k < 3; k++) { const x = 1300 + k * 120; line(g, Array.from({ length: 10 }, (_, i) => [x + Math.sin(t * 6 + i * .8 + k) * 18 * wig, 870 - i * 22 * wig]), { line: '#8a1a24', lw: 16, seed: k }); }
  for (let i = 0; i < 6; i++) { const ph = (t * .5 + i / 6) % 1; line(g, ell(520, 860, 80 + ph * 300, 20 + ph * 70, 30), { line: '#9fe0ff', lw: 4, seed: i }); }
  astro(g, o.hx ?? 760, o.kneel ? 990 : 1010, .76, { facing: -1, kneel: o.kneel, armF: o.kneel ? 1.4 : .2, face: o.face || { eyes: 'open', brow: 'neutral', look: [-1, .5] } });
}
export function ice(g, t, o = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#0d2a46', line: false });
  for (let k = 0; k < 4; k++) shape(g, [[-200 + k * 600, 1200], ...ell(100 + k * 600, 1100, 420, 900 - k * 60, 24, Math.PI, Math.PI * 2), [400 + k * 600, 1200]], { fill: ['#1a4e72', '#2a6a94', '#3a86b4', '#7fd4f2'][k % 4], shade: '#123a5a', shadeOff: [-40, 0], seed: k });
  for (let i = 0; i < 16; i++) { const x = i * 130 + 20, h = 80 + hash(i, 1) * 160; shape(g, [[x, -10], [x + 50, -10], [x + 25, h]], { fill: '#e6faff', shade: '#9fdcf2', shadeOff: [-8, 0], seed: i }); }
  shape(g, rect(-400, 900, 3000, 600), { fill: '#bfeeff', shade: '#8fd6f2', shadeOff: [0, -30] });
  const call = o.call ?? 0;
  if (call > 0) for (const [x, y, r] of [[300, 450, .1], [1650, 380, -.12], [1200, 260, .05]]) { g.save(); g.globalAlpha = call; shape(g, ell(x, y, 70, 40 + 20 * Math.abs(Math.sin(t * 6 + x)), 18), { fill: '#06121e', lw: 6 }); g.restore(); text(g, 'ИДИ СЮДА…', x, y - 90, 54, '#e6faff', { rot: r, outline: '#06121e' }); }
  astro(g, o.hx ?? 900, 1010, .76, { facing: 1, armF: -.3, face: o.face || { eyes: 'wide', brow: 'up', look: [1, -.4], sweat: true, mouth: 0 } });
  if (o.dark !== false) dark(g, .4, [{ x: 900, y: 700, r: 700 }], '#020a14');
}
export function beige(g, t, o = {}) {
  backdrop(g, t, PAL.beige);
  pod(g, 1450, 700, .55, { old: true, smoke: true, t, seed: 7 });
  astro(g, o.hx ?? 700, 1010, .76, { facing: 1, walk: o.walk ? t * 5 : null, face: o.face || { eyes: 'open', brow: 'worried', look: [1, -.3] } });
}
export function loopField(g, t, o = {}) {        // the reveal: dozens of old capsules across the plain
  backdrop(g, t, PAL.dusk, { stars: true, moons: true });
  const n = Math.floor(o.n ?? 41);
  for (let i = 0; i < n; i++) { const d = .25 + hash(i, 3) * .6, x = hash(i, 1) * 2400 - 240, y = HZ + 40 + d * 400; pod(g, x, y, d * .45, { old: true, seed: i + 30 }); }
  pod(g, 1250, 900, .9, { smoke: true, t });
  if (o.fall) { const k = clamp(o.fall); line(g, [[1700 - k * 600, 40 + k * 200], [1820 - k * 600, -40 + k * 200]], { line: '#ffd23f', lw: 14 }); shape(g, ell(1700 - k * 600, 40 + k * 200, 26, 26, 14), { fill: '#fff3c4' }); }
  if (o.hero !== false) astro(g, o.hx ?? 900, 1040, .76, { facing: 1, armF: o.scratch ? 1.3 + Math.sin(t * 14) * .25 : .2, face: o.face || { eyes: 'half', brow: 'sad', look: [1, 0] } });
}

// ── extra shots for the long version
export function screen(g, t, lines = [], o = {}) {      // the wrist screen, close
  T.bands(g, 1920, [0], [o.bg || '#1b1035']);
  shape(g, [[-200, 1300], [-200, 640], [400, 560], [1500, 600], [2200, 760], [2200, 1300]], { fill: '#f4f1ea', shade: '#cbc3b4', shadeOff: [0, -50] });
  glowRings(g, 960, 520, 620, SCAN, .18);
  shape(g, rrect(420, 230, 1080, 560, 50), { fill: '#0a2430', lw: 10 });
  shape(g, rrect(470, 280, 980, 460, 30), { fill: '#06303c', line: SCAN, lw: 6 });
  g.save(); g.font = '800 58px JBMono'; g.textBaseline = 'top';
  let y = 320; const blink = Math.floor(t * 3) % 2;
  lines.forEach((ln, i) => { const show = o.typed == null ? ln : ln.slice(0, Math.max(0, Math.floor(o.typed * 40 - i * 20))); g.fillStyle = i === 0 && o.alarm && blink ? '#ff5a4a' : SCAN; g.fillText(show, 520, y); y += 96; });
  g.restore();
}
export function flashback(g, t, o = {}) {               // the orbital station before the lights went out
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#3a4256', line: false });
  for (let x = -200; x < 2200; x += 260) shape(g, rrect(x, 80, 240, 700, 20), { fill: '#4a5470', line: '#2a3042', lw: 6, seed: x });
  shape(g, ell(1350, 380, 210, 210, 36), { fill: '#0a0f2a', lw: 12 }); shape(g, ell(1400, 430, 140, 140, 30), { fill: '#3a8ad8', shade: '#2a5aa8', shadeOff: [-30, -20] });
  shape(g, rect(-200, 760, 2400, 400), { fill: '#2a3042', line: false });
  shape(g, rect(300, 700, 700, 60), { fill: '#5a6480', shade: '#3a4256', shadeOff: [0, -14] });
  shape(g, [[600, 700], [700, 700], [690, 620], [610, 620]], { fill: '#f4f1ea', lw: 6 }); for (let i = 0; i < 3; i++) { const ph = (t * .6 + i / 3) % 1; g.save(); g.globalAlpha = .5 * (1 - ph); line(g, [[630 + i * 18, 610 - ph * 80], [640 + i * 18 + Math.sin(ph * 6) * 10, 570 - ph * 80]], { line: '#ffffff', lw: 5 }); g.restore(); }
  for (const x of [300, 900, 1500]) { const on = !o.out || (o.out > 0 && Math.floor(t * 9 + x) % 3 === 0 && o.out < .6); shape(g, rrect(x, 20, 220, 30, 12), { fill: on ? '#fff6c8' : '#2a3042' }); if (on) glowRings(g, x + 110, 40, 200, '#fff6c8', .12); }
  if (o.out >= .6) dark(g, .75, [{ x: 1400, y: 430, r: 260 }], '#05070f');
  tint(g, '#e8c890', .22);
}
export function shadows(g, hx, fy, t) {                  // two shadows under you; the second one doesn't follow
  g.save(); g.globalAlpha = .45; shape(g, ell(hx + 60, fy + 10, 120, 22, 20), { fill: '#7a2a0a', line: false }); shape(g, ell(1350, fy + 10, 120, 22, 20), { fill: '#3a0a00', line: false }); g.restore();
}
export function helmetInMud(g, x, y) { shape(g, [...ell(x, y, 90, 80, 24, Math.PI, Math.PI * 2), [x + 90, y], [x - 90, y]], { fill: '#f4f1ea', shade: '#cbc3b4', shadeOff: [-14, 0] }); shape(g, [...ell(x + 10, y - 30, 50, 34, 20, Math.PI, Math.PI * 2), [x + 60, y - 30], [x - 40, y - 30]], { fill: '#3a4a6a' }); line(g, [[x - 20, y - 55], [x + 5, y - 35], [x - 5, y - 20], [x + 25, y - 10]], { line: '#ffffff', lw: 4 }); text(g, 'НЕ СТОЙ', x, y - 120, 46, '#ffffff', { font: 'Caveat', weight: 700, outline: '#3a3f50', lw: 7, rot: -.06 }); }
export function frostHand(g, x, y, a = 1) { g.save(); g.globalAlpha = a; shape(g, ell(x, y, 50, 60, 20), { fill: '#f4fdff', line: false }); for (let f = 0; f < 4; f++) shape(g, ell(x - 36 + f * 24, y - 80 + (f % 3 ? 0 : 14), 11, 30, 12), { fill: '#f4fdff', line: false, seed: f }); shape(g, ell(x + 58, y - 14, 12, 28, 12), { fill: '#f4fdff', line: false }); g.restore(); }
