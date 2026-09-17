// A page: text layout, the pixel masks the game scores against, the faint guide
// the scribe follows, the illuminator's decoration, and the composite texture.
import { makeCanvas } from './textures.js';
import { TEX_W as W, TEX_H as H, TOL_PX, LETTER_AT, MAX_LINES } from './constants.js';

const SNAP_SECS = 0.5;   // a finished letter flashes and settles into solid paint over this long

// The illumination, once the words are done: the initial blooms, the border grows down the
// margin, then the picture is painted in with a soft sweep, a pale wash first and the colours after.
export const BLOOM_SECS = 7.6;
const BLOOM = { initial: [0, 1.3], bar: [0.7, 3.0], wash: [2.2, 6.2], colour: [3.3, 7.6] };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const phase = (T, [a, b]) => Math.min(1, Math.max(0, (T - a) / (b - a)));
const scratch = makeCanvas(W, H), scratchCtx = scratch.getContext('2d');

// Draw img through a soft diagonal wipe that has crossed fraction t of rect r (top-left to bottom-right).
function drawWipe(ctx, img, t, r, soft = 150) {
  if (t <= 0) return;
  if (t >= 1) { ctx.drawImage(img, 0, 0); return; }
  const vx = r.w, vy = r.h * 0.7;
  const len = Math.hypot(vx, vy);
  const front = t * (len + soft) - soft;             // the fully opaque edge along the sweep
  const alphaAt = (pos) => Math.min(1, Math.max(0, (front + soft - pos) / soft));
  scratchCtx.clearRect(0, 0, W, H);
  scratchCtx.drawImage(img, 0, 0);
  scratchCtx.globalCompositeOperation = 'destination-in';
  const g = scratchCtx.createLinearGradient(r.x, r.y, r.x + vx, r.y + vy);
  const stops = [0, front / len, (front + soft) / len, 1].filter((f) => f >= 0 && f <= 1).sort((a, b) => a - b);
  for (const f of stops) g.addColorStop(f, `rgba(0,0,0,${alphaAt(f * len).toFixed(3)})`);
  scratchCtx.fillStyle = g;
  scratchCtx.fillRect(0, 0, W, H);
  scratchCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(scratch, 0, 0);
}
import { Ink } from './paint.js';
import { drawInitialUnder, drawInitialOver, drawBorder, PAL } from './decor.js';
import { drawDrollery } from './drollery.js';

const BODY_FONT = (px) => `${px}px "Pirata One"`;
const INITIAL_FONT = (px) => `${px}px "Uncial Antiqua"`;

export const INK = [44, 28, 16];          // iron-gall ink
export const GOLD = [232, 196, 96];
export const GOLD_EDGE = [196, 148, 42];

const LAYOUT = { x0: 84, x1: W - 108, top: 156, font: 100, lh: 142, ls: 2, dropLines: 2, initialGap: 26, initialPad: 24 };
const EMBOLDEN = 1.5;   // stroke added to the body glyphs so the stems are worth tracing
const GUIDE_LINE = 'rgba(70,45,25,0.5)';
const GUIDE_FILL = 'rgba(70,45,25,0.13)';
const RULE = 'rgba(150,60,40,0.3)';

// Load the miniatures the pages ask for (public/pictures/<name>) before any page is built.
export async function loadPictures(pages) {
  const out = {};
  await Promise.all(pages.filter((p) => p.picture).map((p) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { out[p.picture] = img; resolve(); };
    img.onerror = () => { console.warn('picture missing: ' + p.picture); resolve(); };
    img.src = './pictures/' + p.picture;
  })));
  return out;
}

export async function loadFonts() {
  await Promise.all([
    document.fonts.load('100px "Pirata One"'),
    document.fonts.load('100px "Uncial Antiqua"'),
    document.fonts.load('20px "IM Fell English"'),
    document.fonts.load('italic 20px "IM Fell English"'),
  ]);
}

// Lay the text out; if it needs more than MAX_LINES the font steps down until it fits.
export function layoutText(text, ctx, base = LAYOUT, maxLines = MAX_LINES) {
  let lay = null;
  for (let font = base.font; font >= 64; font -= 2) {
    const L = { ...base, font, lh: Math.round(font * 1.42) };
    lay = layoutWith(text, ctx, L);
    if (lay.lines.length <= maxLines) break;
  }
  return lay;
}

// A miniature below the text: gold frame, lapis sky with gold stars, the picture on top.
function miniatureRect(img, lay) {
  const last = lay.lines[lay.lines.length - 1];
  const top = last.y + lay.L.font * 0.3 + 44;
  const maxW = lay.L.x1 - lay.L.x0 - 24, maxH = H - 72 - top;
  const k = Math.min(maxW / img.width, maxH / img.height);
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  return { x: Math.round((lay.L.x0 + lay.L.x1) / 2 - w / 2), y: Math.round(top), w, h };
}

function drawMiniature(ctx, img, r) {
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(r.x - 9, r.y - 9, r.w + 18, r.h + 18);
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2;
  ctx.strokeRect(r.x - 9.5, r.y - 9.5, r.w + 19, r.h + 19);
  ctx.fillStyle = PAL.blue;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(240,210,120,0.85)';
  for (let y = r.y + 14; y < r.y + r.h; y += 26) {
    for (let x = r.x + 14 + ((y / 26) | 0) % 2 * 13; x < r.x + r.w; x += 26) {
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill();
    }
  }
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2;
  ctx.strokeRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1);
}

function layoutWith(text, ctx, L) {
  ctx.font = BODY_FONT(L.font);
  ctx.letterSpacing = L.ls + 'px';
  const initialChar = text[0];
  const words = text.slice(1).split(' ');
  const boxSize = L.lh * L.dropLines - 10;
  const indent = boxSize + L.initialGap;
  const spaceW = ctx.measureText(' ').width;
  const lines = [];
  let cur = [], curW = 0, li = 0;
  const lineMax = (i) => (i < L.dropLines ? (L.x1 - L.x0 - indent) : (L.x1 - L.x0));
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    const add = cur.length ? spaceW + ww : ww;
    if (cur.length && curW + add > lineMax(li)) {
      lines.push({ words: cur, w: curW });
      cur = [w]; curW = ww; li++;
    } else { cur.push(w); curW += add; }
  }
  if (cur.length) lines.push({ words: cur, w: curW });
  const ascent = L.font * 0.72;
  lines.forEach((ln, i) => {
    ln.x = L.x0 + (i < L.dropLines ? indent : 0);
    ln.y = L.top + ascent + i * L.lh;
    ln.str = ln.words.join(' ');
  });
  const box = { x: L.x0, y: L.top - 6, w: boxSize, h: boxSize };
  // fit the initial glyph inside the box
  ctx.font = INITIAL_FONT(200); ctx.letterSpacing = '0px';
  const m = ctx.measureText(initialChar);
  const gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const inner = boxSize - 2 * L.initialPad;
  const fpx = 200 * Math.min(inner / gw, inner / gh);
  ctx.font = INITIAL_FONT(fpx);
  const m2 = ctx.measureText(initialChar);
  const gw2 = m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight, gh2 = m2.actualBoundingBoxAscent + m2.actualBoundingBoxDescent;
  const gx = box.x + L.initialPad + (inner - gw2) / 2 + m2.actualBoundingBoxLeft;
  const gy = box.y + L.initialPad + (inner - gh2) / 2 + m2.actualBoundingBoxAscent;
  return { lines, initial: { char: initialChar, box, fpx, gx, gy }, L };
}

function bodyDrawer(lay) {
  return (c, fill, stroke, lw) => {
    c.font = BODY_FONT(lay.L.font);
    c.letterSpacing = lay.L.ls + 'px';
    c.lineJoin = 'round';
    for (const ln of lay.lines) {
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.strokeText(ln.str, ln.x, ln.y); }
      if (fill) { c.fillStyle = fill; c.fillText(ln.str, ln.x, ln.y); }
    }
  };
}

function initialDrawer(lay) {
  const I = lay.initial;
  return (c, fill, stroke, lw) => {
    c.font = INITIAL_FONT(I.fpx);
    c.letterSpacing = '0px';
    c.lineJoin = 'round';
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.strokeText(I.char, I.gx, I.gy); }
    if (fill) { c.fillStyle = fill; c.fillText(I.char, I.gx, I.gy); }
  };
}

function raster(drawFn, threshold) {
  const c = makeCanvas(W, H), x = c.getContext('2d');
  drawFn(x);
  const d = x.getImageData(0, 0, W, H).data;
  const m = new Uint8Array(W * H);
  let n = 0;
  for (let i = 0, j = 3; i < m.length; i++, j += 4) if (d[j] > threshold) { m[i] = 1; n++; }
  return { m, n };
}

// A faint pencil-like ghost: a thin ring just outside the glyph plus a light interior.
function ghost(ctx, draw, embolden) {
  const t = makeCanvas(W, H), c = t.getContext('2d');
  draw(c, null, GUIDE_LINE, embolden + 3.2);
  c.globalCompositeOperation = 'destination-out';
  draw(c, '#000', '#000', embolden);
  c.globalCompositeOperation = 'source-over';
  draw(c, GUIDE_FILL, GUIDE_FILL, embolden);
  ctx.drawImage(t, 0, 0);
}

// Every connected blob of letter pixels (a letter, a joined pair, a full stop) gets a number.
function labelLetters(mask) {
  const comp = new Int32Array(W * H).fill(-1);
  const totals = [], boxes = [];
  const q = new Int32Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (!mask[s] || comp[s] >= 0) continue;
    const id = totals.length;
    let n = 0, qh = 0, qt = 0;
    const box = { x0: W, y0: H, x1: 0, y1: 0 };
    comp[s] = id; q[qt++] = s;
    while (qh < qt) {
      const i = q[qh++];
      n++;
      const x = i % W, y = (i / W) | 0;
      if (x < box.x0) box.x0 = x; if (x > box.x1) box.x1 = x;
      if (y < box.y0) box.y0 = y; if (y > box.y1) box.y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= W) continue;
          const j = yy * W + xx;
          if (mask[j] && comp[j] < 0) { comp[j] = id; q[qt++] = j; }
        }
      }
    }
    totals.push(n); boxes.push(box);
  }
  return { comp, totals, boxes };
}

// The crisp fill of one letter, cut out of the layer's perfect fill, plus a tinted twin for the flash.
function letterSprite(L, j, tint) {
  const b = L.compBox[j];
  const ox = b.x0 - 1, oy = b.y0 - 1, w = b.x1 - b.x0 + 3, h = b.y1 - b.y0 + 3;
  const c = makeCanvas(w, h), x = c.getContext('2d');
  x.drawImage(L.perfect, ox, oy, w, h, 0, 0, w, h);
  const id = x.getImageData(0, 0, w, h), d = id.data;
  const comp = L.comp;
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const px = ox + xx, py = oy + yy;
      let keep = false;
      if (px >= 0 && py >= 0 && px < W && py < H) {
        const i = py * W + px;
        keep = comp[i] === j || (px > 0 && comp[i - 1] === j) || (px < W - 1 && comp[i + 1] === j)
          || (py > 0 && comp[i - W] === j) || (py < H - 1 && comp[i + W] === j);
      }
      if (!keep) d[(yy * w + xx) * 4 + 3] = 0;
    }
  }
  x.putImageData(id, 0, 0);
  const t = makeCanvas(w, h), tx = t.getContext('2d');
  tx.drawImage(c, 0, 0);
  tx.globalCompositeOperation = 'source-in';
  tx.fillStyle = tint; tx.fillRect(0, 0, w, h);
  return { solid: c, tint: t, ox, oy };
}

function makeLayer(name, draw, embolden, ink, ink2, brushR, spreadR, perfectFill, tolPx = TOL_PX) {
  const mask = raster((c) => draw(c, '#000', '#000', embolden), 127);
  const tol = raster((c) => draw(c, '#000', '#000', embolden + 2 * tolPx), 60);
  const letters = labelLetters(mask.m);
  const perfect = makeCanvas(W, H);
  const pc = perfect.getContext('2d');
  draw(pc, perfectFill(pc), perfectFill(pc), embolden);
  const n = letters.totals.length;
  const layer = {
    name, mask: mask.m, tol: tol.m, total: mask.n, ink, ink2, brushR, spreadR, perfect,
    comp: letters.comp, compTotal: letters.totals, compBox: letters.boxes, compInside: new Int32Array(n),
    compStarted: new Uint8Array(n), compDone: new Uint8Array(n), sprites: {},
    tint: name === 'text' ? '#e09a2e' : '#fff3cf',
    painted: new Uint8Array(W * H), spreadA: new Uint8Array(W * H), inside: 0, blot: 0, done: false, snap: 0,
  };
  // specks too small to be a letter never need finishing
  for (let j = 0; j < n; j++) if (letters.totals[j] < 12) { layer.compStarted[j] = 1; layer.compDone[j] = 1; }
  layer.allLettersDone = () => { for (let j = 0; j < n; j++) if (!layer.compDone[j]) return false; return true; };
  return layer;
}

export function createPage(spec, index, res) {
  const mctx = makeCanvas(8, 8).getContext('2d');
  const pic = spec.picture && res.pictures ? res.pictures[spec.picture] : null;
  const lay = layoutText(spec.text, mctx, LAYOUT, pic ? 6 : MAX_LINES);
  const picRect = pic ? miniatureRect(pic, lay) : null;
  const drawBody = bodyDrawer(lay), drawInitial = initialDrawer(lay);
  const box = lay.initial.box;

  const textLayer = makeLayer('text', drawBody, EMBOLDEN, INK, null, 5.5, 16, () => `rgb(${INK.join(',')})`);
  const goldLayer = makeLayer('initial', drawInitial, 2, GOLD, GOLD_EDGE, 11, 30, (pc) => {
    const g = pc.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, '#f3d98a'); g.addColorStop(0.45, '#d9ad3c'); g.addColorStop(1, '#b8861c');
    return g;
  }, 5);

  // guide: ruling in plummet and a ghost of every glyph
  const guide = makeCanvas(W, H), gc = guide.getContext('2d');
  gc.strokeStyle = RULE; gc.lineWidth = 1.6;
  const lastLine = lay.lines[lay.lines.length - 1];
  gc.beginPath();
  for (const ln of lay.lines) { gc.moveTo(lay.L.x0 - 14, ln.y + 3); gc.lineTo(lay.L.x1 + 14, ln.y + 3); }
  gc.moveTo(lay.L.x0 - 8, lay.L.top - 30); gc.lineTo(lay.L.x0 - 8, lastLine.y + 40);
  gc.moveTo(lay.L.x1 + 8, lay.L.top - 30); gc.lineTo(lay.L.x1 + 8, lastLine.y + 40);
  gc.stroke();
  gc.strokeStyle = 'rgba(70,45,25,0.28)'; gc.lineWidth = 1.5;
  gc.strokeRect(box.x + 0.5, box.y + 0.5, box.w, box.h);
  ghost(gc, drawBody, EMBOLDEN);
  ghost(gc, drawInitial, 2);
  // the miniature stays invisible until the words are done: it appears with the colours only

  // the illuminator's work, in the three parts that come alive one after another
  const barEnd = picRect ? picRect.y - 40 : null;
  const dInitial = makeCanvas(W, H);
  drawInitialUnder(dInitial.getContext('2d'), box, spec.field, index * 7 + 1);
  drawBorder(dInitial.getContext('2d'), box, W, H, spec.field, index * 13 + 5, { barEnd, parts: { top: true, bar: false, bottom: false } });
  const dBar = makeCanvas(W, H);
  drawBorder(dBar.getContext('2d'), box, W, H, spec.field, index * 13 + 5, { barEnd, parts: { top: false, bar: true, bottom: false } });
  const dBottom = makeCanvas(W, H);
  if (pic) drawMiniature(dBottom.getContext('2d'), pic, picRect);
  else {
    drawBorder(dBottom.getContext('2d'), box, W, H, spec.field, index * 13 + 5, { barEnd, parts: { top: false, bar: false, bottom: true } });
    drawDrollery(dBottom.getContext('2d'), spec.drollery, W - 130, H - 118, 0.82);
  }
  // the pale first wash of the same picture
  const dBottomWash = makeCanvas(W, H);
  { const c = dBottomWash.getContext('2d'); c.filter = 'saturate(0.22) brightness(1.18) contrast(0.8)'; c.drawImage(dBottom, 0, 0); }
  const bottomRect = pic ? { x: picRect.x - 12, y: picRect.y - 12, w: picRect.w + 24, h: picRect.h + 24 }
    : { x: 0, y: Math.round(H * 0.7), w: W, h: H - Math.round(H * 0.7) };
  const barTop = box.y + box.h - 14;
  const decorOver = makeCanvas(W, H);
  drawInitialOver(decorOver.getContext('2d'), drawInitial);

  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d');
  const ink = new Ink(W, H);
  const page = {
    index, spec, lay, layers: [textLayer, goldLayer], layerIndex: 0, ink, guide, decorOver,
    canvas, bloomT: 0, dirty: true, snaps: [],
    initialCenter: { x: box.x + box.w / 2, y: box.y + box.h / 2 },
    get layer() { return this.layers[this.layerIndex]; },
    get totalBlot() { return this.layers.reduce((s, l) => s + l.blot, 0); },
    get letterArea() { return textLayer.total; },
  };
  ink.setLayer(textLayer);

  page.compose = () => {
    ctx.globalAlpha = 1;
    ctx.drawImage(res.parchment, 0, 0);
    ctx.drawImage(guide, 0, 0);
    const T = page.bloomT;
    const tI = phase(T, BLOOM.initial), tB = phase(T, BLOOM.bar), tW = phase(T, BLOOM.wash), tC = phase(T, BLOOM.colour);
    const inCircle = (img, k) => {
      if (k >= 1) { ctx.drawImage(img, 0, 0); return; }
      ctx.save();
      ctx.beginPath();
      ctx.arc(page.initialCenter.x, page.initialCenter.y, 30 + easeOutCubic(k) * 520, 0, 7);
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    if (tI > 0) inCircle(dInitial, tI);
    if (tB > 0) {
      if (tB >= 1) ctx.drawImage(dBar, 0, 0);
      else {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, barTop, W, (H - barTop) * easeOutCubic(tB));
        ctx.clip();
        ctx.drawImage(dBar, 0, 0);
        ctx.restore();
      }
    }
    if (tW > 0 && tC < 1) drawWipe(ctx, dBottomWash, tW, bottomRect);
    if (tC > 0) drawWipe(ctx, dBottom, tC, bottomRect);
    ctx.drawImage(ink.canvas, 0, 0);
    // letters that just got finished: a flash of colour, then the solid fill settles in
    for (const sn of page.snaps) {
      const k = sn.t, s = sn.sprite;
      const solidA = k < 0.35 ? 0 : (k - 0.35) / 0.65;
      const tintA = k < 0.35 ? k / 0.35 : Math.max(0, 1 - (k - 0.35) / 0.4);
      if (solidA > 0) { ctx.globalAlpha = solidA; ctx.drawImage(s.solid, s.ox, s.oy); }
      if (tintA > 0) { ctx.globalAlpha = tintA; ctx.drawImage(s.tint, s.ox, s.oy); }
      ctx.globalAlpha = 1;
    }
    if (tI > 0) inCircle(decorOver, tI);
    page.dirty = false;
  };

  // once a layer is finished its perfect fill becomes part of the ink for good
  page.bakeLayer = (L) => { ink.ctx.globalAlpha = 1; ink.ctx.drawImage(L.perfect, 0, 0); L.snap = 1; L.done = true; };

  // start the finishing flash on every letter of the layer that is inked far enough
  page.checkLetters = (L) => {
    let started = 0;
    for (let j = 0; j < L.compTotal.length; j++) {
      if (L.compStarted[j] || L.compInside[j] < L.compTotal[j] * LETTER_AT) continue;
      L.compStarted[j] = 1;
      // the letter counts as fully inked from here on
      L.inside += L.compTotal[j] - L.compInside[j];
      L.compInside[j] = L.compTotal[j];
      const b = L.compBox[j];
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const i = y * W + x; if (L.comp[i] === j) L.painted[i] = 1; }
      if (!L.sprites[j]) L.sprites[j] = letterSprite(L, j, L.tint);
      page.snaps.push({ L, j, t: 0, sprite: L.sprites[j] });
      started++;
    }
    if (started) page.dirty = true;
    return started;
  };

  page.update = (dt) => {
    if (!page.snaps.length) return;
    for (let i = page.snaps.length - 1; i >= 0; i--) {
      const sn = page.snaps[i];
      sn.t = Math.min(1, sn.t + dt / SNAP_SECS);
      if (sn.t >= 1) {
        ink.ctx.globalAlpha = 1;
        ink.ctx.drawImage(sn.sprite.solid, sn.sprite.ox, sn.sprite.oy);
        sn.L.compDone[sn.j] = 1;
        page.snaps.splice(i, 1);
      }
    }
    page.dirty = true;
  };

  page.resetInk = () => {
    ink.reset();
    page.snaps.length = 0;
    for (const L of page.layers) {
      L.painted.fill(0); L.spreadA.fill(0); L.compInside.fill(0); L.inside = 0; L.blot = 0; L.done = false; L.snap = 0;
      for (let j = 0; j < L.compTotal.length; j++) { const speck = L.compTotal[j] < 12; L.compStarted[j] = speck ? 1 : 0; L.compDone[j] = speck ? 1 : 0; }
    }
    page.layerIndex = 0; page.bloomT = 0;
    ink.setLayer(page.layers[0]);
    page.dirty = true;
  };

  page.snapshot = () => {
    const c = makeCanvas(W, H);
    c.getContext('2d').drawImage(canvas, 0, 0);
    return c;
  };
  return page;
}

// The back of a written leaf: parchment with the ink showing through, mirrored.
export function makeVerso(page, res) {
  const c = makeCanvas(W, H), x = c.getContext('2d');
  x.drawImage(res.parchment, 0, 0);
  x.save();
  x.translate(W, 0); x.scale(-1, 1);
  x.globalAlpha = 0.09;
  x.filter = 'blur(3px)';
  x.drawImage(page.ink.canvas, 0, 0);
  x.restore();
  return c;
}

export function drawParagraph(ctx, text, x, y, maxW, font, lh, color, ls = 1) {
  ctx.font = font; ctx.letterSpacing = ls + 'px'; ctx.fillStyle = color;
  const words = text.split(' ');
  const spaceW = ctx.measureText(' ').width;
  let line = '', lw = 0, yy = y;
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    if (line && lw + spaceW + ww > maxW) { ctx.fillText(line, x, yy); line = w; lw = ww; yy += lh; }
    else { line = line ? line + ' ' + w : w; lw += line === w ? ww : spaceW + ww; }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lh;
}

// The pastedown inside the front cover, with the owner's curse already written.
export function makePastedown(res, curse) {
  const c = makeCanvas(W, H), x = c.getContext('2d');
  x.drawImage(res.parchment, 0, 0);
  x.globalAlpha = 0.9;
  const first = curse[0], rest = curse.slice(1);
  x.font = BODY_FONT(60); x.letterSpacing = '1px';
  x.fillStyle = PAL.red;
  x.fillText(first, 150, 300);
  const fw = x.measureText(first).width;
  x.fillStyle = `rgb(${INK.join(',')})`;
  // first line continues after the red letter, the rest wraps below
  const words = rest.split(' ');
  let line = '', lw = 0, y = 300, xx = 150 + fw + 2, maxW = W - 300;
  const spaceW = x.measureText(' ').width;
  let firstLine = true;
  for (const w of words) {
    const ww = x.measureText(w).width;
    const room = firstLine ? maxW - fw : maxW;
    if (line && lw + spaceW + ww > room) {
      x.fillText(line, xx, y); y += 76; line = w; lw = ww; firstLine = false; xx = 150;
    } else { lw += line ? spaceW + ww : ww; line = line ? line + ' ' + w : w; }
  }
  if (line) x.fillText(line, xx, y);
  x.globalAlpha = 1;
  return c;
}

export { W as TEX_W, H as TEX_H };
