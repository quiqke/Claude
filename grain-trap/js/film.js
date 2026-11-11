// «Зерновая ловушка» — Whiteboard Explainer, vertical 1080×1920. One continuous board, no hands.
// Times are seconds. Line starts (VO) come from voice/dur.json + the pause plan below; visuals hang off spoken words.
import * as W from './wb.js';
import { clamp, lerp, TAU, mulberry } from '/core/lib.js';

export const SW = 1080, SH = 1920;
W.setScreen(SW, SH);
const { INK } = W;
const RED = '#d0453a';
export const BPM = 96, BEAT = 60 / BPM;

// pauses after a line (default .35 s); the long ones are the planned silences (TREATMENT §6)
const GAP = { l03: .7, l08: 1.4, l10: .6, l16: .6, l17: .9, l21: .7, l23: .8 };
const START = .5, TAIL = 3.4;

export async function build() {
  await W.loadFont('tech', 'fonts/hershey-cyr.json');
  const dur = await (await fetch('voice/dur.json')).json();
  const lines = await (await fetch('lines.json')).json();
  const VO = {}; let t = START;
  for (const L of lines) { VO[L.id] = +t.toFixed(3); t += dur[L.id] + (GAP[L.id] ?? .35); }
  const END = +(VO.l25 + dur.l25 + TAIL).toFixed(2);
  const LN = Object.fromEntries(lines.map(L => [L.id, L]));
  // time of a fraction of a line, or of the start of a word (by its character position in the spoken text)
  const F = (id, f) => VO[id] + dur[id] * f;
  const AT = (id, word, k = 0) => {
    const s = (LN[id].say || LN[id].text).toLowerCase(); let i = -1;
    for (let n = 0; n <= k; n++) { i = s.indexOf(word.toLowerCase(), i + 1); if (i < 0) throw new Error(`"${word}" not in ${id}`); }
    return VO[id] + .03 + (dur[id] - .1) * (i / s.length);
  };
  const Q = x => Math.round(x / BEAT) * BEAT;           // snap a hit to the music grid

  const tl = new W.Timeline();
  const PARK = [SW + 330, SH - 250];
  const K = new W.Pen('black', INK.black, { park: [SW + 300, SH * .62] });
  const B = new W.Pen('blue', INK.blue, { park: [SW + 360, SH * .45] });
  const R = new W.Pen('red', RED, { park: [SW + 330, SH * .78] });
  const PENS = [K, B, R];
  const T = (s, x, y, o = {}) => W.text(s, x, y, { spacing: .82, ...o });   // Hershey advances are wide: tighten
  const D = (pen, shapes, t0, t1, o = {}) => tl.draw(pen, shapes, t0, { by: t1, ...o });

  // ───────── drawing kit
  const rot = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
  const dirv = a => [Math.sin(a), Math.cos(a)];          // angle 0 = straight down, + toward +x
  const limb = (p, l1, a1, l2, a2) => { const [dx, dy] = dirv(a1), m = [p[0] + dx * l1, p[1] + dy * l1], [ex, ey] = dirv(a2); return [p, m, [m[0] + ex * l2, m[1] + ey * l2]]; };
  // stick figure, feet on (x, y), height h. o: arms [[a1,a2],[a1,a2]] (left, right), legs [[a1,a2],[a1,a2]], bend (spine), lean, rot, hair, w
  function stick(x, y, h, o = {}) {
    const w = o.w ?? Math.max(5, h * .028), r = h * .11, sc = o.scale ?? 1;
    const hip = [x + (o.lean ?? 0) * h * .1, y - h * .47], bend = o.bend ?? 0;
    const sh = [hip[0] + bend * h * .22 + (o.lean ?? 0) * h * .15, hip[1] - h * .3];
    const neck = [sh[0] + bend * h * .1, sh[1] - h * .04];
    const hd = [neck[0] + bend * h * .1, neck[1] - r * .95];
    const A = o.arms ?? [[-.35, -.2], [.35, .2]], Lg = o.legs ?? [[-.22, -.12], [.22, .12]];
    const ua = h * .17, la = h * .16, ul = h * .24, ll = h * .23;
    let P = {
      head: [hd, r], spine: bend ? [hip, [lerp(hip[0], sh[0], .5) + bend * h * .07, lerp(hip[1], sh[1], .5)], sh, neck] : [hip, neck],
      armL: limb(sh, ua, A[0][0], la, A[0][1]), armR: limb(sh, ua, A[1][0], la, A[1][1]),
      legL: limb(hip, ul, Lg[0][0], ll, Lg[0][1]), legR: limb(hip, ul, Lg[1][0], ll, Lg[1][1]),
    };
    const tr = pts => o.rot ? rot(pts, x, y, o.rot) : pts;
    const so = { w, color: o.color };
    const head = o.rot ? W.circle(...tr([hd])[0], r, so) : W.circle(hd[0], hd[1], r, so);
    const out = [head, W.curve(tr(P.spine), so), W.curve(tr(P.armL), so), W.curve(tr(P.armR), so), W.curve(tr(P.legL), so), W.curve(tr(P.legR), so)];
    if (o.hair) for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * .38, p0 = [hd[0] + Math.cos(a) * r, hd[1] + Math.sin(a) * r], p1 = [hd[0] + Math.cos(a) * r * 1.5, hd[1] + Math.sin(a) * r * 1.55 - 4]; out.push(W.line(...tr([p0])[0], ...tr([p1])[0], { w: w * .8, color: o.color })); }
    out.hand = [tr([P.armL[2]])[0], tr([P.armR[2]])[0]]; out.headAt = tr([hd])[0]; out.r = r;
    return out;
  }
  const spear = (x, y0, y1, o = {}) => { const w = o.w ?? 7; return [W.line(x, y1, x, y0, { w, ...o }), W.poly([[x - 18, y0 + 4], [x, y0 - 60], [x + 18, y0 + 4], [x - 18, y0 + 4]], { w: w * .9, ...o })]; };
  const wheat = (x, y, s = 1, o = {}) => {                // an ear of grain: stem + kernels
    const out = [W.curve([[x, y], [x + 6 * s, y - 60 * s], [x + 4 * s, y - 120 * s]], { w: 7 * s, ...o })];
    for (let k = 0; k < 4; k++) { const yy = y - 70 * s - k * 22 * s; out.push(W.circle(x - 13 * s, yy, 11 * s, { w: 6 * s, ry: 7 * s, ...o }), W.circle(x + 18 * s, yy - 6 * s, 11 * s, { w: 6 * s, ...o })); }
    return out;
  };
  const clock = (x, y, r, o = {}) => [W.circle(x, y, r, { w: 9, ...o }), W.line(x, y, x, y - r * .62, { w: 9, ...o }), W.line(x, y, x + r * .45, y + r * .1, { w: 9, ...o }),
    W.line(x - r * .7, y - r * .78, x - r * .95, y - r * 1.05, { w: 9, ...o }), W.line(x + r * .7, y - r * .78, x + r * .95, y - r * 1.05, { w: 9, ...o })];
  const Z = (x, y, s) => W.poly([[x, y - s], [x + s * .8, y - s], [x, y], [x + s * .8, y]], { w: Math.max(6, s * .12) });
  const fire = (x, y, s = 1, o = {}) => [W.line(x - 90 * s, y + 20 * s, x + 90 * s, y - 20 * s, { w: 11 * s, ...o }), W.line(x - 90 * s, y - 20 * s, x + 90 * s, y + 20 * s, { w: 11 * s, ...o }),
    W.curve([[x - 50 * s, y - 10 * s], [x - 70 * s, y - 80 * s], [x - 20 * s, y - 120 * s], [x - 10 * s, y - 190 * s], [x + 30 * s, y - 120 * s], [x + 60 * s, y - 70 * s], [x + 45 * s, y - 10 * s]], { w: 9 * s, ...o }),
    W.curve([[x - 15 * s, y - 15 * s], [x - 25 * s, y - 60 * s], [x + 5 * s, y - 95 * s], [x + 20 * s, y - 55 * s], [x + 12 * s, y - 15 * s]], { w: 8 * s, ...o })];
  const phone = (x, y, w, h, o = {}) => [W.roundRect(x - w / 2, y - h / 2, w, h, w * .14, { w: 9, ...o }), W.line(x - w * .12, y + h * .4, x + w * .12, y + h * .4, { w: 8, ...o })];
  const bone = (x0, y0, x1, y1, o = {}) => { const w = o.w ?? 9, r = o.knob ?? 13; return [W.line(x0, y0, x1, y1, { w, ...o }), W.circle(x0, y0, r, { w: w * .8, ...o }), W.circle(x1, y1, r, { w: w * .8, ...o })]; };
  function skeleton(x, yFeet, h, o = {}) {               // standing skeleton; bend > 0 = stooped
    const b = o.bend ?? 0, w = o.w ?? 9, sk = h * .085, out = {};
    const hip = [x, yFeet - h * .48], neck = [x + b * h * .2, yFeet - h * .82], skull = [neck[0] + b * h * .12, neck[1] - sk * 1.05];
    const mid = [lerp(hip[0], neck[0], .5) + b * h * .1, lerp(hip[1], neck[1], .5)];
    out.skull = [W.circle(skull[0], skull[1], sk, { w }), W.circle(skull[0] - sk * .38, skull[1] - sk * .05, sk * .2, { w: w * .7 }), W.circle(skull[0] + sk * .38, skull[1] - sk * .05, sk * .2, { w: w * .7 })];
    out.teeth = []; for (let k = -2; k <= 2; k++) out.teeth.push(W.line(skull[0] + k * sk * .2, skull[1] + sk * .62, skull[0] + k * sk * .2, skull[1] + sk * .92, { w: w * .6 }));
    out.spine = [W.curve([hip, mid, neck], { w })];
    out.ribs = []; for (let k = 0; k < 4; k++) { const u = .55 + k * .1, p = [lerp(hip[0], neck[0], u) + b * h * .08, lerp(hip[1], neck[1], u)], rw = h * (.11 - k * .008); out.ribs.push(W.curve([[p[0] - rw, p[1] + rw * .35], [p[0] - rw * .6, p[1] - rw * .12], p, [p[0] + rw * .6, p[1] - rw * .12], [p[0] + rw, p[1] + rw * .35]], { w: w * .75 })); }
    out.pelvis = [W.curve([[hip[0] - h * .08, hip[1] - h * .03], [hip[0], hip[1] + h * .04], [hip[0] + h * .08, hip[1] - h * .03]], { w })];
    const sh = [lerp(hip[0], neck[0], .92) + b * h * .04, lerp(hip[1], neck[1], .92)], sw = h * .11;
    const ua = h * .17, la = h * .16, ul = h * .23, ll = h * .23;
    const arm = (sx, a1, a2) => { const [dx, dy] = dirv(a1), e = [sx + dx * ua, sh[1] + dy * ua], [ex, ey] = dirv(a2); return [...bone(sx, sh[1], e[0], e[1], { w: w * .85, knob: 10 }), ...bone(e[0], e[1], e[0] + ex * la, e[1] + ey * la, { w: w * .85, knob: 10 })]; };
    out.arms = [...arm(sh[0] - sw, -.18 + b * .6, -.1 + b * 1.1), ...arm(sh[0] + sw, .18 + b * .6, .1 + b * 1.1)];
    const leg = (lx, a1, a2) => { const [dx, dy] = dirv(a1), k = [lx + dx * ul, hip[1] + dy * ul], [ex, ey] = dirv(a2); return [...bone(lx, hip[1], k[0], k[1], { w, knob: 12 }), ...bone(k[0], k[1], k[0] + ex * ll, k[1] + ey * ll, { w, knob: 12 })]; };
    out.legs = [...leg(hip[0] - h * .06, -.04 - b * .25, .04 + b * .35), ...leg(hip[0] + h * .06, .04 - b * .25, .06 + b * .35)];
    out.skullAt = skull; out.sk = sk; out.neck = neck; out.hip = hip; out.mid = mid;
    return out;
  }

  // ───────── board layout (world units)
  const BW = 4300, BH = 11500;
  const A = { x: 1100, gY: 1250, trapG: 2600 };            // hook + trap (top left)
  const Bz = { g: 3420, p1: 625, p2: 1525, feet: 4680 };    // dig (middle left)
  const C = { x: 3200 };                                    // stopwatch + week (top right)
  const Dz = { x: 3200, fire: [3200, 4900] };               // campfire (middle right)
  const E = { x: 1100, c: [1100, 6800], rr: 430 };          // the loop (bottom left)
  const Fz = { x: 2700, y0: 6380, y1: 8380 };               // 90 000 hours (bottom right)
  const G = { y: 9700 };                                    // the choice (bottom, full width)

  // ghosts of old lessons, faint, neutral
  const ghosts = [], gR = mulberry(77);
  const gw = ['ДЗ', 'x = 4', 'пн', '→ 12', 'тест', 'ок!', 'стр. 7', '2 + 2'];
  for (let i = 0; i < 70; i++) {
    const x = gR() * (BW - 400) + 200, y = gR() * (BH - 400) + 200, k = gR(), o = { w: 12, alpha: .03 + gR() * .035, color: gR() < .2 ? '#8aa0c8' : '#9aa0a8' };
    if (Math.abs(x - 1100) < 1000 && y > 1700 && y < 2800) continue;   // keep the trap close-up clean
    if (k < .3) ghosts.push(...T(gw[i % gw.length], x, y, { h: 60 + gR() * 50, ...o }));
    else if (k < .55) ghosts.push(W.circle(x, y, 50 + gR() * 120, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 600, y + (gR() - .5) * 400, o));
    else ghosts.push(W.line(x, y, x + 200 + gR() * 600, y + (gR() - .5) * 90, o));
  }

  // ═════════ A. the hook: hunter vs you, the scale of work, and the trap
  // l01 «Пещерный человек с одним лишь копьём работал вдвое меньше, чем ты сегодня, окружённый технологиями.»
  const cave = stick(500, A.gY, 640, { hair: true, arms: [[-.5, -.9], [1.1, 2.0]] });
  D(K, cave, VO.l01 + .05, AT('l01', 'с одним') + .1);
  const [hx, hy] = cave.hand[1];
  D(K, spear(hx, A.gY - 760, A.gY), AT('l01', 'копь') - .1, AT('l01', 'работал'));
  D(K, W.line(180, A.gY + 6, 2000, A.gY + 4, { w: 10 }), AT('l01', 'работал'), AT('l01', 'работал') + .45);
  const you = stick(1300, A.gY, 640, { bend: .35, arms: [[-.3, -.25], [.5, 2.3]] });
  const yh = you.hand[1];
  D(K, you, AT('l01', 'ты сегодня') - .1, AT('l01', 'окруж') + .1);
  D(K, phone(yh[0] + 20, yh[1] - 45, 70, 120), AT('l01', 'окруж') + .1, AT('l01', 'окруж') + .55);
  const desk = [W.line(1530, 1000, 1980, 1000, { w: 10 }), W.line(1560, 1000, 1560, A.gY, { w: 9 }), W.line(1950, 1000, 1950, A.gY, { w: 9 }),
    W.poly([[1620, 990], [1900, 990], [1940, 960], [1660, 960], [1620, 990]], { w: 8 }), W.poly([[1660, 960], [1630, 760], [1880, 760], [1910, 960]], { w: 8 })];
  D(K, desk, AT('l01', 'окруж') + .5, AT('l01', 'технолог') + .2);
  const icons = [  // wifi, envelope, bell, alarm clock (blue = signals)
    W.arc(1050, 680, 50, -2.4, -.75, { w: 9 }), W.arc(1050, 680, 95, -2.4, -.75, { w: 9 }), W.arc(1050, 680, 140, -2.4, -.75, { w: 9 }),
    ...W.rect(1640, 470, 190, 125, { w: 9, over: 4 }), W.poly([[1640, 472], [1735, 545], [1830, 472]], { w: 8 }),
    W.curve([[1820, 790], [1830, 700], [1880, 670], [1930, 700], [1940, 790], [1955, 805], [1805, 805], [1820, 790]], { w: 9 }), W.circle(1880, 825, 13, { w: 8 }),
    ...clock(1000, 900, 70, {}),
  ];
  // the scale of work: two hatched bars under the floor line (17 h vs 40 h)
  const bar = (x0, x1, y, h) => [...W.rect(x0, y, x1 - x0, h, { w: 8, over: 4 }), W.hatch([[x0, y], [x1, y], [x1, y + h], [x0, y + h]], { angle: -1.27, spacing: 24, w: 7 })];
  D(B, bar(360, 680, 1350, 95), AT('l01', 'вдвое') - .15, AT('l01', 'меньше') + .1);
  D(R, bar(1050, 1800, 1350, 95), AT('l01', 'меньше'), AT('l01', 'ты сегодня') + .2);
  D(B, icons, AT('l01', 'технолог') - .05, VO.l01 + dur.l01 + .2);
  D(K, T('часы работы', 1080, 1580, { h: 80, align: 'center' }), AT('l01', 'технолог') + .25, VO.l01 + dur.l01 + .5);
  // l02 «Не веришь? Сейчас докажу.»
  const qm = T('?', 1395, 520, { h: 300, w: 22 });
  D(K, qm, VO.l02 + .05, AT('l02', 'сейчас'));
  // l03 «…в какую глупую ловушку мы все попали, и почему уже не можем из неё выбраться.» — the propped box over a grain
  const tg = A.trapG, hinge = [1640, tg], a = .36;
  const boxPts = rot([[hinge[0] - 680, tg], [hinge[0], tg], [hinge[0], tg - 420], [hinge[0] - 680, tg - 420], [hinge[0] - 680, tg]], hinge[0], tg, a);
  const lift = boxPts[0];
  const trapGrain = wheat(1080, tg - 4, 1.1);
  D(R, trapGrain, VO.l03 + .05, AT('l03', 'глупую') + .1);
  D(K, W.line(220, tg + 4, 2000, tg, { w: 10 }), AT('l03', 'глупую') - .05, AT('l03', 'ловушку') + .05);
  const box = [W.poly(boxPts, { w: 11 }), ...[.25, .5, .75].map(u => { const p = rot([[hinge[0] - 680 * u, tg], [hinge[0] - 680 * u, tg - 420]], hinge[0], tg, a); return W.line(p[0][0], p[0][1], p[1][0], p[1][1], { w: 7, alpha: .7 }); })];
  D(K, box, AT('l03', 'ловушку'), AT('l03', 'мы все') + .1);
  const prop = W.line(lift[0] + 30, tg, lift[0] + 18, lift[1] + 8, { w: 10 });
  const string = W.curve([[lift[0] + 28, tg - 30], [lift[0] - 120, tg - 10], [lift[0] - 320, tg + 30], [260, tg + 60]], { w: 5, alpha: .8 });
  D(K, [prop, string], AT('l03', 'мы все') + .1, AT('l03', 'попали') + .2);
  const walkers = [[340, 210], [520, 200], [700, 215]].map(([x, h], i) => stick(x, tg, h, { arms: [[-.5, -.3], [.6, .4]], legs: [[-.35, -.25], [.35, .2]], lean: .4, w: 6 }));
  D(B, walkers, AT('l03', 'мы все'), AT('l03', 'почему') + .2);
  D(K, T('?', 1850, tg - 330, { h: 170 }), AT('l03', 'выбраться') - .3, AT('l03', 'выбраться') + .25);

  // ═════════ B. the dig: two skeletons, the guess, the swap
  const g = Bz.g;
  // l04 «Археологи откопали на Ближнем Востоке два скелета из разных эпох.»
  const grass = []; for (let x = 260; x < 1960; x += 70) grass.push(W.line(x, g, x + 18, g - 34, { w: 6 }));
  D(K, [W.line(200, g + 4, 2000, g, { w: 11 }), ...grass], VO.l04 + .05, AT('l04', 'откопали') + .5);
  const pit1 = W.rect(330, g + 80, 590, 1330, { w: 8, over: 0 }), pit2 = W.rect(1230, g + 80, 590, 1330, { w: 8, over: 0 });
  D(B, [...W.dashed([[200, g + 260], [2000, g + 250]], { w: 6 }), ...W.dashed([[200, g + 900], [2000, g + 905]], { w: 6 })], AT('l04', 'откопали'), AT('l04', 'ближнем') + .2, { color: '#8a6f4e' });
  D(K, [...pit1, ...pit2], AT('l04', 'ближнем'), AT('l04', 'два скелета'));
  const s1 = skeleton(Bz.p1, Bz.feet, 1150), s2 = skeleton(Bz.p2, Bz.feet, 860, { bend: .55 });
  const sk1 = [...s1.skull, ...s1.teeth, ...s1.spine, ...s1.ribs, ...s1.pelvis, ...s1.arms, ...s1.legs];
  const sk2 = [...s2.skull, ...s2.spine, ...s2.ribs, ...s2.pelvis, ...s2.arms, ...s2.legs];
  const tSk = AT('l04', 'два скелета');
  D(K, sk1, tSk, tSk + 1.7);
  D(B, sk2, tSk + .45, AT('l04', 'эпох') + .6);
  D(K, [...T('1', 390, g + 200, { h: 110 }), ...T('2', 1290, g + 200, { h: 110 })], tSk + 1.75, VO.l04 + dur.l04 + .6);
  // l05 «У первого: высокий рост, крепкие кости, здоровые суставы и почти ни одной дырки в зубах.»
  const ok = (s, x, y) => T(s + ' ✓', x, y, { h: 82 });
  D(B, W.arrow(265, Bz.feet, 265, Bz.feet - 1080, { w: 8, head: 30 }), AT('l05', 'высокий') - .2, AT('l05', 'рост') + .15);
  D(K, ok('рост', 340, g + 1530), AT('l05', 'рост') - .1, AT('l05', 'крепкие'));
  D(K, ok('кости', 340, g + 1650), AT('l05', 'крепкие'), AT('l05', 'здоровые'));
  D(K, ok('суставы', 340, g + 1770), AT('l05', 'здоровые'), AT('l05', 'почти'));
  D(K, ok('зубы', 340, g + 1890), AT('l05', 'дырки') - .3, VO.l05 + dur.l05 + .1);
  // l06 «У второго: сгнившие зубы, тяжёлый артрит позвоночника от вечно согнутой спины и ранняя смерть.»
  D(R, [...s2.teeth.map(s => (s.color = RED, s)), ...T('×', s2.skullAt[0] + s2.sk * 1.6, s2.skullAt[1] + s2.sk * .6, { h: 60, w: 9 })], AT('l06', 'сгнившие') - .1, AT('l06', 'тяжёлый'));
  const arth = []; for (let k = 0; k < 5; k++) { const u = .1 + k * .17, p = [lerp(s2.hip[0], s2.neck[0], u) + 50, lerp(s2.hip[1], s2.neck[1], u)]; arth.push(W.poly([[p[0] - 20, p[1] - 18], [p[0] + 14, p[1] - 6], [p[0] - 14, p[1] + 6], [p[0] + 20, p[1] + 18]], { w: 7 })); }
  D(R, arth, AT('l06', 'артрит') - .1, AT('l06', 'позвон') + .4);
  D(R, T('зубы ×', 1240, g + 1530, { h: 80 }), AT('l06', 'позвон') + .45, AT('l06', 'вечно') + .2);
  D(R, T('артрит', 1240, g + 1650, { h: 80 }), AT('l06', 'вечно') + .25, AT('l06', 'спины'));
  D(R, [...T('ранняя', 1240, g + 1770, { h: 80 }), ...T('смерть', 1240, g + 1890, { h: 80 })], AT('l06', 'ранняя') - .2, VO.l06 + dur.l06 + .2);
  // l07 «Угадай, кто из них кто?» — two magnets drop
  const pin = { 1: [Bz.p1, g - 240], 2: [Bz.p2, g - 240] };
  const drop1 = Q(AT('l07', 'угадай') + .1), drop2 = drop1 + BEAT;
  tl.cue(drop1, 'magnet', { big: 1 }); tl.cue(drop2, 'magnet', { big: 1 });
  D(K, [...T('?', Bz.p1 + 120, g - 200, { h: 150 }), ...T('?', Bz.p2 + 120, g - 200, { h: 150 })], drop2 + .15, VO.l07 + dur.l07 + .25);
  // l08 «Логично подумать, что здоровый скелет — это фермер с домом и запасами еды, а больной — дикарь…»
  const lab1 = T('фермер', Bz.p1, g - 40, { h: 110, align: 'center' }), lab2 = T('дикарь', Bz.p2, g - 40, { h: 110, align: 'center' });
  D(K, lab1, AT('l08', 'фермер') - .2, AT('l08', 'с домом') + .1);
  const house = [W.poly([[Bz.p1 + 230, g - 60], [Bz.p1 + 230, g - 160], [Bz.p1 + 300, g - 220], [Bz.p1 + 370, g - 160], [Bz.p1 + 370, g - 60], [Bz.p1 + 230, g - 60]], { w: 8 })];
  D(K, house, AT('l08', 'с домом') + .1, AT('l08', 'а больной'));
  D(K, lab2, AT('l08', 'дикарь') - .25, AT('l08', 'выживающ') + .2);
  D(K, spear(Bz.p2 + 300, g - 230, g - 40, { w: 6 }), AT('l08', 'выживающ') + .25, AT('l08', 'природе') + .3);
  // l09 «Но всё ровно наоборот!» — silence, then the eraser wipes the guesses; l10 the magnets swap
  const wipe = Q(AT('l09', 'наоборот') - .1);
  tl.erase(W.zigzag(Bz.p1 - 360, g - 390, 780, 380, 5), wipe, .7, { width: 190 });
  tl.erase(W.zigzag(Bz.p2 - 360, g - 390, 780, 380, 5, -1), wipe + .72, .7, { width: 190 });
  const swap0 = Q(VO.l10 + .1), swap1 = swap0 + 2 * BEAT;
  tl.cue(swap0, 'magnetOff'); tl.cue(swap1, 'magnet', { big: 1 });
  // «Крепкий скелет принадлежал древнему охотнику, а разрушенный — человеку из эпохи так называемого прогресса.»
  D(K, T('охотник', Bz.p1, g - 40, { h: 92, align: 'center' }), AT('l10', 'охотнику') - .2, AT('l10', 'а разруш') + .1);
  D(R, T('фермер', Bz.p2, g - 40, { h: 100, align: 'center' }), AT('l10', 'человеку') - .1, AT('l10', 'прогресса') - .2);
  D(R, [W.circle(Bz.p2, g - 95, 230, { w: 9, ry: 105 })], AT('l10', 'прогресса') - .1, VO.l10 + dur.l10 + .3);

  // ═════════ C. the stopwatch and the week
  // l11 «Когда антропологи с секундомером в руках замерили жизнь последних племён охотников-собирателей, цифра шокировала всех.»
  const sw = [2780, 640];
  D(K, [W.circle(sw[0], sw[1], 240, { w: 11 }), ...W.rect(sw[0] - 40, sw[1] - 320, 80, 60, { w: 9 }), W.line(sw[0], sw[1] - 262, sw[0], sw[1] - 240, { w: 9 })], VO.l11 + .1, AT('l11', 'в руках') + .2);
  const ticks = []; for (let k = 0; k < 12; k++) { const a2 = k / 12 * TAU; ticks.push(W.line(sw[0] + Math.cos(a2) * 200, sw[1] + Math.sin(a2) * 200, sw[0] + Math.cos(a2) * 225, sw[1] + Math.sin(a2) * 225, { w: 7 })); }
  D(B, [...ticks, W.line(sw[0], sw[1], sw[0] + 90, sw[1] - 150, { w: 9 })], AT('l11', 'в руках') + .2, AT('l11', 'замерили') + .5);
  const tribe = [[3330, 360], [3600, 400], [3880, 370]].map(([x, h]) => [...stick(x, 1080, h, { hair: true, arms: [[-.4, -.6], [.7, -.5]] })]);
  const tribeSp = [[3330, 360], [3600, 400], [3880, 370]].map(([x, h]) => spear(x + h * .2, 1080 - h * 1.15, 1080, { w: 6 }));
  D(K, tribe, AT('l11', 'последних') - .1, AT('l11', 'собирател') + .3);
  D(K, tribeSp, AT('l11', 'собирател') + .3, AT('l11', 'цифра') + .1);
  D(K, [...T('!', 3150, 900, { h: 150 }), ...T('!', 4080, 760, { h: 150 })], AT('l11', 'шокировала'), VO.l11 + dur.l11 + .2);
  // l12 «На добычу еды у них уходило всего 17 часов в неделю!»
  D(R, T('17 ч', C.x - 20, 1530, { h: 330, w: 26, align: 'center' }), AT('l12', 'семнадцать') - .1, AT('l12', 'часов') + .4);
  D(B, T('в неделю', C.x, 1720, { h: 100, align: 'center' }), AT('l12', 'в неделю') - .05, VO.l12 + dur.l12 + .25);
  // l13 «Ты вырабатываешь их недельную норму уже к среде после обеда.» — two pens at once, two bars, one week
  const x0 = 2480, x1 = 4060, gy = 2620, perH = (x1 - x0) / 40;
  const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
  const axis = [W.line(x0, gy, x1 + 30, gy, { w: 10 }), ...days.flatMap((d, i) => [W.line(x0 + i * 8 * perH, gy - 15, x0 + i * 8 * perH, gy + 15, { w: 7 }), ...T(d, x0 + (i + .5) * 8 * perH, gy + 110, { h: 72, align: 'center' })])];
  D(K, axis, VO.l12 + .1, AT('l12', 'в неделю') - .1);
  D(K, [...T('они', x0 - 25, 2275, { h: 72, align: 'right' }), ...T('ты', x0 - 25, 2475, { h: 72, align: 'right' })], AT('l12', 'в неделю'), VO.l12 + dur.l12 + .3);
  const duet0 = Q(VO.l13 + .15), xs = x0 + 17 * perH, duetEnd = AT('l13', 'обеда') + .3, dRed = duet0 + (duetEnd - duet0) * 17 / 40 * 1.0;
  D(R, bar(x0, xs, 2190, 110), duet0, dRed);
  D(B, bar(x0, x1, 2390, 110), duet0, duetEnd);
  D(R, [W.line(xs, gy, xs, 2080, { w: 9 }), W.poly([[xs, 2080], [xs + 120, 2110], [xs, 2140]], { w: 8 })], dRed + .05, dRed + .6);

  // ═════════ D. the campfire
  // l14 «Остальное время они высыпались без будильников, мастерили флейты из костей и рассказывали мифы у костра.»
  const sleeper = stick(2960, 3720, 420, { rot: -Math.PI / 2, arms: [[-.3, -.2], [.2, .1]], legs: [[-.08, -.05], [.08, .05]] });
  D(K, [W.line(2480, 3740, 3110, 3740, { w: 9 }), ...sleeper], VO.l14 + .1, AT('l14', 'высыпались') + .3);
  D(B, [Z(2720, 3540, 55), Z(2800, 3440, 75), Z(2900, 3320, 95)], AT('l14', 'высыпались') + .3, AT('l14', 'будильник') - .1);
  D(K, [...clock(3290, 3640, 70), ...T('×', 3290, 3680, { h: 260, w: 12 })], AT('l14', 'будильник') - .1, AT('l14', 'мастерили'));
  const flute = [...W.rect(3460, 3600, 540, 60, { w: 8, over: 3 }), ...[0, 1, 2, 3, 4].map(k => W.circle(3570 + k * 85, 3630, 11, { w: 6 }))];
  const notes = [W.circle(3650, 3500, 18, { w: 7 }), W.line(3668, 3500, 3668, 3400, { w: 7 }), W.circle(3800, 3460, 18, { w: 7 }), W.line(3818, 3460, 3818, 3360, { w: 7 }), W.line(3668, 3400, 3818, 3360, { w: 9 })];
  D(K, flute, AT('l14', 'мастерили'), AT('l14', 'из костей') + .2);
  D(B, notes, AT('l14', 'из костей') + .2, AT('l14', 'рассказ') + .1);
  const fx = Dz.fire;
  D(K, fire(fx[0], fx[1], 1.25), AT('l14', 'рассказ') + .1, AT('l14', 'мифы') + .2);
  const teller = stick(fx[0] - 430, fx[1] + 90, 380, { arms: [[-.6, -1.6], [.5, -2.2]] });
  D(K, teller, AT('l14', 'мифы') + .2, AT('l14', 'костра') + .1);
  const mam = [W.curve([[3020, 4380], [3060, 4300], [3160, 4290], [3220, 4340], [3230, 4400]], { w: 7 }), W.curve([[3040, 4390], [3010, 4440], [3030, 4470]], { w: 6 }), W.line(3080, 4390, 3080, 4440, { w: 6 }), W.line(3190, 4390, 3190, 4440, { w: 6 })];
  D(B, [W.roundRect(2920, 4250, 380, 240, 60, { w: 7 }), ...mam], AT('l14', 'костра'), VO.l14 + dur.l14 + .25);
  // l15 «А большую часть дня просто общались и шутили с близкими.»
  const ring = [[-.35, 4700], [.2, 4660], [.55, 4740], [.85, 4860]].map(([u, y], i) => stick(fx[0] - 120 + u * 620, y + 220, 340, { arms: i % 2 ? [[-.9, -2.4], [.9, 2.4]] : [[-.5, -.4], [.5, .4]] }));
  D(K, ring, VO.l15 + .05, AT('l15', 'шутили'));
  D(B, [...T('ха-ха', 3650, 4470, { h: 80 }), ...T('ха!', 3250, 4610, { h: 75 })], AT('l15', 'шутили'), VO.l15 + dur.l15 + .2);
  // l16 «Ведь в мире без денег хорошие отношения с племенем были их единственной страховкой и пенсией.»
  D(K, [W.circle(2560, 5780, 85, { w: 9 }), W.line(2545, 5720, 2545, 5830, { w: 8 }), W.arc(2570, 5745, 35, -Math.PI / 2, Math.PI / 2, { w: 8 }), W.line(2510, 5800, 2600, 5800, { w: 7 }), W.line(2450, 5870, 2670, 5680, { w: 11 })], AT('l16', 'без денег') - .2, AT('l16', 'хорошие'));
  D(R, W.circle(fx[0] + 30, fx[1] - 90, 760, { w: 12, ry: 430 }), AT('l16', 'отношения'), AT('l16', 'племенем') + .4);
  D(R, T('страховка', fx[0] + 30, 5470, { h: 100, align: 'center' }), AT('l16', 'страховкой') - .3, AT('l16', 'и пенсией'));
  D(R, T('и пенсия', fx[0] + 30, 5610, { h: 100, align: 'center' }), AT('l16', 'и пенсией'), VO.l16 + dur.l16 + .3);
  // l17 «Но куда же исчезло всё наше свободное время?»
  D(K, [...clock(3560, 5800, 100), ...T('?', 3760, 5870, { h: 190 })], VO.l17 + .1, VO.l17 + dur.l17);

  // ═════════ A again. l18 «10 000 лет назад человек посадил зерно, и капкан захлопнулся.»
  D(B, T('10 000 лет назад', A.x + 40, 1800, { h: 95, align: 'center' }), VO.l18 + .5, AT('l18', 'человек') + .1);
  const slam = Q(AT('l18', 'захлопнулся') + .05);
  tl.erase(W.zigzag(250, tg - 680, 1720, 670, 6), slam - .55, .45, { width: 210, strength: 1 });
  tl.cue(slam, 'slam');
  const closed = [...W.rect(900, tg - 430, 740, 430, { w: 13, over: 3 }), ...[.25, .5, .75].map(u => W.line(900 + 740 * u, tg - 425, 900 + 740 * u, tg - 5, { w: 7, alpha: .7 }))];
  D(K, closed, slam - .02, slam + .22, { minGap: .01 });
  D(R, wheat(1270, tg - 6, .9), slam + .25, slam + .7);
  D(B, [stick(1080, tg, 170, { arms: [[-1.8, -2.6], [1.8, 2.6]], w: 6 }), stick(1470, tg, 175, { arms: [[-1.5, -2.8], [1.5, 2.8]], w: 6 })], slam + .3, slam + .85);

  // ═════════ E. the loop: fields → food → children → more fields
  const [ex, ey] = E.c, rr = E.rr;
  const nodes = { f: [ex, ey - rr], e: [ex + rr * .87, ey + rr * .5], k: [ex - rr * .87, ey + rr * .5] };
  // l19 «Поля дали больше еды, а значит, выжило больше детей.»
  const rows = []; for (let k = 0; k < 4; k++) rows.push(W.line(nodes.f[0] - 260 + k * 30, nodes.f[1] + 60 - k * 40, nodes.f[0] + 260 - k * 30, nodes.f[1] + 60 - k * 40, { w: 7, alpha: .8 }));
  D(K, [...T('поля', nodes.f[0], nodes.f[1] - 60, { h: 110, align: 'center' }), ...rows], VO.l19 + .05, AT('l19', 'больше еды'));
  const arc1 = W.arrow(nodes.f[0] + 300, nodes.f[1] + 20, nodes.e[0] + 30, nodes.e[1] - 170, { w: 9, curve: [ex + rr * .95, ey - rr * .55] });
  D(B, arc1, AT('l19', 'больше еды') - .1, AT('l19', 'больше еды') + .5);
  D(K, T('еда', nodes.e[0], nodes.e[1], { h: 110, align: 'center' }), AT('l19', 'больше еды') + .5, AT('l19', 'а значит') + .1);
  const arc2 = W.arrow(nodes.e[0] - 140, nodes.e[1] + 80, nodes.k[0] + 140, nodes.k[1] + 80, { w: 9, curve: [ex, ey + rr * 1.15] });
  D(B, arc2, AT('l19', 'а значит') + .1, AT('l19', 'выжило') + .3);
  D(K, T('дети', nodes.k[0], nodes.k[1], { h: 110, align: 'center' }), AT('l19', 'выжило') + .3, VO.l19 + dur.l19);
  // l20 «Большему числу людей потребовалось ещё больше полей и ещё больше тяжёлого труда.»
  const arc3 = W.arrow(nodes.k[0] - 30, nodes.k[1] - 170, nodes.f[0] - 300, nodes.f[1] + 20, { w: 9, curve: [ex - rr * .95, ey - rr * .55] });
  D(B, arc3, VO.l20 + .05, AT('l20', 'потребовал'));
  const crowdAt = (n, row0) => { const out = []; for (let i = 0; i < n; i++) { const r2 = Math.floor(i / 9), c = i % 9; out.push([300 + c * 190 + (r2 % 2) * 90, row0 + r2 * 330]); } return out; };
  const farmer = ([x, y], i) => [...stick(x, y, 250, { bend: .7, w: 6, arms: [[.6, 1.2], [.8, 1.4]] }), W.line(x + 50, y - 130, x + 150, y + 4, { w: 6 })];
  const crowd = crowdAt(27, 7720);
  D(K, crowd.slice(0, 3).map(farmer), AT('l20', 'большему') + .1, AT('l20', 'потребовал') + .2);
  D(K, crowd.slice(3, 9).map(farmer), AT('l20', 'ещё больше полей') - .1, AT('l20', 'ещё больше тяж') - .1);
  D(K, crowd.slice(9, 18).map(farmer), AT('l20', 'ещё больше тяж'), VO.l20 + dur.l20 + .15);
  D(R, [W.circle(ex, ey + 40, rr + 280, { w: 12 })], AT('l20', 'тяжёлого'), VO.l20 + dur.l20 + .3);
  // l21 «Назад дороги уже не было: охотой такую толпу не прокормить.»
  D(K, crowd.slice(18, 27).map(farmer), VO.l21 + .05, AT('l21', 'охотой'));
  D(K, [...W.arrow(1600, 8750, 520, 8750, { w: 11, head: 50 }), ...T('охота', 1060, 8690, { h: 95, align: 'center' })], AT('l21', 'охотой') - .1, AT('l21', 'толпу') + .1);
  D(R, [W.line(800, 8560, 1340, 8860, { w: 14 }), W.line(1340, 8560, 800, 8860, { w: 14 })], AT('l21', 'не прокормить') - .1, VO.l21 + dur.l21 + .2);

  // ═════════ F. 90 000 hours, and the hunter already at the finish
  // l22 «Сегодня ты тратишь 90 000 часов жизни на работу, чтобы однажды выйти на пенсию, выспаться и пожить для себя.»
  const fx0 = Fz.x, y0 = Fz.y0, y1 = Fz.y1;
  D(K, [stick(fx0, y0 - 10, 260, { w: 7 }), ...T('ты', fx0 + 170, y0 - 80, { h: 80 })], VO.l22 + .05, AT('l22', 'тратишь'));
  const life = [...W.rect(fx0 - 60, y0 + 30, 120, y1 - y0 - 30, { w: 9, over: 3 }), W.hatch([[fx0 - 60, y0 + 30], [fx0 + 60, y0 + 30], [fx0 + 60, y1], [fx0 - 60, y1]], { angle: -.25, spacing: 30, w: 8 })];
  D(B, life, AT('l22', 'девяносто') - .1, AT('l22', 'чтобы') + .2);
  D(R, T('90 000 ч', 3430, 7040, { h: 150, w: 16, align: 'center' }), AT('l22', 'девяносто'), AT('l22', 'жизни') + .4);
  D(K, T('работы', 3420, 7220, { h: 100, align: 'center' }), AT('l22', 'на работу') - .1, AT('l22', 'чтобы'));
  const flag = [W.line(fx0 + 90, y1 + 30, fx0 + 90, y1 - 260, { w: 9 }), ...W.rect(fx0 + 90, y1 - 260, 180, 120, { w: 8, over: 2 }), W.hatch([[fx0 + 90, y1 - 260], [fx0 + 180, y1 - 260], [fx0 + 180, y1 - 200], [fx0 + 90, y1 - 200]], { spacing: 18, w: 6 }), W.hatch([[fx0 + 180, y1 - 200], [fx0 + 270, y1 - 200], [fx0 + 270, y1 - 140], [fx0 + 180, y1 - 140]], { spacing: 18, w: 6 })];
  D(K, flag, AT('l22', 'однажды') - .1, AT('l22', 'на пенсию') + .3);
  const bedX = 3360, bedY = y1 + 120;
  const bed = [W.line(bedX, bedY, bedX + 620, bedY, { w: 10 }), W.line(bedX, bedY - 140, bedX, bedY + 60, { w: 10 }), W.line(bedX + 620, bedY - 70, bedX + 620, bedY + 60, { w: 10 }), W.roundRect(bedX + 30, bedY - 70, 130, 60, 25, { w: 7 })];
  const oldie = stick(bedX + 120, bedY - 40, 380, { rot: -Math.PI / 2, arms: [[-.2, -.1], [.15, .1]], legs: [[-.05, -.03], [.05, .03]] });
  D(K, [...bed, ...T('пенсия', bedX + 310, bedY - 300, { h: 95, align: 'center' })], AT('l22', 'на пенсию') + .35, AT('l22', 'выспаться') + .1);
  D(K, oldie, AT('l22', 'выспаться') + .1, AT('l22', 'пожить') + .1);
  D(B, [Z(bedX + 240, bedY - 140, 50), Z(bedX + 310, bedY - 220, 70)], AT('l22', 'пожить') + .1, VO.l22 + dur.l22 + .2);
  // l23 «А древние люди рождались сразу на этой финишной прямой.»
  const cave2 = stick(fx0 - 230, y1 + 210, 420, { hair: true, arms: [[-.5, -.8], [2.5, 2.9]] });
  D(K, [...cave2, ...spear(cave2.hand[0][0] - 10, y1 - 300, y1 + 210, { w: 7 })], AT('l23', 'древние') - .1, AT('l23', 'сразу') + .2);
  D(R, W.circle(fx0 - 40, y1 + 20, 360, { w: 11, ry: 300 }), AT('l23', 'финишной') - .2, VO.l23 + dur.l23 + .2);

  // ═════════ G. the choice
  // l24 «А что бы выбрал ты: 17 часов работы в неделю с копьём у костра, или свой смартфон, но с будильником в 7 утра?»
  const gx1 = 1450, gx2 = 2700, gy0 = G.y;
  D(K, [...fire(gx1 - 60, gy0 + 140, 1.6), ...spear(gx1 + 230, gy0 - 260, gy0 + 180, { w: 10 })], AT('l24', 'семнадцать') - .4, AT('l24', 'в неделю'));
  D(R, T('17 ч', gx1, gy0 - 290, { h: 220, w: 20, align: 'center' }), AT('l24', 'в неделю'), AT('l24', 'у костра') + .2);
  D(K, T('или', (gx1 + gx2) / 2, gy0, { h: 130, align: 'center' }), AT('l24', 'или') - .15, AT('l24', 'или') + .35);
  D(K, phone(gx2 - 110, gy0 + 20, 220, 400), AT('l24', 'смартфон') - .2, AT('l24', 'будильник') - .1);
  D(B, [...clock(gx2 + 230, gy0 + 70, 100), ...T('7:00', gx2 + 230, gy0 - 140, { h: 120, align: 'center' })], AT('l24', 'будильник') - .1, AT('l24', 'утра') + .2);
  // l25 «Напиши в комментариях и подпишись…» — pull back: everything after the grain sits inside one closed box
  const boxT0 = AT('l25', 'и подпишись') - .2, boxT1 = AT('l25', 'устроен') - .1;
  const bigBox = [W.line(90, 5960, 4210, 5960, { w: 40 }), W.line(4210, 5960, 4210, 10520, { w: 40 }), W.line(4210, 10520, 90, 10520, { w: 40 }), W.line(90, 10520, 90, 5960, { w: 40 })];
  D(K, bigBox, boxT0, boxT1);
  D(R, T('ловушка', 2150, 5880, { h: 500, w: 44, align: 'center' }), boxT1, boxT1 + 1.4);
  const circT0 = Q(VO.l25 + dur.l25 + .7);
  D(R, [W.circle((gx1 + gx2) / 2, gy0 - 40, 220, { w: 11, ry: 150, lap: .4 }), W.circle((gx1 + gx2) / 2 + 8, gy0 - 36, 245, { w: 9, ry: 170, lap: .3, a0: -1.4 })], circT0, circT0 + 1.0);
  tl.cue(circT0 + 1.4, 'capOn');
  tl.end();

  // ───────── magnets: drop, wait, lift, swap, drop
  const mag = (id) => {
    const p0 = pin[id], p1 = pin[id === 1 ? 2 : 1];
    return t => {
      if (t < (id === 1 ? drop1 : drop2) - .3) return null;
      const td = id === 1 ? drop1 : drop2;
      if (t < td) { const u = clamp((t - td + .3) / .3); return { x: p0[0], y: p0[1] - (1 - u) * 260, lift: 1 - u * u }; }
      if (t < swap0) return { x: p0[0], y: p0[1], lift: 0 };
      if (t < swap1) { const u = clamp((t - swap0) / (swap1 - swap0)), e = u * u * (3 - 2 * u); return { x: lerp(p0[0], p1[0], e), y: p0[1] - Math.sin(Math.PI * e) * (id === 1 ? 160 : -160), lift: Math.sin(Math.PI * Math.min(1, u * 1.15)) * .8 }; }
      return { x: p1[0], y: p1[1], lift: 0 };
    };
  };
  const M1 = mag(1), M2 = mag(2);

  // ───────── camera (world centre, zoom); y is offset so the bottom 14 % stays free for subtitles
  const V = (t, x, y, z, e = 'io', r = 0) => [t, x, y + SH * .07 / z, z, r, e];
  const t18 = VO.l18;
  const keys = [
    V(0, 560, 980, 1.05),
    V(AT('l01', 'работал') - .2, 600, 980, 1.0),
    V(AT('l01', 'ты сегодня') + .3, 1150, 1080, .62),
    V(VO.l02 - .1, 1150, 1080, .62),
    V(VO.l02 + .9, 1250, 900, .78),
    V(VO.l03 - .05, 1250, 900, .78),
    V(VO.l03 + .7, 1080, 2470, 2.0, 'io', .02),
    V(AT('l03', 'ловушку') - .2, 1080, 2480, 1.8),
    V(AT('l03', 'мы все') + .4, 1120, 2300, .82),
    V(VO.l04 - .1, 1120, 2280, .82),
    V(VO.l04 + 1.6, 1110, 4250, .6),
    V(VO.l05 - .1, 1110, 4300, .6),
    V(VO.l05 + 1.2, 760, 4450, .8),
    V(VO.l06 - .3, 760, 4450, .8),
    V(VO.l06 + 1.2, 1460, 4450, .8),
    V(VO.l07 - .4, 1460, 4450, .8),
    V(VO.l07 + .4, 1100, 4150, .62),
    V(swap0 - .3, 1100, 4150, .62),
    V(swap0 + .6, 1100, 3950, .62),
    V(AT('l10', 'прогресса'), 1100, 3950, .62),
    V(VO.l11 - .25, 1100, 3950, .62),
    V(VO.l11 + .45, 3200, 1350, .62, 'io', -.015),
    V(VO.l12 - .1, 3200, 1350, .62),
    V(VO.l12 + .9, 3200, 1500, .9),
    V(VO.l13 - .4, 3200, 1650, .8),
    V(VO.l13 + .6, 3230, 2300, .74),
    V(VO.l14 - .1, 3230, 2300, .74),
    V(VO.l14 + .55, 3220, 3880, .62, 'io', .015),
    V(AT('l14', 'рассказ') - .3, 3220, 3900, .62),
    V(AT('l14', 'рассказ') + 1.2, 3200, 4640, .7),
    V(VO.l16 - .1, 3200, 4700, .66),
    V(VO.l16 + 2.0, 3200, 4980, .58),
    V(VO.l17 - .1, 3200, 5020, .6),
    V(VO.l17 + 1.0, 3460, 5580, .82),
    V(t18 - .15, 3460, 5580, .82),
    V(t18 + .55, 1120, 2200, .72, 'io', -.02),
    V(VO.l19 + .2, 1120, 2280, .8),
    V(VO.l19 + 1.2, 1100, 6750, .7),
    V(VO.l20 + .3, 1100, 6820, .7),
    V(VO.l20 + 3.5, 1100, 7650, .6),
    V(VO.l21 + 1.5, 1100, 8000, .62),
    V(VO.l22 - .1, 1100, 8050, .62),
    V(VO.l22 + .6, 3200, 6900, .66, 'io', .015),
    V(AT('l22', 'чтобы'), 3200, 7300, .66),
    V(AT('l22', 'на пенсию') + .5, 3250, 8150, .7),
    V(VO.l23 + 1.0, 3200, 8250, .66),
    V(VO.l24 - .1, 3200, 8300, .66),
    V(VO.l24 + 1.1, 2120, 9640, .48),
    V(VO.l25 - .1, 2120, 9640, .48),
    V(VO.l25 + 2.8, 2150, 5650, .14),
    V(boxT1 + 1.6, 2150, 5700, .14),
    V(circT0 - .1, 2100, 9620, .5),
    V(END, 2100, 9630, .53, 'l'),
  ];
  class Cam extends W.Camera {
    at(t) {
      const c = { ...super.at(t) }, d = t - slam;
      if (c.z > .25) { const hw = SW / 2 / c.z, hh = SH / 2 / c.z; c.x = clamp(c.x, hw, BW - hw); c.y = clamp(c.y, hh, BH - hh); }
      if (d < 0 || d > .6) return c;
      const k = Math.exp(-d * 9) * 26;
      return { ...c, x: c.x + Math.sin(d * 83) * k / c.z, y: c.y + Math.sin(d * 61 + 1) * k * 1.3 / c.z, r: c.r + Math.sin(d * 47) * .006 * Math.exp(-d * 9) };
    }
  }
  const cam = new Cam(keys);

  // pen pose; pens hidden in the ending wide shot except while drawing
  const pose = (p, t) => W.penPose(p, t, cam);

  const board = new W.Board(tl, { ghosts, W: BW, H: BH });
  board.objs.push({ draw: (ctx, t, c) => { for (const M of [M1, M2]) { const p = M(t); if (p) W.drawPinMagnet(ctx, p.x, p.y, c, { lift: p.lift, size: 170, color: '#3c6fc6' }); } } });
  board.objs.push({ draw: (ctx, t, c) => { for (const e of tl.erasers) W.drawEraser(ctx, e, t, c); } });
  const QS = new URLSearchParams(location.search);
  if (!QS.has('nopens')) board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, pose(p, t), c, t); } });

  // ───────── subtitles: clauses ≤ 30 chars, timed by character position within the spoken line
  const subs = [];
  for (const L of lines) {
    const txt = L.text, t0 = VO[L.id], d = dur[L.id];
    const parts = txt.match(/[^,.:!?—]+[,.:!?—…]*\s*/g).reduce((acc, p) => {
      const last = acc[acc.length - 1];
      if (last != null && ((last + p).trim().length <= 44 || p.trim().length < 12)) acc[acc.length - 1] += p; else acc.push(p); return acc;
    }, []);
    const pieces = [];
    for (const p of parts) {                         // chunks longer than ~34 chars are cut at words into even pieces
      const s = p.trim(); if (s.length <= 46) { pieces.push(p); continue; }
      const n = Math.ceil(s.length / 40), target = s.length / n; let cur = '';
      for (const w of s.split(' ')) { if (cur && (cur + ' ' + w).length > target + 4) { pieces.push(cur + ' '); cur = w; } else cur = cur ? cur + ' ' + w : w; }
      pieces.push(cur + p.slice(p.trimEnd().length));
    }
    let c0 = 0;
    for (const p of pieces) {
      const f0 = c0 / txt.length, f1 = (c0 + p.trimEnd().length) / txt.length; c0 += p.length;
      subs.push({ t0: t0 + f0 * d - .05, t1: t0 + f1 * d + .3, text: p.trim().replace(/\s*—$/, '').replace(/(\d) (\d)/g, '$1\u00a0$2') });
    }
  }
  for (let i = 0; i < subs.length - 1; i++) {        // a caption too short to read joins its neighbour in the same line
    const a = subs[i], b = subs[i + 1];
    if (b.t0 - a.t1 < .2 && (a.t1 - a.t0 < 1.6 || b.t1 - b.t0 < 1.6) && (a.text + ' ' + b.text).length <= 58) { a.text += ' ' + b.text; a.t1 = b.t1; subs.splice(i + 1, 1); i--; }
  }
  for (let i = 0; i < subs.length - 1; i++) subs[i].t1 = Math.min(Math.max(subs[i].t1, subs[i].t0 + 1.8), subs[i + 1].t0 - .04);
  window.__subs = subs;
  const SUBY = SH - 70;
  board.overlays.push({
    draw: (ctx, t) => {
      const s = subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
      const a = Math.min(1, (t - s.t0) / .12, (s.t1 - t) / .12);
      ctx.font = '600 66px CV';
      let rows = [s.text];
      if (ctx.measureText(s.text).width > SW - 160) {
        const ws = s.text.split(' '); let best = 1, bd = 1e9;
        for (let i = 1; i < ws.length; i++) { const d2 = Math.abs(ctx.measureText(ws.slice(0, i).join(' ')).width - ctx.measureText(ws.slice(i).join(' ')).width); if (d2 < bd) { bd = d2; best = i; } }
        rows = [ws.slice(0, best).join(' '), ws.slice(best).join(' ')];
      }
      const w = Math.max(...rows.map(r => ctx.measureText(r).width)) + 70, h = 92 + (rows.length - 1) * 70, y0 = SUBY - h;
      ctx.globalAlpha = a * .92; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.2)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(SW / 2 - w / 2, y0, w, h, 18); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = RED; ctx.fillRect(SW / 2 - w / 2 + 24, y0 + h - 14, 40, 5);
      ctx.fillStyle = '#23262c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      rows.forEach((r, i) => ctx.fillText(r, SW / 2, y0 + 47 + i * 70));
    }
  });
  if (QS.has('nosubs')) board.overlays.length = 0;

  // ───────── frame render with camera motion blur on whips
  const off = new OffscreenCanvas(SW, SH), oc = off.getContext('2d');
  function render(ctx, t) {
    const dt = 1 / 24, a2 = cam.at(t), b2 = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a2.x - b2.x) * a2.z, (a2.y - b2.y) * a2.z) + Math.abs(Math.log(a2.z / b2.z)) * 1400;
    const N = sp > 14 ? Math.min(12, Math.ceil(sp * .5 / 4)) : 1;
    if (N === 1) { board.render(ctx, t, cam); return; }
    const ov = board.overlays; board.overlays = [];
    for (let i = 0; i < N; i++) { board.render(oc, t - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0); }
    ctx.globalAlpha = 1; board.overlays = ov;
    for (const o of ov) { ctx.save(); o.draw(ctx, t); ctx.restore(); }
  }

  const ev = [...tl.ev, ...Object.entries(VO).map(([id, tt]) => ({ t: tt, type: 'vo', id }))].sort((p, q) => p.t - q.t);
  for (const e of ev) if (e.x != null) { const c = cam.at(e.t), [px, py] = W.toScreen(c, e.x, e.y); e.pan = +clamp((px - SW / 2) / 900, -.6, .6).toFixed(2); e.z = +c.z.toFixed(2); e.on = px > -100 && px < SW + 100 && py > -100 && py < SH + 100 ? 1 : 0; }
  // camera whips (fast moves) for the mixer
  const whips = []; for (let k = 1; k < keys.length; k++) { const [ta, xa, ya, za] = keys[k - 1], [tb, xb, yb, zb] = keys[k]; const d2 = Math.hypot(xb - xa, yb - ya) * Math.min(za, zb), dt2 = tb - ta; if (d2 / dt2 > 900 && dt2 < 2.5) whips.push([+ta.toFixed(3), +dt2.toFixed(3), +Math.min(1.2, d2 / dt2 / 2500).toFixed(2)]); }
  return { dur: END, render, ev, subs, cam, tl, VO, cues: { BPM, BEAT, drop1, drop2, wipe, swap0, swap1, duet0, dRed, duetEnd, slam, boxT0, boxT1, circT0, whips, sil: [[VO.l08 + dur.l08 + .1, VO.l09 + .05], [VO.l17 + dur.l17 + .1, slam - .6]], VO, END } };
}
