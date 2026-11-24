// Engine `statics`: pin-jointed trusses, beams (SFD, BMD, bending stress), moments, concurrent forces
// and the three-force rule, and a block on an incline with friction. Every setup is static: no time
// evolution, so play, pause and step are no-ops and isComplete() is always true (guide §5.1).
//
// Truss structures live in the URL. `structure` picks a preset (built from span, height and panels)
// or 'custom', which reads the `truss` text param. The encoding (also documented in model.js):
//
//   j:x,y x,y …   joints in metres, lettered A, B, C … in order (required, 2 to 26 joints)
//   m:AB BC …     members, each a pair of joint letters
//   s:Ap Er       supports: p pin (x and y), r roller (vertical reaction), h side roller (horizontal)
//   l:C0,-10 …    extra joint loads fx,fy in kN, y up (added to the load P from the controls)
//
//   Sections are separated by ';' and items by spaces, e.g. j:0,0 4,0 2,3;m:AB AC BC;s:Ap Br;l:C0,-10
//
// Editing a preset on the canvas switches `structure` to 'custom' and writes `truss`, so a shared link
// carries the edited structure. The engine reports engine-side param changes with onEvent('params', p).
import * as M from './model.js';
import { createView } from './view.js';
import { createEmitter, pointerDrag } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber, formatPlain } from '../../format.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PRESETS = Object.keys(M.TRUSS_PRESETS);
const SNAP = 0.25; // m, joint positions snap to this grid when placed or dragged on the canvas
const DEFAULT_DIMS = { span: 12, height: 3, panels: 4 };
export const DEFAULT_TRUSS = M.encodeTruss(M.presetTruss('warren', DEFAULT_DIMS));

const T = ['truss'];
const B = ['beam'];
const MO = ['moments'];
const C = ['concurrent'];
const I = ['incline'];
const forcesOnly = { concurrentMode: 'forces' };
const boomOnly = { concurrentMode: 'boom' };

export const meta = {
  name: 'statics',
  version: '1.0.0',
  setups: ['truss', 'beam', 'concurrent', 'moments', 'incline'],
  staticSetups: ['truss', 'beam', 'concurrent', 'moments', 'incline'],
  params: {
    // ---- truss
    structure: {
      type: 'enum',
      label: 'Structure',
      options: [...PRESETS.map((k) => [k, M.TRUSS_PRESETS[k]]), ['custom', 'Custom (edited)']],
      default: 'warren',
      widget: 'select',
      setups: T,
      help: 'Editing a preset on the stage turns it into a custom structure.',
    },
    span: { type: 'number', label: 'Span', unit: 'm', min: 1, max: 40, step: 0.5, default: DEFAULT_DIMS.span, setups: T, visibleWhen: { structure: PRESETS } },
    height: {
      type: 'number',
      label: 'Height',
      unit: 'm',
      min: 0.5,
      max: 15,
      step: 0.25,
      default: DEFAULT_DIMS.height,
      setups: T,
      visibleWhen: { structure: ['warren', 'pratt', 'howe', 'bracket', 'mechanism', 'braced'] },
    },
    panels: { type: 'number', label: 'Panels', unit: '', min: 2, max: 10, step: 1, integer: true, default: DEFAULT_DIMS.panels, setups: T, visibleWhen: { structure: ['warren', 'pratt', 'howe'] } },
    truss: {
      type: 'string',
      label: 'Structure text',
      default: DEFAULT_TRUSS,
      maxLength: M.TRUSS_MAX_LENGTH,
      pattern: '^[ -~]*$',
      setups: T,
      visibleWhen: { structure: 'custom' },
      help: 'j: joints x,y (m) · m: members AB · s: supports Ap (pin), Br (roller), Ch (side roller) · l: extra loads Cfx,fy (kN)',
    },
    load: { type: 'number', label: 'Load P', unit: 'kN', min: 0, max: 200, step: 1, default: 20, setups: T },
    loadAt: { type: 'enum', label: 'Load P at joint', options: LETTERS.map((c) => [c, c]), default: 'C', widget: 'select', setups: T },
    loadAngle: { type: 'number', label: 'Load angle from vertical', unit: '°', min: -90, max: 90, step: 5, default: 0, setups: T, help: '0° is straight down; positive leans the load to the right.' },
    editTool: {
      type: 'enum',
      label: 'Stage tool',
      options: [
        ['move', 'Move joints'],
        ['joint', 'Add joints'],
        ['member', 'Add or remove members'],
        ['support', 'Change supports'],
        ['load', 'Move load P'],
        ['extraLoad', 'Add or remove extra loads'],
        ['delete', 'Delete'],
      ],
      default: 'move',
      widget: 'select',
      setups: T,
    },
    probeMember: { type: 'string', label: 'Member to read', default: 'AB', maxLength: 2, pattern: '^[A-Za-z]{2}$', setups: T },
    probeJoint: { type: 'string', label: 'Support to read', default: 'A', maxLength: 1, pattern: '^[A-Za-z]$', setups: T },
    showForces: { type: 'boolean', label: 'Show forces', default: true, setups: T },

    // ---- beam
    beamType: { type: 'enum', label: 'Beam', options: [['simple', 'Simply supported'], ['cantilever', 'Cantilever']], default: 'simple', setups: B },
    length: { type: 'number', label: 'Span L', unit: 'm', min: 1, max: 20, step: 0.5, default: 6, setups: ['beam', 'moments'] },
    p1: { type: 'number', label: 'Point load P₁', unit: 'kN', min: 0, max: 100, step: 0.5, default: 10, setups: B },
    p1At: { type: 'number', label: 'P₁ distance from A', unit: 'm', min: 0, max: 20, step: 0.1, default: 3, setups: B },
    p2: { type: 'number', label: 'Point load P₂', unit: 'kN', min: 0, max: 100, step: 0.5, default: 0, setups: B },
    p2At: { type: 'number', label: 'P₂ distance from A', unit: 'm', min: 0, max: 20, step: 0.1, default: 4.5, setups: B },
    udl: { type: 'number', label: 'UDL w', unit: 'kN/m', min: 0, max: 50, step: 0.5, default: 0, setups: B },
    udlExtent: { type: 'enum', label: 'UDL covers', options: [['full', 'Whole span'], ['part', 'Part of the span']], default: 'full', setups: B },
    udlFrom: { type: 'number', label: 'UDL starts at', unit: 'm', min: 0, max: 20, step: 0.1, default: 0, setups: B, visibleWhen: { udlExtent: 'part' } },
    udlTo: { type: 'number', label: 'UDL ends at', unit: 'm', min: 0, max: 20, step: 0.1, default: 3, setups: B, visibleWhen: { udlExtent: 'part' } },
    sectionB: { type: 'number', label: 'Section width b', unit: 'mm', min: 10, max: 1000, step: 5, default: 100, setups: B },
    sectionD: { type: 'number', label: 'Section depth d', unit: 'mm', min: 10, max: 1500, step: 5, default: 200, setups: B },
    probeX: { type: 'number', label: 'Section at x', unit: 'm', min: 0, max: 20, step: 0.1, default: 1.5, setups: B },

    // ---- moments
    supportA: { type: 'number', label: 'Support A at', unit: 'm', min: 0, max: 20, step: 0.1, default: 0, setups: MO },
    supportB: { type: 'number', label: 'Support B at', unit: 'm', min: 0, max: 20, step: 0.1, default: 6, setups: MO },
    load1: { type: 'number', label: 'Load F₁', unit: 'kN', min: 0, max: 100, step: 0.5, default: 10, setups: MO },
    load1At: { type: 'number', label: 'F₁ at', unit: 'm', min: 0, max: 20, step: 0.1, default: 1.5, setups: MO },
    load2: { type: 'number', label: 'Load F₂', unit: 'kN', min: 0, max: 100, step: 0.5, default: 6, setups: MO },
    load2At: { type: 'number', label: 'F₂ at', unit: 'm', min: 0, max: 20, step: 0.1, default: 4, setups: MO },
    load3: { type: 'number', label: 'Load F₃', unit: 'kN', min: 0, max: 100, step: 0.5, default: 0, setups: MO },
    load3At: { type: 'number', label: 'F₃ at', unit: 'm', min: 0, max: 20, step: 0.1, default: 5, setups: MO },
    momentSign: { type: 'enum', label: 'Sign convention', options: [['cw', 'Clockwise +'], ['acw', 'Anticlockwise +']], default: 'cw', setups: MO },
    momentsAbout: { type: 'enum', label: 'Take moments about', options: [['A', 'Support A'], ['B', 'Support B'], ['point', 'Another point']], default: 'A', setups: MO },
    pivotX: { type: 'number', label: 'Point at x', unit: 'm', min: 0, max: 20, step: 0.1, default: 3, setups: MO, visibleWhen: { momentsAbout: 'point' } },
    showReactions: { type: 'boolean', label: 'Show the reactions', default: true, setups: MO },

    // ---- concurrent forces
    concurrentMode: { type: 'enum', label: 'Scene', options: [['forces', 'Concurrent forces'], ['boom', 'Three-force body']], default: 'forces', setups: C },
    forceCount: { type: 'number', label: 'Number of forces', unit: '', min: 2, max: 4, step: 1, integer: true, default: 3, setups: C, visibleWhen: forcesOnly },
    force1: { type: 'number', label: 'Force F₁', unit: 'N', min: 0, max: 200, step: 1, default: 100, setups: C, visibleWhen: forcesOnly },
    angle1: { type: 'number', label: 'F₁ direction', unit: '°', min: -180, max: 180, step: 1, default: 0, setups: C, visibleWhen: forcesOnly },
    force2: { type: 'number', label: 'Force F₂', unit: 'N', min: 0, max: 200, step: 1, default: 80, setups: C, visibleWhen: forcesOnly },
    angle2: { type: 'number', label: 'F₂ direction', unit: '°', min: -180, max: 180, step: 1, default: 90, setups: C, visibleWhen: forcesOnly },
    force3: { type: 'number', label: 'Force F₃', unit: 'N', min: 0, max: 200, step: 1, default: 60, setups: C, visibleWhen: { ...forcesOnly, forceCount: [3, 4] } },
    angle3: { type: 'number', label: 'F₃ direction', unit: '°', min: -180, max: 180, step: 1, default: -150, setups: C, visibleWhen: { ...forcesOnly, forceCount: [3, 4] } },
    force4: { type: 'number', label: 'Force F₄', unit: 'N', min: 0, max: 200, step: 1, default: 50, setups: C, visibleWhen: { ...forcesOnly, forceCount: 4 } },
    angle4: { type: 'number', label: 'F₄ direction', unit: '°', min: -180, max: 180, step: 1, default: -60, setups: C, visibleWhen: { ...forcesOnly, forceCount: 4 } },
    boomLength: { type: 'number', label: 'Boom length L', unit: 'm', min: 1, max: 10, step: 0.1, default: 4, setups: C, visibleWhen: boomOnly },
    cableHeight: { type: 'number', label: 'Cable anchor height h', unit: 'm', min: 0.5, max: 10, step: 0.1, default: 3, setups: C, visibleWhen: boomOnly },
    boomLoad: { type: 'number', label: 'Load W', unit: 'kN', min: 0, max: 100, step: 0.5, default: 10, setups: C, visibleWhen: boomOnly },
    boomLoadAt: { type: 'number', label: 'Load distance from the wall a', unit: 'm', min: 0, max: 10, step: 0.1, default: 3, setups: C, visibleWhen: boomOnly },
    showComponents: { type: 'boolean', label: 'Show components', default: true, setups: ['concurrent', 'incline'] },

    // ---- incline
    angle: { type: 'number', label: 'Slope angle θ', unit: '°', min: 0, max: 80, step: 0.5, default: 25, setups: I },
    mass: { type: 'number', label: 'Mass m', unit: 'kg', min: 0.1, max: 100, step: 0.1, default: 5, setups: I },
    muS: { type: 'number', label: 'Static friction μs', unit: '', min: 0, max: 1.5, step: 0.01, default: 0.5, setups: I },
    muK: { type: 'number', label: 'Kinetic friction μk', unit: '', min: 0, max: 1.5, step: 0.01, default: 0.4, setups: I },
    applied: { type: 'number', label: 'Applied force F', unit: 'N', min: 0, max: 1000, step: 1, default: 0, setups: I },
    appliedAngle: {
      type: 'number',
      label: 'Direction of F',
      unit: '°',
      min: -180,
      max: 180,
      step: 5,
      default: 0,
      setups: I,
      help: 'Measured from up the slope, anticlockwise positive: 0° pushes up the slope, 90° pulls straight off the surface, 180° pushes down the slope.',
    },
    g: { type: 'number', label: 'Gravitational field g', unit: 'm/s²', min: 1, max: 25, step: 0.01, default: 10, setups: I },
  },
  outputs: {
    // truss
    memberForce: { label: 'Member force (+T, −C)', unit: 'kN', sigfigs: 3, setups: T },
    reactionX: { label: 'Support reaction, horizontal', unit: 'kN', sigfigs: 3, setups: T },
    reactionY: { label: 'Support reaction, vertical', unit: 'kN', sigfigs: 3, setups: T },
    maxTension: { label: 'Largest tension', unit: 'kN', sigfigs: 3, setups: T },
    maxCompression: { label: 'Largest compression', unit: 'kN', sigfigs: 3, setups: T },
    determinacy: { label: 'm + r − 2j', unit: '', sigfigs: 2, setups: T },
    // beam and moments
    reactionA: { label: 'Reaction R_A', unit: 'kN', sigfigs: 3, setups: ['beam', 'moments'] },
    reactionB: { label: 'Reaction R_B', unit: 'kN', sigfigs: 3, setups: ['beam', 'moments'] },
    fixingMoment: { label: 'Wall moment M_A', unit: 'kN·m', sigfigs: 3, setups: B },
    maxShear: { label: 'Largest shear |V|', unit: 'kN', sigfigs: 3, setups: B },
    maxMoment: { label: 'Largest moment M (sagging +)', unit: 'kN·m', sigfigs: 3, setups: B },
    maxMomentAt: { label: 'Largest moment at x', unit: 'm', sigfigs: 3, setups: B },
    secondMoment: { label: 'Second moment of area I', unit: 'mm⁴', sigfigs: 3, setups: B },
    maxStress: { label: 'Largest bending stress', unit: 'MPa', sigfigs: 3, setups: B },
    shearAtX: { label: 'Shear V at x', unit: 'kN', sigfigs: 3, setups: B },
    momentAtX: { label: 'Moment M at x', unit: 'kN·m', sigfigs: 3, setups: B },
    stressAtX: { label: 'Bending stress at x', unit: 'MPa', sigfigs: 3, setups: B },
    loadMoment: { label: 'Moment of the loads', unit: 'kN·m', sigfigs: 3, setups: MO },
    sumCw: { label: 'Σ clockwise moments', unit: 'kN·m', sigfigs: 3, setups: MO },
    sumAcw: { label: 'Σ anticlockwise moments', unit: 'kN·m', sigfigs: 3, setups: MO },
    netMoment: { label: 'Net moment', unit: 'kN·m', sigfigs: 3, setups: MO },
    // concurrent
    resultant: { label: 'Resultant R', unit: 'N', sigfigs: 3, setups: C },
    resultantAngle: { label: 'Direction of R', unit: '°', sigfigs: 3, setups: C },
    sumFx: { label: 'ΣFx', unit: 'N', sigfigs: 3, setups: C },
    sumFy: { label: 'ΣFy', unit: 'N', sigfigs: 3, setups: C },
    equilibrant: { label: 'Equilibrant E', unit: 'N', sigfigs: 3, setups: C },
    equilibrantAngle: { label: 'Direction of E', unit: '°', sigfigs: 3, setups: C },
    cableTension: { label: 'Cable tension T', unit: 'kN', sigfigs: 3, setups: C },
    pinReaction: { label: 'Pin reaction R_A', unit: 'kN', sigfigs: 3, setups: C },
    pinAngle: { label: 'Direction of R_A', unit: '°', sigfigs: 3, setups: C },
    // incline
    weight: { label: 'Weight W', unit: 'N', sigfigs: 3, setups: I },
    weightParallel: { label: 'W along the slope', unit: 'N', sigfigs: 3, setups: I },
    weightPerp: { label: 'W into the slope', unit: 'N', sigfigs: 3, setups: I },
    normalForce: { label: 'Normal force N', unit: 'N', sigfigs: 3, setups: I },
    friction: { label: 'Friction f', unit: 'N', sigfigs: 3, setups: I },
    frictionMax: { label: 'Maximum static friction μsN', unit: 'N', sigfigs: 3, setups: I },
    acceleration: { label: 'Acceleration a', unit: 'm/s²', sigfigs: 3, setups: I },
    slipping: { label: 'Slipping (1 yes, 0 no)', unit: '', sigfigs: 1, setups: I },
    reposeAngle: { label: 'Angle of repose tan⁻¹ μs', unit: '°', sigfigs: 3, setups: I },
  },
};

const clampTo = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const fmt = (v, s = 3) => formatNumber(v, { sigfigs: s });

/* ------------------------------------------------------------------------------------------ compute */

/** The structure before the page's load P: from a preset or the custom text. */
function trussBase(params) {
  if (params.structure === 'custom') {
    const p = M.parseTruss(params.truss);
    return p.ok ? { truss: p.truss } : { error: p.error };
  }
  return { truss: M.presetTruss(params.structure, { span: params.span, height: params.height, panels: params.panels }) };
}

function trussTitle(params) {
  const s = params.structure;
  if (s === 'custom') return 'Custom truss';
  const L = `span ${formatPlain(params.span)} m`;
  const h = `height ${formatPlain(params.height)} m`;
  if (s === 'equilateral') return `${M.TRUSS_PRESETS[s]} · side ${formatPlain(params.span)} m`;
  if (s === 'bracket') return `${M.TRUSS_PRESETS[s]} · reach ${formatPlain(params.span)} m · ${h}`;
  if (s === 'mechanism' || s === 'braced') return `${M.TRUSS_PRESETS[s]} · ${formatPlain(params.span)} m × ${formatPlain(params.height)} m`;
  return `${M.TRUSS_PRESETS[s]} · ${Math.round(params.panels)} panels · ${L} · ${h}`;
}

function computeTruss(params) {
  const title = trussTitle(params);
  const base = trussBase(params);
  if (base.error) return { setup: 'truss', title, error: base.error };
  const { truss, added, missingJoint } = M.withPointLoad(base.truss, params);
  return { setup: 'truss', title, base: base.truss, truss, added, missingJoint, result: M.solveTruss(truss) };
}

function computeBeam(params) {
  const L = params.length;
  const points = [
    { name: 'P₁', x: params.p1At, P: params.p1 },
    { name: 'P₂', x: params.p2At, P: params.p2 },
  ];
  const full = params.udlExtent === 'full';
  const udls = params.udl > 0 ? [{ name: 'w', x1: full ? 0 : params.udlFrom, x2: full ? L : params.udlTo, w: params.udl }] : [];
  const beam = M.makeBeam({ type: params.beamType, L, points, udls });
  const res = M.solveBeam(beam);
  const section = M.rectSection(params.sectionB, params.sectionD);
  const x = clampTo(params.probeX, 0, L);
  const side = x >= L ? 'left' : 'right';
  const scale = Math.max(1, Math.abs(res.R.RA) + Math.abs(res.R.RB) + Math.abs(res.R.MA));
  const V = M.clean(M.shearAt(beam, res.R, x, side), scale);
  const Mx = M.clean(M.momentAt(beam, res.R, x), scale);
  return {
    setup: 'beam',
    beam,
    res,
    section,
    probe: { x, V, M: Mx, sigma: M.bendingStress(Math.abs(Mx), section.y, section.I), outside: params.probeX > L },
    maxStress: M.bendingStress(Math.abs(res.maxMoment), section.y, section.I),
    udlEmpty: params.udl > 0 && udls.length && !beam.udls.length,
  };
}

function computeMoments(params) {
  const L = params.length;
  const cx = (x) => clampTo(x, 0, L);
  const loads = [1, 2, 3]
    .map((i) => ({ name: `F${i}`, label: `F${'₁₂₃'[i - 1]}`, x: cx(params[`load${i}At`]), P: params[`load${i}`], outside: params[`load${i}At`] > L }))
    .filter((l) => l.P > 0);
  const xA = cx(params.supportA);
  const xB = cx(params.supportB);
  const pivotX = params.momentsAbout === 'A' ? xA : params.momentsAbout === 'B' ? xB : cx(params.pivotX);
  const res = M.solveMoments({ xA, xB, loads, pivotX, convention: params.momentSign });
  return { setup: 'moments', L, loads, xA, xB, pivotX, res, outside: loads.some((l) => l.outside) || params.supportA > L || params.supportB > L || (params.momentsAbout === 'point' && params.pivotX > L) };
}

function computeConcurrent(params) {
  if (params.concurrentMode === 'boom') {
    const boom = M.threeForceBoom({ L: params.boomLength, h: params.cableHeight, W: params.boomLoad, a: params.boomLoadAt });
    return { setup: 'concurrent', mode: 'boom', boom, outside: params.boomLoadAt > params.boomLength };
  }
  const n = Math.round(params.forceCount);
  const forces = [];
  for (let i = 1; i <= n; i++) forces.push({ name: `F${'₁₂₃₄'[i - 1]}`, F: params[`force${i}`], angle: params[`angle${i}`], ...M.components(params[`force${i}`], params[`angle${i}`]) });
  return { setup: 'concurrent', mode: 'forces', forces, R: M.resultantOf(forces), E: M.equilibrantOf(forces) };
}

function computeIncline(params) {
  return { setup: 'incline', r: M.solveIncline(params) };
}

const COMPUTE = { truss: computeTruss, beam: computeBeam, moments: computeMoments, concurrent: computeConcurrent, incline: computeIncline };

/* ------------------------------------------------------------------------------------------ outputs */

function findMember(truss, name) {
  if (!name || name.length !== 2) return -1;
  const a = M.jointIndex(name[0]);
  const b = M.jointIndex(name[1]);
  return truss.members.findIndex(([p, q]) => (p === a && q === b) || (p === b && q === a));
}

function outputsFor(model, params) {
  switch (model.setup) {
    case 'truss': {
      const r = model.result;
      const det = r ? r.determinacy.index : null;
      const solved = r?.status === 'solved' && params.showForces;
      if (!solved) return { memberForce: null, reactionX: null, reactionY: null, maxTension: null, maxCompression: null, determinacy: det };
      const k = findMember(model.truss, params.probeMember);
      const j = M.jointIndex(params.probeJoint);
      const rec = r.reactions.find((x) => x.joint === j);
      return {
        memberForce: k >= 0 ? r.forces[k] : null,
        reactionX: rec ? rec.rx : null,
        reactionY: rec ? rec.ry : null,
        maxTension: Math.max(0, ...r.forces),
        maxCompression: Math.max(0, ...r.forces.map((f) => -f)),
        determinacy: det,
      };
    }
    case 'beam': {
      const { res, beam, probe, section } = model;
      const cant = beam.type === 'cantilever';
      return {
        reactionA: res.R.RA,
        reactionB: cant ? null : res.R.RB,
        fixingMoment: cant ? res.R.MA : null,
        maxShear: res.maxShear,
        maxMoment: res.maxMoment,
        maxMomentAt: res.maxMomentAt,
        secondMoment: section.I,
        maxStress: model.maxStress,
        shearAtX: probe.V,
        momentAtX: probe.M,
        stressAtX: probe.sigma,
      };
    }
    case 'moments': {
      const { res } = model;
      if (!res.ok) return { reactionA: null, reactionB: null, loadMoment: null, sumCw: null, sumAcw: null, netMoment: null };
      const show = params.showReactions;
      return {
        reactionA: show ? res.RA : null,
        reactionB: show ? res.RB : null,
        loadMoment: res.loadMoment,
        sumCw: show ? res.sumCw : null,
        sumAcw: show ? res.sumAcw : null,
        netMoment: show ? res.net : null,
      };
    }
    case 'concurrent': {
      const none = { resultant: null, resultantAngle: null, sumFx: null, sumFy: null, equilibrant: null, equilibrantAngle: null, cableTension: null, pinReaction: null, pinAngle: null };
      if (model.mode === 'boom') {
        const b = model.boom;
        return { ...none, cableTension: b.T, pinReaction: b.RA, pinAngle: b.RAangle };
      }
      const { R, E } = model;
      const zero = R.magnitude === 0;
      return { ...none, resultant: R.magnitude, resultantAngle: zero ? null : R.angle, sumFx: R.fx, sumFy: R.fy, equilibrant: E.magnitude, equilibrantAngle: zero ? null : E.angle };
    }
    case 'incline': {
      const { r } = model;
      return {
        weight: r.W,
        weightParallel: r.Wpar,
        weightPerp: r.Wperp,
        normalForce: r.N,
        friction: r.liftsOff ? 0 : Math.abs(r.friction),
        frictionMax: r.frictionMax,
        acceleration: r.a === null ? null : Math.abs(r.a),
        slipping: r.liftsOff ? null : r.slipping ? 1 : 0,
        reposeAngle: r.reposeAngle,
      };
    }
    default:
      return {};
  }
}

/* ------------------------------------------------------------------------------------------ data (CSV) */

function dataFor(model, params) {
  switch (model.setup) {
    case 'truss': {
      const columns = ['Item', 'Type', 'Length (m)', 'Fx (kN)', 'Fy (kN)', 'Force (kN, +T −C)', 'State'];
      if (model.error) return { columns, rows: [] };
      const { truss, result: r } = model;
      const show = r.status === 'solved' && params.showForces;
      const rows = truss.members.map((m, k) => [M.memberName(m), 'member', M.memberLength(truss, k), '', '', show ? r.forces[k] : '', show ? M.forceState(r.forces[k]) : r.status]);
      if (show) {
        for (const rec of r.reactions) rows.push([M.jointName(rec.joint), `${rec.type === 'side' ? 'side roller' : rec.type} reaction`, '', rec.rx, rec.ry, Math.hypot(rec.rx, rec.ry), '']);
      }
      for (const l of truss.loads) rows.push([M.jointName(l.joint), l.main ? 'load P' : 'load', '', l.fx, l.fy, Math.hypot(l.fx, l.fy), '']);
      return { columns, rows };
    }
    case 'beam': {
      const { res, section } = model;
      const rows = res.samples.map((s) => [s.x, s.V, s.M, M.bendingStress(-s.M, section.y, section.I), M.bendingStress(s.M, section.y, section.I)]);
      return { columns: ['x (m)', 'V (kN)', 'M (kN·m, sagging +)', 'σ top fibre (MPa, tension +)', 'σ bottom fibre (MPa, tension +)'], rows };
    }
    case 'moments': {
      const { res } = model;
      const columns = ['Force', 'x (m)', 'Force, up + (kN)', 'Distance from pivot (m)', `Moment (kN·m, ${params.momentSign === 'acw' ? 'anticlockwise' : 'clockwise'} +)`, 'Sense'];
      if (!res.ok) return { columns, rows: [] };
      const rows = res.terms.filter((t) => !t.reaction || params.showReactions).map((t) => [t.name, t.x, t.Fy, t.arm, t.moment, t.sense === 'cw' ? 'clockwise' : t.sense === 'acw' ? 'anticlockwise' : 'none']);
      return { columns, rows };
    }
    case 'concurrent': {
      if (model.mode === 'boom') {
        const b = model.boom;
        return {
          columns: ['Force', 'Magnitude (kN)', 'Direction (°)', 'Fx (kN)', 'Fy (kN)'],
          rows: [
            ['W (load)', params.boomLoad, -90, 0, -params.boomLoad],
            ['T (cable)', b.T, M.directionOf(b.Tx, b.Ty), b.Tx, b.Ty],
            ['R_A (pin)', b.RA, b.RAangle, b.Ax, b.Ay],
          ],
        };
      }
      const rows = model.forces.map((f, i) => [`F${i + 1}`, f.F, f.angle, f.fx, f.fy]);
      rows.push(['R (resultant)', model.R.magnitude, model.R.angle, model.R.fx, model.R.fy]);
      rows.push(['E (equilibrant)', model.E.magnitude, model.E.angle, model.E.fx, model.E.fy]);
      return { columns: ['Force', 'Magnitude (N)', 'Direction (°)', 'Fx (N)', 'Fy (N)'], rows };
    }
    case 'incline': {
      const { r } = model;
      const rows = [
        ['Weight W', r.W, -r.Wpar, -r.Wperp],
        ['Normal force N', r.N, 0, r.N],
        ['Friction f', Math.abs(r.friction), r.friction, 0],
      ];
      if (params.applied > 0) rows.push(['Applied force F', params.applied, r.Fpar, r.Fperp]);
      return { columns: ['Force', 'Magnitude (N)', 'Along the slope (N, up +)', 'Perpendicular (N, away from surface +)'], rows };
    }
    default:
      return { columns: [], rows: [] };
  }
}

/* ------------------------------------------------------------------------------------------ describe */

function describeFor(model, params) {
  switch (model.setup) {
    case 'truss': {
      if (model.error) return `Truss solver. The structure text has a problem: ${model.error}`;
      const r = model.result;
      const d = r.determinacy;
      const head = `${model.title}. ${d.j} joints, ${d.m} members, ${d.r} reactions.`;
      if (r.status !== 'solved') return `${head} ${r.message}`;
      const out = outputsFor(model, params);
      return `${head} Load ${formatPlain(params.load)} kilonewtons at joint ${params.loadAt}. Largest tension ${fmt(out.maxTension ?? 0)} kN, largest compression ${fmt(out.maxCompression ?? 0)} kN.`;
    }
    case 'beam': {
      const { res, beam } = model;
      return `${beam.type === 'cantilever' ? 'Cantilever' : 'Simply supported'} beam, span ${formatPlain(beam.L)} metres, with shear force and bending moment diagrams. Largest bending moment ${fmt(res.maxMoment)} kilonewton metres at x = ${fmt(res.maxMomentAt)} metres.`;
    }
    case 'moments': {
      const { res } = model;
      if (!res.ok) return `Moments on a beam. ${res.message}`;
      return `Beam on supports A and B with ${model.loads.length} loads; moments taken about x = ${fmt(model.pivotX)} metres, ${params.momentSign === 'acw' ? 'anticlockwise' : 'clockwise'} positive.`;
    }
    case 'concurrent':
      if (model.mode === 'boom') return `Three-force body: a boom pinned to a wall and held by a cable, carrying ${formatPlain(params.boomLoad)} kilonewtons. Cable tension ${fmt(model.boom.T)} kN.`;
      return `${model.forces.length} concurrent forces with their resultant ${fmt(model.R.magnitude)} newtons and the force polygon.`;
    case 'incline': {
      const { r } = model;
      const state = r.liftsOff ? 'lifts off the surface' : r.slipping ? `slides ${r.direction} the slope` : 'stays at rest';
      return `Block of ${formatPlain(params.mass)} kilograms on a ${formatPlain(params.angle)} degree slope with μs ${formatPlain(params.muS)}: it ${state}. Free body diagram with weight, normal force and friction.`;
    }
    default:
      return 'Statics simulation.';
  }
}

/* ------------------------------------------------------------------------------------------ create */

const TOOL_HINTS = {
  move: 'Move: drag a joint (snaps to 0.25 m). Click a member or a support to read its force.',
  joint: 'Add joints: click an empty spot. Drag a joint to move it.',
  member: 'Members: drag from one joint to another, or click two joints. Click a member to remove it.',
  support: 'Supports: click a joint to cycle none → pin → roller → side roller.',
  load: 'Load P: click a joint to move the load there.',
  extraLoad: 'Extra loads: click a joint to add a load the size and angle of P; click again to remove it.',
  delete: 'Delete: click a joint (with its members) or a member.',
};

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`statics: unknown setup "${setup}"`);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  let model = COMPUTE[setup](params);
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage, setup);
  // Truss editing state shown on the stage (not physics, not params).
  const ui = { pending: null, rubber: null, note: '', hint: TOOL_HINTS[params.editTool] ?? '' };

  const render = () => view.draw(model, params, ui);
  const recompute = () => {
    model = COMPUTE[setup](params);
  };
  const publish = () => emit.outputsNow(outputsFor(model, params));
  const notifyParams = () => opts.onEvent?.('params', { ...params });

  view.resize();
  render();
  publish();

  /* ---- truss editing on the stage (pointer); every edit is written back to the params */
  let detach = null;
  if (setup === 'truss') {
    const toCustom = (truss, extra = {}) => {
      params = { ...params, ...extra, structure: 'custom', truss: M.encodeTruss(truss) };
      recompute();
    };
    const finishEdit = () => {
      render();
      publish();
      notifyParams();
    };
    let drag = null;
    detach = pointerDrag(view.canvas, {
      hit(x, y) {
        if (!model.base) return null;
        const t = view.pick(x, y);
        if (!t) return null;
        const tool = params.editTool;
        if (tool === 'joint' || tool === 'member') return t;
        if (tool === 'move') return t.kind === 'empty' ? null : t;
        if (tool === 'support' || tool === 'load' || tool === 'extraLoad') return t.kind === 'joint' ? t : null;
        if (tool === 'delete') return t.kind === 'empty' ? null : t;
        return null;
      },
      start(t) {
        drag = { target: t, moved: false, last: null };
        view.hold();
      },
      move(t, x, y) {
        if (!drag) return;
        drag.last = [x, y];
        const tool = params.editTool;
        if (t.kind === 'joint' && (tool === 'move' || tool === 'joint')) {
          if (!drag.moved) {
            const [x0, y0] = view.jointPx(t.index);
            if (Math.hypot(x - x0, y - y0) < 4) return;
            drag.moved = true;
          }
          const [wx, wy] = view.toWorld(x, y).map((v) => M.snapTo(v, SNAP));
          const clash = M.jointNear(model.base, wx, wy);
          if (clash >= 0 && clash !== t.index) return;
          const cur = model.base.joints[t.index];
          if (cur.x === wx && cur.y === wy) return;
          toCustom(M.moveJoint(model.base, t.index, wx, wy));
          ui.note = '';
          render();
          publish();
        } else if (t.kind === 'joint' && tool === 'member') {
          drag.moved = true;
          ui.rubber = { from: t.index, x, y };
          render();
        }
      },
      end(t) {
        const d = drag;
        drag = null;
        view.endDrag();
        const tool = params.editTool;
        ui.rubber = null;
        if (tool === 'move' || tool === 'joint') {
          if (d?.moved) return finishEdit();
          if (tool === 'joint' && t.kind === 'empty') {
            const [wx, wy] = [t.wx, t.wy].map((v) => M.snapTo(v, SNAP));
            const next = M.addJoint(model.base, wx, wy);
            if (!next) {
              ui.note = model.base.joints.length >= M.MAX_JOINTS ? `The limit is ${M.MAX_JOINTS} joints (A to Z).` : 'There is already a joint there.';
              return render();
            }
            ui.note = `Added joint ${M.jointName(next.joints.length - 1)}. Connect it with the members tool.`;
            toCustom(next);
            return finishEdit();
          }
          if (t.kind === 'member') {
            params = { ...params, probeMember: M.memberName(model.base.members[t.index]) };
            render();
            publish();
            return notifyParams();
          }
          if (t.kind === 'joint' && model.base.supports.some((s) => s.joint === t.index)) {
            params = { ...params, probeJoint: M.jointName(t.index) };
            render();
            publish();
            return notifyParams();
          }
          return render();
        }
        if (tool === 'member') {
          if (t.kind === 'member') {
            toCustom(M.removeMember(model.base, t.index));
            ui.pending = null;
            ui.note = '';
            return finishEdit();
          }
          if (t.kind !== 'joint') {
            ui.pending = null;
            return render();
          }
          const over = d?.last ? view.pick(d.last[0], d.last[1]) : t;
          if (d?.moved && over?.kind === 'joint' && over.index !== t.index) {
            ui.pending = null;
            return connect(t.index, over.index);
          }
          if (d?.moved && over?.kind !== 'joint') return render();
          if (ui.pending === null || ui.pending === t.index) {
            ui.pending = ui.pending === t.index ? null : t.index;
            return render();
          }
          const from = ui.pending;
          ui.pending = null;
          return connect(from, t.index);
        }
        if (tool === 'support' && t.kind === 'joint') {
          toCustom(M.cycleSupport(model.base, t.index));
          ui.note = '';
          return finishEdit();
        }
        if (tool === 'load' && t.kind === 'joint') {
          params = { ...params, loadAt: M.jointName(t.index) };
          recompute();
          ui.note = '';
          return finishEdit();
        }
        if (tool === 'extraLoad' && t.kind === 'joint') {
          const has = model.base.loads.some((l) => l.joint === t.index);
          if (!has && !(params.load > 0)) {
            ui.note = 'Set the load P above 0 kN first: extra loads copy its size and angle.';
            return render();
          }
          // Same convention as P: the angle is measured from straight down, positive to the right.
          const a = (params.loadAngle * Math.PI) / 180;
          const next = M.toggleLoad(model.base, t.index, M.clean(params.load * Math.sin(a), params.load), M.clean(-params.load * Math.cos(a), params.load));
          if (!next) {
            ui.note = `The limit is ${M.MAX_LOADS} extra loads.`;
            return render();
          }
          ui.note = `${has ? 'Removed the extra load at' : `Added ${formatPlain(params.load)} kN at`} joint ${M.jointName(t.index)}.`;
          toCustom(next);
          return finishEdit();
        }
        if (tool === 'delete') {
          if (t.kind === 'member') {
            toCustom(M.removeMember(model.base, t.index));
            ui.note = '';
            return finishEdit();
          }
          if (t.kind === 'joint') {
            const loadJoint = M.jointIndex(params.loadAt);
            if (t.index === loadJoint && params.load > 0) {
              ui.note = `Load P is at joint ${params.loadAt}. Move it first (Move load P tool), then delete the joint.`;
              return render();
            }
            if (model.base.joints.length <= 2) {
              ui.note = 'A truss needs at least two joints.';
              return render();
            }
            const shift = (letter) => {
              const k = M.jointIndex(letter);
              return k > t.index ? M.jointName(k - 1) : letter;
            };
            toCustom(M.removeJoint(model.base, t.index), { loadAt: shift(params.loadAt) });
            ui.note = `Deleted joint ${M.jointName(t.index)}; later joints moved up one letter.`;
            return finishEdit();
          }
        }
        return render();
      },
    });
    const connect = (a, b) => {
      const next = M.toggleMember(model.base, a, b);
      if (!next) {
        ui.note = `The limit is ${M.MAX_MEMBERS} members.`;
        return render();
      }
      const added = next.members.length > model.base.members.length;
      ui.note = `${added ? 'Added' : 'Removed'} member ${M.jointName(Math.min(a, b))}${M.jointName(Math.max(a, b))}.`;
      toCustom(next);
      return finishEdit();
    };
  }

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      // Choosing "Custom" starts from the structure on screen.
      if (setup === 'truss' && next.structure === 'custom' && params.structure !== 'custom' && !('truss' in next)) {
        const merged = { ...params, ...next, structure: params.structure };
        const base = trussBase(merged);
        if (base.truss) next.truss = M.encodeTruss(base.truss);
      }
      // A structure chosen or typed in the controls is refitted to the stage.
      if (setup === 'truss' && ['structure', 'span', 'height', 'panels', 'truss'].some((k) => k in next && next[k] !== params[k])) view.refit();
      params = { ...params, ...next };
      if ('editTool' in next) {
        ui.pending = null;
        ui.note = '';
      }
      ui.hint = TOOL_HINTS[params.editTool] ?? '';
      recompute();
      render();
      publish();
    },
    getParams: () => ({ ...params }),
    play() {},
    pause() {},
    isPlaying: () => false,
    step() {},
    reset() {
      ui.pending = null;
      ui.rubber = null;
      render();
      publish();
    },
    isComplete: () => true,
    getOutputs: () => outputsFor(model, params),
    getData: () => dataFor(model, params),
    describe: () => describeFor(model, params),
    setTheme() {
      view.setTheme();
      render();
    },
    resize() {
      view.resize();
      render();
    },
    destroy() {
      detach?.();
      emit.destroy();
      view.destroy();
    },
  };
}
