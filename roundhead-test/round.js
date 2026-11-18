// round.js — the «А что если — круглоголовые» look: round cream heads with dot eyes and heavy lids, deep cherry/navy/gold
// sets drawn into a back layer and blurred for depth, a face-slam push-in. Built on the Sci-Fi Sitcom Toon engine (toon.js).
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, bands } from './toon.js';

export const RP = {
  face: '#f6e4c4', faceS: '#e2c7a0', cherry: '#8e1f35', cherryD: '#6c1427', cherryL: '#a8283f', navy: '#1c2a5a', navyD: '#141f45', gold: '#e3a43a', goldL: '#f2c66a',
  wood: '#5a3423', woodD: '#45281a', tee: '#2f7d74', teeS: '#235e57', phone: '#ff8a2a', phoneS: '#d96812', pj: '#2a3360', pjS: '#1f264a', star: '#f2c66a',
  cardi: '#c98a2b', cardiS: '#a46d1d', apron: '#5c3a26', apronS: '#47291a', colander: '#c9ced6', colanderS: '#9aa1ac', moust: '#e9e4da', white: '#ffffff', tongue: '#e8637a', mouthIn: '#4a1a2a',
};

// eyes: small dark dots under a heavy straight lid line; brows thick and short. mood: 'deadpan' | 'panic' | 'smug' | 'shock'
function dotEyes(cx, cy, sp, mood, look = [0, 0], t = 0) {
  for (const sx of [-1, 1]) {
    const x = cx + sx * sp + look[0] * 6, y = cy + look[1] * 5;
    if (mood === 'panic' || mood === 'shock') { shape(ell(x, y, 16, 18, 20), { fill: RP.white, lw: 5, shade: () => dot(x + look[0] * 4, y + look[1] * 4, 5.5) }); }
    else { dot(x, y + 3, 7.5); stroke([[x - 20, y - 4], [x + 20, y - 4]], 7); }                                // heavy lid over the dot
    const lift = mood === 'panic' ? -14 : mood === 'smug' ? 2 : mood === 'shock' ? -18 : -2, tilt = mood === 'panic' ? -8 * sx : mood === 'smug' ? 6 * sx : 5 * sx;
    stroke([[x - 18, y - 26 + lift + tilt], [x + 18, y - 26 + lift - tilt]], 9);
  }
}
function smallMouth(cx, cy, mood, o = 0) {
  if (mood === 'panic' || mood === 'shock' || o > .2) {
    const h = mood === 'shock' ? 30 : 18 + o * 20;
    shape(ell(cx, cy + h * .4, 16 + o * 6, h, 20), { fill: RP.mouthIn, lw: 5, shade: () => fillOnly(ell(cx + 2, cy + h, 10, 7, 12), RP.tongue, { boil: .3 }) });
  } else stroke(quad([cx - 16, cy], [cx, cy + (mood === 'smug' ? 6 : 0)], [cx + 16, cy - (mood === 'smug' ? 6 : 0)], 8), 6);
}
// the round head itself: a perfect cream disc, a small nose line, no ears
export function roundHead(R, mood, { look = [0, 0], o = 0, nose = true } = {}) {
  shape(ell(0, 0, R, R * .98, 60), { fill: RP.face, lw: 8, shade: () => fillOnly(ell(R * .55, R * .25, R * .7, R * 1.1, 30), RP.faceS, { boil: .3 }) });
  dotEyes(0, -R * .08, R * .3, mood, look);
  if (nose) stroke([[0, R * .02], [0, R * .26]], 6);
}

// —— ТЫ, round: the same costume ideas (orange headphones, starry pyjamas), drawn on the round-head body ——
export function rTim(P) {
  const f = P.face ?? 1, mood = P.mood || 'deadpan', ner = P.nerv ?? 0;
  const jit = ner ? (hash(Math.floor((P.t || 0) * 12) * 3.3) - .5) * 8 * ner : 0;
  push(); translate(P.x + jit, P.y); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1)); rotate(P.spin || 0);
  for (const sx of [-1, 1]) { const lg = (sx < 0 ? P.legL : P.legR) || [0, 0];
    shape(noodle([sx * 24, -230], [sx * 28 + lg[0], -22 + lg[1]], 0, 40, 36), { fill: RP.pj, lw: 7, shade: () => { for (let k = 0; k < 3; k++) dot(sx * 26 + lg[0] * (k + .5) / 3, -200 + k * 60, 5, RP.star); } });
    shape(ell(sx * 34 + lg[0], -10 + lg[1], 38, 18, 20), { fill: '#d8d2e2', lw: 6 }); }
  push(); rotate(P.lean ?? 0);
  const arm = (sh, a) => { const hp = [sh[0] + a.h[0], sh[1] + a.h[1]]; shape(noodle(sh, hp, a.bend ?? 0, 24, 20), { fill: RP.tee, lw: 6 }); shape(ell(hp[0], hp[1], 18, 18, 16), { fill: RP.face, lw: 6 }); };
  arm([-50, -420], P.armL || { h: [-18, 170], bend: -14 });
  shape(rr(-62, -450, 124, 230, 40), { fill: RP.tee, lw: 7, shade: () => fillOnly(rect(20, -460, 70, 250), RP.teeS, { boil: .3 }) });
  shape(arc(0, -444, 58, 24, 0, Math.PI, 20).concat(arc(0, -444, 42, 12, Math.PI, 0, 20)), { fill: RP.phone, lw: 6 });
  for (const sx of [-1, 1]) shape(ell(sx * 56, -442, 20, 26, 16), { fill: RP.phone, lw: 6, shade: () => fillOnly(ell(sx * 56 + 8, -438, 10, 16, 12), RP.phoneS, { boil: .3 }) });
  push(); translate(0, -590); rotate(P.headTilt ?? 0); scale(1.4); roundHead(108, mood, { look: P.look, o: P.o });
  shape(spline([[-96, -40], [-80, -96], [-20, -118], [50, -112], [96, -60], [70, -84], [30, -78], [0, -96], [-30, -76]]), { fill: '#3a2620', lw: 6 });   // a hair cap
  smallMouth(0, 56, mood, P.o || 0); pop();
  arm([50, -420], P.armR || { h: [18, 170], bend: 14 });
  pop(); pop();
}
// —— Зиновий Маркович, round: colander helmet, walrus moustache, cardigan and apron ——
export function rZin(P) {
  const f = P.face ?? 1, mood = P.mood || 'deadpan';
  push(); translate(P.x, P.y); scale((P.s ?? 1) * f, P.s ?? 1);
  for (const sx of [-1, 1]) { shape(noodle([sx * 34, -120], [sx * 36, -20], 0, 38, 36), { fill: '#d8d2c4', lw: 6 }); shape(ell(sx * 44, -10, 40, 18, 18), { fill: '#3e2a20', lw: 6 }); }
  const arm = (sh, a, cup) => { const hp = [sh[0] + a.h[0], sh[1] + a.h[1]]; shape(noodle(sh, hp, a.bend ?? 0, 36, 30), { fill: RP.cardi, lw: 6 }); shape(ell(hp[0], hp[1], 17, 17, 16), { fill: RP.face, lw: 6 });
    if (cup) { push(); translate(hp[0] + 22, hp[1] - 14); shape([[-24, -24], [24, -24], [18, 6], [-18, 6]], { fill: '#f6f1e6', lw: 5 }); shape(ell(0, -24, 24, 6, 16), { fill: '#a8622c', lw: 4 }); pop(); } };
  arm([-70, -290], P.armL || { h: [-26, 110], bend: -12 });
  shape(spline([[0, -330], [84, -304], [116, -210], [96, -120], [0, -104], [-96, -120], [-116, -210], [-84, -304]]), { fill: RP.cardi, lw: 7, shade: () => fillOnly(spline([[40, -340], [120, -290], [136, -190], [104, -100], [60, -100], [92, -210]]), RP.cardiS, { boil: .4 }) });
  shape(spline([[-44, -290], [44, -290], [66, -124], [-66, -124]]), { fill: RP.apron, lw: 6 });
  push(); translate(0, -450); rotate(P.headTilt ?? 0); scale(1.35);
  roundHead(96, mood, { look: P.look, o: P.o });
  shape(spline([[-4, 26], [-44, 22], [-74, 46], [-50, 44], [-20, 40], [0, 34], [20, 40], [50, 44], [74, 46], [44, 22], [4, 26]]), { fill: RP.moust, lw: 5 });
  smallMouth(0, 62, mood === 'smug' ? 'smug' : mood, P.o || 0);
  shape([...arc(0, -50, 100, 80, Math.PI, TAU, 30), [100, -42], [-100, -42]], { fill: RP.colander, lw: 7, shade: () => { fillOnly(ell(46, -90, 50, 34, 20), RP.colanderS, { boil: .3 }); for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) dot(-72 + i * 18 + (j % 2) * 9, -66 - j * 20, 3.4, '#6b7280'); } });
  stroke([[-116, -44], [116, -44]], 9); stroke(spline([[0, -128], [8, -164], [-6, -192], [10, -218]], false), 5); dot(10, -220, 9, '#ff4a3a');
  pop();
  arm([66, -290], P.armR || { h: [36, 104], bend: 14 }, P.cup);
  pop();
}

// —— a set in the new palette: cherry curtains with gold ovals, a wooden counter (drawn into the back layer, then blurred) ——
export function cherryLab(t) {
  fillOnly(rect(-1500, -2000, 4100, 4500), RP.cherry, { boil: 0 });
  for (let x = -400; x < 1500; x += 150) { fillOnly(rect(x, -200, 70, 1700), RP.cherryD, { boil: .3 }); for (let y = 120; y < 1200; y += 220) shape(ell(x + 110, y + (x % 300 ? 110 : 0), 20, 30, 16), { fill: RP.gold, lw: 5 }); }
  shape(rr(-100, 1060, 1300, 80, 10), { fill: RP.wood, lw: 7 }); fillOnly(rect(-1500, 1140, 4100, 1200), RP.woodD, { boil: 0 });
  for (let x = -100; x < 1200; x += 120) shape(rr(x, 1150, 100, 240, 10), { fill: RP.wood, lw: 6 });
}
