// Shots for «Ловушка». Each: build(E) → { S, update(t), post(), grade() }, t = film seconds. E: { VO, dur, F(id,f), AT(id,word), T0, dur, variant }
import * as THREE from 'three';
import { sheet, skyPanel } from './paper.js';
import { stage, aim } from './stage.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry, TAU } from './lib.js';
import { PAPER, tint, cut, person, flames, rock, city, grain, bones, strip } from './motifs.js';

const flick = t => 1 + .07 * Math.sin(7.3 * t) * Math.sin(3.1 * t) + .04 * Math.sin(13.7 * t + 1);
const P = (x, fn) => { x.fillStyle = PAPER; x.strokeStyle = PAPER; fn(); };
const panel = (U, o) => { const m = sheet({ U, w: o.w, h: o.h, z: o.z, x: o.x || 0, y: o.y || 0, trans: o.trans ?? .9, shadow: false, glow: o.glow ?? 0, glowCol: o.glowCol,
  draw: x => P(x, () => x.fillRect(-o.w / 2, -o.h / 2, o.w, o.h)), glowDraw: o.glow ? (x => { x.fillStyle = '#fff'; x.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); }) : null }); return tint(m, o.col); };

// ═════ S1 / S9: two windows — the cave fire above, an office window (or a phone) below
export function twoWindows(E) {
  const phone = E.variant === 'phone';
  const S = stage({ light: [0, .07, -.11], lightR: .07, lightCol: '#ffae5c', key: 1.3, amb: .22, ambCol: '#7d8fc0', floor: .12 });
  const { U } = S, W = .22, H = .34;
  S.add(skyPanel({ w: .34, h: .5, z: -.142, stops: [[0, '#1d0f06'], [.42, '#3a1c0a'], [.5, '#0b1430'], [1, '#1a2a58']], stars: 0, gain: 1 }));
  const wall = S.add(sheet({ U, w: W, h: H, z: -.12, trans: .9, draw: x => P(x, () => rock(x, -.12, .12, .14, .005, 3, .01)) }));
  tint(wall, '#c9803e');
  const arch = S.add(sheet({ U, w: W, h: H, z: -.085, trans: .4, draw: x => P(x, () => {
    x.fillRect(-.12, .118, .24, .06); x.beginPath(); x.moveTo(-.12, .005); x.quadraticCurveTo(-.085, .02, -.08, .07); x.quadraticCurveTo(-.06, .125, 0, .122); x.quadraticCurveTo(.07, .125, .082, .065); x.quadraticCurveTo(.088, .02, .12, .005); x.lineTo(.12, .2); x.lineTo(-.12, .2); x.closePath(); x.fill(); }) }));
  tint(arch, '#6a3518');
  const fire = S.add(sheet({ U, w: .06, h: .06, z: -.05, x: 0, y: .036, trans: .95, glow: 2.2, glowCol: '#ffb455',
    draw: x => P(x, () => flames(x, 0, -.02, .02)), glowDraw: x => { x.fillStyle = '#fff'; flames(x, 0, -.02, .02, true); } }));
  tint(fire, '#ff9a3c');
  const folk = S.add(sheet({ U, w: W, h: .12, z: -.04, y: .05, trans: .06, draw: x => P(x, () => {
    person(x, -.045, -.034, .04, { sit: true, hair: true, w: .07, arms: [[.8, 2.4], [.9, 2.2]], legs: [[1.4, .2], [1.2, .1]] });
    person(x, .042, -.034, .046, { hair: true, spear: true, w: .07, arms: [[-.3, -.2], [1.2, 2.3]] });
    person(x, -.02, -.034, .028, { sit: true, flip: true, w: .07, arms: [[.6, 1.9], [.8, 2.0]], legs: [[1.4, .2], [1.3, .1]] }); }) }));
  tint(folk, '#160a04');
  const band = S.add(sheet({ U, w: .3, h: .03, z: -.02, y: 0, trans: .05, draw: x => P(x, () => rock(x, -.15, .15, .012, -.015, 7, .006)) }));
  tint(band, '#0b0705');
  // the night city (left) and an office block with one lit window (right); everything above the subtitle band (y > -.065)
  const far = S.add(sheet({ U, w: .3, h: .2, z: -.115, y: 0, trans: .7, glow: 1.0, glowCol: '#a9c4ff',
    draw: x => P(x, () => city(x, -.15, .15, -.08, { seed: 2, bh: .06, holes: false })),
    glowDraw: x => { x.fillStyle = '#fff'; city(x, -.15, .15, -.08, { seed: 2, bh: .06, glow: true, lit: (k, r) => r < .45 }); } }));
  tint(far, '#4a5f9a');
  const mid = S.add(sheet({ U, w: .3, h: .2, z: -.08, y: 0, trans: .25, glow: 1.4, glowCol: '#d8e6ff',
    draw: x => P(x, () => city(x, -.15, .15, -.095, { seed: 5, bh: .05, bw: .034, holes: false })),
    glowDraw: x => { x.fillStyle = '#fff'; city(x, -.15, .15, -.095, { seed: 5, bh: .05, bw: .034, glow: true, lit: (k, r) => r < .35 }); } }));
  tint(mid, '#22305c');
  const WX = .028, WY = -.037;                                         // the lit office window
  const lamp = S.add(panel(U, { w: .08, h: .04, z: -.045, x: WX, y: WY, col: phone ? '#0d1530' : '#9fb8e8', trans: .9, glow: phone ? .15 : 1.3, glowCol: '#cfe0ff' }));
  const room = S.add(sheet({ U, w: .3, h: .2, z: -.035, y: 0, trans: .03, glow: 3.0, glowCol: '#e2ecff',
    draw: x => P(x, () => {
      x.fillRect(-.005, -.15, .2, .135);                                 // the office block, roof at y = -.015
      x.fillRect(-.15, -.15, .3, .085);                                  // dark street below (subtitle band)
      x.save(); x.translate(WX, WY);
      cut(x, () => x.fillRect(-.033, -.016, .066, .032));
      x.fillRect(-.033, -.001, .066, .0018); x.fillRect(-.0009, -.016, .0018, .032);
      if (phone) person(x, -.008, -.016, .026, { sit: true, bend: .7, w: .07, arms: [[1.7, 2.6], [1.5, 2.8]], legs: [[1.4, .3], [1.3, .2]] });
      else { person(x, -.014, -.016, .027, { sit: true, bend: .55, w: .07, arms: [[1.3, 1.9], [1.5, 1.8]], legs: [[1.5, .2], [1.4, .1]] }); x.fillRect(.002, -.006, .026, .0018); x.fillRect(.018, -.016, .0018, .01); x.fillRect(.007, -.004, .013, .009); }
      x.restore();
    }),
    glowDraw: x => { x.fillStyle = '#fff'; x.translate(WX, WY); if (phone) x.fillRect(.004, -.0005, .005, .008); else x.fillRect(.0075, -.0035, .012, .008); } }));
  tint(room, '#05070d');
  const s17 = strip(U, '17 ч', { w: .044, h: .016, x: -.024, y: .085, z: -.012, col: '#e8c89a' }); S.add(s17.mesh);
  const s40 = strip(U, '40 ч', { w: .044, h: .016, x: .028, y: -.003, z: -.012, col: '#aebfe0' }); S.add(s40.mesh);
  const tA = phone ? 1e9 : E.AT('l01', 'вдвое'), tB = phone ? 1e9 : E.AT('l01', 'тебя'), tH = phone ? 1e9 : E.AT('l02', 'здоровее');
  return {
    S,
    update(t) {
      const lt = t - E.T0;
      U.uLightCol.value.set('#ffae5c').multiplyScalar(flick(t) * (1 + .3 * Math.exp(-Math.max(0, t - tH) * 2) * (t > tH)));
      fire.material.emissiveIntensity = 2.2 * flick(t + .4);
      s17.set(eo(seg(t, tA, tA + .5))); s40.set(eo(seg(t, tB, tB + .5)));
      const off = t > tH && t < tH + .6 ? .3 + .7 * Math.abs(Math.sin((t - tH) * 29)) : 1;
      lamp.material.emissiveIntensity = (phone ? .1 : .55) * off;
      room.material.emissiveIntensity = (phone ? 3 * flick(t * 2.3) : 1.6) * off;
      const z = lerp(.46, .41, eio(lt / E.dur)), y = lerp(.012, .016, eio(lt / E.dur));
      aim(S.cam, [0, y, z, 0, y, -.06], t);
    },
    post() { return { focus: S.cam.position.z + .045, aper: 7, maxCoc: 8, bloom: { strength: .45, radius: .55, threshold: 1.0 } }; },
    grade() { return { vig: .45 }; },
  };
}

// ═════ S2: the trap, glimpsed — a propped box over one glowing grain (open loop)
export function trapTease(E) {
  const S = stage({ light: [0, -.035, -.06], lightR: .045, lightCol: '#ffc870', key: 1.0, amb: .18, ambCol: '#6d5a8a', floor: .14 });
  const { U } = S;
  S.add(skyPanel({ w: .34, h: .5, z: -.142, stops: [[0, '#0d0a1e'], [.55, '#3a2347'], [.8, '#a0503a'], [1, '#2a1208']], stars: 90, starMinY: .02 }));
  const hills = S.add(sheet({ U, w: .26, h: .36, z: -.115, trans: .8, draw: x => P(x, () => rock(x, -.13, .13, -.02, -.18, 11, .02)) })); tint(hills, '#7a4a5a');
  const field = S.add(sheet({ U, w: .26, h: .36, z: -.08, trans: .45, draw: x => P(x, () => { rock(x, -.13, .13, -.045, -.18, 4, .006); cut(x, () => { x.lineWidth = .0008; for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(-.13, -.06 - k * .012); x.quadraticCurveTo(0, -.054 - k * .012, .13, -.062 - k * .012); x.stroke(); } }); }) })); tint(field, '#5a3020');
  const g = S.add(sheet({ U, w: .02, h: .03, z: -.06, x: 0, y: -.04, trans: .9, glow: 2.6, glowCol: '#ffd27a', draw: x => P(x, () => grain(x, 0, -.012, .02)), glowDraw: x => { x.fillStyle = '#fff'; grain(x, 0, -.012, .02); } }));
  tint(g, '#ffcf6a');
  const boxA = -.42, hinge = [.035, -.052];
  const box = S.add(sheet({ U, w: .2, h: .2, z: -.035, x: 0, y: 0, ax: hinge[0], ay: hinge[1], trans: .05, draw: x => P(x, () => {
    x.save(); x.translate(hinge[0], hinge[1]); x.rotate(boxA); x.fillRect(-.07, 0, .07, .045);
    cut(x, () => { x.lineWidth = .0012; for (const u of [-.052, -.035, -.018]) { x.beginPath(); x.moveTo(u, .004); x.lineTo(u, .041); x.stroke(); } }); x.restore();
    const [lx, ly] = [hinge[0] - .07 * Math.cos(boxA), hinge[1] - .07 * Math.sin(boxA)];
    x.lineWidth = .0022; x.lineCap = 'round'; x.beginPath(); x.moveTo(lx + .003, hinge[1]); x.lineTo(lx + .002, ly + .002); x.stroke();
    x.lineWidth = .0008; x.beginPath(); x.moveTo(lx + .003, hinge[1] + .003); x.quadraticCurveTo(lx - .03, hinge[1] - .006, -.13, hinge[1] - .004); x.stroke();
    rock(x, -.13, .13, hinge[1], -.2, 2, .003); }) }));
  tint(box, '#0a0605');
  return {
    S,
    update(t) {
      const lt = t - E.T0, k = flick(t * .6);
      g.material.emissiveIntensity = 2.6 * k; U.uLightCol.value.set('#ffc870').multiplyScalar(k);
      const z = lerp(.44, .36, eio(lt / E.dur));
      aim(S.cam, [0, -.03, z, 0, -.035, -.06], t);
    },
    post() { return { focus: S.cam.position.z + .06, aper: 9, maxCoc: 10, bloom: { strength: .55, radius: .6, threshold: .95 } }; },
    grade() { return { vig: .5 }; },
  };
}

// ═════ S3: the dig — two skeletons cut out of the earth, lit from behind (healthy warm / sick dim)
export function dig(E) {
  const S = stage({ light: [-.03, -.01, -.11], lightR: .06, lightCol: '#ffd9a0', key: 1.1, amb: .2, ambCol: '#8a7a6a', floor: .2 });
  const { U } = S;
  S.add(skyPanel({ w: .34, h: .5, z: -.142, stops: [[0, '#2a1a10'], [1, '#120a06']] }));
  const warm = S.add(panel(U, { w: .09, h: .3, z: -.1, x: -.042, col: '#ffe2b0', trans: 1.0, glow: .55, glowCol: '#ffd8a0' }));
  const cold = S.add(panel(U, { w: .09, h: .3, z: -.1, x: .048, col: '#93a08a', trans: .6, glow: .12, glowCol: '#b8c4a8' }));
  const L = [-.035, -.1], Rr = [.04, -.1];
  const soil = S.add(sheet({ U, w: .26, h: .4, z: -.04, trans: .1, draw: x => P(x, () => {
    x.fillRect(-.13, -.2, .26, .4);
    cut(x, () => {
      bones(x, L[0], L[1], .13, 0); bones(x, Rr[0], Rr[1] - .002, .1, .55);
      x.lineWidth = .0007; const R = mulberry(5);
      for (let k = 0; k < 9; k++) { const y0 = .12 - k * .035; x.beginPath(); x.moveTo(-.13, y0); for (let u = -.13; u <= .13; u += .01) x.lineTo(u, y0 + .003 * Math.sin(u * 60 + k)); x.stroke(); }
      for (let k = 0; k < 60; k++) { x.beginPath(); x.arc((R() - .5) * .26, (R() - .5) * .36, .0006 + R() * .0015, 0, TAU); x.fill(); }
    });
    x.lineWidth = .003; x.beginPath(); x.moveTo(-.13, .06); x.lineTo(.13, .06); x.stroke(); }) }));
  tint(soil, '#24140b');
  const top = S.add(sheet({ U, w: .26, h: .1, z: -.02, y: .1, trans: .05, draw: x => P(x, () => { rock(x, -.13, .13, -.02, .05, 8, .004); x.fillRect(-.13, -.02, .26, .07); for (let u = -.12; u < .13; u += .006) { x.beginPath(); x.moveTo(u, -.02); x.lineTo(u + .002, -.012 - (u * 97 % 1 + 1) * .003); x.lineTo(u + .004, -.02); x.fill(); } }) }));
  tint(top, '#0c0704');
  const t1 = E.AT('l04', 'у охотников'), t2 = E.AT('l04', 'у первых');
  return {
    S,
    update(t) {
      const lt = t - E.T0;
      const xs = lt < 0 ? 0 : t < t1 ? lerp(0, 0, 0) : t < t2 ? lerp(0, -.03, eio(seg(t, t1, t1 + 1.4))) : lerp(-.03, .035, eio(seg(t, t2, t2 + 1.4)));
      const z = lerp(.44, .36, eio(seg(t, t1 - .3, t1 + 1.2)));
      U.uLight.value.set(xs * 1.1, -.01, -.11);
      aim(S.cam, [xs, -.01, z, xs, -.015, -.06], t);
      cold.material.emissiveIntensity = .12 * (1 + .25 * Math.sin(t * 2.1));
    },
    post() { return { focus: S.cam.position.z + .04, aper: 7, maxCoc: 8, bloom: { strength: .4, radius: .5, threshold: 1.0 } }; },
    grade() { return { vig: .45 }; },
  };
}

// ═════ S4: night camp — sleep, music, stories; then the lamp goes out and one grain lights up
export function camp(E) {
  const S = stage({ light: [0, -.025, -.08], lightR: .09, lightCol: '#ff9a48', key: 1.2, amb: .3, ambCol: '#6a7eb8', floor: .2 });
  const { U } = S;
  const sky = S.add(skyPanel({ w: .34, h: .5, z: -.142, stops: [[0, '#04081a'], [.6, '#122454'], [1, '#2a2040']], stars: 260, starMinY: -.05 }));
  const far = S.add(sheet({ U, w: .26, h: .36, z: -.12, trans: .7, draw: x => P(x, () => rock(x, -.13, .13, -.01, -.18, 21, .025)) })); tint(far, '#6a80c0');
  const mid = S.add(sheet({ U, w: .26, h: .36, z: -.09, trans: .35, draw: x => P(x, () => { rock(x, -.13, .13, -.035, -.18, 13, .01); for (let u = -.12; u < .13; u += .016) { const h = .015 + (Math.sin(u * 91) + 1) * .01; x.beginPath(); x.moveTo(u - .005, -.037); x.lineTo(u, -.037 + h); x.lineTo(u + .005, -.037); x.fill(); } }) })); tint(mid, '#3a4f8a');
  const fire = S.add(sheet({ U, w: .06, h: .06, z: -.06, x: 0, y: -.032, trans: .95, glow: 2.4, glowCol: '#ffb455', draw: x => P(x, () => flames(x, 0, -.02, .024)), glowDraw: x => { x.fillStyle = '#fff'; flames(x, 0, -.02, .024, true); } }));
  tint(fire, '#ff9a3c');
  const folk = S.add(sheet({ U, w: .26, h: .2, z: -.045, y: -.05, trans: .05, draw: x => P(x, () => {
    const gy = -.003;
    person(x, -.05, gy, .042, { rot: Math.PI / 2 * .98, w: .07, arms: [[-.3, -.2], [.2, .1]], legs: [[-.06, -.03], [.06, .03]] });   // asleep
    person(x, -.03, gy, .036, { sit: true, hair: true, flute: true, w: .07, arms: [[1.2, 2.2], [1.4, 2.0]], legs: [[1.4, .3], [1.3, .2]] });
    person(x, .036, gy, .05, { hair: true, w: .07, arms: [[-2.2, -2.8], [2.3, 2.9]] });   // the storyteller
    person(x, .06, gy, .03, { sit: true, flip: true, w: .07, arms: [[.7, 1.9], [.9, 2.1]], legs: [[1.4, .2], [1.3, .1]] });
    rock(x, -.13, .13, gy + .001, -.1, 31, .003); }) }));
  tint(folk, '#0d0603');
  const g = S.add(sheet({ U, w: .02, h: .03, z: -.02, x: 0, y: -.075, trans: .9, glow: 0, glowCol: '#ffd27a', draw: x => P(x, () => grain(x, 0, -.012, .016)), glowDraw: x => { x.fillStyle = '#fff'; grain(x, 0, -.012, .016); } }));
  tint(g, '#3a2a10');
  const s17 = strip(U, '17 ч', { w: .05, h: .018, x: -.03, y: .022, z: -.03, col: '#e8c89a' }); S.add(s17.mesh);
  const tS = E.AT('l05', 'семнадцати'), tOff = E.VO.l05 + E.D.l05 + .25, tG = E.AT('l06', 'зерно') - .1;
  return {
    S,
    update(t) {
      const lt = t - E.T0, off = 1 - ss(seg(t, tOff, tOff + .6)), gon = ss(seg(t, tG, tG + .5));
      U.uLit.value = off; fire.material.emissiveIntensity = 2.4 * flick(t + .3) * off;
      U.uLightCol.value.set(t > tOff + .6 ? '#ffd27a' : '#ff9a48').multiplyScalar(t > tOff + .6 ? 1 : flick(t));
      if (t > tOff + .6) { U.uLight.value.set(0, -.08, -.05); U.uLightR.value = .03; U.uLit.value = .55 * gon; }
      else { U.uLight.value.set(0, -.03, -.08); U.uLightR.value = .06; }
      S.amb.intensity = .2 * Math.max(off, .15 * gon); S.key.intensity = 1.0 * Math.max(off, .25 * gon);
      sky.material.color.setScalar(Math.max(off, .1));
      g.material.emissiveIntensity = 3.2 * gon * flick(t * .5); tint(g, gon > .01 ? '#ffcf6a' : '#3a2a10');
      s17.set(eo(seg(t, tS, tS + .5)) * off);
      const z = t < tOff ? lerp(.4, .35, eio(seg(lt, 0, tOff - E.T0))) : lerp(.35, .27, eio(seg(t, tG - .2, E.T0 + E.dur)));
      const y = t < tOff ? -.04 : lerp(-.04, -.07, eio(seg(t, tG - .2, E.T0 + E.dur)));
      aim(S.cam, [0, y, z, 0, y - .005, -.06], t);
    },
    post() { return { focus: S.cam.position.z + .05, aper: 7, maxCoc: 8, bloom: { strength: .55, radius: .6, threshold: .95 } }; },
    grade(t) { return { vig: .5 }; },
  };
}

// ═════ S6: growth — from the grain, layers rise: fields, huts, more fields, the crowd; the forest (the way back) slides away; the box shuts
export function growth(E) {
  const S = stage({ light: [0, .02, -.12], lightR: .1, lightCol: '#ffd08a', key: 1.2, amb: .26, ambCol: '#a08a70', floor: .25 });
  const { U } = S;
  S.add(skyPanel({ w: .5, h: .6, z: -.142, stops: [[0, '#3a4a7a'], [.55, '#e8a868'], [1, '#f6d6a0']], stars: 0 }));
  const sun = S.add(sheet({ U, w: .04, h: .04, z: -.135, y: .02, trans: 1, shadow: false, glow: 1.5, glowCol: '#ffe6b0', draw: x => P(x, () => { x.beginPath(); x.arc(0, 0, .016, 0, TAU); x.fill(); }), glowDraw: x => { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, .016, 0, TAU); x.fill(); } }));
  tint(sun, '#fff0c8');
  const mk = (z, col, trans, fn, y0) => { const m = S.add(sheet({ U, w: .4, h: .3, z, trans, draw: x => P(x, () => fn(x)) })); tint(m, col); m.userData.y0 = y0; return m; };
  const R = mulberry(8);
  const fields1 = mk(-.11, '#e2a85a', .75, x => { rock(x, -.2, .2, -.0, -.15, 3, .004); cut(x, () => { x.lineWidth = .0007; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(-.2, -.012 - k * .01); x.lineTo(.2, -.008 - k * .01); x.stroke(); } }); }, -.12);
  const huts = mk(-.09, '#a8643a', .45, x => { rock(x, -.2, .2, -.03, -.15, 5, .003); for (let k = 0; k < 9; k++) { const u = -.16 + k * .04 + R() * .01, h = .012 + R() * .006; x.beginPath(); x.moveTo(u - .012, -.03); x.lineTo(u - .012, -.03 + h); x.lineTo(u, -.03 + h + .01); x.lineTo(u + .012, -.03 + h); x.lineTo(u + .012, -.03); x.fill(); cut(x, () => x.fillRect(u - .003, -.03 + h * .35, .006, .006)); } }, -.12);
  const fields2 = mk(-.07, '#7a4422', .25, x => { rock(x, -.2, .2, -.055, -.15, 9, .004); cut(x, () => { x.lineWidth = .0008; for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(-.2, -.062 - k * .009); x.lineTo(.2, -.06 - k * .009); x.stroke(); } }); }, -.12);
  const crowd = mk(-.045, '#140904', .05, x => { rock(x, -.2, .2, -.083, -.15, 12, .003); for (let k = 0; k < 16; k++) person(x, -.17 + k * .023 + (k % 2) * .004, -.083, .028 + (k % 3) * .003, { bend: .75, hoe: true, w: .07, arms: [[.5, 1.2], [.7, 1.4]], legs: [[-.3, -.1], [.3, .15]] }); }, -.12);
  const forest = S.add(sheet({ U, w: .12, h: .2, z: -.06, x: -.07, y: -.02, trans: .1, draw: x => P(x, () => {
    for (let k = 0; k < 7; k++) { const u = -.05 + k * .016, h = .04 + (k % 3) * .012; x.beginPath(); x.moveTo(u - .009, -.06); x.lineTo(u, -.06 + h); x.lineTo(u + .009, -.06); x.fill(); }
    x.fillRect(-.06, -.1, .12, .04); person(x, .045, -.06, .03, { hair: true, spear: true, w: .07, arms: [[-.3, -.2], [1.2, 2.3]] }); }) }));
  tint(forest, '#1f3322');
  const g = S.add(sheet({ U, w: .02, h: .03, z: -.02, x: 0, y: -.075, trans: .9, glow: 3.2, glowCol: '#ffd27a', draw: x => P(x, () => grain(x, 0, -.012, .016)), glowDraw: x => { x.fillStyle = '#fff'; grain(x, 0, -.012, .016); } }));
  tint(g, '#ffcf6a');
  const shutT = S.add(sheet({ U, w: .4, h: .3, z: .005, ax: 0, ay: -.15, trans: .02, shadow: false, recv: false, draw: x => P(x, () => { x.fillRect(-.2, -.15, .4, .3); cut(x, () => { x.lineWidth = .0012; for (let k = -6; k <= 6; k++) { x.beginPath(); x.moveTo(k * .03, -.15); x.lineTo(k * .03, .15); x.stroke(); } }); }) }));
  const shutB = S.add(sheet({ U, w: .4, h: .3, z: .006, ax: 0, ay: .15, trans: .02, shadow: false, recv: false, draw: x => P(x, () => { x.fillRect(-.2, -.15, .4, .3); cut(x, () => { x.lineWidth = .0012; for (let k = -6; k <= 6; k++) { x.beginPath(); x.moveTo(k * .03 + .015, -.15); x.lineTo(k * .03 + .015, .15); x.stroke(); } }); }) }));
  tint(shutT, '#120a06'); tint(shutB, '#120a06');
  const hits = [E.AT('l07', 'еды'), E.AT('l07', 'детей'), E.AT('l07', 'больше людей'), E.AT('l07', 'больше полей', 1), E.AT('l07', 'работы')];
  const tFor = E.AT('l08', 'назад'), tShut = E.AT('l09', 'ловушка') - .35;
  const layers = [fields1, huts, fields2, crowd];
  return {
    S,
    update(t) {
      const lt = t - E.T0;
      layers.forEach((m, i) => { const h = hits[i + (i >= 2 ? 1 : 0)]; m.position.y = lerp(m.userData.y0, 0, back(seg(t, h - .1, h + .45), 1.2)); });
      forest.position.x = -.07 - .25 * ei(seg(t, tFor, tFor + 1.4)); forest.position.y = -.02 + .02 * (1 - ss(seg(t, hits[0] - .5, hits[0])));
      g.material.emissiveIntensity = 3.2 * (1 - ss(seg(t, hits[0], hits[0] + 1))); g.visible = t < hits[0] + 1.1;
      const sh = ei(seg(t, tShut, tShut + .38));
      shutT.position.y = lerp(.36, .15, sh) + 0; shutB.position.y = lerp(-.36, -.15, sh);
      shutT.position.y = lerp(.33, .0 + .0, sh) + .0; shutB.position.y = lerp(-.33, 0, sh);
      sun.position.y = lerp(-.02, .05, ss(seg(t, hits[0], hits[4] + 1)));
      const z = lerp(.27, .5, eio(seg(t, E.T0 + .2, hits[4] + .8))), y = lerp(-.07, -.025, eio(seg(t, E.T0 + .2, hits[4] + .8)));
      aim(S.cam, [0, y, z, 0, y, -.06], t);
    },
    post() { return { focus: S.cam.position.z + .07, aper: 6, maxCoc: 7, bloom: { strength: .4, radius: .5, threshold: 1.0 } }; },
    grade(t) { return { vig: .45 }; },
  };
}

// ═════ S8: inside the box — the city lights up window by window; the camera pulls out of the lightbox
export function cityBox(E) {
  const S = stage({ light: [0, .03, -.12], lightR: .12, lightCol: '#9fbaff', key: 1.0, amb: .18, ambCol: '#6070a8', floor: .25, keyPos: [0, .5, .5] });
  const { U } = S, BW = .2, BH = .34;
  S.add(skyPanel({ w: BW, h: BH, z: -.142, stops: [[0, '#050a1c'], [.7, '#16285a'], [1, '#2a3a70']], stars: 60, starMinY: .05 }));
  const rows = [[-.12, '#4f66a8', .7, 2, .09, .05, .5], [-.09, '#2c3e78', .4, 6, .13, .02, .45], [-.06, '#18244a', .2, 9, .16, -.02, .4], [-.035, '#0b1028', .06, 14, .1, -.07, .35]];
  const city_ = rows.map(([z, col, trans, seed, bh, base, p], i) => { const m = S.add(sheet({ U, w: BW, h: BH, z, trans, glow: 0, glowCol: '#ffe2a8',
    draw: x => P(x, () => city(x, -BW / 2, BW / 2, base, { seed, bh, bw: .03 + i * .004, holes: false })),
    glowDraw: x => { x.fillStyle = '#fff'; city(x, -BW / 2, BW / 2, base, { seed, bh, bw: .03 + i * .004, glow: true, lit: (k, r) => r < p }); } })); tint(m, col); return m; });
  // the lightbox itself: wooden frame, black lining, seen from outside when we pull out
  const frame = S.add(sheet({ U, w: BW + .06, h: BH + .06, z: .004, trans: 0, shadow: false, recv: false, draw: x => P(x, () => { x.fillRect(-(BW + .06) / 2, -(BH + .06) / 2, BW + .06, BH + .06); cut(x, () => x.fillRect(-BW / 2, -BH / 2, BW, BH)); }) }));
  tint(frame, '#3a2414');
  const t0 = E.T0, tOut = E.AT('l09', 'до сих');
  return {
    S,
    update(t) {
      const lt = t - t0;
      city_.forEach((m, i) => { m.material.emissiveIntensity = 2.2 * ss(seg(lt, .15 + i * .25, .5 + i * .25)); });
      U.uLit.value = ss(seg(lt, 0, .5));
      const z = lerp(.62, 1.05, eio(seg(t, tOut - .3, t0 + E.dur)));
      aim(S.cam, [0, 0, z, 0, 0, -.06], t);
    },
    post() { return { focus: S.cam.position.z + .03, aper: 5, maxCoc: 6, bloom: { strength: .55, radius: .55, threshold: .95 } }; },
    grade(t) { return { vig: .55 }; },
  };
}
