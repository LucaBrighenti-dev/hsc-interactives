// rays engine tests: Snell's law, the critical angle, total internal reflection, Fresnel partial
// reflection and the optical fibre, checked against analytic answers (guide §9.1).
// Every expected number comes from a formula, never from running the code and pasting the result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_INTERACTIONS,
  snellAngle,
  criticalAngle,
  fresnelReflectance,
  numericalAperture,
  acceptanceAngle,
  seg,
  trace,
  buildScene,
  sourcePosition,
  sourceDirection,
  angleFromPoint,
  solve,
  sweep,
  SCENES,
  PARTIAL_MIN_R,
} from '../../site/assets/engines/rays/model.js';
import { headerText, numberPair } from '../../site/assets/engines/rays/view.js';

const DEG = Math.PI / 180;
const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const dirAngleFrom = (d, n) => Math.atan2(Math.abs(d[0] * n[1] - d[1] * n[0]), d[0] * n[0] + d[1] * n[1]) / DEG; // angle between d and n, 0–180°

const BASE = { scene: 'boundary', angle: 30, n1: 1, n2: 1.5, nBlock: 1.5, nOuter: 1, nCore: 1.5, nClad: 1.4, showPartial: true };
const p = (over) => ({ ...BASE, ...over });

// ---- §9.1 analytic tests ---------------------------------------------------------------------

test('§9.1 Snell: n 1.00 → 1.50 at 30° refracts to 19.47° (0.01°)', () => {
  close(snellAngle(1.0, 1.5, 30), 19.47, 0.01);
  // Exact: sin r = sin 30° / 1.5 = 1/3
  close(snellAngle(1.0, 1.5, 30), Math.asin(1 / 3) / DEG, 1e-12, 'asin(1/3)');
  // Normal incidence goes straight through; equal indices do not bend.
  assert.equal(snellAngle(1.0, 1.5, 0), 0);
  close(snellAngle(1.33, 1.33, 47), 47, 1e-12, 'equal indices');
});

test('§9.1 critical angle 1.50 → 1.00 is 41.81°', () => {
  close(criticalAngle(1.5, 1.0), 41.81, 0.01);
  close(criticalAngle(1.5, 1.0), Math.asin(1 / 1.5) / DEG, 1e-12, 'asin(n2/n1)');
  // No critical angle going into a denser (or equal) medium.
  assert.equal(criticalAngle(1.0, 1.5), null);
  assert.equal(criticalAngle(1.5, 1.5), null);
});

test('§9.1 fibre: core 1.50, cladding 1.40, a ray at 15° to the axis stays guided', () => {
  const params = p({ scene: 'fibre', nCore: 1.5, nClad: 1.4, nOuter: 1 });
  const scene = buildScene(params);
  // Launched inside the core at 15° to the axis: it meets the wall at 75° > θc = asin(1.4/1.5) = 68.96°.
  const r = trace(scene.boundaries, [0.5, 0], [Math.cos(15 * DEG), -Math.sin(15 * DEG)]);
  const walls = r.events.filter((e) => e.tag === 'wall');
  assert.ok(walls.length >= 2, 'bounces at least twice along the fibre');
  for (const e of walls) {
    assert.equal(e.type, 'tir', 'total internal reflection at every bounce');
    close(e.incidence, 75, 1e-9, 'angle of incidence at the wall = 90° − 15°');
  }
  assert.ok(r.events.every((e) => e.type !== 'absorbed'), 'never reaches the coating');
  assert.equal(r.events.at(-1).tag, 'exit', 'leaves through the far end face');
  // Launched from air at 15° to the axis (a smaller angle inside the core): also guided.
  const s = solve({ ...params, angle: 15 });
  assert.equal(s.outputs.guided, 1);
  close(s.outputs.wallAngle, 90 - Math.asin(Math.sin(15 * DEG) / 1.5) / DEG, 1e-9, 'wall angle from Snell at the end face');
});

// ---- Snell, critical angle and Fresnel -------------------------------------------------------

test('Snell: total internal reflection gives no refracted angle beyond θc', () => {
  const c = criticalAngle(1.5, 1.0);
  assert.equal(typeof snellAngle(1.5, 1.0, c - 0.01), 'number');
  assert.equal(snellAngle(1.5, 1.0, c + 0.01), null);
  close(snellAngle(1.5, 1.0, c), 90, 1e-6, 'at θc the refracted ray grazes the surface');
  // Reversibility: going back along the refracted ray returns the incident angle.
  close(snellAngle(1.5, 1.0, snellAngle(1.0, 1.5, 63)), 63, 1e-9);
});

test('Fresnel: 4% at normal incidence, Brewster angle, and 100% under TIR', () => {
  // R = ((n1 − n2)/(n1 + n2))² = (0.5/2.5)² = 0.04
  close(fresnelReflectance(1.0, 1.5, 0), 0.04, 1e-12, 'normal incidence');
  close(fresnelReflectance(1.5, 1.0, 0), 0.04, 1e-12, 'same from the glass side');
  // At Brewster's angle tan θB = n2/n1, Rp = 0 and Rs = ((n2² − n1²)/(n2² + n1²))², so R = Rs/2.
  const thetaB = Math.atan(1.5) / DEG;
  close(fresnelReflectance(1.0, 1.5, thetaB), 0.5 * ((1.5 ** 2 - 1) / (1.5 ** 2 + 1)) ** 2, 1e-12, 'Brewster');
  assert.equal(fresnelReflectance(1.5, 1.0, 50), 1, 'TIR reflects everything');
  assert.ok(fresnelReflectance(1.5, 1.0, criticalAngle(1.5, 1.0) - 1e-6) > 0.99, 'R → 1 just below θc');
  // Stokes reversibility: the same fraction reflects from either side for the paired angles.
  const t = snellAngle(1.0, 1.5, 40);
  close(fresnelReflectance(1.5, 1.0, t), fresnelReflectance(1.0, 1.5, 40), 1e-12, 'R(i) = R(t)');
});

test('fibre: numerical aperture and acceptance angle', () => {
  // NA = √(n_core² − n_clad²) = √(2.25 − 1.96) = √0.29
  close(numericalAperture(1.5, 1.4), Math.sqrt(0.29), 1e-12);
  // θa = asin(NA / n0) = asin(0.53852) = 32.58° in air
  close(acceptanceAngle(1.5, 1.4, 1.0), 32.58, 0.01);
  close(acceptanceAngle(1.5, 1.4, 1.0), Math.asin(Math.sqrt(0.29)) / DEG, 1e-12);
  // In water (n0 = 1.33) the cone is narrower: asin(√0.29 / 1.33)
  close(acceptanceAngle(1.5, 1.4, 1.33), Math.asin(Math.sqrt(0.29) / 1.33) / DEG, 1e-12);
  // NA ≥ n0: every launch angle is accepted.
  assert.equal(acceptanceAngle(1.6, 1.0, 1.0), 90);
  // No guiding when the cladding is not less dense than the core.
  assert.equal(numericalAperture(1.4, 1.5), null);
  assert.equal(acceptanceAngle(1.4, 1.4, 1.0), null);
});

test('fibre: guided just inside the acceptance angle, escapes just outside it', () => {
  const params = p({ scene: 'fibre', nCore: 1.5, nClad: 1.4, nOuter: 1 });
  const thetaA = Math.asin(Math.sqrt(1.5 ** 2 - 1.4 ** 2)) / DEG;
  const inside = solve({ ...params, angle: thetaA - 0.2 });
  assert.equal(inside.outputs.guided, 1);
  assert.ok(inside.main.events.filter((e) => e.tag === 'wall').every((e) => e.type === 'tir'));
  assert.ok(inside.outputs.tirCount >= 1);
  close(inside.outputs.acceptance, thetaA, 1e-12);
  const outside = solve({ ...params, angle: thetaA + 0.2 });
  assert.equal(outside.outputs.guided, 0);
  const firstWall = outside.main.events.find((e) => e.tag === 'wall');
  assert.equal(firstWall.type, 'refract', 'refracts into the cladding at the first bounce');
  assert.ok(firstWall.incidence < criticalAngle(1.5, 1.4));
  // Just past θc the ray grazes into the cladding (refracted at about 88°), so in this short fibre it
  // reaches the cladding's end face or the coating, never the core again.
  const after = outside.main.events.slice(outside.main.events.indexOf(firstWall) + 1);
  assert.ok(after.length > 0 && after.every((e) => e.tag === 'coating' || e.tag === 'exit-cladding'), 'stays out of the core');
});

test('fibre: a steep ray escapes at the first bounce', () => {
  const s = solve(p({ scene: 'fibre', angle: 50, nCore: 1.5, nClad: 1.4, nOuter: 1 }));
  // In the core: sin α = sin 50° / 1.5; at the wall φ = 90° − α = 59.29° < θc = 68.96°
  const alpha = Math.asin(Math.sin(50 * DEG) / 1.5) / DEG;
  close(s.outputs.wallAngle, 90 - alpha, 1e-9);
  close(s.outputs.critical, Math.asin(1.4 / 1.5) / DEG, 1e-12, 'θc at the core–cladding boundary');
  assert.ok(s.outputs.wallAngle < s.outputs.critical);
  assert.equal(s.outputs.guided, 0);
  assert.equal(s.outputs.tirCount, 0);
  close(s.outputs.refraction, alpha, 1e-9, 'angle in the core after the end face');
  const last = s.main.events.at(-1);
  assert.equal(last.type, 'absorbed', 'the coating absorbs the escaped light');
  assert.equal(last.tag, 'coating');
  assert.equal(s.main.status, 'absorbed');
});

test('fibre: the guided flag of the angle sweep matches full traces', () => {
  const params = p({ scene: 'fibre', nCore: 1.5, nClad: 1.4, nOuter: 1 });
  const table = sweep(params);
  const gi = table.columns.indexOf('Guided');
  for (const angle of [0, 5, 20, 32, 33, 45, 70]) {
    const row = table.rows.find((r) => r[0] === angle);
    assert.equal(row[gi] === 'yes' ? 1 : 0, solve({ ...params, angle }).outputs.guided, `launch at ${angle}°`);
  }
});

// ---- Scenes traced -------------------------------------------------------------------------------

test('two media: the traced ray obeys Snell at the interface', () => {
  const s = solve(p({ scene: 'boundary', angle: 30, n1: 1, n2: 1.5 }));
  close(s.outputs.incidence, 30, 1e-9);
  close(s.outputs.refraction, Math.asin(1 / 3) / DEG, 1e-9);
  close(s.outputs.reflectance, 100 * fresnelReflectance(1, 1.5, 30), 1e-9, 'reflected %');
  assert.equal(s.outputs.critical, null, 'no critical angle into a denser medium');
  assert.equal(s.outputs.tirCount, 0);
  // Direction of the refracted ray measured from the downward normal.
  const key = s.main.events[0];
  close(dirAngleFrom(key.dOut, [0, -1]), Math.asin(1 / 3) / DEG, 1e-9, 'geometric refraction angle');
});

test('two media: TIR from 1.50 into 1.00 at 45°, with the law of reflection', () => {
  const s = solve(p({ scene: 'boundary', angle: 45, n1: 1.5, n2: 1.0 }));
  assert.equal(s.outputs.tirCount, 1);
  assert.equal(s.outputs.refraction, null);
  assert.equal(s.outputs.reflectance, 100);
  close(s.outputs.critical, Math.asin(1 / 1.5) / DEG, 1e-12);
  const e = s.main.events[0];
  assert.equal(e.type, 'tir');
  // Reflected ray: angle of reflection = angle of incidence, on the incident side.
  close(e.dOut[0], Math.sin(45 * DEG), 1e-12);
  close(e.dOut[1], Math.cos(45 * DEG), 1e-12);
});

test('rectangular block: the emerging ray is parallel to the incident ray, shifted by t·sin(θ − r)/cos r', () => {
  const params = p({ scene: 'rect', angle: 30, nBlock: 1.5, nOuter: 1 });
  const s = solve(params);
  const scene = s.scene;
  const d0 = sourceDirection(scene, 30);
  const last = s.main.events.at(-1);
  assert.equal(s.main.events.length, 2, 'in through the top, out through the bottom');
  assert.equal(last.tag, 'bottom');
  close(last.dOut[0], d0[0], 1e-12, 'parallel x');
  close(last.dOut[1], d0[1], 1e-12, 'parallel y');
  close(s.outputs.refraction, Math.asin(1 / 3) / DEG, 1e-9);
  // Lateral shift between the incident line and the emerging line.
  const r = Math.asin(1 / 3);
  const expected = (scene.thickness * Math.sin(30 * DEG - r)) / Math.cos(r);
  const v = [last.point[0] - scene.pivot[0], last.point[1] - scene.pivot[1]];
  close(Math.abs(v[0] * d0[1] - v[1] * d0[0]), expected, 1e-9, 'lateral shift');
  close(s.outputs.critical, Math.asin(1 / 1.5) / DEG, 1e-12, 'θc for light leaving the block');
});

test('rectangular block: reversing the emerging ray retraces the path back to the ray box', () => {
  const params = p({ scene: 'rect', angle: 52, nBlock: 1.6, nOuter: 1 });
  const s = solve(params);
  const last = s.main.events.at(-1);
  const start = [last.point[0] + 3 * last.dOut[0], last.point[1] + 3 * last.dOut[1]];
  const back = trace(s.scene.boundaries, start, [-last.dOut[0], -last.dOut[1]]);
  const out = back.events.at(-1);
  const d0 = sourceDirection(s.scene, 52);
  close(out.dOut[0], -d0[0], 1e-12);
  close(out.dOut[1], -d0[1], 1e-12);
  close(out.point[0], s.scene.pivot[0], 1e-9, 'leaves at the entry point');
  close(out.point[1], s.scene.pivot[1], 1e-9);
});

test('semicircular block: undeviated through the curved face; refracts below θc and reflects totally above it', () => {
  const params = p({ scene: 'semi', nBlock: 1.5, nOuter: 1 });
  const c = Math.asin(1 / 1.5) / DEG;
  const below = solve({ ...params, angle: c - 0.5 });
  const curved = below.main.events[0];
  assert.equal(curved.tag, 'curved');
  close(curved.incidence, 0, 1e-6, 'aimed at the centre, the ray meets the curved face along a radius');
  close(curved.dOut[0], curved.dIn[0], 1e-12);
  close(curved.dOut[1], curved.dIn[1], 1e-12);
  close(below.outputs.incidence, c - 0.5, 1e-9, 'incidence at the flat face = angle set');
  close(below.outputs.refraction, Math.asin(1.5 * Math.sin((c - 0.5) * DEG)) / DEG, 1e-9);
  assert.equal(below.outputs.tirCount, 0);
  close(below.outputs.critical, 41.81, 0.01);

  const above = solve({ ...params, angle: c + 0.5 });
  assert.equal(above.outputs.tirCount, 1);
  assert.equal(above.outputs.refraction, null);
  const flat = above.main.events.find((e) => e.tag === 'flat');
  assert.equal(flat.type, 'tir');
  close(flat.point[0], 0, 1e-12, 'hits the centre of the flat face');
  close(flat.point[1], 0, 1e-12);
  // After TIR it leaves along another radius, again undeviated.
  const exit = above.main.events.at(-1);
  assert.equal(exit.tag, 'curved');
  close(exit.incidence, 0, 1e-6);
});

test('Snell holds at every refraction and TIR only happens beyond θc, in every scene', () => {
  let refractions = 0;
  let reflections = 0;
  for (const scene of SCENES) {
    for (const angle of [0, 10, 25, 40, 41.8, 55, 70, 89]) {
      for (const [a, b] of [[1, 1.5], [1.33, 1.9], [1.5, 1.4], [2.4, 1.0]]) {
        const s = solve(p({ scene, angle, n1: a, n2: b, nOuter: Math.min(a, b), nBlock: Math.max(a, b), nCore: Math.max(a, b), nClad: Math.min(a, b) }));
        for (const branch of [s.main, ...s.partials]) {
          for (const e of branch.events) {
            if (e.type === 'refract') {
              refractions += 1;
              close(e.n1 * Math.sin(e.incidence * DEG), e.n2 * Math.sin(e.refraction * DEG), 1e-12, `${scene} ${angle}°`);
            } else if (e.type === 'tir') {
              reflections += 1;
              assert.ok(e.n1 > e.n2 && e.incidence > Math.asin(e.n2 / e.n1) / DEG - 1e-9, `${scene} ${angle}° TIR beyond θc`);
            }
          }
          assert.ok(branch.events.length <= MAX_INTERACTIONS);
        }
      }
    }
  }
  assert.ok(refractions > 100 && reflections > 20, 'the sweep exercised both cases');
});

test('the tracer stops after 50 interactions', () => {
  // A glass slab (n = 1.5) in air with walls that never end: a ray at 60° to the normal bounces for ever.
  const walls = [seg([-1e6, -1], [1e6, -1], 1.5, 1.0, 'wall'), seg([1e6, 1], [-1e6, 1], 1.5, 1.0, 'wall')];
  const r = trace(walls, [0, 0], [Math.sin(60 * DEG), -Math.cos(60 * DEG)]);
  assert.equal(MAX_INTERACTIONS, 50);
  assert.equal(r.events.length, 50);
  assert.equal(r.status, 'limit');
  assert.ok(r.events.every((e) => e.type === 'tir'));
  assert.equal(r.points.length, 51);
});

test('partial reflections: one faint branch per refraction, with intensity R', () => {
  const s = solve(p({ scene: 'semi', angle: 30, nBlock: 1.5, nOuter: 1 }));
  // The curved face is met along a radius (its reflection would retrace the incident ray), so the only
  // branch is at the flat face.
  assert.equal(s.partials.length, 1);
  close(s.partials[0].intensity, fresnelReflectance(1.5, 1.0, 30), 1e-12);
  assert.equal(solve(p({ scene: 'semi', angle: 30, showPartial: false })).partials.length, 0);
});

test('dragging the ray box: angleFromPoint inverts sourcePosition in every scene', () => {
  for (const scene of SCENES) {
    const sc = buildScene(p({ scene }));
    for (const angle of [0, 12.5, 30, 41.8, 75, 89]) {
      const [x, y] = sourcePosition(sc, angle);
      close(angleFromPoint(sc, x, y), angle, 1e-9, `${scene} ${angle}°`);
      // The ray from the box reaches the pivot (the surface of interest).
      const d = sourceDirection(sc, angle);
      close(x + sc.sourceDistance * d[0], sc.pivot[0], 1e-12);
      close(y + sc.sourceDistance * d[1], sc.pivot[1], 1e-12);
    }
    // Points on the far side of the normal clamp to 0°; points past the surface clamp to the maximum.
    const n = sc.normal;
    const t = sc.tangent;
    assert.equal(angleFromPoint(sc, sc.pivot[0] + n[0] - t[0], sc.pivot[1] + n[1] - t[1]), 0);
    assert.equal(angleFromPoint(sc, sc.pivot[0] - n[0] + t[0], sc.pivot[1] - n[1] + t[1]), 89);
  }
});

test('sweep: angle table for the surface of interest, including the current angle', () => {
  const t = sweep(p({ scene: 'boundary', angle: 41.8, n1: 1.5, n2: 1.0 }));
  assert.deepEqual(t.columns.slice(0, 2), ['θᵢ (°)', 'θᵣ (°)']);
  const at = (a) => t.rows.find((r) => r[0] === a);
  close(at(30)[1], Math.asin(1.5 * 0.5) / DEG, 1e-12);
  assert.ok(at(41.8), 'the current angle is a row');
  assert.equal(at(42)[1], null, 'TIR rows have no refracted angle');
  for (let i = 1; i < t.rows.length; i++) assert.ok(t.rows[i][0] > t.rows[i - 1][0], 'sorted by angle');
});

test('deterministic: same params, same solution', () => {
  const params = p({ scene: 'fibre', angle: 27.3 });
  assert.deepEqual(solve(params), solve(params));
});

// ---- Review fixes: equal indices, and honest comparisons in the stage header ------------------------

test('equal indices: nothing reflects, so no faint branch and a 0% readout, in every scene', () => {
  // n₁ = n₂ means no boundary at all: Fresnel gives R = ((n − n)/(n + n))² = 0 at every angle.
  for (let k = 100; k <= 300; k++) {
    const n = k / 100;
    for (const a of [10, 30, 47, 60]) assert.equal(fresnelReflectance(n, n, a), 0, `n = ${n}, ${a}°`);
  }
  const same = (n) => ({ boundary: { n1: n, n2: n }, rect: { nBlock: n, nOuter: n }, semi: { nBlock: n, nOuter: n }, fibre: { nCore: n, nClad: n, nOuter: n } });
  for (const n of [1, 1.33, 1.5, 2.42, 3]) {
    for (const scene of SCENES) {
      for (const angle of [10, 30, 47, 60]) {
        const s = solve(p({ scene, angle, ...same(n)[scene] }));
        assert.equal(s.outputs.reflectance, 0, `${scene} n = ${n} at ${angle}°`);
        assert.equal(s.partials.length, 0, `${scene} n = ${n} at ${angle}°: no phantom reflection`);
        assert.equal(s.outputs.tirCount, 0);
      }
    }
  }
  // The reviewer's case: n₁ = n₂ = 1.33 at 47°.
  const s = solve(p({ scene: 'boundary', n1: 1.33, n2: 1.33, angle: 47 }));
  assert.equal(s.outputs.reflectance, 0);
  close(s.outputs.refraction, 47, 1e-9, 'straight through');
});

test('partial reflections weaker than the visible threshold are not traced', () => {
  assert.equal(PARTIAL_MIN_R, 0.005);
  let kept = 0;
  for (const scene of SCENES) {
    for (let angle = 0; angle <= 89; angle += 4) {
      for (const [a, b] of [[1, 1.5], [1.49, 1.5], [1.5, 1.4], [1.33, 1.34]]) {
        const s = solve(p({ scene, angle, n1: a, n2: b, nOuter: a, nBlock: b, nCore: b, nClad: a }));
        for (const branch of s.partials) {
          assert.ok(branch.intensity >= PARTIAL_MIN_R, `${scene} ${angle}°: ${branch.intensity}`);
          kept += 1;
        }
        // Every refraction of the main ray at or above the threshold (and off the normal) has its branch.
        const expected = s.main.events.filter((e) => e.type === 'refract' && e.incidence >= 1 && e.reflectance >= PARTIAL_MIN_R).length;
        assert.equal(s.partials.length, expected);
      }
    }
  }
  assert.ok(kept > 50);
  // 1.49 → 1.50 at normal-ish incidence reflects (0.01/2.99)² ≈ 0.001%: too faint to draw.
  assert.equal(solve(p({ scene: 'boundary', n1: 1.49, n2: 1.5, angle: 20 })).partials.length, 0);
});

test('numberPair adds decimals until two values print differently', () => {
  assert.deepEqual(numberPair(30, 19.47), ['30.0', '19.5']);
  assert.deepEqual(numberPair(41.8, Math.asin(1 / 1.5) / DEG), ['41.80', '41.81']);
  assert.deepEqual(numberPair(41.81, Math.asin(1 / 1.5) / DEG), ['41.8100', '41.8103']);
});

test('header: the critical-angle preset never reads "41.8° < θc = 41.8°"', () => {
  const s = solve(p({ scene: 'semi', angle: 41.8, nBlock: 1.5, nOuter: 1 }));
  const text = headerText(s).line2[0];
  assert.ok(text.includes('i = 41.80° < θc = 41.81°'), text);
  // TIR just past θc, shown to 2 d.p. as well.
  const t = headerText(solve(p({ scene: 'semi', angle: 41.82, nBlock: 1.5, nOuter: 1 }))).line2[0];
  assert.ok(t.includes('i = 41.82° > θc = 41.81°'), t);
});

test('header: exactly at the critical angle it says i = θc and that the ray grazes (r = 90.0°)', () => {
  // n = 2.00 into 1.00: θc = asin(1/2) = 30° exactly, so i = 30.0° is the critical angle.
  const s = solve(p({ scene: 'semi', angle: 30, nBlock: 2, nOuter: 1 }));
  close(s.outputs.critical, 30, 1e-12);
  close(s.outputs.refraction, 90, 1e-4);
  const { line2, alert } = headerText(s);
  assert.ok(line2[0].includes('i = θc = 30.0°') && line2[0].includes('grazes') && line2[0].includes('r = 90.0°'), line2[0]);
  assert.ok(!line2.some((l) => /[<>]/.test(l)), 'no < or > at equality');
  assert.equal(alert, true);
  // Two media, same physics.
  assert.ok(headerText(solve(p({ scene: 'boundary', angle: 30, n1: 2, n2: 1 }))).line2[0].includes('i = θc'));
});

test('header: every printed comparison with θc agrees with the numbers it prints', () => {
  // Sweep across θc in fine steps for the blocks, and across the acceptance angle for the fibre.
  const re = /(?:i|φ) = ([\d.]+)° ([<>]) θc = ([\d.]+)°/;
  let checked = 0;
  const check = (s) => {
    const m = headerText(s).line2[0].match(re);
    if (!m) return;
    const [x, op, y] = [Number(m[1]), m[2], Number(m[3])];
    assert.ok(op === '<' ? x < y : x > y, `${m[0]}`);
    checked += 1;
  };
  for (const nBlock of [1.33, 1.5, 2, 2.42]) {
    const c = Math.asin(1 / nBlock) / DEG;
    for (let d = -0.2; d <= 0.2; d += 0.01) {
      check(solve(p({ scene: 'semi', angle: Math.round((c + d) * 100) / 100, nBlock, nOuter: 1 })));
      check(solve(p({ scene: 'boundary', angle: Math.round((c + d) * 100) / 100, n1: nBlock, n2: 1 })));
    }
  }
  const thetaA = Math.asin(Math.sqrt(1.5 ** 2 - 1.4 ** 2)) / DEG;
  for (let d = -0.2; d <= 0.2; d += 0.01) check(solve(p({ scene: 'fibre', angle: Math.round((thetaA + d) * 100) / 100, nCore: 1.5, nClad: 1.4, nOuter: 1 })));
  assert.ok(checked > 300, `checked ${checked}`);
});
