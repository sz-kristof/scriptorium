// The ink layer: a transparent canvas the quill stamps into, plus a per-layer
// bitmap of what has been painted so coverage and spills are counted per pixel.
import { makeCanvas } from './textures.js';

export class Ink {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.canvas = makeCanvas(w, h);
    this.ctx = this.canvas.getContext('2d');
    this.layer = null;
    this.last = null;
    this.r = 6;
    this.sprite = null;
  }

  reset() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.last = null;
  }

  // layer: { mask, tol, painted, spreadA, inside, blot, ink: [r,g,b], ink2?: [r,g,b], brushR, spreadR }
  setLayer(layer) {
    this.layer = layer;
    this.last = null;
    this.r = layer.brushR;
    // scratch buffers for the spread flood (a disc of radius spreadR around the nib)
    const size = 2 * layer.spreadR + 1;
    this.sSize = size;
    this.sVisited = new Uint8Array(size * size);
    this.sQueue = new Int32Array(size * size);
    this.sImg = new ImageData(size, size);
    this.sCanvas = makeCanvas(size, size);
    this.sCtx = this.sCanvas.getContext('2d');
    const r = this.r, s = Math.ceil(r * 2 + 4);
    const c = makeCanvas(s, s), x = c.getContext('2d');
    const [a, b, d] = layer.ink, [a2, b2, d2] = layer.ink2 || layer.ink;
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, r);
    g.addColorStop(0, `rgba(${a},${b},${d},1)`);
    g.addColorStop(0.62, `rgba(${a2},${b2},${d2},0.95)`);
    g.addColorStop(1, `rgba(${a2},${b2},${d2},0)`);
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    this.sprite = c;
  }

  lift() { this.last = null; }

  // Move the nib to (x, y) in texture px; stamps along the way. Returns [insideAdded, blotAdded].
  drawTo(x, y) {
    let dIn = 0, dBlot = 0;
    if (this.last) {
      const dx = x - this.last.x, dy = y - this.last.y;
      const dist = Math.hypot(dx, dy);
      const n = Math.max(1, Math.ceil(dist / (this.r * 0.32)));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const res = this.stamp(this.last.x + dx * t, this.last.y + dy * t);
        dIn += res[0]; dBlot += res[1];
      }
    } else {
      const res = this.stamp(x, y);
      dIn += res[0]; dBlot += res[1];
    }
    this.last = { x, y };
    return [dIn, dBlot];
  }

  stamp(x, y) {
    const L = this.layer;
    const { mask, tol, painted } = L;
    const ix = Math.round(x), iy = Math.round(y);
    const inLetter = ix >= 0 && iy >= 0 && ix < this.w && iy < this.h && mask[iy * this.w + ix] === 1;
    let dIn = 0, dBlot = 0;
    if (!inLetter) {
      // the nib is off the letter: the round mark goes down as it is, and whatever lies
      // outside the tolerance zone is a spill
      const jit = 0.92 + Math.random() * 0.16;
      const s = this.sprite.width * jit;
      this.ctx.globalAlpha = 0.82;
      this.ctx.drawImage(this.sprite, x - s / 2 + (Math.random() - 0.5) * 0.8, y - s / 2 + (Math.random() - 0.5) * 0.8, s, s);
      const rc = this.r, rc2 = rc * rc;   // every pixel the nib touches counts
      const x0 = Math.max(0, Math.floor(x - rc)), x1 = Math.min(this.w - 1, Math.ceil(x + rc));
      const y0 = Math.max(0, Math.floor(y - rc)), y1 = Math.min(this.h - 1, Math.ceil(y + rc));
      for (let py = y0; py <= y1; py++) {
        const dy = py - y;
        let i = py * this.w + x0;
        for (let px = x0; px <= x1; px++, i++) {
          const dx = px - x;
          if (dx * dx + dy * dy > rc2 || painted[i]) continue;
          painted[i] = 1;
          if (mask[i]) { dIn++; L.compInside[L.comp[i]]++; }
          else if (!tol[i]) dBlot++;
        }
      }
      L.inside += dIn; L.blot += dBlot;
    }
    // inside a letter the ink only flows within it, out to its borders; just outside, it still
    // finds its way in
    const seed = inLetter ? iy * this.w + ix : this.nearestMask(x, y, 4);
    if (seed >= 0) dIn += this.spread(seed % this.w, (seed / this.w) | 0, x, y);
    return [dIn, dBlot];
  }

  // index of the letter pixel closest to (x, y) within radius r, or -1
  nearestMask(x, y, r, mask = this.layer.mask) {
    const w = this.w, h = this.h;
    const cx = Math.round(x), cy = Math.round(y);
    let best = -1, bestD = r * r + 1;
    for (let py = Math.max(0, cy - r); py <= Math.min(h - 1, cy + r); py++) {
      for (let px = Math.max(0, cx - r); px <= Math.min(w - 1, cx + r); px++) {
        const i = py * w + px;
        if (!mask[i]) continue;
        const d = (px - x) * (px - x) + (py - y) * (py - y);
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    return best;
  }

  // Flood the letter around the seed: a disc of radius spreadR, 4-connected through
  // letter pixels only, so it stops at the letter's edge and never crosses a gap.
  // Ink is full near the nib and thins toward the rim; a pixel's ink only ever grows.
  spread(sx, sy, nx, ny) {
    const L = this.layer, w = this.w, h = this.h;
    const { mask, painted, spreadA } = L;
    const R = L.spreadR, Rc = R * 0.9, R0 = R * 0.6, size = this.sSize;
    const x0 = sx - R, y0 = sy - R;
    const vis = this.sVisited, q = this.sQueue, img = this.sImg.data;
    vis.fill(0); img.fill(0);
    const [cr, cg, cb] = L.ink;
    let qh = 0, qt = 0, added = 0, any = false;
    const start = R * size + R;
    q[qt++] = start; vis[start] = 1;
    while (qh < qt) {
      const c = q[qh++];
      const lx = c % size, ly = (c / size) | 0;
      const px = x0 + lx, py = y0 + ly;
      const i = py * w + px;
      const d = Math.hypot(px - nx, py - ny);
      const target = d <= R0 ? 255 : Math.max(0, 255 * (1 - (d - R0) / (R - R0) * 0.65)) | 0;
      const prev = spreadA[i];
      if (target > prev) {
        const k = c * 4;
        img[k] = cr; img[k + 1] = cg; img[k + 2] = cb;
        img[k + 3] = (255 * (target - prev) / (255 - prev)) | 0;
        spreadA[i] = target;
        any = true;
      }
      if (d <= Rc && !painted[i]) { painted[i] = 1; added++; L.compInside[L.comp[i]]++; }
      // neighbours, kept inside the disc and on letter pixels
      for (let n = 0; n < 4; n++) {
        const lx2 = lx + (n === 0 ? 1 : n === 1 ? -1 : 0), ly2 = ly + (n === 2 ? 1 : n === 3 ? -1 : 0);
        if (lx2 < 0 || ly2 < 0 || lx2 >= size || ly2 >= size) continue;
        const ex = lx2 - R, ey = ly2 - R;
        if (ex * ex + ey * ey > R * R) continue;
        const px2 = x0 + lx2, py2 = y0 + ly2;
        if (px2 < 0 || py2 < 0 || px2 >= w || py2 >= h) continue;
        const c2 = ly2 * size + lx2;
        if (vis[c2] || !mask[py2 * w + px2]) continue;
        vis[c2] = 1; q[qt++] = c2;
      }
    }
    if (any) {
      this.sCtx.putImageData(this.sImg, 0, 0);
      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(this.sCanvas, x0, y0);
    }
    L.inside += added;
    return added;
  }
}
