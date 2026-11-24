// Shared drawing helpers for the particle2d views (drawing only; no physics).
import { label, arrow, font, viewport, axisMargins, drawAxes } from '../../../engine-kit.js';
import { formatNumber, formatQuantity, siPrefix } from '../../../format.js';

export { label, arrow, font, viewport, axisMargins, drawAxes };

/** A label never receives a number near underflow (|v| < 1e-200 is shown as 0). */
const safe = (v) => (typeof v === 'number' && v !== 0 && Math.abs(v) < 1e-200 ? 0 : v);
/** "40.8 m": a computed value, 3 significant figures. */
export const q = (v, unit = '', sf = 3) => formatQuantity(safe(v), unit, { sigfigs: sf });
/** SI-prefixed value: 3.00 × 10⁵ J → "300 kJ". */
export const si = (v, unit) => siPrefix(safe(v), unit);
export const num = (v, sf = 3) => formatNumber(safe(v), { sigfigs: sf });

export function textWidth(ctx, text, px, kind = 'label') {
  ctx.font = font(kind, px);
  return ctx.measureText(text).width;
}

/**
 * Text with subscripts, e.g. rich(ctx, ['v', { sub: 'x' }, ' = 14.1 m/s'], x, y, …).
 * Returns the drawn width.
 */
export function rich(ctx, parts, x, y, { px = 18, colour = '#121316', kind = 'label', align = 'left', baseline = 'alphabetic', box = null } = {}) {
  const items = parts.map((p) => (typeof p === 'string' ? { text: p, size: px, dy: 0 } : { text: p.sub, size: Math.round(px * 0.72), dy: px * 0.28 }));
  let total = 0;
  for (const it of items) {
    ctx.font = font(kind, it.size);
    it.w = ctx.measureText(it.text).width;
    total += it.w;
  }
  let left = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  // Keep the text inside the stage (labels at arrow tips near an edge would otherwise be cut off).
  const cw = ctx.canvas?.clientWidth || 0;
  if (cw > 0) left = Math.max(4, Math.min(left, cw - total - 4));
  ctx.save();
  ctx.textBaseline = baseline;
  if (box) {
    const top = baseline === 'middle' ? y - px * 0.62 : baseline === 'top' ? y - 3 : y - px * 0.9;
    ctx.fillStyle = box;
    ctx.fillRect(left - 4, top, total + 8, px * 1.3);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = colour;
  for (const it of items) {
    ctx.font = font(kind, it.size);
    ctx.fillText(it.text, left, y + it.dy);
    left += it.w;
  }
  ctx.restore();
  return total;
}

/** Shorten text with an ellipsis to fit maxW (narrow stages). */
export function fitText(ctx, text, maxW, px, kind = 'label') {
  ctx.font = font(kind, px);
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo).trimEnd()}…`;
}

/** Header line: a strong left title and a mono right value (both ≥ the stage font size). */
export function header(ctx, S, pal, left, right) {
  const y = S.pad + S.px * 0.9;
  const rightW = right ? textWidth(ctx, right, S.px, 'mono') + S.px : 0;
  if (right) label(ctx, right, S.W - S.pad, y, { colour: pal.ink, px: S.px, kind: 'mono', align: 'right' });
  if (left) {
    const parts = Array.isArray(left) ? left : [fitText(ctx, left, S.W - 2 * S.pad - rightW, S.px, 'strong')];
    rich(ctx, parts, S.pad, y, { px: S.px, colour: pal.ink, kind: 'strong' });
  }
  return S.pad + S.px * 1.8;
}

/** A second header line in muted text (conditions and assumptions that depend on the params). */
export function subheader(ctx, S, pal, text, y) {
  label(ctx, fitText(ctx, text, S.W - 2 * S.pad, S.px), S.pad, y + S.px * 0.9, { colour: pal.muted, px: S.px });
  return y + S.px * 1.6;
}

/** Bottom-centre status line (an event: "Landed", "Stopped") on a flat box. */
export function status(ctx, S, pal, text, y = S.H - S.pad * 0.6) {
  label(ctx, text, S.W / 2, y, { colour: pal.ink, px: S.px, kind: 'strong', align: 'center', baseline: 'bottom', box: pal.bg, padding: 6 });
}

/** Smallest "nice" number ≥ v (1, 2, 2.5, 5 × 10ⁿ). */
export function niceCeil(v) {
  if (!(v > 0)) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * mag >= v * (1 - 1e-12)) return m * mag;
  return 10 * mag;
}

/** Symmetric or one-sided nice range covering [lo, hi] with a minimum span. */
export function niceRange(lo, hi, minSpan = 1, pad = 0.08) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-minSpan / 2, minSpan / 2];
  let a = Math.min(lo, hi);
  let b = Math.max(lo, hi);
  if (b - a < minSpan) {
    const mid = (a + b) / 2;
    a = mid - minSpan / 2;
    b = mid + minSpan / 2;
    if (lo >= 0 && a < 0) {
      b -= a;
      a = 0;
    }
  }
  const span = b - a;
  const top = b > 0 ? niceCeil(b + span * pad) : b + span * pad;
  const bottom = a < 0 ? -niceCeil(-a + span * pad) : a > 0 ? a - span * pad : 0;
  return [bottom, top];
}

/** Polyline through world points (accessor pairs) on a viewport. */
export function polyline(ctx, vp, rows, getX, getY, { colour, width = 3, dash = null, from = 0, extra = null } = {}) {
  if (rows.length - from < 1 && !extra) return;
  ctx.save();
  ctx.beginPath();
  let started = false;
  for (let i = from; i < rows.length; i++) {
    const X = vp.toX(getX(rows[i]));
    const Y = vp.toY(getY(rows[i]));
    if (!Number.isFinite(X) || !Number.isFinite(Y)) continue;
    if (!started) {
      ctx.moveTo(X, Y);
      started = true;
    } else ctx.lineTo(X, Y);
  }
  if (extra) {
    const X = vp.toX(extra[0]);
    const Y = vp.toY(extra[1]);
    if (started) ctx.lineTo(X, Y);
    else ctx.moveTo(X, Y);
  }
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

export function clipTo(ctx, rect, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  fn();
  ctx.restore();
}

export function line(ctx, x0, y0, x1, y1, colour, width = 1.5, dash = null) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

export function disc(ctx, x, y, r, fill, stroke = null, width = 1.5) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

/**
 * Vector arrow from (x0, y0) by (dx, dy) px with a label beyond the tip.
 * parts: label text or rich parts. Returns false if too short to draw.
 */
export function vector(ctx, pal, x0, y0, dx, dy, parts, { colour, px = 18, width = 3, dashed = false, head } = {}) {
  const len = Math.hypot(dx, dy);
  if (len < 2) return false;
  arrow(ctx, x0, y0, x0 + dx, y0 + dy, { colour, width, dashed, head: head ?? Math.max(10, px * 0.7) });
  if (parts) {
    const ux = dx / len;
    const uy = dy / len;
    const tx = x0 + dx + ux * px * 0.6;
    const ty = y0 + dy + uy * px * 0.6;
    const align = ux > 0.35 ? 'left' : ux < -0.35 ? 'right' : 'center';
    const baseline = uy > 0.35 ? 'top' : uy < -0.35 ? 'bottom' : 'middle';
    rich(ctx, Array.isArray(parts) ? parts : [parts], tx, ty, { px, colour: pal.ink, align, baseline, box: pal.bg });
  }
  return true;
}

/**
 * A graph panel: axes under, then `plot(vp)`, then axes over (titles on top).
 * opts: { x: [a, b], y: [a, b], xTitle, yTitle, formatX, formatY, xCount, yCount }
 */
export function graph(ctx, rect, pal, px, opts, plot) {
  const vp = viewport({ x: opts.x, y: opts.y, rect });
  // Fewer ticks on narrow graphs so the tick labels never run together.
  const xCount = opts.xCount ?? Math.max(2, Math.min(6, Math.floor(rect.w / (px * 4.5))));
  const yCount = opts.yCount ?? Math.max(2, Math.min(4, Math.floor(rect.h / (px * 2.4))));
  drawAxes(ctx, vp, pal, { px, layer: 'under', xCount, yCount, formatX: opts.formatX, formatY: opts.formatY });
  clipTo(ctx, { x: rect.x - 2, y: rect.y - 2, w: rect.w + 4, h: rect.h + 4 }, () => plot(vp));
  drawAxes(ctx, vp, pal, { px, layer: 'over', xTitle: opts.xTitle, yTitle: opts.yTitle, xCount, yCount, formatX: opts.formatX, formatY: opts.formatY });
  return vp;
}

/** Square marker (the current point on a graph). */
export function marker(ctx, X, Y, colour, size = 10) {
  ctx.fillStyle = colour;
  ctx.fillRect(X - size / 2, Y - size / 2, size, size);
}

/**
 * Horizontal bar chart rows: [{ label, value, colour, text, dashed }]. Bars grow from a zero line;
 * negative values grow left. `scale` is the largest magnitude shown.
 */
export function barRows(ctx, rect, pal, px, rows, scale) {
  const labelW = Math.min(rect.w * 0.34, Math.max(...rows.map((r) => textWidth(ctx, r.label, px))) + px * 0.6);
  const valueW = Math.min(rect.w * 0.3, px * 7.5);
  const signed = rows.some((r) => r.value < -1e-12) || rows.some((r) => r.signed);
  const barX = rect.x + labelW;
  const barW = rect.w - labelW - valueW;
  const zero = signed ? barX + barW / 2 : barX;
  const half = signed ? barW / 2 : barW;
  const rowH = Math.min(px * 2, rect.h / Math.max(1, rows.length));
  const s = scale > 0 ? half / scale : 0;
  rows.forEach((r, i) => {
    const cy = rect.y + rowH * (i + 0.5);
    const h = Math.max(6, rowH * 0.56);
    label(ctx, r.label, rect.x, cy, { colour: pal.ink, px, baseline: 'middle' });
    const w = Math.max(-half, Math.min(half, r.value * s));
    if (r.dashed) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = r.colour;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.min(zero, zero + w), cy - h / 2, Math.abs(w), h);
      ctx.restore();
    } else {
      ctx.fillStyle = r.colour;
      ctx.fillRect(Math.min(zero, zero + w), cy - h / 2, Math.abs(w), h);
    }
    label(ctx, r.text ?? '', rect.x + rect.w, cy, { colour: pal.ink, px, kind: 'mono', align: 'right', baseline: 'middle' });
  });
  line(ctx, zero, rect.y, zero, rect.y + rowH * rows.length, pal.axis, 1.5);
}

/** Clamp a rect so its width and height are at least 1 px. */
export function rect(x, y, w, h) {
  return { x, y, w: Math.max(1, w), h: Math.max(1, h) };
}
