// particle2d view: drawing only. Reads the model state; never changes physics.
// Each setup has its own drawing function in views/*.js, loaded on demand so a page only downloads the
// drawing code for its own setup (page JS budget, guide §6.7). Until it arrives the stage shows its plain
// background; the index re-renders when onReady fires. This file owns the canvas, the palette and the
// cart's throttle handle (pointer input that the index turns into the cart's live acceleration).
import { createSurface, readPalette, stageFontPx, pointerDrag } from '../../engine-kit.js';

const LOADERS = {
  projectile: () => import('./views/projectile.js').then((m) => m.drawProjectile),
  braking: () => import('./views/motion.js').then((m) => m.drawBraking),
  'resisted-1d': () => import('./views/motion.js').then((m) => m.drawResisted),
  shm: () => import('./views/motion.js').then((m) => m.drawShm),
  cart: () => import('./views/motion.js').then((m) => m.drawCart),
  charged: () => import('./views/fields.js').then((m) => m.drawCharged),
  orbit: () => import('./views/fields.js').then((m) => m.drawOrbit),
  'orbit-gps': () => import('./views/fields.js').then((m) => m.drawOrbitGps),
  circular: () => import('./views/mechanics.js').then((m) => m.drawCircular),
  collisions: () => import('./views/mechanics.js').then((m) => m.drawCollisions),
  'relative-velocity': () => import('./views/mechanics.js').then((m) => m.drawRelative),
  track: () => import('./views/mechanics.js').then((m) => m.drawTrack),
};

/**
 * @param {HTMLElement} stage
 * @param {string} setup
 * @param {{ onThrottle?: (a:number)=>void, onReady?: ()=>void, onError?: (err:Error)=>void }} hooks
 */
export function createView(stage, setup, hooks = {}) {
  const surface = createSurface(stage);
  let pal = readPalette(stage);
  let drawSetup = null;
  let destroyed = false;
  const ui = { throttle: null, enabled: false };
  let pressX = 0;
  const throttleAt = (x) => {
    const r = ui.throttle;
    if (!r) return;
    const a = Math.max(-2, Math.min(2, ((x - r.x) / r.w) * 4 - 2));
    hooks.onThrottle?.(Math.round(a * 10) / 10);
  };
  const detach =
    setup === 'cart'
      ? pointerDrag(surface.canvas, {
          hit: (x, y) => {
            const r = ui.throttle;
            if (!ui.enabled || !r || x < r.x - 16 || x > r.x + r.w + 16 || y < r.y - 18 || y > r.y + r.h + 18) return null;
            pressX = x;
            return 'throttle';
          },
          start: () => throttleAt(pressX),
          move: (target, x) => throttleAt(x),
        })
      : null;

  LOADERS[setup]()
    .then((fn) => {
      if (destroyed) return;
      drawSetup = fn;
      hooks.onReady?.();
    })
    .catch((err) => hooks.onError?.(err));

  function draw(state, params, ahead) {
    const { ctx, width: W, height: H } = surface;
    surface.begin(pal.bg);
    if (!drawSetup) return;
    const px = stageFontPx(W);
    // narrow: phone-sized stages drop secondary panels (graphs and bars that would not fit).
    const S = { W, H, px, pad: Math.round(px * 1.1), ui, narrow: W < 700 };
    ctx.save();
    drawSetup(ctx, S, state, params, ahead, pal);
    ctx.restore();
  }

  return {
    draw,
    resize: () => surface.resize(),
    setTheme() {
      pal = readPalette(stage);
    },
    destroy() {
      destroyed = true;
      detach?.();
      surface.destroy();
    },
  };
}
