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

// —— stick limbs: one ink line from root to tip (a soft bend), a small round hand or a flat shoe ——
function limb(a, b, bend = 0, w = 12) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; stroke(quad(a, [(a[0] + b[0]) / 2 - dy / L * bend, (a[1] + b[1]) / 2 + dx / L * bend], b, 14), w); }
const handDot = (p) => dot(p[0], p[1], 13);
const shoe = (p, col) => shape(ell(p[0] + 14, p[1] - 6, 30, 14, 18), { fill: col, lw: 6 });

// —— ТЫ, coloured stickman: a big round head, a teal T-shirt block, orange headphones, starry pyjama shorts, stick limbs ——
export function rTim(P) {
  const f = P.face ?? 1, mood = P.mood || 'deadpan', ner = P.nerv ?? 0;
  const jit = ner ? (hash(Math.floor((P.t || 0) * 12) * 3.3) - .5) * 8 * ner : 0;
  push(); translate(P.x + jit, P.y); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1)); rotate(P.spin || 0);
  const hip = [0, -250], legL = P.legL || [0, 0], legR = P.legR || [0, 0];
  for (const [sx, lg] of [[-1, legL], [1, legR]]) { const ft = [sx * 46 + lg[0], -6 + lg[1]]; limb([sx * 14, -240], ft, sx * -8); shoe(ft, '#d8d2e2'); }
  push(); rotate(P.lean ?? 0);
  shape(rr(-46, -270, 92, 54, 14), { fill: RP.pj, lw: 6, shade: () => { dot(-20, -246, 5, RP.star); dot(18, -236, 5, RP.star); } });   // starry shorts
  const shL = [-38, -440], shR = [38, -440], aL = P.armL || { h: [-40, 160], bend: -12 }, aR = P.armR || { h: [40, 160], bend: 12 };
  const armL = () => { const hp = [shL[0] + aL.h[0], shL[1] + aL.h[1]]; limb(shL, hp, aL.bend); handDot(hp); };
  const armR = () => { const hp = [shR[0] + aR.h[0], shR[1] + aR.h[1]]; limb(shR, hp, aR.bend); handDot(hp); };
  armL();
  shape(spline([[-44, -460], [44, -460], [56, -380], [50, -262], [-50, -262], [-56, -380]]), { fill: RP.tee, lw: 7, shade: () => fillOnly(rect(16, -470, 60, 220), RP.teeS, { boil: .3 }) });
  stroke([[0, -470], [0, -500]], 12);                                                                              // stick neck
  shape(arc(0, -470, 56, 22, 0, Math.PI, 20).concat(arc(0, -470, 40, 10, Math.PI, 0, 20)), { fill: RP.phone, lw: 6 });
  for (const sx of [-1, 1]) shape(ell(sx * 54, -468, 19, 24, 16), { fill: RP.phone, lw: 6, shade: () => fillOnly(ell(sx * 54 + 8, -464, 9, 14, 12), RP.phoneS, { boil: .3 }) });
  push(); translate(0, -640); rotate(P.headTilt ?? 0); scale(1.5); roundHead(100, mood, { look: P.look, o: P.o });
  shape(spline([[-90, -36], [-74, -90], [-20, -110], [46, -104], [90, -56], [66, -78], [28, -72], [0, -90], [-28, -70]]), { fill: '#3a2620', lw: 6 });
  smallMouth(0, 52, mood, P.o || 0); pop();
  armR();
  pop(); pop();
}
// —— Зиновий Маркович, coloured stickman: a big round head with a walrus moustache and a colander, a round mustard cardigan with an apron, stick limbs ——
export function rZin(P) {
  const f = P.face ?? 1, mood = P.mood || 'deadpan';
  push(); translate(P.x, P.y); scale((P.s ?? 1) * f, P.s ?? 1);
  for (const sx of [-1, 1]) { const ft = [sx * 40, -6]; limb([sx * 18, -150], ft, 0); shoe(ft, '#3e2a20'); }
  push(); rotate(P.lean ?? 0);
  const shL = [-60, -300], shR = [60, -300], aL = P.armL || { h: [-36, 130], bend: -10 }, aR = P.armR || { h: [36, 120], bend: 10 };
  const armL = () => { const hp = [shL[0] + aL.h[0], shL[1] + aL.h[1]]; limb(shL, hp, aL.bend); handDot(hp); };
  const armR = () => { const hp = [shR[0] + aR.h[0], shR[1] + aR.h[1]]; limb(shR, hp, aR.bend); handDot(hp);
    if (P.cup) { push(); translate(hp[0] + 22, hp[1] - 16); shape([[-24, -24], [24, -24], [18, 6], [-18, 6]], { fill: '#f6f1e6', lw: 5 }); shape(ell(0, -24, 24, 6, 16), { fill: '#a8622c', lw: 4 }); pop(); } };
  armL();
  shape(spline([[0, -330], [80, -306], [104, -220], [86, -150], [0, -134], [-86, -150], [-104, -220], [-80, -306]]), { fill: RP.cardi, lw: 7, shade: () => fillOnly(spline([[36, -340], [110, -290], [124, -200], [96, -130], [56, -130], [86, -220]]), RP.cardiS, { boil: .4 }) });
  shape(spline([[-38, -296], [38, -296], [58, -150], [-58, -150]]), { fill: RP.apron, lw: 6 });
  stroke([[0, -330], [0, -360]], 12);
  push(); translate(0, -470); rotate(P.headTilt ?? 0); scale(1.4);
  roundHead(90, mood, { look: P.look, o: P.o });
  shape(spline([[-4, 24], [-42, 20], [-70, 44], [-48, 42], [-18, 38], [0, 32], [18, 38], [48, 42], [70, 44], [42, 20], [4, 24]]), { fill: RP.moust, lw: 5 });
  smallMouth(0, 58, mood, P.o || 0);
  shape([...arc(0, -46, 94, 76, Math.PI, TAU, 30), [94, -38], [-94, -38]], { fill: RP.colander, lw: 7, shade: () => { fillOnly(ell(44, -86, 48, 32, 20), RP.colanderS, { boil: .3 }); for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) dot(-68 + i * 17 + (j % 2) * 8, -62 - j * 19, 3.2, '#6b7280'); } });
  stroke([[-110, -40], [110, -40]], 9); stroke(spline([[0, -122], [8, -156], [-6, -184], [10, -208]], false), 5); dot(10, -210, 9, '#ff4a3a');
  pop();
  armR();
  pop(); pop();
}

// —— a set in the new palette: cherry curtains with gold ovals, a wooden counter (drawn into the back layer, then blurred) ——
export function cherryLab(t) {
  fillOnly(rect(-1500, -2000, 4100, 4500), RP.cherry, { boil: 0 });
  for (let x = -400; x < 1500; x += 150) { fillOnly(rect(x, -200, 70, 1700), RP.cherryD, { boil: .3 }); for (let y = 120; y < 1200; y += 220) shape(ell(x + 110, y + (x % 300 ? 110 : 0), 20, 30, 16), { fill: RP.gold, lw: 5 }); }
  shape(rr(-100, 1060, 1300, 80, 10), { fill: RP.wood, lw: 7 }); fillOnly(rect(-1500, 1140, 4100, 1200), RP.woodD, { boil: 0 });
  for (let x = -100; x < 1200; x += 120) shape(rr(x, 1150, 100, 240, 10), { fill: RP.wood, lw: 6 });
}
