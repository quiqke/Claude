// style test: three scenes of «11 правил маяка» as a bright cartoon (toon.js)
import * as T from './toon.js';
const W = 1920, H = 1080;
let g, CU, LINES;
export async function init(cv, cues) { g = cv.getContext('2d'); CU = cues; LINES = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).sort((a, b) => a.t0 - b.t0); return { draw, EV: [] }; }
const sceneAt = t => { let s = 'hook'; for (const l of LINES) { if (l.t0 - .25 > t) break; if (l.tags.scene) s = l.tags.scene; } return s; };

function exterior(t, o = {}) {
  T.bands(g, W, [0, 170, 300, 400, 470, 520], ['#3b2a6e', '#6b3a8c', '#b4507e', '#ec7a5c', '#ffb25e', '#ffd88a']);
  g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(560, 500, 70, 0, 7); g.fill();                                  // sun at the horizon
  T.bands(g, W, [540, 600, 680], ['#2c6f8a', '#1f5670', '#173f57']);                                              // sea bands
  for (let i = 0; i < 14; i++) { const x = (i * 157 + t * 30) % 2100 - 100, y = 570 + (i % 4) * 40; T.line(g, [[x, y], [x + 40, y - 8], [x + 80, y]], { line: '#9fd6e0', lw: 5, seed: i }); }
  T.shape(g, [[820, 1080], [900, 720], [1080, 640], [1500, 600], [1920, 640], [1920, 1080]], { fill: '#3f5d3a', shade: '#2c4429', shadeOff: [-40, -30] });   // cliff
  T.shape(g, [[1060, 1080], [1120, 820], [1260, 760], [1500, 740], [1920, 780], [1920, 1080]], { fill: '#5b7a43', shade: '#46622f', shadeOff: [-30, -20] });
  // lighthouse
  const lx = 1440, base = 760, top = 250;
  const tw = y => 70 - (base - y) / (base - top) * 26;
  for (let k = 0; k < 5; k++) { const y0 = top + (base - top) * k / 5, y1 = top + (base - top) * (k + 1) / 5;
    T.shape(g, [[lx - tw(y0), y0], [lx + tw(y0), y0], [lx + tw(y1), y1], [lx - tw(y1), y1]], { fill: k % 2 ? '#e8423a' : '#fbf4e8', shade: k % 2 ? '#b52c2a' : '#d8cfc4', shadeOff: [-30, 0], seed: k }); }
  T.shape(g, T.rrect(lx - 30, base - 110, 60, 110, 24), { fill: '#7a4a2e', shade: '#5a321e', shadeOff: [-14, 0] });
  for (const y of [440, 600]) T.shape(g, T.rrect(lx - 16, y, 32, 44, 14), { fill: o.lit ? '#ffd84a' : '#2b2f55' });
  T.shape(g, T.rect(lx - 80, top - 14, 160, 22), { fill: '#3a3a52' });
  if (o.lamp) T.glowRings(g, lx, top - 70, 190, '#fff1a8', .3);
  T.shape(g, T.rect(lx - 50, top - 120, 100, 106), { fill: o.lamp ? '#fff6c8' : '#53608c', shade: o.lamp ? '#ffe17a' : '#3d4870', shadeOff: [-20, 0] });
  for (const x of [-25, 0, 25]) T.line(g, [[lx + x, top - 118], [lx + x, top - 16]], { lw: 5 });
  T.shape(g, [[lx - 64, top - 118], [lx + 64, top - 118], [lx, top - 200]], { fill: '#e8423a', shade: '#b52c2a', shadeOff: [-20, 0] });
  // fog bands
  g.save(); g.globalAlpha = .55; for (let k = 0; k < 3; k++) { const y = 860 + k * 70, sh = Math.sin(t * .3 + k) * 60;
    T.shape(g, [[-100 + sh, y], [700 + sh, y - 30], [1400 + sh, y + 10], [2100 + sh, y - 20], [2100, y + 120], [-100, y + 120]], { fill: '#d9c8ef', line: false }); } g.restore();
  // the hero walking up the path (big enough to read)
  const k = Math.min(1, Math.max(0, (t - 21) / 10)), hx = 980 + k * 300;
  T.person(g, 'hero', hx, 900 - k * 60, .55, { walk: t * 7, facing: 1, armF: Math.sin(t * 7) * .5, armB: -Math.sin(t * 7) * .5, face: { eyes: 'open', look: [1, -.3], brow: 'worried', mouth: 0 } });
}
function room(t, o = {}) {
  T.bands(g, W, [0], ['#e7a45a']);                                                                              // warm plaster
  for (let y = 60; y < 760; y += 70) for (let x = (y / 70 % 2) * 60; x < W; x += 120) T.shape(g, T.rrect(x + 6, y + 6, 108, 58, 10), { fill: '#ecb06a', line: '#d08a46', lw: 4, seed: x + y });
  T.shape(g, T.rect(-20, 760, 1960, 340), { fill: '#8a4f2c', shade: '#6d3c20', shadeOff: [0, -30] });            // floor
  for (let x = 0; x < W; x += 160) T.line(g, [[x, 760], [x - 60, 1080]], { line: '#6d3c20', lw: 5, seed: x });
  // window with night fog
  T.shape(g, T.rrect(1180, 170, 330, 360, 30), { fill: '#6b4426' }); T.shape(g, T.rrect(1205, 195, 280, 310, 20), { fill: '#28305e', shade: '#3a4a86', shadeOff: [0, 60] });
  g.save(); g.globalAlpha = .6; T.shape(g, [[1210, 420], [1300, 380], [1400, 410], [1480, 370], [1480, 500], [1210, 500]], { fill: '#b9b3dd', line: false }); g.restore();
  T.line(g, [[1345, 195], [1345, 505]], { line: '#6b4426', lw: 14 }); T.line(g, [[1205, 350], [1485, 350]], { line: '#6b4426', lw: 14 });
  // clock
  T.shape(g, T.ell(980, 230, 78, 78, 32), { fill: '#fff6e4', shade: '#e6d6b8', shadeOff: [-12, -10] });
  T.line(g, [[980, 230], [980, 180]], { lw: 8 }); T.line(g, [[980, 230], [1020, 250]], { lw: 8 });
  const sw = Math.sin(t * Math.PI) * .3; T.line(g, [[980, 308], [980 + Math.sin(sw) * 120, 308 + Math.cos(sw) * 120]], { lw: 6 }); T.shape(g, T.ell(980 + Math.sin(sw) * 130, 308 + Math.cos(sw) * 130, 20, 20, 14), { fill: '#f2b33a' });
  // stove + fire
  T.shape(g, T.rect(330, -20, 60, 470), { fill: '#3a3550', shade: '#2a2640', shadeOff: [-14, 0] });
  T.shape(g, T.rrect(230, 440, 260, 330, 26), { fill: '#3a3550', shade: '#2a2640', shadeOff: [-30, 0] });
  T.shape(g, T.rrect(285, 560, 150, 110, 18), { fill: '#ffb238' }); T.glowRings(g, 360, 615, 300, '#ffbe5c', .18);
  for (let i = 0; i < 4; i++) { const f = Math.sin(t * 9 + i * 2) * 10; T.shape(g, [[300 + i * 35, 665], [318 + i * 35 + f * .3, 590 - f], [336 + i * 35, 665]], { fill: i % 2 ? '#ff6b2c' : '#ffe14a', lw: 4, seed: i }); }
  // salt sacks + table with notebook and lamp
  for (let i = 0; i < 4; i++) { T.shape(g, [[1580 + i * 80, 770], [1590 + i * 80, 660], [1650 + i * 80, 650], [1660 + i * 80, 770]], { fill: '#f4ecda', shade: '#d9ccb0', shadeOff: [-12, 0], seed: i }); }
  g.font = '900 26px Rubik'; g.fillStyle = '#3b6fb0'; for (let i = 0; i < 4; i++) g.fillText('СОЛЬ', 1584 + i * 80, 720);
  T.shape(g, T.rect(640, 640, 380, 30), { fill: '#a56a3a', shade: '#86522a', shadeOff: [0, -10] }); T.shape(g, T.rect(670, 670, 26, 110), { fill: '#86522a' }); T.shape(g, T.rect(965, 670, 26, 110), { fill: '#86522a' });
  T.shape(g, [[700, 640], [860, 640], [870, 618], [710, 618]], { fill: '#3d7fd0', lw: 5 });                         // notebook
  T.shape(g, T.rrect(930, 560, 46, 80, 16), { fill: '#ffcf4a', shade: '#e4a51e', shadeOff: [-10, 0] }); T.glowRings(g, 953, 580, 120, '#fff0a0', .22);
  // Vera and you by the stove
  const talk = o.veraMouth || 0;
  T.person(g, 'vera', 610, 1000, .95, { facing: 1, armF: -.9, armB: .2, face: { eyes: 'open', look: [1, 0], mouth: talk, smile: .8, brow: 'up', side: .6 } });
  T.person(g, 'hero', 1180, 1010, 1.0, { facing: -1, armF: .3, armB: .1, face: { eyes: 'half', look: [-1, 0], mouth: 0, smile: .35, brow: 'neutral', side: -.6 } });
}
function doorClose(t, o = {}) {
  T.bands(g, W, [0], ['#2a2f5c']);                                                                                // cold night wall
  for (let y = 0; y < H; y += 80) for (let x = (y / 80 % 2) * 70; x < W; x += 140) T.shape(g, T.rrect(x + 6, y + 6, 128, 68, 10), { fill: '#323a6c', line: '#232853', lw: 4, seed: x + y * 3 });
  const kn = o.knock ? Math.max(0, 1 - (t - o.knock) * 4) : 0, dx = Math.sin(t * 90) * 10 * kn;
  T.shape(g, T.rrect(1080 + dx, 60, 620, 1100, 30), { fill: '#7a4a2e', shade: '#5a321e', shadeOff: [-40, 0] });   // door
  for (let x = 1160; x < 1660; x += 110) T.line(g, [[x + dx, 80], [x + dx, 1080]], { line: '#5a321e', lw: 8, seed: x });
  T.shape(g, T.rrect(1020 + dx, 520, 300, 46, 16), { fill: '#b9c2d6', shade: '#8d97ad', shadeOff: [0, -12] });     // bolt
  if (kn > 0) { g.save(); g.translate(1460, 300); g.rotate(-.12); g.font = '900 150px Rubik'; g.lineWidth = 18; g.strokeStyle = T.INK; g.fillStyle = '#ffe14a'; g.strokeText('ТУК!', 0, 0); g.fillText('ТУК!', 0, 0); g.restore();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; T.line(g, [[1500 + Math.cos(a) * 220, 260 + Math.sin(a) * 120], [1500 + Math.cos(a) * 300, 260 + Math.sin(a) * 170]], { lw: 8, seed: i }); } }
  // you, close: wide eyes, sweat, hand on the bolt
  g.save(); g.globalAlpha = .3; g.fillStyle = '#0d0e2a'; g.fillRect(0, 0, W, H); g.restore();
  T.person(g, 'hero', 640, 1500, 2.4, { facing: 1, armF: 1.5, armB: .1, face: { eyes: 'wide', look: [1, -.2], brow: 'worried', mouth: .25, sweat: true, side: .7 } });
}
function draw(t) {
  T.setTime(t); g.clearRect(0, 0, W, H);
  const s = sceneAt(t);
  if (s === 'vera_room' || s === 'room') room(t, { veraMouth: Math.floor(t * 10) % 2 ? .6 : .15 });
  else if (s === 'door_knock') { const k = (CU.lines.l021.words || []).filter(w => /тук/i.test(w.w) && w.t0 <= t).pop(); doorClose(t, { knock: k ? k.t0 : null }); }
  else exterior(t, { lamp: s === 'hook' });
}
