// Wave engine view: drawing only. Reads model state; never changes physics.
// One canvas; each setup has its own drawing module.
import { createSurface, readPalette, stageFontPx } from '../../engine-kit.js';
import { physicalTime } from './model.js';
import { drawInterference } from './draw-interference.js';
import { drawModulation } from './draw-modulation.js';
import { drawMachine } from './draw-machine.js';
import { drawDopplerBeats } from './draw-doppler.js';

/** Stage palette plus the colour of a screen in a darkened room (--c-bg, the same in both themes). */
function palette(stage) {
  const screen = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim() || '#0F1012';
  return { ...readPalette(stage), screen };
}

export function createView(stage, setup) {
  const surface = createSurface(stage);
  let pal = palette(stage);

  function draw(state, params) {
    const { ctx, width: W, height: H } = surface;
    const S = { W, H, px: stageFontPx(W) };
    surface.begin(pal.bg);
    const t = physicalTime(state, setup, params);
    if (setup === 'interference') drawInterference(ctx, S, params, pal);
    else if (setup === 'modulation') drawModulation(ctx, S, params, pal, t);
    else if (setup === 'wave-machine') drawMachine(ctx, S, state, params, pal, t);
    else drawDopplerBeats(ctx, S, params, pal, t);
  }

  return {
    draw,
    resize: () => surface.resize(),
    setTheme() {
      pal = palette(stage);
    },
    destroy: () => surface.destroy(),
  };
}
