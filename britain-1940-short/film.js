// «Британия была в шаге от мира» — Shorts 1080×1920, cut to the voice. A teaser for the documentary «Что если бы Германия выиграла войну».
// Real history (May 26–28, 1940: the War Cabinet debate on asking Italy to mediate) is marked «КАК БЫЛО»; the closing question «ЧТО ЕСЛИ».
// Puppets personify sides; the two Cabinet puppets carry name tags only — no likeness of real people, no symbols.
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import { g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, reset } from './toon.js';
import { puppet } from './countries.js';
import { W, H, INK, I, PAL, C, q, wt, L0, L1, S, cam, shake, tint, defPatch, patchOn, arrow, ring, lab, fx, note, stampAt, sheet, slam, year, mode, pop01, fadeIO, ev, finish, DUR } from './core.js';

defPatch('france', [[-4.6, 48.5], [-1.5, 43.4], [-.2, 43.6], [0, 46.6], [1.5, 46.8], [3, 46.6], [4.5, 46.3], [6, 46.4], [7.6, 47.6], [8.2, 49], [6.2, 49.4], [4.2, 50], [2.5, 51.1], [1.5, 50.9]]);
const act = (t0, t1, f) => fx(t0, t1, f, 1);
const pup = (side, lon, lat, t0, t1, o = {}) => act(t0 - .01, t1 + .3, t => {
  const p = pop01(t, t0) * (1 - ei(seg(t, t1, t1 + .3))); if (p <= 0) return;
  const [x, y] = o.at ? o.at(t) : S(lon, lat), ex = o.f ? o.f(t) : {};
  puppet({ side, x, y, s: (o.s ?? .4) * p, face: o.face ?? 1, t: q(t), mood: 'deadpan', ...ex });
});
const big = (s, x, y, size, col = INK) => text(s, x, y, { font: `400 ${size}px "Russo One"`, fill: col });

// ═══ l001 — the hook: Britain almost gave in ═══
cam(0, -1.5, 52.8, 2.4, .01);
cam(.2, -1.2, 52.4, 2.9, 6.8);
tint(0, L1(1) + .3, '#0d0a18', .35);
year(wt(1, 'мае'), 1940.4, 'МАЙ 1940');
mode(wt(1, 'Британия'), wt(6, 'если'), 'real');
pup('gb', -.6, 51.9, .15, L1(2) - 1, { s: .42, f: t => ({ mood: t > wt(1, 'сдалась') ? 'panic' : 'deadpan', nerv: t > wt(1, 'сдалась') ? .8 : 0, look: [.6, -.1], headTilt: t > wt(1, 'сдалась') ? -.08 : 0 }) });
note({ t: .1, off: wt(1, 'никто') + 1.6, x: 540, y: 560, w: 900, h: 260, tilt: -.03, lines: [{ t: 'БРИТАНИЯ', f: '400 92px "Russo One"', c: INK, lh: 104 }, { t: 'ЧУТЬ НЕ СДАЛАСЬ', f: '400 80px "Russo One"', c: PAL.redD, lh: 96 }] });
stampAt({ t: wt(1, 'никто'), off: L1(1) + .3, label: 'ПОЧТИ НИКТО', sub: 'НЕ ЗНАЕТ', col: PAL.red, x: 560, y: 1250, size: 64, w: 600, h: 170, rot: .05 });

// ═══ l002 — France collapses, Dunkirk ═══
cam(L0(2) - .4, 2.2, 50.4, 1.8, 1.4);
patchOn('france', wt(2, 'рушится') + .1);
lab('Франция', 2.2, 47.6, wt(2, 'Франция'), L1(2), { nodot: true, size: 44 });
arrow([[8, 50.3], [6.4, 49.95], [5, 49.7], [3.6, 50.0], [2.3, 50.12], [1.55, 50.2]], wt(2, 'рушится') + .2, 1.6, { off: L1(2), w: 30, icon: 'tank', is: .7 });
ring(2.45, 51.0, 170, wt(2, 'прижата'), 1.2, { off: L1(2) });
lab('Дюнкерк', 2.37, 51.03, wt(2, 'Дюнкерка'), L1(2), { size: 44 });
pup('gb', 2.6, 50.85, wt(2, 'армия') - .1, L1(2), { s: .36, f: t => ({ mood: 'panic', nerv: .8, sq: .92 }) });
slam(wt(2, 'кончено') - .05, L0(3) - .2, 'gb', { mood: 'panic', nerv: 1, look: [0, -.2] });

// ═══ l003–l005 — the War Cabinet, 26–28 May 1940 (one sheet) ═══
const tK = wt(3, 'кабинет'), tHal = wt(3, 'Галифакс'), tIt = wt(3, 'Италию'), tUsl = wt(3, 'условия'), tDays = wt(4, 'Три'), tDoor = wt(4, 'закрытыми'), tCh = wt(4, 'Черчилль'), tVs = wt(4, 'против');
const t28 = wt(5, 'Двадцать'), tMin = wt(5, 'министрам'), tUp = wt(5, 'встают'), tNo = wt(5, 'Переговоров');
year(wt(3, 'Двадцать'), 1940.4, '26 МАЯ 1940'); year(tDays + .6, 1940.41, '27 МАЯ 1940'); year(t28, 1940.42, '28 МАЯ 1940');
sheet(L0(3) + .25, L1(5) + .3, (t) => {
  fillOnly(rect(0, 0, W, H), '#6c1427', { boil: 0 }); for (let x = 30; x < W; x += 150) fillOnly(rect(x, 0, 70, 1300), '#5a1020', { boil: .2 });
  // the door at the back closes on «закрытыми»
  const dc = eo(seg(t, tDoor - .2, tDoor + .5));
  shape(rr(390, 420, 300, 560, 8), { fill: '#2a1410', lw: 7 }); shape(rr(390, 420, 150 * dc + 2, 560, 6), { fill: '#7a4a2a', lw: 6 }); shape(rr(690 - 150 * dc - 2, 420, 150 * dc + 2, 560, 6), { fill: '#7a4a2a', lw: 6 });
  shape(rr(-40, 1240, W + 80, 70, 10), { fill: '#5a3423', lw: 7 }); fillOnly(rect(0, 1310, W, 700), '#45281a', { boil: 0 });
  push(); translate(540, 330); scale(pop01(t, tK)); I.card(760, 110, [{ t: 'ВОЕННЫЙ КАБИНЕТ · ЛОНДОН', f: '400 44px "Russo One"', c: INK }], { clip: false }); pop();
  // ministers rise behind the table (May 28)
  if (t > tMin) for (let i = 0; i < 7; i++) { const p = pop01(t, tMin + i * .08), up = eo(seg(t, tUp + i * .05, tUp + i * .05 + .4)); push(); translate(120 + i * 140, 1200 - up * 70); scale(1.3 * p); I.person(['#2c2f3a', '#3a3d50', '#2a2a30'][i % 3]); pop(); }
  // Halifax (left) and Churchill (right): generic puppets with name tags
  const argue = t > tDays && t < tVs, sw = argue ? Math.sin(q(t) * 6) : 0;
  puppet({ side: 'gb', x: 250, y: 1250, s: .55 * pop01(t, tK), t: q(t), mood: t > tNo ? 'shock' : t > tHal && t < tVs ? 'smug' : 'deadpan', look: [.6, 0], armR: sw > 0 || (t > tHal && t < tDays) ? { h: [150, -120], bend: 10 } : undefined, umbrella: 0 });
  puppet({ side: 'gb', x: 830, y: 1250, s: .58 * pop01(t, tK + .15), face: -1, t: q(t), mood: t > tVs ? 'smug' : argue ? 'panic' : 'deadpan', nerv: argue ? .3 : 0, look: [.6, 0],
    umbrella: t > tVs ? 1 : 0, armR: t > tVs ? { h: [10, -40], bend: 0 } : sw < 0 ? { h: [150, -120], bend: 10 } : undefined });
  if (t > tHal) { push(); translate(250, 1295); scale(pop01(t, tHal)); I.card(330, 70, [{ t: 'ГАЛИФАКС', f: '400 38px "Russo One"', c: INK }], { clip: false, pin: false }); pop(); }
  if (t > tCh) { push(); translate(830, 1295); scale(pop01(t, tCh)); I.card(330, 70, [{ t: 'ЧЕРЧИЛЛЬ', f: '400 38px "Russo One"', c: INK }], { clip: false, pin: false }); pop(); }
  // Italy as the go-between, then the question on paper
  const itOut = seg(t, tNo, tNo + .8);
  if (t > tIt && itOut < 1) { puppet({ side: 'it', x: 540 + itOut * 700, y: 1240, s: .4 * pop01(t, tIt), t: q(t), mood: 'smug', look: [.3, 0] });
    push(); translate(540 + itOut * 700, 760); scale(pop01(t, tIt + .2)); I.card(400, 110, [{ t: 'ПОСРЕДНИК', f: '900 30px Nunito', c: '#4f6b55', lh: 44 }, { t: 'ИТАЛИЯ', f: '400 44px "Russo One"', lh: 56 }], { clip: false, pin: false }); pop(); }
  if (t > tUsl) { const out = ei(seg(t, tNo + .9, tNo + 1.6)); push(); translate(450, 560 - out * 900); rotate(-.03); scale(pop01(t, tUsl)); I.card(700, 210, [{ t: 'УСЛОВИЯ МИРА', f: '400 58px "Russo One"', lh: 80 }, { t: 'С ГЕРМАНИЕЙ?', f: '400 58px "Russo One"', c: PAL.redD, lh: 80 }]); pop();
    if (t > tNo) { push(); translate(460, 560 - out * 900); rotate(-.1); scale(1.05 * (1 + .6 * (1 - eo(seg(t, tNo, tNo + .16))))); I.stamp('ОТКЛОНЕНО', PAL.blue, { w: 560, h: 150, size: 80, a: seg(t, tNo, tNo + .06) }); pop(); } }
  // three days of argument: a calendar flips 26 → 27 → 28
  if (t > tDays && t < t28 + 1.5) { const d = t < tDays + .6 ? 26 : t < t28 ? 27 : 28, a = fadeIO(t, tDays, t28 + 1.5, .3); g.save(); g.globalAlpha = a; push(); translate(930, 560); rotate(.05); scale(pop01(t, tDays));
    I.card(200, 210, [{ t: 'МАЙ', f: '900 34px Nunito', c: PAL.red, lh: 50 }, { t: String(d), f: '400 110px "Russo One"', lh: 130 }], { clip: false }); pop(); g.restore(); }
  if (t > tVs) { push(); translate(790, 1080); rotate(.08); scale(.72 * (1 + .6 * (1 - eo(seg(t, tVs, tVs + .16))))); I.stamp('ПРОТИВ', PAL.red, { w: 420, h: 130, size: 76, a: seg(t, tVs, tVs + .06) * (1 - seg(t, tMin, tMin + .4)) }); pop(); }
  const v = ss(seg(t, tDoor, tDoor + .8)) * (1 - ss(seg(t, tNo, tNo + .8))); if (v > 0) { g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createRadialGradient(540, 960, 300, 540, 960, 1100); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${.6 * v})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
});
ev(tK, 'card'); ev(tHal, 'pop'); ev(tIt, 'pop'); ev(tUsl, 'card'); ev(tDoor + .3, 'thud'); ev(tCh, 'pop'); ev(tVs, 'stamp'); ev(tMin, 'pop'); ev(tUp, 'crowd'); ev(tNo, 'stamp'); ev(tNo, 'hit');

// ═══ l006 — what if Britain had said yes ═══
mode(wt(6, 'если'), DUR, 'alt');
cam(L0(6) - .4, 6, 51.8, 1.25, .01);
cam(wt(6, 'восток') - .4, 22, 52.5, .85, 1.8);
tint(wt(6, 'если'), wt(6, 'Германия'), '#b8323a', .25);
stampAt({ t: wt(6, 'согласилась'), off: wt(6, 'Германия') + .6, label: 'ЧТО ЕСЛИ?', col: PAL.red, x: 540, y: 620, size: 96, w: 640, h: 180, sc: 1.1 });
pup('gb', -1.6, 52.6, L0(6), wt(6, 'восток'), { s: .38, f: t => ({ mood: 'deadpan', headTilt: .1, armR: { h: [110, -60], bend: 30 }, armL: { h: [-110, -60], bend: -30 } }) });
pup('de', 11, 51, wt(6, 'Германия') - .1, L1(6) + .3, { s: .42, f: t => ({ mood: 'smug', look: [.6, 0], armR: t > wt(6, 'восток') ? { h: [170, -150], bend: 10 } : undefined }) });
note({ t: wt(6, 'тыл'), off: wt(6, 'восток') + .3, x: 540, y: 560, w: 760, h: 140, lines: [{ t: '✓ СПОКОЙНЫЙ ТЫЛ', f: '400 62px "Russo One"', c: '#2f6b3a' }] });
for (const [pts, d] of [[[[14.5, 54.2], [20, 55.5], [26, 57.5], [30, 59.4]], 0], [[[15, 52.3], [22, 53], [29, 54.3], [36.5, 55.6]], .2], [[[15, 50.3], [22, 50.2], [28, 50], [34, 48.5]], .4]]) arrow(pts, wt(6, 'восток') + d, 1.6, { w: 28, off: L1(6) + .3 });
shake(wt(6, 'восток') + .3, 10);
lab('Москва', 37.6, 55.75, wt(6, 'восток') + 1, L1(6) + .3, { size: 44 });

// ═══ l007 — the full film ═══
sheet(L0(7) - .2, DUR + 1, (t) => {
  fillOnly(rect(0, 0, W, H), PAL.blueD, { boil: 0 });
  for (let i = 0; i < 26; i++) stroke([[0, i * 80 + 20], [W, i * 80 + 50]], 3, { line: '#26386f' });
  const p = pop01(t, L0(7)), tc = wt(7, 'канале');
  push(); translate(540, 760); rotate(-.025); scale(p);
  I.card(920, 760, [{ t: 'ПОЛНЫЙ ФИЛЬМ · 10 МИНУТ', f: '900 38px Nunito', c: PAL.red, lh: 90 }, { t: 'ЧТО ЕСЛИ БЫ', f: '400 76px "Russo One"', lh: 92 }, { t: 'ГЕРМАНИЯ', f: '400 76px "Russo One"', lh: 92 }, { t: 'ВЫИГРАЛА ВОЙНУ?', f: '400 76px "Russo One"', c: PAL.redD, lh: 92 }, { t: '', lh: 240 }]);
  const pl = 1 + .06 * Math.sin(t * 6); push(); translate(0, 230); scale(pl); shape(ell(0, 0, 90, 90, 40), { fill: '#d4202a', lw: 7 }); shape([[-28, -42], [-28, 42], [44, 0]], { fill: '#fff', lw: 5 }); pop();
  pop();
  if (t > tc) { push(); translate(540, 280); scale(pop01(t, tc)); big('КАНАЛ «А ЧТО ЕСЛИ?»', 0, 0, 60, '#fff'); pop(); }
  if (t > wt(7, 'смотри')) { const b = Math.sin(t * 7) * 14; push(); translate(540, 1240 + b); scale(pop01(t, wt(7, 'смотри'))); I.card(720, 110, [{ t: '↓ ССЫЛКА НА ФИЛЬМ НИЖЕ', f: '400 44px "Russo One"', c: PAL.redD }], { clip: false, pin: false }); pop(); }
}, { noTL: true, bg: PAL.blueD });
ev(L0(7), 'whoosh'); ev(wt(7, 'смотри'), 'pop'); ev(wt(7, 'канале'), 'hit');

finish();
