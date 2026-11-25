// «Что если бы Германия выиграла войну?» — Shorts, 1080×1920, 24 fps, cut to the voice (voice/timing.json, word-accurate). Style: «А что если — круглоголовые»
// (coloured stickmen with round heads, on the Sci-Fi Sitcom Toon engine), with the paper-patch move borrowed from Comic History Cartoon.
// Map: Natural Earth 1:50m (geo.json). Territory changes are hand-cut paper patches, never borders.
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, screenRect, reset } from './toon.js';
import { puppet, scissors } from './countries.js';

const canvas = document.getElementById('c'); init(canvas);
const GEO = await (await fetch('geo.json')).json();
const J = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };
const LINES = (await J('lines.json'))?.lines || [], TIM = await J('voice/timing.json');
// w(line, k) → start time of the k-th word (whitespace token) of line l00<line>; d is the fallback without a voice
const w = (li, k, d) => TIM?.lines?.[`l${String(li).padStart(3, '0')}`]?.words?.[k]?.[0] ?? d;
const VEND = TIM?.total ?? 47.7, DUR = Math.round((VEND + 1.8) * 24) / 24, q = t => Math.floor(t * 12 + 1e-6) / 12;
// projection: equirectangular around 15°E 52°N, 40 px per degree of latitude
const P = (lon, lat) => [(lon - 15) * 40 * .62, -(lat - 52) * 40];
const CITY = { Берлин: [13.4, 52.5], Лондон: [-.13, 51.5], Париж: [2.35, 48.85], Москва: [37.6, 55.75], Варшава: [21, 52.2] };
const C = { sea: '#1c2a5a', seaL: '#24356e', land: '#ecdcb4', landS: '#d9c595', grey: '#8b8e86', greyS: '#6e716a', paper: '#f4ead2', dark: 'rgba(16,10,22,.62)' };

// hand-cut patches (lon/lat), ragged edges from a seeded jitter
const PATCH = {
  poland: [[14.5, 54.3], [19, 54.6], [23.8, 54], [24, 50.5], [23, 49.2], [18.8, 49.4], [14.8, 50.8]],
  france: [[-4.6, 48.5], [1.5, 50.9], [6.2, 49.4], [7.6, 47.6], [6.8, 44], [3, 43.2], [-1.5, 43.5], [-1.2, 46]],
  benelux: [[2.5, 51.1], [3.4, 51.5], [4.2, 52.1], [4.7, 52.95], [5.6, 53.45], [7.1, 53.3], [7, 52.2], [6.1, 50.8], [6.3, 50.1], [5.8, 49.5], [4.8, 50], [2.9, 50.6]],
  denmark: [[8.1, 55.5], [8.1, 57], [9.9, 57.6], [10.6, 57.7], [10.4, 56.4], [12.6, 56], [12.5, 55.3], [11.2, 54.9], [9.8, 54.8], [8.6, 54.9]],
  norway: [[5, 59], [5.5, 62.5], [10.5, 64.5], [14.8, 68.5], [17, 69], [14, 65], [12.5, 63], [11.5, 59.5], [8, 58]],
  balkans: [[13.6, 45.6], [17, 46.4], [20.5, 46.2], [23, 44.6], [22.4, 41.2], [24, 40.6], [23.6, 37.8], [21, 37], [19.3, 41.8], [15.5, 44]],
  east: [[24, 56.5], [30, 59.8], [38.5, 59], [41.5, 56], [40, 52], [36, 47.5], [30, 46], [24, 48.5], [23.5, 52]],
  britain: [[-5.5, 50], [1.5, 51], [1.8, 52.8], [-3, 55.8], [-5.8, 58.5], [-6.5, 56], [-4.6, 54.6], [-5, 52]],
};
const ragged = (pts, seed) => { const o = []; pts.forEach((p, i) => { const q2 = pts[(i + 1) % pts.length]; for (let k = 0; k < 4; k++) { const u = k / 4; o.push([lerp(p[0], q2[0], u) + (hash(seed + i * 7 + k) - .5) * .35, lerp(p[1], q2[1], u) + (hash(seed + i * 11 + k * 3) - .5) * .35]); } }); return o.map(p => P(...p)); };
const PP = Object.fromEntries(Object.entries(PATCH).map(([k, v], i) => [k, ragged(v, i * 97 + 5)]));
const centroid = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

// —— the timeline ——
// every beat sits on a word: a patch lands on the name of its country, the umbrella opens on «невозможна», the tag glows on «атомная»
const L = 0.12;   // a slap lands just after the word starts
const SLAP = { poland: w(2, 0, 4.44) + L, france: w(2, 1, 5.12) + L, benelux: w(2, 2, 6) + L, denmark: w(2, 4, 7.44) + L, norway: w(2, 5, 8) + L, balkans: w(2, 7, 9.28) + L, east: w(5, 10, 24.38) + L };
const T = { cut: 0, europe: w(2, 0, 4.44) - .15, slam1: w(3, 0, 13.16) - .05, channel: w(4, 0, 14.54) - .1, throw: w(4, 7, 17.54) - .05, umbrella: w(4, 8, 18.06) - .25, bounce: w(4, 8, 18.06) + .1,
  east: w(5, 0, 20.46) - .1, tear: w(5, 9, 23.94), dark: w(6, 0, 25.38) - .2, us: w(7, 0, 30.98) - .15, tag: w(7, 11, 34.98), slam2: w(7, 14, 36.3) - .05, peel: w(8, 0, 37.5) - .15, end: w(9, 0, 43.5) - .15 };
const PEEL = { norway: w(8, 2, 38.14), balkans: w(8, 6, 39.3), france: w(8, 7, 40.1), poland: w(8, 8, 40.82), benelux: w(8, 9, 41.74) - .3, denmark: w(8, 9, 41.74) + .1, east: w(8, 10, 42.5) };
// subtitles: the voice cut into short phrases (a sentence end, or 5 words), the word being said lit gold
const CHUNKS = [];
for (const l of LINES) {
  const tm = TIM?.lines?.[l.id]; if (!tm) continue; const tok = l.spoken.split(/\s+/);
  const emit = ids => CHUNKS.push({ words: ids.map(k => tok[k]), t: ids.map(k => tm.words[k][0]), t0: tm.words[ids[0]][0] - .06, lend: tm.t1 });
  const real = ids => ids.filter(k => tok[k] !== '—').length;
  const split = ids => {   // ≤ 6 words stay whole; longer: cut after the dash or comma nearest the middle, else in the middle
    if (real(ids) <= 6) return emit(ids);
    let best = null, mid = ids.length / 2;
    ids.forEach((k, i) => { if (i > 0 && i < ids.length - 1 && /[—,]$/.test(tok[k]) && (best === null || Math.abs(i + 1 - mid) < Math.abs(best - mid))) best = i + 1; });
    const c = best ?? Math.floor(mid); split(ids.slice(0, c)); split(ids.slice(c));
  };
  let sent = []; tok.forEach((x, k) => { sent.push(k); if (/[.?!:]$/.test(x)) { split(sent); sent = []; } }); if (sent.length) split(sent);
}
CHUNKS.forEach((c, i) => { const nx = CHUNKS[i + 1]; c.t1 = nx && nx.t0 - c.lend < .6 ? nx.t0 : Math.min(c.lend + .35, nx ? nx.t0 : 1e9); });
const TAGS = [[0, T.east, '1940'], [T.east, T.dark, '1941'], [T.us, T.peel, '1945'], [T.peel, T.end, 'ПОТОМ']];
const SHOTS = [[0, 'cut'], [T.europe, 'europe'], [T.slam1, 'slamDe'], [T.channel, 'channel'], [T.east, 'east'], [T.dark, 'dark'], [T.us, 'atlantic'], [T.slam2, 'slamShock'], [T.peel, 'peel'], [T.end, 'end']];
const shotAt = t => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[0]) s = x; return s; };

// —— camera ——
function cam(cx, cy, z, shake = 0, t = 0) { reset(); translate(W / 2, H / 2); if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); } scale(z); translate(-cx, -cy); }
const shakeAt = t => Object.values(SLAP).concat([T.bounce, T.tear]).reduce((a, s) => a + (t >= s && t < s + .3 ? 14 * (1 - (t - s) / .3) : 0), 0);

// —— the map: strokes first, fills on top, so inner borders vanish and only coastlines keep their ink ——
function drawMap(t, { dark = 0 } = {}) {
  fillOnly(rect(-3000, -3000, 6000, 6000), C.sea, { boil: 0 });
  for (let i = 0; i < 26; i++) { const y = -900 + i * 90; stroke([[-1400, y], [1400, y + 30]], 3, { line: C.seaL, boil: .3 }); }
  const rings = []; for (const [name, rs] of Object.entries(GEO)) for (const r of rs) rings.push([name, r.map(p => P(...p))]);
  for (const [, r] of rings) shape(r, { fill: C.land, lw: 10, boil: 0 });
  for (const [name, r] of rings) { const c = name === 'Germany' ? C.grey : C.land; shape(r, { fill: c, lw: 3, line: c, boil: 0 }); }
  for (const [n, ll] of Object.entries(CITY)) { const [x, y] = P(...ll); dot(x, y, 8, INK); text(n, x + 14, y - 16, { font: '900 36px Nunito', fill: INK, align: 'left' }); }
  if (dark) { reset(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(16,10,22,${.62 * dark})`; g.fillRect(0, 0, W, H); }
}
// one paper patch: falls in, slaps, may peel off later
function patch(key, t, { tSlap, tPeel = 1e9, held = null, hs = .5 } = {}) {
  if (held) { const c = centroid(PP[key]), pts = PP[key].map(p => [(p[0] - c[0]) * hs + held[0], (p[1] - c[1]) * hs + held[1]]); paperPoly(pts, 1); return; }
  if (t < tSlap - .35) return;
  const fall = seg(t, tSlap - .35, tSlap), land = t >= tSlap, sq = land ? 1 + .06 * Math.exp(-(t - tSlap) * 12) * Math.cos((t - tSlap) * 40) : lerp(1.35, 1, ei(fall));
  const peel = seg(t, tPeel, tPeel + 1.6), c = centroid(PP[key]);
  const pts = PP[key].map(p => [c[0] + (p[0] - c[0]) * sq, c[1] + (p[1] - c[1]) * sq - (land ? 0 : (1 - ei(fall)) * 260)]);
  if (peel > 0) { push(); translate(c[0] + Math.sin(peel * 9) * 60 * peel, c[1] + peel * peel * 900); rotate(peel * 2.4 * (hash(c[0]) > .5 ? 1 : -1)); scale(1 - peel * .3); translate(-c[0], -c[1]); }
  paperPoly(pts, land ? 1 : .6, peel);
  if (peel > 0) pop();
}
function paperPoly(pts, shadowA = 1, peel = 0, sc = 1) {
  fillOnly(pts.map(p => [p[0] + 10, p[1] + 14]), `rgba(10,8,20,${.28 * shadowA})`, { boil: .4 });
  shape(pts, { fill: C.grey, lw: 7, shade: () => { for (let i = 0; i < 6; i++) { const p = pts[Math.floor(i * pts.length / 6)]; stroke([[p[0] - 30, p[1]], [p[0] + 30, p[1] + 12]], 3, { line: C.greyS }); } } });
}
// face slam: the map drawn into a back layer, blurred; one big face in front
const backC = Object.assign(document.createElement('canvas'), { width: W, height: H });
function blurredMap(t, cx, cy, z, dark = 0) {
  init(backC); frame(t); cam(cx, cy, z); drawMap(t); for (const k of Object.keys(SLAP)) patch(k, t, { tSlap: SLAP[k], tPeel: PEEL[k] });
  init(canvas); frame(t); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(16px)'; g.drawImage(backC, -40, -40, W + 80, H + 80); g.filter = 'none';
  g.fillStyle = `rgba(20,10,30,${.22 + dark})`; g.fillRect(0, 0, W, H);
}
const DE = (t, o = {}) => ({ side: 'de', x: -40, y: 60, s: .5, face: 1, t: q(t), mood: 'smug', look: [.4, 0], ...o });
const allPatches = (t) => { for (const k of ['poland', 'france', 'benelux', 'denmark', 'norway', 'balkans']) patch(k, t, { tSlap: SLAP[k], tPeel: PEEL[k] }); if (t >= T.east) patch('east', t, { tSlap: SLAP.east, tPeel: PEEL.east }); };

const SH = {
  cut(t) {     // scissors already cutting a dotted line round Europe before anyone appears
    cam(60, 60, .8, 0, t); drawMap(t);
    const path = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU; path.push([-20 + Math.cos(a) * 520, 40 + Math.sin(a) * 420]); }
    for (let i = 0; i < 60; i += 2) stroke([path[i], path[i + 1]], 7, { line: INK });
    const u = seg(t, .2, 4.1), k = Math.min(59, Math.floor(u * 60)), p = path[k], n = path[k + 1];
    scissors(p[0], p[1], Math.atan2(n[1] - p[1], n[0] - p[0]), .5 + .5 * Math.sin(q(t) * 22));
  },
  europe(t) {  // the grey paper spreads: one patch per slap
    cam(60, 90, lerp(.86, .94, eio(seg(t, SLAP.balkans, T.slam1))), shakeAt(t), t); drawMap(t); allPatches(t);
    const next = Object.values(SLAP).find(s => t < s + .25 && t > s - .6) ?? null, swing = next ? Math.sin(Math.PI * seg(t, next - .5, next + .2)) : 0;
    puppet(DE(t, { mood: swing > .3 || t > SLAP.balkans + .3 ? 'smug' : 'deadpan', armR: { h: [80 + 60 * swing, -40 - 160 * swing], bend: 20 }, legL: [0, -40 * swing], legR: [0, -40 * swing] }));
  },
  slamDe(t) {  // face slam: smug, the map blurred behind
    blurredMap(t, 60, 60, .9); cam(540, 1100, 1); const p = back(seg(t, T.slam1, T.slam1 + .2), 1.6);
    puppet({ side: 'de', x: 540, y: 1900, s: 2.3 * (.85 + .15 * p), face: 1, t: q(t), mood: 'smug', look: [.6, -.1], armR: { h: [60, -60], bend: 30 } });
  },
  channel(t) { // a patch thrown at the island bounces off the umbrella
    const z = lerp(1.15, 1.3, seg(t, T.channel, T.east));
    cam(-300, 40, z, shakeAt(t), t); drawMap(t); allPatches(t);
    const [lx, ly] = P(-1.5, 52.3), [fx, fy] = P(2.2, 49.2);
    const umb = t > T.umbrella ? 1 : 0;
    puppet({ side: 'gb', x: lx - 40, y: ly + 40, s: .42, face: 1, t: q(t), mood: t > T.bounce ? 'smug' : 'deadpan', umbrella: umb, armR: umb ? { h: [10, -40], bend: 0 } : { h: [40, 150], bend: 12 } });
    const wind = seg(t, T.throw - .6, T.throw), thr = seg(t, T.throw, T.bounce), fly = seg(t, T.bounce, T.bounce + 1.2);
    puppet({ side: 'de', x: fx + 40, y: fy + 40, s: .42, face: -1, t: q(t), mood: t > T.bounce + .3 ? 'shock' : 'smug', noProp: true, armR: { h: [20 - 120 * wind + 160 * thr, -80 - 80 * wind], bend: 20 } });
    if (t < T.throw) patch('britain', t, { held: [fx - 40 * (1 - wind) + 40, fy - 260 - 60 * wind] });
    else if (t < T.bounce) patch('britain', t, { held: [lerp(fx, lx, ei(thr)), lerp(fy - 300, ly - 140, ei(thr))] });
    else if (fly < 1) { push(); const c = [lerp(lx - 60, lx - 420, fly), ly - 200 + fly * fly * 700]; translate(c[0], c[1]); rotate(fly * 5); translate(-c[0], -c[1]); patch('britain', t, { held: c }); pop(); }
  },
  east(t) {    // a tug of war over a huge patch; it tears; in this version Moscow is covered
    cam(330, -20, .95, shakeAt(t), t); drawMap(t); allPatches(t);
    const [mx, my] = P(37.6, 55.75), [wx, wy] = P(23, 52.5), pull = Math.sin(q(t) * 8) * 30;
    const torn = t >= T.tear, won = t >= SLAP.east;
    puppet({ side: 'su', x: mx + 60, y: my + 120, s: .45, face: -1, t: q(t), mood: won ? 'shock' : 'panic', nerv: won ? 1 : .4, lean: won ? -.4 : -.1 + pull * .002, sq: won ? .9 : 1, armR: { h: [-120, -60], bend: 20 }, armL: { h: [-100, -80], bend: -20 } });
    puppet(DE(t, { x: wx - 60, y: wy + 120, s: .45, mood: torn ? 'smug' : 'deadpan', lean: .1 - pull * .002, noProp: true, armR: { h: [140, -60], bend: 20 }, armL: { h: [120, -80], bend: -20 } }));
    if (!torn) patch('east', t, { held: [(mx + wx) / 2 + pull, my - 120], hs: .42 });
  },
  dark(t) {    // the serious panel: no puppets, no jokes; the grey paper over a darkened map
    cam(120, 80, lerp(.78, .82, seg(t, T.dark, T.us)), 0, t); drawMap(t); allPatches(t);
    reset(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(16,10,22,.6)'; g.fillRect(0, 0, W, H);
  },
  atlantic(t) { // the third side steps in across the ocean
    const u = seg(t, T.us, T.slam2);
    cam(lerp(-640, -360, eio(u)), 100, .9, 0, t); drawMap(t); allPatches(t);
    const [ax, ay] = P(-18, 48);
    puppet({ side: 'us', x: lerp(ax - 500, ax, eo(seg(t, T.us, T.us + 1.6))), y: ay + 140, s: .5, face: 1, t: q(t), mood: 'deadpan', look: [.6, 0], tag: t > T.tag, armR: t > T.tag ? { h: [60, -120], bend: 20 } : { h: [40, 150], bend: 12 }, legL: [Math.sin(t * 8) * 20, 0], legR: [-Math.sin(t * 8) * 20, 0] });
    puppet(DE(t, { x: P(10, 51)[0], y: P(10, 51)[1] + 120, s: .42, face: -1, mood: t > T.tag + .6 ? 'panic' : 'smug' }));
  },
  slamShock(t) {
    blurredMap(t, -200, 60, 1.0, .1); cam(540, 1100, 1); const p = back(seg(t, T.slam2, T.slam2 + .2), 1.6);
    puppet({ side: 'de', x: 540, y: 1900, s: 2.3 * (.85 + .15 * p), face: 1, t: q(t), mood: 'shock', nerv: 1, look: [-.6, -.1] });
  },
  peel(t) {    // the patches peel off one by one; he tries to hold them
    cam(60, 90, .86, 0, t); drawMap(t); allPatches(t);
    puppet(DE(t, { mood: 'panic', nerv: .8, noProp: true, armL: { h: [-90, -170], bend: -20 }, armR: { h: [90, -170], bend: 20 }, legL: [Math.sin(q(t) * 14) * 20, 0], legR: [-Math.sin(q(t) * 14) * 20, 0] }));
  },
  end(t) {     // pull back; the question card is pasted on
    cam(60, 90, lerp(.86, .66, eo(seg(t, T.end, T.end + 1.5))), 0, t); drawMap(t); allPatches(t);
    const p = back(seg(q(t), T.end + .3, T.end + .55), 2);
    reset(); push(); translate(540, 900); rotate(-.05); scale(p);
    fillOnly(rr(-420, -170, 840, 340, 18).map(v => [v[0] + 12, v[1] + 16]), 'rgba(10,8,20,.35)', { boil: .4 });
    shape(rr(-420, -170, 840, 340, 18), { fill: C.paper, lw: 8 });
    text('А ТЫ КАК', 0, -60, { font: '400 92px "Russo One"', fill: '#8e1f35' }); text('ДУМАЕШЬ?', 0, 50, { font: '400 92px "Russo One"', fill: '#8e1f35' });
    text('ПИШИ В КОММЕНТАРИЯХ', 0, 128, { font: '900 32px Nunito', fill: INK });
    pop();
  },
};

// —— type: the year tag and the caption plate ——
function tag(t) { const tg = TAGS.find(x => t >= x[0] && t < x[1]); if (!tg) return; const p = back(seg(t, tg[0], tg[0] + .25), 2);
  reset(); push(); translate(150, 220); rotate(-.06); scale(p); shape(rr(-110, -48, 220, 96, 10), { fill: '#e3a43a', lw: 7 }); text(tg[2], 0, 4, { font: '400 52px "Russo One"', fill: INK }); pop(); }
let TXT = [];
function caption(t) {
  const c = CHUNKS.find(x => t >= x.t0 && t < x.t1); if (!c) return;
  const a = ss(seg(t, c.t0, c.t0 + .08)) * (1 - ss(seg(t, c.t1 - .08, c.t1)));
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = '900 58px Nunito'; const sp = g.measureText(' ').width, ww = c.words.map(x => g.measureText(x).width);
  const width = (i0, i1) => ww.slice(i0, i1).reduce((p, x) => p + x, 0) + sp * Math.max(0, i1 - i0 - 1);
  let rows = [[0, ww.length]];
  if (width(0, ww.length) > 900) { let best = 1e9; for (let k = 1; k < ww.length; k++) { const m = Math.max(width(0, k), width(k, ww.length)); if (m < best && c.words[k] !== '—') { best = m; rows = [[0, k], [k, ww.length]]; } } }
  const y0 = 1480 - (rows.length - 1) * 72, wmax = Math.max(...rows.map(r => width(...r))), pop = back(seg(t, c.t0, c.t0 + .16), 2.2);
  g.globalAlpha = a; g.save(); g.translate(540, y0 + (rows.length - 1) * 36); g.scale(.92 + .08 * pop, .92 + .08 * pop); g.translate(-540, -(y0 + (rows.length - 1) * 36));
  g.fillStyle = 'rgba(15,10,20,.76)'; g.beginPath(); g.roundRect(540 - wmax / 2 - 34, y0 - 52, wmax + 68, rows.length * 72 + 32, 20); g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  rows.forEach(([i0, i1], r) => { let x = 540 - width(i0, i1) / 2; for (let i = i0; i < i1; i++) {
    const on = t >= c.t[i] && (i + 1 >= c.t.length || t < c.t[i + 1]) && c.words[i] !== '—';
    g.fillStyle = on ? '#f2c66a' : '#ffffff'; g.fillText(c.words[i], x, y0 + r * 72); x += ww[i] + sp; } });
  g.restore(); g.globalAlpha = 1;
}
function render(t) {
  TXT = []; frame(t); screenRect('#000');
  SH[shotAt(t)[1]](t);
  tag(t); caption(t); reset();
}
window.DUR = DUR; window.render = render; window.TEXTS = t => { render(t); return TXT; };
window.EV = [{ t: 0, type: 'voice' }, ...Object.entries(SLAP).map(([k, v]) => ({ t: v, type: 'slap', k })), ...Object.entries(PEEL).map(([k, v]) => ({ t: v, type: 'peel', k })), ...Object.entries(T).map(([k, v]) => ({ t: v, type: k }))];
for (const f of ['900 50px Nunito', '400 92px "Russo One"']) await document.fonts.load(f, 'АБВабв0123456789.,?!—ABCabc'); await document.fonts.ready;
render(+(new URLSearchParams(location.search).get('t') || 0)); window.READY = true;
