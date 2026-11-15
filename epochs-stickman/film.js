// «Сколько ты проживёшь в каждой эпохе?» — the film: one figure ("you", accent head) on one ground line that bends into
// every epoch; the bracelet ring is the door between epochs; the ending is a chain of people from all of history.
// Accent = your life: your head, your blood, your survival time, and the run along the chain that reaches you.
const DUR = 66, GY = 1180, YS = 560, YX = 540;
// scene boundaries (from the word timings in voice/timing.json)
const SC = [['ice', 0, 7.7], ['egypt', 7.7, 12.95], ['rome', 12.95, 18.95], ['rules', 18.95, 26.6], ['plague', 26.6, 33.95],
  ['ship', 33.95, 40.25], ['london', 40.25, 45.6], ['verdun', 45.6, 50.75], ['now', 50.75, DUR]];
const DIVES = [7.7, 12.95, 26.6, 33.95, 40.25, 45.6, 50.75];
const sceneAt = t => SC.find(s => t >= s[1] && t < s[2]) || SC[SC.length - 1];
const LABEL = { ice: 'ЛЕДНИКОВЫЙ ПЕРИОД · 20 000 ЛЕТ НАЗАД', egypt: 'ДРЕВНИЙ ЕГИПЕТ · СТРОЙКА ПИРАМИДЫ', rome: 'ДРЕВНИЙ РИМ · АРЕНА',
  rules: 'ПРАВИЛА', plague: 'ЕВРОПА · 1348 · ЧЁРНАЯ СМЕРТЬ', ship: 'КОРАБЛЬ МАГЕЛЛАНА · 1520', london: 'ЛОНДОН · 1858',
  verdun: 'ВЕРДЕН · 1916', now: '2026' };
const FACT = { ice: ['Саблезубый смилодон вымер', 'всего ≈10 000 лет назад'], egypt: ['В мумиях нашли яйца', 'паразитов из Нила'],
  rome: ['Гладиаторы пили напиток', 'из пепла растений — для костей'], plague: ['Маски-клювы чумных докторов', 'появятся только через 270 лет'],
  ship: ['Крысу продавали за полдуката.', 'Из 270 моряков вернулись 18'], london: ['Младенцев успокаивали', 'сиропом с морфием'],
  verdun: ['Часть земли под Верденом', 'закрыта до сих пор'] };
const VERDICT = { ice: [5.6, '3 ДНЯ'], egypt: [10.9, '2 НЕДЕЛИ'], rome: [16.9, '4 ДНЯ'], plague: [30.9, '6 ДНЕЙ'],
  ship: [37.9, '1 МЕСЯЦ', 'РЕКОРД'], london: [43.5, '3 НЕДЕЛИ'], verdun: [48.7, '4 ЧАСА'], now: [56.6, 'ВСЮ ЖИЗНЬ'] };
const EASE = { o: u => 1 - Math.pow(1 - clamp(u), 3), io: u => ss(u) };
const pulse = (t, a, d = .25) => t < a ? 0 : Math.exp(-(t - a) / d);

// ---------------- the pose of "you", scene by scene (targets; springs add the follow-through) ----------------
function youTarget(_, t) {
  const p = rest(), ph = .7;
  p.hx += .004 * Math.sin(t * 1.25 + ph); p.lean += .01 * Math.sin(t * 1.05); p.hy += .003 * (.5 + .5 * Math.sin(t * 2.1));
  const s = sceneAt(t)[0], set = o => Object.assign(p, o);
  if (s === 'ice') {
    set({ bend: .05, la: -.32, lb: .55, ra: .32, rb: -.55 });
    p.hx += .006 * Math.sin(t * 57); p.hy += .004 * Math.sin(t * 43) + .015; p.la += .04 * Math.sin(t * 51); p.ra -= .04 * Math.sin(t * 49);
    if (t > 2.9 && t < 4.6) set({ ra: 1.15, rb: 1.35, head: .12, lean: .04 });            // looks at the finger
    if (t > 5.4) set({ lean: -.13, head: -.2, la: -2.1, lb: -.9, ra: 2.1, rb: .9 });       // the fangs: arms up
  } else if (s === 'egypt') {
    const w = Math.sin(t * 6.2);
    set({ lean: -.3, bend: -.03, la: -1.38, lb: -.12, ra: -1.0, rb: -.35, lfx: .05 * w, rfx: -.05 * w, lfy: .03 * Math.max(0, w), rfy: .03 * Math.max(0, -w) });
    if (t > 10.55 && t < 11.75) set({ lean: .02, ra: 2.45, rb: 1.15, la: -.4, lb: .3, head: -.18, lfx: 0, rfx: 0, lfy: 0, rfy: 0 });
    if (t >= 11.75) set({ lean: .06, bend: .1, head: .3, la: -.25, lb: .5, ra: .9, rb: 1.3, lfx: 0, rfx: 0, lfy: 0, rfy: 0 });
  } else if (s === 'rome') {
    if (t < 15.2) { const a = Math.sin(t * 9), b = Math.sin(t * 9 + 1.6);
      set({ la: -1.9 + .6 * a, lb: -.6 + .4 * b, ra: 1.9 + .6 * b, rb: .6 - .4 * a, lean: .05 * a, head: .08 * b }); }
    else set({ hy: .19, lfx: -.13, rfx: .13, la: -1.55, lb: -.5, ra: 1.55, rb: .5, bend: .06, head: .15 });
    if (t > 16.7) { p.lean -= .08; p.head -= .25; }
  } else if (s === 'rules') {
    const k = Math.floor((t - 23.15) / .32);
    if (t < 20.3) set({ hy: .19, lfx: -.13, rfx: .13, la: -1.55, lb: -.5, ra: 1.55, rb: .5, bend: .06, head: -.1 });
    else if (t < 23.1) set({ la: -.8, lb: 1.5, ra: .45, rb: -.2, head: -.18 });            // looks at the bracelet
    else { const u = ((t - 23.15) / .32) % 1, hop = k >= 0 && k < 7 ? Math.sin(Math.PI * u) : 0;
      set({ la: -2.2, lb: -.5, ra: 2.2, rb: .5, lfy: .07 * hop, rfy: .07 * hop, hy: -.06 * hop }); }
  } else if (s === 'plague') {
    set({ head: .1 });
    if (t > 27.6 && t < 29.1) set({ ra: 2.4, rb: 1.2, head: -.25, lean: -.08 });          // covers the nose
    if (t >= 29.1 && t < 30.4) { const w = Math.sin(t * 38); set({ la: -2.65, lb: -1.0 + .45 * w, ra: 2.3, rb: 1.2 + .3 * w, hx: .006 * w }); }
    if (t >= 30.4 && t < 30.85) set({ la: -.4, ra: .4, head: -.25 });
    if (t >= 30.85) set({ hy: .2, lfx: -.12, rfx: .12, lean: .12, head: .35, la: -.2, lb: .1, ra: .15, rb: -.1, bend: .08 });
  } else if (s === 'ship') {
    const d = .07 * Math.sin(t * 1.6);
    set({ lean: -d * .8, la: -1.3 + .2 * Math.sin(t * 2.4), lb: -.2, ra: 1.3 + .2 * Math.sin(t * 2.4 + 1), rb: .2 });
    if (t > 35.8 && t < 36.9) p.head = .22 * Math.sin(t * 24);
    if (t > 37.1 && t < 38.3) set({ ra: .85, rb: 1.45, head: .15 });
    if (t > 38.4) set({ lean: .22, ra: .7, rb: .2, la: -.9, hy: .05, head: .1 });
  } else if (s === 'london') {
    set({ head: -.05 });
    const c = Math.max(pulse(t, 40.9, .18), pulse(t, 41.3, .18), pulse(t, 41.7, .18), pulse(t, 42.05, .18));
    if (t > 40.7 && t < 42.3) set({ ra: 2.3, rb: 1.35, bend: .04 + .12 * c, head: .1 + .25 * c, hy: .03 * c, la: -.35 });
    if (t > 42.3 && t < 43.6) set({ head: -.3, lean: -.06 });
    if (t >= 43.6) set({ head: -.12, la: -.25, ra: .25, lb: .2, rb: -.2 });
  } else if (s === 'verdun') {
    set({ hy: .06, la: -.6, ra: .6 });
    if (t > 47.5) set({ hy: .12, la: -2.7, lb: -1.4, ra: 2.7, rb: 1.4, bend: .05 });
    if (t > 48.4) set({ ra: 2.4, rb: 1.25, la: -.7, lb: .3, lean: .14, hy: .1 });
    if (t > 49.8) set({ hy: .22, lfx: -.13, rfx: .13, lean: .2, head: .35, ra: .3, rb: -.1, la: -.3 });
  } else {
    if (t < 52.7) set({ hy: .06, la: -1.6, lb: -1.2, ra: 1.6, rb: 1.2, head: .3 * Math.sin(t * 2.3) });
    else if (t < 54.1) set({ head: .15 });
    else if (t < 54.8) set({ ra: 1.35, rb: .15 });
    else if (t < 56.0) set({ ra: 2.45, rb: 1.15, head: -.15 });
    else if (t < 57.0) set({ la: -.8, lb: 1.55, head: -.18 });
    else if (t < 58.55) set({});
    else set({ la: -1.36, lb: .02, ra: 1.36, rb: -.02, head: 0 });
    if (t > 62.0) set({ la: -1.36, lb: .02, ra: 1.36, rb: -.02, head: 0, hy: -.01 });
  }
  return p;
}
let SIMY = null;
const youAt = t => (t >= 18.95 && t < 20.3 ? SIMY.at(18.95) : SIMY.at(t))[0];

// ---------------- helpers ----------------
function ln(pts, col = C.mute, w = 4) { g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); g.restore(); }
function circ(x, y, r, col = C.mute, w = 4, fill) { g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.restore(); }
function smoothPath(P, col, w) { g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); spline(P, .9); g.stroke(); g.restore(); }
function you(t, o = {}) {
  const p = youAt(t), f = { x: o.x ?? YX, gy: GY, S: YS, col: o.col || C.ink, fill: C.sig, noL: o.noL, noR: o.noR };
  const j = figure(f, p);
  g.save(); g.beginPath(); g.arc(j.Hd[0], j.Hd[1], GEO.headR * YS, 0, 7); g.fillStyle = C.sig; g.fill(); g.restore();
  // the bracelet: a small ring on the left forearm, accent while it works
  const [E, Hn] = j.aL, bx = lerp(E[0], Hn[0], .78), by = lerp(E[1], Hn[1], .78);
  if (!o.noL) circ(bx, by, 15, t < 56.4 ? C.sig : mix(C.sig, C.mute, seg(t, 56.0, 56.6)), 6, C.paper);
  j.wrist = [bx, by];
  return j;
}
function other(x, S, p, col = C.ink, o = {}) { return figure({ x, gy: o.gy ?? GY, S, col, fill: C.paper, noL: o.noL, noR: o.noR, lws: o.lws }, p); }
function wavePose(t, ph, extra = {}) { const p = rest(); p.hx += .005 * Math.sin(t * 1.25 + ph); p.lean += .012 * Math.sin(t * 1.05 + ph * 1.3); p.hy += .004 * (.5 + .5 * Math.sin(t * 2.1 + ph)); return Object.assign(p, extra); }

// ---------------- the epochs (world = screen at zoom 1) ----------------
function snow(t, n = 80, seed = 3) { const r = mulberry(seed); g.save(); g.strokeStyle = C.mute; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x0 = r() * 1400 - 200, y0 = r() * 1400, sp = 300 + r() * 300, y = (y0 + t * sp) % 1400 - 200, x = x0 - (t * sp * .5) % 1400; const xx = ((x % 1400) + 1400) % 1400 - 160;
    g.beginPath(); g.moveTo(xx, y); g.lineTo(xx - 10, y + 16); g.stroke(); } g.restore(); }
function drawIce(t) {
  smoothPath([[-60, GY + 10], [200, GY - 30], [420, GY], [540, GY], [700, GY - 10], [900, GY - 45], [1140, GY + 5]], C.tint, LW);
  smoothPath([[-60, 1060], [150, 1020], [380, 1070], [600, 1040], [820, 1000], [1140, 1050]], C.tint, 4);
  const fx = 900, fy = 880, a = EASE.o(seg(t, 4.6, 6.4));                           // two fangs out of the blizzard
  if (a > 0) for (const dx of [-60, 60]) { g.save(); g.globalAlpha = a; g.translate(fx + dx + (1 - a) * 120, fy - 40 + (1 - a) * 20);
    g.beginPath(); g.moveTo(-26, -150); g.quadraticCurveTo(-30, 30, dx > 0 ? -8 : 8, 120); g.quadraticCurveTo(20, 20, 26, -150); g.closePath();
    g.fillStyle = C.paper; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke(); g.restore(); }
  snow(t);
}
function drawEgypt(t) {
  ln([[420, GY], [1000, 600], [1580, GY]], C.mute, 4);                               // the pyramid's face behind
  for (let k = 1; k < 6; k++) ln([[420 + k * 58, GY - k * 58 * (580 / 580)], [1580 - k * 58, GY - k * 58]], C.tint, 3);
  circ(220, 720, 62, C.mute, 4);
  for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 + t * .2; ln([[220 + Math.cos(a) * 82, 720 + Math.sin(a) * 82], [220 + Math.cos(a) * 112, 720 + Math.sin(a) * 112]], C.mute, 4); }
  ln([[-60, GY], [1140, GY]], C.tint, LW);
  const bx = 175 + Math.sin(t * 6.2) * 4;                                             // the block and the rope
  g.save(); g.strokeStyle = C.ink; g.lineWidth = 6; g.lineJoin = 'round'; g.fillStyle = C.paper; g.fillRect(bx - 90, GY - 170, 170, 170); g.strokeRect(bx - 90, GY - 170, 170, 170); g.restore();
  return bx;
}
function worms(t, x, y) { if (t < 11.7 || t > 12.95) return; for (let k = 0; k < 3; k++) { const P = []; for (let i = 0; i < 6; i++) P.push([x + k * 30 - 30 + Math.sin(t * 14 + i + k) * 6, y - 60 - i * 9 - k * 6]); smoothPath(P, C.ink, 4); } }
function drawRome(t) {
  g.save(); g.strokeStyle = C.tint; g.lineWidth = LW; g.beginPath(); g.ellipse(540, GY + 40, 760, 120, 0, Math.PI, 2 * Math.PI); g.stroke(); g.restore();
  g.save(); g.strokeStyle = C.mute; g.lineWidth = 4; g.beginPath(); g.ellipse(540, 900, 820, 150, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.restore();
  for (let k = 0; k < 26; k++) { const a = Math.PI * 1.07 + k * Math.PI * .86 / 25, x = 540 + Math.cos(a) * 820, y = 900 + Math.sin(a) * 150 - 26;
    circ(x, y + Math.sin(t * 7 + k) * 3, 15, C.mute, 3, C.paper); }
}
function shield(t, J) {
  const land = 15.45, top = J.Hd[1] - GEO.headR * YS - 150, y = t < 15.18 ? -500 : lerp(-300, top, EASE.o(seg(t, 15.18, land))) + (t > land ? 18 * Math.exp(-(t - land) * 9) * Math.cos((t - land) * 30) : 0);
  if (t < 15.18) return;
  g.save(); g.translate(J.Hd[0], y); g.rotate(1.45); g.fillStyle = C.paper; g.strokeStyle = C.ink; g.lineWidth = 7; g.lineJoin = 'round';
  g.beginPath(); g.roundRect(-150, -190, 300, 380, 30); g.fill(); g.stroke(); circ(0, 0, 40, C.ink, 6, C.paper); g.restore();
}
function drawRules(t) {
  const xs = [...Array(8)].map((_, k) => -560 + k * 300), yrs = ['−20000', '−2500', '80', '1348', '1520', '1858', '1916', '2026'];
  ln([[-760, GY], [1840, GY]], C.tint, LW * 1.6);
  xs.forEach((x, k) => { const on = t > 23.15 + k * .32; circ(x, GY, 22, on ? C.sig : C.tint, 6, on ? C.sig : C.paper);
    text(yrs[k], x, GY + 110, { size: 62, w: 500, col: C.mute, align: 'center' }); });
  return xs;
}
function drawPlague(t) {
  for (const [x0, x1, top] of [[-20, 250, 640], [830, 1100, 600]]) {
    ln([[x0, GY], [x0, top + 120], [(x0 + x1) / 2, top], [x1, top + 120], [x1, GY]], C.mute, 4);
    for (let wy = top + 190; wy < GY - 120; wy += 150) for (const wx of [x0 + 60, x1 - 100]) { g.save(); g.strokeStyle = C.tint; g.lineWidth = 4; g.strokeRect(wx, wy, 40, 60); g.restore(); }
  }
  smoothPath([[-60, GY], [380, GY], [540, GY + 28], [700, GY], [1140, GY]], C.tint, LW);
  for (let k = 0; k < 5; k++) { const x = 360 + k * 90, ph = (t * .6 + k * .27) % 1, P = [];
    for (let i = 0; i < 6; i++) P.push([x + Math.sin(i * 1.4 + t * 3 + k) * 14, GY + 10 - ph * 160 - i * 26]);
    g.save(); g.globalAlpha = 1 - ph; smoothPath(P, C.mute, 4); g.restore(); }
}
function flea(t, j) {
  if (t < 29.7 || t > 30.9) return;
  const a = [940, GY - 6], b = [j.N[0] + 18, j.N[1] + 10], u = seg(t, 29.7, 30.13), hops = 3;
  const k = Math.min(hops - 1, Math.floor(u * hops)), v = u * hops - k;
  const P0 = [lerp(a[0], b[0], k / hops), lerp(a[1], b[1], k / hops)], P1 = [lerp(a[0], b[0], (k + 1) / hops), lerp(a[1], b[1], (k + 1) / hops)];
  const x = lerp(P0[0], P1[0], v), y = lerp(P0[1], P1[1], v) - Math.sin(Math.PI * v) * 120 * (u < 1 ? 1 : 0);
  circ(x, y, 7, C.ink, 3, C.ink);
}
function drawShip(t) {
  ln([[-60, GY + 120], [1140, GY + 120]], C.paper, 1);
  const P = []; for (let x = -60; x <= 1140; x += 40) P.push([x, GY + 120 + Math.sin(x / 70 + t * 2.2) * 14]); smoothPath(P, C.tint, 5);
  const d = .07 * Math.sin(t * 1.6);
  g.save(); g.translate(540, GY); g.rotate(d); g.translate(-540, -GY);
  ln([[-80, GY], [1160, GY]], C.tint, LW * 1.3); ln([[-40, GY + 60], [1120, GY + 60]], C.tint, 4);
  ln([[880, GY], [880, 560]], C.mute, 5); ln([[880, 600], [1040, 1060], [880, 1060]], C.mute, 4);
  return d;
}
function rat(t, d) { if (t < 38.4) return; const u = seg(t, 38.4, 39.6), x = lerp(260, 1150, EASE.io(u)), y = GY - 18;
  g.save(); g.fillStyle = C.ink; g.beginPath(); g.ellipse(x, y, 30, 15, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + 30, y - 6, 9, 0, 7); g.fill();
  g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 28, y); g.quadraticCurveTo(x - 70, y - 30 + Math.sin(t * 20) * 8, x - 100, y - 4); g.stroke(); g.restore(); }
function drawLondon(t) {
  if (t > 42.26) { const a = seg(t, 42.26, 42.8); g.save(); g.globalAlpha = a; for (let x = 20; x < 1080; x += 60) { ln([[x, 640], [x, GY - 10]], C.tint, 3); for (let y = 690; y < GY - 30; y += 110) circ(x + 30, y, 10, C.tint, 3); } g.restore(); }
  for (const [x, w, h] of [[60, 110, 520], [830, 90, 640], [960, 80, 430]]) { g.save(); g.strokeStyle = C.mute; g.lineWidth = 5; g.fillStyle = C.paper; g.fillRect(x, GY - h, w, h); g.strokeRect(x, GY - h, w, h); g.restore();
    for (let k = 0; k < 5; k++) { const ph = (t * .35 + k * .2) % 1; circ(x + w / 2 + ph * 70 + Math.sin(t + k) * 10, GY - h - 30 - ph * 300, 22 + ph * 50, C.mute, 4, C.paper); } }
  ln([[-60, GY], [1140, GY]], C.tint, LW);
  const fog = seg(t, 43.66, 45.4); if (fog > 0) { const r = mulberry(8); g.save(); g.globalAlpha = .9 * fog; for (let k = 0; k < 26; k++) circ(r() * 1080, 620 + r() * 560 + Math.sin(t + k) * 12, 40 + r() * 60, C.tint, 4); g.restore(); }
}
function drawVerdun(t) {
  ln([[-60, 1070], [230, 1070], [300, GY], [800, GY], [860, 1060], [1140, 1060]], C.tint, LW);
  for (let x = -40; x < 260; x += 70) circ(x, 1045, 28, C.mute, 4, C.paper);
  for (let x = 880; x < 1140; x += 70) circ(x, 1035, 28, C.mute, 4, C.paper);
  for (const [tb, x, y] of [[47.6, 210, 920], [47.95, 900, 880], [48.25, 720, 760], [49.1, 120, 800]]) {
    const u = seg(t, tb - .45, tb); if (t > tb - .45 && t < tb) ln([[x - 400 * (1 - u), y - 600 * (1 - u)], [x - 380 * (1 - u) + 20, y - 570 * (1 - u) + 30]], C.ink, 5);
    const e = seg(t, tb, tb + .5); if (e > 0 && e < 1) for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; ln([[x + Math.cos(a) * 30 * e, y + Math.sin(a) * 30 * e], [x + Math.cos(a) * (60 + 110 * e), y + Math.sin(a) * (60 + 110 * e)]], C.mute, 5 * (1 - e) + 1); }
  }
  const gx = lerp(-500, 760, seg(t, 48.38, 50.6)); if (t > 48.38) { const r = mulberry(5); for (let k = 0; k < 18; k++) circ(gx + r() * 520 - 260 + Math.sin(t * 2 + k) * 14, 860 + r() * 320, 50 + r() * 50, C.mute, 4, C.tint); }
}
function drawNow(t) {
  ln([[-60, GY], [1140, GY]], C.tint, LW); ln([[-60, GY + 40], [1140, GY + 40]], C.tint, 3);
  const a = 1 - seg(t, 56.5, 58.0);
  g.save(); g.globalAlpha = a;
  ln([[150, GY], [150, 640], [230, 600], [270, 620]], C.mute, 5);
  if (t > 53.0) { const x = lerp(1300, 780, EASE.o(seg(t, 53.0, 53.6))); g.save(); g.strokeStyle = C.mute; g.lineWidth = 5; g.fillStyle = C.paper; g.lineJoin = 'round';
    g.beginPath(); g.roundRect(x, GY - 300, 420, 250, 24); g.fill(); g.stroke(); circ(x + 90, GY - 40, 38, C.mute, 5, C.paper); circ(x + 330, GY - 40, 38, C.mute, 5, C.paper);
    ln([[x + 210, GY - 230], [x + 210, GY - 130]], C.ink, 10); ln([[x + 160, GY - 180], [x + 260, GY - 180]], C.ink, 10); g.restore(); }
  g.restore();
}
function glass(x, y) { g.save(); g.fillStyle = C.paper; g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 20, y - 55); g.lineTo(x + 20, y - 55); g.lineTo(x + 15, y); g.lineTo(x - 15, y); g.closePath(); g.fill(); g.stroke(); g.restore(); }

// ---------------- the chain of people (the ending) ----------------
const CHAIN = [-4, -3, -2, -1, 1, 2, 3, 4].map(k => ({ k, x: YX + k * 360, pop: 57.45 + (4 - Math.abs(k)) * .0 + Math.abs(k) * .12 }));
function link(A, B, col, w, sag) { const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + sag]; const Q = [2 * m[0] - (A[0] + B[0]) / 2, 2 * m[1] - (A[1] + B[1]) / 2];
  g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(A[0], A[1]); g.quadraticCurveTo(Q[0], Q[1], B[0], B[1]); g.stroke(); g.restore(); }
function rows(t) {                                                                    // rows of people behind: the billions
  const R = [[GY - 420, 330, 260, C.mute, 60.45], [GY - 700, 230, 185, C.tint, 60.85], [GY - 900, 160, 130, C.tint, 61.2]];
  for (const [gy, S, sp, col, t0] of R) {
    const n = Math.ceil(3400 / sp), a = popS(t - t0, 15, .5); if (t < t0) continue;
    const P = []; for (let i = 0; i < n; i++) { const x = YX - 1700 + i * sp + (gy % 2 ? 0 : sp / 2), dir = Math.sign(YX - x), turn = ss(seg(t, 61.9 + Math.abs(x - YX) / 6000, 62.5 + Math.abs(x - YX) / 6000));
      const p = wavePose(t, i * 1.7 + gy, { la: -1.36, lb: .02, ra: 1.36, rb: -.02, head: dir * .25 * turn, lean: dir * .06 * turn });
      const j = other(x, S * a, p, col, { gy, noL: true, noR: true, lws: .9 }); P.push(j); }
    for (let i = 0; i < P.length - 1; i++) link(P[i].Sh, P[i + 1].Sh, col, Math.max(3, 8 * Math.sqrt(S / 380)) * .9, S * a * .17);
  }
}
function chain(t, J) {
  const js = [];
  for (const c of CHAIN) { const a = popS(t - c.pop, 16, .45); if (t < c.pop) continue;
    const dir = Math.sign(-c.k), clasp = t > 58.6 + (4 - Math.abs(c.k)) * .12, turn = ss(seg(t, 61.9 + Math.abs(c.k) * .06, 62.4 + Math.abs(c.k) * .06));
    const p = wavePose(t, c.k * 1.9, clasp ? { la: -1.36, lb: .02, ra: 1.36, rb: -.02 } : {});
    p.head += dir * .28 * turn; p.lean += dir * .07 * turn;
    js.push({ c, j: other(c.x, YS * a, p, C.ink, { noL: clasp, noR: clasp }), clasp }); }
  // links, from the outside in; the accent run comes along them to you
  const all = [...js.filter(o => o.c.k < 0), { c: { k: 0 }, j: J, clasp: t > 58.55 }, ...js.filter(o => o.c.k > 0)];
  for (let i = 0; i < all.length - 1; i++) { const A = all[i], B = all[i + 1]; if (!A.clasp || !B.clasp) continue;
    const kk = Math.max(Math.abs(A.c.k), Math.abs(B.c.k)), tc = 58.6 + (4 - kk) * .12 + .12; if (t < tc) continue;
    const sag = YS * .17 * (1 + .25 * Math.exp(-(t - tc) * 8) * Math.cos((t - tc) * 30));
    link(A.j.Sh, B.j.Sh, C.ink, 8, sag);
    const tr = 59.55 + (4 - kk) * .16, u = ss(seg(t, tr, tr + .2));
    if (u > 0) { const out = A.c.k < 0 ? [A.j.Sh, B.j.Sh] : [B.j.Sh, A.j.Sh]; const m = [(out[0][0] + out[1][0]) / 2, (out[0][1] + out[1][1]) / 2 + sag];
      const Q = [2 * m[0] - (out[0][0] + out[1][0]) / 2, 2 * m[1] - (out[0][1] + out[1][1]) / 2], N = 24;
      g.save(); g.strokeStyle = C.sig; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath();
      for (let s = 0; s <= N * u; s++) { const q = qpt(out[0], Q, out[1], s / N); s ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); g.restore(); }
  }
}

// ---------------- camera ----------------
function camAt(t) {
  let z = 1, cx = 540, cy = 960, sx = 0, sy = 0;
  const shake = (t0, a, d = .35) => { if (t >= t0 && t < t0 + d) { const k = 1 - (t - t0) / d; sx += a * k * k * Math.sin(t * 91 + t0); sy += a * k * k * Math.cos(t * 77 + t0); } };
  const s = sceneAt(t)[0];
  if (s === 'ice') { const u = EASE.io(seg(t, 2.9, 3.7)) * (1 - EASE.io(seg(t, 4.4, 5.2))); z = lerp(1, 1.55, u); cx = lerp(540, 640, u); cy = lerp(960, 860, u); }
  if (s === 'egypt') cx = lerp(540, 590, seg(t, 7.7, 12.95));
  if (s === 'rome') { shake(15.45, 22); shake(16.7, 8); }
  if (s === 'rules') { const u = EASE.io(seg(t, 22.95, 23.6)); z = lerp(1, .42, u); cx = lerp(540, 490, u); cy = lerp(960, 1080, u); }
  if (s === 'plague') { z = lerp(1, 1.08, seg(t, 27, 31)); cy = lerp(960, 1000, seg(t, 27, 31)); }
  if (s === 'verdun') { shake(47.6, 20); shake(47.95, 16); shake(48.25, 22); shake(49.1, 12); }
  if (s === 'now') { const u = EASE.io(seg(t, 58.4, 61.8)); z = lerp(1, .36, u); cy = lerp(960, 760, u); }
  return { z, cx, cy, sx, sy };
}
function applyCam(c) { g.setTransform(c.z, 0, 0, c.z, W / 2 - c.cx * c.z + c.sx, H / 2 - c.cy * c.z + c.sy); }
const toScreen = (c, p) => [W / 2 + (p[0] - c.cx) * c.z + c.sx, H / 2 + (p[1] - c.cy) * c.z + c.sy];

// ---------------- one scene in world space; returns the wrist (screen) for the ring dives ----------------
function drawScene(name, t) {
  const c = camAt(t); applyCam(c); let J, wr;
  if (name === 'ice') { drawIce(t); J = you(t);
    const tip = J.aR[1], beat = .5 + .5 * Math.sin(t * 9); circ(tip[0] + 8, tip[1] + 4, 9 + 4 * beat, C.sig, 3, C.sig); }
  else if (name === 'egypt') { const bx = drawEgypt(t); J = you(t); if (t < 10.55) ln([[bx + 80, GY - 100], [J.aL[1][0], J.aL[1][1]], [J.aR[1][0], J.aR[1][1]]], C.ink, 4); worms(t, J.Hd[0], J.Hd[1]); }
  else if (name === 'rome') { drawRome(t); if (t > 16.55) { const a = popS(t - 16.55, 15, .45), sw = Math.sin(t * 3);
      const j = other(880, 660 * a, wavePose(t, 2, { ra: 2.3 + .1 * sw, rb: .3, la: -.7, lb: .4, lean: -.06 })); ln([j.aR[1], [j.aR[1][0] + 30, j.aR[1][1] - 230 * a]], C.ink, 10); }
    J = you(t); shield(t, J); }
  else if (name === 'rules') { const xs = t >= 22.95 ? drawRules(t) : (ln([[-60, GY], [1140, GY]], C.tint, LW), null);
    let x = YX; if (xs && t > 23.15) { const k = clamp(Math.floor((t - 23.15) / .32), 0, 7), u = clamp(((t - 23.15) / .32) - k); x = k >= 7 ? xs[7] : lerp(xs[k], xs[k + 1], ss(u)); } else if (xs) x = xs[0] + (YX - xs[0]) * (1 - EASE.io(seg(t, 22.95, 23.15)));
    J = you(t, { x }); }
  else if (name === 'plague') { drawPlague(t); J = you(t); flea(t, J); }
  else if (name === 'ship') { const d = drawShip(t); J = you(t); rat(t, d); if (t > 37.15) { const [E, Hn] = J.aR; for (let k = 0; k < 3; k++) { const u = .25 + k * .25, a = seg(t, 37.15 + k * .15, 37.35 + k * .15); circ(lerp(E[0], Hn[0], u) + 10, lerp(E[1], Hn[1], u), 7 * a, C.sig, 2, C.sig); } } g.restore(); }
  else if (name === 'london') { drawLondon(t); J = you(t); }
  else if (name === 'verdun') { drawVerdun(t); J = you(t); }
  else { drawNow(t);
    if (t > 53.15 && t < 57.0) { const a = popS(t - 53.15, 15, .45) * (1 - seg(t, 56.5, 57.0)); const j = other(840, 540 * a, wavePose(t, 4, t > 54.0 && t < 55.0 ? { la: -1.35, lb: .1 } : {}));
      if (t > 54.0 && t < 54.85) circ(j.aL[1][0], j.aL[1][1], 8, C.ink, 3, C.paper); }
    if (t > 57.0) rows(t);
    J = you(t, { noL: t > 58.55, noR: t > 58.55 });
    if (t > 54.85 && t < 56.1) glass(J.aR[1][0], J.aR[1][1] + 8);
    if (t > 57.0) chain(t, J); }
  wr = toScreen(c, J.wrist || [540, 900]);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { wr, J, c };
}

// ---------------- screen-space type: label, survival time, fact, subtitles ----------------
function hud(name, t, s0) {
  const a = ss(seg(t, s0 + .15, s0 + .55)), dy = 16 * (1 - a);
  text(LABEL[name], 80, 190 + dy, { size: 27, w: 500, col: C.mute, track: 3, a });
  const v = VERDICT[name];
  if (v && t >= v[0]) { const b = ss(seg(t, v[0], v[0] + .4)), y = 350 + 22 * (1 - b);
    text('ТЫ ПРОДЕРЖАЛСЯ', 80, 250 + 10 * (1 - b), { size: 26, w: 500, col: C.mute, track: 3, a: b });
    text(v[1], 80, y, { size: 128, w: 600, col: C.sig, track: -2, a: b });
    if (v[2]) text(v[2], 80, 410 + 10 * (1 - ss(seg(t, v[0] + .3, v[0] + .7))), { size: 34, w: 600, col: C.ink, track: 3, a: ss(seg(t, v[0] + .3, v[0] + .7)) }); }
  const f = FACT[name];
  if (f) { const b = ss(seg(t, s0 + .6, s0 + 1.0)), y0 = v && t >= v[0] ? 500 : 290;
    f.forEach((l, i) => text(l, 80, y0 + i * 48 + 14 * (1 - b), { size: 40, w: 500, col: C.ink, a: b })); }
}
function rulesHud(t) {
  const a = ss(seg(t, 19.0, 19.3));
  if (t < 20.3) text('СТОП', 80, 360, { size: 150, w: 600, col: C.ink, track: -2, a });
  if (t >= 20.3 && t < 23.8) { const b = ss(seg(t, 20.3, 20.7)), c = ss(seg(t, 22.0, 22.4)); text('СЛОМАННЫЙ БРАСЛЕТ', 80, 250, { size: 30, w: 500, col: C.mute, track: 3, a: b });
    text('0,1 с', 80, 400 + 20 * (1 - c), { size: 150, w: 600, col: C.sig, track: -2, a: c }); text('до смерти', 80, 470 + 14 * (1 - c), { size: 44, w: 500, col: C.ink, a: c }); }
  if (t >= 23.8) { const items = [['ДЕНЕГ', 23.82], ['ОРУЖИЯ', 24.66], ['ИММУНИТЕТА', 25.67]];
    text('У ТЕБЯ НЕТ', 80, 250, { size: 30, w: 500, col: C.mute, track: 3, a: ss(seg(t, 23.8, 24.1)) });
    items.forEach(([s, t0], i) => { if (t < t0) return; const b = ss(seg(t, t0, t0 + .3)), y = 340 + i * 82; text(s, 80, y + 14 * (1 - b), { size: 64, w: 600, col: C.ink, a: b });
      g.save(); g.measureText; g.font = '600 64px Jost'; const w = g.measureText(s).width * ss(seg(t, t0 + .2, t0 + .45)); g.strokeStyle = C.ink; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(80, y - 22); g.lineTo(80 + w, y - 22); g.stroke(); g.restore(); }); }
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

// ---------------- the ring dive between epochs ----------------
function render(t) {
  TXT = [];
  g.setTransform(1, 0, 0, 1, 0, 0); paper();
  const sc = sceneAt(t), name = sc[0];
  let out = null;
  if (name === 'rules' && t < 20.3) {                                                  // «Стоп»: the arena freezes and greys
    drawScene('rome', 18.94); g.save(); g.globalAlpha = .62 * ss(seg(t, 18.95, 19.15)); g.fillStyle = C.paper; g.fillRect(0, 0, W, H); g.restore();
    const J = drawFrozenYou(); out = { wr: J };
  } else out = drawScene(name, t);
  if (name === 'rules') rulesHud(t); else if (!(name === 'now' && t > 62.4)) hud(name, t, sc[1]);
  if (t > 62.6) { const b = ss(seg(t, 62.6, 63.1)); text('Где ты сломался бы первым?', 80, 330 + 16 * (1 - b), { size: 56, w: 600, col: C.ink, a: b }); text('ПИШИ В КОММЕНТАРИЯХ', 80, 400 + 16 * (1 - b), { size: 28, w: 500, col: C.mute, track: 3, a: b }); }
  subtitles(t);
  // dive: the ring on the wrist opens over the whole frame, the next epoch opens out of the same ring
  for (const b of DIVES) {
    if (t >= b - .3 && t < b) { const prev = SC.find(s => s[2] === b)[0], w = drawSceneWrist(prev, b - .3), u = EASE.io(seg(t, b - .3, b)), r = lerp(14, 2300, u * u);
      g.save(); g.beginPath(); g.arc(w[0], w[1], r, 0, 7); g.fillStyle = C.paper; g.fill(); g.strokeStyle = C.sig; g.lineWidth = lerp(6, 30, u); g.stroke(); g.restore(); }
    if (t >= b && t < b + .32) { const u = EASE.o(seg(t, b, b + .32)), w = out.wr, r = lerp(0, 2300, u);
      g.save(); g.beginPath(); g.rect(0, 0, W, H); g.arc(w[0], w[1], Math.max(1, r), 0, 7, true); g.fillStyle = C.paper; g.fill('evenodd');
      g.beginPath(); g.arc(w[0], w[1], Math.max(1, r), 0, 7); g.strokeStyle = C.sig; g.lineWidth = lerp(30, 4, u); g.stroke(); g.restore(); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
const WRIST = {};
function drawSceneWrist(name, t) {   // the wrist position at the start of a dive, computed once without drawing
  const key = name + t; if (WRIST[key]) return WRIST[key];
  const c = camAt(t), p = youAt(t), j = joints({ x: YX, gy: GY, S: YS }, p), [E, Hn] = j.aL;
  return (WRIST[key] = toScreen(c, [lerp(E[0], Hn[0], .78), lerp(E[1], Hn[1], .78)]));
}
function drawFrozenYou() { return [540, 900]; }

// ---------------- boot ----------------
async function boot() {
  await document.fonts.load('600 64px Jost', 'АБВабв0123'); await document.fonts.load('500 44px Jost', 'АБВабв'); await document.fonts.ready;
  const lines = (await (await fetch('lines.json')).json()).lines, tim = await (await fetch('voice/timing.json')).json();
  for (const l of lines) { const v = tim.lines[l.id]; if (!v) continue; const words = l.text.replace(/\s+—\s+/g, ' — ').split(/\s+/); let wi = 0, cur = [], t0 = null;
    const spoken = words.filter(w => /[\wА-яЁё]/.test(w));
    for (const w of words) { cur.push(w); if (/[\wА-яЁё]/.test(w)) { const wt = v.words[Math.min(wi, v.words.length - 1)]; if (t0 === null) t0 = wt[0]; wi++;
        if (/[.?!]$/.test(w)) { SUBS.push({ t0, t1: v.words[Math.min(wi - 1, v.words.length - 1)][1], text: cur.join(' ') }); cur = []; t0 = null; } } }
    if (cur.length && t0 !== null) SUBS.push({ t0, t1: v.t1, text: cur.join(' ') }); }
  SUBS.sort((a, b) => a.t0 - b.t0);
  // group short sentences so every caption stays up long enough to read (letters / 15 + 1.5 s)
  const need = s => s.length / 15 + 1.5, G = [];
  for (let i = 0; i < SUBS.length;) { const grp = { t0: SUBS[i].t0, text: SUBS[i].text, end: SUBS[i].t1 }; i++;
    while (i < SUBS.length) { const nx = SUBS[i].t0; if (nx - grp.t0 >= need(grp.text) + .9 || (grp.text + ' ' + SUBS[i].text).length > 84) break;
      grp.text += ' ' + SUBS[i].text; grp.end = SUBS[i].t1; i++; }
    G.push(grp); }
  SUBS = G.map((q, i) => ({ t0: q.t0, text: q.text, t1: Math.min(G[i + 1] ? G[i + 1].t0 : DUR, Math.max(q.end + .6, q.t0 + need(q.text) + .5)) }));
  SIMY = simulate(1, youTarget, -1, DUR + .1);
  window.DUR = DUR; window.EV = []; window.render = render;
  window.TEXTS = t => { render(t); return TXT; };
  render(+(new URLSearchParams(location.search).get('t') || 0));
  window.READY = true;
}
boot();
