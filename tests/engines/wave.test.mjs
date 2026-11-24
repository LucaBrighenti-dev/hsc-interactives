// Wave engine tests: analytic answers (guide §9.1, wave row) plus key formulas for every setup.
// Every expected number comes from a formula or a standard table, never from running the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DT,
  sinc,
  arrayFactor,
  slitIntensity,
  apertureGeometry,
  screenPosition,
  principalMaxima,
  maxOrder,
  singleSlitMinima,
  isMissingOrder,
  intensityProfile,
  interferenceOutputs,
  screenHalfWidth,
  wavelengthToRgb,
  messageValue,
  messageIntegral,
  modulatedValue,
  instantaneousFrequency,
  modulationIndex,
  modulationBandwidth,
  modulationSpectrum,
  besselJ,
  travellingDisplacement,
  pulseDisplacement,
  standingFrequency,
  standingWavelength,
  harmonicNumber,
  standingShape,
  standingNodes,
  dopplerFrequency,
  observedFrequency,
  sourceX,
  observerX,
  crestsAt,
  beatFrequency,
  beatsValues,
  createState,
  advance,
  isComplete,
  totalSteps,
  physicalTime,
  outputs,
  samples,
} from '../../site/assets/engines/wave/model.js';
import { meta } from '../../site/assets/engines/wave/index.js';
import { defaultsFor } from '../../site/assets/state.js';

const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const rel = (actual, expected, relTol, msg) => close(actual, expected, Math.abs(expected) * relTol, msg);
const DEG = Math.PI / 180;
const params = (setup, over = {}) => ({ ...defaultsFor(meta.params, setup), ...over });

// ---------------------------------------------------------------------------------------------
// §9.1 analytic tests
// ---------------------------------------------------------------------------------------------

test('§9.1 fringe spacing λL/d for λ = 600 nm, d = 0.25 mm, L = 2 m is 4.8 mm (0.5%)', () => {
  const p = params('interference', { aperture: 'double', wavelength: 600, slitSeparation: 0.25, slitWidth: 0.05, screenDistance: 2 });
  const out = interferenceOutputs(p);
  // Small-angle λL/d = 600e-9 × 2 / 0.25e-3 = 4.8e-3 m
  rel(out.smallAnglePosition, 4.8e-3, 0.005, 'λL/d');
  // Exact screen mapping y₁ = L tan(asin(λ/d)) is within 0.5% of 4.8 mm at this small angle
  rel(out.fringeSpacing, 4.8e-3, 0.005, 'fringe spacing (L tan θ)');
  rel(out.firstOrderPosition, 2 * Math.tan(Math.asin(600e-9 / 0.25e-3)), 1e-12, 'y₁ = L tan θ₁');
});

test('§9.1 grating 600 lines/mm at 500 nm: first order at 17.46° (0.01°)', () => {
  const p = params('interference', { aperture: 'grating', wavelength: 500, linesPerMm: 600 });
  const out = interferenceOutputs(p);
  // sin θ = λ/d = 500e-9 × 600e3 = 0.3; asin 0.3 = 17.4576°
  close(out.firstOrderAngle, 17.46, 0.01, 'θ₁ (°)');
  close(out.firstOrderAngle, Math.asin(0.3) / DEG, 1e-9, 'θ₁ exact');
  // d/λ = 3.33, so orders 0, ±1, ±2, ±3 reach the screen
  assert.equal(out.maxOrder, 3);
});

test('grating: no single fringe spacing (maxima are not evenly spaced on a flat screen)', () => {
  // 600 lines/mm, 500 nm, L = 1 m: y_m = tan(asin(0.3m)) = 0.3145, 0.7500, 2.0647 m, gaps 0.31, 0.44, 1.31 m
  const p = params('interference', { aperture: 'grating', wavelength: 500, linesPerMm: 600, screenDistance: 1 });
  assert.equal(interferenceOutputs(p).fringeSpacing, null);
  const ys = principalMaxima(500e-9, 1e-3 / 600)
    .filter((o) => o.m > 0)
    .map((o) => screenPosition(o.theta, 1));
  close(ys[0], 0.31449, 1e-5);
  close(ys[1], 0.75, 1e-12);
  close(ys[2], Math.tan(Math.asin(0.9)), 1e-12);
  assert.ok(ys[2] - ys[1] > 2 * (ys[1] - ys[0]), 'gaps grow outwards');
  // The double slit keeps its (near-uniform) fringe spacing; the single slit has none
  assert.ok(interferenceOutputs(params('interference', { aperture: 'double' })).fringeSpacing > 0);
  assert.equal(interferenceOutputs(params('interference', { aperture: 'single' })).fringeSpacing, null);
});

test('§9.1 beats: 440 Hz + 444 Hz → 4 Hz', () => {
  assert.equal(beatFrequency(440, 444), 4);
  assert.equal(beatFrequency(444, 440), 4);
  const out = outputs(createState(), 'doppler-beats', params('doppler-beats', { dopplerMode: 'beats', toneFrequency1: 440, toneFrequency2: 444 }));
  close(out.beatFrequency, 4, 1e-12);
  close(out.beatPeriod, 0.25, 1e-12);
});

test('§9.1 closed pipe 0.5 m with v = 340 m/s: fundamental 170 Hz', () => {
  // f₁ = v / 4L = 340 / 2 = 170 Hz
  close(standingFrequency('closed', 1, 0.5, 340), 170, 1e-9);
  const out = outputs(createState(), 'wave-machine', params('wave-machine', { waveType: 'standing', boundary: 'closed', harmonic: 1, mediumLength: 0.5, standingSpeed: 340 }));
  close(out.waveFrequency, 170, 1e-9);
  close(out.fundamental, 170, 1e-9);
});

test('§9.1 Doppler: source at 20 m/s toward a still observer, 500 Hz, v = 340 m/s → 531.25 Hz', () => {
  // f′ = f v / (v − v_s) = 500 × 340 / 320 = 531.25 Hz
  close(dopplerFrequency(500, 340, 0, 20), 531.25, 1e-9);
  const p = params('doppler-beats', { dopplerMode: 'doppler', sourceFrequency: 500, sourceSpeed: 20, observerSpeed: 0, soundSpeed: 340 });
  close(observedFrequency(0, p), 531.25, 1e-9, 'retarded-time model, before the source passes');
  const out = outputs(createState(), 'doppler-beats', p);
  close(out.observedFrequency, 531.25, 1e-9);
  close(out.frequencyShift, 31.25, 1e-9);
});

// ---------------------------------------------------------------------------------------------
// Interference: N-slit intensity, limits and screen mapping
// ---------------------------------------------------------------------------------------------

test('sinc and the array factor handle β → 0 and γ → mπ without NaN', () => {
  assert.equal(sinc(0), 1);
  close(sinc(1e-9), 1, 1e-15);
  close(sinc(Math.PI), 0, 1e-15);
  for (const N of [2, 3, 7, 100, 1000]) {
    for (const m of [-3, -1, 0, 1, 2, 5]) {
      const af = arrayFactor(m * Math.PI, N);
      assert.ok(Number.isFinite(af), `N = ${N}, m = ${m}`);
      close(af * af, 1, 1e-12, `|AF|² at γ = ${m}π, N = ${N}`);
      // Approaching the limit from either side stays continuous
      close(arrayFactor(m * Math.PI + 1e-10, N) ** 2, 1, 1e-6);
    }
  }
  // Double slit: [sin 2γ / (2 sin γ)]² = cos² γ
  for (const g of [0.1, 0.7, 1.3, 2.9]) close(arrayFactor(g, 2) ** 2, Math.cos(g) ** 2, 1e-12);
  // Zeros of the N-slit factor at γ = π/N
  close(arrayFactor(Math.PI / 5, 5), 0, 1e-12);
});

test('N-slit intensity: central maximum 1, zeros where expected, envelope at principal maxima', () => {
  const lambda = 600e-9;
  const g = { lambda, a: 0.05e-3, d: 0.25e-3, N: 2 };
  assert.equal(slitIntensity(0, g), 1);
  // Single slit zeros at a sin θ = mλ
  const single = { lambda, a: 0.1e-3, d: 0, N: 1 };
  for (const m of [1, 2, 3]) close(slitIntensity((m * lambda) / single.a, single), 0, 1e-12, `single-slit zero m=${m}`);
  // Double slit: dark fringes at d sin θ = (m + ½)λ
  for (const m of [0, 1, 2]) close(slitIntensity(((m + 0.5) * lambda) / g.d, g), 0, 1e-12, `double-slit dark fringe m=${m}`);
  // Principal maxima sit on the single-slit envelope [sin β / β]²
  for (const m of [1, 2, 3]) {
    const s = (m * lambda) / g.d;
    const beta = (Math.PI * g.a * s) / lambda;
    close(slitIntensity(s, g), (Math.sin(beta) / beta) ** 2, 1e-12, `order ${m} on the envelope`);
  }
  // Missing order: d/a = 5, so order 5 falls on an envelope zero
  close(slitIntensity((5 * lambda) / g.d, g), 0, 1e-12, 'missing 5th order');
  assert.ok(isMissingOrder(5, g.a, g.d));
  assert.ok(!isMissingOrder(4, g.a, g.d));
  // Grating: first zero beside the central maximum at sin θ = λ/(N d)
  const grating = { lambda: 500e-9, a: 0.2 * (1e-3 / 600), d: 1e-3 / 600, N: 100 };
  close(slitIntensity(grating.lambda / (grating.N * grating.d), grating), 0, 1e-12);
  assert.ok(Number.isFinite(slitIntensity(0.3, grating)));
});

test('screen mapping is y = L tan θ, not the small-angle approximation', () => {
  close(screenPosition(30 * DEG, 2), 2 * Math.tan(30 * DEG), 1e-15);
  // Grating case: 600 lines/mm, 500 nm, L = 1 m → y₁ = tan(17.4576°) = 0.31449 m, while λL/d = 0.3 m
  const out = interferenceOutputs(params('interference', { aperture: 'grating', wavelength: 500, linesPerMm: 600, screenDistance: 1 }));
  close(out.firstOrderPosition, Math.tan(Math.asin(0.3)), 1e-12);
  close(out.smallAnglePosition, 0.3, 1e-12);
  assert.ok(out.firstOrderPosition > out.smallAnglePosition);
});

test('principal maxima and the highest order: d sin θ = mλ with |sin θ| < 1', () => {
  const max = principalMaxima(500e-9, 1e-3 / 600);
  assert.deepEqual(
    max.map((o) => o.m),
    [-3, -2, -1, 0, 1, 2, 3],
  );
  close(max[4].theta, Math.asin(0.3), 1e-12);
  // d/λ exactly 4: the 4th order would be at 90°, which never reaches a screen
  assert.equal(maxOrder(500e-9, 2e-6), 3);
  assert.equal(maxOrder(500e-9, 2.1e-6), 4);
  assert.equal(maxOrder(700e-9, 0.5e-6), 0);
  // Single-slit minima a sin θ = mλ, m ≠ 0
  const mins = singleSlitMinima(500e-9, 1.2e-6);
  assert.deepEqual(
    mins.map((o) => o.m),
    [-2, -1, 1, 2],
  );
});

test('geometry from the controls: units, grating spacing and a ≤ d', () => {
  const g = apertureGeometry(params('interference', { aperture: 'grating', wavelength: 500, linesPerMm: 500, slitFraction: 0.2, illuminatedLines: 40 }));
  close(g.d, 2e-6, 1e-18);
  close(g.a, 0.4e-6, 1e-18);
  assert.equal(g.N, 40);
  close(g.lambda, 500e-9, 1e-21);
  const tooWide = apertureGeometry(params('interference', { aperture: 'double', slitSeparation: 0.1, slitWidth: 0.2 }));
  close(tooWide.a, 0.1e-3, 1e-18, 'slit width limited to the separation');
  assert.equal(tooWide.limited, true);
  const single = apertureGeometry(params('interference', { aperture: 'single', slitWidth: 0.1 }));
  assert.equal(single.N, 1);
});

test('single slit outputs: first minimum and central maximum width', () => {
  // a = 0.1 mm, λ = 600 nm, L = 2 m: sin θ₁ = 0.006; width = 2 L tan θ₁ ≈ 2λL/a = 24 mm
  const out = interferenceOutputs(params('interference', { aperture: 'single', slitWidth: 0.1, wavelength: 600, screenDistance: 2 }));
  close(out.firstOrderAngle, Math.asin(0.006) / DEG, 1e-12);
  close(out.centralWidth, 2 * 2 * Math.tan(Math.asin(0.006)), 1e-15);
  rel(out.centralWidth, 0.024, 0.001);
  assert.equal(out.fringeSpacing, null);
  assert.equal(out.maxOrder, null);
});

test('the drawn profile keeps every narrow grating maximum (peak-preserving columns)', () => {
  const p = params('interference', { aperture: 'grating', wavelength: 500, linesPerMm: 600, illuminatedLines: 1000, slitFraction: 0.2, screenDistance: 1, screenView: '5' });
  const g = apertureGeometry(p);
  const half = screenHalfWidth(p);
  const prof = intensityProfile(p, 300, half);
  assert.equal(prof.I.length, 300);
  for (const v of prof.I) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1 + 1e-12);
  // First order at y = tan(asin 0.3) m; its column must show the envelope value there
  const y1 = Math.tan(Math.asin(0.3));
  const col = Math.floor(((y1 + half) / (2 * half)) * 300);
  const beta = (Math.PI * g.a * 0.3) / g.lambda;
  close(prof.I[col], (Math.sin(beta) / beta) ** 2, 1e-9, 'first-order peak survives sampling');
  // Central column holds the central maximum
  close(Math.max(prof.I[149], prof.I[150]), 1, 1e-9);
});

test('wavelength → colour: hue ordering across the spectrum, invisible outside it', () => {
  const red = wavelengthToRgb(650);
  assert.ok(red.rgb[0] > red.rgb[1] && red.rgb[0] > red.rgb[2], 'red at 650 nm');
  const green = wavelengthToRgb(530);
  assert.ok(green.rgb[1] > green.rgb[0] && green.rgb[1] > green.rgb[2], 'green at 530 nm');
  const blue = wavelengthToRgb(460);
  assert.ok(blue.rgb[2] > blue.rgb[0] && blue.rgb[2] > blue.rgb[1], 'blue at 460 nm');
  const yellow = wavelengthToRgb(580);
  assert.ok(yellow.rgb[0] > yellow.rgb[2] && yellow.rgb[1] > yellow.rgb[2], 'yellow at 580 nm');
  assert.equal(wavelengthToRgb(600).visible, true);
  assert.equal(wavelengthToRgb(350).visible, false);
  assert.equal(wavelengthToRgb(790).visible, false);
  for (const nm of [350, 400, 500, 600, 700, 800]) for (const c of wavelengthToRgb(nm).rgb) assert.ok(c >= 0 && c <= 1);
});

// ---------------------------------------------------------------------------------------------
// Modulation: AM sidebands, FM instantaneous frequency, Bessel spectrum, bandwidth
// ---------------------------------------------------------------------------------------------

/** Single-sided DFT amplitude at an integer frequency (Hz) over a 1 s window of N samples (|mean| at 0 Hz). */
function dftAmplitude(fn, f, N = 4096) {
  let re = 0;
  let im = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const v = fn(t);
    re += v * Math.cos(2 * Math.PI * f * t);
    im -= v * Math.sin(2 * Math.PI * f * t);
  }
  return ((f === 0 ? 1 : 2) * Math.hypot(re, im)) / N;
}

test('Bessel functions match tabulated values (Abramowitz & Stegun, table 9.1)', () => {
  close(besselJ(0, 1), 0.7651976866, 1e-9);
  close(besselJ(1, 1), 0.4400505857, 1e-9);
  close(besselJ(2, 1), 0.1149034849, 1e-9);
  close(besselJ(0, 2.404825557695773), 0, 1e-12, 'first zero of J₀');
  close(besselJ(-3, 2), -besselJ(3, 2), 1e-14, 'J₋ₙ = (−1)ⁿ Jₙ');
  // Σ Jₙ(x)² over all n = 1
  let sum = 0;
  for (let n = -40; n <= 40; n++) sum += besselJ(n, 5) ** 2;
  close(sum, 1, 1e-12);
});

test('AM: envelope 1 + m·m(t) and sidebands of amplitude m/2 at f_c ± f_m', () => {
  const p = params('modulation', { modulation: 'am', carrierFrequency: 20, messageFrequency: 1, amIndex: 0.5, messageShape: 'sine' });
  // At a carrier crest (t = k/f_c), the signal equals the envelope
  for (const t of [0.25, 0.4, 0.75]) close(modulatedValue(t, p), 1 + 0.5 * Math.sin(2 * Math.PI * t), 1e-12, `envelope at t=${t}`);
  close(dftAmplitude((t) => modulatedValue(t, p), 20), 1, 1e-9, 'carrier');
  close(dftAmplitude((t) => modulatedValue(t, p), 19), 0.25, 1e-9, 'lower sideband');
  close(dftAmplitude((t) => modulatedValue(t, p), 21), 0.25, 1e-9, 'upper sideband');
  const lines = modulationSpectrum(p).lines;
  assert.equal(lines.length, 3);
  for (const { f, amplitude } of lines) close(amplitude, f === 20 ? 1 : 0.25, 1e-12);
  close(modulationBandwidth(p), 2, 1e-12, 'B = 2 f_m');
  close(modulationIndex(p), 0.5, 0);
  const out = outputs(createState(), 'modulation', p);
  close(out.upperSideband, 21, 1e-12);
  close(out.lowerSideband, 19, 1e-12);
});

test('AM with a square message: sidebands 2m/(πk) at f_c ± k f_m, k odd, plus the terms folded from below 0 Hz', () => {
  const p = params('modulation', { modulation: 'am', carrierFrequency: 20, messageFrequency: 1, amIndex: 0.8, messageShape: 'square' });
  const { lines } = modulationSpectrum(p);
  const at = (f) => lines.find((l) => Math.abs(l.f - f) < 1e-9)?.amplitude;
  // m·sq(t)·cos(2π·20t) = Σ (2m/πk)[sin 2π(k + 20)t + sin 2π(k − 20)t], k odd.
  // 21 Hz: k = 1 (upper) and k = 41 (k − 20 = 21), same sign: (2m/π)(1 + 1/41).
  close(at(21), ((2 * 0.8) / Math.PI) * (1 + 1 / 41), 1e-12);
  // 17 Hz: k = 3 (k − 20 = −17, a sine with its sign reversed) and k = 37 (k − 20 = 17): (2m/π)(1/3 − 1/37).
  close(at(17), ((2 * 0.8) / Math.PI) * (1 / 3 - 1 / 37), 1e-12);
  close(at(20), 1, 1e-12, 'carrier');
  assert.equal(at(22), undefined, 'no even harmonics');
  assert.equal(modulationBandwidth(p), null, 'a square message has no finite bandwidth');
});

test('spectrum lines below 0 Hz fold back and combine; a line at 0 Hz is a steady offset (checked against a DFT)', () => {
  // FM, f_c = 10 Hz, f_m = 5 Hz, Δf = 10 Hz (β = 2): n = −1 lands at 5 Hz and n = −3 folds onto it; n = −2 is at 0 Hz.
  const fm = params('modulation', { modulation: 'fm', carrierFrequency: 10, messageFrequency: 5, fmDeviation: 10, messageShape: 'sine' });
  const spec = modulationSpectrum(fm);
  const at = (s, f) => s.lines.find((l) => Math.abs(l.f - f) < 1e-9)?.amplitude ?? 0;
  assert.equal(spec.folded, true);
  for (const f of [0, 5, 10, 15, 20, 25, 30]) close(at(spec, f), dftAmplitude((t) => modulatedValue(t, fm), f), 1e-9, `FM line at ${f} Hz`);
  close(at(spec, 5), 0.502, 0.001);
  close(at(spec, 0), Math.abs(besselJ(2, 2) * Math.cos(2)), 1e-12, 'DC = |J₂(2) cos β|');
  // PM, Δφ = 2 rad: real coefficients Jₙ(2); 5 Hz gets J₋₁ + J₋₃ (both negative), 0 Hz gets J₋₂.
  const pm = params('modulation', { modulation: 'pm', carrierFrequency: 10, messageFrequency: 5, pmDeviation: 2, messageShape: 'sine' });
  const sp = modulationSpectrum(pm);
  close(at(sp, 5), besselJ(1, 2) + besselJ(3, 2), 1e-12);
  close(at(sp, 0), besselJ(2, 2), 1e-12);
  for (const f of [0, 5, 10, 15, 20]) close(at(sp, f), dftAmplitude((t) => modulatedValue(t, pm), f), 1e-9, `PM line at ${f} Hz`);
  // The defaults never fold
  assert.equal(modulationSpectrum(params('modulation', { modulation: 'fm' })).folded, false);
});

test('FM: instantaneous frequency f_c + Δf·m(t), Carson bandwidth, Bessel sidebands', () => {
  const p = params('modulation', { modulation: 'fm', carrierFrequency: 20, messageFrequency: 1, fmDeviation: 3, messageShape: 'sine' });
  // Numerical derivative of the phase recovered from the integral matches f_c + Δf sin(2π f_m t)
  for (const t of [0.1, 0.33, 0.8]) {
    close(instantaneousFrequency(t, p), 20 + 3 * Math.sin(2 * Math.PI * t), 1e-12);
    const h = 1e-6;
    const dInt = (messageIntegral(t + h, p) - messageIntegral(t - h, p)) / (2 * h);
    close(dInt, messageValue(t, p), 1e-6, 'd/dt ∫m = m');
  }
  close(modulationIndex(p), 3, 1e-12, 'β = Δf / f_m');
  close(modulationBandwidth(p), 8, 1e-12, 'Carson: 2(Δf + f_m)');
  // Spectral lines |Jₙ(β)| at f_c + n f_m, checked against a DFT of the waveform itself
  const lines = modulationSpectrum(p).lines;
  for (const n of [-2, 0, 1, 3]) {
    const line = lines.find((l) => Math.abs(l.f - (20 + n)) < 1e-9);
    close(line.amplitude, Math.abs(besselJ(n, 3)), 1e-12);
    close(dftAmplitude((t) => modulatedValue(t, p), 20 + n), Math.abs(besselJ(n, 3)), 1e-9, `DFT at n=${n}`);
  }
});

test('FM with a square message: the phase is the running integral (frequency-shift keying)', () => {
  const p = params('modulation', { modulation: 'fm', carrierFrequency: 20, messageFrequency: 1, fmDeviation: 4, messageShape: 'square' });
  close(messageIntegral(0.25, p), 0.25, 1e-12);
  close(messageIntegral(0.75, p), 0.25, 1e-12);
  close(messageIntegral(1, p), 0, 1e-12);
  close(instantaneousFrequency(0.2, p), 24, 1e-12);
  close(instantaneousFrequency(0.7, p), 16, 1e-12);
});

test('PM: phase deviation is the index; instantaneous frequency f_c + Δφ f_m cos(2π f_m t)', () => {
  const p = params('modulation', { modulation: 'pm', carrierFrequency: 20, messageFrequency: 2, pmDeviation: 1.5, messageShape: 'sine' });
  close(modulatedValue(0.1, p), Math.cos(2 * Math.PI * 20 * 0.1 + 1.5 * Math.sin(2 * Math.PI * 2 * 0.1)), 1e-12);
  close(instantaneousFrequency(0.1, p), 20 + 1.5 * 2 * Math.cos(2 * Math.PI * 2 * 0.1), 1e-12);
  close(modulationIndex(p), 1.5, 0);
  close(modulationBandwidth(p), 2 * (1.5 * 2 + 2), 1e-12);
});

// ---------------------------------------------------------------------------------------------
// Wave machine: travelling waves, pulses, standing waves and harmonics
// ---------------------------------------------------------------------------------------------

test('travelling wave: y(x + vΔt, t + Δt) = y(x, t); λ = v/f', () => {
  const w = { amplitude: 0.4, frequency: 0.5, speed: 2, direction: 'right' };
  for (const [x, t] of [[1, 0.3], [4.2, 1.7]]) {
    close(travellingDisplacement(x + 2 * 0.37, t + 0.37, w), travellingDisplacement(x, t, w), 1e-12);
    close(travellingDisplacement(x + 4, t, w), travellingDisplacement(x, t, w), 1e-12, 'λ = 4 m');
  }
  const left = { ...w, direction: 'left' };
  close(travellingDisplacement(3 - 2 * 0.5, 0.5, left), travellingDisplacement(3, 0, left), 1e-12);
  const out = outputs(createState(), 'wave-machine', params('wave-machine', { waveType: 'transverse', frequency: 0.5, waveSpeed: 2 }));
  close(out.wavelength, 4, 1e-12);
  close(out.period, 2, 1e-12);
});

test('pulses pass through each other: superposition is the sum, then both pulses leave', () => {
  const p = params('wave-machine', { waveType: 'superposition', superShape: 'pulses', amplitude: 0.5, amplitude2: -0.5, waveSpeed: 2 });
  // The pulses start at x = 2 m and x = 10 m and meet at x = 6 m at t = 2 s: equal and opposite cancel
  const a = pulseDisplacement(6, 2, { amplitude: 0.5, speed: 2, x0: 2, direction: 'right' });
  const b = pulseDisplacement(6, 2, { amplitude: -0.5, speed: 2, x0: 10, direction: 'left' });
  close(a, 0.5, 1e-12);
  close(a + b, 0, 1e-12);
  assert.ok(Number.isFinite(totalSteps('wave-machine', p)));
  const end = advance(createState(), 'wave-machine', p, 1e9);
  assert.ok(isComplete(end, 'wave-machine', p));
});

test('standing waves: string and open-pipe harmonics f_n = nv/2L; closed pipe (2n − 1)v/4L', () => {
  close(standingFrequency('string', 3, 0.65, 260), (3 * 260) / (2 * 0.65), 1e-9);
  close(standingFrequency('open', 2, 0.5, 340), 680, 1e-9);
  close(standingFrequency('closed', 3, 0.5, 340), 850, 1e-9);
  assert.equal(harmonicNumber('closed', 3), 5);
  assert.equal(harmonicNumber('open', 3), 3);
  close(standingWavelength('closed', 1, 0.5), 2, 1e-12);
  close(standingWavelength('string', 2, 0.5), 0.5, 1e-12);
  // v = fλ for every mode
  for (const b of ['string', 'open', 'closed']) for (const n of [1, 2, 5]) close(standingFrequency(b, n, 0.8, 340) * standingWavelength(b, n, 0.8), 340, 1e-9);
});

test('standing waves: nodes have zero displacement; counts of N and A', () => {
  for (const [b, n, nodes, anti] of [['string', 3, 4, 3], ['open', 3, 3, 4], ['closed', 3, 3, 3], ['closed', 1, 1, 1]]) {
    const { nodes: N, antinodes: A } = standingNodes(b, n, 0.5);
    assert.equal(N.length, nodes, `${b} n=${n} nodes`);
    assert.equal(A.length, anti, `${b} n=${n} antinodes`);
    for (const x of N) close(standingShape(x, b, n, 0.5), 0, 1e-12, `${b} node at ${x}`);
    for (const x of A) close(Math.abs(standingShape(x, b, n, 0.5)), 1, 1e-12, `${b} antinode at ${x}`);
  }
  // Closed pipe: closed end (x = 0) is a displacement node, the open end an antinode
  const { nodes, antinodes } = standingNodes('closed', 2, 0.5);
  close(nodes[0], 0, 1e-15);
  close(antinodes[antinodes.length - 1], 0.5, 1e-15);
});

// ---------------------------------------------------------------------------------------------
// Doppler and beats
// ---------------------------------------------------------------------------------------------

test('Doppler: observer moving, both moving, receding; sign conventions', () => {
  // Observer toward a still source at 20 m/s: 500 × 360/340
  close(dopplerFrequency(500, 340, 20, 0), (500 * 360) / 340, 1e-9);
  // Both approaching at 20 m/s: 500 × 360/320 = 562.5
  close(dopplerFrequency(500, 340, 20, 20), 562.5, 1e-9);
  // Source moving away at 20 m/s (v_s = −20): 500 × 340/360
  close(dopplerFrequency(500, 340, 0, -20), (500 * 340) / 360, 1e-9);
  const p = params('doppler-beats', { dopplerMode: 'doppler', sourceFrequency: 500, sourceSpeed: 0, observerSpeed: 20, soundSpeed: 340 });
  close(observedFrequency(0, p), (500 * 360) / 340, 1e-9);
});

test('Doppler with retarded time: after the source passes, the observer hears the receding pitch', () => {
  const p = params('doppler-beats', { dopplerMode: 'doppler', sourceFrequency: 500, sourceSpeed: 40, observerSpeed: 0, soundSpeed: 340 });
  // The source starts at x = −10 m, the observer at x = +10 m. The source passes at t = 0.5 s;
  // its sound from then reaches the observer immediately, so after that the pitch is f v/(v + v_s).
  close(sourceX(0, p), -10, 1e-12);
  close(observerX(0, p), 10, 1e-12);
  close(observedFrequency(0.4, p), (500 * 340) / 300, 1e-9, 'approaching');
  close(observedFrequency(0.6, p), (500 * 340) / 380, 1e-9, 'receding');
  // Every crest drawn is centred where the source was when it was emitted, radius v(t − t_e)
  const crests = crestsAt(0.3, p, 1, 40);
  assert.ok(crests.length > 10);
  for (const c of crests.slice(0, 5)) {
    close(c.x, -10 + 40 * c.te, 1e-9);
    close(c.r, 340 * (0.3 - c.te), 1e-9);
  }
});

test('beats: y₁ + y₂ = 2 cos(πΔf t) cos(π(f₁ + f₂)t); envelope zeros at (k + ½)/Δf', () => {
  const p = params('doppler-beats', { dopplerMode: 'beats', toneFrequency1: 440, toneFrequency2: 444 });
  for (const t of [0.013, 0.1, 0.377]) {
    const v = beatsValues(t, p);
    close(v.sum, 2 * Math.cos(Math.PI * 4 * t) * Math.cos(Math.PI * 884 * t), 1e-12);
    close(v.envelope, Math.abs(2 * Math.cos(Math.PI * 4 * t)), 1e-12);
  }
  close(beatsValues(0.125, p).envelope, 0, 1e-12);
  close(beatsValues(0.375, p).envelope, 0, 1e-12);
});

// ---------------------------------------------------------------------------------------------
// Time stepping, outputs and data for every setup
// ---------------------------------------------------------------------------------------------

test('fixed steps: time is n·DT; doppler time runs in slow motion; static interference', () => {
  const pm = params('modulation');
  const s = advance(createState(), 'modulation', pm, 240);
  close(physicalTime(s, 'modulation', pm), 240 * DT, 1e-12);
  assert.equal(isComplete(s, 'modulation', pm), false);
  const pd = params('doppler-beats', { dopplerMode: 'doppler' });
  const sd = advance(createState(), 'doppler-beats', pd, 240);
  close(physicalTime(sd, 'doppler-beats', pd), 0.1, 1e-12, 'one animation second is 0.1 s of physics');
  const pi = params('interference');
  assert.equal(isComplete(createState(), 'interference', pi), true);
  assert.equal(advance(createState(), 'interference', pi, 10).n, 0);
});

test('Doppler run ends when the source leaves the 50 m view', () => {
  const p = params('doppler-beats', { dopplerMode: 'doppler', sourceSpeed: 20, observerSpeed: 0 });
  // From x = −10 m to x = +25 m at 20 m/s: 1.75 s of physics = 17.5 s of animation = 4200 steps
  const n = totalSteps('doppler-beats', p);
  assert.equal(n, 4200);
  const end = advance(createState(), 'doppler-beats', p, 1e9);
  assert.equal(end.n, n, 'the run stops at its last step');
  assert.ok(isComplete(end, 'doppler-beats', p));
  close(sourceX(physicalTime(end, 'doppler-beats', p), p), 25, 1e-9);
  const still = params('doppler-beats', { dopplerMode: 'doppler', sourceSpeed: 0, observerSpeed: 0 });
  assert.equal(totalSteps('doppler-beats', still), Infinity);
});

test('every setup: outputs are finite numbers or null, data has matching columns', () => {
  for (const setup of meta.setups) {
    const p = params(setup);
    const s = advance(createState(), setup, p, 100);
    const out = outputs(s, setup, p);
    const keys = Object.entries(meta.outputs)
      .filter(([, o]) => !o.setups || o.setups.includes(setup))
      .map(([k]) => k);
    for (const k of keys) assert.ok(k in out, `${setup}: output ${k} missing`);
    for (const [k, v] of Object.entries(out)) assert.ok(v === null || Number.isFinite(v), `${setup}.${k} = ${v}`);
    const data = samples(s, setup, p);
    assert.ok(data.rows.length > 10, `${setup}: data rows`);
    for (const row of data.rows) {
      assert.equal(row.length, data.columns.length);
      for (const v of row) assert.ok(Number.isFinite(v), `${setup}: non-finite value in data`);
    }
  }
});

test('deterministic: same params, same outputs', () => {
  for (const setup of meta.setups) {
    const p = params(setup);
    assert.deepEqual(outputs(advance(createState(), setup, p, 777), setup, p), outputs(advance(createState(), setup, p, 777), setup, p));
  }
});

test('meta: every setup in the coverage table, interference is static', () => {
  assert.deepEqual([...meta.setups].sort(), ['doppler-beats', 'interference', 'modulation', 'wave-machine']);
  assert.deepEqual(meta.staticSetups, ['interference']);
  assert.equal(meta.params.soundSpeed.default, 340);
  assert.equal(meta.params.standingSpeed.default, 340);
});
