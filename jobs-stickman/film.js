// «Сколько ты проживёшь в самых смертельных профессиях?» — one figure ("you", accent head) jumps through four deadly
// jobs of the past through the bracelet ring and lands in a 2026 office. The life counter ticks top right.
// The last words «…когда» cut straight back to the first frame, so the Short loops without a seam.
// Accent = your life (head, counter, bracelet). Material tints asked for in the brief: poison green steam, a sooty
// black chimney, a copper diving helmet (muted, flat).
const DUR = 56.25, GY = 1180, YS = 560, YX = 540;
const SC = [['hook', 0, 4.85], ['taster', 4.85, 12.3], ['sweep', 12.3, 22.05], ['diver', 22.05, 32.85], ['beam', 32.85, 43.1], ['office', 43.1, DUR]];
const DIVES = [4.85, 12.3, 22.05, 32.85, 43.1];
const T = { poison: '#8DAA6A', soot: '#3B3A42', copper: '#C58A4E', copperD: '#9C6533', water: '#DCE6E8' };
const sceneAt = t => SC.find(s => t >= s[1] && t < s[2]) || SC[SC.length - 1];
const JOB = { hook: ['СЛОМАННЫЙ ТЕЛЕПОРТ', 'Сколько ты проживёшь?'], taster: ['ДРЕВНИЙ РИМ', 'ДЕГУСТАТОР ЯДОВ'], sweep: ['ЛОНДОН · 1800', 'ТРУБОЧИСТ'],
  diver: ['1900 · ГЛУБИНА 50 М', 'ВОДОЛАЗ'], beam: ['НЬЮ-ЙОРК · 1930', 'МОНТАЖНИК'], office: ['2026', 'ОФИС'] };
const EASE = { o: u => 1 - Math.pow(1 - clamp(u), 3), io: u => ss(u) };
const pulse = (t, a, d = .25) => t < a ? 0 : Math.exp(-(t - a) / d);
const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');

// the life counter: what it shows at time t, and whether it is a verdict
function counter(t) {
  const s = sceneAt(t)[0];
  if (s === 'hook') return [mmss(0), false];
  if (s === 'taster') return t >= 10.9 ? ['3 ДНЯ', true] : [t >= 9.28 ? 'ДЕНЬ 3' : t >= 7.7 ? 'ДЕНЬ 2' : 'ДЕНЬ 1', false];
  const run = (a, b, mins) => mmss(mins * 60 * Math.pow(seg(t, a, b), 1.6));
  if (s === 'sweep') return t >= 19.9 ? ['4 МИН', true] : [run(12.6, 19.9, 4), false];
  if (s === 'diver') return t >= 30.4 ? ['12 МИН', true] : [run(22.4, 30.4, 12), false];
  if (s === 'beam') return t >= 40.5 ? ['20 МИН', true] : [run(33.2, 40.5, 20), false];
  return t >= 49.5 ? ['∞', true] : [mmss(Math.max(0, t - 43.1) * 7), false];
}
const VERDICT_T = { taster: 10.9, sweep: 19.9, diver: 30.4, beam: 40.5, office: 49.5 };

// ---------------- the pose of "you" ----------------
function youTarget(_, t) {
  const p = rest();
  p.hx += .004 * Math.sin(t * 1.25 + .7); p.lean += .01 * Math.sin(t * 1.05); p.hy += .003 * (.5 + .5 * Math.sin(t * 2.1));
  const s = sceneAt(t)[0], set = o => Object.assign(p, o);
  if (s === 'hook') {
    const w = Math.sin(t * 22);
    set({ la: -1.1 + .25 * w, lb: 1.3, ra: .4, rb: -.3, head: -.15, lean: -.03 });           // shakes the sparking wrist
    if (t > 3.7) set({ la: -1.5, lb: .3, ra: 1.5, rb: -.3, hy: .03 });
  } else if (s === 'taster') {
    set({ hy: .2, lfx: -.04, rfx: .16, rfy: 0, la: -.5, lb: .4, ra: .9, rb: .5 });            // sitting at the table
    if (t > 6.3 && t < 9.2) { const b = .5 + .5 * Math.sin(t * 7); set({ ra: lerp(1.0, 2.35, b), rb: lerp(.4, 1.25, b) }); }   // eats
    if (t >= 9.2 && t < 10.7) set({ ra: 2.3, rb: 1.2, head: -.12 });                        // the cup at the lips
    if (t >= 10.7 && t < 11.5) set({ ra: 1.2, rb: .3, la: -1.1, lb: -.2, head: .2, lean: -.06 });
    if (t >= 11.5) set({ lean: .3, head: .45, la: -.3, lb: .1, ra: .2, rb: -.1, bend: .08 });  // slumps
  } else if (s === 'sweep') {
    const w = Math.sin(t * 9);
    set({ la: -2.75, lb: -.3, ra: 2.75, rb: .3, lfx: .04, rfx: -.04 });                        // arms up inside the flue
    if (t > 16.8) { set({ la: -2.85 + .12 * w, ra: 2.85 - .12 * w, lfy: .05 * Math.max(0, w), rfy: .05 * Math.max(0, -w), lean: .03 * w }); }
    if (t > 19.6) { const k = Math.sin(t * 17); set({ lfy: .09 * Math.max(0, k), rfy: .09 * Math.max(0, -k), lfx: .08 * k, rfx: -.08 * k }); }
  } else if (s === 'diver') {
    const w = Math.sin(t * 2.6);
    set({ la: -.75, lb: .3, ra: .75, rb: -.3, lfx: .05 * w, rfx: -.05 * w, lfy: .03 * Math.max(0, w), rfy: .03 * Math.max(0, -w), bend: .03 });
    if (t > 27.25 && t < 29.0) set({ la: -2.4, lb: -.6, ra: 2.4, rb: .6, lfx: 0, rfx: 0, lfy: 0, rfy: 0 });
    if (t >= 29.0) set({ la: -1.6, lb: -1.0, ra: 1.6, rb: 1.0, lfx: -.06, rfx: .06, lfy: 0, rfy: 0, hy: .06 });
  } else if (s === 'beam') {
    set({ hy: .12, lfx: .09, rfx: .15, lfy: 0, rfy: 0, la: -.5, lb: .3, ra: .5, rb: -.2 });   // sitting on the beam, legs over the void
    const k = Math.sin(t * 2.2); p.lfx += .03 * k; p.rfx -= .03 * k;
    if (t > 35.6 && t < 40.1) { const b = .5 + .5 * Math.sin(t * 4); set({ ra: lerp(1.1, 2.3, b), rb: lerp(.5, 1.2, b) }); }   // the sandwich
    if (t >= 40.2) { const m = Math.sin(t * 14); set({ la: -2.2 + .8 * m, lb: -.6, ra: 2.2 - .8 * m, rb: .6, lean: .08 * Math.sin(t * 5), head: -.2 }); }
  } else {
    set({ hy: .19, lfx: .1, rfx: .18, la: -.55, lb: .5, ra: 1.05, rb: .9, lean: -.05 });      // in the chair, mug in hand
    if (t > 46.0 && t < 48.4) set({ la: -1.2, lb: .2 });                                       // on the laptop
    if (t > 48.4 && t < 50.4) set({ la: -.8, lb: 1.55, head: -.18 });                          // looks at the bracelet
    if (t > 50.6) set({ lean: -.16, head: -.12 });                                             // leans back, relaxed
    if (t > 52.8 && t < 53.6) set({ ra: 1.5, rb: .4, lean: -.05, head: .1 });                  // almost spills
    if (t > 54.6) set({ la: -1.0, lb: 1.3, head: -.15, lean: -.02 });                          // the bracelet sparks again
  }
  return p;
}
let SIMY = null;
const youAt = t => SIMY.at(t)[0];

// ---------------- helpers ----------------
function ln(pts, col = C.mute, w = 4) { g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); g.restore(); }
function poly(pts, fill, col = C.ink, w = 5) { g.save(); g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (col) { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); } g.restore(); }
function circ(x, y, r, col = C.mute, w = 4, fill) { g.save(); g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, 7); if (fill) { g.fillStyle = fill; g.fill(); } if (col) { g.strokeStyle = col; g.lineWidth = w; g.stroke(); } g.restore(); }
function smoothPath(P, col, w) { g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); spline(P, .9); g.stroke(); g.restore(); }
function sparks(x, y, t, n = 7, R = 40) { for (let k = 0; k < n; k++) { const a = k * 2 * Math.PI / n + Math.floor(t * 14) * 1.3, r0 = R * (.6 + .4 * ((k * 7 + Math.floor(t * 14)) % 3) / 2); ln([[x + Math.cos(a) * r0 * .5, y + Math.sin(a) * r0 * .5], [x + Math.cos(a) * r0, y + Math.sin(a) * r0]], C.sig, 5); } }
function you(t, o = {}) {
  const p = youAt(t), S = o.S ?? YS, f = { x: o.x ?? YX, gy: o.gy ?? GY, S, col: C.ink, fill: C.sig };
  const j = figure(f, p);
  g.save(); g.beginPath(); g.arc(j.Hd[0], j.Hd[1], GEO.headR * S, 0, 7); g.fillStyle = C.sig; g.fill(); g.restore();
  const [E, Hn] = j.aL, bx = lerp(E[0], Hn[0], .78), by = lerp(E[1], Hn[1], .78);
  const off = t > 48.56 && t < 54.9 ? seg(t, 48.56, 49.3) : 0;
  circ(bx, by, 15 * S / YS, mix(C.sig, C.mute, off), 6, C.paper);
  j.wrist = [bx, by];
  return j;
}
function other(x, S, p, col = C.ink, o = {}) { return figure({ x, gy: o.gy ?? GY, S, col, fill: C.paper }, p); }
function wavePose(t, ph, extra = {}) { const p = rest(); p.hx += .005 * Math.sin(t * 1.25 + ph); p.lean += .012 * Math.sin(t * 1.05 + ph * 1.3); p.hy += .004 * (.5 + .5 * Math.sin(t * 2.1 + ph)); return Object.assign(p, extra); }

// ---------------- the jobs ----------------
function drawHook(t) { ln([[-60, GY], [1140, GY]], C.tint, LW); }
function drawTaster(t, J) {
  // the table, the emperor on his throne, plates, the cup
  ln([[20, 1010], [660, 1010]], C.ink, 7); ln([[70, 1010], [70, GY]], C.ink, 6); ln([[610, 1010], [610, GY]], C.ink, 6);
  ln([[-60, GY], [1140, GY]], C.tint, LW);
  ln([[120, 1066], [280, 1066]], C.ink, 7); ln([[140, 1066], [140, GY]], C.ink, 5); ln([[260, 1066], [260, GY]], C.ink, 5);
  for (const x of [300, 430, 560]) { g.save(); g.strokeStyle = C.mute; g.lineWidth = 4; g.fillStyle = C.paper; g.beginPath(); g.ellipse(x, 996, 52, 13, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
  poly([[690, GY], [690, 640], [760, 600], [890, 600], [960, 640], [960, GY]], C.paper, C.mute, 5);
  const ep = wavePose(t, 1.3, { hy: .19, lfx: -.02, rfx: .14, la: -.6, lb: .5, ra: .9, rb: .7, head: t > 10.8 ? -.2 : 0, lean: t > 11.5 ? -.06 : 0 });
  const e = other(830, 600, ep);
  poly([[e.Hd[0] - 52, e.Hd[1] - 60], [e.Hd[0] - 52, e.Hd[1] - 104], [e.Hd[0] - 26, e.Hd[1] - 80], [e.Hd[0], e.Hd[1] - 110], [e.Hd[0] + 26, e.Hd[1] - 80], [e.Hd[0] + 52, e.Hd[1] - 104], [e.Hd[0] + 52, e.Hd[1] - 60]], C.paper, C.ink, 5);
  // the cup: in your hand from «на третий день»
  if (t >= 9.2) { const h = J.aR[1], x = h[0] + 10, y = h[1] + 6;
    poly([[x - 30, y - 50], [x + 30, y - 50], [x + 16, y - 6], [x - 16, y - 6]], C.paper, C.ink, 5); ln([[x, y - 6], [x, y + 26]], C.ink, 5); ln([[x - 22, y + 26], [x + 22, y + 26]], C.ink, 5);
    const a = seg(t, 9.4, 9.9) * (1 - seg(t, 11.8, 12.2));
    if (a > 0) for (let k = 0; k < 3; k++) { const P = []; for (let i = 0; i < 7; i++) P.push([x - 16 + k * 16 + Math.sin(i * 1.2 + t * 4 + k) * 10, y - 60 - i * 22 - ((t * 60) % 22)]); g.save(); g.globalAlpha = a; smoothPath(P, T.poison, 7); g.restore(); } }
}
function drawSweep(t) {
  // a house in section: roof line, the flue, the fireplace at the bottom
  poly([[180, GY], [180, 470], [540, 250], [900, 470], [900, GY]], C.paper, C.mute, 4);
  poly([[430, GY - 4], [430, 150], [650, 150], [650, GY - 4]], T.soot, null);
  ln([[430, 150], [430, 1000]], C.ink, 6); ln([[650, 150], [650, 1000]], C.ink, 6);
  poly([[380, GY], [380, 1000], [700, 1000], [700, GY]], C.paper, C.ink, 6);
  g.save(); g.beginPath(); g.moveTo(430, GY); g.lineTo(430, 1080); g.quadraticCurveTo(540, 1010, 650, 1080); g.lineTo(650, GY); g.closePath(); g.fillStyle = T.soot; g.fill(); g.restore();
  ln([[-60, GY], [1140, GY]], C.tint, LW);
  for (const [x, y] of [[250, 600], [790, 600], [250, 820], [790, 820]]) { g.save(); g.strokeStyle = C.tint; g.lineWidth = 4; g.strokeRect(x - 30, y - 45, 60, 90); g.restore(); }
  // soot falling
  const r = mulberry(4); for (let k = 0; k < 26; k++) { const x = 445 + r() * 190, y = (r() * 900 + t * (120 + r() * 80)) % 860 + 160; circ(x, y, 3 + r() * 3, null, 0, C.paper); }
}
function fire(t) {
  if (t < 19.45) { if (t > 19.3) circ(600, GY - 60, 10 * seg(t, 19.3, 19.45) + 4, null, 0, C.soft); return; }
  const h = lerp(60, 640, EASE.io(seg(t, 19.45, 21.9)));
  for (let k = 0; k < 5; k++) { const x = 455 + k * 42, hh = h * (.65 + .35 * Math.abs(Math.sin(t * 7 + k * 1.7))), w = 30;
    g.save(); g.beginPath(); g.moveTo(x - w, GY - 40); g.quadraticCurveTo(x - w * .4, GY - 40 - hh * .6, x + Math.sin(t * 9 + k) * 14, GY - 40 - hh); g.quadraticCurveTo(x + w * .4, GY - 40 - hh * .6, x + w, GY - 40); g.closePath();
    g.fillStyle = C.soft; g.fill(); g.strokeStyle = C.sig; g.lineWidth = 4; g.stroke(); g.restore(); }
}
function drawDiver(t) {
  g.save(); g.fillStyle = T.water; g.fillRect(-400, 300, 1880, 2200); g.restore();
  const P = []; for (let x = -100; x <= 1180; x += 40) P.push([x, 300 + Math.sin(x / 60 + t * 2) * 10]); smoothPath(P, C.mute, 5);
  ln([[-60, GY], [1140, GY]], C.tint, LW);
  for (const [x, w, h] of [[120, 160, 70], [880, 220, 90], [1010, 120, 50]]) { g.save(); g.beginPath(); g.ellipse(x, GY, w / 2, h, 0, Math.PI, 2 * Math.PI); g.fillStyle = C.paper; g.fill(); g.strokeStyle = C.mute; g.lineWidth = 4; g.stroke(); g.restore(); }
  const r = mulberry(6); for (let k = 0; k < 10; k++) { const x = r() * 1080, ph = (t * (.12 + r() * .1) + r()) % 1; circ(x + Math.sin(t * 2 + k) * 10, GY - ph * 880, 6 + r() * 8, C.mute, 3); }
}
function diverSuit(t, J) {
  const H = J.Hd, R = GEO.headR * YS * 2.05;
  // the hose: from the surface to the helmet; it snaps at 27.25 and the upper half drifts away
  const snap = t > 27.25, k = seg(t, 27.25, 28.6);
  if (!snap) smoothPath([[700, 280], [720, 520], [640, 640], [H[0] + R * .6, H[1] - R * .6]], C.ink, 9);
  else { smoothPath([[700, 280 - k * 200], [720, 520 - k * 260], [690 + k * 60, 620 - k * 300]], C.ink, 9); smoothPath([[H[0] + R * .6, H[1] - R * .6], [H[0] + R * .9, H[1] - R * 1.0 + Math.sin(t * 8) * 8]], C.ink, 9);
    for (let i = 0; i < 9; i++) { const ph = (t * 1.6 + i / 9) % 1; circ(H[0] + R * .7 + Math.sin(i * 3 + t * 5) * 30, H[1] - R - ph * 500, 8 + i % 3 * 5, C.mute, 3); } }
  // heavy boots
  for (const [, F] of [J.lL, J.lR]) { g.save(); g.fillStyle = T.copperD; g.strokeStyle = C.ink; g.lineWidth = 5; g.beginPath(); g.roundRect(F[0] - 34, F[1] - 34, 68, 40, 8); g.fill(); g.stroke(); g.restore(); }
  // the copper helmet over the head: it squeezes the body in after the hose snaps
  const sq = seg(t, 29.05, 31.0);
  circ(H[0], H[1] + R * .1, R, C.ink, 7, T.copper);
  for (const a of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) circ(H[0] + Math.cos(a) * R * .72, H[1] + R * .1 + Math.sin(a) * R * .72, 9, C.ink, 3, T.copperD);
  circ(H[0], H[1] + R * .1, R * .48, C.ink, 6, C.sig);
  return sq;
}
function drawBeam(t) {
  // clouds and the city far below, the beam at the top of the frame's world
  for (const [x, y, s] of [[160, 1430, 1], [700, 1460, 1.3], [1000, 1390, .8], [380, 1560, .9]]) { const xx = x + Math.sin(t * .2 + x) * 20;
    for (const [dx, dy, r] of [[-60, 0, 46], [0, -20, 60], [60, 0, 46], [0, 18, 50]]) circ(xx + dx * s, y + dy * s, r * s, C.tint, 4, C.paper); }
  for (let i = 0; i < 16; i++) { const x = 30 + i * 68, h = 40 + (i * 37 % 70); g.save(); g.strokeStyle = C.tint; g.lineWidth = 3; g.strokeRect(x, 1690 - h, 46, h); g.restore(); }
  g.save(); g.fillStyle = C.paper; g.strokeStyle = C.ink; g.lineWidth = 6; g.fillRect(-120, GY, 1000, 46); g.strokeRect(-120, GY, 1000, 46); g.restore();
  ln([[-120, GY + 12], [880, GY + 12]], C.ink, 3); ln([[-120, GY + 34], [880, GY + 34]], C.ink, 3);
  for (let x = -60; x < 880; x += 90) circ(x, GY + 23, 5, null, 0, C.ink);
  ln([[960, GY - 160], [960, 1660]], C.mute, 3); ln([[940, 1640], [960, 1680], [980, 1640]], C.mute, 3);
  text('300 м', 990, 1420, { size: 44, w: 600, col: C.mute });
  // a bird flies by below you
  if (t > 37.3 && t < 40) { const u = seg(t, 37.3, 40), x = lerp(1150, -100, u), y = 1330 + Math.sin(u * 9) * 20, f = Math.sin(t * 16) * 18;
    ln([[x - 34, y - f], [x, y], [x + 34, y - f]], C.ink, 5); }
  // wind
  if (t > 40.1) { const r = mulberry(9); for (let k = 0; k < 14; k++) { const y = 600 + r() * 700, x = ((t - 40.1) * (1800 + r() * 900) + r() * 600) % 2200 - 600; ln([[x, y], [x + 160 + r() * 140, y]], C.mute, 4); } }
}
function sandwich(t, J) {
  if (t < 35.4) return;
  let x = J.aR[1][0] + 14, y = J.aR[1][1] - 6, a = 0;
  if (t > 40.25) { const u = t - 40.25; x += u * 1300; y += -u * 260 + u * u * 400; a = u * 9; }
  g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = C.paper; g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.roundRect(-36, -14, 72, 28, 10); g.fill(); g.stroke();
  ln([[-30, 0], [30, 0]], C.mute, 4); g.restore();
}
function drawOffice(t) {
  ln([[-60, GY], [1140, GY]], C.tint, LW);
  // desk, laptop
  ln([[660, 980], [1080, 980]], C.ink, 7); ln([[1010, 980], [1010, GY]], C.ink, 6);
  poly([[700, 975], [880, 975], [905, 960], [725, 960]], C.paper, C.ink, 5); poly([[725, 960], [700, 820], [865, 800], [880, 960]], C.paper, C.ink, 5);
  // the chair under you
  ln([[400, 1060], [690, 1060]], C.ink, 8); ln([[405, 1060], [360, 800]], C.ink, 8); ln([[545, 1060], [545, 1140]], C.ink, 7);
  ln([[440, 1150], [640, 1150]], C.ink, 6); circ(445, 1162, 14, C.ink, 5, C.paper); circ(635, 1162, 14, C.ink, 5, C.paper);
}
function mug(t, J) {
  const h = J.aR[1], x = h[0] + 18, y = h[1] + 4, tilt = t > 52.8 && t < 53.6 ? Math.sin(Math.PI * seg(t, 52.8, 53.6)) * .5 : 0;
  g.save(); g.translate(x, y); g.rotate(tilt); g.fillStyle = C.paper; g.strokeStyle = C.ink; g.lineWidth = 5; g.beginPath(); g.roundRect(-26, -50, 52, 56, 8); g.fill(); g.stroke();
  g.beginPath(); g.arc(30, -22, 14, -Math.PI / 2, Math.PI / 2); g.stroke(); g.restore();
  if (tilt > .3) circ(x + 34 + tilt * 30, y - 56 - tilt * 40, 7, C.ink, 3, C.soot);
  for (let k = 0; k < 2; k++) { const P = []; for (let i = 0; i < 5; i++) P.push([x - 8 + k * 16 + Math.sin(i + t * 3 + k) * 7, y - 62 - i * 20]); smoothPath(P, C.tint, 4); }
}

// ---------------- camera ----------------
function camAt(t) {
  let z = 1, cx = 540, cy = 960, sx = 0, sy = 0;
  const shake = (t0, a, d = .35) => { if (t >= t0 && t < t0 + d) { const k = 1 - (t - t0) / d; sx += a * k * k * Math.sin(t * 91 + t0); sy += a * k * k * Math.cos(t * 77 + t0); } };
  const s = sceneAt(t)[0];
  if (s === 'hook') { const u = EASE.io(seg(t, 1.9, 3.3)); z = lerp(1, 1.5, u); cx = lerp(540, 470, u); cy = lerp(960, 900, u); }
  if (s === 'taster') { const u = EASE.io(seg(t, 9.2, 10.6)); z = lerp(1, 1.15, u); cx = lerp(540, 500, u); shake(10.76, 10); }
  if (s === 'sweep') { const u = EASE.io(seg(t, 12.3, 16.6)); z = lerp(1.25, 1, u); cy = lerp(700, 960, u); shake(19.45, 8); }
  if (s === 'diver') { shake(27.25, 12); const u = EASE.io(seg(t, 29.0, 31.0)); z = lerp(1, 1.25, u); cy = lerp(960, 820, u); }
  if (s === 'beam') { const u = EASE.io(seg(t, 32.85, 35.8)); z = lerp(1.35, .85, u); cy = lerp(880, 1100, u); shake(40.25, 14, .5); }
  if (s === 'office') { const u = EASE.io(seg(t, 53.4, 56.25)); z = lerp(1, 1.45, u); cx = lerp(540, 470, u); cy = lerp(960, 870, u); }
  return { z, cx, cy, sx, sy };
}
function applyCam(c) { g.setTransform(c.z, 0, 0, c.z, W / 2 - c.cx * c.z + c.sx, H / 2 - c.cy * c.z + c.sy); }
const toScreen = (c, p) => [W / 2 + (p[0] - c.cx) * c.z + c.sx, H / 2 + (p[1] - c.cy) * c.z + c.sy];

function drawScene(name, t) {
  const c = camAt(t); applyCam(c); let J;
  if (name === 'hook') { drawHook(t); J = you(t); sparks(J.wrist[0], J.wrist[1], t, 8, 46); }
  else if (name === 'taster') { J = null; const tmp = youAt(t); J = joints({ x: 200, gy: GY, S: YS }, tmp); drawTaster(t, J); J = you(t, { x: 200 }); }
  else if (name === 'sweep') { drawSweep(t); J = you(t, { x: 540, gy: 820, S: 430 }); fire(t); }
  else if (name === 'diver') { drawDiver(t); const sq = seg(t, 29.05, 31.0);
    g.save(); const hy = GY - YS * .9; g.translate(YX, hy); g.scale(1 + .12 * sq, 1 - .32 * sq); g.translate(-YX, -hy); J = you(t); g.restore();
    const Js = { ...J, Hd: [J.Hd[0], hy + (J.Hd[1] - hy) * (1 - .32 * sq)], lL: [J.lL[0], [J.lL[1][0], hy + (J.lL[1][1] - hy) * (1 - .32 * sq)]], lR: [J.lR[0], [J.lR[1][0], hy + (J.lR[1][1] - hy) * (1 - .32 * sq)]] };
    diverSuit(t, Js); }
  else if (name === 'beam') { drawBeam(t); J = you(t, { x: 380, gy: GY + .30 * YS }); sandwich(t, J); }
  else { drawOffice(t); J = you(t, { x: 540, gy: GY }); mug(t, J); if (t > 54.6) sparks(J.wrist[0], J.wrist[1], t, 7, 40 * seg(t, 54.6, 55.4) + 6); }
  const wr = toScreen(c, J.wrist);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { wr, c };
}

// ---------------- screen-space type ----------------
function infinity(x, y, s, col, a) { g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 14 * s; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= 80; i++) { const u = i / 80 * 2 * Math.PI, d = 1 + Math.sin(u) ** 2, px = x + 60 * s * Math.cos(u) / d, py = y + 60 * s * Math.sin(u) * Math.cos(u) / d; i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath(); g.stroke(); g.restore(); }
function hud(name, t, s0) {
  const a = ss(seg(t, s0 + .1, s0 + .5)), dy = 16 * (1 - a), [lab, title] = JOB[name];
  text(lab, 80, 190 + dy, { size: 26, w: 500, col: C.mute, track: 3, a });
  text(title, 80, 258 + dy, { size: name === 'hook' ? 60 : 56, w: 600, col: C.ink, track: -1, a });
  // the life counter, top right
  const [val, verdict] = counter(t), vt = VERDICT_T[name] ?? 1e9, pop = verdict ? popS(t - vt, 15, .45) : 1;
  text('СЧЁТЧИК ЖИЗНИ', 1000, 190 + dy, { size: 22, w: 500, col: C.mute, track: 3, align: 'right', a });
  if (val === '∞') infinity(930, 236, pop, C.sig, a);
  else { g.save(); g.translate(1000, 258); g.scale(pop, pop); g.translate(-1000, -258); text(val, 1000, 258 + dy, { size: verdict ? 72 : 60, w: 600, col: C.sig, track: -1, align: 'right', a }); g.restore();
    if (!verdict && TXT.length) TXT[TXT.length - 1].pass = true; }
}
let SUBS = [];
function subtitles(t) {
  const s = SUBS.find(q => t >= q.t0 && t < q.t1); if (!s) return;
  const a = ss(seg(t, s.t0, s.t0 + .2)) * (1 - ss(seg(t, s.t1 - .15, s.t1)));
  g.save(); g.font = '500 44px Jost'; const words = s.text.split(' '), lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > 820 && cur) { lines.push(cur); cur = w; } else cur = n; } lines.push(cur); g.restore();
  const y0 = 1500 - (lines.length - 1) * 56;
  g.save(); g.globalAlpha = a; g.fillStyle = C.sig; g.fillRect(80, y0 - 40, 5, lines.length * 56 - 8); g.restore();
  lines.forEach((l, i) => text(l, 104, y0 + i * 56, { size: 44, w: 500, col: C.ink, a }));
}

// ---------------- frame: scene, type, the ring dive ----------------
function render(t) {
  TXT = [];
  g.setTransform(1, 0, 0, 1, 0, 0); paper();
  const sc = sceneAt(t), name = sc[0], out = drawScene(name, t);
  hud(name, t, sc[1]);
  subtitles(t);
  for (const b of DIVES) {
    if (t >= b - .3 && t < b) { const prev = SC.find(s => s[2] === b)[0], w = wristAt(prev, b - .3), u = EASE.io(seg(t, b - .3, b)), r = lerp(14, 2300, u * u);
      g.save(); g.beginPath(); g.arc(w[0], w[1], r, 0, 7); g.fillStyle = C.paper; g.fill(); g.strokeStyle = C.sig; g.lineWidth = lerp(6, 30, u); g.stroke(); g.restore(); }
    if (t >= b && t < b + .32) { const u = EASE.o(seg(t, b, b + .32)), w = out.wr, r = lerp(0, 2300, u);
      g.save(); g.beginPath(); g.rect(0, 0, W, H); g.arc(w[0], w[1], Math.max(1, r), 0, 7, true); g.fillStyle = C.paper; g.fill('evenodd');
      g.beginPath(); g.arc(w[0], w[1], Math.max(1, r), 0, 7); g.strokeStyle = C.sig; g.lineWidth = lerp(30, 4, u); g.stroke(); g.restore(); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
const WR = {};
const POS = { hook: [YX, GY, YS], taster: [200, GY, YS], sweep: [540, 820, 430], diver: [YX, GY, YS], beam: [380, GY + .30 * YS, YS], office: [540, GY, YS] };
function wristAt(name, t) {
  const key = name + t; if (WR[key]) return WR[key];
  const c = camAt(t), [x, gy, S] = POS[name], j = joints({ x, gy, S }, youAt(t)), [E, Hn] = j.aL;
  return (WR[key] = toScreen(c, [lerp(E[0], Hn[0], .78), lerp(E[1], Hn[1], .78)]));
}

// ---------------- boot ----------------
async function boot() {
  await document.fonts.load('600 64px Jost', 'АБВабв0123'); await document.fonts.load('500 44px Jost', 'АБВабв'); await document.fonts.ready;
  const lines = (await (await fetch('lines.json')).json()).lines, tim = await (await fetch('voice/timing.json')).json();
  const raw = [];
  for (const l of lines) { const v = tim.lines[l.id]; if (!v) continue; const words = l.text.split(/\s+/); let wi = 0, cur = [], t0 = null;
    for (const w of words) { cur.push(w); if (/[\wА-яЁё]/.test(w)) { const wt = v.words[Math.min(wi, v.words.length - 1)]; if (t0 === null) t0 = wt[0]; wi++;
        if (/[.?!…:]$/.test(w)) { raw.push({ t0, t1: v.words[Math.min(wi - 1, v.words.length - 1)][1], text: cur.join(' ') }); cur = []; t0 = null; } } }
    if (cur.length && t0 !== null) raw.push({ t0, t1: v.t1, text: cur.join(' ') }); }
  raw.sort((a, b) => a.t0 - b.t0);
  const need = s => s.length / 15 + 1.5, G = [];
  for (let i = 0; i < raw.length;) { const grp = { t0: raw[i].t0, text: raw[i].text, end: raw[i].t1 }; i++;
    while (i < raw.length) { const nx = raw[i].t0; if (sceneAt(nx)[0] !== sceneAt(grp.t0)[0] || nx - grp.t0 >= need(grp.text) + .9 || (grp.text + ' ' + raw[i].text).length > 84) break; grp.text += ' ' + raw[i].text; grp.end = raw[i].t1; i++; }
    G.push(grp); }
  SUBS = G.map((q, i) => ({ t0: q.t0, text: q.text, t1: Math.min(G[i + 1] ? G[i + 1].t0 : DUR, Math.max(q.end + .6, q.t0 + need(q.text) + .5)) }));
  SIMY = simulate(1, youTarget, -1, DUR + .1);
  window.DUR = DUR; window.EV = []; window.render = render;
  window.TEXTS = t => { render(t); return TXT; };
  render(+(new URLSearchParams(location.search).get('t') || 0));
  window.READY = true;
}
boot();
