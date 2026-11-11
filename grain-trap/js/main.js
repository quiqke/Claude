import { build, SW, SH } from './film.js';
await document.fonts.load('600 66px CV');
const F = await build();
const cv = document.getElementById('c'); cv.width = SW; cv.height = SH;
const ctx = cv.getContext('2d');
window.DUR = F.dur; window.EV = [...F.ev, ...F.subs.map(s => ({ t: +s.t0.toFixed(3), type: 'sub', t1: +s.t1.toFixed(3), text: s.text })), { t: 0, type: 'cues', ...F.cues }]; window.SUBS = F.subs;
window.render = t => F.render(ctx, t);
window.READY = true;
