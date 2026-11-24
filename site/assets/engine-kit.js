// Engine kit: shared helpers every engine's index.js and view.js use to meet the §5.1 rules.
// Lead-owned, locked after Gate A. Engines import it by relative path ('../../engine-kit.js').
// Nothing here runs at import time, so Node can import engine index.js files for contract tests.
//
//   createLoop     fixed timestep + accumulator, timeScale (0.25–2), pauses while document.hidden
//   createEmitter  'tick' each frame, 'outputs' throttled to 10 Hz, 'complete', 'error'
//   createSurface  a canvas filling the stage, devicePixelRatio capped at 2
//   readPalette    stage colours from tokens.css for the current theme
//   font, stageFontPx, label, arrow, niceTicks, viewport, axisMargins, drawAxes   drawing helpers (§6.6)
//   pointerDrag    mouse/touch/pen dragging of handles on a canvas
//   ensureFonts    wait (briefly) for Inter and JetBrains Mono before the first canvas draw

export const TIME_SCALE_MIN = 0.25;
export const TIME_SCALE_MAX = 2;
export const OUTPUTS_HZ = 10;
export const MAX_DPR = 2;

/**
 * Fixed-timestep animation loop. Simulation speed is independent of frame rate.
 * @param {{ dt: number, step: (dt:number)=>void, render: ()=>void, isComplete?: ()=>boolean,
 *   getTimeScale?: ()=>number, onFrame?: ()=>void, onComplete?: ()=>void, onError?: (err:Error)=>void,
 *   maxStepsPerFrame?: number }} opts
 */
export function createLoop(opts) {
  const { dt, step, render, isComplete = () => false, getTimeScale = () => 1, onFrame, onComplete, onError, maxStepsPerFrame = 5000 } = opts;
  let playing = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let destroyed = false;

  const frame = (now) => {
    raf = 0;
    if (!playing) return;
    const elapsed = Math.min(Math.max((now - last) / 1000, 0), 0.1); // avoid a spiral after a stall
    last = now;
    const scale = Math.min(TIME_SCALE_MAX, Math.max(TIME_SCALE_MIN, Number(getTimeScale()) || 1));
    acc += elapsed * scale;
    try {
      let n = 0;
      while (acc >= dt && !isComplete() && n < maxStepsPerFrame) {
        step(dt);
        acc -= dt;
        n += 1;
      }
      render();
      onFrame?.();
    } catch (err) {
      playing = false;
      onError?.(err);
      return;
    }
    if (isComplete()) {
      playing = false;
      acc = 0;
      onComplete?.();
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (playing && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  const loop = {
    /** Starts playing. Returns false if destroyed or already complete. */
    play() {
      if (destroyed || isComplete()) return false;
      if (playing) return true;
      playing = true;
      acc = 0;
      last = performance.now();
      if (!document.hidden) raf = requestAnimationFrame(frame);
      return true;
    },
    pause() {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    isPlaying: () => playing,
    destroy() {
      destroyed = true;
      loop.pause();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
  return loop;
}

/**
 * Wraps the shell's onEvent callback: tick every frame, outputs throttled to 10 Hz (trailing call kept).
 * @param {(type:string, payload?:any)=>void} onEvent
 */
export function createEmitter(onEvent = () => {}) {
  let lastOutputs = 0;
  let pending = null;
  let timer = 0;
  const flush = () => {
    timer = 0;
    lastOutputs = performance.now();
    const p = pending;
    pending = null;
    if (p) onEvent('outputs', p);
  };
  return {
    tick: (t) => onEvent('tick', { t }),
    outputs(values) {
      pending = values;
      const wait = 1000 / OUTPUTS_HZ - (performance.now() - lastOutputs);
      if (wait <= 0) flush();
      else if (!timer) timer = setTimeout(flush, wait);
    },
    /** Emit outputs now (after reset, setParams or step), bypassing the throttle. */
    outputsNow(values) {
      clearTimeout(timer);
      pending = values;
      flush();
    },
    complete: () => onEvent('complete'),
    error: (err) => onEvent('error', { message: err?.message || String(err) }),
    destroy() {
      clearTimeout(timer);
      pending = null;
    },
  };
}

/**
 * A canvas that fills the stage. Call resize() from the engine's resize(); begin(bg) at the start of each draw.
 * @param {HTMLElement} stage
 */
export function createSurface(stage) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const surface = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    /** Returns true if the size changed. */
    resize() {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (w === surface.width && h === surface.height && dpr === surface.dpr) return false;
      surface.width = w;
      surface.height = h;
      surface.dpr = dpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      return true;
    },
    /** Reset the transform to CSS pixels and fill with the background colour. */
    begin(bg) {
      ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, surface.width, surface.height);
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.setLineDash([]);
    },
    destroy() {
      canvas.remove();
    },
  };
  surface.resize();
  return surface;
}

/** Read the stage colours for the current theme from CSS custom properties. */
export function readPalette(el = document.documentElement) {
  const cs = getComputedStyle(el);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    bg: v('--k-bg', '#F6F6F4'),
    panel: v('--k-panel', '#FFFFFF'),
    ink: v('--k-ink', '#121316'),
    muted: v('--k-muted', '#4A4D53'),
    grid: v('--k-grid', '#DADAD6'),
    axis: v('--k-axis', '#6B6E74'),
    accent: v('--k-accent', '#FF4F00'),
    accentText: v('--k-accent-text', '#B83A00'),
    series: ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6'].map((n, i) => v(n, ['#FF4F00', '#0072B2', '#009E73', '#CC79A7', '#121316', '#E69F00'][i])),
  };
}

/** Canvas font strings. kind: 'label' (Inter 500), 'strong' (Inter 600), 'mono' (JetBrains Mono 500). */
export function font(kind = 'label', px = 18) {
  if (kind === 'mono') return `500 ${px}px "JetBrains Mono", ui-monospace, monospace`;
  if (kind === 'strong') return `600 ${px}px Inter, system-ui, sans-serif`;
  return `500 ${px}px Inter, system-ui, sans-serif`;
}

/**
 * Stage text size: `base` (≥ 18 px) on projector-sized stages, scaling down to 0.75 × base on phones.
 * @param {number} stageWidth CSS px
 */
export function stageFontPx(stageWidth, base = 18) {
  if (stageWidth >= 1000) return base;
  const t = Math.max(0, (stageWidth - 360) / (1000 - 360));
  return Math.round(base * (0.75 + 0.25 * t));
}

/**
 * Draw text. With `box`, a flat background rectangle keeps it legible over lines (no glow).
 * @param {CanvasRenderingContext2D} ctx
 */
export function label(ctx, text, x, y, { colour = '#121316', px = 18, kind = 'label', align = 'left', baseline = 'alphabetic', box = null, padding = 4 } = {}) {
  ctx.save();
  ctx.font = font(kind, px);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (box) {
    const m = ctx.measureText(text);
    const w = m.width;
    const ascent = m.actualBoundingBoxAscent || px * 0.8;
    const descent = m.actualBoundingBoxDescent || px * 0.2;
    const left = align === 'center' ? x - w / 2 : align === 'right' || align === 'end' ? x - w : x;
    ctx.fillStyle = box;
    ctx.fillRect(left - padding, y - ascent - padding, w + 2 * padding, ascent + descent + 2 * padding);
  }
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Arrow with a filled head (vectors, forces). Returns false if the arrow is too short to draw. */
export function arrow(ctx, x0, y0, x1, y1, { colour = '#121316', width = 3, head = 14, dashed = false } = {}) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return false;
  const ux = dx / len;
  const uy = dy / len;
  const h = Math.min(head, len * 0.6);
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - ux * h * 0.8, y1 - uy * h * 0.8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * h - uy * h * 0.45, y1 - uy * h + ux * h * 0.45);
  ctx.lineTo(x1 - ux * h + uy * h * 0.45, y1 - uy * h - ux * h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return true;
}

/** "Nice" tick values covering [min, max] with about `count` intervals (steps of 1, 2, 2.5 or 5 × 10ⁿ). */
export function niceTicks(min, max, count = 6) {
  if (!(max > min)) return { step: 1, ticks: [min] };
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const ticks = [];
  const start = Math.ceil(min / step - 1e-9) * step;
  for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(12)));
  return { step, ticks };
}

/**
 * Map a world rectangle onto a pixel rectangle. With `equal`, one unit is the same length on both axes
 * (the world range grows on one axis to fit).
 * @param {{ x: [number, number], y: [number, number], rect: { x: number, y: number, w: number, h: number }, equal?: boolean }} opts
 */
export function viewport({ x, y, rect, equal = false }) {
  let [x0, x1] = x;
  let [y0, y1] = y;
  if (equal) {
    const sx = rect.w / (x1 - x0);
    const sy = rect.h / (y1 - y0);
    if (sx > sy) {
      const extra = (rect.w / sy - (x1 - x0)) / 2;
      x0 -= extra;
      x1 += extra;
    } else {
      const extra = (rect.h / sx - (y1 - y0)) / 2;
      y0 -= extra;
      y1 += extra;
    }
  }
  const sx = rect.w / (x1 - x0);
  const sy = rect.h / (y1 - y0);
  return {
    x: [x0, x1],
    y: [y0, y1],
    rect,
    scaleX: sx,
    scaleY: sy,
    toX: (wx) => rect.x + (wx - x0) * sx,
    toY: (wy) => rect.y + rect.h - (wy - y0) * sy,
    fromX: (px) => x0 + (px - rect.x) / sx,
    fromY: (py) => y0 + (rect.y + rect.h - py) / sy,
    contains: (px, py) => px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h,
  };
}

/**
 * Space to leave around a plot rectangle for drawAxes' tick labels (left of and below the rectangle).
 * @param {number} px stage font size
 */
export function axisMargins(px = 18) {
  return { left: Math.round(px * 3.4), bottom: Math.round(px * 1.9), top: Math.round(px * 0.6), right: Math.round(px * 0.8) };
}

/**
 * Grid, axes, tick labels and axis titles (with units) for a viewport (§6.6).
 * Tick labels sit outside the plot rectangle (leave axisMargins() around it) so data never covers them.
 * Layers: draw 'under' before the data and 'over' after it, so axis titles stay readable; 'all' does both.
 * @param {CanvasRenderingContext2D} ctx
 * @param {ReturnType<typeof viewport>} vp
 * @param {ReturnType<typeof readPalette>} pal
 * @param {{ xTitle?: string, yTitle?: string, px?: number, grid?: boolean, xCount?: number, yCount?: number,
 *   formatX?: (v:number)=>string, formatY?: (v:number)=>string, layer?: 'all'|'under'|'over',
 *   xAxisAt?: 'zero'|'bottom', yAxisAt?: 'zero'|'left' }} [opts]
 *   xAxisAt/yAxisAt: by default each axis sits at zero when zero is in range; 'bottom'/'left' pin it to the edge
 *   (histograms, time series).
 */
export function drawAxes(ctx, vp, pal, opts = {}) {
  const { xTitle, yTitle, px = 18, grid = true, xCount = 8, yCount = 6, formatX = tickText, formatY = tickText, layer = 'all', xAxisAt = 'zero', yAxisAt = 'zero' } = opts;
  const { rect } = vp;
  // Axes sit at zero when zero is in range, otherwise on the rectangle's edge.
  const axisY = xAxisAt === 'zero' && vp.y[0] <= 0 && vp.y[1] >= 0 ? vp.toY(0) : rect.y + rect.h;
  const axisX = yAxisAt === 'zero' && vp.x[0] <= 0 && vp.x[1] >= 0 ? vp.toX(0) : rect.x;
  ctx.save();

  if (layer !== 'over') {
    const xt = niceTicks(vp.x[0], vp.x[1], xCount);
    const yt = niceTicks(vp.y[0], vp.y[1], yCount);
    if (grid) {
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const t of xt.ticks) {
        const X = Math.round(vp.toX(t)) + 0.5;
        ctx.moveTo(X, rect.y);
        ctx.lineTo(X, rect.y + rect.h);
      }
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
    ctx.moveTo(axisX, rect.y);
    ctx.lineTo(axisX, rect.y + rect.h);
    ctx.stroke();

  }

  if (layer !== 'under') {
    // Tick labels sit on flat background boxes, so lines crossing the margin pass behind them.
    const xt = niceTicks(vp.x[0], vp.x[1], xCount);
    const yt = niceTicks(vp.y[0], vp.y[1], yCount);
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
    for (const t of xt.ticks) tick(formatX(t), vp.toX(t), rect.y + rect.h + 6, 'center');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const t of yt.ticks) tick(formatY(t), rect.x - 10, vp.toY(t), 'right');
    if (xTitle) label(ctx, xTitle, rect.x + rect.w - 4, axisY - 10, { colour: pal.ink, px, align: 'right', baseline: 'bottom', box: pal.bg });
    if (yTitle) label(ctx, yTitle, axisX + 12, rect.y + 4, { colour: pal.ink, px, align: 'left', baseline: 'top', box: pal.bg });
  }
  ctx.restore();
}

/** Tick label: short and honest (uses the true minus sign). */
export function tickText(v) {
  const s = Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(1) : String(Number(v.toPrecision(6)));
  return s.replace('-', '−');
}

/**
 * Drag handles on a canvas with mouse, touch or pen. Sets touch-action: none on the canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{ hit: (x:number, y:number)=>any, move: (target:any, x:number, y:number, e:PointerEvent)=>void,
 *   start?: (target:any)=>void, end?: (target:any)=>void }} handlers  coordinates are CSS px in the canvas
 * @returns {() => void} detach
 */
export function pointerDrag(canvas, { hit, move, start, end }) {
  let target = null;
  let pointerId = null;
  canvas.style.touchAction = 'none';
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e) => {
    if (target !== null) return;
    const [x, y] = pos(e);
    const t = hit(x, y);
    if (t === null || t === undefined) return;
    target = t;
    pointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    start?.(target);
    e.preventDefault();
  };
  const moveHandler = (e) => {
    const [x, y] = pos(e);
    if (target !== null && e.pointerId === pointerId) {
      move(target, x, y, e);
      e.preventDefault();
    } else if (e.pointerType === 'mouse') {
      const t = hit(x, y);
      canvas.style.cursor = t !== null && t !== undefined ? 'grab' : '';
    }
  };
  const up = (e) => {
    if (target === null || e.pointerId !== pointerId) return;
    const t = target;
    target = null;
    pointerId = null;
    canvas.style.cursor = '';
    end?.(t);
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', moveHandler);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', moveHandler);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', up);
  };
}

/** Wait for the stage fonts (max `timeout` ms) so the first canvas frame doesn't use a fallback font. */
export async function ensureFonts(timeout = 1500) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const loads = Promise.all([
    document.fonts.load(font('label', 18)),
    document.fonts.load(font('strong', 18)),
    document.fonts.load(font('mono', 18)),
  ]).catch(() => {});
  await Promise.race([loads, new Promise((r) => setTimeout(r, timeout))]);
}
