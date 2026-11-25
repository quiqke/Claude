// countries.js — country puppets as coloured stickmen with round heads (the «А что если — круглоголовые» style):
// they personify a side, never a real person; no symbols, emblems, flags or insignia anywhere.
import { hash, TAU } from '/core/lib.js';
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, quad, dot, text } from './toon.js';
import { roundHead, RP } from './round.js';

export const SIDES = {
  de: { coat: '#7d8372', coatS: '#5f6556', legs: '#3e4238', shoe: '#1f1f1f', hat: 'cap', hatC: '#6f7564', prop: 'pointer' },
  gb: { coat: '#b8323a', coatS: '#8e2229', legs: '#2c2f3a', shoe: '#1f1f1f', hat: 'bowler', hatC: '#2a2a30', prop: 'umbrella' },
  su: { coat: '#5b6a52', coatS: '#46533f', legs: '#4a4a4a', shoe: '#cfc7b2', hat: 'ushanka', hatC: '#6b4a32', prop: null },
  us: { coat: '#2f4b8a', coatS: '#223868', legs: '#e9e4da', shoe: '#1f1f1f', hat: 'tophat', hatC: '#2f4b8a', prop: 'tag' },
  it: { coat: '#4f6b55', coatS: '#3d5442', legs: '#2c2f3a', shoe: '#1f1f1f', hat: 'feather', hatC: '#2a2a30', prop: null },
  vi: { coat: '#3b5a8a', coatS: '#2c4468', legs: '#9a3030', shoe: '#1f1f1f', hat: 'kepi', hatC: '#3b5a8a', prop: null },
  sk: { coat: '#6f7598', coatS: '#585d7c', legs: '#3a3d50', shoe: '#1f1f1f', hat: 'none', hatC: '#000', prop: null },
  hr: { coat: '#8a4f4f', coatS: '#6e3d3d', legs: '#3a3030', shoe: '#1f1f1f', hat: 'none', hatC: '#000', prop: null },
  gr: { coat: '#7c7a74', coatS: '#64625d', legs: '#4a4844', shoe: '#1f1f1f', hat: 'none', hatC: '#000', prop: null },
  sab: { coat: '#2f3530', coatS: '#222622', legs: '#2a2c26', shoe: '#1f1f1f', hat: 'beanie', hatC: '#3e4238', prop: null },
};
function limb(a, b, bend = 0, w = 12) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; stroke(quad(a, [(a[0] + b[0]) / 2 - dy / L * bend, (a[1] + b[1]) / 2 + dx / L * bend], b, 14), w); }
function hat(kind, c) {
  if (kind === 'cap') { shape(spline([[-96, -70], [-90, -130], [0, -150], [92, -130], [100, -74]]), { fill: c, lw: 7 }); shape(rr(-110, -82, 220, 26, 10), { fill: '#3e4238', lw: 6 }); shape(spline([[20, -58], [130, -50], [120, -34], [10, -40]]), { fill: '#2a2c26', lw: 6 }); }
  if (kind === 'bowler') { shape(arc(0, -70, 82, 78, Math.PI, TAU, 26).concat([[82, -70], [-82, -70]]), { fill: c, lw: 7 }); shape(ell(0, -70, 116, 18, 30), { fill: c, lw: 7 }); }
  if (kind === 'ushanka') { shape(rr(-100, -150, 200, 96, 30), { fill: c, lw: 7, shade: () => fillOnly(rect(-110, -110, 230, 20), '#5a3d28', { boil: .3 }) }); for (const sx of [-1, 1]) shape(rr(sx * 96 - 26, -80, 52, 96, 20), { fill: c, lw: 6 }); }
  if (kind === 'feather') { shape(arc(0, -70, 90, 50, Math.PI, TAU, 24).concat([[90, -70], [-90, -70]]), { fill: c, lw: 7 }); shape(ell(0, -70, 120, 16, 30), { fill: c, lw: 6 }); shape(spline([[40, -100], [120, -150], [190, -120], [130, -110]]), { fill: '#2f4a33', lw: 5 }); }
  if (kind === 'kepi') { shape(rr(-80, -150, 160, 86, 12), { fill: c, lw: 7, shade: () => fillOnly(rect(-90, -90, 180, 16), '#9a3030', { boil: .3 }) }); shape(spline([[-70, -66], [90, -70], [130, -52], [-60, -56]]), { fill: '#2a2a30', lw: 6 }); }
  if (kind === 'beanie') { shape(arc(0, -60, 100, 90, Math.PI, TAU, 26).concat([[100, -60], [-100, -60]]), { fill: c, lw: 7 }); shape(rr(-104, -76, 208, 26, 10), { fill: c, lw: 6 }); }
  if (kind === 'tophat') { shape(rr(-64, -250, 128, 190, 10), { fill: c, lw: 7, shade: () => fillOnly(rect(-70, -110, 140, 30), '#f1ece2', { boil: .3 }) }); shape(ell(0, -62, 112, 18, 30), { fill: c, lw: 7 }); }
}
// P: {x,y,s,face,side,mood,look,o,lean,armL,armR:{h,bend},legL,legR,hold:'umbrella-open'|..., t, nerv, sq}
export function puppet(P) {
  const D = SIDES[P.side], f = P.face ?? 1, ner = P.nerv ?? 0;
  const jit = ner ? (hash(Math.floor((P.t || 0) * 12) * 3.3) - .5) * 8 * ner : 0;
  push(); translate(P.x + jit, P.y); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1));
  const legL = P.legL || [0, 0], legR = P.legR || [0, 0];
  for (const [sx, lg] of [[-1, legL], [1, legR]]) { const ft = [sx * 42 + lg[0], -6 + lg[1]]; limb([sx * 16, -200], ft, sx * -6); shape(ell(ft[0] + 14, ft[1] - 6, 30, 14, 18), { fill: D.shoe, lw: 6 }); }
  push(); rotate(P.lean ?? 0);
  const shL = [-46, -390], shR = [46, -390], aL = P.armL || { h: [-40, 150], bend: -12 }, aR = P.armR || { h: [40, 150], bend: 12 };
  const hand = (sh, a) => [sh[0] + a.h[0], sh[1] + a.h[1]];
  const armL = () => { const hp = hand(shL, aL); limb(shL, hp, aL.bend); dot(hp[0], hp[1], 13); };
  const armR = () => { const hp = hand(shR, aR); limb(shR, hp, aR.bend); dot(hp[0], hp[1], 13); prop(hp); };
  const prop = (hp) => {
    if (D.prop === 'pointer' && !P.noProp) stroke([[hp[0], hp[1]], [hp[0] + 120, hp[1] - 120]], 9, { line: '#5a3d28' });
    if (D.prop === 'umbrella') { const open = P.umbrella || 0;
      if (open > .5) { push(); translate(hp[0], hp[1] - 160); shape(arc(0, 0, 150, 90, Math.PI, TAU, 24).concat([[150, 0], [100, 14], [50, 0], [0, 14], [-50, 0], [-100, 14], [-150, 0]]), { fill: '#2a2a30', lw: 7 }); stroke([[0, 0], [0, 160]], 7); pop(); }
      else stroke([[hp[0], hp[1] - 60], [hp[0], hp[1] + 120]], 9, { line: '#2a2a30' }); }
    if (D.prop === 'tag' && P.tag) { push(); translate(hp[0] + 40, hp[1] - 40); rotate(-.15);
      for (const [r, a] of [[150, .12], [110, .16]]) fillOnly(ell(0, 0, r, r * .8, 30), `rgba(255,214,90,${a})`, { boil: .6 });
      shape(rr(-90, -46, 180, 92, 12), { fill: '#ffe59a', lw: 7 }); text('1945', 0, 2, { font: '400 58px "Russo One"', fill: INK }); pop(); }
  };
  armL();
  shape(spline([[-48, -410], [48, -410], [64, -300], [58, -196], [-58, -196], [-64, -300]]), { fill: D.coat, lw: 7, shade: () => { fillOnly(rect(18, -420, 60, 240), D.coatS, { boil: .3 }); for (let k = 0; k < 4; k++) dot(0, -370 + k * 44, 6, D.coatS); } });
  shape(rr(-58, -216, 116, 40, 10), { fill: D.legs, lw: 6 });
  stroke([[0, -410], [0, -440]], 12);
  push(); translate(0, -580); rotate(P.headTilt ?? 0); scale(1.45);
  roundHead(96, P.mood || 'deadpan', { look: P.look, o: P.o });
  // the mouth (round.js keeps its mouth helper private: a small line or an open oval)
  const m = P.mood || 'deadpan', o = P.o || 0;
  if (m === 'panic' || m === 'shock' || o > .2) shape(ell(0, 66, 18, m === 'shock' ? 30 : 20, 18), { fill: '#4a1a2a', lw: 5 });
  else stroke(quad([-18, 58], [0, m === 'smug' ? 66 : 60], [18, m === 'smug' ? 50 : 58], 8), 6);
  if (P.side === 'gb') { shape(spline([[-4, 34], [-46, 30], [-72, 52], [-48, 48], [-16, 44], [0, 40], [16, 44], [48, 48], [72, 52], [46, 30], [4, 34]]), { fill: '#b98b58', lw: 5 }); }
  hat(D.hat, D.hatC);
  pop();
  armR();
  pop(); pop();
}
// scissors: open is 0..1, drawn at (x,y) pointing along angle a
export function scissors(x, y, a, open) {
  push(); translate(x, y); rotate(a);
  for (const s of [-1, 1]) { push(); rotate(s * open * .35);
    shape([[0, 0], [150, s * 10], [170, 0], [150, -s * 4], [0, -s * 14]], { fill: '#d6dbe2', lw: 6 });
    shape(ell(-70, s * 34, 40, 26, 20), { fill: '#c8402f', lw: 7, shade: () => fillOnly(ell(-70, s * 34, 22, 12, 16), '#f3ead8', { boil: 0 }) });
    stroke([[0, -s * 4], [-40, s * 24]], 10); pop(); }
  dot(0, 0, 8, '#8a8f98');
  pop();
}
