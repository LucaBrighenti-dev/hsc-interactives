// space3d engine tests: analytic answers for the pure geometry in model.js (guide §9.1).
// Every expected number comes from a formula or a hand calculation written beside it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEG, add, sub, scale, dot, cross, length, angleBetween, scalarProjection, projection,
  integrate, discSlices, revolution, revolutionOutputs,
  bearingOf, pointOnBearing, bearingDifference, towerScene, cuboidScene, rampScene, pyramidScene, trig3dScene, trig3dOutputs,
  vectorScene, vectorOutputs,
  relateLines, lineSphere, clipLine, linesScene, linesOutputs, RELATION,
  polygonArea, PARTS, partVolume, viewAreas, insidePart, occluded, projectView, viewPlacement, orthographicScene, orthographicOutputs,
  auxiliaryView, descriptiveLine, descriptiveFace, descriptiveOutputs,
} from '../../site/assets/engines/space3d/model.js';

const close = (actual, expected, tol, msg = '') => assert.ok(Math.abs(actual - expected) <= tol, `${msg} expected ${expected}, got ${actual}`);
const rel = (actual, expected, r, msg = '') => close(actual, expected, Math.abs(expected) * r, msg);
const close3 = (a, b, tol, msg = '') => a.forEach((v, i) => close(v, b[i], tol, `${msg}[${i}]`));

// ── vec3: dot, cross and projection identities ───────────────────────────────────────────────────

test('dot product: (1, 2, 3)·(4, 5, 6) = 4 + 10 + 18 = 32, and it is symmetric', () => {
  assert.equal(dot([1, 2, 3], [4, 5, 6]), 32);
  assert.equal(dot([4, 5, 6], [1, 2, 3]), 32);
  assert.equal(dot([1, 0, 0], [0, 1, 0]), 0);
});

test('cross product: i × j = k, j × k = i, k × i = j, and a × b = −(b × a)', () => {
  assert.deepEqual(cross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
  assert.deepEqual(cross([0, 1, 0], [0, 0, 1]), [1, 0, 0]);
  assert.deepEqual(cross([0, 0, 1], [1, 0, 0]), [0, 1, 0]);
  const a = [1, -2, 3];
  const b = [4, 0, -1];
  // (−2)(−1) − 3·0 = 2; 3·4 − 1·(−1) = 13; 1·0 − (−2)·4 = 8
  assert.deepEqual(cross(a, b), [2, 13, 8]);
  assert.deepEqual(cross(b, a), [-2, -13, -8]);
});

test('cross product identities: a × b is perpendicular to a and b; |a × b|² + (a·b)² = |a|²|b|²', () => {
  const cases = [
    [[1, 2, 3], [4, 5, 6]],
    [[-2.5, 0.5, 7], [3, -1, 2]],
    [[1, 1, 0], [2, 2, 0]], // parallel: a × b = 0
  ];
  for (const [a, b] of cases) {
    const n = cross(a, b);
    close(dot(n, a), 0, 1e-12, 'n·a');
    close(dot(n, b), 0, 1e-12, 'n·b');
    close(dot(n, n) + dot(a, b) ** 2, dot(a, a) * dot(b, b), 1e-9, 'Lagrange identity');
  }
});

test('projection identities: proj_b a is parallel to b, a − proj_b a is perpendicular to b, |proj| = |a·b|/|b|', () => {
  const a = [3, 4, 0];
  const b = [4, 0, 0];
  // (12/16)(4, 0, 0) = (3, 0, 0)
  assert.deepEqual(projection(a, b), [3, 0, 0]);
  assert.equal(scalarProjection(a, b), 3);
  for (const [p, q] of [[[1, 2, 2], [2, -1, 2]], [[-1, 5, 2], [0.5, 3, -4]]]) {
    const pr = projection(p, q);
    close(length(cross(pr, q)), 0, 1e-12, 'parallel to b');
    close(dot(sub(p, pr), q), 0, 1e-12, 'remainder perpendicular to b');
    close(length(pr), Math.abs(dot(p, q)) / length(q), 1e-12, '|proj|');
    close(scalarProjection(p, q), dot(p, q) / length(q), 1e-12, 'scalar projection');
  }
  // projection onto the zero vector is undefined
  assert.ok(projection([1, 2, 3], [0, 0, 0]).every(Number.isNaN));
});

test('angle between vectors: (1, 0, 0) and (1, 1, 0) is 45°; perpendicular is 90°; opposite is 180°', () => {
  close(angleBetween([1, 0, 0], [1, 1, 0]) / DEG, 45, 1e-12);
  close(angleBetween([2, 1, -1], [1, -1, 1]) / DEG, 90, 1e-12); // a·b = 2 − 1 − 1 = 0
  close(angleBetween([1, 2, 3], [-2, -4, -6]) / DEG, 180, 1e-12);
  assert.ok(Number.isNaN(angleBetween([0, 0, 0], [1, 0, 0])));
});

// ── vectors setup ────────────────────────────────────────────────────────────────────────────────

test('vectors: a = (1, 2, 2), b = (2, −1, 2): |a| = |b| = 3, a·b = 4, θ = cos⁻¹(4/9), scalar projection 4/3', () => {
  const v = vectorOutputs(vectorScene({ dimension: '3d', ax: 1, ay: 2, az: 2, bx: 2, by: -1, bz: 2, operation: 'dot' }));
  close(v.magA, 3, 1e-12);
  close(v.magB, 3, 1e-12);
  close(v.dot, 4, 1e-12);
  rel(v.angle, Math.acos(4 / 9) / DEG, 1e-12, 'θ');
  close(v.scalarProjection, 4 / 3, 1e-12);
  assert.ok(v.resultX === null && v.resultMag === null, 'dot has no result vector (null: the readout shows —)');
});

test('vectors: add, subtract, scale and project give the component formulas', () => {
  const base = { dimension: '3d', ax: 3, ay: 4, az: 0, bx: 1, by: -2, bz: 2, scalar: -1.5 };
  let v = vectorOutputs(vectorScene({ ...base, operation: 'add' }));
  close3([v.resultX, v.resultY, v.resultZ], [4, 2, 2], 1e-12, 'a + b');
  close(v.resultMag, Math.sqrt(24), 1e-12);
  rel(v.angle, Math.acos(-1 / 3) / DEG, 1e-12, 'obtuse θ'); // a·b = −5, |a||b| = 15
  v = vectorOutputs(vectorScene({ ...base, operation: 'subtract' }));
  close3([v.resultX, v.resultY, v.resultZ], [2, 6, -2], 1e-12, 'a − b');
  close(v.resultMag, Math.sqrt(44), 1e-12);
  v = vectorOutputs(vectorScene({ ...base, ax: 2, ay: -2, az: 1, operation: 'scale' }));
  close3([v.resultX, v.resultY, v.resultZ], [-3, 3, -1.5], 1e-12, 'k a');
  close(v.resultMag, 4.5, 1e-12); // 1.5 × 3
  v = vectorOutputs(vectorScene({ dimension: '3d', ax: 1, ay: 2, az: 2, bx: 2, by: -1, bz: 2, operation: 'project' }));
  close3([v.resultX, v.resultY, v.resultZ], [8 / 9, -4 / 9, 8 / 9], 1e-12, 'projection (4/9) b');
  close(v.resultMag, 4 / 3, 1e-12);
});

test('vectors in 2D ignore the z components', () => {
  const v = vectorOutputs(vectorScene({ dimension: '2d', ax: 3, ay: 4, az: 5, bx: 4, by: 0, bz: -7, operation: 'project' }));
  close(v.magA, 5, 1e-12);
  close3([v.resultX, v.resultY, v.resultZ], [3, 0, 0], 1e-12);
  rel(v.angle, Math.acos(0.6) / DEG, 1e-12); // 12/20
});

// ── lines and spheres ────────────────────────────────────────────────────────────────────────────

test('lines (0,0,0) + t(1,0,0) and (0,0,1) + s(0,1,0) are skew, distance 1 (guide §9.1)', () => {
  const r = relateLines([0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]);
  assert.equal(r.kind, 'skew');
  assert.equal(r.relation, RELATION.skew);
  close(r.distance, 1, 1e-12);
  close(r.angle, 90, 1e-12);
  // Closest points are the origin and (0, 0, 1): the common perpendicular is the z-axis.
  close3(r.closest1, [0, 0, 0], 1e-12);
  close3(r.closest2, [0, 0, 1], 1e-12);
});

test('lines: skew pair 9/√14 apart at cos⁻¹(2/√18)', () => {
  // u × v = (−3, 1, 2), (a2 − a1)·(u × v) = −9
  const r = relateLines([1, 2, 3], [1, -1, 2], [2, 0, 1], [1, 1, 1]);
  assert.equal(r.kind, 'skew');
  close(r.distance, 9 / Math.sqrt(14), 1e-12);
  close(r.angle, Math.acos(2 / Math.sqrt(18)) / DEG, 1e-9);
});

test('lines: intersecting at (2, 1, 5) with λ = 1, μ = 2', () => {
  const r = relateLines([1, 2, 3], [1, -1, 2], [0, -1, 3], [1, 1, 1]);
  assert.equal(r.kind, 'intersecting');
  close(r.distance, 0, 1e-12);
  close(r.lambda, 1, 1e-12);
  close(r.mu, 2, 1e-12);
  close3(r.point, [2, 1, 5], 1e-12);
});

test('lines: parallel (v = −2u) are √(59/6) apart; the same line written twice is coincident', () => {
  const p = relateLines([1, 2, 3], [1, -1, 2], [0, 0, 0], [-2, 2, -4]);
  assert.equal(p.kind, 'parallel');
  close(p.angle, 0, 1e-12);
  close(p.distance, Math.sqrt(59 / 6), 1e-12);
  const c = relateLines([1, 2, 3], [1, -1, 2], [3, 0, 7], [-1, 1, -2]);
  assert.equal(c.kind, 'coincident');
  assert.equal(c.distance, 0);
  assert.equal(relateLines([0, 0, 0], [0, 0, 0], [1, 0, 0], [0, 1, 0]).kind, 'invalid', 'zero direction');
});

test('line–sphere intersection counts 0, 1 and 2 (guide §9.1)', () => {
  // Unit sphere at the origin, lines parallel to the x-axis at heights 0, 1 and 2.
  const through = lineSphere([-5, 0, 0], [1, 0, 0], [0, 0, 0], 1);
  assert.equal(through.hits, 2);
  close(through.lambda1, 4, 1e-12);
  close(through.lambda2, 6, 1e-12);
  close(through.chord, 2, 1e-12);
  const tangent = lineSphere([-5, 0, 1], [1, 0, 0], [0, 0, 0], 1);
  assert.equal(tangent.hits, 1);
  close(tangent.lambda1, 5, 1e-12);
  close3(tangent.points[0], [0, 0, 1], 1e-12);
  const miss = lineSphere([-5, 0, 2], [1, 0, 0], [0, 0, 0], 1);
  assert.equal(miss.hits, 0);
  close(miss.centreDistance, 2, 1e-12);
});

test('line–sphere: 2λ² − 10λ + 8 = 0 gives λ = 1 and 4, Δ = 36, chord √18; R = 2 misses with Δ = −4', () => {
  const s = lineSphere([1, 0, 5], [0, 1, -1], [1, 1, 1], 3);
  close(s.A, 2, 0);
  close(s.B, -10, 0);
  close(s.C, 8, 0);
  close(s.discriminant, 36, 1e-12);
  close(s.lambda1, 1, 1e-12);
  close(s.lambda2, 4, 1e-12);
  close(s.chord, Math.sqrt(18), 1e-12);
  close(s.centreDistance, Math.sqrt(4.5), 1e-12);
  close3(s.points[0], [1, 1, 4], 1e-12);
  close3(s.points[1], [1, 4, 1], 1e-12);
  const m = lineSphere([1, 0, 5], [0, 1, -1], [1, 1, 1], 2);
  assert.equal(m.hits, 0);
  close(m.discriminant, -4, 1e-12);
  // tangent: (λ − 3)² = 0
  const t = lineSphere([-2, 1, 4], [1, 0, 0], [1, 1, 1], 3);
  assert.equal(t.hits, 1);
  assert.equal(t.discriminant, 0);
  close(t.chord, 0, 1e-12);
  close(t.centreDistance, 3, 1e-12);
});

test('lines-spheres outputs: null for the other mode; the moving point P = a + λu', () => {
  const o = linesOutputs(linesScene({ mode: 'lines', point1: [1, 2, 3], dir1: [1, -1, 2], point2: [0, -1, 3], dir2: [1, 1, 1], centre: [1, 1, 1], radius: 3, lambda: 2 }));
  assert.equal(o.relation, 0);
  close3([o.ix, o.iy, o.iz], [2, 1, 5], 1e-12);
  close3([o.px, o.py, o.pz], [3, 0, 7], 1e-12);
  assert.ok(o.hits === null && o.discriminant === null);
  const s = linesOutputs(linesScene({ mode: 'sphere', point1: [1, 0, 5], dir1: [0, 1, -1], point2: [0, 0, 0], dir2: [1, 0, 0], centre: [1, 1, 1], radius: 3, lambda: 1 }));
  assert.equal(s.hits, 2);
  assert.ok(s.relation === null && s.distance === null);
  close(s.pCentreDistance, 3, 1e-12); // P = (1, 1, 4) is on the sphere
});

test('clipLine keeps the part of a line inside a box', () => {
  assert.deepEqual(clipLine([0, 0, 0], [1, 0, 0], -10, 10), [-10, 10]);
  assert.deepEqual(clipLine([0, 0, 0], [2, 0, 0], -10, 10), [-5, 5]);
  assert.equal(clipLine([0, 20, 0], [1, 0, 0], -10, 10), null);
});

// ── solids of revolution ─────────────────────────────────────────────────────────────────────────

const PI = Math.PI;

test('disc volume y = x on [0, 1] about the x-axis is π/3 (0.5%, 200 discs) (guide §9.1)', () => {
  const r = revolution({ fn: (x) => x, axis: 'x', lower: 0, upper: 1, discs: 200 });
  rel(r.discSum, PI / 3, 0.005, 'disc sum');
  rel(r.volume, PI / 3, 1e-10, 'integral');
  // Midpoint discs: π Σ ((i + ½)/N)² / N = π(4N² − 1)/(12N²)
  rel(r.discSum, (PI * (4 * 200 ** 2 - 1)) / (12 * 200 ** 2), 1e-12, 'closed form of the midpoint sum');
  close(r.discWidth, 0.005, 1e-15);
});

test('disc volume y = √x on [0, 4] about the x-axis is 8π (0.5%, 200 discs) (guide §9.1)', () => {
  const r = revolution({ fn: Math.sqrt, axis: 'x', lower: 0, upper: 4, discs: 200 });
  rel(r.discSum, 8 * PI, 0.005, 'disc sum');
  rel(r.volume, 8 * PI, 1e-10, 'integral');
  rel(r.volumeOverPi, 8, 1e-10);
});

test('left, midpoint and right discs for y = √x on [0, 4] with 10 discs: 7.2π, 8π and 8.8π', () => {
  // π × 0.4 × (0 + 0.4 + … + 3.6) = 7.2π; midpoint sum is exact because f² = x is linear
  rel(revolution({ fn: Math.sqrt, lower: 0, upper: 4, discs: 10, discRule: 'left' }).discSum, 7.2 * PI, 1e-12);
  rel(revolution({ fn: Math.sqrt, lower: 0, upper: 4, discs: 10, discRule: 'midpoint' }).discSum, 8 * PI, 1e-12);
  rel(revolution({ fn: Math.sqrt, lower: 0, upper: 4, discs: 10, discRule: 'right' }).discSum, 8.8 * PI, 1e-12);
});

test('y = x² on [0, 2]: V = 32π/5; four left discs 3.0625π, four midpoint discs 6.0703125π', () => {
  const sq = (x) => x * x;
  rel(revolution({ fn: sq, lower: 0, upper: 2, discs: 4, discRule: 'left' }).volume, (32 * PI) / 5, 1e-10);
  rel(revolution({ fn: sq, lower: 0, upper: 2, discs: 4, discRule: 'left' }).discSum, 3.0625 * PI, 1e-12);
  rel(revolution({ fn: sq, lower: 0, upper: 2, discs: 4, discRule: 'midpoint' }).discSum, 6.0703125 * PI, 1e-12);
});

test('spheres: radius 3 about the x-axis is 36π; radius 2 about the y-axis is 32π/3', () => {
  const s3 = revolution({ fn: (x) => Math.sqrt(9 - x * x), axis: 'x', lower: -3, upper: 3, discs: 10 });
  rel(s3.volume, 36 * PI, 1e-9);
  // midpoints ±0.3 … ±2.7: Σ(9 − m²) = 90 − 29.7 = 60.3, so π × 0.6 × 60.3
  rel(s3.discSum, 36.18 * PI, 1e-12);
  rel(s3.discError, 0.18 * PI, 1e-9);
  const s2 = revolution({ fn: (y) => Math.sqrt(4 - y * y), axis: 'y', lower: -2, upper: 2, discs: 20 });
  rel(s2.volume, (32 * PI) / 3, 1e-9);
  rel(s2.discSum, 10.68 * PI, 1e-12);
});

test('revolution: e^x on [0, ln 3] is 4π; bounds the wrong way round are swapped; undefined curves give NaN', () => {
  // π∫ e^{2x} dx = (π/2)(9 − 1) = 4π
  rel(revolution({ fn: Math.exp, lower: 0, upper: Math.log(3), discs: 10 }).volume, 4 * PI, 1e-10);
  const r = revolution({ fn: Math.sqrt, lower: 4, upper: 0, discs: 10 });
  rel(r.volume, 8 * PI, 1e-10);
  assert.equal(r.lo, 0);
  const bad = revolution({ fn: Math.sqrt, lower: -1, upper: 4, discs: 10 });
  assert.ok(Number.isNaN(bad.volume) && Number.isNaN(bad.discSum));
  assert.equal(bad.undefinedAt, -1);
  assert.ok(Object.values(revolutionOutputs({ error: 'x' })).every((v) => v === null), 'outputs are null when the curve fails');
});

test('integrate: adaptive Simpson on smooth and periodic integrands', () => {
  rel(integrate((x) => Math.sin(x) ** 2, 0, 2 * PI), PI, 1e-10); // a lazy 3-point Simpson gives 0 here
  rel(integrate((x) => 1 / (x * x), 1, 5), 0.8, 1e-10);
  close(integrate(Math.sin, 0, 0), 0, 0);
  const sl = discSlices((x) => x, 0, 1, 4, 'right');
  assert.deepEqual(sl.map((d) => d.s), [0.25, 0.5, 0.75, 1]);
});

// ── 3D trigonometry ──────────────────────────────────────────────────────────────────────────────

test('bearings: true bearings clockwise from north', () => {
  close(bearingOf(1, 0), 90, 1e-12);
  close(bearingOf(0, -1), 180, 1e-12);
  close(bearingOf(-1, 0), 270, 1e-12);
  close(bearingOf(1, 1), 45, 1e-12);
  close3(pointOnBearing(90, 10), [10, 0, 0], 1e-12);
  close(bearingDifference(300, 40), 100, 1e-12);
  close(bearingDifference(30, 150), 120, 1e-12);
});

test('tower: angle of elevation tan⁻¹(h/d); AB by Pythagoras when A is due south and B due east', () => {
  const t = towerScene({ towerHeight: 60, distA: 80, bearingA: 180, distB: 60, bearingB: 90 });
  rel(t.elevA, Math.atan(0.75) / DEG, 1e-12, 'elevation from A');
  close(t.elevB, 45, 1e-12);
  close(t.baseAngle, 90, 1e-12);
  close(t.distAB, 100, 1e-9); // √(80² + 60²)
  rel(t.bearingAtoB, Math.atan(60 / 80) / DEG, 1e-9); // A→B = (60, 80)
});

test('tower: obtuse base angle uses the cosine rule; bearings that wrap through north', () => {
  const t = towerScene({ towerHeight: 40, distA: 100, bearingA: 30, distB: 100, bearingB: 150 });
  close(t.baseAngle, 120, 1e-12);
  rel(t.distAB, 100 * Math.sqrt(3), 1e-12); // AB² = 2·100² − 2·100²·cos 120°
  close(t.bearingAtoB, 180, 1e-9);
  const w = towerScene({ towerHeight: 50, distA: 120, bearingA: 300, distB: 90, bearingB: 40 });
  close(w.baseAngle, 100, 1e-12);
  rel(w.distAB, Math.sqrt(120 ** 2 + 90 ** 2 - 2 * 120 * 90 * Math.cos(100 * DEG)), 1e-12);
  rel(w.elevB, Math.atan(50 / 90) / DEG, 1e-12);
});

test('cuboid 4 × 3 × 12: base diagonal 5, space diagonal 13, angle tan⁻¹(12/5)', () => {
  const c = cuboidScene({ length: 4, width: 3, height: 12 });
  close(c.faceDiagonal, 5, 1e-12);
  close(c.spaceDiagonal, 13, 1e-12);
  rel(c.diagonalAngle, Math.atan(12 / 5) / DEG, 1e-12);
  close(length(sub(c.v.G, c.v.A)), 13, 1e-12);
});

test('ramp: the line of greatest slope is steeper than the diagonal of the slope', () => {
  const r = rampScene({ length: 4, width: 3, height: 12 });
  rel(r.slopeAngle, Math.atan(12 / 4) / DEG, 1e-12);
  rel(r.diagonalAngle, Math.atan(12 / 5) / DEG, 1e-12);
  close(r.spaceDiagonal, 13, 1e-12); // AF = √(4² + 3² + 12²)
  assert.ok(r.slopeAngle > r.diagonalAngle);
  close(length(sub(r.v.F, r.v.A)), 13, 1e-12);
});

test('square pyramid s = 6, h = 4: slant height 5, face angle tan⁻¹(4/3), slant edge √34, edge angle tan⁻¹(4/(3√2))', () => {
  const p = pyramidScene({ baseSide: 6, height: 4 });
  close(p.slantHeight, 5, 1e-12);
  rel(p.faceAngle, Math.atan(4 / 3) / DEG, 1e-12);
  rel(p.slantEdge, Math.sqrt(34), 1e-12);
  rel(p.edgeAngle, Math.atan(4 / (3 * Math.SQRT2)) / DEG, 1e-12);
  close(length(sub(p.V, p.K)), Math.sqrt(34), 1e-12);
});

test('trig3d outputs: values for the current scene, null (shown as —) for the others', () => {
  const o = trig3dOutputs(trig3dScene({ scene: 'pyramid', baseSide: 6, height: 4, towerHeight: 60, distA: 80, bearingA: 180, distB: 60, bearingB: 90, length: 4, width: 3 }));
  close(o.slantHeight, 5, 1e-12);
  assert.ok(o.elevA === null && o.spaceDiagonal === null && o.slopeAngle === null);
});

test('outputs are never NaN or infinite (the engine demo e2e check)', () => {
  const all = [
    trig3dOutputs(trig3dScene({ scene: 'tower', towerHeight: 60, distA: 80, bearingA: 180, distB: 60, bearingB: 90 })),
    vectorOutputs(vectorScene({ dimension: '3d', ax: 0, ay: 0, az: 0, bx: 1, by: 2, bz: 3, operation: 'project' })), // zero a
    vectorOutputs(vectorScene({ dimension: '3d', ax: 1, ay: 2, az: 3, bx: 0, by: 0, bz: 0, operation: 'project' })), // zero b
    linesOutputs(linesScene({ mode: 'lines', point1: [0, 0, 0], dir1: [0, 0, 0], point2: [1, 1, 1], dir2: [1, 0, 0], centre: [0, 0, 0], radius: 1, lambda: 0 })),
    linesOutputs(linesScene({ mode: 'sphere', point1: [0, 0, 5], dir1: [1, 0, 0], point2: [0, 0, 0], dir2: [1, 0, 0], centre: [0, 0, 0], radius: 1, lambda: 0 })),
    descriptiveOutputs(descriptiveLine({ pointA: [10, 10, 10], pointB: [10, 10, 10] })), // A = B
    revolutionOutputs(revolution({ fn: (x) => 1 / x, lower: -1, upper: 1, discs: 10 })),
  ];
  for (const o of all) for (const [k, v] of Object.entries(o)) assert.ok(v === null || Number.isFinite(v), `${k} = ${v}`);
});

// ── orthographic projection ──────────────────────────────────────────────────────────────────────

test('parts: volumes and view areas from their dimensions', () => {
  const step = orthographicOutputs(orthographicScene({ part: 'stepBlock', projection: 'third' }));
  assert.deepEqual([step.width, step.depth, step.height], [60, 30, 40]);
  close(step.partVolume, 60 * 30 * 40 - 30 * 20 * 30, 1e-9);
  close(step.frontArea, 60 * 40 - 30 * 20, 1e-9);
  close(step.topArea, 60 * 30, 1e-9);
  close(step.sideArea, 30 * 40, 1e-9);
  close(partVolume(PARTS.slottedBlock), 60 * 40 * 30 - 20 * 10 * 40, 1e-9);
  close(viewAreas(PARTS.slottedBlock).front, 60 * 30 - 20 * 10, 1e-9);
  close(partVolume(PARTS.chamferBlock), 60 * 30 * 40 - 0.5 * 30 * 20 * 30, 1e-9);
  close(viewAreas(PARTS.chamferBlock).front, 2400 - 300, 1e-9);
  close(partVolume(PARTS.holeBlock), 60 * 40 * 20 - PI * 100 * 20, 1e-9);
  close(viewAreas(PARTS.holeBlock).top, 60 * 40 - PI * 100, 1e-9);
  close(viewAreas(PARTS.holeBlock).side, 40 * 20, 1e-9);
});

test('third angle puts the top view above and the right view to the right; first angle the opposite', () => {
  assert.deepEqual(viewPlacement('third'), { top: 1, side: 1 });
  assert.deepEqual(viewPlacement('first'), { top: -1, side: -1 });
});

test('insidePart agrees with the volume (midpoint grid count, 1%)', () => {
  for (const key of Object.keys(PARTS)) {
    const part = PARTS[key];
    const n = 40;
    const W = 60;
    const H = Math.max(...part.profile.map((p) => p[1]));
    let count = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      if (insidePart(part, [((i + 0.5) * W) / n, ((j + 0.5) * part.D) / n, ((k + 0.5) * H) / n])) count++;
    }
    rel((count / n ** 3) * W * part.D * H, partVolume(part), 0.01, key);
  }
});

const linesAt = (view, test) => view.lines.filter((l) => test(l));
const horizontalAt = (v, u0, u1) => (l) => Math.abs(l.a[1] - v) < 1e-9 && Math.abs(l.b[1] - v) < 1e-9 && Math.min(l.a[0], l.b[0]) <= u0 + 1e-9 && Math.max(l.a[0], l.b[0]) >= u1 - 1e-9;
const verticalAt = (u, v0, v1) => (l) => Math.abs(l.a[0] - u) < 1e-9 && Math.abs(l.b[0] - u) < 1e-9 && Math.min(l.a[1], l.b[1]) <= v0 + 1e-9 && Math.max(l.a[1], l.b[1]) >= v1 - 1e-9;

test('step block: the front view has no hidden lines; the top view shows the step as a visible line at x = 30', () => {
  const front = projectView(PARTS.stepBlock, 'front');
  // Every hidden piece in the front view lies under a visible one (the back face outline).
  for (const h of front.lines.filter((l) => l.hidden)) {
    const covered = front.lines.some((v) => !v.hidden && Math.abs(cross2d(v, h.a)) < 1e-9 && Math.abs(cross2d(v, h.b)) < 1e-9);
    assert.ok(covered, `hidden line ${JSON.stringify(h)} should be covered by a visible line`);
  }
  const top = projectView(PARTS.stepBlock, 'top');
  assert.ok(linesAt(top, (l) => !l.hidden && verticalAt(30, 0, 30)(l)).length > 0, 'visible step line at x = 30');
});

function cross2d(line, p) {
  const d = [line.b[0] - line.a[0], line.b[1] - line.a[1]];
  return (d[0] * (p[1] - line.a[1]) - d[1] * (p[0] - line.a[0])) / Math.hypot(d[0], d[1]);
}

test('slotted block: the slot floor (z = 20) is a hidden line across the right view', () => {
  const right = projectView(PARTS.slottedBlock, 'right');
  const floor = linesAt(right, horizontalAt(20, 0, 40));
  assert.ok(floor.length > 0, 'a line at z = 20 across the full depth');
  assert.ok(floor.every((l) => l.hidden), 'and it is hidden');
  assert.ok(!right.lines.some((l) => !l.hidden && Math.abs(l.a[1] - 20) < 1e-9 && Math.abs(l.b[1] - 20) < 1e-9), 'no visible line at z = 20');
});

test('chamfer block: the inclined face is a sloping visible line in the front view and a visible line at z = 20 in the right view', () => {
  const front = projectView(PARTS.chamferBlock, 'front');
  assert.ok(front.lines.some((l) => !l.hidden && [l.a, l.b].some((p) => p[0] === 30 && p[1] === 40) && [l.a, l.b].some((p) => p[0] === 60 && p[1] === 20)));
  const right = projectView(PARTS.chamferBlock, 'right');
  assert.ok(linesAt(right, (l) => !l.hidden && horizontalAt(20, 0, 30)(l)).length > 0);
});

test('block with a hole: hidden limbs at x = 20 and 40 in the front view, a centre line at x = 30, a visible circle on top', () => {
  const front = projectView(PARTS.holeBlock, 'front');
  for (const x of [20, 40]) {
    const limb = linesAt(front, verticalAt(x, 0, 20));
    assert.ok(limb.length > 0 && limb.every((l) => l.hidden), `hidden limb at x = ${x}`);
  }
  assert.deepEqual(front.centres.map((c) => c.a[0]), [30]);
  const top = projectView(PARTS.holeBlock, 'top');
  const onCircle = top.lines.filter((l) => Math.abs(Math.hypot(l.a[0] - 30, l.a[1] - 20) - 10) < 1e-9);
  assert.ok(onCircle.length >= 64 && onCircle.some((l) => !l.hidden), 'circle drawn and visible from above');
});

test('occluded: a point on the bottom face is hidden from above; one on the top face is not', () => {
  assert.equal(occluded(PARTS.stepBlock, [10, 15, 0], [0, 0, 1]), true);
  assert.equal(occluded(PARTS.stepBlock, [10, 15, 40], [0, 0, 1]), false);
  // Seen from above through the hole, the bottom circle is visible.
  assert.equal(occluded(PARTS.holeBlock, [30 + 9.99, 20, 0], [0, 0, 1]), false);
});

// ── descriptive geometry ─────────────────────────────────────────────────────────────────────────

test('auxiliary view of a line shows its true length: A(10, 10, 10), B(70, 30, 40) → TL = √(60² + 20² + 30²) = 70', () => {
  const d = descriptiveLine({ pointA: [10, 10, 10], pointB: [70, 30, 40] });
  close(d.trueLength3D, 70, 1e-12);
  close(d.trueLength, 70, 1e-9, 'measured in the auxiliary view');
  close(d.planLength, Math.hypot(60, 20), 1e-12);
  close(d.frontLength, Math.hypot(60, 30), 1e-12);
  close(d.angleHP, Math.asin(30 / 70) / DEG, 1e-9, 'true angle to the horizontal plane');
  close(d.angleVP, Math.asin(20 / 70) / DEG, 1e-9);
  // Projectors are perpendicular to the fold line H/1.
  for (const [P, Q] of [[d.top.A, d.aux.A], [d.top.B, d.aux.B]]) {
    const v = [Q[0] - P[0], Q[1] - P[1]];
    close(v[0] * d.aux.dir[0] + v[1] * d.aux.dir[1], 0, 1e-9, 'projector ⊥ fold line');
  }
});

test('auxiliary view distances: each point sits its transfer distance beyond the fold line', () => {
  const aux = auxiliaryView({ base: [[0, 0], [10, 0]], points: [[0, 0], [10, 0]], transfer: [5, 8], gap: 15 });
  // fold line is v = 15 (n = (0, 1)); points go to v = 15 + 5 and 15 + 8
  close3([...aux.points[0], ...aux.points[1], 0], [0, 20, 10, 23, 0], 1e-12);
});

test('true shape of the chamfer face: TL edge √(run² + drop²), area TL × depth', () => {
  const f = descriptiveFace({ chamferRun: 30, chamferDrop: 20 });
  close(f.trueLength, Math.hypot(30, 20), 1e-9);
  close(f.trueArea, Math.hypot(30, 20) * 30, 1e-9);
  close(f.planArea, 30 * 30, 1e-9);
  close(f.planLength, 30, 1e-12);
  close(f.angleHP, Math.atan(20 / 30) / DEG, 1e-12);
  const o = descriptiveOutputs(f);
  close(o.trueArea, f.trueArea, 0);
  assert.equal(descriptiveOutputs(descriptiveLine({ pointA: [0, 0, 0], pointB: [1, 2, 2] })).trueArea, null);
});

test('polygonArea: shoelace, anticlockwise positive', () => {
  assert.equal(polygonArea([[0, 0], [4, 0], [4, 3], [0, 3]]), 12);
  assert.equal(polygonArea([[0, 0], [0, 3], [4, 3], [4, 0]]), -12);
});

test('deterministic: the same inputs give the same views', () => {
  assert.deepEqual(projectView(PARTS.slottedBlock, 'top'), projectView(structuredClone(PARTS.slottedBlock), 'top'));
  assert.deepEqual(add([1, 2, 3], scale([1, 1, 1], 2)), [3, 4, 5]);
});
