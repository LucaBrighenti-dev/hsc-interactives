// Wave engine model (guide §9.1): N-slit interference, AM/FM/PM modulation, the wave machine
// (transverse, longitudinal, superposition, standing waves on strings and in pipes), the Doppler
// effect and beats. Pure: no DOM, no timers, no randomness. Importable in Node for tests.
//
// Units: SI inside the model (m, s, Hz, rad). The controls use teaching units (nm, mm, lines/mm);
// apertureGeometry() converts them. Angles in outputs are in degrees.
//
// Time: state = { n } whole fixed steps of DT (never accumulated as t += DT). Physical time depends
// on the setup and is stated on stage:
//   modulation, travelling waves, beats   t = n·DT (real time; the shell's timeScale slows it)
//   Doppler                                t = n·DT·DOPPLER_SLOW (slow motion)
//   standing waves                         drawn at f_display = 0.4 Hz × harmonic number, so every
//                                          harmonic is slowed by the same factor f₁ / 0.4 Hz

export const DT = 1 / 240; // s, fixed animation step
export const SOUND_SPEED = 340; // m/s, default speed of sound (stated on stage)
export const DOPPLER_SLOW = 0.1; // physical seconds per animation second
export const DOPPLER_HALF_WIDTH = 25; // m, the Doppler view spans x = −25 m … 25 m
export const DOPPLER_SOURCE_X0 = -10; // m, source position at t = 0
export const DOPPLER_OBSERVER_X0 = 10; // m, observer position at t = 0
export const MACHINE_LENGTH = 12; // m of medium shown for travelling waves and pulses
export const PULSE_SIGMA = 0.4; // m, Gaussian pulse width
export const PULSE_STARTS = [2, 10]; // m, pulse 1 (moving right) and pulse 2 (moving left)
export const STANDING_DISPLAY_HZ = 0.4; // Hz per harmonic number, for the slowed animation
export const SPECTRUM_HALF_WIDTH = 15; // Hz either side of the carrier in the spectrum panel
export const VISIBLE_NM = [380, 750]; // nm, drawn in colour; outside this the eye barely responds

const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

// ---------------------------------------------------------------------------------------------
// Interference: N slits of width a, spacing d, wavelength λ, screen at distance L
// I(θ) = I₀ [sin β / β]² [sin Nγ / (N sin γ)]²,  β = πa sin θ / λ,  γ = πd sin θ / λ
// ---------------------------------------------------------------------------------------------

/** sin x / x, with the limit 1 at x = 0. */
export function sinc(x) {
  if (Math.abs(x) < 1e-4) {
    const x2 = x * x;
    return 1 - x2 / 6 + (x2 * x2) / 120;
  }
  return Math.sin(x) / x;
}

/**
 * sin(Nγ) / (N sin γ), the N-slit array factor normalised to 1 at its principal maxima.
 * Near γ = mπ both sines vanish; reducing γ to g = γ − mπ gives (−1)^{(N−1)m} sin(Ng) / (N sin g).
 */
export function arrayFactor(gamma, N) {
  if (N <= 1) return 1;
  const m = Math.round(gamma / Math.PI);
  const g = gamma - m * Math.PI;
  const sign = Math.abs(((N - 1) * m) % 2) === 1 ? -1 : 1;
  const s = Math.sin(g);
  if (Math.abs(s) < 1e-9) return sign * (1 - ((N * N - 1) * g * g) / 6);
  return (sign * Math.sin(N * g)) / (N * s);
}

/**
 * Relative intensity I/I₀ at a given sin θ.
 * @param {number} sinTheta
 * @param {{ lambda: number, a: number, d: number, N: number }} g  SI units; N = 1 for a single slit
 */
export function slitIntensity(sinTheta, { lambda, a, d, N }) {
  const beta = a > 0 ? (Math.PI * a * sinTheta) / lambda : 0;
  const envelope = sinc(beta) ** 2;
  if (N <= 1) return envelope;
  const af = arrayFactor((Math.PI * d * sinTheta) / lambda, N);
  return envelope * af * af;
}

/** Slit spacing of a grating (m) from its line density (lines per mm). */
export function gratingSpacing(linesPerMm) {
  return 1e-3 / linesPerMm;
}

/**
 * Convert the interference controls (nm, mm, lines/mm) into SI geometry.
 * In a double slit the slit width cannot exceed the separation; `limited` reports when a was capped.
 */
export function apertureGeometry(p) {
  const lambda = p.wavelength * 1e-9;
  const L = p.screenDistance;
  if (p.aperture === 'single') return { kind: 'single', lambda, L, N: 1, a: p.slitWidth * 1e-3, d: 0, limited: false };
  if (p.aperture === 'grating') {
    const d = gratingSpacing(p.linesPerMm);
    return { kind: 'grating', lambda, L, N: Math.max(2, Math.round(p.illuminatedLines)), a: p.slitFraction * d, d, limited: false };
  }
  const d = p.slitSeparation * 1e-3;
  const wanted = p.slitWidth * 1e-3;
  return { kind: 'double', lambda, L, N: 2, a: Math.min(wanted, d), d, limited: wanted > d };
}

/** Position on a flat screen: y = L tan θ (exact, not the small-angle approximation). */
export function screenPosition(theta, L) {
  return L * Math.tan(theta);
}

/** sin θ for a point at height y on a screen at distance L. */
export function sinAtPosition(y, L) {
  return y / Math.hypot(y, L);
}

/** Highest order m with |mλ/d| < 1 (an order exactly at 90° never reaches a screen). */
export function maxOrder(lambda, d) {
  const r = d / lambda;
  let m = Math.floor(r + 1e-9);
  if (Math.abs(r - m) < 1e-9) m -= 1;
  return Math.max(0, m);
}

/** Principal maxima d sin θ = mλ: [{ m, sinTheta, theta }] for every order that exists. */
export function principalMaxima(lambda, d) {
  const top = maxOrder(lambda, d);
  const list = [];
  for (let m = -top; m <= top; m++) {
    const sinTheta = (m * lambda) / d;
    list.push({ m, sinTheta, theta: Math.asin(sinTheta) });
  }
  return list;
}

/** Single-slit minima a sin θ = mλ, m ≠ 0: [{ m, sinTheta, theta }]. */
export function singleSlitMinima(lambda, a) {
  const top = maxOrder(lambda, a);
  const list = [];
  for (let m = -top; m <= top; m++) {
    if (m === 0) continue;
    const sinTheta = (m * lambda) / a;
    list.push({ m, sinTheta, theta: Math.asin(sinTheta) });
  }
  return list;
}

/** An order is missing when it lands on a zero of the single-slit envelope: m·a/d is a non-zero integer. */
export function isMissingOrder(m, a, d) {
  if (m === 0 || !(a > 0)) return false;
  const k = (m * a) / d;
  return Math.abs(k - Math.round(k)) < 1e-9 && Math.round(k) !== 0;
}

/** Half-width (m) of the screen shown. 'auto' does not depend on λ, d, a or L for slits, so changes stay visible. */
export function screenHalfWidth(p) {
  if (p.screenView && p.screenView !== 'auto') return Number(p.screenView);
  return p.aperture === 'grating' ? 3 * p.screenDistance : 0.05;
}

/**
 * Intensity across the screen in `columns` equal columns from −half to +half.
 * Peak-preserving: each column holds the largest intensity found in it, including any principal
 * maximum inside the column (grating maxima can be far narrower than a pixel).
 * @returns {{ y: Float64Array, I: Float64Array, envelope: Float64Array }}
 */
export function intensityProfile(p, columns, half = screenHalfWidth(p)) {
  const g = apertureGeometry(p);
  const n = Math.max(1, Math.floor(columns));
  const y = new Float64Array(n);
  const I = new Float64Array(n);
  const envelope = new Float64Array(n);
  const w = (2 * half) / n;
  const SUB = 4;
  const single = { lambda: g.lambda, a: g.a, d: 0, N: 1 };
  for (let i = 0; i < n; i++) {
    const y0 = -half + i * w;
    const y1 = y0 + w;
    let best = 0;
    for (let k = 0; k <= SUB; k++) best = Math.max(best, slitIntensity(sinAtPosition(y0 + (w * k) / SUB, g.L), g));
    if (g.N >= 2) {
      const s0 = sinAtPosition(y0, g.L);
      const s1 = sinAtPosition(y1, g.L);
      const mLo = Math.ceil((s0 * g.d) / g.lambda - 1e-12);
      const mHi = Math.floor((s1 * g.d) / g.lambda + 1e-12);
      for (let m = mLo; m <= mHi; m++) best = Math.max(best, slitIntensity((m * g.lambda) / g.d, g));
    }
    y[i] = (y0 + y1) / 2;
    I[i] = Math.min(1, best);
    envelope[i] = slitIntensity(sinAtPosition(y[i], g.L), single);
  }
  return { y, I, envelope };
}

/** Interference readouts (SI, angles in degrees). For a single slit, "first order" is the first minimum. */
export function interferenceOutputs(p) {
  const g = apertureGeometry(p);
  const { lambda, L } = g;
  const angle = (s) => (Math.abs(s) < 1 ? Math.asin(s) / DEG : null);
  const position = (s) => (Math.abs(s) < 1 ? L * Math.tan(Math.asin(s)) : null);
  if (g.N === 1) {
    const s1 = lambda / g.a;
    const y1 = position(s1);
    return {
      firstOrderAngle: angle(s1),
      firstOrderPosition: y1,
      smallAnglePosition: (lambda * L) / g.a,
      fringeSpacing: null,
      centralWidth: y1 === null ? null : 2 * y1,
      maxOrder: null,
    };
  }
  const s1 = lambda / g.d;
  const zero = Math.min(lambda / (g.N * g.d), g.a > 0 ? lambda / g.a : Infinity);
  const yz = position(zero);
  const y1 = position(s1);
  return {
    firstOrderAngle: angle(s1),
    firstOrderPosition: y1,
    smallAnglePosition: (lambda * L) / g.d,
    fringeSpacing: y1,
    centralWidth: yz === null ? null : 2 * yz,
    maxOrder: g.kind === 'grating' ? maxOrder(lambda, g.d) : null,
  };
}

// ---------------------------------------------------------------------------------------------
// Wavelength → colour. CIE 1931 2° colour-matching functions from the multi-lobe fit of
// C. Wyman, P.-P. Sloan and P. Shirley, "Simple Analytic Approximations to the CIE XYZ Color
// Matching Functions", Journal of Computer Graphics Techniques 2(2), 2013. XYZ → linear sRGB with
// the IEC 61966-2-1 matrix. Spectral colours lie outside the sRGB gamut, so negative channels are
// clipped and the result is scaled to a maximum of 1: the hue is right, the saturation approximate.
// ---------------------------------------------------------------------------------------------

function lobe(x, mu, s1, s2) {
  const t = (x - mu) / (x < mu ? s1 : s2);
  return Math.exp(-0.5 * t * t);
}

/** CIE 1931 x̄, ȳ, z̄ at a wavelength in nm. */
export function cieXYZ(nm) {
  const X = 1.056 * lobe(nm, 599.8, 37.9, 31.0) + 0.362 * lobe(nm, 442.0, 16.0, 26.7) - 0.065 * lobe(nm, 501.1, 20.4, 26.2);
  const Y = 0.821 * lobe(nm, 568.8, 46.9, 40.5) + 0.286 * lobe(nm, 530.9, 16.3, 31.1);
  const Z = 1.217 * lobe(nm, 437.0, 11.8, 36.0) + 0.681 * lobe(nm, 459.0, 26.0, 13.8);
  return [X, Y, Z];
}

/**
 * Display colour for a wavelength.
 * @returns {{ rgb: number[], visible: boolean, fade: number }} rgb is linear-light sRGB with max 1;
 *   fade (0.35–1) dims colours towards the ends of the visible range, where the eye responds weakly.
 */
export function wavelengthToRgb(nm) {
  const [X, Y, Z] = cieXYZ(nm);
  const r = Math.max(0, 3.2406 * X - 1.5372 * Y - 0.4986 * Z);
  const g = Math.max(0, -0.9689 * X + 1.8758 * Y + 0.0415 * Z);
  const b = Math.max(0, 0.0557 * X - 0.204 * Y + 1.057 * Z);
  const top = Math.max(r, g, b);
  const visible = nm >= VISIBLE_NM[0] && nm <= VISIBLE_NM[1];
  const rgb = top > 1e-300 ? [r / top, g / top, b / top] : [0, 0, 0];
  let fade = 1;
  if (nm < 420) fade = 0.35 + 0.65 * Math.max(0, (nm - VISIBLE_NM[0]) / (420 - VISIBLE_NM[0]));
  else if (nm > 680) fade = 0.35 + 0.65 * Math.max(0, (VISIBLE_NM[1] - nm) / (VISIBLE_NM[1] - 680));
  return { rgb, visible, fade: Math.min(1, fade) };
}

/** Linear light (0–1) → sRGB-encoded value (0–1). */
export function srgbEncode(c) {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------------------------
// Modulation. Amplitudes are normalised: carrier and message both have amplitude 1.
//   message  m(t) = sin(2π f_m t)  or a square wave ±1 (sign of the sine)
//   carrier  c(t) = cos(2π f_c t)
//   AM  s = [1 + m·m(t)] cos(2π f_c t)
//   FM  s = cos(2π f_c t + 2π Δf ∫₀ᵗ m dτ)     instantaneous frequency f_c + Δf·m(t)
//   PM  s = cos(2π f_c t + Δφ·m(t))
// ---------------------------------------------------------------------------------------------

function frac(u) {
  return u - Math.floor(u);
}

export function messageValue(t, p) {
  const u = p.messageFrequency * t;
  if (p.messageShape === 'square') return frac(u) < 0.5 ? 1 : -1;
  return Math.sin(TWO_PI * u);
}

/** ∫₀ᵗ m(τ) dτ. Both messages have zero mean, so this is periodic and valid for negative t too. */
export function messageIntegral(t, p) {
  const fm = p.messageFrequency;
  if (p.messageShape === 'square') {
    const T = 1 / fm;
    const u = frac(t / T);
    return u < 0.5 ? u * T : (1 - u) * T;
  }
  return (1 - Math.cos(TWO_PI * fm * t)) / (TWO_PI * fm);
}

export function carrierValue(t, p) {
  return Math.cos(TWO_PI * p.carrierFrequency * t);
}

/** AM envelope 1 + m·m(t) (the outline of the AM signal). */
export function amEnvelope(t, p) {
  return 1 + p.amIndex * messageValue(t, p);
}

export function modulatedValue(t, p) {
  const wc = TWO_PI * p.carrierFrequency * t;
  if (p.modulation === 'fm') return Math.cos(wc + TWO_PI * p.fmDeviation * messageIntegral(t, p));
  if (p.modulation === 'pm') return Math.cos(wc + p.pmDeviation * messageValue(t, p));
  return amEnvelope(t, p) * Math.cos(wc);
}

/** Instantaneous frequency (Hz): (1/2π) d(phase)/dt. For PM with a square message it is f_c between the jumps. */
export function instantaneousFrequency(t, p) {
  const fc = p.carrierFrequency;
  if (p.modulation === 'fm') return fc + p.fmDeviation * messageValue(t, p);
  if (p.modulation === 'pm' && p.messageShape !== 'square') {
    return fc + p.pmDeviation * p.messageFrequency * Math.cos(TWO_PI * p.messageFrequency * t);
  }
  return fc;
}

/** Modulation index: AM m, FM β = Δf / f_m, PM Δφ (rad). */
export function modulationIndex(p) {
  if (p.modulation === 'fm') return p.fmDeviation / p.messageFrequency;
  if (p.modulation === 'pm') return p.pmDeviation;
  return p.amIndex;
}

/** Bandwidth (Hz): AM 2f_m; FM and PM by Carson's rule 2(Δf_peak + f_m). Null for a square message (no finite bandwidth). */
export function modulationBandwidth(p) {
  if (p.messageShape === 'square') return null;
  const fm = p.messageFrequency;
  if (p.modulation === 'fm') return 2 * (p.fmDeviation + fm);
  if (p.modulation === 'pm') return 2 * (p.pmDeviation * fm + fm);
  return 2 * fm;
}

/**
 * Bessel function of the first kind Jₙ(x), integer n, from Jₙ(x) = (1/2π)∫₀^{2π} cos(nτ − x sin τ) dτ.
 * The integrand is smooth and periodic, so the trapezoidal rule converges geometrically.
 */
export function besselJ(n, x) {
  const M = 2 * Math.ceil(Math.abs(n) + Math.abs(x)) + 64;
  let s = 0;
  for (let k = 0; k < M; k++) {
    const tau = (TWO_PI * k) / M;
    s += Math.cos(n * tau - x * Math.sin(tau));
  }
  return s / M;
}

/**
 * Single-sided amplitude spectrum: [{ f, amplitude, n }] (n = sideband number), sorted by frequency.
 * AM: carrier 1 and sidebands m/2 (sine) or 2m/(πk) for odd k (square). FM/PM with a sine message:
 * |Jₙ(β)| at f_c + n f_m. Null for FM/PM with a square message (no simple closed form).
 */
export function modulationSpectrum(p) {
  const fc = p.carrierFrequency;
  const fm = p.messageFrequency;
  const lines = [];
  const add = (f, amplitude, n) => {
    if (f > 0 && amplitude > 1e-9) lines.push({ f, amplitude, n });
  };
  if (p.modulation === 'am') {
    add(fc, 1, 0);
    if (p.messageShape === 'square') {
      for (let k = 1; k * fm <= SPECTRUM_HALF_WIDTH + 5; k += 2) {
        const a = (2 * p.amIndex) / (Math.PI * k);
        add(fc - k * fm, a, -k);
        add(fc + k * fm, a, k);
      }
    } else {
      add(fc - fm, p.amIndex / 2, -1);
      add(fc + fm, p.amIndex / 2, 1);
    }
  } else {
    if (p.messageShape === 'square') return null;
    const beta = modulationIndex(p);
    const top = Math.ceil(beta) + 12;
    for (let n = -top; n <= top; n++) add(fc + n * fm, Math.abs(besselJ(n, beta)), n);
  }
  lines.sort((a, b) => a.f - b.f);
  return { lines };
}

// ---------------------------------------------------------------------------------------------
// Wave machine: travelling waves, pulses, superposition, standing waves
// ---------------------------------------------------------------------------------------------

/** y(x, t) = A sin(kx ∓ ωt), k = 2πf/v; 'right' travels towards +x. */
export function travellingDisplacement(x, t, { amplitude, frequency, speed, direction = 'right' }) {
  const k = (TWO_PI * frequency) / speed;
  const w = TWO_PI * frequency;
  return amplitude * Math.sin(k * x - (direction === 'left' ? -1 : 1) * w * t);
}

/** Gaussian pulse of height A starting at x0 and moving at `speed`. */
export function pulseDisplacement(x, t, { amplitude, speed, x0, direction = 'right' }) {
  const centre = x0 + (direction === 'left' ? -1 : 1) * speed * t;
  const u = (x - centre) / PULSE_SIGMA;
  return amplitude * Math.exp(-0.5 * u * u);
}

/** Wave 1, wave 2 and their sum at (x, t) for the superposition view. */
export function superpositionValues(x, t, p) {
  let y1;
  let y2;
  if (p.superShape === 'pulses') {
    y1 = pulseDisplacement(x, t, { amplitude: p.amplitude, speed: p.waveSpeed, x0: PULSE_STARTS[0], direction: 'right' });
    y2 = pulseDisplacement(x, t, { amplitude: p.amplitude2, speed: p.waveSpeed, x0: PULSE_STARTS[1], direction: 'left' });
  } else {
    y1 = travellingDisplacement(x, t, { amplitude: p.amplitude, frequency: p.frequency1, speed: p.waveSpeed, direction: 'right' });
    y2 = travellingDisplacement(x, t, { amplitude: p.amplitude2, frequency: p.frequency2, speed: p.waveSpeed, direction: p.direction2 });
  }
  return { y1, y2, sum: y1 + y2 };
}

/** Harmonic number: n for strings and open pipes; 2n − 1 for a pipe closed at one end (odd harmonics only). */
export function harmonicNumber(boundary, n) {
  return boundary === 'closed' ? 2 * n - 1 : n;
}

/** f = nv/2L (string, open pipe) or (2n − 1)v/4L (closed pipe). */
export function standingFrequency(boundary, n, L, v) {
  return boundary === 'closed' ? ((2 * n - 1) * v) / (4 * L) : (n * v) / (2 * L);
}

/** λ = 2L/n (string, open pipe) or 4L/(2n − 1) (closed pipe). */
export function standingWavelength(boundary, n, L) {
  return boundary === 'closed' ? (4 * L) / (2 * n - 1) : (2 * L) / n;
}

/**
 * Mode shape, peak 1. String: transverse displacement sin(nπx/L) (nodes at both fixed ends).
 * Open pipe: air displacement cos(nπx/L) (antinodes at both open ends). Closed pipe (closed at x = 0):
 * sin((2n − 1)πx/2L) (node at the closed end, antinode at the open end).
 */
export function standingShape(x, boundary, n, L) {
  if (boundary === 'open') return Math.cos((n * Math.PI * x) / L);
  if (boundary === 'closed') return Math.sin(((2 * n - 1) * Math.PI * x) / (2 * L));
  return Math.sin((n * Math.PI * x) / L);
}

/** Node and antinode positions (displacement) along 0 ≤ x ≤ L. */
export function standingNodes(boundary, n, L) {
  const nodes = [];
  const antinodes = [];
  if (boundary === 'string') {
    for (let k = 0; k <= n; k++) nodes.push((k * L) / n);
    for (let k = 0; k < n; k++) antinodes.push(((k + 0.5) * L) / n);
  } else if (boundary === 'open') {
    for (let k = 0; k < n; k++) nodes.push(((k + 0.5) * L) / n);
    for (let k = 0; k <= n; k++) antinodes.push((k * L) / n);
  } else {
    const h = 2 * n - 1;
    for (let k = 0; k < n; k++) nodes.push((2 * k * L) / h);
    for (let k = 0; k < n; k++) antinodes.push(((2 * k + 1) * L) / h);
  }
  return { nodes, antinodes };
}

/** Animation frequency for a standing wave (Hz): the same slow-down factor for every harmonic. */
export function standingDisplayFrequency(boundary, n) {
  return STANDING_DISPLAY_HZ * harmonicNumber(boundary, n);
}

// ---------------------------------------------------------------------------------------------
// Doppler effect (1D, source and observer on the x-axis, still air)
// Sign convention: v_s > 0 when the source moves towards the observer, v_o > 0 when the observer
// moves towards the source:  f′ = f (v + v_o) / (v − v_s).
// The source starts at x = −10 m moving along +x at v_s; the observer starts at x = +10 m moving
// along −x at v_o. The heard frequency uses the retarded (emission) time, so after the source
// passes the observer the pitch drops to the receding value.
// ---------------------------------------------------------------------------------------------

export function dopplerFrequency(f, v, vo, vs) {
  return (f * (v + vo)) / (v - vs);
}

export function sourceX(t, p) {
  return DOPPLER_SOURCE_X0 + p.sourceSpeed * t;
}

export function observerX(t, p) {
  return DOPPLER_OBSERVER_X0 - p.observerSpeed * t;
}

/**
 * Emission time t_e of the sound reaching the observer at time t, and the direction σ it travels
 * (+1 towards +x). Solves v(t − t_e) = σ(x_o(t) − x_s(t_e)); for a subsonic source exactly one σ works.
 */
export function emissionTime(t, p) {
  const v = p.soundSpeed;
  const xo = observerX(t, p);
  for (const sigma of [1, -1]) {
    const te = (v * t - sigma * (xo - DOPPLER_SOURCE_X0)) / (v - sigma * p.sourceSpeed);
    if (te <= t + 1e-12 && sigma * (xo - sourceX(te, p)) >= -1e-9) return { te, sigma };
  }
  return { te: t, sigma: 1 };
}

/** Frequency heard by the observer at time t (Hz). */
export function observedFrequency(t, p) {
  const { sigma } = emissionTime(t, p);
  const observerVelocity = -p.observerSpeed; // along +x
  return (p.sourceFrequency * (p.soundSpeed - sigma * observerVelocity)) / (p.soundSpeed - sigma * p.sourceSpeed);
}

/** Wavelength in front of and behind a moving source: (v ∓ |v_s|) / f. */
export function dopplerWavelengths(p) {
  const s = Math.abs(p.sourceSpeed);
  return { ahead: (p.soundSpeed - s) / p.sourceFrequency, behind: (p.soundSpeed + s) / p.sourceFrequency };
}

/**
 * Wave crests in the air at time t: every `every`-th crest (emitted at t_e = k/f), centred where the
 * source was at t_e, radius v(t − t_e) ≤ rMax. The source has been moving steadily since long before
 * t = 0, so the pattern is already established at the start.
 * @returns {{ te: number, x: number, r: number }[]} oldest first
 */
export function crestsAt(t, p, every, rMax) {
  const f = p.sourceFrequency;
  const v = p.soundSpeed;
  const K = Math.max(1, Math.round(every));
  const kHi = Math.floor((t * f) / K + 1e-9);
  const kLo = Math.ceil(((t - rMax / v) * f) / K - 1e-9);
  const list = [];
  for (let k = kLo; k <= kHi; k++) {
    const te = (k * K) / f;
    list.push({ te, x: sourceX(te, p), r: v * (t - te) });
  }
  return list;
}

/** Physical time at which the source or the observer leaves the view (Infinity if neither moves). */
export function dopplerEndTime(p) {
  const H = DOPPLER_HALF_WIDTH;
  const exits = [];
  if (p.sourceSpeed > 0) exits.push((H - DOPPLER_SOURCE_X0) / p.sourceSpeed);
  if (p.sourceSpeed < 0) exits.push((-H - DOPPLER_SOURCE_X0) / p.sourceSpeed);
  if (p.observerSpeed > 0) exits.push((DOPPLER_OBSERVER_X0 + H) / p.observerSpeed);
  if (p.observerSpeed < 0) exits.push((H - DOPPLER_OBSERVER_X0) / -p.observerSpeed);
  return exits.length ? Math.min(...exits) : Infinity;
}

// ---------------------------------------------------------------------------------------------
// Beats: y₁ = cos 2πf₁t, y₂ = cos 2πf₂t; y₁ + y₂ = 2 cos(πΔf t) cos(π(f₁ + f₂)t)
// ---------------------------------------------------------------------------------------------

export function beatFrequency(f1, f2) {
  return Math.abs(f1 - f2);
}

export function beatsValues(t, p) {
  const y1 = Math.cos(TWO_PI * p.toneFrequency1 * t);
  const y2 = Math.cos(TWO_PI * p.toneFrequency2 * t);
  return { y1, y2, sum: y1 + y2, envelope: Math.abs(2 * Math.cos(Math.PI * (p.toneFrequency1 - p.toneFrequency2) * t)) };
}

// ---------------------------------------------------------------------------------------------
// State, time and completion
// ---------------------------------------------------------------------------------------------

export const STATIC_SETUPS = ['interference'];

export function createState() {
  return { n: 0 };
}

/** Physical time (s) for the current step, per the setup's time scale (see the header). */
export function physicalTime(state, setup, p) {
  const ta = state.n * DT;
  if (setup === 'interference') return 0;
  if (setup === 'doppler-beats' && p.dopplerMode === 'doppler') return ta * DOPPLER_SLOW;
  if (setup === 'wave-machine' && p.waveType === 'standing') {
    const f = standingFrequency(p.boundary, p.harmonic, p.mediumLength, p.standingSpeed);
    return (ta * standingDisplayFrequency(p.boundary, p.harmonic)) / f;
  }
  return ta;
}

/** Number of fixed steps in the run, or Infinity for an endless one. */
export function totalSteps(setup, p) {
  if (setup === 'interference') return 0;
  if (setup === 'doppler-beats' && p.dopplerMode === 'doppler') {
    const end = dopplerEndTime(p);
    return Number.isFinite(end) ? Math.ceil(end / (DT * DOPPLER_SLOW) - 1e-6) : Infinity;
  }
  if (setup === 'wave-machine' && p.waveType === 'superposition' && p.superShape === 'pulses') {
    const end = (MACHINE_LENGTH - PULSE_STARTS[0] + 4 * PULSE_SIGMA) / p.waveSpeed;
    return Math.ceil(end / DT - 1e-6);
  }
  return Infinity;
}

/** Advance by up to `steps` fixed steps, stopping at the end of the run. Returns a new state. */
export function advance(state, setup, p, steps = 1) {
  if (STATIC_SETUPS.includes(setup)) return state;
  const n = Math.min(state.n + Math.max(0, Math.floor(steps)), totalSteps(setup, p));
  return { n };
}

export function isComplete(state, setup, p) {
  if (STATIC_SETUPS.includes(setup)) return true;
  return state.n >= totalSteps(setup, p);
}

// ---------------------------------------------------------------------------------------------
// Outputs (SI, unrounded) and data tables
// ---------------------------------------------------------------------------------------------

export function outputs(state, setup, p) {
  const t = physicalTime(state, setup, p);
  if (setup === 'interference') return interferenceOutputs(p);
  if (setup === 'modulation') {
    return {
      modIndex: modulationIndex(p),
      bandwidth: modulationBandwidth(p),
      upperSideband: p.carrierFrequency + p.messageFrequency,
      lowerSideband: p.carrierFrequency - p.messageFrequency,
      instantaneousFrequency: instantaneousFrequency(t, p),
      time: t,
    };
  }
  if (setup === 'wave-machine') {
    if (p.waveType === 'standing') {
      const f = standingFrequency(p.boundary, p.harmonic, p.mediumLength, p.standingSpeed);
      return {
        wavelength: standingWavelength(p.boundary, p.harmonic, p.mediumLength),
        period: 1 / f,
        waveFrequency: f,
        fundamental: standingFrequency(p.boundary, 1, p.mediumLength, p.standingSpeed),
        time: t,
      };
    }
    const periodic = !(p.waveType === 'superposition' && p.superShape === 'pulses');
    const f = p.waveType === 'superposition' ? p.frequency1 : p.frequency; // wave 1 for superposition
    return {
      wavelength: periodic ? p.waveSpeed / f : null,
      period: periodic ? 1 / f : null,
      waveFrequency: periodic ? f : null,
      fundamental: null,
      time: t,
    };
  }
  // doppler-beats
  if (p.dopplerMode === 'beats') {
    const fb = beatFrequency(p.toneFrequency1, p.toneFrequency2);
    return {
      observedFrequency: null,
      frequencyShift: null,
      wavelengthAhead: null,
      wavelengthBehind: null,
      beatFrequency: fb,
      beatPeriod: fb > 0 ? 1 / fb : null,
      averageFrequency: (p.toneFrequency1 + p.toneFrequency2) / 2,
      time: t,
    };
  }
  const f2 = observedFrequency(t, p);
  const { ahead, behind } = dopplerWavelengths(p);
  return {
    observedFrequency: f2,
    frequencyShift: f2 - p.sourceFrequency,
    wavelengthAhead: ahead,
    wavelengthBehind: behind,
    beatFrequency: null,
    beatPeriod: null,
    averageFrequency: null,
    time: t,
  };
}

function round9(v) {
  return Number(v.toFixed(9));
}

/** Evenly spaced times from t0 to t1 (at most `max` rows), always including t1. */
function times(t0, t1, interval, max = 5000) {
  const span = Math.max(0, t1 - t0);
  const step = Math.max(interval, span / max);
  const count = Math.floor(span / step + 1e-9);
  const out = [];
  for (let i = 0; i <= count; i++) out.push(t0 + i * step);
  if (!out.length || Math.abs(out[out.length - 1] - t1) > 1e-12) out.push(t1);
  return out;
}

/** Data table for CSV export: { columns, rows }. */
export function samples(state, setup, p) {
  const t = physicalTime(state, setup, p);
  if (setup === 'interference') {
    const g = apertureGeometry(p);
    const half = screenHalfWidth(p);
    const rows = [];
    for (let i = 0; i <= 1000; i++) {
      const y = -half + (2 * half * i) / 1000;
      const s = sinAtPosition(y, g.L);
      rows.push([y, Math.asin(s) / DEG, slitIntensity(s, g)]);
    }
    return { columns: ['y on screen (m)', 'θ (°)', 'I/I₀'], rows };
  }
  if (setup === 'modulation') {
    const rows = times(t - p.traceWindow, t, 1 / (20 * p.carrierFrequency)).map((tt) => [round9(tt), messageValue(tt, p), carrierValue(tt, p), modulatedValue(tt, p)]);
    return { columns: ['t (s)', 'message (V)', 'carrier (V)', `${p.modulation.toUpperCase()} signal (V)`], rows };
  }
  if (setup === 'wave-machine') {
    if (p.waveType === 'standing') {
      const ta = state.n * DT;
      const c = Math.cos(TWO_PI * standingDisplayFrequency(p.boundary, p.harmonic) * ta);
      const rows = [];
      for (let i = 0; i <= 200; i++) {
        const x = (p.mediumLength * i) / 200;
        const s = standingShape(x, p.boundary, p.harmonic, p.mediumLength);
        rows.push([x, s * c, Math.abs(s)]);
      }
      return { columns: ['x (m)', 'displacement (relative)', 'amplitude (relative)'], rows };
    }
    const rows = [];
    for (let i = 0; i <= 240; i++) {
      const x = (MACHINE_LENGTH * i) / 240;
      if (p.waveType === 'superposition') {
        const v = superpositionValues(x, t, p);
        rows.push([x, v.y1, v.y2, v.sum]);
      } else rows.push([x, travellingDisplacement(x, t, { amplitude: p.amplitude, frequency: p.frequency, speed: p.waveSpeed })]);
    }
    if (p.waveType === 'superposition') return { columns: ['x (m)', 'y₁ (m)', 'y₂ (m)', 'y₁ + y₂ (m)'], rows };
    return { columns: ['x (m)', p.waveType === 'longitudinal' ? 'displacement along x (m)' : 'y (m)'], rows };
  }
  if (p.dopplerMode === 'beats') {
    const rows = times(t - p.beatWindow, t, 1 / (10 * Math.max(p.toneFrequency1, p.toneFrequency2))).map((tt) => {
      const v = beatsValues(tt, p);
      return [round9(tt), v.y1, v.y2, v.sum, v.envelope];
    });
    return { columns: ['t (s)', 'y₁', 'y₂', 'y₁ + y₂', 'envelope'], rows };
  }
  const rows = times(0, t, 0.001).map((tt) => [round9(tt), sourceX(tt, p), observerX(tt, p), observedFrequency(tt, p)]);
  return { columns: ['t (s)', 'source x (m)', 'observer x (m)', 'heard frequency (Hz)'], rows };
}
