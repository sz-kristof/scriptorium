// Drolleries: the doodles bored scribes put in the margins. Flat colour, dark outline, a few white hairlines.
import { PAL } from './decor.js';

const C = { skin: '#e9caa2', cream: '#f1e6c8', ochre: '#c98a3a', brown: '#6d4426', grey: '#9c9282', pink: '#d98c86', habit: '#3b2b1f', foam: '#fbf6e8' };

function shape(ctx, path, fill, lw = 2.2) {
  path();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = lw; ctx.stroke();
}

function ground(ctx, w) {
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
  ctx.strokeStyle = PAL.green; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const gx = -w / 2 + (i + 0.5) * w / 8;
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.quadraticCurveTo(gx + 3, -8, gx + (i % 2 ? 6 : -5), -14); ctx.stroke();
  }
}

function snail(ctx) {
  shape(ctx, () => {
    ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-60, -22, -20, -24); ctx.lineTo(40, -26);
    ctx.quadraticCurveTo(70, -28, 78, -52); ctx.quadraticCurveTo(88, -30, 82, -8); ctx.quadraticCurveTo(70, 2, 40, 0); ctx.closePath();
  }, C.ochre);
  shape(ctx, () => { ctx.beginPath(); ctx.arc(-8, -58, 42, 0, 7); }, PAL.red);
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = i / 120 * Math.PI * 5, r = 42 * (1 - i / 120);
    const px = -8 + Math.cos(a) * r, py = -58 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(247,239,220,0.9)';
  for (const [dx, dy] of [[-30, -50], [10, -65], [22, -25], [-22, -16]]) { ctx.beginPath(); ctx.arc(-8 + dx, -58 + dy, 2.6, 0, 7); ctx.fill(); }
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2.4; ctx.fillStyle = PAL.dark;
  for (const [ex, ey] of [[70, -82], [86, -78]]) {
    ctx.beginPath(); ctx.moveTo(74, -50); ctx.quadraticCurveTo((74 + ex) / 2 - 4, ey - 6, ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, 7); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(76, -36, 6, 0.3, 2.6); ctx.stroke();
}

function goat(ctx) {
  ctx.lineCap = 'round';
  for (const [lw, col, end] of [[7, PAL.dark, -2], [4, C.cream, -5]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    for (const lx of [-34, -20, 22, 36]) { ctx.beginPath(); ctx.moveTo(lx, -40); ctx.lineTo(lx + (lx < 0 ? -4 : 4), end); ctx.stroke(); }
  }
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -62, 52, 28, 0, 0, 7); }, C.cream);
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(48, -78); ctx.quadraticCurveTo(62, -92, 58, -100); ctx.stroke();
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-40, -80); ctx.lineTo(-62, -118); ctx.lineTo(-44, -124); ctx.lineTo(-28, -84); ctx.closePath(); }, C.cream);
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(-68, -122, 24, 14, -0.35, 0, 7); }, C.cream);
  for (const [lw, col] of [[4, PAL.dark], [2, C.ochre]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    for (const off of [0, 8]) { ctx.beginPath(); ctx.moveTo(-58 + off, -132); ctx.quadraticCurveTo(-56 + off, -182, -18 + off, -174); ctx.stroke(); }
  }
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-84, -112); ctx.lineTo(-90, -90); ctx.lineTo(-74, -108); ctx.closePath(); }, C.cream, 1.6);
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(-50, -136, 9, 4, -0.6, 0, 7); }, C.cream, 1.6);
  ctx.fillStyle = PAL.dark; ctx.beginPath(); ctx.arc(-76, -126, 2.6, 0, 7); ctx.fill();
  // a roof tile, still in the mouth
  ctx.save(); ctx.translate(-93, -113); ctx.rotate(0.3);
  shape(ctx, () => { ctx.beginPath(); ctx.rect(-14, -6, 28, 12); }, PAL.red, 1.6);
  ctx.restore();
}

function monk(ctx) {
  shape(ctx, () => {
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-30, -70, -22, -108); ctx.lineTo(22, -108);
    ctx.quadraticCurveTo(30, -70, 34, 0); ctx.closePath();
  }, C.habit);
  ctx.strokeStyle = C.ochre; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-26, -66); ctx.quadraticCurveTo(0, -58, 26, -66); ctx.moveTo(10, -62); ctx.lineTo(8, -34); ctx.stroke();
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-22, -100); ctx.lineTo(-52, -60); ctx.lineTo(-38, -52); ctx.lineTo(-12, -84); ctx.closePath(); }, C.habit);
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(22, -100); ctx.lineTo(46, -136); ctx.lineTo(56, -128); ctx.lineTo(30, -90); ctx.closePath(); }, C.habit);
  shape(ctx, () => { ctx.beginPath(); ctx.arc(52, -140, 7, 0, 7); }, C.skin, 1.6);
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(54, -146); ctx.lineTo(58, -162); ctx.stroke();
  shape(ctx, () => { ctx.beginPath(); ctx.arc(-46, -54, 7, 0, 7); }, C.skin, 1.6);
  ctx.save(); ctx.translate(-50, -42); ctx.rotate(-0.4);
  shape(ctx, () => { ctx.beginPath(); ctx.rect(-12, -9, 24, 18); }, PAL.red, 1.6);
  ctx.strokeStyle = C.cream; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(-8, -5); ctx.lineTo(8, -5); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(-8, 5); ctx.lineTo(4, 5); ctx.stroke();
  ctx.restore();
  shape(ctx, () => { ctx.beginPath(); ctx.arc(0, -128, 20, 0, 7); }, C.skin);
  // tonsure: hair round the sides, bald on top
  ctx.strokeStyle = C.brown; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(0, -128, 17, Math.PI * 0.72, Math.PI * 1.28); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -128, 17, -Math.PI * 0.28, Math.PI * 0.28); ctx.stroke();
  ctx.fillStyle = PAL.dark;
  for (const ex of [-7, 7]) { ctx.beginPath(); ctx.arc(ex, -128, 2.2, 0, 7); ctx.fill(); }
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, -117); ctx.lineTo(6, -118); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-11, -138); ctx.lineTo(-3, -135); ctx.moveTo(11, -138); ctx.lineTo(3, -135); ctx.stroke();
}

function rabbit(ctx) {
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -46, 40, 44, 0, 0, 7); }, C.grey);
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(18, -6, 22, 8, 0, 0, 7); }, C.grey, 1.8);
  ctx.fillStyle = C.cream; ctx.beginPath(); ctx.ellipse(8, -40, 22, 30, 0, 0, 7); ctx.fill();
  for (const [ex, rot] of [[6, -0.25], [22, 0.08]]) {
    ctx.save(); ctx.translate(ex, -116); ctx.rotate(rot);
    shape(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -30, 8, 32, 0, 0, 7); }, C.grey, 1.8);
    ctx.fillStyle = C.pink; ctx.beginPath(); ctx.ellipse(0, -30, 4, 24, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(18, -100, 26, 22, 0, 0, 7); }, C.grey);
  ctx.fillStyle = PAL.dark;
  ctx.beginPath(); ctx.arc(30, -104, 2.6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(43, -96, 2.2, 0, 7); ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.4;
  for (const dy of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(41, -96 + dy); ctx.lineTo(60, -100 + dy * 2); ctx.stroke(); }
  ctx.lineCap = 'round';
  for (const [lw, col] of [[8, PAL.dark], [5, C.grey]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(24, -60); ctx.lineTo(50, -74); ctx.stroke(); }
  // the tankard
  ctx.save(); ctx.translate(60, -80); ctx.rotate(0.15);
  shape(ctx, () => { ctx.beginPath(); ctx.rect(-11, -14, 22, 30); }, C.brown, 1.8);
  ctx.strokeStyle = C.ochre; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-11, -4); ctx.lineTo(11, -4); ctx.moveTo(-11, 8); ctx.lineTo(11, 8); ctx.stroke();
  shape(ctx, () => { ctx.beginPath(); for (let k = 0; k < 4; k++) ctx.arc(-9 + k * 6, -15, 5, Math.PI, 0); ctx.closePath(); }, C.foam, 1.4);
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(14, 1, 7, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.restore();
}

// The goose. It may wear a stolen helmet, or the crown of a baron.
function goose(ctx, hat) {
  const orange = '#d98a2b';
  ctx.lineCap = 'round';
  // legs and webbed feet
  for (const [lw, col] of [[6, PAL.dark], [3.5, orange]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    for (const lx of [-8, 12]) { ctx.beginPath(); ctx.moveTo(lx, -34); ctx.lineTo(lx + 2, -4); ctx.stroke(); }
  }
  for (const lx of [-8, 12]) {
    shape(ctx, () => { ctx.beginPath(); ctx.moveTo(lx - 12, -2); ctx.lineTo(lx + 2, -8); ctx.lineTo(lx + 14, -2); ctx.closePath(); }, orange, 1.6);
  }
  // body and tail
  shape(ctx, () => {
    ctx.beginPath(); ctx.moveTo(-46, -60); ctx.quadraticCurveTo(-40, -92, 0, -92); ctx.quadraticCurveTo(40, -92, 50, -80);
    ctx.lineTo(74, -100); ctx.lineTo(56, -66); ctx.quadraticCurveTo(48, -34, 0, -32); ctx.quadraticCurveTo(-44, -34, -46, -60); ctx.closePath();
  }, C.cream);
  // wing
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-18, -74); ctx.quadraticCurveTo(10, -90, 46, -74); ctx.quadraticCurveTo(20, -50, -18, -74); ctx.closePath(); }, '#ece0c4', 1.6);
  ctx.strokeStyle = 'rgba(247,239,220,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-6, -74); ctx.lineTo(34, -70); ctx.moveTo(-2, -66); ctx.lineTo(28, -62); ctx.stroke();
  // neck, head, beak
  for (const [lw, col] of [[20, PAL.dark], [16, C.cream]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(-34, -78); ctx.quadraticCurveTo(-52, -100, -46, -128); ctx.quadraticCurveTo(-42, -146, -52, -156); ctx.stroke();
  }
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(-56, -160, 17, 13, -0.2, 0, 7); }, C.cream);
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-70, -166); ctx.lineTo(-98, -156); ctx.lineTo(-70, -152); ctx.closePath(); }, orange, 1.6);
  ctx.fillStyle = PAL.dark; ctx.beginPath(); ctx.arc(-60, -165, 2.6, 0, 7); ctx.fill();
  if (hat === 'helmet') {
    shape(ctx, () => { ctx.beginPath(); ctx.arc(-56, -170, 19, Math.PI, 0); ctx.lineTo(-37, -164); ctx.lineTo(-75, -164); ctx.closePath(); }, C.grey, 1.8);
    shape(ctx, () => { ctx.beginPath(); ctx.rect(-74, -172, 5, 16); }, C.grey, 1.4);   // nose guard
    ctx.strokeStyle = PAL.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-56, -188); ctx.quadraticCurveTo(-40, -200, -30, -190); ctx.stroke(); // plume
  } else if (hat === 'crown') {
    shape(ctx, () => {
      ctx.beginPath(); ctx.moveTo(-72, -172); ctx.lineTo(-74, -194); ctx.lineTo(-64, -182); ctx.lineTo(-56, -198);
      ctx.lineTo(-48, -182); ctx.lineTo(-38, -194); ctx.lineTo(-40, -172); ctx.closePath();
    }, PAL.gold, 1.6);
    ctx.fillStyle = PAL.red;
    for (const [dx, dy] of [[-64, -176], [-56, -176], [-48, -176]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.2, 0, 7); ctx.fill(); }
  }
}

// A hen, for the decree about chickens.
function hen(ctx) {
  const orange = '#d98a2b';
  ctx.lineCap = 'round';
  for (const [lw, col, end] of [[5, PAL.dark, -2], [3, orange, -5]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    for (const lx of [-6, 10]) { ctx.beginPath(); ctx.moveTo(lx, -30); ctx.lineTo(lx + 2, -4); ctx.stroke(); }
  }
  for (const lx of [-6, 10]) shape(ctx, () => { ctx.beginPath(); ctx.moveTo(lx - 9, -2); ctx.lineTo(lx + 2, -7); ctx.lineTo(lx + 12, -2); ctx.closePath(); }, orange, 1.4);
  // body with a fan of tail feathers
  shape(ctx, () => {
    ctx.beginPath(); ctx.moveTo(-40, -52); ctx.quadraticCurveTo(-30, -84, 6, -82); ctx.quadraticCurveTo(34, -80, 40, -60);
    ctx.lineTo(70, -96); ctx.lineTo(62, -70); ctx.lineTo(78, -74); ctx.lineTo(56, -54);
    ctx.quadraticCurveTo(44, -30, 4, -28); ctx.quadraticCurveTo(-38, -30, -40, -52); ctx.closePath();
  }, C.ochre);
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-14, -66); ctx.quadraticCurveTo(14, -78, 36, -62); ctx.quadraticCurveTo(16, -44, -14, -66); ctx.closePath(); }, '#b8742a', 1.6);
  // neck and head
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-36, -62); ctx.quadraticCurveTo(-50, -80, -46, -100); ctx.lineTo(-30, -96); ctx.quadraticCurveTo(-30, -78, -22, -70); ctx.closePath(); }, C.ochre, 1.8);
  shape(ctx, () => { ctx.beginPath(); ctx.arc(-42, -108, 14, 0, 7); }, C.ochre);
  // comb and wattle
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-54, -116); ctx.lineTo(-52, -132); ctx.lineTo(-44, -122); ctx.lineTo(-40, -136); ctx.lineTo(-34, -122); ctx.lineTo(-28, -130); ctx.lineTo(-30, -114); ctx.closePath(); }, PAL.red, 1.4);
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(-46, -94, 4, 7, 0.3, 0, 7); }, PAL.red, 1.2);
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-54, -110); ctx.lineTo(-70, -104); ctx.lineTo(-54, -100); ctx.closePath(); }, orange, 1.4);
  ctx.fillStyle = PAL.dark; ctx.beginPath(); ctx.arc(-46, -111, 2.4, 0, 7); ctx.fill();
  // an egg
  shape(ctx, () => { ctx.beginPath(); ctx.ellipse(72, -10, 9, 12, 0.3, 0, 7); }, C.cream, 1.4);
}

// A mouse, for the treasury's excuse.
function mouse(ctx) {
  ctx.lineCap = 'round';
  // tail
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(38, -12); ctx.quadraticCurveTo(80, -20, 92, -50); ctx.stroke();
  ctx.strokeStyle = C.pink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(38, -12); ctx.quadraticCurveTo(80, -20, 92, -50); ctx.stroke();
  // body and head in one teardrop
  shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-60, -10); ctx.quadraticCurveTo(-30, -62, 10, -52); ctx.quadraticCurveTo(46, -44, 42, -6); ctx.quadraticCurveTo(0, 4, -60, -10); ctx.closePath(); }, C.grey);
  // ears
  for (const ex of [-30, -10]) {
    shape(ctx, () => { ctx.beginPath(); ctx.arc(ex, -56, 11, 0, 7); }, C.grey, 1.6);
    ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(ex, -56, 6, 0, 7); ctx.fill();
  }
  ctx.fillStyle = PAL.dark; ctx.beginPath(); ctx.arc(-38, -34, 2.4, 0, 7); ctx.fill();
  ctx.fillStyle = C.pink; ctx.beginPath(); ctx.arc(-60, -12, 3, 0, 7); ctx.fill();
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.2;
  for (const dy of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(-56, -14 + dy); ctx.lineTo(-76, -18 + dy * 2); ctx.stroke(); }
  // feet
  ctx.strokeStyle = PAL.dark; ctx.lineWidth = 3;
  for (const fx of [-30, 20]) { ctx.beginPath(); ctx.moveTo(fx, -8); ctx.lineTo(fx - 6, -1); ctx.moveTo(fx, -8); ctx.lineTo(fx + 4, -1); ctx.stroke(); }
  // a coin it is making off with
  shape(ctx, () => { ctx.beginPath(); ctx.arc(-14, -20, 9, 0, 7); }, PAL.gold, 1.4);
}

// Goose footprints, for the page where the goose is absent.
function footprints(ctx) {
  const orange = '#d98a2b';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const print = (x, y, a, mirror) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); if (mirror) ctx.scale(-1, 1);
    shape(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-12, -10); ctx.lineTo(0, -6); ctx.lineTo(12, -10); ctx.closePath(); }, orange, 1.4);
    ctx.strokeStyle = PAL.dark; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -16); ctx.stroke();
    ctx.restore();
  };
  let x = -80, y = -8, a = -0.5;
  for (let i = 0; i < 7; i++) {
    print(x, y + (i % 2 ? 0 : -18), a, i % 2 === 1);
    x += 26; y -= 10; a += 0.12;
  }
}

const DROLLERIES = {
  snail, goat, monk, rabbit, hen, mouse, footprints,
  goose: (ctx) => goose(ctx, null),
  'goose-helmet': (ctx) => goose(ctx, 'helmet'),
  'goose-crown': (ctx) => goose(ctx, 'crown'),
};

// Draw a margin creature standing on the ground point (x, y).
export function drawDrollery(ctx, kind, x, y, scale = 1) {
  const fn = DROLLERIES[kind];
  if (!fn) return;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ground(ctx, 190);
  fn(ctx);
  ctx.restore();
}
