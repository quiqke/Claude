// engine3d.js — first-person realistic 3D for «Метеостанция «Кречет»» (three.js, renders in headless Chromium).
// Procedural textures, a flashlight with shadows, wind-blown snow, fog, handheld camera, fake bloom sprites, film post (grain, vignette).
import * as THREE from './vendor/three.module.js';
export { THREE };
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const rnd = hash;
function vn(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export const fbm = (x, y, s = 0, o = 5) => { let v = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { v += a * vn(x * f, y * f, s + i * 17); f *= 2; a *= .5; } return v; };

// ── procedural textures (canvas → CanvasTexture)
function tex(w, h, paint, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); paint(g, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function pix(g, w, h, f) { const im = g.createImageData(w, h), d = im.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, gg, b] = f(x, y), i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; } g.putImageData(im, 0, 0); }
export const TEX = {};
export function makeTextures() {
  TEX.snow = tex(256, 256, (g, w, h) => pix(g, w, h, (x, y) => { const n = fbm(x / 32, y / 32, 1) * .6 + fbm(x / 6, y / 6, 2, 3) * .4, v = 205 + n * 50; return [v - 6, v, v + 10]; }), [40, 40]);
  TEX.snowBump = tex(256, 256, (g, w, h) => pix(g, w, h, (x, y) => { const v = fbm(x / 20, y / 20, 3) * 255; return [v, v, v]; }), [40, 40]);
  TEX.wood = tex(512, 512, (g, w, h) => { pix(g, w, h, (x, y) => { const board = Math.floor(x / 64), seam = x % 64 < 3, grain = Math.sin(y * .05 + fbm(x / 8, y / 90, board) * 12) * .5 + .5, age = fbm(x / 40, y / 40, 9);
    const base = 62 + board % 3 * 8 + grain * 22 - age * 20; return seam ? [22, 18, 16] : [base * .92, base * .82, base * .72]; }); }, [2, 1]);
  TEX.woodIn = tex(512, 512, (g, w, h) => pix(g, w, h, (x, y) => { const board = Math.floor(y / 48), seam = y % 48 < 2, grain = Math.sin(x * .04 + fbm(x / 90, y / 6, board) * 10) * .5 + .5;
    const base = 120 + (board % 4) * 10 + grain * 30; return seam ? [40, 26, 18] : [base, base * .72, base * .48]; }), [3, 2]);
  TEX.floor = tex(512, 512, (g, w, h) => pix(g, w, h, (x, y) => { const b = Math.floor(x / 80), seam = x % 80 < 3, grain = Math.sin(y * .03 + fbm(x / 6, y / 120, b) * 9) * .5 + .5, wear = fbm(x / 60, y / 60, 4);
    const v = 80 + grain * 26 + (b % 2) * 8 - wear * 25; return seam ? [30, 20, 14] : [v * 1.05, v * .78, v * .55]; }), [3, 3]);
  TEX.metal = tex(256, 256, (g, w, h) => pix(g, w, h, (x, y) => { const r = fbm(x / 18, y / 18, 7), v = 40 + r * 30, rust = fbm(x / 30, y / 30, 8) > .62; return rust ? [v * 1.8, v * .9, v * .5] : [v, v * 1.02, v * 1.08]; }), [1, 1]);
  TEX.paper = tex(512, 256, (g, w, h) => { g.fillStyle = '#e8dfc6'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,90,140,.35)'; for (let y = 24; y < h; y += 18) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); }
    g.strokeStyle = 'rgba(30,30,60,.85)'; g.lineWidth = 1.6; for (let k = 0; k < 12; k++) { const y = 20 + k * 18; g.beginPath(); for (let x = 20; x < 220 + (k * 37) % 230; x += 3) g.lineTo(x, y + Math.sin(x * .7 + k) * 2.5 + (hash(x, k) - .5) * 2); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(w / 2 - 1, 0, 2, h); });
  TEX.frost = tex(256, 256, (g, w, h) => { const im = g.createImageData(w, h), d = im.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = Math.min(x, y, w - x, h - y) / 128, n = fbm(x / 10, y / 10, 5), a = Math.max(0, 1 - e * 1.6 + n * .6 - .2); const i = (y * w + x) * 4; d[i] = 220; d[i + 1] = 235; d[i + 2] = 255; d[i + 3] = Math.min(255, a * 255); } g.putImageData(im, 0, 0); });
  TEX.flake = tex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  TEX.glow = tex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  TEX.smoke = tex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(200,200,210,.35)'); gr.addColorStop(1, 'rgba(200,200,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
}
export const M = (o) => new THREE.MeshStandardMaterial(o);
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent && parent.add(m); return m; }
export function cyl(r0, r1, h, mat, x = 0, y = 0, z = 0, parent, seg = 16) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent && parent.add(m); return m; }
export function glowSprite(color, size, x, y, z, parent, op = .8) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.set(size, size, 1); s.position.set(x, y, z); parent && parent.add(s); return s; }

// a human figure (silhouette-grade): capsules; mat dark for the thing, orange for rescuers
export function human(mat, o = {}) {
  const g = new THREE.Group(), skin = o.skin || mat;
  const cap = (r, l, x, y, z, m = mat, rx = 0, rz = 0) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), m); c.position.set(x, y, z); c.rotation.set(rx, 0, rz); c.castShadow = true; g.add(c); return c; };
  cap(.2, .55, 0, 1.25, 0); cap(.085, .7, -.1, .45, 0); cap(.085, .7, .1, .45, 0);
  cap(.065, .55, -.27, 1.2, 0, mat, 0, .08); cap(.065, .55, .27, 1.2, 0, mat, 0, -.08);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 18, 14), skin); head.scale.set(1, 1.15, 1); head.position.set(0, 1.74, 0); head.castShadow = true; g.add(head);
  if (o.hood) { const h = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 12, 0, Math.PI * 2, 0, Math.PI * .62), mat); h.position.set(0, 1.76, -.02); g.add(h); }
  return g;
}
// a husky: soft ellipsoid body, head with snout and pointed ears, curled tail; pose 'lie' | 'sit' | 'stand'
export function dog(mat, pose = 'lie') {
  const g = new THREE.Group(), belly = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 1 }), dark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .4 });
  const ell = (rx, ry, rz, x, y, z, m = mat, rot = [0, 0, 0]) => { const e = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), m); e.scale.set(rx, ry, rz); e.position.set(x, y, z); e.rotation.set(...rot); e.castShadow = e.receiveShadow = true; g.add(e); return e; };
  const lie = pose === 'lie', sit = pose === 'sit';
  ell(.42, lie ? .2 : .22, .22, 0, lie ? .2 : .42, 0); ell(.3, .14, .18, .05, lie ? .14 : .32, 0, belly);
  ell(.2, .2, .2, .38, lie ? .3 : .55, 0);                                            // chest
  const hy = lie ? .38 : sit ? .78 : .7, hx = lie ? .62 : .5;
  ell(.14, .13, .12, hx, hy, 0); ell(.11, .07, .07, hx + .14, hy - .04, 0, belly);     // head, muzzle
  ell(.025, .025, .025, hx + .25, hy - .03, 0, dark);                                    // nose
  for (const z of [-.06, .06]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.045, .12, 4), mat); e.position.set(hx - .02, hy + .14, z); e.rotation.z = -.15; e.castShadow = true; g.add(e);
    ell(.018, .018, .018, hx + .1, hy + .03, z * 1.1, dark); }
  if (!lie) for (const [x, z] of [[.35, -.1], [.35, .1], [-.3, -.1], [-.3, .1]]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.05, sit && x < 0 ? .1 : .3, 4, 8), mat); l.position.set(x, sit && x < 0 ? .12 : .2, z); l.castShadow = true; g.add(l); }
  else for (const z of [-.08, .08]) ell(.18, .05, .05, .62, .06, z, mat);              // front paws forward
  ell(.2, .07, .07, -.45, lie ? .28 : .55, .05, mat, [0, 0, .9]);                        // curled tail
  return g;
}
// wind-blown snow around the camera, positions are a pure function of t (frames render out of order)
export function snowfall(n = 5000, box = 30) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n * 3); for (let i = 0; i < n; i++) { seed[i * 3] = hash(i, 1); seed[i * 3 + 1] = hash(i, 2); seed[i * 3 + 2] = hash(i, 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TEX.flake, size: .09, transparent: true, depthWrite: false, opacity: .9, color: 0xeef4ff, sizeAttenuation: true }));
  pts.frustumCulled = false;
  pts.userData.update = (t, cam, wind = 1) => {
    const B = box, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (let i = 0; i < n; i++) { const sx = seed[i * 3], sy = seed[i * 3 + 1], sz = seed[i * 3 + 2], sp = .6 + sx * .8;
      const x = ((sx * B + t * 9 * wind * sp + Math.sin(t * 2 + i) * .3) % B + B) % B - B / 2, y = ((sy * B - t * 2.2 * sp) % B + B) % B - B / 2, z = ((sz * B + t * 2 * wind * sp) % B + B) % B - B / 2;
      pos[i * 3] = cx + x; pos[i * 3 + 1] = cy + y * .4; pos[i * 3 + 2] = cz + z; }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}
// handheld camera: small rotational noise + walking bob
export function handheld(cam, t, amp = 1, walk = 0) {
  const n = (k) => (fbm(t * .35 + k * 10, k, 77, 3) - .5);
  cam.rotation.x += n(1) * .035 * amp; cam.rotation.y += n(2) * .045 * amp; cam.rotation.z += n(3) * .02 * amp;
  if (walk) { cam.position.y += Math.abs(Math.sin(t * 5.2)) * .045 * walk; cam.rotation.z += Math.sin(t * 5.2) * .008 * walk; }
}
// film post on a 2D canvas: grain, vignette, cold grade, optional red pulse, letterbox
export function makePost(cv) {
  const g = cv.getContext('2d'), N = document.createElement('canvas'); N.width = N.height = 256; const ng = N.getContext('2d'), im = ng.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = hash(i, 5) * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } ng.putImageData(im, 0, 0);
  return (t, o = {}) => {
    g.clearRect(0, 0, cv.width, cv.height);
    const vg = g.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * .35, cv.width / 2, cv.height / 2, cv.height * 1.0); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,6,${o.vig ?? .72})`); g.fillStyle = vg; g.fillRect(0, 0, cv.width, cv.height);
    g.save(); g.globalAlpha = o.grain ?? .07; g.globalCompositeOperation = 'overlay'; const ox = Math.floor(hash(Math.floor(t * 24), 1) * 256), oy = Math.floor(hash(Math.floor(t * 24), 2) * 256);
    for (let y = -oy; y < cv.height; y += 256) for (let x = -ox; x < cv.width; x += 256) g.drawImage(N, x, y); g.restore();
    if (o.red) { const a = o.red, rg = g.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * .4, cv.width / 2, cv.height / 2, cv.height); rg.addColorStop(0, 'rgba(255,0,0,0)'); rg.addColorStop(1, `rgba(170,0,0,${a})`); g.fillStyle = rg; g.fillRect(0, 0, cv.width, cv.height); }
    if (o.fade) { g.fillStyle = `rgba(0,0,0,${o.fade})`; g.fillRect(0, 0, cv.width, cv.height); }
    if (o.flash) { g.fillStyle = `rgba(255,255,255,${o.flash})`; g.fillRect(0, 0, cv.width, cv.height); }
  };
}
