// The codex: two covers, two stacks of leaves that dip into the gutter, the page
// being written, the leaf that turns, and the closing of the front cover.
import * as THREE from 'three';
import { PAGE_W, PAGE_H, LEAF_T, COVER_T, COVER_OVERHANG, SPINE_GAP, GUTTER_W, GUTTER_DIP } from './constants.js';

const NX = 28;
const LEAF_NX = 48, LEAF_NZ = 6;
const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// The back of a leaf is sampled mirrored, so its verso reads the right way round once it lies on the left.
export function mirrorTexture(tex) {
  const m = tex.clone();
  m.wrapS = THREE.RepeatWrapping; m.repeat.x = -1; m.offset.x = 1; m.needsUpdate = true;
  return m;
}

// Height of the top surface of a stack with n leaves at world x, on side +1 (right) or -1 (left).
export function surfaceY(side, n, x) {
  const T = COVER_T + n * LEAF_T;
  const s = side > 0 ? x - SPINE_GAP / 2 : -SPINE_GAP / 2 - x;
  if (s < GUTTER_W) {
    const k = 1 - Math.max(0, s) / GUTTER_W;
    return T - Math.min(GUTTER_DIP, n * LEAF_T * 0.7) * k * k;
  }
  return T;
}

function pageSurfaceGeometry(side, n, lift = 0.0009) {
  const g = new THREE.PlaneGeometry(PAGE_W, PAGE_H, NX, 1);
  g.rotateX(-Math.PI / 2);
  const cx = side > 0 ? SPINE_GAP / 2 + PAGE_W / 2 : -SPINE_GAP / 2 - PAGE_W / 2;
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx;
    p.setX(i, x);
    p.setY(i, surfaceY(side, n, x) + lift);
  }
  g.computeVertexNormals();
  return g;
}

function stackGeometry(side, n) {
  const T = n * LEAF_T;
  const g = new THREE.BoxGeometry(PAGE_W, T, PAGE_H, NX, 1, 1);
  const cx = side > 0 ? SPINE_GAP / 2 + PAGE_W / 2 : -SPINE_GAP / 2 - PAGE_W / 2;
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx;
    p.setX(i, x);
    if (p.getY(i) > 0) p.setY(i, surfaceY(side, n, x));
    else p.setY(i, COVER_T);
  }
  g.computeVertexNormals();
  return g;
}

export class Book {
  constructor(scene, mats) {
    this.scene = scene;
    this.mats = mats;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.nLeft = 0;
    this.nRight = 0;
    this.anim = null;

    const cw = PAGE_W + COVER_OVERHANG, cd = PAGE_H + 2 * COVER_OVERHANG;
    const coverGeo = new THREE.BoxGeometry(cw, COVER_T, cd);
    const plain = mats.leather;
    this.leftCover = new THREE.Mesh(coverGeo, [plain, plain, plain, mats.leatherTooled, plain, plain]);
    this.leftCover.position.set(-SPINE_GAP / 2 - cw / 2, COVER_T / 2, 0);
    this.rightCover = new THREE.Mesh(coverGeo, [plain, plain, plain, plain, plain, plain]);
    this.rightCover.position.set(SPINE_GAP / 2 + cw / 2, COVER_T / 2, 0);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(SPINE_GAP + 0.01, COVER_T * 0.7, cd), plain);
    spine.position.set(0, COVER_T * 0.35, 0);
    for (const m of [this.leftCover, this.rightCover, spine]) { m.castShadow = true; m.receiveShadow = true; this.group.add(m); }

    this.leftStack = new THREE.Mesh(new THREE.BufferGeometry(), [mats.edges, mats.edges, mats.parchmentPlain, mats.parchmentPlain, mats.edges, mats.edges]);
    this.rightStack = new THREE.Mesh(new THREE.BufferGeometry(), [mats.edges, mats.edges, mats.parchmentPlain, mats.parchmentPlain, mats.edges, mats.edges]);
    for (const m of [this.leftStack, this.rightStack]) { m.castShadow = true; m.receiveShadow = true; this.group.add(m); }

    this.leftTop = new THREE.Mesh(new THREE.BufferGeometry(), mats.pageMaterial(null));
    this.leftTop.receiveShadow = true;
    this.group.add(this.leftTop);
    this.activePage = new THREE.Mesh(new THREE.BufferGeometry(), mats.pageMaterial(null));
    this.activePage.receiveShadow = true;
    this.group.add(this.activePage);

    // the turning leaf: one geometry, a front and a back mesh
    const lg = new THREE.BufferGeometry();
    const nv = (LEAF_NX + 1) * (LEAF_NZ + 1);
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    lg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    const uv = new Float32Array(nv * 2);
    const idx = [];
    for (let j = 0; j <= LEAF_NZ; j++) for (let i = 0; i <= LEAF_NX; i++) { const k = j * (LEAF_NX + 1) + i; uv[k * 2] = i / LEAF_NX; uv[k * 2 + 1] = 1 - j / LEAF_NZ; }
    for (let j = 0; j < LEAF_NZ; j++) for (let i = 0; i < LEAF_NX; i++) {
      const a = i + (LEAF_NX + 1) * j, b = i + (LEAF_NX + 1) * (j + 1), c = (i + 1) + (LEAF_NX + 1) * (j + 1), d = (i + 1) + (LEAF_NX + 1) * j;
      idx.push(a, b, d, b, c, d);
    }
    lg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    lg.setIndex(idx);
    this.leafGeo = lg;
    this.leafFront = new THREE.Mesh(lg, mats.pageMaterial(null, THREE.FrontSide));
    this.leafBack = new THREE.Mesh(lg, mats.pageMaterial(null, THREE.BackSide));
    this.leafFront.castShadow = true; this.leafFront.receiveShadow = true; this.leafBack.receiveShadow = true;
    this.leaf = new THREE.Group();
    this.leaf.add(this.leafFront, this.leafBack);
    this.leaf.visible = false;
    this.group.add(this.leaf);
  }

  setStacks(nLeft, nRight) {
    this.nLeft = nLeft; this.nRight = nRight;
    this.leftStack.geometry.dispose(); this.rightStack.geometry.dispose();
    this.leftStack.geometry = stackGeometry(-1, Math.max(nLeft, 0.001));
    this.rightStack.geometry = stackGeometry(1, Math.max(nRight, 0.001));
    this.leftStack.visible = nLeft > 0;
    this.rightStack.visible = nRight > 0;
    this.leftTop.geometry.dispose(); this.activePage.geometry.dispose();
    this.leftTop.geometry = pageSurfaceGeometry(-1, nLeft);
    this.activePage.geometry = pageSurfaceGeometry(1, nRight);
  }

  get activeY() { return surfaceY(1, this.nRight, SPINE_GAP / 2 + PAGE_W / 2); }

  setActiveTexture(tex) { this.activePage.material.map = tex; this.activePage.material.needsUpdate = true; }
  setLeftTexture(tex) { this.leftTop.material.map = tex; this.leftTop.material.needsUpdate = true; }

  // ---- animations ----
  _writeLeaf(fn) {
    // fn(i, j, out) fills out = [x, y, z] for grid point (i along the page width, j down the page)
    const p = this.leafGeo.attributes.position;
    const out = [0, 0, 0];
    for (let j = 0; j <= LEAF_NZ; j++) for (let i = 0; i <= LEAF_NX; i++) {
      fn(i, j, out);
      p.setXYZ(j * (LEAF_NX + 1) + i, out[0], out[1], out[2]);
    }
    p.needsUpdate = true;
    this.leafGeo.computeVertexNormals();
    this.leafGeo.computeBoundingSphere();
  }

  // ---- the turning leaf, driven by the game (hover lift, drag, or an animation) ----
  // dir +1: the top right leaf, turning over to the left; -1: the top left leaf, turning to the right.
  // nLeftUnder / nRightUnder: leaves in each stack beneath it while it is in the air.
  // backMirrored: the verso texture already mirrored (see mirrorTexture).
  prepareLeaf(dir, front, backMirrored, nLeftUnder, nRightUnder) {
    this.leafFront.material.map = front; this.leafFront.material.needsUpdate = true;
    this.leafBack.material.map = backMirrored; this.leafBack.material.needsUpdate = true;
    this.leaf.visible = true;
    this.leaf.position.set(0, 0, 0); this.leaf.rotation.set(0, 0, 0);
    this.leafState = {
      dir, nL: nLeftUnder, nR: nRightUnder, p: 0,
      yR0: surfaceY(1, nRightUnder, SPINE_GAP / 2), yL0: surfaceY(-1, nLeftUnder, -SPINE_GAP / 2),
    };
    this.setLeaf(0);
  }

  // p: progress from the side the leaf started on, 0 = lying flat there, 1 = lying flat on the other side.
  setLeaf(p) {
    const L = this.leafState;
    if (!L) return;
    L.p = p;
    const u = L.dir > 0 ? p : 1 - p;          // u: 0 = flat on the right, 1 = flat on the left
    const theta = Math.PI * u;
    const bend = 0.75 * Math.sin(2 * Math.PI * u);
    const hx = SPINE_GAP / 2 - SPINE_GAP * u;
    const hy = L.yR0 + (L.yL0 - L.yR0) * u + 0.004 * Math.sin(Math.PI * u);
    const wR = Math.max(0, 1 - u / 0.18), wL = Math.max(0, (u - 0.82) / 0.18);
    const ds = PAGE_W / LEAF_NX;
    const rows = [];
    for (let j = 0; j <= LEAF_NZ; j++) {
      const zf = j / LEAF_NZ;
      const b = bend * (0.7 + 0.5 * zf);
      let x = hx, y = hy;
      const row = [[x, y]];
      for (let i = 1; i <= LEAF_NX; i++) {
        const s = (i - 0.5) / LEAF_NX;
        const a = Math.min(Math.PI, Math.max(0, theta + b * s));
        x += Math.cos(a) * ds; y += Math.sin(a) * ds;
        row.push([x, y]);
      }
      rows.push(row);
    }
    this._writeLeaf((i, j, out) => {
      const [x, y] = rows[j][i];
      let yy = y;
      if (wR > 0) yy += (surfaceY(1, L.nR, x) - L.yR0) * wR;
      if (wL > 0) yy += (surfaceY(-1, L.nL, x) - L.yL0) * wL;
      out[0] = x; out[1] = yy + 0.0012; out[2] = -PAGE_H / 2 + (j / LEAF_NZ) * PAGE_H;
    });
  }

  animateLeaf(pTarget, dur, onDone) {
    const p0 = this.leafState ? this.leafState.p : 0;
    this.anim = { kind: 'leaf', t: 0, dur: Math.max(0.05, dur), onDone: () => onDone && onDone(),
      step: (t) => { const k = 1 - Math.pow(1 - t, 3); this.setLeaf(p0 + (pTarget - p0) * k); } };
  }

  hideLeaf() { this.leaf.visible = false; this.leafState = null; }

  // Tear the ruined leaf out and fling it aside.
  startTear(front, onDone, dur = 0.95) {
    this.leafFront.material.map = front; this.leafFront.material.needsUpdate = true;
    this.leafBack.material.map = this.mats.parchmentTex; this.leafBack.material.needsUpdate = true;
    this.leaf.visible = true;
    const nR = this.nRight;
    const rnd = [];
    for (let k = 0; k < (LEAF_NX + 1) * (LEAF_NZ + 1); k++) rnd.push(Math.random() - 0.5);
    this.anim = { kind: 'tear', t: 0, dur, onDone: () => { this.leaf.visible = false; this.leaf.position.set(0, 0, 0); this.leaf.rotation.set(0, 0, 0); onDone && onDone(); },
      step: (t) => {
        const e = t * t;
        const crumple = Math.min(1, t * 2.2) * 0.05;
        this._writeLeaf((i, j, out) => {
          const x = SPINE_GAP / 2 + (i / LEAF_NX) * PAGE_W;
          const k = j * (LEAF_NX + 1) + i;
          // folds: a few crossing waves that sharpen as the leaf is crushed, plus a little noise
          const fold = Math.sin(i * 0.55 + t * 4) * Math.sin(j * 1.1 + 0.7) + 0.6 * Math.sin(i * 1.3 - j * 0.8 + t * 6) + 0.5 * rnd[k];
          out[0] = x + fold * crumple * 0.35;
          out[1] = surfaceY(1, nR, x) + 0.0015 + (0.9 + fold) * crumple * 1.2;
          out[2] = -PAGE_H / 2 + (j / LEAF_NZ) * PAGE_H + rnd[(k * 7) % rnd.length] * crumple * 0.5 + fold * crumple * 0.2;
        });
        this.leaf.position.set(0.55 * e, 0.28 * Math.sin(Math.PI * t) + 0.1 * e, 0.9 * e);
        this.leaf.rotation.set(0.9 * e, 0, -0.6 * e);
      } };
    this.anim.step(0);
  }

  // Close the front cover (left side) over the block.
  startClose(onDone, dur = 1.5) {
    const TL = COVER_T + this.nLeft * LEAF_T, TR = COVER_T + this.nRight * LEAF_T;
    const y0 = (TL + TR) / 2;
    const pivot = new THREE.Group();
    pivot.position.set(0, y0, 0);
    this.group.add(pivot);
    for (const m of [this.leftCover, this.leftStack, this.leftTop]) pivot.attach(m);
    this.anim = { kind: 'close', t: 0, dur, onDone: () => onDone && onDone(),
      step: (t) => { pivot.rotation.z = -Math.PI * easeInOut(t); } };
  }

  update(dt) {
    const a = this.anim;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / a.dur);
    a.step(a.t);
    if (a.t >= 1) { this.anim = null; a.onDone(); }
  }

  get busy() { return !!this.anim; }
}
