// argand model: complex arithmetic, loci and polynomial roots. Pure: no DOM, no timers, no randomness.
// Importable in Node: tests/engines/argand.test.mjs checks it against analytic answers.
//
// Complex numbers are plain objects { re, im }. Arguments are principal values in (−π, π].
// Params carry angles in degrees (sliders); everything here works in radians.
import { formatNumber, MINUS, NNBSP, superscript } from '../../format.js';

export const DEG = Math.PI / 180;
const PI = Math.PI;
const TAU = 2 * Math.PI;

// ---------------------------------------------------------------------------------------------
// Complex arithmetic
// ---------------------------------------------------------------------------------------------

export function complex(re = 0, im = 0) {
  return { re, im };
}

/** r(cos θ + i sin θ). Components smaller than 1e-14·r are set to exactly 0 (so 2 cis 90° is 2i). */
export function fromPolar(r, theta) {
  const re = r * Math.cos(theta);
  const im = r * Math.sin(theta);
  const tiny = 1e-14 * Math.abs(r);
  return { re: Math.abs(re) < tiny ? 0 : re, im: Math.abs(im) < tiny ? 0 : im };
}

export function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function sub(a, b) {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function mul(a, b) {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function scale(a, k) {
  return { re: a.re * k, im: a.im * k };
}

/** a / b by Smith's method (no overflow for large b). Division by 0 gives NaN + NaN i. */
export function div(a, b) {
  if (b.re === 0 && b.im === 0) return { re: NaN, im: NaN };
  if (Math.abs(b.re) >= Math.abs(b.im)) {
    const r = b.im / b.re;
    const d = b.re + b.im * r;
    return { re: (a.re + a.im * r) / d, im: (a.im - a.re * r) / d };
  }
  const r = b.re / b.im;
  const d = b.re * r + b.im;
  return { re: (a.re * r + a.im) / d, im: (a.im * r - a.re) / d };
}

export function conj(a) {
  return { re: a.re, im: 0 - a.im };
}

export function modulus(a) {
  return Math.hypot(a.re, a.im);
}

/** Principal argument in (−π, π]. arg 0 is undefined (NaN). −0 on the negative real axis still gives π. */
export function arg(a) {
  if (a.re === 0 && a.im === 0) return NaN;
  if (a.im === 0) return a.re < 0 ? PI : 0;
  const t = Math.atan2(a.im, a.re);
  return t <= -PI ? PI : t; // a tiny negative Im can round atan2 to −π, which is outside (−π, π]
}

/**
 * arg z after removing rounding noise (components below 1e-12 of the larger one), for computed results:
 * (cis π/3)³ comes out as −1 − 1e-16 i, whose principal argument is π, not "−π".
 */
export function principalArg(z) {
  return arg(cleanZ(z));
}

/** Map any angle into (−π, π]. Values within 1e-12 of an odd multiple of π go to +π. */
export function wrapAngle(theta) {
  if (!Number.isFinite(theta)) return theta;
  const k = Math.ceil((theta - PI) / TAU - 1e-12);
  const w = theta - k * TAU;
  if (w > PI) return PI; // within 1e-12 of π
  return w <= -PI ? w + TAU : w;
}

export function isFiniteZ(a) {
  return Number.isFinite(a.re) && Number.isFinite(a.im);
}

/** zⁿ for integer n by repeated squaring (so de Moivre is a test, not an assumption). */
export function pow(z, n) {
  let k = Math.trunc(n);
  if (k < 0) return div(complex(1, 0), pow(z, -k));
  let result = complex(1, 0);
  let base = { ...z };
  while (k > 0) {
    if (k & 1) result = mul(result, base);
    base = mul(base, base);
    k >>= 1;
  }
  return result;
}

/** [z⁰, z¹, …, zⁿ] by repeated multiplication by z. */
export function powers(z, n) {
  const out = [complex(1, 0)];
  for (let k = 1; k <= n; k++) out.push(mul(out[k - 1], z));
  return out;
}

/** The n roots of zⁿ = w: |w|^(1/n) cis((arg w + 2kπ)/n), k = 0 … n − 1 (k = 0 is the principal root). */
export function nthRoots(w, n) {
  const r = modulus(w);
  if (r === 0) return Array.from({ length: n }, () => complex(0, 0));
  const rr = r ** (1 / n);
  const theta = arg(w);
  return Array.from({ length: n }, (_, k) => fromPolar(rr, (theta + TAU * k) / n));
}

/** Set floating noise (|x| < 1e-12 × scale) to exactly 0. */
export function clean(x, scaleRef = 1) {
  return Math.abs(x) < 1e-12 * Math.max(1, Math.abs(scaleRef)) ? 0 : x;
}

function cleanZ(z) {
  const s = Math.max(Math.abs(z.re), Math.abs(z.im));
  return { re: clean(z.re, s), im: clean(z.im, s) };
}

// ---------------------------------------------------------------------------------------------
// Display text (pure). Exact forms where they exist: 1 + 3i, √10, 3π/4.
// ---------------------------------------------------------------------------------------------

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Largest magnitude shown with every digit (an exact value below a billion, e.g. 3¹⁶ = 43 046 721). */
const EXACT_MAX = 1e9;
/** Approximate values from this magnitude up use scientific notation, so "208 000" never passes for exact. */
const SCI_ABOVE = 1e3;

/**
 * The exact value of x if x has at most 3 decimal places (to within 1e-9, an absolute tolerance, so a
 * large number only qualifies when it is a whole number to rounding error), otherwise null.
 */
function exactValue(x) {
  const r = Math.round(x * 1000) / 1000;
  if (r === 0 || Math.abs(r) >= EXACT_MAX || Math.abs(x - r) >= 1e-9) return null;
  return r;
}

/** Every digit of an exact value: true minus, thousands grouped from 10 000 ("43 046 721", "−1.5"). */
function exactText(r) {
  const [int, frac] = String(Math.abs(r)).split('.');
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP) : int;
  return `${r < 0 ? MINUS : ''}${grouped}${frac ? `.${frac}` : ''}`;
}

/** 3 s.f., in scientific notation from 1000 up (and below 0.001). */
function approxText(x, sigfigs) {
  return formatNumber(x, { sigfigs, sciAbove: SCI_ABOVE });
}

/**
 * A number as a teacher would write it: every digit when it is exact to 3 decimal places ("2.25", "−1.5",
 * "43 046 721"), otherwise 3 s.f. with scientific notation from 1000 up ("1.59", "−2.08 × 10⁵").
 */
export function numText(x, sigfigs = 3) {
  if (!Number.isFinite(x)) return formatNumber(x);
  if (Math.abs(x) < 1e-12) return '0';
  const r = exactValue(x);
  return r === null ? approxText(x, sigfigs) : exactText(r);
}

/** Would numText use scientific notation for x? */
function isScientific(x) {
  return Math.abs(x) >= 1e-12 && exactValue(x) === null && (Math.abs(x) >= SCI_ABOVE || Math.abs(x) < 1e-3);
}

/**
 * "1 + 3i", "−i", "2.5", "undefined". If either part needs scientific notation, both parts are written
 * that way (3 s.f.), so one number never mixes formats.
 */
export function complexText(z) {
  if (!isFiniteZ(z)) return 'undefined';
  const { re, im } = cleanZ(z);
  const sci = isScientific(re) || isScientific(im);
  const part = (v) => (sci && v !== 0 ? approxText(v, 3) : numText(v));
  if (im === 0) return part(re);
  const mag = part(Math.abs(im));
  const imPart = mag === '1' ? 'i' : `${mag}i`;
  if (re === 0) return im < 0 ? `${MINUS}${imPart}` : imPart;
  return `${part(re)} ${im < 0 ? MINUS : '+'} ${imPart}`;
}

/**
 * An irrational modulus as an exact surd, "√5", "2√2", "√5/2", "7√5/10", when m² is a fraction with a
 * small denominator (q² for q ≤ 10) and the simplified radicand is below SURD_MAX (so not "√218/10").
 * Rational and other values give null.
 */
const SURD_MAX = 100;
export function surdText(m) {
  if (!Number.isFinite(m) || m <= 0) return null;
  const s = m * m;
  if (s > 1e6) return null;
  for (let q = 1; q <= 10; q++) {
    const scaled = s * q * q;
    const n = Math.round(scaled);
    if (n < 1 || Math.abs(scaled - n) > 1e-9 * Math.max(1, n)) continue;
    let k = 1;
    let f = n;
    for (let p = 2; p * p <= f; p++) {
      while (f % (p * p) === 0) {
        f /= p * p;
        k *= p;
      }
    }
    if (f === 1 || f >= SURD_MAX) return null; // rational (a decimal is exact), or an unhelpful radicand
    const g = gcd(k, q);
    const kk = k / g;
    const qq = q / g;
    return `${kk === 1 ? '' : kk}√${f}${qq === 1 ? '' : `/${qq}`}`;
  }
  return null;
}

/** "√5 ≈ 2.24" for a surd, "2.5" for a decimal. */
export function modulusText(m) {
  if (!Number.isFinite(m)) return 'undefined';
  const surd = surdText(m);
  return surd ? `${surd} ≈ ${formatNumber(m)}` : numText(m);
}

/** Exact multiple of π (denominators up to 12), else a 3 s.f. decimal. unit 'deg' gives degrees. */
export function angleText(rad, unit = 'rad') {
  if (!Number.isFinite(rad)) return 'undefined';
  if (unit === 'deg') return `${numText(rad / DEG)}°`;
  const k = rad / PI;
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(k * q);
    if (Math.abs(k - p / q) < 1e-9) {
      if (p === 0) return '0';
      const g = gcd(p, q);
      const [pp, qq] = [p / g, q / g];
      const sign = pp < 0 ? MINUS : '';
      const num = Math.abs(pp) === 1 ? 'π' : `${Math.abs(pp)}π`;
      return qq === 1 ? `${sign}${num}` : `${sign}${num}/${qq}`;
    }
  }
  return numText(rad);
}

// ---------------------------------------------------------------------------------------------
// Operations setup
// ---------------------------------------------------------------------------------------------

export const OPERATIONS = ['add', 'sub', 'mul', 'div', 'conj', 'power', 'roots'];
/** Operations that use z₂. */
export const BINARY = ['add', 'sub', 'mul', 'div'];

/**
 * Points live in the square −10 ≤ Re, Im ≤ 10. The modulus range (0 to 15) covers the whole square
 * (|z| ≤ 10√2 ≈ 14.1), and polar entry is kept inside the square, so the two forms always describe the
 * same point and switching between them never moves it.
 */
export const SQUARE = 10;
const RANGE = { Re: [-SQUARE, SQUARE], Im: [-SQUARE, SQUARE], Mod: [0, 15], Arg: [-180, 180] };

function tidy(x) {
  return Number(x.toFixed(10)) + 0; // + 0 turns −0 into 0
}

function clampTo(x, [lo, hi]) {
  return Math.min(hi, Math.max(lo, x));
}

/** A value with at most 3 decimal places: typed or dragged, rather than derived from the other form. */
function isShort(v) {
  return Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6;
}

function pairs(params, which) {
  const zc = complex(params[`${which}Re`], params[`${which}Im`]);
  const zp = fromPolar(params[`${which}Mod`], params[`${which}Arg`] * DEG);
  const consistent = modulus(sub(zc, zp)) <= 1e-9 * Math.max(1, modulus(zc));
  return { zc, zp, consistent };
}

/**
 * z₁ or z₂ from its params: r cis θ (θ in degrees) in polar form, else a + bi. When the two pairs agree,
 * the pair the user entered is used exactly (the other was derived from it and rounded to 10 decimal
 * places), so 9 + 8i stays exactly 9 + 8i in polar form and 2 cis 30° stays exact in Cartesian form.
 */
export function pointFromParams(params, which) {
  const { zc, zp, consistent } = pairs(params, which);
  const cartShort = isShort(zc.re) && isShort(zc.im);
  const polarShort = isShort(params[`${which}Mod`]) && isShort(params[`${which}Arg`]);
  if (params[`${which}Form`] === 'polar') return consistent && cartShort && !polarShort ? zc : zp;
  return consistent && polarShort && !cartShort ? zp : zc;
}

/**
 * Keep a point's Cartesian and polar params in step. The pair the user just changed is the source. If
 * neither changed (for example the entry form was switched) and the pairs already agree, nothing moves;
 * otherwise the point's form decides. Polar entry outside the square is pulled in along its ray.
 * Returns a new params object.
 * @param {Set<string>} changed keys present in the latest update
 */
export function syncPoint(params, which, changed) {
  const key = (s) => `${which}${s}`;
  const cart = changed.has(key('Re')) || changed.has(key('Im'));
  const polar = changed.has(key('Mod')) || changed.has(key('Arg'));
  if (!cart && !polar && pairs(params, which).consistent) return { ...params };
  const usePolar = polar && !cart ? true : cart && !polar ? false : params[key('Form')] === 'polar';
  const out = { ...params };
  if (usePolar) {
    let z = fromPolar(params[key('Mod')], params[key('Arg')] * DEG);
    const reach = Math.max(Math.abs(z.re), Math.abs(z.im));
    if (reach > SQUARE) {
      out[key('Mod')] = tidy((params[key('Mod')] * SQUARE) / reach);
      z = fromPolar(out[key('Mod')], params[key('Arg')] * DEG);
    }
    out[key('Re')] = clampTo(tidy(z.re), RANGE.Re);
    out[key('Im')] = clampTo(tidy(z.im), RANGE.Im);
  } else {
    const z = complex(params[key('Re')], params[key('Im')]);
    out[key('Mod')] = clampTo(tidy(modulus(z)), RANGE.Mod);
    const a = arg(z);
    if (Number.isFinite(a)) out[key('Arg')] = clampTo(tidy(a / DEG), RANGE.Arg); // z = 0 keeps its angle
  }
  return out;
}

/**
 * Result of the chosen operation, plus the extra points each view needs.
 * power: z₁⁰ … z₁ⁿ; roots: the n roots of zⁿ = w (w = 1 or z₁), principal root first.
 */
export function computeOperation(params) {
  const op = params.operation;
  const z1 = pointFromParams(params, 'z1');
  const z2 = pointFromParams(params, 'z2');
  const out = { op, z1, z2, result: null, powers: null, roots: null, w: null };
  switch (op) {
    case 'add':
      out.result = add(z1, z2);
      break;
    case 'sub':
      out.result = sub(z1, z2);
      break;
    case 'mul':
      out.result = mul(z1, z2);
      break;
    case 'div':
      out.result = div(z1, z2);
      break;
    case 'conj':
      out.result = conj(z1);
      break;
    case 'power':
      out.powers = powers(z1, params.powerN);
      out.result = out.powers[params.powerN];
      break;
    case 'roots':
      out.w = params.rootsOf === 'w' ? z1 : complex(1, 0);
      out.roots = nthRoots(out.w, params.rootN);
      out.result = out.roots[0];
      break;
    default:
      throw new Error(`argand: unknown operation "${op}"`);
  }
  return out;
}

function pack(z) {
  if (!z || !isFiniteZ(z)) return { re: NaN, im: NaN, mod: NaN, arg: NaN };
  const c = cleanZ(z);
  return { re: c.re, im: c.im, mod: modulus(c), arg: arg(c) };
}

/** Outputs (radians for arguments, unrounded, floating noise removed). */
export function operationOutputs(params) {
  const r = computeOperation(params);
  const a = pack(r.z1);
  const b = pack(r.z2);
  const c = pack(r.result);
  return {
    z1Re: a.re, z1Im: a.im, z1Mod: a.mod, z1Arg: a.arg,
    z2Re: b.re, z2Im: b.im, z2Mod: b.mod, z2Arg: b.arg,
    resRe: c.re, resIm: c.im, resMod: c.mod, resArg: c.arg,
  };
}

/** Snap a dragged point to the 0.1 grid, or to a whole number within min(0.12, 8 px). */
export function snapCartesian(z, pxPerUnit) {
  const reach = Math.min(0.12, 8 / pxPerUnit);
  const snap = (v) => {
    const n = Math.round(v);
    return (Math.abs(v - n) <= reach ? n : Math.round(v * 10) / 10) + 0;
  };
  return complex(snap(z.re), snap(z.im));
}

/** Snap in polar form: modulus to 0.1 (or whole), argument to 1° (or a multiple of 15° within 3°). */
export function snapPolar(z, pxPerUnit, fallbackArgDeg = 0) {
  const reach = Math.min(0.12, 8 / pxPerUnit);
  const m = modulus(z);
  const n = Math.round(m);
  const mod = (Math.abs(m - n) <= reach ? n : Math.round(m * 10) / 10) + 0;
  const a = arg(z);
  if (!Number.isFinite(a)) return { mod, argDeg: fallbackArgDeg };
  const d = a / DEG;
  const fifteen = Math.round(d / 15) * 15;
  let argDeg = Math.abs(d - fifteen) <= 3 ? fifteen : Math.round(d);
  if (argDeg <= -180) argDeg = 180;
  return { mod, argDeg: argDeg + 0 };
}

// ---------------------------------------------------------------------------------------------
// Loci setup
// ---------------------------------------------------------------------------------------------

export const RELATIONS = ['eq', 'lt', 'le', 'gt', 'ge'];
export const REL_SYMBOL = { eq: '=', lt: '<', le: '≤', gt: '>', ge: '≥' };
const FLIP = { eq: 'eq', lt: 'gt', le: 'ge', gt: 'lt', ge: 'le' };
const NON_STRICT = new Set(['eq', 'le', 'ge']);

/** Condition i (1 or 2) from params, angles converted to radians; null when locus2 is 'none'. */
export function conditionFromParams(params, i) {
  const type = params[`locus${i}`];
  if (!type || type === 'none') return null;
  return {
    type,
    rel: params[`rel${i}`],
    a: complex(params[`a${i}Re`], params[`a${i}Im`]),
    b: complex(params[`b${i}Re`], params[`b${i}Im`]),
    r: params[`r${i}`],
    theta: params[`theta${i}`] * DEG,
  };
}

export function conditionsFromParams(params) {
  return [conditionFromParams(params, 1), conditionFromParams(params, 2)].filter(Boolean);
}

/** The compared quantity, left side minus right side. NaN where it is undefined (arg at z = a). */
export function conditionValue(c, z) {
  switch (c.type) {
    case 'modulus':
      return modulus(sub(z, c.a)) - c.r;
    case 'bisector':
      return modulus(sub(z, c.a)) - modulus(sub(z, c.b));
    case 'argument':
      return arg(sub(z, c.a)) - c.theta;
    default:
      throw new Error(`argand: unknown locus "${c.type}"`);
  }
}

function tolFor(c, z) {
  return 1e-9 * (1 + modulus(z) + modulus(c.a) + (c.type === 'bisector' ? modulus(c.b) : 0) + (c.type === 'modulus' ? c.r : 0));
}

/** Does z satisfy the condition exactly as written (strict or not)? */
export function satisfies(c, z) {
  const v = conditionValue(c, z);
  if (Number.isNaN(v)) return false;
  const tol = c.type === 'argument' ? 1e-9 : tolFor(c, z);
  switch (c.rel) {
    case 'eq':
      return Math.abs(v) <= tol;
    case 'lt':
      return v < -tol;
    case 'le':
      return v <= tol;
    case 'gt':
      return v > tol;
    case 'ge':
      return v >= -tol;
    default:
      throw new Error(`argand: unknown relation "${c.rel}"`);
  }
}

/** Inside the closure of the condition's set (used to clip curves; boundaries count as inside). */
function insideClosure(c, z) {
  if (c.type === 'argument') {
    const w = sub(z, c.a);
    if (modulus(w) < 1e-12) return true;
    const a = arg(w);
    if (c.rel === 'lt' || c.rel === 'le') return a <= c.theta + 1e-12 || a >= PI - 1e-12;
    if (c.rel === 'gt' || c.rel === 'ge') return a >= c.theta - 1e-12;
    return Math.abs(a - c.theta) <= 1e-12;
  }
  return satisfies({ ...c, rel: c.rel === 'lt' ? 'le' : c.rel === 'gt' ? 'ge' : c.rel }, z);
}

/** "z − (1 + i)", "z + 2", "z − 2i", "z". */
export function zMinus(a) {
  const { re, im } = cleanZ(a);
  if (re === 0 && im === 0) return 'z';
  if (im === 0) return re < 0 ? `z + ${numText(-re)}` : `z − ${numText(re)}`;
  if (re === 0) return im < 0 ? `z + ${complexText(complex(0, -im))}` : `z − ${complexText(complex(0, im))}`;
  return `z − (${complexText(a)})`;
}

/** The condition as written in z: "|z − (1 + i)| ≤ 2", "arg(z − 1) = π/4", "|z| = |z − 2i|". */
export function conditionText(c, unit = 'rad') {
  const rel = REL_SYMBOL[c.rel];
  if (c.type === 'modulus') return `|${zMinus(c.a)}| ${rel} ${numText(c.r)}`;
  if (c.type === 'bisector') return `|${zMinus(c.a)}| ${rel} |${zMinus(c.b)}|`;
  const inner = zMinus(c.a);
  return `arg${inner === 'z' ? ' z' : `(${inner})`} ${rel} ${angleText(c.theta, unit)}`;
}

function shifted(v, x) {
  const c = clean(v);
  if (c === 0) return `${x}²`;
  return c > 0 ? `(${x} − ${numText(c)})²` : `(${x} + ${numText(-c)})²`;
}

/** "px + qy rel s" with whole-number coefficients where the inputs allow, leading coefficient positive. */
function linearText(P, Q, S, rel) {
  let [p, q, s, r] = [P, Q, S, rel];
  const lead = Math.abs(p) > 1e-12 ? p : q;
  if (lead < 0) [p, q, s, r] = [-p, -q, -s, FLIP[r]];
  const ints = [p, q, s].map((v) => Math.round(v * 100));
  if ([p, q, s].every((v, i) => Math.abs(v * 100 - ints[i]) < 1e-6)) {
    const g = ints.reduce((acc, v) => gcd(acc, v), 0) || 1;
    [p, q, s] = ints.map((v) => v / g);
  }
  const term = (coef, name, first) => {
    if (Math.abs(coef) < 1e-12) return '';
    const mag = numText(Math.abs(coef));
    const body = mag === '1' ? name : `${mag}${name}`;
    if (first) return coef < 0 ? `${MINUS}${body}` : body;
    return coef < 0 ? ` ${MINUS} ${body}` : ` + ${body}`;
  };
  const left = `${term(p, 'x', true)}${term(q, 'y', Math.abs(p) < 1e-12)}`;
  return `${left} ${REL_SYMBOL[r]} ${numText(s)}`;
}

/** The condition in x and y (z = x + iy). For arg inequalities (sectors) this is null. */
export function cartesianText(c) {
  const rel = REL_SYMBOL[c.rel];
  if (c.type === 'modulus') return `${shifted(c.a.re, 'x')} + ${shifted(c.a.im, 'y')} ${rel} ${numText(c.r * c.r)}`;
  if (c.type === 'bisector') {
    // |z − a|² − |z − b|² = −2(a₁ − b₁)x − 2(a₂ − b₂)y + |a|² − |b|², so the condition is
    // 2(b₁ − a₁)x + 2(b₂ − a₂)y rel |b|² − |a|².
    const P = 2 * (c.b.re - c.a.re);
    const Q = 2 * (c.b.im - c.a.im);
    if (Math.abs(P) < 1e-12 && Math.abs(Q) < 1e-12) return null;
    const S = c.b.re ** 2 + c.b.im ** 2 - c.a.re ** 2 - c.a.im ** 2;
    return linearText(P, Q, S, c.rel);
  }
  if (c.rel !== 'eq') return null;
  const cos = Math.cos(c.theta);
  const sin = Math.sin(c.theta);
  const [x0, y0] = [numText(c.a.re), numText(c.a.im)];
  if (Math.abs(cos) < 1e-12) return `x = ${x0}, y ${sin > 0 ? '>' : '<'} ${y0}`;
  if (Math.abs(sin) < 1e-12) return `y = ${y0}, x ${cos > 0 ? '>' : '<'} ${x0}`;
  const m = sin / cos;
  const k = c.a.im - m * c.a.re;
  const mt = numText(Math.abs(m));
  const slope = `${m < 0 ? MINUS : ''}${mt === '1' ? '' : mt}x`;
  const kc = clean(k);
  const intercept = kc === 0 ? '' : kc > 0 ? ` + ${numText(kc)}` : ` − ${numText(-kc)}`;
  return `y = ${slope}${intercept}, x ${cos > 0 ? '>' : '<'} ${x0}`;
}

/** A short description of the set in words. */
export function conditionWords(c) {
  const strict = !NON_STRICT.has(c.rel);
  const edge = c.rel === 'eq' ? '' : strict ? ', boundary not included' : ', boundary included';
  if (c.type === 'modulus') {
    if (c.rel === 'eq') return `Circle, centre ${complexText(c.a)}, radius ${numText(c.r)}`;
    return `${c.rel === 'lt' || c.rel === 'le' ? 'Inside' : 'Outside'} the circle, centre ${complexText(c.a)}, radius ${numText(c.r)}${edge}`;
  }
  if (c.type === 'bisector') {
    if (modulus(sub(c.a, c.b)) < 1e-12) return 'a = b, so every point is the same distance from both';
    if (c.rel === 'eq') return `Perpendicular bisector of ${complexText(c.a)} and ${complexText(c.b)}`;
    const nearer = c.rel === 'lt' || c.rel === 'le' ? complexText(c.a) : complexText(c.b);
    return `Points nearer ${nearer}${edge}`;
  }
  if (c.rel === 'eq') return `Ray from ${complexText(c.a)} (the point ${complexText(c.a)} itself is not included)`;
  return `Sector at ${complexText(c.a)} (vertex not included)${edge}`;
}

/**
 * Analytic boundary pieces for drawing.
 * circle { c, r }, line { p, d } (d a unit direction), ray { from, angle } (vertex excluded).
 * `included` is true when the boundary belongs to the set. Arg inequalities add the cut ray at angle π
 * (points there have arg π, so they belong to arg > θ and arg ≥ θ, never to arg < θ or arg ≤ θ).
 */
export function boundaryPieces(c) {
  const included = NON_STRICT.has(c.rel);
  const below = c.rel === 'lt' || c.rel === 'le';
  if (c.type === 'modulus') return [{ kind: 'circle', c: c.a, r: c.r, included, side: c.rel === 'eq' ? 0 : below ? 1 : -1 }];
  if (c.type === 'bisector') {
    const d = sub(c.b, c.a);
    const len = modulus(d);
    if (len < 1e-12) return [];
    // The set lies towards a for < and ≤ (nearer a), towards b for > and ≥.
    const towardsB = complex(d.re / len, d.im / len);
    const normal = c.rel === 'eq' ? null : below ? scale(towardsB, -1) : towardsB;
    return [{ kind: 'line', p: scale(add(c.a, c.b), 0.5), d: complex(-d.im / len, d.re / len), included, normal }];
  }
  // arg < θ lies clockwise of the θ-ray and just below the cut; arg > θ anticlockwise and just above it.
  const cw = complex(Math.sin(c.theta), -Math.cos(c.theta));
  const pieces = [{ kind: 'ray', from: c.a, angle: c.theta, included, cut: false, normal: c.rel === 'eq' ? null : below ? cw : scale(cw, -1) }];
  if (c.rel !== 'eq' && Math.abs(c.theta - PI) > 1e-12) {
    pieces.push({ kind: 'ray', from: c.a, angle: PI, included: !below, cut: true, normal: below ? complex(0, -1) : complex(0, 1) });
  }
  return pieces;
}

/** Unit normal at z pointing into the condition's set (null for an equality: the curve is the set). */
export function insideNormal(piece, z) {
  if (piece.kind !== 'circle') return piece.normal ?? null;
  if (!piece.side) return null;
  const v = sub(piece.c, z);
  const len = modulus(v) || 1;
  return scale(v, piece.side / len);
}

/**
 * Per-pixel region test on a grid of cell centres. Row 0 is the top (y1).
 * @param {object[]} conds  every condition must hold
 * @param {{ x0:number, x1:number, y0:number, y1:number, cols:number, rows:number }} grid
 * @returns {Uint8Array} 1 inside, 0 outside
 */
export function rasteriseRegion(conds, { x0, x1, y0, y1, cols, rows }, out = new Uint8Array(cols * rows)) {
  const dx = (x1 - x0) / cols;
  const dy = (y1 - y0) / rows;
  const tests = conds.map(compileCondition);
  for (let j = 0; j < rows; j++) {
    const y = y1 - (j + 0.5) * dy;
    for (let i = 0; i < cols; i++) {
      const x = x0 + (i + 0.5) * dx;
      let inside = 1;
      for (const t of tests) {
        if (!t(x, y)) {
          inside = 0;
          break;
        }
      }
      out[j * cols + i] = inside;
    }
  }
  return out;
}

/**
 * satisfies(c, x + iy) as an allocation-free (x, y) => boolean, for per-pixel tests. Same formulas and
 * tolerances as satisfies (a test checks they agree).
 */
export function compileCondition(c) {
  const [ax, ay] = [c.a.re, c.a.im];
  const [bx, by] = [c.b.re, c.b.im];
  const aMod = Math.hypot(ax, ay);
  const extra = c.type === 'bisector' ? Math.hypot(bx, by) : c.type === 'modulus' ? c.r : 0;
  let value;
  const dist = (x, y, px, py) => Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
  if (c.type === 'modulus') value = (x, y) => dist(x, y, ax, ay) - c.r;
  else if (c.type === 'bisector') value = (x, y) => dist(x, y, ax, ay) - dist(x, y, bx, by);
  else {
    value = (x, y) => {
      const u = x - ax;
      const v = y - ay;
      if (u === 0 && v === 0) return NaN;
      return (v === 0 ? (u < 0 ? PI : 0) : Math.atan2(v, u)) - c.theta;
    };
  }
  const tol = c.type === 'argument' ? () => 1e-9 : (x, y) => 1e-9 * (1 + Math.sqrt(x * x + y * y) + aMod + extra);
  switch (c.rel) {
    case 'eq':
      return (x, y) => Math.abs(value(x, y)) <= tol(x, y);
    case 'lt':
      return (x, y) => value(x, y) < -tol(x, y);
    case 'le':
      return (x, y) => value(x, y) <= tol(x, y);
    case 'gt':
      return (x, y) => value(x, y) > tol(x, y);
    case 'ge':
      return (x, y) => value(x, y) >= -tol(x, y);
    default:
      throw new Error(`argand: unknown relation "${c.rel}"`);
  }
}

/** A piece as a parametric curve inside the box: { at(t), t0, t1, closed }. null if it misses the box. */
export function pieceCurve(piece, box) {
  if (piece.kind === 'circle') {
    const { c, r } = piece;
    return { at: (t) => complex(c.re + r * Math.cos(t), c.im + r * Math.sin(t)), t0: 0, t1: TAU, closed: true };
  }
  const origin = piece.kind === 'ray' ? piece.from : piece.p;
  const d = piece.kind === 'ray' ? fromPolar(1, piece.angle) : piece.d;
  // Liang–Barsky clip of origin + t·d against the box.
  let lo = piece.kind === 'ray' ? 0 : -Infinity;
  let hi = Infinity;
  for (const [p, q] of [
    [-d.re, origin.re - box.x0],
    [d.re, box.x1 - origin.re],
    [-d.im, origin.im - box.y0],
    [d.im, box.y1 - origin.im],
  ]) {
    if (Math.abs(p) < 1e-15) {
      if (q < 0) return null;
    } else {
      const t = q / p;
      if (p < 0) lo = Math.max(lo, t);
      else hi = Math.min(hi, t);
    }
  }
  if (!(hi > lo)) return null;
  return { at: (t) => complex(origin.re + t * d.re, origin.im + t * d.im), t0: lo, t1: hi, closed: false };
}

/** Which way the curve crosses condition c between two parameter values: refine the crossing by bisection. */
function bisect(at, ta, tb, test) {
  const ina = test(at(ta));
  let [a, b] = [ta, tb];
  for (let k = 0; k < 60; k++) {
    const m = (a + b) / 2;
    if (test(at(m)) === ina) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/** Is a boundary point of condition c (where a curve crosses into or out of it) part of c's set? */
function crossingIncluded(c, z) {
  if (c.type !== 'argument') return NON_STRICT.has(c.rel);
  const w = sub(z, c.a);
  if (modulus(w) < 1e-6 * (1 + modulus(c.a))) return false; // the vertex
  const phi = Math.atan2(w.im, w.re);
  const offRay = Math.abs(wrapAngle(phi - c.theta));
  const offCut = Math.abs(wrapAngle(phi - PI));
  if (offCut < offRay) return c.rel === 'gt' || c.rel === 'ge';
  return NON_STRICT.has(c.rel);
}

/**
 * The parts of a boundary piece that bound the region where every other condition also holds, sampled as
 * polylines, plus the end points where it leaves another condition, each marked included (filled dot) or
 * not (open dot). Ends at the edge of the box are not marked. A ray's vertex is never included; the view
 * marks it.
 *
 * For an equality the curve is the set, so the other conditions are tested on the curve. For an inequality
 * they are tested a hair's breadth into this condition's own set: a boundary only bounds the region if the
 * region is next to it on that side (the cut ray of arg z ≥ −π/4 is in the closure of arg z < π/3, but the
 * two sets meet it from opposite sides).
 * @returns {{ runs: object[][], ends: { z: object, included: boolean }[], whole: boolean }}
 */
export function clipPiece(piece, others, box, samples = 720) {
  const curve = pieceCurve(piece, box);
  if (!curve) return { runs: [], ends: [], whole: false };
  const { at, closed } = curve;
  const nudge = 1e-7 * Math.max(1, box.x1 - box.x0, box.y1 - box.y0);
  const probe = (z) => {
    const n = insideNormal(piece, z);
    return n ? add(z, scale(n, nudge)) : z;
  };
  const test = (z) => {
    const p = probe(z);
    return others.every((c) => insideClosure(c, p));
  };
  // Sample the curve. On circles an irrational offset keeps samples off typical boundary points, and the
  // walk starts at an outside sample so that no run wraps round the start.
  const n = samples;
  let seqT = [];
  let seqIn = [];
  if (closed) {
    const base = Array.from({ length: n }, (_, i) => 0.1234567 + (TAU * i) / n);
    const ins = base.map((t) => test(at(t)));
    if (ins.every(Boolean)) return { runs: [[...base, base[0] + TAU].map(at)], ends: [], whole: true };
    if (!ins.some(Boolean)) return { runs: [], ends: [], whole: false };
    const s = ins.findIndex((v) => !v);
    for (let k = 0; k <= n; k++) {
      const idx = (s + k) % n;
      seqT.push(base[idx] + (s + k >= n ? TAU : 0));
      seqIn.push(ins[idx]);
    }
  } else {
    seqT = Array.from({ length: n + 1 }, (_, i) => curve.t0 + ((curve.t1 - curve.t0) * i) / n);
    seqIn = seqT.map((t) => test(at(t)));
    if (seqIn.every(Boolean)) return { runs: [seqT.map(at)], ends: [], whole: true };
    if (!seqIn.some(Boolean)) return { runs: [], ends: [], whole: false };
  }
  const runs = [];
  const ends = [];
  let run = null;
  // A crossing between samples k − 1 and k: refine it, and work out whose boundary it is on.
  const crossing = (k) => {
    const [ta, tb] = [seqT[k - 1], seqT[k]];
    const z = at(bisect(at, ta, tb, test));
    const [za, zb] = [at(ta), at(tb)];
    let candidates = others.filter((c) => insideClosure(c, probe(za)) !== insideClosure(c, probe(zb)));
    if (!candidates.length) candidates = others;
    let best = candidates[0];
    for (const c of candidates) if (boundaryDistance(c, z) < boundaryDistance(best, z)) best = c;
    ends.push({ z, included: crossingIncluded(best, z) });
    return z;
  };
  for (let k = 0; k < seqT.length; k++) {
    if (seqIn[k]) {
      if (!run) run = k > 0 ? [crossing(k)] : [];
      run.push(at(seqT[k]));
    } else if (run) {
      run.push(crossing(k));
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return { runs, ends, whole: false };
}

/** How far z is from condition c's boundary (for deciding which boundary a crossing is on). */
function boundaryDistance(c, z) {
  if (c.type === 'modulus') return Math.abs(modulus(sub(z, c.a)) - c.r);
  if (c.type === 'bisector') {
    const d = sub(c.b, c.a);
    const len = modulus(d) || 1;
    const m = scale(add(c.a, c.b), 0.5);
    return Math.abs(((z.re - m.re) * d.re + (z.im - m.im) * d.im) / len);
  }
  const w = sub(z, c.a);
  const r = modulus(w);
  if (r < 1e-9) return 0;
  const phi = Math.atan2(w.im, w.re);
  const off = Math.min(Math.abs(wrapAngle(phi - c.theta)), c.rel === 'eq' ? Infinity : Math.abs(wrapAngle(phi - PI)));
  return r * Math.sin(Math.min(off, PI / 2));
}

/** Signed function whose zero set contains the condition's boundary curve (for equality intersections). */
function signedBoundary(c) {
  if (c.type === 'modulus') return { f: (z) => modulus(sub(z, c.a)) - c.r, ok: () => true };
  if (c.type === 'bisector') return { f: (z) => modulus(sub(z, c.a)) - modulus(sub(z, c.b)), ok: () => true };
  const d = fromPolar(1, c.theta);
  return {
    f: (z) => d.re * (z.im - c.a.im) - d.im * (z.re - c.a.re),
    ok: (z) => d.re * (z.re - c.a.re) + d.im * (z.im - c.a.im) > 1e-9,
  };
}

/**
 * Points where two equality loci meet (inside the box). If the curves coincide, returns [] and sets
 * `coincide` on the array.
 */
export function intersections(c1, c2, box, samples = 2000) {
  const out = [];
  const { f, ok } = signedBoundary(c2);
  let all = 0;
  let total = 0;
  for (const piece of boundaryPieces({ ...c1, rel: 'eq' })) {
    const curve = pieceCurve(piece, box);
    if (!curve) continue;
    const { at } = curve;
    const n = samples;
    const t0 = curve.closed ? 0.1234567 : curve.t0;
    const span = curve.closed ? TAU : curve.t1 - curve.t0;
    let prevT = t0;
    let prevV = f(at(t0));
    for (let i = 1; i <= n; i++) {
      const t = t0 + (span * i) / n;
      const v = f(at(t));
      total += 1;
      if (Math.abs(v) < 1e-9) all += 1;
      let z = null;
      if (v === 0) z = at(t);
      else if (prevV !== 0 && (prevV < 0) !== (v < 0)) {
        let [a, b, fa] = [prevT, t, prevV];
        for (let k = 0; k < 80; k++) {
          const m = (a + b) / 2;
          const fm = f(at(m));
          if (fm === 0) [a, b] = [m, m];
          else if ((fm < 0) === (fa < 0)) [a, fa] = [m, fm];
          else b = m;
        }
        z = at((a + b) / 2);
      }
      if (z && ok(z) && satisfies({ ...c1, rel: 'eq' }, z) && Math.abs(f(z)) < 1e-7 && !out.some((p) => modulus(sub(p, z)) < 1e-7)) out.push(z);
      prevT = t;
      prevV = v;
    }
  }
  if (total > 0 && all === total) out.coincide = true;
  return out;
}

/** Loci outputs: distances and arguments for the test point z, and whether it satisfies every condition. */
export function lociOutputs(params) {
  const z = complex(params.zRe, params.zIm);
  const conds = conditionsFromParams(params);
  const c1 = conditionFromParams(params, 1);
  const c2 = conditionFromParams(params, 2);
  const dist = (p) => modulus(sub(z, p));
  const angle = (p) => arg(sub(z, p));
  return {
    probeDistA1: c1 ? dist(c1.a) : NaN,
    probeArgA1: c1 ? angle(c1.a) : NaN,
    probeDistB1: c1 && c1.type === 'bisector' ? dist(c1.b) : NaN,
    probeDistA2: c2 ? dist(c2.a) : NaN,
    probeArgA2: c2 ? angle(c2.a) : NaN,
    probeDistB2: c2 && c2.type === 'bisector' ? dist(c2.b) : NaN,
    probeInside: conds.every((c) => satisfies(c, z)) ? 1 : 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Polynomial-roots setup
// ---------------------------------------------------------------------------------------------

/** P(z) by Horner's rule. coeffs: highest power first, complex. */
export function polyEval(coeffs, z) {
  let acc = complex(0, 0);
  for (const c of coeffs) acc = add(mul(acc, z), c);
  return acc;
}

function derivative(coeffs) {
  const n = coeffs.length - 1;
  return coeffs.slice(0, n).map((c, i) => scale(c, n - i));
}

function csqrt(z) {
  const r = modulus(z);
  if (r === 0) return complex(0, 0);
  // Stable principal square root.
  const t = Math.sqrt((r + Math.abs(z.re)) / 2);
  if (z.re >= 0) return complex(t, z.im / (2 * t));
  return complex(Math.abs(z.im) / (2 * t), z.im < 0 ? -t : t);
}

function rawRoots(coeffs) {
  const n = coeffs.length - 1;
  if (n === 1) return [div(scale(coeffs[1], -1), coeffs[0])];
  if (n === 2) {
    const [a, b, c] = coeffs;
    const disc = sub(mul(b, b), scale(mul(a, c), 4));
    const s = csqrt(disc);
    // Choose the sign that avoids cancellation in b ± √disc.
    const plus = add(b, s);
    const minus = sub(b, s);
    const big = modulus(plus) >= modulus(minus) ? plus : minus;
    if (modulus(big) === 0) return [complex(0, 0), complex(0, 0)];
    const q = scale(big, -0.5);
    return [div(q, a), div(c, q)];
  }
  // Durand–Kerner (Weierstrass) iteration on the monic polynomial. Each estimate is frozen once |P(z)|
  // is down to Horner's rounding-error bound (it cannot get better), then simple roots get a Newton polish.
  const monic = coeffs.map((c) => div(c, coeffs[0]));
  const radius = Math.max(...monic.slice(1).map((c, i) => modulus(c) ** (1 / (i + 1))), 1e-3);
  let z = Array.from({ length: n }, (_, k) => fromPolar(radius, (TAU * k) / n + 0.4));
  const frozen = new Array(n).fill(false);
  for (let iter = 0; iter < 2000 && !frozen.every(Boolean); iter++) {
    let change = 0;
    z = z.map((zk, k) => {
      if (frozen[k]) return zk;
      const value = polyEval(monic, zk);
      if (modulus(value) <= hornerNoise(monic, zk)) {
        frozen[k] = true;
        return zk;
      }
      let denom = complex(1, 0);
      for (let j = 0; j < n; j++) if (j !== k) denom = mul(denom, sub(zk, z[j]));
      const step = div(value, denom);
      if (!isFiniteZ(step)) return add(zk, complex(1e-8, 1e-8)); // two estimates met: nudge apart
      change = Math.max(change, modulus(step) / Math.max(1, modulus(zk)));
      return sub(zk, step);
    });
    if (change < 1e-16) break;
  }
  const dmonic = derivative(monic);
  return z.map((zk) => {
    let w = zk;
    for (let k = 0; k < 4; k++) {
      const d = polyEval(dmonic, w);
      const step = div(polyEval(monic, w), d);
      if (!isFiniteZ(step) || modulus(step) > 1e-6 * Math.max(1, modulus(w))) break;
      const next = sub(w, step);
      if (modulus(polyEval(monic, next)) >= modulus(polyEval(monic, w))) break;
      w = next;
    }
    return w;
  });
}

const EPS = 2.220446049250313e-16;

/** Rounding-error bound for evaluating P(z) by Horner's rule: about 2n·ε·Σ|aₖ||z|ᵏ (Higham, ch. 5). */
function hornerNoise(coeffs, z) {
  const r = modulus(z);
  let s = 0;
  for (const c of coeffs) s = s * r + modulus(c);
  return 2 * coeffs.length * EPS * s;
}

function nthDerivative(coeffs, k) {
  let d = coeffs;
  for (let i = 0; i < k; i++) d = derivative(d);
  return d;
}

/**
 * A root of multiplicity m comes out of floating-point root finding as m nearby estimates, smeared by
 * about ε^(1/m) (up to ~1e-3 for a quadruple root). The (m − 1)th derivative has that root as a simple
 * root, so Newton's method on it from the cluster's centroid finds it to full accuracy. The result is
 * accepted only if P, P′, …, P^(m−2) also vanish there to rounding accuracy; otherwise the estimates are
 * genuinely distinct roots and are left alone (after trying the tightest m − 1 of them).
 */
function refineMultiple(coeffs, pts) {
  const m = pts.length;
  const c = scale(pts.reduce((s, p) => add(s, p), complex(0, 0)), 1 / m);
  const spread = Math.max(...pts.map((p) => modulus(sub(p, c))));
  const d = nthDerivative(coeffs, m - 1);
  const dd = derivative(d);
  let w = c;
  for (let it = 0; it < 60; it++) {
    const step = div(polyEval(d, w), polyEval(dd, w));
    if (!isFiniteZ(step)) break;
    w = sub(w, step);
    if (modulus(step) <= 4 * EPS * Math.max(1, modulus(w))) break;
  }
  if (!isFiniteZ(w) || modulus(sub(w, c)) > 2 * spread + 1e-12) return null;
  let p = coeffs;
  for (let k = 0; k < m - 1; k++) {
    if (modulus(polyEval(p, w)) > 1e3 * hornerNoise(p, w)) return null;
    p = derivative(p);
  }
  return w;
}

const CLUSTER_REACH = 6e-3; // relative: wider than the smear of a quadruple root

function mergeClusters(coeffs, roots) {
  const out = roots.map((z) => ({ ...z }));
  const done = new Array(out.length).fill(false);
  for (let i = 0; i < out.length; i++) {
    if (done[i]) continue;
    const size = Math.max(1, modulus(out[i]));
    const group = [i]; // single-linkage cluster
    for (let g = 0; g < group.length; g++) {
      for (let j = 0; j < out.length; j++) {
        if (!done[j] && !group.includes(j) && modulus(sub(out[group[g]], out[j])) < CLUSTER_REACH * size) group.push(j);
      }
    }
    let members = group;
    while (members.length >= 2) {
      const w = refineMultiple(coeffs, members.map((k) => out[k]));
      if (w) {
        for (const k of members) {
          out[k] = { ...w };
          done[k] = true;
        }
        break;
      }
      // Drop the estimate farthest from the centroid and try a smaller multiplicity.
      const c = scale(members.reduce((s, k) => add(s, out[k]), complex(0, 0)), 1 / members.length);
      let far = 0;
      members.forEach((k, idx) => {
        if (modulus(sub(out[k], c)) > modulus(sub(out[members[far]], c))) far = idx;
      });
      members = members.filter((_, idx) => idx !== far);
    }
    done[i] = true;
  }
  return out;
}

/**
 * Roots of a polynomial with complex coefficients (highest power first), counted with multiplicity.
 * Leading zero coefficients lower the degree; zero constant terms give exact zero roots.
 * With real coefficients, real roots are exactly real and non-real roots come in exact conjugate pairs.
 * Order: real roots ascending, then non-real roots by real part, each pair with Im > 0 first.
 */
export function polyRoots(coeffs) {
  let cs = coeffs.map((c) => ({ ...c }));
  while (cs.length && cs[0].re === 0 && cs[0].im === 0) cs.shift();
  const zeros = [];
  while (cs.length > 1 && cs[cs.length - 1].re === 0 && cs[cs.length - 1].im === 0) {
    cs.pop();
    zeros.push(complex(0, 0));
  }
  if (cs.length <= 1) return zeros;
  const real = coeffs.every((c) => c.im === 0);
  let roots = mergeClusters(cs, rawRoots(cs));
  if (real) roots = mirrorPairs(roots);
  roots = roots.concat(zeros);
  return sortRoots(roots);
}

function mirrorPairs(roots) {
  const out = roots.map((z) => {
    const tol = 1e-9 * Math.max(1, modulus(z));
    return Math.abs(z.im) <= tol ? complex(z.re, 0) : { ...z };
  });
  const upper = out.map((z, i) => i).filter((i) => out[i].im > 0);
  const lower = out.map((z, i) => i).filter((i) => out[i].im < 0);
  if (upper.length !== lower.length) {
    // Rounding left a pair on the axis: treat near-real roots by their real parts only.
    return out.map((z) => (Math.abs(z.im) < 1e-6 * Math.max(1, modulus(z)) ? complex(z.re, 0) : z));
  }
  const free = new Set(lower);
  for (const i of upper) {
    let best = -1;
    let bestD = Infinity;
    for (const j of free) {
      const d = modulus(sub(out[j], conj(out[i])));
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    free.delete(best);
    const m = scale(add(out[i], conj(out[best])), 0.5);
    out[i] = complex(m.re, m.im);
    out[best] = complex(m.re, 0 - m.im);
  }
  return out;
}

function sortRoots(roots) {
  return [...roots].sort((p, q) => {
    const pr = p.im === 0;
    const qr = q.im === 0;
    if (pr !== qr) return pr ? -1 : 1;
    if (Math.abs(p.re - q.re) > 1e-9 * Math.max(1, Math.abs(p.re))) return p.re - q.re;
    if (Math.abs(Math.abs(p.im) - Math.abs(q.im)) > 1e-9) return Math.abs(p.im) - Math.abs(q.im);
    return q.im - p.im;
  });
}

/** Distinct roots with multiplicities, in polyRoots order. */
export function rootGroups(roots) {
  const groups = [];
  for (const z of roots) {
    const g = groups.find((h) => modulus(sub(h.z, z)) <= 1e-12 * Math.max(1, modulus(z)));
    if (g) g.multiplicity += 1;
    else groups.push({ z, multiplicity: 1 });
  }
  return groups;
}

/** Coefficients (highest power first) from params: c_degree … c₀, with Im c₀ = c0Im. */
export function polyCoefficients(params) {
  const keys = ['c0', 'c1', 'c2', 'c3', 'c4'].slice(0, params.degree + 1).reverse();
  return keys.map((k) => complex(params[k], k === 'c0' ? params.c0Im ?? 0 : 0));
}

/** "z³ − 3z² + 4z − 2", with a non-real constant in brackets. */
export function polyText(coeffs) {
  const n = coeffs.length - 1;
  const parts = [];
  coeffs.forEach((c, i) => {
    const p = n - i;
    if (c.re === 0 && c.im === 0) return;
    const power = p === 0 ? '' : p === 1 ? 'z' : `z${superscript(p)}`;
    if (c.im !== 0) {
      parts.push({ sign: '+', body: `(${complexText(c)})${power}` });
      return;
    }
    const mag = numText(Math.abs(c.re));
    const body = p > 0 && mag === '1' ? power : `${mag}${power}`;
    parts.push({ sign: c.re < 0 ? MINUS : '+', body });
  });
  if (!parts.length) return '0';
  return parts.map((t, i) => (i === 0 ? `${t.sign === MINUS ? MINUS : ''}${t.body}` : ` ${t.sign} ${t.body}`)).join('');
}

/** Every coefficient is 0: P is the zero polynomial, and every z is a root (polyRoots lists none). */
export function isZeroPolynomial(coeffs) {
  return coeffs.every((c) => c.re === 0 && c.im === 0);
}

/**
 * Roots (up to 4, NaN beyond the degree), their sum and product, and the number of real roots.
 * The zero polynomial has every z as a root, so all of these are NaN (shown as —).
 */
export function polynomialOutputs(params) {
  const coeffs = polyCoefficients(params);
  const roots = polyRoots(coeffs);
  const out = {};
  for (let k = 0; k < 4; k++) {
    const z = roots[k];
    out[`root${k + 1}Re`] = z ? clean(z.re) : NaN;
    out[`root${k + 1}Im`] = z ? clean(z.im) : NaN;
  }
  const sum = roots.reduce((s, z) => add(s, z), complex(0, 0));
  const prod = roots.reduce((s, z) => mul(s, z), complex(1, 0));
  const ok = roots.length > 0;
  out.rootSumRe = ok ? clean(sum.re) : NaN;
  out.rootSumIm = ok ? clean(sum.im) : NaN;
  out.rootProductRe = ok ? clean(prod.re) : NaN;
  out.rootProductIm = ok ? clean(prod.im) : NaN;
  out.realRootCount = isZeroPolynomial(coeffs) ? NaN : roots.filter((z) => z.im === 0).length;
  return out;
}
