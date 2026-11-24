// Statics engine model: pin-jointed trusses, beams (SFD, BMD, bending stress), moments, concurrent
// forces (with the three-force rule) and a block on an incline with friction.
// Pure: no DOM, no timers, no randomness. Importable in Node; tests/engines/statics.test.mjs checks it
// against analytic answers.
//
// Units: lengths in m (beam sections in mm), forces in kN for trusses, beams and moments, N for the
// force sandbox and the incline. Angles in degrees at the API, radians inside.
// Sign conventions:
//   truss member force   + tension, − compression
//   reactions            + along +x (right) and +y (up)
//   beam shear V(x)      sum of upward forces to the left of the section (+ when the left part is pushed up)
//   beam moment M(x)     + sagging (bottom fibre in tension), − hogging
//   moments              clockwise-positive internally; the chosen convention is applied on output

export const DEG = Math.PI / 180;

/** Remove float noise such as cos 90° = 6e-17: values tiny next to `scale` become exactly 0. */
export function clean(v, scale = 1) {
  return Math.abs(v) <= 1e-12 * Math.max(1, Math.abs(scale)) ? 0 : v;
}

/* ------------------------------------------------------------------------------------------------
 * Linear algebra
 * ---------------------------------------------------------------------------------------------- */

/**
 * Solve A x = b by Gaussian elimination with partial pivoting. Inputs are not changed.
 * @param {number[][]} A square matrix
 * @param {number[]} b
 * @param {number} [tol] a pivot at or below this magnitude means the system is singular
 * @returns {{ ok: true, x: number[] } | { ok: false, rank: number }}
 */
export function solveLinear(A, b, tol = 1e-10) {
  const n = b.length;
  if (A.length !== n || A.some((row) => row.length !== n)) throw new Error('solveLinear needs a square system');
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    let best = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > best) {
        best = v;
        piv = r;
      }
    }
    if (!(best > tol)) return { ok: false, rank: col };
    if (piv !== col) [M[piv], M[col]] = [M[col], M[piv]];
    const p = M[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / p;
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return { ok: true, x };
}

/* ------------------------------------------------------------------------------------------------
 * Trusses
 *
 * A truss is { joints: [{x, y}], members: [[a, b]], supports: [{joint, type}], loads: [{joint, fx, fy}] }
 * with joints lettered A, B, C … in order, coordinates in m and loads in kN (y up).
 * Support types: 'pin' (reacts x and y), 'roller' (reacts y; rolls along the ground),
 * 'side' (reacts x; a roller against a wall).
 *
 * Text encoding (the `truss` URL param), sections separated by ';', items by spaces:
 *   j:x,y x,y …     joints in m, lettered A, B, C … in order (required)
 *   m:AB BC …       members, each a pair of joint letters
 *   s:Ap Er         supports: p pin, r roller (vertical reaction), h side roller (horizontal reaction)
 *   l:C0,-10 …      extra joint loads fx,fy in kN (y up), added to the load P from the controls
 * Example: j:0,0 4,0 2,3;m:AB AC BC;s:Ap Br;l:C0,-10
 * ---------------------------------------------------------------------------------------------- */

export const MAX_JOINTS = 26;
export const MAX_MEMBERS = 100;
export const MAX_LOADS = 52;
export const MAX_COORD = 1000; // m
export const MAX_LOAD = 100000; // kN
export const TRUSS_MAX_LENGTH = 1500;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Joint letter for index i (A for 0). */
export function jointName(i) {
  return LETTERS[i] ?? `J${i + 1}`;
}

/** Index for a joint letter (case-insensitive), or −1. */
export function jointIndex(letter) {
  if (typeof letter !== 'string' || letter.length !== 1) return -1;
  return LETTERS.indexOf(letter.toUpperCase());
}

/** Member name from its joint indices, e.g. "AB". */
export function memberName([a, b]) {
  return jointName(a) + jointName(b);
}

export const SUPPORT_REACTIONS = { pin: ['x', 'y'], roller: ['y'], side: ['x'] };
const SUPPORT_FROM_CODE = { p: 'pin', r: 'roller', h: 'side' };
const SUPPORT_CODE = { pin: 'p', roller: 'r', side: 'h' };
export const SUPPORT_CYCLE = [null, 'pin', 'roller', 'side'];

/** Preset structures. Keys are the `structure` enum values. */
export const TRUSS_PRESETS = {
  equilateral: 'Equilateral triangle',
  warren: 'Warren truss',
  pratt: 'Pratt truss',
  howe: 'Howe truss',
  bracket: 'Wall bracket',
  mechanism: 'Frame without a diagonal',
  braced: 'Frame with two diagonals',
};

/**
 * Build a preset truss (no loads; the page's load P is added separately).
 * Joints are lettered along the bottom chord first (left to right), then the top chord.
 * @param {string} kind a TRUSS_PRESETS key
 * @param {{ span?: number, height?: number, panels?: number }} [dims] metres; panels for Warren, Pratt, Howe
 */
export function presetTruss(kind, { span = 12, height = 3, panels = 4 } = {}) {
  const L = span;
  const h = height;
  const n = Math.max(2, Math.round(panels));
  const d = L / n;
  const joints = [];
  const members = [];
  switch (kind) {
    case 'equilateral': {
      joints.push({ x: 0, y: 0 }, { x: L, y: 0 }, { x: L / 2, y: (L * Math.sqrt(3)) / 2 });
      members.push([0, 1], [0, 2], [1, 2]);
      return { joints, members, supports: [{ joint: 0, type: 'pin' }, { joint: 1, type: 'roller' }], loads: [] };
    }
    case 'warren': {
      for (let i = 0; i <= n; i++) joints.push({ x: i * d, y: 0 });
      for (let i = 0; i < n; i++) joints.push({ x: (i + 0.5) * d, y: h });
      const top = (i) => n + 1 + i;
      for (let i = 0; i < n; i++) members.push([i, i + 1]);
      for (let i = 0; i < n - 1; i++) members.push([top(i), top(i + 1)]);
      for (let i = 0; i < n; i++) members.push([i, top(i)], [top(i), i + 1]);
      return { joints, members, supports: [{ joint: 0, type: 'pin' }, { joint: n, type: 'roller' }], loads: [] };
    }
    case 'pratt':
    case 'howe': {
      // Flat chords, inclined end posts, verticals at every interior panel point.
      // Pratt: interior diagonals slope down towards mid-span (tension under gravity loads).
      // Howe: interior diagonals slope up towards mid-span (compression under gravity loads).
      for (let i = 0; i <= n; i++) joints.push({ x: i * d, y: 0 });
      for (let i = 1; i < n; i++) joints.push({ x: i * d, y: h });
      const top = (i) => n + i; // top joint above bottom joint i (1 ≤ i ≤ n − 1)
      for (let i = 0; i < n; i++) members.push([i, i + 1]);
      for (let i = 1; i < n - 1; i++) members.push([top(i), top(i + 1)]);
      for (let i = 1; i < n; i++) members.push([i, top(i)]);
      members.push([0, top(1)], [n, top(n - 1)]);
      for (let i = 1; i < n - 1; i++) {
        const leftHalf = i + 0.5 <= n / 2;
        const down = (kind === 'pratt') === leftHalf; // "\" from top-left to bottom-right
        members.push(down ? [top(i), i + 1] : [i, top(i + 1)]);
      }
      return { joints, members, supports: [{ joint: 0, type: 'pin' }, { joint: n, type: 'roller' }], loads: [] };
    }
    case 'bracket': {
      // A (top) and B (bottom) pinned to a wall at x = 0; C is the tip.
      joints.push({ x: 0, y: h }, { x: 0, y: 0 }, { x: L, y: h });
      members.push([0, 2], [1, 2]);
      return { joints, members, supports: [{ joint: 0, type: 'pin' }, { joint: 1, type: 'pin' }], loads: [] };
    }
    case 'mechanism':
    case 'braced': {
      joints.push({ x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: h }, { x: 0, y: h });
      members.push([0, 1], [1, 2], [2, 3], [3, 0]);
      if (kind === 'braced') members.push([0, 2], [1, 3]);
      return { joints, members, supports: [{ joint: 0, type: 'pin' }, { joint: 1, type: 'roller' }], loads: [] };
    }
    default:
      throw new Error(`Unknown truss preset "${kind}"`);
  }
}

const NUM_RE = /^[-+]?(\d+\.?\d*|\.\d+)$/;
const SECTION_NAMES = { j: 'joints', m: 'members', s: 'supports', l: 'loads' };

function parseNum(s) {
  return NUM_RE.test(s) ? Number(s) : NaN;
}

function shorten(s, n = 24) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/**
 * Text pasted from documents often carries typographic characters: no-break and other Unicode spaces,
 * tabs, and minus signs or dashes (U+2212, en dash …). Turn them into a plain space and hyphen-minus.
 */
export function normaliseTrussText(text) {
  return String(text)
    .replace(/[\s  -​  　﻿]+/g, ' ')
    .replace(/[‐-―−﹣－]/g, '-');
}

/**
 * Parse the text encoding. Never throws.
 * @returns {{ ok: true, truss: object } | { ok: false, error: string }}
 */
export function parseTruss(text) {
  const fail = (error) => ({ ok: false, error });
  const src = typeof text === 'string' ? normaliseTrussText(text).trim() : '';
  if (!src) return fail('The structure text is empty. Start with j: and the joint coordinates.');
  if (src.length > TRUSS_MAX_LENGTH) return fail(`The structure text is longer than ${TRUSS_MAX_LENGTH} characters.`);
  const stray = /[^A-Za-z0-9:;,. +-]/.exec(src);
  if (stray) return fail(`The character "${stray[0]}" isn't used in structure text. Use letters, numbers, spaces and : ; , . -`);
  const sections = {};
  for (const raw of src.split(';')) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^([jmslJMSL])\s*:\s*([\s\S]*)$/.exec(part);
    if (!m) return fail(`"${shorten(part)}" should start with j:, m:, s: or l:.`);
    const key = m[1].toLowerCase();
    if (key in sections) return fail(`The ${SECTION_NAMES[key]} section (${key}:) appears twice.`);
    sections[key] = m[2].split(/\s+/).filter(Boolean);
  }
  if (!sections.j || !sections.j.length) return fail('List the joints first, for example j:0,0 4,0 2,3.');

  const joints = [];
  for (const item of sections.j) {
    const xy = item.split(',');
    const x = parseNum(xy[0] ?? '');
    const y = parseNum(xy[1] ?? '');
    if (xy.length !== 2 || !Number.isFinite(x) || !Number.isFinite(y)) return fail(`Joint "${shorten(item)}" should be two numbers like 4,0 (x,y in m).`);
    if (Math.abs(x) > MAX_COORD || Math.abs(y) > MAX_COORD) return fail(`Joint "${shorten(item)}" is more than ${MAX_COORD} m from the origin.`);
    joints.push({ x, y });
  }
  if (joints.length < 2) return fail('A truss needs at least two joints.');
  if (joints.length > MAX_JOINTS) return fail(`There are ${joints.length} joints; the limit is ${MAX_JOINTS} (A to Z).`);
  for (let a = 0; a < joints.length; a++) {
    for (let b = a + 1; b < joints.length; b++) {
      if (Math.hypot(joints[a].x - joints[b].x, joints[a].y - joints[b].y) < 1e-6) return fail(`Joints ${jointName(a)} and ${jointName(b)} are at the same point.`);
    }
  }
  const letter = (c) => {
    const i = jointIndex(c);
    return i >= 0 && i < joints.length ? i : -1;
  };

  const members = [];
  const seen = new Set();
  for (const item of sections.m ?? []) {
    if (!/^[A-Za-z]{2}$/.test(item)) return fail(`Member "${shorten(item)}" should be two joint letters, like AB.`);
    const a = letter(item[0]);
    const b = letter(item[1]);
    if (a < 0 || b < 0) return fail(`Member ${item.toUpperCase()} uses a joint that isn't listed (joints run A to ${jointName(joints.length - 1)}).`);
    if (a === b) return fail(`Member ${item.toUpperCase()} joins a joint to itself.`);
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return fail(`Member ${memberName([Math.min(a, b), Math.max(a, b)])} is listed twice.`);
    seen.add(key);
    members.push([a, b]);
  }
  if (members.length > MAX_MEMBERS) return fail(`There are ${members.length} members; the limit is ${MAX_MEMBERS}.`);

  const supports = [];
  for (const item of sections.s ?? []) {
    const m = /^([A-Za-z])([prhPRH])$/.exec(item);
    if (!m) return fail(`Support "${shorten(item)}" should be a joint letter then p (pin), r (roller) or h (side roller), like Ap.`);
    const j = letter(m[1]);
    if (j < 0) return fail(`Support ${item} is at a joint that isn't listed.`);
    if (supports.some((s) => s.joint === j)) return fail(`Joint ${jointName(j)} has two supports.`);
    supports.push({ joint: j, type: SUPPORT_FROM_CODE[m[2].toLowerCase()] });
  }

  const loads = [];
  for (const item of sections.l ?? []) {
    const m = /^([A-Za-z])(.*)$/.exec(item);
    const parts = m ? m[2].split(',') : [];
    const fx = parseNum(parts[0] ?? '');
    const fy = parseNum(parts[1] ?? '');
    if (!m || parts.length !== 2 || !Number.isFinite(fx) || !Number.isFinite(fy)) return fail(`Load "${shorten(item)}" should be a joint letter then fx,fy in kN, like C0,-10.`);
    const j = letter(m[1]);
    if (j < 0) return fail(`Load ${shorten(item)} is at a joint that isn't listed.`);
    if (Math.abs(fx) > MAX_LOAD || Math.abs(fy) > MAX_LOAD) return fail(`Load ${shorten(item)} is larger than ${MAX_LOAD} kN.`);
    loads.push({ joint: j, fx, fy });
  }
  if (loads.length > MAX_LOADS) return fail(`There are ${loads.length} loads; the limit is ${MAX_LOADS}.`);

  return { ok: true, truss: { joints, members, supports, loads } };
}

/** Number for the encoding: at most 4 decimals (0.1 mm), no trailing zeros. */
function encNum(v) {
  const s = String(Number(v.toFixed(4)));
  return s === '-0' ? '0' : s;
}

/** Text encoding of a truss (inverse of parseTruss, to 4 decimals). */
export function encodeTruss(truss) {
  const parts = [`j:${truss.joints.map((p) => `${encNum(p.x)},${encNum(p.y)}`).join(' ')}`];
  if (truss.members.length) parts.push(`m:${truss.members.map(memberName).join(' ')}`);
  if (truss.supports.length) parts.push(`s:${truss.supports.map((s) => jointName(s.joint) + SUPPORT_CODE[s.type]).join(' ')}`);
  if (truss.loads.length) parts.push(`l:${truss.loads.map((l) => `${jointName(l.joint)}${encNum(l.fx)},${encNum(l.fy)}`).join(' ')}`);
  return parts.join(';');
}

/** Counts for the determinacy check: m + r compared with 2j. */
export function trussDeterminacy(truss) {
  const m = truss.members.length;
  const j = truss.joints.length;
  const r = truss.supports.reduce((sum, s) => sum + SUPPORT_REACTIONS[s.type].length, 0);
  const index = m + r - 2 * j;
  return { m, r, j, index, kind: index < 0 ? 'mechanism' : index > 0 ? 'indeterminate' : 'determinate' };
}

/** Length of member k (m). */
export function memberLength(truss, k) {
  const [a, b] = truss.members[k];
  const A = truss.joints[a];
  const B = truss.joints[b];
  return Math.hypot(B.x - A.x, B.y - A.y);
}

/**
 * Add the page's load P (kN) at a joint. The angle is measured from straight down, positive
 * turning towards +x. Returns the loaded truss and the load that was added (null if none).
 */
export function withPointLoad(truss, { load = 0, loadAt = 'A', loadAngle = 0 } = {}) {
  const j = jointIndex(loadAt);
  const exists = j >= 0 && j < truss.joints.length;
  if (!exists || !(load > 0)) return { truss, added: null, missingJoint: !exists };
  const t = loadAngle * DEG;
  const added = { joint: j, fx: clean(load * Math.sin(t), load), fy: clean(-load * Math.cos(t), load), main: true };
  return { truss: { ...truss, loads: [...truss.loads, added] }, added, missingJoint: false };
}

/**
 * Method of joints as one linear system: 2j equilibrium equations (ΣFx = 0, ΣFy = 0 at every joint)
 * in m member forces and r reactions. Solved only when m + r = 2j; a mechanism or an indeterminate
 * truss is reported, never solved.
 * @returns {{ status: 'solved'|'mechanism'|'indeterminate'|'unstable', message: string,
 *   determinacy: ReturnType<typeof trussDeterminacy>, forces: number[]|null,
 *   reactions: { joint: number, type: string, rx: number, ry: number }[]|null, residual?: number }}
 */
export function solveTruss(truss) {
  const det = trussDeterminacy(truss);
  const { m, r, j } = det;
  const base = { determinacy: det, forces: null, reactions: null };
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (det.kind === 'mechanism') {
    const loose = truss.joints.findIndex((_, i) => !truss.members.some(([a, b]) => a === i || b === i) && !truss.supports.some((s) => s.joint === i));
    return {
      ...base,
      status: 'mechanism',
      message:
        `Mechanism: m + r = ${m} + ${r} = ${m + r}, which is less than 2j = ${2 * j}. ` +
        (loose >= 0 ? `Joint ${jointName(loose)} isn't connected to anything. ` : 'The structure can move, so there is no single set of member forces. ') +
        `Add ${plural(-det.index, 'member')} or reaction${-det.index === 1 ? '' : 's'}.`,
    };
  }
  if (det.kind === 'indeterminate') {
    return {
      ...base,
      status: 'indeterminate',
      message:
        `Statically indeterminate: m + r = ${m} + ${r} = ${m + r}, which is more than 2j = ${2 * j}. ` +
        `Equilibrium alone can't find the forces. Remove ${plural(det.index, 'member')} or reaction${det.index === 1 ? '' : 's'}.`,
    };
  }

  const n = 2 * j;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  const units = truss.members.map(([p, q]) => {
    const P = truss.joints[p];
    const Q = truss.joints[q];
    const len = Math.hypot(Q.x - P.x, Q.y - P.y);
    return [(Q.x - P.x) / len, (Q.y - P.y) / len];
  });
  truss.members.forEach(([p, q], k) => {
    const [ux, uy] = units[k];
    // Tension pulls each end joint towards the other end.
    A[2 * p][k] += ux;
    A[2 * p + 1][k] += uy;
    A[2 * q][k] -= ux;
    A[2 * q + 1][k] -= uy;
  });
  const reactionCols = [];
  for (const s of truss.supports) for (const dir of SUPPORT_REACTIONS[s.type]) reactionCols.push({ joint: s.joint, dir });
  reactionCols.forEach(({ joint, dir }, c) => {
    A[2 * joint + (dir === 'x' ? 0 : 1)][m + c] += 1;
  });
  let scale = 0;
  for (const l of truss.loads) {
    b[2 * l.joint] -= l.fx;
    b[2 * l.joint + 1] -= l.fy;
    scale += Math.hypot(l.fx, l.fy);
  }

  const sol = solveLinear(A, b);
  const unstable = {
    ...base,
    status: 'unstable',
    message:
      `Unstable: m + r = 2j = ${n}, but the geometry lets the structure move ` +
      '(for example, the support reactions are all parallel or all meet at one point, or a joint has its members in one straight line). There is no single solution.',
  };
  if (!sol.ok) return unstable;
  let residual = 0;
  for (let i = 0; i < n; i++) {
    let s = -b[i];
    for (let c = 0; c < n; c++) s += A[i][c] * sol.x[c];
    residual = Math.max(residual, Math.abs(s));
  }
  if (!(residual <= 1e-9 * Math.max(1, scale))) return unstable;

  const x = sol.x.map((v) => clean(v, scale));
  const forces = x.slice(0, m);
  const reactions = truss.supports.map((s) => ({ joint: s.joint, type: s.type, rx: 0, ry: 0 }));
  reactionCols.forEach(({ joint, dir }, c) => {
    const rec = reactions.find((rr) => rr.joint === joint);
    if (dir === 'x') rec.rx = x[m + c];
    else rec.ry = x[m + c];
  });
  return { ...base, status: 'solved', message: '', forces, reactions, residual };
}

/** 'T', 'C' or '0' for a member force (kN). */
export function forceState(f) {
  return f > 0 ? 'T' : f < 0 ? 'C' : '0';
}

/* Pure editing helpers (each returns a new truss). */

export function snapTo(v, step) {
  return step > 0 ? Math.round(v / step) * step : v;
}

export function moveJoint(truss, i, x, y) {
  const joints = truss.joints.map((p, k) => (k === i ? { x, y } : p));
  return { ...truss, joints };
}

/** Index of a joint within `tol` m of (x, y), or −1. */
export function jointNear(truss, x, y, tol = 1e-6) {
  return truss.joints.findIndex((p) => Math.hypot(p.x - x, p.y - y) <= tol);
}

/** Add a joint, or null if the truss is full or a joint is already there. */
export function addJoint(truss, x, y) {
  if (truss.joints.length >= MAX_JOINTS || jointNear(truss, x, y) >= 0) return null;
  return { ...truss, joints: [...truss.joints, { x, y }] };
}

/** Add the member a–b, or remove it if it exists. Returns null if not allowed. */
export function toggleMember(truss, a, b) {
  if (a === b) return null;
  const k = truss.members.findIndex(([p, q]) => (p === a && q === b) || (p === b && q === a));
  if (k >= 0) return removeMember(truss, k);
  if (truss.members.length >= MAX_MEMBERS) return null;
  return { ...truss, members: [...truss.members, [Math.min(a, b), Math.max(a, b)]] };
}

export function removeMember(truss, k) {
  return { ...truss, members: truss.members.filter((_, i) => i !== k) };
}

/** Cycle the support at joint i: none → pin → roller → side roller → none. */
export function cycleSupport(truss, i) {
  const current = truss.supports.find((s) => s.joint === i)?.type ?? null;
  const next = SUPPORT_CYCLE[(SUPPORT_CYCLE.indexOf(current) + 1) % SUPPORT_CYCLE.length];
  const supports = truss.supports.filter((s) => s.joint !== i);
  if (next) supports.push({ joint: i, type: next });
  supports.sort((s, t) => s.joint - t.joint);
  return { ...truss, supports };
}

/** Remove the extra loads at joint i, or add one (fx, fy in kN) if it has none. Null if full. */
export function toggleLoad(truss, i, fx, fy) {
  if (truss.loads.some((l) => l.joint === i)) return { ...truss, loads: truss.loads.filter((l) => l.joint !== i) };
  if (truss.loads.length >= MAX_LOADS) return null;
  return { ...truss, loads: [...truss.loads, { joint: i, fx, fy }] };
}

/** Remove joint i with its members, support and loads; later joints move up one letter. */
export function removeJoint(truss, i) {
  const shift = (k) => (k > i ? k - 1 : k);
  return {
    joints: truss.joints.filter((_, k) => k !== i),
    members: truss.members.filter(([a, b]) => a !== i && b !== i).map(([a, b]) => [shift(a), shift(b)]),
    supports: truss.supports.filter((s) => s.joint !== i).map((s) => ({ ...s, joint: shift(s.joint) })),
    loads: truss.loads.filter((l) => l.joint !== i).map((l) => ({ ...l, joint: shift(l.joint) })),
  };
}

/* ------------------------------------------------------------------------------------------------
 * Beams: simply supported (pin at x = 0, roller at x = L) or cantilever (fixed at x = 0, free at L).
 * Loads are downward: point loads P (kN) at x, UDLs w (kN/m) over [x1, x2].
 * ---------------------------------------------------------------------------------------------- */

/**
 * Beam description from loads, with positions clamped onto the beam.
 * @param {{ type: 'simple'|'cantilever', L: number, points?: {x:number, P:number, name?:string}[], udls?: {x1:number, x2:number, w:number}[] }} spec
 */
export function makeBeam({ type, L, points = [], udls = [] }) {
  const cx = (x) => Math.min(Math.max(x, 0), L);
  return {
    type,
    L,
    points: points.filter((p) => p.P !== 0).map((p) => ({ ...p, x: cx(p.x), outside: p.x > L || p.x < 0 })),
    udls: udls
      .map((u) => ({ ...u, x1: cx(Math.min(u.x1, u.x2)), x2: cx(Math.max(u.x1, u.x2)) }))
      .filter((u) => u.w !== 0 && u.x2 > u.x1),
  };
}

/** Total downward load (kN) and its moment about x = 0 (kN·m, clockwise). */
function loadTotals(beam) {
  let total = 0;
  let moment = 0;
  for (const p of beam.points) {
    total += p.P;
    moment += p.P * p.x;
  }
  for (const u of beam.udls) {
    const W = u.w * (u.x2 - u.x1);
    total += W;
    moment += (W * (u.x1 + u.x2)) / 2;
  }
  return { total, moment };
}

/**
 * Support reactions (upward +, kN). Cantilever: RA at the wall and MA, the wall's moment on the
 * beam (anticlockwise + for downward loads), kN·m.
 */
export function beamReactions(beam) {
  const { total, moment } = loadTotals(beam);
  if (beam.type === 'cantilever') return { RA: total, RB: 0, MA: moment };
  const RB = moment / beam.L;
  return { RA: total - RB, RB, MA: 0 };
}

/** Length of [a, b] ∩ [c, d]. */
function overlap(a, b, c, d) {
  return Math.max(0, Math.min(b, d) - Math.max(a, c));
}

/**
 * Shear force V(x) (kN): sum of upward forces on the part of the beam left of the section.
 * At a point load or support, side 'left' gives the value just before it and 'right' just after.
 */
export function shearAt(beam, R, x, side = 'right') {
  const left = (s) => s < x || (s === x && side === 'right');
  let V = left(0) ? R.RA : 0;
  if (beam.type === 'simple' && left(beam.L)) V += R.RB;
  for (const p of beam.points) if (left(p.x)) V -= p.P;
  for (const u of beam.udls) V -= u.w * overlap(u.x1, u.x2, 0, x);
  return V;
}

/** Bending moment M(x) (kN·m, sagging +), from the forces left of the section. */
export function momentAt(beam, R, x) {
  let M = R.RA * x;
  if (beam.type === 'cantilever') M -= R.MA;
  for (const p of beam.points) if (p.x < x) M -= p.P * (x - p.x);
  for (const u of beam.udls) {
    const e = Math.min(u.x2, x);
    if (e > u.x1) M -= u.w * (e - u.x1) * (x - (u.x1 + e) / 2);
  }
  return M;
}

/** Sorted, distinct positions where the SFD can jump or change slope. */
export function beamBreakpoints(beam) {
  const xs = [0, beam.L, ...beam.points.map((p) => p.x), ...beam.udls.flatMap((u) => [u.x1, u.x2])];
  return [...new Set(xs.map((x) => Math.min(Math.max(x, 0), beam.L)))].sort((a, b) => a - b);
}

/** UDL intensity acting on the open interval (a, b). */
function udlOn(beam, a, b) {
  const mid = (a + b) / 2;
  return beam.udls.reduce((w, u) => (mid > u.x1 && mid < u.x2 ? w + u.w : w), 0);
}

/**
 * Reactions, extreme values and samples for the SFD and BMD.
 * maxMoment is the moment of largest magnitude (signed); M is extreme where V changes sign.
 */
export function solveBeam(beam, { samplesPerSegment = 40 } = {}) {
  const R = beamReactions(beam);
  const xs = beamBreakpoints(beam);
  const scale = Math.max(1, Math.abs(R.RA) + Math.abs(R.RB) + Math.abs(R.MA));
  const V = (x, side) => clean(shearAt(beam, R, x, side), scale);
  const M = (x) => clean(momentAt(beam, R, x), scale);

  // Candidates for |M| max: every breakpoint and every zero of V inside a segment.
  const candidates = [...xs];
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const w = udlOn(beam, a, b);
    if (w !== 0) {
      const x0 = a + V(a, 'right') / w;
      if (x0 > a && x0 < b) candidates.push(x0);
    }
  }
  let maxMoment = 0;
  let maxMomentAt = 0;
  for (const x of candidates) {
    const m = M(x);
    if (Math.abs(m) > Math.abs(maxMoment) + 1e-12 * scale) {
      maxMoment = m;
      maxMomentAt = x;
    }
  }
  let maxShear = 0;
  for (const x of xs) maxShear = Math.max(maxShear, Math.abs(V(x, 'left')), Math.abs(V(x, 'right')));

  // Samples: each segment's ends (both sides of a jump) and points inside it.
  const samples = [];
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const k = udlOn(beam, a, b) !== 0 ? samplesPerSegment : 1;
    samples.push({ x: a, V: V(a, 'right'), M: M(a) });
    for (let s = 1; s < k; s++) {
      const x = a + ((b - a) * s) / k;
      samples.push({ x, V: V(x, 'right'), M: M(x) });
    }
    samples.push({ x: b, V: V(b, 'left'), M: M(b) });
  }
  return { R, breakpoints: xs, maxMoment, maxMomentAt, maxShear, samples };
}

/** Rectangular section b × d (mm): second moment of area I = bd³/12 (mm⁴), extreme fibre y = d/2 (mm). */
export function rectSection(b, d) {
  const I = (b * d ** 3) / 12;
  return { I, y: d / 2, Z: I / (d / 2), A: b * d };
}

/** Bending stress σ = My/I in MPa, from M in kN·m, y in mm and I in mm⁴. */
export function bendingStress(M, y, I) {
  return (M * 1e6 * y) / I;
}

/* ------------------------------------------------------------------------------------------------
 * Moments: a beam on two supports A and B (anywhere along it) with downward point loads.
 * Reactions from ΣM_A = 0 and ΣFy = 0; each force's moment about a chosen pivot.
 * ---------------------------------------------------------------------------------------------- */

/**
 * @param {{ xA: number, xB: number, loads: {name:string, x:number, P:number}[], pivotX: number, convention: 'cw'|'acw' }} spec
 *   loads are downward (kN); positions in m
 * @returns {{ ok: boolean, message?: string, RA?: number, RB?: number,
 *   terms?: { name: string, x: number, Fy: number, arm: number, cw: number, moment: number, sense: 'cw'|'acw'|'none', reaction: boolean }[],
 *   sumCw?: number, sumAcw?: number, net?: number, loadMoment?: number }}
 */
export function solveMoments({ xA, xB, loads, pivotX, convention = 'cw' }) {
  if (Math.abs(xB - xA) < 1e-9) return { ok: false, message: 'Supports A and B are at the same point, so the reactions cannot be found. Move one of them.' };
  const total = loads.reduce((s, l) => s + l.P, 0);
  const scale = Math.max(1, total);
  // ΣM_A = 0 (clockwise +): Σ P (x − xA) − RB (xB − xA) = 0
  const RB = clean(loads.reduce((s, l) => s + l.P * (l.x - xA), 0) / (xB - xA), scale);
  const RA = clean(total - RB, scale);
  const sign = convention === 'acw' ? -1 : 1;
  const term = (name, x, Fy, reaction) => {
    const arm = x - pivotX; // + to the right of the pivot
    const cw = clean(-Fy * arm, scale); // an upward force to the right turns anticlockwise
    return { name, x, Fy, arm, cw, moment: sign * cw, sense: cw > 0 ? 'cw' : cw < 0 ? 'acw' : 'none', reaction };
  };
  const loadTerms = loads.map((l) => term(l.name, l.x, -l.P, false));
  const terms = [...loadTerms, term('R_A', xA, RA, true), term('R_B', xB, RB, true)];
  const sumCw = terms.reduce((s, t) => s + Math.max(t.cw, 0), 0);
  const sumAcw = terms.reduce((s, t) => s + Math.max(-t.cw, 0), 0);
  const net = clean(terms.reduce((s, t) => s + t.moment, 0), scale);
  const loadMoment = clean(loadTerms.reduce((s, t) => s + t.moment, 0), scale);
  return { ok: true, RA, RB, terms, sumCw, sumAcw, net, loadMoment };
}

/* ------------------------------------------------------------------------------------------------
 * Concurrent forces
 * ---------------------------------------------------------------------------------------------- */

/** Components of a force F at an angle (degrees anticlockwise from +x). */
export function components(F, angleDeg) {
  const t = angleDeg * DEG;
  return { fx: clean(F * Math.cos(t), F), fy: clean(F * Math.sin(t), F) };
}

/** Direction of (fx, fy) in degrees in (−180, 180]; 0 for a zero vector. */
export function directionOf(fx, fy) {
  if (fx === 0 && fy === 0) return 0;
  const a = Math.atan2(fy, fx) / DEG;
  return a === -180 ? 180 : a;
}

/** Resultant of forces [{F, angle}] (angle in degrees): components, magnitude and direction. */
export function resultantOf(forces) {
  let fx = 0;
  let fy = 0;
  let scale = 0;
  for (const f of forces) {
    const c = components(f.F, f.angle);
    fx += c.fx;
    fy += c.fy;
    scale += Math.abs(f.F);
  }
  fx = clean(fx, scale);
  fy = clean(fy, scale);
  return { fx, fy, magnitude: Math.hypot(fx, fy), angle: directionOf(fx, fy) };
}

/** The equilibrant: equal in size and opposite in direction to the resultant. */
export function equilibrantOf(forces) {
  const r = resultantOf(forces);
  const fx = r.fx === 0 ? 0 : -r.fx;
  const fy = r.fy === 0 ? 0 : -r.fy;
  return { fx, fy, magnitude: r.magnitude, angle: directionOf(fx, fy) };
}

/**
 * Three-force body: a horizontal boom AB (length L) pinned to a wall at A = (0, 0), held by a cable
 * from its end B = (L, 0) to the wall at C = (0, h), carrying a load W (kN) at x = a.
 * Moments about A give the cable tension; the pin reaction passes through O, where the lines of
 * action of W and the cable meet (three-force rule).
 */
export function threeForceBoom({ L, h, W, a }) {
  const x = Math.min(Math.max(a, 0), L);
  const len = Math.hypot(L, h);
  // ΣM_A = 0: T × (perpendicular distance from A to BC = L h / len) = W x
  const T = (W * x * len) / (L * h);
  const Tx = clean((-T * L) / len, W); // cable pulls B towards C
  const Ty = clean((T * h) / len, W);
  const Ax = clean(-Tx, W);
  const Ay = clean(W - Ty, W);
  return {
    x,
    T,
    Tx,
    Ty,
    Ax,
    Ay,
    RA: Math.hypot(Ax, Ay),
    RAangle: directionOf(Ax, Ay),
    O: { x, y: h * (1 - x / L) }, // W's line x = a meets the cable line y = h (1 − x/L)
  };
}

/* ------------------------------------------------------------------------------------------------
 * Block on an incline (angle 0 is a horizontal plane)
 * ---------------------------------------------------------------------------------------------- */

/**
 * Forces along the slope are + up the slope; perpendicular forces are + away from the surface.
 * The applied force F acts at `appliedAngle` degrees from the up-slope direction (anticlockwise +).
 * Static friction holds the block if the force it needs is at most μs N; otherwise the block slides
 * and kinetic friction μk N opposes the motion.
 * @param {{ angle: number, mass: number, muS: number, muK: number, applied?: number, appliedAngle?: number, g: number }} p
 */
export function solveIncline({ angle, mass, muS, muK, applied = 0, appliedAngle = 0, g }) {
  const th = angle * DEG;
  const ph = appliedAngle * DEG;
  const W = mass * g;
  const Wpar = clean(W * Math.sin(th), W); // down the slope
  const Wperp = clean(W * Math.cos(th), W); // into the surface
  const Fpar = clean(applied * Math.cos(ph), applied); // up the slope
  const Fperp = clean(applied * Math.sin(ph), applied); // away from the surface
  const scale = Math.max(1, W, applied);
  const N = clean(Wperp - Fperp, scale);
  const reposeAngle = Math.atan(muS) / DEG;
  const drive = clean(Fpar - Wpar, scale); // net force along the slope without friction
  const common = { W, Wpar, Wperp, Fpar, Fperp, reposeAngle, drive, muKUsed: Math.min(muK, muS), muKCapped: muK > muS };
  if (N < 0) {
    return { ...common, N: 0, liftsOff: true, frictionMax: 0, friction: 0, needed: Math.abs(drive), slipping: true, direction: 'off', a: null };
  }
  const frictionMax = muS * N;
  const needed = Math.abs(drive);
  if (needed <= frictionMax * (1 + 1e-12)) {
    return { ...common, N, liftsOff: false, frictionMax, friction: drive === 0 ? 0 : -drive, needed, slipping: false, direction: 'none', a: 0 };
  }
  // Sliding. A kinetic coefficient above the static one isn't physical; use μk = μs and say so.
  const dir = Math.sign(drive);
  const fk = common.muKUsed * N;
  const friction = -dir * fk;
  const a = (drive + friction) / mass;
  return { ...common, N, liftsOff: false, frictionMax, friction, needed, slipping: true, direction: dir > 0 ? 'up' : 'down', a };
}
