// aero engine model: a teaching model of flight forces, the standard atmosphere and the
// pitot-static system (guide §9.1). Pure: no DOM, no timers, no randomness. Importable in Node;
// tests/engines/aero.test.mjs checks it against analytic answers.
//
// Units at the API boundary: SI (m, s, kg, N, Pa, K) except angles in degrees and the two
// altimeter pressures in hPa (the aviation convention). Outputs are unrounded.
//
// Simplifications (shown on stage):
// - Lift: thin-aerofoil slope, C_L = C_L0 + 2πα (α in radians) up to α_stall. Past the stall C_L
//   falls smoothly towards (1 − POST_STALL.drop)·C_Lmax. The post-stall shape is illustrative,
//   chosen to look like a typical stall; it is not data for any real wing.
// - Drag: parabolic polar, C_D = C_D0 + k·C_L², up to the stall. Past it C_D keeps its stall value
//   plus a separation term that grows linearly with α − α_stall (also illustrative).
// - No negative stall: the α range (−5° to 25°) stays clear of it for these settings.
// - Steady flight: forces balance along and across the flight path. Thrust acts along the flight path.
// - Pitot-static: incompressible Bernoulli, p_t = p_s + ½ρV². Above about Mach 0.3 this
//   underestimates p_t; the view says so.

const DEG = Math.PI / 180;

/**
 * International Standard Atmosphere constants.
 * Sources: ICAO Doc 7488/3, Manual of the ICAO Standard Atmosphere (3rd ed., 1993);
 * ISO 2533:1975 Standard Atmosphere; U.S. Standard Atmosphere, 1976 (NOAA-S/T 76-1562).
 * Altitudes are geopotential (below 11 km they differ from geometric height by under 0.2%).
 */
export const ISA = Object.freeze({
  T0: 288.15, // K, sea-level temperature (15 °C)
  P0: 101325, // Pa, sea-level pressure
  RHO0: 1.225, // kg/m³, sea-level density
  LAPSE: 0.0065, // K/m, troposphere temperature lapse rate
  R: 287.05287, // J/(kg·K), specific gas constant of dry air
  G0: 9.80665, // m/s², standard gravity (defines the ISA; independent of the g used for weight)
  GAMMA: 1.4, // ratio of specific heats of air
  H_TROPOPAUSE: 11000, // m, top of the troposphere
  H_MIN: -2000, // m, lowest altitude this model accepts (ISO 2533 tabulates from −2000 m)
  H_MAX: 20000, // m, top of the isothermal layer
});

/** Exponent g₀/(RL) ≈ 5.2559 in p = p₀(T/T₀)^(g₀/(RL)). */
export const ISA_EXPONENT = ISA.G0 / (ISA.R * ISA.LAPSE);
const T11 = ISA.T0 - ISA.LAPSE * ISA.H_TROPOPAUSE; // 216.65 K
const P11 = ISA.P0 * (T11 / ISA.T0) ** ISA_EXPONENT; // ≈ 22 632 Pa

/** Exact definitions: 1 ft = 0.3048 m; 1 knot = 1852 m per hour. */
export const FT = 0.3048;
export const KNOT = 1852 / 3600;

/** Post-stall shape (illustrative, see the header). */
export const POST_STALL = Object.freeze({
  drop: 0.4, // C_L levels off at (1 − drop)·C_Lmax
  width: 3, // degrees: C_L loses 63% of that drop in the first `width` degrees past the stall
  dragSlope: 1.5, // per radian: separation drag added past the stall
});

/** Within this many degrees of α_stall the view shows a stall warning (a display threshold). */
export const STALL_WARNING_DEG = 2;

/** Fixed speed range of the thrust-required graph (m/s); matches the airspeed slider. */
export const SPEED_MAX = 100;

/** α range of the C_L–α graph and the CSV sweep (degrees); matches the α slider. */
export const ALPHA_MIN = -5;
export const ALPHA_MAX = 25;

function requireFinite(name, v) {
  if (!Number.isFinite(v)) throw new RangeError(`${name} must be a finite number`);
}
function requirePositive(name, v) {
  if (!(Number.isFinite(v) && v > 0)) throw new RangeError(`${name} must be greater than zero`);
}

// ---------------------------------------------------------------- Standard atmosphere

/**
 * ISA state at geopotential altitude h (m), from −2000 m to 20 000 m.
 * Troposphere: T = T₀ − Lh, p = p₀(T/T₀)^(g₀/(RL)). Above 11 km: T = 216.65 K, p = p₁₁·e^(−g₀(h − 11 000)/(R T₁₁)).
 * @returns {{ T: number, p: number, rho: number, a: number }} K, Pa, kg/m³, m/s
 */
export function isa(h) {
  requireFinite('Altitude', h);
  if (h < ISA.H_MIN || h > ISA.H_MAX) throw new RangeError(`Altitude must be between ${ISA.H_MIN} m and ${ISA.H_MAX} m`);
  let T;
  let p;
  if (h <= ISA.H_TROPOPAUSE) {
    T = ISA.T0 - ISA.LAPSE * h;
    p = ISA.P0 * (T / ISA.T0) ** ISA_EXPONENT;
  } else {
    T = T11;
    p = P11 * Math.exp((-ISA.G0 * (h - ISA.H_TROPOPAUSE)) / (ISA.R * T11));
  }
  return { T, p, rho: p / (ISA.R * T), a: Math.sqrt(ISA.GAMMA * ISA.R * T) };
}

/**
 * Pressure altitude: the ISA altitude whose pressure is p (Pa). This inverts isa().
 * Troposphere: h = (T₀/L)[1 − (p/p₀)^(RL/g₀)]. Above 11 km: h = 11 000 + (R T₁₁/g₀) ln(p₁₁/p).
 */
export function pressureAltitude(p) {
  requirePositive('Pressure', p);
  if (p >= P11) return (ISA.T0 / ISA.LAPSE) * (1 - (p / ISA.P0) ** (1 / ISA_EXPONENT));
  return ISA.H_TROPOPAUSE + ((ISA.R * T11) / ISA.G0) * Math.log(P11 / p);
}

/**
 * What an altimeter shows: H(p_s) − H(setting), where H is the pressure altitude. This is the
 * standard altimeter-setting relation (the subscale shifts the reading by the pressure altitude of
 * the setting). With the setting equal to 1013.25 hPa it reads pressure altitude.
 * @param {number} staticPressure Pa
 * @param {number} settingHpa altimeter setting (QNH) in hPa
 */
export function altimeterReading(staticPressure, settingHpa) {
  return pressureAltitude(staticPressure) - pressureAltitude(settingHpa * 100);
}

/**
 * The day's atmosphere: the ISA shifted vertically so that the pressure at sea level is
 * `seaLevelPressureHpa`. This keeps the atmosphere hydrostatic (temperature shifts with it, by
 * up to 3.5 K across the 950–1050 hPa range) and is exactly the atmosphere in which an altimeter set
 * to that pressure reads true altitude.
 */
export function dayAtmosphere(h, seaLevelPressureHpa = ISA.P0 / 100) {
  const shift = pressureAltitude(seaLevelPressureHpa * 100);
  return { ...isa(h + shift), shift };
}

// ---------------------------------------------------------------- Lift and drag coefficients

/** C_Lmax = C_L0 + 2π·α_stall. */
export function clMax({ cl0, alphaStall }) {
  return cl0 + 2 * Math.PI * alphaStall * DEG;
}

/** C_L at angle of attack α (degrees). */
export function liftCoefficient(alpha, { cl0, alphaStall }) {
  if (alpha <= alphaStall) return cl0 + 2 * Math.PI * alpha * DEG;
  const x = (alpha - alphaStall) / POST_STALL.width;
  return clMax({ cl0, alphaStall }) * (1 - POST_STALL.drop * (1 - Math.exp(-x)));
}

/** C_D at angle of attack α (degrees). */
export function dragCoefficient(alpha, { cl0, alphaStall, cd0, k }) {
  if (alpha <= alphaStall) {
    const cl = liftCoefficient(alpha, { cl0, alphaStall });
    return cd0 + k * cl * cl;
  }
  const cm = clMax({ cl0, alphaStall });
  return cd0 + k * cm * cm + POST_STALL.dragSlope * (alpha - alphaStall) * DEG;
}

/** (L/D)max = 1/(2√(k·C_D0)) for the parabolic polar. */
export function maxLiftToDrag(cd0, k) {
  return 1 / (2 * Math.sqrt(k * cd0));
}

/** C_L at (L/D)max: √(C_D0/k) (induced drag equals zero-lift drag there). */
export function clForMaxLiftToDrag(cd0, k) {
  return Math.sqrt(cd0 / k);
}

/** Level-flight speed for a lift coefficient: V = √(2W/(ρ S C_L)). */
export function speedForCl({ weight, rho, wingArea, cl }) {
  return Math.sqrt((2 * weight) / (rho * wingArea * cl));
}

/** Stall speed in level flight: V_s = √(2W/(ρ S C_Lmax)). */
export function stallSpeed({ weight, rho, wingArea, clMax: cm }) {
  return speedForCl({ weight, rho, wingArea, cl: cm });
}

// ---------------------------------------------------------------- Flight forces

function checkAircraft(p) {
  requirePositive('Mass', p.mass);
  requirePositive('Wing area', p.wingArea);
  requirePositive('Airspeed', p.airspeed);
  requirePositive('g', p.g);
  requirePositive('Zero-lift drag coefficient', p.cd0);
  requirePositive('Induced drag factor', p.k);
  requireFinite('Flight path angle', p.gamma);
  requireFinite('Lift coefficient at zero α', p.cl0);
  requirePositive('Stall angle', p.alphaStall);
  if (clMax(p) <= 0) throw new RangeError('The maximum lift coefficient must be greater than zero');
}

/**
 * Forces on the aircraft for the flight-forces setup.
 * alphaMode 'trim': α is found so that L = W cos γ (steady flight). If even C_Lmax can't give
 *   that much lift at this speed, the wing is stalled: α is held at α_stall and L < W cos γ.
 * alphaMode 'manual': α is set by hand; L comes from the C_L–α curve and may not balance W cos γ.
 * In both modes T = D + W sin γ (the thrust that holds the airspeed along the path).
 * @param {{ alphaMode: 'trim'|'manual', alpha: number, airspeed: number, gamma: number, mass: number,
 *   wingArea: number, altitude: number, cl0: number, alphaStall: number, cd0: number, k: number, g: number }} p
 */
export function flightForces(p) {
  checkAircraft(p);
  const atm = isa(p.altitude ?? 0);
  const rho = atm.rho;
  const V = p.airspeed;
  const S = p.wingArea;
  const q = 0.5 * rho * V * V;
  const weight = p.mass * p.g;
  const g = p.gamma * DEG;
  const cosG = Math.cos(g);
  const sinG = Math.sin(g);
  const liftNeeded = weight * cosG;
  const cm = clMax(p);
  const clRequired = liftNeeded / (q * S);

  let alpha;
  let stalled;
  if (p.alphaMode === 'manual') {
    requireFinite('Angle of attack', p.alpha);
    alpha = p.alpha;
    stalled = alpha > p.alphaStall;
  } else if (clRequired <= cm * (1 + 1e-12)) {
    // (the tolerance keeps V = V_s itself unstalled despite rounding)
    alpha = (clRequired - p.cl0) / (2 * Math.PI) / DEG;
    // Rounding can put the trimmed angle a hair past α_stall exactly at V_s.
    if (alpha > p.alphaStall) alpha = p.alphaStall;
    stalled = false;
  } else {
    alpha = p.alphaStall;
    stalled = true;
  }

  const cl = liftCoefficient(alpha, p);
  const cd = dragCoefficient(alpha, p);
  const lift = q * S * cl;
  const drag = q * S * cd;
  const thrust = drag + weight * sinG;
  const vs = stallSpeed({ weight, rho, wingArea: S, clMax: cm });

  // Best L/D. The polar's optimum is 1/(2√(k·C_D0)) at C_L* = √(C_D0/k). Below C_L*, L/D rises with
  // C_L, and past the stall C_L falls while C_D rises, so if C_L* > C_Lmax the wing can't reach the
  // optimum: its best is at the stall (C_L = C_Lmax, V = V_s). Report what the wing can reach.
  const polarMaxLD = maxLiftToDrag(p.cd0, p.k);
  const clStar = clForMaxLiftToDrag(p.cd0, p.k);
  const beyondStall = clStar > cm;
  const clBest = beyondStall ? cm : clStar;
  const ldBest = beyondStall ? cm / (p.cd0 + p.k * cm * cm) : polarMaxLD;
  // Least thrust on this flight path: T = W cos γ/(L/D) + W sin γ, least where L/D is best, at
  // V = √(2W cos γ/(ρ S C_L)) with C_L = clBest (so never below the stall boundary V_s√cos γ).
  const minThrustSpeed = speedForCl({ weight: liftNeeded, rho, wingArea: S, cl: clBest });
  const minThrust = liftNeeded / ldBest + weight * sinG;

  return {
    alphaMode: p.alphaMode === 'manual' ? 'manual' : 'trim',
    density: rho,
    temperature: atm.T,
    dynamicPressure: q,
    weight,
    gamma: p.gamma,
    liftNeeded,
    clRequired,
    alpha,
    cl,
    cd,
    lift,
    drag,
    thrust,
    liftToDrag: cl / cd,
    liftSurplus: lift - liftNeeded,
    loadFactor: lift / weight,
    clMax: cm,
    stallSpeed: vs,
    stallSpeedOnPath: vs * Math.sqrt(cosG), // stall boundary for steady flight at this γ
    // Thrust for steady (trimmed) flight at this speed and γ, whatever alphaMode is; null below the stall boundary.
    trimThrust: clRequired <= cm * (1 + 1e-12) ? q * S * (p.cd0 + p.k * clRequired * clRequired) + weight * sinG : null,
    maxLiftToDrag: ldBest, // best reachable L/D (the polar's optimum unless that lies past the stall)
    clAtMaxLD: clBest,
    polarMaxLiftToDrag: polarMaxLD, // 1/(2√(k·C_D0)), reachable only if C_L* ≤ C_Lmax
    polarClAtMaxLD: clStar,
    maxLDBeyondStall: beyondStall,
    minDragSpeed: speedForCl({ weight, rho, wingArea: S, cl: clBest }), // level flight; V_s when beyondStall
    minThrustSpeed,
    minThrust,
    bestGlideAngle: Math.atan(1 / ldBest) / DEG,
    stalled,
    nearStall: !stalled && alpha >= p.alphaStall - STALL_WARNING_DEG,
  };
}

/**
 * C_L, C_D, L/D, L and D (at the current airspeed and density) for α from ALPHA_MIN to ALPHA_MAX.
 * @returns {number[][]} rows of [α (°), C_L, C_D, L/D, L (N), D (N)]
 */
export function alphaSweep(p, step = 0.5) {
  checkAircraft(p);
  const qS = 0.5 * isa(p.altitude ?? 0).rho * p.airspeed * p.airspeed * p.wingArea;
  const rows = [];
  const n = Math.round((ALPHA_MAX - ALPHA_MIN) / step);
  for (let i = 0; i <= n; i++) {
    const a = Number((ALPHA_MIN + i * step).toFixed(9));
    const cl = liftCoefficient(a, p);
    const cd = dragCoefficient(a, p);
    rows.push([a, cl, cd, cl / cd, qS * cl, qS * cd]);
  }
  return rows;
}

/**
 * Thrust needed for steady flight at flight path angle γ, from the stall boundary V_s√(cos γ)
 * up to SPEED_MAX, on a grid of `step` m/s.
 * @returns {number[][]} rows of [V (m/s), T (N), D (N), parasite drag (N), induced drag (N)]
 */
export function speedSweep(p, step = 1) {
  checkAircraft(p);
  const rho = isa(p.altitude ?? 0).rho;
  const weight = p.mass * p.g;
  const g = p.gamma * DEG;
  const liftNeeded = weight * Math.cos(g);
  const vMin = stallSpeed({ weight: liftNeeded, rho, wingArea: p.wingArea, clMax: clMax(p) });
  const rows = [];
  const start = Math.ceil(vMin / step - 1e-9);
  const end = Math.floor(SPEED_MAX / step + 1e-9);
  for (let i = start; i <= end; i++) {
    const V = Number((i * step).toFixed(9));
    const qS = 0.5 * rho * V * V * p.wingArea;
    const cl = liftNeeded / qS;
    const parasite = qS * p.cd0;
    const induced = qS * p.k * cl * cl;
    const drag = parasite + induced;
    rows.push([V, drag + weight * Math.sin(g), drag, parasite, induced]);
  }
  return rows;
}

// ---------------------------------------------------------------- Pitot-static and altimeter

/**
 * Pitot-static system for an aircraft at true altitude h flying at true airspeed V.
 * The probe senses p_s (static ports) and p_t = p_s + ½ρV² (incompressible). The instruments
 * then work backwards from those pressures alone:
 *   V = √(2(p_t − p_s)/ρ) with the local density (true airspeed),
 *   V_i = √(2(p_t − p_s)/ρ₀) with sea-level density (what an airspeed indicator shows),
 *   altitude = H(p_s) − H(QNH) (the altimeter).
 * @param {{ altitude: number, airspeed: number, seaLevelPressure?: number, altimeterSetting?: number }} p
 *   seaLevelPressure and altimeterSetting in hPa (default 1013.25)
 */
export function pitotStatic(p) {
  requireFinite('Altitude', p.altitude);
  requireFinite('Airspeed', p.airspeed);
  if (p.airspeed < 0) throw new RangeError('Airspeed must not be negative');
  const slp = p.seaLevelPressure ?? ISA.P0 / 100;
  const setting = p.altimeterSetting ?? ISA.P0 / 100;
  requirePositive('Sea-level pressure', slp);
  requirePositive('Altimeter setting', setting);

  const atm = dayAtmosphere(p.altitude, slp);
  const ps = atm.p;
  const rho = atm.rho;
  const V = p.airspeed;
  const pt = ps + 0.5 * rho * V * V;
  const dp = pt - ps;
  const indicatedAltitude = altimeterReading(ps, setting);
  return {
    altitude: p.altitude,
    airspeed: V,
    staticPressure: ps,
    totalPressure: pt,
    pressureDifference: dp,
    density: rho,
    temperature: atm.T,
    speedOfSound: atm.a,
    mach: V / atm.a,
    trueAirspeed: Math.sqrt((2 * dp) / rho),
    indicatedAirspeed: Math.sqrt((2 * dp) / ISA.RHO0),
    pressureAltitude: pressureAltitude(ps),
    indicatedAltitude,
    altimeterError: indicatedAltitude - p.altitude,
    seaLevelPressure: slp,
    altimeterSetting: setting,
    atmosphereShift: atm.shift,
  };
}

/**
 * ISA table every `step` m from 0 to 11 000 m, with the pitot pressure difference and indicated
 * airspeed at the current true airspeed.
 * @returns {number[][]} rows of [h (m), T (K), p (Pa), ρ (kg/m³), Δp (Pa), V_i (m/s)]
 */
export function isaTable(p, step = 500) {
  const rows = [];
  for (let h = 0; h <= ISA.H_TROPOPAUSE + 1e-9; h += step) {
    const s = isa(h);
    const dp = 0.5 * s.rho * p.airspeed * p.airspeed;
    rows.push([h, s.T, s.p, s.rho, dp, Math.sqrt((2 * dp) / ISA.RHO0)]);
  }
  return rows;
}
