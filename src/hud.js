// Parchment scraps pinned around the view: page count, how much is inked, spilled ink.
const $ = (id) => document.getElementById(id);

export function createHud() {
  const els = {
    page: $('hud-page'), inked: $('hud-inked'), layer: $('hud-layer'), spill: $('spill'), spillTag: $('hud-spill'),
    hint: $('hint'), card: $('card'), toast: $('toast'), end: $('end'), endText: $('end-text'),
  };
  const sc = els.spill, sx = sc.getContext('2d');
  let spillShown = -1, bump = 0;

  function drawSpill(frac) {
    const w = sc.width, h = sc.height;
    sx.clearRect(0, 0, w, h);
    // the trough
    sx.fillStyle = 'rgba(80,60,30,0.12)';
    sx.fillRect(0, h * 0.3, w, h * 0.4);
    sx.strokeStyle = 'rgba(80,60,30,0.5)'; sx.lineWidth = 1;
    sx.strokeRect(0.5, h * 0.3 + 0.5, w - 1, h * 0.4);
    if (frac <= 0) return;
    const len = Math.max(6, frac * w);
    sx.fillStyle = frac >= 0.85 ? '#7a1f14' : '#2c1c10';
    sx.beginPath();
    sx.moveTo(0, h * 0.28);
    for (let x = 0; x <= len; x += 4) {
      const wob = Math.sin(x * 0.9) * 1.4 + Math.sin(x * 0.31 + 2) * 1.1;
      sx.lineTo(x, h * 0.28 + wob);
    }
    sx.lineTo(len + 5, h * 0.5);
    for (let x = len; x >= 0; x -= 4) {
      const wob = Math.sin(x * 0.7 + 1) * 1.4 + Math.sin(x * 0.27) * 1.1;
      sx.lineTo(x, h * 0.72 + wob);
    }
    sx.closePath();
    sx.fill();
    // a drip at the end
    sx.beginPath(); sx.arc(len + 3, h * 0.5, 3.2, 0, 7); sx.fill();
  }
  drawSpill(0);

  return {
    els,
    setPage(i, n) { els.page.textContent = `Page ${i} of ${n}`; },
    setLayer(name) { els.layer.textContent = name === 'text' ? 'Black ink' : 'Gold'; },
    setInked(textL, goldL) {
      const pct = (L) => (L.done ? 100 : Math.floor(Math.min(1, L.inside / L.total) * 100));
      els.inked.textContent = `Text ${pct(textL)}% · Initial ${pct(goldL)}%`;
    },
    setSpill(frac) {
      const q = Math.round(Math.min(1, frac) * 200) / 200;
      if (q !== spillShown) { spillShown = q; drawSpill(q); }
    },
    spill() { bump = 1; },
    update(dt) {
      if (bump > 0) {
        bump = Math.max(0, bump - dt * 3);
        const s = 1 + bump * 0.12;
        els.spillTag.style.transform = `rotate(-1.2deg) scale(${s})`;
      }
    },
    hideHint() { els.hint.classList.add('gone'); },
    showHint(text) { els.hint.textContent = text; els.hint.classList.remove('gone'); },
    hideCard() { els.card.classList.add('gone'); },
    toast(text, ms = 2600) {
      els.toast.textContent = text;
      els.toast.classList.remove('gone');
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => els.toast.classList.add('gone'), ms);
    },
    showEnd(text) { els.endText.textContent = text; els.end.classList.remove('gone'); },
  };
}
