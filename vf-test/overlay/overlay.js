// video-factory overlay: one canvas on top of any Lemo-Opuscar style page.
// Karaoke captions (words light up as spoken, emphasis colours), HUD (chapter n/N, day, clock, place), chapter cards,
// note boxes (handwriting typed in), dialogue boxes (name plate, typewriter), alert banners.
// usage in a page:  import { createOverlay } from './overlay/overlay.js';
//                   const ov = await createOverlay(canvasEl, await (await fetch('cues.json')).json(), { theme: 'pixel', base: './overlay/' });
//                   window.render = t => { drawStyle(t); ov.draw(t); };
const FONTS = { PressStart: 'fonts/PressStart2P.ttf', Rubik: 'fonts/Rubik.ttf', Caveat: 'fonts/Caveat.ttf', JBMono: 'fonts/JetBrainsMono.ttf', OldStd: 'fonts/OldStandard-Regular.ttf', OldStdB: 'fonts/OldStandard-Bold.ttf' };
export const THEMES = {
  clean:   { cap: { font: '900 {s}px Rubik', size: 62, fill: '#ffffff', stroke: '#000000', sw: 10, box: null, dim: .55, up: 1.0 }, col: { acc: '#ffd23f', danger: '#ff3b3b', cool: '#4fd6ff', num: '#7dff6a', now: '#ffd23f' },
             hud: { font: '800 {s}px JBMono', size: 30, fg: '#ffffff', bg: 'rgba(0,0,0,.55)', rad: 12 }, note: { font: '700 {s}px Caveat', size: 58, bg: '#f3ead2', fg: '#2a1d10', head: 'НА ПОЛЯХ', headFont: '800 {s}px JBMono' },
             dlg: { font: '800 {s}px Rubik', size: 46, bg: 'rgba(10,10,20,.88)', fg: '#ffffff', border: '#ffffff', name: '#ffd23f' }, card: { font: '900 {s}px Rubik', size: 110, fg: '#ffffff', bg: 'rgba(0,0,0,.55)', accent: '#ffd23f' }, alert: { bg: '#d42020', fg: '#ffffff', font: '900 {s}px Rubik', size: 44 } },
  pixel:   { cap: { font: '{s}px PressStart', size: 30, fill: '#ffffff', stroke: '#000000', sw: 8, box: { bg: '#0d0d24', border: '#ffffff', border2: '#5a5ad6', pad: 26 }, dim: .4, up: 1.0, lh: 1.7 }, col: { acc: '#ffd84a', danger: '#ff4a4a', cool: '#5ad1ff', num: '#7dff6a', now: '#ffd84a' },
             hud: { font: '{s}px PressStart', size: 24, fg: '#ffffff', bg: '#0d0d24', border: '#ffffff', rad: 0 }, note: { font: '{s}px PressStart', size: 24, bg: '#2a1a0c', fg: '#ffe9b0', head: 'ЗАПИСКА', headFont: '{s}px PressStart', border: '#ffe9b0', lh: 1.8 },
             dlg: { font: '{s}px PressStart', size: 26, bg: '#0d0d24', fg: '#ffffff', border: '#ffffff', name: '#ffd84a', lh: 1.8 }, card: { font: '{s}px PressStart', size: 60, subSize: 30, fg: '#ffd84a', bg: '#0d0d24', accent: '#ffffff', border: '#ffffff' }, alert: { bg: '#b01818', fg: '#ffffff', font: '{s}px PressStart', size: 26 } },
  dossier: { cap: { font: '800 {s}px Rubik', size: 46, fill: '#FFF6E6', stroke: null, sw: 0, box: { bg: '#1C2A23', border: null, pad: 22, rad: 18, shadow: '#4D7C72' }, dim: .55, up: 1.0 }, col: { acc: '#E9B330', danger: '#ff6b5a', cool: '#9fd6c4', num: '#E9B330', now: '#E9B330' },
             hud: { font: '800 {s}px JBMono', size: 28, fg: '#1C2A23', bg: null }, note: { font: '700 {s}px Caveat', size: 56, bg: '#F2EAD8', fg: '#1C2A23', head: 'НА ПОЛЯХ', headFont: '800 {s}px JBMono' },
             dlg: { font: '800 {s}px Rubik', size: 44, bg: '#1C2A23', fg: '#FFF6E6', border: '#E9B330', name: '#E9B330' }, card: { font: '900 {s}px Rubik', size: 96, fg: '#1C2A23', bg: '#F2EAD8', accent: '#D23B2C' }, alert: { bg: '#D23B2C', fg: '#FFF6E6', font: '900 {s}px Rubik', size: 40 } },
  woodcut: { cap: { font: '400 {s}px OldStd', size: 44, fill: '#111111', stroke: null, sw: 0, box: null, dim: .45, up: 1.0, margin: true }, col: { acc: '#8a4a10', danger: '#b02a1a', cool: '#2a4a6a', num: '#8a4a10', now: '#8a4a10' },
             hud: { font: '400 {s}px OldStd', size: 28, fg: '#EFE8D8', bg: null }, note: { font: '700 {s}px Caveat', size: 54, bg: '#EFE8D8', fg: '#111111', head: 'НА ПОЛЯХ — КАРАНДАШОМ', headFont: '400 {s}px OldStd' },
             dlg: { font: '400 {s}px OldStd', size: 44, bg: '#EFE8D8', fg: '#111111', border: '#111111', name: '#8a4a10' }, card: { font: '700 {s}px OldStdB', size: 96, fg: '#EFE8D8', bg: 'rgba(0,0,0,.7)', accent: '#d8962a' }, alert: { bg: '#111111', fg: '#EFE8D8', font: '700 {s}px OldStdB', size: 40 } },
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const back = p => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const F = (f, s) => f.replace('{s}', Math.round(s));

export async function createOverlay(cv, cues, o = {}) {
  const base = o.base ?? './overlay/', th = { ...THEMES[o.theme || cues.theme || 'clean'] };
  await Promise.all(Object.entries(FONTS).map(async ([n, u]) => { try { const f = new FontFace(n, `url(${base}${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }));
  const g = cv.getContext('2d'), W = cues.W, H = cues.H, vert = H > W, k = vert ? W / 1080 : H / 1080;   // k: scale for sizes authored at 1080
  cv.width = W; cv.height = H;
  const margin = o.margin || null;                       // {y0,y1} band for captions (e.g. a paper margin), else bottom area
  const capY = margin ? (margin.y0 + margin.y1) / 2 : (vert ? H * .80 : H * .86);
  const maxW = W * (vert ? .86 : .72);
  const colOf = w => w.c ? th.col[w.c] : null;
  function wrap(words, font) {                            // ≤ 2 rows, balanced
    g.font = font; const sp = g.measureText(' ').width, ws = words.map(w => g.measureText(w.w).width);
    const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    if (total <= maxW || words.length < 2) return [[0, words.length]];
    let best = 1, bd = 1e9; for (let i = 1; i < words.length; i++) { const a = ws.slice(0, i).reduce((x, y) => x + y, 0) + sp * (i - 1), b = total - a - sp; const d = Math.max(a, b); if (d < bd) { bd = d; best = i; } }
    return [[0, best], [best, words.length]];
  }
  function box(x, y, w, h, b) {
    if (!b) return;
    if (b.shadow) { g.fillStyle = b.shadow; rr(x + 8 * k, y + 8 * k, w, h, (b.rad || 0) * k); g.fill(); }
    g.fillStyle = b.bg; rr(x, y, w, h, (b.rad || 0) * k); g.fill();
    if (b.border) { g.lineWidth = 4 * k; g.strokeStyle = b.border; g.strokeRect(x + 2 * k, y + 2 * k, w - 4 * k, h - 4 * k); }
    if (b.border2) { g.lineWidth = 3 * k; g.strokeStyle = b.border2; g.strokeRect(x + 8 * k, y + 8 * k, w - 16 * k, h - 16 * k); }
  }
  function rr(x, y, w, h, r) { g.beginPath(); if (r > 0) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  // ── karaoke page
  function caption(p, t) {
    const C = th.cap, s = C.size * k, font = F(C.font, s), lh = s * (C.lh || 1.25), a = Math.min(seg(t, p.t0, p.t0 + .12), 1 - seg(t, p.t1 - .12, p.t1));
    if (a <= 0) return;
    const rows = wrap(p.words, font); g.font = font; const sp = g.measureText(' ').width;
    const gap = (w, nx) => sp + (g.measureText(w.w).width + (nx ? g.measureText(nx.w).width : 0)) * .04;   // room for the lit word to grow
    const rw = rows.map(([i, j]) => p.words.slice(i, j).reduce((acc, w, k) => acc + g.measureText(w.w).width + (k ? gap(p.words[i + k - 1], w) : 0), 0));
    const bw = Math.max(...rw), bh = lh * rows.length, pop = back(seg(t, p.t0, p.t0 + .28));
    g.save(); g.globalAlpha = a; g.translate(W / 2, capY); g.scale(.85 + .15 * pop, .85 + .15 * pop); g.translate(-W / 2, -capY);
    if (C.box) { const pd = (C.box.pad || 20) * k; box(W / 2 - bw / 2 - pd, capY - bh / 2 - pd * .8, bw + pd * 2, bh + pd * 1.6, C.box); }
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.lineJoin = 'round';
    rows.forEach(([i, j], r) => {
      let x = W / 2 - rw[r] / 2; const y = capY - bh / 2 + lh * (r + .5);
      const row = p.words.slice(i, j);
      for (let q = 0; q < row.length; q++) { const w = row[q];
        const ww = g.measureText(w.w).width, said = t >= w.t0, now = t >= w.t0 && t < w.t1, cc = colOf(w);
        const fill = now ? (cc || th.col.now) : said ? (cc || C.fill) : C.fill, sc = now ? 1.1 : 1;
        g.save(); g.translate(x + ww / 2, y); g.scale(sc, sc); g.globalAlpha = a * (said ? 1 : C.dim);
        if (C.stroke) { g.strokeStyle = C.stroke; g.lineWidth = C.sw * k; g.strokeText(w.w, -ww / 2, 0); }
        g.fillStyle = fill; g.fillText(w.w, -ww / 2, 0); g.restore();
        x += ww + gap(w, row[q + 1]);
      }
    });
    g.restore();
  }
  // ── note / dialogue box: text typed in as it is spoken
  function textBox(b, t) {
    const isNote = b.kind === 'note', S = isNote ? th.note : th.dlg, s = S.size * k, font = F(S.font, s), lh = s * (S.lh || 1.2);
    const a = Math.min(seg(t, b.t0, b.t0 + .2), 1 - seg(t, b.t1 - .2, b.t1)); if (a <= 0) return;
    g.font = font; const sp = g.measureText(' ').width, bw = W * (vert ? .88 : .70), inner = bw - 70 * k;
    const lines = []; let cur = [], cw = 0;                // wrap to the box
    for (const w of b.words) { const ww = g.measureText(w.w).width; if (cur.length && cw + sp + ww > inner) { lines.push(cur); cur = []; cw = 0; } cur.push(w); cw += (cur.length > 1 ? sp : 0) + ww; }
    if (cur.length) lines.push(cur);
    const maxL = vert ? 6 : 4;                            // long notes: pages of ≤ maxL lines, the page that is being spoken
    if (lines.length > maxL) { let pg = 0; lines.forEach((ln, i) => { if (t >= ln[0].t0) pg = Math.floor(i / maxL); }); const all = lines.splice(0); lines.push(...all.slice(pg * maxL, pg * maxL + maxL)); }
    const head = isNote ? S.head : (b.speaker || '').toUpperCase(), hs = (isNote ? 24 : S.size * .8) * k;
    const bh = lh * lines.length + 70 * k + (head ? hs * 1.6 : 0), x0 = W / 2 - bw / 2, y0 = (margin ? margin.y0 - bh - 20 * k : capY - bh / 2 - (vert ? 40 : 20) * k) + 30 * k * (1 - back(seg(t, b.t0, b.t0 + .3)));
    g.save(); g.globalAlpha = a; g.textAlign = 'left';
    if (isNote) { g.translate(W / 2, y0 + bh / 2); g.rotate(-.012); g.translate(-W / 2, -(y0 + bh / 2)); }
    box(x0, y0, bw, bh, { bg: S.bg, border: S.border, rad: isNote ? 6 : (th === THEMES.pixel ? 0 : 16) });
    let y = y0 + 35 * k;
    if (head) { g.font = F(isNote ? S.headFont : S.font, hs); g.fillStyle = isNote ? S.fg : S.name; g.globalAlpha = a * (isNote ? .6 : 1); g.textBaseline = 'top'; g.fillText(head, x0 + 35 * k, y); g.globalAlpha = a; y += hs * 1.6; }
    g.font = font; g.textBaseline = 'top';
    for (const ln of lines) { let x = x0 + 35 * k;
      for (const w of ln) { if (t < w.t0) break; const ww = g.measureText(w.w).width; const typed = t >= w.t1 ? w.w : w.w.slice(0, Math.max(1, Math.ceil(w.w.length * seg(t, w.t0, w.t1))));
        g.fillStyle = colOf(w) || S.fg; g.fillText(typed, x, y); x += ww + sp; }
      y += lh; }
    if (!isNote && Math.floor(t * 3) % 2 && t > b.words[b.words.length - 1].t1) { g.fillStyle = S.name; g.fillText('▼', x0 + bw - 60 * k, y0 + bh - 50 * k); }
    g.restore();
  }
  // ── HUD
  function hudAt(t) { let h = null; for (const x of cues.hud) if (t >= x.t) h = x; return h; }
  function hud(t) {
    const h = hudAt(t); if (!h) return; const S = th.hud, s = S.size * k; g.font = F(S.font, s); g.textBaseline = 'middle';
    const card = [...cues.cards].reverse().find(c => t >= c.t), main = card ? card.title.split(/[·:—]/)[0].trim() : '';
    const left = card && card.n ? (main.endsWith(String(card.n)) ? `${main}/${card.N}` : `${main}  ${card.n}/${card.N}`) : (main || h.chapter || '');
    const blink = Math.floor(t * 2) % 2 === 0, time = h.time ? h.time.replace(':', blink ? ':' : ' ') : '', right = [h.day ? `ДЕНЬ ${h.day}` : '', time].filter(Boolean).join('  ·  ');
    const pad = 16 * k, y = (vert ? 70 : 52) * k;
    const chip = (txt, x, align) => { if (!txt) return; const w = g.measureText(txt).width + pad * 2, xx = align === 'left' ? x : x - w;
      if (S.bg) { box(xx, y - s * .9, w, s * 1.8, { bg: S.bg, border: S.border, rad: S.rad }); } g.fillStyle = S.fg; g.textAlign = 'left'; g.fillText(txt, xx + pad, y); };
    chip(left.toUpperCase(), 40 * k, 'left'); chip(right.toUpperCase(), W - 40 * k, 'right');
    if (h.place) { g.font = F(S.font, s * .7); g.fillStyle = S.fg; g.globalAlpha = .75; g.textAlign = 'right'; g.fillText(h.place.toUpperCase(), W - 40 * k - pad, y + s * 1.6); g.globalAlpha = 1; }
  }
  // ── chapter card
  function card(c, t) {
    const d = c.d || 2.6, a = Math.min(seg(t, c.t, c.t + .15), 1 - seg(t, c.t + d - .3, c.t + d)); if (a <= 0) return;
    const S = th.card, s = S.size * k * (vert ? .8 : 1), parts = c.title.split(/\s*[·:—]\s*/), main = parts[0], sub = parts.slice(1).join(' · ');
    g.save(); g.globalAlpha = a; const p = back(seg(t, c.t, c.t + .35)), cy = H * .45, ss_ = (S.subSize || S.size * .55) * k;
    g.font = F(S.font, s); const w1 = g.measureText(main).width;
    g.font = F(S.font, ss_); const subLines = []; let cur = '';               // wrap the subtitle to ≤ 70 % of the width
    for (const w of sub.split(/\s+/).filter(Boolean)) { const tr = cur ? cur + ' ' + w : w; if (cur && g.measureText(tr).width > W * .66) { subLines.push(cur); cur = w; } else cur = tr; }
    if (cur) subLines.push(cur);
    const w2 = Math.max(0, ...subLines.map(l => g.measureText(l).width)), lh2 = ss_ * 1.6;
    const bw = Math.min(W * .92, Math.max(w1, w2) + 140 * k), bh = s * 1.7 + subLines.length * lh2 + (c.n ? 40 * k : 0);
    g.translate(W / 2, cy); g.scale(.7 + .3 * p, .7 + .3 * p); g.translate(-W / 2, -cy);
    const y0 = cy - bh / 2; box(W / 2 - bw / 2, y0, bw, bh, { bg: S.bg, border: S.border, rad: S.border ? 0 : 20 });
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = F(S.font, s); g.fillStyle = S.fg; g.fillText(main, W / 2, y0 + s * 1.0);
    g.font = F(S.font, ss_); g.fillStyle = S.accent; subLines.forEach((l, i) => g.fillText(l, W / 2, y0 + s * 1.7 + lh2 * (i + .5)));
    if (c.n) { const pw = bw * .6, px = W / 2 - pw / 2, py = y0 + bh - 30 * k; g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(px, py, pw, 8 * k); g.fillStyle = S.fg; g.fillRect(px, py, pw * c.n / c.N, 8 * k); }
    g.restore();
  }
  function alert(al, t) {
    const a = seg(t, al.t, al.t + .1) * (1 - seg(t, al.t + al.dur - .2, al.t + al.dur)); if (a <= 0) return;
    const S = th.alert, s = S.size * k; g.font = F(S.font, s); g.textAlign = 'center'; const w = g.measureText(al.text).width + 80 * k, y = (vert ? 170 : 130) * k;
    g.save(); g.globalAlpha = a * (Math.floor(t * 5) % 2 ? 1 : .55); box(W / 2 - w / 2, y - s, w, s * 2, { bg: S.bg, rad: 8 }); g.fillStyle = S.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚠ ' + al.text, W / 2, y); g.restore();
  }
  // ── game HUD: survival bars, objective, danger/heartbeat, counter, item pick-ups, toasts (cues.fx)
  const FXL = cues.fx || [], STATCOL = ['#7dff6a', '#4fd6ff', '#ffd23f', '#ff8a3a', '#d77bff'];
  function fxState(t) {
    const st = { stats: new Map(), objective: null, danger: null, counter: null };
    for (const e of FXL) { if (e.t > t) break;
      if (e.type === 'stat') { if (e.value == null) st.stats.delete(e.name); else { const prev = st.stats.get(e.name); st.stats.set(e.name, { v: e.value, p: prev ? prev.v : e.value, t: e.t, i: prev ? prev.i : st.stats.size }); } }
      if (e.type === 'objective') st.objective = { text: e.text, t: e.t };
      if (e.type === 'danger') st.danger = { v: e.value, p: st.danger ? st.danger.v : 0, t: e.t };
      if (e.type === 'counter') st.counter = e.value == null ? null : { name: e.name, v: e.value, t: e.t };
    }
    return st;
  }
  function pill(x, y, w, h, bg, a = 1) { g.save(); g.globalAlpha *= a; g.fillStyle = bg; rr(x, y, w, h, Math.min(h / 2, 14 * k)); g.fill(); g.restore(); }
  function gameHud(t) {
    const S = th.hud, f = s_ => F(S.font, s_), st = fxState(t), x0 = 40 * k; let y = (vert ? 130 : 110) * k;
    g.save(); g.textBaseline = 'middle'; g.textAlign = 'left';
    // stats
    for (const [name, sv] of [...st.stats.entries()].sort((a, b) => a[1].i - b[1].i)) {
      const p = seg(t, sv.t, sv.t + .6), v = sv.p + (sv.v - sv.p) * p, col = STATCOL[sv.i % STATCOL.length], bw = 300 * k, bh = 24 * k;
      pill(x0 - 8 * k, y - 24 * k, bw + 230 * k, 48 * k, S.bg || 'rgba(0,0,0,.55)', .9);
      g.font = f(S.size * .8 * k); g.fillStyle = S.fg; g.fillText(name.toUpperCase(), x0 + 6 * k, y);
      const bx = x0 + 170 * k; g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(bx, y - bh / 2, bw, bh);
      g.fillStyle = v < 25 ? (Math.floor(t * 4) % 2 ? '#ff3b3b' : col) : col; g.fillRect(bx, y - bh / 2, bw * Math.max(0, Math.min(100, v)) / 100, bh);
      const fl = 1 - seg(t, sv.t, sv.t + .5); if (fl > 0 && sv.t > 0) { g.fillStyle = `rgba(255,255,255,${fl * .7})`; g.fillRect(bx, y - bh / 2, bw, bh); }
      const d = sv.v - sv.p, dl = seg(t, sv.t, sv.t + 1.4); if (d && dl < 1) { g.globalAlpha = 1 - dl; g.font = f(S.size * .9 * k); g.fillStyle = d < 0 ? '#ff4a4a' : '#7dff6a'; g.fillText((d > 0 ? '+' : '') + Math.round(d), bx + bw + 14 * k, y - 26 * k * dl); g.globalAlpha = 1; }
      y += 56 * k;
    }
    // objective
    if (st.objective) { const o = st.objective, a = seg(t, o.t, o.t + .35), hi = 1 - seg(t, o.t + .4, o.t + 1.8); g.font = f(S.size * .85 * k); const txt = 'ЦЕЛЬ: ' + o.text.toUpperCase(), w = g.measureText(txt).width + 60 * k;
      g.save(); g.translate(-(1 - a) * 300 * k, 0); pill(x0 - 8 * k, y - 24 * k, w, 48 * k, hi > 0 ? `rgba(255,210,63,${.25 + .5 * hi})` : (S.bg || 'rgba(0,0,0,.55)'), .95);
      g.fillStyle = th.col.acc; g.beginPath(); g.moveTo(x0 + 8 * k, y); g.lineTo(x0 + 16 * k, y - 8 * k); g.lineTo(x0 + 24 * k, y); g.lineTo(x0 + 16 * k, y + 8 * k); g.fill();
      g.fillStyle = S.fg; g.fillText(txt, x0 + 34 * k, y); g.restore(); y += 52 * k; }
    // counter
    if (st.counter) { const c = st.counter, pop = back(seg(t, c.t, c.t + .3)); g.save(); g.translate(x0 + 150 * k, y + 30 * k); g.scale(.8 + .2 * pop, .8 + .2 * pop);
      g.font = f(S.size * .7 * k); const w1 = g.measureText(c.name.toUpperCase()).width; g.font = f(S.size * 1.6 * k); const w2 = g.measureText(String(c.v)).width;
      pill(-150 * k, -34 * k, w1 + w2 + 70 * k, 68 * k, S.bg || 'rgba(0,0,0,.6)'); g.font = f(S.size * .7 * k); g.fillStyle = S.fg; g.fillText(c.name.toUpperCase(), -130 * k, 0);
      g.font = f(S.size * 1.6 * k); g.fillStyle = th.col.num; g.fillText(String(c.v), -130 * k + w1 + 30 * k, 2 * k); g.restore(); }
    // danger: heart + bar under the clock, red pulse at the screen edges
    if (st.danger && st.danger.v > 0) { const dv = st.danger.p + (st.danger.v - st.danger.p) * seg(t, st.danger.t, st.danger.t + .8), bpm = 60 + dv * 1.0, beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * bpm / 60)), 8);
      const hx = W - 330 * k, hy = (vert ? 220 : 160) * k; pill(hx - 30 * k, hy - 22 * k, 320 * k, 44 * k, S.bg || 'rgba(0,0,0,.55)', .9);
      g.save(); g.translate(hx, hy); g.scale(1 + .25 * beat, 1 + .25 * beat); g.fillStyle = '#ff3b3b'; g.beginPath(); const r = 9 * k; g.arc(-r * .55, -r * .3, r * .6, Math.PI, 0); g.arc(r * .55, -r * .3, r * .6, Math.PI, 0); g.lineTo(0, r * 1.1); g.closePath(); g.fill(); g.restore();
      g.font = f(S.size * .6 * k); g.fillStyle = S.fg; g.fillText('СТРАХ', hx + 22 * k, hy); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(hx + 120 * k, hy - 8 * k, 150 * k, 16 * k); g.fillStyle = '#ff3b3b'; g.fillRect(hx + 120 * k, hy - 8 * k, 150 * k * dv / 100, 16 * k);
      if (dv > 55) { const a = (dv - 55) / 45 * (.25 + .35 * beat), gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .45, W / 2, H / 2, Math.max(W, H) * .75); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(200,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); } }
    // item pick-ups (slide in from the right) and toasts (top centre)
    let iy = (vert ? 420 : 300) * k;
    for (const e of FXL) { if (e.type !== 'item' || t < e.t || t > e.t + 2.6) continue; const a = Math.min(back(seg(t, e.t, e.t + .35)), 1 - seg(t, e.t + 2.2, e.t + 2.6));
      g.font = f(S.size * 1.05 * k); const txt = e.text.toUpperCase(), w = g.measureText(txt).width + 110 * k, x = W - 40 * k - w * a;
      pill(x, iy - 34 * k, w, 68 * k, S.bg || 'rgba(0,0,0,.65)'); g.fillStyle = th.col.cool; g.beginPath(); g.arc(x + 40 * k, iy, 16 * k * (1 + .2 * Math.sin(t * 12)), 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = f(S.size * .8 * k); g.textAlign = 'center'; g.fillText('★', x + 40 * k, iy + 1 * k); g.textAlign = 'left';
      g.font = f(S.size * 1.05 * k); g.fillStyle = th.col.acc; g.fillText(txt, x + 70 * k, iy); iy += 80 * k; }
    for (const e of FXL) { if (e.type !== 'toast' || t < e.t || t > e.t + 2.4) continue; const a = Math.min(seg(t, e.t, e.t + .2), 1 - seg(t, e.t + 2, e.t + 2.4));
      g.font = f(S.size * .8 * k); const txt = '✓ ' + e.text.toUpperCase(), w = g.measureText(txt).width + 50 * k, y2 = (vert ? 300 : 200) * k - (1 - a) * 30 * k;
      g.globalAlpha = a; pill(W / 2 - w / 2, y2 - 24 * k, w, 48 * k, S.bg || 'rgba(0,0,0,.65)'); g.fillStyle = th.col.num; g.textAlign = 'center'; g.fillText(txt, W / 2, y2); g.textAlign = 'left'; g.globalAlpha = 1; }
    g.restore();
  }
  return {
    draw(t) {
      g.clearRect(0, 0, W, H);
      if (o.hud !== false) { hud(t); gameHud(t); }
      for (const al of cues.alerts) alert(al, t);
      for (const c of cues.cards) card(c, t);
      const bx = cues.boxes.find(b => t >= b.t0 && t < b.t1);
      if (bx) textBox(bx, t); else { const p = cues.pages.find(p => t >= p.t0 && t < p.t1); if (p) caption(p, t); }
    },
    texts(t) { const p = cues.pages.find(p => t >= p.t0 && t < p.t1); return p ? [{ id: 'cap' + p.t0, text: p.words.map(w => w.w).join(' '), x0: 0, y0: capY - 80, x1: W, y1: capY + 80 }] : []; },
  };
}
