---
id: phy-projectile-lab
title: "Projectile lab"
subject: phy
engine: particle2d
setup: projectile
priority: P0
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/projectile-lab.html
listings:            # catalogue listings that open this page with a preset; define these presets
  - {"id":"me1-projectile-vectors","preset":"me1-vectors","title":"Projectile motion with vectors"}
  - {"id":"me2-projectile-drag","preset":"me2-drag","title":"Projectile with air resistance"}
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 5: Advanced Mechanics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Advanced mechanics","year":12,"outcomes":[],"verified":false}
---
# Projectile lab

> Backlog summary: Launch angle and speed, max height, range, velocity components, optional air resistance.

## Learning goal
Students treat projectile motion as two independent motions, constant horizontal velocity and constant vertical acceleration g, and use the equations of uniformly accelerated motion to predict time of flight, maximum height and range, including launches from a height. They see why complementary angles give equal ranges on level ground and how air resistance shortens and skews the path.

Syllabus fit: 2017 Module 5 Advanced Mechanics (projectile motion); 2025 Year 12 focus area Advanced mechanics. The same page serves Mathematics Extension 1 (2024, Introduction to vectors: motion as a vector function of time, through the `me1-vectors` preset) and Mathematics Extension 2 (2024, Applications of calculus to mechanics: resisted motion, through the `me2-drag` preset).

## What the student sees
Default view at 1920×1080, projector theme:

- **Stage:** side view with ground at y = 0, labelled axes x (m) and y (m) with a grid, auto-scaled so the predicted no-drag path fills about 80% of the width (rescales on reset, never mid-flight). A launcher at (0, h) on a platform when h > 0, tilted to the launch angle with an arc labelled θ.
- **Projectile:** an orange disc with its path traced behind it (solid orange). Earlier paths stay as thin grey lines (up to five) when "Keep earlier paths" is on, each labelled with its angle, so 30° and 60° can be compared.
- **Vectors:** the velocity vector v as a thick orange arrow labelled `v = 18.4 m/s`; with components on, a blue horizontal arrow `vₓ = 14.1 m/s` and a green vertical arrow `v_y = 6.3 m/s`, drawn from the projectile with dashed construction lines (the vₓ arrow keeps the same length all flight).
- **Markers:** the highest point gets a small tick labelled `H = 10.2 m`; the landing point gets a tick labelled `R = 40.8 m`.
- **Drag mode:** the ideal no-drag parabola is drawn as a dashed grey curve for comparison when "Compare with no air resistance" is on.
- **Footer:** the assumptions list, including the current g.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| speed | Launch speed u | m/s | 0 | 60 | 0.5 | 20 | |
| angle | Launch angle θ | ° | 0 | 90 | 1 | 45 | above the horizontal |
| height | Launch height h | m | 0 | 50 | 0.5 | 0 | height of the launch point above the landing ground |
| g | Gravitational field strength g | m/s² | 1 | 25 | 0.1 | 9.8 | Moon 1.6, Mars 3.7, Jupiter 24.8 |
| drag | Air resistance | | | | | none | enum: `none` (None), `linear` (F = kv), `quadratic` (F = kv²); segmented |
| mass | Mass m | kg | 0.1 | 10 | 0.1 | 1 | `visibleWhen: { drag: ['linear', 'quadratic'] }` |
| k | Drag constant k | kg/s or kg/m | 0 | 0.5 | 0.005 | 0.02 | kg/s for kv, kg/m for kv²; drag force opposes velocity; `visibleWhen: { drag: ['linear', 'quadratic'] }` |
| showVelocity | Velocity vector | | | | | on | |
| showComponents | Velocity components | | | | | off | horizontal and vertical arrows |
| trail | Show path | | | | | on | |
| keepPaths | Keep earlier paths | | | | | on | up to 5 grey ghost paths, cleared by reset |
| showNoDragPath | Compare with no air resistance | | | | | on | dashed ideal parabola; `visibleWhen: { drag: ['linear', 'quadratic'] }` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Drag model: the drag force is −kv (linear) or −k|v|v (quadratic), so the acceleration is g downward plus that force divided by m.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | u 20, θ 45, h 0, g 9.8, drag none, velocity on, components off | the standard 45° launch: R = 40.8 m |
| me1-vectors | u 20, θ 30, h 0, g 9.8, drag none, velocity on, components on, keep paths off | Maths Ext 1 listing: the velocity vector and its components, with vₓ constant and v_y falling linearly |
| me2-drag | u 30, θ 45, h 0, g 9.8, drag quadratic, m 1, k 0.02, compare with no drag on | Maths Ext 2 listing: quadratic resistance, a = −g − (k/m)\|v\|v, with the ideal path for comparison |
| cliff | u 15, θ 0, h 20, g 9.8, drag none | horizontal launch from a 20 m cliff |
| moon | u 20, θ 45, h 0, g 1.6, drag none | same launch on the Moon: R = 250 m |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| flightTime | Time t | s | 3 |
| range | Horizontal distance x | m | 3 |
| maxHeight | Highest point H | m | 3 |
| currentSpeed | Speed \|v\| | m/s | 3 |
| vx | Horizontal velocity vₓ | m/s | 3 |
| vy | Vertical velocity v_y | m/s | 3 |

Definitions: while the projectile flies, `flightTime`, `range` and `maxHeight` show the values so far (elapsed time, horizontal displacement, and the greatest height above the ground reached so far). The run completes on landing (y = 0), with the landing time interpolated within the final step, and the readouts then hold the final time of flight, range and maximum height. `currentSpeed`, `vx` and `vy` are the current values (at landing, the impact velocity). Up is positive for `vy`.

## Assumptions shown on stage
- Point mass; no spin; flat landing ground at y = 0
- g = 9.8 m/s² downward, uniform (shows the current g)
- "No air resistance" when drag is none; otherwise "Air resistance F = kv" or "F = kv²", opposing the velocity
- Launch height h above the landing ground

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with no air resistance, which launch angle gives the greatest range? Test three angles to check.
2. Observe: launch at 30°, then at 60°, with "Keep earlier paths" on. Compare the ranges, maximum heights and flight times.
3. Explain: turn on the velocity components and watch vₓ during the flight. Why does it never change, while v_y falls by 9.8 m/s every second?
4. Predict: a ball is launched horizontally from a 20 m cliff at 15 m/s (the `cliff` preset). Will it land sooner or later than a ball simply dropped from the same cliff? Run it and compare the flight time with √(2h/g).
5. Explain: switch on quadratic air resistance. Why is the path no longer symmetric, and why is the best angle now less than 45°?

## Teacher notes outline
- **Misconceptions to target:** the velocity is zero at the top (only v_y is); a horizontal "force of the throw" keeps acting after launch; heavier objects fall faster (no drag: mass does not matter); 45° is always best (not from a height, and not with drag); the horizontal and vertical motions affect each other.
- **10-minute lesson flow:** (1) predict the best angle, test 30°, 45°, 60° (3 min); (2) components on: vₓ constant, v_y linear in time, zero at the top (2 min); (3) `cliff` preset: horizontal launch, compare with dropping (2 min); (4) `me2-drag` preset or drag on: path shortens and becomes asymmetric; discuss what the model leaves out (3 min).
- **Original HSC-style question idea:** A ball is kicked from the edge of a platform 12.0 m above level ground at 18.0 m/s, 35° above the horizontal. Ignoring air resistance and taking g = 9.8 m/s², calculate (a) its maximum height above the ground (17.4 m), (b) its time of flight (2.94 s), and (c) its range (43.3 m). (d) Explain qualitatively how air resistance would change the range and the angle for maximum range. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Vectors are distinguished by label and position as well as colour: v (orange, thick, along the path), vₓ (blue, horizontal), v_y (green, vertical), each with a text label including its value. Ghost paths are thin grey with an angle label; the current path is thick orange. The no-drag comparison path is dashed.
- Keyboard: all parameters are sliders with number entry; Space plays or pauses, `.` steps, R resets (shell shortcuts).
- Stage `aria-label` (from `describe()`): "Projectile launched at 20.0 metres per second, 45 degrees above the horizontal, from ground level, g = 9.8. No air resistance. Time 1.20 seconds, horizontal distance 17.0 metres, height 9.92 metres." After landing: "Landed after 2.89 seconds at 40.8 metres; highest point 10.2 metres."

## Engine change requests
- **Keys to reconcile with engine meta** (the `particle2d` meta was not published when this spec was written): params `speed`, `angle`, `height`, `g`, `drag`, `mass`, `k`, `showVelocity`, `showComponents`, `trail`, `keepPaths`, `showNoDragPath`, `timeScale`; outputs `flightTime`, `range`, `maxHeight`, `currentSpeed`, `vx`, `vy`. `speed`, `angle`, `drag`, `k`, `g`, `trail`, `showComponents`, `range`, `maxHeight` and `flightTime` follow the examples in guide §5.1 and §5.2.
- The landing is interpolated within the final step, so the final `flightTime`, `range`, `currentSpeed`, `vx` and `vy` are the values at y = 0 exactly.
- `keepPaths` (ghost paths) and `showNoDragPath` (analytic dashed parabola) are view features of the `projectile` setup.
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here. With no drag: uₓ = u cos θ, u_y = u sin θ; time of flight T solves h + u_y T − ½gT² = 0, so T = (u_y + √(u_y² + 2gh))/g; range R = uₓT; maximum height H = h + u_y²/(2g); landing v_y = u_y − gT. RK4 is exact for constant acceleration, so the no-drag tolerances only allow for the landing interpolation. The particle2d time step is 1/240 s (guide §9.1).

- **Check 1, default 45°.** u = 20, θ = 45°, h = 0, g = 9.8. T = 2u sin θ/g = 2 × 20 × 0.707107/9.8 = **2.88615 s**. R = u² sin 2θ/g = 400 × 1/9.8 = **40.8163 m**. H = u² sin²θ/(2g) = 400 × 0.5/19.6 = **10.2041 m**. Landing speed = launch speed = **20 m/s** (energy, same height); v_y = −20 sin 45° = **−14.1421 m/s**.
- **Check 2, complementary angles.** θ = 30°: R = 400 sin 60°/9.8 = 400 × 0.866025/9.8 = **35.3480 m**, H = 400 × 0.25/19.6 = **5.10204 m**. θ = 60°: R = 400 sin 120°/9.8 = **35.3480 m** (same), H = 400 × 0.75/19.6 = **15.3061 m**.
- **Check 3, horizontal launch from a cliff.** u = 15, θ = 0, h = 20. T = √(2h/g) = √(40/9.8) = √4.08163 = **2.02031 s**. R = 15 × 2.02031 = **30.3046 m**. vₓ = **15 m/s**; v_y = −gT = −√(2gh) = −√392 = **−19.7990 m/s**; speed = √(15² + 392) = √617 = **24.8395 m/s**.
- **Check 4, angled launch from 10 m.** u = 20, θ = 30°, h = 10: u_y = 10, uₓ = 17.3205. T = (10 + √(100 + 2 × 9.8 × 10))/9.8 = (10 + √296)/9.8 = (10 + 17.2047)/9.8 = **2.77598 s**. R = 17.3205 × 2.77598 = **48.0815 m**. H = 10 + 10²/19.6 = **15.1020 m**.
- **Check 5, the Moon.** u = 20, θ = 45°, g = 1.6: R = 400/1.6 = **250 m**; T = 2 × 20 × 0.707107/1.6 = **17.6777 s**.
- **Check 6, after 240 steps (t = 1 s).** u = 20, θ = 30°, h = 0, g = 9.8. 240 × (1/240) s = **1 s**. x = 17.3205 × 1 = **17.3205 m**. y = 10 × 1 − 4.9 × 1² = **5.1 m**; the peak is at t = 10/9.8 = 1.0204 s, so the highest point so far is y(1) = **5.1 m**. v_y = 10 − 9.8 = **0.2 m/s**.
- **Check 7, `me1-vectors` preset after one step.** u = 20, θ = 30°: vₓ = 20 cos 30° = **17.3205 m/s** (constant). After one step, t = 1/240 s: v_y = 20 sin 30° − 9.8/240 = 10 − 0.0408333 = **9.95917 m/s**.
- **Check 8, linear drag.** m = 1, k = 0.1, u = 20, θ = 45°, so c = k/m = 0.1 s⁻¹ and uₓ = u_y = 14.1421. Solving m dv/dt = mg − kv in each direction: x(t) = (uₓ/c)(1 − e^(−ct)), y(t) = (1/c)(u_y + g/c)(1 − e^(−ct)) − (g/c)t.
  Highest point: v_y = 0 at t = ln(1 + c u_y/g)/c = ln(1.144308)/0.1 = 1.34800 s, giving H = u_y/c − (g/c²) ln(1 + c u_y/g) = 141.421 − 980 × 0.134800 = **9.31769 m**.
  Landing: y(T) = 0 has no closed form; Newton's method from T₀ = 2u_y/g = 2.886 s gives T = **2.75941 s** (check: 1 − e^(−0.275941) = 0.241142, and 10 × (14.1421 + 98) × 0.241142 = 270.422 = 98 × 2.75941 ✓). R = (uₓ/c)(1 − e^(−cT)) = 141.421 × 0.241142 = **34.1026 m**.
- **Check 9, mass and k scale together.** m = 2, k = 0.2: c = k/m = 0.1 s⁻¹ is unchanged, so the path is identical to Check 8: R = **34.1026 m**.
- **Check 10, `me2-drag` preset launched vertically.** m = 1, k = 0.02, u = 30, θ = 90°, quadratic drag. Terminal speed V = √(mg/k) = √490 = 22.1359 m/s.
  Up: dv/dt = −g(1 + v²/V²) gives H = (V²/2g) ln(1 + u²/V²) = 25 × ln(1 + 900/490) = 25 × ln 2.836735 = **26.0663 m**, reached at t_up = (V/g) atan(u/V) = 2.25877 × atan(1.355262) = 2.25877 × 0.935107 = 2.11219 s.
  Down: from rest, dv/dt = g(1 − v²/V²) gives y fallen = (V²/g) ln cosh(gt/V), so t_down = (V/g) acosh(e^(gH/V²)) = 2.25877 × acosh(√2.836735) = 2.25877 × acosh(1.684261) = 2.25877 × 1.111701 = 2.51108 s.
  Flight time T = 2.11219 + 2.51108 = **4.62327 s**. Impact speed from 1/v² = 1/u² + 1/V²: v = uV/√(u² + V²) = 30 × 22.1359/√1390 = **17.8120 m/s**. Range **0 m** (vertical launch).

```acceptance
[
  { "name": "default 45°: range, height, time", "params": { "speed": 20, "angle": 45, "height": 0, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 40.8163, "relTol": 0.001 }, "maxHeight": { "value": 10.2041, "relTol": 0.001 }, "flightTime": { "value": 2.88615, "relTol": 0.001 }, "currentSpeed": { "value": 20, "relTol": 0.001 }, "vy": { "value": -14.1421, "relTol": 0.001 } } },
  { "name": "30° range and height", "params": { "speed": 20, "angle": 30, "height": 0, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 35.3480, "relTol": 0.001 }, "maxHeight": { "value": 5.10204, "relTol": 0.001 } } },
  { "name": "60° gives the same range", "params": { "speed": 20, "angle": 60, "height": 0, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 35.3480, "relTol": 0.001 }, "maxHeight": { "value": 15.3061, "relTol": 0.001 } } },
  { "name": "horizontal launch from a 20 m cliff", "preset": "cliff", "params": { "speed": 15, "angle": 0, "height": 20, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "flightTime": { "value": 2.02031, "relTol": 0.001 }, "range": { "value": 30.3046, "relTol": 0.001 }, "vx": { "value": 15, "relTol": 1e-6 }, "vy": { "value": -19.7990, "relTol": 0.001 }, "currentSpeed": { "value": 24.8395, "relTol": 0.001 } } },
  { "name": "30° launch from 10 m", "params": { "speed": 20, "angle": 30, "height": 10, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "flightTime": { "value": 2.77598, "relTol": 0.001 }, "range": { "value": 48.0815, "relTol": 0.001 }, "maxHeight": { "value": 15.1020, "relTol": 0.001 } } },
  { "name": "the Moon, g = 1.6", "preset": "moon", "params": { "speed": 20, "angle": 45, "height": 0, "g": 1.6, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 250, "relTol": 0.001 }, "flightTime": { "value": 17.6777, "relTol": 0.001 } } },
  { "name": "after 240 steps (t = 1 s)", "params": { "speed": 20, "angle": 30, "height": 0, "g": 9.8, "drag": "none" }, "run": { "steps": 240 },
    "expect": { "flightTime": { "value": 1, "absTol": 1e-9 }, "range": { "value": 17.3205, "relTol": 1e-5 }, "maxHeight": { "value": 5.1, "relTol": 1e-5 }, "vy": { "value": 0.2, "absTol": 1e-6 } } },
  { "name": "me1-vectors preset: components after one step", "preset": "me1-vectors", "params": {}, "run": { "steps": 1 },
    "expect": { "vx": { "value": 17.3205, "relTol": 1e-5 }, "vy": { "value": 9.95917, "relTol": 1e-5 } } },
  { "name": "linear drag m 1, k 0.1", "params": { "speed": 20, "angle": 45, "height": 0, "g": 9.8, "drag": "linear", "mass": 1, "k": 0.1 }, "run": "complete",
    "expect": { "maxHeight": { "value": 9.31769, "relTol": 0.001 }, "flightTime": { "value": 2.75941, "relTol": 0.001 }, "range": { "value": 34.1026, "relTol": 0.001 } } },
  { "name": "linear drag m 2, k 0.2 gives the same path", "params": { "speed": 20, "angle": 45, "height": 0, "g": 9.8, "drag": "linear", "mass": 2, "k": 0.2 }, "run": "complete",
    "expect": { "range": { "value": 34.1026, "relTol": 0.001 } } },
  { "name": "me2-drag preset launched vertically", "preset": "me2-drag", "params": { "speed": 30, "angle": 90, "height": 0, "g": 9.8, "drag": "quadratic", "mass": 1, "k": 0.02 }, "run": "complete",
    "expect": { "maxHeight": { "value": 26.0663, "relTol": 0.001 }, "flightTime": { "value": 4.62327, "relTol": 0.001 }, "currentSpeed": { "value": 17.8120, "relTol": 0.001 }, "range": { "value": 0, "absTol": 1e-6 } } }
]
```
