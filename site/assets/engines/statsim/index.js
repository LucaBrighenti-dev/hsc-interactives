// statsim engine: seeded random sampling with live histograms and theory overlays.
// Setups: 'sampling' (Bernoulli trials → binomial; sample means → normal), 'normal-approx' (binomial
// with a normal overlay and continuity correction; static), 'decay' (random-decay grid and half-life).
import * as M from './model.js';
import { createView, populationLabel, formatProbability } from './view.js';
import { createLoop, createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber, formatPlain } from '../../format.js';

const TICK = 1 / 120; // s of playback per loop step; the setup turns playback time into draws or decay steps

export const meta = {
  name: 'statsim',
  version: '1.2.0',
  setups: ['sampling', 'normal-approx', 'decay'],
  staticSetups: ['normal-approx'],
  stepSize: 1, // Step draws one sample (sampling) or advances one 1 s decay step (decay)
  params: {
    // ---- sampling
    mode: {
      type: 'enum',
      label: 'Draw',
      options: [['binomial', 'Bernoulli trials (X)'], ['means', 'Sample means (x̄)']],
      default: 'means',
      setups: ['sampling'],
      help: 'Bernoulli trials count the successes X in n trials. Sample means average n draws from the chosen population.',
    },
    population: {
      type: 'enum',
      label: 'Population',
      options: [
        ['bernoulli', 'Bernoulli (0 or 1)'],
        ['die', 'Fair die (1 to 6)'],
        ['uniform', 'Uniform on [0, 1]'],
        ['normal', 'Normal N(0, 1)'],
        ['exponential', 'Exponential (rate λ)'],
        ['skewed', 'Right-skewed (0 to 5)'],
        ['ushaped', 'U-shaped on [0, 1]'],
      ],
      widget: 'select',
      default: 'exponential',
      setups: ['sampling'],
      visibleWhen: { mode: 'means' },
      help: 'Each sample is n values drawn from this population. Bernoulli trials always draw from Bernoulli (0 or 1).',
    },
    p: { type: 'number', label: 'Success probability p', unit: '', min: 0.01, max: 0.99, step: 0.01, default: 0.3, setups: ['sampling'], visibleWhen: { population: 'bernoulli' } },
    rate: { type: 'number', label: 'Rate λ', unit: '', min: 0.2, max: 5, step: 0.1, default: 1, setups: ['sampling'], visibleWhen: { population: 'exponential' }, help: 'Population mean 1/λ and standard deviation 1/λ.' },
    n: { type: 'number', label: 'Sample size n', unit: '', min: 1, max: 100, step: 1, integer: true, default: 10, setups: ['sampling'] },
    samples: { type: 'number', label: 'Number of samples', unit: '', min: 10, max: 20000, step: 10, integer: true, default: 1000, setups: ['sampling'] },
    drawRate: { type: 'number', label: 'Top speed', unit: 'samples/s', min: 1, max: 500, step: 1, integer: true, default: 200, setups: ['sampling'], help: 'Drawing starts at one sample a second and speeds up to this rate.' },
    meansAxis: { type: 'enum', label: 'x̄ axis', options: [['shared', 'Population scale'], ['zoom', 'Zoom in']], default: 'shared', setups: ['sampling'], visibleWhen: { mode: 'means' } },
    yScale: { type: 'enum', label: 'Bar heights', options: [['count', 'Frequency'], ['relative', 'Relative frequency']], default: 'count', setups: ['sampling'] },
    // ---- normal approximation
    trials: { type: 'number', label: 'Number of trials n', unit: '', min: 1, max: 200, step: 1, integer: true, default: 20, setups: ['normal-approx'] },
    prob: { type: 'number', label: 'Success probability p', unit: '', min: 0.01, max: 0.99, step: 0.01, default: 0.3, setups: ['normal-approx'] },
    event: { type: 'enum', label: 'Probability', options: [['le', 'P(X ≤ k)'], ['ge', 'P(X ≥ k)'], ['eq', 'P(X = k)']], default: 'le', setups: ['normal-approx'] },
    k: { type: 'number', label: 'Value k', unit: '', min: 0, max: 200, step: 1, integer: true, default: 6, setups: ['normal-approx'], help: 'At most n.' },
    continuity: { type: 'boolean', label: 'Continuity correction', default: true, setups: ['normal-approx'] },
    // ---- decay
    nuclei: { type: 'number', label: 'Nuclei N₀', unit: '', min: 100, max: 10000, step: 100, integer: true, default: 1000, setups: ['decay'] },
    halfLife: { type: 'number', label: 'Half-life H', unit: 's', min: 1, max: 60, step: 0.5, default: 10, setups: ['decay'] },
    duration: { type: 'number', label: 'Run time', unit: 's', min: 10, max: 600, step: 10, integer: true, default: 60, setups: ['decay'] },
    // ---- shared
    showCurve: { type: 'boolean', label: 'Theoretical curve', default: true, setups: ['sampling', 'decay'] },
    seed: { type: 'number', label: 'Random seed', unit: '', min: 1, max: 99999, step: 1, integer: true, default: 2026, setups: ['sampling', 'decay'], help: 'The same seed gives exactly the same draws.' },
    timeScale: { type: 'number', label: 'Playback speed', unit: '×', min: 0.25, max: 2, step: 0.25, default: 1, setups: ['sampling', 'decay'] },
  },
  outputs: {
    // sampling (X in binomial mode, x̄ in means mode). Counts are integer: shown as "344", never "344.0".
    count: { label: 'Samples drawn', unit: '', integer: true, setups: ['sampling'] },
    latest: { label: 'Latest value', unit: '', sigfigs: 4, setups: ['sampling'] }, // X or x̄; prefer latestX and latestMean
    // Bernoulli trials only (successes in the latest sample), else null.
    latestX: { label: 'Latest X', unit: '', integer: true, setups: ['sampling'] },
    // Sample means only (x̄ of the latest sample), else null. No "x̄" in the label: JetBrains Mono, the
    // readout label font, misplaces the combining macron.
    latestMean: { label: 'Latest mean', unit: '', sigfigs: 4, setups: ['sampling'] },
    simMean: { label: 'Simulated mean', unit: '', sigfigs: 4, setups: ['sampling'] },
    simSD: { label: 'Simulated SD', unit: '', sigfigs: 4, setups: ['sampling'] },
    theoryMean: { label: 'Theoretical mean', unit: '', sigfigs: 4, setups: ['sampling'] },
    theorySD: { label: 'Theoretical SD', unit: '', sigfigs: 4, setups: ['sampling'] },
    popMean: { label: 'Population mean μ', unit: '', sigfigs: 4, setups: ['sampling'] },
    popSD: { label: 'Population SD σ', unit: '', sigfigs: 4, setups: ['sampling'] },
    // normal approximation. Labels fit a phone readout column (18 characters): the error is named by its
    // sign convention, normal − exact, which the stage's results panel also shows.
    exact: { label: 'Exact probability', unit: '', sigfigs: 4, setups: ['normal-approx'] },
    approx: { label: 'Normal approx.', unit: '', sigfigs: 4, setups: ['normal-approx'] },
    error: { label: 'Normal − exact', unit: '', sigfigs: 3, setups: ['normal-approx'] },
    mean: { label: 'Mean np', unit: '', sigfigs: 4, setups: ['normal-approx'] },
    sd: { label: 'SD √(np(1 − p))', unit: '', sigfigs: 4, setups: ['normal-approx'] },
    z: { label: 'Boundary z-score', unit: '', sigfigs: 3, setups: ['normal-approx'] },
    // decay. t is a whole number of 1 s steps; the activity is the whole number of decays in the last 1 s step.
    t: { label: 'Time t', unit: 's', integer: true, setups: ['decay'] },
    remaining: { label: 'Remaining N', unit: '', integer: true, setups: ['decay'] },
    decayed: { label: 'Decayed', unit: '', integer: true, setups: ['decay'] },
    theoryRemaining: { label: 'Theory N₀(½)^(t/H)', unit: '', sigfigs: 4, setups: ['decay'] }, // an expected value, not a count
    measuredHalfLife: { label: 'Measured half-life', unit: 's', sigfigs: 3, setups: ['decay'] },
    probability: { label: 'P(decay) per step', unit: '', sigfigs: 3, setups: ['decay'] },
    lastDecays: { label: 'Activity', unit: 'Bq', integer: true, setups: ['decay'] }, // decays in the last 1 s step
  },
};

/** Per-setup behaviour behind the common engine API. */
const SIMS = {
  sampling: {
    resetKeys: ['mode', 'population', 'p', 'rate', 'n', 'meansAxis', 'seed'],
    normalise(p) {
      // Bernoulli trials are draws from the Bernoulli population; keeping the param in step means the
      // p control (shown for the Bernoulli population) is visible in that mode too.
      return p.mode === 'binomial' && p.population !== 'bernoulli' ? { ...p, population: 'bernoulli' } : p;
    },
    create: (p) => M.createSampling(p),
    advance: (s, p, k) => M.advanceSampling(s, p, k),
    complete: (s, p) => M.samplingComplete(s, p),
    outputs: (s, p) => M.samplingOutputs(s, p),
    rate: (s, p) => M.samplesPerSecond(s.count, p.drawRate),
    // A smaller target than the samples already drawn starts again.
    staleAfter: (s, prev, next) => next.samples < s.count,
    data: (s, p) => ({ columns: ['Sample', p.mode === 'binomial' ? 'Successes X' : 'Sample mean x̄'], rows: M.samplingRows(s) }),
    describe(s, p) {
      const progress = `${s.count} of ${p.samples} samples drawn.`;
      if (p.mode === 'binomial') {
        return `Bernoulli trials with success probability ${formatPlain(p.p)}: each sample is ${p.n} trials, and its number of successes is added to a histogram with the binomial distribution overlaid. ${progress}`;
      }
      return `Sample means of size ${p.n} from the population "${populationLabel(p)}", built into a histogram with the normal curve of mean μ and standard deviation σ/√n overlaid. ${progress}`;
    },
  },
  'normal-approx': {
    resetKeys: [],
    normalise: (p) => (p.k > p.trials ? { ...p, k: p.trials } : p),
    create: (p) => ({ result: M.normalApprox(p), pmf: M.binomialPmfs(p.trials, p.prob) }),
    advance: (s) => s,
    complete: () => true,
    outputs: (s) => {
      const r = s.result;
      return { exact: r.exact, approx: r.approx, error: r.error, mean: r.mean, sd: r.sd, z: r.z };
    },
    rate: () => 0,
    staleAfter: () => true, // recomputed on every change (cheap)
    data: (s, p) => ({
      columns: ['k', 'P(X = k)', 'P(X ≤ k)', 'Normal P(Y ≤ k + 0.5)', 'Normal P(Y ≤ k)'],
      rows: M.binomialRows(p),
    }),
    describe(s, p) {
      const r = s.result;
      const sym = { le: 'at most', ge: 'at least', eq: 'exactly' }[p.event];
      return `Binomial distribution with n = ${p.trials} and p = ${formatPlain(p.prob)}, with the normal curve of mean ${formatNumber(r.mean)} and standard deviation ${formatNumber(r.sd)} overlaid. The probability of ${sym} ${p.k} successes is ${formatProbability(r.exact)} exactly and ${formatProbability(r.approx)} by the normal approximation${p.continuity ? ' with the continuity correction' : ''}.`;
    },
  },
  decay: {
    resetKeys: ['nuclei', 'halfLife', 'seed'],
    normalise: (p) => p,
    create: (p) => M.createDecay(p),
    advance: (s, p, k) => M.advanceDecay(s, p, k),
    complete: (s, p) => M.decayComplete(s, p),
    outputs: (s, p) => M.decayOutputs(s, p),
    rate: (s, p) => M.decayStepsPerSecond(p.duration),
    // A shorter run than the time already simulated starts again.
    staleAfter: (s, prev, next) => M.decaySteps(next) < s.step,
    data: (s, p) => ({ columns: ['t (s)', 'Remaining N', 'Decays in step', 'Theory N₀(1/2)^(t/H)'], rows: M.decayRows(s, p) }),
    describe(s, p) {
      return `Grid of ${p.nuclei} nuclei, each decaying in a 1 second step with probability 1 − 2^(−1/H) for half-life H = ${formatPlain(p.halfLife)} s. ${s.remaining} remain at t = ${s.step} s, graphed against the curve N₀(1/2)^(t/H).`;
    },
  },
};

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`statsim: unknown setup "${setup}"`);
  const sim = SIMS[setup];
  const isStatic = meta.staticSetups.includes(setup);

  let params = sim.normalise({ ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params });
  let state = sim.create(params);
  let carry = 1; // playback accumulator: the first tick after play acts at once
  let playT = 0;
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage, setup);

  const render = () => view.draw(state, params);
  const outputs = () => sim.outputs(state, params);
  const loop = isStatic
    ? null
    : createLoop({
        dt: TICK,
        step: (dt) => {
          playT += dt;
          carry += sim.rate(state, params) * dt;
          const k = Math.floor(carry);
          if (k > 0) {
            carry -= k;
            sim.advance(state, params, k);
          }
        },
        render,
        isComplete: () => sim.complete(state, params),
        getTimeScale: () => params.timeScale,
        onFrame: () => {
          emit.tick(playT);
          emit.outputs(outputs());
        },
        onComplete: () => {
          emit.outputsNow(outputs());
          emit.complete();
        },
        onError: (err) => emit.error(err),
      });

  const restart = () => {
    state = sim.create(params);
    carry = 1;
    playT = 0;
  };

  view.resize();
  render();
  emit.outputsNow(outputs());

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      const prev = params;
      params = sim.normalise({ ...params, ...next });
      if (sim.resetKeys.some((key) => prev[key] !== params[key]) || sim.staleAfter(state, prev, params)) restart();
      render();
      emit.outputsNow(outputs());
    },
    getParams: () => ({ ...params }),
    play: () => (loop ? loop.play() : false),
    pause: () => loop?.pause(),
    isPlaying: () => (loop ? loop.isPlaying() : false),
    step(n = 1) {
      if (isStatic) return;
      sim.advance(state, params, n); // stops early at the end of the run
      render();
      emit.outputsNow(outputs());
      if (sim.complete(state, params)) emit.complete();
    },
    reset() {
      loop?.pause();
      restart();
      render();
      emit.outputsNow(outputs());
    },
    isComplete: () => sim.complete(state, params),
    getOutputs: () => outputs(),
    getData: () => sim.data(state, params),
    describe: () => sim.describe(state, params),
    setTheme() {
      view.setTheme();
      render();
    },
    resize() {
      view.resize();
      render();
    },
    destroy() {
      loop?.destroy();
      emit.destroy();
      view.destroy();
    },
  };
}
