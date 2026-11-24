// aero engine: flight forces with a simplified lift model, the standard atmosphere, and the
// pitot-static system (guide §9.1). Both setups are static: no time evolution, so play, pause and
// step are no-ops and isComplete() is always true (§5.1).
import { flightForces, pitotStatic, alphaSweep, speedSweep, isaTable } from './model.js';
import { createView } from './view.js';
import { createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber, formatInteger, siPrefix } from '../../format.js';

const FF = ['flight-forces'];
const PS = ['pitot-static'];

export const meta = {
  name: 'aero',
  version: '1.0.0',
  setups: ['flight-forces', 'pitot-static'],
  staticSetups: ['flight-forces', 'pitot-static'],
  params: {
    // Flight forces
    alphaMode: {
      type: 'enum',
      label: 'How α is set',
      options: [
        ['trim', 'Trimmed'],
        ['manual', 'Set by hand'],
      ],
      default: 'trim',
      setups: FF,
      help: 'Trimmed: the model finds the α that makes lift balance W cos γ. Set by hand: you choose α, as in a wind tunnel, and see whether lift balances.',
    },
    alpha: { type: 'number', label: 'Angle of attack α', unit: '°', min: -5, max: 25, step: 0.5, default: 4, setups: FF, visibleWhen: { alphaMode: 'manual' } },
    airspeed: { type: 'number', label: 'Airspeed V', unit: 'm/s', min: 5, max: 100, step: 0.5, default: 40, help: 'True airspeed.' },
    gamma: { type: 'number', label: 'Flight path angle γ', unit: '°', min: -15, max: 15, step: 0.5, default: 0, setups: FF, help: 'Positive climbs, negative descends, 0 is level flight.' },
    mass: { type: 'number', label: 'Mass m', unit: 'kg', min: 100, max: 5000, step: 10, default: 1000, setups: FF },
    wingArea: { type: 'number', label: 'Wing area S', unit: 'm²', min: 2, max: 60, step: 0.5, default: 16, setups: FF },
    altitude: { type: 'number', label: 'Altitude h', unit: 'm', min: 0, max: 11000, step: 100, default: 0, help: 'Sets the air density from the International Standard Atmosphere.' },
    cl0: { type: 'number', label: 'Lift coefficient at α = 0, CL0', unit: '', min: 0, max: 0.6, step: 0.01, default: 0.2, setups: FF, help: '0 for a symmetric aerofoil; positive for a cambered one.' },
    alphaStall: { type: 'number', label: 'Critical (stall) angle', unit: '°', min: 8, max: 20, step: 0.5, default: 15, setups: FF },
    cd0: { type: 'number', label: 'Zero-lift drag coefficient CD0', unit: '', min: 0.01, max: 0.1, step: 0.001, default: 0.03, setups: FF },
    k: { type: 'number', label: 'Induced drag factor k', unit: '', min: 0.01, max: 0.15, step: 0.001, default: 0.05, setups: FF, help: 'k = 1/(πeAR). An aspect ratio of 8 with e = 0.8 gives about 0.05.' },
    g: { type: 'number', label: 'Gravitational acceleration g', unit: 'm/s²', min: 9.7, max: 10, step: 0.01, default: 10, setups: FF, help: 'Engineering Studies uses g = 10 m/s².' },
    graph: {
      type: 'enum',
      label: 'Graph',
      options: [
        ['cl-alpha', 'Lift curve'],
        ['polar', 'Drag polar'],
        ['thrust-speed', 'Thrust needed'],
      ],
      default: 'cl-alpha',
      setups: FF,
    },
    showComponents: { type: 'boolean', label: 'Show weight components', default: true, setups: FF },
    zoomThrustDrag: { type: 'boolean', label: 'Draw thrust and drag 5× longer', default: false, setups: FF },
    // Pitot-static
    seaLevelPressure: { type: 'number', label: 'Sea-level pressure today', unit: 'hPa', min: 950, max: 1050, step: 0.25, default: 1013.25, setups: PS, help: 'The ISA standard is 1013.25 hPa.' },
    altimeterSetting: { type: 'number', label: 'Altimeter setting (QNH)', unit: 'hPa', min: 950, max: 1050, step: 0.25, default: 1013.25, setups: PS, help: 'Set it to the sea-level pressure and the altimeter reads true altitude.' },
  },
  outputs: {
    // Flight forces
    lift: { label: 'Lift L', unit: 'N', sigfigs: 3, siPrefix: true, setups: FF },
    drag: { label: 'Drag D', unit: 'N', sigfigs: 3, siPrefix: true, setups: FF },
    weight: { label: 'Weight W', unit: 'N', sigfigs: 3, siPrefix: true, setups: FF },
    thrust: { label: 'Thrust needed T', unit: 'N', sigfigs: 3, siPrefix: true, setups: FF },
    alpha: { label: 'Angle of attack α', unit: '°', sigfigs: 3, setups: FF },
    cl: { label: 'Lift coefficient CL', unit: '', sigfigs: 3, setups: FF },
    cd: { label: 'Drag coefficient CD', unit: '', sigfigs: 3, setups: FF },
    liftToDrag: { label: 'Lift-to-drag ratio L/D', unit: '', sigfigs: 3, setups: FF },
    stallSpeed: { label: 'Stall speed, level', unit: 'm/s', sigfigs: 3, setups: FF },
    // Best reachable L/D: 1/(2√(k·CD0)) unless that optimum lies past the stall, then the value at CLmax.
    maxLiftToDrag: { label: 'Best reachable L/D', unit: '', sigfigs: 3, setups: FF },
    clAtMaxLD: { label: 'CL at best L/D', unit: '', sigfigs: 3, setups: FF },
    minDragSpeed: { label: 'Speed for best L/D, level', unit: 'm/s', sigfigs: 3, setups: FF },
    minThrustSpeed: { label: 'Least-thrust speed', unit: 'm/s', sigfigs: 3, setups: FF },
    minThrust: { label: 'Least thrust', unit: 'N', sigfigs: 3, siPrefix: true, setups: FF },
    bestGlideAngle: { label: 'Best glide angle', unit: '°', sigfigs: 3, setups: FF },
    liftSurplus: { label: 'Unbalanced lift L − W cos γ', unit: 'N', sigfigs: 3, siPrefix: true, setups: FF },
    loadFactor: { label: 'Load factor n = L/W', unit: '', sigfigs: 3, setups: FF },
    dynamicPressure: { label: 'Dynamic pressure q', unit: 'Pa', sigfigs: 3, siPrefix: true, setups: FF },
    stalled: { label: 'Stalled (1 = yes)', unit: '', integer: true, setups: FF },
    // Both
    density: { label: 'Air density ρ', unit: 'kg/m³', sigfigs: 4 },
    temperature: { label: 'Air temperature T', unit: 'K', sigfigs: 5 },
    // Pitot-static
    staticPressure: { label: 'Static pressure ps', unit: 'Pa', sigfigs: 4, siPrefix: true, setups: PS },
    totalPressure: { label: 'Total pressure pt', unit: 'Pa', sigfigs: 4, siPrefix: true, setups: PS },
    pressureDifference: { label: 'Pressure difference Δp', unit: 'Pa', sigfigs: 3, siPrefix: true, setups: PS },
    trueAirspeed: { label: 'Airspeed √(2Δp/ρ)', unit: 'm/s', sigfigs: 3, setups: PS },
    indicatedAirspeed: { label: 'Indicated airspeed (ρ₀)', unit: 'm/s', sigfigs: 3, setups: PS },
    indicatedAltitude: { label: 'Altimeter reading', unit: 'm', integer: true, setups: PS },
    pressureAltitude: { label: 'Pressure altitude', unit: 'm', integer: true, setups: PS },
    altimeterError: { label: 'Altimeter error', unit: 'm', sigfigs: 3, setups: PS },
    mach: { label: 'Mach number', unit: '', sigfigs: 3, setups: PS },
  },
};

const OUTPUT_KEYS = Object.fromEntries(meta.setups.map((s) => [s, Object.entries(meta.outputs).filter(([, o]) => !o.setups || o.setups.includes(s)).map(([k]) => k)]));

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`aero: unknown setup "${setup}"`);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage);
  let solution = solve(params);

  function solve(p) {
    return setup === 'flight-forces' ? flightForces(p) : pitotStatic(p);
  }

  function outputs() {
    const out = {};
    for (const key of OUTPUT_KEYS[setup]) {
      const v = solution[key];
      out[key] = typeof v === 'boolean' ? (v ? 1 : 0) : v;
    }
    return out;
  }

  const render = () => view.draw(setup, solution, params);

  view.resize();
  render();
  emit.outputsNow(outputs());

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      const merged = { ...params, ...next };
      solution = solve(merged); // throws on an impossible combination, leaving the old state in place
      params = merged;
      render();
      emit.outputsNow(outputs());
    },
    getParams: () => ({ ...params }),
    // Static setups: nothing evolves in time.
    play() {},
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
    getData() {
      if (setup === 'pitot-static') {
        return {
          columns: ['h (m), standard-day ISA', 'T (K)', 'p (Pa)', 'ρ (kg/m³)', `Δp at ${params.airspeed} m/s (Pa)`, 'Indicated airspeed (m/s)'],
          rows: isaTable(params),
        };
      }
      if (params.graph === 'thrust-speed') {
        return { columns: ['V (m/s)', `T needed at γ = ${params.gamma}° (N)`, 'D (N)', 'Zero-lift drag (N)', 'Induced drag (N)'], rows: speedSweep(params, 1) };
      }
      return { columns: ['α (°)', 'CL', 'CD', 'L/D', `L at ${params.airspeed} m/s (N)`, `D at ${params.airspeed} m/s (N)`], rows: alphaSweep(params, 0.5) };
    },
    describe() {
      const s = solution;
      if (setup === 'pitot-static') {
        return (
          `Pitot-static probe at ${formatInteger(s.altitude)} metres and ${formatNumber(s.airspeed)} metres per second. ` +
          `Static pressure ${siPrefix(s.staticPressure, 'Pa', { sigfigs: 4 })}, total pressure ${siPrefix(s.totalPressure, 'Pa', { sigfigs: 4 })}, ` +
          `difference ${siPrefix(s.pressureDifference, 'Pa')}. Airspeed from the difference ${formatNumber(s.trueAirspeed)} metres per second; ` +
          `the altimeter reads ${formatInteger(s.indicatedAltitude)} metres.`
        );
      }
      const path = s.gamma > 0 ? `climbing at ${formatNumber(s.gamma)} degrees` : s.gamma < 0 ? `descending at ${formatNumber(-s.gamma)} degrees` : 'in level flight';
      const state = s.stalled ? 'The wing is stalled.' : s.nearStall ? 'The wing is close to the stall.' : 'The wing is not stalled.';
      return (
        `Aerofoil at ${formatNumber(s.alpha)} degrees angle of attack, ${path} at ${formatNumber(params.airspeed)} metres per second. ` +
        `Lift ${siPrefix(s.lift, 'N')}, weight ${siPrefix(s.weight, 'N')}, drag ${siPrefix(s.drag, 'N')}, thrust needed ${siPrefix(s.thrust, 'N')}. ` +
        `Lift-to-drag ratio ${formatNumber(s.liftToDrag)}. ${state}`
      );
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
      emit.destroy();
      view.destroy();
    },
  };
}
