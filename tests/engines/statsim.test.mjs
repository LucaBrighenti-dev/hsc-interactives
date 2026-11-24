// statsim engine tests: analytic answers for the guide §9.1 row plus a key-formula test for each setup.
// Every random test is seeded, so it is deterministic. Expected values come from formulas or standard
// tables (noted beside each), never from running the model and pasting the result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mulberry32,
  bernoulli,
  binomial,
  uniform,
  exponential,
  normal,
  POPULATIONS,
  population,
  samplingPopulation,
  samplingTheory,
  samplingBins,
  createSampling,
  advanceSampling,
  samplingComplete,
  samplingOutputs,
  samplingRows,
  samplesPerSecond,
  normalPdf,
  normalCdf,
  binomialPmf,
  binomialPmfs,
  binomialCdf,
  normalApprox,
  decayProbability,
  decayTheory,
  decaySteps,
  createDecay,
  advanceDecay,
  decayComplete,
  decayOutputs,
  halvingTimes,
  measuredHalfLife,
} from '../../site/assets/engines/statsim/model.js';

const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected} ± ${tol}, got ${actual}`);
const rel = (actual, expected, r, msg) => close(actual, expected, Math.abs(expected) * r, msg);

function moments(xs) {
  let mean = 0;
  for (const x of xs) mean += x;
  mean /= xs.length;
  let ss = 0;
  for (const x of xs) ss += (x - mean) ** 2;
  return { mean, variance: ss / (xs.length - 1) };
}

/** Independent n choose k with exact integer arithmetic. */
function choose(n, k) {
  let c = 1n;
  for (let i = 1n; i <= BigInt(k); i++) c = (c * (BigInt(n) - i + 1n)) / i;
  return Number(c);
}

const SAMPLING_DEFAULTS = { mode: 'means', population: 'exponential', p: 0.3, rate: 1, n: 10, samples: 1000, meansAxis: 'shared', seed: 1 };

// ---------------------------------------------------------------- PRNG and samplers

test('same seed gives an identical sequence; a different seed does not', () => {
  const a = mulberry32(2026);
  const b = mulberry32(2026);
  const c = mulberry32(2027);
  const sa = Array.from({ length: 1000 }, () => a());
  const sb = Array.from({ length: 1000 }, () => b());
  const sc = Array.from({ length: 1000 }, () => c());
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  for (const u of sa) assert.ok(u >= 0 && u < 1, `uniform out of [0, 1): ${u}`);
});

test('the generator keeps its period: no repeats in the first 2e6 values of 32-bit state', () => {
  // A broken state update (e.g. a float that stops changing) shows up as a stuck or repeating tail.
  const r = mulberry32(7);
  let last = -1;
  let repeats = 0;
  for (let i = 0; i < 2e6; i++) {
    const u = r();
    if (u === last) repeats++;
    last = u;
  }
  assert.ok(repeats < 5, `too many consecutive repeats: ${repeats}`);
});

test('uniform on [0, 1): mean 1/2 (1%), variance 1/12 (3%)', () => {
  const r = mulberry32(11);
  const xs = Array.from({ length: 1e5 }, () => uniform(r));
  const { mean, variance } = moments(xs);
  rel(mean, 0.5, 0.01, 'mean');
  rel(variance, 1 / 12, 0.03, 'variance');
});

test('Bernoulli(p): mean p (1%)', () => {
  const r = mulberry32(12);
  const xs = Array.from({ length: 1e5 }, () => bernoulli(r, 0.3));
  for (const x of xs.slice(0, 100)) assert.ok(x === 0 || x === 1);
  rel(moments(xs).mean, 0.3, 0.01);
});

test('binomial n = 20, p = 0.3, 1e5 draws: mean np = 6 (1%), variance np(1 − p) = 4.2 (3%)', () => {
  const r = mulberry32(13);
  const xs = Array.from({ length: 1e5 }, () => binomial(r, 20, 0.3));
  const { mean, variance } = moments(xs);
  rel(mean, 6, 0.01, 'mean');
  rel(variance, 4.2, 0.03, 'variance');
});

test('exponential λ = 2: mean 1/λ (1%), variance 1/λ² (3%)', () => {
  const r = mulberry32(14);
  const xs = Array.from({ length: 1e5 }, () => exponential(r, 2));
  const { mean, variance } = moments(xs);
  rel(mean, 0.5, 0.01, 'mean');
  rel(variance, 0.25, 0.03, 'variance');
  assert.ok(xs.every((x) => x >= 0 && Number.isFinite(x)));
});

test('normal (Box–Muller) N(0, 1): mean 0 (±0.01), variance 1 (3%); N(5, 2): mean 5 (1%)', () => {
  const r = mulberry32(15);
  const xs = Array.from({ length: 1e5 }, () => normal(r));
  const { mean, variance } = moments(xs);
  close(mean, 0, 0.01, 'mean');
  rel(variance, 1, 0.03, 'variance');
  const ys = Array.from({ length: 1e5 }, () => normal(r, 5, 2));
  rel(moments(ys).mean, 5, 0.01);
  rel(moments(ys).variance, 4, 0.03);
});

// ---------------------------------------------------------------- sampling setup

test('population formulas: μ and σ for every population (exact)', () => {
  const p = population('bernoulli', { p: 0.3 });
  close(p.mean, 0.3, 1e-15);
  close(p.sd, Math.sqrt(0.21), 1e-15);
  const die = population('die');
  close(die.mean, 3.5, 1e-15); // (1 + 6)/2
  close(die.sd, Math.sqrt(35 / 12), 1e-15); // (6² − 1)/12
  const u = population('uniform');
  close(u.mean, 0.5, 1e-15);
  close(u.sd, 1 / Math.sqrt(12), 1e-15);
  const z = population('normal');
  close(z.mean, 0, 1e-15);
  close(z.sd, 1, 1e-15);
  const e = population('exponential', { rate: 2 });
  close(e.mean, 0.5, 1e-15);
  close(e.sd, 0.5, 1e-15);
  const s = population('skewed');
  // pmf 0.40, 0.25, 0.15, 0.10, 0.06, 0.04 on 0..5: μ = Σx·p = 1.29, E(X²) = 3.71, σ² = 3.71 − 1.29² = 2.0459
  close(s.mean, 1.29, 1e-12);
  close(s.sd, Math.sqrt(2.0459), 1e-12);
  const a = population('ushaped');
  // arcsine = Beta(½, ½): μ = 1/2, σ² = αβ/((α + β)²(α + β + 1)) = (1/4)/(1·2) = 1/8
  close(a.mean, 0.5, 1e-15);
  close(a.sd, Math.sqrt(1 / 8), 1e-15);
  assert.deepEqual([...POPULATIONS].sort(), ['bernoulli', 'die', 'exponential', 'normal', 'skewed', 'uniform', 'ushaped']);
});

test('discrete populations: probabilities sum to 1 and reproduce μ and σ', () => {
  for (const name of ['bernoulli', 'die', 'skewed']) {
    const pop = population(name, { p: 0.37 });
    assert.ok(pop.discrete);
    const sum = pop.probs.reduce((a, b) => a + b, 0);
    close(sum, 1, 1e-12, `${name} Σp`);
    const mean = pop.values.reduce((a, x, i) => a + x * pop.probs[i], 0);
    const ex2 = pop.values.reduce((a, x, i) => a + x * x * pop.probs[i], 0);
    close(mean, pop.mean, 1e-12, `${name} μ`);
    close(Math.sqrt(ex2 - mean * mean), pop.sd, 1e-12, `${name} σ`);
  }
});

test('continuous populations: the pdf integrates to 1 over its support and gives μ', () => {
  for (const [name, a, b] of [['uniform', 0, 1], ['normal', -12, 12], ['exponential', 0, 60]]) {
    const pop = population(name, { rate: 1.5 });
    const N = 200000;
    const h = (b - a) / N;
    let area = 0;
    let m1 = 0;
    for (let i = 0; i < N; i++) {
      const x = a + (i + 0.5) * h; // midpoint rule
      area += pop.pdf(x) * h;
      m1 += x * pop.pdf(x) * h;
    }
    close(area, 1, 1e-4, `${name} area`);
    close(m1, pop.mean, 1e-3, `${name} mean`);
  }
  // Arcsine density has integrable spikes at 0 and 1: integrate with x = sin²(πu/2), dx = (π/2) sin(πu) du.
  const pop = population('ushaped');
  const N = 100000;
  let area = 0;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const x = Math.sin((Math.PI * u) / 2) ** 2;
    area += pop.pdf(x) * (Math.PI / 2) * Math.sin(Math.PI * u) * (1 / N);
  }
  close(area, 1, 1e-6, 'arcsine area');
});

test('key formula: E(x̄) = μ and SD(x̄) = σ/√n; binomial E(X) = np, SD(X) = √(np(1 − p))', () => {
  const t = samplingTheory({ ...SAMPLING_DEFAULTS, population: 'uniform', n: 25 });
  close(t.mean, 0.5, 1e-15);
  close(t.sd, 1 / Math.sqrt(12) / 5, 1e-15);
  close(t.popMean, 0.5, 1e-15);
  close(t.popSd, 1 / Math.sqrt(12), 1e-15);
  const b = samplingTheory({ ...SAMPLING_DEFAULTS, mode: 'binomial', n: 20, p: 0.3 });
  close(b.mean, 6, 1e-12);
  close(b.sd, Math.sqrt(4.2), 1e-12);
});

test('sampling run, binomial mode n = 20, p = 0.3, 1e5 samples: mean 6 (1%), variance 4.2 (3%)', () => {
  const params = { ...SAMPLING_DEFAULTS, mode: 'binomial', population: 'bernoulli', n: 20, p: 0.3, samples: 1e5, seed: 21 };
  const s = advanceSampling(createSampling(params), params, 1e5);
  assert.ok(samplingComplete(s, params));
  const out = samplingOutputs(s, params);
  assert.equal(out.count, 1e5);
  rel(out.simMean, 6, 0.01, 'mean');
  rel(out.simSD ** 2, 4.2, 0.03, 'variance');
  close(out.theoryMean, 6, 1e-12);
  close(out.theorySD, Math.sqrt(4.2), 1e-12);
  assert.ok(Number.isInteger(out.latest) && out.latest >= 0 && out.latest <= 20);
});

test('sampling run, exponential λ = 1, n = 30, 2e4 sample means: mean 1 (1%), SD 1/√30 = 0.1826 (3%)', () => {
  const params = { ...SAMPLING_DEFAULTS, mode: 'means', population: 'exponential', rate: 1, n: 30, samples: 2e4, seed: 22 };
  const s = advanceSampling(createSampling(params), params, 2e4);
  const out = samplingOutputs(s, params);
  assert.equal(out.count, 2e4);
  rel(out.simMean, 1, 0.01, 'mean of x̄');
  rel(out.simSD, 0.1826, 0.03, 'SD of x̄');
  close(out.theorySD, 1 / Math.sqrt(30), 1e-15, 'σ/√n');
});

test('every population: sample means (n = 10, 2e4 samples) have mean μ (1%) and SD σ/√n (3%)', () => {
  for (const name of POPULATIONS) {
    const params = { ...SAMPLING_DEFAULTS, population: name, p: 0.4, rate: 0.5, n: 10, samples: 2e4, seed: 31 };
    const pop = samplingPopulation(params);
    const out = samplingOutputs(advanceSampling(createSampling(params), params, 2e4), params);
    // μ = 0 for the normal population: use an absolute tolerance of 1% of σ there.
    if (pop.mean === 0) close(out.simMean, 0, 0.01 * pop.sd, `${name} mean`);
    else rel(out.simMean, pop.mean, 0.01, `${name} mean`);
    rel(out.simSD, pop.sd / Math.sqrt(10), 0.03, `${name} SD`);
  }
});

test('sampling is the same however the draws are chunked', () => {
  const params = { ...SAMPLING_DEFAULTS, population: 'skewed', n: 7, samples: 500, seed: 99 };
  const one = advanceSampling(createSampling(params), params, 500);
  const many = createSampling(params);
  for (let i = 0; i < 5; i++) advanceSampling(many, params, 100);
  assert.deepEqual(samplingRows(one, params), samplingRows(many, params));
  assert.deepEqual([...one.hist], [...many.hist]);
  assert.deepEqual(one.latest, many.latest);
});

test('sampling stops at the target and reports nulls before the first sample', () => {
  const params = { ...SAMPLING_DEFAULTS, samples: 30 };
  const s = createSampling(params);
  const before = samplingOutputs(s, params);
  assert.equal(before.count, 0);
  assert.equal(before.simMean, null);
  assert.equal(before.simSD, null);
  assert.equal(before.latest, null);
  advanceSampling(s, params, 1);
  assert.equal(samplingOutputs(s, params).simSD, null, 'SD needs two samples');
  advanceSampling(s, params, 1000);
  assert.equal(s.count, 30);
  assert.ok(samplingComplete(s, params));
  const rows = samplingRows(s, params);
  assert.equal(rows.length, 30);
  assert.deepEqual(rows[0].slice(0, 1), [1]);
});

test('histogram counts: every sample is in exactly one bin (or under/over the axis)', () => {
  for (const name of POPULATIONS) {
    for (const axis of ['shared', 'zoom']) {
      const params = { ...SAMPLING_DEFAULTS, population: name, n: 3, samples: 3000, meansAxis: axis, seed: 5 };
      const s = advanceSampling(createSampling(params), params, 3000);
      const total = s.hist.reduce((a, b) => a + b, 0) + s.under + s.over;
      assert.equal(total, 3000, `${name}/${axis}`);
    }
  }
});

test('discrete populations: bins hold whole lattice points k/n, never on a bin edge', () => {
  for (const name of ['bernoulli', 'die', 'skewed']) {
    for (const n of [1, 2, 5, 13, 40, 100]) {
      for (const axis of ['shared', 'zoom']) {
        const params = { ...SAMPLING_DEFAULTS, population: name, n, p: 0.5, meansAxis: axis };
        const pop = samplingPopulation(params);
        const bins = samplingBins(params, pop);
        const vmin = pop.values[0];
        const vmax = pop.values[pop.values.length - 1];
        const perBin = new Map();
        for (let j = vmin * n; j <= vmax * n; j++) {
          const x = j / n;
          const u = (x - bins.start) / bins.width;
          if (u < 0 || u >= bins.count) continue; // outside a zoomed axis
          const frac = u - Math.floor(u);
          assert.ok(frac > 1e-6 && frac < 1 - 1e-6, `${name} n=${n}: lattice point ${x} sits on a bin edge`);
          const i = Math.floor(u);
          perBin.set(i, (perBin.get(i) ?? 0) + 1);
        }
        // Interior bins all hold the same number of lattice points.
        const counts = [...perBin.entries()].filter(([i]) => i > 0 && i < bins.count - 1).map(([, c]) => c);
        if (counts.length) assert.ok(counts.every((c) => c === counts[0]), `${name} n=${n} ${axis}: uneven bins ${counts}`);
      }
    }
  }
});

test('binomial mode bins are the integers 0..n (one per value)', () => {
  const params = { ...SAMPLING_DEFAULTS, mode: 'binomial', population: 'bernoulli', n: 8, p: 0.5 };
  const bins = samplingBins(params, samplingPopulation(params));
  assert.equal(bins.width, 1);
  assert.equal(bins.start, -0.5);
  assert.equal(bins.count, 9);
});

test('playback ramps up: 1 sample per second at first, then capped at the top speed', () => {
  assert.equal(samplesPerSecond(0, 200), 1);
  assert.equal(samplesPerSecond(9, 200), 10);
  assert.equal(samplesPerSecond(5000, 200), 200);
  assert.equal(samplesPerSecond(5000, 3), 3);
});

// ---------------------------------------------------------------- normal approximation setup

test('Φ against standard normal table values', () => {
  assert.equal(normalCdf(0), 0.5);
  close(normalCdf(1), 0.84134, 1e-5); // table
  close(normalCdf(1.96), 0.975, 1e-5); // table
  close(normalCdf(-1.645), 0.04998, 1e-5); // table
  close(normalCdf(2.5), 0.99379, 1e-5); // table
  for (const x of [0.1, 0.7, 1.3, 2.9, 4.2]) close(normalCdf(-x), 1 - normalCdf(x), 1e-14, `symmetry at ${x}`);
  close(normalCdf(12, 10, 2), normalCdf(1), 1e-15, 'standardising');
  close(normalPdf(0), 1 / Math.sqrt(2 * Math.PI), 1e-15);
  close(normalPdf(7, 5, 2), Math.exp(-0.5) / (2 * Math.sqrt(2 * Math.PI)), 1e-15);
});

test('binomial pmf: B(20, 0.3) matches C(n, k) p^k (1 − p)^(n − k), sums to 1, mean np', () => {
  close(binomialPmf(20, 0.3, 6), choose(20, 6) * 0.3 ** 6 * 0.7 ** 14, 1e-14, 'P(X = 6)');
  assert.equal(choose(20, 6), 38760);
  const pmf = binomialPmfs(20, 0.3);
  assert.equal(pmf.length, 21);
  close(pmf.reduce((a, b) => a + b, 0), 1, 1e-12, 'Σ P');
  close(pmf.reduce((a, q, k) => a + k * q, 0), 6, 1e-12, 'mean');
  for (let k = 0; k <= 20; k++) close(pmf[k], choose(20, k) * 0.3 ** k * 0.7 ** (20 - k), 1e-14, `k=${k}`);
  // Large n stays finite and normalised.
  const big = binomialPmfs(200, 0.5);
  close(big.reduce((a, b) => a + b, 0), 1, 1e-12);
  assert.equal(binomialPmf(10, 0.4, 11), 0);
  assert.equal(binomialPmf(10, 0.4, -1), 0);
});

test('key formula: B(20, 0.3), P(X ≤ 6) exact 0.6080 (table) vs Φ((6 + 0.5 − np)/√(np(1 − p)))', () => {
  let exact = 0;
  for (let k = 0; k <= 6; k++) exact += choose(20, k) * 0.3 ** k * 0.7 ** (20 - k);
  close(binomialCdf(20, 0.3, 6), exact, 1e-13);
  close(exact, 0.608, 5e-5); // cumulative binomial table: n = 20, p = 0.3, x = 6 → 0.6080
  const r = normalApprox({ trials: 20, prob: 0.3, k: 6, event: 'le', continuity: true });
  close(r.exact, exact, 1e-13);
  close(r.mean, 6, 1e-12);
  close(r.sd, Math.sqrt(4.2), 1e-12);
  close(r.z, 0.5 / Math.sqrt(4.2), 1e-12);
  close(r.approx, normalCdf(0.5 / Math.sqrt(4.2)), 1e-15);
  close(r.error, r.approx - r.exact, 1e-15);
  assert.deepEqual([r.lower, r.upper], [-Infinity, 6.5]);
  // Without the correction the boundary is k itself: Φ((6 − 6)/σ) = Φ(0) = 0.5 exactly.
  const raw = normalApprox({ trials: 20, prob: 0.3, k: 6, event: 'le', continuity: false });
  assert.equal(raw.approx, 0.5);
  assert.ok(Math.abs(r.error) < Math.abs(raw.error), 'the continuity correction improves this approximation');
});

test('normal approximation: P(X ≥ k) and P(X = k), with and without the correction', () => {
  const n = 50;
  const p = 0.4; // np = 20, σ = √12
  const sd = Math.sqrt(12);
  let ge = 0;
  for (let k = 25; k <= n; k++) ge += choose(n, k) * p ** k * (1 - p) ** (n - k);
  const g = normalApprox({ trials: n, prob: p, k: 25, event: 'ge', continuity: true });
  close(g.exact, ge, 1e-13);
  close(g.approx, 1 - normalCdf((24.5 - 20) / sd), 1e-15);
  assert.deepEqual([g.lower, g.upper], [24.5, Infinity]);
  const e = normalApprox({ trials: n, prob: p, k: 20, event: 'eq', continuity: true });
  close(e.exact, choose(50, 20) * 0.4 ** 20 * 0.6 ** 30, 1e-14);
  close(e.approx, normalCdf(0.5 / sd) - normalCdf(-0.5 / sd), 1e-15);
  assert.equal(e.z, null);
  // A continuous variable has no probability at a single point.
  assert.equal(normalApprox({ trials: n, prob: p, k: 20, event: 'eq', continuity: false }).approx, 0);
});

test('normal approximation: the event covers the right values of k', () => {
  const le = normalApprox({ trials: 10, prob: 0.5, k: 3, event: 'le', continuity: true });
  assert.deepEqual([le.kFrom, le.kTo], [0, 3]);
  const ge = normalApprox({ trials: 10, prob: 0.5, k: 3, event: 'ge', continuity: true });
  assert.deepEqual([ge.kFrom, ge.kTo], [3, 10]);
  const eq = normalApprox({ trials: 10, prob: 0.5, k: 3, event: 'eq', continuity: true });
  assert.deepEqual([eq.kFrom, eq.kTo], [3, 3]);
  close(le.exact + normalApprox({ trials: 10, prob: 0.5, k: 4, event: 'ge', continuity: true }).exact, 1, 1e-14, 'complements');
});

// ---------------------------------------------------------------- decay setup

test('key formula: per-step decay probability p = 1 − 2^(−1/H)', () => {
  assert.equal(decayProbability(1), 0.5); // coin-toss model
  close(decayProbability(2), 1 - 1 / Math.SQRT2, 1e-15);
  close(decayProbability(10), 1 - 2 ** -0.1, 1e-15);
  // Surviving H steps: (1 − p)^H = 1/2.
  close((1 - decayProbability(7)) ** 7, 0.5, 1e-14);
  close(decayTheory(20, 1000, 10), 250, 1e-12);
  close(decayTheory(0, 1000, 10), 1000, 0);
  assert.equal(decaySteps({ duration: 60 }), 60);
});

test('decay, N = 1e5, H = 10 s: half remain after H steps (2%), measured half-life within 2% of H', () => {
  const params = { nuclei: 1e5, halfLife: 10, duration: 60, seed: 41 };
  const s = advanceDecay(createDecay(params), params, 10);
  assert.equal(s.step, 10);
  rel(s.remaining, 5e4, 0.02, 'N after H steps');
  advanceDecay(s, params, 10);
  rel(s.remaining, 2.5e4, 0.02, 'N after 2H steps');
  rel(measuredHalfLife(s.history, 1e5), 10, 0.02, 'measured t½');
  const out = decayOutputs(s, params);
  close(out.t, 20, 0);
  assert.equal(out.remaining + out.decayed, 1e5);
  close(out.theoryRemaining, 2.5e4, 1e-9);
  close(out.probability, 1 - 2 ** -0.1, 1e-15);
});

test('decay, coin model H = 1 s (p = 1/2), N = 1e5: half remain after one step (2%)', () => {
  const params = { nuclei: 1e5, halfLife: 1, duration: 20, seed: 42 };
  const s = advanceDecay(createDecay(params), params, 1);
  rel(s.remaining, 5e4, 0.02);
});

test('decay bookkeeping: history, decays per step and the grid agree; same however it is chunked', () => {
  const params = { nuclei: 2000, halfLife: 4, duration: 30, seed: 43 };
  const a = advanceDecay(createDecay(params), params, 25);
  const b = createDecay(params);
  for (let i = 0; i < 25; i++) advanceDecay(b, params, 1);
  assert.deepEqual(a.history, b.history);
  assert.deepEqual([...a.status], [...b.status]);
  assert.equal(a.history.length, 26);
  for (let k = 1; k <= 25; k++) {
    assert.equal(a.history[k - 1] - a.history[k], a.decays[k], `decays at step ${k}`);
    const fromGrid = a.status.reduce((acc, v) => acc + (v === k ? 1 : 0), 0);
    assert.equal(fromGrid, a.decays[k], `grid at step ${k}`);
  }
  assert.equal(a.status.reduce((acc, v) => acc + (v === 0 ? 1 : 0), 0), a.remaining);
});

test('decay run ends at its duration (or when every nucleus has decayed)', () => {
  const params = { nuclei: 500, halfLife: 2, duration: 30, seed: 44 };
  const s = advanceDecay(createDecay(params), params, 1000);
  assert.ok(decayComplete(s, params));
  assert.ok(s.step <= 30);
  assert.ok(s.step === 30 || s.remaining === 0);
});

test('measured half-life: linear interpolation of the first fall to N₀/2', () => {
  close(measuredHalfLife([1000, 600, 400, 200], 1000), 1.5, 1e-12); // 1 + (600 − 500)/(600 − 400)
  close(measuredHalfLife([1000, 800, 500, 300], 1000), 2, 1e-12);
  assert.equal(measuredHalfLife([1000, 900, 800], 1000), null);
  const times = halvingTimes([1000, 700, 490, 343, 240, 168, 118], 1000, 3);
  close(times[0], 2 - (500 - 490) / (700 - 490), 1e-12);
  assert.equal(times.length, 3);
});
