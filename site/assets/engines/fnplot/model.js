// fnplot model: pure maths for every fnplot setup (guide §9.1). No DOM, no timers, no randomness.
// Importable in Node: tests/engines/fnplot.test.mjs checks it against analytic answers.
//
// Sections
//   numerics        simpson, derivative (5-point), bisect, golden-section extremum, findRoots
//   sampling        sampleFunction (adaptive, breaks at discontinuities, asymptotes), sampleParametric
//   calculus (AST)  differentiate, substitute (symbolic, for labels and exact derivatives)
//   setups          transform, inverse, parametric, polynomial, auxiliary, blackbody, inequality,
//                   inverse-trig, substitution, by-parts, partial-fractions, heating
//
// Every solveX(params) returns plain numbers, functions of x and LaTeX strings for the view, or
// { error } when an expression can't be read. Time-based setups (parametric, heating) advance in
// whole fixed steps; RUN_STEPS steps take a run from start to end.
import { parse, compile, tryCompile, toTex } from './parser.js';

export const DT = 1 / 60; // s of real time per fixed step
export const RUN_STEPS = 600; // fixed steps from start to end of a run (10 s at 1×)

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Numerics
// ─────────────────────────────────────────────────────────────────────────────────────────────

const fin = Number.isFinite;

/** Composite Simpson's rule on [a, b] with n (even) intervals. Oriented: b < a gives the negative. */
export function simpson(f, a, b, n = 2000) {
  if (a === b) return 0;
  const m = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / m;
  let s = f(a) + f(b);
  for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

/** Five-point central difference f'(x), error O(h⁴). */
export function derivative(f, x, h = 1e-3 * Math.max(1, Math.abs(x))) {
  return (f(x - 2 * h) - 8 * f(x - h) + 8 * f(x + h) - f(x + 2 * h)) / (12 * h);
}

/** Bisection on a sign change of f in [a, b]. */
export function bisect(f, a, b, iterations = 80) {
  let fa = f(a);
  for (let i = 0; i < iterations; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fm === 0) return m;
    if (Math.sign(fm) === Math.sign(fa)) {
      a = m;
      fa = fm;
    } else b = m;
  }
  return (a + b) / 2;
}

/** Golden-section search for the maximum (or minimum) of a unimodal f on [a, b]. */
export function goldenExtremum(f, a, b, { maximise = true, iterations = 120 } = {}) {
  const g = (Math.sqrt(5) - 1) / 2;
  const s = maximise ? 1 : -1;
  let c = b - g * (b - a);
  let d = a + g * (b - a);
  let fc = s * f(c);
  let fd = s * f(d);
  for (let i = 0; i < iterations && Math.abs(b - a) > 1e-15 * (1 + Math.abs(a)); i++) {
    if (fc > fd || (Number.isNaN(fd) && !Number.isNaN(fc))) {
      b = d;
      d = c;
      fd = fc;
      c = b - g * (b - a);
      fc = s * f(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + g * (b - a);
      fd = s * f(d);
    }
  }
  return (a + b) / 2;
}

/**
 * Real zeros of f on [a, b]: sign changes (refined by bisection, poles rejected) and touching zeros
 * (local minima of |f| that reach zero). Sorted, de-duplicated.
 */
export function findRoots(f, a, b, n = 2000) {
  const xs = [];
  const ys = [];
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    xs.push(x);
    ys.push(f(x));
  }
  let scale = 1;
  for (const y of ys) if (fin(y)) scale = Math.max(scale, Math.abs(y));
  const tol = 1e-9 * scale;
  const roots = [];
  const add = (r) => {
    if (!roots.some((q) => Math.abs(q - r) < 1e-7 * Math.max(1, Math.abs(r)))) roots.push(r);
  };
  for (let i = 0; i <= n; i++) {
    const y = ys[i];
    if (y === 0) {
      add(xs[i]);
      continue;
    }
    if (i === 0 || !fin(y) || !fin(ys[i - 1]) || ys[i - 1] === 0) continue;
    if (Math.sign(y) !== Math.sign(ys[i - 1])) {
      const r = bisect(f, xs[i - 1], xs[i]);
      const fr = f(r);
      // A sign change through a pole (1/x) is not a root: the value there is huge, not zero.
      if (fin(fr) && Math.abs(fr) <= Math.max(tol, 1e-6 * Math.min(Math.abs(y), Math.abs(ys[i - 1])))) add(r);
    }
  }
  // Touching zeros: (x − 1)² has no sign change.
  for (let i = 1; i < n; i++) {
    const [y0, y1, y2] = [ys[i - 1], ys[i], ys[i + 1]];
    if (!fin(y0) || !fin(y1) || !fin(y2)) continue;
    if (Math.abs(y1) <= Math.abs(y0) && Math.abs(y1) <= Math.abs(y2) && Math.sign(y0) === Math.sign(y2) && Math.sign(y0) === Math.sign(y1)) {
      const xm = goldenExtremum((x) => Math.abs(f(x)), xs[i - 1], xs[i + 1], { maximise: false });
      if (Math.abs(f(xm)) <= Math.max(tol, 1e-12)) add(xm);
    }
  }
  return roots.sort((p, q) => p - q);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Sampling
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Adaptive samples of y = f(x) on [x0, x1] for drawing in a window yMin..yMax.
 * Returns { segments: [[x, y], …][], asymptotes: number[], breaks: number[] }:
 * segments never join across a discontinuity or a gap in the domain; asymptotes are the x-values
 * where |f| grows without bound; breaks are every place a segment ends inside the interval.
 */
export function sampleFunction(f, x0, x1, { n = 400, yMin = -10, yMax = 10, maxDepth = 10 } = {}) {
  const H = Math.max(yMax - yMin, 1e-12);
  const tol = H * 1e-3;
  const span = x1 - x0;
  const ev = (x) => {
    const y = f(x);
    return typeof y === 'number' ? y : NaN;
  };
  const off = (y) => y > yMax + H || y < yMin - H;

  // 1. Uniform grid, refined where the curve bends or jumps on screen.
  const X = [x0];
  const Y = [ev(x0)];
  const refine = (xa, ya, xb, yb, depth) => {
    const fa = fin(ya);
    const fb = fin(yb);
    if (depth >= maxDepth || (!fa && !fb)) {
      X.push(xb);
      Y.push(yb);
      return;
    }
    const xm = (xa + xb) / 2;
    const ym = ev(xm);
    if (fa && fb && fin(ym)) {
      const smooth = Math.abs(ym - (ya + yb) / 2) <= tol && Math.abs(yb - ya) <= H * 0.02;
      const allAbove = ya > yMax + H && yb > yMax + H && ym > yMax + H;
      const allBelow = ya < yMin - H && yb < yMin - H && ym < yMin - H;
      if (smooth || allAbove || allBelow) {
        X.push(xb);
        Y.push(yb);
        return;
      }
    }
    refine(xa, ya, xm, ym, depth + 1);
    refine(xm, ym, xb, yb, depth + 1);
  };
  let xa = x0;
  let ya = Y[0];
  for (let i = 1; i <= n; i++) {
    const xb = x0 + (span * i) / n;
    const yb = ev(xb);
    refine(xa, ya, xb, yb, 0);
    xa = xb;
    ya = yb;
  }

  // 2. Split into segments at gaps, jumps and blow-ups.
  const segments = [];
  const asymptotes = [];
  const breaks = [];
  let seg = [];
  const endSeg = () => {
    if (seg.length) segments.push(seg);
    seg = [];
  };
  const markBreak = (x, isAsymptote) => {
    if (x <= x0 || x >= x1) return;
    if (!breaks.some((b) => Math.abs(b - x) < 1e-9 * Math.max(1, Math.abs(span)))) breaks.push(x);
    if (isAsymptote && !asymptotes.some((b) => Math.abs(b - x) < 1e-6 * Math.max(1, Math.abs(span)))) asymptotes.push(x);
  };
  // Last finite point next to a non-finite one (domain edge or pole), found by bisection.
  const edge = (xf, xn) => {
    let a = xf;
    let b = xn;
    for (let k = 0; k < 60; k++) {
      const m = (a + b) / 2;
      if (fin(ev(m))) a = m;
      else b = m;
    }
    return [a, ev(a), b];
  };

  for (let i = 0; i < X.length; i++) {
    const x = X[i];
    const y = Y[i];
    if (!fin(y)) {
      if (seg.length) {
        const [ex, ey, nx] = edge(seg[seg.length - 1][0], x);
        if (ex > seg[seg.length - 1][0]) seg.push([ex, ey]);
        markBreak((ex + nx) / 2, Math.abs(y) === Infinity || off(ey));
        endSeg();
      } else if (Math.abs(y) === Infinity) markBreak(x, true);
      continue;
    }
    // Just after a gap: start at the domain edge. The climb away from an edge beside a pole is
    // steep but continuous, so this first pair skips the jump test.
    let fromEdge = false;
    if (!seg.length && i > 0 && !fin(Y[i - 1])) {
      const [ex, ey, nx] = edge(x, X[i - 1]);
      markBreak((ex + nx) / 2, Math.abs(Y[i - 1]) === Infinity || off(ey));
      if (ex < x) {
        seg.push([ex, ey]);
        fromEdge = true;
      }
    }
    if (seg.length && !fromEdge) {
      const [px, py] = seg[seg.length - 1];
      if (Math.abs(y - py) > H * 0.05 || (off(y) && off(py) && Math.sign(y) !== Math.sign(py))) {
        const jump = classifyJump(ev, px, py, x, y, tol, H, off);
        if (jump) {
          seg.push([jump.l, jump.yl]);
          markBreak(jump.x, jump.asymptote);
          endSeg();
          seg.push([jump.r, jump.yr]);
        }
      }
    }
    seg.push([x, y]);
  }
  endSeg();

  // 3. Blow-ups with no sign change (1/x²): an off-screen local extreme where |f| is unbounded.
  const out = [];
  for (const s of segments) {
    let start = 0;
    for (let i = 1; i < s.length - 1; i++) {
      const [, y] = s[i];
      if (!off(y)) continue;
      const up = y > 0;
      const isPeak = up ? y >= s[i - 1][1] && y >= s[i + 1][1] : y <= s[i - 1][1] && y <= s[i + 1][1];
      if (!isPeak) continue;
      const xm = goldenExtremum(ev, s[i - 1][0], s[i + 1][0], { maximise: up });
      const ym = ev(xm);
      if (!fin(ym) || Math.abs(ym) > 1e8 * H) {
        const piece = s.slice(start, i + (s[i][0] < xm ? 1 : 0));
        const d = Math.max(1e-12, Math.abs(span) * 1e-9);
        piece.push([xm - d, ev(xm - d)]);
        if (piece.length) out.push(piece);
        markBreak(xm, true);
        start = i + (s[i][0] < xm ? 1 : 0);
        s.splice(start, 0, [xm + d, ev(xm + d)]);
        i = start;
      }
    }
    out.push(s.slice(start));
  }
  asymptotes.sort((p, q) => p - q);
  breaks.sort((p, q) => p - q);
  return { segments: out.filter((s) => s.length > 0), asymptotes, breaks };
}

/** Bisect a large jump between two finite samples: null if f is continuous there. */
function classifyJump(ev, xa, ya, xb, yb, tol, H, off) {
  let l = xa;
  let r = xb;
  let yl = ya;
  let yr = yb;
  const j0 = Math.abs(yb - ya);
  for (let k = 0; k < 64 && r - l > 1e-15 * Math.max(1, Math.abs(l)); k++) {
    const m = (l + r) / 2;
    const ym = ev(m);
    if (!fin(ym)) return { x: m, l, yl, r, yr, asymptote: Math.abs(ym) === Infinity || off(yl) || off(yr) };
    if (Math.abs(ym - yl) >= Math.abs(yr - ym)) {
      r = m;
      yr = ym;
    } else {
      l = m;
      yl = ym;
    }
  }
  const j = Math.abs(yr - yl);
  if (j < tol) return null;
  return { x: (l + r) / 2, l, yl, r, yr, asymptote: j > 10 * j0 && (off(yl) || off(yr)) };
}

/** Points (x(t), y(t)) for t in [t0, t1], split where either coordinate is undefined. */
export function sampleParametric(fx, fy, t0, t1, n = 800) {
  const segments = [];
  let seg = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    const x = fx(t);
    const y = fy(t);
    if (fin(x) && fin(y)) seg.push([x, y, t]);
    else if (seg.length) {
      segments.push(seg);
      seg = [];
    }
  }
  if (seg.length) segments.push(seg);
  return segments;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Symbolic calculus on parser ASTs (for exact derivatives and readable labels)
// ─────────────────────────────────────────────────────────────────────────────────────────────

const N = (v) => ({ type: 'num', value: v });
const isN = (n, v) => n.type === 'num' && (v === undefined || n.value === v);
const neg = (a) => (isN(a) ? N(-a.value) : a.type === 'neg' ? a.arg : { type: 'neg', arg: a });
const add = (a, b) => (isN(a, 0) ? b : isN(b, 0) ? a : isN(a) && isN(b) ? N(a.value + b.value) : b.type === 'neg' ? sub(a, b.arg) : { type: 'bin', op: '+', left: a, right: b });
const sub = (a, b) => (isN(b, 0) ? a : isN(a, 0) ? neg(b) : isN(a) && isN(b) ? N(a.value - b.value) : b.type === 'neg' ? add(a, b.arg) : { type: 'bin', op: '-', left: a, right: b });
function mul(a, b) {
  if (isN(a, 0) || isN(b, 0)) return N(0);
  if (isN(a, 1)) return b;
  if (isN(b, 1)) return a;
  if (isN(a) && isN(b)) return N(a.value * b.value);
  if (isN(a, -1)) return neg(b);
  if (isN(b, -1)) return neg(a);
  if (a.type === 'neg') return neg(mul(a.arg, b));
  if (b.type === 'neg') return neg(mul(a, b.arg));
  if (isN(b)) return mul(b, a); // numbers first: 2x, not x·2
  if (isN(a) && b.type === 'bin' && b.op === '*' && isN(b.left)) return mul(N(a.value * b.left.value), b.right);
  return { type: 'bin', op: '*', left: a, right: b };
}
const div = (a, b) => (isN(a, 0) ? N(0) : isN(b, 1) ? a : isN(a) && isN(b) && Number.isInteger(a.value / b.value) ? N(a.value / b.value) : { type: 'bin', op: '/', left: a, right: b });
function pow(a, b) {
  if (isN(b, 0)) return N(1);
  if (isN(b, 1)) return a;
  if (isN(a) && isN(b)) return N(a.value ** b.value);
  const fnPower = a.type === 'call' && isN(b) && b.value > 0 && Number.isInteger(b.value) && !['sqrt', 'abs', 'floor'].includes(a.name);
  return { type: 'bin', op: '^', left: a, right: b, ...(fnPower ? { fnPower: true } : {}) };
}
const call = (name, arg) => ({ type: 'call', name, arg });

function dependsOn(node, v) {
  if (node.type === 'var') return node.name === v;
  if (node.type === 'neg' || node.type === 'call') return dependsOn(node.arg, v);
  if (node.type === 'bin') return dependsOn(node.left, v) || dependsOn(node.right, v);
  return false;
}

/** d/dv of an AST, lightly simplified. */
export function differentiate(node, v = 'x') {
  const d = (n) => differentiate(n, v);
  switch (node.type) {
    case 'num':
    case 'const':
      return N(0);
    case 'var':
      return N(node.name === v ? 1 : 0);
    case 'neg':
      return neg(d(node.arg));
    case 'bin': {
      const { op, left: l, right: r } = node;
      if (op === '+') return add(d(l), d(r));
      if (op === '-') return sub(d(l), d(r));
      if (op === '*') return add(mul(d(l), r), mul(l, d(r)));
      if (op === '/') {
        if (!dependsOn(r, v)) return div(d(l), r);
        return div(sub(mul(d(l), r), mul(l, d(r))), pow(r, N(2)));
      }
      // op === '^'
      if (!dependsOn(r, v)) return mul(mul(r, pow(l, sub(r, N(1)))), d(l));
      if (!dependsOn(l, v)) {
        const lnBase = l.type === 'const' && l.name === 'e' ? N(1) : call('ln', l);
        return mul(mul(lnBase, node), d(r));
      }
      return mul(node, add(mul(d(r), call('ln', l)), div(mul(r, d(l)), l)));
    }
    case 'call': {
      const u = node.arg;
      const du = d(u);
      if (isN(du, 0)) return N(0);
      const one = N(1);
      let outer;
      switch (node.name) {
        case 'sin': outer = call('cos', u); break;
        case 'cos': outer = neg(call('sin', u)); break;
        case 'tan': outer = pow(call('sec', u), N(2)); break;
        case 'asin': outer = div(one, call('sqrt', sub(one, pow(u, N(2))))); break;
        case 'acos': outer = neg(div(one, call('sqrt', sub(one, pow(u, N(2)))))); break;
        case 'atan': outer = div(one, add(one, pow(u, N(2)))); break;
        case 'sec': outer = mul(call('sec', u), call('tan', u)); break;
        case 'csc': outer = neg(mul(call('csc', u), call('cot', u))); break;
        case 'cot': outer = neg(pow(call('csc', u), N(2))); break;
        case 'exp': outer = call('exp', u); break;
        case 'ln': outer = div(one, u); break;
        case 'log': outer = div(one, mul(u, call('ln', N(10)))); break;
        case 'sqrt': outer = div(one, mul(N(2), call('sqrt', u))); break;
        case 'abs': outer = div(u, call('abs', u)); break;
        default: return N(0); // sign, floor: zero wherever they are differentiable
      }
      if (isN(du, 1)) return outer;
      // Chain rule. A fraction keeps the inner derivative on top: 2x / (1 + x²)².
      if (outer.type === 'bin' && outer.op === '/' && isN(outer.left, 1)) return div(du, outer.right);
      return mul(du, outer);
    }
    default:
      return N(0);
  }
}

/** Replace every variable `name` in an AST with another AST. */
export function substitute(node, name, replacement) {
  switch (node.type) {
    case 'var':
      return node.name === name ? replacement : node;
    case 'neg':
    case 'call':
      return { ...node, arg: substitute(node.arg, name, replacement) };
    case 'bin':
      return { ...node, left: substitute(node.left, name, replacement), right: substitute(node.right, name, replacement) };
    default:
      return node;
  }
}

// Evaluate a compiled expression of one variable as a plain function.
const fn1 = (compiled, v = 'x', extra = {}) => {
  const scope = { ...extra };
  return (x) => {
    scope[v] = x;
    return compiled(scope);
  };
};

/** Compile an expression in one variable; { f, ast, tex } or { error }. */
export function expression(src, v = 'x', extraVars = [], extra = {}) {
  const r = tryCompile(src, { variables: [v, ...extraVars] });
  if (!r.ok) return { error: r.error, source: src };
  return { f: fn1(r.fn, v, extra), ast: r.ast, tex: toTex(r.ast), source: src };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// transform: y = 1/f(x), y = |f(x)|, y = f(|x|)
// ─────────────────────────────────────────────────────────────────────────────────────────────

export const TRANSFORMS = {
  reciprocal: { label: 'y = 1/f(x)', tex: (t) => `y=\\frac{1}{${t}}`, g: (f) => (x) => 1 / f(x) },
  abs: { label: 'y = |f(x)|', tex: (t) => `y=\\left|${t}\\right|`, g: (f) => (x) => Math.abs(f(x)) },
  absx: { label: 'y = f(|x|)', tex: () => 'y=f\\left(\\left|x\\right|\\right)', g: (f) => (x) => f(Math.abs(x)) },
};

export function solveTransform(p) {
  const e = expression(p.fx);
  if (e.error) return { error: e.error, source: p.fx, name: 'f(x)' };
  const T = TRANSFORMS[p.transform] ?? TRANSFORMS.reciprocal;
  const g = T.g(e.f);
  const lo = -50;
  const hi = 50;
  const zeros = findRoots(e.f, lo, hi);
  // Invariant points: where the transformed graph meets the original.
  let invariant = [];
  if (p.transform === 'reciprocal') invariant = [...findRoots((x) => e.f(x) - 1, lo, hi), ...findRoots((x) => e.f(x) + 1, lo, hi)].sort((a, b) => a - b);
  return {
    f: e.f,
    g,
    fTex: `y=${e.tex}`,
    gTex: T.tex(e.tex),
    zeros,
    asymptotes: p.transform === 'reciprocal' ? zeros : [],
    invariant: invariant.map((x) => [x, e.f(x)]),
    fValue: e.f(p.probeX),
    gValue: g(p.probeX),
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// inverse: reflect in y = x; restrict the domain until the inverse is a function
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Is f one-to-one on [a, b]? Strictly monotonic on each continuous piece, and the pieces' ranges
 * don't overlap. Returns { oneToOne, turning: x of the first turning point or null, range }.
 */
export function oneToOneOn(f, a, b, n = 2000) {
  const { segments } = sampleFunction(f, a, b, { n: Math.min(n, 800), yMin: -1e6, yMax: 1e6, maxDepth: 4 });
  const pieces = [];
  let turning = null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of segments) {
    let dir = 0;
    let pMin = Infinity;
    let pMax = -Infinity;
    for (let i = 0; i < s.length; i++) {
      const y = s[i][1];
      pMin = Math.min(pMin, y);
      pMax = Math.max(pMax, y);
      if (i === 0) continue;
      const dy = y - s[i - 1][1];
      const scale = 1e-12 * Math.max(1, Math.abs(y));
      if (Math.abs(dy) <= scale) {
        if (turning === null) turning = s[i][0]; // flat: not strictly monotonic
        continue;
      }
      const sgn = Math.sign(dy);
      if (dir !== 0 && sgn !== dir && turning === null) turning = s[i - 1][0];
      dir = sgn;
    }
    lo = Math.min(lo, pMin);
    hi = Math.max(hi, pMax);
    pieces.push([pMin, pMax]);
  }
  let overlap = false;
  for (let i = 0; i < pieces.length; i++)
    for (let j = i + 1; j < pieces.length; j++) if (pieces[i][0] < pieces[j][1] && pieces[j][0] < pieces[i][1]) overlap = true;
  return { oneToOne: turning === null && !overlap && pieces.length > 0, turning, range: [lo, hi] };
}

export function solveInverse(p) {
  const e = expression(p.inverseFx);
  if (e.error) return { error: e.error, source: p.inverseFx, name: 'f(x)' };
  const a = Math.min(p.domainMin, p.domainMax);
  const b = Math.max(p.domainMin, p.domainMax);
  const test = oneToOneOn(e.f, a, b);
  const x0 = Math.min(b, Math.max(a, p.probeX));
  const c = e.f(x0);
  const hits = fin(c) ? findRoots((x) => e.f(x) - c, a, b, 2000).filter((x) => x >= a - 1e-9 && x <= b + 1e-9) : [];
  return {
    f: e.f,
    fTex: `y=${e.tex}`,
    a,
    b,
    oneToOne: test.oneToOne,
    turning: test.turning,
    rangeMin: test.range[0],
    rangeMax: test.range[1],
    probe: [x0, c],
    hits: hits.length ? hits : [x0],
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// parametric: lines, parabolas, circles (and custom x(t), y(t))
// ─────────────────────────────────────────────────────────────────────────────────────────────

const fmt = (v) => String(Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(4)));
/** "+ 3" / "- 3" / "" for a term after something else (LaTeX). */
const signed = (v, body = '') => {
  if (v === 0) return '';
  const s = fmt(Math.abs(v));
  return `${v < 0 ? '-' : '+'}${body && Math.abs(v) === 1 ? '' : s}${body}`;
};
/** "3t" / "-t" / "0.5t" as a leading term. */
const lead = (v, body) => (v === 0 ? '0' : `${v < 0 ? '-' : ''}${Math.abs(v) === 1 && body ? '' : fmt(Math.abs(v))}${body}`);
const shiftTex = (v, k) => (k === 0 ? v : `\\left(${v}${signed(-k)}\\right)`); // (x - h)

export const PARAMETRIC_CURVES = ['line', 'parabola', 'circle', 'custom'];

/**
 * x(t), y(t) for the chosen curve, with the steps that eliminate t (LaTeX lines).
 * line: x = h + a t, y = k + b t · parabola: x = h + 2a t, y = k + a t² · circle: x = h + r cos t, y = k + r sin t (r = |a|)
 */
export function solveParametric(p) {
  const { h, k, pa: a, pb: b } = p; // custom x(t), y(t) still call them a and b
  const t0 = Math.min(p.tMin, p.tMax);
  const t1 = Math.max(p.tMin, p.tMax);
  const t = Math.min(t1, Math.max(t0, p.t));
  let x;
  let y;
  let xTex;
  let yTex;
  let steps;
  let cartesian;
  if (p.curve === 'custom') {
    const vars = ['a', 'b', 'h', 'k'];
    const scope = { a, b, h, k };
    const ex = expression(p.xt, 't', vars, scope);
    if (ex.error) return { error: ex.error, source: p.xt, name: 'x(t)' };
    const ey = expression(p.yt, 't', vars, scope);
    if (ey.error) return { error: ey.error, source: p.yt, name: 'y(t)' };
    x = ex.f;
    y = ey.f;
    xTex = `x=${ex.tex}`;
    yTex = `y=${ey.tex}`;
    steps = ['\\text{Make }t\\text{ the subject of one equation,}', '\\text{then substitute it into the other.}'];
    cartesian = null;
  } else if (p.curve === 'parabola') {
    const A = a === 0 ? 1 : a;
    x = (s) => h + 2 * A * s;
    y = (s) => k + A * s * s;
    xTex = `x=${h === 0 ? '' : `${fmt(h)}`}${h === 0 ? lead(2 * A, 't') : signed(2 * A, 't')}`;
    yTex = `y=${k === 0 ? '' : `${fmt(k)}`}${k === 0 ? lead(A, 't^{2}') : signed(A, 't^{2}')}`;
    const X = shiftTex('x', h);
    const Y = shiftTex('y', k);
    steps = [`t=\\frac{${X}}{${fmt(2 * A)}}`, `${Y}=${fmt(A)}\\left(\\frac{${X}}{${fmt(2 * A)}}\\right)^{2}`, `${X}^{2}=${fmt(4 * A)}${Y}`];
    cartesian = steps[2];
  } else if (p.curve === 'circle') {
    const r = Math.abs(a) || 1;
    x = (s) => h + r * Math.cos(s);
    y = (s) => k + r * Math.sin(s);
    xTex = `x=${h === 0 ? '' : `${fmt(h)}+`}${fmt(r)}\\cos t`;
    yTex = `y=${k === 0 ? '' : `${fmt(k)}+`}${fmt(r)}\\sin t`;
    const X = shiftTex('x', h);
    const Y = shiftTex('y', k);
    steps = [`\\cos t=\\frac{${X}}{${fmt(r)}},\\;\\sin t=\\frac{${Y}}{${fmt(r)}}`, `\\cos^{2}t+\\sin^{2}t=1`, `${X}^{2}+${Y}^{2}=${fmt(r * r)}`];
    cartesian = steps[2];
  } else {
    const A = a === 0 ? 1 : a;
    x = (s) => h + A * s;
    y = (s) => k + b * s;
    xTex = `x=${h === 0 ? '' : `${fmt(h)}`}${h === 0 ? lead(A, 't') : signed(A, 't')}`;
    yTex = `y=${k === 0 ? '' : `${fmt(k)}`}${k === 0 ? lead(b, 't') : signed(b, 't')}`;
    const X = shiftTex('x', h);
    const Y = shiftTex('y', k);
    const m = b / A;
    steps = [`t=\\frac{${X}}{${fmt(A)}}`, `${Y}=${fmt(b)}\\times\\frac{${X}}{${fmt(A)}}`, `${Y}=${fmt(m)}${X}`];
    cartesian = steps[2];
  }
  return { x, y, t0, t1, t, xTex, yTex, steps, cartesian, point: [x(t), y(t)] };
}

/** Parametric state: the trace runs from tMin to tMax in RUN_STEPS fixed steps. */
export function advanceParametric(p, steps) {
  const t0 = Math.min(p.tMin, p.tMax);
  const t1 = Math.max(p.tMin, p.tMax);
  const dt = (t1 - t0) / RUN_STEPS;
  const t = Math.min(t1, Math.max(t0, p.t) + Math.max(0, Math.floor(steps)) * dt);
  // Snap to the end so the run completes exactly.
  return t1 - t < dt * 1e-6 ? t1 : t;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// polynomial: roots and coefficients
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Coefficients (highest power first) of a·Π(x − rᵢ). */
export function expandRoots(roots, a = 1) {
  let c = [a];
  for (const r of roots) {
    const next = new Array(c.length + 1).fill(0);
    for (let i = 0; i < c.length; i++) {
      next[i] += c[i];
      next[i + 1] -= r * c[i];
    }
    c = next;
  }
  return c;
}

/** Horner evaluation, coefficients highest power first. */
export function polyEval(c, x) {
  let y = 0;
  for (const k of c) y = y * x + k;
  return y;
}

/** Sums of roots from coefficients (Vieta): Σα = −b/a, Σαβ = c/a, Σαβγ = −d/a, product = (−1)ⁿ·c_n/a. */
export function vieta(c) {
  const n = c.length - 1;
  const e = (k) => ((-1) ** k * c[k]) / c[0];
  return { degree: n, sum: n >= 1 ? e(1) : 0, pairSum: n >= 2 ? e(2) : 0, tripleSum: n >= 3 ? e(3) : 0, product: n >= 1 ? e(n) : c[0] };
}

/** Group equal roots: [{ root, multiplicity }]. */
export function multiplicities(roots, tol = 1e-9) {
  const out = [];
  for (const r of [...roots].sort((p, q) => p - q)) {
    const g = out.find((o) => Math.abs(o.root - r) <= tol);
    if (g) g.multiplicity += 1;
    else out.push({ root: r, multiplicity: 1 });
  }
  return out;
}

/** LaTeX for a polynomial (highest power first), e.g. "x^{3}-6x^{2}+11x-6". */
export function polyTex(c, v = 'x') {
  const n = c.length - 1;
  let s = '';
  c.forEach((k, i) => {
    const p = n - i;
    const val = Math.abs(k) < 1e-12 ? 0 : Number(k.toPrecision(6));
    if (val === 0) return;
    const body = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`;
    const mag = Math.abs(val) === 1 && body ? '' : String(Math.abs(val));
    s += `${val < 0 ? '-' : s ? '+' : ''}${mag}${body}`;
  });
  return s || '0';
}

export function solvePolynomial(p) {
  const roots = p.roots.slice();
  const a = p.leading;
  const coeffs = expandRoots(roots, a);
  const v = vieta(coeffs);
  return {
    roots,
    a,
    coeffs,
    f: (x) => polyEval(coeffs, x),
    groups: multiplicities(roots),
    ...v,
    tex: `P(x)=${polyTex(coeffs)}`,
    factoredTex: `P(x)=${a === 1 ? '' : a === -1 ? '-' : fmt(a)}${multiplicities(roots)
      .map(({ root, multiplicity }) => `${root === 0 ? 'x' : `\\left(x${signed(-root)}\\right)`}${multiplicity > 1 ? `^{${multiplicity}}` : ''}`)
      .join('')}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// auxiliary angle: a sin x + b cos x = R sin(x ± α) = R cos(x ± α)
// ─────────────────────────────────────────────────────────────────────────────────────────────

export const AUX_FORMS = {
  'sin-plus': { tex: 'R\\sin(x+\\alpha)', g: (R, al) => (x) => R * Math.sin(x + al) },
  'sin-minus': { tex: 'R\\sin(x-\\alpha)', g: (R, al) => (x) => R * Math.sin(x - al) },
  'cos-plus': { tex: 'R\\cos(x+\\alpha)', g: (R, al) => (x) => R * Math.cos(x + al) },
  'cos-minus': { tex: 'R\\cos(x-\\alpha)', g: (R, al) => (x) => R * Math.cos(x - al) },
};

/**
 * R = √(a² + b²) and α in (−π, π] so that a sin x + b cos x equals the chosen form.
 *   R sin(x + α): R cos α = a, R sin α = b     R sin(x − α): R cos α = a, R sin α = −b
 *   R cos(x + α): R cos α = b, R sin α = −a    R cos(x − α): R cos α = b, R sin α = a
 */
export function auxiliary(a, b, form = 'sin-plus') {
  const R = Math.hypot(a, b);
  let alpha;
  if (form === 'sin-plus') alpha = Math.atan2(b, a);
  else if (form === 'sin-minus') alpha = Math.atan2(-b, a);
  else if (form === 'cos-plus') alpha = Math.atan2(-a, b);
  else alpha = Math.atan2(a, b);
  return { R, alpha };
}

export function solveAuxiliary(p) {
  const { a, b } = p;
  const { R, alpha } = auxiliary(a, b, p.form);
  const F = AUX_FORMS[p.form] ?? AUX_FORMS['sin-plus'];
  // Maximum R where the inside angle is π/2 (sin) or 0 (cos): first such x ≥ 0.
  const inside = p.form === 'sin-plus' ? Math.PI / 2 - alpha : p.form === 'sin-minus' ? Math.PI / 2 + alpha : p.form === 'cos-plus' ? -alpha : alpha;
  const xMax = ((inside % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return {
    a,
    b,
    R,
    alpha,
    alphaDeg: (alpha * 180) / Math.PI,
    sum: (x) => a * Math.sin(x) + b * Math.cos(x),
    partA: (x) => a * Math.sin(x),
    partB: (x) => b * Math.cos(x),
    combined: F.g(R, alpha),
    formTex: F.tex,
    xMax,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// blackbody: Planck's law and Wien's displacement law
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Exact SI defining constants (BIPM, The International System of Units, 9th edition, 2019):
export const PLANCK_H = 6.62607015e-34; // J s
export const LIGHT_C = 299792458; // m/s
export const BOLTZMANN_K = 1.380649e-23; // J/K
// CODATA 2018 recommended values (NIST, physics.nist.gov/constants):
export const WIEN_B = 2.897771955e-3; // m K
export const STEFAN_SIGMA = 5.670374419e-8; // W m⁻² K⁻⁴

/** Spectral radiance B_λ(λ, T) = (2hc²/λ⁵) / (e^{hc/(λkT)} − 1), in W·sr⁻¹·m⁻³. */
export function planck(lambda, T) {
  if (!(lambda > 0) || !(T > 0)) return 0;
  const x = (PLANCK_H * LIGHT_C) / (lambda * BOLTZMANN_K * T);
  if (x > 700) return 0;
  return (2 * PLANCK_H * LIGHT_C * LIGHT_C) / lambda ** 5 / Math.expm1(x);
}

/** Wavelength of the Planck peak at temperature T, found numerically (not from Wien's b). */
export function peakWavelength(T) {
  const lnL = goldenExtremum((u) => planck(Math.exp(u), T), Math.log(1e-9), Math.log(1e-2), { maximise: true, iterations: 200 });
  return Math.exp(lnL);
}

/** Radiant exitance M = π ∫ B_λ dλ, integrated numerically (Simpson in ln λ). */
export function radiantExitance(T) {
  const g = (u) => {
    const l = Math.exp(u);
    return planck(l, T) * l;
  };
  return Math.PI * simpson(g, Math.log(1e-9), Math.log(1e-1), 20000);
}

export function solveBlackbody(p) {
  const temps = [p.temperature, ...(p.compare ? [p.temperature2, p.temperature3] : [])];
  const curves = temps.map((T) => {
    const lp = peakWavelength(T);
    return { T, peak: lp, peakRadiance: planck(lp, T), f: (lambdaNm) => planck(lambdaNm * 1e-9, T) };
  });
  const main = curves[0];
  return {
    curves,
    peakWavelength: main.peak,
    peakRadiance: main.peakRadiance,
    lambdaT: main.peak * p.temperature,
    exitance: STEFAN_SIGMA * p.temperature ** 4,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// inequality: critical points, test regions and the solution set
// ─────────────────────────────────────────────────────────────────────────────────────────────

export const RELATIONS = { lt: '<', le: '\\le', gt: '>', ge: '\\ge' };
const holds = (v, rel) => (rel === 'lt' ? v < 0 : rel === 'le' ? v <= 0 : rel === 'gt' ? v > 0 : v >= 0);

/**
 * Solve g(x) rel 0 on [lo, hi] (the window for critical points).
 * Returns { critical: [{ x, kind: 'zero'|'pole' }], regions: [{ a, b, test, value, ok }], pieces }
 * where pieces are solution intervals { a, b, closedA, closedB } (a = −∞ / b = ∞ allowed).
 */
export function solveInequalityFn(g, rel, lo = -50, hi = 50) {
  const zeros = findRoots(g, lo, hi, 4000);
  const { breaks, asymptotes } = sampleFunction(g, lo, hi, { n: 4000, yMin: -10, yMax: 10, maxDepth: 6 });
  const poles = [...new Set([...breaks, ...asymptotes])];
  const critical = [];
  for (const x of zeros) critical.push({ x, kind: 'zero' });
  for (const x of poles) {
    const near = critical.find((c) => Math.abs(c.x - x) < 1e-6 * Math.max(1, Math.abs(x)));
    if (near) near.kind = 'pole';
    else critical.push({ x, kind: 'pole' });
  }
  critical.sort((p, q) => p.x - q.x);
  const edges = [-Infinity, ...critical.map((c) => c.x), Infinity];
  const regions = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    const test = a === -Infinity && b === Infinity ? 0 : a === -Infinity ? b - 1 : b === Infinity ? a + 1 : (a + b) / 2;
    const value = g(test);
    regions.push({ a, b, test, value, ok: fin(value) && holds(value, rel) && value !== 0 });
  }
  // Build solution pieces: satisfied regions joined through included zeros; isolated zeros.
  const inclusive = rel === 'le' || rel === 'ge';
  const pieces = [];
  let cur = null;
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    const cAfter = critical[i]; // the critical point at r.b (undefined for the last region)
    if (r.ok) {
      if (!cur) {
        const cBefore = critical[i - 1];
        cur = { a: r.a, closedA: Boolean(cBefore && cBefore.kind === 'zero' && inclusive) };
      }
    }
    if (cAfter) {
      const zeroIn = cAfter.kind === 'zero' && inclusive;
      if (cur) {
        if (zeroIn && regions[i + 1]?.ok) continue; // joins the next region through an included zero
        pieces.push({ ...cur, b: r.b, closedB: zeroIn });
        cur = null;
      } else if (zeroIn && !regions[i + 1]?.ok) pieces.push({ a: cAfter.x, b: cAfter.x, closedA: true, closedB: true });
    } else if (cur) {
      pieces.push({ ...cur, b: Infinity, closedB: false });
      cur = null;
    }
  }
  return { critical, regions, pieces };
}

const numTex = (v) => {
  const r = Number(v.toPrecision(4));
  const s = Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : String(r);
  return s;
};

/** LaTeX for a number, as a fraction p/q (q ≤ 12) when it is one: 4/3 → "\frac{4}{3}", −0.5 → "-\frac{1}{2}". */
export function fracTex(v) {
  if (!fin(v)) return '\\text{undefined}';
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(v * q);
    if (Math.abs(v * q - p) < 1e-9 * Math.max(1, Math.abs(v * q))) {
      if (q === 1) return String(p);
      return `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${q}}`;
    }
  }
  return numTex(v);
}

/** LaTeX for a solution set: "x\le -2\text{ or }x\ge 3". */
export function solutionTex(pieces, v = 'x') {
  if (!pieces.length) return '\\text{no real }' + v;
  const parts = pieces.map(({ a, b, closedA, closedB }) => {
    if (a === -Infinity && b === Infinity) return `\\text{all real }${v}`;
    if (a === b) return `${v}=${numTex(a)}`;
    if (a === -Infinity) return `${v}${closedB ? '\\le' : '<'}${numTex(b)}`;
    if (b === Infinity) return `${v}${closedA ? '\\ge' : '>'}${numTex(a)}`;
    return `${numTex(a)}${closedA ? '\\le' : '<'}${v}${closedB ? '\\le' : '<'}${numTex(b)}`;
  });
  return parts.join('\\text{ or }');
}

export function solveInequality(p) {
  const L = expression(p.ineqLeft);
  if (L.error) return { error: L.error, source: p.ineqLeft, name: 'left side' };
  const R = expression(p.ineqRight);
  if (R.error) return { error: R.error, source: p.ineqRight, name: 'right side' };
  const g = (x) => L.f(x) - R.f(x);
  const s = solveInequalityFn(g, p.relation);
  return {
    left: L.f,
    right: R.f,
    g,
    ...s,
    statementTex: `${L.tex}${RELATIONS[p.relation]}${R.tex}`,
    solutionTex: solutionTex(s.pieces),
    zeroCount: s.critical.filter((c) => c.kind === 'zero').length,
    poleCount: s.critical.filter((c) => c.kind === 'pole').length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// inverse trig: restrict, invert, differentiate
// ─────────────────────────────────────────────────────────────────────────────────────────────

export const INVERSE_TRIG = {
  sin: {
    f: Math.sin,
    inv: Math.asin,
    restrict: [-Math.PI / 2, Math.PI / 2],
    domain: [-1, 1],
    dInv: (x) => 1 / Math.sqrt(1 - x * x),
    tex: 'y=\\sin x,\\ -\\frac{\\pi}{2}\\le x\\le\\frac{\\pi}{2}',
    invTex: 'y=\\sin^{-1}x',
    dTex: '\\frac{d}{dx}\\sin^{-1}x=\\frac{1}{\\sqrt{1-x^{2}}}',
  },
  cos: {
    f: Math.cos,
    inv: Math.acos,
    restrict: [0, Math.PI],
    domain: [-1, 1],
    dInv: (x) => -1 / Math.sqrt(1 - x * x),
    tex: 'y=\\cos x,\\ 0\\le x\\le\\pi',
    invTex: 'y=\\cos^{-1}x',
    dTex: '\\frac{d}{dx}\\cos^{-1}x=-\\frac{1}{\\sqrt{1-x^{2}}}',
  },
  tan: {
    f: Math.tan,
    inv: Math.atan,
    restrict: [-Math.PI / 2, Math.PI / 2],
    domain: [-Infinity, Infinity],
    dInv: (x) => 1 / (1 + x * x),
    tex: 'y=\\tan x,\\ -\\frac{\\pi}{2}<x<\\frac{\\pi}{2}',
    invTex: 'y=\\tan^{-1}x',
    dTex: '\\frac{d}{dx}\\tan^{-1}x=\\frac{1}{1+x^{2}}',
  },
};

export function solveInverseTrig(p) {
  const T = INVERSE_TRIG[p.trigFn] ?? INVERSE_TRIG.sin;
  const [d0, d1] = T.domain;
  const x0 = Math.min(Math.max(p.trigProbe, d0 === -Infinity ? -1e9 : d0 + 1e-6), d1 === Infinity ? 1e9 : d1 - 1e-6);
  const y0 = T.inv(x0);
  const slope = T.dInv(x0);
  return { ...T, x0, y0, slope, fSlope: 1 / slope };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// substitution: ∫ f(g(x)) g'(x) dx over [a, b] = ∫ f(u) du over [g(a), g(b)]
// ─────────────────────────────────────────────────────────────────────────────────────────────

export function solveSubstitution(p) {
  const F = expression(p.subF, 'u');
  if (F.error) return { error: F.error, source: p.subF, name: 'f(u)' };
  const G = expression(p.subG, 'x');
  if (G.error) return { error: G.error, source: p.subG, name: 'g(x)' };
  const dgAst = differentiate(G.ast, 'x');
  const dg = compile(dgAst);
  const gp = (x) => dg({ x });
  const integrand = (x) => F.f(G.f(x)) * gp(x);
  const a = p.subA;
  const b = p.subB;
  const uA = G.f(a);
  const uB = G.f(b);
  const n = 4000;
  const integrandAst = mul(dgAst, substitute(F.ast, 'u', G.ast));
  return {
    f: F.f,
    g: G.f,
    gPrime: gp,
    integrand,
    a,
    b,
    uA,
    uB,
    areaX: simpson(integrand, a, b, n),
    areaU: simpson(F.f, uA, uB, n),
    fTex: `f(u)=${F.tex}`,
    gTex: `u=g(x)=${G.tex}`,
    dgTex: `g'(x)=${toTex(dgAst)}`,
    integrandTex: `f(g(x))\\,g'(x)=${toTex(integrandAst)}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// by parts: ∫ u dv = [uv] − ∫ v du as areas; reduction formulas
// ─────────────────────────────────────────────────────────────────────────────────────────────

export const REDUCTIONS = {
  sin: {
    tex: 'I_n=\\int_0^{\\pi/2}\\sin^{n}x\\,dx',
    ruleTex: 'I_n=\\frac{n-1}{n}\\,I_{n-2}',
    integrand: (n) => (x) => Math.sin(x) ** n,
    range: [0, Math.PI / 2],
    base: (n) => (n % 2 === 0 ? Math.PI / 2 : 1), // I₀ = π/2, I₁ = 1
    step: (n, prev) => ((n - 1) / n) * prev,
    stride: 2,
  },
  xex: {
    tex: 'I_n=\\int_0^{1}x^{n}e^{x}\\,dx',
    ruleTex: 'I_n=e-n\\,I_{n-1}',
    integrand: (n) => (x) => x ** n * Math.exp(x),
    range: [0, 1],
    base: () => Math.E - 1, // I₀ = e − 1
    step: (n, prev) => Math.E - n * prev,
    stride: 1,
  },
};

/** Values of a reduction formula from its base case up to n: [{ n, value }]. */
export function reductionChain(kind, n) {
  const R = REDUCTIONS[kind] ?? REDUCTIONS.sin;
  const start = R.stride === 2 ? n % 2 : 0;
  const chain = [{ n: start, value: R.base(start) }];
  for (let k = start + R.stride; k <= n; k += R.stride) chain.push({ n: k, value: R.step(k, chain[chain.length - 1].value) });
  return chain;
}

export function solveByParts(p) {
  if (p.partsView === 'reduction') {
    const R = REDUCTIONS[p.reduction] ?? REDUCTIONS.sin;
    const n = Math.round(p.reductionN);
    const chain = reductionChain(p.reduction, n);
    const f = R.integrand(n);
    return {
      mode: 'reduction',
      n,
      chain,
      f,
      range: R.range,
      tex: R.tex,
      ruleTex: R.ruleTex,
      reductionValue: chain[chain.length - 1].value,
      reductionNumeric: simpson(f, R.range[0], R.range[1], 4000),
    };
  }
  const U = expression(p.partsU);
  if (U.error) return { error: U.error, source: p.partsU, name: 'u(x)' };
  const V = expression(p.partsV);
  if (V.error) return { error: V.error, source: p.partsV, name: 'v(x)' };
  const du = compile(differentiate(U.ast, 'x'));
  const dv = compile(differentiate(V.ast, 'x'));
  const a = p.partsA;
  const b = p.partsB;
  const n = 4000;
  const intUdv = simpson((x) => U.f(x) * dv({ x }), a, b, n);
  const intVdu = simpson((x) => V.f(x) * du({ x }), a, b, n);
  const boundary = U.f(b) * V.f(b) - U.f(a) * V.f(a);
  return {
    mode: 'area',
    u: U.f,
    v: V.f,
    a,
    b,
    intUdv,
    intVdu,
    boundary,
    uTex: `u=${U.tex}`,
    vTex: `v=${V.tex}`,
    dvTex: `dv=${toTex(differentiate(V.ast, 'x'))}\\,dx`,
    duTex: `du=${toTex(differentiate(U.ast, 'x'))}\\,dx`,
    start: [U.f(a), V.f(a)],
    end: [U.f(b), V.f(b)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// partial fractions: N(x) / Π(x − rᵢ)  →  quotient + Σ A / (x − r)^k
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Polynomial long division (coefficients highest first): { quotient, remainder }. */
export function polyDivide(num, den) {
  const r = num.slice();
  const dn = den.length - 1;
  if (r.length - 1 < dn) return { quotient: [0], remainder: r };
  const q = new Array(r.length - dn).fill(0);
  for (let i = 0; i < q.length; i++) {
    const c = r[i] / den[0];
    q[i] = c;
    for (let j = 0; j <= dn; j++) r[i + j] -= c * den[j];
  }
  return { quotient: q, remainder: r.slice(q.length) };
}

/** Solve A x = b by Gaussian elimination with partial pivoting. Returns null if singular. */
export function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = c + 1; r < n; r++) {
      const k = M[r][c] / M[c][c];
      for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j];
    x[r] = s / M[r][r];
  }
  return x;
}

/**
 * Partial fractions of N(x) / Π(x − rᵢ) (repeated roots allowed).
 * @param {number[]} numerator coefficients, highest power first
 * @param {number[]} roots denominator roots (the denominator is monic)
 * @returns {{ quotient: number[], terms: { root: number, power: number, coef: number }[], denominator: number[] } | null}
 */
export function partialFractions(numerator, roots) {
  const den = expandRoots(roots, 1);
  const d = roots.length;
  const { quotient, remainder } = polyDivide(numerator, den);
  // Pad the remainder to degree d − 1 (d coefficients).
  const rem = new Array(Math.max(0, d - remainder.length)).fill(0).concat(remainder).slice(-d);
  const groups = multiplicities(roots, 1e-9);
  const basis = [];
  const terms = [];
  for (const { root, multiplicity } of groups) {
    for (let k = 1; k <= multiplicity; k++) {
      // D(x) / (x − root)^k = (x − root)^{m−k} · Π over the other roots.
      const others = [];
      for (const g of groups) if (g.root !== root) for (let i = 0; i < g.multiplicity; i++) others.push(g.root);
      for (let i = 0; i < multiplicity - k; i++) others.push(root);
      const poly = expandRoots(others, 1); // degree d − k
      basis.push(new Array(d - poly.length).fill(0).concat(poly));
      terms.push({ root, power: k, coef: 0 });
    }
  }
  // Columns are basis polynomials; rows are coefficients of x^{d−1} … x⁰.
  const A = Array.from({ length: d }, (_, row) => basis.map((col) => col[row]));
  const sol = d ? solveLinear(A, rem) : [];
  if (!sol) return null;
  sol.forEach((c, i) => (terms[i].coef = c));
  const trimmed = quotient.length > 1 || Math.abs(quotient[0]) > 1e-12 ? quotient : [0];
  return { quotient: trimmed, terms, denominator: den };
}

export function solvePartialFractions(p) {
  const pf = partialFractions(p.pfNumerator, p.pfRoots);
  if (!pf) return { error: { message: 'These roots give a denominator that cannot be split. Try different roots.', pos: 0, end: 0 }, source: '', name: 'denominator' };
  const N = p.pfNumerator;
  const D = pf.denominator;
  const f = (x) => polyEval(N, x) / polyEval(D, x);
  const termFns = pf.terms.map(({ root, power, coef }) => (x) => coef / (x - root) ** power);
  const q = pf.quotient;
  const hasQuotient = q.some((c) => Math.abs(c) > 1e-12);
  const qf = (x) => polyEval(q, x);
  const denTex = multiplicities(p.pfRoots)
    .map(({ root, multiplicity }) => `${root === 0 ? 'x' : `\\left(x${signed(-root)}\\right)`}${multiplicity > 1 ? `^{${multiplicity}}` : ''}`)
    .join('');
  const denOf = ({ root, power }) => `${root === 0 ? 'x' : `\\left(x${signed(-root)}\\right)`}${power > 1 ? `^{${power}}` : ''}`;
  const termTex = pf.terms.map(({ root, power, coef }) => {
    const den = denOf({ root, power });
    const mag = fracTex(Math.abs(coef));
    // A fractional coefficient is written in front: \frac{4}{3}\cdot\frac{1}{x-1}.
    const body = /\\frac/.test(mag) ? `${mag}\\cdot\\frac{1}{${den}}` : `\\frac{${mag}}{${den}}`;
    return { sign: coef < 0 ? '-' : '+', tex: body };
  });
  let rhs = hasQuotient ? polyTex(q) : '';
  termTex.forEach((t, i) => {
    rhs += i === 0 && !rhs ? (t.sign === '-' ? '-' : '') + t.tex : `${t.sign}${t.tex}`;
  });
  return {
    f,
    terms: pf.terms,
    termFns,
    quotient: q,
    hasQuotient,
    quotientFn: qf,
    poles: multiplicities(p.pfRoots).map((g) => g.root),
    lhsTex: `\\frac{${polyTex(N)}}{${denTex}}`,
    rhsTex: rhs || '0',
    termTex: termTex.map((t) => (t.sign === '-' ? `-${t.tex}` : t.tex)),
    termDenTex: pf.terms.map(denOf),
    quotientTex: hasQuotient ? polyTex(q) : null,
    coefs: pf.terms.map((t) => t.coef),
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// heating: heating curve of water (specific and latent heat) and Newton's law of cooling
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Typical values for water at standard atmospheric pressure. Every value carries its source.
export const WATER = {
  cIce: { value: 2100, unit: 'J/(kg·K)', source: 'Young & Freedman, University Physics, 15th ed., Table 17.3 (ice near 0 °C)' },
  cWater: { value: 4190, unit: 'J/(kg·K)', source: 'Young & Freedman, University Physics, 15th ed., Table 17.3 (liquid water)' },
  cSteam: { value: 2010, unit: 'J/(kg·K)', source: 'Serway & Jewett, Physics for Scientists and Engineers, Table 20.1 (steam at 100 °C)' },
  latentFusion: { value: 3.34e5, unit: 'J/kg', source: 'Young & Freedman, University Physics, 15th ed., Table 17.4' },
  latentVaporisation: { value: 2.256e6, unit: 'J/kg', source: 'Young & Freedman, University Physics, 15th ed., Table 17.4' },
  meltingPoint: { value: 0, unit: '°C', source: 'at 101.325 kPa' },
  boilingPoint: { value: 100, unit: '°C', source: 'at 101.325 kPa' },
};

/**
 * Stages of the heating curve with constant power P: warming (Q = mcΔT) and plateaus (Q = mL).
 * Returns [{ kind: 'solid'|'melting'|'liquid'|'boiling'|'gas', t0, t1, T0, T1, Q }].
 */
export function heatingStages(p) {
  const { mass: m, power: P, startTemp, endTemp, cIce, cWater, cSteam, latentFusion, latentVaporisation } = p;
  const melt = WATER.meltingPoint.value;
  const boil = WATER.boilingPoint.value;
  const stages = [];
  let t = 0;
  const push = (kind, T0, T1, Q) => {
    if (Q <= 0) return;
    stages.push({ kind, t0: t, t1: t + Q / P, T0, T1, Q });
    t += Q / P;
  };
  let T = startTemp;
  if (T < melt) {
    const T1 = Math.min(melt, endTemp);
    push('solid', T, T1, m * cIce * (T1 - T));
    T = T1;
  }
  if (T === melt && endTemp > melt && startTemp <= melt) push('melting', melt, melt, m * latentFusion);
  if (T < boil && endTemp > T) {
    const T1 = Math.min(boil, endTemp);
    push('liquid', T, T1, m * cWater * (T1 - T));
    T = T1;
  }
  if (T === boil && endTemp > boil) push('boiling', boil, boil, m * latentVaporisation);
  if (endTemp > boil && T === boil) push('gas', boil, endTemp, m * cSteam * (endTemp - boil));
  return stages;
}

export function heatingTemperature(stages, t) {
  if (!stages.length) return NaN;
  for (const s of stages) {
    if (t <= s.t1) return s.T0 + ((s.T1 - s.T0) * Math.max(0, t - s.t0)) / (s.t1 - s.t0);
  }
  return stages[stages.length - 1].T1;
}

export function heatingStageAt(stages, t) {
  return stages.find((s) => t <= s.t1) ?? stages[stages.length - 1];
}

/** Newton's law of cooling: T(t) = T_env + (T₀ − T_env) e^{−kt}. */
export function newtonCooling(t, { coolStart, ambient, coolingK }) {
  return ambient + (coolStart - ambient) * Math.exp(-coolingK * t);
}

export function solveHeating(p) {
  if (p.heatingMode === 'cooling') {
    const total = 5 / p.coolingK; // five time constants: within 1% of the surroundings
    return { mode: 'cooling', total, halfTime: Math.LN2 / p.coolingK, T: (t) => newtonCooling(t, p) };
  }
  const stages = heatingStages(p);
  const total = stages.length ? stages[stages.length - 1].t1 : 1;
  const dur = (kind) => stages.filter((s) => s.kind === kind).reduce((s, st) => s + (st.t1 - st.t0), 0);
  return { mode: 'curve', stages, total, meltTime: dur('melting'), boilTime: dur('boiling'), T: (t) => heatingTemperature(stages, t) };
}

/** Time at step n of a heating run (RUN_STEPS steps from 0 to the total time). */
export function heatingTime(solved, n) {
  return (Math.min(n, RUN_STEPS) / RUN_STEPS) * solved.total;
}

// Re-exported for the view (labels).
export { parse, toTex };
