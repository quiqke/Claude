// world.js — «30 дней в бункере»: the bunker set, the cross-section (bunker under the garage), close-up inserts.
import * as T from './toon.js';
const { shape, line, ell, rect, rrect, dot, text, glowRings, INK, person, face, CAST } = T;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const C = { wall: '#8d978b', wallS: '#737d72', seam: '#646d63', ceil: '#535a52', floor: '#5d625b', floorS: '#4a4f48', metal: '#9ea7ab', metalS: '#737c80', lamp: '#ffe7a0', red: '#ff3a2a', yellow: '#ffc928', wood: '#8a5a34', woodS: '#6a4226', paper: '#f1e9d2', soil: '#5a4030', soilS: '#46301f', night: '#141c38' };
CAST.you = { skin: '#f2b48a', skinS: '#d98a62', hair: '#5a3220', hairS: '#3e2116', coat: '#ffc928', coatS: '#e09a12', pants: '#33415e', pantsS: '#232c44', boots: '#5b3a2a', h: 1 };
CAST.gena = { skin: '#e8b08c', skinS: '#c98a66', hair: '#dcdcd4', hairS: '#b0b0a6', coat: '#8a5a34', coatS: '#6a4226', pants: '#4a4a52', pantsS: '#36363c', boots: '#2a211c', h: .95 };
CAST.shadow = { skin: '#3e4446', skinS: '#3e4446', hair: '#3e4446', hairS: '#3e4446', coat: '#3e4446', coatS: '#3e4446', pants: '#3e4446', pantsS: '#3e4446', boots: '#3e4446', h: 1 };
CAST.cop = { skin: '#e8b08c', skinS: '#c98a66', hair: '#2a2a2a', hairS: '#1a1a1a', coat: '#2a3f66', coatS: '#1d2d4c', pants: '#1e2638', pantsS: '#141a28', boots: '#111111', h: 1.05 };
export const RULES = ['НЕ ОТКРЫВАЙ ДВЕРЬ 30 ДНЕЙ', 'НЕ ОТВЕЧАЙ ГОЛОСАМ', 'ЕШЬ ТОЛЬКО ТО, ЧТО ПРИХОДИТ ПО ТРУБЕ', 'НЕ СМОТРИ В ПЕРИСКОП ПОСЛЕ ЗАКАТА', 'ЕСЛИ СЧЁТЧИК ТРЕЩИТ — ЛОЖИСЬ НА ПОЛ', 'НЕ ТРОГАЙ ПРОВОДА ЗА РАДИО', 'ВЕРЬ ТОЛЬКО «КОВЧЕГУ»'];
export const bg = (g, col) => shape(g, rect(-600, -600, 3200, 2400), { fill: col, line: false });
export function capsule(x0, y0, x1, y1, w) { const a = Math.atan2(y1 - y0, x1 - x0); return [...ell(x0, y0, w / 2, w / 2, 12, a + Math.PI / 2, a + Math.PI * 1.5), ...ell(x1, y1, w / 2, w / 2, 12, a - Math.PI / 2, a + Math.PI / 2)]; }
// a cartoon hand (palm + fingers) with a sleeve; rot = direction the fingers point (rad, 0 = right)
export function hand(g, x, y, s = 1, rot = 0, o = {}) {
  const c = CAST[o.who || 'you'], R = (dx, dy) => [x + (dx * Math.cos(rot) - dy * Math.sin(rot)) * s, y + (dx * Math.sin(rot) + dy * Math.cos(rot)) * s];
  if (o.sleeve !== false) { shape(g, [R(-260, -62), R(-40, -70), R(-40, 70), R(-260, 62)], { fill: o.sleeve || c.coat, shade: c.coatS, shadeOff: [0, 18 * s] }); if (o.knit) for (let i = 0; i < 6; i++) line(g, [R(-240 + i * 34, -40), R(-223 + i * 34, -20), R(-206 + i * 34, -40)], { line: c.coatS, lw: 5 }); shape(g, [R(-60, -74), R(-30, -74), R(-30, 74), R(-60, 74)], { fill: c.coatS, lw: 6 }); }
  const curl = o.grip ? .55 : 0;
  for (let i = 0; i < 4; i++) { const fy = -42 + i * 28, L = (i === 0 || i === 3 ? 78 : 92) * (1 - curl * .45); shape(g, capsule(...R(40, fy), ...R(40 + L, fy + (o.grip ? 22 : 0)), 30 * s), { fill: c.skin, shade: c.skinS, shadeOff: [0, 6 * s], lw: 6 }); }
  shape(g, ell(...R(10, 0), 62 * s, 64 * s, 24), { fill: c.skin, shade: c.skinS, shadeOff: [0, 14 * s] });
  shape(g, capsule(...R(10, -50), ...R(58, -88), 32 * s), { fill: c.skin, shade: c.skinS, lw: 6 });
}
// ── the bunker room (world coords 1920×1080, floor at y 900)
export function room(g, t, o = {}) {
  bg(g, C.wall);
  for (let y = 120; y < 900; y += 190) line(g, [[-300, y], [2300, y]], { line: C.seam, lw: 5, seed: y });
  for (let r = 0; r < 5; r++) for (let x = -300 + (r % 2) * 150; x < 2300; x += 300) line(g, [[x, 120 + r * 190], [x, 310 + r * 190]], { line: C.seam, lw: 5, seed: x + r });
  shape(g, rect(-300, -200, 2600, 330), { fill: C.ceil, line: false }); line(g, [[-300, 128], [2300, 128]], { lw: 7 });
  line(g, [[-300, 40], [2300, 40]], { line: '#6a706a', lw: 26 }); line(g, [[-300, 86], [2300, 86]], { line: '#7a6a5a', lw: 16 });
  shape(g, [[-300, 900], [2300, 900], [2300, 1400], [-300, 1400]], { fill: C.floor, shade: C.floorS, shadeOff: [0, -40] });
  for (const x of [200, 700, 1250]) shape(g, ell(x, 960, 120, 18, 16), { fill: C.floorS, line: false, seed: x });
  // vent grille + pipe (upper left)
  shape(g, rect(250, 128, 120, 60), { fill: '#7a817a', lw: 6 }); shape(g, rrect(210, 180, 200, 120, 14), { fill: '#6c736d', shade: '#5a605a', shadeOff: [0, -14] });
  for (let i = 0; i < 4; i++) line(g, [[230, 204 + i * 24], [390, 204 + i * 24]], { lw: 7, seed: i });
  // shelves with cans
  for (const y of [360, 510, 660]) { shape(g, rect(40, y, 420, 22), { fill: C.wood, shade: C.woodS, shadeOff: [0, -8] }); for (let i = 0; i < 6; i++) { const cx = 70 + i * 64, h = 60 + (i % 3) * 14; shape(g, rect(cx, y - h, 48, h), { fill: ['#c94a3a', '#d8b23a', '#5a8ac0', '#7aa04a'][(i + y) % 4], shade: '#00000033', shadeOff: [-10, 0], seed: i + y }); line(g, [[cx, y - h + 14], [cx + 48, y - h + 14]], { lw: 4, seed: i }); } }
  // cot
  shape(g, rrect(60, 760, 520, 54, 18), { fill: '#6a7a8a', shade: '#55636f', shadeOff: [0, -14] }); for (const x of [80, 540]) line(g, [[x, 810], [x, 900]], { lw: 12, seed: x }); line(g, [[60, 812], [580, 812]], { lw: 10 });
  shape(g, rrect(80, 730, 150, 50, 22), { fill: '#e8e4d8', lw: 6 }); shape(g, rrect(260, 744, 300, 30, 12), { fill: '#7a5a8a', lw: 6 });
  // rules list + calendar
  T.setRot(-.03, 720, 400); shape(g, rect(610, 210, 230, 320), { fill: C.paper, shade: '#d8ccb0', shadeOff: [-10, -10] }); for (let i = 0; i < 9; i++) line(g, [[630, 250 + i * 30], [630 + (i ? 150 + (i * 37) % 40 : 190), 250 + i * 30]], { lw: 4, seed: i }); T.setRot(0);
  if (o.circle) { const y = 250 + o.circle * 30; line(g, ell(720, y, 110, 22, 24, 0, Math.PI * 2.1), { line: C.red, lw: 7 }); }
  shape(g, rect(640, 580, 170, 150), { fill: '#f4f1ea', lw: 6 }); shape(g, rect(640, 580, 170, 32), { fill: C.red, lw: 6 });
  for (let i = 0; i < 30; i++) { const cx = 652 + (i % 6) * 26, cy = 626 + Math.floor(i / 6) * 20; if (i < (o.day || 0) - 1) line(g, [[cx, cy], [cx + 16, cy + 12]], { line: C.red, lw: 4, seed: i }); else dot(g, cx + 8, cy + 6, 3, '#9a9a9a'); }
  // periscope
  shape(g, rect(855, 40, 50, 380), { fill: C.metal, shade: C.metalS, shadeOff: [-14, 0] }); shape(g, rrect(815, 410, 130, 90, 16), { fill: C.metal, shade: C.metalS, shadeOff: [-18, 0] });
  shape(g, rrect(840, 440, 80, 46, 14), { fill: '#2a2a30', lw: 6 }); for (const s of [-1, 1]) shape(g, rrect(880 + s * 92 - 18, 448, 36, 30, 10), { fill: '#3a3a40', lw: 6 });
  if (o.periGlow) glowRings(g, 880, 463, 60, '#fff6d0', o.periGlow);
  // lamp in a cage
  line(g, [[1000, 128], [1000, 190]], { lw: 6 }); const on = o.lamp ?? 1; if (on > 0) glowRings(g, 1000, 220, 260, C.lamp, .18 * on);
  shape(g, ell(1000, 222, 34, 40, 18), { fill: on > 0 ? '#fff6c8' : '#9a9a8a', lw: 6 }); for (let i = -2; i <= 2; i++) line(g, [[1000 + i * 14, 186], [1000 + i * 18, 262]], { lw: 5, seed: i });
  // table, radio, counter
  shape(g, rect(980, 650, 360, 26), { fill: C.wood, shade: C.woodS, shadeOff: [0, -8] }); for (const x of [1000, 1310]) line(g, [[x, 676], [x, 900]], { lw: 12, seed: x });
  radioBox(g, 1010, 510, 1, o); counterBox(g, 1230, 568, .9, o);
  // delivery tube + tray
  shape(g, rect(1420, 40, 56, 470), { fill: '#8a8f80', shade: '#6c7064', shadeOff: [-14, 0] }); shape(g, rrect(1400, 500, 96, 60, 10), { fill: '#7a7f70', lw: 6 });
  shape(g, [[1380, 600], [1520, 600], [1505, 628], [1395, 628]], { fill: C.metal, shade: C.metalS, shadeOff: [0, -8] }); line(g, [[1450, 560], [1450, 600]], { lw: 6 });
  if (o.tray) o.tray(1450, 600);
  // canisters + gas mask
  for (const [x, col] of [[1360, '#3a7ab8'], [1440, '#3a9a6a']]) { shape(g, rrect(x - 34, 790, 68, 110, 12), { fill: col, shade: '#00000033', shadeOff: [-12, 0], seed: x }); shape(g, rect(x - 10, 770, 20, 22), { fill: '#2a2a2a', lw: 5 }); }
  dot(g, 1560, 300, 8); if (!o.noMask) gasMask(g, 1560, 380, .9);
  // door
  doorDraw(g, 1740, 560, 1, o);
  // red dot camera (ceiling corner)
  shape(g, ell(1870, 140, 44, 24, 18, Math.PI, Math.PI * 2), { fill: '#e8e8e4', lw: 6 }); const blink = Math.floor(t * (o.fast ? 6 : 1.5)) % 2 === 0;
  dot(g, 1870, 130, 7, blink ? C.red : '#7a2a2a'); if (blink) glowRings(g, 1870, 130, 26, C.red, .25);
  if (o.hero) { const h = o.hero; if (h.lie) T.setRot(-Math.PI / 2, h.x, h.fy); const r = person(g, h.who || 'you', h.x, h.fy ?? 900, h.s ?? 1, h); T.setRot(0); if (h.mask) { gasMask(g, r.head[0], r.head[1] + r.R * .1, r.R / 70); } if (h.lamp) glowRings(g, r.hand[0], r.hand[1], 80, '#fff6c8', .5); }
  if (o.extra) o.extra();
  if (o.night) T.dark(g, o.night, [{ x: 1000, y: 230, r: on > 0 ? 420 : 160 }, ...(o.holes || [])], '#0a0e20');
}
export function radioBox(g, x, y, s = 1, o = {}) {
  const S = v => v * s;
  line(g, [[x + S(170), y], [x + S(210), y - S(90)]], { lw: 5 });
  shape(g, rrect(x, y, S(200), S(140), S(18)), { fill: '#8a5a34', shade: '#6a4226', shadeOff: [S(-16), S(-10)] });
  shape(g, rrect(x + S(14), y + S(16), S(96), S(108), S(10)), { fill: '#d8c8a0', lw: 5 }); for (let i = 0; i < 6; i++) line(g, [[x + S(22), y + S(30 + i * 15)], [x + S(102), y + S(30 + i * 15)]], { line: '#8a7a5a', lw: 4, seed: i });
  shape(g, ell(x + S(155), y + S(52), S(30), S(30), 18), { fill: o.radioOn === false ? '#5a5040' : o.alarm ? '#ff6a4a' : '#ffcf6a', lw: 6 }); line(g, [[x + S(155), y + S(52)], [x + S(165), y + S(32)]], { lw: 4 });
  for (const k of [0, 1]) shape(g, ell(x + S(140 + k * 32), y + S(108), S(12), S(12), 12), { fill: '#3a2a20', lw: 4 });
}
export function counterBox(g, x, y, s = 1, o = {}) {
  const S = v => v * s, tick = o.clicks ? Math.sin(T.BOIL + (o.tt || 0) * 53) * .7 * o.clicks : 0;
  shape(g, rrect(x, y, S(100), S(84), S(12)), { fill: C.yellow, shade: '#d8a010', shadeOff: [S(-12), S(-8)] });
  shape(g, ell(x + S(50), y + S(40), S(34), S(26), 20, Math.PI, Math.PI * 2), { fill: '#f4f1ea', lw: 4 });
  const a = -Math.PI / 2 - .9 + (o.clicks ? .9 + tick : 0); line(g, [[x + S(50), y + S(40)], [x + S(50) + Math.cos(a) * S(28), y + S(40) + Math.sin(a) * S(28)]], { line: C.red, lw: 4 });
}
export function gasMask(g, x, y, s = 1) {
  shape(g, ell(x, y, 70 * s, 84 * s, 24), { fill: '#5a6a5a', shade: '#46544a', shadeOff: [-14 * s, 0] });
  for (const k of [-1, 1]) shape(g, ell(x + k * 30 * s, y - 16 * s, 22 * s, 22 * s, 16), { fill: '#9fd0d8', lw: 6 });
  shape(g, ell(x, y + 50 * s, 34 * s, 30 * s, 16), { fill: '#3a3a3a', shade: '#262626', shadeOff: [-8 * s, 0] }); for (let i = -1; i <= 1; i++) line(g, [[x - 20 * s, y + 50 * s + i * 10 * s], [x + 20 * s, y + 50 * s + i * 10 * s]], { line: '#6a6a6a', lw: 3 });
}
export function doorDraw(g, x, y, s = 1, o = {}) {
  const R = 230 * s; shape(g, ell(x, y, R + 34 * s, R + 34 * s, 48), { fill: '#5d666b', shade: '#4a5257', shadeOff: [-16, -10] });
  if (o.open) { shape(g, ell(x, y, R, R, 48), { fill: '#fff0b0', line: false }); glowRings(g, x, y, R * 1.6, '#ffe7a0', .3 * o.open); }
  else { shape(g, ell(x, y, R, R, 48), { fill: '#8f989d', shade: '#737c80', shadeOff: [-24, -14] }); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dot(g, x + Math.cos(a) * (R - 22 * s), y + Math.sin(a) * (R - 22 * s), 7 * s, '#5d666b'); } }
  if (!o.open) wheel(g, x, y, 120 * s, o.wheelRot || 0);
}
export function wheel(g, x, y, r, rot = 0) {
  line(g, ell(x, y, r, r, 40, 0, Math.PI * 2.05), { line: '#b8402a', lw: 22 * (r / 120) }); line(g, ell(x, y, r, r, 40, 0, Math.PI * 2.05), { lw: 5 });
  for (let i = 0; i < 4; i++) { const a = rot + i * Math.PI / 2; line(g, [[x, y], [x + Math.cos(a) * r, y + Math.sin(a) * r]], { line: '#b8402a', lw: 16 * (r / 120), seed: i }); }
  shape(g, ell(x, y, r * .2, r * .2, 16), { fill: '#7a2a1a', lw: 5 });
}
// ── close-ups (screen space)
export function radioClose(g, t, o = {}) {
  bg(g, o.alarm ? '#4a1a1a' : '#2a2620'); if (o.alarm) glowRings(g, 960, 540, 700, C.red, .12 + .06 * Math.sin(t * 6));
  shape(g, rect(-200, 880, 2400, 400), { fill: C.wood, shade: C.woodS, shadeOff: [0, -20] });
  radioBox(g, 420, 250, 5.4, { radioOn: o.on !== false, alarm: o.alarm });
  text(g, 'КОВЧЕГ', 1257, 600, 44, '#3a2a20', { outline: false, weight: 800, font: 'JBMono' });
  if (o.talk) for (let k = 0; k < 3; k++) { const ph = (t * 1.4 + k / 3) % 1; g.save(); g.globalAlpha = 1 - ph; line(g, ell(680, 540, 300 + ph * 520, 300 + ph * 520, 30, -Math.PI * .28, Math.PI * .28), { line: o.alarm ? '#ff8a6a' : '#ffe7a0', lw: 10 }); line(g, ell(680, 540, 300 + ph * 520, 300 + ph * 520, 30, Math.PI * .72, Math.PI * 1.28), { line: o.alarm ? '#ff8a6a' : '#ffe7a0', lw: 10 }); g.restore(); }
}
export function counterClose(g, t, o = {}) {
  bg(g, '#2a2620'); shape(g, rect(-200, 900, 2400, 400), { fill: C.wood, shade: C.woodS, shadeOff: [0, -20] });
  const k = o.clicks || 0, j = k ? Math.sin(t * 71) * Math.sin(t * 23) : 0;
  shape(g, rrect(560, 200, 800, 680, 60), { fill: C.yellow, shade: '#d8a010', shadeOff: [-40, -26] });
  shape(g, ell(960, 560, 300, 230, 40, Math.PI, Math.PI * 2), { fill: '#f4f1ea', lw: 8 }); for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; line(g, [[960 + Math.cos(a) * 260, 560 + Math.sin(a) * 200], [960 + Math.cos(a) * 290, 560 + Math.sin(a) * 222]], { lw: i > 7 ? 8 : 5, line: i > 7 ? C.red : INK, seed: i }); }
  const a = Math.PI + .25 + (k ? 2.1 + j * .5 : 0); line(g, [[960, 560], [960 + Math.cos(a) * 250, 560 + Math.sin(a) * 190]], { line: C.red, lw: 10 }); dot(g, 960, 560, 18);
  if (!o.open) text(g, 'ГЕЙГЕР', 960, 700, 70, '#3a2a10', { outline: false, font: 'JBMono', weight: 800 });
  if (o.open) { shape(g, ell(960, 760, 120, 70, 30), { fill: '#3a3a3a', lw: 7 }); shape(g, ell(960, 760, 60, 34, 20), { fill: '#6a6a6a', lw: 5 }); line(g, [[1080, 760], [1500, 640], [2100, 600]], { line: C.red, lw: 10 }); text(g, 'ДИНАМИК', 1560, 520, 70, '#fff', {}); }
  if (k > 0 && Math.floor(t * 8) % 2 === 0) { text(g, 'ТРЕСК', 300 + (hash(Math.floor(t * 8)) * 200), 220 + hash(Math.floor(t * 8), 3) * 120, 90, '#fff', { rot: -.2 }); text(g, 'ТРЕСК', 1600 - hash(Math.floor(t * 8), 5) * 200, 300 + hash(Math.floor(t * 8), 7) * 200, 80, '#fff', { rot: .2 }); }
}
export function doorClose(g, t, o = {}) {
  bg(g, C.wall); for (let y = 0; y < 1080; y += 190) line(g, [[-100, y], [2100, y]], { line: C.seam, lw: 5, seed: y });
  doorDraw(g, 960, 560, 2.3, { wheelRot: o.rot || 0 });
  if (o.bolt != null) { const k = o.bolt; shape(g, rect(1300 - k * 200, 500, 420, 70), { fill: '#6a7276', shade: '#4a5256', shadeOff: [0, -14] }); }
  if (o.hand) { hand(g, 820 + (o.strain ? Math.sin(t * 40) * 6 : 0), 330, 1.4, -.35, { grip: true }); if (o.two) hand(g, 1260 + (o.strain ? Math.sin(t * 37) * 6 : 0), 760, 1.4, Math.PI + .5, { grip: true }); if (o.cold) for (let i = 0; i < 3; i++) line(g, [[1000 + i * 40, 300 - i * 20], [1040 + i * 40, 260 - i * 20], [1010 + i * 40, 230 - i * 20]], { line: '#bfe8ff', lw: 8, seed: i }); }
  if (o.night) T.dark(g, o.night, [{ x: 960, y: 540, r: 700 }], '#0a0e20');
}
export function ventClose(g, t, o = {}) {
  bg(g, C.wall); shape(g, rrect(460, 260, 1000, 560, 60), { fill: '#6c736d', shade: '#5a605a', shadeOff: [0, -40] });
  for (let i = 0; i < 6; i++) shape(g, rrect(520, 310 + i * 80, 880, 34, 14), { fill: '#1a1c22', lw: 7, seed: i });
  if (o.waves) for (let k = 0; k < 3; k++) { const ph = (t * 1.2 + k / 3) % 1; g.save(); g.globalAlpha = (1 - ph) * o.waves; line(g, ell(960, 540, 520 + ph * 500, 300 + ph * 260, 40, 0, Math.PI * 2.02), { line: '#ffe7a0', lw: 10 }); g.restore(); }
  if (o.night) T.dark(g, o.night, [{ x: 960, y: 540, r: 650 }], '#0a0e20');
}
export function ceilingKnock(g, t, hits = []) {
  bg(g, C.ceil); for (let x = -100; x < 2100; x += 300) line(g, [[x, -100], [x + 40, 1200]], { line: '#4a5048', lw: 5, seed: x });
  line(g, [[-100, 420], [2100, 420]], { line: '#6a706a', lw: 60 }); line(g, [[-100, 600], [2100, 600]], { line: '#7a6a5a', lw: 30 });
  for (const h of hits) { const d = t - h; if (d < 0) continue; for (let i = 0; i < 26; i++) { const x = 400 + hash(i, h * 10) * 1100, y = 300 + d * (500 + hash(i, 3) * 500) + d * d * 400; if (y < 1200) dot(g, x, y, 5 + hash(i, 5) * 6, '#b8b0a0'); } if (d < .5) text(g, 'ТУК!', 600 + (h * 137) % 700, 260 + (h * 71) % 200, 150, '#fff6c8', { rot: -.1 + (h % .2) }); }
  T.dark(g, .7, [{ x: 960, y: 500, r: 700 }], '#0a0e20');
}
export function rulesClose(g, t, o = {}) {
  bg(g, C.wall); T.setRot(-.015, 1100, 540); shape(g, rect(400, 30, 1440, 880), { fill: C.paper, shade: '#ddd0b2', shadeOff: [-20, -20] });
  const typed = o.typed ?? 1e9, X = 480, Y = (i) => 330 + (i - 1) * 84, CW = 26.4; let n = 0;
  const ty = (s, x, y, sz, col = '#2a2420') => { const k = Math.max(0, Math.min(s.length, Math.floor(typed - n))); n += s.length; if (k) text(g, s.slice(0, k), x, y, sz, col, { outline: false, align: 'left', font: 'JBMono', weight: 800 }); };
  ty('УБЕЖИЩЕ «КОВЧЕГ»', X, 110, 64); ty('ПРАВИЛА ДЛЯ ВЫЖИВШЕГО', X, 185, 46, '#5a4a3a'); line(g, [[X, 235], [1760, 235]], { lw: 5 });
  RULES.forEach((r, i) => ty(`${i + 1}. ${r}`, X, Y(i + 1), 44));
  for (const [i, k] of o.circle || []) if (k > 0) { const w = (RULES[i - 1].length + 3) * CW; line(g, ell(X + w / 2, Y(i) - 2, w / 2 + 40, 42, 40, Math.PI * .9, Math.PI * .9 + Math.PI * 2.1 * k), { line: C.red, lw: 9 }); }
  for (const [i, k] of o.cross || []) if (k > 0) { const w = (RULES[i - 1].length + 3) * CW; line(g, [[X - 20, Y(i)], [X - 20 + (w + 40) * k, Y(i) - 6]], { line: C.red, lw: 12 }); }
  T.setRot(0);
}
export function tubeDrop(g, t, o = {}) {
  bg(g, C.wall); for (let y = 120; y < 1080; y += 190) line(g, [[-100, y], [2100, y]], { line: C.seam, lw: 5, seed: y });
  shape(g, rect(840, -100, 240, 470), { fill: '#8a8f80', shade: '#6c7064', shadeOff: [-40, 0] });
  const op = o.open || 0; shape(g, rrect(800, 340, 320, 140, 20), { fill: '#7a7f70', lw: 8 }); shape(g, [[830, 470], [1090, 470], [1090 - op * 40, 470 + op * 150], [830 + op * 40, 470 + op * 150]], { fill: '#5a5f50', lw: 7 });
  shape(g, [[480, 700], [1440, 700], [1380, 780], [540, 780]], { fill: C.metal, shade: C.metalS, shadeOff: [0, -20] });
  const items = o.items || [];
  for (const it of items) { const k = clamp(it.k), y = 470 + (it.y - 470) * (k < 1 ? k * k : 1) - (k >= 1 ? 0 : 0), x = it.x; if (it.k <= 0) continue;
    if (it.kind === 'can') { shape(g, rect(x - 70, y - 140, 140, 140), { fill: '#c94a3a', shade: '#a83a2a', shadeOff: [-20, 0] }); shape(g, rect(x - 70, y - 100, 140, 50), { fill: '#f4f1ea', lw: 5 }); text(g, 'ТУШЁНКА', x, y - 75, 26, '#3a2a20', { outline: false }); }
    if (it.kind === 'bottle') { shape(g, [[x - 40, y], [x + 40, y], [x + 40, y - 170], [x + 16, y - 210], [x + 16, y - 240], [x - 16, y - 240], [x - 16, y - 210], [x - 40, y - 170]], { fill: '#9fd8f0', shade: '#7ab8d0', shadeOff: [-12, 0] }); shape(g, rect(x - 18, y - 260, 36, 22), { fill: '#3a7ab8', lw: 5 }); }
    if (it.kind === 'bread') { const news = it.news; shape(g, rrect(x - 190, y - 130, 380, 130, 60), { fill: news ? '#e8e4d8' : '#b8b4a8', shade: news ? '#c8c4b8' : '#98948a', shadeOff: [0, -20] }); if (news) { for (let i = 0; i < 5; i++) line(g, [[x - 150, y - 100 + i * 20], [x + 150 - (i % 2) * 60, y - 100 + i * 20]], { lw: 4, seed: i }); text(g, 'ВЕСТИ', x - 60, y - 112, 26, INK, { outline: false, font: 'JBMono', weight: 800 }); } else { shape(g, ell(x + 120, y - 90, 60, 40, 16), { fill: '#d8a060', lw: 5 }); } if (it.steam) steam(g, t, x, y - 140, it.steam); }
    if (it.kind === 'wrapper') { shape(g, [[x - 40, y - 30], [x + 40, y - 30], [x + 60, y - 15], [x + 40, y], [x - 40, y], [x - 60, y - 15]], { fill: '#3ac06a', lw: 5 }); if (it.ring) line(g, ell(x, y - 15, 110, 70, 30, 0, Math.PI * 2.1), { line: C.red, lw: 9 }); }
  }
  if (o.clank) text(g, 'ЛЯЗГ!', 1380, 300, 130, '#fff6c8', { rot: .12 });
  if (o.clock) { shape(g, ell(1500, 470, 120, 120, 36), { fill: '#f4f1ea', lw: 8 }); line(g, [[1500, 470], [1500, 380]], { lw: 9 }); line(g, [[1500, 470], [1500, 545]], { lw: 7 }); text(g, '07:00', 1500, 660, 70, '#fff6c8', { font: 'JBMono', weight: 800 }); }
}
export function steam(g, t, x, y, a = 1) { for (let i = 0; i < 3; i++) { const ph = (t * .7 + i / 3) % 1; g.save(); g.globalAlpha = a * (1 - ph) * .9; line(g, Array.from({ length: 8 }, (_, k) => [x - 80 + i * 80 + Math.sin(k * .9 + t * 3 + i) * 18, y - ph * 160 - k * 26]), { line: '#ffffff', lw: 9 }); g.restore(); } }
export function breadHands(g, t, k = 0) {
  bg(g, '#3a3430'); glowRings(g, 960, 520, 600, '#ffcf8a', .14);
  const sp = k * 120; shape(g, rrect(560 - sp, 400, 420, 260, 110), { fill: '#d8a060', shade: '#b07838', shadeOff: [0, -30] }); shape(g, rrect(940 + sp, 400, 420, 260, 110), { fill: '#d8a060', shade: '#b07838', shadeOff: [0, -30] });
  if (k > 0) { shape(g, ell(970 - sp * .5, 530, 40, 110, 20), { fill: '#f4e2b8', lw: 6 }); shape(g, ell(950 + sp * .5, 530, 40, 110, 20), { fill: '#f4e2b8', lw: 6 }); steam(g, t, 960, 380, k); }
  hand(g, 560 - sp, 700, 1.3, -Math.PI / 2 + .3, { grip: true }); hand(g, 1360 + sp, 700, 1.3, -Math.PI / 2 - .3, { grip: true });
}
export function wrapperClose(g, t, o = {}) {
  bg(g, o.tint || '#2e3a30'); glowRings(g, 960, 520, 520, '#7affb0', .1);
  T.setRot(-.15, 960, 520); shape(g, [[700, 420], [1220, 420], [1340, 520], [1220, 620], [700, 620], [580, 520]], { fill: '#3ac06a', shade: '#2a9a50', shadeOff: [0, -20] }); for (const x of [700, 1220]) line(g, [[x, 420], [x, 620]], { lw: 6 });
  shape(g, ell(960, 520, 90, 50, 20), { fill: '#bfffd0', lw: 6 }); text(g, 'МЯТА', 960, 522, 46, '#1a6a3a', { outline: false }); T.setRot(0);
  hand(g, 560, 700, 1.1, -.6, { grip: true });
  if (o.smell) for (let i = 0; i < 3; i++) { const ph = (t * .6 + i / 3) % 1; g.save(); g.globalAlpha = 1 - ph; line(g, Array.from({ length: 8 }, (_, k) => [1100 + i * 90 + Math.sin(k + t * 3) * 20, 380 - ph * 200 - k * 28]), { line: '#9affc0', lw: 9 }); g.restore(); }
}
// big face close-up: hoodie, face, optional hands over the mouth, gas mask, bread at the cheek, wrapper at the nose
export function bigFace(g, t, f = {}, o = {}) {
  if (!o.noBg) bg(g, o.bg || C.wall); if (o.glow) glowRings(g, o.glow[0], o.glow[1], 700, o.glow[2], .25);
  const c = CAST.you, x = o.x ?? 960, y = o.y ?? 470, R = o.R ?? 290;
  shape(g, [[x - 520, 1200], [x - 420, y + R * 1.05], [x + 420, y + R * 1.05], [x + 520, 1200]], { fill: c.coat, shade: c.coatS, shadeOff: [-60, 0] });
  shape(g, [...ell(x, y + R * .9, R * 1.25, R * .5, 30, Math.PI, Math.PI * 2)], { fill: c.coatS, lw: 7 });
  face(g, x, y, R, c, f);
  if (o.mask) { shape(g, ell(x, y + R * .15, R * .95, R * .9, 30), { fill: '#5a6a5a', shade: '#46544a', shadeOff: [-R * .15, 0] }); for (const k of [-1, 1]) { shape(g, ell(x + k * R * .38, y - R * .05, R * .26, R * .26, 20), { fill: '#9fd0d8', lw: 7 }); dot(g, x + k * R * .38, y - R * .05, R * .06); } shape(g, ell(x, y + R * .62, R * .36, R * .3, 18), { fill: '#3a3a3a', lw: 7 }); }
  if (o.hands) { hand(g, x - R * .5, y + R * .82, 1.15, -Math.PI / 2 + .5, { grip: false }); hand(g, x + R * .5, y + R * .82, 1.15, -Math.PI / 2 - .5, { grip: false }); }
  if (o.bread) { shape(g, rrect(x + R * .55, y - R * .2, R * 1.1, R * .7, R * .3), { fill: '#d8a060', shade: '#b07838', shadeOff: [0, -20] }); steam(g, t, x + R * 1.1, y - R * .3, .8); }
  if (o.wrapper) { shape(g, [[x - 90, y + R * .35], [x + 90, y + R * .35], [x + 120, y + R * .45], [x + 90, y + R * .55], [x - 90, y + R * .55], [x - 120, y + R * .45]], { fill: '#3ac06a', lw: 6 }); hand(g, x - 40, y + R * .95, .9, -Math.PI / 2, { grip: true }); }
  if (o.night) T.dark(g, o.night, [{ x: o.lightX ?? x, y: o.lightY ?? y, r: 600 }], '#0a0e20');
  if (o.tint) T.tint(g, o.tint[0], o.tint[1]);
}
export function genaFace(g, t, f = {}, o = {}) {
  bg(g, o.bg || '#6a4a30'); glowRings(g, 1300, 300, 700, '#ffd890', .2);
  const c = CAST.gena, x = 960, y = 470, R = 280;
  shape(g, [[x - 520, 1200], [x - 420, y + R * 1.05], [x + 420, y + R * 1.05], [x + 520, 1200]], { fill: c.coat, shade: c.coatS, shadeOff: [-60, 0] });
  for (let i = 0; i < 12; i++) line(g, [[x - 400 + i * 70, y + R * 1.3], [x - 365 + i * 70, y + R * 1.4], [x - 330 + i * 70, y + R * 1.3]], { line: c.coatS, lw: 6 });
  face(g, x, y, R, c, f); glasses(g, x, y, R, f.side || 0);
}
export function glasses(g, x, y, R, side = 0) { const sx = side * R * .28, ey = y + R * .05; for (const s of [-1, 1]) line(g, ell(x + s * R * .36 + sx, ey, R * .3, R * .28, 24, 0, Math.PI * 2.05), { lw: 6 }); line(g, [[x - R * .06 + sx, ey], [x + R * .06 + sx, ey]], { lw: 6 }); }
// periscope view: the "dead world" — static (a painted picture: nothing ever moves)
export function periView(g, t, o = {}) {
  bg(g, '#000'); g.save(); g.beginPath(); g.arc(960, 540, 430, 0, 7); g.clip();
  const z = o.zoom === 'crow' ? [860, 445, 2.6] : o.zoom === 'clock' ? [1200, 330, 2.6] : [960, 540, 1];
  const keep = { ...T.CAM }; T.setCam(z[0], z[1], z[2]);
  bg(g, '#9b9a94'); T.bands(g, 1920, [0, 250, 450], ['#8a8984', '#a3a19a', '#b5b2a8']);
  shape(g, [[-300, 700], [300, 660], [800, 690], [1300, 650], [2200, 700], [2200, 1400], [-300, 1400]], { fill: '#5a5650', shade: '#4a4640', shadeOff: [0, -30] });
  for (let i = 0; i < 9; i++) { const x = 160 + i * 190 + (i % 2) * 40, h = 300 + (i % 3) * 80; line(g, [[x, 700], [x, 700 - h]], { lw: 12, seed: i }); line(g, [[x, 700 - h * .6], [x + 70, 700 - h * .8]], { lw: 8, seed: i + 10 }); line(g, [[x, 700 - h * .45], [x - 60, 700 - h * .65]], { lw: 8, seed: i + 20 }); }
  line(g, [[700, 470], [960, 452]], { lw: 12 });                                  // the branch
  shape(g, [[800, 450], [860, 428], [900, 438], [920, 423], [912, 446], [890, 460], [830, 464]], { fill: '#1a1a1e', lw: 5 }); dot(g, 895, 436, 4, '#fff');   // the crow
  shape(g, rect(1150, 260, 100, 440), { fill: '#6a6660', lw: 6 }); shape(g, [[1140, 260], [1260, 260], [1200, 190]], { fill: '#5a5650', lw: 6 });
  shape(g, ell(1200, 330, 40, 40, 24), { fill: '#e8e4d8', lw: 5 }); line(g, [[1200, 330], [1221, 316]], { lw: 5 }); line(g, [[1200, 330], [1210, 302]], { lw: 4 });   // 4:17
  for (let i = 0; i < 40; i++) dot(g, hash(i, 1) * 1920, hash(i, 2) * 700, 3, '#d8d4c8');      // ash, frozen in the air
  T.setCam(keep.x, keep.y, keep.z, keep.sx, keep.sy); g.restore();
  g.save(); g.lineWidth = 40; g.strokeStyle = '#111'; g.beginPath(); g.arc(960, 540, 450, 0, 7); g.stroke(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(960, 140); g.lineTo(960, 940); g.moveTo(560, 540); g.lineTo(1360, 540); g.stroke(); g.restore();
  if (o.label) text(g, o.label, 960, 1010, 54, '#fff6c8', { font: 'JBMono', weight: 800 });
}
let TRI = null;
export function triptych(g, t, draw, labels) {
  bg(g, '#14141a'); if (!TRI) { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; TRI = c.getContext('2d'); }
  const keep = { ...T.CAM }; T.setCam(); TRI.setTransform(1, 0, 0, 1, 0, 0); TRI.clearRect(0, 0, 1920, 1080); draw(TRI); T.setCam(keep.x, keep.y, keep.z, keep.sx, keep.sy);
  [330, 960, 1590].forEach((cx, i) => { g.drawImage(TRI.canvas, 360, 90, 1200, 900, cx - 300, 220, 600, 450); g.save(); g.strokeStyle = '#f4f1ea'; g.lineWidth = 8; g.strokeRect(cx - 300, 220, 600, 450); g.restore(); text(g, labels[i], cx, 740, 54, '#fff6c8', { font: 'JBMono', weight: 800 }); });
}
export function eyeClose(g, t, o = {}) {
  bg(g, '#0a0a10'); glowRings(g, 1500, 540, 600, '#fff6d0', .25 * (o.light ?? 1));
  shape(g, ell(1600, 540, 260, 300, 30), { fill: '#2a2a30', lw: 8 }); shape(g, ell(1600, 540, 170, 210, 30), { fill: o.light ? '#e8e4d0' : '#111', lw: 6 });
  shape(g, ell(820, 540, 420, 220, 40), { fill: CAST.you.skin, shade: CAST.you.skinS, shadeOff: [0, -30] }); shape(g, ell(840, 540, 300, 150, 40), { fill: '#fff', lw: 8 });
  shape(g, ell(900, 540, 110, 110, 30), { fill: '#6a4a2a', lw: 6 }); dot(g, 900, 540, 50); dot(g, 870, 510, 16, '#fff');
  line(g, [[520, 470], [700, 380], [980, 380], [1150, 480]], { lw: 10 });
}
export function plugClose(g, t, o = {}) {
  bg(g, C.wall); shape(g, rrect(1080, 300, 360, 360, 40), { fill: '#e8e4d8', shade: '#c8c4b8', shadeOff: [-20, -20] }); for (const s of [-1, 1]) shape(g, ell(1260 + s * 60, 480, 22, 22, 14), { fill: '#2a2a2a', lw: 5 });
  const k = o.out || 0, dx = -k * 420 + (o.shake ? Math.sin(t * 50) * 8 : 0);
  line(g, [[-200, 760], [400 + dx, 640], [780 + dx, 500]], { line: '#2a2a2a', lw: 26 }); shape(g, rrect(760 + dx, 400, 240, 160, 30), { fill: '#3a3a3a', shade: '#262626', shadeOff: [0, -16] });
  for (const s of [-1, 1]) shape(g, rect(1000 + dx, 474 + s * 60 - 8, k > .05 ? 70 : 20, 16), { fill: '#c8c8c0', lw: 4 });
  hand(g, 760 + dx, 600, 1.3, -.2, { grip: true });
  if (o.spark) text(g, 'ЩЁЛК', 1300, 220, 110, '#fff6c8', { rot: .1 });
}
export function wiresClose(g, t, hl = 0) {
  bg(g, '#3a3c38'); shape(g, rrect(640, 180, 640, 420, 40), { fill: '#6a4226', shade: '#4a2e1a', shadeOff: [-30, -20] }); for (let i = 0; i < 6; i++) line(g, [[700, 230 + i * 60], [1220, 230 + i * 60]], { line: '#4a2e1a', lw: 6, seed: i });
  const W = [[[860, 600], [700, 700], [380, 720]], [[1060, 600], [1300, 700], [1560, 690]], [[1060, 180], [1100, 60], [1300, -60]]], L = ['1 · РОЗЕТКА', '2 · СЧЁТЧИК', '3 · ПОТОЛОК'], P = [[380, 800], [1620, 800], [1480, 120]];
  shape(g, rrect(260, 650, 120, 140, 20), { fill: '#e8e4d8', lw: 6 }); shape(g, rrect(1560, 630, 180, 130, 20), { fill: C.yellow, lw: 6 });
  W.forEach((w, i) => { const on = hl === i + 1; if (on) line(g, w, { line: '#fff6a0', lw: 46 }); line(g, w, { line: ['#2a2a2a', C.red, '#3a6ac8'][i], lw: 22, seed: i }); if (hl >= i + 1) text(g, L[i], P[i][0], P[i][1], 54, on ? '#fff6a0' : '#ffffff', { font: 'JBMono', weight: 800 }); });
}
export function redDotClose(g, t, o = {}) {
  bg(g, C.ceil); line(g, [[-100, 200], [2100, 200]], { line: '#6a706a', lw: 50 }); shape(g, rect(-100, 640, 2200, 600), { fill: C.wall, line: false }); line(g, [[-100, 640], [2100, 640]], { lw: 8 });
  shape(g, ell(960, 560, 300, 160, 40, Math.PI, Math.PI * 2), { fill: '#e8e8e4', shade: '#c8c8c4', shadeOff: [-30, 0] }); for (let i = -3; i <= 3; i++) line(g, [[960 + i * 60, 430], [960 + i * 66, 555]], { line: '#b8b8b4', lw: 6, seed: i });
  const blink = Math.floor(t * (o.fast ? 6 : 1.5)) % 2 === 0; dot(g, 960, 470, 22, blink ? C.red : '#6a2020'); if (blink) glowRings(g, 960, 470, 90, C.red, .25);
  if (o.beam) { g.save(); g.globalAlpha = .35 * o.beam; g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(400, 1200); g.lineTo(760, 420); g.lineTo(1160, 420); g.lineTo(700, 1200); g.fill(); g.restore(); }
  if (o.lens) { shape(g, ell(1080, 510, 46 * o.lens, 46 * o.lens, 24), { fill: '#1a2a4a', lw: 6 }); shape(g, ell(1080, 510, 22 * o.lens, 22 * o.lens, 16), { fill: '#3a6ac8', line: false }); dot(g, 1068, 498, 8 * o.lens, '#fff'); }
  if (o.waves) for (let k = 0; k < 3; k++) { const ph = (t * 1.3 + k / 3) % 1; g.save(); g.globalAlpha = 1 - ph; line(g, ell(960, 520, 340 + ph * 500, 180 + ph * 300, 40, 0, Math.PI), { line: '#ffb0a0', lw: 10 }); g.restore(); }
  if (o.night) T.dark(g, o.night, [{ x: 960, y: 500, r: 600 }], '#0a0e20');
}
export function cameraPOV(g, t, draw, stamp) {
  draw(); T.setCam(); T.tint(g, '#2a4a2a', .45); g.save(); g.globalAlpha = .12; g.fillStyle = '#000'; for (let y = 0; y < 1080; y += 6) g.fillRect(0, y, 1920, 3); g.restore();
  const gr = g.createRadialGradient(960, 540, 300, 960, 540, 1100); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080);
  g.save(); g.font = '800 46px JBMono'; g.fillStyle = '#e8ffe8'; g.textBaseline = 'top'; g.fillText(stamp, 80, 980); if (Math.floor(t * 2) % 2) { g.fillStyle = C.red; g.beginPath(); g.arc(1700, 1000, 16, 0, 7); g.fill(); } g.fillStyle = '#e8ffe8'; g.fillText('REC', 1730, 980); g.restore();
}
export function waveTriptych(g, t, o = {}) {
  bg(g, '#14141a'); ['ДЕНЬ 18', 'ДЕНЬ 19', 'ДЕНЬ 20'].forEach((lab, i) => { const y = 470 + i * 165; text(g, lab, 200, y, 46, '#fff6c8', { font: 'JBMono', weight: 800, align: 'left' });
    line(g, Array.from({ length: 140 }, (_, k) => [420 + k * 10, y + Math.sin(k * .7) * Math.sin(k * .13) * 70 + (k === 92 ? -90 : k === 93 ? 90 : 0)]), { line: '#7affb0', lw: 6, seed: 3 });
    if (o.cough) line(g, ell(1345, y, 60, 100, 30, 0, Math.PI * 2.1), { line: C.red, lw: 8 }); });
  if (o.cough) text(g, '«КХМ»', 1345, 230, 80, '#ff8a7a', {});
}
export function tapeReel(g, t) {
  bg(g, '#2a2620'); shape(g, rrect(300, 200, 1320, 700, 50), { fill: '#5a5a62', shade: '#44444a', shadeOff: [-30, -20] });
  for (const cx of [660, 1260]) { shape(g, ell(cx, 480, 210, 210, 40), { fill: '#2a2a2e', lw: 8 }); for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.09; shape(g, ell(cx + Math.cos(a) * 110, 480 + Math.sin(a) * 110, 50, 50, 16), { fill: '#5a5a62', lw: 5 }); } dot(g, cx, 480, 26, '#8a8a90'); }
  line(g, [[660, 690], [960, 760], [1260, 690]], { line: '#5a3a2a', lw: 14 }); text(g, 'КОВЧЕГ · ПРОГНОЗ', 960, 830, 54, '#fff6c8', { font: 'JBMono', weight: 800 });
}
export function newsClose(g, t, o = {}) {
  bg(g, '#3a3430'); const k = o.unfold ?? 1, w = 1300 * (.3 + .7 * k);
  T.setRot(-.03, 960, 540); shape(g, rect(960 - w / 2, 60, w, 960), { fill: '#e8e4d8', shade: '#c8c4b8', shadeOff: [-20, -20] });
  if (k <= .9) for (let i = 0; i < 16; i++) line(g, [[960 - w / 2 + 40, 140 + i * 52], [960 + w / 2 - 40 - (i % 3) * 30, 140 + i * 52]], { lw: 5, seed: i });
  if (k > .9) { text(g, 'ГОРОДСКИЕ ВЕСТИ', 960, 140, 72, INK, { outline: false, font: 'JBMono', weight: 800 }); line(g, [[340, 200], [1580, 200]], { lw: 6 });
    shape(g, rect(380, 250, 560, 520), { fill: '#f4f1ea', lw: 7 }); text(g, 'ПРОПАЛ', 660, 310, 72, C.red, { outline: false }); text(g, 'ЧЕЛОВЕК', 660, 380, 56, C.red, { outline: false });
    if (o.photo) { g.save(); g.beginPath(); g.rect(450, 420, 420, 330); g.clip(); shape(g, rect(450, 420, 420, 330), { fill: '#c8d0d8', line: false }); face(g, 660, 610, 120, CAST.you, { eyes: 'open', smile: .5 }); shape(g, [[460, 760], [540, 690], [780, 690], [860, 760]], { fill: CAST.you.coat, lw: 6 }); g.restore(); line(g, [[450, 420], [870, 420], [870, 750], [450, 750], [450, 420]], { lw: 6 }); }
    for (let i = 0; i < 12; i++) line(g, [[1000, 270 + i * 44], [1560 - (i % 3) * 60, 270 + i * 44]], { lw: 5, seed: i }); for (let i = 0; i < 4; i++) line(g, [[380, 820 + i * 44], [1560 - (i % 2) * 120, 820 + i * 44]], { lw: 5, seed: i + 20 }); }
  T.setRot(0);
}
// ── outside: night wasteland, green flash / festival fireworks, bakery
export function wasteland(g, t, o = {}) {
  bg(g, C.night); T.bands(g, 1920, [0, 300, 520], ['#0e1430', '#18204a', '#232a5a']);
  for (let i = 0; i < 60; i++) dot(g, hash(i, 4) * 1920, hash(i, 5) * 480, hash(i, 6) < .2 ? 3 : 2, '#e8e0ff');
  if (o.flash) { glowRings(g, 1300, 420, 900 * o.flash, '#7aff9a', .35); glowRings(g, 1300, 420, 400 * o.flash, '#d8ffe0', .5); }
  if (o.fireworks) for (const [x, y, col, d] of [[1250, 260, '#7aff9a', 0], [700, 200, '#ff7ad0', .45], [1600, 170, '#ffd23f', .9], [420, 300, '#7ad0ff', 1.3], [960, 140, '#ff9a4a', 1.7]]) { const k = (((t - d) * .55) % 1.2 + 1.2) % 1.2; if (k > 1) continue; glowRings(g, x, y, 60 + k * 300, col, .12 * (1 - k)); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 50 + k * 300; g.save(); g.globalAlpha = 1 - k * k; line(g, [[x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55], [x + Math.cos(a) * r, y + Math.sin(a) * r]], { line: col, lw: 12, seed: i }); dot(g, x + Math.cos(a) * r, y + Math.sin(a) * r, 9, '#fff'); g.restore(); } }
  for (let i = 0; i < 18; i++) { const x = 600 + i * 90, h = 160 + (i * 37) % 120; shape(g, [[x - 60, 640], [x, 640 - h], [x + 60, 640]], { fill: '#0a1a14', line: false, seed: i }); }
  for (let i = 0; i < 10; i++) shape(g, rect(60 + i * 46, 560 - (i % 3) * 30, 36, 80 + (i % 3) * 30), { fill: '#1a1e30', line: false, seed: i });
  for (let i = 0; i < 14; i++) dot(g, 76 + i * 32, 580 + (i % 3) * 20, 5, '#ffd890');
  shape(g, [[-300, 640], [2300, 640], [2300, 1400], [-300, 1400]], { fill: '#2a2a3a', shade: '#1e1e2c', shadeOff: [0, -30] });
  if (o.square) { shape(g, rect(560, 480, 800, 110), { fill: C.red, lw: 7 }); text(g, 'С ДНЁМ ГОРОДА!', 960, 535, 80, '#fff', { outline: false }); for (let i = 0; i < 22; i++) { const x = 140 + i * 76; shape(g, ell(x, 700, 26, 30, 12), { fill: '#0a0e20', line: false }); shape(g, rect(x - 24, 720, 48, 90), { fill: '#0a0e20', line: false }); line(g, [[x + 20, 730], [x + 44, 670 - (i % 2) * 20]], { line: '#0a0e20', lw: 14 }); } }
  if (o.hero !== false) person(g, 'you', o.hx ?? 960, 900, 1.05, { walk: o.walk ? t * 5 : null, facing: 1, face: o.face || { eyes: 'open', brow: 'neutral', look: [1, 0] } });
  if (o.flash) T.tint(g, '#3aff6a', .15 * o.flash);
}
export function wristGrab(g, t, o = {}) {
  bg(g, '#0e1a14'); glowRings(g, 1400, 200, 800, '#7aff9a', .14);
  hand(g, 1100, 560, 1.6, Math.PI - .2, { who: 'you' });
  hand(g, 650, 620, 1.5, -.35, { who: 'gena', knit: true, grip: true });
  if (o.smell) for (let i = 0; i < 3; i++) { const ph = (t * .6 + i / 3) % 1; g.save(); g.globalAlpha = 1 - ph; line(g, Array.from({ length: 8 }, (_, k) => [700 + i * 90 + Math.sin(k + t * 3) * 20, 400 - ph * 200 - k * 28]), { line: i === 1 ? '#9affc0' : '#d8c890', lw: 9 }); g.restore(); }
  if (o.dark) T.dark(g, o.dark, [{ x: 900, y: 560, r: 600 * (1 - o.dark) + 1 }], '#000');
}
export function polaroid(g, t, kind) {
  bg(g, '#2a2620'); T.setRot(-.06, 960, 540); shape(g, rect(560, 120, 800, 860), { fill: '#f8f6f0', shade: '#d8d4cc', shadeOff: [-20, -20] });
  g.save(); g.beginPath(); g.rect(600, 160, 720, 640); g.clip(); const keep = { ...T.CAM };
  T.setCam(960, 600, 1); bg(g, '#f0c890'); shape(g, rect(-200, 640, 2400, 600), { fill: '#7ab04a', line: false }); shape(g, ell(1180, 280, 70, 70, 24), { fill: '#fff6c8', line: false });
  if (kind === 'mom') { person(g, 'mom', 820, 820, .9, { armF: -.9, face: { eyes: 'closed', smile: .8 } }); person(g, 'you', 1050, 820, .5, { armF: -1.2, face: { eyes: 'open', smile: .9, mouth: .4 } }); }
  else { person(g, 'gena', 820, 820, .85, { armF: -1.3, face: { eyes: 'half', smile: .7 } }); const r = T.CAST.gena; glasses(g, 820 + 8, 820 - 520 * .85 * .95 * .76 - 520 * .85 * .95 * .135 * .95, 520 * .85 * .95 * .135, .7); person(g, 'you', 1060, 820, .5, { armF: -1.3, facing: -1, face: { eyes: 'wide', smile: .9, mouth: .5 } }); shape(g, [[930, 560], [990, 560], [1010, 575], [990, 590], [930, 590], [910, 575]], { fill: '#3ac06a', lw: 5 }); }
  T.setCam(keep.x, keep.y, keep.z); g.restore(); T.tint(g, '#c89050', .18); T.setRot(0);
}
export function bakery(g, t) {
  bg(g, '#f0d8a8'); shape(g, rect(-200, 820, 2400, 400), { fill: '#9a9a9a', shade: '#7a7a7a', shadeOff: [0, -20] });
  shape(g, rect(300, 120, 1320, 700), { fill: '#c8643a', shade: '#a84a28', shadeOff: [-30, 0] }); shape(g, rect(420, 300, 700, 420), { fill: '#ffe8a8', lw: 8 }); glowRings(g, 770, 510, 400, '#fff0b0', .3);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) shape(g, rrect(460 + i * 160, 420 + r * 140, 130, 70, 32), { fill: '#d8a060', shade: '#b07838', shadeOff: [0, -10], seed: i + r * 4 });
  shape(g, rect(1220, 330, 260, 490), { fill: '#6a3a20', lw: 8 }); shape(g, rrect(600, 170, 560, 100, 20), { fill: '#f4f1ea', lw: 7 }); text(g, 'ХЛЕБ', 880, 222, 80, '#c8643a', { outline: false });
  person(g, 'gena', 1600, 1000, 1.05, { facing: -1, armF: .3, face: { eyes: 'half', brow: 'neutral', look: [-1, 0] } }); shape(g, rrect(1390, 690, 140, 90, 30), { fill: '#d8a060', lw: 6 });
}
// cross-section: the yard and the garage above, the soil, the bunker below (ground at y 400, bunker floor at y 900)
export function crossSection(g, t, o = {}) {
  const day = o.day, GY = 400; bg(g, day ? '#9ad0f0' : C.night); if (!day) for (let i = 0; i < 40; i++) dot(g, hash(i, 8) * 1920, hash(i, 9) * 260, 2, '#e8e0ff');
  const lit = o.lit || day; shape(g, rect(1080, 90, 820, GY - 90), { fill: lit ? '#e8c890' : '#2a2a3a', shade: lit ? '#c8a870' : '#1e1e2c', shadeOff: [-20, 0] }); shape(g, [[1040, 100], [1940, 100], [1860, 30], [1120, 30]], { fill: '#5a3a2a', lw: 7 });
  if (lit) glowRings(g, 1490, 220, 320, '#fff0b0', .25);
  const bx = 1420 + (o.drag || 0) * 240; shape(g, rect(bx, 300, 240, 26), { fill: C.wood, lw: 6 }); for (const x of [bx + 20, bx + 220]) line(g, [[x, 326], [x, GY]], { lw: 8, seed: x });
  shape(g, rect(1700, 250, 100, 70), { fill: '#3a3a3a', lw: 6 }); shape(g, rect(1712, 260, 76, 46), { fill: '#3a5a3a', line: false });
  for (let x = 20; x < 1060; x += 70) line(g, [[x, GY], [x, GY - 110]], { line: day ? '#8a6a4a' : '#4a4058', lw: 14, seed: x }); line(g, [[0, GY - 80], [1060, GY - 80]], { line: day ? '#8a6a4a' : '#4a4058', lw: 10 });
  shape(g, [[-200, GY], [2200, GY], [2200, 530], [-200, 530]], { fill: C.soil, shade: C.soilS, shadeOff: [0, -24] }); for (let i = 0; i < 26; i++) shape(g, ell(hash(i, 11) * 1920, GY + 30 + hash(i, 12) * 80, 14 + hash(i, 13) * 14, 9 + hash(i, 13) * 7, 10), { fill: '#7a6050', lw: 4, seed: i });
  shape(g, rect(380, GY - 100, 40, 240), { fill: '#7a817a', lw: 6 }); shape(g, [[350, GY - 100], [450, GY - 100], [400, GY - 140]], { fill: '#6a706a', lw: 6 });
  shape(g, rect(1480, GY - 6, 120, 12), { fill: '#6a7276', lw: 5 }); shape(g, rect(1500, GY + 6, 80, 124), { fill: '#3a3a3a', line: false }); for (let y = GY + 20; y < 530; y += 28) line(g, [[1500, y], [1580, y]], { line: '#8a8a8a', lw: 6 });
  shape(g, rect(160, 530, 1600, 560), { fill: day ? '#8d978b' : '#4a5248', line: false }); shape(g, rect(160, 900, 1600, 200), { fill: day ? '#5d625b' : '#3a3e38', line: false });
  line(g, [[160, 530], [1760, 530]], { lw: 8 }); line(g, [[160, 530], [160, 1100]], { lw: 8 }); line(g, [[1760, 530], [1760, 1100]], { lw: 8 });
  shape(g, rrect(260, 820, 380, 44, 14), { fill: '#6a7a8a', lw: 6 }); for (const x of [280, 620]) line(g, [[x, 864], [x, 900]], { lw: 10, seed: x });
  shape(g, rect(1100, 760, 300, 20), { fill: C.wood, lw: 5 }); for (const x of [1120, 1380]) line(g, [[x, 780], [x, 900]], { lw: 8, seed: x }); radioBox(g, 1130, 660, .7, {});
  shape(g, ell(1700, 700, 100, 100, 30), { fill: '#8f989d', lw: 7 }); wheel(g, 1700, 700, 55, 0);
  if (o.label) { text(g, 'ГАРАЖ', 1490, 65, 40, '#fff', { font: 'JBMono', weight: 800 }); text(g, '«КОВЧЕГ»', 900, 580, 50, '#fff6c8', { font: 'JBMono', weight: 800 }); }
  const P = o.people || {};
  if (P.hero) person(g, 'you', P.hero.x ?? 760, 900, .62, P.hero);
  if (P.mom) person(g, 'mom', P.mom.x ?? 470, GY, .6, P.mom);
  if (P.gena) { const r = person(g, 'gena', P.gena.x ?? 640, GY, .6, P.gena); glasses(g, r.head[0] + 3, r.head[1], r.R, (P.gena.facing || 1) * .7); }
  if (P.cops) for (const c of P.cops) { const r = person(g, 'cop', c.x, GY, .62, c); cap(g, r.head[0], r.head[1], r.R); }
  if (P.dog) dog(g, P.dog.x ?? 300, GY, .7, t, P.dog.bark);
  if (o.mouthWaves) for (let k = 0; k < 3; k++) { const ph = (t * 1.2 + k / 3) % 1; g.save(); g.globalAlpha = 1 - ph; line(g, ell(400, 545, 60 + ph * 260, 30 + ph * 130, 24, 0, Math.PI), { line: '#ffe7a0', lw: 8 }); g.restore(); }
  if (o.beam) { g.save(); g.globalAlpha = .25; g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(o.beam[0], o.beam[1] - 70); g.lineTo(o.beam[2] - 140, GY); g.lineTo(o.beam[2] + 140, GY); g.fill(); g.restore(); }
  if (!day) T.dark(g, .3, [{ x: 760, y: 760, r: 420 }, { x: 470, y: 260, r: 380 }, ...(lit ? [{ x: 1490, y: 250, r: 520 }] : [])], '#05081a');
}
export function cap(g, x, y, R) { shape(g, [[x - R * .95, y - R * .45], [x + R * .95, y - R * .45], [x + R * .8, y - R * 1.1], [x - R * .8, y - R * 1.1]], { fill: '#1d2d4c', lw: 5 }); shape(g, [[x - R * 1.0, y - R * .5], [x + R * 1.25, y - R * .5], [x + R * 1.1, y - R * .3], [x - R * .9, y - R * .35]], { fill: '#111', lw: 5 }); dot(g, x, y - R * .8, R * .14, '#ffd23f'); }
export function dog(g, x, fy, s, t, bark) {
  const S = v => v * s, by = fy - S(120);
  shape(g, rrect(x - S(130), by - S(50), S(260), S(110), S(50)), { fill: '#6a4a2a', shade: '#4a3220', shadeOff: [0, -14] });
  for (const dx of [-100, -60, 60, 100]) line(g, [[x + S(dx), by + S(50)], [x + S(dx), fy]], { line: '#4a3220', lw: S(26) });
  shape(g, ell(x + S(150), by - S(60), S(62), S(52), 20), { fill: '#6a4a2a', lw: 6 }); shape(g, [[x + S(130), by - S(110)], [x + S(160), by - S(170)], [x + S(175), by - S(100)]], { fill: '#4a3220', lw: 5 });
  shape(g, ell(x + S(205), by - S(48), S(34), S(24), 14), { fill: '#3a2a1a', lw: 5 }); dot(g, x + S(160), by - S(75), S(7)); line(g, [[x - S(130), by - S(20)], [x - S(190), by - S(80)]], { line: '#6a4a2a', lw: S(22) });
  if (bark && Math.floor(t * 4) % 2 === 0) text(g, 'ГАВ!', x + S(300), by - S(170), 70, '#fff6c8', { rot: -.1 });
}
export function garage(g, t, o = {}) {
  bg(g, '#e0c08a'); for (let x = -100; x < 2100; x += 160) line(g, [[x, 0], [x, 760]], { line: '#c8a870', lw: 6, seed: x }); glowRings(g, 960, 150, 900, '#fff0b0', .2);
  shape(g, rect(-200, 760, 2400, 500), { fill: '#8a8a82', shade: '#6a6a62', shadeOff: [0, -30] }); line(g, [[1000, 0], [1000, 120]], { lw: 6 }); shape(g, ell(1000, 140, 40, 30, 16), { fill: '#fff6c8', lw: 6 });
  for (let i = 0; i < 6; i++) { line(g, [[120 + i * 70, 200], [120 + i * 70, 320]], { line: '#5a5a5a', lw: 10, seed: i }); } shape(g, rect(80, 320, 460, 20), { fill: C.wood, lw: 6 });
  shape(g, [[700, 860], [1100, 860], [1060, 920], [740, 920]], { fill: '#3a3a3a', lw: 7 }); glowRings(g, 900, 880, 200, '#fff0b0', .2);                 // the open hatch
  shape(g, rect(1280, 520, 560, 26), { fill: C.wood, shade: C.woodS, shadeOff: [0, -8] }); for (const x of [1300, 1820]) line(g, [[x, 546], [x, 760]], { lw: 10, seed: x });
  shape(g, rrect(1300, 400, 220, 120, 14), { fill: '#5a5a62', lw: 6 }); for (const cx of [1355, 1465]) { shape(g, ell(cx, 450, 40, 40, 18), { fill: '#2a2a2e', lw: 5 }); const a = t * 3; line(g, [[cx, 450], [cx + Math.cos(a) * 30, 450 + Math.sin(a) * 30]], { line: '#8a8a90', lw: 6 }); }
  line(g, [[1580, 520], [1580, 420]], { lw: 8 }); shape(g, ell(1580, 400, 26, 36, 16), { fill: '#4a4a52', lw: 6 }); shape(g, rect(1650, 380, 170, 140), { fill: '#2a2a2a', lw: 6 }); shape(g, rect(1665, 395, 140, 100), { fill: '#3a5a3a', line: false }); text(g, 'REC', 1735, 445, 30, C.red, { outline: false, font: 'JBMono', weight: 800 });
  if (o.gena !== false) { const r = person(g, 'gena', o.gx ?? 1560, 760, .95, { sit: true, facing: -1, armF: -.4, face: o.gface || { eyes: 'half', brow: 'sad', look: [-1, .3] } }); glasses(g, r.head[0] - 3, r.head[1], r.R, -.7); }
  if (o.people) o.people();
}
export function periCutaway(g, t) {
  bg(g, '#9ad0f0'); shape(g, rect(-200, 700, 2400, 500), { fill: '#7ab04a', line: false }); shape(g, rect(820, 700, 120, 500), { fill: C.metal, shade: C.metalS, shadeOff: [-20, 0] });
  shape(g, rrect(640, 300, 480, 400, 30), { fill: C.metal, shade: C.metalS, shadeOff: [-30, -20] }); shape(g, rect(700, 360, 360, 280), { fill: '#2a2a30', lw: 6 });
  shape(g, rect(740, 390, 200, 220), { fill: '#9b9a94', lw: 6 }); for (let i = 0; i < 3; i++) line(g, [[770 + i * 60, 600], [770 + i * 60, 470]], { lw: 6, seed: i }); line(g, [[770, 480], [860, 470]], { lw: 5 }); shape(g, [[800, 468], [830, 456], [846, 466], [826, 476]], { fill: '#1a1a1e', lw: 3 });
  glowRings(g, 1000, 500, 120, '#fff6a0', .6); shape(g, ell(1000, 500, 34, 44, 16), { fill: '#fff6a0', lw: 6 });
  text(g, 'КАРТИНА НА СТЕКЛЕ', 1300, 200, 60, '#fff', {}); text(g, 'ЛАМПА', 1400, 560, 60, '#fff6a0', {}); line(g, [[1100, 230], [860, 400]], { lw: 7 }); line(g, [[1300, 540], [1050, 505]], { lw: 7 });
}
export function calendarClose(g, t, o = {}) {
  bg(g, C.wall); shape(g, rect(460, 80, 1000, 920), { fill: '#f4f1ea', shade: '#d8d4cc', shadeOff: [-20, -20] }); shape(g, rect(460, 80, 1000, 150), { fill: C.red, lw: 7 }); text(g, o.title || 'ДО ВЫХОДА', 960, 155, 72, '#fff', { outline: false });
  for (let i = 0; i < 30; i++) { const cx = 540 + (i % 6) * 145, cy = 300 + Math.floor(i / 6) * 140; shape(g, rect(cx, cy, 120, 110), { fill: '#fff', lw: 4, seed: i }); text(g, String(i + 1), cx + 60, cy + 55, 52, '#3a3a3a', { outline: false });
    const d = (o.cross || 0) - i; if (d > 0) { const k = clamp(d); line(g, [[cx + 10, cy + 10], [cx + 10 + 100 * k, cy + 10 + 90 * k]], { line: C.red, lw: 9, seed: i }); if (k > .5) line(g, [[cx + 110, cy + 10], [cx + 110 - 100 * (k - .5) * 2, cy + 10 + 90 * (k - .5) * 2]], { line: C.red, lw: 9, seed: i + 50 }); } }
  if (o.ring) line(g, ell(540 + ((o.ring - 1) % 6) * 145 + 60, 300 + Math.floor((o.ring - 1) / 6) * 140 + 55, 90, 80, 30, 0, Math.PI * 2.1), { line: '#1a8a3a', lw: 10 });
}
export function bigShadow(g, t) {
  bg(g, C.wall); for (let y = 120; y < 1080; y += 190) line(g, [[-100, y], [2100, y]], { line: C.seam, lw: 5, seed: y }); glowRings(g, 200, 1000, 520, C.lamp, .35);
  g.save(); g.globalAlpha = .75; const keep = { ...T.CAM }; T.setCam(960 - (1250 - 960) / 2.4 * 0, 540, 1); T.setCam(1250 - 960 / 2.5 + 200, 1060 - 540 / 2.5 - 120, 2.5); person(g, 'shadow', 1250, 1060, 1, { armF: .2, face: { eyes: 'closed' } }); T.setCam(keep.x, keep.y, keep.z); g.restore();
  shape(g, rect(-200, 960, 2400, 300), { fill: C.floor, line: false }); person(g, 'you', 420, 1000, .55, { armF: .2, face: { eyes: 'wide', brow: 'worried', look: [1, -.3] } });
}
