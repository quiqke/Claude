import { build, SW, SH } from './film.js';
await document.fonts.load('600 66px CV');
const F = await build();
const cv = document.getElementById('c'); cv.width = SW; cv.height = SH;
const ctx = cv.getContext('2d');
window.DUR = F.dur; window.EV = [...F.ev, { t: 0, type: 'cues', ...F.cues }]; window.SUBS = F.subs;
window.render = t => F.render(ctx, t);
window.READY = true;
