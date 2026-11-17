// world.js — «7 дней на необитаемом острове»: the island (one wide set), the sinking ferry, the diary, close-ups per action.
import * as T from './toon.js';
const { shape, line, ell, rect, rrect, dot, text, glowRings, INK, person, face, CAST } = T;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const C = { sea: '#2aa8c8', seaD: '#1a7a9a', sand: '#f2dca0', sandS: '#d8bc78', palm: '#2f9a4a', palmS: '#1f7a38', trunk: '#9a6a3a', trunkS: '#7a4e28', rock: '#8a8a8a', rockS: '#6a6a6a', paper: '#efe2b8', ink: '#3a2a1a', red: '#ff3a2a', fire: '#ff8a1a' };
CAST.you = { skin: '#f2b48a', skinS: '#d98a62', hair: '#4a2a18', hairS: '#341c10', coat: '#eeeae0', coatS: '#c8c2b2', pants: '#4a6a9a', pantsS: '#34507a', boots: '#c89060', h: 1 };
CAST.father = { skin: '#e8a878', skinS: '#c88a5a', hair: '#3a2418', hairS: '#2a180e', coat: '#2a4a7a', coatS: '#1e365a', pants: '#2a2a34', pantsS: '#1e1e26', boots: '#2a1a10', h: 1.05, beard: true };
CAST.captain = { skin: '#e8b08c', skinS: '#c98a66', hair: '#d8d8d0', hairS: '#b0b0a6', coat: '#1e2a48', coatS: '#141c34', pants: '#1e2a48', pantsS: '#141c34', boots: '#111', h: 1.02, beard: true };
CAST.kid = { skin: '#f6c39c', skinS: '#dd9670', hair: '#4a2a18', hairS: '#341c10', coat: '#ffc928', coatS: '#e09a12', pants: '#3a6ab8', pantsS: '#2a4e8a', boots: '#e8e4d8', h: .5 };
export const bg = (g, col) => shape(g, rect(-600, -600, 3200, 2400), { fill: col, line: false });
export function capsule(x0, y0, x1, y1, w) { const a = Math.atan2(y1 - y0, x1 - x0); return [...ell(x0, y0, w / 2, w / 2, 12, a + Math.PI / 2, a + Math.PI * 1.5), ...ell(x1, y1, w / 2, w / 2, 12, a - Math.PI / 2, a + Math.PI / 2)]; }
export function hand(g, x, y, s = 1, rot = 0, o = {}) {
  const c = CAST[o.who || 'you'], R = (dx, dy) => [x + (dx * Math.cos(rot) - dy * Math.sin(rot)) * s, y + (dx * Math.sin(rot) + dy * Math.cos(rot)) * s];
  if (o.sleeve !== false) { shape(g, [R(-260, -62), R(-40, -70), R(-40, 70), R(-260, 62)], { fill: o.sleeve || c.coat, shade: c.coatS, shadeOff: [0, 18 * s] }); }
  const curl = o.grip ? .55 : 0;
  for (let i = 0; i < 4; i++) { const fy = -42 + i * 28, L = (i === 0 || i === 3 ? 78 : 92) * (1 - curl * .45); shape(g, capsule(...R(40, fy), ...R(40 + L, fy + (o.grip ? 22 : 0)), 30 * s), { fill: c.skin, shade: c.skinS, shadeOff: [0, 6 * s], lw: 6 }); }
  shape(g, ell(...R(10, 0), 62 * s, 64 * s, 24), { fill: c.skin, shade: c.skinS, shadeOff: [0, 14 * s] });
  shape(g, capsule(...R(10, -50), ...R(58, -88), 32 * s), { fill: c.skin, shade: c.skinS, lw: 6 });
  if (o.scraped) for (let i = 0; i < 3; i++) line(g, [R(-10 + i * 18, -30), R(30 + i * 18, 30)], { line: '#d83a3a', lw: 4, seed: i });
}
export function steam(g, t, x, y, a = 1, col = '#ffffff', w = 80) { for (let i = 0; i < 3; i++) { const ph = (t * .7 + i / 3) % 1; g.save(); g.globalAlpha = a * (1 - ph) * .9; line(g, Array.from({ length: 8 }, (_, k) => [x - w + i * w + Math.sin(k * .9 + t * 3 + i) * 18, y - ph * 160 - k * 26]), { line: col, lw: 9 }); g.restore(); } }
export function flame(g, t, x, y, s = 1) { const f = Math.sin(t * 13) * .1 + 1; glowRings(g, x, y - 40 * s, 200 * s, '#ffb03a', .3); shape(g, [[x - 60 * s, y], [x - 40 * s, y - 90 * s * f], [x - 10 * s, y - 60 * s], [x, y - 150 * s * f], [x + 20 * s, y - 70 * s], [x + 45 * s, y - 110 * s * f], [x + 60 * s, y]], { fill: '#ff8a1a', lw: 5 }); shape(g, [[x - 30 * s, y], [x - 10 * s, y - 60 * s * f], [x + 10 * s, y - 40 * s], [x + 30 * s, y]], { fill: '#ffe07a', line: false }); for (let i = 0; i < 3; i++) line(g, [[x - 70 * s + i * 50 * s, y + 10 * s], [x - 20 * s + i * 50 * s, y - 10 * s]], { line: '#6a3a1a', lw: 14 * s, seed: i }); }
export function smokeColumn(g, t, x, y, s = 1, col = '#f4f4f4', h = 700) { for (let i = 0; i < 9; i++) { const ph = ((t * .25 + i / 9) % 1); shape(g, ell(x + Math.sin(ph * 6 + i) * 30 * s + ph * 80 * s, y - ph * h * s, (40 + ph * 120) * s, (30 + ph * 90) * s, 18), { fill: col, line: false, seed: i }); } }
// ── sky presets: day, dusk, night, storm, dawn
function sky(g, o) { const k = o.sky || 'day';
  const P = { day: ['#7ac8f0', '#a8dcf4', '#d8f0fa'], dusk: ['#4a3a7a', '#d8708a', '#f8b878'], night: ['#0e1430', '#1a2448', '#26305a'], storm: ['#2a2e3a', '#3a3e4a', '#4a4e58'], dawn: ['#7a8ac8', '#e8a0a0', '#f8d098'] }[k];
  T.bands(g, 1920, [0, 180, 330], P); if (k === 'day') { glowRings(g, 1500, 150, 160, '#fff6c8', .5); shape(g, ell(1500, 150, 70, 70, 24), { fill: '#fff6c8', line: false }); }
  if (k === 'night') for (let i = 0; i < 60; i++) dot(g, hash(i, 1) * 1920, hash(i, 2) * 380, 2, '#e8e0ff');
  if (k === 'storm') for (let i = 0; i < 6; i++) shape(g, ell(200 + i * 330, 120 + (i % 2) * 60, 260, 90, 20), { fill: '#24272f', line: false, seed: i }); }
export function sea(g, t, y0 = 420, o = {}) { const st = o.storm ? 3 : 1, col = o.sky === 'night' ? '#16305a' : o.sky === 'storm' ? '#2a4a5a' : C.sea;
  shape(g, [[-300, y0], [2300, y0], [2300, 1400], [-300, 1400]], { fill: col, line: false });
  for (let r = 0; r < 5; r++) { const y = y0 + 30 + r * 50; line(g, Array.from({ length: 26 }, (_, i) => [-300 + i * 100, y + Math.sin(i * 1.3 + t * 1.5 * st + r) * 6 * st]), { line: 'rgba(255,255,255,.35)', lw: 4, seed: r }); } }
export function palm(g, x, gy, s = 1, t = 0, bend = 0, o = {}) {
  const top = [x + (60 + bend * 160) * s, gy - 460 * s]; line(g, [[x, gy], [x + (20 + bend * 40) * s, gy - 230 * s], top], { line: C.trunk, lw: 34 * s });
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .55 + bend * .6 + Math.sin(t * (o.windy ? 6 : 1.2) + i) * (o.windy ? .15 : .03), L = 230 * s; shape(g, [top, [top[0] + Math.cos(a - .12) * L * .6, top[1] + Math.sin(a - .12) * L * .6 - 20 * s], [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L + 40 * s], [top[0] + Math.cos(a + .12) * L * .6, top[1] + Math.sin(a + .12) * L * .6 + 10 * s]], { fill: C.palm, shade: C.palmS, shadeOff: [0, -8], seed: i + Math.round(x) }); }
  if (o.nuts !== false) for (let i = 0; i < 3; i++) shape(g, ell(top[0] - 20 * s + i * 22 * s, top[1] + 24 * s, 18 * s, 18 * s, 12), { fill: '#6aa040', lw: 5 });
}
// the island: sky, sea, sand, palms, rocks + cave, optional hut / shelter / SOS / fires / ship / hero
export function island(g, t, o = {}) {
  bg(g, '#7ac8f0'); sky(g, o); sea(g, t, 420, o);
  if (o.ship != null) ship(g, t, o.ship, 400, o.shipS ?? .5, o);
  shape(g, [[-300, 660], [300, 620], [900, 640], [1500, 610], [2300, 640], [2300, 1400], [-300, 1400]], { fill: C.sand, shade: C.sandS, shadeOff: [0, -30] });
  shape(g, [[1460, 660], [1520, 360], [1640, 250], [1800, 300], [1920, 220], [2100, 300], [2100, 700]], { fill: C.rock, shade: C.rockS, shadeOff: [-40, 0] });
  shape(g, ell(1720, 560, 80, 70, 24, Math.PI, Math.PI * 2), { fill: '#2a2a2a', lw: 6 });
  palm(g, 300, 700, 1, t, o.windy ? .5 : 0, o); palm(g, 560, 680, .8, t, o.windy ? .5 : .1, o); palm(g, 1320, 690, .9, t, o.windy ? .5 : -.1, o);
  if (o.hut) { const x = 140; shape(g, [[x - 120, 780], [x - 120, 640], [x, 580], [x + 120, 640], [x + 120, 780]], { fill: '#c8b896', shade: '#a8987a', shadeOff: [-14, 0] }); shape(g, rect(x - 40, 690, 80, 90), { fill: '#3a2a1a', lw: 5 }); }
  if (o.shelter) { shape(g, [[1460, 780], [1600, 640], [1700, 780]], { fill: C.palm, shade: C.palmS, shadeOff: [-20, 0] }); }
  if (o.sos) { const k = o.sos; for (let i = 0; i < Math.floor(42 * k); i++) { const L = i % 14, x = 760 + Math.floor(i / 14) * 160 + (L % 4) * 26, y = 880 + Math.floor(L / 4) * 18; dot(g, x, y, 8, '#8a8a8a'); } }
  if (o.fires) for (const [fx, fy] of o.fires) { smokeColumn(g, t, fx, fy - 40, .8, o.smoke || '#f4f4f4', 600); flame(g, t, fx, fy, .7); }
  if (o.hero) { const h = o.hero; person(g, h.who || 'you', h.x, h.fy ?? 860, h.s ?? 1, h); }
  if (o.storm) { g.save(); g.globalAlpha = .6; for (let i = 0; i < 120; i++) { const x = ((hash(i, 1) * 2200 + t * 900) % 2200) - 140, y = ((hash(i, 2) * 1200 + t * 1400) % 1200) - 60; line(g, [[x, y], [x - 20, y + 60]], { line: '#cfe0f0', lw: 3, seed: i }); } g.restore(); if (Math.floor(t * 2.3) % 7 === 0) T.tint(g, '#ffffff', .25); }
  if (o.wave) { const k = o.wave; shape(g, [[-300, 1200], [-300, 640 - k * 260], ...Array.from({ length: 12 }, (_, i) => [-200 + i * 200, 620 - k * 300 + Math.sin(i + t * 3) * 30]), [2300, 600 - k * 260], [2300, 1200]], { fill: '#2a6a8a', shade: '#1a4a6a', shadeOff: [0, -40] }); }
  if (o.sky === 'night') T.dark(g, .35, [...(o.holes || [])], '#05081a');
}
export function ship(g, t, x, y, s = .5, o = {}) { const S = v => v * s; shape(g, [[x - S(260), y - S(10)], [x + S(260), y - S(10)], [x + S(200), y + S(60)], [x - S(220), y + S(60)]], { fill: '#2a2a34', lw: 4 }); shape(g, rect(x - S(60), y - S(110), S(160), S(100)), { fill: '#e8e4d8', lw: 4 }); shape(g, rect(x + S(40), y - S(190), S(40), S(80)), { fill: '#c83a2a', lw: 4 }); smokeColumn(g, t, x + S(60), y - S(200), s * .6, '#5a5a62', 300); }
// the sinking ferry at night
export function ferry(g, t, o = {}) {
  bg(g, '#0e1430'); sky(g, { sky: 'night' }); const tilt = (o.sink || 0) * .28, k = o.sink || 0;
  sea(g, t * 2, 600, { sky: 'night', storm: true });
  T.setRot(tilt, 960, 620); shape(g, [[300, 520], [1620, 520], [1500, 720], [420, 720]], { fill: '#e8e4d8', shade: '#c8c4b8', shadeOff: [0, -30] }); shape(g, rect(560, 360, 760, 160), { fill: '#f4f1ea', lw: 6 });
  for (let i = 0; i < 8; i++) shape(g, rect(600 + i * 88, 400, 56, 46), { fill: Math.floor(t * 6 + i) % 3 ? '#ffe7a0' : '#5a5a4a', lw: 4 }); shape(g, rect(1000, 240, 70, 120), { fill: '#c83a2a', lw: 6 });
  if (o.hero) person(g, 'you', 900, 520, .55, { armF: -2.4, armB: -2.2, face: { eyes: 'wide', brow: 'up', scream: .8 } });
  if (o.hero) shape(g, [[870, 380], [930, 380], [940, 440], [860, 440]], { fill: '#ff7a1a', lw: 4 });
  T.setRot(0); shape(g, [[-300, 1200], [-300, 760 - k * 120], ...Array.from({ length: 14 }, (_, i) => [-200 + i * 180, 740 - k * 140 + Math.sin(i * 1.4 + t * 4) * 26]), [2300, 760 - k * 120], [2300, 1200]], { fill: '#1a3a6a', shade: '#122a4e', shadeOff: [0, -30] });
  if (o.siren && Math.floor(t * 3) % 2) T.tint(g, '#ff2020', .12);
  for (let i = 0; i < 100; i++) { const x = ((hash(i, 1) * 2200 + t * 700) % 2200) - 140, y = ((hash(i, 2) * 1200 + t * 1300) % 1200) - 60; line(g, [[x, y], [x - 16, y + 50]], { line: 'rgba(200,220,240,.5)', lw: 3, seed: i }); }
}
export function bigWave(g, t, k) { bg(g, '#0e1430'); shape(g, [[-200, 1200], [-200, 900 - k * 1000], ...Array.from({ length: 12 }, (_, i) => [-100 + i * 200, 860 - k * 1100 + Math.sin(i * 1.7) * 60]), [2200, 900 - k * 1000], [2200, 1200]], { fill: '#1a3a6a', shade: '#122a4e', shadeOff: [0, -50] }); for (let i = 0; i < 30; i++) dot(g, hash(i, 3) * 1920, 860 - k * 1100 + hash(i, 4) * 200, 10, '#e8f4ff'); }
export function underwater(g, t) { bg(g, '#061428'); for (let i = 0; i < 26; i++) { const ph = (t * .5 + hash(i, 1)) % 1; shape(g, ell(hash(i, 2) * 1920, 1100 - ph * 1200, 10 + hash(i, 3) * 20, 10 + hash(i, 3) * 20, 14), { fill: null, line: '#4a8ac8', lw: 4, seed: i }); } }
export function faceClose(g, t, f = {}, o = {}) {
  if (!o.noBg) bg(g, o.bg || '#7ac8f0'); if (o.glow) glowRings(g, o.glow[0], o.glow[1], 700, o.glow[2], .25);
  const c = CAST[o.who || 'you'], x = o.x ?? 960, y = o.y ?? 470, R = o.R ?? 290;
  shape(g, [[x - 560, 1200], [x - 440, y + R * 1.05], [x + 440, y + R * 1.05], [x + 560, 1200]], { fill: c.coat, shade: c.coatS, shadeOff: [-60, 0] });
  if ((o.who || 'you') === 'you') { shape(g, [[x - 120, y + R * 1.05], [x, y + R * 1.5], [x + 120, y + R * 1.05]], { fill: c.skin, lw: 6 }); line(g, [[x + 200, y + R * 1.3], [x + 260, y + R * 1.7], [x + 180, y + R * 1.9]], { line: c.coatS, lw: 6 }); }
  face(g, x, y, R, c, f);
  if (o.sunburn) for (const s of [-1, 1]) shape(g, ell(x + s * R * .5, y + R * .35, R * .22, R * .13, 16), { fill: 'rgba(255,90,70,.45)', line: false });
  if (o.salt) for (let i = 0; i < 14; i++) dot(g, x - R * .6 + hash(i, 1) * R * 1.2, y - R * .4 + hash(i, 2) * R, 4, '#ffffff');
  if (o.lips) for (let i = 0; i < 3; i++) line(g, [[x - 40 + i * 30, y + R * .58], [x - 34 + i * 30, y + R * .7]], { line: '#a83a3a', lw: 4, seed: i });
  if (o.coconut) { shape(g, ell(x + R * .2, y + R * .7, R * .55, R * .5, 24), { fill: '#6aa040', shade: '#4a8030', shadeOff: [-20, -10] }); hand(g, x - R * .3, y + R * 1.2, 1, -1.1, { grip: true }); hand(g, x + R * .8, y + R * 1.25, 1, -2.1, { grip: true }); }
  if (o.diary) { shape(g, rrect(x - R * .9, y + R * .9, R * 1.8, R * .8, 20), { fill: '#6a4a2a', lw: 7 }); hand(g, x - R * .9, y + R * 1.6, 1, -.6, { grip: true }); hand(g, x + R * .9, y + R * 1.6, 1, -2.5, { grip: true }); }
  if (o.night) T.dark(g, o.night, [{ x: o.lx ?? x, y: o.ly ?? y, r: 600 }], '#070b1a');
  if (o.tint) T.tint(g, o.tint[0], o.tint[1]);
}
export function sandPockets(g, t, o = {}) {
  bg(g, C.sand); for (let i = 0; i < 40; i++) dot(g, hash(i, 1) * 1920, hash(i, 2) * 1080, 3, C.sandS);
  const it = o.items || 0;
  if (it >= 1) { shape(g, rrect(420, 420, 300, 70, 30), { fill: '#c83a2a', lw: 6 }); shape(g, [[700, 440], [900, 410], [900, 450], [700, 470]], { fill: '#c8ccd4', lw: 5 }); text(g, 'НОЖ', 600, 560, 54, INK, { outline: false }); }
  if (it >= 2) { shape(g, rrect(920, 380, 120, 200, 20), { fill: '#3a8aff', lw: 6 }); shape(g, rect(940, 350, 80, 40), { fill: '#c8ccd4', lw: 5 }); if (o.spark && Math.floor(t * 4) % 2) for (let i = 0; i < 6; i++) dot(g, 980 + Math.cos(i) * 40, 330 + Math.sin(i) * 30, 5, '#ffd23f'); text(g, 'ЩЁЛК', 980, 620, 54, INK, { outline: false }); }
  if (it >= 3) { shape(g, [[1240, 700], [1560, 700], [1600, 640], [1600, 560], [1560, 500], [1240, 500], [1200, 560], [1200, 640]], { fill: 'rgba(200,230,255,.7)', lw: 7 }); shape(g, rect(1600, 570, 50, 60), { fill: '#3a7ab8', lw: 5 }); text(g, 'БУТЫЛКА', 1400, 780, 54, INK, { outline: false }); }
}
export function sosTop(g, t, k = 1) {
  bg(g, C.sand); for (let i = 0; i < 60; i++) dot(g, hash(i, 1) * 1920, hash(i, 2) * 1080, 3, C.sandS);
  const S = ox => { const p = []; for (let i = 0; i <= 6; i++) { const a = -Math.PI * .15 + i / 6 * Math.PI * 1.3; p.push([ox + 130 * Math.cos(a + Math.PI), 330 - 110 * Math.sin(a + Math.PI) * -1]); } for (let i = 0; i <= 6; i++) { const a = Math.PI * .5 - i / 6 * Math.PI * 1.3; p.push([ox + 130 * Math.cos(a), 560 + 110 * Math.sin(-a) * -1]); } return p; };
  const O = ox => Array.from({ length: 14 }, (_, i) => [ox + Math.cos(i / 14 * Math.PI * 2) * 140, 445 + Math.sin(i / 14 * Math.PI * 2) * 230]);
  const pts = [...S(500), ...O(960), ...S(1420)], show = Math.floor(k * pts.length);
  pts.slice(0, show).forEach(([x, y], i) => shape(g, ell(x, y, 40, 32, 14), { fill: '#9a9a9a', shade: '#7a7a7a', shadeOff: [-8, -6], seed: i }));
}
export function handsWater(g, t, pour = 0) {
  bg(g, C.sea); for (let r = 0; r < 8; r++) line(g, Array.from({ length: 22 }, (_, i) => [-100 + i * 100, 140 + r * 120 + Math.sin(i + t * 2 + r) * 10]), { line: 'rgba(255,255,255,.35)', lw: 5, seed: r });
  const lift = 1 - pour; hand(g, 760, 620 - lift * 120, 1.4, -1.2, { grip: true }); hand(g, 1160, 620 - lift * 120, 1.4, -1.94, { grip: true });
  shape(g, ell(960, 560 - lift * 120, 160, 60, 20), { fill: lift > .3 ? '#7ad8f0' : 'rgba(0,0,0,0)', line: false });
  if (pour > 0) for (let i = 0; i < 8; i++) line(g, [[900 + i * 16, 600], [900 + i * 16, 600 + pour * 300]], { line: '#9fe0f8', lw: 6, seed: i });
  if (o_salt(pour)) text(g, 'СОЛЬ', 960, 200, 120, C.red, { rot: -.08 });
}
const o_salt = p => p > .3;
export function dewBag(g, t, k = 1) {
  bg(g, '#5aa040'); for (let i = 0; i < 60; i++) line(g, [[hash(i, 1) * 1920, 1080], [hash(i, 1) * 1920 + 20, 1080 - 100 - hash(i, 2) * 200]], { line: '#3a8a30', lw: 6, seed: i });
  shape(g, [[360, 380], [1560, 340], [1600, 760], [320, 800]], { fill: 'rgba(240,248,255,.75)', lw: 7 });
  for (let i = 0; i < 40; i++) { const x = 400 + hash(i, 3) * 1120, y = 400 + hash(i, 4) * 360; if (hash(i, 5) < k) shape(g, ell(x, y, 10, 13, 10), { fill: '#bfe8ff', lw: 3, seed: i }); }
}
export function palmClimb(g, t, slip = 0, o = {}) {
  bg(g, '#7ac8f0'); shape(g, rect(-100, 900, 2200, 300), { fill: C.sand, line: false });
  shape(g, [[860, 1100], [940, 1100], [1000, -100], [920, -100]], { fill: C.trunk, shade: C.trunkS, shadeOff: [-20, 0] }); for (let i = 0; i < 14; i++) line(g, [[860 + i * 4, 1060 - i * 80], [940 + i * 4, 1040 - i * 80]], { line: C.trunkS, lw: 6, seed: i });
  if (o.stick) { person(g, 'you', 640, 1040, 1.2, { armF: -2.9, face: { eyes: 'open', brow: 'angry', look: [1, -1] } }); line(g, [[700, 420], [1000, -40]], { line: '#8a5a2a', lw: 14 }); shape(g, ell(1010, 60 + (o.drop || 0) * 800, 46, 46, 16), { fill: '#6aa040', lw: 6 }); return; }
  const y = 400 + slip * 300; hand(g, 760, y, 1.2, .2, { grip: true, scraped: slip > .3 }); hand(g, 1160, y + 60, 1.2, Math.PI - .2, { grip: true, scraped: slip > .3 });
  if (slip > .2) for (let i = 0; i < 6; i++) dot(g, 900 + hash(i, 1) * 80, y + 100 + hash(i, 2) * 200, 6, C.trunkS);
}
export function knifeCoconut(g, t, k = 0) { bg(g, '#f2dca0'); shape(g, ell(960, 560, 300, 280, 30), { fill: '#6aa040', shade: '#4a8030', shadeOff: [-40, -20] }); if (k > .5) shape(g, ell(1040, 400, 40, 30, 14), { fill: '#f4f4e8', lw: 5 }); shape(g, [[1060 - k * 40, 380], [1300, 160], [1320, 190], [1080 - k * 40, 410]], { fill: '#c8ccd4', lw: 5 }); hand(g, 1360, 200, 1.1, -2.4, { grip: true }); hand(g, 600, 760, 1.2, -.4, { grip: true }); }
export function hutClose(g, t, o = {}) {
  bg(g, '#f2dca0'); shape(g, [[260, 1000], [260, 380], [960, 140], [1660, 380], [1660, 1000]], { fill: '#c8b896', shade: '#a8987a', shadeOff: [-40, 0] }); for (let i = 0; i < 12; i++) line(g, [[300 + i * 116, 400], [300 + i * 116, 1000]], { line: '#a8987a', lw: 6, seed: i });
  shape(g, rect(760, 520, 400, 480), { fill: '#2a1e14', lw: 8 });
  shape(g, rect(1260, 300, 70, 700), { fill: '#9a8a6a', lw: 6 }); for (let i = 0; i < 6; i++) { if (o.tally == null || i < o.tally) line(g, [[1270, 400 + i * 50], [1320, 414 + i * 50]], { lw: 6, seed: i }); }
  if (o.inside) { shape(g, rect(820, 860, 90, 100), { fill: '#8a5a3a', lw: 5 }); line(g, ell(990, 900, 60, 30, 16), { line: '#a8783a', lw: 8 }); shape(g, rrect(1020, 880, 120, 80, 14), { fill: '#6a5a3a', lw: 5 }); glowRings(g, 1080, 920, 90, '#fff6c8', .2); }
}
// the diary: an open notebook; left page entries in handwriting, right page / blank / photo
export function diary(g, t, o = {}) {
  bg(g, o.bg || '#3a2a1a'); if (o.glow) glowRings(g, 960, 540, 700, '#ffe8b0', .14);
  shape(g, rrect(220, 120, 1480, 860, 30), { fill: '#6a4a2a', shade: '#4a3220', shadeOff: [0, -14] });
  for (const x0 of [250, 970]) { shape(g, [[x0, 150], [x0 + 700, 150], [x0 + 700, 950], [x0, 950]], { fill: C.paper, shade: '#d8c898', shadeOff: [x0 < 900 ? -18 : 18, 0] }); for (let i = 0; i < 14; i++) line(g, [[x0 + 30, 240 + i * 50 + Math.sin(i) * 3], [x0 + 670, 238 + i * 50 + Math.sin(i + 1) * 3]], { line: '#c8b888', lw: 2, seed: i + x0 }); }
  line(g, [[960, 150], [960, 950]], { lw: 8, line: '#3a2a1a' });
  const write = (lines, x0, k) => { let n = Math.floor((k ?? 1) * lines.join('').length); lines.forEach((s, i) => { const m = Math.max(0, Math.min(s.length, n)); n -= s.length; if (m) text(g, s.slice(0, m), x0 + 40, 230 + i * 50, 40, C.ink, { outline: false, align: 'left', font: 'Caveat', weight: 700 }); }); };
  if (o.left) write(o.left, 250, o.kl); if (o.right) write(o.right, 970, o.kr);
  if (o.sign) text(g, 'Н.', 860, 880, 60, C.ink, { outline: false, font: 'Caveat', weight: 700 });
  if (o.blank) text(g, '…', 1320, 560, 80, '#c8b888', { outline: false });
}
export function photo(g, t, k = 1) {
  bg(g, '#2a2620'); T.setRot(-.08 + (1 - k) * .5, 960, 540); const dy = (1 - k) * -600;
  shape(g, rect(600, 160 + dy, 720, 780), { fill: '#f8f6f0', shade: '#d8d4cc', shadeOff: [-16, -16] });
  g.save(); const a = T.P([640, 200 + dy]), b = T.P([1280, 760 + dy]); g.beginPath(); g.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); g.clip();
  bg(g, '#f0c890'); shape(g, rect(-200, 560 + dy, 2400, 400), { fill: '#f2dca0', line: false }); shape(g, rect(-200, 470 + dy, 2400, 90), { fill: '#5ab0d0', line: false });
  const r = person(g, 'father', 920, 760 + dy, .95, { armF: -1.3, armB: -1.2, face: { eyes: 'closed', smile: .8 } }); person(g, 'kid', 990, 640 + dy, 1, { armF: -2.6, face: { eyes: 'closed', smile: 1, mouth: .5 } });
  g.restore(); T.tint(g, '#c89050', .15); T.setRot(0);
}
export function stream(g, t, o = {}) {
  bg(g, '#7ac8f0'); shape(g, [[-100, 1100], [-100, 300], [500, 200], [900, 260], [1400, 160], [2100, 240], [2100, 1100]], { fill: C.rock, shade: C.rockS, shadeOff: [-40, 0] });
  for (let i = 0; i < 6; i++) { const ph = (t * .8 + i / 6) % 1; line(g, [[940 + Math.sin(i) * 10, 360 + ph * 600], [950 + Math.sin(i + 1) * 10, 400 + ph * 600]], { line: '#bfe8ff', lw: 10, seed: i }); }
  shape(g, [[860, 360], [1040, 360], [1080, 1100], [820, 1100]], { fill: 'rgba(120,200,240,.6)', line: false });
  for (let i = 0; i < 4; i++) { const x = 400 + i * 360, y = 140 + Math.sin(t * 3 + i) * 20; line(g, [[x - 40, y], [x, y + 16], [x + 40, y]], { lw: 7, seed: i }); }
  if (o.drink) { hand(g, 820, 860, 1.2, -1.0, { grip: true }); hand(g, 1100, 860, 1.2, -2.1, { grip: true }); }
}
export function lensFire(g, t, k = 0) {
  bg(g, '#f2dca0'); glowRings(g, 1600, 120, 260, '#fff6c8', .4);
  shape(g, ell(960, 860, 300, 70, 30), { fill: '#a8783a', shade: '#8a5a2a', shadeOff: [0, -14] }); for (let i = 0; i < 30; i++) line(g, [[700 + hash(i, 1) * 520, 820 + hash(i, 2) * 70], [720 + hash(i, 1) * 520, 800 + hash(i, 3) * 70]], { line: '#6a4a2a', lw: 4, seed: i });
  shape(g, [[760, 520], [1160, 520], [1220, 470], [1220, 400], [1160, 350], [760, 350], [700, 400], [700, 470]], { fill: 'rgba(170,220,250,.6)', lw: 7 }); hand(g, 620, 480, 1.1, 0, { grip: true });
  g.save(); g.globalAlpha = .35; g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(760, 520); g.lineTo(1160, 520); g.lineTo(965, 840); g.fill(); g.restore();
  dot(g, 965, 845, 14, '#ffffff'); glowRings(g, 965, 845, 40, '#ffffff', .6);
  if (k > .3) steam(g, t, 965, 820, Math.min(1, (k - .3) * 2), '#d8d8d8', 40);
  if (k > .9) flame(g, t, 965, 860, .8);
}
export function berries(g, t, open = 0) {
  bg(g, C.rock); for (let i = 0; i < 10; i++) shape(g, ell(200 + i * 170, 600 + (i % 3) * 100, 140, 110, 20), { fill: '#2f8a3a', shade: '#1f6a2a', shadeOff: [-20, 0], seed: i });
  for (let i = 0; i < 30; i++) shape(g, ell(240 + hash(i, 1) * 1440, 520 + hash(i, 2) * 260, 14, 14, 10), { fill: '#e8202a', lw: 3, seed: i });
  hand(g, 1100, 360 + open * 120, 1.3, -1.6, { grip: open < .5 }); if (open > .4) for (let i = 0; i < 5; i++) shape(g, ell(1160 + i * 20, 520 + open * 300 + i * 10, 14, 14, 10), { fill: '#e8202a', lw: 3, seed: i });
  if (open < .5) text(g, 'НЕ ЕШЬ', 600, 180, 110, C.red, { rot: -.06 });
}
export function spearFish(g, t, o = {}) {
  bg(g, '#7ac8f0'); sky(g, { sky: 'day' }); sea(g, t, 420, {}); person(g, 'you', 960, 1180, 1.3, { armF: -2.2, armB: -2.0, face: { eyes: 'half', brow: 'angry', look: [0, 1] } });
  shape(g, [[-300, 900], [2300, 900], [2300, 1400], [-300, 1400]], { fill: 'rgba(42,168,200,.75)', line: false });
  const st = o.strike ? Math.abs(Math.sin(t * 4)) : 0; line(g, [[1100, 260 + st * 200], [1200, 1000 + st * 200]], { line: '#8a5a2a', lw: 14 });
  if (o.fish) { shape(g, [[1160, 860], [1260, 820], [1320, 860], [1260, 900]], { fill: '#d8e4f0', lw: 5 }); shape(g, [[1320, 860], [1370, 830], [1370, 890]], { fill: '#d8e4f0', lw: 5 }); }
}
export function stormSky(g, t) { island(g, t, { sky: 'storm', windy: true, storm: true, shelter: true }); }
export function cave(g, t, o = {}) { bg(g, '#1a1a20'); shape(g, ell(960, 1200, 900, 800, 40, Math.PI, Math.PI * 2), { fill: '#3a4a5a', line: false }); for (let i = 0; i < 80; i++) { const x = ((hash(i, 1) * 2200 + t * 800) % 2200) - 140, y = ((hash(i, 2) * 1200 + t * 1200) % 1200) - 60; line(g, [[x, y], [x - 16, y + 50]], { line: 'rgba(200,220,240,.5)', lw: 3, seed: i }); }
  shape(g, [[-200, 1200], [-200, 860], ...Array.from({ length: 10 }, (_, i) => [i * 220, 840 + Math.sin(i + t * 3) * 40 - (o.wave || 0) * 100]), [2200, 860], [2200, 1200]], { fill: '#2a6a8a', line: false }); shape(g, [[-200, -200], [2200, -200], [2200, 1300], [1860, 1300], [1700, 500], [960, 300], [220, 500], [60, 1300], [-200, 1300]], { fill: '#2a2a30', shade: '#1e1e24', shadeOff: [0, -20] });
  if (o.hero) person(g, 'you', 760, 1060, 1, { sit: true, facing: 1, armF: -.9, armB: -.8, face: o.face || { eyes: 'open', brow: 'worried', look: [1, 0] } });
  if (o.hero) shape(g, rrect(820, 760, 110, 80, 12), { fill: '#6a4a2a', lw: 5 }); }
export function watch(g, t) { bg(g, C.rock); shape(g, ell(960, 540, 300, 300, 40), { fill: '#a87848', shade: '#8a5a30', shadeOff: [-30, -20] }); shape(g, ell(960, 540, 240, 240, 36), { fill: '#d8ccb0', lw: 6 }); for (let i = 0; i < 6; i++) dot(g, 900 + hash(i, 1) * 140, 460 + hash(i, 2) * 160, 12, '#a85a2a');
  text(g, 'НИКОЛАЮ.', 960, 460, 56, C.ink, { outline: false, font: 'Caveat', weight: 700 }); text(g, 'ВОЗВРАЩАЙСЯ.', 960, 540, 56, C.ink, { outline: false, font: 'Caveat', weight: 700 }); text(g, 'ЖЕНА И СЫН', 960, 620, 56, C.ink, { outline: false, font: 'Caveat', weight: 700 });
  shape(g, rect(900, 180, 120, 60), { fill: '#a87848', lw: 5 }); shape(g, rect(900, 840, 120, 60), { fill: '#a87848', lw: 5 }); }
export function woodpile(g, t, o = {}) { bg(g, C.sand); for (let i = 0; i < (o.n || 6); i++) line(g, [[760 + i * 30, 700 - i * 20], [1160 - i * 20, 640 - i * 26]], { line: '#8a5a2a', lw: 22, seed: i }); if (o.label !== false) text(g, 'ДРОВ МАЛО', 960, 300, 110, C.red, {}); }
export function deck(g, t, o = {}) { bg(g, '#9ad0f0'); sky(g, { sky: o.sky || 'day' }); sea(g, t, 540, {}); shape(g, [[-200, 800], [2200, 800], [2200, 1200], [-200, 1200]], { fill: '#8a6a4a', line: false }); line(g, [[-200, 700], [2200, 700]], { lw: 10, line: '#e8e4d8' });
  if (o.island) { shape(g, ell(o.islandX ?? 1500, 540, 260, 50, 24, Math.PI, Math.PI * 2), { fill: '#3a8a4a', line: false }); }
  if (o.people) { const r = person(g, 'captain', 1300, 1000, 1.05, { facing: -1, armF: -1.4, face: o.cface || { eyes: 'wide', brow: 'up', mouth: .3, look: [-1, .3] } }); capCap(g, r.head[0], r.head[1], r.R); shape(g, rrect(r.hand[0] - 50, r.hand[1] - 40, 100, 70, 10), { fill: '#6a4a2a', lw: 5 });
    person(g, 'you', 760, 1000, 1, { facing: 1, armF: .2, face: o.yface || { eyes: 'half', brow: 'sad', look: [1, 0] } }); shape(g, [[620, 520], [900, 520], [940, 900], [580, 900]], { fill: '#9a5a4a', shade: '#7a4a3a', shadeOff: [-20, 0] }); } }
export function capCap(g, x, y, R) { shape(g, [[x - R * .95, y - R * .45], [x + R * .95, y - R * .45], [x + R * .8, y - R * 1.1], [x - R * .8, y - R * 1.1]], { fill: '#f4f1ea', lw: 5 }); shape(g, [[x - R * 1.0, y - R * .5], [x + R * 1.25, y - R * .5], [x + R * 1.1, y - R * .3], [x - R * .9, y - R * .35]], { fill: '#111', lw: 5 }); dot(g, x, y - R * .8, R * .14, '#ffd23f'); }
export function threeFires(g, t, n = 3) { bg(g, C.sand); for (let i = 0; i < 60; i++) dot(g, hash(i, 1) * 1920, hash(i, 2) * 1080, 3, C.sandS); const P = [[960, 260], [620, 800], [1300, 800]]; for (let i = 0; i < n; i++) { glowRings(g, P[i][0], P[i][1], 200, '#ffb03a', .3); flame(g, t, P[i][0], P[i][1] + 50, 1); } if (n === 3) { g.save(); g.setLineDash([20, 20]); g.strokeStyle = '#ff3a2a'; g.lineWidth = 6; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(...T.P([x, y])) : g.moveTo(...T.P([x, y]))); g.closePath(); g.stroke(); g.restore(); } }
