// «Ловушка» — Woodcut Print, vertical 1080×1920 @ 24 fps. Every plate, cut and carve lands on a spoken word.
// Voice timeline: voice/dur.json + pauses → VO; AT(line, word) = time of a word (by character position in the spoken text).
import * as WC from './engine/index.js';
import { clamp, lerp, mulberry } from '/core/lib.js';
import { W, H, IMG, PW, PH, m, c, begin, end, caption, carveText, printer, M as MASK, C as COL } from './stage.js';
import { figure, cap } from './figures.js';
import { curl, peelState } from './trans.js';

const ORANGE = '#c8642a';
const GAP = { l01: .2, l02: .2, l03: .35, l04: .28, l05: .8, l06: .35, l07: .22, l08: .35, l09: .5 }, START = .25, TAIL = 1.6;
const ss = u => { u = clamp(u); return u * u * (3 - 2 * u); }, eo = u => 1 - (1 - clamp(u)) ** 3, seg = (t, a, b) => clamp((t - a) / (b - a));
export let DUR = 50, EV = [];
let VO, D, AT, PLATES, CUTS, SUBS, T;

const R = (x, y, w, h) => WC.rect(x, y, w, h);
const reg = (polys, res = 3) => new WC.Region(polys, { res });
const hatchIn = (polys, o) => WC.hatch(reg(polys, o.res ?? 3), { kind: 'v', jit: .12, ...o });
const keyDown = (y0, y1) => (x, y) => clamp((y - y0) / (y1 - y0));
const keyRad = (cx, cy, r) => (x, y) => clamp(Math.hypot(x - cx, y - cy) / r);
const draw = (list, t, color) => WC.drawStrokes(m, list, { t, color });
const stars = (n, y0, y1, seed) => { const r = mulberry(seed), pts = []; for (let i = 0; i < n; i++) pts.push([r() * PW, y0 + r() * (y1 - y0), 1.5 + r() * r() * 4]); return WC.flecks(pts, { seed }); };
function flames(cx, cy, s, t) {                       // fire re-cut on twos (deliberate boil): white tongues, black licks
  const k = Math.floor(t * 12), r = mulberry(k * 31 + 7), polys = [];
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 26 * s + (r() - .5) * 10 * s, hh = (110 + r() * 90) * s * (i === 2 ? 1.35 : 1), ww = (28 + r() * 14) * s, lean = (r() - .5) * 40 * s;
    polys.push([[cx + dx - ww, cy], [cx + dx - ww * .7, cy - hh * .45], [cx + dx + lean, cy - hh], [cx + dx + ww * .8, cy - hh * .5], [cx + dx + ww, cy]]);
  }
  return polys;
}
function fire(t, cx, cy, s, a = 1) {
  const P = flames(cx, cy, s, t);
  WC.fillPoly(m, P, '#fff', 'nonzero');
  const r = mulberry(Math.floor(t * 12) * 13 + 3);
  m.save(); m.strokeStyle = '#000'; m.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const x = cx + (r() - .5) * 90 * s, y = cy - r() * 120 * s; m.lineWidth = (3 + r() * 4) * s; m.beginPath(); m.moveTo(x, y); m.quadraticCurveTo(x + (r() - .5) * 20 * s, y - 25 * s, x + (r() - .5) * 10 * s, y - 50 * s); m.stroke(); }
  m.restore();
  m.fillStyle = '#000'; for (const [dx, a2] of [[-1, .25], [1, -.25]]) { m.save(); m.translate(cx, cy + 8 * s); m.rotate(a2); m.fillRect(-110 * s, -12 * s, 220 * s, 24 * s); m.restore(); }   // logs
  const g = c.createRadialGradient(cx, cy - 60 * s, 10, cx, cy - 60 * s, 520 * s); g.addColorStop(0, `rgba(0,0,0,${.95 * a})`); g.addColorStop(.35, `rgba(0,0,0,${.55 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(cx - 600 * s, cy - 700 * s, 1200 * s, 1200 * s);
}
const lazy = fn => { let v = null; return () => v || (v = fn()); };   // every cache builds itself on first use (worker-safe)

export async function init() {
  const lines = await (await fetch('lines.json')).json(); D = await (await fetch('voice/dur.json')).json();
  VO = {}; { let t = START; for (const L of lines) { VO[L.id] = +t.toFixed(3); t += D[L.id] + (GAP[L.id] ?? .3); } }
  DUR = +(VO.l10 + D.l10 + TAIL).toFixed(2);
  const LN = Object.fromEntries(lines.map(L => [L.id, L]));
  AT = (id, w, k = 0) => { const s = (LN[id].say || LN[id].text).toLowerCase(); let i = -1; for (let n = 0; n <= k; n++) { i = s.indexOf(w.toLowerCase(), i + 1); if (i < 0) throw new Error(`"${w}" not in ${id}`); } return VO[id] + .03 + (D[id] - .1) * (i / s.length); };
  T = {
    you: AT('l01', 'тебя') - .04, tall: VO.l02 - .04, trap: VO.l03 - .06, trapSnap: AT('l03', 'ловушку'),
    dig: VO.l04 - .06, hunters: AT('l04', 'у охотников'), farmers: AT('l04', 'у первых'), teeth: AT('l04', 'гнилые'), spine: AT('l04', 'больная'),
    camp: VO.l05 - .06, n17: AT('l05', 'семнадцати'), dark: VO.l05 + D.l05 + .1, grain: VO.l06 - .05, seed: AT('l06', 'зерно'),
    h: [AT('l07', 'еды'), AT('l07', 'детей'), AT('l07', 'больше людей'), AT('l07', 'больше полей', 1), AT('l07', 'работы')].map(x => x - .05),
    back: VO.l08 - .06, slam: AT('l09', 'ловушка'), peel: AT('l09', 'и мы') - .25, fin: VO.l10 - .06,
  };
  T.peelEnd = T.peel + 1.0;

  // ═════ plates: { from, build: lazy(() => ({ draw(t), cam(t) })) }
  const cave = lazy(() => {
    const rays = WC.rays(500, 1050, { n: 74, r0: 120, r1: [380, 820], w: 13, seed: 3, bend: .08, reveal: { t0: .02, t1: .7, jit: .3 } });
    const floor = hatchIn([R(0, 1110, PW, 420)], { dir: () => .05, sp: 11, tone: (x, y) => 1 - Math.hypot(x - 500, y - 1100) / 520, lo: .15, seed: 4, reveal: { t0: .1, t1: .7, key: keyRad(500, 1100, 600) } });
    const sit = figure('cave.sit', { x: 250, y: 1120, s: .88, kind: 'hunter', pose: { sit: true, lean: .25, head: .1, arms: [[.9, 2.0], [1.1, 1.8]] }, reveal: { t0: .15, t1: .75 } });
    const log = WC.shape([cap([90, 1135], [400, 1125], 56, 50)], { sp: 7, halo: 4, lo: .4, dir: 0, reveal: { t0: .1, t1: .5, key: () => 0 } });
    const st = figure('cave.st', { x: 800, y: 1125, s: .98, dir: -1, kind: 'hunter', prop: 'spear', pose: { arms: [[.2, .1], [.9, 2.3]] }, reveal: { t0: .2, t1: .8 } });
    return { draw(t) { draw(rays, t); draw(floor, t); log.draw(m, t); sit.draw(m, t); st.draw(m, t); fire(t, 520, 1110, .85); }, cam: t => ({ z: lerp(1, 1.06, seg(t, 0, T.you)), y: 860 }) };
  });
  const office = lazy(() => {
    const t0 = T.you;
    const cone = WC.rays(700, 700, { n: 30, a0: Math.PI * .28, a1: Math.PI * .72, r0: 40, r1: [380, 520], w: 12, seed: 8, reveal: { t0, t1: t0 + .3, jit: .2 } });
    const wk = figure('off.wk', { x: 420, y: 1190, s: .95, kind: 'worker', pose: { sit: true, lean: .62, head: .35, arms: [[1.1, 1.55], [1.3, 1.65]] }, reveal: { t0, t1: t0 + .35 } });
    const desk = WC.shape([R(560, 1010, 400, 22)], { sp: 6, halo: 4, lo: .4, dir: 0 }), legD = WC.shape([R(900, 1030, 20, 160)], { sp: 6, halo: 4, lo: .9, dir: 0 });
    const chair = WC.shape([R(330, 1130, 170, 22), R(320, 960, 22, 190)], { sp: 6, halo: 4, lo: .9 });
    const clockS = WC.cutAlong(WC.ellipse(200, 420, 90, 90, 48), { closed: true, w: 9, kind: 'v', seg: [60, 160], gap: [0, 2] });
    return { draw(t) {
      draw(cone, t); draw(clockS, t); m.save(); m.strokeStyle = '#fff'; m.lineWidth = 8; m.beginPath(); m.moveTo(200, 420); m.lineTo(200, 360); m.moveTo(200, 420); m.lineTo(245, 440); m.stroke(); m.restore();
      WC.fillPoly(m, [R(640, 860, 230, 150)], '#fff'); m.fillStyle = '#000'; for (let i = 0; i < 6; i++) m.fillRect(665, 885 + i * 20, 120 + (i * 37) % 60, 6);
      m.fillStyle = '#000'; m.fillRect(745, 1010, 30, 0);
      desk.draw(m, t); legD.draw(m, t); chair.draw(m, t); wk.draw(m, t);
      WC.fillPoly(m, [[[690, 700], [740, 640], [760, 650], [715, 708]]], '#fff');
    }, cam: t => ({ z: lerp(1.04, 1.1, seg(t, T.you, T.tall)), y: 820 }) };
  });
  const tall = lazy(() => {
    const t0 = T.tall;
    const burst = WC.rays(520, 560, { n: 90, r0: 160, r1: [600, 1100], w: 15, seed: 21, reveal: { t0, t1: t0 + .28, jit: .25 } });
    const ground = hatchIn([R(0, 1330, PW, 200)], { dir: () => 0, sp: 9, tone: () => .55, seed: 6 });
    const hero = figure('tall.hero', { x: 470, y: 1335, s: 1.18, kind: 'hunter', prop: 'spear', pose: { lean: -.06, head: -.12, arms: [[-.1, -.3], [.95, 2.35]], legs: [[.18, .05], [-.16, -.08]] } });
    return { draw(t) { draw(burst, t); draw(ground, t); hero.draw(m, t); }, cam: t => ({ z: 1.0 + .03 * ss(seg(t, t0, t0 + 1.2)), y: 770 }) };
  });
  const trap = lazy(() => {
    const t0 = T.trap, gy = 1150, hinge = [830, gy], A = -.42, bw = 520, bh = 330;
    const sky = hatchIn([R(0, 0, PW, gy - 40)], { dir: () => 0, sp: 14, tone: (x, y) => .2 + .35 * (y / gy), lo: .3, seed: 9, reveal: { t0, t1: t0 + .5, key: keyDown(0, gy) } });
    const soil = hatchIn([R(0, gy, PW, PH - gy)], { dir: () => -.08, sp: 10, tone: (x, y) => .75 - (y - gy) / 600, lo: .2, seed: 10, reveal: { t0, t1: t0 + .5, key: keyDown(gy, PH) } });
    const st = stars(120, 20, 700, 4);
    const rot = ([x, y]) => [hinge[0] + (x - hinge[0]) * Math.cos(A) - (y - hinge[1]) * Math.sin(A), hinge[1] + (x - hinge[0]) * Math.sin(A) + (y - hinge[1]) * Math.cos(A)];
    const boxP = [[hinge[0] - bw, gy], [hinge[0], gy], [hinge[0], gy - bh], [hinge[0] - bw, gy - bh]].map(rot);
    const box = WC.shape([boxP], { sp: 8, halo: 6, lo: .5, dir: A, reveal: { t0: t0 + .3, t1: t0 + 1.0, key: () => 0 } });
    const planks = [.25, .5, .75].map((u, i) => WC.cutAlong([rot([hinge[0] - bw * u, gy - 6]), rot([hinge[0] - bw * u, gy - bh + 6])], { w: 5, kind: 'v', seed: i + 2 }));
    const lift = boxP[0], stickS = WC.shape([cap([lift[0] + 10, gy], [lift[0] + 4, lift[1] + 4], 16, 14)], { sp: 5, halo: 4, lo: .9 });
    const string = WC.cutAlong([[lift[0] + 8, gy - 18], [lift[0] - 120, gy - 4], [lift[0] - 300, gy + 30], [-40, gy + 60]], { w: 4, kind: 'k', seed: 5, reveal: { t0: t0 + .8, t1: t0 + 1.4, speed: 700 } });
    const glow = WC.rays(430, gy - 40, { n: 28, r0: 22, r1: [70, 150], w: 6, seed: 12, reveal: { t0: t0 + .2, t1: t0 + .6 } });
    return { draw(t) {
      draw(sky, t); draw(st, t); draw(soil, t); draw(glow, t);
      if (t > t0 + .15) { WC.fillPoly(m, [WC.ellipse(430, gy - 36, 11, 20, 16)], '#fff'); m.fillStyle = '#000'; m.fillRect(429, gy - 52, 2, 30); }
      box.draw(m, t); for (const p of planks) draw(p, t); stickS.draw(m, t); draw(string, t);
    }, cam: t => { const sn = ss(seg(t, T.trapSnap, T.trapSnap + .18)); return { z: lerp(lerp(1, 1.12, seg(t, t0, T.trapSnap)), 1.55, sn), x: lerp(500, 560, sn), y: lerp(900, 1010, sn) }; } };
  });
  const dig = lazy(() => {
    const t0 = T.dig;
    const strata = hatchIn([R(0, 0, PW, PH)], { dir: (x, y) => .04 * Math.sin(x * .004 + y * .003), sp: 10, tone: (x, y) => { const b = Math.floor(y / 190); return [.62, .35, .7, .28, .55, .4, .66, .3, .5][b % 9] + .08 * Math.sin(x * .02 + b); }, lo: .25, seed: 14, reveal: { t0, t1: t0 + .7, key: keyDown(0, PH) } });
    const pebbles = WC.flecks(Array.from({ length: 90 }, (_, i) => { const r = mulberry(i + 40); return [r() * PW, r() * PH, 3 + r() * 5]; }), { seed: 3 });
    const bones = (key, cx, fy, h, b, t1, t2) => {
      const hip = [cx, fy - h * .48], nk = [cx + b * h * .22, fy - h * .82], md = [lerp(hip[0], nk[0], .5) + b * h * .1, lerp(hip[1], nk[1], .5)], sk = [nk[0] + b * h * .12, nk[1] - h * .09];
      const P = [], L = (a, z, w) => P.push(cap(a, z, w, w * .85));
      P.push(WC.ellipse(sk[0], sk[1], h * .075, h * .085, 24));
      L(hip, md, h * .03); L(md, nk, h * .03);
      for (let k = 0; k < 4; k++) { const u = .52 + k * .1, p = [lerp(hip[0], nk[0], u) + b * h * .08, lerp(hip[1], nk[1], u)], rw = h * (.11 - k * .01); L([p[0] - rw, p[1] + rw * .35], [p[0] + rw, p[1] + rw * .35], h * .02); }
      P.push(WC.ellipse(hip[0], hip[1], h * .085, h * .04, 20));
      const limb = (o, l1, a1, l2, a2) => { const e = [o[0] + Math.sin(a1) * l1, o[1] + Math.cos(a1) * l1]; L(o, e, h * .028); L(e, [e[0] + Math.sin(a2) * l2, e[1] + Math.cos(a2) * l2], h * .024); };
      const sh = [lerp(hip[0], nk[0], .93), lerp(hip[1], nk[1], .93)];
      limb([sh[0] - h * .1, sh[1]], h * .17, -.12 + b * .6, h * .16, -.05 + b * 1.1); limb([sh[0] + h * .1, sh[1]], h * .17, .12 + b * .6, h * .16, .05 + b * 1.1);
      limb([hip[0] - h * .05, hip[1]], h * .24, -.04 - b * .2, h * .23, .02 + b * .3); limb([hip[0] + h * .05, hip[1]], h * .24, .04 - b * .2, h * .23, .06 + b * .3);
      return { S: P.map((poly, i) => WC.shape([poly], { white: true, sp: 5, halo: 0, lo: .55, hi: 1, R: 14, k: 1.2, dir: 'contour', seed: i + key.length, reveal: { t0: t1, t1: t2, key: keyDown(fy - h, fy), jit: .2 } })), sk, md, nk, hip };
    };
    const A = bones('A', 280, 1300, 980, 0, T.hunters, T.hunters + .7), B = bones('Bb', 730, 1300, 760, .55, T.farmers, T.farmers + .7);
    const keep = (sh, t) => { for (const S of sh) S.draw(m, t); };
    return { draw(t) {
      draw(strata, t); draw(pebbles, t);
      if (t > T.hunters) { WC.fillPoly(m, [WC.ellipse(280, 820, 230, 560, 48)], '#000'); keep(A.S, t); }
      if (t > T.farmers) { WC.fillPoly(m, [WC.ellipse(740, 930, 220, 440, 48)], '#000'); keep(B.S, t); }
      if (t > T.teeth) { m.fillStyle = '#000'; const [x, y] = B.sk; for (let i = 0; i < 4; i++) m.fillRect(x - 22 + i * 13, y + 42, 7, 14 + (i % 2) * 6); }
      if (t > T.spine) { m.save(); m.strokeStyle = '#000'; m.lineWidth = 6; m.beginPath(); const [x0, y0] = B.hip, [x1, y1] = B.nk; for (let i = 0; i <= 8; i++) { const u = i / 8; m.lineTo(lerp(x0, x1, u) + 40 * (i % 2 ? 1 : -1) * .5 + 12, lerp(y0, y1, u)); } m.stroke(); m.restore(); }
    }, cam: t => {
      const a = ss(seg(t, T.hunters - .1, T.hunters + .6)), b = ss(seg(t, T.farmers - .1, T.farmers + .6));
      return { z: lerp(1, 1.32, a), x: lerp(lerp(500, 300, a), 720, b), y: lerp(760, lerp(830, 900, b), a) };
    } };
  });
  const camp = lazy(() => {
    const t0 = T.camp, gy = 1160;
    const st = stars(260, 10, 820, 17);
    const hills = hatchIn([[[0, 900], [180, 760], [330, 840], [520, 700], [720, 820], [860, 740], [PW, 820], [PW, gy], [0, gy]]], { dir: () => -.3, sp: 9, tone: (x, y) => .3 + .3 * (1 - Math.hypot(x - 500, y - gy) / 700), lo: .2, seed: 18, reveal: { t0, t1: t0 + .6, key: keyRad(500, gy, 800) } });
    const ground = hatchIn([R(0, gy, PW, PH - gy)], { dir: () => .02, sp: 10, tone: (x, y) => 1 - Math.hypot(x - 500, y - gy) / 600, lo: .15, seed: 19, reveal: { t0, t1: t0 + .6, key: keyRad(500, gy, 700) } });
    const rays = WC.rays(500, gy - 60, { n: 50, r0: 140, r1: [260, 520], w: 10, seed: 23, a0: Math.PI, a1: Math.PI * 2, reveal: { t0, t1: t0 + .5 } });
    const rv = { t0: t0 + .1, t1: t0 + .8 };
    const F = [
      figure('camp.sleep', { x: 210, y: gy + 10, s: .5, kind: 'hunter', rot: -Math.PI / 2 * .97, pose: { arms: [[-.2, -.1], [.2, .05]], legs: [[.04, 0], [-.04, 0]] }, reveal: rv }),
      figure('camp.flute', { x: 330, y: gy, s: .58, kind: 'hunter', prop: 'flute', pose: { sit: true, lean: .1, head: .05, arms: [[1.0, 2.3], [1.25, 2.1]] }, reveal: rv }),
      figure('camp.tell', { x: 740, y: gy, s: .68, dir: -1, kind: 'hunter', pose: { lean: -.05, head: -.15, arms: [[-2.3, -2.9], [-2.0, -2.6]] }, reveal: rv }),
      figure('camp.kid', { x: 620, y: gy, s: .38, dir: -1, kind: 'hunter', pose: { sit: true, arms: [[.8, 1.8], [1.0, 2.0]] }, reveal: rv }),
    ];
    const rock = WC.shape([[[250, gy], [270, gy - 50], [380, gy - 60], [410, gy]]], { sp: 7, halo: 4, lo: .4 });
    return { draw(t) {
      draw(st, t); draw(hills, t); draw(ground, t); draw(rays, t); rock.draw(m, t);
      for (const f of F) f.draw(m, t); fire(t, 500, gy, .95);
      carveText('17 ч', 500, 560, 230, eo(seg(t, T.n17, T.n17 + .45)));
    }, cam: t => ({ z: lerp(1, 1.08, seg(t, t0, T.dark)), y: lerp(840, 880, seg(t, t0, T.dark)) }) };
  });
  const grain = lazy(() => {
    const t0 = T.grain, gy = 1080;
    const furrows = [0, 1, 2, 3, 4, 5].map(i => WC.cutAlong([[0, gy + i * 70 + 10], [PW, gy + i * 70 - 6]], { w: 8 - i * .6, kind: 'u', seed: i, seg: [80, 220], reveal: { t0: t0 + .05 * i, t1: t0 + .6, speed: 1500 } }));
    const fingers = [[[470, 650], [600, 960]], [[540, 640], [620, 950]], [[610, 650], [640, 960]], [[380, 760], [560, 980]]];
    const palm = WC.spline([[330, 330], [520, 270], [700, 300], [760, 470], [720, 640], [640, 720], [520, 760], [400, 700], [340, 560]], 4, true);
    const hand = [WC.shape([palm], { sp: 7, halo: 6, lo: .3, hi: .9, R: 60, k: 1.2, light: WC.light(.3, .8, .5), dir: 'contour', seed: 3, reveal: { t0: t0 + .1, t1: t0 + 1.0, key: keyDown(260, 980), jit: .3 } }),
      ...fingers.map(([a, b], i) => WC.shape([cap(a, b, 62, 44)], { sp: 6, halo: 5, lo: .3, hi: .9, R: 22, k: 1.2, light: WC.light(.3, .8, .5), dir: 'contour', seed: 9 + i, reveal: { t0: t0 + .35, t1: t0 + 1.1, key: keyDown(600, 980), jit: .3 } }))];
    const glow = WC.rays(625, 1010, { n: 40, r0: 30, r1: [120, 300], w: 9, seed: 31, reveal: { t0: T.seed, t1: T.seed + .35 } });
    return { draw(t) {
      for (const f of furrows) draw(f, t); draw(glow, t);
      for (const S of hand) S.draw(m, t);
      if (t > T.seed - .1) { WC.fillPoly(m, [WC.ellipse(625, 1000, 18, 30, 16)], '#fff'); WC.plate(c, [WC.ellipse(625, 1000, 22, 34, 16)], ss(seg(t, T.seed - .1, T.seed + .3))); const g = c.createRadialGradient(625, 1000, 5, 625, 1000, 320); g.addColorStop(0, `rgba(0,0,0,${.85 * ss(seg(t, T.seed, T.seed + .4))})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(300, 680, 650, 650); }
    }, cam: t => ({ z: lerp(1.05, 1.25, seg(t, t0, T.h[0])), x: lerp(520, 600, seg(t, t0, T.h[0])), y: lerp(820, 940, seg(t, t0, T.h[0])) }) };
  });
  const series = i => lazy(() => {
    const t0 = T.h[i], rv = { t0, t1: t0 + .32 }, gy = 980, vp = [500, 760];
    const sky = WC.rays(500, 640, { n: 70, r0: 70, r1: [400, 900], w: 11, seed: 40 + i, a0: Math.PI, a1: Math.PI * 2, reveal: { t0, t1: t0 + .25 } });
    const field = []; for (let k = -14; k <= 14; k++) field.push(...WC.cutAlong([[vp[0] + k * 6, gy + 4], [vp[0] + k * 120, PH + 40]], { w: 3 + Math.abs(k) * .25, kind: 'v', seed: k + 30, seg: [60, 200], reveal: { t0, t1: t0 + .3, speed: 4000 } }));
    const items = [];
    const hut = (x, s, k) => items.push(WC.shape([[[x - 60 * s, gy], [x - 60 * s, gy - 60 * s], [x, gy - 115 * s], [x + 60 * s, gy - 60 * s], [x + 60 * s, gy]]], { sp: 6, halo: 4, lo: .5, dir: 'contour', seed: k, reveal: { ...rv, key: () => 0, jit: .8 } }));
    if (i === 0) { hut(760, 1.3, 1); }
    if (i === 1) { hut(720, 1.5, 1); [[480, .52, 'farmer'], [570, .48, 'farmer'], [400, .26], [440, .24], [620, .25]].forEach(([x, s, k], j) => items.push(figure(`ser1.${j}`, { x, y: gy + 300, s, kind: k || 'plain', dir: j % 2 ? -1 : 1, reveal: rv }))); }
    if (i === 2) { for (let k = 0; k < 9; k++) hut(80 + k * 110, .8 + (k % 3) * .15, k); for (let k = 0; k < 16; k++) items.push(figure(`ser2.${k}`, { x: 40 + k * 60, y: gy + 220 + (k % 3) * 70, s: .26, dir: k % 2 ? 1 : -1, kind: 'farmer', pose: { lean: .2, arms: [[.4, .2], [-.3, -.2]], legs: [[.3, .1], [-.3, -.1]] }, reveal: rv })); }
    if (i === 3) { for (let k = 0; k < 14; k++) hut(30 + k * 72, .45, k); for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) items.push(figure(`ser3.${r}.${k}`, { x: 50 + k * 110 + (r % 2) * 50, y: gy + 120 + r * 120, s: .16 + r * .05, kind: 'farmer', prop: 'hoe', pose: { lean: 1.0, head: .3, arms: [[.9, .6], [1.1, .8]], legs: [[.35, .1], [-.25, -.05]] }, reveal: rv })); }
    if (i === 4) { [[200, .78], [500, .86], [810, .8]].forEach(([x, s], j) => items.push(figure(`ser4.${j}`, { x, y: 1420, s, kind: 'farmer', prop: 'hoe', pose: { lean: 1.05 + j * .05, head: .35, arms: [[.9, .6], [1.1, .8]], legs: [[.35, .1], [-.25, -.05]] }, reveal: rv }))); }
    const horizon = WC.cutAlong([[0, gy], [PW, gy]], { w: 6, kind: 'v', seed: 3 });
    const colourA = i <= 1 ? .7 : 0;
    return { draw(t) {
      if (i < 4) { draw(sky, t); draw(field, t); draw(horizon, t); } else draw(sky, t);
      if (colourA) { const g = c.createLinearGradient(0, gy, 0, PH); g.addColorStop(0, `rgba(0,0,0,${colourA})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, gy, PW, PH - gy); }
      for (const it of items) it.draw(m, t);
    }, cam: t => ({ z: 1 + .025 * seg(t, t0, t0 + 1.6), y: 760 }) };
  });
  const back = lazy(() => {
    const t0 = T.back, gy = 1000;
    const field = []; for (let k = 0; k < 40; k++) field.push(...WC.cutAlong([[0, gy + 8 + k * k * .35], [PW, gy + 4 + k * k * .35]], { w: 1.5 + k * .12, kind: 'v', seed: k, seg: [40, 140], reveal: { t0, t1: t0 + .5, speed: 4000 } }));
    const crowd = []; for (let r = 0; r < 5; r++) for (let k = 0; k < 14; k++) crowd.push(figure(`back.${r}.${k}`, { x: 420 + k * 42 + (r % 2) * 20, y: gy + 40 + r * 55, s: .08 + r * .025, kind: 'farmer', pose: { lean: 1.0, arms: [[.9, .6], [1.1, .8]] } }));
    const trees = [[60, 1.2], [150, 1.5], [250, 1.1]].map(([x, s], i) => WC.shape([[[x - 70 * s, gy + 40], [x - 50 * s, gy - 150 * s], [x - 20 * s, gy - 260 * s], [x, gy - 420 * s], [x + 20 * s, gy - 260 * s], [x + 50 * s, gy - 150 * s], [x + 70 * s, gy + 40]]], { sp: 7, halo: 5, lo: .6, dir: Math.PI / 2, seed: i }));
    const hero = figure('back.hero', { x: 330, y: gy + 330, s: .82, kind: 'hunter', prop: 'spear', pose: { lean: .05, head: .15, arms: [[.1, 0], [.9, 2.3]] } });
    const sky = hatchIn([R(0, 0, PW, gy)], { dir: () => 0, sp: 13, tone: (x, y) => .25 + .45 * (y / gy), lo: .25, seed: 33 });
    return { draw(t) { draw(sky, t); draw(field, t); for (const f of crowd) f.draw(m, t); for (const s of trees) s.draw(m, t); hero.draw(m, t); },
      cam: t => { const u = ss(seg(t, t0, T.slam - .2)); return { z: lerp(1.45, 1.0, u), x: lerp(330, 500, u), y: lerp(1050, 760, u) }; } };
  });
  const slam = lazy(() => {
    const t0 = T.slam, gy = 1180;
    const crowd = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 10; k++) crowd.push(figure(`slam.${r}.${k}`, { x: 120 + k * 85 + (r % 2) * 40, y: gy - r * 40, s: .2 - r * .03, kind: 'farmer', prop: 'hoe', pose: { lean: 1.0, arms: [[.9, .6], [1.1, .8]] } }));
    const soil = hatchIn([R(0, gy, PW, PH - gy)], { dir: () => -.05, sp: 10, tone: () => .55, seed: 41 });
    const sky = hatchIn([R(0, 0, PW, gy)], { dir: () => 0, sp: 13, tone: (x, y) => .25 + .4 * (y / gy), lo: .25, seed: 42 });
    const boxP = [[30, gy + 10], [970, gy + 10], [970, gy - 700], [30, gy - 700]];
    const box = WC.shape([boxP], { sp: 9, halo: 8, lo: .55, dir: 0, seed: 43 });
    const planks = [1, 2, 3, 4, 5, 6].map(i => WC.cutAlong([[30 + i * 134, gy], [30 + i * 134, gy - 700]], { w: 6, kind: 'v', seed: i }));
    return { draw(t) {
      draw(sky, t); draw(soil, t); for (const f of crowd) f.draw(m, t);
      const fall = t < t0 - .25 ? 0 : t < t0 ? (t - (t0 - .25)) / .25 : 1, dy = -1100 * (1 - fall * fall);
      m.save(); m.translate(0, dy); c.save(); c.translate(0, dy); box.draw(m, t); for (const p of planks) draw(p, t); m.restore(); c.restore();
    }, cam: t => { const d = t - t0, k = d > 0 && d < .5 ? Math.exp(-d * 9) * 14 : 0; return { y: 760, z: 1, sx: Math.sin(d * 90) * k, sy: Math.sin(d * 70 + 1) * k * 1.3 }; } };
  });
  const city = lazy(() => {
    const t0 = T.peel;
    const st = stars(160, 10, 600, 51);
    const towers = []; const r = mulberry(5); let x = 10;
    while (x < PW) { const w = 90 + r() * 110, h = 500 + r() * 650; towers.push([x, 1500 - h, w, h]); x += w + 14; }
    const slats = [90, 300, 520, 740, 930].map(xx => WC.shape([R(xx - 26, -40, 52, PH + 80)], { sp: 7, halo: 6, lo: .55, dir: Math.PI / 2, seed: xx }));
    const win = towers.map(([x0, y0, w, h], i) => { const rr = mulberry(i + 9), out = []; for (let yy = y0 + 30; yy < y0 + h - 20; yy += 34) for (let xx = x0 + 14; xx < x0 + w - 14; xx += 24) if (rr() < .55) out.push([xx, yy]); return out; });
    return { draw(t) {
      draw(st, t);
      towers.forEach(([x0, y0, w, h], i) => { WC.fillPoly(m, [WC.offsetPoly(R(x0, y0, w, h), 4)], '#fff'); WC.fillPoly(m, [R(x0, y0, w, h)], '#000'); m.fillStyle = '#fff'; for (const [xx, yy] of win[i]) m.fillRect(xx, yy, 12, 18); });
      for (const s of slats) s.draw(m, t);
    }, cam: t => ({ z: lerp(1.15, 1.0, ss(seg(t, t0, T.fin))), y: 760 }) };
  });
  const finale = lazy(() => {
    const t0 = T.fin, gy = 640;
    const st = stars(90, 10, 360, 61);
    const rays = WC.rays(500, gy - 50, { n: 40, r0: 120, r1: [220, 420], w: 9, seed: 62, a0: Math.PI, a1: Math.PI * 2 });
    const ground = hatchIn([R(0, gy, PW, 100)], { dir: () => 0, sp: 9, tone: (x, y) => 1 - Math.abs(x - 500) / 500, lo: .2, seed: 63 });
    const f1 = figure('fin.sit', { x: 300, y: gy, s: .45, kind: 'hunter', pose: { sit: true, lean: .2, arms: [[.9, 2.0], [1.1, 1.8]] } });
    const f2 = figure('fin.st', { x: 720, y: gy, s: .5, dir: -1, kind: 'hunter', prop: 'spear', pose: { arms: [[.2, .1], [.9, 2.3]] } });
    const sep = WC.cutAlong([[0, 790], [PW, 790]], { w: 10, kind: 'u', seed: 7 });
    const bed = WC.shape([R(140, 1260, 760, 40), R(140, 1180, 30, 120), R(870, 1210, 30, 90)], { sp: 7, halo: 5, lo: .5, dir: 0 });
    const sleeper = figure('fin.bed', { x: 190, y: 1262, s: .62, dir: -1, kind: 'worker', rot: -Math.PI / 2 * .9, pose: { lean: 0, arms: [[-2.2, -2.9], [-1.0, -2.6]], legs: [[0, 0], [0, 0]] } });
    const beam = WC.rays(600, 1090, { n: 26, r0: 20, r1: [120, 300], w: 8, seed: 64, a0: Math.PI * .55, a1: Math.PI * 1.45 });
    return { draw(t) {
      draw(st, t); draw(ground, t); draw(rays, t); f1.draw(m, t); f2.draw(m, t); fire(t, 500, gy, .7, .9);
      draw(sep, t); draw(beam, t); bed.draw(m, t); sleeper.draw(m, t);
      WC.fillPoly(m, [R(580, 1050, 40, 70)], '#fff'); m.fillStyle = '#000'; m.fillRect(588, 1058, 24, 50);
      const k = .55 + .45 * Math.abs(Math.sin(t * 9.3));
      m.fillStyle = `rgba(255,255,255,${k})`; m.fillRect(588, 1058, 24, 50);
    }, cam: t => ({ z: lerp(1, 1.04, seg(t, t0, DUR)), y: 760 }) };
  });

  PLATES = [
    { from: 0, p: cave }, { from: T.you, p: office }, { from: T.tall, p: tall }, { from: T.trap, p: trap }, { from: T.dig, p: dig },
    { from: T.camp, p: camp }, { from: T.dark, p: null, dark: true }, { from: T.grain, p: grain },
    ...T.h.map((h, i) => ({ from: h, p: series(i) })),
    { from: T.back, p: back }, { from: T.slam - .35, p: slam }, { from: T.peel, p: city, peelFrom: slam }, { from: T.fin, p: finale },
  ];
  CUTS = PLATES.map(p => p.from);

  // captions: clauses ≤ 44 chars, timed by character position; shown in the bottom margin
  SUBS = [];
  for (const L of lines) {
    const txt = L.text, t0 = VO[L.id], d = D[L.id];
    const parts = txt.match(/[^,.:!?—]+[,.:!?—…]*\s*/g).reduce((acc, p) => { const last = acc[acc.length - 1]; if (last != null && (last + p).trim().length <= 44) acc[acc.length - 1] += p; else acc.push(p); return acc; }, []);
    let c0 = 0; for (const p of parts) { const f0 = c0 / txt.length, f1 = (c0 + p.trimEnd().length) / txt.length; c0 += p.length; SUBS.push({ t0: t0 + f0 * d - .08, t1: t0 + f1 * d + .3, text: p.trim().replace(/\s*—$/, '') }); }
  }
  for (let i = 0; i < SUBS.length - 1; i++) { const a = SUBS[i], b = SUBS[i + 1]; if (b.t0 - a.t1 < .2 && (a.t1 - a.t0 < 1.5 || b.t1 - b.t0 < 1.5) && (a.text + ' ' + b.text).length <= 56) { a.text += ' ' + b.text; a.t1 = b.t1; SUBS.splice(i + 1, 1); i--; } }
  for (let i = 0; i < SUBS.length - 1; i++) SUBS[i].t1 = Math.min(Math.max(SUBS[i].t1, SUBS[i].t0 + 1.6), SUBS[i + 1].t0 - .04);

  EV = [{ t: 0, type: 'cues', VO, D, T, DUR, cuts: PLATES.map(p => [p.from, p.dark ? 'dark' : '']) }, ...SUBS.map(s => ({ t: +s.t0.toFixed(3), type: 'sub', t1: +s.t1.toFixed(3), text: s.text }))];
}

// ═════ frame
const [A, ga] = WC.canvas(W, H), [B, gb] = WC.canvas(W, H);
function plateFrame(P, t, cap, i) {
  const cam = P.p ? P.p().cam(t) : {};
  begin(cam);
  if (P.p) P.p().draw(t);
  end();
  const s = SUBS.find(q => t >= q.t0 && t < q.t1); if (s && cap) caption(s.text, Math.min(1, (t - s.t0) / .1, (s.t1 - t) / .15));
  const sinceCut = t - P.from, newImp = sinceCut >= 0 && sinceCut < 2 / 24;
  return printer().render(MASK, COL, { seed: 4, inkSeed: 10 + i * 7, plate: ORANGE, reg: newImp ? [9, -7] : [3, 2] });
}
export function render(g, t) {
  let i = 0; for (let k = 0; k < PLATES.length; k++) if (t >= PLATES[k].from) i = k;
  const P = PLATES[i];
  if (P.dark) {                                         // the lamp goes out: the block is inked over, only the margin and caption remain
    const prev = PLATES[i - 1], u = ss(seg(t, P.from, P.from + .45));
    const cam = prev.p().cam(t); begin(cam); prev.p().draw(t); end();
    m.fillStyle = '#000'; m.fillRect(IMG.x, IMG.y, IMG.w, IMG.h * u);
    c.clearRect(IMG.x, IMG.y, IMG.w, IMG.h * u);
    const s = SUBS.find(q => t >= q.t0 && t < q.t1); if (s) caption(s.text, Math.min(1, (t - s.t0) / .1, (s.t1 - t) / .15));
    g.drawImage(printer().render(MASK, COL, { seed: 4, inkSeed: 77, plate: ORANGE, wetX: u < 1 ? u : -1 }), 0, 0);
    return;
  }
  if (P.peelFrom && t < T.peelEnd) {                    // the sheet peels off the slam plate; the city plate is underneath
    const u = seg(t, P.from, T.peelEnd);
    const under = plateFrame(P, t, true, i); gb.drawImage(under, 0, 0);
    const prevP = PLATES[i - 1];
    const top = plateFrame(prevP, t, false, i - 1); ga.drawImage(top, 0, 0);
    g.drawImage(B, 0, 0);
    const { xf, r } = peelState(u, 160);
    const [BK, gk] = back_(); gk.save(); gk.setTransform(-1, 0, 0, 1, W, 0); gk.drawImage(A, 0, 0); gk.restore(); gk.fillStyle = 'rgba(239,232,216,.82)'; gk.fillRect(0, 0, W, H);
    curl(g, A, BK, xf, r);
    return;
  }
  g.drawImage(plateFrame(P, t, true, i), 0, 0);
}
let BKc = null; function back_() { return BKc || (BKc = WC.canvas(W, H)); }
