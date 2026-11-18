// Style frame for «А что если — круглоголовые»: ?look=base renders the same frame in the base Sci-Fi Sitcom Toon look.
import { clamp, lerp, back, seg } from '/core/lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, scale, shape, rr, text, screenRect, reset } from './toon.js';
import { rTim, rZin, cherryLab, RP } from './round.js';
import { tim, zin } from './base-chars.js';
import * as BW from './base-worlds.js';
const canvas = document.getElementById('c'), Q = new URLSearchParams(location.search), BASE = Q.get('look') === 'base';
init(canvas);
const back_ = Object.assign(document.createElement('canvas'), { width: W, height: H });
function cam(cx, cy, z) { reset(); translate(W / 2, H / 2); scale(z); translate(-cx, -cy); }
const SUB = 'Земля встаёт. А ты — нет.';
function render(t) {
  if (BASE) {
    frame(t); screenRect('#000'); cam(560, 960, 1.05); BW.lab(t);
    zin({ x: 770, y: 1350, face: -1, t, lid: .62, look: [.6, 0], holdR: 'tea', armR: { h: [30, 90], bend: 20 }, mouth: { o: 0, sm: .2 } });
    tim({ x: 350, y: 1350, face: 1, t, nerv: 1, eyeS: 1.3, pupil: 3, look: [.5, -.1], mouth: { o: .7, sm: -.8 }, brow: 1 });
    reset(); text(SUB, 540, 1500, { font: '900 54px Nunito', fill: '#ffffff', outlineW: 12 });
    return;
  }
  // back layer: the set, drawn sharp into its own canvas, then laid in blurred (depth); characters stay sharp
  const bg = back_.getContext('2d'); init(back_); frame(t); cam(560, 960, 1.05); cherryLab(t);
  init(canvas); frame(t); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(14px)'; g.drawImage(back_, -40, -40, W + 80, H + 80); g.filter = 'none';
  g.fillStyle = 'rgba(20,10,30,.18)'; g.fillRect(0, 0, W, H);
  cam(560, 960, 1.05);
  rZin({ x: 780, y: 1350, face: -1, t, mood: 'smug', look: [.6, 0], cup: true, armR: { h: [40, 96], bend: 14 } });
  rTim({ x: 330, y: 1350, face: 1, t, mood: 'panic', nerv: 1, look: [.5, 0], o: .6 });
  // subtitles: white on a dark translucent plate
  reset(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = '900 54px Nunito'; const w = g.measureText(SUB).width;
  g.fillStyle = 'rgba(15,10,20,.72)'; g.beginPath(); g.roundRect(540 - w / 2 - 28, 1500 - 46, w + 56, 92, 18); g.fill();
  text(SUB, 540, 1502, { font: '900 54px Nunito', fill: '#ffffff' });
}
window.DUR = 1; window.render = render; window.EV = [];
await document.fonts.load('900 54px Nunito', 'АБВабв'); await document.fonts.ready;
render(0); window.READY = true;
