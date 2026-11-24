// Circuit engine model (guide §9.1): resistive DC circuits drawn on a grid, solved by modified nodal
// analysis (MNA). Pure: no DOM, no timers, no randomness. Importable in Node; tests/engines/circuit.test.mjs
// checks it against hand-calculated answers.
//
// Parts sit on a grid of points x = 0…GRID.cols, y = 0…GRID.rows (y downwards, like the screen). Each
// part runs straight between two grid points in the same row or column.
//   W wire · B cell (EMF, optional internal resistance r) · R resistor · L lamp (modelled as a resistor)
//   S switch (open or closed) · A ideal ammeter (no resistance) · V ideal voltmeter (infinite resistance)
// For B, A and V the FIRST point is the + terminal.
//
// Connections: parts join where their end points meet. A wire also joins any part whose end point lies
// on it (a T-junction). Wires that cross with no end point at the crossing do not join.
//
// Solving (solve()):
//  1. Wires, closed switches and ammeters have no resistance, so the points they join form one node.
//  2. Shorts are found first. An ideal cell (r = 0) whose terminals are in the same node, or a loop of
//     ideal cells, has no finite answer, so it is reported as a friendly error and not solved.
//  3. Each separate circuit ("island") that contains a cell gets its own 0 V reference: the − terminal
//     of its first cell. MNA unknowns: node potentials, plus the current through each cell. Gaussian
//     elimination with partial pivoting.
//  4. Currents in the zero-resistance parts come from Kirchhoff's current law inside each node. Where
//     zero-resistance paths form loops the ideal model doesn't fix the split, so we take the limit of
//     equal tiny resistances (the minimum-energy split), with ammeters treated as far more resistive than
//     wires, so a wire straight across an ammeter carries all the current, as it would in a real circuit.
//  5. Islands without a cell carry no current. Their potentials are undefined, so a voltmeter that
//     depends on one reports a "floating node" instead of a number.
import { formatNumber } from '../../format.js';

export const GRID = Object.freeze({ cols: 14, rows: 8 });
export const DT = 1 / 60; // s, fixed step for the current-dot animation (the circuit itself is static)
export const DOT_SPACING = 0.5; // grid cells between current dots
export const DOT_MAX_SPEED = 5; // grid cells per second; faster dots would strobe
export const CURRENT_EPS = 1e-9; // A: smaller currents count as none (no dots, no arrows)
export const NETLIST_MAX = 1500; // characters in the `netlist` URL param
export const MAX_PARTS = 120;

export const LIMITS = Object.freeze({
  resistance: Object.freeze([0.1, 100000]), // Ω, resistors and lamps
  emf: Object.freeze([0.1, 250]), // V
  internal: Object.freeze([0, 100]), // Ω
});

export const PART_INFO = Object.freeze({
  W: Object.freeze({ name: 'Wire', plural: 'wires' }),
  B: Object.freeze({ name: 'Cell', plural: 'cells' }),
  R: Object.freeze({ name: 'Resistor', plural: 'resistors' }),
  L: Object.freeze({ name: 'Lamp', plural: 'lamps' }),
  S: Object.freeze({ name: 'Switch', plural: 'switches' }),
  A: Object.freeze({ name: 'Ammeter', plural: 'ammeters' }),
  V: Object.freeze({ name: 'Voltmeter', plural: 'voltmeters' }),
});
export const PART_TYPES = Object.freeze(Object.keys(PART_INFO));

/** Settings for a newly placed part. */
export const NEW_PART = Object.freeze({ R: { value: 10 }, L: { value: 10 }, B: { value: 6, r: 0 }, S: { closed: false } });

// ---------------------------------------------------------------------------------------- netlist text

const NUM = '\\d{1,6}(?:\\.\\d{1,4})?';
const HEAD = `(?:[WAV]|S[01]|[RL]${NUM}|B${NUM}(?:r${NUM})?)`;
const ELEM = `${HEAD}(?:-\\d{1,2}){4}`;
/** The `netlist` param pattern (anchored; the empty string is an empty grid). */
export const NETLIST_PATTERN = `^(?:${ELEM}(?:_${ELEM})*)?$`;
const PART_RE = new RegExp(`^(?:([WAV])|S([01])|([RL])(${NUM})|B(${NUM})(?:r(${NUM}))?)-(\\d{1,2})-(\\d{1,2})-(\\d{1,2})-(\\d{1,2})$`);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v) => String(Number(Number(v).toFixed(4)));

export function inGrid(x, y) {
  return x >= 0 && y >= 0 && x <= GRID.cols && y <= GRID.rows;
}

function geometryProblem(p) {
  if (![p.x1, p.y1, p.x2, p.y2].every(Number.isInteger)) return 'is not on the grid points';
  if (!inGrid(p.x1, p.y1) || !inGrid(p.x2, p.y2)) return 'is off the grid';
  if (p.x1 === p.x2 && p.y1 === p.y2) return 'starts and ends at the same point';
  if (p.x1 !== p.x2 && p.y1 !== p.y2) return 'is not straight: parts run along a row or a column';
  return null;
}

/**
 * Read netlist text into parts. Bad items are left out and explained in `problems` (plain sentences).
 * @returns {{ parts: object[], problems: string[] }}
 */
export function parseNetlist(text) {
  const parts = [];
  const problems = [];
  if (typeof text !== 'string') return { parts, problems: ['The circuit text is missing.'] };
  const src = text.trim();
  if (!src) return { parts, problems };
  const items = src.split('_');
  for (let k = 0; k < items.length; k++) {
    if (parts.length >= MAX_PARTS) {
      problems.push(`Only the first ${MAX_PARTS} parts are used.`);
      break;
    }
    const item = items[k];
    const m = PART_RE.exec(item);
    if (!m) {
      problems.push(`Item ${k + 1} ("${item.length > 24 ? `${item.slice(0, 24)}…` : item}") is not a part code, so it was left out.`);
      continue;
    }
    const [x1, y1, x2, y2] = m.slice(7, 11).map(Number);
    const type = m[1] ?? (m[2] !== undefined ? 'S' : (m[3] ?? 'B'));
    const part = { type, x1, y1, x2, y2 };
    const setValue = (raw, key, [lo, hi], unit) => {
      const v = Number(raw);
      part[key] = clamp(v, lo, hi);
      if (part[key] !== v) problems.push(`Item ${k + 1}: ${num(v)} ${unit} is outside ${num(lo)}–${num(hi)} ${unit}, so it was set to ${num(part[key])} ${unit}.`);
    };
    if (type === 'S') part.closed = m[2] === '1';
    if (type === 'R' || type === 'L') setValue(m[4], 'value', LIMITS.resistance, 'Ω');
    if (type === 'B') {
      setValue(m[5], 'value', LIMITS.emf, 'V');
      if (m[6] !== undefined) setValue(m[6], 'r', LIMITS.internal, 'Ω');
      else part.r = 0;
    }
    const where = geometryProblem(part);
    if (where) {
      problems.push(`Item ${k + 1} (${item}) ${where}, so it was left out.`);
      continue;
    }
    parts.push(part);
  }
  return { parts, problems };
}

function partCode(p) {
  switch (p.type) {
    case 'S':
      return `S${p.closed ? 1 : 0}`;
    case 'R':
    case 'L':
      return `${p.type}${num(p.value)}`;
    case 'B':
      return `B${num(p.value)}${p.r > 0 ? `r${num(p.r)}` : ''}`;
    default:
      return p.type; // W, A, V
  }
}

/** Canonical netlist text for parts. */
export function formatNetlist(parts) {
  return parts.map((p) => `${partCode(p)}-${p.x1}-${p.y1}-${p.x2}-${p.y2}`).join('_');
}

/** Labels in netlist order: R1, R2, L1, B1, S1, A1, V1, W1 … */
export function partNames(parts) {
  const counts = {};
  return parts.map((p) => {
    counts[p.type] = (counts[p.type] ?? 0) + 1;
    return `${p.type}${counts[p.type]}`;
  });
}

// ---------------------------------------------------------------------------------------- presets

const W = (x1, y1, x2, y2) => ({ type: 'W', x1, y1, x2, y2 });
const B = (emf, x1, y1, x2, y2, r = 0) => ({ type: 'B', value: emf, r, x1, y1, x2, y2 });
const R = (ohms, x1, y1, x2, y2) => ({ type: 'R', value: ohms, x1, y1, x2, y2 });
const L = (ohms, x1, y1, x2, y2) => ({ type: 'L', value: ohms, x1, y1, x2, y2 });
const S = (closed, x1, y1, x2, y2) => ({ type: 'S', closed, x1, y1, x2, y2 });
const A = (x1, y1, x2, y2) => ({ type: 'A', x1, y1, x2, y2 });
const V = (x1, y1, x2, y2) => ({ type: 'V', x1, y1, x2, y2 });

// Hand-calculated readings for each preset are in tests/engines/circuit.test.mjs.
const PRESET_PARTS = {
  single: {
    label: 'Single resistor',
    parts: [
      B(12, 2, 3, 2, 5),
      W(2, 3, 2, 2), W(2, 2, 4, 2), A(4, 2, 6, 2), W(6, 2, 9, 2), W(9, 2, 12, 2),
      W(9, 2, 9, 3), R(10, 9, 3, 9, 5), W(9, 5, 9, 6),
      W(12, 2, 12, 3), V(12, 3, 12, 5), W(12, 5, 12, 6),
      W(12, 6, 9, 6), W(9, 6, 2, 6), W(2, 6, 2, 5),
    ],
  },
  series: {
    label: 'Series pair',
    parts: [
      B(12, 2, 4, 2, 6),
      W(2, 4, 2, 3), W(2, 3, 4, 3), R(10, 4, 3, 6, 3), W(6, 3, 8, 3), R(10, 8, 3, 10, 3), W(10, 3, 12, 3),
      W(12, 3, 12, 4), A(12, 4, 12, 6), W(12, 6, 12, 7), W(12, 7, 2, 7), W(2, 7, 2, 6),
      W(4, 3, 4, 1), V(4, 1, 6, 1), W(6, 1, 6, 3),
      W(8, 3, 8, 1), V(8, 1, 10, 1), W(10, 1, 10, 3),
    ],
  },
  parallel: {
    label: 'Parallel pair',
    parts: [
      B(12, 2, 3, 2, 5),
      W(2, 3, 2, 1), W(2, 1, 4, 1), A(4, 1, 6, 1), W(6, 1, 9, 1), W(9, 1, 12, 1),
      W(9, 1, 9, 3), R(10, 9, 3, 9, 5), W(9, 5, 9, 7),
      W(12, 1, 12, 3), R(10, 12, 3, 12, 5), A(12, 5, 12, 7),
      W(12, 7, 9, 7), W(9, 7, 2, 7), W(2, 7, 2, 5),
    ],
  },
  mixed: {
    label: 'Series and parallel lamps',
    parts: [
      B(12, 2, 3, 2, 5),
      W(2, 3, 2, 1), W(2, 1, 4, 1), L(4, 4, 1, 6, 1), W(6, 1, 9, 1), W(9, 1, 12, 1),
      W(9, 1, 9, 3), L(12, 9, 3, 9, 5), W(9, 5, 9, 7),
      S(true, 12, 1, 12, 3), L(6, 12, 3, 12, 5), W(12, 5, 12, 7),
      W(12, 7, 9, 7), W(9, 7, 6, 7), A(6, 7, 4, 7), W(4, 7, 2, 7), W(2, 7, 2, 5),
    ],
  },
  wheatstone: {
    label: 'Wheatstone bridge',
    parts: [
      B(12, 3, 3, 3, 5),
      W(3, 3, 3, 1), W(3, 1, 7, 1), W(7, 1, 11, 1),
      W(7, 1, 7, 2), R(10, 7, 2, 7, 4), R(20, 7, 4, 7, 6), W(7, 6, 7, 7),
      W(11, 1, 11, 2), R(15, 11, 2, 11, 4), R(30, 11, 4, 11, 6), W(11, 6, 11, 7),
      W(7, 4, 8, 4), A(8, 4, 10, 4), W(10, 4, 11, 4),
      W(11, 7, 7, 7), W(7, 7, 3, 7), W(3, 7, 3, 5),
    ],
  },
  internal: {
    label: 'Internal resistance',
    parts: [
      B(12, 4, 3, 4, 5, 2),
      W(4, 3, 4, 2), W(4, 2, 5, 2), S(true, 5, 2, 7, 2), W(7, 2, 8, 2), A(8, 2, 10, 2), W(10, 2, 12, 2),
      W(12, 2, 12, 3), R(10, 12, 3, 12, 5), W(12, 5, 12, 6), W(12, 6, 4, 6), W(4, 6, 4, 5),
      W(4, 2, 1, 2), W(1, 2, 1, 3), V(1, 3, 1, 5), W(1, 5, 1, 6), W(1, 6, 4, 6),
    ],
  },
};

/** Preset circuits: { name: { label, netlist } }. */
export const PRESETS = Object.freeze(
  Object.fromEntries(Object.entries(PRESET_PARTS).map(([name, { label, parts }]) => [name, Object.freeze({ label, netlist: formatNetlist(parts) })])),
);

/** The preset whose netlist is exactly `text`, or null. */
export function matchPreset(text) {
  for (const [name, { netlist }] of Object.entries(PRESETS)) if (netlist === text) return name;
  return null;
}

// ---------------------------------------------------------------------------------------- solver helpers

function makeSets(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  return {
    find,
    union(a, b) {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[rb] = ra;
      return ra !== rb;
    },
  };
}

function compact(sets, n) {
  const of = new Int32Array(n);
  const ids = new Map();
  for (let i = 0; i < n; i++) {
    const r = sets.find(i);
    if (!ids.has(r)) ids.set(r, ids.size);
    of[i] = ids.get(r);
  }
  return { of, count: ids.size };
}

/** Solve A x = b (Gaussian elimination, partial pivoting). Returns null if A is singular. */
export function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row) => Float64Array.from(row));
  const z = Float64Array.from(b);
  let scale = 0;
  for (const row of M) for (const v of row) scale = Math.max(scale, Math.abs(v));
  if (n && !(scale > 0)) return null;
  for (let k = 0; k < n; k++) {
    let p = k;
    let best = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(M[i][k]);
      if (v > best) {
        best = v;
        p = i;
      }
    }
    if (!(best > 1e-13 * scale)) return null;
    if (p !== k) {
      [M[k], M[p]] = [M[p], M[k]];
      [z[k], z[p]] = [z[p], z[k]];
    }
    const pivot = M[k][k];
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / pivot;
      if (f === 0) continue;
      const Mi = M[i];
      const Mk = M[k];
      for (let j = k; j < n; j++) Mi[j] -= f * Mk[j];
      z[i] -= f * z[k];
    }
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

/**
 * Currents on a network of equal unit conductances that carries the given injections (Kirchhoff's
 * current law at every vertex, minimum-energy split). injOf(v) is the current that must leave vertex v
 * through these edges. Returns the current along each edge from u to v.
 */
function laplacianFlows(edges, injOf) {
  const out = new Float64Array(edges.length);
  if (!edges.length) return out;
  const ids = new Map();
  const verts = [];
  const idx = (v) => {
    let i = ids.get(v);
    if (i === undefined) {
      i = verts.length;
      ids.set(v, i);
      verts.push(v);
    }
    return i;
  };
  const E = edges.map((e) => [idx(e.u), idx(e.v)]);
  const m = verts.length;
  const sets = makeSets(m);
  for (const [a, c] of E) sets.union(a, c);
  const groups = new Map();
  for (let i = 0; i < m; i++) {
    const r = sets.find(i);
    if (!groups.has(r)) groups.set(r, { members: [], edges: [] });
    groups.get(r).members.push(i);
  }
  for (const e of E) groups.get(sets.find(e[0])).edges.push(e);
  const phi = new Float64Array(m);
  for (const { members, edges: ge } of groups.values()) {
    if (members.length < 2) continue;
    const local = new Map(members.slice(1).map((v, j) => [v, j])); // members[0] is grounded
    const k = members.length - 1;
    const Lap = Array.from({ length: k }, () => new Float64Array(k));
    const rhs = new Float64Array(k);
    for (const v of members.slice(1)) rhs[local.get(v)] = injOf(verts[v]);
    for (const [a, c] of ge) {
      const ia = local.get(a);
      const ic = local.get(c);
      if (ia !== undefined) Lap[ia][ia] += 1;
      if (ic !== undefined) Lap[ic][ic] += 1;
      if (ia !== undefined && ic !== undefined) {
        Lap[ia][ic] -= 1;
        Lap[ic][ia] -= 1;
      }
    }
    const sol = solveLinear(Lap, rhs);
    if (!sol) continue; // cannot happen for a connected group
    for (const v of members.slice(1)) phi[v] = sol[local.get(v)];
  }
  E.forEach(([a, c], j) => {
    out[j] = phi[a] - phi[c];
  });
  return out;
}

function lattice(p) {
  const dx = Math.sign(p.x2 - p.x1);
  const dy = Math.sign(p.y2 - p.y1);
  const n = Math.max(Math.abs(p.x2 - p.x1), Math.abs(p.y2 - p.y1));
  const pts = [];
  for (let k = 0; k <= n; k++) pts.push([p.x1 + dx * k, p.y1 + dy * k]);
  return pts;
}

function segmentKind(p) {
  if (p.type === 'W') return 'wire';
  if (p.type === 'S') return p.closed ? 'wire' : 'open';
  if (p.type === 'A') return 'meter';
  if (p.type === 'V') return 'open';
  if (p.type === 'B') return 'src';
  return 'res'; // R, L
}

/** Path of part indices between two vertices of an adjacency list [[to, part], …] (breadth first). */
function bfsParts(adj, from, to) {
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const u = queue.shift();
    if (u === to) break;
    for (const [v, part] of adj[u]) {
      if (prev.has(v)) continue;
      prev.set(v, [u, part]);
      queue.push(v);
    }
  }
  const out = [];
  for (let v = to; prev.get(v); v = prev.get(v)[0]) out.push(prev.get(v)[1]);
  return [...new Set(out.reverse())];
}

function listText(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ---------------------------------------------------------------------------------------- solve

/**
 * Solve a circuit. Never throws for any list of valid parts and never returns NaN or Infinity: a short
 * circuit or a loop of ideal cells gives ok: false with an error; a floating voltmeter gives an error
 * and a null reading while the rest of the circuit still solves.
 *
 * Signs: part.current is the current through the part from its first point to its second, except for a
 * cell (current out of its + terminal, positive when it supplies power) and meters (reading). part.voltage
 * is V(first point) − V(second point); for a cell that is its terminal voltage. part.power is the power
 * the part uses; for a cell it is the power it supplies to the rest of the circuit (VI), with
 * generated = εI and lost = I²r.
 */
export function solve(parts) {
  const names = partNames(parts);
  const pointIndex = new Map();
  const points = [];
  const pid = (x, y) => {
    const k = `${x},${y}`;
    let i = pointIndex.get(k);
    if (i === undefined) {
      i = points.length;
      pointIndex.set(k, i);
      points.push([x, y]);
    }
    return i;
  };
  const ends = new Set();
  for (const p of parts) {
    ends.add(`${p.x1},${p.y1}`);
    ends.add(`${p.x2},${p.y2}`);
  }

  // 1. Segments. A wire is split wherever another part's end point lies on it (T-junctions).
  const segs = [];
  parts.forEach((p, i) => {
    const kind = segmentKind(p);
    if (p.type === 'W') {
      const pts = lattice(p);
      let prev = pts[0];
      for (let k = 1; k < pts.length; k++) {
        const q = pts[k];
        if (k === pts.length - 1 || ends.has(`${q[0]},${q[1]}`)) {
          segs.push({ part: i, kind, a: pid(prev[0], prev[1]), b: pid(q[0], q[1]) });
          prev = q;
        }
      }
      return;
    }
    const seg = { part: i, kind, a: pid(p.x1, p.y1), b: pid(p.x2, p.y2) };
    if (kind === 'res') seg.G = 1 / p.value;
    if (kind === 'src') {
      seg.E = p.value;
      seg.r = p.r > 0 ? p.r : 0;
    }
    segs.push(seg);
  });
  const P = points.length;
  const segOfPart = parts.map(() => []);
  segs.forEach((s, k) => segOfPart[s.part].push(k));
  const degree = new Int32Array(P);
  for (const s of segs) {
    degree[s.a] += 1;
    degree[s.b] += 1;
  }

  // 2. Nodes: points joined by wires, closed switches and ammeters.
  const zeroSets = makeSets(P);
  const zeroAdj = Array.from({ length: P }, () => []);
  for (const s of segs) {
    if (s.kind !== 'wire' && s.kind !== 'meter') continue;
    zeroSets.union(s.a, s.b);
    zeroAdj[s.a].push([s.b, s.part]);
    zeroAdj[s.b].push([s.a, s.part]);
  }
  const { of: nodeOf, count: N } = compact(zeroSets, P);

  // Islands: nodes joined through resistors, lamps and cells.
  const islandSets = makeSets(N);
  for (const s of segs) if (s.kind === 'res' || s.kind === 'src') islandSets.union(nodeOf[s.a], nodeOf[s.b]);
  const { of: islandOf, count: islandCount } = compact(islandSets, N);
  const powered = new Array(islandCount).fill(false);
  const refNode = new Array(islandCount).fill(-1);
  const refPart = new Array(islandCount).fill(-1);
  for (const s of segs) {
    if (s.kind !== 'src') continue;
    const k = islandOf[nodeOf[s.a]];
    if (!powered[k]) {
      powered[k] = true;
      refNode[k] = nodeOf[s.b];
      refPart[k] = s.part;
    }
  }

  const sources = [];
  const ammeters = [];
  const voltmeters = [];
  parts.forEach((p, i) => {
    if (p.type === 'B') sources.push(i);
    else if (p.type === 'A') ammeters.push(i);
    else if (p.type === 'V') voltmeters.push(i);
  });
  const junctions = points.filter((_, p) => degree[p] >= 3);
  const nodeAt = new Map(points.map(([x, y], p) => [`${x},${y}`, nodeOf[p]]));
  const partNodes = parts.map((_, i) => {
    const ks = segOfPart[i];
    return [nodeOf[segs[ks[0]].a], nodeOf[segs[ks[ks.length - 1]].b]];
  });
  const topology = { names, nodeAt, junctions, partNodes, sources, ammeters, voltmeters };
  const makeNodes = (V) =>
    Array.from({ length: N }, (_, n) => {
      const k = islandOf[n];
      return { points: [], voltage: V ? V[n] : null, powered: powered[k], reference: refNode[k] === n, referencePart: refPart[k], island: k };
    });

  // 3. Shorts: ideal cells across a zero-resistance path, and loops of ideal cells.
  const errors = [];
  const idealSets = makeSets(N);
  const idealAdj = Array.from({ length: N }, () => []);
  for (const s of segs) {
    if (s.kind !== 'src' || s.r > 0) continue;
    const u = nodeOf[s.a];
    const v = nodeOf[s.b];
    const cell = names[s.part];
    if (u === v) {
      const path = bfsParts(zeroAdj, s.a, s.b);
      const meter = path.find((i) => parts[i].type === 'A');
      errors.push({
        code: 'short-circuit',
        title: 'Short circuit',
        message:
          meter !== undefined
            ? `${names[meter]} is connected straight across ${cell}. An ideal ammeter has no resistance, so the current would be infinite. Connect ammeters in series, in the loop, not across a cell.`
            : `The terminals of ${cell} are joined by wire with no resistance, so the current would be infinite. Put a resistor or a lamp in the loop, or give the cell some internal resistance.`,
        parts: [s.part, ...path],
      });
      continue;
    }
    if (idealSets.find(u) === idealSets.find(v)) {
      const loop = [...bfsParts(idealAdj, u, v), s.part];
      errors.push({
        code: 'source-loop',
        title: 'Cells straight across each other',
        message: `${listText(loop.map((i) => names[i]))} are ideal cells joined straight across each other. With no internal resistance the current in each one can't be found, and it would be infinite if their EMFs differ. Give the cells some internal resistance.`,
        parts: loop,
      });
      continue;
    }
    idealSets.union(u, v);
    idealAdj[u].push([v, s.part]);
    idealAdj[v].push([u, s.part]);
  }

  const blocked = (errs) => {
    const nodes = makeNodes(null);
    points.forEach((pt, p) => nodes[nodeOf[p]].points.push(pt));
    return {
      ok: false,
      errors: errs,
      notes: [],
      parts: parts.map((p) => {
        const r = { current: null, voltage: null, power: null };
        if (p.type === 'A' || p.type === 'V') r.reading = null;
        if (p.type === 'B') Object.assign(r, { generated: null, lost: null });
        return r;
      }),
      segments: segs.map((s) => ({ part: s.part, a: points[s.a], b: points[s.b], current: null })),
      nodes,
      ...topology,
    };
  };
  if (errors.length) return blocked(errors);

  // 4. Modified nodal analysis on the powered islands.
  const vIndex = new Int32Array(N).fill(-1);
  let n = 0;
  for (let node = 0; node < N; node++) {
    const k = islandOf[node];
    if (powered[k] && refNode[k] !== node) vIndex[node] = n++;
  }
  const cIndex = new Map();
  segs.forEach((s, k) => {
    if (s.kind === 'src') cIndex.set(k, n++);
  });
  const M = Array.from({ length: n }, () => new Float64Array(n));
  const rhs = new Float64Array(n);
  segs.forEach((s, k) => {
    if (s.kind === 'res') {
      const iu = vIndex[nodeOf[s.a]];
      const iv = vIndex[nodeOf[s.b]];
      if (nodeOf[s.a] === nodeOf[s.b]) return;
      if (iu >= 0) M[iu][iu] += s.G;
      if (iv >= 0) M[iv][iv] += s.G;
      if (iu >= 0 && iv >= 0) {
        M[iu][iv] -= s.G;
        M[iv][iu] -= s.G;
      }
    } else if (s.kind === 'src') {
      // KCL rows count current leaving each node. The cell's current I flows out of + (a) into the circuit:
      // it leaves node − (b) into the cell and enters node + from it. Row c: V(+) − V(−) + rI = ε.
      const c = cIndex.get(k);
      const ia = vIndex[nodeOf[s.a]];
      const ib = vIndex[nodeOf[s.b]];
      if (ia >= 0) {
        M[ia][c] -= 1;
        M[c][ia] += 1;
      }
      if (ib >= 0) {
        M[ib][c] += 1;
        M[c][ib] -= 1;
      }
      M[c][c] += s.r;
      rhs[c] = s.E;
    }
  });
  const x = n ? solveLinear(M, rhs) : new Float64Array(0);
  if (!x || ![...x].every(Number.isFinite)) {
    return blocked([{ code: 'singular', title: 'Cannot solve', message: 'This circuit could not be solved. Undo the last change, or check for parts joined in an unusual way.', parts: [] }]);
  }
  const Vn = new Array(N).fill(null);
  for (let node = 0; node < N; node++) if (powered[islandOf[node]]) Vn[node] = vIndex[node] >= 0 ? x[vIndex[node]] : 0;

  // Currents in resistors, lamps and cells (from the first point to the second).
  const flow = new Float64Array(segs.length);
  segs.forEach((s, k) => {
    if (s.kind === 'res') {
      const va = Vn[nodeOf[s.a]];
      const vb = Vn[nodeOf[s.b]];
      flow[k] = va === null || vb === null ? 0 : (va - vb) * s.G;
    } else if (s.kind === 'src') flow[k] = -x[cIndex.get(k)];
  });
  // Current arriving at each point from those parts.
  const inj = new Float64Array(P);
  segs.forEach((s, k) => {
    if (s.kind === 'res' || s.kind === 'src') {
      inj[s.a] -= flow[k];
      inj[s.b] += flow[k];
    }
  });

  // 5. Zero-resistance parts. First the ammeters, between groups of points joined by wires (a wire across an
  // ammeter puts both its ends in one group, so it reads zero); then the wires inside each group.
  const wireSets = makeSets(P);
  for (const s of segs) if (s.kind === 'wire') wireSets.union(s.a, s.b);
  const meterEdges = [];
  const bypassed = [];
  segs.forEach((s, k) => {
    if (s.kind !== 'meter') return;
    const u = wireSets.find(s.a);
    const v = wireSets.find(s.b);
    if (u === v) bypassed.push(s.part);
    else meterEdges.push({ k, u, v });
  });
  const groupInj = new Float64Array(P);
  for (let p = 0; p < P; p++) groupInj[wireSets.find(p)] += inj[p];
  const meterFlows = laplacianFlows(meterEdges, (g) => groupInj[g]);
  meterEdges.forEach((e, j) => {
    flow[e.k] = meterFlows[j];
  });
  const wireInj = Float64Array.from(inj);
  segs.forEach((s, k) => {
    if (s.kind === 'meter') {
      wireInj[s.a] -= flow[k];
      wireInj[s.b] += flow[k];
    }
  });
  const wireEdges = [];
  segs.forEach((s, k) => {
    if (s.kind === 'wire') wireEdges.push({ k, u: s.a, v: s.b });
  });
  const wireFlows = laplacianFlows(wireEdges, (p) => wireInj[p]);
  wireEdges.forEach((e, j) => {
    flow[e.k] = wireFlows[j];
  });

  // Round-off: a balanced bridge gives ~1e-17 A, which is zero. Snap relative to the largest value.
  let iMax = 0;
  for (const f of flow) iMax = Math.max(iMax, Math.abs(f));
  let vMax = 0;
  for (const v of Vn) if (v !== null) vMax = Math.max(vMax, Math.abs(v));
  const iTol = Math.max(1e-15, iMax * 1e-12);
  const vTol = Math.max(1e-15, vMax * 1e-12);
  const snapI = (i) => (Math.abs(i) < iTol ? 0 : i);
  const snapV = (v) => (v === null ? null : Math.abs(v) < vTol ? 0 : v);

  // Potential difference between two points: null when they are in different islands (undefined).
  const diff = (pa, pb) => {
    const na = nodeOf[pa];
    const nb = nodeOf[pb];
    if (na === nb) return 0;
    const ka = islandOf[na];
    if (ka !== islandOf[nb]) return null;
    if (!powered[ka]) return 0; // no cell: no current, so every point is at the same potential
    return Vn[na] - Vn[nb];
  };

  const results = parts.map((p, i) => {
    const ks = segOfPart[i];
    const s0 = segs[ks[0]];
    const f0 = flow[ks[0]];
    const r = { current: 0, voltage: 0, power: 0 };
    switch (p.type) {
      case 'W': {
        let best = 0;
        for (const k of ks) if (Math.abs(flow[k]) > Math.abs(best)) best = flow[k];
        r.current = snapI(best);
        break;
      }
      case 'R':
      case 'L':
        r.current = snapI(f0);
        r.voltage = snapV(diff(s0.a, s0.b));
        r.power = r.voltage * r.current;
        break;
      case 'B': {
        const I = snapI(-f0);
        const v = snapV(diff(s0.a, s0.b));
        Object.assign(r, { current: I, voltage: v, power: v * I, generated: p.value * I, lost: (p.r > 0 ? p.r : 0) * I * I });
        break;
      }
      case 'S':
        if (p.closed) r.current = snapI(f0);
        else r.voltage = snapV(diff(s0.a, s0.b));
        break;
      case 'A':
        r.current = snapI(f0);
        r.reading = r.current;
        if (bypassed.includes(i)) r.bypassed = true;
        break;
      case 'V':
        r.voltage = snapV(diff(s0.a, s0.b));
        r.reading = r.voltage;
        break;
      default:
        break;
    }
    return r;
  });

  // Floating nodes: a voltmeter whose reading is undefined.
  for (const i of voltmeters) {
    if (results[i].reading !== null) continue;
    const s = segs[segOfPart[i][0]];
    const ka = islandOf[nodeOf[s.a]];
    const kb = islandOf[nodeOf[s.b]];
    const loose = degree[s.a] === 1 || degree[s.b] === 1;
    errors.push({
      code: 'floating',
      title: 'Floating node',
      message: loose
        ? `${names[i]} has a terminal that isn't connected to anything, so it has no reading. Connect both of its terminals into the circuit.`
        : powered[ka] && powered[kb]
          ? `${names[i]} joins two separate circuits, so the potential difference it would show is undefined. Connect it across parts of one circuit.`
          : `${names[i]} is connected to part of the circuit that has no cell, so its reading is undefined.`,
      parts: [i],
    });
  }

  // Notes: calm explanations, not errors.
  const notes = [];
  if (!parts.length) notes.push({ code: 'empty', message: 'Choose a part, then click the grid to place it.', parts: [] });
  else if (!sources.length) notes.push({ code: 'no-source', message: 'There is no cell, so no current flows. Add a cell.', parts: [] });
  else if (sources.every((i) => results[i].current === 0)) notes.push({ code: 'open', message: 'There is no complete loop through a cell, so no current flows.', parts: [] });
  for (const i of bypassed) notes.push({ code: 'bypassed', message: `${names[i]} has a wire straight across it, so it reads zero.`, parts: [i] });
  const shorted = parts.map((p, i) => i).filter((i) => (parts[i].type === 'R' || parts[i].type === 'L') && partNodes[i][0] === partNodes[i][1]);
  if (shorted.length) {
    const many = shorted.length > 1;
    notes.push({ code: 'shorted', message: `${listText(shorted.map((i) => names[i]))} ${many ? 'have' : 'has'} a wire straight across ${many ? 'them' : 'it'} (short-circuited), so no current flows through ${many ? 'them' : 'it'}.`, parts: shorted });
  }
  if (sources.length) {
    const cut = parts.map((p, i) => i).filter((i) => (parts[i].type === 'R' || parts[i].type === 'L') && !powered[islandOf[partNodes[i][0]]]);
    if (cut.length) {
      const many = cut.length > 1;
      notes.push({ code: 'unpowered', message: `${listText(cut.map((i) => names[i]))} ${many ? 'are' : 'is'} not connected to a cell, so no current flows through ${many ? 'them' : 'it'}.`, parts: cut });
    }
  }

  const nodes = makeNodes(Vn.map(snapV));
  points.forEach((pt, p) => nodes[nodeOf[p]].points.push(pt));
  return {
    ok: true,
    errors,
    notes,
    parts: results,
    segments: segs.map((s, k) => ({ part: s.part, a: points[s.a], b: points[s.b], current: flow[k] })),
    nodes,
    ...topology,
  };
}

// ---------------------------------------------------------------------------------------- outputs and data

/** Readouts in SI units, unrounded. `selected` is the index of the selected part (or −1). */
export function outputs(sol, selected = -1) {
  const out = { current: null, terminalVoltage: null, power: null, resistance: null, a1: null, a2: null, a3: null, v1: null, v2: null, v3: null, partCurrent: null, partVoltage: null, partPower: null };
  if (!sol || !sol.ok) return out;
  if (sol.sources.length) {
    const first = sol.parts[sol.sources[0]];
    out.current = first.current;
    out.terminalVoltage = first.voltage;
    out.power = sol.sources.reduce((sum, i) => sum + sol.parts[i].power, 0);
    if (sol.sources.length === 1 && first.current > 0) out.resistance = first.voltage / first.current;
  }
  sol.ammeters.slice(0, 3).forEach((i, k) => {
    out[`a${k + 1}`] = sol.parts[i].reading;
  });
  sol.voltmeters.slice(0, 3).forEach((i, k) => {
    out[`v${k + 1}`] = sol.parts[i].reading;
  });
  const part = sol.parts[selected];
  if (part) {
    out.partCurrent = part.current;
    out.partVoltage = part.voltage;
    out.partPower = part.power;
  }
  return out;
}

/** One row per part (wires left out) for the CSV export. */
export function dataTable(parts, sol) {
  const columns = ['Part', 'Type', 'Setting', 'Unit', 'Current (A)', 'Voltage (V)', 'Power used (W)', 'Power supplied (W)'];
  const rows = [];
  parts.forEach((p, i) => {
    if (p.type === 'W') return;
    const r = sol.parts[i];
    let setting = null;
    let unit = '';
    if (p.type === 'R' || p.type === 'L') {
      setting = p.value;
      unit = 'Ω';
    } else if (p.type === 'B') {
      setting = p.value;
      unit = p.r > 0 ? `V (r = ${num(p.r)} Ω)` : 'V';
    } else if (p.type === 'S') setting = p.closed ? 'closed' : 'open';
    const used = p.type === 'B' ? (r.lost ?? null) : r.power;
    rows.push([sol.names[i], PART_INFO[p.type].name, setting, unit, r.current, r.voltage, used, p.type === 'B' ? r.power : null]);
  });
  return { columns, rows };
}

/** A sentence for the stage's aria-label. */
export function describe(parts, sol) {
  if (!parts.length) return 'An empty circuit grid, ready for parts.';
  const counts = {};
  for (const p of parts) if (p.type !== 'W') counts[p.type] = (counts[p.type] ?? 0) + 1;
  const list = Object.entries(counts).map(([t, c]) => `${c} ${c === 1 ? PART_INFO[t].name.toLowerCase() : PART_INFO[t].plural}`);
  let text = `Circuit diagram with ${list.length ? listText(list) : 'only wires'}.`;
  const err = sol.errors[0];
  if (err) text += ` ${err.title}: ${err.message}`;
  if (sol.ok && sol.sources.length) {
    const c = sol.parts[sol.sources[0]];
    text += ` ${sol.names[sol.sources[0]]} supplies ${formatNumber(c.current)} amperes at ${formatNumber(c.voltage)} volts.`;
  }
  return text;
}

// ---------------------------------------------------------------------------------------- editing

function span(p) {
  return p.y1 === p.y2
    ? { horizontal: true, at: p.y1, lo: Math.min(p.x1, p.x2), hi: Math.max(p.x1, p.x2) }
    : { horizontal: false, at: p.x1, lo: Math.min(p.y1, p.y2), hi: Math.max(p.y1, p.y2) };
}
const isEnd = (p, x, y) => (p.x1 === x && p.y1 === y) || (p.x2 === x && p.y2 === y);

/** True if grid point (x, y) lies on the part, ends included. */
export function onPart(p, x, y) {
  const s = span(p);
  return s.horizontal ? y === s.at && x >= s.lo && x <= s.hi : x === s.at && y >= s.lo && y <= s.hi;
}

/**
 * Why a part can't go here (a sentence), or null if it can. Rules: on the grid and straight; no
 * overlapping another part along its length; nothing may cross a part or touch its middle, except that
 * wires may cross wires (no connection) and an end may land on a wire's middle (a T-junction).
 */
export function placementProblem(parts, cand, ignore = -1) {
  const g = geometryProblem(cand);
  if (g) return `That part ${g}.`;
  const names = partNames(parts);
  const cs = span(cand);
  for (let j = 0; j < parts.length; j++) {
    if (j === ignore) continue;
    const o = parts[j];
    const os = span(o);
    if (cs.horizontal === os.horizontal) {
      if (cs.at === os.at && Math.min(cs.hi, os.hi) - Math.max(cs.lo, os.lo) > 0) return `That would overlap ${names[j]}.`;
      continue;
    }
    const hs = cs.horizontal ? cs : os;
    const vs = cs.horizontal ? os : cs;
    const x = vs.at;
    const y = hs.at;
    if (x < hs.lo || x > hs.hi || y < vs.lo || y > vs.hi) continue;
    const candEnd = isEnd(cand, x, y);
    const otherEnd = isEnd(o, x, y);
    if (candEnd && otherEnd) continue; // a corner: they join
    if (!candEnd && !otherEnd) {
      if (cand.type === 'W' && o.type === 'W') continue; // wires may cross without joining
      return `Parts can't cross: that would cross ${names[j]}.`;
    }
    const middle = candEnd ? o : cand;
    if (middle.type === 'W') continue; // a T-junction on a wire
    return candEnd ? `That would touch the middle of ${names[j]}.` : `${names[j]} would touch the middle of that part.`;
  }
  return null;
}

/** A clean copy of a part with its settings clamped to LIMITS. */
export function normalisePart(p) {
  const out = { type: p.type, x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 };
  if (p.type === 'R' || p.type === 'L') out.value = clamp(Number(p.value ?? NEW_PART[p.type].value) || NEW_PART[p.type].value, ...LIMITS.resistance);
  if (p.type === 'B') {
    out.value = clamp(Number(p.value ?? NEW_PART.B.value) || NEW_PART.B.value, ...LIMITS.emf);
    out.r = clamp(Number(p.r ?? 0) || 0, ...LIMITS.internal);
  }
  if (p.type === 'S') out.closed = Boolean(p.closed);
  return out;
}

/** @returns {{ parts: object[], problem: string|null }} */
export function addPart(parts, cand) {
  if (parts.length >= MAX_PARTS) return { parts, problem: `There is room for ${MAX_PARTS} parts at most.` };
  const part = normalisePart(cand);
  const problem = placementProblem(parts, part);
  return problem ? { parts, problem } : { parts: [...parts, part], problem: null };
}

function replaceChecked(parts, i, cand) {
  const problem = placementProblem(parts, cand, i);
  if (problem) return { parts, problem };
  const next = parts.slice();
  next[i] = cand;
  return { parts: next, problem: null };
}

/** Move part i by (dx, dy) grid cells. */
export function movePart(parts, i, dx, dy) {
  const p = parts[i];
  return replaceChecked(parts, i, { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy });
}

/** Move one end (1 or 2) of part i to (x, y). */
export function moveEnd(parts, i, which, x, y) {
  const p = parts[i];
  return replaceChecked(parts, i, which === 1 ? { ...p, x1: x, y1: y } : { ...p, x2: x, y2: y });
}

/**
 * Turn part i a quarter turn clockwise (on screen). Even lengths turn about the middle; odd lengths step
 * through right, down, left, up inside their bounding square. Two turns swap the ends, which reverses a
 * cell or a meter.
 */
export function rotatePart(parts, i) {
  const p = parts[i];
  const len = Math.abs(p.x2 - p.x1) + Math.abs(p.y2 - p.y1);
  let cand;
  if (len % 2 === 0) {
    const mx = (p.x1 + p.x2) / 2;
    const my = (p.y1 + p.y2) / 2;
    const turn = (x, y) => [mx - (y - my), my + (x - mx)];
    const [x1, y1] = turn(p.x1, p.y1);
    const [x2, y2] = turn(p.x2, p.y2);
    cand = { ...p, x1, y1, x2, y2 };
  } else {
    const ox = Math.min(p.x1, p.x2);
    const oy = Math.min(p.y1, p.y2);
    const dir = p.x2 > p.x1 ? 0 : p.y2 > p.y1 ? 1 : p.x2 < p.x1 ? 2 : 3;
    const ends = [
      [ox, oy, ox + len, oy],
      [ox, oy, ox, oy + len],
      [ox + len, oy, ox, oy],
      [ox, oy + len, ox, oy],
    ][(dir + 1) % 4];
    cand = { ...p, x1: ends[0], y1: ends[1], x2: ends[2], y2: ends[3] };
  }
  const result = replaceChecked(parts, i, cand);
  if (result.problem && /grid/.test(result.problem)) result.problem = 'There is no room to turn it here.';
  return result;
}

export function removePart(parts, i) {
  return parts.filter((_, j) => j !== i);
}

/** Change settings of part i (value, r, closed), clamped to LIMITS. */
export function updatePart(parts, i, patch) {
  const next = parts.slice();
  next[i] = normalisePart({ ...parts[i], ...patch });
  return next;
}

/** Index of the part nearest grid position (gx, gy) within `tol` cells (parts beat wires), or −1. */
export function partAt(parts, gx, gy, tol = 0.3) {
  let best = -1;
  let bestScore = Infinity;
  parts.forEach((p, i) => {
    const dx = p.x2 - p.x1;
    const dy = p.y2 - p.y1;
    const len2 = dx * dx + dy * dy;
    const t = clamp(((gx - p.x1) * dx + (gy - p.y1) * dy) / len2, 0, 1);
    const d = Math.hypot(gx - (p.x1 + t * dx), gy - (p.y1 + t * dy));
    if (d > tol) return;
    const score = d + (p.type === 'W' ? 0.2 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/** The node at grid point (x, y): a part's end, or anywhere along a wire. −1 if none. */
export function nodeAt(parts, sol, x, y) {
  const k = `${x},${y}`;
  if (sol.nodeAt.has(k)) return sol.nodeAt.get(k);
  for (let i = 0; i < parts.length; i++) if (parts[i].type === 'W' && onPart(parts[i], x, y)) return sol.partNodes[i][0];
  return -1;
}

/** Snap (gx, gy) to the grid along the row or column through (x0, y0), whichever is nearer the pointer. */
export function snapAxis(x0, y0, gx, gy) {
  let x = x0;
  let y = y0;
  if (Math.abs(gx - x0) >= Math.abs(gy - y0)) x = Math.round(gx);
  else y = Math.round(gy);
  return [clamp(x, 0, GRID.cols), clamp(y, 0, GRID.rows)];
}

/**
 * A new part of `type` starting at (x, y), two cells long in direction (dx, dy) if it fits there,
 * otherwise in the first direction that does. Returns { parts, index, problem }.
 */
export function placeNew(parts, type, x, y, dx = 1, dy = 0) {
  const len = type === 'W' ? 1 : 2;
  const dirs = [[dx, dy], [1, 0], [0, 1], [-1, 0], [0, -1]];
  let first = null;
  for (const [ux, uy] of dirs) {
    const cand = { type, x1: x, y1: y, x2: x + ux * len, y2: y + uy * len, ...(NEW_PART[type] ?? {}) };
    const r = addPart(parts, cand);
    if (!r.problem) return { parts: r.parts, index: r.parts.length - 1, problem: null };
    first ??= r.problem;
  }
  return { parts, index: -1, problem: first };
}

// ---------------------------------------------------------------------------------------- animation

/** Dot speed in grid cells per second: proportional to |I|, capped at DOT_MAX_SPEED. */
export function dotSpeed(current, perAmp) {
  const v = Math.abs(current) * perAmp;
  return v > DOT_MAX_SPEED ? { speed: DOT_MAX_SPEED, capped: true } : { speed: v, capped: false };
}

/**
 * How far (0 … DOT_SPACING cells) the dots on a branch have moved at time t, measured from the branch's
 * first point towards its second. Positive current runs first → second. null when there is no current.
 */
export function dotPhase(current, t, perAmp) {
  if (!(Math.abs(current) >= CURRENT_EPS)) return null;
  const d = Math.sign(current) * dotSpeed(current, perAmp).speed * t;
  return ((d % DOT_SPACING) + DOT_SPACING) % DOT_SPACING;
}

export function createState() {
  return { n: 0, t: 0 };
}

/** Advance the animation clock by whole fixed steps (t = n·DT, so it never drifts). */
export function advance(state, steps = 1) {
  const n = state.n + Math.max(0, Math.floor(steps));
  return { n, t: n * DT };
}
