const qs = new URLSearchParams(location.search);
const cv = document.getElementById('cv'), g = cv.getContext('2d');
await document.fonts.load('400 50px "Old Standard"'); await document.fonts.load('700 50px "Old Standard"');
const m = await import(qs.get('test') ? './test.js' : './film.js');
await m.init(g, qs);
window.DUR = m.DUR; window.EV = m.EV || []; window.render = t => m.render(g, t); window.READY = true;
