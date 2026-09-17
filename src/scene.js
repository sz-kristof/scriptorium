// The scriptorium: renderer, camera rig, candlelight, the oak desk and its props, the quill.
import * as THREE from 'three';
import { PAGE_W, PAGE_H, SPINE_GAP, TEX_W, TEX_H, TOTAL_LEAVES } from './constants.js';
import { parchmentCanvas, noiseCanvas, woodCanvas, leatherCanvas, edgesCanvas, featherCanvas, flameCanvas } from './textures.js';

const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function canvasTex(canvas, renderer, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0705);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  // ---- materials from procedural canvases ----
  const parchment = parchmentCanvas(TEX_W, TEX_H, 3);
  const parchmentTex = canvasTex(parchment, renderer);
  const noiseTex = canvasTex(noiseCanvas(512, 9), renderer, false);
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping; noiseTex.repeat.set(3, 4);
  const woodTex = canvasTex(woodCanvas(1024, 5), renderer);
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(1.6, 1.2);
  const leatherTex = canvasTex(leatherCanvas(1024, false, 11), renderer);
  const leatherTooledTex = canvasTex(leatherCanvas(1024, true, 12), renderer);
  const edgesTex = canvasTex(edgesCanvas(256, 4), renderer);
  edgesTex.wrapS = edgesTex.wrapT = THREE.RepeatWrapping; edgesTex.repeat.set(4, 1);
  const featherTex = canvasTex(featherCanvas(256, 1024, 21), renderer);
  const flameTex = canvasTex(flameCanvas(64, 128), renderer);

  const mats = {
    parchmentTex,
    pageMaterial: (map, side = THREE.FrontSide) => new THREE.MeshStandardMaterial({
      map: map || parchmentTex, side, roughness: 0.93, metalness: 0, bumpMap: noiseTex, bumpScale: 0.6,
    }),
    parchmentPlain: new THREE.MeshStandardMaterial({ map: parchmentTex, roughness: 0.95 }),
    edges: new THREE.MeshStandardMaterial({ map: edgesTex, roughness: 0.95 }),
    leather: new THREE.MeshStandardMaterial({ map: leatherTex, roughness: 0.55, bumpMap: noiseTex, bumpScale: 0.8 }),
    leatherTooled: new THREE.MeshStandardMaterial({ map: leatherTooledTex, roughness: 0.5, bumpMap: noiseTex, bumpScale: 0.8 }),
  };

  // ---- lights ----
  const hemi = new THREE.HemisphereLight(0x5d6f9a, 0x2a1a10, 0.45);
  scene.add(hemi);
  const candlePos = new THREE.Vector3(-1.32, 0, -0.62);
  const key = new THREE.SpotLight(0xffb266, 9.5, 8, Math.PI * 0.36, 0.7, 1.7);
  key.position.set(-1.15, 1.25, -0.62);
  key.target.position.set(0.35, 0, 0.1);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.006;
  key.shadow.camera.near = 0.3;
  key.shadow.camera.far = 6;
  scene.add(key, key.target);
  const glow = new THREE.PointLight(0xff9a3a, 0.9, 3, 2);
  glow.position.copy(candlePos).add(new THREE.Vector3(0, 0.6, 0));
  scene.add(glow);
  const moon = new THREE.DirectionalLight(0x7f95c4, 0.55);
  moon.position.set(2.5, 2.4, 1.2);
  scene.add(moon);

  // ---- desk and wall ----
  const desk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 3.4), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.03, bumpMap: noiseTex, bumpScale: 0.5 }));
  desk.position.set(0, -0.04, 0.1);
  desk.receiveShadow = true; desk.castShadow = true;
  scene.add(desk);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), new THREE.MeshStandardMaterial({ color: 0x3a2e22, roughness: 1 }));
  wall.position.set(0, 1.9, -1.65);
  wall.receiveShadow = true;
  scene.add(wall);

  // ---- candle in a brass stick ----
  const brass = new THREE.MeshStandardMaterial({ color: 0xb08a3c, roughness: 0.35, metalness: 0.85 });
  const wax = new THREE.MeshStandardMaterial({ color: 0xf1e6c8, roughness: 0.55, emissive: 0xffb050, emissiveIntensity: 0.06 });
  const stick = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.02, 40), brass);
  base.position.y = 0.01;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.3, 24), brass);
  stem.position.y = 0.17;
  const knop = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), brass);
  knop.position.y = 0.16;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.035, 0.03, 32), brass);
  cup.position.y = 0.33;
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.26, 32), wax);
  candle.position.y = 0.46;
  const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.04, 0.05, 24), wax);
  drip.position.y = 0.55;
  for (const m of [base, stem, knop, cup, candle, drip]) { m.castShadow = true; m.receiveShadow = true; stick.add(m); }
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.scale.set(0.075, 0.15, 1);
  flame.position.y = 0.66;
  stick.add(flame);
  stick.position.copy(candlePos);
  scene.add(stick);

  // ---- inkwell ----
  const well = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b0806, roughness: 0.18, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.1, 40), glass);
  body.position.y = 0.05;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.012, 16, 40), brass);
  collar.rotation.x = Math.PI / 2; collar.position.y = 0.1;
  const inkSurface = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), new THREE.MeshStandardMaterial({ color: 0x050302, roughness: 0.08, metalness: 0.2 }));
  inkSurface.rotation.x = -Math.PI / 2; inkSurface.position.y = 0.085;
  for (const m of [body, collar, inkSurface]) { m.castShadow = true; m.receiveShadow = true; well.add(m); }
  well.position.set(1.55, 0, 0.32);
  scene.add(well);

  // ---- the quill (follows the pointer) ----
  const quill = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0028, 0.44, 12), new THREE.MeshStandardMaterial({ color: 0xd9c9a0, roughness: 0.5 }));
  shaft.position.y = 0.22;
  const nib = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0008, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x241408, roughness: 0.4 }));
  nib.position.y = 0.024;
  const vane = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.36), new THREE.MeshStandardMaterial({ map: featherTex, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 }));
  vane.position.y = 0.29;
  for (const m of [shaft, nib, vane]) { m.castShadow = true; quill.add(m); }
  {
    // shaft along dir, vane as flat to the sky as it can be so the camera sees the feather
    const dir = new THREE.Vector3(0.74, 0.5, -0.46).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const n = up.clone().sub(dir.clone().multiplyScalar(up.dot(dir))).normalize();
    const xAxis = new THREE.Vector3().crossVectors(dir, n);
    quill.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, dir, n));
  }
  quill.setInk = (kind) => { nib.material.color.set(kind === 'gold' ? 0xe2b544 : 0x241408); };
  scene.add(quill);

  // ---- earthquake: a rumble with a couple of jolts, dust from the ceiling, the props rattle ----
  const quake = { t: 0, dur: 0, amp: 0, active: false, jolts: [], env: 0 };
  const shakeOffset = new THREE.Vector3();
  const lookTmp = new THREE.Vector3();
  const rumble = (t, a, b, c) => Math.sin(t * a) * 0.5 + Math.sin(t * b + 1.3) * 0.3 + Math.sin(t * c + 0.7) * 0.2;
  function quakeEnvelope() {
    if (!quake.active) return 0;
    const t = quake.t, d = quake.dur;
    let e = Math.min(Math.min(1, t / 0.9), Math.min(1, Math.max(0, (d - t) / 1.4)));
    for (const j of quake.jolts) e += 1.7 * Math.exp(-(((t - j) / 0.07) ** 2));
    return e;
  }
  function startQuake(dur = 4.5, amp = 0.022) {
    quake.t = 0; quake.dur = dur; quake.amp = amp; quake.active = true;
    quake.jolts = [1.1 + Math.random() * 0.8, 2.4 + Math.random() * 0.9];
  }
  // plaster dust
  const DUST_N = 90;
  const dustPos = new Float32Array(DUST_N * 3), dustVel = new Float32Array(DUST_N * 3);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dotCanvas = document.createElement('canvas'); dotCanvas.width = dotCanvas.height = 32;
  { const dc = dotCanvas.getContext('2d'); const g = dc.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); dc.fillStyle = g; dc.fillRect(0, 0, 32, 32); }
  const dustMat = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(dotCanvas), color: 0xe0d2b4, size: 0.014, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.visible = false;
  scene.add(dust);
  const spawnDust = (i, fromTop) => {
    dustPos[i * 3] = -0.9 + Math.random() * 2.6;
    dustPos[i * 3 + 1] = fromTop ? 1.3 + Math.random() * 0.6 : 0.1 + Math.random() * 1.8;
    dustPos[i * 3 + 2] = -0.9 + Math.random() * 1.9;
    dustVel[i * 3] = (Math.random() - 0.5) * 0.08;
    dustVel[i * 3 + 1] = -(0.25 + Math.random() * 0.35);
    dustVel[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  };
  let dustFade = 0;

  // ---- camera rig ----
  const rig = {
    pos: new THREE.Vector3(0, 2, 2), target: new THREE.Vector3(0, 0, 0),
    from: null, to: null, t: 1, dur: 1, name: 'watch', pageY: 0.14,
    zoomK: 1, zoomTarget: null,   // wheel zoom on the page: distance factor and where it looks
    pageCentre() { return new THREE.Vector3(SPINE_GAP / 2 + PAGE_W / 2, this.pageY, -0.02); },
    poses: {
      write(aspect) {
        const tilt = 0.24;
        const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const d = Math.max((PAGE_H / 2 / 0.93) / halfV, (PAGE_W / 2 / 0.93) / (halfV * aspect)) * rig.zoomK;
        const target = rig.zoomTarget ? rig.zoomTarget.clone() : rig.pageCentre();
        const pos = target.clone().add(new THREE.Vector3(0, Math.cos(tilt) * d, Math.sin(tilt) * d));
        return { pos, target };
      },
      watch(aspect) {
        const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const d = Math.max(2.35, (1.12 / 0.84) / (halfV * aspect));
        const target = new THREE.Vector3(0.04, 0.06, 0.08);
        const pos = target.clone().add(new THREE.Vector3(0.12, 0.8, 0.62).normalize().multiplyScalar(d));
        return { pos, target };
      },
      end(aspect) {
        const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const d = Math.max(2.2, (1.0 / 0.84) / (halfV * aspect));
        const target = new THREE.Vector3(0.3, 0.08, 0.05);
        const pos = target.clone().add(new THREE.Vector3(0.45, 0.62, 0.7).normalize().multiplyScalar(d));
        return { pos, target };
      },
    },
    setPose(name, dur = 1) {
      this.name = name;
      const p = this.poses[name](camera.aspect);
      if (dur <= 0) { this.pos.copy(p.pos); this.target.copy(p.target); this.t = 1; return; }
      this.from = { pos: this.pos.clone(), target: this.target.clone() };
      this.to = p; this.t = 0; this.dur = dur;
    },
    refit() { if (this.t >= 1) this.setPose(this.name, 0); else this.to = this.poses[this.name](camera.aspect); },
    // zoom the writing view by factor, keeping the world point p (on the page) under the cursor
    zoomAt(p, factor) {
      const k0 = this.zoomK, k1 = Math.min(1, Math.max(0.28, k0 * factor));
      if (k1 === k0) return;
      const base = this.pageCentre();
      const t = this.zoomTarget ? this.zoomTarget.clone() : base;
      const t2 = new THREE.Vector3().subVectors(t, p).multiplyScalar(k1 / k0).add(p);
      t2.y = this.pageY;
      const rx = PAGE_W / 2 * (1 - k1), rz = PAGE_H / 2 * (1 - k1);   // keep the view on the page
      t2.x = Math.min(base.x + rx, Math.max(base.x - rx, t2.x));
      t2.z = Math.min(base.z + rz, Math.max(base.z - rz, t2.z));
      this.zoomK = k1;
      this.zoomTarget = k1 >= 0.999 ? null : t2;
      this.setPose('write', 0.22);
    },
    resetZoom() { this.zoomK = 1; this.zoomTarget = null; },
    update(dt) {
      if (this.t < 1) {
        this.t = Math.min(1, this.t + dt / this.dur);
        const k = easeInOut(this.t);
        this.pos.lerpVectors(this.from.pos, this.to.pos, k);
        this.target.lerpVectors(this.from.target, this.to.target, k);
      }
      camera.position.copy(this.pos).add(shakeOffset);
      camera.lookAt(lookTmp.copy(this.target).addScaledVector(shakeOffset, 0.35));
    },
    get moving() { return this.t < 1; },
  };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return;   // the pane reports 0x0 while hidden
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    rig.refit();
  }
  window.addEventListener('resize', resize);
  resize();

  let time = 0;
  function update(dt) {
    time += dt;
    // the earthquake
    if (quake.active) { quake.t += dt; if (quake.t >= quake.dur) quake.active = false; }
    const e = quakeEnvelope();
    quake.env = e;
    shakeOffset.set(rumble(time, 23.1, 41.7, 67.3), rumble(time, 19.3, 37.1, 59.9) * 0.6, rumble(time, 27.7, 45.3, 71.1)).multiplyScalar(quake.amp * e);
    const rattle = Math.abs(rumble(time, 31.3, 53.9, 83.7)) * e;
    stick.position.y = candlePos.y + rattle * 0.006;
    well.position.y = rattle * 0.005;
    if (e > 0) dustFade = 1; else dustFade = Math.max(0, dustFade - dt * 0.6);
    if (dustFade > 0) {
      dust.visible = true;
      if (!dustMat.opacity && e > 0) for (let i = 0; i < DUST_N; i++) spawnDust(i, false);
      for (let i = 0; i < DUST_N; i++) {
        dustPos[i * 3] += dustVel[i * 3] * dt; dustPos[i * 3 + 1] += dustVel[i * 3 + 1] * dt; dustPos[i * 3 + 2] += dustVel[i * 3 + 2] * dt;
        if (dustPos[i * 3 + 1] < 0.02) { if (e > 0) spawnDust(i, true); else dustPos[i * 3 + 1] = -1; }
      }
      dustGeo.attributes.position.needsUpdate = true;
      dustMat.opacity = Math.min(0.85, e > 0 ? Math.min(1, e) : dustFade);
    } else { dust.visible = false; dustMat.opacity = 0; }
    const n = Math.sin(time * 13.1) * 0.5 + Math.sin(time * 7.3 + 1) * 0.3 + Math.sin(time * 31.7) * 0.2;
    const fl = 1 + 0.9 * e;
    flame.scale.set(0.075 * (1 + 0.08 * n * fl), 0.15 * (1 + 0.16 * n * fl), 1);
    flame.position.x = 0.004 * Math.sin(time * 9.7) * fl;
    glow.intensity = 0.9 * (1 + 0.16 * n * fl);
    key.intensity = 9.5 * (1 + 0.05 * n * fl);
    rig.update(dt);
  }

  return {
    renderer, scene, camera, rig, mats, quill, update, resize, parchment, noiseTex, canvasTex: (c) => canvasTex(c, renderer),
    quake: startQuake, isQuaking: () => quake.active, quakeStrength: () => quake.env,
  };
}
