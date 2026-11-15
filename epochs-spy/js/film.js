// film.js — «Сколько ты проживёшь в каждой эпохе» as a 60s spy title sequence (cut paper, 4 inks per location).
import * as P from './spy.js';
const { W, H, piece, rect, ell, rot, type, hero, ground, paper, shatter, INK, rnd, fitSize, capsule } = P;
let g, CU, SEG = [], EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const tw = t => Math.floor(t * 12) / 12;                       // puppets on twos
const CREAM = '#efe4c9', RED = '#d23a22', MUST = '#e2a52a', TEAL = '#1f8a8a', ORANGE = '#f07a28', COBALT = '#2a46b8', PINK = '#f3d6cc', LEMON = '#f0d23a', BONE = '#ece6d6', OLIVE = '#56553a';
const STAMPS = { ice_bones: ['три', '3 ДНЯ', 'ЛЕДНИК', 11.4], egypt: ['две', '2 НЕДЕЛИ', 'ЕГИПЕТ'], rome: ['четыре', '4 ДНЯ', 'РИМ'], plague: ['шесть', '6 ДНЕЙ', 'ЧУМА'], ship: ['месяц', '1 МЕСЯЦ', 'РЕКОРД!'], london: ['три', '3 НЕДЕЛИ', 'ЛОНДОН'], trench: ['четыре', '4 ЧАСА', 'ВЕРДЕН'] };
let ST = [];
const EPOCHS = ['ice_bones', 'egypt', 'rome', 'plague', 'ship', 'london', 'trench', 'now'];
export async function init(cv, cues) {
  g = cv.getContext('2d'); P.setCtx(g); CU = cues;
  for (const [n, u] of [['OswaldC', 'Oswald-700-cyrillic.woff2'], ['OswaldL', 'Oswald-700-latin.woff2'], ['Rubik', 'Rubik.ttf']]) { try { const f = new FontFace(n, `url(./overlay/fonts/${u})`); await f.load(); document.fonts.add(f); } catch (e) {} }
  const L = Object.entries(cues.lines).map(([id, l]) => ({ id, ...l })).filter(l => l.t1 > l.t0).sort((a, b) => a.t0 - b.t0);
  for (const l of L) { const sc = l.tags.scene, last = SEG[SEG.length - 1]; if (last && last.scene === sc) last.lines.push(l); else SEG.push({ scene: sc, lines: [l], t0: l.t0 - .15 }); }
  SEG.forEach((s, i) => { s.t1 = i + 1 < SEG.length ? SEG[i + 1].t0 : cues.total + .3; s.i = i; }); SEG[0].t0 = 0;
  // sound events: a brass stab on every cut, clicks of the bracelet, paper slaps, stop-time silence
  for (const s of SEG) { ev(s.t0, 'stab'); if (EPOCHS.includes(s.scene) && s.i > 2) { ev(s.t0 - .3, 'whoosh'); ev(s.t0 - .3, 'paper', { v: .7 }); } }
  const w = (sc, p) => { const s = SEG.find(x => x.scene === sc); return s ? wt(s, p) : null; };
  [w('click', 'щелчок'), w('now', 'щелчок')].forEach(t => t != null && ev(t, 'click'));
  const sab = w('ice_death', 'саблезуб'); if (sab != null) { ev(sab, 'silence'); ev(sab + .7, 'hit'); }
  for (const p of ['без', 'оружия', 'иммунитета']) { const a = w('click', p); if (a != null) ev(a, 'stab'); }
  for (const s of SEG) { const d = STAMPS[s.scene]; if (!d) continue; const a = wt(s, d[0]); if (a != null) { ST.push({ t0: a, t1: d[3] ?? s.t1 + .35, txt: d[1], sub: d[2] }); ev(a, 'stamp'); } }
  return { draw, EV };
}
const norm = s => s.toLowerCase().replace(/ё/g, 'е');
function wt(seg, pat, n = 0) { let k = 0; const p = norm(pat); for (const l of seg.lines) for (const x of l.words) if (norm(x.w).startsWith(p)) { if (k++ === n) return x.t0; } return null; }
const since = (seg, pat, t) => { const a = wt(seg, pat); return a == null ? -1 : t - a; };
function pick(seg, t, list) { let cur = list[0][1], last = -1e9; for (const [w, fn] of list) { const at = w == null ? seg.t0 : wt(seg, w); if (at != null && t >= at - .08 && at - last >= .4) { cur = fn; last = at; } } return cur(); }
// big «survived» stamp: number + unit landing like a credit
function stamp(txt, sub, t, t0, col = INK, y = 1250) { const p = clamp((t - t0) / .35); const fs = fitSize(txt, 300, 960); type(txt, W / 2, y, fs, col, { align: 'center', land: p, drop: 260 }); if (sub) type(sub, W / 2, y + 110, 80, col, { align: 'center', land: clamp((t - t0 - .2) / .3) }); }
const stars = (n, col, seed = 1) => { for (let i = 0; i < n; i++) piece(ell(rnd(i, seed) * W, rnd(i, seed + 1) * H, 6, 6, 6), col, { seed: i, shadow: false, gap: false }); };
const snow = (t, col) => { for (let i = 0; i < 60; i++) { const x = (rnd(i, 1) * W + tw(t) * 300) % W, y = (rnd(i, 2) * H + tw(t) * 520) % H; piece(rot(rect(x, y, 6, 40), x, y, -.5), col, { seed: i, shadow: false, gap: false }); } };

const SC = {
  ice_death(t, s) {
    const sab = wt(s, 'саблезуб'), frozen = sab != null && t > sab && t < sab + .7; if (frozen) t = sab;
    ground(TEAL); type('−40°', W / 2, 760, 420, BONE, { align: 'center' });
    piece([[0, 1320], [300, 1240], [620, 1300], [1080, 1220], [1080, 1920], [0, 1920]], BONE, { seed: 2 });
    snow(t, BONE);
    const shiver = Math.sin(tw(t) * 60) * 5;
    return pick(s, t, [
      [null, () => hero(420 + shiver, 1300, 1.25, 'shiver', { scarf: ORANGE, wind: .7, facing: 1 })],
      ['пальцев', () => { ground(TEAL); snow(t, BONE); const h = hero(560 + shiver, 2400, 3.4, 'shiver', { scarf: ORANGE, wind: .7, eye: true }); type('ПАЛЬЦЫ?', W / 2, 420, 170, BONE, { align: 'center', land: clamp(since(s, 'пальцев', t) / .3) }); }],
      ['метели', () => { hero(380, 1300, 1.25, 'panic', { scarf: ORANGE, wind: .9 }); const m0 = wt(s, 'метели') ?? sab, k = ss(m0, (sab ?? m0) + .05, t), cx = 1250 - k * 520, cy = 1000 + k * 80;
        piece([[cx - 260, cy], [cx - 60, cy - 120], [cx + 260, cy - 80], [cx + 300, cy + 40], [cx + 160, cy + 120], [cx - 200, cy + 110]], INK, { seed: 40 });
        piece(ell(cx - 300, cy - 30, 110, 90, 20), INK, { seed: 41 }); piece([[cx - 360, cy + 20], [cx - 340, cy + 140], [cx - 320, cy + 30]], BONE, { seed: 42 }); piece([[cx - 300, cy + 30], [cx - 280, cy + 150], [cx - 262, cy + 40]], BONE, { seed: 43 });
        piece(ell(cx - 320, cy - 50, 16, 10, 8), ORANGE, { seed: 44, shadow: false });
        for (const [lx, ly, a] of [[cx - 180, cy + 60, .9], [cx - 80, cy + 80, .4], [cx + 140, cy + 80, -.4], [cx + 220, cy + 30, -.9]]) piece(capsule(lx, ly, lx + Math.sin(a) * 200, ly + Math.cos(a) * 200, 54), INK, { seed: lx | 0 });
        if (frozen) type('СТОП', W / 2, 520, 260, RED, { align: 'center' }); }],
    ]);
  },
  click(t, s) {
    ground(INK);
    return pick(s, t, [
      [null, () => { const k = clamp(since(s, 'щелчок', t) / .2); g.save(); g.globalAlpha = .5 * k; g.fillStyle = '#ffd25a'; g.beginPath(); g.arc(W / 2, 900, 380, 0, 7); g.fill(); g.restore();
        piece(capsule(-100, 1500, 640, 980, 300), CREAM, { seed: 50 }); piece(rot(rect(470, 830, 260, 200), 600, 930, -.62), MUST, { seed: 51 }); piece(rot(rect(540, 880, 120, 70), 600, 915, -.62), INK, { seed: 52, shadow: false });
        type('ЩЁЛК!', W / 2, 520, 240, MUST, { align: 'center', land: k, gapCol: INK }); }],
      ['спасает', () => { const k = since(s, 'спасает', t); ground(MUST); piece(ell(W / 2, 900, 430, 430, 48), INK, { seed: 53 }); hero(W / 2, 1150 + Math.min(1, k / 1.5) * 300, 1.1 - Math.min(.6, k * .3), 'panic', { scarf: RED, wind: .9, gapCol: INK, col: CREAM }); type('ДО СМЕРТИ: 0,1 С', W / 2, 420, 110, INK, { align: 'center', gapCol: MUST }); }],
      ['без', () => { ground(RED); const items = [['БЕЗ ДЕНЕГ', 'без'], ['БЕЗ ОРУЖИЯ', 'оружия'], ['БЕЗ ИММУНИТЕТА', 'иммунитета']];
        items.forEach(([txt, w], i) => { const a = since(s, w, t); if (a < 0) return; const fs = fitSize(txt, 170, 940); type(txt, W / 2, 620 + i * 300, fs, i === 2 ? CREAM : INK, { align: 'center', land: clamp(a / .3), gapCol: RED }); piece(rect(90, 640 + i * 300 - fs * .45, 900, 18), CREAM, { seed: 60 + i, shadow: false }); });
        hero(W / 2 + Math.sin(tw(t) * 50) * 4, 1780, .8, 'shrug', { scarf: CREAM, gapCol: RED }); }],
    ]);
  },
  ice_bones(t, s) {
    ground(BONE); piece([[0, 1500], [1080, 1450], [1080, 1920], [0, 1920]], '#c9c2b2', { seed: 70 });
    for (let i = 0; i < 9; i++) { const x0 = 170 + i * 92, top = 900 + Math.abs(i - 4) ** 1.6 * 34; piece(capsule(x0, 1480, W / 2 + (x0 - W / 2) * .35, top, 46), i % 2 ? CREAM : '#ddd3bd', { seed: 71 + i }); }
    piece([[W / 2 - 110, 1480], [W / 2 - 110, 1300], [W / 2, 1240], [W / 2 + 110, 1300], [W / 2 + 110, 1480]], INK, { seed: 89 });
    for (const [x, y, a] of [[200, 1120, .5], [880, 1120, -.5]]) { piece(rot(capsule(x - 120, y, x + 120, y, 60), x, y, a), CREAM, { seed: x }); piece(ell(x - 140, y, 40, 46, 12), CREAM, { seed: x + 1 }); }
    piece(ell(W / 2, 1600, 120, 40, 18), ORANGE, { seed: 90 }); for (let i = 0; i < 4; i++) piece([[W / 2 - 60 + i * 40, 1600], [W / 2 - 40 + i * 40 + Math.sin(tw(t) * 30 + i) * 12, 1460], [W / 2 - 20 + i * 40, 1600]], i % 2 ? RED : MUST, { seed: 91 + i, shadow: false });
    hero(250, 1620, .9, 'sit', { scarf: ORANGE, gapCol: BONE });
    type('КОСТИ МАМОНТОВ', W / 2, 420, fitSize('КОСТИ МАМОНТОВ', 130, 960), TEAL, { align: 'center', land: clamp(since(s, 'костей', t) / .3) });
  },
  egypt(t, s) {
    ground(MUST); piece(ell(820, 420, 200, 200, 40), RED, { seed: 100 });
    const rows = ['Е', 'ГИ', 'ПЕТ', 'ЕГИП']; rows.forEach((r, i) => { const y = 900 + i * 170; piece([[W / 2 - (i + 1) * 120, y + 170], [W / 2 + (i + 1) * 120, y + 170], [W / 2 + (i + .5) * 120, y], [W / 2 - (i + .5) * 120, y]], i % 2 ? CREAM : '#cfc2a0', { seed: 101 + i }); for (let b = -i - 1; b < i + 1; b++) piece(rect(W / 2 + b * 120 + 8, y + 80, 6, 90), '#a8996f', { seed: 105 + b + i * 9, shadow: false, gap: false }); });
    return pick(s, t, [
      [null, () => { hero(250 + tw(t) * 30 % 120, 1700, 1.05, 'carry', { scarf: RED, gapCol: MUST }); piece(rect(130 + tw(t) * 30 % 120, 1130, 240, 110), '#cfc2a0', { seed: 110 }); for (let i = 0; i < 3; i++) piece(ell(380 + i * 50, 1250 - ((tw(t) * 60 + i * 30) % 90), 26, 22, 12), CREAM, { seed: 111 + i, shadow: false }); }],
      ['черви', () => { ground(TEAL); piece(ell(W / 2, 980, 380, 120, 40), CREAM, { seed: 120 }); piece([[W / 2 - 380, 980], [W / 2 + 380, 980], [W / 2 + 300, 1500], [W / 2 - 300, 1500]], CREAM, { seed: 121 }); piece(ell(W / 2, 990, 330, 90, 40), '#7a6a3a', { seed: 122, shadow: false });
        for (let i = 0; i < 5; i++) { const x = W / 2 - 220 + i * 110, ph = tw(t) * 8 + i; piece(Array.from({ length: 10 }, (_, k) => [x + Math.sin(ph + k * .7) * 20, 990 - k * 14]).concat(Array.from({ length: 10 }, (_, k) => [x + 16 + Math.sin(ph + (9 - k) * .7) * 20, 990 - (9 - k) * 14])), RED, { seed: 123 + i, shadow: false }); }
        type('НИЛ', W / 2, 600, 240, INK, { align: 'center', gapCol: TEAL }); }],
      ['пивом', () => { ground(MUST); piece([[W / 2 - 200, 1500], [W / 2 + 200, 1500], [W / 2 + 260, 1000], [W / 2 + 120, 860], [W / 2 - 120, 860], [W / 2 - 260, 1000]], RED, { seed: 130 }); piece(rect(W / 2 - 90, 780, 180, 90), RED, { seed: 131 }); type('5 Л', W / 2, 1260, 200, CREAM, { align: 'center', gapCol: RED, shadow: false });
        type('ЗАРПЛАТА', W / 2, 560, 170, INK, { align: 'center', land: clamp(since(s, 'пивом', t) / .3) }); }],
      ['две', () => { hero(250, 1700, 1.05, 'cough', { scarf: RED, gapCol: MUST }); }],
    ]);
  },
  rome(t, s) {
    ground(RED);
    ['Р', 'И', 'М'].forEach((ch, i) => { const x = 210 + i * 330; piece(rect(x - 70, 300, 140, 1150), CREAM, { seed: 140 + i }); type(ch, x, 470, 220, INK, { align: 'center', gapCol: CREAM, shadow: false }); piece(rect(x - 100, 280, 200, 50), CREAM, { seed: 145 + i }); });
    piece(rect(0, 1450, W, 470), '#a82a18', { seed: 149 });
    const gest = Math.floor(tw(t) * 3) % 2 ? 'gesture' : 'shrug';
    return pick(s, t, [
      [null, () => { hero(320, 1700, 1.05, gest, { scarf: MUST, gapCol: RED });
        const gx = 800; hero(gx, 1700, 1.25, 'stand', { scarf: INK, bracelet: false, facing: -1, gapCol: RED, col: INK }); piece(ell(gx, 1700 - 1.25 * 70 * 4.6, 70, 50, 20, Math.PI, Math.PI * 2), MUST, { seed: 150 }); piece(rect(gx + 90, 900, 16, 700), MUST, { seed: 151 }); for (const d of [-30, 0, 30]) piece([[gx + 98 + d, 900], [gx + 90 + d, 850], [gx + 106 + d, 850]], MUST, { seed: 152 + d, shadow: false }); }],
      ['мочой', () => { ground(CREAM); piece([[W / 2 - 160, 1500], [W / 2 + 160, 1500], [W / 2 + 230, 1150], [W / 2 + 100, 900], [W / 2 - 100, 900], [W / 2 - 230, 1150]], MUST, { seed: 160 }); type('ЭЛИКСИР', W / 2, 1240, 110, INK, { align: 'center', gapCol: MUST, shadow: false });
        type('ДЛЯ БЕЛЫХ ЗУБОВ', W / 2, 600, fitSize('ДЛЯ БЕЛЫХ ЗУБОВ', 120, 960), RED, { align: 'center', land: clamp(since(s, 'мочой', t) / .3) }); }],
      ['четыре', () => { hero(320, 1700, 1.05, 'panic', { scarf: MUST, gapCol: RED }); }],
    ]);
  },
  plague(t, s) {
    ground(INK); type('1348', W / 2, 520, 330, CREAM, { align: 'center', gapCol: INK });
    for (let i = 0; i < 6; i++) { const x = (rnd(i, 3) * W + tw(t) * 120 * (i % 2 ? 1 : -1)) % W, y = 1500 + i * 50; piece(ell(x, y, 70, 30, 14), '#8a8270', { seed: 170 + i, shadow: false }); piece(capsule(x + 60, y, x + 160, y - 20, 8), '#8a8270', { seed: 180 + i, shadow: false }); }
    return pick(s, t, [
      [null, () => hero(W / 2 + Math.sin(tw(t) * 40) * 6, 1650, 1.1, Math.floor(tw(t) * 4) % 2 ? 'scratch' : 'cough', { scarf: RED, gapCol: INK })],
      ['блоха', () => { ground(INK); piece(ell(W / 2, 1050, 420, 420, 60), CREAM, { seed: 190 }); piece(ell(W / 2, 1050, 190, 140, 30), INK, { seed: 191 }); piece(ell(W / 2 + 190, 1010, 70, 60, 20), INK, { seed: 192 });
        for (let k = 0; k < 6; k++) { const x = W / 2 - 120 + k * 50; piece(capsule(x, 1150, x - 40 + (k % 2) * 20, 1330, 16), INK, { seed: 193 + k, shadow: false }); } type('ОДНА БЛОХА', W / 2, 420, 170, RED, { align: 'center', gapCol: INK, land: clamp(since(s, 'блоха', t) / .3) }); }],
      ['думаешь', () => { ground(RED); type('ХУЖЕ', W / 2, 860, 330, INK, { align: 'center', gapCol: RED }); type('ЧУМЫ?', W / 2, 1200, 330, CREAM, { align: 'center', gapCol: RED }); }],
    ]);
  },
  ship(t, s) {
    ground(COBALT);
    for (let i = 0; i < 5; i++) piece([[-50, 1500 + i * 90], ...Array.from({ length: 8 }, (_, k) => [-50 + k * 170, 1480 + i * 90 + Math.sin(tw(t) * 3 + k + i) * 18]), [1130, 1500 + i * 90], [1130, 1600 + i * 90], [-50, 1600 + i * 90]], i % 2 ? '#1f3590' : '#3a58d0', { seed: 200 + i, shadow: false });
    const rock = Math.sin(tw(t) * 2) * .04;
    const drawShip = () => { const sh = [[140, 1380], [940, 1380], [860, 1520], [220, 1520]]; piece(rot(sh, 540, 1450, rock), INK, { seed: 210 }); piece(rot(rect(530, 520, 22, 880), 540, 1450, rock), INK, { seed: 211 });
      piece(rot([[555, 560], [900, 640], [880, 1100], [555, 1080]], 540, 1450, rock), PINK, { seed: 212 }); piece(rot([[525, 600], [200, 680], [220, 1120], [525, 1100]], 540, 1450, rock), PINK, { seed: 213 });
      type('МАГЕЛЛАН', 720, 900, 90, COBALT, { align: 'center', gapCol: PINK, shadow: false, rot: rock }); };
    return pick(s, t, [
      [null, () => { drawShip(); hero(700, 1390, .55, 'stand', { scarf: LEMON, gapCol: COBALT }); }],
      ['зубы', () => { ground(PINK); const h = hero(560, 2500, 3.6, 'stand', { scarf: LEMON, eye: true, gapCol: PINK }); for (let i = 0; i < 4; i++) { const ph = (tw(t) * .8 + i * .25) % 1; piece(rot(rect(430 + i * 70, 960 + ph * 560, 60, 84), 460 + i * 70, 1002 + ph * 560, ph * 4 * (i % 2 ? 1 : -1)), CREAM, { seed: 220 + i }); }
        type('ЦИНГА', W / 2, 480, 260, COBALT, { align: 'center', gapCol: PINK }); }],
      ['крыс', () => { ground(LEMON); piece(ell(W / 2, 1150, 400, 130, 40), CREAM, { seed: 230 }); piece(ell(W / 2 - 40, 1100, 160, 70, 20), '#6a6458', { seed: 231 }); piece(capsule(W / 2 + 110, 1100, W / 2 + 300, 1040, 14), '#6a6458', { seed: 232 }); piece(rot(rect(W / 2 + 60, 1150, 220, 60), W / 2 + 170, 1180, .3), '#8a5a2a', { seed: 233 });
        type('МЕНЮ', W / 2, 640, 240, INK, { align: 'center', gapCol: LEMON }); }],
      ['месяц', () => { drawShip(); }],
    ]);
  },
  london(t, s) {
    ground(PINK); ['Л', 'О', 'Н', 'Д', 'О', 'Н'].forEach((ch, i) => { const x = 110 + i * 172, h = 700 + (i % 3) * 140; piece(rect(x - 60, 1500 - h, 120, h), COBALT, { seed: 240 + i }); type(ch, x, 1500 - h + 130, 120, PINK, { align: 'center', gapCol: COBALT, shadow: false });
      for (let k = 0; k < 3; k++) { const ph = (tw(t) * .4 + k / 3 + i * .1) % 1; g.save(); g.globalAlpha = .7 * (1 - ph); piece(ell(x + ph * 120, 1500 - h - 60 - ph * 300, 50 + ph * 80, 36 + ph * 50, 18), '#8a8a9a', { seed: 250 + i * 3 + k, shadow: false, gap: false }); g.restore(); } });
    piece(rect(0, 1500, W, 420), '#2a2a3a', { seed: 260 });
    return pick(s, t, [
      [null, () => hero(W / 2, 1800, 1, 'cough', { scarf: LEMON, gapCol: '#2a2a3a' })],
      ['мышьяком', () => { ground('#3a8a5a'); for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) piece(ell(110 + x * 220 + (y % 2) * 110, 140 + y * 240, 60, 80, 16), '#5ab47a', { seed: 270 + x + y * 5, shadow: false });
        piece(rect(140, 760, 800, 420), PINK, { seed: 290 }); type('МЫШЬЯК', W / 2, 1040, 200, INK, { align: 'center', gapCol: PINK, shadow: false }); type('ЗЕЛЁНЫЕ ОБОИ', W / 2, 600, fitSize('ЗЕЛЁНЫЕ ОБОИ', 140, 960), PINK, { align: 'center', gapCol: '#3a8a5a' }); }],
      ['морфием', () => { ground(PINK); piece([[W / 2 - 150, 1500], [W / 2 + 150, 1500], [W / 2 + 150, 950], [W / 2 + 60, 850], [W / 2 + 60, 700], [W / 2 - 60, 700], [W / 2 - 60, 850], [W / 2 - 150, 950]], COBALT, { seed: 300 }); piece(rect(W / 2 - 120, 1050, 240, 260), PINK, { seed: 301 });
        type('СИРОП', W / 2, 1160, 90, INK, { align: 'center', gapCol: PINK, shadow: false }); type('ДЛЯ ДЕТЕЙ', W / 2, 1270, 60, RED, { align: 'center', gapCol: PINK, shadow: false }); type('МОРФИЙ', W / 2, 560, 220, RED, { align: 'center', land: clamp(since(s, 'морфием', t) / .3) }); }],
      ['три', () => { hero(W / 2, 1800, 1, 'cough', { scarf: LEMON, gapCol: '#2a2a3a' }); }],
    ]);
  },
  trench(t, s) {
    const gas = wt(s, 'газ'), k = gas != null ? ss(gas, gas + 1.2, t) : 0;
    return pick(s, t, [
      [null, () => { ground(INK); type('ВОЗДУХ', W / 2, 820, 260, CREAM, { align: 'center', gapCol: INK }); type('= ЯД', W / 2, 1120, 300, LEMON, { align: 'center', gapCol: INK, land: clamp(since(s, 'ядом', t) / .3) }); }],
      ['верден', () => { ground(OLIVE); piece([[0, 1250], [200, 1180], [380, 1300], [560, 1200], [760, 1320], [1080, 1220], [1080, 1920], [0, 1920]], '#3a3926', { seed: 310 });
        for (let i = 0; i < 9; i++) piece(rot(rect(60 + i * 115, 1150, 8, 120), 64 + i * 115, 1210, (i % 2 ? .4 : -.4)), INK, { seed: 320 + i, shadow: false });
        if (k > 0) for (let i = 0; i < 9; i++) { const x = -300 + i * 200 + k * 500, y = 900 + (i % 3) * 120; g.save(); g.globalAlpha = .9 * k; piece(ell(x, y, 220, 120, 24), LEMON, { seed: 330 + i, shadow: false }); g.restore(); }
        hero(560, 1500, 1.1, k > .2 ? 'mask' : 'stand', { scarf: RED, gapCol: OLIVE }); type('1916', W / 2, 480, 260, CREAM, { align: 'center', gapCol: OLIVE }); }],
      ['дышишь', () => { ground(LEMON); const h = hero(560, 2450, 3.4, 'mask', { scarf: RED, gapCol: LEMON, eye: true }); piece(rot(rect(330, 820, 400, 200), 530, 920, .05), CREAM, { seed: 340 }); type('ТРЯПКА', W / 2, 470, 220, INK, { align: 'center', gapCol: LEMON }); }],
      ['четыре', () => { ground(OLIVE); hero(560, 1500, 1.1, 'mask', { scarf: RED, gapCol: OLIVE }); }],
    ]);
  },
  now(t, s) {
    ground(CREAM);
    for (let i = 0; i < 5; i++) piece(rect(40 + i * 210, 500 + (i % 3) * 120, 180, 1000), i % 2 ? '#d8cdb0' : '#e2d8c0', { seed: 350 + i, shadow: false });
    piece(rect(0, 1500, W, 420), '#cfc4a8', { seed: 360 });
    const off = wt(s, 'гаснет');
    return pick(s, t, [
      [null, () => { const ax = 700; piece(rect(ax - 260, 1220, 520, 260), CREAM, { seed: 370 }); piece(rect(ax - 260, 1220, 520, 260).map(([x, y]) => [x, y]), CREAM, { seed: 371 }); piece(rect(ax + 120, 1250, 120, 120), '#9ad0e0', { seed: 372 }); piece(rect(ax - 70, 1280, 140, 40), RED, { seed: 373 }); piece(rect(ax - 20, 1230, 40, 140), RED, { seed: 374 });
        piece(ell(ax - 160, 1490, 50, 50, 14), INK, { seed: 375 }); piece(ell(ax + 160, 1490, 50, 50, 14), INK, { seed: 376 }); hero(250, 1500, 1, 'stand', { scarf: RED }); }],
      ['антибиотик', () => { ground(TEAL); piece(rot(capsule(380, 960, 700, 960, 200), 540, 960, -.4), CREAM, { seed: 380 }); piece(rot(capsule(540, 960, 700, 960, 200), 540, 960, -.4), RED, { seed: 381 }); type('АНТИБИОТИК', W / 2, 1480, fitSize('АНТИБИОТИК', 170, 960), CREAM, { align: 'center', gapCol: TEAL }); }],
      ['стакан', () => { ground(CREAM); piece([[W / 2 - 220, 600], [W / 2 + 220, 600], [W / 2 + 170, 1500], [W / 2 - 170, 1500]], '#d8eef2', { seed: 390 }); piece([[W / 2 - 200, 820], [W / 2 + 200, 820], [W / 2 + 170, 1500], [W / 2 - 170, 1500]], '#6ec4d8', { seed: 391 }); type('ЧИСТАЯ ВОДА', W / 2, 460, fitSize('ЧИСТАЯ ВОДА', 150, 960), TEAL, { align: 'center' }); }],
      ['гаснет', () => { ground(INK); piece(capsule(-100, 1500, 640, 980, 300), CREAM, { seed: 50 }); const k = off != null ? ss(off, off + .8, t) : 0; piece(rot(rect(470, 830, 260, 200), 600, 930, -.62), k > .5 ? '#6a6458' : MUST, { seed: 51 }); type('ОТКЛЮЧЁН', W / 2, 520, 200, k > .5 ? '#8a8270' : MUST, { align: 'center', gapCol: INK }); }],
    ]);
  },
  armor(t, s) {
    ground(INK); const kn = wt(s, 'знания'), lit = kn != null ? ss(kn, kn + 1.5, t) : 0;
    piece(ell(W / 2, 1020, 470, 470, 64), MUST, { seed: 400 });
    for (let r = 0; r < 3; r++) { const n = 18 + r * 8, R = 560 + r * 110; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r * .2; if (i / n > lit * 1.05 && lit < 1) continue; const x = W / 2 + Math.cos(a) * R, y = 1020 + Math.sin(a) * R; hero(x, y + 40, .22, 'stand', { col: CREAM, scarf: CREAM, bracelet: false, gapCol: INK }); } }
    hero(W / 2, 1310, 1.25, 'stand', { scarf: RED, bracelet: true, braceletOff: true, gapCol: MUST });
    type('100 000 ЛЕТ', W / 2, 420, fitSize('100 000 ЛЕТ', 200, 980), CREAM, { align: 'center', gapCol: INK, land: clamp(since(s, 'сто', t) / .3) });
  },
  question(t, s) {
    ground(RED); const l = clamp((t - s.t0) / .6);
    type('ГДЕ', W / 2, 640, 300, INK, { align: 'center', land: l, gapCol: RED }); type('ПРОДЕРЖАЛСЯ', W / 2, 900, fitSize('ПРОДЕРЖАЛСЯ', 240, 1000), CREAM, { align: 'center', land: clamp(l * 1.2 - .2), gapCol: RED }); type('БЫ ТЫ?', W / 2, 1180, 300, INK, { align: 'center', land: clamp(l * 1.4 - .4), gapCol: RED });
    hero(W / 2, 1720, .9, Math.floor(tw(t) * 3) % 2 ? 'shrug' : 'stand', { scarf: MUST, gapCol: RED });
  },
};
function segAt(t) { let lo = 0, hi = SEG.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SEG[m].t0 <= t) lo = m; else hi = m - 1; } return SEG[lo]; }
function draw(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); const s = segAt(t); (SC[s.scene] || SC.question)(t, s);
  const nx = SEG[s.i + 1];                                             // teleport: the picture shatters into strips before each jump
  if (nx && EPOCHS.includes(nx.scene) && s.scene !== 'click' && t > nx.t0 - .3) shatter((t - (nx.t0 - .3)) / .3, MUST);
  for (const S of ST) if (t >= S.t0 && t < S.t1) drawStamp(S, t);
  paper(.45);
  if (t > CU.total - .6) { g.fillStyle = `rgba(0,0,0,${(t - (CU.total - .6)) / .6})`; g.fillRect(0, 0, W, H); }
}

// survival stamp: a cream paper slab with a red number, rides on top of the teleport shatter and leaves upward
function drawStamp(S, t) {
  const k = clamp((t - S.t0) / .25), out = ss(S.t1 - .3, S.t1, t), y = 1150 - out * 1500, a = -.05;
  const fs = fitSize(S.txt, 230, 860);
  g.save(); g.translate(W / 2, y); g.rotate(a); g.scale(1.6 - .6 * Math.min(1, k * 1.2), 1.6 - .6 * Math.min(1, k * 1.2)); g.globalAlpha = Math.min(1, k * 3);
  piece(rect(-470, -200, 940, 330), CREAM, { seed: 500 });
  type('ВЫЖИЛ:', -420, -130, 60, INK, { align: 'left', shadow: false, gapCol: CREAM });
  type(S.sub, 420, -130, 60, TEAL, { align: 'right', shadow: false, gapCol: CREAM });
  type(S.txt, 0, 100, fs, RED, { align: 'center', shadow: false, gapCol: CREAM });
  g.restore();
}
