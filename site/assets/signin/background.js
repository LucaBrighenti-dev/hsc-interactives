// Sign-in background (guide §6.4): a slope field that drifts slowly behind the page.
//
//   dy/dx = sin(x − t) · cos y
//
// The short ticks are the slope field. The longer curves are exact solution curves, so the picture is
// real mathematics, not decoration: in the band around y = kπ (s = (−1)^k) the solutions are
//   y = kπ + gd(C − s·cos(x − t)),   gd(z) = atan(sinh z)  (the Gudermannian function),
// so no numerical integration is needed and nothing accumulates error. As t grows the field slides right.
//
// Self-contained: no engine dependency. Drawn in --c-accent at about 35% opacity, flat lines only.
// Light on CPU: about 30 frames a second, device pixel ratio capped at 2 (and a pixel budget for very
// large screens), paused while the tab is hidden, and one static frame with prefers-reduced-motion.
//
// Test hooks: canvas.dataset.motion is 'running' | 'paused' | 'static'; canvas.hscFrames counts frames drawn.

const FRAME_MS = 1000 / 30;
const DRIFT = 0.1; // rad/s: one wavelength (2π) every ~63 s
const T0 = 1.15; // phase of the static frame
const CURVES_PER_BAND = 7;
const PIXEL_BUDGET = 4.2e6; // device pixels; keeps 4K-class screens cheap
const ALPHA = { curves: 0.35, ticks: 0.2 };

const gd = (z) => Math.atan(Math.sinh(z));

/**
 * Mount the animated slope field on a canvas that CSS sizes (e.g. position: fixed; inset: 0).
 * @param {HTMLCanvasElement} canvas
 * @param {{ static?: boolean, scale?: number }} [opts] static: always one frame; scale: world-unit multiplier
 * @returns {{ destroy(): void, draw(): void }}
 */
export function mountBackground(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { destroy() {}, draw() {} };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const size = { w: 0, h: 0, dpr: 1, unit: 80 };
  let colour = '#FF4F00';
  let t = T0;
  let raf = 0;
  let last = 0;
  let cos = new Float64Array(0);
  canvas.hscFrames = 0;

  const isStatic = () => Boolean(opts.static) || reduce.matches;

  function readColour() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim();
    if (v) colour = v;
  }

  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth));
    const h = Math.max(1, Math.round(canvas.clientHeight));
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w * h * dpr * dpr > PIXEL_BUDGET) dpr = Math.max(1, Math.sqrt(PIXEL_BUDGET / (w * h)));
    size.w = w;
    size.h = h;
    size.dpr = dpr;
    // About 12 world units across the shorter side, within sensible pixel limits.
    size.unit = Math.min(96, Math.max(44, Math.min(w, h) / 11.5)) * (opts.scale || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function draw() {
    const { w, h, dpr, unit } = size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    const cx = w * 0.5;
    const cy = h * 0.5;

    // 1. Slope-field ticks on a lattice fixed to the world origin, so they rotate in place as t grows.
    const step = unit * 0.5;
    const half = step * 0.3;
    ctx.globalAlpha = ALPHA.ticks;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = Math.ceil(-cx / step); i <= Math.floor((w - cx) / step); i++) {
      const X = cx + i * step;
      const sx = Math.sin((i * step) / unit - t);
      for (let j = Math.ceil(-cy / step); j <= Math.floor((h - cy) / step); j++) {
        const Y = cy + j * step;
        const m = sx * Math.cos(-(j * step) / unit); // world y points up; screen Y points down
        const d = half / Math.hypot(1, m);
        ctx.moveTo(X - d, Y + m * d);
        ctx.lineTo(X + d, Y - m * d);
      }
    }
    ctx.stroke();

    // 2. Solution curves, band by band. cos(x − t) is shared by every curve in a column.
    const dx = 6;
    const n = Math.ceil(w / dx) + 1;
    if (cos.length !== n) cos = new Float64Array(n);
    for (let c = 0; c < n; c++) cos[c] = Math.cos((c * dx - cx) / unit - t);
    const yTop = cy / unit;
    const yBottom = -(h - cy) / unit;
    const kMin = Math.ceil((yBottom - Math.PI / 2) / Math.PI);
    const kMax = Math.floor((yTop + Math.PI / 2) / Math.PI);
    ctx.globalAlpha = ALPHA.curves;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    for (let k = kMin; k <= kMax; k++) {
      const s = Math.abs(k) % 2 === 0 ? 1 : -1;
      for (let j = 0; j < CURVES_PER_BAND; j++) {
        // Evenly spaced where cos(x − t) = 0, which spreads the curves evenly over the band.
        const C = Math.asinh(Math.tan(-Math.PI / 2 + ((j + 0.5) * Math.PI) / CURVES_PER_BAND));
        for (let c = 0; c < n; c++) {
          const y = k * Math.PI + gd(C - s * cos[c]);
          const X = c * dx;
          const Y = cy - y * unit;
          if (c === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    canvas.hscFrames += 1;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < FRAME_MS - 1) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; // no jump after a pause
    last = now;
    t += dt * DRIFT;
    draw();
  }

  function stop(state) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    canvas.dataset.motion = state;
  }

  function start() {
    if (isStatic()) {
      stop('static');
      t = T0;
      draw();
      return;
    }
    if (document.hidden) {
      stop('paused');
      return;
    }
    if (!raf) {
      canvas.dataset.motion = 'running';
      draw();
      raf = requestAnimationFrame(frame);
    }
  }

  function onResize() {
    resize();
    draw();
  }

  const onVisibility = () => start();
  const onMotion = () => {
    stop(isStatic() ? 'static' : 'paused');
    start();
  };

  readColour();
  resize();
  start();
  canvas.classList.add('is-ready');
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  reduce.addEventListener('change', onMotion);

  return {
    draw,
    destroy() {
      stop('static');
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      reduce.removeEventListener('change', onMotion);
    },
  };
}
