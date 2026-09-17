// The illuminator's work: coloured field behind the initial, white pen filigree,
// a bar border down the inner margin and ivy sprays with gold bezants.
import { mulberry } from './textures.js';

export const PAL = {
  blue: '#2d4b95', red: '#b3311c', green: '#3c7a3a',
  gold: '#d5a63a', goldLight: '#f0d685', goldDark: '#8a6414',
  white: '#f7efdc', dark: '#2a190c',
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function spiral(ctx, cx, cy, rMax, turns, dir, phase) {
  const n = Math.round(50 * turns);
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = phase + dir * (i / n) * turns * Math.PI * 2;
    const r = rMax * (1 - 0.82 * i / n);
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 1.6, 0, 7); ctx.fill();
}

function dotTriplet(ctx, x, y, r) {
  for (const [dx, dy] of [[0, -r * 1.6], [-r * 1.4, r * 0.9], [r * 1.4, r * 0.9]]) {
    ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill();
  }
}

export function drawInitialUnder(ctx, box, field, seed = 1) {
  const rnd = mulberry(seed);
  const { x, y, w, h } = box;
  const col = PAL[field];
  // gold frame with a dark edge
  rr(ctx, x, y, w, h, 7);
  ctx.fillStyle = PAL.gold; ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2.2; ctx.stroke();
  // burnish highlight on the frame
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, 'rgba(255,240,190,0.35)'); g.addColorStop(0.5, 'rgba(255,240,190,0)'); g.addColorStop(1, 'rgba(120,80,20,0.25)');
  rr(ctx, x, y, w, h, 7); ctx.fillStyle = g; ctx.fill();
  // coloured field
  const p = 10;
  rr(ctx, x + p, y + p, w - 2 * p, h - 2 * p, 3);
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.2; ctx.stroke();
  // white pen-work
  ctx.strokeStyle = 'rgba(247,239,220,0.9)';
  ctx.fillStyle = 'rgba(247,239,220,0.9)';
  ctx.lineWidth = 1.5;
  const q = p + 8;
  rr(ctx, x + q, y + q, w - 2 * q, h - 2 * q, 2); ctx.stroke();
  const rMax = (w - 2 * q) * 0.19;
  const corners = [[x + q + rMax + 4, y + q + rMax + 4, 1], [x + w - q - rMax - 4, y + q + rMax + 4, -1],
    [x + q + rMax + 4, y + h - q - rMax - 4, -1], [x + w - q - rMax - 4, y + h - q - rMax - 4, 1]];
  corners.forEach(([cx, cy, dir], i) => spiral(ctx, cx, cy, rMax, 1.6, dir, i * Math.PI / 2 + 0.4 + rnd() * 0.3));
  // dot triplets at the mid-edges
  const r = 2;
  dotTriplet(ctx, x + w / 2, y + q + 10, r);
  dotTriplet(ctx, x + w / 2, y + h - q - 10, r);
  dotTriplet(ctx, x + q + 10, y + h / 2, r);
  dotTriplet(ctx, x + w - q - 10, y + h / 2, r);
}

// Outline around the gold letter, drawn over the ink so the painted edge looks crisp.
export function drawInitialOver(ctx, drawGlyph) {
  drawGlyph(ctx, null, PAL.dark, 4.5);
}

function leaf(ctx, x, y, ang, size, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.45, -size * 0.55, size * 1.05, -size * 0.38, size * 1.25, 0);
  ctx.bezierCurveTo(size * 1.05, size * 0.38, size * 0.45, size * 0.55, 0, 0);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(247,239,220,0.9)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(size * 0.2, 0); ctx.lineTo(size * 1.0, 0); ctx.stroke();
  ctx.restore();
}

function ivy(ctx, x, y, ang, size, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.2, -size * 0.5, size * 0.55, -size * 0.75, size * 0.7, -size * 0.35);
  ctx.bezierCurveTo(size * 1.0, -size * 0.45, size * 1.25, -size * 0.1, size * 1.2, 0);
  ctx.bezierCurveTo(size * 1.25, size * 0.1, size * 1.0, size * 0.45, size * 0.7, size * 0.35);
  ctx.bezierCurveTo(size * 0.55, size * 0.75, size * 0.2, size * 0.5, 0, 0);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(247,239,220,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(size * 0.15, 0); ctx.lineTo(size * 1.0, 0);
  ctx.moveTo(size * 0.35, 0); ctx.lineTo(size * 0.62, -size * 0.35);
  ctx.moveTo(size * 0.35, 0); ctx.lineTo(size * 0.62, size * 0.35);
  ctx.stroke();
  ctx.restore();
}

function bezant(ctx, x, y, r, rnd) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
  ctx.fillStyle = PAL.gold; ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, 7);
  ctx.fillStyle = 'rgba(255,246,205,0.85)'; ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 0.9;
  const base = rnd() * 6.28;
  for (let k = 0; k < 3; k++) {
    const a = base + k * 2.1 + rnd() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r + 1), y + Math.sin(a) * (r + 1));
    ctx.lineTo(x + Math.cos(a) * (r + 7 + rnd() * 7), y + Math.sin(a) * (r + 7 + rnd() * 7));
    ctx.stroke();
  }
}

function trefoil(ctx, x, y, ang, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  for (const [dx, dy] of [[8, 0], [2, -6], [2, 6]]) {
    ctx.beginPath(); ctx.arc(dx, dy, 5, 0, 7); ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}

// A curling stem with leaves on alternating sides and gold bezants around it.
function spray(ctx, x0, y0, a0, len, curl, colors, rnd, leafSize = 28) {
  const d = [Math.cos(a0), Math.sin(a0)], n = [-d[1], d[0]];
  const p0 = [x0, y0];
  const p1 = [x0 + d[0] * len * 0.35 - n[0] * len * curl * 0.35, y0 + d[1] * len * 0.35 - n[1] * len * curl * 0.35];
  const p2 = [x0 + d[0] * len * 0.72 + n[0] * len * curl * 1.1, y0 + d[1] * len * 0.72 + n[1] * len * curl * 1.1];
  const p3 = [x0 + d[0] * len + n[0] * len * curl, y0 + d[1] * len + n[1] * len * curl];
  const B = (t) => {
    const u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  };
  const T = (t) => {
    const u = 1 - t;
    const tx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const ty = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const l = Math.hypot(tx, ty) || 1;
    return [tx / l, ty / l];
  };
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]); ctx.stroke();
  const count = Math.max(2, Math.round(len / 62));
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 0.6);
    const p = B(t), tg = T(t);
    const side = i % 2 ? 1 : -1;
    const ang = Math.atan2(tg[1], tg[0]) + side * 1.15;
    const color = colors[i % colors.length];
    const size = leafSize * (0.85 + rnd() * 0.3) * (1 - t * 0.25);
    if (rnd() < 0.45) ivy(ctx, p[0], p[1], ang, size, color); else leaf(ctx, p[0], p[1], ang, size, color);
    // a bezant on the far side, a little back along the stem
    const tb = t - 0.5 / (count + 0.6);
    const pb = B(Math.max(0.05, tb)), tgb = T(Math.max(0.05, tb));
    const off = 14 + rnd() * 6;
    bezant(ctx, pb[0] - tgb[1] * -side * off, pb[1] + tgb[0] * -side * off, 4.5 + rnd() * 1.5, rnd);
  }
  const tip = B(1), tgt = T(1);
  trefoil(ctx, tip[0], tip[1], Math.atan2(tgt[1], tgt[0]), colors[0]);
}

// opts.barEnd: stop the bar there and keep the foot sprays small (a miniature sits below the text).
// opts.parts: which of { top, bar, bottom } to draw, so the game can reveal them one after another.
export function drawBorder(ctx, box, W, H, field, seed = 2, opts = null) {
  const rnd = mulberry(seed);
  const other = field === 'blue' ? 'red' : 'blue';
  const colors = [PAL[other], PAL.green, PAL[field]];
  const bx = box.x - 32, barW = 15;
  const compact = !!(opts && opts.barEnd);
  const parts = Object.assign({ top: true, bar: true, bottom: true }, opts && opts.parts);
  const yTop = box.y + box.h - 8, yBot = compact ? Math.min(H * 0.76, opts.barEnd) : H * 0.76;
  if (parts.bar) {
    // the bar: alternating coloured segments separated by gold knots
    let y = yTop, k = 0;
    const knots = [];
    while (y < yBot - 1) {
      const seg = Math.min(84 + rnd() * 30, yBot - y);
      ctx.fillStyle = k % 2 ? PAL[other] : PAL[field];
      ctx.fillRect(bx - barW / 2, y, barW, seg);
      y += seg; k++;
      if (y < yBot - 1) knots.push(y);
    }
    ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.4;
    ctx.strokeRect(bx - barW / 2, yTop, barW, yBot - yTop);
    ctx.strokeStyle = 'rgba(247,239,220,0.85)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(bx, yTop + 6); ctx.lineTo(bx, yBot - 6); ctx.stroke();
    for (const ky of knots) {
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(bx - barW / 2 - 3, ky - 6, barW + 6, 12);
      ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.2;
      ctx.strokeRect(bx - barW / 2 - 3, ky - 6, barW + 6, 12);
    }
    // sprays out of the bar's foot
    if (compact) {
      spray(ctx, bx, yBot, Math.PI * 0.5, 90, 0.4, colors, rnd, 18);
    } else {
      spray(ctx, bx, yBot, Math.PI * 0.42, 210, 0.55, colors, rnd, 30);
      spray(ctx, bx, yBot, Math.PI * 0.62, 120, -0.5, colors, rnd, 22);
    }
  }
  if (parts.top) {
    // small sprays from the initial's top corners
    spray(ctx, box.x - 6, box.y + 10, -Math.PI * 0.58, 110, 0.55, colors, rnd, 22);
    spray(ctx, box.x + box.w + 8, box.y + 6, -Math.PI * 0.35, 90, -0.5, colors, rnd, 19);
  }
  if (parts.bottom && !compact) {
    spray(ctx, box.x + 150, H * 0.885, 0.05, W * 0.44, -0.16, colors, rnd, 30);
    for (let i = 0; i < 7; i++) bezant(ctx, bx + 30 + rnd() * 300, H * 0.8 + rnd() * 140, 4 + rnd() * 2, rnd);
  }
}
