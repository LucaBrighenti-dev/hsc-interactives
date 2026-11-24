// particle2d engine: point masses under gravity, drag, springs, E and B fields, central gravity, friction
// and collisions (guide §9.1). meta + create(stage, opts) with every method in guide §5.1.
import { DT, createState, advance, isComplete, outputs, dataColumns, dataRows, preview, PARTICLES } from './model.js';
import { createView } from './view.js';
import { createLoop, createEmitter } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatNumber, formatPlain } from '../../format.js';

const ALL = ['projectile', 'braking', 'orbit-gps', 'resisted-1d', 'shm', 'charged', 'circular', 'collisions', 'cart', 'orbit', 'relative-velocity', 'track'];
const P = (label, unit, min, max, step, dflt, setups, extra = {}) => ({ type: 'number', label, unit, min, max, step, default: dflt, setups, ...extra });
const E = (label, options, dflt, setups, extra = {}) => ({ type: 'enum', label, options, default: dflt, setups, ...extra });
const B = (label, dflt, setups, extra = {}) => ({ type: 'boolean', label, default: dflt, setups, ...extra });
const O = (label, unit, setups, extra = {}) => ({ label, unit, sigfigs: 3, setups, ...extra });

// visibleWhen on a shared key lists `undefined` among the wanted values, so the control stays visible in
// setups that do not have the governing param (e.g. `mass` hides on the projectile page when there is no
// drag, but always shows for SHM and the track). isVisible compares params[key] with each listed value.
const ON_DRAG = ['linear', 'quadratic', undefined];

export const meta = {
  name: 'particle2d',
  version: '1.1.0',
  setups: ALL,
  staticSetups: [],
  stepSize: 24, // 24 × 1/240 s = 0.1 s of animation per press of Step
  params: {
    // projectile
    speed: P('Launch speed v', 'm/s', 0, 60, 0.5, 20, ['projectile']),
    angle: P('Launch angle θ', '°', -90, 90, 1, 45, ['projectile'], { help: 'Measured from the horizontal; negative launches downward.' }),
    height: P('Launch height', 'm', 0, 100, 0.5, 0, ['projectile']),
    g: P('Gravitational field g', 'm/s²', 1, 25, 0.1, 9.8, ['projectile', 'braking', 'resisted-1d', 'circular', 'track'], {
      visibleWhen: { direction: ['vertical', undefined], circularMode: ['track', undefined] },
    }),
    drag: E('Resistance', [['none', 'None'], ['linear', 'kv'], ['quadratic', 'kv²']], 'none', ['projectile', 'resisted-1d']),
    k: P('Resistance coefficient k', '', 0, 2, 0.001, 0.1, ['projectile', 'resisted-1d'], {
      visibleWhen: { drag: ['linear', 'quadratic'] },
      help: 'Resistance force kv (k in kg/s) or kv² (k in kg/m), always against the motion.',
    }),
    mass: P('Mass m', 'kg', 0.1, 10, 0.1, 1, ['projectile', 'resisted-1d', 'shm', 'circular', 'track'], {
      visibleWhen: { drag: ON_DRAG, circularMode: ['string', undefined], shmForm: ['spring', undefined] },
    }),
    showVelocity: B('Velocity vector', true, ['projectile']),
    showComponents: B('Velocity components', false, ['projectile']),
    showNoDrag: B('Compare with no resistance', true, ['projectile', 'resisted-1d'], { visibleWhen: { drag: ['linear', 'quadratic'] } }),
    trail: B('Show trail', true, ['projectile', 'charged', 'circular', 'collisions', 'orbit', 'relative-velocity']),

    // braking
    approachSpeed: P('Speed before the hazard v₀', 'm/s', 0, 60, 0.5, 20, ['braking'], { help: '20 m/s = 72 km/h.' }),
    reactionTime: P('Reaction time', 's', 0, 3, 0.1, 1, ['braking']),
    mu: P('Tyre–road friction μ', '', 0.1, 1.2, 0.01, 0.7, ['braking', 'circular'], { visibleWhen: { circularMode: ['track', undefined] } }),
    carMass: P('Car mass', 'kg', 500, 3000, 50, 1500, ['braking', 'circular'], { visibleWhen: { circularMode: ['track', undefined] } }),
    rotorMass: P('Brake rotor mass (all)', 'kg', 2, 60, 1, 30, ['braking']),
    rotorHeat: P('Rotor specific heat c', 'J/(kg·K)', 100, 1000, 1, 449, ['braking'], { help: 'Default: iron at 25 °C, 449 J/(kg·K) (CRC Handbook of Chemistry and Physics).' }),

    // resisted motion and SHM
    direction: E('Motion', [['vertical', 'Vertical'], ['horizontal', 'Horizontal']], 'vertical', ['resisted-1d']),
    v0: P('Initial velocity v₀', 'm/s', -60, 60, 0.1, 0, ['resisted-1d', 'shm'], {
      visibleWhen: { shmForm: ['maths', undefined] },
      help: 'Up (vertical motion) or to the right is positive.',
    }),
    shmForm: E('Describe the motion by', [['spring', 'Mass on a spring'], ['maths', 'n, c, x₀ and v₀']], 'spring', ['shm']),
    amplitude: P('Amplitude a', 'm', 0.1, 5, 0.1, 1, ['shm'], { visibleWhen: { shmForm: 'spring' } }),
    springK: P('Spring constant k', 'N/m', 0.5, 50, 0.5, 4, ['shm'], { visibleWhen: { shmForm: 'spring' } }),
    phase: P('Phase α', '°', -180, 180, 5, 0, ['shm'], { visibleWhen: { shmForm: 'spring' }, help: 'x = a cos(nt + α)' }),
    n: P('Angular frequency n', 'rad/s', 0.5, 5, 0.1, 2, ['shm'], { visibleWhen: { shmForm: 'maths' }, help: 'ẍ = −n²(x − c); period 2π/n.' }),
    centre: P('Centre of motion c', 'm', -3, 3, 0.1, 0, ['shm'], { visibleWhen: { shmForm: 'maths' } }),
    graph: E('Graph', [['xt', 'x–t'], ['vt', 'v–t'], ['at', 'a–t'], ['vx', 'v against x'], ['v2x', 'v² against x']], 'xt', ['resisted-1d', 'shm'], { widget: 'select' }),
    showCircle: B('Reference circle', true, ['shm']),
    showArrows: B('Velocity and acceleration arrows', true, ['shm']),
    showForces: B('Force arrows', true, ['resisted-1d']),

    // charged particles
    particle: E('Particle', [['electron', 'Electron'], ['proton', 'Proton'], ['alpha', 'Alpha']], 'electron', ['charged']),
    field: E('Field', [['electric', 'Electric'], ['magnetic', 'Magnetic'], ['selector', 'Crossed E and B']], 'electric', ['charged']),
    entrySpeed: P('Entry speed', '× 10⁶ m/s', 0.1, 30, 0.1, 20, ['charged']),
    voltage: P('Top plate voltage V', 'V', -2000, 2000, 10, 200, ['charged'], { visibleWhen: { field: ['electric', 'selector'] }, help: 'The bottom plate is at 0 V.' }),
    plateGap: P('Plate separation d', 'cm', 1, 10, 0.5, 4, ['charged'], { visibleWhen: { field: ['electric', 'selector'] } }),
    plateLength: P('Field length L', 'cm', 2, 30, 1, 10, ['charged']),
    bField: P('Magnetic field B', 'mT', 0, 500, 0.05, 2, ['charged'], { visibleWhen: { field: ['magnetic', 'selector'] } }),
    bDirection: E('B direction', [['into', 'Into page'], ['out', 'Out of page']], 'into', ['charged'], { visibleWhen: { field: ['magnetic', 'selector'] } }),

    // circular motion
    circularMode: E('Situation', [['track', 'Car on a curve'], ['string', 'Mass on a string'], ['torque', 'Torque']], 'track', ['circular']),
    radius: P('Radius r', 'm', 0.5, 200, 0.5, 50, ['circular'], { visibleWhen: { circularMode: ['track', 'string'] } }),
    circleSpeed: P('Speed v', 'm/s', 0, 60, 0.5, 20, ['circular'], { visibleWhen: { circularMode: ['track', 'string'] } }),
    bankAngle: P('Bank angle θ', '°', 0, 45, 1, 15, ['circular'], { visibleWhen: { circularMode: 'track' } }),
    releaseAfter: P('Cut the string after', 's', 0, 20, 0.5, 0, ['circular'], { visibleWhen: { circularMode: 'string' }, help: '0 keeps the string attached.' }),
    force: P('Force F', 'N', 0, 500, 5, 100, ['circular'], { visibleWhen: { circularMode: 'torque' } }),
    leverArm: P('Distance from pivot r', 'm', 0.05, 2, 0.05, 0.3, ['circular'], { visibleWhen: { circularMode: 'torque' } }),
    forceAngle: P('Angle between r and F', '°', 0, 180, 5, 90, ['circular'], { visibleWhen: { circularMode: 'torque' } }),
    showVectors: B('Force and velocity vectors', true, ['circular', 'orbit'], { visibleWhen: { circularMode: ['track', 'string', undefined] } }),

    // collisions
    dimension: E('Collision', [['1d', '1D'], ['2d', '2D']], '1d', ['collisions']),
    m1: P('Mass of A', 'kg', 0.1, 10, 0.1, 1, ['collisions']),
    m2: P('Mass of B', 'kg', 0.1, 10, 0.1, 1, ['collisions']),
    u1: P('Initial velocity of A', 'm/s', -5, 5, 0.1, 2, ['collisions']),
    u2: P('Initial velocity of B', 'm/s', -5, 5, 0.1, 0, ['collisions']),
    restitution: P('Coefficient of restitution e', '', 0, 1, 0.05, 1, ['collisions'], { help: 'e = 1 is perfectly elastic; e = 0 means no bounce along the line of centres (in 1D the pucks move together).' }),
    offset: P('Offset b', 'm', -0.6, 0.6, 0.05, 0.2, ['collisions'], { visibleWhen: { dimension: '2d' }, help: 'Sideways distance between the centres. The pucks miss when it is 0.5 m or more.' }),
    showBars: B('Momentum and energy bars', true, ['collisions']),

    // cart (x0 is shared with the SHM maths form)
    cartMode: E('Mode', [['uniform', 'Constant a'], ['drive', 'Drive'], ['match', 'Match a graph']], 'uniform', ['cart']),
    x0: P('Starting position x₀', 'm', -10, 10, 0.1, 0, ['cart', 'shm'], { visibleWhen: { cartMode: ['uniform', 'drive', undefined], shmForm: ['maths', undefined] } }),
    u: P('Initial velocity u', 'm/s', -5, 5, 0.1, 0, ['cart'], { visibleWhen: { cartMode: ['uniform', 'drive'] } }),
    accel: P('Acceleration a', 'm/s²', -2, 2, 0.1, 0.5, ['cart'], { visibleWhen: { cartMode: 'uniform' } }),
    challenge: E('Target graph', [['steady', 'Steady walk'], ['speed-up', 'Speeding up'], ['turn-back', 'Turn back'], ['stop-start', 'Stop and start']], 'turn-back', ['cart'], { visibleWhen: { cartMode: 'match' }, widget: 'select' }),

    // orbits
    altitude: P('Satellite altitude', 'km', 100, 40000, 10, 400, ['orbit', 'orbit-gps']),
    orbitSpeed: P('Launch speed', 'km/s', 0, 15, 0.01, 7.67, ['orbit']),
    launchAngle: P('Launch angle above horizontal', '°', -60, 60, 1, 0, ['orbit']),
    satMass: P('Satellite mass', 'kg', 1, 10000, 1, 1000, ['orbit']),
    showAreas: B("Equal areas (Kepler's second law)", false, ['orbit']),
    gpsView: E('View', [['orbits', 'Orbits'], ['gps', 'GPS fix']], 'orbits', ['orbit-gps']),
    receiverAngle: P('Receiver position', '°', -180, 180, 1, 30, ['orbit-gps'], { help: 'Angle around the equator at t = 0. The receiver turns with Earth.' }),
    clockError: P('Receiver clock error', 'ns', -1000, 1000, 1, 0, ['orbit-gps']),

    // relative velocity
    scenario: E('Scenario', [['boat', 'Boat and river'], ['plane', 'Plane and wind']], 'boat', ['relative-velocity']),
    boatSpeed: P('Boat speed (in still water)', 'm/s', 0.5, 10, 0.1, 3, ['relative-velocity'], { visibleWhen: { scenario: 'boat' } }),
    heading: P('Heading', '°', -80, 80, 1, 0, ['relative-velocity'], { visibleWhen: { scenario: 'boat' }, help: '0° points straight across; positive points upstream.' }),
    current: P('River current', 'm/s', 0, 8, 0.1, 1.5, ['relative-velocity'], { visibleWhen: { scenario: 'boat' } }),
    riverWidth: P('River width', 'm', 10, 500, 5, 100, ['relative-velocity'], { visibleWhen: { scenario: 'boat' } }),
    airspeed: P('Airspeed', 'km/h', 50, 1000, 5, 300, ['relative-velocity'], { visibleWhen: { scenario: 'plane' } }),
    bearing: P('Heading (bearing)', '°', 0, 359, 1, 0, ['relative-velocity'], { visibleWhen: { scenario: 'plane' } }),
    windSpeed: P('Wind speed', 'km/h', 0, 200, 1, 60, ['relative-velocity'], { visibleWhen: { scenario: 'plane' } }),
    windBearing: P('Wind blows toward (bearing)', '°', 0, 359, 1, 90, ['relative-velocity'], { visibleWhen: { scenario: 'plane' } }),
    flightTime: P('Flight time', 'h', 0.25, 5, 0.25, 1, ['relative-velocity'], { visibleWhen: { scenario: 'plane' } }),
    showTriangle: B('Vector triangle', true, ['relative-velocity']),

    // roller track
    shape: E('Track', [['valley', 'Valley'], ['hills', 'Two valleys'], ['ramp', 'Ramp and runway']], 'valley', ['track']),
    trackHeight: P('Start height', 'm', 1, 20, 0.5, 5, ['track']),
    friction: P('Friction coefficient μ', '', 0, 0.5, 0.01, 0.05, ['track']),
    startSpeed: P('Starting speed', 'm/s', 0, 15, 0.5, 0, ['track']),

    // shared
    duration: P('Run time', 's', 1, 60, 1, 10, ['resisted-1d', 'shm', 'circular', 'cart', 'track'], { visibleWhen: { circularMode: ['track', 'string', undefined] } }),
    timeScale: P('Playback speed', '×', 0.25, 2, 0.25, 1, ALL),
  },
  outputs: {
    // projectile
    range: O('Range', 'm', ['projectile']),
    maxHeight: O('Maximum height', 'm', ['projectile', 'resisted-1d']),
    flightTime: O('Time of flight', 's', ['projectile']),
    timeToApex: O('Time to top', 's', ['projectile']),
    impactSpeed: O('Impact speed', 'm/s', ['projectile']),
    impactAngle: O('Impact angle below horizontal', '°', ['projectile']),
    x: O('Position x', 'm', ['projectile', 'braking', 'resisted-1d', 'shm', 'charged', 'circular', 'cart', 'relative-velocity', 'track']),
    y: O('Position y', 'm', ['projectile', 'charged', 'circular', 'relative-velocity']),
    vx: O('Velocity vx', 'm/s', ['projectile', 'charged']),
    vy: O('Velocity vy', 'm/s', ['projectile', 'charged']),
    speed: O('Speed', 'm/s', ['projectile', 'charged', 'circular', 'orbit']),
    v: O('Velocity v', 'm/s', ['braking', 'resisted-1d', 'shm', 'cart', 'track']),
    a: O('Acceleration a', 'm/s²', ['braking', 'cart']),
    acc: O('Acceleration ẍ', 'm/s²', ['resisted-1d', 'shm']),
    t: O('Time t', 's', ALL),
    // braking
    reactionDistance: O('Reaction distance', 'm', ['braking']),
    brakingDistance: O('Braking distance', 'm', ['braking']),
    stoppingDistance: O('Stopping distance', 'm', ['braking']),
    stoppingTime: O('Stopping time', 's', ['braking']),
    deceleration: O('Deceleration', 'm/s²', ['braking']),
    brakingForce: O('Friction force', 'N', ['braking'], { siPrefix: true }),
    kineticEnergy: O('Kinetic energy', 'J', ['braking', 'orbit', 'track'], { siPrefix: true }),
    frictionWork: O('Work done against friction', 'J', ['braking', 'track'], { siPrefix: true }),
    rotorTempRise: O('Rotor temperature rise', 'K', ['braking']),
    // resisted motion
    terminalSpeed: O('Terminal speed', 'm/s', ['resisted-1d']),
    timeToTop: O('Time to greatest height', 's', ['resisted-1d']),
    limitDistance: O('Limiting distance mv₀/k', 'm', ['resisted-1d']),
    // SHM
    period: O('Period T', 's', ['shm', 'circular', 'orbit']),
    measuredPeriod: O('Measured period', 's', ['shm']),
    omega: O('Angular frequency', 'rad/s', ['shm', 'circular']),
    frequency: O('Frequency f', 'Hz', ['shm']),
    amplitude: O('Amplitude a', 'm', ['shm']),
    alpha: O('Phase α', 'rad', ['shm']),
    maxSpeed: O('Greatest speed na', 'm/s', ['shm']),
    maxAcc: O('Greatest acceleration n²a', 'm/s²', ['shm']),
    energy: O('Total energy ½ka²', 'J', ['shm'], { siPrefix: true }),
    // charged
    fieldE: O('Electric field E', 'V/m', ['charged'], { siPrefix: true }),
    force: O('Force on the particle', 'N', ['charged']),
    acceleration: O('Acceleration', 'm/s²', ['charged']),
    radius: O('Radius r = mv/qB', 'm', ['charged'], { siPrefix: true }),
    cyclotronPeriod: O('Period 2πm/qB', 's', ['charged'], { siPrefix: true }),
    selectorSpeed: O('Selected speed E/B', 'm/s', ['charged']),
    deflection: O('Deflection at exit', 'm', ['charged'], { siPrefix: true }),
    exitAngle: O('Exit angle', '°', ['charged']),
    timeInField: O('Time in field', 's', ['charged'], { siPrefix: true }),
    exitSeparation: O('Entry to exit distance', 'm', ['charged'], { siPrefix: true }),
    kineticEnergyEv: O('Kinetic energy', 'eV', ['charged'], { siPrefix: true }),
    workDone: O('Work done by the field', 'J', ['charged']),
    workDoneEv: O('Work done by the field', 'eV', ['charged'], { siPrefix: true }),
    tNs: O('Time t', 'ns', ['charged']),
    // circular
    centripetalAccel: O('Centripetal acceleration', 'm/s²', ['circular']),
    centripetalForce: O('Centripetal force', 'N', ['circular'], { siPrefix: true }),
    designSpeed: O('Design speed √(rg tan θ)', 'm/s', ['circular']),
    normalForce: O('Normal force', 'N', ['circular', 'track'], { siPrefix: true }),
    frictionForce: O('Friction needed (down the slope +)', 'N', ['circular'], { siPrefix: true }),
    muRequired: O('Friction coefficient needed', '', ['circular']),
    maxCurveSpeed: O('Maximum speed before sliding', 'm/s', ['circular']),
    minCurveSpeed: O('Minimum speed before sliding', 'm/s', ['circular']),
    torque: O('Torque τ = rF sin θ', 'N·m', ['circular']),
    perpForce: O('Perpendicular force F sin θ', 'N', ['circular']),
    momentArm: O('Moment arm r sin θ', 'm', ['circular']),
    // collisions
    vA: O('Velocity of A', 'm/s', ['collisions']),
    vB: O('Velocity of B', 'm/s', ['collisions']),
    vAy: O('Velocity of A (y)', 'm/s', ['collisions']),
    vBy: O('Velocity of B (y)', 'm/s', ['collisions']),
    pTotal: O('Total momentum', 'kg·m/s', ['collisions']),
    pTotalY: O('Total momentum (y)', 'kg·m/s', ['collisions']),
    keTotal: O('Total kinetic energy', 'J', ['collisions'], { siPrefix: true }),
    keLost: O('Kinetic energy lost', 'J', ['collisions'], { siPrefix: true }),
    angleA: O('Direction of A', '°', ['collisions']),
    angleB: O('Direction of B', '°', ['collisions']),
    impulse: O('Impulse (magnitude)', 'N·s', ['collisions']),
    collisionTime: O('Collision at', 's', ['collisions']),
    // cart
    displacement: O('Displacement', 'm', ['cart']),
    distance: O('Distance travelled', 'm', ['cart', 'relative-velocity'], { siPrefix: true }),
    matchError: O('Match error (RMS)', 'm', ['cart']),
    targetX: O('Target position', 'm', ['cart']),
    // orbit
    r: O('Distance from Earth’s centre', 'm', ['orbit']),
    altitudeKm: O('Altitude', 'km', ['orbit']),
    tMinutes: O('Time', 'min', ['orbit']),
    periodMinutes: O('Period', 'min', ['orbit']),
    semiMajorAxis: O('Semi-major axis a', 'm', ['orbit']),
    eccentricity: O('Eccentricity e', '', ['orbit']),
    perigeeAltitude: O('Lowest altitude', 'm', ['orbit'], { siPrefix: true }),
    apogeeAltitude: O('Highest altitude', 'm', ['orbit'], { siPrefix: true }),
    circularSpeed: O('Circular orbit speed', 'm/s', ['orbit'], { siPrefix: true }),
    escapeSpeed: O('Escape speed', 'm/s', ['orbit'], { siPrefix: true }),
    potentialEnergy: O('Gravitational potential energy', 'J', ['orbit', 'track'], { siPrefix: true }),
    totalEnergy: O('Total energy', 'J', ['orbit', 'track'], { siPrefix: true }),
    arealVelocity: O('Area swept per second', 'm²/s', ['orbit']),
    sweptArea: O('Area swept', 'm²', ['orbit']),
    keplerRatio: O('T² / a³', 's²/m³', ['orbit']),
    // orbit-gps
    leoPeriod: O('Low orbit period', 's', ['orbit-gps']),
    leoPeriodMinutes: O('Low orbit period', 'min', ['orbit-gps']),
    leoSpeed: O('Low orbit speed', 'm/s', ['orbit-gps'], { siPrefix: true }),
    gpsPeriod: O('GPS period', 's', ['orbit-gps']),
    gpsPeriodHours: O('GPS period', 'h', ['orbit-gps']),
    gpsSpeed: O('GPS speed', 'm/s', ['orbit-gps'], { siPrefix: true }),
    gpsAltitude: O('GPS altitude', 'm', ['orbit-gps']),
    gpsAltitudeKm: O('GPS altitude', 'km', ['orbit-gps']),
    geoPeriod: O('Geostationary period', 's', ['orbit-gps']),
    geoPeriodHours: O('Geostationary period', 'h', ['orbit-gps']),
    geoSpeed: O('Geostationary speed', 'm/s', ['orbit-gps'], { siPrefix: true }),
    geoAltitude: O('Geostationary altitude', 'm', ['orbit-gps']),
    geoAltitudeKm: O('Geostationary altitude', 'km', ['orbit-gps']),
    rangeError: O('Range error c × Δt', 'm', ['orbit-gps']),
    positionError: O('Position error', 'm', ['orbit-gps']),
    signalTime: O('Signal travel time (highest satellite)', 's', ['orbit-gps'], { siPrefix: true }),
    tHours: O('Time', 'h', ['orbit-gps', 'relative-velocity']),
    // relative velocity
    groundSpeed: O('Speed over the ground', 'm/s', ['relative-velocity']),
    groundSpeedKmh: O('Speed over the ground', 'km/h', ['relative-velocity']),
    groundDirection: O('Direction over the ground (upstream +)', '°', ['relative-velocity']),
    trackBearing: O('Track over the ground (bearing)', '°', ['relative-velocity']),
    crossingTime: O('Crossing time', 's', ['relative-velocity']),
    drift: O('Distance downstream', 'm', ['relative-velocity']),
    headingForStraight: O('Heading to go straight across', '°', ['relative-velocity']),
    driftAngle: O('Drift angle', '°', ['relative-velocity']),
    // track
    height: O('Height', 'm', ['track']),
  },
};

/** Params that only change the drawing; any other change restarts the run from t = 0. */
const DISPLAY_KEYS = new Set(['timeScale', 'trail', 'showVelocity', 'showComponents', 'showNoDrag', 'graph', 'showCircle', 'showArrows', 'showForces', 'showVectors', 'showBars', 'showAreas', 'gpsView', 'showTriangle']);
/** Setups whose end can be computed ahead (the view uses the whole run to fit its axes). */
const PREVIEW = new Set(['projectile', 'braking', 'resisted-1d', 'shm', 'charged', 'collisions', 'orbit', 'relative-velocity', 'cart']);

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`particle2d: unknown setup "${setup}"`);

  let params = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, opts.params).params };
  let state;
  let ahead = null;
  const emit = createEmitter(opts.onEvent);
  const view = createView(stage, setup, {
    // The cart's throttle (drive and match modes) is live input, not a param.
    onThrottle(a) {
      if (!state || state.setup !== 'cart') return;
      state.throttle = Math.max(-2, Math.min(2, a));
      render();
      emit.outputsNow(outputs(state));
    },
    // The setup's drawing code arrives a moment after create(); draw the current state then.
    onReady: () => render(),
    onError: (err) => emit.error(err),
  });

  const restart = () => {
    state = createState(setup, params);
    const drives = setup === 'cart' && params.cartMode !== 'uniform';
    ahead = PREVIEW.has(setup) && !drives ? preview(setup, params) : null;
  };
  restart();

  const render = () => view.draw(state, params, ahead);
  const loop = createLoop({
    dt: DT,
    step: () => {
      advance(state, params, 1);
    },
    render,
    isComplete: () => isComplete(state),
    getTimeScale: () => params.timeScale,
    onFrame: () => {
      emit.tick(state.t);
      emit.outputs(outputs(state));
    },
    onComplete: () => {
      emit.outputsNow(outputs(state));
      emit.complete();
    },
    onError: (err) => emit.error(err),
  });

  // Keyboard driving for the cart: ← and → change the throttle by 0.5 m/s², only while the stage (or
  // nothing in particular) has focus, so sliders and segmented controls keep their own arrow keys.
  const onKey = (e) => {
    if (setup !== 'cart' || params.cartMode === 'uniform' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const t = e.target;
    if (t && t !== document.body && t !== document.documentElement && !stage.contains(t)) return;
    e.preventDefault();
    state.throttle = Math.max(-2, Math.min(2, (state.throttle || 0) + (e.key === 'ArrowRight' ? 0.5 : -0.5)));
    render();
    emit.outputsNow(outputs(state));
  };
  if (setup === 'cart' && typeof document !== 'undefined') document.addEventListener('keydown', onKey);

  view.resize();
  render();
  emit.outputsNow(outputs(state));

  return {
    setParams(partial) {
      const { params: next } = clampParams(meta.params, setup, partial);
      const physics = Object.keys(next).some((k) => !DISPLAY_KEYS.has(k) && next[k] !== params[k]);
      params = { ...params, ...next };
      // A new launch condition means a new run: back to t = 0 (playing carries on if it was playing).
      if (physics) restart();
      render();
      emit.outputsNow(outputs(state));
    },
    getParams: () => ({ ...params }),
    play: () => loop.play(),
    pause: () => loop.pause(),
    isPlaying: () => loop.isPlaying(),
    step(n = 1) {
      const was = isComplete(state);
      advance(state, params, n); // stops early at the end of the run
      render();
      emit.outputsNow(outputs(state));
      if (!was && isComplete(state)) emit.complete();
    },
    reset() {
      loop.pause();
      state = createState(setup, params);
      render();
      emit.outputsNow(outputs(state));
    },
    isComplete: () => isComplete(state),
    getOutputs: () => outputs(state),
    getData: () => ({ columns: dataColumns(setup), rows: dataRows(state) }),
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
      loop.destroy();
      emit.destroy();
      view.destroy();
      if (typeof document !== 'undefined') document.removeEventListener('keydown', onKey);
    },
  };
}

/** A sentence for the stage's aria-label. */
function describe(setup, p) {
  const n = (v) => formatPlain(v);
  switch (setup) {
    case 'projectile':
      return `A projectile launched at ${n(p.speed)} metres per second, ${n(Math.abs(p.angle))} degrees ${p.angle < 0 ? 'below' : 'above'} the horizontal, from ${n(p.height)} metres, with g = ${n(p.g)} metres per second squared and ${p.drag === 'none' ? 'no air resistance' : `${p.drag} air resistance`}.`;
    case 'braking':
      return `A ${n(p.carMass)} kilogram car braking from ${n(p.approachSpeed)} metres per second with friction coefficient ${n(p.mu)} after a ${n(p.reactionTime)} second reaction time, with a velocity–time graph and energy bars.`;
    case 'resisted-1d':
      return `${p.direction === 'vertical' ? 'Vertical' : 'Horizontal'} motion with ${p.drag === 'none' ? 'no resistance' : p.drag === 'linear' ? `resistance kv, k = ${n(p.k)}` : `resistance kv squared, k = ${n(p.k)}`}, mass ${n(p.mass)} kilograms, starting at ${n(p.v0)} metres per second, with velocity–time and displacement–time graphs.`;
    case 'shm':
      return p.shmForm === 'maths'
        ? `Simple harmonic motion with n = ${n(p.n)} radians per second about the centre ${n(p.centre)} metres, starting at x = ${n(p.x0)} metres with velocity ${n(p.v0)} metres per second, driven by a point on a rotating circle, with an x–t graph.`
        : `Simple harmonic motion of a mass on a spring with amplitude ${n(p.amplitude)} metres and period ${formatNumber(2 * Math.PI * Math.sqrt(p.mass / p.springK))} seconds, driven by a point on a rotating circle, with an x–t graph.`;
    case 'charged':
      return `${PARTICLES[p.particle]?.label ?? 'A particle'} entering ${p.field === 'electric' ? 'an electric field between parallel plates' : p.field === 'magnetic' ? 'a uniform magnetic field' : 'crossed electric and magnetic fields'} at ${n(p.entrySpeed)} million metres per second.`;
    case 'circular':
      if (p.circularMode === 'torque') return `A spanner with a ${n(p.force)} newton force applied ${n(p.leverArm)} metres from the pivot at ${n(p.forceAngle)} degrees.`;
      return p.circularMode === 'track'
        ? `A car at ${n(p.circleSpeed)} metres per second on a curve of radius ${n(p.radius)} metres banked at ${n(p.bankAngle)} degrees, seen from above and in cross-section with its forces.`
        : `A mass on a string moving in a horizontal circle of radius ${n(p.radius)} metres at ${n(p.circleSpeed)} metres per second.`;
    case 'collisions':
      return `A ${p.dimension === '2d' ? 'two-dimensional' : 'one-dimensional'} collision between a ${n(p.m1)} kilogram puck at ${n(p.u1)} metres per second and a ${n(p.m2)} kilogram puck at ${n(p.u2)} metres per second, coefficient of restitution ${n(p.restitution)}, with momentum and kinetic energy bars.`;
    case 'cart':
      return `A cart on a straight track with live position, velocity and acceleration graphs${p.cartMode === 'match' ? ' and a target position graph to match' : ''}.`;
    case 'orbit':
      return `A satellite launched at ${n(p.orbitSpeed)} kilometres per second from ${n(p.altitude)} kilometres above Earth.`;
    case 'orbit-gps':
      return p.gpsView === 'gps'
        ? 'GPS satellites in orbit and a receiver on Earth, with range circles from three satellites meeting at the receiver.'
        : `Low Earth, GPS and geostationary orbits drawn to scale around a rotating Earth; the low satellite is at ${n(p.altitude)} kilometres.`;
    case 'relative-velocity':
      return p.scenario === 'plane'
        ? `A plane with airspeed ${n(p.airspeed)} kilometres per hour heading ${n(p.bearing)} degrees in a ${n(p.windSpeed)} kilometre per hour wind.`
        : `A boat moving at ${n(p.boatSpeed)} metres per second relative to the water, heading ${n(p.heading)} degrees upstream of straight across, in a ${n(p.current)} metre per second current.`;
    case 'track':
      return `A cart on a roller track starting ${n(p.trackHeight)} metres high with friction coefficient ${n(p.friction)}, with stacked energy bars.`;
    default:
      return 'Particle simulation.';
  }
}
