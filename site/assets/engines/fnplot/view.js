// fnplot view: drawing only. A generic renderer for "scenes" built by scenes.js: panels with a world
// window, axes (optional π-multiple ticks), sampled curves that break at discontinuities with dashed
// asymptotes, shaded regions, draggable points, zoom and pan, and KaTeX labels in an HTML overlay.
// KaTeX loads lazily (renderTex → dynamic import), so Node can import this file.
import { createSurface, readPalette, stageFontPx, viewport, drawAxes, niceTicks, label, arrow, pointerDrag, font, tickText } from '../../engine-kit.js';
import { renderTex } from '../../markdown.js';
import { formatAngle } from '../../format.js';
import { sampleFunction, sampleParametric } from './model.js';

const PI_STEPS = [Math.PI / 12, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI, 4 * Math.PI, 8 * Math.PI, 16 * Math.PI, 32 * Math.PI];
const HANDLE_R = 22; // px: touch-friendly hit radius for draggable points

/** Ticks at multiples of π/12 … 32π, about `count` of them. */
export function piTicks(min, max, count = 8) {
  const span = max - min;
  const step = PI_STEPS.find((s) => span / s <= count) ?? span / count;
  const ticks = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-9; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { step, ticks };
}

const piText = (v) => formatAngle(v, { to: 'pi' });

/** Rough plain text for a LaTeX string while KaTeX loads. */
function texToText(tex) {
  return tex
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\(left|right|,|;|!|quad)/g, ' ')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\pi/g, 'π')
    .replace(/\\(le|leq)/g, '≤')
    .replace(/\\(ge|geq)/g, '≥')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\alpha/g, 'α')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\[a-zA-Z]+/g, (m) => m.slice(1))
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createView(stage, { onDrag, onDragEnd } = {}) {
  const surface = createSurface(stage);
  const { canvas } = surface;
  let pal = readPalette(stage);

  const overlay = document.createElement('div');
  overlay.className = 'fnplot-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' });
  stage.append(overlay);

  // Zoom buttons (top right). Wheel and trackpad pinch also zoom; dragging empty space pans.
  const zoomBar = document.createElement('div');
  Object.assign(zoomBar.style, { position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', pointerEvents: 'auto' });
  const zoomButton = (text, title, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.title = title;
    b.setAttribute('aria-label', title);
    Object.assign(b.style, { width: '44px', height: '44px', padding: '0', border: '1px solid', borderRadius: '0', font: '600 20px Inter, system-ui, sans-serif', cursor: 'pointer', boxShadow: 'none' });
    b.addEventListener('click', onClick);
    zoomBar.append(b);
    return b;
  };
  const zoomButtons = [zoomButton('+', 'Zoom in', () => zoomCentre(0.8)), zoomButton('−', 'Zoom out', () => zoomCentre(1.25)), zoomButton('⟲', 'Reset the view', () => resetZoom())];
  stage.append(zoomBar);

  const zoom = new Map(); // zoom key → { x: [x0, x1], y: [y0, y1] }
  const texEls = new Map();
  const texHtml = new Map(); // tex → html string, or a pending promise
  const sampleCache = new Map();
  let cacheVersion = null;
  let builder = null;
  let panels = [];
  let handles = [];
  let lastTex = [];
  let texRaf = 0;
  let wheelActive = false;

  const styleZoomBar = () => {
    for (const b of zoomButtons) Object.assign(b.style, { background: pal.bg, color: pal.ink, borderColor: pal.axis });
  };
  styleZoomBar();

  // ── Windows, zoom and pan ────────────────────────────────────────────────────────────────────
  const zoomKey = (p) => p.zoomKey ?? p.id;

  function makeViewports(scenePanels) {
    const out = [];
    for (const p of scenePanels) {
      const z = p.zoomable ? zoom.get(zoomKey(p)) : null;
      let win = z ?? p.window;
      if (p.linkX) {
        const other = out.find((q) => q.id === p.linkX);
        if (other) win = { ...win, x: [...other.vp.x] };
      }
      const vp = viewport({ x: win.x, y: win.y, rect: p.rect, equal: Boolean(p.window.equal) && !p.linkX });
      out.push({ ...p, vp });
    }
    return out;
  }

  function setZoom(key, win) {
    const w = win.x[1] - win.x[0];
    const h = win.y[1] - win.y[0];
    if (!(w > 1e-6 && w < 1e7 && h > 1e-9 && h < 1e9)) return;
    zoom.set(key, win);
  }

  function zoomAt(p, cx, cy, factor) {
    const { vp } = p;
    const wx = vp.fromX(cx);
    const wy = vp.fromY(cy);
    setZoom(zoomKey(p), {
      x: [wx + (vp.x[0] - wx) * factor, wx + (vp.x[1] - wx) * factor],
      y: [wy + (vp.y[0] - wy) * factor, wy + (vp.y[1] - wy) * factor],
    });
    redraw();
  }

  function zoomCentre(factor) {
    const seen = new Set();
    for (const p of panels) {
      if (!p.zoomable || seen.has(zoomKey(p))) continue;
      seen.add(zoomKey(p));
      zoomAt(p, p.vp.rect.x + p.vp.rect.w / 2, p.vp.rect.y + p.vp.rect.h / 2, factor);
    }
  }

  function resetZoom() {
    zoom.clear();
    redraw();
  }

  const onWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey || wheelActive)) return; // plain scrolling scrolls the page
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const p = panels.find((q) => q.zoomable && q.vp.contains(x, y));
    if (!p) return;
    e.preventDefault();
    zoomAt(p, x, y, Math.exp(Math.max(-0.5, Math.min(0.5, e.deltaY * 0.0015))));
  };
  const onDblClick = (e) => {
    const r = canvas.getBoundingClientRect();
    const p = panels.find((q) => q.zoomable && q.vp.contains(e.clientX - r.left, e.clientY - r.top));
    if (p) {
      zoom.delete(zoomKey(p));
      redraw();
    }
  };
  const activate = () => (wheelActive = true);
  const deactivate = () => (wheelActive = false);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('pointerdown', activate);
  canvas.addEventListener('pointerleave', deactivate);

  const detachDrag = pointerDrag(canvas, {
    hit(x, y) {
      let best = null;
      let bestD = Infinity;
      for (const h of handles) {
        const d = Math.hypot(h.x - x, h.y - y);
        if (d <= h.r && d < bestD) {
          best = h;
          bestD = d;
        }
      }
      if (best) return { type: 'handle', id: best.id, panelId: best.panelId };
      const p = panels.find((q) => q.zoomable && q.vp.contains(x, y));
      if (p) return { type: 'pan', key: zoomKey(p), x0: x, y0: y, win: { x: [...p.vp.x], y: [...p.vp.y] }, sx: p.vp.scaleX, sy: p.vp.scaleY };
      return null;
    },
    move(t, x, y) {
      if (t.type === 'handle') {
        const p = panels.find((q) => q.id === t.panelId);
        if (p) onDrag?.(t.id, p.vp.fromX(x), p.vp.fromY(y));
      } else {
        const dx = (x - t.x0) / t.sx;
        const dy = (y - t.y0) / t.sy;
        setZoom(t.key, { x: [t.win.x[0] - dx, t.win.x[1] - dx], y: [t.win.y[0] + dy, t.win.y[1] + dy] });
        redraw();
      }
    },
    end(t) {
      if (t.type === 'handle') onDragEnd?.(t.id);
    },
  });

  // ── Drawing ──────────────────────────────────────────────────────────────────────────────────
  function redraw() {
    if (builder) draw(builder);
  }

  function draw(build) {
    builder = build;
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    const scene = build({ W, H, px, pal });
    if (scene.version !== cacheVersion) {
      sampleCache.clear();
      cacheVersion = scene.version;
    }
    surface.begin(pal.bg);
    handles = [];
    const tex = [...(scene.tex ?? [])];
    panels = makeViewports(scene.panels ?? []);
    for (const p of panels) drawPanel(ctx, p, px, tex);
    if (scene.message) drawMessage(ctx, scene.message, W, H, px);
    for (const t of scene.text ?? []) label(ctx, t.text, t.x, t.y, { colour: t.colour ?? pal.ink, px: t.px ?? px, kind: t.kind ?? 'label', align: t.align ?? 'left', baseline: t.baseline ?? 'alphabetic', box: t.box === false ? null : pal.bg });
    updateTex(tex, px);
    zoomBar.style.display = panels.some((p) => p.zoomable) && W >= 480 ? 'flex' : 'none';
  }

  function drawPanel(ctx, p, px, tex) {
    const { vp } = p;
    const axes = p.axes ?? {};
    if (p.frame) {
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(vp.rect.x) + 0.5, Math.round(vp.rect.y) + 0.5, Math.round(vp.rect.w), Math.round(vp.rect.h));
    }
    if (p.axes !== false) drawPlotAxes(ctx, vp, { ...axes, px, layer: 'under' });
    ctx.save();
    ctx.beginPath();
    ctx.rect(vp.rect.x - 1, vp.rect.y - 1, vp.rect.w + 2, vp.rect.h + 2);
    ctx.clip();
    for (const item of p.items ?? []) drawItem(ctx, p, item, px, tex);
    ctx.restore();
    if (p.axes !== false) drawPlotAxes(ctx, vp, { ...axes, px, layer: 'over' });
    for (const item of p.items ?? []) if (item.kind === 'point' && item.drag) handles.push({ id: item.drag, panelId: p.id, x: vp.toX(item.x), y: vp.toY(item.y), r: HANDLE_R });
  }

  function drawPlotAxes(ctx, vp, { px, layer, xTitle, yTitle, piX = false, piY = false, grid = true, hideY = false, xCount = 8, yCount = 6 }) {
    if (!piX && !piY && !hideY) {
      drawAxes(ctx, vp, pal, { px, layer, xTitle, yTitle, grid, xCount, yCount });
      return;
    }
    // π-multiple ticks (or a bare number line): same look as the kit's drawAxes.
    const { rect } = vp;
    const xt = piX ? piTicks(vp.x[0], vp.x[1], xCount) : niceTicks(vp.x[0], vp.x[1], xCount);
    const yt = piY ? piTicks(vp.y[0], vp.y[1], yCount) : niceTicks(vp.y[0], vp.y[1], yCount);
    const fx = piX ? piText : tickText;
    const fy = piY ? piText : tickText;
    const axisY = vp.y[0] <= 0 && vp.y[1] >= 0 ? vp.toY(0) : rect.y + rect.h;
    const axisX = vp.x[0] <= 0 && vp.x[1] >= 0 ? vp.toX(0) : rect.x;
    ctx.save();
    if (layer !== 'over') {
      if (grid) {
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const t of xt.ticks) {
          const X = Math.round(vp.toX(t)) + 0.5;
          ctx.moveTo(X, rect.y);
          ctx.lineTo(X, rect.y + rect.h);
        }
        if (!hideY)
          for (const t of yt.ticks) {
            const Y = Math.round(vp.toY(t)) + 0.5;
            ctx.moveTo(rect.x, Y);
            ctx.lineTo(rect.x + rect.w, Y);
          }
        ctx.stroke();
      }
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rect.x, axisY);
      ctx.lineTo(rect.x + rect.w, axisY);
      if (!hideY) {
        ctx.moveTo(axisX, rect.y);
        ctx.lineTo(axisX, rect.y + rect.h);
      }
      ctx.stroke();
    }
    if (layer !== 'under') {
      ctx.font = font('mono', px);
      const tick = (text, x, y, align) => {
        const w = ctx.measureText(text).width;
        const left = align === 'center' ? x - w / 2 : x - w;
        const top = align === 'center' ? y : y - px / 2;
        ctx.fillStyle = pal.bg;
        ctx.fillRect(left - 3, top - 1, w + 6, px + 2);
        ctx.fillStyle = pal.muted;
        ctx.fillText(text, x, y);
      };
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const t of xt.ticks) tick(fx(t), vp.toX(t), rect.y + rect.h + 6, 'center');
      if (!hideY) {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (const t of yt.ticks) tick(fy(t), rect.x - 10, vp.toY(t), 'right');
      }
      if (xTitle) label(ctx, xTitle, rect.x + rect.w - 4, axisY - 10, { colour: pal.ink, px, align: 'right', baseline: 'bottom', box: pal.bg });
      if (yTitle && !hideY) label(ctx, yTitle, axisX + 12, rect.y + 4, { colour: pal.ink, px, align: 'left', baseline: 'top', box: pal.bg });
    }
    ctx.restore();
  }

  function stroke(ctx, item, fallbackWidth = 3) {
    ctx.strokeStyle = item.colour ?? pal.series[0];
    ctx.lineWidth = item.width ?? fallbackWidth;
    ctx.setLineDash(item.dash ?? []);
    ctx.lineJoin = 'round';
    ctx.lineCap = item.dash ? 'butt' : 'round';
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** Cached sampling of a function item over its visible x-range. */
  function sampled(p, item) {
    const { vp } = p;
    const [d0, d1] = item.domain ?? [-Infinity, Infinity];
    const x0 = Math.max(vp.x[0], d0);
    const x1 = Math.min(vp.x[1], d1);
    if (!(x1 > x0)) return { segments: [], asymptotes: [] };
    const key = `${p.id}|${item.key ?? ''}|${x0}|${x1}|${vp.y[0]}|${vp.y[1]}|${vp.rect.w}`;
    if (item.key && sampleCache.has(key)) return sampleCache.get(key);
    const n = Math.max(200, Math.min(1200, Math.round(vp.rect.w / 1.5)));
    const s = sampleFunction(item.f, x0, x1, { n, yMin: vp.y[0], yMax: vp.y[1] });
    if (item.key) sampleCache.set(key, s);
    return s;
  }

  function polyline(ctx, vp, pts) {
    const H = vp.y[1] - vp.y[0];
    const lo = vp.y[0] - 4 * H;
    const hi = vp.y[1] + 4 * H;
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const X = vp.toX(x);
      const Y = vp.toY(Math.min(hi, Math.max(lo, y)));
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
  }

  function fill(ctx, colour, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha ?? 0.22;
    ctx.fillStyle = colour ?? pal.series[0];
    ctx.fill();
    ctx.restore();
  }

  function drawItem(ctx, p, item, px, tex) {
    const { vp } = p;
    const R = vp.rect;
    switch (item.kind) {
      case 'fn': {
        const s = sampled(p, item);
        if (item.asymptotes !== false) {
          for (const a of s.asymptotes) {
            ctx.beginPath();
            ctx.moveTo(Math.round(vp.toX(a)) + 0.5, R.y);
            ctx.lineTo(Math.round(vp.toX(a)) + 0.5, R.y + R.h);
            stroke(ctx, { colour: pal.muted, width: 1.5, dash: [8, 6] });
          }
        }
        for (const seg of s.segments) {
          polyline(ctx, vp, seg);
          stroke(ctx, item);
        }
        break;
      }
      case 'param': {
        const key = `${p.id}|${item.key ?? ''}|${item.t0}|${item.t1}`;
        let segs = item.key ? sampleCache.get(key) : null;
        if (!segs) {
          segs = sampleParametric(item.fx, item.fy, item.t0, item.t1, item.n ?? 600);
          if (item.key) sampleCache.set(key, segs);
        }
        for (const seg of segs) {
          polyline(ctx, vp, seg);
          stroke(ctx, item);
        }
        break;
      }
      case 'path': {
        if (!item.points?.length) break;
        polyline(ctx, vp, item.points);
        if (item.close) ctx.closePath();
        if (item.fill) fill(ctx, item.fill, item.alpha);
        if (item.colour !== null) stroke(ctx, item, 2);
        break;
      }
      case 'fillUnder': {
        const s = sampled(p, { ...item, domain: [Math.min(item.a, item.b), Math.max(item.a, item.b)] });
        for (const seg of s.segments) {
          if (seg.length < 2) continue;
          polyline(ctx, vp, [[seg[0][0], 0], ...seg, [seg[seg.length - 1][0], 0]]);
          ctx.closePath();
          fill(ctx, item.colour, item.alpha);
        }
        break;
      }
      case 'band': {
        const X0 = vp.toX(Math.max(vp.x[0], Math.min(item.x0, item.x1)));
        const X1 = vp.toX(Math.min(vp.x[1], Math.max(item.x0, item.x1)));
        if (X1 <= X0) break;
        const Y0 = item.y0 !== undefined ? vp.toY(item.y1) : R.y;
        const Y1 = item.y0 !== undefined ? vp.toY(item.y0) : R.y + R.h;
        ctx.beginPath();
        ctx.rect(X0, Y0, X1 - X0, Y1 - Y0);
        fill(ctx, item.colour, item.alpha ?? 0.12);
        break;
      }
      case 'vline':
      case 'hline': {
        ctx.beginPath();
        if (item.kind === 'vline') {
          const X = Math.round(vp.toX(item.x)) + 0.5;
          ctx.moveTo(X, item.y0 !== undefined ? vp.toY(item.y0) : R.y + R.h);
          ctx.lineTo(X, item.y1 !== undefined ? vp.toY(item.y1) : R.y);
        } else {
          const Y = Math.round(vp.toY(item.y)) + 0.5;
          ctx.moveTo(item.x0 !== undefined ? vp.toX(item.x0) : R.x, Y);
          ctx.lineTo(item.x1 !== undefined ? vp.toX(item.x1) : R.x + R.w, Y);
        }
        stroke(ctx, { colour: pal.muted, width: 1.5, ...item }, 1.5);
        break;
      }
      case 'line': {
        // Infinite line through p0 and p1, clipped by the canvas clip.
        const [x0, y0] = item.p0;
        const [x1, y1] = item.p1;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const big = 4 * (vp.x[1] - vp.x[0] + vp.y[1] - vp.y[0]);
        const len = Math.hypot(dx, dy) || 1;
        ctx.beginPath();
        ctx.moveTo(vp.toX(x0 - (dx / len) * big), vp.toY(y0 - (dy / len) * big));
        ctx.lineTo(vp.toX(x0 + (dx / len) * big), vp.toY(y0 + (dy / len) * big));
        stroke(ctx, { colour: pal.muted, width: 1.5, ...item }, 1.5);
        break;
      }
      case 'segment': {
        ctx.beginPath();
        ctx.moveTo(vp.toX(item.p0[0]), vp.toY(item.p0[1]));
        ctx.lineTo(vp.toX(item.p1[0]), vp.toY(item.p1[1]));
        stroke(ctx, item, 2);
        break;
      }
      case 'arrow':
        arrow(ctx, vp.toX(item.p0[0]), vp.toY(item.p0[1]), vp.toX(item.p1[0]), vp.toY(item.p1[1]), { colour: item.colour ?? pal.ink, width: item.width ?? 2.5, head: item.head ?? Math.max(10, px * 0.7), dashed: Boolean(item.dashed) });
        break;
      case 'arc': {
        const cx = vp.toX(item.cx);
        const cy = vp.toY(item.cy);
        ctx.beginPath();
        ctx.arc(cx, cy, item.r, -item.a0, -item.a1, item.a1 > item.a0);
        stroke(ctx, item, 2);
        break;
      }
      case 'point': {
        const X = vp.toX(item.x);
        const Y = vp.toY(item.y);
        if (!Number.isFinite(X) || !Number.isFinite(Y)) break;
        const r = item.r ?? (item.drag ? 9 : 6);
        ctx.beginPath();
        if (item.square) ctx.rect(X - r, Y - r, 2 * r, 2 * r);
        else ctx.arc(X, Y, r, 0, Math.PI * 2);
        if (item.hollow) {
          ctx.fillStyle = pal.bg;
          ctx.fill();
          ctx.strokeStyle = item.colour ?? pal.series[0];
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = item.colour ?? pal.series[0];
          ctx.fill();
          if (item.drag) {
            // Draggable: an ink ring outside a background ring, so it reads as a handle.
            ctx.lineWidth = 2;
            ctx.strokeStyle = pal.bg;
            ctx.stroke();
            ctx.beginPath();
            if (item.square) ctx.rect(X - r - 3, Y - r - 3, 2 * r + 6, 2 * r + 6);
            else ctx.arc(X, Y, r + 3, 0, Math.PI * 2);
            ctx.strokeStyle = pal.ink;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
        break;
      }
      case 'text': {
        let X = vp.toX(item.x) + (item.dx ?? 0);
        let Y = vp.toY(item.y) + (item.dy ?? 0);
        if (!Number.isFinite(X) || !Number.isFinite(Y)) break;
        let align = item.align ?? 'left';
        const size = item.px ?? px;
        // Keep labels inside the panel: flip to the other side of the point, or nudge inwards.
        ctx.font = font(item.font ?? 'label', size);
        const w = ctx.measureText(item.text).width;
        if (align === 'left' && X + w > R.x + R.w - 4) {
          X = vp.toX(item.x) - (item.dx ?? 0);
          align = 'right';
        } else if (align === 'right' && X - w < R.x + 4) {
          X = vp.toX(item.x) - (item.dx ?? 0);
          align = 'left';
        } else if (align === 'center') X = Math.min(R.x + R.w - w / 2 - 4, Math.max(R.x + w / 2 + 4, X));
        Y = Math.min(R.y + R.h - 4, Math.max(R.y + size + 2, Y));
        label(ctx, item.text, X, Y, { colour: item.colour ?? pal.ink, px: size, kind: item.font ?? 'label', align, baseline: item.baseline ?? 'alphabetic', box: item.box === false ? null : pal.bg });
        break;
      }
      case 'tex': {
        const X = vp.toX(item.x) + (item.dx ?? 0);
        const Y = vp.toY(item.y) + (item.dy ?? 0);
        if (Number.isFinite(X) && Number.isFinite(Y) && X >= R.x - 4 && X <= R.x + R.w + 4 && Y >= R.y - 4 && Y <= R.y + R.h + 4) tex.push({ ...item, x: X, y: Y });
        break;
      }
      default:
        break;
    }
  }

  function drawMessage(ctx, m, W, H, px) {
    const pad = px;
    const w = Math.min(W - 2 * pad, 52 * px);
    const x = (W - w) / 2;
    const y = Math.max(pad, H * 0.18);
    ctx.save();
    ctx.fillStyle = pal.bg;
    ctx.strokeStyle = pal.axis;
    ctx.lineWidth = 1;
    const h = px * 7.2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
    label(ctx, m.title, x + px, y + px * 1.6, { colour: pal.ink, px: px + 2, kind: 'strong' });
    // The source with the problem underlined.
    const src = m.source ?? '';
    ctx.font = font('mono', px);
    let sx = x + px;
    const sy = y + px * 3.6;
    const prefix = `${m.name} = `;
    label(ctx, prefix + src, sx, sy, { colour: pal.ink, px, kind: 'mono' });
    if (m.pos !== undefined && src) {
      const before = ctx.measureText(prefix + src.slice(0, m.pos)).width;
      const bad = Math.max(ctx.measureText(src.slice(m.pos, Math.max(m.end, m.pos + 1)) || ' ').width, px * 0.6);
      ctx.fillStyle = pal.accent;
      ctx.fillRect(sx + before, sy + 5, bad, 3);
    }
    sx = x + px;
    const words = m.text.split(' ');
    let line = '';
    let ly = y + px * 5.8;
    ctx.font = font('label', px);
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > w - 2 * px && line) {
        label(ctx, line, sx, ly, { colour: pal.muted, px });
        line = word;
        ly += px * 1.3;
      } else line = test;
    }
    if (line) label(ctx, line, sx, ly, { colour: pal.muted, px });
    ctx.restore();
  }

  // ── KaTeX overlay ────────────────────────────────────────────────────────────────────────────
  function html(tex) {
    const v = texHtml.get(tex);
    if (typeof v === 'string') return v;
    if (!v) {
      // Display style keeps fractions full size in a one-line label.
      const pending = renderTex(`\\displaystyle ${tex}`)
        .then((h) => {
          texHtml.set(tex, h);
          if (!texRaf)
            texRaf = requestAnimationFrame(() => {
              texRaf = 0;
              updateTex(lastTex, stageFontPx(surface.width));
            });
        })
        .catch(() => texHtml.set(tex, null));
      texHtml.set(tex, pending);
    }
    return null;
  }

  function updateTex(list, px) {
    lastTex = list;
    const seen = new Set();
    for (const t of list) {
      const id = t.id ?? t.tex ?? (t.lines ?? []).join('|');
      seen.add(id);
      let el = texEls.get(id);
      if (!el) {
        el = document.createElement('div');
        Object.assign(el.style, { position: 'absolute', whiteSpace: 'nowrap', lineHeight: '1.35', padding: '2px 6px' });
        overlay.append(el);
        texEls.set(id, el);
      }
      const lines = t.lines ?? [t.tex];
      const rendered = lines.map((l) => (l ? html(l) : ''));
      const key = `${lines.join('\n')}|${rendered.map((r) => (r ? 1 : 0)).join('')}`;
      if (el.dataset.key !== key) {
        el.dataset.key = key;
        el.replaceChildren(
          ...lines.map((l, i) => {
            const row = document.createElement('div');
            if (t.lineColours?.[i]) row.style.color = t.lineColours[i];
            if (!l) row.style.height = `${px * 0.6}px`;
            else if (rendered[i]) row.innerHTML = rendered[i];
            else row.textContent = texToText(l);
            return row;
          }),
        );
      }
      const size = (t.size ?? 1) * px;
      const tx = t.align === 'center' ? '-50%' : t.align === 'right' ? '-100%' : '0';
      const ty = t.valign === 'middle' ? '-50%' : t.valign === 'bottom' ? '-100%' : '0';
      Object.assign(el.style, {
        left: `${Math.round(t.x)}px`,
        top: `${Math.round(t.y)}px`,
        transform: `translate(${tx}, ${ty})`,
        fontSize: `${size}px`,
        color: t.colour ?? pal.ink,
        background: t.box === false ? 'transparent' : pal.bg,
        border: t.frame ? `1px solid ${pal.grid}` : 'none',
        textAlign: t.textAlign ?? 'left',
      });
    }
    for (const [id, el] of texEls) {
      if (!seen.has(id)) {
        el.remove();
        texEls.delete(id);
      }
    }
  }

  return {
    draw,
    redraw,
    resetZoom,
    resize() {
      surface.resize();
    },
    setTheme() {
      pal = readPalette(stage);
      styleZoomBar();
      for (const el of texEls.values()) el.dataset.key = '';
    },
    destroy() {
      detachDrag();
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('pointerdown', activate);
      canvas.removeEventListener('pointerleave', deactivate);
      if (texRaf) cancelAnimationFrame(texRaf);
      overlay.remove();
      zoomBar.remove();
      surface.destroy();
    },
  };
}
