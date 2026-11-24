// rays engine: a 2D ray box. Snell's law, the critical angle and total internal reflection with a
// rectangular block, a semicircular block, two media, and an optical fibre (core and cladding).
// Static (no time evolution): play, pause and step are no-ops and isComplete() is always true.
import { solve, sweep, angleFromPoint } from './model.js';
import { createView } from './view.js';
import { createEmitter, pointerDrag } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';

const INDEX = { type: 'number', min: 1, max: 3, step: 0.01 };

export const meta = {
  name: 'rays',
  version: '1.0.0',
  setups: ['ray-box'],
  staticSetups: ['ray-box'],
  params: {
    scene: {
      type: 'enum',
      label: 'Scene',
      options: [
        ['boundary', 'Two media'],
        ['rect', 'Rectangular block'],
        ['semi', 'Semicircular block'],
        ['fibre', 'Optical fibre'],
      ],
      default: 'rect',
      widget: 'select',
    },
    angle: {
      type: 'number',
      label: 'Angle of incidence θᵢ',
      unit: '°',
      min: 0,
      max: 89,
      step: 0.1,
      default: 30,
      help: 'Measured from the normal where the ray box aims. For the fibre this is the launch angle to the fibre axis. You can also drag the ray box.',
    },
    n1: { ...INDEX, label: 'Upper medium n₁', default: 1, visibleWhen: { scene: 'boundary' } },
    n2: { ...INDEX, label: 'Lower medium n₂', default: 1.5, visibleWhen: { scene: 'boundary' } },
    nBlock: { ...INDEX, label: 'Block n', default: 1.5, visibleWhen: { scene: ['rect', 'semi'] } },
    nCore: { ...INDEX, label: 'Core n', default: 1.5, visibleWhen: { scene: 'fibre' } },
    nClad: { ...INDEX, label: 'Cladding n', default: 1.4, visibleWhen: { scene: 'fibre' } },
    nOuter: { ...INDEX, label: 'Surroundings n₀', default: 1, visibleWhen: { scene: ['rect', 'semi', 'fibre'] } },
    showProtractor: { type: 'boolean', label: 'Protractor', default: true },
    showCritical: { type: 'boolean', label: 'Show the critical angle', default: true, help: 'Dashed line at the critical angle (and, for the fibre, the acceptance cone).' },
    showPartial: { type: 'boolean', label: 'Partial reflections', default: true, help: 'Faint reflected rays; brighter when more light reflects (Fresnel equations, unpolarised light).' },
  },
  outputs: {
    incidence: { label: 'Angle of incidence θᵢ', unit: '°', sigfigs: 3 },
    refraction: { label: 'Angle of refraction θᵣ', unit: '°', sigfigs: 3 },
    critical: { label: 'Critical angle θc', unit: '°', sigfigs: 3 },
    reflectance: { label: 'Reflected', unit: '%', sigfigs: 3 },
    tirCount: { label: 'TIR count', unit: '', integer: true },
    interactions: { label: 'Interactions', unit: '', integer: true },
    wallAngle: { label: 'Angle at cladding φ', unit: '°', sigfigs: 3 },
    acceptance: { label: 'Acceptance angle θₐ', unit: '°', sigfigs: 3 },
    na: { label: 'Numerical aperture', unit: '', sigfigs: 3 },
    guided: { label: 'Guided (1 yes, 0 no)', unit: '', integer: true },
  },
};

const SCENE_NAMES = { boundary: 'two media', rect: 'a rectangular block', semi: 'a semicircular block', fibre: 'an optical fibre' };

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`rays: unknown setup "${setup}"`);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  let sol = solve(params);
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage);

  const render = () => view.draw(sol, params);
  const update = () => {
    sol = solve(params);
    render();
    emit.outputsNow(sol.outputs);
  };

  // Drag the ray box to set the angle (to 0.1°, the slider's step). The new value is reported with a
  // 'params' event so a shell that listens can move the slider and update the link.
  const detachDrag = pointerDrag(view.canvas, {
    hit: (x, y) => (view.hitSource(x, y) ? 'source' : null),
    move: (_target, x, y) => {
      const w = view.toWorld(x, y);
      if (!w) return;
      const angle = Math.round(angleFromPoint(sol.scene, w[0], w[1]) * 10) / 10;
      if (angle === params.angle) return;
      params = { ...params, angle };
      update();
      opts.onEvent?.('params', { angle });
    },
  });

  view.resize();
  render();
  emit.outputsNow(sol.outputs);

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      params = { ...params, ...next };
      update();
    },
    getParams: () => ({ ...params }),
    // Static engine: nothing evolves in time.
    play: () => false,
    pause() {},
    isPlaying: () => false,
    step() {
      emit.outputsNow(sol.outputs);
    },
    reset() {
      render();
      emit.outputsNow(sol.outputs);
    },
    isComplete: () => true,
    getOutputs: () => ({ ...sol.outputs }),
    getData: () => sweep(params),
    describe: () => describe(sol, params),
    setTheme() {
      view.setTheme();
      render();
    },
    resize() {
      view.resize();
      render();
    },
    destroy() {
      detachDrag();
      emit.destroy();
      view.destroy();
    },
  };
}

function describe(sol, params) {
  const o = sol.outputs;
  const f = (x) => `${x.toFixed(1)} degrees`;
  const where = `A ray box shines into ${SCENE_NAMES[sol.scene.kind]} at ${f(params.angle)} to the normal.`;
  if (sol.scene.kind === 'fibre') {
    const fate =
      o.refraction === null
        ? 'It is totally internally reflected at the end face, so no light enters the fibre.'
        : o.guided
          ? `It is guided along the core by ${o.tirCount} total internal reflections.`
          : 'It escapes from the core into the cladding.';
    return `${where} ${fate}`;
  }
  if (o.refraction === null) return `${where} It is totally internally reflected.`;
  return `${where} It refracts at ${f(o.refraction)}${o.tirCount ? `, then is totally internally reflected ${o.tirCount} times` : ''}.`;
}
