// materials engine tests (guide §9.1). Every expected number comes from a formula or from the cited
// data row, never from running the code and pasting the result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MATERIALS,
  materialById,
  DT,
  KGF,
  PROOF_OFFSET,
  sectionArea,
  stressFromLoad,
  loadFromStress,
  strainFromExtension,
  extensionFromStrain,
  customMaterial,
  tensileCurve,
  stressAt,
  trapezoidArea,
  measureTest,
  createTensileRun,
  specimenShape,
  strengthOf,
  specificStrength,
  tieMass,
  ratioLineStrength,
  selectionRows,
  brinellHardness,
  brinellDiameter,
  brinellDepth,
  brinellCheck,
  vickersHardness,
  vickersDiagonal,
  vickersDepth,
  rockwellHardness,
  rockwellDepth,
  ROCKWELL_SCALES,
  crackLength,
  crackStage,
  snSchematic,
  NDT_METHODS,
  NDT_FLAWS,
  NDT_MATERIALS,
  ndtResult,
  createFatigueRun,
} from '../../site/assets/engines/materials/model.js';

const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const rel = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg ?? ''} expected ${expected} (±${tol * 100}%), got ${actual}`);

/** Run a whole tensile test for a material and return its outputs. */
function runTest(params) {
  const run = createTensileRun({ gaugeLength: 50, section: 'round', diameter: 10, width: 12.5, thickness: 3, runTime: 10, ...params });
  run.advance(1e7);
  assert.ok(run.isComplete(), 'the test ends at fracture');
  return { run, out: run.outputs() };
}

// ---------------------------------------------------------------- data

test('every data row carries a source or a needsSource flag', () => {
  for (const m of MATERIALS) {
    const sourced = typeof m.source === 'string' && m.source.trim().length > 20;
    assert.ok(sourced || m.needsSource === true, `${m.id}: needs a source (or needsSource: true)`);
    if (sourced) assert.ok(typeof m.cite === 'string' && m.cite.length > 2, `${m.id}: needs a short cite for the stage`);
  }
});

test('data rows are complete, unique and in range', () => {
  const ids = new Set();
  for (const m of MATERIALS) {
    assert.ok(!ids.has(m.id), `duplicate id ${m.id}`);
    ids.add(m.id);
    assert.ok(['metal', 'polymer', 'ceramic', 'composite'].includes(m.family), `${m.id}: family`);
    assert.ok(['ductile', 'brittle', 'polymer'].includes(m.behaviour), `${m.id}: behaviour`);
    assert.ok(['typical', 'specified minimum'].includes(m.basis), `${m.id}: basis`);
    for (const k of ['E', 'uts', 'density']) assert.ok(Number.isFinite(m[k]) && m[k] > 0, `${m.id}: ${k}`);
    if (m.behaviour === 'brittle') {
      assert.equal(m.yield, null, `${m.id}: brittle rows have no yield`);
    } else {
      assert.ok(m.yield > 0 && m.yield <= m.uts, `${m.id}: 0 < yield ≤ UTS`);
      assert.ok(m.elongation > 0, `${m.id}: elongation`);
    }
    if (m.behaviour === 'polymer') assert.ok(m.yieldStrain > 0, `${m.id}: polymers need the strain at yield`);
  }
});

test('the required materials are present', () => {
  const want = ['structural-steel', 'high-tensile-steel', 'copper', 'aluminium-2024', 'titanium-6al-4v', 'cfrp', 'hdpe', 'alumina', 'grey-cast-iron'];
  for (const id of want) assert.ok(materialById(id), `missing ${id}`);
  const families = new Set(MATERIALS.map((m) => m.family));
  for (const f of ['metal', 'polymer', 'ceramic', 'composite']) assert.ok(families.has(f), `no ${f}`);
});

// ---------------------------------------------------------------- load ↔ stress

test('cross-section areas', () => {
  close(sectionArea({ section: 'round', diameter: 10 }), 25 * Math.PI, 1e-12, 'πd²/4');
  assert.equal(sectionArea({ section: 'rect', width: 12.5, thickness: 4 }), 50);
});

test('load ↔ stress and extension ↔ strain round trips are exact', () => {
  // Hand values: F = σA, so 300 MPa on 50 mm² is 15 000 N; ε = δ/L₀, so 11 mm on 50 mm is 0.22.
  assert.equal(loadFromStress(300, 50), 15000);
  assert.equal(stressFromLoad(15000, 50), 300);
  assert.equal(extensionFromStrain(0.22, 50), 11);
  assert.equal(strainFromExtension(11, 50), 0.22);
  // Every data row on two specimens. One multiply then one divide: exact to IEEE rounding (≤ 1 ulp).
  const areas = [sectionArea({ section: 'round', diameter: 10 }), sectionArea({ section: 'rect', width: 12.5, thickness: 3 }), 50];
  for (const A of areas) {
    for (const m of MATERIALS) {
      for (const s of [m.uts, m.yield ?? m.uts, m.uts / 3]) {
        const back = stressFromLoad(loadFromStress(s, A), A);
        assert.ok(Math.abs(back - s) <= Number.EPSILON * s, `σ = ${s} MPa, A = ${A} mm²: got ${back}`);
      }
    }
  }
  for (const L0 of [25, 50, 80, 137.5]) {
    for (const e of [0.001, 0.0085, 0.122, 0.45, 1.5]) {
      const back = strainFromExtension(extensionFromStrain(e, L0), L0);
      assert.ok(Math.abs(back - e) <= Number.EPSILON * e, `ε = ${e}, L₀ = ${L0}: got ${back}`);
    }
  }
});

test('outputs convert stress to load and strain to extension with the specimen geometry', () => {
  const run = createTensileRun({ material: 'structural-steel', gaugeLength: 80, section: 'rect', width: 20, thickness: 5, runTime: 10 });
  run.advance(400);
  const o = run.outputs();
  close(o.load, (o.stress * 100) / 1000, 1e-9, 'load (kN) = σ (MPa) × A (mm²) / 1000');
  close(o.extension, (o.strain / 100) * 80, 1e-12, 'δ = ε L₀');
  close(o.area, 100, 1e-12);
});

// ---------------------------------------------------------------- tensile model

test('E recovered from the elastic slope (1%)', () => {
  for (const m of MATERIALS) {
    const { out } = runTest({ material: m.id });
    rel(out.modulus, m.E, 0.01, `${m.id}: E`);
  }
});

test('ideal linear-to-fracture toughness = ½σε (0.5%)', () => {
  for (const id of ['alumina', 'cfrp', 'grey-cast-iron']) {
    const m = materialById(id);
    const { out } = runTest({ material: id });
    const eps = m.uts / (m.E * 1000);
    rel(out.toughness, 0.5 * m.uts * eps, 0.005, `${id}: ½σε`);
    rel(out.uts, m.uts, 1e-9, `${id}: fracture stress`);
    rel(out.fractureStrain / 100, eps, 1e-9, `${id}: ε = σ/E`);
    assert.equal(out.yieldStrength, null, `${id}: no yield`);
    close(out.elongation, 0, 1e-9, `${id}: no permanent elongation`);
  }
  // A custom brittle material: σ = 500 MPa, E = 100 GPa → ε = 0.005, ½σε = 1.25 MJ/m³.
  const { out } = runTest({ material: 'custom', customBehaviour: 'brittle', customE: 100, customUts: 500 });
  rel(out.toughness, 1.25, 0.005, 'custom ½σε');
});

test('trapezoid area: exact for straight segments', () => {
  close(trapezoidArea([0, 1, 2], [0, 2, 4]), 4, 1e-12);
  close(trapezoidArea([0, 0.5, 2], [10, 10, 10]), 20, 1e-12);
});

test('ductile metals: 0.2% proof stress, UTS and elongation come back from the drawn curve', () => {
  for (const m of MATERIALS.filter((x) => x.behaviour === 'ductile')) {
    const { out } = runTest({ material: m.id });
    rel(out.yieldStrength, m.yield, 0.01, `${m.id}: proof stress`);
    rel(out.uts, m.uts, 0.001, `${m.id}: UTS`);
    rel(out.elongation, m.elongation, 0.01, `${m.id}: elongation after fracture`);
    assert.ok(out.toughness > m.yield * (m.elongation / 100) * 0.8, `${m.id}: toughness is roughly σ × ε`);
    assert.ok(out.toughness < m.uts * (m.elongation / 100 + m.uts / (m.E * 1000)), `${m.id}: toughness below UTS × fracture strain`);
  }
});

test('polymer: yield point, drawing and elongation at break', () => {
  const m = materialById('hdpe');
  const { out } = runTest({ material: 'hdpe' });
  rel(out.yieldStrength, m.yield, 0.002, 'yield point');
  rel(out.uts, m.uts, 0.002, 'highest stress is the yield point');
  rel(out.elongation, m.elongation, 0.01, 'elongation at break');
  const c = tensileCurve(m);
  close(c.ey, m.yieldStrain / 100, 1e-12, 'strain at yield');
  close(stressAt(c, c.ey), m.yield, 1e-6, 'stress at the yield strain');
  assert.ok(stressAt(c, c.ey * 3) < m.yield, 'stress falls after the yield point');
});

test('tensile curve: continuous, peaks at UTS, falls while necking, ends at fracture', () => {
  for (const m of MATERIALS) {
    const c = tensileCurve(m);
    const n = 4000;
    let prev = 0;
    let peak = 0;
    let peakAt = 0;
    for (let i = 1; i <= n; i++) {
      const e = (c.eb * i) / n;
      const s = stressAt(c, e);
      assert.ok(Number.isFinite(s) && s >= 0, `${m.id}: finite stress`);
      // No jumps: the curve is never steeper than the elastic line, so |Δσ| ≤ E Δε.
      assert.ok(Math.abs(s - prev) <= c.E * (c.eb / n) * (1 + 1e-9) + 1e-9, `${m.id}: no jumps (Δσ at ε = ${e})`);
      if (s > peak) {
        peak = s;
        peakAt = e;
      }
      prev = s;
    }
    rel(peak, m.uts, 0.001, `${m.id}: peak`);
    if (m.behaviour === 'ductile') {
      assert.ok(peakAt < c.eb * 0.9, `${m.id}: necking after the peak`);
      assert.ok(stressAt(c, c.eb) < m.uts, `${m.id}: fracture stress below UTS`);
    }
    // Elastic start: σ = Eε (at 1% of the yield strain; polymers bend away from the line early).
    const e0 = (m.yield ?? m.uts) / (m.E * 1000) / 100;
    rel(stressAt(c, e0), m.E * 1000 * e0, 1e-6, `${m.id}: Hooke's law at small strain`);
  }
});

test('structural steel shows a yield plateau at the yield stress', () => {
  const c = tensileCurve(materialById('structural-steel'));
  const ey = 300 / 200000;
  close(stressAt(c, ey + 0.004), 300, 1e-9);
  close(stressAt(c, ey + 0.01), 300, 1e-9);
  assert.ok(stressAt(c, ey + 0.05) > 300, 'hardens after the plateau');
});

test('uniform strain at UTS follows Considère for a power law where it can (Hollomon n from σu/σy)', () => {
  // Hollomon σ = Kεⁿ: σy ≈ K(0.002)ⁿ and σu = K nⁿ e⁻ⁿ, so σu/σy = (n / 0.002e)ⁿ; uniform strain e^n − 1.
  const m = materialById('aluminium-2024');
  const c = tensileCurve(m);
  const ratio = m.uts / m.yield;
  const nHol = c.n;
  close(Math.pow(nHol / (0.002 * Math.E), nHol), ratio, 1e-9, 'n solves the ratio');
  close(c.eu, Math.exp(nHol) - 1, 1e-9, 'uniform strain = e^n − 1');
  // 4340: Hollomon would put the peak past the elongation, so it is capped at 75% of it.
  const h = tensileCurve(materialById('high-tensile-steel'));
  assert.ok(h.eu - h.su / h.E <= 0.75 * 0.122 + 1e-12);
});

test('custom ductile material behaves like a data row', () => {
  const p = { material: 'custom', customBehaviour: 'ductile', customE: 150, customYield: 400, customUts: 520, customElongation: 25 };
  const m = customMaterial(p);
  assert.equal(m.E, 150);
  const { out } = runTest(p);
  rel(out.modulus, 150, 0.01);
  rel(out.yieldStrength, 400, 0.01);
  rel(out.uts, 520, 0.001);
  rel(out.elongation, 25, 0.01);
  // Yield above UTS is clamped to UTS (elastic–perfectly plastic up to necking).
  const flat = runTest({ ...p, customYield: 600 }).out;
  rel(flat.uts, 520, 0.001);
  rel(flat.yieldStrength, 520, 0.01);
});

test('fixed steps: the test reaches fracture exactly at the end of the run', () => {
  const params = { material: 'copper', gaugeLength: 50, section: 'round', diameter: 10, runTime: 5 };
  const run = createTensileRun(params);
  assert.equal(run.totalSteps, Math.round(5 / DT));
  run.advance(100);
  assert.equal(run.n, 100);
  close(run.outputs().t, 100 * DT, 1e-12);
  assert.ok(!run.isComplete());
  run.advance(1e9);
  assert.equal(run.n, run.totalSteps, 'stops at fracture');
  assert.ok(run.isComplete());
  const c = tensileCurve(materialById('copper'));
  close(run.outputs().strain / 100, c.eb, 1e-12, 'final strain is the fracture strain');
  close(run.outputs().t, 5, 1e-9);
});

test('deterministic: same params, same outputs and data', () => {
  const params = { material: 'titanium-6al-4v', gaugeLength: 50, section: 'round', diameter: 8, runTime: 6 };
  const a = createTensileRun(params);
  const b = createTensileRun(params);
  a.advance(333);
  b.advance(333);
  assert.deepEqual(a.outputs(), b.outputs());
  assert.deepEqual(a.samples(), b.samples());
});

test('readouts appear only once the test has measured them', () => {
  const run = createTensileRun({ material: 'structural-steel', gaugeLength: 50, section: 'round', diameter: 10, runTime: 10 });
  let o = run.outputs();
  assert.equal(o.modulus, null);
  assert.equal(o.yieldStrength, null);
  assert.equal(o.elongation, null);
  run.advance(Math.round(run.totalSteps * 0.3));
  o = run.outputs();
  rel(o.modulus, 200, 0.01);
  rel(o.yieldStrength, 300, 0.01);
  assert.equal(o.elongation, null, 'no elongation before fracture');
  assert.ok(o.toughness > 0);
});

test('samples: CSV rows from t = 0 to now with load, extension, stress and strain', () => {
  const run = createTensileRun({ material: 'aluminium-2024', gaugeLength: 50, section: 'round', diameter: 10, runTime: 10 });
  run.advance(1e9);
  const rows = run.samples();
  assert.deepEqual(rows[0], [0, 0, 0, 0, 0]);
  const last = rows[rows.length - 1];
  close(last[0], 10, 1e-9, 'last row at fracture time');
  const A = 25 * Math.PI;
  for (const r of rows) {
    close(r[2], (r[4] * A) / 1000, 1e-9, 'kN = MPa × mm² / 1000');
    close(r[1], (r[3] / 100) * 50, 1e-9, 'mm = ε × L₀');
  }
});

test('specimen shape: constant volume while uniform, a neck after UTS, broken at fracture', () => {
  const c = tensileCurve(materialById('structural-steel'));
  const uni = specimenShape(c, c.eu * 0.9);
  const p = c.eu * 0.9 - stressAt(c, c.eu * 0.9) / c.E;
  close(uni.width, 1 / Math.sqrt(1 + p), 1e-9, 'd/d₀ = 1/√(1 + plastic strain)');
  assert.equal(uni.neck, 0);
  const neck = specimenShape(c, (c.eu + c.eb) / 2);
  assert.ok(neck.neck > 0 && neck.neck < 1);
  assert.equal(specimenShape(c, c.eb).broken, true);
  const brittle = specimenShape(tensileCurve(materialById('alumina')), 0.0005);
  assert.equal(brittle.neck, 0);
  close(brittle.width, 1, 1e-12);
});

// ---------------------------------------------------------------- selection

test('specific strength and tie-rod mass', () => {
  // σ/ρ = 300e6 Pa / 7850 kg/m³ = 38 216.6 N·m/kg = 38.217 kN·m/kg.
  close(specificStrength(300, 7850), 300e3 / 7850, 1e-12);
  rel(specificStrength(300, 7850), 38.2166, 1e-5);
  // m = ρ L F n / σ = 7850 × 2 × 100e3 × 1 / 300e6 = 5.2333 kg.
  rel(tieMass({ load: 100, length: 2, strength: 300, density: 7850, factorOfSafety: 1 }), 5.23333, 1e-5);
  // Factor of safety 2 doubles the area and the mass.
  rel(tieMass({ load: 100, length: 2, strength: 300, density: 7850, factorOfSafety: 2 }), 10.46667, 1e-5);
});

test('selection: strength basis and constant σ/ρ guidelines', () => {
  const ti = materialById('titanium-6al-4v');
  assert.deepEqual(strengthOf(ti, 'yield'), { value: 910, kind: 'yield' });
  assert.deepEqual(strengthOf(ti, 'uts'), { value: 1000, kind: 'uts' });
  assert.deepEqual(strengthOf(materialById('alumina'), 'yield'), { value: 379, kind: 'fracture' });
  // A guideline through Ti-6Al-4V passes through its point and has slope 1 on log–log axes.
  const k = specificStrength(910, 4420);
  close(ratioLineStrength(k, 4420), 910, 1e-9);
  const slope = (Math.log10(ratioLineStrength(k, 10000)) - Math.log10(ratioLineStrength(k, 1000))) / (Math.log10(10000) - Math.log10(1000));
  close(slope, 1, 1e-12);
  const rows = selectionRows('yield');
  assert.equal(rows.length, MATERIALS.length);
  for (const r of rows) close(r.specific, specificStrength(r.strength, r.density), 1e-12);
});

// ---------------------------------------------------------------- hardness

test('Vickers F = 30 kgf, d = 0.5 mm → 222.5 HV', () => {
  // HV = 1.8544 F / d² = 1.8544 × 30 / 0.25 = 222.528.
  close(vickersHardness(30, 0.5), 222.528, 1e-9);
  close(vickersHardness(30, 0.5), 222.5, 0.05);
});

test('Brinell F = 3000 kgf, D = 10 mm, d = 4 mm → 228.8 HB (0.5%)', () => {
  // HB = 2F / (πD(D − √(D² − d²))) = 6000 / (10π(10 − √84)) = 228.77.
  rel(brinellHardness(3000, 10, 4), 228.8, 0.005);
  close(brinellHardness(3000, 10, 4), 6000 / (10 * Math.PI * (10 - Math.sqrt(84))), 1e-9);
});

test('hardness inverses and indentation depths', () => {
  close(brinellDiameter(brinellHardness(3000, 10, 4), 3000, 10), 4, 1e-9);
  close(vickersDiagonal(vickersHardness(30, 0.5), 30), 0.5, 1e-12);
  // Spherical cap depth h = (D − √(D² − d²))/2, and HB = F / (πDh).
  const h = brinellDepth(10, 4);
  close(h, (10 - Math.sqrt(84)) / 2, 1e-12);
  close(brinellHardness(3000, 10, 4), 3000 / (Math.PI * 10 * h), 1e-9);
  // Vickers 136° pyramid: depth = d / (2√2 tan 68°) ≈ d/7.
  close(vickersDepth(0.7), 0.7 / (2 * Math.SQRT2 * Math.tan((68 * Math.PI) / 180)), 1e-12);
  close(KGF, 9.80665, 0);
});

test('Brinell validity: indentation between 0.24D and 0.6D', () => {
  assert.equal(brinellCheck(10, 4).ok, true);
  assert.equal(brinellCheck(10, 2).ok, false);
  assert.equal(brinellCheck(10, 6.5).ok, false);
});

test('Rockwell: HR = N − h/0.002 mm (C: N = 100, B: N = 130)', () => {
  close(rockwellHardness('C', 0.1), 50, 1e-9);
  close(rockwellHardness('B', 0.1), 80, 1e-9);
  close(rockwellDepth('C', 36), 0.128, 1e-12);
  assert.equal(ROCKWELL_SCALES.C.totalLoad, 150);
  assert.equal(ROCKWELL_SCALES.B.totalLoad, 100);
  assert.equal(ROCKWELL_SCALES.C.minorLoad, 10);
});

// ---------------------------------------------------------------- fatigue and NDT

test('crack growth schematic: Paris law with m = 3 integrates to a = a₀/(1 − N/N*)²', () => {
  const opts = { a0: 0.5, ac: 20 };
  close(crackLength(0, opts), 0.5, 1e-12);
  close(crackLength(1, opts), 20, 1e-9);
  // Numerical check: da/dN = C a^(3/2) from a₀, with C chosen so failure is at N = 1 (RK4, 20 000 steps).
  const Nstar = 1 / (1 - Math.sqrt(opts.a0 / opts.ac));
  const C = 2 / (Nstar * Math.sqrt(opts.a0));
  const f = (a) => C * a ** 1.5;
  let a = opts.a0;
  const steps = 20000;
  const h = 1 / steps;
  for (let i = 0; i < steps; i++) {
    const k1 = f(a);
    const k2 = f(a + (h * k1) / 2);
    const k3 = f(a + (h * k2) / 2);
    const k4 = f(a + h * k3);
    a += (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    if (i === steps / 2 - 1) rel(a, crackLength(0.5, opts), 1e-6, 'half life');
  }
  rel(a, crackLength(1, opts), 1e-5, 'end of life');
  let prev = 0;
  for (let i = 0; i <= 100; i++) {
    const v = crackLength(i / 100, opts);
    assert.ok(v > prev, 'grows monotonically');
    prev = v;
  }
  assert.equal(crackStage(0.05), 'initiation');
  assert.equal(crackStage(0.5), 'growth');
  assert.equal(crackStage(1), 'fracture');
});

test('S–N schematic: steel has an endurance limit, aluminium does not', () => {
  const s6 = snSchematic('steel', 6);
  close(snSchematic('steel', 7), s6, 1e-12, 'flat after 10⁶ cycles');
  close(snSchematic('steel', 9), s6, 1e-12);
  assert.ok(snSchematic('steel', 4) > s6);
  for (let x = 3; x < 9; x += 0.5) assert.ok(snSchematic('aluminium', x + 0.5) < snSchematic('aluminium', x), 'aluminium keeps falling');
});

test('NDT: what each method can find', () => {
  const r = (m, f, mat) => ndtResult(m, f, mat).level;
  assert.equal(r('magnetic', 'surface-crack', 'steel'), 'yes');
  assert.equal(r('magnetic', 'surface-crack', 'aluminium'), 'no', 'magnetic particle needs a ferromagnetic part');
  assert.equal(r('magnetic', 'surface-crack', 'cfrp'), 'no');
  assert.equal(r('dye', 'surface-crack', 'aluminium'), 'yes');
  assert.equal(r('dye', 'subsurface-crack', 'steel'), 'no', 'penetrant only finds surface-breaking flaws');
  assert.equal(r('visual', 'internal-void', 'steel'), 'no');
  assert.equal(r('ultrasonic', 'internal-void', 'aluminium'), 'yes');
  assert.equal(r('ultrasonic', 'delamination', 'cfrp'), 'yes');
  assert.equal(r('xray', 'internal-void', 'steel'), 'yes');
  assert.notEqual(r('xray', 'delamination', 'cfrp'), 'yes', 'a flat delamination across the beam barely changes the X-ray image');
  for (const m of NDT_METHODS) {
    assert.ok(m.name && m.finds && m.suits && m.how, `${m.id}: text`);
    for (const f of NDT_FLAWS) for (const mat of NDT_MATERIALS) {
      const res = ndtResult(m.id, f.id, mat.id);
      assert.ok(['yes', 'partial', 'no'].includes(res.level));
      assert.ok(res.reason.length > 10, `${m.id}/${f.id}/${mat.id}: reason`);
    }
  }
});

test('fatigue run: life fraction rises with fixed steps and ends at fracture', () => {
  const run = createFatigueRun({ runTime: 8 });
  assert.equal(run.totalSteps, Math.round(8 / DT));
  run.advance(run.totalSteps / 2);
  close(run.outputs().lifeUsed, 50, 1e-9);
  run.advance(1e9);
  assert.ok(run.isComplete());
  close(run.outputs().lifeUsed, 100, 1e-9);
  close(run.outputs().crackRatio, 1, 1e-9);
});

test('constants', () => {
  assert.equal(PROOF_OFFSET, 0.002);
  assert.ok(DT > 0 && DT <= 1 / 60);
  // A measured test with too few points has no modulus yet.
  assert.equal(measureTest([0], [0], 1, tensileCurve(materialById('copper'))).modulus, null);
});
