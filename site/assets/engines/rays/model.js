// rays engine model: a pure 2D ray tracer for the ray box (guide §9.1).
// Snell's law (n₁ sin θ₁ = n₂ sin θ₂), the critical angle, total internal reflection (TIR), Fresnel
// partial reflection, and an optical fibre (core and cladding). No DOM, no timers, no randomness.
//
// Geometry is in "scene units" (a schematic, not to scale). A scene is a list of boundaries: straight
// segments and circular arcs, each knowing the refractive index on both of its sides, so the tracer never
// has to remember which medium the ray is in. Angles are in degrees at the API, measured from the normal.

export const SCENES = ['boundary', 'rect', 'semi', 'fibre'];
export const MAX_INTERACTIONS = 50; // surface interactions per ray (guide §9.1)
export const MAX_ANGLE = 89; // degrees; at 90° the ray would graze the surface and never meet it

const DEG = Math.PI / 180;
const T_MIN = 1e-7; // ignore hits closer than this (the surface the ray has just left)
const FAR = 200; // a ray that meets nothing is drawn this far (scene units), well past any view
const BIG = 1000; // half-size of "infinite" media for drawing
const PARTIAL_MIN_ANGLE = 1; // degrees: below this a partial reflection would retrace the incoming ray
const SAME_INDEX = 1e-12; // indices closer than this are the same medium
const R_ZERO = 1e-12; // reflectances below this are rounding, reported as 0
/** Partial reflections weaker than this (0.5%) are not traced or drawn: too faint to see. */
export const PARTIAL_MIN_R = 0.005;

// ---- Optics formulas ------------------------------------------------------------------------------

/** Angle of refraction (degrees) going from n1 into n2 at `thetaDeg` from the normal, or null under TIR. */
export function snellAngle(n1, n2, thetaDeg) {
  const s = (n1 / n2) * Math.sin(thetaDeg * DEG);
  if (s > 1) return null;
  return Math.asin(s) / DEG;
}

/** Critical angle (degrees) for light going from n1 into n2, or null when n1 ≤ n2 (no TIR possible). */
export function criticalAngle(n1, n2) {
  return n1 > n2 ? Math.asin(n2 / n1) / DEG : null;
}

/**
 * Fraction of the light reflected at a boundary (Fresnel equations, unpolarised light: the mean of the
 * s and p reflectances). 1 under total internal reflection.
 */
export function fresnelReflectance(n1, n2, thetaDeg) {
  const ci = Math.cos(thetaDeg * DEG);
  const s = (n1 / n2) * Math.sin(thetaDeg * DEG);
  if (s > 1) return 1;
  return fresnelFromCosines(n1, n2, ci, Math.sqrt(1 - s * s));
}

function fresnelFromCosines(n1, n2, ci, ct) {
  // Equal indices: no boundary at all, so nothing reflects (rounding would otherwise leave R ≈ 1e-32).
  if (Math.abs(n1 - n2) < SAME_INDEX) return 0;
  const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
  const rp = (n1 * ct - n2 * ci) / (n1 * ct + n2 * ci);
  const r = (rs * rs + rp * rp) / 2;
  return r < R_ZERO ? 0 : r;
}

/** Numerical aperture NA = √(n_core² − n_clad²), or null when the core is not denser than the cladding. */
export function numericalAperture(nCore, nClad) {
  return nCore > nClad ? Math.sqrt(nCore * nCore - nClad * nClad) : null;
}

/** Acceptance half-angle (degrees) in a medium of index n0: sin θa = NA / n0 (90° when NA ≥ n0). */
export function acceptanceAngle(nCore, nClad, n0 = 1) {
  const na = numericalAperture(nCore, nClad);
  if (na === null) return null;
  return na >= n0 ? 90 : Math.asin(na / n0) / DEG;
}

// ---- Boundaries ---------------------------------------------------------------------------------

/**
 * A straight boundary from a to b. nLeft is the index on the left of a→b (where its normal points),
 * nRight on the right. kind 'absorber' stops the ray (the fibre's coating).
 */
export function seg(a, b, nLeft, nRight, tag, kind = 'interface') {
  return { type: 'seg', a, b, nPos: nLeft, nNeg: nRight, tag, kind };
}

/** A circular arc, centre c, radius r, anticlockwise from angle a0 to a1 (radians). */
export function arc(c, r, a0, a1, nOutside, nInside, tag, kind = 'interface') {
  return { type: 'arc', c, r, a0, a1, nPos: nOutside, nNeg: nInside, tag, kind };
}

function hitSeg(b, p, d) {
  const ex = b.b[0] - b.a[0];
  const ey = b.b[1] - b.a[1];
  const denom = d[0] * ey - d[1] * ex;
  if (Math.abs(denom) < 1e-14) return null; // parallel
  const wx = b.a[0] - p[0];
  const wy = b.a[1] - p[1];
  const t = (wx * ey - wy * ex) / denom;
  const s = (wx * d[1] - wy * d[0]) / denom;
  if (t <= T_MIN || s < -1e-12 || s > 1 + 1e-12) return null;
  const len = Math.hypot(ex, ey);
  return { t, normal: [-ey / len, ex / len] };
}

function hitArc(b, p, d) {
  const fx = p[0] - b.c[0];
  const fy = p[1] - b.c[1];
  const half = fx * d[0] + fy * d[1];
  const disc = half * half - (fx * fx + fy * fy - b.r * b.r);
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  for (const t of [-half - root, -half + root]) {
    if (t <= T_MIN) continue;
    const qx = fx + t * d[0];
    const qy = fy + t * d[1];
    const ang = Math.atan2(qy, qx);
    const rel = (((ang - b.a0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (rel <= b.a1 - b.a0 + 1e-12) return { t, normal: [qx / b.r, qy / b.r] };
  }
  return null;
}

function nearestHit(boundaries, p, d) {
  let best = null;
  for (const b of boundaries) {
    const h = b.type === 'seg' ? hitSeg(b, p, d) : hitArc(b, p, d);
    if (h && (!best || h.t < best.t)) best = { ...h, b };
  }
  return best;
}

// ---- Tracer -------------------------------------------------------------------------------------

/**
 * Trace one ray (no branching) for up to `maxInteractions` surface interactions.
 * @returns {{ points: number[][], events: object[], status: 'free'|'absorbed'|'limit' }}
 *   points: the start, each hit, and (status 'free') a far point on the final ray.
 *   events: { type: 'refract'|'tir'|'absorbed', tag, point, normal (towards the incoming side), n1, n2,
 *   incidence, refraction (null unless refracted), reflectance, dIn, dOut, dRef } with angles in degrees.
 */
export function trace(boundaries, start, dir, { maxInteractions = MAX_INTERACTIONS } = {}) {
  let p = [start[0], start[1]];
  let d = unit(dir);
  const points = [p];
  const events = [];
  while (events.length < maxInteractions) {
    const hit = nearestHit(boundaries, p, d);
    if (!hit) {
      points.push([p[0] + FAR * d[0], p[1] + FAR * d[1]]);
      return { points, events, status: 'free' };
    }
    const b = hit.b;
    const point = [p[0] + hit.t * d[0], p[1] + hit.t * d[1]];
    points.push(point);
    let N = hit.normal;
    let cosI = -(d[0] * N[0] + d[1] * N[1]);
    let n1 = b.nPos;
    let n2 = b.nNeg;
    if (cosI < 0) {
      // Coming from the negative side: flip the normal so it points back towards the incoming ray.
      N = [-N[0], -N[1]];
      cosI = -cosI;
      n1 = b.nNeg;
      n2 = b.nPos;
    }
    const sinI = Math.abs(d[0] * N[1] - d[1] * N[0]);
    const incidence = Math.atan2(sinI, cosI) / DEG;
    const dRef = unit([d[0] + 2 * cosI * N[0], d[1] + 2 * cosI * N[1]]);
    const base = { tag: b.tag, point, normal: N, n1, n2, incidence, dIn: d };
    if (b.kind === 'absorber') {
      events.push({ ...base, type: 'absorbed', refraction: null, reflectance: 0, dOut: null, dRef: null });
      return { points, events, status: 'absorbed' };
    }
    const eta = n1 / n2;
    const sinT = eta * sinI;
    if (sinT > 1) {
      events.push({ ...base, type: 'tir', refraction: null, reflectance: 1, dOut: dRef, dRef });
      d = dRef;
    } else {
      const cosT = Math.sqrt(1 - sinT * sinT);
      const dOut = unit([eta * d[0] + (eta * cosI - cosT) * N[0], eta * d[1] + (eta * cosI - cosT) * N[1]]);
      const refraction = Math.atan2(sinT, cosT) / DEG;
      events.push({ ...base, type: 'refract', refraction, reflectance: fresnelFromCosines(n1, n2, cosI, cosT), dOut, dRef });
      d = dOut;
    }
    p = point;
  }
  return { points, events, status: 'limit' };
}

function unit(v) {
  const len = Math.hypot(v[0], v[1]);
  return [v[0] / len, v[1] / len];
}

// ---- Scenes -------------------------------------------------------------------------------------

// Scene sizes in scene units. Chosen so each scene fills a 16:9 stage with room for the ray box.
const BOUNDARY = { sourceDistance: 5.5, view: { x: [-12, 12], y: [-8, 8] } };
const RECT = { halfWidth: 7, thickness: 5, entryX: -2.5, sourceDistance: 4.8, view: { x: [-12.5, 12.5], y: [-8.2, 7.4] } };
const SEMI = { radius: 5.5, sourceDistance: 8.2, view: { x: [-12, 12], y: [-10.6, 7.4] } };
const FIBRE = { coreHalf: 1.5, cladding: 1.1, length: 26, sourceDistance: 4.6, view: { x: [-7, 29.5], y: [-6.8, 6.8] } };

/**
 * Build a scene from params. Plain data only (no functions), so solutions compare with deepEqual.
 * pivot: where the ray box aims (the surface of interest); normal: unit normal there, pointing towards
 * the ray box's side; tangent: the direction the ray box moves as the angle grows.
 */
export function buildScene(params) {
  const kind = SCENES.includes(params.scene) ? params.scene : 'rect';
  const { n1 = 1, n2 = 1.5, nBlock = 1.5, nOuter = 1, nCore = 1.5, nClad = 1.4 } = params;
  const sample = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(a0 + ((a1 - a0) * i) / n), cy + r * Math.sin(a0 + ((a1 - a0) * i) / n)]);

  if (kind === 'boundary') {
    return {
      kind,
      boundaries: [seg([-BIG, 0], [BIG, 0], n1, n2, 'interface')],
      regions: [
        { id: 'upper', n: n1, poly: [[-BIG, 0], [BIG, 0], [BIG, BIG], [-BIG, BIG]] },
        { id: 'lower', n: n2, poly: [[-BIG, -BIG], [BIG, -BIG], [BIG, 0], [-BIG, 0]] },
      ],
      pivot: [0, 0],
      normal: [0, 1],
      tangent: [-1, 0],
      sourceDistance: BOUNDARY.sourceDistance,
      view: BOUNDARY.view,
      keyTag: 'interface',
      keyMedia: [n1, n2],
      critical: criticalAngle(n1, n2),
      protractorRadius: 3.6,
    };
  }

  if (kind === 'rect') {
    const { halfWidth: A, thickness: T, entryX } = RECT;
    const corners = [[-A, -T], [A, -T], [A, 0], [-A, 0]]; // anticlockwise: each edge's left is inside
    const tags = ['bottom', 'right', 'top', 'left'];
    return {
      kind,
      boundaries: corners.map((c, i) => seg(c, corners[(i + 1) % 4], nBlock, nOuter, tags[i])),
      regions: [{ id: 'outer', n: nOuter, poly: null }, { id: 'block', n: nBlock, poly: corners }],
      pivot: [entryX, 0],
      normal: [0, 1],
      tangent: [-1, 0],
      sourceDistance: RECT.sourceDistance,
      view: RECT.view,
      keyTag: 'top',
      keyMedia: [nOuter, nBlock],
      critical: criticalAngle(nBlock, nOuter),
      protractorRadius: 3.4,
      halfWidth: A,
      thickness: T,
    };
  }

  if (kind === 'semi') {
    const R = SEMI.radius;
    return {
      kind,
      boundaries: [seg([R, 0], [-R, 0], nBlock, nOuter, 'flat'), arc([0, 0], R, Math.PI, 2 * Math.PI, nOuter, nBlock, 'curved')],
      regions: [{ id: 'outer', n: nOuter, poly: null }, { id: 'block', n: nBlock, poly: sample(0, 0, R, Math.PI, 2 * Math.PI, 120) }],
      pivot: [0, 0],
      normal: [0, -1],
      tangent: [-1, 0],
      sourceDistance: SEMI.sourceDistance,
      view: SEMI.view,
      keyTag: 'flat',
      keyMedia: [nBlock, nOuter],
      critical: criticalAngle(nBlock, nOuter),
      protractorRadius: R + 0.9,
      radius: R,
    };
  }

  // Fibre: a straight core between two cladding layers, ends cut square. Light that crosses the cladding
  // reaches the coating, which absorbs it.
  const { coreHalf: c, cladding: k, length: L } = FIBRE;
  const e = c + k;
  return {
    kind,
    boundaries: [
      seg([0, c], [0, -c], nCore, nOuter, 'entry'),
      seg([L, -c], [L, c], nCore, nOuter, 'exit'),
      seg([0, -c], [L, -c], nCore, nClad, 'wall'),
      seg([L, c], [0, c], nCore, nClad, 'wall'),
      seg([0, e], [0, c], nClad, nOuter, 'entry-cladding'),
      seg([0, -c], [0, -e], nClad, nOuter, 'entry-cladding'),
      seg([L, c], [L, e], nClad, nOuter, 'exit-cladding'),
      seg([L, -e], [L, -c], nClad, nOuter, 'exit-cladding'),
      seg([L, e], [0, e], nClad, nOuter, 'coating', 'absorber'),
      seg([0, -e], [L, -e], nClad, nOuter, 'coating', 'absorber'),
    ],
    regions: [
      { id: 'outer', n: nOuter, poly: null },
      { id: 'cladding', n: nClad, poly: [[0, c], [L, c], [L, e], [0, e]] },
      { id: 'cladding', n: nClad, poly: [[0, -e], [L, -e], [L, -c], [0, -c]] },
      { id: 'core', n: nCore, poly: [[0, -c], [L, -c], [L, c], [0, c]] },
    ],
    pivot: [0, 0],
    normal: [-1, 0],
    tangent: [0, 1],
    sourceDistance: FIBRE.sourceDistance,
    view: FIBRE.view,
    keyTag: 'entry',
    keyMedia: [nOuter, nCore],
    critical: criticalAngle(nCore, nClad),
    protractorRadius: 3,
    coreHalf: c,
    cladding: k,
    length: L,
  };
}

/** Unit vector along the ray from the ray box towards the pivot, for a given angle (degrees). */
export function sourceDirection(scene, angle) {
  const s = Math.sin(angle * DEG);
  const c = Math.cos(angle * DEG);
  return [-(s * scene.tangent[0] + c * scene.normal[0]), -(s * scene.tangent[1] + c * scene.normal[1])];
}

/** Where the ray box sits for a given angle: on the normal's side, `sourceDistance` from the pivot. */
export function sourcePosition(scene, angle) {
  const d = sourceDirection(scene, angle);
  return [scene.pivot[0] - scene.sourceDistance * d[0], scene.pivot[1] - scene.sourceDistance * d[1]];
}

/** The angle (degrees, 0 to MAX_ANGLE) that puts the ray box nearest the point (x, y): used for dragging. */
export function angleFromPoint(scene, x, y) {
  const vx = x - scene.pivot[0];
  const vy = y - scene.pivot[1];
  const along = vx * scene.normal[0] + vy * scene.normal[1];
  const across = vx * scene.tangent[0] + vy * scene.tangent[1];
  const angle = Math.atan2(across, along) / DEG;
  return Math.min(MAX_ANGLE, Math.max(0, angle));
}

// ---- Solution and outputs -------------------------------------------------------------------------

/**
 * Trace the ray box's ray through the scene, with faint partial reflections (one branch per refraction
 * of the main ray that reflects at least PARTIAL_MIN_R, each traced without further branching).
 */
export function solve(params) {
  const scene = buildScene(params);
  const angle = Math.min(MAX_ANGLE, Math.max(0, Number(params.angle) || 0));
  const main = trace(scene.boundaries, sourcePosition(scene, angle), sourceDirection(scene, angle));
  const partials = [];
  if (params.showPartial !== false) {
    main.events.forEach((e, i) => {
      if (e.type !== 'refract' || e.incidence < PARTIAL_MIN_ANGLE || !(e.reflectance >= PARTIAL_MIN_R)) return;
      partials.push({ ...trace(scene.boundaries, e.point, e.dRef), intensity: e.reflectance, from: i });
    });
  }
  const key = main.events.find((e) => e.tag === scene.keyTag) ?? null;
  const wall = scene.kind === 'fibre' ? (main.events.find((e) => e.tag === 'wall') ?? null) : null;
  return { scene, angle, main, partials, key, wall, outputs: outputsOf(scene, main, key, wall, params) };
}

function outputsOf(scene, main, key, wall, params) {
  const fibre = scene.kind === 'fibre';
  const entered = fibre && key?.type === 'refract';
  const escaped = main.events.some((e) => e.tag === 'wall' && e.type === 'refract');
  return {
    incidence: key ? key.incidence : null,
    refraction: key && key.type === 'refract' ? key.refraction : null,
    reflectance: key ? 100 * key.reflectance : null,
    critical: scene.critical,
    tirCount: main.events.filter((e) => e.type === 'tir').length,
    interactions: main.events.length,
    wallAngle: wall ? wall.incidence : null,
    acceptance: fibre ? acceptanceAngle(params.nCore, params.nClad, params.nOuter) : null,
    na: fibre ? numericalAperture(params.nCore, params.nClad) : null,
    guided: fibre ? (entered && !escaped ? 1 : 0) : null,
  };
}

/**
 * Data table for CSV: the surface of interest swept from 0° to 89° in 1° steps, plus the current angle.
 * Fibre: launch angle, angle in the core, angle at the cladding, critical angle, guided.
 */
export function sweep(params) {
  const scene = buildScene(params);
  const current = Math.min(MAX_ANGLE, Math.max(0, Number(params.angle) || 0));
  const angles = Array.from({ length: MAX_ANGLE + 1 }, (_, i) => i);
  if (!Number.isInteger(current)) angles.push(current);
  angles.sort((a, b) => a - b);
  const [nA, nB] = scene.keyMedia;

  if (scene.kind === 'fibre') {
    const crit = scene.critical;
    return {
      columns: ['Launch angle (°)', 'Angle in core (°)', 'Angle at cladding (°)', 'Critical angle (°)', 'Guided'],
      rows: angles.map((a) => {
        const inCore = snellAngle(nA, nB, a);
        const atWall = inCore === null ? null : 90 - inCore;
        const guided = inCore !== null && (inCore === 0 || (crit !== null && atWall > crit));
        return [a, inCore, atWall, crit, guided ? 'yes' : 'no'];
      }),
    };
  }
  return {
    columns: ['θᵢ (°)', 'θᵣ (°)', 'sin θᵢ', 'sin θᵣ', 'Reflected (%)', 'TIR'],
    rows: angles.map((a) => {
      const r = snellAngle(nA, nB, a);
      return [a, r, Math.sin(a * DEG), r === null ? null : Math.sin(r * DEG), 100 * fresnelReflectance(nA, nB, a), r === null ? 'yes' : 'no'];
    }),
  };
}
