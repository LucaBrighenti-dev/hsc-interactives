// Reference engine model: y = A sin(2πft + φ).
// The golden example for engine builders (guide W0-06). Pure: no DOM, no timers, no randomness.
// Importable in Node: tests/engines/demo.test.mjs checks it against analytic answers.
//
// State is advanced in whole fixed steps of DT, and time is computed as n·DT (never accumulated
// as t += DT), so the clock does not drift and results are exactly reproducible.

export const DT = 1 / 240; // s, fixed simulation step

const DEG = Math.PI / 180;

/** Period T = 1/f (s). */
export function period(frequency) {
  return 1 / frequency;
}

/** Angular frequency ω = 2πf (rad/s). */
export function angularFrequency(frequency) {
  return 2 * Math.PI * frequency;
}

/** Displacement y(t) = A sin(2πft + φ), φ in degrees. */
export function displacement(t, { amplitude, frequency, phase }) {
  return amplitude * Math.sin(angularFrequency(frequency) * t + phase * DEG);
}

/** Velocity dy/dt = 2πfA cos(2πft + φ). */
export function velocity(t, { amplitude, frequency, phase }) {
  const w = angularFrequency(frequency);
  return amplitude * w * Math.cos(w * t + phase * DEG);
}

/** Number of fixed steps in the run. */
export function totalSteps({ duration }) {
  return Math.round(duration / DT);
}

export function createState() {
  return { n: 0, t: 0 };
}

/** Advance by up to `steps` fixed steps, stopping at the end of the run. Returns a new state. */
export function advance(state, params, steps = 1) {
  const n = Math.min(state.n + Math.max(0, Math.floor(steps)), totalSteps(params));
  return { n, t: n * DT };
}

export function isComplete(state, params) {
  return state.n >= totalSteps(params);
}

/** Outputs in SI units, unrounded. */
export function outputs(state, params) {
  return {
    period: period(params.frequency),
    y: displacement(state.t, params),
    v: velocity(state.t, params),
    t: state.t,
  };
}

/**
 * Table of samples from t = 0 to the current time, every `interval` seconds, always ending at
 * the current time.
 */
export function samples(state, params, interval = 0.05) {
  const rows = [];
  const count = Math.floor(state.t / interval + 1e-9);
  for (let i = 0; i <= count; i++) {
    const t = i * interval;
    rows.push([round(t), displacement(t, params), velocity(t, params)]);
  }
  if (rows.length === 0 || Math.abs(rows[rows.length - 1][0] - state.t) > 1e-9) {
    rows.push([round(state.t), displacement(state.t, params), velocity(state.t, params)]);
  }
  return rows;
}

function round(t) {
  return Number(t.toFixed(9));
}
