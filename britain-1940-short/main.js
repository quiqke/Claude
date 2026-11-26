// Entry: load fonts, build the film (film.js registers every beat on core.js), render the requested time.
for (const f of ['900 46px Nunito', '400 60px "Russo One"', 'italic 900 40px Nunito']) await document.fonts.load(f, 'АБВабв0123456789.,?!—«»ABCabc✓≈');
await document.fonts.ready;
await import('./film.js');
window.render(+(new URLSearchParams(location.search).get('t') || 0)); window.READY = true;
