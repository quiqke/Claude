// world.js — the sets of «11 правил маяка» as a bright cartoon. World units ≈ screen px at zoom 1 (1920×1080).
import * as T from './toon.js';
const { shape, line, ell, rect, rrect, person, face, dot, text, glowRings, dark, tint, bands, setRot, INK } = T;
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
T.CAST.thing = { skin: '#e9e6f3', skinS: '#c7c2dc', hair: '#e9e6f3', hairS: '#c7c2dc', coat: '#e9e6f3', coatS: '#c7c2dc', pants: '#9a95b8', pantsS: '#7a7598', boots: '#5a5578', h: 1 };

// ═════ sky / sea / fog ═════
const SKY = {
  night: { sky: ['#12102e', '#1a1844', '#25225c', '#332c72'], sea: ['#1a3160', '#13264c', '#0d1b38'], cliff: ['#25344a', '#1a2536'], cliff2: ['#2e4058', '#223046'], fog: '#8f8abd', stripeR: ['#b8363d', '#8a262c'], stripeW: ['#d6d0e6', '#aca5c4'] },
  dusk: { sky: ['#3b2a6e', '#6b3a8c', '#b4507e', '#ec7a5c', '#ffb25e'], sea: ['#2c6f8a', '#1f5670', '#173f57'], cliff: ['#3f5d3a', '#2c4429'], cliff2: ['#5b7a43', '#46622f'], fog: '#d9c8ef', stripeR: ['#e8423a', '#b52c2a'], stripeW: ['#fbf4e8', '#d8cfc4'] },
  dawn: { sky: ['#3d4f8c', '#6f7fb8', '#c98fb6', '#f4a6a0', '#ffd0a6'], sea: ['#4b6f9a', '#3c5d86', '#2f4b70'], cliff: ['#3d5a52', '#2c4540'], cliff2: ['#55765f', '#41604b'], fog: '#efe4f4', stripeR: ['#e8423a', '#b52c2a'], stripeW: ['#fbf4e8', '#d8cfc4'] },
  day: { sky: ['#6fb8e6', '#8ccaf0', '#acdaf5', '#d0ebfa'], sea: ['#2c8fb3', '#227a9c', '#196682'], cliff: ['#4f8a45', '#3b6c33'], cliff2: ['#6ea653', '#57893f'], fog: '#f2f6fb', stripeR: ['#ee4a3e', '#c0332c'], stripeW: ['#ffffff', '#dde3ea'] },
};
export const HZ = 560;
export function skySea(g, t, mode, o = {}) {
  const P = SKY[mode]; bands(g, 1920, [0, 150, 280, 390, 480].slice(0, P.sky.length), P.sky);
  if (mode === 'night') { for (let i = 0; i < 60; i++) { const x = hash(i, 1) * 1920 * 1.4 - 200, y = hash(i, 2) * 480; dot(g, x, y, hash(i, 3) < .2 ? 3.5 : 2, Math.floor(t * 2 + i) % 9 === 0 ? '#fff' : '#cfd3ff'); }
    if (o.moon !== false) { shape(g, ell(420, 170, 54, 54, 28), { fill: '#fff5d6', shade: '#e8d8a8', shadeOff: [-14, -10] }); } }
  if (mode === 'dusk') shape(g, ell(560, 500, 70, 70, 28), { fill: '#fff3c4', line: false });
  if (mode === 'dawn') shape(g, ell(300, 520, 60, 60, 28), { fill: '#ffe9c4', line: false });
  if (mode === 'day') { for (const [x, y, s] of [[300, 160, 1], [900, 110, .7], [1650, 200, .9]]) shape(g, [...ell(x, y, 120 * s, 40 * s, 20, Math.PI, Math.PI * 2), [x + 120 * s, y + 10], [x - 120 * s, y + 10]], { fill: '#ffffff', lw: 5 }); }
  bands(g, 1920, [HZ, 620, 700], P.sea);
  for (let i = 0; i < 16; i++) { const x = (i * 157 + t * 30) % 2300 - 200, y = HZ + 20 + (i % 5) * 34; line(g, [[x, y], [x + 34, y - 7], [x + 68, y]], { line: mode === 'night' ? '#3a5a92' : '#9fd6e0', lw: 5, seed: i }); }
}
export function fogBands(g, t, top, mode = 'night', dens = 1, o = {}) {
  const col = o.col || SKY[mode].fog;
  for (let k = 0; k < 4; k++) {
    const y = top + k * 55, sh = Math.sin(t * .35 + k * 1.7) * 90 + k * 40, a = Math.min(1, (.45 + k * .18) * dens);
    g.save(); g.globalAlpha = a;
    shape(g, [[-400 + sh, y], [200 + sh, y - 28], [800 + sh, y + 8], [1400 + sh, y - 26], [2000 + sh, y + 6], [2600 + sh, y - 18], [2600, 3000], [-400, 3000]], { fill: col, line: false, seed: k + 3 });
    g.restore();
  }
}

// ═════ EXT — the lighthouse on Cape Chorny ═════
export const TW = { x: 1440, base: 780, top: 250 };
export function ext(g, t, s = {}) {
  const mode = s.mode || 'night', P = SKY[mode];
  skySea(g, t, mode, s);
  if (s.seaLights) for (let k = 0; k < 3; k++) if (s.seaLights(k) > 0) { const x = 380 + k * 90, y = HZ + 14; glowRings(g, x, y, 46, '#ffe27a', .35); shape(g, ell(x, y, 13, 13, 12), { fill: '#ffe14a', lw: 5 }); }
  shape(g, [[820, 1300], [900, 720], [1080, 640], [1500, 600], [2100, 640], [2100, 1300]], { fill: P.cliff[0], shade: P.cliff[1], shadeOff: [-40, -30] });
  shape(g, [[1060, 1300], [1120, 820], [1260, 760], [1500, 740], [2100, 780], [2100, 1300]], { fill: P.cliff2[0], shade: P.cliff2[1], shadeOff: [-30, -20] });
  tower(g, t, s, P);
  if (s.hero) person(g, 'hero', s.hero.x, s.hero.y, s.hero.s || .55, s.hero);
  if (s.creatures) creatures(g, t, s.creatures, s.fall || 0);
  if (s.salt) for (let i = 0; i < 220 * s.salt; i++) { const lvl = [600, 470, 340][i % 3], side = i % 2 ? 1 : -1, ph = (t * 1.3 + hash(i, 1)) % 1;
    dot(g, TW.x + side * (70 + ph * 380 * (.5 + hash(i, 2))), lvl + ph * ph * 260 - 60 * ph + hash(i, 3) * 30, 4 + hash(i, 4) * 4, hash(i, 5) < .5 ? '#ffffff' : '#dfe8ff'); }
  if (s.beam) beam(g, s.beam);
  if (s.face) { face(g, 1180, s.face.y, 90, T.CAST.thing, { eyes: 'wide', mouth: .7, brow: 'up', look: [.6, -1] }); }
  if (s.fogTop != null) fogBands(g, t, s.fogTop, mode, s.fogDens ?? 1);
  if (mode === 'night' && !s.lamp) tint(g, '#0a0a30', .18);
}
function tower(g, t, s, P) {
  const { x: lx, base, top } = TW, tw = y => 70 - (base - y) / (base - top) * 26;
  for (let k = 0; k < 5; k++) { const y0 = top + (base - top) * k / 5, y1 = top + (base - top) * (k + 1) / 5, c = k % 2 ? P.stripeR : P.stripeW;
    shape(g, [[lx - tw(y0), y0], [lx + tw(y0), y0], [lx + tw(y1), y1], [lx - tw(y1), y1]], { fill: c[0], shade: c[1], shadeOff: [-30, 0], seed: k }); }
  shape(g, rrect(lx - 30, base - 110, 60, 110, 24), { fill: '#7a4a2e', shade: '#5a321e', shadeOff: [-14, 0] });
  const win = s.windows || [0, 0, 0]; [[640, 0], [500, 1], [370, 2]].forEach(([y, k]) => { if (win[k]) glowRings(g, lx, y + 22, 50, '#ffd84a', .35); shape(g, rrect(lx - 15, y, 30, 42, 13), { fill: win[k] ? '#ffd84a' : '#2b2f55' }); });
  shape(g, rect(lx - 80, top - 14, 160, 22), { fill: '#3a3a52' });
  for (let x = lx - 76; x <= lx + 76; x += 19) line(g, [[x, top - 14], [x, top - 50]], { lw: 5, seed: x }); line(g, [[lx - 80, top - 50], [lx + 80, top - 50]], { lw: 6 });
  const lamp = s.lamp || 0;
  if (lamp) glowRings(g, lx, top - 70, 220, '#fff1a8', .3 * lamp);
  shape(g, rect(lx - 50, top - 120, 100, 106), { fill: lamp ? '#fff6c8' : '#53608c', shade: lamp ? '#ffe17a' : '#3d4870', shadeOff: [-20, 0] });
  for (const x of [-25, 0, 25]) line(g, [[lx + x, top - 118], [lx + x, top - 16]], { lw: 5 });
  shape(g, [[lx - 64, top - 118], [lx + 64, top - 118], [lx, top - 200]], { fill: '#e8423a', shade: '#b52c2a', shadeOff: [-20, 0] });
}
function beam(g, k) {
  const lx = TW.x, ly = TW.top - 70; g.save(); g.globalAlpha = .45 * k; g.fillStyle = '#fff6c0'; g.beginPath();
  const a = T.P([lx, ly - 30]), b = T.P([-300, ly - 260]), c = T.P([-300, ly + 300]), d = T.P([lx, ly + 30]); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.fill();
  g.globalAlpha = .35 * k; g.beginPath(); const e = T.P([-300, ly - 120]), f = T.P([-300, ly + 160]); g.moveTo(...a); g.lineTo(...e); g.lineTo(...f); g.lineTo(...d); g.fill(); g.restore();
}
function creatures(g, t, n, fall) {
  for (let k = 0; k < n; k++) {
    const side = k % 2 ? 1 : -1, sp = 30 + hash(k, 3) * 40;
    let y = 900 - ((t * sp + hash(k, 2) * 700) % 760), x = TW.x + side * (62 - (780 - y) / 530 * 22 + 18);
    if (fall && hash(k, 7) < fall) { const ft = (t * 260 + k * 90) % 1100; y = 300 + ft; x += side * ft * .35; }
    const fr = Math.floor(t * 12 + k) % 2;
    shape(g, ell(x, y, 22, 30, 16), { fill: '#2a1840', shade: '#1a0e2a', seed: k });
    for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) line(g, [[x + a * 12, y + b * 14], [x + a * 34, y + b * (24 + (fr ? 6 : -6) * a)], [x + a * 30, y + b * 40]], { lw: 7, seed: k * 4 + a + b });
    shape(g, ell(x - 7, y - 10, 7, 9, 10), { fill: '#fffbe6', lw: 4 }); shape(g, ell(x + 8, y - 10, 7, 9, 10), { fill: '#fffbe6', lw: 4 }); dot(g, x - 6, y - 8, 2.5); dot(g, x + 9, y - 8, 2.5);
  }
}

// ═════ ROOM — the keeper's room (world 0…2700, floor 800) ═════
export const ROOM = { bunk: 260, stove: 700, clock: 1060, window: 1440, table: 1880, sacks: 2240, door: 2520, floor: 800 };
export function room(g, t, s = {}) {
  const F = ROOM.floor, light = s.light || 'warm';
  shape(g, rect(-400, -400, 3600, F + 400), { fill: light === 'day' ? '#f2c27e' : '#e7a45a', line: false });
  for (let y = -240; y < F; y += 70) for (let x = -400 + ((y + 240) / 70 % 2) * 60; x < 3100; x += 120) shape(g, rrect(x + 6, y + 6, 108, 58, 10), { fill: light === 'day' ? '#f6cd91' : '#ecb06a', line: light === 'day' ? '#dba765' : '#d08a46', lw: 4, seed: x * 3 + y });
  shape(g, rect(-400, F, 3600, 700), { fill: '#8a4f2c', shade: '#6d3c20', shadeOff: [0, -30] });
  for (let x = -400; x < 3200; x += 170) line(g, [[x, F], [x - 80, F + 400]], { line: '#6d3c20', lw: 5, seed: x });
  // window
  const wx = ROOM.window; shape(g, rrect(wx - 165, 200, 330, 360, 30), { fill: '#6b4426' });
  const out = s.outside || 'night';
  shape(g, rrect(wx - 140, 225, 280, 310, 20), { fill: out === 'day' ? '#9fd4f2' : '#28305e', shade: out === 'day' ? '#c2e6f8' : '#3a4a86', shadeOff: [0, 60] });
  if (out === 'day') { shape(g, [[wx - 140, 470], [wx + 140, 450], [wx + 140, 535], [wx - 140, 535]], { fill: '#6ea653', line: false });
    if (s.wellView) { shape(g, rect(wx + 30, 440, 60, 40), { fill: '#9aa3b5', lw: 5 }); shape(g, [[wx + 20, 444], [wx + 60, 410], [wx + 100, 444]], { fill: '#e8423a', lw: 5 }); } }
  else { g.save(); g.globalAlpha = .6; shape(g, [[wx - 135, 450], [wx - 40, 410], [wx + 40, 440], [wx + 135, 400], [wx + 135, 530], [wx - 135, 530]], { fill: '#b9b3dd', line: false, seed: Math.floor(t) }); g.restore(); }
  if (out === 'rain') for (let i = 0; i < 18; i++) { const x = wx - 130 + hash(i, 1) * 260, y = 240 + ((hash(i, 2) * 300 + t * 500) % 290); line(g, [[x, y], [x - 6, y + 22]], { line: '#bfe0ff', lw: 4, seed: i }); }
  if (s.shadow) shape(g, [...ell(wx + 40, 330, 50, 58, 20), [wx + 110, 535], [wx - 30, 535]], { fill: '#0e1030', line: false });
  line(g, [[wx, 225], [wx, 535]], { line: '#6b4426', lw: 14 }); line(g, [[wx - 140, 380], [wx + 140, 380]], { line: '#6b4426', lw: 14 });
  shape(g, rect(wx - 180, 560, 360, 26), { fill: '#a56a3a', shade: '#86522a', shadeOff: [0, -8] });
  if (s.glassText) text(g, s.glassText, wx, 330, 64, '#e8423a', { reveal: s.glassReveal ?? 1, font: 'Caveat', weight: 700, rot: -.05 });
  // bunk
  const bx = ROOM.bunk; shape(g, rect(bx - 210, F - 120, 420, 40), { fill: '#7a4a2e', shade: '#5a321e', shadeOff: [0, -10] });
  shape(g, rrect(bx - 205, F - 175, 410, 60, 18), { fill: '#d8433b', shade: '#a82f2a', shadeOff: [0, -14] });
  for (let x = bx - 180; x < bx + 200; x += 60) line(g, [[x, F - 170], [x, F - 120]], { line: '#a82f2a', lw: 5, seed: x });
  shape(g, rrect(bx - 200, F - 205, 110, 40, 16), { fill: '#fff4e0', shade: '#e6d6b8', shadeOff: [0, -8] });
  shape(g, rect(bx - 220, F - 260, 24, 260), { fill: '#5a321e' }); shape(g, rect(bx + 196, F - 160, 24, 160), { fill: '#5a321e' });
  // stove
  const sx = ROOM.stove, fire = s.fire ?? 1;
  shape(g, rect(sx - 30, -300, 60, F - 230 + 300), { fill: '#3a3550', shade: '#2a2640', shadeOff: [-14, 0] });
  shape(g, rrect(sx - 130, F - 330, 260, 330, 26), { fill: '#3a3550', shade: '#2a2640', shadeOff: [-30, 0] });
  shape(g, rrect(sx - 75, F - 240, 150, 110, 18), { fill: fire ? '#ffb238' : '#1a1830' });
  if (fire) { glowRings(g, sx, F - 185, 300, '#ffbe5c', .16 * fire); for (let i = 0; i < 4; i++) { const f = Math.sin(t * 9 + i * 2) * 10; shape(g, [[sx - 60 + i * 35, F - 135], [sx - 42 + i * 35 + f * .3, F - 210 - f], [sx - 24 + i * 35, F - 135]], { fill: i % 2 ? '#ff6b2c' : '#ffe14a', lw: 4, seed: i }); } }
  // clock
  clock(g, ROOM.clock, 300, s.clockTime ?? 18.07, t, s.clockStop, 1);
  // table, notebook, oil lamp
  const tx = ROOM.table; shape(g, rect(tx - 190, F - 160, 380, 30), { fill: '#a56a3a', shade: '#86522a', shadeOff: [0, -10] });
  shape(g, rect(tx - 160, F - 130, 26, 130), { fill: '#86522a' }); shape(g, rect(tx + 134, F - 130, 26, 130), { fill: '#86522a' });
  shape(g, [[tx - 140, F - 160], [tx + 20, F - 160], [tx + 30, F - 182], [tx - 130, F - 182]], { fill: '#3d7fd0', lw: 5 });
  const lamp = s.lamp ?? 1; shape(g, rrect(tx + 90, F - 240, 46, 80, 16), { fill: lamp ? '#ffcf4a' : '#8a7a50', shade: lamp ? '#e4a51e' : '#6a5a38', shadeOff: [-10, 0] }); if (lamp) glowRings(g, tx + 113, F - 220, 130, '#fff0a0', .2);
  // crate + salt sacks
  const kx = ROOM.sacks; shape(g, rect(kx - 230, F - 90, 140, 90), { fill: '#a0663a', shade: '#7a4a2a', shadeOff: [-14, 0] }); for (let i = 0; i < 3; i++) shape(g, rrect(kx - 220 + i * 44, F - 130, 36, 44, 6), { fill: '#c9d1dc', shade: '#9aa3b5', shadeOff: [-6, 0], seed: i });
  for (let i = 0; i < (s.sacks ?? 4); i++) { const x0 = kx - 60 + i * 80; shape(g, [[x0, F], [x0 + 10, F - 110], [x0 + 70, F - 120], [x0 + 80, F]], { fill: '#f4ecda', shade: '#d9ccb0', shadeOff: [-12, 0], seed: i }); text(g, 'СОЛЬ', x0 + 40, F - 55, 22, '#3b6fb0', { outline: false }); }
  // door: planks, bolt, peep slot; knock shake
  const kn = s.knock != null ? Math.max(0, 1 - (t - s.knock) * 4) : 0, dx = ROOM.door + Math.sin(t * 90) * 8 * kn;
  shape(g, rrect(dx - 150, F - 520, 300, 520, 20), { fill: '#7a4a2e', shade: '#5a321e', shadeOff: [-40, 0] });
  for (let x = -100; x < 150; x += 60) line(g, [[dx + x, F - 505], [dx + x, F - 10]], { line: '#5a321e', lw: 7, seed: x });
  const bolt = s.bolt ?? 1; shape(g, rrect(dx - 170 - (1 - bolt) * 90, F - 280, 200, 32, 12), { fill: '#b9c2d6', shade: '#8d97ad', shadeOff: [0, -8] });
  shape(g, rrect(dx - 60, F - 420, 120, 46, 10), { fill: s.slot ? (s.slotLight ? '#ffd27a' : '#141432') : '#5a321e' });
  if (s.underDoor) { g.save(); g.globalAlpha = .7 * s.underDoor; shape(g, rect(dx - 140, F - 8, 280, 10), { fill: '#ffe08a', line: false }); g.restore(); glowRings(g, dx, F + 10, 160, '#ffd27a', .18 * s.underDoor); }
  if (kn > 0) { text(g, 'ТУК!', dx + 40 + (s.knockN || 0) % 3 * 50, F - 600 - (s.knockN || 0) % 2 * 50, 110, '#ffe14a', { rot: -.12 }); }
  // characters
  for (const c of s.chars || []) {
    if (c.lying) { setRot(-Math.PI / 2, c.x, c.y); person(g, c.who, c.x, c.y, c.s || 1, c); setRot(0); continue; }
    person(g, c.who, c.x, c.y ?? F + 210, c.s || 1, c);
  }
  if (s.fogFloor) fogBands(g, t, F + 40, 'night', s.fogFloor, { col: '#e9ecff' });
  // lighting
  if (light === 'cold') { tint(g, '#151a60', .35); dark(g, .55, s.holes || []); }
  else if (light === 'dim') { dark(g, .45, s.holes || [{ x: ROOM.stove, y: F - 185, r: 420 }, { x: tx + 113, y: F - 220, r: 320 }]); }
}
export function clock(g, cx, cy, hours, t, stopped, sc = 1) {
  const R = 80 * sc; shape(g, ell(cx, cy, R + 10 * sc, R + 10 * sc, 36), { fill: '#7a4a2e' }); shape(g, ell(cx, cy, R, R, 36), { fill: '#fff6e4', shade: '#e6d6b8', shadeOff: [-12 * sc, -10 * sc] });
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; dot(g, cx + Math.sin(a) * R * .82, cy - Math.cos(a) * R * .82, (k % 3 ? 4 : 7) * sc); }
  const hA = (hours % 12) / 12 * Math.PI * 2, mA = (hours % 1) * Math.PI * 2;
  line(g, [[cx, cy], [cx + Math.sin(hA) * R * .5, cy - Math.cos(hA) * R * .5]], { lw: 10 * Math.min(1.6, sc) }); line(g, [[cx, cy], [cx + Math.sin(mA) * R * .75, cy - Math.cos(mA) * R * .75]], { lw: 7 * Math.min(1.6, sc) });
  dot(g, cx, cy, 8 * sc, '#e8423a');
  const sw = stopped ? 0 : Math.sin(t * Math.PI) * .3, py = cy + R + 8 * sc, L = 110 * sc;
  line(g, [[cx, py], [cx + Math.sin(sw) * L, py + Math.cos(sw) * L]], { lw: 6 }); shape(g, ell(cx + Math.sin(sw) * (L + 18 * sc), py + Math.cos(sw) * (L + 18 * sc), 20 * sc, 20 * sc, 16), { fill: '#f2b33a' });
}

// ═════ LAMP — the lantern room (world 0…2600, floor 860) ═════
export const LAMP = { radio: 320, lens: 1000, lever: 1290, crank: 1760, floor: 860 };
export function lamp(g, t, s = {}) {
  const F = LAMP.floor, mode = s.mode || 'night', on = s.lampOn || 0;
  skySea(g, t, mode, { moon: true });
  if (s.seaLights) for (let k = 0; k < 3; k++) if (s.seaLights(k) > 0) { const x = 700 + k * 260, y = HZ + 16; glowRings(g, x, y, 60, '#ffe27a', .4); shape(g, ell(x, y, 15, 15, 12), { fill: '#ffe14a', lw: 5 }); }
  if (s.fogTop != null) fogBands(g, t, s.fogTop, mode, s.fogDens ?? 1);
  if (s.face) face(g, s.face.x, s.face.y, 110, T.CAST.thing, { eyes: 'wide', mouth: .6, brow: 'up', look: [.3, -1] });
  // railing of the gallery outside
  line(g, [[-400, F - 230], [3000, F - 230]], { lw: 10 }); for (let x = -400; x < 3000; x += 80) line(g, [[x, F - 230], [x, F - 160]], { lw: 7, seed: x });
  // glazing bars
  for (let x = -400; x < 3000; x += 420) shape(g, rect(x, -400, 34, F - 160 + 400), { fill: '#2b2b44', shade: '#1d1d30', shadeOff: [-10, 0], seed: x });
  shape(g, rect(-400, -400, 3600, 420), { fill: '#2b2b44', line: false }); line(g, [[-400, 20], [3000, 20]], { lw: 8 });
  // inner wall + floor
  shape(g, rect(-400, F - 160, 3600, 160), { fill: '#6f7aa8', shade: '#58628e', shadeOff: [0, -20] });
  for (let x = -400; x < 3000; x += 140) line(g, [[x, F - 160], [x, F]], { line: '#58628e', lw: 5, seed: x });
  shape(g, rect(-400, F, 3600, 600), { fill: '#3e4466', shade: '#30354f', shadeOff: [0, -30] });
  // the great lens
  const lx = LAMP.lens; shape(g, rect(lx - 80, F - 200, 160, 200), { fill: '#4a5078', shade: '#3a3f60', shadeOff: [-20, 0] });
  if (on) glowRings(g, lx, F - 400, 420, '#fff6b0', .35 * on);
  for (let r = 190; r > 20; r -= 34) shape(g, ell(lx, F - 400, r, r * 1.05, 40), { fill: on ? (r % 68 < 34 ? '#fff6c8' : '#ffe27a') : (r % 68 < 34 ? '#9aa8d6' : '#7d8bbd'), lw: 5, seed: r });
  shape(g, ell(lx, F - 400, 28, 28, 18), { fill: on ? '#ffffff' : '#2b2f55' });
  // lever (rule 1)
  const vx = LAMP.lever, la = s.lever ?? 0; shape(g, rrect(vx - 36, F - 330, 72, 110, 12), { fill: '#3a3f60', shade: '#2b2f4a', shadeOff: [-10, 0] });
  const hx = vx - 50 + 100 * la, hy = F - 410; line(g, [[vx, F - 280], [hx, hy]], { lw: 12 }); shape(g, ell(hx, hy, 20, 20, 14), { fill: '#e8423a' });
  // the brass crank box with the flask
  const cx = LAMP.crank, lvl = clamp(s.salt ?? 1);
  shape(g, rrect(cx - 130, F - 260, 260, 260, 20), { fill: '#f2b33a', shade: '#c9851a', shadeOff: [-30, 0] });
  shape(g, rrect(cx - 50, F - 470, 100, 200, 24), { fill: '#cfe6f2' }); if (lvl > 0) shape(g, rrect(cx - 42, F - 278 - 180 * lvl, 84, 180 * lvl, 18), { fill: '#b8bccb', shade: '#9599ab', shadeOff: [-10, 0], seed: 9 });
  for (let i = 0; i < 16 * lvl; i++) dot(g, cx - 34 + hash(i, 1) * 68, F - 282 - hash(i, 2) * 170 * lvl, 4, '#ffffff');
  shape(g, rrect(cx - 60, F - 488, 120, 24, 8), { fill: '#f2b33a' });
  const ca = (s.crank || 0) * Math.PI * 2, kx = cx + 175 + Math.cos(ca) * 55, ky = F - 130 + Math.sin(ca) * 55;
  shape(g, ell(cx + 175, F - 130, 26, 26, 16), { fill: '#f2b33a' }); line(g, [[cx + 175, F - 130], [kx, ky]], { lw: 14 }); shape(g, rrect(kx - 14, ky - 34, 28, 68, 12), { fill: '#7a4a2e' });
  for (const d of [-1, 1]) line(g, [[cx + d * 130, F - 40], [cx + d * 330, F - 40], [cx + d * 330, F + 300]], { line: '#d9792a', lw: 16 });
  if (s.hiss) for (let i = 0; i < 26; i++) { const ph = (t * 2 + hash(i, 1)) % 1, d = i % 2 ? 1 : -1; g.save(); g.globalAlpha = 1 - ph; shape(g, ell(cx + d * (330 + hash(i, 3) * 60), F - 40 - ph * 160, 18 + ph * 30, 14 + ph * 22, 14), { fill: '#ffffff', lw: 4, seed: i }); g.restore(); }
  text(g, 'НЕ ВРАЩАТЬ', cx, F - 610, 50, '#e8423a', { font: 'Caveat', weight: 700, lw: 9 }); text(g, 'ДО ПОСЛЕДНЕГО', cx, F - 550, 50, '#e8423a', { font: 'Caveat', weight: 700, lw: 9 });
  // radio on a table
  const rx = LAMP.radio; shape(g, rect(rx - 170, F - 230, 340, 26), { fill: '#a56a3a', shade: '#86522a', shadeOff: [0, -8] }); shape(g, rect(rx - 150, F - 204, 22, 204), { fill: '#86522a' }); shape(g, rect(rx + 128, F - 204, 22, 204), { fill: '#86522a' });
  const ron = s.radio || 0; shape(g, rrect(rx - 120, F - 400, 240, 170, 20), { fill: '#9a5a32', shade: '#7a4222', shadeOff: [-16, 0] });
  for (let y = F - 380; y < F - 250; y += 18) line(g, [[rx - 100, y], [rx - 10, y]], { line: '#6a3a1a', lw: 6, seed: y });
  shape(g, rrect(rx + 10, F - 380, 90, 60, 10), { fill: ron ? '#7ee06a' : '#244028' }); if (ron) glowRings(g, rx + 55, F - 350, 110, '#9cff8a', .2 * ron);
  if (s.mic) { line(g, [[rx + 120, F - 300], [s.mic[0], s.mic[1]]], { lw: 6 }); }
  else shape(g, rrect(rx + 30, F - 300, 40, 56, 14), { fill: '#3a3a52' });
  if (s.cord !== false) line(g, [[rx + 120, F - 260], [rx + 200, F - 120], [rx + 260, F]], { lw: 6 });
  shape(g, [[rx - 110, F - 230], [rx + 10, F - 230], [rx + 18, F - 248], [rx - 102, F - 248]], { fill: '#3d7fd0', lw: 5 });
  // people
  for (const c of s.chars || []) person(g, c.who, c.x, c.y ?? F + 130, c.s || 1, c);
  if (s.fogIn) fogBands(g, t, F - 40, 'night', s.fogIn, { col: '#e9ecff' });
  if (s.beam) { const a = T.P([lx, F - 450]), b = T.P([lx, F - 350]); g.save(); g.globalAlpha = .5 * s.beam; g.fillStyle = '#fffbe0'; g.beginPath(); g.moveTo(...a); g.lineTo(...T.P([-500, F - 900])); g.lineTo(...T.P([-500, F + 100])); g.lineTo(...b); g.fill(); g.restore(); }
  if (mode === 'night' && !on) dark(g, s.dark ?? .35, s.holes || [{ x: lx, y: F - 300, r: 600 }]);
}

// ═════ STAIRS — the spiral stair (the hero stays near centre; steps scroll) ═════
export function stairs(g, t, s = {}) {
  const cur = s.step ?? 0, sx = 120, sy = 70, hx = 900, hf = 640;
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#4b4672', line: false });
  const oy = (cur * sy) % 80, ox = (cur * sx) % 150;
  for (let y = -160; y < 1200; y += 80) for (let x = -300 + ((Math.floor((y + cur * sy) / 80) % 2 + 2) % 2) * 75; x < 2200; x += 150) shape(g, rrect(x - ox + 6, y - oy + 6, 138, 68, 12), { fill: '#565180', line: '#3c3860', lw: 4, seed: Math.floor(x / 150) * 7 + Math.floor((y + cur * sy) / 80) * 13 });
  for (let k = -9; k <= 9; k++) {
    const n = Math.floor(cur) + k, x0 = hx + (n - cur) * sx - 80, y0 = hf + (n - cur) * sy;
    const warm = s.warm && n === 118;
    shape(g, [[x0, y0], [x0 + 200, y0], [x0 + 200, y0 + 36], [x0, y0 + 36]], { fill: warm ? (Math.floor(t * 3) % 2 ? '#ff7a3c' : '#ffb03c') : '#8d88b8', shade: warm ? '#e0502a' : '#6f6a9a', shadeOff: [0, -14], seed: n });
    shape(g, rect(x0, y0 + 36, 200, sy - 36), { fill: '#37335a', line: false });
    if (warm) glowRings(g, x0 + 100, y0, 160, '#ff9a5a', .3);
    if (n > 0 && n <= 120 && n % 10 === 0) text(g, String(n), x0 + 100, y0 + 54, 26, '#b9b5dc', { outline: false });
  }
  shape(g, rect(1700, -400, 120, 2000), { fill: '#2e2a4a', shade: '#221f38', shadeOff: [-20, 0] });
  if (s.keeper) { const kx = hx + (118 - cur) * sx + 20, ky = hf + (118 - cur) * sy; lyingKeeper(g, kx, ky, t); }
  if (s.hero !== false) person(g, s.who || 'hero', hx, hf + 4, s.scale || .62, { walk: s.walk ? t * 6 : null, facing: s.facing || 1, armF: s.armF ?? (s.torch !== false ? 1.1 : .2), armB: .2, kneel: s.kneel, face: { eyes: s.eyes || 'open', look: s.look || [1, .6], brow: s.brow || 'worried', mouth: s.mouth || 0, sweat: s.sweat } });
  if (s.vera) person(g, 'vera', s.vera.x, s.vera.y, .62, { walk: t * 8, facing: 1, face: { eyes: 'wide', brow: 'up', mouth: .5, look: [1, .5] } });
  if (s.torch !== false && s.dark !== false) {
    const dir = s.facing === -1 ? -1 : 1; dark(g, s.amb ?? .78, [{ x: hx + dir * 260, y: hf + 140, r: 300, sy: .7 }, { x: hx, y: hf - 140, r: 220 }, ...(s.holes || [])]);
  } else if (s.dark !== false) dark(g, s.amb ?? .5, s.holes || [{ x: hx, y: hf - 100, r: 500 }]);
  if (s.counter != null) counter(g, s.counter, s.counterRed);
}
export function counter(g, v, red) {
  T.setCam(); const x = 60, y = 130; shape(g, rrect(x, y, 380, 90, 24), { fill: red ? '#e8423a' : '#231629', boil: false, lw: 6 });
  text(g, 'СТУПЕНЬ', x + 120, y + 47, 34, red ? '#fff' : '#cfd3ff', { outline: false, font: 'JBMono', weight: 800 });
  text(g, String(Math.floor(v)).padStart(3, '0'), x + 300, y + 47, 54, red ? '#fff' : '#ffd23f', { outline: false, font: 'JBMono', weight: 800 });
}
function lyingKeeper(g, x, y, t) {
  setRot(-Math.PI / 2, x, y - 10); person(g, 'keeper', x, y - 10, .58, { armF: .1, armB: .1, face: { eyes: 'closed', mouth: 0, brow: 'sad', side: .3 } }); setRot(0);
}

// ═════ WELL — the courtyard ═════
export function well(g, t, s = {}) {
  const mode = s.mode || 'dusk', P = SKY[mode], F = 860;
  skySea(g, t, mode, {});
  shape(g, rect(-400, 600, 3000, 1200), { fill: P.cliff2[0], shade: P.cliff2[1], shadeOff: [0, -40] });
  shape(g, rect(-200, -200, 520, F + 200), { fill: '#f1ebe2', shade: '#d6cdc0', shadeOff: [-40, 0] });
  for (let y = -200; y < F; y += 60) line(g, [[-200, y], [320, y]], { line: '#d6cdc0', lw: 4, seed: y });
  shape(g, rrect(150, F - 300, 150, 300, 30), { fill: '#7a4a2e', shade: '#5a321e', shadeOff: [-20, 0] });
  if (s.steps) for (let k = 0; k < 12; k++) { const x = 380 + k * 95, on = k < s.steps; shape(g, ell(x, F + 60 + (k % 2) * 30, 22, 12, 12), { fill: on ? '#ffd23f' : '#3c5a3a', lw: 4, seed: k }); }
  const wx = 1560;
  shape(g, rrect(wx - 170, F - 170, 340, 190, 30), { fill: '#9aa3b5', shade: '#7a8296', shadeOff: [-24, 0] }); for (let x = wx - 150; x < wx + 170; x += 70) line(g, [[x, F - 170], [x, F + 18]], { line: '#7a8296', lw: 5, seed: x });
  shape(g, rect(wx - 150, F - 470, 26, 310), { fill: '#7a4a2e' }); shape(g, rect(wx + 124, F - 470, 26, 310), { fill: '#7a4a2e' });
  shape(g, [[wx - 210, F - 440], [wx, F - 560], [wx + 210, F - 440]], { fill: '#e8423a', shade: '#b52c2a', shadeOff: [-24, 0] });
  shape(g, rrect(wx - 130, F - 400, 260, 36, 14), { fill: '#a56a3a' });
  const a = (s.crank || 0) * Math.PI * 2; line(g, [[wx + 150, F - 382], [wx + 150 + Math.cos(a) * 60, F - 382 + Math.sin(a) * 60]], { lw: 12 });
  const by = F - 360 + clamp(s.bucket ?? 1) * 340; line(g, [[wx, F - 380], [wx, by]], { line: '#5c6170', lw: 6 });
  if ((s.bucket ?? 1) < .98) shape(g, [[wx - 50, by], [wx + 50, by], [wx + 40, by + 80], [wx - 40, by + 80]], { fill: '#b9c2d6', shade: '#8d97ad', shadeOff: [-12, 0] });
  if (s.hero) person(g, 'hero', s.hero.x, F + 140, .62, s.hero);
  if (s.rain) for (let i = 0; i < 120; i++) { const x = (hash(i, 1) * 2200 + t * 120) % 2200 - 100, y = (hash(i, 2) * 1200 + t * 1400) % 1200 - 60; line(g, [[x, y], [x - 10, y + 36]], { line: '#cfe6ff', lw: 4, seed: i }); }
  fogBands(g, t, s.fogTop ?? 860, mode, s.fogDens ?? .7);
}

// ═════ close-ups ═════
export function notebook(g, t, s = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#a56a3a', line: false }); for (let y = -300; y < 1400; y += 120) line(g, [[-400, y], [2400, y + 30]], { line: '#86522a', lw: 6, seed: y });
  shape(g, rrect(220, 70, 1480, 920, 30), { fill: '#3d7fd0', shade: '#2d63a8', shadeOff: [-20, -20] });
  shape(g, [[260, 110], [950, 130], [950, 960], [260, 950]], { fill: '#fbf1d8', shade: '#eadcb8', shadeOff: [-24, 0] });
  shape(g, [[970, 130], [1660, 110], [1660, 950], [970, 960]], { fill: '#fffaf0', shade: '#efe6d2', shadeOff: [24, 0] });
  for (let y = 200; y < 940; y += 56) { line(g, [[290, y], [920, y + 4]], { line: '#c9d8f0', lw: 3, seed: y }); line(g, [[1000, y + 4], [1630, y]], { line: '#c9d8f0', lw: 3, seed: y + 1 }); }
  const scrib = (x0, y0, w, seed, col, prog = 1, lw = 5) => { const n = Math.floor(w * prog / 12); if (n < 1) return null; const pts = []; for (let i = 0; i <= n; i++) pts.push([x0 + i * 12, y0 + Math.sin(i * 1.3 + seed) * 7 + (hash(i, seed) - .5) * 6]); line(g, pts, { line: col, lw, amp: .8, seed }); return pts[pts.length - 1]; };
  for (let k = 0; k < 12; k++) scrib(300, 190 + k * 56, 420 + hash(k, 1) * 180, k, '#5a6488');
  const lines = s.lines ?? 10, prog = s.progress ?? 1, ink = s.ink || '#2b3a7a'; let pen = null;
  for (let k = 0; k < lines; k++) { const p = clamp(prog * lines - k); if (p > 0) { const e = scrib(1020, 250 + k * 56, 420 + hash(k, 9) * 160, k + 40, ink, p); if (p < 1 && e) pen = e; } }
  if (s.title) text(g, s.title, 1315, 175, 60, '#d8433b', { font: 'Caveat', weight: 700, outline: false });
  if (s.word) { text(g, s.word, 1315, 560, 120, '#231629', { font: 'Caveat', weight: 700, outline: false }); for (let k = 0; k < (s.circles ?? 3); k++) line(g, ell(1315 + k * 6, 560 + k * 4, 300 + k * 16, 110 + k * 10, 36, 0, Math.PI * 2.1), { line: '#e8423a', lw: 7, seed: k + 50 }); }
  if (s.pencil !== false) { const [px, py] = pen || s.pen || [1500, 820]; shape(g, [[px, py], [px + 24, py - 10], [px + 300, py - 200], [px + 284, py - 222], [px + 10, py - 30]], { fill: '#ffcf4a', shade: '#e4a51e', shadeOff: [0, 8] }); shape(g, [[px, py], [px + 24, py - 10], [px + 10, py - 30]], { fill: '#f4d8b0' }); }
  if (s.warmPencil) glowRings(g, (s.pen || [1500, 820])[0] + 140, (s.pen || [1500, 820])[1] - 110, 200, '#ff9a4a', .3);
}
export function bigClock(g, t, s = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: s.cold ? '#3a3f7a' : '#e7a45a', line: false });
  clock(g, 960, 470, s.time ?? 3.28, t, s.stopped, 3.4);
  if (s.cold) dark(g, .4, [{ x: 960, y: 470, r: 520 }]);
}
export function glass(g, t, s = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#1c2150', line: false });
  for (let i = 0; i < 9; i++) { const x = (hash(i, 1) * 2200 + t * 40 * (1 + hash(i, 2))) % 2400 - 300; g.save(); g.globalAlpha = .35; shape(g, ell(x, 200 + hash(i, 3) * 700, 260, 90, 20), { fill: '#7f7fb8', line: false, seed: i }); g.restore(); }
  if (s.shadow) shape(g, [...ell(1240, 420, 150, 180, 24), [1460, 1200], [1020, 1200]], { fill: '#0b0c26', line: false, seed: 3 });
  if (s.breath) { g.save(); g.globalAlpha = .75 * s.breath; shape(g, ell(1080, 500, 520 * s.breath, 330 * s.breath, 30), { fill: '#e7ecff', line: false, seed: 5 }); g.restore(); }
  if (s.text) text(g, s.text, 1000, 500, 190, s.textCol || '#9aa3d6', { font: 'Caveat', weight: 700, reveal: s.reveal ?? 1, outline: s.textCol === '#e8423a' ? INK : false, rot: -.04 });
  if (s.nail) shape(g, rrect(1300, 600 + (Math.floor(t * 8) % 2) * 14, 60, 150, 26), { fill: '#d7d2ea', shade: '#b0aacb', shadeOff: [-10, 0] });
  for (const [x, y, w, h] of [[-100, -100, 2200, 100], [-100, 1000, 2200, 200], [-100, -100, 140, 1300], [1880, -100, 200, 1300], [930, -100, 60, 1300], [-100, 520, 2200, 50]]) shape(g, rect(x, y, w, h), { fill: '#6b4426', shade: '#4e3018', shadeOff: [-10, -10], seed: x + y });
}
export function bucket(g, t, s = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#1d1a33', line: false });
  shape(g, ell(960, 540, 640, 470, 48), { fill: '#9aa3b5', shade: '#7a8296', shadeOff: [-30, -20] });
  shape(g, ell(960, 540, 580, 420, 48), { fill: '#1f5e7a', shade: '#174a62', shadeOff: [30, 20] });
  face(g, 960, 520, 230, T.CAST.hero, { eyes: s.blink ? 'closed' : 'open', look: [0, -.2], brow: 'neutral', mouth: 0 });
  g.save(); g.globalAlpha = .45; for (let k = 0; k < 4; k++) { const r = ((t * 120 + k * 140) % 560); line(g, ell(960, 540, r, r * .72, 40), { line: '#9fd6e0', lw: 5, seed: k }); } g.restore();
  tint(g, '#14506a', .2);
}
export function radio(g, t, s = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#2a2f5c', line: false });
  const on = s.on ?? 1;
  shape(g, rrect(220, 160, 1480, 820, 50), { fill: '#9a5a32', shade: '#7a4222', shadeOff: [-40, -20] });
  for (let y = 240; y < 900; y += 44) line(g, [[320, y], [860, y]], { line: '#6a3a1a', lw: 9, seed: y });
  shape(g, rrect(980, 240, 600, 300, 30), { fill: on ? '#7ee06a' : '#20361f', shade: on ? '#5cc44a' : '#16261a', shadeOff: [0, -30] });
  if (on) { glowRings(g, 1280, 390, 420, '#a8ff96', .18); for (let k = 0; k < 12; k++) { const h = (40 + 160 * Math.abs(Math.sin(t * 17 + k * 1.7))) * (s.amp || 0) + 14; shape(g, rect(1010 + k * 47, 520 - h, 30, h), { fill: '#215e1c', line: false, seed: k }); }
    line(g, [[1180 + Math.sin(t * .6) * 30, 260], [1180 + Math.sin(t * .6) * 30, 520]], { line: '#e8423a', lw: 8 }); }
  text(g, 'КОРСАК', 1280, 610, 70, on ? '#ffd23f' : '#6a4a2a', { lw: 10 });
  shape(g, ell(1110, 800, 70, 70, 28), { fill: '#c9d1dc', shade: '#9aa3b5', shadeOff: [-14, -10] }); shape(g, ell(1450, 800, 70, 70, 28), { fill: '#c9d1dc', shade: '#9aa3b5', shadeOff: [-14, -10] });
  if (s.cord !== false) line(g, [[1700, 820], [1850, 1000], [1900, 1100]], { lw: 12 }); else { line(g, [[1700, 820], [1800, 930]], { lw: 12 }); shape(g, rrect(1790, 920, 50, 30, 8), { fill: '#c9d1dc' }); }
  if (!on && s.ghost) text(g, '...ВИДИМ', 1280, 390, 110, '#e8423a', { reveal: s.ghost });
}
export function flask(g, t, s = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#6f7aa8', line: false });
  for (let y = -100; y < 1200; y += 90) for (let x = ((y / 90) % 2) * 80; x < 2000; x += 160) shape(g, rrect(x + 6, y + 6, 148, 78, 12), { fill: '#7a86b4', line: '#5c6694', lw: 4, seed: x + y * 3 });
  shape(g, rrect(420, 620, 1080, 520, 40), { fill: '#f2b33a', shade: '#c9851a', shadeOff: [-50, 0] });
  shape(g, rrect(760, 40, 400, 600, 60), { fill: '#cfe6f2', shade: '#aecde0', shadeOff: [-30, 0] });
  const lvl = clamp(s.salt ?? 1); if (lvl > .01) { shape(g, rrect(785, 615 - 540 * lvl, 350, 540 * lvl, 40), { fill: '#b8bccb', shade: '#9599ab', shadeOff: [-24, 0], seed: 4 }); for (let i = 0; i < 60 * lvl; i++) dot(g, 800 + hash(i, 1) * 320, 600 - hash(i, 2 + Math.floor((s.crank || 0) * 6)) * 520 * lvl, 7, '#ffffff'); }
  shape(g, rrect(740, 10, 440, 60, 20), { fill: '#f2b33a' });
  const a = (s.crank || 0) * Math.PI * 2, hx = 1700 + Math.cos(a) * 150, hy = 860 + Math.sin(a) * 150;
  shape(g, ell(1700, 860, 50, 50, 24), { fill: '#f2b33a', shade: '#c9851a' }); line(g, [[1700, 860], [hx, hy]], { lw: 26 });
  shape(g, rrect(hx - 34, hy - 80, 68, 160, 26), { fill: '#7a4a2e' });
  if (s.hand) shape(g, ell(hx, hy, 70, 60, 24), { fill: '#ffc928', shade: '#e09a12', shadeOff: [-14, -10] });
  text(g, 'НЕ ВРАЩАТЬ ДО ПОСЛЕДНЕГО', 960, 860, 70, '#e8423a', { font: 'Caveat', weight: 700, lw: 10 });
  if (s.hiss) for (let i = 0; i < 30; i++) { const ph = (t * 1.6 + hash(i, 1)) % 1, d = i % 2 ? 1 : -1; g.save(); g.globalAlpha = 1 - ph; shape(g, ell(960 + d * (600 + ph * 500), 1040 - ph * 300, 40 + ph * 60, 30 + ph * 40, 16), { fill: '#ffffff', lw: 4, seed: i }); g.restore(); }
}
export function doorOut(g, t, s = {}) {
  skySea(g, t, 'dawn', {});
  shape(g, rect(-400, -100, 3000, 1400), { fill: '#f1ebe2', shade: '#d6cdc0', shadeOff: [0, -40] });
  shape(g, rrect(600, 80, 720, 1100, 40), { fill: '#7a4a2e', shade: '#5a321e', shadeOff: [-40, 0] });
  for (let x = 700; x < 1300; x += 110) line(g, [[x, 100], [x, 1080]], { line: '#5a321e', lw: 8, seed: x });
  const n = Math.floor((s.prints ?? 1) * 26);
  for (let k = 0; k < n; k++) { const x = 680 + hash(k, 1) * 560, y = 330 + hash(k, 2) * 230, a = (hash(k, 3) - .5) * .7;
    g.save(); g.globalAlpha = .9; shape(g, ell(x, y, 34, 40, 18), { fill: '#f4f0ff', line: false, seed: k });
    for (let f = 0; f < 4; f++) { const fx = x - 26 + f * 17 + Math.sin(a) * 20; shape(g, ell(fx, y - 58 + (f === 0 || f === 3 ? 12 : 0), 8, 22, 10), { fill: '#f4f0ff', line: false, seed: k * 5 + f }); }
    shape(g, ell(x + 38, y - 12, 8, 20, 10), { fill: '#f4f0ff', line: false }); g.restore(); }
  fogBands(g, t, 900, 'dawn', .8);
}
export function slot(g, t, s = {}) {
  shape(g, rect(-400, -400, 3000, 2000), { fill: '#7a4a2e', line: false }); for (let x = -300; x < 2200; x += 160) line(g, [[x, -100], [x, 1200]], { line: '#5a321e', lw: 9, seed: x });
  shape(g, rrect(420, 170, 1080, 640, 30), { fill: '#5a321e' });
  shape(g, rrect(460, 210, 1000, 560, 20), { fill: '#3a4378', line: false });
  g.save(); g.globalAlpha = .5; for (let i = 0; i < 5; i++) shape(g, ell(500 + i * 220 + Math.sin(t * .5 + i) * 40, 600, 200, 80, 20), { fill: '#9b9ccc', line: false, seed: i }); g.restore();
  if (s.who) { g.save(); const [x0, y0] = T.P([460, 210]), [x1, y1] = T.P([1460, 770]); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    face(g, 960, 520, 200, T.CAST[s.who], { eyes: s.eyes || 'open', mouth: s.mouth || 0, tear: s.tear, look: s.look || [0, 0], brow: s.brow || 'sad', smile: s.smile || 0 });
    shape(g, [[700, 800], [760, 700], [1160, 700], [1220, 800]], { fill: T.CAST[s.who].coat, shade: T.CAST[s.who].coatS }); g.restore(); }
  if (s.hand) { shape(g, ell(960, 850, 170, 90, 24), { fill: '#f2b48a', shade: '#d98a62', shadeOff: [0, -20] }); if (s.saltIn) for (let i = 0; i < 40; i++) dot(g, 860 + hash(i, 1) * 200, 820 + hash(i, 2) * 40, 6, '#ffffff'); }
  if (s.fist != null) { shape(g, rrect(840, 760, 240, 160, 60), { fill: '#f6c39c', shade: '#dd9670', shadeOff: [0, -20] }); if (s.fist === 0) for (let i = 0; i < 30; i++) dot(g, 880 + hash(i, 1) * 160, 920 + ((t * 400 + i * 40) % 300), 6, '#ffffff'); }
  shape(g, rect(380, 140, 1160, 40), { fill: '#a56a3a' }); shape(g, rect(380, 800, 1160, 40), { fill: '#a56a3a' });
}
export function closeFace(g, t, who, f, bg = '#2a2f5c') {
  shape(g, rect(-400, -400, 3000, 2000), { fill: bg, line: false });
  glowRings(g, 960, 520, 520, '#ffffff', .07);
  shape(g, [[560, 1200], [660, 900], [1260, 900], [1360, 1200]], { fill: T.CAST[who].coat, shade: T.CAST[who].coatS });
  face(g, 960, 520, 300, T.CAST[who], f);
}
export function titleBg(g, t, n) {
  skySea(g, t, 'night', { moon: false });
  shape(g, [[1100, 1300], [1200, 740], [1420, 700], [2100, 720], [2100, 1300]], { fill: '#1a2536', line: false });
  const lx = 1550; shape(g, [[lx - 50, 720], [lx + 50, 720], [lx + 32, 330], [lx - 32, 330]], { fill: '#2b2f55', line: false }); shape(g, rect(lx - 40, 270, 80, 60), { fill: '#3b4170', line: false }); shape(g, [[lx - 52, 270], [lx + 52, 270], [lx, 200]], { fill: '#3b2f5a', line: false });
  fogBands(g, t, 760, 'night', 1);
  if (n) text(g, String(n), 420, 470, 420, '#ffd23f', { lw: 30 });
}
export function endCard(g, t, s = {}) {
  ext(g, t, { mode: 'dawn', fogTop: 860 - (s.fog || 0) * 260, fogDens: 1 });
  if (s.menu) { T.setCam(); shape(g, rrect(90, 140, 720, 470, 34), { fill: '#231629', boil: false });
    text(g, 'Кто-то стучит.', 450, 220, 54, '#ffffff', { outline: false }); text(g, 'Три раза с паузой.', 450, 290, 54, '#ffd23f', { outline: false });
    const sel = Math.floor(t * 1.2) % 2; for (const [k, lab] of [[0, 'ОТКРЫТЬ'], [1, 'НЕ ОТКРЫВАТЬ']]) { shape(g, rrect(150, 360 + k * 110, 600, 86, 24), { fill: sel === k ? '#ffd23f' : '#3a3150', boil: false, lw: 6 }); text(g, lab, 450, 404 + k * 110, 48, sel === k ? '#231629' : '#ffffff', { outline: false }); } }
}
