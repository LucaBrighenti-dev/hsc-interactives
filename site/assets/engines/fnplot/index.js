// fnplot engine: a 2D function grapher for Extension 1 and 2 Mathematics and Physics (guide §9.1).
// meta + create(stage, opts) with every method in guide §5.1. Maths in model.js (with the shared
// parser in parser.js), drawing in view.js, per-setup layout in scenes.js.
import * as M from './model.js';
import { EXPRESSION_PATTERN } from './parser.js';
import { createView } from './view.js';
import { buildScene } from './scenes.js';
import { createLoop, createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber } from '../../format.js';

const expr = (label, def, setups, extra = {}) => ({ type: 'string', label, default: def, maxLength: 80, pattern: EXPRESSION_PATTERN, setups, help: 'For example 2x^2 - 3x + 1, sin(2x), e^(-x), |x - 1|, 1/(x + 2).', ...extra });
const num = (label, unit, min, max, step, def, setups, extra = {}) => ({ type: 'number', label, unit, min, max, step, default: def, setups, ...extra });
const bool = (label, def, setups, extra = {}) => ({ type: 'boolean', label, default: def, setups, ...extra });
const choice = (label, options, def, setups, extra = {}) => ({ type: 'enum', label, options, default: def, setups, ...extra });

const TIME_SETUPS = ['parametric', 'heating'];
const ALL = ['transform', 'inverse', 'parametric', 'polynomial', 'auxiliary', 'blackbody', 'inequality', 'inverse-trig', 'substitution', 'by-parts', 'partial-fractions', 'heating'];
const W = Object.fromEntries(Object.entries(M.WATER).map(([k, v]) => [k, v.value]));
const out = (label, unit, setups, extra = {}) => ({ label, unit, setups, ...extra });

export const meta = {
  name: 'fnplot',
  version: '1.0.0',
  setups: ALL,
  staticSetups: ALL.filter((s) => !TIME_SETUPS.includes(s)),
  stepSize: 30, // fixed steps per press of Step: 1/20 of a run
  params: {
    // transform
    fx: expr('f(x)', '(x+1)(x-2)', ['transform']),
    transform: choice('Graph', [['reciprocal', 'y = 1/f(x)'], ['abs', 'y = |f(x)|'], ['absx', 'y = f(|x|)']], 'reciprocal', ['transform']),
    layout: choice('Layout', [['side', 'Side by side'], ['overlay', 'Overlaid']], 'side', ['transform']),
    showOriginal: bool('Show f(x) dashed on the right', true, ['transform'], { visibleWhen: { layout: 'side' } }),
    probeX: num('Point x₀', '', -10, 10, 0.1, 3, ['transform', 'inverse'], { help: 'Drag the point on the graph, or set it here.' }),
    // inverse
    inverseFx: expr('f(x)', 'x^2 - 2x - 1', ['inverse']),
    domainMin: num('Domain from a', '', -10, 10, 0.1, -2, ['inverse']),
    domainMax: num('Domain to b', '', -10, 10, 0.1, 4, ['inverse']),
    showMirror: bool('Show the line y = x', true, ['inverse']),
    // parametric
    curve: choice('Curve', [['line', 'Line'], ['parabola', 'Parabola'], ['circle', 'Circle'], ['custom', 'Your own x(t), y(t)']], 'parabola', ['parametric'], { widget: 'select' }),
    pa: num('a', '', -5, 5, 0.1, 1, ['parametric'], { help: 'Line: x = h + at. Parabola: x = h + 2at, y = k + at². Circle: radius |a|.' }),
    pb: num('b', '', -5, 5, 0.1, 2, ['parametric'], { help: 'Line: y = k + bt.', visibleWhen: { curve: ['line', 'custom'] } }),
    h: num('h (shift in x)', '', -5, 5, 0.1, 0, ['parametric']),
    k: num('k (shift in y)', '', -5, 5, 0.1, 0, ['parametric']),
    xt: expr('x(t)', '2cos t', ['parametric'], { visibleWhen: { curve: 'custom' }, help: 'Use t, and a, b, h, k if you like. For example 2cos t, t^2 - 1.' }),
    yt: expr('y(t)', 'sin 2t', ['parametric'], { visibleWhen: { curve: 'custom' }, help: 'Use t, and a, b, h, k if you like.' }),
    tMin: num('t from', '', -10, 10, 0.1, -3.2, ['parametric']),
    tMax: num('t to', '', -10, 10, 0.1, 3.2, ['parametric']),
    t: num('t', '', -10, 10, 0.01, 3.2, ['parametric'], { help: 'Drag the point along the curve, press play, or set t here.' }),
    eliminate: num('Steps to eliminate t', '', 0, 3, 1, 0, ['parametric'], { integer: true }),
    // polynomial
    roots: { type: 'list', label: 'Roots', unit: '', min: -6, max: 6, minItems: 1, maxItems: 5, default: [-2, 1, 3], setups: ['polynomial'], help: 'Repeat a root for a double root, e.g. 1, 1, -2. Or drag the roots on the x-axis.' },
    leading: num('Leading coefficient a', '', -3, 3, 0.5, 1, ['polynomial']),
    // auxiliary angle
    a: num('a (multiplies sin x)', '', -6, 6, 0.5, 3, ['auxiliary']),
    b: num('b (multiplies cos x)', '', -6, 6, 0.5, 4, ['auxiliary']),
    form: choice('Write it as', [['sin-plus', 'R sin(x + α)'], ['sin-minus', 'R sin(x − α)'], ['cos-plus', 'R cos(x + α)'], ['cos-minus', 'R cos(x − α)']], 'sin-plus', ['auxiliary'], { widget: 'select' }),
    angleUnit: choice('Show α in', [['deg', 'Degrees'], ['rad', 'Radians']], 'deg', ['auxiliary']),
    showComponents: bool('Show a sin x and b cos x', true, ['auxiliary']),
    // blackbody
    temperature: num('Temperature T', 'K', 1000, 12000, 100, 5800, ['blackbody']),
    compare: bool('Compare two more temperatures', true, ['blackbody']),
    temperature2: num('Second temperature', 'K', 1000, 12000, 100, 4500, ['blackbody'], { visibleWhen: { compare: true } }),
    temperature3: num('Third temperature', 'K', 1000, 12000, 100, 3000, ['blackbody'], { visibleWhen: { compare: true } }),
    showVisible: bool('Show the visible band', true, ['blackbody']),
    showLocus: bool('Show where the peaks lie', false, ['blackbody']),
    // inequality
    ineqLeft: expr('Left side', '(x-3)(x+2)', ['inequality']),
    relation: choice('Relation', [['lt', '<'], ['le', '≤'], ['gt', '>'], ['ge', '≥']], 'ge', ['inequality'], { widget: 'segmented' }),
    ineqRight: expr('Right side', '0', ['inequality']),
    // inverse trig
    trigFn: choice('Function', [['sin', 'sin'], ['cos', 'cos'], ['tan', 'tan']], 'sin', ['inverse-trig']),
    trigProbe: num('Point x₀', '', -3, 3, 0.01, 0.5, ['inverse-trig'], { help: 'Drag the point on the inverse graph, or set it here.' }),
    showDerivative: bool('Show the derivative', true, ['inverse-trig']),
    showFull: bool('Show the unrestricted graph', true, ['inverse-trig']),
    // substitution
    subF: expr('f(u)', 'u^3', ['substitution'], { help: 'A function of u, for example u^3, cos u, e^u.' }),
    subG: expr('u = g(x)', 'x^2 + 1', ['substitution']),
    subA: num('Lower limit a', '', -5, 5, 0.05, 0, ['substitution']),
    subB: num('Upper limit b', '', -5, 5, 0.05, 1, ['substitution']),
    // by parts
    partsView: choice('View', [['area', 'Area picture'], ['reduction', 'Reduction formula']], 'area', ['by-parts']),
    partsU: expr('u(x)', 'x', ['by-parts'], { visibleWhen: { partsView: 'area' } }),
    partsV: expr('v(x)', 'e^x', ['by-parts'], { visibleWhen: { partsView: 'area' } }),
    partsA: num('From x =', '', -5, 5, 0.05, 0, ['by-parts'], { visibleWhen: { partsView: 'area' } }),
    partsB: num('To x =', '', -5, 5, 0.05, 1, ['by-parts'], { visibleWhen: { partsView: 'area' } }),
    reduction: choice('Integral', [['sin', 'Iₙ = ∫ sinⁿx dx from 0 to π/2'], ['xex', 'Iₙ = ∫ xⁿeˣ dx from 0 to 1']], 'sin', ['by-parts'], { widget: 'select', visibleWhen: { partsView: 'reduction' } }),
    reductionN: num('n', '', 0, 12, 1, 4, ['by-parts'], { integer: true, visibleWhen: { partsView: 'reduction' } }),
    // partial fractions
    pfNumerator: { type: 'list', label: 'Numerator coefficients, highest power first', unit: '', min: -50, max: 50, minItems: 1, maxItems: 5, default: [3, 1], setups: ['partial-fractions'], help: '3, 1 means 3x + 1.' },
    pfRoots: { type: 'list', label: 'Denominator roots', unit: '', min: -6, max: 6, minItems: 1, maxItems: 4, default: [1, -2], setups: ['partial-fractions'], help: '1, -2 means (x − 1)(x + 2). Repeat a root for a repeated factor.' },
    showTerms: bool('Graph each partial fraction', true, ['partial-fractions']),
    // heating
    heatingMode: choice('Model', [['curve', 'Heating curve'], ['cooling', 'Newton cooling']], 'curve', ['heating']),
    mass: num('Mass m', 'kg', 0.1, 5, 0.1, 1, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    power: num('Heater power P', 'W', 100, 5000, 50, 2000, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    startTemp: num('Starting temperature', '°C', -50, 0, 1, -20, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    endTemp: num('Final temperature', '°C', 100, 150, 1, 120, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    cIce: num('Specific heat of ice', 'J kg⁻¹ K⁻¹', 1000, 5000, 10, W.cIce, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    cWater: num('Specific heat of water', 'J kg⁻¹ K⁻¹', 1000, 6000, 10, W.cWater, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    cSteam: num('Specific heat of steam', 'J kg⁻¹ K⁻¹', 1000, 5000, 10, W.cSteam, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    latentFusion: num('Latent heat of fusion', 'J kg⁻¹', 100000, 1000000, 1000, W.latentFusion, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    latentVaporisation: num('Latent heat of vaporisation', 'J kg⁻¹', 1000000, 3000000, 1000, W.latentVaporisation, ['heating'], { visibleWhen: { heatingMode: 'curve' } }),
    coolStart: num('Starting temperature T₀', '°C', 20, 100, 1, 90, ['heating'], { visibleWhen: { heatingMode: 'cooling' } }),
    ambient: num('Surroundings', '°C', 0, 40, 1, 20, ['heating'], { visibleWhen: { heatingMode: 'cooling' } }),
    coolingK: num('Cooling constant k', 's⁻¹', 0.0002, 0.02, 0.0001, 0.002, ['heating'], { visibleWhen: { heatingMode: 'cooling' } }),
    // shared
    piTicks: bool('Label x in multiples of π', false, ['transform', 'inverse', 'parametric', 'polynomial', 'inequality', 'substitution', 'by-parts', 'partial-fractions']),
    timeScale: num('Playback speed', '×', 0.25, 2, 0.25, 1, TIME_SETUPS),
  },
  outputs: {
    fValue: out('f(x₀)', '', ['transform']),
    gValue: out('New graph at x₀', '', ['transform']),
    rangeMin: out('Range from', '', ['inverse']),
    rangeMax: out('Range to', '', ['inverse']),
    hits: out('Horizontal line hits', '', ['inverse'], { integer: true }),
    oneToOne: out('One-to-one (1 yes, 0 no)', '', ['inverse'], { integer: true }),
    traceT: out('t', '', ['parametric']),
    traceX: out('x(t)', '', ['parametric']),
    traceY: out('y(t)', '', ['parametric']),
    sumRoots: out('Sum of roots', '', ['polynomial'], { sigfigs: 4 }),
    pairSum: out('Sum of roots in pairs', '', ['polynomial'], { sigfigs: 4 }),
    productRoots: out('Product of roots', '', ['polynomial'], { sigfigs: 4 }),
    degree: out('Degree', '', ['polynomial'], { integer: true }),
    R: out('R', '', ['auxiliary'], { sigfigs: 4 }),
    alpha: out('α', 'rad', ['auxiliary'], { sigfigs: 4 }),
    alphaDeg: out('α', '°', ['auxiliary'], { sigfigs: 4 }),
    peakWavelength: out('Peak wavelength λmax', 'm', ['blackbody'], { sigfigs: 4, siPrefix: true }),
    lambdaT: out('λmax × T', 'm K', ['blackbody'], { sigfigs: 4 }),
    peakRadiance: out('Peak spectral radiance', 'W sr⁻¹ m⁻³', ['blackbody']),
    exitance: out('Power per area σT⁴', 'W m⁻²', ['blackbody']),
    zeroCount: out('Zeros', '', ['inequality'], { integer: true }),
    poleCount: out('Points where undefined', '', ['inequality'], { integer: true }),
    inverseValue: out('Inverse at x₀', 'rad', ['inverse-trig'], { sigfigs: 4 }),
    inverseSlope: out('Slope of the inverse at x₀', '', ['inverse-trig'], { sigfigs: 4 }),
    fSlope: out('Slope at the mirror point', '', ['inverse-trig'], { sigfigs: 4 }),
    areaX: out('∫ f(g(x)) g′(x) dx', '', ['substitution'], { sigfigs: 4 }),
    areaU: out('∫ f(u) du', '', ['substitution'], { sigfigs: 4 }),
    uLower: out('u at x = a', '', ['substitution']),
    uUpper: out('u at x = b', '', ['substitution']),
    intUdv: out('∫ u dv', '', ['by-parts'], { sigfigs: 4 }),
    intVdu: out('∫ v du', '', ['by-parts'], { sigfigs: 4 }),
    boundaryTerm: out('[uv] from a to b', '', ['by-parts'], { sigfigs: 4 }),
    reductionValue: out('Iₙ by the reduction formula', '', ['by-parts'], { sigfigs: 4 }),
    reductionNumeric: out('Iₙ by direct integration', '', ['by-parts'], { sigfigs: 4 }),
    pfA: out('A₁', '', ['partial-fractions'], { sigfigs: 4 }),
    pfB: out('A₂', '', ['partial-fractions'], { sigfigs: 4 }),
    pfC: out('A₃', '', ['partial-fractions'], { sigfigs: 4 }),
    pfD: out('A₄', '', ['partial-fractions'], { sigfigs: 4 }),
    heatTime: out('Time t', 's', ['heating']),
    heatTemp: out('Temperature T', '°C', ['heating']),
    heatSupplied: out('Heat supplied Q = Pt', 'J', ['heating']),
    meltTime: out('Time spent melting', 's', ['heating']),
    boilTime: out('Time spent boiling', 's', ['heating']),
    halfTime: out('Halving time ln 2 / k', 's', ['heating']),
  },
};

// ── Solving and outputs (pure helpers around model.js) ───────────────────────────────────────

const SOLVERS = {
  transform: M.solveTransform,
  inverse: M.solveInverse,
  parametric: M.solveParametric,
  polynomial: M.solvePolynomial,
  auxiliary: M.solveAuxiliary,
  blackbody: M.solveBlackbody,
  inequality: M.solveInequality,
  'inverse-trig': M.solveInverseTrig,
  substitution: M.solveSubstitution,
  'by-parts': M.solveByParts,
  'partial-fractions': M.solvePartialFractions,
  heating: M.solveHeating,
};

function outputsFor(setup, s, p, state) {
  const keys = Object.entries(meta.outputs).filter(([, o]) => o.setups.includes(setup)).map(([k]) => k);
  // Readouts that don't apply (the other mode, fewer terms, an unreadable expression) are null: shown as "—".
  const blank = Object.fromEntries(keys.map((k) => [k, null]));
  if (s.error) return blank;
  switch (setup) {
    case 'transform':
      return { fValue: s.fValue, gValue: s.gValue };
    case 'inverse':
      return { rangeMin: s.rangeMin, rangeMax: s.rangeMax, hits: s.hits.length, oneToOne: s.oneToOne ? 1 : 0 };
    case 'parametric':
      return { traceT: s.t, traceX: s.point[0], traceY: s.point[1] };
    case 'polynomial':
      if (p.leading === 0) return blank;
      return { sumRoots: s.sum, pairSum: s.degree >= 2 ? s.pairSum : null, productRoots: s.product, degree: s.degree };
    case 'auxiliary':
      return { R: s.R, alpha: s.alpha, alphaDeg: s.alphaDeg };
    case 'blackbody':
      return { peakWavelength: s.peakWavelength, lambdaT: s.lambdaT, peakRadiance: s.peakRadiance, exitance: s.exitance };
    case 'inequality':
      return { zeroCount: s.zeroCount, poleCount: s.poleCount };
    case 'inverse-trig':
      return { inverseValue: s.y0, inverseSlope: s.slope, fSlope: s.fSlope };
    case 'substitution':
      return { areaX: s.areaX, areaU: s.areaU, uLower: s.uA, uUpper: s.uB };
    case 'by-parts':
      return s.mode === 'area'
        ? { ...blank, intUdv: s.intUdv, intVdu: s.intVdu, boundaryTerm: s.boundary }
        : { ...blank, reductionValue: s.reductionValue, reductionNumeric: s.reductionNumeric };
    case 'partial-fractions': {
      const c = s.coefs;
      return { pfA: c[0] ?? null, pfB: c[1] ?? null, pfC: c[2] ?? null, pfD: c[3] ?? null };
    }
    case 'heating': {
      const t = M.heatingTime(s, state.n);
      if (s.mode === 'cooling') return { ...blank, heatTime: t, heatTemp: s.T(t), halfTime: s.halfTime };
      return { ...blank, heatTime: t, heatTemp: s.T(t), heatSupplied: p.power * t, meltTime: s.meltTime, boilTime: s.boilTime };
    }
    default:
      return blank;
  }
}

const grid = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const fin = (v) => (Number.isFinite(v) ? v : null);

function dataFor(setup, s, p, state) {
  if (s.error) return { columns: ['x'], rows: [] };
  switch (setup) {
    case 'transform':
      return { columns: ['x', 'f(x)', { reciprocal: '1/f(x)', abs: '|f(x)|', absx: 'f(|x|)' }[p.transform]], rows: grid(-10, 10, 400).map((x) => [x, fin(s.f(x)), fin(s.g(x))]) };
    case 'inverse':
      return { columns: ['x', 'f(x)'], rows: grid(s.a, s.b, 200).map((x) => [x, fin(s.f(x))]) };
    case 'parametric':
      return { columns: ['t', 'x', 'y'], rows: grid(s.t0, s.t, 200).map((t) => [t, fin(s.x(t)), fin(s.y(t))]) };
    case 'polynomial':
      return { columns: ['x', 'P(x)'], rows: grid(-6, 6, 240).map((x) => [x, s.f(x)]) };
    case 'auxiliary':
      return { columns: ['x (rad)', 'a sin x', 'b cos x', 'a sin x + b cos x'], rows: grid(-2 * Math.PI, 2 * Math.PI, 400).map((x) => [x, s.partA(x), s.partB(x), s.sum(x)]) };
    case 'blackbody':
      return { columns: ['wavelength (nm)', ...s.curves.map((c) => `B at ${c.T} K (W sr^-1 m^-3)`)], rows: grid(50, 4000, 395).map((l) => [l, ...s.curves.map((c) => M.planck(l * 1e-9, c.T))]) };
    case 'inequality':
      return { columns: ['x', 'left side', 'right side', 'left − right'], rows: grid(-10, 10, 400).map((x) => [x, fin(s.left(x)), fin(s.right(x)), fin(s.g(x))]) };
    case 'inverse-trig': {
      const [d0, d1] = p.trigFn === 'tan' ? [-5, 5] : [-1, 1];
      return { columns: ['x', 'inverse (rad)', 'derivative of the inverse'], rows: grid(d0, d1, 200).map((x) => [x, s.inv(x), fin(s.dInv(x))]) };
    }
    case 'substitution':
      return { columns: ['x', "f(g(x)) g'(x)", 'u = g(x)', 'f(u)'], rows: grid(s.a, s.b, 200).map((x) => [x, fin(s.integrand(x)), fin(s.g(x)), fin(s.f(s.g(x)))]) };
    case 'by-parts':
      if (s.mode === 'reduction') return { columns: ['n', 'I_n'], rows: s.chain.map((c) => [c.n, c.value]) };
      return { columns: ['x', 'u', 'v'], rows: grid(s.a, s.b, 200).map((x) => [x, fin(s.u(x)), fin(s.v(x))]) };
    case 'partial-fractions':
      return { columns: ['x', 'f(x)', ...s.terms.map((t) => `A/(x - ${t.root})^${t.power}`)], rows: grid(-6, 6, 480).map((x) => [x, fin(s.f(x)), ...s.termFns.map((f) => fin(f(x)))]) };
    case 'heating': {
      const t = M.heatingTime(s, state.n);
      const rows = grid(0, t, 200).map((ti) => (s.mode === 'cooling' ? [ti, s.T(ti)] : [ti, s.T(ti), p.power * ti]));
      return { columns: s.mode === 'cooling' ? ['t (s)', 'T (°C)'] : ['t (s)', 'T (°C)', 'Q (J)'], rows };
    }
    default:
      return { columns: [], rows: [] };
  }
}

function describeFor(setup, s, p) {
  const n = (v) => formatNumber(v);
  if (s.error) return `The expression for ${s.name} can't be read yet: ${s.error.message}`;
  switch (setup) {
    case 'transform':
      return `Graph of f(x) = ${p.fx} beside the graph of ${{ reciprocal: 'y = 1 over f(x)', abs: 'y = the absolute value of f(x)', absx: 'y = f of the absolute value of x' }[p.transform]}.`;
    case 'inverse':
      return `Graph of f(x) = ${p.inverseFx} for ${n(s.a)} ≤ x ≤ ${n(s.b)} and its reflection in y = x. ${s.oneToOne ? 'It is one-to-one, so the inverse is a function.' : 'It is not one-to-one, so the reflection is not a function.'}`;
    case 'parametric':
      return `Parametric ${p.curve} traced from t = ${n(s.t0)} to t = ${n(s.t)}; the point is at (${n(s.point[0])}, ${n(s.point[1])}).`;
    case 'polynomial':
      return `Polynomial with roots ${p.roots.map(n).join(', ')} and leading coefficient ${n(p.leading)}. Sum of roots ${n(s.sum)}, product ${n(s.product)}.`;
    case 'auxiliary':
      return `${n(p.a)} sin x + ${n(p.b)} cos x equals R sin or cos of x plus or minus alpha, with R = ${n(s.R)} and alpha = ${n(s.alphaDeg)} degrees.`;
    case 'blackbody':
      return `Planck curves for ${s.curves.map((c) => `${n(c.T)} K`).join(', ')}. The ${n(p.temperature)} K curve peaks at ${n(s.peakWavelength * 1e9)} nm.`;
    case 'inequality':
      return `Graph and number line for the inequality ${p.ineqLeft} ${{ lt: 'less than', le: 'at most', gt: 'greater than', ge: 'at least' }[p.relation]} ${p.ineqRight}.`;
    case 'inverse-trig':
      return `Inverse ${p.trigFn} built by restricting ${p.trigFn} x and reflecting it in y = x. At x = ${n(s.x0)} the inverse is ${n(s.y0)} and its slope is ${n(s.slope)}.`;
    case 'substitution':
      return `Two equal areas: under f(g(x)) g′(x) from ${n(s.a)} to ${n(s.b)}, and under f(u) from ${n(s.uA)} to ${n(s.uB)}. Both are ${n(s.areaX)}.`;
    case 'by-parts':
      return s.mode === 'area' ? `Integration by parts as areas: integral of u dv ${n(s.intUdv)} plus integral of v du ${n(s.intVdu)} equals uv from a to b, ${n(s.boundary)}.` : `Reduction formula for I sub ${s.n}: ${n(s.reductionValue)}.`;
    case 'partial-fractions':
      return `A rational function split into ${s.terms.length} partial fractions, each graphed.`;
    case 'heating':
      return s.mode === 'cooling' ? `Newton cooling from ${n(p.coolStart)} °C towards ${n(p.ambient)} °C.` : `Heating curve for ${n(p.mass)} kg of water heated at ${n(p.power)} W from ${n(p.startTemp)} °C to ${n(p.endTemp)} °C.`;
    default:
      return 'Function graph.';
  }
}

const round = (v, step) => Math.round(v / step) * step;
const tidy = (v) => Number(v.toPrecision(12));

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`fnplot: unknown setup "${setup}"`);
  const isStatic = meta.staticSetups.includes(setup);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  let state = { n: 0 }; // heating: fixed steps taken (parametric keeps its trace position in params.t)
  let solved = SOLVERS[setup](params);
  let version = 0;
  let lastParamsEvent = 0;
  const emit = createEmitter(opts.onEvent);
  const paramsEvent = () => opts.onEvent?.('params', getParams());

  const resolve = () => {
    solved = SOLVERS[setup](params);
    version += 1;
  };
  const outputs = () => outputsFor(setup, solved, params, state);
  const render = () => view.draw((size) => buildScene(setup, { s: solved, p: params, state, version, ...size }));
  const getParams = () => Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v.slice() : v]));

  const tRange = () => [Math.min(params.tMin, params.tMax), Math.max(params.tMin, params.tMax)];
  const complete = () => {
    if (setup === 'parametric') return params.t >= tRange()[1];
    if (setup === 'heating') return state.n >= M.RUN_STEPS;
    return true;
  };
  const advance = (n) => {
    if (setup === 'parametric') {
      params = { ...params, t: tidy(M.advanceParametric(params, n)) };
      resolve();
    } else if (setup === 'heating') state = { n: Math.min(M.RUN_STEPS, state.n + Math.max(0, Math.floor(n))) };
  };
  const time = () => (setup === 'parametric' ? params.t : setup === 'heating' ? M.heatingTime(solved, state.n) : 0);

  function apply(partial) {
    const { params: next } = clampParams(meta.params, setup, partial);
    params = { ...params, ...next };
    resolve();
    render();
    emit.outputsNow(outputs());
  }

  // Dragging points on the stage edits params, then tells the shell ('params' event).
  function dragPatch(id, wx, wy) {
    if (id === 'probe') return { probeX: tidy(round(wx, 0.01)) };
    if (id === 'domainMin' || id === 'domainMax') return { [id]: tidy(round(wx, 0.1)) };
    if (id === 'trigProbe') {
      const lim = params.trigFn === 'tan' ? 3 : 0.99;
      return { trigProbe: tidy(Math.max(-lim, Math.min(lim, round(wx, 0.01)))) };
    }
    if (id === 'subA' || id === 'subB') return { [id]: tidy(round(wx, 0.05)) };
    if (id === 'tracer' && !solved.error) {
      const [t0, t1] = tRange();
      let best = params.t;
      let bestD = Infinity;
      for (let i = 0; i <= 1000; i++) {
        const t = t0 + ((t1 - t0) * i) / 1000;
        const d = (solved.x(t) - wx) ** 2 + (solved.y(t) - wy) ** 2;
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }
      return { t: tidy(round(best, 0.01)) };
    }
    if (id.startsWith('root-')) {
      const i = Number(id.slice(5));
      const roots = params.roots.slice();
      let v = tidy(round(wx, 0.1));
      // Snap onto another root to make a repeated root.
      for (let j = 0; j < roots.length; j++) if (j !== i && Math.abs(roots[j] - wx) < 0.18) v = roots[j];
      roots[i] = v;
      return { roots };
    }
    if (id.startsWith('pole-')) {
      const i = Number(id.slice(5));
      const pfRoots = params.pfRoots.slice();
      pfRoots[i] = tidy(round(wx, 0.5));
      return { pfRoots };
    }
    if (id === 'tip') {
      const X = tidy(round(wx, 0.5));
      const Y = tidy(round(wy, 0.5));
      if (params.form === 'sin-plus') return { a: X, b: Y };
      if (params.form === 'sin-minus') return { a: X, b: -Y };
      if (params.form === 'cos-plus') return { b: X, a: -Y };
      return { b: X, a: Y };
    }
    return null;
  }

  const view = createView(stage, {
    onDrag(id, wx, wy) {
      const patch = dragPatch(id, wx, wy);
      if (!patch) return;
      apply(patch);
      paramsEvent();
    },
  });

  const loop = isStatic
    ? null
    : createLoop({
        dt: M.DT,
        step: () => advance(1),
        render,
        isComplete: complete,
        getTimeScale: () => params.timeScale,
        onFrame: () => {
          emit.tick(time());
          emit.outputs(outputs());
          const now = performance.now();
          if (setup === 'parametric' && now - lastParamsEvent > 100) {
            lastParamsEvent = now;
            paramsEvent();
          }
        },
        onComplete: () => {
          emit.outputsNow(outputs());
          if (setup === 'parametric') paramsEvent();
          emit.complete();
        },
        onError: (err) => emit.error(err),
      });

  view.resize();
  render();
  emit.outputsNow(outputs());

  return {
    setParams(partial) {
      apply(partial);
    },
    getParams,
    play: () => (loop ? loop.play() : false),
    pause: () => loop?.pause(),
    isPlaying: () => (loop ? loop.isPlaying() : false),
    step(n = 1) {
      if (isStatic) return;
      advance(n); // stops early at the end of the run
      render();
      emit.outputsNow(outputs());
      if (setup === 'parametric') paramsEvent();
      if (complete()) emit.complete();
    },
    reset() {
      loop?.pause();
      if (setup === 'parametric') {
        params = { ...params, t: tRange()[0] };
        resolve();
        paramsEvent();
      }
      state = { n: 0 };
      render();
      emit.outputsNow(outputs());
    },
    isComplete: complete,
    getOutputs: outputs,
    getData: () => dataFor(setup, solved, params, state),
    describe: () => describeFor(setup, solved, params),
    setTheme() {
      view.setTheme();
      render();
    },
    resize() {
      view.resize();
      render();
    },
    destroy() {
      loop?.destroy();
      emit.destroy();
      view.destroy();
    },
  };
}
