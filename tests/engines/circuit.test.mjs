// Circuit engine tests (guide §9.1): hand-calculated answers for resistive DC circuits.
// Every expected number comes from Ohm's law, series/parallel rules or Kirchhoff's laws worked by hand
// in the comment beside it, never from running the code and pasting the result.
//
// Netlist reminder (full description in site/assets/engines/circuit/index.js): parts joined by "_";
// each part is <code>-x1-y1-x2-y2 on a grid with y downwards. B<emf>[r<r>] cell, R<Ω> resistor,
// L<Ω> lamp, S1/S0 closed/open switch, A ammeter, V voltmeter, W wire. For B, A and V the FIRST point
// is the + terminal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID,
  DT,
  DOT_SPACING,
  DOT_MAX_SPEED,
  NETLIST_PATTERN,
  NETLIST_MAX,
  PRESETS,
  parseNetlist,
  formatNetlist,
  partNames,
  matchPreset,
  solve,
  outputs,
  dataTable,
  describe,
  placementProblem,
  addPart,
  movePart,
  moveEnd,
  rotatePart,
  removePart,
  updatePart,
  partAt,
  nodeAt,
  snapAxis,
  dotPhase,
  dotSpeed,
  createState,
  advance,
} from '../../site/assets/engines/circuit/model.js';
import { meta } from '../../site/assets/engines/circuit/index.js';

const close = (actual, expected, tol, msg = '') =>
  assert.ok(typeof actual === 'number' && Math.abs(actual - expected) <= tol, `${msg} expected ${expected}, got ${actual}`);

const net = (...items) => items.join('_');
const run = (text) => {
  const { parts, problems } = parseNetlist(text);
  assert.deepEqual(problems, [], `netlist should parse cleanly: ${problems.join('; ')}`);
  return { parts, sol: solve(parts) };
};
const byName = (parts, sol, name) => {
  const i = partNames(parts).indexOf(name);
  assert.ok(i >= 0, `no part called ${name}`);
  return sol.parts[i];
};

/** Every number in an object is finite or null: never NaN or ±Infinity. */
function assertNoNaN(obj, where = 'value') {
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'number') assert.ok(Number.isFinite(v), `${where}.${k} is ${v}`);
    else if (typeof v === 'object') assertNoNaN(v, `${where}.${k}`);
  }
}

/** Kirchhoff's current law at every grid point: the currents leaving a point sum to zero. */
function assertKCL(sol, tol = 1e-9) {
  const sums = new Map();
  const add = ([x, y], i) => sums.set(`${x},${y}`, (sums.get(`${x},${y}`) ?? 0) + i);
  for (const s of sol.segments) {
    add(s.a, s.current); // current s.current leaves point a along the segment
    add(s.b, -s.current); // and arrives at point b
  }
  for (const [k, sum] of sums) assert.ok(Math.abs(sum) <= tol, `KCL fails at (${k}): currents sum to ${sum}`);
  // And at every node (points joined by zero-resistance parts).
  const nodeSums = new Map();
  for (const [k, sum] of sums) {
    const n = sol.nodeAt.get(k);
    nodeSums.set(n, (nodeSums.get(n) ?? 0) + sum);
  }
  for (const [n, sum] of nodeSums) assert.ok(Math.abs(sum) <= tol, `KCL fails at node ${n}: ${sum}`);
}

// Two standard loops used below. Cell + terminal at (0,1), − at (0,2).
// Series: (0,1) up to (0,0), R1 (0,0)→(2,0), R2 (2,0)→(4,0), down to (4,2), back to (0,2).
const SERIES = net('B12-0-1-0-2', 'W-0-1-0-0', 'R10-0-0-2-0', 'R10-2-0-4-0', 'W-4-0-4-2', 'W-4-2-0-2');
// Parallel: R1 (2,0)→(2,2) and R2 (4,0)→(4,2) between the top rail y = 0 and the bottom rail y = 2.
const PARALLEL = net('B12-0-1-0-2', 'W-0-1-0-0', 'W-0-0-2-0', 'W-2-0-4-0', 'R10-2-0-2-2', 'R10-4-0-4-2', 'W-4-2-2-2', 'W-2-2-0-2');

// ---------------------------------------------------------------- §9.1 analytic tests

test('§9.1 series: 10 Ω + 10 Ω on 12 V draws 0.6 A', () => {
  const { parts, sol } = run(SERIES);
  assert.equal(sol.ok, true);
  // I = E / (R1 + R2) = 12 / 20 = 0.6 A
  close(outputs(sol).current, 0.6, 1e-12, 'cell current');
  close(byName(parts, sol, 'R1').current, 0.6, 1e-12, 'R1 current');
  close(byName(parts, sol, 'R2').current, 0.6, 1e-12, 'R2 current');
  // V = IR = 0.6 × 10 = 6 V across each; KVL: 6 + 6 = 12
  close(byName(parts, sol, 'R1').voltage, 6, 1e-12, 'V across R1');
  close(byName(parts, sol, 'R2').voltage, 6, 1e-12, 'V across R2');
  // R_eq = 10 + 10 = 20 Ω
  close(outputs(sol).resistance, 20, 1e-9, 'equivalent resistance');
});

test('§9.1 parallel: 10 Ω ∥ 10 Ω on 12 V draws 2.4 A in total', () => {
  const { parts, sol } = run(PARALLEL);
  // R_eq = (1/10 + 1/10)⁻¹ = 5 Ω, I = 12 / 5 = 2.4 A; each branch 12 / 10 = 1.2 A
  close(outputs(sol).current, 2.4, 1e-12, 'total current');
  close(byName(parts, sol, 'R1').current, 1.2, 1e-12, 'branch 1');
  close(byName(parts, sol, 'R2').current, 1.2, 1e-12, 'branch 2');
  close(byName(parts, sol, 'R1').voltage, 12, 1e-12, 'branch voltage');
  close(outputs(sol).resistance, 5, 1e-9, 'equivalent resistance');
});

test('§9.1 balanced Wheatstone bridge: zero bridge current (1e-12)', () => {
  // R1/R2 = R3/R4 = 1/2 (preset: 10, 20, 15, 30 Ω on 12 V). Ideal ammeter across the middle.
  const { parts, sol } = run(PRESETS.wheatstone.netlist);
  assert.equal(sol.ok, true);
  assert.ok(Math.abs(byName(parts, sol, 'A1').reading) <= 1e-12, `bridge ammeter reads ${byName(parts, sol, 'A1').reading}`);
  // Total: (10 + 20) ∥ (15 + 30) = 30 × 45 / 75 = 18 Ω, so I = 12 / 18 = 0.6667 A
  close(outputs(sol).current, 12 / 18, 1e-12, 'cell current');

  // The same bridge with a 50 Ω resistor as the bridge part (a galvanometer with resistance).
  const withResistor = net(
    'B12-0-3-0-5', 'W-0-3-0-1', 'W-0-1-2-1', 'W-2-1-6-1',
    'R10-2-1-2-3', 'R20-2-3-2-5', 'R15-6-1-6-3', 'R30-6-3-6-5',
    'W-2-3-3-3', 'R50-3-3-5-3', 'W-5-3-6-3',
    'W-2-5-6-5', 'W-0-5-2-5',
  );
  const b = run(withResistor);
  assert.ok(Math.abs(byName(b.parts, b.sol, 'R5').current) <= 1e-12, `bridge resistor carries ${byName(b.parts, b.sol, 'R5').current}`);
  // No bridge current, so the left arm is 10 V/30 Ω: I = 0.4 A, and the mid-point is 12 − 0.4 × 10 = 8 V above the − terminal.
  close(byName(b.parts, b.sol, 'R1').current, 0.4, 1e-12, 'left arm');
});

test('unbalanced bridge: the ideal ammeter reads the hand-calculated current', () => {
  // R4 = 20 Ω instead of 30 Ω. The ideal ammeter joins the mid-points, so they share a potential Vm:
  // (12 − Vm)(1/10 + 1/15) = Vm(1/20 + 1/20) → (12 − Vm)/6 = Vm/10 → Vm = 7.5 V.
  // I(R1) = 4.5/10 = 0.45 A, I(R2) = 7.5/20 = 0.375 A, so 0.075 A crosses from left to right.
  const text = PRESETS.wheatstone.netlist.replace('R30-', 'R20-');
  const { parts, sol } = run(text);
  close(byName(parts, sol, 'A1').reading, 0.075, 1e-12, 'bridge current');
  close(byName(parts, sol, 'R3').current, 0.3, 1e-12, 'R3: 4.5/15');
  assertKCL(sol);
});

test('§9.1 KCL: currents sum to zero at every point and node (1e-9)', () => {
  for (const [name, { netlist }] of Object.entries(PRESETS)) {
    const { sol } = run(netlist);
    assert.equal(sol.ok, true, `${name} should solve`);
    assertKCL(sol);
  }
  assertKCL(run(SERIES).sol);
  assertKCL(run(PARALLEL).sol);
});

test('§9.1 short circuit: a friendly error, not NaN or Infinity', () => {
  // An ideal 12 V cell with a bare wire loop from + to −.
  const { parts, sol } = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'W-0-0-2-0', 'W-2-0-2-2', 'W-2-2-0-2'));
  assert.equal(sol.ok, false);
  const err = sol.errors.find((e) => e.code === 'short-circuit');
  assert.ok(err, 'reports a short circuit');
  assert.match(err.title, /short circuit/i);
  assert.match(err.message, /B1/);
  assert.match(err.message, /infinite/);
  assert.ok(err.parts.includes(0), 'highlights the cell');
  const out = outputs(sol);
  assertNoNaN(out, 'outputs');
  assert.equal(out.current, null);
  assertNoNaN(sol.parts, 'parts');
  assertNoNaN(dataTable(parts, sol).rows, 'csv');
  assert.match(describe(parts, sol), /short circuit/i);

  // A resistor in parallel with the short doesn't help: still a short circuit.
  const b = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'W-0-0-2-0', 'W-2-0-2-2', 'W-2-2-0-2', 'W-0-0-0-4', 'R10-0-4-2-4', 'W-2-4-2-2'));
  assert.ok(b.sol.errors.some((e) => e.code === 'short-circuit'));
});

test('short circuit through an ammeter explains where ammeters go', () => {
  const { sol } = run(net('B6-0-1-0-2', 'W-0-1-0-0', 'A-0-0-2-0', 'W-2-0-2-2', 'W-2-2-0-2'));
  const err = sol.errors.find((e) => e.code === 'short-circuit');
  assert.ok(err);
  assert.match(err.message, /ammeter/i);
  assert.match(err.message, /series/i);
});

test('§9.1 floating node: a friendly error, not NaN, and the rest still solves', () => {
  // Cell and 10 Ω loop, plus a voltmeter whose − terminal (6,0) touches nothing.
  const { parts, sol } = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'R10-0-0-2-0', 'W-2-0-2-2', 'W-2-2-0-2', 'V-4-0-6-0', 'W-2-0-4-0'));
  const err = sol.errors.find((e) => e.code === 'floating');
  assert.ok(err, 'reports a floating node');
  assert.match(err.title, /floating/i);
  assert.match(err.message, /V1/);
  assert.match(err.message, /isn't connected/);
  const out = outputs(sol);
  assertNoNaN(out, 'outputs');
  assert.equal(out.v1, null, 'no reading on a floating voltmeter');
  close(out.current, 1.2, 1e-12, 'the loop still solves: 12/10'); // I = 12 / 10
  assertNoNaN(sol.parts, 'parts');
  assertNoNaN(sol.nodes, 'nodes');

  // A voltmeter joining two separate powered circuits is also undefined.
  const two = run(net(
    'B12-0-1-0-2', 'W-0-1-0-0', 'R10-0-0-2-0', 'W-2-0-2-2', 'W-2-2-0-2',
    'B6-8-1-8-2', 'W-8-1-8-0', 'R10-8-0-10-0', 'W-10-0-10-2', 'W-10-2-8-2',
    'W-2-0-4-0', 'V-4-0-6-0', 'W-6-0-8-0',
  ));
  const e2 = two.sol.errors.find((e) => e.code === 'floating');
  assert.ok(e2);
  assert.match(e2.message, /separate circuits/);
  close(outputs(two.sol).current, 1.2, 1e-12);
});

test('ideal cells straight across each other: a friendly error, not NaN', () => {
  const { sol } = run(net('B12-0-1-0-2', 'B9-2-1-2-2', 'W-0-1-2-1', 'W-0-2-2-2'));
  assert.equal(sol.ok, false);
  const err = sol.errors.find((e) => e.code === 'source-loop');
  assert.ok(err);
  assert.match(err.message, /internal resistance/);
  assertNoNaN(outputs(sol));
  // With internal resistance the same pair solves: I = (12 − 9)/(1 + 1) = 1.5 A from B1 into B2.
  const ok = run(net('B12r1-0-1-0-2', 'B9r1-2-1-2-2', 'W-0-1-2-1', 'W-0-2-2-2'));
  assert.equal(ok.sol.ok, true);
  close(ok.sol.parts[0].current, 1.5, 1e-12, 'B1 supplies 1.5 A');
  close(ok.sol.parts[1].current, -1.5, 1e-12, 'B2 is charged by 1.5 A');
  assertKCL(ok.sol);
});

// ---------------------------------------------------------------- extra physics

test('internal resistance: terminal voltage V = ε − Ir', () => {
  // ε = 12 V, r = 2 Ω, R = 10 Ω: I = 12/12 = 1 A, V = 12 − 1 × 2 = 10 V.
  const { parts, sol } = run(net('B12r2-0-1-0-2', 'W-0-1-0-0', 'R10-0-0-2-0', 'W-2-0-2-2', 'W-2-2-0-2'));
  const cell = sol.parts[0];
  close(cell.current, 1, 1e-12, 'I');
  close(cell.voltage, 10, 1e-12, 'terminal voltage');
  close(cell.generated, 12, 1e-12, 'εI');
  close(cell.lost, 2, 1e-12, 'I²r');
  close(cell.power, 10, 1e-12, 'power supplied to the circuit');
  close(outputs(sol).terminalVoltage, 10, 1e-12);
  close(outputs(sol).resistance, 10, 1e-9, 'external resistance V/I');
  assert.equal(partNames(parts)[0], 'B1');

  // The preset: closed switch → 10 V on the voltmeter; open switch → no current, so V = ε = 12 V.
  const closed = run(PRESETS.internal.netlist);
  close(outputs(closed.sol).v1, 10, 1e-12, 'closed: V1');
  close(outputs(closed.sol).a1, 1, 1e-12, 'closed: A1');
  const open = run(PRESETS.internal.netlist.replace('S1-', 'S0-'));
  close(outputs(open.sol).v1, 12, 1e-12, 'open: V1 = ε');
  close(outputs(open.sol).current, 0, 1e-15, 'open: no current');

  // Shorting a real cell is allowed: I = ε/r = 12/2 = 6 A and the terminal voltage is 0.
  const shorted = run(net('B12r2-0-1-0-2', 'W-0-1-0-0', 'W-0-0-2-0', 'W-2-0-2-2', 'W-2-2-0-2'));
  assert.equal(shorted.sol.ok, true);
  close(shorted.sol.parts[0].current, 6, 1e-12);
  close(shorted.sol.parts[0].voltage, 0, 1e-12);
});

test('power conservation: power supplied by the cells equals the power used by the parts', () => {
  for (const [name, { netlist }] of Object.entries(PRESETS)) {
    const { parts, sol } = run(netlist);
    let supplied = 0;
    let generated = 0;
    let lost = 0;
    let used = 0;
    parts.forEach((p, i) => {
      const r = sol.parts[i];
      if (p.type === 'B') {
        supplied += r.power;
        generated += r.generated;
        lost += r.lost;
      } else used += r.power;
    });
    close(supplied, used, 1e-9, `${name}: VI = Σ P`);
    close(generated, lost + used, 1e-9, `${name}: εI = I²r + Σ P`);
  }
  // Mixed preset by hand: L1 4 Ω in series with L2 12 Ω ∥ L3 6 Ω (4 Ω) → 8 Ω, I = 1.5 A.
  // P1 = 1.5² × 4 = 9 W; the parallel pair has 6 V: P2 = 36/12 = 3 W, P3 = 36/6 = 6 W; total 18 W = 12 × 1.5.
  const { parts, sol } = run(PRESETS.mixed.netlist);
  close(outputs(sol).current, 1.5, 1e-12);
  close(byName(parts, sol, 'L1').power, 9, 1e-12, 'P1');
  close(byName(parts, sol, 'L2').power, 3, 1e-12, 'P2');
  close(byName(parts, sol, 'L3').power, 6, 1e-12, 'P3');
  close(outputs(sol).power, 18, 1e-12, 'total');
});

test('open switch: no current, and the full EMF appears across the switch', () => {
  const { parts, sol } = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'S0-0-0-2-0', 'R10-2-0-4-0', 'W-4-0-4-2', 'W-4-2-0-2'));
  assert.equal(sol.ok, true);
  close(outputs(sol).current, 0, 1e-15, 'no current');
  close(byName(parts, sol, 'S1').voltage, 12, 1e-12, 'V across the open switch');
  close(byName(parts, sol, 'R1').voltage, 0, 1e-12, 'no voltage across R1');
  assert.ok(sol.notes.some((n) => n.code === 'open'), 'notes that there is no complete loop');
  // Closed: I = 12/10 = 1.2 A.
  const closed = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'S1-0-0-2-0', 'R10-2-0-4-0', 'W-4-0-4-2', 'W-4-2-0-2'));
  close(outputs(closed.sol).current, 1.2, 1e-12);
});

test('presets give their hand-calculated readings', () => {
  // single: 12 V across 10 Ω → A1 = 1.2 A, V1 = 12 V.
  let o = outputs(run(PRESETS.single.netlist).sol);
  close(o.a1, 1.2, 1e-12, 'single A1');
  close(o.v1, 12, 1e-12, 'single V1');
  // series: A1 = 0.6 A; V1 = V2 = 6 V.
  o = outputs(run(PRESETS.series.netlist).sol);
  close(o.a1, 0.6, 1e-12, 'series A1');
  close(o.v1, 6, 1e-12, 'series V1');
  close(o.v2, 6, 1e-12, 'series V2');
  // parallel: A1 = 2.4 A (main line), A2 = 1.2 A (one branch).
  o = outputs(run(PRESETS.parallel.netlist).sol);
  close(o.a1, 2.4, 1e-12, 'parallel A1');
  close(o.a2, 1.2, 1e-12, 'parallel A2');
  // mixed: A1 = 1.5 A.
  close(outputs(run(PRESETS.mixed.netlist).sol).a1, 1.5, 1e-12, 'mixed A1');
});

test('voltmeter in series: no current, and it reads the EMF', () => {
  const { sol } = run(net('B9-0-1-0-2', 'W-0-1-0-0', 'V-0-0-2-0', 'R10-2-0-4-0', 'W-4-0-4-2', 'W-4-2-0-2'));
  close(outputs(sol).current, 0, 1e-15);
  close(outputs(sol).v1, 9, 1e-12);
});

test('meter polarity: reversing an ammeter or voltmeter changes the sign of its reading', () => {
  const fwd = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'A-0-0-2-0', 'R10-2-0-4-0', 'W-4-0-4-2', 'W-4-2-0-2', 'W-2-0-2-1', 'V-2-1-4-1', 'W-4-1-4-0'));
  close(outputs(fwd.sol).a1, 1.2, 1e-12, 'current enters +');
  close(outputs(fwd.sol).v1, 12, 1e-12, '+ on the high side');
  const rev = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'A-2-0-0-0', 'R10-2-0-4-0', 'W-4-0-4-2', 'W-4-2-0-2', 'W-2-0-2-1', 'V-4-1-2-1', 'W-4-1-4-0'));
  close(outputs(rev.sol).a1, -1.2, 1e-12);
  close(outputs(rev.sol).v1, -12, 1e-12);
});

test('a T-junction on a long wire connects; wires that cross without a dot do not', () => {
  // Parallel pair drawn with one long top wire (0,0)→(4,0) and R1 ending in its middle at (2,0).
  const t = run(net('B12-0-1-0-2', 'W-0-1-0-0', 'W-0-0-4-0', 'R10-2-0-2-2', 'R10-4-0-4-2', 'W-4-2-0-2'));
  close(outputs(t.sol).current, 2.4, 1e-12, 'T-junction joins R1');
  assertKCL(t.sol);
  assert.ok(t.sol.junctions.some(([x, y]) => x === 2 && y === 0), 'junction dot at (2,0)');

  // Loop 1: 12 V across 10 Ω, with wires along y = 2 and y = 4 from x = 0 to 6.
  // Loop 2: 6 V across 20 Ω, with vertical wires along x = 3 and x = 1 that cross both of loop 1's
  // wires at (3,2), (3,4), (1,2) and (1,4), with no end point at any crossing.
  const crossing = net(
    'B12-0-3-0-4', 'W-0-3-0-2', 'W-0-2-6-2', 'R10-6-2-6-4', 'W-6-4-0-4',
    'B6-1-0-1-1', 'W-1-0-3-0', 'W-3-0-3-5', 'R20-3-5-1-5', 'W-1-5-1-1',
  );
  const c = run(crossing);
  // Joined at the crossings, the loops would share current. Apart, each cell drives only its own loop.
  for (const k of ['3,2', '3,4', '1,2', '1,4']) assert.equal(c.sol.nodeAt.has(k), false, `no node at the crossing (${k})`);
  close(c.sol.parts[0].current, 1.2, 1e-12, 'loop 1: 12/10');
  close(c.sol.parts[5].current, 0.3, 1e-12, 'loop 2: 6/20');
  assertKCL(c.sol);
});

test('a wire across an ammeter or a resistor takes all the current', () => {
  // Ammeter A1 from (0,1) to (2,1), with a wire round it through (0,0) and (2,0). Real ammeters have
  // far more resistance than a wire, so the wire takes it all: I = 12/10 = 1.2 A, A1 reads 0.
  const { parts, sol } = run(net('B12-0-2-0-3', 'W-0-2-0-1', 'A-0-1-2-1', 'W-0-1-0-0', 'W-0-0-2-0', 'W-2-0-2-1', 'R10-2-1-4-1', 'W-4-1-4-3', 'W-4-3-0-3'));
  close(byName(parts, sol, 'A1').reading, 0, 1e-15, 'bypassed ammeter');
  close(outputs(sol).current, 1.2, 1e-12);
  assert.ok(sol.notes.some((n) => n.code === 'bypassed'));
  assertKCL(sol);
  // A wire from the + terminal (0,1) round to (2,0) puts R1 of the series pair in a loop with no
  // resistance: R1 is short-circuited, so I = 12/10 = 1.2 A through R2 only.
  const s = run(net(SERIES, 'W-0-1-2-1', 'W-2-1-2-0'));
  close(byName(s.parts, s.sol, 'R1').current, 0, 1e-15, 'shorted resistor');
  close(byName(s.parts, s.sol, 'R2').current, 1.2, 1e-12);
  assert.ok(s.sol.notes.some((n) => n.code === 'shorted'));
});

test('parts with no cell carry no current and raise no error', () => {
  const { sol } = run(net(SERIES, 'R10-8-0-10-0', 'W-10-0-10-2', 'W-10-2-8-2', 'W-8-2-8-0'));
  assert.equal(sol.ok, true);
  assert.equal(sol.errors.length, 0);
  close(sol.parts[6].current, 0, 0, 'unpowered loop');
  assert.ok(sol.notes.some((n) => n.code === 'unpowered'));
  const empty = solve([]);
  assert.equal(empty.ok, true);
  assert.ok(empty.notes.some((n) => n.code === 'empty'));
  assertNoNaN(outputs(empty));
  const noCell = run(net('R10-0-0-2-0', 'W-2-0-2-2'));
  assert.ok(noCell.sol.notes.some((n) => n.code === 'no-source'));
});

test('node potentials are measured from the − terminal of the cell', () => {
  const { sol } = run(SERIES);
  const v = (x, y) => sol.nodes[sol.nodeAt.get(`${x},${y}`)].voltage;
  close(v(0, 2), 0, 1e-12, 'reference');
  close(v(0, 0), 12, 1e-12, '+ side');
  close(v(2, 0), 6, 1e-12, 'between R1 and R2');
  close(v(4, 0), 0, 1e-12, 'after R2');
  assert.equal(sol.nodes[sol.nodeAt.get('0,2')].reference, true);
  // A point inside a wire belongs to the wire's node.
  const { parts } = parseNetlist(SERIES);
  assert.equal(nodeAt(parts, sol, 2, 2), sol.nodeAt.get('0,2'));
  assert.equal(nodeAt(parts, sol, 9, 7), -1);
});

test('random meshes never produce NaN; KCL and the power balance hold whenever they solve', () => {
  // mulberry32: a seeded PRNG so the test is deterministic.
  let seed = 20261125;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const TYPES = ['R', 'R', 'R', 'R', 'L', 'L', 'W', 'W', 'B', 'B', 'S', 'A', 'V'];
  let solved = 0;
  let withCurrent = 0;
  for (let trial = 0; trial < 300; trial++) {
    // A random part (either way round) on about 3 in 4 of the unit edges of a 5 × 4 lattice: dense meshes
    // with many loops, shorts, floating voltmeters and dead ends.
    let parts = [];
    for (let y = 0; y <= 3; y++) {
      for (let x = 0; x <= 4; x++) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          if (x + dx > 4 || y + dy > 3 || rand() > 0.75) continue;
          const type = pick(TYPES);
          const p = rand() < 0.5 ? { type, x1: x + dx, y1: y + dy, x2: x, y2: y } : { type, x1: x, y1: y, x2: x + dx, y2: y + dy };
          if (type === 'R' || type === 'L') p.value = pick([1, 10, 47, 100]);
          if (type === 'B') Object.assign(p, { value: pick([1.5, 6, 12]), r: pick([0, 0.5, 2]) });
          if (type === 'S') p.closed = rand() < 0.6;
          const next = addPart(parts, p);
          assert.equal(next.problem, null, 'unit edges never clash');
          parts = next.parts;
        }
      }
    }
    const sol = solve(parts);
    assertNoNaN(sol.parts, `trial ${trial} parts`);
    assertNoNaN(sol.nodes, `trial ${trial} nodes`);
    assertNoNaN(outputs(sol), `trial ${trial} outputs`);
    for (const e of sol.errors) assert.ok(typeof e.message === 'string' && e.message.length > 40, 'errors are written out');
    if (!sol.ok) continue;
    solved += 1;
    if (sol.segments.some((s) => Math.abs(s.current) > 1e-6)) withCurrent += 1;
    assertKCL(sol);
    let supplied = 0;
    let used = 0;
    parts.forEach((p, i) => {
      if (p.type === 'B') supplied += sol.parts[i].power;
      else used += sol.parts[i].power;
    });
    close(supplied, used, 1e-9, `trial ${trial}: power supplied = power used`);
  }
  // The generator must actually exercise the solver: most meshes solve and carry current.
  assert.ok(solved > 250, `most random meshes solve (${solved}/300)`);
  assert.ok(withCurrent > 150, `most solved meshes carry current (${withCurrent}/300)`);
});

test('deterministic: the same circuit gives the same numbers', () => {
  const a = solve(parseNetlist(PRESETS.wheatstone.netlist).parts);
  const b = solve(parseNetlist(PRESETS.wheatstone.netlist).parts);
  assert.deepEqual(a.parts, b.parts);
  assert.deepEqual(outputs(a), outputs(b));
});

// ---------------------------------------------------------------- netlist text

test('netlist: presets round-trip, match the URL pattern and fit the length limit', () => {
  const re = new RegExp(NETLIST_PATTERN, 'u');
  for (const [name, { netlist }] of Object.entries(PRESETS)) {
    assert.ok(re.test(netlist), `${name} matches the pattern`);
    assert.ok(netlist.length <= NETLIST_MAX, `${name} fits`);
    const { parts, problems } = parseNetlist(netlist);
    assert.deepEqual(problems, []);
    assert.equal(formatNetlist(parts), netlist, `${name} round-trips`);
    assert.equal(matchPreset(netlist), name);
  }
  assert.ok(re.test(''), 'an empty circuit is allowed');
  for (const bad of ['X1-0-0-1-0', 'R10-0-0-1', 'R-0-0-1-0', 'B12r-0-0-1-0', 'R10-0-0-1-0_', 'R1e3-0-0-1-0', 'R10,0,0,1,0', 'S2-0-0-1-0']) {
    assert.ok(!re.test(bad), `rejects ${bad}`);
  }
  assert.equal(matchPreset('R10-0-0-2-0'), null);
});

test('netlist: parse checks geometry and ranges, with friendly problems', () => {
  let r = parseNetlist('R10-0-0-1-1');
  assert.equal(r.parts.length, 0);
  assert.match(r.problems[0], /straight/);
  r = parseNetlist(`R10-0-0-${GRID.cols + 1}-0`);
  assert.equal(r.parts.length, 0);
  assert.match(r.problems[0], /grid/);
  r = parseNetlist('R10-3-3-3-3');
  assert.equal(r.parts.length, 0);
  r = parseNetlist('R0-0-0-2-0');
  assert.equal(r.parts[0].value, 0.1, 'resistance clamps to 0.1 Ω');
  assert.equal(r.problems.length, 1);
  r = parseNetlist('B12r0.5-0-0-0-2_S1-0-0-2-0_S0-2-0-4-0_A-4-0-6-0_V-6-0-8-0_L6.8-8-0-10-0_W-10-0-10-2');
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.parts[0], { type: 'B', x1: 0, y1: 0, x2: 0, y2: 2, value: 12, r: 0.5 });
  assert.equal(r.parts[1].closed, true);
  assert.equal(r.parts[2].closed, false);
  assert.equal(r.parts[5].value, 6.8);
  assert.deepEqual(partNames(r.parts), ['B1', 'S1', 'S2', 'A1', 'V1', 'L1', 'W1']);
});

test('meta: the netlist param uses the model pattern and every circuit option is a preset', () => {
  assert.equal(meta.params.netlist.pattern, NETLIST_PATTERN);
  assert.equal(meta.params.netlist.maxLength, NETLIST_MAX);
  for (const [value] of meta.params.circuit.options) assert.ok(value === 'custom' || PRESETS[value], `circuit option ${value}`);
  for (const name of Object.keys(PRESETS)) assert.ok(meta.params.circuit.options.some(([v]) => v === name), `preset ${name} is offered`);
  assert.deepEqual(meta.params.symbols.options.map(([v]) => v), ['physics', 'as1102']);
});

// ---------------------------------------------------------------- editing

test('editing: placement rules', () => {
  const { parts } = parseNetlist(SERIES);
  assert.match(placementProblem(parts, { type: 'R', value: 10, x1: 1, y1: 0, x2: 3, y2: 0 }), /overlap/);
  assert.match(placementProblem(parts, { type: 'W', x1: 1, y1: -1, x2: 1, y2: 1 }), /grid/);
  // A wire across the middle of R1 (from (1,−1) is off-grid, so use a part lower down).
  const withLow = [...parts, { type: 'R', value: 10, x1: 6, y1: 2, x2: 8, y2: 2 }];
  assert.match(placementProblem(withLow, { type: 'W', x1: 7, y1: 1, x2: 7, y2: 3 }), /cross/);
  assert.match(placementProblem(withLow, { type: 'W', x1: 7, y1: 2, x2: 7, y2: 4 }), /middle/);
  // A wire ending on another wire's middle is a T-junction: allowed.
  assert.equal(placementProblem(parts, { type: 'W', x1: 2, y1: 2, x2: 2, y2: 4 }), null);
  // Wires may cross wires.
  assert.equal(placementProblem(parts, { type: 'W', x1: 3, y1: 1, x2: 3, y2: 3 }), null);
  assert.match(placementProblem(parts, { type: 'R', value: 10, x1: 0, y1: 0, x2: 1, y2: 1 }), /straight/);
});

test('editing: add, move, stretch, rotate, update and remove', () => {
  let { parts } = parseNetlist(SERIES);
  const n = parts.length;
  let r = addPart(parts, { type: 'L', value: 6, x1: 6, y1: 0, x2: 8, y2: 0 });
  assert.equal(r.problem, null);
  assert.equal(r.parts.length, n + 1);
  parts = r.parts;
  r = movePart(parts, n, 0, 3);
  assert.equal(r.problem, null);
  assert.deepEqual([r.parts[n].x1, r.parts[n].y1, r.parts[n].x2, r.parts[n].y2], [6, 3, 8, 3]);
  parts = r.parts;
  r = moveEnd(parts, n, 2, 10, 3);
  assert.deepEqual([r.parts[n].x2, r.parts[n].y2], [10, 3]);
  r = rotatePart(parts, n); // about its middle (7,3): now vertical from (7,2) to (7,4)
  assert.equal(r.problem, null);
  assert.deepEqual([r.parts[n].x1, r.parts[n].y1, r.parts[n].x2, r.parts[n].y2], [7, 2, 7, 4]);
  const twice = rotatePart(rotatePart(parts, n).parts, n).parts[n];
  assert.deepEqual([twice.x1, twice.y1, twice.x2, twice.y2], [8, 3, 6, 3], 'two turns swap the ends');
  assert.match(movePart(parts, n, 0, 9).problem, /grid/);
  assert.equal(updatePart(parts, n, { value: 1e9 })[n].value, 100000, 'values clamp to the limits');
  assert.equal(removePart(parts, n).length, n);
  assert.equal(partAt(parts, 1, 0.1), 2, 'R1 is under (1, 0.1)');
  assert.equal(partAt(parts, 9, 7), -1);
  assert.deepEqual(snapAxis(2, 2, 5.4, 2.8), [5, 2]);
  assert.deepEqual(snapAxis(2, 2, 2.2, 0.4), [2, 0]);
});

test('turning a cell round reverses the current', () => {
  const { parts } = parseNetlist(SERIES);
  const before = solve(parts);
  const turned = rotatePart(rotatePart(parts, 0).parts, 0).parts;
  const after = solve(turned);
  close(after.parts[2].current, -before.parts[2].current, 1e-12);
  close(after.parts[0].current, 0.6, 1e-12, 'the cell still supplies 0.6 A');
});

// ---------------------------------------------------------------- animation

test('current dots: speed is proportional to current, capped, and time is n·DT', () => {
  close(dotSpeed(0.5, 2).speed, 1, 1e-12);
  close(dotSpeed(1, 2).speed, 2, 1e-12);
  assert.equal(dotSpeed(100, 2).speed, DOT_MAX_SPEED);
  assert.equal(dotSpeed(100, 2).capped, true);
  // After 0.1 s at 1 cell/s the dots have moved 0.1 cells (less than one spacing).
  close(dotPhase(0.5, 0.1, 2), 0.1, 1e-12);
  close(dotPhase(-0.5, 0.1, 2), DOT_SPACING - 0.1, 1e-12, 'reverse current runs backwards');
  assert.equal(dotPhase(0, 1, 2), null, 'no current, no dots');
  let s = createState();
  s = advance(s, 6);
  assert.equal(s.n, 6);
  close(s.t, 6 * DT, 1e-15);
});
