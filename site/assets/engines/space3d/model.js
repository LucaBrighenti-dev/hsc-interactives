// space3d model: pure 3D geometry for the space3d engine (guide §9.1).
// No DOM, no three.js, no timers, no randomness. Importable in Node: tests/engines/space3d.test.mjs
// checks it against analytic answers.
//
// Coordinates are right-handed (x, y, z) arrays.
//   trig3d, vectors, lines-spheres, orthographic, descriptive: x east (width), y north (depth, front
//   to back), z up.
//   revolution: the region lies in the xy-plane with y up; z comes out of the page.

export const DEG = Math.PI / 180;

// ── vec3 ─────────────────────────────────────────────────────────────────────────────────────────

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const length = (a) => Math.hypot(a[0], a[1], a[2]);
export const distance = (a, b) => length(sub(a, b));
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function normalize(a) {
  const L = length(a);
  return L > 0 ? scale(a, 1 / L) : [0, 0, 0];
}

/** Angle between two vectors in radians, 0 to π. NaN if either is the zero vector. */
export function angleBetween(a, b) {
  if (!(length(a) > 0) || !(length(b) > 0)) return NaN;
  // atan2 of |a × b| and a · b is accurate at every angle (acos loses digits near 0 and π).
  return Math.atan2(length(cross(a, b)), dot(a, b));
}

/** Scalar projection of a on b: a · b / |b|. NaN if b is the zero vector. */
export function scalarProjection(a, b) {
  const L = length(b);
  return L > 0 ? dot(a, b) / L : NaN;
}

/** Vector projection of a on b: ((a · b) / |b|²) b. NaN components if b is the zero vector. */
export function projection(a, b) {
  const bb = dot(b, b);
  return bb > 0 ? scale(b, dot(a, b) / bb) : [NaN, NaN, NaN];
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const finite3 = (p) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);

/**
 * Outputs that don't apply (another scene or mode) or are undefined (a zero vector, a curve that is
 * undefined) are null, never NaN: the readout shows "—" and exported numbers stay finite.
 */
function clean(outputs) {
  const out = {};
  for (const [k, v] of Object.entries(outputs)) out[k] = typeof v === 'number' && Number.isFinite(v) ? v : null;
  return out;
}

// ── revolution ───────────────────────────────────────────────────────────────────────────────────

/**
 * ∫ g(s) ds from a to b by adaptive Simpson's rule (16 starting panels, so a symmetric integrand
 * can't fool the first estimate), to a relative tolerance.
 */
export function integrate(g, a, b, { tol = 1e-10, maxDepth = 40 } = {}) {
  if (a === b) return 0;
  const panels = 16;
  const h = (b - a) / panels;
  const pieces = [];
  let rough = 0;
  for (let i = 0; i < panels; i++) {
    const x0 = a + i * h;
    const x1 = i === panels - 1 ? b : a + (i + 1) * h;
    const f0 = g(x0);
    const f1 = g(x1);
    const fm = g((x0 + x1) / 2);
    const whole = ((x1 - x0) / 6) * (f0 + 4 * fm + f1);
    pieces.push([x0, x1, f0, fm, f1, whole]);
    rough += whole;
  }
  const eps = Math.max(Math.abs(rough) * tol, 1e-300) / panels;
  let total = 0;
  for (const [x0, x1, f0, fm, f1, whole] of pieces) total += simpson(g, x0, x1, f0, fm, f1, whole, eps, maxDepth);
  return total;
}

function simpson(g, a, b, fa, fm, fb, whole, eps, depth) {
  const m = (a + b) / 2;
  const lm = (a + m) / 2;
  const rm = (m + b) / 2;
  const flm = g(lm);
  const frm = g(rm);
  const left = ((m - a) / 6) * (fa + 4 * flm + fm);
  const right = ((b - m) / 6) * (fm + 4 * frm + fb);
  const delta = left + right - whole;
  if (depth <= 0 || Math.abs(delta) <= 15 * eps || !Number.isFinite(delta)) return left + right + delta / 15;
  return simpson(g, a, m, fa, flm, fm, left, eps / 2, depth - 1) + simpson(g, m, b, fm, frm, fb, right, eps / 2, depth - 1);
}

export const DISC_RULES = { left: 0, midpoint: 0.5, right: 1 };

/**
 * Disc slices for V ≈ Σ π rᵢ² Δ over [lo, hi]. Each sample point is computed from i directly
 * (lo + (i + offset)Δ), never by repeated addition.
 * @param {(s:number)=>number} fn radius as a function of the variable along the axis
 */
export function discSlices(fn, lo, hi, n, rule = 'midpoint') {
  const count = Math.max(1, Math.floor(n));
  const w = (hi - lo) / count;
  const off = DISC_RULES[rule] ?? 0.5;
  const out = [];
  for (let i = 0; i < count; i++) {
    const s = lo + (i + off) * w;
    const r = fn(s);
    out.push({ i, s0: lo + i * w, s1: lo + (i + 1) * w, s, r, volume: Math.PI * r * r * w });
  }
  return out;
}

/**
 * Solid of revolution: the region between the curve and the axis of rotation, for the variable s
 * from lower to upper (x for the x-axis, y for the y-axis), spun about that axis.
 * V = π ∫ f(s)² ds (exact to about 1e-10 relative), and the disc sum Σ π f(sᵢ)² Δ.
 * Bounds given the wrong way round are swapped. If f is undefined anywhere on the interval,
 * the numbers are NaN and `undefinedAt` says where.
 * @param {{ fn: (s:number)=>number, axis?: 'x'|'y', lower: number, upper: number, discs: number, discRule?: string }} p
 */
export function revolution({ fn, axis = 'x', lower, upper, discs, discRule = 'midpoint' }) {
  const lo = Math.min(lower, upper);
  const hi = Math.max(lower, upper);
  const n = Math.max(1, Math.floor(discs));
  const slices = discSlices(fn, lo, hi, n, discRule);
  const samples = [];
  const N = 240;
  let undefinedAt = null;
  for (let i = 0; i <= N; i++) {
    const s = i === N ? hi : lo + ((hi - lo) * i) / N;
    const r = fn(s);
    if (!Number.isFinite(r) && undefinedAt === null) undefinedAt = s;
    samples.push([s, r]);
  }
  for (const d of slices) if (!Number.isFinite(d.r) && undefinedAt === null) undefinedAt = d.s;
  const width = (hi - lo) / n;
  if (undefinedAt !== null) {
    return { axis, lo, hi, n, rule: discRule, slices, samples, undefinedAt, volume: NaN, volumeOverPi: NaN, discSum: NaN, discError: NaN, discWidth: width, maxRadius: NaN };
  }
  const integral = integrate((s) => {
    const r = fn(s);
    return r * r;
  }, lo, hi);
  const volume = Number.isFinite(integral) ? Math.PI * integral : NaN;
  const discSum = slices.reduce((sum, d) => sum + d.volume, 0);
  // The integral is accurate to about 1e-10 relative, so a smaller difference is rounding, not error.
  const diff = discSum - volume;
  const discError = Math.abs(diff) <= 1e-10 * Math.abs(volume) ? 0 : diff;
  const maxRadius = Math.max(0, ...samples.map(([, r]) => Math.abs(r)), ...slices.map((d) => Math.abs(d.r)));
  return {
    axis,
    lo,
    hi,
    n,
    rule: discRule,
    slices,
    samples,
    undefinedAt,
    volume,
    volumeOverPi: volume / Math.PI,
    discSum,
    discError,
    discWidth: width,
    maxRadius,
  };
}

export function revolutionOutputs(r) {
  const ok = r && !r.error;
  return clean({
    volume: ok ? r.volume : NaN,
    volumeOverPi: ok ? r.volumeOverPi : NaN,
    discSum: ok ? r.discSum : NaN,
    discError: ok ? r.discError : NaN,
    discWidth: ok ? r.discWidth : NaN,
  });
}

// ── trig3d ───────────────────────────────────────────────────────────────────────────────────────

/** True bearing (0° ≤ θ < 360°, clockwise from north) of a direction given as (east, north). */
export function bearingOf(east, north) {
  let b = Math.atan2(east, north) / DEG;
  if (b < 0) b += 360;
  if (b >= 360) b -= 360;
  return b;
}

/** Ground point at a true bearing and distance from the origin (z = 0). */
export function pointOnBearing(bearing, dist) {
  return [dist * Math.sin(bearing * DEG), dist * Math.cos(bearing * DEG), 0];
}

/** The smaller angle between two bearings, 0° to 180°. */
export function bearingDifference(b1, b2) {
  const d = Math.abs(b1 - b2) % 360;
  return d > 180 ? 360 - d : d;
}

/** Angle of elevation (degrees) of a point `rise` above the eye, `run` away horizontally. */
export function elevation(rise, run) {
  return Math.atan2(rise, run) / DEG;
}

export function towerScene({ towerHeight: h, distA, bearingA, distB, bearingB }) {
  const O = [0, 0, 0];
  const T = [0, 0, h];
  const A = pointOnBearing(bearingA, distA);
  const B = pointOnBearing(bearingB, distB);
  return {
    scene: 'tower',
    O,
    T,
    A,
    B,
    h,
    distA,
    distB,
    bearingA,
    bearingB,
    elevA: elevation(h, distA),
    elevB: elevation(h, distB),
    baseAngle: bearingDifference(bearingA, bearingB),
    distAB: distance(A, B),
    bearingAtoB: bearingOf(B[0] - A[0], B[1] - A[1]),
  };
}

/** Cuboid ABCD (base) EFGH (top, E above A): length l east, width w north, height h. */
export function cuboidScene({ length: l, width: w, height: h }) {
  const v = {
    A: [0, 0, 0], B: [l, 0, 0], C: [l, w, 0], D: [0, w, 0],
    E: [0, 0, h], F: [l, 0, h], G: [l, w, h], H: [0, w, h],
  };
  const faceDiagonal = Math.hypot(l, w);
  return { scene: 'cuboid', l, w, h, v, faceDiagonal, spaceDiagonal: Math.hypot(l, w, h), diagonalAngle: elevation(h, faceDiagonal) };
}

/**
 * Ramp (a wedge): base ABCD (l east × w north), rising eastwards to the top edge EF above BC.
 * AE is a line of greatest slope; AF is the diagonal of the sloping face, above the base diagonal AC.
 */
export function rampScene({ length: l, width: w, height: h }) {
  const v = { A: [0, 0, 0], B: [l, 0, 0], C: [l, w, 0], D: [0, w, 0], E: [l, 0, h], F: [l, w, h] };
  const faceDiagonal = Math.hypot(l, w);
  return {
    scene: 'ramp',
    l,
    w,
    h,
    v,
    slopeAngle: elevation(h, l),
    faceDiagonal,
    spaceDiagonal: Math.hypot(l, w, h),
    diagonalAngle: elevation(h, faceDiagonal),
  };
}

/** Right square pyramid: base side s centred on M at the origin, apex V at height h. */
export function pyramidScene({ baseSide: s, height: h }) {
  const k = s / 2;
  const corners = [[-k, -k, 0], [k, -k, 0], [k, k, 0], [-k, k, 0]];
  return {
    scene: 'pyramid',
    s,
    h,
    corners,
    V: [0, 0, h],
    M: [0, 0, 0],
    N: [0, -k, 0], // midpoint of the front base edge
    K: [k, -k, 0], // a base vertex
    slantHeight: Math.hypot(h, k),
    faceAngle: elevation(h, k),
    slantEdge: Math.hypot(h, s / Math.SQRT2),
    edgeAngle: elevation(h, s / Math.SQRT2),
  };
}

export function trig3dScene(p) {
  switch (p.scene) {
    case 'cuboid':
      return cuboidScene(p);
    case 'ramp':
      return rampScene(p);
    case 'pyramid':
      return pyramidScene(p);
    default:
      return towerScene(p);
  }
}

const TRIG_OUTPUTS = ['elevA', 'elevB', 'baseAngle', 'distAB', 'bearingAtoB', 'faceDiagonal', 'spaceDiagonal', 'diagonalAngle', 'slopeAngle', 'slantHeight', 'faceAngle', 'slantEdge', 'edgeAngle'];

/** Every trig3d output; those that don't belong to the scene are null (the readout shows —). */
export function trig3dOutputs(s) {
  const out = {};
  for (const k of TRIG_OUTPUTS) out[k] = typeof s[k] === 'number' ? s[k] : NaN;
  return clean(out);
}

// ── vectors ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Vector playground. In 2D the z components are ignored (taken as 0).
 * operation: add (a + b), subtract (a − b), scale (k a), dot (no result vector), project (projection of a on b).
 */
export function vectorScene({ dimension = '3d', ax, ay, az, bx, by, bz, scalar = 1, operation = 'dot' }) {
  const flat = dimension === '2d';
  const a = [ax, ay, flat ? 0 : az];
  const b = [bx, by, flat ? 0 : bz];
  let result = null;
  if (operation === 'add') result = add(a, b);
  else if (operation === 'subtract') result = sub(a, b);
  else if (operation === 'scale') result = scale(a, scalar);
  else if (operation === 'project') result = projection(a, b);
  const theta = angleBetween(a, b);
  return {
    flat,
    operation,
    scalar,
    a,
    b,
    result,
    magA: length(a),
    magB: length(b),
    dot: dot(a, b),
    angle: theta / DEG,
    scalarProjection: scalarProjection(a, b),
  };
}

export function vectorOutputs(v) {
  const r = v.result ?? [NaN, NaN, NaN];
  return clean({
    magA: v.magA,
    magB: v.magB,
    dot: v.dot,
    angle: v.angle,
    scalarProjection: v.scalarProjection,
    resultX: r[0],
    resultY: r[1],
    resultZ: r[2],
    resultMag: v.result ? length(r) : NaN,
  });
}

// ── lines and spheres ────────────────────────────────────────────────────────────────────────────

export const RELATION = Object.freeze({ intersecting: 0, parallel: 1, coincident: 2, skew: 3 });

/**
 * Two lines r = a1 + λu and r = a2 + μv.
 * Parallel when |u × v| ≤ 1e-9 |u||v|; then the distance is |(a2 − a1) × u| / |u| and the lines
 * coincide when it is (relatively) zero. Otherwise the distance is |(a2 − a1) · (u × v)| / |u × v|:
 * zero means they intersect, otherwise they are skew. `lambda` and `mu` give the closest points.
 * The angle is the acute angle between the directions, in degrees.
 */
export function relateLines(a1, u, a2, v) {
  const out = { relation: NaN, kind: 'invalid', angle: NaN, distance: NaN, lambda: NaN, mu: NaN, point: null, closest1: null, closest2: null };
  const lu = length(u);
  const lv = length(v);
  if (!(lu > 0) || !(lv > 0) || !finite3(a1) || !finite3(a2)) return out;
  const n = cross(u, v);
  const ln = length(n);
  const w = sub(a2, a1);
  out.angle = Math.atan2(ln, Math.abs(dot(u, v))) / DEG;
  const tol = 1e-9 * Math.max(1, length(w));
  if (ln <= 1e-9 * lu * lv) {
    const d = length(cross(w, u)) / lu;
    const mu = dot(sub(a1, a2), v) / (lv * lv);
    out.lambda = 0;
    out.mu = mu;
    out.closest1 = a1;
    out.closest2 = add(a2, scale(v, mu));
    if (d <= tol) {
      out.relation = RELATION.coincident;
      out.kind = 'coincident';
      out.distance = 0;
    } else {
      out.relation = RELATION.parallel;
      out.kind = 'parallel';
      out.distance = d;
    }
    return out;
  }
  // Closest points: minimise |a1 + λu − a2 − μv|.
  const w0 = sub(a1, a2);
  const A = dot(u, u);
  const B = dot(u, v);
  const C = dot(v, v);
  const D = dot(u, w0);
  const E = dot(v, w0);
  const den = A * C - B * B;
  const lambda = (B * E - C * D) / den;
  const mu = (A * E - B * D) / den;
  out.lambda = lambda;
  out.mu = mu;
  out.closest1 = add(a1, scale(u, lambda));
  out.closest2 = add(a2, scale(v, mu));
  const d = Math.abs(dot(w, n)) / ln;
  if (d <= tol) {
    out.relation = RELATION.intersecting;
    out.kind = 'intersecting';
    out.distance = 0;
    out.point = out.closest1;
  } else {
    out.relation = RELATION.skew;
    out.kind = 'skew';
    out.distance = d;
  }
  return out;
}

/**
 * Line r = a + λu against the sphere |r − c| = R. Substituting gives Aλ² + Bλ + C = 0 with
 * A = |u|², B = 2u · (a − c), C = |a − c|² − R². The discriminant counts the meeting points
 * (|Δ| ≤ 1e-9 (B² + |4AC|) counts as zero: a tangent).
 */
export function lineSphere(a, u, c, R) {
  const out = { A: NaN, B: NaN, C: NaN, discriminant: NaN, hits: NaN, lambda1: NaN, lambda2: NaN, points: [], chord: NaN, centreDistance: NaN };
  const lu = length(u);
  if (!(lu > 0) || !finite3(a) || !finite3(c) || !(R > 0)) return out;
  const ac = sub(a, c);
  const A = dot(u, u);
  const B = 2 * dot(u, ac);
  const C = dot(ac, ac) - R * R;
  let disc = B * B - 4 * A * C;
  const tol = 1e-9 * (B * B + Math.abs(4 * A * C));
  Object.assign(out, { A, B, C, centreDistance: length(cross(ac, u)) / lu });
  if (Math.abs(disc) <= tol) disc = 0;
  out.discriminant = disc;
  if (disc > 0) {
    const sq = Math.sqrt(disc);
    // Stable roots: q = −(B + sign(B)√Δ)/2, λ = q/A and C/q.
    const q = -0.5 * (B + (B >= 0 ? sq : -sq));
    const r1 = q / A;
    const r2 = q !== 0 ? C / q : -r1;
    out.lambda1 = Math.min(r1, r2);
    out.lambda2 = Math.max(r1, r2);
    out.hits = 2;
  } else if (disc === 0) {
    out.lambda1 = out.lambda2 = -B / (2 * A);
    out.hits = 1;
  } else {
    out.hits = 0;
    return out;
  }
  out.points = (out.hits === 2 ? [out.lambda1, out.lambda2] : [out.lambda1]).map((t) => add(a, scale(u, t)));
  out.chord = lu * (out.lambda2 - out.lambda1);
  return out;
}

/**
 * Clip the line a + t·u to the box lo ≤ x, y, z ≤ hi (slab method).
 * @returns {[number, number] | null} the t range inside the box
 */
export function clipLine(a, u, lo, hi) {
  let t0 = -Infinity;
  let t1 = Infinity;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(u[k]) < 1e-15) {
      if (a[k] < lo || a[k] > hi) return null;
    } else {
      let ta = (lo - a[k]) / u[k];
      let tb = (hi - a[k]) / u[k];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
    }
  }
  return t0 <= t1 ? [t0, t1] : null;
}

export function linesScene({ mode = 'lines', point1, dir1, point2, dir2, centre, radius, lambda = 0 }) {
  const P = add(point1, scale(dir1, lambda));
  const base = { mode, a1: point1, u: dir1, a2: point2, v: dir2, c: centre, R: radius, lambda, P, zeroDir: !(length(dir1) > 0) || (mode === 'lines' && !(length(dir2) > 0)) };
  if (mode === 'sphere') return { ...base, sphere: lineSphere(point1, dir1, centre, radius), pCentreDistance: distance(P, centre) };
  return { ...base, lines: relateLines(point1, dir1, point2, dir2), pCentreDistance: NaN };
}

export function linesOutputs(s) {
  const nan = NaN;
  const L = s.lines;
  const S = s.sphere;
  const meet = L && L.relation === RELATION.intersecting;
  const P = length(s.u) > 0 ? s.P : [nan, nan, nan];
  return clean({
    relation: L ? L.relation : nan,
    lineAngle: L ? L.angle : nan,
    distance: L ? L.distance : nan,
    ix: meet ? L.point[0] : nan,
    iy: meet ? L.point[1] : nan,
    iz: meet ? L.point[2] : nan,
    lambdaI: meet ? L.lambda : nan,
    muI: meet ? L.mu : nan,
    px: P[0],
    py: P[1],
    pz: P[2],
    discriminant: S ? S.discriminant : nan,
    hits: S ? S.hits : nan,
    lambda1: S ? S.lambda1 : nan,
    lambda2: S ? S.lambda2 : nan,
    chord: S ? S.chord : nan,
    centreDistance: S ? S.centreDistance : nan,
    pCentreDistance: S ? s.pCentreDistance : nan,
  });
}

// ── 2D helpers (drawing sheets) ──────────────────────────────────────────────────────────────────

/** Signed area of a polygon [[x, y], …] (positive when anticlockwise). */
export function polygonArea(poly) {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return s / 2;
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToSegment2(x, y, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  const t = L2 > 0 ? clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L2, 0, 1) : 0;
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}

/** Inside the polygon and at least eps from its boundary (boundary points are not interior). */
function strictlyInside(x, y, poly, eps) {
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if (distToSegment2(x, y, poly[j], poly[i]) < eps) return false;
  return pointInPolygon(x, y, poly);
}

const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];

// ── orthographic projection ──────────────────────────────────────────────────────────────────────

/**
 * Parts for the orthographic trainer, in millimetres: a profile in the xz-plane (anticlockwise)
 * extruded through the depth y = 0 (front) to D (back), with optional vertical through-holes.
 */
export const PARTS = Object.freeze({
  stepBlock: { label: 'Step block', W: 60, D: 30, H: 40, profile: [[0, 0], [60, 0], [60, 20], [30, 20], [30, 40], [0, 40]], holes: [] },
  slottedBlock: { label: 'Slotted block', W: 60, D: 40, H: 30, profile: [[0, 0], [60, 0], [60, 30], [40, 30], [40, 20], [20, 20], [20, 30], [0, 30]], holes: [] },
  chamferBlock: { label: 'Chamfer block', W: 60, D: 30, H: 40, profile: [[0, 0], [60, 0], [60, 20], [30, 40], [0, 40]], holes: [] },
  holeBlock: { label: 'Block with a hole', W: 60, D: 40, H: 20, profile: [[0, 0], [60, 0], [60, 20], [0, 20]], holes: [{ cx: 30, cy: 20, r: 10, z0: 0, z1: 20 }] },
});

export function profileExtent(profile) {
  const xs = profile.map((p) => p[0]);
  const zs = profile.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}

/** Volume: profile area × depth, less the holes. */
export function partVolume(part) {
  return Math.abs(polygonArea(part.profile)) * part.D - part.holes.reduce((s, h) => s + Math.PI * h.r * h.r * (h.z1 - h.z0), 0);
}

/**
 * Area each principal view covers (its silhouette). Front: the profile. Top: the profile's x-extent
 * × depth, less the through-holes (seen end-on as gaps). Right: the z-extent × depth.
 */
export function viewAreas(part) {
  const e = profileExtent(part.profile);
  return {
    front: Math.abs(polygonArea(part.profile)),
    top: (e.x1 - e.x0) * part.D - part.holes.reduce((s, h) => s + Math.PI * h.r * h.r, 0),
    side: (e.z1 - e.z0) * part.D,
  };
}

/** True when q is in the interior of the part (points on its surface are not). */
export function insidePart(part, q, eps = 1e-7) {
  if (!(q[1] > eps && q[1] < part.D - eps)) return false;
  if (!strictlyInside(q[0], q[2], part.profile, eps)) return false;
  for (const h of part.holes) {
    if ((q[0] - h.cx) ** 2 + (q[1] - h.cy) ** 2 <= (h.r + eps) ** 2 && q[2] >= h.z0 - eps && q[2] <= h.z1 + eps) return false;
  }
  return true;
}

/**
 * Is point p (on the part's surface) hidden when seen from direction w (pointing towards the viewer)?
 * The ray p + t·w crosses the part's boundary only at the breakpoints collected here, so testing the
 * midpoint of every gap between breakpoints decides exactly whether it passes through material.
 * A ray that only grazes a face stays outside the interior, so edges seen edge-on count as visible.
 */
export function occluded(part, p, w) {
  const ts = [];
  if (w[1] !== 0) ts.push(-p[1] / w[1], (part.D - p[1]) / w[1]);
  const wxz = [w[0], w[2]];
  if (w[0] !== 0 || w[2] !== 0) {
    const pr = part.profile;
    for (let i = 0, j = pr.length - 1; i < pr.length; j = i++) {
      const e = [pr[i][0] - pr[j][0], pr[i][1] - pr[j][1]];
      const den = cross2(wxz, e);
      if (Math.abs(den) > 1e-15) ts.push(cross2([pr[j][0] - p[0], pr[j][1] - p[2]], e) / den);
    }
  }
  for (const h of part.holes) {
    if (w[2] !== 0) ts.push((h.z0 - p[2]) / w[2], (h.z1 - p[2]) / w[2]);
    const A = w[0] * w[0] + w[1] * w[1];
    if (A > 0) {
      const dx = p[0] - h.cx;
      const dy = p[1] - h.cy;
      const B = 2 * (dx * w[0] + dy * w[1]);
      const C = dx * dx + dy * dy - h.r * h.r;
      const disc = B * B - 4 * A * C;
      if (disc >= 0) ts.push((-B - Math.sqrt(disc)) / (2 * A), (-B + Math.sqrt(disc)) / (2 * A));
    }
  }
  const sorted = [0, ...ts.filter((t) => t > 1e-9).sort((a, b) => a - b)];
  sorted.push(sorted[sorted.length - 1] + 1);
  for (let i = 0; i + 1 < sorted.length; i++) {
    if (sorted[i + 1] - sorted[i] < 1e-12) continue;
    const t = (sorted[i] + sorted[i + 1]) / 2;
    if (insidePart(part, add(p, scale(w, t)))) return true;
  }
  return false;
}

/** Edges of the part as 3D segments (circles as 64-sided polygons). */
export function partEdges(part) {
  const { D, profile } = part;
  const edges = [];
  for (let i = 0; i < profile.length; i++) {
    const p = profile[i];
    const q = profile[(i + 1) % profile.length];
    edges.push({ a: [p[0], 0, p[1]], b: [q[0], 0, q[1]] });
    edges.push({ a: [p[0], D, p[1]], b: [q[0], D, q[1]] });
    edges.push({ a: [p[0], 0, p[1]], b: [p[0], D, p[1]] });
  }
  const N = 64;
  for (const h of part.holes) {
    for (const z of [h.z0, h.z1]) {
      for (let k = 0; k < N; k++) {
        const t0 = (2 * Math.PI * k) / N;
        const t1 = (2 * Math.PI * (k + 1)) / N;
        edges.push({ a: [h.cx + h.r * Math.cos(t0), h.cy + h.r * Math.sin(t0), z], b: [h.cx + h.r * Math.cos(t1), h.cy + h.r * Math.sin(t1), z] });
      }
    }
  }
  return edges;
}

/**
 * Principal views. `toward` points from the part to the viewer; `uv` maps a 3D point to the view's
 * own 2D axes (u right, v up). Front: (x, z). Top: (x, y), the back of the part at the top. Right
 * (seen from +x): (y, z), the back of the part on the right.
 */
export const VIEWS = Object.freeze({
  front: { toward: [0, -1, 0], uv: (p) => [p[0], p[2]] },
  top: { toward: [0, 0, 1], uv: (p) => [p[0], p[1]] },
  right: { toward: [1, 0, 0], uv: (p) => [p[1], p[2]] },
});

/** Contour (limb) lines of the holes for a view: where the view direction is tangent to the hole. */
function limbs(part, name) {
  const out = [];
  for (const h of part.holes) {
    if (name === 'front') for (const s of [-1, 1]) out.push({ a: [h.cx + s * h.r, h.cy, h.z0], b: [h.cx + s * h.r, h.cy, h.z1] });
    if (name === 'right') for (const s of [-1, 1]) out.push({ a: [h.cx, h.cy + s * h.r, h.z0], b: [h.cx, h.cy + s * h.r, h.z1] });
  }
  return out;
}

/** Parameters t in (0, 1) where segment ab meets the other segments (crossings, touching ends, overlaps). */
function splitParams(a, b, others) {
  const d = [b[0] - a[0], b[1] - a[1]];
  const L2 = d[0] * d[0] + d[1] * d[1];
  const L = Math.sqrt(L2);
  const ts = [];
  const tolT = 1e-9;
  for (const [p, q] of others) {
    for (const e of [p, q]) {
      const t = ((e[0] - a[0]) * d[0] + (e[1] - a[1]) * d[1]) / L2;
      if (t > tolT && t < 1 - tolT && Math.abs(cross2([e[0] - a[0], e[1] - a[1]], d)) / L < 1e-6) ts.push(t);
    }
    const e = [q[0] - p[0], q[1] - p[1]];
    const den = cross2(d, e);
    if (Math.abs(den) > 1e-12) {
      const ap = [p[0] - a[0], p[1] - a[1]];
      const t = cross2(ap, e) / den;
      const s = cross2(ap, d) / den;
      if (t > tolT && t < 1 - tolT && s >= -1e-9 && s <= 1 + 1e-9) ts.push(t);
    }
  }
  ts.sort((x, y) => x - y);
  const out = [0];
  for (const t of ts) if (t - out[out.length - 1] > 1e-9) out.push(t);
  if (1 - out[out.length - 1] > 1e-9) out.push(1);
  else out[out.length - 1] = 1;
  return out;
}

const viewCache = new Map();

/**
 * One principal view of a part: every edge projected, split where other edges cross it, and each
 * piece marked visible or hidden by a ray test. Centre lines for holes. Draw hidden lines first and
 * visible lines over them (visible lines take precedence where they coincide).
 * @returns {{ lines: { a: number[], b: number[], hidden: boolean }[], centres: { a: number[], b: number[] }[], box: number[] }}
 */
export function projectView(part, name) {
  const key = `${name}|${JSON.stringify(part)}`;
  if (viewCache.has(key)) return viewCache.get(key);
  const view = VIEWS[name];
  const edges = [...partEdges(part), ...limbs(part, name)]
    .map((e) => ({ ...e, a2: view.uv(e.a), b2: view.uv(e.b) }))
    .filter((e) => Math.hypot(e.b2[0] - e.a2[0], e.b2[1] - e.a2[1]) > 1e-9);
  const segs = edges.map((e) => [e.a2, e.b2]);
  const lines = [];
  for (const e of edges) {
    const ts = splitParams(e.a2, e.b2, segs);
    let run = null;
    for (let i = 0; i + 1 < ts.length; i++) {
      const hidden = occluded(part, lerp(e.a, e.b, (ts[i] + ts[i + 1]) / 2), view.toward);
      const p0 = [e.a2[0] + (e.b2[0] - e.a2[0]) * ts[i], e.a2[1] + (e.b2[1] - e.a2[1]) * ts[i]];
      const p1 = [e.a2[0] + (e.b2[0] - e.a2[0]) * ts[i + 1], e.a2[1] + (e.b2[1] - e.a2[1]) * ts[i + 1]];
      if (run && run.hidden === hidden) run.b = p1;
      else {
        if (run) lines.push(run);
        run = { a: p0, b: p1, hidden };
      }
    }
    if (run) lines.push(run);
  }
  const ext = 4; // centre lines run 4 mm past the feature
  const centres = [];
  for (const h of part.holes) {
    if (name === 'top') {
      centres.push({ a: [h.cx - h.r - ext, h.cy], b: [h.cx + h.r + ext, h.cy] }, { a: [h.cx, h.cy - h.r - ext], b: [h.cx, h.cy + h.r + ext] });
    } else if (name === 'front') centres.push({ a: [h.cx, h.z0 - ext], b: [h.cx, h.z1 + ext] });
    else centres.push({ a: [h.cy, h.z0 - ext], b: [h.cy, h.z1 + ext] });
  }
  const e = profileExtent(part.profile);
  const box = name === 'front' ? [e.x0, e.z0, e.x1, e.z1] : name === 'top' ? [e.x0, 0, e.x1, part.D] : [0, e.z0, part.D, e.z1];
  const result = { lines, centres, box };
  if (viewCache.size > 32) viewCache.clear();
  viewCache.set(key, result);
  return result;
}

/** Where the top and right views go relative to the front view: +1 above / right, −1 below / left. */
export function viewPlacement(projection) {
  return projection === 'first' ? { top: -1, side: -1 } : { top: 1, side: 1 };
}

export function orthographicScene({ part: key = 'stepBlock', projection: method = 'third' }) {
  const part = PARTS[key] ?? PARTS.stepBlock;
  const e = profileExtent(part.profile);
  return {
    key,
    part,
    method,
    placement: viewPlacement(method),
    width: e.x1 - e.x0,
    depth: part.D,
    height: e.z1 - e.z0,
    volume: partVolume(part),
    areas: viewAreas(part),
    views: { front: projectView(part, 'front'), top: projectView(part, 'top'), right: projectView(part, 'right') },
  };
}

export function orthographicOutputs(s) {
  return clean({
    width: s.width,
    depth: s.depth,
    height: s.height,
    partVolume: s.volume,
    frontArea: s.areas.front,
    topArea: s.areas.top,
    sideArea: s.areas.side,
    topViewPlacement: s.placement.top,
    sideViewPlacement: s.placement.side,
  });
}

// ── descriptive geometry ─────────────────────────────────────────────────────────────────────────

/**
 * Auxiliary view on a drawing sheet (2D, v up). The new fold line is parallel to the line base[0]→base[1]
 * of the parent view, `gap` beyond every point of `points` and `clear`. Each point travels along its
 * projector (perpendicular to the fold line) to the fold line, then on by its transfer distance: its
 * distance from the parent view's own fold line, measured in the previous view.
 */
export function auxiliaryView({ base, points, transfer, gap = 15, clear = [] }) {
  const [p, q] = base;
  let d = [q[0] - p[0], q[1] - p[1]];
  const L = Math.hypot(d[0], d[1]);
  d = L > 1e-9 ? [d[0] / L, d[1] / L] : [1, 0];
  let n = [-d[1], d[0]];
  if (n[1] < -1e-12 || (Math.abs(n[1]) <= 1e-12 && n[0] < 0)) n = [-n[0], -n[1]];
  const along = (X) => (X[0] - p[0]) * d[0] + (X[1] - p[1]) * d[1];
  const across = (X) => (X[0] - p[0]) * n[0] + (X[1] - p[1]) * n[1];
  const c = Math.max(...[...points, ...clear].map(across)) + gap;
  const out = points.map((X, i) => {
    const k = c - across(X) + transfer[i];
    return [X[0] + n[0] * k, X[1] + n[1] * k];
  });
  const s0 = Math.min(...points.map(along)) - gap;
  const s1 = Math.max(...points.map(along)) + gap;
  const at = (s) => [p[0] + d[0] * s + n[0] * c, p[1] + d[1] * s + n[1] * c];
  return { points: out, fold: [at(s0), at(s1)], normal: n, dir: d, offset: c };
}

const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Angle (degrees, 0–90) between sheet segment ab and a direction d. */
function angleToDir(a, b, d) {
  const v = [b[0] - a[0], b[1] - a[1]];
  return Math.atan2(Math.abs(cross2(d, v)), Math.abs(v[0] * d[0] + v[1] * d[1])) / DEG;
}

/**
 * Third-angle sheet for an oblique line AB: front view below the fold line H/F (v = 0), top view
 * above it, and an auxiliary view projected from the top view across a fold line H/1 parallel to
 * the top view of AB. Heights transfer from the front view, so the auxiliary view shows AB in true
 * length and its true angle to the horizontal plane.
 */
export function descriptiveLine({ pointA: A, pointB: B, gap = 15 }) {
  const yRef = Math.min(A[1], B[1]) - gap; // frontal reference plane, in front of the line
  const zRef = Math.max(A[2], B[2]) + gap; // horizontal reference plane, above it
  const plan = (P) => [P[0], P[1] - yRef];
  const front = (P) => [P[0], P[2] - zRef];
  const At = plan(A);
  const Bt = plan(B);
  const Af = front(A);
  const Bf = front(B);
  const aux = auxiliaryView({ base: [At, Bt], points: [At, Bt], transfer: [zRef - A[2], zRef - B[2]], gap, clear: [Af, Bf] });
  const [A1, B1] = aux.points;
  const tl = distance(A, B);
  return {
    feature: 'line',
    A,
    B,
    front: { A: Af, B: Bf },
    top: { A: At, B: Bt },
    aux: { A: A1, B: B1, fold: aux.fold, normal: aux.normal, dir: aux.dir },
    foldHF: gap,
    trueLength3D: tl,
    trueLength: dist2(A1, B1),
    planLength: dist2(At, Bt),
    frontLength: dist2(Af, Bf),
    angleHP: angleToDir(A1, B1, aux.dir),
    angleVP: tl > 0 ? Math.asin(clamp(Math.abs(B[1] - A[1]) / tl, 0, 1)) / DEG : NaN,
    transfer: [zRef - A[2], zRef - B[2]],
  };
}

/**
 * True shape of the sloping face of a chamfered block (W × D × H, chamfer `run` along x and `drop`
 * down z off the top right edge). The face is perpendicular to the frontal plane, so the front view
 * shows it edge-on; an auxiliary view projected from the front view, across a fold line F/1 parallel
 * to that edge, shows its true shape. Depths transfer from the top view.
 */
export function descriptiveFace({ chamferRun: run, chamferDrop: drop, gap = 15 }) {
  const { W, D, H } = PARTS.chamferBlock;
  const r = Math.min(run, W);
  const dz = Math.min(drop, H);
  const profile = [[0, 0], [W, 0], [W, H - dz], [W - r, H], [0, H]];
  const yRef = -gap;
  const zRef = H + gap;
  const plan = (P) => [P[0], P[1] - yRef];
  const front = (P) => [P[0], P[2] - zRef];
  const face = [[W - r, 0, H], [W, 0, H - dz], [W, D, H - dz], [W - r, D, H]];
  const frontProfile = profile.map(([x, z]) => front([x, 0, z]));
  const planOutline = [[0, 0, H], [W, 0, H], [W, D, H], [0, D, H]].map(plan);
  const facePlan = face.map(plan);
  const faceFront = face.map(front);
  const aux = auxiliaryView({ base: [faceFront[0], faceFront[1]], points: faceFront, transfer: face.map((P) => P[1] - yRef), gap, clear: [...frontProfile, ...planOutline] });
  const trueShape = aux.points;
  return {
    feature: 'face',
    part: { W, D, H, profile, holes: [] },
    face,
    front: { profile: frontProfile, face: faceFront },
    top: { outline: planOutline, face: facePlan, ridge: [plan([W - r, 0, H]), plan([W - r, D, H])] },
    aux: { face: trueShape, fold: aux.fold, normal: aux.normal, dir: aux.dir },
    foldHF: gap,
    trueLength: dist2(trueShape[0], trueShape[1]),
    planLength: dist2(facePlan[0], facePlan[1]),
    frontLength: dist2(faceFront[0], faceFront[1]),
    angleHP: Math.atan2(dz, r) / DEG,
    angleVP: NaN,
    trueArea: Math.abs(polygonArea(trueShape)),
    planArea: Math.abs(polygonArea(facePlan)),
  };
}

export function descriptiveScene(p) {
  return p.feature === 'face' ? descriptiveFace(p) : descriptiveLine(p);
}

export function descriptiveOutputs(s) {
  return clean({
    trueLength: s.trueLength,
    planLength: s.planLength,
    frontLength: s.frontLength,
    angleHP: s.angleHP,
    angleVP: s.angleVP,
    trueArea: s.feature === 'face' ? s.trueArea : NaN,
    planArea: s.feature === 'face' ? s.planArea : NaN,
  });
}
