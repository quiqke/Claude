// world.js — «10 правил, если тебя замело на ночной трассе»: the car (cutaway interior + exterior), blizzard, inserts per action.
import * as T from './toon.js';
const { shape, line, ell, rect, rrect, dot, text, glowRings, INK, person, face, CAST } = T;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const C = { night: '#1c2440', night2: '#26304e', snow: '#eef3fa', snowS: '#c6d2e4', car: '#3a8a9a', carS: '#2a6a78', cabin: '#3a3e48', cabinS: '#2c3038', seat: '#4a3a3a', seatS: '#382a2a', dash: '#2e3238', red: '#ff3a2a', amber: '#ffb03a', warm: '#ffd890', scarf: '#e2402f' };
CAST.you = { skin: '#f2b48a', skinS: '#d98a62', hair: '#5a3220', hairS: '#3e2116', coat: '#3a6ab8', coatS: '#2a4e8a', pants: '#3a3a48', pantsS: '#2a2a34', boots: '#3a2a20', h: 1 };
CAST.rescuer = { skin: '#e8b08c', skinS: '#c98a66', hair: '#4a3020', hairS: '#3a2418', coat: '#ff7a1a', coatS: '#d85a0a', pants: '#2a3040', pantsS: '#1e2430', boots: '#111111', hat: '#ff7a1a', hatS: '#d85a0a', h: 1.05 };
export const RULES = ['НЕ ВЫХОДИ ИЗ МАШИНЫ', 'МОТОР 10 МИН КАЖДЫЙ ЧАС', 'ОКНО НА ПАЛЕЦ', 'НЕ СПИ БОЛЬШЕ 20 МИН', 'ЯРКОЕ — НА АНТЕННУ', 'НЕ ЕШЬ СНЕГ', 'ОТКАПЫВАЙ ВЫХЛОПНУЮ ТРУБУ', 'СТУЧАТ — НЕ ОПУСКАЙ ОКНО', 'НЕ ВЕРЬ ФАРАМ, ЧТО СТОЯТ', 'ВЫХОДИ, КОГДА УСЛЫШИШЬ ТРАКТОР'];
export const bg = (g, col) => shape(g, rect(-600, -600, 3200, 2400), { fill: col, line: false });
export function capsule(x0, y0, x1, y1, w) { const a = Math.atan2(y1 - y0, x1 - x0); return [...ell(x0, y0, w / 2, w / 2, 12, a + Math.PI / 2, a + Math.PI * 1.5), ...ell(x1, y1, w / 2, w / 2, 12, a - Math.PI / 2, a + Math.PI / 2)]; }
export function hand(g, x, y, s = 1, rot = 0, o = {}) {
  const c = CAST[o.who || 'you'], R = (dx, dy) => [x + (dx * Math.cos(rot) - dy * Math.sin(rot)) * s, y + (dx * Math.sin(rot) + dy * Math.cos(rot)) * s];
  if (o.sleeve !== false) { shape(g, [R(-260, -62), R(-40, -70), R(-40, 70), R(-260, 62)], { fill: o.sleeve || c.coat, shade: c.coatS, shadeOff: [0, 18 * s] }); shape(g, [R(-60, -74), R(-30, -74), R(-30, 74), R(-60, 74)], { fill: c.coatS, lw: 6 }); }
  const skin = o.glove || c.skin, skinS = o.glove ? '#1a1a1a' : c.skinS, curl = o.grip ? .55 : 0;
  for (let i = 0; i < 4; i++) { const fy = -42 + i * 28, L = (i === 0 || i === 3 ? 78 : 92) * (1 - curl * .45); shape(g, capsule(...R(40, fy), ...R(40 + L, fy + (o.grip ? 22 : 0)), 30 * s), { fill: skin, shade: skinS, shadeOff: [0, 6 * s], lw: 6 }); }
  shape(g, ell(...R(10, 0), 62 * s, 64 * s, 24), { fill: skin, shade: skinS, shadeOff: [0, 14 * s] });
  shape(g, capsule(...R(10, -50), ...R(58, -88), 32 * s), { fill: skin, shade: skinS, lw: 6 });
  if (o.red) shape(g, ell(...R(70, 0), 50 * s, 40 * s, 16), { fill: 'rgba(255,90,90,.35)', line: false });
}
export function blizzard(g, t, n = 120, a = 1, col = '#ffffff') { g.save(); g.globalAlpha = a; for (let i = 0; i < n; i++) { const sp = 600 + hash(i, 3) * 700, x = ((hash(i, 1) * 2400 - t * sp * .9) % 2400 + 2400) % 2400 - 240, y = ((hash(i, 2) * 1300 + t * sp * .35) % 1300) - 110, L = 14 + hash(i, 4) * 26; line(g, [[x, y], [x + L, y - L * .38]], { line: col, lw: 3 + hash(i, 5) * 3, seed: i }); } g.restore(); }
export function steam(g, t, x, y, a = 1, col = '#ffffff') { for (let i = 0; i < 3; i++) { const ph = (t * .7 + i / 3) % 1; g.save(); g.globalAlpha = a * (1 - ph) * .9; line(g, Array.from({ length: 8 }, (_, k) => [x - 80 + i * 80 + Math.sin(k * .9 + t * 3 + i) * 18, y - ph * 160 - k * 26]), { line: col, lw: 9 }); g.restore(); } }
function scarfOn(g, r, flap = 0, t = 0) { const [x, y] = r.head, R = r.R; shape(g, [[x - R * .8, y + R * .85], [x + R * .8, y + R * .85], [x + R * .75, y + R * 1.25], [x - R * .75, y + R * 1.25]], { fill: C.scarf, shade: '#b02a22', shadeOff: [0, -R * .1], lw: 5 }); shape(g, [[x + R * .3, y + R * 1.1], [x + R * .6, y + R * 1.1], [x + R * .7 + flap * Math.sin(t * 9) * R * .2, y + R * 2.1], [x + R * .35, y + R * 2.0]], { fill: C.scarf, lw: 5 }); }
export function you(g, x, fy, s, p = {}) { const r = person(g, 'you', x, fy, s, p); if (p.scarf !== false) scarfOn(g, r, 0, 0); return r; }
// ── outside: night blizzard (or dawn), the car half-buried, figure, distant headlights, grader, memorial post
export function outside(g, t, o = {}) {
  const dawn = o.dawn || 0; bg(g, dawn ? '#9ab0d0' : C.night);
  if (dawn) T.bands(g, 1920, [0, 260, 460], ['#7a90c0', '#d8a0a0', '#f0c890']); else T.bands(g, 1920, [0, 300, 480], ['#161d36', '#1e2744', '#28324e']);
  for (let i = 0; i < 26; i++) { const x = i * 80 + (i % 3) * 20, h = 120 + (i * 53) % 100; shape(g, [[x - 50, 640], [x, 640 - h], [x + 50, 640]], { fill: dawn ? '#5a6a7a' : '#121a2a', line: false, seed: i }); }
  shape(g, [[-300, 640], [2300, 640], [2300, 1400], [-300, 1400]], { fill: dawn ? '#f4f6fa' : '#c8d2e4', shade: dawn ? '#d8e0ec' : '#a8b4ca', shadeOff: [0, -30] });
  if (o.lights) { const a = o.lights; glowRings(g, 1640, 660, 120, '#ffe08a', .22 * a); for (const dx of [-26, 26]) { shape(g, ell(1640 + dx, 660, 14, 11, 12), { fill: a > .1 ? '#ffe08a' : '#4a4a40', line: false }); } }
  if (o.plow) { const x = o.plowX ?? 1500; shape(g, rect(x - 200, 640, 360, 150), { fill: '#e8a020', shade: '#c88010', shadeOff: [-20, 0] }); shape(g, rect(x - 140, 560, 140, 90), { fill: '#2a3040', lw: 6 }); for (const wx of [x - 140, x + 100]) shape(g, ell(wx, 800, 60, 60, 20), { fill: '#2a2a2a', lw: 6 }); shape(g, [[x - 300, 820], [x - 200, 700], [x - 200, 820]], { fill: '#8a8a8a', lw: 6 }); const on = Math.floor(t * 4) % 2; shape(g, rect(x - 90, 530, 40, 30), { fill: on ? '#ffb030' : '#8a5a10', lw: 5 }); if (on) glowRings(g, x - 70, 545, 160, '#ffb030', .3); }
  if (o.car !== false) carSide(g, t, 900, 830, 1, o);
  if (o.post) { line(g, [[200, 880], [200, 560]], { line: '#5a3a2a', lw: 22 }); shape(g, ell(200, 600, 60, 60, 24), { fill: '#5a7a4a', lw: 6 }); for (let i = 0; i < 6; i++) dot(g, 200 + Math.cos(i) * 52, 600 + Math.sin(i) * 52, 9, '#c84a4a'); shape(g, rect(150, 680, 100, 60), { fill: '#e8e4d8', lw: 5 }); }
  if (o.steps) for (let i = 0; i < 10; i++) { const k = i / 9, x = (o.stepsFrom ?? 640) - k * ((o.stepsFrom ?? 640) - 230), y = 880 - k * 120 + (i % 2) * 14; shape(g, ell(x, y, 26 - k * 10, 10 - k * 4, 12), { fill: '#9aa8c0', line: false, seed: i }); }

  if (o.figure) { const fx = o.figX ?? 520, a = o.figure; g.save(); g.globalAlpha = a; shape(g, [[fx - 40, 840], [fx - 34, 600], [fx - 46, 560], [fx, 520], [fx + 46, 560], [fx + 34, 600], [fx + 40, 840]], { fill: '#0a0e1a', line: false }); shape(g, ell(fx, 495, 34, 40, 16), { fill: '#0a0e1a', line: false }); line(g, [[fx + 60, 840], [fx + 40, 560]], { line: '#0a0e1a', lw: 12 }); shape(g, [[fx + 46, 830], [fx + 84, 830], [fx + 74, 880], [fx + 56, 880]], { fill: '#0a0e1a', line: false }); g.restore(); glowRings(g, fx + 60, 650, 220, C.red, .12 * a); }
  if (o.dig) { const k = o.dig; for (let i = 0; i < 8; i++) { const ph = (t * 1.5 + i / 8) % 1; dot(g, 560 + ph * 120 * Math.cos(i), 800 - Math.sin(ph * Math.PI) * 160, 8, '#fff'); } }
  if (!o.noStorm) blizzard(g, t, o.storm ?? 140, dawn ? .5 : .85);
  if (!dawn && o.dark !== false) T.dark(g, .35, [{ x: 600, y: 760, r: 300 }, { x: 1300, y: 700, r: 400 }], '#05081a');
}
export function carSide(g, t, cx, gy, s, o = {}) {
  const X = v => cx + v * s, Y = v => gy + v * s, bury = o.bury || 0;
  const body = [[X(-480), Y(-40)], [X(-470), Y(-160)], [X(-300), Y(-180)], [X(-200), Y(-320)], [X(220), Y(-320)], [X(340), Y(-180)], [X(500), Y(-160)], [X(510), Y(-40)]];
  shape(g, body, { fill: C.car, shade: C.carS, shadeOff: [0, -30] });
  for (const w of [[[X(-180), Y(-300)], [X(10), Y(-300)], [X(10), Y(-190)], [X(-270), Y(-190)]], [[X(40), Y(-300)], [X(210), Y(-300)], [X(310), Y(-190)], [X(40), Y(-190)]]]) shape(g, w, { fill: o.cabinLit ? '#ffd890' : '#2a3450', lw: 6 });
  for (const wx of [-300, 320]) { shape(g, ell(X(wx), Y(-40), 80 * s, 80 * s, 24), { fill: '#222', lw: 6 }); shape(g, ell(X(wx), Y(-40), 36 * s, 36 * s, 16), { fill: '#8a8a8a', lw: 5 }); }
  shape(g, rect(X(-490), Y(-130), 26 * s, 40 * s), { fill: C.red, lw: 5 }); if (o.tail) glowRings(g, X(-480), Y(-110), 150 * s, C.red, .2 * o.tail);
  shape(g, rect(X(480), Y(-130), 30 * s, 34 * s), { fill: '#fff6c8', lw: 5 }); if (o.head) { g.save(); g.globalAlpha = .25 * o.head; g.fillStyle = '#fff6c8'; const a = T.P([X(510), Y(-110)]), b = T.P([X(1400), Y(-260)]), c2 = T.P([X(1400), Y(60)]); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c2); g.fill(); g.restore(); }
  line(g, [[X(160), Y(-320)], [X(150), Y(-470)]], { lw: 6 }); if (o.scarf) { const f = Math.sin(t * 11) * 14; shape(g, [[X(150), Y(-470)], [X(260), Y(-460) + f], [X(320), Y(-440) - f], [X(260), Y(-430) + f], [X(150), Y(-440)]], { fill: C.scarf, lw: 5 }); }
  shape(g, rect(X(-500), Y(-30), 40 * s, 16 * s), { fill: '#5a5a5a', lw: 4 });                                   // exhaust pipe
  if (o.exhaust) steam(g, t, X(-520), Y(-40), .6, '#d8dce8');
  if (bury > 0) { const prof = []; for (let x = -900; x <= 900; x += 50) { const h = bury * 380 * Math.exp(-Math.pow(Math.abs(x) / 640, 5)) + Math.sin(x * .02) * 10 * bury; prof.push([X(x), gy + 60 * s - h * s]); } shape(g, [[X(-900), gy + 80 * s], ...prof, [X(900), gy + 80 * s]], { fill: C.snow, shade: C.snowS, shadeOff: [0, -30] });
    if (o.pipeClear) { shape(g, ell(X(-480), Y(-24), 90 * s, 60 * s, 24), { fill: '#3a4258', lw: 6 }); shape(g, rect(X(-500), Y(-30), 40 * s, 16 * s), { fill: '#5a5a5a', lw: 4 }); } }
}
// ── cutaway car interior: the hero in the driver seat, facing right
export function cabin(g, t, o = {}) {
  const dawn = o.dawn || 0;
  const outsideFill = () => { bg(g, dawn ? '#c8d4e8' : '#2a3450'); blizzard(g, t, 90, dawn ? .4 : .7); if (o.lights) { glowRings(g, 1560, 360, 90, '#ffe08a', .3 * o.lights); for (const dx of [-18, 18]) dot(g, 1560 + dx, 360, 9, '#ffe08a'); } if (o.figure) { shape(g, [[700, 520], [690, 300], [740, 250], [790, 300], [780, 520]], { fill: '#05070f', line: false }); } if (o.plow && Math.floor(t * 4) % 2) glowRings(g, 1600, 330, 200, '#ffb030', .45); };
  const W = { rear: [[220, 230], [520, 230], [520, 520], [160, 520]], side: [[580, 220], [1180, 210], [1180, 520], [580, 520]], front: [[1260, 205], [1420, 195], [1760, 520], [1260, 520]] };
  bg(g, C.cabin);
  shape(g, [[60, 1100], [60, 560], [140, 170], [1440, 140], [1840, 520], [1920, 600], [1920, 1100]], { fill: C.cabin, shade: C.cabinS, shadeOff: [0, -40] });
  for (const [k, w] of Object.entries(W)) { g.save(); g.beginPath(); w.map(T.P).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip(); outsideFill();
    const sn = (o.snow ?? 0) * (k === 'rear' && o.stripe != null ? 1 : 1), top = 520 - sn * 300;
    if (sn > 0) shape(g, [[100, 600], [100, top], ...Array.from({ length: 10 }, (_, i) => [100 + i * 190, top + Math.sin(i * 2.1 + k.length) * 14]), [1900, top], [1900, 600]], { fill: C.snow, shade: C.snowS, shadeOff: [0, 18] });
    if (k === 'rear' && o.stripe) { g.save(); g.globalAlpha = 1; shape(g, [[160, 300 + 0], [520, 280], [520, 330], [160, 350]], { fill: '#2a3450', line: false }); g.restore(); }
    if (o.frost) { g.save(); g.globalAlpha = .7 * o.frost; for (let i = 0; i < 26; i++) { const x0 = w[0][0] + hash(i, 7) * 500, y0 = 520 - hash(i, 8) * 60; line(g, [[x0, y0], [x0 + 30, y0 - 60 * o.frost], [x0 + 10, y0 - 110 * o.frost]], { line: '#ffffff', lw: 3, seed: i }); } g.restore(); }
    g.restore(); shape(g, w, { fill: null, lw: 8 }); }
  if (o.shadow != null) { const sx = 100 + o.shadow * 1300; g.save(); g.globalAlpha = .7; shape(g, [[sx, 200], [sx + 160, 200], [sx + 200, 540], [sx - 40, 540]], { fill: '#05070f', line: false }); g.restore(); }
  line(g, [[760, 210], [760, 1000], [1240, 1000], [1240, 520]], { line: C.cabinS, lw: 8 }); shape(g, rrect(1080, 860, 90, 26, 10), { fill: '#6a6e78', lw: 5 });
  shape(g, [[180, 600], [640, 600], [680, 780], [160, 780]], { fill: C.seat, shade: C.seatS, shadeOff: [0, -20] });
  shape(g, [[1200, 580], [1760, 560], [1830, 690], [1200, 710]], { fill: C.dash, shade: '#22252a', shadeOff: [0, -14] });
  const lit = o.engine ? 1 : .35; shape(g, rrect(1330, 600, 130, 56, 12), { fill: lit > .5 ? '#1a3a4a' : '#1a1e24', lw: 5 }); if (lit > .5) { dot(g, 1362, 628, 8, '#7affb0'); dot(g, 1428, 628, 8, C.amber); }
  shape(g, rrect(1500, 612, 96, 36, 8), { fill: '#1a1e24', lw: 5 }); if (o.engine) steam(g, t, 1548, 606, .35, '#ffcf8a');
  shape(g, rrect(1620, 640, 140, 54, 10), { fill: '#3a3e46', lw: 5 });
  if (o.gloveOpen) { glowRings(g, 1690, 680, 160, '#fff6c8', .35); shape(g, [[1620, 694], [1760, 694], [1800, 790], [1590, 790]], { fill: '#5a5e68', lw: 6 }); for (let i = 0; i < 4; i++) line(g, [[1615, 712 + i * 18], [1770 - (i % 2) * 30, 712 + i * 18]], { line: '#c8ccd4', lw: 3, seed: i }); }
  shape(g, rrect(770, 250, 110, 90, 24), { fill: C.seat, shade: C.seatS, shadeOff: [-10, 0] }); shape(g, [[760, 340], [880, 340], [930, 780], [790, 780]], { fill: C.seat, shade: C.seatS, shadeOff: [-14, 0] }); shape(g, [[800, 740], [1150, 740], [1150, 805], [800, 805]], { fill: C.seat, shade: C.seatS, shadeOff: [0, -14] });
  if (o.hero !== false) { const h = o.heroP || {}; you(g, 980, 1080, 1.45, { sit: true, facing: 1, armF: h.armF ?? 1.3, armB: h.armB ?? 1.2, face: h.face || { eyes: 'open', brow: 'worried', look: [1, 0] }, lean: h.lean }); }
  line(g, [[1340, 660], [1300, 560]], { lw: 14 }); line(g, ell(1296, 545, 30, 150, 30, 0, Math.PI * 2.05), { line: '#1a1a1a', lw: 18 });
  line(g, [[1400, 140], [1410, 30]], { lw: 6 }); if (o.scarf) { const f = Math.sin(t * 11) * 12; shape(g, [[1410, 40], [1500, 50 + f], [1560, 70 - f], [1500, 80 + f], [1410, 70]], { fill: C.scarf, lw: 5 }); }
  if (o.night !== false) T.dark(g, dawn ? .0 : (o.engine ? .42 : .58), [{ x: 1000, y: 430, r: 320 }, ...(o.engine ? [{ x: 1420, y: 620, r: 320 }] : []), ...(o.holes || [])], '#070b1a');
}
// ── close-ups (screen space)
export function windshield(g, t, o = {}) {
  bg(g, '#1a2238'); shape(g, [[-100, 640], [2100, 640], [2100, 1200], [-100, 1200]], { fill: '#8a96b0', line: false });
  if (o.beams !== false) { g.save(); g.globalAlpha = .18; g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(560, 1080); g.lineTo(880, 560); g.lineTo(1040, 560); g.lineTo(1360, 1080); g.fill(); g.restore(); }
  for (let i = 0; i < 6; i++) { const k = ((t * 1.4 + i / 6) % 1); const y = 600 + k * k * 520, w = 6 + k * 30; shape(g, rect(960 - w / 2, y, w, 20 + k * 60), { fill: '#e8eef8', line: false, seed: i }); }
  blizzard(g, t * 1.6, 160, .9);
  if (o.lights) { glowRings(g, 1180, 560, 120, '#ffe08a', .25 * o.lights); for (const dx of [-24, 24]) dot(g, 1180 + dx, 560, 11, o.lights > .1 ? '#ffe08a' : '#4a4a40'); }
  if (o.plow) { const on = Math.floor(t * 4) % 2; glowRings(g, 1100, 520, 260, '#ffb030', on ? .45 : .15); shape(g, rect(1020, 520, 160, 60), { fill: '#e8a020', lw: 6 }); }
  shape(g, [[0, 0], [1920, 0], [1920, 90], [1500, 120], [420, 120], [0, 90]], { fill: '#26292f', lw: 8 }); shape(g, [[0, 0], [260, 0], [520, 1080], [0, 1080]], { fill: '#26292f', lw: 8 }); shape(g, [[1920, 0], [1660, 0], [1400, 1080], [1920, 1080]], { fill: '#26292f', lw: 8 });
  shape(g, [[300, 900], [1620, 900], [1700, 1100], [220, 1100]], { fill: '#2e3238', lw: 8 });
  if (o.wipers) { const a = Math.sin(t * 3.2) * .9; for (const bx of [700, 1160]) line(g, [[bx, 900], [bx + Math.cos(-Math.PI / 2 + a) * 520, 900 + Math.sin(-Math.PI / 2 + a) * 520]], { line: '#111', lw: 14, seed: bx }); }
  if (o.nav) { shape(g, rrect(1240, 700, 300, 180, 18), { fill: '#111', lw: 6 }); shape(g, rect(1258, 718, 264, 144), { fill: '#1a3a5a', line: false }); text(g, '40 КМ', 1390, 770, 54, '#7affb0', { outline: false, font: 'JBMono', weight: 800 }); text(g, 'ДО ПОСЁЛКА', 1390, 830, 26, '#bfe8ff', { outline: false, font: 'JBMono', weight: 800 }); }
}
export function mirrorClose(g, t) {
  bg(g, '#26292f'); shape(g, rrect(360, 260, 1200, 440, 120), { fill: '#111', lw: 10 }); g.save(); g.beginPath(); g.roundRect(390, 290, 1140, 380, 100); g.clip();
  bg(g, '#141b30'); shape(g, [[390, 520], [1530, 520], [1530, 700], [390, 700]], { fill: '#6a7690', line: false }); shape(g, [[900, 520], [1020, 520], [1300, 700], [620, 700]], { fill: '#3a4258', line: false }); blizzard(g, t, 60, .6); g.restore();
  line(g, [[960, 0], [960, 260]], { lw: 30, line: '#1a1a1a' }); text(g, 'НИКОГО', 960, 820, 80, '#fff6c8', {});
}
export function wheelClose(g, t, o = {}) {
  bg(g, '#c8d2e4'); shape(g, [[-100, 640], [2100, 600], [2100, 1200], [-100, 1200]], { fill: C.snow, shade: C.snowS, shadeOff: [0, -30] });
  shape(g, rect(-100, 0, 2200, 360), { fill: C.car, shade: C.carS, shadeOff: [0, -40] }); shape(g, ell(960, 420, 420, 260, 40, Math.PI, Math.PI * 2), { fill: '#1a1a1a', lw: 8 });
  const a = t * (o.spin ? 20 : 0); shape(g, ell(960, 600, 300, 300, 40), { fill: '#222', lw: 8 }); shape(g, ell(960, 600, 150, 150, 30), { fill: '#8a8a8a', lw: 6 }); for (let i = 0; i < 5; i++) { const b = a + i * 1.256; line(g, [[960 + Math.cos(b) * 40, 600 + Math.sin(b) * 40], [960 + Math.cos(b) * 140, 600 + Math.sin(b) * 140]], { lw: 10, seed: i }); }
  shape(g, [[400, 1100], [400, 760], ...Array.from({ length: 8 }, (_, i) => [500 + i * 140, 720 + Math.sin(i * 2) * 20]), [1600, 740], [1600, 1100]], { fill: C.snow, shade: C.snowS, shadeOff: [0, -20] });
  if (o.spin) for (let i = 0; i < 30; i++) { const ph = (t * 2 + hash(i, 1)) % 1; dot(g, 700 - ph * 600 + hash(i, 2) * 100, 760 - Math.sin(ph * Math.PI) * 400 * hash(i, 3), 8 + hash(i, 4) * 10, '#fff'); }
}
export function gearClose(g, t, pos = 'R') {
  bg(g, '#2a2e36'); shape(g, rrect(560, 640, 800, 440, 60), { fill: '#1e2228', lw: 8 }); shape(g, ell(960, 760, 160, 60, 24), { fill: '#3a3a3a', lw: 6 });
  const x = pos === 'R' ? 820 : 1100; line(g, [[960, 760], [x, 430]], { line: '#5a5a5a', lw: 36 }); shape(g, ell(x, 380, 120, 100, 24), { fill: '#2e2e2e', shade: '#1e1e1e', shadeOff: [-20, -12] });
  hand(g, x - 220, 400, 1.3, 0, { grip: true });
  text(g, 'R', 720, 990, 90, pos === 'R' ? '#ffb03a' : '#5a5a5a', { outline: false }); text(g, '1', 1200, 990, 90, pos === '1' ? '#ffb03a' : '#5a5a5a', { outline: false });
}
export function phoneClose(g, t, o = {}) {
  bg(g, '#1a1e2a'); glowRings(g, 960, 520, 700, '#6ab0ff', .12);
  hand(g, 760, 820, 1.5, -1.25, { grip: true }); shape(g, rrect(720, 90, 480, 900, 60), { fill: '#111', lw: 8 }); shape(g, rect(750, 160, 420, 760), { fill: '#e8eef8', line: false });
  text(g, `▂▄${o.bars > 1 ? '▆' : ''}`, 790, 190, 30, '#2a2a2a', { outline: false, align: 'left' }); text(g, `${o.batt ?? 40}%`, 1130, 190, 30, (o.batt ?? 40) < 20 ? C.red : '#2a2a2a', { outline: false, align: 'right' }); text(g, o.clock || '22:20', 960, 190, 30, '#2a2a2a', { outline: false });
  const S = o.screen || 'call';
  if (S === 'call') { text(g, '112', 960, 380, 120, '#2a2a2a', { outline: false }); text(g, o.failed ? 'ВЫЗОВ ПРЕРВАН' : 'ВЫЗОВ…', 960, 500, 50, o.failed ? C.red : '#2a8a4a', { outline: false }); shape(g, ell(960, 760, 70, 70, 24), { fill: '#e8402a', lw: 5 }); }
  if (S === 'sms') { shape(g, rrect(800, 300, 340, 220, 30), { fill: '#3a8aff', line: false }); text(g, 'ТРАССА, 213 КМ,', 970, 360, 30, '#fff', { outline: false }); text(g, 'ЗАМЕЛО. ПОМОГИТЕ', 970, 410, 30, '#fff', { outline: false }); shape(g, ell(1100, 560, 34, 34, 20), { fill: C.red, lw: 4 }); text(g, '!', 1100, 562, 44, '#fff', { outline: false }); text(g, 'НЕ ДОСТАВЛЕНО', 970, 640, 34, C.red, { outline: false }); }
  if (S === 'timer' || S === 'alarm') { const v = o.value || '10:00'; text(g, S === 'timer' ? 'ТАЙМЕР' : 'БУДИЛЬНИК', 960, 330, 50, '#5a5a5a', { outline: false }); text(g, v, 960, 520, 150, S === 'alarm' && Math.floor(t * 4) % 2 ? C.red : '#2a2a2a', { outline: false, font: 'JBMono', weight: 800 }); if (S === 'alarm') for (let k = 0; k < 2; k++) line(g, ell(960, 520, 300 + k * 50, 200 + k * 40, 30, -.6, .6), { line: C.red, lw: 8 }); }
}
// the inside of the glovebox lid: ten rules scratched with a knife; rule 7 scratched out (frost reveals it)
export function lid(g, t, o = {}) {
  bg(g, '#1a1c22'); shape(g, rrect(420, 40, 1420, 1000, 40), { fill: '#4a4e58', shade: '#3a3e48', shadeOff: [-20, -20] });
  if (o.beam) glowRings(g, o.beam[0], o.beam[1], 380, '#fff6c8', .3);
  const Y = i => 120 + (i - 1) * 80, X = 520;
  for (let i = 1; i <= 10; i++) { const y = Y(i), on = (o.show ?? 10) >= i; if (!on) continue;
    if (i === 7) { const fr = o.frost || 0, n = Math.floor(fr * (RULES[6].length + 3));
      if (fr > 0) text(g, `7. ${RULES[6]}`.slice(0, n), X, y, 50, '#f4faff', { outline: '#9ab8d8', lw: 6, align: 'left', font: 'Caveat', weight: 700 });
      if (o.word && fr === 0) text(g, 'ТРУБА', X + 420, y, 50, 'rgba(230,236,245,.75)', { outline: false, font: 'Caveat', weight: 700, align: 'left' });
      g.save(); g.globalAlpha = 1 - fr * .85; for (let k = 0; k < 26; k++) line(g, [[X - 10 + k * 34, y - 30], [X + 40 + k * 34, y + 26]], { line: '#c8ccd4', lw: 4, seed: k }); for (let k = 0; k < 26; k++) line(g, [[X + 40 + k * 34, y - 30], [X - 10 + k * 34, y + 26]], { line: '#9a9ea8', lw: 4, seed: k + 40 }); g.restore(); continue; }
    text(g, `${i}. ${RULES[i - 1]}`, X, y, 50, '#d8dce4', { outline: '#2a2c34', lw: 5, align: 'left', font: 'Caveat', weight: 700 }); }
  text(g, 'В. 14.01', 1660, 960, 50, '#d8dce4', { outline: false, font: 'Caveat', weight: 700 });
  if (o.circle) { const i = o.circle[0], k = o.circle[1], y = Y(i), w = (RULES[i - 1].length + 3) * 23; line(g, ell(X + w / 2, y, w / 2 + 40, 42, 40, Math.PI * .9, Math.PI * .9 + Math.PI * 2.1 * k), { line: C.red, lw: 9 }); }
  if (o.q) for (let k = 0; k < 3; k++) text(g, '?', 1500 + k * 90, Y(7) - 10 + Math.sin(t * 5 + k) * 10, 90, C.red, {});
  if (o.frostAll) { g.save(); g.globalAlpha = .5 * o.frostAll; for (let i = 0; i < 60; i++) { const x0 = 460 + hash(i, 1) * 1340, y0 = 80 + hash(i, 2) * 920; line(g, [[x0, y0], [x0 + 20, y0 - 30], [x0 + 6, y0 - 60]], { line: '#ffffff', lw: 3, seed: i }); } g.restore(); }
  if (o.dark) T.dark(g, o.dark, [{ x: o.beam ? o.beam[0] : 960, y: o.beam ? o.beam[1] : 540, r: 420 }], '#05070f');
}
export function ignition(g, t, k = 0) {
  bg(g, '#26292f'); shape(g, ell(960, 540, 260, 260, 40), { fill: '#3a3a40', shade: '#2a2a30', shadeOff: [-30, -20] }); shape(g, ell(960, 540, 120, 120, 30), { fill: '#1a1a1e', lw: 7 });
  const a = -.6 + k * 1.2; T.setRot(a, 960, 540); shape(g, rrect(930, 380, 60, 320, 20), { fill: '#c8c8c0', lw: 6 }); shape(g, rrect(880, 640, 160, 160, 50), { fill: '#3a3a3a', lw: 6 }); T.setRot(0);
  hand(g, 1060 + Math.cos(a) * 0, 760, 1.2, -2.3 + a * .5, { grip: true });
  for (const [x, ang, lab] of [[700, -.6, 'OFF'], [1220, .6, 'ON']]) text(g, lab, x, 300, 50, k > .5 && lab === 'ON' ? '#7affb0' : '#7a7a80', { outline: false, font: 'JBMono', weight: 800 });
  if (k > .9) { glowRings(g, 960, 540, 400, '#7affb0', .12); text(g, 'ВРРР…', 1500, 860, 90, '#fff6c8', { rot: -.1 }); }
}
export function heater(g, t) { bg(g, '#2a2e36'); shape(g, rrect(560, 300, 800, 300, 40), { fill: '#1a1e24', lw: 8 }); for (let i = 0; i < 6; i++) line(g, [[600, 340 + i * 44], [1320, 340 + i * 44]], { line: '#3a3e48', lw: 10, seed: i }); steam(g, t, 960, 300, .8, '#ffcf8a'); hand(g, 600, 820, 1.3, -1.3, { red: true }); hand(g, 1320, 820, 1.3, -1.84, { red: true }); }
export function fuel(g, t, v = .55) {
  bg(g, '#1a1e24'); shape(g, ell(960, 600, 420, 420, 48, Math.PI, Math.PI * 2), { fill: '#0e1014', lw: 10 }); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; line(g, [[960 + Math.cos(a) * 340, 600 + Math.sin(a) * 340], [960 + Math.cos(a) * 400, 600 + Math.sin(a) * 400]], { line: i < 2 ? C.red : '#e8e8e8', lw: 10, seed: i }); }
  text(g, 'E', 600, 640, 70, C.red, { outline: false }); text(g, 'F', 1320, 640, 70, '#e8e8e8', { outline: false }); text(g, '⛽', 960, 500, 70, C.amber, { outline: false });
  const a = Math.PI + v * Math.PI; line(g, [[960, 600], [960 + Math.cos(a) * 360, 600 + Math.sin(a) * 360]], { line: C.amber, lw: 14 }); dot(g, 960, 600, 30, '#3a3a3a'); glowRings(g, 960, 500, 500, C.amber, .06);
}
export function windowCrack(g, t, k = 0) {
  bg(g, C.cabin); const top = 260 + k * 60; g.save(); g.beginPath(); g.rect(200, 200, 1520, 700); g.clip(); bg(g, '#2a3450'); blizzard(g, t, 80, .8); g.restore();
  shape(g, [[200, top], [1720, top], [1720, 900], [200, 900]], { fill: 'rgba(160,190,230,.35)', lw: 8 }); line(g, [[200, top], [1720, top]], { lw: 14, line: '#1a1a1a' });
  if (k > .2) for (let i = 0; i < 5; i++) { const ph = (t * 1.2 + i / 5) % 1; g.save(); g.globalAlpha = 1 - ph; line(g, [[400 + i * 260, 230], [440 + i * 260 + ph * 60, 300 + ph * 400], [400 + i * 260 + ph * 40, 360 + ph * 520]], { line: '#bfe8ff', lw: 8, seed: i }); g.restore(); }
  hand(g, 1500, 1000, 1.1, -1.9, { grip: true }); shape(g, rect(1400, 920, 220, 60), { fill: '#3a3e48', lw: 6 });
  text(g, '1 СМ', 960, 160, 60, '#bfe8ff', { font: 'JBMono', weight: 800 });
}
export function faceClose(g, t, f = {}, o = {}) {
  if (!o.noBg) bg(g, o.bg || '#2a3040'); if (o.glow) glowRings(g, o.glow[0], o.glow[1], 700, o.glow[2], .25);
  const c = CAST.you, x = o.x ?? 960, y = o.y ?? 470, R = o.R ?? 290;
  shape(g, [[x - 560, 1200], [x - 440, y + R * 1.05], [x + 440, y + R * 1.05], [x + 560, 1200]], { fill: c.coat, shade: c.coatS, shadeOff: [-60, 0] });
  for (let i = 0; i < 5; i++) line(g, [[x - 440 + i * 30, y + R * 1.3 + i * 60], [x + 440 - i * 30, y + R * 1.3 + i * 60]], { line: c.coatS, lw: 6 });
  shape(g, [[x - R * .95, y + R * .8], [x + R * .95, y + R * .8], [x + R * .9, y + R * 1.3], [x - R * .9, y + R * 1.3]], { fill: C.scarf, shade: '#b02a22', shadeOff: [0, -14] });
  face(g, x, y, R, c, f);
  if (o.frostbite) for (const s of [-1, 1]) shape(g, ell(x + s * R * .55, y + R * .4, R * .2, R * .12, 16), { fill: 'rgba(255,120,140,.5)', line: false });
  if (o.breath) { const ph = (t * .8) % 1; g.save(); g.globalAlpha = (1 - ph) * .8; shape(g, ell(x + R * .4 + ph * 300, y + R * .6 - ph * 80, 60 + ph * 120, 40 + ph * 70, 20), { fill: '#e8eef8', line: false }); g.restore(); }
  if (o.pain) for (let i = 0; i < 3; i++) line(g, [[x - R * 1.15 - i * 20, y - R * .7 + i * 30], [x - R * 1.35 - i * 20, y - R * .9 + i * 30]], { line: C.red, lw: 8, seed: i });
  if (o.pinch) hand(g, x + R * 1.4, y + R * 1.5, 1, -2.6, { grip: true });
  if (o.hands) { hand(g, x - R * .5, y + R * .9, 1.1, -Math.PI / 2 + .5, { red: true }); hand(g, x + R * .5, y + R * .9, 1.1, -Math.PI / 2 - .5, { red: true }); }
  if (o.night) T.dark(g, o.night, [{ x: o.lx ?? x, y: o.ly ?? y, r: 600 }], '#070b1a');
  if (o.tint) T.tint(g, o.tint[0], o.tint[1]);
}
export function boot(g, t) { bg(g, '#1e222a'); shape(g, [[620, 300], [980, 300], [1000, 660], [1500, 700], [1520, 860], [600, 860]], { fill: '#3a2a20', shade: '#2a1e16', shadeOff: [0, -30] }); shape(g, rect(580, 860, 960, 70), { fill: '#1a1a1a', lw: 7 }); for (let i = 0; i < 4; i++) { const ph = Math.sin(t * 8 + i) * 10; dot(g, 1300 + i * 40, 760 + ph, 14, '#bfe8ff'); } for (let i = 0; i < 12; i++) dot(g, 640 + hash(i, 1) * 860, 320 + hash(i, 2) * 500, 6, '#ffffff'); text(g, '?', 1460, 520, 120, '#bfe8ff', {}); }
export function frostGlass(g, t, k = 1) {
  bg(g, '#1a2038'); blizzard(g, t, 60, .4); g.save(); g.globalAlpha = .9; for (let i = 0; i < 40; i++) { const x0 = hash(i, 1) * 1920, y0 = 1080 - hash(i, 2) * 200; let pts = [[x0, y0]]; for (let s = 1; s < 8; s++) pts.push([x0 + Math.sin(i + s) * 30 * s * k, y0 - s * 60 * k]); line(g, pts, { line: '#e8f2ff', lw: 4, seed: i }); for (let s = 2; s < 7; s += 2) line(g, [pts[s], [pts[s][0] + 30 * k, pts[s][1] - 20 * k]], { line: '#e8f2ff', lw: 3, seed: i + s }); } g.restore();
  shape(g, [[-100, 1100], [-100, 1080 - k * 500], ...Array.from({ length: 10 }, (_, i) => [i * 220, 1080 - k * 500 + Math.sin(i * 2.3) * 30]), [2100, 1080 - k * 500], [2100, 1100]], { fill: C.snow, shade: C.snowS, shadeOff: [0, 20] });
}
export function antennaClose(g, t, o = {}) {
  bg(g, C.night); blizzard(g, t, 120, .9); shape(g, [[-100, 760], [2100, 700], [2100, 1200], [-100, 1200]], { fill: C.car, shade: C.carS, shadeOff: [0, -30] });
  line(g, [[1000, 720], [960, 140]], { lw: 12 }); const f = Math.sin(t * 12) * 30; if (o.scarf) shape(g, [[962, 170], [1300, 180 + f], [1500, 230 - f], [1300, 260 + f], [966, 250]], { fill: C.scarf, shade: '#b02a22', shadeOff: [0, -14] });
  if (o.tying) hand(g, 860, 300, 1.1, -.3, { grip: true });
  T.dark(g, .3, [{ x: 1100, y: 300, r: 700 }], '#05081a');
}
export function snowHand(g, t, o = {}) {
  bg(g, '#2a3040'); if (o.bottle) { shape(g, rrect(560, 300, 800, 240, 40), { fill: '#1a1e24', lw: 8 }); steam(g, t, 960, 300, .8, '#ffcf8a'); shape(g, [[880, 900], [1040, 900], [1040, 620], [1000, 560], [1000, 500], [920, 500], [920, 560], [880, 620]], { fill: 'rgba(200,230,255,.6)', lw: 7 }); shape(g, [[884, 896], [1036, 896], [1036, 720], [884, 720]], { fill: o.melted ? '#9fd8f0' : '#ffffff', line: false }); hand(g, 700, 800, 1.2, -.2, { grip: true }); return; }
  hand(g, 800, 760, 1.4, -.5, { red: true }); shape(g, ell(960, 580, 160, 90, 24), { fill: '#ffffff', shade: '#d8e4f4', shadeOff: [0, -14] });
  if (o.stop) text(g, 'СТОП', 1400, 300, 120, C.red, { rot: -.1 });
}
export function knockWindow(g, t, hits = []) {
  bg(g, C.cabin); g.save(); g.beginPath(); g.rect(260, 140, 1400, 760); g.clip(); bg(g, '#2a3450'); blizzard(g, t, 100, .8); g.restore(); shape(g, [[260, 140], [1660, 140], [1660, 900], [260, 900]], { fill: 'rgba(160,190,230,.15)', lw: 10 });
  for (const h of hits) { const d = t - h; if (d < 0 || d > .8) continue; for (let k = 0; k < 3; k++) line(g, ell(960, 480, 40 + d * 300 + k * 30, 30 + d * 220 + k * 20, 30, 0, Math.PI * 2.05), { line: 'rgba(255,255,255,.7)', lw: 6 }); text(g, 'ТУК', 960 + (h * 97) % 300 - 150, 300 + (h * 53) % 150, 120, '#fff6c8', { rot: -.08 }); }
}
export function buttonHand(g, t, k = 0) {
  bg(g, C.cabin); shape(g, rrect(500, 400, 900, 300, 40), { fill: '#2c3038', lw: 8 }); for (const x of [700, 1000]) { shape(g, rrect(x, 480, 200, 140, 24), { fill: '#1a1e24', lw: 6 }); text(g, '▼', x + 100, 550, 70, '#7a7a80', { outline: false }); }
  hand(g, 300 + k * 380, 860 - k * 200, 1.2, -.6, {}); if (k < 0) {}
}
export function trunkScrape(g, t) {
  bg(g, C.night); shape(g, [[-100, 700], [2100, 680], [2100, 1200], [-100, 1200]], { fill: C.snow, shade: C.snowS, shadeOff: [0, -30] }); shape(g, rect(900, 100, 1200, 640), { fill: C.car, shade: C.carS, shadeOff: [0, -30] });
  shape(g, rect(960, 300, 70, 110), { fill: C.red, lw: 6 }); glowRings(g, 995, 350, 500, C.red, .25); shape(g, rect(860, 640, 140, 40), { fill: '#5a5a5a', lw: 6 }); shape(g, ell(900, 680, 220, 90, 30), { fill: '#3a4258', lw: 6 });
  const a = Math.sin(t * 6) * .3; line(g, [[500 + a * 80, 200], [760 + a * 120, 700]], { line: '#0a0e1a', lw: 22 }); shape(g, [[700 + a * 120, 650], [840 + a * 120, 690], [800 + a * 120, 780], [680 + a * 120, 740]], { fill: '#0a0e1a', line: false });
  shape(g, ell(560 + a * 90, 330, 70, 50, 20), { fill: '#05070f', line: false }); shape(g, ell(680 + a * 110, 560, 64, 46, 20), { fill: '#05070f', line: false });
  for (let i = 0; i < 12; i++) { const ph = (t * 2 + i / 12) % 1; dot(g, 780 - ph * 400, 700 - Math.sin(ph * Math.PI) * 300, 10, '#fff'); }
  blizzard(g, t, 100, .8); T.dark(g, .3, [{ x: 800, y: 500, r: 600 }], '#05081a');
}
export function hazard(g, t) { bg(g, '#1a1e24'); const on = Math.floor(t * 3) % 2; shape(g, rrect(660, 290, 600, 500, 60), { fill: '#2a2e36', lw: 8 }); shape(g, [[960, 380], [1140, 690], [780, 690]], { fill: on ? C.red : '#5a2020', lw: 8 }); shape(g, [[960, 470], [1060, 640], [860, 640]], { fill: on ? '#ffe8e0' : '#3a1a1a', lw: 6 }); if (on) glowRings(g, 960, 560, 400, C.red, .2); hand(g, 1400, 900, 1.1, -2.4, {}); }
export function handle(g, t, k = 0) { bg(g, C.cabin); shape(g, rrect(500, 380, 900, 320, 40), { fill: '#2c3038', lw: 8 }); shape(g, rrect(760, 480, 380, 110, 30), { fill: '#6a6e78', shade: '#4a4e58', shadeOff: [0, -14] }); hand(g, 600 + k * 260, 760 - k * 180, 1.2, -.5, { grip: k > .8 }); if (k < 0.5 && k > 0) {} }
export function plaque(g, t) {
  bg(g, '#f0c8a0'); T.bands(g, 1920, [0, 400], ['#d8a0a0', '#f0c890']); shape(g, [[-100, 800], [2100, 780], [2100, 1200], [-100, 1200]], { fill: '#f4f6fa', line: false });
  shape(g, rect(860, 0, 200, 1000), { fill: '#5a3a2a', shade: '#4a2e20', shadeOff: [-30, 0] }); shape(g, ell(960, 240, 230, 230, 40), { fill: '#5a7a4a', shade: '#4a6a3a', shadeOff: [-20, -20] }); shape(g, ell(960, 240, 130, 130, 30), { fill: '#5a3a2a', line: false }); for (let i = 0; i < 10; i++) shape(g, ell(960 + Math.cos(i * .63) * 180, 240 + Math.sin(i * .63) * 180, 26, 22, 12), { fill: '#a84a4a', lw: 4, seed: i });
  shape(g, rect(720, 520, 480, 220), { fill: '#e8e4d8', lw: 8 }); text(g, 'ВИКТОР', 960, 590, 80, '#2a2a2a', { outline: false }); text(g, '213 КМ', 960, 680, 64, '#5a5a5a', { outline: false });
  for (let i = 0; i < 8; i++) shape(g, ell(300 + i * 60, 900 - i * 14 + (i % 2) * 20, 30, 12, 12), { fill: '#aab4c8', line: false, seed: i });
}
