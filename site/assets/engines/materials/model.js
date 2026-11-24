// materials engine model (guide §9.1): pure maths, no DOM, no timers, no randomness.
// Importable in Node: tests/engines/materials.test.mjs checks it against analytic answers.
//
// Units inside the model: lengths in mm, forces in N, stresses in MPa (so N = MPa × mm²),
// strain dimensionless, energy per volume in MJ/m³ (= MPa × strain). Data rows (data.js) give E in GPa.
//
// Setups:
//   tensile      a teaching stress–strain model driven by a constant-speed machine (time-based)
//   selection    strength vs density, constant σ/ρ guidelines, tie-rod mass calculator (static)
//   hardness     Brinell and Vickers formulas, Rockwell depth definition (static)
//   fatigue-ndt  schematic S–N curves, Paris-law crack growth schematic, NDT methods (time-based)

import { MATERIALS } from './data.js';

export { MATERIALS };

export const DT = 1 / 120; // s, fixed simulation step
export const SUBSTEPS = 8; // data points the tensile machine logs per step
export const KGF = 9.80665; // N per kgf (standard gravity, exact by definition)
export const PROOF_OFFSET = 0.002; // 0.2% offset for the proof stress

// Shape constants of the teaching curve. None of these is material data: they only shape the curve
// between the sourced points (E, proof stress, UTS, elongation), and the view labels them as a model.
const RO_EXPONENT = 15; // Ramberg–Osgood exponent for the elastic–plastic knee
const LUDERS_STRAIN = 0.015; // yield plateau length for hot-rolled low-carbon steel (schematic)
const UNIFORM_CAP = 0.75; // uniform strain at UTS is at most 75% of the elongation
const H_Q = 0.5; // hardening shape exponent (0 < q < 1 gives a smooth, flat-topped peak at UTS)
const PLATEAU_START_SLOPE = 0.1; // hardening shape after a yield plateau
const POLY_K = 4; // polymer pre-yield shape exponent
const POLY_DROP = 0.15; // polymer: stress drop from the yield point to the drawing stress (schematic)
const POLY_DROP_SPAN = 0.4; // polymer: strain over which the neck forms, × strain at yield
const NECK_DEPTH = 0.45; // ductile metals: extra width loss at the neck at fracture (schematic)
const POLY_NECK = 0.6; // polymer: width ratio of the drawn neck (schematic)

const BY_ID = new Map(MATERIALS.map((m) => [m.id, m]));

/** A data row by id, or null. */
export function materialById(id) {
  return BY_ID.get(id) ?? null;
}

/** A data-row-shaped material from the custom params. */
export function customMaterial(p) {
  const brittle = p.customBehaviour === 'brittle';
  const uts = p.customUts;
  return {
    id: 'custom',
    name: 'Custom material',
    grade: 'values you entered',
    label: 'Custom',
    family: 'metal',
    behaviour: brittle ? 'brittle' : 'ductile',
    E: p.customE,
    yield: brittle ? null : Math.min(p.customYield, uts),
    uts,
    elongation: brittle ? null : p.customElongation,
    density: null,
    basis: 'typical',
    source: 'Values entered on the page',
    cite: 'your values',
    custom: true,
  };
}

/** The material a set of tensile params describes. */
export function resolveMaterial(params) {
  if (params.material === 'custom') return customMaterial(params);
  return materialById(params.material) ?? MATERIALS[0];
}

// ---------------------------------------------------------------- geometry and conversions

/** Cross-section area (mm²) of a round (diameter) or rectangular (width × thickness) specimen. */
export function sectionArea({ section = 'round', diameter = 10, width = 12.5, thickness = 3 }) {
  return section === 'rect' ? width * thickness : (Math.PI * diameter * diameter) / 4;
}

/** σ = F/A: N and mm² → MPa. */
export function stressFromLoad(load, area) {
  return load / area;
}

/** F = σA: MPa and mm² → N. */
export function loadFromStress(stress, area) {
  return stress * area;
}

/** ε = δ/L₀. */
export function strainFromExtension(extension, gaugeLength) {
  return extension / gaugeLength;
}

/** δ = εL₀. */
export function extensionFromStrain(strain, gaugeLength) {
  return strain * gaugeLength;
}

// ---------------------------------------------------------------- the teaching tensile curve

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Bisection for an increasing function f on [lo, hi]: the x with f(x) = target. */
function invert(f, target, lo, hi) {
  let a = lo;
  let b = hi;
  for (let i = 0; i < 64; i++) {
    const m = 0.5 * (a + b);
    if (f(m) < target) a = m;
    else b = m;
    if (b - a <= 1e-15 * Math.max(1, Math.abs(b))) break;
  }
  return 0.5 * (a + b);
}

/**
 * Hollomon exponent n from σu/σy. With σ = Kεⁿ (true stress, plastic strain), σy ≈ K(0.002)ⁿ and,
 * by Considère, the engineering peak is σu = K nⁿ e⁻ⁿ at true strain n, so σu/σy = (n / 0.002e)ⁿ.
 */
export function hollomonN(ratio) {
  const target = Math.log(Math.max(1, ratio));
  const f = (n) => n * Math.log(n / (PROOF_OFFSET * Math.E)) - target;
  let a = PROOF_OFFSET;
  let b = 1;
  if (f(b) < 0) return b;
  for (let i = 0; i < 100; i++) {
    const m = 0.5 * (a + b);
    if (f(m) < 0) a = m;
    else b = m;
  }
  return 0.5 * (a + b);
}

// Hardening shape h(u) on [0, 1]: h(0) = 0, h(1) = 1, h′(0) = q − c, h′(1) = ∞ (flat peak at UTS).
const hShape = (u, c) => 1 - Math.pow(1 - u, H_Q) * (1 + c * u);
// Polymer pre-yield shape: f(0) = 0, f(1) = 1, starts with zero plastic strain, flat at the yield point.
const polyShape = (u) => Math.pow(1 - Math.pow(1 - u, 0.5), POLY_K);
const smoothstep = (x) => x * x * (3 - 2 * x);

/**
 * Build the engineering stress–strain curve for a material.
 * Ductile: linear elastic → (yield plateau) → smooth hardening to UTS → necking → fracture.
 * Brittle: linear to fracture. Polymer: rise to a yield point, neck forms, cold drawing, fracture.
 * Fracture happens at total strain eb = elongation + σf/E, so the permanent elongation after the
 * elastic part recovers equals the data value.
 */
export function tensileCurve(m) {
  const E = m.E * 1000; // MPa
  const su = m.uts;
  if (m.behaviour === 'brittle') {
    const eb = su / E;
    return { kind: 'brittle', E, su, sy: null, sf: su, eu: eb, eb, fitMax: 0.4 * su };
  }
  if (m.behaviour === 'polymer') {
    const sy = m.yield;
    const ey = m.yieldStrain / 100;
    const py = Math.max(ey - sy / E, 1e-9);
    const sd = sy * (1 - POLY_DROP);
    const eb = m.elongation / 100 + sd / E;
    const ed = ey + Math.min(POLY_DROP_SPAN * ey, 0.5 * (eb - ey));
    return { kind: 'polymer', E, su: sy, sy, ey, py, sd, sf: sd, eu: ey, ed, eb, fitMax: 0.25 * sy };
  }
  // Ductile
  const sy = Math.min(m.yield, su);
  const A = m.elongation / 100;
  const n = hollomonN(su / sy);
  const plateau = m.yieldPlateau ? LUDERS_STRAIN : 0;
  const pStart = plateau || PROOF_OFFSET;
  let pu = Math.exp(n) - 1 - su / E;
  pu = Math.min(pu, UNIFORM_CAP * A);
  pu = Math.max(pu, pStart + 0.002);
  const eu = su / E + pu;
  const sf = su * (1 - clamp(1.5 * (A - pu), 0.05, 0.35));
  const eb = Math.max(A + sf / E, eu + 1e-6);
  const flat = su - sy <= 1e-9 * su;

  // Hardening segment: plastic strain p = pStart + (pu − pStart)·h(u), u = (σ − σy)/(σu − σy).
  // Without a plateau, its start slope matches the Ramberg–Osgood knee (dp/dσ = 0.002 m/σy).
  let ro = RO_EXPONENT;
  let s0 = PLATEAU_START_SLOPE;
  if (!plateau && !flat) {
    const scale = (su - sy) / (sy * (pu - PROOF_OFFSET));
    s0 = PROOF_OFFSET * ro * scale;
    if (s0 > 1.2) {
      ro = Math.max(2, 1.2 / (PROOF_OFFSET * scale));
      s0 = Math.min(1.2, PROOF_OFFSET * ro * scale);
    }
  }
  return { kind: 'ductile', E, sy, su, n, plateau, pStart, pu, eu, sf, eb, ro, c: H_Q - s0, flat, fitMax: 0.4 * sy };
}

/** Engineering stress (MPa) at total engineering strain e, up to fracture. */
export function stressAt(c, e) {
  if (!(e > 0)) return 0;
  if (e >= c.eb) return c.sf;
  if (c.kind === 'brittle') return c.E * e;
  if (c.kind === 'polymer') {
    if (e <= c.ey) return invert((s) => s / c.E + c.py * polyShape(s / c.sy), e, 0, c.sy);
    if (e <= c.ed) return c.sy - (c.sy - c.sd) * smoothstep((e - c.ey) / (c.ed - c.ey));
    return c.sd;
  }
  // Ductile
  if (e >= c.eu) {
    const x = (e - c.eu) / (c.eb - c.eu);
    return c.su - (c.su - c.sf) * x * x;
  }
  const hardening = (s) => s / c.E + c.pStart + (c.pu - c.pStart) * hShape((s - c.sy) / (c.su - c.sy), c.c);
  if (c.plateau) {
    const ey = c.sy / c.E;
    if (e <= ey) return c.E * e;
    if (e <= ey + c.plateau) return c.sy;
    return c.flat ? c.su : invert(hardening, e, c.sy, c.su);
  }
  if (e <= c.sy / c.E + PROOF_OFFSET) return invert((s) => s / c.E + PROOF_OFFSET * Math.pow(s / c.sy, c.ro), e, 0, c.sy);
  return c.flat ? c.su : invert(hardening, e, c.sy, c.su);
}

/** Phase of the test at strain e, for labels. */
export function curvePhase(c, e) {
  if (e >= c.eb) return 'fractured';
  if (c.kind === 'brittle') return 'elastic';
  if (c.kind === 'polymer') return e < c.ey * 0.5 ? 'elastic' : e <= c.ey ? 'yielding' : e <= c.ed ? 'necking' : 'drawing';
  if (e >= c.eu) return 'necking';
  if (e <= (c.sy / c.E) * 0.9) return 'elastic';
  if (c.plateau && e <= c.sy / c.E + c.plateau) return 'yielding';
  return 'hardening';
}

/**
 * Shape of the specimen's gauge section at strain e (all dimensions relative to the start).
 * width: uniform width ratio (constant volume: d/d₀ = 1/√(1 + plastic strain)); neck: 0 → 1 as the neck
 * develops; neckDepth: extra width loss at the neck centre (schematic); drawn: polymer necked length fraction.
 */
export function specimenShape(c, e) {
  const broken = e >= c.eb;
  const eC = Math.min(Math.max(e, 0), c.eb);
  if (c.kind === 'brittle') return { stretch: 1 + eC, width: 1, neck: 0, neckDepth: 0, drawn: 0, broken };
  if (c.kind === 'polymer') {
    const eUni = Math.min(eC, c.ey);
    const p = Math.max(0, eUni - stressAt(c, eUni) / c.E);
    const width = 1 / Math.sqrt(1 + p);
    const neck = eC > c.ey ? clamp((eC - c.ey) / (c.ed - c.ey), 0, 1) : 0;
    const drawn = eC > c.ed ? clamp((eC - c.ed) / (c.eb - c.ed), 0, 1) : 0;
    return { stretch: 1 + eC, width, neck, neckDepth: (1 - POLY_NECK) * neck, drawn, broken };
  }
  const eUni = Math.min(eC, c.eu);
  const p = Math.max(0, eUni - stressAt(c, eUni) / c.E);
  const width = 1 / Math.sqrt(1 + p);
  const neck = eC > c.eu ? clamp((eC - c.eu) / (c.eb - c.eu), 0, 1) : 0;
  return { stretch: 1 + eC, width, neck, neckDepth: NECK_DEPTH * neck, drawn: 0, broken };
}

// ---------------------------------------------------------------- measuring a test (like the machine's software)

/** Area under y(x) by the trapezoid rule over the first `count` points. */
export function trapezoidArea(xs, ys, count = xs.length) {
  let area = 0;
  for (let i = 1; i < count; i++) area += 0.5 * (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1]);
  return area;
}

/** Linear interpolation of y at x in increasing xs (first `count` points); null if out of range. */
function interpAt(xs, ys, count, x) {
  if (count < 2 || x > xs[count - 1]) return null;
  let i = 1;
  while (i < count && xs[i] < x) i++;
  const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1);
  return ys[i - 1] + t * (ys[i] - ys[i - 1]);
}

/**
 * Measure E, proof (or yield-point) stress, UTS and toughness from logged points, as test software does.
 * Metals and brittle materials: E by least squares over σ ≤ fitMax. Polymers: ISO 527-1 chord modulus
 * between strains 0.05% and 0.25%. Proof stress: the 0.2% offset line. Polymers: the yield point (first peak).
 * @param {ArrayLike<number>} strains
 * @param {ArrayLike<number>} stresses MPa
 * @param {number} count number of valid points (starting at the origin)
 */
export function measureTest(strains, stresses, count, c) {
  const out = { modulus: null, yieldStrength: null, uts: null, toughness: 0, utsIndex: 0 };
  if (count < 2) return out;
  let max = -Infinity;
  for (let i = 0; i < count; i++) {
    if (stresses[i] > max) {
      max = stresses[i];
      out.utsIndex = i;
    }
  }
  out.uts = max;
  out.toughness = trapezoidArea(strains, stresses, count);

  let E = null;
  if (c.kind === 'polymer') {
    const s1 = interpAt(strains, stresses, count, 0.0005);
    const s2 = interpAt(strains, stresses, count, 0.0025);
    if (s1 !== null && s2 !== null) E = (s2 - s1) / 0.002;
  } else {
    let n = 0;
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let sxy = 0;
    for (let i = 0; i < count && stresses[i] <= c.fitMax; i++) {
      n += 1;
      sx += strains[i];
      sy += stresses[i];
      sxx += strains[i] * strains[i];
      sxy += strains[i] * stresses[i];
    }
    const den = n * sxx - sx * sx;
    if (n >= 3 && den > 0) E = (n * sxy - sx * sy) / den;
  }
  out.modulus = E;
  if (E === null) return out;

  if (c.kind === 'polymer') {
    // Yield point: the first peak, once the stress has clearly fallen after it.
    if (stresses[count - 1] < max * 0.995) out.yieldStrength = max;
  } else {
    for (let i = 1; i < count; i++) {
      if (strains[i] <= PROOF_OFFSET) continue;
      const g1 = stresses[i] - E * (strains[i] - PROOF_OFFSET);
      if (g1 <= 0) {
        const g0 = stresses[i - 1] - E * (strains[i - 1] - PROOF_OFFSET);
        const t = g0 / (g0 - g1);
        out.yieldStrength = stresses[i - 1] + t * (stresses[i] - stresses[i - 1]);
        break;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- the tensile test run (time-based)

/**
 * A tensile test: the crosshead moves at a constant speed chosen so the specimen breaks exactly at
 * t = runTime (a time-lapse, so every material takes the same time). Deterministic; advances in whole steps.
 * @param {{ material: string, gaugeLength: number, section: 'round'|'rect', diameter?: number, width?: number,
 *   thickness?: number, runTime: number }} params
 */
export function createTensileRun(params) {
  const material = resolveMaterial(params);
  const curve = tensileCurve(material);
  const area = sectionArea(params);
  const L0 = params.gaugeLength;
  const totalSteps = Math.max(1, Math.round(params.runTime / DT));
  const N = totalSteps * SUBSTEPS;
  const strains = new Float64Array(N + 1);
  const stresses = new Float64Array(N + 1);
  let n = 0;
  let count = 1;
  let cached = null;

  const strainAt = (k) => (k >= N ? curve.eb : (curve.eb * k) / N);

  const run = {
    material,
    curve,
    area,
    gaugeLength: L0,
    totalSteps,
    get n() {
      return n;
    },
    get count() {
      return count;
    },
    strains,
    stresses,
    /** Advance up to `steps` fixed steps, stopping at fracture. */
    advance(steps = 1) {
      const target = Math.min(totalSteps, n + Math.max(0, Math.floor(steps)));
      while (n < target) {
        n += 1;
        for (let k = (n - 1) * SUBSTEPS + 1; k <= n * SUBSTEPS; k++) {
          strains[k] = strainAt(k);
          stresses[k] = stressAt(curve, strains[k]);
        }
        count = n * SUBSTEPS + 1;
      }
      cached = null;
      return run;
    },
    isComplete: () => n >= totalSteps,
    strain: () => strains[count - 1],
    stress: () => stresses[count - 1],
    measure() {
      if (!cached) cached = measureTest(strains, stresses, count, curve);
      return cached;
    },
    /** Outputs: stress MPa, strain %, load kN, extension mm, E GPa, toughness MJ/m³, elongation %. */
    outputs() {
      const m = run.measure();
      const e = strains[count - 1];
      const s = stresses[count - 1];
      const done = run.isComplete();
      let elongation = null;
      if (done && m.modulus) {
        elongation = Math.max(0, e - s / m.modulus) * 100;
        if (elongation < 1e-9) elongation = 0;
      }
      return {
        t: n * DT,
        stress: s,
        strain: e * 100,
        load: loadFromStress(s, area) / 1000,
        extension: extensionFromStrain(e, L0),
        area,
        modulus: m.modulus === null ? null : m.modulus / 1000,
        yieldStrength: m.yieldStrength,
        uts: count > 1 ? m.uts : null,
        maxLoad: count > 1 ? loadFromStress(m.uts, area) / 1000 : null,
        elongation,
        fractureStrain: done ? e * 100 : null,
        toughness: m.toughness,
      };
    },
    /** CSV rows, one per step from t = 0: [t (s), extension (mm), load (kN), strain (%), stress (MPa)]. */
    samples() {
      const rows = [];
      for (let i = 0; i <= n; i++) {
        const k = i * SUBSTEPS;
        const e = strains[k];
        const s = stresses[k];
        rows.push([Number((i * DT).toFixed(9)), extensionFromStrain(e, L0), loadFromStress(s, area) / 1000, e * 100, s]);
      }
      return rows;
    },
  };
  return run;
}

// ---------------------------------------------------------------- selection

/** The strength to plot: yield (0.2% proof) or UTS. Brittle materials have only a fracture strength. */
export function strengthOf(m, basis) {
  if (m.behaviour === 'brittle' || m.yield === null || m.yield === undefined) return { value: m.uts, kind: 'fracture' };
  if (basis === 'uts') return { value: m.uts, kind: 'uts' };
  return { value: m.yield, kind: 'yield' };
}

/** Specific strength σ/ρ in kN·m/kg (MPa and kg/m³ in). */
export function specificStrength(strength, density) {
  return (strength * 1e3) / density;
}

/** Strength (MPa) on the constant σ/ρ line through specific strength k (kN·m/kg) at density ρ. */
export function ratioLineStrength(k, density) {
  return (k * density) / 1e3;
}

/**
 * Mass (kg) of a tie rod carrying an axial load: A = nF/σ, m = ρAL = ρ L n F / σ.
 * @param {{ load: number, length: number, strength: number, density: number, factorOfSafety?: number }} p
 *   load kN, length m, strength MPa, density kg/m³
 */
export function tieMass({ load, length, strength, density, factorOfSafety = 1 }) {
  return (density * length * load * 1e3 * factorOfSafety) / (strength * 1e6);
}

/** Tie-rod cross-section area (mm²) for the same design: A = nF/σ. */
export function tieArea({ load, strength, factorOfSafety = 1 }) {
  return (load * 1e3 * factorOfSafety) / strength;
}

/** One row per material for the chart and the CSV. */
export function selectionRows(basis) {
  return MATERIALS.filter((m) => Number.isFinite(m.density)).map((m) => {
    const { value, kind } = strengthOf(m, basis);
    return {
      id: m.id,
      label: m.label,
      grade: m.grade,
      family: m.family,
      behaviour: m.behaviour,
      density: m.density,
      strength: value,
      kind,
      specific: specificStrength(value, m.density),
      basis: m.basis,
      source: m.source,
    };
  });
}

// ---------------------------------------------------------------- hardness

/** Brinell: HB = 2F / (πD(D − √(D² − d²))), F in kgf, D and d in mm. */
export function brinellHardness(F, D, d) {
  return (2 * F) / (Math.PI * D * (D - Math.sqrt(D * D - d * d)));
}

/** Indentation diameter (mm) that gives hardness HB with load F (kgf) and ball D (mm). */
export function brinellDiameter(HB, F, D) {
  const k = (2 * F) / (Math.PI * D * HB);
  return Math.sqrt(D * D - (D - k) * (D - k));
}

/** Depth (mm) of a spherical-cap Brinell impression: h = (D − √(D² − d²))/2. */
export function brinellDepth(D, d) {
  return (D - Math.sqrt(D * D - d * d)) / 2;
}

/** Brinell test validity: the impression should be between 0.24D and 0.6D across. */
export function brinellCheck(D, d) {
  const low = 0.24 * D;
  const high = 0.6 * D;
  return { ok: d >= low && d <= high, low, high };
}

/** Vickers: HV = 1.8544 F / d², F in kgf, d (mean diagonal) in mm. 1.8544 = 2 sin 68°. */
export function vickersHardness(F, d) {
  return (1.8544 * F) / (d * d);
}

/** Mean diagonal (mm) that gives hardness HV with load F (kgf). */
export function vickersDiagonal(HV, F) {
  return Math.sqrt((1.8544 * F) / HV);
}

/** Depth (mm) of a Vickers impression: faces at 68° to the axis, h = d / (2√2 tan 68°) ≈ d/7. */
export function vickersDepth(d) {
  return d / (2 * Math.SQRT2 * Math.tan((68 * Math.PI) / 180));
}

/** Rockwell scales (ISO 6508 / ASTM E18): HR = N − h/0.002 mm, h = permanent depth increase. */
export const ROCKWELL_SCALES = {
  C: { name: 'HRC', indenter: 'Diamond cone, 120°', minorLoad: 10, totalLoad: 150, N: 100, unit: 0.002, use: 'hardened steels' },
  B: { name: 'HRB', indenter: 'Ball, 1.5875 mm (1/16 in)', minorLoad: 10, totalLoad: 100, N: 130, unit: 0.002, use: 'softer steels, copper and aluminium alloys' },
};

export function rockwellHardness(scale, h) {
  const s = ROCKWELL_SCALES[scale] ?? ROCKWELL_SCALES.C;
  return s.N - h / s.unit;
}

export function rockwellDepth(scale, HR) {
  const s = ROCKWELL_SCALES[scale] ?? ROCKWELL_SCALES.C;
  return (s.N - HR) * s.unit;
}

// ---------------------------------------------------------------- fatigue (schematic) and NDT

/**
 * Schematic crack length after a fraction φ of the fatigue life, from the Paris law da/dN = C(ΔK)^m with
 * ΔK ∝ √a and m = 3: a = a₀ / (1 − N/N*)², with N* chosen so that a reaches the critical length aᶜ at φ = 1.
 */
export function crackLength(phi, { a0 = 1, ac = 20 } = {}) {
  const f = clamp(phi, 0, 1);
  return a0 / Math.pow(1 - f * (1 - Math.sqrt(a0 / ac)), 2);
}

/** Stage of fatigue failure for a life fraction (schematic boundaries). */
export function crackStage(phi) {
  if (phi >= 1) return 'fracture';
  return phi < 0.1 ? 'initiation' : 'growth';
}

/**
 * Schematic S–N curves, as stress amplitude / UTS against log₁₀ N.
 * Steel: falls from 0.9 at 10³ to 0.5 at 10⁶ cycles, then flat (endurance limit, the common rule of
 * thumb Se ≈ 0.5 Sut). Aluminium: keeps falling, no endurance limit. Shape only; not data for any alloy.
 */
export function snSchematic(kind, logN) {
  const x = Math.max(3, logN);
  if (kind === 'steel') {
    if (x >= 6) return 0.5;
    return 0.9 * Math.pow(0.5 / 0.9, (x - 3) / 3);
  }
  return 0.75 * Math.pow(10, -0.07 * (x - 3));
}

export const NDT_METHODS = [
  {
    id: 'visual',
    name: 'Visual inspection',
    short: 'Visual',
    how: 'Look closely, with good light, a magnifier or a borescope.',
    finds: 'Surface damage you can see: cracks, corrosion, dents, loose fasteners.',
    suits: 'Any material.',
    limits: 'Only what reaches the surface and is big enough to see.',
  },
  {
    id: 'dye',
    name: 'Dye penetrant',
    short: 'Dye penetrant',
    how: 'Clean, apply coloured dye, wipe off, then a white developer draws dye out of cracks.',
    finds: 'Cracks and pores that break the surface.',
    suits: 'Non-porous materials: most metals, ceramics, glass.',
    limits: 'Misses flaws below the surface; porous surfaces soak up dye.',
  },
  {
    id: 'magnetic',
    name: 'Magnetic particle',
    short: 'Magnetic particle',
    how: 'Magnetise the part; iron particles gather where a crack makes the field leak out.',
    finds: 'Surface and shallow subsurface cracks.',
    suits: 'Ferromagnetic metals only: carbon and low-alloy steels, cast iron.',
    limits: 'No good on aluminium, titanium, copper or composites.',
  },
  {
    id: 'ultrasonic',
    name: 'Ultrasonic testing',
    short: 'Ultrasonic',
    how: 'A probe sends high-frequency sound in; echoes from flaws return early.',
    finds: 'Internal cracks, voids, delaminations; wall thickness.',
    suits: 'Metals and composites (the main check for CFRP delamination).',
    limits: 'Needs a couplant and a trained operator; rough or complex shapes are harder.',
  },
  {
    id: 'xray',
    name: 'X-ray radiography',
    short: 'X-ray',
    how: 'X-rays pass through the part onto a detector; thinner or missing material shows darker.',
    finds: 'Internal voids, porosity and inclusions; cracks lying along the beam.',
    suits: 'Most materials; dense or thick parts need more energy.',
    limits: 'Radiation safety; can miss thin cracks and delaminations lying across the beam.',
  },
];

export const NDT_FLAWS = [
  { id: 'surface-crack', name: 'Surface crack' },
  { id: 'subsurface-crack', name: 'Crack just below the surface' },
  { id: 'internal-void', name: 'Internal void (porosity)' },
  { id: 'delamination', name: 'Delamination between layers' },
];

export const NDT_MATERIALS = [
  { id: 'steel', name: 'Steel (ferromagnetic)' },
  { id: 'aluminium', name: 'Aluminium alloy' },
  { id: 'cfrp', name: 'Carbon fibre composite' },
];

/**
 * Can a method find a flaw in a material? level: 'yes' | 'partial' | 'no', with a reason.
 * General NDT practice, simplified for teaching.
 */
export function ndtResult(method, flaw, material) {
  const r = (level, reason) => ({ level, reason });
  if (method === 'magnetic' && material !== 'steel') return r('no', 'Magnetic particle testing needs a ferromagnetic part.');
  switch (method) {
    case 'visual':
      if (flaw === 'surface-crack') return r('partial', 'Seen only if the crack is open and big enough; small cracks hide.');
      if (flaw === 'delamination') return r('partial', 'Only if the layers have bulged or split at an edge.');
      return r('no', 'The flaw is hidden inside; nothing shows at the surface.');
    case 'dye':
      if (material === 'cfrp') return r('no', 'Penetrant can soak into composite edges and contaminate repairs; not normally used.');
      if (flaw === 'surface-crack') return r('yes', 'Dye seeps into the open crack and bleeds out into the developer.');
      return r('no', 'The flaw does not break the surface, so no dye can get in.');
    case 'magnetic':
      if (flaw === 'surface-crack') return r('yes', 'The crack makes the magnetic field leak; particles gather along it.');
      if (flaw === 'subsurface-crack') return r('yes', 'A shallow crack still distorts the field enough to show.');
      if (flaw === 'internal-void') return r('partial', 'Only if the void is near the surface; deep flaws barely change the field.');
      return r('no', 'Steel plate laminations lie parallel to the field and rarely show.');
    case 'ultrasonic':
      if (flaw === 'surface-crack') return r('partial', 'An angled probe finds it, but very near-surface flaws sit in the dead zone of a straight probe.');
      if (flaw === 'delamination') return r('yes', 'Sound reflects strongly off the gap between layers.');
      return r('yes', 'The flaw reflects sound back as an early echo.');
    case 'xray':
      if (flaw === 'internal-void') return r('yes', 'Missing material lets more X-rays through: a dark spot.');
      if (flaw === 'delamination') return r('no', 'A thin gap across the beam removes almost no material.');
      return r('partial', 'Shows only if the crack lies along the beam.');
    default:
      return r('no', 'Unknown method.');
  }
}

/** A fatigue run: the life fraction rises at a steady rate from 0 to 1 over runTime (a time-lapse). */
export function createFatigueRun({ runTime = 10, a0 = 1, ac = 20 } = {}) {
  const totalSteps = Math.max(1, Math.round(runTime / DT));
  let n = 0;
  const run = {
    totalSteps,
    a0,
    ac,
    get n() {
      return n;
    },
    advance(steps = 1) {
      n = Math.min(totalSteps, n + Math.max(0, Math.floor(steps)));
      return run;
    },
    isComplete: () => n >= totalSteps,
    life: () => (n >= totalSteps ? 1 : n / totalSteps),
    outputs() {
      const phi = run.life();
      return { t: n * DT, lifeUsed: phi * 100, crackRatio: crackLength(phi, { a0, ac }) / ac };
    },
    /** CSV rows: [life used (%), crack length / critical length] every 1% of life. */
    samples() {
      const rows = [];
      const upTo = Math.floor(run.life() * 100 + 1e-9);
      for (let i = 0; i <= upTo; i++) rows.push([i, crackLength(i / 100, { a0, ac }) / ac]);
      return rows;
    },
  };
  return run;
}
