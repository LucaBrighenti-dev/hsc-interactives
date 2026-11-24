// Reference engine tests: analytic answers for y = A sin(2πft + φ) (guide W0-06).
// Engine builders: copy this file's shape. Every expected number comes from a formula, never from
// running the code and pasting the result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DT, period, displacement, velocity, createState, advance, isComplete, outputs, samples, totalSteps } from '../../site/assets/engines/demo/model.js';

const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);

test('period is exactly 1/f', () => {
  assert.equal(period(0.5), 2);
  assert.equal(period(2), 0.5);
  assert.equal(period(3), 1 / 3);
});

test('displacement at known times', () => {
  const p = { amplitude: 2, frequency: 0.5, phase: 30 };
  // y(0) = 2 sin 30° = 1
  close(displacement(0, p), 1, 1e-12, 'y(0)');
  // y(1) = 2 sin(2π·0.5·1 + π/6) = 2 sin(7π/6) = −1
  close(displacement(1, p), -1, 1e-12, 'y(1)');
  // Quarter period with φ = 0: y(T/4) = A
  const q = { amplitude: 3, frequency: 0.25, phase: 0 };
  close(displacement(period(0.25) / 4, q), 3, 1e-12, 'y(T/4)');
  // One full period later, the same displacement
  close(displacement(0.7 + period(0.5), p), displacement(0.7, p), 1e-12, 'periodic');
});

test('velocity: v(0) = 2πfA when φ = 0, and zero at the top of the swing', () => {
  const p = { amplitude: 2, frequency: 0.5, phase: 0 };
  close(velocity(0, p), 2 * Math.PI * 0.5 * 2, 1e-12, 'v(0)');
  close(velocity(period(0.5) / 4, p), 0, 1e-12, 'v(T/4)');
});

test('fixed steps: time is n·DT and the run stops exactly at its duration', () => {
  const params = { amplitude: 2, frequency: 0.5, phase: 30, duration: 1 };
  assert.equal(totalSteps(params), 240);
  let s = createState();
  for (let i = 0; i < 100; i++) s = advance(s, params, 1);
  assert.equal(s.n, 100);
  close(s.t, 100 * DT, 1e-15);
  s = advance(s, params, 10_000);
  assert.equal(s.n, 240, 'stops at the end of the run');
  assert.ok(isComplete(s, params));
  close(s.t, 1, 1e-12);
  close(outputs(s, params).y, -1, 1e-9, 'y at the end of a 1 s run');
});

test('deterministic: same params, same outputs', () => {
  const params = { amplitude: 1.3, frequency: 1.7, phase: -45, duration: 5 };
  const a = advance(createState(), params, 777);
  const b = advance(createState(), params, 777);
  assert.deepEqual(outputs(a, params), outputs(b, params));
});

test('samples run from t = 0 to the current time', () => {
  const params = { amplitude: 2, frequency: 0.5, phase: 0, duration: 10 };
  const s = advance(createState(), params, 61); // t = 61/240 s, not a multiple of the interval
  const rows = samples(s, params, 0.05);
  assert.equal(rows[0][0], 0);
  close(rows[rows.length - 1][0], s.t, 1e-9);
  assert.equal(rows[0].length, 3);
  close(rows[2][1], displacement(0.1, params), 1e-12);
});
