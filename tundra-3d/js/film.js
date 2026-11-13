// film.js — style test: a few first-person shots, switched by t (the real shot list comes when the voice arrives)
import { THREE, makeTextures, handheld, makePost } from './engine3d.js';
import { exterior, interior } from './sets3d.js';
let R, cam, EXT, INT, post;
export async function init(cv, cues) {
  R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(cv.width, cv.height, false);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.15; R.outputColorSpace = THREE.SRGBColorSpace;
  makeTextures(); EXT = exterior(); INT = interior();
  cam = new THREE.PerspectiveCamera(62, cv.width / cv.height, .05, 300);
  // flashlight in the hand (a spot that follows the camera)
  const fl = new THREE.SpotLight(0xfff2dc, 0, 38, .42, .55, 1.4); fl.castShadow = true; fl.shadow.mapSize.set(1024, 1024); fl.shadow.camera.near = .2; cam.add(fl); fl.position.set(.25, -.2, 0); cam.add(fl.target); fl.target.position.set(0, -.3, -5); cam.userData.fl = fl;
  const pc = document.createElement('canvas'); pc.width = cv.width; pc.height = cv.height; pc.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none'; cv.parentNode.insertBefore(pc, cv.nextSibling); post = makePost(pc);
  return { draw, EV: [] };
}
function shot(set, t, pos, look, o = {}, so = {}) {
  set.scene.add(cam); cam.position.set(...pos); cam.lookAt(...look); handheld(cam, t, o.amp ?? 1, o.walk || 0);
  cam.userData.fl.intensity = o.torch ?? 0; set.update(t, cam, so); R.render(set.scene, cam);
}
function draw(t) {
  const k = t % 20;
  if (k < 5) shot(EXT, t, [1.4, 1.65, -6 - k * .8], [1.6, 1.2, -30], { torch: 60, walk: 1 }, { wind: 1.2 });                                    // walking along the rope
  else if (k < 10) shot(EXT, t, [1.5, 1.65, -36], [2.3, 1.3, -45], { torch: 60, amp: .6 }, { figure: { pos: [3.4, 0, -44.2], ry: 0 } });         // the figure at the box
  else if (k < 15) shot(EXT, t, [-6, 1.7, -14], [0, 1.8, 0], { torch: 0, amp: .5 }, { wind: .8 });                                              // the station from outside
  else shot(INT, t, [.2, 1.55, 1.7], [-1.2, .9, -2.2], { amp: .5 }, { fire: 1, radio: 0 });                                                     // inside by the stove
  post(t, { vig: .7, grain: .08 });
}
