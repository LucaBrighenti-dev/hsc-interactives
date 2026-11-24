// materials engine (guide §9.1): tensile test, materials selection chart, hardness testing, and
// fatigue with NDT methods. Physics in model.js (pure), drawing in view.js, data with sources in data.js.
// tensile and fatigue-ndt run in time (loop, timeScale); selection and hardness are static.
import {
  DT,
  MATERIALS,
  materialById,
  createTensileRun,
  curvePhase,
  selectionRows,
  strengthOf,
  specificStrength,
  tieMass,
  tieArea,
  brinellHardness,
  brinellCheck,
  brinellDepth,
  vickersHardness,
  vickersDepth,
  rockwellHardness,
  ROCKWELL_SCALES,
  KGF,
  createFatigueRun,
  crackStage,
  NDT_METHODS,
  NDT_FLAWS,
  NDT_MATERIALS,
  ndtResult,
} from './model.js';
import { createView } from './view.js';
import { createLoop, createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber } from '../../format.js';

const T = ['tensile'];
const S = ['selection'];
const H = ['hardness'];
const F = ['fatigue-ndt'];
const TIMED = ['tensile', 'fatigue-ndt'];

const materialOptions = MATERIALS.map((m) => [m.id, m.label]);

export const meta = {
  name: 'materials',
  version: '1.0.0',
  setups: ['tensile', 'selection', 'hardness', 'fatigue-ndt'],
  staticSetups: ['selection', 'hardness'],
  stepSize: 12, // 12 × 1/120 s = 0.1 s of test time per press of Step
  params: {
    // Tensile test
    material: {
      type: 'enum',
      label: 'Material',
      options: [...materialOptions, ['custom', 'Custom material']],
      default: 'structural-steel',
      widget: 'select',
      setups: T,
      help: 'Each material uses sourced values for E, yield or proof stress, UTS and elongation. The curve between them is a teaching model.',
    },
    customBehaviour: {
      type: 'enum',
      label: 'Behaviour',
      options: [
        ['ductile', 'Ductile'],
        ['brittle', 'Brittle'],
      ],
      default: 'ductile',
      setups: T,
      visibleWhen: { material: 'custom' },
    },
    customE: { type: 'number', label: "Young's modulus E", unit: 'GPa', min: 0.5, max: 400, step: 0.5, default: 200, setups: T, visibleWhen: { material: 'custom' } },
    customYield: {
      type: 'number',
      label: 'Yield (0.2% proof) stress',
      unit: 'MPa',
      min: 5,
      max: 2000,
      step: 5,
      default: 300,
      setups: T,
      visibleWhen: { material: 'custom', customBehaviour: 'ductile' },
      help: 'A yield stress above the UTS is treated as equal to the UTS.',
    },
    customUts: { type: 'number', label: 'Tensile strength (UTS)', unit: 'MPa', min: 5, max: 2500, step: 5, default: 450, setups: T, visibleWhen: { material: 'custom' } },
    customElongation: {
      type: 'number',
      label: 'Elongation after fracture',
      unit: '%',
      min: 1,
      max: 200,
      step: 0.5,
      default: 20,
      setups: T,
      visibleWhen: { material: 'custom', customBehaviour: 'ductile' },
    },
    section: {
      type: 'enum',
      label: 'Cross-section',
      options: [
        ['round', 'Round'],
        ['rect', 'Rectangular'],
      ],
      default: 'round',
      setups: T,
    },
    diameter: { type: 'number', label: 'Diameter d₀', unit: 'mm', min: 2, max: 20, step: 0.5, default: 10, setups: T, visibleWhen: { section: 'round' } },
    width: { type: 'number', label: 'Width b₀', unit: 'mm', min: 2, max: 40, step: 0.5, default: 12.5, setups: T, visibleWhen: { section: 'rect' } },
    thickness: { type: 'number', label: 'Thickness t₀', unit: 'mm', min: 0.5, max: 20, step: 0.5, default: 3, setups: T, visibleWhen: { section: 'rect' } },
    gaugeLength: { type: 'number', label: 'Gauge length L₀', unit: 'mm', min: 10, max: 200, step: 5, default: 50, setups: T },
    graph: {
      type: 'enum',
      label: 'Graph',
      options: [
        ['stress-strain', 'Stress–strain'],
        ['load-extension', 'Load–extension'],
      ],
      default: 'stress-strain',
      setups: T,
    },
    zoom: {
      type: 'enum',
      label: 'Graph range',
      options: [
        ['full', 'Whole test'],
        ['start', 'Elastic region'],
      ],
      default: 'full',
      setups: T,
      help: 'Elastic region zooms in on the start of the test to show the elastic slope and the 0.2% offset line.',
    },
    showArea: { type: 'boolean', label: 'Shade the area (toughness)', default: true, setups: T },
    // Selection chart
    strengthBasis: {
      type: 'enum',
      label: 'Strength plotted',
      options: [
        ['yield', 'Yield (0.2% proof)'],
        ['uts', 'Tensile strength (UTS)'],
      ],
      default: 'yield',
      setups: S,
      help: 'Brittle materials have no yield point, so their fracture strength is plotted either way (hollow markers).',
    },
    chartMaterial: { type: 'enum', label: 'Material A', options: materialOptions, default: 'titanium-6al-4v', widget: 'select', setups: S },
    compareMaterial: { type: 'enum', label: 'Material B', options: materialOptions, default: 'structural-steel', widget: 'select', setups: S },
    guidelines: { type: 'boolean', label: 'Constant σ/ρ guidelines', default: true, setups: S },
    tieLoad: { type: 'number', label: 'Tie load F', unit: 'kN', min: 1, max: 500, step: 1, default: 100, setups: S },
    tieLength: { type: 'number', label: 'Tie length L', unit: 'm', min: 0.1, max: 10, step: 0.1, default: 2, setups: S },
    factorOfSafety: { type: 'number', label: 'Factor of safety n', unit: '', min: 1, max: 5, step: 0.1, default: 1, setups: S },
    // Hardness
    method: {
      type: 'enum',
      label: 'Test',
      options: [
        ['brinell', 'Brinell'],
        ['vickers', 'Vickers'],
        ['rockwell', 'Rockwell'],
      ],
      default: 'brinell',
      setups: H,
    },
    brinellLoad: { type: 'number', label: 'Load F', unit: 'kgf', min: 1, max: 3000, step: 1, default: 3000, setups: H, visibleWhen: { method: 'brinell' } },
    ballDiameter: {
      type: 'enum',
      label: 'Ball diameter D',
      options: [
        ['10', '10 mm'],
        ['5', '5 mm'],
        ['2.5', '2.5 mm'],
        ['1', '1 mm'],
      ],
      default: '10',
      setups: H,
      visibleWhen: { method: 'brinell' },
    },
    indentDiameter: { type: 'number', label: 'Impression diameter d', unit: 'mm', min: 0.1, max: 7, step: 0.01, default: 4, setups: H, visibleWhen: { method: 'brinell' } },
    vickersLoad: { type: 'number', label: 'Load F', unit: 'kgf', min: 1, max: 100, step: 1, default: 30, setups: H, visibleWhen: { method: 'vickers' } },
    diagonal: { type: 'number', label: 'Mean diagonal d', unit: 'mm', min: 0.05, max: 1.5, step: 0.005, default: 0.5, setups: H, visibleWhen: { method: 'vickers' } },
    rockwellScale: {
      type: 'enum',
      label: 'Rockwell scale',
      options: [
        ['C', 'C: diamond cone'],
        ['B', 'B: ball'],
      ],
      default: 'C',
      setups: H,
      visibleWhen: { method: 'rockwell' },
    },
    depth: {
      type: 'number',
      label: 'Permanent depth increase h',
      unit: 'mm',
      min: 0,
      max: 0.26,
      step: 0.002,
      default: 0.128,
      setups: H,
      visibleWhen: { method: 'rockwell' },
      help: 'Measured under the minor load, after the major load is removed.',
    },
    // Fatigue and NDT
    fatigueView: {
      type: 'enum',
      label: 'Show',
      options: [
        ['fatigue', 'Fatigue and crack growth'],
        ['ndt', 'NDT methods'],
      ],
      default: 'fatigue',
      setups: F,
    },
    snCurves: {
      type: 'enum',
      label: 'S–N curves',
      options: [
        ['both', 'Both'],
        ['steel', 'Steel'],
        ['aluminium', 'Aluminium'],
      ],
      default: 'both',
      setups: F,
      visibleWhen: { fatigueView: 'fatigue' },
    },
    ndtMethod: { type: 'enum', label: 'Method', options: NDT_METHODS.map((m) => [m.id, m.name]), default: 'ultrasonic', widget: 'select', setups: F, visibleWhen: { fatigueView: 'ndt' } },
    flaw: { type: 'enum', label: 'Flaw', options: NDT_FLAWS.map((f) => [f.id, f.name]), default: 'surface-crack', widget: 'select', setups: F, visibleWhen: { fatigueView: 'ndt' } },
    ndtMaterial: { type: 'enum', label: 'Part material', options: NDT_MATERIALS.map((m) => [m.id, m.name]), default: 'aluminium', widget: 'select', setups: F, visibleWhen: { fatigueView: 'ndt' } },
    // Both timed setups
    runTime: {
      type: 'number',
      label: 'Run length (time-lapse)',
      unit: 's',
      min: 4,
      max: 30,
      step: 1,
      default: 10,
      setups: TIMED,
      help: 'Every run is sped up to take this long, from the start to fracture.',
    },
    timeScale: { type: 'number', label: 'Playback speed', unit: '×', min: 0.25, max: 2, step: 0.25, default: 1, setups: TIMED },
  },
  outputs: {
    // Tensile
    stress: { label: 'Stress σ', unit: 'MPa', sigfigs: 3, setups: T },
    strain: { label: 'Strain ε', unit: '%', sigfigs: 3, setups: T },
    load: { label: 'Load F', unit: 'kN', sigfigs: 3, setups: T },
    extension: { label: 'Extension δ', unit: 'mm', sigfigs: 3, setups: T },
    area: { label: 'Original area A₀', unit: 'mm²', sigfigs: 3, setups: T },
    modulus: { label: 'Modulus E (slope)', unit: 'GPa', sigfigs: 3, setups: T },
    yieldStrength: { label: 'Yield stress', unit: 'MPa', sigfigs: 3, setups: T },
    uts: { label: 'UTS', unit: 'MPa', sigfigs: 3, setups: T },
    maxLoad: { label: 'Maximum load', unit: 'kN', sigfigs: 3, setups: T },
    elongation: { label: 'Elongation A', unit: '%', sigfigs: 3, setups: T },
    fractureStrain: { label: 'Strain at fracture', unit: '%', sigfigs: 3, setups: T },
    toughness: { label: 'Toughness', unit: 'MJ/m³', sigfigs: 3, setups: T },
    t: { label: 'Time t', unit: 's', sigfigs: 3, setups: TIMED },
    // Selection
    strength: { label: 'Strength σ (A)', unit: 'MPa', sigfigs: 3, setups: S },
    density: { label: 'Density ρ (A)', unit: 'kg/m³', sigfigs: 3, setups: S },
    specificStrength: { label: 'σ/ρ (A)', unit: 'kN·m/kg', sigfigs: 3, setups: S },
    tieArea: { label: 'Tie area (A)', unit: 'mm²', sigfigs: 3, setups: S },
    tieMass: { label: 'Tie mass (A)', unit: 'kg', sigfigs: 3, setups: S },
    compareSpecificStrength: { label: 'σ/ρ (B)', unit: 'kN·m/kg', sigfigs: 3, setups: S },
    compareTieMass: { label: 'Tie mass (B)', unit: 'kg', sigfigs: 3, setups: S },
    massRatio: { label: 'Mass ratio A ÷ B', unit: '', sigfigs: 3, setups: S },
    // Hardness
    hb: { label: 'Brinell hardness', unit: 'HB', sigfigs: 4, setups: H },
    hv: { label: 'Vickers hardness', unit: 'HV', sigfigs: 4, setups: H },
    hr: { label: 'Rockwell hardness', unit: '', sigfigs: 3, setups: H },
    forceN: { label: 'Test force', unit: 'N', sigfigs: 4, setups: H },
    impressionDepth: { label: 'Impression depth', unit: 'mm', sigfigs: 3, setups: H },
    // Fatigue and NDT
    lifeUsed: { label: 'Fatigue life used', unit: '%', sigfigs: 3, setups: F },
    crackRatio: { label: 'Crack a ÷ critical length', unit: '', sigfigs: 3, setups: F },
    methodsThatFind: { label: 'Methods that find this flaw', unit: '', integer: true, setups: F },
  },
};

const OUTPUT_KEYS = Object.fromEntries(meta.setups.map((s) => [s, Object.entries(meta.outputs).filter(([, o]) => !o.setups || o.setups.includes(s)).map(([k]) => k)]));

// Params that change the tensile run itself (others only change the drawing).
const TENSILE_RUN_KEYS = ['material', 'customBehaviour', 'customE', 'customYield', 'customUts', 'customElongation', 'section', 'diameter', 'width', 'thickness', 'gaugeLength', 'runTime'];

/** Static results for the selection setup. */
function selectionSolution(p) {
  const rows = selectionRows(p.strengthBasis);
  const a = materialById(p.chartMaterial) ?? MATERIALS[0];
  const b = materialById(p.compareMaterial) ?? MATERIALS[0];
  const calc = (m) => {
    const { value, kind } = strengthOf(m, p.strengthBasis);
    const design = { load: p.tieLoad, length: p.tieLength, strength: value, density: m.density, factorOfSafety: p.factorOfSafety };
    return { material: m, strength: value, kind, density: m.density, specific: specificStrength(value, m.density), area: tieArea(design), mass: tieMass(design) };
  };
  const sel = calc(a);
  const cmp = calc(b);
  return { rows, sel, cmp, massRatio: sel.mass / cmp.mass };
}

/** Static results for the hardness setup. */
function hardnessSolution(p) {
  if (p.method === 'vickers') {
    return { method: 'vickers', F: p.vickersLoad, d: p.diagonal, value: vickersHardness(p.vickersLoad, p.diagonal), depth: vickersDepth(p.diagonal), forceN: p.vickersLoad * KGF };
  }
  if (p.method === 'rockwell') {
    const sc = ROCKWELL_SCALES[p.rockwellScale];
    return { method: 'rockwell', scale: p.rockwellScale, h: p.depth, value: rockwellHardness(p.rockwellScale, p.depth), depth: p.depth, forceN: sc.totalLoad * KGF };
  }
  const D = Number(p.ballDiameter);
  const d = Math.min(p.indentDiameter, D * 0.999);
  return { method: 'brinell', F: p.brinellLoad, D, d, value: brinellHardness(p.brinellLoad, D, d), depth: brinellDepth(D, d), check: brinellCheck(D, d), forceN: p.brinellLoad * KGF, clipped: d !== p.indentDiameter };
}

function ndtSolution(p) {
  const results = NDT_METHODS.map((m) => ({ method: m, ...ndtResult(m.id, p.flaw, p.ndtMaterial) }));
  return { results, count: results.filter((r) => r.level === 'yes').length, current: results.find((r) => r.method.id === p.ndtMethod) ?? results[0] };
}

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`materials: unknown setup "${setup}"`);
  const timed = TIMED.includes(setup);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage);

  let run = null; // tensile or fatigue run
  let solution = null; // static setups and NDT

  function build(keepSteps = 0) {
    if (setup === 'tensile') run = createTensileRun(params).advance(keepSteps);
    else if (setup === 'fatigue-ndt') {
      run = createFatigueRun({ runTime: params.runTime }).advance(keepSteps);
      solution = ndtSolution(params);
    } else if (setup === 'selection') solution = selectionSolution(params);
    else solution = hardnessSolution(params);
  }
  build();

  function outputs() {
    const out = {};
    let src = {};
    if (setup === 'tensile') src = run.outputs();
    else if (setup === 'fatigue-ndt') src = { ...run.outputs(), methodsThatFind: solution.count };
    else if (setup === 'selection') {
      const { sel, cmp, massRatio } = solution;
      src = {
        strength: sel.strength,
        density: sel.density,
        specificStrength: sel.specific,
        tieArea: sel.area,
        tieMass: sel.mass,
        compareSpecificStrength: cmp.specific,
        compareTieMass: cmp.mass,
        massRatio,
      };
    } else {
      const h = solution;
      src = {
        hb: h.method === 'brinell' ? h.value : null,
        hv: h.method === 'vickers' ? h.value : null,
        hr: h.method === 'rockwell' ? h.value : null,
        forceN: h.forceN,
        impressionDepth: h.depth,
      };
    }
    for (const key of OUTPUT_KEYS[setup]) out[key] = src[key] ?? null;
    return out;
  }

  const render = () => view.draw(setup, { run, solution, params });

  const loop = timed
    ? createLoop({
        dt: DT,
        step: () => {
          run.advance(1);
        },
        render,
        isComplete: () => run.isComplete(),
        getTimeScale: () => params.timeScale,
        onFrame: () => {
          emit.tick(run.n * DT);
          emit.outputs(outputs());
        },
        onComplete: () => {
          emit.outputsNow(outputs());
          emit.complete();
        },
        onError: (err) => emit.error(err),
      })
    : null;

  view.resize();
  render();
  emit.outputsNow(outputs());

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      const before = params;
      params = { ...params, ...next };
      if (setup === 'tensile') {
        if (TENSILE_RUN_KEYS.some((k) => params[k] !== before[k])) build(run.n);
      } else if (setup === 'fatigue-ndt') {
        if (params.runTime !== before.runTime) build(Math.round((run.n * before.runTime) / params.runTime));
        else solution = ndtSolution(params);
      } else build();
      render();
      emit.outputsNow(outputs());
    },
    getParams: () => ({ ...params }),
    play: () => (loop ? loop.play() : undefined),
    pause: () => loop?.pause(),
    isPlaying: () => (loop ? loop.isPlaying() : false),
    step(n = 1) {
      if (timed) {
        run.advance(n);
        render();
        emit.outputsNow(outputs());
        if (run.isComplete()) emit.complete();
      } else {
        render();
        emit.outputsNow(outputs());
      }
    },
    reset() {
      loop?.pause();
      build();
      render();
      emit.outputsNow(outputs());
    },
    isComplete: () => (timed ? run.isComplete() : true),
    getOutputs: () => outputs(),
    getData() {
      if (setup === 'tensile') return { columns: ['t (s)', 'Extension (mm)', 'Load (kN)', 'Strain (%)', 'Stress (MPa)'], rows: run.samples() };
      if (setup === 'selection') {
        return {
          columns: ['Material', 'Grade', 'Density (kg/m³)', `Strength (MPa)`, 'Strength measure', 'σ/ρ (kN·m/kg)', 'Values', 'Source'],
          rows: solution.rows.map((r) => [r.label, r.grade, r.density, r.strength, r.kind === 'fracture' ? 'fracture strength' : r.kind === 'uts' ? 'UTS' : '0.2% proof', r.specific, r.basis, r.source]),
        };
      }
      if (setup === 'hardness') {
        const h = solution;
        if (h.method === 'brinell') {
          const rows = [];
          for (let i = 0; i <= 36; i++) {
            const d = h.D * (0.24 + (0.36 * i) / 36);
            rows.push([Number(d.toFixed(6)), brinellHardness(h.F, h.D, d)]);
          }
          return { columns: [`d (mm), F = ${h.F} kgf, D = ${h.D} mm`, 'HB'], rows };
        }
        if (h.method === 'vickers') {
          const rows = [];
          for (let i = 1; i <= 30; i++) {
            const d = 0.05 * i;
            rows.push([Number(d.toFixed(6)), vickersHardness(h.F, d)]);
          }
          return { columns: [`d (mm), F = ${h.F} kgf`, 'HV'], rows };
        }
        const rows = [];
        for (let i = 0; i <= 26; i++) {
          const depth = 0.01 * i;
          rows.push([Number(depth.toFixed(6)), rockwellHardness(h.scale, depth)]);
        }
        return { columns: ['h (mm)', `HR${h.scale}`], rows };
      }
      if (params.fatigueView === 'ndt') {
        const flaw = NDT_FLAWS.find((f) => f.id === params.flaw)?.name;
        const mat = NDT_MATERIALS.find((m) => m.id === params.ndtMaterial)?.name;
        return {
          columns: ['Method', 'Flaw', 'Material', 'Finds it?', 'Why', 'What it finds', 'Suits'],
          rows: solution.results.map((r) => [r.method.name, flaw, mat, r.level, r.reason, r.method.finds, r.method.suits]),
        };
      }
      return { columns: ['Life used (%)', 'Crack length / critical length (schematic)'], rows: run.samples() };
    },
    describe() {
      if (setup === 'tensile') {
        const o = run.outputs();
        const m = run.material;
        const phase = curvePhase(run.curve, run.strain());
        return (
          `Tensile test of ${m.name}, ${m.grade}. ${phase === 'fractured' ? 'The specimen has fractured' : `The specimen is in the ${phase} stage`} ` +
          `at ${formatNumber(o.strain)} percent strain and ${formatNumber(o.stress)} megapascals. Stress–strain graph drawn as the machine pulls.`
        );
      }
      if (setup === 'selection') {
        const { sel, cmp } = solution;
        return (
          `Log–log chart of strength against density for ${solution.rows.length} materials, with lines of constant strength-to-weight ratio. ` +
          `${sel.material.label}: ${formatNumber(sel.specific)} kilonewton metres per kilogram; ${cmp.material.label}: ${formatNumber(cmp.specific)}.`
        );
      }
      if (setup === 'hardness') {
        const h = solution;
        const name = { brinell: 'Brinell', vickers: 'Vickers', rockwell: 'Rockwell' }[h.method];
        return `${name} hardness test: indenter, impression and formula. Result ${formatNumber(h.value, { sigfigs: 4 })}.`;
      }
      if (params.fatigueView === 'ndt') {
        const c = solution.current;
        return `Non-destructive testing: ${c.method.name} on a part with a ${params.flaw.replace('-', ' ')}. ${c.reason} Table comparing five methods.`;
      }
      const phi = run.life();
      return `Schematic fatigue crack growing from a hole: ${formatNumber(phi * 100)} percent of life used, stage: ${crackStage(phi)}. Schematic S–N curves for steel and aluminium.`;
    },
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
