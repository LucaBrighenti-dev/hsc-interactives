// Reference engine `demo`: y = A sin(2πft + φ). The golden example for engine builders (guide W0-06).
// Copy this structure: meta + create(stage, opts) returning every method in guide §5.1.
import { DT, createState, advance, isComplete, outputs, samples } from './model.js';
import { createView } from './view.js';
import { createLoop, createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber } from '../../format.js';

export const meta = {
  name: 'demo',
  version: '1.0.0',
  setups: ['wave'],
  staticSetups: [], // setups with no time evolution (the shell hides play, pause and step for them)
  stepSize: 24, // fixed steps per press of the shell's Step button (24 × 1/240 s = 0.1 s)
  params: {
    amplitude: { type: 'number', label: 'Amplitude A', unit: 'm', min: 0.1, max: 5, step: 0.1, default: 2 },
    frequency: { type: 'number', label: 'Frequency f', unit: 'Hz', min: 0.1, max: 3, step: 0.05, default: 0.5 },
    phase: { type: 'number', label: 'Phase φ', unit: '°', min: -180, max: 180, step: 5, default: 0 },
    phaseUnit: { type: 'enum', label: 'Show φ in', options: [['deg', 'Degrees'], ['rad', 'Radians']], default: 'deg' },
    duration: { type: 'number', label: 'Run time', unit: 's', min: 1, max: 30, step: 1, default: 10 },
    showPhasor: { type: 'boolean', label: 'Rotating phasor', default: true },
    phasorLabels: { type: 'boolean', label: 'Label the phasor', default: true, visibleWhen: { showPhasor: true } },
    timeScale: { type: 'number', label: 'Playback speed', unit: '×', min: 0.25, max: 2, step: 0.25, default: 1, help: 'Slows down or speeds up the animation only; the physics is unchanged.' },
  },
  outputs: {
    period: { label: 'Period T', unit: 's', sigfigs: 3 },
    y: { label: 'Displacement y', unit: 'm', sigfigs: 3 },
    v: { label: 'Velocity v', unit: 'm/s', sigfigs: 3 },
    t: { label: 'Time t', unit: 's', sigfigs: 3 },
  },
};

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`demo: unknown setup "${setup}"`);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  let state = createState();
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage);

  const render = () => view.draw(state, params);
  const loop = createLoop({
    dt: DT,
    step: () => {
      state = advance(state, params, 1);
    },
    render,
    isComplete: () => isComplete(state, params),
    getTimeScale: () => params.timeScale,
    onFrame: () => {
      emit.tick(state.t);
      emit.outputs(outputs(state, params));
    },
    onComplete: () => {
      emit.outputsNow(outputs(state, params));
      emit.complete();
    },
    onError: (err) => emit.error(err),
  });

  view.resize();
  render();
  emit.outputsNow(outputs(state, params));

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      params = { ...params, ...next };
      // A shorter run time can end the run; clamp the state so it never sits past the end.
      state = advance(state, params, 0);
      render();
      emit.outputsNow(outputs(state, params));
    },
    getParams: () => ({ ...params }),
    play: () => loop.play(),
    pause: () => loop.pause(),
    isPlaying: () => loop.isPlaying(),
    step(n = 1) {
      state = advance(state, params, n); // stops early at the end of the run
      render();
      emit.outputsNow(outputs(state, params));
      if (isComplete(state, params)) emit.complete();
    },
    reset() {
      loop.pause();
      state = createState();
      render();
      emit.outputsNow(outputs(state, params));
    },
    isComplete: () => isComplete(state, params),
    getOutputs: () => outputs(state, params),
    getData: () => ({ columns: ['t (s)', 'y (m)', 'v (m/s)'], rows: samples(state, params) }),
    /** Optional: a sentence for the stage's aria-label. */
    describe: () =>
      `Sine wave with amplitude ${formatNumber(params.amplitude)} metres and frequency ${formatNumber(params.frequency)} hertz, ` +
      `shown as a rotating phasor and a displacement–time graph.`,
    setTheme() {
      view.setTheme();
      render();
    },
    resize() {
      view.resize();
      render();
    },
    destroy() {
      loop.destroy();
      emit.destroy();
      view.destroy();
    },
  };
}
