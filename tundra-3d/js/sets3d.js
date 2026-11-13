// sets3d.js — the locations of «Кречет»: the station in the blizzard (exterior) and the room inside (interior).
import { THREE, TEX, M, box, cyl, glowSprite, human, dog, snowfall, fbm, rnd } from './engine3d.js';

// ═════ EXTERIOR: the station, the rope, the weather box, the tundra ═════
export function exterior() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x1b2636); S.fog = new THREE.FogExp2(0x1b2636, .075);
  const hemi = new THREE.HemisphereLight(0x5a6e96, 0x1a2030, .55); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fa6d6, .25); moon.position.set(-30, 40, -10); S.add(moon);
  // ground: snow drifts
  const gg = new THREE.PlaneGeometry(260, 260, 140, 140); gg.rotateX(-Math.PI / 2); const p = gg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z + 20); p.setY(i, (fbm(x / 14, z / 9, 3) - .5) * 1.6 * Math.min(1, r / 14) + Math.max(0, fbm(x / 4, z / 30, 6) - .55) * 1.4); }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, M({ map: TEX.snow, bumpMap: TEX.snowBump, bumpScale: 2, roughness: .92, color: 0xdfe8f5 })); ground.receiveShadow = true; S.add(ground);
  // the station: log/plank house with a snow cap, a lit window, a door, a porch, a chimney with smoke
  const st = new THREE.Group(); S.add(st);
  const wood = M({ map: TEX.wood, roughness: .85, color: 0x9a8a7a });
  box(8, 3, 6, wood, 0, 1.5, 0, st);
  const roofMat = M({ color: 0x3a3e46, roughness: .7, metalness: .3 }), snowMat = M({ map: TEX.snow, roughness: .95, color: 0xf2f6ff });
  for (const s of [-1, 1]) { const r = box(8.6, .15, 3.6, roofMat, 0, 3.75, s * 1.55, st); r.rotation.x = s * .48; const sn = box(8.7, .22, 3.5, snowMat, 0, 3.92, s * 1.5, st); sn.rotation.x = s * .48; }
  box(8.2, 1.2, .2, wood, 0, 3.5, -3.0, st); box(8.2, 1.2, .2, wood, 0, 3.5, 3.0, st);
  const win = box(1.3, 1.0, .1, M({ color: 0xffb860, emissive: 0xff9a40, emissiveIntensity: 1.6 }), -2, 1.8, -3.02, st); win.castShadow = false;
  box(1.5, .12, .25, wood, -2, 1.24, -3.1, st); box(.08, 1.1, .12, wood, -2, 1.8, -3.08, st); box(1.4, .08, .12, wood, -2, 1.8, -3.08, st);
  const wl = new THREE.PointLight(0xff9a40, 9, 14, 1.6); wl.position.set(-2, 1.8, -3.8); S.add(wl); glowSprite(0xffa050, 3.2, -2, 1.8, -3.15, st, .55);
  box(1.1, 2.1, .14, M({ map: TEX.wood, color: 0x6a5040, roughness: .8 }), 1.5, 1.05, -3.04, st);
  box(2.4, .2, 1.4, wood, 1.5, .1, -3.7, st);
  cyl(.25, .3, 1.6, M({ map: TEX.metal, roughness: .6, metalness: .6 }), 2.6, 4.2, 1.2, st);
  const smoke = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, transparent: true, depthWrite: false, opacity: .5 })); st.add(s); smoke.push(s); }
  // porch lamp (off by default)
  const porch = new THREE.PointLight(0xffd8a0, 0, 10, 1.6); porch.position.set(1.5, 2.6, -3.5); S.add(porch);
  // the rope on poles to the weather box (40 m toward −z)
  const ropeMat = M({ color: 0xc9b08a, roughness: .9 }), poleMat = M({ map: TEX.metal, color: 0x8a8f99, roughness: .5, metalness: .5 });
  const P0 = new THREE.Vector3(1.5, 1.1, -3.9), L = 40, pts = [];
  for (let k = 0; k <= 8; k++) { const z = P0.z - k * 5; cyl(.04, .05, 1.3, poleMat, 2.0, .62, z, S, 8); }
  for (let i = 0; i <= 80; i++) { const u = i / 80, z = P0.z - u * L, sag = Math.sin((u * 8 % 1) * Math.PI) * .1; pts.push(new THREE.Vector3(2.0, 1.22 - sag, z)); }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .018, 6, false), ropeMat); rope.castShadow = true; S.add(rope);
  // the Stevenson screen: white louvered box on legs
  const mb = new THREE.Group(); mb.position.set(2.6, 0, P0.z - L - 1.2); S.add(mb);
  const white = M({ color: 0xe8ecef, roughness: .6 });
  for (const [x, z] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]]) cyl(.035, .035, 1.4, white, x, .7, z, mb, 8);
  box(1, 1, 1, white, 0, 1.9, 0, mb); for (let k = 0; k < 6; k++) box(1.02, .03, 1.02, M({ color: 0xc4cad0 }), 0, 1.5 + k * .16, 0, mb);
  box(1.2, .08, 1.2, white, 0, 2.45, 0, mb);
  // the figure (hidden by default)
  const fig = human(M({ color: 0x14161c, roughness: 1 }), { skin: M({ color: 0xc9ccd4, roughness: .9 }) }); fig.scale.set(1, 1.12, 1); fig.visible = false; S.add(fig);
  // a dog (hidden by default)
  const dg = dog(M({ color: 0x7c7e84, roughness: 1 }), 'sit'); dg.visible = false; S.add(dg);
  // footprints in the snow (instanced little dents)
  const fpGeo = new THREE.CircleGeometry(.09, 10); fpGeo.rotateX(-Math.PI / 2); fpGeo.scale(1, 1, 2.2);
  const fp = new THREE.InstancedMesh(fpGeo, M({ color: 0x9fb0c8, roughness: 1 }), 120); fp.count = 0; S.add(fp);
  const snow = snowfall(5000, 30); S.add(snow);
  return {
    scene: S, refs: { win, wl, porch, fig, dg, fp, mb, rope, P0, L, snow, smoke, ground },
    update(t, cam, o = {}) {
      snow.userData.update(t, cam, o.wind ?? 1); snow.visible = o.snow !== false;
      smoke.forEach((s, i) => { const ph = ((t * .25 + i / 10) % 1); s.position.set(2.6 + ph * 3 * (o.wind ?? 1), 5 + ph * 4, 1.2 + ph * 1.5); s.scale.setScalar(.8 + ph * 3); s.material.opacity = .45 * (1 - ph); });
      wl.intensity = (o.window ?? 1) * (9 + Math.sin(t * 7) * .6); win.material.emissiveIntensity = 1.6 * (o.window ?? 1);
      porch.intensity = o.porch || 0;
      S.fog.density = o.fog ?? .075; if (o.sky != null) { S.background.setHex(o.sky); S.fog.color.setHex(o.sky); }
      if (o.figure) { fig.visible = true; fig.position.set(...o.figure.pos); fig.rotation.y = o.figure.ry ?? 0; } else fig.visible = false;
      if (o.dog) { dg.visible = true; dg.position.set(...o.dog.pos); dg.rotation.y = o.dog.ry ?? 0; } else dg.visible = false;
      if (o.prints) { const m = new THREE.Matrix4(); let n = 0; for (let k = 0; k < Math.min(120, o.prints.n); k++) { const u = k / o.prints.n, x = o.prints.x0 + (o.prints.x1 - o.prints.x0) * u + (k % 2 ? .14 : -.14), z = o.prints.z0 + (o.prints.z1 - o.prints.z0) * u;
        m.makeTranslation(x, .03, z); fp.setMatrixAt(n++, m); } fp.count = n; fp.instanceMatrix.needsUpdate = true; } else fp.count = 0;
    },
  };
}

// ═════ INTERIOR: the station room ═════
export function interior() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x050607); S.fog = new THREE.Fog(0x0a0a0c, 4, 14);
  S.add(new THREE.AmbientLight(0x404a60, .25));
  const wallMat = M({ map: TEX.woodIn, roughness: .8, color: 0xb0a090 }), floorMat = M({ map: TEX.floor, roughness: .85 });
  const room = new THREE.Group(); S.add(room);
  const plane = (w, h, mat, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; room.add(m); return m; };
  plane(6, 5, floorMat, 0, 0, 0, -Math.PI / 2, 0); plane(6, 5, M({ map: TEX.woodIn, color: 0x6a5a4a }), 0, 2.6, 0, Math.PI / 2, 0);
  plane(6, 2.6, wallMat, 0, 1.3, -2.5, 0, 0); plane(6, 2.6, wallMat, 0, 1.3, 2.5, 0, Math.PI); plane(5, 2.6, wallMat, -3, 1.3, 0, 0, Math.PI / 2); plane(5, 2.6, wallMat, 3, 1.3, 0, 0, -Math.PI / 2);
  // window on the back wall: black night + frost
  const wnd = new THREE.Group(); wnd.position.set(.9, 1.55, -2.48); room.add(wnd);
  box(1.2, .9, .02, M({ color: 0x0a1424, emissive: 0x0a1830, emissiveIntensity: .6, roughness: .2 }), 0, 0, 0, wnd);
  const frost = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .9), new THREE.MeshStandardMaterial({ map: TEX.frost, transparent: true, opacity: .8, roughness: .5 })); frost.position.z = .02; wnd.add(frost);
  const frameM = M({ map: TEX.wood, color: 0x8a6a50 }); box(1.32, .08, .08, frameM, 0, .48, .03, wnd); box(1.32, .08, .08, frameM, 0, -.48, .03, wnd); box(.08, .98, .08, frameM, -.62, 0, .03, wnd); box(.08, .98, .08, frameM, .62, 0, .03, wnd); box(.05, .9, .06, frameM, 0, 0, .04, wnd);
  // the iron stove + pipe + fire
  const iron = M({ map: TEX.metal, color: 0x3a3a3e, roughness: .55, metalness: .7 });
  const stove = new THREE.Group(); stove.position.set(-2.2, 0, -1.7); room.add(stove);
  box(.8, .75, .7, iron, 0, .45, 0, stove); for (const [x, z] of [[-.32, -.27], [.32, -.27], [-.32, .27], [.32, .27]]) cyl(.04, .03, .12, iron, x, .05, z, stove, 8);
  cyl(.09, .09, 1.8, iron, .2, 1.7, -.15, stove, 12);
  const fireDoor = box(.36, .26, .02, M({ color: 0xff7a20, emissive: 0xff5a10, emissiveIntensity: 2 }), 0, .42, .36, stove); fireDoor.castShadow = false;
  const fireL = new THREE.PointLight(0xff7a30, 14, 9, 1.7); fireL.position.set(-2.2, .6, -1.1); fireL.castShadow = true; fireL.shadow.mapSize.set(512, 512); S.add(fireL);
  const fireG = glowSprite(0xff7a30, 1.3, 0, .42, .4, stove, .8);
  // table, journal, radio, kerosene lamp, stool
  const tbl = new THREE.Group(); tbl.position.set(1.2, 0, -1.9); room.add(tbl); const tw = M({ map: TEX.floor, color: 0xa08060 });
  box(1.6, .06, .8, tw, 0, .78, 0, tbl); for (const [x, z] of [[-.72, -.33], [.72, -.33], [-.72, .33], [.72, .33]]) box(.06, .78, .06, tw, x, .39, z, tbl);
  const journal = box(.5, .02, .34, M({ map: TEX.paper, roughness: .9 }), -.2, .82, .1, tbl); journal.rotation.y = .12;
  const radio = new THREE.Group(); radio.position.set(.45, .81, -.12); tbl.add(radio);
  box(.55, .32, .28, M({ color: 0x3d4a3a, roughness: .6, metalness: .3 }), 0, .16, 0, radio);
  const dial = box(.22, .1, .01, M({ color: 0x9cff7a, emissive: 0x5aff40, emissiveIntensity: 0 }), .1, .2, .145, radio);
  for (const x of [-.18, -.08]) { const k = cyl(.03, .03, .03, M({ color: 0x111111 }), x, .12, .15, radio, 12); k.rotation.x = Math.PI / 2; }
  const radioL = new THREE.PointLight(0x6aff50, 0, 3, 2); radioL.position.set(1.65, 1.1, -1.7); S.add(radioL);
  const lamp = new THREE.Group(); lamp.position.set(-.55, .81, -.15); tbl.add(lamp); cyl(.07, .09, .1, M({ color: 0x8a6a2a, metalness: .6, roughness: .4 }), 0, .05, 0, lamp, 12);
  const chimney = cyl(.05, .06, .22, new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffc070, emissiveIntensity: 1.4, transparent: true, opacity: .85 }), 0, .21, 0, lamp, 12); chimney.castShadow = false;
  const lampL = new THREE.PointLight(0xffc070, 6, 7, 1.8); lampL.position.set(.65, 1.15, -2.05); lampL.castShadow = true; lampL.shadow.mapSize.set(512, 512); S.add(lampL); glowSprite(0xffc070, .6, 0, .22, 0, lamp, .7);
  box(.4, .45, .4, tw, 1.0, .225, -1.2, room);
  // bunk, shelves with cans and sacks, a coat on a hook, the storeroom door, the front door
  const bunk = new THREE.Group(); bunk.position.set(2.45, 0, .6); room.add(bunk); box(.9, .4, 2, tw, 0, .2, 0, bunk); box(.85, .14, 1.9, M({ color: 0x5a2a28, roughness: 1 }), 0, .47, 0, bunk); box(.6, .1, .35, M({ color: 0xd8d0c0 }), 0, .58, -.75, bunk);
  const shelf = new THREE.Group(); shelf.position.set(-2.85, 0, .9); room.add(shelf);
  for (let k = 0; k < 3; k++) { box(.35, .04, 1.4, tw, 0, .6 + k * .5, 0, shelf); for (let i = 0; i < 6; i++) cyl(.05, .05, .11, M({ color: rnd(i, k) < .5 ? 0x8a9aa8 : 0xa88a5a, metalness: .6, roughness: .4 }), .02, .67 + k * .5, -.55 + i * .2, shelf, 10); }
  const sdoor = box(.9, 2.0, .06, M({ map: TEX.wood, color: 0x6a5040 }), -1.6, 1.0, 2.47, room);
  const fdoor = box(1.0, 2.05, .08, M({ map: TEX.wood, color: 0x5a4434 }), 1.3, 1.03, 2.46, room);
  box(.3, .05, .06, M({ color: 0x777777, metalness: .8, roughness: .3 }), 1.0, 1.1, 2.4, room);
  const dg = dog(M({ color: 0x7c7e84, roughness: 1 }), 'lie'); dg.position.set(-1.35, 0, -.75); dg.rotation.y = 2.4; room.add(dg);
  // frost creeping across the floor (a growing translucent decal)
  const frostFloor = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ map: TEX.frost, transparent: true, opacity: 0, roughness: .3, color: 0xdfefff })); frostFloor.rotation.x = -Math.PI / 2; frostFloor.position.set(.9, .01, -2.2); room.add(frostFloor);
  return {
    scene: S, refs: { fireL, fireDoor, fireG, lampL, radioL, dial, frost, frostFloor, dg, journal, sdoor, fdoor, wnd },
    update(t, cam, o = {}) {
      const fire = o.fire ?? 1, fl = 1 + Math.sin(t * 11) * .08 + Math.sin(t * 17.3) * .06;
      fireL.intensity = 14 * fire * fl; fireDoor.material.emissiveIntensity = 2 * fire * fl + .05; fireG.material.opacity = .8 * fire;
      lampL.intensity = 6 * (o.lamp ?? 1); radioL.intensity = 2.5 * (o.radio || 0) * (1 + Math.sin(t * 30) * .1); dial.material.emissiveIntensity = 1.5 * (o.radio || 0);
      frostFloor.material.opacity = Math.min(.9, (o.frost || 0)); frostFloor.scale.setScalar(.2 + 3.5 * (o.frost || 0));
      frost.material.opacity = .5 + .5 * (o.frost || 0);
      dg.visible = o.dog !== false;
    },
  };
}
