// Statics engine tests: analytic answers from guide §9.1 plus each setup's key formula.
// Every expected number comes from a formula or a hand calculation written beside it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  solveLinear,
  presetTruss,
  parseTruss,
  encodeTruss,
  trussDeterminacy,
  solveTruss,
  withPointLoad,
  memberName,
  jointName,
  jointIndex,
  forceState,
  addJoint,
  moveJoint,
  toggleMember,
  cycleSupport,
  toggleLoad,
  removeJoint,
  makeBeam,
  beamReactions,
  solveBeam,
  shearAt,
  momentAt,
  rectSection,
  bendingStress,
  solveMoments,
  components,
  resultantOf,
  equilibrantOf,
  directionOf,
  threeForceBoom,
  solveIncline,
} from '../../site/assets/engines/statics/model.js';
import { meta } from '../../site/assets/engines/statics/index.js';
import { coerceParam } from '../../site/assets/state.js';

const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const SQRT3 = Math.sqrt(3);
const SQRT2 = Math.sqrt(2);

/** Force in the member joining two lettered joints. */
function force(truss, result, pair) {
  const k = truss.members.findIndex((m) => memberName(m) === pair || memberName([m[1], m[0]]) === pair);
  assert.ok(k >= 0, `member ${pair} exists`);
  return result.forces[k];
}
function reaction(result, letter) {
  return result.reactions.find((r) => r.joint === jointIndex(letter));
}
/** Every joint in equilibrium: Σ member forces + reactions + loads = 0 in x and y. */
function assertJointEquilibrium(truss, result, tol = 1e-9) {
  const sum = truss.joints.map(() => [0, 0]);
  truss.members.forEach(([a, b], k) => {
    const A = truss.joints[a];
    const B = truss.joints[b];
    const len = Math.hypot(B.x - A.x, B.y - A.y);
    const ux = (B.x - A.x) / len;
    const uy = (B.y - A.y) / len;
    sum[a][0] += result.forces[k] * ux;
    sum[a][1] += result.forces[k] * uy;
    sum[b][0] -= result.forces[k] * ux;
    sum[b][1] -= result.forces[k] * uy;
  });
  for (const r of result.reactions) {
    sum[r.joint][0] += r.rx;
    sum[r.joint][1] += r.ry;
  }
  for (const l of truss.loads) {
    sum[l.joint][0] += l.fx;
    sum[l.joint][1] += l.fy;
  }
  sum.forEach(([fx, fy], i) => {
    close(fx, 0, tol, `ΣFx at ${jointName(i)}`);
    close(fy, 0, tol, `ΣFy at ${jointName(i)}`);
  });
}

/* ---------------------------------------------------------------- linear algebra */

test('Gaussian elimination with partial pivoting solves a system with a zero first pivot', () => {
  // x = (1, 2, 3): A x = b computed by hand.
  const A = [
    [0, 2, 1],
    [1, 1, 1],
    [2, 1, 0],
  ];
  const b = [2 * 2 + 3, 1 + 2 + 3, 2 + 2];
  const { ok, x } = solveLinear(A, b);
  assert.ok(ok);
  close(x[0], 1, 1e-12);
  close(x[1], 2, 1e-12);
  close(x[2], 3, 1e-12);
  assert.deepEqual(A[0], [0, 2, 1], 'input not changed');
});

test('a singular system is reported, not solved', () => {
  const r = solveLinear(
    [
      [1, 2],
      [2, 4],
    ],
    [1, 2],
  );
  assert.equal(r.ok, false);
});

/* ---------------------------------------------------------------- trusses (§9.1) */

for (const P of [1, 10, 37.5]) {
  test(`equilateral truss, apex load P = ${P}: reactions P/2, inclined −P/√3, base +P/(2√3) (1e-9)`, () => {
    const base = presetTruss('equilateral', { span: 4 });
    const { truss } = withPointLoad(base, { load: P, loadAt: 'C', loadAngle: 0 });
    const res = solveTruss(truss);
    assert.equal(res.status, 'solved');
    // Symmetry: RA = RB = P/2, no horizontal reaction at the pin.
    close(reaction(res, 'A').ry, P / 2, 1e-9 * P, 'RA');
    close(reaction(res, 'B').ry, P / 2, 1e-9 * P, 'RB');
    close(reaction(res, 'A').rx, 0, 1e-9 * P, 'Ax');
    // Joint C: 2 F sin 60° = −P → F = −P/√3 = −0.5774P (compression).
    close(force(truss, res, 'AC'), -P / SQRT3, 1e-9 * P, 'AC');
    close(force(truss, res, 'BC'), -P / SQRT3, 1e-9 * P, 'BC');
    // Joint A: F_AB = −F_AC cos 60° = P/(2√3) = +0.2887P (tension).
    close(force(truss, res, 'AB'), P / (2 * SQRT3), 1e-9 * P, 'AB');
    // The rounded values quoted in the guide.
    close(force(truss, res, 'AC') / P, -0.5774, 5e-5);
    close(force(truss, res, 'AB') / P, 0.2887, 5e-5);
    assert.equal(forceState(force(truss, res, 'AC')), 'C');
    assert.equal(forceState(force(truss, res, 'AB')), 'T');
    assertJointEquilibrium(truss, res, 1e-9 * P);
  });
}

test('equilateral truss from the text encoding gives the same forces', () => {
  const parsed = parseTruss(`j:0,0 4,0 2,${2 * SQRT3};m:AB AC BC;s:Ap Br;l:C0,-10`);
  assert.ok(parsed.ok, parsed.error);
  const res = solveTruss(parsed.truss);
  close(force(parsed.truss, res, 'AC'), -10 / SQRT3, 1e-9);
  close(force(parsed.truss, res, 'AB'), 10 / (2 * SQRT3), 1e-9);
});

test('square frame without a diagonal is a mechanism: reported, never solved, no NaN', () => {
  const truss = withPointLoad(presetTruss('mechanism', { span: 4, height: 4 }), { load: 10, loadAt: 'C' }).truss;
  const det = trussDeterminacy(truss);
  assert.deepEqual([det.m, det.r, det.j], [4, 3, 4]);
  assert.equal(det.index, -1); // m + r = 7 < 2j = 8
  assert.equal(det.kind, 'mechanism');
  const res = solveTruss(truss);
  assert.equal(res.status, 'mechanism');
  assert.equal(res.forces, null);
  assert.equal(res.reactions, null);
  assert.match(res.message, /Mechanism/);
  assert.match(res.message, /7/);
  assert.match(res.message, /2j = 8/);
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(res)));
});

test('adding one diagonal makes the frame determinate; two diagonals make it indeterminate', () => {
  const frame = presetTruss('mechanism', { span: 4, height: 4 });
  const one = toggleMember(frame, 0, 2);
  assert.equal(trussDeterminacy(one).kind, 'determinate');
  assert.equal(solveTruss(withPointLoad(one, { load: 10, loadAt: 'C' }).truss).status, 'solved');
  const braced = presetTruss('braced', { span: 4, height: 4 });
  const det = trussDeterminacy(braced);
  assert.equal(det.index, 1); // m + r = 9 > 2j = 8
  const res = solveTruss(withPointLoad(braced, { load: 10, loadAt: 'C' }).truss);
  assert.equal(res.status, 'indeterminate');
  assert.equal(res.forces, null);
  assert.match(res.message, /indeterminate/);
});

test('m + r = 2j but unstable geometry (three rollers) is reported as unstable', () => {
  const parsed = parseTruss('j:0,0 4,0 2,3;m:AB AC BC;s:Ar Br Cr;l:C0,-10');
  assert.ok(parsed.ok);
  assert.equal(trussDeterminacy(parsed.truss).kind, 'determinate');
  const res = solveTruss(parsed.truss);
  assert.equal(res.status, 'unstable');
  assert.equal(res.forces, null);
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(res)));
});

test('Pratt truss, 4 panels of 3 m, height 3 m, central load P: hand-calculated member forces', () => {
  const P = 20;
  const truss = withPointLoad(presetTruss('pratt', { span: 12, height: 3, panels: 4 }), { load: P, loadAt: 'C' }).truss;
  // Joints: A B C D E along the bottom (x = 0, 3, 6, 9, 12), F G H on top (x = 3, 6, 9).
  assert.equal(trussDeterminacy(truss).kind, 'determinate');
  const res = solveTruss(truss);
  assert.equal(res.status, 'solved');
  close(reaction(res, 'A').ry, P / 2, 1e-9);
  close(reaction(res, 'E').ry, P / 2, 1e-9);
  // Joint A: end post AF at 45°: F sin 45° = −P/2 → −P/√2; AB = +P/2.
  close(force(truss, res, 'AF'), -P / SQRT2, 1e-9, 'AF');
  close(force(truss, res, 'AB'), P / 2, 1e-9, 'AB');
  // Joint B (unloaded, chord straight through): the vertical BF carries nothing.
  close(force(truss, res, 'BF'), 0, 1e-9, 'BF');
  // Section through panel 2: moments about C give FG = −(P/2 × 6)/3 = −P; vertical balance gives FC = +P/√2.
  close(force(truss, res, 'FG'), -P, 1e-9, 'FG');
  close(force(truss, res, 'CF'), P / SQRT2, 1e-9, 'CF (Pratt diagonal in tension)');
  // Joint G (unloaded, top chord straight through): the vertical CG carries nothing.
  close(force(truss, res, 'CG'), 0, 1e-9, 'CG');
  assertJointEquilibrium(truss, res);
});

test('Howe truss, same geometry and load: diagonals in compression, verticals in tension', () => {
  const P = 20;
  const truss = withPointLoad(presetTruss('howe', { span: 12, height: 3, panels: 4 }), { load: P, loadAt: 'C' }).truss;
  const res = solveTruss(truss);
  assert.equal(res.status, 'solved');
  // Joint C: the vertical CG holds the load: +P. Section through panel 2: BG = −P/√2 (compression);
  // moments about G: BC = (P/2 × 6)/3 = P; moments about B: FG = −(P/2 × 3)/3 = −P/2; joint F: BF = +P/2.
  close(force(truss, res, 'CG'), P, 1e-9, 'CG');
  close(force(truss, res, 'BG'), -P / SQRT2, 1e-9, 'BG');
  close(force(truss, res, 'BC'), P, 1e-9, 'BC');
  close(force(truss, res, 'FG'), -P / 2, 1e-9, 'FG');
  close(force(truss, res, 'BF'), P / 2, 1e-9, 'BF');
  assertJointEquilibrium(truss, res);
});

test('Warren truss: end diagonal −P√5/4 and end chord +P/4 for a central load (height 3, panels of 3 m)', () => {
  const P = 12;
  const truss = withPointLoad(presetTruss('warren', { span: 12, height: 3, panels: 4 }), { load: P, loadAt: 'C' }).truss;
  const res = solveTruss(truss);
  assert.equal(res.status, 'solved');
  // AF rises 3 m over 1.5 m: sin = 2/√5, cos = 1/√5. Joint A: AF = −(P/2)/sin = −P√5/4; AB = −AF cos = P/4.
  close(force(truss, res, 'AF'), (-P * Math.sqrt(5)) / 4, 1e-9);
  close(force(truss, res, 'AB'), P / 4, 1e-9);
  assertJointEquilibrium(truss, res);
});

test('wall bracket (3-4-5): tie +4P/3, strut −5P/3, wall reactions balance the load', () => {
  const P = 9;
  const truss = withPointLoad(presetTruss('bracket', { span: 4, height: 3 }), { load: P, loadAt: 'C' }).truss;
  const res = solveTruss(truss);
  assert.equal(res.status, 'solved');
  // Joint C: BC (3-4-5) vertical part 3/5 balances P → BC = −5P/3; AC balances BC's horizontal part → 4P/3.
  close(force(truss, res, 'AC'), (4 * P) / 3, 1e-9);
  close(force(truss, res, 'BC'), (-5 * P) / 3, 1e-9);
  close(reaction(res, 'A').rx + reaction(res, 'B').rx, 0, 1e-9);
  close(reaction(res, 'A').ry + reaction(res, 'B').ry, P, 1e-9);
});

test('a sloping load: the pin takes the horizontal component, reactions balance the load', () => {
  const P = 10;
  const { truss, added } = withPointLoad(presetTruss('warren', { span: 12, height: 3, panels: 4 }), { load: P, loadAt: 'G', loadAngle: 30 });
  close(added.fx, P * 0.5, 1e-12); // sin 30° = 1/2
  close(added.fy, -P * (SQRT3 / 2), 1e-12);
  const res = solveTruss(truss);
  close(reaction(res, 'A').rx, -P / 2, 1e-9, 'pin takes −P sin 30°');
  close(reaction(res, 'A').ry + reaction(res, 'E').ry, P * (SQRT3 / 2), 1e-9);
  assertJointEquilibrium(truss, res);
});

test('every preset at several sizes: determinacy as expected and joint equilibrium to 1e-9', () => {
  for (const kind of ['equilateral', 'warren', 'pratt', 'howe', 'bracket']) {
    for (const panels of [2, 3, 4, 5, 6, 8]) {
      const base = presetTruss(kind, { span: 10, height: 2.5, panels });
      const at = jointName(Math.min(2, base.joints.length - 1));
      const { truss } = withPointLoad(base, { load: 15, loadAt: at, loadAngle: -20 });
      assert.equal(trussDeterminacy(truss).kind, 'determinate', `${kind} ${panels}`);
      const res = solveTruss(truss);
      assert.equal(res.status, 'solved', `${kind} ${panels}`);
      assertJointEquilibrium(truss, res);
    }
  }
});

test('a load at a missing joint is not applied', () => {
  const r = withPointLoad(presetTruss('equilateral', { span: 4 }), { load: 10, loadAt: 'Q' });
  assert.equal(r.added, null);
  assert.equal(r.missingJoint, true);
  assert.equal(r.truss.loads.length, 0);
});

/* ---------------------------------------------------------------- truss text encoding */

test('encoding round trip keeps joints, members, supports and loads', () => {
  const src = 'j:0,0 4,0 8,0 2,3 6,3;m:AB BC AD BD DE BE CE;s:Ap Cr;l:D0,-10 E2.5,-7.25';
  const p = parseTruss(src);
  assert.ok(p.ok, p.error);
  assert.equal(p.truss.joints.length, 5);
  assert.deepEqual(p.truss.members[2], [0, 3]);
  assert.deepEqual(p.truss.supports, [
    { joint: 0, type: 'pin' },
    { joint: 2, type: 'roller' },
  ]);
  assert.deepEqual(p.truss.loads[1], { joint: 4, fx: 2.5, fy: -7.25 });
  assert.equal(encodeTruss(p.truss), src);
  // Presets encode and parse back to the same geometry (to 4 decimals).
  for (const kind of ['warren', 'pratt', 'howe', 'bracket', 'mechanism', 'braced']) {
    const t = presetTruss(kind, { span: 12, height: 3, panels: 4 });
    const back = parseTruss(encodeTruss(t));
    assert.ok(back.ok, back.error);
    assert.deepEqual(back.truss, t, kind);
  }
});

test('the parser is forgiving about spacing and case, and calm about mistakes', () => {
  const ok = parseTruss('  J: 0,0   4,0  2,3 ; m: ab Ac bc ; S: ap BR ');
  assert.ok(ok.ok, ok.error);
  assert.equal(ok.truss.members.length, 3);
  assert.deepEqual(ok.truss.supports[1], { joint: 1, type: 'roller' });
  const bad = [
    ['', /empty/],
    ['m:AB', /joints first/],
    ['j:0,0 4', /two numbers/],
    ['j:0,0 4,0;m:AC', /isn't listed/],
    ['j:0,0 4,0;m:AA', /itself/],
    ['j:0,0 4,0;m:AB BA', /twice/],
    ['j:0,0 0,0', /same point/],
    ['j:0,0 4,0;s:Ax', /p \(pin\)/],
    ['j:0,0 4,0;s:Ap Ar', /two supports/],
    ['j:0,0 4,0;l:B10', /fx,fy/],
    ['j:0,0 4,0;q:1', /should start with/],
    ['j:0,0 4,0;j:1,1', /twice/],
    [`j:${Array.from({ length: 27 }, (_, i) => `${i},0`).join(' ')}`, /limit is 26/],
    ['j:0,0 1e3,0', /two numbers/],
  ];
  for (const [src, re] of bad) {
    const r = parseTruss(src);
    assert.equal(r.ok, false, src);
    assert.match(r.error, re, src);
  }
});

test('editing helpers: add, move, connect, support and delete keep the lettering consistent', () => {
  let t = parseTruss('j:0,0 4,0;m:AB;s:Ap Br').truss;
  t = addJoint(t, 2, 3);
  assert.equal(t.joints.length, 3);
  assert.equal(addJoint(t, 2, 3), null, 'no second joint on the same point');
  t = toggleMember(t, 0, 2);
  t = toggleMember(t, 2, 1);
  assert.equal(encodeTruss(t), 'j:0,0 4,0 2,3;m:AB AC BC;s:Ap Br');
  assert.equal(trussDeterminacy(t).kind, 'determinate');
  t = moveJoint(t, 2, 2, 4);
  assert.equal(t.joints[2].y, 4);
  // Support cycle: none → pin → roller → side roller → none.
  let s = cycleSupport(t, 2);
  assert.equal(s.supports.find((x) => x.joint === 2).type, 'pin');
  s = cycleSupport(cycleSupport(cycleSupport(s, 2), 2), 2);
  assert.equal(s.supports.find((x) => x.joint === 2), undefined);
  // Deleting A removes AB and AC and its support; B and C become A and B.
  const d = removeJoint(t, 0);
  assert.equal(encodeTruss(d), 'j:4,0 2,4;m:AB;s:Ar');
  // Toggling an existing member removes it.
  assert.equal(toggleMember(t, 1, 0).members.length, 2);
  // Extra loads: add, then the same click removes them; they solve with the structure.
  const loaded = toggleLoad(t, 2, 0, -12);
  assert.equal(encodeTruss(loaded), 'j:0,0 4,0 2,4;m:AB AC BC;s:Ap Br;l:C0,-12');
  const res = solveTruss(loaded);
  close(res.reactions[0].ry + res.reactions[1].ry, 12, 1e-12);
  assert.equal(toggleLoad(loaded, 2, 0, -12).loads.length, 0);
});

/* ---------------------------------------------------------------- beams (§9.1) */

test('simply supported beam, central point load P: reactions P/2 and M_max = PL/4 at mid-span', () => {
  for (const [P, L] of [
    [10, 6],
    [25, 8.4],
  ]) {
    const beam = makeBeam({ type: 'simple', L, points: [{ x: L / 2, P }] });
    const res = solveBeam(beam);
    close(res.R.RA, P / 2, 1e-9);
    close(res.R.RB, P / 2, 1e-9);
    close(res.maxMoment, (P * L) / 4, 1e-9 * P * L);
    close(res.maxMomentAt, L / 2, 1e-12);
    close(res.maxShear, P / 2, 1e-9);
  }
});

test('simply supported beam, full UDL w: M_max = wL²/8 at mid-span, reactions wL/2', () => {
  const w = 5;
  const L = 6;
  const beam = makeBeam({ type: 'simple', L, udls: [{ x1: 0, x2: L, w }] });
  const res = solveBeam(beam);
  close(res.R.RA, (w * L) / 2, 1e-9);
  close(res.maxMoment, (w * L * L) / 8, 1e-9); // 22.5 kN·m
  close(res.maxMomentAt, L / 2, 1e-9);
  // V is linear: V(x) = wL/2 − wx.
  close(shearAt(beam, res.R, 1.5), (w * L) / 2 - w * 1.5, 1e-12);
  // M(x) = (wx/2)(L − x).
  close(momentAt(beam, res.R, 2), ((w * 2) / 2) * (L - 2), 1e-12);
});

test('cantilever with an end load P: wall reaction P, root (fixing) moment PL, hogging', () => {
  for (const [P, L] of [
    [10, 3],
    [4.5, 7],
  ]) {
    const beam = makeBeam({ type: 'cantilever', L, points: [{ x: L, P }] });
    const res = solveBeam(beam);
    close(res.R.RA, P, 1e-12);
    close(res.R.MA, P * L, 1e-9);
    close(momentAt(beam, res.R, 0), -P * L, 1e-9, 'M(0) = −PL (hogging)');
    close(res.maxMoment, -P * L, 1e-9);
    close(res.maxMomentAt, 0, 1e-12);
    close(momentAt(beam, res.R, L), 0, 1e-9, 'free end');
    close(shearAt(beam, res.R, L / 2), P, 1e-12);
  }
});

test('cantilever with a full UDL: fixing moment wL²/2 and wall reaction wL', () => {
  const beam = makeBeam({ type: 'cantilever', L: 4, udls: [{ x1: 0, x2: 4, w: 3 }] });
  const res = solveBeam(beam);
  close(res.R.RA, 12, 1e-12);
  close(res.R.MA, (3 * 16) / 2, 1e-9);
  close(res.maxMoment, -24, 1e-9);
});

test('off-centre point load: RA = Pb/L, RB = Pa/L, M_max = Pab/L under the load; shear jumps by P', () => {
  const P = 12;
  const L = 8;
  const a = 2;
  const b = L - a;
  const beam = makeBeam({ type: 'simple', L, points: [{ x: a, P }] });
  const res = solveBeam(beam);
  close(res.R.RA, (P * b) / L, 1e-12);
  close(res.R.RB, (P * a) / L, 1e-12);
  close(res.maxMoment, (P * a * b) / L, 1e-9);
  close(res.maxMomentAt, a, 1e-12);
  close(shearAt(beam, res.R, a, 'left') - shearAt(beam, res.R, a, 'right'), P, 1e-12);
  close(shearAt(beam, res.R, L, 'left'), -res.R.RB, 1e-12, 'V just left of B = −RB');
  close(shearAt(beam, res.R, L, 'right'), 0, 1e-12, 'closes to zero');
});

test('partial UDL plus a point load: hand-calculated reactions and the maximum where V = 0', () => {
  // L = 10, w = 4 kN/m on [2, 6] (16 kN at x = 4), P = 10 kN at x = 8.
  // RB = (16 × 4 + 10 × 8)/10 = 14.4; RA = 26 − 14.4 = 11.6.
  // V = 0 inside the UDL where 11.6 − 4(x − 2) = 0 → x = 4.9; M = 11.6 × 4.9 − 4 × 2.9²/2 = 56.84 − 16.82 = 40.02.
  // Under P: M(8) = RB × 2 = 28.8, smaller.
  const beam = makeBeam({ type: 'simple', L: 10, points: [{ x: 8, P: 10 }], udls: [{ x1: 2, x2: 6, w: 4 }] });
  const res = solveBeam(beam);
  close(res.R.RB, 14.4, 1e-9);
  close(res.R.RA, 11.6, 1e-9);
  close(res.maxMomentAt, 4.9, 1e-9);
  close(res.maxMoment, 40.02, 1e-9);
  close(momentAt(beam, res.R, 8), 28.8, 1e-9);
  // Samples include both sides of the jump at the point load.
  const at8 = res.samples.filter((s) => s.x === 8).map((s) => s.V);
  assert.ok(at8.includes(11.6 - 16) && at8.includes(11.6 - 26), `jump at P: ${at8}`);
});

test('bending stress σ = My/I for a rectangular section', () => {
  // b = 100 mm, d = 200 mm: I = 100 × 200³/12 = 6.667 × 10⁷ mm⁴, y = 100 mm.
  const s = rectSection(100, 200);
  close(s.I, (100 * 200 ** 3) / 12, 1e-6);
  assert.equal(s.y, 100);
  // M = 15 kN·m = 15 × 10⁶ N·mm: σ = 15e6 × 100 / 6.667e7 = 22.5 MPa.
  close(bendingStress(15, s.y, s.I), 22.5, 1e-9);
});

test('loads past the end of the beam are applied at the end and flagged', () => {
  const beam = makeBeam({ type: 'simple', L: 4, points: [{ x: 6, P: 5 }] });
  assert.equal(beam.points[0].x, 4);
  assert.equal(beam.points[0].outside, true);
  const R = beamReactions(beam);
  close(R.RB, 5, 1e-12);
  close(R.RA, 0, 1e-12);
});

/* ---------------------------------------------------------------- moments */

test('moments: reactions from ΣM_A = 0, and Σ clockwise = Σ anticlockwise about any point', () => {
  // L = 6, A at 0, B at 6; 10 kN at 1.5 m and 6 kN at 4 m.
  // ΣM_A = 0: 6 RB = 10 × 1.5 + 6 × 4 = 39 → RB = 6.5; RA = 16 − 6.5 = 9.5.
  const loads = [
    { name: 'F1', x: 1.5, P: 10 },
    { name: 'F2', x: 4, P: 6 },
  ];
  for (const pivotX of [0, 6, 2.7, -1]) {
    const res = solveMoments({ xA: 0, xB: 6, loads, pivotX, convention: 'cw' });
    assert.ok(res.ok);
    close(res.RB, 6.5, 1e-12);
    close(res.RA, 9.5, 1e-12);
    close(res.net, 0, 1e-9, `net about ${pivotX}`);
    close(res.sumCw, res.sumAcw, 1e-9);
  }
  // About A: loads give 15 + 24 = 39 kN·m clockwise; RB gives 39 anticlockwise.
  const aboutA = solveMoments({ xA: 0, xB: 6, loads, pivotX: 0, convention: 'cw' });
  close(aboutA.loadMoment, 39, 1e-12);
  close(aboutA.sumCw, 39, 1e-12);
  const rb = aboutA.terms.find((t) => t.name === 'R_B');
  close(rb.moment, -39, 1e-12);
  assert.equal(rb.sense, 'acw');
  assert.equal(aboutA.terms.find((t) => t.name === 'R_A').sense, 'none');
});

test('moments: the anticlockwise-positive convention flips every sign', () => {
  const loads = [{ name: 'F1', x: 4, P: 5 }];
  const cw = solveMoments({ xA: 0, xB: 6, loads, pivotX: 0, convention: 'cw' });
  const acw = solveMoments({ xA: 0, xB: 6, loads, pivotX: 0, convention: 'acw' });
  close(cw.terms[0].moment, 20, 1e-12); // 5 kN × 4 m, clockwise
  close(acw.terms[0].moment, -20, 1e-12);
  assert.equal(acw.terms[0].sense, 'cw');
  close(acw.loadMoment, -20, 1e-12);
});

test('moments: an overhanging load lifts the far support (negative reaction)', () => {
  // A at 0, B at 4; 10 kN at 6: RB = 60/4 = 15, RA = 10 − 15 = −5 (A must hold the beam down).
  const res = solveMoments({ xA: 0, xB: 4, loads: [{ name: 'F1', x: 6, P: 10 }], pivotX: 0 });
  close(res.RB, 15, 1e-12);
  close(res.RA, -5, 1e-12);
  assert.equal(solveMoments({ xA: 2, xB: 2, loads: [], pivotX: 0 }).ok, false);
});

/* ---------------------------------------------------------------- concurrent forces */

test('resultant of 3 N along x and 4 N along y is 5 N at 53.13°; the equilibrant is opposite', () => {
  const forces = [
    { F: 3, angle: 0 },
    { F: 4, angle: 90 },
  ];
  const r = resultantOf(forces);
  close(r.magnitude, 5, 1e-12);
  close(r.angle, (Math.atan2(4, 3) * 180) / Math.PI, 1e-12);
  const e = equilibrantOf(forces);
  close(e.magnitude, 5, 1e-12);
  close(e.angle, r.angle - 180, 1e-12);
  close(e.fx, -3, 1e-12);
  close(e.fy, -4, 1e-12);
});

test('three equal forces 120° apart are in equilibrium (closed triangle)', () => {
  const r = resultantOf([
    { F: 50, angle: 90 },
    { F: 50, angle: -150 },
    { F: 50, angle: -30 },
  ]);
  assert.equal(r.magnitude, 0);
  assert.equal(r.angle, 0);
});

test('components and directions: exact at multiples of 90°, angles in (−180°, 180°]', () => {
  assert.deepEqual(components(10, 90), { fx: 0, fy: 10 });
  assert.deepEqual(components(10, 180), { fx: -10, fy: 0 });
  close(components(10, 30).fx, 5 * SQRT3, 1e-12);
  assert.equal(directionOf(-1, 0), 180);
  assert.equal(directionOf(0, -2), -90);
});

test('three-force rule: hinged boom with a cable; the pin reaction passes through O', () => {
  // L = 4, h = 3 (cable 5 m), W = 10 kN at a = 2.
  // ΣM_A: T × (L h / 5) = W a → T × 2.4 = 20 → T = 8.333 kN; Ty = T × 3/5 = 5; Tx = −T × 4/5 = −6.667.
  // Pin: Ax = 6.667, Ay = 10 − 5 = 5. O = (2, 3 × (1 − 2/4)) = (2, 1.5); A→O ∥ (6.667, 5).
  const r = threeForceBoom({ L: 4, h: 3, W: 10, a: 2 });
  close(r.T, 25 / 3, 1e-12);
  close(r.Ty, 5, 1e-12);
  close(r.Tx, -20 / 3, 1e-12);
  close(r.Ax, 20 / 3, 1e-12);
  close(r.Ay, 5, 1e-12);
  close(r.O.x, 2, 1e-12);
  close(r.O.y, 1.5, 1e-12);
  // Concurrency: A→O is parallel to the reaction (cross product 0), and O lies on the cable line.
  close(r.O.x * r.Ay - r.O.y * r.Ax, 0, 1e-12);
  close(r.O.y - 3 * (1 - r.O.x / 4), 0, 1e-12);
  // Equilibrium of the three forces.
  close(r.Ax + r.Tx, 0, 1e-12);
  close(r.Ay + r.Ty - 10, 0, 1e-12);
  // Load at the tip: the lines meet at B and the pin reaction is horizontal, W a/h = 13.33 kN.
  const tip = threeForceBoom({ L: 4, h: 3, W: 10, a: 4 });
  close(tip.Ay, 0, 1e-12);
  close(tip.Ax, 40 / 3, 1e-12);
  close(tip.T, 50 / 3, 1e-12);
});

/* ---------------------------------------------------------------- incline (§9.1) */

test('block slips if and only if tan θ > μs (no applied force)', () => {
  let checked = 0;
  for (let deg = 0; deg <= 80; deg += 0.25) {
    for (const muS of [0, 0.1, 0.25, 0.3, 0.5, 0.577, 0.7, 1, 1.2, 1.5]) {
      const tan = Math.tan((deg * Math.PI) / 180);
      if (Math.abs(tan - muS) < 1e-9) continue; // exactly on the boundary: float rounding decides
      const r = solveIncline({ angle: deg, mass: 5, muS, muK: muS * 0.8, g: 10 });
      assert.equal(r.slipping, tan > muS, `θ = ${deg}°, μs = ${muS}`);
      checked += 1;
    }
  }
  assert.ok(checked > 3000);
  // Just either side of the angle of repose tan⁻¹ 0.5 = 26.565°.
  const repose = (Math.atan(0.5) * 180) / Math.PI;
  assert.equal(solveIncline({ angle: repose - 1e-6, mass: 2, muS: 0.5, muK: 0.4, g: 9.8 }).slipping, false);
  assert.equal(solveIncline({ angle: repose + 1e-6, mass: 2, muS: 0.5, muK: 0.4, g: 9.8 }).slipping, true);
  close(solveIncline({ angle: 10, mass: 1, muS: 0.5, muK: 0.4, g: 10 }).reposeAngle, repose, 1e-12);
});

test('at rest, static friction equals W sin θ (not μs N)', () => {
  // m = 5, g = 10, θ = 20°: f = 50 sin 20° = 17.101 N; N = 50 cos 20° = 46.985 N; μs N = 23.49 N.
  const r = solveIncline({ angle: 20, mass: 5, muS: 0.5, muK: 0.4, g: 10 });
  assert.equal(r.slipping, false);
  close(r.friction, 50 * Math.sin((20 * Math.PI) / 180), 1e-12);
  close(r.N, 50 * Math.cos((20 * Math.PI) / 180), 1e-12);
  close(r.frictionMax, 0.5 * r.N, 1e-12);
  assert.equal(r.a, 0);
});

test('sliding down: a = g (sin θ − μk cos θ)', () => {
  // θ = 30°, μs = 0.3, μk = 0.2, g = 9.8: a = 9.8 (0.5 − 0.2 × 0.8660) = 3.2026 m/s² down the slope.
  const r = solveIncline({ angle: 30, mass: 3, muS: 0.3, muK: 0.2, g: 9.8 });
  assert.equal(r.slipping, true);
  assert.equal(r.direction, 'down');
  close(r.a, -9.8 * (0.5 - 0.2 * (SQRT3 / 2)), 1e-12);
  close(r.friction, 0.2 * r.N, 1e-12, 'kinetic friction acts up the slope');
});

test('horizontal plane with an applied horizontal force: static, limiting, then kinetic friction', () => {
  // m = 10, g = 10, μs = 0.4, μk = 0.3: N = 100, μs N = 40, μk N = 30.
  const base = { angle: 0, mass: 10, muS: 0.4, muK: 0.3, g: 10, appliedAngle: 0 };
  const r30 = solveIncline({ ...base, applied: 30 });
  assert.equal(r30.slipping, false);
  close(r30.friction, -30, 1e-12);
  assert.equal(solveIncline({ ...base, applied: 40 }).slipping, false, 'limiting: F = μs N holds');
  const r50 = solveIncline({ ...base, applied: 50 });
  assert.equal(r50.slipping, true);
  assert.equal(r50.direction, 'up');
  close(r50.a, (50 - 30) / 10, 1e-12); // 2 m/s²
  assert.equal(r50.N, 100);
});

test('an applied force pulling up at an angle reduces N; enough of it lifts the block off', () => {
  // θ = 0, m = 10, g = 10, F = 50 N at 30° above the surface: N = 100 − 25 = 75.
  const r = solveIncline({ angle: 0, mass: 10, muS: 0.5, muK: 0.4, g: 10, applied: 50, appliedAngle: 30 });
  close(r.N, 75, 1e-12);
  const off = solveIncline({ angle: 0, mass: 1, muS: 0.5, muK: 0.4, g: 10, applied: 50, appliedAngle: 90 });
  assert.equal(off.liftsOff, true);
  assert.equal(off.a, null);
  assert.ok(!/NaN/.test(JSON.stringify(off)));
});

test('μk larger than μs is capped at μs for the sliding calculation and flagged', () => {
  const r = solveIncline({ angle: 40, mass: 1, muS: 0.3, muK: 0.6, g: 10 });
  assert.equal(r.muKCapped, true);
  assert.equal(r.muKUsed, 0.3);
  assert.ok(r.a < 0);
});

/* ---------------------------------------------------------------- meta */

test('meta: every setup is static, every param is valid, and the default truss text parses', () => {
  assert.deepEqual([...meta.staticSetups].sort(), [...meta.setups].sort());
  assert.deepEqual(meta.setups, ['truss', 'beam', 'concurrent', 'moments', 'incline']);
  for (const [key, spec] of Object.entries(meta.params)) assert.ok(coerceParam(spec, spec.default).ok, key);
  const def = parseTruss(meta.params.truss.default);
  assert.ok(def.ok, def.error);
  assert.equal(meta.params.g.default, 10);
  assert.ok(meta.params.truss.maxLength >= 1500);
  assert.ok(coerceParam(meta.params.truss, 'j:0,0 4,0 2,3;m:AB AC BC;s:Ap Br;l:C0,-10').ok);
});
