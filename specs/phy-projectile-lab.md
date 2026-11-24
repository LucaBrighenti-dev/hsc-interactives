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

Syllabus fit: 2017 Module 5 Advanced Mechanics (projectile motion); 2025 Year 12 focus area Advanced mechanics. The same page serves Mathematics Extension 1 (2024, Introduction to vectors: motion as a vector function of time, through the `me1-vectors` preset) and Mathematics Extension 2 (2024, Applications of calculus to mechanics: resisted motion, through the `me2-drag` preset, which uses resistance proportional to velocity because that case has a closed-form solution students can check by hand; quadratic resistance stays available as an option).

## What the student sees
Default view at 1920×1080, projector theme (the `particle2d` engine's projectile view):

- **Stage:** side view with ground at y = 0, labelled axes x (m) and y (m) with a grid, scaled to fit the whole predicted path before launch. A launch point at (0, h), raised on a platform when h > 0, with the launch angle marked.
- **Projectile:** a disc with its path traced behind it.
- **Vectors:** the velocity vector v labelled with its value; with components on, the horizontal and vertical components drawn from the projectile with construction lines (the vₓ arrow keeps the same length all flight when there is no drag).
- **Events:** the highest point and the landing point are marked and labelled with their values once reached.
- **Drag mode:** the ideal no-drag path is drawn dashed for comparison when "Compare with no air resistance" is on.
- **Footer:** the assumptions list, including the current g.

## Parameters
Keys and ranges are the `particle2d` engine's `meta.params` for `projectile` (branch `w1/engine-particle2d`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| speed | Launch speed v | m/s | 0 | 60 | 0.5 | 20 | |
| angle | Launch angle θ | ° | −90 | 90 | 1 | 45 | from the horizontal; negative launches downward |
| height | Launch height | m | 0 | 100 | 0.5 | 0 | above the landing ground |
| g | Gravitational field g | m/s² | 1 | 25 | 0.1 | 9.8 | Moon 1.6, Mars 3.7, Jupiter 24.8 |
| drag | Air resistance | | | | | none | enum: `none`, `linear` (kv), `quadratic` (kv²) |
| k | Drag coefficient k | | 0.001 | 2 | 0.001 | 0.1 | kg/s for kv, kg/m for kv²; shown when drag is on |
| mass | Mass m | kg | 0.1 | 10 | 0.1 | 1 | |
| showVelocity | Velocity vector | | | | | on | |
| showComponents | Velocity components | | | | | off | |
| showNoDrag | Compare with no air resistance | | | | | on | shown when drag is on |
| trail | Show trail | | | | | on | |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Page controls, in order: `speed`, `angle`, `height`, `g`, `drag`, `k`, `mass`, `showVelocity`, `showComponents`, `showNoDrag`, `trail`.

Drag model: the drag force is −kv (linear) or −k|v|v (quadratic), so the acceleration is g downward plus that force divided by m.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | v 20, θ 45, h 0, g 9.8, drag none, velocity on, components off | the standard 45° launch: R = 40.8 m |
| me1-vectors | v 20, θ 30, h 0, g 9.8, drag none, velocity on, components on | Maths Ext 1 listing: the velocity vector and its components, with vₓ constant and v_y falling linearly |
| me2-drag | v 30, θ 45, h 0, g 9.8, drag linear, k 0.2, m 1, compare with no drag on | Maths Ext 2 listing: resistance kv, so a = −(k/m)v − g ĵ has closed-form solutions (terminal speed 49 m/s, greatest height 17.9 m, range 56.9 m against 91.8 m without drag) |
| quadratic-drag | v 30, θ 45, h 0, g 9.8, drag quadratic, k 0.02, m 1, compare with no drag on | resistance kv², closer to real air drag at these speeds; the vertical launch has a closed form |
| cliff | v 15, θ 0, h 20, g 9.8, drag none | horizontal launch from a 20 m cliff |
| moon | v 20, θ 45, h 0, g 1.6, drag none | the same launch on the Moon: R = 250 m |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| range | Range | m | 3 |
| maxHeight | Maximum height | m | 3 |
| flightTime | Time of flight | s | 3 |
| impactSpeed | Impact speed | m/s | 3 |
| vx | Velocity vx | m/s | 3 |
| vy | Velocity vy | m/s | 3 |

Definitions (the engine's outputs): `range`, `flightTime`, `impactSpeed` and `impactAngle` (° below the horizontal) appear when the projectile lands (— before); `maxHeight` and `timeToApex` appear when it reaches its highest point. `x`, `y`, `vx`, `vy`, `speed` and `t` are the current values; up is positive. The landing and the apex are found inside the step (interpolated, then an exact RK4 sub-step), so the final values are those at y = 0 exactly.

## Assumptions shown on stage
- Point mass; no spin; flat landing ground at y = 0
- g = 9.8 m/s² downward, uniform (shows the current g)
- "No air resistance" when drag is none; otherwise "Air resistance F = kv" or "F = kv²", opposing the velocity
- Launch height above the landing ground

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with no air resistance, which launch angle gives the greatest range? Test three angles to check.
2. Observe: launch at 30°, then at 60°. Compare the ranges, maximum heights and flight times.
3. Explain: turn on the velocity components and watch vₓ during the flight. Why does it never change, while v_y falls by 9.8 m/s every second?
4. Predict: a ball is launched horizontally from a 20 m cliff at 15 m/s (the `cliff` preset). Will it land sooner or later than a ball simply dropped from the same cliff? Run it and compare the flight time with √(2h/g).
5. Explain: load `me2-drag` (resistance kv), then `quadratic-drag` (kv²). Why is the path no longer symmetric, and why is the best angle now less than 45°?

## Teacher notes outline
- **Misconceptions to target:** the velocity is zero at the top (only v_y is); a horizontal "force of the throw" keeps acting after launch; heavier objects fall faster (no drag: mass does not matter); 45° is always best (not from a height, and not with drag); the horizontal and vertical motions affect each other.
- **10-minute lesson flow:** (1) predict the best angle, test 30°, 45°, 60° (3 min); (2) components on: vₓ constant, v_y linear in time, zero at the top (2 min); (3) `cliff` preset: horizontal launch, compare with dropping (2 min); (4) `me2-drag` preset (kv): path shortens and becomes asymmetric; check the greatest height against the closed form; compare `quadratic-drag`; discuss what each model leaves out (3 min).
- **Original HSC-style question idea:** A ball is kicked from the edge of a platform 12.0 m above level ground at 18.0 m/s, 35° above the horizontal. Ignoring air resistance and taking g = 9.8 m/s², calculate (a) its maximum height above the ground (17.4 m), (b) its time of flight (2.94 s), and (c) its range (43.3 m). (d) Explain qualitatively how air resistance would change the range and the angle for maximum range. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Vectors are distinguished by label and position as well as colour: v along the path, vₓ horizontal, v_y vertical, each with a text label including its value. The no-drag comparison path is dashed; the actual path is solid.
- Keyboard: all parameters are sliders with number entry; Space plays or pauses, `.` steps, R resets (shell shortcuts).
- Stage `aria-label`: the engine's `describe()` sentence, for example "Projectile launched at 20 metres per second, 45 degrees above the horizontal, from ground level, g = 9.8, no air resistance", followed by the landing values once it lands.

## Engine change requests
- Every key used here exists in the `particle2d` engine's meta on `w1/engine-particle2d`.
- **Listing card wording (catalogue, owned by this page's builder):** the `me2-projectile-drag` listing's summary in `site/catalog/me2-projectile-drag.json` and `docs/backlog.json` says "quadratic air resistance"; it must say linear (kv) air resistance, because the `me2-drag` preset is linear drag with closed-form answers.
- Optional, for a later engine version: keep up to five earlier paths as faint ghost lines, so complementary angles can be compared on one picture (prompt 2 works without it by reading the values).

## Acceptance
Every number below comes from the formula and hand calculation shown here. With no drag: uₓ = v cos θ, u_y = v sin θ; time of flight T solves h + u_y T − ½gT² = 0, so T = (u_y + √(u_y² + 2gh))/g; range R = uₓT; maximum height H = h + u_y²/(2g) at t = u_y/g; landing v_y = u_y − gT. RK4 is exact for constant acceleration, so the no-drag tolerances only allow for the event location. The time step is 1/240 s (guide §9.1).

- **Check 1, default 45°.** v = 20, θ = 45°, h = 0, g = 9.8. T = 2v sin θ/g = 2 × 20 × 0.707107/9.8 = **2.88615 s**. R = v² sin 2θ/g = 400/9.8 = **40.8163 m**. H = v² sin²θ/(2g) = 400 × 0.5/19.6 = **10.2041 m**, at t = 14.1421/9.8 = **1.44308 s**. Impact speed = launch speed = **20 m/s** (same height); landing v_y = **−14.1421 m/s**.
- **Check 2, complementary angles.** θ = 30°: R = 400 sin 60°/9.8 = 400 × 0.866025/9.8 = **35.3480 m**, H = 400 × 0.25/19.6 = **5.10204 m**. θ = 60°: R = 400 sin 120°/9.8 = **35.3480 m** (same), H = 400 × 0.75/19.6 = **15.3061 m**.
- **Check 3, horizontal launch from a cliff (`cliff`).** v = 15, θ = 0, h = 20. T = √(2h/g) = √(40/9.8) = √4.08163 = **2.02031 s**. R = 15 × 2.02031 = **30.3046 m**. vₓ = **15 m/s**; v_y = −√(2gh) = −√392 = **−19.7990 m/s**; impact speed √(225 + 392) = √617 = **24.8395 m/s**.
- **Check 4, angled launch from 10 m.** v = 20, θ = 30°, h = 10: u_y = 10, uₓ = 17.3205. T = (10 + √(100 + 196))/9.8 = (10 + 17.2047)/9.8 = **2.77598 s**. R = 17.3205 × 2.77598 = **48.0815 m**. H = 10 + 100/19.6 = **15.1020 m**.
- **Check 5, the Moon (`moon`).** v = 20, θ = 45°, g = 1.6: R = 400/1.6 = **250 m**; T = 2 × 14.1421/1.6 = **17.6777 s**.
- **Check 6, after 240 steps (t = 1 s).** v = 20, θ = 30°, h = 0, g = 9.8: t = 240/240 = **1 s**; x = 17.3205 × 1 = **17.3205 m**; y = 10 × 1 − 4.9 × 1² = **5.1 m**; v_y = 10 − 9.8 = **0.2 m/s** (still rising: the apex is at 1.0204 s).
- **Check 7, `me1-vectors` after one step.** v = 20, θ = 30°: vₓ = 20 cos 30° = **17.3205 m/s** (constant). After one step, t = 1/240 s: v_y = 10 − 9.8/240 = 10 − 0.0408333 = **9.95917 m/s**.
- **Check 8, linear drag.** m = 1, k = 0.1, v = 20, θ = 45°, so c = k/m = 0.1 s⁻¹ and uₓ = u_y = 14.1421. Solving m dv/dt = mg − kv in each direction: x(t) = (uₓ/c)(1 − e^(−ct)), y(t) = (1/c)(u_y + g/c)(1 − e^(−ct)) − (g/c)t.
  Highest point: v_y = 0 at t = ln(1 + c u_y/g)/c = ln(1.144308)/0.1 = 1.34800 s, giving H = u_y/c − (g/c²) ln(1 + c u_y/g) = 141.421 − 980 × 0.134800 = **9.31769 m**.
  Landing: y(T) = 0 has no closed form; Newton's method from T₀ = 2u_y/g = 2.886 s gives T = **2.75941 s** (check: 1 − e^(−0.275941) = 0.241142, and 10 × (14.1421 + 98) × 0.241142 = 270.422 = 98 × 2.75941 ✓). R = (uₓ/c)(1 − e^(−cT)) = 141.421 × 0.241142 = **34.1026 m**.
- **Check 9, mass and k scale together.** m = 2, k = 0.2: c = k/m = 0.1 s⁻¹ is unchanged, so the path is identical to Check 8: R = **34.1026 m**.
- **Check 10, `me2-drag` (linear drag, the Ext 2 case).** m = 1, k = 0.2, v = 30, θ = 45°, so c = 0.2 s⁻¹ and uₓ = u_y = 21.2132 m/s. Terminal speed mg/k = 9.8/0.2 = 49 m/s. Using the solutions from Check 8:
  Highest point at t = ln(1 + 0.2 × 21.2132/9.8)/0.2 = ln(1.432923)/0.2 = 0.359716/0.2 = **1.79858 s**, with H = u_y/c − (g/c²) ln(1 + c u_y/g) = 106.066 − 245 × 0.359716 = 106.066 − 88.1304 = **17.9356 m** (22.96 m without drag).
  Landing: Newton's method on y(T) = 0 from T₀ = 2u_y/g = 4.33 s gives T = **3.84197 s** (check: 1 − e^(−0.768395) = 0.536243, and 5 × (21.2132 + 49) × 0.536243 = 188.257 = 49 × 3.84197 ✓). R = (uₓ/c)(1 − e^(−cT)) = 106.066 × 0.536243 = **56.8772 m** (91.84 m without drag; the horizontal asymptote is uₓ/c = 106.066 m). Landing velocity: vₓ = uₓe^(−cT) = 21.2132 × 0.463757 = **9.83777 m/s**; v_y = (u_y + g/c)e^(−cT) − g/c = 70.2132 × 0.463757 − 49 = **−16.4381 m/s**.
- **Check 11, `quadratic-drag` launched vertically.** m = 1, k = 0.02, v = 30, θ = 90°, quadratic drag. Terminal speed V = √(mg/k) = √490 = 22.1359 m/s.
  Up: dv/dt = −g(1 + v²/V²) gives H = (V²/2g) ln(1 + v²/V²) = 25 × ln(1 + 900/490) = 25 × ln 2.836735 = **26.0663 m**, reached at t_up = (V/g) atan(v/V) = 2.25877 × atan(1.355262) = 2.25877 × 0.935107 = **2.11219 s**.
  Down: from rest, dv/dt = g(1 − v²/V²) gives y fallen = (V²/g) ln cosh(gt/V), so t_down = (V/g) acosh(e^(gH/V²)) = 2.25877 × acosh(√2.836735) = 2.25877 × acosh(1.684261) = 2.25877 × 1.111701 = 2.51108 s.
  Flight time T = 2.11219 + 2.51108 = **4.62327 s**. Impact speed from 1/v_f² = 1/v² + 1/V²: v_f = vV/√(v² + V²) = 30 × 22.1359/√1390 = **17.8120 m/s**. Range **0 m** (vertical launch: the engine's cos 90° is exactly 0).

```acceptance
[
  { "name": "default 45°: range, height, time", "preset": "default", "params": { "speed": 20, "angle": 45, "height": 0, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 40.8163, "relTol": 0.001 }, "maxHeight": { "value": 10.2041, "relTol": 0.001 }, "timeToApex": { "value": 1.44308, "relTol": 0.001 }, "flightTime": { "value": 2.88615, "relTol": 0.001 }, "impactSpeed": { "value": 20, "relTol": 0.001 }, "vy": { "value": -14.1421, "relTol": 0.001 } } },
  { "name": "30° range and height", "params": { "speed": 20, "angle": 30, "height": 0, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 35.3480, "relTol": 0.001 }, "maxHeight": { "value": 5.10204, "relTol": 0.001 } } },
  { "name": "60° gives the same range", "params": { "speed": 20, "angle": 60, "height": 0, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 35.3480, "relTol": 0.001 }, "maxHeight": { "value": 15.3061, "relTol": 0.001 } } },
  { "name": "horizontal launch from a 20 m cliff", "preset": "cliff", "params": { "speed": 15, "angle": 0, "height": 20, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "flightTime": { "value": 2.02031, "relTol": 0.001 }, "range": { "value": 30.3046, "relTol": 0.001 }, "vx": { "value": 15, "relTol": 1e-6 }, "vy": { "value": -19.7990, "relTol": 0.001 }, "impactSpeed": { "value": 24.8395, "relTol": 0.001 } } },
  { "name": "30° launch from 10 m", "params": { "speed": 20, "angle": 30, "height": 10, "g": 9.8, "drag": "none" }, "run": "complete",
    "expect": { "flightTime": { "value": 2.77598, "relTol": 0.001 }, "range": { "value": 48.0815, "relTol": 0.001 }, "maxHeight": { "value": 15.1020, "relTol": 0.001 } } },
  { "name": "the Moon, g = 1.6", "preset": "moon", "params": { "speed": 20, "angle": 45, "height": 0, "g": 1.6, "drag": "none" }, "run": "complete",
    "expect": { "range": { "value": 250, "relTol": 0.001 }, "flightTime": { "value": 17.6777, "relTol": 0.001 } } },
  { "name": "after 240 steps (t = 1 s)", "params": { "speed": 20, "angle": 30, "height": 0, "g": 9.8, "drag": "none" }, "run": { "steps": 240 },
    "expect": { "t": { "value": 1, "absTol": 1e-9 }, "x": { "value": 17.3205, "relTol": 1e-5 }, "y": { "value": 5.1, "relTol": 1e-5 }, "vy": { "value": 0.2, "absTol": 1e-6 } } },
  { "name": "me1-vectors preset: components after one step", "preset": "me1-vectors", "params": {}, "run": { "steps": 1 },
    "expect": { "vx": { "value": 17.3205, "relTol": 1e-5 }, "vy": { "value": 9.95917, "relTol": 1e-5 } } },
  { "name": "linear drag m 1, k 0.1", "params": { "speed": 20, "angle": 45, "height": 0, "g": 9.8, "drag": "linear", "mass": 1, "k": 0.1 }, "run": "complete",
    "expect": { "maxHeight": { "value": 9.31769, "relTol": 0.001 }, "flightTime": { "value": 2.75941, "relTol": 0.001 }, "range": { "value": 34.1026, "relTol": 0.001 } } },
  { "name": "linear drag m 2, k 0.2 gives the same path", "params": { "speed": 20, "angle": 45, "height": 0, "g": 9.8, "drag": "linear", "mass": 2, "k": 0.2 }, "run": "complete",
    "expect": { "range": { "value": 34.1026, "relTol": 0.001 } } },
  { "name": "me2-drag preset: linear drag in closed form", "preset": "me2-drag", "params": {}, "run": "complete",
    "expect": { "timeToApex": { "value": 1.79858, "relTol": 0.001 }, "maxHeight": { "value": 17.9356, "relTol": 0.001 }, "flightTime": { "value": 3.84197, "relTol": 0.001 }, "range": { "value": 56.8772, "relTol": 0.001 }, "vx": { "value": 9.83777, "relTol": 0.001 }, "vy": { "value": -16.4381, "relTol": 0.001 } } },
  { "name": "quadratic-drag preset launched vertically", "preset": "quadratic-drag", "params": { "speed": 30, "angle": 90, "height": 0, "g": 9.8, "drag": "quadratic", "mass": 1, "k": 0.02 }, "run": "complete",
    "expect": { "maxHeight": { "value": 26.0663, "relTol": 0.001 }, "timeToApex": { "value": 2.11219, "relTol": 0.001 }, "flightTime": { "value": 4.62327, "relTol": 0.001 }, "impactSpeed": { "value": 17.8120, "relTol": 0.001 }, "range": { "value": 0, "absTol": 1e-6 } } }
]
```
