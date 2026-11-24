// aero engine tests: analytic answers for the guide §9.1 row, the stall model, and the
// pitot-static and altimeter formulas. Every expected number comes from a formula or a hand
// calculation written next to it, never from running the code and pasting the result.
//
// ISA reference values: ICAO Doc 7488/3 (Manual of the ICAO Standard Atmosphere, 1993),
// ISO 2533:1975 and the U.S. Standard Atmosphere, 1976. Altitudes are geopotential.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ISA,
  isa,
  pressureAltitude,
  altimeterReading,
  clMax,
  liftCoefficient,
  dragCoefficient,
  maxLiftToDrag,
  clForMaxLiftToDrag,
  stallSpeed,
  flightForces,
  pitotStatic,
  alphaSweep,
  speedSweep,
  isaTable,
  POST_STALL,
} from '../../site/assets/engines/aero/model.js';

const DEG = Math.PI / 180;
const close = (actual, expected, tol, msg = '') => assert.ok(Math.abs(actual - expected) <= tol, `${msg} expected ${expected} ± ${tol}, got ${actual}`);
const rel = (actual, expected, tol, msg = '') => close(actual, expected, Math.abs(expected) * tol, msg);

// A generic light aircraft (teaching values, not a specific type).
const AIRCRAFT = { mass: 1000, wingArea: 16, cl0: 0.2, alphaStall: 15, cd0: 0.03, k: 0.05, g: 10 };
const flight = (over = {}) => flightForces({ alphaMode: 'trim', alpha: 4, airspeed: 40, gamma: 0, altitude: 0, ...AIRCRAFT, ...over });

// ---------------------------------------------------------------- ISA

test('ISA sea level: ρ = 1.225 kg/m³ (0.1%), T = 288.15 K, p = 101 325 Pa', () => {
  const s = isa(0);
  rel(s.rho, 1.225, 0.001, 'ρ(0)');
  close(s.T, 288.15, 1e-12, 'T(0)');
  close(s.p, 101325, 1e-9, 'p(0)');
  // Speed of sound a = √(γRT) = √(1.4 × 287.05287 × 288.15) = 340.294 m/s (ISA table)
  rel(s.a, 340.294, 1e-4, 'a(0)');
});

test('ISA 11 000 m: T = 216.65 K and p = 22 632 Pa (0.5%)', () => {
  const s = isa(11000);
  rel(s.T, 216.65, 0.005, 'T(11 km)');
  rel(s.p, 22632, 0.005, 'p(11 km)');
  // Tighter, from the formula: T = 288.15 − 0.0065 × 11 000 = 216.65 K exactly.
  close(s.T, 216.65, 1e-9, 'T(11 km) exact');
});

test('ISA troposphere follows T = T₀ − Lh and p = p₀(T/T₀)^(g₀/(RL)), ρ = p/(RT)', () => {
  const n = ISA.G0 / (ISA.R * ISA.LAPSE); // ≈ 5.2559
  for (const h of [0, 500, 1000, 2500, 5000, 8000, 11000]) {
    const T = 288.15 - 0.0065 * h;
    const p = 101325 * (T / 288.15) ** n;
    const s = isa(h);
    close(s.T, T, 1e-9, `T(${h})`);
    rel(s.p, p, 1e-12, `p(${h})`);
    rel(s.rho, p / (287.05287 * T), 1e-12, `ρ(${h})`);
  }
  // ISA table at 1000 m: 89 874.6 Pa and 1.1117 kg/m³.
  rel(isa(1000).p, 89874.6, 1e-5, 'p(1000 m)');
  rel(isa(1000).rho, 1.1117, 2e-4, 'ρ(1000 m)');
});

test('ISA is continuous at the tropopause and isothermal above it', () => {
  const below = isa(11000 - 1e-6);
  const above = isa(11000 + 1e-6);
  rel(above.p, below.p, 1e-9);
  close(isa(15000).T, 216.65, 1e-9);
  // Isothermal layer: p = p₁₁ exp(−g₀(h − 11 000)/(R T₁₁))
  const p11 = isa(11000).p;
  rel(isa(15000).p, p11 * Math.exp((-9.80665 * 4000) / (287.05287 * 216.65)), 1e-12);
  assert.throws(() => isa(Number.NaN), RangeError);
  assert.throws(() => isa(30000), RangeError);
});

// ---------------------------------------------------------------- Altimeter

test('altimeter: inverting the ISA recovers the altitude from static pressure', () => {
  for (let h = 0; h <= 11000; h += 250) close(pressureAltitude(isa(h).p), h, 1e-6, `h = ${h}`);
  close(pressureAltitude(101325), 0, 1e-9, 'p₀ → 0 m');
  rel(pressureAltitude(22632), 11000, 0.005, '22 632 Pa → 11 000 m');
  // h = (T₀/L)[1 − (p/p₀)^(RL/g₀)] at p = 89 874.6 Pa → 1000 m
  rel(pressureAltitude(89874.6), 1000, 1e-4, '89 874.6 Pa → 1000 m');
  // Above the tropopause: h = 11 000 + (R T₁₁/g₀) ln(p₁₁/p)
  close(pressureAltitude(isa(14000).p), 14000, 1e-6, 'isothermal layer');
});

test('altimeter setting: reads true altitude when set to the actual sea-level pressure', () => {
  for (const slp of [990, 1013.25, 1030]) {
    for (const h of [0, 1500, 6000, 11000]) {
      const r = pitotStatic({ altitude: h, airspeed: 50, seaLevelPressure: slp, altimeterSetting: slp });
      close(r.indicatedAltitude, h, 1e-6, `QNH ${slp}, h ${h}`);
      close(r.altimeterError, 0, 1e-6);
    }
  }
});

test('altimeter setting 10 hPa too low reads about 84 m low near sea level', () => {
  // Indicated = H(p_s) − H(QNH), with H(p) = (T₀/L)[1 − (p/p₀)^(RL/g₀)].
  // Standard day at sea level, QNH 1003.25 hPa: indicated = −H(100 325 Pa)
  //   = −44 330.77 × [1 − (100 325/101 325)^0.190263] = −83.6 m
  const expected = -(288.15 / 0.0065) * (1 - (100325 / 101325) ** ((287.05287 * 0.0065) / 9.80665));
  close(expected, -83.6, 0.1, 'hand calculation');
  close(altimeterReading(101325, 1003.25), expected, 1e-9);
  const r = pitotStatic({ altitude: 0, airspeed: 50, seaLevelPressure: 1013.25, altimeterSetting: 1003.25 });
  close(r.indicatedAltitude, expected, 1e-9);
  // Flying into lower pressure with the setting unchanged: the altimeter over-reads (high to low, look out below).
  const intoLow = pitotStatic({ altitude: 1000, airspeed: 50, seaLevelPressure: 1003.25, altimeterSetting: 1013.25 });
  assert.ok(intoLow.indicatedAltitude > 1000 + 80, `reads high: ${intoLow.indicatedAltitude}`);
});

// ---------------------------------------------------------------- Pitot-static

test('pitot: V = √(2(p_t − p_s)/ρ) recovers the airspeed; Δp = ½ρV²', () => {
  // Sea level, V = 40 m/s: Δp = ½ × 1.225 × 40² = 980 Pa (with the ISA ρ₀ = 1.225000018).
  const r = pitotStatic({ altitude: 0, airspeed: 40, seaLevelPressure: 1013.25, altimeterSetting: 1013.25 });
  rel(r.pressureDifference, 980, 1e-6, 'Δp');
  close(r.totalPressure - r.staticPressure, r.pressureDifference, 1e-9);
  close(r.trueAirspeed, 40, 1e-9, 'V from Δp');
  rel(Math.sqrt((2 * 980) / 1.225), 40, 1e-12, 'hand: √(2 × 980/1.225) = 40');
  for (const h of [0, 2000, 7000, 11000]) {
    for (const V of [10, 55.5, 100]) {
      const s = pitotStatic({ altitude: h, airspeed: V, seaLevelPressure: 1013.25, altimeterSetting: 1013.25 });
      const rho = isa(h).rho;
      rel(s.pressureDifference, 0.5 * rho * V * V, 1e-9, 'Δp = ½ρV²');
      close(s.trueAirspeed, V, 1e-9, `V at ${h} m`);
      rel(s.staticPressure, isa(h).p, 1e-12, 'p_s = ISA p(h)');
      // The airspeed indicator is calibrated with sea-level density: V_i = √(2Δp/ρ₀) = V√(ρ/ρ₀).
      rel(s.indicatedAirspeed, V * Math.sqrt(rho / 1.225), 1e-9, 'IAS');
      rel(s.mach, V / Math.sqrt(1.4 * 287.05287 * isa(h).T), 1e-12, 'Mach');
    }
  }
});

test('pitot: indicated airspeed reads low at altitude (≈ 14% low at 3000 m)', () => {
  const s = pitotStatic({ altitude: 3000, airspeed: 60, seaLevelPressure: 1013.25, altimeterSetting: 1013.25 });
  // ρ(3000 m) = 0.9091 kg/m³ (ISA table), so V_i = 60 √(0.9091/1.225) = 51.69 m/s
  rel(isa(3000).rho, 0.9091, 2e-4);
  rel(s.indicatedAirspeed, 51.69, 1e-3);
});

test('pitot: a different sea-level pressure shifts the whole atmosphere', () => {
  // Actual atmosphere = ISA shifted by the pressure altitude of the sea-level pressure.
  const s = pitotStatic({ altitude: 0, airspeed: 30, seaLevelPressure: 1000, altimeterSetting: 1013.25 });
  close(s.staticPressure, 100000, 1e-6, 'p_s at sea level = sea-level pressure');
  close(s.pressureAltitude, pressureAltitude(100000), 1e-9);
});

test('isaTable rows: T, p, ρ every 500 m from 0 to 11 000 m', () => {
  const rows = isaTable({ airspeed: 40 });
  assert.equal(rows.length, 23);
  assert.equal(rows[0][0], 0);
  assert.equal(rows[22][0], 11000);
  close(rows[22][1], 216.65, 1e-9);
  rel(rows[22][2], isa(11000).p, 1e-12);
});

// ---------------------------------------------------------------- Lift and drag model

test('lift: C_L = 2πα (+C_L0) below the stall', () => {
  const sym = { cl0: 0, alphaStall: 15 };
  // 5° = π/36 rad → C_L = 2π × π/36 = π²/18 = 0.548311
  close(liftCoefficient(5, sym), (Math.PI * Math.PI) / 18, 1e-12);
  close(liftCoefficient(0, sym), 0, 1e-15);
  close(liftCoefficient(-3, sym), -2 * Math.PI * 3 * DEG, 1e-12);
  close(liftCoefficient(5, { cl0: 0.3, alphaStall: 15 }), 0.3 + (Math.PI * Math.PI) / 18, 1e-12);
  // C_Lmax = C_L0 + 2π α_stall: 0.2 + 2π × 15° = 0.2 + π²/6 = 1.844934
  close(clMax({ cl0: 0.2, alphaStall: 15 }), 0.2 + (Math.PI * Math.PI) / 6, 1e-12);
  close(liftCoefficient(15, { cl0: 0.2, alphaStall: 15 }), 1.844934, 1e-6);
});

test('stall: C_L peaks at α_stall, then falls smoothly and stays positive', () => {
  const p = { cl0: 0.2, alphaStall: 15 };
  const cmax = clMax(p);
  close(liftCoefficient(15 + 1e-9, p), cmax, 1e-6, 'continuous at the stall');
  let prev = cmax;
  for (let a = 15.25; a <= 25; a += 0.25) {
    const c = liftCoefficient(a, p);
    assert.ok(c < prev, `C_L must keep falling past the stall (α = ${a})`);
    assert.ok(c > (1 - POST_STALL.drop) * cmax, 'and level off above (1 − drop)·C_Lmax');
    prev = c;
  }
  assert.ok(liftCoefficient(25, p) < 0.75 * cmax, 'a clear loss of lift 10° past the stall');
  // The largest C_L anywhere in the range is at α_stall.
  let best = -Infinity;
  let at = 0;
  for (let a = -5; a <= 25; a += 0.01) {
    const c = liftCoefficient(a, p);
    if (c > best) [best, at] = [c, a];
  }
  close(at, 15, 0.011);
});

test('drag: C_D = C_D0 + k·C_L² below the stall, with a rise after it', () => {
  const p = { cl0: 0.2, alphaStall: 15, cd0: 0.03, k: 0.05 };
  for (const a of [-5, 0, 4, 10, 15]) {
    const cl = liftCoefficient(a, p);
    close(dragCoefficient(a, p), 0.03 + 0.05 * cl * cl, 1e-12, `α = ${a}`);
  }
  const atStall = dragCoefficient(15, p);
  close(dragCoefficient(15 + 1e-9, p), atStall, 1e-6, 'continuous at the stall');
  let prev = atStall;
  for (let a = 15.25; a <= 25; a += 0.25) {
    const c = dragCoefficient(a, p);
    assert.ok(c > prev, `C_D must rise past the stall (α = ${a})`);
    prev = c;
  }
  // L/D collapses past the stall.
  const ld = (a) => liftCoefficient(a, p) / dragCoefficient(a, p);
  assert.ok(ld(20) < 0.6 * ld(15), 'L/D falls sharply past the stall');
});

test('(L/D)max = 1/(2√(k·C_D0)) at C_L = √(C_D0/k)', () => {
  // k = 0.05, C_D0 = 0.03: (L/D)max = 1/(2√0.0015) = 12.9099; C_L* = √0.6 = 0.774597
  close(maxLiftToDrag(0.03, 0.05), 1 / (2 * Math.sqrt(0.05 * 0.03)), 1e-12);
  rel(maxLiftToDrag(0.03, 0.05), 12.9099, 1e-5);
  close(clForMaxLiftToDrag(0.03, 0.05), Math.sqrt(0.03 / 0.05), 1e-12);
  rel(clForMaxLiftToDrag(0.03, 0.05), 0.774597, 1e-6);
  // At C_L*, induced drag equals zero-lift drag, so C_D = 2 C_D0.
  const clStar = clForMaxLiftToDrag(0.03, 0.05);
  close(0.03 + 0.05 * clStar * clStar, 0.06, 1e-12);
  // A fine sweep of the polar finds the same maximum at the same C_L.
  const p = { cl0: 0.2, alphaStall: 15, cd0: 0.03, k: 0.05 };
  let best = 0;
  let bestCl = 0;
  for (let a = -5; a <= 15; a += 0.0005) {
    const cl = liftCoefficient(a, p);
    const r = cl / dragCoefficient(a, p);
    if (r > best) [best, bestCl] = [r, cl];
  }
  rel(best, 12.9099, 1e-5, 'swept (L/D)max');
  close(bestCl, 0.774597, 1e-3, 'swept C_L*');
  // Reported with the flight state, plus the best glide angle atan(1/(L/D)max) = atan(0.0774597) = 4.4293°.
  const f = flight();
  close(f.maxLiftToDrag, 1 / (2 * Math.sqrt(0.0015)), 1e-12);
  close(f.clAtMaxLD, Math.sqrt(0.6), 1e-12);
  close(f.bestGlideAngle, Math.atan(2 * Math.sqrt(0.0015)) / DEG, 1e-12);
  rel(f.bestGlideAngle, 4.4293, 1e-4);
});

// ---------------------------------------------------------------- Force balance

test('level flight: L = W (1e-9) and T = D', () => {
  for (const g of [10, 9.8]) {
    for (const airspeed of [30, 40, 65, 100]) {
      const f = flight({ g, airspeed });
      const W = 1000 * g;
      close(f.weight, W, 1e-9, 'W = mg');
      close(f.lift, W, 1e-9, `L = W at ${airspeed} m/s, g = ${g}`);
      close(f.thrust, f.drag, 1e-9, 'T = D');
      assert.equal(f.stalled, false);
      // L really comes from the lift equation: L = ½ρV²S·C_L(α)
      rel(f.lift, 0.5 * isa(0).rho * airspeed ** 2 * 16 * liftCoefficient(f.alpha, AIRCRAFT), 1e-12);
      close(f.loadFactor, 1, 1e-12);
    }
  }
});

test('level flight at 40 m/s, sea level, g = 10: hand calculation', () => {
  // q = ½ × 1.225 × 40² = 980 Pa; qS = 15 680 N
  // C_L = 10 000/15 680 = 0.637755; α = (0.637755 − 0.2)/(2π) = 0.069671 rad = 3.9918°
  // C_D = 0.03 + 0.05 × 0.637755² = 0.0503366; D = 15 680 × 0.0503366 = 789.28 N; L/D = 12.670
  const f = flight();
  rel(f.dynamicPressure, 980, 1e-6);
  rel(f.cl, 0.637755, 1e-5);
  rel(f.alpha, 3.9918, 1e-4);
  rel(f.cd, 0.0503366, 1e-5);
  rel(f.drag, 789.28, 1e-5);
  rel(f.liftToDrag, 12.670, 1e-4);
  rel(f.thrust, 789.28, 1e-5);
});

test('climb and descent: L = W cos γ and T − D − W sin γ = 0', () => {
  for (const gamma of [-10, -3, 2.5, 5, 12]) {
    const f = flight({ gamma, airspeed: 45 });
    const W = 10000;
    close(f.lift, W * Math.cos(gamma * DEG), 1e-9, `L at γ = ${gamma}`);
    close(f.thrust - f.drag - W * Math.sin(gamma * DEG), 0, 1e-9, `T balance at γ = ${gamma}`);
    close(f.liftSurplus, 0, 1e-9);
  }
  // Climbing needs more thrust than level flight at the same speed; descending needs less.
  assert.ok(flight({ gamma: 5 }).thrust > flight({ gamma: 0 }).thrust);
  assert.ok(flight({ gamma: -3 }).thrust < flight({ gamma: 0 }).thrust);
  // A steep descent needs negative thrust (extra drag) to hold the speed.
  assert.ok(flight({ gamma: -15, airspeed: 40 }).thrust < 0);
});

test('trimThrust is the steady-flight thrust at this speed in either α mode, and null when stalled', () => {
  const trim = flight({ gamma: 4, airspeed: 50 });
  close(trim.trimThrust, trim.thrust, 1e-9);
  // T = qS(C_D0 + k C_L²) + W sin γ with C_L = W cos γ/(qS)
  const qS = 0.5 * isa(0).rho * 2500 * 16;
  const cl = (10000 * Math.cos(4 * DEG)) / qS;
  close(trim.trimThrust, qS * (0.03 + 0.05 * cl * cl) + 10000 * Math.sin(4 * DEG), 1e-9);
  close(flight({ alphaMode: 'manual', alpha: 9, gamma: 4, airspeed: 50 }).trimThrust, trim.thrust, 1e-9);
  assert.equal(flight({ airspeed: 20 }).trimThrust, null);
});

// ---------------------------------------------------------------- Stall speed and stall states

test('stall speed V_s = √(2W/(ρ S C_Lmax))', () => {
  // W = 10 000 N, ρ = 1.225, S = 16, C_Lmax = 1.844934: V_s = √(20 000/36.1607) = 23.5178 m/s
  const f = flight();
  rel(f.stallSpeed, 23.5178, 1e-5);
  close(stallSpeed({ weight: 10000, rho: isa(0).rho, wingArea: 16, clMax: clMax(AIRCRAFT) }), f.stallSpeed, 1e-12);
  close(f.stallSpeed, Math.sqrt((2 * 10000) / (isa(0).rho * 16 * (0.2 + (Math.PI * Math.PI) / 6))), 1e-12);
  // At altitude the (true) stall speed rises as 1/√ρ.
  const high = flight({ altitude: 3000 });
  rel(high.stallSpeed, f.stallSpeed * Math.sqrt(isa(0).rho / isa(3000).rho), 1e-12);
  // Trimmed exactly at V_s, the wing sits at the critical angle.
  const atVs = flight({ airspeed: f.stallSpeed });
  close(atVs.alpha, 15, 1e-9);
  assert.equal(atVs.stalled, false);
});

test('trimmed flight below the stall speed is a stall: not enough lift even at α_stall', () => {
  const f = flight({ airspeed: 20 });
  assert.equal(f.stalled, true);
  close(f.alpha, 15, 1e-12, 'held at the critical angle');
  close(f.cl, clMax(AIRCRAFT), 1e-12);
  // L = qS·C_Lmax = ½ × 1.225 × 400 × 16 × 1.844934 = 7231 N < W = 10 000 N
  rel(f.lift, 0.5 * isa(0).rho * 400 * 16 * clMax(AIRCRAFT), 1e-12);
  assert.ok(f.lift < f.weight);
  close(f.liftSurplus, f.lift - 10000, 1e-9);
  // In a climb the stall boundary is V_s√(cos γ).
  const vsClimb = f.stallSpeed * Math.sqrt(Math.cos(10 * DEG));
  assert.equal(flight({ gamma: 10, airspeed: vsClimb * 1.001 }).stalled, false);
  assert.equal(flight({ gamma: 10, airspeed: vsClimb * 0.999 }).stalled, true);
});

test('α set by hand: lift from the C_L–α curve, imbalance reported, stall past α_stall', () => {
  const m = flight({ alphaMode: 'manual', alpha: 8, airspeed: 40 });
  const cl = 0.2 + 2 * Math.PI * 8 * DEG;
  close(m.cl, cl, 1e-12);
  rel(m.lift, 15680 * cl * (isa(0).rho / 1.225), 1e-12);
  close(m.liftSurplus, m.lift - 10000, 1e-9);
  close(m.loadFactor, m.lift / 10000, 1e-12);
  close(m.thrust, m.drag, 1e-9, 'T = D + W sin γ with γ = 0');
  assert.equal(m.stalled, false);
  // At the trimmed angle the imbalance vanishes.
  const t = flight({ airspeed: 40 });
  close(flight({ alphaMode: 'manual', alpha: t.alpha }).liftSurplus, 0, 1e-6);
  // Past the critical angle: stalled, and less lift than just before the stall.
  const s = flight({ alphaMode: 'manual', alpha: 18 });
  assert.equal(s.stalled, true);
  assert.ok(s.lift < flight({ alphaMode: 'manual', alpha: 15 }).lift);
  assert.ok(s.drag > flight({ alphaMode: 'manual', alpha: 15 }).drag);
  assert.equal(flight({ alphaMode: 'manual', alpha: 15 }).stalled, false);
  assert.equal(flight({ alphaMode: 'manual', alpha: 13.5 }).nearStall, true);
  assert.equal(flight({ alphaMode: 'manual', alpha: 10 }).nearStall, false);
});

test('density from the ISA: the same trim needs more α higher up', () => {
  const low = flight({ altitude: 0 });
  const high = flight({ altitude: 5000 });
  close(high.density, isa(5000).rho, 1e-12);
  assert.ok(high.alpha > low.alpha);
  close(high.lift, 10000, 1e-9);
});

test('invalid inputs throw instead of returning NaN', () => {
  assert.throws(() => flight({ wingArea: 0 }), RangeError);
  assert.throws(() => flight({ mass: -1 }), RangeError);
  assert.throws(() => flight({ airspeed: 0 }), RangeError);
  assert.throws(() => flight({ k: 0 }), RangeError);
});

// ---------------------------------------------------------------- Sweeps (graphs and CSV)

test('alpha sweep covers −5° to 25° and matches the coefficient functions', () => {
  const params = { alphaMode: 'trim', alpha: 4, airspeed: 40, gamma: 0, altitude: 0, ...AIRCRAFT };
  const rows = alphaSweep(params, 0.5);
  assert.equal(rows.length, 61);
  assert.equal(rows[0][0], -5);
  assert.equal(rows[60][0], 25);
  for (const [a, cl, cd, ld, L, D] of rows) {
    close(cl, liftCoefficient(a, AIRCRAFT), 1e-12);
    close(cd, dragCoefficient(a, AIRCRAFT), 1e-12);
    close(ld, cl / cd, 1e-12);
    rel(L, 980 * (isa(0).rho / 1.225) * 16 * cl, 1e-12);
    rel(D, 980 * (isa(0).rho / 1.225) * 16 * cd, 1e-12);
  }
});

test('speed sweep: thrust needed is least at the (L/D)max speed in level flight', () => {
  const params = { alphaMode: 'trim', alpha: 4, airspeed: 40, gamma: 0, altitude: 0, ...AIRCRAFT };
  const rows = speedSweep(params, 0.01);
  const f = flight();
  assert.ok(rows[0][0] >= f.stallSpeed, 'starts at or above the stall speed');
  let min = Infinity;
  let at = 0;
  for (const [V, T, D, Dp, Di] of rows) {
    close(T, D, 1e-9, 'level: T = D');
    close(D, Dp + Di, 1e-9, 'D = parasite + induced');
    if (T < min) [min, at] = [T, V];
  }
  // V for (L/D)max: √(2W/(ρ S C_L*)) = √(20 000/(1.225 × 16 × 0.774597)) = 36.30 m/s; T = W/(L/D)max = 774.6 N
  rel(f.minDragSpeed, 36.30, 1e-3);
  close(at, f.minDragSpeed, 0.01);
  rel(min, 10000 / 12.909944, 1e-6);
  // Climb adds W sin γ to every row.
  const climb = speedSweep({ ...params, gamma: 5 }, 1);
  for (const [, T, D] of climb) close(T - D, 10000 * Math.sin(5 * DEG), 1e-9);
});

test('least thrust: exact speed √(2W cos γ/(ρ S C_L*)) and T = W cos γ/(L/D)max + W sin γ', () => {
  // Level: V* = √(20 000/(1.225 × 16 × 0.774597)) = 36.295 m/s; T* = 10 000/12.9099 = 774.60 N
  const f = flight();
  rel(f.minThrustSpeed, 36.295, 1e-4);
  close(f.minThrustSpeed, f.minDragSpeed, 1e-12);
  rel(f.minThrust, 10000 / 12.909944, 1e-6);
  // γ = ±15°: V* = 36.295 × √(cos 15°) = 35.672 m/s; T* = W cos γ/(L/D)max + W sin γ
  for (const gamma of [-15, 15]) {
    const c = flight({ gamma });
    rel(c.minThrustSpeed, 36.295 * Math.sqrt(Math.cos(15 * DEG)), 1e-4);
    rel(c.minThrustSpeed, 35.672, 1e-4);
    close(c.minThrust, (10000 * Math.cos(gamma * DEG)) / (1 / (2 * Math.sqrt(0.0015))) + 10000 * Math.sin(gamma * DEG), 1e-9);
    // No speed on a fine grid needs less thrust.
    for (const [, T] of speedSweep({ alphaMode: 'trim', alpha: 4, airspeed: 40, gamma, altitude: 0, ...AIRCRAFT }, 0.01)) assert.ok(T >= c.minThrust - 1e-9);
  }
});

test('best L/D past the stall: report the best the wing can reach, at C_Lmax and V_s', () => {
  // C_L0 = 0, α_stall = 8°: C_Lmax = 2π × 8° = 0.877298; C_D0 = k = 0.05 gives C_L* = 1 > C_Lmax.
  // Best reachable L/D = C_Lmax/(C_D0 + k C_Lmax²) = 0.877298/(0.05 + 0.05 × 0.769652) = 9.9149
  const f = flight({ cl0: 0, alphaStall: 8, cd0: 0.05, k: 0.05 });
  const cm = 2 * Math.PI * 8 * DEG;
  assert.equal(f.maxLDBeyondStall, true);
  close(f.polarMaxLiftToDrag, 10, 1e-12, 'formula value 1/(2√0.0025) = 10');
  close(f.maxLiftToDrag, cm / (0.05 + 0.05 * cm * cm), 1e-12);
  rel(f.maxLiftToDrag, 9.9149, 1e-4);
  assert.ok(f.maxLiftToDrag < f.polarMaxLiftToDrag);
  close(f.clAtMaxLD, cm, 1e-12);
  close(f.minDragSpeed, f.stallSpeed, 1e-9, 'best L/D speed is the stall speed, never below it');
  close(f.minThrustSpeed, f.stallSpeedOnPath, 1e-9);
  close(f.bestGlideAngle, Math.atan(1 / f.maxLiftToDrag) / DEG, 1e-12);
  // No reachable α (pre- or post-stall) beats it.
  const wing = { cl0: 0, alphaStall: 8, cd0: 0.05, k: 0.05 };
  for (let a = -5; a <= 25; a += 0.01) assert.ok(liftCoefficient(a, wing) / dragCoefficient(a, wing) <= f.maxLiftToDrag + 1e-12, `α = ${a}`);
  // C_D0 = 0.1, k = 0.01 with the default wing: polar says 15.81, the wing reaches 1.844934/(0.1 + 0.01 × 3.403782) = 13.764
  const g = flight({ cd0: 0.1, k: 0.01 });
  rel(g.polarMaxLiftToDrag, 15.811, 1e-4);
  rel(g.maxLiftToDrag, 13.764, 1e-4);
  // When C_L* is reachable nothing changes: the formula value is reported.
  const d = flight();
  assert.equal(d.maxLDBeyondStall, false);
  close(d.maxLiftToDrag, d.polarMaxLiftToDrag, 0);
});

test('deterministic: same inputs, same outputs', () => {
  assert.deepEqual(flight({ gamma: 3.5, airspeed: 51 }), flight({ gamma: 3.5, airspeed: 51 }));
  const p = { altitude: 2345, airspeed: 61, seaLevelPressure: 1007, altimeterSetting: 1019 };
  assert.deepEqual(pitotStatic(p), pitotStatic(p));
});
