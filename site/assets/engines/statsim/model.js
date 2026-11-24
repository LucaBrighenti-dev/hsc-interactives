// statsim model: seeded random sampling, sampling distributions, the normal approximation to the
// binomial, and a radioactive decay grid. Pure: no DOM, no timers, no clocks. The only randomness is a
// seeded mulberry32 generator that callers create from the `seed` param and pass in, so a shared link
// reproduces exactly the same draws. Importable in Node: tests/engines/statsim.test.mjs.
//
// Run state objects (createSampling, createDecay) are updated in place by advanceSampling and
// advanceDecay for speed, and returned for convenience. The same seed and the same number of steps
// always give the same state, however the steps are grouped.

// ------------------------------------------------------------------ seeded PRNG

/**
 * mulberry32: a small, fast 32-bit generator (Tommy Ettinger's public-domain design).
 * @param {number} seed integer
 * @returns {() => number} uniform on [0, 1)
 */
export function mulberry32(seed) {
  let a = seed | 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ samplers

/** 1 with probability p, otherwise 0 (one uniform). */
export function bernoulli(rng, p) {
  return rng() < p ? 1 : 0;
}

/** Number of successes in n Bernoulli(p) trials (n uniforms: the trials themselves). */
export function binomial(rng, n, p) {
  let x = 0;
  for (let i = 0; i < n; i++) if (rng() < p) x++;
  return x;
}

/** Continuous uniform on [a, b). */
export function uniform(rng, a = 0, b = 1) {
  return a + (b - a) * rng();
}

/** Exponential with rate λ by inversion: −ln(1 − U)/λ (1 − U is in (0, 1], so the log is finite). */
export function exponential(rng, rate = 1) {
  return -Math.log(1 - rng()) / rate;
}

/** Normal by the Box–Muller transform (two uniforms per value; the second normal is not kept). */
export function normal(rng, mean = 0, sd = 1) {
  const u1 = 1 - rng(); // (0, 1]
  const u2 = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Discrete value by inverting the cumulative probabilities. */
export function discrete(rng, values, cumulative) {
  const u = rng();
  for (let i = 0; i < cumulative.length - 1; i++) if (u < cumulative[i]) return values[i];
  return values[values.length - 1];
}

/** Arcsine distribution, Beta(½, ½) on [0, 1], by inversion: sin²(πU/2). */
export function arcsine(rng) {
  const s = Math.sin((Math.PI * rng()) / 2);
  return s * s;
}

// ------------------------------------------------------------------ populations

/** A right-skewed discrete population on 0..5, chosen as a teaching example (probabilities sum to 1). */
export const SKEWED_PMF = [0.4, 0.25, 0.15, 0.1, 0.06, 0.04];

export const POPULATIONS = ['bernoulli', 'die', 'uniform', 'normal', 'exponential', 'skewed', 'ushaped'];

function discretePopulation(name, values, probs, extra = {}) {
  let mean = 0;
  let ex2 = 0;
  const cumulative = [];
  let c = 0;
  for (let i = 0; i < values.length; i++) {
    mean += values[i] * probs[i];
    ex2 += values[i] * values[i] * probs[i];
    c += probs[i];
    cumulative.push(c);
  }
  const vmin = values[0];
  const vmax = values[values.length - 1];
  return {
    name,
    discrete: true,
    values,
    probs,
    mean,
    sd: Math.sqrt(Math.max(0, ex2 - mean * mean)),
    range: [vmin - 0.5, vmax + 0.5], // display range
    binRange: [vmin, vmax],
    displayMax: Math.max(...probs),
    sample: (rng) => discrete(rng, values, cumulative),
    ...extra,
  };
}

/**
 * A population to sample from. Every population has exact μ and σ, a display range, and either
 * `values`/`probs` (discrete, integer values) or `pdf` (continuous).
 * @param {'bernoulli'|'die'|'uniform'|'normal'|'exponential'|'skewed'|'ushaped'} name
 * @param {{ p?: number, rate?: number }} [opts]
 */
export function population(name, { p = 0.5, rate = 1 } = {}) {
  switch (name) {
    case 'bernoulli':
      return discretePopulation(name, [0, 1], [1 - p, p], {
        mean: p,
        sd: Math.sqrt(p * (1 - p)),
        sample: (rng) => bernoulli(rng, p),
      });
    case 'die':
      return discretePopulation(name, [1, 2, 3, 4, 5, 6], [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6], {
        mean: 3.5,
        sd: Math.sqrt(35 / 12),
        sample: (rng) => 1 + Math.floor(6 * rng()),
      });
    case 'skewed':
      return discretePopulation(name, [0, 1, 2, 3, 4, 5], SKEWED_PMF);
    case 'uniform':
      return {
        name,
        discrete: false,
        mean: 0.5,
        sd: 1 / Math.sqrt(12),
        range: [-0.1, 1.1],
        binRange: [0, 1],
        displayMax: 1,
        pdf: (x) => (x >= 0 && x <= 1 ? 1 : 0),
        sample: (rng) => rng(),
      };
    case 'normal':
      return {
        name,
        discrete: false,
        mean: 0,
        sd: 1,
        range: [-4, 4],
        binRange: [-4, 4],
        displayMax: normalPdf(0),
        pdf: (x) => normalPdf(x),
        sample: (rng) => normal(rng),
      };
    case 'exponential':
      return {
        name,
        discrete: false,
        rate,
        mean: 1 / rate,
        sd: 1 / rate,
        range: [0, 5 / rate], // P(X > 5/λ) = e⁻⁵ ≈ 0.7% lies beyond the axis
        binRange: [0, 5 / rate],
        displayMax: rate,
        pdf: (x) => (x >= 0 ? rate * Math.exp(-rate * x) : 0),
        sample: (rng) => exponential(rng, rate),
      };
    case 'ushaped':
      return {
        name,
        discrete: false,
        mean: 0.5,
        sd: Math.sqrt(1 / 8),
        range: [-0.1, 1.1],
        binRange: [0, 1],
        displayMax: 3, // the density is unbounded at 0 and 1; drawings clip it
        pdf: (x) => (x > 0 && x < 1 ? 1 / (Math.PI * Math.sqrt(x * (1 - x))) : 0),
        sample: arcsine,
      };
    default:
      throw new Error(`statsim: unknown population "${name}"`);
  }
}

// ------------------------------------------------------------------ sampling setup

const MAX_BINS = 160;
const MIN_BINS = 24;

/** In binomial mode the trials are Bernoulli(p); in means mode the chosen population. */
export function samplingPopulation(params) {
  const name = params.mode === 'binomial' ? 'bernoulli' : params.population;
  return population(name, { p: params.p, rate: params.rate });
}

/**
 * Theory for the statistic drawn in each sample.
 * Binomial mode, X = number of successes in n trials: E(X) = np, SD(X) = √(np(1 − p)).
 * Means mode, x̄ of n draws: E(x̄) = μ, SD(x̄) = σ/√n (the standard error).
 */
export function samplingTheory(params) {
  const pop = samplingPopulation(params);
  const n = params.n;
  if (params.mode === 'binomial') return { mean: n * pop.mean, sd: Math.sqrt(n) * pop.sd, popMean: pop.mean, popSd: pop.sd };
  return { mean: pop.mean, sd: pop.sd / Math.sqrt(n), popMean: pop.mean, popSd: pop.sd };
}

/**
 * Fixed histogram bins for the run: { start, width, count, lattice, perBin, view: [a, b] }.
 * Binomial mode: one bin per integer value of X with non-negligible probability.
 * Means mode: on the population's axis ('shared') or zoomed to μ ± 4.5σ/√n ('zoom'). Means of
 * integer-valued populations lie on the lattice j/n, so each bin holds the same whole number of lattice
 * points and no point sits on a bin edge (otherwise the histogram shows a false comb pattern). A zoomed
 * lattice keeps at least 3 steps 1/n either side of μ: when σ/√n is below the step (Bernoulli p = 0.01,
 * n = 2) μ ± 4.5σ/√n alone would hold a single bin.
 */
export function samplingBins(params, pop = samplingPopulation(params)) {
  const n = params.n;
  if (params.mode === 'binomial') {
    const mu = n * pop.mean;
    const sd = Math.sqrt(n) * pop.sd;
    let lo = Math.max(0, Math.floor(mu - 5 * sd));
    let hi = Math.min(n, Math.ceil(mu + 5 * sd));
    // Keep at least 11 values in view when n allows, so small spreads don't look like a spike.
    while (hi - lo < 10 && (lo > 0 || hi < n)) {
      if (lo > 0) lo--;
      if (hi - lo < 10 && hi < n) hi++;
    }
    return { start: lo - 0.5, width: 1, count: hi - lo + 1, lattice: true, perBin: 1, view: [lo - 0.5, hi + 0.5] };
  }
  const se = pop.sd / Math.sqrt(n);
  const zoom = params.meansAxis === 'zoom';
  let [lo, hi] = pop.binRange;
  if (zoom) {
    const half = pop.discrete ? Math.max(4.5 * se, 3 / n) : 4.5 * se;
    lo = Math.max(lo, pop.mean - half);
    hi = Math.min(hi, pop.mean + half);
  }
  const span = hi - lo;
  let width = zoom ? se / 4 : Math.min(span / MIN_BINS, se / 3);
  width = Math.max(width, span / MAX_BINS);
  if (pop.discrete) {
    const m = Math.max(1, Math.round(width * n));
    const jLo = Math.ceil(lo * n - 1e-9);
    const jHi = Math.floor(hi * n + 1e-9);
    const count = Math.ceil((jHi - jLo + 1) / m);
    const start = (jLo - 0.5) / n;
    const bins = { start, width: m / n, count, lattice: true, perBin: m };
    bins.view = zoom ? [start, start + count * bins.width] : pop.range;
    return bins;
  }
  const count = Math.max(1, Math.round(span / width));
  return { start: lo, width: span / count, count, lattice: false, perBin: 1, view: zoom ? [lo, hi] : pop.range };
}

/** Empty run. */
export function createSampling(params) {
  const pop = samplingPopulation(params);
  const bins = samplingBins(params, pop);
  return {
    rng: mulberry32(params.seed),
    pop,
    bins,
    count: 0,
    values: [], // the statistic (X or x̄) of every sample, in order
    latest: null, // the raw draws of the latest sample
    latestValue: null,
    lastBin: null, // bin of the latest value (null if it fell outside the axis)
    hist: new Int32Array(bins.count),
    under: 0,
    over: 0,
    mean: 0, // running mean and sum of squared deviations (Welford)
    m2: 0,
  };
}

/** Draw one sample of size n and record its statistic. */
function drawSample(state, params) {
  const { rng, pop, bins } = state;
  const n = params.n;
  const raw = new Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = pop.sample(rng);
    raw[i] = v;
    sum += v;
  }
  const value = params.mode === 'binomial' ? sum : sum / n;
  state.count += 1;
  state.values.push(value);
  state.latest = raw;
  state.latestValue = value;
  const d = value - state.mean;
  state.mean += d / state.count;
  state.m2 += d * (value - state.mean);
  const i = Math.floor((value - bins.start) / bins.width);
  if (i < 0) {
    state.under += 1;
    state.lastBin = null;
  } else if (i >= bins.count) {
    state.over += 1;
    state.lastBin = null;
  } else {
    state.hist[i] += 1;
    state.lastBin = i;
  }
}

/** Draw up to k more samples, stopping at the target number of samples. */
export function advanceSampling(state, params, k = 1) {
  const todo = Math.min(Math.max(0, Math.floor(k)), Math.max(0, params.samples - state.count));
  for (let i = 0; i < todo; i++) drawSample(state, params);
  return state;
}

export function samplingComplete(state, params) {
  return state.count >= params.samples;
}

/**
 * Outputs (dimensionless, unrounded). The simulated SD is the SD of the statistics drawn so far, dividing
 * by (number of samples − 1), not by the sample size n; it is null until there are two samples.
 * `latest` is the latest statistic in either mode; `latestX` (a whole number) and `latestMean` give it
 * only in their own mode (otherwise null), so a readout can show X without decimals.
 */
export function samplingOutputs(state, params) {
  const t = samplingTheory(params);
  const binomialMode = params.mode === 'binomial';
  return {
    count: state.count,
    latest: state.latestValue,
    latestX: binomialMode ? state.latestValue : null,
    latestMean: binomialMode ? null : state.latestValue,
    simMean: state.count ? state.mean : null,
    simSD: state.count >= 2 ? Math.sqrt(state.m2 / (state.count - 1)) : null,
    theoryMean: t.mean,
    theorySD: t.sd,
    popMean: t.popMean,
    popSD: t.popSd,
  };
}

/** One row per sample: [sample number, statistic]. */
export function samplingRows(state) {
  return state.values.map((v, i) => [i + 1, v]);
}

/** Playback pace: one sample per second at first, speeding up (rate = 1 + samples so far) to the top speed. */
export function samplesPerSecond(count, topSpeed) {
  return Math.min(topSpeed, 1 + count);
}

// ------------------------------------------------------------------ normal and binomial distributions

const LN_SQRT_2PI = 0.91893853320467274178; // ln √(2π)

/** Normal density. */
export function normalPdf(x, mean = 0, sd = 1) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z - LN_SQRT_2PI) / sd;
}

/**
 * Normal cumulative distribution Φ((x − μ)/σ), by Marsaglia's series (J. Stat. Software 11(4), 2004):
 * Φ(z) = ½ + φ(z)(z + z³/3 + z⁵/(3·5) + …). Accurate to about 1e-15 absolute.
 */
export function normalCdf(x, mean = 0, sd = 1) {
  const z = (x - mean) / sd;
  if (Number.isNaN(z)) return NaN;
  if (z <= -9) return 0;
  if (z >= 9) return 1;
  const q = z * z;
  let s = z;
  let t = 0;
  let b = z;
  let i = 1;
  while (s !== t) {
    t = s;
    i += 2;
    b *= q / i;
    s = t + b;
  }
  return 0.5 + s * Math.exp(-0.5 * q - LN_SQRT_2PI);
}

const LN_FACT = [0];
function lnFactorial(n) {
  for (let i = LN_FACT.length; i <= n; i++) LN_FACT[i] = LN_FACT[i - 1] + Math.log(i);
  return LN_FACT[n];
}

/** P(X = k) for X ~ B(n, p), computed in logs so large n neither overflows nor underflows. */
export function binomialPmf(n, p, k) {
  if (!Number.isInteger(k) || k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(lnFactorial(n) - lnFactorial(k) - lnFactorial(n - k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}

/** [P(X = 0), …, P(X = n)]. */
export function binomialPmfs(n, p) {
  return Array.from({ length: n + 1 }, (_, k) => binomialPmf(n, p, k));
}

/** P(X ≤ k). */
export function binomialCdf(n, p, k) {
  if (k < 0) return 0;
  if (k >= n) return 1;
  let s = 0;
  for (let j = 0; j <= Math.floor(k); j++) s += binomialPmf(n, p, j);
  return Math.min(1, s);
}

/**
 * Normal approximation to X ~ B(n, p) with Y ~ N(np, np(1 − p)).
 * event 'le': P(X ≤ k) ≈ P(Y ≤ k + c); 'ge': P(X ≥ k) ≈ P(Y ≥ k − c); 'eq': P(X = k) ≈ P(k − c ≤ Y ≤ k + c),
 * with c = 0.5 when the continuity correction is on, otherwise 0 (so P(X = k) is approximated by 0).
 * @param {{ trials: number, prob: number, k: number, event: 'le'|'ge'|'eq', continuity: boolean }} params
 */
export function normalApprox({ trials: n, prob: p, k, event = 'le', continuity = true }) {
  const mean = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  const c = continuity ? 0.5 : 0;
  let exact;
  let approx;
  let lower;
  let upper;
  let kFrom;
  let kTo;
  let z = null;
  if (event === 'ge') {
    kFrom = k;
    kTo = n;
    exact = 0;
    for (let j = Math.max(0, k); j <= n; j++) exact += binomialPmf(n, p, j); // upper tail summed directly
    exact = Math.min(1, exact);
    lower = k - c;
    upper = Infinity;
    approx = 1 - normalCdf(lower, mean, sd);
    z = (lower - mean) / sd;
  } else if (event === 'eq') {
    kFrom = k;
    kTo = k;
    exact = binomialPmf(n, p, k);
    lower = k - c;
    upper = k + c;
    approx = c === 0 ? 0 : normalCdf(upper, mean, sd) - normalCdf(lower, mean, sd);
  } else {
    kFrom = 0;
    kTo = k;
    exact = binomialCdf(n, p, k);
    lower = -Infinity;
    upper = k + c;
    approx = normalCdf(upper, mean, sd);
    z = (upper - mean) / sd;
  }
  return { exact, approx, error: approx - exact, mean, sd, z, lower, upper, kFrom, kTo };
}

/** Rows for every k: [k, P(X = k), P(X ≤ k), Φ((k + 0.5 − np)/σ), Φ((k − np)/σ)]. */
export function binomialRows({ trials: n, prob: p }) {
  const mean = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  const rows = [];
  let cdf = 0;
  for (let k = 0; k <= n; k++) {
    const pk = binomialPmf(n, p, k);
    cdf += pk;
    rows.push([k, pk, Math.min(1, cdf), normalCdf(k + 0.5, mean, sd), normalCdf(k, mean, sd)]);
  }
  return rows;
}

// ------------------------------------------------------------------ radioactive decay

/** Time step of the decay model (s). Each step every undecayed nucleus decays with probability p. */
export const DECAY_DT = 1;

/** Per-step decay probability p = 1 − 2^(−Δt/H), so that (1 − p)^(H/Δt) = 1/2. */
export function decayProbability(halfLife, dt = DECAY_DT) {
  return 1 - 2 ** (-dt / halfLife);
}

/** Theoretical number remaining: N₀(1/2)^(t/H). */
export function decayTheory(t, n0, halfLife) {
  return n0 * 2 ** (-t / halfLife);
}

export function decaySteps({ duration }) {
  return Math.round(duration / DECAY_DT);
}

/** Playback pace (steps per second of real time) so a run lasts at most about 15 s at 1×. */
export function decayStepsPerSecond(duration) {
  return Math.max(4, duration / 15);
}

/**
 * Fresh grid of N₀ nuclei. status[i] = 0 while nucleus i is undecayed, otherwise the step in which it decayed.
 */
export function createDecay(params) {
  const n0 = params.nuclei;
  return {
    rng: mulberry32(params.seed),
    n0,
    status: new Int32Array(n0),
    step: 0,
    remaining: n0,
    history: [n0], // N after each step (index = step)
    decays: [0], // decays in each step
  };
}

/** Advance up to `steps` time steps, stopping at the end of the run or when nothing is left. */
export function advanceDecay(state, params, steps = 1) {
  const p = decayProbability(params.halfLife);
  const total = decaySteps(params);
  const { status, rng } = state;
  for (let k = 0; k < steps; k++) {
    if (state.step >= total || state.remaining === 0) break;
    state.step += 1;
    let d = 0;
    for (let i = 0; i < status.length; i++) {
      if (status[i] === 0 && rng() < p) {
        status[i] = state.step;
        d++;
      }
    }
    state.remaining -= d;
    state.history.push(state.remaining);
    state.decays.push(d);
  }
  return state;
}

export function decayComplete(state, params) {
  return state.step >= decaySteps(params) || state.remaining === 0;
}

/**
 * Times at which N first fell to N₀/2, N₀/4, … (up to `levels`), each by linear interpolation between
 * the two steps either side. Stops at the first level not yet reached.
 */
export function halvingTimes(history, n0, levels = 3, dt = DECAY_DT) {
  const times = [];
  let i = 1;
  for (let j = 1; j <= levels; j++) {
    const target = n0 / 2 ** j;
    while (i < history.length && history[i] > target) i++;
    if (i >= history.length) break;
    const a = history[i - 1];
    const b = history[i];
    times.push((i - 1 + (a > b ? (a - target) / (a - b) : 0)) * dt);
  }
  return times;
}

/** Time for the first half of the nuclei to decay, or null if fewer than half have decayed so far. */
export function measuredHalfLife(history, n0) {
  return halvingTimes(history, n0, 1)[0] ?? null;
}

export function decayOutputs(state, params) {
  const t = state.step * DECAY_DT;
  return {
    t,
    remaining: state.remaining,
    decayed: state.n0 - state.remaining,
    theoryRemaining: decayTheory(t, state.n0, params.halfLife),
    measuredHalfLife: measuredHalfLife(state.history, state.n0),
    probability: decayProbability(params.halfLife),
    lastDecays: state.decays[state.step] / DECAY_DT,
  };
}

/** Rows per step: [t, N, decays in the step, N₀(1/2)^(t/H)]. */
export function decayRows(state, params) {
  return state.history.map((n, k) => [k * DECAY_DT, n, state.decays[k], decayTheory(k * DECAY_DT, state.n0, params.halfLife)]);
}
