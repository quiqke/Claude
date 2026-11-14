// retention.js — editing rhythm for every style page (copy next to film.js and use from the scene list).
// makeCuts: a new framing every 3–5 s, preferably where a caption phrase starts (cues.pages), never inside chapter cards.
// shotFraming: turns one base camera into 4 alternating framings (base / close on the hero's face / offset medium / wider)
//              with a slow push-in and a 0.12 s whip at each cut. bigWords: the red «опасность» words to pop on screen.
export function makeCuts(cues, segs, o = {}) {
  const min = o.min ?? 3, max = o.max ?? 5.2, step = o.step ?? 4, skip = o.skip ?? (s => s.scene === 'title');
  const pages = cues.pages.map(p => p.t0).sort((a, b) => a - b), cuts = [];
  for (const sg of segs) { if (skip(sg)) continue; let last = sg.t0;
    for (const c of pages.filter(x => x > sg.t0 + 1 && x < sg.t1 - 1)) { while (c - last > max) { last += step; cuts.push(last); } if (c - last >= min) { cuts.push(c); last = c; } }
    while (sg.t1 - last > max + .3) { last += step; cuts.push(last); } }
  return cuts.sort((a, b) => a - b);
}
export function shotAt(cuts, segT0, t) { let k = 0, st = segT0; for (const c of cuts) { if (c <= segT0) continue; if (c > t) break; k++; st = c; } return { k, st }; }
// returns [x, y, z, whipX] for the camera
export function shotFraming(cuts, segT0, t, x, y, z, focus = null) {
  const { k, st } = shotAt(cuts, segT0, t), v = k % 4, p = Math.min(1, Math.max(0, (t - st) / 5));
  if (v === 1) { if (focus) { x = focus[0]; y = focus[1]; z = Math.max(z * 1.9, 2.2); } else { y -= 60; z *= 1.45; } }
  else if (v === 2) { x += 170; y += 30; z *= 1.22; } else if (v === 3) { x -= 150; y -= 20; z *= .92; }
  z = Math.min(3.2, z) * (1 + .05 * p); x += (k % 2 ? 30 : -30) * p;
  const wp = t - st, whip = k > 0 && wp < .12 ? (k % 2 ? 1 : -1) * 240 * (1 - wp / .12) : 0;
  return [x, y, z, whip];
}
export function bigWords(cues) {
  const out = []; for (const pg of cues.pages) { let pc = null; for (const w of pg.words) { if (w.c === 'danger' && pc !== 'danger') out.push({ t: w.t0, w: w.w.replace(/[«»"“”.,:;!?—…]/g, '').toUpperCase() }); pc = w.c; } } return out;
}
export function drawBigWord(g, b, t, o = {}) {
  if (t < b.t || t >= b.t + .7) return; const p = (t - b.t) / .7, sc = p < .15 ? .6 + p / .15 * .5 : 1.1 - .1 * p;
  g.save(); g.globalAlpha = p > .75 ? (1 - p) / .25 : 1; g.translate(o.x ?? 960, o.y ?? 470); g.rotate(-.06); g.scale(sc, sc);
  g.font = `900 ${o.size ?? 190}px Rubik`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = 34; g.strokeStyle = o.ink ?? '#231629'; g.strokeText(b.w, 0, 0); g.lineWidth = 12; g.strokeStyle = '#fff'; g.strokeText(b.w, 0, 0); g.fillStyle = o.fill ?? '#ff3a2a'; g.fillText(b.w, 0, 0); g.restore();
}
