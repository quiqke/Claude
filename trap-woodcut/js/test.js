import * as WC from './engine/index.js';
import { begin, end, print, caption, m, c } from './stage.js';
import { figure } from './figures.js';
export const DUR = 1;
let F;
export async function init() {
  F = [figure('t1', { x: 230, y: 700, s: .8, kind: 'hunter', prop: 'spear', pose: { arms: [[.3, .2], [.9, 2.3]], lean: .05 } }),
       figure('t2', { x: 620, y: 700, s: .8, kind: 'hunter', pose: { sit: true, arms: [[.9, 2.2], [1.1, 2.0]], lean: .3, head: .2 } }),
       figure('t3', { x: 250, y: 1350, s: .8, kind: 'worker', pose: { sit: true, lean: .55, head: .35, arms: [[1.1, 1.6], [1.3, 1.7]] } }),
       figure('t4', { x: 650, y: 1350, s: .8, kind: 'farmer', prop: 'hoe', pose: { lean: 1.05, head: .3, arms: [[.9, .6], [1.1, .8]], legs: [[.35, .1], [-.25, -.05]] } })];
}
export function render(g, t) {
  begin({});
  WC.fillPoly(m, [WC.rect(0, 0, 1000, 1520)], '#fff');
  m.fillStyle = '#000'; m.fillRect(60, 720, 880, 6); m.fillRect(60, 1370, 880, 6);
  for (const f of F) f.draw(m, 1e9);
  end(); caption('Проверка фигур: охотник, сидящий, работник, фермер', 1);
  print(g, { seed: 3, plate: '#c8642a' });
}
