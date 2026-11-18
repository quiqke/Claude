// chars.js — the cast of «Что если Земля остановится на 1 секунду?» (original characters):
//   ТЫ (Tim) — a tall, lanky young guy: oversized orange headphones round the neck, starry pyjama trousers, fluffy slippers. Panics.
//   Зиновий Маркович — a small, round old inventor: knitted mustard cardigan under a leather welding apron, a colander helmet
//   with an antenna, goggles pushed up. Deadpan, heavy lids, always a cup of tea.
//   The Earth stop-button — a rusty old radio set held together with tape; the button is the only thing in the film that glows.
// Local coordinates: origin at the feet, y down; face = 1 looks right (3/4), -1 mirrors. Face helpers (eye, mouth, hand) follow
// the Lemo-Opuscar Sci-Fi Sitcom Toon demo (chars.js).
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text } from './toon.js';

export const PAL = {
  skinT: '#f3c7a1', skinTs: '#d8a27b', hair: '#4a2f24', tee: '#3fb6a8', teeS: '#2b8a7f', pj: '#2f3a78', pjS: '#232c5c', star: '#ffd84a',
  phone: '#ff8a2a', phoneS: '#d96812', slip: '#cfc8d8', slipS: '#a99fb8',
  skinZ: '#f0c4a6', skinZs: '#d29e83', cardi: '#e2a93b', cardiS: '#b9832a', apron: '#8a5a3a', apronS: '#6b432b', skirt: '#7a4f8f', sock: '#d8d2c4', boot: '#5a3b2e',
  colander: '#c9ced6', colanderS: '#9aa1ac', gog: '#5c6470', gogL: '#7fe0ff', bun: '#d8d6df',
  white: '#ffffff', mouthIn: '#4a1a2a', tongue: '#e8637a', cup: '#f6f1e6', cupS: '#d6ccb8', tea: '#a8622c',
  box: '#b5603a', boxS: '#8e4426', tape: '#e9d98a', glow: '#b04dff', glowL: '#e7c8ff', glowCore: '#ffffff',
};

// —— face parts (after the demo) ——
export function eye(cx, cy, rx, ry, { lid = 0, look = [0, 0], pupil = 4.5, skin = PAL.skinT, closed = false, lw = 6, jitter = 0, lower = 0 } = {}) {
  if (closed) { stroke(arc(cx, cy + ry * .15, rx * .8, ry * .45, Math.PI * .1, Math.PI * .9, 14), lw); return; }
  shape(ell(cx, cy, rx, ry, 36), {
    fill: PAL.white, lw, shade: () => {
      dot(cx + look[0] * rx * .55 + jitter, cy + look[1] * ry * .5, pupil);
      if (lid > 0) { const yl = cy - ry + lid * 2 * ry;
        fillOnly([[cx - rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, yl], [cx - rx * 1.3, yl + ry * .08]], skin, { boil: .5 });
        stroke([[cx - rx * 1.2, yl + ry * .08], [cx + rx * 1.2, yl]], lw); }
      if (lower > 0) { const yb = cy + ry - lower * 2 * ry; fillOnly([[cx - rx * 1.3, yb], [cx + rx * 1.3, yb], [cx + rx * 1.3, cy + ry * 1.4], [cx - rx * 1.3, cy + ry * 1.4]], skin, { boil: .5 }); stroke([[cx - rx * 1.2, yb], [cx + rx * 1.2, yb]], lw * .8); }
    }
  });
}
export function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, skew = 0, lw = 6, teeth = true, tongue = true } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k + skew * k], rc = [cx + hw, cy - sm * k - skew * k];
  if (o < .07) { stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw); return; }
  const h = o * mw * .62, up = quad(lc, [cx, cy - h * .25 + sm * k * .4], rc, 12), dn = quad(rc, [cx, cy + h + sm * k * .6], lc, 14);
  shape([...up, ...dn], { fill: PAL.mouthIn, lw, shade: () => {
    if (teeth && o > .22) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .32 + 6), PAL.white, { boil: .3 });
    if (tongue) fillOnly(ell(cx + hw * .15, cy + h * .95, hw * .6, h * .45, 20), PAL.tongue, { boil: .3 }); } });
}
export function hand(x, y, ang, r = 20, col = PAL.skinT, { fist = false, lw = 6 } = {}) {
  push(); translate(x, y); rotate(ang);
  const pts = fist ? spline([[-r * .6, -r * .8], [r * .7, -r * .9], [r * 1.1, -r * .1], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]])
    : spline([[-r * .5, -r * .85], [r * .5, -r * 1.05], [r * 1.35, -r * .75], [r * 1.05, -r * .3], [r * 1.5, -r * .1], [r * 1.1, r * .3], [r * 1.35, r * .7], [r * .6, r * .95], [-r * .6, r * .8], [-r * .95, 0]]);
  shape(pts, { fill: col, lw }); stroke([[r * .2, -r * .15], [r * .75, -r * .45]], lw * .6);
  pop();
}
export const sweat = (x, y, s = 1) => shape(spline([[x, y - 16 * s], [x + 9 * s, y + 4 * s], [x, y + 12 * s], [x - 9 * s, y + 4 * s]]), { fill: '#bfe9ff', lw: 5 });

// —— props ——
export function teaCup(x, y, a = 0, { steam = 0, t = 0 } = {}) {
  push(); translate(x, y); rotate(a);
  shape(spline([[26, -20], [46, -18], [46, 2], [26, 6]], false).concat([[26, 0], [38, -2], [38, -12], [26, -12]]), { fill: PAL.cup, lw: 5 });
  shape([[-30, -30], [30, -30], [22, 8], [-22, 8]], { fill: PAL.cup, lw: 6, shade: () => fillOnly(rect(8, -34, 30, 46), PAL.cupS, { boil: .3 }) });
  shape(ell(0, -30, 30, 7, 18), { fill: PAL.tea, lw: 5 });
  shape(ell(0, 12, 44, 8, 20), { fill: PAL.cup, lw: 5 });
  if (steam) for (let k = 0; k < 2; k++) { const ph = t * 1.3 + k * .5, y0 = -44 - (ph % 1) * 40, x0 = -10 + k * 20;
    stroke(spline([[x0, y0], [x0 + 8, y0 - 16], [x0 - 5, y0 - 32], [x0 + 6, y0 - 48]], false), 4, { line: `rgba(255,255,255,${.8 * (1 - (ph % 1)) * steam})` }); }
  pop();
}
// the Earth stop-button: a rusty radio with tape; press 0..1; glow 0..1 (the only glow in the film)
export function stopBox(x, y, s = 1, { press = 0, glow = 1, t = 0, label = true } = {}) {
  push(); translate(x, y); scale(s);
  if (glow > 0) { const pulse = 1 + .06 * Math.sin(t * 7);
    fillOnly(ell(0, -150, 150 * pulse, 120 * pulse, 40), `rgba(176,77,255,${.13 * glow})`, { boil: .6 });
    fillOnly(ell(0, -150, 110 * pulse, 88 * pulse, 40), `rgba(176,77,255,${.16 * glow})`, { boil: .6 }); }
  shape(rr(-150, -110, 300, 110, 14), { fill: PAL.box, lw: 7, shade: () => { fillOnly(rect(70, -120, 100, 130), PAL.boxS, { boil: .3 }); for (let i = 0; i < 5; i++) stroke([[-130, -86 + i * 16], [-40, -86 + i * 16]], 3); } });
  shape(ell(70, -55, 30, 30, 24), { fill: '#e9e2cf', lw: 6 }); stroke([[70, -55], [84, -74]], 4);       // dial
  shape([[-160, -40], [-100, -30], [-104, -14], [-162, -24]], { fill: PAL.tape, lw: 4 });                // tape
  if (label) { shape(rr(-70, -28, 140, 26, 4), { fill: PAL.tape, lw: 4 }); text('СТОП ЗЕМЛЯ', 0, -15, { font: '900 19px Nunito', fill: INK }); }
  stroke(spline([[120, -110], [130, -170], [110, -200], [136, -240]], false), 5); dot(136, -240, 8, '#ff4a3a');   // bent antenna
  // the button
  const py = -110 + press * 14;
  shape(rr(-62, -134, 124, 30, 10), { fill: '#6c7482', lw: 6 });
  shape(ell(0, py - 30, 54, 40 - press * 12, 32), { fill: glow > 0 ? PAL.glow : '#7d3bb5', lw: 7, shade: () => {
    if (glow > 0) { fillOnly(ell(-10, py - 40, 30, 18, 20), PAL.glowL, { boil: .3 }); fillOnly(ell(-18, py - 46, 10, 6, 10), PAL.glowCore, { boil: 0 }); } } });
  pop();
}

// —— ТЫ ——
// P: {x,y,s,face,lean,sq,nerv,t,look,lid,blink,brow,mouth:{o,w,sm},armL,armR:{h:[dx,dy],bend,fist},legL,legR,headTilt,sweat,eyeS,pupil,hold}
export function tim(P) {
  const f = P.face ?? 1, ner = P.nerv ?? 0;
  const jit = ner ? (hash(Math.floor((P.t || 0) * 12) * 3.3) - .5) * 8 * ner : 0;
  push(); translate(P.x + jit, P.y + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1)); rotate(P.spin || 0);
  const legL = P.legL || [0, 0], legR = P.legR || [0, 0];
  for (const [sx, lg] of [[-1, legL], [1, legR]]) {
    const hip = [sx * 26, -250], ank = [sx * 30 + lg[0], -30 + lg[1]];
    shape(noodle(hip, ank, sx * -8, 46, 40), { fill: PAL.pj, lw: 7, shade: () => { fillOnly(rect(sx > 0 ? 6 : -60, -260, 60, 260), PAL.pjS, { boil: .3 }); for (let k = 0; k < 4; k++) dot(hip[0] + (ank[0] - hip[0]) * (k + .5) / 4 + (k % 2 ? 8 : -8), hip[1] + (ank[1] - hip[1]) * (k + .5) / 4, 5, PAL.star); } });
    shape(spline([[ank[0] - 34, ank[1] + 30], [ank[0] - 30, ank[1] - 2], [ank[0] + 14, ank[1] - 8], [ank[0] + 52, ank[1] + 10], [ank[0] + 46, ank[1] + 30]]), { fill: PAL.slip, lw: 7, shade: () => fillOnly(rect(ank[0] - 50, ank[1] + 20, 120, 20), PAL.slipS, { boil: .3 }) });
  }
  push(); rotate(P.lean ?? 0);
  const shB = [-52, -470], shF = [50, -470];
  const armB = P.armL || { h: [-18, 190], bend: -18 }, armF = P.armR || { h: [18, 190], bend: 18 };
  const drawArm = (sh, arm, hold) => {
    const hp = [sh[0] + arm.h[0], sh[1] + arm.h[1]], ang = Math.atan2(hp[1] - sh[1], hp[0] - sh[0]);
    shape(noodle(sh, hp, arm.bend ?? 0, 26, 20), { fill: PAL.skinT, lw: 6 });
    shape(noodle(sh, [sh[0] + arm.h[0] * .32, sh[1] + arm.h[1] * .32], 0, 40, 36), { fill: PAL.tee, lw: 6 });
    if (hold === 'coffee') teaCup(hp[0] + 22, hp[1] - 10, (P.cupA || 0), { steam: 1, t: P.t || 0 });
    hand(hp[0], hp[1], ang, 20, PAL.skinT, { fist: arm.fist || !!hold });
  };
  drawArm(shB, armB, P.holdL);
  // t-shirt torso
  shape(spline([[-48, -496], [48, -496], [74, -420], [70, -300], [60, -240], [-60, -240], [-70, -300], [-74, -420]]), { fill: PAL.tee, lw: 7, shade: () => fillOnly(rect(20, -510, 80, 290), PAL.teeS, { boil: .4 }) });
  shape(rr(-66, -262, 132, 26, 8), { fill: PAL.pj, lw: 6 });                                       // waistband
  // neck + headphones round the neck
  shape(noodle([0, -490], [4, -526], 0, 30, 30), { fill: PAL.skinT, lw: 6 });
  shape(arc(2, -500, 60, 26, 0, Math.PI, 20).concat(arc(2, -500, 44, 14, Math.PI, 0, 20)), { fill: PAL.phone, lw: 6 });
  for (const sx of [-1, 1]) shape(ell(sx * 58, -498, 22, 28, 18), { fill: PAL.phone, lw: 6, shade: () => fillOnly(ell(sx * 58 + 8, -494, 12, 18, 12), PAL.phoneS, { boil: .3 }) });
  // head
  push(); translate(4, -610); rotate(P.headTilt ?? 0); headTim(P, ner); pop();
  drawArm(shF, armF, P.holdR);
  pop();
  if (P.sweat != null) { const u = P.sweat % 1; sweat(-86, -700 + u * 40, 1.1); sweat(96, -680 + ((u + .5) % 1) * 40, .9); }
  pop();
}
function headTim(P, ner) {
  for (const sx of [-1, 1]) shape(ell(sx * 72, 10, 14, 22, 16), { fill: PAL.skinT, lw: 6 });
  shape(spline([[0, -96], [62, -82], [80, -20], [70, 50], [36, 92], [-30, 92], [-66, 50], [-78, -20], [-60, -82]]), { fill: PAL.skinT, lw: 7, shade: () => fillOnly(ell(52, 30, 40, 70, 24), PAL.skinTs, { boil: .3 }) });
  // messy hair: a tuft that falls over the forehead
  shape(spline([[-70, -40], [-74, -86], [-30, -116], [26, -112], [70, -84], [74, -40], [46, -70], [16, -52], [-10, -76], [-36, -50]]), { fill: PAL.hair, lw: 6 });
  // brows: worried by default
  const br = P.brow ?? .8;
  stroke([[-56, -40 + br * 2], [-18, -48 - br * 10]], 7); stroke([[56, -40 + br * 2], [18, -48 - br * 10]], 7);
  const look = P.look || [0, 0], shake = ner ? (hash(Math.floor((P.t || 0) * 24) * 1.7) - .5) * 4 * ner : 0, es = P.eyeS ?? 1;
  for (const ex of [-30, 30]) eye(ex, -8, 26 * es, 30 * es, { lid: P.blink ? 1 : (P.lid ?? 0), look, pupil: P.pupil ?? 4, skin: PAL.skinT, jitter: shake, lw: 6 });
  shape(spline([[4, 6], [16, 30], [6, 40], [-6, 36]]), { fill: PAL.skinTs, lw: 5 });
  const m = P.mouth || {};
  mouth(0, 58, 46 * (P.mouthS ?? 1), { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? -.4, skew: m.skew || 0, lw: 6 });
}

// —— ЗИНОВИЙ МАРКОВИЧ ——
export function zin(P) {
  const f = P.face ?? 1;
  push(); translate(P.x, P.y + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1));
  // stout legs, thick stockings, boots
  for (const sx of [-1, 1]) { const hip = [sx * 34, -130], ank = [sx * 38, -26];
    shape(noodle(hip, ank, 0, 40, 38), { fill: PAL.sock, lw: 6 });
    shape(spline([[ank[0] - 30, ank[1] + 26], [ank[0] - 28, ank[1] - 4], [ank[0] + 16, ank[1] - 6], [ank[0] + 44, ank[1] + 12], [ank[0] + 40, ank[1] + 26]]), { fill: PAL.boot, lw: 6 }); }
  push(); rotate(P.lean ?? 0);
  const armB = P.armL || { h: [-30, 120], bend: -14 }, armF = P.armR || { h: [40, 110], bend: 16 };
  const shB = [-74, -300], shF = [70, -300];
  const drawArm = (sh, arm, hold) => {
    const hp = [sh[0] + arm.h[0], sh[1] + arm.h[1]], ang = Math.atan2(hp[1] - sh[1], hp[0] - sh[0]);
    shape(noodle(sh, hp, arm.bend ?? 0, 40, 32), { fill: PAL.cardi, lw: 6, shade: () => fillOnly(rect(sh[0] - 40, sh[1] - 10, 80, 30), PAL.cardiS, { boil: .3 }) });
    if (hold === 'tea') teaCup(hp[0] + 20, hp[1] - 16, -(P.lean ?? 0), { steam: 1, t: P.t || 0 });
    hand(hp[0], hp[1], ang, 18, PAL.skinZ, { fist: arm.fist || !!hold });
  };
  drawArm(shB, armB, P.holdL);
  // round body: skirt, cardigan, apron
  shape(spline([[-96, -150], [96, -150], [110, -120], [-110, -120]]), { fill: PAL.skirt, lw: 6 });
  shape(spline([[0, -340], [86, -314], [120, -220], [100, -130], [0, -112], [-100, -130], [-120, -220], [-86, -314]]), { fill: PAL.cardi, lw: 7, shade: () => {
    fillOnly(spline([[40, -350], [120, -300], [140, -200], [110, -110], [60, -110], [96, -220]]), PAL.cardiS, { boil: .4 });
    for (let k = 0; k < 6; k++) stroke([[-110, -300 + k * 30], [110, -300 + k * 30]], 2.5, { line: PAL.cardiS }); } });
  shape(spline([[-46, -300], [46, -300], [70, -130], [-70, -130]]), { fill: PAL.apron, lw: 6, shade: () => fillOnly(rect(16, -310, 70, 190), PAL.apronS, { boil: .3 }) });
  shape(rr(-30, -220, 60, 40, 6), { fill: PAL.apronS, lw: 5 });                              // apron pocket with a screwdriver
  stroke([[12, -230], [22, -262]], 6, { line: '#ffd84a' });
  // head
  push(); translate(0, -390); rotate(P.headTilt ?? 0); headZin(P); pop();
  drawArm(shF, armF, P.holdR);
  pop();
  pop();
}
function headZin(P) {
  for (const sx of [-1, 1]) shape(spline([[sx * 70, -40], [sx * 96, -20], [sx * 100, 14], [sx * 82, 30], [sx * 74, 0]]), { fill: PAL.bun, lw: 6 });   // grey side tufts
  shape(spline([[0, -84], [62, -70], [84, -10], [74, 50], [36, 80], [-36, 80], [-74, 50], [-84, -10], [-62, -70]]), { fill: PAL.skinZ, lw: 7, shade: () => {
    fillOnly(ell(50, 26, 36, 56, 22), PAL.skinZs, { boil: .3 }); for (const cx of [-44, 46]) fillOnly(ell(cx, 30, 16, 10, 12), '#f2a59a', { boil: .3 }); } });
  // colander helmet with an antenna, goggles pushed up on its rim
  shape([...arc(0, -48, 96, 74, Math.PI, TAU, 30), [96, -40], [-96, -40]], { fill: PAL.colander, lw: 7, shade: () => {
    fillOnly(ell(44, -86, 50, 34, 20), PAL.colanderS, { boil: .3 });
    for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) dot(-70 + i * 18 + (j % 2) * 9, -64 - j * 20, 3.4, '#6b7280'); } });
  stroke([[-112, -42], [112, -42]], 9);                                                        // rim
  stroke(spline([[0, -122], [8, -160], [-6, -190], [10, -216]], false), 5); dot(10, -218, 9, '#ff4a3a');
  for (const [gx, gr] of [[-30, 20], [30, 20]]) shape(ell(gx, -44, gr, gr * .8, 20), { fill: PAL.gog, lw: 6, shade: () => fillOnly(ell(gx, -44, gr * .6, gr * .5, 16), PAL.gogL, { boil: .3 }) });
  // heavy-lidded eyes, small round glasses-free deadpan
  const look = P.look || [0, 0], lid = P.blink ? 1 : (P.lid ?? .55);
  for (const ex of [-26, 26]) eye(ex, 6, 20, 22, { lid, look, pupil: 4, skin: PAL.skinZ, lw: 6, closed: P.closed });
  for (const ex of [-26, 26]) stroke(arc(ex, 30, 16, 6, Math.PI * .15, Math.PI * .85, 8), 3.5);   // eye bags
  const br = P.brow ?? 0; stroke([[-44, -20 - br * 6], [-10, -22 - br * 10]], 6); stroke([[44, -20 - br * 6], [10, -22 - br * 10]], 6);
  shape(ell(0, 30, 11, 9, 12), { fill: PAL.skinZs, lw: 5 });
  const m = P.mouth || {};
  shape(spline([[-4, 40], [-40, 38], [-62, 56], [-46, 52], [-20, 50], [0, 46], [20, 50], [46, 52], [62, 56], [40, 38], [4, 40]]), { fill: PAL.bun, lw: 5 });   // walrus moustache
  mouth(0, 64, 34, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? -.15, skew: m.skew || 0, lw: 6, teeth: false });
}
