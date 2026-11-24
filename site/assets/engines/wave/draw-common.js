// Drawing helpers shared by the wave engine's views. Drawing only: no physics here.
import { font, niceTicks, tickText } from '../../engine-kit.js';

/**
 * Split "f_c = 20 Hz" or "λ_{front}" into normal and subscript runs.
 * @returns {{ t: string, sub: boolean }[]}
 */
function runs(text) {
  const out = [];
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '_' && i + 1 < text.length) {
      if (buf) out.push({ t: buf, sub: false });
      buf = '';
      if (text[i + 1] === '{') {
        const j = text.indexOf('}', i + 2);
        const end = j < 0 ? text.length : j;
        out.push({ t: text.slice(i + 2, end), sub: true });
        i = end;
      } else {
        out.push({ t: text[i + 1], sub: true });
        i += 1;
      }
    } else buf += ch;
  }
  if (buf) out.push({ t: buf, sub: false });
  return out;
}

/** Width in CSS px of text drawn with rich(). */
export function richWidth(ctx, text, { px = 18, kind = 'label' } = {}) {
  ctx.save();
  let w = 0;
  for (const r of runs(text)) {
    ctx.font = font(kind, r.sub ? Math.round(px * 0.72) : px);
    w += ctx.measureText(r.t).width;
  }
  ctx.restore();
  return w;
}

/**
 * Text with simple subscripts: "v_s" or "λ_{front}". Options as engine-kit label(): colour, px, kind,
 * align ('left' | 'center' | 'right'), baseline ('alphabetic' | 'middle' | 'top' | 'bottom'), box (background).
 * @returns {number} the drawn width
 */
export function rich(ctx, text, x, y, { colour = '#121316', px = 18, kind = 'label', align = 'left', baseline = 'alphabetic', box = null, padding = 4 } = {}) {
  const parts = runs(text);
  const w = richWidth(ctx, text, { px, kind });
  let left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  // Convert the requested baseline to an alphabetic baseline.
  let base = y;
  if (baseline === 'middle') base = y + px * 0.35;
  else if (baseline === 'top') base = y + px * 0.8;
  else if (baseline === 'bottom') base = y - px * 0.25;
  ctx.save();
  if (box) {
    ctx.fillStyle = box;
    ctx.fillRect(left - padding, base - px * 0.82 - padding, w + 2 * padding, px * 1.12 + 2 * padding);
  }
  ctx.fillStyle = colour;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const r of parts) {
    const size = r.sub ? Math.round(px * 0.72) : px;
    ctx.font = font(kind, size);
    ctx.fillText(r.t, left, r.sub ? base + px * 0.22 : base);
    left += ctx.measureText(r.t).width;
  }
  ctx.restore();
  return w;
}

/** The first candidate string that fits in maxWidth (or the last one). */
export function fit(ctx, candidates, maxWidth, opts) {
  for (const c of candidates) if (richWidth(ctx, c, opts) <= maxWidth) return c;
  return candidates[candidates.length - 1];
}

/** Stroke style helper. dash: null | 'dashed' | 'dotted' | number[] */
export function stroke(ctx, colour, width, dash = null) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  if (dash === 'dashed') ctx.setLineDash([10, 7]);
  else if (dash === 'dotted') ctx.setLineDash([2.5, 5]);
  else if (Array.isArray(dash)) ctx.setLineDash(dash);
  else ctx.setLineDash([]);
}

/** Dimension line with end ticks between two points, label centred above (horizontal) or beside (vertical). */
export function dimension(ctx, x0, y0, x1, y1, { colour, width = 1.5, tick = 7 } = {}) {
  ctx.save();
  stroke(ctx, colour, width);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * tick;
  const ny = (dx / len) * tick;
  ctx.moveTo(x0 - nx, y0 - ny);
  ctx.lineTo(x0 + nx, y0 + ny);
  ctx.moveTo(x1 - nx, y1 - ny);
  ctx.lineTo(x1 + nx, y1 + ny);
  ctx.stroke();
  ctx.restore();
}

/**
 * Plot y = fn(x) across a viewport using min/max decimation per pixel column, so dense signals show
 * as their true band (never an aliased pattern) and sparse ones as a smooth curve.
 */
export function plotFunction(ctx, vp, fn, x0, x1, { colour, width = 3, dash = null, samples = 6, clip = true } = {}) {
  const X0 = vp.toX(x0);
  const X1 = vp.toX(x1);
  const cols = Math.max(2, Math.ceil(Math.abs(X1 - X0)));
  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(vp.rect.x - 2, vp.rect.y - 2, vp.rect.w + 4, vp.rect.h + 4);
    ctx.clip();
  }
  stroke(ctx, colour, width, dash);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let first = true;
  for (let c = 0; c < cols; c++) {
    let lo = Infinity;
    let hi = -Infinity;
    let a = 0;
    let b = 0;
    for (let k = 0; k <= samples; k++) {
      const x = x0 + ((x1 - x0) * (c + k / samples)) / cols;
      const v = fn(x);
      if (k === 0) a = v;
      if (k === samples) b = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const X = X0 + ((X1 - X0) * (c + 0.5)) / cols;
    const pts = a <= b ? [a, lo, hi, b] : [a, hi, lo, b];
    for (const v of pts) {
      const Y = vp.toY(v);
      if (first) {
        ctx.moveTo(X, Y);
        first = false;
      } else ctx.lineTo(X, Y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Light axes for scrolling time traces: frame-free grid at nice ticks, zero line, left axis, and
 * (optionally) time tick labels underneath. Avoids an axis line jumping to t = 0 as the window scrolls.
 */
export function traceAxes(ctx, vp, pal, { px = 18, xLabels = true, yTicks = [-1, 0, 1], xCount = 8, formatX = tickText, xTitle = null } = {}) {
  const { rect } = vp;
  ctx.save();
  const xt = niceTicks(vp.x[0], vp.x[1], xCount);
  stroke(ctx, pal.grid, 1);
  ctx.beginPath();
  for (const t of xt.ticks) {
    const X = Math.round(vp.toX(t)) + 0.5;
    ctx.moveTo(X, rect.y);
    ctx.lineTo(X, rect.y + rect.h);
  }
  for (const v of yTicks) {
    if (v === 0) continue;
    const Y = Math.round(vp.toY(v)) + 0.5;
    ctx.moveTo(rect.x, Y);
    ctx.lineTo(rect.x + rect.w, Y);
  }
  ctx.stroke();
  stroke(ctx, pal.axis, 1.5);
  ctx.beginPath();
  const Y0 = vp.toY(0);
  ctx.moveTo(rect.x, Y0);
  ctx.lineTo(rect.x + rect.w, Y0);
  ctx.moveTo(rect.x, rect.y);
  ctx.lineTo(rect.x, rect.y + rect.h);
  ctx.stroke();
  ctx.font = font('mono', px);
  ctx.fillStyle = pal.muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const v of yTicks) ctx.fillText(tickText(v), rect.x - 8, vp.toY(v));
  if (xLabels) {
    // The axis title sits at the right-hand end of the tick row; ticks that would touch it are skipped.
    const titleW = xTitle ? richWidth(ctx, xTitle, { px }) + px : 0;
    ctx.font = font('mono', px);
    ctx.fillStyle = pal.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const t of xt.ticks) {
      const X = vp.toX(t);
      const half = ctx.measureText(formatX(t)).width / 2;
      if (X - half < rect.x + 4 || X + half > rect.x + rect.w - titleW) continue;
      ctx.fillText(formatX(t), X, rect.y + rect.h + 6);
    }
    if (xTitle) rich(ctx, xTitle, rect.x + rect.w, rect.y + rect.h + 6, { colour: pal.ink, px, align: 'right', baseline: 'top' });
  }
  ctx.restore();
}

/**
 * Put an x-axis title in the tick-label row under the plot (never over the data): returns a formatX for
 * drawAxes that blanks tick labels touching the title, and a draw() for the title itself.
 */
export function xTitleOutside(ctx, vp, pal, { px = 18, title }) {
  const { rect } = vp;
  const titleLeft = rect.x + rect.w - richWidth(ctx, title, { px }) - px * 0.8;
  return {
    formatX: (v) => {
      const s = tickText(v);
      ctx.save();
      ctx.font = font('mono', px);
      const half = ctx.measureText(s).width / 2;
      ctx.restore();
      return vp.toX(v) + half > titleLeft ? '' : s;
    },
    draw: () => rich(ctx, title, rect.x + rect.w, rect.y + rect.h + 6, { colour: pal.ink, px, align: 'right', baseline: 'top' }),
  };
}

/** A short line sample for a legend, then its text. Returns the total width. */
export function legendItem(ctx, x, y, { colour, width = 3, dash = null, text, px, textColour }) {
  ctx.save();
  stroke(ctx, colour, width, dash);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + px * 2, y);
  ctx.stroke();
  ctx.restore();
  const w = rich(ctx, text, x + px * 2.5, y, { colour: textColour, px, baseline: 'middle' });
  return px * 2.5 + w;
}

/** CSS colour from linear-light sRGB channels already encoded to 0–1. */
export function rgbCss(r, g, b) {
  const c = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`;
}

/** Filled square marker (a second cue beside colour: shape). */
export function squareMarker(ctx, x, y, size, colour, outline = null) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);
  }
  ctx.restore();
}

export function dot(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
