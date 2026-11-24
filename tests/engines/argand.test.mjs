// argand engine tests: analytic answers for complex arithmetic, loci and polynomial roots (guide §9.1).
// Every expected number comes from a formula or a hand calculation shown in the comment beside it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEG,
  complex,
  fromPolar,
  add,
  sub,
  mul,
  div,
  conj,
  pow,
  powers,
  modulus,
  arg,
  principalArg,
  wrapAngle,
  nthRoots,
  numText,
  complexText,
  surdText,
  modulusText,
  angleText,
  pointFromParams,
  syncPoint,
  computeOperation,
  operationOutputs,
  snapCartesian,
  snapPolar,
  conditionFromParams,
  satisfies,
  conditionText,
  cartesianText,
  boundaryPieces,
  rasteriseRegion,
  compileCondition,
  clipPiece,
  intersections,
  lociOutputs,
  polyEval,
  polyRoots,
  polyCoefficients,
  polyText,
  polynomialOutputs,
  isZeroPolynomial,
  rootGroups,
} from '../../site/assets/engines/argand/model.js';

const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const closeZ = (actual, expected, tol, msg) => {
  close(actual.re, expected.re, tol, `${msg ?? ''} (re)`);
  close(actual.im, expected.im, tol, `${msg ?? ''} (im)`);
};
const PI = Math.PI;

// ---------------------------------------------------------------------------------------------
// §9.1 analytic tests
// ---------------------------------------------------------------------------------------------

test('§9.1: the 7th roots of unity sum to 0 (1e-12)', () => {
  const roots = nthRoots(complex(1, 0), 7);
  assert.equal(roots.length, 7);
  const sum = roots.reduce((s, z) => add(s, z), complex(0, 0));
  close(sum.re, 0, 1e-12, 'Σ re');
  close(sum.im, 0, 1e-12, 'Σ im');
  // Each is a 7th root of unity and they are spaced 2π/7 apart, starting at 1.
  for (const [k, z] of roots.entries()) {
    closeZ(pow(z, 7), complex(1, 0), 1e-12, `ω_${k}^7`);
    close(modulus(z), 1, 1e-12, `|ω_${k}|`);
    close(wrapAngle(arg(z) - (2 * PI * k) / 7), 0, 1e-12, `arg ω_${k}`);
  }
});

test('§9.1: principal arguments arg(−1) = π and arg(−i) = −π/2', () => {
  assert.equal(arg(complex(-1, 0)), PI);
  assert.equal(arg(complex(0, -1)), -PI / 2);
  // Signed zero must not flip the negative real axis to −π.
  assert.equal(arg(complex(-1, -0)), PI);
  assert.equal(arg(complex(1, 0)), 0);
  assert.equal(arg(complex(0, 1)), PI / 2);
  close(arg(complex(-1, 1)), (3 * PI) / 4, 1e-15);
  close(arg(complex(-1, -1)), (-3 * PI) / 4, 1e-15);
  assert.ok(Number.isNaN(arg(complex(0, 0))), 'arg 0 is undefined');
  // Always in (−π, π].
  for (let k = 0; k < 360; k++) {
    const a = arg(fromPolar(1, k * DEG * 7.3));
    assert.ok(a > -PI && a <= PI, `arg in (−π, π]: ${a}`);
  }
});

test('§9.1: de Moivre (cos θ + i sin θ)^5 = cos 5θ + i sin 5θ (1e-12)', () => {
  for (const theta of [0, 0.3, PI / 7, 1, 2.5, -2.2, PI, (5 * PI) / 6]) {
    const z = complex(Math.cos(theta), Math.sin(theta));
    closeZ(pow(z, 5), complex(Math.cos(5 * theta), Math.sin(5 * theta)), 1e-12, `θ = ${theta}`);
  }
});

test('§9.1: |z₁z₂| = |z₁||z₂| and arg(z₁z₂) ≡ arg z₁ + arg z₂ (mod 2π)', () => {
  const pairs = [
    [complex(2, 1), complex(1, 1)],
    [complex(-3, 4), complex(0.5, -2)],
    [complex(-1, -1), complex(-1, 0.2)],
    [complex(7.1, -0.3), complex(-0.2, -9)],
  ];
  for (const [a, b] of pairs) {
    const p = mul(a, b);
    close(modulus(p), modulus(a) * modulus(b), 1e-12 * modulus(p), '|z₁z₂|');
    close(wrapAngle(arg(p) - arg(a) - arg(b)), 0, 1e-12, 'arg(z₁z₂) − arg z₁ − arg z₂');
    // Division undoes multiplication: |z₁/z₂| = |z₁|/|z₂|.
    const q = div(a, b);
    close(modulus(q), modulus(a) / modulus(b), 1e-12 * modulus(q), '|z₁/z₂|');
    closeZ(mul(q, b), a, 1e-12 * modulus(a), '(z₁/z₂)·z₂');
  }
});

// ---------------------------------------------------------------------------------------------
// Complex arithmetic
// ---------------------------------------------------------------------------------------------

test('arithmetic by hand', () => {
  assert.deepEqual(add(complex(2, 1), complex(1, 1)), complex(3, 2));
  assert.deepEqual(sub(complex(2, 1), complex(1, 1)), complex(1, 0));
  // (2 + i)(1 + i) = 2 + 2i + i + i² = 1 + 3i
  assert.deepEqual(mul(complex(2, 1), complex(1, 1)), complex(1, 3));
  // (2 + i)/(1 + i) = (2 + i)(1 − i)/2 = (3 − i)/2
  closeZ(div(complex(2, 1), complex(1, 1)), complex(1.5, -0.5), 1e-15);
  // 1/i = −i
  closeZ(div(complex(1, 0), complex(0, 1)), complex(0, -1), 1e-15);
  const bad = div(complex(1, 1), complex(0, 0));
  assert.ok(Number.isNaN(bad.re) && Number.isNaN(bad.im), 'division by zero is undefined');
  assert.deepEqual(conj(complex(3, -4)), complex(3, 4));
  // z z̄ = |z|²
  closeZ(mul(complex(3, -4), conj(complex(3, -4))), complex(25, 0), 1e-12);
  assert.equal(modulus(complex(3, -4)), 5);
});

test('integer powers: i² = −1, (1 + i)⁸ = 16, z⁰ = 1, negative powers', () => {
  closeZ(pow(complex(0, 1), 2), complex(-1, 0), 1e-15);
  closeZ(pow(complex(0, 1), 4), complex(1, 0), 1e-15);
  // (1 + i)² = 2i, so (1 + i)⁸ = (2i)⁴ = 16
  closeZ(pow(complex(1, 1), 8), complex(16, 0), 1e-12);
  closeZ(pow(complex(3, -2), 0), complex(1, 0), 0);
  // (1 + i)⁻² = 1/(2i) = −i/2
  closeZ(pow(complex(1, 1), -2), complex(0, -0.5), 1e-15);
  const seq = powers(complex(1, 1), 4);
  assert.equal(seq.length, 5);
  closeZ(seq[0], complex(1, 0), 0);
  closeZ(seq[2], complex(0, 2), 1e-15);
  closeZ(seq[4], complex(-4, 0), 1e-15);
});

test('nth roots of w: each root to the n is w, principal root first', () => {
  // Cube roots of −8: 2 cis(π/3 + 2kπ/3), principal 1 + √3 i
  const r = nthRoots(complex(-8, 0), 3);
  closeZ(r[0], complex(1, Math.sqrt(3)), 1e-12);
  closeZ(r[1], complex(-2, 0), 1e-12);
  closeZ(r[2], complex(1, -Math.sqrt(3)), 1e-12);
  for (const z of r) closeZ(pow(z, 3), complex(-8, 0), 1e-11);
  // Square roots of 2i: ±(1 + i)
  const s = nthRoots(complex(0, 2), 2);
  closeZ(s[0], complex(1, 1), 1e-12);
  closeZ(s[1], complex(-1, -1), 1e-12);
  // Roots of 0 are all 0.
  for (const z of nthRoots(complex(0, 0), 4)) closeZ(z, complex(0, 0), 0);
});

test('computed results on the negative real axis have principal argument π, never −π', () => {
  // (cis π/3)³ = −1, computed with a rounding residue in Im.
  const z = pow(fromPolar(1, PI / 3), 3);
  assert.equal(principalArg(z), PI);
  assert.equal(angleText(principalArg(z)), 'π');
  assert.equal(arg(complex(-1, -1e-300)), PI, 'atan2 rounding to −π is mapped to π');
  for (let n = 1; n <= 12; n++) {
    // ωᵏ for the nth roots of unity: every principal argument is in (−π, π].
    for (const w of powers(fromPolar(1, (2 * PI) / n), n)) {
      const a = principalArg(w);
      assert.ok(a > -PI && a <= PI, `arg ${a}`);
    }
  }
  const o = operationOutputs(opParams({ operation: 'power', z1Form: 'polar', z1Mod: 1, z1Arg: 60, powerN: 3 }));
  assert.equal(o.resRe, -1);
  assert.equal(o.resIm, 0);
  assert.equal(o.resArg, PI);
});

test('wrapAngle maps into (−π, π] without flipping π to −π', () => {
  assert.equal(wrapAngle(PI), PI);
  close(wrapAngle(-PI), PI, 1e-15);
  close(wrapAngle((3 * PI) / 2), -PI / 2, 1e-15);
  close(wrapAngle(-(3 * PI) / 2), PI / 2, 1e-15);
  close(wrapAngle(5 * PI), PI, 1e-14);
  close(wrapAngle(PI + 4e-16), PI, 1e-15);
  close(wrapAngle(0.5 + 4 * PI), 0.5, 1e-14);
});

// ---------------------------------------------------------------------------------------------
// Display text: exact forms where they exist
// ---------------------------------------------------------------------------------------------

test('numbers and complex numbers read like a teacher would write them', () => {
  assert.equal(numText(3), '3');
  assert.equal(numText(-1.5), '−1.5');
  assert.equal(numText(2.25), '2.25');
  assert.equal(numText(1 / 3), '0.333');
  assert.equal(numText(1e-17), '0');
  assert.equal(complexText(complex(1, 3)), '1 + 3i');
  assert.equal(complexText(complex(2, 1)), '2 + i');
  assert.equal(complexText(complex(1.5, -0.5)), '1.5 − 0.5i');
  assert.equal(complexText(complex(0, -1)), '−i');
  assert.equal(complexText(complex(0, 2)), '2i');
  assert.equal(complexText(complex(-4, 0)), '−4');
  assert.equal(complexText(complex(6e-17, 1)), 'i');
  assert.equal(complexText(complex(0, 0)), '0');
  assert.equal(complexText(complex(NaN, NaN)), 'undefined');
});

test('large values: exact ones keep every digit, approximate ones use scientific notation in both parts', () => {
  const G = ' '; // the narrow no-break space format.js groups thousands with
  // 3¹³ = 1 594 323 and 3¹⁶ = 43 046 721 (whole numbers, computed exactly)
  assert.equal(complexText(pow(complex(3, 0), 13)), `1${G}594${G}323`);
  assert.equal(complexText(pow(complex(3, 0), 16)), `43${G}046${G}721`);
  assert.equal(modulusText(modulus(pow(complex(3, 0), 16))), `43${G}046${G}721`);
  // (2.3 − 1.9i)¹²: |z|² = 8.9, so |z¹²| = 8.9⁶; both parts are approximate and both in × 10ⁿ form.
  const z12 = pow(complex(2.3, -1.9), 12);
  close(modulus(z12), 8.9 ** 6, 1e-9 * 8.9 ** 6);
  assert.equal(complexText(z12), '−2.08 × 10⁵ − 4.51 × 10⁵i');
  // (10 + 10i)² = 200i, so (10 + 10i)¹⁶ = 200⁸ = 2.56 × 10¹⁸
  assert.equal(complexText(pow(complex(10, 10), 16)), '2.56 × 10¹⁸');
  // Approximate values never print as if exact.
  assert.equal(numText(12345.6789), '1.23 × 10⁴');
  assert.equal(numText(-207798.3186), '−2.08 × 10⁵');
  assert.equal(numText(12345.5), `12${G}345.5`);
  assert.equal(numText(3e-10), '3.00 × 10⁻¹⁰');
  // A mixed number is written one way: 1234.5678 + 2i → both parts to 3 s.f.
  assert.equal(complexText(complex(1234.5678, 2)), '1.23 × 10³ + 2.00i');
});

test('moduli as surds: √5, √2/2, 2√2, 7√5/10; rational moduli stay decimal', () => {
  assert.equal(surdText(Math.sqrt(2.18)), null, 'no √218/10: radicands stay small');
  assert.equal(surdText(Math.sqrt(8.9)), null, 'no √890/10');
  assert.equal(surdText(Math.sqrt(5)), '√5');
  assert.equal(surdText(modulus(complex(2, 2))), '2√2');
  assert.equal(surdText(modulus(complex(0.5, 0.5))), '√2/2');
  assert.equal(surdText(modulus(complex(1.4, 0.7))), '7√5/10'); // 1.96 + 0.49 = 2.45 = 245/100
  assert.equal(surdText(modulus(complex(1, 0.5))), '√5/2'); // 1.25 = 5/4
  assert.equal(surdText(5), null);
  assert.equal(surdText(2.2), null);
  assert.equal(surdText(PI), null);
  assert.equal(modulusText(Math.sqrt(5)), '√5 ≈ 2.24');
  assert.equal(modulusText(5), '5');
  assert.equal(modulusText(modulus(complex(1, 3))), '√10 ≈ 3.16');
});

test('arguments as exact multiples of π where possible, otherwise decimals; degrees option', () => {
  assert.equal(angleText(PI / 4), 'π/4');
  assert.equal(angleText((-3 * PI) / 4), '−3π/4');
  assert.equal(angleText(PI), 'π');
  assert.equal(angleText(0), '0');
  assert.equal(angleText((2 * PI) / 7), '2π/7');
  assert.equal(angleText((5 * PI) / 12), '5π/12');
  assert.equal(angleText(arg(complex(2, 1))), '0.464'); // tan⁻¹(1/2) = 0.4636…
  assert.equal(angleText(PI / 4, 'deg'), '45°');
  assert.equal(angleText(arg(complex(2, 1)), 'deg'), '26.6°');
  assert.equal(angleText(NaN), 'undefined');
});

// ---------------------------------------------------------------------------------------------
// Operations setup
// ---------------------------------------------------------------------------------------------

const opParams = (over = {}) => ({
  operation: 'mul',
  z1Form: 'cartesian', z1Re: 2, z1Im: 1, z1Mod: Math.sqrt(5), z1Arg: Math.atan2(1, 2) / DEG,
  z2Form: 'cartesian', z2Re: 1, z2Im: 1, z2Mod: Math.SQRT2, z2Arg: 45,
  powerN: 6, rootN: 5, rootsOf: 'unity',
  ...over,
});

test('points come from the chosen form, and the other form is kept in step', () => {
  // Polar input: 2 cis 90° is exactly 2i (tiny cosine residue cleaned).
  const p = opParams({ z1Form: 'polar', z1Mod: 2, z1Arg: 90 });
  assert.deepEqual(pointFromParams(p, 'z1'), complex(0, 2));
  // 2 cis 180° sits on the negative real axis, so its principal argument is π, not −π.
  assert.equal(arg(pointFromParams(opParams({ z1Form: 'polar', z1Mod: 2, z1Arg: -180 }), 'z1')), PI);

  // Changing Re/Im updates |z| and arg z.
  const a = syncPoint(opParams({ z1Re: 0, z1Im: -3 }), 'z1', new Set(['z1Re', 'z1Im']));
  assert.equal(a.z1Mod, 3);
  assert.equal(a.z1Arg, -90);
  // Changing |z| or arg z updates Re/Im.
  const b = syncPoint(opParams({ z1Form: 'polar', z1Mod: 4, z1Arg: 150 }), 'z1', new Set(['z1Arg']));
  close(b.z1Re, -2 * Math.sqrt(3), 1e-9);
  close(b.z1Im, 2, 1e-12);
  // Nothing changed: the form decides which pair is the source.
  const c = syncPoint(opParams({ z2Form: 'polar', z2Mod: 2, z2Arg: 60, z2Re: 9, z2Im: 9 }), 'z2', new Set());
  close(c.z2Re, 1, 1e-9);
  close(c.z2Im, Math.sqrt(3), 1e-9);
});

test('switching the entry form never moves the point', () => {
  // 9 + 8i has |z| = √145 ≈ 12.04, beyond the old modulus limit of 10.
  let p = syncPoint(opParams({ z1Re: 9, z1Im: 8 }), 'z1', new Set(['z1Re', 'z1Im']));
  close(p.z1Mod, Math.sqrt(145), 1e-9);
  p = syncPoint({ ...p, z1Form: 'polar' }, 'z1', new Set(['z1Form']));
  assert.deepEqual(pointFromParams(p, 'z1'), complex(9, 8), 'exactly 9 + 8i in polar form');
  assert.equal(computeOperation(p).result.re, mul(complex(9, 8), complex(1, 1)).re);
  p = syncPoint({ ...p, z1Form: 'cartesian' }, 'z1', new Set(['z1Form']));
  assert.deepEqual(pointFromParams(p, 'z1'), complex(9, 8), 'and back again');
  // Every corner of the square survives a round trip.
  for (const [re, im] of [[10, 10], [-10, 10], [-10, -10], [10, -10], [-10, 0], [0.1, -9.9]]) {
    let q = syncPoint(opParams({ z1Re: re, z1Im: im }), 'z1', new Set(['z1Re']));
    q = syncPoint({ ...q, z1Form: 'polar' }, 'z1', new Set(['z1Form']));
    assert.deepEqual(pointFromParams(q, 'z1'), complex(re, im), `${re} + ${im}i`);
    assert.ok(q.z1Mod <= 15, 'modulus within its range');
  }
  // Polar entry 2 cis 30° stays exact after switching to Cartesian.
  let r = syncPoint(opParams({ z1Form: 'polar', z1Mod: 2, z1Arg: 30 }), 'z1', new Set(['z1Mod', 'z1Arg']));
  r = syncPoint({ ...r, z1Form: 'cartesian' }, 'z1', new Set(['z1Form']));
  assert.deepEqual(pointFromParams(r, 'z1'), fromPolar(2, PI / 6));
  // Polar entry beyond the square is pulled in along its ray: 15 cis 30° → Re = 10.
  const s = syncPoint(opParams({ z1Form: 'polar', z1Mod: 15, z1Arg: 30 }), 'z1', new Set(['z1Mod']));
  close(s.z1Mod, 10 / Math.cos(PI / 6), 1e-9);
  assert.equal(s.z1Re, 10);
  close(s.z1Im, 10 * Math.tan(PI / 6), 1e-9);
  close(arg(pointFromParams(s, 'z1')), PI / 6, 1e-12);
});

test('operation results: sum, difference, product, quotient, conjugate', () => {
  const r = (op) => computeOperation(opParams({ operation: op })).result;
  assert.deepEqual(r('add'), complex(3, 2));
  assert.deepEqual(r('sub'), complex(1, 0));
  assert.deepEqual(r('mul'), complex(1, 3));
  closeZ(r('div'), complex(1.5, -0.5), 1e-15);
  assert.deepEqual(r('conj'), complex(2, -1));
  const o = operationOutputs(opParams());
  assert.equal(o.resRe, 1);
  assert.equal(o.resIm, 3);
  close(o.resMod, Math.sqrt(10), 1e-12);
  close(o.resArg, Math.atan2(3, 1), 1e-12);
  close(o.z2Arg, PI / 4, 1e-15);
  // Division by zero is undefined, not a number on screen.
  const z = operationOutputs(opParams({ operation: 'div', z2Re: 0, z2Im: 0 }));
  assert.ok(Number.isNaN(z.resRe) && Number.isNaN(z.resMod));
});

test('power spiral: z = cis(π/6) returns to 1 after 12 steps; |zⁿ| = |z|ⁿ', () => {
  const p = opParams({ operation: 'power', z1Form: 'polar', z1Mod: 1, z1Arg: 30, powerN: 12 });
  const r = computeOperation(p);
  assert.equal(r.powers.length, 13);
  closeZ(r.result, complex(1, 0), 1e-12);
  closeZ(r.powers[3], complex(0, 1), 1e-12);
  const q = computeOperation(opParams({ operation: 'power', z1Form: 'polar', z1Mod: 1.2, z1Arg: 40, powerN: 7 }));
  close(modulus(q.result), 1.2 ** 7, 1e-12);
  close(wrapAngle(arg(q.result) - 7 * 40 * DEG), 0, 1e-12);
});

test('roots: of unity or of w = z₁, principal root reported', () => {
  const u = computeOperation(opParams({ operation: 'roots', rootN: 6, rootsOf: 'unity' }));
  assert.equal(u.roots.length, 6);
  closeZ(u.result, complex(1, 0), 1e-15);
  closeZ(u.roots[1], complex(0.5, Math.sqrt(3) / 2), 1e-12);
  const w = computeOperation(opParams({ operation: 'roots', rootN: 2, rootsOf: 'w', z1Re: 0, z1Im: 2 }));
  closeZ(w.result, complex(1, 1), 1e-12);
});

test('dragging snaps to the 0.1 grid, and to whole numbers near them', () => {
  // 80 px per unit: within 8 px (0.1 units) of an integer snaps to it.
  assert.deepEqual(snapCartesian(complex(1.96, -0.43), 80), complex(2, -0.4));
  assert.deepEqual(snapCartesian(complex(1.24, 0.06), 80), complex(1.2, 0));
  // Polar: modulus to 0.1 (or whole), argument to 1° (or a multiple of 15° within 3°)
  const s = snapPolar(fromPolar(2.04, 46.5 * DEG), 80);
  assert.equal(s.mod, 2);
  assert.equal(s.argDeg, 45);
  const t = snapPolar(fromPolar(1.73, 52.4 * DEG), 80);
  assert.equal(t.mod, 1.7);
  assert.equal(t.argDeg, 52);
});

// ---------------------------------------------------------------------------------------------
// Loci setup
// ---------------------------------------------------------------------------------------------

const cond = (type, rel, extra = {}) => ({ type, rel, a: complex(0, 0), b: complex(1, 0), r: 1, theta: 0, ...extra });

test('circle |z − (1 + i)| rel 2: centre in, boundary in only for ≤ and =', () => {
  const base = { a: complex(1, 1), r: 2 };
  const le = cond('modulus', 'le', base);
  const lt = cond('modulus', 'lt', base);
  const eq = cond('modulus', 'eq', base);
  const gt = cond('modulus', 'gt', base);
  assert.ok(satisfies(le, complex(1, 1)));
  assert.ok(satisfies(le, complex(3, 1)), 'on the circle, ≤');
  assert.ok(!satisfies(lt, complex(3, 1)), 'on the circle, <');
  assert.ok(satisfies(eq, complex(1, -1)), 'on the circle, =');
  // 1 + √2 + (1 + √2)i is on the circle (distance 2 at 45°)
  assert.ok(satisfies(eq, complex(1 + Math.SQRT2, 1 + Math.SQRT2)));
  assert.ok(!satisfies(le, complex(4, 1)));
  assert.ok(satisfies(gt, complex(4, 1)));
});

test('ray arg(z − 1) = π/4: points on the ray only, never the vertex', () => {
  const c = cond('argument', 'eq', { a: complex(1, 0), theta: PI / 4 });
  assert.ok(satisfies(c, complex(2, 1)));
  assert.ok(satisfies(c, complex(4, 3)));
  assert.ok(!satisfies(c, complex(1, 0)), 'arg 0 is undefined');
  assert.ok(!satisfies(c, complex(0, -1)), 'the opposite ray has arg −3π/4');
});

test('arg inequalities: the negative real direction from a has arg π', () => {
  const le = cond('argument', 'le', { theta: PI / 2 });
  assert.ok(satisfies(le, complex(1, 0)));
  assert.ok(satisfies(le, complex(0, 1)), 'arg i = π/2 ≤ π/2');
  assert.ok(satisfies(le, complex(-1, -1)), 'arg = −3π/4');
  assert.ok(!satisfies(le, complex(-1, 0)), 'arg(−1) = π > π/2');
  assert.ok(!satisfies(le, complex(0, 0)), 'vertex excluded');
  const gt = cond('argument', 'gt', { theta: PI / 2 });
  assert.ok(satisfies(gt, complex(-1, 0)));
  assert.ok(!satisfies(gt, complex(0, 1)));
});

test('perpendicular bisector |z − 1| = |z − i| is the line y = x; < means closer to 1', () => {
  const base = { a: complex(1, 0), b: complex(0, 1) };
  assert.ok(satisfies(cond('bisector', 'eq', base), complex(2, 2)));
  assert.ok(satisfies(cond('bisector', 'eq', base), complex(-3.5, -3.5)));
  assert.ok(!satisfies(cond('bisector', 'eq', base), complex(2, 1)));
  assert.ok(satisfies(cond('bisector', 'lt', base), complex(1, 0)));
  assert.ok(!satisfies(cond('bisector', 'lt', base), complex(0, 1)));
});

test('conditions read in z and in Cartesian form', () => {
  const c1 = cond('modulus', 'le', { a: complex(1, 1), r: 2 });
  assert.equal(conditionText(c1), '|z − (1 + i)| ≤ 2');
  assert.equal(cartesianText(c1), '(x − 1)² + (y − 1)² ≤ 4');
  const c2 = cond('modulus', 'eq', { a: complex(-2, 0), r: 1.5 });
  assert.equal(conditionText(c2), '|z + 2| = 1.5');
  assert.equal(cartesianText(c2), '(x + 2)² + y² = 2.25');
  // |z| = |z − 2i|: 0 = −4y + 4, so y = 1
  const c3 = cond('bisector', 'eq', { a: complex(0, 0), b: complex(0, 2) });
  assert.equal(conditionText(c3), '|z| = |z − 2i|');
  assert.equal(cartesianText(c3), 'y = 1');
  // |z − 1| < |z + 1|  ⇔  −4x < 0  ⇔  x > 0
  assert.equal(cartesianText(cond('bisector', 'lt', { a: complex(1, 0), b: complex(-1, 0) })), 'x > 0');
  // |z| ≥ |z − (2 + 2i)|  ⇔  4x + 4y ≥ 8  ⇔  x + y ≥ 2
  assert.equal(cartesianText(cond('bisector', 'ge', { a: complex(0, 0), b: complex(2, 2) })), 'x + y ≥ 2');
  // arg(z − 1) = π/4: y = x − 1 with x > 1
  const c4 = cond('argument', 'eq', { a: complex(1, 0), theta: PI / 4 });
  assert.equal(conditionText(c4), 'arg(z − 1) = π/4');
  assert.equal(cartesianText(c4), 'y = x − 1, x > 1');
  assert.equal(cartesianText(cond('argument', 'eq', { a: complex(0, -1), theta: PI / 2 })), 'x = 0, y > −1');
  assert.equal(cartesianText(cond('argument', 'eq', { a: complex(2, 1), theta: PI })), 'y = 1, x < 2');
});

test('condition params: degrees in, radians in the condition', () => {
  const p = { locus1: 'argument', rel1: 'ge', a1Re: 1, a1Im: -1, r1: 2, theta1: 135, b1Re: 0, b1Im: 0, locus2: 'none' };
  const c = conditionFromParams(p, 1);
  assert.equal(c.type, 'argument');
  close(c.theta, (3 * PI) / 4, 1e-15);
  assert.deepEqual(c.a, complex(1, -1));
  assert.equal(conditionFromParams(p, 2), null);
});

test('boundary pieces: inclusion follows the relation; the cut ray at π joins arg inequalities', () => {
  const circ = boundaryPieces(cond('modulus', 'lt', { r: 2 }));
  assert.equal(circ.length, 1);
  assert.equal(circ[0].kind, 'circle');
  assert.equal(circ[0].included, false);
  const ray = boundaryPieces(cond('argument', 'le', { theta: PI / 3 }));
  assert.equal(ray.length, 2);
  assert.deepEqual(ray.map((p) => [p.kind, p.included]), [['ray', true], ['ray', false]]);
  close(ray[1].angle, PI, 0);
  const ray2 = boundaryPieces(cond('argument', 'gt', { theta: PI / 3 }));
  assert.deepEqual(ray2.map((p) => p.included), [false, true]);
  const line = boundaryPieces(cond('bisector', 'ge', { a: complex(1, 0), b: complex(0, 1) }));
  assert.equal(line[0].kind, 'line');
  assert.equal(line[0].included, true);
});

test('the per-pixel test agrees with satisfies everywhere, boundary points included', () => {
  const conds = [];
  for (const type of ['modulus', 'argument', 'bisector']) {
    for (const rel of ['eq', 'lt', 'le', 'gt', 'ge']) {
      conds.push(cond(type, rel, { a: complex(1, -1), b: complex(-2, 0.5), r: 2, theta: (3 * PI) / 4 }));
      conds.push(cond(type, rel, { a: complex(0, 0), b: complex(0, 2), r: 1.5, theta: PI }));
    }
  }
  const pts = [complex(3, -1), complex(1, 1), complex(0, 0), complex(-1, -1), complex(1, -1), complex(-4, 0), complex(-0.5, -0.25), complex(0, 1), complex(1.5, 0)];
  for (let k = 0; k < 400; k++) pts.push(complex(Math.cos(k * 1.7) * (k % 7), Math.sin(k * 2.3) * (k % 5)));
  for (const c of conds) {
    const t = compileCondition(c);
    for (const z of pts) assert.equal(t(z.re, z.im), satisfies(c, z), `${c.type} ${c.rel} at ${z.re} + ${z.im}i`);
  }
});

test('per-pixel region: the unit disc covers π/4 of the square [−1, 1]² (1%)', () => {
  const grid = { x0: -1, x1: 1, y0: -1, y1: 1, cols: 400, rows: 400 };
  const mask = rasteriseRegion([cond('modulus', 'le', { r: 1 })], grid);
  const frac = mask.reduce((s, v) => s + v, 0) / mask.length;
  close(frac, PI / 4, 0.01 * (PI / 4));
  // Half-plane x > 0 from |z − 1| < |z + 1| covers half.
  const half = rasteriseRegion([cond('bisector', 'lt', { a: complex(1, 0), b: complex(-1, 0) })], { ...grid, cols: 401 });
  close(half.reduce((s, v) => s + v, 0) / half.length, 0.5, 0.005);
  // Intersection with a sector 0 ≤ arg z ≤ π/2: a quarter disc (π/16 of the square).
  const q = rasteriseRegion([cond('modulus', 'le', { r: 1 }), cond('argument', 'le', { theta: PI / 2 }), cond('argument', 'ge', { theta: 0 })], grid);
  close(q.reduce((s, v) => s + v, 0) / q.length, PI / 16, 0.02 * (PI / 16));
});

test('locus |z| = 2 with arg z ≥ 0 is the upper semicircle, both ends included', () => {
  const circle = boundaryPieces(cond('modulus', 'eq', { r: 2 }))[0];
  const { runs, ends } = clipPiece(circle, [cond('argument', 'ge', { theta: 0 })], { x0: -5, x1: 5, y0: -5, y1: 5 });
  assert.equal(runs.length, 1);
  for (const z of runs[0]) assert.ok(z.im >= -1e-9, 'upper half only');
  assert.equal(ends.length, 2);
  const byRe = [...ends].sort((p, q) => p.z.re - q.z.re);
  closeZ(byRe[0].z, complex(-2, 0), 1e-9);
  closeZ(byRe[1].z, complex(2, 0), 1e-9);
  assert.ok(byRe[0].included && byRe[1].included);
  // With arg z > 0 instead, 2 (arg 0) is excluded but −2 (arg π) is still included.
  const strict = clipPiece(circle, [cond('argument', 'gt', { theta: 0 })], { x0: -5, x1: 5, y0: -5, y1: 5 });
  const s = [...strict.ends].sort((p, q) => p.z.re - q.z.re);
  assert.equal(s[0].included, true, '−2 has arg π > 0');
  assert.equal(s[1].included, false, '2 has arg 0, not > 0');
});

test('region boundaries: only the sides that touch the region are bold', () => {
  const box = { x0: -5, x1: 5, y0: -5, y1: 5 };
  // Sector −π/4 ≤ arg z < π/3. Its edges are the two θ-rays. Each condition's cut ray (arg = π) is in the
  // closure of the other condition, but from the wrong side, so it must not be drawn as a region edge.
  const lower = cond('argument', 'ge', { theta: -PI / 4 });
  const upper = cond('argument', 'lt', { theta: PI / 3 });
  const [lowerRay, lowerCut] = boundaryPieces(lower);
  const [upperRay, upperCut] = boundaryPieces(upper);
  assert.equal(clipPiece(lowerCut, [upper], box).runs.length, 0, 'cut ray of arg ≥ −π/4');
  assert.equal(clipPiece(upperCut, [lower], box).runs.length, 0, 'cut ray of arg < π/3');
  assert.ok(clipPiece(lowerRay, [upper], box).whole, 'ray at −π/4 bounds the sector');
  assert.ok(clipPiece(upperRay, [lower], box).whole, 'ray at π/3 bounds the sector');
  // A single arg z ≤ π/2 is bounded by its θ-ray and by the cut ray.
  const half = cond('argument', 'le', { theta: PI / 2 });
  for (const piece of boundaryPieces(half)) assert.ok(clipPiece(piece, [], box).whole);
  // Disc |z| ≤ 2 and |z| > |z − 2| (nearer 2, so x > 1): the region's edges are the arc with x ≥ 1 and
  // the chord x = 1 between 1 ± √3 i.
  const disc = cond('modulus', 'le', { r: 2 });
  const right = cond('bisector', 'gt', { a: complex(0, 0), b: complex(2, 0) });
  const { runs } = clipPiece(boundaryPieces(disc)[0], [right], box);
  assert.equal(runs.length, 1);
  for (const z of runs[0]) assert.ok(z.re >= 1 - 1e-6, `arc point ${z.re}`);
  const chord = clipPiece(boundaryPieces(right)[0], [disc], box);
  assert.equal(chord.runs.length, 1);
  for (const z of chord.runs[0]) assert.ok(Math.abs(z.im) <= Math.sqrt(3) + 1e-6, 'chord between 1 ± √3 i');
});

test('two equalities meet at points: |z| = 2 and arg z = π/4 give √2 + √2 i', () => {
  const pts = intersections(cond('modulus', 'eq', { r: 2 }), cond('argument', 'eq', { theta: PI / 4 }), { x0: -5, x1: 5, y0: -5, y1: 5 });
  assert.equal(pts.length, 1);
  closeZ(pts[0], complex(Math.SQRT2, Math.SQRT2), 1e-9);
  // Circle |z| = 2 and the line x = 1 (|z| = |z − 2|) meet at 1 ± √3 i.
  const two = intersections(cond('modulus', 'eq', { r: 2 }), cond('bisector', 'eq', { a: complex(0, 0), b: complex(2, 0) }), { x0: -5, x1: 5, y0: -5, y1: 5 });
  assert.equal(two.length, 2);
  const sorted = two.sort((p, q) => p.im - q.im);
  closeZ(sorted[0], complex(1, -Math.sqrt(3)), 1e-9);
  closeZ(sorted[1], complex(1, Math.sqrt(3)), 1e-9);
});

test('loci outputs for the test point', () => {
  const p = {
    locus1: 'modulus', rel1: 'le', a1Re: 1, a1Im: 1, r1: 2, theta1: 45, b1Re: 0, b1Im: 0,
    locus2: 'argument', rel2: 'ge', a2Re: 0, a2Im: 0, r2: 1, theta2: 0, b2Re: 0, b2Im: 0,
    showProbe: true, zRe: 3, zIm: 1,
  };
  const o = lociOutputs(p);
  assert.equal(o.probeDistA1, 2);
  close(o.probeArgA1, 0, 0);
  close(o.probeArgA2, Math.atan2(1, 3), 1e-15);
  assert.equal(o.probeInside, 1);
  assert.equal(lociOutputs({ ...p, rel1: 'lt' }).probeInside, 0);
});

// ---------------------------------------------------------------------------------------------
// Polynomial-roots setup
// ---------------------------------------------------------------------------------------------

const realPoly = (...cs) => cs.map((c) => complex(c, 0));
const hasConjugate = (roots, z, tol) => roots.some((w) => Math.abs(w.re - z.re) <= tol && Math.abs(w.im + z.im) <= tol);

test('z³ − 3z² + 4z − 2 = (z − 1)(z² − 2z + 2): roots 1, 1 ± i (1e-10)', () => {
  const roots = polyRoots(realPoly(1, -3, 4, -2));
  assert.equal(roots.length, 3);
  closeZ(roots[0], complex(1, 0), 1e-10, 'real root first');
  closeZ(roots[1], complex(1, 1), 1e-10);
  closeZ(roots[2], complex(1, -1), 1e-10);
  assert.equal(roots[0].im, 0, 'real root is exactly real');
  assert.equal(roots[1].re, roots[2].re, 'pair mirrored exactly');
  assert.equal(roots[1].im, -roots[2].im, 'pair mirrored exactly');
});

test('z⁴ + 1: roots e^{i(π/4 + kπ/2)} in two conjugate pairs', () => {
  const roots = polyRoots(realPoly(1, 0, 0, 0, 1));
  assert.equal(roots.length, 4);
  const h = Math.SQRT1_2;
  for (const z of [complex(h, h), complex(h, -h), complex(-h, h), complex(-h, -h)]) {
    assert.ok(roots.some((w) => Math.abs(w.re - z.re) < 1e-12 && Math.abs(w.im - z.im) < 1e-12), `missing ${z.re} ${z.im}`);
  }
});

test('real coefficients: every non-real root has its conjugate; residuals are tiny', () => {
  const polys = [
    [1, 0, 1], // z² + 1
    [2, -3, 5], // 2z² − 3z + 5
    [1, 2, 3, 4], // z³ + 2z² + 3z + 4
    [-0.5, 1.3, -2.7, 0.9, 4.4],
    [3, 0, -1, 0, 7],
    [1, -10, 0.1, 10, -0.1],
  ];
  for (const cs of polys) {
    const coeffs = realPoly(...cs);
    const roots = polyRoots(coeffs);
    assert.equal(roots.length, cs.length - 1);
    const scale = Math.max(...cs.map(Math.abs));
    for (const z of roots) {
      assert.ok(hasConjugate(roots, z, 1e-12), `conjugate of ${z.re} + ${z.im}i for ${cs}`);
      const res = modulus(polyEval(coeffs, z));
      assert.ok(res < 1e-9 * scale * Math.max(1, modulus(z)) ** (cs.length - 1), `|P(z)| = ${res} for ${cs}`);
    }
  }
});

test('sweep: 3000 polynomials with slider coefficients (0.1 steps) all solve cleanly', () => {
  // Seeded LCG so the sweep is the same every run. Many coefficients are 0 or whole numbers, which is
  // where repeated roots and roots at 0 live.
  let seed = 20261125;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = () => {
    const r = rnd();
    if (r < 0.15) return 0;
    if (r < 0.35) return Math.round(rnd() * 8 - 4);
    return Math.round((rnd() * 20 - 10) * 10) / 10;
  };
  for (let trial = 0; trial < 3000; trial++) {
    const degree = 2 + Math.floor(rnd() * 3);
    const cs = Array.from({ length: degree + 1 }, pick);
    if (cs[0] === 0) cs[0] = 1;
    const coeffs = realPoly(...cs);
    const roots = polyRoots(coeffs);
    assert.equal(roots.length, degree, `${cs}`);
    for (const z of roots) {
      // Backward error: |P(z)| relative to Σ|aₖ||z|ᵏ is at rounding level.
      const size = cs.reduce((s, c) => s * Math.max(1, modulus(z)) + Math.abs(c), 0);
      assert.ok(modulus(polyEval(coeffs, z)) <= 1e-12 * size, `residual for ${cs}`);
      if (z.im !== 0) assert.ok(roots.some((w) => w.re === z.re && w.im === -z.im), `exact conjugate for ${cs}`);
    }
  }
});

test('Vieta: sum of roots −b/a and product (−1)ⁿ e/a (1e-10)', () => {
  const cs = [2, -3, 1, 4, -5]; // 2z⁴ − 3z³ + z² + 4z − 5
  const out = polynomialOutputs({ degree: 4, c4: 2, c3: -3, c2: 1, c1: 4, c0: -5, c0Im: 0 });
  close(out.rootSumRe, 3 / 2, 1e-10);
  close(out.rootSumIm, 0, 1e-12);
  close(out.rootProductRe, -5 / 2, 1e-10);
  close(out.rootProductIm, 0, 1e-12);
  const roots = polyRoots(realPoly(...cs));
  close(out.root1Re, roots[0].re, 0);
});

test('repeated roots: (z − 1)⁴, (z − 1)²(z + 2), (z² + 1)²', () => {
  // (z − 1)⁴ = z⁴ − 4z³ + 6z² − 4z + 1
  const r4 = polyRoots(realPoly(1, -4, 6, -4, 1));
  for (const z of r4) closeZ(z, complex(1, 0), 1e-9, '(z − 1)⁴');
  assert.deepEqual(rootGroups(r4).map((g) => g.multiplicity), [4]);
  // (z − 1)²(z + 2) = z³ − 3z + 2
  const r3 = polyRoots(realPoly(1, 0, -3, 2));
  const g3 = rootGroups(r3);
  assert.equal(g3.length, 2);
  closeZ(g3[0].z, complex(-2, 0), 1e-10);
  closeZ(g3[1].z, complex(1, 0), 1e-9);
  assert.equal(g3[1].multiplicity, 2);
  // (z² + 1)² = z⁴ + 2z² + 1: ±i, each double
  const ri = polyRoots(realPoly(1, 0, 2, 0, 1));
  const gi = rootGroups(ri);
  assert.equal(gi.length, 2);
  for (const g of gi) {
    assert.equal(g.multiplicity, 2);
    close(Math.abs(g.z.im), 1, 1e-9);
    close(g.z.re, 0, 1e-9);
  }
});

test('zero leading coefficient drops the degree; zero constant gives the root 0 exactly', () => {
  // 0z³ + z² − 4 → ±2
  const r = polyRoots(realPoly(0, 1, 0, -4));
  assert.equal(r.length, 2);
  closeZ(r[0], complex(-2, 0), 1e-12);
  closeZ(r[1], complex(2, 0), 1e-12);
  // z³ − z = z(z − 1)(z + 1)
  const s = polyRoots(realPoly(1, 0, -1, 0));
  assert.ok(s.some((z) => z.re === 0 && z.im === 0), 'exact zero root');
  assert.deepEqual(polyRoots(realPoly(0, 0, 3)), []);
});

test('the zero polynomial: every z is a root, not "no roots"', () => {
  const zero = { degree: 1, c4: 0, c3: 0, c2: 0, c1: 0, c0: 0, c0Im: 0 };
  assert.ok(isZeroPolynomial(polyCoefficients(zero)));
  assert.equal(polyText(polyCoefficients(zero)), '0');
  const out = polynomialOutputs(zero);
  assert.ok(Number.isNaN(out.realRootCount) && Number.isNaN(out.root1Re) && Number.isNaN(out.rootSumRe));
  // A non-zero constant really has no roots.
  const constant = { ...zero, c0: 3 };
  assert.ok(!isZeroPolynomial(polyCoefficients(constant)));
  assert.equal(polynomialOutputs(constant).realRootCount, 0);
  assert.ok(!isZeroPolynomial(polyCoefficients({ ...zero, c0Im: 0.5 })), 'i/2 is not zero');
});

test('a non-real coefficient breaks the mirror symmetry', () => {
  // z² + 1 + i: roots are ±√(−1 − i), not conjugates of each other
  const roots = polyRoots([complex(1, 0), complex(0, 0), complex(1, 1)]);
  assert.equal(roots.length, 2);
  for (const z of roots) assert.ok(!hasConjugate(roots, z, 1e-6));
  for (const z of roots) closeZ(mul(z, z), complex(-1, -1), 1e-12);
});

test('polynomial params and text', () => {
  const p = { degree: 3, c4: 1, c3: 1, c2: -3, c1: 4, c0: -2, c0Im: 0 };
  const cs = polyCoefficients(p);
  assert.equal(cs.length, 4);
  assert.equal(polyText(cs), 'z³ − 3z² + 4z − 2');
  assert.equal(polyText(polyCoefficients({ ...p, degree: 4, c4: -2, c3: 0, c2: 1, c1: -1, c0: 0.5 })), '−2z⁴ + z² − z + 0.5');
  assert.equal(polyText(polyCoefficients({ ...p, c0Im: 0.5 })), 'z³ − 3z² + 4z + (−2 + 0.5i)');
  const out = polynomialOutputs(p);
  assert.equal(out.realRootCount, 1);
  close(out.root2Re, 1, 1e-10);
  close(out.root2Im, 1, 1e-10);
  assert.ok(Number.isNaN(out.root4Re), 'no fourth root for a cubic');
});
