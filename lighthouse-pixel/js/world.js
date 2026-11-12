// world.js — «11 правил маяка» in 16-bit Pixel RPG: sets drawn into the 320×180 indexed framebuffer.
// Every set is a function (fb, t, s) with a state object s; the shot list (film.js) decides the states from the voice timing.
import { W, H, C, T, FB, bayer, bayer8, hash, vnoise, clamp, lerp, ss } from './engine/px.js';
import { drawChar } from './engine/sprites.js';

// ── index light / dark steps (palette stepping, never alpha)
export const LIGHT = new Uint8Array(256), DARK = new Uint8Array(256);
for (let i = 0; i < 256; i++) { LIGHT[i] = i; DARK[i] = i; }
for (const [a, b] of [[C.ink, C.night], [C.night, C.dslate], [C.dslate, C.slate], [C.slate, C.steel], [C.steel, C.silver], [C.silver, C.white],
  [C.umber, C.dbrown], [C.dbrown, C.brown], [C.brown, C.tan], [C.tan, C.sand], [C.teal, C.dgreen], [C.dgreen, C.green], [C.green, C.lime],
  [C.navy, C.blue], [C.blue, C.cyan], [C.crimson, C.red], [C.red, C.pink], [C.plum, C.rose], [C.rose, C.pink], [C.rust, C.clay], [C.clay, C.tan],
  [C.orange, C.amber], [C.amber, C.yellow], [C.yellow, C.white], [C.skinS, C.skin], [C.skin, C.sand], [C.sand, C.white]]) LIGHT[a] = b;
for (const [a, b] of [[C.night, C.ink], [C.dslate, C.night], [C.slate, C.dslate], [C.steel, C.slate], [C.silver, C.steel], [C.white, C.silver],
  [C.dbrown, C.umber], [C.brown, C.dbrown], [C.tan, C.brown], [C.sand, C.tan], [C.dgreen, C.teal], [C.green, C.dgreen], [C.lime, C.green],
  [C.blue, C.navy], [C.cyan, C.blue], [C.red, C.crimson], [C.pink, C.red], [C.rose, C.plum], [C.clay, C.rust], [C.amber, C.orange], [C.yellow, C.amber],
  [C.orange, C.rust], [C.skin, C.skinS], [C.skinS, C.brown], [C.navy, C.night], [C.teal, C.ink], [C.umber, C.ink], [C.plum, C.night], [C.crimson, C.umber], [C.rust, C.umber]]) DARK[a] = b;
export function glow(fb, cx, cy, R, k = 1, sy = 1) {
  for (let y = Math.floor(-R); y <= R; y++) for (let x = Math.floor(-R); x <= R; x++) {
    const X = Math.round(cx + x), Y = Math.round(cy + y); if (X < 0 || Y < 0 || X >= fb.w || Y >= fb.h) continue;
    const d = Math.hypot(x, y / sy) / R; if (d >= 1) continue;
    const f = (1 - d) * k, b = bayer(X, Y), i = Y * fb.w + X, c = fb.d[i];
    if (b < f * .55) fb.d[i] = LIGHT[LIGHT[c]]; else if (b < f * 1.1) fb.d[i] = LIGHT[c];
  }
}
// darkness everywhere except near lights: lights = [{x,y,r,k}] ; amb 0..2 = how many steps to darken unlit pixels
export function night(fb, lights, amb = 2) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let l = 0; for (const L of lights) { const d = Math.hypot(x - L.x, (y - L.y) / (L.sy || 1)) / L.r; if (d < 1) l = Math.max(l, (1 - d) * (L.k || 1)); }
    const steps = amb * (1 - Math.min(1, l * 1.6)), b = bayer(x, y), i = y * W + x;
    if (steps > 1 + b) fb.d[i] = DARK[DARK[fb.d[i]]]; else if (steps > b) fb.d[i] = DARK[fb.d[i]];
  }
}
// cone of a torch / flashlight: brighten inside, darken outside handled by night()
export function cone(fb, x0, y0, ang, spread, len, k = 1) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - x0, dy = y - y0, r = Math.hypot(dx, dy); if (r > len || r < 2) continue;
    let da = Math.atan2(dy, dx) - ang; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > spread) continue;
    const f = (1 - r / len) * (1 - Math.abs(da) / spread) * k * 1.6, i = y * W + x, b = bayer(x, y);
    if (b < f * .5) fb.d[i] = LIGHT[LIGHT[fb.d[i]]]; else if (b < f) fb.d[i] = LIGHT[fb.d[i]];
  }
}
export function shake(t, t0, amp = 3) { const k = Math.floor((t - t0) * 24); if (k < 0 || k > 8) return [0, 0]; return [[3, -3, 2, -2, 1, -1, 1, 0, 0][k] * amp / 3, [0, 2, -2, 1, -1, 0, 1, 0, 0][k] * amp / 3]; }

// ── in-world text: Press Start 2P (Cyrillic) rasterised at 8 px and thresholded into palette pixels
const tcache = new Map(); let tc = null;
function glyphs(s) {
  if (tcache.has(s)) return tcache.get(s);
  if (!tc) { tc = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); }
  tc.canvas.width = Math.max(8, s.length * 8 + 4); tc.canvas.height = 10; tc.clearRect(0, 0, tc.canvas.width, 10);
  tc.font = '8px PressStart'; tc.textBaseline = 'top'; tc.fillStyle = '#fff'; tc.fillText(s, 0, 1);
  const w = Math.ceil(tc.measureText(s).width), d = tc.getImageData(0, 0, tc.canvas.width, 10).data, m = new Uint8Array(w * 10);
  for (let y = 0; y < 10; y++) for (let x = 0; x < w; x++) m[y * w + x] = d[(y * tc.canvas.width + x) * 4 + 3] > 110 ? 1 : 0;
  const r = { w, h: 10, m }; tcache.set(s, r); return r;
}
export const textW = (s, sc = 1) => glyphs(s).w * sc;
export function ptext(fb, s, x, y, col, o = {}) {
  const g = glyphs(s), sc = o.sc || 1; x = Math.round(o.center ? x - g.w * sc / 2 : x); y = Math.round(y);
  const n = o.reveal != null ? Math.floor(g.w * clamp(o.reveal, 0, 1)) : g.w;
  const put = (dx, dy, c) => { for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < n; xx++) if (g.m[yy * g.w + xx]) fb.rect(x + xx * sc + dx, y + yy * sc + dy, sc, sc, c); };
  if (o.outline != null) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) put(dx, dy, o.outline);
  if (o.shadow != null) put(sc, sc, o.shadow);
  if (typeof col === 'function') { for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < n; xx++) if (g.m[yy * g.w + xx]) fb.rect(x + xx * sc, y + yy * sc, sc, sc, col(yy, xx)); }
  else put(0, 0, col);
}
// RPG window (16-bit blue skin)
export function win(fb, x, y, w, h, skin = 'blue') {
  fb.rect(x + 2, y, w - 4, h, C.ink); fb.rect(x, y + 2, w, h - 4, C.ink); fb.rect(x + 1, y + 1, w - 2, h - 2, C.ink);
  fb.rect(x + 2, y + 1, w - 4, h - 2, C.white); fb.rect(x + 1, y + 2, w - 2, h - 4, C.white); fb.rect(x + 2, y + 2, w - 4, h - 4, C.silver);
  if (skin === 'red') fb.gradV(x + 3, y + 3, w - 6, h - 6, [C.red, C.crimson, C.crimson, C.umber]);
  else if (skin === 'grey') fb.gradV(x + 3, y + 3, w - 6, h - 6, [C.slate, C.dslate, C.night]);
  else fb.gradV(x + 3, y + 3, w - 6, h - 6, [C.blue, C.navy, C.navy, C.night]);
}

// ── characters
const WALK = ['walk0', 'walk1', 'walk2', 'walk3'];
export function char(fb, who, pose, x, floor, t, o = {}) {
  const p = pose === 'walk' ? WALK[Math.floor(t * 8) % 4] : pose === 'backwalk' ? (Math.floor(t * 6) % 2 ? 'backwalk0' : 'backwalk1') : pose;
  const s = drawChar(who, p, { t, scarf: false });
  const X = Math.round(x), Y = Math.round(floor);
  if (o.sil) { for (let y = 0; y < s.h; y++) for (let xx = 0; xx < s.w; xx++) if (s.d[y * s.w + xx] !== T) fb.px(o.flip ? X + s.ox - xx : X - s.ox + xx, Y - s.oy + y, o.sil); return s; }
  if (o.flip) { for (let y = 0; y < s.h; y++) for (let xx = 0; xx < s.w; xx++) { const c = s.d[y * s.w + xx]; if (c !== T) fb.px(X + s.ox - xx, Y - s.oy + y, c); } }
  else fb.blit(s, X - s.ox, Y - s.oy);
  return s;
}
// close-up face (≈ 44×52), drawn with ellipses: who: hero | vera | mom | keeper | thing ; o: {eyes: open|closed|wide|blank, mouth 0..1, look -1..1}
export function face(fb, cx, cy, who, o = {}) {
  const sk = who === 'thing' ? [C.steel, C.silver, C.white] : [C.skinS, C.skin, C.sand];
  const hair = { hero: [C.umber, C.dbrown, C.brown], vera: [C.umber, C.rust, C.clay], mom: [C.slate, C.steel, C.silver], keeper: [C.steel, C.silver, C.white], thing: [C.night, C.dslate, C.slate] }[who];
  const ell = (x0, y0, rx, ry, f) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const v = (x / rx) ** 2 + (y / ry) ** 2; if (v <= 1) f(Math.round(x0 + x), Math.round(y0 + y), x / rx, y / ry, v); } };
  if (who === 'vera' || who === 'mom') ell(cx, cy + 4, 20, 26, (x, y) => fb.px(x, y, hair[0]));                // long hair behind
  if (who === 'hero') { fb.rect(cx - 14, cy + 20, 28, 12, C.orange); fb.rect(cx - 14, cy + 20, 28, 2, C.yellow); }  // raincoat collar
  if (who === 'vera') { fb.rect(cx - 15, cy + 21, 30, 10, C.red); fb.rect(cx - 15, cy + 21, 30, 2, C.pink); }
  if (who === 'keeper') { fb.rect(cx - 15, cy + 21, 30, 10, C.navy); fb.rect(cx - 15, cy + 21, 30, 2, C.blue); }
  ell(cx, cy + 15, 6, 6, (x, y) => fb.px(x, y, sk[0]));                                                          // neck
  ell(cx, cy, 15, 19, (x, y, u, v) => fb.px(x, y, u + v * .3 > .55 ? sk[0] : u + v < -.9 ? sk[2] : sk[1]));     // face
  if (who === 'keeper') ell(cx, cy + 12, 14, 11, (x, y, u, v) => { if (v > -.35) fb.px(x, y, hash(x, y, 4) < .25 ? hair[0] : (u > .5 ? hair[1] : hair[2])); });  // beard
  // hair cap / fringe
  ell(cx, cy - 10, 16, 11, (x, y, u, v) => { if (v < .35 || Math.abs(u) > .82) fb.px(x, y, v < -.5 ? hair[2] : (Math.abs(u) > .7 ? hair[0] : hair[1])); });
  if (who === 'hero') for (const k of [-9, -2, 6]) { fb.px(cx + k, cy - 22, hair[1]); fb.px(cx + k + 1, cy - 23, hair[2]); }
  const lk = Math.round((o.look || 0) * 2), ey = cy + 1, eyes = o.eyes || 'open';
  for (const sx of [-6, 6]) {
    const ex = cx + sx + lk;
    fb.hline(ex - 3, ex + 3, ey - 4, who === 'keeper' || who === 'mom' ? hair[1] : hair[0]);                 // brow
    if (eyes === 'closed') { fb.hline(ex - 2, ex + 2, ey, C.brown); continue; }
    if (eyes === 'blank') { fb.rect(ex - 2, ey - 1, 5, 3, C.white); continue; }
    fb.rect(ex - 2, ey - 1, 5, 3, C.white); fb.rect(ex - 1 + (sx > 0 ? 0 : 0), ey - 1, 2, eyes === 'wide' ? 3 : 2, C.ink);
    if (eyes === 'wide') fb.hline(ex - 2, ex + 2, ey - 2, C.white);
  }
  fb.px(cx + lk, cy + 6, sk[0]); fb.px(cx + lk + 1, cy + 7, sk[0]);                                             // nose
  const mo = clamp(o.mouth || 0, 0, 1), my = cy + 11;
  if (mo > .15) { fb.rect(cx - 3, my - 1, 7, 1 + Math.round(mo * 3), C.umber); fb.hline(cx - 2, cx + 2, my - 1, C.crimson); }
  else fb.hline(cx - 3, cx + 3, my, o.smile ? C.brown : C.umber), o.smile && (fb.px(cx - 4, my - 1, C.umber), fb.px(cx + 4, my - 1, C.umber));
  if (o.tear) { fb.px(cx + 8, ey + 3, C.cyan); fb.px(cx + 8, ey + 4, C.cyan); fb.px(cx + 8, ey + 6, C.blue); }
}

// the same face at 2× (close-ups): drawn small, then each pixel becomes a 2×2 block (still on the pixel grid)
const tmp = new FB(80, 84);
export function faceBig(fb, cx, cy, who, o = {}, sc = 2) {
  tmp.d.fill(T); face(tmp, 40, 40, who, o);
  for (let y = 0; y < tmp.h; y++) for (let x = 0; x < tmp.w; x++) { const c = tmp.d[y * tmp.w + x]; if (c !== T) fb.rect(cx + (x - 40) * sc, cy + (y - 40) * sc, sc, sc, c); }
}
// ── sky, sea, fog
const SKY = { night: [C.ink, C.ink, C.night, C.night, C.plum], dusk: [C.night, C.plum, C.rose, C.orange, C.amber], dawn: [C.dslate, C.slate, C.steel, C.rose, C.pink], day: [C.steel, C.steel, C.silver, C.silver, C.white] };
export function sky(fb, mode, hz, t, y0 = 0) {
  fb.gradV(0, y0, W, hz - y0, SKY[mode]);
  if (mode === 'night') for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i, 1) * W), y = Math.floor(hash(i, 2) * (hz - 20)); if (y > y0) fb.px(x, y, hash(i, 3) < .2 && Math.floor(t * 2 + i) % 7 === 0 ? C.white : hash(i, 4) < .5 ? C.steel : C.slate); }
}
export function sea(fb, y0, t, mode = 'night') {
  const cols = mode === 'night' ? [C.night, C.navy, C.teal] : mode === 'day' ? [C.slate, C.steel, C.silver] : [C.dslate, C.navy, C.slate];
  for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = (y - y0) / (H - y0), w = Math.sin(x * .09 / (1 + d * 2) + t * 1.4 + y * .7) + Math.sin(x * .031 - t * .9 + y * .3);
    fb.d[y * W + x] = w > 1.5 - d * .3 ? cols[2] : (w > .2 ? cols[1] : cols[0]);
  }
}
// fog: everything below `top` fades into fog; dens 0..1; drifting; cols light→dark
export function fog(fb, t, top, dens = 1, cols = [C.steel, C.slate, C.dslate], o = {}) {
  const sp = o.speed ?? 4, y0 = Math.max(0, Math.floor(top - 24)), y1 = o.bottom ?? H;
  for (let y = y0; y < y1; y++) {
    const base = clamp((y - top + 24) / 40, 0, 1) * dens;
    for (let x = 0; x < W; x++) {
      const n = vnoise(x / 23 + t * sp / 23 + y * .11) * .6 + vnoise(x / 9 - t * sp / 15 + y * .37 + 50) * .4;
      const f = base * (.55 + .7 * n), b = bayer8(x, y);
      if (b < f * .55) fb.d[y * W + x] = cols[0]; else if (b < f) fb.d[y * W + x] = cols[1]; else if (b < f * 1.25 && o.edge !== false) fb.d[y * W + x] = DARK[fb.d[y * W + x]];
    }
  }
}

// ═══════════════ EXT — the lighthouse on Cape Chorny ═══════════════
export const TOWER = { x: 214, base: 132, top: 34 };
export function ext(fb, t, s = {}) {
  const mode = s.mode || 'night', camY = Math.round(s.camY || 0), hz = 118 - camY;
  fb.clear(C.ink); sky(fb, mode, Math.min(H, hz + 4), t);
  if (mode === 'night' && s.moon !== false) { fb.disc(52, 30 - camY, 7, C.silver); fb.disc(55, 28 - camY, 6, C.night); }
  if (hz < H) sea(fb, hz, t, mode);
  // distant lights on the sea (rule 1)
  if (s.seaLights) for (let k = 0; k < 3; k++) { const lx = 60 + k * 14, ly = hz + 3 + (k === 1 ? 1 : 0); if (s.seaLights(k) > 0) { glow(fb, lx, ly, 7, .8); fb.rect(lx - 1, ly - 1, 2, 2, C.yellow); } }
  // cliff
  for (let x = 120; x < W; x++) { const top = 128 - camY + Math.round(6 * Math.sin(x * .05) + 3 * Math.sin(x * .17) - (x - 120) * .04); for (let y = Math.max(0, top); y < H; y++) fb.px(x, y, y === top ? C.dslate : (hash(x >> 2, y >> 2, 9) < .3 ? C.ink : C.night)); }
  for (let x = 120; x < 160; x++) { const top = 128 - camY + Math.round((160 - x) * .9); for (let y = Math.max(0, top); y < H; y++) fb.px(x, y, y === top ? C.dslate : C.night); }
  tower(fb, TOWER.x, TOWER.base - camY, t, s);
  if (s.hero) char(fb, 'hero', s.hero.pose || 'walk', s.hero.x, s.hero.y - camY, t, { flip: s.hero.flip, sil: s.hero.sil });
  if (s.creatures) creatures(fb, t, camY, s.creatures, s.fall || 0);
  if (s.salt) saltSpray(fb, t, camY, s.salt);
  if (s.fogTop != null) fog(fb, t, s.fogTop - camY, s.fogDens ?? 1, s.fogCols || (mode === 'day' ? [C.white, C.silver, C.steel] : [C.slate, C.dslate, C.night]));
  if (s.face) { const fy = s.face.y - camY; face(fb, 150, fy, 'thing', { eyes: 'blank', mouth: .4 }); if (s.fogTop != null) fog(fb, t, fy + 12, .9, [C.slate, C.dslate, C.night], { edge: false }); }
  if (s.beam) beam(fb, TOWER.x, TOWER.top - 12 - camY, t, s.beam);
}
function tower(fb, cx, base, t, s) {
  const top = base - 98;
  for (let y = top; y < base; y++) {
    const u = (y - top) / (base - top), hw = Math.round(9 + u * 5);
    const band = Math.floor((y - top) / 14) % 2 === 1;
    for (let x = -hw; x <= hw; x++) {
      const sh = x / hw; let c = band ? (sh > .45 ? C.crimson : sh < -.6 ? C.pink : C.red) : (sh > .45 ? C.steel : sh < -.6 ? C.white : C.silver);
      if (s.mode === 'night' && !s.lit) c = DARK[c];
      fb.px(cx + x, y, c);
    }
  }
  for (const [wy, k] of [[base - 24, 0], [base - 48, 1], [base - 72, 2]]) {                                     // windows
    const lit = s.windows ? s.windows[k] : (s.mode === 'night' ? 0 : 0);
    fb.rect(cx - 2, wy, 4, 6, lit ? C.amber : C.ink); if (lit) { fb.rect(cx - 1, wy + 1, 2, 2, C.yellow); glow(fb, cx, wy + 3, 9, .6); }
  }
  fb.rect(cx - 3, base - 10, 7, 10, C.dbrown); fb.rect(cx - 2, base - 9, 5, 9, C.brown); fb.px(cx + 1, base - 5, C.amber);   // door
  // gallery + lantern room + roof
  const gy = top - 1; fb.rect(cx - 16, gy, 33, 2, C.ink); fb.hline(cx - 16, cx + 16, gy - 5, C.ink); for (let x = cx - 16; x <= cx + 16; x += 4) fb.vline(x, gy - 5, gy, C.ink);
  const lamp = s.lamp || 0;
  for (let y = gy - 14; y < gy - 1; y++) for (let x = -8; x <= 8; x++) { const g = Math.abs(x) % 5 === 0; fb.px(cx + x, y, g ? C.ink : lamp > 0 ? (bayer(x, y) < lamp ? C.white : C.yellow) : (y < gy - 8 ? C.navy : C.night)); }
  for (let y = 0; y < 8; y++) { const hw = Math.round(9 - y * 1.1); fb.hline(cx - hw, cx + hw, gy - 15 - y, y < 2 ? C.crimson : C.red); }
  fb.px(cx, gy - 24, C.ink); fb.px(cx, gy - 25, C.ink);
  if (lamp > 0) glow(fb, cx, gy - 8, 30 * lamp, lamp);
}
function beam(fb, cx, cy, t, k) {               // the 40 000-candle beam: a white column into the fog, leaning left
  for (let y = 0; y < H; y++) for (let x = 0; x < cx; x++) {
    const dx = cx - x, dy = y - cy, half = 4 + dx * .22; if (Math.abs(dy + dx * .05) > half) continue;
    const f = (1 - dx / 260) * k * (Math.abs(dy + dx * .05) < half * .6 ? 1 : .5), i = y * W + x, b = bayer(x, y);
    if (b < f * .6) fb.d[i] = C.white; else if (b < f) fb.d[i] = LIGHT[LIGHT[fb.d[i]]];
  }
}
function creatures(fb, t, camY, n, fall) {        // pale-eyed shapes crawling up the tower
  for (let k = 0; k < n; k++) {
    const side = k % 2 ? 1 : -1, sp = 4 + hash(k, 3) * 5, y0 = 175 + hash(k, 1) * 60;
    let y = y0 - ((t * sp + hash(k, 2) * 90) % 150), x = TOWER.x + side * (10 + Math.round(hash(k, 5) * 3) + Math.round((y - 34) / 98 * 5));
    if (fall && hash(k, 7) < fall) { const ft = (t * 40 + k * 13) % 200; y = 60 + ft; x += side * ft * .4; }
    y -= camY; const fr = Math.floor(t * 8 + k) % 2;
    fb.rect(x - 2, y - 3, 4, 7, C.ink); fb.px(x - 3 * side, y - 2 + fr, C.ink); fb.px(x - 3 * side, y + 2 - fr, C.ink); fb.px(x + 2 * side, y - 4 + fr, C.ink); fb.px(x + 2 * side, y + 3, C.ink);
    fb.px(x - side, y - 2, C.white); fb.px(x, y - 2, C.white);
  }
}
function saltSpray(fb, t, camY, k) {
  for (let i = 0; i < 260 * k; i++) {
    const lvl = [TOWER.base - 30, TOWER.base - 54, TOWER.base - 78][i % 3], side = i % 2 ? 1 : -1, ph = (t * 1.6 + hash(i, 1)) % 1;
    const x = TOWER.x + side * (12 + ph * 60 * (.5 + hash(i, 2))), y = lvl - camY + ph * ph * 40 - 10 * ph + hash(i, 3) * 6;
    fb.px(x, y, hash(i, 4) < .5 ? C.white : C.silver);
  }
}

// ═══════════════ STAIRS — the spiral stair in cross-section ═══════════════
// steps descend to the right; s.step = current step number under the hero; s.dir = -1 down / +1 up
export function stairs(fb, t, s = {}) {
  fb.clear(C.ink);
  const sx = 7, sy = 4, heroX = 150, heroF = 104;
  const cur = s.step ?? 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {                    // curved stone wall
    const row = Math.floor((y + cur * sy) / 7), o = row % 2 ? 6 : 0, ly = ((y + cur * sy) % 7 + 7) % 7;
    const mort = ly === 6 || ((x + o + Math.floor(cur * sx)) % 12) === 0;
    const curve = Math.abs(x - 160) / 160;
    fb.d[y * W + x] = mort ? C.ink : curve > .8 ? C.night : hash(Math.floor((x + o + cur * sx) / 12), row, 3) < .15 ? C.slate : C.dslate;
  }
  for (let k = -24; k <= 24; k++) {                                            // steps around the hero
    const n = Math.floor(cur) + k, x0 = heroX + (n - cur) * sx * 2 - 6, y0 = heroF + (n - cur) * sy * 2;
    if (y0 < -10 || y0 > H + 10) continue;
    const warm = s.warm && n === 118;
    fb.rect(x0, y0, 16, 3, warm ? (Math.floor(t * 3) % 2 ? C.red : C.orange) : C.slate); fb.hline(x0, x0 + 15, y0, warm ? C.amber : C.steel); fb.rect(x0, y0 + 3, 16, 5, C.night);
    if (warm) glow(fb, x0 + 8, y0, 10, .8);
    if (n % 10 === 0 && n > 0 && n <= 120 && s.marks !== false) ptext(fb, String(n), x0 + 2, y0 + 3, C.dslate);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < 10; x++) { fb.px(x + 300 + (y % 2), y, C.ink); fb.px(x + 300, y, x === 0 ? C.slate : C.night); }   // central column edge
  if (s.keeper) keeperLying(fb, heroX + (118 - cur) * sx * 2 + 2, heroF + (118 - cur) * sy * 2, t, s.keeper);
  const who = s.who || 'hero';
  if (s.hero !== false) char(fb, who, s.pose || 'walk', heroX, heroF + 1, t, { flip: s.flip });
  if (s.vera) char(fb, 'vera', 'walk', s.vera.x, s.vera.y, t, { flip: false });
  const lights = [];
  if (s.torch !== false) { const ang = s.dir < 0 ? .55 : -2.5; cone(fb, heroX + 6, heroF - 16, s.torchAng ?? ang, .45, 120, 1); lights.push({ x: heroX, y: heroF - 10, r: 50 }, { x: heroX + 40, y: heroF + 20, r: 60 }); }
  if (s.morning) lights.push({ x: 40, y: 0, r: 200, k: .7 });
  if (s.dark !== false) night(fb, lights, s.amb ?? 2);
  if (s.counter) {                                                              // step counter window (RPG status box)
    const red = s.counterRed, v = String(Math.floor(s.counter)).padStart(3, '0');
    win(fb, 8, 20, 92, 22, red ? 'red' : 'blue'); ptext(fb, 'СТУПЕНЬ', 14, 27, red ? C.yellow : C.silver); ptext(fb, v, 74, 27, red ? C.white : C.yellow);
  }
}
function keeperLying(fb, x, y, t, k) {            // the old keeper lying on step 118, face up
  y -= 2; fb.rect(x - 14, y - 5, 26, 5, C.navy); fb.hline(x - 14, x + 11, y - 5, C.blue);         // pea coat
  fb.rect(x + 12, y - 3, 6, 3, C.night); fb.rect(x - 22, y - 4, 8, 4, C.night);                    // boots / legs
  fb.disc(x + 15, y - 8, 3, C.skin); fb.rect(x + 13, y - 7, 6, 3, C.silver); fb.px(x + 16, y - 9, C.brown); // head + grey beard
  fb.rect(x + 12, y - 11, 6, 2, C.steel);
  if (k > 1) { fb.px(x + 4, y - 1, C.amber); fb.px(x + 5, y - 1, C.amber); fb.px(x + 6, y - 1, C.rust); } // pencil stub
}

// ═══════════════ ROOM — the keeper's room (world 400 px wide; cam = left edge) ═══════════════
export const ROOM = { bunk: 40, stove: 112, clock: 170, window: 222, table: 262, sacks: 318, door: 370, floor: 138 };
export function room(fb, t, s = {}) {
  const cam = Math.round(s.cam || 0), F = ROOM.floor, X = x => x - cam;
  for (let y = 0; y < F; y++) for (let x = 0; x < W; x++) {                    // whitewashed round wall, planks below
    const wx = x + cam, ly = y % 10, mort = ly === 9 || ((wx + (Math.floor(y / 10) % 2) * 9) % 18 === 0);
    fb.d[y * W + x] = y > F - 26 ? ((wx % 14 === 0 || y === F - 26) ? C.umber : C.dbrown) : mort ? C.slate : C.steel;
  }
  for (let y = F; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = y === F ? C.tan : ((x + cam) % 24 === 0 || (y - F) % 8 === 0) ? C.umber : C.dbrown;
  // window (outside: fog / courtyard / rain)
  const wx = X(ROOM.window); fb.rect(wx - 2, 38, 36, 46, C.dbrown);
  for (let y = 40; y < 82; y++) for (let x = wx; x < wx + 32; x++) {
    const out = s.outside || 'fog', v = (y - 40) / 42;
    let c = out === 'day' ? (bayer(x, y) < v ? C.silver : C.white) : (bayer(x, y) < v ? C.slate : C.dslate);
    if (out === 'fog' || out === 'night') { const n = vnoise(x / 7 + t * .6 + y * .2); if (bayer(x, y) < n * .7) c = out === 'night' ? C.night : C.steel; }
    if (out === 'rain' && (x * 3 + y + Math.floor(t * 30)) % 9 === 0) c = C.silver;
    fb.px(x, y, c);
  }
  if (s.wellView) { const bx = wx + 20; fb.rect(bx - 5, 70, 10, 6, C.slate); fb.rect(bx - 6, 62, 12, 2, C.dbrown); fb.vline(bx - 5, 62, 70, C.dbrown); fb.vline(bx + 4, 62, 70, C.dbrown); }
  fb.vline(wx + 15, 40, 81, C.dbrown); fb.hline(wx, wx + 31, 60, C.dbrown); fb.rect(wx - 4, 84, 40, 3, C.tan);
  if (s.glassText) { ptext(fb, s.glassText, wx + 16, 56, C.red, { center: true, reveal: s.glassReveal ?? 1 }); }
  // bunk
  const bx = X(ROOM.bunk); fb.rect(bx - 30, F - 18, 60, 6, C.dbrown); fb.rect(bx - 30, F - 24, 60, 7, C.red); fb.rect(bx - 30, F - 24, 60, 2, C.pink);
  for (let x = bx - 30; x < bx + 30; x += 8) fb.vline(x, F - 22, F - 18, C.crimson);
  fb.rect(bx - 28, F - 28, 14, 5, C.white); fb.rect(bx - 31, F - 30, 3, 30, C.umber); fb.rect(bx + 28, F - 22, 3, 22, C.umber);
  // stove + pipe + fire
  const sx2 = X(ROOM.stove); fb.rect(sx2 - 12, F - 28, 24, 28, C.night); fb.rect(sx2 - 12, F - 28, 24, 2, C.slate); fb.rect(sx2 - 4, 0, 6, F - 28, C.night); fb.vline(sx2 - 4, 0, F - 28, C.dslate);
  const fire = s.fire ?? 1; if (fire > 0) { const fl = Math.floor(t * 12) % 3; fb.rect(sx2 - 7, F - 18, 14, 9, C.umber); for (let i = 0; i < 12; i++) fb.px(sx2 - 6 + i, F - 10 - ((i * 7 + fl * 3) % 5), i % 3 ? C.orange : C.yellow); fb.rect(sx2 - 6, F - 11, 12, 2, C.amber); }
  else fb.rect(sx2 - 7, F - 18, 14, 9, C.ink);
  // wall clock
  clock(fb, X(ROOM.clock), 46, s.clockTime ?? 18.07, t, s.clockStop, 1);
  // table + notebook + oil lamp + pencil
  const tx = X(ROOM.table); fb.rect(tx - 20, F - 22, 40, 4, C.brown); fb.hline(tx - 20, tx + 19, F - 22, C.tan); fb.rect(tx - 18, F - 18, 3, 18, C.dbrown); fb.rect(tx + 15, F - 18, 3, 18, C.dbrown);
  fb.rect(tx - 8, F - 25, 14, 3, C.sand); fb.vline(tx - 1, F - 25, F - 23, C.tan); fb.rect(tx - 8, F - 25, 14, 1, C.white);
  fb.rect(tx + 10, F - 30, 4, 8, C.amber); fb.rect(tx + 11, F - 33, 2, 3, C.yellow); fb.rect(tx + 9, F - 23, 6, 1, C.dbrown);
  // crate of cans + four salt sacks
  const kx = X(ROOM.sacks); fb.rect(kx - 36, F - 12, 18, 12, C.brown); fb.hline(kx - 36, kx - 19, F - 12, C.tan); for (let i = 0; i < 3; i++) fb.rect(kx - 34 + i * 6, F - 16, 4, 4, C.silver);
  for (let i = 0; i < (s.sacks ?? 4); i++) { const x0 = kx - 12 + i * 11, h = 16 - (i % 2) * 2; fb.rect(x0, F - h, 10, h, C.sand); fb.rect(x0, F - h, 10, 2, C.white); fb.rect(x0 + 1, F - h - 2, 8, 2, C.tan); fb.px(x0 + 4, F - h + 6, C.navy); fb.px(x0 + 5, F - h + 6, C.navy); }
  // the door: planks, bolt, peep slot
  const dx = X(ROOM.door) + (s.knock ? Math.round(shake(t, s.knock, 2)[0]) : 0);
  fb.rect(dx - 15, F - 64, 30, 64, C.umber); fb.rect(dx - 13, F - 62, 26, 62, C.dbrown);
  for (let x = dx - 13; x < dx + 13; x += 6) fb.vline(x, F - 62, F - 1, C.umber);
  for (const yy of [F - 52, F - 14]) { fb.rect(dx - 13, yy, 26, 3, C.brown); fb.hline(dx - 13, dx + 12, yy, C.tan); for (const xx of [dx - 10, dx + 9]) fb.px(xx, yy + 1, C.silver); }
  const bolt = s.bolt ?? 1; fb.rect(dx - 16, F - 34, 8, 3, C.slate); fb.rect(dx - 12 + Math.round((1 - bolt) * -8), F - 33, 22, 2, C.silver); fb.px(dx + 8, F - 35, C.steel);
  if (s.slot != null) { const o = s.slot; fb.rect(dx - 6, F - 46, 12, 6, C.ink); if (o > 0) { fb.rect(dx - 6, F - 46, 12, 6, s.slotLight ? C.amber : C.night); } fb.rect(dx - 7, F - 47, 14, 1, C.brown); }
  if (s.underDoor) { for (let x = dx - 12; x < dx + 12; x++) fb.px(x, F - 1, C.amber); glow(fb, dx, F + 2, 14, s.underDoor, .4); }
  // characters
  for (const c of s.chars || []) char(fb, c.who, c.pose, X(c.x), c.y ?? F, t, { flip: c.flip });
  if (s.fogFloor) fog(fb, t, F - 6, s.fogFloor, [C.white, C.silver, C.steel], { bottom: H, speed: 10 });
  // lighting
  if (s.light !== 'day') {
    const L = []; if (fire > 0) L.push({ x: sx2, y: F - 12, r: 70 + Math.sin(t * 9) * 2, k: 1 });
    if (s.lamp !== 0) L.push({ x: tx + 12, y: F - 32, r: 75, k: 1 });
    if (s.torch) L.push({ x: X(s.torch.x), y: s.torch.y, r: 60 });
    night(fb, L, s.amb ?? (s.cold ? 2 : 1));
  }
}
export function clock(fb, cx, cy, hours, t, stopped, sc = 1) {
  const R = 11 * sc; fb.disc(cx, cy, R + 2, C.dbrown); fb.disc(cx, cy, R, C.sand); fb.disc(cx, cy, R - 1, C.white);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; fb.px(Math.round(cx + Math.sin(a) * (R - 2)), Math.round(cy - Math.cos(a) * (R - 2)), C.ink); if (sc > 1) fb.rect(Math.round(cx + Math.sin(a) * (R - 3)) - 1, Math.round(cy - Math.cos(a) * (R - 3)) - 1, 2, 2, C.ink); }
  const hA = (hours % 12) / 12 * Math.PI * 2, mA = (hours % 1) * Math.PI * 2;
  fb.line(cx, cy, cx + Math.sin(hA) * R * .5, cy - Math.cos(hA) * R * .5, C.ink); fb.line(cx, cy, cx + Math.sin(mA) * R * .8, cy - Math.cos(mA) * R * .8, C.ink);
  if (sc > 1) { fb.line(cx + 1, cy, cx + 1 + Math.sin(hA) * R * .5, cy - Math.cos(hA) * R * .5, C.ink); fb.line(cx, cy + 1, cx + Math.sin(mA) * R * .8, cy + 1 - Math.cos(mA) * R * .8, C.crimson); }
  fb.disc(cx, cy, sc, C.red);
  const sw = stopped ? 0 : Math.sin(t * Math.PI) * .35, py = cy + R + 3, pl = 12 * sc;     // pendulum
  fb.line(cx, py, cx + Math.sin(sw) * pl, py + Math.cos(sw) * pl, C.dbrown); fb.disc(cx + Math.sin(sw) * pl, py + Math.cos(sw) * pl, 2 * sc, C.amber);
}

// ═══════════════ LAMP — the lantern room at the top (world 420 wide) ═══════════════
export const LAMP = { lens: 150, crank: 268, radio: 52, table: 52, floor: 140 };
export function lamp(fb, t, s = {}) {
  const cam = Math.round(s.cam || 0), F = LAMP.floor, X = x => x - cam, mode = s.mode || 'night';
  // outside through the glass: sky, sea, fog, lights
  sky(fb, mode, 104, t); sea(fb, 104, t, mode === 'day' ? 'day' : mode === 'dawn' ? 'dawn' : 'night');
  if (s.seaLights) for (let k = 0; k < 3; k++) { const lx = X(110 + k * 30), ly = 101; if (s.seaLights(k) > 0) { glow(fb, lx, ly, 10, .9); fb.rect(lx - 1, ly - 2, 3, 3, C.yellow); fb.px(lx, ly - 1, C.white); } }
  if (s.fogTop != null) fog(fb, t, s.fogTop, s.fogDens ?? 1, mode === 'day' ? [C.white, C.silver, C.steel] : [C.slate, C.dslate, C.night]);
  if (s.face) face(fb, X(s.face.x), s.face.y, 'thing', { eyes: 'blank', mouth: .5 });
  // glazing bars + gallery railing outside
  for (let k = 0; k < 6; k++) { const gx = X(k * 84 - 10); fb.rect(gx, 0, 5, F - 34, C.ink); fb.vline(gx + 1, 0, F - 34, C.night); }
  fb.rect(0, 0, W, 6, C.ink); fb.rect(0, 6, W, 2, C.dbrown);
  fb.hline(0, W - 1, F - 46, C.ink); for (let x = -cam % 10; x < W; x += 10) fb.vline(x, F - 46, F - 34, C.ink);
  // inner wall + floor
  fb.rect(0, F - 34, W, 34, C.slate); fb.hline(0, W - 1, F - 34, C.steel); for (let x = -cam % 20; x < W; x += 20) fb.vline(x, F - 33, F - 1, C.dslate);
  for (let y = F; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = ((x + cam) % 16 === 0 || y === F) ? C.night : ((x + cam + y) % 3 ? C.dslate : C.slate);
  // the great lens on its pedestal
  const lx = X(LAMP.lens), on = s.lampOn || 0;
  fb.rect(lx - 10, F - 30, 20, 30, C.dslate); fb.rect(lx - 12, F - 32, 24, 3, C.steel);
  for (let r = 22; r > 0; r -= 3) fb.disc(lx, F - 58, r, on > 0 ? (r % 6 === 1 ? C.white : C.yellow) : (r % 6 === 1 ? C.steel : C.slate));
  for (let y = F - 82; y < F - 34; y += 4) fb.hline(lx - 20, lx + 20, y, on > 0 ? C.amber : C.dslate);
  fb.disc(lx, F - 58, 5, on > 0 ? C.white : C.night);
  // lever by the lens (rule 1)
  const lvx = X(LAMP.lens + 48); fb.rect(lvx - 4, F - 52, 9, 14, C.night); fb.rect(lvx - 3, F - 51, 7, 12, C.dslate); const la = s.lever ?? 0;
  fb.line(lvx, F - 45, lvx + Math.round(-6 + 12 * la), F - 58, C.silver); fb.disc(lvx + Math.round(-6 + 12 * la), F - 58, 2, C.red);
  // the brass crank box: flask of grey salt, copper pipes into the stone, painted warning
  const cx = X(LAMP.crank); fb.rect(cx - 16, F - 30, 32, 30, C.dbrown); fb.rect(cx - 15, F - 29, 30, 28, C.amber); fb.rect(cx - 15, F - 29, 30, 2, C.yellow); fb.rect(cx + 12, F - 29, 3, 28, C.orange);
  for (const yy of [F - 22, F - 10]) for (const xx of [cx - 12, cx + 10]) fb.px(xx, yy, C.dbrown);
  const lvl = clamp(s.salt ?? 1, 0, 1); fb.rect(cx - 6, F - 58, 12, 26, C.silver); fb.rect(cx - 5, F - 57, 10, 24, C.night);
  for (let y = 0; y < Math.round(24 * lvl); y++) for (let x = 0; x < 10; x++) fb.px(cx - 5 + x, F - 34 - y, hash(x, y, 7 + Math.floor((s.crank || 0) * 4)) < .4 ? C.steel : C.silver);
  fb.rect(cx - 7, F - 60, 14, 3, C.amber); fb.rect(cx - 2, F - 33, 4, 3, C.amber);
  const ca = (s.crank || 0) * Math.PI * 2, hx = cx + 22 + Math.round(Math.cos(ca) * 7), hy = F - 16 + Math.round(Math.sin(ca) * 7);
  fb.disc(cx + 22, F - 16, 3, C.amber); fb.line(cx + 22, F - 16, hx, hy, C.yellow); fb.rect(hx - 1, hy - 3, 3, 6, C.dbrown);
  for (const [px, d] of [[cx - 16, -1], [cx + 16, 1]]) { fb.hline(Math.min(px, px + d * 18), Math.max(px, px + d * 18), F - 6, C.orange); fb.hline(Math.min(px, px + d * 18), Math.max(px, px + d * 18), F - 5, C.rust); fb.vline(px + d * 18, F - 6, H, C.orange); }
  if (s.hiss) for (let i = 0; i < 30; i++) { const ph = (t * 3 + hash(i, 1)) % 1; fb.px(cx + (i % 2 ? 36 : -36) + Math.round((hash(i, 2) - .5) * 10), F - 6 - ph * 14, ph < .5 ? C.white : C.silver); }
  ptext(fb, 'НЕ ВРАЩАТЬ', cx, F - 76, C.red, { center: true, shadow: C.umber }); ptext(fb, 'ДО ПОСЛЕДНЕГО', cx, F - 66, C.red, { center: true, shadow: C.umber });
  // radio on a shelf + table with notebook
  const rx = X(LAMP.radio); fb.rect(rx - 22, F - 24, 44, 3, C.brown); fb.rect(rx - 20, F - 21, 3, 21, C.dbrown); fb.rect(rx + 17, F - 21, 3, 21, C.dbrown);
  fb.rect(rx - 18, F - 44, 30, 20, C.dbrown); fb.rect(rx - 17, F - 43, 28, 18, C.brown); for (let y = F - 41; y < F - 28; y += 2) fb.hline(rx - 15, rx - 3, y, C.umber);
  const rOn = s.radio || 0; fb.disc(rx + 4, F - 36, 4, rOn ? C.lime : C.night); if (rOn) { fb.px(rx + 4, F - 38, C.white); glow(fb, rx + 4, F - 36, 14, .6 * rOn); }
  if (s.cord !== false) { fb.line(rx + 12, F - 30, rx + 24, F - 4, C.ink); }
  fb.rect(rx - 10, F - 27, 14, 3, C.sand); fb.rect(rx - 10, F - 27, 14, 1, C.white); fb.line(rx + 5, F - 26, rx + 12, F - 28, C.amber);
  // characters
  for (const c of s.chars || []) char(fb, c.who, c.pose, X(c.x), c.y ?? F, t, { flip: c.flip });
  if (s.fogIn) fog(fb, t, F - 10, s.fogIn, [C.white, C.silver, C.steel], { speed: 8 });
  if (on > 0) { glow(fb, lx, F - 58, 60 * on, 1); }
  if (s.beam) beam(fb, lx, F - 58, t, s.beam);
  if (mode === 'night' && !(on > 0)) night(fb, [{ x: lx, y: F - 58, r: 30, k: .3 }, ...(rOn ? [{ x: rx + 4, y: F - 36, r: 50 }] : []), ...(s.lights || [])], s.amb ?? 1);
}

// ═══════════════ WELL — the courtyard ═══════════════
export function well(fb, t, s = {}) {
  const F = 136, mode = s.mode || 'dusk';
  fb.clear(C.dslate); sky(fb, mode, 90, t); sea(fb, 90, t, mode === 'day' ? 'day' : 'night');
  for (let y = 70; y < F; y++) for (let x = 0; x < 70; x++) { const ly = y % 8; fb.px(x, y, ly === 7 || (x + (Math.floor(y / 8) % 2) * 6) % 12 === 0 ? C.dslate : x > 62 ? C.slate : C.silver); }  // tower base
  fb.rect(40, F - 34, 20, 34, C.dbrown); fb.rect(42, F - 32, 16, 32, C.brown);                                  // door
  for (let y = F; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = hash(x >> 1, y >> 1, 5) < .2 ? C.dgreen : hash(x >> 2, y >> 2, 6) < .5 ? C.teal : C.dslate;
  // 12 footstep markers (RPG path)
  if (s.steps) for (let k = 0; k < 12; k++) { const x = 70 + k * 15, on = k < s.steps; fb.rect(x, F + 6 + (k % 2) * 3, 4, 2, on ? C.yellow : C.slate); }
  const wx = 262;                                                                                             // the well
  fb.rect(wx - 22, F - 18, 44, 18, C.slate); for (let x = wx - 22; x < wx + 22; x += 7) fb.vline(x, F - 18, F, C.dslate); fb.hline(wx - 22, wx + 21, F - 18, C.steel);
  fb.rect(wx - 20, F - 54, 3, 36, C.dbrown); fb.rect(wx + 17, F - 54, 3, 36, C.dbrown); for (let y = 0; y < 8; y++) fb.hline(wx - 26 + y, wx + 25 - y, F - 62 + y, y < 2 ? C.crimson : C.red);
  fb.rect(wx - 17, F - 46, 34, 4, C.brown); const a = (s.crank || 0) * Math.PI * 2; fb.line(wx + 20, F - 44, wx + 20 + Math.cos(a) * 7, F - 44 + Math.sin(a) * 7, C.silver);
  const by = F - 40 + Math.round(clamp(s.bucket ?? 1, 0, 1) * 40); fb.vline(wx, F - 42, by, C.steel);
  if ((s.bucket ?? 1) < 1) { fb.rect(wx - 5, by, 10, 8, C.steel); fb.rect(wx - 4, by + 1, 8, 2, C.cyan); }
  if (s.hero) char(fb, 'hero', s.hero.pose, s.hero.x, F + 4, t, { flip: s.hero.flip });
  if (s.rain) for (let i = 0; i < 160; i++) { const x = (hash(i, 1) * W + t * 40) % W, y = (hash(i, 2) * H + t * 260) % H; fb.px(x, y, C.silver); fb.px(x - 1, y - 1, C.steel); }
  fog(fb, t, s.fogTop ?? 110, s.fogDens ?? .9, mode === 'day' ? [C.white, C.silver, C.steel] : [C.steel, C.slate, C.dslate]);
}

// ═══════════════ close-ups ═══════════════
// notebook on the table: two pages, scribbled lines written in (progress 0..1), optional big word
export function notebook(fb, t, s = {}) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = (y + Math.round(Math.sin(x * .05) * 2)) % 9 === 0 ? C.dbrown : C.brown;
  const x0 = 40, y0 = 16, pw = 118, ph = 140;
  fb.rect(x0 - 4, y0 - 4, pw * 2 + 8, ph + 8, C.navy); fb.rect(x0 - 3, y0 - 3, pw * 2 + 6, ph + 6, C.blue);       // oilcloth cover
  fb.rect(x0, y0, pw, ph, C.sand); fb.rect(x0 + pw, y0, pw, ph, C.white); fb.vline(x0 + pw, y0, y0 + ph, C.tan); fb.vline(x0 + pw - 1, y0, y0 + ph, C.tan);
  for (let y = y0 + 14; y < y0 + ph; y += 10) { fb.hline(x0 + 4, x0 + pw - 4, y, C.tan); fb.hline(x0 + pw + 4, x0 + pw * 2 - 4, y, C.silver); }
  // pre-written scribbles (old pages): left page always full
  const scrib = (px, py, w, seed, col, prog = 1) => { const n = Math.floor(w * prog); for (let x = 0; x < n; x++) { const yy = py + Math.round(Math.sin(x * .9 + seed) * 1.2 + (hash(x >> 2, seed) < .2 ? -1 : 0)); if (hash(x, seed, 2) < .82) fb.px(px + x, yy, col); } };
  for (let k = 0; k < 12; k++) scrib(x0 + 8, y0 + 11 + k * 10, 70 + hash(k, 1) * 30, k, C.slate);
  const lines = s.lines ?? 10, prog = s.progress ?? 1, ink = s.ink || C.dslate;
  let pen = null;
  for (let k = 0; k < lines; k++) { const lw = 64 + hash(k, 9) * 36, p = clamp(prog * lines - k, 0, 1); if (p > 0) { scrib(x0 + pw + 8, y0 + 11 + k * 10, lw, k + 40, ink, p); if (p < 1) pen = [x0 + pw + 8 + lw * p, y0 + 11 + k * 10]; } }
  if (s.title) ptext(fb, s.title, x0 + pw + pw / 2, y0 + 6, C.crimson, { center: true });
  if (s.word) { const cy = y0 + 70; ptext(fb, s.word, x0 + pw + pw / 2, cy - 8, C.ink, { center: true, sc: 2 }); const r = textW(s.word, 2) / 2 + 8;
    for (let k = 0; k < (s.circles ?? 3); k++) for (let a = 0; a < 6.3; a += .02) fb.px(x0 + pw + pw / 2 + Math.cos(a) * (r + k * 2) + k, cy + Math.sin(a) * (14 + k * 2), C.red); }
  if (s.pencil !== false) { const [px, py] = pen || s.pen || [x0 + pw * 2 - 30, y0 + ph - 20]; for (let i = 0; i < 26; i++) { fb.px(px + i, py - i * .9, i < 3 ? C.ink : i < 5 ? C.tan : C.amber); fb.px(px + i + 1, py - i * .9, i < 5 ? C.sand : C.orange); } }
  if (s.lampGlow !== false) glow(fb, 300, 10, 120, .5);
}
export function closeClock(fb, t, s = {}) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = (y % 10 === 9 || (x + (Math.floor(y / 10) % 2) * 9) % 18 === 0) ? C.slate : C.steel;
  clock(fb, 160, 70, s.time ?? 3.28, t, s.stopped, 4);
  night(fb, [{ x: 160, y: 70, r: s.lit ?? 110 }], s.amb ?? 1);
}
export function glass(fb, t, s = {}) {            // the window from inside: fog, breath, a finger writing
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = vnoise(x / 14 + t * .5 + y * .13); fb.d[y * W + x] = bayer8(x, y) < n * .8 ? C.slate : C.dslate; }
  if (s.shadow) { const sx = 200 + Math.sin(t) * 4; for (let y = 30; y < H; y++) for (let x = -24; x < 24; x++) if ((x / 22) ** 2 + ((y - 70) / 50) ** 2 < 1 && bayer(x + sx, y) < .8) fb.px(sx + x, y, C.night); }
  if (s.breath) { const k = s.breath; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - 170, (y - 80) * 1.3) / (120 * k); if (d < 1 && bayer(x, y) < (1 - d) * 1.3) fb.d[y * W + x] = (1 - d) > .5 ? C.white : C.silver; } }
  if (s.text) ptext(fb, s.text, 160, 70, s.textCol ?? C.dslate, { center: true, sc: 3, reveal: s.reveal ?? 1 });
  if (s.nail) { const k = Math.floor(t * 6) % 2; fb.rect(214, 92 + k, 4, 10, C.steel); fb.rect(214, 92 + k, 4, 3, C.white); }
  fb.rect(0, 0, W, 6, C.dbrown); fb.rect(0, H - 8, W, 8, C.dbrown); fb.rect(0, 0, 8, H, C.dbrown); fb.rect(W - 8, 0, 8, H, C.dbrown); fb.rect(156, 0, 8, H, C.dbrown); fb.rect(0, 86, W, 6, C.dbrown);
}
export function bucket(fb, t, s = {}) {           // water in the bucket, your reflection
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = C.ink;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - 160, (y - 90) * 1.25); if (d < 112) fb.d[y * W + x] = d > 104 ? C.steel : d > 100 ? C.slate : (Math.sin(d * .3 - t * 2) > .92 ? C.blue : C.navy); }
  faceBig(fb, 160, 86, 'hero', { eyes: s.blink ? 'closed' : 'open', mouth: 0 });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - 160, (y - 90) * 1.25); if (d < 100 && Math.sin(d * .3 - t * 2) > .96) fb.d[y * W + x] = C.blue; }
}
export function radio(fb, t, s = {}) {            // the radio set, close
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = (y + x) % 7 ? C.night : C.dslate;
  fb.rect(40, 30, 240, 120, C.umber); fb.rect(44, 34, 232, 112, C.dbrown); fb.rect(44, 34, 232, 3, C.brown);
  for (let y = 46; y < 134; y += 5) fb.hline(56, 156, y, C.umber);                                                  // speaker grille
  const on = s.on ?? 1, amp = s.amp || 0;
  fb.rect(176, 50, 84, 34, on ? C.dgreen : C.ink); fb.rect(178, 52, 80, 30, on ? C.green : C.ink);                 // dial
  if (on) { for (let x = 180; x < 256; x += 6) fb.vline(x, 70, 79, C.dgreen); const nx = 190 + Math.round(30 + Math.sin(t * .7) * 3); fb.vline(nx, 54, 80, C.red); glow(fb, 218, 66, 50, .5);
    for (let k = 0; k < 12; k++) { const h = Math.round(amp * (6 + 12 * Math.abs(Math.sin(t * 17 + k * 1.7)))); fb.rect(180 + k * 6, 82 - h - 2, 4, h, C.lime); } }
  ptext(fb, 'КОРСАК', 218, 92, on ? C.amber : C.dbrown, { center: true });
  fb.disc(190, 118, 9, C.slate); fb.disc(190, 118, 7, C.steel); fb.disc(240, 118, 9, C.slate); fb.disc(240, 118, 7, C.steel);
  if (s.cord !== false) fb.line(276, 120, 318, 170, C.ink); else { fb.line(276, 120, 300, 160, C.ink); fb.rect(298, 158, 6, 4, C.silver); }
  if (!on && s.ghost) ptext(fb, '...ВИДИМ', 218, 66, C.red, { center: true, reveal: s.ghost });
}
export function flask(fb, t, s = {}) {            // the crank box, close
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.d[y * W + x] = (y % 12 === 11 || (x + (Math.floor(y / 12) % 2) * 10) % 20 === 0) ? C.dslate : C.slate;
  fb.rect(80, 96, 160, 84, C.dbrown); fb.rect(84, 100, 152, 80, C.amber); fb.rect(84, 100, 152, 4, C.yellow); fb.rect(226, 100, 10, 80, C.orange);
  fb.rect(132, 14, 56, 84, C.silver); fb.rect(136, 18, 48, 78, C.night);
  const lvl = clamp(s.salt ?? 1, 0, 1); for (let y = 0; y < Math.round(76 * lvl); y++) for (let x = 0; x < 48; x++) fb.px(136 + x, 95 - y, hash(x, y + Math.floor((s.crank || 0) * 12), 3) < .45 ? C.steel : C.silver);
  if (s.crank && lvl > 0) for (let i = 0; i < 14; i++) { const ph = (t * 4 + hash(i, 2)) % 1; fb.px(150 + hash(i, 3) * 20, 96 + ph * 6, C.white); }
  fb.rect(128, 10, 64, 6, C.amber); fb.vline(140, 18, 95, C.white);
  const a = (s.crank || 0) * Math.PI * 2, hx = 270 + Math.cos(a) * 26, hy = 140 + Math.sin(a) * 26;
  fb.disc(270, 140, 8, C.amber); fb.disc(270, 140, 4, C.orange); for (let k = -2; k <= 2; k++) fb.line(270 + k * .3, 140 + k, hx, hy, C.yellow); fb.rect(hx - 4, hy - 9, 9, 18, C.dbrown); fb.rect(hx - 3, hy - 8, 3, 16, C.brown);
  if (s.hand) { fb.rect(hx - 8, hy - 6, 16, 12, C.amber); fb.rect(hx - 8, hy - 6, 16, 3, C.yellow); }
  for (const [x0, x1] of [[0, 80], [240, 320]]) { fb.rect(x0, 160, x1 - x0, 6, C.orange); fb.rect(x0, 166, x1 - x0, 3, C.rust); }
  if (s.hiss) for (let i = 0; i < 60; i++) { const ph = (t * 2.5 + hash(i, 1)) % 1, side = i % 2; fb.px(side ? 240 + ph * 80 : 80 - ph * 80, 158 - ph * 20 * hash(i, 5), C.white); }
  ptext(fb, 'НЕ ВРАЩАТЬ ДО ПОСЛЕДНЕГО', 160, 128, C.red, { center: true, shadow: C.umber });
}
export function doorOut(fb, t, s = {}) {          // the door from outside, morning: handprints at face height
  sky(fb, 'dawn', 40, t);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ly = y % 10; if (y > 10) fb.d[y * W + x] = (ly === 9 || (x + (Math.floor(y / 10) % 2) * 8) % 16 === 0) ? C.steel : C.silver; }
  fb.rect(104, 18, 112, 162, C.umber); fb.rect(108, 22, 104, 158, C.dbrown); for (let x = 108; x < 212; x += 13) fb.vline(x, 22, 179, C.umber);
  for (const yy of [40, 150]) { fb.rect(108, yy, 104, 6, C.brown); fb.hline(108, 211, yy, C.tan); }
  const n = Math.floor((s.prints ?? 1) * 22);
  for (let k = 0; k < n; k++) { const x = 116 + hash(k, 1) * 84, y = 58 + hash(k, 2) * 30, a = (hash(k, 3) - .5) * .6, col = C.white;
    for (let yy = -5; yy <= 5; yy++) for (let xx = -4; xx <= 4; xx++) if ((xx / 4) ** 2 + ((yy - 1) / 4) ** 2 < 1) fb.px(x + xx, y + yy, col);
    for (let f = 0; f < 4; f++) { const fx = x - 3 + f * 2 + Math.round(a * 3); fb.vline(fx, y - 10 + (f === 0 || f === 3 ? 2 : 0), y - 5, col); } fb.line(x + 4, y, x + 7, y - 4, col); }
  fog(fb, t, 150, .7, [C.white, C.silver, C.steel]);
}
export function slot(fb, t, s = {}) {             // the peep slot in the door: someone outside
  fb.clear(C.dbrown); for (let x = 0; x < W; x += 24) fb.vline(x, 0, H, C.umber);
  fb.rect(70, 40, 180, 90, C.umber); fb.rect(74, 44, 172, 82, C.ink);
  for (let y = 44; y < 126; y++) for (let x = 74; x < 246; x++) { const n = vnoise(x / 15 + t * .4 + y * .1); fb.px(x, y, bayer(x, y) < n * .6 ? C.slate : C.dslate); }
  if (s.who) faceBig(fb, 160, 92, s.who, { eyes: s.eyes || 'open', mouth: s.mouth || 0, tear: s.tear, look: s.look });
  if (s.hand) { const hx = 160, hy = 118; fb.rect(hx - 14, hy, 28, 14, C.skin); fb.rect(hx - 14, hy, 28, 3, C.sand); if (s.saltIn) for (let i = 0; i < 40; i++) fb.px(hx - 10 + hash(i, 1) * 20, hy - 2 + hash(i, 2) * 4, C.white); }
  if (s.fist != null) { const k = s.fist; fb.rect(140, 112, 40, 18, C.skin); fb.rect(140, 112, 40, 4, C.sand); for (let i = 0; i < 30 * (1 - k); i++) fb.px(144 + hash(i, 1) * 32, 130 + ((t * 30 + i * 7) % 40), C.white); }
  fb.rect(64, 36, 192, 4, C.brown); fb.rect(64, 130, 192, 4, C.brown);
  night(fb, [{ x: 160, y: 85, r: 150, k: s.lit ?? .8 }], 1);
}
// title / save-point card background: the tower far away in the dark, the rule number huge in the sky
export function titleBg(fb, t, s = {}) {
  ext(fb, t, { mode: 'night', camY: -10, fogTop: 120, fogDens: .9, lamp: 0, moon: false });
  for (let i = 0; i < fb.d.length; i++) fb.d[i] = DARK[fb.d[i]];
  if (s.n) ptext(fb, String(s.n), 92, 18, (y) => y < 3 ? C.white : y < 5 ? C.yellow : y < 7 ? C.amber : C.orange, { center: true, sc: 7, outline: C.ink });
}
export function endCard(fb, t, s = {}) {
  ext(fb, t, { mode: 'dawn', fogTop: 112 - (s.fog || 0) * 40, fogDens: .9, lamp: 0 });
  if (s.menu) {
    win(fb, 18, 24, 150, 52); ptext(fb, 'КТО-ТО СТУЧИТ.', 28, 33, C.white, { shadow: C.night }); ptext(fb, 'ТРИ РАЗА С ПАУЗОЙ.', 28, 45, C.silver, { shadow: C.night });
    win(fb, 18, 80, 150, 42); const sel = Math.floor(t * 1.2) % 2; ptext(fb, 'ОТКРЫТЬ', 44, 89, C.white, { shadow: C.night }); ptext(fb, 'НЕ ОТКРЫВАТЬ', 44, 105, C.white, { shadow: C.night });
    const hy = sel ? 105 : 89; ptext(fb, '►', 28 + (Math.floor(t * 4) % 2), hy, C.yellow);
  }
}
