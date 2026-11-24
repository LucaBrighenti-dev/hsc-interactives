// Wave engine (guide §9.1): interference (single slit, double slit, grating), modulation (AM, FM, PM),
// the wave machine (transverse, longitudinal, superposition, standing waves) and Doppler with beats.
// Contract: guide §5.1. Physics in model.js, drawing in view.js and draw-*.js.
import { DT, createState, advance, isComplete, outputs, samples, observedFrequency, physicalTime, apertureGeometry, interferenceOutputs, standingFrequency, harmonicNumber, beatFrequency } from './model.js';
import { createView } from './view.js';
import { createAudio } from './audio.js';
import { createLoop, createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber, formatPlain, siPrefix } from '../../format.js';

const I = ['interference'];
const M = ['modulation'];
const W = ['wave-machine'];
const D = ['doppler-beats'];

export const meta = {
  name: 'wave',
  version: '1.0.0',
  setups: ['interference', 'modulation', 'wave-machine', 'doppler-beats'],
  staticSetups: ['interference'],
  stepSize: 24, // 24 × 1/240 s = 0.1 s of animation per Step press
  params: {
    // ---- interference
    aperture: { type: 'enum', label: 'Aperture', options: [['single', 'Single slit'], ['double', 'Double slit'], ['grating', 'Grating']], default: 'double', setups: I },
    wavelength: { type: 'number', label: 'Wavelength λ', unit: 'nm', min: 350, max: 800, step: 1, default: 600, setups: I, help: 'Visible light is about 380–750 nm. Outside that the pattern is drawn in grey.' },
    slitSeparation: { type: 'number', label: 'Slit separation d', unit: 'mm', min: 0.05, max: 2, step: 0.01, default: 0.25, setups: I, visibleWhen: { aperture: 'double' } },
    slitWidth: { type: 'number', label: 'Slit width a', unit: 'mm', min: 0.01, max: 0.5, step: 0.005, default: 0.05, setups: I, visibleWhen: { aperture: ['single', 'double'] } },
    linesPerMm: { type: 'number', label: 'Lines per mm', unit: 'lines/mm', min: 50, max: 1200, step: 10, default: 600, setups: I, visibleWhen: { aperture: 'grating' }, help: 'Slit spacing d = 1/(lines per mm).' },
    illuminatedLines: { type: 'number', label: 'Slits lit N', unit: '', min: 2, max: 1000, step: 1, integer: true, default: 100, setups: I, visibleWhen: { aperture: 'grating' }, help: 'More slits make each bright maximum narrower; it does not move.' },
    slitFraction: { type: 'number', label: 'Slit width ÷ spacing a/d', unit: '', min: 0.05, max: 0.9, step: 0.05, default: 0.2, setups: I, visibleWhen: { aperture: 'grating' } },
    screenDistance: { type: 'number', label: 'Screen distance L', unit: 'm', min: 0.2, max: 5, step: 0.05, default: 2, setups: I },
    screenView: {
      type: 'enum',
      label: 'Screen shown',
      widget: 'select',
      options: [['auto', 'Auto'], ['0.005', '±5 mm'], ['0.01', '±10 mm'], ['0.02', '±20 mm'], ['0.05', '±50 mm'], ['0.1', '±100 mm'], ['0.2', '±200 mm'], ['0.5', '±0.5 m'], ['1', '±1 m'], ['2', '±2 m'], ['5', '±5 m'], ['10', '±10 m']],
      default: 'auto',
      setups: I,
    },
    showEnvelope: { type: 'boolean', label: 'Single-slit envelope', default: true, setups: I, visibleWhen: { aperture: ['double', 'grating'] } },
    showSmallAngle: { type: 'boolean', label: 'Small-angle prediction', default: true, setups: I, help: 'Marks where y = mλL/d (or mλL/a) would put each fringe.' },

    // ---- modulation
    modulation: { type: 'enum', label: 'Modulation', options: [['am', 'AM'], ['fm', 'FM'], ['pm', 'PM']], default: 'am', setups: M },
    messageShape: { type: 'enum', label: 'Message', options: [['sine', 'Sine (analogue)'], ['square', 'Square (digital)']], default: 'sine', setups: M },
    carrierFrequency: { type: 'number', label: 'Carrier frequency', unit: 'Hz', min: 10, max: 50, step: 1, default: 20, setups: M },
    messageFrequency: { type: 'number', label: 'Message frequency', unit: 'Hz', min: 0.2, max: 5, step: 0.1, default: 1, setups: M },
    amIndex: { type: 'number', label: 'Modulation index m', unit: '', min: 0, max: 1.5, step: 0.05, default: 0.5, setups: M, visibleWhen: { modulation: 'am' }, help: 'Above 1 the carrier is over-modulated.' },
    fmDeviation: { type: 'number', label: 'Frequency deviation Δf', unit: 'Hz', min: 0, max: 10, step: 0.5, default: 5, setups: M, visibleWhen: { modulation: 'fm' } },
    pmDeviation: { type: 'number', label: 'Phase deviation Δφ', unit: 'rad', min: 0, max: 2, step: 0.05, default: 1.5, setups: M, visibleWhen: { modulation: 'pm' } },
    traceWindow: { type: 'number', label: 'Time shown', unit: 's', min: 0.5, max: 5, step: 0.5, default: 2, setups: M },
    showSpectrum: { type: 'boolean', label: 'Frequency spectrum', default: true, setups: M },

    // ---- wave machine
    waveType: { type: 'enum', label: 'Wave', widget: 'select', options: [['transverse', 'Transverse'], ['longitudinal', 'Longitudinal'], ['superposition', 'Superposition'], ['standing', 'Standing waves']], default: 'transverse', setups: W },
    superShape: { type: 'enum', label: 'Waves', options: [['pulses', 'Two pulses'], ['continuous', 'Two waves']], default: 'pulses', setups: W, visibleWhen: { waveType: 'superposition' } },
    amplitude: { type: 'number', label: 'Amplitude A', unit: 'm', min: 0.05, max: 1, step: 0.05, default: 0.4, setups: W, visibleWhen: { waveType: ['transverse', 'longitudinal', 'superposition'] } },
    frequency: { type: 'number', label: 'Frequency f', unit: 'Hz', min: 0.1, max: 2, step: 0.05, default: 0.5, setups: W, visibleWhen: { waveType: ['transverse', 'longitudinal'] } },
    frequency1: { type: 'number', label: 'Wave 1 frequency f₁', unit: 'Hz', min: 0.1, max: 2, step: 0.05, default: 0.5, setups: W, visibleWhen: { waveType: 'superposition', superShape: 'continuous' } },
    waveSpeed: { type: 'number', label: 'Wave speed v', unit: 'm/s', min: 0.5, max: 5, step: 0.1, default: 2, setups: W, visibleWhen: { waveType: ['transverse', 'longitudinal', 'superposition'] } },
    amplitude2: { type: 'number', label: 'Wave 2 amplitude A₂', unit: 'm', min: -1, max: 1, step: 0.05, default: 0.4, setups: W, visibleWhen: { waveType: 'superposition' }, help: 'Negative: wave 2 is inverted.' },
    frequency2: { type: 'number', label: 'Wave 2 frequency f₂', unit: 'Hz', min: 0.1, max: 2, step: 0.05, default: 0.5, setups: W, visibleWhen: { waveType: 'superposition', superShape: 'continuous' } },
    direction2: { type: 'enum', label: 'Wave 2 travels', options: [['left', '← Left'], ['right', 'Right →']], default: 'left', setups: W, visibleWhen: { waveType: 'superposition', superShape: 'continuous' } },
    boundary: { type: 'enum', label: 'Medium', options: [['string', 'String'], ['open', 'Open pipe'], ['closed', 'Closed pipe']], default: 'string', setups: W, visibleWhen: { waveType: 'standing' }, help: 'Closed pipe: closed at the left end, open at the right.' },
    harmonic: { type: 'number', label: 'Mode n', unit: '', min: 1, max: 8, step: 1, integer: true, default: 1, setups: W, visibleWhen: { waveType: 'standing' }, help: 'For a closed pipe, mode n is the (2n − 1)th harmonic.' },
    mediumLength: { type: 'number', label: 'Length L', unit: 'm', min: 0.1, max: 3, step: 0.01, default: 0.5, setups: W, visibleWhen: { waveType: 'standing' } },
    standingSpeed: { type: 'number', label: 'Wave speed v', unit: 'm/s', min: 10, max: 1500, step: 1, default: 340, setups: W, visibleWhen: { waveType: 'standing' }, help: 'For a pipe this is the speed of sound in the air inside it (340 m/s by default).' },
    showParticles: { type: 'boolean', label: 'Show particles', default: true, setups: W, visibleWhen: { waveType: ['transverse', 'standing'] } },

    // ---- Doppler and beats
    dopplerMode: { type: 'enum', label: 'Show', options: [['doppler', 'Doppler effect'], ['beats', 'Beats']], default: 'doppler', setups: D },
    sourceFrequency: { type: 'number', label: 'Source frequency f', unit: 'Hz', min: 100, max: 1000, step: 10, default: 500, setups: D, visibleWhen: { dopplerMode: 'doppler' } },
    sourceSpeed: { type: 'number', label: 'Source speed vₛ', unit: 'm/s', min: -150, max: 150, step: 1, default: 20, setups: D, visibleWhen: { dopplerMode: 'doppler' }, help: 'Positive: moving towards the observer.' },
    observerSpeed: { type: 'number', label: 'Observer speed vₒ', unit: 'm/s', min: -150, max: 150, step: 1, default: 0, setups: D, visibleWhen: { dopplerMode: 'doppler' }, help: 'Positive: moving towards the source.' },
    soundSpeed: { type: 'number', label: 'Speed of sound v', unit: 'm/s', min: 250, max: 1500, step: 1, default: 340, setups: D, visibleWhen: { dopplerMode: 'doppler' } },
    toneFrequency1: { type: 'number', label: 'Frequency f₁', unit: 'Hz', min: 100, max: 1000, step: 1, default: 440, setups: D, visibleWhen: { dopplerMode: 'beats' } },
    toneFrequency2: { type: 'number', label: 'Frequency f₂', unit: 'Hz', min: 100, max: 1000, step: 1, default: 444, setups: D, visibleWhen: { dopplerMode: 'beats' } },
    beatWindow: { type: 'number', label: 'Time shown', unit: 's', min: 0.25, max: 4, step: 0.25, default: 1, setups: D, visibleWhen: { dopplerMode: 'beats' } },
    playSound: { type: 'boolean', label: 'Play sound', default: false, setups: D, help: 'Plays through the speakers until you turn it off. It never starts by itself.' },

    timeScale: { type: 'number', label: 'Playback speed', unit: '×', min: 0.25, max: 2, step: 0.25, default: 1, setups: [...M, ...W, ...D] },
  },
  outputs: {
    firstOrderAngle: { label: 'First-order angle θ₁', unit: '°', sigfigs: 4, setups: I },
    firstOrderPosition: { label: 'First-order position y₁', unit: 'm', sigfigs: 3, siPrefix: true, setups: I },
    smallAnglePosition: { label: 'Small-angle estimate of y₁', unit: 'm', sigfigs: 3, siPrefix: true, setups: I },
    fringeSpacing: { label: 'Fringe spacing Δy', unit: 'm', sigfigs: 3, siPrefix: true, setups: I },
    centralWidth: { label: 'Central bright fringe width', unit: 'm', sigfigs: 3, siPrefix: true, setups: I },
    maxOrder: { label: 'Highest order m', unit: '', integer: true, setups: I },
    modIndex: { label: 'Modulation index', unit: '', sigfigs: 3, setups: M },
    bandwidth: { label: 'Bandwidth', unit: 'Hz', sigfigs: 3, setups: M },
    upperSideband: { label: 'Upper side frequency', unit: 'Hz', sigfigs: 3, setups: M },
    lowerSideband: { label: 'Lower side frequency', unit: 'Hz', sigfigs: 3, setups: M },
    instantaneousFrequency: { label: 'Instantaneous frequency', unit: 'Hz', sigfigs: 3, setups: M },
    wavelength: { label: 'Wavelength λ', unit: 'm', sigfigs: 3, setups: W },
    period: { label: 'Period T', unit: 's', sigfigs: 3, siPrefix: true, setups: W },
    waveFrequency: { label: 'Frequency f', unit: 'Hz', sigfigs: 3, setups: W },
    fundamental: { label: 'Fundamental f₁', unit: 'Hz', sigfigs: 3, setups: W },
    observedFrequency: { label: 'Heard frequency f′', unit: 'Hz', sigfigs: 4, setups: D },
    frequencyShift: { label: 'Shift f′ − f', unit: 'Hz', sigfigs: 3, setups: D },
    wavelengthAhead: { label: 'λ in front of the source', unit: 'm', sigfigs: 3, setups: D },
    wavelengthBehind: { label: 'λ behind the source', unit: 'm', sigfigs: 3, setups: D },
    beatFrequency: { label: 'Beat frequency', unit: 'Hz', sigfigs: 3, setups: D },
    beatPeriod: { label: 'Beat period', unit: 's', sigfigs: 3, setups: D },
    averageFrequency: { label: 'Average frequency', unit: 'Hz', sigfigs: 4, setups: D },
    time: { label: 'Time t', unit: 's', sigfigs: 3, setups: [...M, ...W, ...D] },
  },
};

/** Params whose change restarts a run, because positions depend on them from t = 0. */
const RESTART_KEYS = {
  'wave-machine': ['waveType', 'superShape', 'waveSpeed'],
  'doppler-beats': ['dopplerMode', 'sourceSpeed', 'observerSpeed', 'soundSpeed'],
};

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`wave: unknown setup "${setup}"`);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  if ('playSound' in params) params.playSound = false; // sound only ever starts from a click
  let state = createState();
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage, setup);
  const audio = setup === 'doppler-beats' ? createAudio() : null;

  const syncAudio = () => {
    if (!audio) return;
    if (!params.playSound) {
      audio.stop();
      return;
    }
    if (params.dopplerMode === 'beats') audio.play([params.toneFrequency1, params.toneFrequency2]);
    else audio.play([observedFrequency(physicalTime(state, setup, params), params)]);
  };

  // Never leave a tone playing in a hidden tab; pick it up again when the tab returns.
  const onVisibility = () => {
    if (document.hidden) audio?.stop();
    else syncAudio();
  };
  if (audio) document.addEventListener('visibilitychange', onVisibility);

  const render = () => view.draw(state, params);
  const current = () => outputs(state, setup, params);
  const loop = createLoop({
    dt: DT,
    step: () => {
      state = advance(state, setup, params, 1);
    },
    render,
    isComplete: () => isComplete(state, setup, params),
    getTimeScale: () => params.timeScale ?? 1,
    onFrame: () => {
      emit.tick(physicalTime(state, setup, params));
      emit.outputs(current());
      if (audio && params.playSound && params.dopplerMode === 'doppler') syncAudio();
    },
    onComplete: () => {
      emit.outputsNow(current());
      emit.complete();
    },
    onError: (err) => emit.error(err),
  });

  view.resize();
  render();
  emit.outputsNow(current());

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      const before = params;
      params = { ...params, ...next };
      const restart = (RESTART_KEYS[setup] ?? []).some((k) => k in next && next[k] !== before[k]);
      // A restart puts positions back at t = 0; otherwise clamp so the state never sits past the end.
      state = restart ? createState() : advance(state, setup, params, 0);
      syncAudio();
      render();
      emit.outputsNow(current());
    },
    getParams: () => ({ ...params }),
    play: () => loop.play(),
    pause: () => loop.pause(),
    isPlaying: () => loop.isPlaying(),
    step(n = 1) {
      state = advance(state, setup, params, n); // stops early at the end of a run; no-op when static
      render();
      emit.outputsNow(current());
      if (params.playSound) syncAudio();
      if (!meta.staticSetups.includes(setup) && isComplete(state, setup, params)) emit.complete();
    },
    reset() {
      loop.pause();
      state = createState();
      if (params.playSound) syncAudio();
      render();
      emit.outputsNow(current());
    },
    isComplete: () => isComplete(state, setup, params),
    getOutputs: () => current(),
    getData: () => samples(state, setup, params),
    describe: () => describe(setup, params, state),
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
      if (audio) document.removeEventListener('visibilitychange', onVisibility);
      audio?.destroy();
      view.destroy();
    },
  };
}

/** A sentence for the stage's aria-label. */
function describe(setup, p, state) {
  if (setup === 'interference') {
    const g = apertureGeometry(p);
    const out = interferenceOutputs(p);
    const name = { single: 'Single slit', double: 'Double slit', grating: 'Diffraction grating' }[g.kind];
    const first = out.firstOrderPosition === null ? '' : g.kind === 'single' ? ` The first dark fringe is ${siPrefix(out.firstOrderPosition, 'm')} from the centre.` : ` The first-order maximum is at ${formatNumber(out.firstOrderAngle)} degrees, ${siPrefix(out.firstOrderPosition, 'm')} from the centre.`;
    return `${name} with ${formatPlain(p.wavelength)} nanometre light and a screen ${formatPlain(p.screenDistance)} metres away, showing the pattern on the screen and its intensity graph.${first}`;
  }
  if (setup === 'modulation') {
    return `${p.modulation.toUpperCase()}: a ${formatPlain(p.carrierFrequency)} hertz carrier modulated by a ${formatPlain(p.messageFrequency)} hertz ${p.messageShape} message, shown as scrolling message, carrier and modulated-signal traces${p.showSpectrum ? ' with a frequency spectrum' : ''}.`;
  }
  if (setup === 'wave-machine') {
    if (p.waveType === 'standing') {
      const f = standingFrequency(p.boundary, p.harmonic, p.mediumLength, p.standingSpeed);
      const where = { string: 'on a string fixed at both ends', open: 'in a pipe open at both ends', closed: 'in a pipe closed at one end' }[p.boundary];
      return `Standing wave ${where}, length ${formatPlain(p.mediumLength)} metres, harmonic ${harmonicNumber(p.boundary, p.harmonic)} at ${formatNumber(f)} hertz, with nodes and antinodes labelled.`;
    }
    if (p.waveType === 'superposition') return `Superposition of two ${p.superShape === 'pulses' ? 'pulses' : 'waves'} on a rope, showing each one and their sum.`;
    return `${p.waveType === 'longitudinal' ? 'Longitudinal' : 'Transverse'} wave travelling right at ${formatPlain(p.waveSpeed)} metres per second with frequency ${formatPlain(p.frequency)} hertz.`;
  }
  if (p.dopplerMode === 'beats') return `Beats from ${formatPlain(p.toneFrequency1)} hertz and ${formatPlain(p.toneFrequency2)} hertz: the sum rises and falls ${formatNumber(beatFrequency(p.toneFrequency1, p.toneFrequency2))} times a second.`;
  const f = observedFrequency(physicalTime(state, setup, p), p);
  return `Doppler effect: a ${formatPlain(p.sourceFrequency)} hertz source moving at ${formatPlain(p.sourceSpeed)} metres per second; the observer hears ${formatNumber(f, { sigfigs: 4 })} hertz.`;
}
