// space3d engine: three.js scenes for 3D vectors, lines and spheres, solids of revolution,
// 3D trigonometry, orthogonal projection (AS 1100 third angle) and descriptive geometry.
// All the numbers come from model.js (pure, tested in Node). view.js draws them; it loads three.js
// with a dynamic import, so this file stays importable in Node for the contract test.
// Every setup is static (no time evolution): play, pause and step are no-ops.
import * as M from './model.js';
import { createView } from './view.js';
import { createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber, formatPlain } from '../../format.js';
// The revolution setup's curve goes through the shared safe expression parser (owned by fnplot; no eval).
import { EXPRESSION_PATTERN } from '../fnplot/parser.js';

const SETUPS = ['revolution', 'trig3d', 'vectors', 'lines-spheres', 'orthographic', 'descriptive'];
const only = (...s) => ({ setups: s });
const XYZ = { type: 'list', min: -10, max: 10, minItems: 3, maxItems: 3 };
const MM3 = { type: 'list', min: 0, max: 100, minItems: 3, maxItems: 3, unit: 'mm' };

export const meta = {
  name: 'space3d',
  version: '1.0.0',
  setups: SETUPS,
  staticSetups: SETUPS,
  params: {
    // revolution
    f: {
      type: 'string',
      label: 'Curve',
      default: 'sqrt(x)',
      maxLength: 80,
      pattern: EXPRESSION_PATTERN,
      help: 'y = f(x) for the x-axis; x = g(y) for the y-axis.',
      ...only('revolution'),
    },
    axis: { type: 'enum', label: 'Rotate about', options: [['x', 'x-axis'], ['y', 'y-axis']], default: 'x', ...only('revolution') },
    lower: { type: 'number', label: 'From', unit: '', min: -10, max: 10, step: 0.1, default: 0, ...only('revolution') },
    upper: { type: 'number', label: 'To', unit: '', min: -10, max: 10, step: 0.1, default: 4, ...only('revolution') },
    discs: { type: 'number', label: 'Number of discs', unit: '', min: 1, max: 200, step: 1, integer: true, default: 10, ...only('revolution') },
    discRule: { type: 'enum', label: 'Disc radius taken at', options: [['left', 'Left'], ['midpoint', 'Midpoint'], ['right', 'Right']], default: 'midpoint', ...only('revolution') },
    showDiscs: { type: 'boolean', label: 'Disc slices', default: true, ...only('revolution') },
    showSolid: { type: 'boolean', label: 'Solid surface', default: true, ...only('revolution') },
    sweep: { type: 'number', label: 'Revolve by', unit: '°', min: 0, max: 360, step: 5, default: 360, ...only('revolution') },

    // trig3d
    scene: { type: 'enum', label: 'Scene', options: [['tower', 'Tower'], ['cuboid', 'Cuboid'], ['ramp', 'Ramp'], ['pyramid', 'Pyramid']], widget: 'segmented', default: 'tower', ...only('trig3d') },
    towerHeight: { type: 'number', label: 'Tower height h', unit: 'm', min: 5, max: 300, step: 1, default: 60, visibleWhen: { scene: 'tower' }, ...only('trig3d') },
    distA: { type: 'number', label: 'Distance from the base to A', unit: 'm', min: 10, max: 500, step: 1, default: 80, visibleWhen: { scene: 'tower' }, ...only('trig3d') },
    bearingA: { type: 'number', label: 'Bearing of A from the base', unit: '°', min: 0, max: 359, step: 1, default: 180, visibleWhen: { scene: 'tower' }, ...only('trig3d') },
    distB: { type: 'number', label: 'Distance from the base to B', unit: 'm', min: 10, max: 500, step: 1, default: 60, visibleWhen: { scene: 'tower' }, ...only('trig3d') },
    bearingB: { type: 'number', label: 'Bearing of B from the base', unit: '°', min: 0, max: 359, step: 1, default: 90, visibleWhen: { scene: 'tower' }, ...only('trig3d') },
    length: { type: 'number', label: 'Length (east)', unit: 'm', min: 1, max: 50, step: 0.5, default: 4, visibleWhen: { scene: ['cuboid', 'ramp'] }, ...only('trig3d') },
    width: { type: 'number', label: 'Width (north)', unit: 'm', min: 1, max: 50, step: 0.5, default: 3, visibleWhen: { scene: ['cuboid', 'ramp'] }, ...only('trig3d') },
    height: { type: 'number', label: 'Height', unit: 'm', min: 1, max: 50, step: 0.5, default: 12, visibleWhen: { scene: ['cuboid', 'ramp', 'pyramid'] }, ...only('trig3d') },
    baseSide: { type: 'number', label: 'Base side s', unit: 'm', min: 1, max: 50, step: 0.5, default: 6, visibleWhen: { scene: 'pyramid' }, ...only('trig3d') },
    showTriangles: { type: 'boolean', label: 'Shade the key triangles', default: true, ...only('trig3d') },

    // vectors
    dimension: { type: 'enum', label: 'Space', options: [['2d', '2D'], ['3d', '3D']], default: '3d', ...only('vectors') },
    ax: { type: 'number', label: 'a: x component', unit: '', min: -10, max: 10, step: 0.5, default: 1, ...only('vectors') },
    ay: { type: 'number', label: 'a: y component', unit: '', min: -10, max: 10, step: 0.5, default: 2, ...only('vectors') },
    az: { type: 'number', label: 'a: z component', unit: '', min: -10, max: 10, step: 0.5, default: 2, visibleWhen: { dimension: '3d' }, ...only('vectors') },
    bx: { type: 'number', label: 'b: x component', unit: '', min: -10, max: 10, step: 0.5, default: 2, ...only('vectors') },
    by: { type: 'number', label: 'b: y component', unit: '', min: -10, max: 10, step: 0.5, default: -1, ...only('vectors') },
    bz: { type: 'number', label: 'b: z component', unit: '', min: -10, max: 10, step: 0.5, default: 2, visibleWhen: { dimension: '3d' }, ...only('vectors') },
    operation: {
      type: 'enum',
      label: 'Show',
      options: [['add', 'a + b'], ['subtract', 'a − b'], ['scale', 'k a'], ['dot', 'a · b and θ'], ['project', 'Projection of a on b']],
      widget: 'select',
      default: 'dot',
      ...only('vectors'),
    },
    scalar: { type: 'number', label: 'k', unit: '', min: -3, max: 3, step: 0.25, default: 2, visibleWhen: { operation: 'scale' }, ...only('vectors') },
    showComponents: { type: 'boolean', label: 'Component guides', default: true, ...only('vectors') },

    // lines-spheres
    mode: { type: 'enum', label: 'Show', options: [['lines', 'Two lines'], ['sphere', 'Line and sphere']], default: 'lines', ...only('lines-spheres') },
    point1: { ...XYZ, label: 'Line 1 point a₁ (x, y, z)', default: [1, 2, 3], ...only('lines-spheres') },
    dir1: { ...XYZ, label: 'Line 1 direction u (x, y, z)', default: [1, -1, 2], ...only('lines-spheres') },
    point2: { ...XYZ, label: 'Line 2 point a₂ (x, y, z)', default: [2, 0, 1], visibleWhen: { mode: 'lines' }, ...only('lines-spheres') },
    dir2: { ...XYZ, label: 'Line 2 direction v (x, y, z)', default: [1, 1, 1], visibleWhen: { mode: 'lines' }, ...only('lines-spheres') },
    centre: { ...XYZ, label: 'Sphere centre c (x, y, z)', default: [1, 1, 1], visibleWhen: { mode: 'sphere' }, ...only('lines-spheres') },
    radius: { type: 'number', label: 'Sphere radius R', unit: '', min: 0.5, max: 10, step: 0.5, default: 3, visibleWhen: { mode: 'sphere' }, ...only('lines-spheres') },
    lambda: { type: 'number', label: 'λ for the moving point P', unit: '', min: -10, max: 10, step: 0.1, default: 0, ...only('lines-spheres') },
    showClosest: { type: 'boolean', label: 'Show closest approach', default: false, visibleWhen: { mode: 'lines' }, ...only('lines-spheres') },

    // orthographic
    part: {
      type: 'enum',
      label: 'Part',
      options: [['stepBlock', 'Step block'], ['slottedBlock', 'Slotted block'], ['chamferBlock', 'Chamfer block'], ['holeBlock', 'Block with a hole']],
      widget: 'select',
      default: 'stepBlock',
      ...only('orthographic'),
    },
    projection: { type: 'enum', label: 'Projection method', options: [['third', 'Third angle'], ['first', 'First angle']], default: 'third', ...only('orthographic') },
    showHidden: { type: 'boolean', label: 'Show hidden lines', default: true, ...only('orthographic') },
    showDimensions: { type: 'boolean', label: 'Show dimensions', default: true, ...only('orthographic') },
    challenge: { type: 'boolean', label: 'Challenge mode', default: false, help: 'Hides the views. Sketch them, then click a view (or turn this off) to check.', ...only('orthographic') },

    // descriptive
    feature: { type: 'enum', label: 'Find', options: [['line', 'True length of a line'], ['face', 'True shape of a sloping face']], default: 'line', ...only('descriptive') },
    pointA: { ...MM3, label: 'Point A (x, y, z)', default: [10, 10, 10], visibleWhen: { feature: 'line' }, ...only('descriptive') },
    pointB: { ...MM3, label: 'Point B (x, y, z)', default: [70, 30, 40], visibleWhen: { feature: 'line' }, ...only('descriptive') },
    chamferRun: { type: 'number', label: 'Chamfer run (x)', unit: 'mm', min: 5, max: 55, step: 1, default: 30, visibleWhen: { feature: 'face' }, ...only('descriptive') },
    chamferDrop: { type: 'number', label: 'Chamfer drop (z)', unit: 'mm', min: 5, max: 35, step: 1, default: 20, visibleWhen: { feature: 'face' }, ...only('descriptive') },

    // shared
    showProjectors: { type: 'boolean', label: 'Show projectors', default: true, ...only('orthographic', 'descriptive') },
    showLabels: { type: 'boolean', label: 'Labels', default: true },
    camera: { type: 'enum', label: 'Camera', options: [['perspective', 'Perspective'], ['orthographic', 'Orthographic']], default: 'perspective', help: 'Orthographic keeps parallel lines parallel.' },
    viewFrom: {
      type: 'enum',
      label: 'View from',
      options: [['iso', '3D'], ['top', 'Top'], ['front', 'Front'], ['side', 'Side']],
      widget: 'segmented',
      default: 'iso',
      help: 'Snaps the camera; drag the stage to turn it.',
    },
  },
  outputs: {
    // revolution
    volume: { label: 'Volume (integral)', unit: 'units³', sigfigs: 5, setups: ['revolution'] },
    volumeOverPi: { label: 'Volume ÷ π', unit: '', sigfigs: 5, setups: ['revolution'] },
    discSum: { label: 'Sum of disc volumes', unit: 'units³', sigfigs: 5, setups: ['revolution'] },
    discError: { label: 'Disc sum − volume', unit: 'units³', sigfigs: 3, setups: ['revolution'] },
    discWidth: { label: 'Disc thickness Δ', unit: 'units', sigfigs: 3, setups: ['revolution'] },
    // trig3d
    elevA: { label: 'Elevation of T from A', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    elevB: { label: 'Elevation of T from B', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    baseAngle: { label: 'Angle AOB at the base', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    distAB: { label: 'Distance AB', unit: 'm', sigfigs: 4, setups: ['trig3d'] },
    bearingAtoB: { label: 'Bearing of B from A', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    faceDiagonal: { label: 'Base diagonal', unit: 'm', sigfigs: 4, setups: ['trig3d'] },
    spaceDiagonal: { label: 'Space diagonal', unit: 'm', sigfigs: 4, setups: ['trig3d'] },
    diagonalAngle: { label: 'Space diagonal to base', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    slopeAngle: { label: 'Slope of the ramp', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    slantHeight: { label: 'Slant height', unit: 'm', sigfigs: 4, setups: ['trig3d'] },
    faceAngle: { label: 'Face to base', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    slantEdge: { label: 'Slant edge', unit: 'm', sigfigs: 4, setups: ['trig3d'] },
    edgeAngle: { label: 'Slant edge to base', unit: '°', sigfigs: 4, setups: ['trig3d'] },
    // vectors
    magA: { label: '|a|', unit: '', sigfigs: 4, setups: ['vectors'] },
    magB: { label: '|b|', unit: '', sigfigs: 4, setups: ['vectors'] },
    dot: { label: 'a · b', unit: '', sigfigs: 4, setups: ['vectors'] },
    // vectors: the angle between a and b (0° to 180°); lines-spheres: the acute angle between the lines
    angle: { label: 'Angle θ', unit: '°', sigfigs: 4, setups: ['vectors', 'lines-spheres'] },
    scalarProjection: { label: 'Scalar projection of a on b', unit: '', sigfigs: 4, setups: ['vectors'] },
    resultX: { label: 'Result: x', unit: '', sigfigs: 4, setups: ['vectors'] },
    resultY: { label: 'Result: y', unit: '', sigfigs: 4, setups: ['vectors'] },
    resultZ: { label: 'Result: z', unit: '', sigfigs: 4, setups: ['vectors'] },
    resultMag: { label: 'Result: magnitude', unit: '', sigfigs: 4, setups: ['vectors'] },
    // lines-spheres
    relation: { label: 'Relation (0 meet, 1 parallel, 2 same line, 3 skew)', unit: '', integer: true, setups: ['lines-spheres'] },
    distance: { label: 'Shortest distance between the lines', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    ix: { label: 'Intersection x', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    iy: { label: 'Intersection y', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    iz: { label: 'Intersection z', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    lambdaI: { label: 'λ at the intersection', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    muI: { label: 'μ at the intersection', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    px: { label: 'P x', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    py: { label: 'P y', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    pz: { label: 'P z', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    discriminant: { label: 'Discriminant Δ', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    hits: { label: 'Points where the line meets the sphere', unit: '', integer: true, setups: ['lines-spheres'] },
    lambda1: { label: 'First λ on the sphere', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    lambda2: { label: 'Second λ on the sphere', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    chord: { label: 'Chord length', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    centreDistance: { label: 'Distance from c to the line', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    pCentreDistance: { label: '|P − c|', unit: '', sigfigs: 3, setups: ['lines-spheres'] },
    // orthographic
    width: { label: 'Overall width (x)', unit: 'mm', sigfigs: 3, setups: ['orthographic'] },
    depth: { label: 'Overall depth (y)', unit: 'mm', sigfigs: 3, setups: ['orthographic'] },
    height: { label: 'Overall height (z)', unit: 'mm', sigfigs: 3, setups: ['orthographic'] },
    partVolume: { label: 'Volume of the part', unit: 'mm³', sigfigs: 5, setups: ['orthographic'] },
    frontArea: { label: 'Area covered by the front view', unit: 'mm²', sigfigs: 5, setups: ['orthographic'] },
    topArea: { label: 'Area covered by the top view', unit: 'mm²', sigfigs: 5, setups: ['orthographic'] },
    sideArea: { label: 'Area covered by the right view', unit: 'mm²', sigfigs: 5, setups: ['orthographic'] },
    topViewPlacement: { label: 'Top view (+1 above the front view, −1 below)', unit: '', integer: true, setups: ['orthographic'] },
    sideViewPlacement: { label: 'Right view (+1 right of the front view, −1 left)', unit: '', integer: true, setups: ['orthographic'] },
    // descriptive
    trueLength: { label: 'True length (auxiliary view)', unit: 'mm', sigfigs: 4, setups: ['descriptive'] },
    planLength: { label: 'Length in the top view', unit: 'mm', sigfigs: 4, setups: ['descriptive'] },
    frontLength: { label: 'Length in the front view', unit: 'mm', sigfigs: 4, setups: ['descriptive'] },
    angleHP: { label: 'True angle to the horizontal plane', unit: '°', sigfigs: 4, setups: ['descriptive'] },
    angleVP: { label: 'True angle to the frontal plane', unit: '°', sigfigs: 4, setups: ['descriptive'] },
    trueArea: { label: 'True area of the face', unit: 'mm²', sigfigs: 4, setups: ['descriptive'] },
    planArea: { label: 'Area of the face in the top view', unit: 'mm²', sigfigs: 4, setups: ['descriptive'] },
  },
};

// ── model snapshots

function compute(setup, p) {
  switch (setup) {
    case 'revolution': {
      const s = M.revolutionScene(p);
      return { scene: s, outputs: M.revolutionOutputs(s) };
    }
    case 'trig3d': {
      const s = M.trig3dScene(p);
      return { scene: s, outputs: M.trig3dOutputs(s) };
    }
    case 'vectors': {
      const s = M.vectorScene(p);
      return { scene: s, outputs: M.vectorOutputs(s) };
    }
    case 'lines-spheres': {
      const s = M.linesScene(p);
      return { scene: s, outputs: M.linesOutputs(s) };
    }
    case 'orthographic': {
      const s = M.orthographicScene(p);
      return { scene: s, outputs: M.orthographicOutputs(s) };
    }
    default: {
      const s = M.descriptiveScene(p);
      return { scene: s, outputs: M.descriptiveOutputs(s) };
    }
  }
}

// ── CSV

const round = (x) => (Number.isFinite(x) ? Number(x.toPrecision(12)) : '');

function dataFor(setup, scene, outputs) {
  if (setup === 'revolution') {
    const v = scene.axis === 'y' ? 'y' : 'x';
    if (scene.error && !scene.slices) return { columns: ['disc i', `${v} (units)`, 'radius (units)', 'disc volume (units³)'], rows: [] };
    return {
      columns: ['disc i', `sample ${v} (units)`, `slice from ${v}`, `slice to ${v}`, 'radius (units)', 'disc volume (units³)'],
      rows: scene.slices.map((d) => [d.i + 1, round(d.s), round(d.s0), round(d.s1), round(Math.abs(d.r)), round(d.volume)]),
    };
  }
  if (setup === 'lines-spheres') {
    const rows = [];
    for (let i = 0; i <= 40; i++) {
      const t = -10 + i * 0.5;
      const P = M.add(scene.a1, M.scale(scene.u, t));
      rows.push([t, round(P[0]), round(P[1]), round(P[2]), scene.mode === 'sphere' ? round(M.distance(P, scene.c)) : '']);
    }
    return { columns: ['λ', 'x', 'y', 'z', '|P − c|'], rows };
  }
  if (setup === 'orthographic') {
    const rows = [];
    for (const name of ['front', 'top', 'right']) {
      for (const l of scene.views[name].lines) rows.push([name, l.hidden ? 'hidden' : 'visible', round(l.a[0]), round(l.a[1]), round(l.b[0]), round(l.b[1])]);
      for (const c of scene.views[name].centres) rows.push([name, 'centre line', round(c.a[0]), round(c.a[1]), round(c.b[0]), round(c.b[1])]);
    }
    return { columns: ['view', 'line', 'u1 (mm)', 'v1 (mm)', 'u2 (mm)', 'v2 (mm)'], rows };
  }
  if (setup === 'vectors') {
    const rows = [['a', ...scene.a.map(round), round(scene.magA)], ['b', ...scene.b.map(round), round(scene.magB)]];
    if (scene.result) rows.push([{ add: 'a + b', subtract: 'a − b', scale: 'k a', project: 'projection of a on b' }[scene.operation], ...scene.result.map(round), round(M.length(scene.result))]);
    return { columns: ['vector', 'x', 'y', 'z', 'magnitude'], rows };
  }
  // trig3d and descriptive: the readouts as a table
  const rows = Object.entries(outputs)
    .filter(([, v]) => Number.isFinite(v))
    .map(([k, v]) => [meta.outputs[k].label, round(v), meta.outputs[k].unit]);
  return { columns: ['quantity', 'value', 'unit'], rows };
}

// ── descriptions for the stage's aria-label

const f3 = (x) => formatNumber(x, { sigfigs: 3 });
const vecText = (p) => `(${p.map(formatPlain).join(', ')})`;

function describe(setup, p, scene) {
  switch (setup) {
    case 'revolution': {
      const v = scene.axis === 'y' ? 'y' : 'x';
      if (scene.error) return `Solid of revolution: ${scene.error}`;
      return (
        `Solid formed by rotating ${v === 'x' ? 'y' : 'x'} = ${p.f} for ${v} from ${formatPlain(scene.lo)} to ${formatPlain(scene.hi)} about the ${v}-axis, ` +
        `${p.showDiscs ? `shown with ${scene.n} ${p.discRule} discs` : 'shown as a solid'}. Volume ${f3(scene.volume)} cubic units; disc sum ${f3(scene.discSum)}.`
      );
    }
    case 'trig3d': {
      const s = scene;
      if (s.scene === 'tower')
        return `Tower ${formatPlain(s.h)} metres high. A is ${formatPlain(s.distA)} metres from the base on a bearing of ${formatPlain(s.bearingA)} degrees; B is ${formatPlain(s.distB)} metres away on a bearing of ${formatPlain(s.bearingB)} degrees. Elevation from A ${f3(s.elevA)} degrees, from B ${f3(s.elevB)} degrees; AB is ${f3(s.distAB)} metres.`;
      if (s.scene === 'cuboid') return `Cuboid ${formatPlain(s.l)} by ${formatPlain(s.w)} by ${formatPlain(s.h)} metres. Base diagonal ${f3(s.faceDiagonal)} metres, space diagonal ${f3(s.spaceDiagonal)} metres at ${f3(s.diagonalAngle)} degrees to the base.`;
      if (s.scene === 'ramp') return `Ramp ${formatPlain(s.l)} metres long, ${formatPlain(s.w)} metres wide, rising ${formatPlain(s.h)} metres. Slope ${f3(s.slopeAngle)} degrees; the diagonal of the slope rises at ${f3(s.diagonalAngle)} degrees.`;
      return `Square pyramid with base side ${formatPlain(s.s)} metres and height ${formatPlain(s.h)} metres. Face to base ${f3(s.faceAngle)} degrees, slant edge to base ${f3(s.edgeAngle)} degrees.`;
    }
    case 'vectors': {
      const s = scene;
      const fmt = (a) => vecText(s.flat ? a.slice(0, 2) : a);
      return `Vectors a = ${fmt(s.a)} and b = ${fmt(s.b)} in ${s.flat ? 'two' : 'three'} dimensions. Dot product ${f3(s.dot)}; angle between them ${f3(s.angle)} degrees.`;
    }
    case 'lines-spheres': {
      const s = scene;
      if (s.mode === 'sphere') {
        const S = s.sphere;
        const where = S.hits === 2 ? `at 2 points, λ = ${f3(S.lambda1)} and λ = ${f3(S.lambda2)}` : S.hits === 1 ? `at 1 point (a tangent), λ = ${f3(S.lambda1)}` : 'nowhere';
        return `Line through ${vecText(s.a1)} with direction ${vecText(s.u)} and a sphere of radius ${formatPlain(s.R)} centred at ${vecText(s.c)}. The line meets the sphere ${where}.`;
      }
      const L = s.lines;
      const verdict = { intersecting: `The lines intersect at ${L.point ? vecText(L.point.map((x) => Number(x.toPrecision(6)))) : ''}.`, parallel: `The lines are parallel, ${f3(L.distance)} units apart.`, coincident: 'The two equations describe the same line.', skew: `The lines are skew, ${f3(L.distance)} units apart at their closest.`, invalid: 'A direction vector is zero, so it does not define a line.' }[L.kind];
      return `Two lines in 3D. Line 1 through ${vecText(s.a1)} with direction ${vecText(s.u)}; line 2 through ${vecText(s.a2)} with direction ${vecText(s.v)}. ${verdict}`;
    }
    case 'orthographic': {
      const s = scene;
      const where = s.method === 'first' ? 'first-angle projection: the top view below the front view and the right view to its left' : 'third-angle projection: the top view above the front view and the right view to its right';
      return `${s.part.label}, ${s.width} by ${s.depth} by ${s.height} millimetres, shown in ${where}.`;
    }
    default: {
      const s = scene;
      if (s.feature === 'face') return `A block with a sloping face. The auxiliary view shows the face in its true shape: ${f3(s.trueLength)} by ${PARTS_D()} millimetres, area ${f3(s.trueArea)} square millimetres.`;
      return `Line AB from ${vecText(s.A)} to ${vecText(s.B)} millimetres. The auxiliary view projected from the top view shows its true length, ${f3(s.trueLength)} millimetres, at ${f3(s.angleHP)} degrees to the horizontal plane.`;
    }
  }
}

const PARTS_D = () => formatPlain(M.PARTS.chamferBlock.D);

// ── engine

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`space3d: unknown setup "${setup}"`);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  let snap = compute(setup, params);
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage, {
    setup,
    onError: (err) => emit.error(err),
    // The stage's own camera button changes the camera param: tell the shell so the URL keeps up.
    onCamera: (camera) => {
      params = { ...params, camera };
      opts.onEvent?.('params');
    },
  });
  view.update(snap.scene, params, { snapView: true });
  emit.outputsNow(snap.outputs);

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      params = { ...params, ...next };
      snap = compute(setup, params);
      view.update(snap.scene, params, { snapView: partial && 'viewFrom' in partial });
      emit.outputsNow(snap.outputs);
    },
    getParams: () => ({ ...params, ...Object.fromEntries(Object.entries(params).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.slice()])) }),
    play() {},
    pause() {},
    isPlaying: () => false,
    step() {},
    reset() {
      view.update(snap.scene, params, {});
      emit.outputsNow(snap.outputs);
    },
    isComplete: () => true,
    getOutputs: () => ({ ...snap.outputs }),
    getData: () => dataFor(setup, snap.scene, snap.outputs),
    describe: () => describe(setup, params, snap.scene),
    setTheme() {
      view.setTheme();
    },
    resize() {
      view.resize();
    },
    destroy() {
      emit.destroy();
      view.destroy();
    },
  };
}
