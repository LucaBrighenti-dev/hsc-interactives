// particle2d engine tests: analytic answers from guide §9.1 at the stated tolerances, plus a key-formula
// test for every setup. Every expected number comes from a formula written out here, never from running
// the engine and pasting the result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../../site/assets/engines/particle2d/model.js';
import { meta } from '../../site/assets/engines/particle2d/index.js';
import { defaultsFor } from '../../site/assets/state.js';

const { DT, createState, advance, outputs, isComplete, dataRows, dataColumns, EARTH, PARTICLES, C_LIGHT } = M;
const DEG = Math.PI / 180;

const params = (setup, over = {}) => ({ ...defaultsFor(meta.params, setup), ...over });
const start = (setup, over = {}, ov = {}) => createState(setup, params(setup, over), ov);
const run = (setup, over = {}, ov = {}, max = 200000) => advance(start(setup, over, ov), params(setup, over), max);
const rel = (actual, expected, tol, msg = '') =>
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg} expected ${expected} (±${tol * 100}%), got ${actual}`);
const close = (actual, expected, tol, msg = '') => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tol, `${msg} expected ${expected} (±${tol}), got ${actual}`);

// ---------------------------------------------------------------- §9.1 analytic tests

test('§9.1 projectile v = 20, θ = 45°, g = 9.8: range 40.816 m, H 10.204 m, T 2.886 s (0.1%)', () => {
  const st = run('projectile', { speed: 20, angle: 45, g: 9.8, drag: 'none', height: 0 });
  const o = outputs(st);
  assert.ok(isComplete(st));
  // R = v² sin 2θ / g = 400/9.8; H = v² sin²θ / 2g = 200/19.6; T = 2v sin θ / g
  rel(o.range, 40.816, 0.001, 'range');
  rel(o.maxHeight, 10.204, 0.001, 'max height');
  rel(o.flightTime, 2.886, 0.001, 'flight time');
  rel(o.range, 400 / 9.8, 0.001, 'range formula');
  rel(o.maxHeight, 200 / 19.6, 0.001, 'height formula');
  rel(o.flightTime, (2 * 20 * Math.sin(45 * DEG)) / 9.8, 0.001, 'time formula');
});

test('projectile events are interpolated inside a step, not taken at the step after', () => {
  const st = run('projectile', { speed: 20, angle: 45, g: 9.8, drag: 'none', height: 0 });
  const o = outputs(st);
  const T = (2 * 20 * Math.sin(45 * DEG)) / 9.8;
  // T / DT = 692.7…: the landing falls between steps. RK4 is exact for constant acceleration and the
  // Hermite interpolant is exact for a parabola, so the event lands on the analytic answer.
  assert.ok(Math.abs(T / DT - Math.round(T / DT)) > 0.1, 'test case lands between steps');
  rel(o.flightTime, T, 1e-9, 'flight time');
  rel(o.range, 400 / 9.8, 1e-9, 'range');
  rel(o.maxHeight, 200 / 19.6, 1e-9, 'apex');
  rel(o.timeToApex, T / 2, 1e-9, 'time to apex');
  rel(st.t, T, 1e-12, 'the run ends at the landing time');
  close(st.y[1], 0, 0, 'y is 0 at the end');
  const rows = dataRows(st);
  close(rows[rows.length - 1][0], T, 1e-9, 'last CSV row is the landing');
  // impact: same speed as launch, 45° below the horizontal
  rel(o.impactSpeed, 20, 1e-9, 'impact speed');
  rel(o.impactAngle, 45, 1e-9, 'impact angle');
});

test('projectile from a height: T = (v sin θ + √(v² sin² θ + 2gh))/g, impact speed √(v² + 2gh)', () => {
  const v = 15, th = 30 * DEG, h = 20, g = 9.8;
  const vy = v * Math.sin(th), vx = v * Math.cos(th);
  const T = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g;
  const o = outputs(run('projectile', { speed: v, angle: 30, height: h, g, drag: 'none' }));
  rel(o.flightTime, T, 1e-9, 'flight time');
  rel(o.range, vx * T, 1e-9, 'range');
  rel(o.maxHeight, h + (vy * vy) / (2 * g), 1e-9, 'max height above the ground');
  rel(o.impactSpeed, Math.sqrt(v * v + 2 * g * h), 1e-9, 'impact speed');
  rel(o.impactAngle, Math.atan(Math.sqrt(vy * vy + 2 * g * h) / vx) / DEG, 1e-9, 'impact angle');
});

test('projectile launched downward: the top is the launch point; launched into the ground: lands at once', () => {
  const o = outputs(run('projectile', { speed: 10, angle: -30, height: 10, g: 9.8 }));
  assert.equal(o.maxHeight, 10);
  assert.equal(o.timeToApex, 0);
  const st = start('projectile', { speed: 10, angle: -10, height: 0 });
  assert.ok(isComplete(st));
  assert.equal(outputs(st).range, 0);
});

test('projectile with linear drag matches x(t) = (vₓ₀/b)(1 − e^(−bt)), y(t) = h + ((v_y0 + g/b)/b)(1 − e^(−bt)) − gt/b', () => {
  const p = { speed: 20, angle: 45, height: 50, g: 9.8, drag: 'linear', k: 0.4, mass: 2 };
  const b = p.k / p.mass;
  const vx0 = 20 * Math.cos(45 * DEG), vy0 = 20 * Math.sin(45 * DEG);
  const st = advance(start('projectile', p), params('projectile', p), 240); // t = 1 s
  close(st.t, 1, 1e-12);
  const e = Math.exp(-b * 1);
  close(st.y[0], (vx0 / b) * (1 - e), 1e-8, 'x(1)');
  close(st.y[1], 50 + ((vy0 + 9.8 / b) / b) * (1 - e) - 9.8 / b, 1e-8, 'y(1)');
  close(st.y[2], vx0 * e, 1e-9, 'vx(1)');
});

test('projectile with quadratic drag: shorter, lower, and mechanical energy only falls', () => {
  const none = outputs(run('projectile', { speed: 30, angle: 45, drag: 'none' }));
  const st = start('projectile', { speed: 30, angle: 45, drag: 'quadratic', k: 0.02, mass: 1 });
  let last = Infinity;
  while (!isComplete(st)) {
    advance(st, null, 1);
    const [, y, vx, vy] = st.y;
    const E = 0.5 * (vx * vx + vy * vy) + 9.8 * y;
    assert.ok(E <= last + 1e-9, 'mechanical energy never rises');
    last = E;
  }
  const o = outputs(st);
  assert.ok(o.range < none.range && o.maxHeight < none.maxHeight);
  assert.ok(o.impactAngle > 45, 'drag makes the descent steeper');
});

test('§9.1 energy drift < 1e-4 over 10 s with no drag (projectile, SHM, orbit, track)', () => {
  // projectile with g = 1.6 flies 2·20·sin60°/1.6 = 21.7 s, so 10 s is all in flight
  const p = start('projectile', { speed: 20, angle: 60, g: 1.6, drag: 'none' });
  const Ep = (s) => 0.5 * (s.y[2] ** 2 + s.y[3] ** 2) + 1.6 * s.y[1];
  const p0 = Ep(p);
  advance(p, null, 2400);
  close(p.t, 10, 1e-9);
  assert.ok(Math.abs(Ep(p) - p0) / p0 < 1e-4, 'projectile');

  const s = start('shm', { amplitude: 1, springK: 4, mass: 1, duration: 10 });
  const Es = (q) => 0.5 * q.y[1] ** 2 + 0.5 * 4 * q.y[0] ** 2;
  const s0 = Es(s);
  advance(s, null, 2400);
  assert.ok(Math.abs(Es(s) - s0) / s0 < 1e-4, 'SHM');

  const o = start('orbit', {}, { GM: 1, R: 0.1, r0: 1, v0: 1.2, gamma: 0, m: 1, timeUnit: 1 });
  const Eo = (q) => 0.5 * (q.y[2] ** 2 + q.y[3] ** 2) - 1 / Math.hypot(q.y[0], q.y[1]);
  const o0 = Eo(o);
  advance(o, null, 2400);
  assert.ok(o.t >= 10 - 1e-9 || isComplete(o));
  assert.ok(Math.abs(Eo(o) - o0) / Math.abs(o0) < 1e-4, 'orbit');

  const k = start('track', { shape: 'valley', friction: 0, duration: 10 });
  const k0 = M.trackEnergy(k).total;
  advance(k, null, 2400);
  assert.ok(Math.abs(M.trackEnergy(k).total - k0) / k0 < 1e-4, 'track');
});

test('§9.1 SHM m = 1, k = 4: period π (0.1%)', () => {
  const st = run('shm', { amplitude: 1, springK: 4, mass: 1, phase: 0, duration: 10 });
  const o = outputs(st);
  rel(o.measuredPeriod, Math.PI, 0.001, 'measured from successive upward zero crossings');
  rel(o.period, Math.PI, 1e-12, 'T = 2π√(m/k)');
  assert.ok(st.ev.crossings.length >= 3);
});

test('SHM follows x = a cos(nt + α) and v² = n²(a² − x²)', () => {
  const a = 1.5, k = 9, m = 2, alpha = 30;
  const n = Math.sqrt(k / m);
  const st = start('shm', { amplitude: a, springK: k, mass: m, phase: alpha, duration: 10 });
  for (let i = 0; i < 5; i++) {
    advance(st, null, 300);
    const [x, v] = st.y;
    close(x, a * Math.cos(n * st.t + alpha * DEG), 1e-8, `x at t = ${st.t}`);
    close(v * v, n * n * (a * a - x * x), 1e-8, 'v² = n²(a² − x²)');
  }
  const o = outputs(st);
  rel(o.vMax, a * n, 1e-12, 'v max = an');
  rel(o.aMax, a * n * n, 1e-12, 'a max = an²');
});

test('§9.1 linear drag m = 1, k = 0.5: terminal velocity 19.6 m/s (0.5%)', () => {
  const st = run('resisted-1d', { direction: 'vertical', resistance: 'linear', resistK: 0.5, mass: 1, g: 9.8, v0: 0, duration: 20 });
  rel(-st.y[1], 19.6, 0.005, 'speed after 20 s of falling from rest');
  rel(outputs(st).terminalSpeed, 19.6, 1e-12, 'mg/k');
});

test('§9.1 quadratic drag m = 1, k = 0.1: terminal velocity 9.899 m/s (0.5%)', () => {
  const st = run('resisted-1d', { direction: 'vertical', resistance: 'quadratic', resistK: 0.1, mass: 1, g: 9.8, v0: 0, duration: 20 });
  rel(-st.y[1], 9.899, 0.005, 'speed after 20 s of falling from rest');
  rel(outputs(st).terminalSpeed, Math.sqrt(98), 1e-12, '√(mg/k)');
});

test('resisted motion upward: maximum height and time to it (linear and quadratic)', () => {
  const m = 1, k = 0.5, g = 9.8, v0 = 20;
  const lin = outputs(run('resisted-1d', { direction: 'vertical', resistance: 'linear', resistK: k, mass: m, g, v0, duration: 5 }));
  // linear: t = (m/k) ln(1 + kv₀/mg), H = (m/k)v₀ − (m²g/k²) ln(1 + kv₀/mg)
  const L = Math.log(1 + (k * v0) / (m * g));
  rel(lin.timeToMax, (m / k) * L, 1e-9, 'linear time to max');
  rel(lin.maxHeight, (m / k) * v0 - ((m * m * g) / (k * k)) * L, 1e-9, 'linear max height');
  const kq = 0.1;
  const q = outputs(run('resisted-1d', { direction: 'vertical', resistance: 'quadratic', resistK: kq, mass: m, g, v0, duration: 5 }));
  // quadratic: H = (m/2k) ln(1 + kv₀²/mg), t = √(m/gk) atan(v₀√(k/mg))
  rel(q.maxHeight, (m / (2 * kq)) * Math.log(1 + (kq * v0 * v0) / (m * g)), 1e-9, 'quadratic max height');
  rel(q.timeToMax, Math.sqrt(m / (g * kq)) * Math.atan(v0 * Math.sqrt(kq / (m * g))), 1e-9, 'quadratic time to max');
});

test('resisted motion horizontally: v = v₀e^(−kt/m) (linear), v = v₀/(1 + kv₀t/m) (quadratic)', () => {
  const m = 2, k = 0.5, v0 = 10, T = 10;
  const lin = run('resisted-1d', { direction: 'horizontal', resistance: 'linear', resistK: k, mass: m, v0, duration: T });
  close(lin.y[1], v0 * Math.exp((-k * T) / m), 1e-8, 'linear v');
  close(lin.y[0], ((m * v0) / k) * (1 - Math.exp((-k * T) / m)), 1e-8, 'linear x');
  rel(outputs(lin).limitDistance, (m * v0) / k, 1e-12, 'limit mv₀/k');
  const quad = run('resisted-1d', { direction: 'horizontal', resistance: 'quadratic', resistK: k, mass: m, v0, duration: T });
  close(quad.y[1], v0 / (1 + (k * v0 * T) / m), 1e-8, 'quadratic v');
  close(quad.y[0], (m / k) * Math.log(1 + (k * v0 * T) / m), 1e-8, 'quadratic x');
});

test('strong drag stays stable and accurate (adaptive sub-steps): quadratic m = 0.1, k = 2, v₀ = 60 gives x(1) = 0.05 ln 1201', () => {
  // Horizontal quadratic resistance: v = v₀/(1 + (k/m)v₀t), x = (m/k) ln(1 + (k/m)v₀t). With one RK4 step
  // of 1/240 s this case blows up to NaN within five steps ((k/m)|v| = 1200 per second).
  const p = { direction: 'horizontal', resistance: 'quadratic', resistK: 2, mass: 0.1, v0: 60, duration: 2 };
  const st = advance(start('resisted-1d', p), null, 240); // t = 1 s
  close(st.t, 1, 1e-12);
  rel(st.y[0], 0.05 * Math.log(1201), 1e-6, 'x(1)');
  rel(st.y[0], 0.354545491, 1e-6, 'x(1) = 0.354545491 m');
  rel(st.y[1], 60 / 1201, 1e-6, 'v(1)');
  // the same at the top of the v₀ slider (50 m/s)
  const top = advance(start('resisted-1d', { ...p, v0: 50 }), null, 240);
  rel(top.y[0], 0.05 * Math.log(1001), 1e-6, 'x(1) with v₀ = 50');
  // linear, k/m = 20: v = v₀e^(−20t)
  const lin = advance(start('resisted-1d', { ...p, resistance: 'linear', v0: 50 }), null, 24); // t = 0.1 s
  rel(lin.y[1], 50 * Math.exp(-2), 1e-6, 'linear v(0.1)');
  rel(lin.y[0], 2.5 * (1 - Math.exp(-2)), 1e-6, 'linear x(0.1) = (mv₀/k)(1 − e^(−kt/m))');
  // vertical, quadratic, thrown up at 50 m/s: H = (m/2k) ln(1 + kv₀²/mg)
  const up = outputs(run('resisted-1d', { direction: 'vertical', resistance: 'quadratic', resistK: 2, mass: 0.1, v0: 50, g: 9.8, duration: 3 }));
  rel(up.maxHeight, 0.025 * Math.log(1 + (20 * 2500) / 9.8), 1e-6, 'max height');
  rel(up.timeToMax, Math.sqrt(0.1 / (9.8 * 2)) * Math.atan(50 * Math.sqrt(2 / (0.1 * 9.8))), 1e-6, 'time to max');
});

test('drag settings at the corners of their ranges never produce NaN', () => {
  for (const drag of ['linear', 'quadratic']) {
    for (const k of [0.001, 2]) {
      for (const mass of [0.1, 10]) {
        for (const speed of [0, 60]) {
          const st = run('projectile', { drag, k, mass, speed, angle: 45, height: 100, g: 25 });
          assert.ok(isComplete(st), `projectile ${drag} k=${k} m=${mass} v=${speed} lands`);
          for (const [key, v] of Object.entries(outputs(st))) assert.ok(v === null || Number.isFinite(v), `projectile ${drag} ${key} = ${v}`);
        }
        for (const direction of ['vertical', 'horizontal']) {
          for (const v0 of [-50, 50]) {
            const st = run('resisted-1d', { resistance: drag, resistK: Math.max(k, 0.01), mass, v0, direction, g: 25, duration: 60 });
            for (const [key, v] of Object.entries(outputs(st))) assert.ok(v === null || Number.isFinite(v), `resisted ${drag} ${direction} ${key} = ${v}`);
          }
        }
      }
    }
  }
  // the strongest quadratic drag still loses mechanical energy monotonically
  const st = start('projectile', { speed: 60, angle: 45, drag: 'quadratic', k: 2, mass: 0.1, g: 9.8 });
  let last = Infinity;
  while (!isComplete(st)) {
    advance(st, null, 1);
    const E = 0.5 * (st.y[2] ** 2 + st.y[3] ** 2) + 9.8 * st.y[1];
    assert.ok(E <= last + 1e-9, 'energy only falls');
    last = E;
  }
});

test('§9.1 circular orbit GM = 1, r = 1, v = 1: period 2π (0.5%), radius within 0.1%', () => {
  const ov = { GM: 1, R: 0.1, r0: 1, v0: 1, gamma: 0, m: 1, timeUnit: 1 }; // dt = 1/240 in orbit units
  const st = start('orbit', {}, ov);
  let worst = 0;
  while (!isComplete(st)) {
    advance(st, null, 1);
    worst = Math.max(worst, Math.abs(Math.hypot(st.y[0], st.y[1]) - 1));
  }
  assert.equal(st.ev.end, 'orbit', 'one full revolution');
  rel(st.t, 2 * Math.PI, 0.005, 'period');
  assert.ok(worst < 1e-3, `radius stays within 0.1% (worst ${worst})`);
});

test('orbit around Earth: v = √(GM/r), T = 2π√(r³/GM); Kepler 2 and 3; escape and crash', () => {
  const r = EARTH.radius + 400e3;
  const v = Math.sqrt(EARTH.GM / r);
  const st = run('orbit', { altitude: 400, orbitSpeed: v / 1000, launchAngle: 0 });
  assert.equal(st.ev.end, 'orbit');
  rel(st.t, 2 * Math.PI * Math.sqrt(r ** 3 / EARTH.GM), 1e-6, 'period of a circular orbit');
  const o = outputs(st);
  rel(o.circularSpeed, v, 1e-12);
  rel(o.escapeSpeed, Math.sqrt((2 * EARTH.GM) / r), 1e-12);
  rel(o.keplerRatio, (4 * Math.PI * Math.PI) / EARTH.GM, 1e-6, 'T²/a³ = 4π²/GM');

  // an ellipse: areal velocity and total energy stay constant
  const e = start('orbit', { altitude: 400, orbitSpeed: 8.6, launchAngle: 5 });
  const a0 = outputs(e).arealVelocity;
  const E0 = outputs(e).totalEnergy;
  advance(e, null, 200000);
  assert.equal(e.ev.end, 'orbit');
  rel(outputs(e).arealVelocity, a0, 1e-9, 'equal areas in equal times');
  rel(outputs(e).totalEnergy, E0, 1e-6, 'energy');
  rel(e.y[5] / e.t, a0, 1e-6, 'area swept / time');

  assert.equal(run('orbit', { altitude: 400, orbitSpeed: (1.02 * Math.sqrt((2 * EARTH.GM) / r)) / 1000 }).ev.end, 'escape');
  const crash = run('orbit', { altitude: 400, orbitSpeed: 5 });
  assert.equal(crash.ev.end, 'crash');
  close(Math.hypot(crash.y[0], crash.y[1]), EARTH.radius, 1e-3, 'stops on the surface');
});

test('§9.1 charged particle m = q = 1, B = 2, v = 4: radius 2 (0.5%)', () => {
  const ov = { mode: 'magnetic', m: 1, q: 1, Bz: 2, v: 4, L: 10 };
  const st = start('charged', {}, ov);
  // B out of the page: q v × B points to −y at entry, so the centre is (0, −r)
  let worst = 0;
  while (!isComplete(st)) {
    advance(st, null, 1);
    worst = Math.max(worst, Math.abs(Math.hypot(st.y[0], st.y[1] + 2) - 2) / 2);
  }
  const o = outputs(st);
  assert.equal(st.ev.end, 'left', 'a semicircle back out of the field');
  rel(o.radius, 2, 1e-12, 'r = mv/qB');
  rel(o.exitSeparation / 2, 2, 0.005, 'measured radius (half the entry–exit distance)');
  assert.ok(worst < 0.005, `path stays on the circle (worst ${worst})`);
  rel(o.timeInField, Math.PI / 2, 0.005, 'half a period, πm/qB');
});

test('charged particles with real data: deflection ½(qE/m)(L/v)², proton radius, velocity selector', () => {
  const e = PARTICLES.electron;
  const p = { particle: 'electron', field: 'electric', entrySpeed: 20, voltage: 200, plateGap: 4, plateLength: 10 };
  const E = 200 / 0.04;
  const o = outputs(run('charged', p));
  assert.ok(o.deflection > 0, 'an electron is pulled toward the positive (top) plate');
  rel(o.deflection, 0.5 * ((Math.abs(e.charge) * E) / e.mass) * (0.1 / 2e7) ** 2, 1e-9, 'deflection');
  rel(o.timeInField, 0.1 / 2e7, 1e-9, 'time in field L/v');
  rel(o.fieldE, E, 1e-12, 'E = V/d');
  rel(o.workDone, Math.abs(e.charge) * E * o.deflection, 1e-6, 'work = qEy');

  const pr = PARTICLES.proton;
  const q = outputs(run('charged', { particle: 'proton', field: 'magnetic', entrySpeed: 1, bField: 100, plateLength: 30 }));
  const r = (pr.mass * 1e6) / (pr.charge * 0.1);
  rel(q.radius, r, 1e-12, 'r = mv/qB for a proton');
  rel(q.exitSeparation, 2 * r, 1e-6, 'exits 2r from the entry point');

  // velocity selector: E/B = 5000 / 2.5e-4 = 2.0e7 m/s, so a 2.0e7 m/s electron goes straight through
  const sel = run('charged', { particle: 'electron', field: 'selector', entrySpeed: 20, voltage: 200, plateGap: 4, plateLength: 10, bField: 0.25, bDirection: 'into' });
  const so = outputs(sel);
  rel(so.selectorSpeed, 2e7, 1e-12, 'E/B');
  assert.equal(sel.ev.end, 'right');
  close(so.deflection, 0, 1e-9, 'undeflected');
});

test('§9.1 braking v₀ = 20, μ = 0.7, g = 10: braking distance 28.571 m (0.5%)', () => {
  const st = run('braking', { speed: 20, mu: 0.7, g: 10, reactionTime: 0 });
  const o = outputs(st);
  rel(o.brakingDistance, 28.571, 0.005, 'braking distance');
  rel(o.brakingDistance, 400 / 14, 1e-9, 'v²/2μg (event is exact)');
  rel(o.stoppingTime, 20 / 7, 1e-9, 't = v/μg');
});

test('braking: reaction distance, work done by friction = ½mv², rotor heating ΔT = KE/(mc)', () => {
  const p = { speed: 25, mu: 0.8, g: 9.8, reactionTime: 1.5, carMass: 1200, rotorMass: 24, rotorHeat: 449 };
  const o = outputs(run('braking', p));
  rel(o.reactionDistance, 25 * 1.5, 1e-12, 'reaction distance vt');
  rel(o.brakingDistance, (25 * 25) / (2 * 0.8 * 9.8), 1e-9, 'braking distance');
  rel(o.stoppingDistance, 25 * 1.5 + (25 * 25) / (2 * 0.8 * 9.8), 1e-9, 'stopping distance');
  rel(o.stoppingTime, 1.5 + 25 / (0.8 * 9.8), 1e-9, 'stopping time');
  const KE = 0.5 * 1200 * 25 * 25;
  rel(o.frictionWork, KE, 1e-9, 'all the kinetic energy');
  rel(o.rotorTempRise, KE / (24 * 449), 1e-9, 'ΔT = Q/(mc)');
  close(o.kineticEnergy, 0, 1e-9);
});

test('§9.1 1D elastic collision of equal masses swaps velocities (1e-9)', () => {
  const st = run('collisions', { dimension: '1d', m1: 1, m2: 1, u1: 2, u2: -1, restitution: 1 });
  const o = outputs(st);
  close(o.vA, -1, 1e-9, 'A takes B’s velocity');
  close(o.vB, 2, 1e-9, 'B takes A’s velocity');
  // centres start 3 m apart and touch at 2R = 0.5 m: contact after 2.5/(u₁ − u₂) s
  close(o.collisionTime, 2.5 / 3, 1e-12, 'contact time');
});

test('collisions: momentum conserved, v₁′ and v₂′ formulas, KE lost = ½μ(1 − e²)(u₁ − u₂)², e = 0 sticks', () => {
  const m1 = 2, m2 = 1, u1 = 3, u2 = -1, e = 0.6;
  const o = outputs(run('collisions', { dimension: '1d', m1, m2, u1, u2, restitution: e }));
  const P = m1 * u1 + m2 * u2;
  close(o.vA, (P - m2 * e * (u1 - u2)) / (m1 + m2), 1e-12, "v₁'");
  close(o.vB, (P + m1 * e * (u1 - u2)) / (m1 + m2), 1e-12, "v₂'");
  close(o.pTotal, P, 1e-12, 'momentum');
  close(o.keLost, 0.5 * ((m1 * m2) / (m1 + m2)) * (1 - e * e) * (u1 - u2) ** 2, 1e-12, 'KE lost');
  close(o.impulse, ((1 + e) * (u1 - u2)) / (1 / m1 + 1 / m2), 1e-12, 'impulse');
  const stick = outputs(run('collisions', { dimension: '1d', m1, m2, u1, u2, restitution: 0 }));
  close(stick.vA, P / (m1 + m2), 1e-12);
  close(stick.vB, P / (m1 + m2), 1e-12);
});

test('2D elastic collision of equal masses (B at rest): the pucks leave at right angles', () => {
  const o = outputs(run('collisions', { dimension: '2d', m1: 1, m2: 1, u1: 2, u2: 0, restitution: 1, offset: 0.2 }));
  close(o.vA * o.vB + o.vAy * o.vBy, 0, 1e-9, 'v_A · v_B = 0');
  close(o.keTotal, 0.5 * 1 * 4, 1e-12, 'KE conserved');
  close(o.pTotal, 2, 1e-12);
  close(o.pTotalY, 0, 1e-12);
  // B moves along the line of centres at contact: sin φ = b/2R
  close(Math.abs(o.angleB), Math.asin(0.2 / 0.5) / DEG, 1e-9, 'direction of B');
});

test('circular: banked-track forces (design speed, equilibrium, friction limits)', () => {
  const c = { mass: 1500, radius: 50, bank: 15 * DEG, g: 9.8, mu: 0.7 };
  const v0 = Math.sqrt(50 * 9.8 * Math.tan(15 * DEG));
  const at = M.bankedForces({ ...c, speed: v0 });
  close(at.f, 0, 1e-9, 'no friction needed at the design speed');
  rel(at.N, (1500 * 9.8) / Math.cos(15 * DEG), 1e-12, 'N = mg/cos θ');
  for (const speed of [5, 20, 30]) {
    const F = M.bankedForces({ ...c, speed });
    const s = Math.sin(c.bank), co = Math.cos(c.bank);
    rel(F.N * s + F.f * co, (1500 * speed * speed) / 50, 1e-12, 'horizontal: N sin θ + f cos θ = mv²/r');
    rel(F.N * co - F.f * s, 1500 * 9.8, 1e-12, 'vertical: N cos θ − f sin θ = mg');
  }
  const top = M.bankedForces({ ...c, speed: at.vMax });
  rel(top.f, 0.7 * top.N, 1e-9, 'at v max, friction is μN');
  const o = outputs(start('circular', { circularMode: 'track', radius: 50, speed: v0, bankAngle: 15, g: 9.8 }));
  rel(o.designSpeed, v0, 1e-12);
});

test('circular: uniform motion returns after T = 2πr/v; a cut string sends the mass along the tangent', () => {
  const r = 2, v = 3;
  const T = (2 * Math.PI * r) / v;
  const st = start('circular', { circularMode: 'string', radius: r, speed: v, releaseAfter: 0, duration: 10 });
  const steps = Math.round(T / DT);
  advance(st, null, steps);
  // T is not a whole number of steps; compare with the analytic position at the step time
  const ang = (v / r) * st.t;
  close(st.y[0], r * Math.cos(ang), 1e-6, 'x on the circle');
  close(st.y[1], r * Math.sin(ang), 1e-6, 'y on the circle');
  rel(Math.hypot(st.y[0], st.y[1]), r, 1e-9, 'radius');
  rel(outputs(st).centripetalForce, (1 * v * v) / r, 1e-12, 'F = mv²/r');

  const cut = start('circular', { circularMode: 'string', radius: r, speed: v, releaseAfter: 1, mass: 1, duration: 10 });
  advance(cut, null, 480); // t = 2 s
  const a1 = v / r; // angle at release
  const rx = r * Math.cos(a1), ry = r * Math.sin(a1);
  const vx = -v * Math.sin(a1), vy = v * Math.cos(a1);
  close(cut.y[0], rx + vx * 1, 1e-6, 'x one second after release');
  close(cut.y[1], ry + vy * 1, 1e-6, 'y one second after release');
  const tq = outputs(start('circular', { circularMode: 'torque', force: 100, leverArm: 0.3, forceAngle: 30 }));
  rel(tq.torque, 0.3 * 100 * Math.sin(30 * DEG), 1e-12, 'τ = rF sin θ');
});

test('cart: s = x₀ + ut + ½at², and the graph-matching targets', () => {
  const st = run('cart', { cartMode: 'uniform', x0: -2, u: 1.5, accel: -0.4, duration: 10 });
  close(st.y[0], -2 + 1.5 * 10 + 0.5 * -0.4 * 100, 1e-9, 's(10)');
  close(st.y[1], 1.5 - 0.4 * 10, 1e-9, 'v(10)');
  // turn-back: +0.75 for 2 s, coast 2 s, −0.75 for 4 s, coast: x(10) = 1.5 + 3 + 0 − 3 = 1.5 m, v = −1.5 m/s
  const tb = M.cartTarget('turn-back', 10);
  close(tb.x, 1.5, 1e-12);
  close(tb.v, -1.5, 1e-12);
  // driving the throttle exactly along the target gives zero match error
  const m = start('cart', { cartMode: 'match', challenge: 'turn-back', duration: 10 });
  while (!isComplete(m)) {
    m.throttle = M.cartTarget('turn-back', m.t + DT / 2).a;
    advance(m, null, 1);
  }
  close(m.y[0], 1.5, 1e-9, 'followed the target');
  close(outputs(m).matchError, 0, 1e-9, 'RMS error');
});

test('orbits and GPS: GEO and GPS radii from Kepler 3, a geostationary satellite stays above its point', () => {
  const st = start('orbit-gps', { altitude: 400, receiverAngle: 30, clockError: 0 });
  const o = outputs(st);
  // r = ∛(GM T²/4π²): GEO with T = one sidereal day; GPS with half a sidereal day
  rel(o.geoAltitudeKm + 6371, 42164, 0.001, 'GEO radius ≈ 42 164 km');
  rel(o.gpsAltitudeKm + 6371, 26560, 0.001, 'GPS radius ≈ 26 560 km (IS-GPS-200 nominal)');
  rel(o.leoPeriod, 2 * Math.PI * Math.sqrt((6371e3 + 400e3) ** 3 / EARTH.GM), 1e-12, 'LEO period');
  close(o.positionError, 0, 1e-3, 'exact ranges give the exact position');
  advance(st, null, 200000);
  assert.ok(isComplete(st));
  rel(st.t, EARTH.siderealDay, 1e-12, 'one sidereal day');
  const geoAngle = Math.atan2(st.y[9], st.y[8]);
  const rx = M.gpsReceiver(st);
  close(Math.abs(Math.atan2(Math.sin(geoAngle - Math.atan2(rx[1], rx[0])), Math.cos(geoAngle - Math.atan2(rx[1], rx[0])))), 0, 1e-6, 'GEO still overhead');
  const fix = M.gpsFix(start('orbit-gps', { clockError: 100 }));
  assert.equal(fix.used.length, 3, 'three satellites above the horizon');
  rel(outputs(start('orbit-gps', { clockError: 100 })).rangeError, C_LIGHT * 100e-9, 1e-12, 'c × 100 ns ≈ 30 m');
  assert.ok(fix.error > 1, 'a clock error moves the fix');
});

test('trilateration recovers a point from three exact ranges', () => {
  const centres = [[2.0e7, 1.0e7], [-1.5e7, 2.2e7], [0.5e7, 2.6e7]];
  const p = [3.2e6, 5.4e6];
  const ranges = centres.map((c) => Math.hypot(c[0] - p[0], c[1] - p[1]));
  const s = M.trilaterate(centres, ranges);
  close(s[0], p[0], 1e-6);
  close(s[1], p[1], 1e-6);
});

test('relative velocity: crossing time W/(v cos θ), drift (u − v sin θ)t; plane ground velocity = air + wind', () => {
  const vb = 3, th = 20, u = 1.5, W = 100;
  const o = outputs(run('relative-velocity', { scenario: 'boat', boatSpeed: vb, heading: th, current: u, riverWidth: W }));
  const T = W / (vb * Math.cos(th * DEG));
  rel(o.crossingTime, T, 1e-9, 'crossing time');
  close(o.drift, (u - vb * Math.sin(th * DEG)) * T, 1e-9, 'drift downstream');
  rel(o.headingForStraight, Math.asin(u / vb) / DEG, 1e-12, 'sin θ = u/v');
  const straight = outputs(run('relative-velocity', { scenario: 'boat', boatSpeed: 3, heading: 30, current: 1.5, riverWidth: 100 }));
  close(straight.drift, 0, 1e-9, 'heading 30° upstream into a 1.5 m/s current at 3 m/s lands opposite');

  const pl = outputs(run('relative-velocity', { scenario: 'plane', airspeed: 300, bearing: 0, windSpeed: 60, windBearing: 90, flightTime: 1 }));
  rel(pl.groundSpeedKmh, Math.hypot(300, 60), 1e-12, 'ground speed');
  rel(pl.groundDirection, Math.atan(60 / 300) / DEG, 1e-12, 'track bearing');
  rel(pl.distance, Math.hypot(300, 60) * 1000, 1e-9, 'distance after 1 h');
  rel(pl.driftAngle, Math.atan(60 / 300) / DEG, 1e-12, 'drift angle');
});

test('roller track: KE + GPE + work against friction stays equal to the starting energy', () => {
  for (const shape of ['valley', 'hills', 'ramp']) {
    const st = start('track', { shape, trackHeight: 5, friction: 0.1, mass: 2, g: 9.8, duration: 30 });
    const E0 = M.trackEnergy(st).total;
    rel(E0, 2 * 9.8 * 5, 1e-12, 'starts at rest at height H');
    advance(st, null, 200000);
    rel(M.trackEnergy(st).total, E0, 1e-6, `${shape}: energy accounted for`);
  }
});

test('roller track: braking on the runway d = v²/(2μg); too steep for friction to hold; N at the valley bottom', () => {
  const mu = 0.2, g = 9.8;
  const st = run('track', { shape: 'ramp', trackHeight: 5, friction: mu, g, duration: 60 });
  assert.equal(st.ev.end, 'stopped');
  const vJoin = st.ev.join.v;
  rel(st.y[0] - M.TRACK_LENGTH, (vJoin * vJoin) / (2 * mu * g), 1e-6, 'stopping distance on the flat');
  // released from rest, the cart moves only if μ < |tan φ| at the top: the valley's rim slope is 4H/L = 1;
  // the ramp's top slope is πH/2L = 0.3927 for H = 5
  assert.ok(!isComplete(start('track', { shape: 'valley', trackHeight: 5, friction: 0.5 })), 'μ = 0.5 < 1 slides');
  assert.ok(!isComplete(start('track', { shape: 'ramp', trackHeight: 5, friction: 0.39 })), 'μ = 0.39 < 0.3927 slides');
  assert.ok(isComplete(start('track', { shape: 'ramp', trackHeight: 5, friction: 0.4 })), 'μ = 0.4 > 0.3927 holds');
  // N at the bottom of the valley: m(g + v²κ), v² = 2gH, κ = y″ = 8H/L²
  const H = 5, L = M.TRACK_LENGTH;
  const b = start('track', { shape: 'valley', trackHeight: H, friction: 0, mass: 1, g });
  b.y = [L / 2, Math.sqrt(2 * g * H), 0];
  rel(outputs(b).normalForce, g + 2 * g * H * ((8 * H) / (L * L)), 1e-12, 'normal force');
});

test('a 90° launch goes straight up and down: vₓ = 0 exactly, R = 0, T = 2v/g, H = v²/2g', () => {
  const st = run('projectile', { speed: 15, angle: 90, g: 9.8, drag: 'none', height: 0 });
  const o = outputs(st);
  assert.equal(o.vx, 0);
  assert.equal(o.range, 0);
  rel(o.flightTime, (2 * 15) / 9.8, 1e-9);
  rel(o.maxHeight, (15 * 15) / (2 * 9.8), 1e-9);
  assert.equal(outputs(start('circular', { circularMode: 'torque', forceAngle: 180 })).torque, 0, 'sin 180° is exactly 0');
});

test('conserved quantities do not show rounding noise: 2D total y-momentum and KE lost are exactly 0 when elastic', () => {
  const o = outputs(run('collisions', { dimension: '2d', m1: 1.3, m2: 0.7, u1: 2.2, u2: -0.4, restitution: 1, offset: 0.3 }));
  assert.equal(o.pTotalY, 0);
  assert.equal(o.keLost, 0);
});

test('GPS fix with a clock error is the least-squares point: no nearby point fits the three ranges better', () => {
  const st = start('orbit-gps', { clockError: 250 });
  const fix = M.gpsFix(st);
  const cost = (p) => fix.used.reduce((s, u) => s + (Math.hypot(p[0] - u.pos[0], p[1] - u.pos[1]) - u.pseudo) ** 2, 0);
  const c0 = cost(fix.solution);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7]]) {
    assert.ok(cost([fix.solution[0] + dx, fix.solution[1] + dy]) >= c0, `moving by (${dx}, ${dy}) m does not reduce the misfit`);
  }
  assert.ok(fix.error > 10, 'a 250 ns error (75 m of range) moves the fix by tens of metres');
});

test('cart throttle is clamped to ±2 m/s² and drives the acceleration', () => {
  const st = start('cart', { cartMode: 'drive', x0: 0, u: 0, duration: 10 });
  st.throttle = 5;
  advance(st, null, 240);
  close(st.y[1], 2, 1e-9, 'v after 1 s at the 2 m/s² limit');
  close(st.y[0], 1, 1e-9, 'x = ½at²');
});

// ---------------------------------------------------------------- engine-wide checks

test('every setup completes with its defaults inside the acceptance runner’s 200 000 steps', () => {
  for (const setup of meta.setups) {
    const st = run(setup, {}, {}, 200000);
    assert.ok(isComplete(st), `${setup} completes`);
    for (const [k, v] of Object.entries(outputs(st))) {
      assert.ok(v === null || Number.isFinite(v), `${setup}.${k} is a number or null (got ${v})`);
      assert.ok(k in meta.outputs, `${setup}.${k} is declared in meta.outputs`);
      assert.ok(!meta.outputs[k].setups || meta.outputs[k].setups.includes(setup), `${setup}.${k} lists the setup`);
    }
  }
});

test('every declared output exists for its setups', () => {
  for (const setup of meta.setups) {
    const o = outputs(start(setup));
    for (const [k, spec] of Object.entries(meta.outputs)) {
      if (!spec.setups || spec.setups.includes(setup)) assert.ok(k in o, `${setup} is missing output ${k}`);
    }
  }
});

test('data: rows start at t = 0, end at the current time, and match the columns', () => {
  for (const setup of meta.setups) {
    const st = run(setup);
    const rows = dataRows(st);
    const cols = dataColumns(setup);
    assert.equal(rows[0][0], 0, `${setup} starts at 0`);
    assert.equal(rows[rows.length - 1][0], st.t, `${setup} ends now`);
    for (const r of rows) assert.equal(r.length, cols.length, `${setup} row width`);
    for (let i = 1; i < rows.length; i++) assert.ok(rows[i][0] >= rows[i - 1][0], `${setup} rows in time order`);
    assert.match(cols[0], /^t \(s\)$/);
    for (const c of cols) assert.match(c, /\(.+\)$/, `${setup} column "${c}" has a unit`);
  }
});

test('deterministic: the same params give the same run', () => {
  for (const setup of meta.setups) {
    const a = outputs(run(setup));
    const b = outputs(run(setup));
    assert.deepEqual(a, b, setup);
  }
});
