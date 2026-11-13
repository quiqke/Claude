// style layer: draw the picture for time t; cues.lines[id] = {t0, t1, kind, tags:{scene…}, words:[{w,t0,t1}]}
export async function init(cv, cues) {
  const g = cv.getContext('2d'), L = Object.entries(cues.lines);
  return { draw(t) { g.fillStyle = '#111'; g.fillRect(0, 0, cv.width, cv.height); const cur = L.find(([, l]) => t >= l.t0 && t < l.t1); g.fillStyle = '#444'; g.font = '40px monospace'; g.fillText(cur ? cur[1].tags.scene || cur[0] : '', 60, 100); } };
}
