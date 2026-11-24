// particle2d model: point-mass mechanics for every particle2d setup (guide §9.1).
// Pure: no DOM, no timers, no randomness. Importable in Node; tests/engines/particle2d.test.mjs checks it
// against analytic answers.
//
// Integration: classical RK4 with a fixed step. One step is DT (1/240 s) of animation time multiplied by
// the setup's time unit (1 for everyday motion; minutes for orbits, nanoseconds for charged particles), so
// the physical step is fixed for a whole run.
//
// Events (apex, landing, stopping, exits, crashes, collisions, the end of a run) are found inside a step:
// the state is interpolated with cubic Hermite polynomials (positions with velocities, velocities with
// accelerations), the event time is found by bisection, and the event state is then computed with an RK4
// sub-step of exactly that length. Readouts and completion use that event state, never the step after it.
//
// advance() mutates the state it is given (history arrays would otherwise be copied every step) and
// returns it. Given the same params, every run is identical.

export const DT = 1 / 240; // s of animation time per fixed step

const DEG = Math.PI / 180;
const TAU = 2 * Math.PI;
const REC = 4; // a data row every 4 steps (60 rows per second of animation), plus every event

/** cos and sin of an angle in degrees, exact at multiples of 90° (so a 90° launch has vx = 0, not 1e-15). */
export function cosDeg(d) {
  return Math.abs(d % 180) === 90 ? 0 : Math.abs(d % 360) === 180 ? -1 : Math.cos(d * DEG);
}
export function sinDeg(d) {
  return d % 180 === 0 ? 0 : Math.sin(d * DEG);
}
/** Zero when a conserved difference is only rounding noise (|v| ≤ 1e-12 of its scale). */
const snap = (v, scale) => (Math.abs(v) <= 1e-12 * Math.max(Math.abs(scale), 1e-300) ? 0 : v);

// ---------------------------------------------------------------------------------------------------
// Physical data (sources in comments; nothing here is invented)
// ---------------------------------------------------------------------------------------------------

/** Speed of light in vacuum, m/s (exact, SI definition of the metre). */
export const C_LIGHT = 299792458;
/** Elementary charge, C (exact, SI 2019). */
export const E_CHARGE = 1.602176634e-19;
/** Particle masses: CODATA 2018 recommended values (NIST). Charges in multiples of e. */
export const PARTICLES = {
  electron: { label: 'Electron', symbol: 'e⁻', mass: 9.1093837015e-31, charge: -E_CHARGE },
  proton: { label: 'Proton', symbol: 'p⁺', mass: 1.67262192369e-27, charge: E_CHARGE },
  alpha: { label: 'Alpha particle', symbol: 'α', mass: 6.6446573357e-27, charge: 2 * E_CHARGE },
};
/**
 * Earth. GM: IERS Conventions (2010) and WGS 84, 3.986004418 × 10¹⁴ m³/s².
 * Mean radius: IUGG mean radius R₁ = 6371.0 km. Sidereal day: 86 164.0905 s (IERS).
 */
export const EARTH = { GM: 3.986004418e14, radius: 6.371e6, siderealDay: 86164.0905 };
/** GPS satellites orbit in half a sidereal day (GPS SPS Performance Standard, 5th ed., 2020). */
export const GPS_PERIOD_FRACTION = 0.5;

/** Puck radius in the collisions setup (m). Both pucks are the same size. */
export const PUCK_RADIUS = 0.25;
/** Horizontal length of the roller track's shaped section (m). */
export const TRACK_LENGTH = 20;

// ---------------------------------------------------------------------------------------------------
// Numerical core
// ---------------------------------------------------------------------------------------------------

/** One classical Runge–Kutta step. f(t, y) returns dy/dt as a new array. Returns a new array. */
export function rk4(f, t, y, h) {
  const n = y.length;
  const tmp = new Array(n);
  const k1 = f(t, y);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + 0.5 * h * k1[i];
  const k2 = f(t + 0.5 * h, tmp);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + 0.5 * h * k2[i];
  const k3 = f(t + 0.5 * h, tmp);
  for (let i = 0; i < n; i++) tmp[i] = y[i] + h * k3[i];
  const k4 = f(t + h, tmp);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}

/** Cubic Hermite interpolation on a step of length h at fraction s ∈ [0, 1] (values y, derivatives d). */
export function hermite(y0, d0, y1, d1, h, s) {
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * y0 + (s3 - 2 * s2 + s) * h * d0 + (-2 * s3 + 3 * s2) * y1 + (s3 - s2) * h * d1;
}

function hermiteState(y0, f0, y1, f1, h, s) {
  const out = new Array(y0.length);
  for (let i = 0; i < y0.length; i++) out[i] = hermite(y0[i], f0[i], y1[i], f1[i], h, s);
  return out;
}

/**
 * Earliest s in (0, 1] where g changes from > 0 to ≤ 0, given g(0) ≥ 0 and g(1) ≤ 0.
 * A coarse scan finds the first sub-interval with the change; bisection then pins it to ~1e-16.
 */
export function crossing(g, samples = 8) {
  let lo = 0;
  let hi = 1;
  for (let k = 1; k <= samples; k++) {
    const s = k / samples;
    if (g(s) <= 0) {
      hi = s;
      break;
    }
    lo = s;
  }
  for (let i = 0; i < 64 && hi - lo > 1e-16; i++) {
    const mid = 0.5 * (lo + hi);
    if (g(mid) > 0) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
 * Polish an event fraction found on the Hermite interpolant: secant iterations on g evaluated at RK4
 * sub-steps from the start of the step, so the event time is as accurate as the integration itself.
 * Falls back to the Hermite estimate if an iteration leaves [0, 1] or stops improving.
 */
function refine(f, t0, y0, H, ev, st, s0) {
  const G = (s) => ev.g(rk4(f, t0, y0, s * H), t0 + s * H, st);
  let a = s0;
  let ga = G(a);
  if (ga === 0) return a;
  let b = a > 1e-3 ? a - 1e-3 : a + 1e-3;
  let gb = G(b);
  for (let i = 0; i < 6; i++) {
    if (gb === ga) break;
    const c = a - (ga * (a - b)) / (ga - gb);
    if (!(c >= 0 && c <= 1)) return s0;
    b = a;
    gb = ga;
    a = c;
    ga = G(a);
    if (Math.abs(a - b) < 1e-15 || ga === 0) break;
  }
  return Math.abs(a - s0) < 1e-3 && Math.abs(ga) <= Math.abs(G(s0)) ? a : s0;
}

/** Largest λ·h allowed in one RK4 sub-step, where λ is the fastest decay rate in the motion (1/s). */
const STIFF = 0.05;

/**
 * One fixed outer step (to (n + 1)·h), so timing never depends on the frame rate. Strong drag makes the
 * equations stiff (RK4 is unstable once λh > 2.8, and inaccurate well before), so a setup with a
 * stiffness(st) rate is integrated in adaptive sub-steps with λ·h ≤ STIFF inside the outer step.
 */
function integrate(st, def) {
  const tEnd = (st.n + 1) * st.cfg.h;
  if (!def.stiffness) {
    integrateTo(st, def, tEnd, 0);
    return;
  }
  for (let i = 0; i < 100000 && !st.done && st.t < tEnd; i++) {
    const lam = def.stiffness(st);
    const next = lam > 0 && st.t + STIFF / lam < tEnd ? st.t + STIFF / lam : tEnd;
    integrateTo(st, def, next, 0);
  }
}

/**
 * Integrate to tEnd with one RK4 step and events. Each event is either a time event { at(st) } or a state
 * event { g(y, t, st) } that fires when g goes from > 0 to ≤ 0. on(st, y, t) returns 'mark' (record and
 * carry on), 'restart' (continue from the event state, e.g. after a change of phase) or 'stop' (the run is
 * over).
 */
function integrateTo(st, def, tEnd, depth) {
  const t0 = st.t;
  const y0 = st.y;
  const H = tEnd - t0;
  if (!(H > 0)) return;
  const f = def.deriv(st);
  const y1 = rk4(f, t0, y0, H);
  const hits = [];
  if (depth < 16) {
    let f0 = null;
    let f1 = null;
    for (const ev of def.events ?? []) {
      if (ev.when && !ev.when(st)) continue;
      if (ev.at) {
        const ta = ev.at(st);
        if (ta === null || !(ta > t0 && ta <= tEnd)) continue;
        hits.push({ s: (ta - t0) / H, te: ta, ev });
      } else {
        const g0 = ev.g(y0, t0, st);
        const g1 = ev.g(y1, tEnd, st);
        if (!(g1 <= 0) || !(g0 > 0 || (g0 === 0 && ev.fromZero))) continue;
        f0 ??= f(t0, y0);
        f1 ??= f(tEnd, y1);
        const s = refine(f, t0, y0, H, ev, st, crossing((u) => ev.g(hermiteState(y0, f0, y1, f1, H, u), t0 + u * H, st)));
        hits.push({ s, te: t0 + s * H, ev });
      }
    }
    hits.sort((a, b) => a.s - b.s);
  }
  for (const { te, ev } of hits) {
    const ys = rk4(f, t0, y0, te - t0);
    const action = ev.on(st, ys, te);
    if (action === 'mark') continue;
    st.y = ys;
    st.t = te;
    if (action === 'stop') {
      st.done = true;
      return;
    }
    integrateTo(st, def, tEnd, depth + 1);
    return;
  }
  st.y = y1;
  st.t = tEnd;
}

/** Record a data row (setup columns) unless one already exists at this time. */
function pushRow(st, y, t, force = false) {
  const last = st.hist[st.hist.length - 1];
  if (!force && last && last[0] === t) return;
  st.hist.push(DEFS[st.setup].row(y, t, st));
}

/**
 * Fastest decay rate λ (1/s) of drag a = −(k/m)v or −(k/m)|v|v: k/m, or 2(k/m)|v| for quadratic drag
 * (the Jacobian's largest eigenvalue). With gravity the speed can grow towards terminal speed √(g/(k/m)),
 * so the quadratic rate is never taken below its terminal value 2√(g·k/m).
 */
function dragRate(law, kOverM, speed, g = 0) {
  if (!(kOverM > 0) || law === 'none') return 0;
  if (law === 'linear') return kOverM;
  return 2 * Math.max(kOverM * speed, Math.sqrt(g * kOverM));
}

const endAt = (key) => ({
  at: (st) => st.cfg[key],
  on: (st) => {
    st.ev.end = 'time';
    return 'stop';
  },
});

// ---------------------------------------------------------------------------------------------------
// Analytic helpers (also used by the view and the tests)
// ---------------------------------------------------------------------------------------------------

/** No-drag projectile from height h: range, maximum height, flight time, time to apex. */
export function projectileNoDrag({ speed, angle, height = 0, g }) {
  const vx = speed * cosDeg(angle);
  const vy = speed * sinDeg(angle);
  const flightTime = (vy + Math.sqrt(vy * vy + 2 * g * height)) / g;
  const timeToApex = Math.max(0, vy / g);
  return { range: vx * flightTime, maxHeight: height + (vy > 0 ? (vy * vy) / (2 * g) : 0), flightTime, timeToApex };
}

/** Position of a no-drag projectile at time t. */
export function projectilePoint({ speed, angle, height = 0, g }, t) {
  return [speed * cosDeg(angle) * t, height + speed * sinDeg(angle) * t - 0.5 * g * t * t];
}

/** Terminal speed for a falling body: mg/k (linear, F = kv) or √(mg/k) (quadratic, F = kv²). */
export function terminalSpeed({ law, k, mass, g }) {
  return law === 'linear' ? (mass * g) / k : Math.sqrt((mass * g) / k);
}

/** Braking distance v²/(2μg). */
export function brakingDistance(speed, mu, g) {
  return (speed * speed) / (2 * mu * g);
}

/**
 * Impulse along the line of centres. n is the unit normal from B to A; e is the coefficient of restitution.
 * Returns the new velocities and the impulse J (N·s) on A along n.
 */
export function collide({ mA, mB, vA, vB, n, e }) {
  const rel = (vA[0] - vB[0]) * n[0] + (vA[1] - vB[1]) * n[1];
  if (rel >= 0) return { vA: vA.slice(), vB: vB.slice(), J: 0 };
  const J = (-(1 + e) * rel) / (1 / mA + 1 / mB);
  return {
    vA: [vA[0] + (J * n[0]) / mA, vA[1] + (J * n[1]) / mA],
    vB: [vB[0] - (J * n[0]) / mB, vB[1] - (J * n[1]) / mB],
    J,
  };
}

/**
 * Forces on a car on a banked curve (bank in radians). f > 0 acts down the slope (towards the centre).
 * Design speed √(rg tan θ); speed limits from friction μ.
 */
export function bankedForces({ mass, speed, radius, bank, g, mu }) {
  const ac = (speed * speed) / radius;
  const s = Math.sin(bank);
  const c = Math.cos(bank);
  const N = mass * (g * c + ac * s);
  const f = mass * (ac * c - g * s);
  const denMax = c - mu * s;
  const numMin = s - mu * c;
  return {
    ac,
    N,
    f,
    designSpeed: Math.sqrt(radius * g * Math.tan(bank)),
    vMax: denMax > 0 ? Math.sqrt((radius * g * (s + mu * c)) / denMax) : Infinity,
    vMin: numMin > 0 ? Math.sqrt((radius * g * numMin) / (c + mu * s)) : 0,
    muRequired: N > 0 ? Math.abs(f) / N : Infinity,
  };
}

/** Speed and period of a circular orbit of radius r. */
export function circularOrbit(GM, r) {
  return { speed: Math.sqrt(GM / r), period: TAU * Math.sqrt((r * r * r) / GM) };
}

/** Orbit radius with period T (Kepler's third law). */
export function radiusForPeriod(GM, T) {
  return Math.cbrt((GM * T * T) / (4 * Math.PI * Math.PI));
}

/** Conic elements from a position and velocity (2D). Unbound orbits have a = ra = period = Infinity. */
export function orbitElements(GM, x, y, vx, vy) {
  const r = Math.hypot(x, y);
  const energy = 0.5 * (vx * vx + vy * vy) - GM / r;
  const h = x * vy - y * vx;
  const e = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (GM * GM)));
  const bound = energy < 0;
  const a = bound ? -GM / (2 * energy) : Infinity;
  const p = (h * h) / GM;
  return {
    energy,
    h,
    e,
    a,
    rp: p / (1 + e),
    ra: bound ? a * (1 + e) : Infinity,
    period: bound ? TAU * Math.sqrt((a * a * a) / GM) : Infinity,
    bound,
  };
}

/**
 * 2D trilateration: the point whose distances from three centres best match the given ranges (least
 * squares; exact when the ranges agree). The linear "radical centre" solution starts Gauss–Newton
 * iterations on Σ(|p − sᵢ| − ρᵢ)², done relative to that start to keep precision with Earth-sized numbers.
 */
export function trilaterate(centres, ranges) {
  const p0 = radicalCentre(centres, ranges);
  if (!p0) return null;
  const rel = centres.map((s) => [s[0] - p0[0], s[1] - p0[1]]);
  let dx = 0;
  let dy = 0;
  for (let it = 0; it < 30; it++) {
    let a11 = 0;
    let a12 = 0;
    let a22 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < rel.length; i++) {
      const ex = dx - rel[i][0];
      const ey = dy - rel[i][1];
      const d = Math.hypot(ex, ey);
      const jx = ex / d;
      const jy = ey / d;
      const r = d - ranges[i];
      a11 += jx * jx;
      a12 += jx * jy;
      a22 += jy * jy;
      b1 += jx * r;
      b2 += jy * r;
    }
    const det = a11 * a22 - a12 * a12;
    if (!(Math.abs(det) > 1e-14)) break;
    const sx = -(a22 * b1 - a12 * b2) / det;
    const sy = -(a11 * b2 - a12 * b1) / det;
    dx += sx;
    dy += sy;
    if (Math.hypot(sx, sy) < 1e-9) break;
  }
  return [p0[0] + dx, p0[1] + dy];
}

/** The point where the three circles' radical axes meet (the linear solution of the range equations). */
function radicalCentre(centres, ranges) {
  const [s0, s1, s2] = centres;
  const d1x = s1[0] - s0[0];
  const d1y = s1[1] - s0[1];
  const d2x = s2[0] - s0[0];
  const d2y = s2[1] - s0[1];
  const r0 = ranges[0] * ranges[0];
  const b1 = 0.5 * (d1x * d1x + d1y * d1y + r0 - ranges[1] * ranges[1]);
  const b2 = 0.5 * (d2x * d2x + d2y * d2y + r0 - ranges[2] * ranges[2]);
  const det = d1x * d2y - d1y * d2x;
  if (Math.abs(det) < 1e-12 * (d1x * d1x + d1y * d1y + d2x * d2x + d2y * d2y)) return null;
  return [s0[0] + (b1 * d2y - d1y * b2) / det, s0[1] + (d1x * b2 - b1 * d2x) / det];
}

/** Target motions for the graph-matching challenge: [end time (s), acceleration (m/s²)] from rest at 0. */
export const CHALLENGES = {
  steady: [[2, 0.5], [Infinity, 0]],
  'speed-up': [[Infinity, 0.3]],
  'turn-back': [[2, 0.75], [4, 0], [8, -0.75], [Infinity, 0]],
  'stop-start': [[2, 0.5], [4, -0.5], [6, 0], [8, 0.5], [Infinity, 0]],
};

/** Target position, velocity and acceleration at time t. */
export function cartTarget(challenge, t) {
  const segs = CHALLENGES[challenge] ?? CHALLENGES.steady;
  let t0 = 0;
  let x = 0;
  let v = 0;
  for (const [tEnd, a] of segs) {
    const dt = Math.min(t, tEnd) - t0;
    if (dt > 0) {
      x += v * dt + 0.5 * a * dt * dt;
      v += a * dt;
    }
    if (t <= tEnd) return { x, v, a };
    t0 = tEnd;
  }
  return { x, v, a: 0 };
}

/**
 * Roller-track profiles y(x) with first and second derivatives (analytic).
 *   valley: y = H u², u = 2x/L − 1 (rims at height H, bottom at 0)
 *   hills:  y = H(½(1 − u²)² + u⁴) (rims at H, two valleys at H/3, a hump at H/2)
 *   ramp:   y = H(1 − sin(πx/2L)) for x ≤ L (slope πH/2L at the top, level at the foot), then a flat
 *           runway to 3L
 */
export function trackProfile(shape, H, L = TRACK_LENGTH) {
  if (shape === 'ramp') {
    const w = Math.PI / (2 * L);
    return {
      xMin: 0,
      xMax: 3 * L,
      joins: [L],
      // x = L belongs to the runway: after the join event the cart restarts there moving right
      y: (x) => (x < L ? H * (1 - Math.sin(w * x)) : 0),
      dy: (x) => (x < L ? -H * w * Math.cos(w * x) : 0),
      d2y: (x) => (x < L ? H * w * w * Math.sin(w * x) : 0),
    };
  }
  const k = 2 / L;
  if (shape === 'hills') {
    return {
      xMin: 0,
      xMax: L,
      joins: [],
      y: (x) => {
        const u = k * x - 1;
        const q = 1 - u * u;
        return H * (0.5 * q * q + u ** 4);
      },
      dy: (x) => {
        const u = k * x - 1;
        return H * (-2 * u + 6 * u ** 3) * k;
      },
      d2y: (x) => {
        const u = k * x - 1;
        return H * (-2 + 18 * u * u) * k * k;
      },
    };
  }
  return {
    xMin: 0,
    xMax: L,
    joins: [],
    y: (x) => {
      const u = k * x - 1;
      return H * u * u;
    },
    dy: (x) => H * 2 * (k * x - 1) * k,
    d2y: () => H * 2 * k * k,
  };
}

// ---------------------------------------------------------------------------------------------------
// Setups
// ---------------------------------------------------------------------------------------------------

const DEFS = {};

// Projectile: uniform gravity, optional linear (−kv) or quadratic (−k|v|v) drag; flat ground at y = 0.
DEFS.projectile = {
  columns: ['t (s)', 'x (m)', 'y (m)', 'vx (m/s)', 'vy (m/s)'],
  config(p, ov) {
    const b = { speed: p.speed, angleDeg: p.angle, angle: p.angle * DEG, height: p.height, g: p.g, drag: p.drag, k: p.k, mass: p.mass, h: DT, ...ov };
    b.kOverM = b.drag === 'none' ? 0 : b.k / b.mass;
    return b;
  },
  init(st) {
    const c = st.cfg;
    const vx = c.speed * cosDeg(c.angleDeg);
    const vy = c.speed * sinDeg(c.angleDeg);
    st.y = [0, c.height, vx, vy];
    if (vy <= 0) st.ev.apex = { t: 0, x: 0, y: c.height };
    if (c.height <= 0 && vy <= 0) {
      st.ev.land = { t: 0, x: 0, vx, vy };
      st.done = true;
    }
  },
  stiffness: (st) => dragRate(st.cfg.drag, st.cfg.kOverM, Math.hypot(st.y[2], st.y[3]), st.cfg.g),
  deriv(st) {
    const { g, drag, kOverM } = st.cfg;
    return (t, y) => {
      const vx = y[2];
      const vy = y[3];
      let ax = 0;
      let ay = -g;
      if (drag === 'linear') {
        ax -= kOverM * vx;
        ay -= kOverM * vy;
      } else if (drag === 'quadratic') {
        const sp = Math.hypot(vx, vy);
        ax -= kOverM * sp * vx;
        ay -= kOverM * sp * vy;
      }
      return [vx, vy, ax, ay];
    };
  },
  events: [
    {
      when: (st) => !st.ev.apex,
      g: (y) => y[3],
      on(st, y, t) {
        st.ev.apex = { t, x: y[0], y: y[1] };
        pushRow(st, y, t);
        return 'mark';
      },
    },
    {
      fromZero: true,
      g: (y) => y[1],
      on(st, y, t) {
        y[1] = 0;
        st.ev.land = { t, x: y[0], vx: y[2], vy: y[3] };
        return 'stop';
      },
    },
  ],
  row: (y, t) => [t, y[0], y[1], y[2], y[3]],
  outputs(st) {
    const [x, y, vx, vy] = st.y;
    const { apex, land } = st.ev;
    return {
      range: land ? land.x : null,
      maxHeight: apex ? apex.y : null,
      flightTime: land ? land.t : null,
      timeToApex: apex ? apex.t : null,
      impactSpeed: land ? Math.hypot(land.vx, land.vy) : null,
      impactAngle: land ? Math.atan2(-land.vy, land.vx) / DEG : null,
      x,
      y,
      vx,
      vy,
      speed: Math.hypot(vx, vy),
      t: st.t,
    };
  },
};

// Braking: constant speed during the reaction time, then deceleration μg until the car stops.
DEFS.braking = {
  columns: ['t (s)', 'x (m)', 'v (m/s)', 'a (m/s²)'],
  config(p, ov) {
    const b = { v0: p.speed, tr: p.reactionTime, mu: p.mu, g: p.g, m: p.carMass, rotorMass: p.rotorMass, rotorHeat: p.rotorHeat, h: DT, ...ov };
    b.decel = b.mu * b.g;
    return b;
  },
  init(st) {
    const c = st.cfg;
    st.y = [0, c.v0];
    st.phase = c.tr > 0 ? 'react' : 'brake';
    if (st.phase === 'brake') st.ev.brakeStart = { t: 0, x: 0 };
    if (c.v0 <= 0) {
      st.ev.brakeStart = { t: 0, x: 0 };
      st.ev.stop = { t: 0, x: 0 };
      st.phase = 'brake';
      st.done = true;
    }
  },
  deriv(st) {
    const a = st.phase === 'brake' ? -st.cfg.decel : 0;
    return (t, y) => [y[1], a];
  },
  events: [
    {
      when: (st) => st.phase === 'react',
      at: (st) => st.cfg.tr,
      on(st, y, t) {
        st.phase = 'brake';
        st.ev.brakeStart = { t, x: y[0] };
        pushRow(st, y, t);
        return 'restart';
      },
    },
    {
      when: (st) => st.phase === 'brake',
      g: (y) => y[1],
      on(st, y, t) {
        y[1] = 0;
        st.ev.stop = { t, x: y[0] };
        return 'stop';
      },
    },
  ],
  row: (y, t, st) => [t, y[0], y[1], st.phase === 'brake' && y[1] > 0 ? -st.cfg.decel : 0],
  outputs(st) {
    const c = st.cfg;
    const [x, v] = st.y;
    const { brakeStart: bs, stop } = st.ev;
    const F = c.m * c.decel;
    const braked = bs ? Math.max(0, x - bs.x) : 0;
    return {
      reactionDistance: bs ? bs.x : null,
      brakingDistance: stop ? stop.x - bs.x : null,
      stoppingDistance: stop ? stop.x : null,
      stoppingTime: stop ? stop.t : null,
      deceleration: c.decel,
      brakingForce: F,
      kineticEnergy: 0.5 * c.m * v * v,
      frictionWork: F * braked,
      rotorTempRise: (F * braked) / (c.rotorMass * c.rotorHeat),
      x,
      v,
      a: st.phase === 'brake' && v > 0 ? -c.decel : 0,
      t: st.t,
    };
  },
};

// Resisted motion in one dimension: horizontal (resistance only) or vertical (up positive, with gravity).
DEFS['resisted-1d'] = {
  columns: ['t (s)', 'x (m)', 'v (m/s)', 'a (m/s²)'],
  config(p, ov) {
    const b = { vertical: p.direction === 'vertical', law: p.resistance, k: p.resistK, m: p.mass, g: p.g, v0: p.v0, duration: p.duration, h: DT, ...ov };
    b.kOverM = b.k / b.m;
    b.gEff = b.vertical ? b.g : 0;
    return b;
  },
  init(st) {
    const c = st.cfg;
    st.y = [0, c.v0];
    if (c.vertical && c.v0 <= 0) st.ev.apex = { t: 0, x: 0 };
  },
  stiffness: (st) => dragRate(st.cfg.law, st.cfg.kOverM, Math.abs(st.y[1]), st.cfg.gEff),
  accel(c, v) {
    return -c.gEff - c.kOverM * (c.law === 'linear' ? v : Math.abs(v) * v);
  },
  deriv(st) {
    const c = st.cfg;
    return (t, y) => [y[1], DEFS['resisted-1d'].accel(c, y[1])];
  },
  events: [
    {
      when: (st) => st.cfg.vertical && !st.ev.apex,
      g: (y) => y[1],
      on(st, y, t) {
        st.ev.apex = { t, x: y[0] };
        pushRow(st, y, t);
        return 'mark';
      },
    },
    endAt('duration'),
  ],
  row: (y, t, st) => [t, y[0], y[1], DEFS['resisted-1d'].accel(st.cfg, y[1])],
  outputs(st) {
    const c = st.cfg;
    const [x, v] = st.y;
    return {
      x,
      v,
      a: this.accel(c, v),
      t: st.t,
      terminalSpeed: c.vertical ? terminalSpeed({ law: c.law, k: c.k, mass: c.m, g: c.g }) : null,
      maxHeight: c.vertical && st.ev.apex ? st.ev.apex.x : null,
      timeToMax: c.vertical && st.ev.apex ? st.ev.apex.t : null,
      limitDistance: !c.vertical && c.law === 'linear' ? c.v0 / c.kOverM : null,
    };
  },
};

// Simple harmonic motion: a mass on a spring, x'' = −(k/m)x, started at x = a cos α, v = −an sin α.
DEFS.shm = {
  columns: ['t (s)', 'x (m)', 'v (m/s)', 'a (m/s²)'],
  config(p, ov) {
    const b = { a: p.amplitude, k: p.springK, m: p.mass, alpha: p.phase * DEG, duration: p.duration, h: DT, ...ov };
    b.n = Math.sqrt(b.k / b.m);
    return b;
  },
  init(st) {
    const c = st.cfg;
    st.y = [c.a * Math.cos(c.alpha), -c.a * c.n * Math.sin(c.alpha)];
    st.ev.crossings = [];
  },
  deriv(st) {
    const n2 = st.cfg.n * st.cfg.n;
    return (t, y) => [y[1], -n2 * y[0]];
  },
  events: [
    {
      // upward zero crossings (x from negative to positive) measure the period
      g: (y) => -y[0],
      on(st, y, t) {
        st.ev.crossings.push(t);
        return 'mark';
      },
    },
    endAt('duration'),
  ],
  row: (y, t, st) => [t, y[0], y[1], -st.cfg.n * st.cfg.n * y[0]],
  outputs(st) {
    const c = st.cfg;
    const [x, v] = st.y;
    const cr = st.ev.crossings;
    return {
      period: TAU / c.n,
      omega: c.n,
      frequency: c.n / TAU,
      vMax: c.a * c.n,
      aMax: c.a * c.n * c.n,
      energy: 0.5 * c.k * c.a * c.a,
      measuredPeriod: cr.length >= 2 ? cr[cr.length - 1] - cr[cr.length - 2] : null,
      x,
      v,
      a: -c.n * c.n * x,
      t: st.t,
    };
  },
};

// Charged particle: F = q(E + v × B). E between parallel plates (top plate at +V), B perpendicular to the
// page (Bz > 0 out of the page). Electric and crossed fields fill the plates (0 ≤ x ≤ L, |y| ≤ d/2); the
// magnetic field fills 0 ≤ x ≤ L.
DEFS.charged = {
  columns: ['t (s)', 'x (m)', 'y (m)', 'vx (m/s)', 'vy (m/s)'],
  config(p, ov) {
    const part = PARTICLES[p.particle] ?? PARTICLES.electron;
    const b = {
      mode: p.field,
      m: part.mass,
      q: part.charge,
      v: p.entrySpeed * 1e6,
      L: p.plateLength / 100,
      d: p.plateGap / 100,
      V: p.voltage,
      Bz: (p.bField / 1000) * (p.bDirection === 'into' ? -1 : 1),
      ...ov,
    };
    b.Ey = b.mode === 'magnetic' ? 0 : -b.V / b.d;
    if (b.mode === 'electric') b.Bz = 0;
    const magnetic = b.mode === 'magnetic';
    b.radius = b.Bz !== 0 ? (b.m * b.v) / Math.abs(b.q * b.Bz) : Infinity;
    const T = magnetic && b.Bz !== 0 ? Math.min((Math.PI * b.m) / Math.abs(b.q * b.Bz), (3 * b.L) / b.v) : b.L / b.v;
    b.timeUnit = ov.timeUnit ?? T / 4;
    b.h = DT * b.timeUnit;
    b.yMax = magnetic ? Math.min(Math.max(2.3 * b.radius, 0.5 * b.L), 1.5 * b.L) : b.d / 2;
    b.tCap = 20 * T;
    return b;
  },
  init(st) {
    st.y = [0, 0, st.cfg.v, 0];
  },
  deriv(st) {
    const { q, m, Ey, Bz } = st.cfg;
    const qm = q / m;
    return (t, y) => [y[2], y[3], qm * y[3] * Bz, qm * (Ey - y[2] * Bz)];
  },
  events: [
    { g: (y, t, st) => st.cfg.L - y[0], on: (st) => DEFS.charged.exit(st, 'right') },
    { g: (y) => y[0], on: (st) => DEFS.charged.exit(st, 'left') },
    { when: (st) => st.cfg.mode !== 'magnetic', g: (y, t, st) => st.cfg.d / 2 - y[1], on: (st) => DEFS.charged.exit(st, 'plate') },
    { when: (st) => st.cfg.mode !== 'magnetic', g: (y, t, st) => y[1] + st.cfg.d / 2, on: (st) => DEFS.charged.exit(st, 'plate') },
    { when: (st) => st.cfg.mode === 'magnetic', g: (y, t, st) => st.cfg.yMax - y[1], on: (st) => DEFS.charged.exit(st, 'view') },
    { when: (st) => st.cfg.mode === 'magnetic', g: (y, t, st) => y[1] + st.cfg.yMax, on: (st) => DEFS.charged.exit(st, 'view') },
    endAt('tCap'),
  ],
  exit(st, how) {
    st.ev.end = how;
    return 'stop';
  },
  row: (y, t) => [t, y[0], y[1], y[2], y[3]],
  outputs(st) {
    const c = st.cfg;
    const [x, y, vx, vy] = st.y;
    const Fx = c.q * vy * c.Bz;
    const Fy = c.q * (c.Ey - vx * c.Bz);
    const F = Math.hypot(Fx, Fy);
    const end = st.done ? st.ev.end : null;
    const leftPlates = end === 'right' && c.mode !== 'magnetic';
    const magnetic = c.mode === 'magnetic' && c.Bz !== 0;
    return {
      fieldE: Math.abs(c.Ey),
      force: F,
      acceleration: F / c.m,
      radius: magnetic ? c.radius : null,
      cyclotronPeriod: magnetic ? (TAU * c.m) / Math.abs(c.q * c.Bz) : null,
      selectorSpeed: c.mode === 'selector' && c.Bz !== 0 ? Math.abs(c.Ey / c.Bz) : null,
      deflection: leftPlates || end === 'plate' ? y : null,
      exitAngle: end ? Math.atan2(vy, vx) / DEG : null,
      timeInField: end && end !== 'view' && end !== 'time' ? st.t : null,
      exitSeparation: end === 'left' ? Math.abs(y) : null,
      entrySpeed: c.v,
      kineticEnergy: 0.5 * c.m * (vx * vx + vy * vy),
      workDone: 0.5 * c.m * (vx * vx + vy * vy - c.v * c.v),
      x,
      y,
      vx,
      vy,
      speed: Math.hypot(vx, vy),
      t: st.t,
    };
  },
};

// Circular motion: a car on a (banked) curve or a mass on a string, driven by the centripetal force
// m|v|²/r towards the centre (so the RK4 path stays on the circle); torque mode has no motion.
DEFS.circular = {
  columns: ['t (s)', 'x (m)', 'y (m)', 'vx (m/s)', 'vy (m/s)'],
  config(p, ov) {
    return {
      mode: p.circularMode,
      r: p.radius,
      v: p.speed,
      mass: p.mass,
      carMass: p.carMass,
      bank: p.bankAngle * DEG,
      mu: p.mu,
      g: p.g,
      release: p.releaseAfter,
      F: p.force,
      arm: p.leverArm,
      phi: p.forceAngle * DEG,
      sinPhi: sinDeg(p.forceAngle),
      duration: p.duration,
      h: DT,
      ...ov,
    };
  },
  init(st) {
    const c = st.cfg;
    st.y = [c.r, 0, 0, c.v];
    st.free = false;
    if (c.mode === 'torque') {
      st.y = [0, 0, 0, 0];
      st.ev.end = 'static';
      st.done = true;
    }
  },
  deriv(st) {
    if (st.free) return (t, y) => [y[2], y[3], 0, 0];
    return (t, y) => {
      const k = (y[2] * y[2] + y[3] * y[3]) / (y[0] * y[0] + y[1] * y[1]);
      return [y[2], y[3], -k * y[0], -k * y[1]];
    };
  },
  events: [
    {
      when: (st) => st.cfg.mode === 'string' && st.cfg.release > 0 && !st.free,
      at: (st) => st.cfg.release,
      on(st, y, t) {
        st.free = true;
        st.ev.release = { t, x: y[0], y: y[1] };
        pushRow(st, y, t);
        return 'restart';
      },
    },
    endAt('duration'),
  ],
  row: (y, t) => [t, y[0], y[1], y[2], y[3]],
  outputs(st) {
    const c = st.cfg;
    const [x, y, vx, vy] = st.y;
    const torque = c.mode === 'torque';
    const m = c.mode === 'track' ? c.carMass : c.mass;
    const bank = c.mode === 'track' ? bankedForces({ mass: c.carMass, speed: c.v, radius: c.r, bank: c.bank, g: c.g, mu: c.mu }) : null;
    return {
      period: !torque && c.v > 0 ? (TAU * c.r) / c.v : null,
      omega: torque ? null : c.v / c.r,
      centripetalAccel: torque ? null : (c.v * c.v) / c.r,
      centripetalForce: torque || st.free ? (torque ? null : 0) : (m * c.v * c.v) / c.r,
      designSpeed: bank ? bank.designSpeed : null,
      normalForce: bank ? bank.N : null,
      frictionForce: bank ? bank.f : null,
      muRequired: bank && Number.isFinite(bank.muRequired) ? bank.muRequired : null,
      maxSpeed: bank && Number.isFinite(bank.vMax) ? bank.vMax : null,
      minSpeed: bank ? bank.vMin : null,
      torque: torque ? c.arm * c.F * c.sinPhi : null,
      perpForce: torque ? c.F * c.sinPhi : null,
      momentArm: torque ? c.arm * c.sinPhi : null,
      x,
      y,
      speed: Math.hypot(vx, vy),
      t: st.t,
    };
  },
};

// Collisions: two pucks (radius PUCK_RADIUS) on a frictionless surface, one impulse along the line of
// centres with coefficient of restitution e. Motion between contacts is exactly linear, so the contact
// time is solved exactly from |Δr + Δv τ| = 2R.
function contactTime(y, R) {
  const dx = y[0] - y[4];
  const dy = y[1] - y[5];
  const wx = y[2] - y[6];
  const wy = y[3] - y[7];
  const a = wx * wx + wy * wy;
  const b = 2 * (dx * wx + dy * wy);
  const c = dx * dx + dy * dy - 4 * R * R;
  if (a === 0 || b >= 0) return null;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const tau = (-b - Math.sqrt(disc)) / (2 * a);
  return tau >= 0 ? tau : c <= 0 ? 0 : null;
}
const drift = (y, dt) => [y[0] + y[2] * dt, y[1] + y[3] * dt, y[2], y[3], y[4] + y[6] * dt, y[5] + y[7] * dt, y[6], y[7]];

DEFS.collisions = {
  columns: ['t (s)', 'xA (m)', 'yA (m)', 'vxA (m/s)', 'vyA (m/s)', 'xB (m)', 'yB (m)', 'vxB (m/s)', 'vyB (m/s)'],
  config(p, ov) {
    const b = {
      twoD: p.dimension === '2d',
      mA: p.m1,
      mB: p.m2,
      uA: p.u1,
      uB: p.u2,
      e: p.restitution,
      b: p.dimension === '2d' ? p.offset : 0,
      R: PUCK_RADIUS,
      startA: -3,
      h: DT,
      ...ov,
    };
    const tc = contactTime([b.startA, b.b, b.uA, 0, 0, 0, b.uB, 0], b.R);
    b.tc = tc;
    b.tEnd = tc === null ? 4 : Math.min(tc + 2.5, 60);
    return b;
  },
  init(st) {
    const c = st.cfg;
    st.y = [c.startA, c.b, c.uA, 0, 0, 0, c.uB, 0];
    st.ke0 = this.ke(c, st.y);
  },
  ke: (c, y) => 0.5 * c.mA * (y[2] * y[2] + y[3] * y[3]) + 0.5 * c.mB * (y[6] * y[6] + y[7] * y[7]),
  step(st) {
    const c = st.cfg;
    let t = st.t;
    const tEnd = Math.min((st.n + 1) * c.h, c.tEnd);
    let y = st.y;
    if (!st.ev.collision) {
      const tau = contactTime(y, c.R);
      if (tau !== null && t + tau <= tEnd) {
        y = drift(y, tau);
        t += tau;
        pushRow(st, y, t);
        const nx = y[0] - y[4];
        const ny = y[1] - y[5];
        const len = Math.hypot(nx, ny);
        const res = collide({ mA: c.mA, mB: c.mB, vA: [y[2], y[3]], vB: [y[6], y[7]], n: [nx / len, ny / len], e: c.e });
        y = [y[0], y[1], res.vA[0], res.vA[1], y[4], y[5], res.vB[0], res.vB[1]];
        st.ev.collision = { t, J: res.J, xA: y[0], yA: y[1], xB: y[4], yB: y[5] };
        pushRow(st, y, t, true);
      }
    }
    st.y = drift(y, tEnd - t);
    st.t = tEnd;
    if (tEnd >= c.tEnd) {
      st.ev.end = 'time';
      st.done = true;
    }
  },
  row: (y, t) => [t, ...y],
  outputs(st) {
    const c = st.cfg;
    const y = st.y;
    const col = st.ev.collision;
    const ke = this.ke(c, y);
    const angle = (vx, vy) => (col && Math.hypot(vx, vy) > 1e-12 ? Math.atan2(vy, vx) / DEG : null);
    const pScale = Math.abs(c.mA * c.uA) + Math.abs(c.mB * c.uB);
    return {
      vA: y[2],
      vB: y[6],
      vAy: snap(y[3], Math.abs(c.uA) + Math.abs(c.uB)),
      vBy: snap(y[7], Math.abs(c.uA) + Math.abs(c.uB)),
      pTotal: c.mA * y[2] + c.mB * y[6],
      pTotalY: snap(c.mA * y[3] + c.mB * y[7], pScale),
      keTotal: ke,
      keLost: col ? snap(st.ke0 - ke, st.ke0) : null,
      angleA: angle(y[2], y[3]),
      angleB: angle(y[6], y[7]),
      impulse: col ? col.J : null,
      collisionTime: col ? col.t : null,
      t: st.t,
    };
  },
};

// Cart on a straight track: constant acceleration, driven by a throttle, or matching a target graph.
DEFS.cart = {
  columns: ['t (s)', 'x (m)', 'v (m/s)', 'a (m/s²)'],
  config(p, ov) {
    const match = p.cartMode === 'match';
    return { mode: p.cartMode, x0: match ? 0 : p.x0, u: match ? 0 : p.u, a: p.accel, challenge: p.challenge, duration: p.duration, h: DT, ...ov };
  },
  init(st) {
    st.y = [st.cfg.x0, st.cfg.u];
    st.throttle = 0;
    st.errSum = 0;
    st.errN = 0;
  },
  accel: (st) => (st.cfg.mode === 'uniform' ? st.cfg.a : Math.max(-2, Math.min(2, Number(st.throttle) || 0))),
  deriv(st) {
    const a = DEFS.cart.accel(st);
    return (t, y) => [y[1], a];
  },
  events: [endAt('duration')],
  after(st) {
    if (st.cfg.mode !== 'match') return;
    const d = st.y[0] - cartTarget(st.cfg.challenge, st.t).x;
    st.errSum += d * d;
    st.errN += 1;
  },
  row: (y, t, st) => [t, y[0], y[1], DEFS.cart.accel(st)],
  outputs(st) {
    const [x, v] = st.y;
    const match = st.cfg.mode === 'match';
    return {
      x,
      v,
      a: this.accel(st),
      t: st.t,
      matchError: match ? (st.errN ? Math.sqrt(st.errSum / st.errN) : 0) : null,
      targetX: match ? cartTarget(st.cfg.challenge, st.t).x : null,
    };
  },
};

// Orbit: central gravity −GM r/r³ about Earth's centre; the swept angle θ and swept area A are integrated
// with the motion (dθ/dt = h/r², dA/dt = h/2, h = x vy − y vx). The run ends after one revolution, a crash
// into Earth, or leaving the view.
DEFS.orbit = {
  columns: ['t (s)', 'x (m)', 'y (m)', 'vx (m/s)', 'vy (m/s)', 'r (m)'],
  config(p, ov) {
    const b = { GM: EARTH.GM, R: EARTH.radius, r0: EARTH.radius + p.altitude * 1000, v0: p.orbitSpeed * 1000, gamma: p.launchAngle * DEG, m: p.satMass, ...ov };
    b.Tc = circularOrbit(b.GM, b.r0).period;
    b.timeUnit = ov.timeUnit ?? b.Tc / 12;
    b.h = DT * b.timeUnit;
    b.el = orbitElements(b.GM, b.r0, 0, b.v0 * Math.sin(b.gamma), b.v0 * Math.cos(b.gamma));
    b.rOut = 8 * b.r0;
    b.viewR = b.el.bound && b.el.ra <= b.rOut ? Math.max(b.el.ra, b.r0) : b.rOut;
    b.tCap = 40 * b.Tc;
    return b;
  },
  init(st) {
    const c = st.cfg;
    st.y = [c.r0, 0, c.v0 * Math.sin(c.gamma), c.v0 * Math.cos(c.gamma), 0, 0];
  },
  deriv(st) {
    const GM = st.cfg.GM;
    return (t, y) => {
      const r2 = y[0] * y[0] + y[1] * y[1];
      const r3 = r2 * Math.sqrt(r2);
      const L = y[0] * y[3] - y[1] * y[2];
      return [y[2], y[3], (-GM * y[0]) / r3, (-GM * y[1]) / r3, L / r2, 0.5 * L];
    };
  },
  events: [
    { g: (y, t, st) => Math.hypot(y[0], y[1]) - st.cfg.R, on: (st, y) => DEFS.orbit.end(st, y, 'crash') },
    { g: (y) => TAU - y[4], on: (st, y) => DEFS.orbit.end(st, y, 'orbit') },
    { g: (y, t, st) => st.cfg.rOut - Math.hypot(y[0], y[1]), on: (st, y) => DEFS.orbit.end(st, y, 'escape') },
    endAt('tCap'),
  ],
  end(st, y, how) {
    st.ev.end = how;
    return 'stop';
  },
  row: (y, t) => [t, y[0], y[1], y[2], y[3], Math.hypot(y[0], y[1])],
  outputs(st) {
    const c = st.cfg;
    const [x, y, vx, vy, , A] = st.y;
    const r = Math.hypot(x, y);
    const v = Math.hypot(vx, vy);
    const el = orbitElements(c.GM, x, y, vx, vy);
    const ke = 0.5 * c.m * v * v;
    const pe = (-c.GM * c.m) / r;
    return {
      r,
      altitude: r - c.R,
      altitudeKm: (r - c.R) / 1000,
      speed: v,
      t: st.t,
      tMinutes: st.t / 60,
      period: el.bound ? el.period : null,
      periodMinutes: el.bound ? el.period / 60 : null,
      semiMajorAxis: el.bound ? el.a : null,
      eccentricity: el.e,
      perigeeAltitude: el.rp - c.R,
      apogeeAltitude: el.bound ? el.ra - c.R : null,
      circularSpeed: circularOrbit(c.GM, c.r0).speed,
      escapeSpeed: Math.sqrt((2 * c.GM) / c.r0),
      kineticEnergy: ke,
      potentialEnergy: pe,
      totalEnergy: ke + pe,
      arealVelocity: 0.5 * Math.abs(x * vy - y * vx),
      sweptArea: A,
      keplerRatio: el.bound ? (el.period * el.period) / (el.a * el.a * el.a) : null,
    };
  },
};

// Orbits and GPS: a low satellite, GPS (half a sidereal day) and geostationary (one sidereal day) orbits,
// all circular and integrated with RK4 for one sidereal day. Eight GPS satellites share one orbit (the
// integrated one, rotated in 45° steps). Earth turns once per sidereal day.
DEFS['orbit-gps'] = {
  columns: ['t (s)', 'LEO x (m)', 'LEO y (m)', 'GPS x (m)', 'GPS y (m)', 'GEO x (m)', 'GEO y (m)'],
  config(p, ov) {
    const b = { GM: EARTH.GM, R: EARTH.radius, day: EARTH.siderealDay, altitude: p.altitude * 1000, psi0: p.receiverAngle * DEG, clock: p.clockError * 1e-9, timeUnit: 3600, gpsCount: 8, gpsPhase0: 10 * DEG, ...ov };
    b.rLeo = b.R + b.altitude;
    b.rGps = radiusForPeriod(b.GM, b.day * GPS_PERIOD_FRACTION);
    b.rGeo = radiusForPeriod(b.GM, b.day);
    b.h = DT * b.timeUnit;
    b.omegaE = TAU / b.day;
    return b;
  },
  init(st) {
    const c = st.cfg;
    const body = (r, phase) => {
      const v = circularOrbit(c.GM, r).speed;
      return [r * Math.cos(phase), r * Math.sin(phase), -v * Math.sin(phase), v * Math.cos(phase)];
    };
    st.y = [...body(c.rLeo, 0), ...body(c.rGps, c.gpsPhase0), ...body(c.rGeo, c.psi0)];
  },
  deriv(st) {
    const GM = st.cfg.GM;
    return (t, y) => {
      const out = new Array(12);
      for (let i = 0; i < 12; i += 4) {
        const r2 = y[i] * y[i] + y[i + 1] * y[i + 1];
        const r3 = r2 * Math.sqrt(r2);
        out[i] = y[i + 2];
        out[i + 1] = y[i + 3];
        out[i + 2] = (-GM * y[i]) / r3;
        out[i + 3] = (-GM * y[i + 1]) / r3;
      }
      return out;
    };
  },
  events: [endAt('day')],
  row: (y, t) => [t, y[0], y[1], y[4], y[5], y[8], y[9]],
  outputs(st) {
    const c = st.cfg;
    const leo = circularOrbit(c.GM, c.rLeo);
    const gps = circularOrbit(c.GM, c.rGps);
    const geo = circularOrbit(c.GM, c.rGeo);
    const fix = gpsFix(st);
    return {
      leoPeriod: leo.period,
      leoPeriodMinutes: leo.period / 60,
      leoSpeed: leo.speed,
      gpsPeriod: gps.period,
      gpsPeriodHours: gps.period / 3600,
      gpsSpeed: gps.speed,
      gpsAltitude: c.rGps - c.R,
      gpsAltitudeKm: (c.rGps - c.R) / 1000,
      geoPeriod: geo.period,
      geoPeriodHours: geo.period / 3600,
      geoSpeed: geo.speed,
      geoAltitude: c.rGeo - c.R,
      geoAltitudeKm: (c.rGeo - c.R) / 1000,
      rangeError: C_LIGHT * c.clock,
      positionError: fix.error === null ? null : snap(fix.error, c.rGps),
      signalTime: fix.used.length ? fix.used[0].travel : null,
      t: st.t,
      tHours: st.t / 3600,
    };
  },
};

/** Positions of the eight GPS satellites at the current state (Earth-centred, m). */
export function gpsSatellites(st) {
  const c = st.cfg;
  const [x, y] = [st.y[4], st.y[5]];
  const out = [];
  for (let k = 0; k < c.gpsCount; k++) {
    const a = (k * TAU) / c.gpsCount;
    out.push([x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
  }
  return out;
}

/** Receiver position on Earth's surface (it turns with Earth). */
export function gpsReceiver(st) {
  const c = st.cfg;
  const a = c.psi0 + c.omegaE * st.t;
  return [c.R * Math.cos(a), c.R * Math.sin(a)];
}

/**
 * GPS fix: the three satellites highest above the receiver's horizon, their pseudoranges (true range plus
 * c × clock error), and the trilaterated position.
 */
export function gpsFix(st) {
  const c = st.cfg;
  const p = gpsReceiver(st);
  const up = [p[0] / c.R, p[1] / c.R];
  const sats = gpsSatellites(st).map((s, i) => {
    const dx = s[0] - p[0];
    const dy = s[1] - p[1];
    const range = Math.hypot(dx, dy);
    return { i, pos: s, range, elevation: Math.asin((dx * up[0] + dy * up[1]) / range), travel: range / C_LIGHT, pseudo: range + C_LIGHT * c.clock };
  });
  const used = sats.filter((s) => s.elevation > 0).sort((a, b) => b.elevation - a.elevation).slice(0, 3);
  let solution = null;
  if (used.length === 3) solution = trilaterate(used.map((s) => s.pos), used.map((s) => s.pseudo));
  return { receiver: p, sats, used, solution, error: solution ? Math.hypot(solution[0] - p[0], solution[1] - p[1]) : null };
}

// Relative velocity: a boat crossing a river (x downstream, y across) or a plane in a wind (x east, y north).
// Velocities are constant, so the ground velocity is the vector sum.
DEFS['relative-velocity'] = {
  columns: ['t (s)', 'x (m)', 'y (m)', 'vx (m/s)', 'vy (m/s)'],
  config(p, ov) {
    const b = { boat: p.scenario !== 'plane', ...ov };
    if (b.boat) {
      Object.assign(b, { vb: p.boatSpeed, heading: p.heading * DEG, u: p.current, W: p.riverWidth }, ov);
      b.rel = [-b.vb * sinDeg(p.heading), b.vb * cosDeg(p.heading)];
      b.medium = [b.u, 0];
      b.ground = [b.u + b.rel[0], b.rel[1]];
      const cross = b.ground[1] > 1e-12 ? b.W / b.ground[1] : Infinity;
      b.timeUnit = Number.isFinite(cross) ? Math.max(1, cross / 8) : 1;
      b.tCap = Number.isFinite(cross) ? Infinity : 30;
    } else {
      Object.assign(b, { va: p.airspeed / 3.6, bearing: p.bearing * DEG, w: p.windSpeed / 3.6, windBearing: p.windBearing * DEG, T: p.flightTime * 3600 }, ov);
      b.rel = [b.va * sinDeg(p.bearing), b.va * cosDeg(p.bearing)];
      b.medium = [b.w * sinDeg(p.windBearing), b.w * cosDeg(p.windBearing)];
      b.ground = [b.rel[0] + b.medium[0], b.rel[1] + b.medium[1]];
      b.timeUnit = b.T / 8;
      b.tCap = b.T;
    }
    b.h = DT * b.timeUnit;
    return b;
  },
  init(st) {
    st.y = [0, 0, st.cfg.ground[0], st.cfg.ground[1]];
  },
  deriv: () => (t, y) => [y[2], y[3], 0, 0],
  events: [
    {
      when: (st) => st.cfg.boat,
      g: (y, t, st) => st.cfg.W - y[1],
      on(st, y) {
        y[1] = st.cfg.W;
        st.ev.end = 'bank';
        return 'stop';
      },
    },
    { when: (st) => Number.isFinite(st.cfg.tCap), at: (st) => st.cfg.tCap, on: (st) => ((st.ev.end = 'time'), 'stop') },
  ],
  row: (y, t) => [t, y[0], y[1], y[2], y[3]],
  outputs(st) {
    const c = st.cfg;
    const [x, y, vx, vy] = st.y;
    const gs = Math.hypot(vx, vy);
    const landed = st.ev.end === 'bank';
    const track = ((Math.atan2(vx, vy) / DEG) % 360 + 360) % 360;
    return {
      groundSpeed: gs,
      groundSpeedKmh: gs * 3.6,
      groundDirection: c.boat ? Math.atan2(vx, vy) / DEG : track,
      crossingTime: c.boat && landed ? st.t : null,
      drift: c.boat && landed ? x : null,
      headingForStraight: c.boat && c.u < c.vb ? Math.asin(c.u / c.vb) / DEG : null,
      distance: Math.hypot(x, y),
      driftAngle: c.boat ? null : ((((track - c.bearing / DEG) % 360) + 540) % 360) - 180,
      x,
      y,
      t: st.t,
      tHours: st.t / 3600,
    };
  },
};

// Roller track: a cart on y(x) with gravity, normal force N = m(g cos φ + v²κ) and kinetic friction μ|N|.
// State [x, ẋ, W]: W is the work done against friction, so KE + GPE + W stays equal to the starting energy.
// Friction's direction is fixed within a step (dir); a reversal is an event: the cart stops if μ ≥ |tan φ|.
DEFS.track = {
  columns: ['t (s)', 'x (m)', 'height (m)', 'v (m/s)', 'KE (J)', 'GPE (J)', 'W friction (J)'],
  config(p, ov) {
    const b = { shape: p.shape, H: p.trackHeight, mu: p.friction, m: p.mass, g: p.g, v0: p.startSpeed, duration: p.duration, h: DT, ...ov };
    b.P = trackProfile(b.shape, b.H);
    return b;
  },
  init(st) {
    const c = st.cfg;
    const x0 = c.P.xMin;
    const d1 = c.P.dy(x0);
    st.y = [x0, c.v0 / Math.sqrt(1 + d1 * d1), 0];
    st.e0 = this.energy(c, st.y).total;
    if (c.v0 > 0) st.dir = 1;
    else if (c.mu >= Math.abs(d1)) {
      st.dir = 0;
      st.ev.end = 'stopped';
      st.done = true;
    } else st.dir = -Math.sign(d1);
  },
  energy(c, y) {
    const d1 = c.P.dy(y[0]);
    const v = y[1] * Math.sqrt(1 + d1 * d1);
    const ke = 0.5 * c.m * v * v;
    const gpe = c.m * c.g * c.P.y(y[0]);
    return { v, ke, gpe, w: y[2], total: ke + gpe + y[2] };
  },
  normal(c, x, xd) {
    const d1 = c.P.dy(x);
    const d2 = c.P.d2y(x);
    const sig = Math.sqrt(1 + d1 * d1);
    const v = xd * sig;
    return c.m * (c.g / sig + (v * v * d2) / (sig * sig * sig));
  },
  deriv(st) {
    const c = st.cfg;
    const dir = st.dir;
    return (t, y) => {
      const x = y[0];
      const xd = y[1];
      const d1 = c.P.dy(x);
      const d2 = c.P.d2y(x);
      const sig = Math.sqrt(1 + d1 * d1);
      const v = xd * sig;
      const N = c.m * (c.g / sig + (v * v * d2) / (sig * sig * sig));
      const fr = c.mu * Math.abs(N);
      const dv = (-c.g * d1) / sig - (fr / c.m) * dir;
      return [xd, (dv - (xd * xd * d1 * d2) / sig) / sig, fr * v * dir];
    };
  },
  events: [
    {
      // reversal: the velocity reaches zero
      g: (y, t, st) => st.dir * y[1],
      on(st, y) {
        y[1] = 0;
        const d1 = st.cfg.P.dy(y[0]);
        if (st.cfg.mu >= Math.abs(d1)) {
          st.ev.end = 'stopped';
          return 'stop';
        }
        st.dir = -Math.sign(d1);
        return 'restart';
      },
    },
    // the joins in a profile (ramp to runway) are step boundaries, so RK4 never straddles a kink
    {
      when: (st) => st.cfg.P.joins.length > 0,
      g: (y, t, st) => st.cfg.P.joins[0] - y[0],
      on(st, y, t) {
        y[0] = st.cfg.P.joins[0];
        st.ev.join = { t, v: DEFS.track.energy(st.cfg, y).v };
        pushRow(st, y, t);
        return 'restart';
      },
    },
    { g: (y, t, st) => y[0] - st.cfg.P.xMin + 1e-6, on: (st) => ((st.ev.end = 'end'), 'stop') },
    { g: (y, t, st) => st.cfg.P.xMax + 1e-6 - y[0], on: (st) => ((st.ev.end = 'end'), 'stop') },
    endAt('duration'),
  ],
  row(y, t, st) {
    const e = DEFS.track.energy(st.cfg, y);
    return [t, y[0], st.cfg.P.y(y[0]), e.v, e.ke, e.gpe, e.w];
  },
  outputs(st) {
    const c = st.cfg;
    const e = this.energy(c, st.y);
    return {
      x: st.y[0],
      height: c.P.y(st.y[0]),
      v: e.v,
      kineticEnergy: e.ke,
      potentialEnergy: e.gpe,
      frictionWork: e.w,
      totalEnergy: e.total,
      normalForce: this.normal(c, st.y[0], st.y[1]),
      t: st.t,
    };
  },
};

// ---------------------------------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------------------------------

export const SETUPS = Object.keys(DEFS);

/**
 * A fresh run at t = 0. `overrides` replace derived SI settings (used by tests, e.g. { GM: 1 }).
 * @param {string} setup
 * @param {object} params full params for the setup (meta defaults merged with the page's values)
 */
export function createState(setup, params, overrides = {}) {
  const def = DEFS[setup];
  if (!def) throw new Error(`particle2d: unknown setup "${setup}"`);
  const st = { setup, cfg: def.config(params, overrides), n: 0, t: 0, y: [], done: false, ev: {}, hist: [] };
  def.init.call(def, st);
  st.hist.push(def.row(st.y, 0, st));
  return st;
}

/** Advance by up to `steps` fixed steps, stopping at the end of the run. Mutates and returns the state. */
export function advance(st, params, steps = 1) {
  const def = DEFS[st.setup];
  const n = Math.max(0, Math.floor(steps));
  for (let i = 0; i < n && !st.done; i++) {
    if (def.step) def.step(st);
    else integrate(st, def);
    if (!st.y.every(Number.isFinite)) {
      st.done = true;
      throw new Error('These values make the numbers too large to simulate. Try a smaller speed or coefficient.');
    }
    st.n += 1;
    def.after?.(st);
    if (st.done || st.n % REC === 0) pushRow(st, st.y, st.t);
  }
  return st;
}

export function isComplete(st) {
  return st.done;
}

/** Outputs in SI units, unrounded (null where a value does not exist yet, e.g. range before landing). */
export function outputs(st) {
  const def = DEFS[st.setup];
  return def.outputs.call(def, st);
}

export function dataColumns(setup) {
  return DEFS[setup].columns.slice();
}

/** Recorded rows from t = 0 to now (always ending with the current state). */
export function dataRows(st) {
  const rows = st.hist.map((r) => r.slice());
  const last = rows[rows.length - 1];
  if (!last || last[0] !== st.t) rows.push(DEFS[st.setup].row(st.y, st.t, st));
  return rows;
}

/** Run a copy of the scenario to its end (for view extents). */
export function preview(setup, params, overrides = {}, maxSteps = 60000) {
  return advance(createState(setup, params, overrides), params, maxSteps);
}

/** Track energy for the view (KE, GPE, W, total). */
export function trackEnergy(st) {
  return DEFS.track.energy(st.cfg, st.y);
}
