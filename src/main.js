import * as THREE from 'three';
import { createScene } from './scene.js';
import { Book, surfaceY, mirrorTexture } from './book.js';
import { createPage, makeVerso, makePastedown, loadFonts, loadPictures, BLOOM_SECS } from './page.js';
import { PAGES, CURSE } from './pages.js';
import { createHud } from './hud.js';
import { TEX_W, TEX_H, BLOT_BUDGET, TOTAL_LEAVES, PAGE_W, PAGE_H, SPINE_GAP } from './constants.js';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const HOVER_LIFT = 0.015;       // how far a page lifts when the hand hovers over its corner
const DRAG_SPAN = PAGE_W * 0.9; // dragging this far in world units turns a page fully

async function main() {
  const [, pictures] = await Promise.all([loadFonts(), loadPictures(PAGES)]);
  const canvas = document.getElementById('c');
  const S = createScene(canvas);
  const res = { parchment: S.parchment, pictures };
  const book = new Book(S.scene, S.mats);
  const pastedownTex = S.canvasTex(makePastedown(res, CURSE));
  const hud = createHud();
  S.rig.setPose('watch', 0);

  const G = {
    state: 'intro',        // intro, leaning, write, snap, bloom, done, browse, ruin, closing, end
    pageIndex: 0, page: null, tex: null,
    nextPage: null, nextTex: null,        // the following page, made once the current one is done
    versoTex: null, versoMirrored: null,  // the back of the current page once it is done
    pageDone: false, penDown: false, budget: 1,
    leaves: [],            // leaves already turned over: { front, back, backMirrored }
    view: 0,               // how many of them lie on the left in the current view
    torn: 0,
    writeTime: 0, quakeAt: null,   // seconds spent writing this page, and when the ground will shake
  };
  const turn = { hover: null, drag: null, animating: false };
  const pointer = { x: 0, y: 0, has: false, world: null };
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const hoverPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const tmpV = new THREE.Vector3();

  // ---- small timer / tween list ----
  const jobs = [];
  const wait = (sec, fn) => jobs.push({ t: 0, dur: sec, done: fn });
  const tween = (sec, step, done) => jobs.push({ t: 0, dur: sec, step, done });
  function runJobs(dt) {
    for (let i = jobs.length - 1; i >= 0; i--) {
      const j = jobs[i];
      j.t = Math.min(j.dur, j.t + dt);
      if (j.step) j.step(j.t / j.dur);
      if (j.t >= j.dur) { jobs.splice(i, 1); j.done && j.done(); }
    }
  }

  // ---- what lies on the desk in the current view ----
  const atWorkingPage = () => G.view === G.leaves.length;
  const nRightTotal = () => TOTAL_LEAVES - G.torn - G.view;
  const rightTexture = () => (atWorkingPage() ? (G.page ? G.tex : S.mats.parchmentTex) : G.leaves[G.view].front);
  const leftTexture = () => (G.view > 0 ? G.leaves[G.view - 1].back : pastedownTex);
  function setSurfaces() {
    book.setActiveTexture(rightTexture());
    book.setLeftTexture(leftTexture());
    book.setStacks(G.view, nRightTotal());
  }

  // ---- pages ----
  function makePage(i) {
    const page = createPage(PAGES[i], i, res);
    page.compose();
    const tex = S.canvasTex(page.canvas);
    console.log(`page ${i + 1}: ${page.lay.lines.map((l) => JSON.stringify(l.str)).join(' | ')}`);
    return { page, tex };
  }
  function activatePage(i, page, tex) {
    G.pageIndex = i; G.page = page; G.tex = tex;
    G.pageDone = false; G.versoTex = null; G.versoMirrored = null;
    G.budget = page.letterArea * BLOT_BUDGET;
    // trouble comes to every page but the first, somewhere between 10 and 40 seconds in
    G.writeTime = 0;
    G.quakeAt = i >= 1 ? 10 + Math.random() * 30 : null;
    hud.setPage(i + 1, PAGES.length);
    hud.setLayer('text');
    S.quill.setInk('black');
    hud.setInked(page.layers[0], page.layers[1]);
    hud.setSpill(0);
    setSurfaces();
  }

  function useLayer(i) {
    const P = G.page;
    if (P.layerIndex === i) return;
    P.layerIndex = i;
    P.ink.setLayer(P.layer);
    hud.setLayer(P.layer.name);
    S.quill.setInk(P.layer.name === 'initial' ? 'gold' : 'black');
  }

  // the quill takes gold when it touches the big letter and black ink when it touches the text
  function pickLayer(px, py) {
    const P = G.page, ink = P.ink;
    if (ink.nearestMask(px, py, 5, P.layers[1].mask) >= 0) useLayer(1);
    else if (ink.nearestMask(px, py, 5, P.layers[0].mask) >= 0) useLayer(0);
  }

  function checkProgress() {
    if (G.state !== 'write') return;
    const P = G.page, L = P.layer;
    hud.setInked(P.layers[0], P.layers[1]);
    hud.setSpill(P.totalBlot / G.budget);
    if (P.totalBlot >= G.budget) { ruinPage(); return; }
    if (!L.done && P.checkLetters(L)) hud.setInked(P.layers[0], P.layers[1]);
  }

  // called every frame: a layer is finished once its last letter has settled into solid paint
  function checkLayers() {
    if (G.state !== 'write' || !G.page) return;
    for (const L of G.page.layers) {
      if (!L.done && L.allLettersDone()) { completeLayer(L); return; }
    }
  }

  function completeLayer(L) {
    G.state = 'snap';
    G.penDown = false;
    const P = G.page;
    P.ink.lift();
    P.bakeLayer(L);
    P.dirty = true;
    hud.setInked(P.layers[0], P.layers[1]);
    wait(0.25, () => {
      if (P.layers.every((l) => l.done)) { finishPage(); return; }
      hud.showHint(L.name === 'text' ? 'The text is done. Now the big letter: the quill turns to gold on it.' : 'The initial shines. Now the text, in black.');
      wait(4, () => hud.hideHint());
      G.state = 'write';
    });
  }

  function finishPage() {
    G.state = 'bloom';
    const P = G.page;
    tween(BLOOM_SECS, (k) => { P.bloomT = k * BLOOM_SECS; P.dirty = true; }, () => {
      P.bloomT = BLOOM_SECS; P.dirty = true;
      P.compose(); G.tex.needsUpdate = true;
      G.pageDone = true;
      G.versoTex = S.canvasTex(makeVerso(G.page, res));
      G.versoMirrored = mirrorTexture(G.versoTex);
      if (G.pageIndex + 1 < PAGES.length) {
        const n = makePage(G.pageIndex + 1);
        G.nextPage = n.page; G.nextTex = n.tex;
      }
      G.state = 'done';
      hud.showHint('Done. Take the bottom corner of the page and turn it.');
    });
  }

  // ---- turning pages by hand ----
  const canForward = () => !book.busy && !turn.animating && (!atWorkingPage() || (G.pageDone && G.state === 'done'));
  const canBack = () => !book.busy && !turn.animating && G.view > 0 && (G.state === 'write' || G.state === 'done' || G.state === 'browse');

  // which page the hand is over, and whether it may be turned: 'fwd', 'back' or null
  function zoneAt(w) {
    if (!w) return null;
    const v = (w.z + PAGE_H / 2) / PAGE_H;          // 0 at the top edge of the page, 1 at the bottom
    if (v < 0 || v > 1) return null;
    const u = (w.x - SPINE_GAP / 2) / PAGE_W;         // across the right page
    if (u >= 0 && u <= 1) {
      if (!canForward()) return null;
      if (!atWorkingPage() || (u > 0.72 && v > 0.74)) return 'fwd';
      return null;
    }
    const ul = (w.x + SPINE_GAP / 2 + PAGE_W) / PAGE_W; // across the left page
    if (ul >= 0 && ul <= 1 && canBack()) return 'back';
    return null;
  }

  // lift the leaf off its stack, showing what lies beneath it
  function prepareTurn(kind) {
    if (kind === 'fwd') {
      const nR = nRightTotal();
      let front, backM, under;
      if (atWorkingPage()) {
        front = G.tex; backM = G.versoMirrored;
        under = G.nextPage ? G.nextTex : S.mats.parchmentTex;
      } else {
        const lf = G.leaves[G.view];
        front = lf.front; backM = lf.backMirrored;
        under = G.view + 1 < G.leaves.length ? G.leaves[G.view + 1].front : (G.page ? G.tex : S.mats.parchmentTex);
      }
      book.setActiveTexture(under);
      book.setStacks(G.view, nR - 1);
      book.prepareLeaf(1, front, backM, G.view, nR - 1);
    } else {
      const lf = G.leaves[G.view - 1];
      book.setLeftTexture(G.view - 1 > 0 ? G.leaves[G.view - 2].back : pastedownTex);
      book.setStacks(G.view - 1, nRightTotal());
      book.prepareLeaf(-1, lf.front, lf.backMirrored, G.view - 1, nRightTotal());
    }
  }

  function cancelTurn() {
    book.hideLeaf();
    setSurfaces();
  }

  function landTurn(kind) {
    book.hideLeaf();
    if (kind === 'fwd') {
      if (atWorkingPage()) {
        G.leaves.push({ front: G.tex, back: G.versoTex, backMirrored: G.versoMirrored });
        G.view = G.leaves.length;
        if (G.nextPage) {
          const p = G.nextPage, t = G.nextTex;
          G.nextPage = null; G.nextTex = null;
          activatePage(G.pageIndex + 1, p, t);
          G.state = 'write';
          hud.hideHint();
        } else {
          G.page = null; G.tex = null; G.pageDone = false;
          setSurfaces();
          closeBook();
        }
      } else {
        G.view++;
        setSurfaces();
        G.state = atWorkingPage() ? (G.pageDone ? 'done' : 'write') : 'browse';
        if (atWorkingPage()) hud.hideHint();
      }
    } else {
      G.view--;
      setSurfaces();
      G.state = 'browse';
      hud.showHint('Looking back. Turn the pages forward again to get back to your work.');
    }
    hud.setPage(G.pageIndex + 1, PAGES.length);
  }

  function setHover(kind) {
    if (turn.hover && turn.hover.kind === kind) return;
    if (turn.hover) { cancelTurn(); turn.hover = null; }
    if (kind) {
      prepareTurn(kind);
      book.setLeaf(HOVER_LIFT);
      turn.hover = { kind };
    }
  }

  function dragProgress(w) {
    const d = turn.drag;
    const raw = d.kind === 'fwd' ? (d.grabX - w.x) / DRAG_SPAN : (w.x - d.grabX) / DRAG_SPAN;
    return Math.min(1, Math.max(HOVER_LIFT, raw + HOVER_LIFT));
  }

  function endDrag() {
    const d = turn.drag;
    if (!d) return;
    turn.drag = null;
    const complete = !d.moved || d.p > 0.3;
    turn.animating = true;
    book.animateLeaf(complete ? 1 : 0, complete ? 0.25 + (1 - d.p) * 0.9 : 0.1 + d.p * 0.5, () => {
      turn.animating = false;
      if (complete) landTurn(d.kind); else cancelTurn();
    });
  }

  // a full animated turn, used by the debug helpers
  function autoTurn(kind) {
    const ok = kind === 'fwd' ? canForward() : canBack();
    if (!ok || turn.drag) return false;
    setHover(null);
    prepareTurn(kind);
    turn.animating = true;
    book.animateLeaf(1, 1.2, () => { turn.animating = false; landTurn(kind); });
    return true;
  }

  function closeBook() {
    G.state = 'closing';
    hud.hideHint();
    S.rig.setPose('end', 1.5);
    wait(0.5, () => book.startClose(() => {
      G.state = 'end';
      hud.showEnd(`${PAGES.length} pages copied, and the goose ate none of them. The bishop will be pleased.`);
    }));
  }

  function ruinPage() {
    G.state = 'ruin';
    G.penDown = false;
    setHover(null);
    hud.toast('That is a stain, not a letter. The leaf goes in the fire. Again.', 3200);
    const snap = S.canvasTex(G.page.snapshot());
    G.page.resetInk();
    G.page.compose();
    G.tex.needsUpdate = true;
    hud.setLayer('text'); S.quill.setInk('black');
    hud.setInked(G.page.layers[0], G.page.layers[1]); hud.setSpill(0);
    book.startTear(snap, () => { G.state = 'write'; snap.dispose(); });
    G.torn++;
    book.setStacks(G.view, nRightTotal());
  }

  function startQuake() {
    if (S.isQuaking()) return;
    S.quake(4.8, 0.03);
    hud.toast('Earthquake! Lift the quill until it passes.', 3200);
  }
  function tickTrouble(dt) {
    if (G.state !== 'write' || !atWorkingPage() || !G.page) return;
    G.writeTime += dt;
    if (G.quakeAt !== null && G.writeTime >= G.quakeAt) { G.quakeAt = null; startQuake(); }
  }

  function begin() {
    G.state = 'leaning';
    hud.hideCard();
    S.rig.pageY = book.activeY;
    S.rig.resetZoom();
    S.rig.setPose('write', 1.4);
    wait(1.4, () => {
      G.state = 'write';
      hud.showHint('Hold the left mouse button and run the nib along the letters. It fills them by itself, and turns to gold on the big one.');
    });
  }

  // ---- input ----
  function setNdc(cx, cy) { ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1); }
  function pointerWorld(cx, cy) {
    setNdc(cx, cy);
    ray.setFromCamera(ndc, S.camera);
    hoverPlane.constant = -book.activeY;
    const p = ray.ray.intersectPlane(hoverPlane, tmpV);
    return p ? { x: p.x, z: p.z } : null;
  }
  const canPaint = () => G.state === 'write' && atWorkingPage() && G.page && !turn.hover && !turn.drag && !book.busy;
  function paintAt(cx, cy) {
    setNdc(cx, cy);
    ray.setFromCamera(ndc, S.camera);
    const hit = ray.intersectObject(book.activePage, false)[0];
    if (!hit || !hit.uv) { G.page.ink.lift(); return; }
    const px = hit.uv.x * TEX_W, py = (1 - hit.uv.y) * TEX_H;
    pickLayer(px, py);
    const [, dBlot] = G.page.ink.drawTo(px, py);
    G.page.dirty = true;
    if (dBlot > 10) hud.spill();
    checkProgress();
  }
  function onMove(e) {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.has = true;
    const w = pointerWorld(e.clientX, e.clientY);
    pointer.world = w;
    if (turn.drag) {
      if (w) {
        const p = dragProgress(w);
        if (Math.abs(p - turn.drag.p) > 0.002) turn.drag.moved = true;
        turn.drag.p = p;
        book.setLeaf(p);
      }
      return;
    }
    if (G.penDown) { if (canPaint()) paintAt(e.clientX, e.clientY); return; }
    if (G.state === 'intro' || G.state === 'leaning' || G.state === 'end') return;
    setHover(zoneAt(w));
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (G.state === 'intro') { begin(); return; }
    try { canvas.setPointerCapture(e.pointerId); } catch { /* fine */ }
    pointer.world = pointerWorld(e.clientX, e.clientY);
    const zone = zoneAt(pointer.world);
    if (zone) {
      setHover(zone);
      turn.drag = { kind: zone, grabX: pointer.world.x, moved: false, p: HOVER_LIFT };
      turn.hover = null;
      hud.hideHint();
      return;
    }
    if (!canPaint()) return;
    G.penDown = true;
    G.page.ink.lift();
    hud.hideHint();
    onMove(e);
  });
  canvas.addEventListener('pointermove', (e) => {
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (list.length) for (const ev of list) onMove(ev); else onMove(e);
  });
  const penUp = () => {
    G.penDown = false;
    if (G.page) G.page.ink.lift();
    if (turn.drag) endDrag();
  };
  window.addEventListener('pointerup', penUp);
  window.addEventListener('pointercancel', penUp);
  canvas.addEventListener('pointerleave', () => { if (G.page) G.page.ink.lift(); if (!turn.drag) setHover(null); });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    if (S.rig.name !== 'write' || !(G.state === 'write' || G.state === 'done' || G.state === 'browse')) return;
    e.preventDefault();
    const p = pointerWorld(e.clientX, e.clientY);
    if (!p) return;
    S.rig.zoomAt(new THREE.Vector3(p.x, book.activeY, p.z), e.deltaY > 0 ? 1.18 : 1 / 1.18);
  }, { passive: false });
  document.getElementById('again').addEventListener('click', () => location.reload());

  function placeQuill() {
    if (!pointer.has || G.state === 'intro' || G.state === 'end') { S.quill.visible = false; return; }
    const p = pointerWorld(pointer.x, pointer.y);
    if (!p) { S.quill.visible = false; return; }
    S.quill.visible = true;
    S.quill.position.set(p.x, book.activeY + (G.penDown ? 0.001 : 0.014), p.z);
  }

  // ---- loop ----
  {
    const first = makePage(0);
    activatePage(0, first.page, first.tex);
  }
  let last = performance.now();
  function tick(dt) {
    S.update(dt);
    book.update(dt);
    hud.update(dt);
    runJobs(dt);
    placeQuill();
    if (G.page) { G.page.update(dt); checkLayers(); }
    tickTrouble(dt);
    if (G.page && G.page.dirty) { G.page.compose(); G.tex.needsUpdate = true; }
    S.renderer.render(S.scene, S.camera);
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---- dev panel: backquote or F2 ----
  const devEl = document.getElementById('dev');
  const markLayerDone = (L) => {
    L.compInside.set(L.compTotal); L.compStarted.fill(1); L.compDone.fill(1);
    L.inside = L.total;
    G.page.bakeLayer(L);
  };
  const dev = {
    layer() {
      if (!G.page || G.state !== 'write') return;
      const i = G.page.layers.findIndex((l) => !l.done);
      if (i < 0) return;
      useLayer(i);
      const L = G.page.layer;
      L.compInside.set(L.compTotal);
      G.page.checkLetters(L);
    },
    page() {
      if (!G.page || G.state !== 'write') return;
      setHover(null);
      G.page.snaps.length = 0;
      for (const L of G.page.layers) if (!L.done) markLayerDone(L);
      G.page.dirty = true;
      hud.setInked(G.page.layers[0], G.page.layers[1]);
      G.state = 'snap';
      finishPage();
    },
    skip() { for (const j of jobs) j.t = j.dur; },
    reset() {
      if (!G.page || !(G.state === 'write' || G.state === 'done') || !atWorkingPage()) return;
      setHover(null);
      G.page.resetInk();
      G.page.compose(); G.tex.needsUpdate = true;
      G.pageDone = false; G.versoTex = null; G.versoMirrored = null; G.nextPage = null; G.nextTex = null;
      hud.setLayer('text'); S.quill.setInk('black');
      hud.setInked(G.page.layers[0], G.page.layers[1]); hud.setSpill(0);
      hud.hideHint();
      G.state = 'write';
    },
    ruin() { if (G.page && G.state === 'write') { G.page.layer.blot = G.budget; checkProgress(); } },
    quake() { startQuake(); },
    // jump to page i with every earlier page finished and lying on the left
    jump(i) {
      if (!(G.state === 'write' || G.state === 'done' || G.state === 'browse')) return;
      setHover(null);
      G.leaves = [];
      for (let k = 0; k < i; k++) {
        const done = makePage(k);
        for (const L of done.page.layers) { done.page.bakeLayer(L); }
        done.page.bloomT = BLOOM_SECS; done.page.compose(); done.tex.needsUpdate = true;
        const back = S.canvasTex(makeVerso(done.page, res));
        G.leaves.push({ front: done.tex, back, backMirrored: mirrorTexture(back) });
      }
      G.view = G.leaves.length;
      G.nextPage = null; G.nextTex = null;
      const cur = makePage(i);
      activatePage(i, cur.page, cur.tex);
      hud.hideHint();
      G.state = 'write';
    },
  };
  document.getElementById('dev-pages').innerHTML = PAGES.map((_, i) => `<button data-act="jump" data-page="${i}">${i + 1}</button>`).join('');
  devEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'jump') dev.jump(Number(b.dataset.page)); else dev[act]();
  });
  const toggleDev = () => devEl.classList.toggle('gone');
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D' || e.key === '`' || e.key === 'F2') { toggleDev(); e.preventDefault(); }
  });
  document.getElementById('dev-toggle').addEventListener('click', toggleDev);

  // debug helpers for driving the game from the console
  window.__game = {
    G, book, S, hud, turn, tick, begin, THREE, surfaceY, dev,
    complete() { if (!G.page || G.state !== 'write') return; const i = G.page.layers.findIndex((l) => !l.done); if (i < 0) return; useLayer(i); const L = G.page.layer; L.compInside.set(L.compTotal); G.page.checkLetters(L); },
    ruin() { if (!G.page || G.state !== 'write') return; G.page.layer.blot = G.budget; checkProgress(); },
    flip(kind) { return autoTurn(kind); },   // 'fwd' or 'back'
    shot(name = 'shot') {
      S.renderer.render(S.scene, S.camera);
      return fetch('/__shot?name=' + name, { method: 'POST', body: canvas.toDataURL('image/png') });
    },
  };
}

main().catch((e) => { console.error(e); document.body.insertAdjacentHTML('beforeend', `<pre style="color:#fff;position:fixed;top:0;left:0;z-index:99">${e.stack}</pre>`); });
