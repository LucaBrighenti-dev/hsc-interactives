// argand engine: the complex plane with draggable points (guide §9.1).
// Setups: operations (z₁ ± z₂, z₁z₂, z₁/z₂, conjugate, de Moivre powers, nth roots), loci (circles, rays,
// perpendicular bisectors and their inequalities, shaded per pixel), polynomial-roots (real coefficients,
// conjugate pairs). All three are static: no time evolution, so play, pause and step do nothing.
import {
  DEG,
  BINARY,
  complex,
  modulus,
  principalArg,
  sub,
  computeOperation,
  operationOutputs,
  syncPoint,
  snapCartesian,
  snapPolar,
  conditionsFromParams,
  conditionText,
  lociOutputs,
  polyCoefficients,
  polyRoots,
  polyText,
  polynomialOutputs,
  isZeroPolynomial,
  complexText,
  angleText,
} from './model.js';
import { createView } from './view.js';
import { createEmitter, pointerDrag } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';

const OPS = 'operations';
const LOCI = 'loci';
const POLY = 'polynomial-roots';

const LOCUS_TYPES = [
  ['modulus', '|z − a| compared with r (circle)'],
  ['argument', 'arg(z − a) compared with θ (ray)'],
  ['bisector', '|z − a| compared with |z − b| (bisector)'],
];
const RELATIONS = [['eq', '='], ['lt', '<'], ['le', '≤'], ['gt', '>'], ['ge', '≥']];
const ON2 = ['modulus', 'argument', 'bisector'];

const num = (label, min, max, step, def, extra = {}) => ({ type: 'number', label, unit: '', min, max, step, default: def, ...extra });
const tidy = (x) => Number(x.toFixed(10));

/** Params for one point of the operations setup (z1 or z2), in both forms. */
function pointParams(which, sub_, re, im, visible = {}) {
  const z = complex(re, im);
  const name = `z${sub_}`;
  const form = `${which}Form`;
  const setups = [OPS];
  return {
    [form]: { type: 'enum', label: `Enter ${name} as`, options: [['cartesian', 'a + bi'], ['polar', 'Modulus, argument']], default: 'cartesian', setups, visibleWhen: { ...visible } },
    [`${which}Re`]: num(`Re ${name}`, -10, 10, 0.1, re, { setups, visibleWhen: { ...visible, [form]: 'cartesian' } }),
    [`${which}Im`]: num(`Im ${name}`, -10, 10, 0.1, im, { setups, visibleWhen: { ...visible, [form]: 'cartesian' } }),
    [`${which}Mod`]: { ...num(`|${name}|`, 0, 15, 0.1, tidy(modulus(z)), { setups, visibleWhen: { ...visible, [form]: 'polar' } }), help: 'Points stay in the square −10 ≤ Re, Im ≤ 10, so a long modulus is shortened in some directions' },
    [`${which}Arg`]: { ...num(`arg ${name}`, -180, 180, 1, tidy(principalArg(z) / DEG), { setups, visibleWhen: { ...visible, [form]: 'polar' } }), unit: '°', help: 'Principal argument in degrees, −180° < arg ≤ 180°' },
  };
}

/** Params for loci condition i (1 or 2). */
function conditionParams(i, defaults, visible = {}) {
  const setups = [LOCI];
  const type = `locus${i}`;
  return {
    [`rel${i}`]: { type: 'enum', label: `Relation ${i}`, options: RELATIONS, default: defaults.rel, widget: 'segmented', setups, visibleWhen: { ...visible } },
    [`a${i}Re`]: num(`Re a${i === 1 ? '₁' : '₂'}`, -10, 10, 0.1, defaults.a[0], { setups, visibleWhen: { ...visible } }),
    [`a${i}Im`]: num(`Im a${i === 1 ? '₁' : '₂'}`, -10, 10, 0.1, defaults.a[1], { setups, visibleWhen: { ...visible } }),
    [`r${i}`]: num(`Radius r${i === 1 ? '₁' : '₂'}`, 0.1, 10, 0.1, defaults.r, { setups, visibleWhen: { [type]: 'modulus' } }),
    [`theta${i}`]: { ...num(`Angle θ${i === 1 ? '₁' : '₂'}`, -179, 180, 1, defaults.theta, { setups, visibleWhen: { [type]: 'argument' } }), unit: '°', help: 'Principal argument in degrees, −180° < θ ≤ 180°' },
    [`b${i}Re`]: num(`Re b${i === 1 ? '₁' : '₂'}`, -10, 10, 0.1, defaults.b[0], { setups, visibleWhen: { [type]: 'bisector' } }),
    [`b${i}Im`]: num(`Im b${i === 1 ? '₁' : '₂'}`, -10, 10, 0.1, defaults.b[1], { setups, visibleWhen: { [type]: 'bisector' } }),
  };
}

const coefficient = (label, def, degrees) => num(label, -10, 10, 0.1, def, { setups: [POLY], visibleWhen: { degree: degrees } });

export const meta = {
  name: 'argand',
  version: '1.0.0',
  setups: [OPS, LOCI, POLY],
  staticSetups: [OPS, LOCI, POLY],
  params: {
    // operations
    operation: {
      type: 'enum',
      label: 'Operation',
      options: [
        ['add', 'Add: z₁ + z₂'],
        ['sub', 'Subtract: z₁ − z₂'],
        ['mul', 'Multiply: z₁z₂'],
        ['div', 'Divide: z₁ ÷ z₂'],
        ['conj', 'Conjugate of z₁'],
        ['power', 'Powers of z₁ (de Moivre)'],
        ['roots', 'nth roots'],
      ],
      default: 'mul',
      widget: 'select',
      setups: [OPS],
    },
    ...pointParams('z1', '₁', 2, 1),
    ...pointParams('z2', '₂', 1, 1, { operation: BINARY }),
    powerN: { ...num('Power n', 1, 16, 1, 8, { setups: [OPS], visibleWhen: { operation: 'power' } }), integer: true },
    rootN: { ...num('Number of roots n', 2, 12, 1, 6, { setups: [OPS], visibleWhen: { operation: 'roots' } }), integer: true },
    rootsOf: { type: 'enum', label: 'Solve', options: [['unity', 'zⁿ = 1'], ['w', 'zⁿ = z₁']], default: 'unity', setups: [OPS], visibleWhen: { operation: 'roots' } },
    similarTriangles: { type: 'boolean', label: 'Similar triangles', default: false, setups: [OPS], visibleWhen: { operation: ['mul', 'div'] }, help: 'Triangle 0, 1, z₂ is similar to the triangle the result makes' },
    showArcs: { type: 'boolean', label: 'Angle arcs', default: true, setups: [OPS] },

    // loci
    locus1: { type: 'enum', label: 'Condition 1', options: LOCUS_TYPES, default: 'modulus', widget: 'select', setups: [LOCI] },
    ...conditionParams(1, { rel: 'le', a: [1, 1], r: 2, theta: 45, b: [-1, 2] }),
    locus2: { type: 'enum', label: 'Condition 2 (and)', options: [['none', 'None'], ...LOCUS_TYPES], default: 'none', widget: 'select', setups: [LOCI] },
    ...conditionParams(2, { rel: 'ge', a: [0, 0], r: 1, theta: 0, b: [2, 0] }, { locus2: ON2 }),
    showProbe: { type: 'boolean', label: 'Test point z', default: true, setups: [LOCI] },
    zRe: num('Re z', -10, 10, 0.1, 2.5, { setups: [LOCI], visibleWhen: { showProbe: true } }),
    zIm: num('Im z', -10, 10, 0.1, 2, { setups: [LOCI], visibleWhen: { showProbe: true } }),

    // polynomial-roots
    degree: { ...num('Degree', 1, 4, 1, 3, { setups: [POLY] }), integer: true },
    c4: coefficient('Coefficient of z⁴', 1, [4]),
    c3: coefficient('Coefficient of z³', 1, [3, 4]),
    c2: coefficient('Coefficient of z²', -3, [2, 3, 4]),
    c1: coefficient('Coefficient of z', 4, [1, 2, 3, 4]),
    c0: coefficient('Constant term', -2, [1, 2, 3, 4]),
    c0Im: { ...num('Imaginary part of the constant', -5, 5, 0.1, 0, { setups: [POLY] }), help: 'Anything but 0 makes a coefficient non-real, so the roots need not pair up' },

    // shared
    angleUnit: { type: 'enum', label: 'Show arguments in', options: [['rad', 'Radians'], ['deg', 'Degrees']], default: 'rad', help: 'Radians appear as exact multiples of π where possible' },
    viewRange: { ...num('Axis range ±', 1, 10, 0.5, 4), help: 'Half the height of the visible plane' },
  },
  outputs: {
    z1Re: { label: 'Re z₁', unit: '', sigfigs: 3, setups: [OPS] },
    z1Im: { label: 'Im z₁', unit: '', sigfigs: 3, setups: [OPS] },
    z1Mod: { label: '|z₁|', unit: '', sigfigs: 3, setups: [OPS] },
    z1Arg: { label: 'arg z₁', unit: 'rad', sigfigs: 3, setups: [OPS] },
    z2Re: { label: 'Re z₂', unit: '', sigfigs: 3, setups: [OPS] },
    z2Im: { label: 'Im z₂', unit: '', sigfigs: 3, setups: [OPS] },
    z2Mod: { label: '|z₂|', unit: '', sigfigs: 3, setups: [OPS] },
    z2Arg: { label: 'arg z₂', unit: 'rad', sigfigs: 3, setups: [OPS] },
    resRe: { label: 'Re (result)', unit: '', sigfigs: 3, setups: [OPS] },
    resIm: { label: 'Im (result)', unit: '', sigfigs: 3, setups: [OPS] },
    resMod: { label: '|result|', unit: '', sigfigs: 3, setups: [OPS] },
    resArg: { label: 'arg (result)', unit: 'rad', sigfigs: 3, setups: [OPS] },

    probeDistA1: { label: '|z − a₁|', unit: '', sigfigs: 3, setups: [LOCI] },
    probeArgA1: { label: 'arg(z − a₁)', unit: 'rad', sigfigs: 3, setups: [LOCI] },
    probeDistB1: { label: '|z − b₁|', unit: '', sigfigs: 3, setups: [LOCI] },
    probeDistA2: { label: '|z − a₂|', unit: '', sigfigs: 3, setups: [LOCI] },
    probeArgA2: { label: 'arg(z − a₂)', unit: 'rad', sigfigs: 3, setups: [LOCI] },
    probeDistB2: { label: '|z − b₂|', unit: '', sigfigs: 3, setups: [LOCI] },
    probeInside: { label: 'z in the set (1 yes, 0 no)', unit: '', integer: true, setups: [LOCI] },

    root1Re: { label: 'Re root 1', unit: '', sigfigs: 3, setups: [POLY] },
    root1Im: { label: 'Im root 1', unit: '', sigfigs: 3, setups: [POLY] },
    root2Re: { label: 'Re root 2', unit: '', sigfigs: 3, setups: [POLY] },
    root2Im: { label: 'Im root 2', unit: '', sigfigs: 3, setups: [POLY] },
    root3Re: { label: 'Re root 3', unit: '', sigfigs: 3, setups: [POLY] },
    root3Im: { label: 'Im root 3', unit: '', sigfigs: 3, setups: [POLY] },
    root4Re: { label: 'Re root 4', unit: '', sigfigs: 3, setups: [POLY] },
    root4Im: { label: 'Im root 4', unit: '', sigfigs: 3, setups: [POLY] },
    rootSumRe: { label: 'Sum of roots (Re)', unit: '', sigfigs: 3, setups: [POLY] },
    rootSumIm: { label: 'Sum of roots (Im)', unit: '', sigfigs: 3, setups: [POLY] },
    rootProductRe: { label: 'Product of roots (Re)', unit: '', sigfigs: 3, setups: [POLY] },
    rootProductIm: { label: 'Product of roots (Im)', unit: '', sigfigs: 3, setups: [POLY] },
    realRootCount: { label: 'Real roots (with multiplicity)', unit: '', integer: true, setups: [POLY] },
  },
};

/** Keep derived params consistent (operations: each point's Cartesian and polar pairs). */
function normalise(setup, params, changed) {
  if (setup !== OPS) return params;
  return syncPoint(syncPoint(params, 'z1', changed), 'z2', changed);
}

/**
 * Outputs for the shell. The model uses NaN for "undefined here" (z₁/0, a fourth root of a cubic, distances
 * for an unused second condition); the shell gets null for those, which its readouts show as —.
 */
function outputsFor(setup, params) {
  const raw = setup === OPS ? operationOutputs(params) : setup === LOCI ? lociOutputs(params) : polynomialOutputs(params);
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number.isFinite(v) ? v : null]));
}

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`argand: unknown setup "${setup}"`);

  const initial = clampParams(meta.params, setup, opts.params).params;
  let params = normalise(setup, { ...defaultsFor(meta.params, setup), ...initial }, new Set(Object.keys(initial)));
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage, setup);

  const outputs = () => outputsFor(setup, params);
  const render = () => view.draw(params);

  // Points dragged on the stage change params; the 'params' event (guide §5.10) makes the shell resync its
  // controls, the URL and the share link, during the drag and again when it ends.
  const notifyParams = () => opts.onEvent?.('params', { ...params });

  function applyDrag(target, x, y) {
    const w = view.toWorld(x, y);
    const ppu = view.pxPerUnit();
    let partial = null;
    if (setup === OPS) {
      if (params[`${target}Form`] === 'polar') {
        const s = snapPolar(w, ppu, params[`${target}Arg`]);
        partial = { [`${target}Mod`]: s.mod, [`${target}Arg`]: s.argDeg };
      } else {
        const s = snapCartesian(w, ppu);
        partial = { [`${target}Re`]: s.re, [`${target}Im`]: s.im };
      }
    } else if (setup === LOCI) {
      const i = target.slice(-1);
      if (target === 'z') {
        const s = snapCartesian(w, ppu);
        partial = { zRe: s.re, zIm: s.im };
      } else if (target.startsWith('r')) {
        const a = complex(params[`a${i}Re`], params[`a${i}Im`]);
        partial = { [`r${i}`]: Math.max(0.1, snapPolar(sub(w, a), ppu).mod) };
      } else if (target.startsWith('theta')) {
        const a = complex(params[`a${i}Re`], params[`a${i}Im`]);
        const s = snapPolar(sub(w, a), ppu, params[`theta${i}`]);
        partial = { [`theta${i}`]: s.argDeg };
      } else {
        const s = snapCartesian(w, ppu);
        const key = target.slice(0, 1);
        partial = { [`${key}${i}Re`]: s.re, [`${key}${i}Im`]: s.im };
      }
    }
    if (!partial) return;
    const { params: next } = clampParams(meta.params, setup, partial);
    const changed = Object.keys(next).filter((k) => next[k] !== params[k]);
    if (!changed.length) return;
    params = normalise(setup, { ...params, ...next }, new Set(Object.keys(next)));
    render();
    emit.outputs(outputs());
    notifyParams();
  }

  const detachDrag = pointerDrag(view.canvas, {
    hit: (x, y) => view.hit(x, y, params),
    move: (target, x, y) => applyDrag(target, x, y),
    end: () => {
      emit.outputsNow(outputs());
      notifyParams();
    },
  });

  view.resize();
  render();
  emit.outputsNow(outputs());

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      params = normalise(setup, { ...params, ...next }, new Set(Object.keys(next)));
      render();
      emit.outputsNow(outputs());
    },
    getParams: () => ({ ...params }),
    // Static setups: nothing evolves in time.
    play: () => false,
    pause() {},
    isPlaying: () => false,
    step() {
      render();
      emit.outputsNow(outputs());
    },
    reset() {
      render();
      emit.outputsNow(outputs());
    },
    isComplete: () => true,
    getOutputs: () => outputs(),
    getData: () => dataFor(setup, params),
    describe: () => describe(setup, params),
    setTheme() {
      view.setTheme();
      render();
    },
    resize() {
      view.resize();
      render();
    },
    destroy() {
      detachDrag();
      emit.destroy();
      view.destroy();
    },
  };
}

// ---------------------------------------------------------------------------------------------
// CSV and screen-reader text
// ---------------------------------------------------------------------------------------------

const POINT_COLUMNS = ['point', 'Re', 'Im', 'modulus', 'argument (rad)', 'argument (°)'];

function row(name, z) {
  const m = modulus(z);
  const a = principalArg(z);
  return [name, z.re, z.im, m, Number.isFinite(a) ? a : null, Number.isFinite(a) ? a / DEG : null];
}

function dataFor(setup, params) {
  if (setup === OPS) {
    const r = computeOperation(params);
    const rows = [row('z1', r.z1)];
    if (BINARY.includes(r.op)) rows.push(row('z2', r.z2));
    if (r.op === 'power') r.powers.forEach((z, k) => rows.push(row(`z1^${k}`, z)));
    else if (r.op === 'roots') {
      rows.push(row('w', r.w));
      r.roots.forEach((z, k) => rows.push(row(`root ${k}`, z)));
    } else {
      const names = { add: 'z1 + z2', sub: 'z1 - z2', mul: 'z1 z2', div: 'z1 / z2', conj: 'conjugate of z1' };
      rows.push(row(names[r.op], r.result));
    }
    return { columns: POINT_COLUMNS, rows };
  }
  if (setup === LOCI) {
    const rows = [];
    for (const i of [1, 2]) {
      const type = params[`locus${i}`];
      if (type === 'none') continue;
      rows.push([`a${i}`, params[`a${i}Re`], params[`a${i}Im`], conditionText(conditionsFromParams(params)[i - 1], params.angleUnit)]);
      if (type === 'bisector') rows.push([`b${i}`, params[`b${i}Re`], params[`b${i}Im`], '']);
    }
    if (params.showProbe) rows.push(['z (test point)', params.zRe, params.zIm, lociOutputs(params).probeInside ? 'satisfies every condition' : 'does not satisfy every condition']);
    return { columns: ['point', 'Re', 'Im', 'note'], rows };
  }
  const roots = polyRoots(polyCoefficients(params));
  return { columns: ['root', ...POINT_COLUMNS.slice(1)], rows: roots.map((z, k) => row(`root ${k + 1}`, z)) };
}

function plain(text) {
  return text.replace(/−/g, 'minus ').replace(/√/g, 'root ').replace(/π/g, 'pi');
}

function describe(setup, params) {
  if (setup === OPS) {
    const r = computeOperation(params);
    const z1 = complexText(r.z1);
    const words = {
      add: `the sum of z1 = ${z1} and z2 = ${complexText(r.z2)}, drawn as a parallelogram`,
      sub: `z1 = ${z1} minus z2 = ${complexText(r.z2)}, the vector from z2 to z1`,
      mul: `the product of z1 = ${z1} and z2 = ${complexText(r.z2)}, as a rotation and a scaling`,
      div: `z1 = ${z1} divided by z2 = ${complexText(r.z2)}`,
      conj: `z1 = ${z1} and its conjugate, reflected in the real axis`,
      power: `the powers of z = ${z1} up to the power ${params.powerN}, on a spiral`,
      roots: `the ${params.rootN} roots of z to the ${params.rootN} equals ${params.rootsOf === 'w' ? z1 : '1'}, at the corners of a regular polygon`,
    };
    const res = Number.isFinite(r.result?.re) ? ` The result is ${complexText(r.result)}, with argument ${angleText(principalArg(r.result), params.angleUnit)}.` : ' The result is undefined.';
    return plain(`Argand diagram showing ${words[r.op]}.${r.op === 'roots' || r.op === 'power' ? '' : res}`);
  }
  if (setup === LOCI) {
    const conds = conditionsFromParams(params);
    const text = conds.map((c) => conditionText(c, params.angleUnit)).join(' and ');
    const probe = params.showProbe ? ` The test point z = ${complexText(complex(params.zRe, params.zIm))} ${lociOutputs(params).probeInside ? 'satisfies' : 'does not satisfy'} ${conds.length > 1 ? 'both conditions' : 'the condition'}.` : '';
    return plain(`Argand diagram of the locus ${text}.${probe}`);
  }
  const coeffs = polyCoefficients(params);
  if (isZeroPolynomial(coeffs)) return 'P(z) = 0, the zero polynomial: every complex number is a root.';
  const roots = polyRoots(coeffs);
  return plain(`Roots of P(z) = ${polyText(coeffs)} on an Argand diagram: ${roots.map((z) => complexText(z)).join(', ') || 'none'}.`);
}
