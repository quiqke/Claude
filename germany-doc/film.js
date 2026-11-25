// film.js — «Что если бы Германия выиграла войну» documentary, 1920×1080. One block per paragraph of the voice (l001…l044);
// every beat is keyed to a spoken word with wt(block, word). Real history is marked «КАК БЫЛО» (blue), the alternative «ЧТО ЕСЛИ» (red).
// The chapter «Цена» is a dark, quiet sheet: no jokes, no bouncy motion, no comic sounds.
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import { g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, reset } from './toon.js';
import { puppet } from './countries.js';
import { W, H, INK, I, PAL, C, q, wt, L0, L1, P, S, cam, shake, tint, defPatch, patchOn, patchCentre, setCrack, setGreyF, arrow, dline, ring, lab,
  fx, note, stampAt, peelAll, counter, xout, sheet, slam, year, mode, pop01, fadeIO, ev, finish, MISS, DUR } from './core.js';

// ——— patches (lon/lat, hand-cut) ———
defPatch('poland', [[14.2, 53.9], [16.5, 54.5], [19, 54.4], [22.8, 54.3], [23.5, 53.5], [23.6, 52.2], [23.2, 51.2], [24.1, 50.5], [22.6, 49.1], [19, 49.4], [16, 50.5], [14.8, 50.9], [14.6, 52.5]]);
defPatch('denmark', [[8.1, 55.5], [8.1, 57], [9.9, 57.6], [10.6, 57.7], [10.4, 56.4], [12.6, 56], [12.5, 55.3], [11.2, 54.9], [9.8, 54.8], [8.6, 54.9]]);
defPatch('norway', [[5, 59], [5, 62.3], [8, 63.5], [11, 64.8], [14, 67], [16, 68.8], [19, 69.9], [25, 71], [30, 70], [28, 69.5], [20, 68.6], [17, 67.5], [14, 65.5], [12.3, 63], [12.2, 60], [11.3, 59.1], [8, 58]]);
defPatch('benelux', [[2.5, 51.1], [3.4, 51.5], [4.2, 52.1], [4.7, 52.95], [5.6, 53.45], [7.1, 53.3], [7, 52.2], [6.1, 50.8], [6.3, 50.1], [5.8, 49.5], [4.8, 50], [2.9, 50.6]]);
defPatch('lux', [[5.7, 50.18], [6.15, 50.18], [6.55, 49.75], [6.35, 49.42], [5.82, 49.48]]);
defPatch('france', [[-4.6, 48.5], [-1.5, 43.4], [-.2, 43.6], [0, 46.6], [1.5, 46.8], [3, 46.6], [4.5, 46.3], [6, 46.4], [7.6, 47.6], [8.2, 49], [6.2, 49.4], [4.2, 50], [2.5, 51.1], [1.5, 50.9]]);
defPatch('vichy', [[-.2, 43.6], [0, 46.6], [1.5, 46.8], [3, 46.6], [4.5, 46.3], [6, 46.4], [7.5, 45.5], [7.3, 43.8], [4, 43.3], [3, 42.5], [0, 42.7]], C.vichy);
defPatch('balkans', [[13.6, 45.6], [16, 46.5], [19, 46.1], [21.5, 45.2], [22.7, 44.3], [23, 42.5], [26, 41.4], [24.5, 40.5], [23.9, 38], [22, 36.6], [21.1, 38.3], [19.4, 40.3], [19.4, 42], [16.5, 43.5], [15, 44.6]]);
defPatch('baltic', [[21, 56], [21.5, 57.7], [23.5, 59.5], [28, 59.5], [28.2, 56.2], [26.8, 55.2], [24, 53.9], [21, 55.3]]);
defPatch('belarus', [[23.5, 53.9], [26.8, 55.4], [28.2, 56.2], [31, 55.8], [32.7, 53.3], [31.5, 52], [30.5, 51.4], [23.6, 51.6]]);
defPatch('ukraine', [[23.6, 51.6], [30.5, 51.4], [34, 52.3], [38.2, 50], [40, 48.5], [38, 47], [35, 46.2], [33, 44.4], [30, 45.5], [28, 45.5], [26.5, 48.2], [22.5, 48.3]]);
defPatch('moscow', [[31, 55.8], [33, 57.5], [38, 57.8], [41, 56.5], [40.5, 54], [37, 53.3], [33, 54], [32.7, 53.3]]);
defPatch('volga', [[33, 54], [37, 53.3], [40.5, 54], [41, 56.5], [45, 57.5], [46, 55.2], [46.5, 52], [45, 49], [44, 47.5], [40, 47.2], [38.2, 50], [34, 52.3], [32.7, 53.3]]);
const ALL = ['poland', 'denmark', 'norway', 'benelux', 'lux', 'france', 'baltic', 'belarus', 'ukraine', 'moscow', 'volga', 'balkans', 'vichy'];

// ——— helpers ———
const act = (t0, t1, f) => fx(t0, t1, f, 1);          // above the map (puppets, icons on the map)
const ov = (t0, t1, f) => fx(t0, t1, f, 2);           // screen overlays above everything on the map
const icon = (name, x, y, s = 1, ...a) => { push(); translate(x, y); scale(s); I[name](...a); pop(); };
// a puppet standing on the map at lon/lat; o.f(t) returns per-frame overrides (mood, arms, look…)
const pup = (side, lon, lat, t0, t1, o = {}) => act(t0 - .01, t1 + .3, t => {
  const p = pop01(t, t0) * (1 - ei(seg(t, t1, t1 + .3))); if (p <= 0) return;
  const [x, y] = o.at ? o.at(t) : S(lon, lat), ex = o.f ? o.f(t) : {};
  puppet({ side, x, y, s: (o.s ?? .3) * p, face: o.face ?? 1, t: q(t), mood: 'deadpan', ...ex });
});
const walk = t => ({ legL: [Math.sin(q(t) * 14) * 26, -Math.max(0, Math.sin(q(t) * 14)) * 20], legR: [-Math.sin(q(t) * 14) * 26, -Math.max(0, -Math.sin(q(t) * 14)) * 20] });
const swingAt = (t, times) => { const s = times.find(x => t > x - .5 && t < x + .25); return s ? Math.sin(Math.PI * seg(t, s - .5, s + .25)) : 0; };
const head = (s, y = 0, size = 44, col = INK) => text(s, 0, y, { font: `400 ${size}px "Russo One"`, fill: col });
function paperGrid(col = 'rgba(60,80,120,.10)') { for (let x = 0; x < W; x += 60) stroke([[x, 0], [x, H]], 2, { line: col, boil: .2 }); for (let y = 0; y < H; y += 60) stroke([[0, y], [W, y]], 2, { line: col, boil: .2 }); }
const chap = (i, n, title, dark = false) => sheet(L0(i) - .25, L1(i) + .35, (t, s) => {
  fillOnly(rect(0, 0, W, H), dark ? '#120c18' : PAL.blueD, { boil: 0 });
  text(String(n), 1560, 560, { font: '400 820px "Russo One"', fill: dark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.07)' });
  const p = back(seg(t, s.t0, s.t0 + .45), 1.6);
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = '400 104px "Russo One"'; const tw = g.measureText(title).width, fs = Math.min(104, 104 * 1300 / tw), cw = Math.min(1500, tw * fs / 104 + 220);
  push(); translate(960, lerp(-300, 520, p)); rotate(-.025);
  I.card(cw, 330, [{ t: `ГЛАВА ${n}`, f: '900 50px Nunito', c: PAL.red, lh: 84 }, { t: title, f: `400 ${fs}px "Russo One"`, c: INK, lh: 140 }], { fill: dark ? '#d9d2c4' : PAL.paper });
  pop();
}, { noTL: true, bg: dark ? '#120c18' : PAL.blueD });
// the road fork (opening and ending)
function fork(t, tRoad, tSplit, o = {}) {
  const dy = o.dy || 0, A = [130, 640 + dy], F = [820, 640 + dy], U = [1320, 470 + dy], D = [1320, 810 + dy];
  const road = (a, b, u, col) => { if (u <= 0) return; const e = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    stroke([a, e], 64, { line: INK }); stroke([a, e], 52, { line: '#d8c49a' });
    const n = Math.floor(Math.hypot(e[0] - a[0], e[1] - a[1]) / 50); for (let k = 0; k < n; k += 2) { const u0 = k * 50 / Math.hypot(b[0] - a[0], b[1] - a[1]), u1 = (k + 1) * 50 / Math.hypot(b[0] - a[0], b[1] - a[1]); stroke([[lerp(a[0], b[0], u0), lerp(a[1], b[1], u0)], [lerp(a[0], b[0], u1), lerp(a[1], b[1], u1)]], 6, { line: col || '#fff' }); } };
  road(A, F, eo(seg(t, tRoad, tRoad + 1)));
  const u = eo(seg(t, tSplit, tSplit + 1)); road(F, U, u, '#9fb6e8'); road(F, D, u, '#f2a0a0');
  if (u > .9) {
    push(); translate(1560, 470 + dy); scale(pop01(t, tSplit + .9)); I.card(420, 150, [{ t: 'КАК БЫЛО', f: '400 50px "Russo One"', c: PAL.blue, lh: 64 }, { t: o.up || '1945: Германия проиграла', f: '900 28px Nunito', lh: 44 }], { clip: false }); pop();
    push(); translate(1560, 810 + dy); scale(pop01(t, tSplit + 1.1)); I.card(420, 150, [{ t: 'ЧТО ЕСЛИ', f: '400 50px "Russo One"', c: PAL.red, lh: 64 }, { t: o.down || 'Германия победила?', f: '900 28px Nunito', lh: 44 }], { clip: false }); pop();
  }
}

// ═══════════ HOOK ═══════════
cam(0, 2.5, 47.6, 2.0, .01);
cam(wt(1, 'Германские') - .3, 1, 50.6, 2.7, 2.4);
cam(wt(1, 'многим'), 9, 50.5, 1.15, 3.2);
year(.3, 1940.45, 'ИЮНЬ 1940');
patchOn('france', wt(1, 'капитулировала') + .1, L0(2) - .4, false);
lab('Франция', 1.2, 47.2, wt(1, 'Франция'), wt(1, 'Германские'));
counter({ t: wt(1, 'шесть'), to: 6, label: 'НЕДЕЛЬ', x: 1590, y: 300, off: wt(1, 'Германские') + .3 });
lab('Ла-Манш', -2.3, 50.0, wt(1, 'Ла-Манше'), L1(1) + .3, { sea: true });
pup('de', 1.9, 50.75, wt(1, 'Германские') - .2, L1(1) + .2, { face: -1, s: .3, f: t => ({ mood: t > wt(1, 'закончена') ? 'smug' : 'deadpan', look: [-.6, 0], armR: t > wt(1, 'закончена') ? { h: [70, -170], bend: 20 } : undefined }) });
note({ t: wt(1, 'закончена'), off: L1(1) + .4, x: 960, y: 830, w: 720, h: 130, lines: [{ t: 'ВОЙНА ОКОНЧЕНА?', f: '400 64px "Russo One"', c: PAL.redD }] });

// l002 — the question and the fork in the road
sheet(L0(2) - .25, L1(2) + .3, (t) => {
  paperGrid();
  const tS = wt(2, 'правы'), tG = wt(2, 'Германия'), tP = wt(2, 'победила'), tF = wt(2, 'фильме'), tR = wt(2, 'развилке'), tU = wt(2, 'удержать');
  const m = eio(seg(t, tG - .4, tG));
  if (t > tS) { const th = 1 + .6 * (1 - eo(seg(t, tS, tS + .16))); push(); translate(960, lerp(480, 120, m)); rotate(-.06); scale(th * lerp(1.25, .62, m)); I.stamp('ЧТО ЕСЛИ?', PAL.red, { w: 560, h: 150, size: 84, a: seg(t, tS, tS + .06) }); pop(); }
  if (t > tG) { push(); translate(960, 270); scale(pop01(t, tG)); head('ЧТО ЕСЛИ БЫ ГЕРМАНИЯ', 0, 92); pop(); }
  if (t > tP) { push(); translate(960, 380); scale(pop01(t, tP)); head('ВЫИГРАЛА ВОЙНУ?', 0, 92, PAL.redD); pop(); }
  fork(t, tF, tR);
  const wk = seg(t, wt(2, 'шаг'), tR + .3); if (t > tF) puppet({ side: 'de', x: lerp(160, 760, eio(wk)), y: 655, s: .2, t: q(t), mood: 'smug', look: [.6, 0], ...(wk > 0 && wk < 1 ? walk(t) : {}) });
  if (t > tU) { push(); translate(1800, 820); scale(pop01(t, tU) * .9); rotate(.05); const u = seg(t, tU + .3, tU + 1.5);
    shape([[-70, -60], [60, -70], [80, 40], [-60, 70]], { fill: C.grey, lw: 6 }); for (let i = 0; i < 3; i++) stroke([[0, 0], [Math.cos(i * 2.1) * 80 * u, Math.sin(i * 2.1) * 70 * u]], 5); pop(); }
}, { noTL: true });

// ═══════════ ГЛАВА 1 · РАЗВИЛКА ═══════════
chap(3, 1, 'РАЗВИЛКА');
cam(L0(4) - .7, 15, 52.6, 1.3, .01);
cam(wt(4, 'Весной') - .2, 11, 55.3, .95, 1.8);
mode(wt(4, 'было'), wt(8, 'соглашается'), 'real');
stampAt({ t: wt(4, 'было'), off: wt(4, 'Первого') - .1, label: 'КАК БЫЛО', col: PAL.blue, x: 960, y: 470, size: 84, w: 600, h: 150 });
year(wt(4, 'Первого'), 1939.67, '1 СЕНТЯБРЯ 1939');
for (const pts of [[[14.5, 53.4], [17, 53], [20.6, 52.4]], [[16.8, 50.4], [19, 51], [20.8, 51.9]], [[20.6, 54.3], [21, 53.3], [21.1, 52.6]]]) arrow(pts, wt(4, 'нападает'), 1.2, { off: wt(4, 'Весной'), w: 16 });
patchOn('poland', wt(4, 'Польшу') + .1);
lab('Варшава', 21, 52.2, wt(4, 'Польшу'), wt(4, 'Весной') + .5);
year(wt(4, 'Весной'), 1940.3, 'ВЕСНА 1940');
for (const [k, w, lon, lat] of [['denmark', 'Дания', 9.6, 56.4], ['norway', 'Норвегия', 9, 61.6], ['benelux', 'Нидерланды', 5.6, 52.6], ['lux', 'Люксембург', 6.1, 49.65]]) { patchOn(k, wt(4, w) + .1); lab(w, lon, lat, wt(4, w), L1(4) + .6, { nodot: true, dx: -20, dy: 0 }); }
lab('Бельгия', 4.4, 50.7, wt(4, 'Бельгия'), L1(4) + .6, { nodot: true, dx: -20, dy: 0 });
const SL1 = [wt(4, 'Польшу'), wt(4, 'Дания'), wt(4, 'Норвегия'), wt(4, 'Нидерланды'), wt(4, 'Люксембург')];
pup('de', 11.2, 51.3, wt(4, 'Германия') - .1, L1(5), { s: .27, f: t => { const sw = swingAt(t, SL1); return { mood: sw > .3 ? 'smug' : 'deadpan', armR: { h: [80 + 60 * sw, -40 - 160 * sw], bend: 20 }, look: [.5, 0] }; } });

// l005 — Ardennes, the sickle cut, Dunkirk
year(wt(5, 'Десятого'), 1940.36, '10 МАЯ 1940');
cam(wt(5, 'Десятого') - .2, 3.6, 50.3, 2.1, 2);
lab('Франция', 2.2, 47.9, wt(5, 'Францию'), wt(5, 'Британская'), { nodot: true });
lab('Арденны', 5.7, 49.75, wt(5, 'Арденны'), wt(5, 'Британская'), { col: '#3d5a33' });
arrow([[8, 50.3], [6.4, 49.95], [5, 49.7], [3.6, 50.0], [2.3, 50.12], [1.55, 50.2]], wt(5, 'Танки'), wt(5, 'морю') - wt(5, 'Танки') + .3, { off: L1(7) - 3, w: 24, icon: 'tank', is: .55 });
counter({ t: wt(5, 'десять'), to: 10, label: 'ДНЕЙ ДО МОРЯ', x: 1590, y: 300, off: wt(5, 'Британская') + .2 });
ring(2.45, 51.0, 150, wt(5, 'прижата'), 1.4, { off: L1(7) - 2 });
lab('Дюнкерк', 2.37, 51.03, wt(5, 'Дюнкерка'), L1(7) - 2);
pup('gb', 2.55, 50.92, wt(5, 'Британская') - .1, L1(7) - 2, { s: .26, f: t => t < wt(7, 'спасена') ? { mood: 'panic', nerv: .7, sq: .92 } : { mood: 'smug' }, at: t => { const u = eio(seg(t, wt(7, 'вывезти'), wt(7, 'спасена'))); const a = S(2.55, 50.92), b = S(1.2, 51.2); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; } });

// l006 — how the blitzkrieg worked (a staff sheet)
sheet(L0(6) - .25, L1(6) + .3, (t) => {
  paperGrid();
  const T = w => wt(6, w);
  push(); translate(380, 215); scale(pop01(t, T('Почему'))); I.card(620, 100, [{ t: 'КАК РАБОТАЛ БЛИЦКРИГ', f: '400 40px "Russo One"', c: PAL.redD }], { clip: false }); pop();
  const conv = eio(seg(t, T('вместе'), T('точку'))), X = 1000, Y = 520;
  const lanes = [['plane', 300, T('авиация')], ['tank', 520, T('танки')], ['truck', 740, T('моторизованная')]];
  for (const [nm, y, t0] of lanes) { if (t < t0) continue; const u = eo(seg(t, t0, t0 + 1.2)), x0 = lerp(-150, 520, u);
    push(); translate(lerp(x0, X - 160, conv), lerp(y, Y + (y - Y) * .25, conv) + Math.sin(t * 6 + y) * 3); scale(1.1); I[nm](); pop();
    if (conv < .5) text({ plane: 'АВИАЦИЯ', tank: 'ТАНКИ', truck: 'ПЕХОТА НА МАШИНАХ' }[nm], lerp(-150, 520, u), y + 90, { font: '900 28px Nunito' }); }
  const tTr = T('Противник'), br = T('прорван'), en = T('окружение');
  if (t > tTr) for (let k = 0; k < 9; k++) { const y = 240 + k * 66, mid = y > 440 && y < 620, fly = mid ? eo(seg(t, br, br + .5)) : 0; push(); translate(1250 + fly * (k % 2 ? 160 : -60), y - fly * 120); rotate(fly * 2); scale(pop01(t, tTr + k * .05) * .9); I.sandbags(3); pop(); }
  if (t > T('позиционной')) { push(); translate(1580, 210); scale(pop01(t, T('позиционной'))); I.card(520, 140, [{ t: 'ПОЗИЦИОННАЯ ВОЙНА', f: '400 38px "Russo One"', c: PAL.blue, lh: 60 }, { t: 'как в 1914–1918', f: '900 30px Nunito', lh: 44 }], { clip: false }); pop(); }
  const u1 = eo(seg(t, T('точку'), T('точку') + .5)), u2 = eo(seg(t, br, br + .7));
  if (u1 > 0) { const xe = lerp(X - 60, X + 120, u1) + u2 * 420; stroke([[X - 120, Y], [xe - 40, Y]], 46, { line: INK }); stroke([[X - 120, Y], [xe - 40, Y]], 34, { line: PAL.red }); shape([[xe + 30, Y], [xe - 50, Y - 56], [xe - 50, Y + 56]], { fill: PAL.red, lw: 6 }); }
  if (t > en) { const u = eo(seg(t, en, wt(6, 'замкнуто') + .3)); for (let k = 0; k < 6; k++) { push(); translate(1640 + (k % 3) * 60 - 60, 690 + Math.floor(k / 3) * 70); scale(.9); I.person('#3b5a8a'); pop(); }
    const pts = []; for (let i = 0; i <= 60 * u; i++) { const a = Math.PI + i / 60 * TAU; pts.push([1640 + Math.cos(a) * 190, 720 + Math.sin(a) * 140]); } if (pts.length > 1) { stroke(pts, 18, { line: INK }); stroke(pts, 10, { line: PAL.red }); } }
});

// l007 — Dunkirk, 338 000, the armistice
cam(L1(6) - .2, 1.7, 51.1, 3.1, .01);
cam(wt(7, 'двадцать') - .2, 3.5, 48.6, 1.3, 2);
act(wt(7, 'вывезти') - .1, wt(7, 'двадцать') + .5, t => { for (let i = 0; i < 9; i++) { const u = ((t - wt(7, 'вывезти')) * .22 + i / 9) % 1; if (t < wt(7, 'вывезти') + i * .25) continue;
  const a = S(2.37, 51.06), b = S(1.33, 51.12); push(); translate(lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * 30 + i) * 4 + (i % 3 - 1) * 26); scale(.42); I.boat(); pop(); } });
counter({ t: wt(7, 'трёхсот'), d: 2.4, to: 338000, label: 'СОЛДАТ ВЫВЕЗЕНО', x: 1560, y: 300, off: wt(7, 'двадцать') });
act(wt(7, 'оружие'), wt(7, 'двадцать') + .5, t => { const [x, y] = S(2.6, 50.95); [['crate', -60, 10], ['tank', 50, 0], ['crate', 140, 14], ['truck', -150, 6]].forEach(([n, dx, dy], i) => { push(); translate(x + dx, y + dy + 30); scale(.45 * pop01(t, wt(7, 'оружие') + i * .12)); g.globalAlpha = .9; I[n]('#8b8e86'); g.globalAlpha = 1; pop(); }); });
lab('Дувр', 1.31, 51.13, wt(7, 'пролив'), wt(7, 'двадцать'));
year(wt(7, 'двадцать'), 1940.47, '22 ИЮНЯ 1940');
patchOn('france', wt(7, 'перемирие') + .1);
lab('Франция', 2.2, 47.4, wt(7, 'Франция'), L1(7) + .5, { nodot: true });
stampAt({ t: wt(7, 'перемирие') + .4, off: L1(7) + .4, label: 'ПЕРЕМИРИЕ', col: PAL.blue, x: 1500, y: 760, size: 64, w: 480, h: 120, sc: .9 });

// l008 — the War Cabinet (a sheet in a dark-wood room)
sheet(L0(8) - .25, L1(8) + .3, (t) => {
  const T = w => wt(8, w), tNo = T('отклоняют'), tYes = T('соглашается'), tAlt = T('нашей');
  fillOnly(rect(0, 0, W, H), '#6c1427', { boil: 0 }); for (let x = 40; x < W; x += 160) fillOnly(rect(x, 0, 70, 760), '#5a1020', { boil: .2 });
  shape(rr(-40, 700, W + 80, 60, 10), { fill: '#5a3423', lw: 7 }); fillOnly(rect(0, 760, W, 400), '#45281a', { boil: 0 });
  push(); translate(960, 150); scale(pop01(t, T('развилка'))); I.card(560, 100, [{ t: 'НАСТОЯЩАЯ РАЗВИЛКА', f: '400 44px "Russo One"', c: PAL.redD }], { clip: false }); pop();
  const look = t > T('обсуждает') && t < tNo ? [Math.sin(q(t) * 3) * .8, 0] : [.5, 0];
  puppet({ side: 'gb', x: 470, y: 760, s: .62, t: q(t), mood: t > tYes ? 'deadpan' : t > tNo && t < tAlt ? 'smug' : 'deadpan', look, umbrella: t > T('продолжает') && t < tAlt ? 1 : 0,
    armR: t > tYes ? { h: [110, -60], bend: 30 } : { h: [60, 140], bend: 12 }, armL: t > tYes ? { h: [-110, -60], bend: -30 } : undefined, headTilt: t > tYes ? .12 : 0 });
  if (t > T('обсуждает')) { push(); translate(1080, 470); rotate(-.04); scale(pop01(t, T('обсуждает'))); I.card(560, 300, [{ t: 'КОНЕЦ МАЯ 1940', f: '900 30px Nunito', c: PAL.redD, lh: 50 }, { t: 'ПЕРЕГОВОРЫ', f: '400 60px "Russo One"', lh: 76 }, { t: 'О МИРЕ?', f: '400 60px "Russo One"', lh: 76 }]); pop(); }
  const tilt = t < T('мире') ? 0 : t < tNo ? -.12 * eo(seg(t, T('мире'), T('мире') + .6)) : t < tYes ? lerp(-.12, .22, eo(seg(t, tNo, tNo + .6))) : lerp(.22, -.26, eo(seg(t, tYes, tYes + .6)));
  if (t > T('обсуждает')) { push(); translate(1600, 380); scale(pop01(t, T('обсуждает') + .3) * .95); stroke([[0, 0], [0, 300]], 12); shape(rr(-60, 290, 120, 30, 8), { fill: '#c9a24a', lw: 6 }); rotate(tilt);
    stroke([[-220, 0], [220, 0]], 12); for (const [sx, lb] of [[-1, 'МИР'], [1, 'ВОЙНА']]) { push(); translate(sx * 220, 0); rotate(-tilt); stroke([[-60, 120], [0, 0], [60, 120]], 5); shape(arc(0, 120, 90, 36, 0, Math.PI, 20), { fill: '#e3a43a', lw: 6 }); text(lb, 0, 190, { font: '400 40px "Russo One"', fill: sx < 0 ? PAL.blue : PAL.redD }); pop(); } pop(); }
  if (t > tNo) { const a = t < tAlt ? 1 : 1 - seg(t, tAlt, tAlt + .4); push(); translate(1080, 500); rotate(-.12); scale(1 + .6 * (1 - eo(seg(t, tNo, tNo + .16)))); I.stamp('ОТКЛОНЕНО', PAL.blue, { w: 500, h: 130, size: 70, a: a * seg(t, tNo, tNo + .06), sub: 'КАК БЫЛО' }); pop(); }
  if (t > tAlt) { fillOnly(rect(0, 0, W, H), `rgba(184,50,58,${.18 * ss(seg(t, tAlt, tAlt + .5))})`, { boil: 0 }); }
  if (t > tYes) { push(); translate(1080, 500); rotate(-.1); scale(1.15 * (1 + .6 * (1 - eo(seg(t, tYes, tYes + .16))))); I.stamp('СОГЛАШАЕТСЯ', PAL.red, { w: 600, h: 150, size: 74, a: seg(t, tYes, tYes + .06), sub: 'ЧТО ЕСЛИ' }); pop(); }
});
year(wt(8, 'мая'), 1940.4, 'КОНЕЦ МАЯ 1940');
ev(wt(8, 'отклоняют'), 'stamp'); ev(wt(8, 'соглашается'), 'stamp'); ev(wt(8, 'соглашается'), 'hit');
mode(wt(8, 'соглашается'), wt(43, 'Реальная'), 'alt');

// ═══════════ ГЛАВА 2 · МИР НА ЗАПАДЕ ═══════════
chap(9, 2, 'МИР НА ЗАПАДЕ');
cam(L1(9) - .3, 5.5, 51.8, 1.55, .01);
cam(wt(10, 'тыл') - 1.2, 11, 51, 1.05, 2.2);
year(wt(10, 'Летом'), 1940.55, 'ЛЕТО 1940');
lab('Лондон', -.13, 51.5, wt(10, 'Лондон'), L1(10)); lab('Берлин', 13.4, 52.5, wt(10, 'Берлин'), L1(13));
const tSign = wt(10, 'подписывают');
pup('gb', -1.6, 52.6, wt(10, 'Лондон') - .1, L1(11), { s: .28, f: t => { const u = eio(seg(t, tSign, tSign + .7)) * (1 - eio(seg(t, wt(10, 'Британия'), wt(10, 'Британия') + .5))); return { mood: 'smug', lean: .15 * u, armR: { h: [60 + 160 * u, 140 - 260 * u], bend: 10 }, umbrella: 0 }; } });
pup('de', 6.4, 51.2, wt(10, 'Берлин') - .1, L1(12), { s: .28, face: -1, f: t => { const u = eio(seg(t, tSign, tSign + .7)) * (1 - eio(seg(t, wt(10, 'Британия'), wt(10, 'Британия') + .5))); return { mood: 'smug', lean: .15 * u, armR: { h: [60 + 160 * u, 140 - 260 * u], bend: 10 }, noProp: true, look: [.5, 0] }; },
  at: t => { const a = S(6.4, 51.2), b = S(11, 51.4), u = eio(seg(t, wt(10, 'тыл') - 1.2, wt(10, 'тыл') + .8)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; } });
note({ t: wt(10, 'мир') + .1, off: wt(10, 'Британия') + 1, x: 960, y: 330, w: 600, h: 150, tilt: -.04, lines: [{ t: 'МИРНЫЙ ДОГОВОР', f: '400 54px "Russo One"', c: PAL.redD, lh: 70 }, { t: 'Лондон — Берлин · 1940', f: '900 30px Nunito', lh: 44 }] });
act(wt(10, 'флот'), L1(11), t => { for (const [lon, lat, i] of [[-5.5, 49.6, 0], [-3, 56.8, 1], [1.8, 53.6, 2]]) { const [x, y] = S(lon, lat); push(); translate(x, y + Math.sin(t * 2 + i) * 3); scale(.45 * pop01(t, wt(10, 'флот') + i * .15)); I.ship(); pop(); } });
note({ t: wt(10, 'колонии'), off: wt(10, 'тыл') - .4, x: 420, y: 760, w: 500, h: 120, lines: [{ t: 'ФЛОТ И КОЛОНИИ', f: '400 44px "Russo One"', c: PAL.blue, lh: 56 }, { t: 'остаются у Британии', f: '900 28px Nunito', lh: 40 }] });
note({ t: wt(10, 'тыл'), off: L1(10) + .4, x: 1460, y: 300, w: 520, h: 130, lines: [{ t: '✓ СПОКОЙНЫЙ ТЫЛ', f: '400 48px "Russo One"', c: '#2f6b3a' }] });

// l011 — what does not happen, and the freed forces
cam(L0(11), 7, 50.5, 1.05, 1.2);
const NET = [['БИТВА ЗА БРИТАНИЮ', 'plane'], ['ВОЙНА В АФРИКЕ', 'tank'], ['БОМБАРДИРОВКИ ГОРОДОВ', 'bomb']];
NET.forEach(([s, ic], i) => { const t0 = wt(11, 'Нет', i), x = 380 + i * 580; note({ t: t0, off: wt(11, 'Сотни') + i * .1, x, y: 330, w: 500, h: 250, tilt: (i - 1) * .03, lines: [{ t: s, f: '400 34px "Russo One"', lh: 50 }, { t: '', lh: 120 }], icon: ic, iy: 50, is: .9 }); xout(t0 + .45, x, 330, 420, 200, { off: wt(11, 'Сотни') + i * .1 }); });
act(wt(11, 'Сотни') - .1, L1(11) + .5, t => { const t0 = wt(11, 'Сотни');
  for (let i = 0; i < 16; i++) { const u = eio(seg(t, t0 + i * .12, t0 + i * .12 + 4)); const [x, y] = S(lerp(-2, 12.5, u), 47.6 + (i % 4) * 1.35); push(); translate(x, y); scale(.6 * pop01(t, t0 + i * .12)); I.person('#6f7564'); pop(); }
  for (let i = 0; i < 6; i++) { const u = eio(seg(t, wt(11, 'самолётов') + i * .15, wt(11, 'самолётов') + i * .15 + 3)); const [x, y] = S(lerp(-4, 13.5, u), 53.3 + (i % 3) * .9); push(); translate(x, y); scale(.42 * pop01(t, wt(11, 'самолётов') + i * .15)); I.plane(); pop(); } });
note({ t: wt(11, 'свободны'), off: L1(11) + .4, x: 1500, y: 780, w: 420, h: 110, lines: [{ t: 'СВОБОДНЫ', f: '400 56px "Russo One"', c: PAL.redD }] });

// l012 — the Mediterranean, Italy, Romanian oil, one front
cam(wt(12, 'Средиземное') - .2, 17, 45, 1.0, 2);
lab('Средиземное море', 16, 36.3, wt(12, 'Средиземное'), L1(12), { sea: true });
pup('it', 12.6, 43.2, wt(12, 'Италия') - .1, L1(12), { s: .26, f: t => ({ mood: 'smug', armR: t > wt(12, 'Африке') ? { h: [150, -120], bend: 10 } : undefined, look: [.2, .5] }) });
arrow([[13.5, 38.4], [14.5, 35.5], [15.5, 32.6]], wt(12, 'Африке'), 1.2, { col: '#4f6b55', off: L1(12), w: 18 });
lab('Африка', 13, 30.5, wt(12, 'Африке'), L1(12), { nodot: true });
lab('Румыния', 25, 45.8, wt(12, 'румынская'), L1(12), { nodot: true });
dline([[26, 44.9], [21, 47.5], [17, 49.5], [13.4, 52.5]], wt(12, 'нефть'), 1.4, { off: L1(12), col: INK, w: 6 });
act(wt(12, 'нефть'), L1(12), t => { for (let i = 0; i < 4; i++) { const u = ((t - wt(12, 'нефть')) * .25 + i / 4) % 1; const a = [26, 44.9], b = [13.4, 52.5]; const [x, y] = S(lerp(a[0], b[0], u), lerp(a[1], b[1], u)); push(); translate(x, y - 20); scale(.42 * pop01(t, wt(12, 'нефть') + i * .2)); I.barrel(); pop(); } });
pup('de', 9.5, 48.3, wt(12, 'Впервые') - .2, L1(12), { s: .26, f: t => { const a = wt(12, 'Впервые'), b = wt(12, 'стороны'); const lk = t < b ? Math.sign(Math.sin((t - a) * 4)) * .8 : .8; return { mood: t > b ? 'smug' : 'deadpan', look: [lk, 0], face: t > a && t < b && Math.sin((t - a) * 4) < 0 ? -1 : 1 }; } });

// l013 — the USA stays out; no Lend-Lease
cam(wt(13, 'Соединённые') - .2, -45, 44, .52, 2.6);
lab('США', -80, 32.5, wt(13, 'Соединённые'), L1(13), { nodot: true, size: 40 });
pup('us', -92, 37.5, wt(13, 'Соединённые'), L1(13), { s: .3, f: t => t > wt(13, 'стороне') ? { face: -1, mood: 'deadpan', armL: { h: [70, -60], bend: -10 }, armR: { h: [-70, -60], bend: 10 } } : { mood: 'deadpan', look: [.6, 0] } });
act(wt(13, 'ленд'), L1(13) + .3, t => { const [x, y] = S(-68, 40); push(); translate(x, y); scale(.7 * pop01(t, wt(13, 'ленд'))); I.ship('#5a6272'); for (let i = 0; i < 3; i++) { push(); translate(-50 + i * 44, -40); scale(.45); I.crate(); pop(); } pop(); });
note({ t: wt(13, 'ленд') + .2, off: L1(13) + .3, x: 760, y: 300, w: 420, h: 110, lines: [{ t: 'ЛЕНД-ЛИЗ', f: '400 56px "Russo One"', c: PAL.blue }] });
xout(wt(13, 'появляется'), 760, 300, 380, 100, { off: L1(13) + .3 });

// ═══════════ ГЛАВА 3 · ВОСТОК ═══════════
chap(14, 3, 'ВОСТОК');
cam(L1(14) - .3, 29, 53.5, .95, .01);
year(wt(15, 'Двадцать'), 1941.47, '22 ИЮНЯ 1941');
note({ t: wt(15, 'операция'), off: wt(15, 'реальности'), x: 960, y: 260, w: 700, h: 120, lines: [{ t: 'ОПЕРАЦИЯ «БАРБАРОССА»', f: '400 50px "Russo One"', c: PAL.redD }] });
const tGo = wt(15, 'двинулись');
arrow([[21.5, 55], [25, 56.6], [28.5, 58], [30, 59.4]], tGo, 2.4, { off: L1(16), w: 18 });
arrow([[23, 52.5], [27.5, 53.9], [32, 54.5], [35.8, 55.4]], tGo + .2, 2.4, { off: L1(16), w: 18 });
arrow([[23.8, 50.6], [27, 50.3], [30.5, 50.3], [34, 49]], tGo + .4, 2.4, { off: L1(16), w: 18 });
patchOn('baltic', tGo + 1); patchOn('belarus', tGo + 1.5); patchOn('ukraine', tGo + 2);
counter({ t: wt(15, 'трёх'), to: 3000000, label: 'СОЛДАТ · КАК БЫЛО', x: 1560, y: 300, col: PAL.blue, off: wt(15, 'нашей') });
arrow([[1, 48.5], [7, 50], [13, 51.5], [20, 52.3]], wt(15, 'добавляются'), 1.6, { off: L1(15) + .3, col: '#d65a4a', w: 14 });
act(wt(15, 'авиация'), L1(15) + .3, t => { for (let i = 0; i < 5; i++) { const u = eio(seg(t, wt(15, 'авиация') + i * .15, wt(15, 'авиация') + i * .15 + 3)); const [x, y] = S(lerp(2, 26, u), 54 + (i % 3) * .8); push(); translate(x, y); scale(.38 * pop01(t, wt(15, 'авиация') + i * .15)); I.plane(); pop(); } });
note({ t: wt(15, 'освободившиеся'), off: L1(15) + .4, x: 1500, y: 780, w: 520, h: 120, lines: [{ t: '+ ВОЙСКА С ЗАПАДА', f: '400 44px "Russo One"', c: PAL.red }] });
pup('su', 40, 55.5, wt(15, 'Советский') - .1, L1(16) - .2, { s: .27, face: -1, f: t => ({ mood: 'panic', nerv: .5, look: [-.6, 0] }) });

// l016 — Moscow
cam(wt(16, 'Осенью') - .2, 36.5, 55.4, 2.1, 2);
year(wt(16, 'Осенью'), 1941.75, 'ОСЕНЬ 1941');
lab('Москва', 37.6, 55.75, wt(16, 'Москвы'), L1(19));
note({ t: wt(16, 'реальной'), off: wt(16, 'версии'), x: 430, y: 300, w: 470, h: 120, lines: [{ t: 'КАК БЫЛО:', f: '900 30px Nunito', c: PAL.blue, lh: 42 }, { t: 'ОСТАНОВИЛИ', f: '400 48px "Russo One"', c: PAL.blue, lh: 60 }] });
dline([[35.2, 54.4], [35.4, 55.4], [35.3, 56.5]], wt(16, 'остановили'), .8, { dash: 0, col: PAL.blue, w: 16, off: wt(16, 'хватает') + .3 });
stampAt({ t: wt(16, 'версии'), off: wt(16, 'октябре'), label: 'ЧТО ЕСЛИ', col: PAL.red, x: 430, y: 300, size: 62, w: 430, h: 120 });
arrow([[32.5, 55.2], [34.8, 55.5], [37.4, 55.7]], wt(16, 'хватает'), .9, { off: L1(16), w: 22 });
year(wt(16, 'октябре'), 1941.8, 'ОКТЯБРЬ 1941');
patchOn('moscow', wt(16, 'падает') + .1); shake(wt(16, 'падает') + .1, 16);
slam(wt(16, 'падает') + .5, L1(16) + .5, 'su', { mood: 'shock', nerv: 1, look: [.2, -.2] });

// l017 — Leningrad (quiet)
cam(L0(17) - .2, 31, 59.3, 2.3, 2);
tint(L0(17), L1(17) + .5, '#0d0a18', .3);
year(wt(17, 'сентябре'), 1941.7, 'СЕНТЯБРЬ 1941');
lab('Ленинград', 30.3, 59.95, wt(17, 'Ленинграда') - .4, L1(17));
ring(30.3, 59.95, 150, wt(17, 'замыкается'), wt(17, 'Ленинграда') - wt(17, 'замыкается') + .6, { off: L1(17), dash: 0, w: 12 });
counter({ t: wt(17, 'девятьсот'), to: 900, d: 2.4, label: 'ДНЕЙ БЛОКАДЫ · КАК БЫЛО', x: 1540, y: 300, col: PAL.blue, off: L1(17), soft: true, fmt: v => '≈ ' + Math.round(v) });
note({ t: wt(17, 'сотен'), off: L1(17), x: 1540, y: 520, w: 520, h: 110, soft: true, lines: [{ t: 'СОТНИ ТЫСЯЧ ПОГИБШИХ', f: '900 34px Nunito', c: INK }] });
stampAt({ t: wt(17, 'труднее'), off: L1(17) + .3, label: 'ЧТО ЕСЛИ', x: 420, y: 760, size: 54, w: 360, h: 100 });

// l018 — the government to Kuibyshev, factories beyond the Urals
cam(wt(18, 'Правительство') - .3, 44.5, 55.5, 1.45, 2);
lab('Куйбышев', 50.1, 53.2, wt(18, 'Куйбышев'), L1(18));
dline([[37.6, 55.75], [43, 54.5], [50.1, 53.2]], wt(18, 'переезжает'), wt(18, 'Куйбышев') - wt(18, 'переезжает') + .3, { off: L1(18), col: PAL.blue, w: 7 });
pup('su', 0, 0, wt(18, 'Правительство'), L1(18), { s: .25, f: t => { const m = t > wt(18, 'переезжает') && t < wt(18, 'Куйбышев') + .3; return { mood: t > wt(18, 'сражаться') ? 'deadpan' : 'panic', ...(m ? walk(t) : {}), armR: t > wt(18, 'сражаться') ? { h: [40, -200], bend: 0 } : { h: [40, 140], bend: 12 } }; },
  at: t => { const u = eio(seg(t, wt(18, 'переезжает'), wt(18, 'Куйбышев') + .3)); const a = S(38, 55.4), b = S(50.1, 53.0); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; } });
note({ t: wt(18, 'план'), off: wt(18, 'Урал') - .3, x: 520, y: 280, w: 560, h: 130, lines: [{ t: 'ПЛАН ЭВАКУАЦИИ', f: '400 44px "Russo One"', c: PAL.blue, lh: 58 }, { t: 'был на самом деле · 1941', f: '900 28px Nunito', lh: 40 }] });
lab('Урал', 59.5, 58.5, wt(18, 'Урал'), L1(18), { nodot: true, col: '#5a3d28' });
act(wt(18, 'вывезены') - .3, L1(18) + .3, t => { for (let i = 0; i < 3; i++) { const u = eio(seg(t, wt(18, 'вывезены') + i * .5, wt(18, 'вывезены') + i * .5 + 5)); const [x, y] = S(lerp(38, 60, u), 56.6 + i * 1.1); push(); translate(x, y); scale(-.32, .32); I.train(2, '#4a4f58', () => I.factory()); pop(); } });
counter({ t: wt(18, 'полторы'), to: 1500, label: 'ЗАВОДОВ ЗА УРАЛ', x: 1590, y: 300, col: PAL.blue, off: L1(18) + .3 });

// l019 — mud, frost, the supply line, the other gauge
cam(L0(19) - .2, 27, 53.5, 1.0, 2);
year(wt(19, 'Осенняя'), 1941.85, 'ОСЕНЬ — ЗИМА 1941');
tint(wt(19, 'распутица'), wt(19, 'морозы'), '#5a3d1e', .35);
tint(wt(19, 'морозы'), L1(19) + .3, '#dfe8f6', .38);
ov(wt(19, 'распутица'), L1(19) + .3, t => { const mud = t < wt(19, 'морозы');
  for (let i = 0; i < 70; i++) { const x = (hash(i) * W + (mud ? 0 : Math.sin(t + i) * 30)), y = ((hash(i * 3) * H + t * (mud ? 900 : 120)) % H);
    if (mud) stroke([[x, y], [x - 6, y + 26]], 3, { line: 'rgba(200,210,230,.5)' }); else dot(x, y, 4 + hash(i * 7) * 4, 'rgba(255,255,255,.9)'); } });
note({ t: wt(19, 'распутица'), off: wt(19, 'морозы'), x: 1500, y: 300, w: 420, h: 110, lines: [{ t: 'РАСПУТИЦА', f: '400 54px "Russo One"', c: '#5a3d1e' }] });
note({ t: wt(19, 'морозы'), off: wt(19, 'снабжения'), x: 1500, y: 300, w: 420, h: 110, lines: [{ t: 'МОРОЗЫ', f: '400 60px "Russo One"', c: PAL.blue }] });
dline([[13.4, 52.5], [21, 52.2], [28, 53.5], [35, 55]], wt(19, 'снабжения'), 1.8, { off: L1(19), col: INK, w: 7 });
counter({ t: wt(19, 'полторы'), to: 1500, label: 'КМ ЛИНИИ СНАБЖЕНИЯ', fmt: v => Math.round(v) + ' км', x: 1500, y: 300, off: L1(19) });
act(wt(19, 'снаряд'), L1(19) + .3, t => { const u = ((t - wt(19, 'снаряд')) * .08) % 1; const [x, y] = S(lerp(14, 34, u), lerp(52.5, 54.8, u)); push(); translate(x, y); scale(.3); I.train(2); pop(); });
ov(wt(19, 'железной') - .2, L1(19) + .4, t => { const p = pop01(t, wt(19, 'железной') - .2) * (1 - ei(seg(t, L1(19), L1(19) + .4))); push(); translate(470, 760); scale(p);
  I.card(640, 260, [], { clip: false }); for (const [y, w, lb, c] of [[-50, 110, '1435 мм · Европа', INK], [60, 150, '1524 мм · СССР', PAL.redD]]) { stroke([[-260, y - w / 2], [60, y - w / 2]], 8, { line: c }); stroke([[-260, y + w / 2 - 60], [60, y + w / 2 - 60]], 8, { line: c }); text(lb, 190, y - 20, { font: '900 28px Nunito', fill: c }); } pop(); });

// l020 — the A–A line, the Volga, the endless front
cam(L0(20) - .2, 43, 55.3, 1.42, 2);
year(wt(20, 'Цель'), 1942.3, '1942');
note({ t: wt(20, 'плана'), off: wt(20, 'Армия'), x: 500, y: 290, w: 560, h: 140, lines: [{ t: 'ПЛАН «БАРБАРОССА»', f: '400 40px "Russo One"', c: PAL.redD, lh: 56 }, { t: 'цель: линия А — А', f: '900 32px Nunito', lh: 46 }] });
lab('Архангельск', 40.5, 64.55, wt(20, 'Архангельска'), L1(20)); lab('Астрахань', 48.03, 46.35, wt(20, 'Астрахани'), L1(20));
dline([[40.5, 64.55], [43.5, 59], [45.5, 54.5], [47, 50], [48.03, 46.35]], wt(20, 'Архангельска'), wt(20, 'Астрахани') - wt(20, 'Архангельска') + .6, { off: L1(20), w: 9 });
patchOn('volga', wt(20, 'Волги') + .1);
lab('Волга', 46.5, 53.5, wt(20, 'Волги'), L1(20), { nodot: true, col: PAL.blue });
pup('de', 0, 0, wt(20, 'Армия') - .2, L1(20), { s: .26, f: t => { const m = t < wt(20, 'упирается'); return { mood: t > wt(20, 'упирается') ? 'shock' : 'smug', ...(m ? walk(t) : {}), lean: t > wt(20, 'упирается') ? -.15 : 0 }; },
  at: t => { const u = eio(seg(t, wt(20, 'Армия'), wt(20, 'упирается'))); const a = S(36, 52.5), b = S(44.2, 52.6); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; } });
pup('su', 54, 51, wt(20, 'огромную'), L1(20), { s: .45, face: -1, f: t => ({ mood: 'deadpan', look: [-.5, 0], armR: { h: [-40, -200], bend: 0 } }) });
ev(wt(20, 'упирается'), 'thud'); shake(wt(20, 'упирается'), 10);
dline([[45.2, 63], [45.8, 59], [46, 55], [46.2, 51], [47, 47]], wt(20, 'Фронт'), 1.6, { off: L1(20) + .3, dash: 0, col: PAL.red, w: 12, jag: 7 });
note({ t: wt(20, 'тысячи'), off: L1(20) + .3, x: 1520, y: 800, w: 520, h: 120, lines: [{ t: 'ФРОНТ — ТЫСЯЧИ КМ', f: '400 42px "Russo One"', c: PAL.redD }] });

// ═══════════ ГЛАВА 4 · ЦЕНА (dark, quiet) ═══════════
chap(21, 4, 'ЦЕНА', true);
sheet(L0(22) - .25, L1(24) + .6, (t) => {
  fillOnly(rect(0, 0, W, H), '#120c18', { boil: 0 });
  const T22 = w => wt(22, w), T23 = w => wt(23, w), T24 = w => wt(24, w);
  const a1 = fadeIO(t, T22('просто') - .2, T23('Руководство'), .6);
  if (a1 > 0) { g.save(); g.globalAlpha = a1; text('НЕ ПРОСТО НОВАЯ КАРТА', 960, 470, { font: '400 72px "Russo One"', fill: '#e9e1d2' }); g.restore(); }
  const cardA = (x, t0, title, l1, l2) => { const a = fadeIO(t, t0, T24('реальной') + .3, .8); if (a <= 0) return; g.save(); g.globalAlpha = a; push(); translate(x, 470 + (1 - ss(seg(t, t0, t0 + 1))) * 40); rotate(x < 960 ? -.03 : .025);
    I.card(640, 360, [{ t: 'ДОКУМЕНТ', f: '900 26px Nunito', c: '#6e716a', lh: 50 }, { t: title, f: '400 36px "Russo One"', c: INK, lh: 70 }, { t: l1, f: '900 34px Nunito', c: '#4a1a2a', lh: 52 }, { t: l2, f: '900 34px Nunito', c: '#4a1a2a', lh: 52 }], { fill: '#d9d0bb', pin: false }); pop(); g.restore(); };
  cardA(520, T23('Генеральный'), 'ГЕНЕРАЛЬНЫЙ ПЛАН «ОСТ»', 'выселение и гибель', 'десятков миллионов людей');
  cardA(1400, T23('Голодный'), '«ГОЛОДНЫЙ ПЛАН»', 'зерно — в Германию,', 'миллионы — на голод');
  const a3 = fadeIO(t, T24('Холокост') - .2, L1(24) + .6, 1.0);
  if (a3 > 0) { g.save(); g.globalAlpha = a3; text('ХОЛОКОСТ', 960, 330, { font: '900 46px Nunito', fill: '#b9b2a6' });
    g.globalAlpha = a3 * ss(seg(t, T24('шести'), T24('шести') + 1.5)); text('≈ 6 000 000', 960, 470, { font: '400 130px "Russo One"', fill: '#f1ebe0' }); text('жизней евреев · как было', 960, 580, { font: '900 38px Nunito', fill: '#b9b2a6' });
    g.globalAlpha = a3 * ss(seg(t, T24('бумаге') - .3, T24('бумаге') + .8)); text('Эти планы существовали на бумаге.', 960, 720, { font: '900 40px Nunito', fill: '#e9e1d2' });
    g.globalAlpha = a3 * ss(seg(t, T24('остановить') - .3, T24('остановить') + 1)); text('Их некому было бы остановить.', 960, 790, { font: '900 40px Nunito', fill: PAL.goldL });
    g.restore(); }
  const end = ss(seg(t, L1(24) - .3, L1(24) + .6)); if (end > 0) fillOnly(rect(0, 0, W, H), `rgba(0,0,0,${end * .6})`, { boil: 0 });
}, { bg: '#120c18', noTL: true });
ev(wt(23, 'Генеральный'), 'soft'); ev(wt(23, 'Голодный'), 'soft');

// ═══════════ ГЛАВА 5 · НОВАЯ ЕВРОПА ═══════════
chap(25, 5, 'НОВАЯ ЕВРОПА');
cam(L1(25) - .3, 19, 51.5, .82, .01);
year(wt(26, 'сорок'), 1943, '1943');
patchOn('balkans', wt(26, 'выглядит') + .1); patchOn('vichy', wt(26, 'иначе') + .1);
dline([[-4.5, 47.2], [10, 47], [25, 47.3], [46, 50.5]], wt(26, 'Атлантики'), wt(26, 'Волги') - wt(26, 'Атлантики') + .4, { off: L1(26) + .5, col: PAL.redD, w: 10, dash: 0 });
lab('АТЛАНТИКА', -16, 45, wt(26, 'Атлантики'), L1(26) + .5, { sea: true }); lab('Волга', 46.5, 53.5, wt(26, 'Волги'), L1(26) + .5, { nodot: true, col: PAL.blue });
pup('de', 11.5, 51.5, wt(26, 'Берлина') - .2, L1(26) + .3, { s: .42, f: t => ({ mood: 'smug', armR: { h: [90, -200], bend: 20 }, look: [.5, 0] }) });

// l027 — 80 million versus hundreds of millions; partisans
cam(L0(27), 18, 50, .95, 1.5);
ov(wt(27, 'восьмидесяти') - .1, wt(27, 'партизанская') + .5, t => { const a = pop01(t, wt(27, 'восьмидесяти') - .1) * (1 - ei(seg(t, wt(27, 'партизанская'), wt(27, 'партизанская') + .5)));
  push(); translate(1440, 760); scale(a); I.card(760, 330, [], { clip: false });
  text('≈ 80 МЛН', -250, -100, { font: '400 46px "Russo One"', fill: '#3e4238' }); for (let i = 0; i < 4; i++) { push(); translate(-330 + i * 50, -20); scale(.8); I.person('#6f7564'); pop(); }
  if (t > wt(27, 'сотни')) { text('СОТНИ МИЛЛИОНОВ', 150, -100, { font: '400 40px "Russo One"', fill: PAL.redD }); for (let i = 0; i < 24; i++) { const pp = pop01(t, wt(27, 'сотни') + i * .03); push(); translate(-10 + (i % 8) * 44, -10 + Math.floor(i / 8) * 64); scale(.62 * pp); I.person(['#3b5a8a', '#8a4f4f', '#5b6a52', '#6f7598'][i % 4]); pop(); } }
  pop(); });
for (const [w, lon, lat, nm] of [['Белоруссии', 28, 53.6, 'Белоруссия'], ['Югославии', 18.5, 44, 'Югославия'], ['Франции', 2.5, 46.3, 'Франция'], ['Польше', 20, 51.3, 'Польша']]) {
  const t0 = wt(27, w); act(t0, L1(27) + .3, t => { const [x, y] = S(lon, lat); push(); translate(x, y); scale(.75 * pop01(t, t0)); I.spark(t, lon); pop(); }); lab(nm, lon, lat - 1.3, t0, L1(27), { nodot: true }); ev(t0, 'fire'); }
note({ t: wt(27, 'партизанская'), off: L1(27) + .3, x: 960, y: 250, w: 640, h: 110, lines: [{ t: 'ПАРТИЗАНСКАЯ ВОЙНА', f: '400 50px "Russo One"', c: PAL.redD }] });

// l028 — puppet governments (a stage sheet)
sheet(L0(28) - .25, L1(28) + .3, (t) => {
  const T = (w, n = 0) => wt(28, w, n);
  fillOnly(rect(0, 0, W, H), '#6c1427', { boil: 0 }); for (let x = 0; x < W; x += 120) fillOnly(rect(x, 0, 56, H), '#5a1020', { boil: .2 });
  shape(rr(-40, 820, W + 80, 60, 10), { fill: '#5a3423', lw: 7 }); fillOnly(rect(0, 880, W, 300), '#3a2016', { boil: 0 });
  shape(rr(260, 300, 1400, 44, 12), { fill: '#3e4238', lw: 7 }); text('БЕРЛИН', 960, 322, { font: '400 30px "Russo One"', fill: '#e9e4da' });
  push(); translate(960, 215); scale(pop01(t, T('напрямую'))); I.card(900, 90, [{ t: 'НАПРЯМУЮ — ИЛИ ЧЕРЕЗ ПОКОРНЫЕ ПРАВИТЕЛЬСТВА', f: '900 32px Nunito', c: INK }], { clip: false, pin: false }); pop();
  const PUPS = [['vi', 520, 'ВИШИ · ФРАНЦИЯ', T('Виши')], ['sk', 960, 'СЛОВАКИЯ', T('Словакия')], ['hr', 1400, 'ХОРВАТИЯ', T('Хорватия')]];
  const lose = seg(t, T('теряют'), T('теряют') + 1.5);
  for (const [side, x, nm, t0] of PUPS) { if (t < t0 - .2) continue; const p = pop01(t, t0 - .2), sw = Math.sin(t * 2 + x) * .05 + (lose > 0 ? Math.sin(t * 7 + x) * .08 * lose : 0);
    push(); translate(x, 344); rotate(sw); for (const dx of [-70, 0, 70]) stroke([[dx * .3, 0], [dx, 230]], 2, { line: lose > .5 ? 'rgba(230,220,200,.35)' : 'rgba(230,220,200,.8)' });
    puppet({ side, x: 0, y: 820 - 344, s: .45 * p, t: q(t), mood: lose > .3 ? 'panic' : 'deadpan', armL: { h: [-80, -100], bend: -10 }, armR: { h: [80, -100], bend: 10 } }); pop();
    push(); translate(x, 950); scale(p); I.card(380, 76, [{ t: nm, f: '400 34px "Russo One"', c: PAL.redD }], { clip: false, pin: false }); pop(); }
  if (t > T('реальности')) { push(); translate(1680, 400); rotate(-.08); scale(.5 * (1 + .6 * (1 - eo(seg(t, T('реальности'), T('реальности') + .16))))); I.stamp('КАК БЫЛО', PAL.blue, { w: 520, h: 130, size: 70, a: seg(t, T('реальности'), T('реальности') + .06), sub: 'такие режимы были' }); pop(); }
  if (t > T('налоги')) for (let i = 0; i < 9; i++) { const u = ((t - T('налоги')) * .5 + i / 9) % 1; if (t > T('отправляют') + 1) break; push(); translate(520 + (i % 3) * 440, lerp(700, 200, u)); scale(.9); I.coin(); pop(); }
  if (t > T('работы')) for (let i = 0; i < 6; i++) { const u = seg(t, T('работы') + i * .25, T('работы') + i * .25 + 3); if (u <= 0 || u >= 1) continue; push(); translate(lerp(300, 1900, u), 860); scale(.9); I.person('#5b6a52'); pop(); }
  if (t > T('работы')) { push(); translate(1600, 740); scale(pop01(t, T('работы'))); I.card(420, 70, [{ t: '→ НА РАБОТЫ В ГЕРМАНИЮ', f: '900 28px Nunito' }], { clip: false, pin: false }); pop(); }
});
ev(wt(28, 'Виши'), 'pop'); ev(wt(28, 'Словакия'), 'pop'); ev(wt(28, 'Хорватия'), 'pop'); ev(wt(28, 'налоги'), 'coins');

// l029 — the economy machine
sheet(L0(29) - .25, L1(29) + .3, (t) => {
  const T = w => wt(29, w); paperGrid();
  push(); translate(620, 215); scale(pop01(t, T('Экономика'))); I.card(560, 100, [{ t: 'ЭКОНОМИКА РЕЙХА', f: '400 46px "Russo One"', c: INK }], { clip: false }); pop();
  const stut = t > T('плохой') ? (Math.sin(t * 9) > .6 ? 0 : 1) : 1, rot = t * .8 * stut;
  push(); translate(500, 540); I.gear(140, 12, '#9aa1ac', rot); pop(); push(); translate(760, 420); I.gear(100, 9, '#c9a24a', -rot * 1.4); pop(); push(); translate(760, 680); I.gear(80, 8, '#8b8e86', -rot * 1.75); pop();
  if (t > T('принудительном')) { push(); translate(300, 330); scale(pop01(t, T('принудительном'))); I.card(470, 80, [{ t: 'ПРИНУДИТЕЛЬНЫЙ ТРУД', f: '900 30px Nunito', c: PAL.redD }], { clip: false, pin: false }); pop(); }
  if (t > T('грабеже')) { push(); translate(240, 800); scale(pop01(t, T('грабеже'))); I.card(240, 80, [{ t: 'ГРАБЁЖ', f: '400 40px "Russo One"', c: PAL.redD }], { clip: false, pin: false }); pop(); }
  if (t > T('плохой')) for (let i = 0; i < 5; i++) { const u = ((t - T('плохой')) * .6 + i / 5) % 1; dot(800 + Math.sin(i + t) * 30, 300 - u * 200, 26 * (1 - u) + 6, `rgba(70,70,70,${.5 * (1 - u)})`); }
  const drops = [T('гарнизон'), T('поезд'), T('километр'), T('съедает')]; let lvl = 1; drops.forEach((d, i) => { lvl -= .2 * eo(seg(t, d, d + .5)); });
  push(); translate(1500, 560); shape(rr(-80, -300, 160, 600, 18), { fill: '#e9e1d2', lw: 7 }); const hh = 580 * lvl; fillOnly(rr(-70, 290 - hh, 140, hh, 12), lvl < .35 ? PAL.red : '#3f7a4a', { boil: .2 }); text('РЕСУРСЫ', 0, 350, { font: '400 38px "Russo One"' }); pop();
  [['tent', T('гарнизон')], ['train', T('поезд')], ['sandbags', T('километр')]].forEach(([n, d], i) => { if (t < d) return; push(); translate(1200, 300 + i * 200); scale((n === 'train' ? .4 : .9) * pop01(t, d)); I[n](n === 'sandbags' ? 3 : undefined); pop(); stroke([[1260, 300 + i * 200], [1410, 300 + i * 200]], 5, { line: PAL.red }); });
});
['гарнизон', 'поезд', 'километр'].forEach(w => ev(wt(29, w), 'pop'));

// ═══════════ ГЛАВА 6 · БОМБА ═══════════
chap(30, 6, 'БОМБА');
cam(L1(30) - .3, -45, 46, .52, .01);
cam(wt(31, 'Эйнштейн') - .5, -78, 40, 1.1, 2.4);
year(wt(31, 'тридцать'), 1939.6, 'АВГУСТ 1939');
lab('Вашингтон', -77, 38.9, wt(31, 'президенту'), L1(31));
note({ t: wt(31, 'письмо'), off: L1(31) + .3, x: 1380, y: 520, w: 640, h: 360, tilt: .025, lines: [{ t: 'ПИСЬМО ПРЕЗИДЕНТУ США', f: '400 38px "Russo One"', lh: 70 }, { t: '«…атомное оружие', f: 'italic 900 40px Nunito', c: '#4a1a2a', lh: 56 }, { t: 'возможно»', f: 'italic 900 40px Nunito', c: '#4a1a2a', lh: 56 }, { t: 'А. Эйнштейн · август 1939', f: '900 28px Nunito', c: '#6e716a', lh: 70 }] });
act(wt(31, 'атомное'), L1(31) + .3, t => { const [x, y] = S(-77, 38.9); push(); translate(x - 60, y - 160); scale(.9 * pop01(t, wt(31, 'атомное'))); I.atom(t); pop(); });

// l032 — Pearl Harbor (a sheet), the declaration of war that never comes
sheet(L0(32) - .25, L1(32) + .3, (t) => {
  const T = w => wt(32, w);
  fillOnly(rect(0, 0, W, 470), '#9fb6d8', { boil: 0 }); fillOnly(rect(0, 470, W, 700), '#1c4a7a', { boil: 0 });
  for (let i = 0; i < 12; i++) stroke([[i * 170 - 40, 560 + (i % 3) * 120], [i * 170 + 80, 560 + (i % 3) * 120]], 4, { line: 'rgba(255,255,255,.35)' });
  shape(spline([[200, 520], [380, 430], [620, 410], [860, 450], [980, 520]]), { fill: '#5d7a4a', lw: 7 });
  const hit = T('атакует');
  [[420, 600], [640, 640], [860, 610]].forEach(([x, y], i) => { push(); translate(x, y); scale(.9); I.ship('#5a6272'); pop();
    if (t > hit + .6 + i * .3) for (let k = 0; k < 4; k++) { const u = ((t - hit) * .4 + k / 4) % 1; dot(x + Math.sin(k + t) * 20, y - 40 - u * 260, 40 * (1 - u) + 10, `rgba(60,60,60,${.55 * (1 - u)})`); } });
  if (t > T('японская')) for (let i = 0; i < 5; i++) { const u = seg(t, T('японская') + i * .15, T('японская') + i * .15 + 2.2); if (u >= 1) continue; push(); translate(lerp(-150, 1100, u), 160 + i * 50 + u * 200); rotate(.18); scale(.6); I.plane('#c9c2a8'); pop(); }
  if (t > hit + .3) { const f = 1 - seg(t, hit + .3, hit + .9); if (f > 0) fillOnly(rect(0, 0, W, H), `rgba(255,200,120,${.35 * f})`, { boil: 0 }); }
  push(); translate(560, 220); scale(pop01(t, T('Перл'))); I.card(460, 100, [{ t: 'ПЕРЛ-ХАРБОР', f: '400 50px "Russo One"', c: INK }], { clip: false }); pop();
  if (t > T('США')) puppet({ side: 'us', x: 1250, y: 920, s: .5 * pop01(t, T('США')), t: q(t), mood: t < T('вступают') + 1 ? 'shock' : 'deadpan', face: -1, look: [-.6, 0] });
  if (t > T('реальности')) { push(); translate(1500, 300); rotate(.03); scale(pop01(t, T('реальности'))); I.card(640, 210, [{ t: 'КАК БЫЛО · 11 ДЕКАБРЯ 1941', f: '900 30px Nunito', c: PAL.blue, lh: 54 }, { t: 'ГЕРМАНИЯ ОБЪЯВЛЯЕТ', f: '400 44px "Russo One"', lh: 58 }, { t: 'ВОЙНУ США', f: '400 44px "Russo One"', lh: 58 }]); pop(); }
  if (t > T('нашей')) { push(); translate(1500, 330); rotate(-.1); scale(.95 * (1 + .6 * (1 - eo(seg(t, T('нашей'), T('нашей') + .16))))); I.stamp('НЕ ОБЪЯВЛЯЕТ', PAL.red, { w: 600, h: 140, size: 66, a: seg(t, T('нашей'), T('нашей') + .06), sub: 'ЧТО ЕСЛИ' }); pop(); }
  if (t > T('Атлантика')) { push(); translate(960, 780); scale(pop01(t, T('Атлантика'))); I.card(640, 100, [{ t: 'АТЛАНТИКА ОСТАЁТСЯ МИРНОЙ', f: '400 38px "Russo One"', c: '#2f6b3a' }], { clip: false }); pop(); }
});
year(wt(32, 'Седьмого'), 1941.93, '7 ДЕКАБРЯ 1941');
ev(wt(32, 'японская'), 'planes'); ev(wt(32, 'атакует') + .6, 'boom'); ev(wt(32, 'реальности'), 'card'); ev(wt(32, 'нашей'), 'stamp');

// l033 — the Manhattan Project; the scientists who fled
cam(L1(32) - .3, -35, 45, .55, .01);
year(wt(33, 'сорок'), 1942, '1942');
note({ t: wt(33, 'Манхэттенский'), off: L1(33) + .3, x: 470, y: 290, w: 620, h: 130, lines: [{ t: 'МАНХЭТТЕНСКИЙ ПРОЕКТ', f: '400 44px "Russo One"', c: PAL.blue, lh: 60 }, { t: 'США · 1942', f: '900 30px Nunito', lh: 42 }] });
ov(wt(33, 'отстаёт') - .4, L1(33) + .3, t => { const t0 = wt(33, 'отстаёт') - .4, a = pop01(t, t0) * (1 - ei(seg(t, L1(33), L1(33) + .3))); push(); translate(1450, 300); scale(a); I.card(700, 230, [], { clip: false });
  const u = seg(t, t0, t0 + 5); [['США', PAL.blue, .95], ['ГЕРМАНИЯ', '#6f7564', .35]].forEach(([nm, c, k], i) => { text(nm, -220, -40 + i * 90, { font: '400 32px "Russo One"', fill: c, align: 'right' }); fillOnly(rr(-190, -62 + i * 90, 470 * eo(u) * k, 44, 10), c, { boil: .2 }); }); pop(); });
act(wt(33, 'физики'), L1(33) + .3, t => { for (let i = 0; i < 6; i++) { const u = eio(seg(t, wt(33, 'физики') + i * .3, wt(33, 'физики') + i * .3 + 3.5)); if (u <= 0) continue; const lon = lerp(8, -76, u), lat = lerp(49, 40, u) + Math.sin(u * Math.PI) * 9 + i * .6;
  const [x, y] = S(lon, lat); push(); translate(x, y); scale(.6); I.person('#e9e4da'); pop(); } });
lab('бежали в Америку', -30, 55, wt(33, 'бежали'), L1(33), { sea: true });

// l034 — Vemork
cam(wt(34, 'реальности') - .4, 8.5, 60.1, 2.6, 2.2);
cam(wt(34, 'Сопротивление') - .2, 12, 52, .95, 1.8);
year(wt(34, 'сорок'), 1943.1, 'ФЕВРАЛЬ 1943');
stampAt({ t: wt(34, 'реальности'), off: wt(34, 'Сопротивление'), label: 'КАК БЫЛО', col: PAL.blue, x: 400, y: 300, size: 56, w: 380, h: 110 });
lab('Веморк', 8.5, 59.87, wt(34, 'Веморке') - .4, wt(34, 'Сопротивление'));
const tBoom = wt(34, 'взорвали') + .2;
act(wt(34, 'диверсанты') - .5, wt(34, 'Сопротивление') + .3, t => { const [x, y] = S(8.5, 59.87); const burnt = t > tBoom;
  push(); translate(x + 40, y + 20); if (burnt) translate((hash(Math.floor(t * 24)) - .5) * 10 * (1 - seg(t, tBoom, tBoom + .6)), 0); scale(.8); I.factory(burnt ? '#3e3a36' : '#8a6a55'); pop();
  if (burnt) { const u = seg(t, tBoom, tBoom + 1.2); for (let k = 0; k < 8; k++) dot(x + 40 + Math.cos(k) * 90 * u, y - 10 + Math.sin(k * 1.7) * 60 * u - 60 * u, 40 * (1 - u) + 6, k % 2 ? 'rgba(255,138,42,.8)' : 'rgba(60,60,60,.6)'); }
  for (let i = 0; i < 3; i++) { const u = eio(seg(t, wt(34, 'диверсанты') - .5 + i * .2, tBoom - .4)); const [sx, sy] = S(lerp(6.6, 8.2, u), 59.7 + i * .12); if (t > tBoom + .3) continue; push(); translate(sx, sy); puppet({ side: 'sab', x: 0, y: 0, s: .14, t: q(t), mood: 'deadpan', ...walk(t) }); pop(); } });
shake(tBoom, 18, .5); ev(tBoom, 'boom');
note({ t: wt(34, 'тяжёлую'), off: wt(34, 'Сопротивление'), x: 1480, y: 300, w: 480, h: 110, lines: [{ t: 'ТЯЖЁЛАЯ ВОДА', f: '400 52px "Russo One"', c: PAL.blue }] });
for (const [lon, lat, i] of [[2.5, 47, 0], [20, 51.5, 1], [18.5, 44, 2], [10, 60.5, 3], [28, 53.6, 4]]) { const t0 = wt(34, 'Сопротивление') + .4 + i * .25; act(t0, L1(34) + .3, t => { const [x, y] = S(lon, lat); push(); translate(x, y); scale(.6 * pop01(t, t0)); I.spark(t, i); pop(); }); }

// l035 — Trinity (a sheet: the desert at dawn)
sheet(L0(35) - .25, L1(35) + .5, (t) => {
  const T = w => wt(35, w), tB = T('взрывается') + .25;
  const sky = g.createLinearGradient(0, 0, 0, 700); sky.addColorStop(0, '#1c2a5a'); sky.addColorStop(1, '#e7915a'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = sky; g.fillRect(0, 0, W, 700);
  reset(); shape([[0, 640], [300, 560], [520, 610], [800, 540], [1100, 620], [1400, 560], [1700, 600], [1920, 570], [1920, 700], [0, 700]], { fill: '#6b4a5a', lw: 6 });
  fillOnly(rect(0, 690, W, 400), '#c98a5a', { boil: 0 }); stroke([[0, 690], [W, 690]], 7);
  stroke([[960, 690], [960, 560]], 8); stroke([[930, 690], [960, 560], [990, 690]], 5);
  push(); translate(400, 160); scale(pop01(t, T('Нью'))); I.card(460, 100, [{ t: 'НЬЮ-МЕКСИКО', f: '400 50px "Russo One"', c: INK }], { clip: false }); pop();
  if (t > tB) { const u = eo(seg(t, tB, tB + 3.5)); push(); translate(960, 690); scale(1.6); I.mushroom(u); pop(); }
  if (t > tB) { const f = 1 - seg(t, tB, tB + .9); if (f > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(255,252,240,${f})`; g.fillRect(0, 0, W, H); } }
});
year(wt(35, 'Шестнадцатого'), 1945.54, '16 ИЮЛЯ 1945');
ev(wt(35, 'взрывается') + .25, 'nuke');

// l036 — the cold war across the Atlantic; the wall
cam(L1(35) - .3, -42, 46, .54, .01);
year(wt(36, 'холодная'), 1946.2, 'ПОСЛЕ 1945');
pup('us', -95, 38, L0(36) - .3, L1(37) + .3, { s: .3, f: t => ({ mood: 'deadpan', tag: true, armR: { h: [60, -170], bend: 20 }, look: [.6, 0] }) });
slam(wt(36, 'противник') - .1, wt(36, 'Начинается') - .25, 'de', { mood: 'shock', nerv: 1, look: [-.6, 0] });
pup('de', 8, 47.5, wt(36, 'Начинается') - .3, L1(36) + .3, { s: .3, face: -1, f: t => ({ mood: 'panic', nerv: .4, look: [-.6, 0] }) });
note({ t: wt(36, 'холодная'), off: wt(36, 'между') - .2, x: 960, y: 300, w: 560, h: 110, lines: [{ t: 'ХОЛОДНАЯ ВОЙНА', f: '400 56px "Russo One"', c: PAL.blue }] });
note({ t: wt(36, 'Москвой'), off: L1(36), x: 700, y: 760, w: 620, h: 100, lines: [{ t: 'МОСКВА — ВАШИНГТОН', f: '400 38px "Russo One"', c: '#6e716a' }] });
xout(wt(36, 'Москвой') + .5, 700, 760, 560, 80, { off: L1(36) });
note({ t: wt(36, 'Берлином'), off: L1(36) + .3, x: 1260, y: 300, w: 560, h: 110, lines: [{ t: 'БЕРЛИН — ВАШИНГТОН', f: '400 42px "Russo One"', c: PAL.redD }] });
act(wt(36, 'стеной') - .3, L1(37) + .2, t => { const u = eo(seg(t, wt(36, 'стеной') - .3, wt(36, 'стеной') + .9)); const [x0, y0] = S(-31, 70), [x1, y1] = S(-31, 16); const w = 44, top = lerp(y1, y0, u);
  shape([[x0 - w / 2, y1], [x0 - w / 2, top], [x0 + w / 2, top], [x0 + w / 2, y1]], { fill: '#8b8e86', lw: 6 }); for (let y = y1 - 30; y > top; y -= 30) stroke([[x0 - w / 2, y], [x0 + w / 2, y]], 3, { line: '#6e716a' }); });
ev(wt(36, 'стеной'), 'wall');

// l037 — the arms race (a split sheet)
sheet(L0(37) - .25, L1(37) + .3, (t) => {
  const T = w => wt(37, w);
  fillOnly(rect(0, 0, 960, H), '#dfe6f2', { boil: 0 }); fillOnly(rect(960, 0, 960, H), '#e6e3da', { boil: 0 }); stroke([[960, 0], [960, H]], 8);
  text('США', 480, 230, { font: '400 60px "Russo One"', fill: PAL.blue }); text('РЕЙХ', 1440, 230, { font: '400 60px "Russo One"', fill: '#3e4238' });
  push(); translate(480, 430); scale(2 * pop01(t, L0(37))); I.bomb(); pop();
  const tl = T('ракетами'), up = eo(seg(t, tl, tl + 1.6)); push(); translate(1440, lerp(620, 450, up)); scale(1.8 * pop01(t, tl - .2)); I.rocket(); pop();
  if (up > 0 && up < 1) for (let k = 0; k < 6; k++) dot(1440 + Math.sin(k * 3 + t * 9) * 16, lerp(620, 450, up) + 110 + k * 22, 18 - k * 2, k % 2 ? PAL.fire : '#888');
  if (t > T('Фау')) { push(); translate(1440, 760); scale(pop01(t, T('Фау'))); I.card(620, 150, [{ t: 'ФАУ-2 · КАК БЫЛО', f: '900 30px Nunito', c: PAL.blue, lh: 48 }, { t: 'первая баллистическая ракета', f: '900 32px Nunito', lh: 48 }], { clip: false }); pop(); }
  const tr = T('гонка'); if (t > tr) { const u = seg(t, tr, T('угрозой')); const hA = 80 + 300 * (u + .08 * Math.sin(u * 20)), hB = 80 + 300 * (u + .08 * Math.cos(u * 20 + 1));
    fillOnly(rr(760, 900 - hA, 90, hA, 10), PAL.blue, { boil: .2 }); fillOnly(rr(1070, 900 - hB, 90, hB, 10), '#6f7564', { boil: .2 }); stroke([[700, 900], [1220, 900]], 6); }
  const th = T('угрозой'); if (t > th) { const a = ss(seg(t, th, th + 1)); fillOnly(rect(0, 0, W, H), `rgba(140,20,30,${.25 * a * (.8 + .2 * Math.sin(t * 6))})`, { boil: 0 });
    push(); translate(960, 470); scale(a); shape(ell(0, 0, 150, 150, 60), { fill: '#f4ead2', lw: 9 }); for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; stroke([[Math.cos(an) * 120, Math.sin(an) * 120], [Math.cos(an) * 138, Math.sin(an) * 138]], 6); }
    stroke([[0, 0], [0, -105]], 10); const m = -Math.PI / 2 - .25 + .2 * seg(t, th, L1(37)); stroke([[0, 0], [Math.cos(m) * 120, Math.sin(m) * 120]], 7, { line: PAL.red }); pop(); }
});
year(wt(37, 'ракетами'), 1950, '1950-е');
ev(wt(37, 'ракетами'), 'launch'); ev(wt(37, 'угрозой'), 'hit');

// ═══════════ ГЛАВА 7 · ПОЧЕМУ ИМПЕРИЯ РУШИТСЯ ═══════════
chap(38, 7, 'ПОЧЕМУ ИМПЕРИЯ РУШИТСЯ');
cam(L1(38) - .3, 19, 51.5, .82, .01);
setCrack(t => eo(seg(t, wt(39, 'существовать'), wt(39, 'существовать') + 2.5)) * (t < wt(42, 'распалась') + 4 ? 1 : 0));
ev(wt(39, 'существовать'), 'crack');
[['Бесконечная', 'БЕСКОНЕЧНАЯ ВОЙНА НА ВОСТОКЕ', 330], ['Восстания', 'ВОССТАНИЯ ПО ВСЕЙ ЕВРОПЕ', 960], ['Экономика', 'ЭКОНОМИКА НА СТРАХЕ', 1590]].forEach(([w, s, x], i) =>
  note({ t: wt(39, w), off: L1(39) + .3, x, y: 830, w: 560, h: 110, tilt: (i - 1) * .02, lines: [{ t: s, f: '400 32px "Russo One"', c: PAL.redD }] }));
dline([[45.2, 63], [45.8, 59], [46, 55], [46.2, 51], [47, 47]], wt(39, 'Бесконечная'), 1, { off: L1(39) + .3, dash: 0, col: PAL.red, w: 12, jag: 7 });
for (const [lon, lat, i] of [[2.5, 47, 0], [20, 51.5, 1], [18.5, 44, 2], [10, 60.5, 3], [28, 53.6, 4], [24, 49, 5], [5, 52, 6]]) { const t0 = wt(39, 'Восстания') + i * .15; act(t0, L1(39) + .3, t => { const [x, y] = S(lon, lat); push(); translate(x, y); scale(.55 * pop01(t, t0)); I.spark(t, i); pop(); }); }
ev(wt(39, 'Восстания'), 'fire');
act(wt(39, 'Экономика'), L1(39) + .3, t => { const [x, y] = S(11, 51.5); push(); translate(x, y - 40); scale(.7 * pop01(t, wt(39, 'Экономика'))); I.gear(60, 8, '#9aa1ac', Math.sin(t * 3) * .2); stroke([[-30, -50], [10, 0], [-10, 20], [30, 60]], 7, { line: INK }); pop(); });
year(L0(39), 1955, '1950-е');

// l040 — technology and the economy gap (a chart sheet)
sheet(L0(40) - .25, L1(40) + .3, (t) => {
  const T = w => wt(40, w); paperGrid();
  push(); translate(500, 215); scale(pop01(t, T('Технологии'))); I.card(620, 100, [{ t: 'ТЕХНОЛОГИИ ПРОТИВ РЕЙХА', f: '400 40px "Russo One"', c: PAL.redD }], { clip: false }); pop();
  if (t > T('Учёные')) for (let i = 0; i < 5; i++) { const u = seg(t, T('бегут') + i * .2, T('бегут') + i * .2 + 2.5); push(); translate(lerp(260 + i * 70, -120, eio(u)), 420); scale(1.1 * pop01(t, T('Учёные') + i * .1)); I.person('#e9e4da'); pop();
    if (u < .1) { dot(260 + i * 70, 340, 14, t > T('открытий') ? '#777' : PAL.goldL); } }
  const te = T('Американская'); if (t > te) { const u = eo(seg(t, te, te + 1.2)); fillOnly(rr(300, 900 - 380 * u, 140, 380 * u, 10), PAL.blue, { boil: .2 }); fillOnly(rr(500, 900 - 120 * u, 140, 120 * u, 10), '#6f7564', { boil: .2 });
    stroke([[260, 900], [700, 900]], 6); text('США', 370, 940, { font: '400 32px "Russo One"', fill: PAL.blue }); text('РЕЙХ', 570, 940, { font: '400 32px "Russo One"', fill: '#3e4238' });
    if (t > T('раз')) { push(); translate(480, 440); scale(pop01(t, T('раз'))); I.card(420, 80, [{ t: 'в несколько раз', f: '900 34px Nunito', c: PAL.blue }], { clip: false, pin: false }); pop(); } }
  const tr = T('разрыв'); if (t > tr) { const u = seg(t, tr, L1(40)); stroke([[900, 900], [1800, 900]], 6); stroke([[900, 900], [900, 300]], 6);
    for (const y of [1945, 1950, 1955, 1960]) text(String(y), 900 + (y - 1945) * 60, 940, { font: '900 26px Nunito' });
    const ptsA = [], ptsB = []; for (let i = 0; i <= 40 * u; i++) { const x = i / 40; ptsA.push([900 + x * 900, 800 - x * x * 420 - x * 60]); ptsB.push([900 + x * 900, 840 - x * 90]); }
    if (ptsA.length > 1) { stroke(ptsA, 10, { line: PAL.blue }); stroke(ptsB, 10, { line: '#6f7564' }); }
    if (u > .8) { const x = 1800; stroke([[x - 20, 840 - 90], [x - 20, 800 - 480]], 4, { line: PAL.red }); text('РАЗРЫВ', x - 110, 560, { font: '400 34px "Russo One"', fill: PAL.red }); } }
});
ev(wt(40, 'Американская'), 'pop'); ev(wt(40, 'разрыв'), 'draw');

// l041 — after the leader? (an empty chair under a spotlight)
sheet(L0(41) - .25, L1(41) + .3, (t) => {
  const T = w => wt(41, w);
  fillOnly(rect(0, 0, W, H), '#141018', { boil: 0 });
  g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createRadialGradient(960, 620, 40, 960, 620, 520); gr.addColorStop(0, 'rgba(255,240,200,.45)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  reset(); fillOnly(ell(960, 830, 380, 60, 40), 'rgba(255,240,200,.25)', { boil: .2 });
  const tug = seg(t, T('борьбе'), L1(41)), pull = Math.sin(q(t) * 9) * 20 * tug;
  push(); translate(960 + pull, 760); scale(1.6); I.chair(); pop();
  if (t > T('вождя')) { push(); translate(960, 300); scale(pop01(t, T('вождя'))); text('?', 0, 0, { font: '400 260px "Russo One"', fill: PAL.goldL }); pop(); }
  if (t > T('изнутри')) { const u = eo(seg(t, T('изнутри'), T('изнутри') + .8)); stroke([[960, 900], [900, 960 * 1 - 20 + 40 * u], [820, 1000 * u + 40]], 6, { line: '#888' }); stroke([[960, 900], [1040, 960], [1130, 900 + 120 * u]], 6, { line: '#888' }); }
  if (tug > 0) for (const s of [-1, 1]) puppet({ side: 'gr', x: 960 + s * (320 + 30 * tug), y: 880, s: .5, face: -s, t: q(t), mood: 'panic', lean: s * -.2, armR: { h: [150, -40], bend: 0 }, armL: { h: [120, -60], bend: 0 }, nerv: .5 });
}, { bg: '#141018' });
ev(wt(41, 'вождя'), 'hit'); ev(wt(41, 'изнутри'), 'crack');

// l042 — it falls apart; years tick by
cam(L0(42) - .3, 19, 51.5, .82, .01);
year(wt(42, 'десять'), 1955, '+10 ЛЕТ'); year(wt(42, 'двадцать'), 1965, '+20 ЛЕТ'); year(wt(42, 'тридцать'), 1975, '+30 ЛЕТ');
const tFall = wt(42, 'распалась');
peelAll(tFall - .2, .22);
note({ t: wt(42, 'ценой'), off: L1(42) + .4, x: 960, y: 300, w: 560, h: 110, soft: true, lines: [{ t: 'КАКОЙ ЦЕНОЙ?', f: '400 56px "Russo One"', c: PAL.redD }] });
tint(wt(42, 'ценой'), L1(42) + .3, '#0d0a18', .3);

// l043 — what really happened
mode(wt(43, 'Реальная'), DUR, 'real');
cam(L0(43) - .2, 15, 51.5, .92, 1.5);
stampAt({ t: wt(43, 'Реальная'), off: wt(43, 'Британия'), label: 'КАК БЫЛО', col: PAL.blue, x: 960, y: 470, size: 84, w: 600, h: 150 });
pup('gb', -1.6, 52.6, wt(43, 'Британия'), wt(43, 'Вторая'), { s: .28, f: t => ({ mood: 'smug', umbrella: 1, armR: { h: [10, -40], bend: 0 } }) });
pup('su', 39.5, 55.5, wt(43, 'Москва'), wt(43, 'Вторая'), { s: .28, f: t => ({ mood: 'deadpan', armR: { h: [40, -200], bend: 0 } }) });
lab('Москва', 37.6, 55.75, wt(43, 'Москва'), wt(43, 'Вторая')); lab('Лондон', -.13, 51.5, wt(43, 'Британия'), wt(43, 'Вторая'));
year(wt(43, 'сорок'), 1945.35, 'МАЙ 1945');
note({ t: wt(43, 'поражением'), off: wt(43, 'Вторая') - .1, x: 960, y: 820, w: 760, h: 110, lines: [{ t: 'ВОЙНА В ЕВРОПЕ ОКОНЧЕНА', f: '400 48px "Russo One"', c: PAL.blue }] });
tint(wt(43, 'Вторая'), wt(43, 'Победа'), '#0d0a18', .45);
note({ t: wt(43, 'Вторая'), off: wt(43, 'Победа'), x: 960, y: 330, w: 640, h: 100, soft: true, lines: [{ t: 'ВТОРАЯ МИРОВАЯ ВОЙНА', f: '400 44px "Russo One"', c: INK }] });
counter({ t: wt(43, 'семидесяти'), to: 0, soft: true, fmt: () => '70–85 МЛН', label: 'ПОГИБШИХ · ПО РАЗНЫМ ОЦЕНКАМ', x: 960, y: 560, size: 96, off: wt(43, 'Победа') });
setGreyF(t => 1 - ss(seg(t, wt(43, 'открыла'), wt(43, 'открыла') + 3)));
tint(wt(43, 'открыла'), L1(43) + .5, '#ffd98a', .18);
cam(wt(43, 'открыла'), 15, 50, .8, 4);

// l044 — the question and the subscribe button (the fork returns)
sheet(L0(44) - .25, DUR + 1, (t) => {
  const T = w => wt(44, w); paperGrid();
  fork(t, L0(44) - .2, L0(44) + .4, { down: 'на какой развилке?', dy: -110 });
  push(); translate(960, 160); scale(pop01(t, T('думаешь'))); head('А ТЫ КАК ДУМАЕШЬ?', 0, 84, PAL.redD); pop();
  if (t > T('Напиши')) { push(); translate(470, 850); scale(pop01(t, T('Напиши'))); shape(spline([[-270, -60], [270, -60], [290, 40], [-60, 50], [-130, 104], [-120, 50], [-290, 40]]), { fill: '#fff', lw: 7 }); text('НАПИШИ В КОММЕНТАРИЯХ', 0, -6, { font: '900 34px Nunito' }); pop(); }
  const ts = T('подпишись'); if (t > ts) { const clk = t > ts + 1.1, p = pop01(t, ts);
    push(); translate(1400, 840); scale(p * (t > ts + 1 && t < ts + 1.2 ? .92 : 1)); shape(rr(-230, -55, 460, 110, 55), { fill: clk ? '#6e716a' : '#d4202a', lw: 7 }); text(clk ? 'ВЫ ПОДПИСАНЫ ✓' : 'ПОДПИСАТЬСЯ', 0, 2, { font: '400 44px "Russo One"', fill: '#fff' }); pop();
    text('канал «А что если?»', 1400, 930, { font: '900 32px Nunito' });
    const u = eio(seg(t, ts + .2, ts + 1)); push(); translate(lerp(1760, 1450, u), lerp(1060, 860, u)); shape([[0, 0], [0, 60], [16, 46], [30, 74], [42, 68], [28, 42], [48, 40]], { fill: '#fff', lw: 5 }); pop(); }
}, { noTL: true });
ev(wt(44, 'думаешь'), 'pop'); ev(wt(44, 'подпишись') + 1.1, 'click');

finish();
window.__MISS = MISS;
