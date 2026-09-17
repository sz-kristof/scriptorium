// Procedural canvases: parchment, oak, leather, page edges, the feather, the flame.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function grain(ctx, w, h, rnd, amount, warm = 1) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amount;
    d[i] += n; d[i + 1] += n * (0.85 + 0.15 * warm); d[i + 2] += n * (0.6 + 0.4 * warm);
  }
  ctx.putImageData(id, 0, 0);
}

export function parchmentCanvas(w, h, seed = 3) {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  const rnd = mulberry(seed);
  x.fillStyle = '#e6d6b0';
  x.fillRect(0, 0, w, h);
  // large soft mottling (the hair side of a skin is never even)
  for (let i = 0; i < 46; i++) {
    const cx = rnd() * w, cy = rnd() * h, r = (0.12 + rnd() * 0.32) * w;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    const dark = rnd() < 0.55;
    const tone = dark ? '176,142,92' : '236,222,184';
    g.addColorStop(0, `rgba(${tone},${0.05 + rnd() * 0.11})`);
    g.addColorStop(1, `rgba(${tone},0)`);
    x.fillStyle = g;
    x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  // veins: a few faint long streaks
  x.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    x.strokeStyle = `rgba(150,110,60,${0.03 + rnd() * 0.05})`;
    x.lineWidth = 6 + rnd() * 30;
    x.beginPath();
    let px = rnd() * w, py = rnd() * h;
    x.moveTo(px, py);
    const ang = rnd() * Math.PI;
    for (let k = 0; k < 6; k++) {
      px += Math.cos(ang + (rnd() - 0.5)) * w * 0.12;
      py += Math.sin(ang + (rnd() - 0.5)) * w * 0.12;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  grain(x, w, h, rnd, 16, 1);
  // follicle specks
  for (let i = 0; i < 1800; i++) {
    x.fillStyle = `rgba(110,80,40,${0.05 + rnd() * 0.09})`;
    const px = rnd() * w, py = rnd() * h, r = 0.5 + rnd() * 1.3;
    x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  // edges darken a little
  const g2 = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
  g2.addColorStop(0, 'rgba(110,75,30,0)');
  g2.addColorStop(1, 'rgba(110,75,30,0.2)');
  x.fillStyle = g2;
  x.fillRect(0, 0, w, h);
  return c;
}

export function noiseCanvas(size = 512, seed = 9) {
  const c = makeCanvas(size, size), x = c.getContext('2d');
  const rnd = mulberry(seed);
  const id = x.createImageData(size, size), d = id.data;
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (rnd() - 0.5) * 90;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  // a few low-frequency blobs so the bump is not pure static
  for (let i = 0; i < 60; i++) {
    const cx = rnd() * size, cy = rnd() * size, r = 10 + rnd() * 50;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    const v = rnd() < 0.5 ? 60 : 200;
    g.addColorStop(0, `rgba(${v},${v},${v},0.5)`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
    x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  return c;
}

export function woodCanvas(size = 1024, seed = 5) {
  const c = makeCanvas(size, size), x = c.getContext('2d');
  const rnd = mulberry(seed);
  x.fillStyle = '#4e3119';
  x.fillRect(0, 0, size, size);
  const boards = 3, bh = size / boards;
  for (let b = 0; b < boards; b++) {
    const y0 = b * bh;
    x.fillStyle = `rgba(${rnd() < 0.5 ? '90,55,28' : '40,22,10'},${0.08 + rnd() * 0.12})`;
    x.fillRect(0, y0, size, bh);
    const lam = 120 + rnd() * 300, ph = rnd() * 10;
    for (let k = 0; k < 170; k++) {
      const y = y0 + rnd() * bh;
      const dark = rnd() < 0.6;
      x.strokeStyle = dark ? `rgba(28,14,5,${0.08 + rnd() * 0.28})` : `rgba(160,110,60,${0.05 + rnd() * 0.16})`;
      x.lineWidth = 0.7 + rnd() * 2.6;
      const amp = 1.5 + rnd() * 7, ph2 = rnd() * 6;
      x.beginPath();
      for (let px = 0; px <= size; px += 16) {
        const py = y + Math.sin(px / lam + ph) * amp + Math.sin(px / (lam * 0.31) + ph2) * amp * 0.4;
        if (px === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.stroke();
    }
    // seam between boards
    x.strokeStyle = 'rgba(10,5,2,0.85)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, y0 + 1); x.lineTo(size, y0 + 1); x.stroke();
    x.strokeStyle = 'rgba(150,100,55,0.25)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(0, y0 + 4); x.lineTo(size, y0 + 4); x.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const cx = rnd() * size, cy = rnd() * size, r = 18 + rnd() * 26;
    for (let k = 6; k > 0; k--) {
      x.strokeStyle = `rgba(20,10,4,${0.25 + k * 0.05})`; x.lineWidth = 1.5;
      x.beginPath(); x.ellipse(cx, cy, r * k / 6 * 1.6, r * k / 6, 0.3, 0, 7); x.stroke();
    }
  }
  grain(x, size, size, rnd, 22, 1);
  return c;
}

export function leatherCanvas(size = 1024, tooled = false, seed = 11) {
  const c = makeCanvas(size, size), x = c.getContext('2d');
  const rnd = mulberry(seed);
  x.fillStyle = '#42261a';
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 26000; i++) {
    const light = rnd() < 0.5;
    x.fillStyle = light ? `rgba(120,80,50,${0.05 + rnd() * 0.12})` : `rgba(15,6,2,${0.05 + rnd() * 0.16})`;
    const px = rnd() * size, py = rnd() * size, r = 0.8 + rnd() * 2.2;
    x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  const g = x.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  if (tooled) {
    // blind tooling: a dark groove with a faint lit edge
    const tool = (draw) => {
      x.save(); x.translate(1.5, 1.5); x.strokeStyle = 'rgba(210,170,110,0.13)'; x.lineWidth = 3.5; draw(); x.stroke(); x.restore();
      x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 3; draw(); x.stroke();
    };
    const in1 = size * 0.07, in2 = size * 0.1;
    tool(() => { x.beginPath(); x.rect(in1, in1, size - 2 * in1, size - 2 * in1); });
    tool(() => { x.beginPath(); x.rect(in2, in2, size - 2 * in2, size - 2 * in2); });
    const mid = (in1 + in2) / 2, step = (size - 2 * mid) / 14;
    tool(() => {
      x.beginPath();
      for (let k = 0; k <= 14; k++) {
        const p = mid + k * step;
        for (const [px, py] of [[p, mid], [p, size - mid], [mid, p], [size - mid, p]]) { x.moveTo(px + 5, py); x.arc(px, py, 5, 0, 7); }
      }
    });
    const cx = size / 2, cy = size / 2, r = size * 0.2;
    tool(() => { x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy); x.closePath(); });
    tool(() => { const r2 = r * 0.86; x.beginPath(); x.moveTo(cx, cy - r2); x.lineTo(cx + r2, cy); x.lineTo(cx, cy + r2); x.lineTo(cx - r2, cy); x.closePath(); });
    tool(() => { x.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; const px = cx + Math.cos(a) * r * 0.3, py = cy + Math.sin(a) * r * 0.3; x.moveTo(px + r * 0.22, py); x.arc(px, py, r * 0.22, 0, 7); } });
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const px = cx + sx * (size * 0.5 - in2 - size * 0.075), py = cy + sy * (size * 0.5 - in2 - size * 0.075);
      tool(() => { x.beginPath(); for (let k = 0; k < 3; k++) { const a = Math.atan2(-sy, -sx) + (k - 1) * 0.7; x.moveTo(px, py); x.ellipse(px + Math.cos(a) * 22, py + Math.sin(a) * 22, 22, 9, a, 0, 7); } });
    }
  }
  return c;
}

export function edgesCanvas(size = 256, seed = 4) {
  const c = makeCanvas(size, size), x = c.getContext('2d');
  const rnd = mulberry(seed);
  x.fillStyle = '#dccba3';
  x.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 3) {
    x.fillStyle = `rgba(120,90,50,${0.12 + rnd() * 0.2})`;
    x.fillRect(0, y + rnd() * 1.5, size, 1);
  }
  grain(x, size, size, rnd, 18, 1);
  return c;
}

export function featherCanvas(w = 256, h = 1024, seed = 21) {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  const rnd = mulberry(seed);
  const cx = w / 2;
  // vane outline: tip at the top, wide near the bottom; the outer side is wider
  const wid = (f, side) => {
    const base = side > 0 ? 0.5 : 0.38;
    const k = f < 0.7 ? Math.pow(f / 0.7, 0.55) : 1 - Math.pow((f - 0.7) / 0.3, 2) * 0.35;
    return w * base * k;
  };
  const path = () => {
    x.beginPath();
    x.moveTo(cx, 0);
    for (let i = 1; i <= 40; i++) { const f = i / 40; x.lineTo(cx + wid(f, 1), f * h); }
    for (let i = 40; i >= 1; i--) { const f = i / 40; x.lineTo(cx - wid(f, -1), f * h); }
    x.closePath();
  };
  for (let y = 6; y < h; y += 3) {
    const f = y / h;
    if (rnd() < 0.06) { y += 6 + rnd() * 8; continue; }
    const tone = 226 + rnd() * 24;
    x.strokeStyle = `rgba(${tone},${tone - 6 - rnd() * 10},${tone - 26 - rnd() * 16},${0.7 + rnd() * 0.3})`;
    x.lineWidth = 1.2 + rnd() * 1.2;
    for (const side of [1, -1]) {
      const len = wid(f, side) + 4;
      x.beginPath();
      x.moveTo(cx, y);
      x.quadraticCurveTo(cx + side * len * 0.5, y - len * 0.45, cx + side * len, y - len * 0.7 + rnd() * 3);
      x.stroke();
    }
  }
  x.globalCompositeOperation = 'destination-in';
  x.fillStyle = '#fff'; path(); x.fill();
  x.globalCompositeOperation = 'source-over';
  const g = x.createLinearGradient(0, h * 0.6, 0, h);
  g.addColorStop(0, 'rgba(120,110,95,0)'); g.addColorStop(1, 'rgba(120,110,95,0.35)');
  x.fillStyle = g; path(); x.fill();
  return c;
}

export function flameCanvas(w = 64, h = 128) {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  x.beginPath();
  x.moveTo(w / 2, 4);
  x.bezierCurveTo(w * 0.95, h * 0.55, w * 0.9, h * 0.98, w / 2, h - 2);
  x.bezierCurveTo(w * 0.1, h * 0.98, w * 0.05, h * 0.55, w / 2, 4);
  x.closePath();
  const g = x.createRadialGradient(w / 2, h * 0.68, 2, w / 2, h * 0.6, h * 0.5);
  g.addColorStop(0, 'rgba(255,255,235,1)');
  g.addColorStop(0.25, 'rgba(255,225,140,0.95)');
  g.addColorStop(0.6, 'rgba(255,140,40,0.55)');
  g.addColorStop(1, 'rgba(255,80,10,0)');
  x.fillStyle = g;
  x.fill();
  const g2 = x.createRadialGradient(w / 2, h * 0.9, 1, w / 2, h * 0.9, w * 0.35);
  g2.addColorStop(0, 'rgba(120,150,255,0.6)'); g2.addColorStop(1, 'rgba(120,150,255,0)');
  x.fillStyle = g2; x.fillRect(0, h * 0.7, w, h * 0.3);
  return c;
}
