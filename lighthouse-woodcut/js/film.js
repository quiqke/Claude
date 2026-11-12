// «11 правил маяка» — test, Woodcut Print, 1920×1080 @ 24 fps. Every plate, cut and carve lands on a spoken word.
import * as WC from './engine/index.js';
import { clamp, lerp, mulberry } from '/core/lib.js';
import { W, H, IMG, PW, PH, m, c, begin, end, caption, carveText, printer, M as MASK, C as COL } from './stage.js';
import { figure, cap } from './figures.js';
import { curl, peelState } from './trans.js';

const AMBER = '#d8962a';
const GAP = { l01: .3, l02: .9, l03: .8, l04: .6 }, START = .3, TAIL = 2.0;
const ss = u => { u = clamp(u); return u * u * (3 - 2 * u); }, eo = u => 1 - (1 - clamp(u)) ** 3, seg = (t, a, b) => clamp((t - a) / (b - a));
export let DUR = 25, EV = [];
let VO, D, AT, PLATES, SUBS, T;
const R = (x, y, w, h) => WC.rect(x, y, w, h);
const hatchIn = (polys, o) => WC.hatch(new WC.Region(polys, { res: o.res ?? 3 }), { kind: 'v', jit: .12, ...o });
const keyDown = (y0, y1) => (x, y) => clamp((y - y0) / (y1 - y0));
const keyUp = (y0, y1) => (x, y) => clamp((y1 - y) / (y1 - y0));
const keyRad = (cx, cy, r) => (x, y) => clamp(Math.hypot(x - cx, y - cy) / r);
const draw = (list, t, color) => WC.drawStrokes(m, list, { t, color });
const stars = (n, y0, y1, seed, x0 = 0, x1 = PW) => { const r = mulberry(seed), pts = []; for (let i = 0; i < n; i++) pts.push([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 1.5 + r() * r() * 4]); return WC.flecks(pts, { seed }); };
const lazy = fn => { let v = null; return () => v || (v = fn()); };
const beat = t => { const ph = (t % .82) / .82; return Math.max(Math.exp(-(((ph - .05) / .05) ** 2)), .7 * Math.exp(-(((ph - .25) / .05) ** 2))); };
function wave(y, amp, len, ph, x0 = -40, x1 = PW + 40) { const p = []; for (let x = x0; x <= x1; x += 12) p.push([x, y + Math.sin(x / len + ph) * amp]); return p; }

export async function init() {
  const lines = await (await fetch('lines.json')).json(); D = await (await fetch('voice/dur.json')).json();
  VO = {}; { let t = START; for (const L of lines) { VO[L.id] = +t.toFixed(3); t += D[L.id] + (GAP[L.id] ?? .3); } }
  DUR = +(VO.l05 + D.l05 + TAIL).toFixed(2);
  const LN = Object.fromEntries(lines.map(L => [L.id, L]));
  AT = (id, w, k = 0) => { const s = (LN[id].say || LN[id].text).toLowerCase(); let i = -1; for (let n = 0; n <= k; n++) { i = s.indexOf(w.toLowerCase(), i + 1); if (i < 0) throw new Error(`"${w}" not in ${id}`); } return VO[id] + .03 + (D[id] - .1) * (i / s.length); };
  T = { n40: AT('l01', 'сорок'), never: AT('l02', 'никогда') - .05, on: AT('l02', 'включишь'), fog: VO.l03 - .06, d40: AT('l03', 'сорок'), smell: AT('l03', 'без запаха'), sound: AT('l03', 'без звука'),
        rule: VO.l04 - .06, ruleTxt: AT('l04', 'никогда'), win: VO.l05 - .1, clock: AT('l05', 'двадцать'), lights: AT('l05', 'загораются'), blink: AT('l05', 'мигают'), heart: AT('l05', 'сердцу') };
  T.peelEnd = T.rule + .9;
  const LX = 1240, LB = 700;                         // lighthouse base (plate coords)

  // 1 · the lighthouse on its cliff, night sea (carved radially from the dark lamp)
  const tower = lazy(() => {
    const sky = stars(170, 20, 600, 3);
    const sea = []; for (let k = 0; k < 16; k++) sea.push(...WC.cutAlong(wave(LB + 40 + k * k * .9, 3 + k * .4, 70 + k * 6, k), { w: 2 + k * .35, kind: 'v', seed: k, seg: [40, 160], gap: [6, 30], reveal: { t0: .1, t1: .9, speed: 2400 } }));
    const cliff = WC.shape([[[LX - 420, PH + 20], [LX - 330, LB + 10], [LX - 180, LB - 20], [LX + 160, LB - 10], [LX + 300, LB + 40], [LX + 480, PH + 20]]], { sp: 9, halo: 6, lo: .35, R: 60, k: 1.1, light: WC.light(-.6, -.6, .4), dir: 'contour', seed: 5, reveal: { t0: .15, t1: .9, key: keyRad(LX, LB, 600) } });
    const body = WC.shape([[[LX - 115, LB], [LX - 78, LB - 470], [LX + 78, LB - 470], [LX + 115, LB]]], { sp: 8, halo: 6, lo: .3, R: 70, k: 1.2, light: WC.light(-.75, -.35, .35), dir: Math.PI / 2, seed: 6, reveal: { t0: .05, t1: .8, key: keyUp(LB - 600, LB) } });
    const bands = [[LB - 140, LB - 200], [LB - 330, LB - 390]].map(([a, b], i) => WC.cutAlong([[LX - 108 + (LB - a) * .08, a], [LX + 108 - (LB - a) * .08, a]], { w: 7, kind: 'v', seed: i + 2 }));
    const gallery = WC.shape([R(LX - 110, LB - 492, 220, 22)], { sp: 6, halo: 5, lo: .9, dir: 0 });
    const room = WC.shape([R(LX - 60, LB - 590, 120, 98)], { sp: 6, halo: 5, lo: .9, dir: 0 });
    const dome = WC.shape([[[LX - 74, LB - 590], [LX, LB - 660], [LX + 74, LB - 590]]], { sp: 6, halo: 5, lo: .5, dir: 'contour' });
    const glow = WC.rays(260, 170, { n: 60, r0: 70, r1: [180, 520], w: 9, seed: 9, reveal: { t0: .02, t1: .6, jit: .3 } });   // the moon: the only light allowed
    return { draw(t) { draw(sky, t); draw(glow, t); WC.fillPoly(m, [WC.ellipse(260, 170, 62, 62, 40)], '#fff'); draw(sea, t); cliff.draw(m, t); body.draw(m, t); for (const b of bands) draw(b, t); gallery.draw(m, t); room.draw(m, t); dome.draw(m, t);
        m.fillStyle = '#fff'; for (const x of [-30, 30]) m.fillRect(LX + x - 2, LB - 584, 4, 86);   // dark lamp: only the frame is cut
        carveText('40 000', 620, 420, 210, eo(seg(t, T.n40, T.n40 + .5))); carveText('свечей', 620, 520, 84, eo(seg(t, T.n40 + .45, T.n40 + .85)), { weight: 400 }); },
      cam: t => ({ z: lerp(1, 1.06, seg(t, 0, T.never)), x: lerp(924, 980, seg(t, 0, T.never)), y: 460 }) };
  });
  // 2 · the lamp, close: the Fresnel lens lights for a breath and is inked out again
  const lamp = lazy(() => {
    const t0 = T.never, cx = 924, cy = 470;
    const rings = []; for (let k = 1; k <= 9; k++) rings.push(...WC.cutAlong(WC.ellipse(cx, cy, 40 * k, 34 * k, 90), { closed: true, w: 3 + k * .5, kind: 'v', seed: k, seg: [80, 240], gap: [2, 8], reveal: { t0: t0 + .02 * k, t1: t0 + .5, speed: 4000 } }));
    const frame = [R(cx - 420, cy - 380, 30, 760), R(cx + 390, cy - 380, 30, 760), R(cx - 420, cy - 380, 840, 30), R(cx - 420, cy + 350, 840, 30)].map((p, i) => WC.shape([p], { sp: 6, halo: 6, lo: .9, seed: i }));
    const rays = WC.rays(cx, cy, { n: 70, r0: 380, r1: [520, 1100], w: 12, seed: 11, reveal: { t0: T.on, t1: T.on + .2, jit: .3 } });
    return { draw(t) {
      const lit = t > T.on && t < T.on + .55;
      draw(rings, t); for (const f of frame) f.draw(m, t);
      if (lit) { draw(rays, t); WC.plate(c, [WC.ellipse(cx, cy, 380, 330, 64)], .9 * (1 - seg(t, T.on + .35, T.on + .55))); }
      if (t > T.on + .55) { const u = ss(seg(t, T.on + .55, T.on + 1.1)); m.fillStyle = '#000'; m.fillRect(cx - 900, cy - 500, 1800 * u, 1000); }   // inked out: «никогда»
    }, cam: t => ({ z: lerp(1.0, 1.12, seg(t, t0, T.fog)), x: 924, y: 470, sx: t > T.on && t < T.on + .4 ? Math.sin(t * 90) * 6 : 0 }) };
  });
  // 3 · the fog rises and eats the sea and the tower
  const fog = lazy(() => {
    const t0 = T.fog;
    const sky = stars(120, 20, 500, 21);
    const tw = WC.shape([[[LX - 80, LB + 80], [LX - 54, LB - 250], [LX + 54, LB - 250], [LX + 80, LB + 80]]], { sp: 7, halo: 5, lo: .4, R: 50, light: WC.light(-.75, -.35, .35), dir: Math.PI / 2, seed: 3 });
    const top = WC.shape([R(LX - 44, LB - 320, 88, 70), R(LX - 76, LB - 262, 152, 14)], { sp: 6, halo: 5, lo: .9 });
    const fogCuts = []; for (let k = 0; k < 27; k++) { const y = PH + 30 - k * 19; fogCuts.push(...WC.cutAlong(wave(y, 10 + (k % 5) * 3, 90 + (k % 7) * 20, k * .7), { w: 10 + 6 * Math.sin(k), kind: 'u', seed: 40 + k, seg: [120, 380], gap: [10, 60], reveal: { t0: t0 + .1 + k * (T.rule - t0 - .6) / 27, t1: t0 + .4 + k * (T.rule - t0 - .6) / 27, speed: 3000 } })); }
    return { draw(t) { draw(sky, t); tw.draw(m, t); top.draw(m, t); draw(fogCuts, t);
        carveText('40 дней', 470, 230, 170, eo(seg(t, T.d40, T.d40 + .5))); carveText('без запаха', 470, 330, 64, eo(seg(t, T.smell, T.smell + .35)), { weight: 400 }); carveText('без звука', 470, 410, 64, eo(seg(t, T.sound, T.sound + .35)), { weight: 400 }); },
      cam: t => ({ z: lerp(1.02, 1.0, seg(t, t0, T.rule)), x: 924, y: lerp(470, 440, seg(t, t0, T.rule)) }) };
  });
  // 4 · the rule, carved as a title on a black panel
  const rule = lazy(() => {
    const t0 = T.rule;
    const border = WC.cutAlong([[180, 120], [PW - 180, 120], [PW - 180, PH - 120], [180, PH - 120], [180, 120]], { w: 8, kind: 'u', seed: 3, reveal: { t0: t0 + .1, t1: t0 + .7, speed: 6000 } });
    const inner = WC.cutAlong([[210, 150], [PW - 210, 150], [PW - 210, PH - 150], [210, PH - 150], [210, 150]], { w: 3, kind: 'k', seed: 4, reveal: { t0: t0 + .2, t1: t0 + .8, speed: 6000 } });
    return { draw(t) { draw(border, t); draw(inner, t);
        carveText('ПРАВИЛО  I', 924, 330, 150, eo(seg(t, t0 + .25, t0 + .8)));
        carveText('Никогда не зажигай', 924, 520, 96, eo(seg(t, T.ruleTxt - .1, T.ruleTxt + .5)), { weight: 400 });
        carveText('главный фонарь', 924, 640, 96, eo(seg(t, T.ruleTxt + .4, T.ruleTxt + 1.0)), { weight: 400 }); },
      cam: t => ({ z: lerp(1.04, 1.0, seg(t, t0, T.win)), x: 924, y: 460 }) };
  });
  // 5 · inside the lamp room: 23:40, the window, three lights that beat with your heart
  const win = lazy(() => {
    const t0 = T.win, wx = 860, wy = 120, ww = 860, wh = 640;
    const wall = hatchIn([R(0, 0, PW, PH)], { dir: () => Math.PI / 2, sp: 14, tone: (x, y) => .32 + .2 * (1 - Math.hypot(x - 1290, y - 440) / 1400), lo: .3, seed: 51, reveal: { t0, t1: t0 + .5, key: keyRad(1290, 440, 1500) } });
    const fogIn = []; for (let k = 0; k < 18; k++) fogIn.push(...WC.cutAlong(wave(wy + 330 + k * 18, 8, 70 + k * 4, k, wx, wx + ww), { w: 6 + 4 * Math.sin(k), kind: 'u', seed: 60 + k, seg: [80, 260], gap: [10, 40] }));
    const bars = [R(wx - 20, wy - 20, ww + 40, 30), R(wx - 20, wy + wh - 10, ww + 40, 30), R(wx - 20, wy - 20, 30, wh + 40), R(wx + ww - 10, wy - 20, 30, wh + 40), R(wx + ww / 2 - 12, wy, 24, wh), R(wx, wy + wh / 2 - 12, ww, 24)].map((p, i) => WC.shape([p], { sp: 6, halo: 6, lo: .9, seed: i }));
    const hero = figure('win.hero', { x: 560, y: 900, s: 1.05, kind: 'worker', pose: { lean: .08, head: .1, arms: [[.25, .1], [.6, 1.6]] }, reveal: { t0: t0 + .1, t1: t0 + .6 } });
    const clockS = WC.cutAlong(WC.ellipse(260, 230, 92, 92, 60), { closed: true, w: 9, kind: 'v', seg: [60, 160], gap: [0, 2], reveal: { t0: T.clock - .1, t1: T.clock + .3, speed: 3000 } });
    const L3 = [[1080, 470], [1300, 455], [1530, 480]];
    return { draw(t) {
      draw(wall, t); WC.fillPoly(m, [R(wx, wy, ww, wh)], '#000'); draw(fogIn, t); for (const b of bars) b.draw(m, t); hero.draw(m, t);
      draw(clockS, t); if (t > T.clock + .2) { m.save(); m.strokeStyle = '#fff'; m.lineCap = 'round'; m.lineWidth = 10; m.beginPath(); m.moveTo(260, 230); m.lineTo(260 - 50, 230 + 10); m.moveTo(260, 230); m.lineTo(260 - 40, 230 + 55); m.stroke(); m.restore(); }
      carveText('23:40', 260, 410, 96, eo(seg(t, T.clock, T.clock + .5)));
      const b = t > T.blink ? .2 + .8 * beat(t) : 1;
      L3.forEach(([x, y], i) => { const a = seg(t, T.lights + i * .18, T.lights + i * .18 + .25) * b; if (a <= .01) return;
        WC.fillPoly(m, [WC.ellipse(x, y, 20, 20, 24)], '#fff'); const g = c.createRadialGradient(x, y, 4, x, y, 120); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 130, y - 130, 260, 260);
        if (a > .3) draw(WC.rays(x, y, { n: 18, r0: 26, r1: [70, 130], w: 5, seed: 70 + i }), 1e9); });
    }, cam: t => ({ z: lerp(1.0, 1.08, seg(t, t0, DUR)) * (t > T.blink ? 1 + .006 * beat(t) : 1), x: lerp(924, 1000, seg(t, t0, DUR)), y: 460 }) };
  });

  PLATES = [{ from: 0, p: tower }, { from: T.never, p: lamp }, { from: T.fog, p: fog }, { from: T.rule, p: rule, peelFrom: true }, { from: T.win, p: win }];
  SUBS = [];
  for (const L of lines) {
    const txt = L.text, t0 = VO[L.id], d = D[L.id];
    const parts = txt.match(/[^,.!?—]+[,.!?—…]*\s*/g).reduce((acc, p) => { const last = acc[acc.length - 1]; if (last != null && (last + p).trim().length <= 70) acc[acc.length - 1] += p; else acc.push(p); return acc; }, []);
    let c0 = 0; for (const p of parts) { const f0 = c0 / txt.length, f1 = (c0 + p.trimEnd().length) / txt.length; c0 += p.length; SUBS.push({ t0: t0 + f0 * d - .08, t1: t0 + f1 * d + .3, text: p.trim().replace(/\s*—$/, '').replace(/(\d) (\d)/g, '$1 $2') }); }
  }
  for (let i = 0; i < SUBS.length - 1; i++) SUBS[i].t1 = Math.min(Math.max(SUBS[i].t1, SUBS[i].t0 + 1.6), SUBS[i + 1].t0 - .04);
  EV = [{ t: 0, type: 'cues', VO, D, T, DUR, cuts: PLATES.map(p => p.from) }, ...SUBS.map(s => ({ t: +s.t0.toFixed(3), type: 'sub', t1: +s.t1.toFixed(3), text: s.text }))];
}

const [A, ga] = WC.canvas(W, H), [B, gb] = WC.canvas(W, H);
let BK = null; const back_ = () => BK || (BK = WC.canvas(W, H));
function plateFrame(P, t, cap, i) {
  begin(P.p().cam(t)); P.p().draw(t); end();
  const s = SUBS.find(q => t >= q.t0 && t < q.t1); if (s && cap) caption(s.text, Math.min(1, (t - s.t0) / .1, (s.t1 - t) / .15));
  const since = t - P.from;
  return printer().render(MASK, COL, { seed: 4, inkSeed: 10 + i * 7, plate: AMBER, reg: since >= 0 && since < 2 / 24 ? [9, -7] : [3, 2] });
}
export function render(g, t) {
  let i = 0; for (let k = 0; k < PLATES.length; k++) if (t >= PLATES[k].from) i = k;
  const P = PLATES[i];
  if (P.peelFrom && t < T.peelEnd) {
    const u = seg(t, P.from, T.peelEnd);
    gb.drawImage(plateFrame(P, t, true, i), 0, 0); ga.drawImage(plateFrame(PLATES[i - 1], t, false, i - 1), 0, 0);
    g.drawImage(B, 0, 0);
    const { xf, r } = peelState(u, 180), [BKc, gk] = back_();
    gk.save(); gk.setTransform(-1, 0, 0, 1, W, 0); gk.drawImage(A, 0, 0); gk.restore(); gk.fillStyle = 'rgba(239,232,216,.82)'; gk.fillRect(0, 0, W, H);
    curl(g, A, BKc, xf, r); return;
  }
  g.drawImage(plateFrame(P, t, true, i), 0, 0);
}
